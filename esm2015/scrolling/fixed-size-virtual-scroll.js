/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/scrolling/fixed-size-virtual-scroll.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { coerceNumberProperty } from '@angular/cdk/coercion';
import { Directive, forwardRef, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { VIRTUAL_SCROLL_STRATEGY } from './virtual-scroll-strategy';
/**
 * Virtual scrolling strategy for lists with items of known fixed size.
 */
export class FixedSizeVirtualScrollStrategy {
    /**
     * @param {?} itemSize The size of the items in the virtually scrolling list.
     * @param {?} minBufferPx The minimum amount of buffer (in pixels) before needing to render more
     * @param {?} maxBufferPx The amount of buffer (in pixels) to render when rendering more.
     */
    constructor(itemSize, minBufferPx, maxBufferPx) {
        this._scrolledIndexChange = new Subject();
        /**
         * \@docs-private Implemented as part of VirtualScrollStrategy.
         */
        this.scrolledIndexChange = this._scrolledIndexChange.pipe(distinctUntilChanged());
        /**
         * The attached viewport.
         */
        this._viewport = null;
        this._itemSize = itemSize;
        this._minBufferPx = minBufferPx;
        this._maxBufferPx = maxBufferPx;
    }
    /**
     * Attaches this scroll strategy to a viewport.
     * @param {?} viewport The viewport to attach this strategy to.
     * @return {?}
     */
    attach(viewport) {
        this._viewport = viewport;
        this._updateTotalContentSize();
        this._updateRenderedRange();
    }
    /**
     * Detaches this scroll strategy from the currently attached viewport.
     * @return {?}
     */
    detach() {
        this._scrolledIndexChange.complete();
        this._viewport = null;
    }
    /**
     * Update the item size and buffer size.
     * @param {?} itemSize The size of the items in the virtually scrolling list.
     * @param {?} minBufferPx The minimum amount of buffer (in pixels) before needing to render more
     * @param {?} maxBufferPx The amount of buffer (in pixels) to render when rendering more.
     * @return {?}
     */
    updateItemAndBufferSize(itemSize, minBufferPx, maxBufferPx) {
        if (maxBufferPx < minBufferPx) {
            throw Error('CDK virtual scroll: maxBufferPx must be greater than or equal to minBufferPx');
        }
        this._itemSize = itemSize;
        this._minBufferPx = minBufferPx;
        this._maxBufferPx = maxBufferPx;
        this._updateTotalContentSize();
        this._updateRenderedRange();
    }
    /**
     * \@docs-private Implemented as part of VirtualScrollStrategy.
     * @return {?}
     */
    onContentScrolled() {
        this._updateRenderedRange();
    }
    /**
     * \@docs-private Implemented as part of VirtualScrollStrategy.
     * @return {?}
     */
    onDataLengthChanged() {
        this._updateTotalContentSize();
        this._updateRenderedRange();
    }
    /**
     * \@docs-private Implemented as part of VirtualScrollStrategy.
     * @return {?}
     */
    onContentRendered() { }
    /**
     * \@docs-private Implemented as part of VirtualScrollStrategy.
     * @return {?}
     */
    onRenderedOffsetChanged() { }
    /**
     * Scroll to the offset for the given index.
     * @param {?} index The index of the element to scroll to.
     * @param {?} behavior The ScrollBehavior to use when scrolling.
     * @return {?}
     */
    scrollToIndex(index, behavior) {
        if (this._viewport) {
            this._viewport.scrollToOffset(index * this._itemSize, behavior);
        }
    }
    /**
     * Update the viewport's total content size.
     * @private
     * @return {?}
     */
    _updateTotalContentSize() {
        if (!this._viewport) {
            return;
        }
        this._viewport.setTotalContentSize(this._viewport.getDataLength() * this._itemSize);
    }
    /**
     * Update the viewport's rendered range.
     * @private
     * @return {?}
     */
    _updateRenderedRange() {
        if (!this._viewport) {
            return;
        }
        /** @type {?} */
        const scrollOffset = this._viewport.measureScrollOffset();
        /** @type {?} */
        const firstVisibleIndex = scrollOffset / this._itemSize;
        /** @type {?} */
        const renderedRange = this._viewport.getRenderedRange();
        /** @type {?} */
        const newRange = { start: renderedRange.start, end: renderedRange.end };
        /** @type {?} */
        const viewportSize = this._viewport.getViewportSize();
        /** @type {?} */
        const dataLength = this._viewport.getDataLength();
        /** @type {?} */
        const startBuffer = scrollOffset - newRange.start * this._itemSize;
        if (startBuffer < this._minBufferPx && newRange.start != 0) {
            /** @type {?} */
            const expandStart = Math.ceil((this._maxBufferPx - startBuffer) / this._itemSize);
            newRange.start = Math.max(0, newRange.start - expandStart);
            newRange.end = Math.min(dataLength, Math.ceil(firstVisibleIndex + (viewportSize + this._minBufferPx) / this._itemSize));
        }
        else {
            /** @type {?} */
            const endBuffer = newRange.end * this._itemSize - (scrollOffset + viewportSize);
            if (endBuffer < this._minBufferPx && newRange.end != dataLength) {
                /** @type {?} */
                const expandEnd = Math.ceil((this._maxBufferPx - endBuffer) / this._itemSize);
                if (expandEnd > 0) {
                    newRange.end = Math.min(dataLength, newRange.end + expandEnd);
                    newRange.start = Math.max(0, Math.floor(firstVisibleIndex - this._minBufferPx / this._itemSize));
                }
            }
        }
        this._viewport.setRenderedRange(newRange);
        this._viewport.setRenderedContentOffset(this._itemSize * newRange.start);
        this._scrolledIndexChange.next(Math.floor(firstVisibleIndex));
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    FixedSizeVirtualScrollStrategy.prototype._scrolledIndexChange;
    /**
     * \@docs-private Implemented as part of VirtualScrollStrategy.
     * @type {?}
     */
    FixedSizeVirtualScrollStrategy.prototype.scrolledIndexChange;
    /**
     * The attached viewport.
     * @type {?}
     * @private
     */
    FixedSizeVirtualScrollStrategy.prototype._viewport;
    /**
     * The size of the items in the virtually scrolling list.
     * @type {?}
     * @private
     */
    FixedSizeVirtualScrollStrategy.prototype._itemSize;
    /**
     * The minimum amount of buffer rendered beyond the viewport (in pixels).
     * @type {?}
     * @private
     */
    FixedSizeVirtualScrollStrategy.prototype._minBufferPx;
    /**
     * The number of buffer items to render beyond the edge of the viewport (in pixels).
     * @type {?}
     * @private
     */
    FixedSizeVirtualScrollStrategy.prototype._maxBufferPx;
}
/**
 * Provider factory for `FixedSizeVirtualScrollStrategy` that simply extracts the already created
 * `FixedSizeVirtualScrollStrategy` from the given directive.
 * @param {?} fixedSizeDir The instance of `CdkFixedSizeVirtualScroll` to extract the
 *     `FixedSizeVirtualScrollStrategy` from.
 * @return {?}
 */
export function _fixedSizeVirtualScrollStrategyFactory(fixedSizeDir) {
    return fixedSizeDir._scrollStrategy;
}
/**
 * A virtual scroll strategy that supports fixed-size items.
 */
let CdkFixedSizeVirtualScroll = /** @class */ (() => {
    /**
     * A virtual scroll strategy that supports fixed-size items.
     */
    class CdkFixedSizeVirtualScroll {
        constructor() {
            this._itemSize = 20;
            this._minBufferPx = 100;
            this._maxBufferPx = 200;
            /**
             * The scroll strategy used by this directive.
             */
            this._scrollStrategy = new FixedSizeVirtualScrollStrategy(this.itemSize, this.minBufferPx, this.maxBufferPx);
        }
        /**
         * The size of the items in the list (in pixels).
         * @return {?}
         */
        get itemSize() { return this._itemSize; }
        /**
         * @param {?} value
         * @return {?}
         */
        set itemSize(value) { this._itemSize = coerceNumberProperty(value); }
        /**
         * The minimum amount of buffer rendered beyond the viewport (in pixels).
         * If the amount of buffer dips below this number, more items will be rendered. Defaults to 100px.
         * @return {?}
         */
        get minBufferPx() { return this._minBufferPx; }
        /**
         * @param {?} value
         * @return {?}
         */
        set minBufferPx(value) { this._minBufferPx = coerceNumberProperty(value); }
        /**
         * The number of pixels worth of buffer to render for when rendering new items. Defaults to 200px.
         * @return {?}
         */
        get maxBufferPx() { return this._maxBufferPx; }
        /**
         * @param {?} value
         * @return {?}
         */
        set maxBufferPx(value) { this._maxBufferPx = coerceNumberProperty(value); }
        /**
         * @return {?}
         */
        ngOnChanges() {
            this._scrollStrategy.updateItemAndBufferSize(this.itemSize, this.minBufferPx, this.maxBufferPx);
        }
    }
    CdkFixedSizeVirtualScroll.decorators = [
        { type: Directive, args: [{
                    selector: 'cdk-virtual-scroll-viewport[itemSize]',
                    providers: [{
                            provide: VIRTUAL_SCROLL_STRATEGY,
                            useFactory: _fixedSizeVirtualScrollStrategyFactory,
                            deps: [forwardRef((/**
                                 * @return {?}
                                 */
                                () => CdkFixedSizeVirtualScroll))],
                        }],
                },] }
    ];
    CdkFixedSizeVirtualScroll.propDecorators = {
        itemSize: [{ type: Input }],
        minBufferPx: [{ type: Input }],
        maxBufferPx: [{ type: Input }]
    };
    return CdkFixedSizeVirtualScroll;
})();
export { CdkFixedSizeVirtualScroll };
if (false) {
    /** @type {?} */
    CdkFixedSizeVirtualScroll.ngAcceptInputType_itemSize;
    /** @type {?} */
    CdkFixedSizeVirtualScroll.ngAcceptInputType_minBufferPx;
    /** @type {?} */
    CdkFixedSizeVirtualScroll.ngAcceptInputType_maxBufferPx;
    /** @type {?} */
    CdkFixedSizeVirtualScroll.prototype._itemSize;
    /** @type {?} */
    CdkFixedSizeVirtualScroll.prototype._minBufferPx;
    /** @type {?} */
    CdkFixedSizeVirtualScroll.prototype._maxBufferPx;
    /**
     * The scroll strategy used by this directive.
     * @type {?}
     */
    CdkFixedSizeVirtualScroll.prototype._scrollStrategy;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZml4ZWQtc2l6ZS12aXJ0dWFsLXNjcm9sbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2Nyb2xsaW5nL2ZpeGVkLXNpemUtdmlydHVhbC1zY3JvbGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLG9CQUFvQixFQUFjLE1BQU0sdUJBQXVCLENBQUM7QUFDeEUsT0FBTyxFQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFZLE1BQU0sZUFBZSxDQUFDO0FBQ3RFLE9BQU8sRUFBYSxPQUFPLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDekMsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDcEQsT0FBTyxFQUFDLHVCQUF1QixFQUF3QixNQUFNLDJCQUEyQixDQUFDOzs7O0FBS3pGLE1BQU0sT0FBTyw4QkFBOEI7Ozs7OztJQXVCekMsWUFBWSxRQUFnQixFQUFFLFdBQW1CLEVBQUUsV0FBbUI7UUF0QjlELHlCQUFvQixHQUFHLElBQUksT0FBTyxFQUFVLENBQUM7Ozs7UUFHckQsd0JBQW1CLEdBQXVCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDOzs7O1FBR3pGLGNBQVMsR0FBb0MsSUFBSSxDQUFDO1FBaUJ4RCxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztRQUMxQixJQUFJLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQztRQUNoQyxJQUFJLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQztJQUNsQyxDQUFDOzs7Ozs7SUFNRCxNQUFNLENBQUMsUUFBa0M7UUFDdkMsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7UUFDMUIsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7UUFDL0IsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7SUFDOUIsQ0FBQzs7Ozs7SUFH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O2dCQXRDRixTQUFTLFNBQUM7b0JBQ1QsUUFBUSxFQUFFLHVDQUF1QztvQkFDakQsU0FBUyxFQUFFLENBQUM7NEJBQ1YsT0FBTyxFQUFFLHVCQUF1Qjs0QkFDaEMsVUFBVSxFQUFFLHNDQUFzQzs0QkFDbEQsSUFBSSxFQUFFLENBQUMsVUFBVTs7O2dDQUFDLEdBQUcsRUFBRSxDQUFDLHlCQUF5QixFQUFDLENBQUM7eUJBQ3BELENBQUM7aUJBQ0g7OzsyQkFHRSxLQUFLOzhCQVNMLEtBQUs7OEJBUUwsS0FBSzs7SUFnQlIsZ0NBQUM7S0FBQTtTQW5DWSx5QkFBeUI7OztJQWdDcEMscURBQStDOztJQUMvQyx3REFBa0Q7O0lBQ2xELHdEQUFrRDs7SUE3QmxELDhDQUFlOztJQVNmLGlEQUFtQjs7SUFRbkIsaURBQW1COzs7OztJQUduQixvREFDMEYiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtjb2VyY2VOdW1iZXJQcm9wZXJ0eSwgTnVtYmVySW5wdXR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge0RpcmVjdGl2ZSwgZm9yd2FyZFJlZiwgSW5wdXQsIE9uQ2hhbmdlc30gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3R9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtkaXN0aW5jdFVudGlsQ2hhbmdlZH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtWSVJUVUFMX1NDUk9MTF9TVFJBVEVHWSwgVmlydHVhbFNjcm9sbFN0cmF0ZWd5fSBmcm9tICcuL3ZpcnR1YWwtc2Nyb2xsLXN0cmF0ZWd5JztcbmltcG9ydCB7Q2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0fSBmcm9tICcuL3ZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0JztcblxuXG4vKiogVmlydHVhbCBzY3JvbGxpbmcgc3RyYXRlZ3kgZm9yIGxpc3RzIHdpdGggaXRlbXMgb2Yga25vd24gZml4ZWQgc2l6ZS4gKi9cbmV4cG9ydCBjbGFzcyBGaXhlZFNpemVWaXJ0dWFsU2Nyb2xsU3RyYXRlZ3kgaW1wbGVtZW50cyBWaXJ0dWFsU2Nyb2xsU3RyYXRlZ3kge1xuICBwcml2YXRlIF9zY3JvbGxlZEluZGV4Q2hhbmdlID0gbmV3IFN1YmplY3Q8bnVtYmVyPigpO1xuXG4gIC8qKiBAZG9jcy1wcml2YXRlIEltcGxlbWVudGVkIGFzIHBhcnQgb2YgVmlydHVhbFNjcm9sbFN0cmF0ZWd5LiAqL1xuICBzY3JvbGxlZEluZGV4Q2hhbmdlOiBPYnNlcnZhYmxlPG51bWJlcj4gPSB0aGlzLl9zY3JvbGxlZEluZGV4Q2hhbmdlLnBpcGUoZGlzdGluY3RVbnRpbENoYW5nZWQoKSk7XG5cbiAgLyoqIFRoZSBhdHRhY2hlZCB2aWV3cG9ydC4gKi9cbiAgcHJpdmF0ZSBfdmlld3BvcnQ6IENka1ZpcnR1YWxTY3JvbGxWaWV3cG9ydCB8IG51bGwgPSBudWxsO1xuXG4gIC8qKiBUaGUgc2l6ZSBvZiB0aGUgaXRlbXMgaW4gdGhlIHZpcnR1YWxseSBzY3JvbGxpbmcgbGlzdC4gKi9cbiAgcHJpdmF0ZSBfaXRlbVNpemU6IG51bWJlcjtcblxuICAvKiogVGhlIG1pbmltdW0gYW1vdW50IG9mIGJ1ZmZlciByZW5kZXJlZCBiZXlvbmQgdGhlIHZpZXdwb3J0IChpbiBwaXhlbHMpLiAqL1xuICBwcml2YXRlIF9taW5CdWZmZXJQeDogbnVtYmVyO1xuXG4gIC8qKiBUaGUgbnVtYmVyIG9mIGJ1ZmZlciBpdGVtcyB0byByZW5kZXIgYmV5b25kIHRoZSBlZGdlIG9mIHRoZSB2aWV3cG9ydCAoaW4gcGl4ZWxzKS4gKi9cbiAgcHJpdmF0ZSBfbWF4QnVmZmVyUHg6IG51bWJlcjtcblxuICAvKipcbiAgICogQHBhcmFtIGl0ZW1TaXplIFRoZSBzaXplIG9mIHRoZSBpdGVtcyBpbiB0aGUgdmlydHVhbGx5IHNjcm9sbGluZyBsaXN0LlxuICAgKiBAcGFyYW0gbWluQnVmZmVyUHggVGhlIG1pbmltdW0gYW1vdW50IG9mIGJ1ZmZlciAoaW4gcGl4ZWxzKSBiZWZvcmUgbmVlZGluZyB0byByZW5kZXIgbW9yZVxuICAgKiBAcGFyYW0gbWF4QnVmZmVyUHggVGhlIGFtb3VudCBvZiBidWZmZXIgKGluIHBpeGVscykgdG8gcmVuZGVyIHdoZW4gcmVuZGVyaW5nIG1vcmUuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihpdGVtU2l6ZTogbnVtYmVyLCBtaW5CdWZmZXJQeDogbnVtYmVyLCBtYXhCdWZmZXJQeDogbnVtYmVyKSB7XG4gICAgdGhpcy5faXRlbVNpemUgPSBpdGVtU2l6ZTtcbiAgICB0aGlzLl9taW5CdWZmZXJQeCA9IG1pbkJ1ZmZlclB4O1xuICAgIHRoaXMuX21heEJ1ZmZlclB4ID0gbWF4QnVmZmVyUHg7XG4gIH1cblxuICAvKipcbiAgICogQXR0YWNoZXMgdGhpcyBzY3JvbGwgc3RyYXRlZ3kgdG8gYSB2aWV3cG9ydC5cbiAgICogQHBhcmFtIHZpZXdwb3J0IFRoZSB2aWV3cG9ydCB0byBhdHRhY2ggdGhpcyBzdHJhdGVneSB0by5cbiAgICovXG4gIGF0dGFjaCh2aWV3cG9ydDogQ2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0KSB7XG4gICAgdGhpcy5fdmlld3BvcnQgPSB2aWV3cG9ydDtcbiAgICB0aGlzLl91cGRhdGVUb3RhbENvbnRlbnRTaXplKCk7XG4gICAgdGhpcy5fdXBkYXRlUmVuZGVyZWRSYW5nZSgpO1xuICB9XG5cbiAgLyoqIERldGFjaGVzIHRoaXMgc2Nyb2xsIHN0cmF0ZWd5IGZyb20gdGhlIGN1cnJlbnRseSBhdHRhY2hlZCB2aWV3cG9ydC4gKi9cbiAgZGV0YWNoKCkge1xuICAgIHRoaXMuX3Njcm9sbGVkSW5kZXhDaGFuZ2UuY29tcGxldGUoKTtcbiAgICB0aGlzLl92aWV3cG9ydCA9IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBpdGVtIHNpemUgYW5kIGJ1ZmZlciBzaXplLlxuICAgKiBAcGFyYW0gaXRlbVNpemUgVGhlIHNpemUgb2YgdGhlIGl0ZW1zIGluIHRoZSB2aXJ0dWFsbHkgc2Nyb2xsaW5nIGxpc3QuXG4gICAqIEBwYXJhbSBtaW5CdWZmZXJQeCBUaGUgbWluaW11bSBhbW91bnQgb2YgYnVmZmVyIChpbiBwaXhlbHMpIGJlZm9yZSBuZWVkaW5nIHRvIHJlbmRlciBtb3JlXG4gICAqIEBwYXJhbSBtYXhCdWZmZXJQeCBUaGUgYW1vdW50IG9mIGJ1ZmZlciAoaW4gcGl4ZWxzKSB0byByZW5kZXIgd2hlbiByZW5kZXJpbmcgbW9yZS5cbiAgICovXG4gIHVwZGF0ZUl0ZW1BbmRCdWZmZXJTaXplKGl0ZW1TaXplOiBudW1iZXIsIG1pbkJ1ZmZlclB4OiBudW1iZXIsIG1heEJ1ZmZlclB4OiBudW1iZXIpIHtcbiAgICBpZiAobWF4QnVmZmVyUHggPCBtaW5CdWZmZXJQeCkge1xuICAgICAgdGhyb3cgRXJyb3IoJ0NESyB2aXJ0dWFsIHNjcm9sbDogbWF4QnVmZmVyUHggbXVzdCBiZSBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gbWluQnVmZmVyUHgnKTtcbiAgICB9XG4gICAgdGhpcy5faXRlbVNpemUgPSBpdGVtU2l6ZTtcbiAgICB0aGlzLl9taW5CdWZmZXJQeCA9IG1pbkJ1ZmZlclB4O1xuICAgIHRoaXMuX21heEJ1ZmZlclB4ID0gbWF4QnVmZmVyUHg7XG4gICAgdGhpcy5fdXBkYXRlVG90YWxDb250ZW50U2l6ZSgpO1xuICAgIHRoaXMuX3VwZGF0ZVJlbmRlcmVkUmFuZ2UoKTtcbiAgfVxuXG4gIC8qKiBAZG9jcy1wcml2YXRlIEltcGxlbWVudGVkIGFzIHBhcnQgb2YgVmlydHVhbFNjcm9sbFN0cmF0ZWd5LiAqL1xuICBvbkNvbnRlbnRTY3JvbGxlZCgpIHtcbiAgICB0aGlzLl91cGRhdGVSZW5kZXJlZFJhbmdlKCk7XG4gIH1cblxuICAvKiogQGRvY3MtcHJpdmF0ZSBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIFZpcnR1YWxTY3JvbGxTdHJhdGVneS4gKi9cbiAgb25EYXRhTGVuZ3RoQ2hhbmdlZCgpIHtcbiAgICB0aGlzLl91cGRhdGVUb3RhbENvbnRlbnRTaXplKCk7XG4gICAgdGhpcy5fdXBkYXRlUmVuZGVyZWRSYW5nZSgpO1xuICB9XG5cbiAgLyoqIEBkb2NzLXByaXZhdGUgSW1wbGVtZW50ZWQgYXMgcGFydCBvZiBWaXJ0dWFsU2Nyb2xsU3RyYXRlZ3kuICovXG4gIG9uQ29udGVudFJlbmRlcmVkKCkgeyAvKiBuby1vcCAqLyB9XG5cbiAgLyoqIEBkb2NzLXByaXZhdGUgSW1wbGVtZW50ZWQgYXMgcGFydCBvZiBWaXJ0dWFsU2Nyb2xsU3RyYXRlZ3kuICovXG4gIG9uUmVuZGVyZWRPZmZzZXRDaGFuZ2VkKCkgeyAvKiBuby1vcCAqLyB9XG5cbiAgLyoqXG4gICAqIFNjcm9sbCB0byB0aGUgb2Zmc2V0IGZvciB0aGUgZ2l2ZW4gaW5kZXguXG4gICAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgdG8gc2Nyb2xsIHRvLlxuICAgKiBAcGFyYW0gYmVoYXZpb3IgVGhlIFNjcm9sbEJlaGF2aW9yIHRvIHVzZSB3aGVuIHNjcm9sbGluZy5cbiAgICovXG4gIHNjcm9sbFRvSW5kZXgoaW5kZXg6IG51bWJlciwgYmVoYXZpb3I6IFNjcm9sbEJlaGF2aW9yKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX3ZpZXdwb3J0KSB7XG4gICAgICB0aGlzLl92aWV3cG9ydC5zY3JvbGxUb09mZnNldChpbmRleCAqIHRoaXMuX2l0ZW1TaXplLCBiZWhhdmlvcik7XG4gICAgfVxuICB9XG5cbiAgLyoqIFVwZGF0ZSB0aGUgdmlld3BvcnQncyB0b3RhbCBjb250ZW50IHNpemUuICovXG4gIHByaXZhdGUgX3VwZGF0ZVRvdGFsQ29udGVudFNpemUoKSB7XG4gICAgaWYgKCF0aGlzLl92aWV3cG9ydCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3ZpZXdwb3J0LnNldFRvdGFsQ29udGVudFNpemUodGhpcy5fdmlld3BvcnQuZ2V0RGF0YUxlbmd0aCgpICogdGhpcy5faXRlbVNpemUpO1xuICB9XG5cbiAgLyoqIFVwZGF0ZSB0aGUgdmlld3BvcnQncyByZW5kZXJlZCByYW5nZS4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlUmVuZGVyZWRSYW5nZSgpIHtcbiAgICBpZiAoIXRoaXMuX3ZpZXdwb3J0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc2Nyb2xsT2Zmc2V0ID0gdGhpcy5fdmlld3BvcnQubWVhc3VyZVNjcm9sbE9mZnNldCgpO1xuICAgIGNvbnN0IGZpcnN0VmlzaWJsZUluZGV4ID0gc2Nyb2xsT2Zmc2V0IC8gdGhpcy5faXRlbVNpemU7XG4gICAgY29uc3QgcmVuZGVyZWRSYW5nZSA9IHRoaXMuX3ZpZXdwb3J0LmdldFJlbmRlcmVkUmFuZ2UoKTtcbiAgICBjb25zdCBuZXdSYW5nZSA9IHtzdGFydDogcmVuZGVyZWRSYW5nZS5zdGFydCwgZW5kOiByZW5kZXJlZFJhbmdlLmVuZH07XG4gICAgY29uc3Qgdmlld3BvcnRTaXplID0gdGhpcy5fdmlld3BvcnQuZ2V0Vmlld3BvcnRTaXplKCk7XG4gICAgY29uc3QgZGF0YUxlbmd0aCA9IHRoaXMuX3ZpZXdwb3J0LmdldERhdGFMZW5ndGgoKTtcblxuICAgIGNvbnN0IHN0YXJ0QnVmZmVyID0gc2Nyb2xsT2Zmc2V0IC0gbmV3UmFuZ2Uuc3RhcnQgKiB0aGlzLl9pdGVtU2l6ZTtcbiAgICBpZiAoc3RhcnRCdWZmZXIgPCB0aGlzLl9taW5CdWZmZXJQeCAmJiBuZXdSYW5nZS5zdGFydCAhPSAwKSB7XG4gICAgICBjb25zdCBleHBhbmRTdGFydCA9IE1hdGguY2VpbCgodGhpcy5fbWF4QnVmZmVyUHggLSBzdGFydEJ1ZmZlcikgLyB0aGlzLl9pdGVtU2l6ZSk7XG4gICAgICBuZXdSYW5nZS5zdGFydCA9IE1hdGgubWF4KDAsIG5ld1JhbmdlLnN0YXJ0IC0gZXhwYW5kU3RhcnQpO1xuICAgICAgbmV3UmFuZ2UuZW5kID0gTWF0aC5taW4oZGF0YUxlbmd0aCxcbiAgICAgICAgICBNYXRoLmNlaWwoZmlyc3RWaXNpYmxlSW5kZXggKyAodmlld3BvcnRTaXplICsgdGhpcy5fbWluQnVmZmVyUHgpIC8gdGhpcy5faXRlbVNpemUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZW5kQnVmZmVyID0gbmV3UmFuZ2UuZW5kICogdGhpcy5faXRlbVNpemUgLSAoc2Nyb2xsT2Zmc2V0ICsgdmlld3BvcnRTaXplKTtcbiAgICAgIGlmIChlbmRCdWZmZXIgPCB0aGlzLl9taW5CdWZmZXJQeCAmJiBuZXdSYW5nZS5lbmQgIT0gZGF0YUxlbmd0aCkge1xuICAgICAgICBjb25zdCBleHBhbmRFbmQgPSBNYXRoLmNlaWwoKHRoaXMuX21heEJ1ZmZlclB4IC0gZW5kQnVmZmVyKSAvIHRoaXMuX2l0ZW1TaXplKTtcbiAgICAgICAgaWYgKGV4cGFuZEVuZCA+IDApIHtcbiAgICAgICAgICBuZXdSYW5nZS5lbmQgPSBNYXRoLm1pbihkYXRhTGVuZ3RoLCBuZXdSYW5nZS5lbmQgKyBleHBhbmRFbmQpO1xuICAgICAgICAgIG5ld1JhbmdlLnN0YXJ0ID0gTWF0aC5tYXgoMCxcbiAgICAgICAgICAgICAgTWF0aC5mbG9vcihmaXJzdFZpc2libGVJbmRleCAtIHRoaXMuX21pbkJ1ZmZlclB4IC8gdGhpcy5faXRlbVNpemUpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX3ZpZXdwb3J0LnNldFJlbmRlcmVkUmFuZ2UobmV3UmFuZ2UpO1xuICAgIHRoaXMuX3ZpZXdwb3J0LnNldFJlbmRlcmVkQ29udGVudE9mZnNldCh0aGlzLl9pdGVtU2l6ZSAqIG5ld1JhbmdlLnN0YXJ0KTtcbiAgICB0aGlzLl9zY3JvbGxlZEluZGV4Q2hhbmdlLm5leHQoTWF0aC5mbG9vcihmaXJzdFZpc2libGVJbmRleCkpO1xuICB9XG59XG5cblxuLyoqXG4gKiBQcm92aWRlciBmYWN0b3J5IGZvciBgRml4ZWRTaXplVmlydHVhbFNjcm9sbFN0cmF0ZWd5YCB0aGF0IHNpbXBseSBleHRyYWN0cyB0aGUgYWxyZWFkeSBjcmVhdGVkXG4gKiBgRml4ZWRTaXplVmlydHVhbFNjcm9sbFN0cmF0ZWd5YCBmcm9tIHRoZSBnaXZlbiBkaXJlY3RpdmUuXG4gKiBAcGFyYW0gZml4ZWRTaXplRGlyIFRoZSBpbnN0YW5jZSBvZiBgQ2RrRml4ZWRTaXplVmlydHVhbFNjcm9sbGAgdG8gZXh0cmFjdCB0aGVcbiAqICAgICBgRml4ZWRTaXplVmlydHVhbFNjcm9sbFN0cmF0ZWd5YCBmcm9tLlxuICovXG5leHBvcnQgZnVuY3Rpb24gX2ZpeGVkU2l6ZVZpcnR1YWxTY3JvbGxTdHJhdGVneUZhY3RvcnkoZml4ZWRTaXplRGlyOiBDZGtGaXhlZFNpemVWaXJ0dWFsU2Nyb2xsKSB7XG4gIHJldHVybiBmaXhlZFNpemVEaXIuX3Njcm9sbFN0cmF0ZWd5O1xufVxuXG5cbi8qKiBBIHZpcnR1YWwgc2Nyb2xsIHN0cmF0ZWd5IHRoYXQgc3VwcG9ydHMgZml4ZWQtc2l6ZSBpdGVtcy4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ2Nkay12aXJ0dWFsLXNjcm9sbC12aWV3cG9ydFtpdGVtU2l6ZV0nLFxuICBwcm92aWRlcnM6IFt7XG4gICAgcHJvdmlkZTogVklSVFVBTF9TQ1JPTExfU1RSQVRFR1ksXG4gICAgdXNlRmFjdG9yeTogX2ZpeGVkU2l6ZVZpcnR1YWxTY3JvbGxTdHJhdGVneUZhY3RvcnksXG4gICAgZGVwczogW2ZvcndhcmRSZWYoKCkgPT4gQ2RrRml4ZWRTaXplVmlydHVhbFNjcm9sbCldLFxuICB9XSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrRml4ZWRTaXplVmlydHVhbFNjcm9sbCBpbXBsZW1lbnRzIE9uQ2hhbmdlcyB7XG4gIC8qKiBUaGUgc2l6ZSBvZiB0aGUgaXRlbXMgaW4gdGhlIGxpc3QgKGluIHBpeGVscykuICovXG4gIEBJbnB1dCgpXG4gIGdldCBpdGVtU2l6ZSgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5faXRlbVNpemU7IH1cbiAgc2V0IGl0ZW1TaXplKHZhbHVlOiBudW1iZXIpIHsgdGhpcy5faXRlbVNpemUgPSBjb2VyY2VOdW1iZXJQcm9wZXJ0eSh2YWx1ZSk7IH1cbiAgX2l0ZW1TaXplID0gMjA7XG5cbiAgLyoqXG4gICAqIFRoZSBtaW5pbXVtIGFtb3VudCBvZiBidWZmZXIgcmVuZGVyZWQgYmV5b25kIHRoZSB2aWV3cG9ydCAoaW4gcGl4ZWxzKS5cbiAgICogSWYgdGhlIGFtb3VudCBvZiBidWZmZXIgZGlwcyBiZWxvdyB0aGlzIG51bWJlciwgbW9yZSBpdGVtcyB3aWxsIGJlIHJlbmRlcmVkLiBEZWZhdWx0cyB0byAxMDBweC5cbiAgICovXG4gIEBJbnB1dCgpXG4gIGdldCBtaW5CdWZmZXJQeCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fbWluQnVmZmVyUHg7IH1cbiAgc2V0IG1pbkJ1ZmZlclB4KHZhbHVlOiBudW1iZXIpIHsgdGhpcy5fbWluQnVmZmVyUHggPSBjb2VyY2VOdW1iZXJQcm9wZXJ0eSh2YWx1ZSk7IH1cbiAgX21pbkJ1ZmZlclB4ID0gMTAwO1xuXG4gIC8qKlxuICAgKiBUaGUgbnVtYmVyIG9mIHBpeGVscyB3b3J0aCBvZiBidWZmZXIgdG8gcmVuZGVyIGZvciB3aGVuIHJlbmRlcmluZyBuZXcgaXRlbXMuIERlZmF1bHRzIHRvIDIwMHB4LlxuICAgKi9cbiAgQElucHV0KClcbiAgZ2V0IG1heEJ1ZmZlclB4KCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9tYXhCdWZmZXJQeDsgfVxuICBzZXQgbWF4QnVmZmVyUHgodmFsdWU6IG51bWJlcikgeyB0aGlzLl9tYXhCdWZmZXJQeCA9IGNvZXJjZU51bWJlclByb3BlcnR5KHZhbHVlKTsgfVxuICBfbWF4QnVmZmVyUHggPSAyMDA7XG5cbiAgLyoqIFRoZSBzY3JvbGwgc3RyYXRlZ3kgdXNlZCBieSB0aGlzIGRpcmVjdGl2ZS4gKi9cbiAgX3Njcm9sbFN0cmF0ZWd5ID1cbiAgICAgIG5ldyBGaXhlZFNpemVWaXJ0dWFsU2Nyb2xsU3RyYXRlZ3kodGhpcy5pdGVtU2l6ZSwgdGhpcy5taW5CdWZmZXJQeCwgdGhpcy5tYXhCdWZmZXJQeCk7XG5cbiAgbmdPbkNoYW5nZXMoKSB7XG4gICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kudXBkYXRlSXRlbUFuZEJ1ZmZlclNpemUodGhpcy5pdGVtU2l6ZSwgdGhpcy5taW5CdWZmZXJQeCwgdGhpcy5tYXhCdWZmZXJQeCk7XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfaXRlbVNpemU6IE51bWJlcklucHV0O1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfbWluQnVmZmVyUHg6IE51bWJlcklucHV0O1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfbWF4QnVmZmVyUHg6IE51bWJlcklucHV0O1xufVxuIl19