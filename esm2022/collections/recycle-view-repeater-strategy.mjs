/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { _ViewRepeaterOperation, } from './view-repeater';
/**
 * A repeater that caches views when they are removed from a
 * {@link ViewContainerRef}. When new items are inserted into the container,
 * the repeater will reuse one of the cached views instead of creating a new
 * embedded view. Recycling cached views reduces the quantity of expensive DOM
 * inserts.
 *
 * @template T The type for the embedded view's $implicit property.
 * @template R The type for the item in each IterableDiffer change record.
 * @template C The type for the context passed to each embedded view.
 */
export class _RecycleViewRepeaterStrategy {
    constructor() {
        /**
         * The size of the cache used to store unused views.
         * Setting the cache size to `0` will disable caching. Defaults to 20 views.
         */
        this.viewCacheSize = 20;
        /**
         * View cache that stores embedded view instances that have been previously stamped out,
         * but don't are not currently rendered. The view repeater will reuse these views rather than
         * creating brand new ones.
         *
         * TODO(michaeljamesparsons) Investigate whether using a linked list would improve performance.
         */
        this._viewCache = [];
    }
    /** Apply changes to the DOM. */
    applyChanges(changes, viewContainerRef, itemContextFactory, itemValueResolver, itemViewChanged) {
        // Rearrange the views to put them in the right location.
        changes.forEachOperation((record, adjustedPreviousIndex, currentIndex) => {
            let view;
            let operation;
            if (record.previousIndex == null) {
                // Item added.
                const viewArgsFactory = () => itemContextFactory(record, adjustedPreviousIndex, currentIndex);
                view = this._insertView(viewArgsFactory, currentIndex, viewContainerRef, itemValueResolver(record));
                operation = view ? _ViewRepeaterOperation.INSERTED : _ViewRepeaterOperation.REPLACED;
            }
            else if (currentIndex == null) {
                // Item removed.
                this._detachAndCacheView(adjustedPreviousIndex, viewContainerRef);
                operation = _ViewRepeaterOperation.REMOVED;
            }
            else {
                // Item moved.
                view = this._moveView(adjustedPreviousIndex, currentIndex, viewContainerRef, itemValueResolver(record));
                operation = _ViewRepeaterOperation.MOVED;
            }
            if (itemViewChanged) {
                itemViewChanged({
                    context: view?.context,
                    operation,
                    record,
                });
            }
        });
    }
    detach() {
        for (const view of this._viewCache) {
            view.destroy();
        }
        this._viewCache = [];
    }
    /**
     * Inserts a view for a new item, either from the cache or by creating a new
     * one. Returns `undefined` if the item was inserted into a cached view.
     */
    _insertView(viewArgsFactory, currentIndex, viewContainerRef, value) {
        const cachedView = this._insertViewFromCache(currentIndex, viewContainerRef);
        if (cachedView) {
            cachedView.context.$implicit = value;
            return undefined;
        }
        const viewArgs = viewArgsFactory();
        return viewContainerRef.createEmbeddedView(viewArgs.templateRef, viewArgs.context, viewArgs.index);
    }
    /** Detaches the view at the given index and inserts into the view cache. */
    _detachAndCacheView(index, viewContainerRef) {
        const detachedView = viewContainerRef.detach(index);
        this._maybeCacheView(detachedView, viewContainerRef);
    }
    /** Moves view at the previous index to the current index. */
    _moveView(adjustedPreviousIndex, currentIndex, viewContainerRef, value) {
        const view = viewContainerRef.get(adjustedPreviousIndex);
        viewContainerRef.move(view, currentIndex);
        view.context.$implicit = value;
        return view;
    }
    /**
     * Cache the given detached view. If the cache is full, the view will be
     * destroyed.
     */
    _maybeCacheView(view, viewContainerRef) {
        if (this._viewCache.length < this.viewCacheSize) {
            this._viewCache.push(view);
        }
        else {
            const index = viewContainerRef.indexOf(view);
            // The host component could remove views from the container outside of
            // the view repeater. It's unlikely this will occur, but just in case,
            // destroy the view on its own, otherwise destroy it through the
            // container to ensure that all the references are removed.
            if (index === -1) {
                view.destroy();
            }
            else {
                viewContainerRef.remove(index);
            }
        }
    }
    /** Inserts a recycled view from the cache at the given index. */
    _insertViewFromCache(index, viewContainerRef) {
        const cachedView = this._viewCache.pop();
        if (cachedView) {
            viewContainerRef.insert(cachedView, index);
        }
        return cachedView || null;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVjeWNsZS12aWV3LXJlcGVhdGVyLXN0cmF0ZWd5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9jb2xsZWN0aW9ucy9yZWN5Y2xlLXZpZXctcmVwZWF0ZXItc3RyYXRlZ3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBUUgsT0FBTyxFQU9MLHNCQUFzQixHQUN2QixNQUFNLGlCQUFpQixDQUFDO0FBRXpCOzs7Ozs7Ozs7O0dBVUc7QUFDSCxNQUFNLE9BQU8sNEJBQTRCO0lBQXpDO1FBR0U7OztXQUdHO1FBQ0gsa0JBQWEsR0FBVyxFQUFFLENBQUM7UUFFM0I7Ozs7OztXQU1HO1FBQ0ssZUFBVSxHQUF5QixFQUFFLENBQUM7SUEySWhELENBQUM7SUF6SUMsZ0NBQWdDO0lBQ2hDLFlBQVksQ0FDVixPQUEyQixFQUMzQixnQkFBa0MsRUFDbEMsa0JBQTRELEVBQzVELGlCQUF1RCxFQUN2RCxlQUFnRDtRQUVoRCx5REFBeUQ7UUFDekQsT0FBTyxDQUFDLGdCQUFnQixDQUN0QixDQUNFLE1BQStCLEVBQy9CLHFCQUFvQyxFQUNwQyxZQUEyQixFQUMzQixFQUFFO1lBQ0YsSUFBSSxJQUFvQyxDQUFDO1lBQ3pDLElBQUksU0FBaUMsQ0FBQztZQUN0QyxJQUFJLE1BQU0sQ0FBQyxhQUFhLElBQUksSUFBSSxFQUFFO2dCQUNoQyxjQUFjO2dCQUNkLE1BQU0sZUFBZSxHQUFHLEdBQUcsRUFBRSxDQUMzQixrQkFBa0IsQ0FBQyxNQUFNLEVBQUUscUJBQXFCLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQ2xFLElBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUNyQixlQUFlLEVBQ2YsWUFBYSxFQUNiLGdCQUFnQixFQUNoQixpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FDMUIsQ0FBQztnQkFDRixTQUFTLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRLENBQUMs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O2dCQUNMLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUNoQztTQUNGO0lBQ0gsQ0FBQztJQUVELGlFQUFpRTtJQUN6RCxvQkFBb0IsQ0FDMUIsS0FBYSxFQUNiLGdCQUFrQztRQUVsQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ3pDLElBQUksVUFBVSxFQUFFO1lBQ2QsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUM1QztRQUNELE9BQU8sVUFBVSxJQUFJLElBQUksQ0FBQztJQUM1QixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgRW1iZWRkZWRWaWV3UmVmLFxuICBJdGVyYWJsZUNoYW5nZVJlY29yZCxcbiAgSXRlcmFibGVDaGFuZ2VzLFxuICBWaWV3Q29udGFpbmVyUmVmLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7XG4gIF9WaWV3UmVwZWF0ZXIsXG4gIF9WaWV3UmVwZWF0ZXJJdGVtQ2hhbmdlZCxcbiAgX1ZpZXdSZXBlYXRlckl0ZW1Db250ZXh0LFxuICBfVmlld1JlcGVhdGVySXRlbUNvbnRleHRGYWN0b3J5LFxuICBfVmlld1JlcGVhdGVySXRlbUluc2VydEFyZ3MsXG4gIF9WaWV3UmVwZWF0ZXJJdGVtVmFsdWVSZXNvbHZlcixcbiAgX1ZpZXdSZXBlYXRlck9wZXJhdGlvbixcbn0gZnJvbSAnLi92aWV3LXJlcGVhdGVyJztcblxuLyoqXG4gKiBBIHJlcGVhdGVyIHRoYXQgY2FjaGVzIHZpZXdzIHdoZW4gdGhleSBhcmUgcmVtb3ZlZCBmcm9tIGFcbiAqIHtAbGluayBWaWV3Q29udGFpbmVyUmVmfS4gV2hlbiBuZXcgaXRlbXMgYXJlIGluc2VydGVkIGludG8gdGhlIGNvbnRhaW5lcixcbiAqIHRoZSByZXBlYXRlciB3aWxsIHJldXNlIG9uZSBvZiB0aGUgY2FjaGVkIHZpZXdzIGluc3RlYWQgb2YgY3JlYXRpbmcgYSBuZXdcbiAqIGVtYmVkZGVkIHZpZXcuIFJlY3ljbGluZyBjYWNoZWQgdmlld3MgcmVkdWNlcyB0aGUgcXVhbnRpdHkgb2YgZXhwZW5zaXZlIERPTVxuICogaW5zZXJ0cy5cbiAqXG4gKiBAdGVtcGxhdGUgVCBUaGUgdHlwZSBmb3IgdGhlIGVtYmVkZGVkIHZpZXcncyAkaW1wbGljaXQgcHJvcGVydHkuXG4gKiBAdGVtcGxhdGUgUiBUaGUgdHlwZSBmb3IgdGhlIGl0ZW0gaW4gZWFjaCBJdGVyYWJsZURpZmZlciBjaGFuZ2UgcmVjb3JkLlxuICogQHRlbXBsYXRlIEMgVGhlIHR5cGUgZm9yIHRoZSBjb250ZXh0IHBhc3NlZCB0byBlYWNoIGVtYmVkZGVkIHZpZXcuXG4gKi9cbmV4cG9ydCBjbGFzcyBfUmVjeWNsZVZpZXdSZXBlYXRlclN0cmF0ZWd5PFQsIFIsIEMgZXh0ZW5kcyBfVmlld1JlcGVhdGVySXRlbUNvbnRleHQ8VD4+XG4gIGltcGxlbWVudHMgX1ZpZXdSZXBlYXRlcjxULCBSLCBDPlxue1xuICAvKipcbiAgICogVGhlIHNpemUgb2YgdGhlIGNhY2hlIHVzZWQgdG8gc3RvcmUgdW51c2VkIHZpZXdzLlxuICAgKiBTZXR0aW5nIHRoZSBjYWNoZSBzaXplIHRvIGAwYCB3aWxsIGRpc2FibGUgY2FjaGluZy4gRGVmYXVsdHMgdG8gMjAgdmlld3MuXG4gICAqL1xuICB2aWV3Q2FjaGVTaXplOiBudW1iZXIgPSAyMDtcblxuICAvKipcbiAgICogVmlldyBjYWNoZSB0aGF0IHN0b3JlcyBlbWJlZGRlZCB2aWV3IGluc3RhbmNlcyB0aGF0IGhhdmUgYmVlbiBwcmV2aW91c2x5IHN0YW1wZWQgb3V0LFxuICAgKiBidXQgZG9uJ3QgYXJlIG5vdCBjdXJyZW50bHkgcmVuZGVyZWQuIFRoZSB2aWV3IHJlcGVhdGVyIHdpbGwgcmV1c2UgdGhlc2Ugdmlld3MgcmF0aGVyIHRoYW5cbiAgICogY3JlYXRpbmcgYnJhbmQgbmV3IG9uZXMuXG4gICAqXG4gICAqIFRPRE8obWljaGFlbGphbWVzcGFyc29ucykgSW52ZXN0aWdhdGUgd2hldGhlciB1c2luZyBhIGxpbmtlZCBsaXN0IHdvdWxkIGltcHJvdmUgcGVyZm9ybWFuY2UuXG4gICAqL1xuICBwcml2YXRlIF92aWV3Q2FjaGU6IEVtYmVkZGVkVmlld1JlZjxDPltdID0gW107XG5cbiAgLyoqIEFwcGx5IGNoYW5nZXMgdG8gdGhlIERPTS4gKi9cbiAgYXBwbHlDaGFuZ2VzKFxuICAgIGNoYW5nZXM6IEl0ZXJhYmxlQ2hhbmdlczxSPixcbiAgICB2aWV3Q29udGFpbmVyUmVmOiBWaWV3Q29udGFpbmVyUmVmLFxuICAgIGl0ZW1Db250ZXh0RmFjdG9yeTogX1ZpZXdSZXBlYXRlckl0ZW1Db250ZXh0RmFjdG9yeTxULCBSLCBDPixcbiAgICBpdGVtVmFsdWVSZXNvbHZlcjogX1ZpZXdSZXBlYXRlckl0ZW1WYWx1ZVJlc29sdmVyPFQsIFI+LFxuICAgIGl0ZW1WaWV3Q2hhbmdlZD86IF9WaWV3UmVwZWF0ZXJJdGVtQ2hhbmdlZDxSLCBDPixcbiAgKSB7XG4gICAgLy8gUmVhcnJhbmdlIHRoZSB2aWV3cyB0byBwdXQgdGhlbSBpbiB0aGUgcmlnaHQgbG9jYXRpb24uXG4gICAgY2hhbmdlcy5mb3JFYWNoT3BlcmF0aW9uKFxuICAgICAgKFxuICAgICAgICByZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFI+LFxuICAgICAgICBhZGp1c3RlZFByZXZpb3VzSW5kZXg6IG51bWJlciB8IG51bGwsXG4gICAgICAgIGN1cnJlbnRJbmRleDogbnVtYmVyIHwgbnVsbCxcbiAgICAgICkgPT4ge1xuICAgICAgICBsZXQgdmlldzogRW1iZWRkZWRWaWV3UmVmPEM+IHwgdW5kZWZpbmVkO1xuICAgICAgICBsZXQgb3BlcmF0aW9uOiBfVmlld1JlcGVhdGVyT3BlcmF0aW9uO1xuICAgICAgICBpZiAocmVjb3JkLnByZXZpb3VzSW5kZXggPT0gbnVsbCkge1xuICAgICAgICAgIC8vIEl0ZW0gYWRkZWQuXG4gICAgICAgICAgY29uc3Qgdmlld0FyZ3NGYWN0b3J5ID0gKCkgPT5cbiAgICAgICAgICAgIGl0ZW1Db250ZXh0RmFjdG9yeShyZWNvcmQsIGFkanVzdGVkUHJldmlvdXNJbmRleCwgY3VycmVudEluZGV4KTtcbiAgICAgICAgICB2aWV3ID0gdGhpcy5faW5zZXJ0VmlldyhcbiAgICAgICAgICAgIHZpZXdBcmdzRmFjdG9yeSxcbiAgICAgICAgICAgIGN1cnJlbnRJbmRleCEsXG4gICAgICAgICAgICB2aWV3Q29udGFpbmVyUmVmLFxuICAgICAgICAgICAgaXRlbVZhbHVlUmVzb2x2ZXIocmVjb3JkKSxcbiAgICAgICAgICApO1xuICAgICAgICAgIG9wZXJhdGlvbiA9IHZpZXcgPyBfVmlld1JlcGVhdGVyT3BlcmF0aW9uLklOU0VSVEVEIDogX1ZpZXdSZXBlYXRlck9wZXJhdGlvbi5SRVBMQUNFRDtcbiAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50SW5kZXggPT0gbnVsbCkge1xuICAgICAgICAgIC8vIEl0ZW0gcmVtb3ZlZC5cbiAgICAgICAgICB0aGlzLl9kZXRhY2hBbmRDYWNoZVZpZXcoYWRqdXN0ZWRQcmV2aW91c0luZGV4ISwgdmlld0NvbnRhaW5lclJlZik7XG4gICAgICAgICAgb3BlcmF0aW9uID0gX1ZpZXdSZXBlYXRlck9wZXJhdGlvbi5SRU1PVkVEO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEl0ZW0gbW92ZWQuXG4gICAgICAgICAgdmlldyA9IHRoaXMuX21vdmVWaWV3KFxuICAgICAgICAgICAgYWRqdXN0ZWRQcmV2aW91c0luZGV4ISxcbiAgICAgICAgICAgIGN1cnJlbnRJbmRleCEsXG4gICAgICAgICAgICB2aWV3Q29udGFpbmVyUmVmLFxuICAgICAgICAgICAgaXRlbVZhbHVlUmVzb2x2ZXIocmVjb3JkKSxcbiAgICAgICAgICApO1xuICAgICAgICAgIG9wZXJhdGlvbiA9IF9WaWV3UmVwZWF0ZXJPcGVyYXRpb24uTU9WRUQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXRlbVZpZXdDaGFuZ2VkKSB7XG4gICAgICAgICAgaXRlbVZpZXdDaGFuZ2VkKHtcbiAgICAgICAgICAgIGNvbnRleHQ6IHZpZXc/LmNvbnRleHQsXG4gICAgICAgICAgICBvcGVyYXRpb24sXG4gICAgICAgICAgICByZWNvcmQsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIGRldGFjaCgpIHtcbiAgICBmb3IgKGNvbnN0IHZpZXcgb2YgdGhpcy5fdmlld0NhY2hlKSB7XG4gICAgICB2aWV3LmRlc3Ryb3koKTtcbiAgICB9XG4gICAgdGhpcy5fdmlld0NhY2hlID0gW107XG4gIH1cblxuICAvKipcbiAgICogSW5zZXJ0cyBhIHZpZXcgZm9yIGEgbmV3IGl0ZW0sIGVpdGhlciBmcm9tIHRoZSBjYWNoZSBvciBieSBjcmVhdGluZyBhIG5ld1xuICAgKiBvbmUuIFJldHVybnMgYHVuZGVmaW5lZGAgaWYgdGhlIGl0ZW0gd2FzIGluc2VydGVkIGludG8gYSBjYWNoZWQgdmlldy5cbiAgICovXG4gIHByaXZhdGUgX2luc2VydFZpZXcoXG4gICAgdmlld0FyZ3NGYWN0b3J5OiAoKSA9PiBfVmlld1JlcGVhdGVySXRlbUluc2VydEFyZ3M8Qz4sXG4gICAgY3VycmVudEluZGV4OiBudW1iZXIsXG4gICAgdmlld0NvbnRhaW5lclJlZjogVmlld0NvbnRhaW5lclJlZixcbiAgICB2YWx1ZTogVCxcbiAgKTogRW1iZWRkZWRWaWV3UmVmPEM+IHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBjYWNoZWRWaWV3ID0gdGhpcy5faW5zZXJ0Vmlld0Zyb21DYWNoZShjdXJyZW50SW5kZXghLCB2aWV3Q29udGFpbmVyUmVmKTtcbiAgICBpZiAoY2FjaGVkVmlldykge1xuICAgICAgY2FjaGVkVmlldy5jb250ZXh0LiRpbXBsaWNpdCA9IHZhbHVlO1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCB2aWV3QXJncyA9IHZpZXdBcmdzRmFjdG9yeSgpO1xuICAgIHJldHVybiB2aWV3Q29udGFpbmVyUmVmLmNyZWF0ZUVtYmVkZGVkVmlldyhcbiAgICAgIHZpZXdBcmdzLnRlbXBsYXRlUmVmLFxuICAgICAgdmlld0FyZ3MuY29udGV4dCxcbiAgICAgIHZpZXdBcmdzLmluZGV4LFxuICAgICk7XG4gIH1cblxuICAvKiogRGV0YWNoZXMgdGhlIHZpZXcgYXQgdGhlIGdpdmVuIGluZGV4IGFuZCBpbnNlcnRzIGludG8gdGhlIHZpZXcgY2FjaGUuICovXG4gIHByaXZhdGUgX2RldGFjaEFuZENhY2hlVmlldyhpbmRleDogbnVtYmVyLCB2aWV3Q29udGFpbmVyUmVmOiBWaWV3Q29udGFpbmVyUmVmKSB7XG4gICAgY29uc3QgZGV0YWNoZWRWaWV3ID0gdmlld0NvbnRhaW5lclJlZi5kZXRhY2goaW5kZXgpIGFzIEVtYmVkZGVkVmlld1JlZjxDPjtcbiAgICB0aGlzLl9tYXliZUNhY2hlVmlldyhkZXRhY2hlZFZpZXcsIHZpZXdDb250YWluZXJSZWYpO1xuICB9XG5cbiAgLyoqIE1vdmVzIHZpZXcgYXQgdGhlIHByZXZpb3VzIGluZGV4IHRvIHRoZSBjdXJyZW50IGluZGV4LiAqL1xuICBwcml2YXRlIF9tb3ZlVmlldyhcbiAgICBhZGp1c3RlZFByZXZpb3VzSW5kZXg6IG51bWJlcixcbiAgICBjdXJyZW50SW5kZXg6IG51bWJlcixcbiAgICB2aWV3Q29udGFpbmVyUmVmOiBWaWV3Q29udGFpbmVyUmVmLFxuICAgIHZhbHVlOiBULFxuICApOiBFbWJlZGRlZFZpZXdSZWY8Qz4ge1xuICAgIGNvbnN0IHZpZXcgPSB2aWV3Q29udGFpbmVyUmVmLmdldChhZGp1c3RlZFByZXZpb3VzSW5kZXghKSBhcyBFbWJlZGRlZFZpZXdSZWY8Qz47XG4gICAgdmlld0NvbnRhaW5lclJlZi5tb3ZlKHZpZXcsIGN1cnJlbnRJbmRleCk7XG4gICAgdmlldy5jb250ZXh0LiRpbXBsaWNpdCA9IHZhbHVlO1xuICAgIHJldHVybiB2aWV3O1xuICB9XG5cbiAgLyoqXG4gICAqIENhY2hlIHRoZSBnaXZlbiBkZXRhY2hlZCB2aWV3LiBJZiB0aGUgY2FjaGUgaXMgZnVsbCwgdGhlIHZpZXcgd2lsbCBiZVxuICAgKiBkZXN0cm95ZWQuXG4gICAqL1xuICBwcml2YXRlIF9tYXliZUNhY2hlVmlldyh2aWV3OiBFbWJlZGRlZFZpZXdSZWY8Qz4sIHZpZXdDb250YWluZXJSZWY6IFZpZXdDb250YWluZXJSZWYpIHtcbiAgICBpZiAodGhpcy5fdmlld0NhY2hlLmxlbmd0aCA8IHRoaXMudmlld0NhY2hlU2l6ZSkge1xuICAgICAgdGhpcy5fdmlld0NhY2hlLnB1c2godmlldyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gdmlld0NvbnRhaW5lclJlZi5pbmRleE9mKHZpZXcpO1xuXG4gICAgICAvLyBUaGUgaG9zdCBjb21wb25lbnQgY291bGQgcmVtb3ZlIHZpZXdzIGZyb20gdGhlIGNvbnRhaW5lciBvdXRzaWRlIG9mXG4gICAgICAvLyB0aGUgdmlldyByZXBlYXRlci4gSXQncyB1bmxpa2VseSB0aGlzIHdpbGwgb2NjdXIsIGJ1dCBqdXN0IGluIGNhc2UsXG4gICAgICAvLyBkZXN0cm95IHRoZSB2aWV3IG9uIGl0cyBvd24sIG90aGVyd2lzZSBkZXN0cm95IGl0IHRocm91Z2ggdGhlXG4gICAgICAvLyBjb250YWluZXIgdG8gZW5zdXJlIHRoYXQgYWxsIHRoZSByZWZlcmVuY2VzIGFyZSByZW1vdmVkLlxuICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICB2aWV3LmRlc3Ryb3koKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZpZXdDb250YWluZXJSZWYucmVtb3ZlKGluZGV4KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogSW5zZXJ0cyBhIHJlY3ljbGVkIHZpZXcgZnJvbSB0aGUgY2FjaGUgYXQgdGhlIGdpdmVuIGluZGV4LiAqL1xuICBwcml2YXRlIF9pbnNlcnRWaWV3RnJvbUNhY2hlKFxuICAgIGluZGV4OiBudW1iZXIsXG4gICAgdmlld0NvbnRhaW5lclJlZjogVmlld0NvbnRhaW5lclJlZixcbiAgKTogRW1iZWRkZWRWaWV3UmVmPEM+IHwgbnVsbCB7XG4gICAgY29uc3QgY2FjaGVkVmlldyA9IHRoaXMuX3ZpZXdDYWNoZS5wb3AoKTtcbiAgICBpZiAoY2FjaGVkVmlldykge1xuICAgICAgdmlld0NvbnRhaW5lclJlZi5pbnNlcnQoY2FjaGVkVmlldywgaW5kZXgpO1xuICAgIH1cbiAgICByZXR1cm4gY2FjaGVkVmlldyB8fCBudWxsO1xuICB9XG59XG4iXX0=