/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
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
    constructor(document, _platform) {
        super(document);
        this._platform = _platform;
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
                ? this._pointerDownEventTarget : target;
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
                overlayRef._outsidePointerEvents.next(event);
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
            body.addEventListener('pointerdown', this._pointerDownListener, true);
            body.addEventListener('click', this._clickListener, true);
            body.addEventListener('auxclick', this._clickListener, true);
            body.addEventListener('contextmenu', this._clickListener, true);
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
}
OverlayOutsideClickDispatcher.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: OverlayOutsideClickDispatcher, deps: [{ token: DOCUMENT }, { token: i1.Platform }], target: i0.ɵɵFactoryTarget.Injectable });
OverlayOutsideClickDispatcher.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: OverlayOutsideClickDispatcher, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: OverlayOutsideClickDispatcher, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: i1.Platform }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1vdXRzaWRlLWNsaWNrLWRpc3BhdGNoZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvZGlzcGF0Y2hlcnMvb3ZlcmxheS1vdXRzaWRlLWNsaWNrLWRpc3BhdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRWpELE9BQU8sRUFBQyxRQUFRLEVBQUUsZUFBZSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDaEUsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sMkJBQTJCLENBQUM7OztBQUVoRTs7OztHQUlHO0FBRUgsTUFBTSxPQUFPLDZCQUE4QixTQUFRLHFCQUFxQjtJQUt0RSxZQUE4QixRQUFhLEVBQVUsU0FBbUI7UUFDdEUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRG1DLGNBQVMsR0FBVCxTQUFTLENBQVU7UUFIaEUsc0JBQWlCLEdBQUcsS0FBSyxDQUFDO1FBb0RsQywrREFBK0Q7UUFDdkQseUJBQW9CLEdBQUcsQ0FBQyxLQUFtQixFQUFFLEVBQUU7WUFDckQsSUFBSSxDQUFDLHVCQUF1QixHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN4RCxDQUFDLENBQUE7UUFFRCw4RUFBOEU7UUFDdEUsbUJBQWMsR0FBRyxDQUFDLEtBQWlCLEVBQUUsRUFBRTtZQUM3QyxNQUFNLE1BQU0sR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdEMscUVBQXFFO1lBQ3JFLG1FQUFtRTtZQUNuRSxxQ0FBcUM7WUFDckMsNkVBQTZFO1lBQzdFLDJFQUEyRTtZQUMzRSxnRkFBZ0Y7WUFDaEYsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLElBQUksS0FB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Q0FBQyxDQUFDO1lBQ3pFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM3RCxJQUFJLENBQUMsbUJBQW1CLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDaEUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ25FLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFO2dCQUNoRCxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUM7Z0JBQzlDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxLQUFLLENBQUM7YUFDaEM7WUFDRCxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztTQUMxQjtJQUNILENBQUM7OzBIQXBEVSw2QkFBNkIsa0JBS3BCLFFBQVE7OEhBTGpCLDZCQUE2QixjQURqQixNQUFNOzJGQUNsQiw2QkFBNkI7a0JBRHpDLFVBQVU7bUJBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzswQkFNakIsTUFBTTsyQkFBQyxRQUFRIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge0luamVjdCwgSW5qZWN0YWJsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge092ZXJsYXlSZWZlcmVuY2V9IGZyb20gJy4uL292ZXJsYXktcmVmZXJlbmNlJztcbmltcG9ydCB7UGxhdGZvcm0sIF9nZXRFdmVudFRhcmdldH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7QmFzZU92ZXJsYXlEaXNwYXRjaGVyfSBmcm9tICcuL2Jhc2Utb3ZlcmxheS1kaXNwYXRjaGVyJztcblxuLyoqXG4gKiBTZXJ2aWNlIGZvciBkaXNwYXRjaGluZyBtb3VzZSBjbGljayBldmVudHMgdGhhdCBsYW5kIG9uIHRoZSBib2R5IHRvIGFwcHJvcHJpYXRlIG92ZXJsYXkgcmVmLFxuICogaWYgYW55LiBJdCBtYWludGFpbnMgYSBsaXN0IG9mIGF0dGFjaGVkIG92ZXJsYXlzIHRvIGRldGVybWluZSBiZXN0IHN1aXRlZCBvdmVybGF5IGJhc2VkXG4gKiBvbiBldmVudCB0YXJnZXQgYW5kIG9yZGVyIG9mIG92ZXJsYXkgb3BlbnMuXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIE92ZXJsYXlPdXRzaWRlQ2xpY2tEaXNwYXRjaGVyIGV4dGVuZHMgQmFzZU92ZXJsYXlEaXNwYXRjaGVyIHtcbiAgcHJpdmF0ZSBfY3Vyc29yT3JpZ2luYWxWYWx1ZTogc3RyaW5nO1xuICBwcml2YXRlIF9jdXJzb3JTdHlsZUlzU2V0ID0gZmFsc2U7XG4gIHByaXZhdGUgX3BvaW50ZXJEb3duRXZlbnRUYXJnZXQ6IEV2ZW50VGFyZ2V0IHwgbnVsbDtcblxuICBjb25zdHJ1Y3RvcihASW5qZWN0KERPQ1VNRU5UKSBkb2N1bWVudDogYW55LCBwcml2YXRlIF9wbGF0Zm9ybTogUGxhdGZvcm0pIHtcbiAgICBzdXBlcihkb2N1bWVudCk7XG4gIH1cblxuICAvKiogQWRkIGEgbmV3IG92ZXJsYXkgdG8gdGhlIGxpc3Qgb2YgYXR0YWNoZWQgb3ZlcmxheSByZWZzLiAqL1xuICBvdmVycmlkZSBhZGQob3ZlcmxheVJlZjogT3ZlcmxheVJlZmVyZW5jZSk6IHZvaWQge1xuICAgIHN1cGVyLmFkZChvdmVybGF5UmVmKTtcblxuICAgIC8vIFNhZmFyaSBvbiBpT1MgZG9lcyBub3QgZ2VuZXJhdGUgY2xpY2sgZXZlbnRzIGZvciBub24taW50ZXJhY3RpdmVcbiAgICAvLyBlbGVtZW50cy4gSG93ZXZlciwgd2Ugd2FudCB0byByZWNlaXZlIGEgY2xpY2sgZm9yIGFueSBlbGVtZW50IG91dHNpZGVcbiAgICAvLyB0aGUgb3ZlcmxheS4gV2UgY2FuIGZvcmNlIGEgXCJjbGlja2FibGVcIiBzdGF0ZSBieSBzZXR0aW5nXG4gICAgLy8gYGN1cnNvcjogcG9pbnRlcmAgb24gdGhlIGRvY3VtZW50IGJvZHkuIFNlZTpcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRWxlbWVudC9jbGlja19ldmVudCNTYWZhcmlfTW9iaWxlXG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIuYXBwbGUuY29tL2xpYnJhcnkvYXJjaGl2ZS9kb2N1bWVudGF0aW9uL0FwcGxlQXBwbGljYXRpb25zL1JlZmVyZW5jZS9TYWZhcmlXZWJDb250ZW50L0hhbmRsaW5nRXZlbnRzL0hhbmRsaW5nRXZlbnRzLmh0bWxcbiAgICBpZiAoIXRoaXMuX2lzQXR0YWNoZWQpIHtcbiAgICAgIGNvbnN0IGJvZHkgPSB0aGlzLl9kb2N1bWVudC5ib2R5O1xuICAgICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIHRoaXMuX3BvaW50ZXJEb3duTGlzdGVuZXIsIHRydWUpO1xuICAgICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuX2NsaWNrTGlzdGVuZXIsIHRydWUpO1xuICAgICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdhdXhjbGljaycsIHRoaXMuX2NsaWNrTGlzdGVuZXIsIHRydWUpO1xuICAgICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIHRoaXMuX2NsaWNrTGlzdGVuZXIsIHRydWUpO1xuXG4gICAgICAvLyBjbGljayBldmVudCBpcyBub3QgZmlyZWQgb24gaU9TLiBUbyBtYWtlIGVsZW1lbnQgXCJjbGlja2FibGVcIiB3ZSBhcmVcbiAgICAgIC8vIHNldHRpbmcgdGhlIGN1cnNvciB0byBwb2ludGVyXG4gICAgICBpZiAodGhpcy5fcGxhdGZvcm0uSU9TICYmICF0aGlzLl9jdXJzb3JTdHlsZUlzU2V0KSB7XG4gICAgICAgIHRoaXMuX2N1cnNvck9yaWdpbmFsVmFsdWUgPSBib2R5LnN0eWxlLmN1cnNvcjtcbiAgICAgICAgYm9keS5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgICAgIHRoaXMuX2N1cnNvclN0eWxlSXNTZXQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9pc0F0dGFjaGVkID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICAvKiogRGV0YWNoZXMgdGhlIGdsb2JhbCBrZXlib2FyZCBldmVudCBsaXN0ZW5lci4gKi9cbiAgcHJvdGVjdGVkIGRldGFjaCgpIHtcbiAgICBpZiAodGhpcy5faXNBdHRhY2hlZCkge1xuICAgICAgY29uc3QgYm9keSA9IHRoaXMuX2RvY3VtZW50LmJvZHk7XG4gICAgICBib2R5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJkb3duJywgdGhpcy5fcG9pbnRlckRvd25MaXN0ZW5lciwgdHJ1ZSk7XG4gICAgICBib2R5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5fY2xpY2tMaXN0ZW5lciwgdHJ1ZSk7XG4gICAgICBib2R5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2F1eGNsaWNrJywgdGhpcy5fY2xpY2tMaXN0ZW5lciwgdHJ1ZSk7XG4gICAgICBib2R5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgdGhpcy5fY2xpY2tMaXN0ZW5lciwgdHJ1ZSk7XG4gICAgICBpZiAodGhpcy5fcGxhdGZvcm0uSU9TICYmIHRoaXMuX2N1cnNvclN0eWxlSXNTZXQpIHtcbiAgICAgICAgYm9keS5zdHlsZS5jdXJzb3IgPSB0aGlzLl9jdXJzb3JPcmlnaW5hbFZhbHVlO1xuICAgICAgICB0aGlzLl9jdXJzb3JTdHlsZUlzU2V0ID0gZmFsc2U7XG4gICAgICB9XG4gICAgICB0aGlzLl9pc0F0dGFjaGVkID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqIFN0b3JlIHBvaW50ZXJkb3duIGV2ZW50IHRhcmdldCB0byB0cmFjayBvcmlnaW4gb2YgY2xpY2suICovXG4gIHByaXZhdGUgX3BvaW50ZXJEb3duTGlzdGVuZXIgPSAoZXZlbnQ6IFBvaW50ZXJFdmVudCkgPT4ge1xuICAgIHRoaXMuX3BvaW50ZXJEb3duRXZlbnRUYXJnZXQgPSBfZ2V0RXZlbnRUYXJnZXQoZXZlbnQpO1xuICB9XG5cbiAgLyoqIENsaWNrIGV2ZW50IGxpc3RlbmVyIHRoYXQgd2lsbCBiZSBhdHRhY2hlZCB0byB0aGUgYm9keSBwcm9wYWdhdGUgcGhhc2UuICovXG4gIHByaXZhdGUgX2NsaWNrTGlzdGVuZXIgPSAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcbiAgICBjb25zdCB0YXJnZXQgPSBfZ2V0RXZlbnRUYXJnZXQoZXZlbnQpO1xuICAgIC8vIEluIGNhc2Ugb2YgYSBjbGljayBldmVudCwgd2Ugd2FudCB0byBjaGVjayB0aGUgb3JpZ2luIG9mIHRoZSBjbGlja1xuICAgIC8vIChlLmcuIGluIGNhc2Ugd2hlcmUgYSB1c2VyIHN0YXJ0cyBhIGNsaWNrIGluc2lkZSB0aGUgb3ZlcmxheSBhbmRcbiAgICAvLyByZWxlYXNlcyB0aGUgY2xpY2sgb3V0c2lkZSBvZiBpdCkuXG4gICAgLy8gVGhpcyBpcyBkb25lIGJ5IHVzaW5nIHRoZSBldmVudCB0YXJnZXQgb2YgdGhlIHByZWNlZGluZyBwb2ludGVyZG93biBldmVudC5cbiAgICAvLyBFdmVyeSBjbGljayBldmVudCBjYXVzZWQgYnkgYSBwb2ludGVyIGRldmljZSBoYXMgYSBwcmVjZWRpbmcgcG9pbnRlcmRvd25cbiAgICAvLyBldmVudCwgdW5sZXNzIHRoZSBjbGljayB3YXMgcHJvZ3JhbW1hdGljYWxseSB0cmlnZ2VyZWQgKGUuZy4gaW4gYSB1bml0IHRlc3QpLlxuICAgIGNvbnN0IG9yaWdpbiA9IGV2ZW50LnR5cGUgPT09ICdjbGljaycgJiYgdGhpcy5fcG9pbnRlckRvd25FdmVudFRhcmdldFxuICAgICAgPyB0aGlzLl9wb2ludGVyRG93bkV2ZW50VGFyZ2V0IDogdGFyZ2V0O1xuICAgIC8vIFJlc2V0IHRoZSBzdG9yZWQgcG9pbnRlcmRvd24gZXZlbnQgdGFyZ2V0LCB0byBhdm9pZCBoYXZpbmcgaXQgaW50ZXJmZXJlXG4gICAgLy8gaW4gc3Vic2VxdWVudCBldmVudHMuXG4gICAgdGhpcy5fcG9pbnRlckRvd25FdmVudFRhcmdldCA9IG51bGw7XG5cbiAgICAvLyBXZSBjb3B5IHRoZSBhcnJheSBiZWNhdXNlIHRoZSBvcmlnaW5hbCBtYXkgYmUgbW9kaWZpZWQgYXN5bmNocm9ub3VzbHkgaWYgdGhlXG4gICAgLy8gb3V0c2lkZVBvaW50ZXJFdmVudHMgbGlzdGVuZXIgZGVjaWRlcyB0byBkZXRhY2ggb3ZlcmxheXMgcmVzdWx0aW5nIGluIGluZGV4IGVycm9ycyBpbnNpZGVcbiAgICAvLyB0aGUgZm9yIGxvb3AuXG4gICAgY29uc3Qgb3ZlcmxheXMgPSB0aGlzLl9hdHRhY2hlZE92ZXJsYXlzLnNsaWNlKCk7XG5cbiAgICAvLyBEaXNwYXRjaCB0aGUgbW91c2UgZXZlbnQgdG8gdGhlIHRvcCBvdmVybGF5IHdoaWNoIGhhcyBzdWJzY3JpYmVycyB0byBpdHMgbW91c2UgZXZlbnRzLlxuICAgIC8vIFdlIHdhbnQgdG8gdGFyZ2V0IGFsbCBvdmVybGF5cyBmb3Igd2hpY2ggdGhlIGNsaWNrIGNvdWxkIGJlIGNvbnNpZGVyZWQgYXMgb3V0c2lkZSBjbGljay5cbiAgICAvLyBBcyBzb29uIGFzIHdlIHJlYWNoIGFuIG92ZXJsYXkgZm9yIHdoaWNoIHRoZSBjbGljayBpcyBub3Qgb3V0c2lkZSBjbGljayB3ZSBicmVhayBvZmZcbiAgICAvLyB0aGUgbG9vcC5cbiAgICBmb3IgKGxldCBpID0gb3ZlcmxheXMubGVuZ3RoIC0gMTsgaSA+IC0xOyBpLS0pIHtcbiAgICAgIGNvbnN0IG92ZXJsYXlSZWYgPSBvdmVybGF5c1tpXTtcbiAgICAgIGlmIChvdmVybGF5UmVmLl9vdXRzaWRlUG9pbnRlckV2ZW50cy5vYnNlcnZlcnMubGVuZ3RoIDwgMSB8fCAhb3ZlcmxheVJlZi5oYXNBdHRhY2hlZCgpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiBpdCdzIGEgY2xpY2sgaW5zaWRlIHRoZSBvdmVybGF5LCBqdXN0IGJyZWFrIC0gd2Ugc2hvdWxkIGRvIG5vdGhpbmdcbiAgICAgIC8vIElmIGl0J3MgYW4gb3V0c2lkZSBjbGljayAoYm90aCBvcmlnaW4gYW5kIHRhcmdldCBvZiB0aGUgY2xpY2spIGRpc3BhdGNoIHRoZSBtb3VzZSBldmVudCxcbiAgICAgIC8vIGFuZCBwcm9jZWVkIHdpdGggdGhlIG5leHQgb3ZlcmxheVxuICAgICAgaWYgKG92ZXJsYXlSZWYub3ZlcmxheUVsZW1lbnQuY29udGFpbnModGFyZ2V0IGFzIE5vZGUpIHx8XG4gICAgICAgICAgb3ZlcmxheVJlZi5vdmVybGF5RWxlbWVudC5jb250YWlucyhvcmlnaW4gYXMgTm9kZSkpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIG92ZXJsYXlSZWYuX291dHNpZGVQb2ludGVyRXZlbnRzLm5leHQoZXZlbnQpO1xuICAgIH1cbiAgfTtcbn1cbiJdfQ==