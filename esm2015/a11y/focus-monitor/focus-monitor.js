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
import { isFakeMousedownFromScreenReader } from '../fake-mousedown';
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
         * @param {?} event
         * @return {?}
         */
        (event) => {
            // On mousedown record the origin only if there is not touch
            // target, since a mousedown can happen as a result of a touch event.
            if (!this._lastTouchTarget) {
                // In some cases screen readers fire fake `mousedown` events instead of `keydown`.
                // Resolve the focus source to `keyboard` if we detect one of them.
                /** @type {?} */
                const source = isFakeMousedownFromScreenReader(event) ? 'keyboard' : 'mouse';
                this._setOriginForCurrentEventQueue(source);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXMtbW9uaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvYTExeS9mb2N1cy1tb25pdG9yL2ZvY3VzLW1vbml0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFFBQVEsRUFBRSwrQkFBK0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2hGLE9BQU8sRUFDTCxTQUFTLEVBQ1QsVUFBVSxFQUNWLFlBQVksRUFDWixNQUFNLEVBQ04sVUFBVSxFQUNWLGNBQWMsRUFDZCxNQUFNLEVBRU4sUUFBUSxFQUNSLE1BQU0sR0FDUCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQWEsRUFBRSxJQUFJLFlBQVksRUFBRSxPQUFPLEVBQWUsTUFBTSxNQUFNLENBQUM7QUFDM0UsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3BELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQUMsK0JBQStCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQzs7Ozs7OztBQUtsRSxNQUFNLE9BQU8sZUFBZSxHQUFHLEdBQUc7Ozs7OztBQVNsQyxrQ0FHQzs7Ozs7O0lBREMscUNBQXdCOzs7QUFJMUIsTUFBa0IseUJBQXlCO0lBQ3pDOzs7O09BSUc7SUFDSCxTQUFTLEdBQUE7SUFDVDs7O09BR0c7SUFDSCxRQUFRLEdBQUE7RUFDVDs7Ozs7O0FBR0QseUNBRUM7OztJQURDLDRDQUEwQzs7Ozs7O0FBSTVDLE1BQU0sT0FBTyw2QkFBNkIsR0FDdEMsSUFBSSxjQUFjLENBQXNCLG1DQUFtQyxDQUFDOzs7Ozs7TUFXMUUsMkJBQTJCLEdBQUcsK0JBQStCLENBQUM7SUFDbEUsT0FBTyxFQUFFLElBQUk7SUFDYixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUM7Ozs7QUFLRixNQUFNLE9BQU8sWUFBWTs7Ozs7OztJQTRGdkIsWUFDWSxPQUFlLEVBQ2YsU0FBbUI7SUFDM0IscURBQXFEO0lBQ3ZCLFFBQWtCLEVBQ0csT0FDdkI7UUFMcEIsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQUNmLGNBQVMsR0FBVCxTQUFTLENBQVU7Ozs7UUE1RnZCLFlBQU8sR0FBZ0IsSUFBSSxDQUFDOzs7O1FBTTVCLG1CQUFjLEdBQUcsS0FBSyxDQUFDOzs7O1FBZXZCLGlCQUFZLEdBQUcsSUFBSSxHQUFHLEVBQXFDLENBQUM7Ozs7UUFHNUQsMkJBQXNCLEdBQUcsQ0FBQyxDQUFDOzs7OztRQVkzQiw2QkFBd0I7OztRQUFHLEdBQUcsRUFBRTtZQUN0QyxrRkFBa0Y7WUFDbEYsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQztZQUM3QixJQUFJLENBQUMsOEJBQThCLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDbEQsQ0FBQyxFQUFBOzs7OztRQU1PLCtCQUEwQjs7OztRQUFHLENBQUMsS0FBaUIsRUFBRSxFQUFFO1lBQ3pELDREQUE0RDtZQUM1RCxxRUFBcUU7WUFDckUsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRTs7OztzQkFHcEIsTUFBTSxHQUFHLCtCQUErQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLE9BQU87Z0JBQzVFLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUM3QztRQUNILENBQUMsRUFBQTs7Ozs7UUFNTyxnQ0FBMkI7Ozs7UUFBRyxDQUFDLEtBQWlCLEVBQUUsRUFBRTtZQUMxRCw0RkFBNEY7WUFDNUYsMkZBQTJGO1lBQzNGLDBCQUEwQjtZQUMxQixJQUFJLElBQUksQ0FBQyxlQUFlLElBQUksSUFBSSxFQUFFO2dCQUNoQyxZQUFZLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO2FBQ3BDO1lBRUQsOEZBQThGO1lBQzlGLHVGQUF1RjtZQUN2RiwrQkFBK0I7WUFDL0IsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztZQUNwRixJQUFJLENBQUMsZUFBZSxHQUFHLFVBQVU7OztZQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLEdBQUUsZUFBZSxDQUFDLENBQUM7UUFDekYsQ0FBQyxFQUFBOzs7OztRQU1PLHlCQUFvQjs7O1FBQUcsR0FBRyxFQUFFO1lBQ2xDLDBEQUEwRDtZQUMxRCxtREFBbUQ7WUFDbkQsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7WUFDM0IsSUFBSSxDQUFDLHFCQUFxQixHQUFHLFVBQVU7OztZQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxFQUFDLENBQUM7UUFDN0UsQ0FBQyxFQUFBOzs7OztRQW1CTyxrQ0FBNkI7Ozs7UUFBRyxDQUFDLEtBQWlCLEVBQUUsRUFBRTs7a0JBQ3RELE1BQU0sR0FBRyxtQkFBQSxLQUFLLENBQUMsTUFBTSxFQUFvQjs7a0JBQ3pDLE9BQU8sR0FBRyxLQUFLLENBQUMsSUFBSSxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU87WUFFckUsNkVBQTZFO1lBQzdFLEtBQUssSUFBSSxFQUFFLEdBQUcsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLGFBQWEsRUFBRTtnQkFDL0MsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2FBQy9CO1FBQ0gsQ0FBQyxFQUFBO1FBZkMsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7UUFDMUIsSUFBSSxDQUFDLGNBQWMsR0FBRyxDQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxhQUFhLHNCQUF1QyxDQUFDO0lBQ3RGLENBQUM7Ozs7OztJQWlDRCxPQUFPLENBQUMsT0FBOEMsRUFDOUMsZ0JBQXlCLEtBQUs7UUFDcEMsbURBQW1EO1FBQ25ELElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRTtZQUM3QixPQUFPLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMzQjs7Y0FFSyxhQUFhLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FBQztRQUU1QyxrREFBa0Q7UUFDbEQsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsRUFBRTs7a0JBQ2xDLFVBQVUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUM7WUFDdkQsbUJBQUEsVUFBVSxFQUFDLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztZQUMxQyxPQUFPLG1CQUFBLFVBQVUsRUFBQyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQztTQUMzQzs7O2NBR0ssSUFBSSxHQUF5QjtZQUNqQyxhQUFhLEVBQUUsYUFBYTtZQUM1QixPQUFPLEVBQUUsSUFBSSxPQUFPLEVBQWU7U0FDcEM7UUFDRCxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDM0MsSUFBSSxDQUFDLCtCQUErQixFQUFFLENBQUM7UUFFdkMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFDO0lBQ3JDLENBQUM7Ozs7O0lBY0QsY0FBYyxDQUFDLE9BQThDOztjQUNyRCxhQUFhLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FBQzs7Y0FDdEMsV0FBVyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQztRQUV4RCxJQUFJLFdBQVcsRUFBRTtZQUNmLFdBQVcsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7WUFFL0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUNoQyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUN4QyxJQUFJLENBQUMsK0JBQStCLEVBQUUsQ0FBQztTQUN4QztJQUNILENBQUM7Ozs7Ozs7SUFrQkQsUUFBUSxDQUFDLE9BQThDLEVBQy9DLE1BQW1CLEVBQ25CLE9BQXNCOztjQUV0QixhQUFhLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FBQztRQUU1QyxJQUFJLENBQUMsOEJBQThCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFNUMsd0NBQXdDO1FBQ3hDLElBQUksT0FBTyxhQUFhLENBQUMsS0FBSyxLQUFLLFVBQVUsRUFBRTtZQUM3Qyw0RkFBNEY7WUFDNUYsQ0FBQyxtQkFBQSxhQUFhLEVBQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUN2QztJQUNILENBQUM7Ozs7SUFFRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPOzs7OztRQUFDLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsRUFBQyxDQUFDO0lBQzlFLENBQUM7Ozs7OztJQUdPLFlBQVk7UUFDbEIsT0FBTyxJQUFJLENBQUMsU0FBUyxJQUFJLFFBQVEsQ0FBQztJQUNwQyxDQUFDOzs7Ozs7SUFHTyxVQUFVOztjQUNWLEdBQUcsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFO1FBQy9CLE9BQU8sR0FBRyxDQUFDLFdBQVcsSUFBSSxNQUFNLENBQUM7SUFDbkMsQ0FBQzs7Ozs7Ozs7SUFFTyxZQUFZLENBQUMsT0FBZ0IsRUFBRSxTQUFpQixFQUFFLFNBQWtCO1FBQzFFLElBQUksU0FBUyxFQUFFO1lBQ2IsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDbEM7YUFBTTtZQUNMLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ3JDO0lBQ0gsQ0FBQzs7Ozs7O0lBRU8sZUFBZSxDQUFDLEtBQWlCO1FBQ3ZDLHVGQUF1RjtRQUN2RiwrRkFBK0Y7UUFDL0YsaURBQWlEO1FBQ2pELGtGQUFrRjtRQUNsRiwwRkFBMEY7UUFDMUYsZ0JBQWdCO1FBQ2hCLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNoQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7U0FDckI7UUFFRCxJQUFJLElBQUksQ0FBQyxjQUFjLElBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFO1lBQ2hELE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDO1NBQzlCO2FBQU0sSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDeEMsT0FBTyxPQUFPLENBQUM7U0FDaEI7YUFBTTtZQUNMLE9BQU8sU0FBUyxDQUFDO1NBQ2xCO0lBQ0gsQ0FBQzs7Ozs7Ozs7SUFPTyxXQUFXLENBQUMsT0FBb0IsRUFBRSxNQUFvQjtRQUM1RCxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3BELElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sS0FBSyxPQUFPLENBQUMsQ0FBQztRQUNwRSxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxNQUFNLEtBQUssVUFBVSxDQUFDLENBQUM7UUFDMUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxLQUFLLE9BQU8sQ0FBQyxDQUFDO1FBQ3BFLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sS0FBSyxTQUFTLENBQUMsQ0FBQztJQUMxRSxDQUFDOzs7Ozs7OztJQU9PLDhCQUE4QixDQUFDLE1BQW1CO1FBQ3hELElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCOzs7UUFBQyxHQUFHLEVBQUU7WUFDbEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFFdEIsSUFBSSxJQUFJLENBQUMsY0FBYyxzQkFBd0MsRUFBRTtnQkFDL0QsNEZBQTRGO2dCQUM1Rix3RkFBd0Y7Z0JBQ3hGLHlFQUF5RTtnQkFDekUsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFVBQVU7OztnQkFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksR0FBRSxDQUFDLENBQUMsQ0FBQzthQUNsRTtRQUNILENBQUMsRUFBQyxDQUFDO0lBQ0wsQ0FBQzs7Ozs7OztJQU9PLGlCQUFpQixDQUFDLEtBQWlCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O1lBa0JyQyxXQUFXLEdBQUcsS0FBSyxDQUFDLE1BQU07UUFDOUIsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLFlBQVksSUFBSSxJQUFJLFdBQVcsWUFBWSxJQUFJO1lBQ3ZFLENBQUMsV0FBVyxLQUFLLElBQUksQ0FBQyxnQkFBZ0IsSUFBSSxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7SUFDN0YsQ0FBQzs7Ozs7Ozs7SUFPTyxRQUFRLENBQUMsS0FBaUIsRUFBRSxPQUFvQjtRQUN0RCw0RkFBNEY7UUFDNUYsK0ZBQStGO1FBQy9GLCtGQUErRjtRQUMvRiwwRUFBMEU7Ozs7Ozs7O2NBSXBFLFdBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUM7UUFDbEQsSUFBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLENBQUMsV0FBVyxDQUFDLGFBQWEsSUFBSSxPQUFPLEtBQUssS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQzVFLE9BQU87U0FDUjs7Y0FFSyxNQUFNLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUM7UUFDMUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzlDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxNQUFNLENBQUM7SUFDakMsQ0FBQzs7Ozs7OztJQU9ELE9BQU8sQ0FBQyxLQUFpQixFQUFFLE9BQW9COzs7O2NBR3ZDLFdBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUM7UUFFbEQsSUFBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLElBQUksS0FBSyxDQUFDLGFBQWEsWUFBWSxJQUFJO1lBQ2pGLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUU7WUFDMUMsT0FBTztTQUNSO1FBRUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMxQixJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDOUMsQ0FBQzs7Ozs7OztJQUVPLFdBQVcsQ0FBQyxPQUE2QixFQUFFLE1BQW1CO1FBQ3BFLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRzs7O1FBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBQyxDQUFDO0lBQy9DLENBQUM7Ozs7O0lBRU8sK0JBQStCO1FBQ3JDLDZEQUE2RDtRQUM3RCxJQUFJLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRTtZQUNsRSx1REFBdUQ7WUFDdkQsc0RBQXNEO1lBQ3RELElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCOzs7WUFBQyxHQUFHLEVBQUU7O3NCQUM1QixRQUFRLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRTs7c0JBQzlCLE1BQU0sR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFO2dCQUVoQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyw2QkFBNkIsRUFDbkUsMkJBQTJCLENBQUMsQ0FBQztnQkFDL0IsUUFBUSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsNkJBQTZCLEVBQ2xFLDJCQUEyQixDQUFDLENBQUM7Z0JBQy9CLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLHdCQUF3QixFQUNoRSwyQkFBMkIsQ0FBQyxDQUFDO2dCQUMvQixRQUFRLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQywwQkFBMEIsRUFDcEUsMkJBQTJCLENBQUMsQ0FBQztnQkFDL0IsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsMkJBQTJCLEVBQ3RFLDJCQUEyQixDQUFDLENBQUM7Z0JBQy9CLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDOUQsQ0FBQyxFQUFDLENBQUM7U0FDSjtJQUNILENBQUM7Ozs7O0lBRU8sK0JBQStCO1FBQ3JDLGdFQUFnRTtRQUNoRSxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsc0JBQXNCLEVBQUU7O2tCQUM1QixRQUFRLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRTs7a0JBQzlCLE1BQU0sR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFO1lBRWhDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLDZCQUE2QixFQUN0RSwyQkFBMkIsQ0FBQyxDQUFDO1lBQy9CLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLDZCQUE2QixFQUNyRSwyQkFBMkIsQ0FBQyxDQUFDO1lBQy9CLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLHdCQUF3QixFQUNuRSwyQkFBMkIsQ0FBQyxDQUFDO1lBQy9CLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLDBCQUEwQixFQUN2RSwyQkFBMkIsQ0FBQyxDQUFDO1lBQy9CLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLDJCQUEyQixFQUN6RSwyQkFBMkIsQ0FBQyxDQUFDO1lBQy9CLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFFL0QsNEVBQTRFO1lBQzVFLFlBQVksQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQUN6QyxZQUFZLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ25DLFlBQVksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztTQUNyQztJQUNILENBQUM7OztZQTlaRixVQUFVLFNBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzs7O1lBbkU5QixNQUFNO1lBUkEsUUFBUTs0Q0E0S1QsUUFBUSxZQUFJLE1BQU0sU0FBQyxRQUFROzRDQUMzQixRQUFRLFlBQUksTUFBTSxTQUFDLDZCQUE2Qjs7Ozs7Ozs7O0lBL0ZyRCwrQkFBb0M7Ozs7OztJQUdwQyx3Q0FBc0M7Ozs7OztJQUd0QyxzQ0FBK0I7Ozs7OztJQUcvQix3Q0FBNkM7Ozs7OztJQUc3Qyx1Q0FBZ0M7Ozs7OztJQUdoQyw2Q0FBc0M7Ozs7OztJQUd0Qyx3Q0FBaUM7Ozs7OztJQUdqQyxvQ0FBb0U7Ozs7OztJQUdwRSw4Q0FBbUM7Ozs7Ozs7SUFNbkMsc0NBQTJEOzs7Ozs7O0lBTTNELGdEQUlDOzs7Ozs7O0lBTUQsa0RBU0M7Ozs7Ozs7SUFNRCxtREFhQzs7Ozs7OztJQU1ELDRDQUtDOzs7Ozs7SUFHRCxpQ0FBK0I7Ozs7Ozs7SUFnQi9CLHFEQVFDOzs7OztJQXJCRywrQkFBdUI7Ozs7O0lBQ3ZCLGlDQUEyQjs7Ozs7Ozs7Ozs7QUErVWpDLE1BQU0sT0FBTyxlQUFlOzs7OztJQUkxQixZQUFvQixXQUFvQyxFQUFVLGFBQTJCO1FBQXpFLGdCQUFXLEdBQVgsV0FBVyxDQUF5QjtRQUFVLGtCQUFhLEdBQWIsYUFBYSxDQUFjO1FBRm5GLG1CQUFjLEdBQUcsSUFBSSxZQUFZLEVBQWUsQ0FBQztRQUd6RCxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQ2xELElBQUksQ0FBQyxXQUFXLEVBQ2hCLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO2FBQ3JFLFNBQVM7Ozs7UUFBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFDLENBQUM7SUFDN0QsQ0FBQzs7OztJQUVELFdBQVc7UUFDVCxJQUFJLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDcEQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQzFDLENBQUM7OztZQWpCRixTQUFTLFNBQUM7Z0JBQ1QsUUFBUSxFQUFFLG9EQUFvRDthQUMvRDs7OztZQXJmQyxVQUFVO1lBMGZ1RSxZQUFZOzs7NkJBRjVGLE1BQU07Ozs7Ozs7SUFEUCwrQ0FBMkM7O0lBQzNDLHlDQUEyRDs7Ozs7SUFFL0Msc0NBQTRDOzs7OztJQUFFLHdDQUFtQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1BsYXRmb3JtLCBub3JtYWxpemVQYXNzaXZlTGlzdGVuZXJPcHRpb25zfSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIEluamVjdCxcbiAgSW5qZWN0YWJsZSxcbiAgSW5qZWN0aW9uVG9rZW4sXG4gIE5nWm9uZSxcbiAgT25EZXN0cm95LFxuICBPcHRpb25hbCxcbiAgT3V0cHV0LFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgb2YgYXMgb2JzZXJ2YWJsZU9mLCBTdWJqZWN0LCBTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtjb2VyY2VFbGVtZW50fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7aXNGYWtlTW91c2Vkb3duRnJvbVNjcmVlblJlYWRlcn0gZnJvbSAnLi4vZmFrZS1tb3VzZWRvd24nO1xuXG5cbi8vIFRoaXMgaXMgdGhlIHZhbHVlIHVzZWQgYnkgQW5ndWxhckpTIE1hdGVyaWFsLiBUaHJvdWdoIHRyaWFsIGFuZCBlcnJvciAob24gaVBob25lIDZTKSB0aGV5IGZvdW5kXG4vLyB0aGF0IGEgdmFsdWUgb2YgYXJvdW5kIDY1MG1zIHNlZW1zIGFwcHJvcHJpYXRlLlxuZXhwb3J0IGNvbnN0IFRPVUNIX0JVRkZFUl9NUyA9IDY1MDtcblxuXG5leHBvcnQgdHlwZSBGb2N1c09yaWdpbiA9ICd0b3VjaCcgfCAnbW91c2UnIHwgJ2tleWJvYXJkJyB8ICdwcm9ncmFtJyB8IG51bGw7XG5cbi8qKlxuICogQ29ycmVzcG9uZHMgdG8gdGhlIG9wdGlvbnMgdGhhdCBjYW4gYmUgcGFzc2VkIHRvIHRoZSBuYXRpdmUgYGZvY3VzYCBldmVudC5cbiAqIHZpYSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvSFRNTEVsZW1lbnQvZm9jdXNcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBGb2N1c09wdGlvbnMge1xuICAvKiogV2hldGhlciB0aGUgYnJvd3NlciBzaG91bGQgc2Nyb2xsIHRvIHRoZSBlbGVtZW50IHdoZW4gaXQgaXMgZm9jdXNlZC4gKi9cbiAgcHJldmVudFNjcm9sbD86IGJvb2xlYW47XG59XG5cbi8qKiBEZXRlY3Rpb24gbW9kZSB1c2VkIGZvciBhdHRyaWJ1dGluZyB0aGUgb3JpZ2luIG9mIGEgZm9jdXMgZXZlbnQuICovXG5leHBvcnQgY29uc3QgZW51bSBGb2N1c01vbml0b3JEZXRlY3Rpb25Nb2RlIHtcbiAgLyoqXG4gICAqIEFueSBtb3VzZWRvd24sIGtleWRvd24sIG9yIHRvdWNoc3RhcnQgZXZlbnQgdGhhdCBoYXBwZW5lZCBpbiB0aGUgcHJldmlvdXNcbiAgICogdGljayBvciB0aGUgY3VycmVudCB0aWNrIHdpbGwgYmUgdXNlZCB0byBhc3NpZ24gYSBmb2N1cyBldmVudCdzIG9yaWdpbiAodG9cbiAgICogZWl0aGVyIG1vdXNlLCBrZXlib2FyZCwgb3IgdG91Y2gpLiBUaGlzIGlzIHRoZSBkZWZhdWx0IG9wdGlvbi5cbiAgICovXG4gIElNTUVESUFURSxcbiAgLyoqXG4gICAqIEEgZm9jdXMgZXZlbnQncyBvcmlnaW4gaXMgYWx3YXlzIGF0dHJpYnV0ZWQgdG8gdGhlIGxhc3QgY29ycmVzcG9uZGluZ1xuICAgKiBtb3VzZWRvd24sIGtleWRvd24sIG9yIHRvdWNoc3RhcnQgZXZlbnQsIG5vIG1hdHRlciBob3cgbG9uZyBhZ28gaXQgb2NjdXJlZC5cbiAgICovXG4gIEVWRU5UVUFMXG59XG5cbi8qKiBJbmplY3RhYmxlIHNlcnZpY2UtbGV2ZWwgb3B0aW9ucyBmb3IgRm9jdXNNb25pdG9yLiAqL1xuZXhwb3J0IGludGVyZmFjZSBGb2N1c01vbml0b3JPcHRpb25zIHtcbiAgZGV0ZWN0aW9uTW9kZT86IEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGU7XG59XG5cbi8qKiBJbmplY3Rpb25Ub2tlbiBmb3IgRm9jdXNNb25pdG9yT3B0aW9ucy4gKi9cbmV4cG9ydCBjb25zdCBGT0NVU19NT05JVE9SX0RFRkFVTFRfT1BUSU9OUyA9XG4gICAgbmV3IEluamVjdGlvblRva2VuPEZvY3VzTW9uaXRvck9wdGlvbnM+KCdjZGstZm9jdXMtbW9uaXRvci1kZWZhdWx0LW9wdGlvbnMnKTtcblxudHlwZSBNb25pdG9yZWRFbGVtZW50SW5mbyA9IHtcbiAgY2hlY2tDaGlsZHJlbjogYm9vbGVhbixcbiAgc3ViamVjdDogU3ViamVjdDxGb2N1c09yaWdpbj5cbn07XG5cbi8qKlxuICogRXZlbnQgbGlzdGVuZXIgb3B0aW9ucyB0aGF0IGVuYWJsZSBjYXB0dXJpbmcgYW5kIGFsc29cbiAqIG1hcmsgdGhlIGxpc3RlbmVyIGFzIHBhc3NpdmUgaWYgdGhlIGJyb3dzZXIgc3VwcG9ydHMgaXQuXG4gKi9cbmNvbnN0IGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyA9IG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMoe1xuICBwYXNzaXZlOiB0cnVlLFxuICBjYXB0dXJlOiB0cnVlXG59KTtcblxuXG4vKiogTW9uaXRvcnMgbW91c2UgYW5kIGtleWJvYXJkIGV2ZW50cyB0byBkZXRlcm1pbmUgdGhlIGNhdXNlIG9mIGZvY3VzIGV2ZW50cy4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIEZvY3VzTW9uaXRvciBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qKiBUaGUgZm9jdXMgb3JpZ2luIHRoYXQgdGhlIG5leHQgZm9jdXMgZXZlbnQgaXMgYSByZXN1bHQgb2YuICovXG4gIHByaXZhdGUgX29yaWdpbjogRm9jdXNPcmlnaW4gPSBudWxsO1xuXG4gIC8qKiBUaGUgRm9jdXNPcmlnaW4gb2YgdGhlIGxhc3QgZm9jdXMgZXZlbnQgdHJhY2tlZCBieSB0aGUgRm9jdXNNb25pdG9yLiAqL1xuICBwcml2YXRlIF9sYXN0Rm9jdXNPcmlnaW46IEZvY3VzT3JpZ2luO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSB3aW5kb3cgaGFzIGp1c3QgYmVlbiBmb2N1c2VkLiAqL1xuICBwcml2YXRlIF93aW5kb3dGb2N1c2VkID0gZmFsc2U7XG5cbiAgLyoqIFRoZSB0YXJnZXQgb2YgdGhlIGxhc3QgdG91Y2ggZXZlbnQuICovXG4gIHByaXZhdGUgX2xhc3RUb3VjaFRhcmdldDogRXZlbnRUYXJnZXQgfCBudWxsO1xuXG4gIC8qKiBUaGUgdGltZW91dCBpZCBvZiB0aGUgdG91Y2ggdGltZW91dCwgdXNlZCB0byBjYW5jZWwgdGltZW91dCBsYXRlci4gKi9cbiAgcHJpdmF0ZSBfdG91Y2hUaW1lb3V0SWQ6IG51bWJlcjtcblxuICAvKiogVGhlIHRpbWVvdXQgaWQgb2YgdGhlIHdpbmRvdyBmb2N1cyB0aW1lb3V0LiAqL1xuICBwcml2YXRlIF93aW5kb3dGb2N1c1RpbWVvdXRJZDogbnVtYmVyO1xuXG4gIC8qKiBUaGUgdGltZW91dCBpZCBvZiB0aGUgb3JpZ2luIGNsZWFyaW5nIHRpbWVvdXQuICovXG4gIHByaXZhdGUgX29yaWdpblRpbWVvdXRJZDogbnVtYmVyO1xuXG4gIC8qKiBNYXAgb2YgZWxlbWVudHMgYmVpbmcgbW9uaXRvcmVkIHRvIHRoZWlyIGluZm8uICovXG4gIHByaXZhdGUgX2VsZW1lbnRJbmZvID0gbmV3IE1hcDxIVE1MRWxlbWVudCwgTW9uaXRvcmVkRWxlbWVudEluZm8+KCk7XG5cbiAgLyoqIFRoZSBudW1iZXIgb2YgZWxlbWVudHMgY3VycmVudGx5IGJlaW5nIG1vbml0b3JlZC4gKi9cbiAgcHJpdmF0ZSBfbW9uaXRvcmVkRWxlbWVudENvdW50ID0gMDtcblxuICAvKipcbiAgICogVGhlIHNwZWNpZmllZCBkZXRlY3Rpb24gbW9kZSwgdXNlZCBmb3IgYXR0cmlidXRpbmcgdGhlIG9yaWdpbiBvZiBhIGZvY3VzXG4gICAqIGV2ZW50LlxuICAgKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfZGV0ZWN0aW9uTW9kZTogRm9jdXNNb25pdG9yRGV0ZWN0aW9uTW9kZTtcblxuICAvKipcbiAgICogRXZlbnQgbGlzdGVuZXIgZm9yIGBrZXlkb3duYCBldmVudHMgb24gdGhlIGRvY3VtZW50LlxuICAgKiBOZWVkcyB0byBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0IGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF9kb2N1bWVudEtleWRvd25MaXN0ZW5lciA9ICgpID0+IHtcbiAgICAvLyBPbiBrZXlkb3duIHJlY29yZCB0aGUgb3JpZ2luIGFuZCBjbGVhciBhbnkgdG91Y2ggZXZlbnQgdGhhdCBtYXkgYmUgaW4gcHJvZ3Jlc3MuXG4gICAgdGhpcy5fbGFzdFRvdWNoVGFyZ2V0ID0gbnVsbDtcbiAgICB0aGlzLl9zZXRPcmlnaW5Gb3JDdXJyZW50RXZlbnRRdWV1ZSgna2V5Ym9hcmQnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFdmVudCBsaXN0ZW5lciBmb3IgYG1vdXNlZG93bmAgZXZlbnRzIG9uIHRoZSBkb2N1bWVudC5cbiAgICogTmVlZHMgdG8gYmUgYW4gYXJyb3cgZnVuY3Rpb24gaW4gb3JkZXIgdG8gcHJlc2VydmUgdGhlIGNvbnRleHQgd2hlbiBpdCBnZXRzIGJvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfZG9jdW1lbnRNb3VzZWRvd25MaXN0ZW5lciA9IChldmVudDogTW91c2VFdmVudCkgPT4ge1xuICAgIC8vIE9uIG1vdXNlZG93biByZWNvcmQgdGhlIG9yaWdpbiBvbmx5IGlmIHRoZXJlIGlzIG5vdCB0b3VjaFxuICAgIC8vIHRhcmdldCwgc2luY2UgYSBtb3VzZWRvd24gY2FuIGhhcHBlbiBhcyBhIHJlc3VsdCBvZiBhIHRvdWNoIGV2ZW50LlxuICAgIGlmICghdGhpcy5fbGFzdFRvdWNoVGFyZ2V0KSB7XG4gICAgICAvLyBJbiBzb21lIGNhc2VzIHNjcmVlbiByZWFkZXJzIGZpcmUgZmFrZSBgbW91c2Vkb3duYCBldmVudHMgaW5zdGVhZCBvZiBga2V5ZG93bmAuXG4gICAgICAvLyBSZXNvbHZlIHRoZSBmb2N1cyBzb3VyY2UgdG8gYGtleWJvYXJkYCBpZiB3ZSBkZXRlY3Qgb25lIG9mIHRoZW0uXG4gICAgICBjb25zdCBzb3VyY2UgPSBpc0Zha2VNb3VzZWRvd25Gcm9tU2NyZWVuUmVhZGVyKGV2ZW50KSA/ICdrZXlib2FyZCcgOiAnbW91c2UnO1xuICAgICAgdGhpcy5fc2V0T3JpZ2luRm9yQ3VycmVudEV2ZW50UXVldWUoc291cmNlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRXZlbnQgbGlzdGVuZXIgZm9yIGB0b3VjaHN0YXJ0YCBldmVudHMgb24gdGhlIGRvY3VtZW50LlxuICAgKiBOZWVkcyB0byBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0IGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF9kb2N1bWVudFRvdWNoc3RhcnRMaXN0ZW5lciA9IChldmVudDogVG91Y2hFdmVudCkgPT4ge1xuICAgIC8vIFdoZW4gdGhlIHRvdWNoc3RhcnQgZXZlbnQgZmlyZXMgdGhlIGZvY3VzIGV2ZW50IGlzIG5vdCB5ZXQgaW4gdGhlIGV2ZW50IHF1ZXVlLiBUaGlzIG1lYW5zXG4gICAgLy8gd2UgY2FuJ3QgcmVseSBvbiB0aGUgdHJpY2sgdXNlZCBhYm92ZSAoc2V0dGluZyB0aW1lb3V0IG9mIDFtcykuIEluc3RlYWQgd2Ugd2FpdCA2NTBtcyB0b1xuICAgIC8vIHNlZSBpZiBhIGZvY3VzIGhhcHBlbnMuXG4gICAgaWYgKHRoaXMuX3RvdWNoVGltZW91dElkICE9IG51bGwpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl90b3VjaFRpbWVvdXRJZCk7XG4gICAgfVxuXG4gICAgLy8gU2luY2UgdGhpcyBsaXN0ZW5lciBpcyBib3VuZCBvbiB0aGUgYGRvY3VtZW50YCBsZXZlbCwgYW55IGV2ZW50cyBjb21pbmcgZnJvbSB0aGUgc2hhZG93IERPTVxuICAgIC8vIHdpbGwgaGF2ZSB0aGVpciBgdGFyZ2V0YCBzZXQgdG8gdGhlIHNoYWRvdyByb290LiBJZiBhdmFpbGFibGUsIHVzZSBgY29tcG9zZWRQYXRoYCB0b1xuICAgIC8vIGZpZ3VyZSBvdXQgdGhlIGV2ZW50IHRhcmdldC5cbiAgICB0aGlzLl9sYXN0VG91Y2hUYXJnZXQgPSBldmVudC5jb21wb3NlZFBhdGggPyBldmVudC5jb21wb3NlZFBhdGgoKVswXSA6IGV2ZW50LnRhcmdldDtcbiAgICB0aGlzLl90b3VjaFRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fbGFzdFRvdWNoVGFyZ2V0ID0gbnVsbCwgVE9VQ0hfQlVGRkVSX01TKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFdmVudCBsaXN0ZW5lciBmb3IgYGZvY3VzYCBldmVudHMgb24gdGhlIHdpbmRvdy5cbiAgICogTmVlZHMgdG8gYmUgYW4gYXJyb3cgZnVuY3Rpb24gaW4gb3JkZXIgdG8gcHJlc2VydmUgdGhlIGNvbnRleHQgd2hlbiBpdCBnZXRzIGJvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfd2luZG93Rm9jdXNMaXN0ZW5lciA9ICgpID0+IHtcbiAgICAvLyBNYWtlIGEgbm90ZSBvZiB3aGVuIHRoZSB3aW5kb3cgcmVnYWlucyBmb2N1cywgc28gd2UgY2FuXG4gICAgLy8gcmVzdG9yZSB0aGUgb3JpZ2luIGluZm8gZm9yIHRoZSBmb2N1c2VkIGVsZW1lbnQuXG4gICAgdGhpcy5fd2luZG93Rm9jdXNlZCA9IHRydWU7XG4gICAgdGhpcy5fd2luZG93Rm9jdXNUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX3dpbmRvd0ZvY3VzZWQgPSBmYWxzZSk7XG4gIH1cblxuICAvKiogVXNlZCB0byByZWZlcmVuY2UgY29ycmVjdCBkb2N1bWVudC93aW5kb3cgKi9cbiAgcHJvdGVjdGVkIF9kb2N1bWVudD86IERvY3VtZW50O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgICBwcml2YXRlIF9wbGF0Zm9ybTogUGxhdGZvcm0sXG4gICAgICAvKiogQGJyZWFraW5nLWNoYW5nZSAxMS4wLjAgbWFrZSBkb2N1bWVudCByZXF1aXJlZCAqL1xuICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChET0NVTUVOVCkgZG9jdW1lbnQ6IGFueXxudWxsLFxuICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChGT0NVU19NT05JVE9SX0RFRkFVTFRfT1BUSU9OUykgb3B0aW9uczpcbiAgICAgICAgICBGb2N1c01vbml0b3JPcHRpb25zfG51bGwpIHtcbiAgICB0aGlzLl9kb2N1bWVudCA9IGRvY3VtZW50O1xuICAgIHRoaXMuX2RldGVjdGlvbk1vZGUgPSBvcHRpb25zPy5kZXRlY3Rpb25Nb2RlIHx8IEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGUuSU1NRURJQVRFO1xuICB9XG4gIC8qKlxuICAgKiBFdmVudCBsaXN0ZW5lciBmb3IgYGZvY3VzYCBhbmQgJ2JsdXInIGV2ZW50cyBvbiB0aGUgZG9jdW1lbnQuXG4gICAqIE5lZWRzIHRvIGJlIGFuIGFycm93IGZ1bmN0aW9uIGluIG9yZGVyIHRvIHByZXNlcnZlIHRoZSBjb250ZXh0IHdoZW4gaXQgZ2V0cyBib3VuZC5cbiAgICovXG4gIHByaXZhdGUgX2RvY3VtZW50Rm9jdXNBbmRCbHVyTGlzdGVuZXIgPSAoZXZlbnQ6IEZvY3VzRXZlbnQpID0+IHtcbiAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnR8bnVsbDtcbiAgICBjb25zdCBoYW5kbGVyID0gZXZlbnQudHlwZSA9PT0gJ2ZvY3VzJyA/IHRoaXMuX29uRm9jdXMgOiB0aGlzLl9vbkJsdXI7XG5cbiAgICAvLyBXZSBuZWVkIHRvIHdhbGsgdXAgdGhlIGFuY2VzdG9yIGNoYWluIGluIG9yZGVyIHRvIHN1cHBvcnQgYGNoZWNrQ2hpbGRyZW5gLlxuICAgIGZvciAobGV0IGVsID0gdGFyZ2V0OyBlbDsgZWwgPSBlbC5wYXJlbnRFbGVtZW50KSB7XG4gICAgICBoYW5kbGVyLmNhbGwodGhpcywgZXZlbnQsIGVsKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTW9uaXRvcnMgZm9jdXMgb24gYW4gZWxlbWVudCBhbmQgYXBwbGllcyBhcHByb3ByaWF0ZSBDU1MgY2xhc3Nlcy5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gbW9uaXRvclxuICAgKiBAcGFyYW0gY2hlY2tDaGlsZHJlbiBXaGV0aGVyIHRvIGNvdW50IHRoZSBlbGVtZW50IGFzIGZvY3VzZWQgd2hlbiBpdHMgY2hpbGRyZW4gYXJlIGZvY3VzZWQuXG4gICAqIEByZXR1cm5zIEFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB3aGVuIHRoZSBmb2N1cyBzdGF0ZSBvZiB0aGUgZWxlbWVudCBjaGFuZ2VzLlxuICAgKiAgICAgV2hlbiB0aGUgZWxlbWVudCBpcyBibHVycmVkLCBudWxsIHdpbGwgYmUgZW1pdHRlZC5cbiAgICovXG4gIG1vbml0b3IoZWxlbWVudDogSFRNTEVsZW1lbnQsIGNoZWNrQ2hpbGRyZW4/OiBib29sZWFuKTogT2JzZXJ2YWJsZTxGb2N1c09yaWdpbj47XG5cbiAgLyoqXG4gICAqIE1vbml0b3JzIGZvY3VzIG9uIGFuIGVsZW1lbnQgYW5kIGFwcGxpZXMgYXBwcm9wcmlhdGUgQ1NTIGNsYXNzZXMuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIG1vbml0b3JcbiAgICogQHBhcmFtIGNoZWNrQ2hpbGRyZW4gV2hldGhlciB0byBjb3VudCB0aGUgZWxlbWVudCBhcyBmb2N1c2VkIHdoZW4gaXRzIGNoaWxkcmVuIGFyZSBmb2N1c2VkLlxuICAgKiBAcmV0dXJucyBBbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgd2hlbiB0aGUgZm9jdXMgc3RhdGUgb2YgdGhlIGVsZW1lbnQgY2hhbmdlcy5cbiAgICogICAgIFdoZW4gdGhlIGVsZW1lbnQgaXMgYmx1cnJlZCwgbnVsbCB3aWxsIGJlIGVtaXR0ZWQuXG4gICAqL1xuICBtb25pdG9yKGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LCBjaGVja0NoaWxkcmVuPzogYm9vbGVhbik6IE9ic2VydmFibGU8Rm9jdXNPcmlnaW4+O1xuXG4gIG1vbml0b3IoZWxlbWVudDogSFRNTEVsZW1lbnQgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICAgICAgICBjaGVja0NoaWxkcmVuOiBib29sZWFuID0gZmFsc2UpOiBPYnNlcnZhYmxlPEZvY3VzT3JpZ2luPiB7XG4gICAgLy8gRG8gbm90aGluZyBpZiB3ZSdyZSBub3Qgb24gdGhlIGJyb3dzZXIgcGxhdGZvcm0uXG4gICAgaWYgKCF0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIpIHtcbiAgICAgIHJldHVybiBvYnNlcnZhYmxlT2YobnVsbCk7XG4gICAgfVxuXG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoZWxlbWVudCk7XG5cbiAgICAvLyBDaGVjayBpZiB3ZSdyZSBhbHJlYWR5IG1vbml0b3JpbmcgdGhpcyBlbGVtZW50LlxuICAgIGlmICh0aGlzLl9lbGVtZW50SW5mby5oYXMobmF0aXZlRWxlbWVudCkpIHtcbiAgICAgIGNvbnN0IGNhY2hlZEluZm8gPSB0aGlzLl9lbGVtZW50SW5mby5nZXQobmF0aXZlRWxlbWVudCk7XG4gICAgICBjYWNoZWRJbmZvIS5jaGVja0NoaWxkcmVuID0gY2hlY2tDaGlsZHJlbjtcbiAgICAgIHJldHVybiBjYWNoZWRJbmZvIS5zdWJqZWN0LmFzT2JzZXJ2YWJsZSgpO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBtb25pdG9yZWQgZWxlbWVudCBpbmZvLlxuICAgIGNvbnN0IGluZm86IE1vbml0b3JlZEVsZW1lbnRJbmZvID0ge1xuICAgICAgY2hlY2tDaGlsZHJlbjogY2hlY2tDaGlsZHJlbixcbiAgICAgIHN1YmplY3Q6IG5ldyBTdWJqZWN0PEZvY3VzT3JpZ2luPigpXG4gICAgfTtcbiAgICB0aGlzLl9lbGVtZW50SW5mby5zZXQobmF0aXZlRWxlbWVudCwgaW5mbyk7XG4gICAgdGhpcy5faW5jcmVtZW50TW9uaXRvcmVkRWxlbWVudENvdW50KCk7XG5cbiAgICByZXR1cm4gaW5mby5zdWJqZWN0LmFzT2JzZXJ2YWJsZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0b3BzIG1vbml0b3JpbmcgYW4gZWxlbWVudCBhbmQgcmVtb3ZlcyBhbGwgZm9jdXMgY2xhc3Nlcy5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gc3RvcCBtb25pdG9yaW5nLlxuICAgKi9cbiAgc3RvcE1vbml0b3JpbmcoZWxlbWVudDogSFRNTEVsZW1lbnQpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBTdG9wcyBtb25pdG9yaW5nIGFuIGVsZW1lbnQgYW5kIHJlbW92ZXMgYWxsIGZvY3VzIGNsYXNzZXMuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHN0b3AgbW9uaXRvcmluZy5cbiAgICovXG4gIHN0b3BNb25pdG9yaW5nKGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+KTogdm9pZDtcblxuICBzdG9wTW9uaXRvcmluZyhlbGVtZW50OiBIVE1MRWxlbWVudCB8IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+KTogdm9pZCB7XG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoZWxlbWVudCk7XG4gICAgY29uc3QgZWxlbWVudEluZm8gPSB0aGlzLl9lbGVtZW50SW5mby5nZXQobmF0aXZlRWxlbWVudCk7XG5cbiAgICBpZiAoZWxlbWVudEluZm8pIHtcbiAgICAgIGVsZW1lbnRJbmZvLnN1YmplY3QuY29tcGxldGUoKTtcblxuICAgICAgdGhpcy5fc2V0Q2xhc3NlcyhuYXRpdmVFbGVtZW50KTtcbiAgICAgIHRoaXMuX2VsZW1lbnRJbmZvLmRlbGV0ZShuYXRpdmVFbGVtZW50KTtcbiAgICAgIHRoaXMuX2RlY3JlbWVudE1vbml0b3JlZEVsZW1lbnRDb3VudCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGb2N1c2VzIHRoZSBlbGVtZW50IHZpYSB0aGUgc3BlY2lmaWVkIGZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCB0byBmb2N1cy5cbiAgICogQHBhcmFtIG9yaWdpbiBGb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCB0byBjb25maWd1cmUgdGhlIGZvY3VzIGJlaGF2aW9yLlxuICAgKi9cbiAgZm9jdXNWaWEoZWxlbWVudDogSFRNTEVsZW1lbnQsIG9yaWdpbjogRm9jdXNPcmlnaW4sIG9wdGlvbnM/OiBGb2N1c09wdGlvbnMpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBGb2N1c2VzIHRoZSBlbGVtZW50IHZpYSB0aGUgc3BlY2lmaWVkIGZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCB0byBmb2N1cy5cbiAgICogQHBhcmFtIG9yaWdpbiBGb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCB0byBjb25maWd1cmUgdGhlIGZvY3VzIGJlaGF2aW9yLlxuICAgKi9cbiAgZm9jdXNWaWEoZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sIG9yaWdpbjogRm9jdXNPcmlnaW4sIG9wdGlvbnM/OiBGb2N1c09wdGlvbnMpOiB2b2lkO1xuXG4gIGZvY3VzVmlhKGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgICAgICAgb3JpZ2luOiBGb2N1c09yaWdpbixcbiAgICAgICAgICBvcHRpb25zPzogRm9jdXNPcHRpb25zKTogdm9pZCB7XG5cbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gY29lcmNlRWxlbWVudChlbGVtZW50KTtcblxuICAgIHRoaXMuX3NldE9yaWdpbkZvckN1cnJlbnRFdmVudFF1ZXVlKG9yaWdpbik7XG5cbiAgICAvLyBgZm9jdXNgIGlzbid0IGF2YWlsYWJsZSBvbiB0aGUgc2VydmVyXG4gICAgaWYgKHR5cGVvZiBuYXRpdmVFbGVtZW50LmZvY3VzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyBDYXN0IHRoZSBlbGVtZW50IHRvIGBhbnlgLCBiZWNhdXNlIHRoZSBUUyB0eXBpbmdzIGRvbid0IGhhdmUgdGhlIGBvcHRpb25zYCBwYXJhbWV0ZXIgeWV0LlxuICAgICAgKG5hdGl2ZUVsZW1lbnQgYXMgYW55KS5mb2N1cyhvcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9lbGVtZW50SW5mby5mb3JFYWNoKChfaW5mbywgZWxlbWVudCkgPT4gdGhpcy5zdG9wTW9uaXRvcmluZyhlbGVtZW50KSk7XG4gIH1cblxuICAvKiogQWNjZXNzIGluamVjdGVkIGRvY3VtZW50IGlmIGF2YWlsYWJsZSBvciBmYWxsYmFjayB0byBnbG9iYWwgZG9jdW1lbnQgcmVmZXJlbmNlICovXG4gIHByaXZhdGUgX2dldERvY3VtZW50KCk6IERvY3VtZW50IHtcbiAgICByZXR1cm4gdGhpcy5fZG9jdW1lbnQgfHwgZG9jdW1lbnQ7XG4gIH1cblxuICAvKiogVXNlIGRlZmF1bHRWaWV3IG9mIGluamVjdGVkIGRvY3VtZW50IGlmIGF2YWlsYWJsZSBvciBmYWxsYmFjayB0byBnbG9iYWwgd2luZG93IHJlZmVyZW5jZSAqL1xuICBwcml2YXRlIF9nZXRXaW5kb3coKTogV2luZG93IHtcbiAgICBjb25zdCBkb2MgPSB0aGlzLl9nZXREb2N1bWVudCgpO1xuICAgIHJldHVybiBkb2MuZGVmYXVsdFZpZXcgfHwgd2luZG93O1xuICB9XG5cbiAgcHJpdmF0ZSBfdG9nZ2xlQ2xhc3MoZWxlbWVudDogRWxlbWVudCwgY2xhc3NOYW1lOiBzdHJpbmcsIHNob3VsZFNldDogYm9vbGVhbikge1xuICAgIGlmIChzaG91bGRTZXQpIHtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9nZXRGb2N1c09yaWdpbihldmVudDogRm9jdXNFdmVudCk6IEZvY3VzT3JpZ2luIHtcbiAgICAvLyBJZiB3ZSBjb3VsZG4ndCBkZXRlY3QgYSBjYXVzZSBmb3IgdGhlIGZvY3VzIGV2ZW50LCBpdCdzIGR1ZSB0byBvbmUgb2YgdGhyZWUgcmVhc29uczpcbiAgICAvLyAxKSBUaGUgd2luZG93IGhhcyBqdXN0IHJlZ2FpbmVkIGZvY3VzLCBpbiB3aGljaCBjYXNlIHdlIHdhbnQgdG8gcmVzdG9yZSB0aGUgZm9jdXNlZCBzdGF0ZSBvZlxuICAgIC8vICAgIHRoZSBlbGVtZW50IGZyb20gYmVmb3JlIHRoZSB3aW5kb3cgYmx1cnJlZC5cbiAgICAvLyAyKSBJdCB3YXMgY2F1c2VkIGJ5IGEgdG91Y2ggZXZlbnQsIGluIHdoaWNoIGNhc2Ugd2UgbWFyayB0aGUgb3JpZ2luIGFzICd0b3VjaCcuXG4gICAgLy8gMykgVGhlIGVsZW1lbnQgd2FzIHByb2dyYW1tYXRpY2FsbHkgZm9jdXNlZCwgaW4gd2hpY2ggY2FzZSB3ZSBzaG91bGQgbWFyayB0aGUgb3JpZ2luIGFzXG4gICAgLy8gICAgJ3Byb2dyYW0nLlxuICAgIGlmICh0aGlzLl9vcmlnaW4pIHtcbiAgICAgIHJldHVybiB0aGlzLl9vcmlnaW47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3dpbmRvd0ZvY3VzZWQgJiYgdGhpcy5fbGFzdEZvY3VzT3JpZ2luKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbGFzdEZvY3VzT3JpZ2luO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fd2FzQ2F1c2VkQnlUb3VjaChldmVudCkpIHtcbiAgICAgIHJldHVybiAndG91Y2gnO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJ3Byb2dyYW0nO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBmb2N1cyBjbGFzc2VzIG9uIHRoZSBlbGVtZW50IGJhc2VkIG9uIHRoZSBnaXZlbiBmb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHVwZGF0ZSB0aGUgY2xhc3NlcyBvbi5cbiAgICogQHBhcmFtIG9yaWdpbiBUaGUgZm9jdXMgb3JpZ2luLlxuICAgKi9cbiAgcHJpdmF0ZSBfc2V0Q2xhc3NlcyhlbGVtZW50OiBIVE1MRWxlbWVudCwgb3JpZ2luPzogRm9jdXNPcmlnaW4pOiB2b2lkIHtcbiAgICB0aGlzLl90b2dnbGVDbGFzcyhlbGVtZW50LCAnY2RrLWZvY3VzZWQnLCAhIW9yaWdpbik7XG4gICAgdGhpcy5fdG9nZ2xlQ2xhc3MoZWxlbWVudCwgJ2Nkay10b3VjaC1mb2N1c2VkJywgb3JpZ2luID09PSAndG91Y2gnKTtcbiAgICB0aGlzLl90b2dnbGVDbGFzcyhlbGVtZW50LCAnY2RrLWtleWJvYXJkLWZvY3VzZWQnLCBvcmlnaW4gPT09ICdrZXlib2FyZCcpO1xuICAgIHRoaXMuX3RvZ2dsZUNsYXNzKGVsZW1lbnQsICdjZGstbW91c2UtZm9jdXNlZCcsIG9yaWdpbiA9PT0gJ21vdXNlJyk7XG4gICAgdGhpcy5fdG9nZ2xlQ2xhc3MoZWxlbWVudCwgJ2Nkay1wcm9ncmFtLWZvY3VzZWQnLCBvcmlnaW4gPT09ICdwcm9ncmFtJyk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgb3JpZ2luIGFuZCBzY2hlZHVsZXMgYW4gYXN5bmMgZnVuY3Rpb24gdG8gY2xlYXIgaXQgYXQgdGhlIGVuZCBvZiB0aGUgZXZlbnQgcXVldWUuXG4gICAqIElmIHRoZSBkZXRlY3Rpb24gbW9kZSBpcyAnZXZlbnR1YWwnLCB0aGUgb3JpZ2luIGlzIG5ldmVyIGNsZWFyZWQuXG4gICAqIEBwYXJhbSBvcmlnaW4gVGhlIG9yaWdpbiB0byBzZXQuXG4gICAqL1xuICBwcml2YXRlIF9zZXRPcmlnaW5Gb3JDdXJyZW50RXZlbnRRdWV1ZShvcmlnaW46IEZvY3VzT3JpZ2luKTogdm9pZCB7XG4gICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHRoaXMuX29yaWdpbiA9IG9yaWdpbjtcblxuICAgICAgaWYgKHRoaXMuX2RldGVjdGlvbk1vZGUgPT09IEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGUuSU1NRURJQVRFKSB7XG4gICAgICAgIC8vIFNvbWV0aW1lcyB0aGUgZm9jdXMgb3JpZ2luIHdvbid0IGJlIHZhbGlkIGluIEZpcmVmb3ggYmVjYXVzZSBGaXJlZm94IHNlZW1zIHRvIGZvY3VzICpvbmUqXG4gICAgICAgIC8vIHRpY2sgYWZ0ZXIgdGhlIGludGVyYWN0aW9uIGV2ZW50IGZpcmVkLiBUbyBlbnN1cmUgdGhlIGZvY3VzIG9yaWdpbiBpcyBhbHdheXMgY29ycmVjdCxcbiAgICAgICAgLy8gdGhlIGZvY3VzIG9yaWdpbiB3aWxsIGJlIGRldGVybWluZWQgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgbmV4dCB0aWNrLlxuICAgICAgICB0aGlzLl9vcmlnaW5UaW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX29yaWdpbiA9IG51bGwsIDEpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSBnaXZlbiBmb2N1cyBldmVudCB3YXMgY2F1c2VkIGJ5IGEgdG91Y2hzdGFydCBldmVudC5cbiAgICogQHBhcmFtIGV2ZW50IFRoZSBmb2N1cyBldmVudCB0byBjaGVjay5cbiAgICogQHJldHVybnMgV2hldGhlciB0aGUgZXZlbnQgd2FzIGNhdXNlZCBieSBhIHRvdWNoLlxuICAgKi9cbiAgcHJpdmF0ZSBfd2FzQ2F1c2VkQnlUb3VjaChldmVudDogRm9jdXNFdmVudCk6IGJvb2xlYW4ge1xuICAgIC8vIE5vdGUobW1hbGVyYmEpOiBUaGlzIGltcGxlbWVudGF0aW9uIGlzIG5vdCBxdWl0ZSBwZXJmZWN0LCB0aGVyZSBpcyBhIHNtYWxsIGVkZ2UgY2FzZS5cbiAgICAvLyBDb25zaWRlciB0aGUgZm9sbG93aW5nIGRvbSBzdHJ1Y3R1cmU6XG4gICAgLy9cbiAgICAvLyA8ZGl2ICNwYXJlbnQgdGFiaW5kZXg9XCIwXCIgY2RrRm9jdXNDbGFzc2VzPlxuICAgIC8vICAgPGRpdiAjY2hpbGQgKGNsaWNrKT1cIiNwYXJlbnQuZm9jdXMoKVwiPjwvZGl2PlxuICAgIC8vIDwvZGl2PlxuICAgIC8vXG4gICAgLy8gSWYgdGhlIHVzZXIgdG91Y2hlcyB0aGUgI2NoaWxkIGVsZW1lbnQgYW5kIHRoZSAjcGFyZW50IGlzIHByb2dyYW1tYXRpY2FsbHkgZm9jdXNlZCBhcyBhXG4gICAgLy8gcmVzdWx0LCB0aGlzIGNvZGUgd2lsbCBzdGlsbCBjb25zaWRlciBpdCB0byBoYXZlIGJlZW4gY2F1c2VkIGJ5IHRoZSB0b3VjaCBldmVudCBhbmQgd2lsbFxuICAgIC8vIGFwcGx5IHRoZSBjZGstdG91Y2gtZm9jdXNlZCBjbGFzcyByYXRoZXIgdGhhbiB0aGUgY2RrLXByb2dyYW0tZm9jdXNlZCBjbGFzcy4gVGhpcyBpcyBhXG4gICAgLy8gcmVsYXRpdmVseSBzbWFsbCBlZGdlLWNhc2UgdGhhdCBjYW4gYmUgd29ya2VkIGFyb3VuZCBieSB1c2luZ1xuICAgIC8vIGZvY3VzVmlhKHBhcmVudEVsLCAncHJvZ3JhbScpIHRvIGZvY3VzIHRoZSBwYXJlbnQgZWxlbWVudC5cbiAgICAvL1xuICAgIC8vIElmIHdlIGRlY2lkZSB0aGF0IHdlIGFic29sdXRlbHkgbXVzdCBoYW5kbGUgdGhpcyBjYXNlIGNvcnJlY3RseSwgd2UgY2FuIGRvIHNvIGJ5IGxpc3RlbmluZ1xuICAgIC8vIGZvciB0aGUgZmlyc3QgZm9jdXMgZXZlbnQgYWZ0ZXIgdGhlIHRvdWNoc3RhcnQsIGFuZCB0aGVuIHRoZSBmaXJzdCBibHVyIGV2ZW50IGFmdGVyIHRoYXRcbiAgICAvLyBmb2N1cyBldmVudC4gV2hlbiB0aGF0IGJsdXIgZXZlbnQgZmlyZXMgd2Uga25vdyB0aGF0IHdoYXRldmVyIGZvbGxvd3MgaXMgbm90IGEgcmVzdWx0IG9mIHRoZVxuICAgIC8vIHRvdWNoc3RhcnQuXG4gICAgbGV0IGZvY3VzVGFyZ2V0ID0gZXZlbnQudGFyZ2V0O1xuICAgIHJldHVybiB0aGlzLl9sYXN0VG91Y2hUYXJnZXQgaW5zdGFuY2VvZiBOb2RlICYmIGZvY3VzVGFyZ2V0IGluc3RhbmNlb2YgTm9kZSAmJlxuICAgICAgICAoZm9jdXNUYXJnZXQgPT09IHRoaXMuX2xhc3RUb3VjaFRhcmdldCB8fCBmb2N1c1RhcmdldC5jb250YWlucyh0aGlzLl9sYXN0VG91Y2hUYXJnZXQpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIGZvY3VzIGV2ZW50cyBvbiBhIHJlZ2lzdGVyZWQgZWxlbWVudC5cbiAgICogQHBhcmFtIGV2ZW50IFRoZSBmb2N1cyBldmVudC5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIG1vbml0b3JlZCBlbGVtZW50LlxuICAgKi9cbiAgcHJpdmF0ZSBfb25Gb2N1cyhldmVudDogRm9jdXNFdmVudCwgZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgICAvLyBOT1RFKG1tYWxlcmJhKTogV2UgY3VycmVudGx5IHNldCB0aGUgY2xhc3NlcyBiYXNlZCBvbiB0aGUgZm9jdXMgb3JpZ2luIG9mIHRoZSBtb3N0IHJlY2VudFxuICAgIC8vIGZvY3VzIGV2ZW50IGFmZmVjdGluZyB0aGUgbW9uaXRvcmVkIGVsZW1lbnQuIElmIHdlIHdhbnQgdG8gdXNlIHRoZSBvcmlnaW4gb2YgdGhlIGZpcnN0IGV2ZW50XG4gICAgLy8gaW5zdGVhZCB3ZSBzaG91bGQgY2hlY2sgZm9yIHRoZSBjZGstZm9jdXNlZCBjbGFzcyBoZXJlIGFuZCByZXR1cm4gaWYgdGhlIGVsZW1lbnQgYWxyZWFkeSBoYXNcbiAgICAvLyBpdC4gKFRoaXMgb25seSBtYXR0ZXJzIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgaW5jbHVkZXNDaGlsZHJlbiA9IHRydWUpLlxuXG4gICAgLy8gSWYgd2UgYXJlIG5vdCBjb3VudGluZyBjaGlsZC1lbGVtZW50LWZvY3VzIGFzIGZvY3VzZWQsIG1ha2Ugc3VyZSB0aGF0IHRoZSBldmVudCB0YXJnZXQgaXMgdGhlXG4gICAgLy8gbW9uaXRvcmVkIGVsZW1lbnQgaXRzZWxmLlxuICAgIGNvbnN0IGVsZW1lbnRJbmZvID0gdGhpcy5fZWxlbWVudEluZm8uZ2V0KGVsZW1lbnQpO1xuICAgIGlmICghZWxlbWVudEluZm8gfHwgKCFlbGVtZW50SW5mby5jaGVja0NoaWxkcmVuICYmIGVsZW1lbnQgIT09IGV2ZW50LnRhcmdldCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBvcmlnaW4gPSB0aGlzLl9nZXRGb2N1c09yaWdpbihldmVudCk7XG4gICAgdGhpcy5fc2V0Q2xhc3NlcyhlbGVtZW50LCBvcmlnaW4pO1xuICAgIHRoaXMuX2VtaXRPcmlnaW4oZWxlbWVudEluZm8uc3ViamVjdCwgb3JpZ2luKTtcbiAgICB0aGlzLl9sYXN0Rm9jdXNPcmlnaW4gPSBvcmlnaW47XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBibHVyIGV2ZW50cyBvbiBhIHJlZ2lzdGVyZWQgZWxlbWVudC5cbiAgICogQHBhcmFtIGV2ZW50IFRoZSBibHVyIGV2ZW50LlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgbW9uaXRvcmVkIGVsZW1lbnQuXG4gICAqL1xuICBfb25CbHVyKGV2ZW50OiBGb2N1c0V2ZW50LCBlbGVtZW50OiBIVE1MRWxlbWVudCkge1xuICAgIC8vIElmIHdlIGFyZSBjb3VudGluZyBjaGlsZC1lbGVtZW50LWZvY3VzIGFzIGZvY3VzZWQsIG1ha2Ugc3VyZSB0aGF0IHdlIGFyZW4ndCBqdXN0IGJsdXJyaW5nIGluXG4gICAgLy8gb3JkZXIgdG8gZm9jdXMgYW5vdGhlciBjaGlsZCBvZiB0aGUgbW9uaXRvcmVkIGVsZW1lbnQuXG4gICAgY29uc3QgZWxlbWVudEluZm8gPSB0aGlzLl9lbGVtZW50SW5mby5nZXQoZWxlbWVudCk7XG5cbiAgICBpZiAoIWVsZW1lbnRJbmZvIHx8IChlbGVtZW50SW5mby5jaGVja0NoaWxkcmVuICYmIGV2ZW50LnJlbGF0ZWRUYXJnZXQgaW5zdGFuY2VvZiBOb2RlICYmXG4gICAgICAgIGVsZW1lbnQuY29udGFpbnMoZXZlbnQucmVsYXRlZFRhcmdldCkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fc2V0Q2xhc3NlcyhlbGVtZW50KTtcbiAgICB0aGlzLl9lbWl0T3JpZ2luKGVsZW1lbnRJbmZvLnN1YmplY3QsIG51bGwpO1xuICB9XG5cbiAgcHJpdmF0ZSBfZW1pdE9yaWdpbihzdWJqZWN0OiBTdWJqZWN0PEZvY3VzT3JpZ2luPiwgb3JpZ2luOiBGb2N1c09yaWdpbikge1xuICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4gc3ViamVjdC5uZXh0KG9yaWdpbikpO1xuICB9XG5cbiAgcHJpdmF0ZSBfaW5jcmVtZW50TW9uaXRvcmVkRWxlbWVudENvdW50KCkge1xuICAgIC8vIFJlZ2lzdGVyIGdsb2JhbCBsaXN0ZW5lcnMgd2hlbiBmaXJzdCBlbGVtZW50IGlzIG1vbml0b3JlZC5cbiAgICBpZiAoKyt0aGlzLl9tb25pdG9yZWRFbGVtZW50Q291bnQgPT0gMSAmJiB0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIpIHtcbiAgICAgIC8vIE5vdGU6IHdlIGxpc3RlbiB0byBldmVudHMgaW4gdGhlIGNhcHR1cmUgcGhhc2Ugc28gd2VcbiAgICAgIC8vIGNhbiBkZXRlY3QgdGhlbSBldmVuIGlmIHRoZSB1c2VyIHN0b3BzIHByb3BhZ2F0aW9uLlxuICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgY29uc3QgZG9jdW1lbnQgPSB0aGlzLl9nZXREb2N1bWVudCgpO1xuICAgICAgICBjb25zdCB3aW5kb3cgPSB0aGlzLl9nZXRXaW5kb3coKTtcblxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMuX2RvY3VtZW50Rm9jdXNBbmRCbHVyTGlzdGVuZXIsXG4gICAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIHRoaXMuX2RvY3VtZW50Rm9jdXNBbmRCbHVyTGlzdGVuZXIsXG4gICAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX2RvY3VtZW50S2V5ZG93bkxpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX2RvY3VtZW50TW91c2Vkb3duTGlzdGVuZXIsXG4gICAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuX2RvY3VtZW50VG91Y2hzdGFydExpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMuX3dpbmRvd0ZvY3VzTGlzdGVuZXIpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfZGVjcmVtZW50TW9uaXRvcmVkRWxlbWVudENvdW50KCkge1xuICAgIC8vIFVucmVnaXN0ZXIgZ2xvYmFsIGxpc3RlbmVycyB3aGVuIGxhc3QgZWxlbWVudCBpcyB1bm1vbml0b3JlZC5cbiAgICBpZiAoIS0tdGhpcy5fbW9uaXRvcmVkRWxlbWVudENvdW50KSB7XG4gICAgICBjb25zdCBkb2N1bWVudCA9IHRoaXMuX2dldERvY3VtZW50KCk7XG4gICAgICBjb25zdCB3aW5kb3cgPSB0aGlzLl9nZXRXaW5kb3coKTtcblxuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignZm9jdXMnLCB0aGlzLl9kb2N1bWVudEZvY3VzQW5kQmx1ckxpc3RlbmVyLFxuICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignYmx1cicsIHRoaXMuX2RvY3VtZW50Rm9jdXNBbmRCbHVyTGlzdGVuZXIsXG4gICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fZG9jdW1lbnRLZXlkb3duTGlzdGVuZXIsXG4gICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9kb2N1bWVudE1vdXNlZG93bkxpc3RlbmVyLFxuICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuX2RvY3VtZW50VG91Y2hzdGFydExpc3RlbmVyLFxuICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5fd2luZG93Rm9jdXNMaXN0ZW5lcik7XG5cbiAgICAgIC8vIENsZWFyIHRpbWVvdXRzIGZvciBhbGwgcG90ZW50aWFsbHkgcGVuZGluZyB0aW1lb3V0cyB0byBwcmV2ZW50IHRoZSBsZWFrcy5cbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl93aW5kb3dGb2N1c1RpbWVvdXRJZCk7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fdG91Y2hUaW1lb3V0SWQpO1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX29yaWdpblRpbWVvdXRJZCk7XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBEaXJlY3RpdmUgdGhhdCBkZXRlcm1pbmVzIGhvdyBhIHBhcnRpY3VsYXIgZWxlbWVudCB3YXMgZm9jdXNlZCAodmlhIGtleWJvYXJkLCBtb3VzZSwgdG91Y2gsIG9yXG4gKiBwcm9ncmFtbWF0aWNhbGx5KSBhbmQgYWRkcyBjb3JyZXNwb25kaW5nIGNsYXNzZXMgdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogVGhlcmUgYXJlIHR3byB2YXJpYW50cyBvZiB0aGlzIGRpcmVjdGl2ZTpcbiAqIDEpIGNka01vbml0b3JFbGVtZW50Rm9jdXM6IGRvZXMgbm90IGNvbnNpZGVyIGFuIGVsZW1lbnQgdG8gYmUgZm9jdXNlZCBpZiBvbmUgb2YgaXRzIGNoaWxkcmVuIGlzXG4gKiAgICBmb2N1c2VkLlxuICogMikgY2RrTW9uaXRvclN1YnRyZWVGb2N1czogY29uc2lkZXJzIGFuIGVsZW1lbnQgZm9jdXNlZCBpZiBpdCBvciBhbnkgb2YgaXRzIGNoaWxkcmVuIGFyZSBmb2N1c2VkLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrTW9uaXRvckVsZW1lbnRGb2N1c10sIFtjZGtNb25pdG9yU3VidHJlZUZvY3VzXScsXG59KVxuZXhwb3J0IGNsYXNzIENka01vbml0b3JGb2N1cyBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIHByaXZhdGUgX21vbml0b3JTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbjtcbiAgQE91dHB1dCgpIGNka0ZvY3VzQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxGb2N1c09yaWdpbj4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9lbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiwgcHJpdmF0ZSBfZm9jdXNNb25pdG9yOiBGb2N1c01vbml0b3IpIHtcbiAgICB0aGlzLl9tb25pdG9yU3Vic2NyaXB0aW9uID0gdGhpcy5fZm9jdXNNb25pdG9yLm1vbml0b3IoXG4gICAgICAgIHRoaXMuX2VsZW1lbnRSZWYsXG4gICAgICAgIHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5oYXNBdHRyaWJ1dGUoJ2Nka01vbml0b3JTdWJ0cmVlRm9jdXMnKSlcbiAgICAgICAgLnN1YnNjcmliZShvcmlnaW4gPT4gdGhpcy5jZGtGb2N1c0NoYW5nZS5lbWl0KG9yaWdpbikpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fZm9jdXNNb25pdG9yLnN0b3BNb25pdG9yaW5nKHRoaXMuX2VsZW1lbnRSZWYpO1xuICAgIHRoaXMuX21vbml0b3JTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgfVxufVxuIl19