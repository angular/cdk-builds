/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/a11y/focus-monitor/focus-monitor.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Platform, normalizePassiveListenerOptions } from '@angular/cdk/platform';
import { Directive, ElementRef, EventEmitter, Injectable, NgZone, Output, } from '@angular/core';
import { of as observableOf, Subject } from 'rxjs';
import { coerceElement } from '@angular/cdk/coercion';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
// This is the value used by AngularJS Material. Through trial and error (on iPhone 6S) they found
// that a value of around 650ms seems appropriate.
/** @type {?} */
export const TOUCH_BUFFER_MS = 650;
/**
 * Corresponds to the options that can be passed to the native `focus` event.
 * via https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus
 * @record
 */
export function FocusOptions() { }
if (false) {
    /**
     * Whether the browser should scroll to the element when it is focused.
     * @type {?|undefined}
     */
    FocusOptions.prototype.preventScroll;
}
/**
 * Event listener options that enable capturing and also
 * mark the listener as passive if the browser supports it.
 * @type {?}
 */
const captureEventListenerOptions = normalizePassiveListenerOptions({
    passive: true,
    capture: true
});
/**
 * Monitors mouse and keyboard events to determine the cause of focus events.
 */
export class FocusMonitor {
    /**
     * @param {?} _ngZone
     * @param {?} _platform
     */
    constructor(_ngZone, _platform) {
        this._ngZone = _ngZone;
        this._platform = _platform;
        /**
         * The focus origin that the next focus event is a result of.
         */
        this._origin = null;
        /**
         * Whether the window has just been focused.
         */
        this._windowFocused = false;
        /**
         * Map of elements being monitored to their info.
         */
        this._elementInfo = new Map();
        /**
         * The number of elements currently being monitored.
         */
        this._monitoredElementCount = 0;
        /**
         * Event listener for `keydown` events on the document.
         * Needs to be an arrow function in order to preserve the context when it gets bound.
         */
        this._documentKeydownListener = (/**
         * @return {?}
         */
        () => {
            // On keydown record the origin and clear any touch event that may be in progress.
            this._lastTouchTarget = null;
            this._setOriginForCurrentEventQueue('keyboard');
        });
        /**
         * Event listener for `mousedown` events on the document.
         * Needs to be an arrow function in order to preserve the context when it gets bound.
         */
        this._documentMousedownListener = (/**
         * @return {?}
         */
        () => {
            // On mousedown record the origin only if there is not touch
            // target, since a mousedown can happen as a result of a touch event.
            if (!this._lastTouchTarget) {
                this._setOriginForCurrentEventQueue('mouse');
            }
        });
        /**
         * Event listener for `touchstart` events on the document.
         * Needs to be an arrow function in order to preserve the context when it gets bound.
         */
        this._documentTouchstartListener = (/**
         * @param {?} event
         * @return {?}
         */
        (event) => {
            // When the touchstart event fires the focus event is not yet in the event queue. This means
            // we can't rely on the trick used above (setting timeout of 1ms). Instead we wait 650ms to
            // see if a focus happens.
            if (this._touchTimeoutId != null) {
                clearTimeout(this._touchTimeoutId);
            }
            // Since this listener is bound on the `document` level, any events coming from the shadow DOM
            // will have their `target` set to the shadow root. If available, use `composedPath` to
            // figure out the event target.
            this._lastTouchTarget = event.composedPath ? event.composedPath()[0] : event.target;
            this._touchTimeoutId = setTimeout((/**
             * @return {?}
             */
            () => this._lastTouchTarget = null), TOUCH_BUFFER_MS);
        });
        /**
         * Event listener for `focus` events on the window.
         * Needs to be an arrow function in order to preserve the context when it gets bound.
         */
        this._windowFocusListener = (/**
         * @return {?}
         */
        () => {
            // Make a note of when the window regains focus, so we can
            // restore the origin info for the focused element.
            this._windowFocused = true;
            this._windowFocusTimeoutId = setTimeout((/**
             * @return {?}
             */
            () => this._windowFocused = false));
        });
    }
    /**
     * @param {?} element
     * @param {?=} checkChildren
     * @return {?}
     */
    monitor(element, checkChildren = false) {
        // Do nothing if we're not on the browser platform.
        if (!this._platform.isBrowser) {
            return observableOf(null);
        }
        /** @type {?} */
        const nativeElement = coerceElement(element);
        // Check if we're already monitoring this element.
        if (this._elementInfo.has(nativeElement)) {
            /** @type {?} */
            let cachedInfo = this._elementInfo.get(nativeElement);
            (/** @type {?} */ (cachedInfo)).checkChildren = checkChildren;
            return (/** @type {?} */ (cachedInfo)).subject.asObservable();
        }
        // Create monitored element info.
        /** @type {?} */
        let info = {
            unlisten: (/**
             * @return {?}
             */
            () => { }),
            checkChildren: checkChildren,
            subject: new Subject()
        };
        this._elementInfo.set(nativeElement, info);
        this._incrementMonitoredElementCount();
        // Start listening. We need to listen in capture phase since focus events don't bubble.
        /** @type {?} */
        let focusListener = (/**
         * @param {?} event
         * @return {?}
         */
        (event) => this._onFocus(event, nativeElement));
        /** @type {?} */
        let blurListener = (/**
         * @param {?} event
         * @return {?}
         */
        (event) => this._onBlur(event, nativeElement));
        this._ngZone.runOutsideAngular((/**
         * @return {?}
         */
        () => {
            nativeElement.addEventListener('focus', focusListener, true);
            nativeElement.addEventListener('blur', blurListener, true);
        }));
        // Create an unlisten function for later.
        info.unlisten = (/**
         * @return {?}
         */
        () => {
            nativeElement.removeEventListener('focus', focusListener, true);
            nativeElement.removeEventListener('blur', blurListener, true);
        });
        return info.subject.asObservable();
    }
    /**
     * @param {?} element
     * @return {?}
     */
    stopMonitoring(element) {
        /** @type {?} */
        const nativeElement = coerceElement(element);
        /** @type {?} */
        const elementInfo = this._elementInfo.get(nativeElement);
        if (elementInfo) {
            elementInfo.unlisten();
            elementInfo.subject.complete();
            this._setClasses(nativeElement);
            this._elementInfo.delete(nativeElement);
            this._decrementMonitoredElementCount();
        }
    }
    /**
     * @param {?} element
     * @param {?} origin
     * @param {?=} options
     * @return {?}
     */
    focusVia(element, origin, options) {
        /** @type {?} */
        const nativeElement = coerceElement(element);
        this._setOriginForCurrentEventQueue(origin);
        // `focus` isn't available on the server
        if (typeof nativeElement.focus === 'function') {
            // Cast the element to `any`, because the TS typings don't have the `options` parameter yet.
            ((/** @type {?} */ (nativeElement))).focus(options);
        }
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        this._elementInfo.forEach((/**
         * @param {?} _info
         * @param {?} element
         * @return {?}
         */
        (_info, element) => this.stopMonitoring(element)));
    }
    /**
     * @private
     * @param {?} element
     * @param {?} className
     * @param {?} shouldSet
     * @return {?}
     */
    _toggleClass(element, className, shouldSet) {
        if (shouldSet) {
            element.classList.add(className);
        }
        else {
            element.classList.remove(className);
        }
    }
    /**
     * Sets the focus classes on the element based on the given focus origin.
     * @private
     * @param {?} element The element to update the classes on.
     * @param {?=} origin The focus origin.
     * @return {?}
     */
    _setClasses(element, origin) {
        /** @type {?} */
        const elementInfo = this._elementInfo.get(element);
        if (elementInfo) {
            this._toggleClass(element, 'cdk-focused', !!origin);
            this._toggleClass(element, 'cdk-touch-focused', origin === 'touch');
            this._toggleClass(element, 'cdk-keyboard-focused', origin === 'keyboard');
            this._toggleClass(element, 'cdk-mouse-focused', origin === 'mouse');
            this._toggleClass(element, 'cdk-program-focused', origin === 'program');
        }
    }
    /**
     * Sets the origin and schedules an async function to clear it at the end of the event queue.
     * @private
     * @param {?} origin The origin to set.
     * @return {?}
     */
    _setOriginForCurrentEventQueue(origin) {
        this._ngZone.runOutsideAngular((/**
         * @return {?}
         */
        () => {
            this._origin = origin;
            // Sometimes the focus origin won't be valid in Firefox because Firefox seems to focus *one*
            // tick after the interaction event fired. To ensure the focus origin is always correct,
            // the focus origin will be determined at the beginning of the next tick.
            this._originTimeoutId = setTimeout((/**
             * @return {?}
             */
            () => this._origin = null), 1);
        }));
    }
    /**
     * Checks whether the given focus event was caused by a touchstart event.
     * @private
     * @param {?} event The focus event to check.
     * @return {?} Whether the event was caused by a touch.
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
        /** @type {?} */
        let focusTarget = event.target;
        return this._lastTouchTarget instanceof Node && focusTarget instanceof Node &&
            (focusTarget === this._lastTouchTarget || focusTarget.contains(this._lastTouchTarget));
    }
    /**
     * Handles focus events on a registered element.
     * @private
     * @param {?} event The focus event.
     * @param {?} element The monitored element.
     * @return {?}
     */
    _onFocus(event, element) {
        // NOTE(mmalerba): We currently set the classes based on the focus origin of the most recent
        // focus event affecting the monitored element. If we want to use the origin of the first event
        // instead we should check for the cdk-focused class here and return if the element already has
        // it. (This only matters for elements that have includesChildren = true).
        // NOTE(mmalerba): We currently set the classes based on the focus origin of the most recent
        // focus event affecting the monitored element. If we want to use the origin of the first event
        // instead we should check for the cdk-focused class here and return if the element already has
        // it. (This only matters for elements that have includesChildren = true).
        // If we are not counting child-element-focus as focused, make sure that the event target is the
        // monitored element itself.
        /** @type {?} */
        const elementInfo = this._elementInfo.get(element);
        if (!elementInfo || (!elementInfo.checkChildren && element !== event.target)) {
            return;
        }
        // If we couldn't detect a cause for the focus event, it's due to one of three reasons:
        // 1) The window has just regained focus, in which case we want to restore the focused state of
        //    the element from before the window blurred.
        // 2) It was caused by a touch event, in which case we mark the origin as 'touch'.
        // 3) The element was programmatically focused, in which case we should mark the origin as
        //    'program'.
        /** @type {?} */
        let origin = this._origin;
        if (!origin) {
            if (this._windowFocused && this._lastFocusOrigin) {
                origin = this._lastFocusOrigin;
            }
            else if (this._wasCausedByTouch(event)) {
                origin = 'touch';
            }
            else {
                origin = 'program';
            }
        }
        this._setClasses(element, origin);
        this._emitOrigin(elementInfo.subject, origin);
        this._lastFocusOrigin = origin;
    }
    /**
     * Handles blur events on a registered element.
     * @param {?} event The blur event.
     * @param {?} element The monitored element.
     * @return {?}
     */
    _onBlur(event, element) {
        // If we are counting child-element-focus as focused, make sure that we aren't just blurring in
        // order to focus another child of the monitored element.
        /** @type {?} */
        const elementInfo = this._elementInfo.get(element);
        if (!elementInfo || (elementInfo.checkChildren && event.relatedTarget instanceof Node &&
            element.contains(event.relatedTarget))) {
            return;
        }
        this._setClasses(element);
        this._emitOrigin(elementInfo.subject, null);
    }
    /**
     * @private
     * @param {?} subject
     * @param {?} origin
     * @return {?}
     */
    _emitOrigin(subject, origin) {
        this._ngZone.run((/**
         * @return {?}
         */
        () => subject.next(origin)));
    }
    /**
     * @private
     * @return {?}
     */
    _incrementMonitoredElementCount() {
        // Register global listeners when first element is monitored.
        if (++this._monitoredElementCount == 1 && this._platform.isBrowser) {
            // Note: we listen to events in the capture phase so we
            // can detect them even if the user stops propagation.
            this._ngZone.runOutsideAngular((/**
             * @return {?}
             */
            () => {
                document.addEventListener('keydown', this._documentKeydownListener, captureEventListenerOptions);
                document.addEventListener('mousedown', this._documentMousedownListener, captureEventListenerOptions);
                document.addEventListener('touchstart', this._documentTouchstartListener, captureEventListenerOptions);
                window.addEventListener('focus', this._windowFocusListener);
            }));
        }
    }
    /**
     * @private
     * @return {?}
     */
    _decrementMonitoredElementCount() {
        // Unregister global listeners when last element is unmonitored.
        if (!--this._monitoredElementCount) {
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
}
FocusMonitor.decorators = [
    { type: Injectable, args: [{ providedIn: 'root' },] }
];
/** @nocollapse */
FocusMonitor.ctorParameters = () => [
    { type: NgZone },
    { type: Platform }
];
/** @nocollapse */ FocusMonitor.ɵprov = i0.ɵɵdefineInjectable({ factory: function FocusMonitor_Factory() { return new FocusMonitor(i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i1.Platform)); }, token: FocusMonitor, providedIn: "root" });
if (false) {
    /**
     * The focus origin that the next focus event is a result of.
     * @type {?}
     * @private
     */
    FocusMonitor.prototype._origin;
    /**
     * The FocusOrigin of the last focus event tracked by the FocusMonitor.
     * @type {?}
     * @private
     */
    FocusMonitor.prototype._lastFocusOrigin;
    /**
     * Whether the window has just been focused.
     * @type {?}
     * @private
     */
    FocusMonitor.prototype._windowFocused;
    /**
     * The target of the last touch event.
     * @type {?}
     * @private
     */
    FocusMonitor.prototype._lastTouchTarget;
    /**
     * The timeout id of the touch timeout, used to cancel timeout later.
     * @type {?}
     * @private
     */
    FocusMonitor.prototype._touchTimeoutId;
    /**
     * The timeout id of the window focus timeout.
     * @type {?}
     * @private
     */
    FocusMonitor.prototype._windowFocusTimeoutId;
    /**
     * The timeout id of the origin clearing timeout.
     * @type {?}
     * @private
     */
    FocusMonitor.prototype._originTimeoutId;
    /**
     * Map of elements being monitored to their info.
     * @type {?}
     * @private
     */
    FocusMonitor.prototype._elementInfo;
    /**
     * The number of elements currently being monitored.
     * @type {?}
     * @private
     */
    FocusMonitor.prototype._monitoredElementCount;
    /**
     * Event listener for `keydown` events on the document.
     * Needs to be an arrow function in order to preserve the context when it gets bound.
     * @type {?}
     * @private
     */
    FocusMonitor.prototype._documentKeydownListener;
    /**
     * Event listener for `mousedown` events on the document.
     * Needs to be an arrow function in order to preserve the context when it gets bound.
     * @type {?}
     * @private
     */
    FocusMonitor.prototype._documentMousedownListener;
    /**
     * Event listener for `touchstart` events on the document.
     * Needs to be an arrow function in order to preserve the context when it gets bound.
     * @type {?}
     * @private
     */
    FocusMonitor.prototype._documentTouchstartListener;
    /**
     * Event listener for `focus` events on the window.
     * Needs to be an arrow function in order to preserve the context when it gets bound.
     * @type {?}
     * @private
     */
    FocusMonitor.prototype._windowFocusListener;
    /**
     * @type {?}
     * @private
     */
    FocusMonitor.prototype._ngZone;
    /**
     * @type {?}
     * @private
     */
    FocusMonitor.prototype._platform;
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
    /**
     * @param {?} _elementRef
     * @param {?} _focusMonitor
     */
    constructor(_elementRef, _focusMonitor) {
        this._elementRef = _elementRef;
        this._focusMonitor = _focusMonitor;
        this.cdkFocusChange = new EventEmitter();
        this._monitorSubscription = this._focusMonitor.monitor(this._elementRef, this._elementRef.nativeElement.hasAttribute('cdkMonitorSubtreeFocus'))
            .subscribe((/**
         * @param {?} origin
         * @return {?}
         */
        origin => this.cdkFocusChange.emit(origin)));
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        this._focusMonitor.stopMonitoring(this._elementRef);
        this._monitorSubscription.unsubscribe();
    }
}
CdkMonitorFocus.decorators = [
    { type: Directive, args: [{
                selector: '[cdkMonitorElementFocus], [cdkMonitorSubtreeFocus]',
            },] }
];
/** @nocollapse */
CdkMonitorFocus.ctorParameters = () => [
    { type: ElementRef },
    { type: FocusMonitor }
];
CdkMonitorFocus.propDecorators = {
    cdkFocusChange: [{ type: Output }]
};
if (false) {
    /**
     * @type {?}
     * @private
     */
    CdkMonitorFocus.prototype._monitorSubscription;
    /** @type {?} */
    CdkMonitorFocus.prototype.cdkFocusChange;
    /**
     * @type {?}
     * @private
     */
    CdkMonitorFocus.prototype._elementRef;
    /**
     * @type {?}
     * @private
     */
    CdkMonitorFocus.prototype._focusMonitor;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXMtbW9uaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvYTExeS9mb2N1cy1tb25pdG9yL2ZvY3VzLW1vbml0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFFBQVEsRUFBRSwrQkFBK0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2hGLE9BQU8sRUFDTCxTQUFTLEVBQ1QsVUFBVSxFQUNWLFlBQVksRUFDWixVQUFVLEVBQ1YsTUFBTSxFQUVOLE1BQU0sR0FDUCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQWEsRUFBRSxJQUFJLFlBQVksRUFBRSxPQUFPLEVBQWUsTUFBTSxNQUFNLENBQUM7QUFDM0UsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHVCQUF1QixDQUFDOzs7Ozs7QUFLcEQsTUFBTSxPQUFPLGVBQWUsR0FBRyxHQUFHOzs7Ozs7QUFTbEMsa0NBR0M7Ozs7OztJQURDLHFDQUF3Qjs7Ozs7OztNQWFwQiwyQkFBMkIsR0FBRywrQkFBK0IsQ0FBQztJQUNsRSxPQUFPLEVBQUUsSUFBSTtJQUNiLE9BQU8sRUFBRSxJQUFJO0NBQ2QsQ0FBQzs7OztBQUtGLE1BQU0sT0FBTyxZQUFZOzs7OztJQWdGdkIsWUFBb0IsT0FBZSxFQUFVLFNBQW1CO1FBQTVDLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFBVSxjQUFTLEdBQVQsU0FBUyxDQUFVOzs7O1FBOUV4RCxZQUFPLEdBQWdCLElBQUksQ0FBQzs7OztRQU01QixtQkFBYyxHQUFHLEtBQUssQ0FBQzs7OztRQWV2QixpQkFBWSxHQUFHLElBQUksR0FBRyxFQUFxQyxDQUFDOzs7O1FBRzVELDJCQUFzQixHQUFHLENBQUMsQ0FBQzs7Ozs7UUFNM0IsNkJBQXdCOzs7UUFBRyxHQUFHLEVBQUU7WUFDdEMsa0ZBQWtGO1lBQ2xGLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7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QUNwRCxJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDMUMsQ0FBQzs7O1lBakJGLFNBQVMsU0FBQztnQkFDVCxRQUFRLEVBQUUsb0RBQW9EO2FBQy9EOzs7O1lBMWFDLFVBQVU7WUErYXVFLFlBQVk7Ozs2QkFGNUYsTUFBTTs7Ozs7OztJQURQLCtDQUEyQzs7SUFDM0MseUNBQTJEOzs7OztJQUUvQyxzQ0FBNEM7Ozs7O0lBQUUsd0NBQW1DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UGxhdGZvcm0sIG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnN9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5qZWN0YWJsZSxcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIE91dHB1dCxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge09ic2VydmFibGUsIG9mIGFzIG9ic2VydmFibGVPZiwgU3ViamVjdCwgU3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcbmltcG9ydCB7Y29lcmNlRWxlbWVudH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcblxuXG4vLyBUaGlzIGlzIHRoZSB2YWx1ZSB1c2VkIGJ5IEFuZ3VsYXJKUyBNYXRlcmlhbC4gVGhyb3VnaCB0cmlhbCBhbmQgZXJyb3IgKG9uIGlQaG9uZSA2UykgdGhleSBmb3VuZFxuLy8gdGhhdCBhIHZhbHVlIG9mIGFyb3VuZCA2NTBtcyBzZWVtcyBhcHByb3ByaWF0ZS5cbmV4cG9ydCBjb25zdCBUT1VDSF9CVUZGRVJfTVMgPSA2NTA7XG5cblxuZXhwb3J0IHR5cGUgRm9jdXNPcmlnaW4gPSAndG91Y2gnIHwgJ21vdXNlJyB8ICdrZXlib2FyZCcgfCAncHJvZ3JhbScgfCBudWxsO1xuXG4vKipcbiAqIENvcnJlc3BvbmRzIHRvIHRoZSBvcHRpb25zIHRoYXQgY2FuIGJlIHBhc3NlZCB0byB0aGUgbmF0aXZlIGBmb2N1c2AgZXZlbnQuXG4gKiB2aWEgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0hUTUxFbGVtZW50L2ZvY3VzXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRm9jdXNPcHRpb25zIHtcbiAgLyoqIFdoZXRoZXIgdGhlIGJyb3dzZXIgc2hvdWxkIHNjcm9sbCB0byB0aGUgZWxlbWVudCB3aGVuIGl0IGlzIGZvY3VzZWQuICovXG4gIHByZXZlbnRTY3JvbGw/OiBib29sZWFuO1xufVxuXG50eXBlIE1vbml0b3JlZEVsZW1lbnRJbmZvID0ge1xuICB1bmxpc3RlbjogRnVuY3Rpb24sXG4gIGNoZWNrQ2hpbGRyZW46IGJvb2xlYW4sXG4gIHN1YmplY3Q6IFN1YmplY3Q8Rm9jdXNPcmlnaW4+XG59O1xuXG4vKipcbiAqIEV2ZW50IGxpc3RlbmVyIG9wdGlvbnMgdGhhdCBlbmFibGUgY2FwdHVyaW5nIGFuZCBhbHNvXG4gKiBtYXJrIHRoZSBsaXN0ZW5lciBhcyBwYXNzaXZlIGlmIHRoZSBicm93c2VyIHN1cHBvcnRzIGl0LlxuICovXG5jb25zdCBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMgPSBub3JtYWxpemVQYXNzaXZlTGlzdGVuZXJPcHRpb25zKHtcbiAgcGFzc2l2ZTogdHJ1ZSxcbiAgY2FwdHVyZTogdHJ1ZVxufSk7XG5cblxuLyoqIE1vbml0b3JzIG1vdXNlIGFuZCBrZXlib2FyZCBldmVudHMgdG8gZGV0ZXJtaW5lIHRoZSBjYXVzZSBvZiBmb2N1cyBldmVudHMuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBGb2N1c01vbml0b3IgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogVGhlIGZvY3VzIG9yaWdpbiB0aGF0IHRoZSBuZXh0IGZvY3VzIGV2ZW50IGlzIGEgcmVzdWx0IG9mLiAqL1xuICBwcml2YXRlIF9vcmlnaW46IEZvY3VzT3JpZ2luID0gbnVsbDtcblxuICAvKiogVGhlIEZvY3VzT3JpZ2luIG9mIHRoZSBsYXN0IGZvY3VzIGV2ZW50IHRyYWNrZWQgYnkgdGhlIEZvY3VzTW9uaXRvci4gKi9cbiAgcHJpdmF0ZSBfbGFzdEZvY3VzT3JpZ2luOiBGb2N1c09yaWdpbjtcblxuICAvKiogV2hldGhlciB0aGUgd2luZG93IGhhcyBqdXN0IGJlZW4gZm9jdXNlZC4gKi9cbiAgcHJpdmF0ZSBfd2luZG93Rm9jdXNlZCA9IGZhbHNlO1xuXG4gIC8qKiBUaGUgdGFyZ2V0IG9mIHRoZSBsYXN0IHRvdWNoIGV2ZW50LiAqL1xuICBwcml2YXRlIF9sYXN0VG91Y2hUYXJnZXQ6IEV2ZW50VGFyZ2V0IHwgbnVsbDtcblxuICAvKiogVGhlIHRpbWVvdXQgaWQgb2YgdGhlIHRvdWNoIHRpbWVvdXQsIHVzZWQgdG8gY2FuY2VsIHRpbWVvdXQgbGF0ZXIuICovXG4gIHByaXZhdGUgX3RvdWNoVGltZW91dElkOiBudW1iZXI7XG5cbiAgLyoqIFRoZSB0aW1lb3V0IGlkIG9mIHRoZSB3aW5kb3cgZm9jdXMgdGltZW91dC4gKi9cbiAgcHJpdmF0ZSBfd2luZG93Rm9jdXNUaW1lb3V0SWQ6IG51bWJlcjtcblxuICAvKiogVGhlIHRpbWVvdXQgaWQgb2YgdGhlIG9yaWdpbiBjbGVhcmluZyB0aW1lb3V0LiAqL1xuICBwcml2YXRlIF9vcmlnaW5UaW1lb3V0SWQ6IG51bWJlcjtcblxuICAvKiogTWFwIG9mIGVsZW1lbnRzIGJlaW5nIG1vbml0b3JlZCB0byB0aGVpciBpbmZvLiAqL1xuICBwcml2YXRlIF9lbGVtZW50SW5mbyA9IG5ldyBNYXA8SFRNTEVsZW1lbnQsIE1vbml0b3JlZEVsZW1lbnRJbmZvPigpO1xuXG4gIC8qKiBUaGUgbnVtYmVyIG9mIGVsZW1lbnRzIGN1cnJlbnRseSBiZWluZyBtb25pdG9yZWQuICovXG4gIHByaXZhdGUgX21vbml0b3JlZEVsZW1lbnRDb3VudCA9IDA7XG5cbiAgLyoqXG4gICAqIEV2ZW50IGxpc3RlbmVyIGZvciBga2V5ZG93bmAgZXZlbnRzIG9uIHRoZSBkb2N1bWVudC5cbiAgICogTmVlZHMgdG8gYmUgYW4gYXJyb3cgZnVuY3Rpb24gaW4gb3JkZXIgdG8gcHJlc2VydmUgdGhlIGNvbnRleHQgd2hlbiBpdCBnZXRzIGJvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfZG9jdW1lbnRLZXlkb3duTGlzdGVuZXIgPSAoKSA9PiB7XG4gICAgLy8gT24ga2V5ZG93biByZWNvcmQgdGhlIG9yaWdpbiBhbmQgY2xlYXIgYW55IHRvdWNoIGV2ZW50IHRoYXQgbWF5IGJlIGluIHByb2dyZXNzLlxuICAgIHRoaXMuX2xhc3RUb3VjaFRhcmdldCA9IG51bGw7XG4gICAgdGhpcy5fc2V0T3JpZ2luRm9yQ3VycmVudEV2ZW50UXVldWUoJ2tleWJvYXJkJyk7XG4gIH1cblxuICAvKipcbiAgICogRXZlbnQgbGlzdGVuZXIgZm9yIGBtb3VzZWRvd25gIGV2ZW50cyBvbiB0aGUgZG9jdW1lbnQuXG4gICAqIE5lZWRzIHRvIGJlIGFuIGFycm93IGZ1bmN0aW9uIGluIG9yZGVyIHRvIHByZXNlcnZlIHRoZSBjb250ZXh0IHdoZW4gaXQgZ2V0cyBib3VuZC5cbiAgICovXG4gIHByaXZhdGUgX2RvY3VtZW50TW91c2Vkb3duTGlzdGVuZXIgPSAoKSA9PiB7XG4gICAgLy8gT24gbW91c2Vkb3duIHJlY29yZCB0aGUgb3JpZ2luIG9ubHkgaWYgdGhlcmUgaXMgbm90IHRvdWNoXG4gICAgLy8gdGFyZ2V0LCBzaW5jZSBhIG1vdXNlZG93biBjYW4gaGFwcGVuIGFzIGEgcmVzdWx0IG9mIGEgdG91Y2ggZXZlbnQuXG4gICAgaWYgKCF0aGlzLl9sYXN0VG91Y2hUYXJnZXQpIHtcbiAgICAgIHRoaXMuX3NldE9yaWdpbkZvckN1cnJlbnRFdmVudFF1ZXVlKCdtb3VzZScpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFdmVudCBsaXN0ZW5lciBmb3IgYHRvdWNoc3RhcnRgIGV2ZW50cyBvbiB0aGUgZG9jdW1lbnQuXG4gICAqIE5lZWRzIHRvIGJlIGFuIGFycm93IGZ1bmN0aW9uIGluIG9yZGVyIHRvIHByZXNlcnZlIHRoZSBjb250ZXh0IHdoZW4gaXQgZ2V0cyBib3VuZC5cbiAgICovXG4gIHByaXZhdGUgX2RvY3VtZW50VG91Y2hzdGFydExpc3RlbmVyID0gKGV2ZW50OiBUb3VjaEV2ZW50KSA9PiB7XG4gICAgLy8gV2hlbiB0aGUgdG91Y2hzdGFydCBldmVudCBmaXJlcyB0aGUgZm9jdXMgZXZlbnQgaXMgbm90IHlldCBpbiB0aGUgZXZlbnQgcXVldWUuIFRoaXMgbWVhbnNcbiAgICAvLyB3ZSBjYW4ndCByZWx5IG9uIHRoZSB0cmljayB1c2VkIGFib3ZlIChzZXR0aW5nIHRpbWVvdXQgb2YgMW1zKS4gSW5zdGVhZCB3ZSB3YWl0IDY1MG1zIHRvXG4gICAgLy8gc2VlIGlmIGEgZm9jdXMgaGFwcGVucy5cbiAgICBpZiAodGhpcy5fdG91Y2hUaW1lb3V0SWQgIT0gbnVsbCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3RvdWNoVGltZW91dElkKTtcbiAgICB9XG5cbiAgICAvLyBTaW5jZSB0aGlzIGxpc3RlbmVyIGlzIGJvdW5kIG9uIHRoZSBgZG9jdW1lbnRgIGxldmVsLCBhbnkgZXZlbnRzIGNvbWluZyBmcm9tIHRoZSBzaGFkb3cgRE9NXG4gICAgLy8gd2lsbCBoYXZlIHRoZWlyIGB0YXJnZXRgIHNldCB0byB0aGUgc2hhZG93IHJvb3QuIElmIGF2YWlsYWJsZSwgdXNlIGBjb21wb3NlZFBhdGhgIHRvXG4gICAgLy8gZmlndXJlIG91dCB0aGUgZXZlbnQgdGFyZ2V0LlxuICAgIHRoaXMuX2xhc3RUb3VjaFRhcmdldCA9IGV2ZW50LmNvbXBvc2VkUGF0aCA/IGV2ZW50LmNvbXBvc2VkUGF0aCgpWzBdIDogZXZlbnQudGFyZ2V0O1xuICAgIHRoaXMuX3RvdWNoVGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLl9sYXN0VG91Y2hUYXJnZXQgPSBudWxsLCBUT1VDSF9CVUZGRVJfTVMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV2ZW50IGxpc3RlbmVyIGZvciBgZm9jdXNgIGV2ZW50cyBvbiB0aGUgd2luZG93LlxuICAgKiBOZWVkcyB0byBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0IGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF93aW5kb3dGb2N1c0xpc3RlbmVyID0gKCkgPT4ge1xuICAgIC8vIE1ha2UgYSBub3RlIG9mIHdoZW4gdGhlIHdpbmRvdyByZWdhaW5zIGZvY3VzLCBzbyB3ZSBjYW5cbiAgICAvLyByZXN0b3JlIHRoZSBvcmlnaW4gaW5mbyBmb3IgdGhlIGZvY3VzZWQgZWxlbWVudC5cbiAgICB0aGlzLl93aW5kb3dGb2N1c2VkID0gdHJ1ZTtcbiAgICB0aGlzLl93aW5kb3dGb2N1c1RpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fd2luZG93Rm9jdXNlZCA9IGZhbHNlKTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX25nWm9uZTogTmdab25lLCBwcml2YXRlIF9wbGF0Zm9ybTogUGxhdGZvcm0pIHt9XG5cbiAgLyoqXG4gICAqIE1vbml0b3JzIGZvY3VzIG9uIGFuIGVsZW1lbnQgYW5kIGFwcGxpZXMgYXBwcm9wcmlhdGUgQ1NTIGNsYXNzZXMuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIG1vbml0b3JcbiAgICogQHBhcmFtIGNoZWNrQ2hpbGRyZW4gV2hldGhlciB0byBjb3VudCB0aGUgZWxlbWVudCBhcyBmb2N1c2VkIHdoZW4gaXRzIGNoaWxkcmVuIGFyZSBmb2N1c2VkLlxuICAgKiBAcmV0dXJucyBBbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgd2hlbiB0aGUgZm9jdXMgc3RhdGUgb2YgdGhlIGVsZW1lbnQgY2hhbmdlcy5cbiAgICogICAgIFdoZW4gdGhlIGVsZW1lbnQgaXMgYmx1cnJlZCwgbnVsbCB3aWxsIGJlIGVtaXR0ZWQuXG4gICAqL1xuICBtb25pdG9yKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBjaGVja0NoaWxkcmVuPzogYm9vbGVhbik6IE9ic2VydmFibGU8Rm9jdXNPcmlnaW4+O1xuXG4gIC8qKlxuICAgKiBNb25pdG9ycyBmb2N1cyBvbiBhbiBlbGVtZW50IGFuZCBhcHBsaWVzIGFwcHJvcHJpYXRlIENTUyBjbGFzc2VzLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBtb25pdG9yXG4gICAqIEBwYXJhbSBjaGVja0NoaWxkcmVuIFdoZXRoZXIgdG8gY291bnQgdGhlIGVsZW1lbnQgYXMgZm9jdXNlZCB3aGVuIGl0cyBjaGlsZHJlbiBhcmUgZm9jdXNlZC5cbiAgICogQHJldHVybnMgQW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHdoZW4gdGhlIGZvY3VzIHN0YXRlIG9mIHRoZSBlbGVtZW50IGNoYW5nZXMuXG4gICAqICAgICBXaGVuIHRoZSBlbGVtZW50IGlzIGJsdXJyZWQsIG51bGwgd2lsbCBiZSBlbWl0dGVkLlxuICAgKi9cbiAgbW9uaXRvcihlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiwgY2hlY2tDaGlsZHJlbj86IGJvb2xlYW4pOiBPYnNlcnZhYmxlPEZvY3VzT3JpZ2luPjtcblxuICBtb25pdG9yKGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgICAgICAgY2hlY2tDaGlsZHJlbjogYm9vbGVhbiA9IGZhbHNlKTogT2JzZXJ2YWJsZTxGb2N1c09yaWdpbj4ge1xuICAgIC8vIERvIG5vdGhpbmcgaWYgd2UncmUgbm90IG9uIHRoZSBicm93c2VyIHBsYXRmb3JtLlxuICAgIGlmICghdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKG51bGwpO1xuICAgIH1cblxuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnQpO1xuXG4gICAgLy8gQ2hlY2sgaWYgd2UncmUgYWxyZWFkeSBtb25pdG9yaW5nIHRoaXMgZWxlbWVudC5cbiAgICBpZiAodGhpcy5fZWxlbWVudEluZm8uaGFzKG5hdGl2ZUVsZW1lbnQpKSB7XG4gICAgICBsZXQgY2FjaGVkSW5mbyA9IHRoaXMuX2VsZW1lbnRJbmZvLmdldChuYXRpdmVFbGVtZW50KTtcbiAgICAgIGNhY2hlZEluZm8hLmNoZWNrQ2hpbGRyZW4gPSBjaGVja0NoaWxkcmVuO1xuICAgICAgcmV0dXJuIGNhY2hlZEluZm8hLnN1YmplY3QuYXNPYnNlcnZhYmxlKCk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIG1vbml0b3JlZCBlbGVtZW50IGluZm8uXG4gICAgbGV0IGluZm86IE1vbml0b3JlZEVsZW1lbnRJbmZvID0ge1xuICAgICAgdW5saXN0ZW46ICgpID0+IHt9LFxuICAgICAgY2hlY2tDaGlsZHJlbjogY2hlY2tDaGlsZHJlbixcbiAgICAgIHN1YmplY3Q6IG5ldyBTdWJqZWN0PEZvY3VzT3JpZ2luPigpXG4gICAgfTtcbiAgICB0aGlzLl9lbGVtZW50SW5mby5zZXQobmF0aXZlRWxlbWVudCwgaW5mbyk7XG4gICAgdGhpcy5faW5jcmVtZW50TW9uaXRvcmVkRWxlbWVudENvdW50KCk7XG5cbiAgICAvLyBTdGFydCBsaXN0ZW5pbmcuIFdlIG5lZWQgdG8gbGlzdGVuIGluIGNhcHR1cmUgcGhhc2Ugc2luY2UgZm9jdXMgZXZlbnRzIGRvbid0IGJ1YmJsZS5cbiAgICBsZXQgZm9jdXNMaXN0ZW5lciA9IChldmVudDogRm9jdXNFdmVudCkgPT4gdGhpcy5fb25Gb2N1cyhldmVudCwgbmF0aXZlRWxlbWVudCk7XG4gICAgbGV0IGJsdXJMaXN0ZW5lciA9IChldmVudDogRm9jdXNFdmVudCkgPT4gdGhpcy5fb25CbHVyKGV2ZW50LCBuYXRpdmVFbGVtZW50KTtcbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgbmF0aXZlRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIGZvY3VzTGlzdGVuZXIsIHRydWUpO1xuICAgICAgbmF0aXZlRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgYmx1ckxpc3RlbmVyLCB0cnVlKTtcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBhbiB1bmxpc3RlbiBmdW5jdGlvbiBmb3IgbGF0ZXIuXG4gICAgaW5mby51bmxpc3RlbiA9ICgpID0+IHtcbiAgICAgIG5hdGl2ZUVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignZm9jdXMnLCBmb2N1c0xpc3RlbmVyLCB0cnVlKTtcbiAgICAgIG5hdGl2ZUVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignYmx1cicsIGJsdXJMaXN0ZW5lciwgdHJ1ZSk7XG4gICAgfTtcblxuICAgIHJldHVybiBpbmZvLnN1YmplY3QuYXNPYnNlcnZhYmxlKCk7XG4gIH1cblxuICAvKipcbiAgICogU3RvcHMgbW9uaXRvcmluZyBhbiBlbGVtZW50IGFuZCByZW1vdmVzIGFsbCBmb2N1cyBjbGFzc2VzLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBzdG9wIG1vbml0b3JpbmcuXG4gICAqL1xuICBzdG9wTW9uaXRvcmluZyhlbGVtZW50OiBIVE1MRWxlbWVudCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFN0b3BzIG1vbml0b3JpbmcgYW4gZWxlbWVudCBhbmQgcmVtb3ZlcyBhbGwgZm9jdXMgY2xhc3Nlcy5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gc3RvcCBtb25pdG9yaW5nLlxuICAgKi9cbiAgc3RvcE1vbml0b3JpbmcoZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4pOiB2b2lkO1xuXG4gIHN0b3BNb25pdG9yaW5nKGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4pOiB2b2lkIHtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gY29lcmNlRWxlbWVudChlbGVtZW50KTtcbiAgICBjb25zdCBlbGVtZW50SW5mbyA9IHRoaXMuX2VsZW1lbnRJbmZvLmdldChuYXRpdmVFbGVtZW50KTtcblxuICAgIGlmIChlbGVtZW50SW5mbykge1xuICAgICAgZWxlbWVudEluZm8udW5saXN0ZW4oKTtcbiAgICAgIGVsZW1lbnRJbmZvLnN1YmplY3QuY29tcGxldGUoKTtcblxuICAgICAgdGhpcy5fc2V0Q2xhc3NlcyhuYXRpdmVFbGVtZW50KTtcbiAgICAgIHRoaXMuX2VsZW1lbnRJbmZvLmRlbGV0ZShuYXRpdmVFbGVtZW50KTtcbiAgICAgIHRoaXMuX2RlY3JlbWVudE1vbml0b3JlZEVsZW1lbnRDb3VudCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGb2N1c2VzIHRoZSBlbGVtZW50IHZpYSB0aGUgc3BlY2lmaWVkIGZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCB0byBmb2N1cy5cbiAgICogQHBhcmFtIG9yaWdpbiBGb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCB0byBjb25maWd1cmUgdGhlIGZvY3VzIGJlaGF2aW9yLlxuICAgKi9cbiAgZm9jdXNWaWEoZWxlbWVudDogSFRNTEVsZW1lbnQsIG9yaWdpbjogRm9jdXNPcmlnaW4sIG9wdGlvbnM/OiBGb2N1c09wdGlvbnMpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBGb2N1c2VzIHRoZSBlbGVtZW50IHZpYSB0aGUgc3BlY2lmaWVkIGZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCB0byBmb2N1cy5cbiAgICogQHBhcmFtIG9yaWdpbiBGb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCB0byBjb25maWd1cmUgdGhlIGZvY3VzIGJlaGF2aW9yLlxuICAgKi9cbiAgZm9jdXNWaWEoZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sIG9yaWdpbjogRm9jdXNPcmlnaW4sIG9wdGlvbnM/OiBGb2N1c09wdGlvbnMpOiB2b2lkO1xuXG4gIGZvY3VzVmlhKGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgICAgICAgb3JpZ2luOiBGb2N1c09yaWdpbixcbiAgICAgICAgICBvcHRpb25zPzogRm9jdXNPcHRpb25zKTogdm9pZCB7XG5cbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gY29lcmNlRWxlbWVudChlbGVtZW50KTtcblxuICAgIHRoaXMuX3NldE9yaWdpbkZvckN1cnJlbnRFdmVudFF1ZXVlKG9yaWdpbik7XG5cbiAgICAvLyBgZm9jdXNgIGlzbid0IGF2YWlsYWJsZSBvbiB0aGUgc2VydmVyXG4gICAgaWYgKHR5cGVvZiBuYXRpdmVFbGVtZW50LmZvY3VzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyBDYXN0IHRoZSBlbGVtZW50IHRvIGBhbnlgLCBiZWNhdXNlIHRoZSBUUyB0eXBpbmdzIGRvbid0IGhhdmUgdGhlIGBvcHRpb25zYCBwYXJhbWV0ZXIgeWV0LlxuICAgICAgKG5hdGl2ZUVsZW1lbnQgYXMgYW55KS5mb2N1cyhvcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9lbGVtZW50SW5mby5mb3JFYWNoKChfaW5mbywgZWxlbWVudCkgPT4gdGhpcy5zdG9wTW9uaXRvcmluZyhlbGVtZW50KSk7XG4gIH1cblxuICBwcml2YXRlIF90b2dnbGVDbGFzcyhlbGVtZW50OiBFbGVtZW50LCBjbGFzc05hbWU6IHN0cmluZywgc2hvdWxkU2V0OiBib29sZWFuKSB7XG4gICAgaWYgKHNob3VsZFNldCkge1xuICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBmb2N1cyBjbGFzc2VzIG9uIHRoZSBlbGVtZW50IGJhc2VkIG9uIHRoZSBnaXZlbiBmb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHVwZGF0ZSB0aGUgY2xhc3NlcyBvbi5cbiAgICogQHBhcmFtIG9yaWdpbiBUaGUgZm9jdXMgb3JpZ2luLlxuICAgKi9cbiAgcHJpdmF0ZSBfc2V0Q2xhc3NlcyhlbGVtZW50OiBIVE1MRWxlbWVudCwgb3JpZ2luPzogRm9jdXNPcmlnaW4pOiB2b2lkIHtcbiAgICBjb25zdCBlbGVtZW50SW5mbyA9IHRoaXMuX2VsZW1lbnRJbmZvLmdldChlbGVtZW50KTtcblxuICAgIGlmIChlbGVtZW50SW5mbykge1xuICAgICAgdGhpcy5fdG9nZ2xlQ2xhc3MoZWxlbWVudCwgJ2Nkay1mb2N1c2VkJywgISFvcmlnaW4pO1xuICAgICAgdGhpcy5fdG9nZ2xlQ2xhc3MoZWxlbWVudCwgJ2Nkay10b3VjaC1mb2N1c2VkJywgb3JpZ2luID09PSAndG91Y2gnKTtcbiAgICAgIHRoaXMuX3RvZ2dsZUNsYXNzKGVsZW1lbnQsICdjZGsta2V5Ym9hcmQtZm9jdXNlZCcsIG9yaWdpbiA9PT0gJ2tleWJvYXJkJyk7XG4gICAgICB0aGlzLl90b2dnbGVDbGFzcyhlbGVtZW50LCAnY2RrLW1vdXNlLWZvY3VzZWQnLCBvcmlnaW4gPT09ICdtb3VzZScpO1xuICAgICAgdGhpcy5fdG9nZ2xlQ2xhc3MoZWxlbWVudCwgJ2Nkay1wcm9ncmFtLWZvY3VzZWQnLCBvcmlnaW4gPT09ICdwcm9ncmFtJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG9yaWdpbiBhbmQgc2NoZWR1bGVzIGFuIGFzeW5jIGZ1bmN0aW9uIHRvIGNsZWFyIGl0IGF0IHRoZSBlbmQgb2YgdGhlIGV2ZW50IHF1ZXVlLlxuICAgKiBAcGFyYW0gb3JpZ2luIFRoZSBvcmlnaW4gdG8gc2V0LlxuICAgKi9cbiAgcHJpdmF0ZSBfc2V0T3JpZ2luRm9yQ3VycmVudEV2ZW50UXVldWUob3JpZ2luOiBGb2N1c09yaWdpbik6IHZvaWQge1xuICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICB0aGlzLl9vcmlnaW4gPSBvcmlnaW47XG4gICAgICAvLyBTb21ldGltZXMgdGhlIGZvY3VzIG9yaWdpbiB3b24ndCBiZSB2YWxpZCBpbiBGaXJlZm94IGJlY2F1c2UgRmlyZWZveCBzZWVtcyB0byBmb2N1cyAqb25lKlxuICAgICAgLy8gdGljayBhZnRlciB0aGUgaW50ZXJhY3Rpb24gZXZlbnQgZmlyZWQuIFRvIGVuc3VyZSB0aGUgZm9jdXMgb3JpZ2luIGlzIGFsd2F5cyBjb3JyZWN0LFxuICAgICAgLy8gdGhlIGZvY3VzIG9yaWdpbiB3aWxsIGJlIGRldGVybWluZWQgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgbmV4dCB0aWNrLlxuICAgICAgdGhpcy5fb3JpZ2luVGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLl9vcmlnaW4gPSBudWxsLCAxKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgZ2l2ZW4gZm9jdXMgZXZlbnQgd2FzIGNhdXNlZCBieSBhIHRvdWNoc3RhcnQgZXZlbnQuXG4gICAqIEBwYXJhbSBldmVudCBUaGUgZm9jdXMgZXZlbnQgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIFdoZXRoZXIgdGhlIGV2ZW50IHdhcyBjYXVzZWQgYnkgYSB0b3VjaC5cbiAgICovXG4gIHByaXZhdGUgX3dhc0NhdXNlZEJ5VG91Y2goZXZlbnQ6IEZvY3VzRXZlbnQpOiBib29sZWFuIHtcbiAgICAvLyBOb3RlKG1tYWxlcmJhKTogVGhpcyBpbXBsZW1lbnRhdGlvbiBpcyBub3QgcXVpdGUgcGVyZmVjdCwgdGhlcmUgaXMgYSBzbWFsbCBlZGdlIGNhc2UuXG4gICAgLy8gQ29uc2lkZXIgdGhlIGZvbGxvd2luZyBkb20gc3RydWN0dXJlOlxuICAgIC8vXG4gICAgLy8gPGRpdiAjcGFyZW50IHRhYmluZGV4PVwiMFwiIGNka0ZvY3VzQ2xhc3Nlcz5cbiAgICAvLyAgIDxkaXYgI2NoaWxkIChjbGljayk9XCIjcGFyZW50LmZvY3VzKClcIj48L2Rpdj5cbiAgICAvLyA8L2Rpdj5cbiAgICAvL1xuICAgIC8vIElmIHRoZSB1c2VyIHRvdWNoZXMgdGhlICNjaGlsZCBlbGVtZW50IGFuZCB0aGUgI3BhcmVudCBpcyBwcm9ncmFtbWF0aWNhbGx5IGZvY3VzZWQgYXMgYVxuICAgIC8vIHJlc3VsdCwgdGhpcyBjb2RlIHdpbGwgc3RpbGwgY29uc2lkZXIgaXQgdG8gaGF2ZSBiZWVuIGNhdXNlZCBieSB0aGUgdG91Y2ggZXZlbnQgYW5kIHdpbGxcbiAgICAvLyBhcHBseSB0aGUgY2RrLXRvdWNoLWZvY3VzZWQgY2xhc3MgcmF0aGVyIHRoYW4gdGhlIGNkay1wcm9ncmFtLWZvY3VzZWQgY2xhc3MuIFRoaXMgaXMgYVxuICAgIC8vIHJlbGF0aXZlbHkgc21hbGwgZWRnZS1jYXNlIHRoYXQgY2FuIGJlIHdvcmtlZCBhcm91bmQgYnkgdXNpbmdcbiAgICAvLyBmb2N1c1ZpYShwYXJlbnRFbCwgJ3Byb2dyYW0nKSB0byBmb2N1cyB0aGUgcGFyZW50IGVsZW1lbnQuXG4gICAgLy9cbiAgICAvLyBJZiB3ZSBkZWNpZGUgdGhhdCB3ZSBhYnNvbHV0ZWx5IG11c3QgaGFuZGxlIHRoaXMgY2FzZSBjb3JyZWN0bHksIHdlIGNhbiBkbyBzbyBieSBsaXN0ZW5pbmdcbiAgICAvLyBmb3IgdGhlIGZpcnN0IGZvY3VzIGV2ZW50IGFmdGVyIHRoZSB0b3VjaHN0YXJ0LCBhbmQgdGhlbiB0aGUgZmlyc3QgYmx1ciBldmVudCBhZnRlciB0aGF0XG4gICAgLy8gZm9jdXMgZXZlbnQuIFdoZW4gdGhhdCBibHVyIGV2ZW50IGZpcmVzIHdlIGtub3cgdGhhdCB3aGF0ZXZlciBmb2xsb3dzIGlzIG5vdCBhIHJlc3VsdCBvZiB0aGVcbiAgICAvLyB0b3VjaHN0YXJ0LlxuICAgIGxldCBmb2N1c1RhcmdldCA9IGV2ZW50LnRhcmdldDtcbiAgICByZXR1cm4gdGhpcy5fbGFzdFRvdWNoVGFyZ2V0IGluc3RhbmNlb2YgTm9kZSAmJiBmb2N1c1RhcmdldCBpbnN0YW5jZW9mIE5vZGUgJiZcbiAgICAgICAgKGZvY3VzVGFyZ2V0ID09PSB0aGlzLl9sYXN0VG91Y2hUYXJnZXQgfHwgZm9jdXNUYXJnZXQuY29udGFpbnModGhpcy5fbGFzdFRvdWNoVGFyZ2V0KSk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBmb2N1cyBldmVudHMgb24gYSByZWdpc3RlcmVkIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBldmVudCBUaGUgZm9jdXMgZXZlbnQuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBtb25pdG9yZWQgZWxlbWVudC5cbiAgICovXG4gIHByaXZhdGUgX29uRm9jdXMoZXZlbnQ6IEZvY3VzRXZlbnQsIGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgLy8gTk9URShtbWFsZXJiYSk6IFdlIGN1cnJlbnRseSBzZXQgdGhlIGNsYXNzZXMgYmFzZWQgb24gdGhlIGZvY3VzIG9yaWdpbiBvZiB0aGUgbW9zdCByZWNlbnRcbiAgICAvLyBmb2N1cyBldmVudCBhZmZlY3RpbmcgdGhlIG1vbml0b3JlZCBlbGVtZW50LiBJZiB3ZSB3YW50IHRvIHVzZSB0aGUgb3JpZ2luIG9mIHRoZSBmaXJzdCBldmVudFxuICAgIC8vIGluc3RlYWQgd2Ugc2hvdWxkIGNoZWNrIGZvciB0aGUgY2RrLWZvY3VzZWQgY2xhc3MgaGVyZSBhbmQgcmV0dXJuIGlmIHRoZSBlbGVtZW50IGFscmVhZHkgaGFzXG4gICAgLy8gaXQuIChUaGlzIG9ubHkgbWF0dGVycyBmb3IgZWxlbWVudHMgdGhhdCBoYXZlIGluY2x1ZGVzQ2hpbGRyZW4gPSB0cnVlKS5cblxuICAgIC8vIElmIHdlIGFyZSBub3QgY291bnRpbmcgY2hpbGQtZWxlbWVudC1mb2N1cyBhcyBmb2N1c2VkLCBtYWtlIHN1cmUgdGhhdCB0aGUgZXZlbnQgdGFyZ2V0IGlzIHRoZVxuICAgIC8vIG1vbml0b3JlZCBlbGVtZW50IGl0c2VsZi5cbiAgICBjb25zdCBlbGVtZW50SW5mbyA9IHRoaXMuX2VsZW1lbnRJbmZvLmdldChlbGVtZW50KTtcbiAgICBpZiAoIWVsZW1lbnRJbmZvIHx8ICghZWxlbWVudEluZm8uY2hlY2tDaGlsZHJlbiAmJiBlbGVtZW50ICE9PSBldmVudC50YXJnZXQpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgY291bGRuJ3QgZGV0ZWN0IGEgY2F1c2UgZm9yIHRoZSBmb2N1cyBldmVudCwgaXQncyBkdWUgdG8gb25lIG9mIHRocmVlIHJlYXNvbnM6XG4gICAgLy8gMSkgVGhlIHdpbmRvdyBoYXMganVzdCByZWdhaW5lZCBmb2N1cywgaW4gd2hpY2ggY2FzZSB3ZSB3YW50IHRvIHJlc3RvcmUgdGhlIGZvY3VzZWQgc3RhdGUgb2ZcbiAgICAvLyAgICB0aGUgZWxlbWVudCBmcm9tIGJlZm9yZSB0aGUgd2luZG93IGJsdXJyZWQuXG4gICAgLy8gMikgSXQgd2FzIGNhdXNlZCBieSBhIHRvdWNoIGV2ZW50LCBpbiB3aGljaCBjYXNlIHdlIG1hcmsgdGhlIG9yaWdpbiBhcyAndG91Y2gnLlxuICAgIC8vIDMpIFRoZSBlbGVtZW50IHdhcyBwcm9ncmFtbWF0aWNhbGx5IGZvY3VzZWQsIGluIHdoaWNoIGNhc2Ugd2Ugc2hvdWxkIG1hcmsgdGhlIG9yaWdpbiBhc1xuICAgIC8vICAgICdwcm9ncmFtJy5cbiAgICBsZXQgb3JpZ2luID0gdGhpcy5fb3JpZ2luO1xuICAgIGlmICghb3JpZ2luKSB7XG4gICAgICBpZiAodGhpcy5fd2luZG93Rm9jdXNlZCAmJiB0aGlzLl9sYXN0Rm9jdXNPcmlnaW4pIHtcbiAgICAgICAgb3JpZ2luID0gdGhpcy5fbGFzdEZvY3VzT3JpZ2luO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLl93YXNDYXVzZWRCeVRvdWNoKGV2ZW50KSkge1xuICAgICAgICBvcmlnaW4gPSAndG91Y2gnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3JpZ2luID0gJ3Byb2dyYW0nO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX3NldENsYXNzZXMoZWxlbWVudCwgb3JpZ2luKTtcbiAgICB0aGlzLl9lbWl0T3JpZ2luKGVsZW1lbnRJbmZvLnN1YmplY3QsIG9yaWdpbik7XG4gICAgdGhpcy5fbGFzdEZvY3VzT3JpZ2luID0gb3JpZ2luO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgYmx1ciBldmVudHMgb24gYSByZWdpc3RlcmVkIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBldmVudCBUaGUgYmx1ciBldmVudC5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIG1vbml0b3JlZCBlbGVtZW50LlxuICAgKi9cbiAgX29uQmx1cihldmVudDogRm9jdXNFdmVudCwgZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgICAvLyBJZiB3ZSBhcmUgY291bnRpbmcgY2hpbGQtZWxlbWVudC1mb2N1cyBhcyBmb2N1c2VkLCBtYWtlIHN1cmUgdGhhdCB3ZSBhcmVuJ3QganVzdCBibHVycmluZyBpblxuICAgIC8vIG9yZGVyIHRvIGZvY3VzIGFub3RoZXIgY2hpbGQgb2YgdGhlIG1vbml0b3JlZCBlbGVtZW50LlxuICAgIGNvbnN0IGVsZW1lbnRJbmZvID0gdGhpcy5fZWxlbWVudEluZm8uZ2V0KGVsZW1lbnQpO1xuXG4gICAgaWYgKCFlbGVtZW50SW5mbyB8fCAoZWxlbWVudEluZm8uY2hlY2tDaGlsZHJlbiAmJiBldmVudC5yZWxhdGVkVGFyZ2V0IGluc3RhbmNlb2YgTm9kZSAmJlxuICAgICAgICBlbGVtZW50LmNvbnRhaW5zKGV2ZW50LnJlbGF0ZWRUYXJnZXQpKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3NldENsYXNzZXMoZWxlbWVudCk7XG4gICAgdGhpcy5fZW1pdE9yaWdpbihlbGVtZW50SW5mby5zdWJqZWN0LCBudWxsKTtcbiAgfVxuXG4gIHByaXZhdGUgX2VtaXRPcmlnaW4oc3ViamVjdDogU3ViamVjdDxGb2N1c09yaWdpbj4sIG9yaWdpbjogRm9jdXNPcmlnaW4pIHtcbiAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHN1YmplY3QubmV4dChvcmlnaW4pKTtcbiAgfVxuXG4gIHByaXZhdGUgX2luY3JlbWVudE1vbml0b3JlZEVsZW1lbnRDb3VudCgpIHtcbiAgICAvLyBSZWdpc3RlciBnbG9iYWwgbGlzdGVuZXJzIHdoZW4gZmlyc3QgZWxlbWVudCBpcyBtb25pdG9yZWQuXG4gICAgaWYgKCsrdGhpcy5fbW9uaXRvcmVkRWxlbWVudENvdW50ID09IDEgJiYgdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICAvLyBOb3RlOiB3ZSBsaXN0ZW4gdG8gZXZlbnRzIGluIHRoZSBjYXB0dXJlIHBoYXNlIHNvIHdlXG4gICAgICAvLyBjYW4gZGV0ZWN0IHRoZW0gZXZlbiBpZiB0aGUgdXNlciBzdG9wcyBwcm9wYWdhdGlvbi5cbiAgICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9kb2N1bWVudEtleWRvd25MaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9kb2N1bWVudE1vdXNlZG93bkxpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9kb2N1bWVudFRvdWNoc3RhcnRMaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCB0aGlzLl93aW5kb3dGb2N1c0xpc3RlbmVyKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2RlY3JlbWVudE1vbml0b3JlZEVsZW1lbnRDb3VudCgpIHtcbiAgICAvLyBVbnJlZ2lzdGVyIGdsb2JhbCBsaXN0ZW5lcnMgd2hlbiBsYXN0IGVsZW1lbnQgaXMgdW5tb25pdG9yZWQuXG4gICAgaWYgKCEtLXRoaXMuX21vbml0b3JlZEVsZW1lbnRDb3VudCkge1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX2RvY3VtZW50S2V5ZG93bkxpc3RlbmVyLFxuICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fZG9jdW1lbnRNb3VzZWRvd25MaXN0ZW5lcixcbiAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9kb2N1bWVudFRvdWNoc3RhcnRMaXN0ZW5lcixcbiAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMuX3dpbmRvd0ZvY3VzTGlzdGVuZXIpO1xuXG4gICAgICAvLyBDbGVhciB0aW1lb3V0cyBmb3IgYWxsIHBvdGVudGlhbGx5IHBlbmRpbmcgdGltZW91dHMgdG8gcHJldmVudCB0aGUgbGVha3MuXG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fd2luZG93Rm9jdXNUaW1lb3V0SWQpO1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3RvdWNoVGltZW91dElkKTtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9vcmlnaW5UaW1lb3V0SWQpO1xuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogRGlyZWN0aXZlIHRoYXQgZGV0ZXJtaW5lcyBob3cgYSBwYXJ0aWN1bGFyIGVsZW1lbnQgd2FzIGZvY3VzZWQgKHZpYSBrZXlib2FyZCwgbW91c2UsIHRvdWNoLCBvclxuICogcHJvZ3JhbW1hdGljYWxseSkgYW5kIGFkZHMgY29ycmVzcG9uZGluZyBjbGFzc2VzIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIFRoZXJlIGFyZSB0d28gdmFyaWFudHMgb2YgdGhpcyBkaXJlY3RpdmU6XG4gKiAxKSBjZGtNb25pdG9yRWxlbWVudEZvY3VzOiBkb2VzIG5vdCBjb25zaWRlciBhbiBlbGVtZW50IHRvIGJlIGZvY3VzZWQgaWYgb25lIG9mIGl0cyBjaGlsZHJlbiBpc1xuICogICAgZm9jdXNlZC5cbiAqIDIpIGNka01vbml0b3JTdWJ0cmVlRm9jdXM6IGNvbnNpZGVycyBhbiBlbGVtZW50IGZvY3VzZWQgaWYgaXQgb3IgYW55IG9mIGl0cyBjaGlsZHJlbiBhcmUgZm9jdXNlZC5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka01vbml0b3JFbGVtZW50Rm9jdXNdLCBbY2RrTW9uaXRvclN1YnRyZWVGb2N1c10nLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtNb25pdG9yRm9jdXMgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9tb25pdG9yU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb247XG4gIEBPdXRwdXQoKSBjZGtGb2N1c0NoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8Rm9jdXNPcmlnaW4+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sIHByaXZhdGUgX2ZvY3VzTW9uaXRvcjogRm9jdXNNb25pdG9yKSB7XG4gICAgdGhpcy5fbW9uaXRvclN1YnNjcmlwdGlvbiA9IHRoaXMuX2ZvY3VzTW9uaXRvci5tb25pdG9yKFxuICAgICAgICB0aGlzLl9lbGVtZW50UmVmLFxuICAgICAgICB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuaGFzQXR0cmlidXRlKCdjZGtNb25pdG9yU3VidHJlZUZvY3VzJykpXG4gICAgICAgIC5zdWJzY3JpYmUob3JpZ2luID0+IHRoaXMuY2RrRm9jdXNDaGFuZ2UuZW1pdChvcmlnaW4pKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2ZvY3VzTW9uaXRvci5zdG9wTW9uaXRvcmluZyh0aGlzLl9lbGVtZW50UmVmKTtcbiAgICB0aGlzLl9tb25pdG9yU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gIH1cbn1cbiJdfQ==