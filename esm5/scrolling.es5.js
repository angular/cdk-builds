/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken, Directive, forwardRef, Input, Injectable, NgZone, Optional, SkipSelf, ElementRef, NgModule, IterableDiffers, TemplateRef, ViewContainerRef, ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Output, ViewChild, ViewEncapsulation, defineInjectable, inject } from '@angular/core';
import { __assign } from 'tslib';
import { coerceNumberProperty } from '@angular/cdk/coercion';
import { Subject, fromEvent, of, Observable, animationFrameScheduler, merge } from 'rxjs';
import { distinctUntilChanged, auditTime, filter, sample, sampleTime, takeUntil, pairwise, shareReplay, startWith, switchMap } from 'rxjs/operators';
import { Platform, PlatformModule, supportsScrollBehavior } from '@angular/cdk/platform';
import { ArrayDataSource, DataSource } from '@angular/cdk/collections';

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * The injection token used to specify the virtual scrolling strategy.
 */
var /** @type {?} */ VIRTUAL_SCROLL_STRATEGY = new InjectionToken('VIRTUAL_SCROLL_STRATEGY');

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Virtual scrolling strategy for lists with items of known fixed size.
 */
var  /**
 * Virtual scrolling strategy for lists with items of known fixed size.
 */
FixedSizeVirtualScrollStrategy = /** @class */ (function () {
    /**
     * @param itemSize The size of the items in the virtually scrolling list.
     * @param bufferSize The number of buffer items to render beyond the edge of the viewport.
     */
    function FixedSizeVirtualScrollStrategy(itemSize, bufferSize) {
        this._scrolledIndexChange = new Subject();
        /**
         * \@docs-private Implemented as part of VirtualScrollStrategy.
         */
        this.scrolledIndexChange = this._scrolledIndexChange.pipe(distinctUntilChanged());
        /**
         * The attached viewport.
         */
        this._viewport = null;
        this._itemSize = itemSize;
        this._bufferSize = bufferSize;
    }
    /**
     * Attaches this scroll strategy to a viewport.
     * @param viewport The viewport to attach this strategy to.
     */
    /**
     * Attaches this scroll strategy to a viewport.
     * @param {?} viewport The viewport to attach this strategy to.
     * @return {?}
     */
    FixedSizeVirtualScrollStrategy.prototype.attach = /**
     * Attaches this scroll strategy to a viewport.
     * @param {?} viewport The viewport to attach this strategy to.
     * @return {?}
     */
    function (viewport) {
        this._viewport = viewport;
        this._updateTotalContentSize();
        this._updateRenderedRange();
    };
    /** Detaches this scroll strategy from the currently attached viewport. */
    /**
     * Detaches this scroll strategy from the currently attached viewport.
     * @return {?}
     */
    FixedSizeVirtualScrollStrategy.prototype.detach = /**
     * Detaches this scroll strategy from the currently attached viewport.
     * @return {?}
     */
    function () {
        this._scrolledIndexChange.complete();
        this._viewport = null;
    };
    /**
     * Update the item size and buffer size.
     * @param itemSize The size of the items in the virtually scrolling list.
     * @param bufferSize he number of buffer items to render beyond the edge of the viewport.
     */
    /**
     * Update the item size and buffer size.
     * @param {?} itemSize The size of the items in the virtually scrolling list.
     * @param {?} bufferSize he number of buffer items to render beyond the edge of the viewport.
     * @return {?}
     */
    FixedSizeVirtualScrollStrategy.prototype.updateItemAndBufferSize = /**
     * Update the item size and buffer size.
     * @param {?} itemSize The size of the items in the virtually scrolling list.
     * @param {?} bufferSize he number of buffer items to render beyond the edge of the viewport.
     * @return {?}
     */
    function (itemSize, bufferSize) {
        this._itemSize = itemSize;
        this._bufferSize = bufferSize;
        this._updateTotalContentSize();
        this._updateRenderedRange();
    };
    /** @docs-private Implemented as part of VirtualScrollStrategy. */
    /**
     * \@docs-private Implemented as part of VirtualScrollStrategy.
     * @return {?}
     */
    FixedSizeVirtualScrollStrategy.prototype.onContentScrolled = /**
     * \@docs-private Implemented as part of VirtualScrollStrategy.
     * @return {?}
     */
    function () {
        this._updateRenderedRange();
    };
    /** @docs-private Implemented as part of VirtualScrollStrategy. */
    /**
     * \@docs-private Implemented as part of VirtualScrollStrategy.
     * @return {?}
     */
    FixedSizeVirtualScrollStrategy.prototype.onDataLengthChanged = /**
     * \@docs-private Implemented as part of VirtualScrollStrategy.
     * @return {?}
     */
    function () {
        this._updateTotalContentSize();
        this._updateRenderedRange();
    };
    /** @docs-private Implemented as part of VirtualScrollStrategy. */
    /**
     * \@docs-private Implemented as part of VirtualScrollStrategy.
     * @return {?}
     */
    FixedSizeVirtualScrollStrategy.prototype.onContentRendered = /**
     * \@docs-private Implemented as part of VirtualScrollStrategy.
     * @return {?}
     */
    function () {
        /* no-op */ 
    };
    /** @docs-private Implemented as part of VirtualScrollStrategy. */
    /**
     * \@docs-private Implemented as part of VirtualScrollStrategy.
     * @return {?}
     */
    FixedSizeVirtualScrollStrategy.prototype.onRenderedOffsetChanged = /**
     * \@docs-private Implemented as part of VirtualScrollStrategy.
     * @return {?}
     */
    function () {
        /* no-op */ 
    };
    /**
     * Scroll to the offset for the given index.
     * @param index The index of the element to scroll to.
     * @param behavior The ScrollBehavior to use when scrolling.
     */
    /**
     * Scroll to the offset for the given index.
     * @param {?} index The index of the element to scroll to.
     * @param {?} behavior The ScrollBehavior to use when scrolling.
     * @return {?}
     */
    FixedSizeVirtualScrollStrategy.prototype.scrollToIndex = /**
     * Scroll to the offset for the given index.
     * @param {?} index The index of the element to scroll to.
     * @param {?} behavior The ScrollBehavior to use when scrolling.
     * @return {?}
     */
    function (index, behavior) {
        if (this._viewport) {
            this._viewport.scrollToOffset(index * this._itemSize, behavior);
        }
    };
    /**
     * Update the viewport's total content size.
     * @return {?}
     */
    FixedSizeVirtualScrollStrategy.prototype._updateTotalContentSize = /**
     * Update the viewport's total content size.
     * @return {?}
     */
    function () {
        if (!this._viewport) {
            return;
        }
        this._viewport.setTotalContentSize(this._viewport.getDataLength() * this._itemSize);
    };
    /**
     * Update the viewport's rendered range.
     * @return {?}
     */
    FixedSizeVirtualScrollStrategy.prototype._updateRenderedRange = /**
     * Update the viewport's rendered range.
     * @return {?}
     */
    function () {
        if (!this._viewport) {
            return;
        }
        var /** @type {?} */ scrollOffset = this._viewport.measureScrollOffset();
        var /** @type {?} */ firstVisibleIndex = Math.floor(scrollOffset / this._itemSize);
        var /** @type {?} */ firstItemRemainder = scrollOffset % this._itemSize;
        var /** @type {?} */ range = this._expandRange({ start: firstVisibleIndex, end: firstVisibleIndex }, this._bufferSize, Math.ceil((this._viewport.getViewportSize() + firstItemRemainder) / this._itemSize) +
            this._bufferSize);
        this._viewport.setRenderedRange(range);
        this._viewport.setRenderedContentOffset(this._itemSize * range.start);
        this._scrolledIndexChange.next(firstVisibleIndex);
    };
    /**
     * Expand the given range by the given amount in either direction.
     * @param {?} range The range to expand
     * @param {?} expandStart The number of items to expand the start of the range by.
     * @param {?} expandEnd The number of items to expand the end of the range by.
     * @return {?} The expanded range.
     */
    FixedSizeVirtualScrollStrategy.prototype._expandRange = /**
     * Expand the given range by the given amount in either direction.
     * @param {?} range The range to expand
     * @param {?} expandStart The number of items to expand the start of the range by.
     * @param {?} expandEnd The number of items to expand the end of the range by.
     * @return {?} The expanded range.
     */
    function (range, expandStart, expandEnd) {
        if (!this._viewport) {
            return __assign({}, range);
        }
        var /** @type {?} */ start = Math.max(0, range.start - expandStart);
        var /** @type {?} */ end = Math.min(this._viewport.getDataLength(), range.end + expandEnd);
        return { start: start, end: end };
    };
    return FixedSizeVirtualScrollStrategy;
}());
/**
 * Provider factory for `FixedSizeVirtualScrollStrategy` that simply extracts the already created
 * `FixedSizeVirtualScrollStrategy` from the given directive.
 * @param {?} fixedSizeDir The instance of `CdkFixedSizeVirtualScroll` to extract the
 *     `FixedSizeVirtualScrollStrategy` from.
 * @return {?}
 */
function _fixedSizeVirtualScrollStrategyFactory(fixedSizeDir) {
    return fixedSizeDir._scrollStrategy;
}
/**
 * A virtual scroll strategy that supports fixed-size items.
 */
var CdkFixedSizeVirtualScroll = /** @class */ (function () {
    function CdkFixedSizeVirtualScroll() {
        this._itemSize = 20;
        this._bufferSize = 5;
        /**
         * The scroll strategy used by this directive.
         */
        this._scrollStrategy = new FixedSizeVirtualScrollStrategy(this.itemSize, this.bufferSize);
    }
    Object.defineProperty(CdkFixedSizeVirtualScroll.prototype, "itemSize", {
        get: /**
         * The size of the items in the list (in pixels).
         * @return {?}
         */
        function () { return this._itemSize; },
        set: /**
         * @param {?} value
         * @return {?}
         */
        function (value) { this._itemSize = coerceNumberProperty(value); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CdkFixedSizeVirtualScroll.prototype, "bufferSize", {
        get: /**
         * The number of extra elements to render on either side of the scrolling viewport.
         * Defaults to 5 elements.
         * @return {?}
         */
        function () { return this._bufferSize; },
        set: /**
         * @param {?} value
         * @return {?}
         */
        function (value) { this._bufferSize = coerceNumberProperty(value); },
        enumerable: true,
        configurable: true
    });
    /**
     * @return {?}
     */
    CdkFixedSizeVirtualScroll.prototype.ngOnChanges = /**
     * @return {?}
     */
    function () {
        this._scrollStrategy.updateItemAndBufferSize(this.itemSize, this.bufferSize);
    };
    CdkFixedSizeVirtualScroll.decorators = [
        { type: Directive, args: [{
                    selector: 'cdk-virtual-scroll-viewport[itemSize]',
                    providers: [{
                            provide: VIRTUAL_SCROLL_STRATEGY,
                            useFactory: _fixedSizeVirtualScrollStrategyFactory,
                            deps: [forwardRef(function () { return CdkFixedSizeVirtualScroll; })],
                        }],
                },] },
    ];
    /** @nocollapse */
    CdkFixedSizeVirtualScroll.propDecorators = {
        "itemSize": [{ type: Input },],
        "bufferSize": [{ type: Input },],
    };
    return CdkFixedSizeVirtualScroll;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Time in ms to throttle the scrolling events by default.
 */
var /** @type {?} */ DEFAULT_SCROLL_TIME = 20;
/**
 * Service contained all registered Scrollable references and emits an event when any one of the
 * Scrollable references emit a scrolled event.
 */
var ScrollDispatcher = /** @class */ (function () {
    function ScrollDispatcher(_ngZone, _platform) {
        this._ngZone = _ngZone;
        this._platform = _platform;
        /**
         * Subject for notifying that a registered scrollable reference element has been scrolled.
         */
        this._scrolled = new Subject();
        /**
         * Keeps track of the global `scroll` and `resize` subscriptions.
         */
        this._globalSubscription = null;
        /**
         * Keeps track of the amount of subscriptions to `scrolled`. Used for cleaning up afterwards.
         */
        this._scrolledCount = 0;
        /**
         * Map of all the scrollable references that are registered with the service and their
         * scroll event subscriptions.
         */
        this.scrollContainers = new Map();
    }
    /**
     * Registers a scrollable instance with the service and listens for its scrolled events. When the
     * scrollable is scrolled, the service emits the event to its scrolled observable.
     * @param scrollable Scrollable instance to be registered.
     */
    /**
     * Registers a scrollable instance with the service and listens for its scrolled events. When the
     * scrollable is scrolled, the service emits the event to its scrolled observable.
     * @param {?} scrollable Scrollable instance to be registered.
     * @return {?}
     */
    ScrollDispatcher.prototype.register = /**
     * Registers a scrollable instance with the service and listens for its scrolled events. When the
     * scrollable is scrolled, the service emits the event to its scrolled observable.
     * @param {?} scrollable Scrollable instance to be registered.
     * @return {?}
     */
    function (scrollable) {
        var _this = this;
        var /** @type {?} */ scrollSubscription = scrollable.elementScrolled()
            .subscribe(function () { return _this._scrolled.next(scrollable); });
        this.scrollContainers.set(scrollable, scrollSubscription);
    };
    /**
     * Deregisters a Scrollable reference and unsubscribes from its scroll event observable.
     * @param scrollable Scrollable instance to be deregistered.
     */
    /**
     * Deregisters a Scrollable reference and unsubscribes from its scroll event observable.
     * @param {?} scrollable Scrollable instance to be deregistered.
     * @return {?}
     */
    ScrollDispatcher.prototype.deregister = /**
     * Deregisters a Scrollable reference and unsubscribes from its scroll event observable.
     * @param {?} scrollable Scrollable instance to be deregistered.
     * @return {?}
     */
    function (scrollable) {
        var /** @type {?} */ scrollableReference = this.scrollContainers.get(scrollable);
        if (scrollableReference) {
            scrollableReference.unsubscribe();
            this.scrollContainers.delete(scrollable);
        }
    };
    /**
     * Returns an observable that emits an event whenever any of the registered Scrollable
     * references (or window, document, or body) fire a scrolled event. Can provide a time in ms
     * to override the default "throttle" time.
     *
     * **Note:** in order to avoid hitting change detection for every scroll event,
     * all of the events emitted from this stream will be run outside the Angular zone.
     * If you need to update any data bindings as a result of a scroll event, you have
     * to run the callback using `NgZone.run`.
     */
    /**
     * Returns an observable that emits an event whenever any of the registered Scrollable
     * references (or window, document, or body) fire a scrolled event. Can provide a time in ms
     * to override the default "throttle" time.
     *
     * **Note:** in order to avoid hitting change detection for every scroll event,
     * all of the events emitted from this stream will be run outside the Angular zone.
     * If you need to update any data bindings as a result of a scroll event, you have
     * to run the callback using `NgZone.run`.
     * @param {?=} auditTimeInMs
     * @return {?}
     */
    ScrollDispatcher.prototype.scrolled = /**
     * Returns an observable that emits an event whenever any of the registered Scrollable
     * references (or window, document, or body) fire a scrolled event. Can provide a time in ms
     * to override the default "throttle" time.
     *
     * **Note:** in order to avoid hitting change detection for every scroll event,
     * all of the events emitted from this stream will be run outside the Angular zone.
     * If you need to update any data bindings as a result of a scroll event, you have
     * to run the callback using `NgZone.run`.
     * @param {?=} auditTimeInMs
     * @return {?}
     */
    function (auditTimeInMs) {
        var _this = this;
        if (auditTimeInMs === void 0) { auditTimeInMs = DEFAULT_SCROLL_TIME; }
        return this._platform.isBrowser ? Observable.create(function (observer) {
            if (!_this._globalSubscription) {
                _this._addGlobalListener();
            }
            // In the case of a 0ms delay, use an observable without auditTime
            // since it does add a perceptible delay in processing overhead.
            var /** @type {?} */ subscription = auditTimeInMs > 0 ?
                _this._scrolled.pipe(auditTime(auditTimeInMs)).subscribe(observer) :
                _this._scrolled.subscribe(observer);
            _this._scrolledCount++;
            return function () {
                subscription.unsubscribe();
                _this._scrolledCount--;
                if (!_this._scrolledCount) {
                    _this._removeGlobalListener();
                }
            };
        }) : of();
    };
    /**
     * @return {?}
     */
    ScrollDispatcher.prototype.ngOnDestroy = /**
     * @return {?}
     */
    function () {
        var _this = this;
        this._removeGlobalListener();
        this.scrollContainers.forEach(function (_, container) { return _this.deregister(container); });
        this._scrolled.complete();
    };
    /**
     * Returns an observable that emits whenever any of the
     * scrollable ancestors of an element are scrolled.
     * @param elementRef Element whose ancestors to listen for.
     * @param auditTimeInMs Time to throttle the scroll events.
     */
    /**
     * Returns an observable that emits whenever any of the
     * scrollable ancestors of an element are scrolled.
     * @param {?} elementRef Element whose ancestors to listen for.
     * @param {?=} auditTimeInMs Time to throttle the scroll events.
     * @return {?}
     */
    ScrollDispatcher.prototype.ancestorScrolled = /**
     * Returns an observable that emits whenever any of the
     * scrollable ancestors of an element are scrolled.
     * @param {?} elementRef Element whose ancestors to listen for.
     * @param {?=} auditTimeInMs Time to throttle the scroll events.
     * @return {?}
     */
    function (elementRef, auditTimeInMs) {
        var /** @type {?} */ ancestors = this.getAncestorScrollContainers(elementRef);
        return this.scrolled(auditTimeInMs).pipe(filter(function (target) {
            return !target || ancestors.indexOf(target) > -1;
        }));
    };
    /** Returns all registered Scrollables that contain the provided element. */
    /**
     * Returns all registered Scrollables that contain the provided element.
     * @param {?} elementRef
     * @return {?}
     */
    ScrollDispatcher.prototype.getAncestorScrollContainers = /**
     * Returns all registered Scrollables that contain the provided element.
     * @param {?} elementRef
     * @return {?}
     */
    function (elementRef) {
        var _this = this;
        var /** @type {?} */ scrollingContainers = [];
        this.scrollContainers.forEach(function (_subscription, scrollable) {
            if (_this._scrollableContainsElement(scrollable, elementRef)) {
                scrollingContainers.push(scrollable);
            }
        });
        return scrollingContainers;
    };
    /**
     * Returns true if the element is contained within the provided Scrollable.
     * @param {?} scrollable
     * @param {?} elementRef
     * @return {?}
     */
    ScrollDispatcher.prototype._scrollableContainsElement = /**
     * Returns true if the element is contained within the provided Scrollable.
     * @param {?} scrollable
     * @param {?} elementRef
     * @return {?}
     */
    function (scrollable, elementRef) {
        var /** @type {?} */ element = elementRef.nativeElement;
        var /** @type {?} */ scrollableElement = scrollable.getElementRef().nativeElement;
        // Traverse through the element parents until we reach null, checking if any of the elements
        // are the scrollable's element.
        do {
            if (element == scrollableElement) {
                return true;
            }
        } while (element = element.parentElement);
        return false;
    };
    /**
     * Sets up the global scroll listeners.
     * @return {?}
     */
    ScrollDispatcher.prototype._addGlobalListener = /**
     * Sets up the global scroll listeners.
     * @return {?}
     */
    function () {
        var _this = this;
        this._globalSubscription = this._ngZone.runOutsideAngular(function () {
            return fromEvent(window.document, 'scroll').subscribe(function () { return _this._scrolled.next(); });
        });
    };
    /**
     * Cleans up the global scroll listener.
     * @return {?}
     */
    ScrollDispatcher.prototype._removeGlobalListener = /**
     * Cleans up the global scroll listener.
     * @return {?}
     */
    function () {
        if (this._globalSubscription) {
            this._globalSubscription.unsubscribe();
            this._globalSubscription = null;
        }
    };
    ScrollDispatcher.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] },
    ];
    /** @nocollapse */
    ScrollDispatcher.ctorParameters = function () { return [
        { type: NgZone, },
        { type: Platform, },
    ]; };
    /** @nocollapse */ ScrollDispatcher.ngInjectableDef = defineInjectable({ factory: function ScrollDispatcher_Factory() { return new ScrollDispatcher(inject(NgZone), inject(Platform)); }, token: ScrollDispatcher, providedIn: "root" });
    return ScrollDispatcher;
}());
/**
 * \@docs-private \@deprecated \@breaking-change 7.0.0
 * @param {?} parentDispatcher
 * @param {?} ngZone
 * @param {?} platform
 * @return {?}
 */
function SCROLL_DISPATCHER_PROVIDER_FACTORY(parentDispatcher, ngZone, platform) {
    return parentDispatcher || new ScrollDispatcher(ngZone, platform);
}
/**
 * \@docs-private \@deprecated \@breaking-change 7.0.0
 */
var /** @type {?} */ SCROLL_DISPATCHER_PROVIDER = {
    // If there is already a ScrollDispatcher available, use that. Otherwise, provide a new one.
    provide: ScrollDispatcher,
    deps: [[new Optional(), new SkipSelf(), ScrollDispatcher], NgZone, Platform],
    useFactory: SCROLL_DISPATCHER_PROVIDER_FACTORY
};

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Sends an event when the directive's element is scrolled. Registers itself with the
 * ScrollDispatcher service to include itself as part of its collection of scrolling events that it
 * can be listened to through the service.
 */
var CdkScrollable = /** @class */ (function () {
    function CdkScrollable(_elementRef, _scroll, _ngZone) {
        var _this = this;
        this._elementRef = _elementRef;
        this._scroll = _scroll;
        this._ngZone = _ngZone;
        this._elementScrolled = new Subject();
        this._scrollListener = function (event) { return _this._elementScrolled.next(event); };
    }
    /**
     * @return {?}
     */
    CdkScrollable.prototype.ngOnInit = /**
     * @return {?}
     */
    function () {
        var _this = this;
        this._ngZone.runOutsideAngular(function () {
            _this.getElementRef().nativeElement.addEventListener('scroll', _this._scrollListener);
        });
        this._scroll.register(this);
    };
    /**
     * @return {?}
     */
    CdkScrollable.prototype.ngOnDestroy = /**
     * @return {?}
     */
    function () {
        this._scroll.deregister(this);
        if (this._scrollListener) {
            this.getElementRef().nativeElement.removeEventListener('scroll', this._scrollListener);
        }
        this._elementScrolled.complete();
    };
    /**
     * Returns observable that emits when a scroll event is fired on the host element.
     */
    /**
     * Returns observable that emits when a scroll event is fired on the host element.
     * @return {?}
     */
    CdkScrollable.prototype.elementScrolled = /**
     * Returns observable that emits when a scroll event is fired on the host element.
     * @return {?}
     */
    function () {
        return this._elementScrolled.asObservable();
    };
    /**
     * @return {?}
     */
    CdkScrollable.prototype.getElementRef = /**
     * @return {?}
     */
    function () {
        return this._elementRef;
    };
    CdkScrollable.decorators = [
        { type: Directive, args: [{
                    selector: '[cdk-scrollable], [cdkScrollable]'
                },] },
    ];
    /** @nocollapse */
    CdkScrollable.ctorParameters = function () { return [
        { type: ElementRef, },
        { type: ScrollDispatcher, },
        { type: NgZone, },
    ]; };
    return CdkScrollable;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
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
 * A viewport that virtualizes it's scrolling with the help of `CdkVirtualForOf`.
 */
var CdkVirtualScrollViewport = /** @class */ (function () {
    function CdkVirtualScrollViewport(elementRef, _changeDetectorRef, _ngZone, _scrollStrategy) {
        var _this = this;
        this.elementRef = elementRef;
        this._changeDetectorRef = _changeDetectorRef;
        this._ngZone = _ngZone;
        this._scrollStrategy = _scrollStrategy;
        /**
         * Emits when the viewport is detached from a CdkVirtualForOf.
         */
        this._detachedSubject = new Subject();
        /**
         * Emits when the rendered range changes.
         */
        this._renderedRangeSubject = new Subject();
        /**
         * Emits when a change detection cycle completes.
         */
        this._changeDetectionComplete = new Subject();
        /**
         * The direction the viewport scrolls.
         */
        this.orientation = 'vertical';
        /**
         * Emits when the index of the first element visible in the viewport changes.
         */
        this.scrolledIndexChange = Observable.create(function (observer) {
            return _this._scrollStrategy.scrolledIndexChange
                .pipe(sample(_this._changeDetectionComplete))
                .subscribe(observer);
        });
        /**
         * A stream that emits whenever the rendered range changes.
         */
        this.renderedRangeStream = this._renderedRangeSubject.asObservable();
        /**
         * The total size of all content (in pixels), including content that is not currently rendered.
         */
        this._totalContentSize = 0;
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
         * Observable that emits when the viewport is destroyed.
         */
        this._destroyed = new Subject();
        /**
         * Whether there is a pending change detection cycle.
         */
        this._isChangeDetectionPending = false;
        /**
         * A list of functions to run after the next change detection cycle.
         */
        this._runAfterChangeDetection = [];
    }
    /**
     * @return {?}
     */
    CdkVirtualScrollViewport.prototype.ngOnInit = /**
     * @return {?}
     */
    function () {
        var _this = this;
        // It's still too early to measure the viewport at this point. Deferring with a promise allows
        // the Viewport to be rendered with the correct size before we measure. We run this outside the
        // zone to avoid causing more change detection cycles. We handle the change detection loop
        // ourselves instead.
        this._ngZone.runOutsideAngular(function () {
            return Promise.resolve().then(function () {
                _this._measureViewportSize();
                _this._scrollStrategy.attach(_this);
                fromEvent(_this.elementRef.nativeElement, 'scroll')
                    .pipe(sampleTime(0, animationFrameScheduler), takeUntil(_this._destroyed))
                    .subscribe(function () { return _this._scrollStrategy.onContentScrolled(); });
                _this._markChangeDetectionNeeded();
            });
        });
    };
    /**
     * @return {?}
     */
    CdkVirtualScrollViewport.prototype.ngOnDestroy = /**
     * @return {?}
     */
    function () {
        this.detach();
        this._scrollStrategy.detach();
        this._destroyed.next();
        // Complete all subjects
        this._renderedRangeSubject.complete();
        this._detachedSubject.complete();
        this._changeDetectionComplete.complete();
        this._destroyed.complete();
    };
    /** Attaches a `CdkVirtualForOf` to this viewport. */
    /**
     * Attaches a `CdkVirtualForOf` to this viewport.
     * @param {?} forOf
     * @return {?}
     */
    CdkVirtualScrollViewport.prototype.attach = /**
     * Attaches a `CdkVirtualForOf` to this viewport.
     * @param {?} forOf
     * @return {?}
     */
    function (forOf) {
        var _this = this;
        if (this._forOf) {
            throw Error('CdkVirtualScrollViewport is already attached.');
        }
        // Subscribe to the data stream of the CdkVirtualForOf to keep track of when the data length
        // changes. Run outside the zone to avoid triggering change detection, since we're managing the
        // change detection loop ourselves.
        this._ngZone.runOutsideAngular(function () {
            _this._forOf = forOf;
            _this._forOf.dataStream.pipe(takeUntil(_this._detachedSubject)).subscribe(function (data) {
                var /** @type {?} */ newLength = data.length;
                if (newLength !== _this._dataLength) {
                    _this._dataLength = newLength;
                    _this._scrollStrategy.onDataLengthChanged();
                }
            });
        });
    };
    /** Detaches the current `CdkVirtualForOf`. */
    /**
     * Detaches the current `CdkVirtualForOf`.
     * @return {?}
     */
    CdkVirtualScrollViewport.prototype.detach = /**
     * Detaches the current `CdkVirtualForOf`.
     * @return {?}
     */
    function () {
        this._forOf = null;
        this._detachedSubject.next();
    };
    /** Gets the length of the data bound to this viewport (in number of items). */
    /**
     * Gets the length of the data bound to this viewport (in number of items).
     * @return {?}
     */
    CdkVirtualScrollViewport.prototype.getDataLength = /**
     * Gets the length of the data bound to this viewport (in number of items).
     * @return {?}
     */
    function () {
        return this._dataLength;
    };
    /** Gets the size of the viewport (in pixels). */
    /**
     * Gets the size of the viewport (in pixels).
     * @return {?}
     */
    CdkVirtualScrollViewport.prototype.getViewportSize = /**
     * Gets the size of the viewport (in pixels).
     * @return {?}
     */
    function () {
        return this._viewportSize;
    };
    // TODO(mmalerba): This is technically out of sync with what's really rendered until a render
    // cycle happens. I'm being careful to only call it after the render cycle is complete and before
    // setting it to something else, but its error prone and should probably be split into
    // `pendingRange` and `renderedRange`, the latter reflecting whats actually in the DOM.
    /** Get the current rendered range of items. */
    /**
     * Get the current rendered range of items.
     * @return {?}
     */
    CdkVirtualScrollViewport.prototype.getRenderedRange = /**
     * Get the current rendered range of items.
     * @return {?}
     */
    function () {
        return this._renderedRange;
    };
    /**
     * Sets the total size of all content (in pixels), including content that is not currently
     * rendered.
     */
    /**
     * Sets the total size of all content (in pixels), including content that is not currently
     * rendered.
     * @param {?} size
     * @return {?}
     */
    CdkVirtualScrollViewport.prototype.setTotalContentSize = /**
     * Sets the total size of all content (in pixels), including content that is not currently
     * rendered.
     * @param {?} size
     * @return {?}
     */
    function (size) {
        if (this._totalContentSize !== size) {
            this._totalContentSize = size;
            this._markChangeDetectionNeeded();
        }
    };
    /** Sets the currently rendered range of indices. */
    /**
     * Sets the currently rendered range of indices.
     * @param {?} range
     * @return {?}
     */
    CdkVirtualScrollViewport.prototype.setRenderedRange = /**
     * Sets the currently rendered range of indices.
     * @param {?} range
     * @return {?}
     */
    function (range) {
        var _this = this;
        if (!rangesEqual(this._renderedRange, range)) {
            this._renderedRangeSubject.next(this._renderedRange = range);
            this._markChangeDetectionNeeded(function () { return _this._scrollStrategy.onContentRendered(); });
        }
    };
    /**
     * Gets the offset from the start of the viewport to the start of the rendered data (in pixels).
     */
    /**
     * Gets the offset from the start of the viewport to the start of the rendered data (in pixels).
     * @return {?}
     */
    CdkVirtualScrollViewport.prototype.getOffsetToRenderedContentStart = /**
     * Gets the offset from the start of the viewport to the start of the rendered data (in pixels).
     * @return {?}
     */
    function () {
        return this._renderedContentOffsetNeedsRewrite ? null : this._renderedContentOffset;
    };
    /**
     * Sets the offset from the start of the viewport to either the start or end of the rendered data
     * (in pixels).
     */
    /**
     * Sets the offset from the start of the viewport to either the start or end of the rendered data
     * (in pixels).
     * @param {?} offset
     * @param {?=} to
     * @return {?}
     */
    CdkVirtualScrollViewport.prototype.setRenderedContentOffset = /**
     * Sets the offset from the start of the viewport to either the start or end of the rendered data
     * (in pixels).
     * @param {?} offset
     * @param {?=} to
     * @return {?}
     */
    function (offset, to) {
        var _this = this;
        if (to === void 0) { to = 'to-start'; }
        var /** @type {?} */ axis = this.orientation === 'horizontal' ? 'X' : 'Y';
        var /** @type {?} */ transform = "translate" + axis + "(" + Number(offset) + "px)";
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
     * Scrolls to the offset on the viewport.
     * @param offset The offset to scroll to.
     * @param behavior The ScrollBehavior to use when scrolling. Default is behavior is `auto`.
     */
    /**
     * Scrolls to the offset on the viewport.
     * @param {?} offset The offset to scroll to.
     * @param {?=} behavior The ScrollBehavior to use when scrolling. Default is behavior is `auto`.
     * @return {?}
     */
    CdkVirtualScrollViewport.prototype.scrollToOffset = /**
     * Scrolls to the offset on the viewport.
     * @param {?} offset The offset to scroll to.
     * @param {?=} behavior The ScrollBehavior to use when scrolling. Default is behavior is `auto`.
     * @return {?}
     */
    function (offset, behavior) {
        if (behavior === void 0) { behavior = 'auto'; }
        var /** @type {?} */ viewportElement = this.elementRef.nativeElement;
        if (supportsScrollBehavior()) {
            var /** @type {?} */ offsetDirection = this.orientation === 'horizontal' ? 'left' : 'top';
            viewportElement.scrollTo((_a = {}, _a[offsetDirection] = offset, _a.behavior = behavior, _a));
        }
        else {
            if (this.orientation === 'horizontal') {
                viewportElement.scrollLeft = offset;
            }
            else {
                viewportElement.scrollTop = offset;
            }
        }
        var _a;
    };
    /**
     * Scrolls to the offset for the given index.
     * @param index The index of the element to scroll to.
     * @param behavior The ScrollBehavior to use when scrolling. Default is behavior is `auto`.
     */
    /**
     * Scrolls to the offset for the given index.
     * @param {?} index The index of the element to scroll to.
     * @param {?=} behavior The ScrollBehavior to use when scrolling. Default is behavior is `auto`.
     * @return {?}
     */
    CdkVirtualScrollViewport.prototype.scrollToIndex = /**
     * Scrolls to the offset for the given index.
     * @param {?} index The index of the element to scroll to.
     * @param {?=} behavior The ScrollBehavior to use when scrolling. Default is behavior is `auto`.
     * @return {?}
     */
    function (index, behavior) {
        if (behavior === void 0) { behavior = 'auto'; }
        this._scrollStrategy.scrollToIndex(index, behavior);
    };
    /** @docs-private Internal method to set the scroll offset on the viewport. */
    /**
     * \@docs-private Internal method to set the scroll offset on the viewport.
     * @param {?} offset
     * @return {?}
     */
    CdkVirtualScrollViewport.prototype.setScrollOffset = /**
     * \@docs-private Internal method to set the scroll offset on the viewport.
     * @param {?} offset
     * @return {?}
     */
    function (offset) {
        // Rather than setting the offset immediately, we batch it up to be applied along with other DOM
        // writes during the next change detection cycle.
        this._pendingScrollOffset = offset;
        this._markChangeDetectionNeeded();
    };
    /** Gets the current scroll offset of the viewport (in pixels). */
    /**
     * Gets the current scroll offset of the viewport (in pixels).
     * @return {?}
     */
    CdkVirtualScrollViewport.prototype.measureScrollOffset = /**
     * Gets the current scroll offset of the viewport (in pixels).
     * @return {?}
     */
    function () {
        return this.orientation === 'horizontal' ?
            this.elementRef.nativeElement.scrollLeft : this.elementRef.nativeElement.scrollTop;
    };
    /** Measure the combined size of all of the rendered items. */
    /**
     * Measure the combined size of all of the rendered items.
     * @return {?}
     */
    CdkVirtualScrollViewport.prototype.measureRenderedContentSize = /**
     * Measure the combined size of all of the rendered items.
     * @return {?}
     */
    function () {
        var /** @type {?} */ contentEl = this._contentWrapper.nativeElement;
        return this.orientation === 'horizontal' ? contentEl.offsetWidth : contentEl.offsetHeight;
    };
    /**
     * Measure the total combined size of the given range. Throws if the range includes items that are
     * not rendered.
     */
    /**
     * Measure the total combined size of the given range. Throws if the range includes items that are
     * not rendered.
     * @param {?} range
     * @return {?}
     */
    CdkVirtualScrollViewport.prototype.measureRangeSize = /**
     * Measure the total combined size of the given range. Throws if the range includes items that are
     * not rendered.
     * @param {?} range
     * @return {?}
     */
    function (range) {
        if (!this._forOf) {
            return 0;
        }
        return this._forOf.measureRangeSize(range, this.orientation);
    };
    /** Update the viewport dimensions and re-render. */
    /**
     * Update the viewport dimensions and re-render.
     * @return {?}
     */
    CdkVirtualScrollViewport.prototype.checkViewportSize = /**
     * Update the viewport dimensions and re-render.
     * @return {?}
     */
    function () {
        // TODO: Cleanup later when add logic for handling content resize
        this._measureViewportSize();
        this._scrollStrategy.onDataLengthChanged();
    };
    /**
     * Measure the viewport size.
     * @return {?}
     */
    CdkVirtualScrollViewport.prototype._measureViewportSize = /**
     * Measure the viewport size.
     * @return {?}
     */
    function () {
        var /** @type {?} */ viewportEl = this.elementRef.nativeElement;
        this._viewportSize = this.orientation === 'horizontal' ?
            viewportEl.clientWidth : viewportEl.clientHeight;
    };
    /**
     * Queue up change detection to run.
     * @param {?=} runAfter
     * @return {?}
     */
    CdkVirtualScrollViewport.prototype._markChangeDetectionNeeded = /**
     * Queue up change detection to run.
     * @param {?=} runAfter
     * @return {?}
     */
    function (runAfter) {
        var _this = this;
        if (runAfter) {
            this._runAfterChangeDetection.push(runAfter);
        }
        // Use a Promise to batch together calls to `_doChangeDetection`. This way if we set a bunch of
        // properties sequentially we only have to run `_doChangeDetection` once at the end.
        if (!this._isChangeDetectionPending) {
            this._isChangeDetectionPending = true;
            this._ngZone.runOutsideAngular(function () {
                return Promise.resolve().then(function () {
                    _this._doChangeDetection();
                });
            });
        }
    };
    /**
     * Run change detection.
     * @return {?}
     */
    CdkVirtualScrollViewport.prototype._doChangeDetection = /**
     * Run change detection.
     * @return {?}
     */
    function () {
        var _this = this;
        this._isChangeDetectionPending = false;
        // Apply changes to Angular bindings. Note: We must call `markForCheck` to run change detection
        // from the root, since the repeated items are content projected in. Calling `detectChanges`
        // instead does not properly check the projected content.
        this._ngZone.run(function () { return _this._changeDetectorRef.markForCheck(); });
        // Apply the content transform. The transform can't be set via an Angular binding because
        // bypassSecurityTrustStyle is banned in Google. However the value is safe, it's composed of
        // string literals, a variable that can only be 'X' or 'Y', and user input that is run through
        // the `Number` function first to coerce it to a numeric value.
        this._contentWrapper.nativeElement.style.transform = this._renderedContentTransform;
        // Apply the pending scroll offset separately, since it can't be set up as an Angular binding.
        if (this._pendingScrollOffset != null) {
            if (this.orientation === 'horizontal') {
                this.elementRef.nativeElement.scrollLeft = this._pendingScrollOffset;
            }
            else {
                this.elementRef.nativeElement.scrollTop = this._pendingScrollOffset;
            }
        }
        var /** @type {?} */ runAfterChangeDetection = this._runAfterChangeDetection;
        this._runAfterChangeDetection = [];
        for (var _i = 0, runAfterChangeDetection_1 = runAfterChangeDetection; _i < runAfterChangeDetection_1.length; _i++) {
            var fn = runAfterChangeDetection_1[_i];
            fn();
        }
        this._ngZone.run(function () { return _this._changeDetectionComplete.next(); });
    };
    CdkVirtualScrollViewport.decorators = [
        { type: Component, args: [{selector: 'cdk-virtual-scroll-viewport',
                    template: "<div #contentWrapper class=\"cdk-virtual-scroll-content-wrapper\"><ng-content></ng-content></div><div class=\"cdk-virtual-scroll-spacer\" [style.height.px]=\"orientation === 'horizontal' ? 1 : _totalContentSize\" [style.width.px]=\"orientation === 'horizontal' ? _totalContentSize : 1\"></div>",
                    styles: ["cdk-virtual-scroll-viewport{display:block;position:relative;overflow:auto}.cdk-virtual-scroll-content-wrapper{position:absolute;top:0;left:0;will-change:contents,transform}.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper{bottom:0}.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>dl:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>ol:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>table:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>ul:not([cdkVirtualFor]){padding-left:0;padding-right:0;margin-left:0;margin-right:0;border-left-width:0;border-right-width:0;outline:0}.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper{right:0}.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>dl:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>ol:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>table:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>ul:not([cdkVirtualFor]){padding-top:0;padding-bottom:0;margin-top:0;margin-bottom:0;border-top-width:0;border-bottom-width:0;outline:0}.cdk-virtual-scroll-spacer{will-change:height,width}"],
                    host: {
                        'class': 'cdk-virtual-scroll-viewport',
                        '[class.cdk-virtual-scroll-orientation-horizontal]': 'orientation === "horizontal"',
                        '[class.cdk-virtual-scroll-orientation-vertical]': 'orientation === "vertical"',
                    },
                    encapsulation: ViewEncapsulation.None,
                    changeDetection: ChangeDetectionStrategy.OnPush,
                },] },
    ];
    /** @nocollapse */
    CdkVirtualScrollViewport.ctorParameters = function () { return [
        { type: ElementRef, },
        { type: ChangeDetectorRef, },
        { type: NgZone, },
        { type: undefined, decorators: [{ type: Inject, args: [VIRTUAL_SCROLL_STRATEGY,] },] },
    ]; };
    CdkVirtualScrollViewport.propDecorators = {
        "orientation": [{ type: Input },],
        "scrolledIndexChange": [{ type: Output },],
        "_contentWrapper": [{ type: ViewChild, args: ['contentWrapper',] },],
    };
    return CdkVirtualScrollViewport;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Helper to extract size from a DOM Node.
 * @param {?} orientation
 * @param {?} node
 * @return {?}
 */
function getSize(orientation, node) {
    var /** @type {?} */ el = /** @type {?} */ (node);
    if (!el.getBoundingClientRect) {
        return 0;
    }
    var /** @type {?} */ rect = el.getBoundingClientRect();
    return orientation == 'horizontal' ? rect.width : rect.height;
}
/**
 * A directive similar to `ngForOf` to be used for rendering data inside a virtual scrolling
 * container.
 * @template T
 */
var CdkVirtualForOf = /** @class */ (function () {
    function CdkVirtualForOf(_viewContainerRef, _template, _differs, /** The virtual scrolling viewport that these items are being rendered in. */
    _viewport) {
        var _this = this;
        this._viewContainerRef = _viewContainerRef;
        this._template = _template;
        this._differs = _differs;
        this._viewport = _viewport;
        /**
         * Emits when the rendered view of the data changes.
         */
        this.viewChange = new Subject();
        /**
         * Subject that emits when a new DataSource instance is given.
         */
        this._dataSourceChanges = new Subject();
        /**
         * The size of the cache used to store templates that are not being used for re-use later.
         * Setting the cache size to `0` will disable caching. Defaults to 20 templates.
         */
        this.cdkVirtualForTemplateCacheSize = 20;
        /**
         * Emits whenever the data in the current DataSource changes.
         */
        this.dataStream = this._dataSourceChanges
            .pipe(
        // Start off with null `DataSource`.
        startWith(/** @type {?} */ ((null))), 
        // Bundle up the previous and current data sources so we can work with both.
        pairwise(), 
        // Use `_changeDataSource` to disconnect from the previous data source and connect to the
        // new one, passing back a stream of data changes which we run through `switchMap` to give
        // us a data stream that emits the latest data from whatever the current `DataSource` is.
        switchMap(function (_a) {
            var prev = _a[0], cur = _a[1];
            return _this._changeDataSource(prev, cur);
        }), 
        // Replay the last emitted data when someone subscribes.
        shareReplay(1));
        /**
         * The differ used to calculate changes to the data.
         */
        this._differ = null;
        /**
         * The template cache used to hold on ot template instancess that have been stamped out, but don't
         * currently need to be rendered. These instances will be reused in the future rather than
         * stamping out brand new ones.
         */
        this._templateCache = [];
        /**
         * Whether the rendered data should be updated during the next ngDoCheck cycle.
         */
        this._needsUpdate = false;
        this._destroyed = new Subject();
        this.dataStream.subscribe(function (data) {
            _this._data = data;
            _this._onRenderedDataChange();
        });
        this._viewport.renderedRangeStream.pipe(takeUntil(this._destroyed)).subscribe(function (range) {
            _this._renderedRange = range;
            _this.viewChange.next(_this._renderedRange);
            _this._onRenderedDataChange();
        });
        this._viewport.attach(this);
    }
    Object.defineProperty(CdkVirtualForOf.prototype, "cdkVirtualForOf", {
        get: /**
         * The DataSource to display.
         * @return {?}
         */
        function () {
            return this._cdkVirtualForOf;
        },
        set: /**
         * @param {?} value
         * @return {?}
         */
        function (value) {
            this._cdkVirtualForOf = value;
            var /** @type {?} */ ds = value instanceof DataSource ? value :
                // Slice the value if its an NgIterable to ensure we're working with an array.
                new ArrayDataSource(value instanceof Observable ? value : Array.prototype.slice.call(value || []));
            this._dataSourceChanges.next(ds);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CdkVirtualForOf.prototype, "cdkVirtualForTrackBy", {
        get: /**
         * The `TrackByFunction` to use for tracking changes. The `TrackByFunction` takes the index and
         * the item and produces a value to be used as the item's identity when tracking changes.
         * @return {?}
         */
        function () {
            return this._cdkVirtualForTrackBy;
        },
        set: /**
         * @param {?} fn
         * @return {?}
         */
        function (fn) {
            var _this = this;
            this._needsUpdate = true;
            this._cdkVirtualForTrackBy = fn ?
                function (index, item) { return fn(index + (_this._renderedRange ? _this._renderedRange.start : 0), item); } :
                undefined;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CdkVirtualForOf.prototype, "cdkVirtualForTemplate", {
        set: /**
         * The template used to stamp out new elements.
         * @param {?} value
         * @return {?}
         */
        function (value) {
            if (value) {
                this._needsUpdate = true;
                this._template = value;
            }
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Measures the combined size (width for horizontal orientation, height for vertical) of all items
     * in the specified range. Throws an error if the range includes items that are not currently
     * rendered.
     */
    /**
     * Measures the combined size (width for horizontal orientation, height for vertical) of all items
     * in the specified range. Throws an error if the range includes items that are not currently
     * rendered.
     * @param {?} range
     * @param {?} orientation
     * @return {?}
     */
    CdkVirtualForOf.prototype.measureRangeSize = /**
     * Measures the combined size (width for horizontal orientation, height for vertical) of all items
     * in the specified range. Throws an error if the range includes items that are not currently
     * rendered.
     * @param {?} range
     * @param {?} orientation
     * @return {?}
     */
    function (range, orientation) {
        if (range.start >= range.end) {
            return 0;
        }
        if (range.start < this._renderedRange.start || range.end > this._renderedRange.end) {
            throw Error("Error: attempted to measure an item that isn't rendered.");
        }
        // The index into the list of rendered views for the first item in the range.
        var /** @type {?} */ renderedStartIndex = range.start - this._renderedRange.start;
        // The length of the range we're measuring.
        var /** @type {?} */ rangeLen = range.end - range.start;
        // Loop over all root nodes for all items in the range and sum up their size.
        var /** @type {?} */ totalSize = 0;
        var /** @type {?} */ i = rangeLen;
        while (i--) {
            var /** @type {?} */ view = /** @type {?} */ (this._viewContainerRef.get(i + renderedStartIndex));
            var /** @type {?} */ j = view ? view.rootNodes.length : 0;
            while (j--) {
                totalSize += getSize(orientation, /** @type {?} */ ((view)).rootNodes[j]);
            }
        }
        return totalSize;
    };
    /**
     * @return {?}
     */
    CdkVirtualForOf.prototype.ngDoCheck = /**
     * @return {?}
     */
    function () {
        if (this._differ && this._needsUpdate) {
            // TODO(mmalerba): We should differentiate needs update due to scrolling and a new portion of
            // this list being rendered (can use simpler algorithm) vs needs update due to data actually
            // changing (need to do this diff).
            var /** @type {?} */ changes = this._differ.diff(this._renderedItems);
            if (!changes) {
                this._updateContext();
            }
            else {
                this._applyChanges(changes);
            }
            this._needsUpdate = false;
        }
    };
    /**
     * @return {?}
     */
    CdkVirtualForOf.prototype.ngOnDestroy = /**
     * @return {?}
     */
    function () {
        this._viewport.detach();
        this._dataSourceChanges.complete();
        this.viewChange.complete();
        this._destroyed.next();
        this._destroyed.complete();
        for (var _i = 0, _a = this._templateCache; _i < _a.length; _i++) {
            var view = _a[_i];
            view.destroy();
        }
    };
    /**
     * React to scroll state changes in the viewport.
     * @return {?}
     */
    CdkVirtualForOf.prototype._onRenderedDataChange = /**
     * React to scroll state changes in the viewport.
     * @return {?}
     */
    function () {
        if (!this._renderedRange) {
            return;
        }
        this._renderedItems = this._data.slice(this._renderedRange.start, this._renderedRange.end);
        if (!this._differ) {
            this._differ = this._differs.find(this._renderedItems).create(this.cdkVirtualForTrackBy);
        }
        this._needsUpdate = true;
    };
    /**
     * Swap out one `DataSource` for another.
     * @param {?} oldDs
     * @param {?} newDs
     * @return {?}
     */
    CdkVirtualForOf.prototype._changeDataSource = /**
     * Swap out one `DataSource` for another.
     * @param {?} oldDs
     * @param {?} newDs
     * @return {?}
     */
    function (oldDs, newDs) {
        if (oldDs) {
            oldDs.disconnect(this);
        }
        this._needsUpdate = true;
        return newDs.connect(this);
    };
    /**
     * Update the `CdkVirtualForOfContext` for all views.
     * @return {?}
     */
    CdkVirtualForOf.prototype._updateContext = /**
     * Update the `CdkVirtualForOfContext` for all views.
     * @return {?}
     */
    function () {
        var /** @type {?} */ count = this._data.length;
        var /** @type {?} */ i = this._viewContainerRef.length;
        while (i--) {
            var /** @type {?} */ view = /** @type {?} */ (this._viewContainerRef.get(i));
            view.context.index = this._renderedRange.start + i;
            view.context.count = count;
            this._updateComputedContextProperties(view.context);
            view.detectChanges();
        }
    };
    /**
     * Apply changes to the DOM.
     * @param {?} changes
     * @return {?}
     */
    CdkVirtualForOf.prototype._applyChanges = /**
     * Apply changes to the DOM.
     * @param {?} changes
     * @return {?}
     */
    function (changes) {
        var _this = this;
        // Rearrange the views to put them in the right location.
        changes.forEachOperation(function (record, adjustedPreviousIndex, currentIndex) {
            if (record.previousIndex == null) {
                // Item added.
                var /** @type {?} */ view = _this._getViewForNewItem();
                _this._viewContainerRef.insert(view, currentIndex);
                view.context.$implicit = record.item;
            }
            else if (currentIndex == null) {
                // Item removed.
                _this._cacheView(/** @type {?} */ (_this._viewContainerRef.detach(adjustedPreviousIndex)));
            }
            else {
                // Item moved.
                var /** @type {?} */ view = /** @type {?} */ (_this._viewContainerRef.get(adjustedPreviousIndex));
                _this._viewContainerRef.move(view, currentIndex);
                view.context.$implicit = record.item;
            }
        });
        // Update $implicit for any items that had an identity change.
        changes.forEachIdentityChange(function (record) {
            var /** @type {?} */ view = /** @type {?} */ (_this._viewContainerRef.get(/** @type {?} */ ((record.currentIndex))));
            view.context.$implicit = record.item;
        });
        // Update the context variables on all items.
        var /** @type {?} */ count = this._data.length;
        var /** @type {?} */ i = this._viewContainerRef.length;
        while (i--) {
            var /** @type {?} */ view = /** @type {?} */ (this._viewContainerRef.get(i));
            view.context.index = this._renderedRange.start + i;
            view.context.count = count;
            this._updateComputedContextProperties(view.context);
        }
    };
    /**
     * Cache the given detached view.
     * @param {?} view
     * @return {?}
     */
    CdkVirtualForOf.prototype._cacheView = /**
     * Cache the given detached view.
     * @param {?} view
     * @return {?}
     */
    function (view) {
        if (this._templateCache.length < this.cdkVirtualForTemplateCacheSize) {
            this._templateCache.push(view);
        }
        else {
            view.destroy();
        }
    };
    /**
     * Get a view for a new item, either from the cache or by creating a new one.
     * @return {?}
     */
    CdkVirtualForOf.prototype._getViewForNewItem = /**
     * Get a view for a new item, either from the cache or by creating a new one.
     * @return {?}
     */
    function () {
        return this._templateCache.pop() || this._viewContainerRef.createEmbeddedView(this._template, {
            $implicit: /** @type {?} */ ((null)),
            cdkVirtualForOf: this._cdkVirtualForOf,
            index: -1,
            count: -1,
            first: false,
            last: false,
            odd: false,
            even: false
        });
    };
    /**
     * Update the computed properties on the `CdkVirtualForOfContext`.
     * @param {?} context
     * @return {?}
     */
    CdkVirtualForOf.prototype._updateComputedContextProperties = /**
     * Update the computed properties on the `CdkVirtualForOfContext`.
     * @param {?} context
     * @return {?}
     */
    function (context) {
        context.first = context.index === 0;
        context.last = context.index === context.count - 1;
        context.even = context.index % 2 === 0;
        context.odd = !context.even;
    };
    CdkVirtualForOf.decorators = [
        { type: Directive, args: [{
                    selector: '[cdkVirtualFor][cdkVirtualForOf]',
                },] },
    ];
    /** @nocollapse */
    CdkVirtualForOf.ctorParameters = function () { return [
        { type: ViewContainerRef, },
        { type: TemplateRef, },
        { type: IterableDiffers, },
        { type: CdkVirtualScrollViewport, decorators: [{ type: SkipSelf },] },
    ]; };
    CdkVirtualForOf.propDecorators = {
        "cdkVirtualForOf": [{ type: Input },],
        "cdkVirtualForTrackBy": [{ type: Input },],
        "cdkVirtualForTemplate": [{ type: Input },],
        "cdkVirtualForTemplateCacheSize": [{ type: Input },],
    };
    return CdkVirtualForOf;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
var ScrollingModule = /** @class */ (function () {
    function ScrollingModule() {
    }
    ScrollingModule.decorators = [
        { type: NgModule, args: [{
                    imports: [PlatformModule],
                    exports: [
                        CdkFixedSizeVirtualScroll,
                        CdkScrollable,
                        CdkVirtualForOf,
                        CdkVirtualScrollViewport,
                    ],
                    declarations: [
                        CdkFixedSizeVirtualScroll,
                        CdkScrollable,
                        CdkVirtualForOf,
                        CdkVirtualScrollViewport,
                    ],
                },] },
    ];
    return ScrollingModule;
}());
/**
 * @deprecated ScrollDispatchModule has been renamed to ScrollingModule.
 * \@breaking-change 8.0.0 delete this alias
 */
var ScrollDispatchModule = /** @class */ (function () {
    function ScrollDispatchModule() {
    }
    ScrollDispatchModule.decorators = [
        { type: NgModule, args: [{
                    imports: [ScrollingModule],
                    exports: [ScrollingModule],
                },] },
    ];
    return ScrollDispatchModule;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Time in ms to throttle the resize events by default.
 */
var /** @type {?} */ DEFAULT_RESIZE_TIME = 20;
/**
 * Simple utility for getting the bounds of the browser viewport.
 * \@docs-private
 */
var ViewportRuler = /** @class */ (function () {
    function ViewportRuler(_platform, ngZone) {
        var _this = this;
        this._platform = _platform;
        this._change = _platform.isBrowser ? ngZone.runOutsideAngular(function () {
            return merge(fromEvent(window, 'resize'), fromEvent(window, 'orientationchange'));
        }) : of();
        this._invalidateCache = this.change().subscribe(function () { return _this._updateViewportSize(); });
    }
    /**
     * @return {?}
     */
    ViewportRuler.prototype.ngOnDestroy = /**
     * @return {?}
     */
    function () {
        this._invalidateCache.unsubscribe();
    };
    /** Returns the viewport's width and height. */
    /**
     * Returns the viewport's width and height.
     * @return {?}
     */
    ViewportRuler.prototype.getViewportSize = /**
     * Returns the viewport's width and height.
     * @return {?}
     */
    function () {
        if (!this._viewportSize) {
            this._updateViewportSize();
        }
        var /** @type {?} */ output = { width: this._viewportSize.width, height: this._viewportSize.height };
        // If we're not on a browser, don't cache the size since it'll be mocked out anyway.
        if (!this._platform.isBrowser) {
            this._viewportSize = /** @type {?} */ ((null));
        }
        return output;
    };
    /** Gets a ClientRect for the viewport's bounds. */
    /**
     * Gets a ClientRect for the viewport's bounds.
     * @return {?}
     */
    ViewportRuler.prototype.getViewportRect = /**
     * Gets a ClientRect for the viewport's bounds.
     * @return {?}
     */
    function () {
        // Use the document element's bounding rect rather than the window scroll properties
        // (e.g. pageYOffset, scrollY) due to in issue in Chrome and IE where window scroll
        // properties and client coordinates (boundingClientRect, clientX/Y, etc.) are in different
        // conceptual viewports. Under most circumstances these viewports are equivalent, but they
        // can disagree when the page is pinch-zoomed (on devices that support touch).
        // See https://bugs.chromium.org/p/chromium/issues/detail?id=489206#c4
        // We use the documentElement instead of the body because, by default (without a css reset)
        // browsers typically give the document body an 8px margin, which is not included in
        // getBoundingClientRect().
        var /** @type {?} */ scrollPosition = this.getViewportScrollPosition();
        var _a = this.getViewportSize(), width = _a.width, height = _a.height;
        return {
            top: scrollPosition.top,
            left: scrollPosition.left,
            bottom: scrollPosition.top + height,
            right: scrollPosition.left + width,
            height: height,
            width: width,
        };
    };
    /** Gets the (top, left) scroll position of the viewport. */
    /**
     * Gets the (top, left) scroll position of the viewport.
     * @return {?}
     */
    ViewportRuler.prototype.getViewportScrollPosition = /**
     * Gets the (top, left) scroll position of the viewport.
     * @return {?}
     */
    function () {
        // While we can get a reference to the fake document
        // during SSR, it doesn't have getBoundingClientRect.
        if (!this._platform.isBrowser) {
            return { top: 0, left: 0 };
        }
        // The top-left-corner of the viewport is determined by the scroll position of the document
        // body, normally just (scrollLeft, scrollTop). However, Chrome and Firefox disagree about
        // whether `document.body` or `document.documentElement` is the scrolled element, so reading
        // `scrollTop` and `scrollLeft` is inconsistent. However, using the bounding rect of
        // `document.documentElement` works consistently, where the `top` and `left` values will
        // equal negative the scroll position.
        var /** @type {?} */ documentRect = document.documentElement.getBoundingClientRect();
        var /** @type {?} */ top = -documentRect.top || document.body.scrollTop || window.scrollY ||
            document.documentElement.scrollTop || 0;
        var /** @type {?} */ left = -documentRect.left || document.body.scrollLeft || window.scrollX ||
            document.documentElement.scrollLeft || 0;
        return { top: top, left: left };
    };
    /**
     * Returns a stream that emits whenever the size of the viewport changes.
     * @param throttleTime Time in milliseconds to throttle the stream.
     */
    /**
     * Returns a stream that emits whenever the size of the viewport changes.
     * @param {?=} throttleTime Time in milliseconds to throttle the stream.
     * @return {?}
     */
    ViewportRuler.prototype.change = /**
     * Returns a stream that emits whenever the size of the viewport changes.
     * @param {?=} throttleTime Time in milliseconds to throttle the stream.
     * @return {?}
     */
    function (throttleTime) {
        if (throttleTime === void 0) { throttleTime = DEFAULT_RESIZE_TIME; }
        return throttleTime > 0 ? this._change.pipe(auditTime(throttleTime)) : this._change;
    };
    /**
     * Updates the cached viewport size.
     * @return {?}
     */
    ViewportRuler.prototype._updateViewportSize = /**
     * Updates the cached viewport size.
     * @return {?}
     */
    function () {
        this._viewportSize = this._platform.isBrowser ?
            { width: window.innerWidth, height: window.innerHeight } :
            { width: 0, height: 0 };
    };
    ViewportRuler.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] },
    ];
    /** @nocollapse */
    ViewportRuler.ctorParameters = function () { return [
        { type: Platform, },
        { type: NgZone, },
    ]; };
    /** @nocollapse */ ViewportRuler.ngInjectableDef = defineInjectable({ factory: function ViewportRuler_Factory() { return new ViewportRuler(inject(Platform), inject(NgZone)); }, token: ViewportRuler, providedIn: "root" });
    return ViewportRuler;
}());
/**
 * \@docs-private \@deprecated \@breaking-change 7.0.0
 * @param {?} parentRuler
 * @param {?} platform
 * @param {?} ngZone
 * @return {?}
 */
function VIEWPORT_RULER_PROVIDER_FACTORY(parentRuler, platform, ngZone) {
    return parentRuler || new ViewportRuler(platform, ngZone);
}
/**
 * \@docs-private \@deprecated \@breaking-change 7.0.0
 */
var /** @type {?} */ VIEWPORT_RULER_PROVIDER = {
    // If there is already a ViewportRuler available, use that. Otherwise, provide a new one.
    provide: ViewportRuler,
    deps: [[new Optional(), new SkipSelf(), ViewportRuler], Platform, NgZone],
    useFactory: VIEWPORT_RULER_PROVIDER_FACTORY
};

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

export { FixedSizeVirtualScrollStrategy, _fixedSizeVirtualScrollStrategyFactory, CdkFixedSizeVirtualScroll, DEFAULT_SCROLL_TIME, ScrollDispatcher, SCROLL_DISPATCHER_PROVIDER_FACTORY, SCROLL_DISPATCHER_PROVIDER, CdkScrollable, ScrollingModule, ScrollDispatchModule, DEFAULT_RESIZE_TIME, ViewportRuler, VIEWPORT_RULER_PROVIDER_FACTORY, VIEWPORT_RULER_PROVIDER, CdkVirtualForOf, VIRTUAL_SCROLL_STRATEGY, CdkVirtualScrollViewport };
//# sourceMappingURL=scrolling.es5.js.map
