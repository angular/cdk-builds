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
export class CdkVirtualForOf {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1mb3Itb2YuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy92aXJ0dWFsLWZvci1vZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsZUFBZSxFQUlmLFlBQVksR0FDYixNQUFNLDBCQUEwQixDQUFDO0FBQ2xDLE9BQU8sRUFDTCxTQUFTLEVBR1QsS0FBSyxFQUlMLGVBQWUsRUFFZixNQUFNLEVBRU4sUUFBUSxFQUNSLFdBQVcsRUFFWCxnQkFBZ0IsR0FDakIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFhLE9BQU8sRUFBRSxFQUFFLElBQUksWUFBWSxFQUFFLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUMzRSxPQUFPLEVBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3RGLE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBd0JuRSw4Q0FBOEM7QUFDOUMsU0FBUyxPQUFPLENBQUMsV0FBc0MsRUFBRSxJQUFVO0lBQ2pFLE1BQU0sRUFBRSxHQUFHLElBQWUsQ0FBQztJQUMzQixJQUFJLENBQUMsRUFBRSxDQUFDLHFCQUFxQixFQUFFO1FBQzdCLE9BQU8sQ0FBQyxDQUFDO0tBQ1Y7SUFDRCxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMscUJBQXFCLEVBQUUsQ0FBQztJQUN4QyxPQUFPLFdBQVcsSUFBSSxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDaEUsQ0FBQztBQUdEOzs7R0FHRztBQUlILE1BQU0sT0FBTyxlQUFlO0lBNkYxQjtJQUNJLDBDQUEwQztJQUNsQyxpQkFBbUM7SUFDM0MsdURBQXVEO0lBQy9DLFNBQWlE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O1lBQ2hCLGlGQUFpRjtZQUNqRiw4RUFBOEU7WUFDOUUsZUFBZSxFQUFFLElBQUksQ0FBQyxnQkFBaUI7WUFDdkMsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUNULEtBQUssRUFBRSxDQUFDLENBQUM7WUFDVCxLQUFLLEVBQUUsS0FBSztZQUNaLElBQUksRUFBRSxLQUFLO1lBQ1gsR0FBRyxFQUFFLEtBQUs7WUFDVixJQUFJLEVBQUUsS0FBSztTQUNaLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDWixDQUFDO0lBRUQsaUVBQWlFO0lBQ3pELG9CQUFvQixDQUFDLEtBQWE7UUFDeEMsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUM3QyxJQUFJLFVBQVUsRUFBRTtZQUNkLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ2xEO1FBQ0QsT0FBTyxVQUFVLElBQUksSUFBSSxDQUFDO0lBQzVCLENBQUM7SUFFRCxxREFBcUQ7SUFDN0MsV0FBVyxDQUFDLEtBQWE7UUFDL0IsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FDSSxDQUFDO0lBQ2pELENBQUM7OztZQS9URixTQUFTLFNBQUM7Z0JBQ1QsUUFBUSxFQUFFLGtDQUFrQzthQUM3Qzs7O1lBN0NDLGdCQUFnQjtZQUZoQixXQUFXO1lBTFgsZUFBZTtZQVdULHdCQUF3Qix1QkErSXpCLFFBQVE7WUF4SmIsTUFBTTs7OzhCQTJETCxLQUFLO21DQW9CTCxLQUFLO29DQWFMLEtBQUs7NkNBWUwsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBBcnJheURhdGFTb3VyY2UsXG4gIENvbGxlY3Rpb25WaWV3ZXIsXG4gIERhdGFTb3VyY2UsXG4gIExpc3RSYW5nZSxcbiAgaXNEYXRhU291cmNlLFxufSBmcm9tICdAYW5ndWxhci9jZGsvY29sbGVjdGlvbnMnO1xuaW1wb3J0IHtcbiAgRGlyZWN0aXZlLFxuICBEb0NoZWNrLFxuICBFbWJlZGRlZFZpZXdSZWYsXG4gIElucHV0LFxuICBJdGVyYWJsZUNoYW5nZVJlY29yZCxcbiAgSXRlcmFibGVDaGFuZ2VzLFxuICBJdGVyYWJsZURpZmZlcixcbiAgSXRlcmFibGVEaWZmZXJzLFxuICBOZ0l0ZXJhYmxlLFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgU2tpcFNlbGYsXG4gIFRlbXBsYXRlUmVmLFxuICBUcmFja0J5RnVuY3Rpb24sXG4gIFZpZXdDb250YWluZXJSZWYsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJqZWN0LCBvZiBhcyBvYnNlcnZhYmxlT2YsIGlzT2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3BhaXJ3aXNlLCBzaGFyZVJlcGxheSwgc3RhcnRXaXRoLCBzd2l0Y2hNYXAsIHRha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtDZGtWaXJ0dWFsU2Nyb2xsVmlld3BvcnR9IGZyb20gJy4vdmlydHVhbC1zY3JvbGwtdmlld3BvcnQnO1xuXG5cbi8qKiBUaGUgY29udGV4dCBmb3IgYW4gaXRlbSByZW5kZXJlZCBieSBgQ2RrVmlydHVhbEZvck9mYCAqL1xuZXhwb3J0IHR5cGUgQ2RrVmlydHVhbEZvck9mQ29udGV4dDxUPiA9IHtcbiAgLyoqIFRoZSBpdGVtIHZhbHVlLiAqL1xuICAkaW1wbGljaXQ6IFQ7XG4gIC8qKiBUaGUgRGF0YVNvdXJjZSwgT2JzZXJ2YWJsZSwgb3IgTmdJdGVyYWJsZSB0aGF0IHdhcyBwYXNzZWQgdG8gKmNka1ZpcnR1YWxGb3IuICovXG4gIGNka1ZpcnR1YWxGb3JPZjogRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8VFtdPiB8IE5nSXRlcmFibGU8VD47XG4gIC8qKiBUaGUgaW5kZXggb2YgdGhlIGl0ZW0gaW4gdGhlIERhdGFTb3VyY2UuICovXG4gIGluZGV4OiBudW1iZXI7XG4gIC8qKiBUaGUgbnVtYmVyIG9mIGl0ZW1zIGluIHRoZSBEYXRhU291cmNlLiAqL1xuICBjb3VudDogbnVtYmVyO1xuICAvKiogV2hldGhlciB0aGlzIGlzIHRoZSBmaXJzdCBpdGVtIGluIHRoZSBEYXRhU291cmNlLiAqL1xuICBmaXJzdDogYm9vbGVhbjtcbiAgLyoqIFdoZXRoZXIgdGhpcyBpcyB0aGUgbGFzdCBpdGVtIGluIHRoZSBEYXRhU291cmNlLiAqL1xuICBsYXN0OiBib29sZWFuO1xuICAvKiogV2hldGhlciB0aGUgaW5kZXggaXMgZXZlbi4gKi9cbiAgZXZlbjogYm9vbGVhbjtcbiAgLyoqIFdoZXRoZXIgdGhlIGluZGV4IGlzIG9kZC4gKi9cbiAgb2RkOiBib29sZWFuO1xufTtcblxuXG4vKiogSGVscGVyIHRvIGV4dHJhY3Qgc2l6ZSBmcm9tIGEgRE9NIE5vZGUuICovXG5mdW5jdGlvbiBnZXRTaXplKG9yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcgfCAndmVydGljYWwnLCBub2RlOiBOb2RlKTogbnVtYmVyIHtcbiAgY29uc3QgZWwgPSBub2RlIGFzIEVsZW1lbnQ7XG4gIGlmICghZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cbiAgY29uc3QgcmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICByZXR1cm4gb3JpZW50YXRpb24gPT0gJ2hvcml6b250YWwnID8gcmVjdC53aWR0aCA6IHJlY3QuaGVpZ2h0O1xufVxuXG5cbi8qKlxuICogQSBkaXJlY3RpdmUgc2ltaWxhciB0byBgbmdGb3JPZmAgdG8gYmUgdXNlZCBmb3IgcmVuZGVyaW5nIGRhdGEgaW5zaWRlIGEgdmlydHVhbCBzY3JvbGxpbmdcbiAqIGNvbnRhaW5lci5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka1ZpcnR1YWxGb3JdW2Nka1ZpcnR1YWxGb3JPZl0nLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtWaXJ0dWFsRm9yT2Y8VD4gaW1wbGVtZW50cyBDb2xsZWN0aW9uVmlld2VyLCBEb0NoZWNrLCBPbkRlc3Ryb3kge1xuICAvKiogRW1pdHMgd2hlbiB0aGUgcmVuZGVyZWQgdmlldyBvZiB0aGUgZGF0YSBjaGFuZ2VzLiAqL1xuICB2aWV3Q2hhbmdlID0gbmV3IFN1YmplY3Q8TGlzdFJhbmdlPigpO1xuXG4gIC8qKiBTdWJqZWN0IHRoYXQgZW1pdHMgd2hlbiBhIG5ldyBEYXRhU291cmNlIGluc3RhbmNlIGlzIGdpdmVuLiAqL1xuICBwcml2YXRlIF9kYXRhU291cmNlQ2hhbmdlcyA9IG5ldyBTdWJqZWN0PERhdGFTb3VyY2U8VD4+KCk7XG5cbiAgLyoqIFRoZSBEYXRhU291cmNlIHRvIGRpc3BsYXkuICovXG4gIEBJbnB1dCgpXG4gIGdldCBjZGtWaXJ0dWFsRm9yT2YoKTogRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8VFtdPiB8IE5nSXRlcmFibGU8VD4gfCBudWxsIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fY2RrVmlydHVhbEZvck9mO1xuICB9XG4gIHNldCBjZGtWaXJ0dWFsRm9yT2YodmFsdWU6IERhdGFTb3VyY2U8VD4gfCBPYnNlcnZhYmxlPFRbXT4gfCBOZ0l0ZXJhYmxlPFQ+IHwgbnVsbCB8IHVuZGVmaW5lZCkge1xuICAgIHRoaXMuX2Nka1ZpcnR1YWxGb3JPZiA9IHZhbHVlO1xuICAgIGlmIChpc0RhdGFTb3VyY2UodmFsdWUpKSB7XG4gICAgICB0aGlzLl9kYXRhU291cmNlQ2hhbmdlcy5uZXh0KHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gU2xpY2UgdGhlIHZhbHVlIGlmIGl0cyBhbiBOZ0l0ZXJhYmxlIHRvIGVuc3VyZSB3ZSdyZSB3b3JraW5nIHdpdGggYW4gYXJyYXkuXG4gICAgICB0aGlzLl9kYXRhU291cmNlQ2hhbmdlcy5uZXh0KG5ldyBBcnJheURhdGFTb3VyY2U8VD4oXG4gICAgICAgICAgaXNPYnNlcnZhYmxlKHZhbHVlKSA/IHZhbHVlIDogQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwodmFsdWUgfHwgW10pKSk7XG4gICAgfVxuICB9XG4gIF9jZGtWaXJ0dWFsRm9yT2Y6IERhdGFTb3VyY2U8VD4gfCBPYnNlcnZhYmxlPFRbXT4gfCBOZ0l0ZXJhYmxlPFQ+IHwgbnVsbCB8IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogVGhlIGBUcmFja0J5RnVuY3Rpb25gIHRvIHVzZSBmb3IgdHJhY2tpbmcgY2hhbmdlcy4gVGhlIGBUcmFja0J5RnVuY3Rpb25gIHRha2VzIHRoZSBpbmRleCBhbmRcbiAgICogdGhlIGl0ZW0gYW5kIHByb2R1Y2VzIGEgdmFsdWUgdG8gYmUgdXNlZCBhcyB0aGUgaXRlbSdzIGlkZW50aXR5IHdoZW4gdHJhY2tpbmcgY2hhbmdlcy5cbiAgICovXG4gIEBJbnB1dCgpXG4gIGdldCBjZGtWaXJ0dWFsRm9yVHJhY2tCeSgpOiBUcmFja0J5RnVuY3Rpb248VD4gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9jZGtWaXJ0dWFsRm9yVHJhY2tCeTtcbiAgfVxuICBzZXQgY2RrVmlydHVhbEZvclRyYWNrQnkoZm46IFRyYWNrQnlGdW5jdGlvbjxUPiB8IHVuZGVmaW5lZCkge1xuICAgIHRoaXMuX25lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICB0aGlzLl9jZGtWaXJ0dWFsRm9yVHJhY2tCeSA9IGZuID9cbiAgICAgICAgKGluZGV4LCBpdGVtKSA9PiBmbihpbmRleCArICh0aGlzLl9yZW5kZXJlZFJhbmdlID8gdGhpcy5fcmVuZGVyZWRSYW5nZS5zdGFydCA6IDApLCBpdGVtKSA6XG4gICAgICAgIHVuZGVmaW5lZDtcbiAgfVxuICBwcml2YXRlIF9jZGtWaXJ0dWFsRm9yVHJhY2tCeTogVHJhY2tCeUZ1bmN0aW9uPFQ+IHwgdW5kZWZpbmVkO1xuXG4gIC8qKiBUaGUgdGVtcGxhdGUgdXNlZCB0byBzdGFtcCBvdXQgbmV3IGVsZW1lbnRzLiAqL1xuICBASW5wdXQoKVxuICBzZXQgY2RrVmlydHVhbEZvclRlbXBsYXRlKHZhbHVlOiBUZW1wbGF0ZVJlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+Pikge1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgdGhpcy5fbmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgICAgdGhpcy5fdGVtcGxhdGUgPSB2YWx1ZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGhlIHNpemUgb2YgdGhlIGNhY2hlIHVzZWQgdG8gc3RvcmUgdGVtcGxhdGVzIHRoYXQgYXJlIG5vdCBiZWluZyB1c2VkIGZvciByZS11c2UgbGF0ZXIuXG4gICAqIFNldHRpbmcgdGhlIGNhY2hlIHNpemUgdG8gYDBgIHdpbGwgZGlzYWJsZSBjYWNoaW5nLiBEZWZhdWx0cyB0byAyMCB0ZW1wbGF0ZXMuXG4gICAqL1xuICBASW5wdXQoKSBjZGtWaXJ0dWFsRm9yVGVtcGxhdGVDYWNoZVNpemU6IG51bWJlciA9IDIwO1xuXG4gIC8qKiBFbWl0cyB3aGVuZXZlciB0aGUgZGF0YSBpbiB0aGUgY3VycmVudCBEYXRhU291cmNlIGNoYW5nZXMuICovXG4gIGRhdGFTdHJlYW06IE9ic2VydmFibGU8VFtdIHwgUmVhZG9ubHlBcnJheTxUPj4gPSB0aGlzLl9kYXRhU291cmNlQ2hhbmdlc1xuICAgICAgLnBpcGUoXG4gICAgICAgICAgLy8gU3RhcnQgb2ZmIHdpdGggbnVsbCBgRGF0YVNvdXJjZWAuXG4gICAgICAgICAgc3RhcnRXaXRoKG51bGwhKSxcbiAgICAgICAgICAvLyBCdW5kbGUgdXAgdGhlIHByZXZpb3VzIGFuZCBjdXJyZW50IGRhdGEgc291cmNlcyBzbyB3ZSBjYW4gd29yayB3aXRoIGJvdGguXG4gICAgICAgICAgcGFpcndpc2UoKSxcbiAgICAgICAgICAvLyBVc2UgYF9jaGFuZ2VEYXRhU291cmNlYCB0byBkaXNjb25uZWN0IGZyb20gdGhlIHByZXZpb3VzIGRhdGEgc291cmNlIGFuZCBjb25uZWN0IHRvIHRoZVxuICAgICAgICAgIC8vIG5ldyBvbmUsIHBhc3NpbmcgYmFjayBhIHN0cmVhbSBvZiBkYXRhIGNoYW5nZXMgd2hpY2ggd2UgcnVuIHRocm91Z2ggYHN3aXRjaE1hcGAgdG8gZ2l2ZVxuICAgICAgICAgIC8vIHVzIGEgZGF0YSBzdHJlYW0gdGhhdCBlbWl0cyB0aGUgbGF0ZXN0IGRhdGEgZnJvbSB3aGF0ZXZlciB0aGUgY3VycmVudCBgRGF0YVNvdXJjZWAgaXMuXG4gICAgICAgICAgc3dpdGNoTWFwKChbcHJldiwgY3VyXSkgPT4gdGhpcy5fY2hhbmdlRGF0YVNvdXJjZShwcmV2LCBjdXIpKSxcbiAgICAgICAgICAvLyBSZXBsYXkgdGhlIGxhc3QgZW1pdHRlZCBkYXRhIHdoZW4gc29tZW9uZSBzdWJzY3JpYmVzLlxuICAgICAgICAgIHNoYXJlUmVwbGF5KDEpKTtcblxuICAvKiogVGhlIGRpZmZlciB1c2VkIHRvIGNhbGN1bGF0ZSBjaGFuZ2VzIHRvIHRoZSBkYXRhLiAqL1xuICBwcml2YXRlIF9kaWZmZXI6IEl0ZXJhYmxlRGlmZmVyPFQ+IHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIFRoZSBtb3N0IHJlY2VudCBkYXRhIGVtaXR0ZWQgZnJvbSB0aGUgRGF0YVNvdXJjZS4gKi9cbiAgcHJpdmF0ZSBfZGF0YTogVFtdIHwgUmVhZG9ubHlBcnJheTxUPjtcblxuICAvKiogVGhlIGN1cnJlbnRseSByZW5kZXJlZCBpdGVtcy4gKi9cbiAgcHJpdmF0ZSBfcmVuZGVyZWRJdGVtczogVFtdO1xuXG4gIC8qKiBUaGUgY3VycmVudGx5IHJlbmRlcmVkIHJhbmdlIG9mIGluZGljZXMuICovXG4gIHByaXZhdGUgX3JlbmRlcmVkUmFuZ2U6IExpc3RSYW5nZTtcblxuICAvKipcbiAgICogVGhlIHRlbXBsYXRlIGNhY2hlIHVzZWQgdG8gaG9sZCBvbiBvdCB0ZW1wbGF0ZSBpbnN0YW5jZXNzIHRoYXQgaGF2ZSBiZWVuIHN0YW1wZWQgb3V0LCBidXQgZG9uJ3RcbiAgICogY3VycmVudGx5IG5lZWQgdG8gYmUgcmVuZGVyZWQuIFRoZXNlIGluc3RhbmNlcyB3aWxsIGJlIHJldXNlZCBpbiB0aGUgZnV0dXJlIHJhdGhlciB0aGFuXG4gICAqIHN0YW1waW5nIG91dCBicmFuZCBuZXcgb25lcy5cbiAgICovXG4gIHByaXZhdGUgX3RlbXBsYXRlQ2FjaGU6IEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PltdID0gW107XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHJlbmRlcmVkIGRhdGEgc2hvdWxkIGJlIHVwZGF0ZWQgZHVyaW5nIHRoZSBuZXh0IG5nRG9DaGVjayBjeWNsZS4gKi9cbiAgcHJpdmF0ZSBfbmVlZHNVcGRhdGUgPSBmYWxzZTtcblxuICBwcml2YXRlIF9kZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgLyoqIFRoZSB2aWV3IGNvbnRhaW5lciB0byBhZGQgaXRlbXMgdG8uICovXG4gICAgICBwcml2YXRlIF92aWV3Q29udGFpbmVyUmVmOiBWaWV3Q29udGFpbmVyUmVmLFxuICAgICAgLyoqIFRoZSB0ZW1wbGF0ZSB0byB1c2Ugd2hlbiBzdGFtcGluZyBvdXQgbmV3IGl0ZW1zLiAqL1xuICAgICAgcHJpdmF0ZSBfdGVtcGxhdGU6IFRlbXBsYXRlUmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+LFxuICAgICAgLyoqIFRoZSBzZXQgb2YgYXZhaWxhYmxlIGRpZmZlcnMuICovXG4gICAgICBwcml2YXRlIF9kaWZmZXJzOiBJdGVyYWJsZURpZmZlcnMsXG4gICAgICAvKiogVGhlIHZpcnR1YWwgc2Nyb2xsaW5nIHZpZXdwb3J0IHRoYXQgdGhlc2UgaXRlbXMgYXJlIGJlaW5nIHJlbmRlcmVkIGluLiAqL1xuICAgICAgQFNraXBTZWxmKCkgcHJpdmF0ZSBfdmlld3BvcnQ6IENka1ZpcnR1YWxTY3JvbGxWaWV3cG9ydCxcbiAgICAgIG5nWm9uZTogTmdab25lKSB7XG4gICAgdGhpcy5kYXRhU3RyZWFtLnN1YnNjcmliZShkYXRhID0+IHtcbiAgICAgIHRoaXMuX2RhdGEgPSBkYXRhO1xuICAgICAgdGhpcy5fb25SZW5kZXJlZERhdGFDaGFuZ2UoKTtcbiAgICB9KTtcbiAgICB0aGlzLl92aWV3cG9ydC5yZW5kZXJlZFJhbmdlU3RyZWFtLnBpcGUodGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpLnN1YnNjcmliZShyYW5nZSA9PiB7XG4gICAgICB0aGlzLl9yZW5kZXJlZFJhbmdlID0gcmFuZ2U7XG4gICAgICBuZ1pvbmUucnVuKCgpID0+IHRoaXMudmlld0NoYW5nZS5uZXh0KHRoaXMuX3JlbmRlcmVkUmFuZ2UpKTtcbiAgICAgIHRoaXMuX29uUmVuZGVyZWREYXRhQ2hhbmdlKCk7XG4gICAgfSk7XG4gICAgdGhpcy5fdmlld3BvcnQuYXR0YWNoKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIE1lYXN1cmVzIHRoZSBjb21iaW5lZCBzaXplICh3aWR0aCBmb3IgaG9yaXpvbnRhbCBvcmllbnRhdGlvbiwgaGVpZ2h0IGZvciB2ZXJ0aWNhbCkgb2YgYWxsIGl0ZW1zXG4gICAqIGluIHRoZSBzcGVjaWZpZWQgcmFuZ2UuIFRocm93cyBhbiBlcnJvciBpZiB0aGUgcmFuZ2UgaW5jbHVkZXMgaXRlbXMgdGhhdCBhcmUgbm90IGN1cnJlbnRseVxuICAgKiByZW5kZXJlZC5cbiAgICovXG4gIG1lYXN1cmVSYW5nZVNpemUocmFuZ2U6IExpc3RSYW5nZSwgb3JpZW50YXRpb246ICdob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCcpOiBudW1iZXIge1xuICAgIGlmIChyYW5nZS5zdGFydCA+PSByYW5nZS5lbmQpIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBpZiAocmFuZ2Uuc3RhcnQgPCB0aGlzLl9yZW5kZXJlZFJhbmdlLnN0YXJ0IHx8IHJhbmdlLmVuZCA+IHRoaXMuX3JlbmRlcmVkUmFuZ2UuZW5kKSB7XG4gICAgICB0aHJvdyBFcnJvcihgRXJyb3I6IGF0dGVtcHRlZCB0byBtZWFzdXJlIGFuIGl0ZW0gdGhhdCBpc24ndCByZW5kZXJlZC5gKTtcbiAgICB9XG5cbiAgICAvLyBUaGUgaW5kZXggaW50byB0aGUgbGlzdCBvZiByZW5kZXJlZCB2aWV3cyBmb3IgdGhlIGZpcnN0IGl0ZW0gaW4gdGhlIHJhbmdlLlxuICAgIGNvbnN0IHJlbmRlcmVkU3RhcnRJbmRleCA9IHJhbmdlLnN0YXJ0IC0gdGhpcy5fcmVuZGVyZWRSYW5nZS5zdGFydDtcbiAgICAvLyBUaGUgbGVuZ3RoIG9mIHRoZSByYW5nZSB3ZSdyZSBtZWFzdXJpbmcuXG4gICAgY29uc3QgcmFuZ2VMZW4gPSByYW5nZS5lbmQgLSByYW5nZS5zdGFydDtcblxuICAgIC8vIExvb3Agb3ZlciBhbGwgcm9vdCBub2RlcyBmb3IgYWxsIGl0ZW1zIGluIHRoZSByYW5nZSBhbmQgc3VtIHVwIHRoZWlyIHNpemUuXG4gICAgbGV0IHRvdGFsU2l6ZSA9IDA7XG4gICAgbGV0IGkgPSByYW5nZUxlbjtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICBjb25zdCB2aWV3ID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5nZXQoaSArIHJlbmRlcmVkU3RhcnRJbmRleCkgYXNcbiAgICAgICAgICBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj4gfCBudWxsO1xuICAgICAgbGV0IGogPSB2aWV3ID8gdmlldy5yb290Tm9kZXMubGVuZ3RoIDogMDtcbiAgICAgIHdoaWxlIChqLS0pIHtcbiAgICAgICAgdG90YWxTaXplICs9IGdldFNpemUob3JpZW50YXRpb24sIHZpZXchLnJvb3ROb2Rlc1tqXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRvdGFsU2l6ZTtcbiAgfVxuXG4gIG5nRG9DaGVjaygpIHtcbiAgICBpZiAodGhpcy5fZGlmZmVyICYmIHRoaXMuX25lZWRzVXBkYXRlKSB7XG4gICAgICAvLyBUT0RPKG1tYWxlcmJhKTogV2Ugc2hvdWxkIGRpZmZlcmVudGlhdGUgbmVlZHMgdXBkYXRlIGR1ZSB0byBzY3JvbGxpbmcgYW5kIGEgbmV3IHBvcnRpb24gb2ZcbiAgICAgIC8vIHRoaXMgbGlzdCBiZWluZyByZW5kZXJlZCAoY2FuIHVzZSBzaW1wbGVyIGFsZ29yaXRobSkgdnMgbmVlZHMgdXBkYXRlIGR1ZSB0byBkYXRhIGFjdHVhbGx5XG4gICAgICAvLyBjaGFuZ2luZyAobmVlZCB0byBkbyB0aGlzIGRpZmYpLlxuICAgICAgY29uc3QgY2hhbmdlcyA9IHRoaXMuX2RpZmZlci5kaWZmKHRoaXMuX3JlbmRlcmVkSXRlbXMpO1xuICAgICAgaWYgKCFjaGFuZ2VzKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUNvbnRleHQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2FwcGx5Q2hhbmdlcyhjaGFuZ2VzKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX25lZWRzVXBkYXRlID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fdmlld3BvcnQuZGV0YWNoKCk7XG5cbiAgICB0aGlzLl9kYXRhU291cmNlQ2hhbmdlcy5uZXh0KCk7XG4gICAgdGhpcy5fZGF0YVNvdXJjZUNoYW5nZXMuY29tcGxldGUoKTtcbiAgICB0aGlzLnZpZXdDaGFuZ2UuY29tcGxldGUoKTtcblxuICAgIHRoaXMuX2Rlc3Ryb3llZC5uZXh0KCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLmNvbXBsZXRlKCk7XG5cbiAgICBmb3IgKGxldCB2aWV3IG9mIHRoaXMuX3RlbXBsYXRlQ2FjaGUpIHtcbiAgICAgIHZpZXcuZGVzdHJveSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSZWFjdCB0byBzY3JvbGwgc3RhdGUgY2hhbmdlcyBpbiB0aGUgdmlld3BvcnQuICovXG4gIHByaXZhdGUgX29uUmVuZGVyZWREYXRhQ2hhbmdlKCkge1xuICAgIGlmICghdGhpcy5fcmVuZGVyZWRSYW5nZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9yZW5kZXJlZEl0ZW1zID0gdGhpcy5fZGF0YS5zbGljZSh0aGlzLl9yZW5kZXJlZFJhbmdlLnN0YXJ0LCB0aGlzLl9yZW5kZXJlZFJhbmdlLmVuZCk7XG4gICAgaWYgKCF0aGlzLl9kaWZmZXIpIHtcbiAgICAgIHRoaXMuX2RpZmZlciA9IHRoaXMuX2RpZmZlcnMuZmluZCh0aGlzLl9yZW5kZXJlZEl0ZW1zKS5jcmVhdGUodGhpcy5jZGtWaXJ0dWFsRm9yVHJhY2tCeSk7XG4gICAgfVxuICAgIHRoaXMuX25lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKiBTd2FwIG91dCBvbmUgYERhdGFTb3VyY2VgIGZvciBhbm90aGVyLiAqL1xuICBwcml2YXRlIF9jaGFuZ2VEYXRhU291cmNlKG9sZERzOiBEYXRhU291cmNlPFQ+IHwgbnVsbCwgbmV3RHM6IERhdGFTb3VyY2U8VD4gfCBudWxsKTpcbiAgICBPYnNlcnZhYmxlPFRbXSB8IFJlYWRvbmx5QXJyYXk8VD4+IHtcblxuICAgIGlmIChvbGREcykge1xuICAgICAgb2xkRHMuZGlzY29ubmVjdCh0aGlzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgcmV0dXJuIG5ld0RzID8gbmV3RHMuY29ubmVjdCh0aGlzKSA6IG9ic2VydmFibGVPZigpO1xuICB9XG5cbiAgLyoqIFVwZGF0ZSB0aGUgYENka1ZpcnR1YWxGb3JPZkNvbnRleHRgIGZvciBhbGwgdmlld3MuICovXG4gIHByaXZhdGUgX3VwZGF0ZUNvbnRleHQoKSB7XG4gICAgY29uc3QgY291bnQgPSB0aGlzLl9kYXRhLmxlbmd0aDtcbiAgICBsZXQgaSA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGxldCB2aWV3ID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5nZXQoaSkgYXMgRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+O1xuICAgICAgdmlldy5jb250ZXh0LmluZGV4ID0gdGhpcy5fcmVuZGVyZWRSYW5nZS5zdGFydCArIGk7XG4gICAgICB2aWV3LmNvbnRleHQuY291bnQgPSBjb3VudDtcbiAgICAgIHRoaXMuX3VwZGF0ZUNvbXB1dGVkQ29udGV4dFByb3BlcnRpZXModmlldy5jb250ZXh0KTtcbiAgICAgIHZpZXcuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBBcHBseSBjaGFuZ2VzIHRvIHRoZSBET00uICovXG4gIHByaXZhdGUgX2FwcGx5Q2hhbmdlcyhjaGFuZ2VzOiBJdGVyYWJsZUNoYW5nZXM8VD4pIHtcbiAgICAvLyBSZWFycmFuZ2UgdGhlIHZpZXdzIHRvIHB1dCB0aGVtIGluIHRoZSByaWdodCBsb2NhdGlvbi5cbiAgICBjaGFuZ2VzLmZvckVhY2hPcGVyYXRpb24oKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8VD4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGp1c3RlZFByZXZpb3VzSW5kZXg6IG51bWJlciB8IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50SW5kZXg6IG51bWJlciB8IG51bGwpID0+IHtcbiAgICAgIGlmIChyZWNvcmQucHJldmlvdXNJbmRleCA9PSBudWxsKSB7ICAvLyBJdGVtIGFkZGVkLlxuICAgICAgICBjb25zdCB2aWV3ID0gdGhpcy5faW5zZXJ0Vmlld0Zvck5ld0l0ZW0oY3VycmVudEluZGV4ISk7XG4gICAgICAgIHZpZXcuY29udGV4dC4kaW1wbGljaXQgPSByZWNvcmQuaXRlbTtcbiAgICAgIH0gZWxzZSBpZiAoY3VycmVudEluZGV4ID09IG51bGwpIHsgIC8vIEl0ZW0gcmVtb3ZlZC5cbiAgICAgICAgdGhpcy5fY2FjaGVWaWV3KHRoaXMuX2RldGFjaFZpZXcoYWRqdXN0ZWRQcmV2aW91c0luZGV4ICEpKTtcbiAgICAgIH0gZWxzZSB7ICAvLyBJdGVtIG1vdmVkLlxuICAgICAgICBjb25zdCB2aWV3ID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5nZXQoYWRqdXN0ZWRQcmV2aW91c0luZGV4ISkgYXNcbiAgICAgICAgICAgIEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PjtcbiAgICAgICAgdGhpcy5fdmlld0NvbnRhaW5lclJlZi5tb3ZlKHZpZXcsIGN1cnJlbnRJbmRleCk7XG4gICAgICAgIHZpZXcuY29udGV4dC4kaW1wbGljaXQgPSByZWNvcmQuaXRlbTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFVwZGF0ZSAkaW1wbGljaXQgZm9yIGFueSBpdGVtcyB0aGF0IGhhZCBhbiBpZGVudGl0eSBjaGFuZ2UuXG4gICAgY2hhbmdlcy5mb3JFYWNoSWRlbnRpdHlDaGFuZ2UoKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8VD4pID0+IHtcbiAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmdldChyZWNvcmQuY3VycmVudEluZGV4ISkgYXNcbiAgICAgICAgICBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj47XG4gICAgICB2aWV3LmNvbnRleHQuJGltcGxpY2l0ID0gcmVjb3JkLml0ZW07XG4gICAgfSk7XG5cbiAgICAvLyBVcGRhdGUgdGhlIGNvbnRleHQgdmFyaWFibGVzIG9uIGFsbCBpdGVtcy5cbiAgICBjb25zdCBjb3VudCA9IHRoaXMuX2RhdGEubGVuZ3RoO1xuICAgIGxldCBpID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgY29uc3QgdmlldyA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuZ2V0KGkpIGFzIEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PjtcbiAgICAgIHZpZXcuY29udGV4dC5pbmRleCA9IHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQgKyBpO1xuICAgICAgdmlldy5jb250ZXh0LmNvdW50ID0gY291bnQ7XG4gICAgICB0aGlzLl91cGRhdGVDb21wdXRlZENvbnRleHRQcm9wZXJ0aWVzKHZpZXcuY29udGV4dCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENhY2hlIHRoZSBnaXZlbiBkZXRhY2hlZCB2aWV3LiAqL1xuICBwcml2YXRlIF9jYWNoZVZpZXcodmlldzogRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+KSB7XG4gICAgaWYgKHRoaXMuX3RlbXBsYXRlQ2FjaGUubGVuZ3RoIDwgdGhpcy5jZGtWaXJ0dWFsRm9yVGVtcGxhdGVDYWNoZVNpemUpIHtcbiAgICAgIHRoaXMuX3RlbXBsYXRlQ2FjaGUucHVzaCh2aWV3KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgaW5kZXggPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmluZGV4T2Yodmlldyk7XG5cbiAgICAgIC8vIEl0J3MgdmVyeSB1bmxpa2VseSB0aGF0IHRoZSBpbmRleCB3aWxsIGV2ZXIgYmUgLTEsIGJ1dCBqdXN0IGluIGNhc2UsXG4gICAgICAvLyBkZXN0cm95IHRoZSB2aWV3IG9uIGl0cyBvd24sIG90aGVyd2lzZSBkZXN0cm95IGl0IHRocm91Z2ggdGhlXG4gICAgICAvLyBjb250YWluZXIgdG8gZW5zdXJlIHRoYXQgYWxsIHRoZSByZWZlcmVuY2VzIGFyZSByZW1vdmVkLlxuICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICB2aWV3LmRlc3Ryb3koKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3ZpZXdDb250YWluZXJSZWYucmVtb3ZlKGluZGV4KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogSW5zZXJ0cyBhIHZpZXcgZm9yIGEgbmV3IGl0ZW0sIGVpdGhlciBmcm9tIHRoZSBjYWNoZSBvciBieSBjcmVhdGluZyBhIG5ldyBvbmUuICovXG4gIHByaXZhdGUgX2luc2VydFZpZXdGb3JOZXdJdGVtKGluZGV4OiBudW1iZXIpOiBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj4ge1xuICAgIHJldHVybiB0aGlzLl9pbnNlcnRWaWV3RnJvbUNhY2hlKGluZGV4KSB8fCB0aGlzLl9jcmVhdGVFbWJlZGRlZFZpZXdBdChpbmRleCk7XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSBjb21wdXRlZCBwcm9wZXJ0aWVzIG9uIHRoZSBgQ2RrVmlydHVhbEZvck9mQ29udGV4dGAuICovXG4gIHByaXZhdGUgX3VwZGF0ZUNvbXB1dGVkQ29udGV4dFByb3BlcnRpZXMoY29udGV4dDogQ2RrVmlydHVhbEZvck9mQ29udGV4dDxhbnk+KSB7XG4gICAgY29udGV4dC5maXJzdCA9IGNvbnRleHQuaW5kZXggPT09IDA7XG4gICAgY29udGV4dC5sYXN0ID0gY29udGV4dC5pbmRleCA9PT0gY29udGV4dC5jb3VudCAtIDE7XG4gICAgY29udGV4dC5ldmVuID0gY29udGV4dC5pbmRleCAlIDIgPT09IDA7XG4gICAgY29udGV4dC5vZGQgPSAhY29udGV4dC5ldmVuO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBuZXcgZW1iZWRkZWQgdmlldyBhbmQgbW92ZXMgaXQgdG8gdGhlIGdpdmVuIGluZGV4ICovXG4gIHByaXZhdGUgX2NyZWF0ZUVtYmVkZGVkVmlld0F0KGluZGV4OiBudW1iZXIpOiBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj4ge1xuICAgIC8vIE5vdGUgdGhhdCBpdCdzIGltcG9ydGFudCB0aGF0IHdlIGluc2VydCB0aGUgaXRlbSBkaXJlY3RseSBhdCB0aGUgcHJvcGVyIGluZGV4LFxuICAgIC8vIHJhdGhlciB0aGFuIGluc2VydGluZyBpdCBhbmQgdGhlIG1vdmluZyBpdCBpbiBwbGFjZSwgYmVjYXVzZSBpZiB0aGVyZSdzIGEgZGlyZWN0aXZlXG4gICAgLy8gb24gdGhlIHNhbWUgbm9kZSB0aGF0IGluamVjdHMgdGhlIGBWaWV3Q29udGFpbmVyUmVmYCwgQW5ndWxhciB3aWxsIGluc2VydCBhbm90aGVyXG4gICAgLy8gY29tbWVudCBub2RlIHdoaWNoIGNhbiB0aHJvdyBvZmYgdGhlIG1vdmUgd2hlbiBpdCdzIGJlaW5nIHJlcGVhdGVkIGZvciBhbGwgaXRlbXMuXG4gICAgcmV0dXJuIHRoaXMuX3ZpZXdDb250YWluZXJSZWYuY3JlYXRlRW1iZWRkZWRWaWV3KHRoaXMuX3RlbXBsYXRlLCB7XG4gICAgICAkaW1wbGljaXQ6IG51bGwhLFxuICAgICAgLy8gSXQncyBndWFyYW50ZWVkIHRoYXQgdGhlIGl0ZXJhYmxlIGlzIG5vdCBcInVuZGVmaW5lZFwiIG9yIFwibnVsbFwiIGJlY2F1c2Ugd2Ugb25seVxuICAgICAgLy8gZ2VuZXJhdGUgdmlld3MgZm9yIGVsZW1lbnRzIGlmIHRoZSBcImNka1ZpcnR1YWxGb3JPZlwiIGl0ZXJhYmxlIGhhcyBlbGVtZW50cy5cbiAgICAgIGNka1ZpcnR1YWxGb3JPZjogdGhpcy5fY2RrVmlydHVhbEZvck9mISxcbiAgICAgIGluZGV4OiAtMSxcbiAgICAgIGNvdW50OiAtMSxcbiAgICAgIGZpcnN0OiBmYWxzZSxcbiAgICAgIGxhc3Q6IGZhbHNlLFxuICAgICAgb2RkOiBmYWxzZSxcbiAgICAgIGV2ZW46IGZhbHNlXG4gICAgfSwgaW5kZXgpO1xuICB9XG5cbiAgLyoqIEluc2VydHMgYSByZWN5Y2xlZCB2aWV3IGZyb20gdGhlIGNhY2hlIGF0IHRoZSBnaXZlbiBpbmRleC4gKi9cbiAgcHJpdmF0ZSBfaW5zZXJ0Vmlld0Zyb21DYWNoZShpbmRleDogbnVtYmVyKTogRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+fG51bGwge1xuICAgIGNvbnN0IGNhY2hlZFZpZXcgPSB0aGlzLl90ZW1wbGF0ZUNhY2hlLnBvcCgpO1xuICAgIGlmIChjYWNoZWRWaWV3KSB7XG4gICAgICB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmluc2VydChjYWNoZWRWaWV3LCBpbmRleCk7XG4gICAgfVxuICAgIHJldHVybiBjYWNoZWRWaWV3IHx8IG51bGw7XG4gIH1cblxuICAvKiogRGV0YWNoZXMgdGhlIGVtYmVkZGVkIHZpZXcgYXQgdGhlIGdpdmVuIGluZGV4LiAqL1xuICBwcml2YXRlIF9kZXRhY2hWaWV3KGluZGV4OiBudW1iZXIpOiBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj4ge1xuICAgIHJldHVybiB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmRldGFjaChpbmRleCkgYXNcbiAgICAgICAgRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+O1xuICB9XG59XG4iXX0=