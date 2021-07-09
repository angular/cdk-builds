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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXQtbW9kYWxpdHktZGV0ZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2ExMXkvaW5wdXQtbW9kYWxpdHkvaW5wdXQtbW9kYWxpdHktZGV0ZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRSxPQUFPLEVBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxjQUFjLEVBQWEsUUFBUSxFQUFFLE1BQU0sRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM5RixPQUFPLEVBQUMsK0JBQStCLEVBQUUsUUFBUSxFQUFFLGVBQWUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2pHLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQUMsZUFBZSxFQUFhLE1BQU0sTUFBTSxDQUFDO0FBQ2pELE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxJQUFJLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUMxRCxPQUFPLEVBQ0wsK0JBQStCLEVBQy9CLGdDQUFnQyxHQUNqQyxNQUFNLHlCQUF5QixDQUFDOzs7O0FBYWpDOzs7R0FHRztBQUNILE1BQU0sQ0FBQyxNQUFNLCtCQUErQixHQUMxQyxJQUFJLGNBQWMsQ0FBK0IscUNBQXFDLENBQUMsQ0FBQztBQUUxRjs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7QUFDSCxNQUFNLENBQUMsTUFBTSx1Q0FBdUMsR0FBaUM7SUFDbkYsVUFBVSxFQUFFLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQztDQUNsRCxDQUFDO0FBRUY7Ozs7OztHQU1HO0FBQ0gsTUFBTSxDQUFDLE1BQU0sZUFBZSxHQUFHLEdBQUcsQ0FBQztBQUVu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LEVBQUU7WUFDNUIsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLDRCQUE0QixDQUFDLENBQUM7WUFDcEYsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFLDRCQUE0QixDQUFDLENBQUM7WUFDeEYsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLDRCQUE0QixDQUFDLENBQUM7UUFDNUYsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBbEdELGlEQUFpRDtJQUNqRCxJQUFJLGtCQUFrQjtRQUNwQixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDO0lBQzlCLENBQUM7SUFpR0QsV0FBVztRQUNULElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRTtZQUFFLE9BQU87U0FBRTtRQUUxQyxRQUFRLENBQUMsbUJBQW1CLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztRQUN2RixRQUFRLENBQUMsbUJBQW1CLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztRQUMzRixRQUFRLENBQUMsbUJBQW1CLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxhQUFhLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztJQUMvRixDQUFDOzs7O1lBbEhGLFVBQVUsU0FBQyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUU7OztZQS9FTyxRQUFRO1lBRGdCLE1BQU07WUFtS3JDLFFBQVEsdUJBQW5DLE1BQU0sU0FBQyxRQUFROzRDQUNmLFFBQVEsWUFBSSxNQUFNLFNBQUMsK0JBQStCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QUxULCBDT05UUk9MLCBNQUNfTUVUQSwgTUVUQSwgU0hJRlR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9rZXljb2Rlcyc7XG5pbXBvcnQge0luamVjdCwgSW5qZWN0YWJsZSwgSW5qZWN0aW9uVG9rZW4sIE9uRGVzdHJveSwgT3B0aW9uYWwsIE5nWm9uZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge25vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMsIFBsYXRmb3JtLCBfZ2V0RXZlbnRUYXJnZXR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtCZWhhdmlvclN1YmplY3QsIE9ic2VydmFibGV9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtkaXN0aW5jdFVudGlsQ2hhbmdlZCwgc2tpcH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtcbiAgaXNGYWtlTW91c2Vkb3duRnJvbVNjcmVlblJlYWRlcixcbiAgaXNGYWtlVG91Y2hzdGFydEZyb21TY3JlZW5SZWFkZXIsXG59IGZyb20gJy4uL2Zha2UtZXZlbnQtZGV0ZWN0aW9uJztcblxuLyoqXG4gKiBUaGUgaW5wdXQgbW9kYWxpdGllcyBkZXRlY3RlZCBieSB0aGlzIHNlcnZpY2UuIE51bGwgaXMgdXNlZCBpZiB0aGUgaW5wdXQgbW9kYWxpdHkgaXMgdW5rbm93bi5cbiAqL1xuZXhwb3J0IHR5cGUgSW5wdXRNb2RhbGl0eSA9ICdrZXlib2FyZCcgfCAnbW91c2UnIHwgJ3RvdWNoJyB8IG51bGw7XG5cbi8qKiBPcHRpb25zIHRvIGNvbmZpZ3VyZSB0aGUgYmVoYXZpb3Igb2YgdGhlIElucHV0TW9kYWxpdHlEZXRlY3Rvci4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSW5wdXRNb2RhbGl0eURldGVjdG9yT3B0aW9ucyB7XG4gIC8qKiBLZXlzIHRvIGlnbm9yZSB3aGVuIGRldGVjdGluZyBrZXlib2FyZCBpbnB1dCBtb2RhbGl0eS4gKi9cbiAgaWdub3JlS2V5cz86IG51bWJlcltdO1xufVxuXG4vKipcbiAqIEluamVjdGFibGUgb3B0aW9ucyBmb3IgdGhlIElucHV0TW9kYWxpdHlEZXRlY3Rvci4gVGhlc2UgYXJlIHNoYWxsb3dseSBtZXJnZWQgd2l0aCB0aGUgZGVmYXVsdFxuICogb3B0aW9ucy5cbiAqL1xuZXhwb3J0IGNvbnN0IElOUFVUX01PREFMSVRZX0RFVEVDVE9SX09QVElPTlMgPVxuICBuZXcgSW5qZWN0aW9uVG9rZW48SW5wdXRNb2RhbGl0eURldGVjdG9yT3B0aW9ucz4oJ2Nkay1pbnB1dC1tb2RhbGl0eS1kZXRlY3Rvci1vcHRpb25zJyk7XG5cbi8qKlxuICogRGVmYXVsdCBvcHRpb25zIGZvciB0aGUgSW5wdXRNb2RhbGl0eURldGVjdG9yLlxuICpcbiAqIE1vZGlmaWVyIGtleXMgYXJlIGlnbm9yZWQgYnkgZGVmYXVsdCAoaS5lLiB3aGVuIHByZXNzZWQgd29uJ3QgY2F1c2UgdGhlIHNlcnZpY2UgdG8gZGV0ZWN0XG4gKiBrZXlib2FyZCBpbnB1dCBtb2RhbGl0eSkgZm9yIHR3byByZWFzb25zOlxuICpcbiAqIDEuIE1vZGlmaWVyIGtleXMgYXJlIGNvbW1vbmx5IHVzZWQgd2l0aCBtb3VzZSB0byBwZXJmb3JtIGFjdGlvbnMgc3VjaCBhcyAncmlnaHQgY2xpY2snIG9yICdvcGVuXG4gKiAgICBpbiBuZXcgdGFiJywgYW5kIGFyZSB0aHVzIGxlc3MgcmVwcmVzZW50YXRpdmUgb2YgYWN0dWFsIGtleWJvYXJkIGludGVyYWN0aW9uLlxuICogMi4gVm9pY2VPdmVyIHRyaWdnZXJzIHNvbWUga2V5Ym9hcmQgZXZlbnRzIHdoZW4gbGluZWFybHkgbmF2aWdhdGluZyB3aXRoIENvbnRyb2wgKyBPcHRpb24gKGJ1dFxuICogICAgY29uZnVzaW5nbHkgbm90IHdpdGggQ2FwcyBMb2NrKS4gVGh1cywgdG8gaGF2ZSBwYXJpdHkgd2l0aCBvdGhlciBzY3JlZW4gcmVhZGVycywgd2UgaWdub3JlXG4gKiAgICB0aGVzZSBrZXlzIHNvIGFzIHRvIG5vdCB1cGRhdGUgdGhlIGlucHV0IG1vZGFsaXR5LlxuICpcbiAqIE5vdGUgdGhhdCB3ZSBkbyBub3QgYnkgZGVmYXVsdCBpZ25vcmUgdGhlIHJpZ2h0IE1ldGEga2V5IG9uIFNhZmFyaSBiZWNhdXNlIGl0IGhhcyB0aGUgc2FtZSBrZXlcbiAqIGNvZGUgYXMgdGhlIENvbnRleHRNZW51IGtleSBvbiBvdGhlciBicm93c2Vycy4gV2hlbiB3ZSBzd2l0Y2ggdG8gdXNpbmcgZXZlbnQua2V5LCB3ZSBjYW5cbiAqIGRpc3Rpbmd1aXNoIGJldHdlZW4gdGhlIHR3by5cbiAqL1xuZXhwb3J0IGNvbnN0IElOUFVUX01PREFMSVRZX0RFVEVDVE9SX0RFRkFVTFRfT1BUSU9OUzogSW5wdXRNb2RhbGl0eURldGVjdG9yT3B0aW9ucyA9IHtcbiAgaWdub3JlS2V5czogW0FMVCwgQ09OVFJPTCwgTUFDX01FVEEsIE1FVEEsIFNISUZUXSxcbn07XG5cbi8qKlxuICogVGhlIGFtb3VudCBvZiB0aW1lIG5lZWRlZCB0byBwYXNzIGFmdGVyIGEgdG91Y2hzdGFydCBldmVudCBpbiBvcmRlciBmb3IgYSBzdWJzZXF1ZW50IG1vdXNlZG93blxuICogZXZlbnQgdG8gYmUgYXR0cmlidXRlZCBhcyBtb3VzZSBhbmQgbm90IHRvdWNoLlxuICpcbiAqIFRoaXMgaXMgdGhlIHZhbHVlIHVzZWQgYnkgQW5ndWxhckpTIE1hdGVyaWFsLiBUaHJvdWdoIHRyaWFsIGFuZCBlcnJvciAob24gaVBob25lIDZTKSB0aGV5IGZvdW5kXG4gKiB0aGF0IGEgdmFsdWUgb2YgYXJvdW5kIDY1MG1zIHNlZW1zIGFwcHJvcHJpYXRlLlxuICovXG5leHBvcnQgY29uc3QgVE9VQ0hfQlVGRkVSX01TID0gNjUwO1xuXG4vKipcbiAqIEV2ZW50IGxpc3RlbmVyIG9wdGlvbnMgdGhhdCBlbmFibGUgY2FwdHVyaW5nIGFuZCBhbHNvIG1hcmsgdGhlIGxpc3RlbmVyIGFzIHBhc3NpdmUgaWYgdGhlIGJyb3dzZXJcbiAqIHN1cHBvcnRzIGl0LlxuICovXG5jb25zdCBtb2RhbGl0eUV2ZW50TGlzdGVuZXJPcHRpb25zID0gbm9ybWFsaXplUGFzc2l2ZUxpc3RlbmVyT3B0aW9ucyh7XG4gIHBhc3NpdmU6IHRydWUsXG4gIGNhcHR1cmU6IHRydWUsXG59KTtcblxuLyoqXG4gKiBTZXJ2aWNlIHRoYXQgZGV0ZWN0cyB0aGUgdXNlcidzIGlucHV0IG1vZGFsaXR5LlxuICpcbiAqIFRoaXMgc2VydmljZSBkb2VzIG5vdCB1cGRhdGUgdGhlIGlucHV0IG1vZGFsaXR5IHdoZW4gYSB1c2VyIG5hdmlnYXRlcyB3aXRoIGEgc2NyZWVuIHJlYWRlclxuICogKGUuZy4gbGluZWFyIG5hdmlnYXRpb24gd2l0aCBWb2ljZU92ZXIsIG9iamVjdCBuYXZpZ2F0aW9uIC8gYnJvd3NlIG1vZGUgd2l0aCBOVkRBLCB2aXJ0dWFsIFBDXG4gKiBjdXJzb3IgbW9kZSB3aXRoIEpBV1MpLiBUaGlzIGlzIGluIHBhcnQgZHVlIHRvIHRlY2huaWNhbCBsaW1pdGF0aW9ucyAoaS5lLiBrZXlib2FyZCBldmVudHMgZG8gbm90XG4gKiBmaXJlIGFzIGV4cGVjdGVkIGluIHRoZXNlIG1vZGVzKSBidXQgaXMgYWxzbyBhcmd1YWJseSB0aGUgY29ycmVjdCBiZWhhdmlvci4gTmF2aWdhdGluZyB3aXRoIGFcbiAqIHNjcmVlbiByZWFkZXIgaXMgYWtpbiB0byB2aXN1YWxseSBzY2FubmluZyBhIHBhZ2UsIGFuZCBzaG91bGQgbm90IGJlIGludGVycHJldGVkIGFzIGFjdHVhbCB1c2VyXG4gKiBpbnB1dCBpbnRlcmFjdGlvbi5cbiAqXG4gKiBXaGVuIGEgdXNlciBpcyBub3QgbmF2aWdhdGluZyBidXQgKmludGVyYWN0aW5nKiB3aXRoIGEgc2NyZWVuIHJlYWRlciwgdGhpcyBzZXJ2aWNlIGF0dGVtcHRzIHRvXG4gKiB1cGRhdGUgdGhlIGlucHV0IG1vZGFsaXR5IHRvIGtleWJvYXJkLCBidXQgaW4gZ2VuZXJhbCB0aGlzIHNlcnZpY2UncyBiZWhhdmlvciBpcyBsYXJnZWx5XG4gKiB1bmRlZmluZWQuXG4gKi9cbkBJbmplY3RhYmxlKHsgcHJvdmlkZWRJbjogJ3Jvb3QnIH0pXG5leHBvcnQgY2xhc3MgSW5wdXRNb2RhbGl0eURldGVjdG9yIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIEVtaXRzIHdoZW5ldmVyIGFuIGlucHV0IG1vZGFsaXR5IGlzIGRldGVjdGVkLiAqL1xuICByZWFkb25seSBtb2RhbGl0eURldGVjdGVkOiBPYnNlcnZhYmxlPElucHV0TW9kYWxpdHk+O1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBpbnB1dCBtb2RhbGl0eSBjaGFuZ2VzLiAqL1xuICByZWFkb25seSBtb2RhbGl0eUNoYW5nZWQ6IE9ic2VydmFibGU8SW5wdXRNb2RhbGl0eT47XG5cbiAgLyoqIFRoZSBtb3N0IHJlY2VudGx5IGRldGVjdGVkIGlucHV0IG1vZGFsaXR5LiAqL1xuICBnZXQgbW9zdFJlY2VudE1vZGFsaXR5KCk6IElucHV0TW9kYWxpdHkge1xuICAgIHJldHVybiB0aGlzLl9tb2RhbGl0eS52YWx1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgbW9zdCByZWNlbnRseSBkZXRlY3RlZCBpbnB1dCBtb2RhbGl0eSBldmVudCB0YXJnZXQuIElzIG51bGwgaWYgbm8gaW5wdXQgbW9kYWxpdHkgaGFzIGJlZW5cbiAgICogZGV0ZWN0ZWQgb3IgaWYgdGhlIGFzc29jaWF0ZWQgZXZlbnQgdGFyZ2V0IGlzIG51bGwgZm9yIHNvbWUgdW5rbm93biByZWFzb24uXG4gICAqL1xuICBfbW9zdFJlY2VudFRhcmdldDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcblxuICAvKiogVGhlIHVuZGVybHlpbmcgQmVoYXZpb3JTdWJqZWN0IHRoYXQgZW1pdHMgd2hlbmV2ZXIgYW4gaW5wdXQgbW9kYWxpdHkgaXMgZGV0ZWN0ZWQuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX21vZGFsaXR5ID0gbmV3IEJlaGF2aW9yU3ViamVjdDxJbnB1dE1vZGFsaXR5PihudWxsKTtcblxuICAvKiogT3B0aW9ucyBmb3IgdGhpcyBJbnB1dE1vZGFsaXR5RGV0ZWN0b3IuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX29wdGlvbnM6IElucHV0TW9kYWxpdHlEZXRlY3Rvck9wdGlvbnM7XG5cbiAgLyoqXG4gICAqIFRoZSB0aW1lc3RhbXAgb2YgdGhlIGxhc3QgdG91Y2ggaW5wdXQgbW9kYWxpdHkuIFVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgbW91c2Vkb3duIGV2ZW50c1xuICAgKiBzaG91bGQgYmUgYXR0cmlidXRlZCB0byBtb3VzZSBvciB0b3VjaC5cbiAgICovXG4gIHByaXZhdGUgX2xhc3RUb3VjaE1zID0gMDtcblxuICAvKipcbiAgICogSGFuZGxlcyBrZXlkb3duIGV2ZW50cy4gTXVzdCBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0IGdldHNcbiAgICogYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF9vbktleWRvd24gPSAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHtcbiAgICAvLyBJZiB0aGlzIGlzIG9uZSBvZiB0aGUga2V5cyB3ZSBzaG91bGQgaWdub3JlLCB0aGVuIGlnbm9yZSBpdCBhbmQgZG9uJ3QgdXBkYXRlIHRoZSBpbnB1dFxuICAgIC8vIG1vZGFsaXR5IHRvIGtleWJvYXJkLlxuICAgIGlmICh0aGlzLl9vcHRpb25zPy5pZ25vcmVLZXlzPy5zb21lKGtleUNvZGUgPT4ga2V5Q29kZSA9PT0gZXZlbnQua2V5Q29kZSkpIHsgcmV0dXJuOyB9XG5cbiAgICB0aGlzLl9tb2RhbGl0eS5uZXh0KCdrZXlib2FyZCcpO1xuICAgIHRoaXMuX21vc3RSZWNlbnRUYXJnZXQgPSBfZ2V0RXZlbnRUYXJnZXQoZXZlbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgbW91c2Vkb3duIGV2ZW50cy4gTXVzdCBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0XG4gICAqIGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF9vbk1vdXNlZG93biA9IChldmVudDogTW91c2VFdmVudCkgPT4ge1xuICAgIC8vIFRvdWNoZXMgdHJpZ2dlciBib3RoIHRvdWNoIGFuZCBtb3VzZSBldmVudHMsIHNvIHdlIG5lZWQgdG8gZGlzdGluZ3Vpc2ggYmV0d2VlbiBtb3VzZSBldmVudHNcbiAgICAvLyB0aGF0IHdlcmUgdHJpZ2dlcmVkIHZpYSBtb3VzZSB2cyB0b3VjaC4gVG8gZG8gc28sIGNoZWNrIGlmIHRoZSBtb3VzZSBldmVudCBvY2N1cnMgY2xvc2VseVxuICAgIC8vIGFmdGVyIHRoZSBwcmV2aW91cyB0b3VjaCBldmVudC5cbiAgICBpZiAoRGF0ZS5ub3coKSAtIHRoaXMuX2xhc3RUb3VjaE1zIDwgVE9VQ0hfQlVGRkVSX01TKSB7IHJldHVybjsgfVxuXG4gICAgLy8gRmFrZSBtb3VzZWRvd24gZXZlbnRzIGFyZSBmaXJlZCBieSBzb21lIHNjcmVlbiByZWFkZXJzIHdoZW4gY29udHJvbHMgYXJlIGFjdGl2YXRlZCBieSB0aGVcbiAgICAvLyBzY3JlZW4gcmVhZGVyLiBBdHRyaWJ1dGUgdGhlbSB0byBrZXlib2FyZCBpbnB1dCBtb2RhbGl0eS5cbiAgICB0aGlzLl9tb2RhbGl0eS5uZXh0KGlzRmFrZU1vdXNlZG93bkZyb21TY3JlZW5SZWFkZXIoZXZlbnQpID8gJ2tleWJvYXJkJyA6ICdtb3VzZScpO1xuICAgIHRoaXMuX21vc3RSZWNlbnRUYXJnZXQgPSBfZ2V0RXZlbnRUYXJnZXQoZXZlbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgdG91Y2hzdGFydCBldmVudHMuIE11c3QgYmUgYW4gYXJyb3cgZnVuY3Rpb24gaW4gb3JkZXIgdG8gcHJlc2VydmUgdGhlIGNvbnRleHQgd2hlbiBpdFxuICAgKiBnZXRzIGJvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfb25Ub3VjaHN0YXJ0ID0gKGV2ZW50OiBUb3VjaEV2ZW50KSA9PiB7XG4gICAgLy8gU2FtZSBzY2VuYXJpbyBhcyBtZW50aW9uZWQgaW4gX29uTW91c2Vkb3duLCBidXQgb24gdG91Y2ggc2NyZWVuIGRldmljZXMsIGZha2UgdG91Y2hzdGFydFxuICAgIC8vIGV2ZW50cyBhcmUgZmlyZWQuIEFnYWluLCBhdHRyaWJ1dGUgdG8ga2V5Ym9hcmQgaW5wdXQgbW9kYWxpdHkuXG4gICAgaWYgKGlzRmFrZVRvdWNoc3RhcnRGcm9tU2NyZWVuUmVhZGVyKGV2ZW50KSkge1xuICAgICAgdGhpcy5fbW9kYWxpdHkubmV4dCgna2V5Ym9hcmQnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBTdG9yZSB0aGUgdGltZXN0YW1wIG9mIHRoaXMgdG91Y2ggZXZlbnQsIGFzIGl0J3MgdXNlZCB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuIG1vdXNlIGV2ZW50c1xuICAgIC8vIHRyaWdnZXJlZCB2aWEgbW91c2UgdnMgdG91Y2guXG4gICAgdGhpcy5fbGFzdFRvdWNoTXMgPSBEYXRlLm5vdygpO1xuXG4gICAgdGhpcy5fbW9kYWxpdHkubmV4dCgndG91Y2gnKTtcbiAgICB0aGlzLl9tb3N0UmVjZW50VGFyZ2V0ID0gX2dldEV2ZW50VGFyZ2V0KGV2ZW50KTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSByZWFkb25seSBfcGxhdGZvcm06IFBsYXRmb3JtLFxuICAgICAgbmdab25lOiBOZ1pvbmUsXG4gICAgICBASW5qZWN0KERPQ1VNRU5UKSBkb2N1bWVudDogRG9jdW1lbnQsXG4gICAgICBAT3B0aW9uYWwoKSBASW5qZWN0KElOUFVUX01PREFMSVRZX0RFVEVDVE9SX09QVElPTlMpXG4gICAgICBvcHRpb25zPzogSW5wdXRNb2RhbGl0eURldGVjdG9yT3B0aW9ucyxcbiAgKSB7XG4gICAgdGhpcy5fb3B0aW9ucyA9IHtcbiAgICAgIC4uLklOUFVUX01PREFMSVRZX0RFVEVDVE9SX0RFRkFVTFRfT1BUSU9OUyxcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgfTtcblxuICAgIC8vIFNraXAgdGhlIGZpcnN0IGVtaXNzaW9uIGFzIGl0J3MgbnVsbC5cbiAgICB0aGlzLm1vZGFsaXR5RGV0ZWN0ZWQgPSB0aGlzLl9tb2RhbGl0eS5waXBlKHNraXAoMSkpO1xuICAgIHRoaXMubW9kYWxpdHlDaGFuZ2VkID0gdGhpcy5tb2RhbGl0eURldGVjdGVkLnBpcGUoZGlzdGluY3RVbnRpbENoYW5nZWQoKSk7XG5cbiAgICAvLyBJZiB3ZSdyZSBub3QgaW4gYSBicm93c2VyLCB0aGlzIHNlcnZpY2Ugc2hvdWxkIGRvIG5vdGhpbmcsIGFzIHRoZXJlJ3Mgbm8gcmVsZXZhbnQgaW5wdXRcbiAgICAvLyBtb2RhbGl0eSB0byBkZXRlY3QuXG4gICAgaWYgKCFfcGxhdGZvcm0uaXNCcm93c2VyKSB7IHJldHVybjsgfVxuXG4gICAgLy8gQWRkIHRoZSBldmVudCBsaXN0ZW5lcnMgdXNlZCB0byBkZXRlY3QgdGhlIHVzZXIncyBpbnB1dCBtb2RhbGl0eS5cbiAgICBuZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX29uS2V5ZG93biwgbW9kYWxpdHlFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9vbk1vdXNlZG93biwgbW9kYWxpdHlFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5fb25Ub3VjaHN0YXJ0LCBtb2RhbGl0eUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICB9KTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIGlmICghdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7IHJldHVybjsgfVxuXG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX29uS2V5ZG93biwgbW9kYWxpdHlFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fb25Nb3VzZWRvd24sIG1vZGFsaXR5RXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9vblRvdWNoc3RhcnQsIG1vZGFsaXR5RXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICB9XG59XG4iXX0=