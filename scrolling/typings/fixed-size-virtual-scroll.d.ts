import { OnChanges } from '@angular/core';
import { Observable } from 'rxjs';
import { VirtualScrollStrategy } from './virtual-scroll-strategy';
import { CdkVirtualScrollViewport } from './virtual-scroll-viewport';
/** Virtual scrolling strategy for lists with items of known fixed size. */
export declare class FixedSizeVirtualScrollStrategy implements VirtualScrollStrategy {
    private _scrolledIndexChange;
    /** @docs-private Implemented as part of VirtualScrollStrategy. */
    scrolledIndexChange: Observable<number>;
    /** The attached viewport. */
    private _viewport;
    /** The size of the items in the virtually scrolling list. */
    private _itemSize;
    /** The number of buffer items to render beyond the edge of the viewport. */
    private _bufferSize;
    /**
     * @param itemSize The size of the items in the virtually scrolling list.
     * @param bufferSize The number of buffer items to render beyond the edge of the viewport.
     */
    constructor(itemSize: number, bufferSize: number);
    /**
     * Attaches this scroll strategy to a viewport.
     * @param viewport The viewport to attach this strategy to.
     */
    attach(viewport: CdkVirtualScrollViewport): void;
    /** Detaches this scroll strategy from the currently attached viewport. */
    detach(): void;
    /**
     * Update the item size and buffer size.
     * @param itemSize The size of the items in the virtually scrolling list.
     * @param bufferSize he number of buffer items to render beyond the edge of the viewport.
     */
    updateItemAndBufferSize(itemSize: number, bufferSize: number): void;
    /** @docs-private Implemented as part of VirtualScrollStrategy. */
    onContentScrolled(): void;
    /** @docs-private Implemented as part of VirtualScrollStrategy. */
    onDataLengthChanged(): void;
    /** @docs-private Implemented as part of VirtualScrollStrategy. */
    onContentRendered(): void;
    /** @docs-private Implemented as part of VirtualScrollStrategy. */
    onRenderedOffsetChanged(): void;
    /**
     * Scroll to the offset for the given index.
     * @param index The index of the element to scroll to.
     * @param behavior The ScrollBehavior to use when scrolling.
     */
    scrollToIndex(index: number, behavior: ScrollBehavior): void;
    /** Update the viewport's total content size. */
    private _updateTotalContentSize();
    /** Update the viewport's rendered range. */
    private _updateRenderedRange();
    /**
     * Expand the given range by the given amount in either direction.
     * @param range The range to expand
     * @param expandStart The number of items to expand the start of the range by.
     * @param expandEnd The number of items to expand the end of the range by.
     * @return The expanded range.
     */
    private _expandRange(range, expandStart, expandEnd);
}
/**
 * Provider factory for `FixedSizeVirtualScrollStrategy` that simply extracts the already created
 * `FixedSizeVirtualScrollStrategy` from the given directive.
 * @param fixedSizeDir The instance of `CdkFixedSizeVirtualScroll` to extract the
 *     `FixedSizeVirtualScrollStrategy` from.
 */
export declare function _fixedSizeVirtualScrollStrategyFactory(fixedSizeDir: CdkFixedSizeVirtualScroll): FixedSizeVirtualScrollStrategy;
/** A virtual scroll strategy that supports fixed-size items. */
export declare class CdkFixedSizeVirtualScroll implements OnChanges {
    /** The size of the items in the list (in pixels). */
    itemSize: number;
    _itemSize: number;
    /**
     * The number of extra elements to render on either side of the scrolling viewport.
     * Defaults to 5 elements.
     */
    bufferSize: number;
    _bufferSize: number;
    /** The scroll strategy used by this directive. */
    _scrollStrategy: FixedSizeVirtualScrollStrategy;
    ngOnChanges(): void;
}
