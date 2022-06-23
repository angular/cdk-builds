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
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/bidi";
import * as i2 from "./scroll-dispatcher";
import * as i3 from "./viewport-ruler";
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
            this._renderedRangeSubject.next((this._renderedRange = range));
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
        // In appendOnly, we always start from the top
        offset = this.appendOnly && to === 'to-start' ? 0 : offset;
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
        return from
            ? super.measureScrollOffset(from)
            : super.measureScrollOffset(this.orientation === 'horizontal' ? 'start' : 'top');
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
        this._viewportSize =
            this.orientation === 'horizontal' ? viewportEl.clientWidth : viewportEl.clientHeight;
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
CdkVirtualScrollViewport.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.0.1", ngImport: i0, type: CdkVirtualScrollViewport, deps: [{ token: i0.ElementRef }, { token: i0.ChangeDetectorRef }, { token: i0.NgZone }, { token: VIRTUAL_SCROLL_STRATEGY, optional: true }, { token: i1.Directionality, optional: true }, { token: i2.ScrollDispatcher }, { token: i3.ViewportRuler }], target: i0.ɵɵFactoryTarget.Component });
CdkVirtualScrollViewport.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "14.0.1", type: CdkVirtualScrollViewport, selector: "cdk-virtual-scroll-viewport", inputs: { orientation: "orientation", appendOnly: "appendOnly" }, outputs: { scrolledIndexChange: "scrolledIndexChange" }, host: { properties: { "class.cdk-virtual-scroll-orientation-horizontal": "orientation === \"horizontal\"", "class.cdk-virtual-scroll-orientation-vertical": "orientation !== \"horizontal\"" }, classAttribute: "cdk-virtual-scroll-viewport" }, providers: [
        {
            provide: CdkScrollable,
            useExisting: CdkVirtualScrollViewport,
        },
    ], viewQueries: [{ propertyName: "_contentWrapper", first: true, predicate: ["contentWrapper"], descendants: true, static: true }], usesInheritance: true, ngImport: i0, template: "<!--\n  Wrap the rendered content in an element that will be used to offset it based on the scroll\n  position.\n-->\n<div #contentWrapper class=\"cdk-virtual-scroll-content-wrapper\">\n  <ng-content></ng-content>\n</div>\n<!--\n  Spacer used to force the scrolling container to the correct size for the *total* number of items\n  so that the scrollbar captures the size of the entire data set.\n-->\n<div class=\"cdk-virtual-scroll-spacer\"\n     [style.width]=\"_totalContentWidth\" [style.height]=\"_totalContentHeight\"></div>\n", styles: ["cdk-virtual-scroll-viewport{display:block;position:relative;overflow:auto;contain:strict;transform:translateZ(0);will-change:scroll-position;-webkit-overflow-scrolling:touch}.cdk-virtual-scroll-content-wrapper{position:absolute;top:0;left:0;contain:content}[dir=rtl] .cdk-virtual-scroll-content-wrapper{right:0;left:auto}.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper{min-height:100%}.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>dl:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>ol:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>table:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>ul:not([cdkVirtualFor]){padding-left:0;padding-right:0;margin-left:0;margin-right:0;border-left-width:0;border-right-width:0;outline:none}.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper{min-width:100%}.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>dl:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>ol:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>table:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>ul:not([cdkVirtualFor]){padding-top:0;padding-bottom:0;margin-top:0;margin-bottom:0;border-top-width:0;border-bottom-width:0;outline:none}.cdk-virtual-scroll-spacer{position:absolute;top:0;left:0;height:1px;width:1px;transform-origin:0 0}[dir=rtl] .cdk-virtual-scroll-spacer{right:0;left:auto;transform-origin:100% 0}"], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.0.1", ngImport: i0, type: CdkVirtualScrollViewport, decorators: [{
            type: Component,
            args: [{ selector: 'cdk-virtual-scroll-viewport', host: {
                        'class': 'cdk-virtual-scroll-viewport',
                        '[class.cdk-virtual-scroll-orientation-horizontal]': 'orientation === "horizontal"',
                        '[class.cdk-virtual-scroll-orientation-vertical]': 'orientation !== "horizontal"',
                    }, encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush, providers: [
                        {
                            provide: CdkScrollable,
                            useExisting: CdkVirtualScrollViewport,
                        },
                    ], template: "<!--\n  Wrap the rendered content in an element that will be used to offset it based on the scroll\n  position.\n-->\n<div #contentWrapper class=\"cdk-virtual-scroll-content-wrapper\">\n  <ng-content></ng-content>\n</div>\n<!--\n  Spacer used to force the scrolling container to the correct size for the *total* number of items\n  so that the scrollbar captures the size of the entire data set.\n-->\n<div class=\"cdk-virtual-scroll-spacer\"\n     [style.width]=\"_totalContentWidth\" [style.height]=\"_totalContentHeight\"></div>\n", styles: ["cdk-virtual-scroll-viewport{display:block;position:relative;overflow:auto;contain:strict;transform:translateZ(0);will-change:scroll-position;-webkit-overflow-scrolling:touch}.cdk-virtual-scroll-content-wrapper{position:absolute;top:0;left:0;contain:content}[dir=rtl] .cdk-virtual-scroll-content-wrapper{right:0;left:auto}.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper{min-height:100%}.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>dl:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>ol:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>table:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>ul:not([cdkVirtualFor]){padding-left:0;padding-right:0;margin-left:0;margin-right:0;border-left-width:0;border-right-width:0;outline:none}.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper{min-width:100%}.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>dl:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>ol:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>table:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>ul:not([cdkVirtualFor]){padding-top:0;padding-bottom:0;margin-top:0;margin-bottom:0;border-top-width:0;border-bottom-width:0;outline:none}.cdk-virtual-scroll-spacer{position:absolute;top:0;left:0;height:1px;width:1px;transform-origin:0 0}[dir=rtl] .cdk-virtual-scroll-spacer{right:0;left:auto;transform-origin:100% 0}"] }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i0.ChangeDetectorRef }, { type: i0.NgZone }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [VIRTUAL_SCROLL_STRATEGY]
                }] }, { type: i1.Directionality, decorators: [{
                    type: Optional
                }] }, { type: i2.ScrollDispatcher }, { type: i3.ViewportRuler }]; }, propDecorators: { orientation: [{
                type: Input
            }], appendOnly: [{
                type: Input
            }], scrolledIndexChange: [{
                type: Output
            }], _contentWrapper: [{
                type: ViewChild,
                args: ['contentWrapper', { static: true }]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1zY3JvbGwtdmlld3BvcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy92aXJ0dWFsLXNjcm9sbC12aWV3cG9ydC50cyIsIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2Nyb2xsaW5nL3ZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRWpELE9BQU8sRUFDTCx1QkFBdUIsRUFDdkIsaUJBQWlCLEVBQ2pCLFNBQVMsRUFDVCxVQUFVLEVBQ1YsTUFBTSxFQUNOLEtBQUssRUFDTCxNQUFNLEVBR04sUUFBUSxFQUNSLE1BQU0sRUFDTixTQUFTLEVBQ1QsaUJBQWlCLEdBQ2xCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFDTCx1QkFBdUIsRUFDdkIsYUFBYSxFQUNiLFVBQVUsRUFDVixPQUFPLEVBRVAsWUFBWSxHQUNiLE1BQU0sTUFBTSxDQUFDO0FBQ2QsT0FBTyxFQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDL0QsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDckQsT0FBTyxFQUFDLGFBQWEsRUFBMEIsTUFBTSxjQUFjLENBQUM7QUFDcEUsT0FBTyxFQUFDLHVCQUF1QixFQUF3QixNQUFNLDJCQUEyQixDQUFDO0FBQ3pGLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUUvQyxPQUFPLEVBQWUscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQzs7Ozs7QUFFMUUsNENBQTRDO0FBQzVDLFNBQVMsV0FBVyxDQUFDLEVBQWEsRUFBRSxFQUFhO0lBQy9DLE9BQU8sRUFBRSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMs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QUE4RTtJQUN0RSxvQkFBb0I7UUFDMUIsSUFBSSxDQUFDLG1CQUFtQjtZQUN0QixJQUFJLENBQUMsV0FBVyxLQUFLLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxDQUFDO1FBQ3pFLElBQUksQ0FBQyxrQkFBa0I7WUFDckIsSUFBSSxDQUFDLFdBQVcsS0FBSyxZQUFZLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUMzRSxDQUFDOztxSEF4WVUsd0JBQXdCLG1HQXVHekIsdUJBQXVCO3lHQXZHdEIsd0JBQXdCLGthQVB4QjtRQUNUO1lBQ0UsT0FBTyxFQUFFLGFBQWE7WUFDdEIsV0FBVyxFQUFFLHdCQUF3QjtTQUN0QztLQUNGLGtMQ3ZFSCxzaEJBYUE7MkZENERhLHdCQUF3QjtrQkFsQnBDLFNBQVM7K0JBQ0UsNkJBQTZCLFFBR2pDO3dCQUNKLE9BQU8sRUFBRSw2QkFBNkI7d0JBQ3RDLG1EQUFtRCxFQUFFLDhCQUE4Qjt3QkFDbkYsaURBQWlELEVBQUUsOEJBQThCO3FCQUNsRixpQkFDYyxpQkFBaUIsQ0FBQyxJQUFJLG1CQUNwQix1QkFBdUIsQ0FBQyxNQUFNLGFBQ3BDO3dCQUNUOzRCQUNFLE9BQU8sRUFBRSxhQUFhOzRCQUN0QixXQUFXLDBCQUEwQjt5QkFDdEM7cUJBQ0Y7OzBCQXdHRSxRQUFROzswQkFDUixNQUFNOzJCQUFDLHVCQUF1Qjs7MEJBRTlCLFFBQVE7dUdBaEdQLFdBQVc7c0JBRGQsS0FBSztnQkFpQkYsVUFBVTtzQkFEYixLQUFLO2dCQWVHLG1CQUFtQjtzQkFEM0IsTUFBTTtnQkFRc0MsZUFBZTtzQkFBM0QsU0FBUzt1QkFBQyxnQkFBZ0IsRUFBRSxFQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtMaXN0UmFuZ2V9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2xsZWN0aW9ucyc7XG5pbXBvcnQge1xuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIENvbXBvbmVudCxcbiAgRWxlbWVudFJlZixcbiAgSW5qZWN0LFxuICBJbnB1dCxcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIE9uSW5pdCxcbiAgT3B0aW9uYWwsXG4gIE91dHB1dCxcbiAgVmlld0NoaWxkLFxuICBWaWV3RW5jYXBzdWxhdGlvbixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1xuICBhbmltYXRpb25GcmFtZVNjaGVkdWxlcixcbiAgYXNhcFNjaGVkdWxlcixcbiAgT2JzZXJ2YWJsZSxcbiAgU3ViamVjdCxcbiAgT2JzZXJ2ZXIsXG4gIFN1YnNjcmlwdGlvbixcbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2F1ZGl0VGltZSwgc3RhcnRXaXRoLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7U2Nyb2xsRGlzcGF0Y2hlcn0gZnJvbSAnLi9zY3JvbGwtZGlzcGF0Y2hlcic7XG5pbXBvcnQge0Nka1Njcm9sbGFibGUsIEV4dGVuZGVkU2Nyb2xsVG9PcHRpb25zfSBmcm9tICcuL3Njcm9sbGFibGUnO1xuaW1wb3J0IHtWSVJUVUFMX1NDUk9MTF9TVFJBVEVHWSwgVmlydHVhbFNjcm9sbFN0cmF0ZWd5fSBmcm9tICcuL3ZpcnR1YWwtc2Nyb2xsLXN0cmF0ZWd5JztcbmltcG9ydCB7Vmlld3BvcnRSdWxlcn0gZnJvbSAnLi92aWV3cG9ydC1ydWxlcic7XG5pbXBvcnQge0Nka1ZpcnR1YWxTY3JvbGxSZXBlYXRlcn0gZnJvbSAnLi92aXJ0dWFsLXNjcm9sbC1yZXBlYXRlcic7XG5pbXBvcnQge0Jvb2xlYW5JbnB1dCwgY29lcmNlQm9vbGVhblByb3BlcnR5fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuXG4vKiogQ2hlY2tzIGlmIHRoZSBnaXZlbiByYW5nZXMgYXJlIGVxdWFsLiAqL1xuZnVuY3Rpb24gcmFuZ2VzRXF1YWwocjE6IExpc3RSYW5nZSwgcjI6IExpc3RSYW5nZSk6IGJvb2xlYW4ge1xuICByZXR1cm4gcjEuc3RhcnQgPT0gcjIuc3RhcnQgJiYgcjEuZW5kID09IHIyLmVuZDtcbn1cblxuLyoqXG4gKiBTY2hlZHVsZXIgdG8gYmUgdXNlZCBmb3Igc2Nyb2xsIGV2ZW50cy4gTmVlZHMgdG8gZmFsbCBiYWNrIHRvXG4gKiBzb21ldGhpbmcgdGhhdCBkb2Vzbid0IHJlbHkgb24gcmVxdWVzdEFuaW1hdGlvbkZyYW1lIG9uIGVudmlyb25tZW50c1xuICogdGhhdCBkb24ndCBzdXBwb3J0IGl0IChlLmcuIHNlcnZlci1zaWRlIHJlbmRlcmluZykuXG4gKi9cbmNvbnN0IFNDUk9MTF9TQ0hFRFVMRVIgPVxuICB0eXBlb2YgcmVxdWVzdEFuaW1hdGlvbkZyYW1lICE9PSAndW5kZWZpbmVkJyA/IGFuaW1hdGlvbkZyYW1lU2NoZWR1bGVyIDogYXNhcFNjaGVkdWxlcjtcblxuLyoqIEEgdmlld3BvcnQgdGhhdCB2aXJ0dWFsaXplcyBpdHMgc2Nyb2xsaW5nIHdpdGggdGhlIGhlbHAgb2YgYENka1ZpcnR1YWxGb3JPZmAuICovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdjZGstdmlydHVhbC1zY3JvbGwtdmlld3BvcnQnLFxuICB0ZW1wbGF0ZVVybDogJ3ZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0Lmh0bWwnLFxuICBzdHlsZVVybHM6IFsndmlydHVhbC1zY3JvbGwtdmlld3BvcnQuY3NzJ10sXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLXZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0JyxcbiAgICAnW2NsYXNzLmNkay12aXJ0dWFsLXNjcm9sbC1vcmllbnRhdGlvbi1ob3Jpem9udGFsXSc6ICdvcmllbnRhdGlvbiA9PT0gXCJob3Jpem9udGFsXCInLFxuICAgICdbY2xhc3MuY2RrLXZpcnR1YWwtc2Nyb2xsLW9yaWVudGF0aW9uLXZlcnRpY2FsXSc6ICdvcmllbnRhdGlvbiAhPT0gXCJob3Jpem9udGFsXCInLFxuICB9LFxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaCxcbiAgcHJvdmlkZXJzOiBbXG4gICAge1xuICAgICAgcHJvdmlkZTogQ2RrU2Nyb2xsYWJsZSxcbiAgICAgIHVzZUV4aXN0aW5nOiBDZGtWaXJ0dWFsU2Nyb2xsVmlld3BvcnQsXG4gICAgfSxcbiAgXSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0IGV4dGVuZHMgQ2RrU2Nyb2xsYWJsZSBpbXBsZW1lbnRzIE9uSW5pdCwgT25EZXN0cm95IHtcbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHZpZXdwb3J0IGlzIGRldGFjaGVkIGZyb20gYSBDZGtWaXJ0dWFsRm9yT2YuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX2RldGFjaGVkU3ViamVjdCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHJlbmRlcmVkIHJhbmdlIGNoYW5nZXMuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX3JlbmRlcmVkUmFuZ2VTdWJqZWN0ID0gbmV3IFN1YmplY3Q8TGlzdFJhbmdlPigpO1xuXG4gIC8qKiBUaGUgZGlyZWN0aW9uIHRoZSB2aWV3cG9ydCBzY3JvbGxzLiAqL1xuICBASW5wdXQoKVxuICBnZXQgb3JpZW50YXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX29yaWVudGF0aW9uO1xuICB9XG4gIHNldCBvcmllbnRhdGlvbihvcmllbnRhdGlvbjogJ2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJykge1xuICAgIGlmICh0aGlzLl9vcmllbnRhdGlvbiAhPT0gb3JpZW50YXRpb24pIHtcbiAgICAgIHRoaXMuX29yaWVudGF0aW9uID0gb3JpZW50YXRpb247XG4gICAgICB0aGlzLl9jYWxjdWxhdGVTcGFjZXJTaXplKCk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgX29yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcgfCAndmVydGljYWwnID0gJ3ZlcnRpY2FsJztcblxuICAvKipcbiAgICogV2hldGhlciByZW5kZXJlZCBpdGVtcyBzaG91bGQgcGVyc2lzdCBpbiB0aGUgRE9NIGFmdGVyIHNjcm9sbGluZyBvdXQgb2Ygdmlldy4gQnkgZGVmYXVsdCwgaXRlbXNcbiAgICogd2lsbCBiZSByZW1vdmVkLlxuICAgKi9cbiAgQElucHV0KClcbiAgZ2V0IGFwcGVuZE9ubHkoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2FwcGVuZE9ubHk7XG4gIH1cbiAgc2V0IGFwcGVuZE9ubHkodmFsdWU6IEJvb2xlYW5JbnB1dCkge1xuICAgIHRoaXMuX2FwcGVuZE9ubHkgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG4gIHByaXZhdGUgX2FwcGVuZE9ubHkgPSBmYWxzZTtcblxuICAvLyBOb3RlOiB3ZSBkb24ndCB1c2UgdGhlIHR5cGljYWwgRXZlbnRFbWl0dGVyIGhlcmUgYmVjYXVzZSB3ZSBuZWVkIHRvIHN1YnNjcmliZSB0byB0aGUgc2Nyb2xsXG4gIC8vIHN0cmF0ZWd5IGxhemlseSAoaS5lLiBvbmx5IGlmIHRoZSB1c2VyIGlzIGFjdHVhbGx5IGxpc3RlbmluZyB0byB0aGUgZXZlbnRzKS4gV2UgZG8gdGhpcyBiZWNhdXNlXG4gIC8vIGRlcGVuZGluZyBvbiBob3cgdGhlIHN0cmF0ZWd5IGNhbGN1bGF0ZXMgdGhlIHNjcm9sbGVkIGluZGV4LCBpdCBtYXkgY29tZSBhdCBhIGNvc3QgdG9cbiAgLy8gcGVyZm9ybWFuY2UuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBpbmRleCBvZiB0aGUgZmlyc3QgZWxlbWVudCB2aXNpYmxlIGluIHRoZSB2aWV3cG9ydCBjaGFuZ2VzLiAqL1xuICBAT3V0cHV0KClcbiAgcmVhZG9ubHkgc2Nyb2xsZWRJbmRleENoYW5nZTogT2JzZXJ2YWJsZTxudW1iZXI+ID0gbmV3IE9ic2VydmFibGUoKG9ic2VydmVyOiBPYnNlcnZlcjxudW1iZXI+KSA9PlxuICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5LnNjcm9sbGVkSW5kZXhDaGFuZ2Uuc3Vic2NyaWJlKGluZGV4ID0+XG4gICAgICBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHRoaXMubmdab25lLnJ1bigoKSA9PiBvYnNlcnZlci5uZXh0KGluZGV4KSkpLFxuICAgICksXG4gICk7XG5cbiAgLyoqIFRoZSBlbGVtZW50IHRoYXQgd3JhcHMgdGhlIHJlbmRlcmVkIGNvbnRlbnQuICovXG4gIEBWaWV3Q2hpbGQoJ2NvbnRlbnRXcmFwcGVyJywge3N0YXRpYzogdHJ1ZX0pIF9jb250ZW50V3JhcHBlcjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD47XG5cbiAgLyoqIEEgc3RyZWFtIHRoYXQgZW1pdHMgd2hlbmV2ZXIgdGhlIHJlbmRlcmVkIHJhbmdlIGNoYW5nZXMuICovXG4gIHJlYWRvbmx5IHJlbmRlcmVkUmFuZ2VTdHJlYW06IE9ic2VydmFibGU8TGlzdFJhbmdlPiA9IHRoaXMuX3JlbmRlcmVkUmFuZ2VTdWJqZWN0O1xuXG4gIC8qKlxuICAgKiBUaGUgdG90YWwgc2l6ZSBvZiBhbGwgY29udGVudCAoaW4gcGl4ZWxzKSwgaW5jbHVkaW5nIGNvbnRlbnQgdGhhdCBpcyBub3QgY3VycmVudGx5IHJlbmRlcmVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfdG90YWxDb250ZW50U2l6ZSA9IDA7XG5cbiAgLyoqIEEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgYHN0eWxlLndpZHRoYCBwcm9wZXJ0eSB2YWx1ZSB0byBiZSB1c2VkIGZvciB0aGUgc3BhY2VyIGVsZW1lbnQuICovXG4gIF90b3RhbENvbnRlbnRXaWR0aCA9ICcnO1xuXG4gIC8qKiBBIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIGBzdHlsZS5oZWlnaHRgIHByb3BlcnR5IHZhbHVlIHRvIGJlIHVzZWQgZm9yIHRoZSBzcGFjZXIgZWxlbWVudC4gKi9cbiAgX3RvdGFsQ29udGVudEhlaWdodCA9ICcnO1xuXG4gIC8qKlxuICAgKiBUaGUgQ1NTIHRyYW5zZm9ybSBhcHBsaWVkIHRvIHRoZSByZW5kZXJlZCBzdWJzZXQgb2YgaXRlbXMgc28gdGhhdCB0aGV5IGFwcGVhciB3aXRoaW4gdGhlIGJvdW5kc1xuICAgKiBvZiB0aGUgdmlzaWJsZSB2aWV3cG9ydC5cbiAgICovXG4gIHByaXZhdGUgX3JlbmRlcmVkQ29udGVudFRyYW5zZm9ybTogc3RyaW5nO1xuXG4gIC8qKiBUaGUgY3VycmVudGx5IHJlbmRlcmVkIHJhbmdlIG9mIGluZGljZXMuICovXG4gIHByaXZhdGUgX3JlbmRlcmVkUmFuZ2U6IExpc3RSYW5nZSA9IHtzdGFydDogMCwgZW5kOiAwfTtcblxuICAvKiogVGhlIGxlbmd0aCBvZiB0aGUgZGF0YSBib3VuZCB0byB0aGlzIHZpZXdwb3J0IChpbiBudW1iZXIgb2YgaXRlbXMpLiAqL1xuICBwcml2YXRlIF9kYXRhTGVuZ3RoID0gMDtcblxuICAvKiogVGhlIHNpemUgb2YgdGhlIHZpZXdwb3J0IChpbiBwaXhlbHMpLiAqL1xuICBwcml2YXRlIF92aWV3cG9ydFNpemUgPSAwO1xuXG4gIC8qKiB0aGUgY3VycmVudGx5IGF0dGFjaGVkIENka1ZpcnR1YWxTY3JvbGxSZXBlYXRlci4gKi9cbiAgcHJpdmF0ZSBfZm9yT2Y6IENka1ZpcnR1YWxTY3JvbGxSZXBlYXRlcjxhbnk+IHwgbnVsbDtcblxuICAvKiogVGhlIGxhc3QgcmVuZGVyZWQgY29udGVudCBvZmZzZXQgdGhhdCB3YXMgc2V0LiAqL1xuICBwcml2YXRlIF9yZW5kZXJlZENvbnRlbnRPZmZzZXQgPSAwO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBsYXN0IHJlbmRlcmVkIGNvbnRlbnQgb2Zmc2V0IHdhcyB0byB0aGUgZW5kIG9mIHRoZSBjb250ZW50IChhbmQgdGhlcmVmb3JlIG5lZWRzIHRvXG4gICAqIGJlIHJld3JpdHRlbiBhcyBhbiBvZmZzZXQgdG8gdGhlIHN0YXJ0IG9mIHRoZSBjb250ZW50KS5cbiAgICovXG4gIHByaXZhdGUgX3JlbmRlcmVkQ29udGVudE9mZnNldE5lZWRzUmV3cml0ZSA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIHRoZXJlIGlzIGEgcGVuZGluZyBjaGFuZ2UgZGV0ZWN0aW9uIGN5Y2xlLiAqL1xuICBwcml2YXRlIF9pc0NoYW5nZURldGVjdGlvblBlbmRpbmcgPSBmYWxzZTtcblxuICAvKiogQSBsaXN0IG9mIGZ1bmN0aW9ucyB0byBydW4gYWZ0ZXIgdGhlIG5leHQgY2hhbmdlIGRldGVjdGlvbiBjeWNsZS4gKi9cbiAgcHJpdmF0ZSBfcnVuQWZ0ZXJDaGFuZ2VEZXRlY3Rpb246IEZ1bmN0aW9uW10gPSBbXTtcblxuICAvKiogU3Vic2NyaXB0aW9uIHRvIGNoYW5nZXMgaW4gdGhlIHZpZXdwb3J0IHNpemUuICovXG4gIHByaXZhdGUgX3ZpZXdwb3J0Q2hhbmdlcyA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgb3ZlcnJpZGUgZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgcHJpdmF0ZSBfY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmLFxuICAgIG5nWm9uZTogTmdab25lLFxuICAgIEBPcHRpb25hbCgpXG4gICAgQEluamVjdChWSVJUVUFMX1NDUk9MTF9TVFJBVEVHWSlcbiAgICBwcml2YXRlIF9zY3JvbGxTdHJhdGVneTogVmlydHVhbFNjcm9sbFN0cmF0ZWd5LFxuICAgIEBPcHRpb25hbCgpIGRpcjogRGlyZWN0aW9uYWxpdHksXG4gICAgc2Nyb2xsRGlzcGF0Y2hlcjogU2Nyb2xsRGlzcGF0Y2hlcixcbiAgICB2aWV3cG9ydFJ1bGVyOiBWaWV3cG9ydFJ1bGVyLFxuICApIHtcbiAgICBzdXBlcihlbGVtZW50UmVmLCBzY3JvbGxEaXNwYXRjaGVyLCBuZ1pvbmUsIGRpcik7XG5cbiAgICBpZiAoIV9zY3JvbGxTdHJhdGVneSAmJiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgdGhyb3cgRXJyb3IoJ0Vycm9yOiBjZGstdmlydHVhbC1zY3JvbGwtdmlld3BvcnQgcmVxdWlyZXMgdGhlIFwiaXRlbVNpemVcIiBwcm9wZXJ0eSB0byBiZSBzZXQuJyk7XG4gICAgfVxuXG4gICAgdGhpcy5fdmlld3BvcnRDaGFuZ2VzID0gdmlld3BvcnRSdWxlci5jaGFuZ2UoKS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgdGhpcy5jaGVja1ZpZXdwb3J0U2l6ZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgb3ZlcnJpZGUgbmdPbkluaXQoKSB7XG4gICAgc3VwZXIubmdPbkluaXQoKTtcblxuICAgIC8vIEl0J3Mgc3RpbGwgdG9vIGVhcmx5IHRvIG1lYXN1cmUgdGhlIHZpZXdwb3J0IGF0IHRoaXMgcG9pbnQuIERlZmVycmluZyB3aXRoIGEgcHJvbWlzZSBhbGxvd3NcbiAgICAvLyB0aGUgVmlld3BvcnQgdG8gYmUgcmVuZGVyZWQgd2l0aCB0aGUgY29ycmVjdCBzaXplIGJlZm9yZSB3ZSBtZWFzdXJlLiBXZSBydW4gdGhpcyBvdXRzaWRlIHRoZVxuICAgIC8vIHpvbmUgdG8gYXZvaWQgY2F1c2luZyBtb3JlIGNoYW5nZSBkZXRlY3Rpb24gY3ljbGVzLiBXZSBoYW5kbGUgdGhlIGNoYW5nZSBkZXRlY3Rpb24gbG9vcFxuICAgIC8vIG91cnNlbHZlcyBpbnN0ZWFkLlxuICAgIHRoaXMubmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+XG4gICAgICBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5fbWVhc3VyZVZpZXdwb3J0U2l6ZSgpO1xuICAgICAgICB0aGlzLl9zY3JvbGxTdHJhdGVneS5hdHRhY2godGhpcyk7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50U2Nyb2xsZWQoKVxuICAgICAgICAgIC5waXBlKFxuICAgICAgICAgICAgLy8gU3RhcnQgb2ZmIHdpdGggYSBmYWtlIHNjcm9sbCBldmVudCBzbyB3ZSBwcm9wZXJseSBkZXRlY3Qgb3VyIGluaXRpYWwgcG9zaXRpb24uXG4gICAgICAgICAgICBzdGFydFdpdGgobnVsbCksXG4gICAgICAgICAgICAvLyBDb2xsZWN0IG11bHRpcGxlIGV2ZW50cyBpbnRvIG9uZSB1bnRpbCB0aGUgbmV4dCBhbmltYXRpb24gZnJhbWUuIFRoaXMgd2F5IGlmXG4gICAgICAgICAgICAvLyB0aGVyZSBhcmUgbXVsdGlwbGUgc2Nyb2xsIGV2ZW50cyBpbiB0aGUgc2FtZSBmcmFtZSB3ZSBvbmx5IG5lZWQgdG8gcmVjaGVja1xuICAgICAgICAgICAgLy8gb3VyIGxheW91dCBvbmNlLlxuICAgICAgICAgICAgYXVkaXRUaW1lKDAsIFNDUk9MTF9TQ0hFRFVMRVIpLFxuICAgICAgICAgIClcbiAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMuX3Njcm9sbFN0cmF0ZWd5Lm9uQ29udGVudFNjcm9sbGVkKCkpO1xuXG4gICAgICAgIHRoaXMuX21hcmtDaGFuZ2VEZXRlY3Rpb25OZWVkZWQoKTtcbiAgICAgIH0pLFxuICAgICk7XG4gIH1cblxuICBvdmVycmlkZSBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLmRldGFjaCgpO1xuICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5LmRldGFjaCgpO1xuXG4gICAgLy8gQ29tcGxldGUgYWxsIHN1YmplY3RzXG4gICAgdGhpcy5fcmVuZGVyZWRSYW5nZVN1YmplY3QuY29tcGxldGUoKTtcbiAgICB0aGlzLl9kZXRhY2hlZFN1YmplY3QuY29tcGxldGUoKTtcbiAgICB0aGlzLl92aWV3cG9ydENoYW5nZXMudW5zdWJzY3JpYmUoKTtcblxuICAgIHN1cGVyLm5nT25EZXN0cm95KCk7XG4gIH1cblxuICAvKiogQXR0YWNoZXMgYSBgQ2RrVmlydHVhbFNjcm9sbFJlcGVhdGVyYCB0byB0aGlzIHZpZXdwb3J0LiAqL1xuICBhdHRhY2goZm9yT2Y6IENka1ZpcnR1YWxTY3JvbGxSZXBlYXRlcjxhbnk+KSB7XG4gICAgaWYgKHRoaXMuX2Zvck9mICYmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpKSB7XG4gICAgICB0aHJvdyBFcnJvcignQ2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0IGlzIGFscmVhZHkgYXR0YWNoZWQuJyk7XG4gICAgfVxuXG4gICAgLy8gU3Vic2NyaWJlIHRvIHRoZSBkYXRhIHN0cmVhbSBvZiB0aGUgQ2RrVmlydHVhbEZvck9mIHRvIGtlZXAgdHJhY2sgb2Ygd2hlbiB0aGUgZGF0YSBsZW5ndGhcbiAgICAvLyBjaGFuZ2VzLiBSdW4gb3V0c2lkZSB0aGUgem9uZSB0byBhdm9pZCB0cmlnZ2VyaW5nIGNoYW5nZSBkZXRlY3Rpb24sIHNpbmNlIHdlJ3JlIG1hbmFnaW5nIHRoZVxuICAgIC8vIGNoYW5nZSBkZXRlY3Rpb24gbG9vcCBvdXJzZWx2ZXMuXG4gICAgdGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgdGhpcy5fZm9yT2YgPSBmb3JPZjtcbiAgICAgIHRoaXMuX2Zvck9mLmRhdGFTdHJlYW0ucGlwZSh0YWtlVW50aWwodGhpcy5fZGV0YWNoZWRTdWJqZWN0KSkuc3Vic2NyaWJlKGRhdGEgPT4ge1xuICAgICAgICBjb25zdCBuZXdMZW5ndGggPSBkYXRhLmxlbmd0aDtcbiAgICAgICAgaWYgKG5ld0xlbmd0aCAhPT0gdGhpcy5fZGF0YUxlbmd0aCkge1xuICAgICAgICAgIHRoaXMuX2RhdGFMZW5ndGggPSBuZXdMZW5ndGg7XG4gICAgICAgICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kub25EYXRhTGVuZ3RoQ2hhbmdlZCgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2RvQ2hhbmdlRGV0ZWN0aW9uKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBEZXRhY2hlcyB0aGUgY3VycmVudCBgQ2RrVmlydHVhbEZvck9mYC4gKi9cbiAgZGV0YWNoKCkge1xuICAgIHRoaXMuX2Zvck9mID0gbnVsbDtcbiAgICB0aGlzLl9kZXRhY2hlZFN1YmplY3QubmV4dCgpO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIGxlbmd0aCBvZiB0aGUgZGF0YSBib3VuZCB0byB0aGlzIHZpZXdwb3J0IChpbiBudW1iZXIgb2YgaXRlbXMpLiAqL1xuICBnZXREYXRhTGVuZ3RoKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX2RhdGFMZW5ndGg7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgc2l6ZSBvZiB0aGUgdmlld3BvcnQgKGluIHBpeGVscykuICovXG4gIGdldFZpZXdwb3J0U2l6ZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92aWV3cG9ydFNpemU7XG4gIH1cblxuICAvLyBUT0RPKG1tYWxlcmJhKTogVGhpcyBpcyB0ZWNobmljYWxseSBvdXQgb2Ygc3luYyB3aXRoIHdoYXQncyByZWFsbHkgcmVuZGVyZWQgdW50aWwgYSByZW5kZXJcbiAgLy8gY3ljbGUgaGFwcGVucy4gSSdtIGJlaW5nIGNhcmVmdWwgdG8gb25seSBjYWxsIGl0IGFmdGVyIHRoZSByZW5kZXIgY3ljbGUgaXMgY29tcGxldGUgYW5kIGJlZm9yZVxuICAvLyBzZXR0aW5nIGl0IHRvIHNvbWV0aGluZyBlbHNlLCBidXQgaXRzIGVycm9yIHByb25lIGFuZCBzaG91bGQgcHJvYmFibHkgYmUgc3BsaXQgaW50b1xuICAvLyBgcGVuZGluZ1JhbmdlYCBhbmQgYHJlbmRlcmVkUmFuZ2VgLCB0aGUgbGF0dGVyIHJlZmxlY3Rpbmcgd2hhdHMgYWN0dWFsbHkgaW4gdGhlIERPTS5cblxuICAvKiogR2V0IHRoZSBjdXJyZW50IHJlbmRlcmVkIHJhbmdlIG9mIGl0ZW1zLiAqL1xuICBnZXRSZW5kZXJlZFJhbmdlKCk6IExpc3RSYW5nZSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlbmRlcmVkUmFuZ2U7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdG90YWwgc2l6ZSBvZiBhbGwgY29udGVudCAoaW4gcGl4ZWxzKSwgaW5jbHVkaW5nIGNvbnRlbnQgdGhhdCBpcyBub3QgY3VycmVudGx5XG4gICAqIHJlbmRlcmVkLlxuICAgKi9cbiAgc2V0VG90YWxDb250ZW50U2l6ZShzaXplOiBudW1iZXIpIHtcbiAgICBpZiAodGhpcy5fdG90YWxDb250ZW50U2l6ZSAhPT0gc2l6ZSkge1xuICAgICAgdGhpcy5fdG90YWxDb250ZW50U2l6ZSA9IHNpemU7XG4gICAgICB0aGlzLl9jYWxjdWxhdGVTcGFjZXJTaXplKCk7XG4gICAgICB0aGlzLl9tYXJrQ2hhbmdlRGV0ZWN0aW9uTmVlZGVkKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFNldHMgdGhlIGN1cnJlbnRseSByZW5kZXJlZCByYW5nZSBvZiBpbmRpY2VzLiAqL1xuICBzZXRSZW5kZXJlZFJhbmdlKHJhbmdlOiBMaXN0UmFuZ2UpIHtcbiAgICBpZiAoIXJhbmdlc0VxdWFsKHRoaXMuX3JlbmRlcmVkUmFuZ2UsIHJhbmdlKSkge1xuICAgICAgaWYgKHRoaXMuYXBwZW5kT25seSkge1xuICAgICAgICByYW5nZSA9IHtzdGFydDogMCwgZW5kOiBNYXRoLm1heCh0aGlzLl9yZW5kZXJlZFJhbmdlLmVuZCwgcmFuZ2UuZW5kKX07XG4gICAgICB9XG4gICAgICB0aGlzLl9yZW5kZXJlZFJhbmdlU3ViamVjdC5uZXh0KCh0aGlzLl9yZW5kZXJlZFJhbmdlID0gcmFuZ2UpKTtcbiAgICAgIHRoaXMuX21hcmtDaGFuZ2VEZXRlY3Rpb25OZWVkZWQoKCkgPT4gdGhpcy5fc2Nyb2xsU3RyYXRlZ3kub25Db250ZW50UmVuZGVyZWQoKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG9mZnNldCBmcm9tIHRoZSBzdGFydCBvZiB0aGUgdmlld3BvcnQgdG8gdGhlIHN0YXJ0IG9mIHRoZSByZW5kZXJlZCBkYXRhIChpbiBwaXhlbHMpLlxuICAgKi9cbiAgZ2V0T2Zmc2V0VG9SZW5kZXJlZENvbnRlbnRTdGFydCgpOiBudW1iZXIgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0TmVlZHNSZXdyaXRlID8gbnVsbCA6IHRoaXMuX3JlbmRlcmVkQ29udGVudE9mZnNldDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBvZmZzZXQgZnJvbSB0aGUgc3RhcnQgb2YgdGhlIHZpZXdwb3J0IHRvIGVpdGhlciB0aGUgc3RhcnQgb3IgZW5kIG9mIHRoZSByZW5kZXJlZCBkYXRhXG4gICAqIChpbiBwaXhlbHMpLlxuICAgKi9cbiAgc2V0UmVuZGVyZWRDb250ZW50T2Zmc2V0KG9mZnNldDogbnVtYmVyLCB0bzogJ3RvLXN0YXJ0JyB8ICd0by1lbmQnID0gJ3RvLXN0YXJ0Jykge1xuICAgIC8vIEluIGFwcGVuZE9ubHksIHdlIGFsd2F5cyBzdGFydCBmcm9tIHRoZSB0b3BcbiAgICBvZmZzZXQgPSB0aGlzLmFwcGVuZE9ubHkgJiYgdG8gPT09ICd0by1zdGFydCcgPyAwIDogb2Zmc2V0O1xuXG4gICAgLy8gRm9yIGEgaG9yaXpvbnRhbCB2aWV3cG9ydCBpbiBhIHJpZ2h0LXRvLWxlZnQgbGFuZ3VhZ2Ugd2UgbmVlZCB0byB0cmFuc2xhdGUgYWxvbmcgdGhlIHgtYXhpc1xuICAgIC8vIGluIHRoZSBuZWdhdGl2ZSBkaXJlY3Rpb24uXG4gICAgY29uc3QgaXNSdGwgPSB0aGlzLmRpciAmJiB0aGlzLmRpci52YWx1ZSA9PSAncnRsJztcbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLm9yaWVudGF0aW9uID09ICdob3Jpem9udGFsJztcbiAgICBjb25zdCBheGlzID0gaXNIb3Jpem9udGFsID8gJ1gnIDogJ1knO1xuICAgIGNvbnN0IGF4aXNEaXJlY3Rpb24gPSBpc0hvcml6b250YWwgJiYgaXNSdGwgPyAtMSA6IDE7XG4gICAgbGV0IHRyYW5zZm9ybSA9IGB0cmFuc2xhdGUke2F4aXN9KCR7TnVtYmVyKGF4aXNEaXJlY3Rpb24gKiBvZmZzZXQpfXB4KWA7XG4gICAgdGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0ID0gb2Zmc2V0O1xuICAgIGlmICh0byA9PT0gJ3RvLWVuZCcpIHtcbiAgICAgIHRyYW5zZm9ybSArPSBgIHRyYW5zbGF0ZSR7YXhpc30oLTEwMCUpYDtcbiAgICAgIC8vIFRoZSB2aWV3cG9ydCBzaG91bGQgcmV3cml0ZSB0aGlzIGFzIGEgYHRvLXN0YXJ0YCBvZmZzZXQgb24gdGhlIG5leHQgcmVuZGVyIGN5Y2xlLiBPdGhlcndpc2VcbiAgICAgIC8vIGVsZW1lbnRzIHdpbGwgYXBwZWFyIHRvIGV4cGFuZCBpbiB0aGUgd3JvbmcgZGlyZWN0aW9uIChlLmcuIGBtYXQtZXhwYW5zaW9uLXBhbmVsYCB3b3VsZFxuICAgICAgLy8gZXhwYW5kIHVwd2FyZCkuXG4gICAgICB0aGlzLl9yZW5kZXJlZENvbnRlbnRPZmZzZXROZWVkc1Jld3JpdGUgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAodGhpcy5fcmVuZGVyZWRDb250ZW50VHJhbnNmb3JtICE9IHRyYW5zZm9ybSkge1xuICAgICAgLy8gV2Uga25vdyB0aGlzIHZhbHVlIGlzIHNhZmUgYmVjYXVzZSB3ZSBwYXJzZSBgb2Zmc2V0YCB3aXRoIGBOdW1iZXIoKWAgYmVmb3JlIHBhc3NpbmcgaXRcbiAgICAgIC8vIGludG8gdGhlIHN0cmluZy5cbiAgICAgIHRoaXMuX3JlbmRlcmVkQ29udGVudFRyYW5zZm9ybSA9IHRyYW5zZm9ybTtcbiAgICAgIHRoaXMuX21hcmtDaGFuZ2VEZXRlY3Rpb25OZWVkZWQoKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0TmVlZHNSZXdyaXRlKSB7XG4gICAgICAgICAgdGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0IC09IHRoaXMubWVhc3VyZVJlbmRlcmVkQ29udGVudFNpemUoKTtcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlZENvbnRlbnRPZmZzZXROZWVkc1Jld3JpdGUgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLnNldFJlbmRlcmVkQ29udGVudE9mZnNldCh0aGlzLl9yZW5kZXJlZENvbnRlbnRPZmZzZXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5Lm9uUmVuZGVyZWRPZmZzZXRDaGFuZ2VkKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTY3JvbGxzIHRvIHRoZSBnaXZlbiBvZmZzZXQgZnJvbSB0aGUgc3RhcnQgb2YgdGhlIHZpZXdwb3J0LiBQbGVhc2Ugbm90ZSB0aGF0IHRoaXMgaXMgbm90IGFsd2F5c1xuICAgKiB0aGUgc2FtZSBhcyBzZXR0aW5nIGBzY3JvbGxUb3BgIG9yIGBzY3JvbGxMZWZ0YC4gSW4gYSBob3Jpem9udGFsIHZpZXdwb3J0IHdpdGggcmlnaHQtdG8tbGVmdFxuICAgKiBkaXJlY3Rpb24sIHRoaXMgd291bGQgYmUgdGhlIGVxdWl2YWxlbnQgb2Ygc2V0dGluZyBhIGZpY3Rpb25hbCBgc2Nyb2xsUmlnaHRgIHByb3BlcnR5LlxuICAgKiBAcGFyYW0gb2Zmc2V0IFRoZSBvZmZzZXQgdG8gc2Nyb2xsIHRvLlxuICAgKiBAcGFyYW0gYmVoYXZpb3IgVGhlIFNjcm9sbEJlaGF2aW9yIHRvIHVzZSB3aGVuIHNjcm9sbGluZy4gRGVmYXVsdCBpcyBiZWhhdmlvciBpcyBgYXV0b2AuXG4gICAqL1xuICBzY3JvbGxUb09mZnNldChvZmZzZXQ6IG51bWJlciwgYmVoYXZpb3I6IFNjcm9sbEJlaGF2aW9yID0gJ2F1dG8nKSB7XG4gICAgY29uc3Qgb3B0aW9uczogRXh0ZW5kZWRTY3JvbGxUb09wdGlvbnMgPSB7YmVoYXZpb3J9O1xuICAgIGlmICh0aGlzLm9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcpIHtcbiAgICAgIG9wdGlvbnMuc3RhcnQgPSBvZmZzZXQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdGlvbnMudG9wID0gb2Zmc2V0O1xuICAgIH1cbiAgICB0aGlzLnNjcm9sbFRvKG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNjcm9sbHMgdG8gdGhlIG9mZnNldCBmb3IgdGhlIGdpdmVuIGluZGV4LlxuICAgKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IHRvIHNjcm9sbCB0by5cbiAgICogQHBhcmFtIGJlaGF2aW9yIFRoZSBTY3JvbGxCZWhhdmlvciB0byB1c2Ugd2hlbiBzY3JvbGxpbmcuIERlZmF1bHQgaXMgYmVoYXZpb3IgaXMgYGF1dG9gLlxuICAgKi9cbiAgc2Nyb2xsVG9JbmRleChpbmRleDogbnVtYmVyLCBiZWhhdmlvcjogU2Nyb2xsQmVoYXZpb3IgPSAnYXV0bycpIHtcbiAgICB0aGlzLl9zY3JvbGxTdHJhdGVneS5zY3JvbGxUb0luZGV4KGluZGV4LCBiZWhhdmlvcik7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCBzY3JvbGwgb2Zmc2V0IGZyb20gdGhlIHN0YXJ0IG9mIHRoZSB2aWV3cG9ydCAoaW4gcGl4ZWxzKS5cbiAgICogQHBhcmFtIGZyb20gVGhlIGVkZ2UgdG8gbWVhc3VyZSB0aGUgb2Zmc2V0IGZyb20uIERlZmF1bHRzIHRvICd0b3AnIGluIHZlcnRpY2FsIG1vZGUgYW5kICdzdGFydCdcbiAgICogICAgIGluIGhvcml6b250YWwgbW9kZS5cbiAgICovXG4gIG92ZXJyaWRlIG1lYXN1cmVTY3JvbGxPZmZzZXQoXG4gICAgZnJvbT86ICd0b3AnIHwgJ2xlZnQnIHwgJ3JpZ2h0JyB8ICdib3R0b20nIHwgJ3N0YXJ0JyB8ICdlbmQnLFxuICApOiBudW1iZXIge1xuICAgIHJldHVybiBmcm9tXG4gICAgICA/IHN1cGVyLm1lYXN1cmVTY3JvbGxPZmZzZXQoZnJvbSlcbiAgICAgIDogc3VwZXIubWVhc3VyZVNjcm9sbE9mZnNldCh0aGlzLm9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcgPyAnc3RhcnQnIDogJ3RvcCcpO1xuICB9XG5cbiAgLyoqIE1lYXN1cmUgdGhlIGNvbWJpbmVkIHNpemUgb2YgYWxsIG9mIHRoZSByZW5kZXJlZCBpdGVtcy4gKi9cbiAgbWVhc3VyZVJlbmRlcmVkQ29udGVudFNpemUoKTogbnVtYmVyIHtcbiAgICBjb25zdCBjb250ZW50RWwgPSB0aGlzLl9jb250ZW50V3JhcHBlci5uYXRpdmVFbGVtZW50O1xuICAgIHJldHVybiB0aGlzLm9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcgPyBjb250ZW50RWwub2Zmc2V0V2lkdGggOiBjb250ZW50RWwub2Zmc2V0SGVpZ2h0O1xuICB9XG5cbiAgLyoqXG4gICAqIE1lYXN1cmUgdGhlIHRvdGFsIGNvbWJpbmVkIHNpemUgb2YgdGhlIGdpdmVuIHJhbmdlLiBUaHJvd3MgaWYgdGhlIHJhbmdlIGluY2x1ZGVzIGl0ZW1zIHRoYXQgYXJlXG4gICAqIG5vdCByZW5kZXJlZC5cbiAgICovXG4gIG1lYXN1cmVSYW5nZVNpemUocmFuZ2U6IExpc3RSYW5nZSk6IG51bWJlciB7XG4gICAgaWYgKCF0aGlzLl9mb3JPZikge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9mb3JPZi5tZWFzdXJlUmFuZ2VTaXplKHJhbmdlLCB0aGlzLm9yaWVudGF0aW9uKTtcbiAgfVxuXG4gIC8qKiBVcGRhdGUgdGhlIHZpZXdwb3J0IGRpbWVuc2lvbnMgYW5kIHJlLXJlbmRlci4gKi9cbiAgY2hlY2tWaWV3cG9ydFNpemUoKSB7XG4gICAgLy8gVE9ETzogQ2xlYW51cCBsYXRlciB3aGVuIGFkZCBsb2dpYyBmb3IgaGFuZGxpbmcgY29udGVudCByZXNpemVcbiAgICB0aGlzLl9tZWFzdXJlVmlld3BvcnRTaXplKCk7XG4gICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kub25EYXRhTGVuZ3RoQ2hhbmdlZCgpO1xuICB9XG5cbiAgLyoqIE1lYXN1cmUgdGhlIHZpZXdwb3J0IHNpemUuICovXG4gIHByaXZhdGUgX21lYXN1cmVWaWV3cG9ydFNpemUoKSB7XG4gICAgY29uc3Qgdmlld3BvcnRFbCA9IHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50O1xuICAgIHRoaXMuX3ZpZXdwb3J0U2l6ZSA9XG4gICAgICB0aGlzLm9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcgPyB2aWV3cG9ydEVsLmNsaWVudFdpZHRoIDogdmlld3BvcnRFbC5jbGllbnRIZWlnaHQ7XG4gIH1cblxuICAvKiogUXVldWUgdXAgY2hhbmdlIGRldGVjdGlvbiB0byBydW4uICovXG4gIHByaXZhdGUgX21hcmtDaGFuZ2VEZXRlY3Rpb25OZWVkZWQocnVuQWZ0ZXI/OiBGdW5jdGlvbikge1xuICAgIGlmIChydW5BZnRlcikge1xuICAgICAgdGhpcy5fcnVuQWZ0ZXJDaGFuZ2VEZXRlY3Rpb24ucHVzaChydW5BZnRlcik7XG4gICAgfVxuXG4gICAgLy8gVXNlIGEgUHJvbWlzZSB0byBiYXRjaCB0b2dldGhlciBjYWxscyB0byBgX2RvQ2hhbmdlRGV0ZWN0aW9uYC4gVGhpcyB3YXkgaWYgd2Ugc2V0IGEgYnVuY2ggb2ZcbiAgICAvLyBwcm9wZXJ0aWVzIHNlcXVlbnRpYWxseSB3ZSBvbmx5IGhhdmUgdG8gcnVuIGBfZG9DaGFuZ2VEZXRlY3Rpb25gIG9uY2UgYXQgdGhlIGVuZC5cbiAgICBpZiAoIXRoaXMuX2lzQ2hhbmdlRGV0ZWN0aW9uUGVuZGluZykge1xuICAgICAgdGhpcy5faXNDaGFuZ2VEZXRlY3Rpb25QZW5kaW5nID0gdHJ1ZTtcbiAgICAgIHRoaXMubmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+XG4gICAgICAgIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHRoaXMuX2RvQ2hhbmdlRGV0ZWN0aW9uKCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICAvKiogUnVuIGNoYW5nZSBkZXRlY3Rpb24uICovXG4gIHByaXZhdGUgX2RvQ2hhbmdlRGV0ZWN0aW9uKCkge1xuICAgIHRoaXMuX2lzQ2hhbmdlRGV0ZWN0aW9uUGVuZGluZyA9IGZhbHNlO1xuXG4gICAgLy8gQXBwbHkgdGhlIGNvbnRlbnQgdHJhbnNmb3JtLiBUaGUgdHJhbnNmb3JtIGNhbid0IGJlIHNldCB2aWEgYW4gQW5ndWxhciBiaW5kaW5nIGJlY2F1c2VcbiAgICAvLyBieXBhc3NTZWN1cml0eVRydXN0U3R5bGUgaXMgYmFubmVkIGluIEdvb2dsZS4gSG93ZXZlciB0aGUgdmFsdWUgaXMgc2FmZSwgaXQncyBjb21wb3NlZCBvZlxuICAgIC8vIHN0cmluZyBsaXRlcmFscywgYSB2YXJpYWJsZSB0aGF0IGNhbiBvbmx5IGJlICdYJyBvciAnWScsIGFuZCB1c2VyIGlucHV0IHRoYXQgaXMgcnVuIHRocm91Z2hcbiAgICAvLyB0aGUgYE51bWJlcmAgZnVuY3Rpb24gZmlyc3QgdG8gY29lcmNlIGl0IHRvIGEgbnVtZXJpYyB2YWx1ZS5cbiAgICB0aGlzLl9jb250ZW50V3JhcHBlci5uYXRpdmVFbGVtZW50LnN0eWxlLnRyYW5zZm9ybSA9IHRoaXMuX3JlbmRlcmVkQ29udGVudFRyYW5zZm9ybTtcbiAgICAvLyBBcHBseSBjaGFuZ2VzIHRvIEFuZ3VsYXIgYmluZGluZ3MuIE5vdGU6IFdlIG11c3QgY2FsbCBgbWFya0ZvckNoZWNrYCB0byBydW4gY2hhbmdlIGRldGVjdGlvblxuICAgIC8vIGZyb20gdGhlIHJvb3QsIHNpbmNlIHRoZSByZXBlYXRlZCBpdGVtcyBhcmUgY29udGVudCBwcm9qZWN0ZWQgaW4uIENhbGxpbmcgYGRldGVjdENoYW5nZXNgXG4gICAgLy8gaW5zdGVhZCBkb2VzIG5vdCBwcm9wZXJseSBjaGVjayB0aGUgcHJvamVjdGVkIGNvbnRlbnQuXG4gICAgdGhpcy5uZ1pvbmUucnVuKCgpID0+IHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpKTtcblxuICAgIGNvbnN0IHJ1bkFmdGVyQ2hhbmdlRGV0ZWN0aW9uID0gdGhpcy5fcnVuQWZ0ZXJDaGFuZ2VEZXRlY3Rpb247XG4gICAgdGhpcy5fcnVuQWZ0ZXJDaGFuZ2VEZXRlY3Rpb24gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGZuIG9mIHJ1bkFmdGVyQ2hhbmdlRGV0ZWN0aW9uKSB7XG4gICAgICBmbigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDYWxjdWxhdGVzIHRoZSBgc3R5bGUud2lkdGhgIGFuZCBgc3R5bGUuaGVpZ2h0YCBmb3IgdGhlIHNwYWNlciBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9jYWxjdWxhdGVTcGFjZXJTaXplKCkge1xuICAgIHRoaXMuX3RvdGFsQ29udGVudEhlaWdodCA9XG4gICAgICB0aGlzLm9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcgPyAnJyA6IGAke3RoaXMuX3RvdGFsQ29udGVudFNpemV9cHhgO1xuICAgIHRoaXMuX3RvdGFsQ29udGVudFdpZHRoID1cbiAgICAgIHRoaXMub3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJyA/IGAke3RoaXMuX3RvdGFsQ29udGVudFNpemV9cHhgIDogJyc7XG4gIH1cbn1cbiIsIjwhLS1cbiAgV3JhcCB0aGUgcmVuZGVyZWQgY29udGVudCBpbiBhbiBlbGVtZW50IHRoYXQgd2lsbCBiZSB1c2VkIHRvIG9mZnNldCBpdCBiYXNlZCBvbiB0aGUgc2Nyb2xsXG4gIHBvc2l0aW9uLlxuLS0+XG48ZGl2ICNjb250ZW50V3JhcHBlciBjbGFzcz1cImNkay12aXJ0dWFsLXNjcm9sbC1jb250ZW50LXdyYXBwZXJcIj5cbiAgPG5nLWNvbnRlbnQ+PC9uZy1jb250ZW50PlxuPC9kaXY+XG48IS0tXG4gIFNwYWNlciB1c2VkIHRvIGZvcmNlIHRoZSBzY3JvbGxpbmcgY29udGFpbmVyIHRvIHRoZSBjb3JyZWN0IHNpemUgZm9yIHRoZSAqdG90YWwqIG51bWJlciBvZiBpdGVtc1xuICBzbyB0aGF0IHRoZSBzY3JvbGxiYXIgY2FwdHVyZXMgdGhlIHNpemUgb2YgdGhlIGVudGlyZSBkYXRhIHNldC5cbi0tPlxuPGRpdiBjbGFzcz1cImNkay12aXJ0dWFsLXNjcm9sbC1zcGFjZXJcIlxuICAgICBbc3R5bGUud2lkdGhdPVwiX3RvdGFsQ29udGVudFdpZHRoXCIgW3N0eWxlLmhlaWdodF09XCJfdG90YWxDb250ZW50SGVpZ2h0XCI+PC9kaXY+XG4iXX0=