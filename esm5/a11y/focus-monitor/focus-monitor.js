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
export var TOUCH_BUFFER_MS = 650;
/** InjectionToken for FocusMonitorOptions. */
export var FOCUS_MONITOR_DEFAULT_OPTIONS = new InjectionToken('cdk-focus-monitor-default-options');
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
    function FocusMonitor(_ngZone, _platform, 
    /** @breaking-change 11.0.0 make document required */
    document, options) {
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
            // Since this listener is bound on the `document` level, any events coming from the shadow DOM
            // will have their `target` set to the shadow root. If available, use `composedPath` to
            // figure out the event target.
            _this._lastTouchTarget = event.composedPath ? event.composedPath()[0] : event.target;
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
        this._document = document;
        this._detectionMode = (options === null || options === void 0 ? void 0 : options.detectionMode) || 0 /* IMMEDIATE */;
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
    /** Access injected document if available or fallback to global document reference */
    FocusMonitor.prototype._getDocument = function () {
        return this._document || document;
    };
    /** Use defaultView of injected document if available or fallback to global window reference */
    FocusMonitor.prototype._getWindow = function () {
        var doc = this._getDocument();
        return doc.defaultView || window;
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
     * If the detection mode is 'eventual', the origin is never cleared.
     * @param origin The origin to set.
     */
    FocusMonitor.prototype._setOriginForCurrentEventQueue = function (origin) {
        var _this = this;
        this._ngZone.runOutsideAngular(function () {
            _this._origin = origin;
            if (_this._detectionMode === 0 /* IMMEDIATE */) {
                // Sometimes the focus origin won't be valid in Firefox because Firefox seems to focus *one*
                // tick after the interaction event fired. To ensure the focus origin is always correct,
                // the focus origin will be determined at the beginning of the next tick.
                _this._originTimeoutId = setTimeout(function () { return _this._origin = null; }, 1);
            }
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
                var document = _this._getDocument();
                var window = _this._getWindow();
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
            var document_1 = this._getDocument();
            var window_1 = this._getWindow();
            document_1.removeEventListener('keydown', this._documentKeydownListener, captureEventListenerOptions);
            document_1.removeEventListener('mousedown', this._documentMousedownListener, captureEventListenerOptions);
            document_1.removeEventListener('touchstart', this._documentTouchstartListener, captureEventListenerOptions);
            window_1.removeEventListener('focus', this._windowFocusListener);
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
        { type: Platform },
        { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [DOCUMENT,] }] },
        { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [FOCUS_MONITOR_DEFAULT_OPTIONS,] }] }
    ]; };
    FocusMonitor.ɵprov = i0.ɵɵdefineInjectable({ factory: function FocusMonitor_Factory() { return new FocusMonitor(i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i1.Platform), i0.ɵɵinject(i2.DOCUMENT, 8), i0.ɵɵinject(FOCUS_MONITOR_DEFAULT_OPTIONS, 8)); }, token: FocusMonitor, providedIn: "root" });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXMtbW9uaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvYTExeS9mb2N1cy1tb25pdG9yL2ZvY3VzLW1vbml0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBRSwrQkFBK0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2hGLE9BQU8sRUFDTCxTQUFTLEVBQ1QsVUFBVSxFQUNWLFlBQVksRUFDWixNQUFNLEVBQ04sVUFBVSxFQUNWLGNBQWMsRUFDZCxNQUFNLEVBRU4sUUFBUSxFQUNSLE1BQU0sR0FDUCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQWEsRUFBRSxJQUFJLFlBQVksRUFBRSxPQUFPLEVBQWUsTUFBTSxNQUFNLENBQUM7QUFDM0UsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3BELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQzs7OztBQUd6QyxrR0FBa0c7QUFDbEcsa0RBQWtEO0FBQ2xELE1BQU0sQ0FBQyxJQUFNLGVBQWUsR0FBRyxHQUFHLENBQUM7QUFrQ25DLDhDQUE4QztBQUM5QyxNQUFNLENBQUMsSUFBTSw2QkFBNkIsR0FDdEMsSUFBSSxjQUFjLENBQXNCLG1DQUFtQyxDQUFDLENBQUM7QUFRakY7OztHQUdHO0FBQ0gsSUFBTSwyQkFBMkIsR0FBRywrQkFBK0IsQ0FBQztJQUNsRSxPQUFPLEVBQUUsSUFBSTtJQUNiLE9BQU8sRUFBRSxJQUFJO0NBQ2QsQ0FBQyxDQUFDO0FBR0gsaUZBQWlGO0FBQ2pGO0lBMEZFLHNCQUNZLE9BQWUsRUFDZixTQUFtQjtJQUMzQixxREFBcUQ7SUFDdkIsUUFBa0IsRUFDRyxPQUN2QjtRQU5oQyxpQkFTQztRQVJXLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFDZixjQUFTLEdBQVQsU0FBUyxD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LEVBQ2hCLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO2FBQ3JFLFNBQVMsQ0FBQyxVQUFBLE1BQU0sSUFBSSxPQUFBLEtBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFoQyxDQUFnQyxDQUFDLENBQUM7SUFDN0QsQ0FBQztJQUVELHFDQUFXLEdBQVg7UUFDRSxJQUFJLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDcEQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQzFDLENBQUM7O2dCQWpCRixTQUFTLFNBQUM7b0JBQ1QsUUFBUSxFQUFFLG9EQUFvRDtpQkFDL0Q7Ozs7Z0JBN2VDLFVBQVU7Z0JBa2Z1RSxZQUFZOzs7aUNBRjVGLE1BQU07O0lBYVQsc0JBQUM7Q0FBQSxBQWxCRCxJQWtCQztTQWZZLGVBQWUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtQbGF0Zm9ybSwgbm9ybWFsaXplUGFzc2l2ZUxpc3RlbmVyT3B0aW9uc30gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7XG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBJbmplY3QsXG4gIEluamVjdGFibGUsXG4gIEluamVjdGlvblRva2VuLFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgT3B0aW9uYWwsXG4gIE91dHB1dCxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge09ic2VydmFibGUsIG9mIGFzIG9ic2VydmFibGVPZiwgU3ViamVjdCwgU3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcbmltcG9ydCB7Y29lcmNlRWxlbWVudH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5cblxuLy8gVGhpcyBpcyB0aGUgdmFsdWUgdXNlZCBieSBBbmd1bGFySlMgTWF0ZXJpYWwuIFRocm91Z2ggdHJpYWwgYW5kIGVycm9yIChvbiBpUGhvbmUgNlMpIHRoZXkgZm91bmRcbi8vIHRoYXQgYSB2YWx1ZSBvZiBhcm91bmQgNjUwbXMgc2VlbXMgYXBwcm9wcmlhdGUuXG5leHBvcnQgY29uc3QgVE9VQ0hfQlVGRkVSX01TID0gNjUwO1xuXG5cbmV4cG9ydCB0eXBlIEZvY3VzT3JpZ2luID0gJ3RvdWNoJyB8ICdtb3VzZScgfCAna2V5Ym9hcmQnIHwgJ3Byb2dyYW0nIHwgbnVsbDtcblxuLyoqXG4gKiBDb3JyZXNwb25kcyB0byB0aGUgb3B0aW9ucyB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gdGhlIG5hdGl2ZSBgZm9jdXNgIGV2ZW50LlxuICogdmlhIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9IVE1MRWxlbWVudC9mb2N1c1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEZvY3VzT3B0aW9ucyB7XG4gIC8qKiBXaGV0aGVyIHRoZSBicm93c2VyIHNob3VsZCBzY3JvbGwgdG8gdGhlIGVsZW1lbnQgd2hlbiBpdCBpcyBmb2N1c2VkLiAqL1xuICBwcmV2ZW50U2Nyb2xsPzogYm9vbGVhbjtcbn1cblxuLyoqIERldGVjdGlvbiBtb2RlIHVzZWQgZm9yIGF0dHJpYnV0aW5nIHRoZSBvcmlnaW4gb2YgYSBmb2N1cyBldmVudC4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGUge1xuICAvKipcbiAgICogQW55IG1vdXNlZG93biwga2V5ZG93biwgb3IgdG91Y2hzdGFydCBldmVudCB0aGF0IGhhcHBlbmVkIGluIHRoZSBwcmV2aW91c1xuICAgKiB0aWNrIG9yIHRoZSBjdXJyZW50IHRpY2sgd2lsbCBiZSB1c2VkIHRvIGFzc2lnbiBhIGZvY3VzIGV2ZW50J3Mgb3JpZ2luICh0b1xuICAgKiBlaXRoZXIgbW91c2UsIGtleWJvYXJkLCBvciB0b3VjaCkuIFRoaXMgaXMgdGhlIGRlZmF1bHQgb3B0aW9uLlxuICAgKi9cbiAgSU1NRURJQVRFLFxuICAvKipcbiAgICogQSBmb2N1cyBldmVudCdzIG9yaWdpbiBpcyBhbHdheXMgYXR0cmlidXRlZCB0byB0aGUgbGFzdCBjb3JyZXNwb25kaW5nXG4gICAqIG1vdXNlZG93biwga2V5ZG93biwgb3IgdG91Y2hzdGFydCBldmVudCwgbm8gbWF0dGVyIGhvdyBsb25nIGFnbyBpdCBvY2N1cmVkLlxuICAgKi9cbiAgRVZFTlRVQUxcbn1cblxuLyoqIEluamVjdGFibGUgc2VydmljZS1sZXZlbCBvcHRpb25zIGZvciBGb2N1c01vbml0b3IuICovXG5leHBvcnQgaW50ZXJmYWNlIEZvY3VzTW9uaXRvck9wdGlvbnMge1xuICBkZXRlY3Rpb25Nb2RlPzogRm9jdXNNb25pdG9yRGV0ZWN0aW9uTW9kZTtcbn1cblxuLyoqIEluamVjdGlvblRva2VuIGZvciBGb2N1c01vbml0b3JPcHRpb25zLiAqL1xuZXhwb3J0IGNvbnN0IEZPQ1VTX01PTklUT1JfREVGQVVMVF9PUFRJT05TID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48Rm9jdXNNb25pdG9yT3B0aW9ucz4oJ2Nkay1mb2N1cy1tb25pdG9yLWRlZmF1bHQtb3B0aW9ucycpO1xuXG50eXBlIE1vbml0b3JlZEVsZW1lbnRJbmZvID0ge1xuICB1bmxpc3RlbjogRnVuY3Rpb24sXG4gIGNoZWNrQ2hpbGRyZW46IGJvb2xlYW4sXG4gIHN1YmplY3Q6IFN1YmplY3Q8Rm9jdXNPcmlnaW4+XG59O1xuXG4vKipcbiAqIEV2ZW50IGxpc3RlbmVyIG9wdGlvbnMgdGhhdCBlbmFibGUgY2FwdHVyaW5nIGFuZCBhbHNvXG4gKiBtYXJrIHRoZSBsaXN0ZW5lciBhcyBwYXNzaXZlIGlmIHRoZSBicm93c2VyIHN1cHBvcnRzIGl0LlxuICovXG5jb25zdCBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMgPSBub3JtYWxpemVQYXNzaXZlTGlzdGVuZXJPcHRpb25zKHtcbiAgcGFzc2l2ZTogdHJ1ZSxcbiAgY2FwdHVyZTogdHJ1ZVxufSk7XG5cblxuLyoqIE1vbml0b3JzIG1vdXNlIGFuZCBrZXlib2FyZCBldmVudHMgdG8gZGV0ZXJtaW5lIHRoZSBjYXVzZSBvZiBmb2N1cyBldmVudHMuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBGb2N1c01vbml0b3IgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogVGhlIGZvY3VzIG9yaWdpbiB0aGF0IHRoZSBuZXh0IGZvY3VzIGV2ZW50IGlzIGEgcmVzdWx0IG9mLiAqL1xuICBwcml2YXRlIF9vcmlnaW46IEZvY3VzT3JpZ2luID0gbnVsbDtcblxuICAvKiogVGhlIEZvY3VzT3JpZ2luIG9mIHRoZSBsYXN0IGZvY3VzIGV2ZW50IHRyYWNrZWQgYnkgdGhlIEZvY3VzTW9uaXRvci4gKi9cbiAgcHJpdmF0ZSBfbGFzdEZvY3VzT3JpZ2luOiBGb2N1c09yaWdpbjtcblxuICAvKiogV2hldGhlciB0aGUgd2luZG93IGhhcyBqdXN0IGJlZW4gZm9jdXNlZC4gKi9cbiAgcHJpdmF0ZSBfd2luZG93Rm9jdXNlZCA9IGZhbHNlO1xuXG4gIC8qKiBUaGUgdGFyZ2V0IG9mIHRoZSBsYXN0IHRvdWNoIGV2ZW50LiAqL1xuICBwcml2YXRlIF9sYXN0VG91Y2hUYXJnZXQ6IEV2ZW50VGFyZ2V0IHwgbnVsbDtcblxuICAvKiogVGhlIHRpbWVvdXQgaWQgb2YgdGhlIHRvdWNoIHRpbWVvdXQsIHVzZWQgdG8gY2FuY2VsIHRpbWVvdXQgbGF0ZXIuICovXG4gIHByaXZhdGUgX3RvdWNoVGltZW91dElkOiBudW1iZXI7XG5cbiAgLyoqIFRoZSB0aW1lb3V0IGlkIG9mIHRoZSB3aW5kb3cgZm9jdXMgdGltZW91dC4gKi9cbiAgcHJpdmF0ZSBfd2luZG93Rm9jdXNUaW1lb3V0SWQ6IG51bWJlcjtcblxuICAvKiogVGhlIHRpbWVvdXQgaWQgb2YgdGhlIG9yaWdpbiBjbGVhcmluZyB0aW1lb3V0LiAqL1xuICBwcml2YXRlIF9vcmlnaW5UaW1lb3V0SWQ6IG51bWJlcjtcblxuICAvKiogTWFwIG9mIGVsZW1lbnRzIGJlaW5nIG1vbml0b3JlZCB0byB0aGVpciBpbmZvLiAqL1xuICBwcml2YXRlIF9lbGVtZW50SW5mbyA9IG5ldyBNYXA8SFRNTEVsZW1lbnQsIE1vbml0b3JlZEVsZW1lbnRJbmZvPigpO1xuXG4gIC8qKiBUaGUgbnVtYmVyIG9mIGVsZW1lbnRzIGN1cnJlbnRseSBiZWluZyBtb25pdG9yZWQuICovXG4gIHByaXZhdGUgX21vbml0b3JlZEVsZW1lbnRDb3VudCA9IDA7XG5cbiAgLyoqXG4gICAqIFRoZSBzcGVjaWZpZWQgZGV0ZWN0aW9uIG1vZGUsIHVzZWQgZm9yIGF0dHJpYnV0aW5nIHRoZSBvcmlnaW4gb2YgYSBmb2N1c1xuICAgKiBldmVudC5cbiAgICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX2RldGVjdGlvbk1vZGU6IEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGU7XG5cbiAgLyoqXG4gICAqIEV2ZW50IGxpc3RlbmVyIGZvciBga2V5ZG93bmAgZXZlbnRzIG9uIHRoZSBkb2N1bWVudC5cbiAgICogTmVlZHMgdG8gYmUgYW4gYXJyb3cgZnVuY3Rpb24gaW4gb3JkZXIgdG8gcHJlc2VydmUgdGhlIGNvbnRleHQgd2hlbiBpdCBnZXRzIGJvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfZG9jdW1lbnRLZXlkb3duTGlzdGVuZXIgPSAoKSA9PiB7XG4gICAgLy8gT24ga2V5ZG93biByZWNvcmQgdGhlIG9yaWdpbiBhbmQgY2xlYXIgYW55IHRvdWNoIGV2ZW50IHRoYXQgbWF5IGJlIGluIHByb2dyZXNzLlxuICAgIHRoaXMuX2xhc3RUb3VjaFRhcmdldCA9IG51bGw7XG4gICAgdGhpcy5fc2V0T3JpZ2luRm9yQ3VycmVudEV2ZW50UXVldWUoJ2tleWJvYXJkJyk7XG4gIH1cblxuICAvKipcbiAgICogRXZlbnQgbGlzdGVuZXIgZm9yIGBtb3VzZWRvd25gIGV2ZW50cyBvbiB0aGUgZG9jdW1lbnQuXG4gICAqIE5lZWRzIHRvIGJlIGFuIGFycm93IGZ1bmN0aW9uIGluIG9yZGVyIHRvIHByZXNlcnZlIHRoZSBjb250ZXh0IHdoZW4gaXQgZ2V0cyBib3VuZC5cbiAgICovXG4gIHByaXZhdGUgX2RvY3VtZW50TW91c2Vkb3duTGlzdGVuZXIgPSAoKSA9PiB7XG4gICAgLy8gT24gbW91c2Vkb3duIHJlY29yZCB0aGUgb3JpZ2luIG9ubHkgaWYgdGhlcmUgaXMgbm90IHRvdWNoXG4gICAgLy8gdGFyZ2V0LCBzaW5jZSBhIG1vdXNlZG93biBjYW4gaGFwcGVuIGFzIGEgcmVzdWx0IG9mIGEgdG91Y2ggZXZlbnQuXG4gICAgaWYgKCF0aGlzLl9sYXN0VG91Y2hUYXJnZXQpIHtcbiAgICAgIHRoaXMuX3NldE9yaWdpbkZvckN1cnJlbnRFdmVudFF1ZXVlKCdtb3VzZScpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFdmVudCBsaXN0ZW5lciBmb3IgYHRvdWNoc3RhcnRgIGV2ZW50cyBvbiB0aGUgZG9jdW1lbnQuXG4gICAqIE5lZWRzIHRvIGJlIGFuIGFycm93IGZ1bmN0aW9uIGluIG9yZGVyIHRvIHByZXNlcnZlIHRoZSBjb250ZXh0IHdoZW4gaXQgZ2V0cyBib3VuZC5cbiAgICovXG4gIHByaXZhdGUgX2RvY3VtZW50VG91Y2hzdGFydExpc3RlbmVyID0gKGV2ZW50OiBUb3VjaEV2ZW50KSA9PiB7XG4gICAgLy8gV2hlbiB0aGUgdG91Y2hzdGFydCBldmVudCBmaXJlcyB0aGUgZm9jdXMgZXZlbnQgaXMgbm90IHlldCBpbiB0aGUgZXZlbnQgcXVldWUuIFRoaXMgbWVhbnNcbiAgICAvLyB3ZSBjYW4ndCByZWx5IG9uIHRoZSB0cmljayB1c2VkIGFib3ZlIChzZXR0aW5nIHRpbWVvdXQgb2YgMW1zKS4gSW5zdGVhZCB3ZSB3YWl0IDY1MG1zIHRvXG4gICAgLy8gc2VlIGlmIGEgZm9jdXMgaGFwcGVucy5cbiAgICBpZiAodGhpcy5fdG91Y2hUaW1lb3V0SWQgIT0gbnVsbCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3RvdWNoVGltZW91dElkKTtcbiAgICB9XG5cbiAgICAvLyBTaW5jZSB0aGlzIGxpc3RlbmVyIGlzIGJvdW5kIG9uIHRoZSBgZG9jdW1lbnRgIGxldmVsLCBhbnkgZXZlbnRzIGNvbWluZyBmcm9tIHRoZSBzaGFkb3cgRE9NXG4gICAgLy8gd2lsbCBoYXZlIHRoZWlyIGB0YXJnZXRgIHNldCB0byB0aGUgc2hhZG93IHJvb3QuIElmIGF2YWlsYWJsZSwgdXNlIGBjb21wb3NlZFBhdGhgIHRvXG4gICAgLy8gZmlndXJlIG91dCB0aGUgZXZlbnQgdGFyZ2V0LlxuICAgIHRoaXMuX2xhc3RUb3VjaFRhcmdldCA9IGV2ZW50LmNvbXBvc2VkUGF0aCA/IGV2ZW50LmNvbXBvc2VkUGF0aCgpWzBdIDogZXZlbnQudGFyZ2V0O1xuICAgIHRoaXMuX3RvdWNoVGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLl9sYXN0VG91Y2hUYXJnZXQgPSBudWxsLCBUT1VDSF9CVUZGRVJfTVMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV2ZW50IGxpc3RlbmVyIGZvciBgZm9jdXNgIGV2ZW50cyBvbiB0aGUgd2luZG93LlxuICAgKiBOZWVkcyB0byBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0IGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF93aW5kb3dGb2N1c0xpc3RlbmVyID0gKCkgPT4ge1xuICAgIC8vIE1ha2UgYSBub3RlIG9mIHdoZW4gdGhlIHdpbmRvdyByZWdhaW5zIGZvY3VzLCBzbyB3ZSBjYW5cbiAgICAvLyByZXN0b3JlIHRoZSBvcmlnaW4gaW5mbyBmb3IgdGhlIGZvY3VzZWQgZWxlbWVudC5cbiAgICB0aGlzLl93aW5kb3dGb2N1c2VkID0gdHJ1ZTtcbiAgICB0aGlzLl93aW5kb3dGb2N1c1RpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fd2luZG93Rm9jdXNlZCA9IGZhbHNlKTtcbiAgfVxuXG4gIC8qKiBVc2VkIHRvIHJlZmVyZW5jZSBjb3JyZWN0IGRvY3VtZW50L3dpbmRvdyAqL1xuICBwcm90ZWN0ZWQgX2RvY3VtZW50PzogRG9jdW1lbnQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICAgIHByaXZhdGUgX3BsYXRmb3JtOiBQbGF0Zm9ybSxcbiAgICAgIC8qKiBAYnJlYWtpbmctY2hhbmdlIDExLjAuMCBtYWtlIGRvY3VtZW50IHJlcXVpcmVkICovXG4gICAgICBAT3B0aW9uYWwoKSBASW5qZWN0KERPQ1VNRU5UKSBkb2N1bWVudDogYW55fG51bGwsXG4gICAgICBAT3B0aW9uYWwoKSBASW5qZWN0KEZPQ1VTX01PTklUT1JfREVGQVVMVF9PUFRJT05TKSBvcHRpb25zOlxuICAgICAgICAgIEZvY3VzTW9uaXRvck9wdGlvbnN8bnVsbCkge1xuICAgIHRoaXMuX2RvY3VtZW50ID0gZG9jdW1lbnQ7XG4gICAgdGhpcy5fZGV0ZWN0aW9uTW9kZSA9IG9wdGlvbnM/LmRldGVjdGlvbk1vZGUgfHwgRm9jdXNNb25pdG9yRGV0ZWN0aW9uTW9kZS5JTU1FRElBVEU7XG4gIH1cblxuICAvKipcbiAgICogTW9uaXRvcnMgZm9jdXMgb24gYW4gZWxlbWVudCBhbmQgYXBwbGllcyBhcHByb3ByaWF0ZSBDU1MgY2xhc3Nlcy5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gbW9uaXRvclxuICAgKiBAcGFyYW0gY2hlY2tDaGlsZHJlbiBXaGV0aGVyIHRvIGNvdW50IHRoZSBlbGVtZW50IGFzIGZvY3VzZWQgd2hlbiBpdHMgY2hpbGRyZW4gYXJlIGZvY3VzZWQuXG4gICAqIEByZXR1cm5zIEFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB3aGVuIHRoZSBmb2N1cyBzdGF0ZSBvZiB0aGUgZWxlbWVudCBjaGFuZ2VzLlxuICAgKiAgICAgV2hlbiB0aGUgZWxlbWVudCBpcyBibHVycmVkLCBudWxsIHdpbGwgYmUgZW1pdHRlZC5cbiAgICovXG4gIG1vbml0b3IoZWxlbWVudDogSFRNTEVsZW1lbnQsIGNoZWNrQ2hpbGRyZW4/OiBib29sZWFuKTogT2JzZXJ2YWJsZTxGb2N1c09yaWdpbj47XG5cbiAgLyoqXG4gICAqIE1vbml0b3JzIGZvY3VzIG9uIGFuIGVsZW1lbnQgYW5kIGFwcGxpZXMgYXBwcm9wcmlhdGUgQ1NTIGNsYXNzZXMuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIG1vbml0b3JcbiAgICogQHBhcmFtIGNoZWNrQ2hpbGRyZW4gV2hldGhlciB0byBjb3VudCB0aGUgZWxlbWVudCBhcyBmb2N1c2VkIHdoZW4gaXRzIGNoaWxkcmVuIGFyZSBmb2N1c2VkLlxuICAgKiBAcmV0dXJucyBBbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgd2hlbiB0aGUgZm9jdXMgc3RhdGUgb2YgdGhlIGVsZW1lbnQgY2hhbmdlcy5cbiAgICogICAgIFdoZW4gdGhlIGVsZW1lbnQgaXMgYmx1cnJlZCwgbnVsbCB3aWxsIGJlIGVtaXR0ZWQuXG4gICAqL1xuICBtb25pdG9yKGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LCBjaGVja0NoaWxkcmVuPzogYm9vbGVhbik6IE9ic2VydmFibGU8Rm9jdXNPcmlnaW4+O1xuXG4gIG1vbml0b3IoZWxlbWVudDogSFRNTEVsZW1lbnQgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICAgICAgICBjaGVja0NoaWxkcmVuOiBib29sZWFuID0gZmFsc2UpOiBPYnNlcnZhYmxlPEZvY3VzT3JpZ2luPiB7XG4gICAgLy8gRG8gbm90aGluZyBpZiB3ZSdyZSBub3Qgb24gdGhlIGJyb3dzZXIgcGxhdGZvcm0uXG4gICAgaWYgKCF0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIpIHtcbiAgICAgIHJldHVybiBvYnNlcnZhYmxlT2YobnVsbCk7XG4gICAgfVxuXG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoZWxlbWVudCk7XG5cbiAgICAvLyBDaGVjayBpZiB3ZSdyZSBhbHJlYWR5IG1vbml0b3JpbmcgdGhpcyBlbGVtZW50LlxuICAgIGlmICh0aGlzLl9lbGVtZW50SW5mby5oYXMobmF0aXZlRWxlbWVudCkpIHtcbiAgICAgIGxldCBjYWNoZWRJbmZvID0gdGhpcy5fZWxlbWVudEluZm8uZ2V0KG5hdGl2ZUVsZW1lbnQpO1xuICAgICAgY2FjaGVkSW5mbyEuY2hlY2tDaGlsZHJlbiA9IGNoZWNrQ2hpbGRyZW47XG4gICAgICByZXR1cm4gY2FjaGVkSW5mbyEuc3ViamVjdC5hc09ic2VydmFibGUoKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgbW9uaXRvcmVkIGVsZW1lbnQgaW5mby5cbiAgICBsZXQgaW5mbzogTW9uaXRvcmVkRWxlbWVudEluZm8gPSB7XG4gICAgICB1bmxpc3RlbjogKCkgPT4ge30sXG4gICAgICBjaGVja0NoaWxkcmVuOiBjaGVja0NoaWxkcmVuLFxuICAgICAgc3ViamVjdDogbmV3IFN1YmplY3Q8Rm9jdXNPcmlnaW4+KClcbiAgICB9O1xuICAgIHRoaXMuX2VsZW1lbnRJbmZvLnNldChuYXRpdmVFbGVtZW50LCBpbmZvKTtcbiAgICB0aGlzLl9pbmNyZW1lbnRNb25pdG9yZWRFbGVtZW50Q291bnQoKTtcblxuICAgIC8vIFN0YXJ0IGxpc3RlbmluZy4gV2UgbmVlZCB0byBsaXN0ZW4gaW4gY2FwdHVyZSBwaGFzZSBzaW5jZSBmb2N1cyBldmVudHMgZG9uJ3QgYnViYmxlLlxuICAgIGxldCBmb2N1c0xpc3RlbmVyID0gKGV2ZW50OiBGb2N1c0V2ZW50KSA9PiB0aGlzLl9vbkZvY3VzKGV2ZW50LCBuYXRpdmVFbGVtZW50KTtcbiAgICBsZXQgYmx1ckxpc3RlbmVyID0gKGV2ZW50OiBGb2N1c0V2ZW50KSA9PiB0aGlzLl9vbkJsdXIoZXZlbnQsIG5hdGl2ZUVsZW1lbnQpO1xuICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICBuYXRpdmVFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgZm9jdXNMaXN0ZW5lciwgdHJ1ZSk7XG4gICAgICBuYXRpdmVFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCBibHVyTGlzdGVuZXIsIHRydWUpO1xuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIGFuIHVubGlzdGVuIGZ1bmN0aW9uIGZvciBsYXRlci5cbiAgICBpbmZvLnVubGlzdGVuID0gKCkgPT4ge1xuICAgICAgbmF0aXZlRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1cycsIGZvY3VzTGlzdGVuZXIsIHRydWUpO1xuICAgICAgbmF0aXZlRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdibHVyJywgYmx1ckxpc3RlbmVyLCB0cnVlKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGluZm8uc3ViamVjdC5hc09ic2VydmFibGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9wcyBtb25pdG9yaW5nIGFuIGVsZW1lbnQgYW5kIHJlbW92ZXMgYWxsIGZvY3VzIGNsYXNzZXMuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHN0b3AgbW9uaXRvcmluZy5cbiAgICovXG4gIHN0b3BNb25pdG9yaW5nKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogdm9pZDtcblxuICAvKipcbiAgICogU3RvcHMgbW9uaXRvcmluZyBhbiBlbGVtZW50IGFuZCByZW1vdmVzIGFsbCBmb2N1cyBjbGFzc2VzLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBzdG9wIG1vbml0b3JpbmcuXG4gICAqL1xuICBzdG9wTW9uaXRvcmluZyhlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50Pik6IHZvaWQ7XG5cbiAgc3RvcE1vbml0b3JpbmcoZWxlbWVudDogSFRNTEVsZW1lbnQgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50Pik6IHZvaWQge1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnQpO1xuICAgIGNvbnN0IGVsZW1lbnRJbmZvID0gdGhpcy5fZWxlbWVudEluZm8uZ2V0KG5hdGl2ZUVsZW1lbnQpO1xuXG4gICAgaWYgKGVsZW1lbnRJbmZvKSB7XG4gICAgICBlbGVtZW50SW5mby51bmxpc3RlbigpO1xuICAgICAgZWxlbWVudEluZm8uc3ViamVjdC5jb21wbGV0ZSgpO1xuXG4gICAgICB0aGlzLl9zZXRDbGFzc2VzKG5hdGl2ZUVsZW1lbnQpO1xuICAgICAgdGhpcy5fZWxlbWVudEluZm8uZGVsZXRlKG5hdGl2ZUVsZW1lbnQpO1xuICAgICAgdGhpcy5fZGVjcmVtZW50TW9uaXRvcmVkRWxlbWVudENvdW50KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEZvY3VzZXMgdGhlIGVsZW1lbnQgdmlhIHRoZSBzcGVjaWZpZWQgZm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IHRvIGZvY3VzLlxuICAgKiBAcGFyYW0gb3JpZ2luIEZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIHRvIGNvbmZpZ3VyZSB0aGUgZm9jdXMgYmVoYXZpb3IuXG4gICAqL1xuICBmb2N1c1ZpYShlbGVtZW50OiBIVE1MRWxlbWVudCwgb3JpZ2luOiBGb2N1c09yaWdpbiwgb3B0aW9ucz86IEZvY3VzT3B0aW9ucyk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEZvY3VzZXMgdGhlIGVsZW1lbnQgdmlhIHRoZSBzcGVjaWZpZWQgZm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IHRvIGZvY3VzLlxuICAgKiBAcGFyYW0gb3JpZ2luIEZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIHRvIGNvbmZpZ3VyZSB0aGUgZm9jdXMgYmVoYXZpb3IuXG4gICAqL1xuICBmb2N1c1ZpYShlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50Piwgb3JpZ2luOiBGb2N1c09yaWdpbiwgb3B0aW9ucz86IEZvY3VzT3B0aW9ucyk6IHZvaWQ7XG5cbiAgZm9jdXNWaWEoZWxlbWVudDogSFRNTEVsZW1lbnQgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICAgICAgICBvcmlnaW46IEZvY3VzT3JpZ2luLFxuICAgICAgICAgIG9wdGlvbnM/OiBGb2N1c09wdGlvbnMpOiB2b2lkIHtcblxuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnQpO1xuXG4gICAgdGhpcy5fc2V0T3JpZ2luRm9yQ3VycmVudEV2ZW50UXVldWUob3JpZ2luKTtcblxuICAgIC8vIGBmb2N1c2AgaXNuJ3QgYXZhaWxhYmxlIG9uIHRoZSBzZXJ2ZXJcbiAgICBpZiAodHlwZW9mIG5hdGl2ZUVsZW1lbnQuZm9jdXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIENhc3QgdGhlIGVsZW1lbnQgdG8gYGFueWAsIGJlY2F1c2UgdGhlIFRTIHR5cGluZ3MgZG9uJ3QgaGF2ZSB0aGUgYG9wdGlvbnNgIHBhcmFtZXRlciB5ZXQuXG4gICAgICAobmF0aXZlRWxlbWVudCBhcyBhbnkpLmZvY3VzKG9wdGlvbnMpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2VsZW1lbnRJbmZvLmZvckVhY2goKF9pbmZvLCBlbGVtZW50KSA9PiB0aGlzLnN0b3BNb25pdG9yaW5nKGVsZW1lbnQpKTtcbiAgfVxuXG4gIC8qKiBBY2Nlc3MgaW5qZWN0ZWQgZG9jdW1lbnQgaWYgYXZhaWxhYmxlIG9yIGZhbGxiYWNrIHRvIGdsb2JhbCBkb2N1bWVudCByZWZlcmVuY2UgKi9cbiAgcHJpdmF0ZSBfZ2V0RG9jdW1lbnQoKTogRG9jdW1lbnQge1xuICAgIHJldHVybiB0aGlzLl9kb2N1bWVudCB8fCBkb2N1bWVudDtcbiAgfVxuXG4gIC8qKiBVc2UgZGVmYXVsdFZpZXcgb2YgaW5qZWN0ZWQgZG9jdW1lbnQgaWYgYXZhaWxhYmxlIG9yIGZhbGxiYWNrIHRvIGdsb2JhbCB3aW5kb3cgcmVmZXJlbmNlICovXG4gIHByaXZhdGUgX2dldFdpbmRvdygpOiBXaW5kb3cge1xuICAgIGNvbnN0IGRvYyA9IHRoaXMuX2dldERvY3VtZW50KCk7XG4gICAgcmV0dXJuIGRvYy5kZWZhdWx0VmlldyB8fCB3aW5kb3c7XG4gIH1cblxuICBwcml2YXRlIF90b2dnbGVDbGFzcyhlbGVtZW50OiBFbGVtZW50LCBjbGFzc05hbWU6IHN0cmluZywgc2hvdWxkU2V0OiBib29sZWFuKSB7XG4gICAgaWYgKHNob3VsZFNldCkge1xuICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBmb2N1cyBjbGFzc2VzIG9uIHRoZSBlbGVtZW50IGJhc2VkIG9uIHRoZSBnaXZlbiBmb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHVwZGF0ZSB0aGUgY2xhc3NlcyBvbi5cbiAgICogQHBhcmFtIG9yaWdpbiBUaGUgZm9jdXMgb3JpZ2luLlxuICAgKi9cbiAgcHJpdmF0ZSBfc2V0Q2xhc3NlcyhlbGVtZW50OiBIVE1MRWxlbWVudCwgb3JpZ2luPzogRm9jdXNPcmlnaW4pOiB2b2lkIHtcbiAgICBjb25zdCBlbGVtZW50SW5mbyA9IHRoaXMuX2VsZW1lbnRJbmZvLmdldChlbGVtZW50KTtcblxuICAgIGlmIChlbGVtZW50SW5mbykge1xuICAgICAgdGhpcy5fdG9nZ2xlQ2xhc3MoZWxlbWVudCwgJ2Nkay1mb2N1c2VkJywgISFvcmlnaW4pO1xuICAgICAgdGhpcy5fdG9nZ2xlQ2xhc3MoZWxlbWVudCwgJ2Nkay10b3VjaC1mb2N1c2VkJywgb3JpZ2luID09PSAndG91Y2gnKTtcbiAgICAgIHRoaXMuX3RvZ2dsZUNsYXNzKGVsZW1lbnQsICdjZGsta2V5Ym9hcmQtZm9jdXNlZCcsIG9yaWdpbiA9PT0gJ2tleWJvYXJkJyk7XG4gICAgICB0aGlzLl90b2dnbGVDbGFzcyhlbGVtZW50LCAnY2RrLW1vdXNlLWZvY3VzZWQnLCBvcmlnaW4gPT09ICdtb3VzZScpO1xuICAgICAgdGhpcy5fdG9nZ2xlQ2xhc3MoZWxlbWVudCwgJ2Nkay1wcm9ncmFtLWZvY3VzZWQnLCBvcmlnaW4gPT09ICdwcm9ncmFtJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG9yaWdpbiBhbmQgc2NoZWR1bGVzIGFuIGFzeW5jIGZ1bmN0aW9uIHRvIGNsZWFyIGl0IGF0IHRoZSBlbmQgb2YgdGhlIGV2ZW50IHF1ZXVlLlxuICAgKiBJZiB0aGUgZGV0ZWN0aW9uIG1vZGUgaXMgJ2V2ZW50dWFsJywgdGhlIG9yaWdpbiBpcyBuZXZlciBjbGVhcmVkLlxuICAgKiBAcGFyYW0gb3JpZ2luIFRoZSBvcmlnaW4gdG8gc2V0LlxuICAgKi9cbiAgcHJpdmF0ZSBfc2V0T3JpZ2luRm9yQ3VycmVudEV2ZW50UXVldWUob3JpZ2luOiBGb2N1c09yaWdpbik6IHZvaWQge1xuICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICB0aGlzLl9vcmlnaW4gPSBvcmlnaW47XG5cbiAgICAgIGlmICh0aGlzLl9kZXRlY3Rpb25Nb2RlID09PSBGb2N1c01vbml0b3JEZXRlY3Rpb25Nb2RlLklNTUVESUFURSkge1xuICAgICAgICAvLyBTb21ldGltZXMgdGhlIGZvY3VzIG9yaWdpbiB3b24ndCBiZSB2YWxpZCBpbiBGaXJlZm94IGJlY2F1c2UgRmlyZWZveCBzZWVtcyB0byBmb2N1cyAqb25lKlxuICAgICAgICAvLyB0aWNrIGFmdGVyIHRoZSBpbnRlcmFjdGlvbiBldmVudCBmaXJlZC4gVG8gZW5zdXJlIHRoZSBmb2N1cyBvcmlnaW4gaXMgYWx3YXlzIGNvcnJlY3QsXG4gICAgICAgIC8vIHRoZSBmb2N1cyBvcmlnaW4gd2lsbCBiZSBkZXRlcm1pbmVkIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIG5leHQgdGljay5cbiAgICAgICAgdGhpcy5fb3JpZ2luVGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLl9vcmlnaW4gPSBudWxsLCAxKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgZ2l2ZW4gZm9jdXMgZXZlbnQgd2FzIGNhdXNlZCBieSBhIHRvdWNoc3RhcnQgZXZlbnQuXG4gICAqIEBwYXJhbSBldmVudCBUaGUgZm9jdXMgZXZlbnQgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIFdoZXRoZXIgdGhlIGV2ZW50IHdhcyBjYXVzZWQgYnkgYSB0b3VjaC5cbiAgICovXG4gIHByaXZhdGUgX3dhc0NhdXNlZEJ5VG91Y2goZXZlbnQ6IEZvY3VzRXZlbnQpOiBib29sZWFuIHtcbiAgICAvLyBOb3RlKG1tYWxlcmJhKTogVGhpcyBpbXBsZW1lbnRhdGlvbiBpcyBub3QgcXVpdGUgcGVyZmVjdCwgdGhlcmUgaXMgYSBzbWFsbCBlZGdlIGNhc2UuXG4gICAgLy8gQ29uc2lkZXIgdGhlIGZvbGxvd2luZyBkb20gc3RydWN0dXJlOlxuICAgIC8vXG4gICAgLy8gPGRpdiAjcGFyZW50IHRhYmluZGV4PVwiMFwiIGNka0ZvY3VzQ2xhc3Nlcz5cbiAgICAvLyAgIDxkaXYgI2NoaWxkIChjbGljayk9XCIjcGFyZW50LmZvY3VzKClcIj48L2Rpdj5cbiAgICAvLyA8L2Rpdj5cbiAgICAvL1xuICAgIC8vIElmIHRoZSB1c2VyIHRvdWNoZXMgdGhlICNjaGlsZCBlbGVtZW50IGFuZCB0aGUgI3BhcmVudCBpcyBwcm9ncmFtbWF0aWNhbGx5IGZvY3VzZWQgYXMgYVxuICAgIC8vIHJlc3VsdCwgdGhpcyBjb2RlIHdpbGwgc3RpbGwgY29uc2lkZXIgaXQgdG8gaGF2ZSBiZWVuIGNhdXNlZCBieSB0aGUgdG91Y2ggZXZlbnQgYW5kIHdpbGxcbiAgICAvLyBhcHBseSB0aGUgY2RrLXRvdWNoLWZvY3VzZWQgY2xhc3MgcmF0aGVyIHRoYW4gdGhlIGNkay1wcm9ncmFtLWZvY3VzZWQgY2xhc3MuIFRoaXMgaXMgYVxuICAgIC8vIHJlbGF0aXZlbHkgc21hbGwgZWRnZS1jYXNlIHRoYXQgY2FuIGJlIHdvcmtlZCBhcm91bmQgYnkgdXNpbmdcbiAgICAvLyBmb2N1c1ZpYShwYXJlbnRFbCwgJ3Byb2dyYW0nKSB0byBmb2N1cyB0aGUgcGFyZW50IGVsZW1lbnQuXG4gICAgLy9cbiAgICAvLyBJZiB3ZSBkZWNpZGUgdGhhdCB3ZSBhYnNvbHV0ZWx5IG11c3QgaGFuZGxlIHRoaXMgY2FzZSBjb3JyZWN0bHksIHdlIGNhbiBkbyBzbyBieSBsaXN0ZW5pbmdcbiAgICAvLyBmb3IgdGhlIGZpcnN0IGZvY3VzIGV2ZW50IGFmdGVyIHRoZSB0b3VjaHN0YXJ0LCBhbmQgdGhlbiB0aGUgZmlyc3QgYmx1ciBldmVudCBhZnRlciB0aGF0XG4gICAgLy8gZm9jdXMgZXZlbnQuIFdoZW4gdGhhdCBibHVyIGV2ZW50IGZpcmVzIHdlIGtub3cgdGhhdCB3aGF0ZXZlciBmb2xsb3dzIGlzIG5vdCBhIHJlc3VsdCBvZiB0aGVcbiAgICAvLyB0b3VjaHN0YXJ0LlxuICAgIGxldCBmb2N1c1RhcmdldCA9IGV2ZW50LnRhcmdldDtcbiAgICByZXR1cm4gdGhpcy5fbGFzdFRvdWNoVGFyZ2V0IGluc3RhbmNlb2YgTm9kZSAmJiBmb2N1c1RhcmdldCBpbnN0YW5jZW9mIE5vZGUgJiZcbiAgICAgICAgKGZvY3VzVGFyZ2V0ID09PSB0aGlzLl9sYXN0VG91Y2hUYXJnZXQgfHwgZm9jdXNUYXJnZXQuY29udGFpbnModGhpcy5fbGFzdFRvdWNoVGFyZ2V0KSk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBmb2N1cyBldmVudHMgb24gYSByZWdpc3RlcmVkIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBldmVudCBUaGUgZm9jdXMgZXZlbnQuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBtb25pdG9yZWQgZWxlbWVudC5cbiAgICovXG4gIHByaXZhdGUgX29uRm9jdXMoZXZlbnQ6IEZvY3VzRXZlbnQsIGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgLy8gTk9URShtbWFsZXJiYSk6IFdlIGN1cnJlbnRseSBzZXQgdGhlIGNsYXNzZXMgYmFzZWQgb24gdGhlIGZvY3VzIG9yaWdpbiBvZiB0aGUgbW9zdCByZWNlbnRcbiAgICAvLyBmb2N1cyBldmVudCBhZmZlY3RpbmcgdGhlIG1vbml0b3JlZCBlbGVtZW50LiBJZiB3ZSB3YW50IHRvIHVzZSB0aGUgb3JpZ2luIG9mIHRoZSBmaXJzdCBldmVudFxuICAgIC8vIGluc3RlYWQgd2Ugc2hvdWxkIGNoZWNrIGZvciB0aGUgY2RrLWZvY3VzZWQgY2xhc3MgaGVyZSBhbmQgcmV0dXJuIGlmIHRoZSBlbGVtZW50IGFscmVhZHkgaGFzXG4gICAgLy8gaXQuIChUaGlzIG9ubHkgbWF0dGVycyBmb3IgZWxlbWVudHMgdGhhdCBoYXZlIGluY2x1ZGVzQ2hpbGRyZW4gPSB0cnVlKS5cblxuICAgIC8vIElmIHdlIGFyZSBub3QgY291bnRpbmcgY2hpbGQtZWxlbWVudC1mb2N1cyBhcyBmb2N1c2VkLCBtYWtlIHN1cmUgdGhhdCB0aGUgZXZlbnQgdGFyZ2V0IGlzIHRoZVxuICAgIC8vIG1vbml0b3JlZCBlbGVtZW50IGl0c2VsZi5cbiAgICBjb25zdCBlbGVtZW50SW5mbyA9IHRoaXMuX2VsZW1lbnRJbmZvLmdldChlbGVtZW50KTtcbiAgICBpZiAoIWVsZW1lbnRJbmZvIHx8ICghZWxlbWVudEluZm8uY2hlY2tDaGlsZHJlbiAmJiBlbGVtZW50ICE9PSBldmVudC50YXJnZXQpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgY291bGRuJ3QgZGV0ZWN0IGEgY2F1c2UgZm9yIHRoZSBmb2N1cyBldmVudCwgaXQncyBkdWUgdG8gb25lIG9mIHRocmVlIHJlYXNvbnM6XG4gICAgLy8gMSkgVGhlIHdpbmRvdyBoYXMganVzdCByZWdhaW5lZCBmb2N1cywgaW4gd2hpY2ggY2FzZSB3ZSB3YW50IHRvIHJlc3RvcmUgdGhlIGZvY3VzZWQgc3RhdGUgb2ZcbiAgICAvLyAgICB0aGUgZWxlbWVudCBmcm9tIGJlZm9yZSB0aGUgd2luZG93IGJsdXJyZWQuXG4gICAgLy8gMikgSXQgd2FzIGNhdXNlZCBieSBhIHRvdWNoIGV2ZW50LCBpbiB3aGljaCBjYXNlIHdlIG1hcmsgdGhlIG9yaWdpbiBhcyAndG91Y2gnLlxuICAgIC8vIDMpIFRoZSBlbGVtZW50IHdhcyBwcm9ncmFtbWF0aWNhbGx5IGZvY3VzZWQsIGluIHdoaWNoIGNhc2Ugd2Ugc2hvdWxkIG1hcmsgdGhlIG9yaWdpbiBhc1xuICAgIC8vICAgICdwcm9ncmFtJy5cbiAgICBsZXQgb3JpZ2luID0gdGhpcy5fb3JpZ2luO1xuICAgIGlmICghb3JpZ2luKSB7XG4gICAgICBpZiAodGhpcy5fd2luZG93Rm9jdXNlZCAmJiB0aGlzLl9sYXN0Rm9jdXNPcmlnaW4pIHtcbiAgICAgICAgb3JpZ2luID0gdGhpcy5fbGFzdEZvY3VzT3JpZ2luO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLl93YXNDYXVzZWRCeVRvdWNoKGV2ZW50KSkge1xuICAgICAgICBvcmlnaW4gPSAndG91Y2gnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3JpZ2luID0gJ3Byb2dyYW0nO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX3NldENsYXNzZXMoZWxlbWVudCwgb3JpZ2luKTtcbiAgICB0aGlzLl9lbWl0T3JpZ2luKGVsZW1lbnRJbmZvLnN1YmplY3QsIG9yaWdpbik7XG4gICAgdGhpcy5fbGFzdEZvY3VzT3JpZ2luID0gb3JpZ2luO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgYmx1ciBldmVudHMgb24gYSByZWdpc3RlcmVkIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBldmVudCBUaGUgYmx1ciBldmVudC5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIG1vbml0b3JlZCBlbGVtZW50LlxuICAgKi9cbiAgX29uQmx1cihldmVudDogRm9jdXNFdmVudCwgZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgICAvLyBJZiB3ZSBhcmUgY291bnRpbmcgY2hpbGQtZWxlbWVudC1mb2N1cyBhcyBmb2N1c2VkLCBtYWtlIHN1cmUgdGhhdCB3ZSBhcmVuJ3QganVzdCBibHVycmluZyBpblxuICAgIC8vIG9yZGVyIHRvIGZvY3VzIGFub3RoZXIgY2hpbGQgb2YgdGhlIG1vbml0b3JlZCBlbGVtZW50LlxuICAgIGNvbnN0IGVsZW1lbnRJbmZvID0gdGhpcy5fZWxlbWVudEluZm8uZ2V0KGVsZW1lbnQpO1xuXG4gICAgaWYgKCFlbGVtZW50SW5mbyB8fCAoZWxlbWVudEluZm8uY2hlY2tDaGlsZHJlbiAmJiBldmVudC5yZWxhdGVkVGFyZ2V0IGluc3RhbmNlb2YgTm9kZSAmJlxuICAgICAgICBlbGVtZW50LmNvbnRhaW5zKGV2ZW50LnJlbGF0ZWRUYXJnZXQpKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3NldENsYXNzZXMoZWxlbWVudCk7XG4gICAgdGhpcy5fZW1pdE9yaWdpbihlbGVtZW50SW5mby5zdWJqZWN0LCBudWxsKTtcbiAgfVxuXG4gIHByaXZhdGUgX2VtaXRPcmlnaW4oc3ViamVjdDogU3ViamVjdDxGb2N1c09yaWdpbj4sIG9yaWdpbjogRm9jdXNPcmlnaW4pIHtcbiAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHN1YmplY3QubmV4dChvcmlnaW4pKTtcbiAgfVxuXG4gIHByaXZhdGUgX2luY3JlbWVudE1vbml0b3JlZEVsZW1lbnRDb3VudCgpIHtcbiAgICAvLyBSZWdpc3RlciBnbG9iYWwgbGlzdGVuZXJzIHdoZW4gZmlyc3QgZWxlbWVudCBpcyBtb25pdG9yZWQuXG4gICAgaWYgKCsrdGhpcy5fbW9uaXRvcmVkRWxlbWVudENvdW50ID09IDEgJiYgdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICAvLyBOb3RlOiB3ZSBsaXN0ZW4gdG8gZXZlbnRzIGluIHRoZSBjYXB0dXJlIHBoYXNlIHNvIHdlXG4gICAgICAvLyBjYW4gZGV0ZWN0IHRoZW0gZXZlbiBpZiB0aGUgdXNlciBzdG9wcyBwcm9wYWdhdGlvbi5cbiAgICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIGNvbnN0IGRvY3VtZW50ID0gdGhpcy5fZ2V0RG9jdW1lbnQoKTtcbiAgICAgICAgY29uc3Qgd2luZG93ID0gdGhpcy5fZ2V0V2luZG93KCk7XG5cbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX2RvY3VtZW50S2V5ZG93bkxpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX2RvY3VtZW50TW91c2Vkb3duTGlzdGVuZXIsXG4gICAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuX2RvY3VtZW50VG91Y2hzdGFydExpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMuX3dpbmRvd0ZvY3VzTGlzdGVuZXIpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfZGVjcmVtZW50TW9uaXRvcmVkRWxlbWVudENvdW50KCkge1xuICAgIC8vIFVucmVnaXN0ZXIgZ2xvYmFsIGxpc3RlbmVycyB3aGVuIGxhc3QgZWxlbWVudCBpcyB1bm1vbml0b3JlZC5cbiAgICBpZiAoIS0tdGhpcy5fbW9uaXRvcmVkRWxlbWVudENvdW50KSB7XG4gICAgICBjb25zdCBkb2N1bWVudCA9IHRoaXMuX2dldERvY3VtZW50KCk7XG4gICAgICBjb25zdCB3aW5kb3cgPSB0aGlzLl9nZXRXaW5kb3coKTtcblxuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX2RvY3VtZW50S2V5ZG93bkxpc3RlbmVyLFxuICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fZG9jdW1lbnRNb3VzZWRvd25MaXN0ZW5lcixcbiAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9kb2N1bWVudFRvdWNoc3RhcnRMaXN0ZW5lcixcbiAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMuX3dpbmRvd0ZvY3VzTGlzdGVuZXIpO1xuXG4gICAgICAvLyBDbGVhciB0aW1lb3V0cyBmb3IgYWxsIHBvdGVudGlhbGx5IHBlbmRpbmcgdGltZW91dHMgdG8gcHJldmVudCB0aGUgbGVha3MuXG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fd2luZG93Rm9jdXNUaW1lb3V0SWQpO1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3RvdWNoVGltZW91dElkKTtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9vcmlnaW5UaW1lb3V0SWQpO1xuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogRGlyZWN0aXZlIHRoYXQgZGV0ZXJtaW5lcyBob3cgYSBwYXJ0aWN1bGFyIGVsZW1lbnQgd2FzIGZvY3VzZWQgKHZpYSBrZXlib2FyZCwgbW91c2UsIHRvdWNoLCBvclxuICogcHJvZ3JhbW1hdGljYWxseSkgYW5kIGFkZHMgY29ycmVzcG9uZGluZyBjbGFzc2VzIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIFRoZXJlIGFyZSB0d28gdmFyaWFudHMgb2YgdGhpcyBkaXJlY3RpdmU6XG4gKiAxKSBjZGtNb25pdG9yRWxlbWVudEZvY3VzOiBkb2VzIG5vdCBjb25zaWRlciBhbiBlbGVtZW50IHRvIGJlIGZvY3VzZWQgaWYgb25lIG9mIGl0cyBjaGlsZHJlbiBpc1xuICogICAgZm9jdXNlZC5cbiAqIDIpIGNka01vbml0b3JTdWJ0cmVlRm9jdXM6IGNvbnNpZGVycyBhbiBlbGVtZW50IGZvY3VzZWQgaWYgaXQgb3IgYW55IG9mIGl0cyBjaGlsZHJlbiBhcmUgZm9jdXNlZC5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka01vbml0b3JFbGVtZW50Rm9jdXNdLCBbY2RrTW9uaXRvclN1YnRyZWVGb2N1c10nLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtNb25pdG9yRm9jdXMgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9tb25pdG9yU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb247XG4gIEBPdXRwdXQoKSBjZGtGb2N1c0NoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8Rm9jdXNPcmlnaW4+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sIHByaXZhdGUgX2ZvY3VzTW9uaXRvcjogRm9jdXNNb25pdG9yKSB7XG4gICAgdGhpcy5fbW9uaXRvclN1YnNjcmlwdGlvbiA9IHRoaXMuX2ZvY3VzTW9uaXRvci5tb25pdG9yKFxuICAgICAgICB0aGlzLl9lbGVtZW50UmVmLFxuICAgICAgICB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuaGFzQXR0cmlidXRlKCdjZGtNb25pdG9yU3VidHJlZUZvY3VzJykpXG4gICAgICAgIC5zdWJzY3JpYmUob3JpZ2luID0+IHRoaXMuY2RrRm9jdXNDaGFuZ2UuZW1pdChvcmlnaW4pKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2ZvY3VzTW9uaXRvci5zdG9wTW9uaXRvcmluZyh0aGlzLl9lbGVtZW50UmVmKTtcbiAgICB0aGlzLl9tb25pdG9yU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gIH1cbn1cbiJdfQ==