/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ArrayDataSource, isDataSource, } from '@angular/cdk/collections';
import { Directive, Input, IterableDiffers, NgZone, SkipSelf, TemplateRef, ViewContainerRef, } from '@angular/core';
import { Observable, Subject, of as observableOf } from 'rxjs';
import { pairwise, shareReplay, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { CdkVirtualScrollViewport } from './virtual-scroll-viewport';
/**
 * Helper to extract size from a DOM Node.
 * @param {?} orientation
 * @param {?} node
 * @return {?}
 */
function getSize(orientation, node) {
    /** @type {?} */
    const el = (/** @type {?} */ (node));
    if (!el.getBoundingClientRect) {
        return 0;
    }
    /** @type {?} */
    const rect = el.getBoundingClientRect();
    return orientation == 'horizontal' ? rect.width : rect.height;
}
/**
 * A directive similar to `ngForOf` to be used for rendering data inside a virtual scrolling
 * container.
 * @template T
 */
export class CdkVirtualForOf {
    /**
     * @param {?} _viewContainerRef
     * @param {?} _template
     * @param {?} _differs
     * @param {?} _viewport
     * @param {?} ngZone
     */
    constructor(_viewContainerRef, _template, _differs, _viewport, ngZone) {
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
        startWith((/** @type {?} */ (null))), 
        // Bundle up the previous and current data sources so we can work with both.
        pairwise(), 
        // Use `_changeDataSource` to disconnect from the previous data source and connect to the
        // new one, passing back a stream of data changes which we run through `switchMap` to give
        // us a data stream that emits the latest data from whatever the current `DataSource` is.
        switchMap((/**
         * @param {?} __0
         * @return {?}
         */
        ([prev, cur]) => this._changeDataSource(prev, cur))), 
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
        this.dataStream.subscribe((/**
         * @param {?} data
         * @return {?}
         */
        data => {
            this._data = data;
            this._onRenderedDataChange();
        }));
        this._viewport.renderedRangeStream.pipe(takeUntil(this._destroyed)).subscribe((/**
         * @param {?} range
         * @return {?}
         */
        range => {
            this._renderedRange = range;
            ngZone.run((/**
             * @return {?}
             */
            () => this.viewChange.next(this._renderedRange)));
            this._onRenderedDataChange();
        }));
        this._viewport.attach(this);
    }
    /**
     * The DataSource to display.
     * @return {?}
     */
    get cdkVirtualForOf() {
        return this._cdkVirtualForOf;
    }
    /**
     * @param {?} value
     * @return {?}
     */
    set cdkVirtualForOf(value) {
        this._cdkVirtualForOf = value;
        /** @type {?} */
        const ds = isDataSource(value) ? value :
            // Slice the value if its an NgIterable to ensure we're working with an array.
            new ArrayDataSource(value instanceof Observable ? value : Array.prototype.slice.call(value || []));
        this._dataSourceChanges.next(ds);
    }
    /**
     * The `TrackByFunction` to use for tracking changes. The `TrackByFunction` takes the index and
     * the item and produces a value to be used as the item's identity when tracking changes.
     * @return {?}
     */
    get cdkVirtualForTrackBy() {
        return this._cdkVirtualForTrackBy;
    }
    /**
     * @param {?} fn
     * @return {?}
     */
    set cdkVirtualForTrackBy(fn) {
        this._needsUpdate = true;
        this._cdkVirtualForTrackBy = fn ?
            (/**
             * @param {?} index
             * @param {?} item
             * @return {?}
             */
            (index, item) => fn(index + (this._renderedRange ? this._renderedRange.start : 0), item)) :
            undefined;
    }
    /**
     * The template used to stamp out new elements.
     * @param {?} value
     * @return {?}
     */
    set cdkVirtualForTemplate(value) {
        if (value) {
            this._needsUpdate = true;
            this._template = value;
        }
    }
    /**
     * Measures the combined size (width for horizontal orientation, height for vertical) of all items
     * in the specified range. Throws an error if the range includes items that are not currently
     * rendered.
     * @param {?} range
     * @param {?} orientation
     * @return {?}
     */
    measureRangeSize(range, orientation) {
        if (range.start >= range.end) {
            return 0;
        }
        if (range.start < this._renderedRange.start || range.end > this._renderedRange.end) {
            throw Error(`Error: attempted to measure an item that isn't rendered.`);
        }
        // The index into the list of rendered views for the first item in the range.
        /** @type {?} */
        const renderedStartIndex = range.start - this._renderedRange.start;
        // The length of the range we're measuring.
        /** @type {?} */
        const rangeLen = range.end - range.start;
        // Loop over all root nodes for all items in the range and sum up their size.
        /** @type {?} */
        let totalSize = 0;
        /** @type {?} */
        let i = rangeLen;
        while (i--) {
            /** @type {?} */
            const view = (/** @type {?} */ (this._viewContainerRef.get(i + renderedStartIndex)));
            /** @type {?} */
            let j = view ? view.rootNodes.length : 0;
            while (j--) {
                totalSize += getSize(orientation, (/** @type {?} */ (view)).rootNodes[j]);
            }
        }
        return totalSize;
    }
    /**
     * @return {?}
     */
    ngDoCheck() {
        if (this._differ && this._needsUpdate) {
            // TODO(mmalerba): We should differentiate needs update due to scrolling and a new portion of
            // this list being rendered (can use simpler algorithm) vs needs update due to data actually
            // changing (need to do this diff).
            /** @type {?} */
            const changes = this._differ.diff(this._renderedItems);
            if (!changes) {
                this._updateContext();
            }
            else {
                this._applyChanges(changes);
            }
            this._needsUpdate = false;
        }
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        this._viewport.detach();
        this._dataSourceChanges.next();
        this._dataSourceChanges.complete();
        this.viewChange.complete();
        this._destroyed.next();
        this._destroyed.complete();
        for (let view of this._templateCache) {
            view.destroy();
        }
    }
    /**
     * React to scroll state changes in the viewport.
     * @private
     * @return {?}
     */
    _onRenderedDataChange() {
        if (!this._renderedRange) {
            return;
        }
        this._renderedItems = this._data.slice(this._renderedRange.start, this._renderedRange.end);
        if (!this._differ) {
            this._differ = this._differs.find(this._renderedItems).create(this.cdkVirtualForTrackBy);
        }
        this._needsUpdate = true;
    }
    /**
     * Swap out one `DataSource` for another.
     * @private
     * @param {?} oldDs
     * @param {?} newDs
     * @return {?}
     */
    _changeDataSource(oldDs, newDs) {
        if (oldDs) {
            oldDs.disconnect(this);
        }
        this._needsUpdate = true;
        return newDs ? newDs.connect(this) : observableOf();
    }
    /**
     * Update the `CdkVirtualForOfContext` for all views.
     * @private
     * @return {?}
     */
    _updateContext() {
        /** @type {?} */
        const count = this._data.length;
        /** @type {?} */
        let i = this._viewContainerRef.length;
        while (i--) {
            /** @type {?} */
            let view = (/** @type {?} */ (this._viewContainerRef.get(i)));
            view.context.index = this._renderedRange.start + i;
            view.context.count = count;
            this._updateComputedContextProperties(view.context);
            view.detectChanges();
        }
    }
    /**
     * Apply changes to the DOM.
     * @private
     * @param {?} changes
     * @return {?}
     */
    _applyChanges(changes) {
        // Rearrange the views to put them in the right location.
        changes.forEachOperation((/**
         * @param {?} record
         * @param {?} adjustedPreviousIndex
         * @param {?} currentIndex
         * @return {?}
         */
        (record, adjustedPreviousIndex, currentIndex) => {
            if (record.previousIndex == null) { // Item added.
                // Item added.
                /** @type {?} */
                const view = this._insertViewForNewItem((/** @type {?} */ (currentIndex)));
                view.context.$implicit = record.item;
            }
            else if (currentIndex == null) { // Item removed.
                this._cacheView(this._detachView((/** @type {?} */ (adjustedPreviousIndex))));
            }
            else { // Item moved.
                // Item moved.
                /** @type {?} */
                const view = (/** @type {?} */ (this._viewContainerRef.get((/** @type {?} */ (adjustedPreviousIndex)))));
                this._viewContainerRef.move(view, currentIndex);
                view.context.$implicit = record.item;
            }
        }));
        // Update $implicit for any items that had an identity change.
        changes.forEachIdentityChange((/**
         * @param {?} record
         * @return {?}
         */
        (record) => {
            /** @type {?} */
            const view = (/** @type {?} */ (this._viewContainerRef.get((/** @type {?} */ (record.currentIndex)))));
            view.context.$implicit = record.item;
        }));
        // Update the context variables on all items.
        /** @type {?} */
        const count = this._data.length;
        /** @type {?} */
        let i = this._viewContainerRef.length;
        while (i--) {
            /** @type {?} */
            const view = (/** @type {?} */ (this._viewContainerRef.get(i)));
            view.context.index = this._renderedRange.start + i;
            view.context.count = count;
            this._updateComputedContextProperties(view.context);
        }
    }
    /**
     * Cache the given detached view.
     * @private
     * @param {?} view
     * @return {?}
     */
    _cacheView(view) {
        if (this._templateCache.length < this.cdkVirtualForTemplateCacheSize) {
            this._templateCache.push(view);
        }
        else {
            /** @type {?} */
            const index = this._viewContainerRef.indexOf(view);
            // It's very unlikely that the index will ever be -1, but just in case,
            // destroy the view on its own, otherwise destroy it through the
            // container to ensure that all the references are removed.
            if (index === -1) {
                view.destroy();
            }
            else {
                this._viewContainerRef.remove(index);
            }
        }
    }
    /**
     * Inserts a view for a new item, either from the cache or by creating a new one.
     * @private
     * @param {?} index
     * @return {?}
     */
    _insertViewForNewItem(index) {
        return this._insertViewFromCache(index) || this._createEmbeddedViewAt(index);
    }
    /**
     * Update the computed properties on the `CdkVirtualForOfContext`.
     * @private
     * @param {?} context
     * @return {?}
     */
    _updateComputedContextProperties(context) {
        context.first = context.index === 0;
        context.last = context.index === context.count - 1;
        context.even = context.index % 2 === 0;
        context.odd = !context.even;
    }
    /**
     * Creates a new embedded view and moves it to the given index
     * @private
     * @param {?} index
     * @return {?}
     */
    _createEmbeddedViewAt(index) {
        // Note that it's important that we insert the item directly at the proper index,
        // rather than inserting it and the moving it in place, because if there's a directive
        // on the same node that injects the `ViewContainerRef`, Angular will insert another
        // comment node which can throw off the move when it's being repeated for all items.
        return this._viewContainerRef.createEmbeddedView(this._template, {
            $implicit: (/** @type {?} */ (null)),
            // It's guaranteed that the iterable is not "undefined" or "null" because we only
            // generate views for elements if the "cdkVirtualForOf" iterable has elements.
            cdkVirtualForOf: (/** @type {?} */ (this._cdkVirtualForOf)),
            index: -1,
            count: -1,
            first: false,
            last: false,
            odd: false,
            even: false
        }, index);
    }
    /**
     * Inserts a recycled view from the cache at the given index.
     * @private
     * @param {?} index
     * @return {?}
     */
    _insertViewFromCache(index) {
        /** @type {?} */
        const cachedView = this._templateCache.pop();
        if (cachedView) {
            this._viewContainerRef.insert(cachedView, index);
        }
        return cachedView || null;
    }
    /**
     * Detaches the embedded view at the given index.
     * @private
     * @param {?} index
     * @return {?}
     */
    _detachView(index) {
        return (/** @type {?} */ (this._viewContainerRef.detach(index)));
    }
}
CdkVirtualForOf.decorators = [
    { type: Directive, args: [{
                selector: '[cdkVirtualFor][cdkVirtualForOf]',
            },] }
];
/** @nocollapse */
CdkVirtualForOf.ctorParameters = () => [
    { type: ViewContainerRef },
    { type: TemplateRef },
    { type: IterableDiffers },
    { type: CdkVirtualScrollViewport, decorators: [{ type: SkipSelf }] },
    { type: NgZone }
];
CdkVirtualForOf.propDecorators = {
    cdkVirtualForOf: [{ type: Input }],
    cdkVirtualForTrackBy: [{ type: Input }],
    cdkVirtualForTemplate: [{ type: Input }],
    cdkVirtualForTemplateCacheSize: [{ type: Input }]
};
if (false) {
    /**
     * Emits when the rendered view of the data changes.
     * @type {?}
     */
    CdkVirtualForOf.prototype.viewChange;
    /**
     * Subject that emits when a new DataSource instance is given.
     * @type {?}
     * @private
     */
    CdkVirtualForOf.prototype._dataSourceChanges;
    /** @type {?} */
    CdkVirtualForOf.prototype._cdkVirtualForOf;
    /**
     * @type {?}
     * @private
     */
    CdkVirtualForOf.prototype._cdkVirtualForTrackBy;
    /**
     * The size of the cache used to store templates that are not being used for re-use later.
     * Setting the cache size to `0` will disable caching. Defaults to 20 templates.
     * @type {?}
     */
    CdkVirtualForOf.prototype.cdkVirtualForTemplateCacheSize;
    /**
     * Emits whenever the data in the current DataSource changes.
     * @type {?}
     */
    CdkVirtualForOf.prototype.dataStream;
    /**
     * The differ used to calculate changes to the data.
     * @type {?}
     * @private
     */
    CdkVirtualForOf.prototype._differ;
    /**
     * The most recent data emitted from the DataSource.
     * @type {?}
     * @private
     */
    CdkVirtualForOf.prototype._data;
    /**
     * The currently rendered items.
     * @type {?}
     * @private
     */
    CdkVirtualForOf.prototype._renderedItems;
    /**
     * The currently rendered range of indices.
     * @type {?}
     * @private
     */
    CdkVirtualForOf.prototype._renderedRange;
    /**
     * The template cache used to hold on ot template instancess that have been stamped out, but don't
     * currently need to be rendered. These instances will be reused in the future rather than
     * stamping out brand new ones.
     * @type {?}
     * @private
     */
    CdkVirtualForOf.prototype._templateCache;
    /**
     * Whether the rendered data should be updated during the next ngDoCheck cycle.
     * @type {?}
     * @private
     */
    CdkVirtualForOf.prototype._needsUpdate;
    /**
     * @type {?}
     * @private
     */
    CdkVirtualForOf.prototype._destroyed;
    /**
     * The view container to add items to.
     * @type {?}
     * @private
     */
    CdkVirtualForOf.prototype._viewContainerRef;
    /**
     * The template to use when stamping out new items.
     * @type {?}
     * @private
     */
    CdkVirtualForOf.prototype._template;
    /**
     * The set of available differs.
     * @type {?}
     * @private
     */
    CdkVirtualForOf.prototype._differs;
    /**
     * The virtual scrolling viewport that these items are being rendered in.
     * @type {?}
     * @private
     */
    CdkVirtualForOf.prototype._viewport;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1mb3Itb2YuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy92aXJ0dWFsLWZvci1vZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFDTCxlQUFlLEVBSWYsWUFBWSxHQUNiLE1BQU0sMEJBQTBCLENBQUM7QUFDbEMsT0FBTyxFQUNMLFNBQVMsRUFHVCxLQUFLLEVBSUwsZUFBZSxFQUVmLE1BQU0sRUFFTixRQUFRLEVBQ1IsV0FBVyxFQUVYLGdCQUFnQixHQUNqQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxFQUFFLElBQUksWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQzdELE9BQU8sRUFBQyxRQUFRLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDdEYsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0sMkJBQTJCLENBQUM7Ozs7Ozs7QUF5Qm5FLFNBQVMsT0FBTyxDQUFDLFdBQXNDLEVBQUUsSUFBVTs7VUFDM0QsRUFBRSxHQUFHLG1CQUFBLElBQUksRUFBVztJQUMxQixJQUFJLENBQUMsRUFBRSxDQUFDLHFCQUFxQixFQUFFO1FBQzdCLE9BQU8sQ0FBQyxDQUFDO0tBQ1Y7O1VBQ0ssSUFBSSxHQUFHLEVBQUUsQ0FBQyxxQkFBcUIsRUFBRTtJQUN2QyxPQUFPLFdBQVcsSUFBSSxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDaEUsQ0FBQzs7Ozs7O0FBVUQsTUFBTSxPQUFPLGVBQWU7Ozs7Ozs7O0lBMkYxQixZQUVZLGlCQUFtQyxFQUVuQyxTQUFpRCxFQUVqRCxRQUF5QixFQUViLFNBQW1DLEVBQ3ZELE1BQWM7UUFQTixzQkFB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SUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDbEQ7UUFDRCxPQUFPLFVBQVUsSUFBSSxJQUFJLENBQUM7SUFDNUIsQ0FBQzs7Ozs7OztJQUdPLFdBQVcsQ0FBQyxLQUFhO1FBQy9CLE9BQU8sbUJBQUEsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFDRyxDQUFDO0lBQ2pELENBQUM7OztZQTdURixTQUFTLFNBQUM7Z0JBQ1QsUUFBUSxFQUFFLGtDQUFrQzthQUM3Qzs7OztZQTdDQyxnQkFBZ0I7WUFGaEIsV0FBVztZQUxYLGVBQWU7WUFXVCx3QkFBd0IsdUJBNkl6QixRQUFRO1lBdEpiLE1BQU07Ozs4QkEyREwsS0FBSzttQ0FrQkwsS0FBSztvQ0FhTCxLQUFLOzZDQVlMLEtBQUs7Ozs7Ozs7SUFqRE4scUNBQXNDOzs7Ozs7SUFHdEMsNkNBQTBEOztJQWUxRCwyQ0FBcUY7Ozs7O0lBZ0JyRixnREFBOEQ7Ozs7OztJQWU5RCx5REFBcUQ7Ozs7O0lBR3JELHFDQVd3Qjs7Ozs7O0lBR3hCLGtDQUFpRDs7Ozs7O0lBR2pELGdDQUFzQzs7Ozs7O0lBR3RDLHlDQUE0Qjs7Ozs7O0lBRzVCLHlDQUFrQzs7Ozs7Ozs7SUFPbEMseUNBQTBFOzs7Ozs7SUFHMUUsdUNBQTZCOzs7OztJQUU3QixxQ0FBeUM7Ozs7OztJQUlyQyw0Q0FBMkM7Ozs7OztJQUUzQyxvQ0FBeUQ7Ozs7OztJQUV6RCxtQ0FBaUM7Ozs7OztJQUVqQyxvQ0FBdUQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgQXJyYXlEYXRhU291cmNlLFxuICBDb2xsZWN0aW9uVmlld2VyLFxuICBEYXRhU291cmNlLFxuICBMaXN0UmFuZ2UsXG4gIGlzRGF0YVNvdXJjZSxcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvbGxlY3Rpb25zJztcbmltcG9ydCB7XG4gIERpcmVjdGl2ZSxcbiAgRG9DaGVjayxcbiAgRW1iZWRkZWRWaWV3UmVmLFxuICBJbnB1dCxcbiAgSXRlcmFibGVDaGFuZ2VSZWNvcmQsXG4gIEl0ZXJhYmxlQ2hhbmdlcyxcbiAgSXRlcmFibGVEaWZmZXIsXG4gIEl0ZXJhYmxlRGlmZmVycyxcbiAgTmdJdGVyYWJsZSxcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIFNraXBTZWxmLFxuICBUZW1wbGF0ZVJlZixcbiAgVHJhY2tCeUZ1bmN0aW9uLFxuICBWaWV3Q29udGFpbmVyUmVmLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdCwgb2YgYXMgb2JzZXJ2YWJsZU9mfSBmcm9tICdyeGpzJztcbmltcG9ydCB7cGFpcndpc2UsIHNoYXJlUmVwbGF5LCBzdGFydFdpdGgsIHN3aXRjaE1hcCwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge0Nka1ZpcnR1YWxTY3JvbGxWaWV3cG9ydH0gZnJvbSAnLi92aXJ0dWFsLXNjcm9sbC12aWV3cG9ydCc7XG5cblxuLyoqIFRoZSBjb250ZXh0IGZvciBhbiBpdGVtIHJlbmRlcmVkIGJ5IGBDZGtWaXJ0dWFsRm9yT2ZgICovXG5leHBvcnQgdHlwZSBDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+ID0ge1xuICAvKiogVGhlIGl0ZW0gdmFsdWUuICovXG4gICRpbXBsaWNpdDogVDtcbiAgLyoqIFRoZSBEYXRhU291cmNlLCBPYnNlcnZhYmxlLCBvciBOZ0l0ZXJhYmxlIHRoYXQgd2FzIHBhc3NlZCB0byAqY2RrVmlydHVhbEZvci4gKi9cbiAgY2RrVmlydHVhbEZvck9mOiBEYXRhU291cmNlPFQ+IHwgT2JzZXJ2YWJsZTxUW10+IHwgTmdJdGVyYWJsZTxUPjtcbiAgLyoqIFRoZSBpbmRleCBvZiB0aGUgaXRlbSBpbiB0aGUgRGF0YVNvdXJjZS4gKi9cbiAgaW5kZXg6IG51bWJlcjtcbiAgLyoqIFRoZSBudW1iZXIgb2YgaXRlbXMgaW4gdGhlIERhdGFTb3VyY2UuICovXG4gIGNvdW50OiBudW1iZXI7XG4gIC8qKiBXaGV0aGVyIHRoaXMgaXMgdGhlIGZpcnN0IGl0ZW0gaW4gdGhlIERhdGFTb3VyY2UuICovXG4gIGZpcnN0OiBib29sZWFuO1xuICAvKiogV2hldGhlciB0aGlzIGlzIHRoZSBsYXN0IGl0ZW0gaW4gdGhlIERhdGFTb3VyY2UuICovXG4gIGxhc3Q6IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIHRoZSBpbmRleCBpcyBldmVuLiAqL1xuICBldmVuOiBib29sZWFuO1xuICAvKiogV2hldGhlciB0aGUgaW5kZXggaXMgb2RkLiAqL1xuICBvZGQ6IGJvb2xlYW47XG59O1xuXG5cbi8qKiBIZWxwZXIgdG8gZXh0cmFjdCBzaXplIGZyb20gYSBET00gTm9kZS4gKi9cbmZ1bmN0aW9uIGdldFNpemUob3JpZW50YXRpb246ICdob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCcsIG5vZGU6IE5vZGUpOiBudW1iZXIge1xuICBjb25zdCBlbCA9IG5vZGUgYXMgRWxlbWVudDtcbiAgaWYgKCFlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuICBjb25zdCByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIHJldHVybiBvcmllbnRhdGlvbiA9PSAnaG9yaXpvbnRhbCcgPyByZWN0LndpZHRoIDogcmVjdC5oZWlnaHQ7XG59XG5cblxuLyoqXG4gKiBBIGRpcmVjdGl2ZSBzaW1pbGFyIHRvIGBuZ0Zvck9mYCB0byBiZSB1c2VkIGZvciByZW5kZXJpbmcgZGF0YSBpbnNpZGUgYSB2aXJ0dWFsIHNjcm9sbGluZ1xuICogY29udGFpbmVyLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrVmlydHVhbEZvcl1bY2RrVmlydHVhbEZvck9mXScsXG59KVxuZXhwb3J0IGNsYXNzIENka1ZpcnR1YWxGb3JPZjxUPiBpbXBsZW1lbnRzIENvbGxlY3Rpb25WaWV3ZXIsIERvQ2hlY2ssIE9uRGVzdHJveSB7XG4gIC8qKiBFbWl0cyB3aGVuIHRoZSByZW5kZXJlZCB2aWV3IG9mIHRoZSBkYXRhIGNoYW5nZXMuICovXG4gIHZpZXdDaGFuZ2UgPSBuZXcgU3ViamVjdDxMaXN0UmFuZ2U+KCk7XG5cbiAgLyoqIFN1YmplY3QgdGhhdCBlbWl0cyB3aGVuIGEgbmV3IERhdGFTb3VyY2UgaW5zdGFuY2UgaXMgZ2l2ZW4uICovXG4gIHByaXZhdGUgX2RhdGFTb3VyY2VDaGFuZ2VzID0gbmV3IFN1YmplY3Q8RGF0YVNvdXJjZTxUPj4oKTtcblxuICAvKiogVGhlIERhdGFTb3VyY2UgdG8gZGlzcGxheS4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGNka1ZpcnR1YWxGb3JPZigpOiBEYXRhU291cmNlPFQ+IHwgT2JzZXJ2YWJsZTxUW10+IHwgTmdJdGVyYWJsZTxUPiB8IG51bGwgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9jZGtWaXJ0dWFsRm9yT2Y7XG4gIH1cbiAgc2V0IGNka1ZpcnR1YWxGb3JPZih2YWx1ZTogRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8VFtdPiB8IE5nSXRlcmFibGU8VD4gfCBudWxsIHwgdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5fY2RrVmlydHVhbEZvck9mID0gdmFsdWU7XG4gICAgY29uc3QgZHMgPSBpc0RhdGFTb3VyY2UodmFsdWUpID8gdmFsdWUgOlxuICAgICAgICAvLyBTbGljZSB0aGUgdmFsdWUgaWYgaXRzIGFuIE5nSXRlcmFibGUgdG8gZW5zdXJlIHdlJ3JlIHdvcmtpbmcgd2l0aCBhbiBhcnJheS5cbiAgICAgICAgbmV3IEFycmF5RGF0YVNvdXJjZTxUPihcbiAgICAgICAgICAgIHZhbHVlIGluc3RhbmNlb2YgT2JzZXJ2YWJsZSA/IHZhbHVlIDogQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwodmFsdWUgfHwgW10pKTtcbiAgICB0aGlzLl9kYXRhU291cmNlQ2hhbmdlcy5uZXh0KGRzKTtcbiAgfVxuICBfY2RrVmlydHVhbEZvck9mOiBEYXRhU291cmNlPFQ+IHwgT2JzZXJ2YWJsZTxUW10+IHwgTmdJdGVyYWJsZTxUPiB8IG51bGwgfCB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFRoZSBgVHJhY2tCeUZ1bmN0aW9uYCB0byB1c2UgZm9yIHRyYWNraW5nIGNoYW5nZXMuIFRoZSBgVHJhY2tCeUZ1bmN0aW9uYCB0YWtlcyB0aGUgaW5kZXggYW5kXG4gICAqIHRoZSBpdGVtIGFuZCBwcm9kdWNlcyBhIHZhbHVlIHRvIGJlIHVzZWQgYXMgdGhlIGl0ZW0ncyBpZGVudGl0eSB3aGVuIHRyYWNraW5nIGNoYW5nZXMuXG4gICAqL1xuICBASW5wdXQoKVxuICBnZXQgY2RrVmlydHVhbEZvclRyYWNrQnkoKTogVHJhY2tCeUZ1bmN0aW9uPFQ+IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fY2RrVmlydHVhbEZvclRyYWNrQnk7XG4gIH1cbiAgc2V0IGNka1ZpcnR1YWxGb3JUcmFja0J5KGZuOiBUcmFja0J5RnVuY3Rpb248VD4gfCB1bmRlZmluZWQpIHtcbiAgICB0aGlzLl9uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgdGhpcy5fY2RrVmlydHVhbEZvclRyYWNrQnkgPSBmbiA/XG4gICAgICAgIChpbmRleCwgaXRlbSkgPT4gZm4oaW5kZXggKyAodGhpcy5fcmVuZGVyZWRSYW5nZSA/IHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQgOiAwKSwgaXRlbSkgOlxuICAgICAgICB1bmRlZmluZWQ7XG4gIH1cbiAgcHJpdmF0ZSBfY2RrVmlydHVhbEZvclRyYWNrQnk6IFRyYWNrQnlGdW5jdGlvbjxUPiB8IHVuZGVmaW5lZDtcblxuICAvKiogVGhlIHRlbXBsYXRlIHVzZWQgdG8gc3RhbXAgb3V0IG5ldyBlbGVtZW50cy4gKi9cbiAgQElucHV0KClcbiAgc2V0IGNka1ZpcnR1YWxGb3JUZW1wbGF0ZSh2YWx1ZTogVGVtcGxhdGVSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj4pIHtcbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIHRoaXMuX25lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICAgIHRoaXMuX3RlbXBsYXRlID0gdmFsdWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBzaXplIG9mIHRoZSBjYWNoZSB1c2VkIHRvIHN0b3JlIHRlbXBsYXRlcyB0aGF0IGFyZSBub3QgYmVpbmcgdXNlZCBmb3IgcmUtdXNlIGxhdGVyLlxuICAgKiBTZXR0aW5nIHRoZSBjYWNoZSBzaXplIHRvIGAwYCB3aWxsIGRpc2FibGUgY2FjaGluZy4gRGVmYXVsdHMgdG8gMjAgdGVtcGxhdGVzLlxuICAgKi9cbiAgQElucHV0KCkgY2RrVmlydHVhbEZvclRlbXBsYXRlQ2FjaGVTaXplOiBudW1iZXIgPSAyMDtcblxuICAvKiogRW1pdHMgd2hlbmV2ZXIgdGhlIGRhdGEgaW4gdGhlIGN1cnJlbnQgRGF0YVNvdXJjZSBjaGFuZ2VzLiAqL1xuICBkYXRhU3RyZWFtOiBPYnNlcnZhYmxlPFRbXSB8IFJlYWRvbmx5QXJyYXk8VD4+ID0gdGhpcy5fZGF0YVNvdXJjZUNoYW5nZXNcbiAgICAgIC5waXBlKFxuICAgICAgICAgIC8vIFN0YXJ0IG9mZiB3aXRoIG51bGwgYERhdGFTb3VyY2VgLlxuICAgICAgICAgIHN0YXJ0V2l0aChudWxsISksXG4gICAgICAgICAgLy8gQnVuZGxlIHVwIHRoZSBwcmV2aW91cyBhbmQgY3VycmVudCBkYXRhIHNvdXJjZXMgc28gd2UgY2FuIHdvcmsgd2l0aCBib3RoLlxuICAgICAgICAgIHBhaXJ3aXNlKCksXG4gICAgICAgICAgLy8gVXNlIGBfY2hhbmdlRGF0YVNvdXJjZWAgdG8gZGlzY29ubmVjdCBmcm9tIHRoZSBwcmV2aW91cyBkYXRhIHNvdXJjZSBhbmQgY29ubmVjdCB0byB0aGVcbiAgICAgICAgICAvLyBuZXcgb25lLCBwYXNzaW5nIGJhY2sgYSBzdHJlYW0gb2YgZGF0YSBjaGFuZ2VzIHdoaWNoIHdlIHJ1biB0aHJvdWdoIGBzd2l0Y2hNYXBgIHRvIGdpdmVcbiAgICAgICAgICAvLyB1cyBhIGRhdGEgc3RyZWFtIHRoYXQgZW1pdHMgdGhlIGxhdGVzdCBkYXRhIGZyb20gd2hhdGV2ZXIgdGhlIGN1cnJlbnQgYERhdGFTb3VyY2VgIGlzLlxuICAgICAgICAgIHN3aXRjaE1hcCgoW3ByZXYsIGN1cl0pID0+IHRoaXMuX2NoYW5nZURhdGFTb3VyY2UocHJldiwgY3VyKSksXG4gICAgICAgICAgLy8gUmVwbGF5IHRoZSBsYXN0IGVtaXR0ZWQgZGF0YSB3aGVuIHNvbWVvbmUgc3Vic2NyaWJlcy5cbiAgICAgICAgICBzaGFyZVJlcGxheSgxKSk7XG5cbiAgLyoqIFRoZSBkaWZmZXIgdXNlZCB0byBjYWxjdWxhdGUgY2hhbmdlcyB0byB0aGUgZGF0YS4gKi9cbiAgcHJpdmF0ZSBfZGlmZmVyOiBJdGVyYWJsZURpZmZlcjxUPiB8IG51bGwgPSBudWxsO1xuXG4gIC8qKiBUaGUgbW9zdCByZWNlbnQgZGF0YSBlbWl0dGVkIGZyb20gdGhlIERhdGFTb3VyY2UuICovXG4gIHByaXZhdGUgX2RhdGE6IFRbXSB8IFJlYWRvbmx5QXJyYXk8VD47XG5cbiAgLyoqIFRoZSBjdXJyZW50bHkgcmVuZGVyZWQgaXRlbXMuICovXG4gIHByaXZhdGUgX3JlbmRlcmVkSXRlbXM6IFRbXTtcblxuICAvKiogVGhlIGN1cnJlbnRseSByZW5kZXJlZCByYW5nZSBvZiBpbmRpY2VzLiAqL1xuICBwcml2YXRlIF9yZW5kZXJlZFJhbmdlOiBMaXN0UmFuZ2U7XG5cbiAgLyoqXG4gICAqIFRoZSB0ZW1wbGF0ZSBjYWNoZSB1c2VkIHRvIGhvbGQgb24gb3QgdGVtcGxhdGUgaW5zdGFuY2VzcyB0aGF0IGhhdmUgYmVlbiBzdGFtcGVkIG91dCwgYnV0IGRvbid0XG4gICAqIGN1cnJlbnRseSBuZWVkIHRvIGJlIHJlbmRlcmVkLiBUaGVzZSBpbnN0YW5jZXMgd2lsbCBiZSByZXVzZWQgaW4gdGhlIGZ1dHVyZSByYXRoZXIgdGhhblxuICAgKiBzdGFtcGluZyBvdXQgYnJhbmQgbmV3IG9uZXMuXG4gICAqL1xuICBwcml2YXRlIF90ZW1wbGF0ZUNhY2hlOiBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj5bXSA9IFtdO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSByZW5kZXJlZCBkYXRhIHNob3VsZCBiZSB1cGRhdGVkIGR1cmluZyB0aGUgbmV4dCBuZ0RvQ2hlY2sgY3ljbGUuICovXG4gIHByaXZhdGUgX25lZWRzVXBkYXRlID0gZmFsc2U7XG5cbiAgcHJpdmF0ZSBfZGVzdHJveWVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKiBUaGUgdmlldyBjb250YWluZXIgdG8gYWRkIGl0ZW1zIHRvLiAqL1xuICAgICAgcHJpdmF0ZSBfdmlld0NvbnRhaW5lclJlZjogVmlld0NvbnRhaW5lclJlZixcbiAgICAgIC8qKiBUaGUgdGVtcGxhdGUgdG8gdXNlIHdoZW4gc3RhbXBpbmcgb3V0IG5ldyBpdGVtcy4gKi9cbiAgICAgIHByaXZhdGUgX3RlbXBsYXRlOiBUZW1wbGF0ZVJlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PixcbiAgICAgIC8qKiBUaGUgc2V0IG9mIGF2YWlsYWJsZSBkaWZmZXJzLiAqL1xuICAgICAgcHJpdmF0ZSBfZGlmZmVyczogSXRlcmFibGVEaWZmZXJzLFxuICAgICAgLyoqIFRoZSB2aXJ0dWFsIHNjcm9sbGluZyB2aWV3cG9ydCB0aGF0IHRoZXNlIGl0ZW1zIGFyZSBiZWluZyByZW5kZXJlZCBpbi4gKi9cbiAgICAgIEBTa2lwU2VsZigpIHByaXZhdGUgX3ZpZXdwb3J0OiBDZGtWaXJ0dWFsU2Nyb2xsVmlld3BvcnQsXG4gICAgICBuZ1pvbmU6IE5nWm9uZSkge1xuICAgIHRoaXMuZGF0YVN0cmVhbS5zdWJzY3JpYmUoZGF0YSA9PiB7XG4gICAgICB0aGlzLl9kYXRhID0gZGF0YTtcbiAgICAgIHRoaXMuX29uUmVuZGVyZWREYXRhQ2hhbmdlKCk7XG4gICAgfSk7XG4gICAgdGhpcy5fdmlld3BvcnQucmVuZGVyZWRSYW5nZVN0cmVhbS5waXBlKHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpKS5zdWJzY3JpYmUocmFuZ2UgPT4ge1xuICAgICAgdGhpcy5fcmVuZGVyZWRSYW5nZSA9IHJhbmdlO1xuICAgICAgbmdab25lLnJ1bigoKSA9PiB0aGlzLnZpZXdDaGFuZ2UubmV4dCh0aGlzLl9yZW5kZXJlZFJhbmdlKSk7XG4gICAgICB0aGlzLl9vblJlbmRlcmVkRGF0YUNoYW5nZSgpO1xuICAgIH0pO1xuICAgIHRoaXMuX3ZpZXdwb3J0LmF0dGFjaCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNZWFzdXJlcyB0aGUgY29tYmluZWQgc2l6ZSAod2lkdGggZm9yIGhvcml6b250YWwgb3JpZW50YXRpb24sIGhlaWdodCBmb3IgdmVydGljYWwpIG9mIGFsbCBpdGVtc1xuICAgKiBpbiB0aGUgc3BlY2lmaWVkIHJhbmdlLiBUaHJvd3MgYW4gZXJyb3IgaWYgdGhlIHJhbmdlIGluY2x1ZGVzIGl0ZW1zIHRoYXQgYXJlIG5vdCBjdXJyZW50bHlcbiAgICogcmVuZGVyZWQuXG4gICAqL1xuICBtZWFzdXJlUmFuZ2VTaXplKHJhbmdlOiBMaXN0UmFuZ2UsIG9yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcgfCAndmVydGljYWwnKTogbnVtYmVyIHtcbiAgICBpZiAocmFuZ2Uuc3RhcnQgPj0gcmFuZ2UuZW5kKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgaWYgKHJhbmdlLnN0YXJ0IDwgdGhpcy5fcmVuZGVyZWRSYW5nZS5zdGFydCB8fCByYW5nZS5lbmQgPiB0aGlzLl9yZW5kZXJlZFJhbmdlLmVuZCkge1xuICAgICAgdGhyb3cgRXJyb3IoYEVycm9yOiBhdHRlbXB0ZWQgdG8gbWVhc3VyZSBhbiBpdGVtIHRoYXQgaXNuJ3QgcmVuZGVyZWQuYCk7XG4gICAgfVxuXG4gICAgLy8gVGhlIGluZGV4IGludG8gdGhlIGxpc3Qgb2YgcmVuZGVyZWQgdmlld3MgZm9yIHRoZSBmaXJzdCBpdGVtIGluIHRoZSByYW5nZS5cbiAgICBjb25zdCByZW5kZXJlZFN0YXJ0SW5kZXggPSByYW5nZS5zdGFydCAtIHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQ7XG4gICAgLy8gVGhlIGxlbmd0aCBvZiB0aGUgcmFuZ2Ugd2UncmUgbWVhc3VyaW5nLlxuICAgIGNvbnN0IHJhbmdlTGVuID0gcmFuZ2UuZW5kIC0gcmFuZ2Uuc3RhcnQ7XG5cbiAgICAvLyBMb29wIG92ZXIgYWxsIHJvb3Qgbm9kZXMgZm9yIGFsbCBpdGVtcyBpbiB0aGUgcmFuZ2UgYW5kIHN1bSB1cCB0aGVpciBzaXplLlxuICAgIGxldCB0b3RhbFNpemUgPSAwO1xuICAgIGxldCBpID0gcmFuZ2VMZW47XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgY29uc3QgdmlldyA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuZ2V0KGkgKyByZW5kZXJlZFN0YXJ0SW5kZXgpIGFzXG4gICAgICAgICAgRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+IHwgbnVsbDtcbiAgICAgIGxldCBqID0gdmlldyA/IHZpZXcucm9vdE5vZGVzLmxlbmd0aCA6IDA7XG4gICAgICB3aGlsZSAoai0tKSB7XG4gICAgICAgIHRvdGFsU2l6ZSArPSBnZXRTaXplKG9yaWVudGF0aW9uLCB2aWV3IS5yb290Tm9kZXNbal0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0b3RhbFNpemU7XG4gIH1cblxuICBuZ0RvQ2hlY2soKSB7XG4gICAgaWYgKHRoaXMuX2RpZmZlciAmJiB0aGlzLl9uZWVkc1VwZGF0ZSkge1xuICAgICAgLy8gVE9ETyhtbWFsZXJiYSk6IFdlIHNob3VsZCBkaWZmZXJlbnRpYXRlIG5lZWRzIHVwZGF0ZSBkdWUgdG8gc2Nyb2xsaW5nIGFuZCBhIG5ldyBwb3J0aW9uIG9mXG4gICAgICAvLyB0aGlzIGxpc3QgYmVpbmcgcmVuZGVyZWQgKGNhbiB1c2Ugc2ltcGxlciBhbGdvcml0aG0pIHZzIG5lZWRzIHVwZGF0ZSBkdWUgdG8gZGF0YSBhY3R1YWxseVxuICAgICAgLy8gY2hhbmdpbmcgKG5lZWQgdG8gZG8gdGhpcyBkaWZmKS5cbiAgICAgIGNvbnN0IGNoYW5nZXMgPSB0aGlzLl9kaWZmZXIuZGlmZih0aGlzLl9yZW5kZXJlZEl0ZW1zKTtcbiAgICAgIGlmICghY2hhbmdlcykge1xuICAgICAgICB0aGlzLl91cGRhdGVDb250ZXh0KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9hcHBseUNoYW5nZXMoY2hhbmdlcyk7XG4gICAgICB9XG4gICAgICB0aGlzLl9uZWVkc1VwZGF0ZSA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX3ZpZXdwb3J0LmRldGFjaCgpO1xuXG4gICAgdGhpcy5fZGF0YVNvdXJjZUNoYW5nZXMubmV4dCgpO1xuICAgIHRoaXMuX2RhdGFTb3VyY2VDaGFuZ2VzLmNvbXBsZXRlKCk7XG4gICAgdGhpcy52aWV3Q2hhbmdlLmNvbXBsZXRlKCk7XG5cbiAgICB0aGlzLl9kZXN0cm95ZWQubmV4dCgpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5jb21wbGV0ZSgpO1xuXG4gICAgZm9yIChsZXQgdmlldyBvZiB0aGlzLl90ZW1wbGF0ZUNhY2hlKSB7XG4gICAgICB2aWV3LmRlc3Ryb3koKTtcbiAgICB9XG4gIH1cblxuICAvKiogUmVhY3QgdG8gc2Nyb2xsIHN0YXRlIGNoYW5nZXMgaW4gdGhlIHZpZXdwb3J0LiAqL1xuICBwcml2YXRlIF9vblJlbmRlcmVkRGF0YUNoYW5nZSgpIHtcbiAgICBpZiAoIXRoaXMuX3JlbmRlcmVkUmFuZ2UpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fcmVuZGVyZWRJdGVtcyA9IHRoaXMuX2RhdGEuc2xpY2UodGhpcy5fcmVuZGVyZWRSYW5nZS5zdGFydCwgdGhpcy5fcmVuZGVyZWRSYW5nZS5lbmQpO1xuICAgIGlmICghdGhpcy5fZGlmZmVyKSB7XG4gICAgICB0aGlzLl9kaWZmZXIgPSB0aGlzLl9kaWZmZXJzLmZpbmQodGhpcy5fcmVuZGVyZWRJdGVtcykuY3JlYXRlKHRoaXMuY2RrVmlydHVhbEZvclRyYWNrQnkpO1xuICAgIH1cbiAgICB0aGlzLl9uZWVkc1VwZGF0ZSA9IHRydWU7XG4gIH1cblxuICAvKiogU3dhcCBvdXQgb25lIGBEYXRhU291cmNlYCBmb3IgYW5vdGhlci4gKi9cbiAgcHJpdmF0ZSBfY2hhbmdlRGF0YVNvdXJjZShvbGREczogRGF0YVNvdXJjZTxUPiB8IG51bGwsIG5ld0RzOiBEYXRhU291cmNlPFQ+IHwgbnVsbCk6XG4gICAgT2JzZXJ2YWJsZTxUW10gfCBSZWFkb25seUFycmF5PFQ+PiB7XG5cbiAgICBpZiAob2xkRHMpIHtcbiAgICAgIG9sZERzLmRpc2Nvbm5lY3QodGhpcyk7XG4gICAgfVxuXG4gICAgdGhpcy5fbmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgIHJldHVybiBuZXdEcyA/IG5ld0RzLmNvbm5lY3QodGhpcykgOiBvYnNlcnZhYmxlT2YoKTtcbiAgfVxuXG4gIC8qKiBVcGRhdGUgdGhlIGBDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0YCBmb3IgYWxsIHZpZXdzLiAqL1xuICBwcml2YXRlIF91cGRhdGVDb250ZXh0KCkge1xuICAgIGNvbnN0IGNvdW50ID0gdGhpcy5fZGF0YS5sZW5ndGg7XG4gICAgbGV0IGkgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICBsZXQgdmlldyA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuZ2V0KGkpIGFzIEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PjtcbiAgICAgIHZpZXcuY29udGV4dC5pbmRleCA9IHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQgKyBpO1xuICAgICAgdmlldy5jb250ZXh0LmNvdW50ID0gY291bnQ7XG4gICAgICB0aGlzLl91cGRhdGVDb21wdXRlZENvbnRleHRQcm9wZXJ0aWVzKHZpZXcuY29udGV4dCk7XG4gICAgICB2aWV3LmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gIH1cblxuICAvKiogQXBwbHkgY2hhbmdlcyB0byB0aGUgRE9NLiAqL1xuICBwcml2YXRlIF9hcHBseUNoYW5nZXMoY2hhbmdlczogSXRlcmFibGVDaGFuZ2VzPFQ+KSB7XG4gICAgLy8gUmVhcnJhbmdlIHRoZSB2aWV3cyB0byBwdXQgdGhlbSBpbiB0aGUgcmlnaHQgbG9jYXRpb24uXG4gICAgY2hhbmdlcy5mb3JFYWNoT3BlcmF0aW9uKChyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFQ+LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRqdXN0ZWRQcmV2aW91c0luZGV4OiBudW1iZXIgfCBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudEluZGV4OiBudW1iZXIgfCBudWxsKSA9PiB7XG4gICAgICBpZiAocmVjb3JkLnByZXZpb3VzSW5kZXggPT0gbnVsbCkgeyAgLy8gSXRlbSBhZGRlZC5cbiAgICAgICAgY29uc3QgdmlldyA9IHRoaXMuX2luc2VydFZpZXdGb3JOZXdJdGVtKGN1cnJlbnRJbmRleCEpO1xuICAgICAgICB2aWV3LmNvbnRleHQuJGltcGxpY2l0ID0gcmVjb3JkLml0ZW07XG4gICAgICB9IGVsc2UgaWYgKGN1cnJlbnRJbmRleCA9PSBudWxsKSB7ICAvLyBJdGVtIHJlbW92ZWQuXG4gICAgICAgIHRoaXMuX2NhY2hlVmlldyh0aGlzLl9kZXRhY2hWaWV3KGFkanVzdGVkUHJldmlvdXNJbmRleCAhKSk7XG4gICAgICB9IGVsc2UgeyAgLy8gSXRlbSBtb3ZlZC5cbiAgICAgICAgY29uc3QgdmlldyA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuZ2V0KGFkanVzdGVkUHJldmlvdXNJbmRleCEpIGFzXG4gICAgICAgICAgICBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj47XG4gICAgICAgIHRoaXMuX3ZpZXdDb250YWluZXJSZWYubW92ZSh2aWV3LCBjdXJyZW50SW5kZXgpO1xuICAgICAgICB2aWV3LmNvbnRleHQuJGltcGxpY2l0ID0gcmVjb3JkLml0ZW07XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBVcGRhdGUgJGltcGxpY2l0IGZvciBhbnkgaXRlbXMgdGhhdCBoYWQgYW4gaWRlbnRpdHkgY2hhbmdlLlxuICAgIGNoYW5nZXMuZm9yRWFjaElkZW50aXR5Q2hhbmdlKChyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFQ+KSA9PiB7XG4gICAgICBjb25zdCB2aWV3ID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5nZXQocmVjb3JkLmN1cnJlbnRJbmRleCEpIGFzXG4gICAgICAgICAgRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+O1xuICAgICAgdmlldy5jb250ZXh0LiRpbXBsaWNpdCA9IHJlY29yZC5pdGVtO1xuICAgIH0pO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBjb250ZXh0IHZhcmlhYmxlcyBvbiBhbGwgaXRlbXMuXG4gICAgY29uc3QgY291bnQgPSB0aGlzLl9kYXRhLmxlbmd0aDtcbiAgICBsZXQgaSA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmdldChpKSBhcyBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj47XG4gICAgICB2aWV3LmNvbnRleHQuaW5kZXggPSB0aGlzLl9yZW5kZXJlZFJhbmdlLnN0YXJ0ICsgaTtcbiAgICAgIHZpZXcuY29udGV4dC5jb3VudCA9IGNvdW50O1xuICAgICAgdGhpcy5fdXBkYXRlQ29tcHV0ZWRDb250ZXh0UHJvcGVydGllcyh2aWV3LmNvbnRleHQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDYWNoZSB0aGUgZ2l2ZW4gZGV0YWNoZWQgdmlldy4gKi9cbiAgcHJpdmF0ZSBfY2FjaGVWaWV3KHZpZXc6IEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+Pikge1xuICAgIGlmICh0aGlzLl90ZW1wbGF0ZUNhY2hlLmxlbmd0aCA8IHRoaXMuY2RrVmlydHVhbEZvclRlbXBsYXRlQ2FjaGVTaXplKSB7XG4gICAgICB0aGlzLl90ZW1wbGF0ZUNhY2hlLnB1c2godmlldyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5pbmRleE9mKHZpZXcpO1xuXG4gICAgICAvLyBJdCdzIHZlcnkgdW5saWtlbHkgdGhhdCB0aGUgaW5kZXggd2lsbCBldmVyIGJlIC0xLCBidXQganVzdCBpbiBjYXNlLFxuICAgICAgLy8gZGVzdHJveSB0aGUgdmlldyBvbiBpdHMgb3duLCBvdGhlcndpc2UgZGVzdHJveSBpdCB0aHJvdWdoIHRoZVxuICAgICAgLy8gY29udGFpbmVyIHRvIGVuc3VyZSB0aGF0IGFsbCB0aGUgcmVmZXJlbmNlcyBhcmUgcmVtb3ZlZC5cbiAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgdmlldy5kZXN0cm95KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl92aWV3Q29udGFpbmVyUmVmLnJlbW92ZShpbmRleCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIEluc2VydHMgYSB2aWV3IGZvciBhIG5ldyBpdGVtLCBlaXRoZXIgZnJvbSB0aGUgY2FjaGUgb3IgYnkgY3JlYXRpbmcgYSBuZXcgb25lLiAqL1xuICBwcml2YXRlIF9pbnNlcnRWaWV3Rm9yTmV3SXRlbShpbmRleDogbnVtYmVyKTogRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+IHtcbiAgICByZXR1cm4gdGhpcy5faW5zZXJ0Vmlld0Zyb21DYWNoZShpbmRleCkgfHwgdGhpcy5fY3JlYXRlRW1iZWRkZWRWaWV3QXQoaW5kZXgpO1xuICB9XG5cbiAgLyoqIFVwZGF0ZSB0aGUgY29tcHV0ZWQgcHJvcGVydGllcyBvbiB0aGUgYENka1ZpcnR1YWxGb3JPZkNvbnRleHRgLiAqL1xuICBwcml2YXRlIF91cGRhdGVDb21wdXRlZENvbnRleHRQcm9wZXJ0aWVzKGNvbnRleHQ6IENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8YW55Pikge1xuICAgIGNvbnRleHQuZmlyc3QgPSBjb250ZXh0LmluZGV4ID09PSAwO1xuICAgIGNvbnRleHQubGFzdCA9IGNvbnRleHQuaW5kZXggPT09IGNvbnRleHQuY291bnQgLSAxO1xuICAgIGNvbnRleHQuZXZlbiA9IGNvbnRleHQuaW5kZXggJSAyID09PSAwO1xuICAgIGNvbnRleHQub2RkID0gIWNvbnRleHQuZXZlbjtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbmV3IGVtYmVkZGVkIHZpZXcgYW5kIG1vdmVzIGl0IHRvIHRoZSBnaXZlbiBpbmRleCAqL1xuICBwcml2YXRlIF9jcmVhdGVFbWJlZGRlZFZpZXdBdChpbmRleDogbnVtYmVyKTogRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+IHtcbiAgICAvLyBOb3RlIHRoYXQgaXQncyBpbXBvcnRhbnQgdGhhdCB3ZSBpbnNlcnQgdGhlIGl0ZW0gZGlyZWN0bHkgYXQgdGhlIHByb3BlciBpbmRleCxcbiAgICAvLyByYXRoZXIgdGhhbiBpbnNlcnRpbmcgaXQgYW5kIHRoZSBtb3ZpbmcgaXQgaW4gcGxhY2UsIGJlY2F1c2UgaWYgdGhlcmUncyBhIGRpcmVjdGl2ZVxuICAgIC8vIG9uIHRoZSBzYW1lIG5vZGUgdGhhdCBpbmplY3RzIHRoZSBgVmlld0NvbnRhaW5lclJlZmAsIEFuZ3VsYXIgd2lsbCBpbnNlcnQgYW5vdGhlclxuICAgIC8vIGNvbW1lbnQgbm9kZSB3aGljaCBjYW4gdGhyb3cgb2ZmIHRoZSBtb3ZlIHdoZW4gaXQncyBiZWluZyByZXBlYXRlZCBmb3IgYWxsIGl0ZW1zLlxuICAgIHJldHVybiB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmNyZWF0ZUVtYmVkZGVkVmlldyh0aGlzLl90ZW1wbGF0ZSwge1xuICAgICAgJGltcGxpY2l0OiBudWxsISxcbiAgICAgIC8vIEl0J3MgZ3VhcmFudGVlZCB0aGF0IHRoZSBpdGVyYWJsZSBpcyBub3QgXCJ1bmRlZmluZWRcIiBvciBcIm51bGxcIiBiZWNhdXNlIHdlIG9ubHlcbiAgICAgIC8vIGdlbmVyYXRlIHZpZXdzIGZvciBlbGVtZW50cyBpZiB0aGUgXCJjZGtWaXJ0dWFsRm9yT2ZcIiBpdGVyYWJsZSBoYXMgZWxlbWVudHMuXG4gICAgICBjZGtWaXJ0dWFsRm9yT2Y6IHRoaXMuX2Nka1ZpcnR1YWxGb3JPZiEsXG4gICAgICBpbmRleDogLTEsXG4gICAgICBjb3VudDogLTEsXG4gICAgICBmaXJzdDogZmFsc2UsXG4gICAgICBsYXN0OiBmYWxzZSxcbiAgICAgIG9kZDogZmFsc2UsXG4gICAgICBldmVuOiBmYWxzZVxuICAgIH0sIGluZGV4KTtcbiAgfVxuXG4gIC8qKiBJbnNlcnRzIGEgcmVjeWNsZWQgdmlldyBmcm9tIHRoZSBjYWNoZSBhdCB0aGUgZ2l2ZW4gaW5kZXguICovXG4gIHByaXZhdGUgX2luc2VydFZpZXdGcm9tQ2FjaGUoaW5kZXg6IG51bWJlcik6IEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PnxudWxsIHtcbiAgICBjb25zdCBjYWNoZWRWaWV3ID0gdGhpcy5fdGVtcGxhdGVDYWNoZS5wb3AoKTtcbiAgICBpZiAoY2FjaGVkVmlldykge1xuICAgICAgdGhpcy5fdmlld0NvbnRhaW5lclJlZi5pbnNlcnQoY2FjaGVkVmlldywgaW5kZXgpO1xuICAgIH1cbiAgICByZXR1cm4gY2FjaGVkVmlldyB8fCBudWxsO1xuICB9XG5cbiAgLyoqIERldGFjaGVzIHRoZSBlbWJlZGRlZCB2aWV3IGF0IHRoZSBnaXZlbiBpbmRleC4gKi9cbiAgcHJpdmF0ZSBfZGV0YWNoVmlldyhpbmRleDogbnVtYmVyKTogRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+IHtcbiAgICByZXR1cm4gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5kZXRhY2goaW5kZXgpIGFzXG4gICAgICAgIEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PjtcbiAgfVxufVxuIl19