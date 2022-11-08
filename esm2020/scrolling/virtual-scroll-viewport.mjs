/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directionality } from '@angular/cdk/bidi';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, inject, Inject, Input, NgZone, Optional, Output, ViewChild, ViewEncapsulation, } from '@angular/core';
import { Platform } from '@angular/cdk/platform';
import { animationFrameScheduler, asapScheduler, Observable, Subject, Subscription, } from 'rxjs';
import { auditTime, startWith, takeUntil } from 'rxjs/operators';
import { ScrollDispatcher } from './scroll-dispatcher';
import { CdkScrollable } from './scrollable';
import { VIRTUAL_SCROLL_STRATEGY } from './virtual-scroll-strategy';
import { ViewportRuler } from './viewport-ruler';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { CdkVirtualScrollable, VIRTUAL_SCROLLABLE } from './virtual-scrollable';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/bidi";
import * as i2 from "./scroll-dispatcher";
import * as i3 from "./viewport-ruler";
import * as i4 from "./virtual-scrollable";
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
export class CdkVirtualScrollViewport extends CdkVirtualScrollable {
    constructor(elementRef, _changeDetectorRef, ngZone, _scrollStrategy, dir, scrollDispatcher, viewportRuler, scrollable) {
        super(elementRef, scrollDispatcher, ngZone, dir);
        this.elementRef = elementRef;
        this._changeDetectorRef = _changeDetectorRef;
        this._scrollStrategy = _scrollStrategy;
        this.scrollable = scrollable;
        this._platform = inject(Platform);
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
        if (!this.scrollable) {
            // No scrollable is provided, so the virtual-scroll-viewport needs to become a scrollable
            this.elementRef.nativeElement.classList.add('cdk-virtual-scrollable');
            this.scrollable = this;
        }
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
        // Scrolling depends on the element dimensions which we can't get during SSR.
        if (!this._platform.isBrowser) {
            return;
        }
        if (this.scrollable === this) {
            super.ngOnInit();
        }
        // It's still too early to measure the viewport at this point. Deferring with a promise allows
        // the Viewport to be rendered with the correct size before we measure. We run this outside the
        // zone to avoid causing more change detection cycles. We handle the change detection loop
        // ourselves instead.
        this.ngZone.runOutsideAngular(() => Promise.resolve().then(() => {
            this._measureViewportSize();
            this._scrollStrategy.attach(this);
            this.scrollable
                .elementScrolled()
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
    measureBoundingClientRectWithScrollOffset(from) {
        return this.getElementRef().nativeElement.getBoundingClientRect()[from];
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
        this.scrollable.scrollTo(options);
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
     * Gets the current scroll offset from the start of the scrollable (in pixels).
     * @param from The edge to measure the offset from. Defaults to 'top' in vertical mode and 'start'
     *     in horizontal mode.
     */
    measureScrollOffset(from) {
        // This is to break the call cycle
        let measureScrollOffset;
        if (this.scrollable == this) {
            measureScrollOffset = (_from) => super.measureScrollOffset(_from);
        }
        else {
            measureScrollOffset = (_from) => this.scrollable.measureScrollOffset(_from);
        }
        return Math.max(0, measureScrollOffset(from ?? (this.orientation === 'horizontal' ? 'start' : 'top')) -
            this.measureViewportOffset());
    }
    /**
     * Measures the offset of the viewport from the scrolling container
     * @param from The edge to measure from.
     */
    measureViewportOffset(from) {
        let fromRect;
        const LEFT = 'left';
        const RIGHT = 'right';
        const isRtl = this.dir?.value == 'rtl';
        if (from == 'start') {
            fromRect = isRtl ? RIGHT : LEFT;
        }
        else if (from == 'end') {
            fromRect = isRtl ? LEFT : RIGHT;
        }
        else if (from) {
            fromRect = from;
        }
        else {
            fromRect = this.orientation === 'horizontal' ? 'left' : 'top';
        }
        const scrollerClientRect = this.scrollable.measureBoundingClientRectWithScrollOffset(fromRect);
        const viewportClientRect = this.elementRef.nativeElement.getBoundingClientRect()[fromRect];
        return viewportClientRect - scrollerClientRect;
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
        this._viewportSize = this.scrollable.measureViewportSize(this.orientation);
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
CdkVirtualScrollViewport.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.0.0-rc.1", ngImport: i0, type: CdkVirtualScrollViewport, deps: [{ token: i0.ElementRef }, { token: i0.ChangeDetectorRef }, { token: i0.NgZone }, { token: VIRTUAL_SCROLL_STRATEGY, optional: true }, { token: i1.Directionality, optional: true }, { token: i2.ScrollDispatcher }, { token: i3.ViewportRuler }, { token: VIRTUAL_SCROLLABLE, optional: true }], target: i0.ɵɵFactoryTarget.Component });
CdkVirtualScrollViewport.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.0.0-rc.1", type: CdkVirtualScrollViewport, selector: "cdk-virtual-scroll-viewport", inputs: { orientation: "orientation", appendOnly: "appendOnly" }, outputs: { scrolledIndexChange: "scrolledIndexChange" }, host: { properties: { "class.cdk-virtual-scroll-orientation-horizontal": "orientation === \"horizontal\"", "class.cdk-virtual-scroll-orientation-vertical": "orientation !== \"horizontal\"" }, classAttribute: "cdk-virtual-scroll-viewport" }, providers: [
        {
            provide: CdkScrollable,
            useFactory: (virtualScrollable, viewport) => virtualScrollable || viewport,
            deps: [[new Optional(), new Inject(VIRTUAL_SCROLLABLE)], CdkVirtualScrollViewport],
        },
    ], viewQueries: [{ propertyName: "_contentWrapper", first: true, predicate: ["contentWrapper"], descendants: true, static: true }], usesInheritance: true, ngImport: i0, template: "<!--\n  Wrap the rendered content in an element that will be used to offset it based on the scroll\n  position.\n-->\n<div #contentWrapper class=\"cdk-virtual-scroll-content-wrapper\">\n  <ng-content></ng-content>\n</div>\n<!--\n  Spacer used to force the scrolling container to the correct size for the *total* number of items\n  so that the scrollbar captures the size of the entire data set.\n-->\n<div class=\"cdk-virtual-scroll-spacer\"\n     [style.width]=\"_totalContentWidth\" [style.height]=\"_totalContentHeight\"></div>\n", styles: ["cdk-virtual-scroll-viewport{display:block;position:relative;transform:translateZ(0)}.cdk-virtual-scrollable{overflow:auto;will-change:scroll-position;contain:strict;-webkit-overflow-scrolling:touch}.cdk-virtual-scroll-content-wrapper{position:absolute;top:0;left:0;contain:content}[dir=rtl] .cdk-virtual-scroll-content-wrapper{right:0;left:auto}.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper{min-height:100%}.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>dl:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>ol:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>table:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>ul:not([cdkVirtualFor]){padding-left:0;padding-right:0;margin-left:0;margin-right:0;border-left-width:0;border-right-width:0;outline:none}.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper{min-width:100%}.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>dl:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>ol:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>table:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>ul:not([cdkVirtualFor]){padding-top:0;padding-bottom:0;margin-top:0;margin-bottom:0;border-top-width:0;border-bottom-width:0;outline:none}.cdk-virtual-scroll-spacer{height:1px;transform-origin:0 0;flex:0 0 auto}[dir=rtl] .cdk-virtual-scroll-spacer{transform-origin:100% 0}"], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.0.0-rc.1", ngImport: i0, type: CdkVirtualScrollViewport, decorators: [{
            type: Component,
            args: [{ selector: 'cdk-virtual-scroll-viewport', host: {
                        'class': 'cdk-virtual-scroll-viewport',
                        '[class.cdk-virtual-scroll-orientation-horizontal]': 'orientation === "horizontal"',
                        '[class.cdk-virtual-scroll-orientation-vertical]': 'orientation !== "horizontal"',
                    }, encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush, providers: [
                        {
                            provide: CdkScrollable,
                            useFactory: (virtualScrollable, viewport) => virtualScrollable || viewport,
                            deps: [[new Optional(), new Inject(VIRTUAL_SCROLLABLE)], CdkVirtualScrollViewport],
                        },
                    ], template: "<!--\n  Wrap the rendered content in an element that will be used to offset it based on the scroll\n  position.\n-->\n<div #contentWrapper class=\"cdk-virtual-scroll-content-wrapper\">\n  <ng-content></ng-content>\n</div>\n<!--\n  Spacer used to force the scrolling container to the correct size for the *total* number of items\n  so that the scrollbar captures the size of the entire data set.\n-->\n<div class=\"cdk-virtual-scroll-spacer\"\n     [style.width]=\"_totalContentWidth\" [style.height]=\"_totalContentHeight\"></div>\n", styles: ["cdk-virtual-scroll-viewport{display:block;position:relative;transform:translateZ(0)}.cdk-virtual-scrollable{overflow:auto;will-change:scroll-position;contain:strict;-webkit-overflow-scrolling:touch}.cdk-virtual-scroll-content-wrapper{position:absolute;top:0;left:0;contain:content}[dir=rtl] .cdk-virtual-scroll-content-wrapper{right:0;left:auto}.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper{min-height:100%}.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>dl:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>ol:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>table:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>ul:not([cdkVirtualFor]){padding-left:0;padding-right:0;margin-left:0;margin-right:0;border-left-width:0;border-right-width:0;outline:none}.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper{min-width:100%}.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>dl:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>ol:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>table:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>ul:not([cdkVirtualFor]){padding-top:0;padding-bottom:0;margin-top:0;margin-bottom:0;border-top-width:0;border-bottom-width:0;outline:none}.cdk-virtual-scroll-spacer{height:1px;transform-origin:0 0;flex:0 0 auto}[dir=rtl] .cdk-virtual-scroll-spacer{transform-origin:100% 0}"] }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i0.ChangeDetectorRef }, { type: i0.NgZone }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [VIRTUAL_SCROLL_STRATEGY]
                }] }, { type: i1.Directionality, decorators: [{
                    type: Optional
                }] }, { type: i2.ScrollDispatcher }, { type: i3.ViewportRuler }, { type: i4.CdkVirtualScrollable, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [VIRTUAL_SCROLLABLE]
                }] }]; }, propDecorators: { orientation: [{
                type: Input
            }], appendOnly: [{
                type: Input
            }], scrolledIndexChange: [{
                type: Output
            }], _contentWrapper: [{
                type: ViewChild,
                args: ['contentWrapper', { static: true }]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1zY3JvbGwtdmlld3BvcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy92aXJ0dWFsLXNjcm9sbC12aWV3cG9ydC50cyIsIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2Nyb2xsaW5nL3ZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRWpELE9BQU8sRUFDTCx1QkFBdUIsRUFDdkIsaUJBQWlCLEVBQ2pCLFNBQVMsRUFDVCxVQUFVLEVBQ1YsTUFBTSxFQUNOLE1BQU0sRUFDTixLQUFLLEVBQ0wsTUFBTSxFQUdOLFFBQVEsRUFDUixNQUFNLEVBQ04sU0FBUyxFQUNULGlCQUFpQixHQUNsQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDL0MsT0FBTyxFQUNMLHVCQUF1QixFQUN2QixhQUFhLEVBQ2IsVUFBVSxFQUNWLE9BQU8sRUFFUCxZQUFZLEdBQ2IsTUFBTSxNQUFNLENBQUM7QUFDZCxPQUFPLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUMvRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsYUFBYSxFQUEwQixNQUFNLGNBQWMsQ0FBQztBQUNwRSxPQUFPLEVBQUMsdUJBQXVCLEVBQXdCLE1BQU0sMkJBQTJCLENBQUM7QUFDekYsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRS9DLE9BQU8sRUFBZSxxQkFBcUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzFFLE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxrQkFBa0IsRUFBQyxN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dGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtMaXN0UmFuZ2V9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2xsZWN0aW9ucyc7XG5pbXBvcnQge1xuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIENvbXBvbmVudCxcbiAgRWxlbWVudFJlZixcbiAgaW5qZWN0LFxuICBJbmplY3QsXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgT25Jbml0LFxuICBPcHRpb25hbCxcbiAgT3V0cHV0LFxuICBWaWV3Q2hpbGQsXG4gIFZpZXdFbmNhcHN1bGF0aW9uLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7UGxhdGZvcm19IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge1xuICBhbmltYXRpb25GcmFtZVNjaGVkdWxlcixcbiAgYXNhcFNjaGVkdWxlcixcbiAgT2JzZXJ2YWJsZSxcbiAgU3ViamVjdCxcbiAgT2JzZXJ2ZXIsXG4gIFN1YnNjcmlwdGlvbixcbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2F1ZGl0VGltZSwgc3RhcnRXaXRoLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7U2Nyb2xsRGlzcGF0Y2hlcn0gZnJvbSAnLi9zY3JvbGwtZGlzcGF0Y2hlcic7XG5pbXBvcnQge0Nka1Njcm9sbGFibGUsIEV4dGVuZGVkU2Nyb2xsVG9PcHRpb25zfSBmcm9tICcuL3Njcm9sbGFibGUnO1xuaW1wb3J0IHtWSVJUVUFMX1NDUk9MTF9TVFJBVEVHWSwgVmlydHVhbFNjcm9sbFN0cmF0ZWd5fSBmcm9tICcuL3ZpcnR1YWwtc2Nyb2xsLXN0cmF0ZWd5JztcbmltcG9ydCB7Vmlld3BvcnRSdWxlcn0gZnJvbSAnLi92aWV3cG9ydC1ydWxlcic7XG5pbXBvcnQge0Nka1ZpcnR1YWxTY3JvbGxSZXBlYXRlcn0gZnJvbSAnLi92aXJ0dWFsLXNjcm9sbC1yZXBlYXRlcic7XG5pbXBvcnQge0Jvb2xlYW5JbnB1dCwgY29lcmNlQm9vbGVhblByb3BlcnR5fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtDZGtWaXJ0dWFsU2Nyb2xsYWJsZSwgVklSVFVBTF9TQ1JPTExBQkxFfSBmcm9tICcuL3ZpcnR1YWwtc2Nyb2xsYWJsZSc7XG5cbi8qKiBDaGVja3MgaWYgdGhlIGdpdmVuIHJhbmdlcyBhcmUgZXF1YWwuICovXG5mdW5jdGlvbiByYW5nZXNFcXVhbChyMTogTGlzdFJhbmdlLCByMjogTGlzdFJhbmdlKTogYm9vbGVhbiB7XG4gIHJldHVybiByMS5zdGFydCA9PSByMi5zdGFydCAmJiByMS5lbmQgPT0gcjIuZW5kO1xufVxuXG4vKipcbiAqIFNjaGVkdWxlciB0byBiZSB1c2VkIGZvciBzY3JvbGwgZXZlbnRzLiBOZWVkcyB0byBmYWxsIGJhY2sgdG9cbiAqIHNvbWV0aGluZyB0aGF0IGRvZXNuJ3QgcmVseSBvbiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgb24gZW52aXJvbm1lbnRzXG4gKiB0aGF0IGRvbid0IHN1cHBvcnQgaXQgKGUuZy4gc2VydmVyLXNpZGUgcmVuZGVyaW5nKS5cbiAqL1xuY29uc3QgU0NST0xMX1NDSEVEVUxFUiA9XG4gIHR5cGVvZiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgIT09ICd1bmRlZmluZWQnID8gYW5pbWF0aW9uRnJhbWVTY2hlZHVsZXIgOiBhc2FwU2NoZWR1bGVyO1xuXG4vKiogQSB2aWV3cG9ydCB0aGF0IHZpcnR1YWxpemVzIGl0cyBzY3JvbGxpbmcgd2l0aCB0aGUgaGVscCBvZiBgQ2RrVmlydHVhbEZvck9mYC4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2Nkay12aXJ0dWFsLXNjcm9sbC12aWV3cG9ydCcsXG4gIHRlbXBsYXRlVXJsOiAndmlydHVhbC1zY3JvbGwtdmlld3BvcnQuaHRtbCcsXG4gIHN0eWxlVXJsczogWyd2aXJ0dWFsLXNjcm9sbC12aWV3cG9ydC5jc3MnXSxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstdmlydHVhbC1zY3JvbGwtdmlld3BvcnQnLFxuICAgICdbY2xhc3MuY2RrLXZpcnR1YWwtc2Nyb2xsLW9yaWVudGF0aW9uLWhvcml6b250YWxdJzogJ29yaWVudGF0aW9uID09PSBcImhvcml6b250YWxcIicsXG4gICAgJ1tjbGFzcy5jZGstdmlydHVhbC1zY3JvbGwtb3JpZW50YXRpb24tdmVydGljYWxdJzogJ29yaWVudGF0aW9uICE9PSBcImhvcml6b250YWxcIicsXG4gIH0sXG4gIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxuICBwcm92aWRlcnM6IFtcbiAgICB7XG4gICAgICBwcm92aWRlOiBDZGtTY3JvbGxhYmxlLFxuICAgICAgdXNlRmFjdG9yeTogKFxuICAgICAgICB2aXJ0dWFsU2Nyb2xsYWJsZTogQ2RrVmlydHVhbFNjcm9sbGFibGUgfCBudWxsLFxuICAgICAgICB2aWV3cG9ydDogQ2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0LFxuICAgICAgKSA9PiB2aXJ0dWFsU2Nyb2xsYWJsZSB8fCB2aWV3cG9ydCxcbiAgICAgIGRlcHM6IFtbbmV3IE9wdGlvbmFsKCksIG5ldyBJbmplY3QoVklSVFVBTF9TQ1JPTExBQkxFKV0sIENka1ZpcnR1YWxTY3JvbGxWaWV3cG9ydF0sXG4gICAgfSxcbiAgXSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0IGV4dGVuZHMgQ2RrVmlydHVhbFNjcm9sbGFibGUgaW1wbGVtZW50cyBPbkluaXQsIE9uRGVzdHJveSB7XG4gIHByaXZhdGUgX3BsYXRmb3JtID0gaW5qZWN0KFBsYXRmb3JtKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdmlld3BvcnQgaXMgZGV0YWNoZWQgZnJvbSBhIENka1ZpcnR1YWxGb3JPZi4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfZGV0YWNoZWRTdWJqZWN0ID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgcmVuZGVyZWQgcmFuZ2UgY2hhbmdlcy4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfcmVuZGVyZWRSYW5nZVN1YmplY3QgPSBuZXcgU3ViamVjdDxMaXN0UmFuZ2U+KCk7XG5cbiAgLyoqIFRoZSBkaXJlY3Rpb24gdGhlIHZpZXdwb3J0IHNjcm9sbHMuICovXG4gIEBJbnB1dCgpXG4gIGdldCBvcmllbnRhdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fb3JpZW50YXRpb247XG4gIH1cblxuICBzZXQgb3JpZW50YXRpb24ob3JpZW50YXRpb246ICdob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCcpIHtcbiAgICBpZiAodGhpcy5fb3JpZW50YXRpb24gIT09IG9yaWVudGF0aW9uKSB7XG4gICAgICB0aGlzLl9vcmllbnRhdGlvbiA9IG9yaWVudGF0aW9uO1xuICAgICAgdGhpcy5fY2FsY3VsYXRlU3BhY2VyU2l6ZSgpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIF9vcmllbnRhdGlvbjogJ2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJyA9ICd2ZXJ0aWNhbCc7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgcmVuZGVyZWQgaXRlbXMgc2hvdWxkIHBlcnNpc3QgaW4gdGhlIERPTSBhZnRlciBzY3JvbGxpbmcgb3V0IG9mIHZpZXcuIEJ5IGRlZmF1bHQsIGl0ZW1zXG4gICAqIHdpbGwgYmUgcmVtb3ZlZC5cbiAgICovXG4gIEBJbnB1dCgpXG4gIGdldCBhcHBlbmRPbmx5KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9hcHBlbmRPbmx5O1xuICB9XG4gIHNldCBhcHBlbmRPbmx5KHZhbHVlOiBCb29sZWFuSW5wdXQpIHtcbiAgICB0aGlzLl9hcHBlbmRPbmx5ID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgfVxuICBwcml2YXRlIF9hcHBlbmRPbmx5ID0gZmFsc2U7XG5cbiAgLy8gTm90ZTogd2UgZG9uJ3QgdXNlIHRoZSB0eXBpY2FsIEV2ZW50RW1pdHRlciBoZXJlIGJlY2F1c2Ugd2UgbmVlZCB0byBzdWJzY3JpYmUgdG8gdGhlIHNjcm9sbFxuICAvLyBzdHJhdGVneSBsYXppbHkgKGkuZS4gb25seSBpZiB0aGUgdXNlciBpcyBhY3R1YWxseSBsaXN0ZW5pbmcgdG8gdGhlIGV2ZW50cykuIFdlIGRvIHRoaXMgYmVjYXVzZVxuICAvLyBkZXBlbmRpbmcgb24gaG93IHRoZSBzdHJhdGVneSBjYWxjdWxhdGVzIHRoZSBzY3JvbGxlZCBpbmRleCwgaXQgbWF5IGNvbWUgYXQgYSBjb3N0IHRvXG4gIC8vIHBlcmZvcm1hbmNlLlxuICAvKiogRW1pdHMgd2hlbiB0aGUgaW5kZXggb2YgdGhlIGZpcnN0IGVsZW1lbnQgdmlzaWJsZSBpbiB0aGUgdmlld3BvcnQgY2hhbmdlcy4gKi9cbiAgQE91dHB1dCgpXG4gIHJlYWRvbmx5IHNjcm9sbGVkSW5kZXhDaGFuZ2U6IE9ic2VydmFibGU8bnVtYmVyPiA9IG5ldyBPYnNlcnZhYmxlKChvYnNlcnZlcjogT2JzZXJ2ZXI8bnVtYmVyPikgPT5cbiAgICB0aGlzLl9zY3JvbGxTdHJhdGVneS5zY3JvbGxlZEluZGV4Q2hhbmdlLnN1YnNjcmliZShpbmRleCA9PlxuICAgICAgUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB0aGlzLm5nWm9uZS5ydW4oKCkgPT4gb2JzZXJ2ZXIubmV4dChpbmRleCkpKSxcbiAgICApLFxuICApO1xuXG4gIC8qKiBUaGUgZWxlbWVudCB0aGF0IHdyYXBzIHRoZSByZW5kZXJlZCBjb250ZW50LiAqL1xuICBAVmlld0NoaWxkKCdjb250ZW50V3JhcHBlcicsIHtzdGF0aWM6IHRydWV9KSBfY29udGVudFdyYXBwZXI6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+O1xuXG4gIC8qKiBBIHN0cmVhbSB0aGF0IGVtaXRzIHdoZW5ldmVyIHRoZSByZW5kZXJlZCByYW5nZSBjaGFuZ2VzLiAqL1xuICByZWFkb25seSByZW5kZXJlZFJhbmdlU3RyZWFtOiBPYnNlcnZhYmxlPExpc3RSYW5nZT4gPSB0aGlzLl9yZW5kZXJlZFJhbmdlU3ViamVjdDtcblxuICAvKipcbiAgICogVGhlIHRvdGFsIHNpemUgb2YgYWxsIGNvbnRlbnQgKGluIHBpeGVscyksIGluY2x1ZGluZyBjb250ZW50IHRoYXQgaXMgbm90IGN1cnJlbnRseSByZW5kZXJlZC5cbiAgICovXG4gIHByaXZhdGUgX3RvdGFsQ29udGVudFNpemUgPSAwO1xuXG4gIC8qKiBBIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIGBzdHlsZS53aWR0aGAgcHJvcGVydHkgdmFsdWUgdG8gYmUgdXNlZCBmb3IgdGhlIHNwYWNlciBlbGVtZW50LiAqL1xuICBfdG90YWxDb250ZW50V2lkdGggPSAnJztcblxuICAvKiogQSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBgc3R5bGUuaGVpZ2h0YCBwcm9wZXJ0eSB2YWx1ZSB0byBiZSB1c2VkIGZvciB0aGUgc3BhY2VyIGVsZW1lbnQuICovXG4gIF90b3RhbENvbnRlbnRIZWlnaHQgPSAnJztcblxuICAvKipcbiAgICogVGhlIENTUyB0cmFuc2Zvcm0gYXBwbGllZCB0byB0aGUgcmVuZGVyZWQgc3Vic2V0IG9mIGl0ZW1zIHNvIHRoYXQgdGhleSBhcHBlYXIgd2l0aGluIHRoZSBib3VuZHNcbiAgICogb2YgdGhlIHZpc2libGUgdmlld3BvcnQuXG4gICAqL1xuICBwcml2YXRlIF9yZW5kZXJlZENvbnRlbnRUcmFuc2Zvcm06IHN0cmluZztcblxuICAvKiogVGhlIGN1cnJlbnRseSByZW5kZXJlZCByYW5nZSBvZiBpbmRpY2VzLiAqL1xuICBwcml2YXRlIF9yZW5kZXJlZFJhbmdlOiBMaXN0UmFuZ2UgPSB7c3RhcnQ6IDAsIGVuZDogMH07XG5cbiAgLyoqIFRoZSBsZW5ndGggb2YgdGhlIGRhdGEgYm91bmQgdG8gdGhpcyB2aWV3cG9ydCAoaW4gbnVtYmVyIG9mIGl0ZW1zKS4gKi9cbiAgcHJpdmF0ZSBfZGF0YUxlbmd0aCA9IDA7XG5cbiAgLyoqIFRoZSBzaXplIG9mIHRoZSB2aWV3cG9ydCAoaW4gcGl4ZWxzKS4gKi9cbiAgcHJpdmF0ZSBfdmlld3BvcnRTaXplID0gMDtcblxuICAvKiogdGhlIGN1cnJlbnRseSBhdHRhY2hlZCBDZGtWaXJ0dWFsU2Nyb2xsUmVwZWF0ZXIuICovXG4gIHByaXZhdGUgX2Zvck9mOiBDZGtWaXJ0dWFsU2Nyb2xsUmVwZWF0ZXI8YW55PiB8IG51bGw7XG5cbiAgLyoqIFRoZSBsYXN0IHJlbmRlcmVkIGNvbnRlbnQgb2Zmc2V0IHRoYXQgd2FzIHNldC4gKi9cbiAgcHJpdmF0ZSBfcmVuZGVyZWRDb250ZW50T2Zmc2V0ID0gMDtcblxuICAvKipcbiAgICogV2hldGhlciB0aGUgbGFzdCByZW5kZXJlZCBjb250ZW50IG9mZnNldCB3YXMgdG8gdGhlIGVuZCBvZiB0aGUgY29udGVudCAoYW5kIHRoZXJlZm9yZSBuZWVkcyB0b1xuICAgKiBiZSByZXdyaXR0ZW4gYXMgYW4gb2Zmc2V0IHRvIHRoZSBzdGFydCBvZiB0aGUgY29udGVudCkuXG4gICAqL1xuICBwcml2YXRlIF9yZW5kZXJlZENvbnRlbnRPZmZzZXROZWVkc1Jld3JpdGUgPSBmYWxzZTtcblxuICAvKiogV2hldGhlciB0aGVyZSBpcyBhIHBlbmRpbmcgY2hhbmdlIGRldGVjdGlvbiBjeWNsZS4gKi9cbiAgcHJpdmF0ZSBfaXNDaGFuZ2VEZXRlY3Rpb25QZW5kaW5nID0gZmFsc2U7XG5cbiAgLyoqIEEgbGlzdCBvZiBmdW5jdGlvbnMgdG8gcnVuIGFmdGVyIHRoZSBuZXh0IGNoYW5nZSBkZXRlY3Rpb24gY3ljbGUuICovXG4gIHByaXZhdGUgX3J1bkFmdGVyQ2hhbmdlRGV0ZWN0aW9uOiBGdW5jdGlvbltdID0gW107XG5cbiAgLyoqIFN1YnNjcmlwdGlvbiB0byBjaGFuZ2VzIGluIHRoZSB2aWV3cG9ydCBzaXplLiAqL1xuICBwcml2YXRlIF92aWV3cG9ydENoYW5nZXMgPSBTdWJzY3JpcHRpb24uRU1QVFk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIG92ZXJyaWRlIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgIHByaXZhdGUgX2NoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBuZ1pvbmU6IE5nWm9uZSxcbiAgICBAT3B0aW9uYWwoKVxuICAgIEBJbmplY3QoVklSVFVBTF9TQ1JPTExfU1RSQVRFR1kpXG4gICAgcHJpdmF0ZSBfc2Nyb2xsU3RyYXRlZ3k6IFZpcnR1YWxTY3JvbGxTdHJhdGVneSxcbiAgICBAT3B0aW9uYWwoKSBkaXI6IERpcmVjdGlvbmFsaXR5LFxuICAgIHNjcm9sbERpc3BhdGNoZXI6IFNjcm9sbERpc3BhdGNoZXIsXG4gICAgdmlld3BvcnRSdWxlcjogVmlld3BvcnRSdWxlcixcbiAgICBAT3B0aW9uYWwoKSBASW5qZWN0KFZJUlRVQUxfU0NST0xMQUJMRSkgcHVibGljIHNjcm9sbGFibGU6IENka1ZpcnR1YWxTY3JvbGxhYmxlLFxuICApIHtcbiAgICBzdXBlcihlbGVtZW50UmVmLCBzY3JvbGxEaXNwYXRjaGVyLCBuZ1pvbmUsIGRpcik7XG5cbiAgICBpZiAoIV9zY3JvbGxTdHJhdGVneSAmJiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgdGhyb3cgRXJyb3IoJ0Vycm9yOiBjZGstdmlydHVhbC1zY3JvbGwtdmlld3BvcnQgcmVxdWlyZXMgdGhlIFwiaXRlbVNpemVcIiBwcm9wZXJ0eSB0byBiZSBzZXQuJyk7XG4gICAgfVxuXG4gICAgdGhpcy5fdmlld3BvcnRDaGFuZ2VzID0gdmlld3BvcnRSdWxlci5jaGFuZ2UoKS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgdGhpcy5jaGVja1ZpZXdwb3J0U2l6ZSgpO1xuICAgIH0pO1xuXG4gICAgaWYgKCF0aGlzLnNjcm9sbGFibGUpIHtcbiAgICAgIC8vIE5vIHNjcm9sbGFibGUgaXMgcHJvdmlkZWQsIHNvIHRoZSB2aXJ0dWFsLXNjcm9sbC12aWV3cG9ydCBuZWVkcyB0byBiZWNvbWUgYSBzY3JvbGxhYmxlXG4gICAgICB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5jbGFzc0xpc3QuYWRkKCdjZGstdmlydHVhbC1zY3JvbGxhYmxlJyk7XG4gICAgICB0aGlzLnNjcm9sbGFibGUgPSB0aGlzO1xuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlIG5nT25Jbml0KCkge1xuICAgIC8vIFNjcm9sbGluZyBkZXBlbmRzIG9uIHRoZSBlbGVtZW50IGRpbWVuc2lvbnMgd2hpY2ggd2UgY2FuJ3QgZ2V0IGR1cmluZyBTU1IuXG4gICAgaWYgKCF0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zY3JvbGxhYmxlID09PSB0aGlzKSB7XG4gICAgICBzdXBlci5uZ09uSW5pdCgpO1xuICAgIH1cbiAgICAvLyBJdCdzIHN0aWxsIHRvbyBlYXJseSB0byBtZWFzdXJlIHRoZSB2aWV3cG9ydCBhdCB0aGlzIHBvaW50LiBEZWZlcnJpbmcgd2l0aCBhIHByb21pc2UgYWxsb3dzXG4gICAgLy8gdGhlIFZpZXdwb3J0IHRvIGJlIHJlbmRlcmVkIHdpdGggdGhlIGNvcnJlY3Qgc2l6ZSBiZWZvcmUgd2UgbWVhc3VyZS4gV2UgcnVuIHRoaXMgb3V0c2lkZSB0aGVcbiAgICAvLyB6b25lIHRvIGF2b2lkIGNhdXNpbmcgbW9yZSBjaGFuZ2UgZGV0ZWN0aW9uIGN5Y2xlcy4gV2UgaGFuZGxlIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIGxvb3BcbiAgICAvLyBvdXJzZWx2ZXMgaW5zdGVhZC5cbiAgICB0aGlzLm5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PlxuICAgICAgUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMuX21lYXN1cmVWaWV3cG9ydFNpemUoKTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kuYXR0YWNoKHRoaXMpO1xuXG4gICAgICAgIHRoaXMuc2Nyb2xsYWJsZVxuICAgICAgICAgIC5lbGVtZW50U2Nyb2xsZWQoKVxuICAgICAgICAgIC5waXBlKFxuICAgICAgICAgICAgLy8gU3RhcnQgb2ZmIHdpdGggYSBmYWtlIHNjcm9sbCBldmVudCBzbyB3ZSBwcm9wZXJseSBkZXRlY3Qgb3VyIGluaXRpYWwgcG9zaXRpb24uXG4gICAgICAgICAgICBzdGFydFdpdGgobnVsbCksXG4gICAgICAgICAgICAvLyBDb2xsZWN0IG11bHRpcGxlIGV2ZW50cyBpbnRvIG9uZSB1bnRpbCB0aGUgbmV4dCBhbmltYXRpb24gZnJhbWUuIFRoaXMgd2F5IGlmXG4gICAgICAgICAgICAvLyB0aGVyZSBhcmUgbXVsdGlwbGUgc2Nyb2xsIGV2ZW50cyBpbiB0aGUgc2FtZSBmcmFtZSB3ZSBvbmx5IG5lZWQgdG8gcmVjaGVja1xuICAgICAgICAgICAgLy8gb3VyIGxheW91dCBvbmNlLlxuICAgICAgICAgICAgYXVkaXRUaW1lKDAsIFNDUk9MTF9TQ0hFRFVMRVIpLFxuICAgICAgICAgIClcbiAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMuX3Njcm9sbFN0cmF0ZWd5Lm9uQ29udGVudFNjcm9sbGVkKCkpO1xuXG4gICAgICAgIHRoaXMuX21hcmtDaGFuZ2VEZXRlY3Rpb25OZWVkZWQoKTtcbiAgICAgIH0pLFxuICAgICk7XG4gIH1cblxuICBvdmVycmlkZSBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLmRldGFjaCgpO1xuICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5LmRldGFjaCgpO1xuXG4gICAgLy8gQ29tcGxldGUgYWxsIHN1YmplY3RzXG4gICAgdGhpcy5fcmVuZGVyZWRSYW5nZVN1YmplY3QuY29tcGxldGUoKTtcbiAgICB0aGlzLl9kZXRhY2hlZFN1YmplY3QuY29tcGxldGUoKTtcbiAgICB0aGlzLl92aWV3cG9ydENoYW5nZXMudW5zdWJzY3JpYmUoKTtcblxuICAgIHN1cGVyLm5nT25EZXN0cm95KCk7XG4gIH1cblxuICAvKiogQXR0YWNoZXMgYSBgQ2RrVmlydHVhbFNjcm9sbFJlcGVhdGVyYCB0byB0aGlzIHZpZXdwb3J0LiAqL1xuICBhdHRhY2goZm9yT2Y6IENka1ZpcnR1YWxTY3JvbGxSZXBlYXRlcjxhbnk+KSB7XG4gICAgaWYgKHRoaXMuX2Zvck9mICYmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpKSB7XG4gICAgICB0aHJvdyBFcnJvcignQ2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0IGlzIGFscmVhZHkgYXR0YWNoZWQuJyk7XG4gICAgfVxuXG4gICAgLy8gU3Vic2NyaWJlIHRvIHRoZSBkYXRhIHN0cmVhbSBvZiB0aGUgQ2RrVmlydHVhbEZvck9mIHRvIGtlZXAgdHJhY2sgb2Ygd2hlbiB0aGUgZGF0YSBsZW5ndGhcbiAgICAvLyBjaGFuZ2VzLiBSdW4gb3V0c2lkZSB0aGUgem9uZSB0byBhdm9pZCB0cmlnZ2VyaW5nIGNoYW5nZSBkZXRlY3Rpb24sIHNpbmNlIHdlJ3JlIG1hbmFnaW5nIHRoZVxuICAgIC8vIGNoYW5nZSBkZXRlY3Rpb24gbG9vcCBvdXJzZWx2ZXMuXG4gICAgdGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgdGhpcy5fZm9yT2YgPSBmb3JPZjtcbiAgICAgIHRoaXMuX2Zvck9mLmRhdGFTdHJlYW0ucGlwZSh0YWtlVW50aWwodGhpcy5fZGV0YWNoZWRTdWJqZWN0KSkuc3Vic2NyaWJlKGRhdGEgPT4ge1xuICAgICAgICBjb25zdCBuZXdMZW5ndGggPSBkYXRhLmxlbmd0aDtcbiAgICAgICAgaWYgKG5ld0xlbmd0aCAhPT0gdGhpcy5fZGF0YUxlbmd0aCkge1xuICAgICAgICAgIHRoaXMuX2RhdGFMZW5ndGggPSBuZXdMZW5ndGg7XG4gICAgICAgICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kub25EYXRhTGVuZ3RoQ2hhbmdlZCgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2RvQ2hhbmdlRGV0ZWN0aW9uKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBEZXRhY2hlcyB0aGUgY3VycmVudCBgQ2RrVmlydHVhbEZvck9mYC4gKi9cbiAgZGV0YWNoKCkge1xuICAgIHRoaXMuX2Zvck9mID0gbnVsbDtcbiAgICB0aGlzLl9kZXRhY2hlZFN1YmplY3QubmV4dCgpO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIGxlbmd0aCBvZiB0aGUgZGF0YSBib3VuZCB0byB0aGlzIHZpZXdwb3J0IChpbiBudW1iZXIgb2YgaXRlbXMpLiAqL1xuICBnZXREYXRhTGVuZ3RoKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX2RhdGFMZW5ndGg7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgc2l6ZSBvZiB0aGUgdmlld3BvcnQgKGluIHBpeGVscykuICovXG4gIGdldFZpZXdwb3J0U2l6ZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92aWV3cG9ydFNpemU7XG4gIH1cblxuICAvLyBUT0RPKG1tYWxlcmJhKTogVGhpcyBpcyB0ZWNobmljYWxseSBvdXQgb2Ygc3luYyB3aXRoIHdoYXQncyByZWFsbHkgcmVuZGVyZWQgdW50aWwgYSByZW5kZXJcbiAgLy8gY3ljbGUgaGFwcGVucy4gSSdtIGJlaW5nIGNhcmVmdWwgdG8gb25seSBjYWxsIGl0IGFmdGVyIHRoZSByZW5kZXIgY3ljbGUgaXMgY29tcGxldGUgYW5kIGJlZm9yZVxuICAvLyBzZXR0aW5nIGl0IHRvIHNvbWV0aGluZyBlbHNlLCBidXQgaXRzIGVycm9yIHByb25lIGFuZCBzaG91bGQgcHJvYmFibHkgYmUgc3BsaXQgaW50b1xuICAvLyBgcGVuZGluZ1JhbmdlYCBhbmQgYHJlbmRlcmVkUmFuZ2VgLCB0aGUgbGF0dGVyIHJlZmxlY3Rpbmcgd2hhdHMgYWN0dWFsbHkgaW4gdGhlIERPTS5cblxuICAvKiogR2V0IHRoZSBjdXJyZW50IHJlbmRlcmVkIHJhbmdlIG9mIGl0ZW1zLiAqL1xuICBnZXRSZW5kZXJlZFJhbmdlKCk6IExpc3RSYW5nZSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlbmRlcmVkUmFuZ2U7XG4gIH1cblxuICBtZWFzdXJlQm91bmRpbmdDbGllbnRSZWN0V2l0aFNjcm9sbE9mZnNldChmcm9tOiAnbGVmdCcgfCAndG9wJyB8ICdyaWdodCcgfCAnYm90dG9tJyk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0RWxlbWVudFJlZigpLm5hdGl2ZUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClbZnJvbV07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdG90YWwgc2l6ZSBvZiBhbGwgY29udGVudCAoaW4gcGl4ZWxzKSwgaW5jbHVkaW5nIGNvbnRlbnQgdGhhdCBpcyBub3QgY3VycmVudGx5XG4gICAqIHJlbmRlcmVkLlxuICAgKi9cbiAgc2V0VG90YWxDb250ZW50U2l6ZShzaXplOiBudW1iZXIpIHtcbiAgICBpZiAodGhpcy5fdG90YWxDb250ZW50U2l6ZSAhPT0gc2l6ZSkge1xuICAgICAgdGhpcy5fdG90YWxDb250ZW50U2l6ZSA9IHNpemU7XG4gICAgICB0aGlzLl9jYWxjdWxhdGVTcGFjZXJTaXplKCk7XG4gICAgICB0aGlzLl9tYXJrQ2hhbmdlRGV0ZWN0aW9uTmVlZGVkKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFNldHMgdGhlIGN1cnJlbnRseSByZW5kZXJlZCByYW5nZSBvZiBpbmRpY2VzLiAqL1xuICBzZXRSZW5kZXJlZFJhbmdlKHJhbmdlOiBMaXN0UmFuZ2UpIHtcbiAgICBpZiAoIXJhbmdlc0VxdWFsKHRoaXMuX3JlbmRlcmVkUmFuZ2UsIHJhbmdlKSkge1xuICAgICAgaWYgKHRoaXMuYXBwZW5kT25seSkge1xuICAgICAgICByYW5nZSA9IHtzdGFydDogMCwgZW5kOiBNYXRoLm1heCh0aGlzLl9yZW5kZXJlZFJhbmdlLmVuZCwgcmFuZ2UuZW5kKX07XG4gICAgICB9XG4gICAgICB0aGlzLl9yZW5kZXJlZFJhbmdlU3ViamVjdC5uZXh0KCh0aGlzLl9yZW5kZXJlZFJhbmdlID0gcmFuZ2UpKTtcbiAgICAgIHRoaXMuX21hcmtDaGFuZ2VEZXRlY3Rpb25OZWVkZWQoKCkgPT4gdGhpcy5fc2Nyb2xsU3RyYXRlZ3kub25Db250ZW50UmVuZGVyZWQoKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG9mZnNldCBmcm9tIHRoZSBzdGFydCBvZiB0aGUgdmlld3BvcnQgdG8gdGhlIHN0YXJ0IG9mIHRoZSByZW5kZXJlZCBkYXRhIChpbiBwaXhlbHMpLlxuICAgKi9cbiAgZ2V0T2Zmc2V0VG9SZW5kZXJlZENvbnRlbnRTdGFydCgpOiBudW1iZXIgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0TmVlZHNSZXdyaXRlID8gbnVsbCA6IHRoaXMuX3JlbmRlcmVkQ29udGVudE9mZnNldDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBvZmZzZXQgZnJvbSB0aGUgc3RhcnQgb2YgdGhlIHZpZXdwb3J0IHRvIGVpdGhlciB0aGUgc3RhcnQgb3IgZW5kIG9mIHRoZSByZW5kZXJlZCBkYXRhXG4gICAqIChpbiBwaXhlbHMpLlxuICAgKi9cbiAgc2V0UmVuZGVyZWRDb250ZW50T2Zmc2V0KG9mZnNldDogbnVtYmVyLCB0bzogJ3RvLXN0YXJ0JyB8ICd0by1lbmQnID0gJ3RvLXN0YXJ0Jykge1xuICAgIC8vIEluIGFwcGVuZE9ubHksIHdlIGFsd2F5cyBzdGFydCBmcm9tIHRoZSB0b3BcbiAgICBvZmZzZXQgPSB0aGlzLmFwcGVuZE9ubHkgJiYgdG8gPT09ICd0by1zdGFydCcgPyAwIDogb2Zmc2V0O1xuXG4gICAgLy8gRm9yIGEgaG9yaXpvbnRhbCB2aWV3cG9ydCBpbiBhIHJpZ2h0LXRvLWxlZnQgbGFuZ3VhZ2Ugd2UgbmVlZCB0byB0cmFuc2xhdGUgYWxvbmcgdGhlIHgtYXhpc1xuICAgIC8vIGluIHRoZSBuZWdhdGl2ZSBkaXJlY3Rpb24uXG4gICAgY29uc3QgaXNSdGwgPSB0aGlzLmRpciAmJiB0aGlzLmRpci52YWx1ZSA9PSAncnRsJztcbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLm9yaWVudGF0aW9uID09ICdob3Jpem9udGFsJztcbiAgICBjb25zdCBheGlzID0gaXNIb3Jpem9udGFsID8gJ1gnIDogJ1knO1xuICAgIGNvbnN0IGF4aXNEaXJlY3Rpb24gPSBpc0hvcml6b250YWwgJiYgaXNSdGwgPyAtMSA6IDE7XG4gICAgbGV0IHRyYW5zZm9ybSA9IGB0cmFuc2xhdGUke2F4aXN9KCR7TnVtYmVyKGF4aXNEaXJlY3Rpb24gKiBvZmZzZXQpfXB4KWA7XG4gICAgdGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0ID0gb2Zmc2V0O1xuICAgIGlmICh0byA9PT0gJ3RvLWVuZCcpIHtcbiAgICAgIHRyYW5zZm9ybSArPSBgIHRyYW5zbGF0ZSR7YXhpc30oLTEwMCUpYDtcbiAgICAgIC8vIFRoZSB2aWV3cG9ydCBzaG91bGQgcmV3cml0ZSB0aGlzIGFzIGEgYHRvLXN0YXJ0YCBvZmZzZXQgb24gdGhlIG5leHQgcmVuZGVyIGN5Y2xlLiBPdGhlcndpc2VcbiAgICAgIC8vIGVsZW1lbnRzIHdpbGwgYXBwZWFyIHRvIGV4cGFuZCBpbiB0aGUgd3JvbmcgZGlyZWN0aW9uIChlLmcuIGBtYXQtZXhwYW5zaW9uLXBhbmVsYCB3b3VsZFxuICAgICAgLy8gZXhwYW5kIHVwd2FyZCkuXG4gICAgICB0aGlzLl9yZW5kZXJlZENvbnRlbnRPZmZzZXROZWVkc1Jld3JpdGUgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAodGhpcy5fcmVuZGVyZWRDb250ZW50VHJhbnNmb3JtICE9IHRyYW5zZm9ybSkge1xuICAgICAgLy8gV2Uga25vdyB0aGlzIHZhbHVlIGlzIHNhZmUgYmVjYXVzZSB3ZSBwYXJzZSBgb2Zmc2V0YCB3aXRoIGBOdW1iZXIoKWAgYmVmb3JlIHBhc3NpbmcgaXRcbiAgICAgIC8vIGludG8gdGhlIHN0cmluZy5cbiAgICAgIHRoaXMuX3JlbmRlcmVkQ29udGVudFRyYW5zZm9ybSA9IHRyYW5zZm9ybTtcbiAgICAgIHRoaXMuX21hcmtDaGFuZ2VEZXRlY3Rpb25OZWVkZWQoKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0TmVlZHNSZXdyaXRlKSB7XG4gICAgICAgICAgdGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0IC09IHRoaXMubWVhc3VyZVJlbmRlcmVkQ29udGVudFNpemUoKTtcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlZENvbnRlbnRPZmZzZXROZWVkc1Jld3JpdGUgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLnNldFJlbmRlcmVkQ29udGVudE9mZnNldCh0aGlzLl9yZW5kZXJlZENvbnRlbnRPZmZzZXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5Lm9uUmVuZGVyZWRPZmZzZXRDaGFuZ2VkKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTY3JvbGxzIHRvIHRoZSBnaXZlbiBvZmZzZXQgZnJvbSB0aGUgc3RhcnQgb2YgdGhlIHZpZXdwb3J0LiBQbGVhc2Ugbm90ZSB0aGF0IHRoaXMgaXMgbm90IGFsd2F5c1xuICAgKiB0aGUgc2FtZSBhcyBzZXR0aW5nIGBzY3JvbGxUb3BgIG9yIGBzY3JvbGxMZWZ0YC4gSW4gYSBob3Jpem9udGFsIHZpZXdwb3J0IHdpdGggcmlnaHQtdG8tbGVmdFxuICAgKiBkaXJlY3Rpb24sIHRoaXMgd291bGQgYmUgdGhlIGVxdWl2YWxlbnQgb2Ygc2V0dGluZyBhIGZpY3Rpb25hbCBgc2Nyb2xsUmlnaHRgIHByb3BlcnR5LlxuICAgKiBAcGFyYW0gb2Zmc2V0IFRoZSBvZmZzZXQgdG8gc2Nyb2xsIHRvLlxuICAgKiBAcGFyYW0gYmVoYXZpb3IgVGhlIFNjcm9sbEJlaGF2aW9yIHRvIHVzZSB3aGVuIHNjcm9sbGluZy4gRGVmYXVsdCBpcyBiZWhhdmlvciBpcyBgYXV0b2AuXG4gICAqL1xuICBzY3JvbGxUb09mZnNldChvZmZzZXQ6IG51bWJlciwgYmVoYXZpb3I6IFNjcm9sbEJlaGF2aW9yID0gJ2F1dG8nKSB7XG4gICAgY29uc3Qgb3B0aW9uczogRXh0ZW5kZWRTY3JvbGxUb09wdGlvbnMgPSB7YmVoYXZpb3J9O1xuICAgIGlmICh0aGlzLm9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcpIHtcbiAgICAgIG9wdGlvbnMuc3RhcnQgPSBvZmZzZXQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdGlvbnMudG9wID0gb2Zmc2V0O1xuICAgIH1cbiAgICB0aGlzLnNjcm9sbGFibGUuc2Nyb2xsVG8ob3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogU2Nyb2xscyB0byB0aGUgb2Zmc2V0IGZvciB0aGUgZ2l2ZW4gaW5kZXguXG4gICAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgdG8gc2Nyb2xsIHRvLlxuICAgKiBAcGFyYW0gYmVoYXZpb3IgVGhlIFNjcm9sbEJlaGF2aW9yIHRvIHVzZSB3aGVuIHNjcm9sbGluZy4gRGVmYXVsdCBpcyBiZWhhdmlvciBpcyBgYXV0b2AuXG4gICAqL1xuICBzY3JvbGxUb0luZGV4KGluZGV4OiBudW1iZXIsIGJlaGF2aW9yOiBTY3JvbGxCZWhhdmlvciA9ICdhdXRvJykge1xuICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5LnNjcm9sbFRvSW5kZXgoaW5kZXgsIGJlaGF2aW9yKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IHNjcm9sbCBvZmZzZXQgZnJvbSB0aGUgc3RhcnQgb2YgdGhlIHNjcm9sbGFibGUgKGluIHBpeGVscykuXG4gICAqIEBwYXJhbSBmcm9tIFRoZSBlZGdlIHRvIG1lYXN1cmUgdGhlIG9mZnNldCBmcm9tLiBEZWZhdWx0cyB0byAndG9wJyBpbiB2ZXJ0aWNhbCBtb2RlIGFuZCAnc3RhcnQnXG4gICAqICAgICBpbiBob3Jpem9udGFsIG1vZGUuXG4gICAqL1xuICBvdmVycmlkZSBtZWFzdXJlU2Nyb2xsT2Zmc2V0KFxuICAgIGZyb20/OiAndG9wJyB8ICdsZWZ0JyB8ICdyaWdodCcgfCAnYm90dG9tJyB8ICdzdGFydCcgfCAnZW5kJyxcbiAgKTogbnVtYmVyIHtcbiAgICAvLyBUaGlzIGlzIHRvIGJyZWFrIHRoZSBjYWxsIGN5Y2xlXG4gICAgbGV0IG1lYXN1cmVTY3JvbGxPZmZzZXQ6IEluc3RhbmNlVHlwZTx0eXBlb2YgQ2RrVmlydHVhbFNjcm9sbGFibGU+WydtZWFzdXJlU2Nyb2xsT2Zmc2V0J107XG4gICAgaWYgKHRoaXMuc2Nyb2xsYWJsZSA9PSB0aGlzKSB7XG4gICAgICBtZWFzdXJlU2Nyb2xsT2Zmc2V0ID0gKF9mcm9tOiBOb25OdWxsYWJsZTx0eXBlb2YgZnJvbT4pID0+IHN1cGVyLm1lYXN1cmVTY3JvbGxPZmZzZXQoX2Zyb20pO1xuICAgIH0gZWxzZSB7XG4gICAgICBtZWFzdXJlU2Nyb2xsT2Zmc2V0ID0gKF9mcm9tOiBOb25OdWxsYWJsZTx0eXBlb2YgZnJvbT4pID0+XG4gICAgICAgIHRoaXMuc2Nyb2xsYWJsZS5tZWFzdXJlU2Nyb2xsT2Zmc2V0KF9mcm9tKTtcbiAgICB9XG5cbiAgICByZXR1cm4gTWF0aC5tYXgoXG4gICAgICAwLFxuICAgICAgbWVhc3VyZVNjcm9sbE9mZnNldChmcm9tID8/ICh0aGlzLm9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcgPyAnc3RhcnQnIDogJ3RvcCcpKSAtXG4gICAgICAgIHRoaXMubWVhc3VyZVZpZXdwb3J0T2Zmc2V0KCksXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNZWFzdXJlcyB0aGUgb2Zmc2V0IG9mIHRoZSB2aWV3cG9ydCBmcm9tIHRoZSBzY3JvbGxpbmcgY29udGFpbmVyXG4gICAqIEBwYXJhbSBmcm9tIFRoZSBlZGdlIHRvIG1lYXN1cmUgZnJvbS5cbiAgICovXG4gIG1lYXN1cmVWaWV3cG9ydE9mZnNldChmcm9tPzogJ3RvcCcgfCAnbGVmdCcgfCAncmlnaHQnIHwgJ2JvdHRvbScgfCAnc3RhcnQnIHwgJ2VuZCcpIHtcbiAgICBsZXQgZnJvbVJlY3Q6ICdsZWZ0JyB8ICd0b3AnIHwgJ3JpZ2h0JyB8ICdib3R0b20nO1xuICAgIGNvbnN0IExFRlQgPSAnbGVmdCc7XG4gICAgY29uc3QgUklHSFQgPSAncmlnaHQnO1xuICAgIGNvbnN0IGlzUnRsID0gdGhpcy5kaXI/LnZhbHVlID09ICdydGwnO1xuICAgIGlmIChmcm9tID09ICdzdGFydCcpIHtcbiAgICAgIGZyb21SZWN0ID0gaXNSdGwgPyBSSUdIVCA6IExFRlQ7XG4gICAgfSBlbHNlIGlmIChmcm9tID09ICdlbmQnKSB7XG4gICAgICBmcm9tUmVjdCA9IGlzUnRsID8gTEVGVCA6IFJJR0hUO1xuICAgIH0gZWxzZSBpZiAoZnJvbSkge1xuICAgICAgZnJvbVJlY3QgPSBmcm9tO1xuICAgIH0gZWxzZSB7XG4gICAgICBmcm9tUmVjdCA9IHRoaXMub3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJyA/ICdsZWZ0JyA6ICd0b3AnO1xuICAgIH1cblxuICAgIGNvbnN0IHNjcm9sbGVyQ2xpZW50UmVjdCA9IHRoaXMuc2Nyb2xsYWJsZS5tZWFzdXJlQm91bmRpbmdDbGllbnRSZWN0V2l0aFNjcm9sbE9mZnNldChmcm9tUmVjdCk7XG4gICAgY29uc3Qgdmlld3BvcnRDbGllbnRSZWN0ID0gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClbZnJvbVJlY3RdO1xuXG4gICAgcmV0dXJuIHZpZXdwb3J0Q2xpZW50UmVjdCAtIHNjcm9sbGVyQ2xpZW50UmVjdDtcbiAgfVxuXG4gIC8qKiBNZWFzdXJlIHRoZSBjb21iaW5lZCBzaXplIG9mIGFsbCBvZiB0aGUgcmVuZGVyZWQgaXRlbXMuICovXG4gIG1lYXN1cmVSZW5kZXJlZENvbnRlbnRTaXplKCk6IG51bWJlciB7XG4gICAgY29uc3QgY29udGVudEVsID0gdGhpcy5fY29udGVudFdyYXBwZXIubmF0aXZlRWxlbWVudDtcbiAgICByZXR1cm4gdGhpcy5vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnID8gY29udGVudEVsLm9mZnNldFdpZHRoIDogY29udGVudEVsLm9mZnNldEhlaWdodDtcbiAgfVxuXG4gIC8qKlxuICAgKiBNZWFzdXJlIHRoZSB0b3RhbCBjb21iaW5lZCBzaXplIG9mIHRoZSBnaXZlbiByYW5nZS4gVGhyb3dzIGlmIHRoZSByYW5nZSBpbmNsdWRlcyBpdGVtcyB0aGF0IGFyZVxuICAgKiBub3QgcmVuZGVyZWQuXG4gICAqL1xuICBtZWFzdXJlUmFuZ2VTaXplKHJhbmdlOiBMaXN0UmFuZ2UpOiBudW1iZXIge1xuICAgIGlmICghdGhpcy5fZm9yT2YpIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fZm9yT2YubWVhc3VyZVJhbmdlU2l6ZShyYW5nZSwgdGhpcy5vcmllbnRhdGlvbik7XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSB2aWV3cG9ydCBkaW1lbnNpb25zIGFuZCByZS1yZW5kZXIuICovXG4gIGNoZWNrVmlld3BvcnRTaXplKCkge1xuICAgIC8vIFRPRE86IENsZWFudXAgbGF0ZXIgd2hlbiBhZGQgbG9naWMgZm9yIGhhbmRsaW5nIGNvbnRlbnQgcmVzaXplXG4gICAgdGhpcy5fbWVhc3VyZVZpZXdwb3J0U2l6ZSgpO1xuICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5Lm9uRGF0YUxlbmd0aENoYW5nZWQoKTtcbiAgfVxuXG4gIC8qKiBNZWFzdXJlIHRoZSB2aWV3cG9ydCBzaXplLiAqL1xuICBwcml2YXRlIF9tZWFzdXJlVmlld3BvcnRTaXplKCkge1xuICAgIHRoaXMuX3ZpZXdwb3J0U2l6ZSA9IHRoaXMuc2Nyb2xsYWJsZS5tZWFzdXJlVmlld3BvcnRTaXplKHRoaXMub3JpZW50YXRpb24pO1xuICB9XG5cbiAgLyoqIFF1ZXVlIHVwIGNoYW5nZSBkZXRlY3Rpb24gdG8gcnVuLiAqL1xuICBwcml2YXRlIF9tYXJrQ2hhbmdlRGV0ZWN0aW9uTmVlZGVkKHJ1bkFmdGVyPzogRnVuY3Rpb24pIHtcbiAgICBpZiAocnVuQWZ0ZXIpIHtcbiAgICAgIHRoaXMuX3J1bkFmdGVyQ2hhbmdlRGV0ZWN0aW9uLnB1c2gocnVuQWZ0ZXIpO1xuICAgIH1cblxuICAgIC8vIFVzZSBhIFByb21pc2UgdG8gYmF0Y2ggdG9nZXRoZXIgY2FsbHMgdG8gYF9kb0NoYW5nZURldGVjdGlvbmAuIFRoaXMgd2F5IGlmIHdlIHNldCBhIGJ1bmNoIG9mXG4gICAgLy8gcHJvcGVydGllcyBzZXF1ZW50aWFsbHkgd2Ugb25seSBoYXZlIHRvIHJ1biBgX2RvQ2hhbmdlRGV0ZWN0aW9uYCBvbmNlIGF0IHRoZSBlbmQuXG4gICAgaWYgKCF0aGlzLl9pc0NoYW5nZURldGVjdGlvblBlbmRpbmcpIHtcbiAgICAgIHRoaXMuX2lzQ2hhbmdlRGV0ZWN0aW9uUGVuZGluZyA9IHRydWU7XG4gICAgICB0aGlzLm5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PlxuICAgICAgICBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICB0aGlzLl9kb0NoYW5nZURldGVjdGlvbigpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFJ1biBjaGFuZ2UgZGV0ZWN0aW9uLiAqL1xuICBwcml2YXRlIF9kb0NoYW5nZURldGVjdGlvbigpIHtcbiAgICB0aGlzLl9pc0NoYW5nZURldGVjdGlvblBlbmRpbmcgPSBmYWxzZTtcblxuICAgIC8vIEFwcGx5IHRoZSBjb250ZW50IHRyYW5zZm9ybS4gVGhlIHRyYW5zZm9ybSBjYW4ndCBiZSBzZXQgdmlhIGFuIEFuZ3VsYXIgYmluZGluZyBiZWNhdXNlXG4gICAgLy8gYnlwYXNzU2VjdXJpdHlUcnVzdFN0eWxlIGlzIGJhbm5lZCBpbiBHb29nbGUuIEhvd2V2ZXIgdGhlIHZhbHVlIGlzIHNhZmUsIGl0J3MgY29tcG9zZWQgb2ZcbiAgICAvLyBzdHJpbmcgbGl0ZXJhbHMsIGEgdmFyaWFibGUgdGhhdCBjYW4gb25seSBiZSAnWCcgb3IgJ1knLCBhbmQgdXNlciBpbnB1dCB0aGF0IGlzIHJ1biB0aHJvdWdoXG4gICAgLy8gdGhlIGBOdW1iZXJgIGZ1bmN0aW9uIGZpcnN0IHRvIGNvZXJjZSBpdCB0byBhIG51bWVyaWMgdmFsdWUuXG4gICAgdGhpcy5fY29udGVudFdyYXBwZXIubmF0aXZlRWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSB0aGlzLl9yZW5kZXJlZENvbnRlbnRUcmFuc2Zvcm07XG4gICAgLy8gQXBwbHkgY2hhbmdlcyB0byBBbmd1bGFyIGJpbmRpbmdzLiBOb3RlOiBXZSBtdXN0IGNhbGwgYG1hcmtGb3JDaGVja2AgdG8gcnVuIGNoYW5nZSBkZXRlY3Rpb25cbiAgICAvLyBmcm9tIHRoZSByb290LCBzaW5jZSB0aGUgcmVwZWF0ZWQgaXRlbXMgYXJlIGNvbnRlbnQgcHJvamVjdGVkIGluLiBDYWxsaW5nIGBkZXRlY3RDaGFuZ2VzYFxuICAgIC8vIGluc3RlYWQgZG9lcyBub3QgcHJvcGVybHkgY2hlY2sgdGhlIHByb2plY3RlZCBjb250ZW50LlxuICAgIHRoaXMubmdab25lLnJ1bigoKSA9PiB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKSk7XG5cbiAgICBjb25zdCBydW5BZnRlckNoYW5nZURldGVjdGlvbiA9IHRoaXMuX3J1bkFmdGVyQ2hhbmdlRGV0ZWN0aW9uO1xuICAgIHRoaXMuX3J1bkFmdGVyQ2hhbmdlRGV0ZWN0aW9uID0gW107XG4gICAgZm9yIChjb25zdCBmbiBvZiBydW5BZnRlckNoYW5nZURldGVjdGlvbikge1xuICAgICAgZm4oKTtcbiAgICB9XG4gIH1cblxuICAvKiogQ2FsY3VsYXRlcyB0aGUgYHN0eWxlLndpZHRoYCBhbmQgYHN0eWxlLmhlaWdodGAgZm9yIHRoZSBzcGFjZXIgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfY2FsY3VsYXRlU3BhY2VyU2l6ZSgpIHtcbiAgICB0aGlzLl90b3RhbENvbnRlbnRIZWlnaHQgPVxuICAgICAgdGhpcy5vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnID8gJycgOiBgJHt0aGlzLl90b3RhbENvbnRlbnRTaXplfXB4YDtcbiAgICB0aGlzLl90b3RhbENvbnRlbnRXaWR0aCA9XG4gICAgICB0aGlzLm9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcgPyBgJHt0aGlzLl90b3RhbENvbnRlbnRTaXplfXB4YCA6ICcnO1xuICB9XG59XG4iLCI8IS0tXG4gIFdyYXAgdGhlIHJlbmRlcmVkIGNvbnRlbnQgaW4gYW4gZWxlbWVudCB0aGF0IHdpbGwgYmUgdXNlZCB0byBvZmZzZXQgaXQgYmFzZWQgb24gdGhlIHNjcm9sbFxuICBwb3NpdGlvbi5cbi0tPlxuPGRpdiAjY29udGVudFdyYXBwZXIgY2xhc3M9XCJjZGstdmlydHVhbC1zY3JvbGwtY29udGVudC13cmFwcGVyXCI+XG4gIDxuZy1jb250ZW50PjwvbmctY29udGVudD5cbjwvZGl2PlxuPCEtLVxuICBTcGFjZXIgdXNlZCB0byBmb3JjZSB0aGUgc2Nyb2xsaW5nIGNvbnRhaW5lciB0byB0aGUgY29ycmVjdCBzaXplIGZvciB0aGUgKnRvdGFsKiBudW1iZXIgb2YgaXRlbXNcbiAgc28gdGhhdCB0aGUgc2Nyb2xsYmFyIGNhcHR1cmVzIHRoZSBzaXplIG9mIHRoZSBlbnRpcmUgZGF0YSBzZXQuXG4tLT5cbjxkaXYgY2xhc3M9XCJjZGstdmlydHVhbC1zY3JvbGwtc3BhY2VyXCJcbiAgICAgW3N0eWxlLndpZHRoXT1cIl90b3RhbENvbnRlbnRXaWR0aFwiIFtzdHlsZS5oZWlnaHRdPVwiX3RvdGFsQ29udGVudEhlaWdodFwiPjwvZGl2PlxuIl19