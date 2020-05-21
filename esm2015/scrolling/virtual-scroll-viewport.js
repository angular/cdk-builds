/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __decorate, __metadata, __param } from "tslib";
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
const SCROLL_SCHEDULER = typeof requestAnimationFrame !== 'undefined' ? animationFrameScheduler : asapScheduler;
/** A viewport that virtualizes its scrolling with the help of `CdkVirtualForOf`. */
let CdkVirtualScrollViewport = /** @class */ (() => {
    var CdkVirtualScrollViewport_1;
    let CdkVirtualScrollViewport = CdkVirtualScrollViewport_1 = class CdkVirtualScrollViewport extends CdkScrollable {
        constructor(elementRef, _changeDetectorRef, ngZone, _scrollStrategy, dir, scrollDispatcher, 
        /**
         * @deprecated `viewportRuler` parameter to become required.
         * @breaking-change 11.0.0
         */
        viewportRuler) {
            super(elementRef, scrollDispatcher, ngZone, dir);
            this.elementRef = elementRef;
            this._changeDetectorRef = _changeDetectorRef;
            this._scrollStrategy = _scrollStrategy;
            /** Emits when the viewport is detached from a CdkVirtualForOf. */
            this._detachedSubject = new Subject();
            /** Emits when the rendered range changes. */
            this._renderedRangeSubject = new Subject();
            this._orientation = 'vertical';
            // Note: we don't use the typical EventEmitter here because we need to subscribe to the scroll
            // strategy lazily (i.e. only if the user is actually listening to the events). We do this because
            // depending on how the strategy calculates the scrolled index, it may come at a cost to
            // performance.
            /** Emits when the index of the first element visible in the viewport changes. */
            this.scrolledIndexChange = new Observable((observer) => this._scrollStrategy.scrolledIndexChange.subscribe(index => Promise.resolve().then(() => this.ngZone.run(() => observer.next(index)))));
            /** A stream that emits whenever the rendered range changes. */
            this.renderedRangeStream = this._renderedRangeSubject.asObservable();
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
            if (!_scrollStrategy) {
                throw Error('Error: cdk-virtual-scroll-viewport requires the "itemSize" property to be set.');
            }
            // @breaking-change 11.0.0 Remove null check for `viewportRuler`.
            if (viewportRuler) {
                this._viewportChanges = viewportRuler.change().subscribe(() => {
                    this.checkViewportSize();
                });
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
        /** Attaches a `CdkVirtualForOf` to this viewport. */
        attach(forOf) {
            if (this._forOf) {
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
    };
    __decorate([
        Input(),
        __metadata("design:type", String),
        __metadata("design:paramtypes", [String])
    ], CdkVirtualScrollViewport.prototype, "orientation", null);
    __decorate([
        Output(),
        __metadata("design:type", Observable)
    ], CdkVirtualScrollViewport.prototype, "scrolledIndexChange", void 0);
    __decorate([
        ViewChild('contentWrapper', { static: true }),
        __metadata("design:type", ElementRef)
    ], CdkVirtualScrollViewport.prototype, "_contentWrapper", void 0);
    CdkVirtualScrollViewport = CdkVirtualScrollViewport_1 = __decorate([
        Component({
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
                    useExisting: CdkVirtualScrollViewport_1,
                }],
            styles: ["cdk-virtual-scroll-viewport{display:block;position:relative;overflow:auto;contain:strict;transform:translateZ(0);will-change:scroll-position;-webkit-overflow-scrolling:touch}.cdk-virtual-scroll-content-wrapper{position:absolute;top:0;left:0;contain:content}[dir=rtl] .cdk-virtual-scroll-content-wrapper{right:0;left:auto}.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper{min-height:100%}.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>dl:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>ol:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>table:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>ul:not([cdkVirtualFor]){padding-left:0;padding-right:0;margin-left:0;margin-right:0;border-left-width:0;border-right-width:0;outline:none}.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper{min-width:100%}.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>dl:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>ol:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>table:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>ul:not([cdkVirtualFor]){padding-top:0;padding-bottom:0;margin-top:0;margin-bottom:0;border-top-width:0;border-bottom-width:0;outline:none}.cdk-virtual-scroll-spacer{position:absolute;top:0;left:0;height:1px;width:1px;transform-origin:0 0}[dir=rtl] .cdk-virtual-scroll-spacer{right:0;left:auto;transform-origin:100% 0}\n"]
        }),
        __param(3, Optional()), __param(3, Inject(VIRTUAL_SCROLL_STRATEGY)),
        __param(4, Optional()),
        __param(6, Optional()),
        __metadata("design:paramtypes", [ElementRef,
            ChangeDetectorRef,
            NgZone, Object, Directionality,
            ScrollDispatcher,
            ViewportRuler])
    ], CdkVirtualScrollViewport);
    return CdkVirtualScrollViewport;
})();
export { CdkVirtualScrollViewport };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1zY3JvbGwtdmlld3BvcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy92aXJ0dWFsLXNjcm9sbC12aWV3cG9ydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRWpELE9BQU8sRUFDTCx1QkFBdUIsRUFDdkIsaUJBQWlCLEVBQ2pCLFNBQVMsRUFDVCxVQUFVLEVBQ1YsTUFBTSxFQUNOLEtBQUssRUFDTCxNQUFNLEVBR04sUUFBUSxFQUNSLE1BQU0sRUFDTixTQUFTLEVBQ1QsaUJBQWlCLEdBQ2xCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFDTCx1QkFBdUIsRUFDdkIsYUFBYSxFQUNiLFVBQVUsRUFDVixPQUFPLEVBRVAsWUFBWSxHQUNiLE1BQU0sTUFBTSxDQUFDO0FBQ2QsT0FBTyxFQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDL0QsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDckQsT0FBTyxFQUFDLGFBQWEsRUFBMEIsTUFBTSxjQUFjLENBQUM7QUFFcEUsT0FBTyxFQUFDLHVCQUF1QixFQUF3QixNQUFNLDJCQUEyQixDQUFDO0FBQ3pGLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUUvQyw0Q0FBNEM7QUFDNUMsU0FBUyxXQUFXLENBQUMsRUFBYSxFQUFFLEVBQWE7SUFDL0MsT0FBTyxFQUFFLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDO0FBQ2xELENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsTUFBTSxnQkFBZ0IsR0FDbEIsT0FBTyxxQkFBcUIsS0FBSyxX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REFBbUQsRUFBRSw4QkFBOEI7Z0JBQ25GLGlEQUFpRCxFQUFFLDhCQUE4QjthQUNsRjtZQUNELGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJO1lBQ3JDLGVBQWUsRUFBRSx1QkFBdUIsQ0FBQyxNQUFNO1lBQy9DLFNBQVMsRUFBRSxDQUFDO29CQUNWLE9BQU8sRUFBRSxhQUFhO29CQUN0QixXQUFXLEVBQUUsMEJBQXdCO2lCQUN0QyxDQUFDOztTQUNILENBQUM7UUF1RmEsV0FBQSxRQUFRLEVBQUUsQ0FBQSxFQUFFLFdBQUEsTUFBTSxDQUFDLHVCQUF1QixDQUFDLENBQUE7UUFFM0MsV0FBQSxRQUFRLEVBQUUsQ0FBQTtRQU1WLFdBQUEsUUFBUSxFQUFFLENBQUE7eUNBWFEsVUFBVTtZQUNELGlCQUFpQjtZQUNyQyxNQUFNLFVBR0csY0FBYztZQUNiLGdCQUFnQjtZQUtOLGFBQWE7T0E5RjFDLHdCQUF3QixDQWlYcEM7SUFBRCwrQkFBQztLQUFBO1NBalhZLHdCQUF3QiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge0xpc3RSYW5nZX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvbGxlY3Rpb25zJztcbmltcG9ydCB7XG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBFbGVtZW50UmVmLFxuICBJbmplY3QsXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgT25Jbml0LFxuICBPcHRpb25hbCxcbiAgT3V0cHV0LFxuICBWaWV3Q2hpbGQsXG4gIFZpZXdFbmNhcHN1bGF0aW9uLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7XG4gIGFuaW1hdGlvbkZyYW1lU2NoZWR1bGVyLFxuICBhc2FwU2NoZWR1bGVyLFxuICBPYnNlcnZhYmxlLFxuICBTdWJqZWN0LFxuICBPYnNlcnZlcixcbiAgU3Vic2NyaXB0aW9uLFxufSBmcm9tICdyeGpzJztcbmltcG9ydCB7YXVkaXRUaW1lLCBzdGFydFdpdGgsIHRha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtTY3JvbGxEaXNwYXRjaGVyfSBmcm9tICcuL3Njcm9sbC1kaXNwYXRjaGVyJztcbmltcG9ydCB7Q2RrU2Nyb2xsYWJsZSwgRXh0ZW5kZWRTY3JvbGxUb09wdGlvbnN9IGZyb20gJy4vc2Nyb2xsYWJsZSc7XG5pbXBvcnQge0Nka1ZpcnR1YWxGb3JPZn0gZnJvbSAnLi92aXJ0dWFsLWZvci1vZic7XG5pbXBvcnQge1ZJUlRVQUxfU0NST0xMX1NUUkFURUdZLCBWaXJ0dWFsU2Nyb2xsU3RyYXRlZ3l9IGZyb20gJy4vdmlydHVhbC1zY3JvbGwtc3RyYXRlZ3knO1xuaW1wb3J0IHtWaWV3cG9ydFJ1bGVyfSBmcm9tICcuL3ZpZXdwb3J0LXJ1bGVyJztcblxuLyoqIENoZWNrcyBpZiB0aGUgZ2l2ZW4gcmFuZ2VzIGFyZSBlcXVhbC4gKi9cbmZ1bmN0aW9uIHJhbmdlc0VxdWFsKHIxOiBMaXN0UmFuZ2UsIHIyOiBMaXN0UmFuZ2UpOiBib29sZWFuIHtcbiAgcmV0dXJuIHIxLnN0YXJ0ID09IHIyLnN0YXJ0ICYmIHIxLmVuZCA9PSByMi5lbmQ7XG59XG5cbi8qKlxuICogU2NoZWR1bGVyIHRvIGJlIHVzZWQgZm9yIHNjcm9sbCBldmVudHMuIE5lZWRzIHRvIGZhbGwgYmFjayB0b1xuICogc29tZXRoaW5nIHRoYXQgZG9lc24ndCByZWx5IG9uIHJlcXVlc3RBbmltYXRpb25GcmFtZSBvbiBlbnZpcm9ubWVudHNcbiAqIHRoYXQgZG9uJ3Qgc3VwcG9ydCBpdCAoZS5nLiBzZXJ2ZXItc2lkZSByZW5kZXJpbmcpLlxuICovXG5jb25zdCBTQ1JPTExfU0NIRURVTEVSID1cbiAgICB0eXBlb2YgcmVxdWVzdEFuaW1hdGlvbkZyYW1lICE9PSAndW5kZWZpbmVkJyA/IGFuaW1hdGlvbkZyYW1lU2NoZWR1bGVyIDogYXNhcFNjaGVkdWxlcjtcblxuXG4vKiogQSB2aWV3cG9ydCB0aGF0IHZpcnR1YWxpemVzIGl0cyBzY3JvbGxpbmcgd2l0aCB0aGUgaGVscCBvZiBgQ2RrVmlydHVhbEZvck9mYC4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2Nkay12aXJ0dWFsLXNjcm9sbC12aWV3cG9ydCcsXG4gIHRlbXBsYXRlVXJsOiAndmlydHVhbC1zY3JvbGwtdmlld3BvcnQuaHRtbCcsXG4gIHN0eWxlVXJsczogWyd2aXJ0dWFsLXNjcm9sbC12aWV3cG9ydC5jc3MnXSxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstdmlydHVhbC1zY3JvbGwtdmlld3BvcnQnLFxuICAgICdbY2xhc3MuY2RrLXZpcnR1YWwtc2Nyb2xsLW9yaWVudGF0aW9uLWhvcml6b250YWxdJzogJ29yaWVudGF0aW9uID09PSBcImhvcml6b250YWxcIicsXG4gICAgJ1tjbGFzcy5jZGstdmlydHVhbC1zY3JvbGwtb3JpZW50YXRpb24tdmVydGljYWxdJzogJ29yaWVudGF0aW9uICE9PSBcImhvcml6b250YWxcIicsXG4gIH0sXG4gIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxuICBwcm92aWRlcnM6IFt7XG4gICAgcHJvdmlkZTogQ2RrU2Nyb2xsYWJsZSxcbiAgICB1c2VFeGlzdGluZzogQ2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0LFxuICB9XVxufSlcbmV4cG9ydCBjbGFzcyBDZGtWaXJ0dWFsU2Nyb2xsVmlld3BvcnQgZXh0ZW5kcyBDZGtTY3JvbGxhYmxlIGltcGxlbWVudHMgT25Jbml0LCBPbkRlc3Ryb3kge1xuICAvKiogRW1pdHMgd2hlbiB0aGUgdmlld3BvcnQgaXMgZGV0YWNoZWQgZnJvbSBhIENka1ZpcnR1YWxGb3JPZi4gKi9cbiAgcHJpdmF0ZSBfZGV0YWNoZWRTdWJqZWN0ID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgcmVuZGVyZWQgcmFuZ2UgY2hhbmdlcy4gKi9cbiAgcHJpdmF0ZSBfcmVuZGVyZWRSYW5nZVN1YmplY3QgPSBuZXcgU3ViamVjdDxMaXN0UmFuZ2U+KCk7XG5cbiAgLyoqIFRoZSBkaXJlY3Rpb24gdGhlIHZpZXdwb3J0IHNjcm9sbHMuICovXG4gIEBJbnB1dCgpXG4gIGdldCBvcmllbnRhdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fb3JpZW50YXRpb247XG4gIH1cbiAgc2V0IG9yaWVudGF0aW9uKG9yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcgfCAndmVydGljYWwnKSB7XG4gICAgaWYgKHRoaXMuX29yaWVudGF0aW9uICE9PSBvcmllbnRhdGlvbikge1xuICAgICAgdGhpcy5fb3JpZW50YXRpb24gPSBvcmllbnRhdGlvbjtcbiAgICAgIHRoaXMuX2NhbGN1bGF0ZVNwYWNlclNpemUoKTtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBfb3JpZW50YXRpb246ICdob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCcgPSAndmVydGljYWwnO1xuXG4gIC8vIE5vdGU6IHdlIGRvbid0IHVzZSB0aGUgdHlwaWNhbCBFdmVudEVtaXR0ZXIgaGVyZSBiZWNhdXNlIHdlIG5lZWQgdG8gc3Vic2NyaWJlIHRvIHRoZSBzY3JvbGxcbiAgLy8gc3RyYXRlZ3kgbGF6aWx5IChpLmUuIG9ubHkgaWYgdGhlIHVzZXIgaXMgYWN0dWFsbHkgbGlzdGVuaW5nIHRvIHRoZSBldmVudHMpLiBXZSBkbyB0aGlzIGJlY2F1c2VcbiAgLy8gZGVwZW5kaW5nIG9uIGhvdyB0aGUgc3RyYXRlZ3kgY2FsY3VsYXRlcyB0aGUgc2Nyb2xsZWQgaW5kZXgsIGl0IG1heSBjb21lIGF0IGEgY29zdCB0b1xuICAvLyBwZXJmb3JtYW5jZS5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIGluZGV4IG9mIHRoZSBmaXJzdCBlbGVtZW50IHZpc2libGUgaW4gdGhlIHZpZXdwb3J0IGNoYW5nZXMuICovXG4gIEBPdXRwdXQoKSBzY3JvbGxlZEluZGV4Q2hhbmdlOiBPYnNlcnZhYmxlPG51bWJlcj4gPVxuICAgICAgbmV3IE9ic2VydmFibGUoKG9ic2VydmVyOiBPYnNlcnZlcjxudW1iZXI+KSA9PlxuICAgICAgICB0aGlzLl9zY3JvbGxTdHJhdGVneS5zY3JvbGxlZEluZGV4Q2hhbmdlLnN1YnNjcmliZShpbmRleCA9PlxuICAgICAgICAgICAgUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB0aGlzLm5nWm9uZS5ydW4oKCkgPT4gb2JzZXJ2ZXIubmV4dChpbmRleCkpKSkpO1xuXG4gIC8qKiBUaGUgZWxlbWVudCB0aGF0IHdyYXBzIHRoZSByZW5kZXJlZCBjb250ZW50LiAqL1xuICBAVmlld0NoaWxkKCdjb250ZW50V3JhcHBlcicsIHtzdGF0aWM6IHRydWV9KSBfY29udGVudFdyYXBwZXI6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+O1xuXG4gIC8qKiBBIHN0cmVhbSB0aGF0IGVtaXRzIHdoZW5ldmVyIHRoZSByZW5kZXJlZCByYW5nZSBjaGFuZ2VzLiAqL1xuICByZW5kZXJlZFJhbmdlU3RyZWFtOiBPYnNlcnZhYmxlPExpc3RSYW5nZT4gPSB0aGlzLl9yZW5kZXJlZFJhbmdlU3ViamVjdC5hc09ic2VydmFibGUoKTtcblxuICAvKipcbiAgICogVGhlIHRvdGFsIHNpemUgb2YgYWxsIGNvbnRlbnQgKGluIHBpeGVscyksIGluY2x1ZGluZyBjb250ZW50IHRoYXQgaXMgbm90IGN1cnJlbnRseSByZW5kZXJlZC5cbiAgICovXG4gIHByaXZhdGUgX3RvdGFsQ29udGVudFNpemUgPSAwO1xuXG4gIC8qKiBBIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIGBzdHlsZS53aWR0aGAgcHJvcGVydHkgdmFsdWUgdG8gYmUgdXNlZCBmb3IgdGhlIHNwYWNlciBlbGVtZW50LiAqL1xuICBfdG90YWxDb250ZW50V2lkdGggPSAnJztcblxuICAvKiogQSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBgc3R5bGUuaGVpZ2h0YCBwcm9wZXJ0eSB2YWx1ZSB0byBiZSB1c2VkIGZvciB0aGUgc3BhY2VyIGVsZW1lbnQuICovXG4gIF90b3RhbENvbnRlbnRIZWlnaHQgPSAnJztcblxuICAvKipcbiAgICogVGhlIENTUyB0cmFuc2Zvcm0gYXBwbGllZCB0byB0aGUgcmVuZGVyZWQgc3Vic2V0IG9mIGl0ZW1zIHNvIHRoYXQgdGhleSBhcHBlYXIgd2l0aGluIHRoZSBib3VuZHNcbiAgICogb2YgdGhlIHZpc2libGUgdmlld3BvcnQuXG4gICAqL1xuICBwcml2YXRlIF9yZW5kZXJlZENvbnRlbnRUcmFuc2Zvcm06IHN0cmluZztcblxuICAvKiogVGhlIGN1cnJlbnRseSByZW5kZXJlZCByYW5nZSBvZiBpbmRpY2VzLiAqL1xuICBwcml2YXRlIF9yZW5kZXJlZFJhbmdlOiBMaXN0UmFuZ2UgPSB7c3RhcnQ6IDAsIGVuZDogMH07XG5cbiAgLyoqIFRoZSBsZW5ndGggb2YgdGhlIGRhdGEgYm91bmQgdG8gdGhpcyB2aWV3cG9ydCAoaW4gbnVtYmVyIG9mIGl0ZW1zKS4gKi9cbiAgcHJpdmF0ZSBfZGF0YUxlbmd0aCA9IDA7XG5cbiAgLyoqIFRoZSBzaXplIG9mIHRoZSB2aWV3cG9ydCAoaW4gcGl4ZWxzKS4gKi9cbiAgcHJpdmF0ZSBfdmlld3BvcnRTaXplID0gMDtcblxuICAvKiogdGhlIGN1cnJlbnRseSBhdHRhY2hlZCBDZGtWaXJ0dWFsRm9yT2YuICovXG4gIHByaXZhdGUgX2Zvck9mOiBDZGtWaXJ0dWFsRm9yT2Y8YW55PiB8IG51bGw7XG5cbiAgLyoqIFRoZSBsYXN0IHJlbmRlcmVkIGNvbnRlbnQgb2Zmc2V0IHRoYXQgd2FzIHNldC4gKi9cbiAgcHJpdmF0ZSBfcmVuZGVyZWRDb250ZW50T2Zmc2V0ID0gMDtcblxuICAvKipcbiAgICogV2hldGhlciB0aGUgbGFzdCByZW5kZXJlZCBjb250ZW50IG9mZnNldCB3YXMgdG8gdGhlIGVuZCBvZiB0aGUgY29udGVudCAoYW5kIHRoZXJlZm9yZSBuZWVkcyB0b1xuICAgKiBiZSByZXdyaXR0ZW4gYXMgYW4gb2Zmc2V0IHRvIHRoZSBzdGFydCBvZiB0aGUgY29udGVudCkuXG4gICAqL1xuICBwcml2YXRlIF9yZW5kZXJlZENvbnRlbnRPZmZzZXROZWVkc1Jld3JpdGUgPSBmYWxzZTtcblxuICAvKiogV2hldGhlciB0aGVyZSBpcyBhIHBlbmRpbmcgY2hhbmdlIGRldGVjdGlvbiBjeWNsZS4gKi9cbiAgcHJpdmF0ZSBfaXNDaGFuZ2VEZXRlY3Rpb25QZW5kaW5nID0gZmFsc2U7XG5cbiAgLyoqIEEgbGlzdCBvZiBmdW5jdGlvbnMgdG8gcnVuIGFmdGVyIHRoZSBuZXh0IGNoYW5nZSBkZXRlY3Rpb24gY3ljbGUuICovXG4gIHByaXZhdGUgX3J1bkFmdGVyQ2hhbmdlRGV0ZWN0aW9uOiBGdW5jdGlvbltdID0gW107XG5cbiAgLyoqIFN1YnNjcmlwdGlvbiB0byBjaGFuZ2VzIGluIHRoZSB2aWV3cG9ydCBzaXplLiAqL1xuICBwcml2YXRlIF92aWV3cG9ydENoYW5nZXMgPSBTdWJzY3JpcHRpb24uRU1QVFk7XG5cbiAgY29uc3RydWN0b3IocHVibGljIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgICAgICAgICAgICBwcml2YXRlIF9jaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgICAgICAgICAgIG5nWm9uZTogTmdab25lLFxuICAgICAgICAgICAgICBAT3B0aW9uYWwoKSBASW5qZWN0KFZJUlRVQUxfU0NST0xMX1NUUkFURUdZKVxuICAgICAgICAgICAgICAgICAgcHJpdmF0ZSBfc2Nyb2xsU3RyYXRlZ3k6IFZpcnR1YWxTY3JvbGxTdHJhdGVneSxcbiAgICAgICAgICAgICAgQE9wdGlvbmFsKCkgZGlyOiBEaXJlY3Rpb25hbGl0eSxcbiAgICAgICAgICAgICAgc2Nyb2xsRGlzcGF0Y2hlcjogU2Nyb2xsRGlzcGF0Y2hlcixcbiAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAqIEBkZXByZWNhdGVkIGB2aWV3cG9ydFJ1bGVyYCBwYXJhbWV0ZXIgdG8gYmVjb21lIHJlcXVpcmVkLlxuICAgICAgICAgICAgICAgKiBAYnJlYWtpbmctY2hhbmdlIDExLjAuMFxuICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgQE9wdGlvbmFsKCkgdmlld3BvcnRSdWxlcj86IFZpZXdwb3J0UnVsZXIpIHtcbiAgICBzdXBlcihlbGVtZW50UmVmLCBzY3JvbGxEaXNwYXRjaGVyLCBuZ1pvbmUsIGRpcik7XG5cbiAgICBpZiAoIV9zY3JvbGxTdHJhdGVneSkge1xuICAgICAgdGhyb3cgRXJyb3IoJ0Vycm9yOiBjZGstdmlydHVhbC1zY3JvbGwtdmlld3BvcnQgcmVxdWlyZXMgdGhlIFwiaXRlbVNpemVcIiBwcm9wZXJ0eSB0byBiZSBzZXQuJyk7XG4gICAgfVxuXG4gICAgLy8gQGJyZWFraW5nLWNoYW5nZSAxMS4wLjAgUmVtb3ZlIG51bGwgY2hlY2sgZm9yIGB2aWV3cG9ydFJ1bGVyYC5cbiAgICBpZiAodmlld3BvcnRSdWxlcikge1xuICAgICAgdGhpcy5fdmlld3BvcnRDaGFuZ2VzID0gdmlld3BvcnRSdWxlci5jaGFuZ2UoKS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICB0aGlzLmNoZWNrVmlld3BvcnRTaXplKCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBuZ09uSW5pdCgpIHtcbiAgICBzdXBlci5uZ09uSW5pdCgpO1xuXG4gICAgLy8gSXQncyBzdGlsbCB0b28gZWFybHkgdG8gbWVhc3VyZSB0aGUgdmlld3BvcnQgYXQgdGhpcyBwb2ludC4gRGVmZXJyaW5nIHdpdGggYSBwcm9taXNlIGFsbG93c1xuICAgIC8vIHRoZSBWaWV3cG9ydCB0byBiZSByZW5kZXJlZCB3aXRoIHRoZSBjb3JyZWN0IHNpemUgYmVmb3JlIHdlIG1lYXN1cmUuIFdlIHJ1biB0aGlzIG91dHNpZGUgdGhlXG4gICAgLy8gem9uZSB0byBhdm9pZCBjYXVzaW5nIG1vcmUgY2hhbmdlIGRldGVjdGlvbiBjeWNsZXMuIFdlIGhhbmRsZSB0aGUgY2hhbmdlIGRldGVjdGlvbiBsb29wXG4gICAgLy8gb3Vyc2VsdmVzIGluc3RlYWQuXG4gICAgdGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLl9tZWFzdXJlVmlld3BvcnRTaXplKCk7XG4gICAgICB0aGlzLl9zY3JvbGxTdHJhdGVneS5hdHRhY2godGhpcyk7XG5cbiAgICAgIHRoaXMuZWxlbWVudFNjcm9sbGVkKClcbiAgICAgICAgICAucGlwZShcbiAgICAgICAgICAgICAgLy8gU3RhcnQgb2ZmIHdpdGggYSBmYWtlIHNjcm9sbCBldmVudCBzbyB3ZSBwcm9wZXJseSBkZXRlY3Qgb3VyIGluaXRpYWwgcG9zaXRpb24uXG4gICAgICAgICAgICAgIHN0YXJ0V2l0aChudWxsISksXG4gICAgICAgICAgICAgIC8vIENvbGxlY3QgbXVsdGlwbGUgZXZlbnRzIGludG8gb25lIHVudGlsIHRoZSBuZXh0IGFuaW1hdGlvbiBmcmFtZS4gVGhpcyB3YXkgaWZcbiAgICAgICAgICAgICAgLy8gdGhlcmUgYXJlIG11bHRpcGxlIHNjcm9sbCBldmVudHMgaW4gdGhlIHNhbWUgZnJhbWUgd2Ugb25seSBuZWVkIHRvIHJlY2hlY2tcbiAgICAgICAgICAgICAgLy8gb3VyIGxheW91dCBvbmNlLlxuICAgICAgICAgICAgICBhdWRpdFRpbWUoMCwgU0NST0xMX1NDSEVEVUxFUikpXG4gICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9zY3JvbGxTdHJhdGVneS5vbkNvbnRlbnRTY3JvbGxlZCgpKTtcblxuICAgICAgdGhpcy5fbWFya0NoYW5nZURldGVjdGlvbk5lZWRlZCgpO1xuICAgIH0pKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuZGV0YWNoKCk7XG4gICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kuZGV0YWNoKCk7XG5cbiAgICAvLyBDb21wbGV0ZSBhbGwgc3ViamVjdHNcbiAgICB0aGlzLl9yZW5kZXJlZFJhbmdlU3ViamVjdC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX2RldGFjaGVkU3ViamVjdC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX3ZpZXdwb3J0Q2hhbmdlcy51bnN1YnNjcmliZSgpO1xuXG4gICAgc3VwZXIubmdPbkRlc3Ryb3koKTtcbiAgfVxuXG4gIC8qKiBBdHRhY2hlcyBhIGBDZGtWaXJ0dWFsRm9yT2ZgIHRvIHRoaXMgdmlld3BvcnQuICovXG4gIGF0dGFjaChmb3JPZjogQ2RrVmlydHVhbEZvck9mPGFueT4pIHtcbiAgICBpZiAodGhpcy5fZm9yT2YpIHtcbiAgICAgIHRocm93IEVycm9yKCdDZGtWaXJ0dWFsU2Nyb2xsVmlld3BvcnQgaXMgYWxyZWFkeSBhdHRhY2hlZC4nKTtcbiAgICB9XG5cbiAgICAvLyBTdWJzY3JpYmUgdG8gdGhlIGRhdGEgc3RyZWFtIG9mIHRoZSBDZGtWaXJ0dWFsRm9yT2YgdG8ga2VlcCB0cmFjayBvZiB3aGVuIHRoZSBkYXRhIGxlbmd0aFxuICAgIC8vIGNoYW5nZXMuIFJ1biBvdXRzaWRlIHRoZSB6b25lIHRvIGF2b2lkIHRyaWdnZXJpbmcgY2hhbmdlIGRldGVjdGlvbiwgc2luY2Ugd2UncmUgbWFuYWdpbmcgdGhlXG4gICAgLy8gY2hhbmdlIGRldGVjdGlvbiBsb29wIG91cnNlbHZlcy5cbiAgICB0aGlzLm5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICB0aGlzLl9mb3JPZiA9IGZvck9mO1xuICAgICAgdGhpcy5fZm9yT2YuZGF0YVN0cmVhbS5waXBlKHRha2VVbnRpbCh0aGlzLl9kZXRhY2hlZFN1YmplY3QpKS5zdWJzY3JpYmUoZGF0YSA9PiB7XG4gICAgICAgIGNvbnN0IG5ld0xlbmd0aCA9IGRhdGEubGVuZ3RoO1xuICAgICAgICBpZiAobmV3TGVuZ3RoICE9PSB0aGlzLl9kYXRhTGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy5fZGF0YUxlbmd0aCA9IG5ld0xlbmd0aDtcbiAgICAgICAgICB0aGlzLl9zY3JvbGxTdHJhdGVneS5vbkRhdGFMZW5ndGhDaGFuZ2VkKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fZG9DaGFuZ2VEZXRlY3Rpb24oKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIERldGFjaGVzIHRoZSBjdXJyZW50IGBDZGtWaXJ0dWFsRm9yT2ZgLiAqL1xuICBkZXRhY2goKSB7XG4gICAgdGhpcy5fZm9yT2YgPSBudWxsO1xuICAgIHRoaXMuX2RldGFjaGVkU3ViamVjdC5uZXh0KCk7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgbGVuZ3RoIG9mIHRoZSBkYXRhIGJvdW5kIHRvIHRoaXMgdmlld3BvcnQgKGluIG51bWJlciBvZiBpdGVtcykuICovXG4gIGdldERhdGFMZW5ndGgoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fZGF0YUxlbmd0aDtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBzaXplIG9mIHRoZSB2aWV3cG9ydCAoaW4gcGl4ZWxzKS4gKi9cbiAgZ2V0Vmlld3BvcnRTaXplKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZpZXdwb3J0U2l6ZTtcbiAgfVxuXG4gIC8vIFRPRE8obW1hbGVyYmEpOiBUaGlzIGlzIHRlY2huaWNhbGx5IG91dCBvZiBzeW5jIHdpdGggd2hhdCdzIHJlYWxseSByZW5kZXJlZCB1bnRpbCBhIHJlbmRlclxuICAvLyBjeWNsZSBoYXBwZW5zLiBJJ20gYmVpbmcgY2FyZWZ1bCB0byBvbmx5IGNhbGwgaXQgYWZ0ZXIgdGhlIHJlbmRlciBjeWNsZSBpcyBjb21wbGV0ZSBhbmQgYmVmb3JlXG4gIC8vIHNldHRpbmcgaXQgdG8gc29tZXRoaW5nIGVsc2UsIGJ1dCBpdHMgZXJyb3IgcHJvbmUgYW5kIHNob3VsZCBwcm9iYWJseSBiZSBzcGxpdCBpbnRvXG4gIC8vIGBwZW5kaW5nUmFuZ2VgIGFuZCBgcmVuZGVyZWRSYW5nZWAsIHRoZSBsYXR0ZXIgcmVmbGVjdGluZyB3aGF0cyBhY3R1YWxseSBpbiB0aGUgRE9NLlxuXG4gIC8qKiBHZXQgdGhlIGN1cnJlbnQgcmVuZGVyZWQgcmFuZ2Ugb2YgaXRlbXMuICovXG4gIGdldFJlbmRlcmVkUmFuZ2UoKTogTGlzdFJhbmdlIHtcbiAgICByZXR1cm4gdGhpcy5fcmVuZGVyZWRSYW5nZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB0b3RhbCBzaXplIG9mIGFsbCBjb250ZW50IChpbiBwaXhlbHMpLCBpbmNsdWRpbmcgY29udGVudCB0aGF0IGlzIG5vdCBjdXJyZW50bHlcbiAgICogcmVuZGVyZWQuXG4gICAqL1xuICBzZXRUb3RhbENvbnRlbnRTaXplKHNpemU6IG51bWJlcikge1xuICAgIGlmICh0aGlzLl90b3RhbENvbnRlbnRTaXplICE9PSBzaXplKSB7XG4gICAgICB0aGlzLl90b3RhbENvbnRlbnRTaXplID0gc2l6ZTtcbiAgICAgIHRoaXMuX2NhbGN1bGF0ZVNwYWNlclNpemUoKTtcbiAgICAgIHRoaXMuX21hcmtDaGFuZ2VEZXRlY3Rpb25OZWVkZWQoKTtcbiAgICB9XG4gIH1cblxuICAvKiogU2V0cyB0aGUgY3VycmVudGx5IHJlbmRlcmVkIHJhbmdlIG9mIGluZGljZXMuICovXG4gIHNldFJlbmRlcmVkUmFuZ2UocmFuZ2U6IExpc3RSYW5nZSkge1xuICAgIGlmICghcmFuZ2VzRXF1YWwodGhpcy5fcmVuZGVyZWRSYW5nZSwgcmFuZ2UpKSB7XG4gICAgICB0aGlzLl9yZW5kZXJlZFJhbmdlU3ViamVjdC5uZXh0KHRoaXMuX3JlbmRlcmVkUmFuZ2UgPSByYW5nZSk7XG4gICAgICB0aGlzLl9tYXJrQ2hhbmdlRGV0ZWN0aW9uTmVlZGVkKCgpID0+IHRoaXMuX3Njcm9sbFN0cmF0ZWd5Lm9uQ29udGVudFJlbmRlcmVkKCkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBvZmZzZXQgZnJvbSB0aGUgc3RhcnQgb2YgdGhlIHZpZXdwb3J0IHRvIHRoZSBzdGFydCBvZiB0aGUgcmVuZGVyZWQgZGF0YSAoaW4gcGl4ZWxzKS5cbiAgICovXG4gIGdldE9mZnNldFRvUmVuZGVyZWRDb250ZW50U3RhcnQoKTogbnVtYmVyIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX3JlbmRlcmVkQ29udGVudE9mZnNldE5lZWRzUmV3cml0ZSA/IG51bGwgOiB0aGlzLl9yZW5kZXJlZENvbnRlbnRPZmZzZXQ7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgb2Zmc2V0IGZyb20gdGhlIHN0YXJ0IG9mIHRoZSB2aWV3cG9ydCB0byBlaXRoZXIgdGhlIHN0YXJ0IG9yIGVuZCBvZiB0aGUgcmVuZGVyZWQgZGF0YVxuICAgKiAoaW4gcGl4ZWxzKS5cbiAgICovXG4gIHNldFJlbmRlcmVkQ29udGVudE9mZnNldChvZmZzZXQ6IG51bWJlciwgdG86ICd0by1zdGFydCcgfCAndG8tZW5kJyA9ICd0by1zdGFydCcpIHtcbiAgICAvLyBGb3IgYSBob3Jpem9udGFsIHZpZXdwb3J0IGluIGEgcmlnaHQtdG8tbGVmdCBsYW5ndWFnZSB3ZSBuZWVkIHRvIHRyYW5zbGF0ZSBhbG9uZyB0aGUgeC1heGlzXG4gICAgLy8gaW4gdGhlIG5lZ2F0aXZlIGRpcmVjdGlvbi5cbiAgICBjb25zdCBpc1J0bCA9IHRoaXMuZGlyICYmIHRoaXMuZGlyLnZhbHVlID09ICdydGwnO1xuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IHRoaXMub3JpZW50YXRpb24gPT0gJ2hvcml6b250YWwnO1xuICAgIGNvbnN0IGF4aXMgPSBpc0hvcml6b250YWwgPyAnWCcgOiAnWSc7XG4gICAgY29uc3QgYXhpc0RpcmVjdGlvbiA9IGlzSG9yaXpvbnRhbCAmJiBpc1J0bCA/IC0xIDogMTtcbiAgICBsZXQgdHJhbnNmb3JtID0gYHRyYW5zbGF0ZSR7YXhpc30oJHtOdW1iZXIoYXhpc0RpcmVjdGlvbiAqIG9mZnNldCl9cHgpYDtcbiAgICB0aGlzLl9yZW5kZXJlZENvbnRlbnRPZmZzZXQgPSBvZmZzZXQ7XG4gICAgaWYgKHRvID09PSAndG8tZW5kJykge1xuICAgICAgdHJhbnNmb3JtICs9IGAgdHJhbnNsYXRlJHtheGlzfSgtMTAwJSlgO1xuICAgICAgLy8gVGhlIHZpZXdwb3J0IHNob3VsZCByZXdyaXRlIHRoaXMgYXMgYSBgdG8tc3RhcnRgIG9mZnNldCBvbiB0aGUgbmV4dCByZW5kZXIgY3ljbGUuIE90aGVyd2lzZVxuICAgICAgLy8gZWxlbWVudHMgd2lsbCBhcHBlYXIgdG8gZXhwYW5kIGluIHRoZSB3cm9uZyBkaXJlY3Rpb24gKGUuZy4gYG1hdC1leHBhbnNpb24tcGFuZWxgIHdvdWxkXG4gICAgICAvLyBleHBhbmQgdXB3YXJkKS5cbiAgICAgIHRoaXMuX3JlbmRlcmVkQ29udGVudE9mZnNldE5lZWRzUmV3cml0ZSA9IHRydWU7XG4gICAgfVxuICAgIGlmICh0aGlzLl9yZW5kZXJlZENvbnRlbnRUcmFuc2Zvcm0gIT0gdHJhbnNmb3JtKSB7XG4gICAgICAvLyBXZSBrbm93IHRoaXMgdmFsdWUgaXMgc2FmZSBiZWNhdXNlIHdlIHBhcnNlIGBvZmZzZXRgIHdpdGggYE51bWJlcigpYCBiZWZvcmUgcGFzc2luZyBpdFxuICAgICAgLy8gaW50byB0aGUgc3RyaW5nLlxuICAgICAgdGhpcy5fcmVuZGVyZWRDb250ZW50VHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuICAgICAgdGhpcy5fbWFya0NoYW5nZURldGVjdGlvbk5lZWRlZCgoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLl9yZW5kZXJlZENvbnRlbnRPZmZzZXROZWVkc1Jld3JpdGUpIHtcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlZENvbnRlbnRPZmZzZXQgLT0gdGhpcy5tZWFzdXJlUmVuZGVyZWRDb250ZW50U2l6ZSgpO1xuICAgICAgICAgIHRoaXMuX3JlbmRlcmVkQ29udGVudE9mZnNldE5lZWRzUmV3cml0ZSA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMuc2V0UmVuZGVyZWRDb250ZW50T2Zmc2V0KHRoaXMuX3JlbmRlcmVkQ29udGVudE9mZnNldCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kub25SZW5kZXJlZE9mZnNldENoYW5nZWQoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNjcm9sbHMgdG8gdGhlIGdpdmVuIG9mZnNldCBmcm9tIHRoZSBzdGFydCBvZiB0aGUgdmlld3BvcnQuIFBsZWFzZSBub3RlIHRoYXQgdGhpcyBpcyBub3QgYWx3YXlzXG4gICAqIHRoZSBzYW1lIGFzIHNldHRpbmcgYHNjcm9sbFRvcGAgb3IgYHNjcm9sbExlZnRgLiBJbiBhIGhvcml6b250YWwgdmlld3BvcnQgd2l0aCByaWdodC10by1sZWZ0XG4gICAqIGRpcmVjdGlvbiwgdGhpcyB3b3VsZCBiZSB0aGUgZXF1aXZhbGVudCBvZiBzZXR0aW5nIGEgZmljdGlvbmFsIGBzY3JvbGxSaWdodGAgcHJvcGVydHkuXG4gICAqIEBwYXJhbSBvZmZzZXQgVGhlIG9mZnNldCB0byBzY3JvbGwgdG8uXG4gICAqIEBwYXJhbSBiZWhhdmlvciBUaGUgU2Nyb2xsQmVoYXZpb3IgdG8gdXNlIHdoZW4gc2Nyb2xsaW5nLiBEZWZhdWx0IGlzIGJlaGF2aW9yIGlzIGBhdXRvYC5cbiAgICovXG4gIHNjcm9sbFRvT2Zmc2V0KG9mZnNldDogbnVtYmVyLCBiZWhhdmlvcjogU2Nyb2xsQmVoYXZpb3IgPSAnYXV0bycpIHtcbiAgICBjb25zdCBvcHRpb25zOiBFeHRlbmRlZFNjcm9sbFRvT3B0aW9ucyA9IHtiZWhhdmlvcn07XG4gICAgaWYgKHRoaXMub3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJykge1xuICAgICAgb3B0aW9ucy5zdGFydCA9IG9mZnNldDtcbiAgICB9IGVsc2Uge1xuICAgICAgb3B0aW9ucy50b3AgPSBvZmZzZXQ7XG4gICAgfVxuICAgIHRoaXMuc2Nyb2xsVG8ob3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogU2Nyb2xscyB0byB0aGUgb2Zmc2V0IGZvciB0aGUgZ2l2ZW4gaW5kZXguXG4gICAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgdG8gc2Nyb2xsIHRvLlxuICAgKiBAcGFyYW0gYmVoYXZpb3IgVGhlIFNjcm9sbEJlaGF2aW9yIHRvIHVzZSB3aGVuIHNjcm9sbGluZy4gRGVmYXVsdCBpcyBiZWhhdmlvciBpcyBgYXV0b2AuXG4gICAqL1xuICBzY3JvbGxUb0luZGV4KGluZGV4OiBudW1iZXIsICBiZWhhdmlvcjogU2Nyb2xsQmVoYXZpb3IgPSAnYXV0bycpIHtcbiAgICB0aGlzLl9zY3JvbGxTdHJhdGVneS5zY3JvbGxUb0luZGV4KGluZGV4LCBiZWhhdmlvcik7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCBzY3JvbGwgb2Zmc2V0IGZyb20gdGhlIHN0YXJ0IG9mIHRoZSB2aWV3cG9ydCAoaW4gcGl4ZWxzKS5cbiAgICogQHBhcmFtIGZyb20gVGhlIGVkZ2UgdG8gbWVhc3VyZSB0aGUgb2Zmc2V0IGZyb20uIERlZmF1bHRzIHRvICd0b3AnIGluIHZlcnRpY2FsIG1vZGUgYW5kICdzdGFydCdcbiAgICogICAgIGluIGhvcml6b250YWwgbW9kZS5cbiAgICovXG4gIG1lYXN1cmVTY3JvbGxPZmZzZXQoZnJvbT86ICd0b3AnIHwgJ2xlZnQnIHwgJ3JpZ2h0JyB8ICdib3R0b20nIHwgJ3N0YXJ0JyB8ICdlbmQnKTogbnVtYmVyIHtcbiAgICByZXR1cm4gZnJvbSA/XG4gICAgICBzdXBlci5tZWFzdXJlU2Nyb2xsT2Zmc2V0KGZyb20pIDpcbiAgICAgIHN1cGVyLm1lYXN1cmVTY3JvbGxPZmZzZXQodGhpcy5vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnID8gJ3N0YXJ0JyA6ICd0b3AnKTtcbiAgfVxuXG4gIC8qKiBNZWFzdXJlIHRoZSBjb21iaW5lZCBzaXplIG9mIGFsbCBvZiB0aGUgcmVuZGVyZWQgaXRlbXMuICovXG4gIG1lYXN1cmVSZW5kZXJlZENvbnRlbnRTaXplKCk6IG51bWJlciB7XG4gICAgY29uc3QgY29udGVudEVsID0gdGhpcy5fY29udGVudFdyYXBwZXIubmF0aXZlRWxlbWVudDtcbiAgICByZXR1cm4gdGhpcy5vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnID8gY29udGVudEVsLm9mZnNldFdpZHRoIDogY29udGVudEVsLm9mZnNldEhlaWdodDtcbiAgfVxuXG4gIC8qKlxuICAgKiBNZWFzdXJlIHRoZSB0b3RhbCBjb21iaW5lZCBzaXplIG9mIHRoZSBnaXZlbiByYW5nZS4gVGhyb3dzIGlmIHRoZSByYW5nZSBpbmNsdWRlcyBpdGVtcyB0aGF0IGFyZVxuICAgKiBub3QgcmVuZGVyZWQuXG4gICAqL1xuICBtZWFzdXJlUmFuZ2VTaXplKHJhbmdlOiBMaXN0UmFuZ2UpOiBudW1iZXIge1xuICAgIGlmICghdGhpcy5fZm9yT2YpIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fZm9yT2YubWVhc3VyZVJhbmdlU2l6ZShyYW5nZSwgdGhpcy5vcmllbnRhdGlvbik7XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSB2aWV3cG9ydCBkaW1lbnNpb25zIGFuZCByZS1yZW5kZXIuICovXG4gIGNoZWNrVmlld3BvcnRTaXplKCkge1xuICAgIC8vIFRPRE86IENsZWFudXAgbGF0ZXIgd2hlbiBhZGQgbG9naWMgZm9yIGhhbmRsaW5nIGNvbnRlbnQgcmVzaXplXG4gICAgdGhpcy5fbWVhc3VyZVZpZXdwb3J0U2l6ZSgpO1xuICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5Lm9uRGF0YUxlbmd0aENoYW5nZWQoKTtcbiAgfVxuXG4gIC8qKiBNZWFzdXJlIHRoZSB2aWV3cG9ydCBzaXplLiAqL1xuICBwcml2YXRlIF9tZWFzdXJlVmlld3BvcnRTaXplKCkge1xuICAgIGNvbnN0IHZpZXdwb3J0RWwgPSB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcbiAgICB0aGlzLl92aWV3cG9ydFNpemUgPSB0aGlzLm9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcgP1xuICAgICAgICB2aWV3cG9ydEVsLmNsaWVudFdpZHRoIDogdmlld3BvcnRFbC5jbGllbnRIZWlnaHQ7XG4gIH1cblxuICAvKiogUXVldWUgdXAgY2hhbmdlIGRldGVjdGlvbiB0byBydW4uICovXG4gIHByaXZhdGUgX21hcmtDaGFuZ2VEZXRlY3Rpb25OZWVkZWQocnVuQWZ0ZXI/OiBGdW5jdGlvbikge1xuICAgIGlmIChydW5BZnRlcikge1xuICAgICAgdGhpcy5fcnVuQWZ0ZXJDaGFuZ2VEZXRlY3Rpb24ucHVzaChydW5BZnRlcik7XG4gICAgfVxuXG4gICAgLy8gVXNlIGEgUHJvbWlzZSB0byBiYXRjaCB0b2dldGhlciBjYWxscyB0byBgX2RvQ2hhbmdlRGV0ZWN0aW9uYC4gVGhpcyB3YXkgaWYgd2Ugc2V0IGEgYnVuY2ggb2ZcbiAgICAvLyBwcm9wZXJ0aWVzIHNlcXVlbnRpYWxseSB3ZSBvbmx5IGhhdmUgdG8gcnVuIGBfZG9DaGFuZ2VEZXRlY3Rpb25gIG9uY2UgYXQgdGhlIGVuZC5cbiAgICBpZiAoIXRoaXMuX2lzQ2hhbmdlRGV0ZWN0aW9uUGVuZGluZykge1xuICAgICAgdGhpcy5faXNDaGFuZ2VEZXRlY3Rpb25QZW5kaW5nID0gdHJ1ZTtcbiAgICAgIHRoaXMubmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLl9kb0NoYW5nZURldGVjdGlvbigpO1xuICAgICAgfSkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSdW4gY2hhbmdlIGRldGVjdGlvbi4gKi9cbiAgcHJpdmF0ZSBfZG9DaGFuZ2VEZXRlY3Rpb24oKSB7XG4gICAgdGhpcy5faXNDaGFuZ2VEZXRlY3Rpb25QZW5kaW5nID0gZmFsc2U7XG5cbiAgICAvLyBBcHBseSB0aGUgY29udGVudCB0cmFuc2Zvcm0uIFRoZSB0cmFuc2Zvcm0gY2FuJ3QgYmUgc2V0IHZpYSBhbiBBbmd1bGFyIGJpbmRpbmcgYmVjYXVzZVxuICAgIC8vIGJ5cGFzc1NlY3VyaXR5VHJ1c3RTdHlsZSBpcyBiYW5uZWQgaW4gR29vZ2xlLiBIb3dldmVyIHRoZSB2YWx1ZSBpcyBzYWZlLCBpdCdzIGNvbXBvc2VkIG9mXG4gICAgLy8gc3RyaW5nIGxpdGVyYWxzLCBhIHZhcmlhYmxlIHRoYXQgY2FuIG9ubHkgYmUgJ1gnIG9yICdZJywgYW5kIHVzZXIgaW5wdXQgdGhhdCBpcyBydW4gdGhyb3VnaFxuICAgIC8vIHRoZSBgTnVtYmVyYCBmdW5jdGlvbiBmaXJzdCB0byBjb2VyY2UgaXQgdG8gYSBudW1lcmljIHZhbHVlLlxuICAgIHRoaXMuX2NvbnRlbnRXcmFwcGVyLm5hdGl2ZUVsZW1lbnQuc3R5bGUudHJhbnNmb3JtID0gdGhpcy5fcmVuZGVyZWRDb250ZW50VHJhbnNmb3JtO1xuICAgIC8vIEFwcGx5IGNoYW5nZXMgdG8gQW5ndWxhciBiaW5kaW5ncy4gTm90ZTogV2UgbXVzdCBjYWxsIGBtYXJrRm9yQ2hlY2tgIHRvIHJ1biBjaGFuZ2UgZGV0ZWN0aW9uXG4gICAgLy8gZnJvbSB0aGUgcm9vdCwgc2luY2UgdGhlIHJlcGVhdGVkIGl0ZW1zIGFyZSBjb250ZW50IHByb2plY3RlZCBpbi4gQ2FsbGluZyBgZGV0ZWN0Q2hhbmdlc2BcbiAgICAvLyBpbnN0ZWFkIGRvZXMgbm90IHByb3Blcmx5IGNoZWNrIHRoZSBwcm9qZWN0ZWQgY29udGVudC5cbiAgICB0aGlzLm5nWm9uZS5ydW4oKCkgPT4gdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCkpO1xuXG4gICAgY29uc3QgcnVuQWZ0ZXJDaGFuZ2VEZXRlY3Rpb24gPSB0aGlzLl9ydW5BZnRlckNoYW5nZURldGVjdGlvbjtcbiAgICB0aGlzLl9ydW5BZnRlckNoYW5nZURldGVjdGlvbiA9IFtdO1xuICAgIGZvciAoY29uc3QgZm4gb2YgcnVuQWZ0ZXJDaGFuZ2VEZXRlY3Rpb24pIHtcbiAgICAgIGZuKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENhbGN1bGF0ZXMgdGhlIGBzdHlsZS53aWR0aGAgYW5kIGBzdHlsZS5oZWlnaHRgIGZvciB0aGUgc3BhY2VyIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX2NhbGN1bGF0ZVNwYWNlclNpemUoKSB7XG4gICAgdGhpcy5fdG90YWxDb250ZW50SGVpZ2h0ID1cbiAgICAgICAgdGhpcy5vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnID8gJycgOiBgJHt0aGlzLl90b3RhbENvbnRlbnRTaXplfXB4YDtcbiAgICB0aGlzLl90b3RhbENvbnRlbnRXaWR0aCA9XG4gICAgICAgIHRoaXMub3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJyA/IGAke3RoaXMuX3RvdGFsQ29udGVudFNpemV9cHhgIDogJyc7XG4gIH1cbn1cbiJdfQ==