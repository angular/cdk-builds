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
            cdkVirtualForOf: this._cdkVirtualForOf,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1mb3Itb2YuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy92aXJ0dWFsLWZvci1vZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFDTCxlQUFlLEVBSWYsWUFBWSxHQUNiLE1BQU0sMEJBQTBCLENBQUM7QUFDbEMsT0FBTyxFQUNMLFNBQVMsRUFHVCxLQUFLLEVBSUwsZUFBZSxFQUVmLE1BQU0sRUFFTixRQUFRLEVBQ1IsV0FBVyxFQUVYLGdCQUFnQixHQUNqQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxFQUFFLElBQUksWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQzdELE9BQU8sRUFBQyxRQUFRLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDdEYsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0sMkJBQTJCLENBQUM7Ozs7Ozs7QUF5Qm5FLFNBQVMsT0FBTyxDQUFDLFdBQXNDLEVBQUUsSUFBVTs7VUFDM0QsRUFBRSxHQUFHLG1CQUFBLElBQUksRUFBVztJQUMxQixJQUFJLENBQUMsRUFBRSxDQUFDLHFCQUFxQixFQUFFO1FBQzdCLE9BQU8sQ0FBQyxDQUFDO0tBQ1Y7O1VBQ0ssSUFBSSxHQUFHLEVBQUUsQ0FBQyxxQkFBcUIsRUFBRTtJQUN2QyxPQUFPLFdBQVcsSUFBSSxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDaEUsQ0FBQzs7Ozs7O0FBVUQsTUFBTSxPQUFPLGVBQWU7Ozs7Ozs7O0lBMkYxQixZQUVZLGlCQUFtQyxFQUVuQyxTQUFpRCxFQUVqRCxRQUF5QixFQUViLFNBQW1DLEVBQ3ZELE1BQWM7UUFQTixzQkFB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QWlCLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNsRDtRQUNELE9BQU8sVUFBVSxJQUFJLElBQUksQ0FBQztJQUM1QixDQUFDOzs7Ozs7O0lBR08sV0FBVyxDQUFDLEtBQWE7UUFDL0IsT0FBTyxtQkFBQSxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUNHLENBQUM7SUFDakQsQ0FBQzs7O1lBM1RGLFNBQVMsU0FBQztnQkFDVCxRQUFRLEVBQUUsa0NBQWtDO2FBQzdDOzs7O1lBN0NDLGdCQUFnQjtZQUZoQixXQUFXO1lBTFgsZUFBZTtZQVdULHdCQUF3Qix1QkE2SXpCLFFBQVE7WUF0SmIsTUFBTTs7OzhCQTJETCxLQUFLO21DQWtCTCxLQUFLO29DQWFMLEtBQUs7NkNBWUwsS0FBSzs7Ozs7OztJQWpETixxQ0FBc0M7Ozs7OztJQUd0Qyw2Q0FBMEQ7O0lBZTFELDJDQUFrRTs7Ozs7SUFnQmxFLGdEQUE4RDs7Ozs7O0lBZTlELHlEQUFxRDs7Ozs7SUFHckQscUNBV3dCOzs7Ozs7SUFHeEIsa0NBQWlEOzs7Ozs7SUFHakQsZ0NBQXNDOzs7Ozs7SUFHdEMseUNBQTRCOzs7Ozs7SUFHNUIseUNBQWtDOzs7Ozs7OztJQU9sQyx5Q0FBMEU7Ozs7OztJQUcxRSx1Q0FBNkI7Ozs7O0lBRTdCLHFDQUF5Qzs7Ozs7O0lBSXJDLDRDQUEyQzs7Ozs7O0lBRTNDLG9DQUF5RDs7Ozs7O0lBRXpELG1DQUFpQzs7Ozs7O0lBRWpDLG9DQUF1RCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBBcnJheURhdGFTb3VyY2UsXG4gIENvbGxlY3Rpb25WaWV3ZXIsXG4gIERhdGFTb3VyY2UsXG4gIExpc3RSYW5nZSxcbiAgaXNEYXRhU291cmNlLFxufSBmcm9tICdAYW5ndWxhci9jZGsvY29sbGVjdGlvbnMnO1xuaW1wb3J0IHtcbiAgRGlyZWN0aXZlLFxuICBEb0NoZWNrLFxuICBFbWJlZGRlZFZpZXdSZWYsXG4gIElucHV0LFxuICBJdGVyYWJsZUNoYW5nZVJlY29yZCxcbiAgSXRlcmFibGVDaGFuZ2VzLFxuICBJdGVyYWJsZURpZmZlcixcbiAgSXRlcmFibGVEaWZmZXJzLFxuICBOZ0l0ZXJhYmxlLFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgU2tpcFNlbGYsXG4gIFRlbXBsYXRlUmVmLFxuICBUcmFja0J5RnVuY3Rpb24sXG4gIFZpZXdDb250YWluZXJSZWYsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJqZWN0LCBvZiBhcyBvYnNlcnZhYmxlT2Z9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtwYWlyd2lzZSwgc2hhcmVSZXBsYXksIHN0YXJ0V2l0aCwgc3dpdGNoTWFwLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7Q2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0fSBmcm9tICcuL3ZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0JztcblxuXG4vKiogVGhlIGNvbnRleHQgZm9yIGFuIGl0ZW0gcmVuZGVyZWQgYnkgYENka1ZpcnR1YWxGb3JPZmAgKi9cbmV4cG9ydCB0eXBlIENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4gPSB7XG4gIC8qKiBUaGUgaXRlbSB2YWx1ZS4gKi9cbiAgJGltcGxpY2l0OiBUO1xuICAvKiogVGhlIERhdGFTb3VyY2UsIE9ic2VydmFibGUsIG9yIE5nSXRlcmFibGUgdGhhdCB3YXMgcGFzc2VkIHRvICpjZGtWaXJ0dWFsRm9yLiAqL1xuICBjZGtWaXJ0dWFsRm9yT2Y6IERhdGFTb3VyY2U8VD4gfCBPYnNlcnZhYmxlPFRbXT4gfCBOZ0l0ZXJhYmxlPFQ+O1xuICAvKiogVGhlIGluZGV4IG9mIHRoZSBpdGVtIGluIHRoZSBEYXRhU291cmNlLiAqL1xuICBpbmRleDogbnVtYmVyO1xuICAvKiogVGhlIG51bWJlciBvZiBpdGVtcyBpbiB0aGUgRGF0YVNvdXJjZS4gKi9cbiAgY291bnQ6IG51bWJlcjtcbiAgLyoqIFdoZXRoZXIgdGhpcyBpcyB0aGUgZmlyc3QgaXRlbSBpbiB0aGUgRGF0YVNvdXJjZS4gKi9cbiAgZmlyc3Q6IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIHRoaXMgaXMgdGhlIGxhc3QgaXRlbSBpbiB0aGUgRGF0YVNvdXJjZS4gKi9cbiAgbGFzdDogYm9vbGVhbjtcbiAgLyoqIFdoZXRoZXIgdGhlIGluZGV4IGlzIGV2ZW4uICovXG4gIGV2ZW46IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIHRoZSBpbmRleCBpcyBvZGQuICovXG4gIG9kZDogYm9vbGVhbjtcbn07XG5cblxuLyoqIEhlbHBlciB0byBleHRyYWN0IHNpemUgZnJvbSBhIERPTSBOb2RlLiAqL1xuZnVuY3Rpb24gZ2V0U2l6ZShvcmllbnRhdGlvbjogJ2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJywgbm9kZTogTm9kZSk6IG51bWJlciB7XG4gIGNvbnN0IGVsID0gbm9kZSBhcyBFbGVtZW50O1xuICBpZiAoIWVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCkge1xuICAgIHJldHVybiAwO1xuICB9XG4gIGNvbnN0IHJlY3QgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgcmV0dXJuIG9yaWVudGF0aW9uID09ICdob3Jpem9udGFsJyA/IHJlY3Qud2lkdGggOiByZWN0LmhlaWdodDtcbn1cblxuXG4vKipcbiAqIEEgZGlyZWN0aXZlIHNpbWlsYXIgdG8gYG5nRm9yT2ZgIHRvIGJlIHVzZWQgZm9yIHJlbmRlcmluZyBkYXRhIGluc2lkZSBhIHZpcnR1YWwgc2Nyb2xsaW5nXG4gKiBjb250YWluZXIuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtWaXJ0dWFsRm9yXVtjZGtWaXJ0dWFsRm9yT2ZdJyxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrVmlydHVhbEZvck9mPFQ+IGltcGxlbWVudHMgQ29sbGVjdGlvblZpZXdlciwgRG9DaGVjaywgT25EZXN0cm95IHtcbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHJlbmRlcmVkIHZpZXcgb2YgdGhlIGRhdGEgY2hhbmdlcy4gKi9cbiAgdmlld0NoYW5nZSA9IG5ldyBTdWJqZWN0PExpc3RSYW5nZT4oKTtcblxuICAvKiogU3ViamVjdCB0aGF0IGVtaXRzIHdoZW4gYSBuZXcgRGF0YVNvdXJjZSBpbnN0YW5jZSBpcyBnaXZlbi4gKi9cbiAgcHJpdmF0ZSBfZGF0YVNvdXJjZUNoYW5nZXMgPSBuZXcgU3ViamVjdDxEYXRhU291cmNlPFQ+PigpO1xuXG4gIC8qKiBUaGUgRGF0YVNvdXJjZSB0byBkaXNwbGF5LiAqL1xuICBASW5wdXQoKVxuICBnZXQgY2RrVmlydHVhbEZvck9mKCk6IERhdGFTb3VyY2U8VD4gfCBPYnNlcnZhYmxlPFRbXT4gfCBOZ0l0ZXJhYmxlPFQ+IHtcbiAgICByZXR1cm4gdGhpcy5fY2RrVmlydHVhbEZvck9mO1xuICB9XG4gIHNldCBjZGtWaXJ0dWFsRm9yT2YodmFsdWU6IERhdGFTb3VyY2U8VD4gfCBPYnNlcnZhYmxlPFRbXT4gfCBOZ0l0ZXJhYmxlPFQ+KSB7XG4gICAgdGhpcy5fY2RrVmlydHVhbEZvck9mID0gdmFsdWU7XG4gICAgY29uc3QgZHMgPSBpc0RhdGFTb3VyY2UodmFsdWUpID8gdmFsdWUgOlxuICAgICAgICAvLyBTbGljZSB0aGUgdmFsdWUgaWYgaXRzIGFuIE5nSXRlcmFibGUgdG8gZW5zdXJlIHdlJ3JlIHdvcmtpbmcgd2l0aCBhbiBhcnJheS5cbiAgICAgICAgbmV3IEFycmF5RGF0YVNvdXJjZTxUPihcbiAgICAgICAgICAgIHZhbHVlIGluc3RhbmNlb2YgT2JzZXJ2YWJsZSA/IHZhbHVlIDogQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwodmFsdWUgfHwgW10pKTtcbiAgICB0aGlzLl9kYXRhU291cmNlQ2hhbmdlcy5uZXh0KGRzKTtcbiAgfVxuICBfY2RrVmlydHVhbEZvck9mOiBEYXRhU291cmNlPFQ+IHwgT2JzZXJ2YWJsZTxUW10+IHwgTmdJdGVyYWJsZTxUPjtcblxuICAvKipcbiAgICogVGhlIGBUcmFja0J5RnVuY3Rpb25gIHRvIHVzZSBmb3IgdHJhY2tpbmcgY2hhbmdlcy4gVGhlIGBUcmFja0J5RnVuY3Rpb25gIHRha2VzIHRoZSBpbmRleCBhbmRcbiAgICogdGhlIGl0ZW0gYW5kIHByb2R1Y2VzIGEgdmFsdWUgdG8gYmUgdXNlZCBhcyB0aGUgaXRlbSdzIGlkZW50aXR5IHdoZW4gdHJhY2tpbmcgY2hhbmdlcy5cbiAgICovXG4gIEBJbnB1dCgpXG4gIGdldCBjZGtWaXJ0dWFsRm9yVHJhY2tCeSgpOiBUcmFja0J5RnVuY3Rpb248VD4gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9jZGtWaXJ0dWFsRm9yVHJhY2tCeTtcbiAgfVxuICBzZXQgY2RrVmlydHVhbEZvclRyYWNrQnkoZm46IFRyYWNrQnlGdW5jdGlvbjxUPiB8IHVuZGVmaW5lZCkge1xuICAgIHRoaXMuX25lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICB0aGlzLl9jZGtWaXJ0dWFsRm9yVHJhY2tCeSA9IGZuID9cbiAgICAgICAgKGluZGV4LCBpdGVtKSA9PiBmbihpbmRleCArICh0aGlzLl9yZW5kZXJlZFJhbmdlID8gdGhpcy5fcmVuZGVyZWRSYW5nZS5zdGFydCA6IDApLCBpdGVtKSA6XG4gICAgICAgIHVuZGVmaW5lZDtcbiAgfVxuICBwcml2YXRlIF9jZGtWaXJ0dWFsRm9yVHJhY2tCeTogVHJhY2tCeUZ1bmN0aW9uPFQ+IHwgdW5kZWZpbmVkO1xuXG4gIC8qKiBUaGUgdGVtcGxhdGUgdXNlZCB0byBzdGFtcCBvdXQgbmV3IGVsZW1lbnRzLiAqL1xuICBASW5wdXQoKVxuICBzZXQgY2RrVmlydHVhbEZvclRlbXBsYXRlKHZhbHVlOiBUZW1wbGF0ZVJlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+Pikge1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgdGhpcy5fbmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgICAgdGhpcy5fdGVtcGxhdGUgPSB2YWx1ZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGhlIHNpemUgb2YgdGhlIGNhY2hlIHVzZWQgdG8gc3RvcmUgdGVtcGxhdGVzIHRoYXQgYXJlIG5vdCBiZWluZyB1c2VkIGZvciByZS11c2UgbGF0ZXIuXG4gICAqIFNldHRpbmcgdGhlIGNhY2hlIHNpemUgdG8gYDBgIHdpbGwgZGlzYWJsZSBjYWNoaW5nLiBEZWZhdWx0cyB0byAyMCB0ZW1wbGF0ZXMuXG4gICAqL1xuICBASW5wdXQoKSBjZGtWaXJ0dWFsRm9yVGVtcGxhdGVDYWNoZVNpemU6IG51bWJlciA9IDIwO1xuXG4gIC8qKiBFbWl0cyB3aGVuZXZlciB0aGUgZGF0YSBpbiB0aGUgY3VycmVudCBEYXRhU291cmNlIGNoYW5nZXMuICovXG4gIGRhdGFTdHJlYW06IE9ic2VydmFibGU8VFtdIHwgUmVhZG9ubHlBcnJheTxUPj4gPSB0aGlzLl9kYXRhU291cmNlQ2hhbmdlc1xuICAgICAgLnBpcGUoXG4gICAgICAgICAgLy8gU3RhcnQgb2ZmIHdpdGggbnVsbCBgRGF0YVNvdXJjZWAuXG4gICAgICAgICAgc3RhcnRXaXRoKG51bGwhKSxcbiAgICAgICAgICAvLyBCdW5kbGUgdXAgdGhlIHByZXZpb3VzIGFuZCBjdXJyZW50IGRhdGEgc291cmNlcyBzbyB3ZSBjYW4gd29yayB3aXRoIGJvdGguXG4gICAgICAgICAgcGFpcndpc2UoKSxcbiAgICAgICAgICAvLyBVc2UgYF9jaGFuZ2VEYXRhU291cmNlYCB0byBkaXNjb25uZWN0IGZyb20gdGhlIHByZXZpb3VzIGRhdGEgc291cmNlIGFuZCBjb25uZWN0IHRvIHRoZVxuICAgICAgICAgIC8vIG5ldyBvbmUsIHBhc3NpbmcgYmFjayBhIHN0cmVhbSBvZiBkYXRhIGNoYW5nZXMgd2hpY2ggd2UgcnVuIHRocm91Z2ggYHN3aXRjaE1hcGAgdG8gZ2l2ZVxuICAgICAgICAgIC8vIHVzIGEgZGF0YSBzdHJlYW0gdGhhdCBlbWl0cyB0aGUgbGF0ZXN0IGRhdGEgZnJvbSB3aGF0ZXZlciB0aGUgY3VycmVudCBgRGF0YVNvdXJjZWAgaXMuXG4gICAgICAgICAgc3dpdGNoTWFwKChbcHJldiwgY3VyXSkgPT4gdGhpcy5fY2hhbmdlRGF0YVNvdXJjZShwcmV2LCBjdXIpKSxcbiAgICAgICAgICAvLyBSZXBsYXkgdGhlIGxhc3QgZW1pdHRlZCBkYXRhIHdoZW4gc29tZW9uZSBzdWJzY3JpYmVzLlxuICAgICAgICAgIHNoYXJlUmVwbGF5KDEpKTtcblxuICAvKiogVGhlIGRpZmZlciB1c2VkIHRvIGNhbGN1bGF0ZSBjaGFuZ2VzIHRvIHRoZSBkYXRhLiAqL1xuICBwcml2YXRlIF9kaWZmZXI6IEl0ZXJhYmxlRGlmZmVyPFQ+IHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIFRoZSBtb3N0IHJlY2VudCBkYXRhIGVtaXR0ZWQgZnJvbSB0aGUgRGF0YVNvdXJjZS4gKi9cbiAgcHJpdmF0ZSBfZGF0YTogVFtdIHwgUmVhZG9ubHlBcnJheTxUPjtcblxuICAvKiogVGhlIGN1cnJlbnRseSByZW5kZXJlZCBpdGVtcy4gKi9cbiAgcHJpdmF0ZSBfcmVuZGVyZWRJdGVtczogVFtdO1xuXG4gIC8qKiBUaGUgY3VycmVudGx5IHJlbmRlcmVkIHJhbmdlIG9mIGluZGljZXMuICovXG4gIHByaXZhdGUgX3JlbmRlcmVkUmFuZ2U6IExpc3RSYW5nZTtcblxuICAvKipcbiAgICogVGhlIHRlbXBsYXRlIGNhY2hlIHVzZWQgdG8gaG9sZCBvbiBvdCB0ZW1wbGF0ZSBpbnN0YW5jZXNzIHRoYXQgaGF2ZSBiZWVuIHN0YW1wZWQgb3V0LCBidXQgZG9uJ3RcbiAgICogY3VycmVudGx5IG5lZWQgdG8gYmUgcmVuZGVyZWQuIFRoZXNlIGluc3RhbmNlcyB3aWxsIGJlIHJldXNlZCBpbiB0aGUgZnV0dXJlIHJhdGhlciB0aGFuXG4gICAqIHN0YW1waW5nIG91dCBicmFuZCBuZXcgb25lcy5cbiAgICovXG4gIHByaXZhdGUgX3RlbXBsYXRlQ2FjaGU6IEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PltdID0gW107XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHJlbmRlcmVkIGRhdGEgc2hvdWxkIGJlIHVwZGF0ZWQgZHVyaW5nIHRoZSBuZXh0IG5nRG9DaGVjayBjeWNsZS4gKi9cbiAgcHJpdmF0ZSBfbmVlZHNVcGRhdGUgPSBmYWxzZTtcblxuICBwcml2YXRlIF9kZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgLyoqIFRoZSB2aWV3IGNvbnRhaW5lciB0byBhZGQgaXRlbXMgdG8uICovXG4gICAgICBwcml2YXRlIF92aWV3Q29udGFpbmVyUmVmOiBWaWV3Q29udGFpbmVyUmVmLFxuICAgICAgLyoqIFRoZSB0ZW1wbGF0ZSB0byB1c2Ugd2hlbiBzdGFtcGluZyBvdXQgbmV3IGl0ZW1zLiAqL1xuICAgICAgcHJpdmF0ZSBfdGVtcGxhdGU6IFRlbXBsYXRlUmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+LFxuICAgICAgLyoqIFRoZSBzZXQgb2YgYXZhaWxhYmxlIGRpZmZlcnMuICovXG4gICAgICBwcml2YXRlIF9kaWZmZXJzOiBJdGVyYWJsZURpZmZlcnMsXG4gICAgICAvKiogVGhlIHZpcnR1YWwgc2Nyb2xsaW5nIHZpZXdwb3J0IHRoYXQgdGhlc2UgaXRlbXMgYXJlIGJlaW5nIHJlbmRlcmVkIGluLiAqL1xuICAgICAgQFNraXBTZWxmKCkgcHJpdmF0ZSBfdmlld3BvcnQ6IENka1ZpcnR1YWxTY3JvbGxWaWV3cG9ydCxcbiAgICAgIG5nWm9uZTogTmdab25lKSB7XG4gICAgdGhpcy5kYXRhU3RyZWFtLnN1YnNjcmliZShkYXRhID0+IHtcbiAgICAgIHRoaXMuX2RhdGEgPSBkYXRhO1xuICAgICAgdGhpcy5fb25SZW5kZXJlZERhdGFDaGFuZ2UoKTtcbiAgICB9KTtcbiAgICB0aGlzLl92aWV3cG9ydC5yZW5kZXJlZFJhbmdlU3RyZWFtLnBpcGUodGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpLnN1YnNjcmliZShyYW5nZSA9PiB7XG4gICAgICB0aGlzLl9yZW5kZXJlZFJhbmdlID0gcmFuZ2U7XG4gICAgICBuZ1pvbmUucnVuKCgpID0+IHRoaXMudmlld0NoYW5nZS5uZXh0KHRoaXMuX3JlbmRlcmVkUmFuZ2UpKTtcbiAgICAgIHRoaXMuX29uUmVuZGVyZWREYXRhQ2hhbmdlKCk7XG4gICAgfSk7XG4gICAgdGhpcy5fdmlld3BvcnQuYXR0YWNoKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIE1lYXN1cmVzIHRoZSBjb21iaW5lZCBzaXplICh3aWR0aCBmb3IgaG9yaXpvbnRhbCBvcmllbnRhdGlvbiwgaGVpZ2h0IGZvciB2ZXJ0aWNhbCkgb2YgYWxsIGl0ZW1zXG4gICAqIGluIHRoZSBzcGVjaWZpZWQgcmFuZ2UuIFRocm93cyBhbiBlcnJvciBpZiB0aGUgcmFuZ2UgaW5jbHVkZXMgaXRlbXMgdGhhdCBhcmUgbm90IGN1cnJlbnRseVxuICAgKiByZW5kZXJlZC5cbiAgICovXG4gIG1lYXN1cmVSYW5nZVNpemUocmFuZ2U6IExpc3RSYW5nZSwgb3JpZW50YXRpb246ICdob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCcpOiBudW1iZXIge1xuICAgIGlmIChyYW5nZS5zdGFydCA+PSByYW5nZS5lbmQpIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBpZiAocmFuZ2Uuc3RhcnQgPCB0aGlzLl9yZW5kZXJlZFJhbmdlLnN0YXJ0IHx8IHJhbmdlLmVuZCA+IHRoaXMuX3JlbmRlcmVkUmFuZ2UuZW5kKSB7XG4gICAgICB0aHJvdyBFcnJvcihgRXJyb3I6IGF0dGVtcHRlZCB0byBtZWFzdXJlIGFuIGl0ZW0gdGhhdCBpc24ndCByZW5kZXJlZC5gKTtcbiAgICB9XG5cbiAgICAvLyBUaGUgaW5kZXggaW50byB0aGUgbGlzdCBvZiByZW5kZXJlZCB2aWV3cyBmb3IgdGhlIGZpcnN0IGl0ZW0gaW4gdGhlIHJhbmdlLlxuICAgIGNvbnN0IHJlbmRlcmVkU3RhcnRJbmRleCA9IHJhbmdlLnN0YXJ0IC0gdGhpcy5fcmVuZGVyZWRSYW5nZS5zdGFydDtcbiAgICAvLyBUaGUgbGVuZ3RoIG9mIHRoZSByYW5nZSB3ZSdyZSBtZWFzdXJpbmcuXG4gICAgY29uc3QgcmFuZ2VMZW4gPSByYW5nZS5lbmQgLSByYW5nZS5zdGFydDtcblxuICAgIC8vIExvb3Agb3ZlciBhbGwgcm9vdCBub2RlcyBmb3IgYWxsIGl0ZW1zIGluIHRoZSByYW5nZSBhbmQgc3VtIHVwIHRoZWlyIHNpemUuXG4gICAgbGV0IHRvdGFsU2l6ZSA9IDA7XG4gICAgbGV0IGkgPSByYW5nZUxlbjtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICBjb25zdCB2aWV3ID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5nZXQoaSArIHJlbmRlcmVkU3RhcnRJbmRleCkgYXNcbiAgICAgICAgICBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj4gfCBudWxsO1xuICAgICAgbGV0IGogPSB2aWV3ID8gdmlldy5yb290Tm9kZXMubGVuZ3RoIDogMDtcbiAgICAgIHdoaWxlIChqLS0pIHtcbiAgICAgICAgdG90YWxTaXplICs9IGdldFNpemUob3JpZW50YXRpb24sIHZpZXchLnJvb3ROb2Rlc1tqXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRvdGFsU2l6ZTtcbiAgfVxuXG4gIG5nRG9DaGVjaygpIHtcbiAgICBpZiAodGhpcy5fZGlmZmVyICYmIHRoaXMuX25lZWRzVXBkYXRlKSB7XG4gICAgICAvLyBUT0RPKG1tYWxlcmJhKTogV2Ugc2hvdWxkIGRpZmZlcmVudGlhdGUgbmVlZHMgdXBkYXRlIGR1ZSB0byBzY3JvbGxpbmcgYW5kIGEgbmV3IHBvcnRpb24gb2ZcbiAgICAgIC8vIHRoaXMgbGlzdCBiZWluZyByZW5kZXJlZCAoY2FuIHVzZSBzaW1wbGVyIGFsZ29yaXRobSkgdnMgbmVlZHMgdXBkYXRlIGR1ZSB0byBkYXRhIGFjdHVhbGx5XG4gICAgICAvLyBjaGFuZ2luZyAobmVlZCB0byBkbyB0aGlzIGRpZmYpLlxuICAgICAgY29uc3QgY2hhbmdlcyA9IHRoaXMuX2RpZmZlci5kaWZmKHRoaXMuX3JlbmRlcmVkSXRlbXMpO1xuICAgICAgaWYgKCFjaGFuZ2VzKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUNvbnRleHQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2FwcGx5Q2hhbmdlcyhjaGFuZ2VzKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX25lZWRzVXBkYXRlID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fdmlld3BvcnQuZGV0YWNoKCk7XG5cbiAgICB0aGlzLl9kYXRhU291cmNlQ2hhbmdlcy5uZXh0KCk7XG4gICAgdGhpcy5fZGF0YVNvdXJjZUNoYW5nZXMuY29tcGxldGUoKTtcbiAgICB0aGlzLnZpZXdDaGFuZ2UuY29tcGxldGUoKTtcblxuICAgIHRoaXMuX2Rlc3Ryb3llZC5uZXh0KCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLmNvbXBsZXRlKCk7XG5cbiAgICBmb3IgKGxldCB2aWV3IG9mIHRoaXMuX3RlbXBsYXRlQ2FjaGUpIHtcbiAgICAgIHZpZXcuZGVzdHJveSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSZWFjdCB0byBzY3JvbGwgc3RhdGUgY2hhbmdlcyBpbiB0aGUgdmlld3BvcnQuICovXG4gIHByaXZhdGUgX29uUmVuZGVyZWREYXRhQ2hhbmdlKCkge1xuICAgIGlmICghdGhpcy5fcmVuZGVyZWRSYW5nZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9yZW5kZXJlZEl0ZW1zID0gdGhpcy5fZGF0YS5zbGljZSh0aGlzLl9yZW5kZXJlZFJhbmdlLnN0YXJ0LCB0aGlzLl9yZW5kZXJlZFJhbmdlLmVuZCk7XG4gICAgaWYgKCF0aGlzLl9kaWZmZXIpIHtcbiAgICAgIHRoaXMuX2RpZmZlciA9IHRoaXMuX2RpZmZlcnMuZmluZCh0aGlzLl9yZW5kZXJlZEl0ZW1zKS5jcmVhdGUodGhpcy5jZGtWaXJ0dWFsRm9yVHJhY2tCeSk7XG4gICAgfVxuICAgIHRoaXMuX25lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKiBTd2FwIG91dCBvbmUgYERhdGFTb3VyY2VgIGZvciBhbm90aGVyLiAqL1xuICBwcml2YXRlIF9jaGFuZ2VEYXRhU291cmNlKG9sZERzOiBEYXRhU291cmNlPFQ+IHwgbnVsbCwgbmV3RHM6IERhdGFTb3VyY2U8VD4gfCBudWxsKTpcbiAgICBPYnNlcnZhYmxlPFRbXSB8IFJlYWRvbmx5QXJyYXk8VD4+IHtcblxuICAgIGlmIChvbGREcykge1xuICAgICAgb2xkRHMuZGlzY29ubmVjdCh0aGlzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgcmV0dXJuIG5ld0RzID8gbmV3RHMuY29ubmVjdCh0aGlzKSA6IG9ic2VydmFibGVPZigpO1xuICB9XG5cbiAgLyoqIFVwZGF0ZSB0aGUgYENka1ZpcnR1YWxGb3JPZkNvbnRleHRgIGZvciBhbGwgdmlld3MuICovXG4gIHByaXZhdGUgX3VwZGF0ZUNvbnRleHQoKSB7XG4gICAgY29uc3QgY291bnQgPSB0aGlzLl9kYXRhLmxlbmd0aDtcbiAgICBsZXQgaSA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGxldCB2aWV3ID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5nZXQoaSkgYXMgRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+O1xuICAgICAgdmlldy5jb250ZXh0LmluZGV4ID0gdGhpcy5fcmVuZGVyZWRSYW5nZS5zdGFydCArIGk7XG4gICAgICB2aWV3LmNvbnRleHQuY291bnQgPSBjb3VudDtcbiAgICAgIHRoaXMuX3VwZGF0ZUNvbXB1dGVkQ29udGV4dFByb3BlcnRpZXModmlldy5jb250ZXh0KTtcbiAgICAgIHZpZXcuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBBcHBseSBjaGFuZ2VzIHRvIHRoZSBET00uICovXG4gIHByaXZhdGUgX2FwcGx5Q2hhbmdlcyhjaGFuZ2VzOiBJdGVyYWJsZUNoYW5nZXM8VD4pIHtcbiAgICAvLyBSZWFycmFuZ2UgdGhlIHZpZXdzIHRvIHB1dCB0aGVtIGluIHRoZSByaWdodCBsb2NhdGlvbi5cbiAgICBjaGFuZ2VzLmZvckVhY2hPcGVyYXRpb24oKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8VD4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGp1c3RlZFByZXZpb3VzSW5kZXg6IG51bWJlciB8IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50SW5kZXg6IG51bWJlciB8IG51bGwpID0+IHtcbiAgICAgIGlmIChyZWNvcmQucHJldmlvdXNJbmRleCA9PSBudWxsKSB7ICAvLyBJdGVtIGFkZGVkLlxuICAgICAgICBjb25zdCB2aWV3ID0gdGhpcy5faW5zZXJ0Vmlld0Zvck5ld0l0ZW0oY3VycmVudEluZGV4ISk7XG4gICAgICAgIHZpZXcuY29udGV4dC4kaW1wbGljaXQgPSByZWNvcmQuaXRlbTtcbiAgICAgIH0gZWxzZSBpZiAoY3VycmVudEluZGV4ID09IG51bGwpIHsgIC8vIEl0ZW0gcmVtb3ZlZC5cbiAgICAgICAgdGhpcy5fY2FjaGVWaWV3KHRoaXMuX2RldGFjaFZpZXcoYWRqdXN0ZWRQcmV2aW91c0luZGV4ICEpKTtcbiAgICAgIH0gZWxzZSB7ICAvLyBJdGVtIG1vdmVkLlxuICAgICAgICBjb25zdCB2aWV3ID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5nZXQoYWRqdXN0ZWRQcmV2aW91c0luZGV4ISkgYXNcbiAgICAgICAgICAgIEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PjtcbiAgICAgICAgdGhpcy5fdmlld0NvbnRhaW5lclJlZi5tb3ZlKHZpZXcsIGN1cnJlbnRJbmRleCk7XG4gICAgICAgIHZpZXcuY29udGV4dC4kaW1wbGljaXQgPSByZWNvcmQuaXRlbTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFVwZGF0ZSAkaW1wbGljaXQgZm9yIGFueSBpdGVtcyB0aGF0IGhhZCBhbiBpZGVudGl0eSBjaGFuZ2UuXG4gICAgY2hhbmdlcy5mb3JFYWNoSWRlbnRpdHlDaGFuZ2UoKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8VD4pID0+IHtcbiAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmdldChyZWNvcmQuY3VycmVudEluZGV4ISkgYXNcbiAgICAgICAgICBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj47XG4gICAgICB2aWV3LmNvbnRleHQuJGltcGxpY2l0ID0gcmVjb3JkLml0ZW07XG4gICAgfSk7XG5cbiAgICAvLyBVcGRhdGUgdGhlIGNvbnRleHQgdmFyaWFibGVzIG9uIGFsbCBpdGVtcy5cbiAgICBjb25zdCBjb3VudCA9IHRoaXMuX2RhdGEubGVuZ3RoO1xuICAgIGxldCBpID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgY29uc3QgdmlldyA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuZ2V0KGkpIGFzIEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PjtcbiAgICAgIHZpZXcuY29udGV4dC5pbmRleCA9IHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQgKyBpO1xuICAgICAgdmlldy5jb250ZXh0LmNvdW50ID0gY291bnQ7XG4gICAgICB0aGlzLl91cGRhdGVDb21wdXRlZENvbnRleHRQcm9wZXJ0aWVzKHZpZXcuY29udGV4dCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENhY2hlIHRoZSBnaXZlbiBkZXRhY2hlZCB2aWV3LiAqL1xuICBwcml2YXRlIF9jYWNoZVZpZXcodmlldzogRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+KSB7XG4gICAgaWYgKHRoaXMuX3RlbXBsYXRlQ2FjaGUubGVuZ3RoIDwgdGhpcy5jZGtWaXJ0dWFsRm9yVGVtcGxhdGVDYWNoZVNpemUpIHtcbiAgICAgIHRoaXMuX3RlbXBsYXRlQ2FjaGUucHVzaCh2aWV3KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgaW5kZXggPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmluZGV4T2Yodmlldyk7XG5cbiAgICAgIC8vIEl0J3MgdmVyeSB1bmxpa2VseSB0aGF0IHRoZSBpbmRleCB3aWxsIGV2ZXIgYmUgLTEsIGJ1dCBqdXN0IGluIGNhc2UsXG4gICAgICAvLyBkZXN0cm95IHRoZSB2aWV3IG9uIGl0cyBvd24sIG90aGVyd2lzZSBkZXN0cm95IGl0IHRocm91Z2ggdGhlXG4gICAgICAvLyBjb250YWluZXIgdG8gZW5zdXJlIHRoYXQgYWxsIHRoZSByZWZlcmVuY2VzIGFyZSByZW1vdmVkLlxuICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICB2aWV3LmRlc3Ryb3koKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3ZpZXdDb250YWluZXJSZWYucmVtb3ZlKGluZGV4KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogSW5zZXJ0cyBhIHZpZXcgZm9yIGEgbmV3IGl0ZW0sIGVpdGhlciBmcm9tIHRoZSBjYWNoZSBvciBieSBjcmVhdGluZyBhIG5ldyBvbmUuICovXG4gIHByaXZhdGUgX2luc2VydFZpZXdGb3JOZXdJdGVtKGluZGV4OiBudW1iZXIpOiBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj4ge1xuICAgIHJldHVybiB0aGlzLl9pbnNlcnRWaWV3RnJvbUNhY2hlKGluZGV4KSB8fCB0aGlzLl9jcmVhdGVFbWJlZGRlZFZpZXdBdChpbmRleCk7XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSBjb21wdXRlZCBwcm9wZXJ0aWVzIG9uIHRoZSBgQ2RrVmlydHVhbEZvck9mQ29udGV4dGAuICovXG4gIHByaXZhdGUgX3VwZGF0ZUNvbXB1dGVkQ29udGV4dFByb3BlcnRpZXMoY29udGV4dDogQ2RrVmlydHVhbEZvck9mQ29udGV4dDxhbnk+KSB7XG4gICAgY29udGV4dC5maXJzdCA9IGNvbnRleHQuaW5kZXggPT09IDA7XG4gICAgY29udGV4dC5sYXN0ID0gY29udGV4dC5pbmRleCA9PT0gY29udGV4dC5jb3VudCAtIDE7XG4gICAgY29udGV4dC5ldmVuID0gY29udGV4dC5pbmRleCAlIDIgPT09IDA7XG4gICAgY29udGV4dC5vZGQgPSAhY29udGV4dC5ldmVuO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBuZXcgZW1iZWRkZWQgdmlldyBhbmQgbW92ZXMgaXQgdG8gdGhlIGdpdmVuIGluZGV4ICovXG4gIHByaXZhdGUgX2NyZWF0ZUVtYmVkZGVkVmlld0F0KGluZGV4OiBudW1iZXIpOiBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj4ge1xuICAgIC8vIE5vdGUgdGhhdCBpdCdzIGltcG9ydGFudCB0aGF0IHdlIGluc2VydCB0aGUgaXRlbSBkaXJlY3RseSBhdCB0aGUgcHJvcGVyIGluZGV4LFxuICAgIC8vIHJhdGhlciB0aGFuIGluc2VydGluZyBpdCBhbmQgdGhlIG1vdmluZyBpdCBpbiBwbGFjZSwgYmVjYXVzZSBpZiB0aGVyZSdzIGEgZGlyZWN0aXZlXG4gICAgLy8gb24gdGhlIHNhbWUgbm9kZSB0aGF0IGluamVjdHMgdGhlIGBWaWV3Q29udGFpbmVyUmVmYCwgQW5ndWxhciB3aWxsIGluc2VydCBhbm90aGVyXG4gICAgLy8gY29tbWVudCBub2RlIHdoaWNoIGNhbiB0aHJvdyBvZmYgdGhlIG1vdmUgd2hlbiBpdCdzIGJlaW5nIHJlcGVhdGVkIGZvciBhbGwgaXRlbXMuXG4gICAgcmV0dXJuIHRoaXMuX3ZpZXdDb250YWluZXJSZWYuY3JlYXRlRW1iZWRkZWRWaWV3KHRoaXMuX3RlbXBsYXRlLCB7XG4gICAgICAkaW1wbGljaXQ6IG51bGwhLFxuICAgICAgY2RrVmlydHVhbEZvck9mOiB0aGlzLl9jZGtWaXJ0dWFsRm9yT2YsXG4gICAgICBpbmRleDogLTEsXG4gICAgICBjb3VudDogLTEsXG4gICAgICBmaXJzdDogZmFsc2UsXG4gICAgICBsYXN0OiBmYWxzZSxcbiAgICAgIG9kZDogZmFsc2UsXG4gICAgICBldmVuOiBmYWxzZVxuICAgIH0sIGluZGV4KTtcbiAgfVxuXG4gIC8qKiBJbnNlcnRzIGEgcmVjeWNsZWQgdmlldyBmcm9tIHRoZSBjYWNoZSBhdCB0aGUgZ2l2ZW4gaW5kZXguICovXG4gIHByaXZhdGUgX2luc2VydFZpZXdGcm9tQ2FjaGUoaW5kZXg6IG51bWJlcik6IEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PnxudWxsIHtcbiAgICBjb25zdCBjYWNoZWRWaWV3ID0gdGhpcy5fdGVtcGxhdGVDYWNoZS5wb3AoKTtcbiAgICBpZiAoY2FjaGVkVmlldykge1xuICAgICAgdGhpcy5fdmlld0NvbnRhaW5lclJlZi5pbnNlcnQoY2FjaGVkVmlldywgaW5kZXgpO1xuICAgIH1cbiAgICByZXR1cm4gY2FjaGVkVmlldyB8fCBudWxsO1xuICB9XG5cbiAgLyoqIERldGFjaGVzIHRoZSBlbWJlZGRlZCB2aWV3IGF0IHRoZSBnaXZlbiBpbmRleC4gKi9cbiAgcHJpdmF0ZSBfZGV0YWNoVmlldyhpbmRleDogbnVtYmVyKTogRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+IHtcbiAgICByZXR1cm4gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5kZXRhY2goaW5kZXgpIGFzXG4gICAgICAgIEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PjtcbiAgfVxufVxuIl19