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
OverlayOutsideClickDispatcher.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.2.0", ngImport: i0, type: OverlayOutsideClickDispatcher, deps: [{ token: DOCUMENT }, { token: i1.Platform }], target: i0.ɵɵFactoryTarget.Injectable });
OverlayOutsideClickDispatcher.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.2.0", ngImport: i0, type: OverlayOutsideClickDispatcher, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.2.0", ngImport: i0, type: OverlayOutsideClickDispatcher, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: i1.Platform }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1vdXRzaWRlLWNsaWNrLWRpc3BhdGNoZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvZGlzcGF0Y2hlcnMvb3ZlcmxheS1vdXRzaWRlLWNsaWNrLWRpc3BhdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRWpELE9BQU8sRUFBQyxRQUFRLEVBQUUsZUFBZSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDaEUsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sMkJBQTJCLENBQUM7OztBQUVoRTs7OztHQUlHO0FBRUgsTUFBTSxPQUFPLDZCQUE4QixTQUFRLHFCQUFxQjtJQUt0RSxZQUE4QixRQUFhLEVBQVUsU0FBbUI7UUFDdEUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRG1DLGNBQVMsR0FBVCxTQUFTLENBQVU7UUFIaEUsc0JBQWlCLEdBQUcsS0FBSyxDQUFDO1FBb0RsQywrREFBK0Q7UUFDdkQseUJBQW9CLEdBQUcsQ0FBQyxLQUFtQixFQUFFLEVBQUU7WUFDckQsSUFBSSxDQUFDLHVCQUF1QixHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN4RCxDQUFDLENBQUM7UUFFRiw4RUFBOEU7UUFDdEUsbUJBQWMsR0FBRyxDQUFDLEtBQWlCLEVBQUUsRUFBRTtZQUM3QyxNQUFNLE1BQU0sR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdEMscUVBQXFFO1lBQ3JFLG1FQUFtRTtZQUNuRSxxQ0FBcUM7WUFDckMsNkVBQTZFO1lBQzdFLDJFQUEyRTtZQUMzRSxnRkFBZ0Y7WUFDaEYsTUFBTSxNQUFNLEdBQ1YsS0FBSyxDQUFDLElBQUksS0FB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LENBQUMsQ0FBQztZQUN6RSxJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDN0QsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2hFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNuRSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtnQkFDaEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDO2dCQUM5QyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsS0FBSyxDQUFDO2FBQ2hDO1lBQ0QsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7U0FDMUI7SUFDSCxDQUFDOzswSEFwRFUsNkJBQTZCLGtCQUtwQixRQUFROzhIQUxqQiw2QkFBNkIsY0FEakIsTUFBTTsyRkFDbEIsNkJBQTZCO2tCQUR6QyxVQUFVO21CQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQzs7MEJBTWpCLE1BQU07MkJBQUMsUUFBUSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtJbmplY3QsIEluamVjdGFibGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtPdmVybGF5UmVmZXJlbmNlfSBmcm9tICcuLi9vdmVybGF5LXJlZmVyZW5jZSc7XG5pbXBvcnQge1BsYXRmb3JtLCBfZ2V0RXZlbnRUYXJnZXR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge0Jhc2VPdmVybGF5RGlzcGF0Y2hlcn0gZnJvbSAnLi9iYXNlLW92ZXJsYXktZGlzcGF0Y2hlcic7XG5cbi8qKlxuICogU2VydmljZSBmb3IgZGlzcGF0Y2hpbmcgbW91c2UgY2xpY2sgZXZlbnRzIHRoYXQgbGFuZCBvbiB0aGUgYm9keSB0byBhcHByb3ByaWF0ZSBvdmVybGF5IHJlZixcbiAqIGlmIGFueS4gSXQgbWFpbnRhaW5zIGEgbGlzdCBvZiBhdHRhY2hlZCBvdmVybGF5cyB0byBkZXRlcm1pbmUgYmVzdCBzdWl0ZWQgb3ZlcmxheSBiYXNlZFxuICogb24gZXZlbnQgdGFyZ2V0IGFuZCBvcmRlciBvZiBvdmVybGF5IG9wZW5zLlxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBPdmVybGF5T3V0c2lkZUNsaWNrRGlzcGF0Y2hlciBleHRlbmRzIEJhc2VPdmVybGF5RGlzcGF0Y2hlciB7XG4gIHByaXZhdGUgX2N1cnNvck9yaWdpbmFsVmFsdWU6IHN0cmluZztcbiAgcHJpdmF0ZSBfY3Vyc29yU3R5bGVJc1NldCA9IGZhbHNlO1xuICBwcml2YXRlIF9wb2ludGVyRG93bkV2ZW50VGFyZ2V0OiBFdmVudFRhcmdldCB8IG51bGw7XG5cbiAgY29uc3RydWN0b3IoQEluamVjdChET0NVTUVOVCkgZG9jdW1lbnQ6IGFueSwgcHJpdmF0ZSBfcGxhdGZvcm06IFBsYXRmb3JtKSB7XG4gICAgc3VwZXIoZG9jdW1lbnQpO1xuICB9XG5cbiAgLyoqIEFkZCBhIG5ldyBvdmVybGF5IHRvIHRoZSBsaXN0IG9mIGF0dGFjaGVkIG92ZXJsYXkgcmVmcy4gKi9cbiAgb3ZlcnJpZGUgYWRkKG92ZXJsYXlSZWY6IE92ZXJsYXlSZWZlcmVuY2UpOiB2b2lkIHtcbiAgICBzdXBlci5hZGQob3ZlcmxheVJlZik7XG5cbiAgICAvLyBTYWZhcmkgb24gaU9TIGRvZXMgbm90IGdlbmVyYXRlIGNsaWNrIGV2ZW50cyBmb3Igbm9uLWludGVyYWN0aXZlXG4gICAgLy8gZWxlbWVudHMuIEhvd2V2ZXIsIHdlIHdhbnQgdG8gcmVjZWl2ZSBhIGNsaWNrIGZvciBhbnkgZWxlbWVudCBvdXRzaWRlXG4gICAgLy8gdGhlIG92ZXJsYXkuIFdlIGNhbiBmb3JjZSBhIFwiY2xpY2thYmxlXCIgc3RhdGUgYnkgc2V0dGluZ1xuICAgIC8vIGBjdXJzb3I6IHBvaW50ZXJgIG9uIHRoZSBkb2N1bWVudCBib2R5LiBTZWU6XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0VsZW1lbnQvY2xpY2tfZXZlbnQjU2FmYXJpX01vYmlsZVxuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLmFwcGxlLmNvbS9saWJyYXJ5L2FyY2hpdmUvZG9jdW1lbnRhdGlvbi9BcHBsZUFwcGxpY2F0aW9ucy9SZWZlcmVuY2UvU2FmYXJpV2ViQ29udGVudC9IYW5kbGluZ0V2ZW50cy9IYW5kbGluZ0V2ZW50cy5odG1sXG4gICAgaWYgKCF0aGlzLl9pc0F0dGFjaGVkKSB7XG4gICAgICBjb25zdCBib2R5ID0gdGhpcy5fZG9jdW1lbnQuYm9keTtcbiAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmRvd24nLCB0aGlzLl9wb2ludGVyRG93bkxpc3RlbmVyLCB0cnVlKTtcbiAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLl9jbGlja0xpc3RlbmVyLCB0cnVlKTtcbiAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcignYXV4Y2xpY2snLCB0aGlzLl9jbGlja0xpc3RlbmVyLCB0cnVlKTtcbiAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCB0aGlzLl9jbGlja0xpc3RlbmVyLCB0cnVlKTtcblxuICAgICAgLy8gY2xpY2sgZXZlbnQgaXMgbm90IGZpcmVkIG9uIGlPUy4gVG8gbWFrZSBlbGVtZW50IFwiY2xpY2thYmxlXCIgd2UgYXJlXG4gICAgICAvLyBzZXR0aW5nIHRoZSBjdXJzb3IgdG8gcG9pbnRlclxuICAgICAgaWYgKHRoaXMuX3BsYXRmb3JtLklPUyAmJiAhdGhpcy5fY3Vyc29yU3R5bGVJc1NldCkge1xuICAgICAgICB0aGlzLl9jdXJzb3JPcmlnaW5hbFZhbHVlID0gYm9keS5zdHlsZS5jdXJzb3I7XG4gICAgICAgIGJvZHkuc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICB0aGlzLl9jdXJzb3JTdHlsZUlzU2V0ID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5faXNBdHRhY2hlZCA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgLyoqIERldGFjaGVzIHRoZSBnbG9iYWwga2V5Ym9hcmQgZXZlbnQgbGlzdGVuZXIuICovXG4gIHByb3RlY3RlZCBkZXRhY2goKSB7XG4gICAgaWYgKHRoaXMuX2lzQXR0YWNoZWQpIHtcbiAgICAgIGNvbnN0IGJvZHkgPSB0aGlzLl9kb2N1bWVudC5ib2R5O1xuICAgICAgYm9keS5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIHRoaXMuX3BvaW50ZXJEb3duTGlzdGVuZXIsIHRydWUpO1xuICAgICAgYm9keS5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuX2NsaWNrTGlzdGVuZXIsIHRydWUpO1xuICAgICAgYm9keS5yZW1vdmVFdmVudExpc3RlbmVyKCdhdXhjbGljaycsIHRoaXMuX2NsaWNrTGlzdGVuZXIsIHRydWUpO1xuICAgICAgYm9keS5yZW1vdmVFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIHRoaXMuX2NsaWNrTGlzdGVuZXIsIHRydWUpO1xuICAgICAgaWYgKHRoaXMuX3BsYXRmb3JtLklPUyAmJiB0aGlzLl9jdXJzb3JTdHlsZUlzU2V0KSB7XG4gICAgICAgIGJvZHkuc3R5bGUuY3Vyc29yID0gdGhpcy5fY3Vyc29yT3JpZ2luYWxWYWx1ZTtcbiAgICAgICAgdGhpcy5fY3Vyc29yU3R5bGVJc1NldCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgdGhpcy5faXNBdHRhY2hlZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTdG9yZSBwb2ludGVyZG93biBldmVudCB0YXJnZXQgdG8gdHJhY2sgb3JpZ2luIG9mIGNsaWNrLiAqL1xuICBwcml2YXRlIF9wb2ludGVyRG93bkxpc3RlbmVyID0gKGV2ZW50OiBQb2ludGVyRXZlbnQpID0+IHtcbiAgICB0aGlzLl9wb2ludGVyRG93bkV2ZW50VGFyZ2V0ID0gX2dldEV2ZW50VGFyZ2V0KGV2ZW50KTtcbiAgfTtcblxuICAvKiogQ2xpY2sgZXZlbnQgbGlzdGVuZXIgdGhhdCB3aWxsIGJlIGF0dGFjaGVkIHRvIHRoZSBib2R5IHByb3BhZ2F0ZSBwaGFzZS4gKi9cbiAgcHJpdmF0ZSBfY2xpY2tMaXN0ZW5lciA9IChldmVudDogTW91c2VFdmVudCkgPT4ge1xuICAgIGNvbnN0IHRhcmdldCA9IF9nZXRFdmVudFRhcmdldChldmVudCk7XG4gICAgLy8gSW4gY2FzZSBvZiBhIGNsaWNrIGV2ZW50LCB3ZSB3YW50IHRvIGNoZWNrIHRoZSBvcmlnaW4gb2YgdGhlIGNsaWNrXG4gICAgLy8gKGUuZy4gaW4gY2FzZSB3aGVyZSBhIHVzZXIgc3RhcnRzIGEgY2xpY2sgaW5zaWRlIHRoZSBvdmVybGF5IGFuZFxuICAgIC8vIHJlbGVhc2VzIHRoZSBjbGljayBvdXRzaWRlIG9mIGl0KS5cbiAgICAvLyBUaGlzIGlzIGRvbmUgYnkgdXNpbmcgdGhlIGV2ZW50IHRhcmdldCBvZiB0aGUgcHJlY2VkaW5nIHBvaW50ZXJkb3duIGV2ZW50LlxuICAgIC8vIEV2ZXJ5IGNsaWNrIGV2ZW50IGNhdXNlZCBieSBhIHBvaW50ZXIgZGV2aWNlIGhhcyBhIHByZWNlZGluZyBwb2ludGVyZG93blxuICAgIC8vIGV2ZW50LCB1bmxlc3MgdGhlIGNsaWNrIHdhcyBwcm9ncmFtbWF0aWNhbGx5IHRyaWdnZXJlZCAoZS5nLiBpbiBhIHVuaXQgdGVzdCkuXG4gICAgY29uc3Qgb3JpZ2luID1cbiAgICAgIGV2ZW50LnR5cGUgPT09ICdjbGljaycgJiYgdGhpcy5fcG9pbnRlckRvd25FdmVudFRhcmdldFxuICAgICAgICA/IHRoaXMuX3BvaW50ZXJEb3duRXZlbnRUYXJnZXRcbiAgICAgICAgOiB0YXJnZXQ7XG4gICAgLy8gUmVzZXQgdGhlIHN0b3JlZCBwb2ludGVyZG93biBldmVudCB0YXJnZXQsIHRvIGF2b2lkIGhhdmluZyBpdCBpbnRlcmZlcmVcbiAgICAvLyBpbiBzdWJzZXF1ZW50IGV2ZW50cy5cbiAgICB0aGlzLl9wb2ludGVyRG93bkV2ZW50VGFyZ2V0ID0gbnVsbDtcblxuICAgIC8vIFdlIGNvcHkgdGhlIGFycmF5IGJlY2F1c2UgdGhlIG9yaWdpbmFsIG1heSBiZSBtb2RpZmllZCBhc3luY2hyb25vdXNseSBpZiB0aGVcbiAgICAvLyBvdXRzaWRlUG9pbnRlckV2ZW50cyBsaXN0ZW5lciBkZWNpZGVzIHRvIGRldGFjaCBvdmVybGF5cyByZXN1bHRpbmcgaW4gaW5kZXggZXJyb3JzIGluc2lkZVxuICAgIC8vIHRoZSBmb3IgbG9vcC5cbiAgICBjb25zdCBvdmVybGF5cyA9IHRoaXMuX2F0dGFjaGVkT3ZlcmxheXMuc2xpY2UoKTtcblxuICAgIC8vIERpc3BhdGNoIHRoZSBtb3VzZSBldmVudCB0byB0aGUgdG9wIG92ZXJsYXkgd2hpY2ggaGFzIHN1YnNjcmliZXJzIHRvIGl0cyBtb3VzZSBldmVudHMuXG4gICAgLy8gV2Ugd2FudCB0byB0YXJnZXQgYWxsIG92ZXJsYXlzIGZvciB3aGljaCB0aGUgY2xpY2sgY291bGQgYmUgY29uc2lkZXJlZCBhcyBvdXRzaWRlIGNsaWNrLlxuICAgIC8vIEFzIHNvb24gYXMgd2UgcmVhY2ggYW4gb3ZlcmxheSBmb3Igd2hpY2ggdGhlIGNsaWNrIGlzIG5vdCBvdXRzaWRlIGNsaWNrIHdlIGJyZWFrIG9mZlxuICAgIC8vIHRoZSBsb29wLlxuICAgIGZvciAobGV0IGkgPSBvdmVybGF5cy5sZW5ndGggLSAxOyBpID4gLTE7IGktLSkge1xuICAgICAgY29uc3Qgb3ZlcmxheVJlZiA9IG92ZXJsYXlzW2ldO1xuICAgICAgaWYgKG92ZXJsYXlSZWYuX291dHNpZGVQb2ludGVyRXZlbnRzLm9ic2VydmVycy5sZW5ndGggPCAxIHx8ICFvdmVybGF5UmVmLmhhc0F0dGFjaGVkKCkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIGl0J3MgYSBjbGljayBpbnNpZGUgdGhlIG92ZXJsYXksIGp1c3QgYnJlYWsgLSB3ZSBzaG91bGQgZG8gbm90aGluZ1xuICAgICAgLy8gSWYgaXQncyBhbiBvdXRzaWRlIGNsaWNrIChib3RoIG9yaWdpbiBhbmQgdGFyZ2V0IG9mIHRoZSBjbGljaykgZGlzcGF0Y2ggdGhlIG1vdXNlIGV2ZW50LFxuICAgICAgLy8gYW5kIHByb2NlZWQgd2l0aCB0aGUgbmV4dCBvdmVybGF5XG4gICAgICBpZiAoXG4gICAgICAgIG92ZXJsYXlSZWYub3ZlcmxheUVsZW1lbnQuY29udGFpbnModGFyZ2V0IGFzIE5vZGUpIHx8XG4gICAgICAgIG92ZXJsYXlSZWYub3ZlcmxheUVsZW1lbnQuY29udGFpbnMob3JpZ2luIGFzIE5vZGUpXG4gICAgICApIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIG92ZXJsYXlSZWYuX291dHNpZGVQb2ludGVyRXZlbnRzLm5leHQoZXZlbnQpO1xuICAgIH1cbiAgfTtcbn1cbiJdfQ==