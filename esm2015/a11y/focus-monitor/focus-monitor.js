/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Platform, normalizePassiveListenerOptions } from '@angular/cdk/platform';
import { Directive, ElementRef, EventEmitter, Injectable, NgZone, Optional, Output, SkipSelf, } from '@angular/core';
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
/** @nocollapse */ FocusMonitor.ngInjectableDef = i0.ɵɵdefineInjectable({ factory: function FocusMonitor_Factory() { return new FocusMonitor(i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i1.Platform)); }, token: FocusMonitor, providedIn: "root" });
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
/**
 * \@docs-private \@deprecated \@breaking-change 8.0.0
 * @param {?} parentDispatcher
 * @param {?} ngZone
 * @param {?} platform
 * @return {?}
 */
export function FOCUS_MONITOR_PROVIDER_FACTORY(parentDispatcher, ngZone, platform) {
    return parentDispatcher || new FocusMonitor(ngZone, platform);
}
/**
 * \@docs-private \@deprecated \@breaking-change 8.0.0
 * @type {?}
 */
export const FOCUS_MONITOR_PROVIDER = {
    // If there is already a FocusMonitor available, use that. Otherwise, provide a new one.
    provide: FocusMonitor,
    deps: [[new Optional(), new SkipSelf(), FocusMonitor], NgZone, Platform],
    useFactory: FOCUS_MONITOR_PROVIDER_FACTORY
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXMtbW9uaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvYTExeS9mb2N1cy1tb25pdG9yL2ZvY3VzLW1vbml0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsUUFBUSxFQUFFLCtCQUErQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDaEYsT0FBTyxFQUNMLFNBQVMsRUFDVCxVQUFVLEVBQ1YsWUFBWSxFQUNaLFVBQVUsRUFDVixNQUFNLEVBRU4sUUFBUSxFQUNSLE1BQU0sRUFDTixRQUFRLEdBQ1QsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFhLEVBQUUsSUFBSSxZQUFZLEVBQUUsT0FBTyxFQUFlLE1BQU0sTUFBTSxDQUFDO0FBQzNFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQzs7Ozs7O0FBS3BELE1BQU0sT0FBTyxlQUFlLEdBQUcsR0FBRzs7Ozs7O0FBU2xDLGtDQUdDOzs7Ozs7SUFEQyxxQ0FBd0I7Ozs7Ozs7TUFhcEIsMkJBQTJCLEdBQUcsK0JBQStCLENBQUM7SUFDbEUsT0FBTyxFQUFFLElBQUk7SUFDYixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUM7Ozs7QUFLRixNQUFNLE9BQU8sWUFBWTs7Ozs7SUFnRnZCLFlBQW9CLE9BQWUsRUFBVSxTQUFtQjtRQUE1QyxZQUFPLEdBQVAsT0FBTyxDQUFRO1FBQVUsY0FBUyxHQUFULFNBQVMsQ0FBVTs7OztRQTlFeEQsWUFBTyxHQUFnQixJQUFJLENBQUM7Ozs7UUFNNUIsbUJBQWMsR0FBRyxLQUFLLENBQUM7Ozs7UUFldkIsaUJBQVksR0FBRyxJQUFJLEdBQUcsRUFBcUMsQ0FBQzs7OztRQUc1RCwyQkFBc0IsR0FBRyxDQUFDLENBQUM7Ozs7O1FBTTNCLDZCQUF3Qjs7O1FBQUcsR0FBRyxFQUFFO1lBQ3RDLGtGQUFrRjtZQUNsRixJQUFJLENBQUMsZ0JB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QUMsV0FBVyxDQUFDLENBQUM7UUFDcEQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQzFDLENBQUM7OztZQWpCRixTQUFTLFNBQUM7Z0JBQ1QsUUFBUSxFQUFFLG9EQUFvRDthQUMvRDs7OztZQTVhQyxVQUFVO1lBaWJ1RSxZQUFZOzs7NkJBRjVGLE1BQU07Ozs7Ozs7SUFEUCwrQ0FBMkM7O0lBQzNDLHlDQUEyRDs7Ozs7SUFFL0Msc0NBQTRDOzs7OztJQUFFLHdDQUFtQzs7Ozs7Ozs7O0FBYy9GLE1BQU0sVUFBVSw4QkFBOEIsQ0FDMUMsZ0JBQThCLEVBQUUsTUFBYyxFQUFFLFFBQWtCO0lBQ3BFLE9BQU8sZ0JBQWdCLElBQUksSUFBSSxZQUFZLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ2hFLENBQUM7Ozs7O0FBR0QsTUFBTSxPQUFPLHNCQUFzQixHQUFHOztJQUVwQyxPQUFPLEVBQUUsWUFBWTtJQUNyQixJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksUUFBUSxFQUFFLEVBQUUsSUFBSSxRQUFRLEVBQUUsRUFBRSxZQUFZLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDO0lBQ3hFLFVBQVUsRUFBRSw4QkFBOEI7Q0FDM0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtQbGF0Zm9ybSwgbm9ybWFsaXplUGFzc2l2ZUxpc3RlbmVyT3B0aW9uc30gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7XG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBJbmplY3RhYmxlLFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgT3B0aW9uYWwsXG4gIE91dHB1dCxcbiAgU2tpcFNlbGYsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBvZiBhcyBvYnNlcnZhYmxlT2YsIFN1YmplY3QsIFN1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2NvZXJjZUVsZW1lbnR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5cblxuLy8gVGhpcyBpcyB0aGUgdmFsdWUgdXNlZCBieSBBbmd1bGFySlMgTWF0ZXJpYWwuIFRocm91Z2ggdHJpYWwgYW5kIGVycm9yIChvbiBpUGhvbmUgNlMpIHRoZXkgZm91bmRcbi8vIHRoYXQgYSB2YWx1ZSBvZiBhcm91bmQgNjUwbXMgc2VlbXMgYXBwcm9wcmlhdGUuXG5leHBvcnQgY29uc3QgVE9VQ0hfQlVGRkVSX01TID0gNjUwO1xuXG5cbmV4cG9ydCB0eXBlIEZvY3VzT3JpZ2luID0gJ3RvdWNoJyB8ICdtb3VzZScgfCAna2V5Ym9hcmQnIHwgJ3Byb2dyYW0nIHwgbnVsbDtcblxuLyoqXG4gKiBDb3JyZXNwb25kcyB0byB0aGUgb3B0aW9ucyB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gdGhlIG5hdGl2ZSBgZm9jdXNgIGV2ZW50LlxuICogdmlhIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9IVE1MRWxlbWVudC9mb2N1c1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEZvY3VzT3B0aW9ucyB7XG4gIC8qKiBXaGV0aGVyIHRoZSBicm93c2VyIHNob3VsZCBzY3JvbGwgdG8gdGhlIGVsZW1lbnQgd2hlbiBpdCBpcyBmb2N1c2VkLiAqL1xuICBwcmV2ZW50U2Nyb2xsPzogYm9vbGVhbjtcbn1cblxudHlwZSBNb25pdG9yZWRFbGVtZW50SW5mbyA9IHtcbiAgdW5saXN0ZW46IEZ1bmN0aW9uLFxuICBjaGVja0NoaWxkcmVuOiBib29sZWFuLFxuICBzdWJqZWN0OiBTdWJqZWN0PEZvY3VzT3JpZ2luPlxufTtcblxuLyoqXG4gKiBFdmVudCBsaXN0ZW5lciBvcHRpb25zIHRoYXQgZW5hYmxlIGNhcHR1cmluZyBhbmQgYWxzb1xuICogbWFyayB0aGUgbGlzdGVuZXIgYXMgcGFzc2l2ZSBpZiB0aGUgYnJvd3NlciBzdXBwb3J0cyBpdC5cbiAqL1xuY29uc3QgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zID0gbm9ybWFsaXplUGFzc2l2ZUxpc3RlbmVyT3B0aW9ucyh7XG4gIHBhc3NpdmU6IHRydWUsXG4gIGNhcHR1cmU6IHRydWVcbn0pO1xuXG5cbi8qKiBNb25pdG9ycyBtb3VzZSBhbmQga2V5Ym9hcmQgZXZlbnRzIHRvIGRldGVybWluZSB0aGUgY2F1c2Ugb2YgZm9jdXMgZXZlbnRzLiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgRm9jdXNNb25pdG9yIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIFRoZSBmb2N1cyBvcmlnaW4gdGhhdCB0aGUgbmV4dCBmb2N1cyBldmVudCBpcyBhIHJlc3VsdCBvZi4gKi9cbiAgcHJpdmF0ZSBfb3JpZ2luOiBGb2N1c09yaWdpbiA9IG51bGw7XG5cbiAgLyoqIFRoZSBGb2N1c09yaWdpbiBvZiB0aGUgbGFzdCBmb2N1cyBldmVudCB0cmFja2VkIGJ5IHRoZSBGb2N1c01vbml0b3IuICovXG4gIHByaXZhdGUgX2xhc3RGb2N1c09yaWdpbjogRm9jdXNPcmlnaW47XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHdpbmRvdyBoYXMganVzdCBiZWVuIGZvY3VzZWQuICovXG4gIHByaXZhdGUgX3dpbmRvd0ZvY3VzZWQgPSBmYWxzZTtcblxuICAvKiogVGhlIHRhcmdldCBvZiB0aGUgbGFzdCB0b3VjaCBldmVudC4gKi9cbiAgcHJpdmF0ZSBfbGFzdFRvdWNoVGFyZ2V0OiBFdmVudFRhcmdldCB8IG51bGw7XG5cbiAgLyoqIFRoZSB0aW1lb3V0IGlkIG9mIHRoZSB0b3VjaCB0aW1lb3V0LCB1c2VkIHRvIGNhbmNlbCB0aW1lb3V0IGxhdGVyLiAqL1xuICBwcml2YXRlIF90b3VjaFRpbWVvdXRJZDogbnVtYmVyO1xuXG4gIC8qKiBUaGUgdGltZW91dCBpZCBvZiB0aGUgd2luZG93IGZvY3VzIHRpbWVvdXQuICovXG4gIHByaXZhdGUgX3dpbmRvd0ZvY3VzVGltZW91dElkOiBudW1iZXI7XG5cbiAgLyoqIFRoZSB0aW1lb3V0IGlkIG9mIHRoZSBvcmlnaW4gY2xlYXJpbmcgdGltZW91dC4gKi9cbiAgcHJpdmF0ZSBfb3JpZ2luVGltZW91dElkOiBudW1iZXI7XG5cbiAgLyoqIE1hcCBvZiBlbGVtZW50cyBiZWluZyBtb25pdG9yZWQgdG8gdGhlaXIgaW5mby4gKi9cbiAgcHJpdmF0ZSBfZWxlbWVudEluZm8gPSBuZXcgTWFwPEhUTUxFbGVtZW50LCBNb25pdG9yZWRFbGVtZW50SW5mbz4oKTtcblxuICAvKiogVGhlIG51bWJlciBvZiBlbGVtZW50cyBjdXJyZW50bHkgYmVpbmcgbW9uaXRvcmVkLiAqL1xuICBwcml2YXRlIF9tb25pdG9yZWRFbGVtZW50Q291bnQgPSAwO1xuXG4gIC8qKlxuICAgKiBFdmVudCBsaXN0ZW5lciBmb3IgYGtleWRvd25gIGV2ZW50cyBvbiB0aGUgZG9jdW1lbnQuXG4gICAqIE5lZWRzIHRvIGJlIGFuIGFycm93IGZ1bmN0aW9uIGluIG9yZGVyIHRvIHByZXNlcnZlIHRoZSBjb250ZXh0IHdoZW4gaXQgZ2V0cyBib3VuZC5cbiAgICovXG4gIHByaXZhdGUgX2RvY3VtZW50S2V5ZG93bkxpc3RlbmVyID0gKCkgPT4ge1xuICAgIC8vIE9uIGtleWRvd24gcmVjb3JkIHRoZSBvcmlnaW4gYW5kIGNsZWFyIGFueSB0b3VjaCBldmVudCB0aGF0IG1heSBiZSBpbiBwcm9ncmVzcy5cbiAgICB0aGlzLl9sYXN0VG91Y2hUYXJnZXQgPSBudWxsO1xuICAgIHRoaXMuX3NldE9yaWdpbkZvckN1cnJlbnRFdmVudFF1ZXVlKCdrZXlib2FyZCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV2ZW50IGxpc3RlbmVyIGZvciBgbW91c2Vkb3duYCBldmVudHMgb24gdGhlIGRvY3VtZW50LlxuICAgKiBOZWVkcyB0byBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0IGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF9kb2N1bWVudE1vdXNlZG93bkxpc3RlbmVyID0gKCkgPT4ge1xuICAgIC8vIE9uIG1vdXNlZG93biByZWNvcmQgdGhlIG9yaWdpbiBvbmx5IGlmIHRoZXJlIGlzIG5vdCB0b3VjaFxuICAgIC8vIHRhcmdldCwgc2luY2UgYSBtb3VzZWRvd24gY2FuIGhhcHBlbiBhcyBhIHJlc3VsdCBvZiBhIHRvdWNoIGV2ZW50LlxuICAgIGlmICghdGhpcy5fbGFzdFRvdWNoVGFyZ2V0KSB7XG4gICAgICB0aGlzLl9zZXRPcmlnaW5Gb3JDdXJyZW50RXZlbnRRdWV1ZSgnbW91c2UnKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRXZlbnQgbGlzdGVuZXIgZm9yIGB0b3VjaHN0YXJ0YCBldmVudHMgb24gdGhlIGRvY3VtZW50LlxuICAgKiBOZWVkcyB0byBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0IGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF9kb2N1bWVudFRvdWNoc3RhcnRMaXN0ZW5lciA9IChldmVudDogVG91Y2hFdmVudCkgPT4ge1xuICAgIC8vIFdoZW4gdGhlIHRvdWNoc3RhcnQgZXZlbnQgZmlyZXMgdGhlIGZvY3VzIGV2ZW50IGlzIG5vdCB5ZXQgaW4gdGhlIGV2ZW50IHF1ZXVlLiBUaGlzIG1lYW5zXG4gICAgLy8gd2UgY2FuJ3QgcmVseSBvbiB0aGUgdHJpY2sgdXNlZCBhYm92ZSAoc2V0dGluZyB0aW1lb3V0IG9mIDFtcykuIEluc3RlYWQgd2Ugd2FpdCA2NTBtcyB0b1xuICAgIC8vIHNlZSBpZiBhIGZvY3VzIGhhcHBlbnMuXG4gICAgaWYgKHRoaXMuX3RvdWNoVGltZW91dElkICE9IG51bGwpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl90b3VjaFRpbWVvdXRJZCk7XG4gICAgfVxuXG4gICAgLy8gU2luY2UgdGhpcyBsaXN0ZW5lciBpcyBib3VuZCBvbiB0aGUgYGRvY3VtZW50YCBsZXZlbCwgYW55IGV2ZW50cyBjb21pbmcgZnJvbSB0aGUgc2hhZG93IERPTVxuICAgIC8vIHdpbGwgaGF2ZSB0aGVpciBgdGFyZ2V0YCBzZXQgdG8gdGhlIHNoYWRvdyByb290LiBJZiBhdmFpbGFibGUsIHVzZSBgY29tcG9zZWRQYXRoYCB0b1xuICAgIC8vIGZpZ3VyZSBvdXQgdGhlIGV2ZW50IHRhcmdldC5cbiAgICB0aGlzLl9sYXN0VG91Y2hUYXJnZXQgPSBldmVudC5jb21wb3NlZFBhdGggPyBldmVudC5jb21wb3NlZFBhdGgoKVswXSA6IGV2ZW50LnRhcmdldDtcbiAgICB0aGlzLl90b3VjaFRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fbGFzdFRvdWNoVGFyZ2V0ID0gbnVsbCwgVE9VQ0hfQlVGRkVSX01TKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFdmVudCBsaXN0ZW5lciBmb3IgYGZvY3VzYCBldmVudHMgb24gdGhlIHdpbmRvdy5cbiAgICogTmVlZHMgdG8gYmUgYW4gYXJyb3cgZnVuY3Rpb24gaW4gb3JkZXIgdG8gcHJlc2VydmUgdGhlIGNvbnRleHQgd2hlbiBpdCBnZXRzIGJvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfd2luZG93Rm9jdXNMaXN0ZW5lciA9ICgpID0+IHtcbiAgICAvLyBNYWtlIGEgbm90ZSBvZiB3aGVuIHRoZSB3aW5kb3cgcmVnYWlucyBmb2N1cywgc28gd2UgY2FuXG4gICAgLy8gcmVzdG9yZSB0aGUgb3JpZ2luIGluZm8gZm9yIHRoZSBmb2N1c2VkIGVsZW1lbnQuXG4gICAgdGhpcy5fd2luZG93Rm9jdXNlZCA9IHRydWU7XG4gICAgdGhpcy5fd2luZG93Rm9jdXNUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX3dpbmRvd0ZvY3VzZWQgPSBmYWxzZSk7XG4gIH1cblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSwgcHJpdmF0ZSBfcGxhdGZvcm06IFBsYXRmb3JtKSB7fVxuXG4gIC8qKlxuICAgKiBNb25pdG9ycyBmb2N1cyBvbiBhbiBlbGVtZW50IGFuZCBhcHBsaWVzIGFwcHJvcHJpYXRlIENTUyBjbGFzc2VzLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBtb25pdG9yXG4gICAqIEBwYXJhbSBjaGVja0NoaWxkcmVuIFdoZXRoZXIgdG8gY291bnQgdGhlIGVsZW1lbnQgYXMgZm9jdXNlZCB3aGVuIGl0cyBjaGlsZHJlbiBhcmUgZm9jdXNlZC5cbiAgICogQHJldHVybnMgQW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHdoZW4gdGhlIGZvY3VzIHN0YXRlIG9mIHRoZSBlbGVtZW50IGNoYW5nZXMuXG4gICAqICAgICBXaGVuIHRoZSBlbGVtZW50IGlzIGJsdXJyZWQsIG51bGwgd2lsbCBiZSBlbWl0dGVkLlxuICAgKi9cbiAgbW9uaXRvcihlbGVtZW50OiBIVE1MRWxlbWVudCwgY2hlY2tDaGlsZHJlbj86IGJvb2xlYW4pOiBPYnNlcnZhYmxlPEZvY3VzT3JpZ2luPjtcblxuICAvKipcbiAgICogTW9uaXRvcnMgZm9jdXMgb24gYW4gZWxlbWVudCBhbmQgYXBwbGllcyBhcHByb3ByaWF0ZSBDU1MgY2xhc3Nlcy5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gbW9uaXRvclxuICAgKiBAcGFyYW0gY2hlY2tDaGlsZHJlbiBXaGV0aGVyIHRvIGNvdW50IHRoZSBlbGVtZW50IGFzIGZvY3VzZWQgd2hlbiBpdHMgY2hpbGRyZW4gYXJlIGZvY3VzZWQuXG4gICAqIEByZXR1cm5zIEFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB3aGVuIHRoZSBmb2N1cyBzdGF0ZSBvZiB0aGUgZWxlbWVudCBjaGFuZ2VzLlxuICAgKiAgICAgV2hlbiB0aGUgZWxlbWVudCBpcyBibHVycmVkLCBudWxsIHdpbGwgYmUgZW1pdHRlZC5cbiAgICovXG4gIG1vbml0b3IoZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sIGNoZWNrQ2hpbGRyZW4/OiBib29sZWFuKTogT2JzZXJ2YWJsZTxGb2N1c09yaWdpbj47XG5cbiAgbW9uaXRvcihlbGVtZW50OiBIVE1MRWxlbWVudCB8IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgICAgICAgIGNoZWNrQ2hpbGRyZW46IGJvb2xlYW4gPSBmYWxzZSk6IE9ic2VydmFibGU8Rm9jdXNPcmlnaW4+IHtcbiAgICAvLyBEbyBub3RoaW5nIGlmIHdlJ3JlIG5vdCBvbiB0aGUgYnJvd3NlciBwbGF0Zm9ybS5cbiAgICBpZiAoIXRoaXMuX3BsYXRmb3JtLmlzQnJvd3Nlcikge1xuICAgICAgcmV0dXJuIG9ic2VydmFibGVPZihudWxsKTtcbiAgICB9XG5cbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gY29lcmNlRWxlbWVudChlbGVtZW50KTtcblxuICAgIC8vIENoZWNrIGlmIHdlJ3JlIGFscmVhZHkgbW9uaXRvcmluZyB0aGlzIGVsZW1lbnQuXG4gICAgaWYgKHRoaXMuX2VsZW1lbnRJbmZvLmhhcyhuYXRpdmVFbGVtZW50KSkge1xuICAgICAgbGV0IGNhY2hlZEluZm8gPSB0aGlzLl9lbGVtZW50SW5mby5nZXQobmF0aXZlRWxlbWVudCk7XG4gICAgICBjYWNoZWRJbmZvIS5jaGVja0NoaWxkcmVuID0gY2hlY2tDaGlsZHJlbjtcbiAgICAgIHJldHVybiBjYWNoZWRJbmZvIS5zdWJqZWN0LmFzT2JzZXJ2YWJsZSgpO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBtb25pdG9yZWQgZWxlbWVudCBpbmZvLlxuICAgIGxldCBpbmZvOiBNb25pdG9yZWRFbGVtZW50SW5mbyA9IHtcbiAgICAgIHVubGlzdGVuOiAoKSA9PiB7fSxcbiAgICAgIGNoZWNrQ2hpbGRyZW46IGNoZWNrQ2hpbGRyZW4sXG4gICAgICBzdWJqZWN0OiBuZXcgU3ViamVjdDxGb2N1c09yaWdpbj4oKVxuICAgIH07XG4gICAgdGhpcy5fZWxlbWVudEluZm8uc2V0KG5hdGl2ZUVsZW1lbnQsIGluZm8pO1xuICAgIHRoaXMuX2luY3JlbWVudE1vbml0b3JlZEVsZW1lbnRDb3VudCgpO1xuXG4gICAgLy8gU3RhcnQgbGlzdGVuaW5nLiBXZSBuZWVkIHRvIGxpc3RlbiBpbiBjYXB0dXJlIHBoYXNlIHNpbmNlIGZvY3VzIGV2ZW50cyBkb24ndCBidWJibGUuXG4gICAgbGV0IGZvY3VzTGlzdGVuZXIgPSAoZXZlbnQ6IEZvY3VzRXZlbnQpID0+IHRoaXMuX29uRm9jdXMoZXZlbnQsIG5hdGl2ZUVsZW1lbnQpO1xuICAgIGxldCBibHVyTGlzdGVuZXIgPSAoZXZlbnQ6IEZvY3VzRXZlbnQpID0+IHRoaXMuX29uQmx1cihldmVudCwgbmF0aXZlRWxlbWVudCk7XG4gICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIG5hdGl2ZUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCBmb2N1c0xpc3RlbmVyLCB0cnVlKTtcbiAgICAgIG5hdGl2ZUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIGJsdXJMaXN0ZW5lciwgdHJ1ZSk7XG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgYW4gdW5saXN0ZW4gZnVuY3Rpb24gZm9yIGxhdGVyLlxuICAgIGluZm8udW5saXN0ZW4gPSAoKSA9PiB7XG4gICAgICBuYXRpdmVFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgZm9jdXNMaXN0ZW5lciwgdHJ1ZSk7XG4gICAgICBuYXRpdmVFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2JsdXInLCBibHVyTGlzdGVuZXIsIHRydWUpO1xuICAgIH07XG5cbiAgICByZXR1cm4gaW5mby5zdWJqZWN0LmFzT2JzZXJ2YWJsZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0b3BzIG1vbml0b3JpbmcgYW4gZWxlbWVudCBhbmQgcmVtb3ZlcyBhbGwgZm9jdXMgY2xhc3Nlcy5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gc3RvcCBtb25pdG9yaW5nLlxuICAgKi9cbiAgc3RvcE1vbml0b3JpbmcoZWxlbWVudDogSFRNTEVsZW1lbnQpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBTdG9wcyBtb25pdG9yaW5nIGFuIGVsZW1lbnQgYW5kIHJlbW92ZXMgYWxsIGZvY3VzIGNsYXNzZXMuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHN0b3AgbW9uaXRvcmluZy5cbiAgICovXG4gIHN0b3BNb25pdG9yaW5nKGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+KTogdm9pZDtcblxuICBzdG9wTW9uaXRvcmluZyhlbGVtZW50OiBIVE1MRWxlbWVudCB8IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+KTogdm9pZCB7XG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoZWxlbWVudCk7XG4gICAgY29uc3QgZWxlbWVudEluZm8gPSB0aGlzLl9lbGVtZW50SW5mby5nZXQobmF0aXZlRWxlbWVudCk7XG5cbiAgICBpZiAoZWxlbWVudEluZm8pIHtcbiAgICAgIGVsZW1lbnRJbmZvLnVubGlzdGVuKCk7XG4gICAgICBlbGVtZW50SW5mby5zdWJqZWN0LmNvbXBsZXRlKCk7XG5cbiAgICAgIHRoaXMuX3NldENsYXNzZXMobmF0aXZlRWxlbWVudCk7XG4gICAgICB0aGlzLl9lbGVtZW50SW5mby5kZWxldGUobmF0aXZlRWxlbWVudCk7XG4gICAgICB0aGlzLl9kZWNyZW1lbnRNb25pdG9yZWRFbGVtZW50Q291bnQoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRm9jdXNlcyB0aGUgZWxlbWVudCB2aWEgdGhlIHNwZWNpZmllZCBmb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgdG8gZm9jdXMuXG4gICAqIEBwYXJhbSBvcmlnaW4gRm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIHRoYXQgY2FuIGJlIHVzZWQgdG8gY29uZmlndXJlIHRoZSBmb2N1cyBiZWhhdmlvci5cbiAgICovXG4gIGZvY3VzVmlhKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBvcmlnaW46IEZvY3VzT3JpZ2luLCBvcHRpb25zPzogRm9jdXNPcHRpb25zKTogdm9pZDtcblxuICAvKipcbiAgICogRm9jdXNlcyB0aGUgZWxlbWVudCB2aWEgdGhlIHNwZWNpZmllZCBmb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgdG8gZm9jdXMuXG4gICAqIEBwYXJhbSBvcmlnaW4gRm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIHRoYXQgY2FuIGJlIHVzZWQgdG8gY29uZmlndXJlIHRoZSBmb2N1cyBiZWhhdmlvci5cbiAgICovXG4gIGZvY3VzVmlhKGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LCBvcmlnaW46IEZvY3VzT3JpZ2luLCBvcHRpb25zPzogRm9jdXNPcHRpb25zKTogdm9pZDtcblxuICBmb2N1c1ZpYShlbGVtZW50OiBIVE1MRWxlbWVudCB8IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgICAgICAgIG9yaWdpbjogRm9jdXNPcmlnaW4sXG4gICAgICAgICAgb3B0aW9ucz86IEZvY3VzT3B0aW9ucyk6IHZvaWQge1xuXG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoZWxlbWVudCk7XG5cbiAgICB0aGlzLl9zZXRPcmlnaW5Gb3JDdXJyZW50RXZlbnRRdWV1ZShvcmlnaW4pO1xuXG4gICAgLy8gYGZvY3VzYCBpc24ndCBhdmFpbGFibGUgb24gdGhlIHNlcnZlclxuICAgIGlmICh0eXBlb2YgbmF0aXZlRWxlbWVudC5mb2N1cyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gQ2FzdCB0aGUgZWxlbWVudCB0byBgYW55YCwgYmVjYXVzZSB0aGUgVFMgdHlwaW5ncyBkb24ndCBoYXZlIHRoZSBgb3B0aW9uc2AgcGFyYW1ldGVyIHlldC5cbiAgICAgIChuYXRpdmVFbGVtZW50IGFzIGFueSkuZm9jdXMob3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fZWxlbWVudEluZm8uZm9yRWFjaCgoX2luZm8sIGVsZW1lbnQpID0+IHRoaXMuc3RvcE1vbml0b3JpbmcoZWxlbWVudCkpO1xuICB9XG5cbiAgcHJpdmF0ZSBfdG9nZ2xlQ2xhc3MoZWxlbWVudDogRWxlbWVudCwgY2xhc3NOYW1lOiBzdHJpbmcsIHNob3VsZFNldDogYm9vbGVhbikge1xuICAgIGlmIChzaG91bGRTZXQpIHtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZm9jdXMgY2xhc3NlcyBvbiB0aGUgZWxlbWVudCBiYXNlZCBvbiB0aGUgZ2l2ZW4gZm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byB1cGRhdGUgdGhlIGNsYXNzZXMgb24uXG4gICAqIEBwYXJhbSBvcmlnaW4gVGhlIGZvY3VzIG9yaWdpbi5cbiAgICovXG4gIHByaXZhdGUgX3NldENsYXNzZXMoZWxlbWVudDogSFRNTEVsZW1lbnQsIG9yaWdpbj86IEZvY3VzT3JpZ2luKTogdm9pZCB7XG4gICAgY29uc3QgZWxlbWVudEluZm8gPSB0aGlzLl9lbGVtZW50SW5mby5nZXQoZWxlbWVudCk7XG5cbiAgICBpZiAoZWxlbWVudEluZm8pIHtcbiAgICAgIHRoaXMuX3RvZ2dsZUNsYXNzKGVsZW1lbnQsICdjZGstZm9jdXNlZCcsICEhb3JpZ2luKTtcbiAgICAgIHRoaXMuX3RvZ2dsZUNsYXNzKGVsZW1lbnQsICdjZGstdG91Y2gtZm9jdXNlZCcsIG9yaWdpbiA9PT0gJ3RvdWNoJyk7XG4gICAgICB0aGlzLl90b2dnbGVDbGFzcyhlbGVtZW50LCAnY2RrLWtleWJvYXJkLWZvY3VzZWQnLCBvcmlnaW4gPT09ICdrZXlib2FyZCcpO1xuICAgICAgdGhpcy5fdG9nZ2xlQ2xhc3MoZWxlbWVudCwgJ2Nkay1tb3VzZS1mb2N1c2VkJywgb3JpZ2luID09PSAnbW91c2UnKTtcbiAgICAgIHRoaXMuX3RvZ2dsZUNsYXNzKGVsZW1lbnQsICdjZGstcHJvZ3JhbS1mb2N1c2VkJywgb3JpZ2luID09PSAncHJvZ3JhbScpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBvcmlnaW4gYW5kIHNjaGVkdWxlcyBhbiBhc3luYyBmdW5jdGlvbiB0byBjbGVhciBpdCBhdCB0aGUgZW5kIG9mIHRoZSBldmVudCBxdWV1ZS5cbiAgICogQHBhcmFtIG9yaWdpbiBUaGUgb3JpZ2luIHRvIHNldC5cbiAgICovXG4gIHByaXZhdGUgX3NldE9yaWdpbkZvckN1cnJlbnRFdmVudFF1ZXVlKG9yaWdpbjogRm9jdXNPcmlnaW4pOiB2b2lkIHtcbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgdGhpcy5fb3JpZ2luID0gb3JpZ2luO1xuICAgICAgLy8gU29tZXRpbWVzIHRoZSBmb2N1cyBvcmlnaW4gd29uJ3QgYmUgdmFsaWQgaW4gRmlyZWZveCBiZWNhdXNlIEZpcmVmb3ggc2VlbXMgdG8gZm9jdXMgKm9uZSpcbiAgICAgIC8vIHRpY2sgYWZ0ZXIgdGhlIGludGVyYWN0aW9uIGV2ZW50IGZpcmVkLiBUbyBlbnN1cmUgdGhlIGZvY3VzIG9yaWdpbiBpcyBhbHdheXMgY29ycmVjdCxcbiAgICAgIC8vIHRoZSBmb2N1cyBvcmlnaW4gd2lsbCBiZSBkZXRlcm1pbmVkIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIG5leHQgdGljay5cbiAgICAgIHRoaXMuX29yaWdpblRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fb3JpZ2luID0gbnVsbCwgMSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGdpdmVuIGZvY3VzIGV2ZW50IHdhcyBjYXVzZWQgYnkgYSB0b3VjaHN0YXJ0IGV2ZW50LlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIGZvY3VzIGV2ZW50IHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyBXaGV0aGVyIHRoZSBldmVudCB3YXMgY2F1c2VkIGJ5IGEgdG91Y2guXG4gICAqL1xuICBwcml2YXRlIF93YXNDYXVzZWRCeVRvdWNoKGV2ZW50OiBGb2N1c0V2ZW50KTogYm9vbGVhbiB7XG4gICAgLy8gTm90ZShtbWFsZXJiYSk6IFRoaXMgaW1wbGVtZW50YXRpb24gaXMgbm90IHF1aXRlIHBlcmZlY3QsIHRoZXJlIGlzIGEgc21hbGwgZWRnZSBjYXNlLlxuICAgIC8vIENvbnNpZGVyIHRoZSBmb2xsb3dpbmcgZG9tIHN0cnVjdHVyZTpcbiAgICAvL1xuICAgIC8vIDxkaXYgI3BhcmVudCB0YWJpbmRleD1cIjBcIiBjZGtGb2N1c0NsYXNzZXM+XG4gICAgLy8gICA8ZGl2ICNjaGlsZCAoY2xpY2spPVwiI3BhcmVudC5mb2N1cygpXCI+PC9kaXY+XG4gICAgLy8gPC9kaXY+XG4gICAgLy9cbiAgICAvLyBJZiB0aGUgdXNlciB0b3VjaGVzIHRoZSAjY2hpbGQgZWxlbWVudCBhbmQgdGhlICNwYXJlbnQgaXMgcHJvZ3JhbW1hdGljYWxseSBmb2N1c2VkIGFzIGFcbiAgICAvLyByZXN1bHQsIHRoaXMgY29kZSB3aWxsIHN0aWxsIGNvbnNpZGVyIGl0IHRvIGhhdmUgYmVlbiBjYXVzZWQgYnkgdGhlIHRvdWNoIGV2ZW50IGFuZCB3aWxsXG4gICAgLy8gYXBwbHkgdGhlIGNkay10b3VjaC1mb2N1c2VkIGNsYXNzIHJhdGhlciB0aGFuIHRoZSBjZGstcHJvZ3JhbS1mb2N1c2VkIGNsYXNzLiBUaGlzIGlzIGFcbiAgICAvLyByZWxhdGl2ZWx5IHNtYWxsIGVkZ2UtY2FzZSB0aGF0IGNhbiBiZSB3b3JrZWQgYXJvdW5kIGJ5IHVzaW5nXG4gICAgLy8gZm9jdXNWaWEocGFyZW50RWwsICdwcm9ncmFtJykgdG8gZm9jdXMgdGhlIHBhcmVudCBlbGVtZW50LlxuICAgIC8vXG4gICAgLy8gSWYgd2UgZGVjaWRlIHRoYXQgd2UgYWJzb2x1dGVseSBtdXN0IGhhbmRsZSB0aGlzIGNhc2UgY29ycmVjdGx5LCB3ZSBjYW4gZG8gc28gYnkgbGlzdGVuaW5nXG4gICAgLy8gZm9yIHRoZSBmaXJzdCBmb2N1cyBldmVudCBhZnRlciB0aGUgdG91Y2hzdGFydCwgYW5kIHRoZW4gdGhlIGZpcnN0IGJsdXIgZXZlbnQgYWZ0ZXIgdGhhdFxuICAgIC8vIGZvY3VzIGV2ZW50LiBXaGVuIHRoYXQgYmx1ciBldmVudCBmaXJlcyB3ZSBrbm93IHRoYXQgd2hhdGV2ZXIgZm9sbG93cyBpcyBub3QgYSByZXN1bHQgb2YgdGhlXG4gICAgLy8gdG91Y2hzdGFydC5cbiAgICBsZXQgZm9jdXNUYXJnZXQgPSBldmVudC50YXJnZXQ7XG4gICAgcmV0dXJuIHRoaXMuX2xhc3RUb3VjaFRhcmdldCBpbnN0YW5jZW9mIE5vZGUgJiYgZm9jdXNUYXJnZXQgaW5zdGFuY2VvZiBOb2RlICYmXG4gICAgICAgIChmb2N1c1RhcmdldCA9PT0gdGhpcy5fbGFzdFRvdWNoVGFyZ2V0IHx8IGZvY3VzVGFyZ2V0LmNvbnRhaW5zKHRoaXMuX2xhc3RUb3VjaFRhcmdldCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgZm9jdXMgZXZlbnRzIG9uIGEgcmVnaXN0ZXJlZCBlbGVtZW50LlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIGZvY3VzIGV2ZW50LlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgbW9uaXRvcmVkIGVsZW1lbnQuXG4gICAqL1xuICBwcml2YXRlIF9vbkZvY3VzKGV2ZW50OiBGb2N1c0V2ZW50LCBlbGVtZW50OiBIVE1MRWxlbWVudCkge1xuICAgIC8vIE5PVEUobW1hbGVyYmEpOiBXZSBjdXJyZW50bHkgc2V0IHRoZSBjbGFzc2VzIGJhc2VkIG9uIHRoZSBmb2N1cyBvcmlnaW4gb2YgdGhlIG1vc3QgcmVjZW50XG4gICAgLy8gZm9jdXMgZXZlbnQgYWZmZWN0aW5nIHRoZSBtb25pdG9yZWQgZWxlbWVudC4gSWYgd2Ugd2FudCB0byB1c2UgdGhlIG9yaWdpbiBvZiB0aGUgZmlyc3QgZXZlbnRcbiAgICAvLyBpbnN0ZWFkIHdlIHNob3VsZCBjaGVjayBmb3IgdGhlIGNkay1mb2N1c2VkIGNsYXNzIGhlcmUgYW5kIHJldHVybiBpZiB0aGUgZWxlbWVudCBhbHJlYWR5IGhhc1xuICAgIC8vIGl0LiAoVGhpcyBvbmx5IG1hdHRlcnMgZm9yIGVsZW1lbnRzIHRoYXQgaGF2ZSBpbmNsdWRlc0NoaWxkcmVuID0gdHJ1ZSkuXG5cbiAgICAvLyBJZiB3ZSBhcmUgbm90IGNvdW50aW5nIGNoaWxkLWVsZW1lbnQtZm9jdXMgYXMgZm9jdXNlZCwgbWFrZSBzdXJlIHRoYXQgdGhlIGV2ZW50IHRhcmdldCBpcyB0aGVcbiAgICAvLyBtb25pdG9yZWQgZWxlbWVudCBpdHNlbGYuXG4gICAgY29uc3QgZWxlbWVudEluZm8gPSB0aGlzLl9lbGVtZW50SW5mby5nZXQoZWxlbWVudCk7XG4gICAgaWYgKCFlbGVtZW50SW5mbyB8fCAoIWVsZW1lbnRJbmZvLmNoZWNrQ2hpbGRyZW4gJiYgZWxlbWVudCAhPT0gZXZlbnQudGFyZ2V0KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIElmIHdlIGNvdWxkbid0IGRldGVjdCBhIGNhdXNlIGZvciB0aGUgZm9jdXMgZXZlbnQsIGl0J3MgZHVlIHRvIG9uZSBvZiB0aHJlZSByZWFzb25zOlxuICAgIC8vIDEpIFRoZSB3aW5kb3cgaGFzIGp1c3QgcmVnYWluZWQgZm9jdXMsIGluIHdoaWNoIGNhc2Ugd2Ugd2FudCB0byByZXN0b3JlIHRoZSBmb2N1c2VkIHN0YXRlIG9mXG4gICAgLy8gICAgdGhlIGVsZW1lbnQgZnJvbSBiZWZvcmUgdGhlIHdpbmRvdyBibHVycmVkLlxuICAgIC8vIDIpIEl0IHdhcyBjYXVzZWQgYnkgYSB0b3VjaCBldmVudCwgaW4gd2hpY2ggY2FzZSB3ZSBtYXJrIHRoZSBvcmlnaW4gYXMgJ3RvdWNoJy5cbiAgICAvLyAzKSBUaGUgZWxlbWVudCB3YXMgcHJvZ3JhbW1hdGljYWxseSBmb2N1c2VkLCBpbiB3aGljaCBjYXNlIHdlIHNob3VsZCBtYXJrIHRoZSBvcmlnaW4gYXNcbiAgICAvLyAgICAncHJvZ3JhbScuXG4gICAgbGV0IG9yaWdpbiA9IHRoaXMuX29yaWdpbjtcbiAgICBpZiAoIW9yaWdpbikge1xuICAgICAgaWYgKHRoaXMuX3dpbmRvd0ZvY3VzZWQgJiYgdGhpcy5fbGFzdEZvY3VzT3JpZ2luKSB7XG4gICAgICAgIG9yaWdpbiA9IHRoaXMuX2xhc3RGb2N1c09yaWdpbjtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fd2FzQ2F1c2VkQnlUb3VjaChldmVudCkpIHtcbiAgICAgICAgb3JpZ2luID0gJ3RvdWNoJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9yaWdpbiA9ICdwcm9ncmFtJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9zZXRDbGFzc2VzKGVsZW1lbnQsIG9yaWdpbik7XG4gICAgdGhpcy5fZW1pdE9yaWdpbihlbGVtZW50SW5mby5zdWJqZWN0LCBvcmlnaW4pO1xuICAgIHRoaXMuX2xhc3RGb2N1c09yaWdpbiA9IG9yaWdpbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIGJsdXIgZXZlbnRzIG9uIGEgcmVnaXN0ZXJlZCBlbGVtZW50LlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIGJsdXIgZXZlbnQuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBtb25pdG9yZWQgZWxlbWVudC5cbiAgICovXG4gIF9vbkJsdXIoZXZlbnQ6IEZvY3VzRXZlbnQsIGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgLy8gSWYgd2UgYXJlIGNvdW50aW5nIGNoaWxkLWVsZW1lbnQtZm9jdXMgYXMgZm9jdXNlZCwgbWFrZSBzdXJlIHRoYXQgd2UgYXJlbid0IGp1c3QgYmx1cnJpbmcgaW5cbiAgICAvLyBvcmRlciB0byBmb2N1cyBhbm90aGVyIGNoaWxkIG9mIHRoZSBtb25pdG9yZWQgZWxlbWVudC5cbiAgICBjb25zdCBlbGVtZW50SW5mbyA9IHRoaXMuX2VsZW1lbnRJbmZvLmdldChlbGVtZW50KTtcblxuICAgIGlmICghZWxlbWVudEluZm8gfHwgKGVsZW1lbnRJbmZvLmNoZWNrQ2hpbGRyZW4gJiYgZXZlbnQucmVsYXRlZFRhcmdldCBpbnN0YW5jZW9mIE5vZGUgJiZcbiAgICAgICAgZWxlbWVudC5jb250YWlucyhldmVudC5yZWxhdGVkVGFyZ2V0KSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9zZXRDbGFzc2VzKGVsZW1lbnQpO1xuICAgIHRoaXMuX2VtaXRPcmlnaW4oZWxlbWVudEluZm8uc3ViamVjdCwgbnVsbCk7XG4gIH1cblxuICBwcml2YXRlIF9lbWl0T3JpZ2luKHN1YmplY3Q6IFN1YmplY3Q8Rm9jdXNPcmlnaW4+LCBvcmlnaW46IEZvY3VzT3JpZ2luKSB7XG4gICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiBzdWJqZWN0Lm5leHQob3JpZ2luKSk7XG4gIH1cblxuICBwcml2YXRlIF9pbmNyZW1lbnRNb25pdG9yZWRFbGVtZW50Q291bnQoKSB7XG4gICAgLy8gUmVnaXN0ZXIgZ2xvYmFsIGxpc3RlbmVycyB3aGVuIGZpcnN0IGVsZW1lbnQgaXMgbW9uaXRvcmVkLlxuICAgIGlmICgrK3RoaXMuX21vbml0b3JlZEVsZW1lbnRDb3VudCA9PSAxICYmIHRoaXMuX3BsYXRmb3JtLmlzQnJvd3Nlcikge1xuICAgICAgLy8gTm90ZTogd2UgbGlzdGVuIHRvIGV2ZW50cyBpbiB0aGUgY2FwdHVyZSBwaGFzZSBzbyB3ZVxuICAgICAgLy8gY2FuIGRldGVjdCB0aGVtIGV2ZW4gaWYgdGhlIHVzZXIgc3RvcHMgcHJvcGFnYXRpb24uXG4gICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fZG9jdW1lbnRLZXlkb3duTGlzdGVuZXIsXG4gICAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fZG9jdW1lbnRNb3VzZWRvd25MaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5fZG9jdW1lbnRUb3VjaHN0YXJ0TGlzdGVuZXIsXG4gICAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5fd2luZG93Rm9jdXNMaXN0ZW5lcik7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9kZWNyZW1lbnRNb25pdG9yZWRFbGVtZW50Q291bnQoKSB7XG4gICAgLy8gVW5yZWdpc3RlciBnbG9iYWwgbGlzdGVuZXJzIHdoZW4gbGFzdCBlbGVtZW50IGlzIHVubW9uaXRvcmVkLlxuICAgIGlmICghLS10aGlzLl9tb25pdG9yZWRFbGVtZW50Q291bnQpIHtcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9kb2N1bWVudEtleWRvd25MaXN0ZW5lcixcbiAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX2RvY3VtZW50TW91c2Vkb3duTGlzdGVuZXIsXG4gICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5fZG9jdW1lbnRUb3VjaHN0YXJ0TGlzdGVuZXIsXG4gICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignZm9jdXMnLCB0aGlzLl93aW5kb3dGb2N1c0xpc3RlbmVyKTtcblxuICAgICAgLy8gQ2xlYXIgdGltZW91dHMgZm9yIGFsbCBwb3RlbnRpYWxseSBwZW5kaW5nIHRpbWVvdXRzIHRvIHByZXZlbnQgdGhlIGxlYWtzLlxuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3dpbmRvd0ZvY3VzVGltZW91dElkKTtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl90b3VjaFRpbWVvdXRJZCk7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fb3JpZ2luVGltZW91dElkKTtcbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIERpcmVjdGl2ZSB0aGF0IGRldGVybWluZXMgaG93IGEgcGFydGljdWxhciBlbGVtZW50IHdhcyBmb2N1c2VkICh2aWEga2V5Ym9hcmQsIG1vdXNlLCB0b3VjaCwgb3JcbiAqIHByb2dyYW1tYXRpY2FsbHkpIGFuZCBhZGRzIGNvcnJlc3BvbmRpbmcgY2xhc3NlcyB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGVyZSBhcmUgdHdvIHZhcmlhbnRzIG9mIHRoaXMgZGlyZWN0aXZlOlxuICogMSkgY2RrTW9uaXRvckVsZW1lbnRGb2N1czogZG9lcyBub3QgY29uc2lkZXIgYW4gZWxlbWVudCB0byBiZSBmb2N1c2VkIGlmIG9uZSBvZiBpdHMgY2hpbGRyZW4gaXNcbiAqICAgIGZvY3VzZWQuXG4gKiAyKSBjZGtNb25pdG9yU3VidHJlZUZvY3VzOiBjb25zaWRlcnMgYW4gZWxlbWVudCBmb2N1c2VkIGlmIGl0IG9yIGFueSBvZiBpdHMgY2hpbGRyZW4gYXJlIGZvY3VzZWQuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtNb25pdG9yRWxlbWVudEZvY3VzXSwgW2Nka01vbml0b3JTdWJ0cmVlRm9jdXNdJyxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrTW9uaXRvckZvY3VzIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSBfbW9uaXRvclN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uO1xuICBAT3V0cHV0KCkgY2RrRm9jdXNDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPEZvY3VzT3JpZ2luPigpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2VsZW1lbnRSZWY6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LCBwcml2YXRlIF9mb2N1c01vbml0b3I6IEZvY3VzTW9uaXRvcikge1xuICAgIHRoaXMuX21vbml0b3JTdWJzY3JpcHRpb24gPSB0aGlzLl9mb2N1c01vbml0b3IubW9uaXRvcihcbiAgICAgICAgdGhpcy5fZWxlbWVudFJlZixcbiAgICAgICAgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50Lmhhc0F0dHJpYnV0ZSgnY2RrTW9uaXRvclN1YnRyZWVGb2N1cycpKVxuICAgICAgICAuc3Vic2NyaWJlKG9yaWdpbiA9PiB0aGlzLmNka0ZvY3VzQ2hhbmdlLmVtaXQob3JpZ2luKSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9mb2N1c01vbml0b3Iuc3RvcE1vbml0b3JpbmcodGhpcy5fZWxlbWVudFJlZik7XG4gICAgdGhpcy5fbW9uaXRvclN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICB9XG59XG5cbi8qKiBAZG9jcy1wcml2YXRlIEBkZXByZWNhdGVkIEBicmVha2luZy1jaGFuZ2UgOC4wLjAgKi9cbmV4cG9ydCBmdW5jdGlvbiBGT0NVU19NT05JVE9SX1BST1ZJREVSX0ZBQ1RPUlkoXG4gICAgcGFyZW50RGlzcGF0Y2hlcjogRm9jdXNNb25pdG9yLCBuZ1pvbmU6IE5nWm9uZSwgcGxhdGZvcm06IFBsYXRmb3JtKSB7XG4gIHJldHVybiBwYXJlbnREaXNwYXRjaGVyIHx8IG5ldyBGb2N1c01vbml0b3Iobmdab25lLCBwbGF0Zm9ybSk7XG59XG5cbi8qKiBAZG9jcy1wcml2YXRlIEBkZXByZWNhdGVkIEBicmVha2luZy1jaGFuZ2UgOC4wLjAgKi9cbmV4cG9ydCBjb25zdCBGT0NVU19NT05JVE9SX1BST1ZJREVSID0ge1xuICAvLyBJZiB0aGVyZSBpcyBhbHJlYWR5IGEgRm9jdXNNb25pdG9yIGF2YWlsYWJsZSwgdXNlIHRoYXQuIE90aGVyd2lzZSwgcHJvdmlkZSBhIG5ldyBvbmUuXG4gIHByb3ZpZGU6IEZvY3VzTW9uaXRvcixcbiAgZGVwczogW1tuZXcgT3B0aW9uYWwoKSwgbmV3IFNraXBTZWxmKCksIEZvY3VzTW9uaXRvcl0sIE5nWm9uZSwgUGxhdGZvcm1dLFxuICB1c2VGYWN0b3J5OiBGT0NVU19NT05JVE9SX1BST1ZJREVSX0ZBQ1RPUllcbn07XG4iXX0=