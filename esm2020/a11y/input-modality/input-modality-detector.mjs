/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ALT, CONTROL, MAC_META, META, SHIFT } from '@angular/cdk/keycodes';
import { Inject, Injectable, InjectionToken, Optional, NgZone } from '@angular/core';
import { normalizePassiveListenerOptions, Platform, _getEventTarget } from '@angular/cdk/platform';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, skip } from 'rxjs/operators';
import { isFakeMousedownFromScreenReader, isFakeTouchstartFromScreenReader, } from '../fake-event-detection';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
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
            // If this is one of the keys we should ignore, then ignore it and don't update the input
            // modality to keyboard.
            if (this._options?.ignoreKeys?.some(keyCode => keyCode === event.keyCode)) {
                return;
            }
            this._modality.next('keyboard');
            this._mostRecentTarget = _getEventTarget(event);
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
            this._mostRecentTarget = _getEventTarget(event);
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
            this._mostRecentTarget = _getEventTarget(event);
        };
        this._options = {
            ...INPUT_MODALITY_DETECTOR_DEFAULT_OPTIONS,
            ...options,
        };
        // Skip the first emission as it's null.
        this.modalityDetected = this._modality.pipe(skip(1));
        this.modalityChanged = this.modalityDetected.pipe(distinctUntilChanged());
        // If we're not in a browser, this service should do nothing, as there's no relevant input
        // modality to detect.
        if (_platform.isBrowser) {
            ngZone.runOutsideAngular(() => {
                document.addEventListener('keydown', this._onKeydown, modalityEventListenerOptions);
                document.addEventListener('mousedown', this._onMousedown, modalityEventListenerOptions);
                document.addEventListener('touchstart', this._onTouchstart, modalityEventListenerOptions);
            });
        }
    }
    /** The most recently detected input modality. */
    get mostRecentModality() {
        return this._modality.value;
    }
    ngOnDestroy() {
        this._modality.complete();
        if (this._platform.isBrowser) {
            document.removeEventListener('keydown', this._onKeydown, modalityEventListenerOptions);
            document.removeEventListener('mousedown', this._onMousedown, modalityEventListenerOptions);
            document.removeEventListener('touchstart', this._onTouchstart, modalityEventListenerOptions);
        }
    }
}
InputModalityDetector.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: InputModalityDetector, deps: [{ token: i1.Platform }, { token: i0.NgZone }, { token: DOCUMENT }, { token: INPUT_MODALITY_DETECTOR_OPTIONS, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
InputModalityDetector.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: InputModalityDetector, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: InputModalityDetector, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: i1.Platform }, { type: i0.NgZone }, { type: Document, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [INPUT_MODALITY_DETECTOR_OPTIONS]
                }] }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXQtbW9kYWxpdHktZGV0ZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2ExMXkvaW5wdXQtbW9kYWxpdHkvaW5wdXQtbW9kYWxpdHktZGV0ZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRSxPQUFPLEVBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxjQUFjLEVBQWEsUUFBUSxFQUFFLE1BQU0sRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM5RixPQUFPLEVBQUMsK0JBQStCLEVBQUUsUUFBUSxFQUFFLGVBQWUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2pHLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQUMsZUFBZSxFQUFhLE1BQU0sTUFBTSxDQUFDO0FBQ2pELE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxJQUFJLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUMxRCxPQUFPLEVBQ0wsK0JBQStCLEVBQy9CLGdDQUFnQyxHQUNqQyxNQUFNLHlCQUF5QixDQUFDOzs7QUFhakM7OztHQUdHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sK0JBQStCLEdBQzFDLElBQUksY0FBYyxDQUErQixxQ0FBcUMsQ0FBQyxDQUFDO0FBRTFGOzs7Ozs7Ozs7Ozs7Ozs7R0FlRztBQUNILE1BQU0sQ0FBQyxNQUFNLHVDQUF1QyxHQUFpQztJQUNuRixVQUFVLEVBQUUsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDO0NBQ2xELENBQUM7QUFFRjs7Ozs7O0dBTUc7QUFDSCxNQUFNLENBQUMsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDO0FBRW5D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b2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QUxULCBDT05UUk9MLCBNQUNfTUVUQSwgTUVUQSwgU0hJRlR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9rZXljb2Rlcyc7XG5pbXBvcnQge0luamVjdCwgSW5qZWN0YWJsZSwgSW5qZWN0aW9uVG9rZW4sIE9uRGVzdHJveSwgT3B0aW9uYWwsIE5nWm9uZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge25vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMsIFBsYXRmb3JtLCBfZ2V0RXZlbnRUYXJnZXR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtCZWhhdmlvclN1YmplY3QsIE9ic2VydmFibGV9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtkaXN0aW5jdFVudGlsQ2hhbmdlZCwgc2tpcH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtcbiAgaXNGYWtlTW91c2Vkb3duRnJvbVNjcmVlblJlYWRlcixcbiAgaXNGYWtlVG91Y2hzdGFydEZyb21TY3JlZW5SZWFkZXIsXG59IGZyb20gJy4uL2Zha2UtZXZlbnQtZGV0ZWN0aW9uJztcblxuLyoqXG4gKiBUaGUgaW5wdXQgbW9kYWxpdGllcyBkZXRlY3RlZCBieSB0aGlzIHNlcnZpY2UuIE51bGwgaXMgdXNlZCBpZiB0aGUgaW5wdXQgbW9kYWxpdHkgaXMgdW5rbm93bi5cbiAqL1xuZXhwb3J0IHR5cGUgSW5wdXRNb2RhbGl0eSA9ICdrZXlib2FyZCcgfCAnbW91c2UnIHwgJ3RvdWNoJyB8IG51bGw7XG5cbi8qKiBPcHRpb25zIHRvIGNvbmZpZ3VyZSB0aGUgYmVoYXZpb3Igb2YgdGhlIElucHV0TW9kYWxpdHlEZXRlY3Rvci4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSW5wdXRNb2RhbGl0eURldGVjdG9yT3B0aW9ucyB7XG4gIC8qKiBLZXlzIHRvIGlnbm9yZSB3aGVuIGRldGVjdGluZyBrZXlib2FyZCBpbnB1dCBtb2RhbGl0eS4gKi9cbiAgaWdub3JlS2V5cz86IG51bWJlcltdO1xufVxuXG4vKipcbiAqIEluamVjdGFibGUgb3B0aW9ucyBmb3IgdGhlIElucHV0TW9kYWxpdHlEZXRlY3Rvci4gVGhlc2UgYXJlIHNoYWxsb3dseSBtZXJnZWQgd2l0aCB0aGUgZGVmYXVsdFxuICogb3B0aW9ucy5cbiAqL1xuZXhwb3J0IGNvbnN0IElOUFVUX01PREFMSVRZX0RFVEVDVE9SX09QVElPTlMgPVxuICBuZXcgSW5qZWN0aW9uVG9rZW48SW5wdXRNb2RhbGl0eURldGVjdG9yT3B0aW9ucz4oJ2Nkay1pbnB1dC1tb2RhbGl0eS1kZXRlY3Rvci1vcHRpb25zJyk7XG5cbi8qKlxuICogRGVmYXVsdCBvcHRpb25zIGZvciB0aGUgSW5wdXRNb2RhbGl0eURldGVjdG9yLlxuICpcbiAqIE1vZGlmaWVyIGtleXMgYXJlIGlnbm9yZWQgYnkgZGVmYXVsdCAoaS5lLiB3aGVuIHByZXNzZWQgd29uJ3QgY2F1c2UgdGhlIHNlcnZpY2UgdG8gZGV0ZWN0XG4gKiBrZXlib2FyZCBpbnB1dCBtb2RhbGl0eSkgZm9yIHR3byByZWFzb25zOlxuICpcbiAqIDEuIE1vZGlmaWVyIGtleXMgYXJlIGNvbW1vbmx5IHVzZWQgd2l0aCBtb3VzZSB0byBwZXJmb3JtIGFjdGlvbnMgc3VjaCBhcyAncmlnaHQgY2xpY2snIG9yICdvcGVuXG4gKiAgICBpbiBuZXcgdGFiJywgYW5kIGFyZSB0aHVzIGxlc3MgcmVwcmVzZW50YXRpdmUgb2YgYWN0dWFsIGtleWJvYXJkIGludGVyYWN0aW9uLlxuICogMi4gVm9pY2VPdmVyIHRyaWdnZXJzIHNvbWUga2V5Ym9hcmQgZXZlbnRzIHdoZW4gbGluZWFybHkgbmF2aWdhdGluZyB3aXRoIENvbnRyb2wgKyBPcHRpb24gKGJ1dFxuICogICAgY29uZnVzaW5nbHkgbm90IHdpdGggQ2FwcyBMb2NrKS4gVGh1cywgdG8gaGF2ZSBwYXJpdHkgd2l0aCBvdGhlciBzY3JlZW4gcmVhZGVycywgd2UgaWdub3JlXG4gKiAgICB0aGVzZSBrZXlzIHNvIGFzIHRvIG5vdCB1cGRhdGUgdGhlIGlucHV0IG1vZGFsaXR5LlxuICpcbiAqIE5vdGUgdGhhdCB3ZSBkbyBub3QgYnkgZGVmYXVsdCBpZ25vcmUgdGhlIHJpZ2h0IE1ldGEga2V5IG9uIFNhZmFyaSBiZWNhdXNlIGl0IGhhcyB0aGUgc2FtZSBrZXlcbiAqIGNvZGUgYXMgdGhlIENvbnRleHRNZW51IGtleSBvbiBvdGhlciBicm93c2Vycy4gV2hlbiB3ZSBzd2l0Y2ggdG8gdXNpbmcgZXZlbnQua2V5LCB3ZSBjYW5cbiAqIGRpc3Rpbmd1aXNoIGJldHdlZW4gdGhlIHR3by5cbiAqL1xuZXhwb3J0IGNvbnN0IElOUFVUX01PREFMSVRZX0RFVEVDVE9SX0RFRkFVTFRfT1BUSU9OUzogSW5wdXRNb2RhbGl0eURldGVjdG9yT3B0aW9ucyA9IHtcbiAgaWdub3JlS2V5czogW0FMVCwgQ09OVFJPTCwgTUFDX01FVEEsIE1FVEEsIFNISUZUXSxcbn07XG5cbi8qKlxuICogVGhlIGFtb3VudCBvZiB0aW1lIG5lZWRlZCB0byBwYXNzIGFmdGVyIGEgdG91Y2hzdGFydCBldmVudCBpbiBvcmRlciBmb3IgYSBzdWJzZXF1ZW50IG1vdXNlZG93blxuICogZXZlbnQgdG8gYmUgYXR0cmlidXRlZCBhcyBtb3VzZSBhbmQgbm90IHRvdWNoLlxuICpcbiAqIFRoaXMgaXMgdGhlIHZhbHVlIHVzZWQgYnkgQW5ndWxhckpTIE1hdGVyaWFsLiBUaHJvdWdoIHRyaWFsIGFuZCBlcnJvciAob24gaVBob25lIDZTKSB0aGV5IGZvdW5kXG4gKiB0aGF0IGEgdmFsdWUgb2YgYXJvdW5kIDY1MG1zIHNlZW1zIGFwcHJvcHJpYXRlLlxuICovXG5leHBvcnQgY29uc3QgVE9VQ0hfQlVGRkVSX01TID0gNjUwO1xuXG4vKipcbiAqIEV2ZW50IGxpc3RlbmVyIG9wdGlvbnMgdGhhdCBlbmFibGUgY2FwdHVyaW5nIGFuZCBhbHNvIG1hcmsgdGhlIGxpc3RlbmVyIGFzIHBhc3NpdmUgaWYgdGhlIGJyb3dzZXJcbiAqIHN1cHBvcnRzIGl0LlxuICovXG5jb25zdCBtb2RhbGl0eUV2ZW50TGlzdGVuZXJPcHRpb25zID0gbm9ybWFsaXplUGFzc2l2ZUxpc3RlbmVyT3B0aW9ucyh7XG4gIHBhc3NpdmU6IHRydWUsXG4gIGNhcHR1cmU6IHRydWUsXG59KTtcblxuLyoqXG4gKiBTZXJ2aWNlIHRoYXQgZGV0ZWN0cyB0aGUgdXNlcidzIGlucHV0IG1vZGFsaXR5LlxuICpcbiAqIFRoaXMgc2VydmljZSBkb2VzIG5vdCB1cGRhdGUgdGhlIGlucHV0IG1vZGFsaXR5IHdoZW4gYSB1c2VyIG5hdmlnYXRlcyB3aXRoIGEgc2NyZWVuIHJlYWRlclxuICogKGUuZy4gbGluZWFyIG5hdmlnYXRpb24gd2l0aCBWb2ljZU92ZXIsIG9iamVjdCBuYXZpZ2F0aW9uIC8gYnJvd3NlIG1vZGUgd2l0aCBOVkRBLCB2aXJ0dWFsIFBDXG4gKiBjdXJzb3IgbW9kZSB3aXRoIEpBV1MpLiBUaGlzIGlzIGluIHBhcnQgZHVlIHRvIHRlY2huaWNhbCBsaW1pdGF0aW9ucyAoaS5lLiBrZXlib2FyZCBldmVudHMgZG8gbm90XG4gKiBmaXJlIGFzIGV4cGVjdGVkIGluIHRoZXNlIG1vZGVzKSBidXQgaXMgYWxzbyBhcmd1YWJseSB0aGUgY29ycmVjdCBiZWhhdmlvci4gTmF2aWdhdGluZyB3aXRoIGFcbiAqIHNjcmVlbiByZWFkZXIgaXMgYWtpbiB0byB2aXN1YWxseSBzY2FubmluZyBhIHBhZ2UsIGFuZCBzaG91bGQgbm90IGJlIGludGVycHJldGVkIGFzIGFjdHVhbCB1c2VyXG4gKiBpbnB1dCBpbnRlcmFjdGlvbi5cbiAqXG4gKiBXaGVuIGEgdXNlciBpcyBub3QgbmF2aWdhdGluZyBidXQgKmludGVyYWN0aW5nKiB3aXRoIGEgc2NyZWVuIHJlYWRlciwgdGhpcyBzZXJ2aWNlIGF0dGVtcHRzIHRvXG4gKiB1cGRhdGUgdGhlIGlucHV0IG1vZGFsaXR5IHRvIGtleWJvYXJkLCBidXQgaW4gZ2VuZXJhbCB0aGlzIHNlcnZpY2UncyBiZWhhdmlvciBpcyBsYXJnZWx5XG4gKiB1bmRlZmluZWQuXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIElucHV0TW9kYWxpdHlEZXRlY3RvciBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qKiBFbWl0cyB3aGVuZXZlciBhbiBpbnB1dCBtb2RhbGl0eSBpcyBkZXRlY3RlZC4gKi9cbiAgcmVhZG9ubHkgbW9kYWxpdHlEZXRlY3RlZDogT2JzZXJ2YWJsZTxJbnB1dE1vZGFsaXR5PjtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgaW5wdXQgbW9kYWxpdHkgY2hhbmdlcy4gKi9cbiAgcmVhZG9ubHkgbW9kYWxpdHlDaGFuZ2VkOiBPYnNlcnZhYmxlPElucHV0TW9kYWxpdHk+O1xuXG4gIC8qKiBUaGUgbW9zdCByZWNlbnRseSBkZXRlY3RlZCBpbnB1dCBtb2RhbGl0eS4gKi9cbiAgZ2V0IG1vc3RSZWNlbnRNb2RhbGl0eSgpOiBJbnB1dE1vZGFsaXR5IHtcbiAgICByZXR1cm4gdGhpcy5fbW9kYWxpdHkudmFsdWU7XG4gIH1cblxuICAvKipcbiAgICogVGhlIG1vc3QgcmVjZW50bHkgZGV0ZWN0ZWQgaW5wdXQgbW9kYWxpdHkgZXZlbnQgdGFyZ2V0LiBJcyBudWxsIGlmIG5vIGlucHV0IG1vZGFsaXR5IGhhcyBiZWVuXG4gICAqIGRldGVjdGVkIG9yIGlmIHRoZSBhc3NvY2lhdGVkIGV2ZW50IHRhcmdldCBpcyBudWxsIGZvciBzb21lIHVua25vd24gcmVhc29uLlxuICAgKi9cbiAgX21vc3RSZWNlbnRUYXJnZXQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIFRoZSB1bmRlcmx5aW5nIEJlaGF2aW9yU3ViamVjdCB0aGF0IGVtaXRzIHdoZW5ldmVyIGFuIGlucHV0IG1vZGFsaXR5IGlzIGRldGVjdGVkLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9tb2RhbGl0eSA9IG5ldyBCZWhhdmlvclN1YmplY3Q8SW5wdXRNb2RhbGl0eT4obnVsbCk7XG5cbiAgLyoqIE9wdGlvbnMgZm9yIHRoaXMgSW5wdXRNb2RhbGl0eURldGVjdG9yLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9vcHRpb25zOiBJbnB1dE1vZGFsaXR5RGV0ZWN0b3JPcHRpb25zO1xuXG4gIC8qKlxuICAgKiBUaGUgdGltZXN0YW1wIG9mIHRoZSBsYXN0IHRvdWNoIGlucHV0IG1vZGFsaXR5LiBVc2VkIHRvIGRldGVybWluZSB3aGV0aGVyIG1vdXNlZG93biBldmVudHNcbiAgICogc2hvdWxkIGJlIGF0dHJpYnV0ZWQgdG8gbW91c2Ugb3IgdG91Y2guXG4gICAqL1xuICBwcml2YXRlIF9sYXN0VG91Y2hNcyA9IDA7XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMga2V5ZG93biBldmVudHMuIE11c3QgYmUgYW4gYXJyb3cgZnVuY3Rpb24gaW4gb3JkZXIgdG8gcHJlc2VydmUgdGhlIGNvbnRleHQgd2hlbiBpdCBnZXRzXG4gICAqIGJvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfb25LZXlkb3duID0gKGV2ZW50OiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgLy8gSWYgdGhpcyBpcyBvbmUgb2YgdGhlIGtleXMgd2Ugc2hvdWxkIGlnbm9yZSwgdGhlbiBpZ25vcmUgaXQgYW5kIGRvbid0IHVwZGF0ZSB0aGUgaW5wdXRcbiAgICAvLyBtb2RhbGl0eSB0byBrZXlib2FyZC5cbiAgICBpZiAodGhpcy5fb3B0aW9ucz8uaWdub3JlS2V5cz8uc29tZShrZXlDb2RlID0+IGtleUNvZGUgPT09IGV2ZW50LmtleUNvZGUpKSB7IHJldHVybjsgfVxuXG4gICAgdGhpcy5fbW9kYWxpdHkubmV4dCgna2V5Ym9hcmQnKTtcbiAgICB0aGlzLl9tb3N0UmVjZW50VGFyZ2V0ID0gX2dldEV2ZW50VGFyZ2V0KGV2ZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIG1vdXNlZG93biBldmVudHMuIE11c3QgYmUgYW4gYXJyb3cgZnVuY3Rpb24gaW4gb3JkZXIgdG8gcHJlc2VydmUgdGhlIGNvbnRleHQgd2hlbiBpdFxuICAgKiBnZXRzIGJvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfb25Nb3VzZWRvd24gPSAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAvLyBUb3VjaGVzIHRyaWdnZXIgYm90aCB0b3VjaCBhbmQgbW91c2UgZXZlbnRzLCBzbyB3ZSBuZWVkIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW4gbW91c2UgZXZlbnRzXG4gICAgLy8gdGhhdCB3ZXJlIHRyaWdnZXJlZCB2aWEgbW91c2UgdnMgdG91Y2guIFRvIGRvIHNvLCBjaGVjayBpZiB0aGUgbW91c2UgZXZlbnQgb2NjdXJzIGNsb3NlbHlcbiAgICAvLyBhZnRlciB0aGUgcHJldmlvdXMgdG91Y2ggZXZlbnQuXG4gICAgaWYgKERhdGUubm93KCkgLSB0aGlzLl9sYXN0VG91Y2hNcyA8IFRPVUNIX0JVRkZFUl9NUykgeyByZXR1cm47IH1cblxuICAgIC8vIEZha2UgbW91c2Vkb3duIGV2ZW50cyBhcmUgZmlyZWQgYnkgc29tZSBzY3JlZW4gcmVhZGVycyB3aGVuIGNvbnRyb2xzIGFyZSBhY3RpdmF0ZWQgYnkgdGhlXG4gICAgLy8gc2NyZWVuIHJlYWRlci4gQXR0cmlidXRlIHRoZW0gdG8ga2V5Ym9hcmQgaW5wdXQgbW9kYWxpdHkuXG4gICAgdGhpcy5fbW9kYWxpdHkubmV4dChpc0Zha2VNb3VzZWRvd25Gcm9tU2NyZWVuUmVhZGVyKGV2ZW50KSA/ICdrZXlib2FyZCcgOiAnbW91c2UnKTtcbiAgICB0aGlzLl9tb3N0UmVjZW50VGFyZ2V0ID0gX2dldEV2ZW50VGFyZ2V0KGV2ZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIHRvdWNoc3RhcnQgZXZlbnRzLiBNdXN0IGJlIGFuIGFycm93IGZ1bmN0aW9uIGluIG9yZGVyIHRvIHByZXNlcnZlIHRoZSBjb250ZXh0IHdoZW4gaXRcbiAgICogZ2V0cyBib3VuZC5cbiAgICovXG4gIHByaXZhdGUgX29uVG91Y2hzdGFydCA9IChldmVudDogVG91Y2hFdmVudCkgPT4ge1xuICAgIC8vIFNhbWUgc2NlbmFyaW8gYXMgbWVudGlvbmVkIGluIF9vbk1vdXNlZG93biwgYnV0IG9uIHRvdWNoIHNjcmVlbiBkZXZpY2VzLCBmYWtlIHRvdWNoc3RhcnRcbiAgICAvLyBldmVudHMgYXJlIGZpcmVkLiBBZ2FpbiwgYXR0cmlidXRlIHRvIGtleWJvYXJkIGlucHV0IG1vZGFsaXR5LlxuICAgIGlmIChpc0Zha2VUb3VjaHN0YXJ0RnJvbVNjcmVlblJlYWRlcihldmVudCkpIHtcbiAgICAgIHRoaXMuX21vZGFsaXR5Lm5leHQoJ2tleWJvYXJkJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gU3RvcmUgdGhlIHRpbWVzdGFtcCBvZiB0aGlzIHRvdWNoIGV2ZW50LCBhcyBpdCdzIHVzZWQgdG8gZGlzdGluZ3Vpc2ggYmV0d2VlbiBtb3VzZSBldmVudHNcbiAgICAvLyB0cmlnZ2VyZWQgdmlhIG1vdXNlIHZzIHRvdWNoLlxuICAgIHRoaXMuX2xhc3RUb3VjaE1zID0gRGF0ZS5ub3coKTtcblxuICAgIHRoaXMuX21vZGFsaXR5Lm5leHQoJ3RvdWNoJyk7XG4gICAgdGhpcy5fbW9zdFJlY2VudFRhcmdldCA9IF9nZXRFdmVudFRhcmdldChldmVudCk7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgcmVhZG9ubHkgX3BsYXRmb3JtOiBQbGF0Zm9ybSxcbiAgICAgIG5nWm9uZTogTmdab25lLFxuICAgICAgQEluamVjdChET0NVTUVOVCkgZG9jdW1lbnQ6IERvY3VtZW50LFxuICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChJTlBVVF9NT0RBTElUWV9ERVRFQ1RPUl9PUFRJT05TKVxuICAgICAgb3B0aW9ucz86IElucHV0TW9kYWxpdHlEZXRlY3Rvck9wdGlvbnMsXG4gICkge1xuICAgIHRoaXMuX29wdGlvbnMgPSB7XG4gICAgICAuLi5JTlBVVF9NT0RBTElUWV9ERVRFQ1RPUl9ERUZBVUxUX09QVElPTlMsXG4gICAgICAuLi5vcHRpb25zLFxuICAgIH07XG5cbiAgICAvLyBTa2lwIHRoZSBmaXJzdCBlbWlzc2lvbiBhcyBpdCdzIG51bGwuXG4gICAgdGhpcy5tb2RhbGl0eURldGVjdGVkID0gdGhpcy5fbW9kYWxpdHkucGlwZShza2lwKDEpKTtcbiAgICB0aGlzLm1vZGFsaXR5Q2hhbmdlZCA9IHRoaXMubW9kYWxpdHlEZXRlY3RlZC5waXBlKGRpc3RpbmN0VW50aWxDaGFuZ2VkKCkpO1xuXG4gICAgLy8gSWYgd2UncmUgbm90IGluIGEgYnJvd3NlciwgdGhpcyBzZXJ2aWNlIHNob3VsZCBkbyBub3RoaW5nLCBhcyB0aGVyZSdzIG5vIHJlbGV2YW50IGlucHV0XG4gICAgLy8gbW9kYWxpdHkgdG8gZGV0ZWN0LlxuICAgIGlmIChfcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICBuZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fb25LZXlkb3duLCBtb2RhbGl0eUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fb25Nb3VzZWRvd24sIG1vZGFsaXR5RXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5fb25Ub3VjaHN0YXJ0LCBtb2RhbGl0eUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX21vZGFsaXR5LmNvbXBsZXRlKCk7XG5cbiAgICBpZiAodGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fb25LZXlkb3duLCBtb2RhbGl0eUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX29uTW91c2Vkb3duLCBtb2RhbGl0eUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9vblRvdWNoc3RhcnQsIG1vZGFsaXR5RXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgIH1cbiAgfVxufVxuIl19