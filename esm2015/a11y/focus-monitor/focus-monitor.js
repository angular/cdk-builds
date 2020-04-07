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
import { Directive, ElementRef, EventEmitter, Inject, Injectable, InjectionToken, NgZone, Optional, Output, } from '@angular/core';
import { of as observableOf, Subject } from 'rxjs';
import { coerceElement } from '@angular/cdk/coercion';
import { DOCUMENT } from '@angular/common';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
import * as i2 from "@angular/common";
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
/** @enum {number} */
const FocusMonitorDetectionMode = {
    /**
     * Any mousedown, keydown, or touchstart event that happened in the previous
     * tick or the current tick will be used to assign a focus event's origin (to
     * either mouse, keyboard, or touch). This is the default option.
     */
    IMMEDIATE: 0,
    /**
     * A focus event's origin is always attributed to the last corresponding
     * mousedown, keydown, or touchstart event, no matter how long ago it occured.
     */
    EVENTUAL: 1,
};
export { FocusMonitorDetectionMode };
/**
 * Injectable service-level options for FocusMonitor.
 * @record
 */
export function FocusMonitorOptions() { }
if (false) {
    /** @type {?|undefined} */
    FocusMonitorOptions.prototype.detectionMode;
}
/**
 * InjectionToken for FocusMonitorOptions.
 * @type {?}
 */
export const FOCUS_MONITOR_DEFAULT_OPTIONS = new InjectionToken('cdk-focus-monitor-default-options');
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
     * @param {?} document
     * @param {?} options
     */
    constructor(_ngZone, _platform, 
    /** @breaking-change 11.0.0 make document required */
    document, options) {
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
        /**
         * Event listener for `focus` and 'blur' events on the document.
         * Needs to be an arrow function in order to preserve the context when it gets bound.
         */
        this._documentFocusAndBlurListener = (/**
         * @param {?} event
         * @return {?}
         */
        (event) => {
            /** @type {?} */
            const target = (/** @type {?} */ (event.target));
            /** @type {?} */
            const handler = event.type === 'focus' ? this._onFocus : this._onBlur;
            // We need to walk up the ancestor chain in order to support `checkChildren`.
            for (let el = target; el; el = el.parentElement) {
                handler.call(this, event, el);
            }
        });
        this._document = document;
        this._detectionMode = (options === null || options === void 0 ? void 0 : options.detectionMode) || 0 /* IMMEDIATE */;
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
            const cachedInfo = this._elementInfo.get(nativeElement);
            (/** @type {?} */ (cachedInfo)).checkChildren = checkChildren;
            return (/** @type {?} */ (cachedInfo)).subject.asObservable();
        }
        // Create monitored element info.
        /** @type {?} */
        const info = {
            checkChildren: checkChildren,
            subject: new Subject()
        };
        this._elementInfo.set(nativeElement, info);
        this._incrementMonitoredElementCount();
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
     * Access injected document if available or fallback to global document reference
     * @private
     * @return {?}
     */
    _getDocument() {
        return this._document || document;
    }
    /**
     * Use defaultView of injected document if available or fallback to global window reference
     * @private
     * @return {?}
     */
    _getWindow() {
        /** @type {?} */
        const doc = this._getDocument();
        return doc.defaultView || window;
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
     * @private
     * @param {?} event
     * @return {?}
     */
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
     * @private
     * @param {?} element The element to update the classes on.
     * @param {?=} origin The focus origin.
     * @return {?}
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
            if (this._detectionMode === 0 /* IMMEDIATE */) {
                // Sometimes the focus origin won't be valid in Firefox because Firefox seems to focus *one*
                // tick after the interaction event fired. To ensure the focus origin is always correct,
                // the focus origin will be determined at the beginning of the next tick.
                this._originTimeoutId = setTimeout((/**
                 * @return {?}
                 */
                () => this._origin = null), 1);
            }
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
        /** @type {?} */
        const origin = this._getFocusOrigin(event);
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
                /** @type {?} */
                const document = this._getDocument();
                /** @type {?} */
                const window = this._getWindow();
                document.addEventListener('focus', this._documentFocusAndBlurListener, captureEventListenerOptions);
                document.addEventListener('blur', this._documentFocusAndBlurListener, captureEventListenerOptions);
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
            /** @type {?} */
            const document = this._getDocument();
            /** @type {?} */
            const window = this._getWindow();
            document.removeEventListener('focus', this._documentFocusAndBlurListener, captureEventListenerOptions);
            document.removeEventListener('blur', this._documentFocusAndBlurListener, captureEventListenerOptions);
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
    { type: Platform },
    { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [DOCUMENT,] }] },
    { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [FOCUS_MONITOR_DEFAULT_OPTIONS,] }] }
];
/** @nocollapse */ FocusMonitor.ɵprov = i0.ɵɵdefineInjectable({ factory: function FocusMonitor_Factory() { return new FocusMonitor(i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i1.Platform), i0.ɵɵinject(i2.DOCUMENT, 8), i0.ɵɵinject(FOCUS_MONITOR_DEFAULT_OPTIONS, 8)); }, token: FocusMonitor, providedIn: "root" });
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
     * The specified detection mode, used for attributing the origin of a focus
     * event.
     * @type {?}
     * @private
     */
    FocusMonitor.prototype._detectionMode;
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
     * Used to reference correct document/window
     * @type {?}
     * @protected
     */
    FocusMonitor.prototype._document;
    /**
     * Event listener for `focus` and 'blur' events on the document.
     * Needs to be an arrow function in order to preserve the context when it gets bound.
     * @type {?}
     * @private
     */
    FocusMonitor.prototype._documentFocusAndBlurListener;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXMtbW9uaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvYTExeS9mb2N1cy1tb25pdG9yL2ZvY3VzLW1vbml0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFFBQVEsRUFBRSwrQkFBK0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2hGLE9BQU8sRUFDTCxTQUFTLEVBQ1QsVUFBVSxFQUNWLFlBQVksRUFDWixNQUFNLEVBQ04sVUFBVSxFQUNWLGNBQWMsRUFDZCxNQUFNLEVBRU4sUUFBUSxFQUNSLE1BQU0sR0FDUCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQWEsRUFBRSxJQUFJLFlBQVksRUFBRSxPQUFPLEVBQWUsTUFBTSxNQUFNLENBQUM7QUFDM0UsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3BELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQzs7Ozs7OztBQUt6QyxNQUFNLE9BQU8sZUFBZSxHQUFHLEdBQUc7Ozs7OztBQVNsQyxrQ0FHQzs7Ozs7O0lBREMscUNBQXdCOzs7QUFJMUIsTUFBa0IseUJBQXlCO0lBQ3pDOzs7O09BSUc7SUFDSCxTQUFTLEdBQUE7SUFDVDs7O09BR0c7SUFDSCxRQUFRLEdBQUE7RUFDVDs7Ozs7O0FBR0QseUNBRUM7OztJQURDLDRDQUEwQzs7Ozs7O0FBSTVDLE1BQU0sT0FBTyw2QkFBNkIsR0FDdEMsSUFBSSxjQUFjLENBQXNCLG1DQUFtQyxDQUFDOzs7Ozs7TUFXMUUsMkJBQTJCLEdBQUcsK0JBQStCLENBQUM7SUFDbEUsT0FBTyxFQUFFLElBQUk7SUFDYixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUM7Ozs7QUFLRixNQUFNLE9BQU8sWUFBWTs7Ozs7OztJQXlGdkIsWUFDWSxPQUFlLEVBQ2YsU0FBbUI7SUFDM0IscURBQXFEO0lBQ3ZCLFFB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RCxDQUFDOzs7O0lBRUQsV0FBVztRQUNULElBQUksQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNwRCxJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDMUMsQ0FBQzs7O1lBakJGLFNBQVMsU0FBQztnQkFDVCxRQUFRLEVBQUUsb0RBQW9EO2FBQy9EOzs7O1lBamZDLFVBQVU7WUFzZnVFLFlBQVk7Ozs2QkFGNUYsTUFBTTs7Ozs7OztJQURQLCtDQUEyQzs7SUFDM0MseUNBQTJEOzs7OztJQUUvQyxzQ0FBNEM7Ozs7O0lBQUUsd0NBQW1DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UGxhdGZvcm0sIG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnN9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5qZWN0LFxuICBJbmplY3RhYmxlLFxuICBJbmplY3Rpb25Ub2tlbixcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIE9wdGlvbmFsLFxuICBPdXRwdXQsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBvZiBhcyBvYnNlcnZhYmxlT2YsIFN1YmplY3QsIFN1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2NvZXJjZUVsZW1lbnR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuXG5cbi8vIFRoaXMgaXMgdGhlIHZhbHVlIHVzZWQgYnkgQW5ndWxhckpTIE1hdGVyaWFsLiBUaHJvdWdoIHRyaWFsIGFuZCBlcnJvciAob24gaVBob25lIDZTKSB0aGV5IGZvdW5kXG4vLyB0aGF0IGEgdmFsdWUgb2YgYXJvdW5kIDY1MG1zIHNlZW1zIGFwcHJvcHJpYXRlLlxuZXhwb3J0IGNvbnN0IFRPVUNIX0JVRkZFUl9NUyA9IDY1MDtcblxuXG5leHBvcnQgdHlwZSBGb2N1c09yaWdpbiA9ICd0b3VjaCcgfCAnbW91c2UnIHwgJ2tleWJvYXJkJyB8ICdwcm9ncmFtJyB8IG51bGw7XG5cbi8qKlxuICogQ29ycmVzcG9uZHMgdG8gdGhlIG9wdGlvbnMgdGhhdCBjYW4gYmUgcGFzc2VkIHRvIHRoZSBuYXRpdmUgYGZvY3VzYCBldmVudC5cbiAqIHZpYSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvSFRNTEVsZW1lbnQvZm9jdXNcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBGb2N1c09wdGlvbnMge1xuICAvKiogV2hldGhlciB0aGUgYnJvd3NlciBzaG91bGQgc2Nyb2xsIHRvIHRoZSBlbGVtZW50IHdoZW4gaXQgaXMgZm9jdXNlZC4gKi9cbiAgcHJldmVudFNjcm9sbD86IGJvb2xlYW47XG59XG5cbi8qKiBEZXRlY3Rpb24gbW9kZSB1c2VkIGZvciBhdHRyaWJ1dGluZyB0aGUgb3JpZ2luIG9mIGEgZm9jdXMgZXZlbnQuICovXG5leHBvcnQgY29uc3QgZW51bSBGb2N1c01vbml0b3JEZXRlY3Rpb25Nb2RlIHtcbiAgLyoqXG4gICAqIEFueSBtb3VzZWRvd24sIGtleWRvd24sIG9yIHRvdWNoc3RhcnQgZXZlbnQgdGhhdCBoYXBwZW5lZCBpbiB0aGUgcHJldmlvdXNcbiAgICogdGljayBvciB0aGUgY3VycmVudCB0aWNrIHdpbGwgYmUgdXNlZCB0byBhc3NpZ24gYSBmb2N1cyBldmVudCdzIG9yaWdpbiAodG9cbiAgICogZWl0aGVyIG1vdXNlLCBrZXlib2FyZCwgb3IgdG91Y2gpLiBUaGlzIGlzIHRoZSBkZWZhdWx0IG9wdGlvbi5cbiAgICovXG4gIElNTUVESUFURSxcbiAgLyoqXG4gICAqIEEgZm9jdXMgZXZlbnQncyBvcmlnaW4gaXMgYWx3YXlzIGF0dHJpYnV0ZWQgdG8gdGhlIGxhc3QgY29ycmVzcG9uZGluZ1xuICAgKiBtb3VzZWRvd24sIGtleWRvd24sIG9yIHRvdWNoc3RhcnQgZXZlbnQsIG5vIG1hdHRlciBob3cgbG9uZyBhZ28gaXQgb2NjdXJlZC5cbiAgICovXG4gIEVWRU5UVUFMXG59XG5cbi8qKiBJbmplY3RhYmxlIHNlcnZpY2UtbGV2ZWwgb3B0aW9ucyBmb3IgRm9jdXNNb25pdG9yLiAqL1xuZXhwb3J0IGludGVyZmFjZSBGb2N1c01vbml0b3JPcHRpb25zIHtcbiAgZGV0ZWN0aW9uTW9kZT86IEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGU7XG59XG5cbi8qKiBJbmplY3Rpb25Ub2tlbiBmb3IgRm9jdXNNb25pdG9yT3B0aW9ucy4gKi9cbmV4cG9ydCBjb25zdCBGT0NVU19NT05JVE9SX0RFRkFVTFRfT1BUSU9OUyA9XG4gICAgbmV3IEluamVjdGlvblRva2VuPEZvY3VzTW9uaXRvck9wdGlvbnM+KCdjZGstZm9jdXMtbW9uaXRvci1kZWZhdWx0LW9wdGlvbnMnKTtcblxudHlwZSBNb25pdG9yZWRFbGVtZW50SW5mbyA9IHtcbiAgY2hlY2tDaGlsZHJlbjogYm9vbGVhbixcbiAgc3ViamVjdDogU3ViamVjdDxGb2N1c09yaWdpbj5cbn07XG5cbi8qKlxuICogRXZlbnQgbGlzdGVuZXIgb3B0aW9ucyB0aGF0IGVuYWJsZSBjYXB0dXJpbmcgYW5kIGFsc29cbiAqIG1hcmsgdGhlIGxpc3RlbmVyIGFzIHBhc3NpdmUgaWYgdGhlIGJyb3dzZXIgc3VwcG9ydHMgaXQuXG4gKi9cbmNvbnN0IGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyA9IG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMoe1xuICBwYXNzaXZlOiB0cnVlLFxuICBjYXB0dXJlOiB0cnVlXG59KTtcblxuXG4vKiogTW9uaXRvcnMgbW91c2UgYW5kIGtleWJvYXJkIGV2ZW50cyB0byBkZXRlcm1pbmUgdGhlIGNhdXNlIG9mIGZvY3VzIGV2ZW50cy4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIEZvY3VzTW9uaXRvciBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qKiBUaGUgZm9jdXMgb3JpZ2luIHRoYXQgdGhlIG5leHQgZm9jdXMgZXZlbnQgaXMgYSByZXN1bHQgb2YuICovXG4gIHByaXZhdGUgX29yaWdpbjogRm9jdXNPcmlnaW4gPSBudWxsO1xuXG4gIC8qKiBUaGUgRm9jdXNPcmlnaW4gb2YgdGhlIGxhc3QgZm9jdXMgZXZlbnQgdHJhY2tlZCBieSB0aGUgRm9jdXNNb25pdG9yLiAqL1xuICBwcml2YXRlIF9sYXN0Rm9jdXNPcmlnaW46IEZvY3VzT3JpZ2luO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSB3aW5kb3cgaGFzIGp1c3QgYmVlbiBmb2N1c2VkLiAqL1xuICBwcml2YXRlIF93aW5kb3dGb2N1c2VkID0gZmFsc2U7XG5cbiAgLyoqIFRoZSB0YXJnZXQgb2YgdGhlIGxhc3QgdG91Y2ggZXZlbnQuICovXG4gIHByaXZhdGUgX2xhc3RUb3VjaFRhcmdldDogRXZlbnRUYXJnZXQgfCBudWxsO1xuXG4gIC8qKiBUaGUgdGltZW91dCBpZCBvZiB0aGUgdG91Y2ggdGltZW91dCwgdXNlZCB0byBjYW5jZWwgdGltZW91dCBsYXRlci4gKi9cbiAgcHJpdmF0ZSBfdG91Y2hUaW1lb3V0SWQ6IG51bWJlcjtcblxuICAvKiogVGhlIHRpbWVvdXQgaWQgb2YgdGhlIHdpbmRvdyBmb2N1cyB0aW1lb3V0LiAqL1xuICBwcml2YXRlIF93aW5kb3dGb2N1c1RpbWVvdXRJZDogbnVtYmVyO1xuXG4gIC8qKiBUaGUgdGltZW91dCBpZCBvZiB0aGUgb3JpZ2luIGNsZWFyaW5nIHRpbWVvdXQuICovXG4gIHByaXZhdGUgX29yaWdpblRpbWVvdXRJZDogbnVtYmVyO1xuXG4gIC8qKiBNYXAgb2YgZWxlbWVudHMgYmVpbmcgbW9uaXRvcmVkIHRvIHRoZWlyIGluZm8uICovXG4gIHByaXZhdGUgX2VsZW1lbnRJbmZvID0gbmV3IE1hcDxIVE1MRWxlbWVudCwgTW9uaXRvcmVkRWxlbWVudEluZm8+KCk7XG5cbiAgLyoqIFRoZSBudW1iZXIgb2YgZWxlbWVudHMgY3VycmVudGx5IGJlaW5nIG1vbml0b3JlZC4gKi9cbiAgcHJpdmF0ZSBfbW9uaXRvcmVkRWxlbWVudENvdW50ID0gMDtcblxuICAvKipcbiAgICogVGhlIHNwZWNpZmllZCBkZXRlY3Rpb24gbW9kZSwgdXNlZCBmb3IgYXR0cmlidXRpbmcgdGhlIG9yaWdpbiBvZiBhIGZvY3VzXG4gICAqIGV2ZW50LlxuICAgKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfZGV0ZWN0aW9uTW9kZTogRm9jdXNNb25pdG9yRGV0ZWN0aW9uTW9kZTtcblxuICAvKipcbiAgICogRXZlbnQgbGlzdGVuZXIgZm9yIGBrZXlkb3duYCBldmVudHMgb24gdGhlIGRvY3VtZW50LlxuICAgKiBOZWVkcyB0byBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0IGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF9kb2N1bWVudEtleWRvd25MaXN0ZW5lciA9ICgpID0+IHtcbiAgICAvLyBPbiBrZXlkb3duIHJlY29yZCB0aGUgb3JpZ2luIGFuZCBjbGVhciBhbnkgdG91Y2ggZXZlbnQgdGhhdCBtYXkgYmUgaW4gcHJvZ3Jlc3MuXG4gICAgdGhpcy5fbGFzdFRvdWNoVGFyZ2V0ID0gbnVsbDtcbiAgICB0aGlzLl9zZXRPcmlnaW5Gb3JDdXJyZW50RXZlbnRRdWV1ZSgna2V5Ym9hcmQnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFdmVudCBsaXN0ZW5lciBmb3IgYG1vdXNlZG93bmAgZXZlbnRzIG9uIHRoZSBkb2N1bWVudC5cbiAgICogTmVlZHMgdG8gYmUgYW4gYXJyb3cgZnVuY3Rpb24gaW4gb3JkZXIgdG8gcHJlc2VydmUgdGhlIGNvbnRleHQgd2hlbiBpdCBnZXRzIGJvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfZG9jdW1lbnRNb3VzZWRvd25MaXN0ZW5lciA9ICgpID0+IHtcbiAgICAvLyBPbiBtb3VzZWRvd24gcmVjb3JkIHRoZSBvcmlnaW4gb25seSBpZiB0aGVyZSBpcyBub3QgdG91Y2hcbiAgICAvLyB0YXJnZXQsIHNpbmNlIGEgbW91c2Vkb3duIGNhbiBoYXBwZW4gYXMgYSByZXN1bHQgb2YgYSB0b3VjaCBldmVudC5cbiAgICBpZiAoIXRoaXMuX2xhc3RUb3VjaFRhcmdldCkge1xuICAgICAgdGhpcy5fc2V0T3JpZ2luRm9yQ3VycmVudEV2ZW50UXVldWUoJ21vdXNlJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEV2ZW50IGxpc3RlbmVyIGZvciBgdG91Y2hzdGFydGAgZXZlbnRzIG9uIHRoZSBkb2N1bWVudC5cbiAgICogTmVlZHMgdG8gYmUgYW4gYXJyb3cgZnVuY3Rpb24gaW4gb3JkZXIgdG8gcHJlc2VydmUgdGhlIGNvbnRleHQgd2hlbiBpdCBnZXRzIGJvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfZG9jdW1lbnRUb3VjaHN0YXJ0TGlzdGVuZXIgPSAoZXZlbnQ6IFRvdWNoRXZlbnQpID0+IHtcbiAgICAvLyBXaGVuIHRoZSB0b3VjaHN0YXJ0IGV2ZW50IGZpcmVzIHRoZSBmb2N1cyBldmVudCBpcyBub3QgeWV0IGluIHRoZSBldmVudCBxdWV1ZS4gVGhpcyBtZWFuc1xuICAgIC8vIHdlIGNhbid0IHJlbHkgb24gdGhlIHRyaWNrIHVzZWQgYWJvdmUgKHNldHRpbmcgdGltZW91dCBvZiAxbXMpLiBJbnN0ZWFkIHdlIHdhaXQgNjUwbXMgdG9cbiAgICAvLyBzZWUgaWYgYSBmb2N1cyBoYXBwZW5zLlxuICAgIGlmICh0aGlzLl90b3VjaFRpbWVvdXRJZCAhPSBudWxsKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fdG91Y2hUaW1lb3V0SWQpO1xuICAgIH1cblxuICAgIC8vIFNpbmNlIHRoaXMgbGlzdGVuZXIgaXMgYm91bmQgb24gdGhlIGBkb2N1bWVudGAgbGV2ZWwsIGFueSBldmVudHMgY29taW5nIGZyb20gdGhlIHNoYWRvdyBET01cbiAgICAvLyB3aWxsIGhhdmUgdGhlaXIgYHRhcmdldGAgc2V0IHRvIHRoZSBzaGFkb3cgcm9vdC4gSWYgYXZhaWxhYmxlLCB1c2UgYGNvbXBvc2VkUGF0aGAgdG9cbiAgICAvLyBmaWd1cmUgb3V0IHRoZSBldmVudCB0YXJnZXQuXG4gICAgdGhpcy5fbGFzdFRvdWNoVGFyZ2V0ID0gZXZlbnQuY29tcG9zZWRQYXRoID8gZXZlbnQuY29tcG9zZWRQYXRoKClbMF0gOiBldmVudC50YXJnZXQ7XG4gICAgdGhpcy5fdG91Y2hUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX2xhc3RUb3VjaFRhcmdldCA9IG51bGwsIFRPVUNIX0JVRkZFUl9NUyk7XG4gIH1cblxuICAvKipcbiAgICogRXZlbnQgbGlzdGVuZXIgZm9yIGBmb2N1c2AgZXZlbnRzIG9uIHRoZSB3aW5kb3cuXG4gICAqIE5lZWRzIHRvIGJlIGFuIGFycm93IGZ1bmN0aW9uIGluIG9yZGVyIHRvIHByZXNlcnZlIHRoZSBjb250ZXh0IHdoZW4gaXQgZ2V0cyBib3VuZC5cbiAgICovXG4gIHByaXZhdGUgX3dpbmRvd0ZvY3VzTGlzdGVuZXIgPSAoKSA9PiB7XG4gICAgLy8gTWFrZSBhIG5vdGUgb2Ygd2hlbiB0aGUgd2luZG93IHJlZ2FpbnMgZm9jdXMsIHNvIHdlIGNhblxuICAgIC8vIHJlc3RvcmUgdGhlIG9yaWdpbiBpbmZvIGZvciB0aGUgZm9jdXNlZCBlbGVtZW50LlxuICAgIHRoaXMuX3dpbmRvd0ZvY3VzZWQgPSB0cnVlO1xuICAgIHRoaXMuX3dpbmRvd0ZvY3VzVGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLl93aW5kb3dGb2N1c2VkID0gZmFsc2UpO1xuICB9XG5cbiAgLyoqIFVzZWQgdG8gcmVmZXJlbmNlIGNvcnJlY3QgZG9jdW1lbnQvd2luZG93ICovXG4gIHByb3RlY3RlZCBfZG9jdW1lbnQ/OiBEb2N1bWVudDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgICAgcHJpdmF0ZSBfcGxhdGZvcm06IFBsYXRmb3JtLFxuICAgICAgLyoqIEBicmVha2luZy1jaGFuZ2UgMTEuMC4wIG1ha2UgZG9jdW1lbnQgcmVxdWlyZWQgKi9cbiAgICAgIEBPcHRpb25hbCgpIEBJbmplY3QoRE9DVU1FTlQpIGRvY3VtZW50OiBhbnl8bnVsbCxcbiAgICAgIEBPcHRpb25hbCgpIEBJbmplY3QoRk9DVVNfTU9OSVRPUl9ERUZBVUxUX09QVElPTlMpIG9wdGlvbnM6XG4gICAgICAgICAgRm9jdXNNb25pdG9yT3B0aW9uc3xudWxsKSB7XG4gICAgdGhpcy5fZG9jdW1lbnQgPSBkb2N1bWVudDtcbiAgICB0aGlzLl9kZXRlY3Rpb25Nb2RlID0gb3B0aW9ucz8uZGV0ZWN0aW9uTW9kZSB8fCBGb2N1c01vbml0b3JEZXRlY3Rpb25Nb2RlLklNTUVESUFURTtcbiAgfVxuICAvKipcbiAgICogRXZlbnQgbGlzdGVuZXIgZm9yIGBmb2N1c2AgYW5kICdibHVyJyBldmVudHMgb24gdGhlIGRvY3VtZW50LlxuICAgKiBOZWVkcyB0byBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0IGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF9kb2N1bWVudEZvY3VzQW5kQmx1ckxpc3RlbmVyID0gKGV2ZW50OiBGb2N1c0V2ZW50KSA9PiB7XG4gICAgY29uc3QgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50fG51bGw7XG4gICAgY29uc3QgaGFuZGxlciA9IGV2ZW50LnR5cGUgPT09ICdmb2N1cycgPyB0aGlzLl9vbkZvY3VzIDogdGhpcy5fb25CbHVyO1xuXG4gICAgLy8gV2UgbmVlZCB0byB3YWxrIHVwIHRoZSBhbmNlc3RvciBjaGFpbiBpbiBvcmRlciB0byBzdXBwb3J0IGBjaGVja0NoaWxkcmVuYC5cbiAgICBmb3IgKGxldCBlbCA9IHRhcmdldDsgZWw7IGVsID0gZWwucGFyZW50RWxlbWVudCkge1xuICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGV2ZW50LCBlbCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE1vbml0b3JzIGZvY3VzIG9uIGFuIGVsZW1lbnQgYW5kIGFwcGxpZXMgYXBwcm9wcmlhdGUgQ1NTIGNsYXNzZXMuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIG1vbml0b3JcbiAgICogQHBhcmFtIGNoZWNrQ2hpbGRyZW4gV2hldGhlciB0byBjb3VudCB0aGUgZWxlbWVudCBhcyBmb2N1c2VkIHdoZW4gaXRzIGNoaWxkcmVuIGFyZSBmb2N1c2VkLlxuICAgKiBAcmV0dXJucyBBbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgd2hlbiB0aGUgZm9jdXMgc3RhdGUgb2YgdGhlIGVsZW1lbnQgY2hhbmdlcy5cbiAgICogICAgIFdoZW4gdGhlIGVsZW1lbnQgaXMgYmx1cnJlZCwgbnVsbCB3aWxsIGJlIGVtaXR0ZWQuXG4gICAqL1xuICBtb25pdG9yKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBjaGVja0NoaWxkcmVuPzogYm9vbGVhbik6IE9ic2VydmFibGU8Rm9jdXNPcmlnaW4+O1xuXG4gIC8qKlxuICAgKiBNb25pdG9ycyBmb2N1cyBvbiBhbiBlbGVtZW50IGFuZCBhcHBsaWVzIGFwcHJvcHJpYXRlIENTUyBjbGFzc2VzLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBtb25pdG9yXG4gICAqIEBwYXJhbSBjaGVja0NoaWxkcmVuIFdoZXRoZXIgdG8gY291bnQgdGhlIGVsZW1lbnQgYXMgZm9jdXNlZCB3aGVuIGl0cyBjaGlsZHJlbiBhcmUgZm9jdXNlZC5cbiAgICogQHJldHVybnMgQW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHdoZW4gdGhlIGZvY3VzIHN0YXRlIG9mIHRoZSBlbGVtZW50IGNoYW5nZXMuXG4gICAqICAgICBXaGVuIHRoZSBlbGVtZW50IGlzIGJsdXJyZWQsIG51bGwgd2lsbCBiZSBlbWl0dGVkLlxuICAgKi9cbiAgbW9uaXRvcihlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiwgY2hlY2tDaGlsZHJlbj86IGJvb2xlYW4pOiBPYnNlcnZhYmxlPEZvY3VzT3JpZ2luPjtcblxuICBtb25pdG9yKGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgICAgICAgY2hlY2tDaGlsZHJlbjogYm9vbGVhbiA9IGZhbHNlKTogT2JzZXJ2YWJsZTxGb2N1c09yaWdpbj4ge1xuICAgIC8vIERvIG5vdGhpbmcgaWYgd2UncmUgbm90IG9uIHRoZSBicm93c2VyIHBsYXRmb3JtLlxuICAgIGlmICghdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKG51bGwpO1xuICAgIH1cblxuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnQpO1xuXG4gICAgLy8gQ2hlY2sgaWYgd2UncmUgYWxyZWFkeSBtb25pdG9yaW5nIHRoaXMgZWxlbWVudC5cbiAgICBpZiAodGhpcy5fZWxlbWVudEluZm8uaGFzKG5hdGl2ZUVsZW1lbnQpKSB7XG4gICAgICBjb25zdCBjYWNoZWRJbmZvID0gdGhpcy5fZWxlbWVudEluZm8uZ2V0KG5hdGl2ZUVsZW1lbnQpO1xuICAgICAgY2FjaGVkSW5mbyEuY2hlY2tDaGlsZHJlbiA9IGNoZWNrQ2hpbGRyZW47XG4gICAgICByZXR1cm4gY2FjaGVkSW5mbyEuc3ViamVjdC5hc09ic2VydmFibGUoKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgbW9uaXRvcmVkIGVsZW1lbnQgaW5mby5cbiAgICBjb25zdCBpbmZvOiBNb25pdG9yZWRFbGVtZW50SW5mbyA9IHtcbiAgICAgIGNoZWNrQ2hpbGRyZW46IGNoZWNrQ2hpbGRyZW4sXG4gICAgICBzdWJqZWN0OiBuZXcgU3ViamVjdDxGb2N1c09yaWdpbj4oKVxuICAgIH07XG4gICAgdGhpcy5fZWxlbWVudEluZm8uc2V0KG5hdGl2ZUVsZW1lbnQsIGluZm8pO1xuICAgIHRoaXMuX2luY3JlbWVudE1vbml0b3JlZEVsZW1lbnRDb3VudCgpO1xuXG4gICAgcmV0dXJuIGluZm8uc3ViamVjdC5hc09ic2VydmFibGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9wcyBtb25pdG9yaW5nIGFuIGVsZW1lbnQgYW5kIHJlbW92ZXMgYWxsIGZvY3VzIGNsYXNzZXMuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHN0b3AgbW9uaXRvcmluZy5cbiAgICovXG4gIHN0b3BNb25pdG9yaW5nKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogdm9pZDtcblxuICAvKipcbiAgICogU3RvcHMgbW9uaXRvcmluZyBhbiBlbGVtZW50IGFuZCByZW1vdmVzIGFsbCBmb2N1cyBjbGFzc2VzLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBzdG9wIG1vbml0b3JpbmcuXG4gICAqL1xuICBzdG9wTW9uaXRvcmluZyhlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50Pik6IHZvaWQ7XG5cbiAgc3RvcE1vbml0b3JpbmcoZWxlbWVudDogSFRNTEVsZW1lbnQgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50Pik6IHZvaWQge1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnQpO1xuICAgIGNvbnN0IGVsZW1lbnRJbmZvID0gdGhpcy5fZWxlbWVudEluZm8uZ2V0KG5hdGl2ZUVsZW1lbnQpO1xuXG4gICAgaWYgKGVsZW1lbnRJbmZvKSB7XG4gICAgICBlbGVtZW50SW5mby5zdWJqZWN0LmNvbXBsZXRlKCk7XG5cbiAgICAgIHRoaXMuX3NldENsYXNzZXMobmF0aXZlRWxlbWVudCk7XG4gICAgICB0aGlzLl9lbGVtZW50SW5mby5kZWxldGUobmF0aXZlRWxlbWVudCk7XG4gICAgICB0aGlzLl9kZWNyZW1lbnRNb25pdG9yZWRFbGVtZW50Q291bnQoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRm9jdXNlcyB0aGUgZWxlbWVudCB2aWEgdGhlIHNwZWNpZmllZCBmb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgdG8gZm9jdXMuXG4gICAqIEBwYXJhbSBvcmlnaW4gRm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIHRoYXQgY2FuIGJlIHVzZWQgdG8gY29uZmlndXJlIHRoZSBmb2N1cyBiZWhhdmlvci5cbiAgICovXG4gIGZvY3VzVmlhKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBvcmlnaW46IEZvY3VzT3JpZ2luLCBvcHRpb25zPzogRm9jdXNPcHRpb25zKTogdm9pZDtcblxuICAvKipcbiAgICogRm9jdXNlcyB0aGUgZWxlbWVudCB2aWEgdGhlIHNwZWNpZmllZCBmb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgdG8gZm9jdXMuXG4gICAqIEBwYXJhbSBvcmlnaW4gRm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIHRoYXQgY2FuIGJlIHVzZWQgdG8gY29uZmlndXJlIHRoZSBmb2N1cyBiZWhhdmlvci5cbiAgICovXG4gIGZvY3VzVmlhKGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LCBvcmlnaW46IEZvY3VzT3JpZ2luLCBvcHRpb25zPzogRm9jdXNPcHRpb25zKTogdm9pZDtcblxuICBmb2N1c1ZpYShlbGVtZW50OiBIVE1MRWxlbWVudCB8IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgICAgICAgIG9yaWdpbjogRm9jdXNPcmlnaW4sXG4gICAgICAgICAgb3B0aW9ucz86IEZvY3VzT3B0aW9ucyk6IHZvaWQge1xuXG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoZWxlbWVudCk7XG5cbiAgICB0aGlzLl9zZXRPcmlnaW5Gb3JDdXJyZW50RXZlbnRRdWV1ZShvcmlnaW4pO1xuXG4gICAgLy8gYGZvY3VzYCBpc24ndCBhdmFpbGFibGUgb24gdGhlIHNlcnZlclxuICAgIGlmICh0eXBlb2YgbmF0aXZlRWxlbWVudC5mb2N1cyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gQ2FzdCB0aGUgZWxlbWVudCB0byBgYW55YCwgYmVjYXVzZSB0aGUgVFMgdHlwaW5ncyBkb24ndCBoYXZlIHRoZSBgb3B0aW9uc2AgcGFyYW1ldGVyIHlldC5cbiAgICAgIChuYXRpdmVFbGVtZW50IGFzIGFueSkuZm9jdXMob3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fZWxlbWVudEluZm8uZm9yRWFjaCgoX2luZm8sIGVsZW1lbnQpID0+IHRoaXMuc3RvcE1vbml0b3JpbmcoZWxlbWVudCkpO1xuICB9XG5cbiAgLyoqIEFjY2VzcyBpbmplY3RlZCBkb2N1bWVudCBpZiBhdmFpbGFibGUgb3IgZmFsbGJhY2sgdG8gZ2xvYmFsIGRvY3VtZW50IHJlZmVyZW5jZSAqL1xuICBwcml2YXRlIF9nZXREb2N1bWVudCgpOiBEb2N1bWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX2RvY3VtZW50IHx8IGRvY3VtZW50O1xuICB9XG5cbiAgLyoqIFVzZSBkZWZhdWx0VmlldyBvZiBpbmplY3RlZCBkb2N1bWVudCBpZiBhdmFpbGFibGUgb3IgZmFsbGJhY2sgdG8gZ2xvYmFsIHdpbmRvdyByZWZlcmVuY2UgKi9cbiAgcHJpdmF0ZSBfZ2V0V2luZG93KCk6IFdpbmRvdyB7XG4gICAgY29uc3QgZG9jID0gdGhpcy5fZ2V0RG9jdW1lbnQoKTtcbiAgICByZXR1cm4gZG9jLmRlZmF1bHRWaWV3IHx8IHdpbmRvdztcbiAgfVxuXG4gIHByaXZhdGUgX3RvZ2dsZUNsYXNzKGVsZW1lbnQ6IEVsZW1lbnQsIGNsYXNzTmFtZTogc3RyaW5nLCBzaG91bGRTZXQ6IGJvb2xlYW4pIHtcbiAgICBpZiAoc2hvdWxkU2V0KSB7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzTmFtZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0Rm9jdXNPcmlnaW4oZXZlbnQ6IEZvY3VzRXZlbnQpOiBGb2N1c09yaWdpbiB7XG4gICAgLy8gSWYgd2UgY291bGRuJ3QgZGV0ZWN0IGEgY2F1c2UgZm9yIHRoZSBmb2N1cyBldmVudCwgaXQncyBkdWUgdG8gb25lIG9mIHRocmVlIHJlYXNvbnM6XG4gICAgLy8gMSkgVGhlIHdpbmRvdyBoYXMganVzdCByZWdhaW5lZCBmb2N1cywgaW4gd2hpY2ggY2FzZSB3ZSB3YW50IHRvIHJlc3RvcmUgdGhlIGZvY3VzZWQgc3RhdGUgb2ZcbiAgICAvLyAgICB0aGUgZWxlbWVudCBmcm9tIGJlZm9yZSB0aGUgd2luZG93IGJsdXJyZWQuXG4gICAgLy8gMikgSXQgd2FzIGNhdXNlZCBieSBhIHRvdWNoIGV2ZW50LCBpbiB3aGljaCBjYXNlIHdlIG1hcmsgdGhlIG9yaWdpbiBhcyAndG91Y2gnLlxuICAgIC8vIDMpIFRoZSBlbGVtZW50IHdhcyBwcm9ncmFtbWF0aWNhbGx5IGZvY3VzZWQsIGluIHdoaWNoIGNhc2Ugd2Ugc2hvdWxkIG1hcmsgdGhlIG9yaWdpbiBhc1xuICAgIC8vICAgICdwcm9ncmFtJy5cbiAgICBpZiAodGhpcy5fb3JpZ2luKSB7XG4gICAgICByZXR1cm4gdGhpcy5fb3JpZ2luO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl93aW5kb3dGb2N1c2VkICYmIHRoaXMuX2xhc3RGb2N1c09yaWdpbikge1xuICAgICAgcmV0dXJuIHRoaXMuX2xhc3RGb2N1c09yaWdpbjtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX3dhc0NhdXNlZEJ5VG91Y2goZXZlbnQpKSB7XG4gICAgICByZXR1cm4gJ3RvdWNoJztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICdwcm9ncmFtJztcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZm9jdXMgY2xhc3NlcyBvbiB0aGUgZWxlbWVudCBiYXNlZCBvbiB0aGUgZ2l2ZW4gZm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byB1cGRhdGUgdGhlIGNsYXNzZXMgb24uXG4gICAqIEBwYXJhbSBvcmlnaW4gVGhlIGZvY3VzIG9yaWdpbi5cbiAgICovXG4gIHByaXZhdGUgX3NldENsYXNzZXMoZWxlbWVudDogSFRNTEVsZW1lbnQsIG9yaWdpbj86IEZvY3VzT3JpZ2luKTogdm9pZCB7XG4gICAgdGhpcy5fdG9nZ2xlQ2xhc3MoZWxlbWVudCwgJ2Nkay1mb2N1c2VkJywgISFvcmlnaW4pO1xuICAgIHRoaXMuX3RvZ2dsZUNsYXNzKGVsZW1lbnQsICdjZGstdG91Y2gtZm9jdXNlZCcsIG9yaWdpbiA9PT0gJ3RvdWNoJyk7XG4gICAgdGhpcy5fdG9nZ2xlQ2xhc3MoZWxlbWVudCwgJ2Nkay1rZXlib2FyZC1mb2N1c2VkJywgb3JpZ2luID09PSAna2V5Ym9hcmQnKTtcbiAgICB0aGlzLl90b2dnbGVDbGFzcyhlbGVtZW50LCAnY2RrLW1vdXNlLWZvY3VzZWQnLCBvcmlnaW4gPT09ICdtb3VzZScpO1xuICAgIHRoaXMuX3RvZ2dsZUNsYXNzKGVsZW1lbnQsICdjZGstcHJvZ3JhbS1mb2N1c2VkJywgb3JpZ2luID09PSAncHJvZ3JhbScpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG9yaWdpbiBhbmQgc2NoZWR1bGVzIGFuIGFzeW5jIGZ1bmN0aW9uIHRvIGNsZWFyIGl0IGF0IHRoZSBlbmQgb2YgdGhlIGV2ZW50IHF1ZXVlLlxuICAgKiBJZiB0aGUgZGV0ZWN0aW9uIG1vZGUgaXMgJ2V2ZW50dWFsJywgdGhlIG9yaWdpbiBpcyBuZXZlciBjbGVhcmVkLlxuICAgKiBAcGFyYW0gb3JpZ2luIFRoZSBvcmlnaW4gdG8gc2V0LlxuICAgKi9cbiAgcHJpdmF0ZSBfc2V0T3JpZ2luRm9yQ3VycmVudEV2ZW50UXVldWUob3JpZ2luOiBGb2N1c09yaWdpbik6IHZvaWQge1xuICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICB0aGlzLl9vcmlnaW4gPSBvcmlnaW47XG5cbiAgICAgIGlmICh0aGlzLl9kZXRlY3Rpb25Nb2RlID09PSBGb2N1c01vbml0b3JEZXRlY3Rpb25Nb2RlLklNTUVESUFURSkge1xuICAgICAgICAvLyBTb21ldGltZXMgdGhlIGZvY3VzIG9yaWdpbiB3b24ndCBiZSB2YWxpZCBpbiBGaXJlZm94IGJlY2F1c2UgRmlyZWZveCBzZWVtcyB0byBmb2N1cyAqb25lKlxuICAgICAgICAvLyB0aWNrIGFmdGVyIHRoZSBpbnRlcmFjdGlvbiBldmVudCBmaXJlZC4gVG8gZW5zdXJlIHRoZSBmb2N1cyBvcmlnaW4gaXMgYWx3YXlzIGNvcnJlY3QsXG4gICAgICAgIC8vIHRoZSBmb2N1cyBvcmlnaW4gd2lsbCBiZSBkZXRlcm1pbmVkIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIG5leHQgdGljay5cbiAgICAgICAgdGhpcy5fb3JpZ2luVGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLl9vcmlnaW4gPSBudWxsLCAxKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgZ2l2ZW4gZm9jdXMgZXZlbnQgd2FzIGNhdXNlZCBieSBhIHRvdWNoc3RhcnQgZXZlbnQuXG4gICAqIEBwYXJhbSBldmVudCBUaGUgZm9jdXMgZXZlbnQgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIFdoZXRoZXIgdGhlIGV2ZW50IHdhcyBjYXVzZWQgYnkgYSB0b3VjaC5cbiAgICovXG4gIHByaXZhdGUgX3dhc0NhdXNlZEJ5VG91Y2goZXZlbnQ6IEZvY3VzRXZlbnQpOiBib29sZWFuIHtcbiAgICAvLyBOb3RlKG1tYWxlcmJhKTogVGhpcyBpbXBsZW1lbnRhdGlvbiBpcyBub3QgcXVpdGUgcGVyZmVjdCwgdGhlcmUgaXMgYSBzbWFsbCBlZGdlIGNhc2UuXG4gICAgLy8gQ29uc2lkZXIgdGhlIGZvbGxvd2luZyBkb20gc3RydWN0dXJlOlxuICAgIC8vXG4gICAgLy8gPGRpdiAjcGFyZW50IHRhYmluZGV4PVwiMFwiIGNka0ZvY3VzQ2xhc3Nlcz5cbiAgICAvLyAgIDxkaXYgI2NoaWxkIChjbGljayk9XCIjcGFyZW50LmZvY3VzKClcIj48L2Rpdj5cbiAgICAvLyA8L2Rpdj5cbiAgICAvL1xuICAgIC8vIElmIHRoZSB1c2VyIHRvdWNoZXMgdGhlICNjaGlsZCBlbGVtZW50IGFuZCB0aGUgI3BhcmVudCBpcyBwcm9ncmFtbWF0aWNhbGx5IGZvY3VzZWQgYXMgYVxuICAgIC8vIHJlc3VsdCwgdGhpcyBjb2RlIHdpbGwgc3RpbGwgY29uc2lkZXIgaXQgdG8gaGF2ZSBiZWVuIGNhdXNlZCBieSB0aGUgdG91Y2ggZXZlbnQgYW5kIHdpbGxcbiAgICAvLyBhcHBseSB0aGUgY2RrLXRvdWNoLWZvY3VzZWQgY2xhc3MgcmF0aGVyIHRoYW4gdGhlIGNkay1wcm9ncmFtLWZvY3VzZWQgY2xhc3MuIFRoaXMgaXMgYVxuICAgIC8vIHJlbGF0aXZlbHkgc21hbGwgZWRnZS1jYXNlIHRoYXQgY2FuIGJlIHdvcmtlZCBhcm91bmQgYnkgdXNpbmdcbiAgICAvLyBmb2N1c1ZpYShwYXJlbnRFbCwgJ3Byb2dyYW0nKSB0byBmb2N1cyB0aGUgcGFyZW50IGVsZW1lbnQuXG4gICAgLy9cbiAgICAvLyBJZiB3ZSBkZWNpZGUgdGhhdCB3ZSBhYnNvbHV0ZWx5IG11c3QgaGFuZGxlIHRoaXMgY2FzZSBjb3JyZWN0bHksIHdlIGNhbiBkbyBzbyBieSBsaXN0ZW5pbmdcbiAgICAvLyBmb3IgdGhlIGZpcnN0IGZvY3VzIGV2ZW50IGFmdGVyIHRoZSB0b3VjaHN0YXJ0LCBhbmQgdGhlbiB0aGUgZmlyc3QgYmx1ciBldmVudCBhZnRlciB0aGF0XG4gICAgLy8gZm9jdXMgZXZlbnQuIFdoZW4gdGhhdCBibHVyIGV2ZW50IGZpcmVzIHdlIGtub3cgdGhhdCB3aGF0ZXZlciBmb2xsb3dzIGlzIG5vdCBhIHJlc3VsdCBvZiB0aGVcbiAgICAvLyB0b3VjaHN0YXJ0LlxuICAgIGxldCBmb2N1c1RhcmdldCA9IGV2ZW50LnRhcmdldDtcbiAgICByZXR1cm4gdGhpcy5fbGFzdFRvdWNoVGFyZ2V0IGluc3RhbmNlb2YgTm9kZSAmJiBmb2N1c1RhcmdldCBpbnN0YW5jZW9mIE5vZGUgJiZcbiAgICAgICAgKGZvY3VzVGFyZ2V0ID09PSB0aGlzLl9sYXN0VG91Y2hUYXJnZXQgfHwgZm9jdXNUYXJnZXQuY29udGFpbnModGhpcy5fbGFzdFRvdWNoVGFyZ2V0KSk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBmb2N1cyBldmVudHMgb24gYSByZWdpc3RlcmVkIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBldmVudCBUaGUgZm9jdXMgZXZlbnQuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBtb25pdG9yZWQgZWxlbWVudC5cbiAgICovXG4gIHByaXZhdGUgX29uRm9jdXMoZXZlbnQ6IEZvY3VzRXZlbnQsIGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgLy8gTk9URShtbWFsZXJiYSk6IFdlIGN1cnJlbnRseSBzZXQgdGhlIGNsYXNzZXMgYmFzZWQgb24gdGhlIGZvY3VzIG9yaWdpbiBvZiB0aGUgbW9zdCByZWNlbnRcbiAgICAvLyBmb2N1cyBldmVudCBhZmZlY3RpbmcgdGhlIG1vbml0b3JlZCBlbGVtZW50LiBJZiB3ZSB3YW50IHRvIHVzZSB0aGUgb3JpZ2luIG9mIHRoZSBmaXJzdCBldmVudFxuICAgIC8vIGluc3RlYWQgd2Ugc2hvdWxkIGNoZWNrIGZvciB0aGUgY2RrLWZvY3VzZWQgY2xhc3MgaGVyZSBhbmQgcmV0dXJuIGlmIHRoZSBlbGVtZW50IGFscmVhZHkgaGFzXG4gICAgLy8gaXQuIChUaGlzIG9ubHkgbWF0dGVycyBmb3IgZWxlbWVudHMgdGhhdCBoYXZlIGluY2x1ZGVzQ2hpbGRyZW4gPSB0cnVlKS5cblxuICAgIC8vIElmIHdlIGFyZSBub3QgY291bnRpbmcgY2hpbGQtZWxlbWVudC1mb2N1cyBhcyBmb2N1c2VkLCBtYWtlIHN1cmUgdGhhdCB0aGUgZXZlbnQgdGFyZ2V0IGlzIHRoZVxuICAgIC8vIG1vbml0b3JlZCBlbGVtZW50IGl0c2VsZi5cbiAgICBjb25zdCBlbGVtZW50SW5mbyA9IHRoaXMuX2VsZW1lbnRJbmZvLmdldChlbGVtZW50KTtcbiAgICBpZiAoIWVsZW1lbnRJbmZvIHx8ICghZWxlbWVudEluZm8uY2hlY2tDaGlsZHJlbiAmJiBlbGVtZW50ICE9PSBldmVudC50YXJnZXQpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgb3JpZ2luID0gdGhpcy5fZ2V0Rm9jdXNPcmlnaW4oZXZlbnQpO1xuICAgIHRoaXMuX3NldENsYXNzZXMoZWxlbWVudCwgb3JpZ2luKTtcbiAgICB0aGlzLl9lbWl0T3JpZ2luKGVsZW1lbnRJbmZvLnN1YmplY3QsIG9yaWdpbik7XG4gICAgdGhpcy5fbGFzdEZvY3VzT3JpZ2luID0gb3JpZ2luO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgYmx1ciBldmVudHMgb24gYSByZWdpc3RlcmVkIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBldmVudCBUaGUgYmx1ciBldmVudC5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIG1vbml0b3JlZCBlbGVtZW50LlxuICAgKi9cbiAgX29uQmx1cihldmVudDogRm9jdXNFdmVudCwgZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgICAvLyBJZiB3ZSBhcmUgY291bnRpbmcgY2hpbGQtZWxlbWVudC1mb2N1cyBhcyBmb2N1c2VkLCBtYWtlIHN1cmUgdGhhdCB3ZSBhcmVuJ3QganVzdCBibHVycmluZyBpblxuICAgIC8vIG9yZGVyIHRvIGZvY3VzIGFub3RoZXIgY2hpbGQgb2YgdGhlIG1vbml0b3JlZCBlbGVtZW50LlxuICAgIGNvbnN0IGVsZW1lbnRJbmZvID0gdGhpcy5fZWxlbWVudEluZm8uZ2V0KGVsZW1lbnQpO1xuXG4gICAgaWYgKCFlbGVtZW50SW5mbyB8fCAoZWxlbWVudEluZm8uY2hlY2tDaGlsZHJlbiAmJiBldmVudC5yZWxhdGVkVGFyZ2V0IGluc3RhbmNlb2YgTm9kZSAmJlxuICAgICAgICBlbGVtZW50LmNvbnRhaW5zKGV2ZW50LnJlbGF0ZWRUYXJnZXQpKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3NldENsYXNzZXMoZWxlbWVudCk7XG4gICAgdGhpcy5fZW1pdE9yaWdpbihlbGVtZW50SW5mby5zdWJqZWN0LCBudWxsKTtcbiAgfVxuXG4gIHByaXZhdGUgX2VtaXRPcmlnaW4oc3ViamVjdDogU3ViamVjdDxGb2N1c09yaWdpbj4sIG9yaWdpbjogRm9jdXNPcmlnaW4pIHtcbiAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHN1YmplY3QubmV4dChvcmlnaW4pKTtcbiAgfVxuXG4gIHByaXZhdGUgX2luY3JlbWVudE1vbml0b3JlZEVsZW1lbnRDb3VudCgpIHtcbiAgICAvLyBSZWdpc3RlciBnbG9iYWwgbGlzdGVuZXJzIHdoZW4gZmlyc3QgZWxlbWVudCBpcyBtb25pdG9yZWQuXG4gICAgaWYgKCsrdGhpcy5fbW9uaXRvcmVkRWxlbWVudENvdW50ID09IDEgJiYgdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICAvLyBOb3RlOiB3ZSBsaXN0ZW4gdG8gZXZlbnRzIGluIHRoZSBjYXB0dXJlIHBoYXNlIHNvIHdlXG4gICAgICAvLyBjYW4gZGV0ZWN0IHRoZW0gZXZlbiBpZiB0aGUgdXNlciBzdG9wcyBwcm9wYWdhdGlvbi5cbiAgICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIGNvbnN0IGRvY3VtZW50ID0gdGhpcy5fZ2V0RG9jdW1lbnQoKTtcbiAgICAgICAgY29uc3Qgd2luZG93ID0gdGhpcy5fZ2V0V2luZG93KCk7XG5cbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCB0aGlzLl9kb2N1bWVudEZvY3VzQW5kQmx1ckxpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCB0aGlzLl9kb2N1bWVudEZvY3VzQW5kQmx1ckxpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9kb2N1bWVudEtleWRvd25MaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9kb2N1bWVudE1vdXNlZG93bkxpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9kb2N1bWVudFRvdWNoc3RhcnRMaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCB0aGlzLl93aW5kb3dGb2N1c0xpc3RlbmVyKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2RlY3JlbWVudE1vbml0b3JlZEVsZW1lbnRDb3VudCgpIHtcbiAgICAvLyBVbnJlZ2lzdGVyIGdsb2JhbCBsaXN0ZW5lcnMgd2hlbiBsYXN0IGVsZW1lbnQgaXMgdW5tb25pdG9yZWQuXG4gICAgaWYgKCEtLXRoaXMuX21vbml0b3JlZEVsZW1lbnRDb3VudCkge1xuICAgICAgY29uc3QgZG9jdW1lbnQgPSB0aGlzLl9nZXREb2N1bWVudCgpO1xuICAgICAgY29uc3Qgd2luZG93ID0gdGhpcy5fZ2V0V2luZG93KCk7XG5cbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5fZG9jdW1lbnRGb2N1c0FuZEJsdXJMaXN0ZW5lcixcbiAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2JsdXInLCB0aGlzLl9kb2N1bWVudEZvY3VzQW5kQmx1ckxpc3RlbmVyLFxuICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX2RvY3VtZW50S2V5ZG93bkxpc3RlbmVyLFxuICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fZG9jdW1lbnRNb3VzZWRvd25MaXN0ZW5lcixcbiAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9kb2N1bWVudFRvdWNoc3RhcnRMaXN0ZW5lcixcbiAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMuX3dpbmRvd0ZvY3VzTGlzdGVuZXIpO1xuXG4gICAgICAvLyBDbGVhciB0aW1lb3V0cyBmb3IgYWxsIHBvdGVudGlhbGx5IHBlbmRpbmcgdGltZW91dHMgdG8gcHJldmVudCB0aGUgbGVha3MuXG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fd2luZG93Rm9jdXNUaW1lb3V0SWQpO1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3RvdWNoVGltZW91dElkKTtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9vcmlnaW5UaW1lb3V0SWQpO1xuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogRGlyZWN0aXZlIHRoYXQgZGV0ZXJtaW5lcyBob3cgYSBwYXJ0aWN1bGFyIGVsZW1lbnQgd2FzIGZvY3VzZWQgKHZpYSBrZXlib2FyZCwgbW91c2UsIHRvdWNoLCBvclxuICogcHJvZ3JhbW1hdGljYWxseSkgYW5kIGFkZHMgY29ycmVzcG9uZGluZyBjbGFzc2VzIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIFRoZXJlIGFyZSB0d28gdmFyaWFudHMgb2YgdGhpcyBkaXJlY3RpdmU6XG4gKiAxKSBjZGtNb25pdG9yRWxlbWVudEZvY3VzOiBkb2VzIG5vdCBjb25zaWRlciBhbiBlbGVtZW50IHRvIGJlIGZvY3VzZWQgaWYgb25lIG9mIGl0cyBjaGlsZHJlbiBpc1xuICogICAgZm9jdXNlZC5cbiAqIDIpIGNka01vbml0b3JTdWJ0cmVlRm9jdXM6IGNvbnNpZGVycyBhbiBlbGVtZW50IGZvY3VzZWQgaWYgaXQgb3IgYW55IG9mIGl0cyBjaGlsZHJlbiBhcmUgZm9jdXNlZC5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka01vbml0b3JFbGVtZW50Rm9jdXNdLCBbY2RrTW9uaXRvclN1YnRyZWVGb2N1c10nLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtNb25pdG9yRm9jdXMgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9tb25pdG9yU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb247XG4gIEBPdXRwdXQoKSBjZGtGb2N1c0NoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8Rm9jdXNPcmlnaW4+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sIHByaXZhdGUgX2ZvY3VzTW9uaXRvcjogRm9jdXNNb25pdG9yKSB7XG4gICAgdGhpcy5fbW9uaXRvclN1YnNjcmlwdGlvbiA9IHRoaXMuX2ZvY3VzTW9uaXRvci5tb25pdG9yKFxuICAgICAgICB0aGlzLl9lbGVtZW50UmVmLFxuICAgICAgICB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuaGFzQXR0cmlidXRlKCdjZGtNb25pdG9yU3VidHJlZUZvY3VzJykpXG4gICAgICAgIC5zdWJzY3JpYmUob3JpZ2luID0+IHRoaXMuY2RrRm9jdXNDaGFuZ2UuZW1pdChvcmlnaW4pKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2ZvY3VzTW9uaXRvci5zdG9wTW9uaXRvcmluZyh0aGlzLl9lbGVtZW50UmVmKTtcbiAgICB0aGlzLl9tb25pdG9yU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gIH1cbn1cbiJdfQ==