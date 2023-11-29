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
export class OverlayKeyboardDispatcher extends BaseOverlayDispatcher {
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: OverlayKeyboardDispatcher, deps: [{ token: DOCUMENT }, { token: i0.NgZone, optional: true }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: OverlayKeyboardDispatcher, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: OverlayKeyboardDispatcher, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: () => [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: i0.NgZone, decorators: [{
                    type: Optional
                }] }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1rZXlib2FyZC1kaXNwYXRjaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vdmVybGF5L2Rpc3BhdGNoZXJzL292ZXJsYXkta2V5Ym9hcmQtZGlzcGF0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNuRSxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQzs7QUFHaEU7Ozs7R0FJRztBQUVILE1BQU0sT0FBTyx5QkFBMEIsU0FBUSxxQkFBcUI7SUFDbEUsWUFDb0IsUUFBYTtJQUMvQix3REFBd0Q7SUFDcEMsT0FBZ0I7UUFFcEMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRkksWUFBTyxHQUFQLE9BQU8sQ0FBUztRQStCdEMsaUVBQWlFO1FBQ3pELHFCQUFnQixHQUFHLENBQUMsS0FBb0IsRUFBRSxFQUFFO1lBQ2xELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztZQUV4QyxLQUFLLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDN0MsNkZBQTZGO2dCQUM3Riw4RkFBOEY7Z0JBQzlGLDJGQUEyRjtnQkFDM0YsNEZBQTRGO2dCQUM1RiwyRkFBMkY7Z0JBQzNGLGdCQUFnQjtnQkFDaEIsSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO29CQUNuRCxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDO29CQUNqRCx3REFBd0Q7b0JBQ3hELElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTt3QkFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO3FCQUNuRDt5QkFBTTt3QkFDTCxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO3FCQUMzQjtvQkFDRCxNQUFNO2lCQUNQO2FBQ0Y7UUFDSCxDQUFDLENBQUM7SUFsREYsQ0FBQztJQUVELDhEQUE4RDtJQUNyRCxHQUFHLENBQUMsVUFBc0I7UUFDakMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUV0QixzREFBc0Q7UUFDdEQsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDckIsd0RBQXdEO1lBQ3hELElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsQ0FDbEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUN2RSxDQUFDO2FBQ0g7aUJBQU07Z0JBQ0wsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO2FBQ3hFO1lBQ0QsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7U0FDekI7SUFDSCxDQUFDO0lBRUQsbURBQW1EO0lBQ3pDLE1BQU07UUFDZCxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDcEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzFFLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO1NBQzFCO0lBQ0gsQ0FBQzs4R0FqQ1UseUJBQXlCLGtCQUUxQixRQUFRO2tIQUZQLHlCQUF5QixjQURiLE1BQU07OzJGQUNsQix5QkFBeUI7a0JBRHJDLFVBQVU7bUJBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzswQkFHM0IsTUFBTTsyQkFBQyxRQUFROzswQkFFZixRQUFRIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge0luamVjdCwgSW5qZWN0YWJsZSwgTmdab25lLCBPcHRpb25hbH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0Jhc2VPdmVybGF5RGlzcGF0Y2hlcn0gZnJvbSAnLi9iYXNlLW92ZXJsYXktZGlzcGF0Y2hlcic7XG5pbXBvcnQgdHlwZSB7T3ZlcmxheVJlZn0gZnJvbSAnLi4vb3ZlcmxheS1yZWYnO1xuXG4vKipcbiAqIFNlcnZpY2UgZm9yIGRpc3BhdGNoaW5nIGtleWJvYXJkIGV2ZW50cyB0aGF0IGxhbmQgb24gdGhlIGJvZHkgdG8gYXBwcm9wcmlhdGUgb3ZlcmxheSByZWYsXG4gKiBpZiBhbnkuIEl0IG1haW50YWlucyBhIGxpc3Qgb2YgYXR0YWNoZWQgb3ZlcmxheXMgdG8gZGV0ZXJtaW5lIGJlc3Qgc3VpdGVkIG92ZXJsYXkgYmFzZWRcbiAqIG9uIGV2ZW50IHRhcmdldCBhbmQgb3JkZXIgb2Ygb3ZlcmxheSBvcGVucy5cbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgT3ZlcmxheUtleWJvYXJkRGlzcGF0Y2hlciBleHRlbmRzIEJhc2VPdmVybGF5RGlzcGF0Y2hlciB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIEBJbmplY3QoRE9DVU1FTlQpIGRvY3VtZW50OiBhbnksXG4gICAgLyoqIEBicmVha2luZy1jaGFuZ2UgMTQuMC4wIF9uZ1pvbmUgd2lsbCBiZSByZXF1aXJlZC4gKi9cbiAgICBAT3B0aW9uYWwoKSBwcml2YXRlIF9uZ1pvbmU/OiBOZ1pvbmUsXG4gICkge1xuICAgIHN1cGVyKGRvY3VtZW50KTtcbiAgfVxuXG4gIC8qKiBBZGQgYSBuZXcgb3ZlcmxheSB0byB0aGUgbGlzdCBvZiBhdHRhY2hlZCBvdmVybGF5IHJlZnMuICovXG4gIG92ZXJyaWRlIGFkZChvdmVybGF5UmVmOiBPdmVybGF5UmVmKTogdm9pZCB7XG4gICAgc3VwZXIuYWRkKG92ZXJsYXlSZWYpO1xuXG4gICAgLy8gTGF6aWx5IHN0YXJ0IGRpc3BhdGNoZXIgb25jZSBmaXJzdCBvdmVybGF5IGlzIGFkZGVkXG4gICAgaWYgKCF0aGlzLl9pc0F0dGFjaGVkKSB7XG4gICAgICAvKiogQGJyZWFraW5nLWNoYW5nZSAxNC4wLjAgX25nWm9uZSB3aWxsIGJlIHJlcXVpcmVkLiAqL1xuICAgICAgaWYgKHRoaXMuX25nWm9uZSkge1xuICAgICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT5cbiAgICAgICAgICB0aGlzLl9kb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9rZXlkb3duTGlzdGVuZXIpLFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fa2V5ZG93bkxpc3RlbmVyKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2lzQXR0YWNoZWQgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBEZXRhY2hlcyB0aGUgZ2xvYmFsIGtleWJvYXJkIGV2ZW50IGxpc3RlbmVyLiAqL1xuICBwcm90ZWN0ZWQgZGV0YWNoKCkge1xuICAgIGlmICh0aGlzLl9pc0F0dGFjaGVkKSB7XG4gICAgICB0aGlzLl9kb2N1bWVudC5ib2R5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9rZXlkb3duTGlzdGVuZXIpO1xuICAgICAgdGhpcy5faXNBdHRhY2hlZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBLZXlib2FyZCBldmVudCBsaXN0ZW5lciB0aGF0IHdpbGwgYmUgYXR0YWNoZWQgdG8gdGhlIGJvZHkuICovXG4gIHByaXZhdGUgX2tleWRvd25MaXN0ZW5lciA9IChldmVudDogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICAgIGNvbnN0IG92ZXJsYXlzID0gdGhpcy5fYXR0YWNoZWRPdmVybGF5cztcblxuICAgIGZvciAobGV0IGkgPSBvdmVybGF5cy5sZW5ndGggLSAxOyBpID4gLTE7IGktLSkge1xuICAgICAgLy8gRGlzcGF0Y2ggdGhlIGtleWRvd24gZXZlbnQgdG8gdGhlIHRvcCBvdmVybGF5IHdoaWNoIGhhcyBzdWJzY3JpYmVycyB0byBpdHMga2V5ZG93biBldmVudHMuXG4gICAgICAvLyBXZSB3YW50IHRvIHRhcmdldCB0aGUgbW9zdCByZWNlbnQgb3ZlcmxheSwgcmF0aGVyIHRoYW4gdHJ5aW5nIHRvIG1hdGNoIHdoZXJlIHRoZSBldmVudCBjYW1lXG4gICAgICAvLyBmcm9tLCBiZWNhdXNlIHNvbWUgY29tcG9uZW50cyBtaWdodCBvcGVuIGFuIG92ZXJsYXksIGJ1dCBrZWVwIGZvY3VzIG9uIGEgdHJpZ2dlciBlbGVtZW50XG4gICAgICAvLyAoZS5nLiBmb3Igc2VsZWN0IGFuZCBhdXRvY29tcGxldGUpLiBXZSBza2lwIG92ZXJsYXlzIHdpdGhvdXQga2V5ZG93biBldmVudCBzdWJzY3JpcHRpb25zLFxuICAgICAgLy8gYmVjYXVzZSB3ZSBkb24ndCB3YW50IG92ZXJsYXlzIHRoYXQgZG9uJ3QgaGFuZGxlIGtleWJvYXJkIGV2ZW50cyB0byBibG9jayB0aGUgb25lcyBiZWxvd1xuICAgICAgLy8gdGhlbSB0aGF0IGRvLlxuICAgICAgaWYgKG92ZXJsYXlzW2ldLl9rZXlkb3duRXZlbnRzLm9ic2VydmVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IGtleWRvd25FdmVudHMgPSBvdmVybGF5c1tpXS5fa2V5ZG93bkV2ZW50cztcbiAgICAgICAgLyoqIEBicmVha2luZy1jaGFuZ2UgMTQuMC4wIF9uZ1pvbmUgd2lsbCBiZSByZXF1aXJlZC4gKi9cbiAgICAgICAgaWYgKHRoaXMuX25nWm9uZSkge1xuICAgICAgICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4ga2V5ZG93bkV2ZW50cy5uZXh0KGV2ZW50KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAga2V5ZG93bkV2ZW50cy5uZXh0KGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG4iXX0=