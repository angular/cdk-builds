/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Platform } from '@angular/cdk/platform';
import { ViewportRuler } from '@angular/cdk/scrolling';
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { OverlayContainer } from '../overlay-container';
import { FlexibleConnectedPositionStrategy, } from './flexible-connected-position-strategy';
import { GlobalPositionStrategy } from './global-position-strategy';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/scrolling";
import * as i2 from "@angular/cdk/platform";
import * as i3 from "../overlay-container";
/** Builder for overlay position strategy. */
class OverlayPositionBuilder {
    constructor(_viewportRuler, _document, _platform, _overlayContainer) {
        this._viewportRuler = _viewportRuler;
        this._document = _document;
        this._platform = _platform;
        this._overlayContainer = _overlayContainer;
    }
    /**
     * Creates a global position strategy.
     */
    global() {
        return new GlobalPositionStrategy();
    }
    /**
     * Creates a flexible position strategy.
     * @param origin Origin relative to which to position the overlay.
     */
    flexibleConnectedTo(origin) {
        return new FlexibleConnectedPositionStrategy(origin, this._viewportRuler, this._document, this._platform, this._overlayContainer);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: OverlayPositionBuilder, deps: [{ token: i1.ViewportRuler }, { token: DOCUMENT }, { token: i2.Platform }, { token: i3.OverlayContainer }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: OverlayPositionBuilder, providedIn: 'root' }); }
}
export { OverlayPositionBuilder };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: OverlayPositionBuilder, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: i1.ViewportRuler }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: i2.Platform }, { type: i3.OverlayContainer }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1wb3NpdGlvbi1idWlsZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vdmVybGF5L3Bvc2l0aW9uL292ZXJsYXktcG9zaXRpb24tYnVpbGRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDL0MsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3JELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQUMsTUFBTSxFQUFFLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNqRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUN0RCxPQUFPLEVBQ0wsaUNBQWlDLEdBRWxDLE1BQU0sd0NBQXdDLENBQUM7QUFDaEQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sNEJBQTRCLENBQUM7Ozs7O0FBRWxFLDZDQUE2QztBQUM3QyxNQUNhLHNCQUFzQjtJQUNqQyxZQUNVLGNBQTZCLEVBQ1gsU0FBYyxFQUNoQyxTQUFtQixFQUNuQixpQkFBbUM7UUFIbkMsbUJBQWMsR0FBZCxjQUFjLENBQWU7UUFDWCxjQUFTLEdBQVQsU0FBUyxDQUFLO1FBQ2hDLGNBQVMsR0FBVCxTQUFTLENBQVU7UUFDbkIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFrQjtJQUMxQyxDQUFDO0lBRUo7O09BRUc7SUFDSCxNQUFNO1FBQ0osT0FBTyxJQUFJLHNCQUFzQixFQUFFLENBQUM7SUFDdEMsQ0FBQztJQUVEOzs7T0FHRztJQUNILG1CQUFtQixDQUNqQixNQUErQztRQUUvQyxPQUFPLElBQUksaUNBQWlDLENBQzFDLE1BQU0sRUFDTixJQUFJLENBQUMsY0FBYyxFQUNuQixJQUFJLENBQUMsU0FBUyxFQUNkLElBQUksQ0FBQyxTQUFTLEVBQ2QsSUFBSSxDQUFDLGlCQUFpQixDQUN2QixDQUFDO0lBQ0osQ0FBQzs4R0E3QlUsc0JBQXNCLCtDQUd2QixRQUFRO2tIQUhQLHNCQUFzQixjQURWLE1BQU07O1NBQ2xCLHNCQUFzQjsyRkFBdEIsc0JBQXNCO2tCQURsQyxVQUFVO21CQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQzs7MEJBSTNCLE1BQU07MkJBQUMsUUFBUSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1BsYXRmb3JtfSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtWaWV3cG9ydFJ1bGVyfSBmcm9tICdAYW5ndWxhci9jZGsvc2Nyb2xsaW5nJztcbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge0luamVjdCwgSW5qZWN0YWJsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge092ZXJsYXlDb250YWluZXJ9IGZyb20gJy4uL292ZXJsYXktY29udGFpbmVyJztcbmltcG9ydCB7XG4gIEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneSxcbiAgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5T3JpZ2luLFxufSBmcm9tICcuL2ZsZXhpYmxlLWNvbm5lY3RlZC1wb3NpdGlvbi1zdHJhdGVneSc7XG5pbXBvcnQge0dsb2JhbFBvc2l0aW9uU3RyYXRlZ3l9IGZyb20gJy4vZ2xvYmFsLXBvc2l0aW9uLXN0cmF0ZWd5JztcblxuLyoqIEJ1aWxkZXIgZm9yIG92ZXJsYXkgcG9zaXRpb24gc3RyYXRlZ3kuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBPdmVybGF5UG9zaXRpb25CdWlsZGVyIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfdmlld3BvcnRSdWxlcjogVmlld3BvcnRSdWxlcixcbiAgICBASW5qZWN0KERPQ1VNRU5UKSBwcml2YXRlIF9kb2N1bWVudDogYW55LFxuICAgIHByaXZhdGUgX3BsYXRmb3JtOiBQbGF0Zm9ybSxcbiAgICBwcml2YXRlIF9vdmVybGF5Q29udGFpbmVyOiBPdmVybGF5Q29udGFpbmVyLFxuICApIHt9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBnbG9iYWwgcG9zaXRpb24gc3RyYXRlZ3kuXG4gICAqL1xuICBnbG9iYWwoKTogR2xvYmFsUG9zaXRpb25TdHJhdGVneSB7XG4gICAgcmV0dXJuIG5ldyBHbG9iYWxQb3NpdGlvblN0cmF0ZWd5KCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGZsZXhpYmxlIHBvc2l0aW9uIHN0cmF0ZWd5LlxuICAgKiBAcGFyYW0gb3JpZ2luIE9yaWdpbiByZWxhdGl2ZSB0byB3aGljaCB0byBwb3NpdGlvbiB0aGUgb3ZlcmxheS5cbiAgICovXG4gIGZsZXhpYmxlQ29ubmVjdGVkVG8oXG4gICAgb3JpZ2luOiBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3lPcmlnaW4sXG4gICk6IEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneSB7XG4gICAgcmV0dXJuIG5ldyBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3koXG4gICAgICBvcmlnaW4sXG4gICAgICB0aGlzLl92aWV3cG9ydFJ1bGVyLFxuICAgICAgdGhpcy5fZG9jdW1lbnQsXG4gICAgICB0aGlzLl9wbGF0Zm9ybSxcbiAgICAgIHRoaXMuX292ZXJsYXlDb250YWluZXIsXG4gICAgKTtcbiAgfVxufVxuIl19