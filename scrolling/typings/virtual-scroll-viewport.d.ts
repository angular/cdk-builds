/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ListRange } from '@angular/cdk/collections';
import { ChangeDetectorRef, ElementRef, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CdkVirtualForOf } from './virtual-for-of';
import { VirtualScrollStrategy } from './virtual-scroll-strategy';
/** A viewport that virtualizes it's scrolling with the help of `CdkVirtualForOf`. */
export declare class CdkVirtualScrollViewport implements OnInit, OnDestroy {
    elementRef: ElementRef<HTMLElement>;
    private _changeDetectorRef;
    private _ngZone;
    private _scrollStrategy;
    /** Emits when the viewport is detached from a CdkVirtualForOf. */
    private _detachedSubject;
    /** Emits when the rendered range changes. */
    private _renderedRangeSubject;
    /** Emits when a change detection cycle completes. */
    private _changeDetectionComplete;
    /** The direction the viewport scrolls. */
    orientation: 'horizontal' | 'vertical';
    /** Emits when the index of the first element visible in the viewport changes. */
    scrolledIndexChange: Observable<number>;
    /** The element that wraps the rendered content. */
    _contentWrapper: ElementRef<HTMLElement>;
    /** A stream that emits whenever the rendered range changes. */
    renderedRangeStream: Observable<ListRange>;
    /**
     * The transform used to scale the spacer to the same size as all content, including content that
     * is not currently rendered.
     */
    _totalContentSizeTransform: string;
    /**
     * The total size of all content (in pixels), including content that is not currently rendered.
     */
    private _totalContentSize;
    /**
     * The CSS transform applied to the rendered subset of items so that they appear within the bounds
     * of the visible viewport.
     */
    private _renderedContentTransform;
    /** The currently rendered range of indices. */
    private _renderedRange;
    /** The length of the data bound to this viewport (in number of items). */
    private _dataLength;
    /** The size of the viewport (in pixels). */
    private _viewportSize;
    /** The pending scroll offset to be applied during the next change detection cycle. */
    private _pendingScrollOffset;
    /** the currently attached CdkVirtualForOf. */
    private _forOf;
    /** The last rendered content offset that was set. */
    private _renderedContentOffset;
    /**
     * Whether the last rendered content offset was to the end of the content (and therefore needs to
     * be rewritten as an offset to the start of the content).
     */
    private _renderedContentOffsetNeedsRewrite;
    /** Observable that emits when the viewport is destroyed. */
    private _destroyed;
    /** Whether there is a pending change detection cycle. */
    private _isChangeDetectionPending;
    /** A list of functions to run after the next change detection cycle. */
    private _runAfterChangeDetection;
    constructor(elementRef: ElementRef<HTMLElement>, _changeDetectorRef: ChangeDetectorRef, _ngZone: NgZone, _scrollStrategy: VirtualScrollStrategy);
    ngOnInit(): void;
    ngOnDestroy(): void;
    /** Attaches a `CdkVirtualForOf` to this viewport. */
    attach(forOf: CdkVirtualForOf<any>): void;
    /** Detaches the current `CdkVirtualForOf`. */
    detach(): void;
    /** Gets the length of the data bound to this viewport (in number of items). */
    getDataLength(): number;
    /** Gets the size of the viewport (in pixels). */
    getViewportSize(): number;
    /** Get the current rendered range of items. */
    getRenderedRange(): ListRange;
    /**
     * Sets the total size of all content (in pixels), including content that is not currently
     * rendered.
     */
    setTotalContentSize(size: number): void;
    /** Sets the currently rendered range of indices. */
    setRenderedRange(range: ListRange): void;
    /**
     * Gets the offset from the start of the viewport to the start of the rendered data (in pixels).
     */
    getOffsetToRenderedContentStart(): number | null;
    /**
     * Sets the offset from the start of the viewport to either the start or end of the rendered data
     * (in pixels).
     */
    setRenderedContentOffset(offset: number, to?: 'to-start' | 'to-end'): void;
    /**
     * Scrolls to the offset on the viewport.
     * @param offset The offset to scroll to.
     * @param behavior The ScrollBehavior to use when scrolling. Default is behavior is `auto`.
     */
    scrollToOffset(offset: number, behavior?: ScrollBehavior): void;
    /**
     * Scrolls to the offset for the given index.
     * @param index The index of the element to scroll to.
     * @param behavior The ScrollBehavior to use when scrolling. Default is behavior is `auto`.
     */
    scrollToIndex(index: number, behavior?: ScrollBehavior): void;
    /** @docs-private Internal method to set the scroll offset on the viewport. */
    setScrollOffset(offset: number): void;
    /** Gets the current scroll offset of the viewport (in pixels). */
    measureScrollOffset(): number;
    /** Measure the combined size of all of the rendered items. */
    measureRenderedContentSize(): number;
    /**
     * Measure the total combined size of the given range. Throws if the range includes items that are
     * not rendered.
     */
    measureRangeSize(range: ListRange): number;
    /** Update the viewport dimensions and re-render. */
    checkViewportSize(): void;
    /** Measure the viewport size. */
    private _measureViewportSize();
    /** Queue up change detection to run. */
    private _markChangeDetectionNeeded(runAfter?);
    /** Run change detection. */
    private _doChangeDetection();
}
