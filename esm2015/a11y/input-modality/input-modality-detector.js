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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXQtbW9kYWxpdHktZGV0ZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2ExMXkvaW5wdXQtbW9kYWxpdHkvaW5wdXQtbW9kYWxpdHktZGV0ZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRSxPQUFPLEVBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxjQUFjLEVBQWEsUUFBUSxFQUFFLE1BQU0sRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM5RixPQUFPLEVBQUMsK0JBQStCLEVBQUUsUUFBUSxFQUFFLGVBQWUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2pHLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQUMsZUFBZSxFQUFhLE1BQU0sTUFBTSxDQUFDO0FBQ2pELE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxJQUFJLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUMxRCxPQUFPLEVBQ0wsK0JBQStCLEVBQy9CLGdDQUFnQyxHQUNqQyxNQUFNLHlCQUF5QixDQUFDOzs7O0FBYWpDOzs7R0FHRztBQUNILE1BQU0sQ0FBQyxNQUFNLCtCQUErQixHQUMxQyxJQUFJLGNBQWMsQ0FBK0IscUNBQXFDLENBQUMsQ0FBQztBQUUxRjs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7QUFDSCxNQUFNLENBQUMsTUFBTSx1Q0FBdUMsR0FBaUM7SUFDbkYsVUFBVSxFQUFFLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQztDQUNsRCxDQUFDO0FBRUY7Ozs7OztHQU1HO0FBQ0gsTUFBTSxDQUFDLE1BQU0sZUFBZSxHQUFHLEdBQUcsQ0FBQztBQUVuQzs7O0dBR0c7QUFDSCxNQUFNLDRCQUE0QixHQUFHLCtCQUErQixDQUFDO0lBQ25FLE9BQU8sRUFBRSxJQUFJO0lBQ2IsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDLENBQUM7QUFFSDs7Ozs7Ozs7Ozs7OztHQWFHO0FBRUgsTUFBTSxPQUFPLHFCQUFxQjtJQStFaEMsWUFDcUIsU0FBbUIsRUFDcEMsTUFBYyxFQUNJLFFBQWtCLEVBRXBDLE9BQXNDO1FBSnJCLGNBQVMsR0FBVCxTQUFTLENBQVU7UUFwRXhDOzs7V0FHRztRQUNILHNCQUFpQixHQUF1QixJQUFJLENBQUM7UUFFN0Msd0ZBQXdGO1FBQ3ZFLGNBQVMsR0FBRyxJQUFJLGVBQWUsQ0FBZ0IsSUFBSSxDQUFDLENBQUM7UUFLdEU7OztXQUdHO1FBQ0ssaUJBQVksR0FBRyxDQUFDLENBQUM7UUFFekI7OztXQUdHO1FBQ0ssZUFBVSxHQUFHLENBQUMsS0FBb0IsRUFBRSxFQUFFOztZQUM1Qyx5RkFBeUY7WUFDekYsd0JBQXdCO1lBQ3hCLElBQUksTUFBQSxNQUFBLElBQUksQ0FBQyxRQUFRLDBDQUFFLFVBQVUsMENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxLQUFLLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRTtnQkFBRSxPQUFPO2FBQUU7WUFFdEYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDaEMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNsRCxDQUFDLENBQUE7UUFFRDs7O1dBR0c7UUFDSyxpQkFBWSxHQUFHLENBQUMsS0FBaUIsRUFBRSxFQUFFO1lBQzNDLDhGQUE4RjtZQUM5Riw0RkFBNEY7WUFDNUYsa0NBQWtDO1lBQ2xDLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxZQUFZLEdBQUcsZUFBZSxFQUFFO2dCQUFFLE9BQU87YUFBRTtZQUVqRSw0RkFBNEY7WUFDNUYsNERBQTREO1lBQzVELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLCtCQUErQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ25GLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbEQsQ0FBQyxDQUFBO1FBRUQ7OztXQUdHO1FBQ0ssa0JBQWEsR0FBRyxDQUFDLEtBQWlCLEVBQUUsRUFBRTtZQUM1QywyRkFBMkY7WUFDM0YsaUVBQWlFO1lBQ2pFLElBQUksZ0NBQWdDLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzNDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNoQyxPQUFPO2FBQ1I7WUFFRCw0RkFBNEY7WUFDNUYsZ0NBQWdDO1lBQ2hDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBRS9CLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzdCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbEQsQ0FBQyxDQUFBO1FBU0MsSUFBSSxDQUFDLFFBQVEsbUNBQ1IsdUNBQXVDLEdBQ3ZDLE9BQU8sQ0FDWCxDQUFDO1FBRUYsd0NBQXdDO1FBQ3hDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyRCxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDO1FBRTFFLDBGQUEwRjtRQUMxRixzQkFBc0I7UUFDdEIsSUFBSSxTQUFTLENBQUMsU0FBUyxFQUFFO1lBQ3ZCLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUU7Z0JBQzVCLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO2dCQUNwRixRQUFRLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztnQkFDeEYsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLDRCQUE0QixDQUFDLENBQUM7WUFDNUYsQ0FBQyxDQUFDLENBQUM7U0FDSjtJQUNILENBQUM7SUFqR0QsaURBQWlEO0lBQ2pELElBQUksa0JBQWtCO1FBQ3BCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUM7SUFDOUIsQ0FBQztJQWdHRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUUxQixJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFO1lBQzVCLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO1lBQ3ZGLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO1lBQzNGLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO1NBQzlGO0lBQ0gsQ0FBQzs7OztZQW5IRixVQUFVLFNBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzs7WUEvRVMsUUFBUTtZQURnQixNQUFNO1lBbUtyQyxRQUFRLHVCQUFuQyxNQUFNLFNBQUMsUUFBUTs0Q0FDZixRQUFRLFlBQUksTUFBTSxTQUFDLCtCQUErQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FMVCwgQ09OVFJPTCwgTUFDX01FVEEsIE1FVEEsIFNISUZUfSBmcm9tICdAYW5ndWxhci9jZGsva2V5Y29kZXMnO1xuaW1wb3J0IHtJbmplY3QsIEluamVjdGFibGUsIEluamVjdGlvblRva2VuLCBPbkRlc3Ryb3ksIE9wdGlvbmFsLCBOZ1pvbmV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtub3JtYWxpemVQYXNzaXZlTGlzdGVuZXJPcHRpb25zLCBQbGF0Zm9ybSwgX2dldEV2ZW50VGFyZ2V0fSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7QmVoYXZpb3JTdWJqZWN0LCBPYnNlcnZhYmxlfSBmcm9tICdyeGpzJztcbmltcG9ydCB7ZGlzdGluY3RVbnRpbENoYW5nZWQsIHNraXB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7XG4gIGlzRmFrZU1vdXNlZG93bkZyb21TY3JlZW5SZWFkZXIsXG4gIGlzRmFrZVRvdWNoc3RhcnRGcm9tU2NyZWVuUmVhZGVyLFxufSBmcm9tICcuLi9mYWtlLWV2ZW50LWRldGVjdGlvbic7XG5cbi8qKlxuICogVGhlIGlucHV0IG1vZGFsaXRpZXMgZGV0ZWN0ZWQgYnkgdGhpcyBzZXJ2aWNlLiBOdWxsIGlzIHVzZWQgaWYgdGhlIGlucHV0IG1vZGFsaXR5IGlzIHVua25vd24uXG4gKi9cbmV4cG9ydCB0eXBlIElucHV0TW9kYWxpdHkgPSAna2V5Ym9hcmQnIHwgJ21vdXNlJyB8ICd0b3VjaCcgfCBudWxsO1xuXG4vKiogT3B0aW9ucyB0byBjb25maWd1cmUgdGhlIGJlaGF2aW9yIG9mIHRoZSBJbnB1dE1vZGFsaXR5RGV0ZWN0b3IuICovXG5leHBvcnQgaW50ZXJmYWNlIElucHV0TW9kYWxpdHlEZXRlY3Rvck9wdGlvbnMge1xuICAvKiogS2V5cyB0byBpZ25vcmUgd2hlbiBkZXRlY3Rpbmcga2V5Ym9hcmQgaW5wdXQgbW9kYWxpdHkuICovXG4gIGlnbm9yZUtleXM/OiBudW1iZXJbXTtcbn1cblxuLyoqXG4gKiBJbmplY3RhYmxlIG9wdGlvbnMgZm9yIHRoZSBJbnB1dE1vZGFsaXR5RGV0ZWN0b3IuIFRoZXNlIGFyZSBzaGFsbG93bHkgbWVyZ2VkIHdpdGggdGhlIGRlZmF1bHRcbiAqIG9wdGlvbnMuXG4gKi9cbmV4cG9ydCBjb25zdCBJTlBVVF9NT0RBTElUWV9ERVRFQ1RPUl9PUFRJT05TID1cbiAgbmV3IEluamVjdGlvblRva2VuPElucHV0TW9kYWxpdHlEZXRlY3Rvck9wdGlvbnM+KCdjZGstaW5wdXQtbW9kYWxpdHktZGV0ZWN0b3Itb3B0aW9ucycpO1xuXG4vKipcbiAqIERlZmF1bHQgb3B0aW9ucyBmb3IgdGhlIElucHV0TW9kYWxpdHlEZXRlY3Rvci5cbiAqXG4gKiBNb2RpZmllciBrZXlzIGFyZSBpZ25vcmVkIGJ5IGRlZmF1bHQgKGkuZS4gd2hlbiBwcmVzc2VkIHdvbid0IGNhdXNlIHRoZSBzZXJ2aWNlIHRvIGRldGVjdFxuICoga2V5Ym9hcmQgaW5wdXQgbW9kYWxpdHkpIGZvciB0d28gcmVhc29uczpcbiAqXG4gKiAxLiBNb2RpZmllciBrZXlzIGFyZSBjb21tb25seSB1c2VkIHdpdGggbW91c2UgdG8gcGVyZm9ybSBhY3Rpb25zIHN1Y2ggYXMgJ3JpZ2h0IGNsaWNrJyBvciAnb3BlblxuICogICAgaW4gbmV3IHRhYicsIGFuZCBhcmUgdGh1cyBsZXNzIHJlcHJlc2VudGF0aXZlIG9mIGFjdHVhbCBrZXlib2FyZCBpbnRlcmFjdGlvbi5cbiAqIDIuIFZvaWNlT3ZlciB0cmlnZ2VycyBzb21lIGtleWJvYXJkIGV2ZW50cyB3aGVuIGxpbmVhcmx5IG5hdmlnYXRpbmcgd2l0aCBDb250cm9sICsgT3B0aW9uIChidXRcbiAqICAgIGNvbmZ1c2luZ2x5IG5vdCB3aXRoIENhcHMgTG9jaykuIFRodXMsIHRvIGhhdmUgcGFyaXR5IHdpdGggb3RoZXIgc2NyZWVuIHJlYWRlcnMsIHdlIGlnbm9yZVxuICogICAgdGhlc2Uga2V5cyBzbyBhcyB0byBub3QgdXBkYXRlIHRoZSBpbnB1dCBtb2RhbGl0eS5cbiAqXG4gKiBOb3RlIHRoYXQgd2UgZG8gbm90IGJ5IGRlZmF1bHQgaWdub3JlIHRoZSByaWdodCBNZXRhIGtleSBvbiBTYWZhcmkgYmVjYXVzZSBpdCBoYXMgdGhlIHNhbWUga2V5XG4gKiBjb2RlIGFzIHRoZSBDb250ZXh0TWVudSBrZXkgb24gb3RoZXIgYnJvd3NlcnMuIFdoZW4gd2Ugc3dpdGNoIHRvIHVzaW5nIGV2ZW50LmtleSwgd2UgY2FuXG4gKiBkaXN0aW5ndWlzaCBiZXR3ZWVuIHRoZSB0d28uXG4gKi9cbmV4cG9ydCBjb25zdCBJTlBVVF9NT0RBTElUWV9ERVRFQ1RPUl9ERUZBVUxUX09QVElPTlM6IElucHV0TW9kYWxpdHlEZXRlY3Rvck9wdGlvbnMgPSB7XG4gIGlnbm9yZUtleXM6IFtBTFQsIENPTlRST0wsIE1BQ19NRVRBLCBNRVRBLCBTSElGVF0sXG59O1xuXG4vKipcbiAqIFRoZSBhbW91bnQgb2YgdGltZSBuZWVkZWQgdG8gcGFzcyBhZnRlciBhIHRvdWNoc3RhcnQgZXZlbnQgaW4gb3JkZXIgZm9yIGEgc3Vic2VxdWVudCBtb3VzZWRvd25cbiAqIGV2ZW50IHRvIGJlIGF0dHJpYnV0ZWQgYXMgbW91c2UgYW5kIG5vdCB0b3VjaC5cbiAqXG4gKiBUaGlzIGlzIHRoZSB2YWx1ZSB1c2VkIGJ5IEFuZ3VsYXJKUyBNYXRlcmlhbC4gVGhyb3VnaCB0cmlhbCBhbmQgZXJyb3IgKG9uIGlQaG9uZSA2UykgdGhleSBmb3VuZFxuICogdGhhdCBhIHZhbHVlIG9mIGFyb3VuZCA2NTBtcyBzZWVtcyBhcHByb3ByaWF0ZS5cbiAqL1xuZXhwb3J0IGNvbnN0IFRPVUNIX0JVRkZFUl9NUyA9IDY1MDtcblxuLyoqXG4gKiBFdmVudCBsaXN0ZW5lciBvcHRpb25zIHRoYXQgZW5hYmxlIGNhcHR1cmluZyBhbmQgYWxzbyBtYXJrIHRoZSBsaXN0ZW5lciBhcyBwYXNzaXZlIGlmIHRoZSBicm93c2VyXG4gKiBzdXBwb3J0cyBpdC5cbiAqL1xuY29uc3QgbW9kYWxpdHlFdmVudExpc3RlbmVyT3B0aW9ucyA9IG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMoe1xuICBwYXNzaXZlOiB0cnVlLFxuICBjYXB0dXJlOiB0cnVlLFxufSk7XG5cbi8qKlxuICogU2VydmljZSB0aGF0IGRldGVjdHMgdGhlIHVzZXIncyBpbnB1dCBtb2RhbGl0eS5cbiAqXG4gKiBUaGlzIHNlcnZpY2UgZG9lcyBub3QgdXBkYXRlIHRoZSBpbnB1dCBtb2RhbGl0eSB3aGVuIGEgdXNlciBuYXZpZ2F0ZXMgd2l0aCBhIHNjcmVlbiByZWFkZXJcbiAqIChlLmcuIGxpbmVhciBuYXZpZ2F0aW9uIHdpdGggVm9pY2VPdmVyLCBvYmplY3QgbmF2aWdhdGlvbiAvIGJyb3dzZSBtb2RlIHdpdGggTlZEQSwgdmlydHVhbCBQQ1xuICogY3Vyc29yIG1vZGUgd2l0aCBKQVdTKS4gVGhpcyBpcyBpbiBwYXJ0IGR1ZSB0byB0ZWNobmljYWwgbGltaXRhdGlvbnMgKGkuZS4ga2V5Ym9hcmQgZXZlbnRzIGRvIG5vdFxuICogZmlyZSBhcyBleHBlY3RlZCBpbiB0aGVzZSBtb2RlcykgYnV0IGlzIGFsc28gYXJndWFibHkgdGhlIGNvcnJlY3QgYmVoYXZpb3IuIE5hdmlnYXRpbmcgd2l0aCBhXG4gKiBzY3JlZW4gcmVhZGVyIGlzIGFraW4gdG8gdmlzdWFsbHkgc2Nhbm5pbmcgYSBwYWdlLCBhbmQgc2hvdWxkIG5vdCBiZSBpbnRlcnByZXRlZCBhcyBhY3R1YWwgdXNlclxuICogaW5wdXQgaW50ZXJhY3Rpb24uXG4gKlxuICogV2hlbiBhIHVzZXIgaXMgbm90IG5hdmlnYXRpbmcgYnV0ICppbnRlcmFjdGluZyogd2l0aCBhIHNjcmVlbiByZWFkZXIsIHRoaXMgc2VydmljZSBhdHRlbXB0cyB0b1xuICogdXBkYXRlIHRoZSBpbnB1dCBtb2RhbGl0eSB0byBrZXlib2FyZCwgYnV0IGluIGdlbmVyYWwgdGhpcyBzZXJ2aWNlJ3MgYmVoYXZpb3IgaXMgbGFyZ2VseVxuICogdW5kZWZpbmVkLlxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBJbnB1dE1vZGFsaXR5RGV0ZWN0b3IgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogRW1pdHMgd2hlbmV2ZXIgYW4gaW5wdXQgbW9kYWxpdHkgaXMgZGV0ZWN0ZWQuICovXG4gIHJlYWRvbmx5IG1vZGFsaXR5RGV0ZWN0ZWQ6IE9ic2VydmFibGU8SW5wdXRNb2RhbGl0eT47XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIGlucHV0IG1vZGFsaXR5IGNoYW5nZXMuICovXG4gIHJlYWRvbmx5IG1vZGFsaXR5Q2hhbmdlZDogT2JzZXJ2YWJsZTxJbnB1dE1vZGFsaXR5PjtcblxuICAvKiogVGhlIG1vc3QgcmVjZW50bHkgZGV0ZWN0ZWQgaW5wdXQgbW9kYWxpdHkuICovXG4gIGdldCBtb3N0UmVjZW50TW9kYWxpdHkoKTogSW5wdXRNb2RhbGl0eSB7XG4gICAgcmV0dXJuIHRoaXMuX21vZGFsaXR5LnZhbHVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBtb3N0IHJlY2VudGx5IGRldGVjdGVkIGlucHV0IG1vZGFsaXR5IGV2ZW50IHRhcmdldC4gSXMgbnVsbCBpZiBubyBpbnB1dCBtb2RhbGl0eSBoYXMgYmVlblxuICAgKiBkZXRlY3RlZCBvciBpZiB0aGUgYXNzb2NpYXRlZCBldmVudCB0YXJnZXQgaXMgbnVsbCBmb3Igc29tZSB1bmtub3duIHJlYXNvbi5cbiAgICovXG4gIF9tb3N0UmVjZW50VGFyZ2V0OiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuXG4gIC8qKiBUaGUgdW5kZXJseWluZyBCZWhhdmlvclN1YmplY3QgdGhhdCBlbWl0cyB3aGVuZXZlciBhbiBpbnB1dCBtb2RhbGl0eSBpcyBkZXRlY3RlZC4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfbW9kYWxpdHkgPSBuZXcgQmVoYXZpb3JTdWJqZWN0PElucHV0TW9kYWxpdHk+KG51bGwpO1xuXG4gIC8qKiBPcHRpb25zIGZvciB0aGlzIElucHV0TW9kYWxpdHlEZXRlY3Rvci4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfb3B0aW9uczogSW5wdXRNb2RhbGl0eURldGVjdG9yT3B0aW9ucztcblxuICAvKipcbiAgICogVGhlIHRpbWVzdGFtcCBvZiB0aGUgbGFzdCB0b3VjaCBpbnB1dCBtb2RhbGl0eS4gVXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBtb3VzZWRvd24gZXZlbnRzXG4gICAqIHNob3VsZCBiZSBhdHRyaWJ1dGVkIHRvIG1vdXNlIG9yIHRvdWNoLlxuICAgKi9cbiAgcHJpdmF0ZSBfbGFzdFRvdWNoTXMgPSAwO1xuXG4gIC8qKlxuICAgKiBIYW5kbGVzIGtleWRvd24gZXZlbnRzLiBNdXN0IGJlIGFuIGFycm93IGZ1bmN0aW9uIGluIG9yZGVyIHRvIHByZXNlcnZlIHRoZSBjb250ZXh0IHdoZW4gaXQgZ2V0c1xuICAgKiBib3VuZC5cbiAgICovXG4gIHByaXZhdGUgX29uS2V5ZG93biA9IChldmVudDogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICAgIC8vIElmIHRoaXMgaXMgb25lIG9mIHRoZSBrZXlzIHdlIHNob3VsZCBpZ25vcmUsIHRoZW4gaWdub3JlIGl0IGFuZCBkb24ndCB1cGRhdGUgdGhlIGlucHV0XG4gICAgLy8gbW9kYWxpdHkgdG8ga2V5Ym9hcmQuXG4gICAgaWYgKHRoaXMuX29wdGlvbnM/Lmlnbm9yZUtleXM/LnNvbWUoa2V5Q29kZSA9PiBrZXlDb2RlID09PSBldmVudC5rZXlDb2RlKSkgeyByZXR1cm47IH1cblxuICAgIHRoaXMuX21vZGFsaXR5Lm5leHQoJ2tleWJvYXJkJyk7XG4gICAgdGhpcy5fbW9zdFJlY2VudFRhcmdldCA9IF9nZXRFdmVudFRhcmdldChldmVudCk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBtb3VzZWRvd24gZXZlbnRzLiBNdXN0IGJlIGFuIGFycm93IGZ1bmN0aW9uIGluIG9yZGVyIHRvIHByZXNlcnZlIHRoZSBjb250ZXh0IHdoZW4gaXRcbiAgICogZ2V0cyBib3VuZC5cbiAgICovXG4gIHByaXZhdGUgX29uTW91c2Vkb3duID0gKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgLy8gVG91Y2hlcyB0cmlnZ2VyIGJvdGggdG91Y2ggYW5kIG1vdXNlIGV2ZW50cywgc28gd2UgbmVlZCB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuIG1vdXNlIGV2ZW50c1xuICAgIC8vIHRoYXQgd2VyZSB0cmlnZ2VyZWQgdmlhIG1vdXNlIHZzIHRvdWNoLiBUbyBkbyBzbywgY2hlY2sgaWYgdGhlIG1vdXNlIGV2ZW50IG9jY3VycyBjbG9zZWx5XG4gICAgLy8gYWZ0ZXIgdGhlIHByZXZpb3VzIHRvdWNoIGV2ZW50LlxuICAgIGlmIChEYXRlLm5vdygpIC0gdGhpcy5fbGFzdFRvdWNoTXMgPCBUT1VDSF9CVUZGRVJfTVMpIHsgcmV0dXJuOyB9XG5cbiAgICAvLyBGYWtlIG1vdXNlZG93biBldmVudHMgYXJlIGZpcmVkIGJ5IHNvbWUgc2NyZWVuIHJlYWRlcnMgd2hlbiBjb250cm9scyBhcmUgYWN0aXZhdGVkIGJ5IHRoZVxuICAgIC8vIHNjcmVlbiByZWFkZXIuIEF0dHJpYnV0ZSB0aGVtIHRvIGtleWJvYXJkIGlucHV0IG1vZGFsaXR5LlxuICAgIHRoaXMuX21vZGFsaXR5Lm5leHQoaXNGYWtlTW91c2Vkb3duRnJvbVNjcmVlblJlYWRlcihldmVudCkgPyAna2V5Ym9hcmQnIDogJ21vdXNlJyk7XG4gICAgdGhpcy5fbW9zdFJlY2VudFRhcmdldCA9IF9nZXRFdmVudFRhcmdldChldmVudCk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyB0b3VjaHN0YXJ0IGV2ZW50cy4gTXVzdCBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0XG4gICAqIGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF9vblRvdWNoc3RhcnQgPSAoZXZlbnQ6IFRvdWNoRXZlbnQpID0+IHtcbiAgICAvLyBTYW1lIHNjZW5hcmlvIGFzIG1lbnRpb25lZCBpbiBfb25Nb3VzZWRvd24sIGJ1dCBvbiB0b3VjaCBzY3JlZW4gZGV2aWNlcywgZmFrZSB0b3VjaHN0YXJ0XG4gICAgLy8gZXZlbnRzIGFyZSBmaXJlZC4gQWdhaW4sIGF0dHJpYnV0ZSB0byBrZXlib2FyZCBpbnB1dCBtb2RhbGl0eS5cbiAgICBpZiAoaXNGYWtlVG91Y2hzdGFydEZyb21TY3JlZW5SZWFkZXIoZXZlbnQpKSB7XG4gICAgICB0aGlzLl9tb2RhbGl0eS5uZXh0KCdrZXlib2FyZCcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFN0b3JlIHRoZSB0aW1lc3RhbXAgb2YgdGhpcyB0b3VjaCBldmVudCwgYXMgaXQncyB1c2VkIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW4gbW91c2UgZXZlbnRzXG4gICAgLy8gdHJpZ2dlcmVkIHZpYSBtb3VzZSB2cyB0b3VjaC5cbiAgICB0aGlzLl9sYXN0VG91Y2hNcyA9IERhdGUubm93KCk7XG5cbiAgICB0aGlzLl9tb2RhbGl0eS5uZXh0KCd0b3VjaCcpO1xuICAgIHRoaXMuX21vc3RSZWNlbnRUYXJnZXQgPSBfZ2V0RXZlbnRUYXJnZXQoZXZlbnQpO1xuICB9XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIHJlYWRvbmx5IF9wbGF0Zm9ybTogUGxhdGZvcm0sXG4gICAgICBuZ1pvbmU6IE5nWm9uZSxcbiAgICAgIEBJbmplY3QoRE9DVU1FTlQpIGRvY3VtZW50OiBEb2N1bWVudCxcbiAgICAgIEBPcHRpb25hbCgpIEBJbmplY3QoSU5QVVRfTU9EQUxJVFlfREVURUNUT1JfT1BUSU9OUylcbiAgICAgIG9wdGlvbnM/OiBJbnB1dE1vZGFsaXR5RGV0ZWN0b3JPcHRpb25zLFxuICApIHtcbiAgICB0aGlzLl9vcHRpb25zID0ge1xuICAgICAgLi4uSU5QVVRfTU9EQUxJVFlfREVURUNUT1JfREVGQVVMVF9PUFRJT05TLFxuICAgICAgLi4ub3B0aW9ucyxcbiAgICB9O1xuXG4gICAgLy8gU2tpcCB0aGUgZmlyc3QgZW1pc3Npb24gYXMgaXQncyBudWxsLlxuICAgIHRoaXMubW9kYWxpdHlEZXRlY3RlZCA9IHRoaXMuX21vZGFsaXR5LnBpcGUoc2tpcCgxKSk7XG4gICAgdGhpcy5tb2RhbGl0eUNoYW5nZWQgPSB0aGlzLm1vZGFsaXR5RGV0ZWN0ZWQucGlwZShkaXN0aW5jdFVudGlsQ2hhbmdlZCgpKTtcblxuICAgIC8vIElmIHdlJ3JlIG5vdCBpbiBhIGJyb3dzZXIsIHRoaXMgc2VydmljZSBzaG91bGQgZG8gbm90aGluZywgYXMgdGhlcmUncyBubyByZWxldmFudCBpbnB1dFxuICAgIC8vIG1vZGFsaXR5IHRvIGRldGVjdC5cbiAgICBpZiAoX3BsYXRmb3JtLmlzQnJvd3Nlcikge1xuICAgICAgbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX29uS2V5ZG93biwgbW9kYWxpdHlFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX29uTW91c2Vkb3duLCBtb2RhbGl0eUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuX29uVG91Y2hzdGFydCwgbW9kYWxpdHlFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9tb2RhbGl0eS5jb21wbGV0ZSgpO1xuXG4gICAgaWYgKHRoaXMuX3BsYXRmb3JtLmlzQnJvd3Nlcikge1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX29uS2V5ZG93biwgbW9kYWxpdHlFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9vbk1vdXNlZG93biwgbW9kYWxpdHlFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5fb25Ub3VjaHN0YXJ0LCBtb2RhbGl0eUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==