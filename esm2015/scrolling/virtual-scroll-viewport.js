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
import { Directionality } from '@angular/cdk/bidi';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, Input, NgZone, Optional, Output, ViewChild, ViewEncapsulation, } from '@angular/core';
import { animationFrameScheduler, asapScheduler, Observable, Subject } from 'rxjs';
import { auditTime, startWith, takeUntil } from 'rxjs/operators';
import { ScrollDispatcher } from './scroll-dispatcher';
import { CdkScrollable } from './scrollable';
import { VIRTUAL_SCROLL_STRATEGY } from './virtual-scroll-strategy';
/**
 * Checks if the given ranges are equal.
 * @param {?} r1
 * @param {?} r2
 * @return {?}
 */
function rangesEqual(r1, r2) {
    return r1.start == r2.start && r1.end == r2.end;
}
/**
 * Scheduler to be used for scroll events. Needs to fall back to
 * something that doesn't rely on requestAnimationFrame on environments
 * that don't support it (e.g. server-side rendering).
 * @type {?}
 */
const SCROLL_SCHEDULER = typeof requestAnimationFrame !== 'undefined' ? animationFrameScheduler : asapScheduler;
/**
 * A viewport that virtualizes its scrolling with the help of `CdkVirtualForOf`.
 */
export class CdkVirtualScrollViewport extends CdkScrollable {
    /**
     * @param {?} elementRef
     * @param {?} _changeDetectorRef
     * @param {?} ngZone
     * @param {?} _scrollStrategy
     * @param {?} dir
     * @param {?} scrollDispatcher
     */
    constructor(elementRef, _changeDetectorRef, ngZone, _scrollStrategy, dir, scrollDispatcher) {
        super(elementRef, scrollDispatcher, ngZone, dir);
        this.elementRef = elementRef;
        this._changeDetectorRef = _changeDetectorRef;
        this._scrollStrategy = _scrollStrategy;
        /**
         * Emits when the viewport is detached from a CdkVirtualForOf.
         */
        this._detachedSubject = new Subject();
        /**
         * Emits when the rendered range changes.
         */
        this._renderedRangeSubject = new Subject();
        this._orientation = 'vertical';
        // Note: we don't use the typical EventEmitter here because we need to subscribe to the scroll
        // strategy lazily (i.e. only if the user is actually listening to the events). We do this because
        // depending on how the strategy calculates the scrolled index, it may come at a cost to
        // performance.
        /**
         * Emits when the index of the first element visible in the viewport changes.
         */
        this.scrolledIndexChange = new Observable((/**
         * @param {?} observer
         * @return {?}
         */
        (observer) => this._scrollStrategy.scrolledIndexChange.subscribe((/**
         * @param {?} index
         * @return {?}
         */
        index => Promise.resolve().then((/**
         * @return {?}
         */
        () => this.ngZone.run((/**
         * @return {?}
         */
        () => observer.next(index)))))))));
        /**
         * A stream that emits whenever the rendered range changes.
         */
        this.renderedRangeStream = this._renderedRangeSubject.asObservable();
        /**
         * The total size of all content (in pixels), including content that is not currently rendered.
         */
        this._totalContentSize = 0;
        /**
         * A string representing the `style.width` property value to be used for the spacer element.
         */
        this._totalContentWidth = '';
        /**
         * A string representing the `style.height` property value to be used for the spacer element.
         */
        this._totalContentHeight = '';
        /**
         * The currently rendered range of indices.
         */
        this._renderedRange = { start: 0, end: 0 };
        /**
         * The length of the data bound to this viewport (in number of items).
         */
        this._dataLength = 0;
        /**
         * The size of the viewport (in pixels).
         */
        this._viewportSize = 0;
        /**
         * The last rendered content offset that was set.
         */
        this._renderedContentOffset = 0;
        /**
         * Whether the last rendered content offset was to the end of the content (and therefore needs to
         * be rewritten as an offset to the start of the content).
         */
        this._renderedContentOffsetNeedsRewrite = false;
        /**
         * Whether there is a pending change detection cycle.
         */
        this._isChangeDetectionPending = false;
        /**
         * A list of functions to run after the next change detection cycle.
         */
        this._runAfterChangeDetection = [];
        if (!_scrollStrategy) {
            throw Error('Error: cdk-virtual-scroll-viewport requires the "itemSize" property to be set.');
        }
    }
    /**
     * The direction the viewport scrolls.
     * @return {?}
     */
    get orientation() {
        return this._orientation;
    }
    /**
     * @param {?} orientation
     * @return {?}
     */
    set orientation(orientation) {
        if (this._orientation !== orientation) {
            this._orientation = orientation;
            this._calculateSpacerSize();
        }
    }
    /**
     * @return {?}
     */
    ngOnInit() {
        super.ngOnInit();
        // It's still too early to measure the viewport at this point. Deferring with a promise allows
        // the Viewport to be rendered with the correct size before we measure. We run this outside the
        // zone to avoid causing more change detection cycles. We handle the change detection loop
        // ourselves instead.
        this.ngZone.runOutsideAngular((/**
         * @return {?}
         */
        () => Promise.resolve().then((/**
         * @return {?}
         */
        () => {
            this._measureViewportSize();
            this._scrollStrategy.attach(this);
            this.elementScrolled()
                .pipe(
            // Start off with a fake scroll event so we properly detect our initial position.
            startWith((/** @type {?} */ (null))), 
            // Collect multiple events into one until the next animation frame. This way if
            // there are multiple scroll events in the same frame we only need to recheck
            // our layout once.
            auditTime(0, SCROLL_SCHEDULER))
                .subscribe((/**
             * @return {?}
             */
            () => this._scrollStrategy.onContentScrolled()));
            this._markChangeDetectionNeeded();
        }))));
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        this.detach();
        this._scrollStrategy.detach();
        // Complete all subjects
        this._renderedRangeSubject.complete();
        this._detachedSubject.complete();
        super.ngOnDestroy();
    }
    /**
     * Attaches a `CdkVirtualForOf` to this viewport.
     * @param {?} forOf
     * @return {?}
     */
    attach(forOf) {
        if (this._forOf) {
            throw Error('CdkVirtualScrollViewport is already attached.');
        }
        // Subscribe to the data stream of the CdkVirtualForOf to keep track of when the data length
        // changes. Run outside the zone to avoid triggering change detection, since we're managing the
        // change detection loop ourselves.
        this.ngZone.runOutsideAngular((/**
         * @return {?}
         */
        () => {
            this._forOf = forOf;
            this._forOf.dataStream.pipe(takeUntil(this._detachedSubject)).subscribe((/**
             * @param {?} data
             * @return {?}
             */
            data => {
                /** @type {?} */
                const newLength = data.length;
                if (newLength !== this._dataLength) {
                    this._dataLength = newLength;
                    this._scrollStrategy.onDataLengthChanged();
                }
                this._doChangeDetection();
            }));
        }));
    }
    /**
     * Detaches the current `CdkVirtualForOf`.
     * @return {?}
     */
    detach() {
        this._forOf = null;
        this._detachedSubject.next();
    }
    /**
     * Gets the length of the data bound to this viewport (in number of items).
     * @return {?}
     */
    getDataLength() {
        return this._dataLength;
    }
    /**
     * Gets the size of the viewport (in pixels).
     * @return {?}
     */
    getViewportSize() {
        return this._viewportSize;
    }
    // TODO(mmalerba): This is technically out of sync with what's really rendered until a render
    // cycle happens. I'm being careful to only call it after the render cycle is complete and before
    // setting it to something else, but its error prone and should probably be split into
    // `pendingRange` and `renderedRange`, the latter reflecting whats actually in the DOM.
    /**
     * Get the current rendered range of items.
     * @return {?}
     */
    getRenderedRange() {
        return this._renderedRange;
    }
    /**
     * Sets the total size of all content (in pixels), including content that is not currently
     * rendered.
     * @param {?} size
     * @return {?}
     */
    setTotalContentSize(size) {
        if (this._totalContentSize !== size) {
            this._totalContentSize = size;
            this._calculateSpacerSize();
            this._markChangeDetectionNeeded();
        }
    }
    /**
     * Sets the currently rendered range of indices.
     * @param {?} range
     * @return {?}
     */
    setRenderedRange(range) {
        if (!rangesEqual(this._renderedRange, range)) {
            this._renderedRangeSubject.next(this._renderedRange = range);
            this._markChangeDetectionNeeded((/**
             * @return {?}
             */
            () => this._scrollStrategy.onContentRendered()));
        }
    }
    /**
     * Gets the offset from the start of the viewport to the start of the rendered data (in pixels).
     * @return {?}
     */
    getOffsetToRenderedContentStart() {
        return this._renderedContentOffsetNeedsRewrite ? null : this._renderedContentOffset;
    }
    /**
     * Sets the offset from the start of the viewport to either the start or end of the rendered data
     * (in pixels).
     * @param {?} offset
     * @param {?=} to
     * @return {?}
     */
    setRenderedContentOffset(offset, to = 'to-start') {
        // For a horizontal viewport in a right-to-left language we need to translate along the x-axis
        // in the negative direction.
        /** @type {?} */
        const isRtl = this.dir && this.dir.value == 'rtl';
        /** @type {?} */
        const isHorizontal = this.orientation == 'horizontal';
        /** @type {?} */
        const axis = isHorizontal ? 'X' : 'Y';
        /** @type {?} */
        const axisDirection = isHorizontal && isRtl ? -1 : 1;
        /** @type {?} */
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
            this._markChangeDetectionNeeded((/**
             * @return {?}
             */
            () => {
                if (this._renderedContentOffsetNeedsRewrite) {
                    this._renderedContentOffset -= this.measureRenderedContentSize();
                    this._renderedContentOffsetNeedsRewrite = false;
                    this.setRenderedContentOffset(this._renderedContentOffset);
                }
                else {
                    this._scrollStrategy.onRenderedOffsetChanged();
                }
            }));
        }
    }
    /**
     * Scrolls to the given offset from the start of the viewport. Please note that this is not always
     * the same as setting `scrollTop` or `scrollLeft`. In a horizontal viewport with right-to-left
     * direction, this would be the equivalent of setting a fictional `scrollRight` property.
     * @param {?} offset The offset to scroll to.
     * @param {?=} behavior The ScrollBehavior to use when scrolling. Default is behavior is `auto`.
     * @return {?}
     */
    scrollToOffset(offset, behavior = 'auto') {
        /** @type {?} */
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
     * @param {?} index The index of the element to scroll to.
     * @param {?=} behavior The ScrollBehavior to use when scrolling. Default is behavior is `auto`.
     * @return {?}
     */
    scrollToIndex(index, behavior = 'auto') {
        this._scrollStrategy.scrollToIndex(index, behavior);
    }
    /**
     * Gets the current scroll offset from the start of the viewport (in pixels).
     * @param {?=} from The edge to measure the offset from. Defaults to 'top' in vertical mode and 'start'
     *     in horizontal mode.
     * @return {?}
     */
    measureScrollOffset(from) {
        return super.measureScrollOffset(from ? from : this.orientation === 'horizontal' ? 'start' : 'top');
    }
    /**
     * Measure the combined size of all of the rendered items.
     * @return {?}
     */
    measureRenderedContentSize() {
        /** @type {?} */
        const contentEl = this._contentWrapper.nativeElement;
        return this.orientation === 'horizontal' ? contentEl.offsetWidth : contentEl.offsetHeight;
    }
    /**
     * Measure the total combined size of the given range. Throws if the range includes items that are
     * not rendered.
     * @param {?} range
     * @return {?}
     */
    measureRangeSize(range) {
        if (!this._forOf) {
            return 0;
        }
        return this._forOf.measureRangeSize(range, this.orientation);
    }
    /**
     * Update the viewport dimensions and re-render.
     * @return {?}
     */
    checkViewportSize() {
        // TODO: Cleanup later when add logic for handling content resize
        this._measureViewportSize();
        this._scrollStrategy.onDataLengthChanged();
    }
    /**
     * Measure the viewport size.
     * @private
     * @return {?}
     */
    _measureViewportSize() {
        /** @type {?} */
        const viewportEl = this.elementRef.nativeElement;
        this._viewportSize = this.orientation === 'horizontal' ?
            viewportEl.clientWidth : viewportEl.clientHeight;
    }
    /**
     * Queue up change detection to run.
     * @private
     * @param {?=} runAfter
     * @return {?}
     */
    _markChangeDetectionNeeded(runAfter) {
        if (runAfter) {
            this._runAfterChangeDetection.push(runAfter);
        }
        // Use a Promise to batch together calls to `_doChangeDetection`. This way if we set a bunch of
        // properties sequentially we only have to run `_doChangeDetection` once at the end.
        if (!this._isChangeDetectionPending) {
            this._isChangeDetectionPending = true;
            this.ngZone.runOutsideAngular((/**
             * @return {?}
             */
            () => Promise.resolve().then((/**
             * @return {?}
             */
            () => {
                this._doChangeDetection();
            }))));
        }
    }
    /**
     * Run change detection.
     * @private
     * @return {?}
     */
    _doChangeDetection() {
        this._isChangeDetectionPending = false;
        // Apply changes to Angular bindings. Note: We must call `markForCheck` to run change detection
        // from the root, since the repeated items are content projected in. Calling `detectChanges`
        // instead does not properly check the projected content.
        this.ngZone.run((/**
         * @return {?}
         */
        () => this._changeDetectorRef.markForCheck()));
        // Apply the content transform. The transform can't be set via an Angular binding because
        // bypassSecurityTrustStyle is banned in Google. However the value is safe, it's composed of
        // string literals, a variable that can only be 'X' or 'Y', and user input that is run through
        // the `Number` function first to coerce it to a numeric value.
        this._contentWrapper.nativeElement.style.transform = this._renderedContentTransform;
        /** @type {?} */
        const runAfterChangeDetection = this._runAfterChangeDetection;
        this._runAfterChangeDetection = [];
        for (const fn of runAfterChangeDetection) {
            fn();
        }
    }
    /**
     * Calculates the `style.width` and `style.height` for the spacer element.
     * @private
     * @return {?}
     */
    _calculateSpacerSize() {
        this._totalContentHeight =
            this.orientation === 'horizontal' ? '' : `${this._totalContentSize}px`;
        this._totalContentWidth =
            this.orientation === 'horizontal' ? `${this._totalContentSize}px` : '';
    }
}
CdkVirtualScrollViewport.decorators = [
    { type: Component, args: [{
                moduleId: module.id,
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
            }] }
];
/** @nocollapse */
CdkVirtualScrollViewport.ctorParameters = () => [
    { type: ElementRef },
    { type: ChangeDetectorRef },
    { type: NgZone },
    { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [VIRTUAL_SCROLL_STRATEGY,] }] },
    { type: Directionality, decorators: [{ type: Optional }] },
    { type: ScrollDispatcher }
];
CdkVirtualScrollViewport.propDecorators = {
    orientation: [{ type: Input }],
    scrolledIndexChange: [{ type: Output }],
    _contentWrapper: [{ type: ViewChild, args: ['contentWrapper', { static: true },] }]
};
if (false) {
    /**
     * Emits when the viewport is detached from a CdkVirtualForOf.
     * @type {?}
     * @private
     */
    CdkVirtualScrollViewport.prototype._detachedSubject;
    /**
     * Emits when the rendered range changes.
     * @type {?}
     * @private
     */
    CdkVirtualScrollViewport.prototype._renderedRangeSubject;
    /**
     * @type {?}
     * @private
     */
    CdkVirtualScrollViewport.prototype._orientation;
    /**
     * Emits when the index of the first element visible in the viewport changes.
     * @type {?}
     */
    CdkVirtualScrollViewport.prototype.scrolledIndexChange;
    /**
     * The element that wraps the rendered content.
     * @type {?}
     */
    CdkVirtualScrollViewport.prototype._contentWrapper;
    /**
     * A stream that emits whenever the rendered range changes.
     * @type {?}
     */
    CdkVirtualScrollViewport.prototype.renderedRangeStream;
    /**
     * The total size of all content (in pixels), including content that is not currently rendered.
     * @type {?}
     * @private
     */
    CdkVirtualScrollViewport.prototype._totalContentSize;
    /**
     * A string representing the `style.width` property value to be used for the spacer element.
     * @type {?}
     */
    CdkVirtualScrollViewport.prototype._totalContentWidth;
    /**
     * A string representing the `style.height` property value to be used for the spacer element.
     * @type {?}
     */
    CdkVirtualScrollViewport.prototype._totalContentHeight;
    /**
     * The CSS transform applied to the rendered subset of items so that they appear within the bounds
     * of the visible viewport.
     * @type {?}
     * @private
     */
    CdkVirtualScrollViewport.prototype._renderedContentTransform;
    /**
     * The currently rendered range of indices.
     * @type {?}
     * @private
     */
    CdkVirtualScrollViewport.prototype._renderedRange;
    /**
     * The length of the data bound to this viewport (in number of items).
     * @type {?}
     * @private
     */
    CdkVirtualScrollViewport.prototype._dataLength;
    /**
     * The size of the viewport (in pixels).
     * @type {?}
     * @private
     */
    CdkVirtualScrollViewport.prototype._viewportSize;
    /**
     * the currently attached CdkVirtualForOf.
     * @type {?}
     * @private
     */
    CdkVirtualScrollViewport.prototype._forOf;
    /**
     * The last rendered content offset that was set.
     * @type {?}
     * @private
     */
    CdkVirtualScrollViewport.prototype._renderedContentOffset;
    /**
     * Whether the last rendered content offset was to the end of the content (and therefore needs to
     * be rewritten as an offset to the start of the content).
     * @type {?}
     * @private
     */
    CdkVirtualScrollViewport.prototype._renderedContentOffsetNeedsRewrite;
    /**
     * Whether there is a pending change detection cycle.
     * @type {?}
     * @private
     */
    CdkVirtualScrollViewport.prototype._isChangeDetectionPending;
    /**
     * A list of functions to run after the next change detection cycle.
     * @type {?}
     * @private
     */
    CdkVirtualScrollViewport.prototype._runAfterChangeDetection;
    /** @type {?} */
    CdkVirtualScrollViewport.prototype.elementRef;
    /**
     * @type {?}
     * @private
     */
    CdkVirtualScrollViewport.prototype._changeDetectorRef;
    /**
     * @type {?}
     * @private
     */
    CdkVirtualScrollViewport.prototype._scrollStrategy;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1zY3JvbGwtdmlld3BvcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy92aXJ0dWFsLXNjcm9sbC12aWV3cG9ydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUVqRCxPQUFPLEVBQ0wsdUJBQXVCLEVBQ3ZCLGlCQUFpQixFQUNqQixTQUFTLEVBQ1QsVUFBVSxFQUNWLE1BQU0sRUFDTixLQUFLLEVBQ0wsTUFBTSxFQUdOLFFBQVEsRUFDUixNQUFNLEVBQ04sU0FBUyxFQUNULGlCQUFpQixHQUNsQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsdUJBQXVCLEVBQUUsYUFBYSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQVcsTUFBTSxNQUFNLENBQUM7QUFDM0YsT0FBTyxFQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDL0QsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDckQsT0FBTyxFQUFDLGFBQWEsRUFBMEIsTUFBTSxjQUFjLENBQUM7QUFFcEUsT0FBTyxFQUFDLHVCQUF1QixFQUF3QixNQUFNLDJCQUEyQixDQUFDOzs7Ozs7O0FBSXpGLFNBQVMsV0FBVyxDQUFDLEVBQWEsRUFBRSxFQUFhO0lBQy9DLE9BQU8sRUFBRSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQztBQUNsRCxDQUFDOzs7Ozs7O01BT0ssZ0JBQWdCLEdBQ2xCLE9BQU8scUJBQXFCLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsYUFBYTs7OztBQXFCMUYsTUFBTSxPQUFPLHdCQUF5QixTQUFR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QU8sRUFBRSxhQUFhO3dCQUN0QixXQUFXLEVBQUUsd0JBQXdCO3FCQUN0QyxDQUFDOzthQUNIOzs7O1lBbERDLFVBQVU7WUFGVixpQkFBaUI7WUFLakIsTUFBTTs0Q0FtSU8sUUFBUSxZQUFJLE1BQU0sU0FBQyx1QkFBdUI7WUE1SWpELGNBQWMsdUJBOElQLFFBQVE7WUEzSGYsZ0JBQWdCOzs7MEJBOENyQixLQUFLO2tDQWlCTCxNQUFNOzhCQU1OLFNBQVMsU0FBQyxnQkFBZ0IsRUFBRSxFQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUM7Ozs7Ozs7O0lBN0IzQyxvREFBK0M7Ozs7OztJQUcvQyx5REFBeUQ7Ozs7O0lBYXpELGdEQUE2RDs7Ozs7SUFPN0QsdURBR3NGOzs7OztJQUd0RixtREFBc0Y7Ozs7O0lBR3RGLHVEQUF1Rjs7Ozs7O0lBS3ZGLHFEQUE4Qjs7Ozs7SUFHOUIsc0RBQXdCOzs7OztJQUd4Qix1REFBeUI7Ozs7Ozs7SUFNekIsNkRBQTBDOzs7Ozs7SUFHMUMsa0RBQXVEOzs7Ozs7SUFHdkQsK0NBQXdCOzs7Ozs7SUFHeEIsaURBQTBCOzs7Ozs7SUFHMUIsMENBQTRDOzs7Ozs7SUFHNUMsMERBQW1DOzs7Ozs7O0lBTW5DLHNFQUFtRDs7Ozs7O0lBR25ELDZEQUEwQzs7Ozs7O0lBRzFDLDREQUFrRDs7SUFFdEMsOENBQTBDOzs7OztJQUMxQyxzREFBNkM7Ozs7O0lBRTdDLG1EQUNrRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge0xpc3RSYW5nZX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvbGxlY3Rpb25zJztcbmltcG9ydCB7XG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBFbGVtZW50UmVmLFxuICBJbmplY3QsXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgT25Jbml0LFxuICBPcHRpb25hbCxcbiAgT3V0cHV0LFxuICBWaWV3Q2hpbGQsXG4gIFZpZXdFbmNhcHN1bGF0aW9uLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7YW5pbWF0aW9uRnJhbWVTY2hlZHVsZXIsIGFzYXBTY2hlZHVsZXIsIE9ic2VydmFibGUsIFN1YmplY3QsIE9ic2VydmVyfSBmcm9tICdyeGpzJztcbmltcG9ydCB7YXVkaXRUaW1lLCBzdGFydFdpdGgsIHRha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtTY3JvbGxEaXNwYXRjaGVyfSBmcm9tICcuL3Njcm9sbC1kaXNwYXRjaGVyJztcbmltcG9ydCB7Q2RrU2Nyb2xsYWJsZSwgRXh0ZW5kZWRTY3JvbGxUb09wdGlvbnN9IGZyb20gJy4vc2Nyb2xsYWJsZSc7XG5pbXBvcnQge0Nka1ZpcnR1YWxGb3JPZn0gZnJvbSAnLi92aXJ0dWFsLWZvci1vZic7XG5pbXBvcnQge1ZJUlRVQUxfU0NST0xMX1NUUkFURUdZLCBWaXJ0dWFsU2Nyb2xsU3RyYXRlZ3l9IGZyb20gJy4vdmlydHVhbC1zY3JvbGwtc3RyYXRlZ3knO1xuXG5cbi8qKiBDaGVja3MgaWYgdGhlIGdpdmVuIHJhbmdlcyBhcmUgZXF1YWwuICovXG5mdW5jdGlvbiByYW5nZXNFcXVhbChyMTogTGlzdFJhbmdlLCByMjogTGlzdFJhbmdlKTogYm9vbGVhbiB7XG4gIHJldHVybiByMS5zdGFydCA9PSByMi5zdGFydCAmJiByMS5lbmQgPT0gcjIuZW5kO1xufVxuXG4vKipcbiAqIFNjaGVkdWxlciB0byBiZSB1c2VkIGZvciBzY3JvbGwgZXZlbnRzLiBOZWVkcyB0byBmYWxsIGJhY2sgdG9cbiAqIHNvbWV0aGluZyB0aGF0IGRvZXNuJ3QgcmVseSBvbiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgb24gZW52aXJvbm1lbnRzXG4gKiB0aGF0IGRvbid0IHN1cHBvcnQgaXQgKGUuZy4gc2VydmVyLXNpZGUgcmVuZGVyaW5nKS5cbiAqL1xuY29uc3QgU0NST0xMX1NDSEVEVUxFUiA9XG4gICAgdHlwZW9mIHJlcXVlc3RBbmltYXRpb25GcmFtZSAhPT0gJ3VuZGVmaW5lZCcgPyBhbmltYXRpb25GcmFtZVNjaGVkdWxlciA6IGFzYXBTY2hlZHVsZXI7XG5cblxuLyoqIEEgdmlld3BvcnQgdGhhdCB2aXJ0dWFsaXplcyBpdHMgc2Nyb2xsaW5nIHdpdGggdGhlIGhlbHAgb2YgYENka1ZpcnR1YWxGb3JPZmAuICovXG5AQ29tcG9uZW50KHtcbiAgbW9kdWxlSWQ6IG1vZHVsZS5pZCxcbiAgc2VsZWN0b3I6ICdjZGstdmlydHVhbC1zY3JvbGwtdmlld3BvcnQnLFxuICB0ZW1wbGF0ZVVybDogJ3ZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0Lmh0bWwnLFxuICBzdHlsZVVybHM6IFsndmlydHVhbC1zY3JvbGwtdmlld3BvcnQuY3NzJ10sXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLXZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0JyxcbiAgICAnW2NsYXNzLmNkay12aXJ0dWFsLXNjcm9sbC1vcmllbnRhdGlvbi1ob3Jpem9udGFsXSc6ICdvcmllbnRhdGlvbiA9PT0gXCJob3Jpem9udGFsXCInLFxuICAgICdbY2xhc3MuY2RrLXZpcnR1YWwtc2Nyb2xsLW9yaWVudGF0aW9uLXZlcnRpY2FsXSc6ICdvcmllbnRhdGlvbiAhPT0gXCJob3Jpem9udGFsXCInLFxuICB9LFxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaCxcbiAgcHJvdmlkZXJzOiBbe1xuICAgIHByb3ZpZGU6IENka1Njcm9sbGFibGUsXG4gICAgdXNlRXhpc3Rpbmc6IENka1ZpcnR1YWxTY3JvbGxWaWV3cG9ydCxcbiAgfV1cbn0pXG5leHBvcnQgY2xhc3MgQ2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0IGV4dGVuZHMgQ2RrU2Nyb2xsYWJsZSBpbXBsZW1lbnRzIE9uSW5pdCwgT25EZXN0cm95IHtcbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHZpZXdwb3J0IGlzIGRldGFjaGVkIGZyb20gYSBDZGtWaXJ0dWFsRm9yT2YuICovXG4gIHByaXZhdGUgX2RldGFjaGVkU3ViamVjdCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHJlbmRlcmVkIHJhbmdlIGNoYW5nZXMuICovXG4gIHByaXZhdGUgX3JlbmRlcmVkUmFuZ2VTdWJqZWN0ID0gbmV3IFN1YmplY3Q8TGlzdFJhbmdlPigpO1xuXG4gIC8qKiBUaGUgZGlyZWN0aW9uIHRoZSB2aWV3cG9ydCBzY3JvbGxzLiAqL1xuICBASW5wdXQoKVxuICBnZXQgb3JpZW50YXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX29yaWVudGF0aW9uO1xuICB9XG4gIHNldCBvcmllbnRhdGlvbihvcmllbnRhdGlvbjogJ2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJykge1xuICAgIGlmICh0aGlzLl9vcmllbnRhdGlvbiAhPT0gb3JpZW50YXRpb24pIHtcbiAgICAgIHRoaXMuX29yaWVudGF0aW9uID0gb3JpZW50YXRpb247XG4gICAgICB0aGlzLl9jYWxjdWxhdGVTcGFjZXJTaXplKCk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgX29yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcgfCAndmVydGljYWwnID0gJ3ZlcnRpY2FsJztcblxuICAvLyBOb3RlOiB3ZSBkb24ndCB1c2UgdGhlIHR5cGljYWwgRXZlbnRFbWl0dGVyIGhlcmUgYmVjYXVzZSB3ZSBuZWVkIHRvIHN1YnNjcmliZSB0byB0aGUgc2Nyb2xsXG4gIC8vIHN0cmF0ZWd5IGxhemlseSAoaS5lLiBvbmx5IGlmIHRoZSB1c2VyIGlzIGFjdHVhbGx5IGxpc3RlbmluZyB0byB0aGUgZXZlbnRzKS4gV2UgZG8gdGhpcyBiZWNhdXNlXG4gIC8vIGRlcGVuZGluZyBvbiBob3cgdGhlIHN0cmF0ZWd5IGNhbGN1bGF0ZXMgdGhlIHNjcm9sbGVkIGluZGV4LCBpdCBtYXkgY29tZSBhdCBhIGNvc3QgdG9cbiAgLy8gcGVyZm9ybWFuY2UuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBpbmRleCBvZiB0aGUgZmlyc3QgZWxlbWVudCB2aXNpYmxlIGluIHRoZSB2aWV3cG9ydCBjaGFuZ2VzLiAqL1xuICBAT3V0cHV0KCkgc2Nyb2xsZWRJbmRleENoYW5nZTogT2JzZXJ2YWJsZTxudW1iZXI+ID1cbiAgICAgIG5ldyBPYnNlcnZhYmxlKChvYnNlcnZlcjogT2JzZXJ2ZXI8bnVtYmVyPikgPT5cbiAgICAgICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kuc2Nyb2xsZWRJbmRleENoYW5nZS5zdWJzY3JpYmUoaW5kZXggPT5cbiAgICAgICAgICAgIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4gdGhpcy5uZ1pvbmUucnVuKCgpID0+IG9ic2VydmVyLm5leHQoaW5kZXgpKSkpKTtcblxuICAvKiogVGhlIGVsZW1lbnQgdGhhdCB3cmFwcyB0aGUgcmVuZGVyZWQgY29udGVudC4gKi9cbiAgQFZpZXdDaGlsZCgnY29udGVudFdyYXBwZXInLCB7c3RhdGljOiB0cnVlfSkgX2NvbnRlbnRXcmFwcGVyOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PjtcblxuICAvKiogQSBzdHJlYW0gdGhhdCBlbWl0cyB3aGVuZXZlciB0aGUgcmVuZGVyZWQgcmFuZ2UgY2hhbmdlcy4gKi9cbiAgcmVuZGVyZWRSYW5nZVN0cmVhbTogT2JzZXJ2YWJsZTxMaXN0UmFuZ2U+ID0gdGhpcy5fcmVuZGVyZWRSYW5nZVN1YmplY3QuYXNPYnNlcnZhYmxlKCk7XG5cbiAgLyoqXG4gICAqIFRoZSB0b3RhbCBzaXplIG9mIGFsbCBjb250ZW50IChpbiBwaXhlbHMpLCBpbmNsdWRpbmcgY29udGVudCB0aGF0IGlzIG5vdCBjdXJyZW50bHkgcmVuZGVyZWQuXG4gICAqL1xuICBwcml2YXRlIF90b3RhbENvbnRlbnRTaXplID0gMDtcblxuICAvKiogQSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBgc3R5bGUud2lkdGhgIHByb3BlcnR5IHZhbHVlIHRvIGJlIHVzZWQgZm9yIHRoZSBzcGFjZXIgZWxlbWVudC4gKi9cbiAgX3RvdGFsQ29udGVudFdpZHRoID0gJyc7XG5cbiAgLyoqIEEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgYHN0eWxlLmhlaWdodGAgcHJvcGVydHkgdmFsdWUgdG8gYmUgdXNlZCBmb3IgdGhlIHNwYWNlciBlbGVtZW50LiAqL1xuICBfdG90YWxDb250ZW50SGVpZ2h0ID0gJyc7XG5cbiAgLyoqXG4gICAqIFRoZSBDU1MgdHJhbnNmb3JtIGFwcGxpZWQgdG8gdGhlIHJlbmRlcmVkIHN1YnNldCBvZiBpdGVtcyBzbyB0aGF0IHRoZXkgYXBwZWFyIHdpdGhpbiB0aGUgYm91bmRzXG4gICAqIG9mIHRoZSB2aXNpYmxlIHZpZXdwb3J0LlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVuZGVyZWRDb250ZW50VHJhbnNmb3JtOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBjdXJyZW50bHkgcmVuZGVyZWQgcmFuZ2Ugb2YgaW5kaWNlcy4gKi9cbiAgcHJpdmF0ZSBfcmVuZGVyZWRSYW5nZTogTGlzdFJhbmdlID0ge3N0YXJ0OiAwLCBlbmQ6IDB9O1xuXG4gIC8qKiBUaGUgbGVuZ3RoIG9mIHRoZSBkYXRhIGJvdW5kIHRvIHRoaXMgdmlld3BvcnQgKGluIG51bWJlciBvZiBpdGVtcykuICovXG4gIHByaXZhdGUgX2RhdGFMZW5ndGggPSAwO1xuXG4gIC8qKiBUaGUgc2l6ZSBvZiB0aGUgdmlld3BvcnQgKGluIHBpeGVscykuICovXG4gIHByaXZhdGUgX3ZpZXdwb3J0U2l6ZSA9IDA7XG5cbiAgLyoqIHRoZSBjdXJyZW50bHkgYXR0YWNoZWQgQ2RrVmlydHVhbEZvck9mLiAqL1xuICBwcml2YXRlIF9mb3JPZjogQ2RrVmlydHVhbEZvck9mPGFueT4gfCBudWxsO1xuXG4gIC8qKiBUaGUgbGFzdCByZW5kZXJlZCBjb250ZW50IG9mZnNldCB0aGF0IHdhcyBzZXQuICovXG4gIHByaXZhdGUgX3JlbmRlcmVkQ29udGVudE9mZnNldCA9IDA7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGxhc3QgcmVuZGVyZWQgY29udGVudCBvZmZzZXQgd2FzIHRvIHRoZSBlbmQgb2YgdGhlIGNvbnRlbnQgKGFuZCB0aGVyZWZvcmUgbmVlZHMgdG9cbiAgICogYmUgcmV3cml0dGVuIGFzIGFuIG9mZnNldCB0byB0aGUgc3RhcnQgb2YgdGhlIGNvbnRlbnQpLlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVuZGVyZWRDb250ZW50T2Zmc2V0TmVlZHNSZXdyaXRlID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgdGhlcmUgaXMgYSBwZW5kaW5nIGNoYW5nZSBkZXRlY3Rpb24gY3ljbGUuICovXG4gIHByaXZhdGUgX2lzQ2hhbmdlRGV0ZWN0aW9uUGVuZGluZyA9IGZhbHNlO1xuXG4gIC8qKiBBIGxpc3Qgb2YgZnVuY3Rpb25zIHRvIHJ1biBhZnRlciB0aGUgbmV4dCBjaGFuZ2UgZGV0ZWN0aW9uIGN5Y2xlLiAqL1xuICBwcml2YXRlIF9ydW5BZnRlckNoYW5nZURldGVjdGlvbjogRnVuY3Rpb25bXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBlbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmLFxuICAgICAgICAgICAgICBuZ1pvbmU6IE5nWm9uZSxcbiAgICAgICAgICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChWSVJUVUFMX1NDUk9MTF9TVFJBVEVHWSlcbiAgICAgICAgICAgICAgICAgIHByaXZhdGUgX3Njcm9sbFN0cmF0ZWd5OiBWaXJ0dWFsU2Nyb2xsU3RyYXRlZ3ksXG4gICAgICAgICAgICAgIEBPcHRpb25hbCgpIGRpcjogRGlyZWN0aW9uYWxpdHksXG4gICAgICAgICAgICAgIHNjcm9sbERpc3BhdGNoZXI6IFNjcm9sbERpc3BhdGNoZXIpIHtcbiAgICBzdXBlcihlbGVtZW50UmVmLCBzY3JvbGxEaXNwYXRjaGVyLCBuZ1pvbmUsIGRpcik7XG5cbiAgICBpZiAoIV9zY3JvbGxTdHJhdGVneSkge1xuICAgICAgdGhyb3cgRXJyb3IoJ0Vycm9yOiBjZGstdmlydHVhbC1zY3JvbGwtdmlld3BvcnQgcmVxdWlyZXMgdGhlIFwiaXRlbVNpemVcIiBwcm9wZXJ0eSB0byBiZSBzZXQuJyk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgc3VwZXIubmdPbkluaXQoKTtcblxuICAgIC8vIEl0J3Mgc3RpbGwgdG9vIGVhcmx5IHRvIG1lYXN1cmUgdGhlIHZpZXdwb3J0IGF0IHRoaXMgcG9pbnQuIERlZmVycmluZyB3aXRoIGEgcHJvbWlzZSBhbGxvd3NcbiAgICAvLyB0aGUgVmlld3BvcnQgdG8gYmUgcmVuZGVyZWQgd2l0aCB0aGUgY29ycmVjdCBzaXplIGJlZm9yZSB3ZSBtZWFzdXJlLiBXZSBydW4gdGhpcyBvdXRzaWRlIHRoZVxuICAgIC8vIHpvbmUgdG8gYXZvaWQgY2F1c2luZyBtb3JlIGNoYW5nZSBkZXRlY3Rpb24gY3ljbGVzLiBXZSBoYW5kbGUgdGhlIGNoYW5nZSBkZXRlY3Rpb24gbG9vcFxuICAgIC8vIG91cnNlbHZlcyBpbnN0ZWFkLlxuICAgIHRoaXMubmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5fbWVhc3VyZVZpZXdwb3J0U2l6ZSgpO1xuICAgICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kuYXR0YWNoKHRoaXMpO1xuXG4gICAgICB0aGlzLmVsZW1lbnRTY3JvbGxlZCgpXG4gICAgICAgICAgLnBpcGUoXG4gICAgICAgICAgICAgIC8vIFN0YXJ0IG9mZiB3aXRoIGEgZmFrZSBzY3JvbGwgZXZlbnQgc28gd2UgcHJvcGVybHkgZGV0ZWN0IG91ciBpbml0aWFsIHBvc2l0aW9uLlxuICAgICAgICAgICAgICBzdGFydFdpdGgobnVsbCEpLFxuICAgICAgICAgICAgICAvLyBDb2xsZWN0IG11bHRpcGxlIGV2ZW50cyBpbnRvIG9uZSB1bnRpbCB0aGUgbmV4dCBhbmltYXRpb24gZnJhbWUuIFRoaXMgd2F5IGlmXG4gICAgICAgICAgICAgIC8vIHRoZXJlIGFyZSBtdWx0aXBsZSBzY3JvbGwgZXZlbnRzIGluIHRoZSBzYW1lIGZyYW1lIHdlIG9ubHkgbmVlZCB0byByZWNoZWNrXG4gICAgICAgICAgICAgIC8vIG91ciBsYXlvdXQgb25jZS5cbiAgICAgICAgICAgICAgYXVkaXRUaW1lKDAsIFNDUk9MTF9TQ0hFRFVMRVIpKVxuICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy5fc2Nyb2xsU3RyYXRlZ3kub25Db250ZW50U2Nyb2xsZWQoKSk7XG5cbiAgICAgIHRoaXMuX21hcmtDaGFuZ2VEZXRlY3Rpb25OZWVkZWQoKTtcbiAgICB9KSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLmRldGFjaCgpO1xuICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5LmRldGFjaCgpO1xuXG4gICAgLy8gQ29tcGxldGUgYWxsIHN1YmplY3RzXG4gICAgdGhpcy5fcmVuZGVyZWRSYW5nZVN1YmplY3QuY29tcGxldGUoKTtcbiAgICB0aGlzLl9kZXRhY2hlZFN1YmplY3QuY29tcGxldGUoKTtcblxuICAgIHN1cGVyLm5nT25EZXN0cm95KCk7XG4gIH1cblxuICAvKiogQXR0YWNoZXMgYSBgQ2RrVmlydHVhbEZvck9mYCB0byB0aGlzIHZpZXdwb3J0LiAqL1xuICBhdHRhY2goZm9yT2Y6IENka1ZpcnR1YWxGb3JPZjxhbnk+KSB7XG4gICAgaWYgKHRoaXMuX2Zvck9mKSB7XG4gICAgICB0aHJvdyBFcnJvcignQ2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0IGlzIGFscmVhZHkgYXR0YWNoZWQuJyk7XG4gICAgfVxuXG4gICAgLy8gU3Vic2NyaWJlIHRvIHRoZSBkYXRhIHN0cmVhbSBvZiB0aGUgQ2RrVmlydHVhbEZvck9mIHRvIGtlZXAgdHJhY2sgb2Ygd2hlbiB0aGUgZGF0YSBsZW5ndGhcbiAgICAvLyBjaGFuZ2VzLiBSdW4gb3V0c2lkZSB0aGUgem9uZSB0byBhdm9pZCB0cmlnZ2VyaW5nIGNoYW5nZSBkZXRlY3Rpb24sIHNpbmNlIHdlJ3JlIG1hbmFnaW5nIHRoZVxuICAgIC8vIGNoYW5nZSBkZXRlY3Rpb24gbG9vcCBvdXJzZWx2ZXMuXG4gICAgdGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgdGhpcy5fZm9yT2YgPSBmb3JPZjtcbiAgICAgIHRoaXMuX2Zvck9mLmRhdGFTdHJlYW0ucGlwZSh0YWtlVW50aWwodGhpcy5fZGV0YWNoZWRTdWJqZWN0KSkuc3Vic2NyaWJlKGRhdGEgPT4ge1xuICAgICAgICBjb25zdCBuZXdMZW5ndGggPSBkYXRhLmxlbmd0aDtcbiAgICAgICAgaWYgKG5ld0xlbmd0aCAhPT0gdGhpcy5fZGF0YUxlbmd0aCkge1xuICAgICAgICAgIHRoaXMuX2RhdGFMZW5ndGggPSBuZXdMZW5ndGg7XG4gICAgICAgICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kub25EYXRhTGVuZ3RoQ2hhbmdlZCgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2RvQ2hhbmdlRGV0ZWN0aW9uKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBEZXRhY2hlcyB0aGUgY3VycmVudCBgQ2RrVmlydHVhbEZvck9mYC4gKi9cbiAgZGV0YWNoKCkge1xuICAgIHRoaXMuX2Zvck9mID0gbnVsbDtcbiAgICB0aGlzLl9kZXRhY2hlZFN1YmplY3QubmV4dCgpO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIGxlbmd0aCBvZiB0aGUgZGF0YSBib3VuZCB0byB0aGlzIHZpZXdwb3J0IChpbiBudW1iZXIgb2YgaXRlbXMpLiAqL1xuICBnZXREYXRhTGVuZ3RoKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX2RhdGFMZW5ndGg7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgc2l6ZSBvZiB0aGUgdmlld3BvcnQgKGluIHBpeGVscykuICovXG4gIGdldFZpZXdwb3J0U2l6ZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92aWV3cG9ydFNpemU7XG4gIH1cblxuICAvLyBUT0RPKG1tYWxlcmJhKTogVGhpcyBpcyB0ZWNobmljYWxseSBvdXQgb2Ygc3luYyB3aXRoIHdoYXQncyByZWFsbHkgcmVuZGVyZWQgdW50aWwgYSByZW5kZXJcbiAgLy8gY3ljbGUgaGFwcGVucy4gSSdtIGJlaW5nIGNhcmVmdWwgdG8gb25seSBjYWxsIGl0IGFmdGVyIHRoZSByZW5kZXIgY3ljbGUgaXMgY29tcGxldGUgYW5kIGJlZm9yZVxuICAvLyBzZXR0aW5nIGl0IHRvIHNvbWV0aGluZyBlbHNlLCBidXQgaXRzIGVycm9yIHByb25lIGFuZCBzaG91bGQgcHJvYmFibHkgYmUgc3BsaXQgaW50b1xuICAvLyBgcGVuZGluZ1JhbmdlYCBhbmQgYHJlbmRlcmVkUmFuZ2VgLCB0aGUgbGF0dGVyIHJlZmxlY3Rpbmcgd2hhdHMgYWN0dWFsbHkgaW4gdGhlIERPTS5cblxuICAvKiogR2V0IHRoZSBjdXJyZW50IHJlbmRlcmVkIHJhbmdlIG9mIGl0ZW1zLiAqL1xuICBnZXRSZW5kZXJlZFJhbmdlKCk6IExpc3RSYW5nZSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlbmRlcmVkUmFuZ2U7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdG90YWwgc2l6ZSBvZiBhbGwgY29udGVudCAoaW4gcGl4ZWxzKSwgaW5jbHVkaW5nIGNvbnRlbnQgdGhhdCBpcyBub3QgY3VycmVudGx5XG4gICAqIHJlbmRlcmVkLlxuICAgKi9cbiAgc2V0VG90YWxDb250ZW50U2l6ZShzaXplOiBudW1iZXIpIHtcbiAgICBpZiAodGhpcy5fdG90YWxDb250ZW50U2l6ZSAhPT0gc2l6ZSkge1xuICAgICAgdGhpcy5fdG90YWxDb250ZW50U2l6ZSA9IHNpemU7XG4gICAgICB0aGlzLl9jYWxjdWxhdGVTcGFjZXJTaXplKCk7XG4gICAgICB0aGlzLl9tYXJrQ2hhbmdlRGV0ZWN0aW9uTmVlZGVkKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFNldHMgdGhlIGN1cnJlbnRseSByZW5kZXJlZCByYW5nZSBvZiBpbmRpY2VzLiAqL1xuICBzZXRSZW5kZXJlZFJhbmdlKHJhbmdlOiBMaXN0UmFuZ2UpIHtcbiAgICBpZiAoIXJhbmdlc0VxdWFsKHRoaXMuX3JlbmRlcmVkUmFuZ2UsIHJhbmdlKSkge1xuICAgICAgdGhpcy5fcmVuZGVyZWRSYW5nZVN1YmplY3QubmV4dCh0aGlzLl9yZW5kZXJlZFJhbmdlID0gcmFuZ2UpO1xuICAgICAgdGhpcy5fbWFya0NoYW5nZURldGVjdGlvbk5lZWRlZCgoKSA9PiB0aGlzLl9zY3JvbGxTdHJhdGVneS5vbkNvbnRlbnRSZW5kZXJlZCgpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgb2Zmc2V0IGZyb20gdGhlIHN0YXJ0IG9mIHRoZSB2aWV3cG9ydCB0byB0aGUgc3RhcnQgb2YgdGhlIHJlbmRlcmVkIGRhdGEgKGluIHBpeGVscykuXG4gICAqL1xuICBnZXRPZmZzZXRUb1JlbmRlcmVkQ29udGVudFN0YXJ0KCk6IG51bWJlciB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLl9yZW5kZXJlZENvbnRlbnRPZmZzZXROZWVkc1Jld3JpdGUgPyBudWxsIDogdGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG9mZnNldCBmcm9tIHRoZSBzdGFydCBvZiB0aGUgdmlld3BvcnQgdG8gZWl0aGVyIHRoZSBzdGFydCBvciBlbmQgb2YgdGhlIHJlbmRlcmVkIGRhdGFcbiAgICogKGluIHBpeGVscykuXG4gICAqL1xuICBzZXRSZW5kZXJlZENvbnRlbnRPZmZzZXQob2Zmc2V0OiBudW1iZXIsIHRvOiAndG8tc3RhcnQnIHwgJ3RvLWVuZCcgPSAndG8tc3RhcnQnKSB7XG4gICAgLy8gRm9yIGEgaG9yaXpvbnRhbCB2aWV3cG9ydCBpbiBhIHJpZ2h0LXRvLWxlZnQgbGFuZ3VhZ2Ugd2UgbmVlZCB0byB0cmFuc2xhdGUgYWxvbmcgdGhlIHgtYXhpc1xuICAgIC8vIGluIHRoZSBuZWdhdGl2ZSBkaXJlY3Rpb24uXG4gICAgY29uc3QgaXNSdGwgPSB0aGlzLmRpciAmJiB0aGlzLmRpci52YWx1ZSA9PSAncnRsJztcbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLm9yaWVudGF0aW9uID09ICdob3Jpem9udGFsJztcbiAgICBjb25zdCBheGlzID0gaXNIb3Jpem9udGFsID8gJ1gnIDogJ1knO1xuICAgIGNvbnN0IGF4aXNEaXJlY3Rpb24gPSBpc0hvcml6b250YWwgJiYgaXNSdGwgPyAtMSA6IDE7XG4gICAgbGV0IHRyYW5zZm9ybSA9IGB0cmFuc2xhdGUke2F4aXN9KCR7TnVtYmVyKGF4aXNEaXJlY3Rpb24gKiBvZmZzZXQpfXB4KWA7XG4gICAgdGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0ID0gb2Zmc2V0O1xuICAgIGlmICh0byA9PT0gJ3RvLWVuZCcpIHtcbiAgICAgIHRyYW5zZm9ybSArPSBgIHRyYW5zbGF0ZSR7YXhpc30oLTEwMCUpYDtcbiAgICAgIC8vIFRoZSB2aWV3cG9ydCBzaG91bGQgcmV3cml0ZSB0aGlzIGFzIGEgYHRvLXN0YXJ0YCBvZmZzZXQgb24gdGhlIG5leHQgcmVuZGVyIGN5Y2xlLiBPdGhlcndpc2VcbiAgICAgIC8vIGVsZW1lbnRzIHdpbGwgYXBwZWFyIHRvIGV4cGFuZCBpbiB0aGUgd3JvbmcgZGlyZWN0aW9uIChlLmcuIGBtYXQtZXhwYW5zaW9uLXBhbmVsYCB3b3VsZFxuICAgICAgLy8gZXhwYW5kIHVwd2FyZCkuXG4gICAgICB0aGlzLl9yZW5kZXJlZENvbnRlbnRPZmZzZXROZWVkc1Jld3JpdGUgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAodGhpcy5fcmVuZGVyZWRDb250ZW50VHJhbnNmb3JtICE9IHRyYW5zZm9ybSkge1xuICAgICAgLy8gV2Uga25vdyB0aGlzIHZhbHVlIGlzIHNhZmUgYmVjYXVzZSB3ZSBwYXJzZSBgb2Zmc2V0YCB3aXRoIGBOdW1iZXIoKWAgYmVmb3JlIHBhc3NpbmcgaXRcbiAgICAgIC8vIGludG8gdGhlIHN0cmluZy5cbiAgICAgIHRoaXMuX3JlbmRlcmVkQ29udGVudFRyYW5zZm9ybSA9IHRyYW5zZm9ybTtcbiAgICAgIHRoaXMuX21hcmtDaGFuZ2VEZXRlY3Rpb25OZWVkZWQoKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0TmVlZHNSZXdyaXRlKSB7XG4gICAgICAgICAgdGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0IC09IHRoaXMubWVhc3VyZVJlbmRlcmVkQ29udGVudFNpemUoKTtcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlZENvbnRlbnRPZmZzZXROZWVkc1Jld3JpdGUgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLnNldFJlbmRlcmVkQ29udGVudE9mZnNldCh0aGlzLl9yZW5kZXJlZENvbnRlbnRPZmZzZXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5Lm9uUmVuZGVyZWRPZmZzZXRDaGFuZ2VkKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTY3JvbGxzIHRvIHRoZSBnaXZlbiBvZmZzZXQgZnJvbSB0aGUgc3RhcnQgb2YgdGhlIHZpZXdwb3J0LiBQbGVhc2Ugbm90ZSB0aGF0IHRoaXMgaXMgbm90IGFsd2F5c1xuICAgKiB0aGUgc2FtZSBhcyBzZXR0aW5nIGBzY3JvbGxUb3BgIG9yIGBzY3JvbGxMZWZ0YC4gSW4gYSBob3Jpem9udGFsIHZpZXdwb3J0IHdpdGggcmlnaHQtdG8tbGVmdFxuICAgKiBkaXJlY3Rpb24sIHRoaXMgd291bGQgYmUgdGhlIGVxdWl2YWxlbnQgb2Ygc2V0dGluZyBhIGZpY3Rpb25hbCBgc2Nyb2xsUmlnaHRgIHByb3BlcnR5LlxuICAgKiBAcGFyYW0gb2Zmc2V0IFRoZSBvZmZzZXQgdG8gc2Nyb2xsIHRvLlxuICAgKiBAcGFyYW0gYmVoYXZpb3IgVGhlIFNjcm9sbEJlaGF2aW9yIHRvIHVzZSB3aGVuIHNjcm9sbGluZy4gRGVmYXVsdCBpcyBiZWhhdmlvciBpcyBgYXV0b2AuXG4gICAqL1xuICBzY3JvbGxUb09mZnNldChvZmZzZXQ6IG51bWJlciwgYmVoYXZpb3I6IFNjcm9sbEJlaGF2aW9yID0gJ2F1dG8nKSB7XG4gICAgY29uc3Qgb3B0aW9uczogRXh0ZW5kZWRTY3JvbGxUb09wdGlvbnMgPSB7YmVoYXZpb3J9O1xuICAgIGlmICh0aGlzLm9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcpIHtcbiAgICAgIG9wdGlvbnMuc3RhcnQgPSBvZmZzZXQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdGlvbnMudG9wID0gb2Zmc2V0O1xuICAgIH1cbiAgICB0aGlzLnNjcm9sbFRvKG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNjcm9sbHMgdG8gdGhlIG9mZnNldCBmb3IgdGhlIGdpdmVuIGluZGV4LlxuICAgKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IHRvIHNjcm9sbCB0by5cbiAgICogQHBhcmFtIGJlaGF2aW9yIFRoZSBTY3JvbGxCZWhhdmlvciB0byB1c2Ugd2hlbiBzY3JvbGxpbmcuIERlZmF1bHQgaXMgYmVoYXZpb3IgaXMgYGF1dG9gLlxuICAgKi9cbiAgc2Nyb2xsVG9JbmRleChpbmRleDogbnVtYmVyLCAgYmVoYXZpb3I6IFNjcm9sbEJlaGF2aW9yID0gJ2F1dG8nKSB7XG4gICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kuc2Nyb2xsVG9JbmRleChpbmRleCwgYmVoYXZpb3IpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgc2Nyb2xsIG9mZnNldCBmcm9tIHRoZSBzdGFydCBvZiB0aGUgdmlld3BvcnQgKGluIHBpeGVscykuXG4gICAqIEBwYXJhbSBmcm9tIFRoZSBlZGdlIHRvIG1lYXN1cmUgdGhlIG9mZnNldCBmcm9tLiBEZWZhdWx0cyB0byAndG9wJyBpbiB2ZXJ0aWNhbCBtb2RlIGFuZCAnc3RhcnQnXG4gICAqICAgICBpbiBob3Jpem9udGFsIG1vZGUuXG4gICAqL1xuICBtZWFzdXJlU2Nyb2xsT2Zmc2V0KGZyb20/OiAndG9wJyB8ICdsZWZ0JyB8ICdyaWdodCcgfCAnYm90dG9tJyB8ICdzdGFydCcgfCAnZW5kJyk6IG51bWJlciB7XG4gICAgcmV0dXJuIHN1cGVyLm1lYXN1cmVTY3JvbGxPZmZzZXQoXG4gICAgICAgIGZyb20gPyBmcm9tIDogdGhpcy5vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnID8gJ3N0YXJ0JyA6ICd0b3AnKTtcbiAgfVxuXG4gIC8qKiBNZWFzdXJlIHRoZSBjb21iaW5lZCBzaXplIG9mIGFsbCBvZiB0aGUgcmVuZGVyZWQgaXRlbXMuICovXG4gIG1lYXN1cmVSZW5kZXJlZENvbnRlbnRTaXplKCk6IG51bWJlciB7XG4gICAgY29uc3QgY29udGVudEVsID0gdGhpcy5fY29udGVudFdyYXBwZXIubmF0aXZlRWxlbWVudDtcbiAgICByZXR1cm4gdGhpcy5vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnID8gY29udGVudEVsLm9mZnNldFdpZHRoIDogY29udGVudEVsLm9mZnNldEhlaWdodDtcbiAgfVxuXG4gIC8qKlxuICAgKiBNZWFzdXJlIHRoZSB0b3RhbCBjb21iaW5lZCBzaXplIG9mIHRoZSBnaXZlbiByYW5nZS4gVGhyb3dzIGlmIHRoZSByYW5nZSBpbmNsdWRlcyBpdGVtcyB0aGF0IGFyZVxuICAgKiBub3QgcmVuZGVyZWQuXG4gICAqL1xuICBtZWFzdXJlUmFuZ2VTaXplKHJhbmdlOiBMaXN0UmFuZ2UpOiBudW1iZXIge1xuICAgIGlmICghdGhpcy5fZm9yT2YpIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fZm9yT2YubWVhc3VyZVJhbmdlU2l6ZShyYW5nZSwgdGhpcy5vcmllbnRhdGlvbik7XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSB2aWV3cG9ydCBkaW1lbnNpb25zIGFuZCByZS1yZW5kZXIuICovXG4gIGNoZWNrVmlld3BvcnRTaXplKCkge1xuICAgIC8vIFRPRE86IENsZWFudXAgbGF0ZXIgd2hlbiBhZGQgbG9naWMgZm9yIGhhbmRsaW5nIGNvbnRlbnQgcmVzaXplXG4gICAgdGhpcy5fbWVhc3VyZVZpZXdwb3J0U2l6ZSgpO1xuICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5Lm9uRGF0YUxlbmd0aENoYW5nZWQoKTtcbiAgfVxuXG4gIC8qKiBNZWFzdXJlIHRoZSB2aWV3cG9ydCBzaXplLiAqL1xuICBwcml2YXRlIF9tZWFzdXJlVmlld3BvcnRTaXplKCkge1xuICAgIGNvbnN0IHZpZXdwb3J0RWwgPSB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcbiAgICB0aGlzLl92aWV3cG9ydFNpemUgPSB0aGlzLm9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcgP1xuICAgICAgICB2aWV3cG9ydEVsLmNsaWVudFdpZHRoIDogdmlld3BvcnRFbC5jbGllbnRIZWlnaHQ7XG4gIH1cblxuICAvKiogUXVldWUgdXAgY2hhbmdlIGRldGVjdGlvbiB0byBydW4uICovXG4gIHByaXZhdGUgX21hcmtDaGFuZ2VEZXRlY3Rpb25OZWVkZWQocnVuQWZ0ZXI/OiBGdW5jdGlvbikge1xuICAgIGlmIChydW5BZnRlcikge1xuICAgICAgdGhpcy5fcnVuQWZ0ZXJDaGFuZ2VEZXRlY3Rpb24ucHVzaChydW5BZnRlcik7XG4gICAgfVxuXG4gICAgLy8gVXNlIGEgUHJvbWlzZSB0byBiYXRjaCB0b2dldGhlciBjYWxscyB0byBgX2RvQ2hhbmdlRGV0ZWN0aW9uYC4gVGhpcyB3YXkgaWYgd2Ugc2V0IGEgYnVuY2ggb2ZcbiAgICAvLyBwcm9wZXJ0aWVzIHNlcXVlbnRpYWxseSB3ZSBvbmx5IGhhdmUgdG8gcnVuIGBfZG9DaGFuZ2VEZXRlY3Rpb25gIG9uY2UgYXQgdGhlIGVuZC5cbiAgICBpZiAoIXRoaXMuX2lzQ2hhbmdlRGV0ZWN0aW9uUGVuZGluZykge1xuICAgICAgdGhpcy5faXNDaGFuZ2VEZXRlY3Rpb25QZW5kaW5nID0gdHJ1ZTtcbiAgICAgIHRoaXMubmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLl9kb0NoYW5nZURldGVjdGlvbigpO1xuICAgICAgfSkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSdW4gY2hhbmdlIGRldGVjdGlvbi4gKi9cbiAgcHJpdmF0ZSBfZG9DaGFuZ2VEZXRlY3Rpb24oKSB7XG4gICAgdGhpcy5faXNDaGFuZ2VEZXRlY3Rpb25QZW5kaW5nID0gZmFsc2U7XG5cbiAgICAvLyBBcHBseSBjaGFuZ2VzIHRvIEFuZ3VsYXIgYmluZGluZ3MuIE5vdGU6IFdlIG11c3QgY2FsbCBgbWFya0ZvckNoZWNrYCB0byBydW4gY2hhbmdlIGRldGVjdGlvblxuICAgIC8vIGZyb20gdGhlIHJvb3QsIHNpbmNlIHRoZSByZXBlYXRlZCBpdGVtcyBhcmUgY29udGVudCBwcm9qZWN0ZWQgaW4uIENhbGxpbmcgYGRldGVjdENoYW5nZXNgXG4gICAgLy8gaW5zdGVhZCBkb2VzIG5vdCBwcm9wZXJseSBjaGVjayB0aGUgcHJvamVjdGVkIGNvbnRlbnQuXG4gICAgdGhpcy5uZ1pvbmUucnVuKCgpID0+IHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpKTtcbiAgICAvLyBBcHBseSB0aGUgY29udGVudCB0cmFuc2Zvcm0uIFRoZSB0cmFuc2Zvcm0gY2FuJ3QgYmUgc2V0IHZpYSBhbiBBbmd1bGFyIGJpbmRpbmcgYmVjYXVzZVxuICAgIC8vIGJ5cGFzc1NlY3VyaXR5VHJ1c3RTdHlsZSBpcyBiYW5uZWQgaW4gR29vZ2xlLiBIb3dldmVyIHRoZSB2YWx1ZSBpcyBzYWZlLCBpdCdzIGNvbXBvc2VkIG9mXG4gICAgLy8gc3RyaW5nIGxpdGVyYWxzLCBhIHZhcmlhYmxlIHRoYXQgY2FuIG9ubHkgYmUgJ1gnIG9yICdZJywgYW5kIHVzZXIgaW5wdXQgdGhhdCBpcyBydW4gdGhyb3VnaFxuICAgIC8vIHRoZSBgTnVtYmVyYCBmdW5jdGlvbiBmaXJzdCB0byBjb2VyY2UgaXQgdG8gYSBudW1lcmljIHZhbHVlLlxuICAgIHRoaXMuX2NvbnRlbnRXcmFwcGVyLm5hdGl2ZUVsZW1lbnQuc3R5bGUudHJhbnNmb3JtID0gdGhpcy5fcmVuZGVyZWRDb250ZW50VHJhbnNmb3JtO1xuXG4gICAgY29uc3QgcnVuQWZ0ZXJDaGFuZ2VEZXRlY3Rpb24gPSB0aGlzLl9ydW5BZnRlckNoYW5nZURldGVjdGlvbjtcbiAgICB0aGlzLl9ydW5BZnRlckNoYW5nZURldGVjdGlvbiA9IFtdO1xuICAgIGZvciAoY29uc3QgZm4gb2YgcnVuQWZ0ZXJDaGFuZ2VEZXRlY3Rpb24pIHtcbiAgICAgIGZuKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENhbGN1bGF0ZXMgdGhlIGBzdHlsZS53aWR0aGAgYW5kIGBzdHlsZS5oZWlnaHRgIGZvciB0aGUgc3BhY2VyIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX2NhbGN1bGF0ZVNwYWNlclNpemUoKSB7XG4gICAgdGhpcy5fdG90YWxDb250ZW50SGVpZ2h0ID1cbiAgICAgICAgdGhpcy5vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnID8gJycgOiBgJHt0aGlzLl90b3RhbENvbnRlbnRTaXplfXB4YDtcbiAgICB0aGlzLl90b3RhbENvbnRlbnRXaWR0aCA9XG4gICAgICAgIHRoaXMub3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJyA/IGAke3RoaXMuX3RvdGFsQ29udGVudFNpemV9cHhgIDogJyc7XG4gIH1cbn1cbiJdfQ==