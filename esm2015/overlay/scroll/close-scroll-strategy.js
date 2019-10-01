/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { getMatScrollStrategyAlreadyAttachedError } from './scroll-strategy';
/**
 * Config options for the CloseScrollStrategy.
 * @record
 */
export function CloseScrollStrategyConfig() { }
if (false) {
    /**
     * Amount of pixels the user has to scroll before the overlay is closed.
     * @type {?|undefined}
     */
    CloseScrollStrategyConfig.prototype.threshold;
}
/**
 * Strategy that will close the overlay as soon as the user starts scrolling.
 */
export class CloseScrollStrategy {
    /**
     * @param {?} _scrollDispatcher
     * @param {?} _ngZone
     * @param {?} _viewportRuler
     * @param {?=} _config
     */
    constructor(_scrollDispatcher, _ngZone, _viewportRuler, _config) {
        this._scrollDispatcher = _scrollDispatcher;
        this._ngZone = _ngZone;
        this._viewportRuler = _viewportRuler;
        this._config = _config;
        this._scrollSubscription = null;
        /**
         * Detaches the overlay ref and disables the scroll strategy.
         */
        this._detach = (/**
         * @return {?}
         */
        () => {
            this.disable();
            if (this._overlayRef.hasAttached()) {
                this._ngZone.run((/**
                 * @return {?}
                 */
                () => this._overlayRef.detach()));
            }
        });
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
     * Enables the closing of the attached overlay on scroll.
     * @return {?}
     */
    enable() {
        if (this._scrollSubscription) {
            return;
        }
        /** @type {?} */
        const stream = this._scrollDispatcher.scrolled(0);
        if (this._config && this._config.threshold && this._config.threshold > 1) {
            this._initialScrollPosition = this._viewportRuler.getViewportScrollPosition().top;
            this._scrollSubscription = stream.subscribe((/**
             * @return {?}
             */
            () => {
                /** @type {?} */
                const scrollPosition = this._viewportRuler.getViewportScrollPosition().top;
                if (Math.abs(scrollPosition - this._initialScrollPosition) > (/** @type {?} */ ((/** @type {?} */ (this._config)).threshold))) {
                    this._detach();
                }
                else {
                    this._overlayRef.updatePosition();
                }
            }));
        }
        else {
            this._scrollSubscription = stream.subscribe(this._detach);
        }
    }
    /**
     * Disables the closing the attached overlay on scroll.
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
    CloseScrollStrategy.prototype._scrollSubscription;
    /**
     * @type {?}
     * @private
     */
    CloseScrollStrategy.prototype._overlayRef;
    /**
     * @type {?}
     * @private
     */
    CloseScrollStrategy.prototype._initialScrollPosition;
    /**
     * Detaches the overlay ref and disables the scroll strategy.
     * @type {?}
     * @private
     */
    CloseScrollStrategy.prototype._detach;
    /**
     * @type {?}
     * @private
     */
    CloseScrollStrategy.prototype._scrollDispatcher;
    /**
     * @type {?}
     * @private
     */
    CloseScrollStrategy.prototype._ngZone;
    /**
     * @type {?}
     * @private
     */
    CloseScrollStrategy.prototype._viewportRuler;
    /**
     * @type {?}
     * @private
     */
    CloseScrollStrategy.prototype._config;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xvc2Utc2Nyb2xsLXN0cmF0ZWd5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vdmVybGF5L3Njcm9sbC9jbG9zZS1zY3JvbGwtc3RyYXRlZ3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVFBLE9BQU8sRUFBaUIsd0NBQXdDLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQzs7Ozs7QUFRM0YsK0NBR0M7Ozs7OztJQURDLDhDQUFtQjs7Ozs7QUFNckIsTUFBTSxPQUFPLG1CQUFtQjs7Ozs7OztJQUs5QixZQUNVLGlCQUFtQyxFQUNuQyxPQUFlLEVBQ2YsY0FBNkIsRUFDN0IsT0FBbUM7UUFIbkMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFrQjtRQUNuQyxZQUFPLEdBQVAsT0FBTyxDQUFRO1FBQ2YsbUJBQWMsR0FBZCxjQUFjLENBQWU7UUFDN0IsWUFBTyxHQUFQLE9BQU8sQ0FBNEI7UUFSckMsd0JBQW1CLEdBQXNCLElBQUksQ0FBQzs7OztRQTBEOUMsWUFBTzs7O1FBQUcsR0FBRyxFQUFFO1lBQ3JCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUVmLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLEVBQUUsRUFBRTtnQkFDbEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHOzs7Z0JBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsRUFBQyxDQUFDO2FBQ25EO1FBQ0gsQ0FBQyxFQUFBO0lBeEQrQyxDQUFDOzs7Ozs7SUFHakQsTUFBTSxDQUFDLFVBQTRCO1FBQ2pDLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNwQixNQUFNLHdDQUF3QyxFQUFFLENBQUM7U0FDbEQ7UUFFRCxJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztJQUNoQyxDQUFDOzs7OztJQUdELE1BQU07UUFDSixJQUFJLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtZQUM1QixPQUFPO1NBQ1I7O2NBRUssTUFBTSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBRWpELElBQUksSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxDQUFDLEVBQUU7WUFDeEUsSUFBSSxDQUFDLHNCQUFzQixHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMseUJBQXlCLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFFbEYsSUFBSSxDQUFDLG1CQUFtQixHQUFHLE1BQU0sQ0FBQyxTQUFTOzs7WUFBQyxHQUFHLEVBQUU7O3NCQUN6QyxjQUFjLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyx5QkFBeUIsRUFBRSxDQUFDLEdBQUc7Z0JBRTFFLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEdBQUcsbUJBQUEsbUJBQUEsSUFBSSxDQUFDLE9BQU8sRUFBQyxDQUFDLFNBQVMsRUFBQyxFQUFFO29CQUNyRixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7aUJBQ2hCO3FCQUFNO29CQUNMLElBQUksQ0FBQyxXQUFXLENBQUMsY0FBYyxFQUFFLENBQUM7aUJBQ25DO1lBQ0gsQ0FBQyxFQUFDLENBQUM7U0FDSjthQUFNO1lBQ0wsSUFBSSxDQUFDLG1CQUFtQixHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQzNEO0lBQ0gsQ0FBQzs7Ozs7SUFHRCxPQUFPO1FBQ0wsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEVBQUU7WUFDNUIsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7U0FDakM7SUFDSCxDQUFDOzs7O0lBRUQsTUFBTTtRQUNKLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNmLElBQUksQ0FBQyxXQUFXLEdBQUcsbUJBQUEsSUFBSSxFQUFDLENBQUM7SUFDM0IsQ0FBQztDQVVGOzs7Ozs7SUFqRUMsa0RBQXNEOzs7OztJQUN0RCwwQ0FBc0M7Ozs7O0lBQ3RDLHFEQUF1Qzs7Ozs7O0lBd0R2QyxzQ0FNQzs7Ozs7SUEzREMsZ0RBQTJDOzs7OztJQUMzQyxzQ0FBdUI7Ozs7O0lBQ3ZCLDZDQUFxQzs7Ozs7SUFDckMsc0NBQTJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge05nWm9uZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1Njcm9sbFN0cmF0ZWd5LCBnZXRNYXRTY3JvbGxTdHJhdGVneUFscmVhZHlBdHRhY2hlZEVycm9yfSBmcm9tICcuL3Njcm9sbC1zdHJhdGVneSc7XG5pbXBvcnQge092ZXJsYXlSZWZlcmVuY2V9IGZyb20gJy4uL292ZXJsYXktcmVmZXJlbmNlJztcbmltcG9ydCB7U3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcbmltcG9ydCB7U2Nyb2xsRGlzcGF0Y2hlciwgVmlld3BvcnRSdWxlcn0gZnJvbSAnQGFuZ3VsYXIvY2RrL3Njcm9sbGluZyc7XG5cbi8qKlxuICogQ29uZmlnIG9wdGlvbnMgZm9yIHRoZSBDbG9zZVNjcm9sbFN0cmF0ZWd5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIENsb3NlU2Nyb2xsU3RyYXRlZ3lDb25maWcge1xuICAvKiogQW1vdW50IG9mIHBpeGVscyB0aGUgdXNlciBoYXMgdG8gc2Nyb2xsIGJlZm9yZSB0aGUgb3ZlcmxheSBpcyBjbG9zZWQuICovXG4gIHRocmVzaG9sZD86IG51bWJlcjtcbn1cblxuLyoqXG4gKiBTdHJhdGVneSB0aGF0IHdpbGwgY2xvc2UgdGhlIG92ZXJsYXkgYXMgc29vbiBhcyB0aGUgdXNlciBzdGFydHMgc2Nyb2xsaW5nLlxuICovXG5leHBvcnQgY2xhc3MgQ2xvc2VTY3JvbGxTdHJhdGVneSBpbXBsZW1lbnRzIFNjcm9sbFN0cmF0ZWd5IHtcbiAgcHJpdmF0ZSBfc2Nyb2xsU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb258bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX292ZXJsYXlSZWY6IE92ZXJsYXlSZWZlcmVuY2U7XG4gIHByaXZhdGUgX2luaXRpYWxTY3JvbGxQb3NpdGlvbjogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgX3Njcm9sbERpc3BhdGNoZXI6IFNjcm9sbERpc3BhdGNoZXIsXG4gICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgcHJpdmF0ZSBfdmlld3BvcnRSdWxlcjogVmlld3BvcnRSdWxlcixcbiAgICBwcml2YXRlIF9jb25maWc/OiBDbG9zZVNjcm9sbFN0cmF0ZWd5Q29uZmlnKSB7fVxuXG4gIC8qKiBBdHRhY2hlcyB0aGlzIHNjcm9sbCBzdHJhdGVneSB0byBhbiBvdmVybGF5LiAqL1xuICBhdHRhY2gob3ZlcmxheVJlZjogT3ZlcmxheVJlZmVyZW5jZSkge1xuICAgIGlmICh0aGlzLl9vdmVybGF5UmVmKSB7XG4gICAgICB0aHJvdyBnZXRNYXRTY3JvbGxTdHJhdGVneUFscmVhZHlBdHRhY2hlZEVycm9yKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fb3ZlcmxheVJlZiA9IG92ZXJsYXlSZWY7XG4gIH1cblxuICAvKiogRW5hYmxlcyB0aGUgY2xvc2luZyBvZiB0aGUgYXR0YWNoZWQgb3ZlcmxheSBvbiBzY3JvbGwuICovXG4gIGVuYWJsZSgpIHtcbiAgICBpZiAodGhpcy5fc2Nyb2xsU3Vic2NyaXB0aW9uKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc3RyZWFtID0gdGhpcy5fc2Nyb2xsRGlzcGF0Y2hlci5zY3JvbGxlZCgwKTtcblxuICAgIGlmICh0aGlzLl9jb25maWcgJiYgdGhpcy5fY29uZmlnLnRocmVzaG9sZCAmJiB0aGlzLl9jb25maWcudGhyZXNob2xkID4gMSkge1xuICAgICAgdGhpcy5faW5pdGlhbFNjcm9sbFBvc2l0aW9uID0gdGhpcy5fdmlld3BvcnRSdWxlci5nZXRWaWV3cG9ydFNjcm9sbFBvc2l0aW9uKCkudG9wO1xuXG4gICAgICB0aGlzLl9zY3JvbGxTdWJzY3JpcHRpb24gPSBzdHJlYW0uc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgY29uc3Qgc2Nyb2xsUG9zaXRpb24gPSB0aGlzLl92aWV3cG9ydFJ1bGVyLmdldFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24oKS50b3A7XG5cbiAgICAgICAgaWYgKE1hdGguYWJzKHNjcm9sbFBvc2l0aW9uIC0gdGhpcy5faW5pdGlhbFNjcm9sbFBvc2l0aW9uKSA+IHRoaXMuX2NvbmZpZyEudGhyZXNob2xkISkge1xuICAgICAgICAgIHRoaXMuX2RldGFjaCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX292ZXJsYXlSZWYudXBkYXRlUG9zaXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3Njcm9sbFN1YnNjcmlwdGlvbiA9IHN0cmVhbS5zdWJzY3JpYmUodGhpcy5fZGV0YWNoKTtcbiAgICB9XG4gIH1cblxuICAvKiogRGlzYWJsZXMgdGhlIGNsb3NpbmcgdGhlIGF0dGFjaGVkIG92ZXJsYXkgb24gc2Nyb2xsLiAqL1xuICBkaXNhYmxlKCkge1xuICAgIGlmICh0aGlzLl9zY3JvbGxTdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuX3Njcm9sbFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5fc2Nyb2xsU3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBkZXRhY2goKSB7XG4gICAgdGhpcy5kaXNhYmxlKCk7XG4gICAgdGhpcy5fb3ZlcmxheVJlZiA9IG51bGwhO1xuICB9XG5cbiAgLyoqIERldGFjaGVzIHRoZSBvdmVybGF5IHJlZiBhbmQgZGlzYWJsZXMgdGhlIHNjcm9sbCBzdHJhdGVneS4gKi9cbiAgcHJpdmF0ZSBfZGV0YWNoID0gKCkgPT4ge1xuICAgIHRoaXMuZGlzYWJsZSgpO1xuXG4gICAgaWYgKHRoaXMuX292ZXJsYXlSZWYuaGFzQXR0YWNoZWQoKSkge1xuICAgICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiB0aGlzLl9vdmVybGF5UmVmLmRldGFjaCgpKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==