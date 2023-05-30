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
class OverlayOutsideClickDispatcher extends BaseOverlayDispatcher {
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: OverlayOutsideClickDispatcher, deps: [{ token: DOCUMENT }, { token: i1.Platform }, { token: i0.NgZone, optional: true }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: OverlayOutsideClickDispatcher, providedIn: 'root' }); }
}
export { OverlayOutsideClickDispatcher };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: OverlayOutsideClickDispatcher, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: i1.Platform }, { type: i0.NgZone, decorators: [{
                    type: Optional
                }] }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1vdXRzaWRlLWNsaWNrLWRpc3BhdGNoZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvZGlzcGF0Y2hlcnMvb3ZlcmxheS1vdXRzaWRlLWNsaWNrLWRpc3BhdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDbkUsT0FBTyxFQUFDLFFBQVEsRUFBRSxlQUFlLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNoRSxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQzs7O0FBR2hFOzs7O0dBSUc7QUFDSCxNQUNhLDZCQUE4QixTQUFRLHFCQUFxQjtJQUt0RSxZQUNvQixRQUFhLEVBQ3ZCLFNBQW1CO0lBQzNCLHdEQUF3RDtJQUNwQyxPQUFnQjtRQUVwQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7UUFKUixjQUFTLEdBQVQsU0FBUyxDQUFVO1FBRVAsWUFBTyxHQUFQLE9BQU8sQ0FBUztRQVA5QixzQkFBaUIsR0FBRyxLQUFLLENBQUM7UUFtRWxDLCtEQUErRDtRQUN2RCx5QkFBb0IsR0FBRyxDQUFDLEtBQW1CLEVBQUUsRUFBRTtZQUNyRCxJQUFJLENBQUMsdUJBQXVCLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3hELENBQUMsQ0FBQztRQUVGLDhFQUE4RTtRQUN0RSxtQkFBYyxHQUFHLENBQUMsS0FBaUIsRUFBRSxFQUFFO1lBQzdDLE1BQU0sTUFBTSxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN0QyxxRUFBcUU7WUFDckUsbUVBQW1FO1lBQ25FLHFDQUFxQztZQUNyQyw2RUFBNkU7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Q0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDbEUsQ0FBQzs4R0FuRVUsNkJBQTZCLGtCQU05QixRQUFRO2tIQU5QLDZCQUE2QixjQURqQixNQUFNOztTQUNsQiw2QkFBNkI7MkZBQTdCLDZCQUE2QjtrQkFEekMsVUFBVTttQkFBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7OzBCQU8zQixNQUFNOzJCQUFDLFFBQVE7OzBCQUdmLFFBQVEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7SW5qZWN0LCBJbmplY3RhYmxlLCBOZ1pvbmUsIE9wdGlvbmFsfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7UGxhdGZvcm0sIF9nZXRFdmVudFRhcmdldH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7QmFzZU92ZXJsYXlEaXNwYXRjaGVyfSBmcm9tICcuL2Jhc2Utb3ZlcmxheS1kaXNwYXRjaGVyJztcbmltcG9ydCB0eXBlIHtPdmVybGF5UmVmfSBmcm9tICcuLi9vdmVybGF5LXJlZic7XG5cbi8qKlxuICogU2VydmljZSBmb3IgZGlzcGF0Y2hpbmcgbW91c2UgY2xpY2sgZXZlbnRzIHRoYXQgbGFuZCBvbiB0aGUgYm9keSB0byBhcHByb3ByaWF0ZSBvdmVybGF5IHJlZixcbiAqIGlmIGFueS4gSXQgbWFpbnRhaW5zIGEgbGlzdCBvZiBhdHRhY2hlZCBvdmVybGF5cyB0byBkZXRlcm1pbmUgYmVzdCBzdWl0ZWQgb3ZlcmxheSBiYXNlZFxuICogb24gZXZlbnQgdGFyZ2V0IGFuZCBvcmRlciBvZiBvdmVybGF5IG9wZW5zLlxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBPdmVybGF5T3V0c2lkZUNsaWNrRGlzcGF0Y2hlciBleHRlbmRzIEJhc2VPdmVybGF5RGlzcGF0Y2hlciB7XG4gIHByaXZhdGUgX2N1cnNvck9yaWdpbmFsVmFsdWU6IHN0cmluZztcbiAgcHJpdmF0ZSBfY3Vyc29yU3R5bGVJc1NldCA9IGZhbHNlO1xuICBwcml2YXRlIF9wb2ludGVyRG93bkV2ZW50VGFyZ2V0OiBFdmVudFRhcmdldCB8IG51bGw7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgQEluamVjdChET0NVTUVOVCkgZG9jdW1lbnQ6IGFueSxcbiAgICBwcml2YXRlIF9wbGF0Zm9ybTogUGxhdGZvcm0sXG4gICAgLyoqIEBicmVha2luZy1jaGFuZ2UgMTQuMC4wIF9uZ1pvbmUgd2lsbCBiZSByZXF1aXJlZC4gKi9cbiAgICBAT3B0aW9uYWwoKSBwcml2YXRlIF9uZ1pvbmU/OiBOZ1pvbmUsXG4gICkge1xuICAgIHN1cGVyKGRvY3VtZW50KTtcbiAgfVxuXG4gIC8qKiBBZGQgYSBuZXcgb3ZlcmxheSB0byB0aGUgbGlzdCBvZiBhdHRhY2hlZCBvdmVybGF5IHJlZnMuICovXG4gIG92ZXJyaWRlIGFkZChvdmVybGF5UmVmOiBPdmVybGF5UmVmKTogdm9pZCB7XG4gICAgc3VwZXIuYWRkKG92ZXJsYXlSZWYpO1xuXG4gICAgLy8gU2FmYXJpIG9uIGlPUyBkb2VzIG5vdCBnZW5lcmF0ZSBjbGljayBldmVudHMgZm9yIG5vbi1pbnRlcmFjdGl2ZVxuICAgIC8vIGVsZW1lbnRzLiBIb3dldmVyLCB3ZSB3YW50IHRvIHJlY2VpdmUgYSBjbGljayBmb3IgYW55IGVsZW1lbnQgb3V0c2lkZVxuICAgIC8vIHRoZSBvdmVybGF5LiBXZSBjYW4gZm9yY2UgYSBcImNsaWNrYWJsZVwiIHN0YXRlIGJ5IHNldHRpbmdcbiAgICAvLyBgY3Vyc29yOiBwb2ludGVyYCBvbiB0aGUgZG9jdW1lbnQgYm9keS4gU2VlOlxuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9FbGVtZW50L2NsaWNrX2V2ZW50I1NhZmFyaV9Nb2JpbGVcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5hcHBsZS5jb20vbGlicmFyeS9hcmNoaXZlL2RvY3VtZW50YXRpb24vQXBwbGVBcHBsaWNhdGlvbnMvUmVmZXJlbmNlL1NhZmFyaVdlYkNvbnRlbnQvSGFuZGxpbmdFdmVudHMvSGFuZGxpbmdFdmVudHMuaHRtbFxuICAgIGlmICghdGhpcy5faXNBdHRhY2hlZCkge1xuICAgICAgY29uc3QgYm9keSA9IHRoaXMuX2RvY3VtZW50LmJvZHk7XG5cbiAgICAgIC8qKiBAYnJlYWtpbmctY2hhbmdlIDE0LjAuMCBfbmdab25lIHdpbGwgYmUgcmVxdWlyZWQuICovXG4gICAgICBpZiAodGhpcy5fbmdab25lKSB7XG4gICAgICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB0aGlzLl9hZGRFdmVudExpc3RlbmVycyhib2R5KSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9hZGRFdmVudExpc3RlbmVycyhib2R5KTtcbiAgICAgIH1cblxuICAgICAgLy8gY2xpY2sgZXZlbnQgaXMgbm90IGZpcmVkIG9uIGlPUy4gVG8gbWFrZSBlbGVtZW50IFwiY2xpY2thYmxlXCIgd2UgYXJlXG4gICAgICAvLyBzZXR0aW5nIHRoZSBjdXJzb3IgdG8gcG9pbnRlclxuICAgICAgaWYgKHRoaXMuX3BsYXRmb3JtLklPUyAmJiAhdGhpcy5fY3Vyc29yU3R5bGVJc1NldCkge1xuICAgICAgICB0aGlzLl9jdXJzb3JPcmlnaW5hbFZhbHVlID0gYm9keS5zdHlsZS5jdXJzb3I7XG4gICAgICAgIGJvZHkuc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgICAgICB0aGlzLl9jdXJzb3JTdHlsZUlzU2V0ID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5faXNBdHRhY2hlZCA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgLyoqIERldGFjaGVzIHRoZSBnbG9iYWwga2V5Ym9hcmQgZXZlbnQgbGlzdGVuZXIuICovXG4gIHByb3RlY3RlZCBkZXRhY2goKSB7XG4gICAgaWYgKHRoaXMuX2lzQXR0YWNoZWQpIHtcbiAgICAgIGNvbnN0IGJvZHkgPSB0aGlzLl9kb2N1bWVudC5ib2R5O1xuICAgICAgYm9keS5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIHRoaXMuX3BvaW50ZXJEb3duTGlzdGVuZXIsIHRydWUpO1xuICAgICAgYm9keS5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuX2NsaWNrTGlzdGVuZXIsIHRydWUpO1xuICAgICAgYm9keS5yZW1vdmVFdmVudExpc3RlbmVyKCdhdXhjbGljaycsIHRoaXMuX2NsaWNrTGlzdGVuZXIsIHRydWUpO1xuICAgICAgYm9keS5yZW1vdmVFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIHRoaXMuX2NsaWNrTGlzdGVuZXIsIHRydWUpO1xuICAgICAgaWYgKHRoaXMuX3BsYXRmb3JtLklPUyAmJiB0aGlzLl9jdXJzb3JTdHlsZUlzU2V0KSB7XG4gICAgICAgIGJvZHkuc3R5bGUuY3Vyc29yID0gdGhpcy5fY3Vyc29yT3JpZ2luYWxWYWx1ZTtcbiAgICAgICAgdGhpcy5fY3Vyc29yU3R5bGVJc1NldCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgdGhpcy5faXNBdHRhY2hlZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2FkZEV2ZW50TGlzdGVuZXJzKGJvZHk6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIHRoaXMuX3BvaW50ZXJEb3duTGlzdGVuZXIsIHRydWUpO1xuICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLl9jbGlja0xpc3RlbmVyLCB0cnVlKTtcbiAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2F1eGNsaWNrJywgdGhpcy5fY2xpY2tMaXN0ZW5lciwgdHJ1ZSk7XG4gICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIHRoaXMuX2NsaWNrTGlzdGVuZXIsIHRydWUpO1xuICB9XG5cbiAgLyoqIFN0b3JlIHBvaW50ZXJkb3duIGV2ZW50IHRhcmdldCB0byB0cmFjayBvcmlnaW4gb2YgY2xpY2suICovXG4gIHByaXZhdGUgX3BvaW50ZXJEb3duTGlzdGVuZXIgPSAoZXZlbnQ6IFBvaW50ZXJFdmVudCkgPT4ge1xuICAgIHRoaXMuX3BvaW50ZXJEb3duRXZlbnRUYXJnZXQgPSBfZ2V0RXZlbnRUYXJnZXQoZXZlbnQpO1xuICB9O1xuXG4gIC8qKiBDbGljayBldmVudCBsaXN0ZW5lciB0aGF0IHdpbGwgYmUgYXR0YWNoZWQgdG8gdGhlIGJvZHkgcHJvcGFnYXRlIHBoYXNlLiAqL1xuICBwcml2YXRlIF9jbGlja0xpc3RlbmVyID0gKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgY29uc3QgdGFyZ2V0ID0gX2dldEV2ZW50VGFyZ2V0KGV2ZW50KTtcbiAgICAvLyBJbiBjYXNlIG9mIGEgY2xpY2sgZXZlbnQsIHdlIHdhbnQgdG8gY2hlY2sgdGhlIG9yaWdpbiBvZiB0aGUgY2xpY2tcbiAgICAvLyAoZS5nLiBpbiBjYXNlIHdoZXJlIGEgdXNlciBzdGFydHMgYSBjbGljayBpbnNpZGUgdGhlIG92ZXJsYXkgYW5kXG4gICAgLy8gcmVsZWFzZXMgdGhlIGNsaWNrIG91dHNpZGUgb2YgaXQpLlxuICAgIC8vIFRoaXMgaXMgZG9uZSBieSB1c2luZyB0aGUgZXZlbnQgdGFyZ2V0IG9mIHRoZSBwcmVjZWRpbmcgcG9pbnRlcmRvd24gZXZlbnQuXG4gICAgLy8gRXZlcnkgY2xpY2sgZXZlbnQgY2F1c2VkIGJ5IGEgcG9pbnRlciBkZXZpY2UgaGFzIGEgcHJlY2VkaW5nIHBvaW50ZXJkb3duXG4gICAgLy8gZXZlbnQsIHVubGVzcyB0aGUgY2xpY2sgd2FzIHByb2dyYW1tYXRpY2FsbHkgdHJpZ2dlcmVkIChlLmcuIGluIGEgdW5pdCB0ZXN0KS5cbiAgICBjb25zdCBvcmlnaW4gPVxuICAgICAgZXZlbnQudHlwZSA9PT0gJ2NsaWNrJyAmJiB0aGlzLl9wb2ludGVyRG93bkV2ZW50VGFyZ2V0XG4gICAgICAgID8gdGhpcy5fcG9pbnRlckRvd25FdmVudFRhcmdldFxuICAgICAgICA6IHRhcmdldDtcbiAgICAvLyBSZXNldCB0aGUgc3RvcmVkIHBvaW50ZXJkb3duIGV2ZW50IHRhcmdldCwgdG8gYXZvaWQgaGF2aW5nIGl0IGludGVyZmVyZVxuICAgIC8vIGluIHN1YnNlcXVlbnQgZXZlbnRzLlxuICAgIHRoaXMuX3BvaW50ZXJEb3duRXZlbnRUYXJnZXQgPSBudWxsO1xuXG4gICAgLy8gV2UgY29weSB0aGUgYXJyYXkgYmVjYXVzZSB0aGUgb3JpZ2luYWwgbWF5IGJlIG1vZGlmaWVkIGFzeW5jaHJvbm91c2x5IGlmIHRoZVxuICAgIC8vIG91dHNpZGVQb2ludGVyRXZlbnRzIGxpc3RlbmVyIGRlY2lkZXMgdG8gZGV0YWNoIG92ZXJsYXlzIHJlc3VsdGluZyBpbiBpbmRleCBlcnJvcnMgaW5zaWRlXG4gICAgLy8gdGhlIGZvciBsb29wLlxuICAgIGNvbnN0IG92ZXJsYXlzID0gdGhpcy5fYXR0YWNoZWRPdmVybGF5cy5zbGljZSgpO1xuXG4gICAgLy8gRGlzcGF0Y2ggdGhlIG1vdXNlIGV2ZW50IHRvIHRoZSB0b3Agb3ZlcmxheSB3aGljaCBoYXMgc3Vic2NyaWJlcnMgdG8gaXRzIG1vdXNlIGV2ZW50cy5cbiAgICAvLyBXZSB3YW50IHRvIHRhcmdldCBhbGwgb3ZlcmxheXMgZm9yIHdoaWNoIHRoZSBjbGljayBjb3VsZCBiZSBjb25zaWRlcmVkIGFzIG91dHNpZGUgY2xpY2suXG4gICAgLy8gQXMgc29vbiBhcyB3ZSByZWFjaCBhbiBvdmVybGF5IGZvciB3aGljaCB0aGUgY2xpY2sgaXMgbm90IG91dHNpZGUgY2xpY2sgd2UgYnJlYWsgb2ZmXG4gICAgLy8gdGhlIGxvb3AuXG4gICAgZm9yIChsZXQgaSA9IG92ZXJsYXlzLmxlbmd0aCAtIDE7IGkgPiAtMTsgaS0tKSB7XG4gICAgICBjb25zdCBvdmVybGF5UmVmID0gb3ZlcmxheXNbaV07XG4gICAgICBpZiAob3ZlcmxheVJlZi5fb3V0c2lkZVBvaW50ZXJFdmVudHMub2JzZXJ2ZXJzLmxlbmd0aCA8IDEgfHwgIW92ZXJsYXlSZWYuaGFzQXR0YWNoZWQoKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgaXQncyBhIGNsaWNrIGluc2lkZSB0aGUgb3ZlcmxheSwganVzdCBicmVhayAtIHdlIHNob3VsZCBkbyBub3RoaW5nXG4gICAgICAvLyBJZiBpdCdzIGFuIG91dHNpZGUgY2xpY2sgKGJvdGggb3JpZ2luIGFuZCB0YXJnZXQgb2YgdGhlIGNsaWNrKSBkaXNwYXRjaCB0aGUgbW91c2UgZXZlbnQsXG4gICAgICAvLyBhbmQgcHJvY2VlZCB3aXRoIHRoZSBuZXh0IG92ZXJsYXlcbiAgICAgIGlmIChcbiAgICAgICAgb3ZlcmxheVJlZi5vdmVybGF5RWxlbWVudC5jb250YWlucyh0YXJnZXQgYXMgTm9kZSkgfHxcbiAgICAgICAgb3ZlcmxheVJlZi5vdmVybGF5RWxlbWVudC5jb250YWlucyhvcmlnaW4gYXMgTm9kZSlcbiAgICAgICkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY29uc3Qgb3V0c2lkZVBvaW50ZXJFdmVudHMgPSBvdmVybGF5UmVmLl9vdXRzaWRlUG9pbnRlckV2ZW50cztcbiAgICAgIC8qKiBAYnJlYWtpbmctY2hhbmdlIDE0LjAuMCBfbmdab25lIHdpbGwgYmUgcmVxdWlyZWQuICovXG4gICAgICBpZiAodGhpcy5fbmdab25lKSB7XG4gICAgICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4gb3V0c2lkZVBvaW50ZXJFdmVudHMubmV4dChldmVudCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3V0c2lkZVBvaW50ZXJFdmVudHMubmV4dChldmVudCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xufVxuIl19