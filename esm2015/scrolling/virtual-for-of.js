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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1mb3Itb2YuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy92aXJ0dWFsLWZvci1vZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsZUFBZSxFQUlmLFlBQVksRUFDWiw0QkFBNEIsRUFDNUIsdUJBQXVCLEdBRXhCLE1BQU0sMEJBQTBCLENBQUM7QUFDbEMsT0FBTyxFQUNMLFNBQVMsRUFHVCxNQUFNLEVBQ04sS0FBSyxFQUlMLGVBQWUsRUFFZixNQUFNLEVBRU4sUUFBUSxFQUNSLFdBQVcsRUFFWCxnQkFBZ0IsR0FDakIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLG9CQUFvQixFQUFjLE1BQU0sdUJBQXVCLENBQUM7QUFDeEUsT0FBTyxFQUFhLE9BQU8sRUFBRSxFQUFFLElBQUksWUFBWSxFQUFFLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUMzRSxPQUFPLEVBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXRGLE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBd0JuRSx5RUFBeUU7QUFDekUsU0FBUyxTQUFTLENBQUMsV0FBc0MsRUFBRSxTQUEwQixFQUFFLElBQVU7SUFDL0YsTUFBTSxFQUFFLEdBQUcsSUFBZSxDQUFDO0lBQzNCLElBQUksQ0FBQyxFQUFFLENBQUMscUJBQXFCLEVBQUU7UUFDN0IsT0FBTyxDQUFDLENBQUM7S0FDVjtJQUNELE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO0lBRXhDLElBQUksV0FBVyxLQUFLLFlBQVksRUFBRTtRQUNoQyxPQUFPLFNBQVMsS0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxD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QUMzQixPQUFPLEVBQUU7Z0JBQ1AsU0FBUyxFQUFFLE1BQU0sQ0FBQyxJQUFJO2dCQUN0QixpRkFBaUY7Z0JBQ2pGLDhFQUE4RTtnQkFDOUUsZUFBZSxFQUFFLElBQUksQ0FBQyxnQkFBaUI7Z0JBQ3ZDLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBQ1QsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFDVCxLQUFLLEVBQUUsS0FBSztnQkFDWixJQUFJLEVBQUUsS0FBSztnQkFDWCxHQUFHLEVBQUUsS0FBSztnQkFDVixJQUFJLEVBQUUsS0FBSzthQUNaO1lBQ0QsS0FBSztTQUNOLENBQUM7SUFDSixDQUFDOzs7WUEzU0YsU0FBUyxTQUFDO2dCQUNULFFBQVEsRUFBRSxrQ0FBa0M7Z0JBQzVDLFNBQVMsRUFBRTtvQkFDVCxFQUFDLE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxRQUFRLEVBQUUsNEJBQTRCLEVBQUM7aUJBQzNFO2FBQ0Y7OztZQXREQyxnQkFBZ0I7WUFGaEIsV0FBVztZQUxYLGVBQWU7WUFiZiw0QkFBNEIsdUJBaUx2QixNQUFNLFNBQUMsdUJBQXVCO1lBdko3Qix3QkFBd0IsdUJBMEp6QixRQUFRO1lBcktiLE1BQU07Ozs4QkFxRUwsS0FBSzttQ0FxQkwsS0FBSztvQ0FhTCxLQUFLOzZDQVlMLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgQXJyYXlEYXRhU291cmNlLFxuICBDb2xsZWN0aW9uVmlld2VyLFxuICBEYXRhU291cmNlLFxuICBMaXN0UmFuZ2UsXG4gIGlzRGF0YVNvdXJjZSxcbiAgX1JlY3ljbGVWaWV3UmVwZWF0ZXJTdHJhdGVneSxcbiAgX1ZJRVdfUkVQRUFURVJfU1RSQVRFR1ksXG4gIF9WaWV3UmVwZWF0ZXJJdGVtSW5zZXJ0QXJncyxcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvbGxlY3Rpb25zJztcbmltcG9ydCB7XG4gIERpcmVjdGl2ZSxcbiAgRG9DaGVjayxcbiAgRW1iZWRkZWRWaWV3UmVmLFxuICBJbmplY3QsXG4gIElucHV0LFxuICBJdGVyYWJsZUNoYW5nZVJlY29yZCxcbiAgSXRlcmFibGVDaGFuZ2VzLFxuICBJdGVyYWJsZURpZmZlcixcbiAgSXRlcmFibGVEaWZmZXJzLFxuICBOZ0l0ZXJhYmxlLFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgU2tpcFNlbGYsXG4gIFRlbXBsYXRlUmVmLFxuICBUcmFja0J5RnVuY3Rpb24sXG4gIFZpZXdDb250YWluZXJSZWYsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtjb2VyY2VOdW1iZXJQcm9wZXJ0eSwgTnVtYmVySW5wdXR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3QsIG9mIGFzIG9ic2VydmFibGVPZiwgaXNPYnNlcnZhYmxlfSBmcm9tICdyeGpzJztcbmltcG9ydCB7cGFpcndpc2UsIHNoYXJlUmVwbGF5LCBzdGFydFdpdGgsIHN3aXRjaE1hcCwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge0Nka1ZpcnR1YWxTY3JvbGxSZXBlYXRlcn0gZnJvbSAnLi92aXJ0dWFsLXNjcm9sbC1yZXBlYXRlcic7XG5pbXBvcnQge0Nka1ZpcnR1YWxTY3JvbGxWaWV3cG9ydH0gZnJvbSAnLi92aXJ0dWFsLXNjcm9sbC12aWV3cG9ydCc7XG5cblxuLyoqIFRoZSBjb250ZXh0IGZvciBhbiBpdGVtIHJlbmRlcmVkIGJ5IGBDZGtWaXJ0dWFsRm9yT2ZgICovXG5leHBvcnQgdHlwZSBDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+ID0ge1xuICAvKiogVGhlIGl0ZW0gdmFsdWUuICovXG4gICRpbXBsaWNpdDogVDtcbiAgLyoqIFRoZSBEYXRhU291cmNlLCBPYnNlcnZhYmxlLCBvciBOZ0l0ZXJhYmxlIHRoYXQgd2FzIHBhc3NlZCB0byAqY2RrVmlydHVhbEZvci4gKi9cbiAgY2RrVmlydHVhbEZvck9mOiBEYXRhU291cmNlPFQ+IHwgT2JzZXJ2YWJsZTxUW10+IHwgTmdJdGVyYWJsZTxUPjtcbiAgLyoqIFRoZSBpbmRleCBvZiB0aGUgaXRlbSBpbiB0aGUgRGF0YVNvdXJjZS4gKi9cbiAgaW5kZXg6IG51bWJlcjtcbiAgLyoqIFRoZSBudW1iZXIgb2YgaXRlbXMgaW4gdGhlIERhdGFTb3VyY2UuICovXG4gIGNvdW50OiBudW1iZXI7XG4gIC8qKiBXaGV0aGVyIHRoaXMgaXMgdGhlIGZpcnN0IGl0ZW0gaW4gdGhlIERhdGFTb3VyY2UuICovXG4gIGZpcnN0OiBib29sZWFuO1xuICAvKiogV2hldGhlciB0aGlzIGlzIHRoZSBsYXN0IGl0ZW0gaW4gdGhlIERhdGFTb3VyY2UuICovXG4gIGxhc3Q6IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIHRoZSBpbmRleCBpcyBldmVuLiAqL1xuICBldmVuOiBib29sZWFuO1xuICAvKiogV2hldGhlciB0aGUgaW5kZXggaXMgb2RkLiAqL1xuICBvZGQ6IGJvb2xlYW47XG59O1xuXG5cbi8qKiBIZWxwZXIgdG8gZXh0cmFjdCB0aGUgb2Zmc2V0IG9mIGEgRE9NIE5vZGUgaW4gYSBjZXJ0YWluIGRpcmVjdGlvbi4gKi9cbmZ1bmN0aW9uIGdldE9mZnNldChvcmllbnRhdGlvbjogJ2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJywgZGlyZWN0aW9uOiAnc3RhcnQnIHwgJ2VuZCcsIG5vZGU6IE5vZGUpIHtcbiAgY29uc3QgZWwgPSBub2RlIGFzIEVsZW1lbnQ7XG4gIGlmICghZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cbiAgY29uc3QgcmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gIGlmIChvcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnKSB7XG4gICAgcmV0dXJuIGRpcmVjdGlvbiA9PT0gJ3N0YXJ0JyA/IHJlY3QubGVmdCA6IHJlY3QucmlnaHQ7XG4gIH1cblxuICByZXR1cm4gZGlyZWN0aW9uID09PSAnc3RhcnQnID8gcmVjdC50b3AgOiByZWN0LmJvdHRvbTtcbn1cblxuLyoqXG4gKiBBIGRpcmVjdGl2ZSBzaW1pbGFyIHRvIGBuZ0Zvck9mYCB0byBiZSB1c2VkIGZvciByZW5kZXJpbmcgZGF0YSBpbnNpZGUgYSB2aXJ0dWFsIHNjcm9sbGluZ1xuICogY29udGFpbmVyLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrVmlydHVhbEZvcl1bY2RrVmlydHVhbEZvck9mXScsXG4gIHByb3ZpZGVyczogW1xuICAgIHtwcm92aWRlOiBfVklFV19SRVBFQVRFUl9TVFJBVEVHWSwgdXNlQ2xhc3M6IF9SZWN5Y2xlVmlld1JlcGVhdGVyU3RyYXRlZ3l9LFxuICBdXG59KVxuZXhwb3J0IGNsYXNzIENka1ZpcnR1YWxGb3JPZjxUPiBpbXBsZW1lbnRzXG4gICAgQ2RrVmlydHVhbFNjcm9sbFJlcGVhdGVyPFQ+LCBDb2xsZWN0aW9uVmlld2VyLCBEb0NoZWNrLCBPbkRlc3Ryb3kge1xuICAvKiogRW1pdHMgd2hlbiB0aGUgcmVuZGVyZWQgdmlldyBvZiB0aGUgZGF0YSBjaGFuZ2VzLiAqL1xuICB2aWV3Q2hhbmdlID0gbmV3IFN1YmplY3Q8TGlzdFJhbmdlPigpO1xuXG4gIC8qKiBTdWJqZWN0IHRoYXQgZW1pdHMgd2hlbiBhIG5ldyBEYXRhU291cmNlIGluc3RhbmNlIGlzIGdpdmVuLiAqL1xuICBwcml2YXRlIF9kYXRhU291cmNlQ2hhbmdlcyA9IG5ldyBTdWJqZWN0PERhdGFTb3VyY2U8VD4+KCk7XG5cbiAgLyoqIFRoZSBEYXRhU291cmNlIHRvIGRpc3BsYXkuICovXG4gIEBJbnB1dCgpXG4gIGdldCBjZGtWaXJ0dWFsRm9yT2YoKTogRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8VFtdPiB8IE5nSXRlcmFibGU8VD4gfCBudWxsIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fY2RrVmlydHVhbEZvck9mO1xuICB9XG4gIHNldCBjZGtWaXJ0dWFsRm9yT2YodmFsdWU6IERhdGFTb3VyY2U8VD4gfCBPYnNlcnZhYmxlPFRbXT4gfCBOZ0l0ZXJhYmxlPFQ+IHwgbnVsbCB8IHVuZGVmaW5lZCkge1xuICAgIHRoaXMuX2Nka1ZpcnR1YWxGb3JPZiA9IHZhbHVlO1xuICAgIGlmIChpc0RhdGFTb3VyY2UodmFsdWUpKSB7XG4gICAgICB0aGlzLl9kYXRhU291cmNlQ2hhbmdlcy5uZXh0KHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgdmFsdWUgaXMgYW4gYW4gTmdJdGVyYWJsZSwgY29udmVydCBpdCB0byBhbiBhcnJheS5cbiAgICAgIHRoaXMuX2RhdGFTb3VyY2VDaGFuZ2VzLm5leHQobmV3IEFycmF5RGF0YVNvdXJjZTxUPihcbiAgICAgICAgICBpc09ic2VydmFibGUodmFsdWUpID8gdmFsdWUgOiBBcnJheS5mcm9tKHZhbHVlIHx8IFtdKSkpO1xuICAgIH1cbiAgfVxuXG4gIF9jZGtWaXJ0dWFsRm9yT2Y6IERhdGFTb3VyY2U8VD4gfCBPYnNlcnZhYmxlPFRbXT4gfCBOZ0l0ZXJhYmxlPFQ+IHwgbnVsbCB8IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogVGhlIGBUcmFja0J5RnVuY3Rpb25gIHRvIHVzZSBmb3IgdHJhY2tpbmcgY2hhbmdlcy4gVGhlIGBUcmFja0J5RnVuY3Rpb25gIHRha2VzIHRoZSBpbmRleCBhbmRcbiAgICogdGhlIGl0ZW0gYW5kIHByb2R1Y2VzIGEgdmFsdWUgdG8gYmUgdXNlZCBhcyB0aGUgaXRlbSdzIGlkZW50aXR5IHdoZW4gdHJhY2tpbmcgY2hhbmdlcy5cbiAgICovXG4gIEBJbnB1dCgpXG4gIGdldCBjZGtWaXJ0dWFsRm9yVHJhY2tCeSgpOiBUcmFja0J5RnVuY3Rpb248VD4gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9jZGtWaXJ0dWFsRm9yVHJhY2tCeTtcbiAgfVxuICBzZXQgY2RrVmlydHVhbEZvclRyYWNrQnkoZm46IFRyYWNrQnlGdW5jdGlvbjxUPiB8IHVuZGVmaW5lZCkge1xuICAgIHRoaXMuX25lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICB0aGlzLl9jZGtWaXJ0dWFsRm9yVHJhY2tCeSA9IGZuID9cbiAgICAgICAgKGluZGV4LCBpdGVtKSA9PiBmbihpbmRleCArICh0aGlzLl9yZW5kZXJlZFJhbmdlID8gdGhpcy5fcmVuZGVyZWRSYW5nZS5zdGFydCA6IDApLCBpdGVtKSA6XG4gICAgICAgIHVuZGVmaW5lZDtcbiAgfVxuICBwcml2YXRlIF9jZGtWaXJ0dWFsRm9yVHJhY2tCeTogVHJhY2tCeUZ1bmN0aW9uPFQ+IHwgdW5kZWZpbmVkO1xuXG4gIC8qKiBUaGUgdGVtcGxhdGUgdXNlZCB0byBzdGFtcCBvdXQgbmV3IGVsZW1lbnRzLiAqL1xuICBASW5wdXQoKVxuICBzZXQgY2RrVmlydHVhbEZvclRlbXBsYXRlKHZhbHVlOiBUZW1wbGF0ZVJlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+Pikge1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgdGhpcy5fbmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgICAgdGhpcy5fdGVtcGxhdGUgPSB2YWx1ZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGhlIHNpemUgb2YgdGhlIGNhY2hlIHVzZWQgdG8gc3RvcmUgdGVtcGxhdGVzIHRoYXQgYXJlIG5vdCBiZWluZyB1c2VkIGZvciByZS11c2UgbGF0ZXIuXG4gICAqIFNldHRpbmcgdGhlIGNhY2hlIHNpemUgdG8gYDBgIHdpbGwgZGlzYWJsZSBjYWNoaW5nLiBEZWZhdWx0cyB0byAyMCB0ZW1wbGF0ZXMuXG4gICAqL1xuICBASW5wdXQoKVxuICBnZXQgY2RrVmlydHVhbEZvclRlbXBsYXRlQ2FjaGVTaXplKCkge1xuICAgIHJldHVybiB0aGlzLl92aWV3UmVwZWF0ZXIudmlld0NhY2hlU2l6ZTtcbiAgfVxuICBzZXQgY2RrVmlydHVhbEZvclRlbXBsYXRlQ2FjaGVTaXplKHNpemU6IG51bWJlcikge1xuICAgIHRoaXMuX3ZpZXdSZXBlYXRlci52aWV3Q2FjaGVTaXplID0gY29lcmNlTnVtYmVyUHJvcGVydHkoc2l6ZSk7XG4gIH1cblxuICAvKiogRW1pdHMgd2hlbmV2ZXIgdGhlIGRhdGEgaW4gdGhlIGN1cnJlbnQgRGF0YVNvdXJjZSBjaGFuZ2VzLiAqL1xuICBkYXRhU3RyZWFtOiBPYnNlcnZhYmxlPFRbXSB8IFJlYWRvbmx5QXJyYXk8VD4+ID0gdGhpcy5fZGF0YVNvdXJjZUNoYW5nZXNcbiAgLnBpcGUoXG4gICAgICAvLyBTdGFydCBvZmYgd2l0aCBudWxsIGBEYXRhU291cmNlYC5cbiAgICAgIHN0YXJ0V2l0aChudWxsISksXG4gICAgICAvLyBCdW5kbGUgdXAgdGhlIHByZXZpb3VzIGFuZCBjdXJyZW50IGRhdGEgc291cmNlcyBzbyB3ZSBjYW4gd29yayB3aXRoIGJvdGguXG4gICAgICBwYWlyd2lzZSgpLFxuICAgICAgLy8gVXNlIGBfY2hhbmdlRGF0YVNvdXJjZWAgdG8gZGlzY29ubmVjdCBmcm9tIHRoZSBwcmV2aW91cyBkYXRhIHNvdXJjZSBhbmQgY29ubmVjdCB0byB0aGVcbiAgICAgIC8vIG5ldyBvbmUsIHBhc3NpbmcgYmFjayBhIHN0cmVhbSBvZiBkYXRhIGNoYW5nZXMgd2hpY2ggd2UgcnVuIHRocm91Z2ggYHN3aXRjaE1hcGAgdG8gZ2l2ZVxuICAgICAgLy8gdXMgYSBkYXRhIHN0cmVhbSB0aGF0IGVtaXRzIHRoZSBsYXRlc3QgZGF0YSBmcm9tIHdoYXRldmVyIHRoZSBjdXJyZW50IGBEYXRhU291cmNlYCBpcy5cbiAgICAgIHN3aXRjaE1hcCgoW3ByZXYsIGN1cl0pID0+IHRoaXMuX2NoYW5nZURhdGFTb3VyY2UocHJldiwgY3VyKSksXG4gICAgICAvLyBSZXBsYXkgdGhlIGxhc3QgZW1pdHRlZCBkYXRhIHdoZW4gc29tZW9uZSBzdWJzY3JpYmVzLlxuICAgICAgc2hhcmVSZXBsYXkoMSkpO1xuXG4gIC8qKiBUaGUgZGlmZmVyIHVzZWQgdG8gY2FsY3VsYXRlIGNoYW5nZXMgdG8gdGhlIGRhdGEuICovXG4gIHByaXZhdGUgX2RpZmZlcjogSXRlcmFibGVEaWZmZXI8VD4gfCBudWxsID0gbnVsbDtcblxuICAvKiogVGhlIG1vc3QgcmVjZW50IGRhdGEgZW1pdHRlZCBmcm9tIHRoZSBEYXRhU291cmNlLiAqL1xuICBwcml2YXRlIF9kYXRhOiBUW10gfCBSZWFkb25seUFycmF5PFQ+O1xuXG4gIC8qKiBUaGUgY3VycmVudGx5IHJlbmRlcmVkIGl0ZW1zLiAqL1xuICBwcml2YXRlIF9yZW5kZXJlZEl0ZW1zOiBUW107XG5cbiAgLyoqIFRoZSBjdXJyZW50bHkgcmVuZGVyZWQgcmFuZ2Ugb2YgaW5kaWNlcy4gKi9cbiAgcHJpdmF0ZSBfcmVuZGVyZWRSYW5nZTogTGlzdFJhbmdlO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSByZW5kZXJlZCBkYXRhIHNob3VsZCBiZSB1cGRhdGVkIGR1cmluZyB0aGUgbmV4dCBuZ0RvQ2hlY2sgY3ljbGUuICovXG4gIHByaXZhdGUgX25lZWRzVXBkYXRlID0gZmFsc2U7XG5cbiAgcHJpdmF0ZSBfZGVzdHJveWVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKiBUaGUgdmlldyBjb250YWluZXIgdG8gYWRkIGl0ZW1zIHRvLiAqL1xuICAgICAgcHJpdmF0ZSBfdmlld0NvbnRhaW5lclJlZjogVmlld0NvbnRhaW5lclJlZixcbiAgICAgIC8qKiBUaGUgdGVtcGxhdGUgdG8gdXNlIHdoZW4gc3RhbXBpbmcgb3V0IG5ldyBpdGVtcy4gKi9cbiAgICAgIHByaXZhdGUgX3RlbXBsYXRlOiBUZW1wbGF0ZVJlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PixcbiAgICAgIC8qKiBUaGUgc2V0IG9mIGF2YWlsYWJsZSBkaWZmZXJzLiAqL1xuICAgICAgcHJpdmF0ZSBfZGlmZmVyczogSXRlcmFibGVEaWZmZXJzLFxuICAgICAgLyoqIFRoZSBzdHJhdGVneSB1c2VkIHRvIHJlbmRlciBpdGVtcyBpbiB0aGUgdmlydHVhbCBzY3JvbGwgdmlld3BvcnQuICovXG4gICAgICBASW5qZWN0KF9WSUVXX1JFUEVBVEVSX1NUUkFURUdZKVxuICAgICAgcHJpdmF0ZSBfdmlld1JlcGVhdGVyOiBfUmVjeWNsZVZpZXdSZXBlYXRlclN0cmF0ZWd5PFQsIFQsIENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+LFxuICAgICAgLyoqIFRoZSB2aXJ0dWFsIHNjcm9sbGluZyB2aWV3cG9ydCB0aGF0IHRoZXNlIGl0ZW1zIGFyZSBiZWluZyByZW5kZXJlZCBpbi4gKi9cbiAgICAgIEBTa2lwU2VsZigpIHByaXZhdGUgX3ZpZXdwb3J0OiBDZGtWaXJ0dWFsU2Nyb2xsVmlld3BvcnQsXG4gICAgICBuZ1pvbmU6IE5nWm9uZSkge1xuICAgIHRoaXMuZGF0YVN0cmVhbS5zdWJzY3JpYmUoZGF0YSA9PiB7XG4gICAgICB0aGlzLl9kYXRhID0gZGF0YTtcbiAgICAgIHRoaXMuX29uUmVuZGVyZWREYXRhQ2hhbmdlKCk7XG4gICAgfSk7XG4gICAgdGhpcy5fdmlld3BvcnQucmVuZGVyZWRSYW5nZVN0cmVhbS5waXBlKHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpKS5zdWJzY3JpYmUocmFuZ2UgPT4ge1xuICAgICAgdGhpcy5fcmVuZGVyZWRSYW5nZSA9IHJhbmdlO1xuICAgICAgbmdab25lLnJ1bigoKSA9PiB0aGlzLnZpZXdDaGFuZ2UubmV4dCh0aGlzLl9yZW5kZXJlZFJhbmdlKSk7XG4gICAgICB0aGlzLl9vblJlbmRlcmVkRGF0YUNoYW5nZSgpO1xuICAgIH0pO1xuICAgIHRoaXMuX3ZpZXdwb3J0LmF0dGFjaCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNZWFzdXJlcyB0aGUgY29tYmluZWQgc2l6ZSAod2lkdGggZm9yIGhvcml6b250YWwgb3JpZW50YXRpb24sIGhlaWdodCBmb3IgdmVydGljYWwpIG9mIGFsbCBpdGVtc1xuICAgKiBpbiB0aGUgc3BlY2lmaWVkIHJhbmdlLiBUaHJvd3MgYW4gZXJyb3IgaWYgdGhlIHJhbmdlIGluY2x1ZGVzIGl0ZW1zIHRoYXQgYXJlIG5vdCBjdXJyZW50bHlcbiAgICogcmVuZGVyZWQuXG4gICAqL1xuICBtZWFzdXJlUmFuZ2VTaXplKHJhbmdlOiBMaXN0UmFuZ2UsIG9yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcgfCAndmVydGljYWwnKTogbnVtYmVyIHtcbiAgICBpZiAocmFuZ2Uuc3RhcnQgPj0gcmFuZ2UuZW5kKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgaWYgKChyYW5nZS5zdGFydCA8IHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQgfHwgcmFuZ2UuZW5kID4gdGhpcy5fcmVuZGVyZWRSYW5nZS5lbmQpICYmXG4gICAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgdGhyb3cgRXJyb3IoYEVycm9yOiBhdHRlbXB0ZWQgdG8gbWVhc3VyZSBhbiBpdGVtIHRoYXQgaXNuJ3QgcmVuZGVyZWQuYCk7XG4gICAgfVxuXG4gICAgLy8gVGhlIGluZGV4IGludG8gdGhlIGxpc3Qgb2YgcmVuZGVyZWQgdmlld3MgZm9yIHRoZSBmaXJzdCBpdGVtIGluIHRoZSByYW5nZS5cbiAgICBjb25zdCByZW5kZXJlZFN0YXJ0SW5kZXggPSByYW5nZS5zdGFydCAtIHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQ7XG4gICAgLy8gVGhlIGxlbmd0aCBvZiB0aGUgcmFuZ2Ugd2UncmUgbWVhc3VyaW5nLlxuICAgIGNvbnN0IHJhbmdlTGVuID0gcmFuZ2UuZW5kIC0gcmFuZ2Uuc3RhcnQ7XG5cbiAgICAvLyBMb29wIG92ZXIgYWxsIHRoZSB2aWV3cywgZmluZCB0aGUgZmlyc3QgYW5kIGxhbmQgbm9kZSBhbmQgY29tcHV0ZSB0aGUgc2l6ZSBieSBzdWJ0cmFjdGluZ1xuICAgIC8vIHRoZSB0b3Agb2YgdGhlIGZpcnN0IG5vZGUgZnJvbSB0aGUgYm90dG9tIG9mIHRoZSBsYXN0IG9uZS5cbiAgICBsZXQgZmlyc3ROb2RlOiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZDtcbiAgICBsZXQgbGFzdE5vZGU6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkO1xuXG4gICAgLy8gRmluZCB0aGUgZmlyc3Qgbm9kZSBieSBzdGFydGluZyBmcm9tIHRoZSBiZWdpbm5pbmcgYW5kIGdvaW5nIGZvcndhcmRzLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmFuZ2VMZW47IGkrKykge1xuICAgICAgY29uc3QgdmlldyA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuZ2V0KGkgKyByZW5kZXJlZFN0YXJ0SW5kZXgpIGFzXG4gICAgICAgICAgRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+IHwgbnVsbDtcbiAgICAgIGlmICh2aWV3ICYmIHZpZXcucm9vdE5vZGVzLmxlbmd0aCkge1xuICAgICAgICBmaXJzdE5vZGUgPSBsYXN0Tm9kZSA9IHZpZXcucm9vdE5vZGVzWzBdO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBGaW5kIHRoZSBsYXN0IG5vZGUgYnkgc3RhcnRpbmcgZnJvbSB0aGUgZW5kIGFuZCBnb2luZyBiYWNrd2FyZHMuXG4gICAgZm9yIChsZXQgaSA9IHJhbmdlTGVuIC0gMTsgaSA+IC0xOyBpLS0pIHtcbiAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmdldChpICsgcmVuZGVyZWRTdGFydEluZGV4KSBhc1xuICAgICAgICAgIEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PiB8IG51bGw7XG4gICAgICBpZiAodmlldyAmJiB2aWV3LnJvb3ROb2Rlcy5sZW5ndGgpIHtcbiAgICAgICAgbGFzdE5vZGUgPSB2aWV3LnJvb3ROb2Rlc1t2aWV3LnJvb3ROb2Rlcy5sZW5ndGggLSAxXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZpcnN0Tm9kZSAmJiBsYXN0Tm9kZSA/XG4gICAgICAgIGdldE9mZnNldChvcmllbnRhdGlvbiwgJ2VuZCcsIGxhc3ROb2RlKSAtIGdldE9mZnNldChvcmllbnRhdGlvbiwgJ3N0YXJ0JywgZmlyc3ROb2RlKSA6IDA7XG4gIH1cblxuICBuZ0RvQ2hlY2soKSB7XG4gICAgaWYgKHRoaXMuX2RpZmZlciAmJiB0aGlzLl9uZWVkc1VwZGF0ZSkge1xuICAgICAgLy8gVE9ETyhtbWFsZXJiYSk6IFdlIHNob3VsZCBkaWZmZXJlbnRpYXRlIG5lZWRzIHVwZGF0ZSBkdWUgdG8gc2Nyb2xsaW5nIGFuZCBhIG5ldyBwb3J0aW9uIG9mXG4gICAgICAvLyB0aGlzIGxpc3QgYmVpbmcgcmVuZGVyZWQgKGNhbiB1c2Ugc2ltcGxlciBhbGdvcml0aG0pIHZzIG5lZWRzIHVwZGF0ZSBkdWUgdG8gZGF0YSBhY3R1YWxseVxuICAgICAgLy8gY2hhbmdpbmcgKG5lZWQgdG8gZG8gdGhpcyBkaWZmKS5cbiAgICAgIGNvbnN0IGNoYW5nZXMgPSB0aGlzLl9kaWZmZXIuZGlmZih0aGlzLl9yZW5kZXJlZEl0ZW1zKTtcbiAgICAgIGlmICghY2hhbmdlcykge1xuICAgICAgICB0aGlzLl91cGRhdGVDb250ZXh0KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9hcHBseUNoYW5nZXMoY2hhbmdlcyk7XG4gICAgICB9XG4gICAgICB0aGlzLl9uZWVkc1VwZGF0ZSA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX3ZpZXdwb3J0LmRldGFjaCgpO1xuXG4gICAgdGhpcy5fZGF0YVNvdXJjZUNoYW5nZXMubmV4dCh1bmRlZmluZWQhKTtcbiAgICB0aGlzLl9kYXRhU291cmNlQ2hhbmdlcy5jb21wbGV0ZSgpO1xuICAgIHRoaXMudmlld0NoYW5nZS5jb21wbGV0ZSgpO1xuXG4gICAgdGhpcy5fZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLl92aWV3UmVwZWF0ZXIuZGV0YWNoKCk7XG4gIH1cblxuICAvKiogUmVhY3QgdG8gc2Nyb2xsIHN0YXRlIGNoYW5nZXMgaW4gdGhlIHZpZXdwb3J0LiAqL1xuICBwcml2YXRlIF9vblJlbmRlcmVkRGF0YUNoYW5nZSgpIHtcbiAgICBpZiAoIXRoaXMuX3JlbmRlcmVkUmFuZ2UpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fcmVuZGVyZWRJdGVtcyA9IHRoaXMuX2RhdGEuc2xpY2UodGhpcy5fcmVuZGVyZWRSYW5nZS5zdGFydCwgdGhpcy5fcmVuZGVyZWRSYW5nZS5lbmQpO1xuICAgIGlmICghdGhpcy5fZGlmZmVyKSB7XG4gICAgICAvLyBVc2UgYSB3cmFwcGVyIGZ1bmN0aW9uIGZvciB0aGUgYHRyYWNrQnlgIHNvIGFueSBuZXcgdmFsdWVzIGFyZVxuICAgICAgLy8gcGlja2VkIHVwIGF1dG9tYXRpY2FsbHkgd2l0aG91dCBoYXZpbmcgdG8gcmVjcmVhdGUgdGhlIGRpZmZlci5cbiAgICAgIHRoaXMuX2RpZmZlciA9IHRoaXMuX2RpZmZlcnMuZmluZCh0aGlzLl9yZW5kZXJlZEl0ZW1zKS5jcmVhdGUoKGluZGV4LCBpdGVtKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmNka1ZpcnR1YWxGb3JUcmFja0J5ID8gdGhpcy5jZGtWaXJ0dWFsRm9yVHJhY2tCeShpbmRleCwgaXRlbSkgOiBpdGVtO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHRoaXMuX25lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKiBTd2FwIG91dCBvbmUgYERhdGFTb3VyY2VgIGZvciBhbm90aGVyLiAqL1xuICBwcml2YXRlIF9jaGFuZ2VEYXRhU291cmNlKG9sZERzOiBEYXRhU291cmNlPFQ+IHwgbnVsbCwgbmV3RHM6IERhdGFTb3VyY2U8VD4gfCBudWxsKTpcbiAgICAgIE9ic2VydmFibGU8VFtdIHwgUmVhZG9ubHlBcnJheTxUPj4ge1xuXG4gICAgaWYgKG9sZERzKSB7XG4gICAgICBvbGREcy5kaXNjb25uZWN0KHRoaXMpO1xuICAgIH1cblxuICAgIHRoaXMuX25lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICByZXR1cm4gbmV3RHMgPyBuZXdEcy5jb25uZWN0KHRoaXMpIDogb2JzZXJ2YWJsZU9mKCk7XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSBgQ2RrVmlydHVhbEZvck9mQ29udGV4dGAgZm9yIGFsbCB2aWV3cy4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlQ29udGV4dCgpIHtcbiAgICBjb25zdCBjb3VudCA9IHRoaXMuX2RhdGEubGVuZ3RoO1xuICAgIGxldCBpID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgY29uc3QgdmlldyA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuZ2V0KGkpIGFzIEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PjtcbiAgICAgIHZpZXcuY29udGV4dC5pbmRleCA9IHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQgKyBpO1xuICAgICAgdmlldy5jb250ZXh0LmNvdW50ID0gY291bnQ7XG4gICAgICB0aGlzLl91cGRhdGVDb21wdXRlZENvbnRleHRQcm9wZXJ0aWVzKHZpZXcuY29udGV4dCk7XG4gICAgICB2aWV3LmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gIH1cblxuICAvKiogQXBwbHkgY2hhbmdlcyB0byB0aGUgRE9NLiAqL1xuICBwcml2YXRlIF9hcHBseUNoYW5nZXMoY2hhbmdlczogSXRlcmFibGVDaGFuZ2VzPFQ+KSB7XG4gICAgdGhpcy5fdmlld1JlcGVhdGVyLmFwcGx5Q2hhbmdlcyhcbiAgICAgICAgY2hhbmdlcyxcbiAgICAgICAgdGhpcy5fdmlld0NvbnRhaW5lclJlZixcbiAgICAgICAgKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8VD4sXG4gICAgICAgICBfYWRqdXN0ZWRQcmV2aW91c0luZGV4OiBudW1iZXIgfCBudWxsLFxuICAgICAgICAgY3VycmVudEluZGV4OiBudW1iZXIgfCBudWxsKSA9PiB0aGlzLl9nZXRFbWJlZGRlZFZpZXdBcmdzKHJlY29yZCwgY3VycmVudEluZGV4ISksXG4gICAgICAgIChyZWNvcmQpID0+IHJlY29yZC5pdGVtKTtcblxuICAgIC8vIFVwZGF0ZSAkaW1wbGljaXQgZm9yIGFueSBpdGVtcyB0aGF0IGhhZCBhbiBpZGVudGl0eSBjaGFuZ2UuXG4gICAgY2hhbmdlcy5mb3JFYWNoSWRlbnRpdHlDaGFuZ2UoKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8VD4pID0+IHtcbiAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmdldChyZWNvcmQuY3VycmVudEluZGV4ISkgYXNcbiAgICAgICAgICBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj47XG4gICAgICB2aWV3LmNvbnRleHQuJGltcGxpY2l0ID0gcmVjb3JkLml0ZW07XG4gICAgfSk7XG5cbiAgICAvLyBVcGRhdGUgdGhlIGNvbnRleHQgdmFyaWFibGVzIG9uIGFsbCBpdGVtcy5cbiAgICBjb25zdCBjb3VudCA9IHRoaXMuX2RhdGEubGVuZ3RoO1xuICAgIGxldCBpID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgY29uc3QgdmlldyA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuZ2V0KGkpIGFzIEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PjtcbiAgICAgIHZpZXcuY29udGV4dC5pbmRleCA9IHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQgKyBpO1xuICAgICAgdmlldy5jb250ZXh0LmNvdW50ID0gY291bnQ7XG4gICAgICB0aGlzLl91cGRhdGVDb21wdXRlZENvbnRleHRQcm9wZXJ0aWVzKHZpZXcuY29udGV4dCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFVwZGF0ZSB0aGUgY29tcHV0ZWQgcHJvcGVydGllcyBvbiB0aGUgYENka1ZpcnR1YWxGb3JPZkNvbnRleHRgLiAqL1xuICBwcml2YXRlIF91cGRhdGVDb21wdXRlZENvbnRleHRQcm9wZXJ0aWVzKGNvbnRleHQ6IENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8YW55Pikge1xuICAgIGNvbnRleHQuZmlyc3QgPSBjb250ZXh0LmluZGV4ID09PSAwO1xuICAgIGNvbnRleHQubGFzdCA9IGNvbnRleHQuaW5kZXggPT09IGNvbnRleHQuY291bnQgLSAxO1xuICAgIGNvbnRleHQuZXZlbiA9IGNvbnRleHQuaW5kZXggJSAyID09PSAwO1xuICAgIGNvbnRleHQub2RkID0gIWNvbnRleHQuZXZlbjtcbiAgfVxuXG4gIHByaXZhdGUgX2dldEVtYmVkZGVkVmlld0FyZ3MocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZDxUPiwgaW5kZXg6IG51bWJlcik6XG4gICAgICBfVmlld1JlcGVhdGVySXRlbUluc2VydEFyZ3M8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj4ge1xuICAgIC8vIE5vdGUgdGhhdCBpdCdzIGltcG9ydGFudCB0aGF0IHdlIGluc2VydCB0aGUgaXRlbSBkaXJlY3RseSBhdCB0aGUgcHJvcGVyIGluZGV4LFxuICAgIC8vIHJhdGhlciB0aGFuIGluc2VydGluZyBpdCBhbmQgdGhlIG1vdmluZyBpdCBpbiBwbGFjZSwgYmVjYXVzZSBpZiB0aGVyZSdzIGEgZGlyZWN0aXZlXG4gICAgLy8gb24gdGhlIHNhbWUgbm9kZSB0aGF0IGluamVjdHMgdGhlIGBWaWV3Q29udGFpbmVyUmVmYCwgQW5ndWxhciB3aWxsIGluc2VydCBhbm90aGVyXG4gICAgLy8gY29tbWVudCBub2RlIHdoaWNoIGNhbiB0aHJvdyBvZmYgdGhlIG1vdmUgd2hlbiBpdCdzIGJlaW5nIHJlcGVhdGVkIGZvciBhbGwgaXRlbXMuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRlbXBsYXRlUmVmOiB0aGlzLl90ZW1wbGF0ZSxcbiAgICAgIGNvbnRleHQ6IHtcbiAgICAgICAgJGltcGxpY2l0OiByZWNvcmQuaXRlbSxcbiAgICAgICAgLy8gSXQncyBndWFyYW50ZWVkIHRoYXQgdGhlIGl0ZXJhYmxlIGlzIG5vdCBcInVuZGVmaW5lZFwiIG9yIFwibnVsbFwiIGJlY2F1c2Ugd2Ugb25seVxuICAgICAgICAvLyBnZW5lcmF0ZSB2aWV3cyBmb3IgZWxlbWVudHMgaWYgdGhlIFwiY2RrVmlydHVhbEZvck9mXCIgaXRlcmFibGUgaGFzIGVsZW1lbnRzLlxuICAgICAgICBjZGtWaXJ0dWFsRm9yT2Y6IHRoaXMuX2Nka1ZpcnR1YWxGb3JPZiEsXG4gICAgICAgIGluZGV4OiAtMSxcbiAgICAgICAgY291bnQ6IC0xLFxuICAgICAgICBmaXJzdDogZmFsc2UsXG4gICAgICAgIGxhc3Q6IGZhbHNlLFxuICAgICAgICBvZGQ6IGZhbHNlLFxuICAgICAgICBldmVuOiBmYWxzZVxuICAgICAgfSxcbiAgICAgIGluZGV4LFxuICAgIH07XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfY2RrVmlydHVhbEZvclRlbXBsYXRlQ2FjaGVTaXplOiBOdW1iZXJJbnB1dDtcbn1cbiJdfQ==