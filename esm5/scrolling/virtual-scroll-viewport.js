/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __extends, __values } from "tslib";
import { Directionality } from '@angular/cdk/bidi';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, Input, NgZone, Optional, Output, ViewChild, ViewEncapsulation, } from '@angular/core';
import { animationFrameScheduler, asapScheduler, Observable, Subject } from 'rxjs';
import { auditTime, startWith, takeUntil } from 'rxjs/operators';
import { ScrollDispatcher } from './scroll-dispatcher';
import { CdkScrollable } from './scrollable';
import { VIRTUAL_SCROLL_STRATEGY } from './virtual-scroll-strategy';
/** Checks if the given ranges are equal. */
function rangesEqual(r1, r2) {
    return r1.start == r2.start && r1.end == r2.end;
}
/**
 * Scheduler to be used for scroll events. Needs to fall back to
 * something that doesn't rely on requestAnimationFrame on environments
 * that don't support it (e.g. server-side rendering).
 */
var SCROLL_SCHEDULER = typeof requestAnimationFrame !== 'undefined' ? animationFrameScheduler : asapScheduler;
/** A viewport that virtualizes its scrolling with the help of `CdkVirtualForOf`. */
var CdkVirtualScrollViewport = /** @class */ (function (_super) {
    __extends(CdkVirtualScrollViewport, _super);
    function CdkVirtualScrollViewport(elementRef, _changeDetectorRef, ngZone, _scrollStrategy, dir, scrollDispatcher) {
        var _this = _super.call(this, elementRef, scrollDispatcher, ngZone, dir) || this;
        _this.elementRef = elementRef;
        _this._changeDetectorRef = _changeDetectorRef;
        _this._scrollStrategy = _scrollStrategy;
        /** Emits when the viewport is detached from a CdkVirtualForOf. */
        _this._detachedSubject = new Subject();
        /** Emits when the rendered range changes. */
        _this._renderedRangeSubject = new Subject();
        _this._orientation = 'vertical';
        // Note: we don't use the typical EventEmitter here because we need to subscribe to the scroll
        // strategy lazily (i.e. only if the user is actually listening to the events). We do this because
        // depending on how the strategy calculates the scrolled index, it may come at a cost to
        // performance.
        /** Emits when the index of the first element visible in the viewport changes. */
        _this.scrolledIndexChange = new Observable(function (observer) {
            return _this._scrollStrategy.scrolledIndexChange.subscribe(function (index) {
                return Promise.resolve().then(function () { return _this.ngZone.run(function () { return observer.next(index); }); });
            });
        });
        /** A stream that emits whenever the rendered range changes. */
        _this.renderedRangeStream = _this._renderedRangeSubject.asObservable();
        /**
         * The total size of all content (in pixels), including content that is not currently rendered.
         */
        _this._totalContentSize = 0;
        /** A string representing the `style.width` property value to be used for the spacer element. */
        _this._totalContentWidth = '';
        /** A string representing the `style.height` property value to be used for the spacer element. */
        _this._totalContentHeight = '';
        /** The currently rendered range of indices. */
        _this._renderedRange = { start: 0, end: 0 };
        /** The length of the data bound to this viewport (in number of items). */
        _this._dataLength = 0;
        /** The size of the viewport (in pixels). */
        _this._viewportSize = 0;
        /** The last rendered content offset that was set. */
        _this._renderedContentOffset = 0;
        /**
         * Whether the last rendered content offset was to the end of the content (and therefore needs to
         * be rewritten as an offset to the start of the content).
         */
        _this._renderedContentOffsetNeedsRewrite = false;
        /** Whether there is a pending change detection cycle. */
        _this._isChangeDetectionPending = false;
        /** A list of functions to run after the next change detection cycle. */
        _this._runAfterChangeDetection = [];
        if (!_scrollStrategy) {
            throw Error('Error: cdk-virtual-scroll-viewport requires the "itemSize" property to be set.');
        }
        return _this;
    }
    Object.defineProperty(CdkVirtualScrollViewport.prototype, "orientation", {
        /** The direction the viewport scrolls. */
        get: function () {
            return this._orientation;
        },
        set: function (orientation) {
            if (this._orientation !== orientation) {
                this._orientation = orientation;
                this._calculateSpacerSize();
            }
        },
        enumerable: true,
        configurable: true
    });
    CdkVirtualScrollViewport.prototype.ngOnInit = function () {
        var _this = this;
        _super.prototype.ngOnInit.call(this);
        // It's still too early to measure the viewport at this point. Deferring with a promise allows
        // the Viewport to be rendered with the correct size before we measure. We run this outside the
        // zone to avoid causing more change detection cycles. We handle the change detection loop
        // ourselves instead.
        this.ngZone.runOutsideAngular(function () { return Promise.resolve().then(function () {
            _this._measureViewportSize();
            _this._scrollStrategy.attach(_this);
            _this.elementScrolled()
                .pipe(
            // Start off with a fake scroll event so we properly detect our initial position.
            startWith(null), 
            // Collect multiple events into one until the next animation frame. This way if
            // there are multiple scroll events in the same frame we only need to recheck
            // our layout once.
            auditTime(0, SCROLL_SCHEDULER))
                .subscribe(function () { return _this._scrollStrategy.onContentScrolled(); });
            _this._markChangeDetectionNeeded();
        }); });
    };
    CdkVirtualScrollViewport.prototype.ngOnDestroy = function () {
        this.detach();
        this._scrollStrategy.detach();
        // Complete all subjects
        this._renderedRangeSubject.complete();
        this._detachedSubject.complete();
        _super.prototype.ngOnDestroy.call(this);
    };
    /** Attaches a `CdkVirtualForOf` to this viewport. */
    CdkVirtualScrollViewport.prototype.attach = function (forOf) {
        var _this = this;
        if (this._forOf) {
            throw Error('CdkVirtualScrollViewport is already attached.');
        }
        // Subscribe to the data stream of the CdkVirtualForOf to keep track of when the data length
        // changes. Run outside the zone to avoid triggering change detection, since we're managing the
        // change detection loop ourselves.
        this.ngZone.runOutsideAngular(function () {
            _this._forOf = forOf;
            _this._forOf.dataStream.pipe(takeUntil(_this._detachedSubject)).subscribe(function (data) {
                var newLength = data.length;
                if (newLength !== _this._dataLength) {
                    _this._dataLength = newLength;
                    _this._scrollStrategy.onDataLengthChanged();
                }
                _this._doChangeDetection();
            });
        });
    };
    /** Detaches the current `CdkVirtualForOf`. */
    CdkVirtualScrollViewport.prototype.detach = function () {
        this._forOf = null;
        this._detachedSubject.next();
    };
    /** Gets the length of the data bound to this viewport (in number of items). */
    CdkVirtualScrollViewport.prototype.getDataLength = function () {
        return this._dataLength;
    };
    /** Gets the size of the viewport (in pixels). */
    CdkVirtualScrollViewport.prototype.getViewportSize = function () {
        return this._viewportSize;
    };
    // TODO(mmalerba): This is technically out of sync with what's really rendered until a render
    // cycle happens. I'm being careful to only call it after the render cycle is complete and before
    // setting it to something else, but its error prone and should probably be split into
    // `pendingRange` and `renderedRange`, the latter reflecting whats actually in the DOM.
    /** Get the current rendered range of items. */
    CdkVirtualScrollViewport.prototype.getRenderedRange = function () {
        return this._renderedRange;
    };
    /**
     * Sets the total size of all content (in pixels), including content that is not currently
     * rendered.
     */
    CdkVirtualScrollViewport.prototype.setTotalContentSize = function (size) {
        if (this._totalContentSize !== size) {
            this._totalContentSize = size;
            this._calculateSpacerSize();
            this._markChangeDetectionNeeded();
        }
    };
    /** Sets the currently rendered range of indices. */
    CdkVirtualScrollViewport.prototype.setRenderedRange = function (range) {
        var _this = this;
        if (!rangesEqual(this._renderedRange, range)) {
            this._renderedRangeSubject.next(this._renderedRange = range);
            this._markChangeDetectionNeeded(function () { return _this._scrollStrategy.onContentRendered(); });
        }
    };
    /**
     * Gets the offset from the start of the viewport to the start of the rendered data (in pixels).
     */
    CdkVirtualScrollViewport.prototype.getOffsetToRenderedContentStart = function () {
        return this._renderedContentOffsetNeedsRewrite ? null : this._renderedContentOffset;
    };
    /**
     * Sets the offset from the start of the viewport to either the start or end of the rendered data
     * (in pixels).
     */
    CdkVirtualScrollViewport.prototype.setRenderedContentOffset = function (offset, to) {
        var _this = this;
        if (to === void 0) { to = 'to-start'; }
        // For a horizontal viewport in a right-to-left language we need to translate along the x-axis
        // in the negative direction.
        var isRtl = this.dir && this.dir.value == 'rtl';
        var isHorizontal = this.orientation == 'horizontal';
        var axis = isHorizontal ? 'X' : 'Y';
        var axisDirection = isHorizontal && isRtl ? -1 : 1;
        var transform = "translate" + axis + "(" + Number(axisDirection * offset) + "px)";
        this._renderedContentOffset = offset;
        if (to === 'to-end') {
            transform += " translate" + axis + "(-100%)";
            // The viewport should rewrite this as a `to-start` offset on the next render cycle. Otherwise
            // elements will appear to expand in the wrong direction (e.g. `mat-expansion-panel` would
            // expand upward).
            this._renderedContentOffsetNeedsRewrite = true;
        }
        if (this._renderedContentTransform != transform) {
            // We know this value is safe because we parse `offset` with `Number()` before passing it
            // into the string.
            this._renderedContentTransform = transform;
            this._markChangeDetectionNeeded(function () {
                if (_this._renderedContentOffsetNeedsRewrite) {
                    _this._renderedContentOffset -= _this.measureRenderedContentSize();
                    _this._renderedContentOffsetNeedsRewrite = false;
                    _this.setRenderedContentOffset(_this._renderedContentOffset);
                }
                else {
                    _this._scrollStrategy.onRenderedOffsetChanged();
                }
            });
        }
    };
    /**
     * Scrolls to the given offset from the start of the viewport. Please note that this is not always
     * the same as setting `scrollTop` or `scrollLeft`. In a horizontal viewport with right-to-left
     * direction, this would be the equivalent of setting a fictional `scrollRight` property.
     * @param offset The offset to scroll to.
     * @param behavior The ScrollBehavior to use when scrolling. Default is behavior is `auto`.
     */
    CdkVirtualScrollViewport.prototype.scrollToOffset = function (offset, behavior) {
        if (behavior === void 0) { behavior = 'auto'; }
        var options = { behavior: behavior };
        if (this.orientation === 'horizontal') {
            options.start = offset;
        }
        else {
            options.top = offset;
        }
        this.scrollTo(options);
    };
    /**
     * Scrolls to the offset for the given index.
     * @param index The index of the element to scroll to.
     * @param behavior The ScrollBehavior to use when scrolling. Default is behavior is `auto`.
     */
    CdkVirtualScrollViewport.prototype.scrollToIndex = function (index, behavior) {
        if (behavior === void 0) { behavior = 'auto'; }
        this._scrollStrategy.scrollToIndex(index, behavior);
    };
    /**
     * Gets the current scroll offset from the start of the viewport (in pixels).
     * @param from The edge to measure the offset from. Defaults to 'top' in vertical mode and 'start'
     *     in horizontal mode.
     */
    CdkVirtualScrollViewport.prototype.measureScrollOffset = function (from) {
        return _super.prototype.measureScrollOffset.call(this, from ? from : this.orientation === 'horizontal' ? 'start' : 'top');
    };
    /** Measure the combined size of all of the rendered items. */
    CdkVirtualScrollViewport.prototype.measureRenderedContentSize = function () {
        var contentEl = this._contentWrapper.nativeElement;
        return this.orientation === 'horizontal' ? contentEl.offsetWidth : contentEl.offsetHeight;
    };
    /**
     * Measure the total combined size of the given range. Throws if the range includes items that are
     * not rendered.
     */
    CdkVirtualScrollViewport.prototype.measureRangeSize = function (range) {
        if (!this._forOf) {
            return 0;
        }
        return this._forOf.measureRangeSize(range, this.orientation);
    };
    /** Update the viewport dimensions and re-render. */
    CdkVirtualScrollViewport.prototype.checkViewportSize = function () {
        // TODO: Cleanup later when add logic for handling content resize
        this._measureViewportSize();
        this._scrollStrategy.onDataLengthChanged();
    };
    /** Measure the viewport size. */
    CdkVirtualScrollViewport.prototype._measureViewportSize = function () {
        var viewportEl = this.elementRef.nativeElement;
        this._viewportSize = this.orientation === 'horizontal' ?
            viewportEl.clientWidth : viewportEl.clientHeight;
    };
    /** Queue up change detection to run. */
    CdkVirtualScrollViewport.prototype._markChangeDetectionNeeded = function (runAfter) {
        var _this = this;
        if (runAfter) {
            this._runAfterChangeDetection.push(runAfter);
        }
        // Use a Promise to batch together calls to `_doChangeDetection`. This way if we set a bunch of
        // properties sequentially we only have to run `_doChangeDetection` once at the end.
        if (!this._isChangeDetectionPending) {
            this._isChangeDetectionPending = true;
            this.ngZone.runOutsideAngular(function () { return Promise.resolve().then(function () {
                _this._doChangeDetection();
            }); });
        }
    };
    /** Run change detection. */
    CdkVirtualScrollViewport.prototype._doChangeDetection = function () {
        var e_1, _a;
        var _this = this;
        this._isChangeDetectionPending = false;
        // Apply changes to Angular bindings. Note: We must call `markForCheck` to run change detection
        // from the root, since the repeated items are content projected in. Calling `detectChanges`
        // instead does not properly check the projected content.
        this.ngZone.run(function () { return _this._changeDetectorRef.markForCheck(); });
        // Apply the content transform. The transform can't be set via an Angular binding because
        // bypassSecurityTrustStyle is banned in Google. However the value is safe, it's composed of
        // string literals, a variable that can only be 'X' or 'Y', and user input that is run through
        // the `Number` function first to coerce it to a numeric value.
        this._contentWrapper.nativeElement.style.transform = this._renderedContentTransform;
        var runAfterChangeDetection = this._runAfterChangeDetection;
        this._runAfterChangeDetection = [];
        try {
            for (var runAfterChangeDetection_1 = __values(runAfterChangeDetection), runAfterChangeDetection_1_1 = runAfterChangeDetection_1.next(); !runAfterChangeDetection_1_1.done; runAfterChangeDetection_1_1 = runAfterChangeDetection_1.next()) {
                var fn = runAfterChangeDetection_1_1.value;
                fn();
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (runAfterChangeDetection_1_1 && !runAfterChangeDetection_1_1.done && (_a = runAfterChangeDetection_1.return)) _a.call(runAfterChangeDetection_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    /** Calculates the `style.width` and `style.height` for the spacer element. */
    CdkVirtualScrollViewport.prototype._calculateSpacerSize = function () {
        this._totalContentHeight =
            this.orientation === 'horizontal' ? '' : this._totalContentSize + "px";
        this._totalContentWidth =
            this.orientation === 'horizontal' ? this._totalContentSize + "px" : '';
    };
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
    CdkVirtualScrollViewport.ctorParameters = function () { return [
        { type: ElementRef },
        { type: ChangeDetectorRef },
        { type: NgZone },
        { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [VIRTUAL_SCROLL_STRATEGY,] }] },
        { type: Directionality, decorators: [{ type: Optional }] },
        { type: ScrollDispatcher }
    ]; };
    CdkVirtualScrollViewport.propDecorators = {
        orientation: [{ type: Input }],
        scrolledIndexChange: [{ type: Output }],
        _contentWrapper: [{ type: ViewChild, args: ['contentWrapper', { static: true },] }]
    };
    return CdkVirtualScrollViewport;
}(CdkScrollable));
export { CdkVirtualScrollViewport };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1zY3JvbGwtdmlld3BvcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy92aXJ0dWFsLXNjcm9sbC12aWV3cG9ydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRWpELE9BQU8sRUFDTCx1QkFBdUIsRUFDdkIsaUJBQWlCLEVBQ2pCLFNBQVMsRUFDVCxVQUFVLEVBQ1YsTUFBTSxFQUNOLEtBQUssRUFDTCxNQUFNLEVBR04sUUFBUSxFQUNSLE1BQU0sRUFDTixTQUFTLEVBQ1QsaUJBQWlCLEdBQ2xCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBVyxNQUFNLE1BQU0sQ0FBQztBQUMzRixPQUFPLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUMvRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsYUFBYSxFQUEwQixNQUFNLGNBQWMsQ0FBQztBQUVwRSxPQUFPLEVBQUMsdUJBQXVCLEVBQXdCLE1BQU0sMkJBQTJCLENBQUM7QUFHekYsNENBQTRDO0FBQzVDLFNBQVMsV0FBVyxDQUFDLEVBQWEsRUFBRSxFQUFhO0lBQy9DLE9BQU8sRUFBRSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQztBQUNsRCxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILElBQU0sZ0JBQWdCLEdBQ2xCLE9BQU8scUJBQXFCLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMs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LFFBQVEsWUFBSSxNQUFNLFNBQUMsdUJBQXVCO2dCQTVJakQsY0FBYyx1QkE4SVAsUUFBUTtnQkEzSGYsZ0JBQWdCOzs7OEJBOENyQixLQUFLO3NDQWlCTCxNQUFNO2tDQU1OLFNBQVMsU0FBQyxnQkFBZ0IsRUFBRSxFQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUM7O0lBaVU3QywrQkFBQztDQUFBLEFBalhELENBaUI4QyxhQUFhLEdBZ1cxRDtTQWhXWSx3QkFBd0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtMaXN0UmFuZ2V9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2xsZWN0aW9ucyc7XG5pbXBvcnQge1xuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIENvbXBvbmVudCxcbiAgRWxlbWVudFJlZixcbiAgSW5qZWN0LFxuICBJbnB1dCxcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIE9uSW5pdCxcbiAgT3B0aW9uYWwsXG4gIE91dHB1dCxcbiAgVmlld0NoaWxkLFxuICBWaWV3RW5jYXBzdWxhdGlvbixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge2FuaW1hdGlvbkZyYW1lU2NoZWR1bGVyLCBhc2FwU2NoZWR1bGVyLCBPYnNlcnZhYmxlLCBTdWJqZWN0LCBPYnNlcnZlcn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2F1ZGl0VGltZSwgc3RhcnRXaXRoLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7U2Nyb2xsRGlzcGF0Y2hlcn0gZnJvbSAnLi9zY3JvbGwtZGlzcGF0Y2hlcic7XG5pbXBvcnQge0Nka1Njcm9sbGFibGUsIEV4dGVuZGVkU2Nyb2xsVG9PcHRpb25zfSBmcm9tICcuL3Njcm9sbGFibGUnO1xuaW1wb3J0IHtDZGtWaXJ0dWFsRm9yT2Z9IGZyb20gJy4vdmlydHVhbC1mb3Itb2YnO1xuaW1wb3J0IHtWSVJUVUFMX1NDUk9MTF9TVFJBVEVHWSwgVmlydHVhbFNjcm9sbFN0cmF0ZWd5fSBmcm9tICcuL3ZpcnR1YWwtc2Nyb2xsLXN0cmF0ZWd5JztcblxuXG4vKiogQ2hlY2tzIGlmIHRoZSBnaXZlbiByYW5nZXMgYXJlIGVxdWFsLiAqL1xuZnVuY3Rpb24gcmFuZ2VzRXF1YWwocjE6IExpc3RSYW5nZSwgcjI6IExpc3RSYW5nZSk6IGJvb2xlYW4ge1xuICByZXR1cm4gcjEuc3RhcnQgPT0gcjIuc3RhcnQgJiYgcjEuZW5kID09IHIyLmVuZDtcbn1cblxuLyoqXG4gKiBTY2hlZHVsZXIgdG8gYmUgdXNlZCBmb3Igc2Nyb2xsIGV2ZW50cy4gTmVlZHMgdG8gZmFsbCBiYWNrIHRvXG4gKiBzb21ldGhpbmcgdGhhdCBkb2Vzbid0IHJlbHkgb24gcmVxdWVzdEFuaW1hdGlvbkZyYW1lIG9uIGVudmlyb25tZW50c1xuICogdGhhdCBkb24ndCBzdXBwb3J0IGl0IChlLmcuIHNlcnZlci1zaWRlIHJlbmRlcmluZykuXG4gKi9cbmNvbnN0IFNDUk9MTF9TQ0hFRFVMRVIgPVxuICAgIHR5cGVvZiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgIT09ICd1bmRlZmluZWQnID8gYW5pbWF0aW9uRnJhbWVTY2hlZHVsZXIgOiBhc2FwU2NoZWR1bGVyO1xuXG5cbi8qKiBBIHZpZXdwb3J0IHRoYXQgdmlydHVhbGl6ZXMgaXRzIHNjcm9sbGluZyB3aXRoIHRoZSBoZWxwIG9mIGBDZGtWaXJ0dWFsRm9yT2ZgLiAqL1xuQENvbXBvbmVudCh7XG4gIG1vZHVsZUlkOiBtb2R1bGUuaWQsXG4gIHNlbGVjdG9yOiAnY2RrLXZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0JyxcbiAgdGVtcGxhdGVVcmw6ICd2aXJ0dWFsLXNjcm9sbC12aWV3cG9ydC5odG1sJyxcbiAgc3R5bGVVcmxzOiBbJ3ZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0LmNzcyddLFxuICBob3N0OiB7XG4gICAgJ2NsYXNzJzogJ2Nkay12aXJ0dWFsLXNjcm9sbC12aWV3cG9ydCcsXG4gICAgJ1tjbGFzcy5jZGstdmlydHVhbC1zY3JvbGwtb3JpZW50YXRpb24taG9yaXpvbnRhbF0nOiAnb3JpZW50YXRpb24gPT09IFwiaG9yaXpvbnRhbFwiJyxcbiAgICAnW2NsYXNzLmNkay12aXJ0dWFsLXNjcm9sbC1vcmllbnRhdGlvbi12ZXJ0aWNhbF0nOiAnb3JpZW50YXRpb24gIT09IFwiaG9yaXpvbnRhbFwiJyxcbiAgfSxcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG4gIHByb3ZpZGVyczogW3tcbiAgICBwcm92aWRlOiBDZGtTY3JvbGxhYmxlLFxuICAgIHVzZUV4aXN0aW5nOiBDZGtWaXJ0dWFsU2Nyb2xsVmlld3BvcnQsXG4gIH1dXG59KVxuZXhwb3J0IGNsYXNzIENka1ZpcnR1YWxTY3JvbGxWaWV3cG9ydCBleHRlbmRzIENka1Njcm9sbGFibGUgaW1wbGVtZW50cyBPbkluaXQsIE9uRGVzdHJveSB7XG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB2aWV3cG9ydCBpcyBkZXRhY2hlZCBmcm9tIGEgQ2RrVmlydHVhbEZvck9mLiAqL1xuICBwcml2YXRlIF9kZXRhY2hlZFN1YmplY3QgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSByZW5kZXJlZCByYW5nZSBjaGFuZ2VzLiAqL1xuICBwcml2YXRlIF9yZW5kZXJlZFJhbmdlU3ViamVjdCA9IG5ldyBTdWJqZWN0PExpc3RSYW5nZT4oKTtcblxuICAvKiogVGhlIGRpcmVjdGlvbiB0aGUgdmlld3BvcnQgc2Nyb2xscy4gKi9cbiAgQElucHV0KClcbiAgZ2V0IG9yaWVudGF0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9vcmllbnRhdGlvbjtcbiAgfVxuICBzZXQgb3JpZW50YXRpb24ob3JpZW50YXRpb246ICdob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCcpIHtcbiAgICBpZiAodGhpcy5fb3JpZW50YXRpb24gIT09IG9yaWVudGF0aW9uKSB7XG4gICAgICB0aGlzLl9vcmllbnRhdGlvbiA9IG9yaWVudGF0aW9uO1xuICAgICAgdGhpcy5fY2FsY3VsYXRlU3BhY2VyU2l6ZSgpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIF9vcmllbnRhdGlvbjogJ2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJyA9ICd2ZXJ0aWNhbCc7XG5cbiAgLy8gTm90ZTogd2UgZG9uJ3QgdXNlIHRoZSB0eXBpY2FsIEV2ZW50RW1pdHRlciBoZXJlIGJlY2F1c2Ugd2UgbmVlZCB0byBzdWJzY3JpYmUgdG8gdGhlIHNjcm9sbFxuICAvLyBzdHJhdGVneSBsYXppbHkgKGkuZS4gb25seSBpZiB0aGUgdXNlciBpcyBhY3R1YWxseSBsaXN0ZW5pbmcgdG8gdGhlIGV2ZW50cykuIFdlIGRvIHRoaXMgYmVjYXVzZVxuICAvLyBkZXBlbmRpbmcgb24gaG93IHRoZSBzdHJhdGVneSBjYWxjdWxhdGVzIHRoZSBzY3JvbGxlZCBpbmRleCwgaXQgbWF5IGNvbWUgYXQgYSBjb3N0IHRvXG4gIC8vIHBlcmZvcm1hbmNlLlxuICAvKiogRW1pdHMgd2hlbiB0aGUgaW5kZXggb2YgdGhlIGZpcnN0IGVsZW1lbnQgdmlzaWJsZSBpbiB0aGUgdmlld3BvcnQgY2hhbmdlcy4gKi9cbiAgQE91dHB1dCgpIHNjcm9sbGVkSW5kZXhDaGFuZ2U6IE9ic2VydmFibGU8bnVtYmVyPiA9XG4gICAgICBuZXcgT2JzZXJ2YWJsZSgob2JzZXJ2ZXI6IE9ic2VydmVyPG51bWJlcj4pID0+XG4gICAgICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5LnNjcm9sbGVkSW5kZXhDaGFuZ2Uuc3Vic2NyaWJlKGluZGV4ID0+XG4gICAgICAgICAgICBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHRoaXMubmdab25lLnJ1bigoKSA9PiBvYnNlcnZlci5uZXh0KGluZGV4KSkpKSk7XG5cbiAgLyoqIFRoZSBlbGVtZW50IHRoYXQgd3JhcHMgdGhlIHJlbmRlcmVkIGNvbnRlbnQuICovXG4gIEBWaWV3Q2hpbGQoJ2NvbnRlbnRXcmFwcGVyJywge3N0YXRpYzogdHJ1ZX0pIF9jb250ZW50V3JhcHBlcjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD47XG5cbiAgLyoqIEEgc3RyZWFtIHRoYXQgZW1pdHMgd2hlbmV2ZXIgdGhlIHJlbmRlcmVkIHJhbmdlIGNoYW5nZXMuICovXG4gIHJlbmRlcmVkUmFuZ2VTdHJlYW06IE9ic2VydmFibGU8TGlzdFJhbmdlPiA9IHRoaXMuX3JlbmRlcmVkUmFuZ2VTdWJqZWN0LmFzT2JzZXJ2YWJsZSgpO1xuXG4gIC8qKlxuICAgKiBUaGUgdG90YWwgc2l6ZSBvZiBhbGwgY29udGVudCAoaW4gcGl4ZWxzKSwgaW5jbHVkaW5nIGNvbnRlbnQgdGhhdCBpcyBub3QgY3VycmVudGx5IHJlbmRlcmVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfdG90YWxDb250ZW50U2l6ZSA9IDA7XG5cbiAgLyoqIEEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgYHN0eWxlLndpZHRoYCBwcm9wZXJ0eSB2YWx1ZSB0byBiZSB1c2VkIGZvciB0aGUgc3BhY2VyIGVsZW1lbnQuICovXG4gIF90b3RhbENvbnRlbnRXaWR0aCA9ICcnO1xuXG4gIC8qKiBBIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIGBzdHlsZS5oZWlnaHRgIHByb3BlcnR5IHZhbHVlIHRvIGJlIHVzZWQgZm9yIHRoZSBzcGFjZXIgZWxlbWVudC4gKi9cbiAgX3RvdGFsQ29udGVudEhlaWdodCA9ICcnO1xuXG4gIC8qKlxuICAgKiBUaGUgQ1NTIHRyYW5zZm9ybSBhcHBsaWVkIHRvIHRoZSByZW5kZXJlZCBzdWJzZXQgb2YgaXRlbXMgc28gdGhhdCB0aGV5IGFwcGVhciB3aXRoaW4gdGhlIGJvdW5kc1xuICAgKiBvZiB0aGUgdmlzaWJsZSB2aWV3cG9ydC5cbiAgICovXG4gIHByaXZhdGUgX3JlbmRlcmVkQ29udGVudFRyYW5zZm9ybTogc3RyaW5nO1xuXG4gIC8qKiBUaGUgY3VycmVudGx5IHJlbmRlcmVkIHJhbmdlIG9mIGluZGljZXMuICovXG4gIHByaXZhdGUgX3JlbmRlcmVkUmFuZ2U6IExpc3RSYW5nZSA9IHtzdGFydDogMCwgZW5kOiAwfTtcblxuICAvKiogVGhlIGxlbmd0aCBvZiB0aGUgZGF0YSBib3VuZCB0byB0aGlzIHZpZXdwb3J0IChpbiBudW1iZXIgb2YgaXRlbXMpLiAqL1xuICBwcml2YXRlIF9kYXRhTGVuZ3RoID0gMDtcblxuICAvKiogVGhlIHNpemUgb2YgdGhlIHZpZXdwb3J0IChpbiBwaXhlbHMpLiAqL1xuICBwcml2YXRlIF92aWV3cG9ydFNpemUgPSAwO1xuXG4gIC8qKiB0aGUgY3VycmVudGx5IGF0dGFjaGVkIENka1ZpcnR1YWxGb3JPZi4gKi9cbiAgcHJpdmF0ZSBfZm9yT2Y6IENka1ZpcnR1YWxGb3JPZjxhbnk+IHwgbnVsbDtcblxuICAvKiogVGhlIGxhc3QgcmVuZGVyZWQgY29udGVudCBvZmZzZXQgdGhhdCB3YXMgc2V0LiAqL1xuICBwcml2YXRlIF9yZW5kZXJlZENvbnRlbnRPZmZzZXQgPSAwO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBsYXN0IHJlbmRlcmVkIGNvbnRlbnQgb2Zmc2V0IHdhcyB0byB0aGUgZW5kIG9mIHRoZSBjb250ZW50IChhbmQgdGhlcmVmb3JlIG5lZWRzIHRvXG4gICAqIGJlIHJld3JpdHRlbiBhcyBhbiBvZmZzZXQgdG8gdGhlIHN0YXJ0IG9mIHRoZSBjb250ZW50KS5cbiAgICovXG4gIHByaXZhdGUgX3JlbmRlcmVkQ29udGVudE9mZnNldE5lZWRzUmV3cml0ZSA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIHRoZXJlIGlzIGEgcGVuZGluZyBjaGFuZ2UgZGV0ZWN0aW9uIGN5Y2xlLiAqL1xuICBwcml2YXRlIF9pc0NoYW5nZURldGVjdGlvblBlbmRpbmcgPSBmYWxzZTtcblxuICAvKiogQSBsaXN0IG9mIGZ1bmN0aW9ucyB0byBydW4gYWZ0ZXIgdGhlIG5leHQgY2hhbmdlIGRldGVjdGlvbiBjeWNsZS4gKi9cbiAgcHJpdmF0ZSBfcnVuQWZ0ZXJDaGFuZ2VEZXRlY3Rpb246IEZ1bmN0aW9uW10gPSBbXTtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgICAgICAgICAgIHByaXZhdGUgX2NoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICAgICAgICAgICAgbmdab25lOiBOZ1pvbmUsXG4gICAgICAgICAgICAgIEBPcHRpb25hbCgpIEBJbmplY3QoVklSVFVBTF9TQ1JPTExfU1RSQVRFR1kpXG4gICAgICAgICAgICAgICAgICBwcml2YXRlIF9zY3JvbGxTdHJhdGVneTogVmlydHVhbFNjcm9sbFN0cmF0ZWd5LFxuICAgICAgICAgICAgICBAT3B0aW9uYWwoKSBkaXI6IERpcmVjdGlvbmFsaXR5LFxuICAgICAgICAgICAgICBzY3JvbGxEaXNwYXRjaGVyOiBTY3JvbGxEaXNwYXRjaGVyKSB7XG4gICAgc3VwZXIoZWxlbWVudFJlZiwgc2Nyb2xsRGlzcGF0Y2hlciwgbmdab25lLCBkaXIpO1xuXG4gICAgaWYgKCFfc2Nyb2xsU3RyYXRlZ3kpIHtcbiAgICAgIHRocm93IEVycm9yKCdFcnJvcjogY2RrLXZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0IHJlcXVpcmVzIHRoZSBcIml0ZW1TaXplXCIgcHJvcGVydHkgdG8gYmUgc2V0LicpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25Jbml0KCkge1xuICAgIHN1cGVyLm5nT25Jbml0KCk7XG5cbiAgICAvLyBJdCdzIHN0aWxsIHRvbyBlYXJseSB0byBtZWFzdXJlIHRoZSB2aWV3cG9ydCBhdCB0aGlzIHBvaW50LiBEZWZlcnJpbmcgd2l0aCBhIHByb21pc2UgYWxsb3dzXG4gICAgLy8gdGhlIFZpZXdwb3J0IHRvIGJlIHJlbmRlcmVkIHdpdGggdGhlIGNvcnJlY3Qgc2l6ZSBiZWZvcmUgd2UgbWVhc3VyZS4gV2UgcnVuIHRoaXMgb3V0c2lkZSB0aGVcbiAgICAvLyB6b25lIHRvIGF2b2lkIGNhdXNpbmcgbW9yZSBjaGFuZ2UgZGV0ZWN0aW9uIGN5Y2xlcy4gV2UgaGFuZGxlIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIGxvb3BcbiAgICAvLyBvdXJzZWx2ZXMgaW5zdGVhZC5cbiAgICB0aGlzLm5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuX21lYXN1cmVWaWV3cG9ydFNpemUoKTtcbiAgICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5LmF0dGFjaCh0aGlzKTtcblxuICAgICAgdGhpcy5lbGVtZW50U2Nyb2xsZWQoKVxuICAgICAgICAgIC5waXBlKFxuICAgICAgICAgICAgICAvLyBTdGFydCBvZmYgd2l0aCBhIGZha2Ugc2Nyb2xsIGV2ZW50IHNvIHdlIHByb3Blcmx5IGRldGVjdCBvdXIgaW5pdGlhbCBwb3NpdGlvbi5cbiAgICAgICAgICAgICAgc3RhcnRXaXRoKG51bGwhKSxcbiAgICAgICAgICAgICAgLy8gQ29sbGVjdCBtdWx0aXBsZSBldmVudHMgaW50byBvbmUgdW50aWwgdGhlIG5leHQgYW5pbWF0aW9uIGZyYW1lLiBUaGlzIHdheSBpZlxuICAgICAgICAgICAgICAvLyB0aGVyZSBhcmUgbXVsdGlwbGUgc2Nyb2xsIGV2ZW50cyBpbiB0aGUgc2FtZSBmcmFtZSB3ZSBvbmx5IG5lZWQgdG8gcmVjaGVja1xuICAgICAgICAgICAgICAvLyBvdXIgbGF5b3V0IG9uY2UuXG4gICAgICAgICAgICAgIGF1ZGl0VGltZSgwLCBTQ1JPTExfU0NIRURVTEVSKSlcbiAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMuX3Njcm9sbFN0cmF0ZWd5Lm9uQ29udGVudFNjcm9sbGVkKCkpO1xuXG4gICAgICB0aGlzLl9tYXJrQ2hhbmdlRGV0ZWN0aW9uTmVlZGVkKCk7XG4gICAgfSkpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5kZXRhY2goKTtcbiAgICB0aGlzLl9zY3JvbGxTdHJhdGVneS5kZXRhY2goKTtcblxuICAgIC8vIENvbXBsZXRlIGFsbCBzdWJqZWN0c1xuICAgIHRoaXMuX3JlbmRlcmVkUmFuZ2VTdWJqZWN0LmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fZGV0YWNoZWRTdWJqZWN0LmNvbXBsZXRlKCk7XG5cbiAgICBzdXBlci5uZ09uRGVzdHJveSgpO1xuICB9XG5cbiAgLyoqIEF0dGFjaGVzIGEgYENka1ZpcnR1YWxGb3JPZmAgdG8gdGhpcyB2aWV3cG9ydC4gKi9cbiAgYXR0YWNoKGZvck9mOiBDZGtWaXJ0dWFsRm9yT2Y8YW55Pikge1xuICAgIGlmICh0aGlzLl9mb3JPZikge1xuICAgICAgdGhyb3cgRXJyb3IoJ0Nka1ZpcnR1YWxTY3JvbGxWaWV3cG9ydCBpcyBhbHJlYWR5IGF0dGFjaGVkLicpO1xuICAgIH1cblxuICAgIC8vIFN1YnNjcmliZSB0byB0aGUgZGF0YSBzdHJlYW0gb2YgdGhlIENka1ZpcnR1YWxGb3JPZiB0byBrZWVwIHRyYWNrIG9mIHdoZW4gdGhlIGRhdGEgbGVuZ3RoXG4gICAgLy8gY2hhbmdlcy4gUnVuIG91dHNpZGUgdGhlIHpvbmUgdG8gYXZvaWQgdHJpZ2dlcmluZyBjaGFuZ2UgZGV0ZWN0aW9uLCBzaW5jZSB3ZSdyZSBtYW5hZ2luZyB0aGVcbiAgICAvLyBjaGFuZ2UgZGV0ZWN0aW9uIGxvb3Agb3Vyc2VsdmVzLlxuICAgIHRoaXMubmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHRoaXMuX2Zvck9mID0gZm9yT2Y7XG4gICAgICB0aGlzLl9mb3JPZi5kYXRhU3RyZWFtLnBpcGUodGFrZVVudGlsKHRoaXMuX2RldGFjaGVkU3ViamVjdCkpLnN1YnNjcmliZShkYXRhID0+IHtcbiAgICAgICAgY29uc3QgbmV3TGVuZ3RoID0gZGF0YS5sZW5ndGg7XG4gICAgICAgIGlmIChuZXdMZW5ndGggIT09IHRoaXMuX2RhdGFMZW5ndGgpIHtcbiAgICAgICAgICB0aGlzLl9kYXRhTGVuZ3RoID0gbmV3TGVuZ3RoO1xuICAgICAgICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5Lm9uRGF0YUxlbmd0aENoYW5nZWQoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9kb0NoYW5nZURldGVjdGlvbigpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogRGV0YWNoZXMgdGhlIGN1cnJlbnQgYENka1ZpcnR1YWxGb3JPZmAuICovXG4gIGRldGFjaCgpIHtcbiAgICB0aGlzLl9mb3JPZiA9IG51bGw7XG4gICAgdGhpcy5fZGV0YWNoZWRTdWJqZWN0Lm5leHQoKTtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBsZW5ndGggb2YgdGhlIGRhdGEgYm91bmQgdG8gdGhpcyB2aWV3cG9ydCAoaW4gbnVtYmVyIG9mIGl0ZW1zKS4gKi9cbiAgZ2V0RGF0YUxlbmd0aCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9kYXRhTGVuZ3RoO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIHNpemUgb2YgdGhlIHZpZXdwb3J0IChpbiBwaXhlbHMpLiAqL1xuICBnZXRWaWV3cG9ydFNpemUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdmlld3BvcnRTaXplO1xuICB9XG5cbiAgLy8gVE9ETyhtbWFsZXJiYSk6IFRoaXMgaXMgdGVjaG5pY2FsbHkgb3V0IG9mIHN5bmMgd2l0aCB3aGF0J3MgcmVhbGx5IHJlbmRlcmVkIHVudGlsIGEgcmVuZGVyXG4gIC8vIGN5Y2xlIGhhcHBlbnMuIEknbSBiZWluZyBjYXJlZnVsIHRvIG9ubHkgY2FsbCBpdCBhZnRlciB0aGUgcmVuZGVyIGN5Y2xlIGlzIGNvbXBsZXRlIGFuZCBiZWZvcmVcbiAgLy8gc2V0dGluZyBpdCB0byBzb21ldGhpbmcgZWxzZSwgYnV0IGl0cyBlcnJvciBwcm9uZSBhbmQgc2hvdWxkIHByb2JhYmx5IGJlIHNwbGl0IGludG9cbiAgLy8gYHBlbmRpbmdSYW5nZWAgYW5kIGByZW5kZXJlZFJhbmdlYCwgdGhlIGxhdHRlciByZWZsZWN0aW5nIHdoYXRzIGFjdHVhbGx5IGluIHRoZSBET00uXG5cbiAgLyoqIEdldCB0aGUgY3VycmVudCByZW5kZXJlZCByYW5nZSBvZiBpdGVtcy4gKi9cbiAgZ2V0UmVuZGVyZWRSYW5nZSgpOiBMaXN0UmFuZ2Uge1xuICAgIHJldHVybiB0aGlzLl9yZW5kZXJlZFJhbmdlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHRvdGFsIHNpemUgb2YgYWxsIGNvbnRlbnQgKGluIHBpeGVscyksIGluY2x1ZGluZyBjb250ZW50IHRoYXQgaXMgbm90IGN1cnJlbnRseVxuICAgKiByZW5kZXJlZC5cbiAgICovXG4gIHNldFRvdGFsQ29udGVudFNpemUoc2l6ZTogbnVtYmVyKSB7XG4gICAgaWYgKHRoaXMuX3RvdGFsQ29udGVudFNpemUgIT09IHNpemUpIHtcbiAgICAgIHRoaXMuX3RvdGFsQ29udGVudFNpemUgPSBzaXplO1xuICAgICAgdGhpcy5fY2FsY3VsYXRlU3BhY2VyU2l6ZSgpO1xuICAgICAgdGhpcy5fbWFya0NoYW5nZURldGVjdGlvbk5lZWRlZCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBjdXJyZW50bHkgcmVuZGVyZWQgcmFuZ2Ugb2YgaW5kaWNlcy4gKi9cbiAgc2V0UmVuZGVyZWRSYW5nZShyYW5nZTogTGlzdFJhbmdlKSB7XG4gICAgaWYgKCFyYW5nZXNFcXVhbCh0aGlzLl9yZW5kZXJlZFJhbmdlLCByYW5nZSkpIHtcbiAgICAgIHRoaXMuX3JlbmRlcmVkUmFuZ2VTdWJqZWN0Lm5leHQodGhpcy5fcmVuZGVyZWRSYW5nZSA9IHJhbmdlKTtcbiAgICAgIHRoaXMuX21hcmtDaGFuZ2VEZXRlY3Rpb25OZWVkZWQoKCkgPT4gdGhpcy5fc2Nyb2xsU3RyYXRlZ3kub25Db250ZW50UmVuZGVyZWQoKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG9mZnNldCBmcm9tIHRoZSBzdGFydCBvZiB0aGUgdmlld3BvcnQgdG8gdGhlIHN0YXJ0IG9mIHRoZSByZW5kZXJlZCBkYXRhIChpbiBwaXhlbHMpLlxuICAgKi9cbiAgZ2V0T2Zmc2V0VG9SZW5kZXJlZENvbnRlbnRTdGFydCgpOiBudW1iZXIgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0TmVlZHNSZXdyaXRlID8gbnVsbCA6IHRoaXMuX3JlbmRlcmVkQ29udGVudE9mZnNldDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBvZmZzZXQgZnJvbSB0aGUgc3RhcnQgb2YgdGhlIHZpZXdwb3J0IHRvIGVpdGhlciB0aGUgc3RhcnQgb3IgZW5kIG9mIHRoZSByZW5kZXJlZCBkYXRhXG4gICAqIChpbiBwaXhlbHMpLlxuICAgKi9cbiAgc2V0UmVuZGVyZWRDb250ZW50T2Zmc2V0KG9mZnNldDogbnVtYmVyLCB0bzogJ3RvLXN0YXJ0JyB8ICd0by1lbmQnID0gJ3RvLXN0YXJ0Jykge1xuICAgIC8vIEZvciBhIGhvcml6b250YWwgdmlld3BvcnQgaW4gYSByaWdodC10by1sZWZ0IGxhbmd1YWdlIHdlIG5lZWQgdG8gdHJhbnNsYXRlIGFsb25nIHRoZSB4LWF4aXNcbiAgICAvLyBpbiB0aGUgbmVnYXRpdmUgZGlyZWN0aW9uLlxuICAgIGNvbnN0IGlzUnRsID0gdGhpcy5kaXIgJiYgdGhpcy5kaXIudmFsdWUgPT0gJ3J0bCc7XG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gdGhpcy5vcmllbnRhdGlvbiA9PSAnaG9yaXpvbnRhbCc7XG4gICAgY29uc3QgYXhpcyA9IGlzSG9yaXpvbnRhbCA/ICdYJyA6ICdZJztcbiAgICBjb25zdCBheGlzRGlyZWN0aW9uID0gaXNIb3Jpem9udGFsICYmIGlzUnRsID8gLTEgOiAxO1xuICAgIGxldCB0cmFuc2Zvcm0gPSBgdHJhbnNsYXRlJHtheGlzfSgke051bWJlcihheGlzRGlyZWN0aW9uICogb2Zmc2V0KX1weClgO1xuICAgIHRoaXMuX3JlbmRlcmVkQ29udGVudE9mZnNldCA9IG9mZnNldDtcbiAgICBpZiAodG8gPT09ICd0by1lbmQnKSB7XG4gICAgICB0cmFuc2Zvcm0gKz0gYCB0cmFuc2xhdGUke2F4aXN9KC0xMDAlKWA7XG4gICAgICAvLyBUaGUgdmlld3BvcnQgc2hvdWxkIHJld3JpdGUgdGhpcyBhcyBhIGB0by1zdGFydGAgb2Zmc2V0IG9uIHRoZSBuZXh0IHJlbmRlciBjeWNsZS4gT3RoZXJ3aXNlXG4gICAgICAvLyBlbGVtZW50cyB3aWxsIGFwcGVhciB0byBleHBhbmQgaW4gdGhlIHdyb25nIGRpcmVjdGlvbiAoZS5nLiBgbWF0LWV4cGFuc2lvbi1wYW5lbGAgd291bGRcbiAgICAgIC8vIGV4cGFuZCB1cHdhcmQpLlxuICAgICAgdGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0TmVlZHNSZXdyaXRlID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3JlbmRlcmVkQ29udGVudFRyYW5zZm9ybSAhPSB0cmFuc2Zvcm0pIHtcbiAgICAgIC8vIFdlIGtub3cgdGhpcyB2YWx1ZSBpcyBzYWZlIGJlY2F1c2Ugd2UgcGFyc2UgYG9mZnNldGAgd2l0aCBgTnVtYmVyKClgIGJlZm9yZSBwYXNzaW5nIGl0XG4gICAgICAvLyBpbnRvIHRoZSBzdHJpbmcuXG4gICAgICB0aGlzLl9yZW5kZXJlZENvbnRlbnRUcmFuc2Zvcm0gPSB0cmFuc2Zvcm07XG4gICAgICB0aGlzLl9tYXJrQ2hhbmdlRGV0ZWN0aW9uTmVlZGVkKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuX3JlbmRlcmVkQ29udGVudE9mZnNldE5lZWRzUmV3cml0ZSkge1xuICAgICAgICAgIHRoaXMuX3JlbmRlcmVkQ29udGVudE9mZnNldCAtPSB0aGlzLm1lYXN1cmVSZW5kZXJlZENvbnRlbnRTaXplKCk7XG4gICAgICAgICAgdGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0TmVlZHNSZXdyaXRlID0gZmFsc2U7XG4gICAgICAgICAgdGhpcy5zZXRSZW5kZXJlZENvbnRlbnRPZmZzZXQodGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl9zY3JvbGxTdHJhdGVneS5vblJlbmRlcmVkT2Zmc2V0Q2hhbmdlZCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2Nyb2xscyB0byB0aGUgZ2l2ZW4gb2Zmc2V0IGZyb20gdGhlIHN0YXJ0IG9mIHRoZSB2aWV3cG9ydC4gUGxlYXNlIG5vdGUgdGhhdCB0aGlzIGlzIG5vdCBhbHdheXNcbiAgICogdGhlIHNhbWUgYXMgc2V0dGluZyBgc2Nyb2xsVG9wYCBvciBgc2Nyb2xsTGVmdGAuIEluIGEgaG9yaXpvbnRhbCB2aWV3cG9ydCB3aXRoIHJpZ2h0LXRvLWxlZnRcbiAgICogZGlyZWN0aW9uLCB0aGlzIHdvdWxkIGJlIHRoZSBlcXVpdmFsZW50IG9mIHNldHRpbmcgYSBmaWN0aW9uYWwgYHNjcm9sbFJpZ2h0YCBwcm9wZXJ0eS5cbiAgICogQHBhcmFtIG9mZnNldCBUaGUgb2Zmc2V0IHRvIHNjcm9sbCB0by5cbiAgICogQHBhcmFtIGJlaGF2aW9yIFRoZSBTY3JvbGxCZWhhdmlvciB0byB1c2Ugd2hlbiBzY3JvbGxpbmcuIERlZmF1bHQgaXMgYmVoYXZpb3IgaXMgYGF1dG9gLlxuICAgKi9cbiAgc2Nyb2xsVG9PZmZzZXQob2Zmc2V0OiBudW1iZXIsIGJlaGF2aW9yOiBTY3JvbGxCZWhhdmlvciA9ICdhdXRvJykge1xuICAgIGNvbnN0IG9wdGlvbnM6IEV4dGVuZGVkU2Nyb2xsVG9PcHRpb25zID0ge2JlaGF2aW9yfTtcbiAgICBpZiAodGhpcy5vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnKSB7XG4gICAgICBvcHRpb25zLnN0YXJ0ID0gb2Zmc2V0O1xuICAgIH0gZWxzZSB7XG4gICAgICBvcHRpb25zLnRvcCA9IG9mZnNldDtcbiAgICB9XG4gICAgdGhpcy5zY3JvbGxUbyhvcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTY3JvbGxzIHRvIHRoZSBvZmZzZXQgZm9yIHRoZSBnaXZlbiBpbmRleC5cbiAgICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCB0byBzY3JvbGwgdG8uXG4gICAqIEBwYXJhbSBiZWhhdmlvciBUaGUgU2Nyb2xsQmVoYXZpb3IgdG8gdXNlIHdoZW4gc2Nyb2xsaW5nLiBEZWZhdWx0IGlzIGJlaGF2aW9yIGlzIGBhdXRvYC5cbiAgICovXG4gIHNjcm9sbFRvSW5kZXgoaW5kZXg6IG51bWJlciwgIGJlaGF2aW9yOiBTY3JvbGxCZWhhdmlvciA9ICdhdXRvJykge1xuICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5LnNjcm9sbFRvSW5kZXgoaW5kZXgsIGJlaGF2aW9yKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IHNjcm9sbCBvZmZzZXQgZnJvbSB0aGUgc3RhcnQgb2YgdGhlIHZpZXdwb3J0IChpbiBwaXhlbHMpLlxuICAgKiBAcGFyYW0gZnJvbSBUaGUgZWRnZSB0byBtZWFzdXJlIHRoZSBvZmZzZXQgZnJvbS4gRGVmYXVsdHMgdG8gJ3RvcCcgaW4gdmVydGljYWwgbW9kZSBhbmQgJ3N0YXJ0J1xuICAgKiAgICAgaW4gaG9yaXpvbnRhbCBtb2RlLlxuICAgKi9cbiAgbWVhc3VyZVNjcm9sbE9mZnNldChmcm9tPzogJ3RvcCcgfCAnbGVmdCcgfCAncmlnaHQnIHwgJ2JvdHRvbScgfCAnc3RhcnQnIHwgJ2VuZCcpOiBudW1iZXIge1xuICAgIHJldHVybiBzdXBlci5tZWFzdXJlU2Nyb2xsT2Zmc2V0KFxuICAgICAgICBmcm9tID8gZnJvbSA6IHRoaXMub3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJyA/ICdzdGFydCcgOiAndG9wJyk7XG4gIH1cblxuICAvKiogTWVhc3VyZSB0aGUgY29tYmluZWQgc2l6ZSBvZiBhbGwgb2YgdGhlIHJlbmRlcmVkIGl0ZW1zLiAqL1xuICBtZWFzdXJlUmVuZGVyZWRDb250ZW50U2l6ZSgpOiBudW1iZXIge1xuICAgIGNvbnN0IGNvbnRlbnRFbCA9IHRoaXMuX2NvbnRlbnRXcmFwcGVyLm5hdGl2ZUVsZW1lbnQ7XG4gICAgcmV0dXJuIHRoaXMub3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJyA/IGNvbnRlbnRFbC5vZmZzZXRXaWR0aCA6IGNvbnRlbnRFbC5vZmZzZXRIZWlnaHQ7XG4gIH1cblxuICAvKipcbiAgICogTWVhc3VyZSB0aGUgdG90YWwgY29tYmluZWQgc2l6ZSBvZiB0aGUgZ2l2ZW4gcmFuZ2UuIFRocm93cyBpZiB0aGUgcmFuZ2UgaW5jbHVkZXMgaXRlbXMgdGhhdCBhcmVcbiAgICogbm90IHJlbmRlcmVkLlxuICAgKi9cbiAgbWVhc3VyZVJhbmdlU2l6ZShyYW5nZTogTGlzdFJhbmdlKTogbnVtYmVyIHtcbiAgICBpZiAoIXRoaXMuX2Zvck9mKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2Zvck9mLm1lYXN1cmVSYW5nZVNpemUocmFuZ2UsIHRoaXMub3JpZW50YXRpb24pO1xuICB9XG5cbiAgLyoqIFVwZGF0ZSB0aGUgdmlld3BvcnQgZGltZW5zaW9ucyBhbmQgcmUtcmVuZGVyLiAqL1xuICBjaGVja1ZpZXdwb3J0U2l6ZSgpIHtcbiAgICAvLyBUT0RPOiBDbGVhbnVwIGxhdGVyIHdoZW4gYWRkIGxvZ2ljIGZvciBoYW5kbGluZyBjb250ZW50IHJlc2l6ZVxuICAgIHRoaXMuX21lYXN1cmVWaWV3cG9ydFNpemUoKTtcbiAgICB0aGlzLl9zY3JvbGxTdHJhdGVneS5vbkRhdGFMZW5ndGhDaGFuZ2VkKCk7XG4gIH1cblxuICAvKiogTWVhc3VyZSB0aGUgdmlld3BvcnQgc2l6ZS4gKi9cbiAgcHJpdmF0ZSBfbWVhc3VyZVZpZXdwb3J0U2l6ZSgpIHtcbiAgICBjb25zdCB2aWV3cG9ydEVsID0gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgdGhpcy5fdmlld3BvcnRTaXplID0gdGhpcy5vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnID9cbiAgICAgICAgdmlld3BvcnRFbC5jbGllbnRXaWR0aCA6IHZpZXdwb3J0RWwuY2xpZW50SGVpZ2h0O1xuICB9XG5cbiAgLyoqIFF1ZXVlIHVwIGNoYW5nZSBkZXRlY3Rpb24gdG8gcnVuLiAqL1xuICBwcml2YXRlIF9tYXJrQ2hhbmdlRGV0ZWN0aW9uTmVlZGVkKHJ1bkFmdGVyPzogRnVuY3Rpb24pIHtcbiAgICBpZiAocnVuQWZ0ZXIpIHtcbiAgICAgIHRoaXMuX3J1bkFmdGVyQ2hhbmdlRGV0ZWN0aW9uLnB1c2gocnVuQWZ0ZXIpO1xuICAgIH1cblxuICAgIC8vIFVzZSBhIFByb21pc2UgdG8gYmF0Y2ggdG9nZXRoZXIgY2FsbHMgdG8gYF9kb0NoYW5nZURldGVjdGlvbmAuIFRoaXMgd2F5IGlmIHdlIHNldCBhIGJ1bmNoIG9mXG4gICAgLy8gcHJvcGVydGllcyBzZXF1ZW50aWFsbHkgd2Ugb25seSBoYXZlIHRvIHJ1biBgX2RvQ2hhbmdlRGV0ZWN0aW9uYCBvbmNlIGF0IHRoZSBlbmQuXG4gICAgaWYgKCF0aGlzLl9pc0NoYW5nZURldGVjdGlvblBlbmRpbmcpIHtcbiAgICAgIHRoaXMuX2lzQ2hhbmdlRGV0ZWN0aW9uUGVuZGluZyA9IHRydWU7XG4gICAgICB0aGlzLm5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5fZG9DaGFuZ2VEZXRlY3Rpb24oKTtcbiAgICAgIH0pKTtcbiAgICB9XG4gIH1cblxuICAvKiogUnVuIGNoYW5nZSBkZXRlY3Rpb24uICovXG4gIHByaXZhdGUgX2RvQ2hhbmdlRGV0ZWN0aW9uKCkge1xuICAgIHRoaXMuX2lzQ2hhbmdlRGV0ZWN0aW9uUGVuZGluZyA9IGZhbHNlO1xuXG4gICAgLy8gQXBwbHkgY2hhbmdlcyB0byBBbmd1bGFyIGJpbmRpbmdzLiBOb3RlOiBXZSBtdXN0IGNhbGwgYG1hcmtGb3JDaGVja2AgdG8gcnVuIGNoYW5nZSBkZXRlY3Rpb25cbiAgICAvLyBmcm9tIHRoZSByb290LCBzaW5jZSB0aGUgcmVwZWF0ZWQgaXRlbXMgYXJlIGNvbnRlbnQgcHJvamVjdGVkIGluLiBDYWxsaW5nIGBkZXRlY3RDaGFuZ2VzYFxuICAgIC8vIGluc3RlYWQgZG9lcyBub3QgcHJvcGVybHkgY2hlY2sgdGhlIHByb2plY3RlZCBjb250ZW50LlxuICAgIHRoaXMubmdab25lLnJ1bigoKSA9PiB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKSk7XG4gICAgLy8gQXBwbHkgdGhlIGNvbnRlbnQgdHJhbnNmb3JtLiBUaGUgdHJhbnNmb3JtIGNhbid0IGJlIHNldCB2aWEgYW4gQW5ndWxhciBiaW5kaW5nIGJlY2F1c2VcbiAgICAvLyBieXBhc3NTZWN1cml0eVRydXN0U3R5bGUgaXMgYmFubmVkIGluIEdvb2dsZS4gSG93ZXZlciB0aGUgdmFsdWUgaXMgc2FmZSwgaXQncyBjb21wb3NlZCBvZlxuICAgIC8vIHN0cmluZyBsaXRlcmFscywgYSB2YXJpYWJsZSB0aGF0IGNhbiBvbmx5IGJlICdYJyBvciAnWScsIGFuZCB1c2VyIGlucHV0IHRoYXQgaXMgcnVuIHRocm91Z2hcbiAgICAvLyB0aGUgYE51bWJlcmAgZnVuY3Rpb24gZmlyc3QgdG8gY29lcmNlIGl0IHRvIGEgbnVtZXJpYyB2YWx1ZS5cbiAgICB0aGlzLl9jb250ZW50V3JhcHBlci5uYXRpdmVFbGVtZW50LnN0eWxlLnRyYW5zZm9ybSA9IHRoaXMuX3JlbmRlcmVkQ29udGVudFRyYW5zZm9ybTtcblxuICAgIGNvbnN0IHJ1bkFmdGVyQ2hhbmdlRGV0ZWN0aW9uID0gdGhpcy5fcnVuQWZ0ZXJDaGFuZ2VEZXRlY3Rpb247XG4gICAgdGhpcy5fcnVuQWZ0ZXJDaGFuZ2VEZXRlY3Rpb24gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGZuIG9mIHJ1bkFmdGVyQ2hhbmdlRGV0ZWN0aW9uKSB7XG4gICAgICBmbigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDYWxjdWxhdGVzIHRoZSBgc3R5bGUud2lkdGhgIGFuZCBgc3R5bGUuaGVpZ2h0YCBmb3IgdGhlIHNwYWNlciBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9jYWxjdWxhdGVTcGFjZXJTaXplKCkge1xuICAgIHRoaXMuX3RvdGFsQ29udGVudEhlaWdodCA9XG4gICAgICAgIHRoaXMub3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJyA/ICcnIDogYCR7dGhpcy5fdG90YWxDb250ZW50U2l6ZX1weGA7XG4gICAgdGhpcy5fdG90YWxDb250ZW50V2lkdGggPVxuICAgICAgICB0aGlzLm9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcgPyBgJHt0aGlzLl90b3RhbENvbnRlbnRTaXplfXB4YCA6ICcnO1xuICB9XG59XG4iXX0=