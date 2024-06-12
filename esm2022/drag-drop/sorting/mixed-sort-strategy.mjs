/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { _getShadowRoot } from '@angular/cdk/platform';
import { moveItemInArray } from '../drag-utils';
/**
 * Strategy that only supports sorting on a list that might wrap.
 * Items are reordered by moving their DOM nodes around.
 * @docs-private
 */
export class MixedSortStrategy {
    constructor(_element, _document, _dragDropRegistry) {
        this._element = _element;
        this._document = _document;
        this._dragDropRegistry = _dragDropRegistry;
        /**
         * Keeps track of the item that was last swapped with the dragged item, as well as what direction
         * the pointer was moving in when the swap occurred and whether the user's pointer continued to
         * overlap with the swapped item after the swapping occurred.
         */
        this._previousSwap = {
            drag: null,
            deltaX: 0,
            deltaY: 0,
            overlaps: false,
        };
        /**
         * Keeps track of the relationship between a node and its next sibling. This information
         * is used to restore the DOM to the order it was in before dragging started.
         */
        this._relatedNodes = [];
    }
    /**
     * To be called when the drag sequence starts.
     * @param items Items that are currently in the list.
     */
    start(items) {
        const childNodes = this._element.childNodes;
        this._relatedNodes = [];
        for (let i = 0; i < childNodes.length; i++) {
            const node = childNodes[i];
            this._relatedNodes.push([node, node.nextSibling]);
        }
        this.withItems(items);
    }
    /**
     * To be called when an item is being sorted.
     * @param item Item to be sorted.
     * @param pointerX Position of the item along the X axis.
     * @param pointerY Position of the item along the Y axis.
     * @param pointerDelta Direction in which the pointer is moving along each axis.
     */
    sort(item, pointerX, pointerY, pointerDelta) {
        const newIndex = this._getItemIndexFromPointerPosition(item, pointerX, pointerY);
        const previousSwap = this._previousSwap;
        if (newIndex === -1 || this._activeItems[newIndex] === item) {
            return null;
        }
        const toSwapWith = this._activeItems[newIndex];
        // Prevent too many swaps over the same item.
        if (previousSwap.drag === toSwapWith &&
            previousSwap.overlaps &&
            previousSwap.deltaX === pointerDelta.x &&
            previousSwap.deltaY === pointerDelta.y) {
            return null;
        }
        const previousIndex = this.getItemIndex(item);
        const current = item.getPlaceholderElement();
        const overlapElement = toSwapWith.getRootElement();
        if (newIndex > previousIndex) {
            overlapElement.after(current);
        }
        else {
            overlapElement.before(current);
        }
        moveItemInArray(this._activeItems, previousIndex, newIndex);
        const newOverlapElement = this._getRootNode().elementFromPoint(pointerX, pointerY);
        // Note: it's tempting to save the entire `pointerDelta` object here, however that'll
        // break this functionality, because the same object is passed for all `sort` calls.
        previousSwap.deltaX = pointerDelta.x;
        previousSwap.deltaY = pointerDelta.y;
        previousSwap.drag = toSwapWith;
        previousSwap.overlaps =
            overlapElement === newOverlapElement || overlapElement.contains(newOverlapElement);
        return {
            previousIndex,
            currentIndex: newIndex,
        };
    }
    /**
     * Called when an item is being moved into the container.
     * @param item Item that was moved into the container.
     * @param pointerX Position of the item along the X axis.
     * @param pointerY Position of the item along the Y axis.
     * @param index Index at which the item entered. If omitted, the container will try to figure it
     *   out automatically.
     */
    enter(item, pointerX, pointerY, index) {
        let enterIndex = index == null || index < 0
            ? this._getItemIndexFromPointerPosition(item, pointerX, pointerY)
            : index;
        // In some cases (e.g. when the container has padding) we might not be able to figure
        // out which item to insert the dragged item next to, because the pointer didn't overlap
        // with anything. In that case we find the item that's closest to the pointer.
        if (enterIndex === -1) {
            enterIndex = this._getClosestItemIndexToPointer(item, pointerX, pointerY);
        }
        const targetItem = this._activeItems[enterIndex];
        const currentIndex = this._activeItems.indexOf(item);
        if (currentIndex > -1) {
            this._activeItems.splice(currentIndex, 1);
        }
        if (targetItem && !this._dragDropRegistry.isDragging(targetItem)) {
            this._activeItems.splice(enterIndex, 0, item);
            targetItem.getRootElement().before(item.getPlaceholderElement());
        }
        else {
            this._activeItems.push(item);
            this._element.appendChild(item.getPlaceholderElement());
        }
    }
    /** Sets the items that are currently part of the list. */
    withItems(items) {
        this._activeItems = items.slice();
    }
    /** Assigns a sort predicate to the strategy. */
    withSortPredicate(predicate) {
        this._sortPredicate = predicate;
    }
    /** Resets the strategy to its initial state before dragging was started. */
    reset() {
        const root = this._element;
        const previousSwap = this._previousSwap;
        // Moving elements around in the DOM can break things like the `@for` loop, because it
        // uses comment nodes to know where to insert elements. To avoid such issues, we restore
        // the DOM nodes in the list to their original order when the list is reset.
        // Note that this could be simpler if we just saved all the nodes, cleared the root
        // and then appended them in the original order. We don't do it, because it can break
        // down depending on when the snapshot was taken. E.g. we may end up snapshotting the
        // placeholder element which is removed after dragging.
        for (let i = this._relatedNodes.length - 1; i > -1; i--) {
            const [node, nextSibling] = this._relatedNodes[i];
            if (node.parentNode === root && node.nextSibling !== nextSibling) {
                if (nextSibling === null) {
                    root.appendChild(node);
                }
                else if (nextSibling.parentNode === root) {
                    root.insertBefore(node, nextSibling);
                }
            }
        }
        this._relatedNodes = [];
        this._activeItems = [];
        previousSwap.drag = null;
        previousSwap.deltaX = previousSwap.deltaY = 0;
        previousSwap.overlaps = false;
    }
    /**
     * Gets a snapshot of items currently in the list.
     * Can include items that we dragged in from another list.
     */
    getActiveItemsSnapshot() {
        return this._activeItems;
    }
    /** Gets the index of a specific item. */
    getItemIndex(item) {
        return this._activeItems.indexOf(item);
    }
    /** Used to notify the strategy that the scroll position has changed. */
    updateOnScroll() {
        this._activeItems.forEach(item => {
            if (this._dragDropRegistry.isDragging(item)) {
                // We need to re-sort the item manually, because the pointer move
                // events won't be dispatched while the user is scrolling.
                item._sortFromLastPointerPosition();
            }
        });
    }
    /**
     * Gets the index of an item in the drop container, based on the position of the user's pointer.
     * @param item Item that is being sorted.
     * @param pointerX Position of the user's pointer along the X axis.
     * @param pointerY Position of the user's pointer along the Y axis.
     * @param delta Direction in which the user is moving their pointer.
     */
    _getItemIndexFromPointerPosition(item, pointerX, pointerY) {
        const elementAtPoint = this._getRootNode().elementFromPoint(Math.floor(pointerX), Math.floor(pointerY));
        const index = elementAtPoint
            ? this._activeItems.findIndex(item => {
                const root = item.getRootElement();
                return elementAtPoint === root || root.contains(elementAtPoint);
            })
            : -1;
        return index === -1 || !this._sortPredicate(index, item) ? -1 : index;
    }
    /** Lazily resolves the list's root node. */
    _getRootNode() {
        // Resolve the root node lazily to ensure that the drop list is in its final place in the DOM.
        if (!this._rootNode) {
            this._rootNode = _getShadowRoot(this._element) || this._document;
        }
        return this._rootNode;
    }
    /**
     * Finds the index of the item that's closest to the item being dragged.
     * @param item Item being dragged.
     * @param pointerX Position of the user's pointer along the X axis.
     * @param pointerY Position of the user's pointer along the Y axis.
     */
    _getClosestItemIndexToPointer(item, pointerX, pointerY) {
        if (this._activeItems.length === 0) {
            return -1;
        }
        if (this._activeItems.length === 1) {
            return 0;
        }
        let minDistance = Infinity;
        let minIndex = -1;
        // Find the Euclidean distance (https://en.wikipedia.org/wiki/Euclidean_distance) between each
        // item and the pointer, and return the smallest one. Note that this is a bit flawed in that DOM
        // nodes are rectangles, not points, so we use the top/left coordinates. It should be enough
        // for our purposes.
        for (let i = 0; i < this._activeItems.length; i++) {
            const current = this._activeItems[i];
            if (current !== item) {
                const { x, y } = current.getRootElement().getBoundingClientRect();
                const distance = Math.hypot(pointerX - x, pointerY - y);
                if (distance < minDistance) {
                    minDistance = distance;
                    minIndex = i;
                }
            }
        }
        return minIndex;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWl4ZWQtc29ydC1zdHJhdGVneS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL3NvcnRpbmcvbWl4ZWQtc29ydC1zdHJhdGVneS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDckQsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUs5Qzs7OztHQUlHO0FBQ0gsTUFBTSxPQUFPLGlCQUFpQjtJQWdDNUIsWUFDVSxRQUFxQixFQUNyQixTQUFtQixFQUNuQixpQkFBcUQ7UUFGckQsYUFBUSxHQUFSLFFBQVEsQ0FBYTtRQUNyQixjQUFTLEdBQVQsU0FBUyxDQUFVO1FBQ25CLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0M7UUFyQi9EOzs7O1dBSUc7UUFDSyxrQkFBYSxHQUFHO1lBQ3RCLElBQUksRUFBRSxJQUFzQjtZQUM1QixNQUFNLEVBQUUsQ0FBQztZQUNULE1BQU0sRUFBRSxDQUFDO1lBQ1QsUUFBUSxFQUFFLEtBQUs7U0FDaEIsQ0FBQztRQUVGOzs7V0FHRztRQUNLLGtCQUFhLEdBQTZDLEVBQUUsQ0FBQztJQU1sRSxDQUFDO0lBRUo7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLEtBQXlCO1FBQzdCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDO1FBQzVDLElBQUksQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFDO1FBRXhCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDM0MsTUFBTSxJQUFJLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNCLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsSUFB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VyxFQUFFLENBQUM7b0JBQzNCLFdBQVcsR0FBRyxRQUFRLENBQUM7b0JBQ3ZCLFFBQVEsR0FBRyxDQUFDLENBQUM7Z0JBQ2YsQ0FBQztZQUNILENBQUM7UUFDSCxDQUFDO1FBRUQsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7X2dldFNoYWRvd1Jvb3R9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge21vdmVJdGVtSW5BcnJheX0gZnJvbSAnLi4vZHJhZy11dGlscyc7XG5pbXBvcnQge0Ryb3BMaXN0U29ydFN0cmF0ZWd5LCBTb3J0UHJlZGljYXRlfSBmcm9tICcuL2Ryb3AtbGlzdC1zb3J0LXN0cmF0ZWd5JztcbmltcG9ydCB7RHJhZ0Ryb3BSZWdpc3RyeX0gZnJvbSAnLi4vZHJhZy1kcm9wLXJlZ2lzdHJ5JztcbmltcG9ydCB0eXBlIHtEcmFnUmVmfSBmcm9tICcuLi9kcmFnLXJlZic7XG5cbi8qKlxuICogU3RyYXRlZ3kgdGhhdCBvbmx5IHN1cHBvcnRzIHNvcnRpbmcgb24gYSBsaXN0IHRoYXQgbWlnaHQgd3JhcC5cbiAqIEl0ZW1zIGFyZSByZW9yZGVyZWQgYnkgbW92aW5nIHRoZWlyIERPTSBub2RlcyBhcm91bmQuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBjbGFzcyBNaXhlZFNvcnRTdHJhdGVneSBpbXBsZW1lbnRzIERyb3BMaXN0U29ydFN0cmF0ZWd5IHtcbiAgLyoqIEZ1bmN0aW9uIHVzZWQgdG8gZGV0ZXJtaW5lIGlmIGFuIGl0ZW0gY2FuIGJlIHNvcnRlZCBpbnRvIGEgc3BlY2lmaWMgaW5kZXguICovXG4gIHByaXZhdGUgX3NvcnRQcmVkaWNhdGU6IFNvcnRQcmVkaWNhdGU8RHJhZ1JlZj47XG5cbiAgLyoqIExhemlseS1yZXNvbHZlZCByb290IG5vZGUgY29udGFpbmluZyB0aGUgbGlzdC4gVXNlIGBfZ2V0Um9vdE5vZGVgIHRvIHJlYWQgdGhpcy4gKi9cbiAgcHJpdmF0ZSBfcm9vdE5vZGU6IERvY3VtZW50T3JTaGFkb3dSb290IHwgdW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBEcmFnZ2FibGUgaXRlbXMgdGhhdCBhcmUgY3VycmVudGx5IGFjdGl2ZSBpbnNpZGUgdGhlIGNvbnRhaW5lci4gSW5jbHVkZXMgdGhlIGl0ZW1zXG4gICAqIHRoYXQgd2VyZSB0aGVyZSBhdCB0aGUgc3RhcnQgb2YgdGhlIHNlcXVlbmNlLCBhcyB3ZWxsIGFzIGFueSBpdGVtcyB0aGF0IGhhdmUgYmVlbiBkcmFnZ2VkXG4gICAqIGluLCBidXQgaGF2ZW4ndCBiZWVuIGRyb3BwZWQgeWV0LlxuICAgKi9cbiAgcHJpdmF0ZSBfYWN0aXZlSXRlbXM6IERyYWdSZWZbXTtcblxuICAvKipcbiAgICogS2VlcHMgdHJhY2sgb2YgdGhlIGl0ZW0gdGhhdCB3YXMgbGFzdCBzd2FwcGVkIHdpdGggdGhlIGRyYWdnZWQgaXRlbSwgYXMgd2VsbCBhcyB3aGF0IGRpcmVjdGlvblxuICAgKiB0aGUgcG9pbnRlciB3YXMgbW92aW5nIGluIHdoZW4gdGhlIHN3YXAgb2NjdXJyZWQgYW5kIHdoZXRoZXIgdGhlIHVzZXIncyBwb2ludGVyIGNvbnRpbnVlZCB0b1xuICAgKiBvdmVybGFwIHdpdGggdGhlIHN3YXBwZWQgaXRlbSBhZnRlciB0aGUgc3dhcHBpbmcgb2NjdXJyZWQuXG4gICAqL1xuICBwcml2YXRlIF9wcmV2aW91c1N3YXAgPSB7XG4gICAgZHJhZzogbnVsbCBhcyBEcmFnUmVmIHwgbnVsbCxcbiAgICBkZWx0YVg6IDAsXG4gICAgZGVsdGFZOiAwLFxuICAgIG92ZXJsYXBzOiBmYWxzZSxcbiAgfTtcblxuICAvKipcbiAgICogS2VlcHMgdHJhY2sgb2YgdGhlIHJlbGF0aW9uc2hpcCBiZXR3ZWVuIGEgbm9kZSBhbmQgaXRzIG5leHQgc2libGluZy4gVGhpcyBpbmZvcm1hdGlvblxuICAgKiBpcyB1c2VkIHRvIHJlc3RvcmUgdGhlIERPTSB0byB0aGUgb3JkZXIgaXQgd2FzIGluIGJlZm9yZSBkcmFnZ2luZyBzdGFydGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVsYXRlZE5vZGVzOiBbbm9kZTogTm9kZSwgbmV4dFNpYmxpbmc6IE5vZGUgfCBudWxsXVtdID0gW107XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfZWxlbWVudDogSFRNTEVsZW1lbnQsXG4gICAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50LFxuICAgIHByaXZhdGUgX2RyYWdEcm9wUmVnaXN0cnk6IERyYWdEcm9wUmVnaXN0cnk8RHJhZ1JlZiwgdW5rbm93bj4sXG4gICkge31cblxuICAvKipcbiAgICogVG8gYmUgY2FsbGVkIHdoZW4gdGhlIGRyYWcgc2VxdWVuY2Ugc3RhcnRzLlxuICAgKiBAcGFyYW0gaXRlbXMgSXRlbXMgdGhhdCBhcmUgY3VycmVudGx5IGluIHRoZSBsaXN0LlxuICAgKi9cbiAgc3RhcnQoaXRlbXM6IHJlYWRvbmx5IERyYWdSZWZbXSk6IHZvaWQge1xuICAgIGNvbnN0IGNoaWxkTm9kZXMgPSB0aGlzLl9lbGVtZW50LmNoaWxkTm9kZXM7XG4gICAgdGhpcy5fcmVsYXRlZE5vZGVzID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG5vZGUgPSBjaGlsZE5vZGVzW2ldO1xuICAgICAgdGhpcy5fcmVsYXRlZE5vZGVzLnB1c2goW25vZGUsIG5vZGUubmV4dFNpYmxpbmddKTtcbiAgICB9XG5cbiAgICB0aGlzLndpdGhJdGVtcyhpdGVtcyk7XG4gIH1cblxuICAvKipcbiAgICogVG8gYmUgY2FsbGVkIHdoZW4gYW4gaXRlbSBpcyBiZWluZyBzb3J0ZWQuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdG8gYmUgc29ydGVkLlxuICAgKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHBvaW50ZXJZIFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyRGVsdGEgRGlyZWN0aW9uIGluIHdoaWNoIHRoZSBwb2ludGVyIGlzIG1vdmluZyBhbG9uZyBlYWNoIGF4aXMuXG4gICAqL1xuICBzb3J0KFxuICAgIGl0ZW06IERyYWdSZWYsXG4gICAgcG9pbnRlclg6IG51bWJlcixcbiAgICBwb2ludGVyWTogbnVtYmVyLFxuICAgIHBvaW50ZXJEZWx0YToge3g6IG51bWJlcjsgeTogbnVtYmVyfSxcbiAgKToge3ByZXZpb3VzSW5kZXg6IG51bWJlcjsgY3VycmVudEluZGV4OiBudW1iZXJ9IHwgbnVsbCB7XG4gICAgY29uc3QgbmV3SW5kZXggPSB0aGlzLl9nZXRJdGVtSW5kZXhGcm9tUG9pbnRlclBvc2l0aW9uKGl0ZW0sIHBvaW50ZXJYLCBwb2ludGVyWSk7XG4gICAgY29uc3QgcHJldmlvdXNTd2FwID0gdGhpcy5fcHJldmlvdXNTd2FwO1xuXG4gICAgaWYgKG5ld0luZGV4ID09PSAtMSB8fCB0aGlzLl9hY3RpdmVJdGVtc1tuZXdJbmRleF0gPT09IGl0ZW0pIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHRvU3dhcFdpdGggPSB0aGlzLl9hY3RpdmVJdGVtc1tuZXdJbmRleF07XG5cbiAgICAvLyBQcmV2ZW50IHRvbyBtYW55IHN3YXBzIG92ZXIgdGhlIHNhbWUgaXRlbS5cbiAgICBpZiAoXG4gICAgICBwcmV2aW91c1N3YXAuZHJhZyA9PT0gdG9Td2FwV2l0aCAmJlxuICAgICAgcHJldmlvdXNTd2FwLm92ZXJsYXBzICYmXG4gICAgICBwcmV2aW91c1N3YXAuZGVsdGFYID09PSBwb2ludGVyRGVsdGEueCAmJlxuICAgICAgcHJldmlvdXNTd2FwLmRlbHRhWSA9PT0gcG9pbnRlckRlbHRhLnlcbiAgICApIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHByZXZpb3VzSW5kZXggPSB0aGlzLmdldEl0ZW1JbmRleChpdGVtKTtcbiAgICBjb25zdCBjdXJyZW50ID0gaXRlbS5nZXRQbGFjZWhvbGRlckVsZW1lbnQoKTtcbiAgICBjb25zdCBvdmVybGFwRWxlbWVudCA9IHRvU3dhcFdpdGguZ2V0Um9vdEVsZW1lbnQoKTtcblxuICAgIGlmIChuZXdJbmRleCA+IHByZXZpb3VzSW5kZXgpIHtcbiAgICAgIG92ZXJsYXBFbGVtZW50LmFmdGVyKGN1cnJlbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdmVybGFwRWxlbWVudC5iZWZvcmUoY3VycmVudCk7XG4gICAgfVxuXG4gICAgbW92ZUl0ZW1JbkFycmF5KHRoaXMuX2FjdGl2ZUl0ZW1zLCBwcmV2aW91c0luZGV4LCBuZXdJbmRleCk7XG5cbiAgICBjb25zdCBuZXdPdmVybGFwRWxlbWVudCA9IHRoaXMuX2dldFJvb3ROb2RlKCkuZWxlbWVudEZyb21Qb2ludChwb2ludGVyWCwgcG9pbnRlclkpO1xuICAgIC8vIE5vdGU6IGl0J3MgdGVtcHRpbmcgdG8gc2F2ZSB0aGUgZW50aXJlIGBwb2ludGVyRGVsdGFgIG9iamVjdCBoZXJlLCBob3dldmVyIHRoYXQnbGxcbiAgICAvLyBicmVhayB0aGlzIGZ1bmN0aW9uYWxpdHksIGJlY2F1c2UgdGhlIHNhbWUgb2JqZWN0IGlzIHBhc3NlZCBmb3IgYWxsIGBzb3J0YCBjYWxscy5cbiAgICBwcmV2aW91c1N3YXAuZGVsdGFYID0gcG9pbnRlckRlbHRhLng7XG4gICAgcHJldmlvdXNTd2FwLmRlbHRhWSA9IHBvaW50ZXJEZWx0YS55O1xuICAgIHByZXZpb3VzU3dhcC5kcmFnID0gdG9Td2FwV2l0aDtcbiAgICBwcmV2aW91c1N3YXAub3ZlcmxhcHMgPVxuICAgICAgb3ZlcmxhcEVsZW1lbnQgPT09IG5ld092ZXJsYXBFbGVtZW50IHx8IG92ZXJsYXBFbGVtZW50LmNvbnRhaW5zKG5ld092ZXJsYXBFbGVtZW50KTtcblxuICAgIHJldHVybiB7XG4gICAgICBwcmV2aW91c0luZGV4LFxuICAgICAgY3VycmVudEluZGV4OiBuZXdJbmRleCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCB3aGVuIGFuIGl0ZW0gaXMgYmVpbmcgbW92ZWQgaW50byB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRoYXQgd2FzIG1vdmVkIGludG8gdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKiBAcGFyYW0gaW5kZXggSW5kZXggYXQgd2hpY2ggdGhlIGl0ZW0gZW50ZXJlZC4gSWYgb21pdHRlZCwgdGhlIGNvbnRhaW5lciB3aWxsIHRyeSB0byBmaWd1cmUgaXRcbiAgICogICBvdXQgYXV0b21hdGljYWxseS5cbiAgICovXG4gIGVudGVyKGl0ZW06IERyYWdSZWYsIHBvaW50ZXJYOiBudW1iZXIsIHBvaW50ZXJZOiBudW1iZXIsIGluZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gICAgbGV0IGVudGVySW5kZXggPVxuICAgICAgaW5kZXggPT0gbnVsbCB8fCBpbmRleCA8IDBcbiAgICAgICAgPyB0aGlzLl9nZXRJdGVtSW5kZXhGcm9tUG9pbnRlclBvc2l0aW9uKGl0ZW0sIHBvaW50ZXJYLCBwb2ludGVyWSlcbiAgICAgICAgOiBpbmRleDtcblxuICAgIC8vIEluIHNvbWUgY2FzZXMgKGUuZy4gd2hlbiB0aGUgY29udGFpbmVyIGhhcyBwYWRkaW5nKSB3ZSBtaWdodCBub3QgYmUgYWJsZSB0byBmaWd1cmVcbiAgICAvLyBvdXQgd2hpY2ggaXRlbSB0byBpbnNlcnQgdGhlIGRyYWdnZWQgaXRlbSBuZXh0IHRvLCBiZWNhdXNlIHRoZSBwb2ludGVyIGRpZG4ndCBvdmVybGFwXG4gICAgLy8gd2l0aCBhbnl0aGluZy4gSW4gdGhhdCBjYXNlIHdlIGZpbmQgdGhlIGl0ZW0gdGhhdCdzIGNsb3Nlc3QgdG8gdGhlIHBvaW50ZXIuXG4gICAgaWYgKGVudGVySW5kZXggPT09IC0xKSB7XG4gICAgICBlbnRlckluZGV4ID0gdGhpcy5fZ2V0Q2xvc2VzdEl0ZW1JbmRleFRvUG9pbnRlcihpdGVtLCBwb2ludGVyWCwgcG9pbnRlclkpO1xuICAgIH1cblxuICAgIGNvbnN0IHRhcmdldEl0ZW0gPSB0aGlzLl9hY3RpdmVJdGVtc1tlbnRlckluZGV4XSBhcyBEcmFnUmVmIHwgdW5kZWZpbmVkO1xuICAgIGNvbnN0IGN1cnJlbnRJbmRleCA9IHRoaXMuX2FjdGl2ZUl0ZW1zLmluZGV4T2YoaXRlbSk7XG5cbiAgICBpZiAoY3VycmVudEluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMuX2FjdGl2ZUl0ZW1zLnNwbGljZShjdXJyZW50SW5kZXgsIDEpO1xuICAgIH1cblxuICAgIGlmICh0YXJnZXRJdGVtICYmICF0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LmlzRHJhZ2dpbmcodGFyZ2V0SXRlbSkpIHtcbiAgICAgIHRoaXMuX2FjdGl2ZUl0ZW1zLnNwbGljZShlbnRlckluZGV4LCAwLCBpdGVtKTtcbiAgICAgIHRhcmdldEl0ZW0uZ2V0Um9vdEVsZW1lbnQoKS5iZWZvcmUoaXRlbS5nZXRQbGFjZWhvbGRlckVsZW1lbnQoKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2FjdGl2ZUl0ZW1zLnB1c2goaXRlbSk7XG4gICAgICB0aGlzLl9lbGVtZW50LmFwcGVuZENoaWxkKGl0ZW0uZ2V0UGxhY2Vob2xkZXJFbGVtZW50KCkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBpdGVtcyB0aGF0IGFyZSBjdXJyZW50bHkgcGFydCBvZiB0aGUgbGlzdC4gKi9cbiAgd2l0aEl0ZW1zKGl0ZW1zOiByZWFkb25seSBEcmFnUmVmW10pOiB2b2lkIHtcbiAgICB0aGlzLl9hY3RpdmVJdGVtcyA9IGl0ZW1zLnNsaWNlKCk7XG4gIH1cblxuICAvKiogQXNzaWducyBhIHNvcnQgcHJlZGljYXRlIHRvIHRoZSBzdHJhdGVneS4gKi9cbiAgd2l0aFNvcnRQcmVkaWNhdGUocHJlZGljYXRlOiBTb3J0UHJlZGljYXRlPERyYWdSZWY+KTogdm9pZCB7XG4gICAgdGhpcy5fc29ydFByZWRpY2F0ZSA9IHByZWRpY2F0ZTtcbiAgfVxuXG4gIC8qKiBSZXNldHMgdGhlIHN0cmF0ZWd5IHRvIGl0cyBpbml0aWFsIHN0YXRlIGJlZm9yZSBkcmFnZ2luZyB3YXMgc3RhcnRlZC4gKi9cbiAgcmVzZXQoKTogdm9pZCB7XG4gICAgY29uc3Qgcm9vdCA9IHRoaXMuX2VsZW1lbnQ7XG4gICAgY29uc3QgcHJldmlvdXNTd2FwID0gdGhpcy5fcHJldmlvdXNTd2FwO1xuXG4gICAgLy8gTW92aW5nIGVsZW1lbnRzIGFyb3VuZCBpbiB0aGUgRE9NIGNhbiBicmVhayB0aGluZ3MgbGlrZSB0aGUgYEBmb3JgIGxvb3AsIGJlY2F1c2UgaXRcbiAgICAvLyB1c2VzIGNvbW1lbnQgbm9kZXMgdG8ga25vdyB3aGVyZSB0byBpbnNlcnQgZWxlbWVudHMuIFRvIGF2b2lkIHN1Y2ggaXNzdWVzLCB3ZSByZXN0b3JlXG4gICAgLy8gdGhlIERPTSBub2RlcyBpbiB0aGUgbGlzdCB0byB0aGVpciBvcmlnaW5hbCBvcmRlciB3aGVuIHRoZSBsaXN0IGlzIHJlc2V0LlxuICAgIC8vIE5vdGUgdGhhdCB0aGlzIGNvdWxkIGJlIHNpbXBsZXIgaWYgd2UganVzdCBzYXZlZCBhbGwgdGhlIG5vZGVzLCBjbGVhcmVkIHRoZSByb290XG4gICAgLy8gYW5kIHRoZW4gYXBwZW5kZWQgdGhlbSBpbiB0aGUgb3JpZ2luYWwgb3JkZXIuIFdlIGRvbid0IGRvIGl0LCBiZWNhdXNlIGl0IGNhbiBicmVha1xuICAgIC8vIGRvd24gZGVwZW5kaW5nIG9uIHdoZW4gdGhlIHNuYXBzaG90IHdhcyB0YWtlbi4gRS5nLiB3ZSBtYXkgZW5kIHVwIHNuYXBzaG90dGluZyB0aGVcbiAgICAvLyBwbGFjZWhvbGRlciBlbGVtZW50IHdoaWNoIGlzIHJlbW92ZWQgYWZ0ZXIgZHJhZ2dpbmcuXG4gICAgZm9yIChsZXQgaSA9IHRoaXMuX3JlbGF0ZWROb2Rlcy5sZW5ndGggLSAxOyBpID4gLTE7IGktLSkge1xuICAgICAgY29uc3QgW25vZGUsIG5leHRTaWJsaW5nXSA9IHRoaXMuX3JlbGF0ZWROb2Rlc1tpXTtcbiAgICAgIGlmIChub2RlLnBhcmVudE5vZGUgPT09IHJvb3QgJiYgbm9kZS5uZXh0U2libGluZyAhPT0gbmV4dFNpYmxpbmcpIHtcbiAgICAgICAgaWYgKG5leHRTaWJsaW5nID09PSBudWxsKSB7XG4gICAgICAgICAgcm9vdC5hcHBlbmRDaGlsZChub2RlKTtcbiAgICAgICAgfSBlbHNlIGlmIChuZXh0U2libGluZy5wYXJlbnROb2RlID09PSByb290KSB7XG4gICAgICAgICAgcm9vdC5pbnNlcnRCZWZvcmUobm9kZSwgbmV4dFNpYmxpbmcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fcmVsYXRlZE5vZGVzID0gW107XG4gICAgdGhpcy5fYWN0aXZlSXRlbXMgPSBbXTtcbiAgICBwcmV2aW91c1N3YXAuZHJhZyA9IG51bGw7XG4gICAgcHJldmlvdXNTd2FwLmRlbHRhWCA9IHByZXZpb3VzU3dhcC5kZWx0YVkgPSAwO1xuICAgIHByZXZpb3VzU3dhcC5vdmVybGFwcyA9IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSBzbmFwc2hvdCBvZiBpdGVtcyBjdXJyZW50bHkgaW4gdGhlIGxpc3QuXG4gICAqIENhbiBpbmNsdWRlIGl0ZW1zIHRoYXQgd2UgZHJhZ2dlZCBpbiBmcm9tIGFub3RoZXIgbGlzdC5cbiAgICovXG4gIGdldEFjdGl2ZUl0ZW1zU25hcHNob3QoKTogcmVhZG9ubHkgRHJhZ1JlZltdIHtcbiAgICByZXR1cm4gdGhpcy5fYWN0aXZlSXRlbXM7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgaW5kZXggb2YgYSBzcGVjaWZpYyBpdGVtLiAqL1xuICBnZXRJdGVtSW5kZXgoaXRlbTogRHJhZ1JlZik6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX2FjdGl2ZUl0ZW1zLmluZGV4T2YoaXRlbSk7XG4gIH1cblxuICAvKiogVXNlZCB0byBub3RpZnkgdGhlIHN0cmF0ZWd5IHRoYXQgdGhlIHNjcm9sbCBwb3NpdGlvbiBoYXMgY2hhbmdlZC4gKi9cbiAgdXBkYXRlT25TY3JvbGwoKTogdm9pZCB7XG4gICAgdGhpcy5fYWN0aXZlSXRlbXMuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgIGlmICh0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LmlzRHJhZ2dpbmcoaXRlbSkpIHtcbiAgICAgICAgLy8gV2UgbmVlZCB0byByZS1zb3J0IHRoZSBpdGVtIG1hbnVhbGx5LCBiZWNhdXNlIHRoZSBwb2ludGVyIG1vdmVcbiAgICAgICAgLy8gZXZlbnRzIHdvbid0IGJlIGRpc3BhdGNoZWQgd2hpbGUgdGhlIHVzZXIgaXMgc2Nyb2xsaW5nLlxuICAgICAgICBpdGVtLl9zb3J0RnJvbUxhc3RQb2ludGVyUG9zaXRpb24oKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpbmRleCBvZiBhbiBpdGVtIGluIHRoZSBkcm9wIGNvbnRhaW5lciwgYmFzZWQgb24gdGhlIHBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB0aGF0IGlzIGJlaW5nIHNvcnRlZC5cbiAgICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0gcG9pbnRlclkgUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqIEBwYXJhbSBkZWx0YSBEaXJlY3Rpb24gaW4gd2hpY2ggdGhlIHVzZXIgaXMgbW92aW5nIHRoZWlyIHBvaW50ZXIuXG4gICAqL1xuICBwcml2YXRlIF9nZXRJdGVtSW5kZXhGcm9tUG9pbnRlclBvc2l0aW9uKFxuICAgIGl0ZW06IERyYWdSZWYsXG4gICAgcG9pbnRlclg6IG51bWJlcixcbiAgICBwb2ludGVyWTogbnVtYmVyLFxuICApOiBudW1iZXIge1xuICAgIGNvbnN0IGVsZW1lbnRBdFBvaW50ID0gdGhpcy5fZ2V0Um9vdE5vZGUoKS5lbGVtZW50RnJvbVBvaW50KFxuICAgICAgTWF0aC5mbG9vcihwb2ludGVyWCksXG4gICAgICBNYXRoLmZsb29yKHBvaW50ZXJZKSxcbiAgICApO1xuICAgIGNvbnN0IGluZGV4ID0gZWxlbWVudEF0UG9pbnRcbiAgICAgID8gdGhpcy5fYWN0aXZlSXRlbXMuZmluZEluZGV4KGl0ZW0gPT4ge1xuICAgICAgICAgIGNvbnN0IHJvb3QgPSBpdGVtLmdldFJvb3RFbGVtZW50KCk7XG4gICAgICAgICAgcmV0dXJuIGVsZW1lbnRBdFBvaW50ID09PSByb290IHx8IHJvb3QuY29udGFpbnMoZWxlbWVudEF0UG9pbnQpO1xuICAgICAgICB9KVxuICAgICAgOiAtMTtcbiAgICByZXR1cm4gaW5kZXggPT09IC0xIHx8ICF0aGlzLl9zb3J0UHJlZGljYXRlKGluZGV4LCBpdGVtKSA/IC0xIDogaW5kZXg7XG4gIH1cblxuICAvKiogTGF6aWx5IHJlc29sdmVzIHRoZSBsaXN0J3Mgcm9vdCBub2RlLiAqL1xuICBwcml2YXRlIF9nZXRSb290Tm9kZSgpOiBEb2N1bWVudE9yU2hhZG93Um9vdCB7XG4gICAgLy8gUmVzb2x2ZSB0aGUgcm9vdCBub2RlIGxhemlseSB0byBlbnN1cmUgdGhhdCB0aGUgZHJvcCBsaXN0IGlzIGluIGl0cyBmaW5hbCBwbGFjZSBpbiB0aGUgRE9NLlxuICAgIGlmICghdGhpcy5fcm9vdE5vZGUpIHtcbiAgICAgIHRoaXMuX3Jvb3ROb2RlID0gX2dldFNoYWRvd1Jvb3QodGhpcy5fZWxlbWVudCkgfHwgdGhpcy5fZG9jdW1lbnQ7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9yb290Tm9kZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaW5kcyB0aGUgaW5kZXggb2YgdGhlIGl0ZW0gdGhhdCdzIGNsb3Nlc3QgdG8gdGhlIGl0ZW0gYmVpbmcgZHJhZ2dlZC5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSBiZWluZyBkcmFnZ2VkLlxuICAgKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIFkgYXhpcy5cbiAgICovXG4gIHByaXZhdGUgX2dldENsb3Nlc3RJdGVtSW5kZXhUb1BvaW50ZXIoaXRlbTogRHJhZ1JlZiwgcG9pbnRlclg6IG51bWJlciwgcG9pbnRlclk6IG51bWJlcik6IG51bWJlciB7XG4gICAgaWYgKHRoaXMuX2FjdGl2ZUl0ZW1zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9hY3RpdmVJdGVtcy5sZW5ndGggPT09IDEpIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIGxldCBtaW5EaXN0YW5jZSA9IEluZmluaXR5O1xuICAgIGxldCBtaW5JbmRleCA9IC0xO1xuXG4gICAgLy8gRmluZCB0aGUgRXVjbGlkZWFuIGRpc3RhbmNlIChodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9FdWNsaWRlYW5fZGlzdGFuY2UpIGJldHdlZW4gZWFjaFxuICAgIC8vIGl0ZW0gYW5kIHRoZSBwb2ludGVyLCBhbmQgcmV0dXJuIHRoZSBzbWFsbGVzdCBvbmUuIE5vdGUgdGhhdCB0aGlzIGlzIGEgYml0IGZsYXdlZCBpbiB0aGF0IERPTVxuICAgIC8vIG5vZGVzIGFyZSByZWN0YW5nbGVzLCBub3QgcG9pbnRzLCBzbyB3ZSB1c2UgdGhlIHRvcC9sZWZ0IGNvb3JkaW5hdGVzLiBJdCBzaG91bGQgYmUgZW5vdWdoXG4gICAgLy8gZm9yIG91ciBwdXJwb3Nlcy5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX2FjdGl2ZUl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjdXJyZW50ID0gdGhpcy5fYWN0aXZlSXRlbXNbaV07XG4gICAgICBpZiAoY3VycmVudCAhPT0gaXRlbSkge1xuICAgICAgICBjb25zdCB7eCwgeX0gPSBjdXJyZW50LmdldFJvb3RFbGVtZW50KCkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGNvbnN0IGRpc3RhbmNlID0gTWF0aC5oeXBvdChwb2ludGVyWCAtIHgsIHBvaW50ZXJZIC0geSk7XG5cbiAgICAgICAgaWYgKGRpc3RhbmNlIDwgbWluRGlzdGFuY2UpIHtcbiAgICAgICAgICBtaW5EaXN0YW5jZSA9IGRpc3RhbmNlO1xuICAgICAgICAgIG1pbkluZGV4ID0gaTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBtaW5JbmRleDtcbiAgfVxufVxuIl19