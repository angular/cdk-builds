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
/** Helper to extract size from a DOM Node. */
function getSize(orientation, node) {
    const el = node;
    if (!el.getBoundingClientRect) {
        return 0;
    }
    const rect = el.getBoundingClientRect();
    return orientation == 'horizontal' ? rect.width : rect.height;
}
/**
 * A directive similar to `ngForOf` to be used for rendering data inside a virtual scrolling
 * container.
 */
let CdkVirtualForOf = /** @class */ (() => {
    class CdkVirtualForOf {
        constructor(
        /** The view container to add items to. */
        _viewContainerRef, 
        /** The template to use when stamping out new items. */
        _template, 
        /** The set of available differs. */
        _differs, 
        /** The virtual scrolling viewport that these items are being rendered in. */
        _viewport, ngZone) {
            this._viewContainerRef = _viewContainerRef;
            this._template = _template;
            this._differs = _differs;
            this._viewport = _viewport;
            /** Emits when the rendered view of the data changes. */
            this.viewChange = new Subject();
            /** Subject that emits when a new DataSource instance is given. */
            this._dataSourceChanges = new Subject();
            /**
             * The size of the cache used to store templates that are not being used for re-use later.
             * Setting the cache size to `0` will disable caching. Defaults to 20 templates.
             */
            this.cdkVirtualForTemplateCacheSize = 20;
            /** Emits whenever the data in the current DataSource changes. */
            this.dataStream = this._dataSourceChanges
                .pipe(
            // Start off with null `DataSource`.
            startWith(null), 
            // Bundle up the previous and current data sources so we can work with both.
            pairwise(), 
            // Use `_changeDataSource` to disconnect from the previous data source and connect to the
            // new one, passing back a stream of data changes which we run through `switchMap` to give
            // us a data stream that emits the latest data from whatever the current `DataSource` is.
            switchMap(([prev, cur]) => this._changeDataSource(prev, cur)), 
            // Replay the last emitted data when someone subscribes.
            shareReplay(1));
            /** The differ used to calculate changes to the data. */
            this._differ = null;
            /**
             * The template cache used to hold on ot template instancess that have been stamped out, but don't
             * currently need to be rendered. These instances will be reused in the future rather than
             * stamping out brand new ones.
             */
            this._templateCache = [];
            /** Whether the rendered data should be updated during the next ngDoCheck cycle. */
            this._needsUpdate = false;
            this._destroyed = new Subject();
            this.dataStream.subscribe(data => {
                this._data = data;
                this._onRenderedDataChange();
            });
            this._viewport.renderedRangeStream.pipe(takeUntil(this._destroyed)).subscribe(range => {
                this._renderedRange = range;
                ngZone.run(() => this.viewChange.next(this._renderedRange));
                this._onRenderedDataChange();
            });
            this._viewport.attach(this);
        }
        /** The DataSource to display. */
        get cdkVirtualForOf() {
            return this._cdkVirtualForOf;
        }
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
         */
        get cdkVirtualForTrackBy() {
            return this._cdkVirtualForTrackBy;
        }
        set cdkVirtualForTrackBy(fn) {
            this._needsUpdate = true;
            this._cdkVirtualForTrackBy = fn ?
                (index, item) => fn(index + (this._renderedRange ? this._renderedRange.start : 0), item) :
                undefined;
        }
        /** The template used to stamp out new elements. */
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
         */
        measureRangeSize(range, orientation) {
            if (range.start >= range.end) {
                return 0;
            }
            if (range.start < this._renderedRange.start || range.end > this._renderedRange.end) {
                throw Error(`Error: attempted to measure an item that isn't rendered.`);
            }
            // The index into the list of rendered views for the first item in the range.
            const renderedStartIndex = range.start - this._renderedRange.start;
            // The length of the range we're measuring.
            const rangeLen = range.end - range.start;
            // Loop over all root nodes for all items in the range and sum up their size.
            let totalSize = 0;
            let i = rangeLen;
            while (i--) {
                const view = this._viewContainerRef.get(i + renderedStartIndex);
                let j = view ? view.rootNodes.length : 0;
                while (j--) {
                    totalSize += getSize(orientation, view.rootNodes[j]);
                }
            }
            return totalSize;
        }
        ngDoCheck() {
            if (this._differ && this._needsUpdate) {
                // TODO(mmalerba): We should differentiate needs update due to scrolling and a new portion of
                // this list being rendered (can use simpler algorithm) vs needs update due to data actually
                // changing (need to do this diff).
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
        ngOnDestroy() {
            this._viewport.detach();
            this._dataSourceChanges.next(undefined);
            this._dataSourceChanges.complete();
            this.viewChange.complete();
            this._destroyed.next();
            this._destroyed.complete();
            for (let view of this._templateCache) {
                view.destroy();
            }
        }
        /** React to scroll state changes in the viewport. */
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
        /** Swap out one `DataSource` for another. */
        _changeDataSource(oldDs, newDs) {
            if (oldDs) {
                oldDs.disconnect(this);
            }
            this._needsUpdate = true;
            return newDs ? newDs.connect(this) : observableOf();
        }
        /** Update the `CdkVirtualForOfContext` for all views. */
        _updateContext() {
            const count = this._data.length;
            let i = this._viewContainerRef.length;
            while (i--) {
                let view = this._viewContainerRef.get(i);
                view.context.index = this._renderedRange.start + i;
                view.context.count = count;
                this._updateComputedContextProperties(view.context);
                view.detectChanges();
            }
        }
        /** Apply changes to the DOM. */
        _applyChanges(changes) {
            // Rearrange the views to put them in the right location.
            changes.forEachOperation((record, adjustedPreviousIndex, currentIndex) => {
                if (record.previousIndex == null) { // Item added.
                    const view = this._insertViewForNewItem(currentIndex);
                    view.context.$implicit = record.item;
                }
                else if (currentIndex == null) { // Item removed.
                    this._cacheView(this._detachView(adjustedPreviousIndex));
                }
                else { // Item moved.
                    const view = this._viewContainerRef.get(adjustedPreviousIndex);
                    this._viewContainerRef.move(view, currentIndex);
                    view.context.$implicit = record.item;
                }
            });
            // Update $implicit for any items that had an identity change.
            changes.forEachIdentityChange((record) => {
                const view = this._viewContainerRef.get(record.currentIndex);
                view.context.$implicit = record.item;
            });
            // Update the context variables on all items.
            const count = this._data.length;
            let i = this._viewContainerRef.length;
            while (i--) {
                const view = this._viewContainerRef.get(i);
                view.context.index = this._renderedRange.start + i;
                view.context.count = count;
                this._updateComputedContextProperties(view.context);
            }
        }
        /** Cache the given detached view. */
        _cacheView(view) {
            if (this._templateCache.length < this.cdkVirtualForTemplateCacheSize) {
                this._templateCache.push(view);
            }
            else {
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
        /** Inserts a view for a new item, either from the cache or by creating a new one. */
        _insertViewForNewItem(index) {
            return this._insertViewFromCache(index) || this._createEmbeddedViewAt(index);
        }
        /** Update the computed properties on the `CdkVirtualForOfContext`. */
        _updateComputedContextProperties(context) {
            context.first = context.index === 0;
            context.last = context.index === context.count - 1;
            context.even = context.index % 2 === 0;
            context.odd = !context.even;
        }
        /** Creates a new embedded view and moves it to the given index */
        _createEmbeddedViewAt(index) {
            // Note that it's important that we insert the item directly at the proper index,
            // rather than inserting it and the moving it in place, because if there's a directive
            // on the same node that injects the `ViewContainerRef`, Angular will insert another
            // comment node which can throw off the move when it's being repeated for all items.
            return this._viewContainerRef.createEmbeddedView(this._template, {
                $implicit: null,
                // It's guaranteed that the iterable is not "undefined" or "null" because we only
                // generate views for elements if the "cdkVirtualForOf" iterable has elements.
                cdkVirtualForOf: this._cdkVirtualForOf,
                index: -1,
                count: -1,
                first: false,
                last: false,
                odd: false,
                even: false
            }, index);
        }
        /** Inserts a recycled view from the cache at the given index. */
        _insertViewFromCache(index) {
            const cachedView = this._templateCache.pop();
            if (cachedView) {
                this._viewContainerRef.insert(cachedView, index);
            }
            return cachedView || null;
        }
        /** Detaches the embedded view at the given index. */
        _detachView(index) {
            return this._viewContainerRef.detach(index);
        }
    }
    CdkVirtualForOf.decorators = [
        { type: Directive, args: [{
                    selector: '[cdkVirtualFor][cdkVirtualForOf]',
                },] }
    ];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1mb3Itb2YuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy92aXJ0dWFsLWZvci1vZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsZUFBZSxFQUlmLFlBQVksR0FDYixNQUFNLDBCQUEwQixDQUFDO0FBQ2xDLE9BQU8sRUFDTCxTQUFTLEVBR1QsS0FBSyxFQUlMLGVBQWUsRUFFZixNQUFNLEVBRU4sUUFBUSxFQUNSLFdBQVcsRUFFWCxnQkFBZ0IsR0FDakIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFhLE9BQU8sRUFBRSxFQUFFLElBQUksWUFBWSxFQUFFLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUMzRSxPQUFPLEVBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3RGLE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBd0JuRSw4Q0FBOEM7QUFDOUMsU0FBUyxPQUFPLENBQUMsV0FBc0MsRUFBRSxJQUFVO0lBQ2pFLE1BQU0sRUFBRSxHQUFHLElBQWUsQ0FBQztJQUMzQixJQUFJLENBQUMsRUFBRSxDQUFDLHFCQUFxQixFQUFFO1FBQzdCLE9BQU8sQ0FBQyxDQUFDO0tBQ1Y7SUFDRCxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMscUJBQXFCLEVBQUUsQ0FBQztJQUN4QyxPQUFPLFdBQVcsSUFBSSxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDaEUsQ0FBQztBQUdEOzs7R0FHRztBQUNIO0lBQUEsTUFHYSxlQUFlO1FBNkYxQjtRQUNJLDBDQUEwQztRQUNsQyxpQkFBbUM7UUFDM0MsdURBQXVEO1FBQy9DLFNBQWlE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QyxpQkFBaUIsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFO2dCQUMvRCxTQUFTLEVBQUUsSUFBSztnQkFDaEIsaUZBQWlGO2dCQUNqRiw4RUFBOEU7Z0JBQzlFLGVBQWUsRUFBRSxJQUFJLENBQUMsZ0JBQWlCO2dCQUN2QyxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUNULEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBQ1QsS0FBSyxFQUFFLEtBQUs7Z0JBQ1osSUFBSSxFQUFFLEtBQUs7Z0JBQ1gsR0FBRyxFQUFFLEtBQUs7Z0JBQ1YsSUFBSSxFQUFFLEtBQUs7YUFDWixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ1osQ0FBQztRQUVELGlFQUFpRTtRQUN6RCxvQkFBb0IsQ0FBQyxLQUFhO1lBQ3hDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDN0MsSUFBSSxVQUFVLEVBQUU7Z0JBQ2QsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDbEQ7WUFDRCxPQUFPLFVBQVUsSUFBSSxJQUFJLENBQUM7UUFDNUIsQ0FBQztRQUVELHFEQUFxRDtRQUM3QyxXQUFXLENBQUMsS0FBYTtZQUMvQixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUNJLENBQUM7UUFDakQsQ0FBQzs7O2dCQS9URixTQUFTLFNBQUM7b0JBQ1QsUUFBUSxFQUFFLGtDQUFrQztpQkFDN0M7OztnQkE3Q0MsZ0JBQWdCO2dCQUZoQixXQUFXO2dCQUxYLGVBQWU7Z0JBV1Qsd0JBQXdCLHVCQStJekIsUUFBUTtnQkF4SmIsTUFBTTs7O2tDQTJETCxLQUFLO3VDQW9CTCxLQUFLO3dDQWFMLEtBQUs7aURBWUwsS0FBSzs7SUF3UVIsc0JBQUM7S0FBQTtTQTdUWSxlQUFlIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIEFycmF5RGF0YVNvdXJjZSxcbiAgQ29sbGVjdGlvblZpZXdlcixcbiAgRGF0YVNvdXJjZSxcbiAgTGlzdFJhbmdlLFxuICBpc0RhdGFTb3VyY2UsXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2xsZWN0aW9ucyc7XG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIERvQ2hlY2ssXG4gIEVtYmVkZGVkVmlld1JlZixcbiAgSW5wdXQsXG4gIEl0ZXJhYmxlQ2hhbmdlUmVjb3JkLFxuICBJdGVyYWJsZUNoYW5nZXMsXG4gIEl0ZXJhYmxlRGlmZmVyLFxuICBJdGVyYWJsZURpZmZlcnMsXG4gIE5nSXRlcmFibGUsXG4gIE5nWm9uZSxcbiAgT25EZXN0cm95LFxuICBTa2lwU2VsZixcbiAgVGVtcGxhdGVSZWYsXG4gIFRyYWNrQnlGdW5jdGlvbixcbiAgVmlld0NvbnRhaW5lclJlZixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3QsIG9mIGFzIG9ic2VydmFibGVPZiwgaXNPYnNlcnZhYmxlfSBmcm9tICdyeGpzJztcbmltcG9ydCB7cGFpcndpc2UsIHNoYXJlUmVwbGF5LCBzdGFydFdpdGgsIHN3aXRjaE1hcCwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge0Nka1ZpcnR1YWxTY3JvbGxWaWV3cG9ydH0gZnJvbSAnLi92aXJ0dWFsLXNjcm9sbC12aWV3cG9ydCc7XG5cblxuLyoqIFRoZSBjb250ZXh0IGZvciBhbiBpdGVtIHJlbmRlcmVkIGJ5IGBDZGtWaXJ0dWFsRm9yT2ZgICovXG5leHBvcnQgdHlwZSBDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+ID0ge1xuICAvKiogVGhlIGl0ZW0gdmFsdWUuICovXG4gICRpbXBsaWNpdDogVDtcbiAgLyoqIFRoZSBEYXRhU291cmNlLCBPYnNlcnZhYmxlLCBvciBOZ0l0ZXJhYmxlIHRoYXQgd2FzIHBhc3NlZCB0byAqY2RrVmlydHVhbEZvci4gKi9cbiAgY2RrVmlydHVhbEZvck9mOiBEYXRhU291cmNlPFQ+IHwgT2JzZXJ2YWJsZTxUW10+IHwgTmdJdGVyYWJsZTxUPjtcbiAgLyoqIFRoZSBpbmRleCBvZiB0aGUgaXRlbSBpbiB0aGUgRGF0YVNvdXJjZS4gKi9cbiAgaW5kZXg6IG51bWJlcjtcbiAgLyoqIFRoZSBudW1iZXIgb2YgaXRlbXMgaW4gdGhlIERhdGFTb3VyY2UuICovXG4gIGNvdW50OiBudW1iZXI7XG4gIC8qKiBXaGV0aGVyIHRoaXMgaXMgdGhlIGZpcnN0IGl0ZW0gaW4gdGhlIERhdGFTb3VyY2UuICovXG4gIGZpcnN0OiBib29sZWFuO1xuICAvKiogV2hldGhlciB0aGlzIGlzIHRoZSBsYXN0IGl0ZW0gaW4gdGhlIERhdGFTb3VyY2UuICovXG4gIGxhc3Q6IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIHRoZSBpbmRleCBpcyBldmVuLiAqL1xuICBldmVuOiBib29sZWFuO1xuICAvKiogV2hldGhlciB0aGUgaW5kZXggaXMgb2RkLiAqL1xuICBvZGQ6IGJvb2xlYW47XG59O1xuXG5cbi8qKiBIZWxwZXIgdG8gZXh0cmFjdCBzaXplIGZyb20gYSBET00gTm9kZS4gKi9cbmZ1bmN0aW9uIGdldFNpemUob3JpZW50YXRpb246ICdob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCcsIG5vZGU6IE5vZGUpOiBudW1iZXIge1xuICBjb25zdCBlbCA9IG5vZGUgYXMgRWxlbWVudDtcbiAgaWYgKCFlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuICBjb25zdCByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIHJldHVybiBvcmllbnRhdGlvbiA9PSAnaG9yaXpvbnRhbCcgPyByZWN0LndpZHRoIDogcmVjdC5oZWlnaHQ7XG59XG5cblxuLyoqXG4gKiBBIGRpcmVjdGl2ZSBzaW1pbGFyIHRvIGBuZ0Zvck9mYCB0byBiZSB1c2VkIGZvciByZW5kZXJpbmcgZGF0YSBpbnNpZGUgYSB2aXJ0dWFsIHNjcm9sbGluZ1xuICogY29udGFpbmVyLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrVmlydHVhbEZvcl1bY2RrVmlydHVhbEZvck9mXScsXG59KVxuZXhwb3J0IGNsYXNzIENka1ZpcnR1YWxGb3JPZjxUPiBpbXBsZW1lbnRzIENvbGxlY3Rpb25WaWV3ZXIsIERvQ2hlY2ssIE9uRGVzdHJveSB7XG4gIC8qKiBFbWl0cyB3aGVuIHRoZSByZW5kZXJlZCB2aWV3IG9mIHRoZSBkYXRhIGNoYW5nZXMuICovXG4gIHZpZXdDaGFuZ2UgPSBuZXcgU3ViamVjdDxMaXN0UmFuZ2U+KCk7XG5cbiAgLyoqIFN1YmplY3QgdGhhdCBlbWl0cyB3aGVuIGEgbmV3IERhdGFTb3VyY2UgaW5zdGFuY2UgaXMgZ2l2ZW4uICovXG4gIHByaXZhdGUgX2RhdGFTb3VyY2VDaGFuZ2VzID0gbmV3IFN1YmplY3Q8RGF0YVNvdXJjZTxUPj4oKTtcblxuICAvKiogVGhlIERhdGFTb3VyY2UgdG8gZGlzcGxheS4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGNka1ZpcnR1YWxGb3JPZigpOiBEYXRhU291cmNlPFQ+IHwgT2JzZXJ2YWJsZTxUW10+IHwgTmdJdGVyYWJsZTxUPiB8IG51bGwgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9jZGtWaXJ0dWFsRm9yT2Y7XG4gIH1cbiAgc2V0IGNka1ZpcnR1YWxGb3JPZih2YWx1ZTogRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8VFtdPiB8IE5nSXRlcmFibGU8VD4gfCBudWxsIHwgdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5fY2RrVmlydHVhbEZvck9mID0gdmFsdWU7XG4gICAgaWYgKGlzRGF0YVNvdXJjZSh2YWx1ZSkpIHtcbiAgICAgIHRoaXMuX2RhdGFTb3VyY2VDaGFuZ2VzLm5leHQodmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBTbGljZSB0aGUgdmFsdWUgaWYgaXRzIGFuIE5nSXRlcmFibGUgdG8gZW5zdXJlIHdlJ3JlIHdvcmtpbmcgd2l0aCBhbiBhcnJheS5cbiAgICAgIHRoaXMuX2RhdGFTb3VyY2VDaGFuZ2VzLm5leHQobmV3IEFycmF5RGF0YVNvdXJjZTxUPihcbiAgICAgICAgICBpc09ic2VydmFibGUodmFsdWUpID8gdmFsdWUgOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh2YWx1ZSB8fCBbXSkpKTtcbiAgICB9XG4gIH1cbiAgX2Nka1ZpcnR1YWxGb3JPZjogRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8VFtdPiB8IE5nSXRlcmFibGU8VD4gfCBudWxsIHwgdW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBUaGUgYFRyYWNrQnlGdW5jdGlvbmAgdG8gdXNlIGZvciB0cmFja2luZyBjaGFuZ2VzLiBUaGUgYFRyYWNrQnlGdW5jdGlvbmAgdGFrZXMgdGhlIGluZGV4IGFuZFxuICAgKiB0aGUgaXRlbSBhbmQgcHJvZHVjZXMgYSB2YWx1ZSB0byBiZSB1c2VkIGFzIHRoZSBpdGVtJ3MgaWRlbnRpdHkgd2hlbiB0cmFja2luZyBjaGFuZ2VzLlxuICAgKi9cbiAgQElucHV0KClcbiAgZ2V0IGNka1ZpcnR1YWxGb3JUcmFja0J5KCk6IFRyYWNrQnlGdW5jdGlvbjxUPiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX2Nka1ZpcnR1YWxGb3JUcmFja0J5O1xuICB9XG4gIHNldCBjZGtWaXJ0dWFsRm9yVHJhY2tCeShmbjogVHJhY2tCeUZ1bmN0aW9uPFQ+IHwgdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5fbmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgIHRoaXMuX2Nka1ZpcnR1YWxGb3JUcmFja0J5ID0gZm4gP1xuICAgICAgICAoaW5kZXgsIGl0ZW0pID0+IGZuKGluZGV4ICsgKHRoaXMuX3JlbmRlcmVkUmFuZ2UgPyB0aGlzLl9yZW5kZXJlZFJhbmdlLnN0YXJ0IDogMCksIGl0ZW0pIDpcbiAgICAgICAgdW5kZWZpbmVkO1xuICB9XG4gIHByaXZhdGUgX2Nka1ZpcnR1YWxGb3JUcmFja0J5OiBUcmFja0J5RnVuY3Rpb248VD4gfCB1bmRlZmluZWQ7XG5cbiAgLyoqIFRoZSB0ZW1wbGF0ZSB1c2VkIHRvIHN0YW1wIG91dCBuZXcgZWxlbWVudHMuICovXG4gIEBJbnB1dCgpXG4gIHNldCBjZGtWaXJ0dWFsRm9yVGVtcGxhdGUodmFsdWU6IFRlbXBsYXRlUmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+KSB7XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICB0aGlzLl9uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgICB0aGlzLl90ZW1wbGF0ZSA9IHZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgc2l6ZSBvZiB0aGUgY2FjaGUgdXNlZCB0byBzdG9yZSB0ZW1wbGF0ZXMgdGhhdCBhcmUgbm90IGJlaW5nIHVzZWQgZm9yIHJlLXVzZSBsYXRlci5cbiAgICogU2V0dGluZyB0aGUgY2FjaGUgc2l6ZSB0byBgMGAgd2lsbCBkaXNhYmxlIGNhY2hpbmcuIERlZmF1bHRzIHRvIDIwIHRlbXBsYXRlcy5cbiAgICovXG4gIEBJbnB1dCgpIGNka1ZpcnR1YWxGb3JUZW1wbGF0ZUNhY2hlU2l6ZTogbnVtYmVyID0gMjA7XG5cbiAgLyoqIEVtaXRzIHdoZW5ldmVyIHRoZSBkYXRhIGluIHRoZSBjdXJyZW50IERhdGFTb3VyY2UgY2hhbmdlcy4gKi9cbiAgZGF0YVN0cmVhbTogT2JzZXJ2YWJsZTxUW10gfCBSZWFkb25seUFycmF5PFQ+PiA9IHRoaXMuX2RhdGFTb3VyY2VDaGFuZ2VzXG4gICAgICAucGlwZShcbiAgICAgICAgICAvLyBTdGFydCBvZmYgd2l0aCBudWxsIGBEYXRhU291cmNlYC5cbiAgICAgICAgICBzdGFydFdpdGgobnVsbCEpLFxuICAgICAgICAgIC8vIEJ1bmRsZSB1cCB0aGUgcHJldmlvdXMgYW5kIGN1cnJlbnQgZGF0YSBzb3VyY2VzIHNvIHdlIGNhbiB3b3JrIHdpdGggYm90aC5cbiAgICAgICAgICBwYWlyd2lzZSgpLFxuICAgICAgICAgIC8vIFVzZSBgX2NoYW5nZURhdGFTb3VyY2VgIHRvIGRpc2Nvbm5lY3QgZnJvbSB0aGUgcHJldmlvdXMgZGF0YSBzb3VyY2UgYW5kIGNvbm5lY3QgdG8gdGhlXG4gICAgICAgICAgLy8gbmV3IG9uZSwgcGFzc2luZyBiYWNrIGEgc3RyZWFtIG9mIGRhdGEgY2hhbmdlcyB3aGljaCB3ZSBydW4gdGhyb3VnaCBgc3dpdGNoTWFwYCB0byBnaXZlXG4gICAgICAgICAgLy8gdXMgYSBkYXRhIHN0cmVhbSB0aGF0IGVtaXRzIHRoZSBsYXRlc3QgZGF0YSBmcm9tIHdoYXRldmVyIHRoZSBjdXJyZW50IGBEYXRhU291cmNlYCBpcy5cbiAgICAgICAgICBzd2l0Y2hNYXAoKFtwcmV2LCBjdXJdKSA9PiB0aGlzLl9jaGFuZ2VEYXRhU291cmNlKHByZXYsIGN1cikpLFxuICAgICAgICAgIC8vIFJlcGxheSB0aGUgbGFzdCBlbWl0dGVkIGRhdGEgd2hlbiBzb21lb25lIHN1YnNjcmliZXMuXG4gICAgICAgICAgc2hhcmVSZXBsYXkoMSkpO1xuXG4gIC8qKiBUaGUgZGlmZmVyIHVzZWQgdG8gY2FsY3VsYXRlIGNoYW5nZXMgdG8gdGhlIGRhdGEuICovXG4gIHByaXZhdGUgX2RpZmZlcjogSXRlcmFibGVEaWZmZXI8VD4gfCBudWxsID0gbnVsbDtcblxuICAvKiogVGhlIG1vc3QgcmVjZW50IGRhdGEgZW1pdHRlZCBmcm9tIHRoZSBEYXRhU291cmNlLiAqL1xuICBwcml2YXRlIF9kYXRhOiBUW10gfCBSZWFkb25seUFycmF5PFQ+O1xuXG4gIC8qKiBUaGUgY3VycmVudGx5IHJlbmRlcmVkIGl0ZW1zLiAqL1xuICBwcml2YXRlIF9yZW5kZXJlZEl0ZW1zOiBUW107XG5cbiAgLyoqIFRoZSBjdXJyZW50bHkgcmVuZGVyZWQgcmFuZ2Ugb2YgaW5kaWNlcy4gKi9cbiAgcHJpdmF0ZSBfcmVuZGVyZWRSYW5nZTogTGlzdFJhbmdlO1xuXG4gIC8qKlxuICAgKiBUaGUgdGVtcGxhdGUgY2FjaGUgdXNlZCB0byBob2xkIG9uIG90IHRlbXBsYXRlIGluc3RhbmNlc3MgdGhhdCBoYXZlIGJlZW4gc3RhbXBlZCBvdXQsIGJ1dCBkb24ndFxuICAgKiBjdXJyZW50bHkgbmVlZCB0byBiZSByZW5kZXJlZC4gVGhlc2UgaW5zdGFuY2VzIHdpbGwgYmUgcmV1c2VkIGluIHRoZSBmdXR1cmUgcmF0aGVyIHRoYW5cbiAgICogc3RhbXBpbmcgb3V0IGJyYW5kIG5ldyBvbmVzLlxuICAgKi9cbiAgcHJpdmF0ZSBfdGVtcGxhdGVDYWNoZTogRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+W10gPSBbXTtcblxuICAvKiogV2hldGhlciB0aGUgcmVuZGVyZWQgZGF0YSBzaG91bGQgYmUgdXBkYXRlZCBkdXJpbmcgdGhlIG5leHQgbmdEb0NoZWNrIGN5Y2xlLiAqL1xuICBwcml2YXRlIF9uZWVkc1VwZGF0ZSA9IGZhbHNlO1xuXG4gIHByaXZhdGUgX2Rlc3Ryb3llZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICAvKiogVGhlIHZpZXcgY29udGFpbmVyIHRvIGFkZCBpdGVtcyB0by4gKi9cbiAgICAgIHByaXZhdGUgX3ZpZXdDb250YWluZXJSZWY6IFZpZXdDb250YWluZXJSZWYsXG4gICAgICAvKiogVGhlIHRlbXBsYXRlIHRvIHVzZSB3aGVuIHN0YW1waW5nIG91dCBuZXcgaXRlbXMuICovXG4gICAgICBwcml2YXRlIF90ZW1wbGF0ZTogVGVtcGxhdGVSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj4sXG4gICAgICAvKiogVGhlIHNldCBvZiBhdmFpbGFibGUgZGlmZmVycy4gKi9cbiAgICAgIHByaXZhdGUgX2RpZmZlcnM6IEl0ZXJhYmxlRGlmZmVycyxcbiAgICAgIC8qKiBUaGUgdmlydHVhbCBzY3JvbGxpbmcgdmlld3BvcnQgdGhhdCB0aGVzZSBpdGVtcyBhcmUgYmVpbmcgcmVuZGVyZWQgaW4uICovXG4gICAgICBAU2tpcFNlbGYoKSBwcml2YXRlIF92aWV3cG9ydDogQ2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0LFxuICAgICAgbmdab25lOiBOZ1pvbmUpIHtcbiAgICB0aGlzLmRhdGFTdHJlYW0uc3Vic2NyaWJlKGRhdGEgPT4ge1xuICAgICAgdGhpcy5fZGF0YSA9IGRhdGE7XG4gICAgICB0aGlzLl9vblJlbmRlcmVkRGF0YUNoYW5nZSgpO1xuICAgIH0pO1xuICAgIHRoaXMuX3ZpZXdwb3J0LnJlbmRlcmVkUmFuZ2VTdHJlYW0ucGlwZSh0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSkuc3Vic2NyaWJlKHJhbmdlID0+IHtcbiAgICAgIHRoaXMuX3JlbmRlcmVkUmFuZ2UgPSByYW5nZTtcbiAgICAgIG5nWm9uZS5ydW4oKCkgPT4gdGhpcy52aWV3Q2hhbmdlLm5leHQodGhpcy5fcmVuZGVyZWRSYW5nZSkpO1xuICAgICAgdGhpcy5fb25SZW5kZXJlZERhdGFDaGFuZ2UoKTtcbiAgICB9KTtcbiAgICB0aGlzLl92aWV3cG9ydC5hdHRhY2godGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogTWVhc3VyZXMgdGhlIGNvbWJpbmVkIHNpemUgKHdpZHRoIGZvciBob3Jpem9udGFsIG9yaWVudGF0aW9uLCBoZWlnaHQgZm9yIHZlcnRpY2FsKSBvZiBhbGwgaXRlbXNcbiAgICogaW4gdGhlIHNwZWNpZmllZCByYW5nZS4gVGhyb3dzIGFuIGVycm9yIGlmIHRoZSByYW5nZSBpbmNsdWRlcyBpdGVtcyB0aGF0IGFyZSBub3QgY3VycmVudGx5XG4gICAqIHJlbmRlcmVkLlxuICAgKi9cbiAgbWVhc3VyZVJhbmdlU2l6ZShyYW5nZTogTGlzdFJhbmdlLCBvcmllbnRhdGlvbjogJ2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJyk6IG51bWJlciB7XG4gICAgaWYgKHJhbmdlLnN0YXJ0ID49IHJhbmdlLmVuZCkge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGlmIChyYW5nZS5zdGFydCA8IHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQgfHwgcmFuZ2UuZW5kID4gdGhpcy5fcmVuZGVyZWRSYW5nZS5lbmQpIHtcbiAgICAgIHRocm93IEVycm9yKGBFcnJvcjogYXR0ZW1wdGVkIHRvIG1lYXN1cmUgYW4gaXRlbSB0aGF0IGlzbid0IHJlbmRlcmVkLmApO1xuICAgIH1cblxuICAgIC8vIFRoZSBpbmRleCBpbnRvIHRoZSBsaXN0IG9mIHJlbmRlcmVkIHZpZXdzIGZvciB0aGUgZmlyc3QgaXRlbSBpbiB0aGUgcmFuZ2UuXG4gICAgY29uc3QgcmVuZGVyZWRTdGFydEluZGV4ID0gcmFuZ2Uuc3RhcnQgLSB0aGlzLl9yZW5kZXJlZFJhbmdlLnN0YXJ0O1xuICAgIC8vIFRoZSBsZW5ndGggb2YgdGhlIHJhbmdlIHdlJ3JlIG1lYXN1cmluZy5cbiAgICBjb25zdCByYW5nZUxlbiA9IHJhbmdlLmVuZCAtIHJhbmdlLnN0YXJ0O1xuXG4gICAgLy8gTG9vcCBvdmVyIGFsbCByb290IG5vZGVzIGZvciBhbGwgaXRlbXMgaW4gdGhlIHJhbmdlIGFuZCBzdW0gdXAgdGhlaXIgc2l6ZS5cbiAgICBsZXQgdG90YWxTaXplID0gMDtcbiAgICBsZXQgaSA9IHJhbmdlTGVuO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmdldChpICsgcmVuZGVyZWRTdGFydEluZGV4KSBhc1xuICAgICAgICAgIEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PiB8IG51bGw7XG4gICAgICBsZXQgaiA9IHZpZXcgPyB2aWV3LnJvb3ROb2Rlcy5sZW5ndGggOiAwO1xuICAgICAgd2hpbGUgKGotLSkge1xuICAgICAgICB0b3RhbFNpemUgKz0gZ2V0U2l6ZShvcmllbnRhdGlvbiwgdmlldyEucm9vdE5vZGVzW2pdKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdG90YWxTaXplO1xuICB9XG5cbiAgbmdEb0NoZWNrKCkge1xuICAgIGlmICh0aGlzLl9kaWZmZXIgJiYgdGhpcy5fbmVlZHNVcGRhdGUpIHtcbiAgICAgIC8vIFRPRE8obW1hbGVyYmEpOiBXZSBzaG91bGQgZGlmZmVyZW50aWF0ZSBuZWVkcyB1cGRhdGUgZHVlIHRvIHNjcm9sbGluZyBhbmQgYSBuZXcgcG9ydGlvbiBvZlxuICAgICAgLy8gdGhpcyBsaXN0IGJlaW5nIHJlbmRlcmVkIChjYW4gdXNlIHNpbXBsZXIgYWxnb3JpdGhtKSB2cyBuZWVkcyB1cGRhdGUgZHVlIHRvIGRhdGEgYWN0dWFsbHlcbiAgICAgIC8vIGNoYW5naW5nIChuZWVkIHRvIGRvIHRoaXMgZGlmZikuXG4gICAgICBjb25zdCBjaGFuZ2VzID0gdGhpcy5fZGlmZmVyLmRpZmYodGhpcy5fcmVuZGVyZWRJdGVtcyk7XG4gICAgICBpZiAoIWNoYW5nZXMpIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlQ29udGV4dCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fYXBwbHlDaGFuZ2VzKGNoYW5nZXMpO1xuICAgICAgfVxuICAgICAgdGhpcy5fbmVlZHNVcGRhdGUgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl92aWV3cG9ydC5kZXRhY2goKTtcblxuICAgIHRoaXMuX2RhdGFTb3VyY2VDaGFuZ2VzLm5leHQodW5kZWZpbmVkISk7XG4gICAgdGhpcy5fZGF0YVNvdXJjZUNoYW5nZXMuY29tcGxldGUoKTtcbiAgICB0aGlzLnZpZXdDaGFuZ2UuY29tcGxldGUoKTtcblxuICAgIHRoaXMuX2Rlc3Ryb3llZC5uZXh0KCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLmNvbXBsZXRlKCk7XG5cbiAgICBmb3IgKGxldCB2aWV3IG9mIHRoaXMuX3RlbXBsYXRlQ2FjaGUpIHtcbiAgICAgIHZpZXcuZGVzdHJveSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSZWFjdCB0byBzY3JvbGwgc3RhdGUgY2hhbmdlcyBpbiB0aGUgdmlld3BvcnQuICovXG4gIHByaXZhdGUgX29uUmVuZGVyZWREYXRhQ2hhbmdlKCkge1xuICAgIGlmICghdGhpcy5fcmVuZGVyZWRSYW5nZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9yZW5kZXJlZEl0ZW1zID0gdGhpcy5fZGF0YS5zbGljZSh0aGlzLl9yZW5kZXJlZFJhbmdlLnN0YXJ0LCB0aGlzLl9yZW5kZXJlZFJhbmdlLmVuZCk7XG4gICAgaWYgKCF0aGlzLl9kaWZmZXIpIHtcbiAgICAgIHRoaXMuX2RpZmZlciA9IHRoaXMuX2RpZmZlcnMuZmluZCh0aGlzLl9yZW5kZXJlZEl0ZW1zKS5jcmVhdGUodGhpcy5jZGtWaXJ0dWFsRm9yVHJhY2tCeSk7XG4gICAgfVxuICAgIHRoaXMuX25lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKiBTd2FwIG91dCBvbmUgYERhdGFTb3VyY2VgIGZvciBhbm90aGVyLiAqL1xuICBwcml2YXRlIF9jaGFuZ2VEYXRhU291cmNlKG9sZERzOiBEYXRhU291cmNlPFQ+IHwgbnVsbCwgbmV3RHM6IERhdGFTb3VyY2U8VD4gfCBudWxsKTpcbiAgICBPYnNlcnZhYmxlPFRbXSB8IFJlYWRvbmx5QXJyYXk8VD4+IHtcblxuICAgIGlmIChvbGREcykge1xuICAgICAgb2xkRHMuZGlzY29ubmVjdCh0aGlzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgcmV0dXJuIG5ld0RzID8gbmV3RHMuY29ubmVjdCh0aGlzKSA6IG9ic2VydmFibGVPZigpO1xuICB9XG5cbiAgLyoqIFVwZGF0ZSB0aGUgYENka1ZpcnR1YWxGb3JPZkNvbnRleHRgIGZvciBhbGwgdmlld3MuICovXG4gIHByaXZhdGUgX3VwZGF0ZUNvbnRleHQoKSB7XG4gICAgY29uc3QgY291bnQgPSB0aGlzLl9kYXRhLmxlbmd0aDtcbiAgICBsZXQgaSA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGxldCB2aWV3ID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5nZXQoaSkgYXMgRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+O1xuICAgICAgdmlldy5jb250ZXh0LmluZGV4ID0gdGhpcy5fcmVuZGVyZWRSYW5nZS5zdGFydCArIGk7XG4gICAgICB2aWV3LmNvbnRleHQuY291bnQgPSBjb3VudDtcbiAgICAgIHRoaXMuX3VwZGF0ZUNvbXB1dGVkQ29udGV4dFByb3BlcnRpZXModmlldy5jb250ZXh0KTtcbiAgICAgIHZpZXcuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBBcHBseSBjaGFuZ2VzIHRvIHRoZSBET00uICovXG4gIHByaXZhdGUgX2FwcGx5Q2hhbmdlcyhjaGFuZ2VzOiBJdGVyYWJsZUNoYW5nZXM8VD4pIHtcbiAgICAvLyBSZWFycmFuZ2UgdGhlIHZpZXdzIHRvIHB1dCB0aGVtIGluIHRoZSByaWdodCBsb2NhdGlvbi5cbiAgICBjaGFuZ2VzLmZvckVhY2hPcGVyYXRpb24oKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8VD4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGp1c3RlZFByZXZpb3VzSW5kZXg6IG51bWJlciB8IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50SW5kZXg6IG51bWJlciB8IG51bGwpID0+IHtcbiAgICAgIGlmIChyZWNvcmQucHJldmlvdXNJbmRleCA9PSBudWxsKSB7ICAvLyBJdGVtIGFkZGVkLlxuICAgICAgICBjb25zdCB2aWV3ID0gdGhpcy5faW5zZXJ0Vmlld0Zvck5ld0l0ZW0oY3VycmVudEluZGV4ISk7XG4gICAgICAgIHZpZXcuY29udGV4dC4kaW1wbGljaXQgPSByZWNvcmQuaXRlbTtcbiAgICAgIH0gZWxzZSBpZiAoY3VycmVudEluZGV4ID09IG51bGwpIHsgIC8vIEl0ZW0gcmVtb3ZlZC5cbiAgICAgICAgdGhpcy5fY2FjaGVWaWV3KHRoaXMuX2RldGFjaFZpZXcoYWRqdXN0ZWRQcmV2aW91c0luZGV4ICEpKTtcbiAgICAgIH0gZWxzZSB7ICAvLyBJdGVtIG1vdmVkLlxuICAgICAgICBjb25zdCB2aWV3ID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5nZXQoYWRqdXN0ZWRQcmV2aW91c0luZGV4ISkgYXNcbiAgICAgICAgICAgIEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PjtcbiAgICAgICAgdGhpcy5fdmlld0NvbnRhaW5lclJlZi5tb3ZlKHZpZXcsIGN1cnJlbnRJbmRleCk7XG4gICAgICAgIHZpZXcuY29udGV4dC4kaW1wbGljaXQgPSByZWNvcmQuaXRlbTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFVwZGF0ZSAkaW1wbGljaXQgZm9yIGFueSBpdGVtcyB0aGF0IGhhZCBhbiBpZGVudGl0eSBjaGFuZ2UuXG4gICAgY2hhbmdlcy5mb3JFYWNoSWRlbnRpdHlDaGFuZ2UoKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8VD4pID0+IHtcbiAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmdldChyZWNvcmQuY3VycmVudEluZGV4ISkgYXNcbiAgICAgICAgICBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj47XG4gICAgICB2aWV3LmNvbnRleHQuJGltcGxpY2l0ID0gcmVjb3JkLml0ZW07XG4gICAgfSk7XG5cbiAgICAvLyBVcGRhdGUgdGhlIGNvbnRleHQgdmFyaWFibGVzIG9uIGFsbCBpdGVtcy5cbiAgICBjb25zdCBjb3VudCA9IHRoaXMuX2RhdGEubGVuZ3RoO1xuICAgIGxldCBpID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgY29uc3QgdmlldyA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuZ2V0KGkpIGFzIEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PjtcbiAgICAgIHZpZXcuY29udGV4dC5pbmRleCA9IHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQgKyBpO1xuICAgICAgdmlldy5jb250ZXh0LmNvdW50ID0gY291bnQ7XG4gICAgICB0aGlzLl91cGRhdGVDb21wdXRlZENvbnRleHRQcm9wZXJ0aWVzKHZpZXcuY29udGV4dCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENhY2hlIHRoZSBnaXZlbiBkZXRhY2hlZCB2aWV3LiAqL1xuICBwcml2YXRlIF9jYWNoZVZpZXcodmlldzogRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+KSB7XG4gICAgaWYgKHRoaXMuX3RlbXBsYXRlQ2FjaGUubGVuZ3RoIDwgdGhpcy5jZGtWaXJ0dWFsRm9yVGVtcGxhdGVDYWNoZVNpemUpIHtcbiAgICAgIHRoaXMuX3RlbXBsYXRlQ2FjaGUucHVzaCh2aWV3KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgaW5kZXggPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmluZGV4T2Yodmlldyk7XG5cbiAgICAgIC8vIEl0J3MgdmVyeSB1bmxpa2VseSB0aGF0IHRoZSBpbmRleCB3aWxsIGV2ZXIgYmUgLTEsIGJ1dCBqdXN0IGluIGNhc2UsXG4gICAgICAvLyBkZXN0cm95IHRoZSB2aWV3IG9uIGl0cyBvd24sIG90aGVyd2lzZSBkZXN0cm95IGl0IHRocm91Z2ggdGhlXG4gICAgICAvLyBjb250YWluZXIgdG8gZW5zdXJlIHRoYXQgYWxsIHRoZSByZWZlcmVuY2VzIGFyZSByZW1vdmVkLlxuICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICB2aWV3LmRlc3Ryb3koKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3ZpZXdDb250YWluZXJSZWYucmVtb3ZlKGluZGV4KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogSW5zZXJ0cyBhIHZpZXcgZm9yIGEgbmV3IGl0ZW0sIGVpdGhlciBmcm9tIHRoZSBjYWNoZSBvciBieSBjcmVhdGluZyBhIG5ldyBvbmUuICovXG4gIHByaXZhdGUgX2luc2VydFZpZXdGb3JOZXdJdGVtKGluZGV4OiBudW1iZXIpOiBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj4ge1xuICAgIHJldHVybiB0aGlzLl9pbnNlcnRWaWV3RnJvbUNhY2hlKGluZGV4KSB8fCB0aGlzLl9jcmVhdGVFbWJlZGRlZFZpZXdBdChpbmRleCk7XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSBjb21wdXRlZCBwcm9wZXJ0aWVzIG9uIHRoZSBgQ2RrVmlydHVhbEZvck9mQ29udGV4dGAuICovXG4gIHByaXZhdGUgX3VwZGF0ZUNvbXB1dGVkQ29udGV4dFByb3BlcnRpZXMoY29udGV4dDogQ2RrVmlydHVhbEZvck9mQ29udGV4dDxhbnk+KSB7XG4gICAgY29udGV4dC5maXJzdCA9IGNvbnRleHQuaW5kZXggPT09IDA7XG4gICAgY29udGV4dC5sYXN0ID0gY29udGV4dC5pbmRleCA9PT0gY29udGV4dC5jb3VudCAtIDE7XG4gICAgY29udGV4dC5ldmVuID0gY29udGV4dC5pbmRleCAlIDIgPT09IDA7XG4gICAgY29udGV4dC5vZGQgPSAhY29udGV4dC5ldmVuO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBuZXcgZW1iZWRkZWQgdmlldyBhbmQgbW92ZXMgaXQgdG8gdGhlIGdpdmVuIGluZGV4ICovXG4gIHByaXZhdGUgX2NyZWF0ZUVtYmVkZGVkVmlld0F0KGluZGV4OiBudW1iZXIpOiBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj4ge1xuICAgIC8vIE5vdGUgdGhhdCBpdCdzIGltcG9ydGFudCB0aGF0IHdlIGluc2VydCB0aGUgaXRlbSBkaXJlY3RseSBhdCB0aGUgcHJvcGVyIGluZGV4LFxuICAgIC8vIHJhdGhlciB0aGFuIGluc2VydGluZyBpdCBhbmQgdGhlIG1vdmluZyBpdCBpbiBwbGFjZSwgYmVjYXVzZSBpZiB0aGVyZSdzIGEgZGlyZWN0aXZlXG4gICAgLy8gb24gdGhlIHNhbWUgbm9kZSB0aGF0IGluamVjdHMgdGhlIGBWaWV3Q29udGFpbmVyUmVmYCwgQW5ndWxhciB3aWxsIGluc2VydCBhbm90aGVyXG4gICAgLy8gY29tbWVudCBub2RlIHdoaWNoIGNhbiB0aHJvdyBvZmYgdGhlIG1vdmUgd2hlbiBpdCdzIGJlaW5nIHJlcGVhdGVkIGZvciBhbGwgaXRlbXMuXG4gICAgcmV0dXJuIHRoaXMuX3ZpZXdDb250YWluZXJSZWYuY3JlYXRlRW1iZWRkZWRWaWV3KHRoaXMuX3RlbXBsYXRlLCB7XG4gICAgICAkaW1wbGljaXQ6IG51bGwhLFxuICAgICAgLy8gSXQncyBndWFyYW50ZWVkIHRoYXQgdGhlIGl0ZXJhYmxlIGlzIG5vdCBcInVuZGVmaW5lZFwiIG9yIFwibnVsbFwiIGJlY2F1c2Ugd2Ugb25seVxuICAgICAgLy8gZ2VuZXJhdGUgdmlld3MgZm9yIGVsZW1lbnRzIGlmIHRoZSBcImNka1ZpcnR1YWxGb3JPZlwiIGl0ZXJhYmxlIGhhcyBlbGVtZW50cy5cbiAgICAgIGNka1ZpcnR1YWxGb3JPZjogdGhpcy5fY2RrVmlydHVhbEZvck9mISxcbiAgICAgIGluZGV4OiAtMSxcbiAgICAgIGNvdW50OiAtMSxcbiAgICAgIGZpcnN0OiBmYWxzZSxcbiAgICAgIGxhc3Q6IGZhbHNlLFxuICAgICAgb2RkOiBmYWxzZSxcbiAgICAgIGV2ZW46IGZhbHNlXG4gICAgfSwgaW5kZXgpO1xuICB9XG5cbiAgLyoqIEluc2VydHMgYSByZWN5Y2xlZCB2aWV3IGZyb20gdGhlIGNhY2hlIGF0IHRoZSBnaXZlbiBpbmRleC4gKi9cbiAgcHJpdmF0ZSBfaW5zZXJ0Vmlld0Zyb21DYWNoZShpbmRleDogbnVtYmVyKTogRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+fG51bGwge1xuICAgIGNvbnN0IGNhY2hlZFZpZXcgPSB0aGlzLl90ZW1wbGF0ZUNhY2hlLnBvcCgpO1xuICAgIGlmIChjYWNoZWRWaWV3KSB7XG4gICAgICB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmluc2VydChjYWNoZWRWaWV3LCBpbmRleCk7XG4gICAgfVxuICAgIHJldHVybiBjYWNoZWRWaWV3IHx8IG51bGw7XG4gIH1cblxuICAvKiogRGV0YWNoZXMgdGhlIGVtYmVkZGVkIHZpZXcgYXQgdGhlIGdpdmVuIGluZGV4LiAqL1xuICBwcml2YXRlIF9kZXRhY2hWaWV3KGluZGV4OiBudW1iZXIpOiBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj4ge1xuICAgIHJldHVybiB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmRldGFjaChpbmRleCkgYXNcbiAgICAgICAgRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+O1xuICB9XG59XG4iXX0=