/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Platform, normalizePassiveListenerOptions, _getShadowRoot } from '@angular/cdk/platform';
import { Directive, ElementRef, EventEmitter, Inject, Injectable, InjectionToken, NgZone, Optional, Output, } from '@angular/core';
import { of as observableOf, Subject } from 'rxjs';
import { coerceElement } from '@angular/cdk/coercion';
import { DOCUMENT } from '@angular/common';
import { isFakeMousedownFromScreenReader } from '../fake-mousedown';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
import * as i2 from "@angular/common";
// This is the value used by AngularJS Material. Through trial and error (on iPhone 6S) they found
// that a value of around 650ms seems appropriate.
export const TOUCH_BUFFER_MS = 650;
/** InjectionToken for FocusMonitorOptions. */
export const FOCUS_MONITOR_DEFAULT_OPTIONS = new InjectionToken('cdk-focus-monitor-default-options');
/**
 * Event listener options that enable capturing and also
 * mark the listener as passive if the browser supports it.
 */
const captureEventListenerOptions = normalizePassiveListenerOptions({
    passive: true,
    capture: true
});
/** Monitors mouse and keyboard events to determine the cause of focus events. */
export class FocusMonitor {
    constructor(_ngZone, _platform, 
    /** @breaking-change 11.0.0 make document required */
    document, options) {
        this._ngZone = _ngZone;
        this._platform = _platform;
        /** The focus origin that the next focus event is a result of. */
        this._origin = null;
        /** Whether the window has just been focused. */
        this._windowFocused = false;
        /** Map of elements being monitored to their info. */
        this._elementInfo = new Map();
        /** The number of elements currently being monitored. */
        this._monitoredElementCount = 0;
        /**
         * Keeps track of the root nodes to which we've currently bound a focus/blur handler,
         * as well as the number of monitored elements that they contain. We have to treat focus/blur
         * handlers differently from the rest of the events, because the browser won't emit events
         * to the document when focus moves inside of a shadow root.
         */
        this._rootNodeFocusListenerCount = new Map();
        /**
         * Event listener for `keydown` events on the document.
         * Needs to be an arrow function in order to preserve the context when it gets bound.
         */
        this._documentKeydownListener = () => {
            // On keydown record the origin and clear any touch event that may be in progress.
            this._lastTouchTarget = null;
            this._setOriginForCurrentEventQueue('keyboard');
        };
        /**
         * Event listener for `mousedown` events on the document.
         * Needs to be an arrow function in order to preserve the context when it gets bound.
         */
        this._documentMousedownListener = (event) => {
            // On mousedown record the origin only if there is not touch
            // target, since a mousedown can happen as a result of a touch event.
            if (!this._lastTouchTarget) {
                // In some cases screen readers fire fake `mousedown` events instead of `keydown`.
                // Resolve the focus source to `keyboard` if we detect one of them.
                const source = isFakeMousedownFromScreenReader(event) ? 'keyboard' : 'mouse';
                this._setOriginForCurrentEventQueue(source);
            }
        };
        /**
         * Event listener for `touchstart` events on the document.
         * Needs to be an arrow function in order to preserve the context when it gets bound.
         */
        this._documentTouchstartListener = (event) => {
            // When the touchstart event fires the focus event is not yet in the event queue. This means
            // we can't rely on the trick used above (setting timeout of 1ms). Instead we wait 650ms to
            // see if a focus happens.
            if (this._touchTimeoutId != null) {
                clearTimeout(this._touchTimeoutId);
            }
            this._lastTouchTarget = getTarget(event);
            this._touchTimeoutId = setTimeout(() => this._lastTouchTarget = null, TOUCH_BUFFER_MS);
        };
        /**
         * Event listener for `focus` events on the window.
         * Needs to be an arrow function in order to preserve the context when it gets bound.
         */
        this._windowFocusListener = () => {
            // Make a note of when the window regains focus, so we can
            // restore the origin info for the focused element.
            this._windowFocused = true;
            this._windowFocusTimeoutId = setTimeout(() => this._windowFocused = false);
        };
        /**
         * Event listener for `focus` and 'blur' events on the document.
         * Needs to be an arrow function in order to preserve the context when it gets bound.
         */
        this._rootNodeFocusAndBlurListener = (event) => {
            const target = getTarget(event);
            const handler = event.type === 'focus' ? this._onFocus : this._onBlur;
            // We need to walk up the ancestor chain in order to support `checkChildren`.
            for (let element = target; element; element = element.parentElement) {
                handler.call(this, event, element);
            }
        };
        this._document = document;
        this._detectionMode = (options === null || options === void 0 ? void 0 : options.detectionMode) || 0 /* IMMEDIATE */;
    }
    monitor(element, checkChildren = false) {
        const nativeElement = coerceElement(element);
        // Do nothing if we're not on the browser platform or the passed in node isn't an element.
        if (!this._platform.isBrowser || nativeElement.nodeType !== 1) {
            return observableOf(null);
        }
        // If the element is inside the shadow DOM, we need to bind our focus/blur listeners to
        // the shadow root, rather than the `document`, because the browser won't emit focus events
        // to the `document`, if focus is moving within the same shadow root.
        const rootNode = _getShadowRoot(nativeElement) || this._getDocument();
        const cachedInfo = this._elementInfo.get(nativeElement);
        // Check if we're already monitoring this element.
        if (cachedInfo) {
            if (checkChildren) {
                // TODO(COMP-318): this can be problematic, because it'll turn all non-checkChildren
                // observers into ones that behave as if `checkChildren` was turned on. We need a more
                // robust solution.
                cachedInfo.checkChildren = true;
            }
            return cachedInfo.subject;
        }
        // Create monitored element info.
        const info = {
            checkChildren: checkChildren,
            subject: new Subject(),
            rootNode
        };
        this._elementInfo.set(nativeElement, info);
        this._registerGlobalListeners(info);
        return info.subject;
    }
    stopMonitoring(element) {
        const nativeElement = coerceElement(element);
        const elementInfo = this._elementInfo.get(nativeElement);
        if (elementInfo) {
            elementInfo.subject.complete();
            this._setClasses(nativeElement);
            this._elementInfo.delete(nativeElement);
            this._removeGlobalListeners(elementInfo);
        }
    }
    focusVia(element, origin, options) {
        const nativeElement = coerceElement(element);
        const focusedElement = this._getDocument().activeElement;
        // If the element is focused already, calling `focus` again won't trigger the event listener
        // which means that the focus classes won't be updated. If that's the case, update the classes
        // directly without waiting for an event.
        if (nativeElement === focusedElement) {
            this._getClosestElementsInfo(nativeElement)
                .forEach(([currentElement, info]) => this._originChanged(currentElement, origin, info));
        }
        else {
            this._setOriginForCurrentEventQueue(origin);
            // `focus` isn't available on the server
            if (typeof nativeElement.focus === 'function') {
                nativeElement.focus(options);
            }
        }
    }
    ngOnDestroy() {
        this._elementInfo.forEach((_info, element) => this.stopMonitoring(element));
    }
    /** Access injected document if available or fallback to global document reference */
    _getDocument() {
        return this._document || document;
    }
    /** Use defaultView of injected document if available or fallback to global window reference */
    _getWindow() {
        const doc = this._getDocument();
        return doc.defaultView || window;
    }
    _toggleClass(element, className, shouldSet) {
        if (shouldSet) {
            element.classList.add(className);
        }
        else {
            element.classList.remove(className);
        }
    }
    _getFocusOrigin(event) {
        // If we couldn't detect a cause for the focus event, it's due to one of three reasons:
        // 1) The window has just regained focus, in which case we want to restore the focused state of
        //    the element from before the window blurred.
        // 2) It was caused by a touch event, in which case we mark the origin as 'touch'.
        // 3) The element was programmatically focused, in which case we should mark the origin as
        //    'program'.
        if (this._origin) {
            return this._origin;
        }
        if (this._windowFocused && this._lastFocusOrigin) {
            return this._lastFocusOrigin;
        }
        else if (this._wasCausedByTouch(event)) {
            return 'touch';
        }
        else {
            return 'program';
        }
    }
    /**
     * Sets the focus classes on the element based on the given focus origin.
     * @param element The element to update the classes on.
     * @param origin The focus origin.
     */
    _setClasses(element, origin) {
        this._toggleClass(element, 'cdk-focused', !!origin);
        this._toggleClass(element, 'cdk-touch-focused', origin === 'touch');
        this._toggleClass(element, 'cdk-keyboard-focused', origin === 'keyboard');
        this._toggleClass(element, 'cdk-mouse-focused', origin === 'mouse');
        this._toggleClass(element, 'cdk-program-focused', origin === 'program');
    }
    /**
     * Sets the origin and schedules an async function to clear it at the end of the event queue.
     * If the detection mode is 'eventual', the origin is never cleared.
     * @param origin The origin to set.
     */
    _setOriginForCurrentEventQueue(origin) {
        this._ngZone.runOutsideAngular(() => {
            this._origin = origin;
            if (this._detectionMode === 0 /* IMMEDIATE */) {
                // Sometimes the focus origin won't be valid in Firefox because Firefox seems to focus *one*
                // tick after the interaction event fired. To ensure the focus origin is always correct,
                // the focus origin will be determined at the beginning of the next tick.
                this._originTimeoutId = setTimeout(() => this._origin = null, 1);
            }
        });
    }
    /**
     * Checks whether the given focus event was caused by a touchstart event.
     * @param event The focus event to check.
     * @returns Whether the event was caused by a touch.
     */
    _wasCausedByTouch(event) {
        // Note(mmalerba): This implementation is not quite perfect, there is a small edge case.
        // Consider the following dom structure:
        //
        // <div #parent tabindex="0" cdkFocusClasses>
        //   <div #child (click)="#parent.focus()"></div>
        // </div>
        //
        // If the user touches the #child element and the #parent is programmatically focused as a
        // result, this code will still consider it to have been caused by the touch event and will
        // apply the cdk-touch-focused class rather than the cdk-program-focused class. This is a
        // relatively small edge-case that can be worked around by using
        // focusVia(parentEl, 'program') to focus the parent element.
        //
        // If we decide that we absolutely must handle this case correctly, we can do so by listening
        // for the first focus event after the touchstart, and then the first blur event after that
        // focus event. When that blur event fires we know that whatever follows is not a result of the
        // touchstart.
        const focusTarget = getTarget(event);
        return this._lastTouchTarget instanceof Node && focusTarget instanceof Node &&
            (focusTarget === this._lastTouchTarget || focusTarget.contains(this._lastTouchTarget));
    }
    /**
     * Handles focus events on a registered element.
     * @param event The focus event.
     * @param element The monitored element.
     */
    _onFocus(event, element) {
        // NOTE(mmalerba): We currently set the classes based on the focus origin of the most recent
        // focus event affecting the monitored element. If we want to use the origin of the first event
        // instead we should check for the cdk-focused class here and return if the element already has
        // it. (This only matters for elements that have includesChildren = true).
        // If we are not counting child-element-focus as focused, make sure that the event target is the
        // monitored element itself.
        const elementInfo = this._elementInfo.get(element);
        if (!elementInfo || (!elementInfo.checkChildren && element !== getTarget(event))) {
            return;
        }
        this._originChanged(element, this._getFocusOrigin(event), elementInfo);
    }
    /**
     * Handles blur events on a registered element.
     * @param event The blur event.
     * @param element The monitored element.
     */
    _onBlur(event, element) {
        // If we are counting child-element-focus as focused, make sure that we aren't just blurring in
        // order to focus another child of the monitored element.
        const elementInfo = this._elementInfo.get(element);
        if (!elementInfo || (elementInfo.checkChildren && event.relatedTarget instanceof Node &&
            element.contains(event.relatedTarget))) {
            return;
        }
        this._setClasses(element);
        this._emitOrigin(elementInfo.subject, null);
    }
    _emitOrigin(subject, origin) {
        this._ngZone.run(() => subject.next(origin));
    }
    _registerGlobalListeners(elementInfo) {
        if (!this._platform.isBrowser) {
            return;
        }
        const rootNode = elementInfo.rootNode;
        const rootNodeFocusListeners = this._rootNodeFocusListenerCount.get(rootNode) || 0;
        if (!rootNodeFocusListeners) {
            this._ngZone.runOutsideAngular(() => {
                rootNode.addEventListener('focus', this._rootNodeFocusAndBlurListener, captureEventListenerOptions);
                rootNode.addEventListener('blur', this._rootNodeFocusAndBlurListener, captureEventListenerOptions);
            });
        }
        this._rootNodeFocusListenerCount.set(rootNode, rootNodeFocusListeners + 1);
        // Register global listeners when first element is monitored.
        if (++this._monitoredElementCount === 1) {
            // Note: we listen to events in the capture phase so we
            // can detect them even if the user stops propagation.
            this._ngZone.runOutsideAngular(() => {
                const document = this._getDocument();
                const window = this._getWindow();
                document.addEventListener('keydown', this._documentKeydownListener, captureEventListenerOptions);
                document.addEventListener('mousedown', this._documentMousedownListener, captureEventListenerOptions);
                document.addEventListener('touchstart', this._documentTouchstartListener, captureEventListenerOptions);
                window.addEventListener('focus', this._windowFocusListener);
            });
        }
    }
    _removeGlobalListeners(elementInfo) {
        const rootNode = elementInfo.rootNode;
        if (this._rootNodeFocusListenerCount.has(rootNode)) {
            const rootNodeFocusListeners = this._rootNodeFocusListenerCount.get(rootNode);
            if (rootNodeFocusListeners > 1) {
                this._rootNodeFocusListenerCount.set(rootNode, rootNodeFocusListeners - 1);
            }
            else {
                rootNode.removeEventListener('focus', this._rootNodeFocusAndBlurListener, captureEventListenerOptions);
                rootNode.removeEventListener('blur', this._rootNodeFocusAndBlurListener, captureEventListenerOptions);
                this._rootNodeFocusListenerCount.delete(rootNode);
            }
        }
        // Unregister global listeners when last element is unmonitored.
        if (!--this._monitoredElementCount) {
            const document = this._getDocument();
            const window = this._getWindow();
            document.removeEventListener('keydown', this._documentKeydownListener, captureEventListenerOptions);
            document.removeEventListener('mousedown', this._documentMousedownListener, captureEventListenerOptions);
            document.removeEventListener('touchstart', this._documentTouchstartListener, captureEventListenerOptions);
            window.removeEventListener('focus', this._windowFocusListener);
            // Clear timeouts for all potentially pending timeouts to prevent the leaks.
            clearTimeout(this._windowFocusTimeoutId);
            clearTimeout(this._touchTimeoutId);
            clearTimeout(this._originTimeoutId);
        }
    }
    /** Updates all the state on an element once its focus origin has changed. */
    _originChanged(element, origin, elementInfo) {
        this._setClasses(element, origin);
        this._emitOrigin(elementInfo.subject, origin);
        this._lastFocusOrigin = origin;
    }
    /**
     * Collects the `MonitoredElementInfo` of a particular element and
     * all of its ancestors that have enabled `checkChildren`.
     * @param element Element from which to start the search.
     */
    _getClosestElementsInfo(element) {
        const results = [];
        this._elementInfo.forEach((info, currentElement) => {
            if (currentElement === element || (info.checkChildren && currentElement.contains(element))) {
                results.push([currentElement, info]);
            }
        });
        return results;
    }
}
FocusMonitor.ɵprov = i0.ɵɵdefineInjectable({ factory: function FocusMonitor_Factory() { return new FocusMonitor(i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i1.Platform), i0.ɵɵinject(i2.DOCUMENT, 8), i0.ɵɵinject(FOCUS_MONITOR_DEFAULT_OPTIONS, 8)); }, token: FocusMonitor, providedIn: "root" });
FocusMonitor.decorators = [
    { type: Injectable, args: [{ providedIn: 'root' },] }
];
FocusMonitor.ctorParameters = () => [
    { type: NgZone },
    { type: Platform },
    { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [DOCUMENT,] }] },
    { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [FOCUS_MONITOR_DEFAULT_OPTIONS,] }] }
];
/** Gets the target of an event, accounting for Shadow DOM. */
function getTarget(event) {
    // If an event is bound outside the Shadow DOM, the `event.target` will
    // point to the shadow root so we have to use `composedPath` instead.
    return (event.composedPath ? event.composedPath()[0] : event.target);
}
/**
 * Directive that determines how a particular element was focused (via keyboard, mouse, touch, or
 * programmatically) and adds corresponding classes to the element.
 *
 * There are two variants of this directive:
 * 1) cdkMonitorElementFocus: does not consider an element to be focused if one of its children is
 *    focused.
 * 2) cdkMonitorSubtreeFocus: considers an element focused if it or any of its children are focused.
 */
export class CdkMonitorFocus {
    constructor(_elementRef, _focusMonitor) {
        this._elementRef = _elementRef;
        this._focusMonitor = _focusMonitor;
        this.cdkFocusChange = new EventEmitter();
    }
    ngAfterViewInit() {
        const element = this._elementRef.nativeElement;
        this._monitorSubscription = this._focusMonitor.monitor(element, element.nodeType === 1 && element.hasAttribute('cdkMonitorSubtreeFocus'))
            .subscribe(origin => this.cdkFocusChange.emit(origin));
    }
    ngOnDestroy() {
        this._focusMonitor.stopMonitoring(this._elementRef);
        if (this._monitorSubscription) {
            this._monitorSubscription.unsubscribe();
        }
    }
}
CdkMonitorFocus.decorators = [
    { type: Directive, args: [{
                selector: '[cdkMonitorElementFocus], [cdkMonitorSubtreeFocus]',
            },] }
];
CdkMonitorFocus.ctorParameters = () => [
    { type: ElementRef },
    { type: FocusMonitor }
];
CdkMonitorFocus.propDecorators = {
    cdkFocusChange: [{ type: Output }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXMtbW9uaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvYTExeS9mb2N1cy1tb25pdG9yL2ZvY3VzLW1vbml0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBRSwrQkFBK0IsRUFBRSxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNoRyxPQUFPLEVBQ0wsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osTUFBTSxFQUNOLFVBQVUsRUFDVixjQUFjLEVBQ2QsTUFBTSxFQUVOLFFBQVEsRUFDUixNQUFNLEdBRVAsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFhLEVBQUUsSUFBSSxZQUFZLEVBQUUsT0FBTyxFQUFlLE1BQU0sTUFBTSxDQUFDO0FBQzNFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUFDLCtCQUErQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7Ozs7QUFHbEUsa0dBQWtHO0FBQ2xHLGtEQUFrRDtBQUNsRCxNQUFNLENBQUMsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDO0FBa0NuQyw4Q0FBOEM7QUFDOUMsTUFBTSxDQUFDLE1BQU0sNkJBQTZCLEdBQ3RDLElBQUksY0FBYyxDQUFzQixtQ0FBbUMsQ0FBQyxDQUFDO0FBUWpGOzs7R0FHRztBQUNILE1BQU0sMkJBQTJCLEdBQUcsK0JBQStCLENBQUM7SUFDbEUsT0FBTyxFQUFFLElBQUk7SUFDYixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUMsQ0FBQztBQUdILGlGQUFpRjtBQUVqRixNQUFNLE9BQU8sWUFBWTtJQWlHdkIsWUFDWSxPQUFlLEVBQ2YsU0FBbUI7SUFDM0IscURBQXFEO0lBQ3ZCLFFBQWtCLEVBQ0csT0FDdkI7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QUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQ3BELE9BQU8sRUFDUCxPQUFPLENBQUMsUUFBUSxLQUFLLENBQUMsSUFBSSxPQUFPLENBQUMsWUFBWSxDQUFDLHdCQUF3QixDQUFDLENBQUM7YUFDMUUsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUN6RCxDQUFDO0lBRUQsV0FBVztRQUNULElBQUksQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUVwRCxJQUFJLElBQUksQ0FBQyxvQkFBb0IsRUFBRTtZQUM3QixJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxFQUFFLENBQUM7U0FDekM7SUFDSCxDQUFDOzs7WUF2QkYsU0FBUyxTQUFDO2dCQUNULFFBQVEsRUFBRSxvREFBb0Q7YUFDL0Q7OztZQXZrQkMsVUFBVTtZQTRrQnVFLFlBQVk7Ozs2QkFGNUYsTUFBTSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1BsYXRmb3JtLCBub3JtYWxpemVQYXNzaXZlTGlzdGVuZXJPcHRpb25zLCBfZ2V0U2hhZG93Um9vdH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7XG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBJbmplY3QsXG4gIEluamVjdGFibGUsXG4gIEluamVjdGlvblRva2VuLFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgT3B0aW9uYWwsXG4gIE91dHB1dCxcbiAgQWZ0ZXJWaWV3SW5pdCxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge09ic2VydmFibGUsIG9mIGFzIG9ic2VydmFibGVPZiwgU3ViamVjdCwgU3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcbmltcG9ydCB7Y29lcmNlRWxlbWVudH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge2lzRmFrZU1vdXNlZG93bkZyb21TY3JlZW5SZWFkZXJ9IGZyb20gJy4uL2Zha2UtbW91c2Vkb3duJztcblxuXG4vLyBUaGlzIGlzIHRoZSB2YWx1ZSB1c2VkIGJ5IEFuZ3VsYXJKUyBNYXRlcmlhbC4gVGhyb3VnaCB0cmlhbCBhbmQgZXJyb3IgKG9uIGlQaG9uZSA2UykgdGhleSBmb3VuZFxuLy8gdGhhdCBhIHZhbHVlIG9mIGFyb3VuZCA2NTBtcyBzZWVtcyBhcHByb3ByaWF0ZS5cbmV4cG9ydCBjb25zdCBUT1VDSF9CVUZGRVJfTVMgPSA2NTA7XG5cblxuZXhwb3J0IHR5cGUgRm9jdXNPcmlnaW4gPSAndG91Y2gnIHwgJ21vdXNlJyB8ICdrZXlib2FyZCcgfCAncHJvZ3JhbScgfCBudWxsO1xuXG4vKipcbiAqIENvcnJlc3BvbmRzIHRvIHRoZSBvcHRpb25zIHRoYXQgY2FuIGJlIHBhc3NlZCB0byB0aGUgbmF0aXZlIGBmb2N1c2AgZXZlbnQuXG4gKiB2aWEgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0hUTUxFbGVtZW50L2ZvY3VzXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRm9jdXNPcHRpb25zIHtcbiAgLyoqIFdoZXRoZXIgdGhlIGJyb3dzZXIgc2hvdWxkIHNjcm9sbCB0byB0aGUgZWxlbWVudCB3aGVuIGl0IGlzIGZvY3VzZWQuICovXG4gIHByZXZlbnRTY3JvbGw/OiBib29sZWFuO1xufVxuXG4vKiogRGV0ZWN0aW9uIG1vZGUgdXNlZCBmb3IgYXR0cmlidXRpbmcgdGhlIG9yaWdpbiBvZiBhIGZvY3VzIGV2ZW50LiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gRm9jdXNNb25pdG9yRGV0ZWN0aW9uTW9kZSB7XG4gIC8qKlxuICAgKiBBbnkgbW91c2Vkb3duLCBrZXlkb3duLCBvciB0b3VjaHN0YXJ0IGV2ZW50IHRoYXQgaGFwcGVuZWQgaW4gdGhlIHByZXZpb3VzXG4gICAqIHRpY2sgb3IgdGhlIGN1cnJlbnQgdGljayB3aWxsIGJlIHVzZWQgdG8gYXNzaWduIGEgZm9jdXMgZXZlbnQncyBvcmlnaW4gKHRvXG4gICAqIGVpdGhlciBtb3VzZSwga2V5Ym9hcmQsIG9yIHRvdWNoKS4gVGhpcyBpcyB0aGUgZGVmYXVsdCBvcHRpb24uXG4gICAqL1xuICBJTU1FRElBVEUsXG4gIC8qKlxuICAgKiBBIGZvY3VzIGV2ZW50J3Mgb3JpZ2luIGlzIGFsd2F5cyBhdHRyaWJ1dGVkIHRvIHRoZSBsYXN0IGNvcnJlc3BvbmRpbmdcbiAgICogbW91c2Vkb3duLCBrZXlkb3duLCBvciB0b3VjaHN0YXJ0IGV2ZW50LCBubyBtYXR0ZXIgaG93IGxvbmcgYWdvIGl0IG9jY3VyZWQuXG4gICAqL1xuICBFVkVOVFVBTFxufVxuXG4vKiogSW5qZWN0YWJsZSBzZXJ2aWNlLWxldmVsIG9wdGlvbnMgZm9yIEZvY3VzTW9uaXRvci4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRm9jdXNNb25pdG9yT3B0aW9ucyB7XG4gIGRldGVjdGlvbk1vZGU/OiBGb2N1c01vbml0b3JEZXRlY3Rpb25Nb2RlO1xufVxuXG4vKiogSW5qZWN0aW9uVG9rZW4gZm9yIEZvY3VzTW9uaXRvck9wdGlvbnMuICovXG5leHBvcnQgY29uc3QgRk9DVVNfTU9OSVRPUl9ERUZBVUxUX09QVElPTlMgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjxGb2N1c01vbml0b3JPcHRpb25zPignY2RrLWZvY3VzLW1vbml0b3ItZGVmYXVsdC1vcHRpb25zJyk7XG5cbnR5cGUgTW9uaXRvcmVkRWxlbWVudEluZm8gPSB7XG4gIGNoZWNrQ2hpbGRyZW46IGJvb2xlYW4sXG4gIHN1YmplY3Q6IFN1YmplY3Q8Rm9jdXNPcmlnaW4+LFxuICByb290Tm9kZTogSFRNTEVsZW1lbnR8RG9jdW1lbnRcbn07XG5cbi8qKlxuICogRXZlbnQgbGlzdGVuZXIgb3B0aW9ucyB0aGF0IGVuYWJsZSBjYXB0dXJpbmcgYW5kIGFsc29cbiAqIG1hcmsgdGhlIGxpc3RlbmVyIGFzIHBhc3NpdmUgaWYgdGhlIGJyb3dzZXIgc3VwcG9ydHMgaXQuXG4gKi9cbmNvbnN0IGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyA9IG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMoe1xuICBwYXNzaXZlOiB0cnVlLFxuICBjYXB0dXJlOiB0cnVlXG59KTtcblxuXG4vKiogTW9uaXRvcnMgbW91c2UgYW5kIGtleWJvYXJkIGV2ZW50cyB0byBkZXRlcm1pbmUgdGhlIGNhdXNlIG9mIGZvY3VzIGV2ZW50cy4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIEZvY3VzTW9uaXRvciBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qKiBUaGUgZm9jdXMgb3JpZ2luIHRoYXQgdGhlIG5leHQgZm9jdXMgZXZlbnQgaXMgYSByZXN1bHQgb2YuICovXG4gIHByaXZhdGUgX29yaWdpbjogRm9jdXNPcmlnaW4gPSBudWxsO1xuXG4gIC8qKiBUaGUgRm9jdXNPcmlnaW4gb2YgdGhlIGxhc3QgZm9jdXMgZXZlbnQgdHJhY2tlZCBieSB0aGUgRm9jdXNNb25pdG9yLiAqL1xuICBwcml2YXRlIF9sYXN0Rm9jdXNPcmlnaW46IEZvY3VzT3JpZ2luO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSB3aW5kb3cgaGFzIGp1c3QgYmVlbiBmb2N1c2VkLiAqL1xuICBwcml2YXRlIF93aW5kb3dGb2N1c2VkID0gZmFsc2U7XG5cbiAgLyoqIFRoZSB0YXJnZXQgb2YgdGhlIGxhc3QgdG91Y2ggZXZlbnQuICovXG4gIHByaXZhdGUgX2xhc3RUb3VjaFRhcmdldDogRXZlbnRUYXJnZXQgfCBudWxsO1xuXG4gIC8qKiBUaGUgdGltZW91dCBpZCBvZiB0aGUgdG91Y2ggdGltZW91dCwgdXNlZCB0byBjYW5jZWwgdGltZW91dCBsYXRlci4gKi9cbiAgcHJpdmF0ZSBfdG91Y2hUaW1lb3V0SWQ6IG51bWJlcjtcblxuICAvKiogVGhlIHRpbWVvdXQgaWQgb2YgdGhlIHdpbmRvdyBmb2N1cyB0aW1lb3V0LiAqL1xuICBwcml2YXRlIF93aW5kb3dGb2N1c1RpbWVvdXRJZDogbnVtYmVyO1xuXG4gIC8qKiBUaGUgdGltZW91dCBpZCBvZiB0aGUgb3JpZ2luIGNsZWFyaW5nIHRpbWVvdXQuICovXG4gIHByaXZhdGUgX29yaWdpblRpbWVvdXRJZDogbnVtYmVyO1xuXG4gIC8qKiBNYXAgb2YgZWxlbWVudHMgYmVpbmcgbW9uaXRvcmVkIHRvIHRoZWlyIGluZm8uICovXG4gIHByaXZhdGUgX2VsZW1lbnRJbmZvID0gbmV3IE1hcDxIVE1MRWxlbWVudCwgTW9uaXRvcmVkRWxlbWVudEluZm8+KCk7XG5cbiAgLyoqIFRoZSBudW1iZXIgb2YgZWxlbWVudHMgY3VycmVudGx5IGJlaW5nIG1vbml0b3JlZC4gKi9cbiAgcHJpdmF0ZSBfbW9uaXRvcmVkRWxlbWVudENvdW50ID0gMDtcblxuICAvKipcbiAgICogS2VlcHMgdHJhY2sgb2YgdGhlIHJvb3Qgbm9kZXMgdG8gd2hpY2ggd2UndmUgY3VycmVudGx5IGJvdW5kIGEgZm9jdXMvYmx1ciBoYW5kbGVyLFxuICAgKiBhcyB3ZWxsIGFzIHRoZSBudW1iZXIgb2YgbW9uaXRvcmVkIGVsZW1lbnRzIHRoYXQgdGhleSBjb250YWluLiBXZSBoYXZlIHRvIHRyZWF0IGZvY3VzL2JsdXJcbiAgICogaGFuZGxlcnMgZGlmZmVyZW50bHkgZnJvbSB0aGUgcmVzdCBvZiB0aGUgZXZlbnRzLCBiZWNhdXNlIHRoZSBicm93c2VyIHdvbid0IGVtaXQgZXZlbnRzXG4gICAqIHRvIHRoZSBkb2N1bWVudCB3aGVuIGZvY3VzIG1vdmVzIGluc2lkZSBvZiBhIHNoYWRvdyByb290LlxuICAgKi9cbiAgcHJpdmF0ZSBfcm9vdE5vZGVGb2N1c0xpc3RlbmVyQ291bnQgPSBuZXcgTWFwPEhUTUxFbGVtZW50fERvY3VtZW50LCBudW1iZXI+KCk7XG5cbiAgLyoqXG4gICAqIFRoZSBzcGVjaWZpZWQgZGV0ZWN0aW9uIG1vZGUsIHVzZWQgZm9yIGF0dHJpYnV0aW5nIHRoZSBvcmlnaW4gb2YgYSBmb2N1c1xuICAgKiBldmVudC5cbiAgICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX2RldGVjdGlvbk1vZGU6IEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGU7XG5cbiAgLyoqXG4gICAqIEV2ZW50IGxpc3RlbmVyIGZvciBga2V5ZG93bmAgZXZlbnRzIG9uIHRoZSBkb2N1bWVudC5cbiAgICogTmVlZHMgdG8gYmUgYW4gYXJyb3cgZnVuY3Rpb24gaW4gb3JkZXIgdG8gcHJlc2VydmUgdGhlIGNvbnRleHQgd2hlbiBpdCBnZXRzIGJvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfZG9jdW1lbnRLZXlkb3duTGlzdGVuZXIgPSAoKSA9PiB7XG4gICAgLy8gT24ga2V5ZG93biByZWNvcmQgdGhlIG9yaWdpbiBhbmQgY2xlYXIgYW55IHRvdWNoIGV2ZW50IHRoYXQgbWF5IGJlIGluIHByb2dyZXNzLlxuICAgIHRoaXMuX2xhc3RUb3VjaFRhcmdldCA9IG51bGw7XG4gICAgdGhpcy5fc2V0T3JpZ2luRm9yQ3VycmVudEV2ZW50UXVldWUoJ2tleWJvYXJkJyk7XG4gIH1cblxuICAvKipcbiAgICogRXZlbnQgbGlzdGVuZXIgZm9yIGBtb3VzZWRvd25gIGV2ZW50cyBvbiB0aGUgZG9jdW1lbnQuXG4gICAqIE5lZWRzIHRvIGJlIGFuIGFycm93IGZ1bmN0aW9uIGluIG9yZGVyIHRvIHByZXNlcnZlIHRoZSBjb250ZXh0IHdoZW4gaXQgZ2V0cyBib3VuZC5cbiAgICovXG4gIHByaXZhdGUgX2RvY3VtZW50TW91c2Vkb3duTGlzdGVuZXIgPSAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAvLyBPbiBtb3VzZWRvd24gcmVjb3JkIHRoZSBvcmlnaW4gb25seSBpZiB0aGVyZSBpcyBub3QgdG91Y2hcbiAgICAvLyB0YXJnZXQsIHNpbmNlIGEgbW91c2Vkb3duIGNhbiBoYXBwZW4gYXMgYSByZXN1bHQgb2YgYSB0b3VjaCBldmVudC5cbiAgICBpZiAoIXRoaXMuX2xhc3RUb3VjaFRhcmdldCkge1xuICAgICAgLy8gSW4gc29tZSBjYXNlcyBzY3JlZW4gcmVhZGVycyBmaXJlIGZha2UgYG1vdXNlZG93bmAgZXZlbnRzIGluc3RlYWQgb2YgYGtleWRvd25gLlxuICAgICAgLy8gUmVzb2x2ZSB0aGUgZm9jdXMgc291cmNlIHRvIGBrZXlib2FyZGAgaWYgd2UgZGV0ZWN0IG9uZSBvZiB0aGVtLlxuICAgICAgY29uc3Qgc291cmNlID0gaXNGYWtlTW91c2Vkb3duRnJvbVNjcmVlblJlYWRlcihldmVudCkgPyAna2V5Ym9hcmQnIDogJ21vdXNlJztcbiAgICAgIHRoaXMuX3NldE9yaWdpbkZvckN1cnJlbnRFdmVudFF1ZXVlKHNvdXJjZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEV2ZW50IGxpc3RlbmVyIGZvciBgdG91Y2hzdGFydGAgZXZlbnRzIG9uIHRoZSBkb2N1bWVudC5cbiAgICogTmVlZHMgdG8gYmUgYW4gYXJyb3cgZnVuY3Rpb24gaW4gb3JkZXIgdG8gcHJlc2VydmUgdGhlIGNvbnRleHQgd2hlbiBpdCBnZXRzIGJvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfZG9jdW1lbnRUb3VjaHN0YXJ0TGlzdGVuZXIgPSAoZXZlbnQ6IFRvdWNoRXZlbnQpID0+IHtcbiAgICAvLyBXaGVuIHRoZSB0b3VjaHN0YXJ0IGV2ZW50IGZpcmVzIHRoZSBmb2N1cyBldmVudCBpcyBub3QgeWV0IGluIHRoZSBldmVudCBxdWV1ZS4gVGhpcyBtZWFuc1xuICAgIC8vIHdlIGNhbid0IHJlbHkgb24gdGhlIHRyaWNrIHVzZWQgYWJvdmUgKHNldHRpbmcgdGltZW91dCBvZiAxbXMpLiBJbnN0ZWFkIHdlIHdhaXQgNjUwbXMgdG9cbiAgICAvLyBzZWUgaWYgYSBmb2N1cyBoYXBwZW5zLlxuICAgIGlmICh0aGlzLl90b3VjaFRpbWVvdXRJZCAhPSBudWxsKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fdG91Y2hUaW1lb3V0SWQpO1xuICAgIH1cblxuICAgIHRoaXMuX2xhc3RUb3VjaFRhcmdldCA9IGdldFRhcmdldChldmVudCk7XG4gICAgdGhpcy5fdG91Y2hUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX2xhc3RUb3VjaFRhcmdldCA9IG51bGwsIFRPVUNIX0JVRkZFUl9NUyk7XG4gIH1cblxuICAvKipcbiAgICogRXZlbnQgbGlzdGVuZXIgZm9yIGBmb2N1c2AgZXZlbnRzIG9uIHRoZSB3aW5kb3cuXG4gICAqIE5lZWRzIHRvIGJlIGFuIGFycm93IGZ1bmN0aW9uIGluIG9yZGVyIHRvIHByZXNlcnZlIHRoZSBjb250ZXh0IHdoZW4gaXQgZ2V0cyBib3VuZC5cbiAgICovXG4gIHByaXZhdGUgX3dpbmRvd0ZvY3VzTGlzdGVuZXIgPSAoKSA9PiB7XG4gICAgLy8gTWFrZSBhIG5vdGUgb2Ygd2hlbiB0aGUgd2luZG93IHJlZ2FpbnMgZm9jdXMsIHNvIHdlIGNhblxuICAgIC8vIHJlc3RvcmUgdGhlIG9yaWdpbiBpbmZvIGZvciB0aGUgZm9jdXNlZCBlbGVtZW50LlxuICAgIHRoaXMuX3dpbmRvd0ZvY3VzZWQgPSB0cnVlO1xuICAgIHRoaXMuX3dpbmRvd0ZvY3VzVGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLl93aW5kb3dGb2N1c2VkID0gZmFsc2UpO1xuICB9XG5cbiAgLyoqIFVzZWQgdG8gcmVmZXJlbmNlIGNvcnJlY3QgZG9jdW1lbnQvd2luZG93ICovXG4gIHByb3RlY3RlZCBfZG9jdW1lbnQ/OiBEb2N1bWVudDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgICAgcHJpdmF0ZSBfcGxhdGZvcm06IFBsYXRmb3JtLFxuICAgICAgLyoqIEBicmVha2luZy1jaGFuZ2UgMTEuMC4wIG1ha2UgZG9jdW1lbnQgcmVxdWlyZWQgKi9cbiAgICAgIEBPcHRpb25hbCgpIEBJbmplY3QoRE9DVU1FTlQpIGRvY3VtZW50OiBhbnl8bnVsbCxcbiAgICAgIEBPcHRpb25hbCgpIEBJbmplY3QoRk9DVVNfTU9OSVRPUl9ERUZBVUxUX09QVElPTlMpIG9wdGlvbnM6XG4gICAgICAgICAgRm9jdXNNb25pdG9yT3B0aW9uc3xudWxsKSB7XG4gICAgdGhpcy5fZG9jdW1lbnQgPSBkb2N1bWVudDtcbiAgICB0aGlzLl9kZXRlY3Rpb25Nb2RlID0gb3B0aW9ucz8uZGV0ZWN0aW9uTW9kZSB8fCBGb2N1c01vbml0b3JEZXRlY3Rpb25Nb2RlLklNTUVESUFURTtcbiAgfVxuICAvKipcbiAgICogRXZlbnQgbGlzdGVuZXIgZm9yIGBmb2N1c2AgYW5kICdibHVyJyBldmVudHMgb24gdGhlIGRvY3VtZW50LlxuICAgKiBOZWVkcyB0byBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0IGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF9yb290Tm9kZUZvY3VzQW5kQmx1ckxpc3RlbmVyID0gKGV2ZW50OiBFdmVudCkgPT4ge1xuICAgIGNvbnN0IHRhcmdldCA9IGdldFRhcmdldChldmVudCk7XG4gICAgY29uc3QgaGFuZGxlciA9IGV2ZW50LnR5cGUgPT09ICdmb2N1cycgPyB0aGlzLl9vbkZvY3VzIDogdGhpcy5fb25CbHVyO1xuXG4gICAgLy8gV2UgbmVlZCB0byB3YWxrIHVwIHRoZSBhbmNlc3RvciBjaGFpbiBpbiBvcmRlciB0byBzdXBwb3J0IGBjaGVja0NoaWxkcmVuYC5cbiAgICBmb3IgKGxldCBlbGVtZW50ID0gdGFyZ2V0OyBlbGVtZW50OyBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnRFbGVtZW50KSB7XG4gICAgICBoYW5kbGVyLmNhbGwodGhpcywgZXZlbnQgYXMgRm9jdXNFdmVudCwgZWxlbWVudCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE1vbml0b3JzIGZvY3VzIG9uIGFuIGVsZW1lbnQgYW5kIGFwcGxpZXMgYXBwcm9wcmlhdGUgQ1NTIGNsYXNzZXMuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIG1vbml0b3JcbiAgICogQHBhcmFtIGNoZWNrQ2hpbGRyZW4gV2hldGhlciB0byBjb3VudCB0aGUgZWxlbWVudCBhcyBmb2N1c2VkIHdoZW4gaXRzIGNoaWxkcmVuIGFyZSBmb2N1c2VkLlxuICAgKiBAcmV0dXJucyBBbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgd2hlbiB0aGUgZm9jdXMgc3RhdGUgb2YgdGhlIGVsZW1lbnQgY2hhbmdlcy5cbiAgICogICAgIFdoZW4gdGhlIGVsZW1lbnQgaXMgYmx1cnJlZCwgbnVsbCB3aWxsIGJlIGVtaXR0ZWQuXG4gICAqL1xuICBtb25pdG9yKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBjaGVja0NoaWxkcmVuPzogYm9vbGVhbik6IE9ic2VydmFibGU8Rm9jdXNPcmlnaW4+O1xuXG4gIC8qKlxuICAgKiBNb25pdG9ycyBmb2N1cyBvbiBhbiBlbGVtZW50IGFuZCBhcHBsaWVzIGFwcHJvcHJpYXRlIENTUyBjbGFzc2VzLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBtb25pdG9yXG4gICAqIEBwYXJhbSBjaGVja0NoaWxkcmVuIFdoZXRoZXIgdG8gY291bnQgdGhlIGVsZW1lbnQgYXMgZm9jdXNlZCB3aGVuIGl0cyBjaGlsZHJlbiBhcmUgZm9jdXNlZC5cbiAgICogQHJldHVybnMgQW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHdoZW4gdGhlIGZvY3VzIHN0YXRlIG9mIHRoZSBlbGVtZW50IGNoYW5nZXMuXG4gICAqICAgICBXaGVuIHRoZSBlbGVtZW50IGlzIGJsdXJyZWQsIG51bGwgd2lsbCBiZSBlbWl0dGVkLlxuICAgKi9cbiAgbW9uaXRvcihlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiwgY2hlY2tDaGlsZHJlbj86IGJvb2xlYW4pOiBPYnNlcnZhYmxlPEZvY3VzT3JpZ2luPjtcblxuICBtb25pdG9yKGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgICAgICAgY2hlY2tDaGlsZHJlbjogYm9vbGVhbiA9IGZhbHNlKTogT2JzZXJ2YWJsZTxGb2N1c09yaWdpbj4ge1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnQpO1xuXG4gICAgLy8gRG8gbm90aGluZyBpZiB3ZSdyZSBub3Qgb24gdGhlIGJyb3dzZXIgcGxhdGZvcm0gb3IgdGhlIHBhc3NlZCBpbiBub2RlIGlzbid0IGFuIGVsZW1lbnQuXG4gICAgaWYgKCF0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIgfHwgbmF0aXZlRWxlbWVudC5ub2RlVHlwZSAhPT0gMSkge1xuICAgICAgcmV0dXJuIG9ic2VydmFibGVPZihudWxsKTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgZWxlbWVudCBpcyBpbnNpZGUgdGhlIHNoYWRvdyBET00sIHdlIG5lZWQgdG8gYmluZCBvdXIgZm9jdXMvYmx1ciBsaXN0ZW5lcnMgdG9cbiAgICAvLyB0aGUgc2hhZG93IHJvb3QsIHJhdGhlciB0aGFuIHRoZSBgZG9jdW1lbnRgLCBiZWNhdXNlIHRoZSBicm93c2VyIHdvbid0IGVtaXQgZm9jdXMgZXZlbnRzXG4gICAgLy8gdG8gdGhlIGBkb2N1bWVudGAsIGlmIGZvY3VzIGlzIG1vdmluZyB3aXRoaW4gdGhlIHNhbWUgc2hhZG93IHJvb3QuXG4gICAgY29uc3Qgcm9vdE5vZGUgPSAoX2dldFNoYWRvd1Jvb3QobmF0aXZlRWxlbWVudCkgYXMgSFRNTEVsZW1lbnR8bnVsbCkgfHwgdGhpcy5fZ2V0RG9jdW1lbnQoKTtcbiAgICBjb25zdCBjYWNoZWRJbmZvID0gdGhpcy5fZWxlbWVudEluZm8uZ2V0KG5hdGl2ZUVsZW1lbnQpO1xuXG4gICAgLy8gQ2hlY2sgaWYgd2UncmUgYWxyZWFkeSBtb25pdG9yaW5nIHRoaXMgZWxlbWVudC5cbiAgICBpZiAoY2FjaGVkSW5mbykge1xuICAgICAgaWYgKGNoZWNrQ2hpbGRyZW4pIHtcbiAgICAgICAgLy8gVE9ETyhDT01QLTMxOCk6IHRoaXMgY2FuIGJlIHByb2JsZW1hdGljLCBiZWNhdXNlIGl0J2xsIHR1cm4gYWxsIG5vbi1jaGVja0NoaWxkcmVuXG4gICAgICAgIC8vIG9ic2VydmVycyBpbnRvIG9uZXMgdGhhdCBiZWhhdmUgYXMgaWYgYGNoZWNrQ2hpbGRyZW5gIHdhcyB0dXJuZWQgb24uIFdlIG5lZWQgYSBtb3JlXG4gICAgICAgIC8vIHJvYnVzdCBzb2x1dGlvbi5cbiAgICAgICAgY2FjaGVkSW5mby5jaGVja0NoaWxkcmVuID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNhY2hlZEluZm8uc3ViamVjdDtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgbW9uaXRvcmVkIGVsZW1lbnQgaW5mby5cbiAgICBjb25zdCBpbmZvOiBNb25pdG9yZWRFbGVtZW50SW5mbyA9IHtcbiAgICAgIGNoZWNrQ2hpbGRyZW46IGNoZWNrQ2hpbGRyZW4sXG4gICAgICBzdWJqZWN0OiBuZXcgU3ViamVjdDxGb2N1c09yaWdpbj4oKSxcbiAgICAgIHJvb3ROb2RlXG4gICAgfTtcbiAgICB0aGlzLl9lbGVtZW50SW5mby5zZXQobmF0aXZlRWxlbWVudCwgaW5mbyk7XG4gICAgdGhpcy5fcmVnaXN0ZXJHbG9iYWxMaXN0ZW5lcnMoaW5mbyk7XG5cbiAgICByZXR1cm4gaW5mby5zdWJqZWN0O1xuICB9XG5cbiAgLyoqXG4gICAqIFN0b3BzIG1vbml0b3JpbmcgYW4gZWxlbWVudCBhbmQgcmVtb3ZlcyBhbGwgZm9jdXMgY2xhc3Nlcy5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gc3RvcCBtb25pdG9yaW5nLlxuICAgKi9cbiAgc3RvcE1vbml0b3JpbmcoZWxlbWVudDogSFRNTEVsZW1lbnQpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBTdG9wcyBtb25pdG9yaW5nIGFuIGVsZW1lbnQgYW5kIHJlbW92ZXMgYWxsIGZvY3VzIGNsYXNzZXMuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHN0b3AgbW9uaXRvcmluZy5cbiAgICovXG4gIHN0b3BNb25pdG9yaW5nKGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+KTogdm9pZDtcblxuICBzdG9wTW9uaXRvcmluZyhlbGVtZW50OiBIVE1MRWxlbWVudCB8IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+KTogdm9pZCB7XG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoZWxlbWVudCk7XG4gICAgY29uc3QgZWxlbWVudEluZm8gPSB0aGlzLl9lbGVtZW50SW5mby5nZXQobmF0aXZlRWxlbWVudCk7XG5cbiAgICBpZiAoZWxlbWVudEluZm8pIHtcbiAgICAgIGVsZW1lbnRJbmZvLnN1YmplY3QuY29tcGxldGUoKTtcblxuICAgICAgdGhpcy5fc2V0Q2xhc3NlcyhuYXRpdmVFbGVtZW50KTtcbiAgICAgIHRoaXMuX2VsZW1lbnRJbmZvLmRlbGV0ZShuYXRpdmVFbGVtZW50KTtcbiAgICAgIHRoaXMuX3JlbW92ZUdsb2JhbExpc3RlbmVycyhlbGVtZW50SW5mbyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEZvY3VzZXMgdGhlIGVsZW1lbnQgdmlhIHRoZSBzcGVjaWZpZWQgZm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IHRvIGZvY3VzLlxuICAgKiBAcGFyYW0gb3JpZ2luIEZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIHRvIGNvbmZpZ3VyZSB0aGUgZm9jdXMgYmVoYXZpb3IuXG4gICAqL1xuICBmb2N1c1ZpYShlbGVtZW50OiBIVE1MRWxlbWVudCwgb3JpZ2luOiBGb2N1c09yaWdpbiwgb3B0aW9ucz86IEZvY3VzT3B0aW9ucyk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEZvY3VzZXMgdGhlIGVsZW1lbnQgdmlhIHRoZSBzcGVjaWZpZWQgZm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IHRvIGZvY3VzLlxuICAgKiBAcGFyYW0gb3JpZ2luIEZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIHRvIGNvbmZpZ3VyZSB0aGUgZm9jdXMgYmVoYXZpb3IuXG4gICAqL1xuICBmb2N1c1ZpYShlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50Piwgb3JpZ2luOiBGb2N1c09yaWdpbiwgb3B0aW9ucz86IEZvY3VzT3B0aW9ucyk6IHZvaWQ7XG5cbiAgZm9jdXNWaWEoZWxlbWVudDogSFRNTEVsZW1lbnQgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICAgICAgICBvcmlnaW46IEZvY3VzT3JpZ2luLFxuICAgICAgICAgIG9wdGlvbnM/OiBGb2N1c09wdGlvbnMpOiB2b2lkIHtcblxuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnQpO1xuICAgIGNvbnN0IGZvY3VzZWRFbGVtZW50ID0gdGhpcy5fZ2V0RG9jdW1lbnQoKS5hY3RpdmVFbGVtZW50O1xuXG4gICAgLy8gSWYgdGhlIGVsZW1lbnQgaXMgZm9jdXNlZCBhbHJlYWR5LCBjYWxsaW5nIGBmb2N1c2AgYWdhaW4gd29uJ3QgdHJpZ2dlciB0aGUgZXZlbnQgbGlzdGVuZXJcbiAgICAvLyB3aGljaCBtZWFucyB0aGF0IHRoZSBmb2N1cyBjbGFzc2VzIHdvbid0IGJlIHVwZGF0ZWQuIElmIHRoYXQncyB0aGUgY2FzZSwgdXBkYXRlIHRoZSBjbGFzc2VzXG4gICAgLy8gZGlyZWN0bHkgd2l0aG91dCB3YWl0aW5nIGZvciBhbiBldmVudC5cbiAgICBpZiAobmF0aXZlRWxlbWVudCA9PT0gZm9jdXNlZEVsZW1lbnQpIHtcbiAgICAgIHRoaXMuX2dldENsb3Nlc3RFbGVtZW50c0luZm8obmF0aXZlRWxlbWVudClcbiAgICAgICAgLmZvckVhY2goKFtjdXJyZW50RWxlbWVudCwgaW5mb10pID0+IHRoaXMuX29yaWdpbkNoYW5nZWQoY3VycmVudEVsZW1lbnQsIG9yaWdpbiwgaW5mbykpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9zZXRPcmlnaW5Gb3JDdXJyZW50RXZlbnRRdWV1ZShvcmlnaW4pO1xuXG4gICAgICAvLyBgZm9jdXNgIGlzbid0IGF2YWlsYWJsZSBvbiB0aGUgc2VydmVyXG4gICAgICBpZiAodHlwZW9mIG5hdGl2ZUVsZW1lbnQuZm9jdXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgbmF0aXZlRWxlbWVudC5mb2N1cyhvcHRpb25zKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9lbGVtZW50SW5mby5mb3JFYWNoKChfaW5mbywgZWxlbWVudCkgPT4gdGhpcy5zdG9wTW9uaXRvcmluZyhlbGVtZW50KSk7XG4gIH1cblxuICAvKiogQWNjZXNzIGluamVjdGVkIGRvY3VtZW50IGlmIGF2YWlsYWJsZSBvciBmYWxsYmFjayB0byBnbG9iYWwgZG9jdW1lbnQgcmVmZXJlbmNlICovXG4gIHByaXZhdGUgX2dldERvY3VtZW50KCk6IERvY3VtZW50IHtcbiAgICByZXR1cm4gdGhpcy5fZG9jdW1lbnQgfHwgZG9jdW1lbnQ7XG4gIH1cblxuICAvKiogVXNlIGRlZmF1bHRWaWV3IG9mIGluamVjdGVkIGRvY3VtZW50IGlmIGF2YWlsYWJsZSBvciBmYWxsYmFjayB0byBnbG9iYWwgd2luZG93IHJlZmVyZW5jZSAqL1xuICBwcml2YXRlIF9nZXRXaW5kb3coKTogV2luZG93IHtcbiAgICBjb25zdCBkb2MgPSB0aGlzLl9nZXREb2N1bWVudCgpO1xuICAgIHJldHVybiBkb2MuZGVmYXVsdFZpZXcgfHwgd2luZG93O1xuICB9XG5cbiAgcHJpdmF0ZSBfdG9nZ2xlQ2xhc3MoZWxlbWVudDogRWxlbWVudCwgY2xhc3NOYW1lOiBzdHJpbmcsIHNob3VsZFNldDogYm9vbGVhbikge1xuICAgIGlmIChzaG91bGRTZXQpIHtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9nZXRGb2N1c09yaWdpbihldmVudDogRm9jdXNFdmVudCk6IEZvY3VzT3JpZ2luIHtcbiAgICAvLyBJZiB3ZSBjb3VsZG4ndCBkZXRlY3QgYSBjYXVzZSBmb3IgdGhlIGZvY3VzIGV2ZW50LCBpdCdzIGR1ZSB0byBvbmUgb2YgdGhyZWUgcmVhc29uczpcbiAgICAvLyAxKSBUaGUgd2luZG93IGhhcyBqdXN0IHJlZ2FpbmVkIGZvY3VzLCBpbiB3aGljaCBjYXNlIHdlIHdhbnQgdG8gcmVzdG9yZSB0aGUgZm9jdXNlZCBzdGF0ZSBvZlxuICAgIC8vICAgIHRoZSBlbGVtZW50IGZyb20gYmVmb3JlIHRoZSB3aW5kb3cgYmx1cnJlZC5cbiAgICAvLyAyKSBJdCB3YXMgY2F1c2VkIGJ5IGEgdG91Y2ggZXZlbnQsIGluIHdoaWNoIGNhc2Ugd2UgbWFyayB0aGUgb3JpZ2luIGFzICd0b3VjaCcuXG4gICAgLy8gMykgVGhlIGVsZW1lbnQgd2FzIHByb2dyYW1tYXRpY2FsbHkgZm9jdXNlZCwgaW4gd2hpY2ggY2FzZSB3ZSBzaG91bGQgbWFyayB0aGUgb3JpZ2luIGFzXG4gICAgLy8gICAgJ3Byb2dyYW0nLlxuICAgIGlmICh0aGlzLl9vcmlnaW4pIHtcbiAgICAgIHJldHVybiB0aGlzLl9vcmlnaW47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3dpbmRvd0ZvY3VzZWQgJiYgdGhpcy5fbGFzdEZvY3VzT3JpZ2luKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbGFzdEZvY3VzT3JpZ2luO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fd2FzQ2F1c2VkQnlUb3VjaChldmVudCkpIHtcbiAgICAgIHJldHVybiAndG91Y2gnO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJ3Byb2dyYW0nO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBmb2N1cyBjbGFzc2VzIG9uIHRoZSBlbGVtZW50IGJhc2VkIG9uIHRoZSBnaXZlbiBmb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHVwZGF0ZSB0aGUgY2xhc3NlcyBvbi5cbiAgICogQHBhcmFtIG9yaWdpbiBUaGUgZm9jdXMgb3JpZ2luLlxuICAgKi9cbiAgcHJpdmF0ZSBfc2V0Q2xhc3NlcyhlbGVtZW50OiBIVE1MRWxlbWVudCwgb3JpZ2luPzogRm9jdXNPcmlnaW4pOiB2b2lkIHtcbiAgICB0aGlzLl90b2dnbGVDbGFzcyhlbGVtZW50LCAnY2RrLWZvY3VzZWQnLCAhIW9yaWdpbik7XG4gICAgdGhpcy5fdG9nZ2xlQ2xhc3MoZWxlbWVudCwgJ2Nkay10b3VjaC1mb2N1c2VkJywgb3JpZ2luID09PSAndG91Y2gnKTtcbiAgICB0aGlzLl90b2dnbGVDbGFzcyhlbGVtZW50LCAnY2RrLWtleWJvYXJkLWZvY3VzZWQnLCBvcmlnaW4gPT09ICdrZXlib2FyZCcpO1xuICAgIHRoaXMuX3RvZ2dsZUNsYXNzKGVsZW1lbnQsICdjZGstbW91c2UtZm9jdXNlZCcsIG9yaWdpbiA9PT0gJ21vdXNlJyk7XG4gICAgdGhpcy5fdG9nZ2xlQ2xhc3MoZWxlbWVudCwgJ2Nkay1wcm9ncmFtLWZvY3VzZWQnLCBvcmlnaW4gPT09ICdwcm9ncmFtJyk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgb3JpZ2luIGFuZCBzY2hlZHVsZXMgYW4gYXN5bmMgZnVuY3Rpb24gdG8gY2xlYXIgaXQgYXQgdGhlIGVuZCBvZiB0aGUgZXZlbnQgcXVldWUuXG4gICAqIElmIHRoZSBkZXRlY3Rpb24gbW9kZSBpcyAnZXZlbnR1YWwnLCB0aGUgb3JpZ2luIGlzIG5ldmVyIGNsZWFyZWQuXG4gICAqIEBwYXJhbSBvcmlnaW4gVGhlIG9yaWdpbiB0byBzZXQuXG4gICAqL1xuICBwcml2YXRlIF9zZXRPcmlnaW5Gb3JDdXJyZW50RXZlbnRRdWV1ZShvcmlnaW46IEZvY3VzT3JpZ2luKTogdm9pZCB7XG4gICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHRoaXMuX29yaWdpbiA9IG9yaWdpbjtcblxuICAgICAgaWYgKHRoaXMuX2RldGVjdGlvbk1vZGUgPT09IEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGUuSU1NRURJQVRFKSB7XG4gICAgICAgIC8vIFNvbWV0aW1lcyB0aGUgZm9jdXMgb3JpZ2luIHdvbid0IGJlIHZhbGlkIGluIEZpcmVmb3ggYmVjYXVzZSBGaXJlZm94IHNlZW1zIHRvIGZvY3VzICpvbmUqXG4gICAgICAgIC8vIHRpY2sgYWZ0ZXIgdGhlIGludGVyYWN0aW9uIGV2ZW50IGZpcmVkLiBUbyBlbnN1cmUgdGhlIGZvY3VzIG9yaWdpbiBpcyBhbHdheXMgY29ycmVjdCxcbiAgICAgICAgLy8gdGhlIGZvY3VzIG9yaWdpbiB3aWxsIGJlIGRldGVybWluZWQgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgbmV4dCB0aWNrLlxuICAgICAgICB0aGlzLl9vcmlnaW5UaW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX29yaWdpbiA9IG51bGwsIDEpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSBnaXZlbiBmb2N1cyBldmVudCB3YXMgY2F1c2VkIGJ5IGEgdG91Y2hzdGFydCBldmVudC5cbiAgICogQHBhcmFtIGV2ZW50IFRoZSBmb2N1cyBldmVudCB0byBjaGVjay5cbiAgICogQHJldHVybnMgV2hldGhlciB0aGUgZXZlbnQgd2FzIGNhdXNlZCBieSBhIHRvdWNoLlxuICAgKi9cbiAgcHJpdmF0ZSBfd2FzQ2F1c2VkQnlUb3VjaChldmVudDogRm9jdXNFdmVudCk6IGJvb2xlYW4ge1xuICAgIC8vIE5vdGUobW1hbGVyYmEpOiBUaGlzIGltcGxlbWVudGF0aW9uIGlzIG5vdCBxdWl0ZSBwZXJmZWN0LCB0aGVyZSBpcyBhIHNtYWxsIGVkZ2UgY2FzZS5cbiAgICAvLyBDb25zaWRlciB0aGUgZm9sbG93aW5nIGRvbSBzdHJ1Y3R1cmU6XG4gICAgLy9cbiAgICAvLyA8ZGl2ICNwYXJlbnQgdGFiaW5kZXg9XCIwXCIgY2RrRm9jdXNDbGFzc2VzPlxuICAgIC8vICAgPGRpdiAjY2hpbGQgKGNsaWNrKT1cIiNwYXJlbnQuZm9jdXMoKVwiPjwvZGl2PlxuICAgIC8vIDwvZGl2PlxuICAgIC8vXG4gICAgLy8gSWYgdGhlIHVzZXIgdG91Y2hlcyB0aGUgI2NoaWxkIGVsZW1lbnQgYW5kIHRoZSAjcGFyZW50IGlzIHByb2dyYW1tYXRpY2FsbHkgZm9jdXNlZCBhcyBhXG4gICAgLy8gcmVzdWx0LCB0aGlzIGNvZGUgd2lsbCBzdGlsbCBjb25zaWRlciBpdCB0byBoYXZlIGJlZW4gY2F1c2VkIGJ5IHRoZSB0b3VjaCBldmVudCBhbmQgd2lsbFxuICAgIC8vIGFwcGx5IHRoZSBjZGstdG91Y2gtZm9jdXNlZCBjbGFzcyByYXRoZXIgdGhhbiB0aGUgY2RrLXByb2dyYW0tZm9jdXNlZCBjbGFzcy4gVGhpcyBpcyBhXG4gICAgLy8gcmVsYXRpdmVseSBzbWFsbCBlZGdlLWNhc2UgdGhhdCBjYW4gYmUgd29ya2VkIGFyb3VuZCBieSB1c2luZ1xuICAgIC8vIGZvY3VzVmlhKHBhcmVudEVsLCAncHJvZ3JhbScpIHRvIGZvY3VzIHRoZSBwYXJlbnQgZWxlbWVudC5cbiAgICAvL1xuICAgIC8vIElmIHdlIGRlY2lkZSB0aGF0IHdlIGFic29sdXRlbHkgbXVzdCBoYW5kbGUgdGhpcyBjYXNlIGNvcnJlY3RseSwgd2UgY2FuIGRvIHNvIGJ5IGxpc3RlbmluZ1xuICAgIC8vIGZvciB0aGUgZmlyc3QgZm9jdXMgZXZlbnQgYWZ0ZXIgdGhlIHRvdWNoc3RhcnQsIGFuZCB0aGVuIHRoZSBmaXJzdCBibHVyIGV2ZW50IGFmdGVyIHRoYXRcbiAgICAvLyBmb2N1cyBldmVudC4gV2hlbiB0aGF0IGJsdXIgZXZlbnQgZmlyZXMgd2Uga25vdyB0aGF0IHdoYXRldmVyIGZvbGxvd3MgaXMgbm90IGEgcmVzdWx0IG9mIHRoZVxuICAgIC8vIHRvdWNoc3RhcnQuXG4gICAgY29uc3QgZm9jdXNUYXJnZXQgPSBnZXRUYXJnZXQoZXZlbnQpO1xuICAgIHJldHVybiB0aGlzLl9sYXN0VG91Y2hUYXJnZXQgaW5zdGFuY2VvZiBOb2RlICYmIGZvY3VzVGFyZ2V0IGluc3RhbmNlb2YgTm9kZSAmJlxuICAgICAgICAoZm9jdXNUYXJnZXQgPT09IHRoaXMuX2xhc3RUb3VjaFRhcmdldCB8fCBmb2N1c1RhcmdldC5jb250YWlucyh0aGlzLl9sYXN0VG91Y2hUYXJnZXQpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIGZvY3VzIGV2ZW50cyBvbiBhIHJlZ2lzdGVyZWQgZWxlbWVudC5cbiAgICogQHBhcmFtIGV2ZW50IFRoZSBmb2N1cyBldmVudC5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIG1vbml0b3JlZCBlbGVtZW50LlxuICAgKi9cbiAgcHJpdmF0ZSBfb25Gb2N1cyhldmVudDogRm9jdXNFdmVudCwgZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgICAvLyBOT1RFKG1tYWxlcmJhKTogV2UgY3VycmVudGx5IHNldCB0aGUgY2xhc3NlcyBiYXNlZCBvbiB0aGUgZm9jdXMgb3JpZ2luIG9mIHRoZSBtb3N0IHJlY2VudFxuICAgIC8vIGZvY3VzIGV2ZW50IGFmZmVjdGluZyB0aGUgbW9uaXRvcmVkIGVsZW1lbnQuIElmIHdlIHdhbnQgdG8gdXNlIHRoZSBvcmlnaW4gb2YgdGhlIGZpcnN0IGV2ZW50XG4gICAgLy8gaW5zdGVhZCB3ZSBzaG91bGQgY2hlY2sgZm9yIHRoZSBjZGstZm9jdXNlZCBjbGFzcyBoZXJlIGFuZCByZXR1cm4gaWYgdGhlIGVsZW1lbnQgYWxyZWFkeSBoYXNcbiAgICAvLyBpdC4gKFRoaXMgb25seSBtYXR0ZXJzIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgaW5jbHVkZXNDaGlsZHJlbiA9IHRydWUpLlxuXG4gICAgLy8gSWYgd2UgYXJlIG5vdCBjb3VudGluZyBjaGlsZC1lbGVtZW50LWZvY3VzIGFzIGZvY3VzZWQsIG1ha2Ugc3VyZSB0aGF0IHRoZSBldmVudCB0YXJnZXQgaXMgdGhlXG4gICAgLy8gbW9uaXRvcmVkIGVsZW1lbnQgaXRzZWxmLlxuICAgIGNvbnN0IGVsZW1lbnRJbmZvID0gdGhpcy5fZWxlbWVudEluZm8uZ2V0KGVsZW1lbnQpO1xuICAgIGlmICghZWxlbWVudEluZm8gfHwgKCFlbGVtZW50SW5mby5jaGVja0NoaWxkcmVuICYmIGVsZW1lbnQgIT09IGdldFRhcmdldChldmVudCkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fb3JpZ2luQ2hhbmdlZChlbGVtZW50LCB0aGlzLl9nZXRGb2N1c09yaWdpbihldmVudCksIGVsZW1lbnRJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIGJsdXIgZXZlbnRzIG9uIGEgcmVnaXN0ZXJlZCBlbGVtZW50LlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIGJsdXIgZXZlbnQuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBtb25pdG9yZWQgZWxlbWVudC5cbiAgICovXG4gIF9vbkJsdXIoZXZlbnQ6IEZvY3VzRXZlbnQsIGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgLy8gSWYgd2UgYXJlIGNvdW50aW5nIGNoaWxkLWVsZW1lbnQtZm9jdXMgYXMgZm9jdXNlZCwgbWFrZSBzdXJlIHRoYXQgd2UgYXJlbid0IGp1c3QgYmx1cnJpbmcgaW5cbiAgICAvLyBvcmRlciB0byBmb2N1cyBhbm90aGVyIGNoaWxkIG9mIHRoZSBtb25pdG9yZWQgZWxlbWVudC5cbiAgICBjb25zdCBlbGVtZW50SW5mbyA9IHRoaXMuX2VsZW1lbnRJbmZvLmdldChlbGVtZW50KTtcblxuICAgIGlmICghZWxlbWVudEluZm8gfHwgKGVsZW1lbnRJbmZvLmNoZWNrQ2hpbGRyZW4gJiYgZXZlbnQucmVsYXRlZFRhcmdldCBpbnN0YW5jZW9mIE5vZGUgJiZcbiAgICAgICAgZWxlbWVudC5jb250YWlucyhldmVudC5yZWxhdGVkVGFyZ2V0KSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9zZXRDbGFzc2VzKGVsZW1lbnQpO1xuICAgIHRoaXMuX2VtaXRPcmlnaW4oZWxlbWVudEluZm8uc3ViamVjdCwgbnVsbCk7XG4gIH1cblxuICBwcml2YXRlIF9lbWl0T3JpZ2luKHN1YmplY3Q6IFN1YmplY3Q8Rm9jdXNPcmlnaW4+LCBvcmlnaW46IEZvY3VzT3JpZ2luKSB7XG4gICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiBzdWJqZWN0Lm5leHQob3JpZ2luKSk7XG4gIH1cblxuICBwcml2YXRlIF9yZWdpc3Rlckdsb2JhbExpc3RlbmVycyhlbGVtZW50SW5mbzogTW9uaXRvcmVkRWxlbWVudEluZm8pIHtcbiAgICBpZiAoIXRoaXMuX3BsYXRmb3JtLmlzQnJvd3Nlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHJvb3ROb2RlID0gZWxlbWVudEluZm8ucm9vdE5vZGU7XG4gICAgY29uc3Qgcm9vdE5vZGVGb2N1c0xpc3RlbmVycyA9IHRoaXMuX3Jvb3ROb2RlRm9jdXNMaXN0ZW5lckNvdW50LmdldChyb290Tm9kZSkgfHwgMDtcblxuICAgIGlmICghcm9vdE5vZGVGb2N1c0xpc3RlbmVycykge1xuICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgcm9vdE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCB0aGlzLl9yb290Tm9kZUZvY3VzQW5kQmx1ckxpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICAgIHJvb3ROb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCB0aGlzLl9yb290Tm9kZUZvY3VzQW5kQmx1ckxpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5zZXQocm9vdE5vZGUsIHJvb3ROb2RlRm9jdXNMaXN0ZW5lcnMgKyAxKTtcblxuICAgIC8vIFJlZ2lzdGVyIGdsb2JhbCBsaXN0ZW5lcnMgd2hlbiBmaXJzdCBlbGVtZW50IGlzIG1vbml0b3JlZC5cbiAgICBpZiAoKyt0aGlzLl9tb25pdG9yZWRFbGVtZW50Q291bnQgPT09IDEpIHtcbiAgICAgIC8vIE5vdGU6IHdlIGxpc3RlbiB0byBldmVudHMgaW4gdGhlIGNhcHR1cmUgcGhhc2Ugc28gd2VcbiAgICAgIC8vIGNhbiBkZXRlY3QgdGhlbSBldmVuIGlmIHRoZSB1c2VyIHN0b3BzIHByb3BhZ2F0aW9uLlxuICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgY29uc3QgZG9jdW1lbnQgPSB0aGlzLl9nZXREb2N1bWVudCgpO1xuICAgICAgICBjb25zdCB3aW5kb3cgPSB0aGlzLl9nZXRXaW5kb3coKTtcblxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fZG9jdW1lbnRLZXlkb3duTGlzdGVuZXIsXG4gICAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fZG9jdW1lbnRNb3VzZWRvd25MaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5fZG9jdW1lbnRUb3VjaHN0YXJ0TGlzdGVuZXIsXG4gICAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5fd2luZG93Rm9jdXNMaXN0ZW5lcik7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9yZW1vdmVHbG9iYWxMaXN0ZW5lcnMoZWxlbWVudEluZm86IE1vbml0b3JlZEVsZW1lbnRJbmZvKSB7XG4gICAgY29uc3Qgcm9vdE5vZGUgPSBlbGVtZW50SW5mby5yb290Tm9kZTtcblxuICAgIGlmICh0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5oYXMocm9vdE5vZGUpKSB7XG4gICAgICBjb25zdCByb290Tm9kZUZvY3VzTGlzdGVuZXJzID0gdGhpcy5fcm9vdE5vZGVGb2N1c0xpc3RlbmVyQ291bnQuZ2V0KHJvb3ROb2RlKSE7XG5cbiAgICAgIGlmIChyb290Tm9kZUZvY3VzTGlzdGVuZXJzID4gMSkge1xuICAgICAgICB0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5zZXQocm9vdE5vZGUsIHJvb3ROb2RlRm9jdXNMaXN0ZW5lcnMgLSAxKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJvb3ROb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5fcm9vdE5vZGVGb2N1c0FuZEJsdXJMaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgICByb290Tm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdibHVyJywgdGhpcy5fcm9vdE5vZGVGb2N1c0FuZEJsdXJMaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgICB0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5kZWxldGUocm9vdE5vZGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFVucmVnaXN0ZXIgZ2xvYmFsIGxpc3RlbmVycyB3aGVuIGxhc3QgZWxlbWVudCBpcyB1bm1vbml0b3JlZC5cbiAgICBpZiAoIS0tdGhpcy5fbW9uaXRvcmVkRWxlbWVudENvdW50KSB7XG4gICAgICBjb25zdCBkb2N1bWVudCA9IHRoaXMuX2dldERvY3VtZW50KCk7XG4gICAgICBjb25zdCB3aW5kb3cgPSB0aGlzLl9nZXRXaW5kb3coKTtcblxuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX2RvY3VtZW50S2V5ZG93bkxpc3RlbmVyLFxuICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fZG9jdW1lbnRNb3VzZWRvd25MaXN0ZW5lcixcbiAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9kb2N1bWVudFRvdWNoc3RhcnRMaXN0ZW5lcixcbiAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMuX3dpbmRvd0ZvY3VzTGlzdGVuZXIpO1xuXG4gICAgICAvLyBDbGVhciB0aW1lb3V0cyBmb3IgYWxsIHBvdGVudGlhbGx5IHBlbmRpbmcgdGltZW91dHMgdG8gcHJldmVudCB0aGUgbGVha3MuXG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fd2luZG93Rm9jdXNUaW1lb3V0SWQpO1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3RvdWNoVGltZW91dElkKTtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9vcmlnaW5UaW1lb3V0SWQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBVcGRhdGVzIGFsbCB0aGUgc3RhdGUgb24gYW4gZWxlbWVudCBvbmNlIGl0cyBmb2N1cyBvcmlnaW4gaGFzIGNoYW5nZWQuICovXG4gIHByaXZhdGUgX29yaWdpbkNoYW5nZWQoZWxlbWVudDogSFRNTEVsZW1lbnQsIG9yaWdpbjogRm9jdXNPcmlnaW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudEluZm86IE1vbml0b3JlZEVsZW1lbnRJbmZvKSB7XG4gICAgdGhpcy5fc2V0Q2xhc3NlcyhlbGVtZW50LCBvcmlnaW4pO1xuICAgIHRoaXMuX2VtaXRPcmlnaW4oZWxlbWVudEluZm8uc3ViamVjdCwgb3JpZ2luKTtcbiAgICB0aGlzLl9sYXN0Rm9jdXNPcmlnaW4gPSBvcmlnaW47XG4gIH1cblxuICAvKipcbiAgICogQ29sbGVjdHMgdGhlIGBNb25pdG9yZWRFbGVtZW50SW5mb2Agb2YgYSBwYXJ0aWN1bGFyIGVsZW1lbnQgYW5kXG4gICAqIGFsbCBvZiBpdHMgYW5jZXN0b3JzIHRoYXQgaGF2ZSBlbmFibGVkIGBjaGVja0NoaWxkcmVuYC5cbiAgICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCBmcm9tIHdoaWNoIHRvIHN0YXJ0IHRoZSBzZWFyY2guXG4gICAqL1xuICBwcml2YXRlIF9nZXRDbG9zZXN0RWxlbWVudHNJbmZvKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogW0hUTUxFbGVtZW50LCBNb25pdG9yZWRFbGVtZW50SW5mb11bXSB7XG4gICAgY29uc3QgcmVzdWx0czogW0hUTUxFbGVtZW50LCBNb25pdG9yZWRFbGVtZW50SW5mb11bXSA9IFtdO1xuXG4gICAgdGhpcy5fZWxlbWVudEluZm8uZm9yRWFjaCgoaW5mbywgY3VycmVudEVsZW1lbnQpID0+IHtcbiAgICAgIGlmIChjdXJyZW50RWxlbWVudCA9PT0gZWxlbWVudCB8fCAoaW5mby5jaGVja0NoaWxkcmVuICYmIGN1cnJlbnRFbGVtZW50LmNvbnRhaW5zKGVsZW1lbnQpKSkge1xuICAgICAgICByZXN1bHRzLnB1c2goW2N1cnJlbnRFbGVtZW50LCBpbmZvXSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxufVxuXG4vKiogR2V0cyB0aGUgdGFyZ2V0IG9mIGFuIGV2ZW50LCBhY2NvdW50aW5nIGZvciBTaGFkb3cgRE9NLiAqL1xuZnVuY3Rpb24gZ2V0VGFyZ2V0KGV2ZW50OiBFdmVudCk6IEhUTUxFbGVtZW50fG51bGwge1xuICAvLyBJZiBhbiBldmVudCBpcyBib3VuZCBvdXRzaWRlIHRoZSBTaGFkb3cgRE9NLCB0aGUgYGV2ZW50LnRhcmdldGAgd2lsbFxuICAvLyBwb2ludCB0byB0aGUgc2hhZG93IHJvb3Qgc28gd2UgaGF2ZSB0byB1c2UgYGNvbXBvc2VkUGF0aGAgaW5zdGVhZC5cbiAgcmV0dXJuIChldmVudC5jb21wb3NlZFBhdGggPyBldmVudC5jb21wb3NlZFBhdGgoKVswXSA6IGV2ZW50LnRhcmdldCkgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xufVxuXG5cbi8qKlxuICogRGlyZWN0aXZlIHRoYXQgZGV0ZXJtaW5lcyBob3cgYSBwYXJ0aWN1bGFyIGVsZW1lbnQgd2FzIGZvY3VzZWQgKHZpYSBrZXlib2FyZCwgbW91c2UsIHRvdWNoLCBvclxuICogcHJvZ3JhbW1hdGljYWxseSkgYW5kIGFkZHMgY29ycmVzcG9uZGluZyBjbGFzc2VzIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIFRoZXJlIGFyZSB0d28gdmFyaWFudHMgb2YgdGhpcyBkaXJlY3RpdmU6XG4gKiAxKSBjZGtNb25pdG9yRWxlbWVudEZvY3VzOiBkb2VzIG5vdCBjb25zaWRlciBhbiBlbGVtZW50IHRvIGJlIGZvY3VzZWQgaWYgb25lIG9mIGl0cyBjaGlsZHJlbiBpc1xuICogICAgZm9jdXNlZC5cbiAqIDIpIGNka01vbml0b3JTdWJ0cmVlRm9jdXM6IGNvbnNpZGVycyBhbiBlbGVtZW50IGZvY3VzZWQgaWYgaXQgb3IgYW55IG9mIGl0cyBjaGlsZHJlbiBhcmUgZm9jdXNlZC5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka01vbml0b3JFbGVtZW50Rm9jdXNdLCBbY2RrTW9uaXRvclN1YnRyZWVGb2N1c10nLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtNb25pdG9yRm9jdXMgaW1wbGVtZW50cyBBZnRlclZpZXdJbml0LCBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9tb25pdG9yU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb247XG4gIEBPdXRwdXQoKSBjZGtGb2N1c0NoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8Rm9jdXNPcmlnaW4+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sIHByaXZhdGUgX2ZvY3VzTW9uaXRvcjogRm9jdXNNb25pdG9yKSB7fVxuXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcbiAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50O1xuICAgIHRoaXMuX21vbml0b3JTdWJzY3JpcHRpb24gPSB0aGlzLl9mb2N1c01vbml0b3IubW9uaXRvcihcbiAgICAgIGVsZW1lbnQsXG4gICAgICBlbGVtZW50Lm5vZGVUeXBlID09PSAxICYmIGVsZW1lbnQuaGFzQXR0cmlidXRlKCdjZGtNb25pdG9yU3VidHJlZUZvY3VzJykpXG4gICAgLnN1YnNjcmliZShvcmlnaW4gPT4gdGhpcy5jZGtGb2N1c0NoYW5nZS5lbWl0KG9yaWdpbikpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fZm9jdXNNb25pdG9yLnN0b3BNb25pdG9yaW5nKHRoaXMuX2VsZW1lbnRSZWYpO1xuXG4gICAgaWYgKHRoaXMuX21vbml0b3JTdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuX21vbml0b3JTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==