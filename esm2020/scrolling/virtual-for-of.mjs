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
import * as i0 from "@angular/core";
import * as i1 from "./virtual-scroll-viewport";
import * as i2 from "@angular/cdk/collections";
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
        this.dataStream = this._dataSourceChanges.pipe(
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
        this._cdkVirtualForTrackBy = fn
            ? (index, item) => fn(index + (this._renderedRange ? this._renderedRange.start : 0), item)
            : undefined;
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
        return firstNode && lastNode
            ? getOffset(orientation, 'end', lastNode) - getOffset(orientation, 'start', firstNode)
            : 0;
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
        this._viewRepeater.applyChanges(changes, this._viewContainerRef, (record, _adjustedPreviousIndex, currentIndex) => this._getEmbeddedViewArgs(record, currentIndex), record => record.item);
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
                even: false,
            },
            index,
        };
    }
}
CdkVirtualForOf.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.2.0-rc.1", ngImport: i0, type: CdkVirtualForOf, deps: [{ token: i0.ViewContainerRef }, { token: i0.TemplateRef }, { token: i0.IterableDiffers }, { token: _VIEW_REPEATER_STRATEGY }, { token: i1.CdkVirtualScrollViewport, skipSelf: true }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Directive });
CdkVirtualForOf.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.2.0-rc.1", type: CdkVirtualForOf, selector: "[cdkVirtualFor][cdkVirtualForOf]", inputs: { cdkVirtualForOf: "cdkVirtualForOf", cdkVirtualForTrackBy: "cdkVirtualForTrackBy", cdkVirtualForTemplate: "cdkVirtualForTemplate", cdkVirtualForTemplateCacheSize: "cdkVirtualForTemplateCacheSize" }, providers: [{ provide: _VIEW_REPEATER_STRATEGY, useClass: _RecycleViewRepeaterStrategy }], ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.2.0-rc.1", ngImport: i0, type: CdkVirtualForOf, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkVirtualFor][cdkVirtualForOf]',
                    providers: [{ provide: _VIEW_REPEATER_STRATEGY, useClass: _RecycleViewRepeaterStrategy }],
                }]
        }], ctorParameters: function () { return [{ type: i0.ViewContainerRef }, { type: i0.TemplateRef }, { type: i0.IterableDiffers }, { type: i2._RecycleViewRepeaterStrategy, decorators: [{
                    type: Inject,
                    args: [_VIEW_REPEATER_STRATEGY]
                }] }, { type: i1.CdkVirtualScrollViewport, decorators: [{
                    type: SkipSelf
                }] }, { type: i0.NgZone }]; }, propDecorators: { cdkVirtualForOf: [{
                type: Input
            }], cdkVirtualForTrackBy: [{
                type: Input
            }], cdkVirtualForTemplate: [{
                type: Input
            }], cdkVirtualForTemplateCacheSize: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1mb3Itb2YuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy92aXJ0dWFsLWZvci1vZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsZUFBZSxFQUlmLFlBQVksRUFDWiw0QkFBNEIsRUFDNUIsdUJBQXVCLEdBRXhCLE1BQU0sMEJBQTBCLENBQUM7QUFDbEMsT0FBTyxFQUNMLFNBQVMsRUFHVCxNQUFNLEVBQ04sS0FBSyxFQUlMLGVBQWUsRUFFZixNQUFNLEVBRU4sUUFBUSxFQUNSLFdBQVcsRUFFWCxnQkFBZ0IsR0FDakIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLG9CQUFvQixFQUFjLE1BQU0sdUJBQXVCLENBQUM7QUFDeEUsT0FBTyxFQUFhLE9BQU8sRUFBRSxFQUFFLElBQUksWUFBWSxFQUFFLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUMzRSxPQUFPLEVBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXRGLE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLDJCQUEyQixDQUFDOzs7O0FBc0JuRSx5RUFBeUU7QUFDekUsU0FBUyxTQUFTLENBQUMsV0FBc0MsRUFBRSxTQUEwQixFQUFFLElBQVU7SUFDL0YsTUFBTSxFQUFFLEdBQUcsSUFBZSxDQUFDO0lBQzNCLElBQUksQ0FBQyxFQUFFLENBQUMscUJBQXFCLEVBQUU7UUFDN0IsT0FBTyxDQUFDLENBQUM7S0FDVjtJQUNELE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO0lBRXhDLElBQUksV0FBVyxLQUFLLFlBQVksRUFBRTtRQUNoQyxPQUFPLFNBQVMsS0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FB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WUFDM0IsT0FBTyxFQUFFO2dCQUNQLFNBQVMsRUFBRSxNQUFNLENBQUMsSUFBSTtnQkFDdEIsaUZBQWlGO2dCQUNqRiw4RUFBOEU7Z0JBQzlFLGVBQWUsRUFBRSxJQUFJLENBQUMsZ0JBQWlCO2dCQUN2QyxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUNULEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBQ1QsS0FBSyxFQUFFLEtBQUs7Z0JBQ1osSUFBSSxFQUFFLEtBQUs7Z0JBQ1gsR0FBRyxFQUFFLEtBQUs7Z0JBQ1YsSUFBSSxFQUFFLEtBQUs7YUFDWjtZQUNELEtBQUs7U0FDTixDQUFDO0lBQ0osQ0FBQzs7aUhBcFRVLGVBQWUsNEdBd0doQix1QkFBdUI7cUdBeEd0QixlQUFlLDJRQUZmLENBQUMsRUFBQyxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsUUFBUSxFQUFFLDRCQUE0QixFQUFDLENBQUM7Z0dBRTVFLGVBQWU7a0JBSjNCLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLGtDQUFrQztvQkFDNUMsU0FBUyxFQUFFLENBQUMsRUFBQyxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsUUFBUSxFQUFFLDRCQUE0QixFQUFDLENBQUM7aUJBQ3hGOzswQkF5R0ksTUFBTTsyQkFBQyx1QkFBdUI7OzBCQUc5QixRQUFRO2lFQWhHUCxlQUFlO3NCQURsQixLQUFLO2dCQXVCRixvQkFBb0I7c0JBRHZCLEtBQUs7Z0JBY0YscUJBQXFCO3NCQUR4QixLQUFLO2dCQWFGLDhCQUE4QjtzQkFEakMsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBBcnJheURhdGFTb3VyY2UsXG4gIENvbGxlY3Rpb25WaWV3ZXIsXG4gIERhdGFTb3VyY2UsXG4gIExpc3RSYW5nZSxcbiAgaXNEYXRhU291cmNlLFxuICBfUmVjeWNsZVZpZXdSZXBlYXRlclN0cmF0ZWd5LFxuICBfVklFV19SRVBFQVRFUl9TVFJBVEVHWSxcbiAgX1ZpZXdSZXBlYXRlckl0ZW1JbnNlcnRBcmdzLFxufSBmcm9tICdAYW5ndWxhci9jZGsvY29sbGVjdGlvbnMnO1xuaW1wb3J0IHtcbiAgRGlyZWN0aXZlLFxuICBEb0NoZWNrLFxuICBFbWJlZGRlZFZpZXdSZWYsXG4gIEluamVjdCxcbiAgSW5wdXQsXG4gIEl0ZXJhYmxlQ2hhbmdlUmVjb3JkLFxuICBJdGVyYWJsZUNoYW5nZXMsXG4gIEl0ZXJhYmxlRGlmZmVyLFxuICBJdGVyYWJsZURpZmZlcnMsXG4gIE5nSXRlcmFibGUsXG4gIE5nWm9uZSxcbiAgT25EZXN0cm95LFxuICBTa2lwU2VsZixcbiAgVGVtcGxhdGVSZWYsXG4gIFRyYWNrQnlGdW5jdGlvbixcbiAgVmlld0NvbnRhaW5lclJlZixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge2NvZXJjZU51bWJlclByb3BlcnR5LCBOdW1iZXJJbnB1dH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdCwgb2YgYXMgb2JzZXJ2YWJsZU9mLCBpc09ic2VydmFibGV9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtwYWlyd2lzZSwgc2hhcmVSZXBsYXksIHN0YXJ0V2l0aCwgc3dpdGNoTWFwLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7Q2RrVmlydHVhbFNjcm9sbFJlcGVhdGVyfSBmcm9tICcuL3ZpcnR1YWwtc2Nyb2xsLXJlcGVhdGVyJztcbmltcG9ydCB7Q2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0fSBmcm9tICcuL3ZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0JztcblxuLyoqIFRoZSBjb250ZXh0IGZvciBhbiBpdGVtIHJlbmRlcmVkIGJ5IGBDZGtWaXJ0dWFsRm9yT2ZgICovXG5leHBvcnQgdHlwZSBDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+ID0ge1xuICAvKiogVGhlIGl0ZW0gdmFsdWUuICovXG4gICRpbXBsaWNpdDogVDtcbiAgLyoqIFRoZSBEYXRhU291cmNlLCBPYnNlcnZhYmxlLCBvciBOZ0l0ZXJhYmxlIHRoYXQgd2FzIHBhc3NlZCB0byAqY2RrVmlydHVhbEZvci4gKi9cbiAgY2RrVmlydHVhbEZvck9mOiBEYXRhU291cmNlPFQ+IHwgT2JzZXJ2YWJsZTxUW10+IHwgTmdJdGVyYWJsZTxUPjtcbiAgLyoqIFRoZSBpbmRleCBvZiB0aGUgaXRlbSBpbiB0aGUgRGF0YVNvdXJjZS4gKi9cbiAgaW5kZXg6IG51bWJlcjtcbiAgLyoqIFRoZSBudW1iZXIgb2YgaXRlbXMgaW4gdGhlIERhdGFTb3VyY2UuICovXG4gIGNvdW50OiBudW1iZXI7XG4gIC8qKiBXaGV0aGVyIHRoaXMgaXMgdGhlIGZpcnN0IGl0ZW0gaW4gdGhlIERhdGFTb3VyY2UuICovXG4gIGZpcnN0OiBib29sZWFuO1xuICAvKiogV2hldGhlciB0aGlzIGlzIHRoZSBsYXN0IGl0ZW0gaW4gdGhlIERhdGFTb3VyY2UuICovXG4gIGxhc3Q6IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIHRoZSBpbmRleCBpcyBldmVuLiAqL1xuICBldmVuOiBib29sZWFuO1xuICAvKiogV2hldGhlciB0aGUgaW5kZXggaXMgb2RkLiAqL1xuICBvZGQ6IGJvb2xlYW47XG59O1xuXG4vKiogSGVscGVyIHRvIGV4dHJhY3QgdGhlIG9mZnNldCBvZiBhIERPTSBOb2RlIGluIGEgY2VydGFpbiBkaXJlY3Rpb24uICovXG5mdW5jdGlvbiBnZXRPZmZzZXQob3JpZW50YXRpb246ICdob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCcsIGRpcmVjdGlvbjogJ3N0YXJ0JyB8ICdlbmQnLCBub2RlOiBOb2RlKSB7XG4gIGNvbnN0IGVsID0gbm9kZSBhcyBFbGVtZW50O1xuICBpZiAoIWVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCkge1xuICAgIHJldHVybiAwO1xuICB9XG4gIGNvbnN0IHJlY3QgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICBpZiAob3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJykge1xuICAgIHJldHVybiBkaXJlY3Rpb24gPT09ICdzdGFydCcgPyByZWN0LmxlZnQgOiByZWN0LnJpZ2h0O1xuICB9XG5cbiAgcmV0dXJuIGRpcmVjdGlvbiA9PT0gJ3N0YXJ0JyA/IHJlY3QudG9wIDogcmVjdC5ib3R0b207XG59XG5cbi8qKlxuICogQSBkaXJlY3RpdmUgc2ltaWxhciB0byBgbmdGb3JPZmAgdG8gYmUgdXNlZCBmb3IgcmVuZGVyaW5nIGRhdGEgaW5zaWRlIGEgdmlydHVhbCBzY3JvbGxpbmdcbiAqIGNvbnRhaW5lci5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka1ZpcnR1YWxGb3JdW2Nka1ZpcnR1YWxGb3JPZl0nLFxuICBwcm92aWRlcnM6IFt7cHJvdmlkZTogX1ZJRVdfUkVQRUFURVJfU1RSQVRFR1ksIHVzZUNsYXNzOiBfUmVjeWNsZVZpZXdSZXBlYXRlclN0cmF0ZWd5fV0sXG59KVxuZXhwb3J0IGNsYXNzIENka1ZpcnR1YWxGb3JPZjxUPlxuICBpbXBsZW1lbnRzIENka1ZpcnR1YWxTY3JvbGxSZXBlYXRlcjxUPiwgQ29sbGVjdGlvblZpZXdlciwgRG9DaGVjaywgT25EZXN0cm95XG57XG4gIC8qKiBFbWl0cyB3aGVuIHRoZSByZW5kZXJlZCB2aWV3IG9mIHRoZSBkYXRhIGNoYW5nZXMuICovXG4gIHJlYWRvbmx5IHZpZXdDaGFuZ2UgPSBuZXcgU3ViamVjdDxMaXN0UmFuZ2U+KCk7XG5cbiAgLyoqIFN1YmplY3QgdGhhdCBlbWl0cyB3aGVuIGEgbmV3IERhdGFTb3VyY2UgaW5zdGFuY2UgaXMgZ2l2ZW4uICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX2RhdGFTb3VyY2VDaGFuZ2VzID0gbmV3IFN1YmplY3Q8RGF0YVNvdXJjZTxUPj4oKTtcblxuICAvKiogVGhlIERhdGFTb3VyY2UgdG8gZGlzcGxheS4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGNka1ZpcnR1YWxGb3JPZigpOiBEYXRhU291cmNlPFQ+IHwgT2JzZXJ2YWJsZTxUW10+IHwgTmdJdGVyYWJsZTxUPiB8IG51bGwgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9jZGtWaXJ0dWFsRm9yT2Y7XG4gIH1cbiAgc2V0IGNka1ZpcnR1YWxGb3JPZih2YWx1ZTogRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8VFtdPiB8IE5nSXRlcmFibGU8VD4gfCBudWxsIHwgdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5fY2RrVmlydHVhbEZvck9mID0gdmFsdWU7XG4gICAgaWYgKGlzRGF0YVNvdXJjZSh2YWx1ZSkpIHtcbiAgICAgIHRoaXMuX2RhdGFTb3VyY2VDaGFuZ2VzLm5leHQodmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB2YWx1ZSBpcyBhbiBhbiBOZ0l0ZXJhYmxlLCBjb252ZXJ0IGl0IHRvIGFuIGFycmF5LlxuICAgICAgdGhpcy5fZGF0YVNvdXJjZUNoYW5nZXMubmV4dChcbiAgICAgICAgbmV3IEFycmF5RGF0YVNvdXJjZTxUPihpc09ic2VydmFibGUodmFsdWUpID8gdmFsdWUgOiBBcnJheS5mcm9tKHZhbHVlIHx8IFtdKSksXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIF9jZGtWaXJ0dWFsRm9yT2Y6IERhdGFTb3VyY2U8VD4gfCBPYnNlcnZhYmxlPFRbXT4gfCBOZ0l0ZXJhYmxlPFQ+IHwgbnVsbCB8IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogVGhlIGBUcmFja0J5RnVuY3Rpb25gIHRvIHVzZSBmb3IgdHJhY2tpbmcgY2hhbmdlcy4gVGhlIGBUcmFja0J5RnVuY3Rpb25gIHRha2VzIHRoZSBpbmRleCBhbmRcbiAgICogdGhlIGl0ZW0gYW5kIHByb2R1Y2VzIGEgdmFsdWUgdG8gYmUgdXNlZCBhcyB0aGUgaXRlbSdzIGlkZW50aXR5IHdoZW4gdHJhY2tpbmcgY2hhbmdlcy5cbiAgICovXG4gIEBJbnB1dCgpXG4gIGdldCBjZGtWaXJ0dWFsRm9yVHJhY2tCeSgpOiBUcmFja0J5RnVuY3Rpb248VD4gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9jZGtWaXJ0dWFsRm9yVHJhY2tCeTtcbiAgfVxuICBzZXQgY2RrVmlydHVhbEZvclRyYWNrQnkoZm46IFRyYWNrQnlGdW5jdGlvbjxUPiB8IHVuZGVmaW5lZCkge1xuICAgIHRoaXMuX25lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICB0aGlzLl9jZGtWaXJ0dWFsRm9yVHJhY2tCeSA9IGZuXG4gICAgICA/IChpbmRleCwgaXRlbSkgPT4gZm4oaW5kZXggKyAodGhpcy5fcmVuZGVyZWRSYW5nZSA/IHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQgOiAwKSwgaXRlbSlcbiAgICAgIDogdW5kZWZpbmVkO1xuICB9XG4gIHByaXZhdGUgX2Nka1ZpcnR1YWxGb3JUcmFja0J5OiBUcmFja0J5RnVuY3Rpb248VD4gfCB1bmRlZmluZWQ7XG5cbiAgLyoqIFRoZSB0ZW1wbGF0ZSB1c2VkIHRvIHN0YW1wIG91dCBuZXcgZWxlbWVudHMuICovXG4gIEBJbnB1dCgpXG4gIHNldCBjZGtWaXJ0dWFsRm9yVGVtcGxhdGUodmFsdWU6IFRlbXBsYXRlUmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+KSB7XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICB0aGlzLl9uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgICB0aGlzLl90ZW1wbGF0ZSA9IHZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgc2l6ZSBvZiB0aGUgY2FjaGUgdXNlZCB0byBzdG9yZSB0ZW1wbGF0ZXMgdGhhdCBhcmUgbm90IGJlaW5nIHVzZWQgZm9yIHJlLXVzZSBsYXRlci5cbiAgICogU2V0dGluZyB0aGUgY2FjaGUgc2l6ZSB0byBgMGAgd2lsbCBkaXNhYmxlIGNhY2hpbmcuIERlZmF1bHRzIHRvIDIwIHRlbXBsYXRlcy5cbiAgICovXG4gIEBJbnB1dCgpXG4gIGdldCBjZGtWaXJ0dWFsRm9yVGVtcGxhdGVDYWNoZVNpemUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdmlld1JlcGVhdGVyLnZpZXdDYWNoZVNpemU7XG4gIH1cbiAgc2V0IGNka1ZpcnR1YWxGb3JUZW1wbGF0ZUNhY2hlU2l6ZShzaXplOiBOdW1iZXJJbnB1dCkge1xuICAgIHRoaXMuX3ZpZXdSZXBlYXRlci52aWV3Q2FjaGVTaXplID0gY29lcmNlTnVtYmVyUHJvcGVydHkoc2l6ZSk7XG4gIH1cblxuICAvKiogRW1pdHMgd2hlbmV2ZXIgdGhlIGRhdGEgaW4gdGhlIGN1cnJlbnQgRGF0YVNvdXJjZSBjaGFuZ2VzLiAqL1xuICByZWFkb25seSBkYXRhU3RyZWFtOiBPYnNlcnZhYmxlPHJlYWRvbmx5IFRbXT4gPSB0aGlzLl9kYXRhU291cmNlQ2hhbmdlcy5waXBlKFxuICAgIC8vIFN0YXJ0IG9mZiB3aXRoIG51bGwgYERhdGFTb3VyY2VgLlxuICAgIHN0YXJ0V2l0aChudWxsKSxcbiAgICAvLyBCdW5kbGUgdXAgdGhlIHByZXZpb3VzIGFuZCBjdXJyZW50IGRhdGEgc291cmNlcyBzbyB3ZSBjYW4gd29yayB3aXRoIGJvdGguXG4gICAgcGFpcndpc2UoKSxcbiAgICAvLyBVc2UgYF9jaGFuZ2VEYXRhU291cmNlYCB0byBkaXNjb25uZWN0IGZyb20gdGhlIHByZXZpb3VzIGRhdGEgc291cmNlIGFuZCBjb25uZWN0IHRvIHRoZVxuICAgIC8vIG5ldyBvbmUsIHBhc3NpbmcgYmFjayBhIHN0cmVhbSBvZiBkYXRhIGNoYW5nZXMgd2hpY2ggd2UgcnVuIHRocm91Z2ggYHN3aXRjaE1hcGAgdG8gZ2l2ZVxuICAgIC8vIHVzIGEgZGF0YSBzdHJlYW0gdGhhdCBlbWl0cyB0aGUgbGF0ZXN0IGRhdGEgZnJvbSB3aGF0ZXZlciB0aGUgY3VycmVudCBgRGF0YVNvdXJjZWAgaXMuXG4gICAgc3dpdGNoTWFwKChbcHJldiwgY3VyXSkgPT4gdGhpcy5fY2hhbmdlRGF0YVNvdXJjZShwcmV2LCBjdXIpKSxcbiAgICAvLyBSZXBsYXkgdGhlIGxhc3QgZW1pdHRlZCBkYXRhIHdoZW4gc29tZW9uZSBzdWJzY3JpYmVzLlxuICAgIHNoYXJlUmVwbGF5KDEpLFxuICApO1xuXG4gIC8qKiBUaGUgZGlmZmVyIHVzZWQgdG8gY2FsY3VsYXRlIGNoYW5nZXMgdG8gdGhlIGRhdGEuICovXG4gIHByaXZhdGUgX2RpZmZlcjogSXRlcmFibGVEaWZmZXI8VD4gfCBudWxsID0gbnVsbDtcblxuICAvKiogVGhlIG1vc3QgcmVjZW50IGRhdGEgZW1pdHRlZCBmcm9tIHRoZSBEYXRhU291cmNlLiAqL1xuICBwcml2YXRlIF9kYXRhOiByZWFkb25seSBUW107XG5cbiAgLyoqIFRoZSBjdXJyZW50bHkgcmVuZGVyZWQgaXRlbXMuICovXG4gIHByaXZhdGUgX3JlbmRlcmVkSXRlbXM6IFRbXTtcblxuICAvKiogVGhlIGN1cnJlbnRseSByZW5kZXJlZCByYW5nZSBvZiBpbmRpY2VzLiAqL1xuICBwcml2YXRlIF9yZW5kZXJlZFJhbmdlOiBMaXN0UmFuZ2U7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHJlbmRlcmVkIGRhdGEgc2hvdWxkIGJlIHVwZGF0ZWQgZHVyaW5nIHRoZSBuZXh0IG5nRG9DaGVjayBjeWNsZS4gKi9cbiAgcHJpdmF0ZSBfbmVlZHNVcGRhdGUgPSBmYWxzZTtcblxuICBwcml2YXRlIHJlYWRvbmx5IF9kZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIC8qKiBUaGUgdmlldyBjb250YWluZXIgdG8gYWRkIGl0ZW1zIHRvLiAqL1xuICAgIHByaXZhdGUgX3ZpZXdDb250YWluZXJSZWY6IFZpZXdDb250YWluZXJSZWYsXG4gICAgLyoqIFRoZSB0ZW1wbGF0ZSB0byB1c2Ugd2hlbiBzdGFtcGluZyBvdXQgbmV3IGl0ZW1zLiAqL1xuICAgIHByaXZhdGUgX3RlbXBsYXRlOiBUZW1wbGF0ZVJlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PixcbiAgICAvKiogVGhlIHNldCBvZiBhdmFpbGFibGUgZGlmZmVycy4gKi9cbiAgICBwcml2YXRlIF9kaWZmZXJzOiBJdGVyYWJsZURpZmZlcnMsXG4gICAgLyoqIFRoZSBzdHJhdGVneSB1c2VkIHRvIHJlbmRlciBpdGVtcyBpbiB0aGUgdmlydHVhbCBzY3JvbGwgdmlld3BvcnQuICovXG4gICAgQEluamVjdChfVklFV19SRVBFQVRFUl9TVFJBVEVHWSlcbiAgICBwcml2YXRlIF92aWV3UmVwZWF0ZXI6IF9SZWN5Y2xlVmlld1JlcGVhdGVyU3RyYXRlZ3k8VCwgVCwgQ2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj4sXG4gICAgLyoqIFRoZSB2aXJ0dWFsIHNjcm9sbGluZyB2aWV3cG9ydCB0aGF0IHRoZXNlIGl0ZW1zIGFyZSBiZWluZyByZW5kZXJlZCBpbi4gKi9cbiAgICBAU2tpcFNlbGYoKSBwcml2YXRlIF92aWV3cG9ydDogQ2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0LFxuICAgIG5nWm9uZTogTmdab25lLFxuICApIHtcbiAgICB0aGlzLmRhdGFTdHJlYW0uc3Vic2NyaWJlKGRhdGEgPT4ge1xuICAgICAgdGhpcy5fZGF0YSA9IGRhdGE7XG4gICAgICB0aGlzLl9vblJlbmRlcmVkRGF0YUNoYW5nZSgpO1xuICAgIH0pO1xuICAgIHRoaXMuX3ZpZXdwb3J0LnJlbmRlcmVkUmFuZ2VTdHJlYW0ucGlwZSh0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSkuc3Vic2NyaWJlKHJhbmdlID0+IHtcbiAgICAgIHRoaXMuX3JlbmRlcmVkUmFuZ2UgPSByYW5nZTtcbiAgICAgIG5nWm9uZS5ydW4oKCkgPT4gdGhpcy52aWV3Q2hhbmdlLm5leHQodGhpcy5fcmVuZGVyZWRSYW5nZSkpO1xuICAgICAgdGhpcy5fb25SZW5kZXJlZERhdGFDaGFuZ2UoKTtcbiAgICB9KTtcbiAgICB0aGlzLl92aWV3cG9ydC5hdHRhY2godGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogTWVhc3VyZXMgdGhlIGNvbWJpbmVkIHNpemUgKHdpZHRoIGZvciBob3Jpem9udGFsIG9yaWVudGF0aW9uLCBoZWlnaHQgZm9yIHZlcnRpY2FsKSBvZiBhbGwgaXRlbXNcbiAgICogaW4gdGhlIHNwZWNpZmllZCByYW5nZS4gVGhyb3dzIGFuIGVycm9yIGlmIHRoZSByYW5nZSBpbmNsdWRlcyBpdGVtcyB0aGF0IGFyZSBub3QgY3VycmVudGx5XG4gICAqIHJlbmRlcmVkLlxuICAgKi9cbiAgbWVhc3VyZVJhbmdlU2l6ZShyYW5nZTogTGlzdFJhbmdlLCBvcmllbnRhdGlvbjogJ2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJyk6IG51bWJlciB7XG4gICAgaWYgKHJhbmdlLnN0YXJ0ID49IHJhbmdlLmVuZCkge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGlmIChcbiAgICAgIChyYW5nZS5zdGFydCA8IHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQgfHwgcmFuZ2UuZW5kID4gdGhpcy5fcmVuZGVyZWRSYW5nZS5lbmQpICYmXG4gICAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKVxuICAgICkge1xuICAgICAgdGhyb3cgRXJyb3IoYEVycm9yOiBhdHRlbXB0ZWQgdG8gbWVhc3VyZSBhbiBpdGVtIHRoYXQgaXNuJ3QgcmVuZGVyZWQuYCk7XG4gICAgfVxuXG4gICAgLy8gVGhlIGluZGV4IGludG8gdGhlIGxpc3Qgb2YgcmVuZGVyZWQgdmlld3MgZm9yIHRoZSBmaXJzdCBpdGVtIGluIHRoZSByYW5nZS5cbiAgICBjb25zdCByZW5kZXJlZFN0YXJ0SW5kZXggPSByYW5nZS5zdGFydCAtIHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQ7XG4gICAgLy8gVGhlIGxlbmd0aCBvZiB0aGUgcmFuZ2Ugd2UncmUgbWVhc3VyaW5nLlxuICAgIGNvbnN0IHJhbmdlTGVuID0gcmFuZ2UuZW5kIC0gcmFuZ2Uuc3RhcnQ7XG5cbiAgICAvLyBMb29wIG92ZXIgYWxsIHRoZSB2aWV3cywgZmluZCB0aGUgZmlyc3QgYW5kIGxhbmQgbm9kZSBhbmQgY29tcHV0ZSB0aGUgc2l6ZSBieSBzdWJ0cmFjdGluZ1xuICAgIC8vIHRoZSB0b3Agb2YgdGhlIGZpcnN0IG5vZGUgZnJvbSB0aGUgYm90dG9tIG9mIHRoZSBsYXN0IG9uZS5cbiAgICBsZXQgZmlyc3ROb2RlOiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZDtcbiAgICBsZXQgbGFzdE5vZGU6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkO1xuXG4gICAgLy8gRmluZCB0aGUgZmlyc3Qgbm9kZSBieSBzdGFydGluZyBmcm9tIHRoZSBiZWdpbm5pbmcgYW5kIGdvaW5nIGZvcndhcmRzLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmFuZ2VMZW47IGkrKykge1xuICAgICAgY29uc3QgdmlldyA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuZ2V0KGkgKyByZW5kZXJlZFN0YXJ0SW5kZXgpIGFzIEVtYmVkZGVkVmlld1JlZjxcbiAgICAgICAgQ2RrVmlydHVhbEZvck9mQ29udGV4dDxUPlxuICAgICAgPiB8IG51bGw7XG4gICAgICBpZiAodmlldyAmJiB2aWV3LnJvb3ROb2Rlcy5sZW5ndGgpIHtcbiAgICAgICAgZmlyc3ROb2RlID0gbGFzdE5vZGUgPSB2aWV3LnJvb3ROb2Rlc1swXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRmluZCB0aGUgbGFzdCBub2RlIGJ5IHN0YXJ0aW5nIGZyb20gdGhlIGVuZCBhbmQgZ29pbmcgYmFja3dhcmRzLlxuICAgIGZvciAobGV0IGkgPSByYW5nZUxlbiAtIDE7IGkgPiAtMTsgaS0tKSB7XG4gICAgICBjb25zdCB2aWV3ID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5nZXQoaSArIHJlbmRlcmVkU3RhcnRJbmRleCkgYXMgRW1iZWRkZWRWaWV3UmVmPFxuICAgICAgICBDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+XG4gICAgICA+IHwgbnVsbDtcbiAgICAgIGlmICh2aWV3ICYmIHZpZXcucm9vdE5vZGVzLmxlbmd0aCkge1xuICAgICAgICBsYXN0Tm9kZSA9IHZpZXcucm9vdE5vZGVzW3ZpZXcucm9vdE5vZGVzLmxlbmd0aCAtIDFdO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmlyc3ROb2RlICYmIGxhc3ROb2RlXG4gICAgICA/IGdldE9mZnNldChvcmllbnRhdGlvbiwgJ2VuZCcsIGxhc3ROb2RlKSAtIGdldE9mZnNldChvcmllbnRhdGlvbiwgJ3N0YXJ0JywgZmlyc3ROb2RlKVxuICAgICAgOiAwO1xuICB9XG5cbiAgbmdEb0NoZWNrKCkge1xuICAgIGlmICh0aGlzLl9kaWZmZXIgJiYgdGhpcy5fbmVlZHNVcGRhdGUpIHtcbiAgICAgIC8vIFRPRE8obW1hbGVyYmEpOiBXZSBzaG91bGQgZGlmZmVyZW50aWF0ZSBuZWVkcyB1cGRhdGUgZHVlIHRvIHNjcm9sbGluZyBhbmQgYSBuZXcgcG9ydGlvbiBvZlxuICAgICAgLy8gdGhpcyBsaXN0IGJlaW5nIHJlbmRlcmVkIChjYW4gdXNlIHNpbXBsZXIgYWxnb3JpdGhtKSB2cyBuZWVkcyB1cGRhdGUgZHVlIHRvIGRhdGEgYWN0dWFsbHlcbiAgICAgIC8vIGNoYW5naW5nIChuZWVkIHRvIGRvIHRoaXMgZGlmZikuXG4gICAgICBjb25zdCBjaGFuZ2VzID0gdGhpcy5fZGlmZmVyLmRpZmYodGhpcy5fcmVuZGVyZWRJdGVtcyk7XG4gICAgICBpZiAoIWNoYW5nZXMpIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlQ29udGV4dCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fYXBwbHlDaGFuZ2VzKGNoYW5nZXMpO1xuICAgICAgfVxuICAgICAgdGhpcy5fbmVlZHNVcGRhdGUgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl92aWV3cG9ydC5kZXRhY2goKTtcblxuICAgIHRoaXMuX2RhdGFTb3VyY2VDaGFuZ2VzLm5leHQodW5kZWZpbmVkISk7XG4gICAgdGhpcy5fZGF0YVNvdXJjZUNoYW5nZXMuY29tcGxldGUoKTtcbiAgICB0aGlzLnZpZXdDaGFuZ2UuY29tcGxldGUoKTtcblxuICAgIHRoaXMuX2Rlc3Ryb3llZC5uZXh0KCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fdmlld1JlcGVhdGVyLmRldGFjaCgpO1xuICB9XG5cbiAgLyoqIFJlYWN0IHRvIHNjcm9sbCBzdGF0ZSBjaGFuZ2VzIGluIHRoZSB2aWV3cG9ydC4gKi9cbiAgcHJpdmF0ZSBfb25SZW5kZXJlZERhdGFDaGFuZ2UoKSB7XG4gICAgaWYgKCF0aGlzLl9yZW5kZXJlZFJhbmdlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX3JlbmRlcmVkSXRlbXMgPSB0aGlzLl9kYXRhLnNsaWNlKHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQsIHRoaXMuX3JlbmRlcmVkUmFuZ2UuZW5kKTtcbiAgICBpZiAoIXRoaXMuX2RpZmZlcikge1xuICAgICAgLy8gVXNlIGEgd3JhcHBlciBmdW5jdGlvbiBmb3IgdGhlIGB0cmFja0J5YCBzbyBhbnkgbmV3IHZhbHVlcyBhcmVcbiAgICAgIC8vIHBpY2tlZCB1cCBhdXRvbWF0aWNhbGx5IHdpdGhvdXQgaGF2aW5nIHRvIHJlY3JlYXRlIHRoZSBkaWZmZXIuXG4gICAgICB0aGlzLl9kaWZmZXIgPSB0aGlzLl9kaWZmZXJzLmZpbmQodGhpcy5fcmVuZGVyZWRJdGVtcykuY3JlYXRlKChpbmRleCwgaXRlbSkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5jZGtWaXJ0dWFsRm9yVHJhY2tCeSA/IHRoaXMuY2RrVmlydHVhbEZvclRyYWNrQnkoaW5kZXgsIGl0ZW0pIDogaXRlbTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICB0aGlzLl9uZWVkc1VwZGF0ZSA9IHRydWU7XG4gIH1cblxuICAvKiogU3dhcCBvdXQgb25lIGBEYXRhU291cmNlYCBmb3IgYW5vdGhlci4gKi9cbiAgcHJpdmF0ZSBfY2hhbmdlRGF0YVNvdXJjZShcbiAgICBvbGREczogRGF0YVNvdXJjZTxUPiB8IG51bGwsXG4gICAgbmV3RHM6IERhdGFTb3VyY2U8VD4gfCBudWxsLFxuICApOiBPYnNlcnZhYmxlPHJlYWRvbmx5IFRbXT4ge1xuICAgIGlmIChvbGREcykge1xuICAgICAgb2xkRHMuZGlzY29ubmVjdCh0aGlzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgcmV0dXJuIG5ld0RzID8gbmV3RHMuY29ubmVjdCh0aGlzKSA6IG9ic2VydmFibGVPZigpO1xuICB9XG5cbiAgLyoqIFVwZGF0ZSB0aGUgYENka1ZpcnR1YWxGb3JPZkNvbnRleHRgIGZvciBhbGwgdmlld3MuICovXG4gIHByaXZhdGUgX3VwZGF0ZUNvbnRleHQoKSB7XG4gICAgY29uc3QgY291bnQgPSB0aGlzLl9kYXRhLmxlbmd0aDtcbiAgICBsZXQgaSA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmdldChpKSBhcyBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj47XG4gICAgICB2aWV3LmNvbnRleHQuaW5kZXggPSB0aGlzLl9yZW5kZXJlZFJhbmdlLnN0YXJ0ICsgaTtcbiAgICAgIHZpZXcuY29udGV4dC5jb3VudCA9IGNvdW50O1xuICAgICAgdGhpcy5fdXBkYXRlQ29tcHV0ZWRDb250ZXh0UHJvcGVydGllcyh2aWV3LmNvbnRleHQpO1xuICAgICAgdmlldy5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEFwcGx5IGNoYW5nZXMgdG8gdGhlIERPTS4gKi9cbiAgcHJpdmF0ZSBfYXBwbHlDaGFuZ2VzKGNoYW5nZXM6IEl0ZXJhYmxlQ2hhbmdlczxUPikge1xuICAgIHRoaXMuX3ZpZXdSZXBlYXRlci5hcHBseUNoYW5nZXMoXG4gICAgICBjaGFuZ2VzLFxuICAgICAgdGhpcy5fdmlld0NvbnRhaW5lclJlZixcbiAgICAgIChcbiAgICAgICAgcmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZDxUPixcbiAgICAgICAgX2FkanVzdGVkUHJldmlvdXNJbmRleDogbnVtYmVyIHwgbnVsbCxcbiAgICAgICAgY3VycmVudEluZGV4OiBudW1iZXIgfCBudWxsLFxuICAgICAgKSA9PiB0aGlzLl9nZXRFbWJlZGRlZFZpZXdBcmdzKHJlY29yZCwgY3VycmVudEluZGV4ISksXG4gICAgICByZWNvcmQgPT4gcmVjb3JkLml0ZW0sXG4gICAgKTtcblxuICAgIC8vIFVwZGF0ZSAkaW1wbGljaXQgZm9yIGFueSBpdGVtcyB0aGF0IGhhZCBhbiBpZGVudGl0eSBjaGFuZ2UuXG4gICAgY2hhbmdlcy5mb3JFYWNoSWRlbnRpdHlDaGFuZ2UoKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8VD4pID0+IHtcbiAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmdldChyZWNvcmQuY3VycmVudEluZGV4ISkgYXMgRW1iZWRkZWRWaWV3UmVmPFxuICAgICAgICBDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+XG4gICAgICA+O1xuICAgICAgdmlldy5jb250ZXh0LiRpbXBsaWNpdCA9IHJlY29yZC5pdGVtO1xuICAgIH0pO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBjb250ZXh0IHZhcmlhYmxlcyBvbiBhbGwgaXRlbXMuXG4gICAgY29uc3QgY291bnQgPSB0aGlzLl9kYXRhLmxlbmd0aDtcbiAgICBsZXQgaSA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmdldChpKSBhcyBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj47XG4gICAgICB2aWV3LmNvbnRleHQuaW5kZXggPSB0aGlzLl9yZW5kZXJlZFJhbmdlLnN0YXJ0ICsgaTtcbiAgICAgIHZpZXcuY29udGV4dC5jb3VudCA9IGNvdW50O1xuICAgICAgdGhpcy5fdXBkYXRlQ29tcHV0ZWRDb250ZXh0UHJvcGVydGllcyh2aWV3LmNvbnRleHQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBVcGRhdGUgdGhlIGNvbXB1dGVkIHByb3BlcnRpZXMgb24gdGhlIGBDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0YC4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlQ29tcHV0ZWRDb250ZXh0UHJvcGVydGllcyhjb250ZXh0OiBDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PGFueT4pIHtcbiAgICBjb250ZXh0LmZpcnN0ID0gY29udGV4dC5pbmRleCA9PT0gMDtcbiAgICBjb250ZXh0Lmxhc3QgPSBjb250ZXh0LmluZGV4ID09PSBjb250ZXh0LmNvdW50IC0gMTtcbiAgICBjb250ZXh0LmV2ZW4gPSBjb250ZXh0LmluZGV4ICUgMiA9PT0gMDtcbiAgICBjb250ZXh0Lm9kZCA9ICFjb250ZXh0LmV2ZW47XG4gIH1cblxuICBwcml2YXRlIF9nZXRFbWJlZGRlZFZpZXdBcmdzKFxuICAgIHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8VD4sXG4gICAgaW5kZXg6IG51bWJlcixcbiAgKTogX1ZpZXdSZXBlYXRlckl0ZW1JbnNlcnRBcmdzPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+IHtcbiAgICAvLyBOb3RlIHRoYXQgaXQncyBpbXBvcnRhbnQgdGhhdCB3ZSBpbnNlcnQgdGhlIGl0ZW0gZGlyZWN0bHkgYXQgdGhlIHByb3BlciBpbmRleCxcbiAgICAvLyByYXRoZXIgdGhhbiBpbnNlcnRpbmcgaXQgYW5kIHRoZSBtb3ZpbmcgaXQgaW4gcGxhY2UsIGJlY2F1c2UgaWYgdGhlcmUncyBhIGRpcmVjdGl2ZVxuICAgIC8vIG9uIHRoZSBzYW1lIG5vZGUgdGhhdCBpbmplY3RzIHRoZSBgVmlld0NvbnRhaW5lclJlZmAsIEFuZ3VsYXIgd2lsbCBpbnNlcnQgYW5vdGhlclxuICAgIC8vIGNvbW1lbnQgbm9kZSB3aGljaCBjYW4gdGhyb3cgb2ZmIHRoZSBtb3ZlIHdoZW4gaXQncyBiZWluZyByZXBlYXRlZCBmb3IgYWxsIGl0ZW1zLlxuICAgIHJldHVybiB7XG4gICAgICB0ZW1wbGF0ZVJlZjogdGhpcy5fdGVtcGxhdGUsXG4gICAgICBjb250ZXh0OiB7XG4gICAgICAgICRpbXBsaWNpdDogcmVjb3JkLml0ZW0sXG4gICAgICAgIC8vIEl0J3MgZ3VhcmFudGVlZCB0aGF0IHRoZSBpdGVyYWJsZSBpcyBub3QgXCJ1bmRlZmluZWRcIiBvciBcIm51bGxcIiBiZWNhdXNlIHdlIG9ubHlcbiAgICAgICAgLy8gZ2VuZXJhdGUgdmlld3MgZm9yIGVsZW1lbnRzIGlmIHRoZSBcImNka1ZpcnR1YWxGb3JPZlwiIGl0ZXJhYmxlIGhhcyBlbGVtZW50cy5cbiAgICAgICAgY2RrVmlydHVhbEZvck9mOiB0aGlzLl9jZGtWaXJ0dWFsRm9yT2YhLFxuICAgICAgICBpbmRleDogLTEsXG4gICAgICAgIGNvdW50OiAtMSxcbiAgICAgICAgZmlyc3Q6IGZhbHNlLFxuICAgICAgICBsYXN0OiBmYWxzZSxcbiAgICAgICAgb2RkOiBmYWxzZSxcbiAgICAgICAgZXZlbjogZmFsc2UsXG4gICAgICB9LFxuICAgICAgaW5kZXgsXG4gICAgfTtcbiAgfVxufVxuIl19