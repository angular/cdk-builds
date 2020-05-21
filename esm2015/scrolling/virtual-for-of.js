/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __decorate, __metadata, __param } from "tslib";
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
    let CdkVirtualForOf = class CdkVirtualForOf {
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
            this._dataSourceChanges.next();
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
    };
    __decorate([
        Input(),
        __metadata("design:type", Object),
        __metadata("design:paramtypes", [Object])
    ], CdkVirtualForOf.prototype, "cdkVirtualForOf", null);
    __decorate([
        Input(),
        __metadata("design:type", Object),
        __metadata("design:paramtypes", [Object])
    ], CdkVirtualForOf.prototype, "cdkVirtualForTrackBy", null);
    __decorate([
        Input(),
        __metadata("design:type", TemplateRef),
        __metadata("design:paramtypes", [TemplateRef])
    ], CdkVirtualForOf.prototype, "cdkVirtualForTemplate", null);
    __decorate([
        Input(),
        __metadata("design:type", Number)
    ], CdkVirtualForOf.prototype, "cdkVirtualForTemplateCacheSize", void 0);
    CdkVirtualForOf = __decorate([
        Directive({
            selector: '[cdkVirtualFor][cdkVirtualForOf]',
        }),
        __param(3, SkipSelf()),
        __metadata("design:paramtypes", [ViewContainerRef,
            TemplateRef,
            IterableDiffers,
            CdkVirtualScrollViewport,
            NgZone])
    ], CdkVirtualForOf);
    return CdkVirtualForOf;
})();
export { CdkVirtualForOf };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1mb3Itb2YuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy92aXJ0dWFsLWZvci1vZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUNMLGVBQWUsRUFJZixZQUFZLEdBQ2IsTUFBTSwwQkFBMEIsQ0FBQztBQUNsQyxPQUFPLEVBQ0wsU0FBUyxFQUdULEtBQUssRUFJTCxlQUFlLEVBRWYsTUFBTSxFQUVOLFFBQVEsRUFDUixXQUFXLEVBRVgsZ0JBQWdCLEdBQ2pCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBYSxPQUFPLEVBQUUsRUFBRSxJQUFJLFlBQVksRUFBRSxZQUFZLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDM0UsT0FBTyxFQUFDLFFBQVEsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN0RixPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQXdCbkUsOENBQThDO0FBQzlDLFNBQVMsT0FBTyxDQUFDLFdBQXNDLEVBQUUsSUFBVTtJQUNqRSxNQUFNLEVBQUUsR0FBRyxJQUFlLENBQUM7SUFDM0IsSUFBSSxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsRUFBRTtRQUM3QixPQUFPLENBQUMsQ0FBQztLQUNWO0lBQ0QsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLHFCQUFxQixFQUFFLENBQUM7SUFDeEMsT0FBTyxXQUFXLElBQUksWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQ2hFLENBQUM7QUFHRDs7O0dBR0c7QUFJSDtJQUFBLElBQWEsZUFBZSxHQUE1QixNQUFhLGVBQWU7UUE2RjFCO1FBQ0ksMENBQTBDO1FBQ2xDLGlCQUFtQztRQUMzQyx1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O1lBRUYsd0JBQXdCO1lBQy9DLE1BQU07T0F0R1AsZUFBZSxDQTZUM0I7SUFBRCxzQkFBQztLQUFBO1NBN1RZLGVBQWUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgQXJyYXlEYXRhU291cmNlLFxuICBDb2xsZWN0aW9uVmlld2VyLFxuICBEYXRhU291cmNlLFxuICBMaXN0UmFuZ2UsXG4gIGlzRGF0YVNvdXJjZSxcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvbGxlY3Rpb25zJztcbmltcG9ydCB7XG4gIERpcmVjdGl2ZSxcbiAgRG9DaGVjayxcbiAgRW1iZWRkZWRWaWV3UmVmLFxuICBJbnB1dCxcbiAgSXRlcmFibGVDaGFuZ2VSZWNvcmQsXG4gIEl0ZXJhYmxlQ2hhbmdlcyxcbiAgSXRlcmFibGVEaWZmZXIsXG4gIEl0ZXJhYmxlRGlmZmVycyxcbiAgTmdJdGVyYWJsZSxcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIFNraXBTZWxmLFxuICBUZW1wbGF0ZVJlZixcbiAgVHJhY2tCeUZ1bmN0aW9uLFxuICBWaWV3Q29udGFpbmVyUmVmLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdCwgb2YgYXMgb2JzZXJ2YWJsZU9mLCBpc09ic2VydmFibGV9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtwYWlyd2lzZSwgc2hhcmVSZXBsYXksIHN0YXJ0V2l0aCwgc3dpdGNoTWFwLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7Q2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0fSBmcm9tICcuL3ZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0JztcblxuXG4vKiogVGhlIGNvbnRleHQgZm9yIGFuIGl0ZW0gcmVuZGVyZWQgYnkgYENka1ZpcnR1YWxGb3JPZmAgKi9cbmV4cG9ydCB0eXBlIENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4gPSB7XG4gIC8qKiBUaGUgaXRlbSB2YWx1ZS4gKi9cbiAgJGltcGxpY2l0OiBUO1xuICAvKiogVGhlIERhdGFTb3VyY2UsIE9ic2VydmFibGUsIG9yIE5nSXRlcmFibGUgdGhhdCB3YXMgcGFzc2VkIHRvICpjZGtWaXJ0dWFsRm9yLiAqL1xuICBjZGtWaXJ0dWFsRm9yT2Y6IERhdGFTb3VyY2U8VD4gfCBPYnNlcnZhYmxlPFRbXT4gfCBOZ0l0ZXJhYmxlPFQ+O1xuICAvKiogVGhlIGluZGV4IG9mIHRoZSBpdGVtIGluIHRoZSBEYXRhU291cmNlLiAqL1xuICBpbmRleDogbnVtYmVyO1xuICAvKiogVGhlIG51bWJlciBvZiBpdGVtcyBpbiB0aGUgRGF0YVNvdXJjZS4gKi9cbiAgY291bnQ6IG51bWJlcjtcbiAgLyoqIFdoZXRoZXIgdGhpcyBpcyB0aGUgZmlyc3QgaXRlbSBpbiB0aGUgRGF0YVNvdXJjZS4gKi9cbiAgZmlyc3Q6IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIHRoaXMgaXMgdGhlIGxhc3QgaXRlbSBpbiB0aGUgRGF0YVNvdXJjZS4gKi9cbiAgbGFzdDogYm9vbGVhbjtcbiAgLyoqIFdoZXRoZXIgdGhlIGluZGV4IGlzIGV2ZW4uICovXG4gIGV2ZW46IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIHRoZSBpbmRleCBpcyBvZGQuICovXG4gIG9kZDogYm9vbGVhbjtcbn07XG5cblxuLyoqIEhlbHBlciB0byBleHRyYWN0IHNpemUgZnJvbSBhIERPTSBOb2RlLiAqL1xuZnVuY3Rpb24gZ2V0U2l6ZShvcmllbnRhdGlvbjogJ2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJywgbm9kZTogTm9kZSk6IG51bWJlciB7XG4gIGNvbnN0IGVsID0gbm9kZSBhcyBFbGVtZW50O1xuICBpZiAoIWVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCkge1xuICAgIHJldHVybiAwO1xuICB9XG4gIGNvbnN0IHJlY3QgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgcmV0dXJuIG9yaWVudGF0aW9uID09ICdob3Jpem9udGFsJyA/IHJlY3Qud2lkdGggOiByZWN0LmhlaWdodDtcbn1cblxuXG4vKipcbiAqIEEgZGlyZWN0aXZlIHNpbWlsYXIgdG8gYG5nRm9yT2ZgIHRvIGJlIHVzZWQgZm9yIHJlbmRlcmluZyBkYXRhIGluc2lkZSBhIHZpcnR1YWwgc2Nyb2xsaW5nXG4gKiBjb250YWluZXIuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtWaXJ0dWFsRm9yXVtjZGtWaXJ0dWFsRm9yT2ZdJyxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrVmlydHVhbEZvck9mPFQ+IGltcGxlbWVudHMgQ29sbGVjdGlvblZpZXdlciwgRG9DaGVjaywgT25EZXN0cm95IHtcbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHJlbmRlcmVkIHZpZXcgb2YgdGhlIGRhdGEgY2hhbmdlcy4gKi9cbiAgdmlld0NoYW5nZSA9IG5ldyBTdWJqZWN0PExpc3RSYW5nZT4oKTtcblxuICAvKiogU3ViamVjdCB0aGF0IGVtaXRzIHdoZW4gYSBuZXcgRGF0YVNvdXJjZSBpbnN0YW5jZSBpcyBnaXZlbi4gKi9cbiAgcHJpdmF0ZSBfZGF0YVNvdXJjZUNoYW5nZXMgPSBuZXcgU3ViamVjdDxEYXRhU291cmNlPFQ+PigpO1xuXG4gIC8qKiBUaGUgRGF0YVNvdXJjZSB0byBkaXNwbGF5LiAqL1xuICBASW5wdXQoKVxuICBnZXQgY2RrVmlydHVhbEZvck9mKCk6IERhdGFTb3VyY2U8VD4gfCBPYnNlcnZhYmxlPFRbXT4gfCBOZ0l0ZXJhYmxlPFQ+IHwgbnVsbCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX2Nka1ZpcnR1YWxGb3JPZjtcbiAgfVxuICBzZXQgY2RrVmlydHVhbEZvck9mKHZhbHVlOiBEYXRhU291cmNlPFQ+IHwgT2JzZXJ2YWJsZTxUW10+IHwgTmdJdGVyYWJsZTxUPiB8IG51bGwgfCB1bmRlZmluZWQpIHtcbiAgICB0aGlzLl9jZGtWaXJ0dWFsRm9yT2YgPSB2YWx1ZTtcbiAgICBpZiAoaXNEYXRhU291cmNlKHZhbHVlKSkge1xuICAgICAgdGhpcy5fZGF0YVNvdXJjZUNoYW5nZXMubmV4dCh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFNsaWNlIHRoZSB2YWx1ZSBpZiBpdHMgYW4gTmdJdGVyYWJsZSB0byBlbnN1cmUgd2UncmUgd29ya2luZyB3aXRoIGFuIGFycmF5LlxuICAgICAgdGhpcy5fZGF0YVNvdXJjZUNoYW5nZXMubmV4dChuZXcgQXJyYXlEYXRhU291cmNlPFQ+KFxuICAgICAgICAgIGlzT2JzZXJ2YWJsZSh2YWx1ZSkgPyB2YWx1ZSA6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHZhbHVlIHx8IFtdKSkpO1xuICAgIH1cbiAgfVxuICBfY2RrVmlydHVhbEZvck9mOiBEYXRhU291cmNlPFQ+IHwgT2JzZXJ2YWJsZTxUW10+IHwgTmdJdGVyYWJsZTxUPiB8IG51bGwgfCB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFRoZSBgVHJhY2tCeUZ1bmN0aW9uYCB0byB1c2UgZm9yIHRyYWNraW5nIGNoYW5nZXMuIFRoZSBgVHJhY2tCeUZ1bmN0aW9uYCB0YWtlcyB0aGUgaW5kZXggYW5kXG4gICAqIHRoZSBpdGVtIGFuZCBwcm9kdWNlcyBhIHZhbHVlIHRvIGJlIHVzZWQgYXMgdGhlIGl0ZW0ncyBpZGVudGl0eSB3aGVuIHRyYWNraW5nIGNoYW5nZXMuXG4gICAqL1xuICBASW5wdXQoKVxuICBnZXQgY2RrVmlydHVhbEZvclRyYWNrQnkoKTogVHJhY2tCeUZ1bmN0aW9uPFQ+IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fY2RrVmlydHVhbEZvclRyYWNrQnk7XG4gIH1cbiAgc2V0IGNka1ZpcnR1YWxGb3JUcmFja0J5KGZuOiBUcmFja0J5RnVuY3Rpb248VD4gfCB1bmRlZmluZWQpIHtcbiAgICB0aGlzLl9uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgdGhpcy5fY2RrVmlydHVhbEZvclRyYWNrQnkgPSBmbiA/XG4gICAgICAgIChpbmRleCwgaXRlbSkgPT4gZm4oaW5kZXggKyAodGhpcy5fcmVuZGVyZWRSYW5nZSA/IHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQgOiAwKSwgaXRlbSkgOlxuICAgICAgICB1bmRlZmluZWQ7XG4gIH1cbiAgcHJpdmF0ZSBfY2RrVmlydHVhbEZvclRyYWNrQnk6IFRyYWNrQnlGdW5jdGlvbjxUPiB8IHVuZGVmaW5lZDtcblxuICAvKiogVGhlIHRlbXBsYXRlIHVzZWQgdG8gc3RhbXAgb3V0IG5ldyBlbGVtZW50cy4gKi9cbiAgQElucHV0KClcbiAgc2V0IGNka1ZpcnR1YWxGb3JUZW1wbGF0ZSh2YWx1ZTogVGVtcGxhdGVSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj4pIHtcbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIHRoaXMuX25lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICAgIHRoaXMuX3RlbXBsYXRlID0gdmFsdWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBzaXplIG9mIHRoZSBjYWNoZSB1c2VkIHRvIHN0b3JlIHRlbXBsYXRlcyB0aGF0IGFyZSBub3QgYmVpbmcgdXNlZCBmb3IgcmUtdXNlIGxhdGVyLlxuICAgKiBTZXR0aW5nIHRoZSBjYWNoZSBzaXplIHRvIGAwYCB3aWxsIGRpc2FibGUgY2FjaGluZy4gRGVmYXVsdHMgdG8gMjAgdGVtcGxhdGVzLlxuICAgKi9cbiAgQElucHV0KCkgY2RrVmlydHVhbEZvclRlbXBsYXRlQ2FjaGVTaXplOiBudW1iZXIgPSAyMDtcblxuICAvKiogRW1pdHMgd2hlbmV2ZXIgdGhlIGRhdGEgaW4gdGhlIGN1cnJlbnQgRGF0YVNvdXJjZSBjaGFuZ2VzLiAqL1xuICBkYXRhU3RyZWFtOiBPYnNlcnZhYmxlPFRbXSB8IFJlYWRvbmx5QXJyYXk8VD4+ID0gdGhpcy5fZGF0YVNvdXJjZUNoYW5nZXNcbiAgICAgIC5waXBlKFxuICAgICAgICAgIC8vIFN0YXJ0IG9mZiB3aXRoIG51bGwgYERhdGFTb3VyY2VgLlxuICAgICAgICAgIHN0YXJ0V2l0aChudWxsISksXG4gICAgICAgICAgLy8gQnVuZGxlIHVwIHRoZSBwcmV2aW91cyBhbmQgY3VycmVudCBkYXRhIHNvdXJjZXMgc28gd2UgY2FuIHdvcmsgd2l0aCBib3RoLlxuICAgICAgICAgIHBhaXJ3aXNlKCksXG4gICAgICAgICAgLy8gVXNlIGBfY2hhbmdlRGF0YVNvdXJjZWAgdG8gZGlzY29ubmVjdCBmcm9tIHRoZSBwcmV2aW91cyBkYXRhIHNvdXJjZSBhbmQgY29ubmVjdCB0byB0aGVcbiAgICAgICAgICAvLyBuZXcgb25lLCBwYXNzaW5nIGJhY2sgYSBzdHJlYW0gb2YgZGF0YSBjaGFuZ2VzIHdoaWNoIHdlIHJ1biB0aHJvdWdoIGBzd2l0Y2hNYXBgIHRvIGdpdmVcbiAgICAgICAgICAvLyB1cyBhIGRhdGEgc3RyZWFtIHRoYXQgZW1pdHMgdGhlIGxhdGVzdCBkYXRhIGZyb20gd2hhdGV2ZXIgdGhlIGN1cnJlbnQgYERhdGFTb3VyY2VgIGlzLlxuICAgICAgICAgIHN3aXRjaE1hcCgoW3ByZXYsIGN1cl0pID0+IHRoaXMuX2NoYW5nZURhdGFTb3VyY2UocHJldiwgY3VyKSksXG4gICAgICAgICAgLy8gUmVwbGF5IHRoZSBsYXN0IGVtaXR0ZWQgZGF0YSB3aGVuIHNvbWVvbmUgc3Vic2NyaWJlcy5cbiAgICAgICAgICBzaGFyZVJlcGxheSgxKSk7XG5cbiAgLyoqIFRoZSBkaWZmZXIgdXNlZCB0byBjYWxjdWxhdGUgY2hhbmdlcyB0byB0aGUgZGF0YS4gKi9cbiAgcHJpdmF0ZSBfZGlmZmVyOiBJdGVyYWJsZURpZmZlcjxUPiB8IG51bGwgPSBudWxsO1xuXG4gIC8qKiBUaGUgbW9zdCByZWNlbnQgZGF0YSBlbWl0dGVkIGZyb20gdGhlIERhdGFTb3VyY2UuICovXG4gIHByaXZhdGUgX2RhdGE6IFRbXSB8IFJlYWRvbmx5QXJyYXk8VD47XG5cbiAgLyoqIFRoZSBjdXJyZW50bHkgcmVuZGVyZWQgaXRlbXMuICovXG4gIHByaXZhdGUgX3JlbmRlcmVkSXRlbXM6IFRbXTtcblxuICAvKiogVGhlIGN1cnJlbnRseSByZW5kZXJlZCByYW5nZSBvZiBpbmRpY2VzLiAqL1xuICBwcml2YXRlIF9yZW5kZXJlZFJhbmdlOiBMaXN0UmFuZ2U7XG5cbiAgLyoqXG4gICAqIFRoZSB0ZW1wbGF0ZSBjYWNoZSB1c2VkIHRvIGhvbGQgb24gb3QgdGVtcGxhdGUgaW5zdGFuY2VzcyB0aGF0IGhhdmUgYmVlbiBzdGFtcGVkIG91dCwgYnV0IGRvbid0XG4gICAqIGN1cnJlbnRseSBuZWVkIHRvIGJlIHJlbmRlcmVkLiBUaGVzZSBpbnN0YW5jZXMgd2lsbCBiZSByZXVzZWQgaW4gdGhlIGZ1dHVyZSByYXRoZXIgdGhhblxuICAgKiBzdGFtcGluZyBvdXQgYnJhbmQgbmV3IG9uZXMuXG4gICAqL1xuICBwcml2YXRlIF90ZW1wbGF0ZUNhY2hlOiBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj5bXSA9IFtdO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSByZW5kZXJlZCBkYXRhIHNob3VsZCBiZSB1cGRhdGVkIGR1cmluZyB0aGUgbmV4dCBuZ0RvQ2hlY2sgY3ljbGUuICovXG4gIHByaXZhdGUgX25lZWRzVXBkYXRlID0gZmFsc2U7XG5cbiAgcHJpdmF0ZSBfZGVzdHJveWVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKiBUaGUgdmlldyBjb250YWluZXIgdG8gYWRkIGl0ZW1zIHRvLiAqL1xuICAgICAgcHJpdmF0ZSBfdmlld0NvbnRhaW5lclJlZjogVmlld0NvbnRhaW5lclJlZixcbiAgICAgIC8qKiBUaGUgdGVtcGxhdGUgdG8gdXNlIHdoZW4gc3RhbXBpbmcgb3V0IG5ldyBpdGVtcy4gKi9cbiAgICAgIHByaXZhdGUgX3RlbXBsYXRlOiBUZW1wbGF0ZVJlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PixcbiAgICAgIC8qKiBUaGUgc2V0IG9mIGF2YWlsYWJsZSBkaWZmZXJzLiAqL1xuICAgICAgcHJpdmF0ZSBfZGlmZmVyczogSXRlcmFibGVEaWZmZXJzLFxuICAgICAgLyoqIFRoZSB2aXJ0dWFsIHNjcm9sbGluZyB2aWV3cG9ydCB0aGF0IHRoZXNlIGl0ZW1zIGFyZSBiZWluZyByZW5kZXJlZCBpbi4gKi9cbiAgICAgIEBTa2lwU2VsZigpIHByaXZhdGUgX3ZpZXdwb3J0OiBDZGtWaXJ0dWFsU2Nyb2xsVmlld3BvcnQsXG4gICAgICBuZ1pvbmU6IE5nWm9uZSkge1xuICAgIHRoaXMuZGF0YVN0cmVhbS5zdWJzY3JpYmUoZGF0YSA9PiB7XG4gICAgICB0aGlzLl9kYXRhID0gZGF0YTtcbiAgICAgIHRoaXMuX29uUmVuZGVyZWREYXRhQ2hhbmdlKCk7XG4gICAgfSk7XG4gICAgdGhpcy5fdmlld3BvcnQucmVuZGVyZWRSYW5nZVN0cmVhbS5waXBlKHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpKS5zdWJzY3JpYmUocmFuZ2UgPT4ge1xuICAgICAgdGhpcy5fcmVuZGVyZWRSYW5nZSA9IHJhbmdlO1xuICAgICAgbmdab25lLnJ1bigoKSA9PiB0aGlzLnZpZXdDaGFuZ2UubmV4dCh0aGlzLl9yZW5kZXJlZFJhbmdlKSk7XG4gICAgICB0aGlzLl9vblJlbmRlcmVkRGF0YUNoYW5nZSgpO1xuICAgIH0pO1xuICAgIHRoaXMuX3ZpZXdwb3J0LmF0dGFjaCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNZWFzdXJlcyB0aGUgY29tYmluZWQgc2l6ZSAod2lkdGggZm9yIGhvcml6b250YWwgb3JpZW50YXRpb24sIGhlaWdodCBmb3IgdmVydGljYWwpIG9mIGFsbCBpdGVtc1xuICAgKiBpbiB0aGUgc3BlY2lmaWVkIHJhbmdlLiBUaHJvd3MgYW4gZXJyb3IgaWYgdGhlIHJhbmdlIGluY2x1ZGVzIGl0ZW1zIHRoYXQgYXJlIG5vdCBjdXJyZW50bHlcbiAgICogcmVuZGVyZWQuXG4gICAqL1xuICBtZWFzdXJlUmFuZ2VTaXplKHJhbmdlOiBMaXN0UmFuZ2UsIG9yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcgfCAndmVydGljYWwnKTogbnVtYmVyIHtcbiAgICBpZiAocmFuZ2Uuc3RhcnQgPj0gcmFuZ2UuZW5kKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgaWYgKHJhbmdlLnN0YXJ0IDwgdGhpcy5fcmVuZGVyZWRSYW5nZS5zdGFydCB8fCByYW5nZS5lbmQgPiB0aGlzLl9yZW5kZXJlZFJhbmdlLmVuZCkge1xuICAgICAgdGhyb3cgRXJyb3IoYEVycm9yOiBhdHRlbXB0ZWQgdG8gbWVhc3VyZSBhbiBpdGVtIHRoYXQgaXNuJ3QgcmVuZGVyZWQuYCk7XG4gICAgfVxuXG4gICAgLy8gVGhlIGluZGV4IGludG8gdGhlIGxpc3Qgb2YgcmVuZGVyZWQgdmlld3MgZm9yIHRoZSBmaXJzdCBpdGVtIGluIHRoZSByYW5nZS5cbiAgICBjb25zdCByZW5kZXJlZFN0YXJ0SW5kZXggPSByYW5nZS5zdGFydCAtIHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQ7XG4gICAgLy8gVGhlIGxlbmd0aCBvZiB0aGUgcmFuZ2Ugd2UncmUgbWVhc3VyaW5nLlxuICAgIGNvbnN0IHJhbmdlTGVuID0gcmFuZ2UuZW5kIC0gcmFuZ2Uuc3RhcnQ7XG5cbiAgICAvLyBMb29wIG92ZXIgYWxsIHJvb3Qgbm9kZXMgZm9yIGFsbCBpdGVtcyBpbiB0aGUgcmFuZ2UgYW5kIHN1bSB1cCB0aGVpciBzaXplLlxuICAgIGxldCB0b3RhbFNpemUgPSAwO1xuICAgIGxldCBpID0gcmFuZ2VMZW47XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgY29uc3QgdmlldyA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuZ2V0KGkgKyByZW5kZXJlZFN0YXJ0SW5kZXgpIGFzXG4gICAgICAgICAgRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+IHwgbnVsbDtcbiAgICAgIGxldCBqID0gdmlldyA/IHZpZXcucm9vdE5vZGVzLmxlbmd0aCA6IDA7XG4gICAgICB3aGlsZSAoai0tKSB7XG4gICAgICAgIHRvdGFsU2l6ZSArPSBnZXRTaXplKG9yaWVudGF0aW9uLCB2aWV3IS5yb290Tm9kZXNbal0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0b3RhbFNpemU7XG4gIH1cblxuICBuZ0RvQ2hlY2soKSB7XG4gICAgaWYgKHRoaXMuX2RpZmZlciAmJiB0aGlzLl9uZWVkc1VwZGF0ZSkge1xuICAgICAgLy8gVE9ETyhtbWFsZXJiYSk6IFdlIHNob3VsZCBkaWZmZXJlbnRpYXRlIG5lZWRzIHVwZGF0ZSBkdWUgdG8gc2Nyb2xsaW5nIGFuZCBhIG5ldyBwb3J0aW9uIG9mXG4gICAgICAvLyB0aGlzIGxpc3QgYmVpbmcgcmVuZGVyZWQgKGNhbiB1c2Ugc2ltcGxlciBhbGdvcml0aG0pIHZzIG5lZWRzIHVwZGF0ZSBkdWUgdG8gZGF0YSBhY3R1YWxseVxuICAgICAgLy8gY2hhbmdpbmcgKG5lZWQgdG8gZG8gdGhpcyBkaWZmKS5cbiAgICAgIGNvbnN0IGNoYW5nZXMgPSB0aGlzLl9kaWZmZXIuZGlmZih0aGlzLl9yZW5kZXJlZEl0ZW1zKTtcbiAgICAgIGlmICghY2hhbmdlcykge1xuICAgICAgICB0aGlzLl91cGRhdGVDb250ZXh0KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9hcHBseUNoYW5nZXMoY2hhbmdlcyk7XG4gICAgICB9XG4gICAgICB0aGlzLl9uZWVkc1VwZGF0ZSA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX3ZpZXdwb3J0LmRldGFjaCgpO1xuXG4gICAgdGhpcy5fZGF0YVNvdXJjZUNoYW5nZXMubmV4dCgpO1xuICAgIHRoaXMuX2RhdGFTb3VyY2VDaGFuZ2VzLmNvbXBsZXRlKCk7XG4gICAgdGhpcy52aWV3Q2hhbmdlLmNvbXBsZXRlKCk7XG5cbiAgICB0aGlzLl9kZXN0cm95ZWQubmV4dCgpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5jb21wbGV0ZSgpO1xuXG4gICAgZm9yIChsZXQgdmlldyBvZiB0aGlzLl90ZW1wbGF0ZUNhY2hlKSB7XG4gICAgICB2aWV3LmRlc3Ryb3koKTtcbiAgICB9XG4gIH1cblxuICAvKiogUmVhY3QgdG8gc2Nyb2xsIHN0YXRlIGNoYW5nZXMgaW4gdGhlIHZpZXdwb3J0LiAqL1xuICBwcml2YXRlIF9vblJlbmRlcmVkRGF0YUNoYW5nZSgpIHtcbiAgICBpZiAoIXRoaXMuX3JlbmRlcmVkUmFuZ2UpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fcmVuZGVyZWRJdGVtcyA9IHRoaXMuX2RhdGEuc2xpY2UodGhpcy5fcmVuZGVyZWRSYW5nZS5zdGFydCwgdGhpcy5fcmVuZGVyZWRSYW5nZS5lbmQpO1xuICAgIGlmICghdGhpcy5fZGlmZmVyKSB7XG4gICAgICB0aGlzLl9kaWZmZXIgPSB0aGlzLl9kaWZmZXJzLmZpbmQodGhpcy5fcmVuZGVyZWRJdGVtcykuY3JlYXRlKHRoaXMuY2RrVmlydHVhbEZvclRyYWNrQnkpO1xuICAgIH1cbiAgICB0aGlzLl9uZWVkc1VwZGF0ZSA9IHRydWU7XG4gIH1cblxuICAvKiogU3dhcCBvdXQgb25lIGBEYXRhU291cmNlYCBmb3IgYW5vdGhlci4gKi9cbiAgcHJpdmF0ZSBfY2hhbmdlRGF0YVNvdXJjZShvbGREczogRGF0YVNvdXJjZTxUPiB8IG51bGwsIG5ld0RzOiBEYXRhU291cmNlPFQ+IHwgbnVsbCk6XG4gICAgT2JzZXJ2YWJsZTxUW10gfCBSZWFkb25seUFycmF5PFQ+PiB7XG5cbiAgICBpZiAob2xkRHMpIHtcbiAgICAgIG9sZERzLmRpc2Nvbm5lY3QodGhpcyk7XG4gICAgfVxuXG4gICAgdGhpcy5fbmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgIHJldHVybiBuZXdEcyA/IG5ld0RzLmNvbm5lY3QodGhpcykgOiBvYnNlcnZhYmxlT2YoKTtcbiAgfVxuXG4gIC8qKiBVcGRhdGUgdGhlIGBDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0YCBmb3IgYWxsIHZpZXdzLiAqL1xuICBwcml2YXRlIF91cGRhdGVDb250ZXh0KCkge1xuICAgIGNvbnN0IGNvdW50ID0gdGhpcy5fZGF0YS5sZW5ndGg7XG4gICAgbGV0IGkgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICBsZXQgdmlldyA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuZ2V0KGkpIGFzIEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PjtcbiAgICAgIHZpZXcuY29udGV4dC5pbmRleCA9IHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQgKyBpO1xuICAgICAgdmlldy5jb250ZXh0LmNvdW50ID0gY291bnQ7XG4gICAgICB0aGlzLl91cGRhdGVDb21wdXRlZENvbnRleHRQcm9wZXJ0aWVzKHZpZXcuY29udGV4dCk7XG4gICAgICB2aWV3LmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gIH1cblxuICAvKiogQXBwbHkgY2hhbmdlcyB0byB0aGUgRE9NLiAqL1xuICBwcml2YXRlIF9hcHBseUNoYW5nZXMoY2hhbmdlczogSXRlcmFibGVDaGFuZ2VzPFQ+KSB7XG4gICAgLy8gUmVhcnJhbmdlIHRoZSB2aWV3cyB0byBwdXQgdGhlbSBpbiB0aGUgcmlnaHQgbG9jYXRpb24uXG4gICAgY2hhbmdlcy5mb3JFYWNoT3BlcmF0aW9uKChyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFQ+LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRqdXN0ZWRQcmV2aW91c0luZGV4OiBudW1iZXIgfCBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudEluZGV4OiBudW1iZXIgfCBudWxsKSA9PiB7XG4gICAgICBpZiAocmVjb3JkLnByZXZpb3VzSW5kZXggPT0gbnVsbCkgeyAgLy8gSXRlbSBhZGRlZC5cbiAgICAgICAgY29uc3QgdmlldyA9IHRoaXMuX2luc2VydFZpZXdGb3JOZXdJdGVtKGN1cnJlbnRJbmRleCEpO1xuICAgICAgICB2aWV3LmNvbnRleHQuJGltcGxpY2l0ID0gcmVjb3JkLml0ZW07XG4gICAgICB9IGVsc2UgaWYgKGN1cnJlbnRJbmRleCA9PSBudWxsKSB7ICAvLyBJdGVtIHJlbW92ZWQuXG4gICAgICAgIHRoaXMuX2NhY2hlVmlldyh0aGlzLl9kZXRhY2hWaWV3KGFkanVzdGVkUHJldmlvdXNJbmRleCAhKSk7XG4gICAgICB9IGVsc2UgeyAgLy8gSXRlbSBtb3ZlZC5cbiAgICAgICAgY29uc3QgdmlldyA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuZ2V0KGFkanVzdGVkUHJldmlvdXNJbmRleCEpIGFzXG4gICAgICAgICAgICBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj47XG4gICAgICAgIHRoaXMuX3ZpZXdDb250YWluZXJSZWYubW92ZSh2aWV3LCBjdXJyZW50SW5kZXgpO1xuICAgICAgICB2aWV3LmNvbnRleHQuJGltcGxpY2l0ID0gcmVjb3JkLml0ZW07XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBVcGRhdGUgJGltcGxpY2l0IGZvciBhbnkgaXRlbXMgdGhhdCBoYWQgYW4gaWRlbnRpdHkgY2hhbmdlLlxuICAgIGNoYW5nZXMuZm9yRWFjaElkZW50aXR5Q2hhbmdlKChyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFQ+KSA9PiB7XG4gICAgICBjb25zdCB2aWV3ID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5nZXQocmVjb3JkLmN1cnJlbnRJbmRleCEpIGFzXG4gICAgICAgICAgRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+O1xuICAgICAgdmlldy5jb250ZXh0LiRpbXBsaWNpdCA9IHJlY29yZC5pdGVtO1xuICAgIH0pO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBjb250ZXh0IHZhcmlhYmxlcyBvbiBhbGwgaXRlbXMuXG4gICAgY29uc3QgY291bnQgPSB0aGlzLl9kYXRhLmxlbmd0aDtcbiAgICBsZXQgaSA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmdldChpKSBhcyBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj47XG4gICAgICB2aWV3LmNvbnRleHQuaW5kZXggPSB0aGlzLl9yZW5kZXJlZFJhbmdlLnN0YXJ0ICsgaTtcbiAgICAgIHZpZXcuY29udGV4dC5jb3VudCA9IGNvdW50O1xuICAgICAgdGhpcy5fdXBkYXRlQ29tcHV0ZWRDb250ZXh0UHJvcGVydGllcyh2aWV3LmNvbnRleHQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDYWNoZSB0aGUgZ2l2ZW4gZGV0YWNoZWQgdmlldy4gKi9cbiAgcHJpdmF0ZSBfY2FjaGVWaWV3KHZpZXc6IEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+Pikge1xuICAgIGlmICh0aGlzLl90ZW1wbGF0ZUNhY2hlLmxlbmd0aCA8IHRoaXMuY2RrVmlydHVhbEZvclRlbXBsYXRlQ2FjaGVTaXplKSB7XG4gICAgICB0aGlzLl90ZW1wbGF0ZUNhY2hlLnB1c2godmlldyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5pbmRleE9mKHZpZXcpO1xuXG4gICAgICAvLyBJdCdzIHZlcnkgdW5saWtlbHkgdGhhdCB0aGUgaW5kZXggd2lsbCBldmVyIGJlIC0xLCBidXQganVzdCBpbiBjYXNlLFxuICAgICAgLy8gZGVzdHJveSB0aGUgdmlldyBvbiBpdHMgb3duLCBvdGhlcndpc2UgZGVzdHJveSBpdCB0aHJvdWdoIHRoZVxuICAgICAgLy8gY29udGFpbmVyIHRvIGVuc3VyZSB0aGF0IGFsbCB0aGUgcmVmZXJlbmNlcyBhcmUgcmVtb3ZlZC5cbiAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgdmlldy5kZXN0cm95KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl92aWV3Q29udGFpbmVyUmVmLnJlbW92ZShpbmRleCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIEluc2VydHMgYSB2aWV3IGZvciBhIG5ldyBpdGVtLCBlaXRoZXIgZnJvbSB0aGUgY2FjaGUgb3IgYnkgY3JlYXRpbmcgYSBuZXcgb25lLiAqL1xuICBwcml2YXRlIF9pbnNlcnRWaWV3Rm9yTmV3SXRlbShpbmRleDogbnVtYmVyKTogRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+IHtcbiAgICByZXR1cm4gdGhpcy5faW5zZXJ0Vmlld0Zyb21DYWNoZShpbmRleCkgfHwgdGhpcy5fY3JlYXRlRW1iZWRkZWRWaWV3QXQoaW5kZXgpO1xuICB9XG5cbiAgLyoqIFVwZGF0ZSB0aGUgY29tcHV0ZWQgcHJvcGVydGllcyBvbiB0aGUgYENka1ZpcnR1YWxGb3JPZkNvbnRleHRgLiAqL1xuICBwcml2YXRlIF91cGRhdGVDb21wdXRlZENvbnRleHRQcm9wZXJ0aWVzKGNvbnRleHQ6IENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8YW55Pikge1xuICAgIGNvbnRleHQuZmlyc3QgPSBjb250ZXh0LmluZGV4ID09PSAwO1xuICAgIGNvbnRleHQubGFzdCA9IGNvbnRleHQuaW5kZXggPT09IGNvbnRleHQuY291bnQgLSAxO1xuICAgIGNvbnRleHQuZXZlbiA9IGNvbnRleHQuaW5kZXggJSAyID09PSAwO1xuICAgIGNvbnRleHQub2RkID0gIWNvbnRleHQuZXZlbjtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbmV3IGVtYmVkZGVkIHZpZXcgYW5kIG1vdmVzIGl0IHRvIHRoZSBnaXZlbiBpbmRleCAqL1xuICBwcml2YXRlIF9jcmVhdGVFbWJlZGRlZFZpZXdBdChpbmRleDogbnVtYmVyKTogRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+IHtcbiAgICAvLyBOb3RlIHRoYXQgaXQncyBpbXBvcnRhbnQgdGhhdCB3ZSBpbnNlcnQgdGhlIGl0ZW0gZGlyZWN0bHkgYXQgdGhlIHByb3BlciBpbmRleCxcbiAgICAvLyByYXRoZXIgdGhhbiBpbnNlcnRpbmcgaXQgYW5kIHRoZSBtb3ZpbmcgaXQgaW4gcGxhY2UsIGJlY2F1c2UgaWYgdGhlcmUncyBhIGRpcmVjdGl2ZVxuICAgIC8vIG9uIHRoZSBzYW1lIG5vZGUgdGhhdCBpbmplY3RzIHRoZSBgVmlld0NvbnRhaW5lclJlZmAsIEFuZ3VsYXIgd2lsbCBpbnNlcnQgYW5vdGhlclxuICAgIC8vIGNvbW1lbnQgbm9kZSB3aGljaCBjYW4gdGhyb3cgb2ZmIHRoZSBtb3ZlIHdoZW4gaXQncyBiZWluZyByZXBlYXRlZCBmb3IgYWxsIGl0ZW1zLlxuICAgIHJldHVybiB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmNyZWF0ZUVtYmVkZGVkVmlldyh0aGlzLl90ZW1wbGF0ZSwge1xuICAgICAgJGltcGxpY2l0OiBudWxsISxcbiAgICAgIC8vIEl0J3MgZ3VhcmFudGVlZCB0aGF0IHRoZSBpdGVyYWJsZSBpcyBub3QgXCJ1bmRlZmluZWRcIiBvciBcIm51bGxcIiBiZWNhdXNlIHdlIG9ubHlcbiAgICAgIC8vIGdlbmVyYXRlIHZpZXdzIGZvciBlbGVtZW50cyBpZiB0aGUgXCJjZGtWaXJ0dWFsRm9yT2ZcIiBpdGVyYWJsZSBoYXMgZWxlbWVudHMuXG4gICAgICBjZGtWaXJ0dWFsRm9yT2Y6IHRoaXMuX2Nka1ZpcnR1YWxGb3JPZiEsXG4gICAgICBpbmRleDogLTEsXG4gICAgICBjb3VudDogLTEsXG4gICAgICBmaXJzdDogZmFsc2UsXG4gICAgICBsYXN0OiBmYWxzZSxcbiAgICAgIG9kZDogZmFsc2UsXG4gICAgICBldmVuOiBmYWxzZVxuICAgIH0sIGluZGV4KTtcbiAgfVxuXG4gIC8qKiBJbnNlcnRzIGEgcmVjeWNsZWQgdmlldyBmcm9tIHRoZSBjYWNoZSBhdCB0aGUgZ2l2ZW4gaW5kZXguICovXG4gIHByaXZhdGUgX2luc2VydFZpZXdGcm9tQ2FjaGUoaW5kZXg6IG51bWJlcik6IEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PnxudWxsIHtcbiAgICBjb25zdCBjYWNoZWRWaWV3ID0gdGhpcy5fdGVtcGxhdGVDYWNoZS5wb3AoKTtcbiAgICBpZiAoY2FjaGVkVmlldykge1xuICAgICAgdGhpcy5fdmlld0NvbnRhaW5lclJlZi5pbnNlcnQoY2FjaGVkVmlldywgaW5kZXgpO1xuICAgIH1cbiAgICByZXR1cm4gY2FjaGVkVmlldyB8fCBudWxsO1xuICB9XG5cbiAgLyoqIERldGFjaGVzIHRoZSBlbWJlZGRlZCB2aWV3IGF0IHRoZSBnaXZlbiBpbmRleC4gKi9cbiAgcHJpdmF0ZSBfZGV0YWNoVmlldyhpbmRleDogbnVtYmVyKTogRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+IHtcbiAgICByZXR1cm4gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5kZXRhY2goaW5kZXgpIGFzXG4gICAgICAgIEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PjtcbiAgfVxufVxuIl19