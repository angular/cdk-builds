/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getMatScrollStrategyAlreadyAttachedError } from './scroll-strategy';
import { isElementScrolledOutsideView } from '../position/scroll-clip';
/**
 * Config options for the RepositionScrollStrategy.
 * @record
 */
export function RepositionScrollStrategyConfig() { }
if (false) {
    /**
     * Time in milliseconds to throttle the scroll events.
     * @type {?|undefined}
     */
    RepositionScrollStrategyConfig.prototype.scrollThrottle;
    /**
     * Whether to close the overlay once the user has scrolled away completely.
     * @type {?|undefined}
     */
    RepositionScrollStrategyConfig.prototype.autoClose;
}
/**
 * Strategy that will update the element position as the user is scrolling.
 */
export class RepositionScrollStrategy {
    /**
     * @param {?} _scrollDispatcher
     * @param {?} _viewportRuler
     * @param {?} _ngZone
     * @param {?=} _config
     */
    constructor(_scrollDispatcher, _viewportRuler, _ngZone, _config) {
        this._scrollDispatcher = _scrollDispatcher;
        this._viewportRuler = _viewportRuler;
        this._ngZone = _ngZone;
        this._config = _config;
        this._scrollSubscription = null;
    }
    /**
     * Attaches this scroll strategy to an overlay.
     * @param {?} overlayRef
     * @return {?}
     */
    attach(overlayRef) {
        if (this._overlayRef) {
            throw getMatScrollStrategyAlreadyAttachedError();
        }
        this._overlayRef = overlayRef;
    }
    /**
     * Enables repositioning of the attached overlay on scroll.
     * @return {?}
     */
    enable() {
        if (!this._scrollSubscription) {
            /** @type {?} */
            const throttle = this._config ? this._config.scrollThrottle : 0;
            this._scrollSubscription = this._scrollDispatcher.scrolled(throttle).subscribe((/**
             * @return {?}
             */
            () => {
                this._overlayRef.updatePosition();
                // TODO(crisbeto): make `close` on by default once all components can handle it.
                if (this._config && this._config.autoClose) {
                    /** @type {?} */
                    const overlayRect = this._overlayRef.overlayElement.getBoundingClientRect();
                    const { width, height } = this._viewportRuler.getViewportSize();
                    // TODO(crisbeto): include all ancestor scroll containers here once
                    // we have a way of exposing the trigger element to the scroll strategy.
                    /** @type {?} */
                    const parentRects = [{ width, height, bottom: height, right: width, top: 0, left: 0 }];
                    if (isElementScrolledOutsideView(overlayRect, parentRects)) {
                        this.disable();
                        this._ngZone.run((/**
                         * @return {?}
                         */
                        () => this._overlayRef.detach()));
                    }
                }
            }));
        }
    }
    /**
     * Disables repositioning of the attached overlay on scroll.
     * @return {?}
     */
    disable() {
        if (this._scrollSubscription) {
            this._scrollSubscription.unsubscribe();
            this._scrollSubscription = null;
        }
    }
    /**
     * @return {?}
     */
    detach() {
        this.disable();
        this._overlayRef = (/** @type {?} */ (null));
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    RepositionScrollStrategy.prototype._scrollSubscription;
    /**
     * @type {?}
     * @private
     */
    RepositionScrollStrategy.prototype._overlayRef;
    /**
     * @type {?}
     * @private
     */
    RepositionScrollStrategy.prototype._scrollDispatcher;
    /**
     * @type {?}
     * @private
     */
    RepositionScrollStrategy.prototype._viewportRuler;
    /**
     * @type {?}
     * @private
     */
    RepositionScrollStrategy.prototype._ngZone;
    /**
     * @type {?}
     * @private
     */
    RepositionScrollStrategy.prototype._config;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwb3NpdGlvbi1zY3JvbGwtc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvc2Nyb2xsL3JlcG9zaXRpb24tc2Nyb2xsLXN0cmF0ZWd5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBVUEsT0FBTyxFQUFpQix3Q0FBd0MsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRzNGLE9BQU8sRUFBQyw0QkFBNEIsRUFBQyxNQUFNLHlCQUF5QixDQUFDOzs7OztBQUtyRSxvREFNQzs7Ozs7O0lBSkMsd0RBQXdCOzs7OztJQUd4QixtREFBb0I7Ozs7O0FBTXRCLE1BQU0sT0FBTyx3QkFBd0I7Ozs7Ozs7SUFJbkMsWUFDVSxpQkFBbUMsRUFDbkMsY0FBNkIsRUFDN0IsT0FBZSxFQUNmLE9BQXdDO1FBSHhDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBa0I7UUFDbkMsbUJBQWMsR0FBZCxjQUFjLENBQWU7UUFDN0IsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQUNmLFlBQU8sR0FBUCxPQUFPLENBQWlDO1FBUDFDLHdCQUFtQixHQUFzQixJQUFJLENBQUM7SUFPQSxDQUFDOzs7Ozs7SUFHdkQsTUFBTSxDQUFDLFVBQTRCO1FBQ2pDLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNwQixNQUFNLHdDQUF3QyxFQUFFLENBQUM7U0FDbEQ7UUFFRCxJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztJQUNoQyxDQUFDOzs7OztJQUdELE1BQU07UUFDSixJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFOztrQkFDdkIsUUFBUSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRS9ELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFNBQVM7OztZQUFDLEdBQUcsRUFBRTtnQkFDbEYsSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFFbEMsZ0ZBQWdGO2dCQUNoRixJQUFJLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7OzBCQUNwQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMscUJBQXFCLEVBQUU7MEJBQ3JFLEVBQUMsS0FBSyxFQUFFLE1BQU0sRUFBQyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsZUFBZSxFQUFFOzs7OzBCQUl2RCxXQUFXLEdBQUcsQ0FBQyxFQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBQyxDQUFDO29CQUVwRixJQUFJLDRCQUE0QixDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsRUFBRTt3QkFDMUQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUNmLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRzs7O3dCQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLEVBQUMsQ0FBQztxQkFDbkQ7aUJBQ0Y7WUFDSCxDQUFDLEVBQUMsQ0FBQztTQUNKO0lBQ0gsQ0FBQzs7Ozs7SUFHRCxPQUFPO1FBQ0wsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEVBQUU7WUFDNUIsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7U0FDakM7SUFDSCxDQUFDOzs7O0lBRUQsTUFBTTtRQUNKLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNmLElBQUksQ0FBQyxXQUFXLEdBQUcsbUJBQUEsSUFBSSxFQUFDLENBQUM7SUFDM0IsQ0FBQztDQUNGOzs7Ozs7SUF4REMsdURBQXNEOzs7OztJQUN0RCwrQ0FBc0M7Ozs7O0lBR3BDLHFEQUEyQzs7Ozs7SUFDM0Msa0RBQXFDOzs7OztJQUNyQywyQ0FBdUI7Ozs7O0lBQ3ZCLDJDQUFnRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge05nWm9uZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1N1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge1Njcm9sbFN0cmF0ZWd5LCBnZXRNYXRTY3JvbGxTdHJhdGVneUFscmVhZHlBdHRhY2hlZEVycm9yfSBmcm9tICcuL3Njcm9sbC1zdHJhdGVneSc7XG5pbXBvcnQge092ZXJsYXlSZWZlcmVuY2V9IGZyb20gJy4uL292ZXJsYXktcmVmZXJlbmNlJztcbmltcG9ydCB7U2Nyb2xsRGlzcGF0Y2hlciwgVmlld3BvcnRSdWxlcn0gZnJvbSAnQGFuZ3VsYXIvY2RrL3Njcm9sbGluZyc7XG5pbXBvcnQge2lzRWxlbWVudFNjcm9sbGVkT3V0c2lkZVZpZXd9IGZyb20gJy4uL3Bvc2l0aW9uL3Njcm9sbC1jbGlwJztcblxuLyoqXG4gKiBDb25maWcgb3B0aW9ucyBmb3IgdGhlIFJlcG9zaXRpb25TY3JvbGxTdHJhdGVneS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSZXBvc2l0aW9uU2Nyb2xsU3RyYXRlZ3lDb25maWcge1xuICAvKiogVGltZSBpbiBtaWxsaXNlY29uZHMgdG8gdGhyb3R0bGUgdGhlIHNjcm9sbCBldmVudHMuICovXG4gIHNjcm9sbFRocm90dGxlPzogbnVtYmVyO1xuXG4gIC8qKiBXaGV0aGVyIHRvIGNsb3NlIHRoZSBvdmVybGF5IG9uY2UgdGhlIHVzZXIgaGFzIHNjcm9sbGVkIGF3YXkgY29tcGxldGVseS4gKi9cbiAgYXV0b0Nsb3NlPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBTdHJhdGVneSB0aGF0IHdpbGwgdXBkYXRlIHRoZSBlbGVtZW50IHBvc2l0aW9uIGFzIHRoZSB1c2VyIGlzIHNjcm9sbGluZy5cbiAqL1xuZXhwb3J0IGNsYXNzIFJlcG9zaXRpb25TY3JvbGxTdHJhdGVneSBpbXBsZW1lbnRzIFNjcm9sbFN0cmF0ZWd5IHtcbiAgcHJpdmF0ZSBfc2Nyb2xsU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb258bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX292ZXJsYXlSZWY6IE92ZXJsYXlSZWZlcmVuY2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfc2Nyb2xsRGlzcGF0Y2hlcjogU2Nyb2xsRGlzcGF0Y2hlcixcbiAgICBwcml2YXRlIF92aWV3cG9ydFJ1bGVyOiBWaWV3cG9ydFJ1bGVyLFxuICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgIHByaXZhdGUgX2NvbmZpZz86IFJlcG9zaXRpb25TY3JvbGxTdHJhdGVneUNvbmZpZykgeyB9XG5cbiAgLyoqIEF0dGFjaGVzIHRoaXMgc2Nyb2xsIHN0cmF0ZWd5IHRvIGFuIG92ZXJsYXkuICovXG4gIGF0dGFjaChvdmVybGF5UmVmOiBPdmVybGF5UmVmZXJlbmNlKSB7XG4gICAgaWYgKHRoaXMuX292ZXJsYXlSZWYpIHtcbiAgICAgIHRocm93IGdldE1hdFNjcm9sbFN0cmF0ZWd5QWxyZWFkeUF0dGFjaGVkRXJyb3IoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9vdmVybGF5UmVmID0gb3ZlcmxheVJlZjtcbiAgfVxuXG4gIC8qKiBFbmFibGVzIHJlcG9zaXRpb25pbmcgb2YgdGhlIGF0dGFjaGVkIG92ZXJsYXkgb24gc2Nyb2xsLiAqL1xuICBlbmFibGUoKSB7XG4gICAgaWYgKCF0aGlzLl9zY3JvbGxTdWJzY3JpcHRpb24pIHtcbiAgICAgIGNvbnN0IHRocm90dGxlID0gdGhpcy5fY29uZmlnID8gdGhpcy5fY29uZmlnLnNjcm9sbFRocm90dGxlIDogMDtcblxuICAgICAgdGhpcy5fc2Nyb2xsU3Vic2NyaXB0aW9uID0gdGhpcy5fc2Nyb2xsRGlzcGF0Y2hlci5zY3JvbGxlZCh0aHJvdHRsZSkuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgdGhpcy5fb3ZlcmxheVJlZi51cGRhdGVQb3NpdGlvbigpO1xuXG4gICAgICAgIC8vIFRPRE8oY3Jpc2JldG8pOiBtYWtlIGBjbG9zZWAgb24gYnkgZGVmYXVsdCBvbmNlIGFsbCBjb21wb25lbnRzIGNhbiBoYW5kbGUgaXQuXG4gICAgICAgIGlmICh0aGlzLl9jb25maWcgJiYgdGhpcy5fY29uZmlnLmF1dG9DbG9zZSkge1xuICAgICAgICAgIGNvbnN0IG92ZXJsYXlSZWN0ID0gdGhpcy5fb3ZlcmxheVJlZi5vdmVybGF5RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICBjb25zdCB7d2lkdGgsIGhlaWdodH0gPSB0aGlzLl92aWV3cG9ydFJ1bGVyLmdldFZpZXdwb3J0U2l6ZSgpO1xuXG4gICAgICAgICAgLy8gVE9ETyhjcmlzYmV0byk6IGluY2x1ZGUgYWxsIGFuY2VzdG9yIHNjcm9sbCBjb250YWluZXJzIGhlcmUgb25jZVxuICAgICAgICAgIC8vIHdlIGhhdmUgYSB3YXkgb2YgZXhwb3NpbmcgdGhlIHRyaWdnZXIgZWxlbWVudCB0byB0aGUgc2Nyb2xsIHN0cmF0ZWd5LlxuICAgICAgICAgIGNvbnN0IHBhcmVudFJlY3RzID0gW3t3aWR0aCwgaGVpZ2h0LCBib3R0b206IGhlaWdodCwgcmlnaHQ6IHdpZHRoLCB0b3A6IDAsIGxlZnQ6IDB9XTtcblxuICAgICAgICAgIGlmIChpc0VsZW1lbnRTY3JvbGxlZE91dHNpZGVWaWV3KG92ZXJsYXlSZWN0LCBwYXJlbnRSZWN0cykpIHtcbiAgICAgICAgICAgIHRoaXMuZGlzYWJsZSgpO1xuICAgICAgICAgICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiB0aGlzLl9vdmVybGF5UmVmLmRldGFjaCgpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBEaXNhYmxlcyByZXBvc2l0aW9uaW5nIG9mIHRoZSBhdHRhY2hlZCBvdmVybGF5IG9uIHNjcm9sbC4gKi9cbiAgZGlzYWJsZSgpIHtcbiAgICBpZiAodGhpcy5fc2Nyb2xsU3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aGlzLl9zY3JvbGxTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMuX3Njcm9sbFN1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgZGV0YWNoKCkge1xuICAgIHRoaXMuZGlzYWJsZSgpO1xuICAgIHRoaXMuX292ZXJsYXlSZWYgPSBudWxsITtcbiAgfVxufVxuIl19