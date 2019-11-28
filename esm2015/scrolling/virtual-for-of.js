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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1mb3Itb2YuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy92aXJ0dWFsLWZvci1vZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQ0wsZUFBZSxFQUlmLFlBQVksR0FDYixNQUFNLDBCQUEwQixDQUFDO0FBQ2xDLE9BQU8sRUFDTCxTQUFTLEVBR1QsS0FBSyxFQUlMLGVBQWUsRUFFZixNQUFNLEVBRU4sUUFBUSxFQUNSLFdBQVcsRUFFWCxnQkFBZ0IsR0FDakIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUUsRUFBRSxJQUFJLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUM3RCxPQUFPLEVBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3RGLE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLDJCQUEyQixDQUFDOzs7Ozs7O0FBeUJuRSxTQUFTLE9BQU8sQ0FBQyxXQUFzQyxFQUFFLElBQVU7O1VBQzNELEVBQUUsR0FBRyxtQkFBQSxJQUFJLEVBQVc7SUFDMUIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsRUFBRTtRQUM3QixPQUFPLENBQUMsQ0FBQztLQUNWOztVQUNLLElBQUksR0FBRyxFQUFFLENBQUMscUJBQXFCLEVBQUU7SUFDdkMsT0FBTyxXQUFXLElBQUksWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQ2hFLENBQUM7Ozs7OztBQVVELE1BQU0sT0FBTyxlQUFlOzs7Ozs7OztJQTJGMUIsWUFFWSxpQkFBbUMsRUFFbkMsU0FBaUQsRUFFakQsUUFBeUIsRUFFYixTQUFtQyxFQUN2RCxNQUFjO1FBUE4sc0JB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LElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ2xEO1FBQ0QsT0FBTyxVQUFVLElBQUksSUFBSSxDQUFDO0lBQzVCLENBQUM7Ozs7Ozs7SUFHTyxXQUFXLENBQUMsS0FBYTtRQUMvQixPQUFPLG1CQUFBLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQ0csQ0FBQztJQUNqRCxDQUFDOzs7WUE3VEYsU0FBUyxTQUFDO2dCQUNULFFBQVEsRUFBRSxrQ0FBa0M7YUFDN0M7Ozs7WUE3Q0MsZ0JBQWdCO1lBRmhCLFdBQVc7WUFMWCxlQUFlO1lBV1Qsd0JBQXdCLHVCQTZJekIsUUFBUTtZQXRKYixNQUFNOzs7OEJBMkRMLEtBQUs7bUNBa0JMLEtBQUs7b0NBYUwsS0FBSzs2Q0FZTCxLQUFLOzs7Ozs7O0lBakROLHFDQUFzQzs7Ozs7O0lBR3RDLDZDQUEwRDs7SUFlMUQsMkNBQXFGOzs7OztJQWdCckYsZ0RBQThEOzs7Ozs7SUFlOUQseURBQXFEOzs7OztJQUdyRCxxQ0FXd0I7Ozs7OztJQUd4QixrQ0FBaUQ7Ozs7OztJQUdqRCxnQ0FBc0M7Ozs7OztJQUd0Qyx5Q0FBNEI7Ozs7OztJQUc1Qix5Q0FBa0M7Ozs7Ozs7O0lBT2xDLHlDQUEwRTs7Ozs7O0lBRzFFLHVDQUE2Qjs7Ozs7SUFFN0IscUNBQXlDOzs7Ozs7SUFJckMsNENBQTJDOzs7Ozs7SUFFM0Msb0NBQXlEOzs7Ozs7SUFFekQsbUNBQWlDOzs7Ozs7SUFFakMsb0NBQXVEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIEFycmF5RGF0YVNvdXJjZSxcbiAgQ29sbGVjdGlvblZpZXdlcixcbiAgRGF0YVNvdXJjZSxcbiAgTGlzdFJhbmdlLFxuICBpc0RhdGFTb3VyY2UsXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2xsZWN0aW9ucyc7XG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIERvQ2hlY2ssXG4gIEVtYmVkZGVkVmlld1JlZixcbiAgSW5wdXQsXG4gIEl0ZXJhYmxlQ2hhbmdlUmVjb3JkLFxuICBJdGVyYWJsZUNoYW5nZXMsXG4gIEl0ZXJhYmxlRGlmZmVyLFxuICBJdGVyYWJsZURpZmZlcnMsXG4gIE5nSXRlcmFibGUsXG4gIE5nWm9uZSxcbiAgT25EZXN0cm95LFxuICBTa2lwU2VsZixcbiAgVGVtcGxhdGVSZWYsXG4gIFRyYWNrQnlGdW5jdGlvbixcbiAgVmlld0NvbnRhaW5lclJlZixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3QsIG9mIGFzIG9ic2VydmFibGVPZn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3BhaXJ3aXNlLCBzaGFyZVJlcGxheSwgc3RhcnRXaXRoLCBzd2l0Y2hNYXAsIHRha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtDZGtWaXJ0dWFsU2Nyb2xsVmlld3BvcnR9IGZyb20gJy4vdmlydHVhbC1zY3JvbGwtdmlld3BvcnQnO1xuXG5cbi8qKiBUaGUgY29udGV4dCBmb3IgYW4gaXRlbSByZW5kZXJlZCBieSBgQ2RrVmlydHVhbEZvck9mYCAqL1xuZXhwb3J0IHR5cGUgQ2RrVmlydHVhbEZvck9mQ29udGV4dDxUPiA9IHtcbiAgLyoqIFRoZSBpdGVtIHZhbHVlLiAqL1xuICAkaW1wbGljaXQ6IFQ7XG4gIC8qKiBUaGUgRGF0YVNvdXJjZSwgT2JzZXJ2YWJsZSwgb3IgTmdJdGVyYWJsZSB0aGF0IHdhcyBwYXNzZWQgdG8gKmNka1ZpcnR1YWxGb3IuICovXG4gIGNka1ZpcnR1YWxGb3JPZjogRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8VFtdPiB8IE5nSXRlcmFibGU8VD47XG4gIC8qKiBUaGUgaW5kZXggb2YgdGhlIGl0ZW0gaW4gdGhlIERhdGFTb3VyY2UuICovXG4gIGluZGV4OiBudW1iZXI7XG4gIC8qKiBUaGUgbnVtYmVyIG9mIGl0ZW1zIGluIHRoZSBEYXRhU291cmNlLiAqL1xuICBjb3VudDogbnVtYmVyO1xuICAvKiogV2hldGhlciB0aGlzIGlzIHRoZSBmaXJzdCBpdGVtIGluIHRoZSBEYXRhU291cmNlLiAqL1xuICBmaXJzdDogYm9vbGVhbjtcbiAgLyoqIFdoZXRoZXIgdGhpcyBpcyB0aGUgbGFzdCBpdGVtIGluIHRoZSBEYXRhU291cmNlLiAqL1xuICBsYXN0OiBib29sZWFuO1xuICAvKiogV2hldGhlciB0aGUgaW5kZXggaXMgZXZlbi4gKi9cbiAgZXZlbjogYm9vbGVhbjtcbiAgLyoqIFdoZXRoZXIgdGhlIGluZGV4IGlzIG9kZC4gKi9cbiAgb2RkOiBib29sZWFuO1xufTtcblxuXG4vKiogSGVscGVyIHRvIGV4dHJhY3Qgc2l6ZSBmcm9tIGEgRE9NIE5vZGUuICovXG5mdW5jdGlvbiBnZXRTaXplKG9yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcgfCAndmVydGljYWwnLCBub2RlOiBOb2RlKTogbnVtYmVyIHtcbiAgY29uc3QgZWwgPSBub2RlIGFzIEVsZW1lbnQ7XG4gIGlmICghZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cbiAgY29uc3QgcmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICByZXR1cm4gb3JpZW50YXRpb24gPT0gJ2hvcml6b250YWwnID8gcmVjdC53aWR0aCA6IHJlY3QuaGVpZ2h0O1xufVxuXG5cbi8qKlxuICogQSBkaXJlY3RpdmUgc2ltaWxhciB0byBgbmdGb3JPZmAgdG8gYmUgdXNlZCBmb3IgcmVuZGVyaW5nIGRhdGEgaW5zaWRlIGEgdmlydHVhbCBzY3JvbGxpbmdcbiAqIGNvbnRhaW5lci5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka1ZpcnR1YWxGb3JdW2Nka1ZpcnR1YWxGb3JPZl0nLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtWaXJ0dWFsRm9yT2Y8VD4gaW1wbGVtZW50cyBDb2xsZWN0aW9uVmlld2VyLCBEb0NoZWNrLCBPbkRlc3Ryb3kge1xuICAvKiogRW1pdHMgd2hlbiB0aGUgcmVuZGVyZWQgdmlldyBvZiB0aGUgZGF0YSBjaGFuZ2VzLiAqL1xuICB2aWV3Q2hhbmdlID0gbmV3IFN1YmplY3Q8TGlzdFJhbmdlPigpO1xuXG4gIC8qKiBTdWJqZWN0IHRoYXQgZW1pdHMgd2hlbiBhIG5ldyBEYXRhU291cmNlIGluc3RhbmNlIGlzIGdpdmVuLiAqL1xuICBwcml2YXRlIF9kYXRhU291cmNlQ2hhbmdlcyA9IG5ldyBTdWJqZWN0PERhdGFTb3VyY2U8VD4+KCk7XG5cbiAgLyoqIFRoZSBEYXRhU291cmNlIHRvIGRpc3BsYXkuICovXG4gIEBJbnB1dCgpXG4gIGdldCBjZGtWaXJ0dWFsRm9yT2YoKTogRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8VFtdPiB8IE5nSXRlcmFibGU8VD4gfCBudWxsIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fY2RrVmlydHVhbEZvck9mO1xuICB9XG4gIHNldCBjZGtWaXJ0dWFsRm9yT2YodmFsdWU6IERhdGFTb3VyY2U8VD4gfCBPYnNlcnZhYmxlPFRbXT4gfCBOZ0l0ZXJhYmxlPFQ+IHwgbnVsbCB8IHVuZGVmaW5lZCkge1xuICAgIHRoaXMuX2Nka1ZpcnR1YWxGb3JPZiA9IHZhbHVlO1xuICAgIGNvbnN0IGRzID0gaXNEYXRhU291cmNlKHZhbHVlKSA/IHZhbHVlIDpcbiAgICAgICAgLy8gU2xpY2UgdGhlIHZhbHVlIGlmIGl0cyBhbiBOZ0l0ZXJhYmxlIHRvIGVuc3VyZSB3ZSdyZSB3b3JraW5nIHdpdGggYW4gYXJyYXkuXG4gICAgICAgIG5ldyBBcnJheURhdGFTb3VyY2U8VD4oXG4gICAgICAgICAgICB2YWx1ZSBpbnN0YW5jZW9mIE9ic2VydmFibGUgPyB2YWx1ZSA6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHZhbHVlIHx8IFtdKSk7XG4gICAgdGhpcy5fZGF0YVNvdXJjZUNoYW5nZXMubmV4dChkcyk7XG4gIH1cbiAgX2Nka1ZpcnR1YWxGb3JPZjogRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8VFtdPiB8IE5nSXRlcmFibGU8VD4gfCBudWxsIHwgdW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBUaGUgYFRyYWNrQnlGdW5jdGlvbmAgdG8gdXNlIGZvciB0cmFja2luZyBjaGFuZ2VzLiBUaGUgYFRyYWNrQnlGdW5jdGlvbmAgdGFrZXMgdGhlIGluZGV4IGFuZFxuICAgKiB0aGUgaXRlbSBhbmQgcHJvZHVjZXMgYSB2YWx1ZSB0byBiZSB1c2VkIGFzIHRoZSBpdGVtJ3MgaWRlbnRpdHkgd2hlbiB0cmFja2luZyBjaGFuZ2VzLlxuICAgKi9cbiAgQElucHV0KClcbiAgZ2V0IGNka1ZpcnR1YWxGb3JUcmFja0J5KCk6IFRyYWNrQnlGdW5jdGlvbjxUPiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX2Nka1ZpcnR1YWxGb3JUcmFja0J5O1xuICB9XG4gIHNldCBjZGtWaXJ0dWFsRm9yVHJhY2tCeShmbjogVHJhY2tCeUZ1bmN0aW9uPFQ+IHwgdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5fbmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgIHRoaXMuX2Nka1ZpcnR1YWxGb3JUcmFja0J5ID0gZm4gP1xuICAgICAgICAoaW5kZXgsIGl0ZW0pID0+IGZuKGluZGV4ICsgKHRoaXMuX3JlbmRlcmVkUmFuZ2UgPyB0aGlzLl9yZW5kZXJlZFJhbmdlLnN0YXJ0IDogMCksIGl0ZW0pIDpcbiAgICAgICAgdW5kZWZpbmVkO1xuICB9XG4gIHByaXZhdGUgX2Nka1ZpcnR1YWxGb3JUcmFja0J5OiBUcmFja0J5RnVuY3Rpb248VD4gfCB1bmRlZmluZWQ7XG5cbiAgLyoqIFRoZSB0ZW1wbGF0ZSB1c2VkIHRvIHN0YW1wIG91dCBuZXcgZWxlbWVudHMuICovXG4gIEBJbnB1dCgpXG4gIHNldCBjZGtWaXJ0dWFsRm9yVGVtcGxhdGUodmFsdWU6IFRlbXBsYXRlUmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+KSB7XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICB0aGlzLl9uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgICB0aGlzLl90ZW1wbGF0ZSA9IHZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgc2l6ZSBvZiB0aGUgY2FjaGUgdXNlZCB0byBzdG9yZSB0ZW1wbGF0ZXMgdGhhdCBhcmUgbm90IGJlaW5nIHVzZWQgZm9yIHJlLXVzZSBsYXRlci5cbiAgICogU2V0dGluZyB0aGUgY2FjaGUgc2l6ZSB0byBgMGAgd2lsbCBkaXNhYmxlIGNhY2hpbmcuIERlZmF1bHRzIHRvIDIwIHRlbXBsYXRlcy5cbiAgICovXG4gIEBJbnB1dCgpIGNka1ZpcnR1YWxGb3JUZW1wbGF0ZUNhY2hlU2l6ZTogbnVtYmVyID0gMjA7XG5cbiAgLyoqIEVtaXRzIHdoZW5ldmVyIHRoZSBkYXRhIGluIHRoZSBjdXJyZW50IERhdGFTb3VyY2UgY2hhbmdlcy4gKi9cbiAgZGF0YVN0cmVhbTogT2JzZXJ2YWJsZTxUW10gfCBSZWFkb25seUFycmF5PFQ+PiA9IHRoaXMuX2RhdGFTb3VyY2VDaGFuZ2VzXG4gICAgICAucGlwZShcbiAgICAgICAgICAvLyBTdGFydCBvZmYgd2l0aCBudWxsIGBEYXRhU291cmNlYC5cbiAgICAgICAgICBzdGFydFdpdGgobnVsbCEpLFxuICAgICAgICAgIC8vIEJ1bmRsZSB1cCB0aGUgcHJldmlvdXMgYW5kIGN1cnJlbnQgZGF0YSBzb3VyY2VzIHNvIHdlIGNhbiB3b3JrIHdpdGggYm90aC5cbiAgICAgICAgICBwYWlyd2lzZSgpLFxuICAgICAgICAgIC8vIFVzZSBgX2NoYW5nZURhdGFTb3VyY2VgIHRvIGRpc2Nvbm5lY3QgZnJvbSB0aGUgcHJldmlvdXMgZGF0YSBzb3VyY2UgYW5kIGNvbm5lY3QgdG8gdGhlXG4gICAgICAgICAgLy8gbmV3IG9uZSwgcGFzc2luZyBiYWNrIGEgc3RyZWFtIG9mIGRhdGEgY2hhbmdlcyB3aGljaCB3ZSBydW4gdGhyb3VnaCBgc3dpdGNoTWFwYCB0byBnaXZlXG4gICAgICAgICAgLy8gdXMgYSBkYXRhIHN0cmVhbSB0aGF0IGVtaXRzIHRoZSBsYXRlc3QgZGF0YSBmcm9tIHdoYXRldmVyIHRoZSBjdXJyZW50IGBEYXRhU291cmNlYCBpcy5cbiAgICAgICAgICBzd2l0Y2hNYXAoKFtwcmV2LCBjdXJdKSA9PiB0aGlzLl9jaGFuZ2VEYXRhU291cmNlKHByZXYsIGN1cikpLFxuICAgICAgICAgIC8vIFJlcGxheSB0aGUgbGFzdCBlbWl0dGVkIGRhdGEgd2hlbiBzb21lb25lIHN1YnNjcmliZXMuXG4gICAgICAgICAgc2hhcmVSZXBsYXkoMSkpO1xuXG4gIC8qKiBUaGUgZGlmZmVyIHVzZWQgdG8gY2FsY3VsYXRlIGNoYW5nZXMgdG8gdGhlIGRhdGEuICovXG4gIHByaXZhdGUgX2RpZmZlcjogSXRlcmFibGVEaWZmZXI8VD4gfCBudWxsID0gbnVsbDtcblxuICAvKiogVGhlIG1vc3QgcmVjZW50IGRhdGEgZW1pdHRlZCBmcm9tIHRoZSBEYXRhU291cmNlLiAqL1xuICBwcml2YXRlIF9kYXRhOiBUW10gfCBSZWFkb25seUFycmF5PFQ+O1xuXG4gIC8qKiBUaGUgY3VycmVudGx5IHJlbmRlcmVkIGl0ZW1zLiAqL1xuICBwcml2YXRlIF9yZW5kZXJlZEl0ZW1zOiBUW107XG5cbiAgLyoqIFRoZSBjdXJyZW50bHkgcmVuZGVyZWQgcmFuZ2Ugb2YgaW5kaWNlcy4gKi9cbiAgcHJpdmF0ZSBfcmVuZGVyZWRSYW5nZTogTGlzdFJhbmdlO1xuXG4gIC8qKlxuICAgKiBUaGUgdGVtcGxhdGUgY2FjaGUgdXNlZCB0byBob2xkIG9uIG90IHRlbXBsYXRlIGluc3RhbmNlc3MgdGhhdCBoYXZlIGJlZW4gc3RhbXBlZCBvdXQsIGJ1dCBkb24ndFxuICAgKiBjdXJyZW50bHkgbmVlZCB0byBiZSByZW5kZXJlZC4gVGhlc2UgaW5zdGFuY2VzIHdpbGwgYmUgcmV1c2VkIGluIHRoZSBmdXR1cmUgcmF0aGVyIHRoYW5cbiAgICogc3RhbXBpbmcgb3V0IGJyYW5kIG5ldyBvbmVzLlxuICAgKi9cbiAgcHJpdmF0ZSBfdGVtcGxhdGVDYWNoZTogRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+W10gPSBbXTtcblxuICAvKiogV2hldGhlciB0aGUgcmVuZGVyZWQgZGF0YSBzaG91bGQgYmUgdXBkYXRlZCBkdXJpbmcgdGhlIG5leHQgbmdEb0NoZWNrIGN5Y2xlLiAqL1xuICBwcml2YXRlIF9uZWVkc1VwZGF0ZSA9IGZhbHNlO1xuXG4gIHByaXZhdGUgX2Rlc3Ryb3llZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICAvKiogVGhlIHZpZXcgY29udGFpbmVyIHRvIGFkZCBpdGVtcyB0by4gKi9cbiAgICAgIHByaXZhdGUgX3ZpZXdDb250YWluZXJSZWY6IFZpZXdDb250YWluZXJSZWYsXG4gICAgICAvKiogVGhlIHRlbXBsYXRlIHRvIHVzZSB3aGVuIHN0YW1waW5nIG91dCBuZXcgaXRlbXMuICovXG4gICAgICBwcml2YXRlIF90ZW1wbGF0ZTogVGVtcGxhdGVSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj4sXG4gICAgICAvKiogVGhlIHNldCBvZiBhdmFpbGFibGUgZGlmZmVycy4gKi9cbiAgICAgIHByaXZhdGUgX2RpZmZlcnM6IEl0ZXJhYmxlRGlmZmVycyxcbiAgICAgIC8qKiBUaGUgdmlydHVhbCBzY3JvbGxpbmcgdmlld3BvcnQgdGhhdCB0aGVzZSBpdGVtcyBhcmUgYmVpbmcgcmVuZGVyZWQgaW4uICovXG4gICAgICBAU2tpcFNlbGYoKSBwcml2YXRlIF92aWV3cG9ydDogQ2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0LFxuICAgICAgbmdab25lOiBOZ1pvbmUpIHtcbiAgICB0aGlzLmRhdGFTdHJlYW0uc3Vic2NyaWJlKGRhdGEgPT4ge1xuICAgICAgdGhpcy5fZGF0YSA9IGRhdGE7XG4gICAgICB0aGlzLl9vblJlbmRlcmVkRGF0YUNoYW5nZSgpO1xuICAgIH0pO1xuICAgIHRoaXMuX3ZpZXdwb3J0LnJlbmRlcmVkUmFuZ2VTdHJlYW0ucGlwZSh0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSkuc3Vic2NyaWJlKHJhbmdlID0+IHtcbiAgICAgIHRoaXMuX3JlbmRlcmVkUmFuZ2UgPSByYW5nZTtcbiAgICAgIG5nWm9uZS5ydW4oKCkgPT4gdGhpcy52aWV3Q2hhbmdlLm5leHQodGhpcy5fcmVuZGVyZWRSYW5nZSkpO1xuICAgICAgdGhpcy5fb25SZW5kZXJlZERhdGFDaGFuZ2UoKTtcbiAgICB9KTtcbiAgICB0aGlzLl92aWV3cG9ydC5hdHRhY2godGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogTWVhc3VyZXMgdGhlIGNvbWJpbmVkIHNpemUgKHdpZHRoIGZvciBob3Jpem9udGFsIG9yaWVudGF0aW9uLCBoZWlnaHQgZm9yIHZlcnRpY2FsKSBvZiBhbGwgaXRlbXNcbiAgICogaW4gdGhlIHNwZWNpZmllZCByYW5nZS4gVGhyb3dzIGFuIGVycm9yIGlmIHRoZSByYW5nZSBpbmNsdWRlcyBpdGVtcyB0aGF0IGFyZSBub3QgY3VycmVudGx5XG4gICAqIHJlbmRlcmVkLlxuICAgKi9cbiAgbWVhc3VyZVJhbmdlU2l6ZShyYW5nZTogTGlzdFJhbmdlLCBvcmllbnRhdGlvbjogJ2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJyk6IG51bWJlciB7XG4gICAgaWYgKHJhbmdlLnN0YXJ0ID49IHJhbmdlLmVuZCkge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGlmIChyYW5nZS5zdGFydCA8IHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQgfHwgcmFuZ2UuZW5kID4gdGhpcy5fcmVuZGVyZWRSYW5nZS5lbmQpIHtcbiAgICAgIHRocm93IEVycm9yKGBFcnJvcjogYXR0ZW1wdGVkIHRvIG1lYXN1cmUgYW4gaXRlbSB0aGF0IGlzbid0IHJlbmRlcmVkLmApO1xuICAgIH1cblxuICAgIC8vIFRoZSBpbmRleCBpbnRvIHRoZSBsaXN0IG9mIHJlbmRlcmVkIHZpZXdzIGZvciB0aGUgZmlyc3QgaXRlbSBpbiB0aGUgcmFuZ2UuXG4gICAgY29uc3QgcmVuZGVyZWRTdGFydEluZGV4ID0gcmFuZ2Uuc3RhcnQgLSB0aGlzLl9yZW5kZXJlZFJhbmdlLnN0YXJ0O1xuICAgIC8vIFRoZSBsZW5ndGggb2YgdGhlIHJhbmdlIHdlJ3JlIG1lYXN1cmluZy5cbiAgICBjb25zdCByYW5nZUxlbiA9IHJhbmdlLmVuZCAtIHJhbmdlLnN0YXJ0O1xuXG4gICAgLy8gTG9vcCBvdmVyIGFsbCByb290IG5vZGVzIGZvciBhbGwgaXRlbXMgaW4gdGhlIHJhbmdlIGFuZCBzdW0gdXAgdGhlaXIgc2l6ZS5cbiAgICBsZXQgdG90YWxTaXplID0gMDtcbiAgICBsZXQgaSA9IHJhbmdlTGVuO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmdldChpICsgcmVuZGVyZWRTdGFydEluZGV4KSBhc1xuICAgICAgICAgIEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PiB8IG51bGw7XG4gICAgICBsZXQgaiA9IHZpZXcgPyB2aWV3LnJvb3ROb2Rlcy5sZW5ndGggOiAwO1xuICAgICAgd2hpbGUgKGotLSkge1xuICAgICAgICB0b3RhbFNpemUgKz0gZ2V0U2l6ZShvcmllbnRhdGlvbiwgdmlldyEucm9vdE5vZGVzW2pdKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdG90YWxTaXplO1xuICB9XG5cbiAgbmdEb0NoZWNrKCkge1xuICAgIGlmICh0aGlzLl9kaWZmZXIgJiYgdGhpcy5fbmVlZHNVcGRhdGUpIHtcbiAgICAgIC8vIFRPRE8obW1hbGVyYmEpOiBXZSBzaG91bGQgZGlmZmVyZW50aWF0ZSBuZWVkcyB1cGRhdGUgZHVlIHRvIHNjcm9sbGluZyBhbmQgYSBuZXcgcG9ydGlvbiBvZlxuICAgICAgLy8gdGhpcyBsaXN0IGJlaW5nIHJlbmRlcmVkIChjYW4gdXNlIHNpbXBsZXIgYWxnb3JpdGhtKSB2cyBuZWVkcyB1cGRhdGUgZHVlIHRvIGRhdGEgYWN0dWFsbHlcbiAgICAgIC8vIGNoYW5naW5nIChuZWVkIHRvIGRvIHRoaXMgZGlmZikuXG4gICAgICBjb25zdCBjaGFuZ2VzID0gdGhpcy5fZGlmZmVyLmRpZmYodGhpcy5fcmVuZGVyZWRJdGVtcyk7XG4gICAgICBpZiAoIWNoYW5nZXMpIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlQ29udGV4dCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fYXBwbHlDaGFuZ2VzKGNoYW5nZXMpO1xuICAgICAgfVxuICAgICAgdGhpcy5fbmVlZHNVcGRhdGUgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl92aWV3cG9ydC5kZXRhY2goKTtcblxuICAgIHRoaXMuX2RhdGFTb3VyY2VDaGFuZ2VzLm5leHQoKTtcbiAgICB0aGlzLl9kYXRhU291cmNlQ2hhbmdlcy5jb21wbGV0ZSgpO1xuICAgIHRoaXMudmlld0NoYW5nZS5jb21wbGV0ZSgpO1xuXG4gICAgdGhpcy5fZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQuY29tcGxldGUoKTtcblxuICAgIGZvciAobGV0IHZpZXcgb2YgdGhpcy5fdGVtcGxhdGVDYWNoZSkge1xuICAgICAgdmlldy5kZXN0cm95KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFJlYWN0IHRvIHNjcm9sbCBzdGF0ZSBjaGFuZ2VzIGluIHRoZSB2aWV3cG9ydC4gKi9cbiAgcHJpdmF0ZSBfb25SZW5kZXJlZERhdGFDaGFuZ2UoKSB7XG4gICAgaWYgKCF0aGlzLl9yZW5kZXJlZFJhbmdlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX3JlbmRlcmVkSXRlbXMgPSB0aGlzLl9kYXRhLnNsaWNlKHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQsIHRoaXMuX3JlbmRlcmVkUmFuZ2UuZW5kKTtcbiAgICBpZiAoIXRoaXMuX2RpZmZlcikge1xuICAgICAgdGhpcy5fZGlmZmVyID0gdGhpcy5fZGlmZmVycy5maW5kKHRoaXMuX3JlbmRlcmVkSXRlbXMpLmNyZWF0ZSh0aGlzLmNka1ZpcnR1YWxGb3JUcmFja0J5KTtcbiAgICB9XG4gICAgdGhpcy5fbmVlZHNVcGRhdGUgPSB0cnVlO1xuICB9XG5cbiAgLyoqIFN3YXAgb3V0IG9uZSBgRGF0YVNvdXJjZWAgZm9yIGFub3RoZXIuICovXG4gIHByaXZhdGUgX2NoYW5nZURhdGFTb3VyY2Uob2xkRHM6IERhdGFTb3VyY2U8VD4gfCBudWxsLCBuZXdEczogRGF0YVNvdXJjZTxUPiB8IG51bGwpOlxuICAgIE9ic2VydmFibGU8VFtdIHwgUmVhZG9ubHlBcnJheTxUPj4ge1xuXG4gICAgaWYgKG9sZERzKSB7XG4gICAgICBvbGREcy5kaXNjb25uZWN0KHRoaXMpO1xuICAgIH1cblxuICAgIHRoaXMuX25lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICByZXR1cm4gbmV3RHMgPyBuZXdEcy5jb25uZWN0KHRoaXMpIDogb2JzZXJ2YWJsZU9mKCk7XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSBgQ2RrVmlydHVhbEZvck9mQ29udGV4dGAgZm9yIGFsbCB2aWV3cy4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlQ29udGV4dCgpIHtcbiAgICBjb25zdCBjb3VudCA9IHRoaXMuX2RhdGEubGVuZ3RoO1xuICAgIGxldCBpID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgbGV0IHZpZXcgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmdldChpKSBhcyBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj47XG4gICAgICB2aWV3LmNvbnRleHQuaW5kZXggPSB0aGlzLl9yZW5kZXJlZFJhbmdlLnN0YXJ0ICsgaTtcbiAgICAgIHZpZXcuY29udGV4dC5jb3VudCA9IGNvdW50O1xuICAgICAgdGhpcy5fdXBkYXRlQ29tcHV0ZWRDb250ZXh0UHJvcGVydGllcyh2aWV3LmNvbnRleHQpO1xuICAgICAgdmlldy5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEFwcGx5IGNoYW5nZXMgdG8gdGhlIERPTS4gKi9cbiAgcHJpdmF0ZSBfYXBwbHlDaGFuZ2VzKGNoYW5nZXM6IEl0ZXJhYmxlQ2hhbmdlczxUPikge1xuICAgIC8vIFJlYXJyYW5nZSB0aGUgdmlld3MgdG8gcHV0IHRoZW0gaW4gdGhlIHJpZ2h0IGxvY2F0aW9uLlxuICAgIGNoYW5nZXMuZm9yRWFjaE9wZXJhdGlvbigocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZDxUPixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkanVzdGVkUHJldmlvdXNJbmRleDogbnVtYmVyIHwgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRJbmRleDogbnVtYmVyIHwgbnVsbCkgPT4ge1xuICAgICAgaWYgKHJlY29yZC5wcmV2aW91c0luZGV4ID09IG51bGwpIHsgIC8vIEl0ZW0gYWRkZWQuXG4gICAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLl9pbnNlcnRWaWV3Rm9yTmV3SXRlbShjdXJyZW50SW5kZXghKTtcbiAgICAgICAgdmlldy5jb250ZXh0LiRpbXBsaWNpdCA9IHJlY29yZC5pdGVtO1xuICAgICAgfSBlbHNlIGlmIChjdXJyZW50SW5kZXggPT0gbnVsbCkgeyAgLy8gSXRlbSByZW1vdmVkLlxuICAgICAgICB0aGlzLl9jYWNoZVZpZXcodGhpcy5fZGV0YWNoVmlldyhhZGp1c3RlZFByZXZpb3VzSW5kZXggISkpO1xuICAgICAgfSBlbHNlIHsgIC8vIEl0ZW0gbW92ZWQuXG4gICAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmdldChhZGp1c3RlZFByZXZpb3VzSW5kZXghKSBhc1xuICAgICAgICAgICAgRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+O1xuICAgICAgICB0aGlzLl92aWV3Q29udGFpbmVyUmVmLm1vdmUodmlldywgY3VycmVudEluZGV4KTtcbiAgICAgICAgdmlldy5jb250ZXh0LiRpbXBsaWNpdCA9IHJlY29yZC5pdGVtO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gVXBkYXRlICRpbXBsaWNpdCBmb3IgYW55IGl0ZW1zIHRoYXQgaGFkIGFuIGlkZW50aXR5IGNoYW5nZS5cbiAgICBjaGFuZ2VzLmZvckVhY2hJZGVudGl0eUNoYW5nZSgocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZDxUPikgPT4ge1xuICAgICAgY29uc3QgdmlldyA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuZ2V0KHJlY29yZC5jdXJyZW50SW5kZXghKSBhc1xuICAgICAgICAgIEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PjtcbiAgICAgIHZpZXcuY29udGV4dC4kaW1wbGljaXQgPSByZWNvcmQuaXRlbTtcbiAgICB9KTtcblxuICAgIC8vIFVwZGF0ZSB0aGUgY29udGV4dCB2YXJpYWJsZXMgb24gYWxsIGl0ZW1zLlxuICAgIGNvbnN0IGNvdW50ID0gdGhpcy5fZGF0YS5sZW5ndGg7XG4gICAgbGV0IGkgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICBjb25zdCB2aWV3ID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5nZXQoaSkgYXMgRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+O1xuICAgICAgdmlldy5jb250ZXh0LmluZGV4ID0gdGhpcy5fcmVuZGVyZWRSYW5nZS5zdGFydCArIGk7XG4gICAgICB2aWV3LmNvbnRleHQuY291bnQgPSBjb3VudDtcbiAgICAgIHRoaXMuX3VwZGF0ZUNvbXB1dGVkQ29udGV4dFByb3BlcnRpZXModmlldy5jb250ZXh0KTtcbiAgICB9XG4gIH1cblxuICAvKiogQ2FjaGUgdGhlIGdpdmVuIGRldGFjaGVkIHZpZXcuICovXG4gIHByaXZhdGUgX2NhY2hlVmlldyh2aWV3OiBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj4pIHtcbiAgICBpZiAodGhpcy5fdGVtcGxhdGVDYWNoZS5sZW5ndGggPCB0aGlzLmNka1ZpcnR1YWxGb3JUZW1wbGF0ZUNhY2hlU2l6ZSkge1xuICAgICAgdGhpcy5fdGVtcGxhdGVDYWNoZS5wdXNoKHZpZXcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBpbmRleCA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuaW5kZXhPZih2aWV3KTtcblxuICAgICAgLy8gSXQncyB2ZXJ5IHVubGlrZWx5IHRoYXQgdGhlIGluZGV4IHdpbGwgZXZlciBiZSAtMSwgYnV0IGp1c3QgaW4gY2FzZSxcbiAgICAgIC8vIGRlc3Ryb3kgdGhlIHZpZXcgb24gaXRzIG93biwgb3RoZXJ3aXNlIGRlc3Ryb3kgaXQgdGhyb3VnaCB0aGVcbiAgICAgIC8vIGNvbnRhaW5lciB0byBlbnN1cmUgdGhhdCBhbGwgdGhlIHJlZmVyZW5jZXMgYXJlIHJlbW92ZWQuXG4gICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgIHZpZXcuZGVzdHJveSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fdmlld0NvbnRhaW5lclJlZi5yZW1vdmUoaW5kZXgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBJbnNlcnRzIGEgdmlldyBmb3IgYSBuZXcgaXRlbSwgZWl0aGVyIGZyb20gdGhlIGNhY2hlIG9yIGJ5IGNyZWF0aW5nIGEgbmV3IG9uZS4gKi9cbiAgcHJpdmF0ZSBfaW5zZXJ0Vmlld0Zvck5ld0l0ZW0oaW5kZXg6IG51bWJlcik6IEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PiB7XG4gICAgcmV0dXJuIHRoaXMuX2luc2VydFZpZXdGcm9tQ2FjaGUoaW5kZXgpIHx8IHRoaXMuX2NyZWF0ZUVtYmVkZGVkVmlld0F0KGluZGV4KTtcbiAgfVxuXG4gIC8qKiBVcGRhdGUgdGhlIGNvbXB1dGVkIHByb3BlcnRpZXMgb24gdGhlIGBDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0YC4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlQ29tcHV0ZWRDb250ZXh0UHJvcGVydGllcyhjb250ZXh0OiBDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PGFueT4pIHtcbiAgICBjb250ZXh0LmZpcnN0ID0gY29udGV4dC5pbmRleCA9PT0gMDtcbiAgICBjb250ZXh0Lmxhc3QgPSBjb250ZXh0LmluZGV4ID09PSBjb250ZXh0LmNvdW50IC0gMTtcbiAgICBjb250ZXh0LmV2ZW4gPSBjb250ZXh0LmluZGV4ICUgMiA9PT0gMDtcbiAgICBjb250ZXh0Lm9kZCA9ICFjb250ZXh0LmV2ZW47XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG5ldyBlbWJlZGRlZCB2aWV3IGFuZCBtb3ZlcyBpdCB0byB0aGUgZ2l2ZW4gaW5kZXggKi9cbiAgcHJpdmF0ZSBfY3JlYXRlRW1iZWRkZWRWaWV3QXQoaW5kZXg6IG51bWJlcik6IEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PiB7XG4gICAgLy8gTm90ZSB0aGF0IGl0J3MgaW1wb3J0YW50IHRoYXQgd2UgaW5zZXJ0IHRoZSBpdGVtIGRpcmVjdGx5IGF0IHRoZSBwcm9wZXIgaW5kZXgsXG4gICAgLy8gcmF0aGVyIHRoYW4gaW5zZXJ0aW5nIGl0IGFuZCB0aGUgbW92aW5nIGl0IGluIHBsYWNlLCBiZWNhdXNlIGlmIHRoZXJlJ3MgYSBkaXJlY3RpdmVcbiAgICAvLyBvbiB0aGUgc2FtZSBub2RlIHRoYXQgaW5qZWN0cyB0aGUgYFZpZXdDb250YWluZXJSZWZgLCBBbmd1bGFyIHdpbGwgaW5zZXJ0IGFub3RoZXJcbiAgICAvLyBjb21tZW50IG5vZGUgd2hpY2ggY2FuIHRocm93IG9mZiB0aGUgbW92ZSB3aGVuIGl0J3MgYmVpbmcgcmVwZWF0ZWQgZm9yIGFsbCBpdGVtcy5cbiAgICByZXR1cm4gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5jcmVhdGVFbWJlZGRlZFZpZXcodGhpcy5fdGVtcGxhdGUsIHtcbiAgICAgICRpbXBsaWNpdDogbnVsbCEsXG4gICAgICAvLyBJdCdzIGd1YXJhbnRlZWQgdGhhdCB0aGUgaXRlcmFibGUgaXMgbm90IFwidW5kZWZpbmVkXCIgb3IgXCJudWxsXCIgYmVjYXVzZSB3ZSBvbmx5XG4gICAgICAvLyBnZW5lcmF0ZSB2aWV3cyBmb3IgZWxlbWVudHMgaWYgdGhlIFwiY2RrVmlydHVhbEZvck9mXCIgaXRlcmFibGUgaGFzIGVsZW1lbnRzLlxuICAgICAgY2RrVmlydHVhbEZvck9mOiB0aGlzLl9jZGtWaXJ0dWFsRm9yT2YhLFxuICAgICAgaW5kZXg6IC0xLFxuICAgICAgY291bnQ6IC0xLFxuICAgICAgZmlyc3Q6IGZhbHNlLFxuICAgICAgbGFzdDogZmFsc2UsXG4gICAgICBvZGQ6IGZhbHNlLFxuICAgICAgZXZlbjogZmFsc2VcbiAgICB9LCBpbmRleCk7XG4gIH1cblxuICAvKiogSW5zZXJ0cyBhIHJlY3ljbGVkIHZpZXcgZnJvbSB0aGUgY2FjaGUgYXQgdGhlIGdpdmVuIGluZGV4LiAqL1xuICBwcml2YXRlIF9pbnNlcnRWaWV3RnJvbUNhY2hlKGluZGV4OiBudW1iZXIpOiBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj58bnVsbCB7XG4gICAgY29uc3QgY2FjaGVkVmlldyA9IHRoaXMuX3RlbXBsYXRlQ2FjaGUucG9wKCk7XG4gICAgaWYgKGNhY2hlZFZpZXcpIHtcbiAgICAgIHRoaXMuX3ZpZXdDb250YWluZXJSZWYuaW5zZXJ0KGNhY2hlZFZpZXcsIGluZGV4KTtcbiAgICB9XG4gICAgcmV0dXJuIGNhY2hlZFZpZXcgfHwgbnVsbDtcbiAgfVxuXG4gIC8qKiBEZXRhY2hlcyB0aGUgZW1iZWRkZWQgdmlldyBhdCB0aGUgZ2l2ZW4gaW5kZXguICovXG4gIHByaXZhdGUgX2RldGFjaFZpZXcoaW5kZXg6IG51bWJlcik6IEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PiB7XG4gICAgcmV0dXJuIHRoaXMuX3ZpZXdDb250YWluZXJSZWYuZGV0YWNoKGluZGV4KSBhc1xuICAgICAgICBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj47XG4gIH1cbn1cbiJdfQ==