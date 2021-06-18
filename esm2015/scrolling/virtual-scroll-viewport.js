/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directionality } from '@angular/cdk/bidi';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, Input, NgZone, Optional, Output, ViewChild, ViewEncapsulation, } from '@angular/core';
import { animationFrameScheduler, asapScheduler, Observable, Subject, Subscription, } from 'rxjs';
import { auditTime, startWith, takeUntil } from 'rxjs/operators';
import { ScrollDispatcher } from './scroll-dispatcher';
import { CdkScrollable } from './scrollable';
import { VIRTUAL_SCROLL_STRATEGY } from './virtual-scroll-strategy';
import { ViewportRuler } from './viewport-ruler';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
/** Checks if the given ranges are equal. */
function rangesEqual(r1, r2) {
    return r1.start == r2.start && r1.end == r2.end;
}
/**
 * Scheduler to be used for scroll events. Needs to fall back to
 * something that doesn't rely on requestAnimationFrame on environments
 * that don't support it (e.g. server-side rendering).
 */
const SCROLL_SCHEDULER = typeof requestAnimationFrame !== 'undefined' ? animationFrameScheduler : asapScheduler;
/** A viewport that virtualizes its scrolling with the help of `CdkVirtualForOf`. */
export class CdkVirtualScrollViewport extends CdkScrollable {
    constructor(elementRef, _changeDetectorRef, ngZone, _scrollStrategy, dir, scrollDispatcher, viewportRuler) {
        super(elementRef, scrollDispatcher, ngZone, dir);
        this.elementRef = elementRef;
        this._changeDetectorRef = _changeDetectorRef;
        this._scrollStrategy = _scrollStrategy;
        /** Emits when the viewport is detached from a CdkVirtualForOf. */
        this._detachedSubject = new Subject();
        /** Emits when the rendered range changes. */
        this._renderedRangeSubject = new Subject();
        this._orientation = 'vertical';
        this._appendOnly = false;
        // Note: we don't use the typical EventEmitter here because we need to subscribe to the scroll
        // strategy lazily (i.e. only if the user is actually listening to the events). We do this because
        // depending on how the strategy calculates the scrolled index, it may come at a cost to
        // performance.
        /** Emits when the index of the first element visible in the viewport changes. */
        this.scrolledIndexChange = new Observable((observer) => this._scrollStrategy.scrolledIndexChange.subscribe(index => Promise.resolve().then(() => this.ngZone.run(() => observer.next(index)))));
        /** A stream that emits whenever the rendered range changes. */
        this.renderedRangeStream = this._renderedRangeSubject;
        /**
         * The total size of all content (in pixels), including content that is not currently rendered.
         */
        this._totalContentSize = 0;
        /** A string representing the `style.width` property value to be used for the spacer element. */
        this._totalContentWidth = '';
        /** A string representing the `style.height` property value to be used for the spacer element. */
        this._totalContentHeight = '';
        /** The currently rendered range of indices. */
        this._renderedRange = { start: 0, end: 0 };
        /** The length of the data bound to this viewport (in number of items). */
        this._dataLength = 0;
        /** The size of the viewport (in pixels). */
        this._viewportSize = 0;
        /** The last rendered content offset that was set. */
        this._renderedContentOffset = 0;
        /**
         * Whether the last rendered content offset was to the end of the content (and therefore needs to
         * be rewritten as an offset to the start of the content).
         */
        this._renderedContentOffsetNeedsRewrite = false;
        /** Whether there is a pending change detection cycle. */
        this._isChangeDetectionPending = false;
        /** A list of functions to run after the next change detection cycle. */
        this._runAfterChangeDetection = [];
        /** Subscription to changes in the viewport size. */
        this._viewportChanges = Subscription.EMPTY;
        if (!_scrollStrategy && (typeof ngDevMode === 'undefined' || ngDevMode)) {
            throw Error('Error: cdk-virtual-scroll-viewport requires the "itemSize" property to be set.');
        }
        this._viewportChanges = viewportRuler.change().subscribe(() => {
            this.checkViewportSize();
        });
    }
    /** The direction the viewport scrolls. */
    get orientation() {
        return this._orientation;
    }
    set orientation(orientation) {
        if (this._orientation !== orientation) {
            this._orientation = orientation;
            this._calculateSpacerSize();
        }
    }
    /**
     * Whether rendered items should persist in the DOM after scrolling out of view. By default, items
     * will be removed.
     */
    get appendOnly() {
        return this._appendOnly;
    }
    set appendOnly(value) {
        this._appendOnly = coerceBooleanProperty(value);
    }
    ngOnInit() {
        super.ngOnInit();
        // It's still too early to measure the viewport at this point. Deferring with a promise allows
        // the Viewport to be rendered with the correct size before we measure. We run this outside the
        // zone to avoid causing more change detection cycles. We handle the change detection loop
        // ourselves instead.
        this.ngZone.runOutsideAngular(() => Promise.resolve().then(() => {
            this._measureViewportSize();
            this._scrollStrategy.attach(this);
            this.elementScrolled()
                .pipe(
            // Start off with a fake scroll event so we properly detect our initial position.
            startWith(null), 
            // Collect multiple events into one until the next animation frame. This way if
            // there are multiple scroll events in the same frame we only need to recheck
            // our layout once.
            auditTime(0, SCROLL_SCHEDULER))
                .subscribe(() => this._scrollStrategy.onContentScrolled());
            this._markChangeDetectionNeeded();
        }));
    }
    ngOnDestroy() {
        this.detach();
        this._scrollStrategy.detach();
        // Complete all subjects
        this._renderedRangeSubject.complete();
        this._detachedSubject.complete();
        this._viewportChanges.unsubscribe();
        super.ngOnDestroy();
    }
    /** Attaches a `CdkVirtualScrollRepeater` to this viewport. */
    attach(forOf) {
        if (this._forOf && (typeof ngDevMode === 'undefined' || ngDevMode)) {
            throw Error('CdkVirtualScrollViewport is already attached.');
        }
        // Subscribe to the data stream of the CdkVirtualForOf to keep track of when the data length
        // changes. Run outside the zone to avoid triggering change detection, since we're managing the
        // change detection loop ourselves.
        this.ngZone.runOutsideAngular(() => {
            this._forOf = forOf;
            this._forOf.dataStream.pipe(takeUntil(this._detachedSubject)).subscribe(data => {
                const newLength = data.length;
                if (newLength !== this._dataLength) {
                    this._dataLength = newLength;
                    this._scrollStrategy.onDataLengthChanged();
                }
                this._doChangeDetection();
            });
        });
    }
    /** Detaches the current `CdkVirtualForOf`. */
    detach() {
        this._forOf = null;
        this._detachedSubject.next();
    }
    /** Gets the length of the data bound to this viewport (in number of items). */
    getDataLength() {
        return this._dataLength;
    }
    /** Gets the size of the viewport (in pixels). */
    getViewportSize() {
        return this._viewportSize;
    }
    // TODO(mmalerba): This is technically out of sync with what's really rendered until a render
    // cycle happens. I'm being careful to only call it after the render cycle is complete and before
    // setting it to something else, but its error prone and should probably be split into
    // `pendingRange` and `renderedRange`, the latter reflecting whats actually in the DOM.
    /** Get the current rendered range of items. */
    getRenderedRange() {
        return this._renderedRange;
    }
    /**
     * Sets the total size of all content (in pixels), including content that is not currently
     * rendered.
     */
    setTotalContentSize(size) {
        if (this._totalContentSize !== size) {
            this._totalContentSize = size;
            this._calculateSpacerSize();
            this._markChangeDetectionNeeded();
        }
    }
    /** Sets the currently rendered range of indices. */
    setRenderedRange(range) {
        if (!rangesEqual(this._renderedRange, range)) {
            if (this.appendOnly) {
                range = { start: 0, end: Math.max(this._renderedRange.end, range.end) };
            }
            this._renderedRangeSubject.next(this._renderedRange = range);
            this._markChangeDetectionNeeded(() => this._scrollStrategy.onContentRendered());
        }
    }
    /**
     * Gets the offset from the start of the viewport to the start of the rendered data (in pixels).
     */
    getOffsetToRenderedContentStart() {
        return this._renderedContentOffsetNeedsRewrite ? null : this._renderedContentOffset;
    }
    /**
     * Sets the offset from the start of the viewport to either the start or end of the rendered data
     * (in pixels).
     */
    setRenderedContentOffset(offset, to = 'to-start') {
        // For a horizontal viewport in a right-to-left language we need to translate along the x-axis
        // in the negative direction.
        const isRtl = this.dir && this.dir.value == 'rtl';
        const isHorizontal = this.orientation == 'horizontal';
        const axis = isHorizontal ? 'X' : 'Y';
        const axisDirection = isHorizontal && isRtl ? -1 : 1;
        let transform = `translate${axis}(${Number(axisDirection * offset)}px)`;
        this._renderedContentOffset = offset;
        if (to === 'to-end') {
            transform += ` translate${axis}(-100%)`;
            // The viewport should rewrite this as a `to-start` offset on the next render cycle. Otherwise
            // elements will appear to expand in the wrong direction (e.g. `mat-expansion-panel` would
            // expand upward).
            this._renderedContentOffsetNeedsRewrite = true;
        }
        if (this._renderedContentTransform != transform) {
            // We know this value is safe because we parse `offset` with `Number()` before passing it
            // into the string.
            this._renderedContentTransform = transform;
            this._markChangeDetectionNeeded(() => {
                if (this._renderedContentOffsetNeedsRewrite) {
                    this._renderedContentOffset -= this.measureRenderedContentSize();
                    this._renderedContentOffsetNeedsRewrite = false;
                    this.setRenderedContentOffset(this._renderedContentOffset);
                }
                else {
                    this._scrollStrategy.onRenderedOffsetChanged();
                }
            });
        }
    }
    /**
     * Scrolls to the given offset from the start of the viewport. Please note that this is not always
     * the same as setting `scrollTop` or `scrollLeft`. In a horizontal viewport with right-to-left
     * direction, this would be the equivalent of setting a fictional `scrollRight` property.
     * @param offset The offset to scroll to.
     * @param behavior The ScrollBehavior to use when scrolling. Default is behavior is `auto`.
     */
    scrollToOffset(offset, behavior = 'auto') {
        const options = { behavior };
        if (this.orientation === 'horizontal') {
            options.start = offset;
        }
        else {
            options.top = offset;
        }
        this.scrollTo(options);
    }
    /**
     * Scrolls to the offset for the given index.
     * @param index The index of the element to scroll to.
     * @param behavior The ScrollBehavior to use when scrolling. Default is behavior is `auto`.
     */
    scrollToIndex(index, behavior = 'auto') {
        this._scrollStrategy.scrollToIndex(index, behavior);
    }
    /**
     * Gets the current scroll offset from the start of the viewport (in pixels).
     * @param from The edge to measure the offset from. Defaults to 'top' in vertical mode and 'start'
     *     in horizontal mode.
     */
    measureScrollOffset(from) {
        return from ?
            super.measureScrollOffset(from) :
            super.measureScrollOffset(this.orientation === 'horizontal' ? 'start' : 'top');
    }
    /** Measure the combined size of all of the rendered items. */
    measureRenderedContentSize() {
        const contentEl = this._contentWrapper.nativeElement;
        return this.orientation === 'horizontal' ? contentEl.offsetWidth : contentEl.offsetHeight;
    }
    /**
     * Measure the total combined size of the given range. Throws if the range includes items that are
     * not rendered.
     */
    measureRangeSize(range) {
        if (!this._forOf) {
            return 0;
        }
        return this._forOf.measureRangeSize(range, this.orientation);
    }
    /** Update the viewport dimensions and re-render. */
    checkViewportSize() {
        // TODO: Cleanup later when add logic for handling content resize
        this._measureViewportSize();
        this._scrollStrategy.onDataLengthChanged();
    }
    /** Measure the viewport size. */
    _measureViewportSize() {
        const viewportEl = this.elementRef.nativeElement;
        this._viewportSize = this.orientation === 'horizontal' ?
            viewportEl.clientWidth : viewportEl.clientHeight;
    }
    /** Queue up change detection to run. */
    _markChangeDetectionNeeded(runAfter) {
        if (runAfter) {
            this._runAfterChangeDetection.push(runAfter);
        }
        // Use a Promise to batch together calls to `_doChangeDetection`. This way if we set a bunch of
        // properties sequentially we only have to run `_doChangeDetection` once at the end.
        if (!this._isChangeDetectionPending) {
            this._isChangeDetectionPending = true;
            this.ngZone.runOutsideAngular(() => Promise.resolve().then(() => {
                this._doChangeDetection();
            }));
        }
    }
    /** Run change detection. */
    _doChangeDetection() {
        this._isChangeDetectionPending = false;
        // Apply the content transform. The transform can't be set via an Angular binding because
        // bypassSecurityTrustStyle is banned in Google. However the value is safe, it's composed of
        // string literals, a variable that can only be 'X' or 'Y', and user input that is run through
        // the `Number` function first to coerce it to a numeric value.
        this._contentWrapper.nativeElement.style.transform = this._renderedContentTransform;
        // Apply changes to Angular bindings. Note: We must call `markForCheck` to run change detection
        // from the root, since the repeated items are content projected in. Calling `detectChanges`
        // instead does not properly check the projected content.
        this.ngZone.run(() => this._changeDetectorRef.markForCheck());
        const runAfterChangeDetection = this._runAfterChangeDetection;
        this._runAfterChangeDetection = [];
        for (const fn of runAfterChangeDetection) {
            fn();
        }
    }
    /** Calculates the `style.width` and `style.height` for the spacer element. */
    _calculateSpacerSize() {
        this._totalContentHeight =
            this.orientation === 'horizontal' ? '' : `${this._totalContentSize}px`;
        this._totalContentWidth =
            this.orientation === 'horizontal' ? `${this._totalContentSize}px` : '';
    }
}
CdkVirtualScrollViewport.decorators = [
    { type: Component, args: [{
                selector: 'cdk-virtual-scroll-viewport',
                template: "<!--\n  Wrap the rendered content in an element that will be used to offset it based on the scroll\n  position.\n-->\n<div #contentWrapper class=\"cdk-virtual-scroll-content-wrapper\">\n  <ng-content></ng-content>\n</div>\n<!--\n  Spacer used to force the scrolling container to the correct size for the *total* number of items\n  so that the scrollbar captures the size of the entire data set.\n-->\n<div class=\"cdk-virtual-scroll-spacer\"\n     [style.width]=\"_totalContentWidth\" [style.height]=\"_totalContentHeight\"></div>\n",
                host: {
                    'class': 'cdk-virtual-scroll-viewport',
                    '[class.cdk-virtual-scroll-orientation-horizontal]': 'orientation === "horizontal"',
                    '[class.cdk-virtual-scroll-orientation-vertical]': 'orientation !== "horizontal"',
                },
                encapsulation: ViewEncapsulation.None,
                changeDetection: ChangeDetectionStrategy.OnPush,
                providers: [{
                        provide: CdkScrollable,
                        useExisting: CdkVirtualScrollViewport,
                    }],
                styles: ["cdk-virtual-scroll-viewport{display:block;position:relative;overflow:auto;contain:strict;transform:translateZ(0);will-change:scroll-position;-webkit-overflow-scrolling:touch}.cdk-virtual-scroll-content-wrapper{position:absolute;top:0;left:0;contain:content}[dir=rtl] .cdk-virtual-scroll-content-wrapper{right:0;left:auto}.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper{min-height:100%}.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>dl:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>ol:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>table:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>ul:not([cdkVirtualFor]){padding-left:0;padding-right:0;margin-left:0;margin-right:0;border-left-width:0;border-right-width:0;outline:none}.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper{min-width:100%}.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>dl:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>ol:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>table:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>ul:not([cdkVirtualFor]){padding-top:0;padding-bottom:0;margin-top:0;margin-bottom:0;border-top-width:0;border-bottom-width:0;outline:none}.cdk-virtual-scroll-spacer{position:absolute;top:0;left:0;height:1px;width:1px;transform-origin:0 0}[dir=rtl] .cdk-virtual-scroll-spacer{right:0;left:auto;transform-origin:100% 0}\n"]
            },] }
];
CdkVirtualScrollViewport.ctorParameters = () => [
    { type: ElementRef },
    { type: ChangeDetectorRef },
    { type: NgZone },
    { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [VIRTUAL_SCROLL_STRATEGY,] }] },
    { type: Directionality, decorators: [{ type: Optional }] },
    { type: ScrollDispatcher },
    { type: ViewportRuler }
];
CdkVirtualScrollViewport.propDecorators = {
    orientation: [{ type: Input }],
    appendOnly: [{ type: Input }],
    scrolledIndexChange: [{ type: Output }],
    _contentWrapper: [{ type: ViewChild, args: ['contentWrapper', { static: true },] }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1zY3JvbGwtdmlld3BvcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy92aXJ0dWFsLXNjcm9sbC12aWV3cG9ydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFakQsT0FBTyxFQUNMLHVCQUF1QixFQUN2QixpQkFBaUIsRUFDakIsU0FBUyxFQUNULFVBQVUsRUFDVixNQUFNLEVBQ04sS0FBSyxFQUNMLE1BQU0sRUFHTixRQUFRLEVBQ1IsTUFBTSxFQUNOLFNBQVMsRUFDVCxpQkFBaUIsR0FDbEIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUNMLHVCQUF1QixFQUN2QixhQUFhLEVBQ2IsVUFBVSxFQUNWLE9BQU8sRUFFUCxZQUFZLEdBQ2IsTUFBTSxNQUFNLENBQUM7QUFDZCxPQUFPLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUMvRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsYUFBYSxFQUEwQixNQUFNLGNBQWMsQ0FBQztBQUNwRSxPQUFPLEVBQUMsdUJBQXVCLEVBQXdCLE1BQU0sMkJBQTJCLENBQUM7QUFDekYsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRS9DLE9BQU8sRUFBZSxxQkFBcUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRTFFLDRDQUE0QztBQUM1QyxTQUFTLFdBQVcsQ0FBQyxFQUFhLEVBQUUsRUFBYTtJQUMvQyxPQUFPLEVBQUUsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUM7QUFDbEQsQ0FBQztBQUVEOzs7O0dB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QUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUM3RSxDQUFDOzs7WUF6WUYsU0FBUyxTQUFDO2dCQUNULFFBQVEsRUFBRSw2QkFBNkI7Z0JBQ3ZDLGdpQkFBMkM7Z0JBRTNDLElBQUksRUFBRTtvQkFDSixPQUFPLEVBQUUsNkJBQTZCO29CQUN0QyxtREFBbUQsRUFBRSw4QkFBOEI7b0JBQ25GLGlEQUFpRCxFQUFFLDhCQUE4QjtpQkFDbEY7Z0JBQ0QsYUFBYSxFQUFFLGlCQUFpQixDQUFDLElBQUk7Z0JBQ3JDLGVBQWUsRUFBRSx1QkFBdUIsQ0FBQyxNQUFNO2dCQUMvQyxTQUFTLEVBQUUsQ0FBQzt3QkFDVixPQUFPLEVBQUUsYUFBYTt3QkFDdEIsV0FBVyxFQUFFLHdCQUF3QjtxQkFDdEMsQ0FBQzs7YUFDSDs7O1lBekRDLFVBQVU7WUFGVixpQkFBaUI7WUFLakIsTUFBTTs0Q0EwSk8sUUFBUSxZQUFJLE1BQU0sU0FBQyx1QkFBdUI7WUFuS2pELGNBQWMsdUJBcUtQLFFBQVE7WUEzSWYsZ0JBQWdCO1lBR2hCLGFBQWE7OzswQkEyQ2xCLEtBQUs7eUJBZ0JMLEtBQUs7a0NBY0wsTUFBTTs4QkFNTixTQUFTLFNBQUMsZ0JBQWdCLEVBQUUsRUFBQyxNQUFNLEVBQUUsSUFBSSxFQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7TGlzdFJhbmdlfSBmcm9tICdAYW5ndWxhci9jZGsvY29sbGVjdGlvbnMnO1xuaW1wb3J0IHtcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBDb21wb25lbnQsXG4gIEVsZW1lbnRSZWYsXG4gIEluamVjdCxcbiAgSW5wdXQsXG4gIE5nWm9uZSxcbiAgT25EZXN0cm95LFxuICBPbkluaXQsXG4gIE9wdGlvbmFsLFxuICBPdXRwdXQsXG4gIFZpZXdDaGlsZCxcbiAgVmlld0VuY2Fwc3VsYXRpb24sXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtcbiAgYW5pbWF0aW9uRnJhbWVTY2hlZHVsZXIsXG4gIGFzYXBTY2hlZHVsZXIsXG4gIE9ic2VydmFibGUsXG4gIFN1YmplY3QsXG4gIE9ic2VydmVyLFxuICBTdWJzY3JpcHRpb24sXG59IGZyb20gJ3J4anMnO1xuaW1wb3J0IHthdWRpdFRpbWUsIHN0YXJ0V2l0aCwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge1Njcm9sbERpc3BhdGNoZXJ9IGZyb20gJy4vc2Nyb2xsLWRpc3BhdGNoZXInO1xuaW1wb3J0IHtDZGtTY3JvbGxhYmxlLCBFeHRlbmRlZFNjcm9sbFRvT3B0aW9uc30gZnJvbSAnLi9zY3JvbGxhYmxlJztcbmltcG9ydCB7VklSVFVBTF9TQ1JPTExfU1RSQVRFR1ksIFZpcnR1YWxTY3JvbGxTdHJhdGVneX0gZnJvbSAnLi92aXJ0dWFsLXNjcm9sbC1zdHJhdGVneSc7XG5pbXBvcnQge1ZpZXdwb3J0UnVsZXJ9IGZyb20gJy4vdmlld3BvcnQtcnVsZXInO1xuaW1wb3J0IHtDZGtWaXJ0dWFsU2Nyb2xsUmVwZWF0ZXJ9IGZyb20gJy4vdmlydHVhbC1zY3JvbGwtcmVwZWF0ZXInO1xuaW1wb3J0IHtCb29sZWFuSW5wdXQsIGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcblxuLyoqIENoZWNrcyBpZiB0aGUgZ2l2ZW4gcmFuZ2VzIGFyZSBlcXVhbC4gKi9cbmZ1bmN0aW9uIHJhbmdlc0VxdWFsKHIxOiBMaXN0UmFuZ2UsIHIyOiBMaXN0UmFuZ2UpOiBib29sZWFuIHtcbiAgcmV0dXJuIHIxLnN0YXJ0ID09IHIyLnN0YXJ0ICYmIHIxLmVuZCA9PSByMi5lbmQ7XG59XG5cbi8qKlxuICogU2NoZWR1bGVyIHRvIGJlIHVzZWQgZm9yIHNjcm9sbCBldmVudHMuIE5lZWRzIHRvIGZhbGwgYmFjayB0b1xuICogc29tZXRoaW5nIHRoYXQgZG9lc24ndCByZWx5IG9uIHJlcXVlc3RBbmltYXRpb25GcmFtZSBvbiBlbnZpcm9ubWVudHNcbiAqIHRoYXQgZG9uJ3Qgc3VwcG9ydCBpdCAoZS5nLiBzZXJ2ZXItc2lkZSByZW5kZXJpbmcpLlxuICovXG5jb25zdCBTQ1JPTExfU0NIRURVTEVSID1cbiAgICB0eXBlb2YgcmVxdWVzdEFuaW1hdGlvbkZyYW1lICE9PSAndW5kZWZpbmVkJyA/IGFuaW1hdGlvbkZyYW1lU2NoZWR1bGVyIDogYXNhcFNjaGVkdWxlcjtcblxuXG4vKiogQSB2aWV3cG9ydCB0aGF0IHZpcnR1YWxpemVzIGl0cyBzY3JvbGxpbmcgd2l0aCB0aGUgaGVscCBvZiBgQ2RrVmlydHVhbEZvck9mYC4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2Nkay12aXJ0dWFsLXNjcm9sbC12aWV3cG9ydCcsXG4gIHRlbXBsYXRlVXJsOiAndmlydHVhbC1zY3JvbGwtdmlld3BvcnQuaHRtbCcsXG4gIHN0eWxlVXJsczogWyd2aXJ0dWFsLXNjcm9sbC12aWV3cG9ydC5jc3MnXSxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstdmlydHVhbC1zY3JvbGwtdmlld3BvcnQnLFxuICAgICdbY2xhc3MuY2RrLXZpcnR1YWwtc2Nyb2xsLW9yaWVudGF0aW9uLWhvcml6b250YWxdJzogJ29yaWVudGF0aW9uID09PSBcImhvcml6b250YWxcIicsXG4gICAgJ1tjbGFzcy5jZGstdmlydHVhbC1zY3JvbGwtb3JpZW50YXRpb24tdmVydGljYWxdJzogJ29yaWVudGF0aW9uICE9PSBcImhvcml6b250YWxcIicsXG4gIH0sXG4gIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxuICBwcm92aWRlcnM6IFt7XG4gICAgcHJvdmlkZTogQ2RrU2Nyb2xsYWJsZSxcbiAgICB1c2VFeGlzdGluZzogQ2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0LFxuICB9XVxufSlcbmV4cG9ydCBjbGFzcyBDZGtWaXJ0dWFsU2Nyb2xsVmlld3BvcnQgZXh0ZW5kcyBDZGtTY3JvbGxhYmxlIGltcGxlbWVudHMgT25Jbml0LCBPbkRlc3Ryb3kge1xuICAvKiogRW1pdHMgd2hlbiB0aGUgdmlld3BvcnQgaXMgZGV0YWNoZWQgZnJvbSBhIENka1ZpcnR1YWxGb3JPZi4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfZGV0YWNoZWRTdWJqZWN0ID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgcmVuZGVyZWQgcmFuZ2UgY2hhbmdlcy4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfcmVuZGVyZWRSYW5nZVN1YmplY3QgPSBuZXcgU3ViamVjdDxMaXN0UmFuZ2U+KCk7XG5cbiAgLyoqIFRoZSBkaXJlY3Rpb24gdGhlIHZpZXdwb3J0IHNjcm9sbHMuICovXG4gIEBJbnB1dCgpXG4gIGdldCBvcmllbnRhdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fb3JpZW50YXRpb247XG4gIH1cbiAgc2V0IG9yaWVudGF0aW9uKG9yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcgfCAndmVydGljYWwnKSB7XG4gICAgaWYgKHRoaXMuX29yaWVudGF0aW9uICE9PSBvcmllbnRhdGlvbikge1xuICAgICAgdGhpcy5fb3JpZW50YXRpb24gPSBvcmllbnRhdGlvbjtcbiAgICAgIHRoaXMuX2NhbGN1bGF0ZVNwYWNlclNpemUoKTtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBfb3JpZW50YXRpb246ICdob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCcgPSAndmVydGljYWwnO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHJlbmRlcmVkIGl0ZW1zIHNob3VsZCBwZXJzaXN0IGluIHRoZSBET00gYWZ0ZXIgc2Nyb2xsaW5nIG91dCBvZiB2aWV3LiBCeSBkZWZhdWx0LCBpdGVtc1xuICAgKiB3aWxsIGJlIHJlbW92ZWQuXG4gICAqL1xuICBASW5wdXQoKVxuICBnZXQgYXBwZW5kT25seSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fYXBwZW5kT25seTtcbiAgfVxuICBzZXQgYXBwZW5kT25seSh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX2FwcGVuZE9ubHkgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG4gIHByaXZhdGUgX2FwcGVuZE9ubHkgPSBmYWxzZTtcblxuICAvLyBOb3RlOiB3ZSBkb24ndCB1c2UgdGhlIHR5cGljYWwgRXZlbnRFbWl0dGVyIGhlcmUgYmVjYXVzZSB3ZSBuZWVkIHRvIHN1YnNjcmliZSB0byB0aGUgc2Nyb2xsXG4gIC8vIHN0cmF0ZWd5IGxhemlseSAoaS5lLiBvbmx5IGlmIHRoZSB1c2VyIGlzIGFjdHVhbGx5IGxpc3RlbmluZyB0byB0aGUgZXZlbnRzKS4gV2UgZG8gdGhpcyBiZWNhdXNlXG4gIC8vIGRlcGVuZGluZyBvbiBob3cgdGhlIHN0cmF0ZWd5IGNhbGN1bGF0ZXMgdGhlIHNjcm9sbGVkIGluZGV4LCBpdCBtYXkgY29tZSBhdCBhIGNvc3QgdG9cbiAgLy8gcGVyZm9ybWFuY2UuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBpbmRleCBvZiB0aGUgZmlyc3QgZWxlbWVudCB2aXNpYmxlIGluIHRoZSB2aWV3cG9ydCBjaGFuZ2VzLiAqL1xuICBAT3V0cHV0KClcbiAgcmVhZG9ubHkgc2Nyb2xsZWRJbmRleENoYW5nZTogT2JzZXJ2YWJsZTxudW1iZXI+ID0gbmV3IE9ic2VydmFibGUoXG4gICAgICAob2JzZXJ2ZXI6IE9ic2VydmVyPG51bWJlcj4pID0+IHRoaXMuX3Njcm9sbFN0cmF0ZWd5LnNjcm9sbGVkSW5kZXhDaGFuZ2Uuc3Vic2NyaWJlKFxuICAgICAgICAgIGluZGV4ID0+IFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4gdGhpcy5uZ1pvbmUucnVuKCgpID0+IG9ic2VydmVyLm5leHQoaW5kZXgpKSkpKTtcblxuICAvKiogVGhlIGVsZW1lbnQgdGhhdCB3cmFwcyB0aGUgcmVuZGVyZWQgY29udGVudC4gKi9cbiAgQFZpZXdDaGlsZCgnY29udGVudFdyYXBwZXInLCB7c3RhdGljOiB0cnVlfSkgX2NvbnRlbnRXcmFwcGVyOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PjtcblxuICAvKiogQSBzdHJlYW0gdGhhdCBlbWl0cyB3aGVuZXZlciB0aGUgcmVuZGVyZWQgcmFuZ2UgY2hhbmdlcy4gKi9cbiAgcmVhZG9ubHkgcmVuZGVyZWRSYW5nZVN0cmVhbTogT2JzZXJ2YWJsZTxMaXN0UmFuZ2U+ID0gdGhpcy5fcmVuZGVyZWRSYW5nZVN1YmplY3Q7XG5cbiAgLyoqXG4gICAqIFRoZSB0b3RhbCBzaXplIG9mIGFsbCBjb250ZW50IChpbiBwaXhlbHMpLCBpbmNsdWRpbmcgY29udGVudCB0aGF0IGlzIG5vdCBjdXJyZW50bHkgcmVuZGVyZWQuXG4gICAqL1xuICBwcml2YXRlIF90b3RhbENvbnRlbnRTaXplID0gMDtcblxuICAvKiogQSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBgc3R5bGUud2lkdGhgIHByb3BlcnR5IHZhbHVlIHRvIGJlIHVzZWQgZm9yIHRoZSBzcGFjZXIgZWxlbWVudC4gKi9cbiAgX3RvdGFsQ29udGVudFdpZHRoID0gJyc7XG5cbiAgLyoqIEEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgYHN0eWxlLmhlaWdodGAgcHJvcGVydHkgdmFsdWUgdG8gYmUgdXNlZCBmb3IgdGhlIHNwYWNlciBlbGVtZW50LiAqL1xuICBfdG90YWxDb250ZW50SGVpZ2h0ID0gJyc7XG5cbiAgLyoqXG4gICAqIFRoZSBDU1MgdHJhbnNmb3JtIGFwcGxpZWQgdG8gdGhlIHJlbmRlcmVkIHN1YnNldCBvZiBpdGVtcyBzbyB0aGF0IHRoZXkgYXBwZWFyIHdpdGhpbiB0aGUgYm91bmRzXG4gICAqIG9mIHRoZSB2aXNpYmxlIHZpZXdwb3J0LlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVuZGVyZWRDb250ZW50VHJhbnNmb3JtOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBjdXJyZW50bHkgcmVuZGVyZWQgcmFuZ2Ugb2YgaW5kaWNlcy4gKi9cbiAgcHJpdmF0ZSBfcmVuZGVyZWRSYW5nZTogTGlzdFJhbmdlID0ge3N0YXJ0OiAwLCBlbmQ6IDB9O1xuXG4gIC8qKiBUaGUgbGVuZ3RoIG9mIHRoZSBkYXRhIGJvdW5kIHRvIHRoaXMgdmlld3BvcnQgKGluIG51bWJlciBvZiBpdGVtcykuICovXG4gIHByaXZhdGUgX2RhdGFMZW5ndGggPSAwO1xuXG4gIC8qKiBUaGUgc2l6ZSBvZiB0aGUgdmlld3BvcnQgKGluIHBpeGVscykuICovXG4gIHByaXZhdGUgX3ZpZXdwb3J0U2l6ZSA9IDA7XG5cbiAgLyoqIHRoZSBjdXJyZW50bHkgYXR0YWNoZWQgQ2RrVmlydHVhbFNjcm9sbFJlcGVhdGVyLiAqL1xuICBwcml2YXRlIF9mb3JPZjogQ2RrVmlydHVhbFNjcm9sbFJlcGVhdGVyPGFueT4gfCBudWxsO1xuXG4gIC8qKiBUaGUgbGFzdCByZW5kZXJlZCBjb250ZW50IG9mZnNldCB0aGF0IHdhcyBzZXQuICovXG4gIHByaXZhdGUgX3JlbmRlcmVkQ29udGVudE9mZnNldCA9IDA7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGxhc3QgcmVuZGVyZWQgY29udGVudCBvZmZzZXQgd2FzIHRvIHRoZSBlbmQgb2YgdGhlIGNvbnRlbnQgKGFuZCB0aGVyZWZvcmUgbmVlZHMgdG9cbiAgICogYmUgcmV3cml0dGVuIGFzIGFuIG9mZnNldCB0byB0aGUgc3RhcnQgb2YgdGhlIGNvbnRlbnQpLlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVuZGVyZWRDb250ZW50T2Zmc2V0TmVlZHNSZXdyaXRlID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgdGhlcmUgaXMgYSBwZW5kaW5nIGNoYW5nZSBkZXRlY3Rpb24gY3ljbGUuICovXG4gIHByaXZhdGUgX2lzQ2hhbmdlRGV0ZWN0aW9uUGVuZGluZyA9IGZhbHNlO1xuXG4gIC8qKiBBIGxpc3Qgb2YgZnVuY3Rpb25zIHRvIHJ1biBhZnRlciB0aGUgbmV4dCBjaGFuZ2UgZGV0ZWN0aW9uIGN5Y2xlLiAqL1xuICBwcml2YXRlIF9ydW5BZnRlckNoYW5nZURldGVjdGlvbjogRnVuY3Rpb25bXSA9IFtdO1xuXG4gIC8qKiBTdWJzY3JpcHRpb24gdG8gY2hhbmdlcyBpbiB0aGUgdmlld3BvcnQgc2l6ZS4gKi9cbiAgcHJpdmF0ZSBfdmlld3BvcnRDaGFuZ2VzID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBlbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmLFxuICAgICAgICAgICAgICBuZ1pvbmU6IE5nWm9uZSxcbiAgICAgICAgICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChWSVJUVUFMX1NDUk9MTF9TVFJBVEVHWSlcbiAgICAgICAgICAgICAgICAgIHByaXZhdGUgX3Njcm9sbFN0cmF0ZWd5OiBWaXJ0dWFsU2Nyb2xsU3RyYXRlZ3ksXG4gICAgICAgICAgICAgIEBPcHRpb25hbCgpIGRpcjogRGlyZWN0aW9uYWxpdHksXG4gICAgICAgICAgICAgIHNjcm9sbERpc3BhdGNoZXI6IFNjcm9sbERpc3BhdGNoZXIsXG4gICAgICAgICAgICAgIHZpZXdwb3J0UnVsZXI6IFZpZXdwb3J0UnVsZXIpIHtcbiAgICBzdXBlcihlbGVtZW50UmVmLCBzY3JvbGxEaXNwYXRjaGVyLCBuZ1pvbmUsIGRpcik7XG5cbiAgICBpZiAoIV9zY3JvbGxTdHJhdGVneSAmJiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgdGhyb3cgRXJyb3IoJ0Vycm9yOiBjZGstdmlydHVhbC1zY3JvbGwtdmlld3BvcnQgcmVxdWlyZXMgdGhlIFwiaXRlbVNpemVcIiBwcm9wZXJ0eSB0byBiZSBzZXQuJyk7XG4gICAgfVxuXG4gICAgdGhpcy5fdmlld3BvcnRDaGFuZ2VzID0gdmlld3BvcnRSdWxlci5jaGFuZ2UoKS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgdGhpcy5jaGVja1ZpZXdwb3J0U2l6ZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgc3VwZXIubmdPbkluaXQoKTtcblxuICAgIC8vIEl0J3Mgc3RpbGwgdG9vIGVhcmx5IHRvIG1lYXN1cmUgdGhlIHZpZXdwb3J0IGF0IHRoaXMgcG9pbnQuIERlZmVycmluZyB3aXRoIGEgcHJvbWlzZSBhbGxvd3NcbiAgICAvLyB0aGUgVmlld3BvcnQgdG8gYmUgcmVuZGVyZWQgd2l0aCB0aGUgY29ycmVjdCBzaXplIGJlZm9yZSB3ZSBtZWFzdXJlLiBXZSBydW4gdGhpcyBvdXRzaWRlIHRoZVxuICAgIC8vIHpvbmUgdG8gYXZvaWQgY2F1c2luZyBtb3JlIGNoYW5nZSBkZXRlY3Rpb24gY3ljbGVzLiBXZSBoYW5kbGUgdGhlIGNoYW5nZSBkZXRlY3Rpb24gbG9vcFxuICAgIC8vIG91cnNlbHZlcyBpbnN0ZWFkLlxuICAgIHRoaXMubmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5fbWVhc3VyZVZpZXdwb3J0U2l6ZSgpO1xuICAgICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kuYXR0YWNoKHRoaXMpO1xuXG4gICAgICB0aGlzLmVsZW1lbnRTY3JvbGxlZCgpXG4gICAgICAgICAgLnBpcGUoXG4gICAgICAgICAgICAgIC8vIFN0YXJ0IG9mZiB3aXRoIGEgZmFrZSBzY3JvbGwgZXZlbnQgc28gd2UgcHJvcGVybHkgZGV0ZWN0IG91ciBpbml0aWFsIHBvc2l0aW9uLlxuICAgICAgICAgICAgICBzdGFydFdpdGgobnVsbCksXG4gICAgICAgICAgICAgIC8vIENvbGxlY3QgbXVsdGlwbGUgZXZlbnRzIGludG8gb25lIHVudGlsIHRoZSBuZXh0IGFuaW1hdGlvbiBmcmFtZS4gVGhpcyB3YXkgaWZcbiAgICAgICAgICAgICAgLy8gdGhlcmUgYXJlIG11bHRpcGxlIHNjcm9sbCBldmVudHMgaW4gdGhlIHNhbWUgZnJhbWUgd2Ugb25seSBuZWVkIHRvIHJlY2hlY2tcbiAgICAgICAgICAgICAgLy8gb3VyIGxheW91dCBvbmNlLlxuICAgICAgICAgICAgICBhdWRpdFRpbWUoMCwgU0NST0xMX1NDSEVEVUxFUikpXG4gICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9zY3JvbGxTdHJhdGVneS5vbkNvbnRlbnRTY3JvbGxlZCgpKTtcblxuICAgICAgdGhpcy5fbWFya0NoYW5nZURldGVjdGlvbk5lZWRlZCgpO1xuICAgIH0pKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuZGV0YWNoKCk7XG4gICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kuZGV0YWNoKCk7XG5cbiAgICAvLyBDb21wbGV0ZSBhbGwgc3ViamVjdHNcbiAgICB0aGlzLl9yZW5kZXJlZFJhbmdlU3ViamVjdC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX2RldGFjaGVkU3ViamVjdC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX3ZpZXdwb3J0Q2hhbmdlcy51bnN1YnNjcmliZSgpO1xuXG4gICAgc3VwZXIubmdPbkRlc3Ryb3koKTtcbiAgfVxuXG4gIC8qKiBBdHRhY2hlcyBhIGBDZGtWaXJ0dWFsU2Nyb2xsUmVwZWF0ZXJgIHRvIHRoaXMgdmlld3BvcnQuICovXG4gIGF0dGFjaChmb3JPZjogQ2RrVmlydHVhbFNjcm9sbFJlcGVhdGVyPGFueT4pIHtcbiAgICBpZiAodGhpcy5fZm9yT2YgJiYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgIHRocm93IEVycm9yKCdDZGtWaXJ0dWFsU2Nyb2xsVmlld3BvcnQgaXMgYWxyZWFkeSBhdHRhY2hlZC4nKTtcbiAgICB9XG5cbiAgICAvLyBTdWJzY3JpYmUgdG8gdGhlIGRhdGEgc3RyZWFtIG9mIHRoZSBDZGtWaXJ0dWFsRm9yT2YgdG8ga2VlcCB0cmFjayBvZiB3aGVuIHRoZSBkYXRhIGxlbmd0aFxuICAgIC8vIGNoYW5nZXMuIFJ1biBvdXRzaWRlIHRoZSB6b25lIHRvIGF2b2lkIHRyaWdnZXJpbmcgY2hhbmdlIGRldGVjdGlvbiwgc2luY2Ugd2UncmUgbWFuYWdpbmcgdGhlXG4gICAgLy8gY2hhbmdlIGRldGVjdGlvbiBsb29wIG91cnNlbHZlcy5cbiAgICB0aGlzLm5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICB0aGlzLl9mb3JPZiA9IGZvck9mO1xuICAgICAgdGhpcy5fZm9yT2YuZGF0YVN0cmVhbS5waXBlKHRha2VVbnRpbCh0aGlzLl9kZXRhY2hlZFN1YmplY3QpKS5zdWJzY3JpYmUoZGF0YSA9PiB7XG4gICAgICAgIGNvbnN0IG5ld0xlbmd0aCA9IGRhdGEubGVuZ3RoO1xuICAgICAgICBpZiAobmV3TGVuZ3RoICE9PSB0aGlzLl9kYXRhTGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy5fZGF0YUxlbmd0aCA9IG5ld0xlbmd0aDtcbiAgICAgICAgICB0aGlzLl9zY3JvbGxTdHJhdGVneS5vbkRhdGFMZW5ndGhDaGFuZ2VkKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fZG9DaGFuZ2VEZXRlY3Rpb24oKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIERldGFjaGVzIHRoZSBjdXJyZW50IGBDZGtWaXJ0dWFsRm9yT2ZgLiAqL1xuICBkZXRhY2goKSB7XG4gICAgdGhpcy5fZm9yT2YgPSBudWxsO1xuICAgIHRoaXMuX2RldGFjaGVkU3ViamVjdC5uZXh0KCk7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgbGVuZ3RoIG9mIHRoZSBkYXRhIGJvdW5kIHRvIHRoaXMgdmlld3BvcnQgKGluIG51bWJlciBvZiBpdGVtcykuICovXG4gIGdldERhdGFMZW5ndGgoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fZGF0YUxlbmd0aDtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBzaXplIG9mIHRoZSB2aWV3cG9ydCAoaW4gcGl4ZWxzKS4gKi9cbiAgZ2V0Vmlld3BvcnRTaXplKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZpZXdwb3J0U2l6ZTtcbiAgfVxuXG4gIC8vIFRPRE8obW1hbGVyYmEpOiBUaGlzIGlzIHRlY2huaWNhbGx5IG91dCBvZiBzeW5jIHdpdGggd2hhdCdzIHJlYWxseSByZW5kZXJlZCB1bnRpbCBhIHJlbmRlclxuICAvLyBjeWNsZSBoYXBwZW5zLiBJJ20gYmVpbmcgY2FyZWZ1bCB0byBvbmx5IGNhbGwgaXQgYWZ0ZXIgdGhlIHJlbmRlciBjeWNsZSBpcyBjb21wbGV0ZSBhbmQgYmVmb3JlXG4gIC8vIHNldHRpbmcgaXQgdG8gc29tZXRoaW5nIGVsc2UsIGJ1dCBpdHMgZXJyb3IgcHJvbmUgYW5kIHNob3VsZCBwcm9iYWJseSBiZSBzcGxpdCBpbnRvXG4gIC8vIGBwZW5kaW5nUmFuZ2VgIGFuZCBgcmVuZGVyZWRSYW5nZWAsIHRoZSBsYXR0ZXIgcmVmbGVjdGluZyB3aGF0cyBhY3R1YWxseSBpbiB0aGUgRE9NLlxuXG4gIC8qKiBHZXQgdGhlIGN1cnJlbnQgcmVuZGVyZWQgcmFuZ2Ugb2YgaXRlbXMuICovXG4gIGdldFJlbmRlcmVkUmFuZ2UoKTogTGlzdFJhbmdlIHtcbiAgICByZXR1cm4gdGhpcy5fcmVuZGVyZWRSYW5nZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB0b3RhbCBzaXplIG9mIGFsbCBjb250ZW50IChpbiBwaXhlbHMpLCBpbmNsdWRpbmcgY29udGVudCB0aGF0IGlzIG5vdCBjdXJyZW50bHlcbiAgICogcmVuZGVyZWQuXG4gICAqL1xuICBzZXRUb3RhbENvbnRlbnRTaXplKHNpemU6IG51bWJlcikge1xuICAgIGlmICh0aGlzLl90b3RhbENvbnRlbnRTaXplICE9PSBzaXplKSB7XG4gICAgICB0aGlzLl90b3RhbENvbnRlbnRTaXplID0gc2l6ZTtcbiAgICAgIHRoaXMuX2NhbGN1bGF0ZVNwYWNlclNpemUoKTtcbiAgICAgIHRoaXMuX21hcmtDaGFuZ2VEZXRlY3Rpb25OZWVkZWQoKTtcbiAgICB9XG4gIH1cblxuICAvKiogU2V0cyB0aGUgY3VycmVudGx5IHJlbmRlcmVkIHJhbmdlIG9mIGluZGljZXMuICovXG4gIHNldFJlbmRlcmVkUmFuZ2UocmFuZ2U6IExpc3RSYW5nZSkge1xuICAgIGlmICghcmFuZ2VzRXF1YWwodGhpcy5fcmVuZGVyZWRSYW5nZSwgcmFuZ2UpKSB7XG4gICAgICBpZiAodGhpcy5hcHBlbmRPbmx5KSB7XG4gICAgICAgIHJhbmdlID0ge3N0YXJ0OiAwLCBlbmQ6IE1hdGgubWF4KHRoaXMuX3JlbmRlcmVkUmFuZ2UuZW5kLCByYW5nZS5lbmQpfTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3JlbmRlcmVkUmFuZ2VTdWJqZWN0Lm5leHQodGhpcy5fcmVuZGVyZWRSYW5nZSA9IHJhbmdlKTtcbiAgICAgIHRoaXMuX21hcmtDaGFuZ2VEZXRlY3Rpb25OZWVkZWQoKCkgPT4gdGhpcy5fc2Nyb2xsU3RyYXRlZ3kub25Db250ZW50UmVuZGVyZWQoKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG9mZnNldCBmcm9tIHRoZSBzdGFydCBvZiB0aGUgdmlld3BvcnQgdG8gdGhlIHN0YXJ0IG9mIHRoZSByZW5kZXJlZCBkYXRhIChpbiBwaXhlbHMpLlxuICAgKi9cbiAgZ2V0T2Zmc2V0VG9SZW5kZXJlZENvbnRlbnRTdGFydCgpOiBudW1iZXIgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0TmVlZHNSZXdyaXRlID8gbnVsbCA6IHRoaXMuX3JlbmRlcmVkQ29udGVudE9mZnNldDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBvZmZzZXQgZnJvbSB0aGUgc3RhcnQgb2YgdGhlIHZpZXdwb3J0IHRvIGVpdGhlciB0aGUgc3RhcnQgb3IgZW5kIG9mIHRoZSByZW5kZXJlZCBkYXRhXG4gICAqIChpbiBwaXhlbHMpLlxuICAgKi9cbiAgc2V0UmVuZGVyZWRDb250ZW50T2Zmc2V0KG9mZnNldDogbnVtYmVyLCB0bzogJ3RvLXN0YXJ0JyB8ICd0by1lbmQnID0gJ3RvLXN0YXJ0Jykge1xuICAgIC8vIEZvciBhIGhvcml6b250YWwgdmlld3BvcnQgaW4gYSByaWdodC10by1sZWZ0IGxhbmd1YWdlIHdlIG5lZWQgdG8gdHJhbnNsYXRlIGFsb25nIHRoZSB4LWF4aXNcbiAgICAvLyBpbiB0aGUgbmVnYXRpdmUgZGlyZWN0aW9uLlxuICAgIGNvbnN0IGlzUnRsID0gdGhpcy5kaXIgJiYgdGhpcy5kaXIudmFsdWUgPT0gJ3J0bCc7XG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gdGhpcy5vcmllbnRhdGlvbiA9PSAnaG9yaXpvbnRhbCc7XG4gICAgY29uc3QgYXhpcyA9IGlzSG9yaXpvbnRhbCA/ICdYJyA6ICdZJztcbiAgICBjb25zdCBheGlzRGlyZWN0aW9uID0gaXNIb3Jpem9udGFsICYmIGlzUnRsID8gLTEgOiAxO1xuICAgIGxldCB0cmFuc2Zvcm0gPSBgdHJhbnNsYXRlJHtheGlzfSgke051bWJlcihheGlzRGlyZWN0aW9uICogb2Zmc2V0KX1weClgO1xuICAgIHRoaXMuX3JlbmRlcmVkQ29udGVudE9mZnNldCA9IG9mZnNldDtcbiAgICBpZiAodG8gPT09ICd0by1lbmQnKSB7XG4gICAgICB0cmFuc2Zvcm0gKz0gYCB0cmFuc2xhdGUke2F4aXN9KC0xMDAlKWA7XG4gICAgICAvLyBUaGUgdmlld3BvcnQgc2hvdWxkIHJld3JpdGUgdGhpcyBhcyBhIGB0by1zdGFydGAgb2Zmc2V0IG9uIHRoZSBuZXh0IHJlbmRlciBjeWNsZS4gT3RoZXJ3aXNlXG4gICAgICAvLyBlbGVtZW50cyB3aWxsIGFwcGVhciB0byBleHBhbmQgaW4gdGhlIHdyb25nIGRpcmVjdGlvbiAoZS5nLiBgbWF0LWV4cGFuc2lvbi1wYW5lbGAgd291bGRcbiAgICAgIC8vIGV4cGFuZCB1cHdhcmQpLlxuICAgICAgdGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0TmVlZHNSZXdyaXRlID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3JlbmRlcmVkQ29udGVudFRyYW5zZm9ybSAhPSB0cmFuc2Zvcm0pIHtcbiAgICAgIC8vIFdlIGtub3cgdGhpcyB2YWx1ZSBpcyBzYWZlIGJlY2F1c2Ugd2UgcGFyc2UgYG9mZnNldGAgd2l0aCBgTnVtYmVyKClgIGJlZm9yZSBwYXNzaW5nIGl0XG4gICAgICAvLyBpbnRvIHRoZSBzdHJpbmcuXG4gICAgICB0aGlzLl9yZW5kZXJlZENvbnRlbnRUcmFuc2Zvcm0gPSB0cmFuc2Zvcm07XG4gICAgICB0aGlzLl9tYXJrQ2hhbmdlRGV0ZWN0aW9uTmVlZGVkKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuX3JlbmRlcmVkQ29udGVudE9mZnNldE5lZWRzUmV3cml0ZSkge1xuICAgICAgICAgIHRoaXMuX3JlbmRlcmVkQ29udGVudE9mZnNldCAtPSB0aGlzLm1lYXN1cmVSZW5kZXJlZENvbnRlbnRTaXplKCk7XG4gICAgICAgICAgdGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0TmVlZHNSZXdyaXRlID0gZmFsc2U7XG4gICAgICAgICAgdGhpcy5zZXRSZW5kZXJlZENvbnRlbnRPZmZzZXQodGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl9zY3JvbGxTdHJhdGVneS5vblJlbmRlcmVkT2Zmc2V0Q2hhbmdlZCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2Nyb2xscyB0byB0aGUgZ2l2ZW4gb2Zmc2V0IGZyb20gdGhlIHN0YXJ0IG9mIHRoZSB2aWV3cG9ydC4gUGxlYXNlIG5vdGUgdGhhdCB0aGlzIGlzIG5vdCBhbHdheXNcbiAgICogdGhlIHNhbWUgYXMgc2V0dGluZyBgc2Nyb2xsVG9wYCBvciBgc2Nyb2xsTGVmdGAuIEluIGEgaG9yaXpvbnRhbCB2aWV3cG9ydCB3aXRoIHJpZ2h0LXRvLWxlZnRcbiAgICogZGlyZWN0aW9uLCB0aGlzIHdvdWxkIGJlIHRoZSBlcXVpdmFsZW50IG9mIHNldHRpbmcgYSBmaWN0aW9uYWwgYHNjcm9sbFJpZ2h0YCBwcm9wZXJ0eS5cbiAgICogQHBhcmFtIG9mZnNldCBUaGUgb2Zmc2V0IHRvIHNjcm9sbCB0by5cbiAgICogQHBhcmFtIGJlaGF2aW9yIFRoZSBTY3JvbGxCZWhhdmlvciB0byB1c2Ugd2hlbiBzY3JvbGxpbmcuIERlZmF1bHQgaXMgYmVoYXZpb3IgaXMgYGF1dG9gLlxuICAgKi9cbiAgc2Nyb2xsVG9PZmZzZXQob2Zmc2V0OiBudW1iZXIsIGJlaGF2aW9yOiBTY3JvbGxCZWhhdmlvciA9ICdhdXRvJykge1xuICAgIGNvbnN0IG9wdGlvbnM6IEV4dGVuZGVkU2Nyb2xsVG9PcHRpb25zID0ge2JlaGF2aW9yfTtcbiAgICBpZiAodGhpcy5vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnKSB7XG4gICAgICBvcHRpb25zLnN0YXJ0ID0gb2Zmc2V0O1xuICAgIH0gZWxzZSB7XG4gICAgICBvcHRpb25zLnRvcCA9IG9mZnNldDtcbiAgICB9XG4gICAgdGhpcy5zY3JvbGxUbyhvcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTY3JvbGxzIHRvIHRoZSBvZmZzZXQgZm9yIHRoZSBnaXZlbiBpbmRleC5cbiAgICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCB0byBzY3JvbGwgdG8uXG4gICAqIEBwYXJhbSBiZWhhdmlvciBUaGUgU2Nyb2xsQmVoYXZpb3IgdG8gdXNlIHdoZW4gc2Nyb2xsaW5nLiBEZWZhdWx0IGlzIGJlaGF2aW9yIGlzIGBhdXRvYC5cbiAgICovXG4gIHNjcm9sbFRvSW5kZXgoaW5kZXg6IG51bWJlciwgIGJlaGF2aW9yOiBTY3JvbGxCZWhhdmlvciA9ICdhdXRvJykge1xuICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5LnNjcm9sbFRvSW5kZXgoaW5kZXgsIGJlaGF2aW9yKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IHNjcm9sbCBvZmZzZXQgZnJvbSB0aGUgc3RhcnQgb2YgdGhlIHZpZXdwb3J0IChpbiBwaXhlbHMpLlxuICAgKiBAcGFyYW0gZnJvbSBUaGUgZWRnZSB0byBtZWFzdXJlIHRoZSBvZmZzZXQgZnJvbS4gRGVmYXVsdHMgdG8gJ3RvcCcgaW4gdmVydGljYWwgbW9kZSBhbmQgJ3N0YXJ0J1xuICAgKiAgICAgaW4gaG9yaXpvbnRhbCBtb2RlLlxuICAgKi9cbiAgbWVhc3VyZVNjcm9sbE9mZnNldChmcm9tPzogJ3RvcCcgfCAnbGVmdCcgfCAncmlnaHQnIHwgJ2JvdHRvbScgfCAnc3RhcnQnIHwgJ2VuZCcpOiBudW1iZXIge1xuICAgIHJldHVybiBmcm9tID9cbiAgICAgIHN1cGVyLm1lYXN1cmVTY3JvbGxPZmZzZXQoZnJvbSkgOlxuICAgICAgc3VwZXIubWVhc3VyZVNjcm9sbE9mZnNldCh0aGlzLm9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcgPyAnc3RhcnQnIDogJ3RvcCcpO1xuICB9XG5cbiAgLyoqIE1lYXN1cmUgdGhlIGNvbWJpbmVkIHNpemUgb2YgYWxsIG9mIHRoZSByZW5kZXJlZCBpdGVtcy4gKi9cbiAgbWVhc3VyZVJlbmRlcmVkQ29udGVudFNpemUoKTogbnVtYmVyIHtcbiAgICBjb25zdCBjb250ZW50RWwgPSB0aGlzLl9jb250ZW50V3JhcHBlci5uYXRpdmVFbGVtZW50O1xuICAgIHJldHVybiB0aGlzLm9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcgPyBjb250ZW50RWwub2Zmc2V0V2lkdGggOiBjb250ZW50RWwub2Zmc2V0SGVpZ2h0O1xuICB9XG5cbiAgLyoqXG4gICAqIE1lYXN1cmUgdGhlIHRvdGFsIGNvbWJpbmVkIHNpemUgb2YgdGhlIGdpdmVuIHJhbmdlLiBUaHJvd3MgaWYgdGhlIHJhbmdlIGluY2x1ZGVzIGl0ZW1zIHRoYXQgYXJlXG4gICAqIG5vdCByZW5kZXJlZC5cbiAgICovXG4gIG1lYXN1cmVSYW5nZVNpemUocmFuZ2U6IExpc3RSYW5nZSk6IG51bWJlciB7XG4gICAgaWYgKCF0aGlzLl9mb3JPZikge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9mb3JPZi5tZWFzdXJlUmFuZ2VTaXplKHJhbmdlLCB0aGlzLm9yaWVudGF0aW9uKTtcbiAgfVxuXG4gIC8qKiBVcGRhdGUgdGhlIHZpZXdwb3J0IGRpbWVuc2lvbnMgYW5kIHJlLXJlbmRlci4gKi9cbiAgY2hlY2tWaWV3cG9ydFNpemUoKSB7XG4gICAgLy8gVE9ETzogQ2xlYW51cCBsYXRlciB3aGVuIGFkZCBsb2dpYyBmb3IgaGFuZGxpbmcgY29udGVudCByZXNpemVcbiAgICB0aGlzLl9tZWFzdXJlVmlld3BvcnRTaXplKCk7XG4gICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kub25EYXRhTGVuZ3RoQ2hhbmdlZCgpO1xuICB9XG5cbiAgLyoqIE1lYXN1cmUgdGhlIHZpZXdwb3J0IHNpemUuICovXG4gIHByaXZhdGUgX21lYXN1cmVWaWV3cG9ydFNpemUoKSB7XG4gICAgY29uc3Qgdmlld3BvcnRFbCA9IHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50O1xuICAgIHRoaXMuX3ZpZXdwb3J0U2l6ZSA9IHRoaXMub3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJyA/XG4gICAgICAgIHZpZXdwb3J0RWwuY2xpZW50V2lkdGggOiB2aWV3cG9ydEVsLmNsaWVudEhlaWdodDtcbiAgfVxuXG4gIC8qKiBRdWV1ZSB1cCBjaGFuZ2UgZGV0ZWN0aW9uIHRvIHJ1bi4gKi9cbiAgcHJpdmF0ZSBfbWFya0NoYW5nZURldGVjdGlvbk5lZWRlZChydW5BZnRlcj86IEZ1bmN0aW9uKSB7XG4gICAgaWYgKHJ1bkFmdGVyKSB7XG4gICAgICB0aGlzLl9ydW5BZnRlckNoYW5nZURldGVjdGlvbi5wdXNoKHJ1bkFmdGVyKTtcbiAgICB9XG5cbiAgICAvLyBVc2UgYSBQcm9taXNlIHRvIGJhdGNoIHRvZ2V0aGVyIGNhbGxzIHRvIGBfZG9DaGFuZ2VEZXRlY3Rpb25gLiBUaGlzIHdheSBpZiB3ZSBzZXQgYSBidW5jaCBvZlxuICAgIC8vIHByb3BlcnRpZXMgc2VxdWVudGlhbGx5IHdlIG9ubHkgaGF2ZSB0byBydW4gYF9kb0NoYW5nZURldGVjdGlvbmAgb25jZSBhdCB0aGUgZW5kLlxuICAgIGlmICghdGhpcy5faXNDaGFuZ2VEZXRlY3Rpb25QZW5kaW5nKSB7XG4gICAgICB0aGlzLl9pc0NoYW5nZURldGVjdGlvblBlbmRpbmcgPSB0cnVlO1xuICAgICAgdGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMuX2RvQ2hhbmdlRGV0ZWN0aW9uKCk7XG4gICAgICB9KSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFJ1biBjaGFuZ2UgZGV0ZWN0aW9uLiAqL1xuICBwcml2YXRlIF9kb0NoYW5nZURldGVjdGlvbigpIHtcbiAgICB0aGlzLl9pc0NoYW5nZURldGVjdGlvblBlbmRpbmcgPSBmYWxzZTtcblxuICAgIC8vIEFwcGx5IHRoZSBjb250ZW50IHRyYW5zZm9ybS4gVGhlIHRyYW5zZm9ybSBjYW4ndCBiZSBzZXQgdmlhIGFuIEFuZ3VsYXIgYmluZGluZyBiZWNhdXNlXG4gICAgLy8gYnlwYXNzU2VjdXJpdHlUcnVzdFN0eWxlIGlzIGJhbm5lZCBpbiBHb29nbGUuIEhvd2V2ZXIgdGhlIHZhbHVlIGlzIHNhZmUsIGl0J3MgY29tcG9zZWQgb2ZcbiAgICAvLyBzdHJpbmcgbGl0ZXJhbHMsIGEgdmFyaWFibGUgdGhhdCBjYW4gb25seSBiZSAnWCcgb3IgJ1knLCBhbmQgdXNlciBpbnB1dCB0aGF0IGlzIHJ1biB0aHJvdWdoXG4gICAgLy8gdGhlIGBOdW1iZXJgIGZ1bmN0aW9uIGZpcnN0IHRvIGNvZXJjZSBpdCB0byBhIG51bWVyaWMgdmFsdWUuXG4gICAgdGhpcy5fY29udGVudFdyYXBwZXIubmF0aXZlRWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSB0aGlzLl9yZW5kZXJlZENvbnRlbnRUcmFuc2Zvcm07XG4gICAgLy8gQXBwbHkgY2hhbmdlcyB0byBBbmd1bGFyIGJpbmRpbmdzLiBOb3RlOiBXZSBtdXN0IGNhbGwgYG1hcmtGb3JDaGVja2AgdG8gcnVuIGNoYW5nZSBkZXRlY3Rpb25cbiAgICAvLyBmcm9tIHRoZSByb290LCBzaW5jZSB0aGUgcmVwZWF0ZWQgaXRlbXMgYXJlIGNvbnRlbnQgcHJvamVjdGVkIGluLiBDYWxsaW5nIGBkZXRlY3RDaGFuZ2VzYFxuICAgIC8vIGluc3RlYWQgZG9lcyBub3QgcHJvcGVybHkgY2hlY2sgdGhlIHByb2plY3RlZCBjb250ZW50LlxuICAgIHRoaXMubmdab25lLnJ1bigoKSA9PiB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKSk7XG5cbiAgICBjb25zdCBydW5BZnRlckNoYW5nZURldGVjdGlvbiA9IHRoaXMuX3J1bkFmdGVyQ2hhbmdlRGV0ZWN0aW9uO1xuICAgIHRoaXMuX3J1bkFmdGVyQ2hhbmdlRGV0ZWN0aW9uID0gW107XG4gICAgZm9yIChjb25zdCBmbiBvZiBydW5BZnRlckNoYW5nZURldGVjdGlvbikge1xuICAgICAgZm4oKTtcbiAgICB9XG4gIH1cblxuICAvKiogQ2FsY3VsYXRlcyB0aGUgYHN0eWxlLndpZHRoYCBhbmQgYHN0eWxlLmhlaWdodGAgZm9yIHRoZSBzcGFjZXIgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfY2FsY3VsYXRlU3BhY2VyU2l6ZSgpIHtcbiAgICB0aGlzLl90b3RhbENvbnRlbnRIZWlnaHQgPVxuICAgICAgICB0aGlzLm9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcgPyAnJyA6IGAke3RoaXMuX3RvdGFsQ29udGVudFNpemV9cHhgO1xuICAgIHRoaXMuX3RvdGFsQ29udGVudFdpZHRoID1cbiAgICAgICAgdGhpcy5vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnID8gYCR7dGhpcy5fdG90YWxDb250ZW50U2l6ZX1weGAgOiAnJztcbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9hcHBlbmRPbmx5OiBCb29sZWFuSW5wdXQ7XG59XG4iXX0=