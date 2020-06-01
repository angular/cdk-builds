/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, Optional, SkipSelf, } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
/**
 * Service for dispatching keyboard events that land on the body to appropriate overlay ref,
 * if any. It maintains a list of attached overlays to determine best suited overlay based
 * on event target and order of overlay opens.
 */
let OverlayKeyboardDispatcher = /** @class */ (() => {
    class OverlayKeyboardDispatcher {
        constructor(document) {
            /** Currently attached overlays in the order they were attached. */
            this._attachedOverlays = [];
            /** Keyboard event listener that will be attached to the body. */
            this._keydownListener = (event) => {
                const overlays = this._attachedOverlays;
                for (let i = overlays.length - 1; i > -1; i--) {
                    // Dispatch the keydown event to the top overlay which has subscribers to its keydown events.
                    // We want to target the most recent overlay, rather than trying to match where the event came
                    // from, because some components might open an overlay, but keep focus on a trigger element
                    // (e.g. for select and autocomplete). We skip overlays without keydown event subscriptions,
                    // because we don't want overlays that don't handle keyboard events to block the ones below
                    // them that do.
                    if (overlays[i]._keydownEvents.observers.length > 0) {
                        overlays[i]._keydownEvents.next(event);
                        break;
                    }
                }
            };
            this._document = document;
        }
        ngOnDestroy() {
            this._detach();
        }
        /** Add a new overlay to the list of attached overlay refs. */
        add(overlayRef) {
            // Ensure that we don't get the same overlay multiple times.
            this.remove(overlayRef);
            // Lazily start dispatcher once first overlay is added
            if (!this._isAttached) {
                this._document.body.addEventListener('keydown', this._keydownListener);
                this._isAttached = true;
            }
            this._attachedOverlays.push(overlayRef);
        }
        /** Remove an overlay from the list of attached overlay refs. */
        remove(overlayRef) {
            const index = this._attachedOverlays.indexOf(overlayRef);
            if (index > -1) {
                this._attachedOverlays.splice(index, 1);
            }
            // Remove the global listener once there are no more overlays.
            if (this._attachedOverlays.length === 0) {
                this._detach();
            }
        }
        /** Detaches the global keyboard event listener. */
        _detach() {
            if (this._isAttached) {
                this._document.body.removeEventListener('keydown', this._keydownListener);
                this._isAttached = false;
            }
        }
    }
    OverlayKeyboardDispatcher.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    /** @nocollapse */
    OverlayKeyboardDispatcher.ctorParameters = () => [
        { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] }
    ];
    OverlayKeyboardDispatcher.ɵprov = i0.ɵɵdefineInjectable({ factory: function OverlayKeyboardDispatcher_Factory() { return new OverlayKeyboardDispatcher(i0.ɵɵinject(i1.DOCUMENT)); }, token: OverlayKeyboardDispatcher, providedIn: "root" });
    return OverlayKeyboardDispatcher;
})();
export { OverlayKeyboardDispatcher };
/** @docs-private @deprecated @breaking-change 8.0.0 */
export function OVERLAY_KEYBOARD_DISPATCHER_PROVIDER_FACTORY(dispatcher, _document) {
    return dispatcher || new OverlayKeyboardDispatcher(_document);
}
/** @docs-private @deprecated @breaking-change 8.0.0 */
export const OVERLAY_KEYBOARD_DISPATCHER_PROVIDER = {
    // If there is already an OverlayKeyboardDispatcher available, use that.
    // Otherwise, provide a new one.
    provide: OverlayKeyboardDispatcher,
    deps: [
        [new Optional(), new SkipSelf(), OverlayKeyboardDispatcher],
        // Coerce to `InjectionToken` so that the `deps` match the "shape"
        // of the type expected by Angular
        DOCUMENT
    ],
    useFactory: OVERLAY_KEYBOARD_DISPATCHER_PROVIDER_FACTORY
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1rZXlib2FyZC1kaXNwYXRjaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vdmVybGF5L2tleWJvYXJkL292ZXJsYXkta2V5Ym9hcmQtZGlzcGF0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUNMLE1BQU0sRUFDTixVQUFVLEVBR1YsUUFBUSxFQUNSLFFBQVEsR0FDVCxNQUFNLGVBQWUsQ0FBQzs7O0FBSXZCOzs7O0dBSUc7QUFDSDtJQUFBLE1BQ2EseUJBQXlCO1FBUXBDLFlBQThCLFFBQWE7WUFOM0MsbUVBQW1FO1lBQ25FLHNCQUFpQixHQUFpQixFQUFFLENBQUM7WUFpRHJDLGlFQUFpRTtZQUN6RCxxQkFBZ0IsR0FBRyxDQUFDLEtBQW9CLEVBQUUsRUFBRTtnQkFDbEQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDO2dCQUV4QyxLQUFLLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDN0MsNkZBQTZGO29CQUM3Riw4RkFBOEY7b0JBQzlGLDJGQUEyRjtvQkFDM0YsNEZBQTRGO29CQUM1RiwyRkFBMkY7b0JBQzNGLGdCQUFnQjtvQkFDaEIsSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO3dCQUNuRCxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDdkMsTUFBTTtxQkFDUDtpQkFDRjtZQUNILENBQUMsQ0FBQTtZQTNEQyxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztRQUM1QixDQUFDO1FBRUQsV0FBVztZQUNULElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDO1FBRUQsOERBQThEO1FBQzlELEdBQUcsQ0FBQyxVQUFzQjtZQUN4Qiw0REFBNEQ7WUFDNUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUV4QixzREFBc0Q7WUFDdEQsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUU7Z0JBQ3JCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztnQkFDdkUsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7YUFDekI7WUFFRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzFDLENBQUM7UUFFRCxnRUFBZ0U7UUFDaEUsTUFBTSxDQUFDLFVBQXNCO1lBQzNCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFekQsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2QsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDekM7WUFFRCw4REFBOEQ7WUFDOUQsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDdkMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQ2hCO1FBQ0gsQ0FBQztRQUVELG1EQUFtRDtRQUMzQyxPQUFPO1lBQ2IsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO2dCQUNwQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7Z0JBQzFFLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO2FBQzFCO1FBQ0gsQ0FBQzs7O2dCQW5ERixVQUFVLFNBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzs7O2dEQVNqQixNQUFNLFNBQUMsUUFBUTs7O29DQWxDOUI7S0ErRkM7U0FyRVkseUJBQXlCO0FBd0V0Qyx1REFBdUQ7QUFDdkQsTUFBTSxVQUFVLDRDQUE0QyxDQUN4RCxVQUFxQyxFQUFFLFNBQWM7SUFDdkQsT0FBTyxVQUFVLElBQUksSUFBSSx5QkFBeUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNoRSxDQUFDO0FBRUQsdURBQXVEO0FBQ3ZELE1BQU0sQ0FBQyxNQUFNLG9DQUFvQyxHQUFHO0lBQ2xELHdFQUF3RTtJQUN4RSxnQ0FBZ0M7SUFDaEMsT0FBTyxFQUFFLHlCQUF5QjtJQUNsQyxJQUFJLEVBQUU7UUFDSixDQUFDLElBQUksUUFBUSxFQUFFLEVBQUUsSUFBSSxRQUFRLEVBQUUsRUFBRSx5QkFBeUIsQ0FBQztRQUUzRCxrRUFBa0U7UUFDbEUsa0NBQWtDO1FBQ2xDLFFBQStCO0tBQ2hDO0lBQ0QsVUFBVSxFQUFFLDRDQUE0QztDQUN6RCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge1xuICBJbmplY3QsXG4gIEluamVjdGFibGUsXG4gIEluamVjdGlvblRva2VuLFxuICBPbkRlc3Ryb3ksXG4gIE9wdGlvbmFsLFxuICBTa2lwU2VsZixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge092ZXJsYXlSZWZ9IGZyb20gJy4uL292ZXJsYXktcmVmJztcblxuXG4vKipcbiAqIFNlcnZpY2UgZm9yIGRpc3BhdGNoaW5nIGtleWJvYXJkIGV2ZW50cyB0aGF0IGxhbmQgb24gdGhlIGJvZHkgdG8gYXBwcm9wcmlhdGUgb3ZlcmxheSByZWYsXG4gKiBpZiBhbnkuIEl0IG1haW50YWlucyBhIGxpc3Qgb2YgYXR0YWNoZWQgb3ZlcmxheXMgdG8gZGV0ZXJtaW5lIGJlc3Qgc3VpdGVkIG92ZXJsYXkgYmFzZWRcbiAqIG9uIGV2ZW50IHRhcmdldCBhbmQgb3JkZXIgb2Ygb3ZlcmxheSBvcGVucy5cbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgT3ZlcmxheUtleWJvYXJkRGlzcGF0Y2hlciBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG5cbiAgLyoqIEN1cnJlbnRseSBhdHRhY2hlZCBvdmVybGF5cyBpbiB0aGUgb3JkZXIgdGhleSB3ZXJlIGF0dGFjaGVkLiAqL1xuICBfYXR0YWNoZWRPdmVybGF5czogT3ZlcmxheVJlZltdID0gW107XG5cbiAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50O1xuICBwcml2YXRlIF9pc0F0dGFjaGVkOiBib29sZWFuO1xuXG4gIGNvbnN0cnVjdG9yKEBJbmplY3QoRE9DVU1FTlQpIGRvY3VtZW50OiBhbnkpIHtcbiAgICB0aGlzLl9kb2N1bWVudCA9IGRvY3VtZW50O1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fZGV0YWNoKCk7XG4gIH1cblxuICAvKiogQWRkIGEgbmV3IG92ZXJsYXkgdG8gdGhlIGxpc3Qgb2YgYXR0YWNoZWQgb3ZlcmxheSByZWZzLiAqL1xuICBhZGQob3ZlcmxheVJlZjogT3ZlcmxheVJlZik6IHZvaWQge1xuICAgIC8vIEVuc3VyZSB0aGF0IHdlIGRvbid0IGdldCB0aGUgc2FtZSBvdmVybGF5IG11bHRpcGxlIHRpbWVzLlxuICAgIHRoaXMucmVtb3ZlKG92ZXJsYXlSZWYpO1xuXG4gICAgLy8gTGF6aWx5IHN0YXJ0IGRpc3BhdGNoZXIgb25jZSBmaXJzdCBvdmVybGF5IGlzIGFkZGVkXG4gICAgaWYgKCF0aGlzLl9pc0F0dGFjaGVkKSB7XG4gICAgICB0aGlzLl9kb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9rZXlkb3duTGlzdGVuZXIpO1xuICAgICAgdGhpcy5faXNBdHRhY2hlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgdGhpcy5fYXR0YWNoZWRPdmVybGF5cy5wdXNoKG92ZXJsYXlSZWYpO1xuICB9XG5cbiAgLyoqIFJlbW92ZSBhbiBvdmVybGF5IGZyb20gdGhlIGxpc3Qgb2YgYXR0YWNoZWQgb3ZlcmxheSByZWZzLiAqL1xuICByZW1vdmUob3ZlcmxheVJlZjogT3ZlcmxheVJlZik6IHZvaWQge1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5fYXR0YWNoZWRPdmVybGF5cy5pbmRleE9mKG92ZXJsYXlSZWYpO1xuXG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMuX2F0dGFjaGVkT3ZlcmxheXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG5cbiAgICAvLyBSZW1vdmUgdGhlIGdsb2JhbCBsaXN0ZW5lciBvbmNlIHRoZXJlIGFyZSBubyBtb3JlIG92ZXJsYXlzLlxuICAgIGlmICh0aGlzLl9hdHRhY2hlZE92ZXJsYXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhpcy5fZGV0YWNoKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIERldGFjaGVzIHRoZSBnbG9iYWwga2V5Ym9hcmQgZXZlbnQgbGlzdGVuZXIuICovXG4gIHByaXZhdGUgX2RldGFjaCgpIHtcbiAgICBpZiAodGhpcy5faXNBdHRhY2hlZCkge1xuICAgICAgdGhpcy5fZG9jdW1lbnQuYm9keS5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fa2V5ZG93bkxpc3RlbmVyKTtcbiAgICAgIHRoaXMuX2lzQXR0YWNoZWQgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvKiogS2V5Ym9hcmQgZXZlbnQgbGlzdGVuZXIgdGhhdCB3aWxsIGJlIGF0dGFjaGVkIHRvIHRoZSBib2R5LiAqL1xuICBwcml2YXRlIF9rZXlkb3duTGlzdGVuZXIgPSAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHtcbiAgICBjb25zdCBvdmVybGF5cyA9IHRoaXMuX2F0dGFjaGVkT3ZlcmxheXM7XG5cbiAgICBmb3IgKGxldCBpID0gb3ZlcmxheXMubGVuZ3RoIC0gMTsgaSA+IC0xOyBpLS0pIHtcbiAgICAgIC8vIERpc3BhdGNoIHRoZSBrZXlkb3duIGV2ZW50IHRvIHRoZSB0b3Agb3ZlcmxheSB3aGljaCBoYXMgc3Vic2NyaWJlcnMgdG8gaXRzIGtleWRvd24gZXZlbnRzLlxuICAgICAgLy8gV2Ugd2FudCB0byB0YXJnZXQgdGhlIG1vc3QgcmVjZW50IG92ZXJsYXksIHJhdGhlciB0aGFuIHRyeWluZyB0byBtYXRjaCB3aGVyZSB0aGUgZXZlbnQgY2FtZVxuICAgICAgLy8gZnJvbSwgYmVjYXVzZSBzb21lIGNvbXBvbmVudHMgbWlnaHQgb3BlbiBhbiBvdmVybGF5LCBidXQga2VlcCBmb2N1cyBvbiBhIHRyaWdnZXIgZWxlbWVudFxuICAgICAgLy8gKGUuZy4gZm9yIHNlbGVjdCBhbmQgYXV0b2NvbXBsZXRlKS4gV2Ugc2tpcCBvdmVybGF5cyB3aXRob3V0IGtleWRvd24gZXZlbnQgc3Vic2NyaXB0aW9ucyxcbiAgICAgIC8vIGJlY2F1c2Ugd2UgZG9uJ3Qgd2FudCBvdmVybGF5cyB0aGF0IGRvbid0IGhhbmRsZSBrZXlib2FyZCBldmVudHMgdG8gYmxvY2sgdGhlIG9uZXMgYmVsb3dcbiAgICAgIC8vIHRoZW0gdGhhdCBkby5cbiAgICAgIGlmIChvdmVybGF5c1tpXS5fa2V5ZG93bkV2ZW50cy5vYnNlcnZlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICBvdmVybGF5c1tpXS5fa2V5ZG93bkV2ZW50cy5uZXh0KGV2ZW50KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cblxuLyoqIEBkb2NzLXByaXZhdGUgQGRlcHJlY2F0ZWQgQGJyZWFraW5nLWNoYW5nZSA4LjAuMCAqL1xuZXhwb3J0IGZ1bmN0aW9uIE9WRVJMQVlfS0VZQk9BUkRfRElTUEFUQ0hFUl9QUk9WSURFUl9GQUNUT1JZKFxuICAgIGRpc3BhdGNoZXI6IE92ZXJsYXlLZXlib2FyZERpc3BhdGNoZXIsIF9kb2N1bWVudDogYW55KSB7XG4gIHJldHVybiBkaXNwYXRjaGVyIHx8IG5ldyBPdmVybGF5S2V5Ym9hcmREaXNwYXRjaGVyKF9kb2N1bWVudCk7XG59XG5cbi8qKiBAZG9jcy1wcml2YXRlIEBkZXByZWNhdGVkIEBicmVha2luZy1jaGFuZ2UgOC4wLjAgKi9cbmV4cG9ydCBjb25zdCBPVkVSTEFZX0tFWUJPQVJEX0RJU1BBVENIRVJfUFJPVklERVIgPSB7XG4gIC8vIElmIHRoZXJlIGlzIGFscmVhZHkgYW4gT3ZlcmxheUtleWJvYXJkRGlzcGF0Y2hlciBhdmFpbGFibGUsIHVzZSB0aGF0LlxuICAvLyBPdGhlcndpc2UsIHByb3ZpZGUgYSBuZXcgb25lLlxuICBwcm92aWRlOiBPdmVybGF5S2V5Ym9hcmREaXNwYXRjaGVyLFxuICBkZXBzOiBbXG4gICAgW25ldyBPcHRpb25hbCgpLCBuZXcgU2tpcFNlbGYoKSwgT3ZlcmxheUtleWJvYXJkRGlzcGF0Y2hlcl0sXG5cbiAgICAvLyBDb2VyY2UgdG8gYEluamVjdGlvblRva2VuYCBzbyB0aGF0IHRoZSBgZGVwc2AgbWF0Y2ggdGhlIFwic2hhcGVcIlxuICAgIC8vIG9mIHRoZSB0eXBlIGV4cGVjdGVkIGJ5IEFuZ3VsYXJcbiAgICBET0NVTUVOVCBhcyBJbmplY3Rpb25Ub2tlbjxhbnk+XG4gIF0sXG4gIHVzZUZhY3Rvcnk6IE9WRVJMQVlfS0VZQk9BUkRfRElTUEFUQ0hFUl9QUk9WSURFUl9GQUNUT1JZXG59O1xuIl19