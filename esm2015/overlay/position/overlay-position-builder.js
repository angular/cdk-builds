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
import * as i2 from "@angular/common";
import * as i3 from "@angular/cdk/platform";
import * as i4 from "../overlay-container";
/** Builder for overlay position strategy. */
export class OverlayPositionBuilder {
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
}
OverlayPositionBuilder.ɵprov = i0.ɵɵdefineInjectable({ factory: function OverlayPositionBuilder_Factory() { return new OverlayPositionBuilder(i0.ɵɵinject(i1.ViewportRuler), i0.ɵɵinject(i2.DOCUMENT), i0.ɵɵinject(i3.Platform), i0.ɵɵinject(i4.OverlayContainer)); }, token: OverlayPositionBuilder, providedIn: "root" });
OverlayPositionBuilder.decorators = [
    { type: Injectable, args: [{ providedIn: 'root' },] }
];
OverlayPositionBuilder.ctorParameters = () => [
    { type: ViewportRuler },
    { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] },
    { type: Platform },
    { type: OverlayContainer }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1wb3NpdGlvbi1idWlsZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vdmVybGF5L3Bvc2l0aW9uL292ZXJsYXktcG9zaXRpb24tYnVpbGRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDL0MsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3JELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQUMsTUFBTSxFQUFFLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNqRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUN0RCxPQUFPLEVBQ0wsaUNBQWlDLEdBRWxDLE1BQU0sd0NBQXdDLENBQUM7QUFDaEQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sNEJBQTRCLENBQUM7Ozs7OztBQUdsRSw2Q0FBNkM7QUFFN0MsTUFBTSxPQUFPLHNCQUFzQjtJQUNqQyxZQUNZLGNBQTZCLEVBQTRCLFNBQWMsRUFDdkUsU0FBbUIsRUFBVSxpQkFBbUM7UUFEaEUsbUJBQWMsR0FBZCxjQUFjLENBQWU7UUFBNEIsY0FBUyxHQUFULFNBQVMsQ0FBSztRQUN2RSxjQUFTLEdBQVQsU0FBUyxDQUFVO1FBQVUsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFrQjtJQUFHLENBQUM7SUFFaEY7O09BRUc7SUFDSCxNQUFNO1FBQ0osT0FBTyxJQUFJLHNCQUFzQixFQUFFLENBQUM7SUFDdEMsQ0FBQztJQUVEOzs7T0FHRztJQUNILG1CQUFtQixDQUFDLE1BQStDO1FBRWpFLE9BQU8sSUFBSSxpQ0FBaUMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUNwRixJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0lBQzlDLENBQUM7Ozs7WUFyQkYsVUFBVSxTQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQzs7O1lBWnhCLGFBQWE7NENBZXlCLE1BQU0sU0FBQyxRQUFRO1lBaEJyRCxRQUFRO1lBSVIsZ0JBQWdCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UGxhdGZvcm19IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge1ZpZXdwb3J0UnVsZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9zY3JvbGxpbmcnO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7SW5qZWN0LCBJbmplY3RhYmxlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T3ZlcmxheUNvbnRhaW5lcn0gZnJvbSAnLi4vb3ZlcmxheS1jb250YWluZXInO1xuaW1wb3J0IHtcbiAgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5LFxuICBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3lPcmlnaW4sXG59IGZyb20gJy4vZmxleGlibGUtY29ubmVjdGVkLXBvc2l0aW9uLXN0cmF0ZWd5JztcbmltcG9ydCB7R2xvYmFsUG9zaXRpb25TdHJhdGVneX0gZnJvbSAnLi9nbG9iYWwtcG9zaXRpb24tc3RyYXRlZ3knO1xuXG5cbi8qKiBCdWlsZGVyIGZvciBvdmVybGF5IHBvc2l0aW9uIHN0cmF0ZWd5LiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgT3ZlcmxheVBvc2l0aW9uQnVpbGRlciB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBfdmlld3BvcnRSdWxlcjogVmlld3BvcnRSdWxlciwgQEluamVjdChET0NVTUVOVCkgcHJpdmF0ZSBfZG9jdW1lbnQ6IGFueSxcbiAgICAgIHByaXZhdGUgX3BsYXRmb3JtOiBQbGF0Zm9ybSwgcHJpdmF0ZSBfb3ZlcmxheUNvbnRhaW5lcjogT3ZlcmxheUNvbnRhaW5lcikge31cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGdsb2JhbCBwb3NpdGlvbiBzdHJhdGVneS5cbiAgICovXG4gIGdsb2JhbCgpOiBHbG9iYWxQb3NpdGlvblN0cmF0ZWd5IHtcbiAgICByZXR1cm4gbmV3IEdsb2JhbFBvc2l0aW9uU3RyYXRlZ3koKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZmxleGlibGUgcG9zaXRpb24gc3RyYXRlZ3kuXG4gICAqIEBwYXJhbSBvcmlnaW4gT3JpZ2luIHJlbGF0aXZlIHRvIHdoaWNoIHRvIHBvc2l0aW9uIHRoZSBvdmVybGF5LlxuICAgKi9cbiAgZmxleGlibGVDb25uZWN0ZWRUbyhvcmlnaW46IEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneU9yaWdpbik6XG4gICAgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5IHtcbiAgICByZXR1cm4gbmV3IEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneShvcmlnaW4sIHRoaXMuX3ZpZXdwb3J0UnVsZXIsIHRoaXMuX2RvY3VtZW50LFxuICAgICAgICB0aGlzLl9wbGF0Zm9ybSwgdGhpcy5fb3ZlcmxheUNvbnRhaW5lcik7XG4gIH1cblxufVxuIl19