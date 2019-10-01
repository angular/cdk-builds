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
export var TOUCH_BUFFER_MS = 650;
/**
 * Event listener options that enable capturing and also
 * mark the listener as passive if the browser supports it.
 */
var captureEventListenerOptions = normalizePassiveListenerOptions({
    passive: true,
    capture: true
});
/** Monitors mouse and keyboard events to determine the cause of focus events. */
var FocusMonitor = /** @class */ (function () {
    function FocusMonitor(_ngZone, _platform) {
        var _this = this;
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
         * Event listener for `keydown` events on the document.
         * Needs to be an arrow function in order to preserve the context when it gets bound.
         */
        this._documentKeydownListener = function () {
            // On keydown record the origin and clear any touch event that may be in progress.
            _this._lastTouchTarget = null;
            _this._setOriginForCurrentEventQueue('keyboard');
        };
        /**
         * Event listener for `mousedown` events on the document.
         * Needs to be an arrow function in order to preserve the context when it gets bound.
         */
        this._documentMousedownListener = function () {
            // On mousedown record the origin only if there is not touch
            // target, since a mousedown can happen as a result of a touch event.
            if (!_this._lastTouchTarget) {
                _this._setOriginForCurrentEventQueue('mouse');
            }
        };
        /**
         * Event listener for `touchstart` events on the document.
         * Needs to be an arrow function in order to preserve the context when it gets bound.
         */
        this._documentTouchstartListener = function (event) {
            // When the touchstart event fires the focus event is not yet in the event queue. This means
            // we can't rely on the trick used above (setting timeout of 1ms). Instead we wait 650ms to
            // see if a focus happens.
            if (_this._touchTimeoutId != null) {
                clearTimeout(_this._touchTimeoutId);
            }
            _this._lastTouchTarget = event.target;
            _this._touchTimeoutId = setTimeout(function () { return _this._lastTouchTarget = null; }, TOUCH_BUFFER_MS);
        };
        /**
         * Event listener for `focus` events on the window.
         * Needs to be an arrow function in order to preserve the context when it gets bound.
         */
        this._windowFocusListener = function () {
            // Make a note of when the window regains focus, so we can
            // restore the origin info for the focused element.
            _this._windowFocused = true;
            _this._windowFocusTimeoutId = setTimeout(function () { return _this._windowFocused = false; });
        };
    }
    FocusMonitor.prototype.monitor = function (element, checkChildren) {
        var _this = this;
        if (checkChildren === void 0) { checkChildren = false; }
        // Do nothing if we're not on the browser platform.
        if (!this._platform.isBrowser) {
            return observableOf(null);
        }
        var nativeElement = coerceElement(element);
        // Check if we're already monitoring this element.
        if (this._elementInfo.has(nativeElement)) {
            var cachedInfo = this._elementInfo.get(nativeElement);
            cachedInfo.checkChildren = checkChildren;
            return cachedInfo.subject.asObservable();
        }
        // Create monitored element info.
        var info = {
            unlisten: function () { },
            checkChildren: checkChildren,
            subject: new Subject()
        };
        this._elementInfo.set(nativeElement, info);
        this._incrementMonitoredElementCount();
        // Start listening. We need to listen in capture phase since focus events don't bubble.
        var focusListener = function (event) { return _this._onFocus(event, nativeElement); };
        var blurListener = function (event) { return _this._onBlur(event, nativeElement); };
        this._ngZone.runOutsideAngular(function () {
            nativeElement.addEventListener('focus', focusListener, true);
            nativeElement.addEventListener('blur', blurListener, true);
        });
        // Create an unlisten function for later.
        info.unlisten = function () {
            nativeElement.removeEventListener('focus', focusListener, true);
            nativeElement.removeEventListener('blur', blurListener, true);
        };
        return info.subject.asObservable();
    };
    FocusMonitor.prototype.stopMonitoring = function (element) {
        var nativeElement = coerceElement(element);
        var elementInfo = this._elementInfo.get(nativeElement);
        if (elementInfo) {
            elementInfo.unlisten();
            elementInfo.subject.complete();
            this._setClasses(nativeElement);
            this._elementInfo.delete(nativeElement);
            this._decrementMonitoredElementCount();
        }
    };
    FocusMonitor.prototype.focusVia = function (element, origin, options) {
        var nativeElement = coerceElement(element);
        this._setOriginForCurrentEventQueue(origin);
        // `focus` isn't available on the server
        if (typeof nativeElement.focus === 'function') {
            // Cast the element to `any`, because the TS typings don't have the `options` parameter yet.
            nativeElement.focus(options);
        }
    };
    FocusMonitor.prototype.ngOnDestroy = function () {
        var _this = this;
        this._elementInfo.forEach(function (_info, element) { return _this.stopMonitoring(element); });
    };
    FocusMonitor.prototype._toggleClass = function (element, className, shouldSet) {
        if (shouldSet) {
            element.classList.add(className);
        }
        else {
            element.classList.remove(className);
        }
    };
    /**
     * Sets the focus classes on the element based on the given focus origin.
     * @param element The element to update the classes on.
     * @param origin The focus origin.
     */
    FocusMonitor.prototype._setClasses = function (element, origin) {
        var elementInfo = this._elementInfo.get(element);
        if (elementInfo) {
            this._toggleClass(element, 'cdk-focused', !!origin);
            this._toggleClass(element, 'cdk-touch-focused', origin === 'touch');
            this._toggleClass(element, 'cdk-keyboard-focused', origin === 'keyboard');
            this._toggleClass(element, 'cdk-mouse-focused', origin === 'mouse');
            this._toggleClass(element, 'cdk-program-focused', origin === 'program');
        }
    };
    /**
     * Sets the origin and schedules an async function to clear it at the end of the event queue.
     * @param origin The origin to set.
     */
    FocusMonitor.prototype._setOriginForCurrentEventQueue = function (origin) {
        var _this = this;
        this._ngZone.runOutsideAngular(function () {
            _this._origin = origin;
            // Sometimes the focus origin won't be valid in Firefox because Firefox seems to focus *one*
            // tick after the interaction event fired. To ensure the focus origin is always correct,
            // the focus origin will be determined at the beginning of the next tick.
            _this._originTimeoutId = setTimeout(function () { return _this._origin = null; }, 1);
        });
    };
    /**
     * Checks whether the given focus event was caused by a touchstart event.
     * @param event The focus event to check.
     * @returns Whether the event was caused by a touch.
     */
    FocusMonitor.prototype._wasCausedByTouch = function (event) {
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
        var focusTarget = event.target;
        return this._lastTouchTarget instanceof Node && focusTarget instanceof Node &&
            (focusTarget === this._lastTouchTarget || focusTarget.contains(this._lastTouchTarget));
    };
    /**
     * Handles focus events on a registered element.
     * @param event The focus event.
     * @param element The monitored element.
     */
    FocusMonitor.prototype._onFocus = function (event, element) {
        // NOTE(mmalerba): We currently set the classes based on the focus origin of the most recent
        // focus event affecting the monitored element. If we want to use the origin of the first event
        // instead we should check for the cdk-focused class here and return if the element already has
        // it. (This only matters for elements that have includesChildren = true).
        // If we are not counting child-element-focus as focused, make sure that the event target is the
        // monitored element itself.
        var elementInfo = this._elementInfo.get(element);
        if (!elementInfo || (!elementInfo.checkChildren && element !== event.target)) {
            return;
        }
        // If we couldn't detect a cause for the focus event, it's due to one of three reasons:
        // 1) The window has just regained focus, in which case we want to restore the focused state of
        //    the element from before the window blurred.
        // 2) It was caused by a touch event, in which case we mark the origin as 'touch'.
        // 3) The element was programmatically focused, in which case we should mark the origin as
        //    'program'.
        var origin = this._origin;
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
    };
    /**
     * Handles blur events on a registered element.
     * @param event The blur event.
     * @param element The monitored element.
     */
    FocusMonitor.prototype._onBlur = function (event, element) {
        // If we are counting child-element-focus as focused, make sure that we aren't just blurring in
        // order to focus another child of the monitored element.
        var elementInfo = this._elementInfo.get(element);
        if (!elementInfo || (elementInfo.checkChildren && event.relatedTarget instanceof Node &&
            element.contains(event.relatedTarget))) {
            return;
        }
        this._setClasses(element);
        this._emitOrigin(elementInfo.subject, null);
    };
    FocusMonitor.prototype._emitOrigin = function (subject, origin) {
        this._ngZone.run(function () { return subject.next(origin); });
    };
    FocusMonitor.prototype._incrementMonitoredElementCount = function () {
        var _this = this;
        // Register global listeners when first element is monitored.
        if (++this._monitoredElementCount == 1 && this._platform.isBrowser) {
            // Note: we listen to events in the capture phase so we
            // can detect them even if the user stops propagation.
            this._ngZone.runOutsideAngular(function () {
                document.addEventListener('keydown', _this._documentKeydownListener, captureEventListenerOptions);
                document.addEventListener('mousedown', _this._documentMousedownListener, captureEventListenerOptions);
                document.addEventListener('touchstart', _this._documentTouchstartListener, captureEventListenerOptions);
                window.addEventListener('focus', _this._windowFocusListener);
            });
        }
    };
    FocusMonitor.prototype._decrementMonitoredElementCount = function () {
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
    };
    FocusMonitor.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    /** @nocollapse */
    FocusMonitor.ctorParameters = function () { return [
        { type: NgZone },
        { type: Platform }
    ]; };
    FocusMonitor.ngInjectableDef = i0.ɵɵdefineInjectable({ factory: function FocusMonitor_Factory() { return new FocusMonitor(i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i1.Platform)); }, token: FocusMonitor, providedIn: "root" });
    return FocusMonitor;
}());
export { FocusMonitor };
/**
 * Directive that determines how a particular element was focused (via keyboard, mouse, touch, or
 * programmatically) and adds corresponding classes to the element.
 *
 * There are two variants of this directive:
 * 1) cdkMonitorElementFocus: does not consider an element to be focused if one of its children is
 *    focused.
 * 2) cdkMonitorSubtreeFocus: considers an element focused if it or any of its children are focused.
 */
var CdkMonitorFocus = /** @class */ (function () {
    function CdkMonitorFocus(_elementRef, _focusMonitor) {
        var _this = this;
        this._elementRef = _elementRef;
        this._focusMonitor = _focusMonitor;
        this.cdkFocusChange = new EventEmitter();
        this._monitorSubscription = this._focusMonitor.monitor(this._elementRef, this._elementRef.nativeElement.hasAttribute('cdkMonitorSubtreeFocus'))
            .subscribe(function (origin) { return _this.cdkFocusChange.emit(origin); });
    }
    CdkMonitorFocus.prototype.ngOnDestroy = function () {
        this._focusMonitor.stopMonitoring(this._elementRef);
        this._monitorSubscription.unsubscribe();
    };
    CdkMonitorFocus.decorators = [
        { type: Directive, args: [{
                    selector: '[cdkMonitorElementFocus], [cdkMonitorSubtreeFocus]',
                },] }
    ];
    /** @nocollapse */
    CdkMonitorFocus.ctorParameters = function () { return [
        { type: ElementRef },
        { type: FocusMonitor }
    ]; };
    CdkMonitorFocus.propDecorators = {
        cdkFocusChange: [{ type: Output }]
    };
    return CdkMonitorFocus;
}());
export { CdkMonitorFocus };
/** @docs-private @deprecated @breaking-change 8.0.0 */
export function FOCUS_MONITOR_PROVIDER_FACTORY(parentDispatcher, ngZone, platform) {
    return parentDispatcher || new FocusMonitor(ngZone, platform);
}
/** @docs-private @deprecated @breaking-change 8.0.0 */
export var FOCUS_MONITOR_PROVIDER = {
    // If there is already a FocusMonitor available, use that. Otherwise, provide a new one.
    provide: FocusMonitor,
    deps: [[new Optional(), new SkipSelf(), FocusMonitor], NgZone, Platform],
    useFactory: FOCUS_MONITOR_PROVIDER_FACTORY
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXMtbW9uaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvYTExeS9mb2N1cy1tb25pdG9yL2ZvY3VzLW1vbml0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBRSwrQkFBK0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2hGLE9BQU8sRUFDTCxTQUFTLEVBQ1QsVUFBVSxFQUNWLFlBQVksRUFDWixVQUFVLEVBQ1YsTUFBTSxFQUVOLFFBQVEsRUFDUixNQUFNLEVBQ04sUUFBUSxHQUNULE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBYSxFQUFFLElBQUksWUFBWSxFQUFFLE9BQU8sRUFBZSxNQUFNLE1BQU0sQ0FBQztBQUMzRSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7OztBQUdwRCxrR0FBa0c7QUFDbEcsa0RBQWtEO0FBQ2xELE1BQU0sQ0FBQyxJQUFNLGVBQWUsR0FBRyxHQUFHLENBQUM7QUFvQm5DOzs7R0FHRztBQUNILElBQU0sMkJBQTJCLEdBQUcsK0JBQStCLENBQUM7SUFDbEUsT0FBTyxFQUFFLElBQUk7SUFDYixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUMsQ0FBQztBQUdILGlGQUFpRjtBQUNqRjtJQTZFRSxzQkFBb0IsT0FBZSxFQUFVLFNBQW1CO1FBQWhFLGlCQUFvRTtRQUFoRCxZQUFPLEdBQVAsT0FBTyxDQUFRO1FBQVUsY0FBUyxHQUFULFNBQVMsQ0FBVTtRQTNFaEUsaUVBQWlFO1FBQ3pELFlBQU8sR0FBZ0IsSUFBSSxDQUFDO1FBS3BDLGdEQUFnRDtRQUN4QyxtQkFBYyxHQUFHLEtBQUssQ0FBQztRQWMvQixxREFBcUQ7UUFDN0MsaUJBQVksR0FBRyxJQUFJLEdBQUcsRUFBcUMsQ0FBQztRQUVwRSx3REFBd0Q7UUFDaEQsMkJBQXNCLEdBQUcs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SSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLHdCQUF3QixDQUFDLENBQUM7YUFDckUsU0FBUyxDQUFDLFVBQUEsTUFBTSxJQUFJLE9BQUEsS0FBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQWhDLENBQWdDLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRUQscUNBQVcsR0FBWDtRQUNFLElBQUksQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNwRCxJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDMUMsQ0FBQzs7Z0JBakJGLFNBQVMsU0FBQztvQkFDVCxRQUFRLEVBQUUsb0RBQW9EO2lCQUMvRDs7OztnQkF4YUMsVUFBVTtnQkE2YXVFLFlBQVk7OztpQ0FGNUYsTUFBTTs7SUFhVCxzQkFBQztDQUFBLEFBbEJELElBa0JDO1NBZlksZUFBZTtBQWlCNUIsdURBQXVEO0FBQ3ZELE1BQU0sVUFBVSw4QkFBOEIsQ0FDMUMsZ0JBQThCLEVBQUUsTUFBYyxFQUFFLFFBQWtCO0lBQ3BFLE9BQU8sZ0JBQWdCLElBQUksSUFBSSxZQUFZLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ2hFLENBQUM7QUFFRCx1REFBdUQ7QUFDdkQsTUFBTSxDQUFDLElBQU0sc0JBQXNCLEdBQUc7SUFDcEMsd0ZBQXdGO0lBQ3hGLE9BQU8sRUFBRSxZQUFZO0lBQ3JCLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxRQUFRLEVBQUUsRUFBRSxJQUFJLFFBQVEsRUFBRSxFQUFFLFlBQVksQ0FBQyxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUM7SUFDeEUsVUFBVSxFQUFFLDhCQUE4QjtDQUMzQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UGxhdGZvcm0sIG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnN9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5qZWN0YWJsZSxcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIE9wdGlvbmFsLFxuICBPdXRwdXQsXG4gIFNraXBTZWxmLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgb2YgYXMgb2JzZXJ2YWJsZU9mLCBTdWJqZWN0LCBTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtjb2VyY2VFbGVtZW50fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuXG5cbi8vIFRoaXMgaXMgdGhlIHZhbHVlIHVzZWQgYnkgQW5ndWxhckpTIE1hdGVyaWFsLiBUaHJvdWdoIHRyaWFsIGFuZCBlcnJvciAob24gaVBob25lIDZTKSB0aGV5IGZvdW5kXG4vLyB0aGF0IGEgdmFsdWUgb2YgYXJvdW5kIDY1MG1zIHNlZW1zIGFwcHJvcHJpYXRlLlxuZXhwb3J0IGNvbnN0IFRPVUNIX0JVRkZFUl9NUyA9IDY1MDtcblxuXG5leHBvcnQgdHlwZSBGb2N1c09yaWdpbiA9ICd0b3VjaCcgfCAnbW91c2UnIHwgJ2tleWJvYXJkJyB8ICdwcm9ncmFtJyB8IG51bGw7XG5cbi8qKlxuICogQ29ycmVzcG9uZHMgdG8gdGhlIG9wdGlvbnMgdGhhdCBjYW4gYmUgcGFzc2VkIHRvIHRoZSBuYXRpdmUgYGZvY3VzYCBldmVudC5cbiAqIHZpYSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvSFRNTEVsZW1lbnQvZm9jdXNcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBGb2N1c09wdGlvbnMge1xuICAvKiogV2hldGhlciB0aGUgYnJvd3NlciBzaG91bGQgc2Nyb2xsIHRvIHRoZSBlbGVtZW50IHdoZW4gaXQgaXMgZm9jdXNlZC4gKi9cbiAgcHJldmVudFNjcm9sbD86IGJvb2xlYW47XG59XG5cbnR5cGUgTW9uaXRvcmVkRWxlbWVudEluZm8gPSB7XG4gIHVubGlzdGVuOiBGdW5jdGlvbixcbiAgY2hlY2tDaGlsZHJlbjogYm9vbGVhbixcbiAgc3ViamVjdDogU3ViamVjdDxGb2N1c09yaWdpbj5cbn07XG5cbi8qKlxuICogRXZlbnQgbGlzdGVuZXIgb3B0aW9ucyB0aGF0IGVuYWJsZSBjYXB0dXJpbmcgYW5kIGFsc29cbiAqIG1hcmsgdGhlIGxpc3RlbmVyIGFzIHBhc3NpdmUgaWYgdGhlIGJyb3dzZXIgc3VwcG9ydHMgaXQuXG4gKi9cbmNvbnN0IGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyA9IG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMoe1xuICBwYXNzaXZlOiB0cnVlLFxuICBjYXB0dXJlOiB0cnVlXG59KTtcblxuXG4vKiogTW9uaXRvcnMgbW91c2UgYW5kIGtleWJvYXJkIGV2ZW50cyB0byBkZXRlcm1pbmUgdGhlIGNhdXNlIG9mIGZvY3VzIGV2ZW50cy4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIEZvY3VzTW9uaXRvciBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qKiBUaGUgZm9jdXMgb3JpZ2luIHRoYXQgdGhlIG5leHQgZm9jdXMgZXZlbnQgaXMgYSByZXN1bHQgb2YuICovXG4gIHByaXZhdGUgX29yaWdpbjogRm9jdXNPcmlnaW4gPSBudWxsO1xuXG4gIC8qKiBUaGUgRm9jdXNPcmlnaW4gb2YgdGhlIGxhc3QgZm9jdXMgZXZlbnQgdHJhY2tlZCBieSB0aGUgRm9jdXNNb25pdG9yLiAqL1xuICBwcml2YXRlIF9sYXN0Rm9jdXNPcmlnaW46IEZvY3VzT3JpZ2luO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSB3aW5kb3cgaGFzIGp1c3QgYmVlbiBmb2N1c2VkLiAqL1xuICBwcml2YXRlIF93aW5kb3dGb2N1c2VkID0gZmFsc2U7XG5cbiAgLyoqIFRoZSB0YXJnZXQgb2YgdGhlIGxhc3QgdG91Y2ggZXZlbnQuICovXG4gIHByaXZhdGUgX2xhc3RUb3VjaFRhcmdldDogRXZlbnRUYXJnZXQgfCBudWxsO1xuXG4gIC8qKiBUaGUgdGltZW91dCBpZCBvZiB0aGUgdG91Y2ggdGltZW91dCwgdXNlZCB0byBjYW5jZWwgdGltZW91dCBsYXRlci4gKi9cbiAgcHJpdmF0ZSBfdG91Y2hUaW1lb3V0SWQ6IG51bWJlcjtcblxuICAvKiogVGhlIHRpbWVvdXQgaWQgb2YgdGhlIHdpbmRvdyBmb2N1cyB0aW1lb3V0LiAqL1xuICBwcml2YXRlIF93aW5kb3dGb2N1c1RpbWVvdXRJZDogbnVtYmVyO1xuXG4gIC8qKiBUaGUgdGltZW91dCBpZCBvZiB0aGUgb3JpZ2luIGNsZWFyaW5nIHRpbWVvdXQuICovXG4gIHByaXZhdGUgX29yaWdpblRpbWVvdXRJZDogbnVtYmVyO1xuXG4gIC8qKiBNYXAgb2YgZWxlbWVudHMgYmVpbmcgbW9uaXRvcmVkIHRvIHRoZWlyIGluZm8uICovXG4gIHByaXZhdGUgX2VsZW1lbnRJbmZvID0gbmV3IE1hcDxIVE1MRWxlbWVudCwgTW9uaXRvcmVkRWxlbWVudEluZm8+KCk7XG5cbiAgLyoqIFRoZSBudW1iZXIgb2YgZWxlbWVudHMgY3VycmVudGx5IGJlaW5nIG1vbml0b3JlZC4gKi9cbiAgcHJpdmF0ZSBfbW9uaXRvcmVkRWxlbWVudENvdW50ID0gMDtcblxuICAvKipcbiAgICogRXZlbnQgbGlzdGVuZXIgZm9yIGBrZXlkb3duYCBldmVudHMgb24gdGhlIGRvY3VtZW50LlxuICAgKiBOZWVkcyB0byBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0IGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF9kb2N1bWVudEtleWRvd25MaXN0ZW5lciA9ICgpID0+IHtcbiAgICAvLyBPbiBrZXlkb3duIHJlY29yZCB0aGUgb3JpZ2luIGFuZCBjbGVhciBhbnkgdG91Y2ggZXZlbnQgdGhhdCBtYXkgYmUgaW4gcHJvZ3Jlc3MuXG4gICAgdGhpcy5fbGFzdFRvdWNoVGFyZ2V0ID0gbnVsbDtcbiAgICB0aGlzLl9zZXRPcmlnaW5Gb3JDdXJyZW50RXZlbnRRdWV1ZSgna2V5Ym9hcmQnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFdmVudCBsaXN0ZW5lciBmb3IgYG1vdXNlZG93bmAgZXZlbnRzIG9uIHRoZSBkb2N1bWVudC5cbiAgICogTmVlZHMgdG8gYmUgYW4gYXJyb3cgZnVuY3Rpb24gaW4gb3JkZXIgdG8gcHJlc2VydmUgdGhlIGNvbnRleHQgd2hlbiBpdCBnZXRzIGJvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfZG9jdW1lbnRNb3VzZWRvd25MaXN0ZW5lciA9ICgpID0+IHtcbiAgICAvLyBPbiBtb3VzZWRvd24gcmVjb3JkIHRoZSBvcmlnaW4gb25seSBpZiB0aGVyZSBpcyBub3QgdG91Y2hcbiAgICAvLyB0YXJnZXQsIHNpbmNlIGEgbW91c2Vkb3duIGNhbiBoYXBwZW4gYXMgYSByZXN1bHQgb2YgYSB0b3VjaCBldmVudC5cbiAgICBpZiAoIXRoaXMuX2xhc3RUb3VjaFRhcmdldCkge1xuICAgICAgdGhpcy5fc2V0T3JpZ2luRm9yQ3VycmVudEV2ZW50UXVldWUoJ21vdXNlJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEV2ZW50IGxpc3RlbmVyIGZvciBgdG91Y2hzdGFydGAgZXZlbnRzIG9uIHRoZSBkb2N1bWVudC5cbiAgICogTmVlZHMgdG8gYmUgYW4gYXJyb3cgZnVuY3Rpb24gaW4gb3JkZXIgdG8gcHJlc2VydmUgdGhlIGNvbnRleHQgd2hlbiBpdCBnZXRzIGJvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfZG9jdW1lbnRUb3VjaHN0YXJ0TGlzdGVuZXIgPSAoZXZlbnQ6IFRvdWNoRXZlbnQpID0+IHtcbiAgICAvLyBXaGVuIHRoZSB0b3VjaHN0YXJ0IGV2ZW50IGZpcmVzIHRoZSBmb2N1cyBldmVudCBpcyBub3QgeWV0IGluIHRoZSBldmVudCBxdWV1ZS4gVGhpcyBtZWFuc1xuICAgIC8vIHdlIGNhbid0IHJlbHkgb24gdGhlIHRyaWNrIHVzZWQgYWJvdmUgKHNldHRpbmcgdGltZW91dCBvZiAxbXMpLiBJbnN0ZWFkIHdlIHdhaXQgNjUwbXMgdG9cbiAgICAvLyBzZWUgaWYgYSBmb2N1cyBoYXBwZW5zLlxuICAgIGlmICh0aGlzLl90b3VjaFRpbWVvdXRJZCAhPSBudWxsKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fdG91Y2hUaW1lb3V0SWQpO1xuICAgIH1cbiAgICB0aGlzLl9sYXN0VG91Y2hUYXJnZXQgPSBldmVudC50YXJnZXQ7XG4gICAgdGhpcy5fdG91Y2hUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX2xhc3RUb3VjaFRhcmdldCA9IG51bGwsIFRPVUNIX0JVRkZFUl9NUyk7XG4gIH1cblxuICAvKipcbiAgICogRXZlbnQgbGlzdGVuZXIgZm9yIGBmb2N1c2AgZXZlbnRzIG9uIHRoZSB3aW5kb3cuXG4gICAqIE5lZWRzIHRvIGJlIGFuIGFycm93IGZ1bmN0aW9uIGluIG9yZGVyIHRvIHByZXNlcnZlIHRoZSBjb250ZXh0IHdoZW4gaXQgZ2V0cyBib3VuZC5cbiAgICovXG4gIHByaXZhdGUgX3dpbmRvd0ZvY3VzTGlzdGVuZXIgPSAoKSA9PiB7XG4gICAgLy8gTWFrZSBhIG5vdGUgb2Ygd2hlbiB0aGUgd2luZG93IHJlZ2FpbnMgZm9jdXMsIHNvIHdlIGNhblxuICAgIC8vIHJlc3RvcmUgdGhlIG9yaWdpbiBpbmZvIGZvciB0aGUgZm9jdXNlZCBlbGVtZW50LlxuICAgIHRoaXMuX3dpbmRvd0ZvY3VzZWQgPSB0cnVlO1xuICAgIHRoaXMuX3dpbmRvd0ZvY3VzVGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLl93aW5kb3dGb2N1c2VkID0gZmFsc2UpO1xuICB9XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsIHByaXZhdGUgX3BsYXRmb3JtOiBQbGF0Zm9ybSkge31cblxuICAvKipcbiAgICogTW9uaXRvcnMgZm9jdXMgb24gYW4gZWxlbWVudCBhbmQgYXBwbGllcyBhcHByb3ByaWF0ZSBDU1MgY2xhc3Nlcy5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gbW9uaXRvclxuICAgKiBAcGFyYW0gY2hlY2tDaGlsZHJlbiBXaGV0aGVyIHRvIGNvdW50IHRoZSBlbGVtZW50IGFzIGZvY3VzZWQgd2hlbiBpdHMgY2hpbGRyZW4gYXJlIGZvY3VzZWQuXG4gICAqIEByZXR1cm5zIEFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB3aGVuIHRoZSBmb2N1cyBzdGF0ZSBvZiB0aGUgZWxlbWVudCBjaGFuZ2VzLlxuICAgKiAgICAgV2hlbiB0aGUgZWxlbWVudCBpcyBibHVycmVkLCBudWxsIHdpbGwgYmUgZW1pdHRlZC5cbiAgICovXG4gIG1vbml0b3IoZWxlbWVudDogSFRNTEVsZW1lbnQsIGNoZWNrQ2hpbGRyZW4/OiBib29sZWFuKTogT2JzZXJ2YWJsZTxGb2N1c09yaWdpbj47XG5cbiAgLyoqXG4gICAqIE1vbml0b3JzIGZvY3VzIG9uIGFuIGVsZW1lbnQgYW5kIGFwcGxpZXMgYXBwcm9wcmlhdGUgQ1NTIGNsYXNzZXMuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIG1vbml0b3JcbiAgICogQHBhcmFtIGNoZWNrQ2hpbGRyZW4gV2hldGhlciB0byBjb3VudCB0aGUgZWxlbWVudCBhcyBmb2N1c2VkIHdoZW4gaXRzIGNoaWxkcmVuIGFyZSBmb2N1c2VkLlxuICAgKiBAcmV0dXJucyBBbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgd2hlbiB0aGUgZm9jdXMgc3RhdGUgb2YgdGhlIGVsZW1lbnQgY2hhbmdlcy5cbiAgICogICAgIFdoZW4gdGhlIGVsZW1lbnQgaXMgYmx1cnJlZCwgbnVsbCB3aWxsIGJlIGVtaXR0ZWQuXG4gICAqL1xuICBtb25pdG9yKGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LCBjaGVja0NoaWxkcmVuPzogYm9vbGVhbik6IE9ic2VydmFibGU8Rm9jdXNPcmlnaW4+O1xuXG4gIG1vbml0b3IoZWxlbWVudDogSFRNTEVsZW1lbnQgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICAgICAgICBjaGVja0NoaWxkcmVuOiBib29sZWFuID0gZmFsc2UpOiBPYnNlcnZhYmxlPEZvY3VzT3JpZ2luPiB7XG4gICAgLy8gRG8gbm90aGluZyBpZiB3ZSdyZSBub3Qgb24gdGhlIGJyb3dzZXIgcGxhdGZvcm0uXG4gICAgaWYgKCF0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIpIHtcbiAgICAgIHJldHVybiBvYnNlcnZhYmxlT2YobnVsbCk7XG4gICAgfVxuXG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoZWxlbWVudCk7XG5cbiAgICAvLyBDaGVjayBpZiB3ZSdyZSBhbHJlYWR5IG1vbml0b3JpbmcgdGhpcyBlbGVtZW50LlxuICAgIGlmICh0aGlzLl9lbGVtZW50SW5mby5oYXMobmF0aXZlRWxlbWVudCkpIHtcbiAgICAgIGxldCBjYWNoZWRJbmZvID0gdGhpcy5fZWxlbWVudEluZm8uZ2V0KG5hdGl2ZUVsZW1lbnQpO1xuICAgICAgY2FjaGVkSW5mbyEuY2hlY2tDaGlsZHJlbiA9IGNoZWNrQ2hpbGRyZW47XG4gICAgICByZXR1cm4gY2FjaGVkSW5mbyEuc3ViamVjdC5hc09ic2VydmFibGUoKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgbW9uaXRvcmVkIGVsZW1lbnQgaW5mby5cbiAgICBsZXQgaW5mbzogTW9uaXRvcmVkRWxlbWVudEluZm8gPSB7XG4gICAgICB1bmxpc3RlbjogKCkgPT4ge30sXG4gICAgICBjaGVja0NoaWxkcmVuOiBjaGVja0NoaWxkcmVuLFxuICAgICAgc3ViamVjdDogbmV3IFN1YmplY3Q8Rm9jdXNPcmlnaW4+KClcbiAgICB9O1xuICAgIHRoaXMuX2VsZW1lbnRJbmZvLnNldChuYXRpdmVFbGVtZW50LCBpbmZvKTtcbiAgICB0aGlzLl9pbmNyZW1lbnRNb25pdG9yZWRFbGVtZW50Q291bnQoKTtcblxuICAgIC8vIFN0YXJ0IGxpc3RlbmluZy4gV2UgbmVlZCB0byBsaXN0ZW4gaW4gY2FwdHVyZSBwaGFzZSBzaW5jZSBmb2N1cyBldmVudHMgZG9uJ3QgYnViYmxlLlxuICAgIGxldCBmb2N1c0xpc3RlbmVyID0gKGV2ZW50OiBGb2N1c0V2ZW50KSA9PiB0aGlzLl9vbkZvY3VzKGV2ZW50LCBuYXRpdmVFbGVtZW50KTtcbiAgICBsZXQgYmx1ckxpc3RlbmVyID0gKGV2ZW50OiBGb2N1c0V2ZW50KSA9PiB0aGlzLl9vbkJsdXIoZXZlbnQsIG5hdGl2ZUVsZW1lbnQpO1xuICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICBuYXRpdmVFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgZm9jdXNMaXN0ZW5lciwgdHJ1ZSk7XG4gICAgICBuYXRpdmVFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCBibHVyTGlzdGVuZXIsIHRydWUpO1xuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIGFuIHVubGlzdGVuIGZ1bmN0aW9uIGZvciBsYXRlci5cbiAgICBpbmZvLnVubGlzdGVuID0gKCkgPT4ge1xuICAgICAgbmF0aXZlRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1cycsIGZvY3VzTGlzdGVuZXIsIHRydWUpO1xuICAgICAgbmF0aXZlRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdibHVyJywgYmx1ckxpc3RlbmVyLCB0cnVlKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGluZm8uc3ViamVjdC5hc09ic2VydmFibGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9wcyBtb25pdG9yaW5nIGFuIGVsZW1lbnQgYW5kIHJlbW92ZXMgYWxsIGZvY3VzIGNsYXNzZXMuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHN0b3AgbW9uaXRvcmluZy5cbiAgICovXG4gIHN0b3BNb25pdG9yaW5nKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogdm9pZDtcblxuICAvKipcbiAgICogU3RvcHMgbW9uaXRvcmluZyBhbiBlbGVtZW50IGFuZCByZW1vdmVzIGFsbCBmb2N1cyBjbGFzc2VzLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBzdG9wIG1vbml0b3JpbmcuXG4gICAqL1xuICBzdG9wTW9uaXRvcmluZyhlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50Pik6IHZvaWQ7XG5cbiAgc3RvcE1vbml0b3JpbmcoZWxlbWVudDogSFRNTEVsZW1lbnQgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50Pik6IHZvaWQge1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnQpO1xuICAgIGNvbnN0IGVsZW1lbnRJbmZvID0gdGhpcy5fZWxlbWVudEluZm8uZ2V0KG5hdGl2ZUVsZW1lbnQpO1xuXG4gICAgaWYgKGVsZW1lbnRJbmZvKSB7XG4gICAgICBlbGVtZW50SW5mby51bmxpc3RlbigpO1xuICAgICAgZWxlbWVudEluZm8uc3ViamVjdC5jb21wbGV0ZSgpO1xuXG4gICAgICB0aGlzLl9zZXRDbGFzc2VzKG5hdGl2ZUVsZW1lbnQpO1xuICAgICAgdGhpcy5fZWxlbWVudEluZm8uZGVsZXRlKG5hdGl2ZUVsZW1lbnQpO1xuICAgICAgdGhpcy5fZGVjcmVtZW50TW9uaXRvcmVkRWxlbWVudENvdW50KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEZvY3VzZXMgdGhlIGVsZW1lbnQgdmlhIHRoZSBzcGVjaWZpZWQgZm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IHRvIGZvY3VzLlxuICAgKiBAcGFyYW0gb3JpZ2luIEZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIHRvIGNvbmZpZ3VyZSB0aGUgZm9jdXMgYmVoYXZpb3IuXG4gICAqL1xuICBmb2N1c1ZpYShlbGVtZW50OiBIVE1MRWxlbWVudCwgb3JpZ2luOiBGb2N1c09yaWdpbiwgb3B0aW9ucz86IEZvY3VzT3B0aW9ucyk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEZvY3VzZXMgdGhlIGVsZW1lbnQgdmlhIHRoZSBzcGVjaWZpZWQgZm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IHRvIGZvY3VzLlxuICAgKiBAcGFyYW0gb3JpZ2luIEZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIHRvIGNvbmZpZ3VyZSB0aGUgZm9jdXMgYmVoYXZpb3IuXG4gICAqL1xuICBmb2N1c1ZpYShlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50Piwgb3JpZ2luOiBGb2N1c09yaWdpbiwgb3B0aW9ucz86IEZvY3VzT3B0aW9ucyk6IHZvaWQ7XG5cbiAgZm9jdXNWaWEoZWxlbWVudDogSFRNTEVsZW1lbnQgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICAgICAgICBvcmlnaW46IEZvY3VzT3JpZ2luLFxuICAgICAgICAgIG9wdGlvbnM/OiBGb2N1c09wdGlvbnMpOiB2b2lkIHtcblxuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnQpO1xuXG4gICAgdGhpcy5fc2V0T3JpZ2luRm9yQ3VycmVudEV2ZW50UXVldWUob3JpZ2luKTtcblxuICAgIC8vIGBmb2N1c2AgaXNuJ3QgYXZhaWxhYmxlIG9uIHRoZSBzZXJ2ZXJcbiAgICBpZiAodHlwZW9mIG5hdGl2ZUVsZW1lbnQuZm9jdXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIENhc3QgdGhlIGVsZW1lbnQgdG8gYGFueWAsIGJlY2F1c2UgdGhlIFRTIHR5cGluZ3MgZG9uJ3QgaGF2ZSB0aGUgYG9wdGlvbnNgIHBhcmFtZXRlciB5ZXQuXG4gICAgICAobmF0aXZlRWxlbWVudCBhcyBhbnkpLmZvY3VzKG9wdGlvbnMpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2VsZW1lbnRJbmZvLmZvckVhY2goKF9pbmZvLCBlbGVtZW50KSA9PiB0aGlzLnN0b3BNb25pdG9yaW5nKGVsZW1lbnQpKTtcbiAgfVxuXG4gIHByaXZhdGUgX3RvZ2dsZUNsYXNzKGVsZW1lbnQ6IEVsZW1lbnQsIGNsYXNzTmFtZTogc3RyaW5nLCBzaG91bGRTZXQ6IGJvb2xlYW4pIHtcbiAgICBpZiAoc2hvdWxkU2V0KSB7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzTmFtZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGZvY3VzIGNsYXNzZXMgb24gdGhlIGVsZW1lbnQgYmFzZWQgb24gdGhlIGdpdmVuIGZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gdXBkYXRlIHRoZSBjbGFzc2VzIG9uLlxuICAgKiBAcGFyYW0gb3JpZ2luIFRoZSBmb2N1cyBvcmlnaW4uXG4gICAqL1xuICBwcml2YXRlIF9zZXRDbGFzc2VzKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBvcmlnaW4/OiBGb2N1c09yaWdpbik6IHZvaWQge1xuICAgIGNvbnN0IGVsZW1lbnRJbmZvID0gdGhpcy5fZWxlbWVudEluZm8uZ2V0KGVsZW1lbnQpO1xuXG4gICAgaWYgKGVsZW1lbnRJbmZvKSB7XG4gICAgICB0aGlzLl90b2dnbGVDbGFzcyhlbGVtZW50LCAnY2RrLWZvY3VzZWQnLCAhIW9yaWdpbik7XG4gICAgICB0aGlzLl90b2dnbGVDbGFzcyhlbGVtZW50LCAnY2RrLXRvdWNoLWZvY3VzZWQnLCBvcmlnaW4gPT09ICd0b3VjaCcpO1xuICAgICAgdGhpcy5fdG9nZ2xlQ2xhc3MoZWxlbWVudCwgJ2Nkay1rZXlib2FyZC1mb2N1c2VkJywgb3JpZ2luID09PSAna2V5Ym9hcmQnKTtcbiAgICAgIHRoaXMuX3RvZ2dsZUNsYXNzKGVsZW1lbnQsICdjZGstbW91c2UtZm9jdXNlZCcsIG9yaWdpbiA9PT0gJ21vdXNlJyk7XG4gICAgICB0aGlzLl90b2dnbGVDbGFzcyhlbGVtZW50LCAnY2RrLXByb2dyYW0tZm9jdXNlZCcsIG9yaWdpbiA9PT0gJ3Byb2dyYW0nKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgb3JpZ2luIGFuZCBzY2hlZHVsZXMgYW4gYXN5bmMgZnVuY3Rpb24gdG8gY2xlYXIgaXQgYXQgdGhlIGVuZCBvZiB0aGUgZXZlbnQgcXVldWUuXG4gICAqIEBwYXJhbSBvcmlnaW4gVGhlIG9yaWdpbiB0byBzZXQuXG4gICAqL1xuICBwcml2YXRlIF9zZXRPcmlnaW5Gb3JDdXJyZW50RXZlbnRRdWV1ZShvcmlnaW46IEZvY3VzT3JpZ2luKTogdm9pZCB7XG4gICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHRoaXMuX29yaWdpbiA9IG9yaWdpbjtcbiAgICAgIC8vIFNvbWV0aW1lcyB0aGUgZm9jdXMgb3JpZ2luIHdvbid0IGJlIHZhbGlkIGluIEZpcmVmb3ggYmVjYXVzZSBGaXJlZm94IHNlZW1zIHRvIGZvY3VzICpvbmUqXG4gICAgICAvLyB0aWNrIGFmdGVyIHRoZSBpbnRlcmFjdGlvbiBldmVudCBmaXJlZC4gVG8gZW5zdXJlIHRoZSBmb2N1cyBvcmlnaW4gaXMgYWx3YXlzIGNvcnJlY3QsXG4gICAgICAvLyB0aGUgZm9jdXMgb3JpZ2luIHdpbGwgYmUgZGV0ZXJtaW5lZCBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBuZXh0IHRpY2suXG4gICAgICB0aGlzLl9vcmlnaW5UaW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX29yaWdpbiA9IG51bGwsIDEpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSBnaXZlbiBmb2N1cyBldmVudCB3YXMgY2F1c2VkIGJ5IGEgdG91Y2hzdGFydCBldmVudC5cbiAgICogQHBhcmFtIGV2ZW50IFRoZSBmb2N1cyBldmVudCB0byBjaGVjay5cbiAgICogQHJldHVybnMgV2hldGhlciB0aGUgZXZlbnQgd2FzIGNhdXNlZCBieSBhIHRvdWNoLlxuICAgKi9cbiAgcHJpdmF0ZSBfd2FzQ2F1c2VkQnlUb3VjaChldmVudDogRm9jdXNFdmVudCk6IGJvb2xlYW4ge1xuICAgIC8vIE5vdGUobW1hbGVyYmEpOiBUaGlzIGltcGxlbWVudGF0aW9uIGlzIG5vdCBxdWl0ZSBwZXJmZWN0LCB0aGVyZSBpcyBhIHNtYWxsIGVkZ2UgY2FzZS5cbiAgICAvLyBDb25zaWRlciB0aGUgZm9sbG93aW5nIGRvbSBzdHJ1Y3R1cmU6XG4gICAgLy9cbiAgICAvLyA8ZGl2ICNwYXJlbnQgdGFiaW5kZXg9XCIwXCIgY2RrRm9jdXNDbGFzc2VzPlxuICAgIC8vICAgPGRpdiAjY2hpbGQgKGNsaWNrKT1cIiNwYXJlbnQuZm9jdXMoKVwiPjwvZGl2PlxuICAgIC8vIDwvZGl2PlxuICAgIC8vXG4gICAgLy8gSWYgdGhlIHVzZXIgdG91Y2hlcyB0aGUgI2NoaWxkIGVsZW1lbnQgYW5kIHRoZSAjcGFyZW50IGlzIHByb2dyYW1tYXRpY2FsbHkgZm9jdXNlZCBhcyBhXG4gICAgLy8gcmVzdWx0LCB0aGlzIGNvZGUgd2lsbCBzdGlsbCBjb25zaWRlciBpdCB0byBoYXZlIGJlZW4gY2F1c2VkIGJ5IHRoZSB0b3VjaCBldmVudCBhbmQgd2lsbFxuICAgIC8vIGFwcGx5IHRoZSBjZGstdG91Y2gtZm9jdXNlZCBjbGFzcyByYXRoZXIgdGhhbiB0aGUgY2RrLXByb2dyYW0tZm9jdXNlZCBjbGFzcy4gVGhpcyBpcyBhXG4gICAgLy8gcmVsYXRpdmVseSBzbWFsbCBlZGdlLWNhc2UgdGhhdCBjYW4gYmUgd29ya2VkIGFyb3VuZCBieSB1c2luZ1xuICAgIC8vIGZvY3VzVmlhKHBhcmVudEVsLCAncHJvZ3JhbScpIHRvIGZvY3VzIHRoZSBwYXJlbnQgZWxlbWVudC5cbiAgICAvL1xuICAgIC8vIElmIHdlIGRlY2lkZSB0aGF0IHdlIGFic29sdXRlbHkgbXVzdCBoYW5kbGUgdGhpcyBjYXNlIGNvcnJlY3RseSwgd2UgY2FuIGRvIHNvIGJ5IGxpc3RlbmluZ1xuICAgIC8vIGZvciB0aGUgZmlyc3QgZm9jdXMgZXZlbnQgYWZ0ZXIgdGhlIHRvdWNoc3RhcnQsIGFuZCB0aGVuIHRoZSBmaXJzdCBibHVyIGV2ZW50IGFmdGVyIHRoYXRcbiAgICAvLyBmb2N1cyBldmVudC4gV2hlbiB0aGF0IGJsdXIgZXZlbnQgZmlyZXMgd2Uga25vdyB0aGF0IHdoYXRldmVyIGZvbGxvd3MgaXMgbm90IGEgcmVzdWx0IG9mIHRoZVxuICAgIC8vIHRvdWNoc3RhcnQuXG4gICAgbGV0IGZvY3VzVGFyZ2V0ID0gZXZlbnQudGFyZ2V0O1xuICAgIHJldHVybiB0aGlzLl9sYXN0VG91Y2hUYXJnZXQgaW5zdGFuY2VvZiBOb2RlICYmIGZvY3VzVGFyZ2V0IGluc3RhbmNlb2YgTm9kZSAmJlxuICAgICAgICAoZm9jdXNUYXJnZXQgPT09IHRoaXMuX2xhc3RUb3VjaFRhcmdldCB8fCBmb2N1c1RhcmdldC5jb250YWlucyh0aGlzLl9sYXN0VG91Y2hUYXJnZXQpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIGZvY3VzIGV2ZW50cyBvbiBhIHJlZ2lzdGVyZWQgZWxlbWVudC5cbiAgICogQHBhcmFtIGV2ZW50IFRoZSBmb2N1cyBldmVudC5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIG1vbml0b3JlZCBlbGVtZW50LlxuICAgKi9cbiAgcHJpdmF0ZSBfb25Gb2N1cyhldmVudDogRm9jdXNFdmVudCwgZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgICAvLyBOT1RFKG1tYWxlcmJhKTogV2UgY3VycmVudGx5IHNldCB0aGUgY2xhc3NlcyBiYXNlZCBvbiB0aGUgZm9jdXMgb3JpZ2luIG9mIHRoZSBtb3N0IHJlY2VudFxuICAgIC8vIGZvY3VzIGV2ZW50IGFmZmVjdGluZyB0aGUgbW9uaXRvcmVkIGVsZW1lbnQuIElmIHdlIHdhbnQgdG8gdXNlIHRoZSBvcmlnaW4gb2YgdGhlIGZpcnN0IGV2ZW50XG4gICAgLy8gaW5zdGVhZCB3ZSBzaG91bGQgY2hlY2sgZm9yIHRoZSBjZGstZm9jdXNlZCBjbGFzcyBoZXJlIGFuZCByZXR1cm4gaWYgdGhlIGVsZW1lbnQgYWxyZWFkeSBoYXNcbiAgICAvLyBpdC4gKFRoaXMgb25seSBtYXR0ZXJzIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgaW5jbHVkZXNDaGlsZHJlbiA9IHRydWUpLlxuXG4gICAgLy8gSWYgd2UgYXJlIG5vdCBjb3VudGluZyBjaGlsZC1lbGVtZW50LWZvY3VzIGFzIGZvY3VzZWQsIG1ha2Ugc3VyZSB0aGF0IHRoZSBldmVudCB0YXJnZXQgaXMgdGhlXG4gICAgLy8gbW9uaXRvcmVkIGVsZW1lbnQgaXRzZWxmLlxuICAgIGNvbnN0IGVsZW1lbnRJbmZvID0gdGhpcy5fZWxlbWVudEluZm8uZ2V0KGVsZW1lbnQpO1xuICAgIGlmICghZWxlbWVudEluZm8gfHwgKCFlbGVtZW50SW5mby5jaGVja0NoaWxkcmVuICYmIGVsZW1lbnQgIT09IGV2ZW50LnRhcmdldCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSBjb3VsZG4ndCBkZXRlY3QgYSBjYXVzZSBmb3IgdGhlIGZvY3VzIGV2ZW50LCBpdCdzIGR1ZSB0byBvbmUgb2YgdGhyZWUgcmVhc29uczpcbiAgICAvLyAxKSBUaGUgd2luZG93IGhhcyBqdXN0IHJlZ2FpbmVkIGZvY3VzLCBpbiB3aGljaCBjYXNlIHdlIHdhbnQgdG8gcmVzdG9yZSB0aGUgZm9jdXNlZCBzdGF0ZSBvZlxuICAgIC8vICAgIHRoZSBlbGVtZW50IGZyb20gYmVmb3JlIHRoZSB3aW5kb3cgYmx1cnJlZC5cbiAgICAvLyAyKSBJdCB3YXMgY2F1c2VkIGJ5IGEgdG91Y2ggZXZlbnQsIGluIHdoaWNoIGNhc2Ugd2UgbWFyayB0aGUgb3JpZ2luIGFzICd0b3VjaCcuXG4gICAgLy8gMykgVGhlIGVsZW1lbnQgd2FzIHByb2dyYW1tYXRpY2FsbHkgZm9jdXNlZCwgaW4gd2hpY2ggY2FzZSB3ZSBzaG91bGQgbWFyayB0aGUgb3JpZ2luIGFzXG4gICAgLy8gICAgJ3Byb2dyYW0nLlxuICAgIGxldCBvcmlnaW4gPSB0aGlzLl9vcmlnaW47XG4gICAgaWYgKCFvcmlnaW4pIHtcbiAgICAgIGlmICh0aGlzLl93aW5kb3dGb2N1c2VkICYmIHRoaXMuX2xhc3RGb2N1c09yaWdpbikge1xuICAgICAgICBvcmlnaW4gPSB0aGlzLl9sYXN0Rm9jdXNPcmlnaW47XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX3dhc0NhdXNlZEJ5VG91Y2goZXZlbnQpKSB7XG4gICAgICAgIG9yaWdpbiA9ICd0b3VjaCc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvcmlnaW4gPSAncHJvZ3JhbSc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fc2V0Q2xhc3NlcyhlbGVtZW50LCBvcmlnaW4pO1xuICAgIHRoaXMuX2VtaXRPcmlnaW4oZWxlbWVudEluZm8uc3ViamVjdCwgb3JpZ2luKTtcbiAgICB0aGlzLl9sYXN0Rm9jdXNPcmlnaW4gPSBvcmlnaW47XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBibHVyIGV2ZW50cyBvbiBhIHJlZ2lzdGVyZWQgZWxlbWVudC5cbiAgICogQHBhcmFtIGV2ZW50IFRoZSBibHVyIGV2ZW50LlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgbW9uaXRvcmVkIGVsZW1lbnQuXG4gICAqL1xuICBfb25CbHVyKGV2ZW50OiBGb2N1c0V2ZW50LCBlbGVtZW50OiBIVE1MRWxlbWVudCkge1xuICAgIC8vIElmIHdlIGFyZSBjb3VudGluZyBjaGlsZC1lbGVtZW50LWZvY3VzIGFzIGZvY3VzZWQsIG1ha2Ugc3VyZSB0aGF0IHdlIGFyZW4ndCBqdXN0IGJsdXJyaW5nIGluXG4gICAgLy8gb3JkZXIgdG8gZm9jdXMgYW5vdGhlciBjaGlsZCBvZiB0aGUgbW9uaXRvcmVkIGVsZW1lbnQuXG4gICAgY29uc3QgZWxlbWVudEluZm8gPSB0aGlzLl9lbGVtZW50SW5mby5nZXQoZWxlbWVudCk7XG5cbiAgICBpZiAoIWVsZW1lbnRJbmZvIHx8IChlbGVtZW50SW5mby5jaGVja0NoaWxkcmVuICYmIGV2ZW50LnJlbGF0ZWRUYXJnZXQgaW5zdGFuY2VvZiBOb2RlICYmXG4gICAgICAgIGVsZW1lbnQuY29udGFpbnMoZXZlbnQucmVsYXRlZFRhcmdldCkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fc2V0Q2xhc3NlcyhlbGVtZW50KTtcbiAgICB0aGlzLl9lbWl0T3JpZ2luKGVsZW1lbnRJbmZvLnN1YmplY3QsIG51bGwpO1xuICB9XG5cbiAgcHJpdmF0ZSBfZW1pdE9yaWdpbihzdWJqZWN0OiBTdWJqZWN0PEZvY3VzT3JpZ2luPiwgb3JpZ2luOiBGb2N1c09yaWdpbikge1xuICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4gc3ViamVjdC5uZXh0KG9yaWdpbikpO1xuICB9XG5cbiAgcHJpdmF0ZSBfaW5jcmVtZW50TW9uaXRvcmVkRWxlbWVudENvdW50KCkge1xuICAgIC8vIFJlZ2lzdGVyIGdsb2JhbCBsaXN0ZW5lcnMgd2hlbiBmaXJzdCBlbGVtZW50IGlzIG1vbml0b3JlZC5cbiAgICBpZiAoKyt0aGlzLl9tb25pdG9yZWRFbGVtZW50Q291bnQgPT0gMSAmJiB0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIpIHtcbiAgICAgIC8vIE5vdGU6IHdlIGxpc3RlbiB0byBldmVudHMgaW4gdGhlIGNhcHR1cmUgcGhhc2Ugc28gd2VcbiAgICAgIC8vIGNhbiBkZXRlY3QgdGhlbSBldmVuIGlmIHRoZSB1c2VyIHN0b3BzIHByb3BhZ2F0aW9uLlxuICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX2RvY3VtZW50S2V5ZG93bkxpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX2RvY3VtZW50TW91c2Vkb3duTGlzdGVuZXIsXG4gICAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuX2RvY3VtZW50VG91Y2hzdGFydExpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMuX3dpbmRvd0ZvY3VzTGlzdGVuZXIpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfZGVjcmVtZW50TW9uaXRvcmVkRWxlbWVudENvdW50KCkge1xuICAgIC8vIFVucmVnaXN0ZXIgZ2xvYmFsIGxpc3RlbmVycyB3aGVuIGxhc3QgZWxlbWVudCBpcyB1bm1vbml0b3JlZC5cbiAgICBpZiAoIS0tdGhpcy5fbW9uaXRvcmVkRWxlbWVudENvdW50KSB7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fZG9jdW1lbnRLZXlkb3duTGlzdGVuZXIsXG4gICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9kb2N1bWVudE1vdXNlZG93bkxpc3RlbmVyLFxuICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuX2RvY3VtZW50VG91Y2hzdGFydExpc3RlbmVyLFxuICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5fd2luZG93Rm9jdXNMaXN0ZW5lcik7XG5cbiAgICAgIC8vIENsZWFyIHRpbWVvdXRzIGZvciBhbGwgcG90ZW50aWFsbHkgcGVuZGluZyB0aW1lb3V0cyB0byBwcmV2ZW50IHRoZSBsZWFrcy5cbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl93aW5kb3dGb2N1c1RpbWVvdXRJZCk7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fdG91Y2hUaW1lb3V0SWQpO1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX29yaWdpblRpbWVvdXRJZCk7XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBEaXJlY3RpdmUgdGhhdCBkZXRlcm1pbmVzIGhvdyBhIHBhcnRpY3VsYXIgZWxlbWVudCB3YXMgZm9jdXNlZCAodmlhIGtleWJvYXJkLCBtb3VzZSwgdG91Y2gsIG9yXG4gKiBwcm9ncmFtbWF0aWNhbGx5KSBhbmQgYWRkcyBjb3JyZXNwb25kaW5nIGNsYXNzZXMgdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogVGhlcmUgYXJlIHR3byB2YXJpYW50cyBvZiB0aGlzIGRpcmVjdGl2ZTpcbiAqIDEpIGNka01vbml0b3JFbGVtZW50Rm9jdXM6IGRvZXMgbm90IGNvbnNpZGVyIGFuIGVsZW1lbnQgdG8gYmUgZm9jdXNlZCBpZiBvbmUgb2YgaXRzIGNoaWxkcmVuIGlzXG4gKiAgICBmb2N1c2VkLlxuICogMikgY2RrTW9uaXRvclN1YnRyZWVGb2N1czogY29uc2lkZXJzIGFuIGVsZW1lbnQgZm9jdXNlZCBpZiBpdCBvciBhbnkgb2YgaXRzIGNoaWxkcmVuIGFyZSBmb2N1c2VkLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrTW9uaXRvckVsZW1lbnRGb2N1c10sIFtjZGtNb25pdG9yU3VidHJlZUZvY3VzXScsXG59KVxuZXhwb3J0IGNsYXNzIENka01vbml0b3JGb2N1cyBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIHByaXZhdGUgX21vbml0b3JTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbjtcbiAgQE91dHB1dCgpIGNka0ZvY3VzQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxGb2N1c09yaWdpbj4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9lbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiwgcHJpdmF0ZSBfZm9jdXNNb25pdG9yOiBGb2N1c01vbml0b3IpIHtcbiAgICB0aGlzLl9tb25pdG9yU3Vic2NyaXB0aW9uID0gdGhpcy5fZm9jdXNNb25pdG9yLm1vbml0b3IoXG4gICAgICAgIHRoaXMuX2VsZW1lbnRSZWYsXG4gICAgICAgIHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5oYXNBdHRyaWJ1dGUoJ2Nka01vbml0b3JTdWJ0cmVlRm9jdXMnKSlcbiAgICAgICAgLnN1YnNjcmliZShvcmlnaW4gPT4gdGhpcy5jZGtGb2N1c0NoYW5nZS5lbWl0KG9yaWdpbikpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fZm9jdXNNb25pdG9yLnN0b3BNb25pdG9yaW5nKHRoaXMuX2VsZW1lbnRSZWYpO1xuICAgIHRoaXMuX21vbml0b3JTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgfVxufVxuXG4vKiogQGRvY3MtcHJpdmF0ZSBAZGVwcmVjYXRlZCBAYnJlYWtpbmctY2hhbmdlIDguMC4wICovXG5leHBvcnQgZnVuY3Rpb24gRk9DVVNfTU9OSVRPUl9QUk9WSURFUl9GQUNUT1JZKFxuICAgIHBhcmVudERpc3BhdGNoZXI6IEZvY3VzTW9uaXRvciwgbmdab25lOiBOZ1pvbmUsIHBsYXRmb3JtOiBQbGF0Zm9ybSkge1xuICByZXR1cm4gcGFyZW50RGlzcGF0Y2hlciB8fCBuZXcgRm9jdXNNb25pdG9yKG5nWm9uZSwgcGxhdGZvcm0pO1xufVxuXG4vKiogQGRvY3MtcHJpdmF0ZSBAZGVwcmVjYXRlZCBAYnJlYWtpbmctY2hhbmdlIDguMC4wICovXG5leHBvcnQgY29uc3QgRk9DVVNfTU9OSVRPUl9QUk9WSURFUiA9IHtcbiAgLy8gSWYgdGhlcmUgaXMgYWxyZWFkeSBhIEZvY3VzTW9uaXRvciBhdmFpbGFibGUsIHVzZSB0aGF0LiBPdGhlcndpc2UsIHByb3ZpZGUgYSBuZXcgb25lLlxuICBwcm92aWRlOiBGb2N1c01vbml0b3IsXG4gIGRlcHM6IFtbbmV3IE9wdGlvbmFsKCksIG5ldyBTa2lwU2VsZigpLCBGb2N1c01vbml0b3JdLCBOZ1pvbmUsIFBsYXRmb3JtXSxcbiAgdXNlRmFjdG9yeTogRk9DVVNfTU9OSVRPUl9QUk9WSURFUl9GQUNUT1JZXG59O1xuIl19