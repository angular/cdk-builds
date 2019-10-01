/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Class to be added to the overlay pane wrapper.
 * @type {?}
 */
const wrapperClass = 'cdk-global-overlay-wrapper';
/**
 * A strategy for positioning overlays. Using this strategy, an overlay is given an
 * explicit position relative to the browser's viewport. We use flexbox, instead of
 * transforms, in order to avoid issues with subpixel rendering which can cause the
 * element to become blurry.
 */
export class GlobalPositionStrategy {
    constructor() {
        this._cssPosition = 'static';
        this._topOffset = '';
        this._bottomOffset = '';
        this._leftOffset = '';
        this._rightOffset = '';
        this._alignItems = '';
        this._justifyContent = '';
        this._width = '';
        this._height = '';
    }
    /**
     * @param {?} overlayRef
     * @return {?}
     */
    attach(overlayRef) {
        /** @type {?} */
        const config = overlayRef.getConfig();
        this._overlayRef = overlayRef;
        if (this._width && !config.width) {
            overlayRef.updateSize({ width: this._width });
        }
        if (this._height && !config.height) {
            overlayRef.updateSize({ height: this._height });
        }
        overlayRef.hostElement.classList.add(wrapperClass);
        this._isDisposed = false;
    }
    /**
     * Sets the top position of the overlay. Clears any previously set vertical position.
     * @template THIS
     * @this {THIS}
     * @param {?=} value New top offset.
     * @return {THIS}
     */
    top(value = '') {
        (/** @type {?} */ (this))._bottomOffset = '';
        (/** @type {?} */ (this))._topOffset = value;
        (/** @type {?} */ (this))._alignItems = 'flex-start';
        return (/** @type {?} */ (this));
    }
    /**
     * Sets the left position of the overlay. Clears any previously set horizontal position.
     * @template THIS
     * @this {THIS}
     * @param {?=} value New left offset.
     * @return {THIS}
     */
    left(value = '') {
        (/** @type {?} */ (this))._rightOffset = '';
        (/** @type {?} */ (this))._leftOffset = value;
        (/** @type {?} */ (this))._justifyContent = 'flex-start';
        return (/** @type {?} */ (this));
    }
    /**
     * Sets the bottom position of the overlay. Clears any previously set vertical position.
     * @template THIS
     * @this {THIS}
     * @param {?=} value New bottom offset.
     * @return {THIS}
     */
    bottom(value = '') {
        (/** @type {?} */ (this))._topOffset = '';
        (/** @type {?} */ (this))._bottomOffset = value;
        (/** @type {?} */ (this))._alignItems = 'flex-end';
        return (/** @type {?} */ (this));
    }
    /**
     * Sets the right position of the overlay. Clears any previously set horizontal position.
     * @template THIS
     * @this {THIS}
     * @param {?=} value New right offset.
     * @return {THIS}
     */
    right(value = '') {
        (/** @type {?} */ (this))._leftOffset = '';
        (/** @type {?} */ (this))._rightOffset = value;
        (/** @type {?} */ (this))._justifyContent = 'flex-end';
        return (/** @type {?} */ (this));
    }
    /**
     * Sets the overlay width and clears any previously set width.
     * @deprecated Pass the `width` through the `OverlayConfig`.
     * \@breaking-change 8.0.0
     * @template THIS
     * @this {THIS}
     * @param {?=} value New width for the overlay
     * @return {THIS}
     */
    width(value = '') {
        if ((/** @type {?} */ (this))._overlayRef) {
            (/** @type {?} */ (this))._overlayRef.updateSize({ width: value });
        }
        else {
            (/** @type {?} */ (this))._width = value;
        }
        return (/** @type {?} */ (this));
    }
    /**
     * Sets the overlay height and clears any previously set height.
     * @deprecated Pass the `height` through the `OverlayConfig`.
     * \@breaking-change 8.0.0
     * @template THIS
     * @this {THIS}
     * @param {?=} value New height for the overlay
     * @return {THIS}
     */
    height(value = '') {
        if ((/** @type {?} */ (this))._overlayRef) {
            (/** @type {?} */ (this))._overlayRef.updateSize({ height: value });
        }
        else {
            (/** @type {?} */ (this))._height = value;
        }
        return (/** @type {?} */ (this));
    }
    /**
     * Centers the overlay horizontally with an optional offset.
     * Clears any previously set horizontal position.
     *
     * @template THIS
     * @this {THIS}
     * @param {?=} offset Overlay offset from the horizontal center.
     * @return {THIS}
     */
    centerHorizontally(offset = '') {
        (/** @type {?} */ (this)).left(offset);
        (/** @type {?} */ (this))._justifyContent = 'center';
        return (/** @type {?} */ (this));
    }
    /**
     * Centers the overlay vertically with an optional offset.
     * Clears any previously set vertical position.
     *
     * @template THIS
     * @this {THIS}
     * @param {?=} offset Overlay offset from the vertical center.
     * @return {THIS}
     */
    centerVertically(offset = '') {
        (/** @type {?} */ (this)).top(offset);
        (/** @type {?} */ (this))._alignItems = 'center';
        return (/** @type {?} */ (this));
    }
    /**
     * Apply the position to the element.
     * \@docs-private
     * @return {?}
     */
    apply() {
        // Since the overlay ref applies the strategy asynchronously, it could
        // have been disposed before it ends up being applied. If that is the
        // case, we shouldn't do anything.
        if (!this._overlayRef || !this._overlayRef.hasAttached()) {
            return;
        }
        /** @type {?} */
        const styles = this._overlayRef.overlayElement.style;
        /** @type {?} */
        const parentStyles = this._overlayRef.hostElement.style;
        /** @type {?} */
        const config = this._overlayRef.getConfig();
        styles.position = this._cssPosition;
        styles.marginLeft = config.width === '100%' ? '0' : this._leftOffset;
        styles.marginTop = config.height === '100%' ? '0' : this._topOffset;
        styles.marginBottom = this._bottomOffset;
        styles.marginRight = this._rightOffset;
        if (config.width === '100%') {
            parentStyles.justifyContent = 'flex-start';
        }
        else if (this._justifyContent === 'center') {
            parentStyles.justifyContent = 'center';
        }
        else if (this._overlayRef.getConfig().direction === 'rtl') {
            // In RTL the browser will invert `flex-start` and `flex-end` automatically, but we
            // don't want that because our positioning is explicitly `left` and `right`, hence
            // why we do another inversion to ensure that the overlay stays in the same position.
            // TODO: reconsider this if we add `start` and `end` methods.
            if (this._justifyContent === 'flex-start') {
                parentStyles.justifyContent = 'flex-end';
            }
            else if (this._justifyContent === 'flex-end') {
                parentStyles.justifyContent = 'flex-start';
            }
        }
        else {
            parentStyles.justifyContent = this._justifyContent;
        }
        parentStyles.alignItems = config.height === '100%' ? 'flex-start' : this._alignItems;
    }
    /**
     * Cleans up the DOM changes from the position strategy.
     * \@docs-private
     * @return {?}
     */
    dispose() {
        if (this._isDisposed || !this._overlayRef) {
            return;
        }
        /** @type {?} */
        const styles = this._overlayRef.overlayElement.style;
        /** @type {?} */
        const parent = this._overlayRef.hostElement;
        /** @type {?} */
        const parentStyles = parent.style;
        parent.classList.remove(wrapperClass);
        parentStyles.justifyContent = parentStyles.alignItems = styles.marginTop =
            styles.marginBottom = styles.marginLeft = styles.marginRight = styles.position = '';
        this._overlayRef = (/** @type {?} */ (null));
        this._isDisposed = true;
    }
}
if (false) {
    /**
     * The overlay to which this strategy is attached.
     * @type {?}
     * @private
     */
    GlobalPositionStrategy.prototype._overlayRef;
    /**
     * @type {?}
     * @private
     */
    GlobalPositionStrategy.prototype._cssPosition;
    /**
     * @type {?}
     * @private
     */
    GlobalPositionStrategy.prototype._topOffset;
    /**
     * @type {?}
     * @private
     */
    GlobalPositionStrategy.prototype._bottomOffset;
    /**
     * @type {?}
     * @private
     */
    GlobalPositionStrategy.prototype._leftOffset;
    /**
     * @type {?}
     * @private
     */
    GlobalPositionStrategy.prototype._rightOffset;
    /**
     * @type {?}
     * @private
     */
    GlobalPositionStrategy.prototype._alignItems;
    /**
     * @type {?}
     * @private
     */
    GlobalPositionStrategy.prototype._justifyContent;
    /**
     * @type {?}
     * @private
     */
    GlobalPositionStrategy.prototype._width;
    /**
     * @type {?}
     * @private
     */
    GlobalPositionStrategy.prototype._height;
    /**
     * @type {?}
     * @private
     */
    GlobalPositionStrategy.prototype._isDisposed;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFsLXBvc2l0aW9uLXN0cmF0ZWd5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vdmVybGF5L3Bvc2l0aW9uL2dsb2JhbC1wb3NpdGlvbi1zdHJhdGVneS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7TUFZTSxZQUFZLEdBQUcsNEJBQTRCOzs7Ozs7O0FBUWpELE1BQU0sT0FBTyxzQkFBc0I7SUFBbkM7UUFHVSxpQkFBWSxHQUFXLFFBQVEsQ0FBQztRQUNoQyxlQUFVLEdBQVcsRUFBRSxDQUFDO1FBQ3hCLGtCQUFhLEdBQVcsRUFBRSxDQUFDO1FBQzNCLGdCQUFXLEdBQVcsRUFBRSxDQUFDO1FBQ3pCLGlCQUFZLEdBQVcsRUFBRSxDQUFDO1FBQzFCLGdCQUFXLEdBQVcsRUFBRSxDQUFDO1FBQ3pCLG9CQUFlLEdBQVcsRUFBRSxDQUFDO1FBQzdCLFdBQU0sR0FBVyxFQUFFLENBQUM7UUFDcEIsWUFBTyxHQUFXLEVBQUUsQ0FBQztJQXVML0IsQ0FBQzs7Ozs7SUFwTEMsTUFBTSxDQUFDLFVBQTRCOztjQUMzQixNQUFNLEdBQUcsVUFBVSxDQUFDLFNBQVMsRUFBRTtRQUVyQyxJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztRQUU5QixJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO1lBQ2hDLFVBQVUsQ0FBQyxVQUFVLENBQUMsRUFBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBQyxDQUFDLENBQUM7U0FDN0M7UUFFRCxJQUFJLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO1lBQ2xDLFVBQVUsQ0FBQyxVQUFVLENBQUMsRUFBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBQyxDQUFDLENBQUM7U0FDL0M7UUFFRCxVQUFVLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxH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QztDQUNGOzs7Ozs7O0lBaE1DLDZDQUFzQzs7Ozs7SUFDdEMsOENBQXdDOzs7OztJQUN4Qyw0Q0FBZ0M7Ozs7O0lBQ2hDLCtDQUFtQzs7Ozs7SUFDbkMsNkNBQWlDOzs7OztJQUNqQyw4Q0FBa0M7Ozs7O0lBQ2xDLDZDQUFpQzs7Ozs7SUFDakMsaURBQXFDOzs7OztJQUNyQyx3Q0FBNEI7Ozs7O0lBQzVCLHlDQUE2Qjs7Ozs7SUFDN0IsNkNBQTZCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UG9zaXRpb25TdHJhdGVneX0gZnJvbSAnLi9wb3NpdGlvbi1zdHJhdGVneSc7XG5pbXBvcnQge092ZXJsYXlSZWZlcmVuY2V9IGZyb20gJy4uL292ZXJsYXktcmVmZXJlbmNlJztcblxuLyoqIENsYXNzIHRvIGJlIGFkZGVkIHRvIHRoZSBvdmVybGF5IHBhbmUgd3JhcHBlci4gKi9cbmNvbnN0IHdyYXBwZXJDbGFzcyA9ICdjZGstZ2xvYmFsLW92ZXJsYXktd3JhcHBlcic7XG5cbi8qKlxuICogQSBzdHJhdGVneSBmb3IgcG9zaXRpb25pbmcgb3ZlcmxheXMuIFVzaW5nIHRoaXMgc3RyYXRlZ3ksIGFuIG92ZXJsYXkgaXMgZ2l2ZW4gYW5cbiAqIGV4cGxpY2l0IHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSBicm93c2VyJ3Mgdmlld3BvcnQuIFdlIHVzZSBmbGV4Ym94LCBpbnN0ZWFkIG9mXG4gKiB0cmFuc2Zvcm1zLCBpbiBvcmRlciB0byBhdm9pZCBpc3N1ZXMgd2l0aCBzdWJwaXhlbCByZW5kZXJpbmcgd2hpY2ggY2FuIGNhdXNlIHRoZVxuICogZWxlbWVudCB0byBiZWNvbWUgYmx1cnJ5LlxuICovXG5leHBvcnQgY2xhc3MgR2xvYmFsUG9zaXRpb25TdHJhdGVneSBpbXBsZW1lbnRzIFBvc2l0aW9uU3RyYXRlZ3kge1xuICAvKiogVGhlIG92ZXJsYXkgdG8gd2hpY2ggdGhpcyBzdHJhdGVneSBpcyBhdHRhY2hlZC4gKi9cbiAgcHJpdmF0ZSBfb3ZlcmxheVJlZjogT3ZlcmxheVJlZmVyZW5jZTtcbiAgcHJpdmF0ZSBfY3NzUG9zaXRpb246IHN0cmluZyA9ICdzdGF0aWMnO1xuICBwcml2YXRlIF90b3BPZmZzZXQ6IHN0cmluZyA9ICcnO1xuICBwcml2YXRlIF9ib3R0b21PZmZzZXQ6IHN0cmluZyA9ICcnO1xuICBwcml2YXRlIF9sZWZ0T2Zmc2V0OiBzdHJpbmcgPSAnJztcbiAgcHJpdmF0ZSBfcmlnaHRPZmZzZXQ6IHN0cmluZyA9ICcnO1xuICBwcml2YXRlIF9hbGlnbkl0ZW1zOiBzdHJpbmcgPSAnJztcbiAgcHJpdmF0ZSBfanVzdGlmeUNvbnRlbnQ6IHN0cmluZyA9ICcnO1xuICBwcml2YXRlIF93aWR0aDogc3RyaW5nID0gJyc7XG4gIHByaXZhdGUgX2hlaWdodDogc3RyaW5nID0gJyc7XG4gIHByaXZhdGUgX2lzRGlzcG9zZWQ6IGJvb2xlYW47XG5cbiAgYXR0YWNoKG92ZXJsYXlSZWY6IE92ZXJsYXlSZWZlcmVuY2UpOiB2b2lkIHtcbiAgICBjb25zdCBjb25maWcgPSBvdmVybGF5UmVmLmdldENvbmZpZygpO1xuXG4gICAgdGhpcy5fb3ZlcmxheVJlZiA9IG92ZXJsYXlSZWY7XG5cbiAgICBpZiAodGhpcy5fd2lkdGggJiYgIWNvbmZpZy53aWR0aCkge1xuICAgICAgb3ZlcmxheVJlZi51cGRhdGVTaXplKHt3aWR0aDogdGhpcy5fd2lkdGh9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5faGVpZ2h0ICYmICFjb25maWcuaGVpZ2h0KSB7XG4gICAgICBvdmVybGF5UmVmLnVwZGF0ZVNpemUoe2hlaWdodDogdGhpcy5faGVpZ2h0fSk7XG4gICAgfVxuXG4gICAgb3ZlcmxheVJlZi5ob3N0RWxlbWVudC5jbGFzc0xpc3QuYWRkKHdyYXBwZXJDbGFzcyk7XG4gICAgdGhpcy5faXNEaXNwb3NlZCA9IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHRvcCBwb3NpdGlvbiBvZiB0aGUgb3ZlcmxheS4gQ2xlYXJzIGFueSBwcmV2aW91c2x5IHNldCB2ZXJ0aWNhbCBwb3NpdGlvbi5cbiAgICogQHBhcmFtIHZhbHVlIE5ldyB0b3Agb2Zmc2V0LlxuICAgKi9cbiAgdG9wKHZhbHVlOiBzdHJpbmcgPSAnJyk6IHRoaXMge1xuICAgIHRoaXMuX2JvdHRvbU9mZnNldCA9ICcnO1xuICAgIHRoaXMuX3RvcE9mZnNldCA9IHZhbHVlO1xuICAgIHRoaXMuX2FsaWduSXRlbXMgPSAnZmxleC1zdGFydCc7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbGVmdCBwb3NpdGlvbiBvZiB0aGUgb3ZlcmxheS4gQ2xlYXJzIGFueSBwcmV2aW91c2x5IHNldCBob3Jpem9udGFsIHBvc2l0aW9uLlxuICAgKiBAcGFyYW0gdmFsdWUgTmV3IGxlZnQgb2Zmc2V0LlxuICAgKi9cbiAgbGVmdCh2YWx1ZTogc3RyaW5nID0gJycpOiB0aGlzIHtcbiAgICB0aGlzLl9yaWdodE9mZnNldCA9ICcnO1xuICAgIHRoaXMuX2xlZnRPZmZzZXQgPSB2YWx1ZTtcbiAgICB0aGlzLl9qdXN0aWZ5Q29udGVudCA9ICdmbGV4LXN0YXJ0JztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBib3R0b20gcG9zaXRpb24gb2YgdGhlIG92ZXJsYXkuIENsZWFycyBhbnkgcHJldmlvdXNseSBzZXQgdmVydGljYWwgcG9zaXRpb24uXG4gICAqIEBwYXJhbSB2YWx1ZSBOZXcgYm90dG9tIG9mZnNldC5cbiAgICovXG4gIGJvdHRvbSh2YWx1ZTogc3RyaW5nID0gJycpOiB0aGlzIHtcbiAgICB0aGlzLl90b3BPZmZzZXQgPSAnJztcbiAgICB0aGlzLl9ib3R0b21PZmZzZXQgPSB2YWx1ZTtcbiAgICB0aGlzLl9hbGlnbkl0ZW1zID0gJ2ZsZXgtZW5kJztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSByaWdodCBwb3NpdGlvbiBvZiB0aGUgb3ZlcmxheS4gQ2xlYXJzIGFueSBwcmV2aW91c2x5IHNldCBob3Jpem9udGFsIHBvc2l0aW9uLlxuICAgKiBAcGFyYW0gdmFsdWUgTmV3IHJpZ2h0IG9mZnNldC5cbiAgICovXG4gIHJpZ2h0KHZhbHVlOiBzdHJpbmcgPSAnJyk6IHRoaXMge1xuICAgIHRoaXMuX2xlZnRPZmZzZXQgPSAnJztcbiAgICB0aGlzLl9yaWdodE9mZnNldCA9IHZhbHVlO1xuICAgIHRoaXMuX2p1c3RpZnlDb250ZW50ID0gJ2ZsZXgtZW5kJztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBvdmVybGF5IHdpZHRoIGFuZCBjbGVhcnMgYW55IHByZXZpb3VzbHkgc2V0IHdpZHRoLlxuICAgKiBAcGFyYW0gdmFsdWUgTmV3IHdpZHRoIGZvciB0aGUgb3ZlcmxheVxuICAgKiBAZGVwcmVjYXRlZCBQYXNzIHRoZSBgd2lkdGhgIHRocm91Z2ggdGhlIGBPdmVybGF5Q29uZmlnYC5cbiAgICogQGJyZWFraW5nLWNoYW5nZSA4LjAuMFxuICAgKi9cbiAgd2lkdGgodmFsdWU6IHN0cmluZyA9ICcnKTogdGhpcyB7XG4gICAgaWYgKHRoaXMuX292ZXJsYXlSZWYpIHtcbiAgICAgIHRoaXMuX292ZXJsYXlSZWYudXBkYXRlU2l6ZSh7d2lkdGg6IHZhbHVlfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3dpZHRoID0gdmFsdWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgb3ZlcmxheSBoZWlnaHQgYW5kIGNsZWFycyBhbnkgcHJldmlvdXNseSBzZXQgaGVpZ2h0LlxuICAgKiBAcGFyYW0gdmFsdWUgTmV3IGhlaWdodCBmb3IgdGhlIG92ZXJsYXlcbiAgICogQGRlcHJlY2F0ZWQgUGFzcyB0aGUgYGhlaWdodGAgdGhyb3VnaCB0aGUgYE92ZXJsYXlDb25maWdgLlxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDguMC4wXG4gICAqL1xuICBoZWlnaHQodmFsdWU6IHN0cmluZyA9ICcnKTogdGhpcyB7XG4gICAgaWYgKHRoaXMuX292ZXJsYXlSZWYpIHtcbiAgICAgIHRoaXMuX292ZXJsYXlSZWYudXBkYXRlU2l6ZSh7aGVpZ2h0OiB2YWx1ZX0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9oZWlnaHQgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDZW50ZXJzIHRoZSBvdmVybGF5IGhvcml6b250YWxseSB3aXRoIGFuIG9wdGlvbmFsIG9mZnNldC5cbiAgICogQ2xlYXJzIGFueSBwcmV2aW91c2x5IHNldCBob3Jpem9udGFsIHBvc2l0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gb2Zmc2V0IE92ZXJsYXkgb2Zmc2V0IGZyb20gdGhlIGhvcml6b250YWwgY2VudGVyLlxuICAgKi9cbiAgY2VudGVySG9yaXpvbnRhbGx5KG9mZnNldDogc3RyaW5nID0gJycpOiB0aGlzIHtcbiAgICB0aGlzLmxlZnQob2Zmc2V0KTtcbiAgICB0aGlzLl9qdXN0aWZ5Q29udGVudCA9ICdjZW50ZXInO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENlbnRlcnMgdGhlIG92ZXJsYXkgdmVydGljYWxseSB3aXRoIGFuIG9wdGlvbmFsIG9mZnNldC5cbiAgICogQ2xlYXJzIGFueSBwcmV2aW91c2x5IHNldCB2ZXJ0aWNhbCBwb3NpdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIG9mZnNldCBPdmVybGF5IG9mZnNldCBmcm9tIHRoZSB2ZXJ0aWNhbCBjZW50ZXIuXG4gICAqL1xuICBjZW50ZXJWZXJ0aWNhbGx5KG9mZnNldDogc3RyaW5nID0gJycpOiB0aGlzIHtcbiAgICB0aGlzLnRvcChvZmZzZXQpO1xuICAgIHRoaXMuX2FsaWduSXRlbXMgPSAnY2VudGVyJztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBseSB0aGUgcG9zaXRpb24gdG8gdGhlIGVsZW1lbnQuXG4gICAqIEBkb2NzLXByaXZhdGVcbiAgICovXG4gIGFwcGx5KCk6IHZvaWQge1xuICAgIC8vIFNpbmNlIHRoZSBvdmVybGF5IHJlZiBhcHBsaWVzIHRoZSBzdHJhdGVneSBhc3luY2hyb25vdXNseSwgaXQgY291bGRcbiAgICAvLyBoYXZlIGJlZW4gZGlzcG9zZWQgYmVmb3JlIGl0IGVuZHMgdXAgYmVpbmcgYXBwbGllZC4gSWYgdGhhdCBpcyB0aGVcbiAgICAvLyBjYXNlLCB3ZSBzaG91bGRuJ3QgZG8gYW55dGhpbmcuXG4gICAgaWYgKCF0aGlzLl9vdmVybGF5UmVmIHx8ICF0aGlzLl9vdmVybGF5UmVmLmhhc0F0dGFjaGVkKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzdHlsZXMgPSB0aGlzLl9vdmVybGF5UmVmLm92ZXJsYXlFbGVtZW50LnN0eWxlO1xuICAgIGNvbnN0IHBhcmVudFN0eWxlcyA9IHRoaXMuX292ZXJsYXlSZWYuaG9zdEVsZW1lbnQuc3R5bGU7XG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5fb3ZlcmxheVJlZi5nZXRDb25maWcoKTtcblxuICAgIHN0eWxlcy5wb3NpdGlvbiA9IHRoaXMuX2Nzc1Bvc2l0aW9uO1xuICAgIHN0eWxlcy5tYXJnaW5MZWZ0ID0gY29uZmlnLndpZHRoID09PSAnMTAwJScgPyAnMCcgOiB0aGlzLl9sZWZ0T2Zmc2V0O1xuICAgIHN0eWxlcy5tYXJnaW5Ub3AgPSBjb25maWcuaGVpZ2h0ID09PSAnMTAwJScgPyAnMCcgOiB0aGlzLl90b3BPZmZzZXQ7XG4gICAgc3R5bGVzLm1hcmdpbkJvdHRvbSA9IHRoaXMuX2JvdHRvbU9mZnNldDtcbiAgICBzdHlsZXMubWFyZ2luUmlnaHQgPSB0aGlzLl9yaWdodE9mZnNldDtcblxuICAgIGlmIChjb25maWcud2lkdGggPT09ICcxMDAlJykge1xuICAgICAgcGFyZW50U3R5bGVzLmp1c3RpZnlDb250ZW50ID0gJ2ZsZXgtc3RhcnQnO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fanVzdGlmeUNvbnRlbnQgPT09ICdjZW50ZXInKSB7XG4gICAgICBwYXJlbnRTdHlsZXMuanVzdGlmeUNvbnRlbnQgPSAnY2VudGVyJztcbiAgICB9IGVsc2UgaWYgKHRoaXMuX292ZXJsYXlSZWYuZ2V0Q29uZmlnKCkuZGlyZWN0aW9uID09PSAncnRsJykge1xuICAgICAgLy8gSW4gUlRMIHRoZSBicm93c2VyIHdpbGwgaW52ZXJ0IGBmbGV4LXN0YXJ0YCBhbmQgYGZsZXgtZW5kYCBhdXRvbWF0aWNhbGx5LCBidXQgd2VcbiAgICAgIC8vIGRvbid0IHdhbnQgdGhhdCBiZWNhdXNlIG91ciBwb3NpdGlvbmluZyBpcyBleHBsaWNpdGx5IGBsZWZ0YCBhbmQgYHJpZ2h0YCwgaGVuY2VcbiAgICAgIC8vIHdoeSB3ZSBkbyBhbm90aGVyIGludmVyc2lvbiB0byBlbnN1cmUgdGhhdCB0aGUgb3ZlcmxheSBzdGF5cyBpbiB0aGUgc2FtZSBwb3NpdGlvbi5cbiAgICAgIC8vIFRPRE86IHJlY29uc2lkZXIgdGhpcyBpZiB3ZSBhZGQgYHN0YXJ0YCBhbmQgYGVuZGAgbWV0aG9kcy5cbiAgICAgIGlmICh0aGlzLl9qdXN0aWZ5Q29udGVudCA9PT0gJ2ZsZXgtc3RhcnQnKSB7XG4gICAgICAgIHBhcmVudFN0eWxlcy5qdXN0aWZ5Q29udGVudCA9ICdmbGV4LWVuZCc7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX2p1c3RpZnlDb250ZW50ID09PSAnZmxleC1lbmQnKSB7XG4gICAgICAgIHBhcmVudFN0eWxlcy5qdXN0aWZ5Q29udGVudCA9ICdmbGV4LXN0YXJ0JztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGFyZW50U3R5bGVzLmp1c3RpZnlDb250ZW50ID0gdGhpcy5fanVzdGlmeUNvbnRlbnQ7XG4gICAgfVxuXG4gICAgcGFyZW50U3R5bGVzLmFsaWduSXRlbXMgPSBjb25maWcuaGVpZ2h0ID09PSAnMTAwJScgPyAnZmxleC1zdGFydCcgOiB0aGlzLl9hbGlnbkl0ZW1zO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFucyB1cCB0aGUgRE9NIGNoYW5nZXMgZnJvbSB0aGUgcG9zaXRpb24gc3RyYXRlZ3kuXG4gICAqIEBkb2NzLXByaXZhdGVcbiAgICovXG4gIGRpc3Bvc2UoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2lzRGlzcG9zZWQgfHwgIXRoaXMuX292ZXJsYXlSZWYpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzdHlsZXMgPSB0aGlzLl9vdmVybGF5UmVmLm92ZXJsYXlFbGVtZW50LnN0eWxlO1xuICAgIGNvbnN0IHBhcmVudCA9IHRoaXMuX292ZXJsYXlSZWYuaG9zdEVsZW1lbnQ7XG4gICAgY29uc3QgcGFyZW50U3R5bGVzID0gcGFyZW50LnN0eWxlO1xuXG4gICAgcGFyZW50LmNsYXNzTGlzdC5yZW1vdmUod3JhcHBlckNsYXNzKTtcbiAgICBwYXJlbnRTdHlsZXMuanVzdGlmeUNvbnRlbnQgPSBwYXJlbnRTdHlsZXMuYWxpZ25JdGVtcyA9IHN0eWxlcy5tYXJnaW5Ub3AgPVxuICAgICAgc3R5bGVzLm1hcmdpbkJvdHRvbSA9IHN0eWxlcy5tYXJnaW5MZWZ0ID0gc3R5bGVzLm1hcmdpblJpZ2h0ID0gc3R5bGVzLnBvc2l0aW9uID0gJyc7XG5cbiAgICB0aGlzLl9vdmVybGF5UmVmID0gbnVsbCE7XG4gICAgdGhpcy5faXNEaXNwb3NlZCA9IHRydWU7XG4gIH1cbn1cbiJdfQ==