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
/** Virtual scrolling strategy for lists with items of known fixed size. */
var FixedSizeVirtualScrollStrategy = /** @class */ (function () {
    /**
     * @param itemSize The size of the items in the virtually scrolling list.
     * @param minBufferPx The minimum amount of buffer (in pixels) before needing to render more
     * @param maxBufferPx The amount of buffer (in pixels) to render when rendering more.
     */
    function FixedSizeVirtualScrollStrategy(itemSize, minBufferPx, maxBufferPx) {
        this._scrolledIndexChange = new Subject();
        /** @docs-private Implemented as part of VirtualScrollStrategy. */
        this.scrolledIndexChange = this._scrolledIndexChange.pipe(distinctUntilChanged());
        /** The attached viewport. */
        this._viewport = null;
        this._itemSize = itemSize;
        this._minBufferPx = minBufferPx;
        this._maxBufferPx = maxBufferPx;
    }
    /**
     * Attaches this scroll strategy to a viewport.
     * @param viewport The viewport to attach this strategy to.
     */
    FixedSizeVirtualScrollStrategy.prototype.attach = function (viewport) {
        this._viewport = viewport;
        this._updateTotalContentSize();
        this._updateRenderedRange();
    };
    /** Detaches this scroll strategy from the currently attached viewport. */
    FixedSizeVirtualScrollStrategy.prototype.detach = function () {
        this._scrolledIndexChange.complete();
        this._viewport = null;
    };
    /**
     * Update the item size and buffer size.
     * @param itemSize The size of the items in the virtually scrolling list.
     * @param minBufferPx The minimum amount of buffer (in pixels) before needing to render more
     * @param maxBufferPx The amount of buffer (in pixels) to render when rendering more.
     */
    FixedSizeVirtualScrollStrategy.prototype.updateItemAndBufferSize = function (itemSize, minBufferPx, maxBufferPx) {
        if (maxBufferPx < minBufferPx) {
            throw Error('CDK virtual scroll: maxBufferPx must be greater than or equal to minBufferPx');
        }
        this._itemSize = itemSize;
        this._minBufferPx = minBufferPx;
        this._maxBufferPx = maxBufferPx;
        this._updateTotalContentSize();
        this._updateRenderedRange();
    };
    /** @docs-private Implemented as part of VirtualScrollStrategy. */
    FixedSizeVirtualScrollStrategy.prototype.onContentScrolled = function () {
        this._updateRenderedRange();
    };
    /** @docs-private Implemented as part of VirtualScrollStrategy. */
    FixedSizeVirtualScrollStrategy.prototype.onDataLengthChanged = function () {
        this._updateTotalContentSize();
        this._updateRenderedRange();
    };
    /** @docs-private Implemented as part of VirtualScrollStrategy. */
    FixedSizeVirtualScrollStrategy.prototype.onContentRendered = function () { };
    /** @docs-private Implemented as part of VirtualScrollStrategy. */
    FixedSizeVirtualScrollStrategy.prototype.onRenderedOffsetChanged = function () { };
    /**
     * Scroll to the offset for the given index.
     * @param index The index of the element to scroll to.
     * @param behavior The ScrollBehavior to use when scrolling.
     */
    FixedSizeVirtualScrollStrategy.prototype.scrollToIndex = function (index, behavior) {
        if (this._viewport) {
            this._viewport.scrollToOffset(index * this._itemSize, behavior);
        }
    };
    /** Update the viewport's total content size. */
    FixedSizeVirtualScrollStrategy.prototype._updateTotalContentSize = function () {
        if (!this._viewport) {
            return;
        }
        this._viewport.setTotalContentSize(this._viewport.getDataLength() * this._itemSize);
    };
    /** Update the viewport's rendered range. */
    FixedSizeVirtualScrollStrategy.prototype._updateRenderedRange = function () {
        if (!this._viewport) {
            return;
        }
        var scrollOffset = this._viewport.measureScrollOffset();
        var firstVisibleIndex = scrollOffset / this._itemSize;
        var renderedRange = this._viewport.getRenderedRange();
        var newRange = { start: renderedRange.start, end: renderedRange.end };
        var viewportSize = this._viewport.getViewportSize();
        var dataLength = this._viewport.getDataLength();
        var startBuffer = scrollOffset - newRange.start * this._itemSize;
        if (startBuffer < this._minBufferPx && newRange.start != 0) {
            var expandStart = Math.ceil((this._maxBufferPx - startBuffer) / this._itemSize);
            newRange.start = Math.max(0, newRange.start - expandStart);
            newRange.end = Math.min(dataLength, Math.ceil(firstVisibleIndex + (viewportSize + this._minBufferPx) / this._itemSize));
        }
        else {
            var endBuffer = newRange.end * this._itemSize - (scrollOffset + viewportSize);
            if (endBuffer < this._minBufferPx && newRange.end != dataLength) {
                var expandEnd = Math.ceil((this._maxBufferPx - endBuffer) / this._itemSize);
                if (expandEnd > 0) {
                    newRange.end = Math.min(dataLength, newRange.end + expandEnd);
                    newRange.start = Math.max(0, Math.floor(firstVisibleIndex - this._minBufferPx / this._itemSize));
                }
            }
        }
        this._viewport.setRenderedRange(newRange);
        this._viewport.setRenderedContentOffset(this._itemSize * newRange.start);
        this._scrolledIndexChange.next(Math.floor(firstVisibleIndex));
    };
    return FixedSizeVirtualScrollStrategy;
}());
export { FixedSizeVirtualScrollStrategy };
/**
 * Provider factory for `FixedSizeVirtualScrollStrategy` that simply extracts the already created
 * `FixedSizeVirtualScrollStrategy` from the given directive.
 * @param fixedSizeDir The instance of `CdkFixedSizeVirtualScroll` to extract the
 *     `FixedSizeVirtualScrollStrategy` from.
 */
export function _fixedSizeVirtualScrollStrategyFactory(fixedSizeDir) {
    return fixedSizeDir._scrollStrategy;
}
/** A virtual scroll strategy that supports fixed-size items. */
var CdkFixedSizeVirtualScroll = /** @class */ (function () {
    function CdkFixedSizeVirtualScroll() {
        this._itemSize = 20;
        this._minBufferPx = 100;
        this._maxBufferPx = 200;
        /** The scroll strategy used by this directive. */
        this._scrollStrategy = new FixedSizeVirtualScrollStrategy(this.itemSize, this.minBufferPx, this.maxBufferPx);
    }
    Object.defineProperty(CdkFixedSizeVirtualScroll.prototype, "itemSize", {
        /** The size of the items in the list (in pixels). */
        get: function () { return this._itemSize; },
        set: function (value) { this._itemSize = coerceNumberProperty(value); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CdkFixedSizeVirtualScroll.prototype, "minBufferPx", {
        /**
         * The minimum amount of buffer rendered beyond the viewport (in pixels).
         * If the amount of buffer dips below this number, more items will be rendered. Defaults to 100px.
         */
        get: function () { return this._minBufferPx; },
        set: function (value) { this._minBufferPx = coerceNumberProperty(value); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CdkFixedSizeVirtualScroll.prototype, "maxBufferPx", {
        /**
         * The number of pixels worth of buffer to render for when rendering new items. Defaults to 200px.
         */
        get: function () { return this._maxBufferPx; },
        set: function (value) { this._maxBufferPx = coerceNumberProperty(value); },
        enumerable: true,
        configurable: true
    });
    CdkFixedSizeVirtualScroll.prototype.ngOnChanges = function () {
        this._scrollStrategy.updateItemAndBufferSize(this.itemSize, this.minBufferPx, this.maxBufferPx);
    };
    CdkFixedSizeVirtualScroll.decorators = [
        { type: Directive, args: [{
                    selector: 'cdk-virtual-scroll-viewport[itemSize]',
                    providers: [{
                            provide: VIRTUAL_SCROLL_STRATEGY,
                            useFactory: _fixedSizeVirtualScrollStrategyFactory,
                            deps: [forwardRef(function () { return CdkFixedSizeVirtualScroll; })],
                        }],
                },] }
    ];
    CdkFixedSizeVirtualScroll.propDecorators = {
        itemSize: [{ type: Input }],
        minBufferPx: [{ type: Input }],
        maxBufferPx: [{ type: Input }]
    };
    return CdkFixedSizeVirtualScroll;
}());
export { CdkFixedSizeVirtualScroll };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZml4ZWQtc2l6ZS12aXJ0dWFsLXNjcm9sbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2Nyb2xsaW5nL2ZpeGVkLXNpemUtdmlydHVhbC1zY3JvbGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDM0QsT0FBTyxFQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFZLE1BQU0sZUFBZSxDQUFDO0FBQ3RFLE9BQU8sRUFBYSxPQUFPLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDekMsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDcEQsT0FBTyxFQUFDLHVCQUF1QixFQUF3QixNQUFNLDJCQUEyQixDQUFDO0FBSXpGLDJFQUEyRTtBQUMzRTtJQWtCRTs7OztPQUlHO0lBQ0gsd0NBQVksUUFBZ0IsRUFBRSxXQUFtQixFQUFFLFdBQW1CO1FBdEI5RCx5QkFBb0IsR0FBRyxJQUFJLE9BQU8sRUFBVSxDQUFDO1FBRXJELGtFQUFrRTtRQUNsRSx3QkFBbUIsR0FBdUIsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUM7UUFFakcsNkJBQTZCO1FBQ3JCLGNBQVMsR0FBb0MsSUFBSSxDQUFDO1FBaUJ4RCxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztRQUMxQixJQUFJLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQztRQUNoQyxJQUFJLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQztJQUNsQyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsK0NBQU0sR0FBTixVQUFPLFFBQWtDO1FBQ3ZDLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1FBQzFCLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1FB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Q0FBQzthQUN2RCxVQUFnQixLQUFhLElBQUksSUFBSSxDQUFDLFlBQVksR0FBRyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7OztPQUQ1QjtJQVF2RCwrQ0FBVyxHQUFYO1FBQ0UsSUFBSSxDQUFDLGVBQWUsQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ2xHLENBQUM7O2dCQXRDRixTQUFTLFNBQUM7b0JBQ1QsUUFBUSxFQUFFLHVDQUF1QztvQkFDakQsU0FBUyxFQUFFLENBQUM7NEJBQ1YsT0FBTyxFQUFFLHVCQUF1Qjs0QkFDaEMsVUFBVSxFQUFFLHNDQUFzQzs0QkFDbEQsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLGNBQU0sT0FBQSx5QkFBeUIsRUFBekIsQ0FBeUIsQ0FBQyxDQUFDO3lCQUNwRCxDQUFDO2lCQUNIOzs7MkJBR0UsS0FBSzs4QkFTTCxLQUFLOzhCQVFMLEtBQUs7O0lBWVIsZ0NBQUM7Q0FBQSxBQXZDRCxJQXVDQztTQS9CWSx5QkFBeUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtjb2VyY2VOdW1iZXJQcm9wZXJ0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7RGlyZWN0aXZlLCBmb3J3YXJkUmVmLCBJbnB1dCwgT25DaGFuZ2VzfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2Rpc3RpbmN0VW50aWxDaGFuZ2VkfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge1ZJUlRVQUxfU0NST0xMX1NUUkFURUdZLCBWaXJ0dWFsU2Nyb2xsU3RyYXRlZ3l9IGZyb20gJy4vdmlydHVhbC1zY3JvbGwtc3RyYXRlZ3knO1xuaW1wb3J0IHtDZGtWaXJ0dWFsU2Nyb2xsVmlld3BvcnR9IGZyb20gJy4vdmlydHVhbC1zY3JvbGwtdmlld3BvcnQnO1xuXG5cbi8qKiBWaXJ0dWFsIHNjcm9sbGluZyBzdHJhdGVneSBmb3IgbGlzdHMgd2l0aCBpdGVtcyBvZiBrbm93biBmaXhlZCBzaXplLiAqL1xuZXhwb3J0IGNsYXNzIEZpeGVkU2l6ZVZpcnR1YWxTY3JvbGxTdHJhdGVneSBpbXBsZW1lbnRzIFZpcnR1YWxTY3JvbGxTdHJhdGVneSB7XG4gIHByaXZhdGUgX3Njcm9sbGVkSW5kZXhDaGFuZ2UgPSBuZXcgU3ViamVjdDxudW1iZXI+KCk7XG5cbiAgLyoqIEBkb2NzLXByaXZhdGUgSW1wbGVtZW50ZWQgYXMgcGFydCBvZiBWaXJ0dWFsU2Nyb2xsU3RyYXRlZ3kuICovXG4gIHNjcm9sbGVkSW5kZXhDaGFuZ2U6IE9ic2VydmFibGU8bnVtYmVyPiA9IHRoaXMuX3Njcm9sbGVkSW5kZXhDaGFuZ2UucGlwZShkaXN0aW5jdFVudGlsQ2hhbmdlZCgpKTtcblxuICAvKiogVGhlIGF0dGFjaGVkIHZpZXdwb3J0LiAqL1xuICBwcml2YXRlIF92aWV3cG9ydDogQ2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0IHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIFRoZSBzaXplIG9mIHRoZSBpdGVtcyBpbiB0aGUgdmlydHVhbGx5IHNjcm9sbGluZyBsaXN0LiAqL1xuICBwcml2YXRlIF9pdGVtU2l6ZTogbnVtYmVyO1xuXG4gIC8qKiBUaGUgbWluaW11bSBhbW91bnQgb2YgYnVmZmVyIHJlbmRlcmVkIGJleW9uZCB0aGUgdmlld3BvcnQgKGluIHBpeGVscykuICovXG4gIHByaXZhdGUgX21pbkJ1ZmZlclB4OiBudW1iZXI7XG5cbiAgLyoqIFRoZSBudW1iZXIgb2YgYnVmZmVyIGl0ZW1zIHRvIHJlbmRlciBiZXlvbmQgdGhlIGVkZ2Ugb2YgdGhlIHZpZXdwb3J0IChpbiBwaXhlbHMpLiAqL1xuICBwcml2YXRlIF9tYXhCdWZmZXJQeDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0gaXRlbVNpemUgVGhlIHNpemUgb2YgdGhlIGl0ZW1zIGluIHRoZSB2aXJ0dWFsbHkgc2Nyb2xsaW5nIGxpc3QuXG4gICAqIEBwYXJhbSBtaW5CdWZmZXJQeCBUaGUgbWluaW11bSBhbW91bnQgb2YgYnVmZmVyIChpbiBwaXhlbHMpIGJlZm9yZSBuZWVkaW5nIHRvIHJlbmRlciBtb3JlXG4gICAqIEBwYXJhbSBtYXhCdWZmZXJQeCBUaGUgYW1vdW50IG9mIGJ1ZmZlciAoaW4gcGl4ZWxzKSB0byByZW5kZXIgd2hlbiByZW5kZXJpbmcgbW9yZS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGl0ZW1TaXplOiBudW1iZXIsIG1pbkJ1ZmZlclB4OiBudW1iZXIsIG1heEJ1ZmZlclB4OiBudW1iZXIpIHtcbiAgICB0aGlzLl9pdGVtU2l6ZSA9IGl0ZW1TaXplO1xuICAgIHRoaXMuX21pbkJ1ZmZlclB4ID0gbWluQnVmZmVyUHg7XG4gICAgdGhpcy5fbWF4QnVmZmVyUHggPSBtYXhCdWZmZXJQeDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRhY2hlcyB0aGlzIHNjcm9sbCBzdHJhdGVneSB0byBhIHZpZXdwb3J0LlxuICAgKiBAcGFyYW0gdmlld3BvcnQgVGhlIHZpZXdwb3J0IHRvIGF0dGFjaCB0aGlzIHN0cmF0ZWd5IHRvLlxuICAgKi9cbiAgYXR0YWNoKHZpZXdwb3J0OiBDZGtWaXJ0dWFsU2Nyb2xsVmlld3BvcnQpIHtcbiAgICB0aGlzLl92aWV3cG9ydCA9IHZpZXdwb3J0O1xuICAgIHRoaXMuX3VwZGF0ZVRvdGFsQ29udGVudFNpemUoKTtcbiAgICB0aGlzLl91cGRhdGVSZW5kZXJlZFJhbmdlKCk7XG4gIH1cblxuICAvKiogRGV0YWNoZXMgdGhpcyBzY3JvbGwgc3RyYXRlZ3kgZnJvbSB0aGUgY3VycmVudGx5IGF0dGFjaGVkIHZpZXdwb3J0LiAqL1xuICBkZXRhY2goKSB7XG4gICAgdGhpcy5fc2Nyb2xsZWRJbmRleENoYW5nZS5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX3ZpZXdwb3J0ID0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIGl0ZW0gc2l6ZSBhbmQgYnVmZmVyIHNpemUuXG4gICAqIEBwYXJhbSBpdGVtU2l6ZSBUaGUgc2l6ZSBvZiB0aGUgaXRlbXMgaW4gdGhlIHZpcnR1YWxseSBzY3JvbGxpbmcgbGlzdC5cbiAgICogQHBhcmFtIG1pbkJ1ZmZlclB4IFRoZSBtaW5pbXVtIGFtb3VudCBvZiBidWZmZXIgKGluIHBpeGVscykgYmVmb3JlIG5lZWRpbmcgdG8gcmVuZGVyIG1vcmVcbiAgICogQHBhcmFtIG1heEJ1ZmZlclB4IFRoZSBhbW91bnQgb2YgYnVmZmVyIChpbiBwaXhlbHMpIHRvIHJlbmRlciB3aGVuIHJlbmRlcmluZyBtb3JlLlxuICAgKi9cbiAgdXBkYXRlSXRlbUFuZEJ1ZmZlclNpemUoaXRlbVNpemU6IG51bWJlciwgbWluQnVmZmVyUHg6IG51bWJlciwgbWF4QnVmZmVyUHg6IG51bWJlcikge1xuICAgIGlmIChtYXhCdWZmZXJQeCA8IG1pbkJ1ZmZlclB4KSB7XG4gICAgICB0aHJvdyBFcnJvcignQ0RLIHZpcnR1YWwgc2Nyb2xsOiBtYXhCdWZmZXJQeCBtdXN0IGJlIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byBtaW5CdWZmZXJQeCcpO1xuICAgIH1cbiAgICB0aGlzLl9pdGVtU2l6ZSA9IGl0ZW1TaXplO1xuICAgIHRoaXMuX21pbkJ1ZmZlclB4ID0gbWluQnVmZmVyUHg7XG4gICAgdGhpcy5fbWF4QnVmZmVyUHggPSBtYXhCdWZmZXJQeDtcbiAgICB0aGlzLl91cGRhdGVUb3RhbENvbnRlbnRTaXplKCk7XG4gICAgdGhpcy5fdXBkYXRlUmVuZGVyZWRSYW5nZSgpO1xuICB9XG5cbiAgLyoqIEBkb2NzLXByaXZhdGUgSW1wbGVtZW50ZWQgYXMgcGFydCBvZiBWaXJ0dWFsU2Nyb2xsU3RyYXRlZ3kuICovXG4gIG9uQ29udGVudFNjcm9sbGVkKCkge1xuICAgIHRoaXMuX3VwZGF0ZVJlbmRlcmVkUmFuZ2UoKTtcbiAgfVxuXG4gIC8qKiBAZG9jcy1wcml2YXRlIEltcGxlbWVudGVkIGFzIHBhcnQgb2YgVmlydHVhbFNjcm9sbFN0cmF0ZWd5LiAqL1xuICBvbkRhdGFMZW5ndGhDaGFuZ2VkKCkge1xuICAgIHRoaXMuX3VwZGF0ZVRvdGFsQ29udGVudFNpemUoKTtcbiAgICB0aGlzLl91cGRhdGVSZW5kZXJlZFJhbmdlKCk7XG4gIH1cblxuICAvKiogQGRvY3MtcHJpdmF0ZSBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIFZpcnR1YWxTY3JvbGxTdHJhdGVneS4gKi9cbiAgb25Db250ZW50UmVuZGVyZWQoKSB7IC8qIG5vLW9wICovIH1cblxuICAvKiogQGRvY3MtcHJpdmF0ZSBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIFZpcnR1YWxTY3JvbGxTdHJhdGVneS4gKi9cbiAgb25SZW5kZXJlZE9mZnNldENoYW5nZWQoKSB7IC8qIG5vLW9wICovIH1cblxuICAvKipcbiAgICogU2Nyb2xsIHRvIHRoZSBvZmZzZXQgZm9yIHRoZSBnaXZlbiBpbmRleC5cbiAgICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCB0byBzY3JvbGwgdG8uXG4gICAqIEBwYXJhbSBiZWhhdmlvciBUaGUgU2Nyb2xsQmVoYXZpb3IgdG8gdXNlIHdoZW4gc2Nyb2xsaW5nLlxuICAgKi9cbiAgc2Nyb2xsVG9JbmRleChpbmRleDogbnVtYmVyLCBiZWhhdmlvcjogU2Nyb2xsQmVoYXZpb3IpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fdmlld3BvcnQpIHtcbiAgICAgIHRoaXMuX3ZpZXdwb3J0LnNjcm9sbFRvT2Zmc2V0KGluZGV4ICogdGhpcy5faXRlbVNpemUsIGJlaGF2aW9yKTtcbiAgICB9XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSB2aWV3cG9ydCdzIHRvdGFsIGNvbnRlbnQgc2l6ZS4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlVG90YWxDb250ZW50U2l6ZSgpIHtcbiAgICBpZiAoIXRoaXMuX3ZpZXdwb3J0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fdmlld3BvcnQuc2V0VG90YWxDb250ZW50U2l6ZSh0aGlzLl92aWV3cG9ydC5nZXREYXRhTGVuZ3RoKCkgKiB0aGlzLl9pdGVtU2l6ZSk7XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSB2aWV3cG9ydCdzIHJlbmRlcmVkIHJhbmdlLiAqL1xuICBwcml2YXRlIF91cGRhdGVSZW5kZXJlZFJhbmdlKCkge1xuICAgIGlmICghdGhpcy5fdmlld3BvcnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzY3JvbGxPZmZzZXQgPSB0aGlzLl92aWV3cG9ydC5tZWFzdXJlU2Nyb2xsT2Zmc2V0KCk7XG4gICAgY29uc3QgZmlyc3RWaXNpYmxlSW5kZXggPSBzY3JvbGxPZmZzZXQgLyB0aGlzLl9pdGVtU2l6ZTtcbiAgICBjb25zdCByZW5kZXJlZFJhbmdlID0gdGhpcy5fdmlld3BvcnQuZ2V0UmVuZGVyZWRSYW5nZSgpO1xuICAgIGNvbnN0IG5ld1JhbmdlID0ge3N0YXJ0OiByZW5kZXJlZFJhbmdlLnN0YXJ0LCBlbmQ6IHJlbmRlcmVkUmFuZ2UuZW5kfTtcbiAgICBjb25zdCB2aWV3cG9ydFNpemUgPSB0aGlzLl92aWV3cG9ydC5nZXRWaWV3cG9ydFNpemUoKTtcbiAgICBjb25zdCBkYXRhTGVuZ3RoID0gdGhpcy5fdmlld3BvcnQuZ2V0RGF0YUxlbmd0aCgpO1xuXG4gICAgY29uc3Qgc3RhcnRCdWZmZXIgPSBzY3JvbGxPZmZzZXQgLSBuZXdSYW5nZS5zdGFydCAqIHRoaXMuX2l0ZW1TaXplO1xuICAgIGlmIChzdGFydEJ1ZmZlciA8IHRoaXMuX21pbkJ1ZmZlclB4ICYmIG5ld1JhbmdlLnN0YXJ0ICE9IDApIHtcbiAgICAgIGNvbnN0IGV4cGFuZFN0YXJ0ID0gTWF0aC5jZWlsKCh0aGlzLl9tYXhCdWZmZXJQeCAtIHN0YXJ0QnVmZmVyKSAvIHRoaXMuX2l0ZW1TaXplKTtcbiAgICAgIG5ld1JhbmdlLnN0YXJ0ID0gTWF0aC5tYXgoMCwgbmV3UmFuZ2Uuc3RhcnQgLSBleHBhbmRTdGFydCk7XG4gICAgICBuZXdSYW5nZS5lbmQgPSBNYXRoLm1pbihkYXRhTGVuZ3RoLFxuICAgICAgICAgIE1hdGguY2VpbChmaXJzdFZpc2libGVJbmRleCArICh2aWV3cG9ydFNpemUgKyB0aGlzLl9taW5CdWZmZXJQeCkgLyB0aGlzLl9pdGVtU2l6ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBlbmRCdWZmZXIgPSBuZXdSYW5nZS5lbmQgKiB0aGlzLl9pdGVtU2l6ZSAtIChzY3JvbGxPZmZzZXQgKyB2aWV3cG9ydFNpemUpO1xuICAgICAgaWYgKGVuZEJ1ZmZlciA8IHRoaXMuX21pbkJ1ZmZlclB4ICYmIG5ld1JhbmdlLmVuZCAhPSBkYXRhTGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IGV4cGFuZEVuZCA9IE1hdGguY2VpbCgodGhpcy5fbWF4QnVmZmVyUHggLSBlbmRCdWZmZXIpIC8gdGhpcy5faXRlbVNpemUpO1xuICAgICAgICBpZiAoZXhwYW5kRW5kID4gMCkge1xuICAgICAgICAgIG5ld1JhbmdlLmVuZCA9IE1hdGgubWluKGRhdGFMZW5ndGgsIG5ld1JhbmdlLmVuZCArIGV4cGFuZEVuZCk7XG4gICAgICAgICAgbmV3UmFuZ2Uuc3RhcnQgPSBNYXRoLm1heCgwLFxuICAgICAgICAgICAgICBNYXRoLmZsb29yKGZpcnN0VmlzaWJsZUluZGV4IC0gdGhpcy5fbWluQnVmZmVyUHggLyB0aGlzLl9pdGVtU2l6ZSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fdmlld3BvcnQuc2V0UmVuZGVyZWRSYW5nZShuZXdSYW5nZSk7XG4gICAgdGhpcy5fdmlld3BvcnQuc2V0UmVuZGVyZWRDb250ZW50T2Zmc2V0KHRoaXMuX2l0ZW1TaXplICogbmV3UmFuZ2Uuc3RhcnQpO1xuICAgIHRoaXMuX3Njcm9sbGVkSW5kZXhDaGFuZ2UubmV4dChNYXRoLmZsb29yKGZpcnN0VmlzaWJsZUluZGV4KSk7XG4gIH1cbn1cblxuXG4vKipcbiAqIFByb3ZpZGVyIGZhY3RvcnkgZm9yIGBGaXhlZFNpemVWaXJ0dWFsU2Nyb2xsU3RyYXRlZ3lgIHRoYXQgc2ltcGx5IGV4dHJhY3RzIHRoZSBhbHJlYWR5IGNyZWF0ZWRcbiAqIGBGaXhlZFNpemVWaXJ0dWFsU2Nyb2xsU3RyYXRlZ3lgIGZyb20gdGhlIGdpdmVuIGRpcmVjdGl2ZS5cbiAqIEBwYXJhbSBmaXhlZFNpemVEaXIgVGhlIGluc3RhbmNlIG9mIGBDZGtGaXhlZFNpemVWaXJ0dWFsU2Nyb2xsYCB0byBleHRyYWN0IHRoZVxuICogICAgIGBGaXhlZFNpemVWaXJ0dWFsU2Nyb2xsU3RyYXRlZ3lgIGZyb20uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfZml4ZWRTaXplVmlydHVhbFNjcm9sbFN0cmF0ZWd5RmFjdG9yeShmaXhlZFNpemVEaXI6IENka0ZpeGVkU2l6ZVZpcnR1YWxTY3JvbGwpIHtcbiAgcmV0dXJuIGZpeGVkU2l6ZURpci5fc2Nyb2xsU3RyYXRlZ3k7XG59XG5cblxuLyoqIEEgdmlydHVhbCBzY3JvbGwgc3RyYXRlZ3kgdGhhdCBzdXBwb3J0cyBmaXhlZC1zaXplIGl0ZW1zLiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnY2RrLXZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0W2l0ZW1TaXplXScsXG4gIHByb3ZpZGVyczogW3tcbiAgICBwcm92aWRlOiBWSVJUVUFMX1NDUk9MTF9TVFJBVEVHWSxcbiAgICB1c2VGYWN0b3J5OiBfZml4ZWRTaXplVmlydHVhbFNjcm9sbFN0cmF0ZWd5RmFjdG9yeSxcbiAgICBkZXBzOiBbZm9yd2FyZFJlZigoKSA9PiBDZGtGaXhlZFNpemVWaXJ0dWFsU2Nyb2xsKV0sXG4gIH1dLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtGaXhlZFNpemVWaXJ0dWFsU2Nyb2xsIGltcGxlbWVudHMgT25DaGFuZ2VzIHtcbiAgLyoqIFRoZSBzaXplIG9mIHRoZSBpdGVtcyBpbiB0aGUgbGlzdCAoaW4gcGl4ZWxzKS4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGl0ZW1TaXplKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9pdGVtU2l6ZTsgfVxuICBzZXQgaXRlbVNpemUodmFsdWU6IG51bWJlcikgeyB0aGlzLl9pdGVtU2l6ZSA9IGNvZXJjZU51bWJlclByb3BlcnR5KHZhbHVlKTsgfVxuICBfaXRlbVNpemUgPSAyMDtcblxuICAvKipcbiAgICogVGhlIG1pbmltdW0gYW1vdW50IG9mIGJ1ZmZlciByZW5kZXJlZCBiZXlvbmQgdGhlIHZpZXdwb3J0IChpbiBwaXhlbHMpLlxuICAgKiBJZiB0aGUgYW1vdW50IG9mIGJ1ZmZlciBkaXBzIGJlbG93IHRoaXMgbnVtYmVyLCBtb3JlIGl0ZW1zIHdpbGwgYmUgcmVuZGVyZWQuIERlZmF1bHRzIHRvIDEwMHB4LlxuICAgKi9cbiAgQElucHV0KClcbiAgZ2V0IG1pbkJ1ZmZlclB4KCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9taW5CdWZmZXJQeDsgfVxuICBzZXQgbWluQnVmZmVyUHgodmFsdWU6IG51bWJlcikgeyB0aGlzLl9taW5CdWZmZXJQeCA9IGNvZXJjZU51bWJlclByb3BlcnR5KHZhbHVlKTsgfVxuICBfbWluQnVmZmVyUHggPSAxMDA7XG5cbiAgLyoqXG4gICAqIFRoZSBudW1iZXIgb2YgcGl4ZWxzIHdvcnRoIG9mIGJ1ZmZlciB0byByZW5kZXIgZm9yIHdoZW4gcmVuZGVyaW5nIG5ldyBpdGVtcy4gRGVmYXVsdHMgdG8gMjAwcHguXG4gICAqL1xuICBASW5wdXQoKVxuICBnZXQgbWF4QnVmZmVyUHgoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX21heEJ1ZmZlclB4OyB9XG4gIHNldCBtYXhCdWZmZXJQeCh2YWx1ZTogbnVtYmVyKSB7IHRoaXMuX21heEJ1ZmZlclB4ID0gY29lcmNlTnVtYmVyUHJvcGVydHkodmFsdWUpOyB9XG4gIF9tYXhCdWZmZXJQeCA9IDIwMDtcblxuICAvKiogVGhlIHNjcm9sbCBzdHJhdGVneSB1c2VkIGJ5IHRoaXMgZGlyZWN0aXZlLiAqL1xuICBfc2Nyb2xsU3RyYXRlZ3kgPVxuICAgICAgbmV3IEZpeGVkU2l6ZVZpcnR1YWxTY3JvbGxTdHJhdGVneSh0aGlzLml0ZW1TaXplLCB0aGlzLm1pbkJ1ZmZlclB4LCB0aGlzLm1heEJ1ZmZlclB4KTtcblxuICBuZ09uQ2hhbmdlcygpIHtcbiAgICB0aGlzLl9zY3JvbGxTdHJhdGVneS51cGRhdGVJdGVtQW5kQnVmZmVyU2l6ZSh0aGlzLml0ZW1TaXplLCB0aGlzLm1pbkJ1ZmZlclB4LCB0aGlzLm1heEJ1ZmZlclB4KTtcbiAgfVxufVxuIl19