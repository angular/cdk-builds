/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, NgZone, Optional } from '@angular/core';
import { Platform, _getEventTarget } from '@angular/cdk/platform';
import { BaseOverlayDispatcher } from './base-overlay-dispatcher';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
/**
 * Service for dispatching mouse click events that land on the body to appropriate overlay ref,
 * if any. It maintains a list of attached overlays to determine best suited overlay based
 * on event target and order of overlay opens.
 */
export class OverlayOutsideClickDispatcher extends BaseOverlayDispatcher {
    constructor(document, _platform, 
    /** @breaking-change 14.0.0 _ngZone will be required. */
    _ngZone) {
        super(document);
        this._platform = _platform;
        this._ngZone = _ngZone;
        this._cursorStyleIsSet = false;
        /** Store pointerdown event target to track origin of click. */
        this._pointerDownListener = (event) => {
            this._pointerDownEventTarget = _getEventTarget(event);
        };
        /** Click event listener that will be attached to the body propagate phase. */
        this._clickListener = (event) => {
            const target = _getEventTarget(event);
            // In case of a click event, we want to check the origin of the click
            // (e.g. in case where a user starts a click inside the overlay and
            // releases the click outside of it).
            // This is done by using the event target of the preceding pointerdown event.
            // Every click event caused by a pointer device has a preceding pointerdown
            // event, unless the click was programmatically triggered (e.g. in a unit test).
            const origin = event.type === 'click' && this._pointerDownEventTarget
                ? this._pointerDownEventTarget
                : target;
            // Reset the stored pointerdown event target, to avoid having it interfere
            // in subsequent events.
            this._pointerDownEventTarget = null;
            // We copy the array because the original may be modified asynchronously if the
            // outsidePointerEvents listener decides to detach overlays resulting in index errors inside
            // the for loop.
            const overlays = this._attachedOverlays.slice();
            // Dispatch the mouse event to the top overlay which has subscribers to its mouse events.
            // We want to target all overlays for which the click could be considered as outside click.
            // As soon as we reach an overlay for which the click is not outside click we break off
            // the loop.
            for (let i = overlays.length - 1; i > -1; i--) {
                const overlayRef = overlays[i];
                if (overlayRef._outsidePointerEvents.observers.length < 1 || !overlayRef.hasAttached()) {
                    continue;
                }
                // If it's a click inside the overlay, just break - we should do nothing
                // If it's an outside click (both origin and target of the click) dispatch the mouse event,
                // and proceed with the next overlay
                if (overlayRef.overlayElement.contains(target) ||
                    overlayRef.overlayElement.contains(origin)) {
                    break;
                }
                const outsidePointerEvents = overlayRef._outsidePointerEvents;
                /** @breaking-change 14.0.0 _ngZone will be required. */
                if (this._ngZone) {
                    this._ngZone.run(() => outsidePointerEvents.next(event));
                }
                else {
                    outsidePointerEvents.next(event);
                }
            }
        };
    }
    /** Add a new overlay to the list of attached overlay refs. */
    add(overlayRef) {
        super.add(overlayRef);
        // Safari on iOS does not generate click events for non-interactive
        // elements. However, we want to receive a click for any element outside
        // the overlay. We can force a "clickable" state by setting
        // `cursor: pointer` on the document body. See:
        // https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event#Safari_Mobile
        // https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html
        if (!this._isAttached) {
            const body = this._document.body;
            /** @breaking-change 14.0.0 _ngZone will be required. */
            if (this._ngZone) {
                this._ngZone.runOutsideAngular(() => this._addEventListeners(body));
            }
            else {
                this._addEventListeners(body);
            }
            // click event is not fired on iOS. To make element "clickable" we are
            // setting the cursor to pointer
            if (this._platform.IOS && !this._cursorStyleIsSet) {
                this._cursorOriginalValue = body.style.cursor;
                body.style.cursor = 'pointer';
                this._cursorStyleIsSet = true;
            }
            this._isAttached = true;
        }
    }
    /** Detaches the global keyboard event listener. */
    detach() {
        if (this._isAttached) {
            const body = this._document.body;
            body.removeEventListener('pointerdown', this._pointerDownListener, true);
            body.removeEventListener('click', this._clickListener, true);
            body.removeEventListener('auxclick', this._clickListener, true);
            body.removeEventListener('contextmenu', this._clickListener, true);
            if (this._platform.IOS && this._cursorStyleIsSet) {
                body.style.cursor = this._cursorOriginalValue;
                this._cursorStyleIsSet = false;
            }
            this._isAttached = false;
        }
    }
    _addEventListeners(body) {
        body.addEventListener('pointerdown', this._pointerDownListener, true);
        body.addEventListener('click', this._clickListener, true);
        body.addEventListener('auxclick', this._clickListener, true);
        body.addEventListener('contextmenu', this._clickListener, true);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: OverlayOutsideClickDispatcher, deps: [{ token: DOCUMENT }, { token: i1.Platform }, { token: i0.NgZone, optional: true }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: OverlayOutsideClickDispatcher, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: OverlayOutsideClickDispatcher, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: i1.Platform }, { type: i0.NgZone, decorators: [{
                    type: Optional
                }] }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1vdXRzaWRlLWNsaWNrLWRpc3BhdGNoZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvZGlzcGF0Y2hlcnMvb3ZlcmxheS1vdXRzaWRlLWNsaWNrLWRpc3BhdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDbkUsT0FBTyxFQUFDLFFBQVEsRUFBRSxlQUFlLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNoRSxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQzs7O0FBR2hFOzs7O0dBSUc7QUFFSCxNQUFNLE9BQU8sNkJBQThCLFNBQVEscUJBQXFCO0lBS3RFLFlBQ29CLFFBQWEsRUFDdkIsU0FBbUI7SUFDM0Isd0RBQXdEO0lBQ3BDLE9BQWdCO1FBRXBDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUpSLGNBQVMsR0FBVCxTQUFTLENBQVU7UUFFUCxZQUFPLEdBQVAsT0FBTyxDQUFTO1FBUDlCLHNCQUFpQixHQUFHLEtBQUssQ0FBQztRQW1FbEMsK0RBQStEO1FBQ3ZELHlCQUFvQixHQUFHLENBQUMsS0FBbUIsRUFBRSxFQUFFO1lBQ3JELElBQUksQ0FBQyx1QkFBdUIsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEQsQ0FBQyxDQUFDO1FBRUYsOEVBQThFO1FBQ3RFLG1CQUFjLEdBQUcsQ0FBQyxLQUFpQixFQUFFLEVBQUU7WUFDN0MsTUFBTSxNQUFNLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RDLHFFQUFxRTtZQUNyRSxtRUFBbUU7WUFDbkUscUNBQXFDO1lBQ3JDLDZF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SUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNsRSxDQUFDOzhHQW5FVSw2QkFBNkIsa0JBTTlCLFFBQVE7a0hBTlAsNkJBQTZCLGNBRGpCLE1BQU07OzJGQUNsQiw2QkFBNkI7a0JBRHpDLFVBQVU7bUJBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzswQkFPM0IsTUFBTTsyQkFBQyxRQUFROzswQkFHZixRQUFRIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge0luamVjdCwgSW5qZWN0YWJsZSwgTmdab25lLCBPcHRpb25hbH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1BsYXRmb3JtLCBfZ2V0RXZlbnRUYXJnZXR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge0Jhc2VPdmVybGF5RGlzcGF0Y2hlcn0gZnJvbSAnLi9iYXNlLW92ZXJsYXktZGlzcGF0Y2hlcic7XG5pbXBvcnQgdHlwZSB7T3ZlcmxheVJlZn0gZnJvbSAnLi4vb3ZlcmxheS1yZWYnO1xuXG4vKipcbiAqIFNlcnZpY2UgZm9yIGRpc3BhdGNoaW5nIG1vdXNlIGNsaWNrIGV2ZW50cyB0aGF0IGxhbmQgb24gdGhlIGJvZHkgdG8gYXBwcm9wcmlhdGUgb3ZlcmxheSByZWYsXG4gKiBpZiBhbnkuIEl0IG1haW50YWlucyBhIGxpc3Qgb2YgYXR0YWNoZWQgb3ZlcmxheXMgdG8gZGV0ZXJtaW5lIGJlc3Qgc3VpdGVkIG92ZXJsYXkgYmFzZWRcbiAqIG9uIGV2ZW50IHRhcmdldCBhbmQgb3JkZXIgb2Ygb3ZlcmxheSBvcGVucy5cbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgT3ZlcmxheU91dHNpZGVDbGlja0Rpc3BhdGNoZXIgZXh0ZW5kcyBCYXNlT3ZlcmxheURpc3BhdGNoZXIge1xuICBwcml2YXRlIF9jdXJzb3JPcmlnaW5hbFZhbHVlOiBzdHJpbmc7XG4gIHByaXZhdGUgX2N1cnNvclN0eWxlSXNTZXQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfcG9pbnRlckRvd25FdmVudFRhcmdldDogRXZlbnRUYXJnZXQgfCBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIEBJbmplY3QoRE9DVU1FTlQpIGRvY3VtZW50OiBhbnksXG4gICAgcHJpdmF0ZSBfcGxhdGZvcm06IFBsYXRmb3JtLFxuICAgIC8qKiBAYnJlYWtpbmctY2hhbmdlIDE0LjAuMCBfbmdab25lIHdpbGwgYmUgcmVxdWlyZWQuICovXG4gICAgQE9wdGlvbmFsKCkgcHJpdmF0ZSBfbmdab25lPzogTmdab25lLFxuICApIHtcbiAgICBzdXBlcihkb2N1bWVudCk7XG4gIH1cblxuICAvKiogQWRkIGEgbmV3IG92ZXJsYXkgdG8gdGhlIGxpc3Qgb2YgYXR0YWNoZWQgb3ZlcmxheSByZWZzLiAqL1xuICBvdmVycmlkZSBhZGQob3ZlcmxheVJlZjogT3ZlcmxheVJlZik6IHZvaWQge1xuICAgIHN1cGVyLmFkZChvdmVybGF5UmVmKTtcblxuICAgIC8vIFNhZmFyaSBvbiBpT1MgZG9lcyBub3QgZ2VuZXJhdGUgY2xpY2sgZXZlbnRzIGZvciBub24taW50ZXJhY3RpdmVcbiAgICAvLyBlbGVtZW50cy4gSG93ZXZlciwgd2Ugd2FudCB0byByZWNlaXZlIGEgY2xpY2sgZm9yIGFueSBlbGVtZW50IG91dHNpZGVcbiAgICAvLyB0aGUgb3ZlcmxheS4gV2UgY2FuIGZvcmNlIGEgXCJjbGlja2FibGVcIiBzdGF0ZSBieSBzZXR0aW5nXG4gICAgLy8gYGN1cnNvcjogcG9pbnRlcmAgb24gdGhlIGRvY3VtZW50IGJvZHkuIFNlZTpcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRWxlbWVudC9jbGlja19ldmVudCNTYWZhcmlfTW9iaWxlXG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIuYXBwbGUuY29tL2xpYnJhcnkvYXJjaGl2ZS9kb2N1bWVudGF0aW9uL0FwcGxlQXBwbGljYXRpb25zL1JlZmVyZW5jZS9TYWZhcmlXZWJDb250ZW50L0hhbmRsaW5nRXZlbnRzL0hhbmRsaW5nRXZlbnRzLmh0bWxcbiAgICBpZiAoIXRoaXMuX2lzQXR0YWNoZWQpIHtcbiAgICAgIGNvbnN0IGJvZHkgPSB0aGlzLl9kb2N1bWVudC5ib2R5O1xuXG4gICAgICAvKiogQGJyZWFraW5nLWNoYW5nZSAxNC4wLjAgX25nWm9uZSB3aWxsIGJlIHJlcXVpcmVkLiAqL1xuICAgICAgaWYgKHRoaXMuX25nWm9uZSkge1xuICAgICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gdGhpcy5fYWRkRXZlbnRMaXN0ZW5lcnMoYm9keSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fYWRkRXZlbnRMaXN0ZW5lcnMoYm9keSk7XG4gICAgICB9XG5cbiAgICAgIC8vIGNsaWNrIGV2ZW50IGlzIG5vdCBmaXJlZCBvbiBpT1MuIFRvIG1ha2UgZWxlbWVudCBcImNsaWNrYWJsZVwiIHdlIGFyZVxuICAgICAgLy8gc2V0dGluZyB0aGUgY3Vyc29yIHRvIHBvaW50ZXJcbiAgICAgIGlmICh0aGlzLl9wbGF0Zm9ybS5JT1MgJiYgIXRoaXMuX2N1cnNvclN0eWxlSXNTZXQpIHtcbiAgICAgICAgdGhpcy5fY3Vyc29yT3JpZ2luYWxWYWx1ZSA9IGJvZHkuc3R5bGUuY3Vyc29yO1xuICAgICAgICBib2R5LnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgdGhpcy5fY3Vyc29yU3R5bGVJc1NldCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2lzQXR0YWNoZWQgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBEZXRhY2hlcyB0aGUgZ2xvYmFsIGtleWJvYXJkIGV2ZW50IGxpc3RlbmVyLiAqL1xuICBwcm90ZWN0ZWQgZGV0YWNoKCkge1xuICAgIGlmICh0aGlzLl9pc0F0dGFjaGVkKSB7XG4gICAgICBjb25zdCBib2R5ID0gdGhpcy5fZG9jdW1lbnQuYm9keTtcbiAgICAgIGJvZHkucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcmRvd24nLCB0aGlzLl9wb2ludGVyRG93bkxpc3RlbmVyLCB0cnVlKTtcbiAgICAgIGJvZHkucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLl9jbGlja0xpc3RlbmVyLCB0cnVlKTtcbiAgICAgIGJvZHkucmVtb3ZlRXZlbnRMaXN0ZW5lcignYXV4Y2xpY2snLCB0aGlzLl9jbGlja0xpc3RlbmVyLCB0cnVlKTtcbiAgICAgIGJvZHkucmVtb3ZlRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCB0aGlzLl9jbGlja0xpc3RlbmVyLCB0cnVlKTtcbiAgICAgIGlmICh0aGlzLl9wbGF0Zm9ybS5JT1MgJiYgdGhpcy5fY3Vyc29yU3R5bGVJc1NldCkge1xuICAgICAgICBib2R5LnN0eWxlLmN1cnNvciA9IHRoaXMuX2N1cnNvck9yaWdpbmFsVmFsdWU7XG4gICAgICAgIHRoaXMuX2N1cnNvclN0eWxlSXNTZXQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2lzQXR0YWNoZWQgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9hZGRFdmVudExpc3RlbmVycyhib2R5OiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmRvd24nLCB0aGlzLl9wb2ludGVyRG93bkxpc3RlbmVyLCB0cnVlKTtcbiAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5fY2xpY2tMaXN0ZW5lciwgdHJ1ZSk7XG4gICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdhdXhjbGljaycsIHRoaXMuX2NsaWNrTGlzdGVuZXIsIHRydWUpO1xuICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCB0aGlzLl9jbGlja0xpc3RlbmVyLCB0cnVlKTtcbiAgfVxuXG4gIC8qKiBTdG9yZSBwb2ludGVyZG93biBldmVudCB0YXJnZXQgdG8gdHJhY2sgb3JpZ2luIG9mIGNsaWNrLiAqL1xuICBwcml2YXRlIF9wb2ludGVyRG93bkxpc3RlbmVyID0gKGV2ZW50OiBQb2ludGVyRXZlbnQpID0+IHtcbiAgICB0aGlzLl9wb2ludGVyRG93bkV2ZW50VGFyZ2V0ID0gX2dldEV2ZW50VGFyZ2V0KGV2ZW50KTtcbiAgfTtcblxuICAvKiogQ2xpY2sgZXZlbnQgbGlzdGVuZXIgdGhhdCB3aWxsIGJlIGF0dGFjaGVkIHRvIHRoZSBib2R5IHByb3BhZ2F0ZSBwaGFzZS4gKi9cbiAgcHJpdmF0ZSBfY2xpY2tMaXN0ZW5lciA9IChldmVudDogTW91c2VFdmVudCkgPT4ge1xuICAgIGNvbnN0IHRhcmdldCA9IF9nZXRFdmVudFRhcmdldChldmVudCk7XG4gICAgLy8gSW4gY2FzZSBvZiBhIGNsaWNrIGV2ZW50LCB3ZSB3YW50IHRvIGNoZWNrIHRoZSBvcmlnaW4gb2YgdGhlIGNsaWNrXG4gICAgLy8gKGUuZy4gaW4gY2FzZSB3aGVyZSBhIHVzZXIgc3RhcnRzIGEgY2xpY2sgaW5zaWRlIHRoZSBvdmVybGF5IGFuZFxuICAgIC8vIHJlbGVhc2VzIHRoZSBjbGljayBvdXRzaWRlIG9mIGl0KS5cbiAgICAvLyBUaGlzIGlzIGRvbmUgYnkgdXNpbmcgdGhlIGV2ZW50IHRhcmdldCBvZiB0aGUgcHJlY2VkaW5nIHBvaW50ZXJkb3duIGV2ZW50LlxuICAgIC8vIEV2ZXJ5IGNsaWNrIGV2ZW50IGNhdXNlZCBieSBhIHBvaW50ZXIgZGV2aWNlIGhhcyBhIHByZWNlZGluZyBwb2ludGVyZG93blxuICAgIC8vIGV2ZW50LCB1bmxlc3MgdGhlIGNsaWNrIHdhcyBwcm9ncmFtbWF0aWNhbGx5IHRyaWdnZXJlZCAoZS5nLiBpbiBhIHVuaXQgdGVzdCkuXG4gICAgY29uc3Qgb3JpZ2luID1cbiAgICAgIGV2ZW50LnR5cGUgPT09ICdjbGljaycgJiYgdGhpcy5fcG9pbnRlckRvd25FdmVudFRhcmdldFxuICAgICAgICA/IHRoaXMuX3BvaW50ZXJEb3duRXZlbnRUYXJnZXRcbiAgICAgICAgOiB0YXJnZXQ7XG4gICAgLy8gUmVzZXQgdGhlIHN0b3JlZCBwb2ludGVyZG93biBldmVudCB0YXJnZXQsIHRvIGF2b2lkIGhhdmluZyBpdCBpbnRlcmZlcmVcbiAgICAvLyBpbiBzdWJzZXF1ZW50IGV2ZW50cy5cbiAgICB0aGlzLl9wb2ludGVyRG93bkV2ZW50VGFyZ2V0ID0gbnVsbDtcblxuICAgIC8vIFdlIGNvcHkgdGhlIGFycmF5IGJlY2F1c2UgdGhlIG9yaWdpbmFsIG1heSBiZSBtb2RpZmllZCBhc3luY2hyb25vdXNseSBpZiB0aGVcbiAgICAvLyBvdXRzaWRlUG9pbnRlckV2ZW50cyBsaXN0ZW5lciBkZWNpZGVzIHRvIGRldGFjaCBvdmVybGF5cyByZXN1bHRpbmcgaW4gaW5kZXggZXJyb3JzIGluc2lkZVxuICAgIC8vIHRoZSBmb3IgbG9vcC5cbiAgICBjb25zdCBvdmVybGF5cyA9IHRoaXMuX2F0dGFjaGVkT3ZlcmxheXMuc2xpY2UoKTtcblxuICAgIC8vIERpc3BhdGNoIHRoZSBtb3VzZSBldmVudCB0byB0aGUgdG9wIG92ZXJsYXkgd2hpY2ggaGFzIHN1YnNjcmliZXJzIHRvIGl0cyBtb3VzZSBldmVudHMuXG4gICAgLy8gV2Ugd2FudCB0byB0YXJnZXQgYWxsIG92ZXJsYXlzIGZvciB3aGljaCB0aGUgY2xpY2sgY291bGQgYmUgY29uc2lkZXJlZCBhcyBvdXRzaWRlIGNsaWNrLlxuICAgIC8vIEFzIHNvb24gYXMgd2UgcmVhY2ggYW4gb3ZlcmxheSBmb3Igd2hpY2ggdGhlIGNsaWNrIGlzIG5vdCBvdXRzaWRlIGNsaWNrIHdlIGJyZWFrIG9mZlxuICAgIC8vIHRoZSBsb29wLlxuICAgIGZvciAobGV0IGkgPSBvdmVybGF5cy5sZW5ndGggLSAxOyBpID4gLTE7IGktLSkge1xuICAgICAgY29uc3Qgb3ZlcmxheVJlZiA9IG92ZXJsYXlzW2ldO1xuICAgICAgaWYgKG92ZXJsYXlSZWYuX291dHNpZGVQb2ludGVyRXZlbnRzLm9ic2VydmVycy5sZW5ndGggPCAxIHx8ICFvdmVybGF5UmVmLmhhc0F0dGFjaGVkKCkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIGl0J3MgYSBjbGljayBpbnNpZGUgdGhlIG92ZXJsYXksIGp1c3QgYnJlYWsgLSB3ZSBzaG91bGQgZG8gbm90aGluZ1xuICAgICAgLy8gSWYgaXQncyBhbiBvdXRzaWRlIGNsaWNrIChib3RoIG9yaWdpbiBhbmQgdGFyZ2V0IG9mIHRoZSBjbGljaykgZGlzcGF0Y2ggdGhlIG1vdXNlIGV2ZW50LFxuICAgICAgLy8gYW5kIHByb2NlZWQgd2l0aCB0aGUgbmV4dCBvdmVybGF5XG4gICAgICBpZiAoXG4gICAgICAgIG92ZXJsYXlSZWYub3ZlcmxheUVsZW1lbnQuY29udGFpbnModGFyZ2V0IGFzIE5vZGUpIHx8XG4gICAgICAgIG92ZXJsYXlSZWYub3ZlcmxheUVsZW1lbnQuY29udGFpbnMob3JpZ2luIGFzIE5vZGUpXG4gICAgICApIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG91dHNpZGVQb2ludGVyRXZlbnRzID0gb3ZlcmxheVJlZi5fb3V0c2lkZVBvaW50ZXJFdmVudHM7XG4gICAgICAvKiogQGJyZWFraW5nLWNoYW5nZSAxNC4wLjAgX25nWm9uZSB3aWxsIGJlIHJlcXVpcmVkLiAqL1xuICAgICAgaWYgKHRoaXMuX25nWm9uZSkge1xuICAgICAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IG91dHNpZGVQb2ludGVyRXZlbnRzLm5leHQoZXZlbnQpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG91dHNpZGVQb2ludGVyRXZlbnRzLm5leHQoZXZlbnQpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn1cbiJdfQ==