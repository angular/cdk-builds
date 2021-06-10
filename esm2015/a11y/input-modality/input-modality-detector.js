/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ALT, CONTROL, MAC_META, META, SHIFT } from '@angular/cdk/keycodes';
import { Inject, Injectable, InjectionToken, Optional, NgZone } from '@angular/core';
import { normalizePassiveListenerOptions, Platform } from '@angular/cdk/platform';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, skip } from 'rxjs/operators';
import { isFakeMousedownFromScreenReader, isFakeTouchstartFromScreenReader, } from '../fake-event-detection';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
import * as i2 from "@angular/common";
/**
 * Injectable options for the InputModalityDetector. These are shallowly merged with the default
 * options.
 */
export const INPUT_MODALITY_DETECTOR_OPTIONS = new InjectionToken('cdk-input-modality-detector-options');
/**
 * Default options for the InputModalityDetector.
 *
 * Modifier keys are ignored by default (i.e. when pressed won't cause the service to detect
 * keyboard input modality) for two reasons:
 *
 * 1. Modifier keys are commonly used with mouse to perform actions such as 'right click' or 'open
 *    in new tab', and are thus less representative of actual keyboard interaction.
 * 2. VoiceOver triggers some keyboard events when linearly navigating with Control + Option (but
 *    confusingly not with Caps Lock). Thus, to have parity with other screen readers, we ignore
 *    these keys so as to not update the input modality.
 *
 * Note that we do not by default ignore the right Meta key on Safari because it has the same key
 * code as the ContextMenu key on other browsers. When we switch to using event.key, we can
 * distinguish between the two.
 */
export const INPUT_MODALITY_DETECTOR_DEFAULT_OPTIONS = {
    ignoreKeys: [ALT, CONTROL, MAC_META, META, SHIFT],
};
/**
 * The amount of time needed to pass after a touchstart event in order for a subsequent mousedown
 * event to be attributed as mouse and not touch.
 *
 * This is the value used by AngularJS Material. Through trial and error (on iPhone 6S) they found
 * that a value of around 650ms seems appropriate.
 */
export const TOUCH_BUFFER_MS = 650;
/**
 * Event listener options that enable capturing and also mark the listener as passive if the browser
 * supports it.
 */
const modalityEventListenerOptions = normalizePassiveListenerOptions({
    passive: true,
    capture: true,
});
/**
 * Service that detects the user's input modality.
 *
 * This service does not update the input modality when a user navigates with a screen reader
 * (e.g. linear navigation with VoiceOver, object navigation / browse mode with NVDA, virtual PC
 * cursor mode with JAWS). This is in part due to technical limitations (i.e. keyboard events do not
 * fire as expected in these modes) but is also arguably the correct behavior. Navigating with a
 * screen reader is akin to visually scanning a page, and should not be interpreted as actual user
 * input interaction.
 *
 * When a user is not navigating but *interacting* with a screen reader, this service attempts to
 * update the input modality to keyboard, but in general this service's behavior is largely
 * undefined.
 */
export class InputModalityDetector {
    constructor(_platform, ngZone, document, options) {
        this._platform = _platform;
        /**
         * The most recently detected input modality event target. Is null if no input modality has been
         * detected or if the associated event target is null for some unknown reason.
         */
        this._mostRecentTarget = null;
        /** The underlying BehaviorSubject that emits whenever an input modality is detected. */
        this._modality = new BehaviorSubject(null);
        /**
         * The timestamp of the last touch input modality. Used to determine whether mousedown events
         * should be attributed to mouse or touch.
         */
        this._lastTouchMs = 0;
        /**
         * Handles keydown events. Must be an arrow function in order to preserve the context when it gets
         * bound.
         */
        this._onKeydown = (event) => {
            var _a, _b;
            // If this is one of the keys we should ignore, then ignore it and don't update the input
            // modality to keyboard.
            if ((_b = (_a = this._options) === null || _a === void 0 ? void 0 : _a.ignoreKeys) === null || _b === void 0 ? void 0 : _b.some(keyCode => keyCode === event.keyCode)) {
                return;
            }
            this._modality.next('keyboard');
            this._mostRecentTarget = getTarget(event);
        };
        /**
         * Handles mousedown events. Must be an arrow function in order to preserve the context when it
         * gets bound.
         */
        this._onMousedown = (event) => {
            // Touches trigger both touch and mouse events, so we need to distinguish between mouse events
            // that were triggered via mouse vs touch. To do so, check if the mouse event occurs closely
            // after the previous touch event.
            if (Date.now() - this._lastTouchMs < TOUCH_BUFFER_MS) {
                return;
            }
            // Fake mousedown events are fired by some screen readers when controls are activated by the
            // screen reader. Attribute them to keyboard input modality.
            this._modality.next(isFakeMousedownFromScreenReader(event) ? 'keyboard' : 'mouse');
            this._mostRecentTarget = getTarget(event);
        };
        /**
         * Handles touchstart events. Must be an arrow function in order to preserve the context when it
         * gets bound.
         */
        this._onTouchstart = (event) => {
            // Same scenario as mentioned in _onMousedown, but on touch screen devices, fake touchstart
            // events are fired. Again, attribute to keyboard input modality.
            if (isFakeTouchstartFromScreenReader(event)) {
                this._modality.next('keyboard');
                return;
            }
            // Store the timestamp of this touch event, as it's used to distinguish between mouse events
            // triggered via mouse vs touch.
            this._lastTouchMs = Date.now();
            this._modality.next('touch');
            this._mostRecentTarget = getTarget(event);
        };
        this._options = Object.assign(Object.assign({}, INPUT_MODALITY_DETECTOR_DEFAULT_OPTIONS), options);
        // Skip the first emission as it's null.
        this.modalityDetected = this._modality.pipe(skip(1));
        this.modalityChanged = this.modalityDetected.pipe(distinctUntilChanged());
        // If we're not in a browser, this service should do nothing, as there's no relevant input
        // modality to detect.
        if (!_platform.isBrowser) {
            return;
        }
        // Add the event listeners used to detect the user's input modality.
        ngZone.runOutsideAngular(() => {
            document.addEventListener('keydown', this._onKeydown, modalityEventListenerOptions);
            document.addEventListener('mousedown', this._onMousedown, modalityEventListenerOptions);
            document.addEventListener('touchstart', this._onTouchstart, modalityEventListenerOptions);
        });
    }
    /** The most recently detected input modality. */
    get mostRecentModality() {
        return this._modality.value;
    }
    ngOnDestroy() {
        if (!this._platform.isBrowser) {
            return;
        }
        document.removeEventListener('keydown', this._onKeydown, modalityEventListenerOptions);
        document.removeEventListener('mousedown', this._onMousedown, modalityEventListenerOptions);
        document.removeEventListener('touchstart', this._onTouchstart, modalityEventListenerOptions);
    }
}
InputModalityDetector.ɵprov = i0.ɵɵdefineInjectable({ factory: function InputModalityDetector_Factory() { return new InputModalityDetector(i0.ɵɵinject(i1.Platform), i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i2.DOCUMENT), i0.ɵɵinject(INPUT_MODALITY_DETECTOR_OPTIONS, 8)); }, token: InputModalityDetector, providedIn: "root" });
InputModalityDetector.decorators = [
    { type: Injectable, args: [{ providedIn: 'root' },] }
];
InputModalityDetector.ctorParameters = () => [
    { type: Platform },
    { type: NgZone },
    { type: Document, decorators: [{ type: Inject, args: [DOCUMENT,] }] },
    { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [INPUT_MODALITY_DETECTOR_OPTIONS,] }] }
];
/** Gets the target of an event, accounting for Shadow DOM. */
export function getTarget(event) {
    // If an event is bound outside the Shadow DOM, the `event.target` will
    // point to the shadow root so we have to use `composedPath` instead.
    return (event.composedPath ? event.composedPath()[0] : event.target);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXQtbW9kYWxpdHktZGV0ZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2ExMXkvaW5wdXQtbW9kYWxpdHkvaW5wdXQtbW9kYWxpdHktZGV0ZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRSxPQUFPLEVBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxjQUFjLEVBQWEsUUFBUSxFQUFFLE1BQU0sRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM5RixPQUFPLEVBQUMsK0JBQStCLEVBQUUsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDaEYsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxlQUFlLEVBQWEsTUFBTSxNQUFNLENBQUM7QUFDakQsT0FBTyxFQUFDLG9CQUFvQixFQUFFLElBQUksRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzFELE9BQU8sRUFDTCwrQkFBK0IsRUFDL0IsZ0NBQWdDLEdBQ2pDLE1BQU0seUJBQXlCLENBQUM7Ozs7QUFhakM7OztHQUdHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sK0JBQStCLEdBQzFDLElBQUksY0FBYyxDQUErQixxQ0FBcUMsQ0FBQyxDQUFDO0FBRTFGOzs7Ozs7Ozs7Ozs7Ozs7R0FlRztBQUNILE1BQU0sQ0FBQyxNQUFNLHVDQUF1QyxHQUFpQztJQUNuRixVQUFVLEVBQUUsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDO0NBQ2xELENBQUM7QUFFRjs7Ozs7O0dBTUc7QUFDSCxNQUFNLENBQUMsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDO0FBRW5DOzs7R0FHRztB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Q0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBdUIsQ0FBQztBQUM3RixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QUxULCBDT05UUk9MLCBNQUNfTUVUQSwgTUVUQSwgU0hJRlR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9rZXljb2Rlcyc7XG5pbXBvcnQge0luamVjdCwgSW5qZWN0YWJsZSwgSW5qZWN0aW9uVG9rZW4sIE9uRGVzdHJveSwgT3B0aW9uYWwsIE5nWm9uZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge25vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMsIFBsYXRmb3JtfSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7QmVoYXZpb3JTdWJqZWN0LCBPYnNlcnZhYmxlfSBmcm9tICdyeGpzJztcbmltcG9ydCB7ZGlzdGluY3RVbnRpbENoYW5nZWQsIHNraXB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7XG4gIGlzRmFrZU1vdXNlZG93bkZyb21TY3JlZW5SZWFkZXIsXG4gIGlzRmFrZVRvdWNoc3RhcnRGcm9tU2NyZWVuUmVhZGVyLFxufSBmcm9tICcuLi9mYWtlLWV2ZW50LWRldGVjdGlvbic7XG5cbi8qKlxuICogVGhlIGlucHV0IG1vZGFsaXRpZXMgZGV0ZWN0ZWQgYnkgdGhpcyBzZXJ2aWNlLiBOdWxsIGlzIHVzZWQgaWYgdGhlIGlucHV0IG1vZGFsaXR5IGlzIHVua25vd24uXG4gKi9cbmV4cG9ydCB0eXBlIElucHV0TW9kYWxpdHkgPSAna2V5Ym9hcmQnIHwgJ21vdXNlJyB8ICd0b3VjaCcgfCBudWxsO1xuXG4vKiogT3B0aW9ucyB0byBjb25maWd1cmUgdGhlIGJlaGF2aW9yIG9mIHRoZSBJbnB1dE1vZGFsaXR5RGV0ZWN0b3IuICovXG5leHBvcnQgaW50ZXJmYWNlIElucHV0TW9kYWxpdHlEZXRlY3Rvck9wdGlvbnMge1xuICAvKiogS2V5cyB0byBpZ25vcmUgd2hlbiBkZXRlY3Rpbmcga2V5Ym9hcmQgaW5wdXQgbW9kYWxpdHkuICovXG4gIGlnbm9yZUtleXM/OiBudW1iZXJbXTtcbn1cblxuLyoqXG4gKiBJbmplY3RhYmxlIG9wdGlvbnMgZm9yIHRoZSBJbnB1dE1vZGFsaXR5RGV0ZWN0b3IuIFRoZXNlIGFyZSBzaGFsbG93bHkgbWVyZ2VkIHdpdGggdGhlIGRlZmF1bHRcbiAqIG9wdGlvbnMuXG4gKi9cbmV4cG9ydCBjb25zdCBJTlBVVF9NT0RBTElUWV9ERVRFQ1RPUl9PUFRJT05TID1cbiAgbmV3IEluamVjdGlvblRva2VuPElucHV0TW9kYWxpdHlEZXRlY3Rvck9wdGlvbnM+KCdjZGstaW5wdXQtbW9kYWxpdHktZGV0ZWN0b3Itb3B0aW9ucycpO1xuXG4vKipcbiAqIERlZmF1bHQgb3B0aW9ucyBmb3IgdGhlIElucHV0TW9kYWxpdHlEZXRlY3Rvci5cbiAqXG4gKiBNb2RpZmllciBrZXlzIGFyZSBpZ25vcmVkIGJ5IGRlZmF1bHQgKGkuZS4gd2hlbiBwcmVzc2VkIHdvbid0IGNhdXNlIHRoZSBzZXJ2aWNlIHRvIGRldGVjdFxuICoga2V5Ym9hcmQgaW5wdXQgbW9kYWxpdHkpIGZvciB0d28gcmVhc29uczpcbiAqXG4gKiAxLiBNb2RpZmllciBrZXlzIGFyZSBjb21tb25seSB1c2VkIHdpdGggbW91c2UgdG8gcGVyZm9ybSBhY3Rpb25zIHN1Y2ggYXMgJ3JpZ2h0IGNsaWNrJyBvciAnb3BlblxuICogICAgaW4gbmV3IHRhYicsIGFuZCBhcmUgdGh1cyBsZXNzIHJlcHJlc2VudGF0aXZlIG9mIGFjdHVhbCBrZXlib2FyZCBpbnRlcmFjdGlvbi5cbiAqIDIuIFZvaWNlT3ZlciB0cmlnZ2VycyBzb21lIGtleWJvYXJkIGV2ZW50cyB3aGVuIGxpbmVhcmx5IG5hdmlnYXRpbmcgd2l0aCBDb250cm9sICsgT3B0aW9uIChidXRcbiAqICAgIGNvbmZ1c2luZ2x5IG5vdCB3aXRoIENhcHMgTG9jaykuIFRodXMsIHRvIGhhdmUgcGFyaXR5IHdpdGggb3RoZXIgc2NyZWVuIHJlYWRlcnMsIHdlIGlnbm9yZVxuICogICAgdGhlc2Uga2V5cyBzbyBhcyB0byBub3QgdXBkYXRlIHRoZSBpbnB1dCBtb2RhbGl0eS5cbiAqXG4gKiBOb3RlIHRoYXQgd2UgZG8gbm90IGJ5IGRlZmF1bHQgaWdub3JlIHRoZSByaWdodCBNZXRhIGtleSBvbiBTYWZhcmkgYmVjYXVzZSBpdCBoYXMgdGhlIHNhbWUga2V5XG4gKiBjb2RlIGFzIHRoZSBDb250ZXh0TWVudSBrZXkgb24gb3RoZXIgYnJvd3NlcnMuIFdoZW4gd2Ugc3dpdGNoIHRvIHVzaW5nIGV2ZW50LmtleSwgd2UgY2FuXG4gKiBkaXN0aW5ndWlzaCBiZXR3ZWVuIHRoZSB0d28uXG4gKi9cbmV4cG9ydCBjb25zdCBJTlBVVF9NT0RBTElUWV9ERVRFQ1RPUl9ERUZBVUxUX09QVElPTlM6IElucHV0TW9kYWxpdHlEZXRlY3Rvck9wdGlvbnMgPSB7XG4gIGlnbm9yZUtleXM6IFtBTFQsIENPTlRST0wsIE1BQ19NRVRBLCBNRVRBLCBTSElGVF0sXG59O1xuXG4vKipcbiAqIFRoZSBhbW91bnQgb2YgdGltZSBuZWVkZWQgdG8gcGFzcyBhZnRlciBhIHRvdWNoc3RhcnQgZXZlbnQgaW4gb3JkZXIgZm9yIGEgc3Vic2VxdWVudCBtb3VzZWRvd25cbiAqIGV2ZW50IHRvIGJlIGF0dHJpYnV0ZWQgYXMgbW91c2UgYW5kIG5vdCB0b3VjaC5cbiAqXG4gKiBUaGlzIGlzIHRoZSB2YWx1ZSB1c2VkIGJ5IEFuZ3VsYXJKUyBNYXRlcmlhbC4gVGhyb3VnaCB0cmlhbCBhbmQgZXJyb3IgKG9uIGlQaG9uZSA2UykgdGhleSBmb3VuZFxuICogdGhhdCBhIHZhbHVlIG9mIGFyb3VuZCA2NTBtcyBzZWVtcyBhcHByb3ByaWF0ZS5cbiAqL1xuZXhwb3J0IGNvbnN0IFRPVUNIX0JVRkZFUl9NUyA9IDY1MDtcblxuLyoqXG4gKiBFdmVudCBsaXN0ZW5lciBvcHRpb25zIHRoYXQgZW5hYmxlIGNhcHR1cmluZyBhbmQgYWxzbyBtYXJrIHRoZSBsaXN0ZW5lciBhcyBwYXNzaXZlIGlmIHRoZSBicm93c2VyXG4gKiBzdXBwb3J0cyBpdC5cbiAqL1xuY29uc3QgbW9kYWxpdHlFdmVudExpc3RlbmVyT3B0aW9ucyA9IG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMoe1xuICBwYXNzaXZlOiB0cnVlLFxuICBjYXB0dXJlOiB0cnVlLFxufSk7XG5cbi8qKlxuICogU2VydmljZSB0aGF0IGRldGVjdHMgdGhlIHVzZXIncyBpbnB1dCBtb2RhbGl0eS5cbiAqXG4gKiBUaGlzIHNlcnZpY2UgZG9lcyBub3QgdXBkYXRlIHRoZSBpbnB1dCBtb2RhbGl0eSB3aGVuIGEgdXNlciBuYXZpZ2F0ZXMgd2l0aCBhIHNjcmVlbiByZWFkZXJcbiAqIChlLmcuIGxpbmVhciBuYXZpZ2F0aW9uIHdpdGggVm9pY2VPdmVyLCBvYmplY3QgbmF2aWdhdGlvbiAvIGJyb3dzZSBtb2RlIHdpdGggTlZEQSwgdmlydHVhbCBQQ1xuICogY3Vyc29yIG1vZGUgd2l0aCBKQVdTKS4gVGhpcyBpcyBpbiBwYXJ0IGR1ZSB0byB0ZWNobmljYWwgbGltaXRhdGlvbnMgKGkuZS4ga2V5Ym9hcmQgZXZlbnRzIGRvIG5vdFxuICogZmlyZSBhcyBleHBlY3RlZCBpbiB0aGVzZSBtb2RlcykgYnV0IGlzIGFsc28gYXJndWFibHkgdGhlIGNvcnJlY3QgYmVoYXZpb3IuIE5hdmlnYXRpbmcgd2l0aCBhXG4gKiBzY3JlZW4gcmVhZGVyIGlzIGFraW4gdG8gdmlzdWFsbHkgc2Nhbm5pbmcgYSBwYWdlLCBhbmQgc2hvdWxkIG5vdCBiZSBpbnRlcnByZXRlZCBhcyBhY3R1YWwgdXNlclxuICogaW5wdXQgaW50ZXJhY3Rpb24uXG4gKlxuICogV2hlbiBhIHVzZXIgaXMgbm90IG5hdmlnYXRpbmcgYnV0ICppbnRlcmFjdGluZyogd2l0aCBhIHNjcmVlbiByZWFkZXIsIHRoaXMgc2VydmljZSBhdHRlbXB0cyB0b1xuICogdXBkYXRlIHRoZSBpbnB1dCBtb2RhbGl0eSB0byBrZXlib2FyZCwgYnV0IGluIGdlbmVyYWwgdGhpcyBzZXJ2aWNlJ3MgYmVoYXZpb3IgaXMgbGFyZ2VseVxuICogdW5kZWZpbmVkLlxuICovXG5ASW5qZWN0YWJsZSh7IHByb3ZpZGVkSW46ICdyb290JyB9KVxuZXhwb3J0IGNsYXNzIElucHV0TW9kYWxpdHlEZXRlY3RvciBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qKiBFbWl0cyB3aGVuZXZlciBhbiBpbnB1dCBtb2RhbGl0eSBpcyBkZXRlY3RlZC4gKi9cbiAgcmVhZG9ubHkgbW9kYWxpdHlEZXRlY3RlZDogT2JzZXJ2YWJsZTxJbnB1dE1vZGFsaXR5PjtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgaW5wdXQgbW9kYWxpdHkgY2hhbmdlcy4gKi9cbiAgcmVhZG9ubHkgbW9kYWxpdHlDaGFuZ2VkOiBPYnNlcnZhYmxlPElucHV0TW9kYWxpdHk+O1xuXG4gIC8qKiBUaGUgbW9zdCByZWNlbnRseSBkZXRlY3RlZCBpbnB1dCBtb2RhbGl0eS4gKi9cbiAgZ2V0IG1vc3RSZWNlbnRNb2RhbGl0eSgpOiBJbnB1dE1vZGFsaXR5IHtcbiAgICByZXR1cm4gdGhpcy5fbW9kYWxpdHkudmFsdWU7XG4gIH1cblxuICAvKipcbiAgICogVGhlIG1vc3QgcmVjZW50bHkgZGV0ZWN0ZWQgaW5wdXQgbW9kYWxpdHkgZXZlbnQgdGFyZ2V0LiBJcyBudWxsIGlmIG5vIGlucHV0IG1vZGFsaXR5IGhhcyBiZWVuXG4gICAqIGRldGVjdGVkIG9yIGlmIHRoZSBhc3NvY2lhdGVkIGV2ZW50IHRhcmdldCBpcyBudWxsIGZvciBzb21lIHVua25vd24gcmVhc29uLlxuICAgKi9cbiAgX21vc3RSZWNlbnRUYXJnZXQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIFRoZSB1bmRlcmx5aW5nIEJlaGF2aW9yU3ViamVjdCB0aGF0IGVtaXRzIHdoZW5ldmVyIGFuIGlucHV0IG1vZGFsaXR5IGlzIGRldGVjdGVkLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9tb2RhbGl0eSA9IG5ldyBCZWhhdmlvclN1YmplY3Q8SW5wdXRNb2RhbGl0eT4obnVsbCk7XG5cbiAgLyoqIE9wdGlvbnMgZm9yIHRoaXMgSW5wdXRNb2RhbGl0eURldGVjdG9yLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9vcHRpb25zOiBJbnB1dE1vZGFsaXR5RGV0ZWN0b3JPcHRpb25zO1xuXG4gIC8qKlxuICAgKiBUaGUgdGltZXN0YW1wIG9mIHRoZSBsYXN0IHRvdWNoIGlucHV0IG1vZGFsaXR5LiBVc2VkIHRvIGRldGVybWluZSB3aGV0aGVyIG1vdXNlZG93biBldmVudHNcbiAgICogc2hvdWxkIGJlIGF0dHJpYnV0ZWQgdG8gbW91c2Ugb3IgdG91Y2guXG4gICAqL1xuICBwcml2YXRlIF9sYXN0VG91Y2hNcyA9IDA7XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMga2V5ZG93biBldmVudHMuIE11c3QgYmUgYW4gYXJyb3cgZnVuY3Rpb24gaW4gb3JkZXIgdG8gcHJlc2VydmUgdGhlIGNvbnRleHQgd2hlbiBpdCBnZXRzXG4gICAqIGJvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfb25LZXlkb3duID0gKGV2ZW50OiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgLy8gSWYgdGhpcyBpcyBvbmUgb2YgdGhlIGtleXMgd2Ugc2hvdWxkIGlnbm9yZSwgdGhlbiBpZ25vcmUgaXQgYW5kIGRvbid0IHVwZGF0ZSB0aGUgaW5wdXRcbiAgICAvLyBtb2RhbGl0eSB0byBrZXlib2FyZC5cbiAgICBpZiAodGhpcy5fb3B0aW9ucz8uaWdub3JlS2V5cz8uc29tZShrZXlDb2RlID0+IGtleUNvZGUgPT09IGV2ZW50LmtleUNvZGUpKSB7IHJldHVybjsgfVxuXG4gICAgdGhpcy5fbW9kYWxpdHkubmV4dCgna2V5Ym9hcmQnKTtcbiAgICB0aGlzLl9tb3N0UmVjZW50VGFyZ2V0ID0gZ2V0VGFyZ2V0KGV2ZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIG1vdXNlZG93biBldmVudHMuIE11c3QgYmUgYW4gYXJyb3cgZnVuY3Rpb24gaW4gb3JkZXIgdG8gcHJlc2VydmUgdGhlIGNvbnRleHQgd2hlbiBpdFxuICAgKiBnZXRzIGJvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfb25Nb3VzZWRvd24gPSAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAvLyBUb3VjaGVzIHRyaWdnZXIgYm90aCB0b3VjaCBhbmQgbW91c2UgZXZlbnRzLCBzbyB3ZSBuZWVkIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW4gbW91c2UgZXZlbnRzXG4gICAgLy8gdGhhdCB3ZXJlIHRyaWdnZXJlZCB2aWEgbW91c2UgdnMgdG91Y2guIFRvIGRvIHNvLCBjaGVjayBpZiB0aGUgbW91c2UgZXZlbnQgb2NjdXJzIGNsb3NlbHlcbiAgICAvLyBhZnRlciB0aGUgcHJldmlvdXMgdG91Y2ggZXZlbnQuXG4gICAgaWYgKERhdGUubm93KCkgLSB0aGlzLl9sYXN0VG91Y2hNcyA8IFRPVUNIX0JVRkZFUl9NUykgeyByZXR1cm47IH1cblxuICAgIC8vIEZha2UgbW91c2Vkb3duIGV2ZW50cyBhcmUgZmlyZWQgYnkgc29tZSBzY3JlZW4gcmVhZGVycyB3aGVuIGNvbnRyb2xzIGFyZSBhY3RpdmF0ZWQgYnkgdGhlXG4gICAgLy8gc2NyZWVuIHJlYWRlci4gQXR0cmlidXRlIHRoZW0gdG8ga2V5Ym9hcmQgaW5wdXQgbW9kYWxpdHkuXG4gICAgdGhpcy5fbW9kYWxpdHkubmV4dChpc0Zha2VNb3VzZWRvd25Gcm9tU2NyZWVuUmVhZGVyKGV2ZW50KSA/ICdrZXlib2FyZCcgOiAnbW91c2UnKTtcbiAgICB0aGlzLl9tb3N0UmVjZW50VGFyZ2V0ID0gZ2V0VGFyZ2V0KGV2ZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIHRvdWNoc3RhcnQgZXZlbnRzLiBNdXN0IGJlIGFuIGFycm93IGZ1bmN0aW9uIGluIG9yZGVyIHRvIHByZXNlcnZlIHRoZSBjb250ZXh0IHdoZW4gaXRcbiAgICogZ2V0cyBib3VuZC5cbiAgICovXG4gIHByaXZhdGUgX29uVG91Y2hzdGFydCA9IChldmVudDogVG91Y2hFdmVudCkgPT4ge1xuICAgIC8vIFNhbWUgc2NlbmFyaW8gYXMgbWVudGlvbmVkIGluIF9vbk1vdXNlZG93biwgYnV0IG9uIHRvdWNoIHNjcmVlbiBkZXZpY2VzLCBmYWtlIHRvdWNoc3RhcnRcbiAgICAvLyBldmVudHMgYXJlIGZpcmVkLiBBZ2FpbiwgYXR0cmlidXRlIHRvIGtleWJvYXJkIGlucHV0IG1vZGFsaXR5LlxuICAgIGlmIChpc0Zha2VUb3VjaHN0YXJ0RnJvbVNjcmVlblJlYWRlcihldmVudCkpIHtcbiAgICAgIHRoaXMuX21vZGFsaXR5Lm5leHQoJ2tleWJvYXJkJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gU3RvcmUgdGhlIHRpbWVzdGFtcCBvZiB0aGlzIHRvdWNoIGV2ZW50LCBhcyBpdCdzIHVzZWQgdG8gZGlzdGluZ3Vpc2ggYmV0d2VlbiBtb3VzZSBldmVudHNcbiAgICAvLyB0cmlnZ2VyZWQgdmlhIG1vdXNlIHZzIHRvdWNoLlxuICAgIHRoaXMuX2xhc3RUb3VjaE1zID0gRGF0ZS5ub3coKTtcblxuICAgIHRoaXMuX21vZGFsaXR5Lm5leHQoJ3RvdWNoJyk7XG4gICAgdGhpcy5fbW9zdFJlY2VudFRhcmdldCA9IGdldFRhcmdldChldmVudCk7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgcmVhZG9ubHkgX3BsYXRmb3JtOiBQbGF0Zm9ybSxcbiAgICAgIG5nWm9uZTogTmdab25lLFxuICAgICAgQEluamVjdChET0NVTUVOVCkgZG9jdW1lbnQ6IERvY3VtZW50LFxuICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChJTlBVVF9NT0RBTElUWV9ERVRFQ1RPUl9PUFRJT05TKVxuICAgICAgb3B0aW9ucz86IElucHV0TW9kYWxpdHlEZXRlY3Rvck9wdGlvbnMsXG4gICkge1xuICAgIHRoaXMuX29wdGlvbnMgPSB7XG4gICAgICAuLi5JTlBVVF9NT0RBTElUWV9ERVRFQ1RPUl9ERUZBVUxUX09QVElPTlMsXG4gICAgICAuLi5vcHRpb25zLFxuICAgIH07XG5cbiAgICAvLyBTa2lwIHRoZSBmaXJzdCBlbWlzc2lvbiBhcyBpdCdzIG51bGwuXG4gICAgdGhpcy5tb2RhbGl0eURldGVjdGVkID0gdGhpcy5fbW9kYWxpdHkucGlwZShza2lwKDEpKTtcbiAgICB0aGlzLm1vZGFsaXR5Q2hhbmdlZCA9IHRoaXMubW9kYWxpdHlEZXRlY3RlZC5waXBlKGRpc3RpbmN0VW50aWxDaGFuZ2VkKCkpO1xuXG4gICAgLy8gSWYgd2UncmUgbm90IGluIGEgYnJvd3NlciwgdGhpcyBzZXJ2aWNlIHNob3VsZCBkbyBub3RoaW5nLCBhcyB0aGVyZSdzIG5vIHJlbGV2YW50IGlucHV0XG4gICAgLy8gbW9kYWxpdHkgdG8gZGV0ZWN0LlxuICAgIGlmICghX3BsYXRmb3JtLmlzQnJvd3NlcikgeyByZXR1cm47IH1cblxuICAgIC8vIEFkZCB0aGUgZXZlbnQgbGlzdGVuZXJzIHVzZWQgdG8gZGV0ZWN0IHRoZSB1c2VyJ3MgaW5wdXQgbW9kYWxpdHkuXG4gICAgbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9vbktleWRvd24sIG1vZGFsaXR5RXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fb25Nb3VzZWRvd24sIG1vZGFsaXR5RXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuX29uVG91Y2hzdGFydCwgbW9kYWxpdHlFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgfSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBpZiAoIXRoaXMuX3BsYXRmb3JtLmlzQnJvd3NlcikgeyByZXR1cm47IH1cblxuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9vbktleWRvd24sIG1vZGFsaXR5RXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX29uTW91c2Vkb3duLCBtb2RhbGl0eUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5fb25Ub3VjaHN0YXJ0LCBtb2RhbGl0eUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgfVxufVxuXG4vKiogR2V0cyB0aGUgdGFyZ2V0IG9mIGFuIGV2ZW50LCBhY2NvdW50aW5nIGZvciBTaGFkb3cgRE9NLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRhcmdldChldmVudDogRXZlbnQpOiBIVE1MRWxlbWVudHxudWxsIHtcbiAgLy8gSWYgYW4gZXZlbnQgaXMgYm91bmQgb3V0c2lkZSB0aGUgU2hhZG93IERPTSwgdGhlIGBldmVudC50YXJnZXRgIHdpbGxcbiAgLy8gcG9pbnQgdG8gdGhlIHNoYWRvdyByb290IHNvIHdlIGhhdmUgdG8gdXNlIGBjb21wb3NlZFBhdGhgIGluc3RlYWQuXG4gIHJldHVybiAoZXZlbnQuY29tcG9zZWRQYXRoID8gZXZlbnQuY29tcG9zZWRQYXRoKClbMF0gOiBldmVudC50YXJnZXQpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbn1cbiJdfQ==