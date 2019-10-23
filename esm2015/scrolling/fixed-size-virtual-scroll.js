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
export class CdkFixedSizeVirtualScroll {
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
if (false) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZml4ZWQtc2l6ZS12aXJ0dWFsLXNjcm9sbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2Nyb2xsaW5nL2ZpeGVkLXNpemUtdmlydHVhbC1zY3JvbGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMzRCxPQUFPLEVBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQVksTUFBTSxlQUFlLENBQUM7QUFDdEUsT0FBTyxFQUFhLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUN6QyxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNwRCxPQUFPLEVBQUMsdUJBQXVCLEVBQXdCLE1BQU0sMkJBQTJCLENBQUM7Ozs7QUFLekYsTUFBTSxPQUFPLDhCQUE4Qjs7Ozs7O0lBdUJ6QyxZQUFZLFFBQWdCLEVBQUUsV0FBbUIsRUFBRSxXQUFtQjtRQXRCOUQseUJBQW9CLEdBQUcsSUFBSSxPQUFPLEVBQVUsQ0FBQzs7OztRQUdyRCx3QkFBbUIsR0FBdUIsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUM7Ozs7UUFHekYsY0FBUyxHQUFvQyxJQUFJLENBQUM7UUFpQnhELElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1FBQzFCLElBQUksQ0FBQyxZQUFZLEdBQUcsV0FBVyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxZQUFZLEdBQUcsV0FBVyxDQUFDO0lBQ2xDLENBQUM7Ozs7OztJQU1ELE1BQU0sQ0FBQyxRQUFrQztRQUN2QyxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztRQUMxQixJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUMvQixJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztJQUM5QixDQUFDOzs7OztJQUdELE1BQU07UUFDSixJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDckMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7SUFDeEIsQ0FBQzs7Ozs7Ozs7SUFRRCx1QkFBdUIsQ0FBQyxRQUFnQixFQUFFLFdBQW1CLEVBQUUsV0FBbUI7UUFDaEYsSUFBSSxXQUFXLEdBQUcsV0FBVyxFQUFFO1lBQzdCLE1BQU0sS0FBSyxDQUFDLDhFQUE4RSxDQUFDLENBQUM7U0FDN0Y7UUFDRCxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztRQUMxQixJQUFJLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQztRQUNoQyxJQUFJLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQztRQUNoQyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUMvQixJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztJQUM5QixDQUFDOzs7OztJQUdELGlCQUFpQjtRQUNmLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0lBQzlCLENBQUM7Ozs7O0lBR0QsbUJBQW1CO1FBQ2pCLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1FBQy9CLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0lBQzlCLENBQUM7Ozs7O0lBR0QsaUJBQWlCLEtBQWlCLENBQUM7Ozs7O0lBR25DLHVCQUF1QixLQUFpQixDQUFDOzs7Ozs7O0lBT3pDLGFBQWEsQ0FBQyxLQUFhLEVBQUUsUUFBd0I7UUFDbkQsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ2xCLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ2pFO0lBQ0gsQ0FBQzs7Ozs7O0lBR08sdUJBQXVCO1FBQzdCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ25CLE9BQU87U0FDUjtRQUVELElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDdEYsQ0FBQzs7Ozs7O0lBR08sb0JBQW9CO1FBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ25CLE9BQU87U0FDUjs7Y0FFSyxZQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRTs7Y0FDbkQsaUJBQWlCLEdBQUcsWUFBWSxHQUFHLElBQUksQ0FBQyxTQUFTOztjQUNqRCxhQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRTs7Y0FDakQsUUFBUSxHQUFHLEVBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLGFBQWEsQ0FBQyxHQUFHLEVBQUM7O2NBQy9ELFlBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsRUFBRTs7Y0FDL0MsVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFOztjQUUzQyxXQUFXLEdBQUcsWUFBWSxHQUFHLFFBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVM7UUFDbEUsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksSUFBSSxRQUFRLENBQUMsS0FBSyxJQUFJLENBQUMsRUFBRTs7a0JBQ3BELFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksR0FBRyxXQUFXLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ2pGLFFBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLEtBQUssR0FBRyxXQUFXLENBQUMsQ0FBQztZQUMzRCxRQUFRLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUM5QixJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztTQUN6RjthQUFNOztrQkFDQyxTQUFTLEdBQUcsUUFBUSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztZQUMvRSxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsWUFBWSxJQUFJLFFBQVEsQ0FBQyxHQUFHLElBQUksVUFBVSxFQUFFOztzQkFDekQsU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxHQUFHLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQzdFLElBQUksU0FBUyxHQUFHLENBQUMsRUFBRTtvQkFDakIsUUFBUSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsR0FBRyxHQUFHLFNBQVMsQ0FBQyxDQUFDO29CQUM5RCxRQUFRLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUN2QixJQUFJLENBQUMsS0FBSyxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7aUJBQ3pFO2FBQ0Y7U0FDRjtRQUVELElBQUksQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDMUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN6RSxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO0lBQ2hFLENBQUM7Q0FDRjs7Ozs7O0lBcklDLDhEQUFxRDs7Ozs7SUFHckQsNkRBQWlHOzs7Ozs7SUFHakcsbURBQTBEOzs7Ozs7SUFHMUQsbURBQTBCOzs7Ozs7SUFHMUIsc0RBQTZCOzs7Ozs7SUFHN0Isc0RBQTZCOzs7Ozs7Ozs7QUErSC9CLE1BQU0sVUFBVSxzQ0FBc0MsQ0FBQyxZQUF1QztJQUM1RixPQUFPLFlBQVksQ0FBQyxlQUFlLENBQUM7QUFDdEMsQ0FBQzs7OztBQVlELE1BQU0sT0FBTyx5QkFBeUI7SUFSdEM7UUFhRSxjQUFTLEdBQUcsRUFBRSxDQUFDO1FBU2YsaUJBQVksR0FBRyxHQUFHLENBQUM7UUFRbkIsaUJBQVksR0FBRyxHQUFHLENBQUM7Ozs7UUFHbkIsb0JBQWUsR0FDWCxJQUFJLDhCQUE4QixDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7SUFLNUYsQ0FBQzs7Ozs7SUE3QkMsSUFDSSxRQUFRLEtBQWEsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQzs7Ozs7SUFDakQsSUFBSSxRQUFRLENBQUMsS0FBYSxJQUFJLElBQUksQ0FBQyxTQUFTLEdBQUcsb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7Ozs7SUFPN0UsSUFDSSxXQUFXLEtBQWEsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQzs7Ozs7SUFDdkQsSUFBSSxXQUFXLENBQUMsS0FBYSxJQUFJLElBQUksQ0FBQyxZQUFZLEdBQUcsb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7OztJQU1uRixJQUNJLFdBQVcsS0FBYSxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDOzs7OztJQUN2RCxJQUFJLFdBQVcsQ0FBQyxLQUFhLElBQUksSUFBSSxDQUFDLFlBQVksR0FBRyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Ozs7SUFPbkYsV0FBVztRQUNULElBQUksQ0FBQyxlQUFlLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNsRyxDQUFDOzs7WUF0Q0YsU0FBUyxTQUFDO2dCQUNULFFBQVEsRUFBRSx1Q0FBdUM7Z0JBQ2pELFNBQVMsRUFBRSxDQUFDO3dCQUNWLE9BQU8sRUFBRSx1QkFBdUI7d0JBQ2hDLFVBQVUsRUFBRSxzQ0FBc0M7d0JBQ2xELElBQUksRUFBRSxDQUFDLFVBQVU7Ozs0QkFBQyxHQUFHLEVBQUUsQ0FBQyx5QkFBeUIsRUFBQyxDQUFDO3FCQUNwRCxDQUFDO2FBQ0g7Ozt1QkFHRSxLQUFLOzBCQVNMLEtBQUs7MEJBUUwsS0FBSzs7OztJQWROLDhDQUFlOztJQVNmLGlEQUFtQjs7SUFRbkIsaURBQW1COzs7OztJQUduQixvREFDMEYiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtjb2VyY2VOdW1iZXJQcm9wZXJ0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7RGlyZWN0aXZlLCBmb3J3YXJkUmVmLCBJbnB1dCwgT25DaGFuZ2VzfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2Rpc3RpbmN0VW50aWxDaGFuZ2VkfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge1ZJUlRVQUxfU0NST0xMX1NUUkFURUdZLCBWaXJ0dWFsU2Nyb2xsU3RyYXRlZ3l9IGZyb20gJy4vdmlydHVhbC1zY3JvbGwtc3RyYXRlZ3knO1xuaW1wb3J0IHtDZGtWaXJ0dWFsU2Nyb2xsVmlld3BvcnR9IGZyb20gJy4vdmlydHVhbC1zY3JvbGwtdmlld3BvcnQnO1xuXG5cbi8qKiBWaXJ0dWFsIHNjcm9sbGluZyBzdHJhdGVneSBmb3IgbGlzdHMgd2l0aCBpdGVtcyBvZiBrbm93biBmaXhlZCBzaXplLiAqL1xuZXhwb3J0IGNsYXNzIEZpeGVkU2l6ZVZpcnR1YWxTY3JvbGxTdHJhdGVneSBpbXBsZW1lbnRzIFZpcnR1YWxTY3JvbGxTdHJhdGVneSB7XG4gIHByaXZhdGUgX3Njcm9sbGVkSW5kZXhDaGFuZ2UgPSBuZXcgU3ViamVjdDxudW1iZXI+KCk7XG5cbiAgLyoqIEBkb2NzLXByaXZhdGUgSW1wbGVtZW50ZWQgYXMgcGFydCBvZiBWaXJ0dWFsU2Nyb2xsU3RyYXRlZ3kuICovXG4gIHNjcm9sbGVkSW5kZXhDaGFuZ2U6IE9ic2VydmFibGU8bnVtYmVyPiA9IHRoaXMuX3Njcm9sbGVkSW5kZXhDaGFuZ2UucGlwZShkaXN0aW5jdFVudGlsQ2hhbmdlZCgpKTtcblxuICAvKiogVGhlIGF0dGFjaGVkIHZpZXdwb3J0LiAqL1xuICBwcml2YXRlIF92aWV3cG9ydDogQ2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0IHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIFRoZSBzaXplIG9mIHRoZSBpdGVtcyBpbiB0aGUgdmlydHVhbGx5IHNjcm9sbGluZyBsaXN0LiAqL1xuICBwcml2YXRlIF9pdGVtU2l6ZTogbnVtYmVyO1xuXG4gIC8qKiBUaGUgbWluaW11bSBhbW91bnQgb2YgYnVmZmVyIHJlbmRlcmVkIGJleW9uZCB0aGUgdmlld3BvcnQgKGluIHBpeGVscykuICovXG4gIHByaXZhdGUgX21pbkJ1ZmZlclB4OiBudW1iZXI7XG5cbiAgLyoqIFRoZSBudW1iZXIgb2YgYnVmZmVyIGl0ZW1zIHRvIHJlbmRlciBiZXlvbmQgdGhlIGVkZ2Ugb2YgdGhlIHZpZXdwb3J0IChpbiBwaXhlbHMpLiAqL1xuICBwcml2YXRlIF9tYXhCdWZmZXJQeDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0gaXRlbVNpemUgVGhlIHNpemUgb2YgdGhlIGl0ZW1zIGluIHRoZSB2aXJ0dWFsbHkgc2Nyb2xsaW5nIGxpc3QuXG4gICAqIEBwYXJhbSBtaW5CdWZmZXJQeCBUaGUgbWluaW11bSBhbW91bnQgb2YgYnVmZmVyIChpbiBwaXhlbHMpIGJlZm9yZSBuZWVkaW5nIHRvIHJlbmRlciBtb3JlXG4gICAqIEBwYXJhbSBtYXhCdWZmZXJQeCBUaGUgYW1vdW50IG9mIGJ1ZmZlciAoaW4gcGl4ZWxzKSB0byByZW5kZXIgd2hlbiByZW5kZXJpbmcgbW9yZS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGl0ZW1TaXplOiBudW1iZXIsIG1pbkJ1ZmZlclB4OiBudW1iZXIsIG1heEJ1ZmZlclB4OiBudW1iZXIpIHtcbiAgICB0aGlzLl9pdGVtU2l6ZSA9IGl0ZW1TaXplO1xuICAgIHRoaXMuX21pbkJ1ZmZlclB4ID0gbWluQnVmZmVyUHg7XG4gICAgdGhpcy5fbWF4QnVmZmVyUHggPSBtYXhCdWZmZXJQeDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRhY2hlcyB0aGlzIHNjcm9sbCBzdHJhdGVneSB0byBhIHZpZXdwb3J0LlxuICAgKiBAcGFyYW0gdmlld3BvcnQgVGhlIHZpZXdwb3J0IHRvIGF0dGFjaCB0aGlzIHN0cmF0ZWd5IHRvLlxuICAgKi9cbiAgYXR0YWNoKHZpZXdwb3J0OiBDZGtWaXJ0dWFsU2Nyb2xsVmlld3BvcnQpIHtcbiAgICB0aGlzLl92aWV3cG9ydCA9IHZpZXdwb3J0O1xuICAgIHRoaXMuX3VwZGF0ZVRvdGFsQ29udGVudFNpemUoKTtcbiAgICB0aGlzLl91cGRhdGVSZW5kZXJlZFJhbmdlKCk7XG4gIH1cblxuICAvKiogRGV0YWNoZXMgdGhpcyBzY3JvbGwgc3RyYXRlZ3kgZnJvbSB0aGUgY3VycmVudGx5IGF0dGFjaGVkIHZpZXdwb3J0LiAqL1xuICBkZXRhY2goKSB7XG4gICAgdGhpcy5fc2Nyb2xsZWRJbmRleENoYW5nZS5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX3ZpZXdwb3J0ID0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIGl0ZW0gc2l6ZSBhbmQgYnVmZmVyIHNpemUuXG4gICAqIEBwYXJhbSBpdGVtU2l6ZSBUaGUgc2l6ZSBvZiB0aGUgaXRlbXMgaW4gdGhlIHZpcnR1YWxseSBzY3JvbGxpbmcgbGlzdC5cbiAgICogQHBhcmFtIG1pbkJ1ZmZlclB4IFRoZSBtaW5pbXVtIGFtb3VudCBvZiBidWZmZXIgKGluIHBpeGVscykgYmVmb3JlIG5lZWRpbmcgdG8gcmVuZGVyIG1vcmVcbiAgICogQHBhcmFtIG1heEJ1ZmZlclB4IFRoZSBhbW91bnQgb2YgYnVmZmVyIChpbiBwaXhlbHMpIHRvIHJlbmRlciB3aGVuIHJlbmRlcmluZyBtb3JlLlxuICAgKi9cbiAgdXBkYXRlSXRlbUFuZEJ1ZmZlclNpemUoaXRlbVNpemU6IG51bWJlciwgbWluQnVmZmVyUHg6IG51bWJlciwgbWF4QnVmZmVyUHg6IG51bWJlcikge1xuICAgIGlmIChtYXhCdWZmZXJQeCA8IG1pbkJ1ZmZlclB4KSB7XG4gICAgICB0aHJvdyBFcnJvcignQ0RLIHZpcnR1YWwgc2Nyb2xsOiBtYXhCdWZmZXJQeCBtdXN0IGJlIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byBtaW5CdWZmZXJQeCcpO1xuICAgIH1cbiAgICB0aGlzLl9pdGVtU2l6ZSA9IGl0ZW1TaXplO1xuICAgIHRoaXMuX21pbkJ1ZmZlclB4ID0gbWluQnVmZmVyUHg7XG4gICAgdGhpcy5fbWF4QnVmZmVyUHggPSBtYXhCdWZmZXJQeDtcbiAgICB0aGlzLl91cGRhdGVUb3RhbENvbnRlbnRTaXplKCk7XG4gICAgdGhpcy5fdXBkYXRlUmVuZGVyZWRSYW5nZSgpO1xuICB9XG5cbiAgLyoqIEBkb2NzLXByaXZhdGUgSW1wbGVtZW50ZWQgYXMgcGFydCBvZiBWaXJ0dWFsU2Nyb2xsU3RyYXRlZ3kuICovXG4gIG9uQ29udGVudFNjcm9sbGVkKCkge1xuICAgIHRoaXMuX3VwZGF0ZVJlbmRlcmVkUmFuZ2UoKTtcbiAgfVxuXG4gIC8qKiBAZG9jcy1wcml2YXRlIEltcGxlbWVudGVkIGFzIHBhcnQgb2YgVmlydHVhbFNjcm9sbFN0cmF0ZWd5LiAqL1xuICBvbkRhdGFMZW5ndGhDaGFuZ2VkKCkge1xuICAgIHRoaXMuX3VwZGF0ZVRvdGFsQ29udGVudFNpemUoKTtcbiAgICB0aGlzLl91cGRhdGVSZW5kZXJlZFJhbmdlKCk7XG4gIH1cblxuICAvKiogQGRvY3MtcHJpdmF0ZSBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIFZpcnR1YWxTY3JvbGxTdHJhdGVneS4gKi9cbiAgb25Db250ZW50UmVuZGVyZWQoKSB7IC8qIG5vLW9wICovIH1cblxuICAvKiogQGRvY3MtcHJpdmF0ZSBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIFZpcnR1YWxTY3JvbGxTdHJhdGVneS4gKi9cbiAgb25SZW5kZXJlZE9mZnNldENoYW5nZWQoKSB7IC8qIG5vLW9wICovIH1cblxuICAvKipcbiAgICogU2Nyb2xsIHRvIHRoZSBvZmZzZXQgZm9yIHRoZSBnaXZlbiBpbmRleC5cbiAgICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCB0byBzY3JvbGwgdG8uXG4gICAqIEBwYXJhbSBiZWhhdmlvciBUaGUgU2Nyb2xsQmVoYXZpb3IgdG8gdXNlIHdoZW4gc2Nyb2xsaW5nLlxuICAgKi9cbiAgc2Nyb2xsVG9JbmRleChpbmRleDogbnVtYmVyLCBiZWhhdmlvcjogU2Nyb2xsQmVoYXZpb3IpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fdmlld3BvcnQpIHtcbiAgICAgIHRoaXMuX3ZpZXdwb3J0LnNjcm9sbFRvT2Zmc2V0KGluZGV4ICogdGhpcy5faXRlbVNpemUsIGJlaGF2aW9yKTtcbiAgICB9XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSB2aWV3cG9ydCdzIHRvdGFsIGNvbnRlbnQgc2l6ZS4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlVG90YWxDb250ZW50U2l6ZSgpIHtcbiAgICBpZiAoIXRoaXMuX3ZpZXdwb3J0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fdmlld3BvcnQuc2V0VG90YWxDb250ZW50U2l6ZSh0aGlzLl92aWV3cG9ydC5nZXREYXRhTGVuZ3RoKCkgKiB0aGlzLl9pdGVtU2l6ZSk7XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSB2aWV3cG9ydCdzIHJlbmRlcmVkIHJhbmdlLiAqL1xuICBwcml2YXRlIF91cGRhdGVSZW5kZXJlZFJhbmdlKCkge1xuICAgIGlmICghdGhpcy5fdmlld3BvcnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzY3JvbGxPZmZzZXQgPSB0aGlzLl92aWV3cG9ydC5tZWFzdXJlU2Nyb2xsT2Zmc2V0KCk7XG4gICAgY29uc3QgZmlyc3RWaXNpYmxlSW5kZXggPSBzY3JvbGxPZmZzZXQgLyB0aGlzLl9pdGVtU2l6ZTtcbiAgICBjb25zdCByZW5kZXJlZFJhbmdlID0gdGhpcy5fdmlld3BvcnQuZ2V0UmVuZGVyZWRSYW5nZSgpO1xuICAgIGNvbnN0IG5ld1JhbmdlID0ge3N0YXJ0OiByZW5kZXJlZFJhbmdlLnN0YXJ0LCBlbmQ6IHJlbmRlcmVkUmFuZ2UuZW5kfTtcbiAgICBjb25zdCB2aWV3cG9ydFNpemUgPSB0aGlzLl92aWV3cG9ydC5nZXRWaWV3cG9ydFNpemUoKTtcbiAgICBjb25zdCBkYXRhTGVuZ3RoID0gdGhpcy5fdmlld3BvcnQuZ2V0RGF0YUxlbmd0aCgpO1xuXG4gICAgY29uc3Qgc3RhcnRCdWZmZXIgPSBzY3JvbGxPZmZzZXQgLSBuZXdSYW5nZS5zdGFydCAqIHRoaXMuX2l0ZW1TaXplO1xuICAgIGlmIChzdGFydEJ1ZmZlciA8IHRoaXMuX21pbkJ1ZmZlclB4ICYmIG5ld1JhbmdlLnN0YXJ0ICE9IDApIHtcbiAgICAgIGNvbnN0IGV4cGFuZFN0YXJ0ID0gTWF0aC5jZWlsKCh0aGlzLl9tYXhCdWZmZXJQeCAtIHN0YXJ0QnVmZmVyKSAvIHRoaXMuX2l0ZW1TaXplKTtcbiAgICAgIG5ld1JhbmdlLnN0YXJ0ID0gTWF0aC5tYXgoMCwgbmV3UmFuZ2Uuc3RhcnQgLSBleHBhbmRTdGFydCk7XG4gICAgICBuZXdSYW5nZS5lbmQgPSBNYXRoLm1pbihkYXRhTGVuZ3RoLFxuICAgICAgICAgIE1hdGguY2VpbChmaXJzdFZpc2libGVJbmRleCArICh2aWV3cG9ydFNpemUgKyB0aGlzLl9taW5CdWZmZXJQeCkgLyB0aGlzLl9pdGVtU2l6ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBlbmRCdWZmZXIgPSBuZXdSYW5nZS5lbmQgKiB0aGlzLl9pdGVtU2l6ZSAtIChzY3JvbGxPZmZzZXQgKyB2aWV3cG9ydFNpemUpO1xuICAgICAgaWYgKGVuZEJ1ZmZlciA8IHRoaXMuX21pbkJ1ZmZlclB4ICYmIG5ld1JhbmdlLmVuZCAhPSBkYXRhTGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IGV4cGFuZEVuZCA9IE1hdGguY2VpbCgodGhpcy5fbWF4QnVmZmVyUHggLSBlbmRCdWZmZXIpIC8gdGhpcy5faXRlbVNpemUpO1xuICAgICAgICBpZiAoZXhwYW5kRW5kID4gMCkge1xuICAgICAgICAgIG5ld1JhbmdlLmVuZCA9IE1hdGgubWluKGRhdGFMZW5ndGgsIG5ld1JhbmdlLmVuZCArIGV4cGFuZEVuZCk7XG4gICAgICAgICAgbmV3UmFuZ2Uuc3RhcnQgPSBNYXRoLm1heCgwLFxuICAgICAgICAgICAgICBNYXRoLmZsb29yKGZpcnN0VmlzaWJsZUluZGV4IC0gdGhpcy5fbWluQnVmZmVyUHggLyB0aGlzLl9pdGVtU2l6ZSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fdmlld3BvcnQuc2V0UmVuZGVyZWRSYW5nZShuZXdSYW5nZSk7XG4gICAgdGhpcy5fdmlld3BvcnQuc2V0UmVuZGVyZWRDb250ZW50T2Zmc2V0KHRoaXMuX2l0ZW1TaXplICogbmV3UmFuZ2Uuc3RhcnQpO1xuICAgIHRoaXMuX3Njcm9sbGVkSW5kZXhDaGFuZ2UubmV4dChNYXRoLmZsb29yKGZpcnN0VmlzaWJsZUluZGV4KSk7XG4gIH1cbn1cblxuXG4vKipcbiAqIFByb3ZpZGVyIGZhY3RvcnkgZm9yIGBGaXhlZFNpemVWaXJ0dWFsU2Nyb2xsU3RyYXRlZ3lgIHRoYXQgc2ltcGx5IGV4dHJhY3RzIHRoZSBhbHJlYWR5IGNyZWF0ZWRcbiAqIGBGaXhlZFNpemVWaXJ0dWFsU2Nyb2xsU3RyYXRlZ3lgIGZyb20gdGhlIGdpdmVuIGRpcmVjdGl2ZS5cbiAqIEBwYXJhbSBmaXhlZFNpemVEaXIgVGhlIGluc3RhbmNlIG9mIGBDZGtGaXhlZFNpemVWaXJ0dWFsU2Nyb2xsYCB0byBleHRyYWN0IHRoZVxuICogICAgIGBGaXhlZFNpemVWaXJ0dWFsU2Nyb2xsU3RyYXRlZ3lgIGZyb20uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfZml4ZWRTaXplVmlydHVhbFNjcm9sbFN0cmF0ZWd5RmFjdG9yeShmaXhlZFNpemVEaXI6IENka0ZpeGVkU2l6ZVZpcnR1YWxTY3JvbGwpIHtcbiAgcmV0dXJuIGZpeGVkU2l6ZURpci5fc2Nyb2xsU3RyYXRlZ3k7XG59XG5cblxuLyoqIEEgdmlydHVhbCBzY3JvbGwgc3RyYXRlZ3kgdGhhdCBzdXBwb3J0cyBmaXhlZC1zaXplIGl0ZW1zLiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnY2RrLXZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0W2l0ZW1TaXplXScsXG4gIHByb3ZpZGVyczogW3tcbiAgICBwcm92aWRlOiBWSVJUVUFMX1NDUk9MTF9TVFJBVEVHWSxcbiAgICB1c2VGYWN0b3J5OiBfZml4ZWRTaXplVmlydHVhbFNjcm9sbFN0cmF0ZWd5RmFjdG9yeSxcbiAgICBkZXBzOiBbZm9yd2FyZFJlZigoKSA9PiBDZGtGaXhlZFNpemVWaXJ0dWFsU2Nyb2xsKV0sXG4gIH1dLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtGaXhlZFNpemVWaXJ0dWFsU2Nyb2xsIGltcGxlbWVudHMgT25DaGFuZ2VzIHtcbiAgLyoqIFRoZSBzaXplIG9mIHRoZSBpdGVtcyBpbiB0aGUgbGlzdCAoaW4gcGl4ZWxzKS4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGl0ZW1TaXplKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9pdGVtU2l6ZTsgfVxuICBzZXQgaXRlbVNpemUodmFsdWU6IG51bWJlcikgeyB0aGlzLl9pdGVtU2l6ZSA9IGNvZXJjZU51bWJlclByb3BlcnR5KHZhbHVlKTsgfVxuICBfaXRlbVNpemUgPSAyMDtcblxuICAvKipcbiAgICogVGhlIG1pbmltdW0gYW1vdW50IG9mIGJ1ZmZlciByZW5kZXJlZCBiZXlvbmQgdGhlIHZpZXdwb3J0IChpbiBwaXhlbHMpLlxuICAgKiBJZiB0aGUgYW1vdW50IG9mIGJ1ZmZlciBkaXBzIGJlbG93IHRoaXMgbnVtYmVyLCBtb3JlIGl0ZW1zIHdpbGwgYmUgcmVuZGVyZWQuIERlZmF1bHRzIHRvIDEwMHB4LlxuICAgKi9cbiAgQElucHV0KClcbiAgZ2V0IG1pbkJ1ZmZlclB4KCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9taW5CdWZmZXJQeDsgfVxuICBzZXQgbWluQnVmZmVyUHgodmFsdWU6IG51bWJlcikgeyB0aGlzLl9taW5CdWZmZXJQeCA9IGNvZXJjZU51bWJlclByb3BlcnR5KHZhbHVlKTsgfVxuICBfbWluQnVmZmVyUHggPSAxMDA7XG5cbiAgLyoqXG4gICAqIFRoZSBudW1iZXIgb2YgcGl4ZWxzIHdvcnRoIG9mIGJ1ZmZlciB0byByZW5kZXIgZm9yIHdoZW4gcmVuZGVyaW5nIG5ldyBpdGVtcy4gRGVmYXVsdHMgdG8gMjAwcHguXG4gICAqL1xuICBASW5wdXQoKVxuICBnZXQgbWF4QnVmZmVyUHgoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX21heEJ1ZmZlclB4OyB9XG4gIHNldCBtYXhCdWZmZXJQeCh2YWx1ZTogbnVtYmVyKSB7IHRoaXMuX21heEJ1ZmZlclB4ID0gY29lcmNlTnVtYmVyUHJvcGVydHkodmFsdWUpOyB9XG4gIF9tYXhCdWZmZXJQeCA9IDIwMDtcblxuICAvKiogVGhlIHNjcm9sbCBzdHJhdGVneSB1c2VkIGJ5IHRoaXMgZGlyZWN0aXZlLiAqL1xuICBfc2Nyb2xsU3RyYXRlZ3kgPVxuICAgICAgbmV3IEZpeGVkU2l6ZVZpcnR1YWxTY3JvbGxTdHJhdGVneSh0aGlzLml0ZW1TaXplLCB0aGlzLm1pbkJ1ZmZlclB4LCB0aGlzLm1heEJ1ZmZlclB4KTtcblxuICBuZ09uQ2hhbmdlcygpIHtcbiAgICB0aGlzLl9zY3JvbGxTdHJhdGVneS51cGRhdGVJdGVtQW5kQnVmZmVyU2l6ZSh0aGlzLml0ZW1TaXplLCB0aGlzLm1pbkJ1ZmZlclB4LCB0aGlzLm1heEJ1ZmZlclB4KTtcbiAgfVxufVxuIl19