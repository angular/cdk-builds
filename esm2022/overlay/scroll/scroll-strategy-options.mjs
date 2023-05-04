/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ScrollDispatcher, ViewportRuler } from '@angular/cdk/scrolling';
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, NgZone } from '@angular/core';
import { BlockScrollStrategy } from './block-scroll-strategy';
import { CloseScrollStrategy } from './close-scroll-strategy';
import { NoopScrollStrategy } from './noop-scroll-strategy';
import { RepositionScrollStrategy, } from './reposition-scroll-strategy';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/scrolling";
/**
 * Options for how an overlay will handle scrolling.
 *
 * Users can provide a custom value for `ScrollStrategyOptions` to replace the default
 * behaviors. This class primarily acts as a factory for ScrollStrategy instances.
 */
class ScrollStrategyOptions {
    constructor(_scrollDispatcher, _viewportRuler, _ngZone, document) {
        this._scrollDispatcher = _scrollDispatcher;
        this._viewportRuler = _viewportRuler;
        this._ngZone = _ngZone;
        /** Do nothing on scroll. */
        this.noop = () => new NoopScrollStrategy();
        /**
         * Close the overlay as soon as the user scrolls.
         * @param config Configuration to be used inside the scroll strategy.
         */
        this.close = (config) => new CloseScrollStrategy(this._scrollDispatcher, this._ngZone, this._viewportRuler, config);
        /** Block scrolling. */
        this.block = () => new BlockScrollStrategy(this._viewportRuler, this._document);
        /**
         * Update the overlay's position on scroll.
         * @param config Configuration to be used inside the scroll strategy.
         * Allows debouncing the reposition calls.
         */
        this.reposition = (config) => new RepositionScrollStrategy(this._scrollDispatcher, this._viewportRuler, this._ngZone, config);
        this._document = document;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: ScrollStrategyOptions, deps: [{ token: i1.ScrollDispatcher }, { token: i1.ViewportRuler }, { token: i0.NgZone }, { token: DOCUMENT }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: ScrollStrategyOptions, providedIn: 'root' }); }
}
export { ScrollStrategyOptions };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: ScrollStrategyOptions, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: i1.ScrollDispatcher }, { type: i1.ViewportRuler }, { type: i0.NgZone }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsLXN0cmF0ZWd5LW9wdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvc2Nyb2xsL3Njcm9sbC1zdHJhdGVneS1vcHRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxhQUFhLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUN2RSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3pELE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQzVELE9BQU8sRUFBQyxtQkFBbUIsRUFBNEIsTUFBTSx5QkFBeUIsQ0FBQztBQUN2RixPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUMxRCxPQUFPLEVBQ0wsd0JBQXdCLEdBRXpCLE1BQU0sOEJBQThCLENBQUM7OztBQUV0Qzs7Ozs7R0FLRztBQUNILE1BQ2EscUJBQXFCO0lBR2hDLFlBQ1UsaUJBQW1DLEVBQ25DLGNBQTZCLEVBQzdCLE9BQWUsRUFDTCxRQUFhO1FBSHZCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBa0I7UUFDbkMsbUJBQWMsR0FBZCxjQUFjLENBQWU7UUFDN0IsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQU16Qiw0QkFBNEI7UUFDNUIsU0FBSSxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksa0JBQWtCLEVBQUUsQ0FBQztRQUV0Qzs7O1dBR0c7UUFDSCxVQUFLLEdBQUcsQ0FBQyxNQUFrQyxFQUFFLEVBQUUsQ0FDN0MsSUFBSSxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRTdGLHVCQUF1QjtRQUN2QixVQUFLLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUUzRTs7OztXQUlHO1FBQ0gsZUFBVSxHQUFHLENBQUMsTUFBdUMsRUFBRSxFQUFFLENBQ3ZELElBQUksd0JBQXdCLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztRQXRCaEcsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7SUFDNUIsQ0FBQzs4R0FWVSxxQkFBcUIscUdBT3RCLFFBQVE7a0hBUFAscUJBQXFCLGNBRFQsTUFBTTs7U0FDbEIscUJBQXFCOzJGQUFyQixxQkFBcUI7a0JBRGpDLFVBQVU7bUJBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzswQkFRM0IsTUFBTTsyQkFBQyxRQUFRIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U2Nyb2xsRGlzcGF0Y2hlciwgVmlld3BvcnRSdWxlcn0gZnJvbSAnQGFuZ3VsYXIvY2RrL3Njcm9sbGluZyc7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtJbmplY3QsIEluamVjdGFibGUsIE5nWm9uZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0Jsb2NrU2Nyb2xsU3RyYXRlZ3l9IGZyb20gJy4vYmxvY2stc2Nyb2xsLXN0cmF0ZWd5JztcbmltcG9ydCB7Q2xvc2VTY3JvbGxTdHJhdGVneSwgQ2xvc2VTY3JvbGxTdHJhdGVneUNvbmZpZ30gZnJvbSAnLi9jbG9zZS1zY3JvbGwtc3RyYXRlZ3knO1xuaW1wb3J0IHtOb29wU2Nyb2xsU3RyYXRlZ3l9IGZyb20gJy4vbm9vcC1zY3JvbGwtc3RyYXRlZ3knO1xuaW1wb3J0IHtcbiAgUmVwb3NpdGlvblNjcm9sbFN0cmF0ZWd5LFxuICBSZXBvc2l0aW9uU2Nyb2xsU3RyYXRlZ3lDb25maWcsXG59IGZyb20gJy4vcmVwb3NpdGlvbi1zY3JvbGwtc3RyYXRlZ3knO1xuXG4vKipcbiAqIE9wdGlvbnMgZm9yIGhvdyBhbiBvdmVybGF5IHdpbGwgaGFuZGxlIHNjcm9sbGluZy5cbiAqXG4gKiBVc2VycyBjYW4gcHJvdmlkZSBhIGN1c3RvbSB2YWx1ZSBmb3IgYFNjcm9sbFN0cmF0ZWd5T3B0aW9uc2AgdG8gcmVwbGFjZSB0aGUgZGVmYXVsdFxuICogYmVoYXZpb3JzLiBUaGlzIGNsYXNzIHByaW1hcmlseSBhY3RzIGFzIGEgZmFjdG9yeSBmb3IgU2Nyb2xsU3RyYXRlZ3kgaW5zdGFuY2VzLlxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBTY3JvbGxTdHJhdGVneU9wdGlvbnMge1xuICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfc2Nyb2xsRGlzcGF0Y2hlcjogU2Nyb2xsRGlzcGF0Y2hlcixcbiAgICBwcml2YXRlIF92aWV3cG9ydFJ1bGVyOiBWaWV3cG9ydFJ1bGVyLFxuICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgIEBJbmplY3QoRE9DVU1FTlQpIGRvY3VtZW50OiBhbnksXG4gICkge1xuICAgIHRoaXMuX2RvY3VtZW50ID0gZG9jdW1lbnQ7XG4gIH1cblxuICAvKiogRG8gbm90aGluZyBvbiBzY3JvbGwuICovXG4gIG5vb3AgPSAoKSA9PiBuZXcgTm9vcFNjcm9sbFN0cmF0ZWd5KCk7XG5cbiAgLyoqXG4gICAqIENsb3NlIHRoZSBvdmVybGF5IGFzIHNvb24gYXMgdGhlIHVzZXIgc2Nyb2xscy5cbiAgICogQHBhcmFtIGNvbmZpZyBDb25maWd1cmF0aW9uIHRvIGJlIHVzZWQgaW5zaWRlIHRoZSBzY3JvbGwgc3RyYXRlZ3kuXG4gICAqL1xuICBjbG9zZSA9IChjb25maWc/OiBDbG9zZVNjcm9sbFN0cmF0ZWd5Q29uZmlnKSA9PlxuICAgIG5ldyBDbG9zZVNjcm9sbFN0cmF0ZWd5KHRoaXMuX3Njcm9sbERpc3BhdGNoZXIsIHRoaXMuX25nWm9uZSwgdGhpcy5fdmlld3BvcnRSdWxlciwgY29uZmlnKTtcblxuICAvKiogQmxvY2sgc2Nyb2xsaW5nLiAqL1xuICBibG9jayA9ICgpID0+IG5ldyBCbG9ja1Njcm9sbFN0cmF0ZWd5KHRoaXMuX3ZpZXdwb3J0UnVsZXIsIHRoaXMuX2RvY3VtZW50KTtcblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBvdmVybGF5J3MgcG9zaXRpb24gb24gc2Nyb2xsLlxuICAgKiBAcGFyYW0gY29uZmlnIENvbmZpZ3VyYXRpb24gdG8gYmUgdXNlZCBpbnNpZGUgdGhlIHNjcm9sbCBzdHJhdGVneS5cbiAgICogQWxsb3dzIGRlYm91bmNpbmcgdGhlIHJlcG9zaXRpb24gY2FsbHMuXG4gICAqL1xuICByZXBvc2l0aW9uID0gKGNvbmZpZz86IFJlcG9zaXRpb25TY3JvbGxTdHJhdGVneUNvbmZpZykgPT5cbiAgICBuZXcgUmVwb3NpdGlvblNjcm9sbFN0cmF0ZWd5KHRoaXMuX3Njcm9sbERpc3BhdGNoZXIsIHRoaXMuX3ZpZXdwb3J0UnVsZXIsIHRoaXMuX25nWm9uZSwgY29uZmlnKTtcbn1cbiJdfQ==