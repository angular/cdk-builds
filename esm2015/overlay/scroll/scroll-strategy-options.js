/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/overlay/scroll/scroll-strategy-options.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
import * as i2 from "@angular/common";
/**
 * Options for how an overlay will handle scrolling.
 *
 * Users can provide a custom value for `ScrollStrategyOptions` to replace the default
 * behaviors. This class primarily acts as a factory for ScrollStrategy instances.
 */
let ScrollStrategyOptions = /** @class */ (() => {
    /**
     * Options for how an overlay will handle scrolling.
     *
     * Users can provide a custom value for `ScrollStrategyOptions` to replace the default
     * behaviors. This class primarily acts as a factory for ScrollStrategy instances.
     */
    class ScrollStrategyOptions {
        /**
         * @param {?} _scrollDispatcher
         * @param {?} _viewportRuler
         * @param {?} _ngZone
         * @param {?} document
         */
        constructor(_scrollDispatcher, _viewportRuler, _ngZone, document) {
            this._scrollDispatcher = _scrollDispatcher;
            this._viewportRuler = _viewportRuler;
            this._ngZone = _ngZone;
            /**
             * Do nothing on scroll.
             */
            this.noop = (/**
             * @return {?}
             */
            () => new NoopScrollStrategy());
            /**
             * Close the overlay as soon as the user scrolls.
             * @param config Configuration to be used inside the scroll strategy.
             */
            this.close = (/**
             * @param {?=} config
             * @return {?}
             */
            (config) => new CloseScrollStrategy(this._scrollDispatcher, this._ngZone, this._viewportRuler, config));
            /**
             * Block scrolling.
             */
            this.block = (/**
             * @return {?}
             */
            () => new BlockScrollStrategy(this._viewportRuler, this._document));
            /**
             * Update the overlay's position on scroll.
             * @param config Configuration to be used inside the scroll strategy.
             * Allows debouncing the reposition calls.
             */
            this.reposition = (/**
             * @param {?=} config
             * @return {?}
             */
            (config) => new RepositionScrollStrategy(this._scrollDispatcher, this._viewportRuler, this._ngZone, config));
            this._document = document;
        }
    }
    ScrollStrategyOptions.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    /** @nocollapse */
    ScrollStrategyOptions.ctorParameters = () => [
        { type: ScrollDispatcher },
        { type: ViewportRuler },
        { type: NgZone },
        { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] }
    ];
    /** @nocollapse */ ScrollStrategyOptions.ɵprov = i0.ɵɵdefineInjectable({ factory: function ScrollStrategyOptions_Factory() { return new ScrollStrategyOptions(i0.ɵɵinject(i1.ScrollDispatcher), i0.ɵɵinject(i1.ViewportRuler), i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i2.DOCUMENT)); }, token: ScrollStrategyOptions, providedIn: "root" });
    return ScrollStrategyOptions;
})();
export { ScrollStrategyOptions };
if (false) {
    /**
     * @type {?}
     * @private
     */
    ScrollStrategyOptions.prototype._document;
    /**
     * Do nothing on scroll.
     * @type {?}
     */
    ScrollStrategyOptions.prototype.noop;
    /**
     * Close the overlay as soon as the user scrolls.
     * \@param config Configuration to be used inside the scroll strategy.
     * @type {?}
     */
    ScrollStrategyOptions.prototype.close;
    /**
     * Block scrolling.
     * @type {?}
     */
    ScrollStrategyOptions.prototype.block;
    /**
     * Update the overlay's position on scroll.
     * \@param config Configuration to be used inside the scroll strategy.
     * Allows debouncing the reposition calls.
     * @type {?}
     */
    ScrollStrategyOptions.prototype.reposition;
    /**
     * @type {?}
     * @private
     */
    ScrollStrategyOptions.prototype._scrollDispatcher;
    /**
     * @type {?}
     * @private
     */
    ScrollStrategyOptions.prototype._viewportRuler;
    /**
     * @type {?}
     * @private
     */
    ScrollStrategyOptions.prototype._ngZone;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsLXN0cmF0ZWd5LW9wdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvc2Nyb2xsL3Njcm9sbC1zdHJhdGVneS1vcHRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxhQUFhLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUN2RSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3pELE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQzVELE9BQU8sRUFBQyxtQkFBbUIsRUFBNEIsTUFBTSx5QkFBeUIsQ0FBQztBQUN2RixPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUMxRCxPQUFPLEVBQ0wsd0JBQXdCLEdBRXpCLE1BQU0sOEJBQThCLENBQUM7Ozs7Ozs7Ozs7QUFTdEM7Ozs7Ozs7SUFBQSxNQUNhLHFCQUFxQjs7Ozs7OztRQUdoQyxZQUNVLGlCQUFtQyxFQUNuQyxjQUE2QixFQUM3QixPQUFlLEVBQ0wsUUFBYTtZQUh2QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQWtCO1lBQ25DLG1CQUFjLEdBQWQsY0FBYyxDQUFlO1lBQzdCLFlBQU8sR0FBUCxPQUFPLENBQVE7Ozs7WUFNekIsU0FBSTs7O1lBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxrQkFBa0IsRUFBRSxFQUFDOzs7OztZQU10QyxVQUFLOzs7O1lBQUcsQ0FBQyxNQUFrQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLG1CQUFtQixDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFDMUYsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxFQUFBOzs7O1lBRzlDLFVBQUs7OztZQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksbUJBQW1CLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUM7Ozs7OztZQU8zRSxlQUFVOzs7O1lBQUcsQ0FBQyxNQUF1QyxFQUFFLEVBQUUsQ0FBQyxJQUFJLHdCQUF3QixDQUNsRixJQUFJLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxFQUFBO1lBdEJsRSxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztRQUM1QixDQUFDOzs7Z0JBVkosVUFBVSxTQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQzs7OztnQkFsQnhCLGdCQUFnQjtnQkFBRSxhQUFhO2dCQUVYLE1BQU07Z0RBd0I3QixNQUFNLFNBQUMsUUFBUTs7O2dDQWxDcEI7S0EwREM7U0EvQlkscUJBQXFCOzs7Ozs7SUFDaEMsMENBQTRCOzs7OztJQVc1QixxQ0FBc0M7Ozs7OztJQU10QyxzQ0FDOEM7Ozs7O0lBRzlDLHNDQUEyRTs7Ozs7OztJQU8zRSwyQ0FDc0U7Ozs7O0lBMUJwRSxrREFBMkM7Ozs7O0lBQzNDLCtDQUFxQzs7Ozs7SUFDckMsd0NBQXVCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U2Nyb2xsRGlzcGF0Y2hlciwgVmlld3BvcnRSdWxlcn0gZnJvbSAnQGFuZ3VsYXIvY2RrL3Njcm9sbGluZyc7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtJbmplY3QsIEluamVjdGFibGUsIE5nWm9uZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0Jsb2NrU2Nyb2xsU3RyYXRlZ3l9IGZyb20gJy4vYmxvY2stc2Nyb2xsLXN0cmF0ZWd5JztcbmltcG9ydCB7Q2xvc2VTY3JvbGxTdHJhdGVneSwgQ2xvc2VTY3JvbGxTdHJhdGVneUNvbmZpZ30gZnJvbSAnLi9jbG9zZS1zY3JvbGwtc3RyYXRlZ3knO1xuaW1wb3J0IHtOb29wU2Nyb2xsU3RyYXRlZ3l9IGZyb20gJy4vbm9vcC1zY3JvbGwtc3RyYXRlZ3knO1xuaW1wb3J0IHtcbiAgUmVwb3NpdGlvblNjcm9sbFN0cmF0ZWd5LFxuICBSZXBvc2l0aW9uU2Nyb2xsU3RyYXRlZ3lDb25maWcsXG59IGZyb20gJy4vcmVwb3NpdGlvbi1zY3JvbGwtc3RyYXRlZ3knO1xuXG5cbi8qKlxuICogT3B0aW9ucyBmb3IgaG93IGFuIG92ZXJsYXkgd2lsbCBoYW5kbGUgc2Nyb2xsaW5nLlxuICpcbiAqIFVzZXJzIGNhbiBwcm92aWRlIGEgY3VzdG9tIHZhbHVlIGZvciBgU2Nyb2xsU3RyYXRlZ3lPcHRpb25zYCB0byByZXBsYWNlIHRoZSBkZWZhdWx0XG4gKiBiZWhhdmlvcnMuIFRoaXMgY2xhc3MgcHJpbWFyaWx5IGFjdHMgYXMgYSBmYWN0b3J5IGZvciBTY3JvbGxTdHJhdGVneSBpbnN0YW5jZXMuXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIFNjcm9sbFN0cmF0ZWd5T3B0aW9ucyB7XG4gIHByaXZhdGUgX2RvY3VtZW50OiBEb2N1bWVudDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIF9zY3JvbGxEaXNwYXRjaGVyOiBTY3JvbGxEaXNwYXRjaGVyLFxuICAgIHByaXZhdGUgX3ZpZXdwb3J0UnVsZXI6IFZpZXdwb3J0UnVsZXIsXG4gICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgQEluamVjdChET0NVTUVOVCkgZG9jdW1lbnQ6IGFueSkge1xuICAgICAgdGhpcy5fZG9jdW1lbnQgPSBkb2N1bWVudDtcbiAgICB9XG5cbiAgLyoqIERvIG5vdGhpbmcgb24gc2Nyb2xsLiAqL1xuICBub29wID0gKCkgPT4gbmV3IE5vb3BTY3JvbGxTdHJhdGVneSgpO1xuXG4gIC8qKlxuICAgKiBDbG9zZSB0aGUgb3ZlcmxheSBhcyBzb29uIGFzIHRoZSB1c2VyIHNjcm9sbHMuXG4gICAqIEBwYXJhbSBjb25maWcgQ29uZmlndXJhdGlvbiB0byBiZSB1c2VkIGluc2lkZSB0aGUgc2Nyb2xsIHN0cmF0ZWd5LlxuICAgKi9cbiAgY2xvc2UgPSAoY29uZmlnPzogQ2xvc2VTY3JvbGxTdHJhdGVneUNvbmZpZykgPT4gbmV3IENsb3NlU2Nyb2xsU3RyYXRlZ3kodGhpcy5fc2Nyb2xsRGlzcGF0Y2hlcixcbiAgICAgIHRoaXMuX25nWm9uZSwgdGhpcy5fdmlld3BvcnRSdWxlciwgY29uZmlnKVxuXG4gIC8qKiBCbG9jayBzY3JvbGxpbmcuICovXG4gIGJsb2NrID0gKCkgPT4gbmV3IEJsb2NrU2Nyb2xsU3RyYXRlZ3kodGhpcy5fdmlld3BvcnRSdWxlciwgdGhpcy5fZG9jdW1lbnQpO1xuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIG92ZXJsYXkncyBwb3NpdGlvbiBvbiBzY3JvbGwuXG4gICAqIEBwYXJhbSBjb25maWcgQ29uZmlndXJhdGlvbiB0byBiZSB1c2VkIGluc2lkZSB0aGUgc2Nyb2xsIHN0cmF0ZWd5LlxuICAgKiBBbGxvd3MgZGVib3VuY2luZyB0aGUgcmVwb3NpdGlvbiBjYWxscy5cbiAgICovXG4gIHJlcG9zaXRpb24gPSAoY29uZmlnPzogUmVwb3NpdGlvblNjcm9sbFN0cmF0ZWd5Q29uZmlnKSA9PiBuZXcgUmVwb3NpdGlvblNjcm9sbFN0cmF0ZWd5KFxuICAgICAgdGhpcy5fc2Nyb2xsRGlzcGF0Y2hlciwgdGhpcy5fdmlld3BvcnRSdWxlciwgdGhpcy5fbmdab25lLCBjb25maWcpXG59XG4iXX0=