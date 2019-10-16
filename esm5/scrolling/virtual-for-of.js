/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { ArrayDataSource, isDataSource, } from '@angular/cdk/collections';
import { Directive, Input, IterableDiffers, NgZone, SkipSelf, TemplateRef, ViewContainerRef, } from '@angular/core';
import { Observable, Subject, of as observableOf } from 'rxjs';
import { pairwise, shareReplay, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { CdkVirtualScrollViewport } from './virtual-scroll-viewport';
/** Helper to extract size from a DOM Node. */
function getSize(orientation, node) {
    var el = node;
    if (!el.getBoundingClientRect) {
        return 0;
    }
    var rect = el.getBoundingClientRect();
    return orientation == 'horizontal' ? rect.width : rect.height;
}
/**
 * A directive similar to `ngForOf` to be used for rendering data inside a virtual scrolling
 * container.
 */
var CdkVirtualForOf = /** @class */ (function () {
    function CdkVirtualForOf(
    /** The view container to add items to. */
    _viewContainerRef, 
    /** The template to use when stamping out new items. */
    _template, 
    /** The set of available differs. */
    _differs, 
    /** The virtual scrolling viewport that these items are being rendered in. */
    _viewport, ngZone) {
        var _this = this;
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
        switchMap(function (_a) {
            var _b = tslib_1.__read(_a, 2), prev = _b[0], cur = _b[1];
            return _this._changeDataSource(prev, cur);
        }), 
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
        this.dataStream.subscribe(function (data) {
            _this._data = data;
            _this._onRenderedDataChange();
        });
        this._viewport.renderedRangeStream.pipe(takeUntil(this._destroyed)).subscribe(function (range) {
            _this._renderedRange = range;
            ngZone.run(function () { return _this.viewChange.next(_this._renderedRange); });
            _this._onRenderedDataChange();
        });
        this._viewport.attach(this);
    }
    Object.defineProperty(CdkVirtualForOf.prototype, "cdkVirtualForOf", {
        /** The DataSource to display. */
        get: function () {
            return this._cdkVirtualForOf;
        },
        set: function (value) {
            this._cdkVirtualForOf = value;
            var ds = isDataSource(value) ? value :
                // Slice the value if its an NgIterable to ensure we're working with an array.
                new ArrayDataSource(value instanceof Observable ? value : Array.prototype.slice.call(value || []));
            this._dataSourceChanges.next(ds);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CdkVirtualForOf.prototype, "cdkVirtualForTrackBy", {
        /**
         * The `TrackByFunction` to use for tracking changes. The `TrackByFunction` takes the index and
         * the item and produces a value to be used as the item's identity when tracking changes.
         */
        get: function () {
            return this._cdkVirtualForTrackBy;
        },
        set: function (fn) {
            var _this = this;
            this._needsUpdate = true;
            this._cdkVirtualForTrackBy = fn ?
                function (index, item) { return fn(index + (_this._renderedRange ? _this._renderedRange.start : 0), item); } :
                undefined;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CdkVirtualForOf.prototype, "cdkVirtualForTemplate", {
        /** The template used to stamp out new elements. */
        set: function (value) {
            if (value) {
                this._needsUpdate = true;
                this._template = value;
            }
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Measures the combined size (width for horizontal orientation, height for vertical) of all items
     * in the specified range. Throws an error if the range includes items that are not currently
     * rendered.
     */
    CdkVirtualForOf.prototype.measureRangeSize = function (range, orientation) {
        if (range.start >= range.end) {
            return 0;
        }
        if (range.start < this._renderedRange.start || range.end > this._renderedRange.end) {
            throw Error("Error: attempted to measure an item that isn't rendered.");
        }
        // The index into the list of rendered views for the first item in the range.
        var renderedStartIndex = range.start - this._renderedRange.start;
        // The length of the range we're measuring.
        var rangeLen = range.end - range.start;
        // Loop over all root nodes for all items in the range and sum up their size.
        var totalSize = 0;
        var i = rangeLen;
        while (i--) {
            var view = this._viewContainerRef.get(i + renderedStartIndex);
            var j = view ? view.rootNodes.length : 0;
            while (j--) {
                totalSize += getSize(orientation, view.rootNodes[j]);
            }
        }
        return totalSize;
    };
    CdkVirtualForOf.prototype.ngDoCheck = function () {
        if (this._differ && this._needsUpdate) {
            // TODO(mmalerba): We should differentiate needs update due to scrolling and a new portion of
            // this list being rendered (can use simpler algorithm) vs needs update due to data actually
            // changing (need to do this diff).
            var changes = this._differ.diff(this._renderedItems);
            if (!changes) {
                this._updateContext();
            }
            else {
                this._applyChanges(changes);
            }
            this._needsUpdate = false;
        }
    };
    CdkVirtualForOf.prototype.ngOnDestroy = function () {
        var e_1, _a;
        this._viewport.detach();
        this._dataSourceChanges.next();
        this._dataSourceChanges.complete();
        this.viewChange.complete();
        this._destroyed.next();
        this._destroyed.complete();
        try {
            for (var _b = tslib_1.__values(this._templateCache), _c = _b.next(); !_c.done; _c = _b.next()) {
                var view = _c.value;
                view.destroy();
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    /** React to scroll state changes in the viewport. */
    CdkVirtualForOf.prototype._onRenderedDataChange = function () {
        if (!this._renderedRange) {
            return;
        }
        this._renderedItems = this._data.slice(this._renderedRange.start, this._renderedRange.end);
        if (!this._differ) {
            this._differ = this._differs.find(this._renderedItems).create(this.cdkVirtualForTrackBy);
        }
        this._needsUpdate = true;
    };
    /** Swap out one `DataSource` for another. */
    CdkVirtualForOf.prototype._changeDataSource = function (oldDs, newDs) {
        if (oldDs) {
            oldDs.disconnect(this);
        }
        this._needsUpdate = true;
        return newDs ? newDs.connect(this) : observableOf();
    };
    /** Update the `CdkVirtualForOfContext` for all views. */
    CdkVirtualForOf.prototype._updateContext = function () {
        var count = this._data.length;
        var i = this._viewContainerRef.length;
        while (i--) {
            var view = this._viewContainerRef.get(i);
            view.context.index = this._renderedRange.start + i;
            view.context.count = count;
            this._updateComputedContextProperties(view.context);
            view.detectChanges();
        }
    };
    /** Apply changes to the DOM. */
    CdkVirtualForOf.prototype._applyChanges = function (changes) {
        var _this = this;
        // Rearrange the views to put them in the right location.
        changes.forEachOperation(function (record, adjustedPreviousIndex, currentIndex) {
            if (record.previousIndex == null) { // Item added.
                var view = _this._insertViewForNewItem(currentIndex);
                view.context.$implicit = record.item;
            }
            else if (currentIndex == null) { // Item removed.
                _this._cacheView(_this._detachView(adjustedPreviousIndex));
            }
            else { // Item moved.
                var view = _this._viewContainerRef.get(adjustedPreviousIndex);
                _this._viewContainerRef.move(view, currentIndex);
                view.context.$implicit = record.item;
            }
        });
        // Update $implicit for any items that had an identity change.
        changes.forEachIdentityChange(function (record) {
            var view = _this._viewContainerRef.get(record.currentIndex);
            view.context.$implicit = record.item;
        });
        // Update the context variables on all items.
        var count = this._data.length;
        var i = this._viewContainerRef.length;
        while (i--) {
            var view = this._viewContainerRef.get(i);
            view.context.index = this._renderedRange.start + i;
            view.context.count = count;
            this._updateComputedContextProperties(view.context);
        }
    };
    /** Cache the given detached view. */
    CdkVirtualForOf.prototype._cacheView = function (view) {
        if (this._templateCache.length < this.cdkVirtualForTemplateCacheSize) {
            this._templateCache.push(view);
        }
        else {
            var index = this._viewContainerRef.indexOf(view);
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
    };
    /** Inserts a view for a new item, either from the cache or by creating a new one. */
    CdkVirtualForOf.prototype._insertViewForNewItem = function (index) {
        return this._insertViewFromCache(index) || this._createEmbeddedViewAt(index);
    };
    /** Update the computed properties on the `CdkVirtualForOfContext`. */
    CdkVirtualForOf.prototype._updateComputedContextProperties = function (context) {
        context.first = context.index === 0;
        context.last = context.index === context.count - 1;
        context.even = context.index % 2 === 0;
        context.odd = !context.even;
    };
    /** Creates a new embedded view and moves it to the given index */
    CdkVirtualForOf.prototype._createEmbeddedViewAt = function (index) {
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
    };
    /** Inserts a recycled view from the cache at the given index. */
    CdkVirtualForOf.prototype._insertViewFromCache = function (index) {
        var cachedView = this._templateCache.pop();
        if (cachedView) {
            this._viewContainerRef.insert(cachedView, index);
        }
        return cachedView || null;
    };
    /** Detaches the embedded view at the given index. */
    CdkVirtualForOf.prototype._detachView = function (index) {
        return this._viewContainerRef.detach(index);
    };
    CdkVirtualForOf.decorators = [
        { type: Directive, args: [{
                    selector: '[cdkVirtualFor][cdkVirtualForOf]',
                },] }
    ];
    /** @nocollapse */
    CdkVirtualForOf.ctorParameters = function () { return [
        { type: ViewContainerRef },
        { type: TemplateRef },
        { type: IterableDiffers },
        { type: CdkVirtualScrollViewport, decorators: [{ type: SkipSelf }] },
        { type: NgZone }
    ]; };
    CdkVirtualForOf.propDecorators = {
        cdkVirtualForOf: [{ type: Input }],
        cdkVirtualForTrackBy: [{ type: Input }],
        cdkVirtualForTemplate: [{ type: Input }],
        cdkVirtualForTemplateCacheSize: [{ type: Input }]
    };
    return CdkVirtualForOf;
}());
export { CdkVirtualForOf };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1mb3Itb2YuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy92aXJ0dWFsLWZvci1vZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUNMLGVBQWUsRUFJZixZQUFZLEdBQ2IsTUFBTSwwQkFBMEIsQ0FBQztBQUNsQyxPQUFPLEVBQ0wsU0FBUyxFQUdULEtBQUssRUFJTCxlQUFlLEVBRWYsTUFBTSxFQUVOLFFBQVEsRUFDUixXQUFXLEVBRVgsZ0JBQWdCLEdBQ2pCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLEVBQUUsSUFBSSxZQUFZLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDN0QsT0FBTyxFQUFDLFFBQVEsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN0RixPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQXdCbkUsOENBQThDO0FBQzlDLFNBQVMsT0FBTyxDQUFDLFdBQXNDLEVBQUUsSUFBVTtJQUNqRSxJQUFNLEVBQUUsR0FBRyxJQUFlLENBQUM7SUFDM0IsSUFBSSxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsRUFBRTtRQUM3QixPQUFPLENBQUMsQ0FBQztLQUNWO0lBQ0QsSUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLHFCQUFxQixFQUFFLENBQUM7SUFDeEMsT0FBTyxXQUFXLElBQUksWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQ2hFLENBQUM7QUFHRDs7O0dBR0c7QUFDSDtJQThGRTtJQUNJLDBDQUEwQztJQUNsQyxpQkFBbUM7SUFDM0MsdURBQXVEO0lBQy9DLFNBQWlEO0lB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OztJQXdRUixzQkFBQztDQUFBLEFBOVRELElBOFRDO1NBM1RZLGVBQWUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgQXJyYXlEYXRhU291cmNlLFxuICBDb2xsZWN0aW9uVmlld2VyLFxuICBEYXRhU291cmNlLFxuICBMaXN0UmFuZ2UsXG4gIGlzRGF0YVNvdXJjZSxcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvbGxlY3Rpb25zJztcbmltcG9ydCB7XG4gIERpcmVjdGl2ZSxcbiAgRG9DaGVjayxcbiAgRW1iZWRkZWRWaWV3UmVmLFxuICBJbnB1dCxcbiAgSXRlcmFibGVDaGFuZ2VSZWNvcmQsXG4gIEl0ZXJhYmxlQ2hhbmdlcyxcbiAgSXRlcmFibGVEaWZmZXIsXG4gIEl0ZXJhYmxlRGlmZmVycyxcbiAgTmdJdGVyYWJsZSxcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIFNraXBTZWxmLFxuICBUZW1wbGF0ZVJlZixcbiAgVHJhY2tCeUZ1bmN0aW9uLFxuICBWaWV3Q29udGFpbmVyUmVmLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdCwgb2YgYXMgb2JzZXJ2YWJsZU9mfSBmcm9tICdyeGpzJztcbmltcG9ydCB7cGFpcndpc2UsIHNoYXJlUmVwbGF5LCBzdGFydFdpdGgsIHN3aXRjaE1hcCwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge0Nka1ZpcnR1YWxTY3JvbGxWaWV3cG9ydH0gZnJvbSAnLi92aXJ0dWFsLXNjcm9sbC12aWV3cG9ydCc7XG5cblxuLyoqIFRoZSBjb250ZXh0IGZvciBhbiBpdGVtIHJlbmRlcmVkIGJ5IGBDZGtWaXJ0dWFsRm9yT2ZgICovXG5leHBvcnQgdHlwZSBDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+ID0ge1xuICAvKiogVGhlIGl0ZW0gdmFsdWUuICovXG4gICRpbXBsaWNpdDogVDtcbiAgLyoqIFRoZSBEYXRhU291cmNlLCBPYnNlcnZhYmxlLCBvciBOZ0l0ZXJhYmxlIHRoYXQgd2FzIHBhc3NlZCB0byAqY2RrVmlydHVhbEZvci4gKi9cbiAgY2RrVmlydHVhbEZvck9mOiBEYXRhU291cmNlPFQ+IHwgT2JzZXJ2YWJsZTxUW10+IHwgTmdJdGVyYWJsZTxUPjtcbiAgLyoqIFRoZSBpbmRleCBvZiB0aGUgaXRlbSBpbiB0aGUgRGF0YVNvdXJjZS4gKi9cbiAgaW5kZXg6IG51bWJlcjtcbiAgLyoqIFRoZSBudW1iZXIgb2YgaXRlbXMgaW4gdGhlIERhdGFTb3VyY2UuICovXG4gIGNvdW50OiBudW1iZXI7XG4gIC8qKiBXaGV0aGVyIHRoaXMgaXMgdGhlIGZpcnN0IGl0ZW0gaW4gdGhlIERhdGFTb3VyY2UuICovXG4gIGZpcnN0OiBib29sZWFuO1xuICAvKiogV2hldGhlciB0aGlzIGlzIHRoZSBsYXN0IGl0ZW0gaW4gdGhlIERhdGFTb3VyY2UuICovXG4gIGxhc3Q6IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIHRoZSBpbmRleCBpcyBldmVuLiAqL1xuICBldmVuOiBib29sZWFuO1xuICAvKiogV2hldGhlciB0aGUgaW5kZXggaXMgb2RkLiAqL1xuICBvZGQ6IGJvb2xlYW47XG59O1xuXG5cbi8qKiBIZWxwZXIgdG8gZXh0cmFjdCBzaXplIGZyb20gYSBET00gTm9kZS4gKi9cbmZ1bmN0aW9uIGdldFNpemUob3JpZW50YXRpb246ICdob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCcsIG5vZGU6IE5vZGUpOiBudW1iZXIge1xuICBjb25zdCBlbCA9IG5vZGUgYXMgRWxlbWVudDtcbiAgaWYgKCFlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuICBjb25zdCByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIHJldHVybiBvcmllbnRhdGlvbiA9PSAnaG9yaXpvbnRhbCcgPyByZWN0LndpZHRoIDogcmVjdC5oZWlnaHQ7XG59XG5cblxuLyoqXG4gKiBBIGRpcmVjdGl2ZSBzaW1pbGFyIHRvIGBuZ0Zvck9mYCB0byBiZSB1c2VkIGZvciByZW5kZXJpbmcgZGF0YSBpbnNpZGUgYSB2aXJ0dWFsIHNjcm9sbGluZ1xuICogY29udGFpbmVyLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrVmlydHVhbEZvcl1bY2RrVmlydHVhbEZvck9mXScsXG59KVxuZXhwb3J0IGNsYXNzIENka1ZpcnR1YWxGb3JPZjxUPiBpbXBsZW1lbnRzIENvbGxlY3Rpb25WaWV3ZXIsIERvQ2hlY2ssIE9uRGVzdHJveSB7XG4gIC8qKiBFbWl0cyB3aGVuIHRoZSByZW5kZXJlZCB2aWV3IG9mIHRoZSBkYXRhIGNoYW5nZXMuICovXG4gIHZpZXdDaGFuZ2UgPSBuZXcgU3ViamVjdDxMaXN0UmFuZ2U+KCk7XG5cbiAgLyoqIFN1YmplY3QgdGhhdCBlbWl0cyB3aGVuIGEgbmV3IERhdGFTb3VyY2UgaW5zdGFuY2UgaXMgZ2l2ZW4uICovXG4gIHByaXZhdGUgX2RhdGFTb3VyY2VDaGFuZ2VzID0gbmV3IFN1YmplY3Q8RGF0YVNvdXJjZTxUPj4oKTtcblxuICAvKiogVGhlIERhdGFTb3VyY2UgdG8gZGlzcGxheS4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGNka1ZpcnR1YWxGb3JPZigpOiBEYXRhU291cmNlPFQ+IHwgT2JzZXJ2YWJsZTxUW10+IHwgTmdJdGVyYWJsZTxUPiB8IG51bGwgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9jZGtWaXJ0dWFsRm9yT2Y7XG4gIH1cbiAgc2V0IGNka1ZpcnR1YWxGb3JPZih2YWx1ZTogRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8VFtdPiB8IE5nSXRlcmFibGU8VD4gfCBudWxsIHwgdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5fY2RrVmlydHVhbEZvck9mID0gdmFsdWU7XG4gICAgY29uc3QgZHMgPSBpc0RhdGFTb3VyY2UodmFsdWUpID8gdmFsdWUgOlxuICAgICAgICAvLyBTbGljZSB0aGUgdmFsdWUgaWYgaXRzIGFuIE5nSXRlcmFibGUgdG8gZW5zdXJlIHdlJ3JlIHdvcmtpbmcgd2l0aCBhbiBhcnJheS5cbiAgICAgICAgbmV3IEFycmF5RGF0YVNvdXJjZTxUPihcbiAgICAgICAgICAgIHZhbHVlIGluc3RhbmNlb2YgT2JzZXJ2YWJsZSA/IHZhbHVlIDogQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwodmFsdWUgfHwgW10pKTtcbiAgICB0aGlzLl9kYXRhU291cmNlQ2hhbmdlcy5uZXh0KGRzKTtcbiAgfVxuICBfY2RrVmlydHVhbEZvck9mOiBEYXRhU291cmNlPFQ+IHwgT2JzZXJ2YWJsZTxUW10+IHwgTmdJdGVyYWJsZTxUPiB8IG51bGwgfCB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFRoZSBgVHJhY2tCeUZ1bmN0aW9uYCB0byB1c2UgZm9yIHRyYWNraW5nIGNoYW5nZXMuIFRoZSBgVHJhY2tCeUZ1bmN0aW9uYCB0YWtlcyB0aGUgaW5kZXggYW5kXG4gICAqIHRoZSBpdGVtIGFuZCBwcm9kdWNlcyBhIHZhbHVlIHRvIGJlIHVzZWQgYXMgdGhlIGl0ZW0ncyBpZGVudGl0eSB3aGVuIHRyYWNraW5nIGNoYW5nZXMuXG4gICAqL1xuICBASW5wdXQoKVxuICBnZXQgY2RrVmlydHVhbEZvclRyYWNrQnkoKTogVHJhY2tCeUZ1bmN0aW9uPFQ+IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fY2RrVmlydHVhbEZvclRyYWNrQnk7XG4gIH1cbiAgc2V0IGNka1ZpcnR1YWxGb3JUcmFja0J5KGZuOiBUcmFja0J5RnVuY3Rpb248VD4gfCB1bmRlZmluZWQpIHtcbiAgICB0aGlzLl9uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgdGhpcy5fY2RrVmlydHVhbEZvclRyYWNrQnkgPSBmbiA/XG4gICAgICAgIChpbmRleCwgaXRlbSkgPT4gZm4oaW5kZXggKyAodGhpcy5fcmVuZGVyZWRSYW5nZSA/IHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQgOiAwKSwgaXRlbSkgOlxuICAgICAgICB1bmRlZmluZWQ7XG4gIH1cbiAgcHJpdmF0ZSBfY2RrVmlydHVhbEZvclRyYWNrQnk6IFRyYWNrQnlGdW5jdGlvbjxUPiB8IHVuZGVmaW5lZDtcblxuICAvKiogVGhlIHRlbXBsYXRlIHVzZWQgdG8gc3RhbXAgb3V0IG5ldyBlbGVtZW50cy4gKi9cbiAgQElucHV0KClcbiAgc2V0IGNka1ZpcnR1YWxGb3JUZW1wbGF0ZSh2YWx1ZTogVGVtcGxhdGVSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj4pIHtcbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIHRoaXMuX25lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICAgIHRoaXMuX3RlbXBsYXRlID0gdmFsdWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBzaXplIG9mIHRoZSBjYWNoZSB1c2VkIHRvIHN0b3JlIHRlbXBsYXRlcyB0aGF0IGFyZSBub3QgYmVpbmcgdXNlZCBmb3IgcmUtdXNlIGxhdGVyLlxuICAgKiBTZXR0aW5nIHRoZSBjYWNoZSBzaXplIHRvIGAwYCB3aWxsIGRpc2FibGUgY2FjaGluZy4gRGVmYXVsdHMgdG8gMjAgdGVtcGxhdGVzLlxuICAgKi9cbiAgQElucHV0KCkgY2RrVmlydHVhbEZvclRlbXBsYXRlQ2FjaGVTaXplOiBudW1iZXIgPSAyMDtcblxuICAvKiogRW1pdHMgd2hlbmV2ZXIgdGhlIGRhdGEgaW4gdGhlIGN1cnJlbnQgRGF0YVNvdXJjZSBjaGFuZ2VzLiAqL1xuICBkYXRhU3RyZWFtOiBPYnNlcnZhYmxlPFRbXSB8IFJlYWRvbmx5QXJyYXk8VD4+ID0gdGhpcy5fZGF0YVNvdXJjZUNoYW5nZXNcbiAgICAgIC5waXBlKFxuICAgICAgICAgIC8vIFN0YXJ0IG9mZiB3aXRoIG51bGwgYERhdGFTb3VyY2VgLlxuICAgICAgICAgIHN0YXJ0V2l0aChudWxsISksXG4gICAgICAgICAgLy8gQnVuZGxlIHVwIHRoZSBwcmV2aW91cyBhbmQgY3VycmVudCBkYXRhIHNvdXJjZXMgc28gd2UgY2FuIHdvcmsgd2l0aCBib3RoLlxuICAgICAgICAgIHBhaXJ3aXNlKCksXG4gICAgICAgICAgLy8gVXNlIGBfY2hhbmdlRGF0YVNvdXJjZWAgdG8gZGlzY29ubmVjdCBmcm9tIHRoZSBwcmV2aW91cyBkYXRhIHNvdXJjZSBhbmQgY29ubmVjdCB0byB0aGVcbiAgICAgICAgICAvLyBuZXcgb25lLCBwYXNzaW5nIGJhY2sgYSBzdHJlYW0gb2YgZGF0YSBjaGFuZ2VzIHdoaWNoIHdlIHJ1biB0aHJvdWdoIGBzd2l0Y2hNYXBgIHRvIGdpdmVcbiAgICAgICAgICAvLyB1cyBhIGRhdGEgc3RyZWFtIHRoYXQgZW1pdHMgdGhlIGxhdGVzdCBkYXRhIGZyb20gd2hhdGV2ZXIgdGhlIGN1cnJlbnQgYERhdGFTb3VyY2VgIGlzLlxuICAgICAgICAgIHN3aXRjaE1hcCgoW3ByZXYsIGN1cl0pID0+IHRoaXMuX2NoYW5nZURhdGFTb3VyY2UocHJldiwgY3VyKSksXG4gICAgICAgICAgLy8gUmVwbGF5IHRoZSBsYXN0IGVtaXR0ZWQgZGF0YSB3aGVuIHNvbWVvbmUgc3Vic2NyaWJlcy5cbiAgICAgICAgICBzaGFyZVJlcGxheSgxKSk7XG5cbiAgLyoqIFRoZSBkaWZmZXIgdXNlZCB0byBjYWxjdWxhdGUgY2hhbmdlcyB0byB0aGUgZGF0YS4gKi9cbiAgcHJpdmF0ZSBfZGlmZmVyOiBJdGVyYWJsZURpZmZlcjxUPiB8IG51bGwgPSBudWxsO1xuXG4gIC8qKiBUaGUgbW9zdCByZWNlbnQgZGF0YSBlbWl0dGVkIGZyb20gdGhlIERhdGFTb3VyY2UuICovXG4gIHByaXZhdGUgX2RhdGE6IFRbXSB8IFJlYWRvbmx5QXJyYXk8VD47XG5cbiAgLyoqIFRoZSBjdXJyZW50bHkgcmVuZGVyZWQgaXRlbXMuICovXG4gIHByaXZhdGUgX3JlbmRlcmVkSXRlbXM6IFRbXTtcblxuICAvKiogVGhlIGN1cnJlbnRseSByZW5kZXJlZCByYW5nZSBvZiBpbmRpY2VzLiAqL1xuICBwcml2YXRlIF9yZW5kZXJlZFJhbmdlOiBMaXN0UmFuZ2U7XG5cbiAgLyoqXG4gICAqIFRoZSB0ZW1wbGF0ZSBjYWNoZSB1c2VkIHRvIGhvbGQgb24gb3QgdGVtcGxhdGUgaW5zdGFuY2VzcyB0aGF0IGhhdmUgYmVlbiBzdGFtcGVkIG91dCwgYnV0IGRvbid0XG4gICAqIGN1cnJlbnRseSBuZWVkIHRvIGJlIHJlbmRlcmVkLiBUaGVzZSBpbnN0YW5jZXMgd2lsbCBiZSByZXVzZWQgaW4gdGhlIGZ1dHVyZSByYXRoZXIgdGhhblxuICAgKiBzdGFtcGluZyBvdXQgYnJhbmQgbmV3IG9uZXMuXG4gICAqL1xuICBwcml2YXRlIF90ZW1wbGF0ZUNhY2hlOiBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj5bXSA9IFtdO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSByZW5kZXJlZCBkYXRhIHNob3VsZCBiZSB1cGRhdGVkIGR1cmluZyB0aGUgbmV4dCBuZ0RvQ2hlY2sgY3ljbGUuICovXG4gIHByaXZhdGUgX25lZWRzVXBkYXRlID0gZmFsc2U7XG5cbiAgcHJpdmF0ZSBfZGVzdHJveWVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKiBUaGUgdmlldyBjb250YWluZXIgdG8gYWRkIGl0ZW1zIHRvLiAqL1xuICAgICAgcHJpdmF0ZSBfdmlld0NvbnRhaW5lclJlZjogVmlld0NvbnRhaW5lclJlZixcbiAgICAgIC8qKiBUaGUgdGVtcGxhdGUgdG8gdXNlIHdoZW4gc3RhbXBpbmcgb3V0IG5ldyBpdGVtcy4gKi9cbiAgICAgIHByaXZhdGUgX3RlbXBsYXRlOiBUZW1wbGF0ZVJlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PixcbiAgICAgIC8qKiBUaGUgc2V0IG9mIGF2YWlsYWJsZSBkaWZmZXJzLiAqL1xuICAgICAgcHJpdmF0ZSBfZGlmZmVyczogSXRlcmFibGVEaWZmZXJzLFxuICAgICAgLyoqIFRoZSB2aXJ0dWFsIHNjcm9sbGluZyB2aWV3cG9ydCB0aGF0IHRoZXNlIGl0ZW1zIGFyZSBiZWluZyByZW5kZXJlZCBpbi4gKi9cbiAgICAgIEBTa2lwU2VsZigpIHByaXZhdGUgX3ZpZXdwb3J0OiBDZGtWaXJ0dWFsU2Nyb2xsVmlld3BvcnQsXG4gICAgICBuZ1pvbmU6IE5nWm9uZSkge1xuICAgIHRoaXMuZGF0YVN0cmVhbS5zdWJzY3JpYmUoZGF0YSA9PiB7XG4gICAgICB0aGlzLl9kYXRhID0gZGF0YTtcbiAgICAgIHRoaXMuX29uUmVuZGVyZWREYXRhQ2hhbmdlKCk7XG4gICAgfSk7XG4gICAgdGhpcy5fdmlld3BvcnQucmVuZGVyZWRSYW5nZVN0cmVhbS5waXBlKHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpKS5zdWJzY3JpYmUocmFuZ2UgPT4ge1xuICAgICAgdGhpcy5fcmVuZGVyZWRSYW5nZSA9IHJhbmdlO1xuICAgICAgbmdab25lLnJ1bigoKSA9PiB0aGlzLnZpZXdDaGFuZ2UubmV4dCh0aGlzLl9yZW5kZXJlZFJhbmdlKSk7XG4gICAgICB0aGlzLl9vblJlbmRlcmVkRGF0YUNoYW5nZSgpO1xuICAgIH0pO1xuICAgIHRoaXMuX3ZpZXdwb3J0LmF0dGFjaCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNZWFzdXJlcyB0aGUgY29tYmluZWQgc2l6ZSAod2lkdGggZm9yIGhvcml6b250YWwgb3JpZW50YXRpb24sIGhlaWdodCBmb3IgdmVydGljYWwpIG9mIGFsbCBpdGVtc1xuICAgKiBpbiB0aGUgc3BlY2lmaWVkIHJhbmdlLiBUaHJvd3MgYW4gZXJyb3IgaWYgdGhlIHJhbmdlIGluY2x1ZGVzIGl0ZW1zIHRoYXQgYXJlIG5vdCBjdXJyZW50bHlcbiAgICogcmVuZGVyZWQuXG4gICAqL1xuICBtZWFzdXJlUmFuZ2VTaXplKHJhbmdlOiBMaXN0UmFuZ2UsIG9yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcgfCAndmVydGljYWwnKTogbnVtYmVyIHtcbiAgICBpZiAocmFuZ2Uuc3RhcnQgPj0gcmFuZ2UuZW5kKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgaWYgKHJhbmdlLnN0YXJ0IDwgdGhpcy5fcmVuZGVyZWRSYW5nZS5zdGFydCB8fCByYW5nZS5lbmQgPiB0aGlzLl9yZW5kZXJlZFJhbmdlLmVuZCkge1xuICAgICAgdGhyb3cgRXJyb3IoYEVycm9yOiBhdHRlbXB0ZWQgdG8gbWVhc3VyZSBhbiBpdGVtIHRoYXQgaXNuJ3QgcmVuZGVyZWQuYCk7XG4gICAgfVxuXG4gICAgLy8gVGhlIGluZGV4IGludG8gdGhlIGxpc3Qgb2YgcmVuZGVyZWQgdmlld3MgZm9yIHRoZSBmaXJzdCBpdGVtIGluIHRoZSByYW5nZS5cbiAgICBjb25zdCByZW5kZXJlZFN0YXJ0SW5kZXggPSByYW5nZS5zdGFydCAtIHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQ7XG4gICAgLy8gVGhlIGxlbmd0aCBvZiB0aGUgcmFuZ2Ugd2UncmUgbWVhc3VyaW5nLlxuICAgIGNvbnN0IHJhbmdlTGVuID0gcmFuZ2UuZW5kIC0gcmFuZ2Uuc3RhcnQ7XG5cbiAgICAvLyBMb29wIG92ZXIgYWxsIHJvb3Qgbm9kZXMgZm9yIGFsbCBpdGVtcyBpbiB0aGUgcmFuZ2UgYW5kIHN1bSB1cCB0aGVpciBzaXplLlxuICAgIGxldCB0b3RhbFNpemUgPSAwO1xuICAgIGxldCBpID0gcmFuZ2VMZW47XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgY29uc3QgdmlldyA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuZ2V0KGkgKyByZW5kZXJlZFN0YXJ0SW5kZXgpIGFzXG4gICAgICAgICAgRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+IHwgbnVsbDtcbiAgICAgIGxldCBqID0gdmlldyA/IHZpZXcucm9vdE5vZGVzLmxlbmd0aCA6IDA7XG4gICAgICB3aGlsZSAoai0tKSB7XG4gICAgICAgIHRvdGFsU2l6ZSArPSBnZXRTaXplKG9yaWVudGF0aW9uLCB2aWV3IS5yb290Tm9kZXNbal0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0b3RhbFNpemU7XG4gIH1cblxuICBuZ0RvQ2hlY2soKSB7XG4gICAgaWYgKHRoaXMuX2RpZmZlciAmJiB0aGlzLl9uZWVkc1VwZGF0ZSkge1xuICAgICAgLy8gVE9ETyhtbWFsZXJiYSk6IFdlIHNob3VsZCBkaWZmZXJlbnRpYXRlIG5lZWRzIHVwZGF0ZSBkdWUgdG8gc2Nyb2xsaW5nIGFuZCBhIG5ldyBwb3J0aW9uIG9mXG4gICAgICAvLyB0aGlzIGxpc3QgYmVpbmcgcmVuZGVyZWQgKGNhbiB1c2Ugc2ltcGxlciBhbGdvcml0aG0pIHZzIG5lZWRzIHVwZGF0ZSBkdWUgdG8gZGF0YSBhY3R1YWxseVxuICAgICAgLy8gY2hhbmdpbmcgKG5lZWQgdG8gZG8gdGhpcyBkaWZmKS5cbiAgICAgIGNvbnN0IGNoYW5nZXMgPSB0aGlzLl9kaWZmZXIuZGlmZih0aGlzLl9yZW5kZXJlZEl0ZW1zKTtcbiAgICAgIGlmICghY2hhbmdlcykge1xuICAgICAgICB0aGlzLl91cGRhdGVDb250ZXh0KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9hcHBseUNoYW5nZXMoY2hhbmdlcyk7XG4gICAgICB9XG4gICAgICB0aGlzLl9uZWVkc1VwZGF0ZSA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX3ZpZXdwb3J0LmRldGFjaCgpO1xuXG4gICAgdGhpcy5fZGF0YVNvdXJjZUNoYW5nZXMubmV4dCgpO1xuICAgIHRoaXMuX2RhdGFTb3VyY2VDaGFuZ2VzLmNvbXBsZXRlKCk7XG4gICAgdGhpcy52aWV3Q2hhbmdlLmNvbXBsZXRlKCk7XG5cbiAgICB0aGlzLl9kZXN0cm95ZWQubmV4dCgpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5jb21wbGV0ZSgpO1xuXG4gICAgZm9yIChsZXQgdmlldyBvZiB0aGlzLl90ZW1wbGF0ZUNhY2hlKSB7XG4gICAgICB2aWV3LmRlc3Ryb3koKTtcbiAgICB9XG4gIH1cblxuICAvKiogUmVhY3QgdG8gc2Nyb2xsIHN0YXRlIGNoYW5nZXMgaW4gdGhlIHZpZXdwb3J0LiAqL1xuICBwcml2YXRlIF9vblJlbmRlcmVkRGF0YUNoYW5nZSgpIHtcbiAgICBpZiAoIXRoaXMuX3JlbmRlcmVkUmFuZ2UpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fcmVuZGVyZWRJdGVtcyA9IHRoaXMuX2RhdGEuc2xpY2UodGhpcy5fcmVuZGVyZWRSYW5nZS5zdGFydCwgdGhpcy5fcmVuZGVyZWRSYW5nZS5lbmQpO1xuICAgIGlmICghdGhpcy5fZGlmZmVyKSB7XG4gICAgICB0aGlzLl9kaWZmZXIgPSB0aGlzLl9kaWZmZXJzLmZpbmQodGhpcy5fcmVuZGVyZWRJdGVtcykuY3JlYXRlKHRoaXMuY2RrVmlydHVhbEZvclRyYWNrQnkpO1xuICAgIH1cbiAgICB0aGlzLl9uZWVkc1VwZGF0ZSA9IHRydWU7XG4gIH1cblxuICAvKiogU3dhcCBvdXQgb25lIGBEYXRhU291cmNlYCBmb3IgYW5vdGhlci4gKi9cbiAgcHJpdmF0ZSBfY2hhbmdlRGF0YVNvdXJjZShvbGREczogRGF0YVNvdXJjZTxUPiB8IG51bGwsIG5ld0RzOiBEYXRhU291cmNlPFQ+IHwgbnVsbCk6XG4gICAgT2JzZXJ2YWJsZTxUW10gfCBSZWFkb25seUFycmF5PFQ+PiB7XG5cbiAgICBpZiAob2xkRHMpIHtcbiAgICAgIG9sZERzLmRpc2Nvbm5lY3QodGhpcyk7XG4gICAgfVxuXG4gICAgdGhpcy5fbmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgIHJldHVybiBuZXdEcyA/IG5ld0RzLmNvbm5lY3QodGhpcykgOiBvYnNlcnZhYmxlT2YoKTtcbiAgfVxuXG4gIC8qKiBVcGRhdGUgdGhlIGBDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0YCBmb3IgYWxsIHZpZXdzLiAqL1xuICBwcml2YXRlIF91cGRhdGVDb250ZXh0KCkge1xuICAgIGNvbnN0IGNvdW50ID0gdGhpcy5fZGF0YS5sZW5ndGg7XG4gICAgbGV0IGkgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICBsZXQgdmlldyA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuZ2V0KGkpIGFzIEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PjtcbiAgICAgIHZpZXcuY29udGV4dC5pbmRleCA9IHRoaXMuX3JlbmRlcmVkUmFuZ2Uuc3RhcnQgKyBpO1xuICAgICAgdmlldy5jb250ZXh0LmNvdW50ID0gY291bnQ7XG4gICAgICB0aGlzLl91cGRhdGVDb21wdXRlZENvbnRleHRQcm9wZXJ0aWVzKHZpZXcuY29udGV4dCk7XG4gICAgICB2aWV3LmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gIH1cblxuICAvKiogQXBwbHkgY2hhbmdlcyB0byB0aGUgRE9NLiAqL1xuICBwcml2YXRlIF9hcHBseUNoYW5nZXMoY2hhbmdlczogSXRlcmFibGVDaGFuZ2VzPFQ+KSB7XG4gICAgLy8gUmVhcnJhbmdlIHRoZSB2aWV3cyB0byBwdXQgdGhlbSBpbiB0aGUgcmlnaHQgbG9jYXRpb24uXG4gICAgY2hhbmdlcy5mb3JFYWNoT3BlcmF0aW9uKChyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFQ+LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRqdXN0ZWRQcmV2aW91c0luZGV4OiBudW1iZXIgfCBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudEluZGV4OiBudW1iZXIgfCBudWxsKSA9PiB7XG4gICAgICBpZiAocmVjb3JkLnByZXZpb3VzSW5kZXggPT0gbnVsbCkgeyAgLy8gSXRlbSBhZGRlZC5cbiAgICAgICAgY29uc3QgdmlldyA9IHRoaXMuX2luc2VydFZpZXdGb3JOZXdJdGVtKGN1cnJlbnRJbmRleCEpO1xuICAgICAgICB2aWV3LmNvbnRleHQuJGltcGxpY2l0ID0gcmVjb3JkLml0ZW07XG4gICAgICB9IGVsc2UgaWYgKGN1cnJlbnRJbmRleCA9PSBudWxsKSB7ICAvLyBJdGVtIHJlbW92ZWQuXG4gICAgICAgIHRoaXMuX2NhY2hlVmlldyh0aGlzLl9kZXRhY2hWaWV3KGFkanVzdGVkUHJldmlvdXNJbmRleCAhKSk7XG4gICAgICB9IGVsc2UgeyAgLy8gSXRlbSBtb3ZlZC5cbiAgICAgICAgY29uc3QgdmlldyA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuZ2V0KGFkanVzdGVkUHJldmlvdXNJbmRleCEpIGFzXG4gICAgICAgICAgICBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj47XG4gICAgICAgIHRoaXMuX3ZpZXdDb250YWluZXJSZWYubW92ZSh2aWV3LCBjdXJyZW50SW5kZXgpO1xuICAgICAgICB2aWV3LmNvbnRleHQuJGltcGxpY2l0ID0gcmVjb3JkLml0ZW07XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBVcGRhdGUgJGltcGxpY2l0IGZvciBhbnkgaXRlbXMgdGhhdCBoYWQgYW4gaWRlbnRpdHkgY2hhbmdlLlxuICAgIGNoYW5nZXMuZm9yRWFjaElkZW50aXR5Q2hhbmdlKChyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFQ+KSA9PiB7XG4gICAgICBjb25zdCB2aWV3ID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5nZXQocmVjb3JkLmN1cnJlbnRJbmRleCEpIGFzXG4gICAgICAgICAgRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+O1xuICAgICAgdmlldy5jb250ZXh0LiRpbXBsaWNpdCA9IHJlY29yZC5pdGVtO1xuICAgIH0pO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBjb250ZXh0IHZhcmlhYmxlcyBvbiBhbGwgaXRlbXMuXG4gICAgY29uc3QgY291bnQgPSB0aGlzLl9kYXRhLmxlbmd0aDtcbiAgICBsZXQgaSA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmdldChpKSBhcyBFbWJlZGRlZFZpZXdSZWY8Q2RrVmlydHVhbEZvck9mQ29udGV4dDxUPj47XG4gICAgICB2aWV3LmNvbnRleHQuaW5kZXggPSB0aGlzLl9yZW5kZXJlZFJhbmdlLnN0YXJ0ICsgaTtcbiAgICAgIHZpZXcuY29udGV4dC5jb3VudCA9IGNvdW50O1xuICAgICAgdGhpcy5fdXBkYXRlQ29tcHV0ZWRDb250ZXh0UHJvcGVydGllcyh2aWV3LmNvbnRleHQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDYWNoZSB0aGUgZ2l2ZW4gZGV0YWNoZWQgdmlldy4gKi9cbiAgcHJpdmF0ZSBfY2FjaGVWaWV3KHZpZXc6IEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+Pikge1xuICAgIGlmICh0aGlzLl90ZW1wbGF0ZUNhY2hlLmxlbmd0aCA8IHRoaXMuY2RrVmlydHVhbEZvclRlbXBsYXRlQ2FjaGVTaXplKSB7XG4gICAgICB0aGlzLl90ZW1wbGF0ZUNhY2hlLnB1c2godmlldyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5pbmRleE9mKHZpZXcpO1xuXG4gICAgICAvLyBJdCdzIHZlcnkgdW5saWtlbHkgdGhhdCB0aGUgaW5kZXggd2lsbCBldmVyIGJlIC0xLCBidXQganVzdCBpbiBjYXNlLFxuICAgICAgLy8gZGVzdHJveSB0aGUgdmlldyBvbiBpdHMgb3duLCBvdGhlcndpc2UgZGVzdHJveSBpdCB0aHJvdWdoIHRoZVxuICAgICAgLy8gY29udGFpbmVyIHRvIGVuc3VyZSB0aGF0IGFsbCB0aGUgcmVmZXJlbmNlcyBhcmUgcmVtb3ZlZC5cbiAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgdmlldy5kZXN0cm95KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl92aWV3Q29udGFpbmVyUmVmLnJlbW92ZShpbmRleCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIEluc2VydHMgYSB2aWV3IGZvciBhIG5ldyBpdGVtLCBlaXRoZXIgZnJvbSB0aGUgY2FjaGUgb3IgYnkgY3JlYXRpbmcgYSBuZXcgb25lLiAqL1xuICBwcml2YXRlIF9pbnNlcnRWaWV3Rm9yTmV3SXRlbShpbmRleDogbnVtYmVyKTogRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+IHtcbiAgICByZXR1cm4gdGhpcy5faW5zZXJ0Vmlld0Zyb21DYWNoZShpbmRleCkgfHwgdGhpcy5fY3JlYXRlRW1iZWRkZWRWaWV3QXQoaW5kZXgpO1xuICB9XG5cbiAgLyoqIFVwZGF0ZSB0aGUgY29tcHV0ZWQgcHJvcGVydGllcyBvbiB0aGUgYENka1ZpcnR1YWxGb3JPZkNvbnRleHRgLiAqL1xuICBwcml2YXRlIF91cGRhdGVDb21wdXRlZENvbnRleHRQcm9wZXJ0aWVzKGNvbnRleHQ6IENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8YW55Pikge1xuICAgIGNvbnRleHQuZmlyc3QgPSBjb250ZXh0LmluZGV4ID09PSAwO1xuICAgIGNvbnRleHQubGFzdCA9IGNvbnRleHQuaW5kZXggPT09IGNvbnRleHQuY291bnQgLSAxO1xuICAgIGNvbnRleHQuZXZlbiA9IGNvbnRleHQuaW5kZXggJSAyID09PSAwO1xuICAgIGNvbnRleHQub2RkID0gIWNvbnRleHQuZXZlbjtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbmV3IGVtYmVkZGVkIHZpZXcgYW5kIG1vdmVzIGl0IHRvIHRoZSBnaXZlbiBpbmRleCAqL1xuICBwcml2YXRlIF9jcmVhdGVFbWJlZGRlZFZpZXdBdChpbmRleDogbnVtYmVyKTogRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+IHtcbiAgICAvLyBOb3RlIHRoYXQgaXQncyBpbXBvcnRhbnQgdGhhdCB3ZSBpbnNlcnQgdGhlIGl0ZW0gZGlyZWN0bHkgYXQgdGhlIHByb3BlciBpbmRleCxcbiAgICAvLyByYXRoZXIgdGhhbiBpbnNlcnRpbmcgaXQgYW5kIHRoZSBtb3ZpbmcgaXQgaW4gcGxhY2UsIGJlY2F1c2UgaWYgdGhlcmUncyBhIGRpcmVjdGl2ZVxuICAgIC8vIG9uIHRoZSBzYW1lIG5vZGUgdGhhdCBpbmplY3RzIHRoZSBgVmlld0NvbnRhaW5lclJlZmAsIEFuZ3VsYXIgd2lsbCBpbnNlcnQgYW5vdGhlclxuICAgIC8vIGNvbW1lbnQgbm9kZSB3aGljaCBjYW4gdGhyb3cgb2ZmIHRoZSBtb3ZlIHdoZW4gaXQncyBiZWluZyByZXBlYXRlZCBmb3IgYWxsIGl0ZW1zLlxuICAgIHJldHVybiB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmNyZWF0ZUVtYmVkZGVkVmlldyh0aGlzLl90ZW1wbGF0ZSwge1xuICAgICAgJGltcGxpY2l0OiBudWxsISxcbiAgICAgIC8vIEl0J3MgZ3VhcmFudGVlZCB0aGF0IHRoZSBpdGVyYWJsZSBpcyBub3QgXCJ1bmRlZmluZWRcIiBvciBcIm51bGxcIiBiZWNhdXNlIHdlIG9ubHlcbiAgICAgIC8vIGdlbmVyYXRlIHZpZXdzIGZvciBlbGVtZW50cyBpZiB0aGUgXCJjZGtWaXJ0dWFsRm9yT2ZcIiBpdGVyYWJsZSBoYXMgZWxlbWVudHMuXG4gICAgICBjZGtWaXJ0dWFsRm9yT2Y6IHRoaXMuX2Nka1ZpcnR1YWxGb3JPZiEsXG4gICAgICBpbmRleDogLTEsXG4gICAgICBjb3VudDogLTEsXG4gICAgICBmaXJzdDogZmFsc2UsXG4gICAgICBsYXN0OiBmYWxzZSxcbiAgICAgIG9kZDogZmFsc2UsXG4gICAgICBldmVuOiBmYWxzZVxuICAgIH0sIGluZGV4KTtcbiAgfVxuXG4gIC8qKiBJbnNlcnRzIGEgcmVjeWNsZWQgdmlldyBmcm9tIHRoZSBjYWNoZSBhdCB0aGUgZ2l2ZW4gaW5kZXguICovXG4gIHByaXZhdGUgX2luc2VydFZpZXdGcm9tQ2FjaGUoaW5kZXg6IG51bWJlcik6IEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PnxudWxsIHtcbiAgICBjb25zdCBjYWNoZWRWaWV3ID0gdGhpcy5fdGVtcGxhdGVDYWNoZS5wb3AoKTtcbiAgICBpZiAoY2FjaGVkVmlldykge1xuICAgICAgdGhpcy5fdmlld0NvbnRhaW5lclJlZi5pbnNlcnQoY2FjaGVkVmlldywgaW5kZXgpO1xuICAgIH1cbiAgICByZXR1cm4gY2FjaGVkVmlldyB8fCBudWxsO1xuICB9XG5cbiAgLyoqIERldGFjaGVzIHRoZSBlbWJlZGRlZCB2aWV3IGF0IHRoZSBnaXZlbiBpbmRleC4gKi9cbiAgcHJpdmF0ZSBfZGV0YWNoVmlldyhpbmRleDogbnVtYmVyKTogRW1iZWRkZWRWaWV3UmVmPENka1ZpcnR1YWxGb3JPZkNvbnRleHQ8VD4+IHtcbiAgICByZXR1cm4gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5kZXRhY2goaW5kZXgpIGFzXG4gICAgICAgIEVtYmVkZGVkVmlld1JlZjxDZGtWaXJ0dWFsRm9yT2ZDb250ZXh0PFQ+PjtcbiAgfVxufVxuIl19