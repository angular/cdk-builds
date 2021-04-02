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
            // If value is an an NgIterable, convert it to an array.
            this._dataSourceChanges.next(new ArrayDataSource(isObservable(value) ? value : Array.from(value || [])));
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
        if ((range.start < this._renderedRange.start || range.end > this._renderedRange.end) &&
            (typeof ngDevMode === 'undefined' || ngDevMode)) {
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
            // Use a wrapper function for the `trackBy` so any new values are
            // picked up automatically without having to recreate the differ.
            this._differ = this._differs.find(this._renderedItems).create((index, item) => {
                return this.cdkVirtualForTrackBy ? this.cdkVirtualForTrackBy(index, item) : item;
            });
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
            const view = this._viewContainerRef.get(i);
            view.context.index = this._renderedRange.start + i;
            view.context.count = count;
            this._updateComputedContextProperties(view.context);
            view.detectChanges();
        }
    }
    /** Apply changes to the DOM. */
    _applyChanges(changes) {
        this._viewRepeater.applyChanges(changes, this._viewContainerRef, (record, _adjustedPreviousIndex, currentIndex) => this._getEmbeddedViewArgs(record, currentIndex), (record) => record.item);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1mb3Itb2YuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy92aXJ0dWFsLWZvci1vZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsZUFBZSxFQUlmLFlBQVksRUFDWiw0QkFBNEIsRUFDNUIsdUJBQXVCLEdBRXhCLE1BQU0sMEJBQTBCLENBQUM7QUFDbEMsT0FBTyxFQUNMLFNBQVMsRUFHVCxNQUFNLEVBQ04sS0FBSyxFQUlMLGVBQWUsRUFFZixNQUFNLEVBRU4sUUFBUSxFQUNSLFdBQVcsRUFFWCxnQkFBZ0IsR0FDakIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLG9CQUFvQixFQUFjLE1BQU0sdUJBQXVCLENBQUM7QUFDeEUsT0FBTyxFQUFhLE9BQU8sRUFBRSxFQUFFLElBQUksWUFBWSxFQUFFLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUMzRSxPQUFPLEVBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXRGLE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBd0JuRSx5RUFBeUU7QUFDekUsU0FBUyxTQUFTLENBQUMsV0FBc0MsRUFBRSxTQUEwQixFQUFFLElBQVU7SUFDL0YsTUFBTSxFQUFFLEdBQUcsSUFBZSxDQUFDO0lBQzNCLElBQUksQ0FBQyxFQUFFLENBQUMscUJBQXFCLEVBQUU7UUFDN0IsT0FBTyxDQUFDLENBQUM7S0FDVjtJQUNELE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO0lBRXhDLElBQUksV0FBVyxLQUFLLFlBQVksRUFBRTtRQUNoQyxPQUFPLFNBQVMsS0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxD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QzNCLE9BQU8sRUFBRTtnQkFDUCxTQUFTLEVBQUUsTUFBTSxDQUFDLElBQUk7Z0JBQ3RCLGlGQUFpRjtnQkFDakYsOEVBQThFO2dCQUM5RSxlQUFlLEVBQUUsSUFBSSxDQUFDLGdCQUFpQjtnQkFDdkMsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFDVCxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUNULEtBQUssRUFBRSxLQUFLO2dCQUNaLElBQUksRUFBRSxLQUFLO2dCQUNYLEdBQUcsRUFBRSxLQUFLO2dCQUNWLElBQUksRUFBRSxLQUFLO2FBQ1o7WUFDRCxLQUFLO1NBQ04sQ0FBQztJQUNKLENBQUM7OztZQTNTRixTQUFTLFNBQUM7Z0JBQ1QsUUFBUSxFQUFFLGtDQUFrQztnQkFDNUMsU0FBUyxFQUFFO29CQUNULEVBQUMsT0FBTyxFQUFFLHVCQUF1QixFQUFFLFFBQVEsRUFBRSw0QkFBNEIsRUFBQztpQkFDM0U7YUFDRjs7O1lBdERDLGdCQUFnQjtZQUZoQixXQUFXO1lBTFgsZUFBZTtZQWJmLDRCQUE0Qix1QkFpTHZCLE1BQU0sU0FBQyx1QkFBdUI7WUF2SjdCLHdCQUF3Qix1QkEwSnpCLFFBQVE7WUFyS2IsTUFBTTs7OzhCQXFFTCxLQUFLO21DQXFCTCxLQUFLO29DQWFMLEtBQUs7NkNBWUwsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBBcnJheURhdGFTb3VyY2UsXG4gIENvbGxlY3Rpb25WaWV3ZXIsXG4gIERhdGFTb3VyY2UsXG4gIExpc3RSYW5nZSxcbiAgaXNEYXRhU291cmNlLFxuICBfUmVjeWNsZVZpZXdSZXBlYXRlclN0cmF0ZWd5LFxuICBfVklFV19SRVBFQVRFUl9TVFJBVEVHWSxcbiAgX1ZpZXdSZXBlYXRlckl0ZW1JbnNlcnRBcmdzLFxufSBmcm9tICdAYW5ndWxhci9jZGsvY29sbGVjdGlvbnMnO1xuaW1wb3J0IHtcbiAgRGlyZWN0aXZlLFxuICBEb0NoZWNrLFxuICBFbWJlZGRlZFZpZXdSZWYsXG4gIEluamVjdCxcbiAgSW5wdXQsXG4gIEl0ZXJhYmxlQ2hhbmdlUmVjb3JkLFxuICBJdGVyYWJsZUNoYW5nZXMsXG4gIEl0ZXJhYmxlRGlmZmVyLFxuICBJdGVyYWJsZURpZmZlcnMsXG4gIE5nSXRlcmFibGUsXG4gIE5nWm9uZSxcbiAgT25EZXN0cm95LFxuICBTa2lwU2VsZixcbiAgVGVtcGxhdGVSZWYsXG4gIFRyYWNrQnlGdW5jdGlvbixcbiAgVmlld0NvbnRhaW5lclJlZixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge2NvZXJjZU51bWJlclByb3BlcnR5LCBOdW1iZXJJbnB1dH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdCwgb2YgYXMgb2JzZXJ2YWJsZU9mLCBpc09ic2VydmFibGV9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtwYWlyd2lzZSwgc2hhcmVSZXBsYXksIHN0YXJ0V2l0aCwgc3dpdGNoTWFwLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7Q2RrVmlydHVhbFNjcm9sbFJlcGVhdGVyfSBmcm9tICcuL3ZpcnR1YWwtc2Nyb2xsLXJlcGVhdGVyJztcbmltcG9ydCB7Q2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0fSBmcm9tICcuL3ZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0JztcblxuXG4vKiogVGhlIGNvbnRleHQgZm9yIGFuIGl0ZW0gcmVuZGVyZWQgYnkgYENka1ZpcnR1YWxGb3JPZmAgKi9cbmV4cG9ydCB0eXBlIENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4gPSB7XG4gIC8qKiBUaGUgaXRlbSB2YWx1ZS4gKi9cbiAgJGltcGxpY2l0OiBUO1xuICAvKiogVGhlIERhdGFTb3VyY2UsIE9ic2VydmFibGUsIG9yIE5nSXRlcmFibGUgdGhhdCB3YXMgcGFzc2VkIHRvICpjZGtWaXJ0dWFsRm9yLiAqL1xuICBjZGtWaXJ0dWFsRm9yT2Y6IERhdGFTb3VyY2U8VD4gfCBPYnNlcnZhYmxlPFRbXT4gfCBOZ0l0ZXJhYmxlPFQ+O1xuICAvKiogVGhlIGluZGV4IG9mIHRoZSBpdGVtIGluIHRoZSBEYXRhU291cmNlLiAqL1xuICBpbmRleDogbnVtYmVyO1xuICAvKiogVGhlIG51bWJlciBvZiBpdGVtcyBpbiB0aGUgRGF0YVNvdXJjZS4gKi9cbiAgY291bnQ6IG51bWJlcjtcbiAgLyoqIFdoZXRoZXIgdGhpcyBpcyB0aGUgZmlyc3QgaXRlbSBpbiB0aGUgRGF0YVNvdXJjZS4gKi9cbiAgZmlyc3Q6IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIHRoaXMgaXMgdGhlIGxhc3QgaXRlbSBpbiB0aGUgRGF0YVNvdXJjZS4gKi9cbiAgbGFzdDogYm9vbGVhbjtcbiAgLyoqIFdoZXRoZXIgdGhlIGluZGV4IGlzIGV2ZW4uICovXG4gIGV2ZW46IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIHRoZSBpbmRleCBpcyBvZGQuICovXG4gIG9kZDogYm9vbGVhbjtcbn07XG5cblxuLyoqIEhlbHBlciB0byBleHRyYWN0IHRoZSBvZmZzZXQgb2YgYSBET00gTm9kZSBpbiBhIGNlcnRhaW4gZGlyZWN0aW9uLiAqL1xuZnVuY3Rpb24gZ2V0T2Zmc2V0KG9yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcgfCAndmVydGljYWwnLCBkaXJlY3Rpb246ICdzdGFydCcgfCAnZW5kJywgbm9kZTogTm9kZSkge1xuICBjb25zdCBlbCA9IG5vZGUgYXMgRWxlbWVudDtcbiAgaWYgKCFlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuICBjb25zdCByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgaWYgKG9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcpIHtcbiAgICByZXR1cm4gZGlyZWN0aW9uID09PSAnc3RhcnQnID8gcmVjdC5sZWZ0IDogcmVjdC5yaWdodDtcbiAgfVxuXG4gIHJldHVybiBkaXJlY3Rpb24gPT09ICdzdGFydCcgPyByZWN0LnRvcCA6IHJlY3QuYm90dG9tO1xufVxuXG4vKipcbiAqIEEgZGlyZWN0aXZlIHNpbWlsYXIgdG8gYG5nRm9yT2ZgIHRvIGJlIHVzZWQgZm9yIHJlbmRlcmluZyBkYXRhIGluc2lkZSBhIHZpcnR1YWwgc2Nyb2xsaW5nXG4gKiBjb250YWluZXIuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtWaXJ0dWFsRm9yXVtjZGtWaXJ0dWFsRm9yT2ZdJyxcbiAgcHJvdmlkZXJzOiBbXG4gICAge3Byb3ZpZGU6IF9WSUVXX1JFUEVBVEVSX1NUUkFURUdZLCB1c2VDbGFzczogX1JlY3ljbGVWaWV3UmVwZWF0ZXJTdHJhdGVneX0sXG4gIF1cbn0pXG5leHBvcnQgY2xhc3MgQ2RrVmlydHVhbEZvck9mPFQ+IGltcGxlbWVudHNcbiAgICBDZGtWaXJ0dWFsU2Nyb2xsUmVwZWF0ZXI8VD4sIENvbGxlY3Rpb25WaWV3ZXIsIERvQ2hlY2ssIE9uRGVzdHJveSB7XG4gIC8qKiBFbWl0cyB3aGVuIHRoZSByZW5kZXJlZCB2aWV3IG9mIHRoZSBkYXRhIGNoYW5nZXMuICovXG4gIHZpZXdDaGFuZ2UgPSBuZXcgU3ViamVjdDxMaXN0UmFuZ2U+KCk7XG5cbiAgLyoqIFN1YmplY3QgdGhhdCBlbWl0cyB3aGVuIGEgbmV3IERhdGFTb3VyY2UgaW5zdGFuY2UgaXMgZ2l2ZW4uICovXG4gIHByaXZhdGUgX2RhdGFTb3VyY2VDaGFuZ2VzID0gbmV3IFN1YmplY3Q8RGF0YVNvdXJjZTxUPj4oKTtcblxuICAvKiogVGhlIERhdGFTb3VyY2UgdG8gZGlzcGxheS4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGNka1ZpcnR1YWxGb3JPZigpOiBEYXRhU291cmNlPFQ+IHwgT2JzZXJ2YWJsZTxUW10+IHwgTmdJdGVyYWJsZTxUPiB8IG51bGwgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9jZGtWaXJ0dWFsRm9yT2Y7XG4gIH1cbiAgc2V0IGNka1ZpcnR1YWxGb3JPZih2YWx1ZTogRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8VFtdPiB8IE5nSXRlcmFibGU8VD4gfCBudWxsIHwgdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5fY2RrVmlydHVhbEZvck9mID0gdmFsdWU7XG4gICAgaWYgKGlzRGF0YVNvdXJjZSh2YWx1ZSkpIHtcbiAgICAgIHRoaXMuX2RhdGFTb3VyY2VDaGFuZ2VzLm5leHQodmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB2YWx1ZSBpcyBhbiBhbiBOZ0l0ZXJhYmxlLCBjb252ZXJ0IGl0IHRvIGFuIGFycmF5LlxuICAgICAgdGhpcy5fZGF0YVNvdXJjZUNoYW5nZXMubmV4dChuZXcgQXJyYXlEYXRhU291cmNlPFQ+KFxuICAgICAgICAgIGlzT2JzZXJ2YWJsZSh2YWx1ZSkgPyB2YWx1ZSA6IEFycmF5LmZyb20odmFsdWUgfHwgW10pKSk7XG4gICAgfVxuICB9XG5cbiAgX2Nka1ZpcnR1YWxGb3JPZjogRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8VFtdPiB8IE5nSXRlcmFibGU8VD4gfCBudWxsIHwgdW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBUaGUgYFRyYWNrQnlGdW5jdGlvbmAgdG8gdXNlIGZvciB0cmFja2luZyBjaGFuZ2VzLiBUaGUgYFRyYWNrQnlGdW5jdGlvbmAgdGFrZXMgdGhlIGluZGV4IGFuZFxuICAgKiB0aGUgaXRlbSBhbmQgcHJvZHVjZXMgYSB2YWx1ZSB0byBiZSB1c2VkIGFzIHRoZSBpdGVtJ3MgaWRlbnRpdHkgd2hlbiB0cmFja2luZyBjaGFuZ2VzLlxuICAgKi9cbiAgQElucHV0KClcbiAgZ2V0IGNka1ZpcnR1YWxGb3JUcmFja0J5KCk6IFRyYWNrQnlGdW5jdGlvbjxUPiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX2Nka1ZpcnR1YWxGb3JUcmFja0J5O1xuICB9XG4gIHNldCBjZGtWaXJ0dWFsRm9yVHJhY2tCeShmbjogVHJhY2tCeUZ1bmN0aW9uPFQ+IHwgdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5fbmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgIHRoaXMuX2Nka1ZpcnR1YWxGb3JUcmFja0J5ID0gZm4gP1xuICAgICAgICAoaW5kZXgsIGl0ZW0pID0+IGZuKGluZGV4ICsgKHRoaXMuX3JlbmRlcmVkUmFuZ2UgPyB0aGlzLl9yZW5kZXJlZFJhbmdlLnN0YXJ0IDogMCksIGl0ZW0pIDpcbiAgICAgICAgdW5kZWZpbmVkO1xuICB9XG4gIHByaXZhdGUgX2Nka1ZpcnR1YWxGb3JUcmFja0J5OiBUcmFja0J5RnVuY3Rpb248VD4gfCB1bmRlZmluZWQ7XG5cbiAgLyoqIFRoZSB0ZW1wbGF0ZSB1c2VkIHRvIHN0YW1wIG91dCBuZXcgZWxlbWVudHMuICovXG4gIEBJbnB1dCgpXG4gIHNldCBjZGtWaXJ0dWFsRm9yVGVtcGxhdGUodmFsdWU6IFRlbXBsYXRlUmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+KSB7XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICB0aGlzLl9uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgICB0aGlzLl90ZW1wbGF0ZSA9IHZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgc2l6ZSBvZiB0aGUgY2FjaGUgdXNlZCB0byBzdG9yZSB0ZW1wbGF0ZXMgdGhhdCBhcmUgbm90IGJlaW5nIHVzZWQgZm9yIHJlLXVzZSBsYXRlci5cbiAgICogU2V0dGluZyB0aGUgY2FjaGUgc2l6ZSB0byBgMGAgd2lsbCBkaXNhYmxlIGNhY2hpbmcuIERlZmF1bHRzIHRvIDIwIHRlbXBsYXRlcy5cbiAgICovXG4gIEBJbnB1dCgpXG4gIGdldCBjZGtWaXJ0dWFsRm9yVGVtcGxhdGVDYWNoZVNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZpZXdSZXBlYXRlci52aWV3Q2FjaGVTaXplO1xuICB9XG4gIHNldCBjZGtWaXJ0dWFsRm9yVGVtcGxhdGVDYWNoZVNpemUoc2l6ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5fdmlld1JlcGVhdGVyLnZpZXdDYWNoZVNpemUgPSBjb2VyY2VOdW1iZXJQcm9wZXJ0eShzaXplKTtcbiAgfVxuXG4gIC8qKiBFbWl0cyB3aGVuZXZlciB0aGUgZGF0YSBpbiB0aGUgY3VycmVudCBEYXRhU291cmNlIGNoYW5nZXMuICovXG4gIGRhdGFTdHJlYW06IE9ic2VydmFibGU8cmVhZG9ubHkgVFtdPiA9IHRoaXMuX2RhdGFTb3VyY2VDaGFuZ2VzXG4gIC5waXBlKFxuICAgICAgLy8gU3RhcnQgb2ZmIHdpdGggbnVsbCBgRGF0YVNvdXJjZWAuXG4gICAgICBzdGFydFdpdGgobnVsbCksXG4gICAgICAvLyBCdW5kbGUgdXAgdGhlIHByZXZpb3VzIGFuZCBjdXJyZW50IGRhdGEgc291cmNlcyBzbyB3ZSBjYW4gd29yayB3aXRoIGJvdGguXG4gICAgICBwYWlyd2lzZSgpLFxuICAgICAgLy8gVXNlIGBfY2hhbmdlRGF0YVNvdXJjZWAgdG8gZGlzY29ubmVjdCBmcm9tIHRoZSBwcmV2aW91cyBkYXRhIHNvdXJjZSBhbmQgY29ubmVjdCB0byB0aGVcbiAgICAgIC8vIG5ldyBvbmUsIHBhc3NpbmcgYmFjayBhIHN0cmVhbSBvZiBkYXRhIGNoYW5nZXMgd2hpY2ggd2UgcnVuIHRocm91Z2ggYHN3aXRjaE1hcGAgdG8gZ2l2ZVxuICAgICAgLy8gdXMgYSBkYXRhIHN0cmVhbSB0aGF0IGVtaXRzIHRoZSBsYXRlc3QgZGF0YSBmcm9tIHdoYXRldmVyIHRoZSBjdXJyZW50IGBEYXRhU291cmNlYCBpcy5cbiAgICAgIHN3aXRjaE1hcCgoW3ByZXYsIGN1cl0pID0+IHRoaXMuX2NoYW5nZURhdGFTb3VyY2UocHJldiwgY3VyKSksXG4gICAgICAvLyBSZXBsYXkgdGhlIGxhc3QgZW1pdHRlZCBkYXRhIHdoZW4gc29tZW9uZSBzdWJzY3JpYmVzLlxuICAgICAgc2hhcmVSZXBsYXkoMSkpO1xuXG4gIC8qKiBUaGUgZGlmZmVyIHVzZWQgdG8gY2FsY3VsYXRlIGNoYW5nZXMgdG8gdGhlIGRhdGEuICovXG4gIHByaXZhdGUgX2RpZmZlcjogSXRlcmFibGVEaWZmZXI8VD4gfCBudWxsID0gbnVsbDtcblxuICAvKiogVGhlIG1vc3QgcmVjZW50IGRhdGEgZW1pdHRlZCBmcm9tIHRoZSBEYXRhU291cmNlLiAqL1xuICBwcml2YXRlIF9kYXRhOiByZWFkb25seSBUW107XG5cbiAgLyoqIFRoZSBjdXJyZW50bHkgcmVuZGVyZWQgaXRlbXMuICovXG4gIHByaXZhdGUgX3JlbmRlcmVkSXRlbXM6IFRbXTtcblxuICAvKiogVGhlIGN1cnJlbnRseSByZW5kZXJlZCByYW5nZSBvZiBpbmRpY2VzLiAqL1xuICBwcml2YXRlIF9yZW5kZXJlZFJhbmdlOiBMaXN0UmFuZ2U7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHJlbmRlcmVkIGRhdGEgc2hvdWxkIGJlIHVwZGF0ZWQgZHVyaW5nIHRoZSBuZXh0IG5nRG9DaGVjayBjeWNsZS4gKi9cbiAgcHJpdmF0ZSBfbmVlZHNVcGRhdGUgPSBmYWxzZTtcblxuICBwcml2YXRlIF9kZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgLyoqIFRoZSB2aWV3IGNvbnRhaW5lciB0byBhZGQgaXRlbXMgdG8uICovXG4gICAgICBwcml2YXRlIF92aWV3Q29udGFpbmVyUmVmOiBWaWV3Q29udGFpbmVyUmVmLFxuICAgICAgLyoqIFRoZSB0ZW1wbGF0ZSB0byB1c2Ugd2hlbiBzdGFtcGluZyBvdXQgbmV3IGl0ZW1zLiAqL1xuICAgICAgcHJpdmF0ZSBfdGVtcGxhdGU6IFRlbXBsYXRlUmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+LFxuICAgICAgLyoqIFRoZSBzZXQgb2YgYXZhaWxhYmxlIGRpZmZlcnMuICovXG4gICAgICBwcml2YXRlIF9kaWZmZXJzOiBJdGVyYWJsZURpZmZlcnMsXG4gICAgICAvKiogVGhlIHN0cmF0ZWd5IHVzZWQgdG8gcmVuZGVyIGl0ZW1zIGluIHRoZSB2aXJ0dWFsIHNjcm9sbCB2aWV3cG9ydC4gKi9cbiAgICAgIEBJbmplY3QoX1ZJRVdfUkVQRUFURVJfU1RSQVRFR1kpXG4gICAgICBwcml2YXRlIF92aWV3UmVwZWF0ZXI6IF9SZWN5Y2xlVmlld1JlcGVhdGVyU3RyYXRlZ3k8VCwgVCwgQ2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj4sXG4gICAgICAvKiogVGhlIHZpcnR1YWwgc2Nyb2xsaW5nIHZpZXdwb3J0IHRoYXQgdGhlc2UgaXRlbXMgYXJlIGJlaW5nIHJlbmRlcmVkIGluLiAqL1xuICAgICAgQFNraXBTZWxmKCkgcHJpdmF0ZSBfdmlld3BvcnQ6IENka1ZpcnR1YWxTY3JvbGxWaWV3cG9ydCxcbiAgICAgIG5nWm9uZTogTmdab25lKSB7XG4gICAgdGhpcy5kYXRhU3RyZWFtLnN1YnNjcmliZShkYXRhID0+IHtcbiAgICAgIHRoaXMuX2RhdGEgPSBkYXRhO1xuICAgICAgdGhpcy5fb25SZW5kZXJlZERhdGFDaGFuZ2UoKTtcbiAgICB9KTtcbiAgICB0aGlzLl92aWV3cG9ydC5yZW5kZXJlZFJhbmdlU3RyZWFtLnBpcGUodGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpLnN1YnNjcmliZShyYW5nZSA9PiB7XG4gICAgICB0aGlzLl9yZW5kZXJlZFJhbmdlID0gcmFuZ2U7XG4gICAgICBuZ1pvbmUucnVuKCgpID0+IHRoaXMudmlld0NoYW5nZS5uZXh0KHRoaXMuX3JlbmRlcmVkUmFuZ2UpKTtcbiAgICAgIHRoaXMuX29uUmVuZGVyZWREYXRhQ2hhbmdlKCk7XG4gICAgfSk7XG4gICAgdGhpcy5fdmlld3BvcnQuYXR0YWNoKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIE1lYXN1cmVzIHRoZSBjb21iaW5lZCBzaXplICh3aWR0aCBmb3IgaG9yaXpvbnRhbCBvcmllbnRhdGlvbiwgaGVpZ2h0IGZvciB2ZXJ0aWNhbCkgb2YgYWxsIGl0ZW1zXG4gICAqIGluIHRoZSBzcGVjaWZpZWQgcmFuZ2UuIFRocm93cyBhbiBlcnJvciBpZiB0aGUgcmFuZ2UgaW5jbHVkZXMgaXRlbXMgdGhhdCBhcmUgbm90IGN1cnJlbnRseVxuICAgKiByZW5kZXJlZC5cbiAgICovXG4gIG1lYXN1cmVSYW5nZVNpemUocmFuZ2U6IExpc3RSYW5nZSwgb3JpZW50YXRpb246ICdob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCcpOiBudW1iZXIge1xuICAgIGlmIChyYW5nZS5zdGFydCA+PSByYW5nZS5lbmQpIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBpZiAoKHJhbmdlLnN0YXJ0IDwgdGhpcy5fcmVuZGVyZWRSYW5nZS5zdGFydCB8fCByYW5nZS5lbmQgPiB0aGlzLl9yZW5kZXJlZFJhbmdlLmVuZCkgJiZcbiAgICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpKSB7XG4gICAgICB0aHJvdyBFcnJvcihgRXJyb3I6IGF0dGVtcHRlZCB0byBtZWFzdXJlIGFuIGl0ZW0gdGhhdCBpc24ndCByZW5kZXJlZC5gKTtcbiAgICB9XG5cbiAgICAvLyBUaGUgaW5kZXggaW50byB0aGUgbGlzdCBvZiByZW5kZXJlZCB2aWV3cyBmb3IgdGhlIGZpcnN0IGl0ZW0gaW4gdGhlIHJhbmdlLlxuICAgIGNvbnN0IHJlbmRlcmVkU3RhcnRJbmRleCA9IHJhbmdlLnN0YXJ0IC0gdGhpcy5fcmVuZGVyZWRSYW5nZS5zdGFydDtcbiAgICAvLyBUaGUgbGVuZ3RoIG9mIHRoZSByYW5nZSB3ZSdyZSBtZWFzdXJpbmcuXG4gICAgY29uc3QgcmFuZ2VMZW4gPSByYW5nZS5lbmQgLSByYW5nZS5zdGFydDtcblxuICAgIC8vIExvb3Agb3ZlciBhbGwgdGhlIHZpZXdzLCBmaW5kIHRoZSBmaXJzdCBhbmQgbGFuZCBub2RlIGFuZCBjb21wdXRlIHRoZSBzaXplIGJ5IHN1YnRyYWN0aW5nXG4gICAgLy8gdGhlIHRvcCBvZiB0aGUgZmlyc3Qgbm9kZSBmcm9tIHRoZSBib3R0b20gb2YgdGhlIGxhc3Qgb25lLlxuICAgIGxldCBmaXJzdE5vZGU6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkO1xuICAgIGxldCBsYXN0Tm9kZTogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQ7XG5cbiAgICAvLyBGaW5kIHRoZSBmaXJzdCBub2RlIGJ5IHN0YXJ0aW5nIGZyb20gdGhlIGJlZ2lubmluZyBhbmQgZ29pbmcgZm9yd2FyZHMuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByYW5nZUxlbjsgaSsrKSB7XG4gICAgICBjb25zdCB2aWV3ID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5nZXQoaSArIHJlbmRlcmVkU3RhcnRJbmRleCkgYXNcbiAgICAgICAgICBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj4gfCBudWxsO1xuICAgICAgaWYgKHZpZXcgJiYgdmlldy5yb290Tm9kZXMubGVuZ3RoKSB7XG4gICAgICAgIGZpcnN0Tm9kZSA9IGxhc3ROb2RlID0gdmlldy5yb290Tm9kZXNbMF07XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZpbmQgdGhlIGxhc3Qgbm9kZSBieSBzdGFydGluZyBmcm9tIHRoZSBlbmQgYW5kIGdvaW5nIGJhY2t3YXJkcy5cbiAgICBmb3IgKGxldCBpID0gcmFuZ2VMZW4gLSAxOyBpID4gLTE7IGktLSkge1xuICAgICAgY29uc3QgdmlldyA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuZ2V0KGkgKyByZW5kZXJlZFN0YXJ0SW5kZXgpIGFzXG4gICAgICAgICAgRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+IHwgbnVsbDtcbiAgICAgIGlmICh2aWV3ICYmIHZpZXcucm9vdE5vZGVzLmxlbmd0aCkge1xuICAgICAgICBsYXN0Tm9kZSA9IHZpZXcucm9vdE5vZGVzW3ZpZXcucm9vdE5vZGVzLmxlbmd0aCAtIDFdO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmlyc3ROb2RlICYmIGxhc3ROb2RlID9cbiAgICAgICAgZ2V0T2Zmc2V0KG9yaWVudGF0aW9uLCAnZW5kJywgbGFzdE5vZGUpIC0gZ2V0T2Zmc2V0KG9yaWVudGF0aW9uLCAnc3RhcnQnLCBmaXJzdE5vZGUpIDogMDtcbiAgfVxuXG4gIG5nRG9DaGVjaygpIHtcbiAgICBpZiAodGhpcy5fZGlmZmVyICYmIHRoaXMuX25lZWRzVXBkYXRlKSB7XG4gICAgICAvLyBUT0RPKG1tYWxlcmJhKTogV2Ugc2hvdWxkIGRpZmZlcmVudGlhdGUgbmVlZHMgdXBkYXRlIGR1ZSB0byBzY3JvbGxpbmcgYW5kIGEgbmV3IHBvcnRpb24gb2ZcbiAgICAgIC8vIHRoaXMgbGlzdCBiZWluZyByZW5kZXJlZCAoY2FuIHVzZSBzaW1wbGVyIGFsZ29yaXRobSkgdnMgbmVlZHMgdXBkYXRlIGR1ZSB0byBkYXRhIGFjdHVhbGx5XG4gICAgICAvLyBjaGFuZ2luZyAobmVlZCB0byBkbyB0aGlzIGRpZmYpLlxuICAgICAgY29uc3QgY2hhbmdlcyA9IHRoaXMuX2RpZmZlci5kaWZmKHRoaXMuX3JlbmRlcmVkSXRlbXMpO1xuICAgICAgaWYgKCFjaGFuZ2VzKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUNvbnRleHQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2FwcGx5Q2hhbmdlcyhjaGFuZ2VzKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX25lZWRzVXBkYXRlID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fdmlld3BvcnQuZGV0YWNoKCk7XG5cbiAgICB0aGlzLl9kYXRhU291cmNlQ2hhbmdlcy5uZXh0KHVuZGVmaW5lZCEpO1xuICAgIHRoaXMuX2RhdGFTb3VyY2VDaGFuZ2VzLmNvbXBsZXRlKCk7XG4gICAgdGhpcy52aWV3Q2hhbmdlLmNvbXBsZXRlKCk7XG5cbiAgICB0aGlzLl9kZXN0cm95ZWQubmV4dCgpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX3ZpZXdSZXBlYXRlci5kZXRhY2goKTtcbiAgfVxuXG4gIC8qKiBSZWFjdCB0byBzY3JvbGwgc3RhdGUgY2hhbmdlcyBpbiB0aGUgdmlld3BvcnQuICovXG4gIHByaXZhdGUgX29uUmVuZGVyZWREYXRhQ2hhbmdlKCkge1xuICAgIGlmICghdGhpcy5fcmVuZGVyZWRSYW5nZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9yZW5kZXJlZEl0ZW1zID0gdGhpcy5fZGF0YS5zbGljZSh0aGlzLl9yZW5kZXJlZFJhbmdlLnN0YXJ0LCB0aGlzLl9yZW5kZXJlZFJhbmdlLmVuZCk7XG4gICAgaWYgKCF0aGlzLl9kaWZmZXIpIHtcbiAgICAgIC8vIFVzZSBhIHdyYXBwZXIgZnVuY3Rpb24gZm9yIHRoZSBgdHJhY2tCeWAgc28gYW55IG5ldyB2YWx1ZXMgYXJlXG4gICAgICAvLyBwaWNrZWQgdXAgYXV0b21hdGljYWxseSB3aXRob3V0IGhhdmluZyB0byByZWNyZWF0ZSB0aGUgZGlmZmVyLlxuICAgICAgdGhpcy5fZGlmZmVyID0gdGhpcy5fZGlmZmVycy5maW5kKHRoaXMuX3JlbmRlcmVkSXRlbXMpLmNyZWF0ZSgoaW5kZXgsIGl0ZW0pID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2RrVmlydHVhbEZvclRyYWNrQnkgPyB0aGlzLmNka1ZpcnR1YWxGb3JUcmFja0J5KGluZGV4LCBpdGVtKSA6IGl0ZW07XG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy5fbmVlZHNVcGRhdGUgPSB0cnVlO1xuICB9XG5cbiAgLyoqIFN3YXAgb3V0IG9uZSBgRGF0YVNvdXJjZWAgZm9yIGFub3RoZXIuICovXG4gIHByaXZhdGUgX2NoYW5nZURhdGFTb3VyY2Uob2xkRHM6IERhdGFTb3VyY2U8VD4gfCBudWxsLCBuZXdEczogRGF0YVNvdXJjZTxUPiB8IG51bGwpOlxuICAgICAgT2JzZXJ2YWJsZTxyZWFkb25seSBUW10+IHtcblxuICAgIGlmIChvbGREcykge1xuICAgICAgb2xkRHMuZGlzY29ubmVjdCh0aGlzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgcmV0dXJuIG5ld0RzID8gbmV3RHMuY29ubmVjdCh0aGlzKSA6IG9ic2VydmFibGVPZigpO1xuICB9XG5cbiAgLyoqIFVwZGF0ZSB0aGUgYENka1ZpcnR1YWxGb3JPZkNvbnRleHRgIGZvciBhbGwgdmlld3MuICovXG4gIHByaXZhdGUgX3VwZGF0ZUNvbnRleHQoKSB7XG4gICAgY29uc3QgY291bnQgPSB0aGlzLl9kYXRhLmxlbmd0aDtcbiAgICBsZXQgaSA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmdldChpKSBhcyBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj47XG4gICAgICB2aWV3LmNvbnRleHQuaW5kZXggPSB0aGlzLl9yZW5kZXJlZFJhbmdlLnN0YXJ0ICsgaTtcbiAgICAgIHZpZXcuY29udGV4dC5jb3VudCA9IGNvdW50O1xuICAgICAgdGhpcy5fdXBkYXRlQ29tcHV0ZWRDb250ZXh0UHJvcGVydGllcyh2aWV3LmNvbnRleHQpO1xuICAgICAgdmlldy5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEFwcGx5IGNoYW5nZXMgdG8gdGhlIERPTS4gKi9cbiAgcHJpdmF0ZSBfYXBwbHlDaGFuZ2VzKGNoYW5nZXM6IEl0ZXJhYmxlQ2hhbmdlczxUPikge1xuICAgIHRoaXMuX3ZpZXdSZXBlYXRlci5hcHBseUNoYW5nZXMoXG4gICAgICAgIGNoYW5nZXMsXG4gICAgICAgIHRoaXMuX3ZpZXdDb250YWluZXJSZWYsXG4gICAgICAgIChyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFQ+LFxuICAgICAgICAgX2FkanVzdGVkUHJldmlvdXNJbmRleDogbnVtYmVyIHwgbnVsbCxcbiAgICAgICAgIGN1cnJlbnRJbmRleDogbnVtYmVyIHwgbnVsbCkgPT4gdGhpcy5fZ2V0RW1iZWRkZWRWaWV3QXJncyhyZWNvcmQsIGN1cnJlbnRJbmRleCEpLFxuICAgICAgICAocmVjb3JkKSA9PiByZWNvcmQuaXRlbSk7XG5cbiAgICAvLyBVcGRhdGUgJGltcGxpY2l0IGZvciBhbnkgaXRlbXMgdGhhdCBoYWQgYW4gaWRlbnRpdHkgY2hhbmdlLlxuICAgIGNoYW5nZXMuZm9yRWFjaElkZW50aXR5Q2hhbmdlKChyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFQ+KSA9PiB7XG4gICAgICBjb25zdCB2aWV3ID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5nZXQocmVjb3JkLmN1cnJlbnRJbmRleCEpIGFzXG4gICAgICAgICAgRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+O1xuICAgICAgdmlldy5jb250ZXh0LiRpbXBsaWNpdCA9IHJlY29yZC5pdGVtO1xuICAgIH0pO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBjb250ZXh0IHZhcmlhYmxlcyBvbiBhbGwgaXRlbXMuXG4gICAgY29uc3QgY291bnQgPSB0aGlzLl9kYXRhLmxlbmd0aDtcbiAgICBsZXQgaSA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmdldChpKSBhcyBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj47XG4gICAgICB2aWV3LmNvbnRleHQuaW5kZXggPSB0aGlzLl9yZW5kZXJlZFJhbmdlLnN0YXJ0ICsgaTtcbiAgICAgIHZpZXcuY29udGV4dC5jb3VudCA9IGNvdW50O1xuICAgICAgdGhpcy5fdXBkYXRlQ29tcHV0ZWRDb250ZXh0UHJvcGVydGllcyh2aWV3LmNvbnRleHQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBVcGRhdGUgdGhlIGNvbXB1dGVkIHByb3BlcnRpZXMgb24gdGhlIGBDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0YC4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlQ29tcHV0ZWRDb250ZXh0UHJvcGVydGllcyhjb250ZXh0OiBDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PGFueT4pIHtcbiAgICBjb250ZXh0LmZpcnN0ID0gY29udGV4dC5pbmRleCA9PT0gMDtcbiAgICBjb250ZXh0Lmxhc3QgPSBjb250ZXh0LmluZGV4ID09PSBjb250ZXh0LmNvdW50IC0gMTtcbiAgICBjb250ZXh0LmV2ZW4gPSBjb250ZXh0LmluZGV4ICUgMiA9PT0gMDtcbiAgICBjb250ZXh0Lm9kZCA9ICFjb250ZXh0LmV2ZW47XG4gIH1cblxuICBwcml2YXRlIF9nZXRFbWJlZGRlZFZpZXdBcmdzKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8VD4sIGluZGV4OiBudW1iZXIpOlxuICAgICAgX1ZpZXdSZXBlYXRlckl0ZW1JbnNlcnRBcmdzPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+IHtcbiAgICAvLyBOb3RlIHRoYXQgaXQncyBpbXBvcnRhbnQgdGhhdCB3ZSBpbnNlcnQgdGhlIGl0ZW0gZGlyZWN0bHkgYXQgdGhlIHByb3BlciBpbmRleCxcbiAgICAvLyByYXRoZXIgdGhhbiBpbnNlcnRpbmcgaXQgYW5kIHRoZSBtb3ZpbmcgaXQgaW4gcGxhY2UsIGJlY2F1c2UgaWYgdGhlcmUncyBhIGRpcmVjdGl2ZVxuICAgIC8vIG9uIHRoZSBzYW1lIG5vZGUgdGhhdCBpbmplY3RzIHRoZSBgVmlld0NvbnRhaW5lclJlZmAsIEFuZ3VsYXIgd2lsbCBpbnNlcnQgYW5vdGhlclxuICAgIC8vIGNvbW1lbnQgbm9kZSB3aGljaCBjYW4gdGhyb3cgb2ZmIHRoZSBtb3ZlIHdoZW4gaXQncyBiZWluZyByZXBlYXRlZCBmb3IgYWxsIGl0ZW1zLlxuICAgIHJldHVybiB7XG4gICAgICB0ZW1wbGF0ZVJlZjogdGhpcy5fdGVtcGxhdGUsXG4gICAgICBjb250ZXh0OiB7XG4gICAgICAgICRpbXBsaWNpdDogcmVjb3JkLml0ZW0sXG4gICAgICAgIC8vIEl0J3MgZ3VhcmFudGVlZCB0aGF0IHRoZSBpdGVyYWJsZSBpcyBub3QgXCJ1bmRlZmluZWRcIiBvciBcIm51bGxcIiBiZWNhdXNlIHdlIG9ubHlcbiAgICAgICAgLy8gZ2VuZXJhdGUgdmlld3MgZm9yIGVsZW1lbnRzIGlmIHRoZSBcImNka1ZpcnR1YWxGb3JPZlwiIGl0ZXJhYmxlIGhhcyBlbGVtZW50cy5cbiAgICAgICAgY2RrVmlydHVhbEZvck9mOiB0aGlzLl9jZGtWaXJ0dWFsRm9yT2YhLFxuICAgICAgICBpbmRleDogLTEsXG4gICAgICAgIGNvdW50OiAtMSxcbiAgICAgICAgZmlyc3Q6IGZhbHNlLFxuICAgICAgICBsYXN0OiBmYWxzZSxcbiAgICAgICAgb2RkOiBmYWxzZSxcbiAgICAgICAgZXZlbjogZmFsc2VcbiAgICAgIH0sXG4gICAgICBpbmRleCxcbiAgICB9O1xuICB9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2Nka1ZpcnR1YWxGb3JUZW1wbGF0ZUNhY2hlU2l6ZTogTnVtYmVySW5wdXQ7XG59XG4iXX0=