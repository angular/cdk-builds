/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ArrayDataSource, isDataSource, _RecycleViewRepeaterStrategy, _VIEW_REPEATER_STRATEGY, } from '@angular/cdk/collections';
import { Directive, Inject, Input, IterableDiffers, NgZone, SkipSelf, TemplateRef, ViewContainerRef, } from '@angular/core';
import { coerceNumberProperty } from '@angular/cdk/coercion';
import { Subject, of as observableOf, isObservable } from 'rxjs';
import { pairwise, shareReplay, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { CdkVirtualScrollViewport } from './virtual-scroll-viewport';
/** Helper to extract the offset of a DOM Node in a certain direction. */
function getOffset(orientation, direction, node) {
    const el = node;
    if (!el.getBoundingClientRect) {
        return 0;
    }
    const rect = el.getBoundingClientRect();
    if (orientation === 'horizontal') {
        return direction === 'start' ? rect.left : rect.right;
    }
    return direction === 'start' ? rect.top : rect.bottom;
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
    /** The strategy used to render items in the virtual scroll viewport. */
    _viewRepeater, 
    /** The virtual scrolling viewport that these items are being rendered in. */
    _viewport, ngZone) {
        this._viewContainerRef = _viewContainerRef;
        this._template = _template;
        this._differs = _differs;
        this._viewRepeater = _viewRepeater;
        this._viewport = _viewport;
        /** Emits when the rendered view of the data changes. */
        this.viewChange = new Subject();
        /** Subject that emits when a new DataSource instance is given. */
        this._dataSourceChanges = new Subject();
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
     * The size of the cache used to store templates that are not being used for re-use later.
     * Setting the cache size to `0` will disable caching. Defaults to 20 templates.
     */
    get cdkVirtualForTemplateCacheSize() {
        return this._viewRepeater.viewCacheSize;
    }
    set cdkVirtualForTemplateCacheSize(size) {
        this._viewRepeater.viewCacheSize = coerceNumberProperty(size);
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
        // Loop over all the views, find the first and land node and compute the size by subtracting
        // the top of the first node from the bottom of the last one.
        let firstNode;
        let lastNode;
        // Find the first node by starting from the beginning and going forwards.
        for (let i = 0; i < rangeLen; i++) {
            const view = this._viewContainerRef.get(i + renderedStartIndex);
            if (view && view.rootNodes.length) {
                firstNode = lastNode = view.rootNodes[0];
                break;
            }
        }
        // Find the last node by starting from the end and going backwards.
        for (let i = rangeLen - 1; i > -1; i--) {
            const view = this._viewContainerRef.get(i + renderedStartIndex);
            if (view && view.rootNodes.length) {
                lastNode = view.rootNodes[view.rootNodes.length - 1];
                break;
            }
        }
        return firstNode && lastNode ?
            getOffset(orientation, 'end', lastNode) - getOffset(orientation, 'start', firstNode) : 0;
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
        this._viewRepeater.detach();
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
        this._viewRepeater.applyChanges(changes, this._viewContainerRef, (record, adjustedPreviousIndex, currentIndex) => this._getEmbeddedViewArgs(record, currentIndex), (record) => record.item);
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
    /** Update the computed properties on the `CdkVirtualForOfContext`. */
    _updateComputedContextProperties(context) {
        context.first = context.index === 0;
        context.last = context.index === context.count - 1;
        context.even = context.index % 2 === 0;
        context.odd = !context.even;
    }
    _getEmbeddedViewArgs(record, index) {
        // Note that it's important that we insert the item directly at the proper index,
        // rather than inserting it and the moving it in place, because if there's a directive
        // on the same node that injects the `ViewContainerRef`, Angular will insert another
        // comment node which can throw off the move when it's being repeated for all items.
        return {
            templateRef: this._template,
            context: {
                $implicit: record.item,
                // It's guaranteed that the iterable is not "undefined" or "null" because we only
                // generate views for elements if the "cdkVirtualForOf" iterable has elements.
                cdkVirtualForOf: this._cdkVirtualForOf,
                index: -1,
                count: -1,
                first: false,
                last: false,
                odd: false,
                even: false
            },
            index,
        };
    }
}
CdkVirtualForOf.decorators = [
    { type: Directive, args: [{
                selector: '[cdkVirtualFor][cdkVirtualForOf]',
                providers: [
                    { provide: _VIEW_REPEATER_STRATEGY, useClass: _RecycleViewRepeaterStrategy },
                ]
            },] }
];
CdkVirtualForOf.ctorParameters = () => [
    { type: ViewContainerRef },
    { type: TemplateRef },
    { type: IterableDiffers },
    { type: _RecycleViewRepeaterStrategy, decorators: [{ type: Inject, args: [_VIEW_REPEATER_STRATEGY,] }] },
    { type: CdkVirtualScrollViewport, decorators: [{ type: SkipSelf }] },
    { type: NgZone }
];
CdkVirtualForOf.propDecorators = {
    cdkVirtualForOf: [{ type: Input }],
    cdkVirtualForTrackBy: [{ type: Input }],
    cdkVirtualForTemplate: [{ type: Input }],
    cdkVirtualForTemplateCacheSize: [{ type: Input }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1mb3Itb2YuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy92aXJ0dWFsLWZvci1vZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsZUFBZSxFQUlmLFlBQVksRUFDWiw0QkFBNEIsRUFDNUIsdUJBQXVCLEdBRXhCLE1BQU0sMEJBQTBCLENBQUM7QUFDbEMsT0FBTyxFQUNMLFNBQVMsRUFHVCxNQUFNLEVBQ04sS0FBSyxFQUlMLGVBQWUsRUFFZixNQUFNLEVBRU4sUUFBUSxFQUNSLFdBQVcsRUFFWCxnQkFBZ0IsR0FDakIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLG9CQUFvQixFQUFjLE1BQU0sdUJBQXVCLENBQUM7QUFDeEUsT0FBTyxFQUFhLE9BQU8sRUFBRSxFQUFFLElBQUksWUFBWSxFQUFFLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUMzRSxPQUFPLEVBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXRGLE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBd0JuRSx5RUFBeUU7QUFDekUsU0FBUyxTQUFTLENBQUMsV0FBc0MsRUFBRSxTQUEwQixFQUFFLElBQVU7SUFDL0YsTUFBTSxFQUFFLEdBQUcsSUFBZSxDQUFDO0lBQzNCLElBQUksQ0FBQyxFQUFFLENBQUMscUJBQXFCLEVBQUU7UUFDN0IsT0FBTyxDQUFDLENBQUM7S0FDVjtJQUNELE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO0lBRXhDLElBQUksV0FBVyxLQUFLLFlBQVksRUFBRTtRQUNoQyxPQUFPLFNBQVMsS0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxD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RSxLQUFLO2dCQUNYLEdBQUcsRUFBRSxLQUFLO2dCQUNWLElBQUksRUFBRSxLQUFLO2FBQ1o7WUFDRCxLQUFLO1NBQ04sQ0FBQztJQUNKLENBQUM7OztZQXRTRixTQUFTLFNBQUM7Z0JBQ1QsUUFBUSxFQUFFLGtDQUFrQztnQkFDNUMsU0FBUyxFQUFFO29CQUNULEVBQUMsT0FBTyxFQUFFLHVCQUF1QixFQUFFLFFBQVEsRUFBRSw0QkFBNEIsRUFBQztpQkFDM0U7YUFDRjs7O1lBdERDLGdCQUFnQjtZQUZoQixXQUFXO1lBTFgsZUFBZTtZQWJmLDRCQUE0Qix1QkFpTHZCLE1BQU0sU0FBQyx1QkFBdUI7WUF2SjdCLHdCQUF3Qix1QkEwSnpCLFFBQVE7WUFyS2IsTUFBTTs7OzhCQXFFTCxLQUFLO21DQXFCTCxLQUFLO29DQWFMLEtBQUs7NkNBWUwsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBBcnJheURhdGFTb3VyY2UsXG4gIENvbGxlY3Rpb25WaWV3ZXIsXG4gIERhdGFTb3VyY2UsXG4gIExpc3RSYW5nZSxcbiAgaXNEYXRhU291cmNlLFxuICBfUmVjeWNsZVZpZXdSZXBlYXRlclN0cmF0ZWd5LFxuICBfVklFV19SRVBFQVRFUl9TVFJBVEVHWSxcbiAgX1ZpZXdSZXBlYXRlckl0ZW1JbnNlcnRBcmdzLFxufSBmcm9tICdAYW5ndWxhci9jZGsvY29sbGVjdGlvbnMnO1xuaW1wb3J0IHtcbiAgRGlyZWN0aXZlLFxuICBEb0NoZWNrLFxuICBFbWJlZGRlZFZpZXdSZWYsXG4gIEluamVjdCxcbiAgSW5wdXQsXG4gIEl0ZXJhYmxlQ2hhbmdlUmVjb3JkLFxuICBJdGVyYWJsZUNoYW5nZXMsXG4gIEl0ZXJhYmxlRGlmZmVyLFxuICBJdGVyYWJsZURpZmZlcnMsXG4gIE5nSXRlcmFibGUsXG4gIE5nWm9uZSxcbiAgT25EZXN0cm95LFxuICBTa2lwU2VsZixcbiAgVGVtcGxhdGVSZWYsXG4gIFRyYWNrQnlGdW5jdGlvbixcbiAgVmlld0NvbnRhaW5lclJlZixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge2NvZXJjZU51bWJlclByb3BlcnR5LCBOdW1iZXJJbnB1dH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdCwgb2YgYXMgb2JzZXJ2YWJsZU9mLCBpc09ic2VydmFibGV9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtwYWlyd2lzZSwgc2hhcmVSZXBsYXksIHN0YXJ0V2l0aCwgc3dpdGNoTWFwLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7Q2RrVmlydHVhbFNjcm9sbFJlcGVhdGVyfSBmcm9tICcuL3ZpcnR1YWwtc2Nyb2xsLXJlcGVhdGVyJztcbmltcG9ydCB7Q2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0fSBmcm9tICcuL3ZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0JztcblxuXG4vKiogVGhlIGNvbnRleHQgZm9yIGFuIGl0ZW0gcmVuZGVyZWQgYnkgYENka1ZpcnR1YWxGb3JPZmAgKi9cbmV4cG9ydCB0eXBlIENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4gPSB7XG4gIC8qKiBUaGUgaXRlbSB2YWx1ZS4gKi9cbiAgJGltcGxpY2l0OiBUO1xuICAvKiogVGhlIERhdGFTb3VyY2UsIE9ic2VydmFibGUsIG9yIE5nSXRlcmFibGUgdGhhdCB3YXMgcGFzc2VkIHRvICpjZGtWaXJ0dWFsRm9yLiAqL1xuICBjZGtWaXJ0dWFsRm9yT2Y6IERhdGFTb3VyY2U8VD4gfCBPYnNlcnZhYmxlPFRbXT4gfCBOZ0l0ZXJhYmxlPFQ+O1xuICAvKiogVGhlIGluZGV4IG9mIHRoZSBpdGVtIGluIHRoZSBEYXRhU291cmNlLiAqL1xuICBpbmRleDogbnVtYmVyO1xuICAvKiogVGhlIG51bWJlciBvZiBpdGVtcyBpbiB0aGUgRGF0YVNvdXJjZS4gKi9cbiAgY291bnQ6IG51bWJlcjtcbiAgLyoqIFdoZXRoZXIgdGhpcyBpcyB0aGUgZmlyc3QgaXRlbSBpbiB0aGUgRGF0YVNvdXJjZS4gKi9cbiAgZmlyc3Q6IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIHRoaXMgaXMgdGhlIGxhc3QgaXRlbSBpbiB0aGUgRGF0YVNvdXJjZS4gKi9cbiAgbGFzdDogYm9vbGVhbjtcbiAgLyoqIFdoZXRoZXIgdGhlIGluZGV4IGlzIGV2ZW4uICovXG4gIGV2ZW46IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIHRoZSBpbmRleCBpcyBvZGQuICovXG4gIG9kZDogYm9vbGVhbjtcbn07XG5cblxuLyoqIEhlbHBlciB0byBleHRyYWN0IHRoZSBvZmZzZXQgb2YgYSBET00gTm9kZSBpbiBhIGNlcnRhaW4gZGlyZWN0aW9uLiAqL1xuZnVuY3Rpb24gZ2V0T2Zmc2V0KG9yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcgfCAndmVydGljYWwnLCBkaXJlY3Rpb246ICdzdGFydCcgfCAnZW5kJywgbm9kZTogTm9kZSkge1xuICBjb25zdCBlbCA9IG5vZGUgYXMgRWxlbWVudDtcbiAgaWYgKCFlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuICBjb25zdCByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgaWYgKG9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcpIHtcbiAgICByZXR1cm4gZGlyZWN0aW9uID09PSAnc3RhcnQnID8gcmVjdC5sZWZ0IDogcmVjdC5yaWdodDtcbiAgfVxuXG4gIHJldHVybiBkaXJlY3Rpb24gPT09ICdzdGFydCcgPyByZWN0LnRvcCA6IHJlY3QuYm90dG9tO1xufVxuXG4vKipcbiAqIEEgZGlyZWN0aXZlIHNpbWlsYXIgdG8gYG5nRm9yT2ZgIHRvIGJlIHVzZWQgZm9yIHJlbmRlcmluZyBkYXRhIGluc2lkZSBhIHZpcnR1YWwgc2Nyb2xsaW5nXG4gKiBjb250YWluZXIuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtWaXJ0dWFsRm9yXVtjZGtWaXJ0dWFsRm9yT2ZdJyxcbiAgcHJvdmlkZXJzOiBbXG4gICAge3Byb3ZpZGU6IF9WSUVXX1JFUEVBVEVSX1NUUkFURUdZLCB1c2VDbGFzczogX1JlY3ljbGVWaWV3UmVwZWF0ZXJTdHJhdGVneX0sXG4gIF1cbn0pXG5leHBvcnQgY2xhc3MgQ2RrVmlydHVhbEZvck9mPFQ+IGltcGxlbWVudHNcbiAgICBDZGtWaXJ0dWFsU2Nyb2xsUmVwZWF0ZXI8VD4sIENvbGxlY3Rpb25WaWV3ZXIsIERvQ2hlY2ssIE9uRGVzdHJveSB7XG4gIC8qKiBFbWl0cyB3aGVuIHRoZSByZW5kZXJlZCB2aWV3IG9mIHRoZSBkYXRhIGNoYW5nZXMuICovXG4gIHZpZXdDaGFuZ2UgPSBuZXcgU3ViamVjdDxMaXN0UmFuZ2U+KCk7XG5cbiAgLyoqIFN1YmplY3QgdGhhdCBlbWl0cyB3aGVuIGEgbmV3IERhdGFTb3VyY2UgaW5zdGFuY2UgaXMgZ2l2ZW4uICovXG4gIHByaXZhdGUgX2RhdGFTb3VyY2VDaGFuZ2VzID0gbmV3IFN1YmplY3Q8RGF0YVNvdXJjZTxUPj4oKTtcblxuICAvKiogVGhlIERhdGFTb3VyY2UgdG8gZGlzcGxheS4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGNka1ZpcnR1YWxGb3JPZigpOiBEYXRhU291cmNlPFQ+IHwgT2JzZXJ2YWJsZTxUW10+IHwgTmdJdGVyYWJsZTxUPiB8IG51bGwgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9jZGtWaXJ0dWFsRm9yT2Y7XG4gIH1cbiAgc2V0IGNka1ZpcnR1YWxGb3JPZih2YWx1ZTogRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8VFtdPiB8IE5nSXRlcmFibGU8VD4gfCBudWxsIHwgdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5fY2RrVmlydHVhbEZvck9mID0gdmFsdWU7XG4gICAgaWYgKGlzRGF0YVNvdXJjZSh2YWx1ZSkpIHtcbiAgICAgIHRoaXMuX2RhdGFTb3VyY2VDaGFuZ2VzLm5leHQodmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBTbGljZSB0aGUgdmFsdWUgaWYgaXRzIGFuIE5nSXRlcmFibGUgdG8gZW5zdXJlIHdlJ3JlIHdvcmtpbmcgd2l0aCBhbiBhcnJheS5cbiAgICAgIHRoaXMuX2RhdGFTb3VyY2VDaGFuZ2VzLm5leHQobmV3IEFycmF5RGF0YVNvdXJjZTxUPihcbiAgICAgICAgICBpc09ic2VydmFibGUodmFsdWUpID8gdmFsdWUgOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh2YWx1ZSB8fCBbXSkpKTtcbiAgICB9XG4gIH1cblxuICBfY2RrVmlydHVhbEZvck9mOiBEYXRhU291cmNlPFQ+IHwgT2JzZXJ2YWJsZTxUW10+IHwgTmdJdGVyYWJsZTxUPiB8IG51bGwgfCB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFRoZSBgVHJhY2tCeUZ1bmN0aW9uYCB0byB1c2UgZm9yIHRyYWNraW5nIGNoYW5nZXMuIFRoZSBgVHJhY2tCeUZ1bmN0aW9uYCB0YWtlcyB0aGUgaW5kZXggYW5kXG4gICAqIHRoZSBpdGVtIGFuZCBwcm9kdWNlcyBhIHZhbHVlIHRvIGJlIHVzZWQgYXMgdGhlIGl0ZW0ncyBpZGVudGl0eSB3aGVuIHRyYWNraW5nIGNoYW5nZXMuXG4gICAqL1xuICBASW5wdXQoKVxuICBnZXQgY2RrVmlydHVhbEZvclRyYWNrQnkoKTogVHJhY2tCeUZ1bmN0aW9uPFQ+IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fY2RrVmlydHVhbEZvclRyYWNrQnk7XG4gIH1cbiAgc2V0IGNka1ZpcnR1YWxGb3JUcmFja0J5KGZuOiBUcmFja0J5RnVuY3Rpb248VD4gfCB1bmRlZmluZWQpIHtcbiAgICB0aGlzLl9uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgdGhpcy5fY2RrVmlydHVhbEZvclRyYWNrQnkgPSBmbiA/XG4gICAgICAgIChpbmRleCwgaXRlbSkgPT4gZm4oaW5kZXggKyAodGhpcy5fcmVuZGVyZWRSYW5nZSA/IHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQgOiAwKSwgaXRlbSkgOlxuICAgICAgICB1bmRlZmluZWQ7XG4gIH1cbiAgcHJpdmF0ZSBfY2RrVmlydHVhbEZvclRyYWNrQnk6IFRyYWNrQnlGdW5jdGlvbjxUPiB8IHVuZGVmaW5lZDtcblxuICAvKiogVGhlIHRlbXBsYXRlIHVzZWQgdG8gc3RhbXAgb3V0IG5ldyBlbGVtZW50cy4gKi9cbiAgQElucHV0KClcbiAgc2V0IGNka1ZpcnR1YWxGb3JUZW1wbGF0ZSh2YWx1ZTogVGVtcGxhdGVSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj4pIHtcbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIHRoaXMuX25lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICAgIHRoaXMuX3RlbXBsYXRlID0gdmFsdWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBzaXplIG9mIHRoZSBjYWNoZSB1c2VkIHRvIHN0b3JlIHRlbXBsYXRlcyB0aGF0IGFyZSBub3QgYmVpbmcgdXNlZCBmb3IgcmUtdXNlIGxhdGVyLlxuICAgKiBTZXR0aW5nIHRoZSBjYWNoZSBzaXplIHRvIGAwYCB3aWxsIGRpc2FibGUgY2FjaGluZy4gRGVmYXVsdHMgdG8gMjAgdGVtcGxhdGVzLlxuICAgKi9cbiAgQElucHV0KClcbiAgZ2V0IGNka1ZpcnR1YWxGb3JUZW1wbGF0ZUNhY2hlU2l6ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fdmlld1JlcGVhdGVyLnZpZXdDYWNoZVNpemU7XG4gIH1cbiAgc2V0IGNka1ZpcnR1YWxGb3JUZW1wbGF0ZUNhY2hlU2l6ZShzaXplOiBudW1iZXIpIHtcbiAgICB0aGlzLl92aWV3UmVwZWF0ZXIudmlld0NhY2hlU2l6ZSA9IGNvZXJjZU51bWJlclByb3BlcnR5KHNpemUpO1xuICB9XG5cbiAgLyoqIEVtaXRzIHdoZW5ldmVyIHRoZSBkYXRhIGluIHRoZSBjdXJyZW50IERhdGFTb3VyY2UgY2hhbmdlcy4gKi9cbiAgZGF0YVN0cmVhbTogT2JzZXJ2YWJsZTxUW10gfCBSZWFkb25seUFycmF5PFQ+PiA9IHRoaXMuX2RhdGFTb3VyY2VDaGFuZ2VzXG4gIC5waXBlKFxuICAgICAgLy8gU3RhcnQgb2ZmIHdpdGggbnVsbCBgRGF0YVNvdXJjZWAuXG4gICAgICBzdGFydFdpdGgobnVsbCEpLFxuICAgICAgLy8gQnVuZGxlIHVwIHRoZSBwcmV2aW91cyBhbmQgY3VycmVudCBkYXRhIHNvdXJjZXMgc28gd2UgY2FuIHdvcmsgd2l0aCBib3RoLlxuICAgICAgcGFpcndpc2UoKSxcbiAgICAgIC8vIFVzZSBgX2NoYW5nZURhdGFTb3VyY2VgIHRvIGRpc2Nvbm5lY3QgZnJvbSB0aGUgcHJldmlvdXMgZGF0YSBzb3VyY2UgYW5kIGNvbm5lY3QgdG8gdGhlXG4gICAgICAvLyBuZXcgb25lLCBwYXNzaW5nIGJhY2sgYSBzdHJlYW0gb2YgZGF0YSBjaGFuZ2VzIHdoaWNoIHdlIHJ1biB0aHJvdWdoIGBzd2l0Y2hNYXBgIHRvIGdpdmVcbiAgICAgIC8vIHVzIGEgZGF0YSBzdHJlYW0gdGhhdCBlbWl0cyB0aGUgbGF0ZXN0IGRhdGEgZnJvbSB3aGF0ZXZlciB0aGUgY3VycmVudCBgRGF0YVNvdXJjZWAgaXMuXG4gICAgICBzd2l0Y2hNYXAoKFtwcmV2LCBjdXJdKSA9PiB0aGlzLl9jaGFuZ2VEYXRhU291cmNlKHByZXYsIGN1cikpLFxuICAgICAgLy8gUmVwbGF5IHRoZSBsYXN0IGVtaXR0ZWQgZGF0YSB3aGVuIHNvbWVvbmUgc3Vic2NyaWJlcy5cbiAgICAgIHNoYXJlUmVwbGF5KDEpKTtcblxuICAvKiogVGhlIGRpZmZlciB1c2VkIHRvIGNhbGN1bGF0ZSBjaGFuZ2VzIHRvIHRoZSBkYXRhLiAqL1xuICBwcml2YXRlIF9kaWZmZXI6IEl0ZXJhYmxlRGlmZmVyPFQ+IHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIFRoZSBtb3N0IHJlY2VudCBkYXRhIGVtaXR0ZWQgZnJvbSB0aGUgRGF0YVNvdXJjZS4gKi9cbiAgcHJpdmF0ZSBfZGF0YTogVFtdIHwgUmVhZG9ubHlBcnJheTxUPjtcblxuICAvKiogVGhlIGN1cnJlbnRseSByZW5kZXJlZCBpdGVtcy4gKi9cbiAgcHJpdmF0ZSBfcmVuZGVyZWRJdGVtczogVFtdO1xuXG4gIC8qKiBUaGUgY3VycmVudGx5IHJlbmRlcmVkIHJhbmdlIG9mIGluZGljZXMuICovXG4gIHByaXZhdGUgX3JlbmRlcmVkUmFuZ2U6IExpc3RSYW5nZTtcblxuICAvKiogV2hldGhlciB0aGUgcmVuZGVyZWQgZGF0YSBzaG91bGQgYmUgdXBkYXRlZCBkdXJpbmcgdGhlIG5leHQgbmdEb0NoZWNrIGN5Y2xlLiAqL1xuICBwcml2YXRlIF9uZWVkc1VwZGF0ZSA9IGZhbHNlO1xuXG4gIHByaXZhdGUgX2Rlc3Ryb3llZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICAvKiogVGhlIHZpZXcgY29udGFpbmVyIHRvIGFkZCBpdGVtcyB0by4gKi9cbiAgICAgIHByaXZhdGUgX3ZpZXdDb250YWluZXJSZWY6IFZpZXdDb250YWluZXJSZWYsXG4gICAgICAvKiogVGhlIHRlbXBsYXRlIHRvIHVzZSB3aGVuIHN0YW1waW5nIG91dCBuZXcgaXRlbXMuICovXG4gICAgICBwcml2YXRlIF90ZW1wbGF0ZTogVGVtcGxhdGVSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj4sXG4gICAgICAvKiogVGhlIHNldCBvZiBhdmFpbGFibGUgZGlmZmVycy4gKi9cbiAgICAgIHByaXZhdGUgX2RpZmZlcnM6IEl0ZXJhYmxlRGlmZmVycyxcbiAgICAgIC8qKiBUaGUgc3RyYXRlZ3kgdXNlZCB0byByZW5kZXIgaXRlbXMgaW4gdGhlIHZpcnR1YWwgc2Nyb2xsIHZpZXdwb3J0LiAqL1xuICAgICAgQEluamVjdChfVklFV19SRVBFQVRFUl9TVFJBVEVHWSlcbiAgICAgIHByaXZhdGUgX3ZpZXdSZXBlYXRlcjogX1JlY3ljbGVWaWV3UmVwZWF0ZXJTdHJhdGVneTxULCBULCBDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PixcbiAgICAgIC8qKiBUaGUgdmlydHVhbCBzY3JvbGxpbmcgdmlld3BvcnQgdGhhdCB0aGVzZSBpdGVtcyBhcmUgYmVpbmcgcmVuZGVyZWQgaW4uICovXG4gICAgICBAU2tpcFNlbGYoKSBwcml2YXRlIF92aWV3cG9ydDogQ2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0LFxuICAgICAgbmdab25lOiBOZ1pvbmUpIHtcbiAgICB0aGlzLmRhdGFTdHJlYW0uc3Vic2NyaWJlKGRhdGEgPT4ge1xuICAgICAgdGhpcy5fZGF0YSA9IGRhdGE7XG4gICAgICB0aGlzLl9vblJlbmRlcmVkRGF0YUNoYW5nZSgpO1xuICAgIH0pO1xuICAgIHRoaXMuX3ZpZXdwb3J0LnJlbmRlcmVkUmFuZ2VTdHJlYW0ucGlwZSh0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSkuc3Vic2NyaWJlKHJhbmdlID0+IHtcbiAgICAgIHRoaXMuX3JlbmRlcmVkUmFuZ2UgPSByYW5nZTtcbiAgICAgIG5nWm9uZS5ydW4oKCkgPT4gdGhpcy52aWV3Q2hhbmdlLm5leHQodGhpcy5fcmVuZGVyZWRSYW5nZSkpO1xuICAgICAgdGhpcy5fb25SZW5kZXJlZERhdGFDaGFuZ2UoKTtcbiAgICB9KTtcbiAgICB0aGlzLl92aWV3cG9ydC5hdHRhY2godGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogTWVhc3VyZXMgdGhlIGNvbWJpbmVkIHNpemUgKHdpZHRoIGZvciBob3Jpem9udGFsIG9yaWVudGF0aW9uLCBoZWlnaHQgZm9yIHZlcnRpY2FsKSBvZiBhbGwgaXRlbXNcbiAgICogaW4gdGhlIHNwZWNpZmllZCByYW5nZS4gVGhyb3dzIGFuIGVycm9yIGlmIHRoZSByYW5nZSBpbmNsdWRlcyBpdGVtcyB0aGF0IGFyZSBub3QgY3VycmVudGx5XG4gICAqIHJlbmRlcmVkLlxuICAgKi9cbiAgbWVhc3VyZVJhbmdlU2l6ZShyYW5nZTogTGlzdFJhbmdlLCBvcmllbnRhdGlvbjogJ2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJyk6IG51bWJlciB7XG4gICAgaWYgKHJhbmdlLnN0YXJ0ID49IHJhbmdlLmVuZCkge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGlmIChyYW5nZS5zdGFydCA8IHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQgfHwgcmFuZ2UuZW5kID4gdGhpcy5fcmVuZGVyZWRSYW5nZS5lbmQpIHtcbiAgICAgIHRocm93IEVycm9yKGBFcnJvcjogYXR0ZW1wdGVkIHRvIG1lYXN1cmUgYW4gaXRlbSB0aGF0IGlzbid0IHJlbmRlcmVkLmApO1xuICAgIH1cblxuICAgIC8vIFRoZSBpbmRleCBpbnRvIHRoZSBsaXN0IG9mIHJlbmRlcmVkIHZpZXdzIGZvciB0aGUgZmlyc3QgaXRlbSBpbiB0aGUgcmFuZ2UuXG4gICAgY29uc3QgcmVuZGVyZWRTdGFydEluZGV4ID0gcmFuZ2Uuc3RhcnQgLSB0aGlzLl9yZW5kZXJlZFJhbmdlLnN0YXJ0O1xuICAgIC8vIFRoZSBsZW5ndGggb2YgdGhlIHJhbmdlIHdlJ3JlIG1lYXN1cmluZy5cbiAgICBjb25zdCByYW5nZUxlbiA9IHJhbmdlLmVuZCAtIHJhbmdlLnN0YXJ0O1xuXG4gICAgLy8gTG9vcCBvdmVyIGFsbCB0aGUgdmlld3MsIGZpbmQgdGhlIGZpcnN0IGFuZCBsYW5kIG5vZGUgYW5kIGNvbXB1dGUgdGhlIHNpemUgYnkgc3VidHJhY3RpbmdcbiAgICAvLyB0aGUgdG9wIG9mIHRoZSBmaXJzdCBub2RlIGZyb20gdGhlIGJvdHRvbSBvZiB0aGUgbGFzdCBvbmUuXG4gICAgbGV0IGZpcnN0Tm9kZTogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQ7XG4gICAgbGV0IGxhc3ROb2RlOiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZDtcblxuICAgIC8vIEZpbmQgdGhlIGZpcnN0IG5vZGUgYnkgc3RhcnRpbmcgZnJvbSB0aGUgYmVnaW5uaW5nIGFuZCBnb2luZyBmb3J3YXJkcy5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJhbmdlTGVuOyBpKyspIHtcbiAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmdldChpICsgcmVuZGVyZWRTdGFydEluZGV4KSBhc1xuICAgICAgICAgIEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PiB8IG51bGw7XG4gICAgICBpZiAodmlldyAmJiB2aWV3LnJvb3ROb2Rlcy5sZW5ndGgpIHtcbiAgICAgICAgZmlyc3ROb2RlID0gbGFzdE5vZGUgPSB2aWV3LnJvb3ROb2Rlc1swXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRmluZCB0aGUgbGFzdCBub2RlIGJ5IHN0YXJ0aW5nIGZyb20gdGhlIGVuZCBhbmQgZ29pbmcgYmFja3dhcmRzLlxuICAgIGZvciAobGV0IGkgPSByYW5nZUxlbiAtIDE7IGkgPiAtMTsgaS0tKSB7XG4gICAgICBjb25zdCB2aWV3ID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5nZXQoaSArIHJlbmRlcmVkU3RhcnRJbmRleCkgYXNcbiAgICAgICAgICBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj4gfCBudWxsO1xuICAgICAgaWYgKHZpZXcgJiYgdmlldy5yb290Tm9kZXMubGVuZ3RoKSB7XG4gICAgICAgIGxhc3ROb2RlID0gdmlldy5yb290Tm9kZXNbdmlldy5yb290Tm9kZXMubGVuZ3RoIC0gMV07XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmaXJzdE5vZGUgJiYgbGFzdE5vZGUgP1xuICAgICAgICBnZXRPZmZzZXQob3JpZW50YXRpb24sICdlbmQnLCBsYXN0Tm9kZSkgLSBnZXRPZmZzZXQob3JpZW50YXRpb24sICdzdGFydCcsIGZpcnN0Tm9kZSkgOiAwO1xuICB9XG5cbiAgbmdEb0NoZWNrKCkge1xuICAgIGlmICh0aGlzLl9kaWZmZXIgJiYgdGhpcy5fbmVlZHNVcGRhdGUpIHtcbiAgICAgIC8vIFRPRE8obW1hbGVyYmEpOiBXZSBzaG91bGQgZGlmZmVyZW50aWF0ZSBuZWVkcyB1cGRhdGUgZHVlIHRvIHNjcm9sbGluZyBhbmQgYSBuZXcgcG9ydGlvbiBvZlxuICAgICAgLy8gdGhpcyBsaXN0IGJlaW5nIHJlbmRlcmVkIChjYW4gdXNlIHNpbXBsZXIgYWxnb3JpdGhtKSB2cyBuZWVkcyB1cGRhdGUgZHVlIHRvIGRhdGEgYWN0dWFsbHlcbiAgICAgIC8vIGNoYW5naW5nIChuZWVkIHRvIGRvIHRoaXMgZGlmZikuXG4gICAgICBjb25zdCBjaGFuZ2VzID0gdGhpcy5fZGlmZmVyLmRpZmYodGhpcy5fcmVuZGVyZWRJdGVtcyk7XG4gICAgICBpZiAoIWNoYW5nZXMpIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlQ29udGV4dCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fYXBwbHlDaGFuZ2VzKGNoYW5nZXMpO1xuICAgICAgfVxuICAgICAgdGhpcy5fbmVlZHNVcGRhdGUgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl92aWV3cG9ydC5kZXRhY2goKTtcblxuICAgIHRoaXMuX2RhdGFTb3VyY2VDaGFuZ2VzLm5leHQodW5kZWZpbmVkISk7XG4gICAgdGhpcy5fZGF0YVNvdXJjZUNoYW5nZXMuY29tcGxldGUoKTtcbiAgICB0aGlzLnZpZXdDaGFuZ2UuY29tcGxldGUoKTtcblxuICAgIHRoaXMuX2Rlc3Ryb3llZC5uZXh0KCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fdmlld1JlcGVhdGVyLmRldGFjaCgpO1xuICB9XG5cbiAgLyoqIFJlYWN0IHRvIHNjcm9sbCBzdGF0ZSBjaGFuZ2VzIGluIHRoZSB2aWV3cG9ydC4gKi9cbiAgcHJpdmF0ZSBfb25SZW5kZXJlZERhdGFDaGFuZ2UoKSB7XG4gICAgaWYgKCF0aGlzLl9yZW5kZXJlZFJhbmdlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX3JlbmRlcmVkSXRlbXMgPSB0aGlzLl9kYXRhLnNsaWNlKHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQsIHRoaXMuX3JlbmRlcmVkUmFuZ2UuZW5kKTtcbiAgICBpZiAoIXRoaXMuX2RpZmZlcikge1xuICAgICAgdGhpcy5fZGlmZmVyID0gdGhpcy5fZGlmZmVycy5maW5kKHRoaXMuX3JlbmRlcmVkSXRlbXMpLmNyZWF0ZSh0aGlzLmNka1ZpcnR1YWxGb3JUcmFja0J5KTtcbiAgICB9XG4gICAgdGhpcy5fbmVlZHNVcGRhdGUgPSB0cnVlO1xuICB9XG5cbiAgLyoqIFN3YXAgb3V0IG9uZSBgRGF0YVNvdXJjZWAgZm9yIGFub3RoZXIuICovXG4gIHByaXZhdGUgX2NoYW5nZURhdGFTb3VyY2Uob2xkRHM6IERhdGFTb3VyY2U8VD4gfCBudWxsLCBuZXdEczogRGF0YVNvdXJjZTxUPiB8IG51bGwpOlxuICAgICAgT2JzZXJ2YWJsZTxUW10gfCBSZWFkb25seUFycmF5PFQ+PiB7XG5cbiAgICBpZiAob2xkRHMpIHtcbiAgICAgIG9sZERzLmRpc2Nvbm5lY3QodGhpcyk7XG4gICAgfVxuXG4gICAgdGhpcy5fbmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgIHJldHVybiBuZXdEcyA/IG5ld0RzLmNvbm5lY3QodGhpcykgOiBvYnNlcnZhYmxlT2YoKTtcbiAgfVxuXG4gIC8qKiBVcGRhdGUgdGhlIGBDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0YCBmb3IgYWxsIHZpZXdzLiAqL1xuICBwcml2YXRlIF91cGRhdGVDb250ZXh0KCkge1xuICAgIGNvbnN0IGNvdW50ID0gdGhpcy5fZGF0YS5sZW5ndGg7XG4gICAgbGV0IGkgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICBsZXQgdmlldyA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuZ2V0KGkpIGFzIEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PjtcbiAgICAgIHZpZXcuY29udGV4dC5pbmRleCA9IHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQgKyBpO1xuICAgICAgdmlldy5jb250ZXh0LmNvdW50ID0gY291bnQ7XG4gICAgICB0aGlzLl91cGRhdGVDb21wdXRlZENvbnRleHRQcm9wZXJ0aWVzKHZpZXcuY29udGV4dCk7XG4gICAgICB2aWV3LmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gIH1cblxuICAvKiogQXBwbHkgY2hhbmdlcyB0byB0aGUgRE9NLiAqL1xuICBwcml2YXRlIF9hcHBseUNoYW5nZXMoY2hhbmdlczogSXRlcmFibGVDaGFuZ2VzPFQ+KSB7XG4gICAgdGhpcy5fdmlld1JlcGVhdGVyLmFwcGx5Q2hhbmdlcyhcbiAgICAgICAgY2hhbmdlcyxcbiAgICAgICAgdGhpcy5fdmlld0NvbnRhaW5lclJlZixcbiAgICAgICAgKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8VD4sXG4gICAgICAgICBhZGp1c3RlZFByZXZpb3VzSW5kZXg6IG51bWJlciB8IG51bGwsXG4gICAgICAgICBjdXJyZW50SW5kZXg6IG51bWJlciB8IG51bGwpID0+IHRoaXMuX2dldEVtYmVkZGVkVmlld0FyZ3MocmVjb3JkLCBjdXJyZW50SW5kZXghKSxcbiAgICAgICAgKHJlY29yZCkgPT4gcmVjb3JkLml0ZW0pO1xuXG4gICAgLy8gVXBkYXRlICRpbXBsaWNpdCBmb3IgYW55IGl0ZW1zIHRoYXQgaGFkIGFuIGlkZW50aXR5IGNoYW5nZS5cbiAgICBjaGFuZ2VzLmZvckVhY2hJZGVudGl0eUNoYW5nZSgocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZDxUPikgPT4ge1xuICAgICAgY29uc3QgdmlldyA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuZ2V0KHJlY29yZC5jdXJyZW50SW5kZXghKSBhc1xuICAgICAgICAgIEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PjtcbiAgICAgIHZpZXcuY29udGV4dC4kaW1wbGljaXQgPSByZWNvcmQuaXRlbTtcbiAgICB9KTtcblxuICAgIC8vIFVwZGF0ZSB0aGUgY29udGV4dCB2YXJpYWJsZXMgb24gYWxsIGl0ZW1zLlxuICAgIGNvbnN0IGNvdW50ID0gdGhpcy5fZGF0YS5sZW5ndGg7XG4gICAgbGV0IGkgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICBjb25zdCB2aWV3ID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5nZXQoaSkgYXMgRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+O1xuICAgICAgdmlldy5jb250ZXh0LmluZGV4ID0gdGhpcy5fcmVuZGVyZWRSYW5nZS5zdGFydCArIGk7XG4gICAgICB2aWV3LmNvbnRleHQuY291bnQgPSBjb3VudDtcbiAgICAgIHRoaXMuX3VwZGF0ZUNvbXB1dGVkQ29udGV4dFByb3BlcnRpZXModmlldy5jb250ZXh0KTtcbiAgICB9XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSBjb21wdXRlZCBwcm9wZXJ0aWVzIG9uIHRoZSBgQ2RrVmlydHVhbEZvck9mQ29udGV4dGAuICovXG4gIHByaXZhdGUgX3VwZGF0ZUNvbXB1dGVkQ29udGV4dFByb3BlcnRpZXMoY29udGV4dDogQ2RrVmlydHVhbEZvck9mQ29udGV4dDxhbnk+KSB7XG4gICAgY29udGV4dC5maXJzdCA9IGNvbnRleHQuaW5kZXggPT09IDA7XG4gICAgY29udGV4dC5sYXN0ID0gY29udGV4dC5pbmRleCA9PT0gY29udGV4dC5jb3VudCAtIDE7XG4gICAgY29udGV4dC5ldmVuID0gY29udGV4dC5pbmRleCAlIDIgPT09IDA7XG4gICAgY29udGV4dC5vZGQgPSAhY29udGV4dC5ldmVuO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0RW1iZWRkZWRWaWV3QXJncyhyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFQ+LCBpbmRleDogbnVtYmVyKTpcbiAgICAgIF9WaWV3UmVwZWF0ZXJJdGVtSW5zZXJ0QXJnczxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PiB7XG4gICAgLy8gTm90ZSB0aGF0IGl0J3MgaW1wb3J0YW50IHRoYXQgd2UgaW5zZXJ0IHRoZSBpdGVtIGRpcmVjdGx5IGF0IHRoZSBwcm9wZXIgaW5kZXgsXG4gICAgLy8gcmF0aGVyIHRoYW4gaW5zZXJ0aW5nIGl0IGFuZCB0aGUgbW92aW5nIGl0IGluIHBsYWNlLCBiZWNhdXNlIGlmIHRoZXJlJ3MgYSBkaXJlY3RpdmVcbiAgICAvLyBvbiB0aGUgc2FtZSBub2RlIHRoYXQgaW5qZWN0cyB0aGUgYFZpZXdDb250YWluZXJSZWZgLCBBbmd1bGFyIHdpbGwgaW5zZXJ0IGFub3RoZXJcbiAgICAvLyBjb21tZW50IG5vZGUgd2hpY2ggY2FuIHRocm93IG9mZiB0aGUgbW92ZSB3aGVuIGl0J3MgYmVpbmcgcmVwZWF0ZWQgZm9yIGFsbCBpdGVtcy5cbiAgICByZXR1cm4ge1xuICAgICAgdGVtcGxhdGVSZWY6IHRoaXMuX3RlbXBsYXRlLFxuICAgICAgY29udGV4dDoge1xuICAgICAgICAkaW1wbGljaXQ6IHJlY29yZC5pdGVtLFxuICAgICAgICAvLyBJdCdzIGd1YXJhbnRlZWQgdGhhdCB0aGUgaXRlcmFibGUgaXMgbm90IFwidW5kZWZpbmVkXCIgb3IgXCJudWxsXCIgYmVjYXVzZSB3ZSBvbmx5XG4gICAgICAgIC8vIGdlbmVyYXRlIHZpZXdzIGZvciBlbGVtZW50cyBpZiB0aGUgXCJjZGtWaXJ0dWFsRm9yT2ZcIiBpdGVyYWJsZSBoYXMgZWxlbWVudHMuXG4gICAgICAgIGNka1ZpcnR1YWxGb3JPZjogdGhpcy5fY2RrVmlydHVhbEZvck9mISxcbiAgICAgICAgaW5kZXg6IC0xLFxuICAgICAgICBjb3VudDogLTEsXG4gICAgICAgIGZpcnN0OiBmYWxzZSxcbiAgICAgICAgbGFzdDogZmFsc2UsXG4gICAgICAgIG9kZDogZmFsc2UsXG4gICAgICAgIGV2ZW46IGZhbHNlXG4gICAgICB9LFxuICAgICAgaW5kZXgsXG4gICAgfTtcbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9jZGtWaXJ0dWFsRm9yVGVtcGxhdGVDYWNoZVNpemU6IE51bWJlcklucHV0O1xufVxuIl19