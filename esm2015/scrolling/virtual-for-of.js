/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/scrolling/virtual-for-of.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
import { Subject, of as observableOf, isObservable } from 'rxjs';
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
let CdkVirtualForOf = /** @class */ (() => {
    /**
     * A directive similar to `ngForOf` to be used for rendering data inside a virtual scrolling
     * container.
     * @template T
     */
    class CdkVirtualForOf {
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
            if (isDataSource(value)) {
                this._dataSourceChanges.next(value);
            }
            else {
                // Slice the value if its an NgIterable to ensure we're working with an array.
                this._dataSourceChanges.next(new ArrayDataSource(isObservable(value) ? value : Array.prototype.slice.call(value || [])));
            }
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
    return CdkVirtualForOf;
})();
export { CdkVirtualForOf };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1mb3Itb2YuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy92aXJ0dWFsLWZvci1vZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQ0wsZUFBZSxFQUlmLFlBQVksR0FDYixNQUFNLDBCQUEwQixDQUFDO0FBQ2xDLE9BQU8sRUFDTCxTQUFTLEVBR1QsS0FBSyxFQUlMLGVBQWUsRUFFZixNQUFNLEVBRU4sUUFBUSxFQUNSLFdBQVcsRUFFWCxnQkFBZ0IsR0FDakIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFhLE9BQU8sRUFBRSxFQUFFLElBQUksWUFBWSxFQUFFLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUMzRSxPQUFPLEVBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3RGLE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLDJCQUEyQixDQUFDOzs7Ozs7O0FBeUJuRSxTQUFTLE9BQU8sQ0FBQyxXQUFzQyxFQUFFLElBQVU7O1VBQzNELEVBQUUsR0FBRyxtQkFBQSxJQUFJLEVBQVc7SUFDMUIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsRUFBRTtRQUM3QixPQUFPLENBQUMsQ0FBQztLQUNWOztVQUNLLElBQUksR0FBRyxFQUFFLENBQUMscUJBQXFCLEVBQUU7SUFDdkMsT0FBTyxXQUFXLElBQUksWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQ2hFLENBQUM7Ozs7OztBQU9EOzs7Ozs7SUFBQSxNQUdhLGVBQWU7Ozs7Ozs7O1FBNkYxQixZQUVZLGlCQUFtQyxFQUVuQyxTQUFpRCxFQUVqRCxRQUF5QixFQUViLFNBQW1DLEVBQ3ZELE1BQWM7WUFQ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Ozs7Ozs7UUFHTyxvQkFBb0IsQ0FBQyxLQUFhOztrQkFDbEMsVUFBVSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFO1lBQzVDLElBQUksVUFBVSxFQUFFO2dCQUNkLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQ2xEO1lBQ0QsT0FBTyxVQUFVLElBQUksSUFBSSxDQUFDO1FBQzVCLENBQUM7Ozs7Ozs7UUFHTyxXQUFXLENBQUMsS0FBYTtZQUMvQixPQUFPLG1CQUFBLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQ0csQ0FBQztRQUNqRCxDQUFDOzs7Z0JBL1RGLFNBQVMsU0FBQztvQkFDVCxRQUFRLEVBQUUsa0NBQWtDO2lCQUM3Qzs7OztnQkE3Q0MsZ0JBQWdCO2dCQUZoQixXQUFXO2dCQUxYLGVBQWU7Z0JBV1Qsd0JBQXdCLHVCQStJekIsUUFBUTtnQkF4SmIsTUFBTTs7O2tDQTJETCxLQUFLO3VDQW9CTCxLQUFLO3dDQWFMLEtBQUs7aURBWUwsS0FBSzs7SUF3UVIsc0JBQUM7S0FBQTtTQTdUWSxlQUFlOzs7Ozs7SUFFMUIscUNBQXNDOzs7Ozs7SUFHdEMsNkNBQTBEOztJQWlCMUQsMkNBQXFGOzs7OztJQWdCckYsZ0RBQThEOzs7Ozs7SUFlOUQseURBQXFEOzs7OztJQUdyRCxxQ0FXd0I7Ozs7OztJQUd4QixrQ0FBaUQ7Ozs7OztJQUdqRCxnQ0FBc0M7Ozs7OztJQUd0Qyx5Q0FBNEI7Ozs7OztJQUc1Qix5Q0FBa0M7Ozs7Ozs7O0lBT2xDLHlDQUEwRTs7Ozs7O0lBRzFFLHVDQUE2Qjs7Ozs7SUFFN0IscUNBQXlDOzs7Ozs7SUFJckMsNENBQTJDOzs7Ozs7SUFFM0Msb0NBQXlEOzs7Ozs7SUFFekQsbUNBQWlDOzs7Ozs7SUFFakMsb0NBQXVEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIEFycmF5RGF0YVNvdXJjZSxcbiAgQ29sbGVjdGlvblZpZXdlcixcbiAgRGF0YVNvdXJjZSxcbiAgTGlzdFJhbmdlLFxuICBpc0RhdGFTb3VyY2UsXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2xsZWN0aW9ucyc7XG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIERvQ2hlY2ssXG4gIEVtYmVkZGVkVmlld1JlZixcbiAgSW5wdXQsXG4gIEl0ZXJhYmxlQ2hhbmdlUmVjb3JkLFxuICBJdGVyYWJsZUNoYW5nZXMsXG4gIEl0ZXJhYmxlRGlmZmVyLFxuICBJdGVyYWJsZURpZmZlcnMsXG4gIE5nSXRlcmFibGUsXG4gIE5nWm9uZSxcbiAgT25EZXN0cm95LFxuICBTa2lwU2VsZixcbiAgVGVtcGxhdGVSZWYsXG4gIFRyYWNrQnlGdW5jdGlvbixcbiAgVmlld0NvbnRhaW5lclJlZixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3QsIG9mIGFzIG9ic2VydmFibGVPZiwgaXNPYnNlcnZhYmxlfSBmcm9tICdyeGpzJztcbmltcG9ydCB7cGFpcndpc2UsIHNoYXJlUmVwbGF5LCBzdGFydFdpdGgsIHN3aXRjaE1hcCwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge0Nka1ZpcnR1YWxTY3JvbGxWaWV3cG9ydH0gZnJvbSAnLi92aXJ0dWFsLXNjcm9sbC12aWV3cG9ydCc7XG5cblxuLyoqIFRoZSBjb250ZXh0IGZvciBhbiBpdGVtIHJlbmRlcmVkIGJ5IGBDZGtWaXJ0dWFsRm9yT2ZgICovXG5leHBvcnQgdHlwZSBDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+ID0ge1xuICAvKiogVGhlIGl0ZW0gdmFsdWUuICovXG4gICRpbXBsaWNpdDogVDtcbiAgLyoqIFRoZSBEYXRhU291cmNlLCBPYnNlcnZhYmxlLCBvciBOZ0l0ZXJhYmxlIHRoYXQgd2FzIHBhc3NlZCB0byAqY2RrVmlydHVhbEZvci4gKi9cbiAgY2RrVmlydHVhbEZvck9mOiBEYXRhU291cmNlPFQ+IHwgT2JzZXJ2YWJsZTxUW10+IHwgTmdJdGVyYWJsZTxUPjtcbiAgLyoqIFRoZSBpbmRleCBvZiB0aGUgaXRlbSBpbiB0aGUgRGF0YVNvdXJjZS4gKi9cbiAgaW5kZXg6IG51bWJlcjtcbiAgLyoqIFRoZSBudW1iZXIgb2YgaXRlbXMgaW4gdGhlIERhdGFTb3VyY2UuICovXG4gIGNvdW50OiBudW1iZXI7XG4gIC8qKiBXaGV0aGVyIHRoaXMgaXMgdGhlIGZpcnN0IGl0ZW0gaW4gdGhlIERhdGFTb3VyY2UuICovXG4gIGZpcnN0OiBib29sZWFuO1xuICAvKiogV2hldGhlciB0aGlzIGlzIHRoZSBsYXN0IGl0ZW0gaW4gdGhlIERhdGFTb3VyY2UuICovXG4gIGxhc3Q6IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIHRoZSBpbmRleCBpcyBldmVuLiAqL1xuICBldmVuOiBib29sZWFuO1xuICAvKiogV2hldGhlciB0aGUgaW5kZXggaXMgb2RkLiAqL1xuICBvZGQ6IGJvb2xlYW47XG59O1xuXG5cbi8qKiBIZWxwZXIgdG8gZXh0cmFjdCBzaXplIGZyb20gYSBET00gTm9kZS4gKi9cbmZ1bmN0aW9uIGdldFNpemUob3JpZW50YXRpb246ICdob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCcsIG5vZGU6IE5vZGUpOiBudW1iZXIge1xuICBjb25zdCBlbCA9IG5vZGUgYXMgRWxlbWVudDtcbiAgaWYgKCFlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuICBjb25zdCByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIHJldHVybiBvcmllbnRhdGlvbiA9PSAnaG9yaXpvbnRhbCcgPyByZWN0LndpZHRoIDogcmVjdC5oZWlnaHQ7XG59XG5cblxuLyoqXG4gKiBBIGRpcmVjdGl2ZSBzaW1pbGFyIHRvIGBuZ0Zvck9mYCB0byBiZSB1c2VkIGZvciByZW5kZXJpbmcgZGF0YSBpbnNpZGUgYSB2aXJ0dWFsIHNjcm9sbGluZ1xuICogY29udGFpbmVyLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrVmlydHVhbEZvcl1bY2RrVmlydHVhbEZvck9mXScsXG59KVxuZXhwb3J0IGNsYXNzIENka1ZpcnR1YWxGb3JPZjxUPiBpbXBsZW1lbnRzIENvbGxlY3Rpb25WaWV3ZXIsIERvQ2hlY2ssIE9uRGVzdHJveSB7XG4gIC8qKiBFbWl0cyB3aGVuIHRoZSByZW5kZXJlZCB2aWV3IG9mIHRoZSBkYXRhIGNoYW5nZXMuICovXG4gIHZpZXdDaGFuZ2UgPSBuZXcgU3ViamVjdDxMaXN0UmFuZ2U+KCk7XG5cbiAgLyoqIFN1YmplY3QgdGhhdCBlbWl0cyB3aGVuIGEgbmV3IERhdGFTb3VyY2UgaW5zdGFuY2UgaXMgZ2l2ZW4uICovXG4gIHByaXZhdGUgX2RhdGFTb3VyY2VDaGFuZ2VzID0gbmV3IFN1YmplY3Q8RGF0YVNvdXJjZTxUPj4oKTtcblxuICAvKiogVGhlIERhdGFTb3VyY2UgdG8gZGlzcGxheS4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGNka1ZpcnR1YWxGb3JPZigpOiBEYXRhU291cmNlPFQ+IHwgT2JzZXJ2YWJsZTxUW10+IHwgTmdJdGVyYWJsZTxUPiB8IG51bGwgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9jZGtWaXJ0dWFsRm9yT2Y7XG4gIH1cbiAgc2V0IGNka1ZpcnR1YWxGb3JPZih2YWx1ZTogRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8VFtdPiB8IE5nSXRlcmFibGU8VD4gfCBudWxsIHwgdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5fY2RrVmlydHVhbEZvck9mID0gdmFsdWU7XG4gICAgaWYgKGlzRGF0YVNvdXJjZSh2YWx1ZSkpIHtcbiAgICAgIHRoaXMuX2RhdGFTb3VyY2VDaGFuZ2VzLm5leHQodmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBTbGljZSB0aGUgdmFsdWUgaWYgaXRzIGFuIE5nSXRlcmFibGUgdG8gZW5zdXJlIHdlJ3JlIHdvcmtpbmcgd2l0aCBhbiBhcnJheS5cbiAgICAgIHRoaXMuX2RhdGFTb3VyY2VDaGFuZ2VzLm5leHQobmV3IEFycmF5RGF0YVNvdXJjZTxUPihcbiAgICAgICAgICBpc09ic2VydmFibGUodmFsdWUpID8gdmFsdWUgOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh2YWx1ZSB8fCBbXSkpKTtcbiAgICB9XG4gIH1cbiAgX2Nka1ZpcnR1YWxGb3JPZjogRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8VFtdPiB8IE5nSXRlcmFibGU8VD4gfCBudWxsIHwgdW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBUaGUgYFRyYWNrQnlGdW5jdGlvbmAgdG8gdXNlIGZvciB0cmFja2luZyBjaGFuZ2VzLiBUaGUgYFRyYWNrQnlGdW5jdGlvbmAgdGFrZXMgdGhlIGluZGV4IGFuZFxuICAgKiB0aGUgaXRlbSBhbmQgcHJvZHVjZXMgYSB2YWx1ZSB0byBiZSB1c2VkIGFzIHRoZSBpdGVtJ3MgaWRlbnRpdHkgd2hlbiB0cmFja2luZyBjaGFuZ2VzLlxuICAgKi9cbiAgQElucHV0KClcbiAgZ2V0IGNka1ZpcnR1YWxGb3JUcmFja0J5KCk6IFRyYWNrQnlGdW5jdGlvbjxUPiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX2Nka1ZpcnR1YWxGb3JUcmFja0J5O1xuICB9XG4gIHNldCBjZGtWaXJ0dWFsRm9yVHJhY2tCeShmbjogVHJhY2tCeUZ1bmN0aW9uPFQ+IHwgdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5fbmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgIHRoaXMuX2Nka1ZpcnR1YWxGb3JUcmFja0J5ID0gZm4gP1xuICAgICAgICAoaW5kZXgsIGl0ZW0pID0+IGZuKGluZGV4ICsgKHRoaXMuX3JlbmRlcmVkUmFuZ2UgPyB0aGlzLl9yZW5kZXJlZFJhbmdlLnN0YXJ0IDogMCksIGl0ZW0pIDpcbiAgICAgICAgdW5kZWZpbmVkO1xuICB9XG4gIHByaXZhdGUgX2Nka1ZpcnR1YWxGb3JUcmFja0J5OiBUcmFja0J5RnVuY3Rpb248VD4gfCB1bmRlZmluZWQ7XG5cbiAgLyoqIFRoZSB0ZW1wbGF0ZSB1c2VkIHRvIHN0YW1wIG91dCBuZXcgZWxlbWVudHMuICovXG4gIEBJbnB1dCgpXG4gIHNldCBjZGtWaXJ0dWFsRm9yVGVtcGxhdGUodmFsdWU6IFRlbXBsYXRlUmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+KSB7XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICB0aGlzLl9uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgICB0aGlzLl90ZW1wbGF0ZSA9IHZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgc2l6ZSBvZiB0aGUgY2FjaGUgdXNlZCB0byBzdG9yZSB0ZW1wbGF0ZXMgdGhhdCBhcmUgbm90IGJlaW5nIHVzZWQgZm9yIHJlLXVzZSBsYXRlci5cbiAgICogU2V0dGluZyB0aGUgY2FjaGUgc2l6ZSB0byBgMGAgd2lsbCBkaXNhYmxlIGNhY2hpbmcuIERlZmF1bHRzIHRvIDIwIHRlbXBsYXRlcy5cbiAgICovXG4gIEBJbnB1dCgpIGNka1ZpcnR1YWxGb3JUZW1wbGF0ZUNhY2hlU2l6ZTogbnVtYmVyID0gMjA7XG5cbiAgLyoqIEVtaXRzIHdoZW5ldmVyIHRoZSBkYXRhIGluIHRoZSBjdXJyZW50IERhdGFTb3VyY2UgY2hhbmdlcy4gKi9cbiAgZGF0YVN0cmVhbTogT2JzZXJ2YWJsZTxUW10gfCBSZWFkb25seUFycmF5PFQ+PiA9IHRoaXMuX2RhdGFTb3VyY2VDaGFuZ2VzXG4gICAgICAucGlwZShcbiAgICAgICAgICAvLyBTdGFydCBvZmYgd2l0aCBudWxsIGBEYXRhU291cmNlYC5cbiAgICAgICAgICBzdGFydFdpdGgobnVsbCEpLFxuICAgICAgICAgIC8vIEJ1bmRsZSB1cCB0aGUgcHJldmlvdXMgYW5kIGN1cnJlbnQgZGF0YSBzb3VyY2VzIHNvIHdlIGNhbiB3b3JrIHdpdGggYm90aC5cbiAgICAgICAgICBwYWlyd2lzZSgpLFxuICAgICAgICAgIC8vIFVzZSBgX2NoYW5nZURhdGFTb3VyY2VgIHRvIGRpc2Nvbm5lY3QgZnJvbSB0aGUgcHJldmlvdXMgZGF0YSBzb3VyY2UgYW5kIGNvbm5lY3QgdG8gdGhlXG4gICAgICAgICAgLy8gbmV3IG9uZSwgcGFzc2luZyBiYWNrIGEgc3RyZWFtIG9mIGRhdGEgY2hhbmdlcyB3aGljaCB3ZSBydW4gdGhyb3VnaCBgc3dpdGNoTWFwYCB0byBnaXZlXG4gICAgICAgICAgLy8gdXMgYSBkYXRhIHN0cmVhbSB0aGF0IGVtaXRzIHRoZSBsYXRlc3QgZGF0YSBmcm9tIHdoYXRldmVyIHRoZSBjdXJyZW50IGBEYXRhU291cmNlYCBpcy5cbiAgICAgICAgICBzd2l0Y2hNYXAoKFtwcmV2LCBjdXJdKSA9PiB0aGlzLl9jaGFuZ2VEYXRhU291cmNlKHByZXYsIGN1cikpLFxuICAgICAgICAgIC8vIFJlcGxheSB0aGUgbGFzdCBlbWl0dGVkIGRhdGEgd2hlbiBzb21lb25lIHN1YnNjcmliZXMuXG4gICAgICAgICAgc2hhcmVSZXBsYXkoMSkpO1xuXG4gIC8qKiBUaGUgZGlmZmVyIHVzZWQgdG8gY2FsY3VsYXRlIGNoYW5nZXMgdG8gdGhlIGRhdGEuICovXG4gIHByaXZhdGUgX2RpZmZlcjogSXRlcmFibGVEaWZmZXI8VD4gfCBudWxsID0gbnVsbDtcblxuICAvKiogVGhlIG1vc3QgcmVjZW50IGRhdGEgZW1pdHRlZCBmcm9tIHRoZSBEYXRhU291cmNlLiAqL1xuICBwcml2YXRlIF9kYXRhOiBUW10gfCBSZWFkb25seUFycmF5PFQ+O1xuXG4gIC8qKiBUaGUgY3VycmVudGx5IHJlbmRlcmVkIGl0ZW1zLiAqL1xuICBwcml2YXRlIF9yZW5kZXJlZEl0ZW1zOiBUW107XG5cbiAgLyoqIFRoZSBjdXJyZW50bHkgcmVuZGVyZWQgcmFuZ2Ugb2YgaW5kaWNlcy4gKi9cbiAgcHJpdmF0ZSBfcmVuZGVyZWRSYW5nZTogTGlzdFJhbmdlO1xuXG4gIC8qKlxuICAgKiBUaGUgdGVtcGxhdGUgY2FjaGUgdXNlZCB0byBob2xkIG9uIG90IHRlbXBsYXRlIGluc3RhbmNlc3MgdGhhdCBoYXZlIGJlZW4gc3RhbXBlZCBvdXQsIGJ1dCBkb24ndFxuICAgKiBjdXJyZW50bHkgbmVlZCB0byBiZSByZW5kZXJlZC4gVGhlc2UgaW5zdGFuY2VzIHdpbGwgYmUgcmV1c2VkIGluIHRoZSBmdXR1cmUgcmF0aGVyIHRoYW5cbiAgICogc3RhbXBpbmcgb3V0IGJyYW5kIG5ldyBvbmVzLlxuICAgKi9cbiAgcHJpdmF0ZSBfdGVtcGxhdGVDYWNoZTogRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+W10gPSBbXTtcblxuICAvKiogV2hldGhlciB0aGUgcmVuZGVyZWQgZGF0YSBzaG91bGQgYmUgdXBkYXRlZCBkdXJpbmcgdGhlIG5leHQgbmdEb0NoZWNrIGN5Y2xlLiAqL1xuICBwcml2YXRlIF9uZWVkc1VwZGF0ZSA9IGZhbHNlO1xuXG4gIHByaXZhdGUgX2Rlc3Ryb3llZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICAvKiogVGhlIHZpZXcgY29udGFpbmVyIHRvIGFkZCBpdGVtcyB0by4gKi9cbiAgICAgIHByaXZhdGUgX3ZpZXdDb250YWluZXJSZWY6IFZpZXdDb250YWluZXJSZWYsXG4gICAgICAvKiogVGhlIHRlbXBsYXRlIHRvIHVzZSB3aGVuIHN0YW1waW5nIG91dCBuZXcgaXRlbXMuICovXG4gICAgICBwcml2YXRlIF90ZW1wbGF0ZTogVGVtcGxhdGVSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj4sXG4gICAgICAvKiogVGhlIHNldCBvZiBhdmFpbGFibGUgZGlmZmVycy4gKi9cbiAgICAgIHByaXZhdGUgX2RpZmZlcnM6IEl0ZXJhYmxlRGlmZmVycyxcbiAgICAgIC8qKiBUaGUgdmlydHVhbCBzY3JvbGxpbmcgdmlld3BvcnQgdGhhdCB0aGVzZSBpdGVtcyBhcmUgYmVpbmcgcmVuZGVyZWQgaW4uICovXG4gICAgICBAU2tpcFNlbGYoKSBwcml2YXRlIF92aWV3cG9ydDogQ2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0LFxuICAgICAgbmdab25lOiBOZ1pvbmUpIHtcbiAgICB0aGlzLmRhdGFTdHJlYW0uc3Vic2NyaWJlKGRhdGEgPT4ge1xuICAgICAgdGhpcy5fZGF0YSA9IGRhdGE7XG4gICAgICB0aGlzLl9vblJlbmRlcmVkRGF0YUNoYW5nZSgpO1xuICAgIH0pO1xuICAgIHRoaXMuX3ZpZXdwb3J0LnJlbmRlcmVkUmFuZ2VTdHJlYW0ucGlwZSh0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSkuc3Vic2NyaWJlKHJhbmdlID0+IHtcbiAgICAgIHRoaXMuX3JlbmRlcmVkUmFuZ2UgPSByYW5nZTtcbiAgICAgIG5nWm9uZS5ydW4oKCkgPT4gdGhpcy52aWV3Q2hhbmdlLm5leHQodGhpcy5fcmVuZGVyZWRSYW5nZSkpO1xuICAgICAgdGhpcy5fb25SZW5kZXJlZERhdGFDaGFuZ2UoKTtcbiAgICB9KTtcbiAgICB0aGlzLl92aWV3cG9ydC5hdHRhY2godGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogTWVhc3VyZXMgdGhlIGNvbWJpbmVkIHNpemUgKHdpZHRoIGZvciBob3Jpem9udGFsIG9yaWVudGF0aW9uLCBoZWlnaHQgZm9yIHZlcnRpY2FsKSBvZiBhbGwgaXRlbXNcbiAgICogaW4gdGhlIHNwZWNpZmllZCByYW5nZS4gVGhyb3dzIGFuIGVycm9yIGlmIHRoZSByYW5nZSBpbmNsdWRlcyBpdGVtcyB0aGF0IGFyZSBub3QgY3VycmVudGx5XG4gICAqIHJlbmRlcmVkLlxuICAgKi9cbiAgbWVhc3VyZVJhbmdlU2l6ZShyYW5nZTogTGlzdFJhbmdlLCBvcmllbnRhdGlvbjogJ2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJyk6IG51bWJlciB7XG4gICAgaWYgKHJhbmdlLnN0YXJ0ID49IHJhbmdlLmVuZCkge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGlmIChyYW5nZS5zdGFydCA8IHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQgfHwgcmFuZ2UuZW5kID4gdGhpcy5fcmVuZGVyZWRSYW5nZS5lbmQpIHtcbiAgICAgIHRocm93IEVycm9yKGBFcnJvcjogYXR0ZW1wdGVkIHRvIG1lYXN1cmUgYW4gaXRlbSB0aGF0IGlzbid0IHJlbmRlcmVkLmApO1xuICAgIH1cblxuICAgIC8vIFRoZSBpbmRleCBpbnRvIHRoZSBsaXN0IG9mIHJlbmRlcmVkIHZpZXdzIGZvciB0aGUgZmlyc3QgaXRlbSBpbiB0aGUgcmFuZ2UuXG4gICAgY29uc3QgcmVuZGVyZWRTdGFydEluZGV4ID0gcmFuZ2Uuc3RhcnQgLSB0aGlzLl9yZW5kZXJlZFJhbmdlLnN0YXJ0O1xuICAgIC8vIFRoZSBsZW5ndGggb2YgdGhlIHJhbmdlIHdlJ3JlIG1lYXN1cmluZy5cbiAgICBjb25zdCByYW5nZUxlbiA9IHJhbmdlLmVuZCAtIHJhbmdlLnN0YXJ0O1xuXG4gICAgLy8gTG9vcCBvdmVyIGFsbCByb290IG5vZGVzIGZvciBhbGwgaXRlbXMgaW4gdGhlIHJhbmdlIGFuZCBzdW0gdXAgdGhlaXIgc2l6ZS5cbiAgICBsZXQgdG90YWxTaXplID0gMDtcbiAgICBsZXQgaSA9IHJhbmdlTGVuO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmdldChpICsgcmVuZGVyZWRTdGFydEluZGV4KSBhc1xuICAgICAgICAgIEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PiB8IG51bGw7XG4gICAgICBsZXQgaiA9IHZpZXcgPyB2aWV3LnJvb3ROb2Rlcy5sZW5ndGggOiAwO1xuICAgICAgd2hpbGUgKGotLSkge1xuICAgICAgICB0b3RhbFNpemUgKz0gZ2V0U2l6ZShvcmllbnRhdGlvbiwgdmlldyEucm9vdE5vZGVzW2pdKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdG90YWxTaXplO1xuICB9XG5cbiAgbmdEb0NoZWNrKCkge1xuICAgIGlmICh0aGlzLl9kaWZmZXIgJiYgdGhpcy5fbmVlZHNVcGRhdGUpIHtcbiAgICAgIC8vIFRPRE8obW1hbGVyYmEpOiBXZSBzaG91bGQgZGlmZmVyZW50aWF0ZSBuZWVkcyB1cGRhdGUgZHVlIHRvIHNjcm9sbGluZyBhbmQgYSBuZXcgcG9ydGlvbiBvZlxuICAgICAgLy8gdGhpcyBsaXN0IGJlaW5nIHJlbmRlcmVkIChjYW4gdXNlIHNpbXBsZXIgYWxnb3JpdGhtKSB2cyBuZWVkcyB1cGRhdGUgZHVlIHRvIGRhdGEgYWN0dWFsbHlcbiAgICAgIC8vIGNoYW5naW5nIChuZWVkIHRvIGRvIHRoaXMgZGlmZikuXG4gICAgICBjb25zdCBjaGFuZ2VzID0gdGhpcy5fZGlmZmVyLmRpZmYodGhpcy5fcmVuZGVyZWRJdGVtcyk7XG4gICAgICBpZiAoIWNoYW5nZXMpIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlQ29udGV4dCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fYXBwbHlDaGFuZ2VzKGNoYW5nZXMpO1xuICAgICAgfVxuICAgICAgdGhpcy5fbmVlZHNVcGRhdGUgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl92aWV3cG9ydC5kZXRhY2goKTtcblxuICAgIHRoaXMuX2RhdGFTb3VyY2VDaGFuZ2VzLm5leHQoKTtcbiAgICB0aGlzLl9kYXRhU291cmNlQ2hhbmdlcy5jb21wbGV0ZSgpO1xuICAgIHRoaXMudmlld0NoYW5nZS5jb21wbGV0ZSgpO1xuXG4gICAgdGhpcy5fZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQuY29tcGxldGUoKTtcblxuICAgIGZvciAobGV0IHZpZXcgb2YgdGhpcy5fdGVtcGxhdGVDYWNoZSkge1xuICAgICAgdmlldy5kZXN0cm95KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFJlYWN0IHRvIHNjcm9sbCBzdGF0ZSBjaGFuZ2VzIGluIHRoZSB2aWV3cG9ydC4gKi9cbiAgcHJpdmF0ZSBfb25SZW5kZXJlZERhdGFDaGFuZ2UoKSB7XG4gICAgaWYgKCF0aGlzLl9yZW5kZXJlZFJhbmdlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX3JlbmRlcmVkSXRlbXMgPSB0aGlzLl9kYXRhLnNsaWNlKHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQsIHRoaXMuX3JlbmRlcmVkUmFuZ2UuZW5kKTtcbiAgICBpZiAoIXRoaXMuX2RpZmZlcikge1xuICAgICAgdGhpcy5fZGlmZmVyID0gdGhpcy5fZGlmZmVycy5maW5kKHRoaXMuX3JlbmRlcmVkSXRlbXMpLmNyZWF0ZSh0aGlzLmNka1ZpcnR1YWxGb3JUcmFja0J5KTtcbiAgICB9XG4gICAgdGhpcy5fbmVlZHNVcGRhdGUgPSB0cnVlO1xuICB9XG5cbiAgLyoqIFN3YXAgb3V0IG9uZSBgRGF0YVNvdXJjZWAgZm9yIGFub3RoZXIuICovXG4gIHByaXZhdGUgX2NoYW5nZURhdGFTb3VyY2Uob2xkRHM6IERhdGFTb3VyY2U8VD4gfCBudWxsLCBuZXdEczogRGF0YVNvdXJjZTxUPiB8IG51bGwpOlxuICAgIE9ic2VydmFibGU8VFtdIHwgUmVhZG9ubHlBcnJheTxUPj4ge1xuXG4gICAgaWYgKG9sZERzKSB7XG4gICAgICBvbGREcy5kaXNjb25uZWN0KHRoaXMpO1xuICAgIH1cblxuICAgIHRoaXMuX25lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICByZXR1cm4gbmV3RHMgPyBuZXdEcy5jb25uZWN0KHRoaXMpIDogb2JzZXJ2YWJsZU9mKCk7XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSBgQ2RrVmlydHVhbEZvck9mQ29udGV4dGAgZm9yIGFsbCB2aWV3cy4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlQ29udGV4dCgpIHtcbiAgICBjb25zdCBjb3VudCA9IHRoaXMuX2RhdGEubGVuZ3RoO1xuICAgIGxldCBpID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgbGV0IHZpZXcgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmdldChpKSBhcyBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj47XG4gICAgICB2aWV3LmNvbnRleHQuaW5kZXggPSB0aGlzLl9yZW5kZXJlZFJhbmdlLnN0YXJ0ICsgaTtcbiAgICAgIHZpZXcuY29udGV4dC5jb3VudCA9IGNvdW50O1xuICAgICAgdGhpcy5fdXBkYXRlQ29tcHV0ZWRDb250ZXh0UHJvcGVydGllcyh2aWV3LmNvbnRleHQpO1xuICAgICAgdmlldy5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEFwcGx5IGNoYW5nZXMgdG8gdGhlIERPTS4gKi9cbiAgcHJpdmF0ZSBfYXBwbHlDaGFuZ2VzKGNoYW5nZXM6IEl0ZXJhYmxlQ2hhbmdlczxUPikge1xuICAgIC8vIFJlYXJyYW5nZSB0aGUgdmlld3MgdG8gcHV0IHRoZW0gaW4gdGhlIHJpZ2h0IGxvY2F0aW9uLlxuICAgIGNoYW5nZXMuZm9yRWFjaE9wZXJhdGlvbigocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZDxUPixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkanVzdGVkUHJldmlvdXNJbmRleDogbnVtYmVyIHwgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRJbmRleDogbnVtYmVyIHwgbnVsbCkgPT4ge1xuICAgICAgaWYgKHJlY29yZC5wcmV2aW91c0luZGV4ID09IG51bGwpIHsgIC8vIEl0ZW0gYWRkZWQuXG4gICAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLl9pbnNlcnRWaWV3Rm9yTmV3SXRlbShjdXJyZW50SW5kZXghKTtcbiAgICAgICAgdmlldy5jb250ZXh0LiRpbXBsaWNpdCA9IHJlY29yZC5pdGVtO1xuICAgICAgfSBlbHNlIGlmIChjdXJyZW50SW5kZXggPT0gbnVsbCkgeyAgLy8gSXRlbSByZW1vdmVkLlxuICAgICAgICB0aGlzLl9jYWNoZVZpZXcodGhpcy5fZGV0YWNoVmlldyhhZGp1c3RlZFByZXZpb3VzSW5kZXggISkpO1xuICAgICAgfSBlbHNlIHsgIC8vIEl0ZW0gbW92ZWQuXG4gICAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmdldChhZGp1c3RlZFByZXZpb3VzSW5kZXghKSBhc1xuICAgICAgICAgICAgRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+O1xuICAgICAgICB0aGlzLl92aWV3Q29udGFpbmVyUmVmLm1vdmUodmlldywgY3VycmVudEluZGV4KTtcbiAgICAgICAgdmlldy5jb250ZXh0LiRpbXBsaWNpdCA9IHJlY29yZC5pdGVtO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gVXBkYXRlICRpbXBsaWNpdCBmb3IgYW55IGl0ZW1zIHRoYXQgaGFkIGFuIGlkZW50aXR5IGNoYW5nZS5cbiAgICBjaGFuZ2VzLmZvckVhY2hJZGVudGl0eUNoYW5nZSgocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZDxUPikgPT4ge1xuICAgICAgY29uc3QgdmlldyA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuZ2V0KHJlY29yZC5jdXJyZW50SW5kZXghKSBhc1xuICAgICAgICAgIEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PjtcbiAgICAgIHZpZXcuY29udGV4dC4kaW1wbGljaXQgPSByZWNvcmQuaXRlbTtcbiAgICB9KTtcblxuICAgIC8vIFVwZGF0ZSB0aGUgY29udGV4dCB2YXJpYWJsZXMgb24gYWxsIGl0ZW1zLlxuICAgIGNvbnN0IGNvdW50ID0gdGhpcy5fZGF0YS5sZW5ndGg7XG4gICAgbGV0IGkgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICBjb25zdCB2aWV3ID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5nZXQoaSkgYXMgRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+O1xuICAgICAgdmlldy5jb250ZXh0LmluZGV4ID0gdGhpcy5fcmVuZGVyZWRSYW5nZS5zdGFydCArIGk7XG4gICAgICB2aWV3LmNvbnRleHQuY291bnQgPSBjb3VudDtcbiAgICAgIHRoaXMuX3VwZGF0ZUNvbXB1dGVkQ29udGV4dFByb3BlcnRpZXModmlldy5jb250ZXh0KTtcbiAgICB9XG4gIH1cblxuICAvKiogQ2FjaGUgdGhlIGdpdmVuIGRldGFjaGVkIHZpZXcuICovXG4gIHByaXZhdGUgX2NhY2hlVmlldyh2aWV3OiBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj4pIHtcbiAgICBpZiAodGhpcy5fdGVtcGxhdGVDYWNoZS5sZW5ndGggPCB0aGlzLmNka1ZpcnR1YWxGb3JUZW1wbGF0ZUNhY2hlU2l6ZSkge1xuICAgICAgdGhpcy5fdGVtcGxhdGVDYWNoZS5wdXNoKHZpZXcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBpbmRleCA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuaW5kZXhPZih2aWV3KTtcblxuICAgICAgLy8gSXQncyB2ZXJ5IHVubGlrZWx5IHRoYXQgdGhlIGluZGV4IHdpbGwgZXZlciBiZSAtMSwgYnV0IGp1c3QgaW4gY2FzZSxcbiAgICAgIC8vIGRlc3Ryb3kgdGhlIHZpZXcgb24gaXRzIG93biwgb3RoZXJ3aXNlIGRlc3Ryb3kgaXQgdGhyb3VnaCB0aGVcbiAgICAgIC8vIGNvbnRhaW5lciB0byBlbnN1cmUgdGhhdCBhbGwgdGhlIHJlZmVyZW5jZXMgYXJlIHJlbW92ZWQuXG4gICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgIHZpZXcuZGVzdHJveSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fdmlld0NvbnRhaW5lclJlZi5yZW1vdmUoaW5kZXgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBJbnNlcnRzIGEgdmlldyBmb3IgYSBuZXcgaXRlbSwgZWl0aGVyIGZyb20gdGhlIGNhY2hlIG9yIGJ5IGNyZWF0aW5nIGEgbmV3IG9uZS4gKi9cbiAgcHJpdmF0ZSBfaW5zZXJ0Vmlld0Zvck5ld0l0ZW0oaW5kZXg6IG51bWJlcik6IEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PiB7XG4gICAgcmV0dXJuIHRoaXMuX2luc2VydFZpZXdGcm9tQ2FjaGUoaW5kZXgpIHx8IHRoaXMuX2NyZWF0ZUVtYmVkZGVkVmlld0F0KGluZGV4KTtcbiAgfVxuXG4gIC8qKiBVcGRhdGUgdGhlIGNvbXB1dGVkIHByb3BlcnRpZXMgb24gdGhlIGBDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0YC4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlQ29tcHV0ZWRDb250ZXh0UHJvcGVydGllcyhjb250ZXh0OiBDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PGFueT4pIHtcbiAgICBjb250ZXh0LmZpcnN0ID0gY29udGV4dC5pbmRleCA9PT0gMDtcbiAgICBjb250ZXh0Lmxhc3QgPSBjb250ZXh0LmluZGV4ID09PSBjb250ZXh0LmNvdW50IC0gMTtcbiAgICBjb250ZXh0LmV2ZW4gPSBjb250ZXh0LmluZGV4ICUgMiA9PT0gMDtcbiAgICBjb250ZXh0Lm9kZCA9ICFjb250ZXh0LmV2ZW47XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG5ldyBlbWJlZGRlZCB2aWV3IGFuZCBtb3ZlcyBpdCB0byB0aGUgZ2l2ZW4gaW5kZXggKi9cbiAgcHJpdmF0ZSBfY3JlYXRlRW1iZWRkZWRWaWV3QXQoaW5kZXg6IG51bWJlcik6IEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PiB7XG4gICAgLy8gTm90ZSB0aGF0IGl0J3MgaW1wb3J0YW50IHRoYXQgd2UgaW5zZXJ0IHRoZSBpdGVtIGRpcmVjdGx5IGF0IHRoZSBwcm9wZXIgaW5kZXgsXG4gICAgLy8gcmF0aGVyIHRoYW4gaW5zZXJ0aW5nIGl0IGFuZCB0aGUgbW92aW5nIGl0IGluIHBsYWNlLCBiZWNhdXNlIGlmIHRoZXJlJ3MgYSBkaXJlY3RpdmVcbiAgICAvLyBvbiB0aGUgc2FtZSBub2RlIHRoYXQgaW5qZWN0cyB0aGUgYFZpZXdDb250YWluZXJSZWZgLCBBbmd1bGFyIHdpbGwgaW5zZXJ0IGFub3RoZXJcbiAgICAvLyBjb21tZW50IG5vZGUgd2hpY2ggY2FuIHRocm93IG9mZiB0aGUgbW92ZSB3aGVuIGl0J3MgYmVpbmcgcmVwZWF0ZWQgZm9yIGFsbCBpdGVtcy5cbiAgICByZXR1cm4gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5jcmVhdGVFbWJlZGRlZFZpZXcodGhpcy5fdGVtcGxhdGUsIHtcbiAgICAgICRpbXBsaWNpdDogbnVsbCEsXG4gICAgICAvLyBJdCdzIGd1YXJhbnRlZWQgdGhhdCB0aGUgaXRlcmFibGUgaXMgbm90IFwidW5kZWZpbmVkXCIgb3IgXCJudWxsXCIgYmVjYXVzZSB3ZSBvbmx5XG4gICAgICAvLyBnZW5lcmF0ZSB2aWV3cyBmb3IgZWxlbWVudHMgaWYgdGhlIFwiY2RrVmlydHVhbEZvck9mXCIgaXRlcmFibGUgaGFzIGVsZW1lbnRzLlxuICAgICAgY2RrVmlydHVhbEZvck9mOiB0aGlzLl9jZGtWaXJ0dWFsRm9yT2YhLFxuICAgICAgaW5kZXg6IC0xLFxuICAgICAgY291bnQ6IC0xLFxuICAgICAgZmlyc3Q6IGZhbHNlLFxuICAgICAgbGFzdDogZmFsc2UsXG4gICAgICBvZGQ6IGZhbHNlLFxuICAgICAgZXZlbjogZmFsc2VcbiAgICB9LCBpbmRleCk7XG4gIH1cblxuICAvKiogSW5zZXJ0cyBhIHJlY3ljbGVkIHZpZXcgZnJvbSB0aGUgY2FjaGUgYXQgdGhlIGdpdmVuIGluZGV4LiAqL1xuICBwcml2YXRlIF9pbnNlcnRWaWV3RnJvbUNhY2hlKGluZGV4OiBudW1iZXIpOiBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj58bnVsbCB7XG4gICAgY29uc3QgY2FjaGVkVmlldyA9IHRoaXMuX3RlbXBsYXRlQ2FjaGUucG9wKCk7XG4gICAgaWYgKGNhY2hlZFZpZXcpIHtcbiAgICAgIHRoaXMuX3ZpZXdDb250YWluZXJSZWYuaW5zZXJ0KGNhY2hlZFZpZXcsIGluZGV4KTtcbiAgICB9XG4gICAgcmV0dXJuIGNhY2hlZFZpZXcgfHwgbnVsbDtcbiAgfVxuXG4gIC8qKiBEZXRhY2hlcyB0aGUgZW1iZWRkZWQgdmlldyBhdCB0aGUgZ2l2ZW4gaW5kZXguICovXG4gIHByaXZhdGUgX2RldGFjaFZpZXcoaW5kZXg6IG51bWJlcik6IEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PiB7XG4gICAgcmV0dXJuIHRoaXMuX3ZpZXdDb250YWluZXJSZWYuZGV0YWNoKGluZGV4KSBhc1xuICAgICAgICBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj47XG4gIH1cbn1cbiJdfQ==