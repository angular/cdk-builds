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
CdkVirtualScrollViewport.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.0.0", ngImport: i0, type: CdkVirtualScrollViewport, deps: [{ token: i0.ElementRef }, { token: i0.ChangeDetectorRef }, { token: i0.NgZone }, { token: VIRTUAL_SCROLL_STRATEGY, optional: true }, { token: i1.Directionality, optional: true }, { token: i2.ScrollDispatcher }, { token: i3.ViewportRuler }, { token: VIRTUAL_SCROLLABLE, optional: true }], target: i0.ɵɵFactoryTarget.Component });
CdkVirtualScrollViewport.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.0.0", type: CdkVirtualScrollViewport, isStandalone: true, selector: "cdk-virtual-scroll-viewport", inputs: { orientation: "orientation", appendOnly: "appendOnly" }, outputs: { scrolledIndexChange: "scrolledIndexChange" }, host: { properties: { "class.cdk-virtual-scroll-orientation-horizontal": "orientation === \"horizontal\"", "class.cdk-virtual-scroll-orientation-vertical": "orientation !== \"horizontal\"" }, classAttribute: "cdk-virtual-scroll-viewport" }, providers: [
        {
            provide: CdkScrollable,
            useFactory: (virtualScrollable, viewport) => virtualScrollable || viewport,
            deps: [[new Optional(), new Inject(VIRTUAL_SCROLLABLE)], CdkVirtualScrollViewport],
        },
    ], viewQueries: [{ propertyName: "_contentWrapper", first: true, predicate: ["contentWrapper"], descendants: true, static: true }], usesInheritance: true, ngImport: i0, template: "<!--\n  Wrap the rendered content in an element that will be used to offset it based on the scroll\n  position.\n-->\n<div #contentWrapper class=\"cdk-virtual-scroll-content-wrapper\">\n  <ng-content></ng-content>\n</div>\n<!--\n  Spacer used to force the scrolling container to the correct size for the *total* number of items\n  so that the scrollbar captures the size of the entire data set.\n-->\n<div class=\"cdk-virtual-scroll-spacer\"\n     [style.width]=\"_totalContentWidth\" [style.height]=\"_totalContentHeight\"></div>\n", styles: ["cdk-virtual-scroll-viewport{display:block;position:relative;transform:translateZ(0)}.cdk-virtual-scrollable{overflow:auto;will-change:scroll-position;contain:strict;-webkit-overflow-scrolling:touch}.cdk-virtual-scroll-content-wrapper{position:absolute;top:0;left:0;contain:content}[dir=rtl] .cdk-virtual-scroll-content-wrapper{right:0;left:auto}.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper{min-height:100%}.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>dl:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>ol:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>table:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>ul:not([cdkVirtualFor]){padding-left:0;padding-right:0;margin-left:0;margin-right:0;border-left-width:0;border-right-width:0;outline:none}.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper{min-width:100%}.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>dl:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>ol:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>table:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>ul:not([cdkVirtualFor]){padding-top:0;padding-bottom:0;margin-top:0;margin-bottom:0;border-top-width:0;border-bottom-width:0;outline:none}.cdk-virtual-scroll-spacer{height:1px;transform-origin:0 0;flex:0 0 auto}[dir=rtl] .cdk-virtual-scroll-spacer{transform-origin:100% 0}"], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.0.0", ngImport: i0, type: CdkVirtualScrollViewport, decorators: [{
            type: Component,
            args: [{ selector: 'cdk-virtual-scroll-viewport', host: {
                        'class': 'cdk-virtual-scroll-viewport',
                        '[class.cdk-virtual-scroll-orientation-horizontal]': 'orientation === "horizontal"',
                        '[class.cdk-virtual-scroll-orientation-vertical]': 'orientation !== "horizontal"',
                    }, encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush, standalone: true, providers: [
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1zY3JvbGwtdmlld3BvcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy92aXJ0dWFsLXNjcm9sbC12aWV3cG9ydC50cyIsIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2Nyb2xsaW5nL3ZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRWpELE9BQU8sRUFDTCx1QkFBdUIsRUFDdkIsaUJBQWlCLEVBQ2pCLFNBQVMsRUFDVCxVQUFVLEVBQ1YsTUFBTSxFQUNOLE1BQU0sRUFDTixLQUFLLEVBQ0wsTUFBTSxFQUdOLFFBQVEsRUFDUixNQUFNLEVBQ04sU0FBUyxFQUNULGlCQUFpQixHQUNsQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDL0MsT0FBTyxFQUNMLHVCQUF1QixFQUN2QixhQUFhLEVBQ2IsVUFBVSxFQUNWLE9BQU8sRUFFUCxZQUFZLEdBQ2IsTUFBTSxNQUFNLENBQUM7QUFDZCxPQUFPLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUMvRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsYUFBYSxFQUEwQixNQUFNLGNBQWMsQ0FBQztBQUNwRSxPQUFPLEVBQUMsdUJBQXVCLEVBQXdCLE1BQU0sMkJBQTJCLENBQUM7QUFDekYsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRS9DLE9BQU8sRUFBZSxxQkFBcUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzFFLE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxrQkFBa0IsRUFBQyxN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c291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7TGlzdFJhbmdlfSBmcm9tICdAYW5ndWxhci9jZGsvY29sbGVjdGlvbnMnO1xuaW1wb3J0IHtcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBDb21wb25lbnQsXG4gIEVsZW1lbnRSZWYsXG4gIGluamVjdCxcbiAgSW5qZWN0LFxuICBJbnB1dCxcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIE9uSW5pdCxcbiAgT3B0aW9uYWwsXG4gIE91dHB1dCxcbiAgVmlld0NoaWxkLFxuICBWaWV3RW5jYXBzdWxhdGlvbixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1BsYXRmb3JtfSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtcbiAgYW5pbWF0aW9uRnJhbWVTY2hlZHVsZXIsXG4gIGFzYXBTY2hlZHVsZXIsXG4gIE9ic2VydmFibGUsXG4gIFN1YmplY3QsXG4gIE9ic2VydmVyLFxuICBTdWJzY3JpcHRpb24sXG59IGZyb20gJ3J4anMnO1xuaW1wb3J0IHthdWRpdFRpbWUsIHN0YXJ0V2l0aCwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge1Njcm9sbERpc3BhdGNoZXJ9IGZyb20gJy4vc2Nyb2xsLWRpc3BhdGNoZXInO1xuaW1wb3J0IHtDZGtTY3JvbGxhYmxlLCBFeHRlbmRlZFNjcm9sbFRvT3B0aW9uc30gZnJvbSAnLi9zY3JvbGxhYmxlJztcbmltcG9ydCB7VklSVFVBTF9TQ1JPTExfU1RSQVRFR1ksIFZpcnR1YWxTY3JvbGxTdHJhdGVneX0gZnJvbSAnLi92aXJ0dWFsLXNjcm9sbC1zdHJhdGVneSc7XG5pbXBvcnQge1ZpZXdwb3J0UnVsZXJ9IGZyb20gJy4vdmlld3BvcnQtcnVsZXInO1xuaW1wb3J0IHtDZGtWaXJ0dWFsU2Nyb2xsUmVwZWF0ZXJ9IGZyb20gJy4vdmlydHVhbC1zY3JvbGwtcmVwZWF0ZXInO1xuaW1wb3J0IHtCb29sZWFuSW5wdXQsIGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7Q2RrVmlydHVhbFNjcm9sbGFibGUsIFZJUlRVQUxfU0NST0xMQUJMRX0gZnJvbSAnLi92aXJ0dWFsLXNjcm9sbGFibGUnO1xuXG4vKiogQ2hlY2tzIGlmIHRoZSBnaXZlbiByYW5nZXMgYXJlIGVxdWFsLiAqL1xuZnVuY3Rpb24gcmFuZ2VzRXF1YWwocjE6IExpc3RSYW5nZSwgcjI6IExpc3RSYW5nZSk6IGJvb2xlYW4ge1xuICByZXR1cm4gcjEuc3RhcnQgPT0gcjIuc3RhcnQgJiYgcjEuZW5kID09IHIyLmVuZDtcbn1cblxuLyoqXG4gKiBTY2hlZHVsZXIgdG8gYmUgdXNlZCBmb3Igc2Nyb2xsIGV2ZW50cy4gTmVlZHMgdG8gZmFsbCBiYWNrIHRvXG4gKiBzb21ldGhpbmcgdGhhdCBkb2Vzbid0IHJlbHkgb24gcmVxdWVzdEFuaW1hdGlvbkZyYW1lIG9uIGVudmlyb25tZW50c1xuICogdGhhdCBkb24ndCBzdXBwb3J0IGl0IChlLmcuIHNlcnZlci1zaWRlIHJlbmRlcmluZykuXG4gKi9cbmNvbnN0IFNDUk9MTF9TQ0hFRFVMRVIgPVxuICB0eXBlb2YgcmVxdWVzdEFuaW1hdGlvbkZyYW1lICE9PSAndW5kZWZpbmVkJyA/IGFuaW1hdGlvbkZyYW1lU2NoZWR1bGVyIDogYXNhcFNjaGVkdWxlcjtcblxuLyoqIEEgdmlld3BvcnQgdGhhdCB2aXJ0dWFsaXplcyBpdHMgc2Nyb2xsaW5nIHdpdGggdGhlIGhlbHAgb2YgYENka1ZpcnR1YWxGb3JPZmAuICovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdjZGstdmlydHVhbC1zY3JvbGwtdmlld3BvcnQnLFxuICB0ZW1wbGF0ZVVybDogJ3ZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0Lmh0bWwnLFxuICBzdHlsZVVybHM6IFsndmlydHVhbC1zY3JvbGwtdmlld3BvcnQuY3NzJ10sXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLXZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0JyxcbiAgICAnW2NsYXNzLmNkay12aXJ0dWFsLXNjcm9sbC1vcmllbnRhdGlvbi1ob3Jpem9udGFsXSc6ICdvcmllbnRhdGlvbiA9PT0gXCJob3Jpem9udGFsXCInLFxuICAgICdbY2xhc3MuY2RrLXZpcnR1YWwtc2Nyb2xsLW9yaWVudGF0aW9uLXZlcnRpY2FsXSc6ICdvcmllbnRhdGlvbiAhPT0gXCJob3Jpem9udGFsXCInLFxuICB9LFxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaCxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbiAgcHJvdmlkZXJzOiBbXG4gICAge1xuICAgICAgcHJvdmlkZTogQ2RrU2Nyb2xsYWJsZSxcbiAgICAgIHVzZUZhY3Rvcnk6IChcbiAgICAgICAgdmlydHVhbFNjcm9sbGFibGU6IENka1ZpcnR1YWxTY3JvbGxhYmxlIHwgbnVsbCxcbiAgICAgICAgdmlld3BvcnQ6IENka1ZpcnR1YWxTY3JvbGxWaWV3cG9ydCxcbiAgICAgICkgPT4gdmlydHVhbFNjcm9sbGFibGUgfHwgdmlld3BvcnQsXG4gICAgICBkZXBzOiBbW25ldyBPcHRpb25hbCgpLCBuZXcgSW5qZWN0KFZJUlRVQUxfU0NST0xMQUJMRSldLCBDZGtWaXJ0dWFsU2Nyb2xsVmlld3BvcnRdLFxuICAgIH0sXG4gIF0sXG59KVxuZXhwb3J0IGNsYXNzIENka1ZpcnR1YWxTY3JvbGxWaWV3cG9ydCBleHRlbmRzIENka1ZpcnR1YWxTY3JvbGxhYmxlIGltcGxlbWVudHMgT25Jbml0LCBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9wbGF0Zm9ybSA9IGluamVjdChQbGF0Zm9ybSk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHZpZXdwb3J0IGlzIGRldGFjaGVkIGZyb20gYSBDZGtWaXJ0dWFsRm9yT2YuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX2RldGFjaGVkU3ViamVjdCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHJlbmRlcmVkIHJhbmdlIGNoYW5nZXMuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX3JlbmRlcmVkUmFuZ2VTdWJqZWN0ID0gbmV3IFN1YmplY3Q8TGlzdFJhbmdlPigpO1xuXG4gIC8qKiBUaGUgZGlyZWN0aW9uIHRoZSB2aWV3cG9ydCBzY3JvbGxzLiAqL1xuICBASW5wdXQoKVxuICBnZXQgb3JpZW50YXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX29yaWVudGF0aW9uO1xuICB9XG5cbiAgc2V0IG9yaWVudGF0aW9uKG9yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcgfCAndmVydGljYWwnKSB7XG4gICAgaWYgKHRoaXMuX29yaWVudGF0aW9uICE9PSBvcmllbnRhdGlvbikge1xuICAgICAgdGhpcy5fb3JpZW50YXRpb24gPSBvcmllbnRhdGlvbjtcbiAgICAgIHRoaXMuX2NhbGN1bGF0ZVNwYWNlclNpemUoKTtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBfb3JpZW50YXRpb246ICdob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCcgPSAndmVydGljYWwnO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHJlbmRlcmVkIGl0ZW1zIHNob3VsZCBwZXJzaXN0IGluIHRoZSBET00gYWZ0ZXIgc2Nyb2xsaW5nIG91dCBvZiB2aWV3LiBCeSBkZWZhdWx0LCBpdGVtc1xuICAgKiB3aWxsIGJlIHJlbW92ZWQuXG4gICAqL1xuICBASW5wdXQoKVxuICBnZXQgYXBwZW5kT25seSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fYXBwZW5kT25seTtcbiAgfVxuICBzZXQgYXBwZW5kT25seSh2YWx1ZTogQm9vbGVhbklucHV0KSB7XG4gICAgdGhpcy5fYXBwZW5kT25seSA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gIH1cbiAgcHJpdmF0ZSBfYXBwZW5kT25seSA9IGZhbHNlO1xuXG4gIC8vIE5vdGU6IHdlIGRvbid0IHVzZSB0aGUgdHlwaWNhbCBFdmVudEVtaXR0ZXIgaGVyZSBiZWNhdXNlIHdlIG5lZWQgdG8gc3Vic2NyaWJlIHRvIHRoZSBzY3JvbGxcbiAgLy8gc3RyYXRlZ3kgbGF6aWx5IChpLmUuIG9ubHkgaWYgdGhlIHVzZXIgaXMgYWN0dWFsbHkgbGlzdGVuaW5nIHRvIHRoZSBldmVudHMpLiBXZSBkbyB0aGlzIGJlY2F1c2VcbiAgLy8gZGVwZW5kaW5nIG9uIGhvdyB0aGUgc3RyYXRlZ3kgY2FsY3VsYXRlcyB0aGUgc2Nyb2xsZWQgaW5kZXgsIGl0IG1heSBjb21lIGF0IGEgY29zdCB0b1xuICAvLyBwZXJmb3JtYW5jZS5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIGluZGV4IG9mIHRoZSBmaXJzdCBlbGVtZW50IHZpc2libGUgaW4gdGhlIHZpZXdwb3J0IGNoYW5nZXMuICovXG4gIEBPdXRwdXQoKVxuICByZWFkb25seSBzY3JvbGxlZEluZGV4Q2hhbmdlOiBPYnNlcnZhYmxlPG51bWJlcj4gPSBuZXcgT2JzZXJ2YWJsZSgob2JzZXJ2ZXI6IE9ic2VydmVyPG51bWJlcj4pID0+XG4gICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kuc2Nyb2xsZWRJbmRleENoYW5nZS5zdWJzY3JpYmUoaW5kZXggPT5cbiAgICAgIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4gdGhpcy5uZ1pvbmUucnVuKCgpID0+IG9ic2VydmVyLm5leHQoaW5kZXgpKSksXG4gICAgKSxcbiAgKTtcblxuICAvKiogVGhlIGVsZW1lbnQgdGhhdCB3cmFwcyB0aGUgcmVuZGVyZWQgY29udGVudC4gKi9cbiAgQFZpZXdDaGlsZCgnY29udGVudFdyYXBwZXInLCB7c3RhdGljOiB0cnVlfSkgX2NvbnRlbnRXcmFwcGVyOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PjtcblxuICAvKiogQSBzdHJlYW0gdGhhdCBlbWl0cyB3aGVuZXZlciB0aGUgcmVuZGVyZWQgcmFuZ2UgY2hhbmdlcy4gKi9cbiAgcmVhZG9ubHkgcmVuZGVyZWRSYW5nZVN0cmVhbTogT2JzZXJ2YWJsZTxMaXN0UmFuZ2U+ID0gdGhpcy5fcmVuZGVyZWRSYW5nZVN1YmplY3Q7XG5cbiAgLyoqXG4gICAqIFRoZSB0b3RhbCBzaXplIG9mIGFsbCBjb250ZW50IChpbiBwaXhlbHMpLCBpbmNsdWRpbmcgY29udGVudCB0aGF0IGlzIG5vdCBjdXJyZW50bHkgcmVuZGVyZWQuXG4gICAqL1xuICBwcml2YXRlIF90b3RhbENvbnRlbnRTaXplID0gMDtcblxuICAvKiogQSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBgc3R5bGUud2lkdGhgIHByb3BlcnR5IHZhbHVlIHRvIGJlIHVzZWQgZm9yIHRoZSBzcGFjZXIgZWxlbWVudC4gKi9cbiAgX3RvdGFsQ29udGVudFdpZHRoID0gJyc7XG5cbiAgLyoqIEEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgYHN0eWxlLmhlaWdodGAgcHJvcGVydHkgdmFsdWUgdG8gYmUgdXNlZCBmb3IgdGhlIHNwYWNlciBlbGVtZW50LiAqL1xuICBfdG90YWxDb250ZW50SGVpZ2h0ID0gJyc7XG5cbiAgLyoqXG4gICAqIFRoZSBDU1MgdHJhbnNmb3JtIGFwcGxpZWQgdG8gdGhlIHJlbmRlcmVkIHN1YnNldCBvZiBpdGVtcyBzbyB0aGF0IHRoZXkgYXBwZWFyIHdpdGhpbiB0aGUgYm91bmRzXG4gICAqIG9mIHRoZSB2aXNpYmxlIHZpZXdwb3J0LlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVuZGVyZWRDb250ZW50VHJhbnNmb3JtOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBjdXJyZW50bHkgcmVuZGVyZWQgcmFuZ2Ugb2YgaW5kaWNlcy4gKi9cbiAgcHJpdmF0ZSBfcmVuZGVyZWRSYW5nZTogTGlzdFJhbmdlID0ge3N0YXJ0OiAwLCBlbmQ6IDB9O1xuXG4gIC8qKiBUaGUgbGVuZ3RoIG9mIHRoZSBkYXRhIGJvdW5kIHRvIHRoaXMgdmlld3BvcnQgKGluIG51bWJlciBvZiBpdGVtcykuICovXG4gIHByaXZhdGUgX2RhdGFMZW5ndGggPSAwO1xuXG4gIC8qKiBUaGUgc2l6ZSBvZiB0aGUgdmlld3BvcnQgKGluIHBpeGVscykuICovXG4gIHByaXZhdGUgX3ZpZXdwb3J0U2l6ZSA9IDA7XG5cbiAgLyoqIHRoZSBjdXJyZW50bHkgYXR0YWNoZWQgQ2RrVmlydHVhbFNjcm9sbFJlcGVhdGVyLiAqL1xuICBwcml2YXRlIF9mb3JPZjogQ2RrVmlydHVhbFNjcm9sbFJlcGVhdGVyPGFueT4gfCBudWxsO1xuXG4gIC8qKiBUaGUgbGFzdCByZW5kZXJlZCBjb250ZW50IG9mZnNldCB0aGF0IHdhcyBzZXQuICovXG4gIHByaXZhdGUgX3JlbmRlcmVkQ29udGVudE9mZnNldCA9IDA7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGxhc3QgcmVuZGVyZWQgY29udGVudCBvZmZzZXQgd2FzIHRvIHRoZSBlbmQgb2YgdGhlIGNvbnRlbnQgKGFuZCB0aGVyZWZvcmUgbmVlZHMgdG9cbiAgICogYmUgcmV3cml0dGVuIGFzIGFuIG9mZnNldCB0byB0aGUgc3RhcnQgb2YgdGhlIGNvbnRlbnQpLlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVuZGVyZWRDb250ZW50T2Zmc2V0TmVlZHNSZXdyaXRlID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgdGhlcmUgaXMgYSBwZW5kaW5nIGNoYW5nZSBkZXRlY3Rpb24gY3ljbGUuICovXG4gIHByaXZhdGUgX2lzQ2hhbmdlRGV0ZWN0aW9uUGVuZGluZyA9IGZhbHNlO1xuXG4gIC8qKiBBIGxpc3Qgb2YgZnVuY3Rpb25zIHRvIHJ1biBhZnRlciB0aGUgbmV4dCBjaGFuZ2UgZGV0ZWN0aW9uIGN5Y2xlLiAqL1xuICBwcml2YXRlIF9ydW5BZnRlckNoYW5nZURldGVjdGlvbjogRnVuY3Rpb25bXSA9IFtdO1xuXG4gIC8qKiBTdWJzY3JpcHRpb24gdG8gY2hhbmdlcyBpbiB0aGUgdmlld3BvcnQgc2l6ZS4gKi9cbiAgcHJpdmF0ZSBfdmlld3BvcnRDaGFuZ2VzID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyBvdmVycmlkZSBlbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICBwcml2YXRlIF9jaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgbmdab25lOiBOZ1pvbmUsXG4gICAgQE9wdGlvbmFsKClcbiAgICBASW5qZWN0KFZJUlRVQUxfU0NST0xMX1NUUkFURUdZKVxuICAgIHByaXZhdGUgX3Njcm9sbFN0cmF0ZWd5OiBWaXJ0dWFsU2Nyb2xsU3RyYXRlZ3ksXG4gICAgQE9wdGlvbmFsKCkgZGlyOiBEaXJlY3Rpb25hbGl0eSxcbiAgICBzY3JvbGxEaXNwYXRjaGVyOiBTY3JvbGxEaXNwYXRjaGVyLFxuICAgIHZpZXdwb3J0UnVsZXI6IFZpZXdwb3J0UnVsZXIsXG4gICAgQE9wdGlvbmFsKCkgQEluamVjdChWSVJUVUFMX1NDUk9MTEFCTEUpIHB1YmxpYyBzY3JvbGxhYmxlOiBDZGtWaXJ0dWFsU2Nyb2xsYWJsZSxcbiAgKSB7XG4gICAgc3VwZXIoZWxlbWVudFJlZiwgc2Nyb2xsRGlzcGF0Y2hlciwgbmdab25lLCBkaXIpO1xuXG4gICAgaWYgKCFfc2Nyb2xsU3RyYXRlZ3kgJiYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgIHRocm93IEVycm9yKCdFcnJvcjogY2RrLXZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0IHJlcXVpcmVzIHRoZSBcIml0ZW1TaXplXCIgcHJvcGVydHkgdG8gYmUgc2V0LicpO1xuICAgIH1cblxuICAgIHRoaXMuX3ZpZXdwb3J0Q2hhbmdlcyA9IHZpZXdwb3J0UnVsZXIuY2hhbmdlKCkuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIHRoaXMuY2hlY2tWaWV3cG9ydFNpemUoKTtcbiAgICB9KTtcblxuICAgIGlmICghdGhpcy5zY3JvbGxhYmxlKSB7XG4gICAgICAvLyBObyBzY3JvbGxhYmxlIGlzIHByb3ZpZGVkLCBzbyB0aGUgdmlydHVhbC1zY3JvbGwtdmlld3BvcnQgbmVlZHMgdG8gYmVjb21lIGEgc2Nyb2xsYWJsZVxuICAgICAgdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnY2RrLXZpcnR1YWwtc2Nyb2xsYWJsZScpO1xuICAgICAgdGhpcy5zY3JvbGxhYmxlID0gdGhpcztcbiAgICB9XG4gIH1cblxuICBvdmVycmlkZSBuZ09uSW5pdCgpIHtcbiAgICAvLyBTY3JvbGxpbmcgZGVwZW5kcyBvbiB0aGUgZWxlbWVudCBkaW1lbnNpb25zIHdoaWNoIHdlIGNhbid0IGdldCBkdXJpbmcgU1NSLlxuICAgIGlmICghdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc2Nyb2xsYWJsZSA9PT0gdGhpcykge1xuICAgICAgc3VwZXIubmdPbkluaXQoKTtcbiAgICB9XG4gICAgLy8gSXQncyBzdGlsbCB0b28gZWFybHkgdG8gbWVhc3VyZSB0aGUgdmlld3BvcnQgYXQgdGhpcyBwb2ludC4gRGVmZXJyaW5nIHdpdGggYSBwcm9taXNlIGFsbG93c1xuICAgIC8vIHRoZSBWaWV3cG9ydCB0byBiZSByZW5kZXJlZCB3aXRoIHRoZSBjb3JyZWN0IHNpemUgYmVmb3JlIHdlIG1lYXN1cmUuIFdlIHJ1biB0aGlzIG91dHNpZGUgdGhlXG4gICAgLy8gem9uZSB0byBhdm9pZCBjYXVzaW5nIG1vcmUgY2hhbmdlIGRldGVjdGlvbiBjeWNsZXMuIFdlIGhhbmRsZSB0aGUgY2hhbmdlIGRldGVjdGlvbiBsb29wXG4gICAgLy8gb3Vyc2VsdmVzIGluc3RlYWQuXG4gICAgdGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT5cbiAgICAgIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLl9tZWFzdXJlVmlld3BvcnRTaXplKCk7XG4gICAgICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5LmF0dGFjaCh0aGlzKTtcblxuICAgICAgICB0aGlzLnNjcm9sbGFibGVcbiAgICAgICAgICAuZWxlbWVudFNjcm9sbGVkKClcbiAgICAgICAgICAucGlwZShcbiAgICAgICAgICAgIC8vIFN0YXJ0IG9mZiB3aXRoIGEgZmFrZSBzY3JvbGwgZXZlbnQgc28gd2UgcHJvcGVybHkgZGV0ZWN0IG91ciBpbml0aWFsIHBvc2l0aW9uLlxuICAgICAgICAgICAgc3RhcnRXaXRoKG51bGwpLFxuICAgICAgICAgICAgLy8gQ29sbGVjdCBtdWx0aXBsZSBldmVudHMgaW50byBvbmUgdW50aWwgdGhlIG5leHQgYW5pbWF0aW9uIGZyYW1lLiBUaGlzIHdheSBpZlxuICAgICAgICAgICAgLy8gdGhlcmUgYXJlIG11bHRpcGxlIHNjcm9sbCBldmVudHMgaW4gdGhlIHNhbWUgZnJhbWUgd2Ugb25seSBuZWVkIHRvIHJlY2hlY2tcbiAgICAgICAgICAgIC8vIG91ciBsYXlvdXQgb25jZS5cbiAgICAgICAgICAgIGF1ZGl0VGltZSgwLCBTQ1JPTExfU0NIRURVTEVSKSxcbiAgICAgICAgICApXG4gICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9zY3JvbGxTdHJhdGVneS5vbkNvbnRlbnRTY3JvbGxlZCgpKTtcblxuICAgICAgICB0aGlzLl9tYXJrQ2hhbmdlRGV0ZWN0aW9uTmVlZGVkKCk7XG4gICAgICB9KSxcbiAgICApO1xuICB9XG5cbiAgb3ZlcnJpZGUgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5kZXRhY2goKTtcbiAgICB0aGlzLl9zY3JvbGxTdHJhdGVneS5kZXRhY2goKTtcblxuICAgIC8vIENvbXBsZXRlIGFsbCBzdWJqZWN0c1xuICAgIHRoaXMuX3JlbmRlcmVkUmFuZ2VTdWJqZWN0LmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fZGV0YWNoZWRTdWJqZWN0LmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fdmlld3BvcnRDaGFuZ2VzLnVuc3Vic2NyaWJlKCk7XG5cbiAgICBzdXBlci5uZ09uRGVzdHJveSgpO1xuICB9XG5cbiAgLyoqIEF0dGFjaGVzIGEgYENka1ZpcnR1YWxTY3JvbGxSZXBlYXRlcmAgdG8gdGhpcyB2aWV3cG9ydC4gKi9cbiAgYXR0YWNoKGZvck9mOiBDZGtWaXJ0dWFsU2Nyb2xsUmVwZWF0ZXI8YW55Pikge1xuICAgIGlmICh0aGlzLl9mb3JPZiAmJiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgdGhyb3cgRXJyb3IoJ0Nka1ZpcnR1YWxTY3JvbGxWaWV3cG9ydCBpcyBhbHJlYWR5IGF0dGFjaGVkLicpO1xuICAgIH1cblxuICAgIC8vIFN1YnNjcmliZSB0byB0aGUgZGF0YSBzdHJlYW0gb2YgdGhlIENka1ZpcnR1YWxGb3JPZiB0byBrZWVwIHRyYWNrIG9mIHdoZW4gdGhlIGRhdGEgbGVuZ3RoXG4gICAgLy8gY2hhbmdlcy4gUnVuIG91dHNpZGUgdGhlIHpvbmUgdG8gYXZvaWQgdHJpZ2dlcmluZyBjaGFuZ2UgZGV0ZWN0aW9uLCBzaW5jZSB3ZSdyZSBtYW5hZ2luZyB0aGVcbiAgICAvLyBjaGFuZ2UgZGV0ZWN0aW9uIGxvb3Agb3Vyc2VsdmVzLlxuICAgIHRoaXMubmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHRoaXMuX2Zvck9mID0gZm9yT2Y7XG4gICAgICB0aGlzLl9mb3JPZi5kYXRhU3RyZWFtLnBpcGUodGFrZVVudGlsKHRoaXMuX2RldGFjaGVkU3ViamVjdCkpLnN1YnNjcmliZShkYXRhID0+IHtcbiAgICAgICAgY29uc3QgbmV3TGVuZ3RoID0gZGF0YS5sZW5ndGg7XG4gICAgICAgIGlmIChuZXdMZW5ndGggIT09IHRoaXMuX2RhdGFMZW5ndGgpIHtcbiAgICAgICAgICB0aGlzLl9kYXRhTGVuZ3RoID0gbmV3TGVuZ3RoO1xuICAgICAgICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5Lm9uRGF0YUxlbmd0aENoYW5nZWQoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9kb0NoYW5nZURldGVjdGlvbigpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogRGV0YWNoZXMgdGhlIGN1cnJlbnQgYENka1ZpcnR1YWxGb3JPZmAuICovXG4gIGRldGFjaCgpIHtcbiAgICB0aGlzLl9mb3JPZiA9IG51bGw7XG4gICAgdGhpcy5fZGV0YWNoZWRTdWJqZWN0Lm5leHQoKTtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBsZW5ndGggb2YgdGhlIGRhdGEgYm91bmQgdG8gdGhpcyB2aWV3cG9ydCAoaW4gbnVtYmVyIG9mIGl0ZW1zKS4gKi9cbiAgZ2V0RGF0YUxlbmd0aCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9kYXRhTGVuZ3RoO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIHNpemUgb2YgdGhlIHZpZXdwb3J0IChpbiBwaXhlbHMpLiAqL1xuICBnZXRWaWV3cG9ydFNpemUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdmlld3BvcnRTaXplO1xuICB9XG5cbiAgLy8gVE9ETyhtbWFsZXJiYSk6IFRoaXMgaXMgdGVjaG5pY2FsbHkgb3V0IG9mIHN5bmMgd2l0aCB3aGF0J3MgcmVhbGx5IHJlbmRlcmVkIHVudGlsIGEgcmVuZGVyXG4gIC8vIGN5Y2xlIGhhcHBlbnMuIEknbSBiZWluZyBjYXJlZnVsIHRvIG9ubHkgY2FsbCBpdCBhZnRlciB0aGUgcmVuZGVyIGN5Y2xlIGlzIGNvbXBsZXRlIGFuZCBiZWZvcmVcbiAgLy8gc2V0dGluZyBpdCB0byBzb21ldGhpbmcgZWxzZSwgYnV0IGl0cyBlcnJvciBwcm9uZSBhbmQgc2hvdWxkIHByb2JhYmx5IGJlIHNwbGl0IGludG9cbiAgLy8gYHBlbmRpbmdSYW5nZWAgYW5kIGByZW5kZXJlZFJhbmdlYCwgdGhlIGxhdHRlciByZWZsZWN0aW5nIHdoYXRzIGFjdHVhbGx5IGluIHRoZSBET00uXG5cbiAgLyoqIEdldCB0aGUgY3VycmVudCByZW5kZXJlZCByYW5nZSBvZiBpdGVtcy4gKi9cbiAgZ2V0UmVuZGVyZWRSYW5nZSgpOiBMaXN0UmFuZ2Uge1xuICAgIHJldHVybiB0aGlzLl9yZW5kZXJlZFJhbmdlO1xuICB9XG5cbiAgbWVhc3VyZUJvdW5kaW5nQ2xpZW50UmVjdFdpdGhTY3JvbGxPZmZzZXQoZnJvbTogJ2xlZnQnIHwgJ3RvcCcgfCAncmlnaHQnIHwgJ2JvdHRvbScpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmdldEVsZW1lbnRSZWYoKS5uYXRpdmVFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpW2Zyb21dO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHRvdGFsIHNpemUgb2YgYWxsIGNvbnRlbnQgKGluIHBpeGVscyksIGluY2x1ZGluZyBjb250ZW50IHRoYXQgaXMgbm90IGN1cnJlbnRseVxuICAgKiByZW5kZXJlZC5cbiAgICovXG4gIHNldFRvdGFsQ29udGVudFNpemUoc2l6ZTogbnVtYmVyKSB7XG4gICAgaWYgKHRoaXMuX3RvdGFsQ29udGVudFNpemUgIT09IHNpemUpIHtcbiAgICAgIHRoaXMuX3RvdGFsQ29udGVudFNpemUgPSBzaXplO1xuICAgICAgdGhpcy5fY2FsY3VsYXRlU3BhY2VyU2l6ZSgpO1xuICAgICAgdGhpcy5fbWFya0NoYW5nZURldGVjdGlvbk5lZWRlZCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBjdXJyZW50bHkgcmVuZGVyZWQgcmFuZ2Ugb2YgaW5kaWNlcy4gKi9cbiAgc2V0UmVuZGVyZWRSYW5nZShyYW5nZTogTGlzdFJhbmdlKSB7XG4gICAgaWYgKCFyYW5nZXNFcXVhbCh0aGlzLl9yZW5kZXJlZFJhbmdlLCByYW5nZSkpIHtcbiAgICAgIGlmICh0aGlzLmFwcGVuZE9ubHkpIHtcbiAgICAgICAgcmFuZ2UgPSB7c3RhcnQ6IDAsIGVuZDogTWF0aC5tYXgodGhpcy5fcmVuZGVyZWRSYW5nZS5lbmQsIHJhbmdlLmVuZCl9O1xuICAgICAgfVxuICAgICAgdGhpcy5fcmVuZGVyZWRSYW5nZVN1YmplY3QubmV4dCgodGhpcy5fcmVuZGVyZWRSYW5nZSA9IHJhbmdlKSk7XG4gICAgICB0aGlzLl9tYXJrQ2hhbmdlRGV0ZWN0aW9uTmVlZGVkKCgpID0+IHRoaXMuX3Njcm9sbFN0cmF0ZWd5Lm9uQ29udGVudFJlbmRlcmVkKCkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBvZmZzZXQgZnJvbSB0aGUgc3RhcnQgb2YgdGhlIHZpZXdwb3J0IHRvIHRoZSBzdGFydCBvZiB0aGUgcmVuZGVyZWQgZGF0YSAoaW4gcGl4ZWxzKS5cbiAgICovXG4gIGdldE9mZnNldFRvUmVuZGVyZWRDb250ZW50U3RhcnQoKTogbnVtYmVyIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX3JlbmRlcmVkQ29udGVudE9mZnNldE5lZWRzUmV3cml0ZSA/IG51bGwgOiB0aGlzLl9yZW5kZXJlZENvbnRlbnRPZmZzZXQ7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgb2Zmc2V0IGZyb20gdGhlIHN0YXJ0IG9mIHRoZSB2aWV3cG9ydCB0byBlaXRoZXIgdGhlIHN0YXJ0IG9yIGVuZCBvZiB0aGUgcmVuZGVyZWQgZGF0YVxuICAgKiAoaW4gcGl4ZWxzKS5cbiAgICovXG4gIHNldFJlbmRlcmVkQ29udGVudE9mZnNldChvZmZzZXQ6IG51bWJlciwgdG86ICd0by1zdGFydCcgfCAndG8tZW5kJyA9ICd0by1zdGFydCcpIHtcbiAgICAvLyBJbiBhcHBlbmRPbmx5LCB3ZSBhbHdheXMgc3RhcnQgZnJvbSB0aGUgdG9wXG4gICAgb2Zmc2V0ID0gdGhpcy5hcHBlbmRPbmx5ICYmIHRvID09PSAndG8tc3RhcnQnID8gMCA6IG9mZnNldDtcblxuICAgIC8vIEZvciBhIGhvcml6b250YWwgdmlld3BvcnQgaW4gYSByaWdodC10by1sZWZ0IGxhbmd1YWdlIHdlIG5lZWQgdG8gdHJhbnNsYXRlIGFsb25nIHRoZSB4LWF4aXNcbiAgICAvLyBpbiB0aGUgbmVnYXRpdmUgZGlyZWN0aW9uLlxuICAgIGNvbnN0IGlzUnRsID0gdGhpcy5kaXIgJiYgdGhpcy5kaXIudmFsdWUgPT0gJ3J0bCc7XG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gdGhpcy5vcmllbnRhdGlvbiA9PSAnaG9yaXpvbnRhbCc7XG4gICAgY29uc3QgYXhpcyA9IGlzSG9yaXpvbnRhbCA/ICdYJyA6ICdZJztcbiAgICBjb25zdCBheGlzRGlyZWN0aW9uID0gaXNIb3Jpem9udGFsICYmIGlzUnRsID8gLTEgOiAxO1xuICAgIGxldCB0cmFuc2Zvcm0gPSBgdHJhbnNsYXRlJHtheGlzfSgke051bWJlcihheGlzRGlyZWN0aW9uICogb2Zmc2V0KX1weClgO1xuICAgIHRoaXMuX3JlbmRlcmVkQ29udGVudE9mZnNldCA9IG9mZnNldDtcbiAgICBpZiAodG8gPT09ICd0by1lbmQnKSB7XG4gICAgICB0cmFuc2Zvcm0gKz0gYCB0cmFuc2xhdGUke2F4aXN9KC0xMDAlKWA7XG4gICAgICAvLyBUaGUgdmlld3BvcnQgc2hvdWxkIHJld3JpdGUgdGhpcyBhcyBhIGB0by1zdGFydGAgb2Zmc2V0IG9uIHRoZSBuZXh0IHJlbmRlciBjeWNsZS4gT3RoZXJ3aXNlXG4gICAgICAvLyBlbGVtZW50cyB3aWxsIGFwcGVhciB0byBleHBhbmQgaW4gdGhlIHdyb25nIGRpcmVjdGlvbiAoZS5nLiBgbWF0LWV4cGFuc2lvbi1wYW5lbGAgd291bGRcbiAgICAgIC8vIGV4cGFuZCB1cHdhcmQpLlxuICAgICAgdGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0TmVlZHNSZXdyaXRlID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3JlbmRlcmVkQ29udGVudFRyYW5zZm9ybSAhPSB0cmFuc2Zvcm0pIHtcbiAgICAgIC8vIFdlIGtub3cgdGhpcyB2YWx1ZSBpcyBzYWZlIGJlY2F1c2Ugd2UgcGFyc2UgYG9mZnNldGAgd2l0aCBgTnVtYmVyKClgIGJlZm9yZSBwYXNzaW5nIGl0XG4gICAgICAvLyBpbnRvIHRoZSBzdHJpbmcuXG4gICAgICB0aGlzLl9yZW5kZXJlZENvbnRlbnRUcmFuc2Zvcm0gPSB0cmFuc2Zvcm07XG4gICAgICB0aGlzLl9tYXJrQ2hhbmdlRGV0ZWN0aW9uTmVlZGVkKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuX3JlbmRlcmVkQ29udGVudE9mZnNldE5lZWRzUmV3cml0ZSkge1xuICAgICAgICAgIHRoaXMuX3JlbmRlcmVkQ29udGVudE9mZnNldCAtPSB0aGlzLm1lYXN1cmVSZW5kZXJlZENvbnRlbnRTaXplKCk7XG4gICAgICAgICAgdGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0TmVlZHNSZXdyaXRlID0gZmFsc2U7XG4gICAgICAgICAgdGhpcy5zZXRSZW5kZXJlZENvbnRlbnRPZmZzZXQodGhpcy5fcmVuZGVyZWRDb250ZW50T2Zmc2V0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl9zY3JvbGxTdHJhdGVneS5vblJlbmRlcmVkT2Zmc2V0Q2hhbmdlZCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2Nyb2xscyB0byB0aGUgZ2l2ZW4gb2Zmc2V0IGZyb20gdGhlIHN0YXJ0IG9mIHRoZSB2aWV3cG9ydC4gUGxlYXNlIG5vdGUgdGhhdCB0aGlzIGlzIG5vdCBhbHdheXNcbiAgICogdGhlIHNhbWUgYXMgc2V0dGluZyBgc2Nyb2xsVG9wYCBvciBgc2Nyb2xsTGVmdGAuIEluIGEgaG9yaXpvbnRhbCB2aWV3cG9ydCB3aXRoIHJpZ2h0LXRvLWxlZnRcbiAgICogZGlyZWN0aW9uLCB0aGlzIHdvdWxkIGJlIHRoZSBlcXVpdmFsZW50IG9mIHNldHRpbmcgYSBmaWN0aW9uYWwgYHNjcm9sbFJpZ2h0YCBwcm9wZXJ0eS5cbiAgICogQHBhcmFtIG9mZnNldCBUaGUgb2Zmc2V0IHRvIHNjcm9sbCB0by5cbiAgICogQHBhcmFtIGJlaGF2aW9yIFRoZSBTY3JvbGxCZWhhdmlvciB0byB1c2Ugd2hlbiBzY3JvbGxpbmcuIERlZmF1bHQgaXMgYmVoYXZpb3IgaXMgYGF1dG9gLlxuICAgKi9cbiAgc2Nyb2xsVG9PZmZzZXQob2Zmc2V0OiBudW1iZXIsIGJlaGF2aW9yOiBTY3JvbGxCZWhhdmlvciA9ICdhdXRvJykge1xuICAgIGNvbnN0IG9wdGlvbnM6IEV4dGVuZGVkU2Nyb2xsVG9PcHRpb25zID0ge2JlaGF2aW9yfTtcbiAgICBpZiAodGhpcy5vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnKSB7XG4gICAgICBvcHRpb25zLnN0YXJ0ID0gb2Zmc2V0O1xuICAgIH0gZWxzZSB7XG4gICAgICBvcHRpb25zLnRvcCA9IG9mZnNldDtcbiAgICB9XG4gICAgdGhpcy5zY3JvbGxhYmxlLnNjcm9sbFRvKG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNjcm9sbHMgdG8gdGhlIG9mZnNldCBmb3IgdGhlIGdpdmVuIGluZGV4LlxuICAgKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IHRvIHNjcm9sbCB0by5cbiAgICogQHBhcmFtIGJlaGF2aW9yIFRoZSBTY3JvbGxCZWhhdmlvciB0byB1c2Ugd2hlbiBzY3JvbGxpbmcuIERlZmF1bHQgaXMgYmVoYXZpb3IgaXMgYGF1dG9gLlxuICAgKi9cbiAgc2Nyb2xsVG9JbmRleChpbmRleDogbnVtYmVyLCBiZWhhdmlvcjogU2Nyb2xsQmVoYXZpb3IgPSAnYXV0bycpIHtcbiAgICB0aGlzLl9zY3JvbGxTdHJhdGVneS5zY3JvbGxUb0luZGV4KGluZGV4LCBiZWhhdmlvcik7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCBzY3JvbGwgb2Zmc2V0IGZyb20gdGhlIHN0YXJ0IG9mIHRoZSBzY3JvbGxhYmxlIChpbiBwaXhlbHMpLlxuICAgKiBAcGFyYW0gZnJvbSBUaGUgZWRnZSB0byBtZWFzdXJlIHRoZSBvZmZzZXQgZnJvbS4gRGVmYXVsdHMgdG8gJ3RvcCcgaW4gdmVydGljYWwgbW9kZSBhbmQgJ3N0YXJ0J1xuICAgKiAgICAgaW4gaG9yaXpvbnRhbCBtb2RlLlxuICAgKi9cbiAgb3ZlcnJpZGUgbWVhc3VyZVNjcm9sbE9mZnNldChcbiAgICBmcm9tPzogJ3RvcCcgfCAnbGVmdCcgfCAncmlnaHQnIHwgJ2JvdHRvbScgfCAnc3RhcnQnIHwgJ2VuZCcsXG4gICk6IG51bWJlciB7XG4gICAgLy8gVGhpcyBpcyB0byBicmVhayB0aGUgY2FsbCBjeWNsZVxuICAgIGxldCBtZWFzdXJlU2Nyb2xsT2Zmc2V0OiBJbnN0YW5jZVR5cGU8dHlwZW9mIENka1ZpcnR1YWxTY3JvbGxhYmxlPlsnbWVhc3VyZVNjcm9sbE9mZnNldCddO1xuICAgIGlmICh0aGlzLnNjcm9sbGFibGUgPT0gdGhpcykge1xuICAgICAgbWVhc3VyZVNjcm9sbE9mZnNldCA9IChfZnJvbTogTm9uTnVsbGFibGU8dHlwZW9mIGZyb20+KSA9PiBzdXBlci5tZWFzdXJlU2Nyb2xsT2Zmc2V0KF9mcm9tKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbWVhc3VyZVNjcm9sbE9mZnNldCA9IChfZnJvbTogTm9uTnVsbGFibGU8dHlwZW9mIGZyb20+KSA9PlxuICAgICAgICB0aGlzLnNjcm9sbGFibGUubWVhc3VyZVNjcm9sbE9mZnNldChfZnJvbSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIE1hdGgubWF4KFxuICAgICAgMCxcbiAgICAgIG1lYXN1cmVTY3JvbGxPZmZzZXQoZnJvbSA/PyAodGhpcy5vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnID8gJ3N0YXJ0JyA6ICd0b3AnKSkgLVxuICAgICAgICB0aGlzLm1lYXN1cmVWaWV3cG9ydE9mZnNldCgpLFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogTWVhc3VyZXMgdGhlIG9mZnNldCBvZiB0aGUgdmlld3BvcnQgZnJvbSB0aGUgc2Nyb2xsaW5nIGNvbnRhaW5lclxuICAgKiBAcGFyYW0gZnJvbSBUaGUgZWRnZSB0byBtZWFzdXJlIGZyb20uXG4gICAqL1xuICBtZWFzdXJlVmlld3BvcnRPZmZzZXQoZnJvbT86ICd0b3AnIHwgJ2xlZnQnIHwgJ3JpZ2h0JyB8ICdib3R0b20nIHwgJ3N0YXJ0JyB8ICdlbmQnKSB7XG4gICAgbGV0IGZyb21SZWN0OiAnbGVmdCcgfCAndG9wJyB8ICdyaWdodCcgfCAnYm90dG9tJztcbiAgICBjb25zdCBMRUZUID0gJ2xlZnQnO1xuICAgIGNvbnN0IFJJR0hUID0gJ3JpZ2h0JztcbiAgICBjb25zdCBpc1J0bCA9IHRoaXMuZGlyPy52YWx1ZSA9PSAncnRsJztcbiAgICBpZiAoZnJvbSA9PSAnc3RhcnQnKSB7XG4gICAgICBmcm9tUmVjdCA9IGlzUnRsID8gUklHSFQgOiBMRUZUO1xuICAgIH0gZWxzZSBpZiAoZnJvbSA9PSAnZW5kJykge1xuICAgICAgZnJvbVJlY3QgPSBpc1J0bCA/IExFRlQgOiBSSUdIVDtcbiAgICB9IGVsc2UgaWYgKGZyb20pIHtcbiAgICAgIGZyb21SZWN0ID0gZnJvbTtcbiAgICB9IGVsc2Uge1xuICAgICAgZnJvbVJlY3QgPSB0aGlzLm9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcgPyAnbGVmdCcgOiAndG9wJztcbiAgICB9XG5cbiAgICBjb25zdCBzY3JvbGxlckNsaWVudFJlY3QgPSB0aGlzLnNjcm9sbGFibGUubWVhc3VyZUJvdW5kaW5nQ2xpZW50UmVjdFdpdGhTY3JvbGxPZmZzZXQoZnJvbVJlY3QpO1xuICAgIGNvbnN0IHZpZXdwb3J0Q2xpZW50UmVjdCA9IHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpW2Zyb21SZWN0XTtcblxuICAgIHJldHVybiB2aWV3cG9ydENsaWVudFJlY3QgLSBzY3JvbGxlckNsaWVudFJlY3Q7XG4gIH1cblxuICAvKiogTWVhc3VyZSB0aGUgY29tYmluZWQgc2l6ZSBvZiBhbGwgb2YgdGhlIHJlbmRlcmVkIGl0ZW1zLiAqL1xuICBtZWFzdXJlUmVuZGVyZWRDb250ZW50U2l6ZSgpOiBudW1iZXIge1xuICAgIGNvbnN0IGNvbnRlbnRFbCA9IHRoaXMuX2NvbnRlbnRXcmFwcGVyLm5hdGl2ZUVsZW1lbnQ7XG4gICAgcmV0dXJuIHRoaXMub3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJyA/IGNvbnRlbnRFbC5vZmZzZXRXaWR0aCA6IGNvbnRlbnRFbC5vZmZzZXRIZWlnaHQ7XG4gIH1cblxuICAvKipcbiAgICogTWVhc3VyZSB0aGUgdG90YWwgY29tYmluZWQgc2l6ZSBvZiB0aGUgZ2l2ZW4gcmFuZ2UuIFRocm93cyBpZiB0aGUgcmFuZ2UgaW5jbHVkZXMgaXRlbXMgdGhhdCBhcmVcbiAgICogbm90IHJlbmRlcmVkLlxuICAgKi9cbiAgbWVhc3VyZVJhbmdlU2l6ZShyYW5nZTogTGlzdFJhbmdlKTogbnVtYmVyIHtcbiAgICBpZiAoIXRoaXMuX2Zvck9mKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2Zvck9mLm1lYXN1cmVSYW5nZVNpemUocmFuZ2UsIHRoaXMub3JpZW50YXRpb24pO1xuICB9XG5cbiAgLyoqIFVwZGF0ZSB0aGUgdmlld3BvcnQgZGltZW5zaW9ucyBhbmQgcmUtcmVuZGVyLiAqL1xuICBjaGVja1ZpZXdwb3J0U2l6ZSgpIHtcbiAgICAvLyBUT0RPOiBDbGVhbnVwIGxhdGVyIHdoZW4gYWRkIGxvZ2ljIGZvciBoYW5kbGluZyBjb250ZW50IHJlc2l6ZVxuICAgIHRoaXMuX21lYXN1cmVWaWV3cG9ydFNpemUoKTtcbiAgICB0aGlzLl9zY3JvbGxTdHJhdGVneS5vbkRhdGFMZW5ndGhDaGFuZ2VkKCk7XG4gIH1cblxuICAvKiogTWVhc3VyZSB0aGUgdmlld3BvcnQgc2l6ZS4gKi9cbiAgcHJpdmF0ZSBfbWVhc3VyZVZpZXdwb3J0U2l6ZSgpIHtcbiAgICB0aGlzLl92aWV3cG9ydFNpemUgPSB0aGlzLnNjcm9sbGFibGUubWVhc3VyZVZpZXdwb3J0U2l6ZSh0aGlzLm9yaWVudGF0aW9uKTtcbiAgfVxuXG4gIC8qKiBRdWV1ZSB1cCBjaGFuZ2UgZGV0ZWN0aW9uIHRvIHJ1bi4gKi9cbiAgcHJpdmF0ZSBfbWFya0NoYW5nZURldGVjdGlvbk5lZWRlZChydW5BZnRlcj86IEZ1bmN0aW9uKSB7XG4gICAgaWYgKHJ1bkFmdGVyKSB7XG4gICAgICB0aGlzLl9ydW5BZnRlckNoYW5nZURldGVjdGlvbi5wdXNoKHJ1bkFmdGVyKTtcbiAgICB9XG5cbiAgICAvLyBVc2UgYSBQcm9taXNlIHRvIGJhdGNoIHRvZ2V0aGVyIGNhbGxzIHRvIGBfZG9DaGFuZ2VEZXRlY3Rpb25gLiBUaGlzIHdheSBpZiB3ZSBzZXQgYSBidW5jaCBvZlxuICAgIC8vIHByb3BlcnRpZXMgc2VxdWVudGlhbGx5IHdlIG9ubHkgaGF2ZSB0byBydW4gYF9kb0NoYW5nZURldGVjdGlvbmAgb25jZSBhdCB0aGUgZW5kLlxuICAgIGlmICghdGhpcy5faXNDaGFuZ2VEZXRlY3Rpb25QZW5kaW5nKSB7XG4gICAgICB0aGlzLl9pc0NoYW5nZURldGVjdGlvblBlbmRpbmcgPSB0cnVlO1xuICAgICAgdGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT5cbiAgICAgICAgUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgdGhpcy5fZG9DaGFuZ2VEZXRlY3Rpb24oKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSdW4gY2hhbmdlIGRldGVjdGlvbi4gKi9cbiAgcHJpdmF0ZSBfZG9DaGFuZ2VEZXRlY3Rpb24oKSB7XG4gICAgdGhpcy5faXNDaGFuZ2VEZXRlY3Rpb25QZW5kaW5nID0gZmFsc2U7XG5cbiAgICAvLyBBcHBseSB0aGUgY29udGVudCB0cmFuc2Zvcm0uIFRoZSB0cmFuc2Zvcm0gY2FuJ3QgYmUgc2V0IHZpYSBhbiBBbmd1bGFyIGJpbmRpbmcgYmVjYXVzZVxuICAgIC8vIGJ5cGFzc1NlY3VyaXR5VHJ1c3RTdHlsZSBpcyBiYW5uZWQgaW4gR29vZ2xlLiBIb3dldmVyIHRoZSB2YWx1ZSBpcyBzYWZlLCBpdCdzIGNvbXBvc2VkIG9mXG4gICAgLy8gc3RyaW5nIGxpdGVyYWxzLCBhIHZhcmlhYmxlIHRoYXQgY2FuIG9ubHkgYmUgJ1gnIG9yICdZJywgYW5kIHVzZXIgaW5wdXQgdGhhdCBpcyBydW4gdGhyb3VnaFxuICAgIC8vIHRoZSBgTnVtYmVyYCBmdW5jdGlvbiBmaXJzdCB0byBjb2VyY2UgaXQgdG8gYSBudW1lcmljIHZhbHVlLlxuICAgIHRoaXMuX2NvbnRlbnRXcmFwcGVyLm5hdGl2ZUVsZW1lbnQuc3R5bGUudHJhbnNmb3JtID0gdGhpcy5fcmVuZGVyZWRDb250ZW50VHJhbnNmb3JtO1xuICAgIC8vIEFwcGx5IGNoYW5nZXMgdG8gQW5ndWxhciBiaW5kaW5ncy4gTm90ZTogV2UgbXVzdCBjYWxsIGBtYXJrRm9yQ2hlY2tgIHRvIHJ1biBjaGFuZ2UgZGV0ZWN0aW9uXG4gICAgLy8gZnJvbSB0aGUgcm9vdCwgc2luY2UgdGhlIHJlcGVhdGVkIGl0ZW1zIGFyZSBjb250ZW50IHByb2plY3RlZCBpbi4gQ2FsbGluZyBgZGV0ZWN0Q2hhbmdlc2BcbiAgICAvLyBpbnN0ZWFkIGRvZXMgbm90IHByb3Blcmx5IGNoZWNrIHRoZSBwcm9qZWN0ZWQgY29udGVudC5cbiAgICB0aGlzLm5nWm9uZS5ydW4oKCkgPT4gdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCkpO1xuXG4gICAgY29uc3QgcnVuQWZ0ZXJDaGFuZ2VEZXRlY3Rpb24gPSB0aGlzLl9ydW5BZnRlckNoYW5nZURldGVjdGlvbjtcbiAgICB0aGlzLl9ydW5BZnRlckNoYW5nZURldGVjdGlvbiA9IFtdO1xuICAgIGZvciAoY29uc3QgZm4gb2YgcnVuQWZ0ZXJDaGFuZ2VEZXRlY3Rpb24pIHtcbiAgICAgIGZuKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENhbGN1bGF0ZXMgdGhlIGBzdHlsZS53aWR0aGAgYW5kIGBzdHlsZS5oZWlnaHRgIGZvciB0aGUgc3BhY2VyIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX2NhbGN1bGF0ZVNwYWNlclNpemUoKSB7XG4gICAgdGhpcy5fdG90YWxDb250ZW50SGVpZ2h0ID1cbiAgICAgIHRoaXMub3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJyA/ICcnIDogYCR7dGhpcy5fdG90YWxDb250ZW50U2l6ZX1weGA7XG4gICAgdGhpcy5fdG90YWxDb250ZW50V2lkdGggPVxuICAgICAgdGhpcy5vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnID8gYCR7dGhpcy5fdG90YWxDb250ZW50U2l6ZX1weGAgOiAnJztcbiAgfVxufVxuIiwiPCEtLVxuICBXcmFwIHRoZSByZW5kZXJlZCBjb250ZW50IGluIGFuIGVsZW1lbnQgdGhhdCB3aWxsIGJlIHVzZWQgdG8gb2Zmc2V0IGl0IGJhc2VkIG9uIHRoZSBzY3JvbGxcbiAgcG9zaXRpb24uXG4tLT5cbjxkaXYgI2NvbnRlbnRXcmFwcGVyIGNsYXNzPVwiY2RrLXZpcnR1YWwtc2Nyb2xsLWNvbnRlbnQtd3JhcHBlclwiPlxuICA8bmctY29udGVudD48L25nLWNvbnRlbnQ+XG48L2Rpdj5cbjwhLS1cbiAgU3BhY2VyIHVzZWQgdG8gZm9yY2UgdGhlIHNjcm9sbGluZyBjb250YWluZXIgdG8gdGhlIGNvcnJlY3Qgc2l6ZSBmb3IgdGhlICp0b3RhbCogbnVtYmVyIG9mIGl0ZW1zXG4gIHNvIHRoYXQgdGhlIHNjcm9sbGJhciBjYXB0dXJlcyB0aGUgc2l6ZSBvZiB0aGUgZW50aXJlIGRhdGEgc2V0LlxuLS0+XG48ZGl2IGNsYXNzPVwiY2RrLXZpcnR1YWwtc2Nyb2xsLXNwYWNlclwiXG4gICAgIFtzdHlsZS53aWR0aF09XCJfdG90YWxDb250ZW50V2lkdGhcIiBbc3R5bGUuaGVpZ2h0XT1cIl90b3RhbENvbnRlbnRIZWlnaHRcIj48L2Rpdj5cbiJdfQ==