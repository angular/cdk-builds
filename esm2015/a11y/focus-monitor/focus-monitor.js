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
                /** @type {?} */
                const document = this._getDocument();
                /** @type {?} */
                const window = this._getWindow();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXMtbW9uaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvYTExeS9mb2N1cy1tb25pdG9yL2ZvY3VzLW1vbml0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFFBQVEsRUFBRSwrQkFBK0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2hGLE9BQU8sRUFDTCxTQUFTLEVBQ1QsVUFBVSxFQUNWLFlBQVksRUFDWixNQUFNLEVBQ04sVUFBVSxFQUNWLGNBQWMsRUFDZCxNQUFNLEVBRU4sUUFBUSxFQUNSLE1BQU0sR0FDUCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQWEsRUFBRSxJQUFJLFlBQVksRUFBRSxPQUFPLEVBQWUsTUFBTSxNQUFNLENBQUM7QUFDM0UsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3BELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQzs7Ozs7OztBQUt6QyxNQUFNLE9BQU8sZUFBZSxHQUFHLEdBQUc7Ozs7OztBQVNsQyxrQ0FHQzs7Ozs7O0lBREMscUNBQXdCOzs7QUFJMUIsTUFBa0IseUJBQXlCO0lBQ3pDOzs7O09BSUc7SUFDSCxTQUFTLEdBQUE7SUFDVDs7O09BR0c7SUFDSCxRQUFRLEdBQUE7RUFDVDs7Ozs7O0FBR0QseUNBRUM7OztJQURDLDRDQUEwQzs7Ozs7O0FBSTVDLE1BQU0sT0FBTyw2QkFBNkIsR0FDdEMsSUFBSSxjQUFjLENBQXNCLG1DQUFtQyxDQUFDOzs7Ozs7TUFZMUUsMkJBQTJCLEdBQUcsK0JBQStCLENBQUM7SUFDbEUsT0FBTyxFQUFFLElBQUk7SUFDYixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUM7Ozs7QUFLRixNQUFNLE9BQU8sWUFBWTs7Ozs7OztJQXlGdkIsWUFDWSxPQUFlLEVBQ2YsU0FBbUI7SUFDM0IscURBQXFEO0lBQ3ZCLFFB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V0FBVyxFQUFFLENBQUM7SUFDMUMsQ0FBQzs7O1lBakJGLFNBQVMsU0FBQztnQkFDVCxRQUFRLEVBQUUsb0RBQW9EO2FBQy9EOzs7O1lBN2VDLFVBQVU7WUFrZnVFLFlBQVk7Ozs2QkFGNUYsTUFBTTs7Ozs7OztJQURQLCtDQUEyQzs7SUFDM0MseUNBQTJEOzs7OztJQUUvQyxzQ0FBNEM7Ozs7O0lBQUUsd0NBQW1DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UGxhdGZvcm0sIG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnN9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5qZWN0LFxuICBJbmplY3RhYmxlLFxuICBJbmplY3Rpb25Ub2tlbixcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIE9wdGlvbmFsLFxuICBPdXRwdXQsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBvZiBhcyBvYnNlcnZhYmxlT2YsIFN1YmplY3QsIFN1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2NvZXJjZUVsZW1lbnR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuXG5cbi8vIFRoaXMgaXMgdGhlIHZhbHVlIHVzZWQgYnkgQW5ndWxhckpTIE1hdGVyaWFsLiBUaHJvdWdoIHRyaWFsIGFuZCBlcnJvciAob24gaVBob25lIDZTKSB0aGV5IGZvdW5kXG4vLyB0aGF0IGEgdmFsdWUgb2YgYXJvdW5kIDY1MG1zIHNlZW1zIGFwcHJvcHJpYXRlLlxuZXhwb3J0IGNvbnN0IFRPVUNIX0JVRkZFUl9NUyA9IDY1MDtcblxuXG5leHBvcnQgdHlwZSBGb2N1c09yaWdpbiA9ICd0b3VjaCcgfCAnbW91c2UnIHwgJ2tleWJvYXJkJyB8ICdwcm9ncmFtJyB8IG51bGw7XG5cbi8qKlxuICogQ29ycmVzcG9uZHMgdG8gdGhlIG9wdGlvbnMgdGhhdCBjYW4gYmUgcGFzc2VkIHRvIHRoZSBuYXRpdmUgYGZvY3VzYCBldmVudC5cbiAqIHZpYSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvSFRNTEVsZW1lbnQvZm9jdXNcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBGb2N1c09wdGlvbnMge1xuICAvKiogV2hldGhlciB0aGUgYnJvd3NlciBzaG91bGQgc2Nyb2xsIHRvIHRoZSBlbGVtZW50IHdoZW4gaXQgaXMgZm9jdXNlZC4gKi9cbiAgcHJldmVudFNjcm9sbD86IGJvb2xlYW47XG59XG5cbi8qKiBEZXRlY3Rpb24gbW9kZSB1c2VkIGZvciBhdHRyaWJ1dGluZyB0aGUgb3JpZ2luIG9mIGEgZm9jdXMgZXZlbnQuICovXG5leHBvcnQgY29uc3QgZW51bSBGb2N1c01vbml0b3JEZXRlY3Rpb25Nb2RlIHtcbiAgLyoqXG4gICAqIEFueSBtb3VzZWRvd24sIGtleWRvd24sIG9yIHRvdWNoc3RhcnQgZXZlbnQgdGhhdCBoYXBwZW5lZCBpbiB0aGUgcHJldmlvdXNcbiAgICogdGljayBvciB0aGUgY3VycmVudCB0aWNrIHdpbGwgYmUgdXNlZCB0byBhc3NpZ24gYSBmb2N1cyBldmVudCdzIG9yaWdpbiAodG9cbiAgICogZWl0aGVyIG1vdXNlLCBrZXlib2FyZCwgb3IgdG91Y2gpLiBUaGlzIGlzIHRoZSBkZWZhdWx0IG9wdGlvbi5cbiAgICovXG4gIElNTUVESUFURSxcbiAgLyoqXG4gICAqIEEgZm9jdXMgZXZlbnQncyBvcmlnaW4gaXMgYWx3YXlzIGF0dHJpYnV0ZWQgdG8gdGhlIGxhc3QgY29ycmVzcG9uZGluZ1xuICAgKiBtb3VzZWRvd24sIGtleWRvd24sIG9yIHRvdWNoc3RhcnQgZXZlbnQsIG5vIG1hdHRlciBob3cgbG9uZyBhZ28gaXQgb2NjdXJlZC5cbiAgICovXG4gIEVWRU5UVUFMXG59XG5cbi8qKiBJbmplY3RhYmxlIHNlcnZpY2UtbGV2ZWwgb3B0aW9ucyBmb3IgRm9jdXNNb25pdG9yLiAqL1xuZXhwb3J0IGludGVyZmFjZSBGb2N1c01vbml0b3JPcHRpb25zIHtcbiAgZGV0ZWN0aW9uTW9kZT86IEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGU7XG59XG5cbi8qKiBJbmplY3Rpb25Ub2tlbiBmb3IgRm9jdXNNb25pdG9yT3B0aW9ucy4gKi9cbmV4cG9ydCBjb25zdCBGT0NVU19NT05JVE9SX0RFRkFVTFRfT1BUSU9OUyA9XG4gICAgbmV3IEluamVjdGlvblRva2VuPEZvY3VzTW9uaXRvck9wdGlvbnM+KCdjZGstZm9jdXMtbW9uaXRvci1kZWZhdWx0LW9wdGlvbnMnKTtcblxudHlwZSBNb25pdG9yZWRFbGVtZW50SW5mbyA9IHtcbiAgdW5saXN0ZW46IEZ1bmN0aW9uLFxuICBjaGVja0NoaWxkcmVuOiBib29sZWFuLFxuICBzdWJqZWN0OiBTdWJqZWN0PEZvY3VzT3JpZ2luPlxufTtcblxuLyoqXG4gKiBFdmVudCBsaXN0ZW5lciBvcHRpb25zIHRoYXQgZW5hYmxlIGNhcHR1cmluZyBhbmQgYWxzb1xuICogbWFyayB0aGUgbGlzdGVuZXIgYXMgcGFzc2l2ZSBpZiB0aGUgYnJvd3NlciBzdXBwb3J0cyBpdC5cbiAqL1xuY29uc3QgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zID0gbm9ybWFsaXplUGFzc2l2ZUxpc3RlbmVyT3B0aW9ucyh7XG4gIHBhc3NpdmU6IHRydWUsXG4gIGNhcHR1cmU6IHRydWVcbn0pO1xuXG5cbi8qKiBNb25pdG9ycyBtb3VzZSBhbmQga2V5Ym9hcmQgZXZlbnRzIHRvIGRldGVybWluZSB0aGUgY2F1c2Ugb2YgZm9jdXMgZXZlbnRzLiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgRm9jdXNNb25pdG9yIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIFRoZSBmb2N1cyBvcmlnaW4gdGhhdCB0aGUgbmV4dCBmb2N1cyBldmVudCBpcyBhIHJlc3VsdCBvZi4gKi9cbiAgcHJpdmF0ZSBfb3JpZ2luOiBGb2N1c09yaWdpbiA9IG51bGw7XG5cbiAgLyoqIFRoZSBGb2N1c09yaWdpbiBvZiB0aGUgbGFzdCBmb2N1cyBldmVudCB0cmFja2VkIGJ5IHRoZSBGb2N1c01vbml0b3IuICovXG4gIHByaXZhdGUgX2xhc3RGb2N1c09yaWdpbjogRm9jdXNPcmlnaW47XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHdpbmRvdyBoYXMganVzdCBiZWVuIGZvY3VzZWQuICovXG4gIHByaXZhdGUgX3dpbmRvd0ZvY3VzZWQgPSBmYWxzZTtcblxuICAvKiogVGhlIHRhcmdldCBvZiB0aGUgbGFzdCB0b3VjaCBldmVudC4gKi9cbiAgcHJpdmF0ZSBfbGFzdFRvdWNoVGFyZ2V0OiBFdmVudFRhcmdldCB8IG51bGw7XG5cbiAgLyoqIFRoZSB0aW1lb3V0IGlkIG9mIHRoZSB0b3VjaCB0aW1lb3V0LCB1c2VkIHRvIGNhbmNlbCB0aW1lb3V0IGxhdGVyLiAqL1xuICBwcml2YXRlIF90b3VjaFRpbWVvdXRJZDogbnVtYmVyO1xuXG4gIC8qKiBUaGUgdGltZW91dCBpZCBvZiB0aGUgd2luZG93IGZvY3VzIHRpbWVvdXQuICovXG4gIHByaXZhdGUgX3dpbmRvd0ZvY3VzVGltZW91dElkOiBudW1iZXI7XG5cbiAgLyoqIFRoZSB0aW1lb3V0IGlkIG9mIHRoZSBvcmlnaW4gY2xlYXJpbmcgdGltZW91dC4gKi9cbiAgcHJpdmF0ZSBfb3JpZ2luVGltZW91dElkOiBudW1iZXI7XG5cbiAgLyoqIE1hcCBvZiBlbGVtZW50cyBiZWluZyBtb25pdG9yZWQgdG8gdGhlaXIgaW5mby4gKi9cbiAgcHJpdmF0ZSBfZWxlbWVudEluZm8gPSBuZXcgTWFwPEhUTUxFbGVtZW50LCBNb25pdG9yZWRFbGVtZW50SW5mbz4oKTtcblxuICAvKiogVGhlIG51bWJlciBvZiBlbGVtZW50cyBjdXJyZW50bHkgYmVpbmcgbW9uaXRvcmVkLiAqL1xuICBwcml2YXRlIF9tb25pdG9yZWRFbGVtZW50Q291bnQgPSAwO1xuXG4gIC8qKlxuICAgKiBUaGUgc3BlY2lmaWVkIGRldGVjdGlvbiBtb2RlLCB1c2VkIGZvciBhdHRyaWJ1dGluZyB0aGUgb3JpZ2luIG9mIGEgZm9jdXNcbiAgICogZXZlbnQuXG4gICAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9kZXRlY3Rpb25Nb2RlOiBGb2N1c01vbml0b3JEZXRlY3Rpb25Nb2RlO1xuXG4gIC8qKlxuICAgKiBFdmVudCBsaXN0ZW5lciBmb3IgYGtleWRvd25gIGV2ZW50cyBvbiB0aGUgZG9jdW1lbnQuXG4gICAqIE5lZWRzIHRvIGJlIGFuIGFycm93IGZ1bmN0aW9uIGluIG9yZGVyIHRvIHByZXNlcnZlIHRoZSBjb250ZXh0IHdoZW4gaXQgZ2V0cyBib3VuZC5cbiAgICovXG4gIHByaXZhdGUgX2RvY3VtZW50S2V5ZG93bkxpc3RlbmVyID0gKCkgPT4ge1xuICAgIC8vIE9uIGtleWRvd24gcmVjb3JkIHRoZSBvcmlnaW4gYW5kIGNsZWFyIGFueSB0b3VjaCBldmVudCB0aGF0IG1heSBiZSBpbiBwcm9ncmVzcy5cbiAgICB0aGlzLl9sYXN0VG91Y2hUYXJnZXQgPSBudWxsO1xuICAgIHRoaXMuX3NldE9yaWdpbkZvckN1cnJlbnRFdmVudFF1ZXVlKCdrZXlib2FyZCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV2ZW50IGxpc3RlbmVyIGZvciBgbW91c2Vkb3duYCBldmVudHMgb24gdGhlIGRvY3VtZW50LlxuICAgKiBOZWVkcyB0byBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0IGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF9kb2N1bWVudE1vdXNlZG93bkxpc3RlbmVyID0gKCkgPT4ge1xuICAgIC8vIE9uIG1vdXNlZG93biByZWNvcmQgdGhlIG9yaWdpbiBvbmx5IGlmIHRoZXJlIGlzIG5vdCB0b3VjaFxuICAgIC8vIHRhcmdldCwgc2luY2UgYSBtb3VzZWRvd24gY2FuIGhhcHBlbiBhcyBhIHJlc3VsdCBvZiBhIHRvdWNoIGV2ZW50LlxuICAgIGlmICghdGhpcy5fbGFzdFRvdWNoVGFyZ2V0KSB7XG4gICAgICB0aGlzLl9zZXRPcmlnaW5Gb3JDdXJyZW50RXZlbnRRdWV1ZSgnbW91c2UnKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRXZlbnQgbGlzdGVuZXIgZm9yIGB0b3VjaHN0YXJ0YCBldmVudHMgb24gdGhlIGRvY3VtZW50LlxuICAgKiBOZWVkcyB0byBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0IGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF9kb2N1bWVudFRvdWNoc3RhcnRMaXN0ZW5lciA9IChldmVudDogVG91Y2hFdmVudCkgPT4ge1xuICAgIC8vIFdoZW4gdGhlIHRvdWNoc3RhcnQgZXZlbnQgZmlyZXMgdGhlIGZvY3VzIGV2ZW50IGlzIG5vdCB5ZXQgaW4gdGhlIGV2ZW50IHF1ZXVlLiBUaGlzIG1lYW5zXG4gICAgLy8gd2UgY2FuJ3QgcmVseSBvbiB0aGUgdHJpY2sgdXNlZCBhYm92ZSAoc2V0dGluZyB0aW1lb3V0IG9mIDFtcykuIEluc3RlYWQgd2Ugd2FpdCA2NTBtcyB0b1xuICAgIC8vIHNlZSBpZiBhIGZvY3VzIGhhcHBlbnMuXG4gICAgaWYgKHRoaXMuX3RvdWNoVGltZW91dElkICE9IG51bGwpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl90b3VjaFRpbWVvdXRJZCk7XG4gICAgfVxuXG4gICAgLy8gU2luY2UgdGhpcyBsaXN0ZW5lciBpcyBib3VuZCBvbiB0aGUgYGRvY3VtZW50YCBsZXZlbCwgYW55IGV2ZW50cyBjb21pbmcgZnJvbSB0aGUgc2hhZG93IERPTVxuICAgIC8vIHdpbGwgaGF2ZSB0aGVpciBgdGFyZ2V0YCBzZXQgdG8gdGhlIHNoYWRvdyByb290LiBJZiBhdmFpbGFibGUsIHVzZSBgY29tcG9zZWRQYXRoYCB0b1xuICAgIC8vIGZpZ3VyZSBvdXQgdGhlIGV2ZW50IHRhcmdldC5cbiAgICB0aGlzLl9sYXN0VG91Y2hUYXJnZXQgPSBldmVudC5jb21wb3NlZFBhdGggPyBldmVudC5jb21wb3NlZFBhdGgoKVswXSA6IGV2ZW50LnRhcmdldDtcbiAgICB0aGlzLl90b3VjaFRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fbGFzdFRvdWNoVGFyZ2V0ID0gbnVsbCwgVE9VQ0hfQlVGRkVSX01TKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFdmVudCBsaXN0ZW5lciBmb3IgYGZvY3VzYCBldmVudHMgb24gdGhlIHdpbmRvdy5cbiAgICogTmVlZHMgdG8gYmUgYW4gYXJyb3cgZnVuY3Rpb24gaW4gb3JkZXIgdG8gcHJlc2VydmUgdGhlIGNvbnRleHQgd2hlbiBpdCBnZXRzIGJvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfd2luZG93Rm9jdXNMaXN0ZW5lciA9ICgpID0+IHtcbiAgICAvLyBNYWtlIGEgbm90ZSBvZiB3aGVuIHRoZSB3aW5kb3cgcmVnYWlucyBmb2N1cywgc28gd2UgY2FuXG4gICAgLy8gcmVzdG9yZSB0aGUgb3JpZ2luIGluZm8gZm9yIHRoZSBmb2N1c2VkIGVsZW1lbnQuXG4gICAgdGhpcy5fd2luZG93Rm9jdXNlZCA9IHRydWU7XG4gICAgdGhpcy5fd2luZG93Rm9jdXNUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX3dpbmRvd0ZvY3VzZWQgPSBmYWxzZSk7XG4gIH1cblxuICAvKiogVXNlZCB0byByZWZlcmVuY2UgY29ycmVjdCBkb2N1bWVudC93aW5kb3cgKi9cbiAgcHJvdGVjdGVkIF9kb2N1bWVudD86IERvY3VtZW50O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgICBwcml2YXRlIF9wbGF0Zm9ybTogUGxhdGZvcm0sXG4gICAgICAvKiogQGJyZWFraW5nLWNoYW5nZSAxMS4wLjAgbWFrZSBkb2N1bWVudCByZXF1aXJlZCAqL1xuICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChET0NVTUVOVCkgZG9jdW1lbnQ6IGFueXxudWxsLFxuICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChGT0NVU19NT05JVE9SX0RFRkFVTFRfT1BUSU9OUykgb3B0aW9uczpcbiAgICAgICAgICBGb2N1c01vbml0b3JPcHRpb25zfG51bGwpIHtcbiAgICB0aGlzLl9kb2N1bWVudCA9IGRvY3VtZW50O1xuICAgIHRoaXMuX2RldGVjdGlvbk1vZGUgPSBvcHRpb25zPy5kZXRlY3Rpb25Nb2RlIHx8IEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGUuSU1NRURJQVRFO1xuICB9XG5cbiAgLyoqXG4gICAqIE1vbml0b3JzIGZvY3VzIG9uIGFuIGVsZW1lbnQgYW5kIGFwcGxpZXMgYXBwcm9wcmlhdGUgQ1NTIGNsYXNzZXMuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIG1vbml0b3JcbiAgICogQHBhcmFtIGNoZWNrQ2hpbGRyZW4gV2hldGhlciB0byBjb3VudCB0aGUgZWxlbWVudCBhcyBmb2N1c2VkIHdoZW4gaXRzIGNoaWxkcmVuIGFyZSBmb2N1c2VkLlxuICAgKiBAcmV0dXJucyBBbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgd2hlbiB0aGUgZm9jdXMgc3RhdGUgb2YgdGhlIGVsZW1lbnQgY2hhbmdlcy5cbiAgICogICAgIFdoZW4gdGhlIGVsZW1lbnQgaXMgYmx1cnJlZCwgbnVsbCB3aWxsIGJlIGVtaXR0ZWQuXG4gICAqL1xuICBtb25pdG9yKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBjaGVja0NoaWxkcmVuPzogYm9vbGVhbik6IE9ic2VydmFibGU8Rm9jdXNPcmlnaW4+O1xuXG4gIC8qKlxuICAgKiBNb25pdG9ycyBmb2N1cyBvbiBhbiBlbGVtZW50IGFuZCBhcHBsaWVzIGFwcHJvcHJpYXRlIENTUyBjbGFzc2VzLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBtb25pdG9yXG4gICAqIEBwYXJhbSBjaGVja0NoaWxkcmVuIFdoZXRoZXIgdG8gY291bnQgdGhlIGVsZW1lbnQgYXMgZm9jdXNlZCB3aGVuIGl0cyBjaGlsZHJlbiBhcmUgZm9jdXNlZC5cbiAgICogQHJldHVybnMgQW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHdoZW4gdGhlIGZvY3VzIHN0YXRlIG9mIHRoZSBlbGVtZW50IGNoYW5nZXMuXG4gICAqICAgICBXaGVuIHRoZSBlbGVtZW50IGlzIGJsdXJyZWQsIG51bGwgd2lsbCBiZSBlbWl0dGVkLlxuICAgKi9cbiAgbW9uaXRvcihlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiwgY2hlY2tDaGlsZHJlbj86IGJvb2xlYW4pOiBPYnNlcnZhYmxlPEZvY3VzT3JpZ2luPjtcblxuICBtb25pdG9yKGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgICAgICAgY2hlY2tDaGlsZHJlbjogYm9vbGVhbiA9IGZhbHNlKTogT2JzZXJ2YWJsZTxGb2N1c09yaWdpbj4ge1xuICAgIC8vIERvIG5vdGhpbmcgaWYgd2UncmUgbm90IG9uIHRoZSBicm93c2VyIHBsYXRmb3JtLlxuICAgIGlmICghdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKG51bGwpO1xuICAgIH1cblxuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnQpO1xuXG4gICAgLy8gQ2hlY2sgaWYgd2UncmUgYWxyZWFkeSBtb25pdG9yaW5nIHRoaXMgZWxlbWVudC5cbiAgICBpZiAodGhpcy5fZWxlbWVudEluZm8uaGFzKG5hdGl2ZUVsZW1lbnQpKSB7XG4gICAgICBsZXQgY2FjaGVkSW5mbyA9IHRoaXMuX2VsZW1lbnRJbmZvLmdldChuYXRpdmVFbGVtZW50KTtcbiAgICAgIGNhY2hlZEluZm8hLmNoZWNrQ2hpbGRyZW4gPSBjaGVja0NoaWxkcmVuO1xuICAgICAgcmV0dXJuIGNhY2hlZEluZm8hLnN1YmplY3QuYXNPYnNlcnZhYmxlKCk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIG1vbml0b3JlZCBlbGVtZW50IGluZm8uXG4gICAgbGV0IGluZm86IE1vbml0b3JlZEVsZW1lbnRJbmZvID0ge1xuICAgICAgdW5saXN0ZW46ICgpID0+IHt9LFxuICAgICAgY2hlY2tDaGlsZHJlbjogY2hlY2tDaGlsZHJlbixcbiAgICAgIHN1YmplY3Q6IG5ldyBTdWJqZWN0PEZvY3VzT3JpZ2luPigpXG4gICAgfTtcbiAgICB0aGlzLl9lbGVtZW50SW5mby5zZXQobmF0aXZlRWxlbWVudCwgaW5mbyk7XG4gICAgdGhpcy5faW5jcmVtZW50TW9uaXRvcmVkRWxlbWVudENvdW50KCk7XG5cbiAgICAvLyBTdGFydCBsaXN0ZW5pbmcuIFdlIG5lZWQgdG8gbGlzdGVuIGluIGNhcHR1cmUgcGhhc2Ugc2luY2UgZm9jdXMgZXZlbnRzIGRvbid0IGJ1YmJsZS5cbiAgICBsZXQgZm9jdXNMaXN0ZW5lciA9IChldmVudDogRm9jdXNFdmVudCkgPT4gdGhpcy5fb25Gb2N1cyhldmVudCwgbmF0aXZlRWxlbWVudCk7XG4gICAgbGV0IGJsdXJMaXN0ZW5lciA9IChldmVudDogRm9jdXNFdmVudCkgPT4gdGhpcy5fb25CbHVyKGV2ZW50LCBuYXRpdmVFbGVtZW50KTtcbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgbmF0aXZlRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIGZvY3VzTGlzdGVuZXIsIHRydWUpO1xuICAgICAgbmF0aXZlRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgYmx1ckxpc3RlbmVyLCB0cnVlKTtcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBhbiB1bmxpc3RlbiBmdW5jdGlvbiBmb3IgbGF0ZXIuXG4gICAgaW5mby51bmxpc3RlbiA9ICgpID0+IHtcbiAgICAgIG5hdGl2ZUVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignZm9jdXMnLCBmb2N1c0xpc3RlbmVyLCB0cnVlKTtcbiAgICAgIG5hdGl2ZUVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignYmx1cicsIGJsdXJMaXN0ZW5lciwgdHJ1ZSk7XG4gICAgfTtcblxuICAgIHJldHVybiBpbmZvLnN1YmplY3QuYXNPYnNlcnZhYmxlKCk7XG4gIH1cblxuICAvKipcbiAgICogU3RvcHMgbW9uaXRvcmluZyBhbiBlbGVtZW50IGFuZCByZW1vdmVzIGFsbCBmb2N1cyBjbGFzc2VzLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBzdG9wIG1vbml0b3JpbmcuXG4gICAqL1xuICBzdG9wTW9uaXRvcmluZyhlbGVtZW50OiBIVE1MRWxlbWVudCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFN0b3BzIG1vbml0b3JpbmcgYW4gZWxlbWVudCBhbmQgcmVtb3ZlcyBhbGwgZm9jdXMgY2xhc3Nlcy5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gc3RvcCBtb25pdG9yaW5nLlxuICAgKi9cbiAgc3RvcE1vbml0b3JpbmcoZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4pOiB2b2lkO1xuXG4gIHN0b3BNb25pdG9yaW5nKGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4pOiB2b2lkIHtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gY29lcmNlRWxlbWVudChlbGVtZW50KTtcbiAgICBjb25zdCBlbGVtZW50SW5mbyA9IHRoaXMuX2VsZW1lbnRJbmZvLmdldChuYXRpdmVFbGVtZW50KTtcblxuICAgIGlmIChlbGVtZW50SW5mbykge1xuICAgICAgZWxlbWVudEluZm8udW5saXN0ZW4oKTtcbiAgICAgIGVsZW1lbnRJbmZvLnN1YmplY3QuY29tcGxldGUoKTtcblxuICAgICAgdGhpcy5fc2V0Q2xhc3NlcyhuYXRpdmVFbGVtZW50KTtcbiAgICAgIHRoaXMuX2VsZW1lbnRJbmZvLmRlbGV0ZShuYXRpdmVFbGVtZW50KTtcbiAgICAgIHRoaXMuX2RlY3JlbWVudE1vbml0b3JlZEVsZW1lbnRDb3VudCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGb2N1c2VzIHRoZSBlbGVtZW50IHZpYSB0aGUgc3BlY2lmaWVkIGZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCB0byBmb2N1cy5cbiAgICogQHBhcmFtIG9yaWdpbiBGb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCB0byBjb25maWd1cmUgdGhlIGZvY3VzIGJlaGF2aW9yLlxuICAgKi9cbiAgZm9jdXNWaWEoZWxlbWVudDogSFRNTEVsZW1lbnQsIG9yaWdpbjogRm9jdXNPcmlnaW4sIG9wdGlvbnM/OiBGb2N1c09wdGlvbnMpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBGb2N1c2VzIHRoZSBlbGVtZW50IHZpYSB0aGUgc3BlY2lmaWVkIGZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCB0byBmb2N1cy5cbiAgICogQHBhcmFtIG9yaWdpbiBGb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCB0byBjb25maWd1cmUgdGhlIGZvY3VzIGJlaGF2aW9yLlxuICAgKi9cbiAgZm9jdXNWaWEoZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sIG9yaWdpbjogRm9jdXNPcmlnaW4sIG9wdGlvbnM/OiBGb2N1c09wdGlvbnMpOiB2b2lkO1xuXG4gIGZvY3VzVmlhKGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgICAgICAgb3JpZ2luOiBGb2N1c09yaWdpbixcbiAgICAgICAgICBvcHRpb25zPzogRm9jdXNPcHRpb25zKTogdm9pZCB7XG5cbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gY29lcmNlRWxlbWVudChlbGVtZW50KTtcblxuICAgIHRoaXMuX3NldE9yaWdpbkZvckN1cnJlbnRFdmVudFF1ZXVlKG9yaWdpbik7XG5cbiAgICAvLyBgZm9jdXNgIGlzbid0IGF2YWlsYWJsZSBvbiB0aGUgc2VydmVyXG4gICAgaWYgKHR5cGVvZiBuYXRpdmVFbGVtZW50LmZvY3VzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyBDYXN0IHRoZSBlbGVtZW50IHRvIGBhbnlgLCBiZWNhdXNlIHRoZSBUUyB0eXBpbmdzIGRvbid0IGhhdmUgdGhlIGBvcHRpb25zYCBwYXJhbWV0ZXIgeWV0LlxuICAgICAgKG5hdGl2ZUVsZW1lbnQgYXMgYW55KS5mb2N1cyhvcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9lbGVtZW50SW5mby5mb3JFYWNoKChfaW5mbywgZWxlbWVudCkgPT4gdGhpcy5zdG9wTW9uaXRvcmluZyhlbGVtZW50KSk7XG4gIH1cblxuICAvKiogQWNjZXNzIGluamVjdGVkIGRvY3VtZW50IGlmIGF2YWlsYWJsZSBvciBmYWxsYmFjayB0byBnbG9iYWwgZG9jdW1lbnQgcmVmZXJlbmNlICovXG4gIHByaXZhdGUgX2dldERvY3VtZW50KCk6IERvY3VtZW50IHtcbiAgICByZXR1cm4gdGhpcy5fZG9jdW1lbnQgfHwgZG9jdW1lbnQ7XG4gIH1cblxuICAvKiogVXNlIGRlZmF1bHRWaWV3IG9mIGluamVjdGVkIGRvY3VtZW50IGlmIGF2YWlsYWJsZSBvciBmYWxsYmFjayB0byBnbG9iYWwgd2luZG93IHJlZmVyZW5jZSAqL1xuICBwcml2YXRlIF9nZXRXaW5kb3coKTogV2luZG93IHtcbiAgICBjb25zdCBkb2MgPSB0aGlzLl9nZXREb2N1bWVudCgpO1xuICAgIHJldHVybiBkb2MuZGVmYXVsdFZpZXcgfHwgd2luZG93O1xuICB9XG5cbiAgcHJpdmF0ZSBfdG9nZ2xlQ2xhc3MoZWxlbWVudDogRWxlbWVudCwgY2xhc3NOYW1lOiBzdHJpbmcsIHNob3VsZFNldDogYm9vbGVhbikge1xuICAgIGlmIChzaG91bGRTZXQpIHtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZm9jdXMgY2xhc3NlcyBvbiB0aGUgZWxlbWVudCBiYXNlZCBvbiB0aGUgZ2l2ZW4gZm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byB1cGRhdGUgdGhlIGNsYXNzZXMgb24uXG4gICAqIEBwYXJhbSBvcmlnaW4gVGhlIGZvY3VzIG9yaWdpbi5cbiAgICovXG4gIHByaXZhdGUgX3NldENsYXNzZXMoZWxlbWVudDogSFRNTEVsZW1lbnQsIG9yaWdpbj86IEZvY3VzT3JpZ2luKTogdm9pZCB7XG4gICAgY29uc3QgZWxlbWVudEluZm8gPSB0aGlzLl9lbGVtZW50SW5mby5nZXQoZWxlbWVudCk7XG5cbiAgICBpZiAoZWxlbWVudEluZm8pIHtcbiAgICAgIHRoaXMuX3RvZ2dsZUNsYXNzKGVsZW1lbnQsICdjZGstZm9jdXNlZCcsICEhb3JpZ2luKTtcbiAgICAgIHRoaXMuX3RvZ2dsZUNsYXNzKGVsZW1lbnQsICdjZGstdG91Y2gtZm9jdXNlZCcsIG9yaWdpbiA9PT0gJ3RvdWNoJyk7XG4gICAgICB0aGlzLl90b2dnbGVDbGFzcyhlbGVtZW50LCAnY2RrLWtleWJvYXJkLWZvY3VzZWQnLCBvcmlnaW4gPT09ICdrZXlib2FyZCcpO1xuICAgICAgdGhpcy5fdG9nZ2xlQ2xhc3MoZWxlbWVudCwgJ2Nkay1tb3VzZS1mb2N1c2VkJywgb3JpZ2luID09PSAnbW91c2UnKTtcbiAgICAgIHRoaXMuX3RvZ2dsZUNsYXNzKGVsZW1lbnQsICdjZGstcHJvZ3JhbS1mb2N1c2VkJywgb3JpZ2luID09PSAncHJvZ3JhbScpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBvcmlnaW4gYW5kIHNjaGVkdWxlcyBhbiBhc3luYyBmdW5jdGlvbiB0byBjbGVhciBpdCBhdCB0aGUgZW5kIG9mIHRoZSBldmVudCBxdWV1ZS5cbiAgICogSWYgdGhlIGRldGVjdGlvbiBtb2RlIGlzICdldmVudHVhbCcsIHRoZSBvcmlnaW4gaXMgbmV2ZXIgY2xlYXJlZC5cbiAgICogQHBhcmFtIG9yaWdpbiBUaGUgb3JpZ2luIHRvIHNldC5cbiAgICovXG4gIHByaXZhdGUgX3NldE9yaWdpbkZvckN1cnJlbnRFdmVudFF1ZXVlKG9yaWdpbjogRm9jdXNPcmlnaW4pOiB2b2lkIHtcbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgdGhpcy5fb3JpZ2luID0gb3JpZ2luO1xuXG4gICAgICBpZiAodGhpcy5fZGV0ZWN0aW9uTW9kZSA9PT0gRm9jdXNNb25pdG9yRGV0ZWN0aW9uTW9kZS5JTU1FRElBVEUpIHtcbiAgICAgICAgLy8gU29tZXRpbWVzIHRoZSBmb2N1cyBvcmlnaW4gd29uJ3QgYmUgdmFsaWQgaW4gRmlyZWZveCBiZWNhdXNlIEZpcmVmb3ggc2VlbXMgdG8gZm9jdXMgKm9uZSpcbiAgICAgICAgLy8gdGljayBhZnRlciB0aGUgaW50ZXJhY3Rpb24gZXZlbnQgZmlyZWQuIFRvIGVuc3VyZSB0aGUgZm9jdXMgb3JpZ2luIGlzIGFsd2F5cyBjb3JyZWN0LFxuICAgICAgICAvLyB0aGUgZm9jdXMgb3JpZ2luIHdpbGwgYmUgZGV0ZXJtaW5lZCBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBuZXh0IHRpY2suXG4gICAgICAgIHRoaXMuX29yaWdpblRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fb3JpZ2luID0gbnVsbCwgMSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGdpdmVuIGZvY3VzIGV2ZW50IHdhcyBjYXVzZWQgYnkgYSB0b3VjaHN0YXJ0IGV2ZW50LlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIGZvY3VzIGV2ZW50IHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyBXaGV0aGVyIHRoZSBldmVudCB3YXMgY2F1c2VkIGJ5IGEgdG91Y2guXG4gICAqL1xuICBwcml2YXRlIF93YXNDYXVzZWRCeVRvdWNoKGV2ZW50OiBGb2N1c0V2ZW50KTogYm9vbGVhbiB7XG4gICAgLy8gTm90ZShtbWFsZXJiYSk6IFRoaXMgaW1wbGVtZW50YXRpb24gaXMgbm90IHF1aXRlIHBlcmZlY3QsIHRoZXJlIGlzIGEgc21hbGwgZWRnZSBjYXNlLlxuICAgIC8vIENvbnNpZGVyIHRoZSBmb2xsb3dpbmcgZG9tIHN0cnVjdHVyZTpcbiAgICAvL1xuICAgIC8vIDxkaXYgI3BhcmVudCB0YWJpbmRleD1cIjBcIiBjZGtGb2N1c0NsYXNzZXM+XG4gICAgLy8gICA8ZGl2ICNjaGlsZCAoY2xpY2spPVwiI3BhcmVudC5mb2N1cygpXCI+PC9kaXY+XG4gICAgLy8gPC9kaXY+XG4gICAgLy9cbiAgICAvLyBJZiB0aGUgdXNlciB0b3VjaGVzIHRoZSAjY2hpbGQgZWxlbWVudCBhbmQgdGhlICNwYXJlbnQgaXMgcHJvZ3JhbW1hdGljYWxseSBmb2N1c2VkIGFzIGFcbiAgICAvLyByZXN1bHQsIHRoaXMgY29kZSB3aWxsIHN0aWxsIGNvbnNpZGVyIGl0IHRvIGhhdmUgYmVlbiBjYXVzZWQgYnkgdGhlIHRvdWNoIGV2ZW50IGFuZCB3aWxsXG4gICAgLy8gYXBwbHkgdGhlIGNkay10b3VjaC1mb2N1c2VkIGNsYXNzIHJhdGhlciB0aGFuIHRoZSBjZGstcHJvZ3JhbS1mb2N1c2VkIGNsYXNzLiBUaGlzIGlzIGFcbiAgICAvLyByZWxhdGl2ZWx5IHNtYWxsIGVkZ2UtY2FzZSB0aGF0IGNhbiBiZSB3b3JrZWQgYXJvdW5kIGJ5IHVzaW5nXG4gICAgLy8gZm9jdXNWaWEocGFyZW50RWwsICdwcm9ncmFtJykgdG8gZm9jdXMgdGhlIHBhcmVudCBlbGVtZW50LlxuICAgIC8vXG4gICAgLy8gSWYgd2UgZGVjaWRlIHRoYXQgd2UgYWJzb2x1dGVseSBtdXN0IGhhbmRsZSB0aGlzIGNhc2UgY29ycmVjdGx5LCB3ZSBjYW4gZG8gc28gYnkgbGlzdGVuaW5nXG4gICAgLy8gZm9yIHRoZSBmaXJzdCBmb2N1cyBldmVudCBhZnRlciB0aGUgdG91Y2hzdGFydCwgYW5kIHRoZW4gdGhlIGZpcnN0IGJsdXIgZXZlbnQgYWZ0ZXIgdGhhdFxuICAgIC8vIGZvY3VzIGV2ZW50LiBXaGVuIHRoYXQgYmx1ciBldmVudCBmaXJlcyB3ZSBrbm93IHRoYXQgd2hhdGV2ZXIgZm9sbG93cyBpcyBub3QgYSByZXN1bHQgb2YgdGhlXG4gICAgLy8gdG91Y2hzdGFydC5cbiAgICBsZXQgZm9jdXNUYXJnZXQgPSBldmVudC50YXJnZXQ7XG4gICAgcmV0dXJuIHRoaXMuX2xhc3RUb3VjaFRhcmdldCBpbnN0YW5jZW9mIE5vZGUgJiYgZm9jdXNUYXJnZXQgaW5zdGFuY2VvZiBOb2RlICYmXG4gICAgICAgIChmb2N1c1RhcmdldCA9PT0gdGhpcy5fbGFzdFRvdWNoVGFyZ2V0IHx8IGZvY3VzVGFyZ2V0LmNvbnRhaW5zKHRoaXMuX2xhc3RUb3VjaFRhcmdldCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgZm9jdXMgZXZlbnRzIG9uIGEgcmVnaXN0ZXJlZCBlbGVtZW50LlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIGZvY3VzIGV2ZW50LlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgbW9uaXRvcmVkIGVsZW1lbnQuXG4gICAqL1xuICBwcml2YXRlIF9vbkZvY3VzKGV2ZW50OiBGb2N1c0V2ZW50LCBlbGVtZW50OiBIVE1MRWxlbWVudCkge1xuICAgIC8vIE5PVEUobW1hbGVyYmEpOiBXZSBjdXJyZW50bHkgc2V0IHRoZSBjbGFzc2VzIGJhc2VkIG9uIHRoZSBmb2N1cyBvcmlnaW4gb2YgdGhlIG1vc3QgcmVjZW50XG4gICAgLy8gZm9jdXMgZXZlbnQgYWZmZWN0aW5nIHRoZSBtb25pdG9yZWQgZWxlbWVudC4gSWYgd2Ugd2FudCB0byB1c2UgdGhlIG9yaWdpbiBvZiB0aGUgZmlyc3QgZXZlbnRcbiAgICAvLyBpbnN0ZWFkIHdlIHNob3VsZCBjaGVjayBmb3IgdGhlIGNkay1mb2N1c2VkIGNsYXNzIGhlcmUgYW5kIHJldHVybiBpZiB0aGUgZWxlbWVudCBhbHJlYWR5IGhhc1xuICAgIC8vIGl0LiAoVGhpcyBvbmx5IG1hdHRlcnMgZm9yIGVsZW1lbnRzIHRoYXQgaGF2ZSBpbmNsdWRlc0NoaWxkcmVuID0gdHJ1ZSkuXG5cbiAgICAvLyBJZiB3ZSBhcmUgbm90IGNvdW50aW5nIGNoaWxkLWVsZW1lbnQtZm9jdXMgYXMgZm9jdXNlZCwgbWFrZSBzdXJlIHRoYXQgdGhlIGV2ZW50IHRhcmdldCBpcyB0aGVcbiAgICAvLyBtb25pdG9yZWQgZWxlbWVudCBpdHNlbGYuXG4gICAgY29uc3QgZWxlbWVudEluZm8gPSB0aGlzLl9lbGVtZW50SW5mby5nZXQoZWxlbWVudCk7XG4gICAgaWYgKCFlbGVtZW50SW5mbyB8fCAoIWVsZW1lbnRJbmZvLmNoZWNrQ2hpbGRyZW4gJiYgZWxlbWVudCAhPT0gZXZlbnQudGFyZ2V0KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIElmIHdlIGNvdWxkbid0IGRldGVjdCBhIGNhdXNlIGZvciB0aGUgZm9jdXMgZXZlbnQsIGl0J3MgZHVlIHRvIG9uZSBvZiB0aHJlZSByZWFzb25zOlxuICAgIC8vIDEpIFRoZSB3aW5kb3cgaGFzIGp1c3QgcmVnYWluZWQgZm9jdXMsIGluIHdoaWNoIGNhc2Ugd2Ugd2FudCB0byByZXN0b3JlIHRoZSBmb2N1c2VkIHN0YXRlIG9mXG4gICAgLy8gICAgdGhlIGVsZW1lbnQgZnJvbSBiZWZvcmUgdGhlIHdpbmRvdyBibHVycmVkLlxuICAgIC8vIDIpIEl0IHdhcyBjYXVzZWQgYnkgYSB0b3VjaCBldmVudCwgaW4gd2hpY2ggY2FzZSB3ZSBtYXJrIHRoZSBvcmlnaW4gYXMgJ3RvdWNoJy5cbiAgICAvLyAzKSBUaGUgZWxlbWVudCB3YXMgcHJvZ3JhbW1hdGljYWxseSBmb2N1c2VkLCBpbiB3aGljaCBjYXNlIHdlIHNob3VsZCBtYXJrIHRoZSBvcmlnaW4gYXNcbiAgICAvLyAgICAncHJvZ3JhbScuXG4gICAgbGV0IG9yaWdpbiA9IHRoaXMuX29yaWdpbjtcbiAgICBpZiAoIW9yaWdpbikge1xuICAgICAgaWYgKHRoaXMuX3dpbmRvd0ZvY3VzZWQgJiYgdGhpcy5fbGFzdEZvY3VzT3JpZ2luKSB7XG4gICAgICAgIG9yaWdpbiA9IHRoaXMuX2xhc3RGb2N1c09yaWdpbjtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fd2FzQ2F1c2VkQnlUb3VjaChldmVudCkpIHtcbiAgICAgICAgb3JpZ2luID0gJ3RvdWNoJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9yaWdpbiA9ICdwcm9ncmFtJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9zZXRDbGFzc2VzKGVsZW1lbnQsIG9yaWdpbik7XG4gICAgdGhpcy5fZW1pdE9yaWdpbihlbGVtZW50SW5mby5zdWJqZWN0LCBvcmlnaW4pO1xuICAgIHRoaXMuX2xhc3RGb2N1c09yaWdpbiA9IG9yaWdpbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIGJsdXIgZXZlbnRzIG9uIGEgcmVnaXN0ZXJlZCBlbGVtZW50LlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIGJsdXIgZXZlbnQuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBtb25pdG9yZWQgZWxlbWVudC5cbiAgICovXG4gIF9vbkJsdXIoZXZlbnQ6IEZvY3VzRXZlbnQsIGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgLy8gSWYgd2UgYXJlIGNvdW50aW5nIGNoaWxkLWVsZW1lbnQtZm9jdXMgYXMgZm9jdXNlZCwgbWFrZSBzdXJlIHRoYXQgd2UgYXJlbid0IGp1c3QgYmx1cnJpbmcgaW5cbiAgICAvLyBvcmRlciB0byBmb2N1cyBhbm90aGVyIGNoaWxkIG9mIHRoZSBtb25pdG9yZWQgZWxlbWVudC5cbiAgICBjb25zdCBlbGVtZW50SW5mbyA9IHRoaXMuX2VsZW1lbnRJbmZvLmdldChlbGVtZW50KTtcblxuICAgIGlmICghZWxlbWVudEluZm8gfHwgKGVsZW1lbnRJbmZvLmNoZWNrQ2hpbGRyZW4gJiYgZXZlbnQucmVsYXRlZFRhcmdldCBpbnN0YW5jZW9mIE5vZGUgJiZcbiAgICAgICAgZWxlbWVudC5jb250YWlucyhldmVudC5yZWxhdGVkVGFyZ2V0KSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9zZXRDbGFzc2VzKGVsZW1lbnQpO1xuICAgIHRoaXMuX2VtaXRPcmlnaW4oZWxlbWVudEluZm8uc3ViamVjdCwgbnVsbCk7XG4gIH1cblxuICBwcml2YXRlIF9lbWl0T3JpZ2luKHN1YmplY3Q6IFN1YmplY3Q8Rm9jdXNPcmlnaW4+LCBvcmlnaW46IEZvY3VzT3JpZ2luKSB7XG4gICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiBzdWJqZWN0Lm5leHQob3JpZ2luKSk7XG4gIH1cblxuICBwcml2YXRlIF9pbmNyZW1lbnRNb25pdG9yZWRFbGVtZW50Q291bnQoKSB7XG4gICAgLy8gUmVnaXN0ZXIgZ2xvYmFsIGxpc3RlbmVycyB3aGVuIGZpcnN0IGVsZW1lbnQgaXMgbW9uaXRvcmVkLlxuICAgIGlmICgrK3RoaXMuX21vbml0b3JlZEVsZW1lbnRDb3VudCA9PSAxICYmIHRoaXMuX3BsYXRmb3JtLmlzQnJvd3Nlcikge1xuICAgICAgLy8gTm90ZTogd2UgbGlzdGVuIHRvIGV2ZW50cyBpbiB0aGUgY2FwdHVyZSBwaGFzZSBzbyB3ZVxuICAgICAgLy8gY2FuIGRldGVjdCB0aGVtIGV2ZW4gaWYgdGhlIHVzZXIgc3RvcHMgcHJvcGFnYXRpb24uXG4gICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICBjb25zdCBkb2N1bWVudCA9IHRoaXMuX2dldERvY3VtZW50KCk7XG4gICAgICAgIGNvbnN0IHdpbmRvdyA9IHRoaXMuX2dldFdpbmRvdygpO1xuXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9kb2N1bWVudEtleWRvd25MaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9kb2N1bWVudE1vdXNlZG93bkxpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9kb2N1bWVudFRvdWNoc3RhcnRMaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCB0aGlzLl93aW5kb3dGb2N1c0xpc3RlbmVyKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2RlY3JlbWVudE1vbml0b3JlZEVsZW1lbnRDb3VudCgpIHtcbiAgICAvLyBVbnJlZ2lzdGVyIGdsb2JhbCBsaXN0ZW5lcnMgd2hlbiBsYXN0IGVsZW1lbnQgaXMgdW5tb25pdG9yZWQuXG4gICAgaWYgKCEtLXRoaXMuX21vbml0b3JlZEVsZW1lbnRDb3VudCkge1xuICAgICAgY29uc3QgZG9jdW1lbnQgPSB0aGlzLl9nZXREb2N1bWVudCgpO1xuICAgICAgY29uc3Qgd2luZG93ID0gdGhpcy5fZ2V0V2luZG93KCk7XG5cbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9kb2N1bWVudEtleWRvd25MaXN0ZW5lcixcbiAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX2RvY3VtZW50TW91c2Vkb3duTGlzdGVuZXIsXG4gICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5fZG9jdW1lbnRUb3VjaHN0YXJ0TGlzdGVuZXIsXG4gICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignZm9jdXMnLCB0aGlzLl93aW5kb3dGb2N1c0xpc3RlbmVyKTtcblxuICAgICAgLy8gQ2xlYXIgdGltZW91dHMgZm9yIGFsbCBwb3RlbnRpYWxseSBwZW5kaW5nIHRpbWVvdXRzIHRvIHByZXZlbnQgdGhlIGxlYWtzLlxuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3dpbmRvd0ZvY3VzVGltZW91dElkKTtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl90b3VjaFRpbWVvdXRJZCk7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fb3JpZ2luVGltZW91dElkKTtcbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIERpcmVjdGl2ZSB0aGF0IGRldGVybWluZXMgaG93IGEgcGFydGljdWxhciBlbGVtZW50IHdhcyBmb2N1c2VkICh2aWEga2V5Ym9hcmQsIG1vdXNlLCB0b3VjaCwgb3JcbiAqIHByb2dyYW1tYXRpY2FsbHkpIGFuZCBhZGRzIGNvcnJlc3BvbmRpbmcgY2xhc3NlcyB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGVyZSBhcmUgdHdvIHZhcmlhbnRzIG9mIHRoaXMgZGlyZWN0aXZlOlxuICogMSkgY2RrTW9uaXRvckVsZW1lbnRGb2N1czogZG9lcyBub3QgY29uc2lkZXIgYW4gZWxlbWVudCB0byBiZSBmb2N1c2VkIGlmIG9uZSBvZiBpdHMgY2hpbGRyZW4gaXNcbiAqICAgIGZvY3VzZWQuXG4gKiAyKSBjZGtNb25pdG9yU3VidHJlZUZvY3VzOiBjb25zaWRlcnMgYW4gZWxlbWVudCBmb2N1c2VkIGlmIGl0IG9yIGFueSBvZiBpdHMgY2hpbGRyZW4gYXJlIGZvY3VzZWQuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtNb25pdG9yRWxlbWVudEZvY3VzXSwgW2Nka01vbml0b3JTdWJ0cmVlRm9jdXNdJyxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrTW9uaXRvckZvY3VzIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSBfbW9uaXRvclN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uO1xuICBAT3V0cHV0KCkgY2RrRm9jdXNDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPEZvY3VzT3JpZ2luPigpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2VsZW1lbnRSZWY6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LCBwcml2YXRlIF9mb2N1c01vbml0b3I6IEZvY3VzTW9uaXRvcikge1xuICAgIHRoaXMuX21vbml0b3JTdWJzY3JpcHRpb24gPSB0aGlzLl9mb2N1c01vbml0b3IubW9uaXRvcihcbiAgICAgICAgdGhpcy5fZWxlbWVudFJlZixcbiAgICAgICAgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50Lmhhc0F0dHJpYnV0ZSgnY2RrTW9uaXRvclN1YnRyZWVGb2N1cycpKVxuICAgICAgICAuc3Vic2NyaWJlKG9yaWdpbiA9PiB0aGlzLmNka0ZvY3VzQ2hhbmdlLmVtaXQob3JpZ2luKSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9mb2N1c01vbml0b3Iuc3RvcE1vbml0b3JpbmcodGhpcy5fZWxlbWVudFJlZik7XG4gICAgdGhpcy5fbW9uaXRvclN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICB9XG59XG4iXX0=