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
import { animationFrameScheduler, asapScheduler, Observable, Subject, Subscription, } from 'rxjs';
import { auditTime, startWith, takeUntil } from 'rxjs/operators';
import { ScrollDispatcher } from './scroll-dispatcher';
import { CdkScrollable } from './scrollable';
import { VIRTUAL_SCROLL_STRATEGY } from './virtual-scroll-strategy';
import { ViewportRuler } from './viewport-ruler';
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
    function CdkVirtualScrollViewport(elementRef, _changeDetectorRef, ngZone, _scrollStrategy, dir, scrollDispatcher, 
    /**
     * @deprecated `viewportRuler` parameter to become required.
     * @breaking-change 11.0.0
     */
    viewportRuler) {
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
        /** Subscription to changes in the viewport size. */
        _this._viewportChanges = Subscription.EMPTY;
        if (!_scrollStrategy) {
            throw Error('Error: cdk-virtual-scroll-viewport requires the "itemSize" property to be set.');
        }
        // @breaking-change 11.0.0 Remove null check for `viewportRuler`.
        if (viewportRuler) {
            _this._viewportChanges = viewportRuler.change().subscribe(function () {
                _this.checkViewportSize();
            });
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
        this._viewportChanges.unsubscribe();
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
        // Apply the content transform. The transform can't be set via an Angular binding because
        // bypassSecurityTrustStyle is banned in Google. However the value is safe, it's composed of
        // string literals, a variable that can only be 'X' or 'Y', and user input that is run through
        // the `Number` function first to coerce it to a numeric value.
        this._contentWrapper.nativeElement.style.transform = this._renderedContentTransform;
        // Apply changes to Angular bindings. Note: We must call `markForCheck` to run change detection
        // from the root, since the repeated items are content projected in. Calling `detectChanges`
        // instead does not properly check the projected content.
        this.ngZone.run(function () { return _this._changeDetectorRef.markForCheck(); });
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
        { type: ScrollDispatcher },
        { type: ViewportRuler, decorators: [{ type: Optional }] }
    ]; };
    CdkVirtualScrollViewport.propDecorators = {
        orientation: [{ type: Input }],
        scrolledIndexChange: [{ type: Output }],
        _contentWrapper: [{ type: ViewChild, args: ['contentWrapper', { static: true },] }]
    };
    return CdkVirtualScrollViewport;
}(CdkScrollable));
export { CdkVirtualScrollViewport };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1zY3JvbGwtdmlld3BvcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy92aXJ0dWFsLXNjcm9sbC12aWV3cG9ydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRWpELE9BQU8sRUFDTCx1QkFBdUIsRUFDdkIsaUJBQWlCLEVBQ2pCLFNBQVMsRUFDVCxVQUFVLEVBQ1YsTUFBTSxFQUNOLEtBQUssRUFDTCxNQUFNLEVBR04sUUFBUSxFQUNSLE1BQU0sRUFDTixTQUFTLEVBQ1QsaUJBQWlCLEdBQ2xCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFDTCx1QkFBdUIsRUFDdkIsYUFBYSxFQUNiLFVBQVUsRUFDVixPQUFPLEVBRVAsWUFBWSxHQUNiLE1BQU0sTUFBTSxDQUFDO0FBQ2QsT0FBTyxFQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDL0QsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDckQsT0FBTyxFQUFDLGFBQWEsRUFBMEIsTUFBTSxjQUFjLENBQUM7QUFFcEUsT0FBTyxFQUFDLHVCQUF1QixFQUF3QixNQUFNLDJCQUEyQixDQUFDO0FBQ3pGLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUUvQyw0Q0FBNEM7QUFDNUMsU0FBUyxXQUFXLENBQUMsRUFBYSxFQUFFLEVBQWE7SUFDL0MsT0FBTyxFQUFFLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDO0FBQ2xELENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsSUFBTSxnQkFBZ0IsR0FDbEIsT0FBTyxx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QkFFM0MsSUFBSSxFQUFFO3dCQUNKLE9BQU8sRUFBRSw2QkFBNkI7d0JBQ3RDLG1EQUFtRCxFQUFFLDhCQUE4Qjt3QkFDbkYsaURBQWlELEVBQUUsOEJBQThCO3FCQUNsRjtvQkFDRCxhQUFhLEVBQUUsaUJBQWlCLENBQUMsSUFBSTtvQkFDckMsZUFBZSxFQUFFLHVCQUF1QixDQUFDLE1BQU07b0JBQy9DLFNBQVMsRUFBRSxDQUFDOzRCQUNWLE9BQU8sRUFBRSxhQUFhOzRCQUN0QixXQUFXLEVBQUUsd0JBQXdCO3lCQUN0QyxDQUFDOztpQkFDSDs7OztnQkF4REMsVUFBVTtnQkFGVixpQkFBaUI7Z0JBS2pCLE1BQU07Z0RBNElPLFFBQVEsWUFBSSxNQUFNLFNBQUMsdUJBQXVCO2dCQXJKakQsY0FBYyx1QkF1SlAsUUFBUTtnQkE3SGYsZ0JBQWdCO2dCQUloQixhQUFhLHVCQStITixRQUFROzs7OEJBdEZwQixLQUFLO3NDQWlCTCxNQUFNO2tDQU1OLFNBQVMsU0FBQyxnQkFBZ0IsRUFBRSxFQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUM7O0lBaVY3QywrQkFBQztDQUFBLEFBaFlELENBZ0I4QyxhQUFhLEdBZ1gxRDtTQWhYWSx3QkFBd0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtMaXN0UmFuZ2V9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2xsZWN0aW9ucyc7XG5pbXBvcnQge1xuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIENvbXBvbmVudCxcbiAgRWxlbWVudFJlZixcbiAgSW5qZWN0LFxuICBJbnB1dCxcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIE9uSW5pdCxcbiAgT3B0aW9uYWwsXG4gIE91dHB1dCxcbiAgVmlld0NoaWxkLFxuICBWaWV3RW5jYXBzdWxhdGlvbixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1xuICBhbmltYXRpb25GcmFtZVNjaGVkdWxlcixcbiAgYXNhcFNjaGVkdWxlcixcbiAgT2JzZXJ2YWJsZSxcbiAgU3ViamVjdCxcbiAgT2JzZXJ2ZXIsXG4gIFN1YnNjcmlwdGlvbixcbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2F1ZGl0VGltZSwgc3RhcnRXaXRoLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7U2Nyb2xsRGlzcGF0Y2hlcn0gZnJvbSAnLi9zY3JvbGwtZGlzcGF0Y2hlcic7XG5pbXBvcnQge0Nka1Njcm9sbGFibGUsIEV4dGVuZGVkU2Nyb2xsVG9PcHRpb25zfSBmcm9tICcuL3Njcm9sbGFibGUnO1xuaW1wb3J0IHtDZGtWaXJ0dWFsRm9yT2Z9IGZyb20gJy4vdmlydHVhbC1mb3Itb2YnO1xuaW1wb3J0IHtWSVJUVUFMX1NDUk9MTF9TVFJBVEVHWSwgVmlydHVhbFNjcm9sbFN0cmF0ZWd5fSBmcm9tICcuL3ZpcnR1YWwtc2Nyb2xsLXN0cmF0ZWd5JztcbmltcG9ydCB7Vmlld3BvcnRSdWxlcn0gZnJvbSAnLi92aWV3cG9ydC1ydWxlcic7XG5cbi8qKiBDaGVja3MgaWYgdGhlIGdpdmVuIHJhbmdlcyBhcmUgZXF1YWwuICovXG5mdW5jdGlvbiByYW5nZXNFcXVhbChyMTogTGlzdFJhbmdlLCByMjogTGlzdFJhbmdlKTogYm9vbGVhbiB7XG4gIHJldHVybiByMS5zdGFydCA9PSByMi5zdGFydCAmJiByMS5lbmQgPT0gcjIuZW5kO1xufVxuXG4vKipcbiAqIFNjaGVkdWxlciB0byBiZSB1c2VkIGZvciBzY3JvbGwgZXZlbnRzLiBOZWVkcyB0byBmYWxsIGJhY2sgdG9cbiAqIHNvbWV0aGluZyB0aGF0IGRvZXNuJ3QgcmVseSBvbiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgb24gZW52aXJvbm1lbnRzXG4gKiB0aGF0IGRvbid0IHN1cHBvcnQgaXQgKGUuZy4gc2VydmVyLXNpZGUgcmVuZGVyaW5nKS5cbiAqL1xuY29uc3QgU0NST0xMX1NDSEVEVUxFUiA9XG4gICAgdHlwZW9mIHJlcXVlc3RBbmltYXRpb25GcmFtZSAhPT0gJ3VuZGVmaW5lZCcgPyBhbmltYXRpb25GcmFtZVNjaGVkdWxlciA6IGFzYXBTY2hlZHVsZXI7XG5cblxuLyoqIEEgdmlld3BvcnQgdGhhdCB2aXJ0dWFsaXplcyBpdHMgc2Nyb2xsaW5nIHdpdGggdGhlIGhlbHAgb2YgYENka1ZpcnR1YWxGb3JPZmAuICovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdjZGstdmlydHVhbC1zY3JvbGwtdmlld3BvcnQnLFxuICB0ZW1wbGF0ZVVybDogJ3ZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0Lmh0bWwnLFxuICBzdHlsZVVybHM6IFsndmlydHVhbC1zY3JvbGwtdmlld3BvcnQuY3NzJ10sXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLXZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0JyxcbiAgICAnW2NsYXNzLmNkay12aXJ0dWFsLXNjcm9sbC1vcmllbnRhdGlvbi1ob3Jpem9udGFsXSc6ICdvcmllbnRhdGlvbiA9PT0gXCJob3Jpem9udGFsXCInLFxuICAgICdbY2xhc3MuY2RrLXZpcnR1YWwtc2Nyb2xsLW9yaWVudGF0aW9uLXZlcnRpY2FsXSc6ICdvcmllbnRhdGlvbiAhPT0gXCJob3Jpem9udGFsXCInLFxuICB9LFxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaCxcbiAgcHJvdmlkZXJzOiBbe1xuICAgIHByb3ZpZGU6IENka1Njcm9sbGFibGUsXG4gICAgdXNlRXhpc3Rpbmc6IENka1ZpcnR1YWxTY3JvbGxWaWV3cG9ydCxcbiAgfV1cbn0pXG5leHBvcnQgY2xhc3MgQ2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0IGV4dGVuZHMgQ2RrU2Nyb2xsYWJsZSBpbXBsZW1lbnRzIE9uSW5pdCwgT25EZXN0cm95IHtcbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHZpZXdwb3J0IGlzIGRldGFjaGVkIGZyb20gYSBDZGtWaXJ0dWFsRm9yT2YuICovXG4gIHByaXZhdGUgX2RldGFjaGVkU3ViamVjdCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHJlbmRlcmVkIHJhbmdlIGNoYW5nZXMuICovXG4gIHByaXZhdGUgX3JlbmRlcmVkUmFuZ2VTdWJqZWN0ID0gbmV3IFN1YmplY3Q8TGlzdFJhbmdlPigpO1xuXG4gIC8qKiBUaGUgZGlyZWN0aW9uIHRoZSB2aWV3cG9ydCBzY3JvbGxzLiAqL1xuICBASW5wdXQoKVxuICBnZXQgb3JpZW50YXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX29yaWVudGF0aW9uO1xuICB9XG4gIHNldCBvcmllbnRhdGlvbihvcmllbnRhdGlvbjogJ2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJykge1xuICAgIGlmICh0aGlzLl9vcmllbnRhdGlvbiAhPT0gb3JpZW50YXRpb24pIHtcbiAgICAgIHRoaXMuX29yaWVudGF0aW9uID0gb3JpZW50YXRpb247XG4gICAgICB0aGlzLl9jYWxjdWxhdGVTcGFjZXJTaXplKCk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgX29yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcgfCAndmVydGljYWwnID0gJ3ZlcnRpY2FsJztcblxuICAvLyBOb3RlOiB3ZSBkb24ndCB1c2UgdGhlIHR5cGljYWwgRXZlbnRFbWl0dGVyIGhlcmUgYmVjYXVzZSB3ZSBuZWVkIHRvIHN1YnNjcmliZSB0byB0aGUgc2Nyb2xsXG4gIC8vIHN0cmF0ZWd5IGxhemlseSAoaS5lLiBvbmx5IGlmIHRoZSB1c2VyIGlzIGFjdHVhbGx5IGxpc3RlbmluZyB0byB0aGUgZXZlbnRzKS4gV2UgZG8gdGhpcyBiZWNhdXNlXG4gIC8vIGRlcGVuZGluZyBvbiBob3cgdGhlIHN0cmF0ZWd5IGNhbGN1bGF0ZXMgdGhlIHNjcm9sbGVkIGluZGV4LCBpdCBtYXkgY29tZSBhdCBhIGNvc3QgdG9cbiAgLy8gcGVyZm9ybWFuY2UuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBpbmRleCBvZiB0aGUgZmlyc3QgZWxlbWVudCB2aXNpYmxlIGluIHRoZSB2aWV3cG9ydCBjaGFuZ2VzLiAqL1xuICBAT3V0cHV0KCkgc2Nyb2xsZWRJbmRleENoYW5nZTogT2JzZXJ2YWJsZTxudW1iZXI+ID1cbiAgICAgIG5ldyBPYnNlcnZhYmxlKChvYnNlcnZlcjogT2JzZXJ2ZXI8bnVtYmVyPikgPT5cbiAgICAgICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kuc2Nyb2xsZWRJbmRleENoYW5nZS5zdWJzY3JpYmUoaW5kZXggPT5cbiAgICAgICAgICAgIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4gdGhpcy5uZ1pvbmUucnVuKCgpID0+IG9ic2VydmVyLm5leHQoaW5kZXgpKSkpKTtcblxuICAvKiogVGhlIGVsZW1lbnQgdGhhdCB3cmFwcyB0aGUgcmVuZGVyZWQgY29udGVudC4gKi9cbiAgQFZpZXdDaGlsZCgnY29udGVudFdyYXBwZXInLCB7c3RhdGljOiB0cnVlfSkgX2NvbnRlbnRXcmFwcGVyOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PjtcblxuICAvKiogQSBzdHJlYW0gdGhhdCBlbWl0cyB3aGVuZXZlciB0aGUgcmVuZGVyZWQgcmFuZ2UgY2hhbmdlcy4gKi9cbiAgcmVuZGVyZWRSYW5nZVN0cmVhbTogT2JzZXJ2YWJsZTxMaXN0UmFuZ2U+ID0gdGhpcy5fcmVuZGVyZWRSYW5nZVN1YmplY3QuYXNPYnNlcnZhYmxlKCk7XG5cbiAgLyoqXG4gICAqIFRoZSB0b3RhbCBzaXplIG9mIGFsbCBjb250ZW50IChpbiBwaXhlbHMpLCBpbmNsdWRpbmcgY29udGVudCB0aGF0IGlzIG5vdCBjdXJyZW50bHkgcmVuZGVyZWQuXG4gICAqL1xuICBwcml2YXRlIF90b3RhbENvbnRlbnRTaXplID0gMDtcblxuICAvKiogQSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBgc3R5bGUud2lkdGhgIHByb3BlcnR5IHZhbHVlIHRvIGJlIHVzZWQgZm9yIHRoZSBzcGFjZXIgZWxlbWVudC4gKi9cbiAgX3RvdGFsQ29udGVudFdpZHRoID0gJyc7XG5cbiAgLyoqIEEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgYHN0eWxlLmhlaWdodGAgcHJvcGVydHkgdmFsdWUgdG8gYmUgdXNlZCBmb3IgdGhlIHNwYWNlciBlbGVtZW50LiAqL1xuICBfdG90YWxDb250ZW50SGVpZ2h0ID0gJyc7XG5cbiAgLyoqXG4gICAqIFRoZSBDU1MgdHJhbnNmb3JtIGFwcGxpZWQgdG8gdGhlIHJlbmRlcmVkIHN1YnNldCBvZiBpdGVtcyBzbyB0aGF0IHRoZXkgYXBwZWFyIHdpdGhpbiB0aGUgYm91bmRzXG4gICAqIG9mIHRoZSB2aXNpYmxlIHZpZXdwb3J0LlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVuZGVyZWRDb250ZW50VHJhbnNmb3JtOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBjdXJyZW50bHkgcmVuZGVyZWQgcmFuZ2Ugb2YgaW5kaWNlcy4gKi9cbiAgcHJpdmF0ZSBfcmVuZGVyZWRSYW5nZTogTGlzdFJhbmdlID0ge3N0YXJ0OiAwLCBlbmQ6IDB9O1xuXG4gIC8qKiBUaGUgbGVuZ3RoIG9mIHRoZSBkYXRhIGJvdW5kIHRvIHRoaXMgdmlld3BvcnQgKGluIG51bWJlciBvZiBpdGVtcykuICovXG4gIHByaXZhdGUgX2RhdGFMZW5ndGggPSAwO1xuXG4gIC8qKiBUaGUgc2l6ZSBvZiB0aGUgdmlld3BvcnQgKGluIHBpeGVscykuICovXG4gIHByaXZhdGUgX3ZpZXdwb3J0U2l6ZSA9IDA7XG5cbiAgLyoqIHRoZSBjdXJyZW50bHkgYXR0YWNoZWQgQ2RrVmlydHVhbEZvck9mLiAqL1xuICBwcml2YXRlIF9mb3JPZjogQ2RrVmlydHVhbEZvck9mPGFueT4gfCBudWxsO1xuXG4gIC8qKiBUaGUgbGFzdCByZW5kZXJlZCBjb250ZW50IG9mZnNldCB0aGF0IHdhcyBzZXQuICovXG4gIHByaXZhdGUgX3JlbmRlcmVkQ29udGVudE9mZnNldCA9IDA7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGxhc3QgcmVuZGVyZWQgY29udGVudCBvZmZzZXQgd2FzIHRvIHRoZSBlbmQgb2YgdGhlIGNvbnRlbnQgKGFuZCB0aGVyZWZvcmUgbmVlZHMgdG9cbiAgICogYmUgcmV3cml0dGVuIGFzIGFuIG9mZnNldCB0byB0aGUgc3RhcnQgb2YgdGhlIGNvbnRlbnQpLlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVuZGVyZWRDb250ZW50T2Zmc2V0TmVlZHNSZXdyaXRlID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgdGhlcmUgaXMgYSBwZW5kaW5nIGNoYW5nZSBkZXRlY3Rpb24gY3ljbGUuICovXG4gIHByaXZhdGUgX2lzQ2hhbmdlRGV0ZWN0aW9uUGVuZGluZyA9IGZhbHNlO1xuXG4gIC8qKiBBIGxpc3Qgb2YgZnVuY3Rpb25zIHRvIHJ1biBhZnRlciB0aGUgbmV4dCBjaGFuZ2UgZGV0ZWN0aW9uIGN5Y2xlLiAqL1xuICBwcml2YXRlIF9ydW5BZnRlckNoYW5nZURldGVjdGlvbjogRnVuY3Rpb25bXSA9IFtdO1xuXG4gIC8qKiBTdWJzY3JpcHRpb24gdG8gY2hhbmdlcyBpbiB0aGUgdmlld3BvcnQgc2l6ZS4gKi9cbiAgcHJpdmF0ZSBfdmlld3BvcnRDaGFuZ2VzID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBlbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmLFxuICAgICAgICAgICAgICBuZ1pvbmU6IE5nWm9uZSxcbiAgICAgICAgICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChWSVJUVUFMX1NDUk9MTF9TVFJBVEVHWSlcbiAgICAgICAgICAgICAgICAgIHByaXZhdGUgX3Njcm9sbFN0cmF0ZWd5OiBWaXJ0dWFsU2Nyb2xsU3RyYXRlZ3ksXG4gICAgICAgICAgICAgIEBPcHRpb25hbCgpIGRpcjogRGlyZWN0aW9uYWxpdHksXG4gICAgICAgICAgICAgIHNjcm9sbERpc3BhdGNoZXI6IFNjcm9sbERpc3BhdGNoZXIsXG4gICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgKiBAZGVwcmVjYXRlZCBgdmlld3BvcnRSdWxlcmAgcGFyYW1ldGVyIHRvIGJlY29tZSByZXF1aXJlZC5cbiAgICAgICAgICAgICAgICogQGJyZWFraW5nLWNoYW5nZSAxMS4wLjBcbiAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgIEBPcHRpb25hbCgpIHZpZXdwb3J0UnVsZXI/OiBWaWV3cG9ydFJ1bGVyKSB7XG4gICAgc3VwZXIoZWxlbWVudFJlZiwgc2Nyb2xsRGlzcGF0Y2hlciwgbmdab25lLCBkaXIpO1xuXG4gICAgaWYgKCFfc2Nyb2xsU3RyYXRlZ3kpIHtcbiAgICAgIHRocm93IEVycm9yKCdFcnJvcjogY2RrLXZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0IHJlcXVpcmVzIHRoZSBcIml0ZW1TaXplXCIgcHJvcGVydHkgdG8gYmUgc2V0LicpO1xuICAgIH1cblxuICAgIC8vIEBicmVha2luZy1jaGFuZ2UgMTEuMC4wIFJlbW92ZSBudWxsIGNoZWNrIGZvciBgdmlld3BvcnRSdWxlcmAuXG4gICAgaWYgKHZpZXdwb3J0UnVsZXIpIHtcbiAgICAgIHRoaXMuX3ZpZXdwb3J0Q2hhbmdlcyA9IHZpZXdwb3J0UnVsZXIuY2hhbmdlKCkuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgdGhpcy5jaGVja1ZpZXdwb3J0U2l6ZSgpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgc3VwZXIubmdPbkluaXQoKTtcblxuICAgIC8vIEl0J3Mgc3RpbGwgdG9vIGVhcmx5IHRvIG1lYXN1cmUgdGhlIHZpZXdwb3J0IGF0IHRoaXMgcG9pbnQuIERlZmVycmluZyB3aXRoIGEgcHJvbWlzZSBhbGxvd3NcbiAgICAvLyB0aGUgVmlld3BvcnQgdG8gYmUgcmVuZGVyZWQgd2l0aCB0aGUgY29ycmVjdCBzaXplIGJlZm9yZSB3ZSBtZWFzdXJlLiBXZSBydW4gdGhpcyBvdXRzaWRlIHRoZVxuICAgIC8vIHpvbmUgdG8gYXZvaWQgY2F1c2luZyBtb3JlIGNoYW5nZSBkZXRlY3Rpb24gY3ljbGVzLiBXZSBoYW5kbGUgdGhlIGNoYW5nZSBkZXRlY3Rpb24gbG9vcFxuICAgIC8vIG91cnNlbHZlcyBpbnN0ZWFkLlxuICAgIHRoaXMubmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5fbWVhc3VyZVZpZXdwb3J0U2l6ZSgpO1xuICAgICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kuYXR0YWNoKHRoaXMpO1xuXG4gICAgICB0aGlzLmVsZW1lbnRTY3JvbGxlZCgpXG4gICAgICAgICAgLnBpcGUoXG4gICAgICAgICAgICAgIC8vIFN0YXJ0IG9mZiB3aXRoIGEgZmFrZSBzY3JvbGwgZXZlbnQgc28gd2UgcHJvcGVybHkgZGV0ZWN0IG91ciBpbml0aWFsIHBvc2l0aW9uLlxuICAgICAgICAgICAgICBzdGFydFdpdGgobnVsbCEpLFxuICAgICAgICAgICAgICAvLyBDb2xsZWN0IG11bHRpcGxlIGV2ZW50cyBpbnRvIG9uZSB1bnRpbCB0aGUgbmV4dCBhbmltYXRpb24gZnJhbWUuIFRoaXMgd2F5IGlmXG4gICAgICAgICAgICAgIC8vIHRoZXJlIGFyZSBtdWx0aXBsZSBzY3JvbGwgZXZlbnRzIGluIHRoZSBzYW1lIGZyYW1lIHdlIG9ubHkgbmVlZCB0byByZWNoZWNrXG4gICAgICAgICAgICAgIC8vIG91ciBsYXlvdXQgb25jZS5cbiAgICAgICAgICAgICAgYXVkaXRUaW1lKDAsIFNDUk9MTF9TQ0hFRFVMRVIpKVxuICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy5fc2Nyb2xsU3RyYXRlZ3kub25Db250ZW50U2Nyb2xsZWQoKSk7XG5cbiAgICAgIHRoaXMuX21hcmtDaGFuZ2VEZXRlY3Rpb25OZWVkZWQoKTtcbiAgICB9KSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLmRldGFjaCgpO1xuICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5LmRldGFjaCgpO1xuXG4gICAgLy8gQ29tcGxldGUgYWxsIHN1YmplY3RzXG4gICAgdGhpcy5fcmVuZGVyZWRSYW5nZVN1YmplY3QuY29tcGxldGUoKTtcbiAgICB0aGlzLl9kZXRhY2hlZFN1YmplY3QuY29tcGxldGUoKTtcbiAgICB0aGlzLl92aWV3cG9ydENoYW5nZXMudW5zdWJzY3JpYmUoKTtcblxuICAgIHN1cGVyLm5nT25EZXN0cm95KCk7XG4gIH1cblxuICAvKiogQXR0YWNoZXMgYSBgQ2RrVmlydHVhbEZvck9mYCB0byB0aGlzIHZpZXdwb3J0LiAqL1xuICBhdHRhY2goZm9yT2Y6IENka1ZpcnR1YWxGb3JPZjxhbnk+KSB7XG4gICAgaWYgKHRoaXMuX2Zvck9mKSB7XG4gICAgICB0aHJvdyBFcnJvcignQ2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0IGlzIGFscmVhZHkgYXR0YWNoZWQuJyk7XG4gICAgfVxuXG4gICAgLy8gU3Vic2NyaWJlIHRvIHRoZSBkYXRhIHN0cmVhbSBvZiB0aGUgQ2RrVmlydHVhbEZvck9mIHRvIGtlZXAgdHJhY2sgb2Ygd2hlbiB0aGUgZGF0YSBsZW5ndGhcbiAgICAvLyBjaGFuZ2VzLiBSdW4gb3V0c2lkZSB0aGUgem9uZSB0byBhdm9pZCB0cmlnZ2VyaW5nIGNoYW5nZSBkZXRlY3Rpb24sIHNpbmNlIHdlJ3JlIG1hbmFnaW5nIHRoZVxuICAgIC8vIGNoYW5nZSBkZXRlY3Rpb24gbG9vcCBvdXJzZWx2ZXMuXG4gICAgdGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgdGhpcy5fZm9yT2YgPSBmb3JPZjtcbiAgICAgIHRoaXMuX2Zvck9mLmRhdGFTdHJlYW0ucGlwZSh0YWtlVW50aWwodGhpcy5fZGV0YWNoZWRTdWJqZWN0KSkuc3Vic2NyaWJlKGRhdGEgPT4ge1xuICAgICAgICBjb25zdCBuZXdMZW5ndGggPSBkYXRhLmxlbmd0aDtcbiAgICAgICAgaWYgKG5ld0xlbmd0aCAhPT0gdGhpcy5fZGF0YUxlbmd0aCkge1xuICAgICAgICAgIHRoaXMuX2RhdGFMZW5ndGggPSBuZXdMZW5ndGg7XG4gICAgICAgICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kub25EYXRhTGVuZ3RoQ2hhbmdlZCgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2RvQ2hhbmdlRGV0ZWN0aW9uKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBEZXRhY2hlcyB0aGUgY3VycmVudCBgQ2RrVmlydHVhbEZvck9mYC4gKi9cbiAgZGV0YWNoKCkge1xuICAgIHRoaXMuX2Zvck9mID0gbnVsbDtcbiAgICB0aGlzLl9kZXRhY2hlZFN1YmplY3QubmV4dCgpO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIGxlbmd0aCBvZiB0aGUgZGF0YSBib3VuZCB0byB0aGlzIHZpZXdwb3J0IChpbiBudW1iZXIgb2YgaXRlbXMpLiAqL1xuICBnZXREYXRhTGVuZ3RoKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX2RhdGFMZW5ndGg7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgc2l6ZSBvZiB0aGUgdmlld3BvcnQgKGluIHBpeGVscykuICovXG4gIGdldFZpZXdwb3J0U2l6ZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92aWV3cG9ydFNpemU7XG4gIH1cblxuICAvLyBUT0RPKG1tYWxlcmJhKTogVGhpcyBpcyB0ZWNobmljYWxseSBvdXQgb2Ygc3luYyB3aXRoIHdoYXQncyByZWFsbHkgcmVuZGVyZWQgdW50aWwgYSByZW5kZXJcbiAgLy8gY3ljbGUgaGFwcGVucy4gSSdtIGJlaW5nIGNhcmVmdWwgdG8gb25seSBjYWxsIGl0IGFmdGVyIHRoZSByZW5kZXIgY3ljbGUgaXMgY29tcGxldGUgYW5kIGJlZm9yZVxuICAvLyBzZXR0aW5nIGl0IHRvIHNvbWV0aGluZyBlbHNlLCBidXQgaXRzIGVycm9yIHByb25lIGFuZCBzaG91bGQgcHJvYmFibHkgYmUgc3BsaXQgaW50b1xuICAvLyBgcGVuZGluZ1JhbmdlYCBhbmQgYHJlbmRlcmVkUmFuZ2VgLCB0aGUgbGF0dGVyIHJlZmxlY3Rpbmcgd2hhdHMgYWN0dWFsbHkgaW4gdGhlIERPTS5cblxuICAvKiogR2V0IHRoZSBjdXJyZW50IHJlbmRlcmVkIHJhbmdlIG9mIGl0ZW1zLiAqL1xuICBnZXRSZW5kZXJlZFJhbmdlKCk6IExpc3RSYW5nZSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlbmRlcmVkUmFuZ2U7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdG90YWwgc2l6ZSBvZiBhbGwgY29udGVudCAoaW4gcGl4ZWxzKSwgaW5jbHVkaW5nIGNvbnRlbnQgdGhhdCBpcyBub3QgY3VycmVudGx5XG4gICAqIHJlbmRlcmVkLlxuICAgKi9cbiAgc2V0VG90YWxDb250ZW50U2l6ZShzaXplOiBudW1iZXIpIHtcbiAgICBpZiAodGhpcy5fdG90YWxDb250ZW50U2l6ZSAhPT0gc2l6ZSkge1xuICAgICAgdGhpcy5fdG90YWxDb250ZW50U2l6ZSA9IHNpemU7XG4gICAgICB0aGlzLl9jYWxjdWxhdGVTcGFjZXJTaXplKCk7XG4gICAgICB0aGlzLl9tYXJrQ2hhbmdlRGV0ZWN0aW9uTmVlZGVkKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFNldHMgdGhlIGN1cnJlbnRseSByZW5kZXJlZCByYW5nZSBvZiBpbmRpY2VzLiAqL1xuICBzZXRSZW5kZXJlZFJhbmdlKHJhbmdlOiBMaXN0UmFuZ2UpIHtcbiAgICBpZiAoIXJhbmdlc0VxdWFsKHRoaXMuX3JlbmRlcmVkUmFuZ2UsIHJhbmdlKSkge1xuICAgICAgdGhpcy5fcmVuZGVyZWRSYW5nZVN1YmplY3QubmV4dCh0aGlzLl9yZW5kZXJlZFJhbmdlID0gcmFuZ2UpO1xuICAgICAgdGhpcy5fbWFya0NoYW5nZURldGVjdGlvbk5lZWRlZCgoKSA9PiB0aGlzLl9zY3JvbGxTdHJhdGVneS5vbkNvbnRlbnRSZW5kZXJlZCgpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgb2Zmc2V0IGZyb20gdGhlIHN0YXJ0IG9mIHRoZSB2aWV3cG9ydCB0byB0aGUgc3RhcnQgb2YgdGhlIHJlbmRlcmVkIGRhdGEgKGluIHBpeGVscykuXG4gICAqL1xuICBnZXRPZmZzZXRUb1JlbmRlcmVkQ29udGVudFN0YXJ0KCk6IG51bWJlciB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLl9yZW5kZXJlZENvbnRlbnRPZmZzZXROZWVkc1Jld3JpdGUgPyBudWxsIDogdGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG9mZnNldCBmcm9tIHRoZSBzdGFydCBvZiB0aGUgdmlld3BvcnQgdG8gZWl0aGVyIHRoZSBzdGFydCBvciBlbmQgb2YgdGhlIHJlbmRlcmVkIGRhdGFcbiAgICogKGluIHBpeGVscykuXG4gICAqL1xuICBzZXRSZW5kZXJlZENvbnRlbnRPZmZzZXQob2Zmc2V0OiBudW1iZXIsIHRvOiAndG8tc3RhcnQnIHwgJ3RvLWVuZCcgPSAndG8tc3RhcnQnKSB7XG4gICAgLy8gRm9yIGEgaG9yaXpvbnRhbCB2aWV3cG9ydCBpbiBhIHJpZ2h0LXRvLWxlZnQgbGFuZ3VhZ2Ugd2UgbmVlZCB0byB0cmFuc2xhdGUgYWxvbmcgdGhlIHgtYXhpc1xuICAgIC8vIGluIHRoZSBuZWdhdGl2ZSBkaXJlY3Rpb24uXG4gICAgY29uc3QgaXNSdGwgPSB0aGlzLmRpciAmJiB0aGlzLmRpci52YWx1ZSA9PSAncnRsJztcbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLm9yaWVudGF0aW9uID09ICdob3Jpem9udGFsJztcbiAgICBjb25zdCBheGlzID0gaXNIb3Jpem9udGFsID8gJ1gnIDogJ1knO1xuICAgIGNvbnN0IGF4aXNEaXJlY3Rpb24gPSBpc0hvcml6b250YWwgJiYgaXNSdGwgPyAtMSA6IDE7XG4gICAgbGV0IHRyYW5zZm9ybSA9IGB0cmFuc2xhdGUke2F4aXN9KCR7TnVtYmVyKGF4aXNEaXJlY3Rpb24gKiBvZmZzZXQpfXB4KWA7XG4gICAgdGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0ID0gb2Zmc2V0O1xuICAgIGlmICh0byA9PT0gJ3RvLWVuZCcpIHtcbiAgICAgIHRyYW5zZm9ybSArPSBgIHRyYW5zbGF0ZSR7YXhpc30oLTEwMCUpYDtcbiAgICAgIC8vIFRoZSB2aWV3cG9ydCBzaG91bGQgcmV3cml0ZSB0aGlzIGFzIGEgYHRvLXN0YXJ0YCBvZmZzZXQgb24gdGhlIG5leHQgcmVuZGVyIGN5Y2xlLiBPdGhlcndpc2VcbiAgICAgIC8vIGVsZW1lbnRzIHdpbGwgYXBwZWFyIHRvIGV4cGFuZCBpbiB0aGUgd3JvbmcgZGlyZWN0aW9uIChlLmcuIGBtYXQtZXhwYW5zaW9uLXBhbmVsYCB3b3VsZFxuICAgICAgLy8gZXhwYW5kIHVwd2FyZCkuXG4gICAgICB0aGlzLl9yZW5kZXJlZENvbnRlbnRPZmZzZXROZWVkc1Jld3JpdGUgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAodGhpcy5fcmVuZGVyZWRDb250ZW50VHJhbnNmb3JtICE9IHRyYW5zZm9ybSkge1xuICAgICAgLy8gV2Uga25vdyB0aGlzIHZhbHVlIGlzIHNhZmUgYmVjYXVzZSB3ZSBwYXJzZSBgb2Zmc2V0YCB3aXRoIGBOdW1iZXIoKWAgYmVmb3JlIHBhc3NpbmcgaXRcbiAgICAgIC8vIGludG8gdGhlIHN0cmluZy5cbiAgICAgIHRoaXMuX3JlbmRlcmVkQ29udGVudFRyYW5zZm9ybSA9IHRyYW5zZm9ybTtcbiAgICAgIHRoaXMuX21hcmtDaGFuZ2VEZXRlY3Rpb25OZWVkZWQoKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0TmVlZHNSZXdyaXRlKSB7XG4gICAgICAgICAgdGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0IC09IHRoaXMubWVhc3VyZVJlbmRlcmVkQ29udGVudFNpemUoKTtcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlZENvbnRlbnRPZmZzZXROZWVkc1Jld3JpdGUgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLnNldFJlbmRlcmVkQ29udGVudE9mZnNldCh0aGlzLl9yZW5kZXJlZENvbnRlbnRPZmZzZXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5Lm9uUmVuZGVyZWRPZmZzZXRDaGFuZ2VkKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTY3JvbGxzIHRvIHRoZSBnaXZlbiBvZmZzZXQgZnJvbSB0aGUgc3RhcnQgb2YgdGhlIHZpZXdwb3J0LiBQbGVhc2Ugbm90ZSB0aGF0IHRoaXMgaXMgbm90IGFsd2F5c1xuICAgKiB0aGUgc2FtZSBhcyBzZXR0aW5nIGBzY3JvbGxUb3BgIG9yIGBzY3JvbGxMZWZ0YC4gSW4gYSBob3Jpem9udGFsIHZpZXdwb3J0IHdpdGggcmlnaHQtdG8tbGVmdFxuICAgKiBkaXJlY3Rpb24sIHRoaXMgd291bGQgYmUgdGhlIGVxdWl2YWxlbnQgb2Ygc2V0dGluZyBhIGZpY3Rpb25hbCBgc2Nyb2xsUmlnaHRgIHByb3BlcnR5LlxuICAgKiBAcGFyYW0gb2Zmc2V0IFRoZSBvZmZzZXQgdG8gc2Nyb2xsIHRvLlxuICAgKiBAcGFyYW0gYmVoYXZpb3IgVGhlIFNjcm9sbEJlaGF2aW9yIHRvIHVzZSB3aGVuIHNjcm9sbGluZy4gRGVmYXVsdCBpcyBiZWhhdmlvciBpcyBgYXV0b2AuXG4gICAqL1xuICBzY3JvbGxUb09mZnNldChvZmZzZXQ6IG51bWJlciwgYmVoYXZpb3I6IFNjcm9sbEJlaGF2aW9yID0gJ2F1dG8nKSB7XG4gICAgY29uc3Qgb3B0aW9uczogRXh0ZW5kZWRTY3JvbGxUb09wdGlvbnMgPSB7YmVoYXZpb3J9O1xuICAgIGlmICh0aGlzLm9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcpIHtcbiAgICAgIG9wdGlvbnMuc3RhcnQgPSBvZmZzZXQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdGlvbnMudG9wID0gb2Zmc2V0O1xuICAgIH1cbiAgICB0aGlzLnNjcm9sbFRvKG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNjcm9sbHMgdG8gdGhlIG9mZnNldCBmb3IgdGhlIGdpdmVuIGluZGV4LlxuICAgKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IHRvIHNjcm9sbCB0by5cbiAgICogQHBhcmFtIGJlaGF2aW9yIFRoZSBTY3JvbGxCZWhhdmlvciB0byB1c2Ugd2hlbiBzY3JvbGxpbmcuIERlZmF1bHQgaXMgYmVoYXZpb3IgaXMgYGF1dG9gLlxuICAgKi9cbiAgc2Nyb2xsVG9JbmRleChpbmRleDogbnVtYmVyLCAgYmVoYXZpb3I6IFNjcm9sbEJlaGF2aW9yID0gJ2F1dG8nKSB7XG4gICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kuc2Nyb2xsVG9JbmRleChpbmRleCwgYmVoYXZpb3IpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgc2Nyb2xsIG9mZnNldCBmcm9tIHRoZSBzdGFydCBvZiB0aGUgdmlld3BvcnQgKGluIHBpeGVscykuXG4gICAqIEBwYXJhbSBmcm9tIFRoZSBlZGdlIHRvIG1lYXN1cmUgdGhlIG9mZnNldCBmcm9tLiBEZWZhdWx0cyB0byAndG9wJyBpbiB2ZXJ0aWNhbCBtb2RlIGFuZCAnc3RhcnQnXG4gICAqICAgICBpbiBob3Jpem9udGFsIG1vZGUuXG4gICAqL1xuICBtZWFzdXJlU2Nyb2xsT2Zmc2V0KGZyb20/OiAndG9wJyB8ICdsZWZ0JyB8ICdyaWdodCcgfCAnYm90dG9tJyB8ICdzdGFydCcgfCAnZW5kJyk6IG51bWJlciB7XG4gICAgcmV0dXJuIHN1cGVyLm1lYXN1cmVTY3JvbGxPZmZzZXQoXG4gICAgICAgIGZyb20gPyBmcm9tIDogdGhpcy5vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnID8gJ3N0YXJ0JyA6ICd0b3AnKTtcbiAgfVxuXG4gIC8qKiBNZWFzdXJlIHRoZSBjb21iaW5lZCBzaXplIG9mIGFsbCBvZiB0aGUgcmVuZGVyZWQgaXRlbXMuICovXG4gIG1lYXN1cmVSZW5kZXJlZENvbnRlbnRTaXplKCk6IG51bWJlciB7XG4gICAgY29uc3QgY29udGVudEVsID0gdGhpcy5fY29udGVudFdyYXBwZXIubmF0aXZlRWxlbWVudDtcbiAgICByZXR1cm4gdGhpcy5vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnID8gY29udGVudEVsLm9mZnNldFdpZHRoIDogY29udGVudEVsLm9mZnNldEhlaWdodDtcbiAgfVxuXG4gIC8qKlxuICAgKiBNZWFzdXJlIHRoZSB0b3RhbCBjb21iaW5lZCBzaXplIG9mIHRoZSBnaXZlbiByYW5nZS4gVGhyb3dzIGlmIHRoZSByYW5nZSBpbmNsdWRlcyBpdGVtcyB0aGF0IGFyZVxuICAgKiBub3QgcmVuZGVyZWQuXG4gICAqL1xuICBtZWFzdXJlUmFuZ2VTaXplKHJhbmdlOiBMaXN0UmFuZ2UpOiBudW1iZXIge1xuICAgIGlmICghdGhpcy5fZm9yT2YpIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fZm9yT2YubWVhc3VyZVJhbmdlU2l6ZShyYW5nZSwgdGhpcy5vcmllbnRhdGlvbik7XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSB2aWV3cG9ydCBkaW1lbnNpb25zIGFuZCByZS1yZW5kZXIuICovXG4gIGNoZWNrVmlld3BvcnRTaXplKCkge1xuICAgIC8vIFRPRE86IENsZWFudXAgbGF0ZXIgd2hlbiBhZGQgbG9naWMgZm9yIGhhbmRsaW5nIGNvbnRlbnQgcmVzaXplXG4gICAgdGhpcy5fbWVhc3VyZVZpZXdwb3J0U2l6ZSgpO1xuICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5Lm9uRGF0YUxlbmd0aENoYW5nZWQoKTtcbiAgfVxuXG4gIC8qKiBNZWFzdXJlIHRoZSB2aWV3cG9ydCBzaXplLiAqL1xuICBwcml2YXRlIF9tZWFzdXJlVmlld3BvcnRTaXplKCkge1xuICAgIGNvbnN0IHZpZXdwb3J0RWwgPSB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcbiAgICB0aGlzLl92aWV3cG9ydFNpemUgPSB0aGlzLm9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcgP1xuICAgICAgICB2aWV3cG9ydEVsLmNsaWVudFdpZHRoIDogdmlld3BvcnRFbC5jbGllbnRIZWlnaHQ7XG4gIH1cblxuICAvKiogUXVldWUgdXAgY2hhbmdlIGRldGVjdGlvbiB0byBydW4uICovXG4gIHByaXZhdGUgX21hcmtDaGFuZ2VEZXRlY3Rpb25OZWVkZWQocnVuQWZ0ZXI/OiBGdW5jdGlvbikge1xuICAgIGlmIChydW5BZnRlcikge1xuICAgICAgdGhpcy5fcnVuQWZ0ZXJDaGFuZ2VEZXRlY3Rpb24ucHVzaChydW5BZnRlcik7XG4gICAgfVxuXG4gICAgLy8gVXNlIGEgUHJvbWlzZSB0byBiYXRjaCB0b2dldGhlciBjYWxscyB0byBgX2RvQ2hhbmdlRGV0ZWN0aW9uYC4gVGhpcyB3YXkgaWYgd2Ugc2V0IGEgYnVuY2ggb2ZcbiAgICAvLyBwcm9wZXJ0aWVzIHNlcXVlbnRpYWxseSB3ZSBvbmx5IGhhdmUgdG8gcnVuIGBfZG9DaGFuZ2VEZXRlY3Rpb25gIG9uY2UgYXQgdGhlIGVuZC5cbiAgICBpZiAoIXRoaXMuX2lzQ2hhbmdlRGV0ZWN0aW9uUGVuZGluZykge1xuICAgICAgdGhpcy5faXNDaGFuZ2VEZXRlY3Rpb25QZW5kaW5nID0gdHJ1ZTtcbiAgICAgIHRoaXMubmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLl9kb0NoYW5nZURldGVjdGlvbigpO1xuICAgICAgfSkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSdW4gY2hhbmdlIGRldGVjdGlvbi4gKi9cbiAgcHJpdmF0ZSBfZG9DaGFuZ2VEZXRlY3Rpb24oKSB7XG4gICAgdGhpcy5faXNDaGFuZ2VEZXRlY3Rpb25QZW5kaW5nID0gZmFsc2U7XG5cbiAgICAvLyBBcHBseSB0aGUgY29udGVudCB0cmFuc2Zvcm0uIFRoZSB0cmFuc2Zvcm0gY2FuJ3QgYmUgc2V0IHZpYSBhbiBBbmd1bGFyIGJpbmRpbmcgYmVjYXVzZVxuICAgIC8vIGJ5cGFzc1NlY3VyaXR5VHJ1c3RTdHlsZSBpcyBiYW5uZWQgaW4gR29vZ2xlLiBIb3dldmVyIHRoZSB2YWx1ZSBpcyBzYWZlLCBpdCdzIGNvbXBvc2VkIG9mXG4gICAgLy8gc3RyaW5nIGxpdGVyYWxzLCBhIHZhcmlhYmxlIHRoYXQgY2FuIG9ubHkgYmUgJ1gnIG9yICdZJywgYW5kIHVzZXIgaW5wdXQgdGhhdCBpcyBydW4gdGhyb3VnaFxuICAgIC8vIHRoZSBgTnVtYmVyYCBmdW5jdGlvbiBmaXJzdCB0byBjb2VyY2UgaXQgdG8gYSBudW1lcmljIHZhbHVlLlxuICAgIHRoaXMuX2NvbnRlbnRXcmFwcGVyLm5hdGl2ZUVsZW1lbnQuc3R5bGUudHJhbnNmb3JtID0gdGhpcy5fcmVuZGVyZWRDb250ZW50VHJhbnNmb3JtO1xuICAgIC8vIEFwcGx5IGNoYW5nZXMgdG8gQW5ndWxhciBiaW5kaW5ncy4gTm90ZTogV2UgbXVzdCBjYWxsIGBtYXJrRm9yQ2hlY2tgIHRvIHJ1biBjaGFuZ2UgZGV0ZWN0aW9uXG4gICAgLy8gZnJvbSB0aGUgcm9vdCwgc2luY2UgdGhlIHJlcGVhdGVkIGl0ZW1zIGFyZSBjb250ZW50IHByb2plY3RlZCBpbi4gQ2FsbGluZyBgZGV0ZWN0Q2hhbmdlc2BcbiAgICAvLyBpbnN0ZWFkIGRvZXMgbm90IHByb3Blcmx5IGNoZWNrIHRoZSBwcm9qZWN0ZWQgY29udGVudC5cbiAgICB0aGlzLm5nWm9uZS5ydW4oKCkgPT4gdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCkpO1xuXG4gICAgY29uc3QgcnVuQWZ0ZXJDaGFuZ2VEZXRlY3Rpb24gPSB0aGlzLl9ydW5BZnRlckNoYW5nZURldGVjdGlvbjtcbiAgICB0aGlzLl9ydW5BZnRlckNoYW5nZURldGVjdGlvbiA9IFtdO1xuICAgIGZvciAoY29uc3QgZm4gb2YgcnVuQWZ0ZXJDaGFuZ2VEZXRlY3Rpb24pIHtcbiAgICAgIGZuKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENhbGN1bGF0ZXMgdGhlIGBzdHlsZS53aWR0aGAgYW5kIGBzdHlsZS5oZWlnaHRgIGZvciB0aGUgc3BhY2VyIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX2NhbGN1bGF0ZVNwYWNlclNpemUoKSB7XG4gICAgdGhpcy5fdG90YWxDb250ZW50SGVpZ2h0ID1cbiAgICAgICAgdGhpcy5vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnID8gJycgOiBgJHt0aGlzLl90b3RhbENvbnRlbnRTaXplfXB4YDtcbiAgICB0aGlzLl90b3RhbENvbnRlbnRXaWR0aCA9XG4gICAgICAgIHRoaXMub3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJyA/IGAke3RoaXMuX3RvdGFsQ29udGVudFNpemV9cHhgIDogJyc7XG4gIH1cbn1cbiJdfQ==