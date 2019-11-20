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
import * as i1 from "@angular/cdk/scrolling/scroll-dispatcher";
import * as i2 from "@angular/cdk/scrolling/viewport-ruler";
import * as i3 from "@angular/common";
/**
 * Options for how an overlay will handle scrolling.
 *
 * Users can provide a custom value for `ScrollStrategyOptions` to replace the default
 * behaviors. This class primarily acts as a factory for ScrollStrategy instances.
 */
var ScrollStrategyOptions = /** @class */ (function () {
    function ScrollStrategyOptions(_scrollDispatcher, _viewportRuler, _ngZone, document) {
        var _this = this;
        this._scrollDispatcher = _scrollDispatcher;
        this._viewportRuler = _viewportRuler;
        this._ngZone = _ngZone;
        /** Do nothing on scroll. */
        this.noop = function () { return new NoopScrollStrategy(); };
        /**
         * Close the overlay as soon as the user scrolls.
         * @param config Configuration to be used inside the scroll strategy.
         */
        this.close = function (config) { return new CloseScrollStrategy(_this._scrollDispatcher, _this._ngZone, _this._viewportRuler, config); };
        /** Block scrolling. */
        this.block = function () { return new BlockScrollStrategy(_this._viewportRuler, _this._document); };
        /**
         * Update the overlay's position on scroll.
         * @param config Configuration to be used inside the scroll strategy.
         * Allows debouncing the reposition calls.
         */
        this.reposition = function (config) { return new RepositionScrollStrategy(_this._scrollDispatcher, _this._viewportRuler, _this._ngZone, config); };
        this._document = document;
    }
    ScrollStrategyOptions.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    /** @nocollapse */
    ScrollStrategyOptions.ctorParameters = function () { return [
        { type: ScrollDispatcher },
        { type: ViewportRuler },
        { type: NgZone },
        { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] }
    ]; };
    ScrollStrategyOptions.ɵprov = i0.ɵɵdefineInjectable({ factory: function ScrollStrategyOptions_Factory() { return new ScrollStrategyOptions(i0.ɵɵinject(i1.ScrollDispatcher), i0.ɵɵinject(i2.ViewportRuler), i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i3.DOCUMENT)); }, token: ScrollStrategyOptions, providedIn: "root" });
    return ScrollStrategyOptions;
}());
export { ScrollStrategyOptions };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsLXN0cmF0ZWd5LW9wdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvc2Nyb2xsL3Njcm9sbC1zdHJhdGVneS1vcHRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxhQUFhLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUN2RSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3pELE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQzVELE9BQU8sRUFBQyxtQkFBbUIsRUFBNEIsTUFBTSx5QkFBeUIsQ0FBQztBQUN2RixPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUMxRCxPQUFPLEVBQ0wsd0JBQXdCLEdBRXpCLE1BQU0sOEJBQThCLENBQUM7Ozs7O0FBR3RDOzs7OztHQUtHO0FBQ0g7SUFJRSwrQkFDVSxpQkFBbUMsRUFDbkMsY0FBNkIsRUFDN0IsT0FBZSxFQUNMLFFBQWE7UUFKakMsaUJBTUc7UUFMTyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQWtCO1FBQ25DLG1CQUFjLEdBQWQsY0FBYyxDQUFlO1FBQzdCLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFLekIsNEJBQTRCO1FBQzVCLFNBQUksR0FBRyxjQUFNLE9BQUEsSUFBSSxrQkFBa0IsRUFBRSxFQUF4QixDQUF3QixDQUFDO1FBRXRDOzs7V0FHRztRQUNILFVBQUssR0FBRyxVQUFDLE1BQWtDLElBQUssT0FBQSxJQUFJLG1CQUFtQixDQUFDLEtBQUksQ0FBQyxpQkFBaUIsRUFDMUYsS0FBSSxDQUFDLE9BQU8sRUFBRSxLQUFJLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxFQURFLENBQ0YsQ0FBQTtRQUU5Qyx1QkFBdUI7UUFDdkIsVUFBSyxHQUFHLGNBQU0sT0FBQSxJQUFJLG1CQUFtQixDQUFDLEtBQUksQ0FBQyxjQUFjLEVBQUUsS0FBSSxDQUFDLFNBQVMsQ0FBQyxFQUE1RCxDQUE0RCxDQUFDO1FBRTNFOzs7O1dBSUc7UUFDSCxlQUFVLEdBQUcsVUFBQyxNQUF1QyxJQUFLLE9BQUEsSUFBSSx3QkFBd0IsQ0FDbEYsS0FBSSxDQUFDLGlCQUFpQixFQUFFLEtBQUksQ0FBQyxjQUFjLEVBQUUsS0FBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsRUFEWixDQUNZLENBQUE7UUF0QmxFLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO0lBQzVCLENBQUM7O2dCQVZKLFVBQVUsU0FBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7Ozs7Z0JBbEJ4QixnQkFBZ0I7Z0JBQUUsYUFBYTtnQkFFWCxNQUFNO2dEQXdCN0IsTUFBTSxTQUFDLFFBQVE7OztnQ0FsQ3BCO0NBMERDLEFBaENELElBZ0NDO1NBL0JZLHFCQUFxQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1Njcm9sbERpc3BhdGNoZXIsIFZpZXdwb3J0UnVsZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9zY3JvbGxpbmcnO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7SW5qZWN0LCBJbmplY3RhYmxlLCBOZ1pvbmV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtCbG9ja1Njcm9sbFN0cmF0ZWd5fSBmcm9tICcuL2Jsb2NrLXNjcm9sbC1zdHJhdGVneSc7XG5pbXBvcnQge0Nsb3NlU2Nyb2xsU3RyYXRlZ3ksIENsb3NlU2Nyb2xsU3RyYXRlZ3lDb25maWd9IGZyb20gJy4vY2xvc2Utc2Nyb2xsLXN0cmF0ZWd5JztcbmltcG9ydCB7Tm9vcFNjcm9sbFN0cmF0ZWd5fSBmcm9tICcuL25vb3Atc2Nyb2xsLXN0cmF0ZWd5JztcbmltcG9ydCB7XG4gIFJlcG9zaXRpb25TY3JvbGxTdHJhdGVneSxcbiAgUmVwb3NpdGlvblNjcm9sbFN0cmF0ZWd5Q29uZmlnLFxufSBmcm9tICcuL3JlcG9zaXRpb24tc2Nyb2xsLXN0cmF0ZWd5JztcblxuXG4vKipcbiAqIE9wdGlvbnMgZm9yIGhvdyBhbiBvdmVybGF5IHdpbGwgaGFuZGxlIHNjcm9sbGluZy5cbiAqXG4gKiBVc2VycyBjYW4gcHJvdmlkZSBhIGN1c3RvbSB2YWx1ZSBmb3IgYFNjcm9sbFN0cmF0ZWd5T3B0aW9uc2AgdG8gcmVwbGFjZSB0aGUgZGVmYXVsdFxuICogYmVoYXZpb3JzLiBUaGlzIGNsYXNzIHByaW1hcmlseSBhY3RzIGFzIGEgZmFjdG9yeSBmb3IgU2Nyb2xsU3RyYXRlZ3kgaW5zdGFuY2VzLlxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBTY3JvbGxTdHJhdGVneU9wdGlvbnMge1xuICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfc2Nyb2xsRGlzcGF0Y2hlcjogU2Nyb2xsRGlzcGF0Y2hlcixcbiAgICBwcml2YXRlIF92aWV3cG9ydFJ1bGVyOiBWaWV3cG9ydFJ1bGVyLFxuICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgIEBJbmplY3QoRE9DVU1FTlQpIGRvY3VtZW50OiBhbnkpIHtcbiAgICAgIHRoaXMuX2RvY3VtZW50ID0gZG9jdW1lbnQ7XG4gICAgfVxuXG4gIC8qKiBEbyBub3RoaW5nIG9uIHNjcm9sbC4gKi9cbiAgbm9vcCA9ICgpID0+IG5ldyBOb29wU2Nyb2xsU3RyYXRlZ3koKTtcblxuICAvKipcbiAgICogQ2xvc2UgdGhlIG92ZXJsYXkgYXMgc29vbiBhcyB0aGUgdXNlciBzY3JvbGxzLlxuICAgKiBAcGFyYW0gY29uZmlnIENvbmZpZ3VyYXRpb24gdG8gYmUgdXNlZCBpbnNpZGUgdGhlIHNjcm9sbCBzdHJhdGVneS5cbiAgICovXG4gIGNsb3NlID0gKGNvbmZpZz86IENsb3NlU2Nyb2xsU3RyYXRlZ3lDb25maWcpID0+IG5ldyBDbG9zZVNjcm9sbFN0cmF0ZWd5KHRoaXMuX3Njcm9sbERpc3BhdGNoZXIsXG4gICAgICB0aGlzLl9uZ1pvbmUsIHRoaXMuX3ZpZXdwb3J0UnVsZXIsIGNvbmZpZylcblxuICAvKiogQmxvY2sgc2Nyb2xsaW5nLiAqL1xuICBibG9jayA9ICgpID0+IG5ldyBCbG9ja1Njcm9sbFN0cmF0ZWd5KHRoaXMuX3ZpZXdwb3J0UnVsZXIsIHRoaXMuX2RvY3VtZW50KTtcblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBvdmVybGF5J3MgcG9zaXRpb24gb24gc2Nyb2xsLlxuICAgKiBAcGFyYW0gY29uZmlnIENvbmZpZ3VyYXRpb24gdG8gYmUgdXNlZCBpbnNpZGUgdGhlIHNjcm9sbCBzdHJhdGVneS5cbiAgICogQWxsb3dzIGRlYm91bmNpbmcgdGhlIHJlcG9zaXRpb24gY2FsbHMuXG4gICAqL1xuICByZXBvc2l0aW9uID0gKGNvbmZpZz86IFJlcG9zaXRpb25TY3JvbGxTdHJhdGVneUNvbmZpZykgPT4gbmV3IFJlcG9zaXRpb25TY3JvbGxTdHJhdGVneShcbiAgICAgIHRoaXMuX3Njcm9sbERpc3BhdGNoZXIsIHRoaXMuX3ZpZXdwb3J0UnVsZXIsIHRoaXMuX25nWm9uZSwgY29uZmlnKVxufVxuIl19