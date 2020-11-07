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
        if (nativeElement === focusedElement && this._elementInfo.has(nativeElement)) {
            this._originChanged(nativeElement, origin, this._elementInfo.get(nativeElement));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXMtbW9uaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvYTExeS9mb2N1cy1tb25pdG9yL2ZvY3VzLW1vbml0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBRSwrQkFBK0IsRUFBRSxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNoRyxPQUFPLEVBQ0wsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osTUFBTSxFQUNOLFVBQVUsRUFDVixjQUFjLEVBQ2QsTUFBTSxFQUVOLFFBQVEsRUFDUixNQUFNLEdBRVAsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFhLEVBQUUsSUFBSSxZQUFZLEVBQUUsT0FBTyxFQUFlLE1BQU0sTUFBTSxDQUFDO0FBQzNFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUFDLCtCQUErQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7Ozs7QUFHbEUsa0dBQWtHO0FBQ2xHLGtEQUFrRDtBQUNsRCxNQUFNLENBQUMsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDO0FBa0NuQyw4Q0FBOEM7QUFDOUMsTUFBTSxDQUFDLE1BQU0sNkJBQTZCLEdBQ3RDLElBQUksY0FBYyxDQUFzQixtQ0FBbUMsQ0FBQyxDQUFDO0FBUWpGOzs7R0FHRztBQUNILE1BQU0sMkJBQTJCLEdBQUcsK0JBQStCLENBQUM7SUFDbEUsT0FBTyxFQUFFLElBQUk7SUFDYixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUMsQ0FBQztBQUdILGlGQUFpRjtBQUVqRixNQUFNLE9BQU8sWUFBWTtJQWlHdkIsWUFDWSxPQUFlLEVBQ2YsU0FBbUI7SUFDM0IscURBQXFEO0lBQ3ZCLFFBQWtCLEVBQ0csT0FDdkI7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QUFDO1NBQ3pDO0lBQ0gsQ0FBQzs7O1lBdkJGLFNBQVMsU0FBQztnQkFDVCxRQUFRLEVBQUUsb0RBQW9EO2FBQy9EOzs7WUFyakJDLFVBQVU7WUEwakJ1RSxZQUFZOzs7NkJBRjVGLE1BQU0iLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtQbGF0Zm9ybSwgbm9ybWFsaXplUGFzc2l2ZUxpc3RlbmVyT3B0aW9ucywgX2dldFNoYWRvd1Jvb3R9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5qZWN0LFxuICBJbmplY3RhYmxlLFxuICBJbmplY3Rpb25Ub2tlbixcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIE9wdGlvbmFsLFxuICBPdXRwdXQsXG4gIEFmdGVyVmlld0luaXQsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBvZiBhcyBvYnNlcnZhYmxlT2YsIFN1YmplY3QsIFN1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2NvZXJjZUVsZW1lbnR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtpc0Zha2VNb3VzZWRvd25Gcm9tU2NyZWVuUmVhZGVyfSBmcm9tICcuLi9mYWtlLW1vdXNlZG93bic7XG5cblxuLy8gVGhpcyBpcyB0aGUgdmFsdWUgdXNlZCBieSBBbmd1bGFySlMgTWF0ZXJpYWwuIFRocm91Z2ggdHJpYWwgYW5kIGVycm9yIChvbiBpUGhvbmUgNlMpIHRoZXkgZm91bmRcbi8vIHRoYXQgYSB2YWx1ZSBvZiBhcm91bmQgNjUwbXMgc2VlbXMgYXBwcm9wcmlhdGUuXG5leHBvcnQgY29uc3QgVE9VQ0hfQlVGRkVSX01TID0gNjUwO1xuXG5cbmV4cG9ydCB0eXBlIEZvY3VzT3JpZ2luID0gJ3RvdWNoJyB8ICdtb3VzZScgfCAna2V5Ym9hcmQnIHwgJ3Byb2dyYW0nIHwgbnVsbDtcblxuLyoqXG4gKiBDb3JyZXNwb25kcyB0byB0aGUgb3B0aW9ucyB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gdGhlIG5hdGl2ZSBgZm9jdXNgIGV2ZW50LlxuICogdmlhIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9IVE1MRWxlbWVudC9mb2N1c1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEZvY3VzT3B0aW9ucyB7XG4gIC8qKiBXaGV0aGVyIHRoZSBicm93c2VyIHNob3VsZCBzY3JvbGwgdG8gdGhlIGVsZW1lbnQgd2hlbiBpdCBpcyBmb2N1c2VkLiAqL1xuICBwcmV2ZW50U2Nyb2xsPzogYm9vbGVhbjtcbn1cblxuLyoqIERldGVjdGlvbiBtb2RlIHVzZWQgZm9yIGF0dHJpYnV0aW5nIHRoZSBvcmlnaW4gb2YgYSBmb2N1cyBldmVudC4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGUge1xuICAvKipcbiAgICogQW55IG1vdXNlZG93biwga2V5ZG93biwgb3IgdG91Y2hzdGFydCBldmVudCB0aGF0IGhhcHBlbmVkIGluIHRoZSBwcmV2aW91c1xuICAgKiB0aWNrIG9yIHRoZSBjdXJyZW50IHRpY2sgd2lsbCBiZSB1c2VkIHRvIGFzc2lnbiBhIGZvY3VzIGV2ZW50J3Mgb3JpZ2luICh0b1xuICAgKiBlaXRoZXIgbW91c2UsIGtleWJvYXJkLCBvciB0b3VjaCkuIFRoaXMgaXMgdGhlIGRlZmF1bHQgb3B0aW9uLlxuICAgKi9cbiAgSU1NRURJQVRFLFxuICAvKipcbiAgICogQSBmb2N1cyBldmVudCdzIG9yaWdpbiBpcyBhbHdheXMgYXR0cmlidXRlZCB0byB0aGUgbGFzdCBjb3JyZXNwb25kaW5nXG4gICAqIG1vdXNlZG93biwga2V5ZG93biwgb3IgdG91Y2hzdGFydCBldmVudCwgbm8gbWF0dGVyIGhvdyBsb25nIGFnbyBpdCBvY2N1cmVkLlxuICAgKi9cbiAgRVZFTlRVQUxcbn1cblxuLyoqIEluamVjdGFibGUgc2VydmljZS1sZXZlbCBvcHRpb25zIGZvciBGb2N1c01vbml0b3IuICovXG5leHBvcnQgaW50ZXJmYWNlIEZvY3VzTW9uaXRvck9wdGlvbnMge1xuICBkZXRlY3Rpb25Nb2RlPzogRm9jdXNNb25pdG9yRGV0ZWN0aW9uTW9kZTtcbn1cblxuLyoqIEluamVjdGlvblRva2VuIGZvciBGb2N1c01vbml0b3JPcHRpb25zLiAqL1xuZXhwb3J0IGNvbnN0IEZPQ1VTX01PTklUT1JfREVGQVVMVF9PUFRJT05TID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48Rm9jdXNNb25pdG9yT3B0aW9ucz4oJ2Nkay1mb2N1cy1tb25pdG9yLWRlZmF1bHQtb3B0aW9ucycpO1xuXG50eXBlIE1vbml0b3JlZEVsZW1lbnRJbmZvID0ge1xuICBjaGVja0NoaWxkcmVuOiBib29sZWFuLFxuICBzdWJqZWN0OiBTdWJqZWN0PEZvY3VzT3JpZ2luPixcbiAgcm9vdE5vZGU6IEhUTUxFbGVtZW50fERvY3VtZW50XG59O1xuXG4vKipcbiAqIEV2ZW50IGxpc3RlbmVyIG9wdGlvbnMgdGhhdCBlbmFibGUgY2FwdHVyaW5nIGFuZCBhbHNvXG4gKiBtYXJrIHRoZSBsaXN0ZW5lciBhcyBwYXNzaXZlIGlmIHRoZSBicm93c2VyIHN1cHBvcnRzIGl0LlxuICovXG5jb25zdCBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMgPSBub3JtYWxpemVQYXNzaXZlTGlzdGVuZXJPcHRpb25zKHtcbiAgcGFzc2l2ZTogdHJ1ZSxcbiAgY2FwdHVyZTogdHJ1ZVxufSk7XG5cblxuLyoqIE1vbml0b3JzIG1vdXNlIGFuZCBrZXlib2FyZCBldmVudHMgdG8gZGV0ZXJtaW5lIHRoZSBjYXVzZSBvZiBmb2N1cyBldmVudHMuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBGb2N1c01vbml0b3IgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogVGhlIGZvY3VzIG9yaWdpbiB0aGF0IHRoZSBuZXh0IGZvY3VzIGV2ZW50IGlzIGEgcmVzdWx0IG9mLiAqL1xuICBwcml2YXRlIF9vcmlnaW46IEZvY3VzT3JpZ2luID0gbnVsbDtcblxuICAvKiogVGhlIEZvY3VzT3JpZ2luIG9mIHRoZSBsYXN0IGZvY3VzIGV2ZW50IHRyYWNrZWQgYnkgdGhlIEZvY3VzTW9uaXRvci4gKi9cbiAgcHJpdmF0ZSBfbGFzdEZvY3VzT3JpZ2luOiBGb2N1c09yaWdpbjtcblxuICAvKiogV2hldGhlciB0aGUgd2luZG93IGhhcyBqdXN0IGJlZW4gZm9jdXNlZC4gKi9cbiAgcHJpdmF0ZSBfd2luZG93Rm9jdXNlZCA9IGZhbHNlO1xuXG4gIC8qKiBUaGUgdGFyZ2V0IG9mIHRoZSBsYXN0IHRvdWNoIGV2ZW50LiAqL1xuICBwcml2YXRlIF9sYXN0VG91Y2hUYXJnZXQ6IEV2ZW50VGFyZ2V0IHwgbnVsbDtcblxuICAvKiogVGhlIHRpbWVvdXQgaWQgb2YgdGhlIHRvdWNoIHRpbWVvdXQsIHVzZWQgdG8gY2FuY2VsIHRpbWVvdXQgbGF0ZXIuICovXG4gIHByaXZhdGUgX3RvdWNoVGltZW91dElkOiBudW1iZXI7XG5cbiAgLyoqIFRoZSB0aW1lb3V0IGlkIG9mIHRoZSB3aW5kb3cgZm9jdXMgdGltZW91dC4gKi9cbiAgcHJpdmF0ZSBfd2luZG93Rm9jdXNUaW1lb3V0SWQ6IG51bWJlcjtcblxuICAvKiogVGhlIHRpbWVvdXQgaWQgb2YgdGhlIG9yaWdpbiBjbGVhcmluZyB0aW1lb3V0LiAqL1xuICBwcml2YXRlIF9vcmlnaW5UaW1lb3V0SWQ6IG51bWJlcjtcblxuICAvKiogTWFwIG9mIGVsZW1lbnRzIGJlaW5nIG1vbml0b3JlZCB0byB0aGVpciBpbmZvLiAqL1xuICBwcml2YXRlIF9lbGVtZW50SW5mbyA9IG5ldyBNYXA8SFRNTEVsZW1lbnQsIE1vbml0b3JlZEVsZW1lbnRJbmZvPigpO1xuXG4gIC8qKiBUaGUgbnVtYmVyIG9mIGVsZW1lbnRzIGN1cnJlbnRseSBiZWluZyBtb25pdG9yZWQuICovXG4gIHByaXZhdGUgX21vbml0b3JlZEVsZW1lbnRDb3VudCA9IDA7XG5cbiAgLyoqXG4gICAqIEtlZXBzIHRyYWNrIG9mIHRoZSByb290IG5vZGVzIHRvIHdoaWNoIHdlJ3ZlIGN1cnJlbnRseSBib3VuZCBhIGZvY3VzL2JsdXIgaGFuZGxlcixcbiAgICogYXMgd2VsbCBhcyB0aGUgbnVtYmVyIG9mIG1vbml0b3JlZCBlbGVtZW50cyB0aGF0IHRoZXkgY29udGFpbi4gV2UgaGF2ZSB0byB0cmVhdCBmb2N1cy9ibHVyXG4gICAqIGhhbmRsZXJzIGRpZmZlcmVudGx5IGZyb20gdGhlIHJlc3Qgb2YgdGhlIGV2ZW50cywgYmVjYXVzZSB0aGUgYnJvd3NlciB3b24ndCBlbWl0IGV2ZW50c1xuICAgKiB0byB0aGUgZG9jdW1lbnQgd2hlbiBmb2N1cyBtb3ZlcyBpbnNpZGUgb2YgYSBzaGFkb3cgcm9vdC5cbiAgICovXG4gIHByaXZhdGUgX3Jvb3ROb2RlRm9jdXNMaXN0ZW5lckNvdW50ID0gbmV3IE1hcDxIVE1MRWxlbWVudHxEb2N1bWVudCwgbnVtYmVyPigpO1xuXG4gIC8qKlxuICAgKiBUaGUgc3BlY2lmaWVkIGRldGVjdGlvbiBtb2RlLCB1c2VkIGZvciBhdHRyaWJ1dGluZyB0aGUgb3JpZ2luIG9mIGEgZm9jdXNcbiAgICogZXZlbnQuXG4gICAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9kZXRlY3Rpb25Nb2RlOiBGb2N1c01vbml0b3JEZXRlY3Rpb25Nb2RlO1xuXG4gIC8qKlxuICAgKiBFdmVudCBsaXN0ZW5lciBmb3IgYGtleWRvd25gIGV2ZW50cyBvbiB0aGUgZG9jdW1lbnQuXG4gICAqIE5lZWRzIHRvIGJlIGFuIGFycm93IGZ1bmN0aW9uIGluIG9yZGVyIHRvIHByZXNlcnZlIHRoZSBjb250ZXh0IHdoZW4gaXQgZ2V0cyBib3VuZC5cbiAgICovXG4gIHByaXZhdGUgX2RvY3VtZW50S2V5ZG93bkxpc3RlbmVyID0gKCkgPT4ge1xuICAgIC8vIE9uIGtleWRvd24gcmVjb3JkIHRoZSBvcmlnaW4gYW5kIGNsZWFyIGFueSB0b3VjaCBldmVudCB0aGF0IG1heSBiZSBpbiBwcm9ncmVzcy5cbiAgICB0aGlzLl9sYXN0VG91Y2hUYXJnZXQgPSBudWxsO1xuICAgIHRoaXMuX3NldE9yaWdpbkZvckN1cnJlbnRFdmVudFF1ZXVlKCdrZXlib2FyZCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV2ZW50IGxpc3RlbmVyIGZvciBgbW91c2Vkb3duYCBldmVudHMgb24gdGhlIGRvY3VtZW50LlxuICAgKiBOZWVkcyB0byBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0IGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF9kb2N1bWVudE1vdXNlZG93bkxpc3RlbmVyID0gKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgLy8gT24gbW91c2Vkb3duIHJlY29yZCB0aGUgb3JpZ2luIG9ubHkgaWYgdGhlcmUgaXMgbm90IHRvdWNoXG4gICAgLy8gdGFyZ2V0LCBzaW5jZSBhIG1vdXNlZG93biBjYW4gaGFwcGVuIGFzIGEgcmVzdWx0IG9mIGEgdG91Y2ggZXZlbnQuXG4gICAgaWYgKCF0aGlzLl9sYXN0VG91Y2hUYXJnZXQpIHtcbiAgICAgIC8vIEluIHNvbWUgY2FzZXMgc2NyZWVuIHJlYWRlcnMgZmlyZSBmYWtlIGBtb3VzZWRvd25gIGV2ZW50cyBpbnN0ZWFkIG9mIGBrZXlkb3duYC5cbiAgICAgIC8vIFJlc29sdmUgdGhlIGZvY3VzIHNvdXJjZSB0byBga2V5Ym9hcmRgIGlmIHdlIGRldGVjdCBvbmUgb2YgdGhlbS5cbiAgICAgIGNvbnN0IHNvdXJjZSA9IGlzRmFrZU1vdXNlZG93bkZyb21TY3JlZW5SZWFkZXIoZXZlbnQpID8gJ2tleWJvYXJkJyA6ICdtb3VzZSc7XG4gICAgICB0aGlzLl9zZXRPcmlnaW5Gb3JDdXJyZW50RXZlbnRRdWV1ZShzb3VyY2UpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFdmVudCBsaXN0ZW5lciBmb3IgYHRvdWNoc3RhcnRgIGV2ZW50cyBvbiB0aGUgZG9jdW1lbnQuXG4gICAqIE5lZWRzIHRvIGJlIGFuIGFycm93IGZ1bmN0aW9uIGluIG9yZGVyIHRvIHByZXNlcnZlIHRoZSBjb250ZXh0IHdoZW4gaXQgZ2V0cyBib3VuZC5cbiAgICovXG4gIHByaXZhdGUgX2RvY3VtZW50VG91Y2hzdGFydExpc3RlbmVyID0gKGV2ZW50OiBUb3VjaEV2ZW50KSA9PiB7XG4gICAgLy8gV2hlbiB0aGUgdG91Y2hzdGFydCBldmVudCBmaXJlcyB0aGUgZm9jdXMgZXZlbnQgaXMgbm90IHlldCBpbiB0aGUgZXZlbnQgcXVldWUuIFRoaXMgbWVhbnNcbiAgICAvLyB3ZSBjYW4ndCByZWx5IG9uIHRoZSB0cmljayB1c2VkIGFib3ZlIChzZXR0aW5nIHRpbWVvdXQgb2YgMW1zKS4gSW5zdGVhZCB3ZSB3YWl0IDY1MG1zIHRvXG4gICAgLy8gc2VlIGlmIGEgZm9jdXMgaGFwcGVucy5cbiAgICBpZiAodGhpcy5fdG91Y2hUaW1lb3V0SWQgIT0gbnVsbCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3RvdWNoVGltZW91dElkKTtcbiAgICB9XG5cbiAgICB0aGlzLl9sYXN0VG91Y2hUYXJnZXQgPSBnZXRUYXJnZXQoZXZlbnQpO1xuICAgIHRoaXMuX3RvdWNoVGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLl9sYXN0VG91Y2hUYXJnZXQgPSBudWxsLCBUT1VDSF9CVUZGRVJfTVMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV2ZW50IGxpc3RlbmVyIGZvciBgZm9jdXNgIGV2ZW50cyBvbiB0aGUgd2luZG93LlxuICAgKiBOZWVkcyB0byBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0IGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF93aW5kb3dGb2N1c0xpc3RlbmVyID0gKCkgPT4ge1xuICAgIC8vIE1ha2UgYSBub3RlIG9mIHdoZW4gdGhlIHdpbmRvdyByZWdhaW5zIGZvY3VzLCBzbyB3ZSBjYW5cbiAgICAvLyByZXN0b3JlIHRoZSBvcmlnaW4gaW5mbyBmb3IgdGhlIGZvY3VzZWQgZWxlbWVudC5cbiAgICB0aGlzLl93aW5kb3dGb2N1c2VkID0gdHJ1ZTtcbiAgICB0aGlzLl93aW5kb3dGb2N1c1RpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fd2luZG93Rm9jdXNlZCA9IGZhbHNlKTtcbiAgfVxuXG4gIC8qKiBVc2VkIHRvIHJlZmVyZW5jZSBjb3JyZWN0IGRvY3VtZW50L3dpbmRvdyAqL1xuICBwcm90ZWN0ZWQgX2RvY3VtZW50PzogRG9jdW1lbnQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICAgIHByaXZhdGUgX3BsYXRmb3JtOiBQbGF0Zm9ybSxcbiAgICAgIC8qKiBAYnJlYWtpbmctY2hhbmdlIDExLjAuMCBtYWtlIGRvY3VtZW50IHJlcXVpcmVkICovXG4gICAgICBAT3B0aW9uYWwoKSBASW5qZWN0KERPQ1VNRU5UKSBkb2N1bWVudDogYW55fG51bGwsXG4gICAgICBAT3B0aW9uYWwoKSBASW5qZWN0KEZPQ1VTX01PTklUT1JfREVGQVVMVF9PUFRJT05TKSBvcHRpb25zOlxuICAgICAgICAgIEZvY3VzTW9uaXRvck9wdGlvbnN8bnVsbCkge1xuICAgIHRoaXMuX2RvY3VtZW50ID0gZG9jdW1lbnQ7XG4gICAgdGhpcy5fZGV0ZWN0aW9uTW9kZSA9IG9wdGlvbnM/LmRldGVjdGlvbk1vZGUgfHwgRm9jdXNNb25pdG9yRGV0ZWN0aW9uTW9kZS5JTU1FRElBVEU7XG4gIH1cbiAgLyoqXG4gICAqIEV2ZW50IGxpc3RlbmVyIGZvciBgZm9jdXNgIGFuZCAnYmx1cicgZXZlbnRzIG9uIHRoZSBkb2N1bWVudC5cbiAgICogTmVlZHMgdG8gYmUgYW4gYXJyb3cgZnVuY3Rpb24gaW4gb3JkZXIgdG8gcHJlc2VydmUgdGhlIGNvbnRleHQgd2hlbiBpdCBnZXRzIGJvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfcm9vdE5vZGVGb2N1c0FuZEJsdXJMaXN0ZW5lciA9IChldmVudDogRXZlbnQpID0+IHtcbiAgICBjb25zdCB0YXJnZXQgPSBnZXRUYXJnZXQoZXZlbnQpO1xuICAgIGNvbnN0IGhhbmRsZXIgPSBldmVudC50eXBlID09PSAnZm9jdXMnID8gdGhpcy5fb25Gb2N1cyA6IHRoaXMuX29uQmx1cjtcblxuICAgIC8vIFdlIG5lZWQgdG8gd2FsayB1cCB0aGUgYW5jZXN0b3IgY2hhaW4gaW4gb3JkZXIgdG8gc3VwcG9ydCBgY2hlY2tDaGlsZHJlbmAuXG4gICAgZm9yIChsZXQgZWxlbWVudCA9IHRhcmdldDsgZWxlbWVudDsgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50RWxlbWVudCkge1xuICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGV2ZW50IGFzIEZvY3VzRXZlbnQsIGVsZW1lbnQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBNb25pdG9ycyBmb2N1cyBvbiBhbiBlbGVtZW50IGFuZCBhcHBsaWVzIGFwcHJvcHJpYXRlIENTUyBjbGFzc2VzLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBtb25pdG9yXG4gICAqIEBwYXJhbSBjaGVja0NoaWxkcmVuIFdoZXRoZXIgdG8gY291bnQgdGhlIGVsZW1lbnQgYXMgZm9jdXNlZCB3aGVuIGl0cyBjaGlsZHJlbiBhcmUgZm9jdXNlZC5cbiAgICogQHJldHVybnMgQW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHdoZW4gdGhlIGZvY3VzIHN0YXRlIG9mIHRoZSBlbGVtZW50IGNoYW5nZXMuXG4gICAqICAgICBXaGVuIHRoZSBlbGVtZW50IGlzIGJsdXJyZWQsIG51bGwgd2lsbCBiZSBlbWl0dGVkLlxuICAgKi9cbiAgbW9uaXRvcihlbGVtZW50OiBIVE1MRWxlbWVudCwgY2hlY2tDaGlsZHJlbj86IGJvb2xlYW4pOiBPYnNlcnZhYmxlPEZvY3VzT3JpZ2luPjtcblxuICAvKipcbiAgICogTW9uaXRvcnMgZm9jdXMgb24gYW4gZWxlbWVudCBhbmQgYXBwbGllcyBhcHByb3ByaWF0ZSBDU1MgY2xhc3Nlcy5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gbW9uaXRvclxuICAgKiBAcGFyYW0gY2hlY2tDaGlsZHJlbiBXaGV0aGVyIHRvIGNvdW50IHRoZSBlbGVtZW50IGFzIGZvY3VzZWQgd2hlbiBpdHMgY2hpbGRyZW4gYXJlIGZvY3VzZWQuXG4gICAqIEByZXR1cm5zIEFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB3aGVuIHRoZSBmb2N1cyBzdGF0ZSBvZiB0aGUgZWxlbWVudCBjaGFuZ2VzLlxuICAgKiAgICAgV2hlbiB0aGUgZWxlbWVudCBpcyBibHVycmVkLCBudWxsIHdpbGwgYmUgZW1pdHRlZC5cbiAgICovXG4gIG1vbml0b3IoZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sIGNoZWNrQ2hpbGRyZW4/OiBib29sZWFuKTogT2JzZXJ2YWJsZTxGb2N1c09yaWdpbj47XG5cbiAgbW9uaXRvcihlbGVtZW50OiBIVE1MRWxlbWVudCB8IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgICAgICAgIGNoZWNrQ2hpbGRyZW46IGJvb2xlYW4gPSBmYWxzZSk6IE9ic2VydmFibGU8Rm9jdXNPcmlnaW4+IHtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gY29lcmNlRWxlbWVudChlbGVtZW50KTtcblxuICAgIC8vIERvIG5vdGhpbmcgaWYgd2UncmUgbm90IG9uIHRoZSBicm93c2VyIHBsYXRmb3JtIG9yIHRoZSBwYXNzZWQgaW4gbm9kZSBpc24ndCBhbiBlbGVtZW50LlxuICAgIGlmICghdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyIHx8IG5hdGl2ZUVsZW1lbnQubm9kZVR5cGUgIT09IDEpIHtcbiAgICAgIHJldHVybiBvYnNlcnZhYmxlT2YobnVsbCk7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGVsZW1lbnQgaXMgaW5zaWRlIHRoZSBzaGFkb3cgRE9NLCB3ZSBuZWVkIHRvIGJpbmQgb3VyIGZvY3VzL2JsdXIgbGlzdGVuZXJzIHRvXG4gICAgLy8gdGhlIHNoYWRvdyByb290LCByYXRoZXIgdGhhbiB0aGUgYGRvY3VtZW50YCwgYmVjYXVzZSB0aGUgYnJvd3NlciB3b24ndCBlbWl0IGZvY3VzIGV2ZW50c1xuICAgIC8vIHRvIHRoZSBgZG9jdW1lbnRgLCBpZiBmb2N1cyBpcyBtb3Zpbmcgd2l0aGluIHRoZSBzYW1lIHNoYWRvdyByb290LlxuICAgIGNvbnN0IHJvb3ROb2RlID0gKF9nZXRTaGFkb3dSb290KG5hdGl2ZUVsZW1lbnQpIGFzIEhUTUxFbGVtZW50fG51bGwpIHx8IHRoaXMuX2dldERvY3VtZW50KCk7XG4gICAgY29uc3QgY2FjaGVkSW5mbyA9IHRoaXMuX2VsZW1lbnRJbmZvLmdldChuYXRpdmVFbGVtZW50KTtcblxuICAgIC8vIENoZWNrIGlmIHdlJ3JlIGFscmVhZHkgbW9uaXRvcmluZyB0aGlzIGVsZW1lbnQuXG4gICAgaWYgKGNhY2hlZEluZm8pIHtcbiAgICAgIGlmIChjaGVja0NoaWxkcmVuKSB7XG4gICAgICAgIC8vIFRPRE8oQ09NUC0zMTgpOiB0aGlzIGNhbiBiZSBwcm9ibGVtYXRpYywgYmVjYXVzZSBpdCdsbCB0dXJuIGFsbCBub24tY2hlY2tDaGlsZHJlblxuICAgICAgICAvLyBvYnNlcnZlcnMgaW50byBvbmVzIHRoYXQgYmVoYXZlIGFzIGlmIGBjaGVja0NoaWxkcmVuYCB3YXMgdHVybmVkIG9uLiBXZSBuZWVkIGEgbW9yZVxuICAgICAgICAvLyByb2J1c3Qgc29sdXRpb24uXG4gICAgICAgIGNhY2hlZEluZm8uY2hlY2tDaGlsZHJlbiA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjYWNoZWRJbmZvLnN1YmplY3Q7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIG1vbml0b3JlZCBlbGVtZW50IGluZm8uXG4gICAgY29uc3QgaW5mbzogTW9uaXRvcmVkRWxlbWVudEluZm8gPSB7XG4gICAgICBjaGVja0NoaWxkcmVuOiBjaGVja0NoaWxkcmVuLFxuICAgICAgc3ViamVjdDogbmV3IFN1YmplY3Q8Rm9jdXNPcmlnaW4+KCksXG4gICAgICByb290Tm9kZVxuICAgIH07XG4gICAgdGhpcy5fZWxlbWVudEluZm8uc2V0KG5hdGl2ZUVsZW1lbnQsIGluZm8pO1xuICAgIHRoaXMuX3JlZ2lzdGVyR2xvYmFsTGlzdGVuZXJzKGluZm8pO1xuXG4gICAgcmV0dXJuIGluZm8uc3ViamVjdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9wcyBtb25pdG9yaW5nIGFuIGVsZW1lbnQgYW5kIHJlbW92ZXMgYWxsIGZvY3VzIGNsYXNzZXMuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHN0b3AgbW9uaXRvcmluZy5cbiAgICovXG4gIHN0b3BNb25pdG9yaW5nKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogdm9pZDtcblxuICAvKipcbiAgICogU3RvcHMgbW9uaXRvcmluZyBhbiBlbGVtZW50IGFuZCByZW1vdmVzIGFsbCBmb2N1cyBjbGFzc2VzLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBzdG9wIG1vbml0b3JpbmcuXG4gICAqL1xuICBzdG9wTW9uaXRvcmluZyhlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50Pik6IHZvaWQ7XG5cbiAgc3RvcE1vbml0b3JpbmcoZWxlbWVudDogSFRNTEVsZW1lbnQgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50Pik6IHZvaWQge1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnQpO1xuICAgIGNvbnN0IGVsZW1lbnRJbmZvID0gdGhpcy5fZWxlbWVudEluZm8uZ2V0KG5hdGl2ZUVsZW1lbnQpO1xuXG4gICAgaWYgKGVsZW1lbnRJbmZvKSB7XG4gICAgICBlbGVtZW50SW5mby5zdWJqZWN0LmNvbXBsZXRlKCk7XG5cbiAgICAgIHRoaXMuX3NldENsYXNzZXMobmF0aXZlRWxlbWVudCk7XG4gICAgICB0aGlzLl9lbGVtZW50SW5mby5kZWxldGUobmF0aXZlRWxlbWVudCk7XG4gICAgICB0aGlzLl9yZW1vdmVHbG9iYWxMaXN0ZW5lcnMoZWxlbWVudEluZm8pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGb2N1c2VzIHRoZSBlbGVtZW50IHZpYSB0aGUgc3BlY2lmaWVkIGZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCB0byBmb2N1cy5cbiAgICogQHBhcmFtIG9yaWdpbiBGb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCB0byBjb25maWd1cmUgdGhlIGZvY3VzIGJlaGF2aW9yLlxuICAgKi9cbiAgZm9jdXNWaWEoZWxlbWVudDogSFRNTEVsZW1lbnQsIG9yaWdpbjogRm9jdXNPcmlnaW4sIG9wdGlvbnM/OiBGb2N1c09wdGlvbnMpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBGb2N1c2VzIHRoZSBlbGVtZW50IHZpYSB0aGUgc3BlY2lmaWVkIGZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCB0byBmb2N1cy5cbiAgICogQHBhcmFtIG9yaWdpbiBGb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCB0byBjb25maWd1cmUgdGhlIGZvY3VzIGJlaGF2aW9yLlxuICAgKi9cbiAgZm9jdXNWaWEoZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sIG9yaWdpbjogRm9jdXNPcmlnaW4sIG9wdGlvbnM/OiBGb2N1c09wdGlvbnMpOiB2b2lkO1xuXG4gIGZvY3VzVmlhKGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgICAgICAgb3JpZ2luOiBGb2N1c09yaWdpbixcbiAgICAgICAgICBvcHRpb25zPzogRm9jdXNPcHRpb25zKTogdm9pZCB7XG5cbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gY29lcmNlRWxlbWVudChlbGVtZW50KTtcbiAgICBjb25zdCBmb2N1c2VkRWxlbWVudCA9IHRoaXMuX2dldERvY3VtZW50KCkuYWN0aXZlRWxlbWVudDtcblxuICAgIC8vIElmIHRoZSBlbGVtZW50IGlzIGZvY3VzZWQgYWxyZWFkeSwgY2FsbGluZyBgZm9jdXNgIGFnYWluIHdvbid0IHRyaWdnZXIgdGhlIGV2ZW50IGxpc3RlbmVyXG4gICAgLy8gd2hpY2ggbWVhbnMgdGhhdCB0aGUgZm9jdXMgY2xhc3NlcyB3b24ndCBiZSB1cGRhdGVkLiBJZiB0aGF0J3MgdGhlIGNhc2UsIHVwZGF0ZSB0aGUgY2xhc3Nlc1xuICAgIC8vIGRpcmVjdGx5IHdpdGhvdXQgd2FpdGluZyBmb3IgYW4gZXZlbnQuXG4gICAgaWYgKG5hdGl2ZUVsZW1lbnQgPT09IGZvY3VzZWRFbGVtZW50ICYmIHRoaXMuX2VsZW1lbnRJbmZvLmhhcyhuYXRpdmVFbGVtZW50KSkge1xuICAgICAgdGhpcy5fb3JpZ2luQ2hhbmdlZChuYXRpdmVFbGVtZW50LCBvcmlnaW4sIHRoaXMuX2VsZW1lbnRJbmZvLmdldChuYXRpdmVFbGVtZW50KSEpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9zZXRPcmlnaW5Gb3JDdXJyZW50RXZlbnRRdWV1ZShvcmlnaW4pO1xuXG4gICAgICAvLyBgZm9jdXNgIGlzbid0IGF2YWlsYWJsZSBvbiB0aGUgc2VydmVyXG4gICAgICBpZiAodHlwZW9mIG5hdGl2ZUVsZW1lbnQuZm9jdXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgbmF0aXZlRWxlbWVudC5mb2N1cyhvcHRpb25zKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9lbGVtZW50SW5mby5mb3JFYWNoKChfaW5mbywgZWxlbWVudCkgPT4gdGhpcy5zdG9wTW9uaXRvcmluZyhlbGVtZW50KSk7XG4gIH1cblxuICAvKiogQWNjZXNzIGluamVjdGVkIGRvY3VtZW50IGlmIGF2YWlsYWJsZSBvciBmYWxsYmFjayB0byBnbG9iYWwgZG9jdW1lbnQgcmVmZXJlbmNlICovXG4gIHByaXZhdGUgX2dldERvY3VtZW50KCk6IERvY3VtZW50IHtcbiAgICByZXR1cm4gdGhpcy5fZG9jdW1lbnQgfHwgZG9jdW1lbnQ7XG4gIH1cblxuICAvKiogVXNlIGRlZmF1bHRWaWV3IG9mIGluamVjdGVkIGRvY3VtZW50IGlmIGF2YWlsYWJsZSBvciBmYWxsYmFjayB0byBnbG9iYWwgd2luZG93IHJlZmVyZW5jZSAqL1xuICBwcml2YXRlIF9nZXRXaW5kb3coKTogV2luZG93IHtcbiAgICBjb25zdCBkb2MgPSB0aGlzLl9nZXREb2N1bWVudCgpO1xuICAgIHJldHVybiBkb2MuZGVmYXVsdFZpZXcgfHwgd2luZG93O1xuICB9XG5cbiAgcHJpdmF0ZSBfdG9nZ2xlQ2xhc3MoZWxlbWVudDogRWxlbWVudCwgY2xhc3NOYW1lOiBzdHJpbmcsIHNob3VsZFNldDogYm9vbGVhbikge1xuICAgIGlmIChzaG91bGRTZXQpIHtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9nZXRGb2N1c09yaWdpbihldmVudDogRm9jdXNFdmVudCk6IEZvY3VzT3JpZ2luIHtcbiAgICAvLyBJZiB3ZSBjb3VsZG4ndCBkZXRlY3QgYSBjYXVzZSBmb3IgdGhlIGZvY3VzIGV2ZW50LCBpdCdzIGR1ZSB0byBvbmUgb2YgdGhyZWUgcmVhc29uczpcbiAgICAvLyAxKSBUaGUgd2luZG93IGhhcyBqdXN0IHJlZ2FpbmVkIGZvY3VzLCBpbiB3aGljaCBjYXNlIHdlIHdhbnQgdG8gcmVzdG9yZSB0aGUgZm9jdXNlZCBzdGF0ZSBvZlxuICAgIC8vICAgIHRoZSBlbGVtZW50IGZyb20gYmVmb3JlIHRoZSB3aW5kb3cgYmx1cnJlZC5cbiAgICAvLyAyKSBJdCB3YXMgY2F1c2VkIGJ5IGEgdG91Y2ggZXZlbnQsIGluIHdoaWNoIGNhc2Ugd2UgbWFyayB0aGUgb3JpZ2luIGFzICd0b3VjaCcuXG4gICAgLy8gMykgVGhlIGVsZW1lbnQgd2FzIHByb2dyYW1tYXRpY2FsbHkgZm9jdXNlZCwgaW4gd2hpY2ggY2FzZSB3ZSBzaG91bGQgbWFyayB0aGUgb3JpZ2luIGFzXG4gICAgLy8gICAgJ3Byb2dyYW0nLlxuICAgIGlmICh0aGlzLl9vcmlnaW4pIHtcbiAgICAgIHJldHVybiB0aGlzLl9vcmlnaW47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3dpbmRvd0ZvY3VzZWQgJiYgdGhpcy5fbGFzdEZvY3VzT3JpZ2luKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbGFzdEZvY3VzT3JpZ2luO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fd2FzQ2F1c2VkQnlUb3VjaChldmVudCkpIHtcbiAgICAgIHJldHVybiAndG91Y2gnO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJ3Byb2dyYW0nO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBmb2N1cyBjbGFzc2VzIG9uIHRoZSBlbGVtZW50IGJhc2VkIG9uIHRoZSBnaXZlbiBmb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHVwZGF0ZSB0aGUgY2xhc3NlcyBvbi5cbiAgICogQHBhcmFtIG9yaWdpbiBUaGUgZm9jdXMgb3JpZ2luLlxuICAgKi9cbiAgcHJpdmF0ZSBfc2V0Q2xhc3NlcyhlbGVtZW50OiBIVE1MRWxlbWVudCwgb3JpZ2luPzogRm9jdXNPcmlnaW4pOiB2b2lkIHtcbiAgICB0aGlzLl90b2dnbGVDbGFzcyhlbGVtZW50LCAnY2RrLWZvY3VzZWQnLCAhIW9yaWdpbik7XG4gICAgdGhpcy5fdG9nZ2xlQ2xhc3MoZWxlbWVudCwgJ2Nkay10b3VjaC1mb2N1c2VkJywgb3JpZ2luID09PSAndG91Y2gnKTtcbiAgICB0aGlzLl90b2dnbGVDbGFzcyhlbGVtZW50LCAnY2RrLWtleWJvYXJkLWZvY3VzZWQnLCBvcmlnaW4gPT09ICdrZXlib2FyZCcpO1xuICAgIHRoaXMuX3RvZ2dsZUNsYXNzKGVsZW1lbnQsICdjZGstbW91c2UtZm9jdXNlZCcsIG9yaWdpbiA9PT0gJ21vdXNlJyk7XG4gICAgdGhpcy5fdG9nZ2xlQ2xhc3MoZWxlbWVudCwgJ2Nkay1wcm9ncmFtLWZvY3VzZWQnLCBvcmlnaW4gPT09ICdwcm9ncmFtJyk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgb3JpZ2luIGFuZCBzY2hlZHVsZXMgYW4gYXN5bmMgZnVuY3Rpb24gdG8gY2xlYXIgaXQgYXQgdGhlIGVuZCBvZiB0aGUgZXZlbnQgcXVldWUuXG4gICAqIElmIHRoZSBkZXRlY3Rpb24gbW9kZSBpcyAnZXZlbnR1YWwnLCB0aGUgb3JpZ2luIGlzIG5ldmVyIGNsZWFyZWQuXG4gICAqIEBwYXJhbSBvcmlnaW4gVGhlIG9yaWdpbiB0byBzZXQuXG4gICAqL1xuICBwcml2YXRlIF9zZXRPcmlnaW5Gb3JDdXJyZW50RXZlbnRRdWV1ZShvcmlnaW46IEZvY3VzT3JpZ2luKTogdm9pZCB7XG4gICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHRoaXMuX29yaWdpbiA9IG9yaWdpbjtcblxuICAgICAgaWYgKHRoaXMuX2RldGVjdGlvbk1vZGUgPT09IEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGUuSU1NRURJQVRFKSB7XG4gICAgICAgIC8vIFNvbWV0aW1lcyB0aGUgZm9jdXMgb3JpZ2luIHdvbid0IGJlIHZhbGlkIGluIEZpcmVmb3ggYmVjYXVzZSBGaXJlZm94IHNlZW1zIHRvIGZvY3VzICpvbmUqXG4gICAgICAgIC8vIHRpY2sgYWZ0ZXIgdGhlIGludGVyYWN0aW9uIGV2ZW50IGZpcmVkLiBUbyBlbnN1cmUgdGhlIGZvY3VzIG9yaWdpbiBpcyBhbHdheXMgY29ycmVjdCxcbiAgICAgICAgLy8gdGhlIGZvY3VzIG9yaWdpbiB3aWxsIGJlIGRldGVybWluZWQgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgbmV4dCB0aWNrLlxuICAgICAgICB0aGlzLl9vcmlnaW5UaW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX29yaWdpbiA9IG51bGwsIDEpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSBnaXZlbiBmb2N1cyBldmVudCB3YXMgY2F1c2VkIGJ5IGEgdG91Y2hzdGFydCBldmVudC5cbiAgICogQHBhcmFtIGV2ZW50IFRoZSBmb2N1cyBldmVudCB0byBjaGVjay5cbiAgICogQHJldHVybnMgV2hldGhlciB0aGUgZXZlbnQgd2FzIGNhdXNlZCBieSBhIHRvdWNoLlxuICAgKi9cbiAgcHJpdmF0ZSBfd2FzQ2F1c2VkQnlUb3VjaChldmVudDogRm9jdXNFdmVudCk6IGJvb2xlYW4ge1xuICAgIC8vIE5vdGUobW1hbGVyYmEpOiBUaGlzIGltcGxlbWVudGF0aW9uIGlzIG5vdCBxdWl0ZSBwZXJmZWN0LCB0aGVyZSBpcyBhIHNtYWxsIGVkZ2UgY2FzZS5cbiAgICAvLyBDb25zaWRlciB0aGUgZm9sbG93aW5nIGRvbSBzdHJ1Y3R1cmU6XG4gICAgLy9cbiAgICAvLyA8ZGl2ICNwYXJlbnQgdGFiaW5kZXg9XCIwXCIgY2RrRm9jdXNDbGFzc2VzPlxuICAgIC8vICAgPGRpdiAjY2hpbGQgKGNsaWNrKT1cIiNwYXJlbnQuZm9jdXMoKVwiPjwvZGl2PlxuICAgIC8vIDwvZGl2PlxuICAgIC8vXG4gICAgLy8gSWYgdGhlIHVzZXIgdG91Y2hlcyB0aGUgI2NoaWxkIGVsZW1lbnQgYW5kIHRoZSAjcGFyZW50IGlzIHByb2dyYW1tYXRpY2FsbHkgZm9jdXNlZCBhcyBhXG4gICAgLy8gcmVzdWx0LCB0aGlzIGNvZGUgd2lsbCBzdGlsbCBjb25zaWRlciBpdCB0byBoYXZlIGJlZW4gY2F1c2VkIGJ5IHRoZSB0b3VjaCBldmVudCBhbmQgd2lsbFxuICAgIC8vIGFwcGx5IHRoZSBjZGstdG91Y2gtZm9jdXNlZCBjbGFzcyByYXRoZXIgdGhhbiB0aGUgY2RrLXByb2dyYW0tZm9jdXNlZCBjbGFzcy4gVGhpcyBpcyBhXG4gICAgLy8gcmVsYXRpdmVseSBzbWFsbCBlZGdlLWNhc2UgdGhhdCBjYW4gYmUgd29ya2VkIGFyb3VuZCBieSB1c2luZ1xuICAgIC8vIGZvY3VzVmlhKHBhcmVudEVsLCAncHJvZ3JhbScpIHRvIGZvY3VzIHRoZSBwYXJlbnQgZWxlbWVudC5cbiAgICAvL1xuICAgIC8vIElmIHdlIGRlY2lkZSB0aGF0IHdlIGFic29sdXRlbHkgbXVzdCBoYW5kbGUgdGhpcyBjYXNlIGNvcnJlY3RseSwgd2UgY2FuIGRvIHNvIGJ5IGxpc3RlbmluZ1xuICAgIC8vIGZvciB0aGUgZmlyc3QgZm9jdXMgZXZlbnQgYWZ0ZXIgdGhlIHRvdWNoc3RhcnQsIGFuZCB0aGVuIHRoZSBmaXJzdCBibHVyIGV2ZW50IGFmdGVyIHRoYXRcbiAgICAvLyBmb2N1cyBldmVudC4gV2hlbiB0aGF0IGJsdXIgZXZlbnQgZmlyZXMgd2Uga25vdyB0aGF0IHdoYXRldmVyIGZvbGxvd3MgaXMgbm90IGEgcmVzdWx0IG9mIHRoZVxuICAgIC8vIHRvdWNoc3RhcnQuXG4gICAgY29uc3QgZm9jdXNUYXJnZXQgPSBnZXRUYXJnZXQoZXZlbnQpO1xuICAgIHJldHVybiB0aGlzLl9sYXN0VG91Y2hUYXJnZXQgaW5zdGFuY2VvZiBOb2RlICYmIGZvY3VzVGFyZ2V0IGluc3RhbmNlb2YgTm9kZSAmJlxuICAgICAgICAoZm9jdXNUYXJnZXQgPT09IHRoaXMuX2xhc3RUb3VjaFRhcmdldCB8fCBmb2N1c1RhcmdldC5jb250YWlucyh0aGlzLl9sYXN0VG91Y2hUYXJnZXQpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIGZvY3VzIGV2ZW50cyBvbiBhIHJlZ2lzdGVyZWQgZWxlbWVudC5cbiAgICogQHBhcmFtIGV2ZW50IFRoZSBmb2N1cyBldmVudC5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIG1vbml0b3JlZCBlbGVtZW50LlxuICAgKi9cbiAgcHJpdmF0ZSBfb25Gb2N1cyhldmVudDogRm9jdXNFdmVudCwgZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgICAvLyBOT1RFKG1tYWxlcmJhKTogV2UgY3VycmVudGx5IHNldCB0aGUgY2xhc3NlcyBiYXNlZCBvbiB0aGUgZm9jdXMgb3JpZ2luIG9mIHRoZSBtb3N0IHJlY2VudFxuICAgIC8vIGZvY3VzIGV2ZW50IGFmZmVjdGluZyB0aGUgbW9uaXRvcmVkIGVsZW1lbnQuIElmIHdlIHdhbnQgdG8gdXNlIHRoZSBvcmlnaW4gb2YgdGhlIGZpcnN0IGV2ZW50XG4gICAgLy8gaW5zdGVhZCB3ZSBzaG91bGQgY2hlY2sgZm9yIHRoZSBjZGstZm9jdXNlZCBjbGFzcyBoZXJlIGFuZCByZXR1cm4gaWYgdGhlIGVsZW1lbnQgYWxyZWFkeSBoYXNcbiAgICAvLyBpdC4gKFRoaXMgb25seSBtYXR0ZXJzIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgaW5jbHVkZXNDaGlsZHJlbiA9IHRydWUpLlxuXG4gICAgLy8gSWYgd2UgYXJlIG5vdCBjb3VudGluZyBjaGlsZC1lbGVtZW50LWZvY3VzIGFzIGZvY3VzZWQsIG1ha2Ugc3VyZSB0aGF0IHRoZSBldmVudCB0YXJnZXQgaXMgdGhlXG4gICAgLy8gbW9uaXRvcmVkIGVsZW1lbnQgaXRzZWxmLlxuICAgIGNvbnN0IGVsZW1lbnRJbmZvID0gdGhpcy5fZWxlbWVudEluZm8uZ2V0KGVsZW1lbnQpO1xuICAgIGlmICghZWxlbWVudEluZm8gfHwgKCFlbGVtZW50SW5mby5jaGVja0NoaWxkcmVuICYmIGVsZW1lbnQgIT09IGdldFRhcmdldChldmVudCkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fb3JpZ2luQ2hhbmdlZChlbGVtZW50LCB0aGlzLl9nZXRGb2N1c09yaWdpbihldmVudCksIGVsZW1lbnRJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIGJsdXIgZXZlbnRzIG9uIGEgcmVnaXN0ZXJlZCBlbGVtZW50LlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIGJsdXIgZXZlbnQuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBtb25pdG9yZWQgZWxlbWVudC5cbiAgICovXG4gIF9vbkJsdXIoZXZlbnQ6IEZvY3VzRXZlbnQsIGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgLy8gSWYgd2UgYXJlIGNvdW50aW5nIGNoaWxkLWVsZW1lbnQtZm9jdXMgYXMgZm9jdXNlZCwgbWFrZSBzdXJlIHRoYXQgd2UgYXJlbid0IGp1c3QgYmx1cnJpbmcgaW5cbiAgICAvLyBvcmRlciB0byBmb2N1cyBhbm90aGVyIGNoaWxkIG9mIHRoZSBtb25pdG9yZWQgZWxlbWVudC5cbiAgICBjb25zdCBlbGVtZW50SW5mbyA9IHRoaXMuX2VsZW1lbnRJbmZvLmdldChlbGVtZW50KTtcblxuICAgIGlmICghZWxlbWVudEluZm8gfHwgKGVsZW1lbnRJbmZvLmNoZWNrQ2hpbGRyZW4gJiYgZXZlbnQucmVsYXRlZFRhcmdldCBpbnN0YW5jZW9mIE5vZGUgJiZcbiAgICAgICAgZWxlbWVudC5jb250YWlucyhldmVudC5yZWxhdGVkVGFyZ2V0KSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9zZXRDbGFzc2VzKGVsZW1lbnQpO1xuICAgIHRoaXMuX2VtaXRPcmlnaW4oZWxlbWVudEluZm8uc3ViamVjdCwgbnVsbCk7XG4gIH1cblxuICBwcml2YXRlIF9lbWl0T3JpZ2luKHN1YmplY3Q6IFN1YmplY3Q8Rm9jdXNPcmlnaW4+LCBvcmlnaW46IEZvY3VzT3JpZ2luKSB7XG4gICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiBzdWJqZWN0Lm5leHQob3JpZ2luKSk7XG4gIH1cblxuICBwcml2YXRlIF9yZWdpc3Rlckdsb2JhbExpc3RlbmVycyhlbGVtZW50SW5mbzogTW9uaXRvcmVkRWxlbWVudEluZm8pIHtcbiAgICBpZiAoIXRoaXMuX3BsYXRmb3JtLmlzQnJvd3Nlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHJvb3ROb2RlID0gZWxlbWVudEluZm8ucm9vdE5vZGU7XG4gICAgY29uc3Qgcm9vdE5vZGVGb2N1c0xpc3RlbmVycyA9IHRoaXMuX3Jvb3ROb2RlRm9jdXNMaXN0ZW5lckNvdW50LmdldChyb290Tm9kZSkgfHwgMDtcblxuICAgIGlmICghcm9vdE5vZGVGb2N1c0xpc3RlbmVycykge1xuICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgcm9vdE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCB0aGlzLl9yb290Tm9kZUZvY3VzQW5kQmx1ckxpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICAgIHJvb3ROb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCB0aGlzLl9yb290Tm9kZUZvY3VzQW5kQmx1ckxpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5zZXQocm9vdE5vZGUsIHJvb3ROb2RlRm9jdXNMaXN0ZW5lcnMgKyAxKTtcblxuICAgIC8vIFJlZ2lzdGVyIGdsb2JhbCBsaXN0ZW5lcnMgd2hlbiBmaXJzdCBlbGVtZW50IGlzIG1vbml0b3JlZC5cbiAgICBpZiAoKyt0aGlzLl9tb25pdG9yZWRFbGVtZW50Q291bnQgPT09IDEpIHtcbiAgICAgIC8vIE5vdGU6IHdlIGxpc3RlbiB0byBldmVudHMgaW4gdGhlIGNhcHR1cmUgcGhhc2Ugc28gd2VcbiAgICAgIC8vIGNhbiBkZXRlY3QgdGhlbSBldmVuIGlmIHRoZSB1c2VyIHN0b3BzIHByb3BhZ2F0aW9uLlxuICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgY29uc3QgZG9jdW1lbnQgPSB0aGlzLl9nZXREb2N1bWVudCgpO1xuICAgICAgICBjb25zdCB3aW5kb3cgPSB0aGlzLl9nZXRXaW5kb3coKTtcblxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fZG9jdW1lbnRLZXlkb3duTGlzdGVuZXIsXG4gICAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fZG9jdW1lbnRNb3VzZWRvd25MaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5fZG9jdW1lbnRUb3VjaHN0YXJ0TGlzdGVuZXIsXG4gICAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5fd2luZG93Rm9jdXNMaXN0ZW5lcik7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9yZW1vdmVHbG9iYWxMaXN0ZW5lcnMoZWxlbWVudEluZm86IE1vbml0b3JlZEVsZW1lbnRJbmZvKSB7XG4gICAgY29uc3Qgcm9vdE5vZGUgPSBlbGVtZW50SW5mby5yb290Tm9kZTtcblxuICAgIGlmICh0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5oYXMocm9vdE5vZGUpKSB7XG4gICAgICBjb25zdCByb290Tm9kZUZvY3VzTGlzdGVuZXJzID0gdGhpcy5fcm9vdE5vZGVGb2N1c0xpc3RlbmVyQ291bnQuZ2V0KHJvb3ROb2RlKSE7XG5cbiAgICAgIGlmIChyb290Tm9kZUZvY3VzTGlzdGVuZXJzID4gMSkge1xuICAgICAgICB0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5zZXQocm9vdE5vZGUsIHJvb3ROb2RlRm9jdXNMaXN0ZW5lcnMgLSAxKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJvb3ROb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5fcm9vdE5vZGVGb2N1c0FuZEJsdXJMaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgICByb290Tm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdibHVyJywgdGhpcy5fcm9vdE5vZGVGb2N1c0FuZEJsdXJMaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgICB0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5kZWxldGUocm9vdE5vZGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFVucmVnaXN0ZXIgZ2xvYmFsIGxpc3RlbmVycyB3aGVuIGxhc3QgZWxlbWVudCBpcyB1bm1vbml0b3JlZC5cbiAgICBpZiAoIS0tdGhpcy5fbW9uaXRvcmVkRWxlbWVudENvdW50KSB7XG4gICAgICBjb25zdCBkb2N1bWVudCA9IHRoaXMuX2dldERvY3VtZW50KCk7XG4gICAgICBjb25zdCB3aW5kb3cgPSB0aGlzLl9nZXRXaW5kb3coKTtcblxuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX2RvY3VtZW50S2V5ZG93bkxpc3RlbmVyLFxuICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fZG9jdW1lbnRNb3VzZWRvd25MaXN0ZW5lcixcbiAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9kb2N1bWVudFRvdWNoc3RhcnRMaXN0ZW5lcixcbiAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMuX3dpbmRvd0ZvY3VzTGlzdGVuZXIpO1xuXG4gICAgICAvLyBDbGVhciB0aW1lb3V0cyBmb3IgYWxsIHBvdGVudGlhbGx5IHBlbmRpbmcgdGltZW91dHMgdG8gcHJldmVudCB0aGUgbGVha3MuXG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fd2luZG93Rm9jdXNUaW1lb3V0SWQpO1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3RvdWNoVGltZW91dElkKTtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9vcmlnaW5UaW1lb3V0SWQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBVcGRhdGVzIGFsbCB0aGUgc3RhdGUgb24gYW4gZWxlbWVudCBvbmNlIGl0cyBmb2N1cyBvcmlnaW4gaGFzIGNoYW5nZWQuICovXG4gIHByaXZhdGUgX29yaWdpbkNoYW5nZWQoZWxlbWVudDogSFRNTEVsZW1lbnQsIG9yaWdpbjogRm9jdXNPcmlnaW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudEluZm86IE1vbml0b3JlZEVsZW1lbnRJbmZvKSB7XG4gICAgdGhpcy5fc2V0Q2xhc3NlcyhlbGVtZW50LCBvcmlnaW4pO1xuICAgIHRoaXMuX2VtaXRPcmlnaW4oZWxlbWVudEluZm8uc3ViamVjdCwgb3JpZ2luKTtcbiAgICB0aGlzLl9sYXN0Rm9jdXNPcmlnaW4gPSBvcmlnaW47XG4gIH1cbn1cblxuLyoqIEdldHMgdGhlIHRhcmdldCBvZiBhbiBldmVudCwgYWNjb3VudGluZyBmb3IgU2hhZG93IERPTS4gKi9cbmZ1bmN0aW9uIGdldFRhcmdldChldmVudDogRXZlbnQpOiBIVE1MRWxlbWVudHxudWxsIHtcbiAgLy8gSWYgYW4gZXZlbnQgaXMgYm91bmQgb3V0c2lkZSB0aGUgU2hhZG93IERPTSwgdGhlIGBldmVudC50YXJnZXRgIHdpbGxcbiAgLy8gcG9pbnQgdG8gdGhlIHNoYWRvdyByb290IHNvIHdlIGhhdmUgdG8gdXNlIGBjb21wb3NlZFBhdGhgIGluc3RlYWQuXG4gIHJldHVybiAoZXZlbnQuY29tcG9zZWRQYXRoID8gZXZlbnQuY29tcG9zZWRQYXRoKClbMF0gOiBldmVudC50YXJnZXQpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbn1cblxuXG4vKipcbiAqIERpcmVjdGl2ZSB0aGF0IGRldGVybWluZXMgaG93IGEgcGFydGljdWxhciBlbGVtZW50IHdhcyBmb2N1c2VkICh2aWEga2V5Ym9hcmQsIG1vdXNlLCB0b3VjaCwgb3JcbiAqIHByb2dyYW1tYXRpY2FsbHkpIGFuZCBhZGRzIGNvcnJlc3BvbmRpbmcgY2xhc3NlcyB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGVyZSBhcmUgdHdvIHZhcmlhbnRzIG9mIHRoaXMgZGlyZWN0aXZlOlxuICogMSkgY2RrTW9uaXRvckVsZW1lbnRGb2N1czogZG9lcyBub3QgY29uc2lkZXIgYW4gZWxlbWVudCB0byBiZSBmb2N1c2VkIGlmIG9uZSBvZiBpdHMgY2hpbGRyZW4gaXNcbiAqICAgIGZvY3VzZWQuXG4gKiAyKSBjZGtNb25pdG9yU3VidHJlZUZvY3VzOiBjb25zaWRlcnMgYW4gZWxlbWVudCBmb2N1c2VkIGlmIGl0IG9yIGFueSBvZiBpdHMgY2hpbGRyZW4gYXJlIGZvY3VzZWQuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtNb25pdG9yRWxlbWVudEZvY3VzXSwgW2Nka01vbml0b3JTdWJ0cmVlRm9jdXNdJyxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrTW9uaXRvckZvY3VzIGltcGxlbWVudHMgQWZ0ZXJWaWV3SW5pdCwgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSBfbW9uaXRvclN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uO1xuICBAT3V0cHV0KCkgY2RrRm9jdXNDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPEZvY3VzT3JpZ2luPigpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2VsZW1lbnRSZWY6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LCBwcml2YXRlIF9mb2N1c01vbml0b3I6IEZvY3VzTW9uaXRvcikge31cblxuICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcbiAgICB0aGlzLl9tb25pdG9yU3Vic2NyaXB0aW9uID0gdGhpcy5fZm9jdXNNb25pdG9yLm1vbml0b3IoXG4gICAgICBlbGVtZW50LFxuICAgICAgZWxlbWVudC5ub2RlVHlwZSA9PT0gMSAmJiBlbGVtZW50Lmhhc0F0dHJpYnV0ZSgnY2RrTW9uaXRvclN1YnRyZWVGb2N1cycpKVxuICAgIC5zdWJzY3JpYmUob3JpZ2luID0+IHRoaXMuY2RrRm9jdXNDaGFuZ2UuZW1pdChvcmlnaW4pKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2ZvY3VzTW9uaXRvci5zdG9wTW9uaXRvcmluZyh0aGlzLl9lbGVtZW50UmVmKTtcblxuICAgIGlmICh0aGlzLl9tb25pdG9yU3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aGlzLl9tb25pdG9yU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgfVxuICB9XG59XG4iXX0=