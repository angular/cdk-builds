/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { moveItemInArray } from '../drag-utils';
import { combineTransforms } from '../dom/styling';
import { adjustDomRect, getMutableClientRect, isInsideClientRect } from '../dom/dom-rect';
/**
 * Strategy that only supports sorting along a single axis.
 * Items are reordered using CSS transforms which allows for sorting to be animated.
 * @docs-private
 */
export class SingleAxisSortStrategy {
    constructor(_dragDropRegistry) {
        this._dragDropRegistry = _dragDropRegistry;
        /** Cache of the dimensions of all the items inside the container. */
        this._itemPositions = [];
        /** Direction in which the list is oriented. */
        this.orientation = 'vertical';
        /**
         * Keeps track of the item that was last swapped with the dragged item, as well as what direction
         * the pointer was moving in when the swap occurred and whether the user's pointer continued to
         * overlap with the swapped item after the swapping occurred.
         */
        this._previousSwap = {
            drag: null,
            delta: 0,
            overlaps: false,
        };
    }
    /**
     * To be called when the drag sequence starts.
     * @param items Items that are currently in the list.
     */
    start(items) {
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
        const siblings = this._itemPositions;
        const newIndex = this._getItemIndexFromPointerPosition(item, pointerX, pointerY, pointerDelta);
        if (newIndex === -1 && siblings.length > 0) {
            return null;
        }
        const isHorizontal = this.orientation === 'horizontal';
        const currentIndex = siblings.findIndex(currentItem => currentItem.drag === item);
        const siblingAtNewPosition = siblings[newIndex];
        const currentPosition = siblings[currentIndex].clientRect;
        const newPosition = siblingAtNewPosition.clientRect;
        const delta = currentIndex > newIndex ? 1 : -1;
        // How many pixels the item's placeholder should be offset.
        const itemOffset = this._getItemOffsetPx(currentPosition, newPosition, delta);
        // How many pixels all the other items should be offset.
        const siblingOffset = this._getSiblingOffsetPx(currentIndex, siblings, delta);
        // Save the previous order of the items before moving the item to its new index.
        // We use this to check whether an item has been moved as a result of the sorting.
        const oldOrder = siblings.slice();
        // Shuffle the array in place.
        moveItemInArray(siblings, currentIndex, newIndex);
        siblings.forEach((sibling, index) => {
            // Don't do anything if the position hasn't changed.
            if (oldOrder[index] === sibling) {
                return;
            }
            const isDraggedItem = sibling.drag === item;
            const offset = isDraggedItem ? itemOffset : siblingOffset;
            const elementToOffset = isDraggedItem
                ? item.getPlaceholderElement()
                : sibling.drag.getRootElement();
            // Update the offset to reflect the new position.
            sibling.offset += offset;
            // Since we're moving the items with a `transform`, we need to adjust their cached
            // client rects to reflect their new position, as well as swap their positions in the cache.
            // Note that we shouldn't use `getBoundingClientRect` here to update the cache, because the
            // elements may be mid-animation which will give us a wrong result.
            if (isHorizontal) {
                // Round the transforms since some browsers will
                // blur the elements, for sub-pixel transforms.
                elementToOffset.style.transform = combineTransforms(`translate3d(${Math.round(sibling.offset)}px, 0, 0)`, sibling.initialTransform);
                adjustDomRect(sibling.clientRect, 0, offset);
            }
            else {
                elementToOffset.style.transform = combineTransforms(`translate3d(0, ${Math.round(sibling.offset)}px, 0)`, sibling.initialTransform);
                adjustDomRect(sibling.clientRect, offset, 0);
            }
        });
        // Note that it's important that we do this after the client rects have been adjusted.
        this._previousSwap.overlaps = isInsideClientRect(newPosition, pointerX, pointerY);
        this._previousSwap.drag = siblingAtNewPosition.drag;
        this._previousSwap.delta = isHorizontal ? pointerDelta.x : pointerDelta.y;
        return { previousIndex: currentIndex, currentIndex: newIndex };
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
        const newIndex = index == null || index < 0
            ? // We use the coordinates of where the item entered the drop
                // zone to figure out at which index it should be inserted.
                this._getItemIndexFromPointerPosition(item, pointerX, pointerY)
            : index;
        const activeDraggables = this._activeDraggables;
        const currentIndex = activeDraggables.indexOf(item);
        const placeholder = item.getPlaceholderElement();
        let newPositionReference = activeDraggables[newIndex];
        // If the item at the new position is the same as the item that is being dragged,
        // it means that we're trying to restore the item to its initial position. In this
        // case we should use the next item from the list as the reference.
        if (newPositionReference === item) {
            newPositionReference = activeDraggables[newIndex + 1];
        }
        // If we didn't find a new position reference, it means that either the item didn't start off
        // in this container, or that the item requested to be inserted at the end of the list.
        if (!newPositionReference &&
            (newIndex == null || newIndex === -1 || newIndex < activeDraggables.length - 1) &&
            this._shouldEnterAsFirstChild(pointerX, pointerY)) {
            newPositionReference = activeDraggables[0];
        }
        // Since the item may be in the `activeDraggables` already (e.g. if the user dragged it
        // into another container and back again), we have to ensure that it isn't duplicated.
        if (currentIndex > -1) {
            activeDraggables.splice(currentIndex, 1);
        }
        // Don't use items that are being dragged as a reference, because
        // their element has been moved down to the bottom of the body.
        if (newPositionReference && !this._dragDropRegistry.isDragging(newPositionReference)) {
            const element = newPositionReference.getRootElement();
            element.parentElement.insertBefore(placeholder, element);
            activeDraggables.splice(newIndex, 0, item);
        }
        else {
            this._element.appendChild(placeholder);
            activeDraggables.push(item);
        }
        // The transform needs to be cleared so it doesn't throw off the measurements.
        placeholder.style.transform = '';
        // Note that usually `start` is called together with `enter` when an item goes into a new
        // container. This will cache item positions, but we need to refresh them since the amount
        // of items has changed.
        this._cacheItemPositions();
    }
    /** Sets the items that are currently part of the list. */
    withItems(items) {
        this._activeDraggables = items.slice();
        this._cacheItemPositions();
    }
    /** Assigns a sort predicate to the strategy. */
    withSortPredicate(predicate) {
        this._sortPredicate = predicate;
    }
    /** Resets the strategy to its initial state before dragging was started. */
    reset() {
        // TODO(crisbeto): may have to wait for the animations to finish.
        this._activeDraggables?.forEach(item => {
            const rootElement = item.getRootElement();
            if (rootElement) {
                const initialTransform = this._itemPositions.find(p => p.drag === item)?.initialTransform;
                rootElement.style.transform = initialTransform || '';
            }
        });
        this._itemPositions = [];
        this._activeDraggables = [];
        this._previousSwap.drag = null;
        this._previousSwap.delta = 0;
        this._previousSwap.overlaps = false;
    }
    /**
     * Gets a snapshot of items currently in the list.
     * Can include items that we dragged in from another list.
     */
    getActiveItemsSnapshot() {
        return this._activeDraggables;
    }
    /** Gets the index of a specific item. */
    getItemIndex(item) {
        // Items are sorted always by top/left in the cache, however they flow differently in RTL.
        // The rest of the logic still stands no matter what orientation we're in, however
        // we need to invert the array when determining the index.
        const items = this.orientation === 'horizontal' && this.direction === 'rtl'
            ? this._itemPositions.slice().reverse()
            : this._itemPositions;
        return items.findIndex(currentItem => currentItem.drag === item);
    }
    /** Used to notify the strategy that the scroll position has changed. */
    updateOnScroll(topDifference, leftDifference) {
        // Since we know the amount that the user has scrolled we can shift all of the
        // client rectangles ourselves. This is cheaper than re-measuring everything and
        // we can avoid inconsistent behavior where we might be measuring the element before
        // its position has changed.
        this._itemPositions.forEach(({ clientRect }) => {
            adjustDomRect(clientRect, topDifference, leftDifference);
        });
        // We need two loops for this, because we want all of the cached
        // positions to be up-to-date before we re-sort the item.
        this._itemPositions.forEach(({ drag }) => {
            if (this._dragDropRegistry.isDragging(drag)) {
                // We need to re-sort the item manually, because the pointer move
                // events won't be dispatched while the user is scrolling.
                drag._sortFromLastPointerPosition();
            }
        });
    }
    withElementContainer(container) {
        this._element = container;
    }
    /** Refreshes the position cache of the items and sibling containers. */
    _cacheItemPositions() {
        const isHorizontal = this.orientation === 'horizontal';
        this._itemPositions = this._activeDraggables
            .map(drag => {
            const elementToMeasure = drag.getVisibleElement();
            return {
                drag,
                offset: 0,
                initialTransform: elementToMeasure.style.transform || '',
                clientRect: getMutableClientRect(elementToMeasure),
            };
        })
            .sort((a, b) => {
            return isHorizontal
                ? a.clientRect.left - b.clientRect.left
                : a.clientRect.top - b.clientRect.top;
        });
    }
    /**
     * Gets the offset in pixels by which the item that is being dragged should be moved.
     * @param currentPosition Current position of the item.
     * @param newPosition Position of the item where the current item should be moved.
     * @param delta Direction in which the user is moving.
     */
    _getItemOffsetPx(currentPosition, newPosition, delta) {
        const isHorizontal = this.orientation === 'horizontal';
        let itemOffset = isHorizontal
            ? newPosition.left - currentPosition.left
            : newPosition.top - currentPosition.top;
        // Account for differences in the item width/height.
        if (delta === -1) {
            itemOffset += isHorizontal
                ? newPosition.width - currentPosition.width
                : newPosition.height - currentPosition.height;
        }
        return itemOffset;
    }
    /**
     * Gets the offset in pixels by which the items that aren't being dragged should be moved.
     * @param currentIndex Index of the item currently being dragged.
     * @param siblings All of the items in the list.
     * @param delta Direction in which the user is moving.
     */
    _getSiblingOffsetPx(currentIndex, siblings, delta) {
        const isHorizontal = this.orientation === 'horizontal';
        const currentPosition = siblings[currentIndex].clientRect;
        const immediateSibling = siblings[currentIndex + delta * -1];
        let siblingOffset = currentPosition[isHorizontal ? 'width' : 'height'] * delta;
        if (immediateSibling) {
            const start = isHorizontal ? 'left' : 'top';
            const end = isHorizontal ? 'right' : 'bottom';
            // Get the spacing between the start of the current item and the end of the one immediately
            // after it in the direction in which the user is dragging, or vice versa. We add it to the
            // offset in order to push the element to where it will be when it's inline and is influenced
            // by the `margin` of its siblings.
            if (delta === -1) {
                siblingOffset -= immediateSibling.clientRect[start] - currentPosition[end];
            }
            else {
                siblingOffset += currentPosition[start] - immediateSibling.clientRect[end];
            }
        }
        return siblingOffset;
    }
    /**
     * Checks if pointer is entering in the first position
     * @param pointerX Position of the user's pointer along the X axis.
     * @param pointerY Position of the user's pointer along the Y axis.
     */
    _shouldEnterAsFirstChild(pointerX, pointerY) {
        if (!this._activeDraggables.length) {
            return false;
        }
        const itemPositions = this._itemPositions;
        const isHorizontal = this.orientation === 'horizontal';
        // `itemPositions` are sorted by position while `activeDraggables` are sorted by child index
        // check if container is using some sort of "reverse" ordering (eg: flex-direction: row-reverse)
        const reversed = itemPositions[0].drag !== this._activeDraggables[0];
        if (reversed) {
            const lastItemRect = itemPositions[itemPositions.length - 1].clientRect;
            return isHorizontal ? pointerX >= lastItemRect.right : pointerY >= lastItemRect.bottom;
        }
        else {
            const firstItemRect = itemPositions[0].clientRect;
            return isHorizontal ? pointerX <= firstItemRect.left : pointerY <= firstItemRect.top;
        }
    }
    /**
     * Gets the index of an item in the drop container, based on the position of the user's pointer.
     * @param item Item that is being sorted.
     * @param pointerX Position of the user's pointer along the X axis.
     * @param pointerY Position of the user's pointer along the Y axis.
     * @param delta Direction in which the user is moving their pointer.
     */
    _getItemIndexFromPointerPosition(item, pointerX, pointerY, delta) {
        const isHorizontal = this.orientation === 'horizontal';
        const index = this._itemPositions.findIndex(({ drag, clientRect }) => {
            // Skip the item itself.
            if (drag === item) {
                return false;
            }
            if (delta) {
                const direction = isHorizontal ? delta.x : delta.y;
                // If the user is still hovering over the same item as last time, their cursor hasn't left
                // the item after we made the swap, and they didn't change the direction in which they're
                // dragging, we don't consider it a direction swap.
                if (drag === this._previousSwap.drag &&
                    this._previousSwap.overlaps &&
                    direction === this._previousSwap.delta) {
                    return false;
                }
            }
            return isHorizontal
                ? // Round these down since most browsers report client rects with
                    // sub-pixel precision, whereas the pointer coordinates are rounded to pixels.
                    pointerX >= Math.floor(clientRect.left) && pointerX < Math.floor(clientRect.right)
                : pointerY >= Math.floor(clientRect.top) && pointerY < Math.floor(clientRect.bottom);
        });
        return index === -1 || !this._sortPredicate(index, item) ? -1 : index;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2luZ2xlLWF4aXMtc29ydC1zdHJhdGVneS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL3NvcnRpbmcvc2luZ2xlLWF4aXMtc29ydC1zdHJhdGVneS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFJSCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzlDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxhQUFhLEVBQUUsb0JBQW9CLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQW1CeEY7Ozs7R0FJRztBQUNILE1BQU0sT0FBTyxzQkFBc0I7SUF1QmpDLFlBQW9CLGlCQUFxRDtRQUFyRCxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9DO1FBaEJ6RSxxRUFBcUU7UUFDN0QsbUJBQWMsR0FBa0MsRUFBRSxDQUFDO1FBUzNELCtDQUErQztRQUMvQyxnQkFBVyxHQUE4QixVQUFVLENBQUM7UUFPcEQ7Ozs7V0FJRztRQUNLLGtCQUFhLEdBQUc7WUFDdEIsSUFBSSxFQUFFLElBQXNCO1lBQzVCLEtBQUssRUFBRSxDQUFDO1lBQ1IsUUFBUSxFQUFFLEtBQUs7U0FDaEIsQ0FBQztJQVgwRSxDQUFDO0lBYTdFOzs7T0FHRztJQUNILEtBQUssQ0FBQyxLQUF5QjtRQUM3QixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3hCLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxJQUFJLENBQUMsSUFBYSxFQUFFLFFBQWdCLEVBQUUsUUFBZ0IsRUFBRSxZQUFvQztRQUMxRixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDO1FBQ3JDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFB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QUFDLENBQUMsQ0FBQztRQUVILE9BQU8sS0FBSyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7SUFDeEUsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aW9ufSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge0RyYWdEcm9wUmVnaXN0cnl9IGZyb20gJy4uL2RyYWctZHJvcC1yZWdpc3RyeSc7XG5pbXBvcnQge21vdmVJdGVtSW5BcnJheX0gZnJvbSAnLi4vZHJhZy11dGlscyc7XG5pbXBvcnQge2NvbWJpbmVUcmFuc2Zvcm1zfSBmcm9tICcuLi9kb20vc3R5bGluZyc7XG5pbXBvcnQge2FkanVzdERvbVJlY3QsIGdldE11dGFibGVDbGllbnRSZWN0LCBpc0luc2lkZUNsaWVudFJlY3R9IGZyb20gJy4uL2RvbS9kb20tcmVjdCc7XG5pbXBvcnQge0Ryb3BMaXN0U29ydFN0cmF0ZWd5LCBTb3J0UHJlZGljYXRlfSBmcm9tICcuL2Ryb3AtbGlzdC1zb3J0LXN0cmF0ZWd5JztcbmltcG9ydCB0eXBlIHtEcmFnUmVmfSBmcm9tICcuLi9kcmFnLXJlZic7XG5cbi8qKlxuICogRW50cnkgaW4gdGhlIHBvc2l0aW9uIGNhY2hlIGZvciBkcmFnZ2FibGUgaXRlbXMuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmludGVyZmFjZSBDYWNoZWRJdGVtUG9zaXRpb248VD4ge1xuICAvKiogSW5zdGFuY2Ugb2YgdGhlIGRyYWcgaXRlbS4gKi9cbiAgZHJhZzogVDtcbiAgLyoqIERpbWVuc2lvbnMgb2YgdGhlIGl0ZW0uICovXG4gIGNsaWVudFJlY3Q6IERPTVJlY3Q7XG4gIC8qKiBBbW91bnQgYnkgd2hpY2ggdGhlIGl0ZW0gaGFzIGJlZW4gbW92ZWQgc2luY2UgZHJhZ2dpbmcgc3RhcnRlZC4gKi9cbiAgb2Zmc2V0OiBudW1iZXI7XG4gIC8qKiBJbmxpbmUgdHJhbnNmb3JtIHRoYXQgdGhlIGRyYWcgaXRlbSBoYWQgd2hlbiBkcmFnZ2luZyBzdGFydGVkLiAqL1xuICBpbml0aWFsVHJhbnNmb3JtOiBzdHJpbmc7XG59XG5cbi8qKlxuICogU3RyYXRlZ3kgdGhhdCBvbmx5IHN1cHBvcnRzIHNvcnRpbmcgYWxvbmcgYSBzaW5nbGUgYXhpcy5cbiAqIEl0ZW1zIGFyZSByZW9yZGVyZWQgdXNpbmcgQ1NTIHRyYW5zZm9ybXMgd2hpY2ggYWxsb3dzIGZvciBzb3J0aW5nIHRvIGJlIGFuaW1hdGVkLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgY2xhc3MgU2luZ2xlQXhpc1NvcnRTdHJhdGVneSBpbXBsZW1lbnRzIERyb3BMaXN0U29ydFN0cmF0ZWd5IHtcbiAgLyoqIFJvb3QgZWxlbWVudCBjb250YWluZXIgb2YgdGhlIGRyb3AgbGlzdC4gKi9cbiAgcHJpdmF0ZSBfZWxlbWVudDogSFRNTEVsZW1lbnQ7XG5cbiAgLyoqIEZ1bmN0aW9uIHVzZWQgdG8gZGV0ZXJtaW5lIGlmIGFuIGl0ZW0gY2FuIGJlIHNvcnRlZCBpbnRvIGEgc3BlY2lmaWMgaW5kZXguICovXG4gIHByaXZhdGUgX3NvcnRQcmVkaWNhdGU6IFNvcnRQcmVkaWNhdGU8RHJhZ1JlZj47XG5cbiAgLyoqIENhY2hlIG9mIHRoZSBkaW1lbnNpb25zIG9mIGFsbCB0aGUgaXRlbXMgaW5zaWRlIHRoZSBjb250YWluZXIuICovXG4gIHByaXZhdGUgX2l0ZW1Qb3NpdGlvbnM6IENhY2hlZEl0ZW1Qb3NpdGlvbjxEcmFnUmVmPltdID0gW107XG5cbiAgLyoqXG4gICAqIERyYWdnYWJsZSBpdGVtcyB0aGF0IGFyZSBjdXJyZW50bHkgYWN0aXZlIGluc2lkZSB0aGUgY29udGFpbmVyLiBJbmNsdWRlcyB0aGUgaXRlbXNcbiAgICogdGhhdCB3ZXJlIHRoZXJlIGF0IHRoZSBzdGFydCBvZiB0aGUgc2VxdWVuY2UsIGFzIHdlbGwgYXMgYW55IGl0ZW1zIHRoYXQgaGF2ZSBiZWVuIGRyYWdnZWRcbiAgICogaW4sIGJ1dCBoYXZlbid0IGJlZW4gZHJvcHBlZCB5ZXQuXG4gICAqL1xuICBwcml2YXRlIF9hY3RpdmVEcmFnZ2FibGVzOiBEcmFnUmVmW107XG5cbiAgLyoqIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgbGlzdCBpcyBvcmllbnRlZC4gKi9cbiAgb3JpZW50YXRpb246ICd2ZXJ0aWNhbCcgfCAnaG9yaXpvbnRhbCcgPSAndmVydGljYWwnO1xuXG4gIC8qKiBMYXlvdXQgZGlyZWN0aW9uIG9mIHRoZSBkcm9wIGxpc3QuICovXG4gIGRpcmVjdGlvbjogRGlyZWN0aW9uO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2RyYWdEcm9wUmVnaXN0cnk6IERyYWdEcm9wUmVnaXN0cnk8RHJhZ1JlZiwgdW5rbm93bj4pIHt9XG5cbiAgLyoqXG4gICAqIEtlZXBzIHRyYWNrIG9mIHRoZSBpdGVtIHRoYXQgd2FzIGxhc3Qgc3dhcHBlZCB3aXRoIHRoZSBkcmFnZ2VkIGl0ZW0sIGFzIHdlbGwgYXMgd2hhdCBkaXJlY3Rpb25cbiAgICogdGhlIHBvaW50ZXIgd2FzIG1vdmluZyBpbiB3aGVuIHRoZSBzd2FwIG9jY3VycmVkIGFuZCB3aGV0aGVyIHRoZSB1c2VyJ3MgcG9pbnRlciBjb250aW51ZWQgdG9cbiAgICogb3ZlcmxhcCB3aXRoIHRoZSBzd2FwcGVkIGl0ZW0gYWZ0ZXIgdGhlIHN3YXBwaW5nIG9jY3VycmVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfcHJldmlvdXNTd2FwID0ge1xuICAgIGRyYWc6IG51bGwgYXMgRHJhZ1JlZiB8IG51bGwsXG4gICAgZGVsdGE6IDAsXG4gICAgb3ZlcmxhcHM6IGZhbHNlLFxuICB9O1xuXG4gIC8qKlxuICAgKiBUbyBiZSBjYWxsZWQgd2hlbiB0aGUgZHJhZyBzZXF1ZW5jZSBzdGFydHMuXG4gICAqIEBwYXJhbSBpdGVtcyBJdGVtcyB0aGF0IGFyZSBjdXJyZW50bHkgaW4gdGhlIGxpc3QuXG4gICAqL1xuICBzdGFydChpdGVtczogcmVhZG9ubHkgRHJhZ1JlZltdKSB7XG4gICAgdGhpcy53aXRoSXRlbXMoaXRlbXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRvIGJlIGNhbGxlZCB3aGVuIGFuIGl0ZW0gaXMgYmVpbmcgc29ydGVkLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRvIGJlIHNvcnRlZC5cbiAgICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKiBAcGFyYW0gcG9pbnRlckRlbHRhIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgcG9pbnRlciBpcyBtb3ZpbmcgYWxvbmcgZWFjaCBheGlzLlxuICAgKi9cbiAgc29ydChpdGVtOiBEcmFnUmVmLCBwb2ludGVyWDogbnVtYmVyLCBwb2ludGVyWTogbnVtYmVyLCBwb2ludGVyRGVsdGE6IHt4OiBudW1iZXI7IHk6IG51bWJlcn0pIHtcbiAgICBjb25zdCBzaWJsaW5ncyA9IHRoaXMuX2l0ZW1Qb3NpdGlvbnM7XG4gICAgY29uc3QgbmV3SW5kZXggPSB0aGlzLl9nZXRJdGVtSW5kZXhGcm9tUG9pbnRlclBvc2l0aW9uKGl0ZW0sIHBvaW50ZXJYLCBwb2ludGVyWSwgcG9pbnRlckRlbHRhKTtcblxuICAgIGlmIChuZXdJbmRleCA9PT0gLTEgJiYgc2libGluZ3MubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gdGhpcy5vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuICAgIGNvbnN0IGN1cnJlbnRJbmRleCA9IHNpYmxpbmdzLmZpbmRJbmRleChjdXJyZW50SXRlbSA9PiBjdXJyZW50SXRlbS5kcmFnID09PSBpdGVtKTtcbiAgICBjb25zdCBzaWJsaW5nQXROZXdQb3NpdGlvbiA9IHNpYmxpbmdzW25ld0luZGV4XTtcbiAgICBjb25zdCBjdXJyZW50UG9zaXRpb24gPSBzaWJsaW5nc1tjdXJyZW50SW5kZXhdLmNsaWVudFJlY3Q7XG4gICAgY29uc3QgbmV3UG9zaXRpb24gPSBzaWJsaW5nQXROZXdQb3NpdGlvbi5jbGllbnRSZWN0O1xuICAgIGNvbnN0IGRlbHRhID0gY3VycmVudEluZGV4ID4gbmV3SW5kZXggPyAxIDogLTE7XG5cbiAgICAvLyBIb3cgbWFueSBwaXhlbHMgdGhlIGl0ZW0ncyBwbGFjZWhvbGRlciBzaG91bGQgYmUgb2Zmc2V0LlxuICAgIGNvbnN0IGl0ZW1PZmZzZXQgPSB0aGlzLl9nZXRJdGVtT2Zmc2V0UHgoY3VycmVudFBvc2l0aW9uLCBuZXdQb3NpdGlvbiwgZGVsdGEpO1xuXG4gICAgLy8gSG93IG1hbnkgcGl4ZWxzIGFsbCB0aGUgb3RoZXIgaXRlbXMgc2hvdWxkIGJlIG9mZnNldC5cbiAgICBjb25zdCBzaWJsaW5nT2Zmc2V0ID0gdGhpcy5fZ2V0U2libGluZ09mZnNldFB4KGN1cnJlbnRJbmRleCwgc2libGluZ3MsIGRlbHRhKTtcblxuICAgIC8vIFNhdmUgdGhlIHByZXZpb3VzIG9yZGVyIG9mIHRoZSBpdGVtcyBiZWZvcmUgbW92aW5nIHRoZSBpdGVtIHRvIGl0cyBuZXcgaW5kZXguXG4gICAgLy8gV2UgdXNlIHRoaXMgdG8gY2hlY2sgd2hldGhlciBhbiBpdGVtIGhhcyBiZWVuIG1vdmVkIGFzIGEgcmVzdWx0IG9mIHRoZSBzb3J0aW5nLlxuICAgIGNvbnN0IG9sZE9yZGVyID0gc2libGluZ3Muc2xpY2UoKTtcblxuICAgIC8vIFNodWZmbGUgdGhlIGFycmF5IGluIHBsYWNlLlxuICAgIG1vdmVJdGVtSW5BcnJheShzaWJsaW5ncywgY3VycmVudEluZGV4LCBuZXdJbmRleCk7XG5cbiAgICBzaWJsaW5ncy5mb3JFYWNoKChzaWJsaW5nLCBpbmRleCkgPT4ge1xuICAgICAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgdGhlIHBvc2l0aW9uIGhhc24ndCBjaGFuZ2VkLlxuICAgICAgaWYgKG9sZE9yZGVyW2luZGV4XSA9PT0gc2libGluZykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGlzRHJhZ2dlZEl0ZW0gPSBzaWJsaW5nLmRyYWcgPT09IGl0ZW07XG4gICAgICBjb25zdCBvZmZzZXQgPSBpc0RyYWdnZWRJdGVtID8gaXRlbU9mZnNldCA6IHNpYmxpbmdPZmZzZXQ7XG4gICAgICBjb25zdCBlbGVtZW50VG9PZmZzZXQgPSBpc0RyYWdnZWRJdGVtXG4gICAgICAgID8gaXRlbS5nZXRQbGFjZWhvbGRlckVsZW1lbnQoKVxuICAgICAgICA6IHNpYmxpbmcuZHJhZy5nZXRSb290RWxlbWVudCgpO1xuXG4gICAgICAvLyBVcGRhdGUgdGhlIG9mZnNldCB0byByZWZsZWN0IHRoZSBuZXcgcG9zaXRpb24uXG4gICAgICBzaWJsaW5nLm9mZnNldCArPSBvZmZzZXQ7XG5cbiAgICAgIC8vIFNpbmNlIHdlJ3JlIG1vdmluZyB0aGUgaXRlbXMgd2l0aCBhIGB0cmFuc2Zvcm1gLCB3ZSBuZWVkIHRvIGFkanVzdCB0aGVpciBjYWNoZWRcbiAgICAgIC8vIGNsaWVudCByZWN0cyB0byByZWZsZWN0IHRoZWlyIG5ldyBwb3NpdGlvbiwgYXMgd2VsbCBhcyBzd2FwIHRoZWlyIHBvc2l0aW9ucyBpbiB0aGUgY2FjaGUuXG4gICAgICAvLyBOb3RlIHRoYXQgd2Ugc2hvdWxkbid0IHVzZSBgZ2V0Qm91bmRpbmdDbGllbnRSZWN0YCBoZXJlIHRvIHVwZGF0ZSB0aGUgY2FjaGUsIGJlY2F1c2UgdGhlXG4gICAgICAvLyBlbGVtZW50cyBtYXkgYmUgbWlkLWFuaW1hdGlvbiB3aGljaCB3aWxsIGdpdmUgdXMgYSB3cm9uZyByZXN1bHQuXG4gICAgICBpZiAoaXNIb3Jpem9udGFsKSB7XG4gICAgICAgIC8vIFJvdW5kIHRoZSB0cmFuc2Zvcm1zIHNpbmNlIHNvbWUgYnJvd3NlcnMgd2lsbFxuICAgICAgICAvLyBibHVyIHRoZSBlbGVtZW50cywgZm9yIHN1Yi1waXhlbCB0cmFuc2Zvcm1zLlxuICAgICAgICBlbGVtZW50VG9PZmZzZXQuc3R5bGUudHJhbnNmb3JtID0gY29tYmluZVRyYW5zZm9ybXMoXG4gICAgICAgICAgYHRyYW5zbGF0ZTNkKCR7TWF0aC5yb3VuZChzaWJsaW5nLm9mZnNldCl9cHgsIDAsIDApYCxcbiAgICAgICAgICBzaWJsaW5nLmluaXRpYWxUcmFuc2Zvcm0sXG4gICAgICAgICk7XG4gICAgICAgIGFkanVzdERvbVJlY3Qoc2libGluZy5jbGllbnRSZWN0LCAwLCBvZmZzZXQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWxlbWVudFRvT2Zmc2V0LnN0eWxlLnRyYW5zZm9ybSA9IGNvbWJpbmVUcmFuc2Zvcm1zKFxuICAgICAgICAgIGB0cmFuc2xhdGUzZCgwLCAke01hdGgucm91bmQoc2libGluZy5vZmZzZXQpfXB4LCAwKWAsXG4gICAgICAgICAgc2libGluZy5pbml0aWFsVHJhbnNmb3JtLFxuICAgICAgICApO1xuICAgICAgICBhZGp1c3REb21SZWN0KHNpYmxpbmcuY2xpZW50UmVjdCwgb2Zmc2V0LCAwKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIE5vdGUgdGhhdCBpdCdzIGltcG9ydGFudCB0aGF0IHdlIGRvIHRoaXMgYWZ0ZXIgdGhlIGNsaWVudCByZWN0cyBoYXZlIGJlZW4gYWRqdXN0ZWQuXG4gICAgdGhpcy5fcHJldmlvdXNTd2FwLm92ZXJsYXBzID0gaXNJbnNpZGVDbGllbnRSZWN0KG5ld1Bvc2l0aW9uLCBwb2ludGVyWCwgcG9pbnRlclkpO1xuICAgIHRoaXMuX3ByZXZpb3VzU3dhcC5kcmFnID0gc2libGluZ0F0TmV3UG9zaXRpb24uZHJhZztcbiAgICB0aGlzLl9wcmV2aW91c1N3YXAuZGVsdGEgPSBpc0hvcml6b250YWwgPyBwb2ludGVyRGVsdGEueCA6IHBvaW50ZXJEZWx0YS55O1xuXG4gICAgcmV0dXJuIHtwcmV2aW91c0luZGV4OiBjdXJyZW50SW5kZXgsIGN1cnJlbnRJbmRleDogbmV3SW5kZXh9O1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCB3aGVuIGFuIGl0ZW0gaXMgYmVpbmcgbW92ZWQgaW50byB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRoYXQgd2FzIG1vdmVkIGludG8gdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKiBAcGFyYW0gaW5kZXggSW5kZXggYXQgd2hpY2ggdGhlIGl0ZW0gZW50ZXJlZC4gSWYgb21pdHRlZCwgdGhlIGNvbnRhaW5lciB3aWxsIHRyeSB0byBmaWd1cmUgaXRcbiAgICogICBvdXQgYXV0b21hdGljYWxseS5cbiAgICovXG4gIGVudGVyKGl0ZW06IERyYWdSZWYsIHBvaW50ZXJYOiBudW1iZXIsIHBvaW50ZXJZOiBudW1iZXIsIGluZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gICAgY29uc3QgbmV3SW5kZXggPVxuICAgICAgaW5kZXggPT0gbnVsbCB8fCBpbmRleCA8IDBcbiAgICAgICAgPyAvLyBXZSB1c2UgdGhlIGNvb3JkaW5hdGVzIG9mIHdoZXJlIHRoZSBpdGVtIGVudGVyZWQgdGhlIGRyb3BcbiAgICAgICAgICAvLyB6b25lIHRvIGZpZ3VyZSBvdXQgYXQgd2hpY2ggaW5kZXggaXQgc2hvdWxkIGJlIGluc2VydGVkLlxuICAgICAgICAgIHRoaXMuX2dldEl0ZW1JbmRleEZyb21Qb2ludGVyUG9zaXRpb24oaXRlbSwgcG9pbnRlclgsIHBvaW50ZXJZKVxuICAgICAgICA6IGluZGV4O1xuXG4gICAgY29uc3QgYWN0aXZlRHJhZ2dhYmxlcyA9IHRoaXMuX2FjdGl2ZURyYWdnYWJsZXM7XG4gICAgY29uc3QgY3VycmVudEluZGV4ID0gYWN0aXZlRHJhZ2dhYmxlcy5pbmRleE9mKGl0ZW0pO1xuICAgIGNvbnN0IHBsYWNlaG9sZGVyID0gaXRlbS5nZXRQbGFjZWhvbGRlckVsZW1lbnQoKTtcbiAgICBsZXQgbmV3UG9zaXRpb25SZWZlcmVuY2U6IERyYWdSZWYgfCB1bmRlZmluZWQgPSBhY3RpdmVEcmFnZ2FibGVzW25ld0luZGV4XTtcblxuICAgIC8vIElmIHRoZSBpdGVtIGF0IHRoZSBuZXcgcG9zaXRpb24gaXMgdGhlIHNhbWUgYXMgdGhlIGl0ZW0gdGhhdCBpcyBiZWluZyBkcmFnZ2VkLFxuICAgIC8vIGl0IG1lYW5zIHRoYXQgd2UncmUgdHJ5aW5nIHRvIHJlc3RvcmUgdGhlIGl0ZW0gdG8gaXRzIGluaXRpYWwgcG9zaXRpb24uIEluIHRoaXNcbiAgICAvLyBjYXNlIHdlIHNob3VsZCB1c2UgdGhlIG5leHQgaXRlbSBmcm9tIHRoZSBsaXN0IGFzIHRoZSByZWZlcmVuY2UuXG4gICAgaWYgKG5ld1Bvc2l0aW9uUmVmZXJlbmNlID09PSBpdGVtKSB7XG4gICAgICBuZXdQb3NpdGlvblJlZmVyZW5jZSA9IGFjdGl2ZURyYWdnYWJsZXNbbmV3SW5kZXggKyAxXTtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSBkaWRuJ3QgZmluZCBhIG5ldyBwb3NpdGlvbiByZWZlcmVuY2UsIGl0IG1lYW5zIHRoYXQgZWl0aGVyIHRoZSBpdGVtIGRpZG4ndCBzdGFydCBvZmZcbiAgICAvLyBpbiB0aGlzIGNvbnRhaW5lciwgb3IgdGhhdCB0aGUgaXRlbSByZXF1ZXN0ZWQgdG8gYmUgaW5zZXJ0ZWQgYXQgdGhlIGVuZCBvZiB0aGUgbGlzdC5cbiAgICBpZiAoXG4gICAgICAhbmV3UG9zaXRpb25SZWZlcmVuY2UgJiZcbiAgICAgIChuZXdJbmRleCA9PSBudWxsIHx8IG5ld0luZGV4ID09PSAtMSB8fCBuZXdJbmRleCA8IGFjdGl2ZURyYWdnYWJsZXMubGVuZ3RoIC0gMSkgJiZcbiAgICAgIHRoaXMuX3Nob3VsZEVudGVyQXNGaXJzdENoaWxkKHBvaW50ZXJYLCBwb2ludGVyWSlcbiAgICApIHtcbiAgICAgIG5ld1Bvc2l0aW9uUmVmZXJlbmNlID0gYWN0aXZlRHJhZ2dhYmxlc1swXTtcbiAgICB9XG5cbiAgICAvLyBTaW5jZSB0aGUgaXRlbSBtYXkgYmUgaW4gdGhlIGBhY3RpdmVEcmFnZ2FibGVzYCBhbHJlYWR5IChlLmcuIGlmIHRoZSB1c2VyIGRyYWdnZWQgaXRcbiAgICAvLyBpbnRvIGFub3RoZXIgY29udGFpbmVyIGFuZCBiYWNrIGFnYWluKSwgd2UgaGF2ZSB0byBlbnN1cmUgdGhhdCBpdCBpc24ndCBkdXBsaWNhdGVkLlxuICAgIGlmIChjdXJyZW50SW5kZXggPiAtMSkge1xuICAgICAgYWN0aXZlRHJhZ2dhYmxlcy5zcGxpY2UoY3VycmVudEluZGV4LCAxKTtcbiAgICB9XG5cbiAgICAvLyBEb24ndCB1c2UgaXRlbXMgdGhhdCBhcmUgYmVpbmcgZHJhZ2dlZCBhcyBhIHJlZmVyZW5jZSwgYmVjYXVzZVxuICAgIC8vIHRoZWlyIGVsZW1lbnQgaGFzIGJlZW4gbW92ZWQgZG93biB0byB0aGUgYm90dG9tIG9mIHRoZSBib2R5LlxuICAgIGlmIChuZXdQb3NpdGlvblJlZmVyZW5jZSAmJiAhdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5pc0RyYWdnaW5nKG5ld1Bvc2l0aW9uUmVmZXJlbmNlKSkge1xuICAgICAgY29uc3QgZWxlbWVudCA9IG5ld1Bvc2l0aW9uUmVmZXJlbmNlLmdldFJvb3RFbGVtZW50KCk7XG4gICAgICBlbGVtZW50LnBhcmVudEVsZW1lbnQhLmluc2VydEJlZm9yZShwbGFjZWhvbGRlciwgZWxlbWVudCk7XG4gICAgICBhY3RpdmVEcmFnZ2FibGVzLnNwbGljZShuZXdJbmRleCwgMCwgaXRlbSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2VsZW1lbnQuYXBwZW5kQ2hpbGQocGxhY2Vob2xkZXIpO1xuICAgICAgYWN0aXZlRHJhZ2dhYmxlcy5wdXNoKGl0ZW0pO1xuICAgIH1cblxuICAgIC8vIFRoZSB0cmFuc2Zvcm0gbmVlZHMgdG8gYmUgY2xlYXJlZCBzbyBpdCBkb2Vzbid0IHRocm93IG9mZiB0aGUgbWVhc3VyZW1lbnRzLlxuICAgIHBsYWNlaG9sZGVyLnN0eWxlLnRyYW5zZm9ybSA9ICcnO1xuXG4gICAgLy8gTm90ZSB0aGF0IHVzdWFsbHkgYHN0YXJ0YCBpcyBjYWxsZWQgdG9nZXRoZXIgd2l0aCBgZW50ZXJgIHdoZW4gYW4gaXRlbSBnb2VzIGludG8gYSBuZXdcbiAgICAvLyBjb250YWluZXIuIFRoaXMgd2lsbCBjYWNoZSBpdGVtIHBvc2l0aW9ucywgYnV0IHdlIG5lZWQgdG8gcmVmcmVzaCB0aGVtIHNpbmNlIHRoZSBhbW91bnRcbiAgICAvLyBvZiBpdGVtcyBoYXMgY2hhbmdlZC5cbiAgICB0aGlzLl9jYWNoZUl0ZW1Qb3NpdGlvbnMoKTtcbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBpdGVtcyB0aGF0IGFyZSBjdXJyZW50bHkgcGFydCBvZiB0aGUgbGlzdC4gKi9cbiAgd2l0aEl0ZW1zKGl0ZW1zOiByZWFkb25seSBEcmFnUmVmW10pOiB2b2lkIHtcbiAgICB0aGlzLl9hY3RpdmVEcmFnZ2FibGVzID0gaXRlbXMuc2xpY2UoKTtcbiAgICB0aGlzLl9jYWNoZUl0ZW1Qb3NpdGlvbnMoKTtcbiAgfVxuXG4gIC8qKiBBc3NpZ25zIGEgc29ydCBwcmVkaWNhdGUgdG8gdGhlIHN0cmF0ZWd5LiAqL1xuICB3aXRoU29ydFByZWRpY2F0ZShwcmVkaWNhdGU6IFNvcnRQcmVkaWNhdGU8RHJhZ1JlZj4pOiB2b2lkIHtcbiAgICB0aGlzLl9zb3J0UHJlZGljYXRlID0gcHJlZGljYXRlO1xuICB9XG5cbiAgLyoqIFJlc2V0cyB0aGUgc3RyYXRlZ3kgdG8gaXRzIGluaXRpYWwgc3RhdGUgYmVmb3JlIGRyYWdnaW5nIHdhcyBzdGFydGVkLiAqL1xuICByZXNldCgpIHtcbiAgICAvLyBUT0RPKGNyaXNiZXRvKTogbWF5IGhhdmUgdG8gd2FpdCBmb3IgdGhlIGFuaW1hdGlvbnMgdG8gZmluaXNoLlxuICAgIHRoaXMuX2FjdGl2ZURyYWdnYWJsZXM/LmZvckVhY2goaXRlbSA9PiB7XG4gICAgICBjb25zdCByb290RWxlbWVudCA9IGl0ZW0uZ2V0Um9vdEVsZW1lbnQoKTtcblxuICAgICAgaWYgKHJvb3RFbGVtZW50KSB7XG4gICAgICAgIGNvbnN0IGluaXRpYWxUcmFuc2Zvcm0gPSB0aGlzLl9pdGVtUG9zaXRpb25zLmZpbmQocCA9PiBwLmRyYWcgPT09IGl0ZW0pPy5pbml0aWFsVHJhbnNmb3JtO1xuICAgICAgICByb290RWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSBpbml0aWFsVHJhbnNmb3JtIHx8ICcnO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5faXRlbVBvc2l0aW9ucyA9IFtdO1xuICAgIHRoaXMuX2FjdGl2ZURyYWdnYWJsZXMgPSBbXTtcbiAgICB0aGlzLl9wcmV2aW91c1N3YXAuZHJhZyA9IG51bGw7XG4gICAgdGhpcy5fcHJldmlvdXNTd2FwLmRlbHRhID0gMDtcbiAgICB0aGlzLl9wcmV2aW91c1N3YXAub3ZlcmxhcHMgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgc25hcHNob3Qgb2YgaXRlbXMgY3VycmVudGx5IGluIHRoZSBsaXN0LlxuICAgKiBDYW4gaW5jbHVkZSBpdGVtcyB0aGF0IHdlIGRyYWdnZWQgaW4gZnJvbSBhbm90aGVyIGxpc3QuXG4gICAqL1xuICBnZXRBY3RpdmVJdGVtc1NuYXBzaG90KCk6IHJlYWRvbmx5IERyYWdSZWZbXSB7XG4gICAgcmV0dXJuIHRoaXMuX2FjdGl2ZURyYWdnYWJsZXM7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgaW5kZXggb2YgYSBzcGVjaWZpYyBpdGVtLiAqL1xuICBnZXRJdGVtSW5kZXgoaXRlbTogRHJhZ1JlZik6IG51bWJlciB7XG4gICAgLy8gSXRlbXMgYXJlIHNvcnRlZCBhbHdheXMgYnkgdG9wL2xlZnQgaW4gdGhlIGNhY2hlLCBob3dldmVyIHRoZXkgZmxvdyBkaWZmZXJlbnRseSBpbiBSVEwuXG4gICAgLy8gVGhlIHJlc3Qgb2YgdGhlIGxvZ2ljIHN0aWxsIHN0YW5kcyBubyBtYXR0ZXIgd2hhdCBvcmllbnRhdGlvbiB3ZSdyZSBpbiwgaG93ZXZlclxuICAgIC8vIHdlIG5lZWQgdG8gaW52ZXJ0IHRoZSBhcnJheSB3aGVuIGRldGVybWluaW5nIHRoZSBpbmRleC5cbiAgICBjb25zdCBpdGVtcyA9XG4gICAgICB0aGlzLm9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcgJiYgdGhpcy5kaXJlY3Rpb24gPT09ICdydGwnXG4gICAgICAgID8gdGhpcy5faXRlbVBvc2l0aW9ucy5zbGljZSgpLnJldmVyc2UoKVxuICAgICAgICA6IHRoaXMuX2l0ZW1Qb3NpdGlvbnM7XG5cbiAgICByZXR1cm4gaXRlbXMuZmluZEluZGV4KGN1cnJlbnRJdGVtID0+IGN1cnJlbnRJdGVtLmRyYWcgPT09IGl0ZW0pO1xuICB9XG5cbiAgLyoqIFVzZWQgdG8gbm90aWZ5IHRoZSBzdHJhdGVneSB0aGF0IHRoZSBzY3JvbGwgcG9zaXRpb24gaGFzIGNoYW5nZWQuICovXG4gIHVwZGF0ZU9uU2Nyb2xsKHRvcERpZmZlcmVuY2U6IG51bWJlciwgbGVmdERpZmZlcmVuY2U6IG51bWJlcikge1xuICAgIC8vIFNpbmNlIHdlIGtub3cgdGhlIGFtb3VudCB0aGF0IHRoZSB1c2VyIGhhcyBzY3JvbGxlZCB3ZSBjYW4gc2hpZnQgYWxsIG9mIHRoZVxuICAgIC8vIGNsaWVudCByZWN0YW5nbGVzIG91cnNlbHZlcy4gVGhpcyBpcyBjaGVhcGVyIHRoYW4gcmUtbWVhc3VyaW5nIGV2ZXJ5dGhpbmcgYW5kXG4gICAgLy8gd2UgY2FuIGF2b2lkIGluY29uc2lzdGVudCBiZWhhdmlvciB3aGVyZSB3ZSBtaWdodCBiZSBtZWFzdXJpbmcgdGhlIGVsZW1lbnQgYmVmb3JlXG4gICAgLy8gaXRzIHBvc2l0aW9uIGhhcyBjaGFuZ2VkLlxuICAgIHRoaXMuX2l0ZW1Qb3NpdGlvbnMuZm9yRWFjaCgoe2NsaWVudFJlY3R9KSA9PiB7XG4gICAgICBhZGp1c3REb21SZWN0KGNsaWVudFJlY3QsIHRvcERpZmZlcmVuY2UsIGxlZnREaWZmZXJlbmNlKTtcbiAgICB9KTtcblxuICAgIC8vIFdlIG5lZWQgdHdvIGxvb3BzIGZvciB0aGlzLCBiZWNhdXNlIHdlIHdhbnQgYWxsIG9mIHRoZSBjYWNoZWRcbiAgICAvLyBwb3NpdGlvbnMgdG8gYmUgdXAtdG8tZGF0ZSBiZWZvcmUgd2UgcmUtc29ydCB0aGUgaXRlbS5cbiAgICB0aGlzLl9pdGVtUG9zaXRpb25zLmZvckVhY2goKHtkcmFnfSkgPT4ge1xuICAgICAgaWYgKHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuaXNEcmFnZ2luZyhkcmFnKSkge1xuICAgICAgICAvLyBXZSBuZWVkIHRvIHJlLXNvcnQgdGhlIGl0ZW0gbWFudWFsbHksIGJlY2F1c2UgdGhlIHBvaW50ZXIgbW92ZVxuICAgICAgICAvLyBldmVudHMgd29uJ3QgYmUgZGlzcGF0Y2hlZCB3aGlsZSB0aGUgdXNlciBpcyBzY3JvbGxpbmcuXG4gICAgICAgIGRyYWcuX3NvcnRGcm9tTGFzdFBvaW50ZXJQb3NpdGlvbigpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgd2l0aEVsZW1lbnRDb250YWluZXIoY29udGFpbmVyOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIHRoaXMuX2VsZW1lbnQgPSBjb250YWluZXI7XG4gIH1cblxuICAvKiogUmVmcmVzaGVzIHRoZSBwb3NpdGlvbiBjYWNoZSBvZiB0aGUgaXRlbXMgYW5kIHNpYmxpbmcgY29udGFpbmVycy4gKi9cbiAgcHJpdmF0ZSBfY2FjaGVJdGVtUG9zaXRpb25zKCkge1xuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IHRoaXMub3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJztcblxuICAgIHRoaXMuX2l0ZW1Qb3NpdGlvbnMgPSB0aGlzLl9hY3RpdmVEcmFnZ2FibGVzXG4gICAgICAubWFwKGRyYWcgPT4ge1xuICAgICAgICBjb25zdCBlbGVtZW50VG9NZWFzdXJlID0gZHJhZy5nZXRWaXNpYmxlRWxlbWVudCgpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGRyYWcsXG4gICAgICAgICAgb2Zmc2V0OiAwLFxuICAgICAgICAgIGluaXRpYWxUcmFuc2Zvcm06IGVsZW1lbnRUb01lYXN1cmUuc3R5bGUudHJhbnNmb3JtIHx8ICcnLFxuICAgICAgICAgIGNsaWVudFJlY3Q6IGdldE11dGFibGVDbGllbnRSZWN0KGVsZW1lbnRUb01lYXN1cmUpLFxuICAgICAgICB9O1xuICAgICAgfSlcbiAgICAgIC5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgIHJldHVybiBpc0hvcml6b250YWxcbiAgICAgICAgICA/IGEuY2xpZW50UmVjdC5sZWZ0IC0gYi5jbGllbnRSZWN0LmxlZnRcbiAgICAgICAgICA6IGEuY2xpZW50UmVjdC50b3AgLSBiLmNsaWVudFJlY3QudG9wO1xuICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgb2Zmc2V0IGluIHBpeGVscyBieSB3aGljaCB0aGUgaXRlbSB0aGF0IGlzIGJlaW5nIGRyYWdnZWQgc2hvdWxkIGJlIG1vdmVkLlxuICAgKiBAcGFyYW0gY3VycmVudFBvc2l0aW9uIEN1cnJlbnQgcG9zaXRpb24gb2YgdGhlIGl0ZW0uXG4gICAqIEBwYXJhbSBuZXdQb3NpdGlvbiBQb3NpdGlvbiBvZiB0aGUgaXRlbSB3aGVyZSB0aGUgY3VycmVudCBpdGVtIHNob3VsZCBiZSBtb3ZlZC5cbiAgICogQHBhcmFtIGRlbHRhIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgdXNlciBpcyBtb3ZpbmcuXG4gICAqL1xuICBwcml2YXRlIF9nZXRJdGVtT2Zmc2V0UHgoY3VycmVudFBvc2l0aW9uOiBET01SZWN0LCBuZXdQb3NpdGlvbjogRE9NUmVjdCwgZGVsdGE6IDEgfCAtMSkge1xuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IHRoaXMub3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJztcbiAgICBsZXQgaXRlbU9mZnNldCA9IGlzSG9yaXpvbnRhbFxuICAgICAgPyBuZXdQb3NpdGlvbi5sZWZ0IC0gY3VycmVudFBvc2l0aW9uLmxlZnRcbiAgICAgIDogbmV3UG9zaXRpb24udG9wIC0gY3VycmVudFBvc2l0aW9uLnRvcDtcblxuICAgIC8vIEFjY291bnQgZm9yIGRpZmZlcmVuY2VzIGluIHRoZSBpdGVtIHdpZHRoL2hlaWdodC5cbiAgICBpZiAoZGVsdGEgPT09IC0xKSB7XG4gICAgICBpdGVtT2Zmc2V0ICs9IGlzSG9yaXpvbnRhbFxuICAgICAgICA/IG5ld1Bvc2l0aW9uLndpZHRoIC0gY3VycmVudFBvc2l0aW9uLndpZHRoXG4gICAgICAgIDogbmV3UG9zaXRpb24uaGVpZ2h0IC0gY3VycmVudFBvc2l0aW9uLmhlaWdodDtcbiAgICB9XG5cbiAgICByZXR1cm4gaXRlbU9mZnNldDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBvZmZzZXQgaW4gcGl4ZWxzIGJ5IHdoaWNoIHRoZSBpdGVtcyB0aGF0IGFyZW4ndCBiZWluZyBkcmFnZ2VkIHNob3VsZCBiZSBtb3ZlZC5cbiAgICogQHBhcmFtIGN1cnJlbnRJbmRleCBJbmRleCBvZiB0aGUgaXRlbSBjdXJyZW50bHkgYmVpbmcgZHJhZ2dlZC5cbiAgICogQHBhcmFtIHNpYmxpbmdzIEFsbCBvZiB0aGUgaXRlbXMgaW4gdGhlIGxpc3QuXG4gICAqIEBwYXJhbSBkZWx0YSBEaXJlY3Rpb24gaW4gd2hpY2ggdGhlIHVzZXIgaXMgbW92aW5nLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0U2libGluZ09mZnNldFB4KFxuICAgIGN1cnJlbnRJbmRleDogbnVtYmVyLFxuICAgIHNpYmxpbmdzOiBDYWNoZWRJdGVtUG9zaXRpb248RHJhZ1JlZj5bXSxcbiAgICBkZWx0YTogMSB8IC0xLFxuICApIHtcbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLm9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCc7XG4gICAgY29uc3QgY3VycmVudFBvc2l0aW9uID0gc2libGluZ3NbY3VycmVudEluZGV4XS5jbGllbnRSZWN0O1xuICAgIGNvbnN0IGltbWVkaWF0ZVNpYmxpbmcgPSBzaWJsaW5nc1tjdXJyZW50SW5kZXggKyBkZWx0YSAqIC0xXTtcbiAgICBsZXQgc2libGluZ09mZnNldCA9IGN1cnJlbnRQb3NpdGlvbltpc0hvcml6b250YWwgPyAnd2lkdGgnIDogJ2hlaWdodCddICogZGVsdGE7XG5cbiAgICBpZiAoaW1tZWRpYXRlU2libGluZykge1xuICAgICAgY29uc3Qgc3RhcnQgPSBpc0hvcml6b250YWwgPyAnbGVmdCcgOiAndG9wJztcbiAgICAgIGNvbnN0IGVuZCA9IGlzSG9yaXpvbnRhbCA/ICdyaWdodCcgOiAnYm90dG9tJztcblxuICAgICAgLy8gR2V0IHRoZSBzcGFjaW5nIGJldHdlZW4gdGhlIHN0YXJ0IG9mIHRoZSBjdXJyZW50IGl0ZW0gYW5kIHRoZSBlbmQgb2YgdGhlIG9uZSBpbW1lZGlhdGVseVxuICAgICAgLy8gYWZ0ZXIgaXQgaW4gdGhlIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgdXNlciBpcyBkcmFnZ2luZywgb3IgdmljZSB2ZXJzYS4gV2UgYWRkIGl0IHRvIHRoZVxuICAgICAgLy8gb2Zmc2V0IGluIG9yZGVyIHRvIHB1c2ggdGhlIGVsZW1lbnQgdG8gd2hlcmUgaXQgd2lsbCBiZSB3aGVuIGl0J3MgaW5saW5lIGFuZCBpcyBpbmZsdWVuY2VkXG4gICAgICAvLyBieSB0aGUgYG1hcmdpbmAgb2YgaXRzIHNpYmxpbmdzLlxuICAgICAgaWYgKGRlbHRhID09PSAtMSkge1xuICAgICAgICBzaWJsaW5nT2Zmc2V0IC09IGltbWVkaWF0ZVNpYmxpbmcuY2xpZW50UmVjdFtzdGFydF0gLSBjdXJyZW50UG9zaXRpb25bZW5kXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNpYmxpbmdPZmZzZXQgKz0gY3VycmVudFBvc2l0aW9uW3N0YXJ0XSAtIGltbWVkaWF0ZVNpYmxpbmcuY2xpZW50UmVjdFtlbmRdO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzaWJsaW5nT2Zmc2V0O1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBwb2ludGVyIGlzIGVudGVyaW5nIGluIHRoZSBmaXJzdCBwb3NpdGlvblxuICAgKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIFkgYXhpcy5cbiAgICovXG4gIHByaXZhdGUgX3Nob3VsZEVudGVyQXNGaXJzdENoaWxkKHBvaW50ZXJYOiBudW1iZXIsIHBvaW50ZXJZOiBudW1iZXIpIHtcbiAgICBpZiAoIXRoaXMuX2FjdGl2ZURyYWdnYWJsZXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgaXRlbVBvc2l0aW9ucyA9IHRoaXMuX2l0ZW1Qb3NpdGlvbnM7XG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gdGhpcy5vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuXG4gICAgLy8gYGl0ZW1Qb3NpdGlvbnNgIGFyZSBzb3J0ZWQgYnkgcG9zaXRpb24gd2hpbGUgYGFjdGl2ZURyYWdnYWJsZXNgIGFyZSBzb3J0ZWQgYnkgY2hpbGQgaW5kZXhcbiAgICAvLyBjaGVjayBpZiBjb250YWluZXIgaXMgdXNpbmcgc29tZSBzb3J0IG9mIFwicmV2ZXJzZVwiIG9yZGVyaW5nIChlZzogZmxleC1kaXJlY3Rpb246IHJvdy1yZXZlcnNlKVxuICAgIGNvbnN0IHJldmVyc2VkID0gaXRlbVBvc2l0aW9uc1swXS5kcmFnICE9PSB0aGlzLl9hY3RpdmVEcmFnZ2FibGVzWzBdO1xuICAgIGlmIChyZXZlcnNlZCkge1xuICAgICAgY29uc3QgbGFzdEl0ZW1SZWN0ID0gaXRlbVBvc2l0aW9uc1tpdGVtUG9zaXRpb25zLmxlbmd0aCAtIDFdLmNsaWVudFJlY3Q7XG4gICAgICByZXR1cm4gaXNIb3Jpem9udGFsID8gcG9pbnRlclggPj0gbGFzdEl0ZW1SZWN0LnJpZ2h0IDogcG9pbnRlclkgPj0gbGFzdEl0ZW1SZWN0LmJvdHRvbTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZmlyc3RJdGVtUmVjdCA9IGl0ZW1Qb3NpdGlvbnNbMF0uY2xpZW50UmVjdDtcbiAgICAgIHJldHVybiBpc0hvcml6b250YWwgPyBwb2ludGVyWCA8PSBmaXJzdEl0ZW1SZWN0LmxlZnQgOiBwb2ludGVyWSA8PSBmaXJzdEl0ZW1SZWN0LnRvcDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW5kZXggb2YgYW4gaXRlbSBpbiB0aGUgZHJvcCBjb250YWluZXIsIGJhc2VkIG9uIHRoZSBwb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdGhhdCBpcyBiZWluZyBzb3J0ZWQuXG4gICAqIEBwYXJhbSBwb2ludGVyWCBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHBvaW50ZXJZIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgWSBheGlzLlxuICAgKiBAcGFyYW0gZGVsdGEgRGlyZWN0aW9uIGluIHdoaWNoIHRoZSB1c2VyIGlzIG1vdmluZyB0aGVpciBwb2ludGVyLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0SXRlbUluZGV4RnJvbVBvaW50ZXJQb3NpdGlvbihcbiAgICBpdGVtOiBEcmFnUmVmLFxuICAgIHBvaW50ZXJYOiBudW1iZXIsXG4gICAgcG9pbnRlclk6IG51bWJlcixcbiAgICBkZWx0YT86IHt4OiBudW1iZXI7IHk6IG51bWJlcn0sXG4gICk6IG51bWJlciB7XG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gdGhpcy5vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5faXRlbVBvc2l0aW9ucy5maW5kSW5kZXgoKHtkcmFnLCBjbGllbnRSZWN0fSkgPT4ge1xuICAgICAgLy8gU2tpcCB0aGUgaXRlbSBpdHNlbGYuXG4gICAgICBpZiAoZHJhZyA9PT0gaXRlbSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmIChkZWx0YSkge1xuICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSBpc0hvcml6b250YWwgPyBkZWx0YS54IDogZGVsdGEueTtcblxuICAgICAgICAvLyBJZiB0aGUgdXNlciBpcyBzdGlsbCBob3ZlcmluZyBvdmVyIHRoZSBzYW1lIGl0ZW0gYXMgbGFzdCB0aW1lLCB0aGVpciBjdXJzb3IgaGFzbid0IGxlZnRcbiAgICAgICAgLy8gdGhlIGl0ZW0gYWZ0ZXIgd2UgbWFkZSB0aGUgc3dhcCwgYW5kIHRoZXkgZGlkbid0IGNoYW5nZSB0aGUgZGlyZWN0aW9uIGluIHdoaWNoIHRoZXkncmVcbiAgICAgICAgLy8gZHJhZ2dpbmcsIHdlIGRvbid0IGNvbnNpZGVyIGl0IGEgZGlyZWN0aW9uIHN3YXAuXG4gICAgICAgIGlmIChcbiAgICAgICAgICBkcmFnID09PSB0aGlzLl9wcmV2aW91c1N3YXAuZHJhZyAmJlxuICAgICAgICAgIHRoaXMuX3ByZXZpb3VzU3dhcC5vdmVybGFwcyAmJlxuICAgICAgICAgIGRpcmVjdGlvbiA9PT0gdGhpcy5fcHJldmlvdXNTd2FwLmRlbHRhXG4gICAgICAgICkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gaXNIb3Jpem9udGFsXG4gICAgICAgID8gLy8gUm91bmQgdGhlc2UgZG93biBzaW5jZSBtb3N0IGJyb3dzZXJzIHJlcG9ydCBjbGllbnQgcmVjdHMgd2l0aFxuICAgICAgICAgIC8vIHN1Yi1waXhlbCBwcmVjaXNpb24sIHdoZXJlYXMgdGhlIHBvaW50ZXIgY29vcmRpbmF0ZXMgYXJlIHJvdW5kZWQgdG8gcGl4ZWxzLlxuICAgICAgICAgIHBvaW50ZXJYID49IE1hdGguZmxvb3IoY2xpZW50UmVjdC5sZWZ0KSAmJiBwb2ludGVyWCA8IE1hdGguZmxvb3IoY2xpZW50UmVjdC5yaWdodClcbiAgICAgICAgOiBwb2ludGVyWSA+PSBNYXRoLmZsb29yKGNsaWVudFJlY3QudG9wKSAmJiBwb2ludGVyWSA8IE1hdGguZmxvb3IoY2xpZW50UmVjdC5ib3R0b20pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGluZGV4ID09PSAtMSB8fCAhdGhpcy5fc29ydFByZWRpY2F0ZShpbmRleCwgaXRlbSkgPyAtMSA6IGluZGV4O1xuICB9XG59XG4iXX0=