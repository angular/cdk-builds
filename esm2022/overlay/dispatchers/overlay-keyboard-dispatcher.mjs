/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, NgZone, Optional } from '@angular/core';
import { BaseOverlayDispatcher } from './base-overlay-dispatcher';
import * as i0 from "@angular/core";
/**
 * Service for dispatching keyboard events that land on the body to appropriate overlay ref,
 * if any. It maintains a list of attached overlays to determine best suited overlay based
 * on event target and order of overlay opens.
 */
class OverlayKeyboardDispatcher extends BaseOverlayDispatcher {
    constructor(document, 
    /** @breaking-change 14.0.0 _ngZone will be required. */
    _ngZone) {
        super(document);
        this._ngZone = _ngZone;
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
                    const keydownEvents = overlays[i]._keydownEvents;
                    /** @breaking-change 14.0.0 _ngZone will be required. */
                    if (this._ngZone) {
                        this._ngZone.run(() => keydownEvents.next(event));
                    }
                    else {
                        keydownEvents.next(event);
                    }
                    break;
                }
            }
        };
    }
    /** Add a new overlay to the list of attached overlay refs. */
    add(overlayRef) {
        super.add(overlayRef);
        // Lazily start dispatcher once first overlay is added
        if (!this._isAttached) {
            /** @breaking-change 14.0.0 _ngZone will be required. */
            if (this._ngZone) {
                this._ngZone.runOutsideAngular(() => this._document.body.addEventListener('keydown', this._keydownListener));
            }
            else {
                this._document.body.addEventListener('keydown', this._keydownListener);
            }
            this._isAttached = true;
        }
    }
    /** Detaches the global keyboard event listener. */
    detach() {
        if (this._isAttached) {
            this._document.body.removeEventListener('keydown', this._keydownListener);
            this._isAttached = false;
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: OverlayKeyboardDispatcher, deps: [{ token: DOCUMENT }, { token: i0.NgZone, optional: true }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: OverlayKeyboardDispatcher, providedIn: 'root' }); }
}
export { OverlayKeyboardDispatcher };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: OverlayKeyboardDispatcher, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: i0.NgZone, decorators: [{
                    type: Optional
                }] }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1rZXlib2FyZC1kaXNwYXRjaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vdmVybGF5L2Rpc3BhdGNoZXJzL292ZXJsYXkta2V5Ym9hcmQtZGlzcGF0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUVuRSxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQzs7QUFFaEU7Ozs7R0FJRztBQUNILE1BQ2EseUJBQTBCLFNBQVEscUJBQXFCO0lBQ2xFLFlBQ29CLFFBQWE7SUFDL0Isd0RBQXdEO0lBQ3BDLE9BQWdCO1FBRXBDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUZJLFlBQU8sR0FBUCxPQUFPLENBQVM7UUErQnRDLGlFQUFpRTtRQUN6RCxxQkFBZ0IsR0FBRyxDQUFDLEtBQW9CLEVBQUUsRUFBRTtZQUNsRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUM7WUFFeEMsS0FBSyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzdDLDZGQUE2RjtnQkFDN0YsOEZBQThGO2dCQUM5RiwyRkFBMkY7Z0JBQzNGLDRGQUE0RjtnQkFDNUYsMkZBQTJGO2dCQUMzRixnQkFBZ0I7Z0JBQ2hCLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtvQkFDbkQsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQztvQkFDakQsd0RBQXdEO29CQUN4RCxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7d0JBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztxQkFDbkQ7eUJBQU07d0JBQ0wsYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztxQkFDM0I7b0JBQ0QsTUFBTTtpQkFDUDthQUNGO1FBQ0gsQ0FBQyxDQUFDO0lBbERGLENBQUM7SUFFRCw4REFBOEQ7SUFDckQsR0FBRyxDQUFDLFVBQTRCO1FBQ3ZDLEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFdEIsc0RBQXNEO1FBQ3RELElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ3JCLHdEQUF3RDtZQUN4RCxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7Z0JBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFLENBQ2xDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FDdkUsQ0FBQzthQUNIO2lCQUFNO2dCQUNMLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzthQUN4RTtZQUNELElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1NBQ3pCO0lBQ0gsQ0FBQztJQUVELG1EQUFtRDtJQUN6QyxNQUFNO1FBQ2QsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ3BCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUMxRSxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztTQUMxQjtJQUNILENBQUM7OEdBakNVLHlCQUF5QixrQkFFMUIsUUFBUTtrSEFGUCx5QkFBeUIsY0FEYixNQUFNOztTQUNsQix5QkFBeUI7MkZBQXpCLHlCQUF5QjtrQkFEckMsVUFBVTttQkFBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7OzBCQUczQixNQUFNOzJCQUFDLFFBQVE7OzBCQUVmLFFBQVEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7SW5qZWN0LCBJbmplY3RhYmxlLCBOZ1pvbmUsIE9wdGlvbmFsfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T3ZlcmxheVJlZmVyZW5jZX0gZnJvbSAnLi4vb3ZlcmxheS1yZWZlcmVuY2UnO1xuaW1wb3J0IHtCYXNlT3ZlcmxheURpc3BhdGNoZXJ9IGZyb20gJy4vYmFzZS1vdmVybGF5LWRpc3BhdGNoZXInO1xuXG4vKipcbiAqIFNlcnZpY2UgZm9yIGRpc3BhdGNoaW5nIGtleWJvYXJkIGV2ZW50cyB0aGF0IGxhbmQgb24gdGhlIGJvZHkgdG8gYXBwcm9wcmlhdGUgb3ZlcmxheSByZWYsXG4gKiBpZiBhbnkuIEl0IG1haW50YWlucyBhIGxpc3Qgb2YgYXR0YWNoZWQgb3ZlcmxheXMgdG8gZGV0ZXJtaW5lIGJlc3Qgc3VpdGVkIG92ZXJsYXkgYmFzZWRcbiAqIG9uIGV2ZW50IHRhcmdldCBhbmQgb3JkZXIgb2Ygb3ZlcmxheSBvcGVucy5cbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgT3ZlcmxheUtleWJvYXJkRGlzcGF0Y2hlciBleHRlbmRzIEJhc2VPdmVybGF5RGlzcGF0Y2hlciB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIEBJbmplY3QoRE9DVU1FTlQpIGRvY3VtZW50OiBhbnksXG4gICAgLyoqIEBicmVha2luZy1jaGFuZ2UgMTQuMC4wIF9uZ1pvbmUgd2lsbCBiZSByZXF1aXJlZC4gKi9cbiAgICBAT3B0aW9uYWwoKSBwcml2YXRlIF9uZ1pvbmU/OiBOZ1pvbmUsXG4gICkge1xuICAgIHN1cGVyKGRvY3VtZW50KTtcbiAgfVxuXG4gIC8qKiBBZGQgYSBuZXcgb3ZlcmxheSB0byB0aGUgbGlzdCBvZiBhdHRhY2hlZCBvdmVybGF5IHJlZnMuICovXG4gIG92ZXJyaWRlIGFkZChvdmVybGF5UmVmOiBPdmVybGF5UmVmZXJlbmNlKTogdm9pZCB7XG4gICAgc3VwZXIuYWRkKG92ZXJsYXlSZWYpO1xuXG4gICAgLy8gTGF6aWx5IHN0YXJ0IGRpc3BhdGNoZXIgb25jZSBmaXJzdCBvdmVybGF5IGlzIGFkZGVkXG4gICAgaWYgKCF0aGlzLl9pc0F0dGFjaGVkKSB7XG4gICAgICAvKiogQGJyZWFraW5nLWNoYW5nZSAxNC4wLjAgX25nWm9uZSB3aWxsIGJlIHJlcXVpcmVkLiAqL1xuICAgICAgaWYgKHRoaXMuX25nWm9uZSkge1xuICAgICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT5cbiAgICAgICAgICB0aGlzLl9kb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9rZXlkb3duTGlzdGVuZXIpLFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fa2V5ZG93bkxpc3RlbmVyKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2lzQXR0YWNoZWQgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBEZXRhY2hlcyB0aGUgZ2xvYmFsIGtleWJvYXJkIGV2ZW50IGxpc3RlbmVyLiAqL1xuICBwcm90ZWN0ZWQgZGV0YWNoKCkge1xuICAgIGlmICh0aGlzLl9pc0F0dGFjaGVkKSB7XG4gICAgICB0aGlzLl9kb2N1bWVudC5ib2R5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9rZXlkb3duTGlzdGVuZXIpO1xuICAgICAgdGhpcy5faXNBdHRhY2hlZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBLZXlib2FyZCBldmVudCBsaXN0ZW5lciB0aGF0IHdpbGwgYmUgYXR0YWNoZWQgdG8gdGhlIGJvZHkuICovXG4gIHByaXZhdGUgX2tleWRvd25MaXN0ZW5lciA9IChldmVudDogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICAgIGNvbnN0IG92ZXJsYXlzID0gdGhpcy5fYXR0YWNoZWRPdmVybGF5cztcblxuICAgIGZvciAobGV0IGkgPSBvdmVybGF5cy5sZW5ndGggLSAxOyBpID4gLTE7IGktLSkge1xuICAgICAgLy8gRGlzcGF0Y2ggdGhlIGtleWRvd24gZXZlbnQgdG8gdGhlIHRvcCBvdmVybGF5IHdoaWNoIGhhcyBzdWJzY3JpYmVycyB0byBpdHMga2V5ZG93biBldmVudHMuXG4gICAgICAvLyBXZSB3YW50IHRvIHRhcmdldCB0aGUgbW9zdCByZWNlbnQgb3ZlcmxheSwgcmF0aGVyIHRoYW4gdHJ5aW5nIHRvIG1hdGNoIHdoZXJlIHRoZSBldmVudCBjYW1lXG4gICAgICAvLyBmcm9tLCBiZWNhdXNlIHNvbWUgY29tcG9uZW50cyBtaWdodCBvcGVuIGFuIG92ZXJsYXksIGJ1dCBrZWVwIGZvY3VzIG9uIGEgdHJpZ2dlciBlbGVtZW50XG4gICAgICAvLyAoZS5nLiBmb3Igc2VsZWN0IGFuZCBhdXRvY29tcGxldGUpLiBXZSBza2lwIG92ZXJsYXlzIHdpdGhvdXQga2V5ZG93biBldmVudCBzdWJzY3JpcHRpb25zLFxuICAgICAgLy8gYmVjYXVzZSB3ZSBkb24ndCB3YW50IG92ZXJsYXlzIHRoYXQgZG9uJ3QgaGFuZGxlIGtleWJvYXJkIGV2ZW50cyB0byBibG9jayB0aGUgb25lcyBiZWxvd1xuICAgICAgLy8gdGhlbSB0aGF0IGRvLlxuICAgICAgaWYgKG92ZXJsYXlzW2ldLl9rZXlkb3duRXZlbnRzLm9ic2VydmVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IGtleWRvd25FdmVudHMgPSBvdmVybGF5c1tpXS5fa2V5ZG93bkV2ZW50cztcbiAgICAgICAgLyoqIEBicmVha2luZy1jaGFuZ2UgMTQuMC4wIF9uZ1pvbmUgd2lsbCBiZSByZXF1aXJlZC4gKi9cbiAgICAgICAgaWYgKHRoaXMuX25nWm9uZSkge1xuICAgICAgICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4ga2V5ZG93bkV2ZW50cy5uZXh0KGV2ZW50KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAga2V5ZG93bkV2ZW50cy5uZXh0KGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG4iXX0=