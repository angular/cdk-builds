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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXMtbW9uaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvYTExeS9mb2N1cy1tb25pdG9yL2ZvY3VzLW1vbml0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBRSwrQkFBK0IsRUFBRSxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNoRyxPQUFPLEVBQ0wsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osTUFBTSxFQUNOLFVBQVUsRUFDVixjQUFjLEVBQ2QsTUFBTSxFQUVOLFFBQVEsRUFDUixNQUFNLEdBRVAsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFhLEVBQUUsSUFBSSxZQUFZLEVBQUUsT0FBTyxFQUFlLE1BQU0sTUFBTSxDQUFDO0FBQzNFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUFDLCtCQUErQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7Ozs7QUFHbEUsa0dBQWtHO0FBQ2xHLGtEQUFrRDtBQUNsRCxNQUFNLENBQUMsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDO0FBa0NuQyw4Q0FBOEM7QUFDOUMsTUFBTSxDQUFDLE1BQU0sNkJBQTZCLEdBQ3RDLElBQUksY0FBYyxDQUFzQixtQ0FBbUMsQ0FBQyxDQUFDO0FBUWpGOzs7R0FHRztBQUNILE1BQU0sMkJBQTJCLEdBQUcsK0JBQStCLENBQUM7SUFDbEUsT0FBTyxFQUFFLElBQUk7SUFDYixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUMsQ0FBQztBQUdILGlGQUFpRjtBQUVqRixNQUFNLE9BQU8sWUFBWTtJQWlHdkIsWUFDWSxPQUFlLEVBQ2YsU0FBbUI7SUFDM0IscURBQXFEO0lBQ3ZCLFFBQWtCLEVBQ0csT0FDdkI7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QUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FDcEQsT0FBTyxFQUNQLE9BQU8sQ0FBQyxRQUFRLEtBQUssQ0FBQyxJQUFJLE9BQU8sQ0FBQyxZQUFZLENBQUMsd0JBQXdCLENBQUMsQ0FBQzthQUMxRSxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRXBELElBQUksSUFBSSxDQUFDLG9CQUFvQixFQUFFO1lBQzdCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQztTQUN6QztJQUNILENBQUM7OztZQXZCRixTQUFTLFNBQUM7Z0JBQ1QsUUFBUSxFQUFFLG9EQUFvRDthQUMvRDs7O1lBdmtCQyxVQUFVO1lBNGtCdUUsWUFBWTs7OzZCQUY1RixNQUFNIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UGxhdGZvcm0sIG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMsIF9nZXRTaGFkb3dSb290fSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIEluamVjdCxcbiAgSW5qZWN0YWJsZSxcbiAgSW5qZWN0aW9uVG9rZW4sXG4gIE5nWm9uZSxcbiAgT25EZXN0cm95LFxuICBPcHRpb25hbCxcbiAgT3V0cHV0LFxuICBBZnRlclZpZXdJbml0LFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgb2YgYXMgb2JzZXJ2YWJsZU9mLCBTdWJqZWN0LCBTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtjb2VyY2VFbGVtZW50fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7aXNGYWtlTW91c2Vkb3duRnJvbVNjcmVlblJlYWRlcn0gZnJvbSAnLi4vZmFrZS1tb3VzZWRvd24nO1xuXG5cbi8vIFRoaXMgaXMgdGhlIHZhbHVlIHVzZWQgYnkgQW5ndWxhckpTIE1hdGVyaWFsLiBUaHJvdWdoIHRyaWFsIGFuZCBlcnJvciAob24gaVBob25lIDZTKSB0aGV5IGZvdW5kXG4vLyB0aGF0IGEgdmFsdWUgb2YgYXJvdW5kIDY1MG1zIHNlZW1zIGFwcHJvcHJpYXRlLlxuZXhwb3J0IGNvbnN0IFRPVUNIX0JVRkZFUl9NUyA9IDY1MDtcblxuXG5leHBvcnQgdHlwZSBGb2N1c09yaWdpbiA9ICd0b3VjaCcgfCAnbW91c2UnIHwgJ2tleWJvYXJkJyB8ICdwcm9ncmFtJyB8IG51bGw7XG5cbi8qKlxuICogQ29ycmVzcG9uZHMgdG8gdGhlIG9wdGlvbnMgdGhhdCBjYW4gYmUgcGFzc2VkIHRvIHRoZSBuYXRpdmUgYGZvY3VzYCBldmVudC5cbiAqIHZpYSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvSFRNTEVsZW1lbnQvZm9jdXNcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBGb2N1c09wdGlvbnMge1xuICAvKiogV2hldGhlciB0aGUgYnJvd3NlciBzaG91bGQgc2Nyb2xsIHRvIHRoZSBlbGVtZW50IHdoZW4gaXQgaXMgZm9jdXNlZC4gKi9cbiAgcHJldmVudFNjcm9sbD86IGJvb2xlYW47XG59XG5cbi8qKiBEZXRlY3Rpb24gbW9kZSB1c2VkIGZvciBhdHRyaWJ1dGluZyB0aGUgb3JpZ2luIG9mIGEgZm9jdXMgZXZlbnQuICovXG5leHBvcnQgY29uc3QgZW51bSBGb2N1c01vbml0b3JEZXRlY3Rpb25Nb2RlIHtcbiAgLyoqXG4gICAqIEFueSBtb3VzZWRvd24sIGtleWRvd24sIG9yIHRvdWNoc3RhcnQgZXZlbnQgdGhhdCBoYXBwZW5lZCBpbiB0aGUgcHJldmlvdXNcbiAgICogdGljayBvciB0aGUgY3VycmVudCB0aWNrIHdpbGwgYmUgdXNlZCB0byBhc3NpZ24gYSBmb2N1cyBldmVudCdzIG9yaWdpbiAodG9cbiAgICogZWl0aGVyIG1vdXNlLCBrZXlib2FyZCwgb3IgdG91Y2gpLiBUaGlzIGlzIHRoZSBkZWZhdWx0IG9wdGlvbi5cbiAgICovXG4gIElNTUVESUFURSxcbiAgLyoqXG4gICAqIEEgZm9jdXMgZXZlbnQncyBvcmlnaW4gaXMgYWx3YXlzIGF0dHJpYnV0ZWQgdG8gdGhlIGxhc3QgY29ycmVzcG9uZGluZ1xuICAgKiBtb3VzZWRvd24sIGtleWRvd24sIG9yIHRvdWNoc3RhcnQgZXZlbnQsIG5vIG1hdHRlciBob3cgbG9uZyBhZ28gaXQgb2NjdXJlZC5cbiAgICovXG4gIEVWRU5UVUFMXG59XG5cbi8qKiBJbmplY3RhYmxlIHNlcnZpY2UtbGV2ZWwgb3B0aW9ucyBmb3IgRm9jdXNNb25pdG9yLiAqL1xuZXhwb3J0IGludGVyZmFjZSBGb2N1c01vbml0b3JPcHRpb25zIHtcbiAgZGV0ZWN0aW9uTW9kZT86IEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGU7XG59XG5cbi8qKiBJbmplY3Rpb25Ub2tlbiBmb3IgRm9jdXNNb25pdG9yT3B0aW9ucy4gKi9cbmV4cG9ydCBjb25zdCBGT0NVU19NT05JVE9SX0RFRkFVTFRfT1BUSU9OUyA9XG4gICAgbmV3IEluamVjdGlvblRva2VuPEZvY3VzTW9uaXRvck9wdGlvbnM+KCdjZGstZm9jdXMtbW9uaXRvci1kZWZhdWx0LW9wdGlvbnMnKTtcblxudHlwZSBNb25pdG9yZWRFbGVtZW50SW5mbyA9IHtcbiAgY2hlY2tDaGlsZHJlbjogYm9vbGVhbixcbiAgc3ViamVjdDogU3ViamVjdDxGb2N1c09yaWdpbj4sXG4gIHJvb3ROb2RlOiBIVE1MRWxlbWVudHxTaGFkb3dSb290fERvY3VtZW50XG59O1xuXG4vKipcbiAqIEV2ZW50IGxpc3RlbmVyIG9wdGlvbnMgdGhhdCBlbmFibGUgY2FwdHVyaW5nIGFuZCBhbHNvXG4gKiBtYXJrIHRoZSBsaXN0ZW5lciBhcyBwYXNzaXZlIGlmIHRoZSBicm93c2VyIHN1cHBvcnRzIGl0LlxuICovXG5jb25zdCBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMgPSBub3JtYWxpemVQYXNzaXZlTGlzdGVuZXJPcHRpb25zKHtcbiAgcGFzc2l2ZTogdHJ1ZSxcbiAgY2FwdHVyZTogdHJ1ZVxufSk7XG5cblxuLyoqIE1vbml0b3JzIG1vdXNlIGFuZCBrZXlib2FyZCBldmVudHMgdG8gZGV0ZXJtaW5lIHRoZSBjYXVzZSBvZiBmb2N1cyBldmVudHMuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBGb2N1c01vbml0b3IgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogVGhlIGZvY3VzIG9yaWdpbiB0aGF0IHRoZSBuZXh0IGZvY3VzIGV2ZW50IGlzIGEgcmVzdWx0IG9mLiAqL1xuICBwcml2YXRlIF9vcmlnaW46IEZvY3VzT3JpZ2luID0gbnVsbDtcblxuICAvKiogVGhlIEZvY3VzT3JpZ2luIG9mIHRoZSBsYXN0IGZvY3VzIGV2ZW50IHRyYWNrZWQgYnkgdGhlIEZvY3VzTW9uaXRvci4gKi9cbiAgcHJpdmF0ZSBfbGFzdEZvY3VzT3JpZ2luOiBGb2N1c09yaWdpbjtcblxuICAvKiogV2hldGhlciB0aGUgd2luZG93IGhhcyBqdXN0IGJlZW4gZm9jdXNlZC4gKi9cbiAgcHJpdmF0ZSBfd2luZG93Rm9jdXNlZCA9IGZhbHNlO1xuXG4gIC8qKiBUaGUgdGFyZ2V0IG9mIHRoZSBsYXN0IHRvdWNoIGV2ZW50LiAqL1xuICBwcml2YXRlIF9sYXN0VG91Y2hUYXJnZXQ6IEV2ZW50VGFyZ2V0IHwgbnVsbDtcblxuICAvKiogVGhlIHRpbWVvdXQgaWQgb2YgdGhlIHRvdWNoIHRpbWVvdXQsIHVzZWQgdG8gY2FuY2VsIHRpbWVvdXQgbGF0ZXIuICovXG4gIHByaXZhdGUgX3RvdWNoVGltZW91dElkOiBudW1iZXI7XG5cbiAgLyoqIFRoZSB0aW1lb3V0IGlkIG9mIHRoZSB3aW5kb3cgZm9jdXMgdGltZW91dC4gKi9cbiAgcHJpdmF0ZSBfd2luZG93Rm9jdXNUaW1lb3V0SWQ6IG51bWJlcjtcblxuICAvKiogVGhlIHRpbWVvdXQgaWQgb2YgdGhlIG9yaWdpbiBjbGVhcmluZyB0aW1lb3V0LiAqL1xuICBwcml2YXRlIF9vcmlnaW5UaW1lb3V0SWQ6IG51bWJlcjtcblxuICAvKiogTWFwIG9mIGVsZW1lbnRzIGJlaW5nIG1vbml0b3JlZCB0byB0aGVpciBpbmZvLiAqL1xuICBwcml2YXRlIF9lbGVtZW50SW5mbyA9IG5ldyBNYXA8SFRNTEVsZW1lbnQsIE1vbml0b3JlZEVsZW1lbnRJbmZvPigpO1xuXG4gIC8qKiBUaGUgbnVtYmVyIG9mIGVsZW1lbnRzIGN1cnJlbnRseSBiZWluZyBtb25pdG9yZWQuICovXG4gIHByaXZhdGUgX21vbml0b3JlZEVsZW1lbnRDb3VudCA9IDA7XG5cbiAgLyoqXG4gICAqIEtlZXBzIHRyYWNrIG9mIHRoZSByb290IG5vZGVzIHRvIHdoaWNoIHdlJ3ZlIGN1cnJlbnRseSBib3VuZCBhIGZvY3VzL2JsdXIgaGFuZGxlcixcbiAgICogYXMgd2VsbCBhcyB0aGUgbnVtYmVyIG9mIG1vbml0b3JlZCBlbGVtZW50cyB0aGF0IHRoZXkgY29udGFpbi4gV2UgaGF2ZSB0byB0cmVhdCBmb2N1cy9ibHVyXG4gICAqIGhhbmRsZXJzIGRpZmZlcmVudGx5IGZyb20gdGhlIHJlc3Qgb2YgdGhlIGV2ZW50cywgYmVjYXVzZSB0aGUgYnJvd3NlciB3b24ndCBlbWl0IGV2ZW50c1xuICAgKiB0byB0aGUgZG9jdW1lbnQgd2hlbiBmb2N1cyBtb3ZlcyBpbnNpZGUgb2YgYSBzaGFkb3cgcm9vdC5cbiAgICovXG4gIHByaXZhdGUgX3Jvb3ROb2RlRm9jdXNMaXN0ZW5lckNvdW50ID0gbmV3IE1hcDxIVE1MRWxlbWVudHxEb2N1bWVudHxTaGFkb3dSb290LCBudW1iZXI+KCk7XG5cbiAgLyoqXG4gICAqIFRoZSBzcGVjaWZpZWQgZGV0ZWN0aW9uIG1vZGUsIHVzZWQgZm9yIGF0dHJpYnV0aW5nIHRoZSBvcmlnaW4gb2YgYSBmb2N1c1xuICAgKiBldmVudC5cbiAgICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX2RldGVjdGlvbk1vZGU6IEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGU7XG5cbiAgLyoqXG4gICAqIEV2ZW50IGxpc3RlbmVyIGZvciBga2V5ZG93bmAgZXZlbnRzIG9uIHRoZSBkb2N1bWVudC5cbiAgICogTmVlZHMgdG8gYmUgYW4gYXJyb3cgZnVuY3Rpb24gaW4gb3JkZXIgdG8gcHJlc2VydmUgdGhlIGNvbnRleHQgd2hlbiBpdCBnZXRzIGJvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfZG9jdW1lbnRLZXlkb3duTGlzdGVuZXIgPSAoKSA9PiB7XG4gICAgLy8gT24ga2V5ZG93biByZWNvcmQgdGhlIG9yaWdpbiBhbmQgY2xlYXIgYW55IHRvdWNoIGV2ZW50IHRoYXQgbWF5IGJlIGluIHByb2dyZXNzLlxuICAgIHRoaXMuX2xhc3RUb3VjaFRhcmdldCA9IG51bGw7XG4gICAgdGhpcy5fc2V0T3JpZ2luRm9yQ3VycmVudEV2ZW50UXVldWUoJ2tleWJvYXJkJyk7XG4gIH1cblxuICAvKipcbiAgICogRXZlbnQgbGlzdGVuZXIgZm9yIGBtb3VzZWRvd25gIGV2ZW50cyBvbiB0aGUgZG9jdW1lbnQuXG4gICAqIE5lZWRzIHRvIGJlIGFuIGFycm93IGZ1bmN0aW9uIGluIG9yZGVyIHRvIHByZXNlcnZlIHRoZSBjb250ZXh0IHdoZW4gaXQgZ2V0cyBib3VuZC5cbiAgICovXG4gIHByaXZhdGUgX2RvY3VtZW50TW91c2Vkb3duTGlzdGVuZXIgPSAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAvLyBPbiBtb3VzZWRvd24gcmVjb3JkIHRoZSBvcmlnaW4gb25seSBpZiB0aGVyZSBpcyBub3QgdG91Y2hcbiAgICAvLyB0YXJnZXQsIHNpbmNlIGEgbW91c2Vkb3duIGNhbiBoYXBwZW4gYXMgYSByZXN1bHQgb2YgYSB0b3VjaCBldmVudC5cbiAgICBpZiAoIXRoaXMuX2xhc3RUb3VjaFRhcmdldCkge1xuICAgICAgLy8gSW4gc29tZSBjYXNlcyBzY3JlZW4gcmVhZGVycyBmaXJlIGZha2UgYG1vdXNlZG93bmAgZXZlbnRzIGluc3RlYWQgb2YgYGtleWRvd25gLlxuICAgICAgLy8gUmVzb2x2ZSB0aGUgZm9jdXMgc291cmNlIHRvIGBrZXlib2FyZGAgaWYgd2UgZGV0ZWN0IG9uZSBvZiB0aGVtLlxuICAgICAgY29uc3Qgc291cmNlID0gaXNGYWtlTW91c2Vkb3duRnJvbVNjcmVlblJlYWRlcihldmVudCkgPyAna2V5Ym9hcmQnIDogJ21vdXNlJztcbiAgICAgIHRoaXMuX3NldE9yaWdpbkZvckN1cnJlbnRFdmVudFF1ZXVlKHNvdXJjZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEV2ZW50IGxpc3RlbmVyIGZvciBgdG91Y2hzdGFydGAgZXZlbnRzIG9uIHRoZSBkb2N1bWVudC5cbiAgICogTmVlZHMgdG8gYmUgYW4gYXJyb3cgZnVuY3Rpb24gaW4gb3JkZXIgdG8gcHJlc2VydmUgdGhlIGNvbnRleHQgd2hlbiBpdCBnZXRzIGJvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfZG9jdW1lbnRUb3VjaHN0YXJ0TGlzdGVuZXIgPSAoZXZlbnQ6IFRvdWNoRXZlbnQpID0+IHtcbiAgICAvLyBXaGVuIHRoZSB0b3VjaHN0YXJ0IGV2ZW50IGZpcmVzIHRoZSBmb2N1cyBldmVudCBpcyBub3QgeWV0IGluIHRoZSBldmVudCBxdWV1ZS4gVGhpcyBtZWFuc1xuICAgIC8vIHdlIGNhbid0IHJlbHkgb24gdGhlIHRyaWNrIHVzZWQgYWJvdmUgKHNldHRpbmcgdGltZW91dCBvZiAxbXMpLiBJbnN0ZWFkIHdlIHdhaXQgNjUwbXMgdG9cbiAgICAvLyBzZWUgaWYgYSBmb2N1cyBoYXBwZW5zLlxuICAgIGlmICh0aGlzLl90b3VjaFRpbWVvdXRJZCAhPSBudWxsKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fdG91Y2hUaW1lb3V0SWQpO1xuICAgIH1cblxuICAgIHRoaXMuX2xhc3RUb3VjaFRhcmdldCA9IGdldFRhcmdldChldmVudCk7XG4gICAgdGhpcy5fdG91Y2hUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX2xhc3RUb3VjaFRhcmdldCA9IG51bGwsIFRPVUNIX0JVRkZFUl9NUyk7XG4gIH1cblxuICAvKipcbiAgICogRXZlbnQgbGlzdGVuZXIgZm9yIGBmb2N1c2AgZXZlbnRzIG9uIHRoZSB3aW5kb3cuXG4gICAqIE5lZWRzIHRvIGJlIGFuIGFycm93IGZ1bmN0aW9uIGluIG9yZGVyIHRvIHByZXNlcnZlIHRoZSBjb250ZXh0IHdoZW4gaXQgZ2V0cyBib3VuZC5cbiAgICovXG4gIHByaXZhdGUgX3dpbmRvd0ZvY3VzTGlzdGVuZXIgPSAoKSA9PiB7XG4gICAgLy8gTWFrZSBhIG5vdGUgb2Ygd2hlbiB0aGUgd2luZG93IHJlZ2FpbnMgZm9jdXMsIHNvIHdlIGNhblxuICAgIC8vIHJlc3RvcmUgdGhlIG9yaWdpbiBpbmZvIGZvciB0aGUgZm9jdXNlZCBlbGVtZW50LlxuICAgIHRoaXMuX3dpbmRvd0ZvY3VzZWQgPSB0cnVlO1xuICAgIHRoaXMuX3dpbmRvd0ZvY3VzVGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLl93aW5kb3dGb2N1c2VkID0gZmFsc2UpO1xuICB9XG5cbiAgLyoqIFVzZWQgdG8gcmVmZXJlbmNlIGNvcnJlY3QgZG9jdW1lbnQvd2luZG93ICovXG4gIHByb3RlY3RlZCBfZG9jdW1lbnQ/OiBEb2N1bWVudDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgICAgcHJpdmF0ZSBfcGxhdGZvcm06IFBsYXRmb3JtLFxuICAgICAgLyoqIEBicmVha2luZy1jaGFuZ2UgMTEuMC4wIG1ha2UgZG9jdW1lbnQgcmVxdWlyZWQgKi9cbiAgICAgIEBPcHRpb25hbCgpIEBJbmplY3QoRE9DVU1FTlQpIGRvY3VtZW50OiBhbnl8bnVsbCxcbiAgICAgIEBPcHRpb25hbCgpIEBJbmplY3QoRk9DVVNfTU9OSVRPUl9ERUZBVUxUX09QVElPTlMpIG9wdGlvbnM6XG4gICAgICAgICAgRm9jdXNNb25pdG9yT3B0aW9uc3xudWxsKSB7XG4gICAgdGhpcy5fZG9jdW1lbnQgPSBkb2N1bWVudDtcbiAgICB0aGlzLl9kZXRlY3Rpb25Nb2RlID0gb3B0aW9ucz8uZGV0ZWN0aW9uTW9kZSB8fCBGb2N1c01vbml0b3JEZXRlY3Rpb25Nb2RlLklNTUVESUFURTtcbiAgfVxuICAvKipcbiAgICogRXZlbnQgbGlzdGVuZXIgZm9yIGBmb2N1c2AgYW5kICdibHVyJyBldmVudHMgb24gdGhlIGRvY3VtZW50LlxuICAgKiBOZWVkcyB0byBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0IGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF9yb290Tm9kZUZvY3VzQW5kQmx1ckxpc3RlbmVyID0gKGV2ZW50OiBFdmVudCkgPT4ge1xuICAgIGNvbnN0IHRhcmdldCA9IGdldFRhcmdldChldmVudCk7XG4gICAgY29uc3QgaGFuZGxlciA9IGV2ZW50LnR5cGUgPT09ICdmb2N1cycgPyB0aGlzLl9vbkZvY3VzIDogdGhpcy5fb25CbHVyO1xuXG4gICAgLy8gV2UgbmVlZCB0byB3YWxrIHVwIHRoZSBhbmNlc3RvciBjaGFpbiBpbiBvcmRlciB0byBzdXBwb3J0IGBjaGVja0NoaWxkcmVuYC5cbiAgICBmb3IgKGxldCBlbGVtZW50ID0gdGFyZ2V0OyBlbGVtZW50OyBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnRFbGVtZW50KSB7XG4gICAgICBoYW5kbGVyLmNhbGwodGhpcywgZXZlbnQgYXMgRm9jdXNFdmVudCwgZWxlbWVudCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE1vbml0b3JzIGZvY3VzIG9uIGFuIGVsZW1lbnQgYW5kIGFwcGxpZXMgYXBwcm9wcmlhdGUgQ1NTIGNsYXNzZXMuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIG1vbml0b3JcbiAgICogQHBhcmFtIGNoZWNrQ2hpbGRyZW4gV2hldGhlciB0byBjb3VudCB0aGUgZWxlbWVudCBhcyBmb2N1c2VkIHdoZW4gaXRzIGNoaWxkcmVuIGFyZSBmb2N1c2VkLlxuICAgKiBAcmV0dXJucyBBbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgd2hlbiB0aGUgZm9jdXMgc3RhdGUgb2YgdGhlIGVsZW1lbnQgY2hhbmdlcy5cbiAgICogICAgIFdoZW4gdGhlIGVsZW1lbnQgaXMgYmx1cnJlZCwgbnVsbCB3aWxsIGJlIGVtaXR0ZWQuXG4gICAqL1xuICBtb25pdG9yKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBjaGVja0NoaWxkcmVuPzogYm9vbGVhbik6IE9ic2VydmFibGU8Rm9jdXNPcmlnaW4+O1xuXG4gIC8qKlxuICAgKiBNb25pdG9ycyBmb2N1cyBvbiBhbiBlbGVtZW50IGFuZCBhcHBsaWVzIGFwcHJvcHJpYXRlIENTUyBjbGFzc2VzLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBtb25pdG9yXG4gICAqIEBwYXJhbSBjaGVja0NoaWxkcmVuIFdoZXRoZXIgdG8gY291bnQgdGhlIGVsZW1lbnQgYXMgZm9jdXNlZCB3aGVuIGl0cyBjaGlsZHJlbiBhcmUgZm9jdXNlZC5cbiAgICogQHJldHVybnMgQW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHdoZW4gdGhlIGZvY3VzIHN0YXRlIG9mIHRoZSBlbGVtZW50IGNoYW5nZXMuXG4gICAqICAgICBXaGVuIHRoZSBlbGVtZW50IGlzIGJsdXJyZWQsIG51bGwgd2lsbCBiZSBlbWl0dGVkLlxuICAgKi9cbiAgbW9uaXRvcihlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiwgY2hlY2tDaGlsZHJlbj86IGJvb2xlYW4pOiBPYnNlcnZhYmxlPEZvY3VzT3JpZ2luPjtcblxuICBtb25pdG9yKGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgICAgICAgY2hlY2tDaGlsZHJlbjogYm9vbGVhbiA9IGZhbHNlKTogT2JzZXJ2YWJsZTxGb2N1c09yaWdpbj4ge1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnQpO1xuXG4gICAgLy8gRG8gbm90aGluZyBpZiB3ZSdyZSBub3Qgb24gdGhlIGJyb3dzZXIgcGxhdGZvcm0gb3IgdGhlIHBhc3NlZCBpbiBub2RlIGlzbid0IGFuIGVsZW1lbnQuXG4gICAgaWYgKCF0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIgfHwgbmF0aXZlRWxlbWVudC5ub2RlVHlwZSAhPT0gMSkge1xuICAgICAgcmV0dXJuIG9ic2VydmFibGVPZihudWxsKTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgZWxlbWVudCBpcyBpbnNpZGUgdGhlIHNoYWRvdyBET00sIHdlIG5lZWQgdG8gYmluZCBvdXIgZm9jdXMvYmx1ciBsaXN0ZW5lcnMgdG9cbiAgICAvLyB0aGUgc2hhZG93IHJvb3QsIHJhdGhlciB0aGFuIHRoZSBgZG9jdW1lbnRgLCBiZWNhdXNlIHRoZSBicm93c2VyIHdvbid0IGVtaXQgZm9jdXMgZXZlbnRzXG4gICAgLy8gdG8gdGhlIGBkb2N1bWVudGAsIGlmIGZvY3VzIGlzIG1vdmluZyB3aXRoaW4gdGhlIHNhbWUgc2hhZG93IHJvb3QuXG4gICAgY29uc3Qgcm9vdE5vZGUgPSBfZ2V0U2hhZG93Um9vdChuYXRpdmVFbGVtZW50KSB8fCB0aGlzLl9nZXREb2N1bWVudCgpO1xuICAgIGNvbnN0IGNhY2hlZEluZm8gPSB0aGlzLl9lbGVtZW50SW5mby5nZXQobmF0aXZlRWxlbWVudCk7XG5cbiAgICAvLyBDaGVjayBpZiB3ZSdyZSBhbHJlYWR5IG1vbml0b3JpbmcgdGhpcyBlbGVtZW50LlxuICAgIGlmIChjYWNoZWRJbmZvKSB7XG4gICAgICBpZiAoY2hlY2tDaGlsZHJlbikge1xuICAgICAgICAvLyBUT0RPKENPTVAtMzE4KTogdGhpcyBjYW4gYmUgcHJvYmxlbWF0aWMsIGJlY2F1c2UgaXQnbGwgdHVybiBhbGwgbm9uLWNoZWNrQ2hpbGRyZW5cbiAgICAgICAgLy8gb2JzZXJ2ZXJzIGludG8gb25lcyB0aGF0IGJlaGF2ZSBhcyBpZiBgY2hlY2tDaGlsZHJlbmAgd2FzIHR1cm5lZCBvbi4gV2UgbmVlZCBhIG1vcmVcbiAgICAgICAgLy8gcm9idXN0IHNvbHV0aW9uLlxuICAgICAgICBjYWNoZWRJbmZvLmNoZWNrQ2hpbGRyZW4gPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gY2FjaGVkSW5mby5zdWJqZWN0O1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBtb25pdG9yZWQgZWxlbWVudCBpbmZvLlxuICAgIGNvbnN0IGluZm86IE1vbml0b3JlZEVsZW1lbnRJbmZvID0ge1xuICAgICAgY2hlY2tDaGlsZHJlbjogY2hlY2tDaGlsZHJlbixcbiAgICAgIHN1YmplY3Q6IG5ldyBTdWJqZWN0PEZvY3VzT3JpZ2luPigpLFxuICAgICAgcm9vdE5vZGVcbiAgICB9O1xuICAgIHRoaXMuX2VsZW1lbnRJbmZvLnNldChuYXRpdmVFbGVtZW50LCBpbmZvKTtcbiAgICB0aGlzLl9yZWdpc3Rlckdsb2JhbExpc3RlbmVycyhpbmZvKTtcblxuICAgIHJldHVybiBpbmZvLnN1YmplY3Q7XG4gIH1cblxuICAvKipcbiAgICogU3RvcHMgbW9uaXRvcmluZyBhbiBlbGVtZW50IGFuZCByZW1vdmVzIGFsbCBmb2N1cyBjbGFzc2VzLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBzdG9wIG1vbml0b3JpbmcuXG4gICAqL1xuICBzdG9wTW9uaXRvcmluZyhlbGVtZW50OiBIVE1MRWxlbWVudCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFN0b3BzIG1vbml0b3JpbmcgYW4gZWxlbWVudCBhbmQgcmVtb3ZlcyBhbGwgZm9jdXMgY2xhc3Nlcy5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gc3RvcCBtb25pdG9yaW5nLlxuICAgKi9cbiAgc3RvcE1vbml0b3JpbmcoZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4pOiB2b2lkO1xuXG4gIHN0b3BNb25pdG9yaW5nKGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4pOiB2b2lkIHtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gY29lcmNlRWxlbWVudChlbGVtZW50KTtcbiAgICBjb25zdCBlbGVtZW50SW5mbyA9IHRoaXMuX2VsZW1lbnRJbmZvLmdldChuYXRpdmVFbGVtZW50KTtcblxuICAgIGlmIChlbGVtZW50SW5mbykge1xuICAgICAgZWxlbWVudEluZm8uc3ViamVjdC5jb21wbGV0ZSgpO1xuXG4gICAgICB0aGlzLl9zZXRDbGFzc2VzKG5hdGl2ZUVsZW1lbnQpO1xuICAgICAgdGhpcy5fZWxlbWVudEluZm8uZGVsZXRlKG5hdGl2ZUVsZW1lbnQpO1xuICAgICAgdGhpcy5fcmVtb3ZlR2xvYmFsTGlzdGVuZXJzKGVsZW1lbnRJbmZvKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRm9jdXNlcyB0aGUgZWxlbWVudCB2aWEgdGhlIHNwZWNpZmllZCBmb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgdG8gZm9jdXMuXG4gICAqIEBwYXJhbSBvcmlnaW4gRm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIHRoYXQgY2FuIGJlIHVzZWQgdG8gY29uZmlndXJlIHRoZSBmb2N1cyBiZWhhdmlvci5cbiAgICovXG4gIGZvY3VzVmlhKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBvcmlnaW46IEZvY3VzT3JpZ2luLCBvcHRpb25zPzogRm9jdXNPcHRpb25zKTogdm9pZDtcblxuICAvKipcbiAgICogRm9jdXNlcyB0aGUgZWxlbWVudCB2aWEgdGhlIHNwZWNpZmllZCBmb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgdG8gZm9jdXMuXG4gICAqIEBwYXJhbSBvcmlnaW4gRm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIHRoYXQgY2FuIGJlIHVzZWQgdG8gY29uZmlndXJlIHRoZSBmb2N1cyBiZWhhdmlvci5cbiAgICovXG4gIGZvY3VzVmlhKGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LCBvcmlnaW46IEZvY3VzT3JpZ2luLCBvcHRpb25zPzogRm9jdXNPcHRpb25zKTogdm9pZDtcblxuICBmb2N1c1ZpYShlbGVtZW50OiBIVE1MRWxlbWVudCB8IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgICAgICAgIG9yaWdpbjogRm9jdXNPcmlnaW4sXG4gICAgICAgICAgb3B0aW9ucz86IEZvY3VzT3B0aW9ucyk6IHZvaWQge1xuXG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoZWxlbWVudCk7XG4gICAgY29uc3QgZm9jdXNlZEVsZW1lbnQgPSB0aGlzLl9nZXREb2N1bWVudCgpLmFjdGl2ZUVsZW1lbnQ7XG5cbiAgICAvLyBJZiB0aGUgZWxlbWVudCBpcyBmb2N1c2VkIGFscmVhZHksIGNhbGxpbmcgYGZvY3VzYCBhZ2FpbiB3b24ndCB0cmlnZ2VyIHRoZSBldmVudCBsaXN0ZW5lclxuICAgIC8vIHdoaWNoIG1lYW5zIHRoYXQgdGhlIGZvY3VzIGNsYXNzZXMgd29uJ3QgYmUgdXBkYXRlZC4gSWYgdGhhdCdzIHRoZSBjYXNlLCB1cGRhdGUgdGhlIGNsYXNzZXNcbiAgICAvLyBkaXJlY3RseSB3aXRob3V0IHdhaXRpbmcgZm9yIGFuIGV2ZW50LlxuICAgIGlmIChuYXRpdmVFbGVtZW50ID09PSBmb2N1c2VkRWxlbWVudCkge1xuICAgICAgdGhpcy5fZ2V0Q2xvc2VzdEVsZW1lbnRzSW5mbyhuYXRpdmVFbGVtZW50KVxuICAgICAgICAuZm9yRWFjaCgoW2N1cnJlbnRFbGVtZW50LCBpbmZvXSkgPT4gdGhpcy5fb3JpZ2luQ2hhbmdlZChjdXJyZW50RWxlbWVudCwgb3JpZ2luLCBpbmZvKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3NldE9yaWdpbkZvckN1cnJlbnRFdmVudFF1ZXVlKG9yaWdpbik7XG5cbiAgICAgIC8vIGBmb2N1c2AgaXNuJ3QgYXZhaWxhYmxlIG9uIHRoZSBzZXJ2ZXJcbiAgICAgIGlmICh0eXBlb2YgbmF0aXZlRWxlbWVudC5mb2N1cyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBuYXRpdmVFbGVtZW50LmZvY3VzKG9wdGlvbnMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2VsZW1lbnRJbmZvLmZvckVhY2goKF9pbmZvLCBlbGVtZW50KSA9PiB0aGlzLnN0b3BNb25pdG9yaW5nKGVsZW1lbnQpKTtcbiAgfVxuXG4gIC8qKiBBY2Nlc3MgaW5qZWN0ZWQgZG9jdW1lbnQgaWYgYXZhaWxhYmxlIG9yIGZhbGxiYWNrIHRvIGdsb2JhbCBkb2N1bWVudCByZWZlcmVuY2UgKi9cbiAgcHJpdmF0ZSBfZ2V0RG9jdW1lbnQoKTogRG9jdW1lbnQge1xuICAgIHJldHVybiB0aGlzLl9kb2N1bWVudCB8fCBkb2N1bWVudDtcbiAgfVxuXG4gIC8qKiBVc2UgZGVmYXVsdFZpZXcgb2YgaW5qZWN0ZWQgZG9jdW1lbnQgaWYgYXZhaWxhYmxlIG9yIGZhbGxiYWNrIHRvIGdsb2JhbCB3aW5kb3cgcmVmZXJlbmNlICovXG4gIHByaXZhdGUgX2dldFdpbmRvdygpOiBXaW5kb3cge1xuICAgIGNvbnN0IGRvYyA9IHRoaXMuX2dldERvY3VtZW50KCk7XG4gICAgcmV0dXJuIGRvYy5kZWZhdWx0VmlldyB8fCB3aW5kb3c7XG4gIH1cblxuICBwcml2YXRlIF90b2dnbGVDbGFzcyhlbGVtZW50OiBFbGVtZW50LCBjbGFzc05hbWU6IHN0cmluZywgc2hvdWxkU2V0OiBib29sZWFuKSB7XG4gICAgaWYgKHNob3VsZFNldCkge1xuICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2dldEZvY3VzT3JpZ2luKGV2ZW50OiBGb2N1c0V2ZW50KTogRm9jdXNPcmlnaW4ge1xuICAgIC8vIElmIHdlIGNvdWxkbid0IGRldGVjdCBhIGNhdXNlIGZvciB0aGUgZm9jdXMgZXZlbnQsIGl0J3MgZHVlIHRvIG9uZSBvZiB0aHJlZSByZWFzb25zOlxuICAgIC8vIDEpIFRoZSB3aW5kb3cgaGFzIGp1c3QgcmVnYWluZWQgZm9jdXMsIGluIHdoaWNoIGNhc2Ugd2Ugd2FudCB0byByZXN0b3JlIHRoZSBmb2N1c2VkIHN0YXRlIG9mXG4gICAgLy8gICAgdGhlIGVsZW1lbnQgZnJvbSBiZWZvcmUgdGhlIHdpbmRvdyBibHVycmVkLlxuICAgIC8vIDIpIEl0IHdhcyBjYXVzZWQgYnkgYSB0b3VjaCBldmVudCwgaW4gd2hpY2ggY2FzZSB3ZSBtYXJrIHRoZSBvcmlnaW4gYXMgJ3RvdWNoJy5cbiAgICAvLyAzKSBUaGUgZWxlbWVudCB3YXMgcHJvZ3JhbW1hdGljYWxseSBmb2N1c2VkLCBpbiB3aGljaCBjYXNlIHdlIHNob3VsZCBtYXJrIHRoZSBvcmlnaW4gYXNcbiAgICAvLyAgICAncHJvZ3JhbScuXG4gICAgaWYgKHRoaXMuX29yaWdpbikge1xuICAgICAgcmV0dXJuIHRoaXMuX29yaWdpbjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fd2luZG93Rm9jdXNlZCAmJiB0aGlzLl9sYXN0Rm9jdXNPcmlnaW4pIHtcbiAgICAgIHJldHVybiB0aGlzLl9sYXN0Rm9jdXNPcmlnaW47XG4gICAgfSBlbHNlIGlmICh0aGlzLl93YXNDYXVzZWRCeVRvdWNoKGV2ZW50KSkge1xuICAgICAgcmV0dXJuICd0b3VjaCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAncHJvZ3JhbSc7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGZvY3VzIGNsYXNzZXMgb24gdGhlIGVsZW1lbnQgYmFzZWQgb24gdGhlIGdpdmVuIGZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gdXBkYXRlIHRoZSBjbGFzc2VzIG9uLlxuICAgKiBAcGFyYW0gb3JpZ2luIFRoZSBmb2N1cyBvcmlnaW4uXG4gICAqL1xuICBwcml2YXRlIF9zZXRDbGFzc2VzKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBvcmlnaW4/OiBGb2N1c09yaWdpbik6IHZvaWQge1xuICAgIHRoaXMuX3RvZ2dsZUNsYXNzKGVsZW1lbnQsICdjZGstZm9jdXNlZCcsICEhb3JpZ2luKTtcbiAgICB0aGlzLl90b2dnbGVDbGFzcyhlbGVtZW50LCAnY2RrLXRvdWNoLWZvY3VzZWQnLCBvcmlnaW4gPT09ICd0b3VjaCcpO1xuICAgIHRoaXMuX3RvZ2dsZUNsYXNzKGVsZW1lbnQsICdjZGsta2V5Ym9hcmQtZm9jdXNlZCcsIG9yaWdpbiA9PT0gJ2tleWJvYXJkJyk7XG4gICAgdGhpcy5fdG9nZ2xlQ2xhc3MoZWxlbWVudCwgJ2Nkay1tb3VzZS1mb2N1c2VkJywgb3JpZ2luID09PSAnbW91c2UnKTtcbiAgICB0aGlzLl90b2dnbGVDbGFzcyhlbGVtZW50LCAnY2RrLXByb2dyYW0tZm9jdXNlZCcsIG9yaWdpbiA9PT0gJ3Byb2dyYW0nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBvcmlnaW4gYW5kIHNjaGVkdWxlcyBhbiBhc3luYyBmdW5jdGlvbiB0byBjbGVhciBpdCBhdCB0aGUgZW5kIG9mIHRoZSBldmVudCBxdWV1ZS5cbiAgICogSWYgdGhlIGRldGVjdGlvbiBtb2RlIGlzICdldmVudHVhbCcsIHRoZSBvcmlnaW4gaXMgbmV2ZXIgY2xlYXJlZC5cbiAgICogQHBhcmFtIG9yaWdpbiBUaGUgb3JpZ2luIHRvIHNldC5cbiAgICovXG4gIHByaXZhdGUgX3NldE9yaWdpbkZvckN1cnJlbnRFdmVudFF1ZXVlKG9yaWdpbjogRm9jdXNPcmlnaW4pOiB2b2lkIHtcbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgdGhpcy5fb3JpZ2luID0gb3JpZ2luO1xuXG4gICAgICBpZiAodGhpcy5fZGV0ZWN0aW9uTW9kZSA9PT0gRm9jdXNNb25pdG9yRGV0ZWN0aW9uTW9kZS5JTU1FRElBVEUpIHtcbiAgICAgICAgLy8gU29tZXRpbWVzIHRoZSBmb2N1cyBvcmlnaW4gd29uJ3QgYmUgdmFsaWQgaW4gRmlyZWZveCBiZWNhdXNlIEZpcmVmb3ggc2VlbXMgdG8gZm9jdXMgKm9uZSpcbiAgICAgICAgLy8gdGljayBhZnRlciB0aGUgaW50ZXJhY3Rpb24gZXZlbnQgZmlyZWQuIFRvIGVuc3VyZSB0aGUgZm9jdXMgb3JpZ2luIGlzIGFsd2F5cyBjb3JyZWN0LFxuICAgICAgICAvLyB0aGUgZm9jdXMgb3JpZ2luIHdpbGwgYmUgZGV0ZXJtaW5lZCBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBuZXh0IHRpY2suXG4gICAgICAgIHRoaXMuX29yaWdpblRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fb3JpZ2luID0gbnVsbCwgMSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGdpdmVuIGZvY3VzIGV2ZW50IHdhcyBjYXVzZWQgYnkgYSB0b3VjaHN0YXJ0IGV2ZW50LlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIGZvY3VzIGV2ZW50IHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyBXaGV0aGVyIHRoZSBldmVudCB3YXMgY2F1c2VkIGJ5IGEgdG91Y2guXG4gICAqL1xuICBwcml2YXRlIF93YXNDYXVzZWRCeVRvdWNoKGV2ZW50OiBGb2N1c0V2ZW50KTogYm9vbGVhbiB7XG4gICAgLy8gTm90ZShtbWFsZXJiYSk6IFRoaXMgaW1wbGVtZW50YXRpb24gaXMgbm90IHF1aXRlIHBlcmZlY3QsIHRoZXJlIGlzIGEgc21hbGwgZWRnZSBjYXNlLlxuICAgIC8vIENvbnNpZGVyIHRoZSBmb2xsb3dpbmcgZG9tIHN0cnVjdHVyZTpcbiAgICAvL1xuICAgIC8vIDxkaXYgI3BhcmVudCB0YWJpbmRleD1cIjBcIiBjZGtGb2N1c0NsYXNzZXM+XG4gICAgLy8gICA8ZGl2ICNjaGlsZCAoY2xpY2spPVwiI3BhcmVudC5mb2N1cygpXCI+PC9kaXY+XG4gICAgLy8gPC9kaXY+XG4gICAgLy9cbiAgICAvLyBJZiB0aGUgdXNlciB0b3VjaGVzIHRoZSAjY2hpbGQgZWxlbWVudCBhbmQgdGhlICNwYXJlbnQgaXMgcHJvZ3JhbW1hdGljYWxseSBmb2N1c2VkIGFzIGFcbiAgICAvLyByZXN1bHQsIHRoaXMgY29kZSB3aWxsIHN0aWxsIGNvbnNpZGVyIGl0IHRvIGhhdmUgYmVlbiBjYXVzZWQgYnkgdGhlIHRvdWNoIGV2ZW50IGFuZCB3aWxsXG4gICAgLy8gYXBwbHkgdGhlIGNkay10b3VjaC1mb2N1c2VkIGNsYXNzIHJhdGhlciB0aGFuIHRoZSBjZGstcHJvZ3JhbS1mb2N1c2VkIGNsYXNzLiBUaGlzIGlzIGFcbiAgICAvLyByZWxhdGl2ZWx5IHNtYWxsIGVkZ2UtY2FzZSB0aGF0IGNhbiBiZSB3b3JrZWQgYXJvdW5kIGJ5IHVzaW5nXG4gICAgLy8gZm9jdXNWaWEocGFyZW50RWwsICdwcm9ncmFtJykgdG8gZm9jdXMgdGhlIHBhcmVudCBlbGVtZW50LlxuICAgIC8vXG4gICAgLy8gSWYgd2UgZGVjaWRlIHRoYXQgd2UgYWJzb2x1dGVseSBtdXN0IGhhbmRsZSB0aGlzIGNhc2UgY29ycmVjdGx5LCB3ZSBjYW4gZG8gc28gYnkgbGlzdGVuaW5nXG4gICAgLy8gZm9yIHRoZSBmaXJzdCBmb2N1cyBldmVudCBhZnRlciB0aGUgdG91Y2hzdGFydCwgYW5kIHRoZW4gdGhlIGZpcnN0IGJsdXIgZXZlbnQgYWZ0ZXIgdGhhdFxuICAgIC8vIGZvY3VzIGV2ZW50LiBXaGVuIHRoYXQgYmx1ciBldmVudCBmaXJlcyB3ZSBrbm93IHRoYXQgd2hhdGV2ZXIgZm9sbG93cyBpcyBub3QgYSByZXN1bHQgb2YgdGhlXG4gICAgLy8gdG91Y2hzdGFydC5cbiAgICBjb25zdCBmb2N1c1RhcmdldCA9IGdldFRhcmdldChldmVudCk7XG4gICAgcmV0dXJuIHRoaXMuX2xhc3RUb3VjaFRhcmdldCBpbnN0YW5jZW9mIE5vZGUgJiYgZm9jdXNUYXJnZXQgaW5zdGFuY2VvZiBOb2RlICYmXG4gICAgICAgIChmb2N1c1RhcmdldCA9PT0gdGhpcy5fbGFzdFRvdWNoVGFyZ2V0IHx8IGZvY3VzVGFyZ2V0LmNvbnRhaW5zKHRoaXMuX2xhc3RUb3VjaFRhcmdldCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgZm9jdXMgZXZlbnRzIG9uIGEgcmVnaXN0ZXJlZCBlbGVtZW50LlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIGZvY3VzIGV2ZW50LlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgbW9uaXRvcmVkIGVsZW1lbnQuXG4gICAqL1xuICBwcml2YXRlIF9vbkZvY3VzKGV2ZW50OiBGb2N1c0V2ZW50LCBlbGVtZW50OiBIVE1MRWxlbWVudCkge1xuICAgIC8vIE5PVEUobW1hbGVyYmEpOiBXZSBjdXJyZW50bHkgc2V0IHRoZSBjbGFzc2VzIGJhc2VkIG9uIHRoZSBmb2N1cyBvcmlnaW4gb2YgdGhlIG1vc3QgcmVjZW50XG4gICAgLy8gZm9jdXMgZXZlbnQgYWZmZWN0aW5nIHRoZSBtb25pdG9yZWQgZWxlbWVudC4gSWYgd2Ugd2FudCB0byB1c2UgdGhlIG9yaWdpbiBvZiB0aGUgZmlyc3QgZXZlbnRcbiAgICAvLyBpbnN0ZWFkIHdlIHNob3VsZCBjaGVjayBmb3IgdGhlIGNkay1mb2N1c2VkIGNsYXNzIGhlcmUgYW5kIHJldHVybiBpZiB0aGUgZWxlbWVudCBhbHJlYWR5IGhhc1xuICAgIC8vIGl0LiAoVGhpcyBvbmx5IG1hdHRlcnMgZm9yIGVsZW1lbnRzIHRoYXQgaGF2ZSBpbmNsdWRlc0NoaWxkcmVuID0gdHJ1ZSkuXG5cbiAgICAvLyBJZiB3ZSBhcmUgbm90IGNvdW50aW5nIGNoaWxkLWVsZW1lbnQtZm9jdXMgYXMgZm9jdXNlZCwgbWFrZSBzdXJlIHRoYXQgdGhlIGV2ZW50IHRhcmdldCBpcyB0aGVcbiAgICAvLyBtb25pdG9yZWQgZWxlbWVudCBpdHNlbGYuXG4gICAgY29uc3QgZWxlbWVudEluZm8gPSB0aGlzLl9lbGVtZW50SW5mby5nZXQoZWxlbWVudCk7XG4gICAgaWYgKCFlbGVtZW50SW5mbyB8fCAoIWVsZW1lbnRJbmZvLmNoZWNrQ2hpbGRyZW4gJiYgZWxlbWVudCAhPT0gZ2V0VGFyZ2V0KGV2ZW50KSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9vcmlnaW5DaGFuZ2VkKGVsZW1lbnQsIHRoaXMuX2dldEZvY3VzT3JpZ2luKGV2ZW50KSwgZWxlbWVudEluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgYmx1ciBldmVudHMgb24gYSByZWdpc3RlcmVkIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBldmVudCBUaGUgYmx1ciBldmVudC5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIG1vbml0b3JlZCBlbGVtZW50LlxuICAgKi9cbiAgX29uQmx1cihldmVudDogRm9jdXNFdmVudCwgZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgICAvLyBJZiB3ZSBhcmUgY291bnRpbmcgY2hpbGQtZWxlbWVudC1mb2N1cyBhcyBmb2N1c2VkLCBtYWtlIHN1cmUgdGhhdCB3ZSBhcmVuJ3QganVzdCBibHVycmluZyBpblxuICAgIC8vIG9yZGVyIHRvIGZvY3VzIGFub3RoZXIgY2hpbGQgb2YgdGhlIG1vbml0b3JlZCBlbGVtZW50LlxuICAgIGNvbnN0IGVsZW1lbnRJbmZvID0gdGhpcy5fZWxlbWVudEluZm8uZ2V0KGVsZW1lbnQpO1xuXG4gICAgaWYgKCFlbGVtZW50SW5mbyB8fCAoZWxlbWVudEluZm8uY2hlY2tDaGlsZHJlbiAmJiBldmVudC5yZWxhdGVkVGFyZ2V0IGluc3RhbmNlb2YgTm9kZSAmJlxuICAgICAgICBlbGVtZW50LmNvbnRhaW5zKGV2ZW50LnJlbGF0ZWRUYXJnZXQpKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3NldENsYXNzZXMoZWxlbWVudCk7XG4gICAgdGhpcy5fZW1pdE9yaWdpbihlbGVtZW50SW5mby5zdWJqZWN0LCBudWxsKTtcbiAgfVxuXG4gIHByaXZhdGUgX2VtaXRPcmlnaW4oc3ViamVjdDogU3ViamVjdDxGb2N1c09yaWdpbj4sIG9yaWdpbjogRm9jdXNPcmlnaW4pIHtcbiAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHN1YmplY3QubmV4dChvcmlnaW4pKTtcbiAgfVxuXG4gIHByaXZhdGUgX3JlZ2lzdGVyR2xvYmFsTGlzdGVuZXJzKGVsZW1lbnRJbmZvOiBNb25pdG9yZWRFbGVtZW50SW5mbykge1xuICAgIGlmICghdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgcm9vdE5vZGUgPSBlbGVtZW50SW5mby5yb290Tm9kZTtcbiAgICBjb25zdCByb290Tm9kZUZvY3VzTGlzdGVuZXJzID0gdGhpcy5fcm9vdE5vZGVGb2N1c0xpc3RlbmVyQ291bnQuZ2V0KHJvb3ROb2RlKSB8fCAwO1xuXG4gICAgaWYgKCFyb290Tm9kZUZvY3VzTGlzdGVuZXJzKSB7XG4gICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICByb290Tm9kZS5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMuX3Jvb3ROb2RlRm9jdXNBbmRCbHVyTGlzdGVuZXIsXG4gICAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgICAgcm9vdE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIHRoaXMuX3Jvb3ROb2RlRm9jdXNBbmRCbHVyTGlzdGVuZXIsXG4gICAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMuX3Jvb3ROb2RlRm9jdXNMaXN0ZW5lckNvdW50LnNldChyb290Tm9kZSwgcm9vdE5vZGVGb2N1c0xpc3RlbmVycyArIDEpO1xuXG4gICAgLy8gUmVnaXN0ZXIgZ2xvYmFsIGxpc3RlbmVycyB3aGVuIGZpcnN0IGVsZW1lbnQgaXMgbW9uaXRvcmVkLlxuICAgIGlmICgrK3RoaXMuX21vbml0b3JlZEVsZW1lbnRDb3VudCA9PT0gMSkge1xuICAgICAgLy8gTm90ZTogd2UgbGlzdGVuIHRvIGV2ZW50cyBpbiB0aGUgY2FwdHVyZSBwaGFzZSBzbyB3ZVxuICAgICAgLy8gY2FuIGRldGVjdCB0aGVtIGV2ZW4gaWYgdGhlIHVzZXIgc3RvcHMgcHJvcGFnYXRpb24uXG4gICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICBjb25zdCBkb2N1bWVudCA9IHRoaXMuX2dldERvY3VtZW50KCk7XG4gICAgICAgIGNvbnN0IHdpbmRvdyA9IHRoaXMuX2dldFdpbmRvdygpO1xuXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9kb2N1bWVudEtleWRvd25MaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9kb2N1bWVudE1vdXNlZG93bkxpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9kb2N1bWVudFRvdWNoc3RhcnRMaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCB0aGlzLl93aW5kb3dGb2N1c0xpc3RlbmVyKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX3JlbW92ZUdsb2JhbExpc3RlbmVycyhlbGVtZW50SW5mbzogTW9uaXRvcmVkRWxlbWVudEluZm8pIHtcbiAgICBjb25zdCByb290Tm9kZSA9IGVsZW1lbnRJbmZvLnJvb3ROb2RlO1xuXG4gICAgaWYgKHRoaXMuX3Jvb3ROb2RlRm9jdXNMaXN0ZW5lckNvdW50Lmhhcyhyb290Tm9kZSkpIHtcbiAgICAgIGNvbnN0IHJvb3ROb2RlRm9jdXNMaXN0ZW5lcnMgPSB0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5nZXQocm9vdE5vZGUpITtcblxuICAgICAgaWYgKHJvb3ROb2RlRm9jdXNMaXN0ZW5lcnMgPiAxKSB7XG4gICAgICAgIHRoaXMuX3Jvb3ROb2RlRm9jdXNMaXN0ZW5lckNvdW50LnNldChyb290Tm9kZSwgcm9vdE5vZGVGb2N1c0xpc3RlbmVycyAtIDEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcm9vdE5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignZm9jdXMnLCB0aGlzLl9yb290Tm9kZUZvY3VzQW5kQmx1ckxpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICAgIHJvb3ROb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2JsdXInLCB0aGlzLl9yb290Tm9kZUZvY3VzQW5kQmx1ckxpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICAgIHRoaXMuX3Jvb3ROb2RlRm9jdXNMaXN0ZW5lckNvdW50LmRlbGV0ZShyb290Tm9kZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVW5yZWdpc3RlciBnbG9iYWwgbGlzdGVuZXJzIHdoZW4gbGFzdCBlbGVtZW50IGlzIHVubW9uaXRvcmVkLlxuICAgIGlmICghLS10aGlzLl9tb25pdG9yZWRFbGVtZW50Q291bnQpIHtcbiAgICAgIGNvbnN0IGRvY3VtZW50ID0gdGhpcy5fZ2V0RG9jdW1lbnQoKTtcbiAgICAgIGNvbnN0IHdpbmRvdyA9IHRoaXMuX2dldFdpbmRvdygpO1xuXG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fZG9jdW1lbnRLZXlkb3duTGlzdGVuZXIsXG4gICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9kb2N1bWVudE1vdXNlZG93bkxpc3RlbmVyLFxuICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuX2RvY3VtZW50VG91Y2hzdGFydExpc3RlbmVyLFxuICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5fd2luZG93Rm9jdXNMaXN0ZW5lcik7XG5cbiAgICAgIC8vIENsZWFyIHRpbWVvdXRzIGZvciBhbGwgcG90ZW50aWFsbHkgcGVuZGluZyB0aW1lb3V0cyB0byBwcmV2ZW50IHRoZSBsZWFrcy5cbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl93aW5kb3dGb2N1c1RpbWVvdXRJZCk7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fdG91Y2hUaW1lb3V0SWQpO1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX29yaWdpblRpbWVvdXRJZCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFVwZGF0ZXMgYWxsIHRoZSBzdGF0ZSBvbiBhbiBlbGVtZW50IG9uY2UgaXRzIGZvY3VzIG9yaWdpbiBoYXMgY2hhbmdlZC4gKi9cbiAgcHJpdmF0ZSBfb3JpZ2luQ2hhbmdlZChlbGVtZW50OiBIVE1MRWxlbWVudCwgb3JpZ2luOiBGb2N1c09yaWdpbixcbiAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50SW5mbzogTW9uaXRvcmVkRWxlbWVudEluZm8pIHtcbiAgICB0aGlzLl9zZXRDbGFzc2VzKGVsZW1lbnQsIG9yaWdpbik7XG4gICAgdGhpcy5fZW1pdE9yaWdpbihlbGVtZW50SW5mby5zdWJqZWN0LCBvcmlnaW4pO1xuICAgIHRoaXMuX2xhc3RGb2N1c09yaWdpbiA9IG9yaWdpbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb2xsZWN0cyB0aGUgYE1vbml0b3JlZEVsZW1lbnRJbmZvYCBvZiBhIHBhcnRpY3VsYXIgZWxlbWVudCBhbmRcbiAgICogYWxsIG9mIGl0cyBhbmNlc3RvcnMgdGhhdCBoYXZlIGVuYWJsZWQgYGNoZWNrQ2hpbGRyZW5gLlxuICAgKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IGZyb20gd2hpY2ggdG8gc3RhcnQgdGhlIHNlYXJjaC5cbiAgICovXG4gIHByaXZhdGUgX2dldENsb3Nlc3RFbGVtZW50c0luZm8oZWxlbWVudDogSFRNTEVsZW1lbnQpOiBbSFRNTEVsZW1lbnQsIE1vbml0b3JlZEVsZW1lbnRJbmZvXVtdIHtcbiAgICBjb25zdCByZXN1bHRzOiBbSFRNTEVsZW1lbnQsIE1vbml0b3JlZEVsZW1lbnRJbmZvXVtdID0gW107XG5cbiAgICB0aGlzLl9lbGVtZW50SW5mby5mb3JFYWNoKChpbmZvLCBjdXJyZW50RWxlbWVudCkgPT4ge1xuICAgICAgaWYgKGN1cnJlbnRFbGVtZW50ID09PSBlbGVtZW50IHx8IChpbmZvLmNoZWNrQ2hpbGRyZW4gJiYgY3VycmVudEVsZW1lbnQuY29udGFpbnMoZWxlbWVudCkpKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaChbY3VycmVudEVsZW1lbnQsIGluZm9dKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG59XG5cbi8qKiBHZXRzIHRoZSB0YXJnZXQgb2YgYW4gZXZlbnQsIGFjY291bnRpbmcgZm9yIFNoYWRvdyBET00uICovXG5mdW5jdGlvbiBnZXRUYXJnZXQoZXZlbnQ6IEV2ZW50KTogSFRNTEVsZW1lbnR8bnVsbCB7XG4gIC8vIElmIGFuIGV2ZW50IGlzIGJvdW5kIG91dHNpZGUgdGhlIFNoYWRvdyBET00sIHRoZSBgZXZlbnQudGFyZ2V0YCB3aWxsXG4gIC8vIHBvaW50IHRvIHRoZSBzaGFkb3cgcm9vdCBzbyB3ZSBoYXZlIHRvIHVzZSBgY29tcG9zZWRQYXRoYCBpbnN0ZWFkLlxuICByZXR1cm4gKGV2ZW50LmNvbXBvc2VkUGF0aCA/IGV2ZW50LmNvbXBvc2VkUGF0aCgpWzBdIDogZXZlbnQudGFyZ2V0KSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG59XG5cblxuLyoqXG4gKiBEaXJlY3RpdmUgdGhhdCBkZXRlcm1pbmVzIGhvdyBhIHBhcnRpY3VsYXIgZWxlbWVudCB3YXMgZm9jdXNlZCAodmlhIGtleWJvYXJkLCBtb3VzZSwgdG91Y2gsIG9yXG4gKiBwcm9ncmFtbWF0aWNhbGx5KSBhbmQgYWRkcyBjb3JyZXNwb25kaW5nIGNsYXNzZXMgdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogVGhlcmUgYXJlIHR3byB2YXJpYW50cyBvZiB0aGlzIGRpcmVjdGl2ZTpcbiAqIDEpIGNka01vbml0b3JFbGVtZW50Rm9jdXM6IGRvZXMgbm90IGNvbnNpZGVyIGFuIGVsZW1lbnQgdG8gYmUgZm9jdXNlZCBpZiBvbmUgb2YgaXRzIGNoaWxkcmVuIGlzXG4gKiAgICBmb2N1c2VkLlxuICogMikgY2RrTW9uaXRvclN1YnRyZWVGb2N1czogY29uc2lkZXJzIGFuIGVsZW1lbnQgZm9jdXNlZCBpZiBpdCBvciBhbnkgb2YgaXRzIGNoaWxkcmVuIGFyZSBmb2N1c2VkLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrTW9uaXRvckVsZW1lbnRGb2N1c10sIFtjZGtNb25pdG9yU3VidHJlZUZvY3VzXScsXG59KVxuZXhwb3J0IGNsYXNzIENka01vbml0b3JGb2N1cyBpbXBsZW1lbnRzIEFmdGVyVmlld0luaXQsIE9uRGVzdHJveSB7XG4gIHByaXZhdGUgX21vbml0b3JTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbjtcbiAgQE91dHB1dCgpIGNka0ZvY3VzQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxGb2N1c09yaWdpbj4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9lbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiwgcHJpdmF0ZSBfZm9jdXNNb25pdG9yOiBGb2N1c01vbml0b3IpIHt9XG5cbiAgbmdBZnRlclZpZXdJbml0KCkge1xuICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgdGhpcy5fbW9uaXRvclN1YnNjcmlwdGlvbiA9IHRoaXMuX2ZvY3VzTW9uaXRvci5tb25pdG9yKFxuICAgICAgZWxlbWVudCxcbiAgICAgIGVsZW1lbnQubm9kZVR5cGUgPT09IDEgJiYgZWxlbWVudC5oYXNBdHRyaWJ1dGUoJ2Nka01vbml0b3JTdWJ0cmVlRm9jdXMnKSlcbiAgICAuc3Vic2NyaWJlKG9yaWdpbiA9PiB0aGlzLmNka0ZvY3VzQ2hhbmdlLmVtaXQob3JpZ2luKSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9mb2N1c01vbml0b3Iuc3RvcE1vbml0b3JpbmcodGhpcy5fZWxlbWVudFJlZik7XG5cbiAgICBpZiAodGhpcy5fbW9uaXRvclN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fbW9uaXRvclN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIH1cbiAgfVxufVxuIl19