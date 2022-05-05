/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { coerceElement } from '@angular/cdk/coercion';
import { _getShadowRoot } from '@angular/cdk/platform';
import { Subject, Subscription, interval, animationFrameScheduler } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { moveItemInArray } from './drag-utils';
import { isPointerNearClientRect, adjustClientRect, getMutableClientRect, isInsideClientRect, } from './client-rect';
import { ParentPositionTracker } from './parent-position-tracker';
import { combineTransforms } from './drag-styling';
/**
 * Proximity, as a ratio to width/height, at which a
 * dragged item will affect the drop container.
 */
const DROP_PROXIMITY_THRESHOLD = 0.05;
/**
 * Proximity, as a ratio to width/height at which to start auto-scrolling the drop list or the
 * viewport. The value comes from trying it out manually until it feels right.
 */
const SCROLL_PROXIMITY_THRESHOLD = 0.05;
/**
 * Reference to a drop list. Used to manipulate or dispose of the container.
 */
export class DropListRef {
    constructor(element, _dragDropRegistry, _document, _ngZone, _viewportRuler) {
        this._dragDropRegistry = _dragDropRegistry;
        this._ngZone = _ngZone;
        this._viewportRuler = _viewportRuler;
        /** Whether starting a dragging sequence from this container is disabled. */
        this.disabled = false;
        /** Whether sorting items within the list is disabled. */
        this.sortingDisabled = false;
        /**
         * Whether auto-scrolling the view when the user
         * moves their pointer close to the edges is disabled.
         */
        this.autoScrollDisabled = false;
        /** Number of pixels to scroll for each frame when auto-scrolling an element. */
        this.autoScrollStep = 2;
        /**
         * Function that is used to determine whether an item
         * is allowed to be moved into a drop container.
         */
        this.enterPredicate = () => true;
        /** Functions that is used to determine whether an item can be sorted into a particular index. */
        this.sortPredicate = () => true;
        /** Emits right before dragging has started. */
        this.beforeStarted = new Subject();
        /**
         * Emits when the user has moved a new drag item into this container.
         */
        this.entered = new Subject();
        /**
         * Emits when the user removes an item from the container
         * by dragging it into another container.
         */
        this.exited = new Subject();
        /** Emits when the user drops an item inside the container. */
        this.dropped = new Subject();
        /** Emits as the user is swapping items while actively dragging. */
        this.sorted = new Subject();
        /** Whether an item in the list is being dragged. */
        this._isDragging = false;
        /** Cache of the dimensions of all the items inside the container. */
        this._itemPositions = [];
        /**
         * Keeps track of the item that was last swapped with the dragged item, as well as what direction
         * the pointer was moving in when the swap occured and whether the user's pointer continued to
         * overlap with the swapped item after the swapping occurred.
         */
        this._previousSwap = { drag: null, delta: 0, overlaps: false };
        /** Draggable items in the container. */
        this._draggables = [];
        /** Drop lists that are connected to the current one. */
        this._siblings = [];
        /** Direction in which the list is oriented. */
        this._orientation = 'vertical';
        /** Connected siblings that currently have a dragged item. */
        this._activeSiblings = new Set();
        /** Layout direction of the drop list. */
        this._direction = 'ltr';
        /** Subscription to the window being scrolled. */
        this._viewportScrollSubscription = Subscription.EMPTY;
        /** Vertical direction in which the list is currently scrolling. */
        this._verticalScrollDirection = 0 /* AutoScrollVerticalDirection.NONE */;
        /** Horizontal direction in which the list is currently scrolling. */
        this._horizontalScrollDirection = 0 /* AutoScrollHorizontalDirection.NONE */;
        /** Used to signal to the current auto-scroll sequence when to stop. */
        this._stopScrollTimers = new Subject();
        /** Shadow root of the current element. Necessary for `elementFromPoint` to resolve correctly. */
        this._cachedShadowRoot = null;
        /** Starts the interval that'll auto-scroll the element. */
        this._startScrollInterval = () => {
            this._stopScrolling();
            interval(0, animationFrameScheduler)
                .pipe(takeUntil(this._stopScrollTimers))
                .subscribe(() => {
                const node = this._scrollNode;
                const scrollStep = this.autoScrollStep;
                if (this._verticalScrollDirection === 1 /* AutoScrollVerticalDirection.UP */) {
                    node.scrollBy(0, -scrollStep);
                }
                else if (this._verticalScrollDirection === 2 /* AutoScrollVerticalDirection.DOWN */) {
                    node.scrollBy(0, scrollStep);
                }
                if (this._horizontalScrollDirection === 1 /* AutoScrollHorizontalDirection.LEFT */) {
                    node.scrollBy(-scrollStep, 0);
                }
                else if (this._horizontalScrollDirection === 2 /* AutoScrollHorizontalDirection.RIGHT */) {
                    node.scrollBy(scrollStep, 0);
                }
            });
        };
        this.element = coerceElement(element);
        this._document = _document;
        this.withScrollableParents([this.element]);
        _dragDropRegistry.registerDropContainer(this);
        this._parentPositions = new ParentPositionTracker(_document);
    }
    /** Removes the drop list functionality from the DOM element. */
    dispose() {
        this._stopScrolling();
        this._stopScrollTimers.complete();
        this._viewportScrollSubscription.unsubscribe();
        this.beforeStarted.complete();
        this.entered.complete();
        this.exited.complete();
        this.dropped.complete();
        this.sorted.complete();
        this._activeSiblings.clear();
        this._scrollNode = null;
        this._parentPositions.clear();
        this._dragDropRegistry.removeDropContainer(this);
    }
    /** Whether an item from this list is currently being dragged. */
    isDragging() {
        return this._isDragging;
    }
    /** Starts dragging an item. */
    start() {
        this._draggingStarted();
        this._notifyReceivingSiblings();
    }
    /**
     * Emits an event to indicate that the user moved an item into the container.
     * @param item Item that was moved into the container.
     * @param pointerX Position of the item along the X axis.
     * @param pointerY Position of the item along the Y axis.
     * @param index Index at which the item entered. If omitted, the container will try to figure it
     *   out automatically.
     */
    enter(item, pointerX, pointerY, index) {
        this._draggingStarted();
        // If sorting is disabled, we want the item to return to its starting
        // position if the user is returning it to its initial container.
        let newIndex;
        if (index == null) {
            newIndex = this.sortingDisabled ? this._draggables.indexOf(item) : -1;
            if (newIndex === -1) {
                // We use the coordinates of where the item entered the drop
                // zone to figure out at which index it should be inserted.
                newIndex = this._getItemIndexFromPointerPosition(item, pointerX, pointerY);
            }
        }
        else {
            newIndex = index;
        }
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
            coerceElement(this.element).appendChild(placeholder);
            activeDraggables.push(item);
        }
        // The transform needs to be cleared so it doesn't throw off the measurements.
        placeholder.style.transform = '';
        // Note that the positions were already cached when we called `start` above,
        // but we need to refresh them since the amount of items has changed and also parent rects.
        this._cacheItemPositions();
        this._cacheParentPositions();
        // Notify siblings at the end so that the item has been inserted into the `activeDraggables`.
        this._notifyReceivingSiblings();
        this.entered.next({ item, container: this, currentIndex: this.getItemIndex(item) });
    }
    /**
     * Removes an item from the container after it was dragged into another container by the user.
     * @param item Item that was dragged out.
     */
    exit(item) {
        this._reset();
        this.exited.next({ item, container: this });
    }
    /**
     * Drops an item into this container.
     * @param item Item being dropped into the container.
     * @param currentIndex Index at which the item should be inserted.
     * @param previousIndex Index of the item when dragging started.
     * @param previousContainer Container from which the item got dragged in.
     * @param isPointerOverContainer Whether the user's pointer was over the
     *    container when the item was dropped.
     * @param distance Distance the user has dragged since the start of the dragging sequence.
     * @param event Event that triggered the dropping sequence.
     *
     * @breaking-change 15.0.0 `previousIndex` and `event` parameters to become required.
     */
    drop(item, currentIndex, previousIndex, previousContainer, isPointerOverContainer, distance, dropPoint, event = {}) {
        this._reset();
        this.dropped.next({
            item,
            currentIndex,
            previousIndex,
            container: this,
            previousContainer,
            isPointerOverContainer,
            distance,
            dropPoint,
            event,
        });
    }
    /**
     * Sets the draggable items that are a part of this list.
     * @param items Items that are a part of this list.
     */
    withItems(items) {
        const previousItems = this._draggables;
        this._draggables = items;
        items.forEach(item => item._withDropContainer(this));
        if (this.isDragging()) {
            const draggedItems = previousItems.filter(item => item.isDragging());
            // If all of the items being dragged were removed
            // from the list, abort the current drag sequence.
            if (draggedItems.every(item => items.indexOf(item) === -1)) {
                this._reset();
            }
            else {
                this._cacheItems();
            }
        }
        return this;
    }
    /** Sets the layout direction of the drop list. */
    withDirection(direction) {
        this._direction = direction;
        return this;
    }
    /**
     * Sets the containers that are connected to this one. When two or more containers are
     * connected, the user will be allowed to transfer items between them.
     * @param connectedTo Other containers that the current containers should be connected to.
     */
    connectedTo(connectedTo) {
        this._siblings = connectedTo.slice();
        return this;
    }
    /**
     * Sets the orientation of the container.
     * @param orientation New orientation for the container.
     */
    withOrientation(orientation) {
        this._orientation = orientation;
        return this;
    }
    /**
     * Sets which parent elements are can be scrolled while the user is dragging.
     * @param elements Elements that can be scrolled.
     */
    withScrollableParents(elements) {
        const element = coerceElement(this.element);
        // We always allow the current element to be scrollable
        // so we need to ensure that it's in the array.
        this._scrollableElements =
            elements.indexOf(element) === -1 ? [element, ...elements] : elements.slice();
        return this;
    }
    /** Gets the scrollable parents that are registered with this drop container. */
    getScrollableParents() {
        return this._scrollableElements;
    }
    /**
     * Figures out the index of an item in the container.
     * @param item Item whose index should be determined.
     */
    getItemIndex(item) {
        if (!this._isDragging) {
            return this._draggables.indexOf(item);
        }
        // Items are sorted always by top/left in the cache, however they flow differently in RTL.
        // The rest of the logic still stands no matter what orientation we're in, however
        // we need to invert the array when determining the index.
        const items = this._orientation === 'horizontal' && this._direction === 'rtl'
            ? this._itemPositions.slice().reverse()
            : this._itemPositions;
        return items.findIndex(currentItem => currentItem.drag === item);
    }
    /**
     * Whether the list is able to receive the item that
     * is currently being dragged inside a connected drop list.
     */
    isReceiving() {
        return this._activeSiblings.size > 0;
    }
    /**
     * Sorts an item inside the container based on its position.
     * @param item Item to be sorted.
     * @param pointerX Position of the item along the X axis.
     * @param pointerY Position of the item along the Y axis.
     * @param pointerDelta Direction in which the pointer is moving along each axis.
     */
    _sortItem(item, pointerX, pointerY, pointerDelta) {
        // Don't sort the item if sorting is disabled or it's out of range.
        if (this.sortingDisabled ||
            !this._clientRect ||
            !isPointerNearClientRect(this._clientRect, DROP_PROXIMITY_THRESHOLD, pointerX, pointerY)) {
            return;
        }
        const siblings = this._itemPositions;
        const newIndex = this._getItemIndexFromPointerPosition(item, pointerX, pointerY, pointerDelta);
        if (newIndex === -1 && siblings.length > 0) {
            return;
        }
        const isHorizontal = this._orientation === 'horizontal';
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
        this.sorted.next({
            previousIndex: currentIndex,
            currentIndex: newIndex,
            container: this,
            item,
        });
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
                adjustClientRect(sibling.clientRect, 0, offset);
            }
            else {
                elementToOffset.style.transform = combineTransforms(`translate3d(0, ${Math.round(sibling.offset)}px, 0)`, sibling.initialTransform);
                adjustClientRect(sibling.clientRect, offset, 0);
            }
        });
        // Note that it's important that we do this after the client rects have been adjusted.
        this._previousSwap.overlaps = isInsideClientRect(newPosition, pointerX, pointerY);
        this._previousSwap.drag = siblingAtNewPosition.drag;
        this._previousSwap.delta = isHorizontal ? pointerDelta.x : pointerDelta.y;
    }
    /**
     * Checks whether the user's pointer is close to the edges of either the
     * viewport or the drop list and starts the auto-scroll sequence.
     * @param pointerX User's pointer position along the x axis.
     * @param pointerY User's pointer position along the y axis.
     */
    _startScrollingIfNecessary(pointerX, pointerY) {
        if (this.autoScrollDisabled) {
            return;
        }
        let scrollNode;
        let verticalScrollDirection = 0 /* AutoScrollVerticalDirection.NONE */;
        let horizontalScrollDirection = 0 /* AutoScrollHorizontalDirection.NONE */;
        // Check whether we should start scrolling any of the parent containers.
        this._parentPositions.positions.forEach((position, element) => {
            // We have special handling for the `document` below. Also this would be
            // nicer with a  for...of loop, but it requires changing a compiler flag.
            if (element === this._document || !position.clientRect || scrollNode) {
                return;
            }
            if (isPointerNearClientRect(position.clientRect, DROP_PROXIMITY_THRESHOLD, pointerX, pointerY)) {
                [verticalScrollDirection, horizontalScrollDirection] = getElementScrollDirections(element, position.clientRect, pointerX, pointerY);
                if (verticalScrollDirection || horizontalScrollDirection) {
                    scrollNode = element;
                }
            }
        });
        // Otherwise check if we can start scrolling the viewport.
        if (!verticalScrollDirection && !horizontalScrollDirection) {
            const { width, height } = this._viewportRuler.getViewportSize();
            const clientRect = {
                width,
                height,
                top: 0,
                right: width,
                bottom: height,
                left: 0,
            };
            verticalScrollDirection = getVerticalScrollDirection(clientRect, pointerY);
            horizontalScrollDirection = getHorizontalScrollDirection(clientRect, pointerX);
            scrollNode = window;
        }
        if (scrollNode &&
            (verticalScrollDirection !== this._verticalScrollDirection ||
                horizontalScrollDirection !== this._horizontalScrollDirection ||
                scrollNode !== this._scrollNode)) {
            this._verticalScrollDirection = verticalScrollDirection;
            this._horizontalScrollDirection = horizontalScrollDirection;
            this._scrollNode = scrollNode;
            if ((verticalScrollDirection || horizontalScrollDirection) && scrollNode) {
                this._ngZone.runOutsideAngular(this._startScrollInterval);
            }
            else {
                this._stopScrolling();
            }
        }
    }
    /** Stops any currently-running auto-scroll sequences. */
    _stopScrolling() {
        this._stopScrollTimers.next();
    }
    /** Starts the dragging sequence within the list. */
    _draggingStarted() {
        const styles = coerceElement(this.element).style;
        this.beforeStarted.next();
        this._isDragging = true;
        // We need to disable scroll snapping while the user is dragging, because it breaks automatic
        // scrolling. The browser seems to round the value based on the snapping points which means
        // that we can't increment/decrement the scroll position.
        this._initialScrollSnap = styles.msScrollSnapType || styles.scrollSnapType || '';
        styles.scrollSnapType = styles.msScrollSnapType = 'none';
        this._cacheItems();
        this._viewportScrollSubscription.unsubscribe();
        this._listenToScrollEvents();
    }
    /** Caches the positions of the configured scrollable parents. */
    _cacheParentPositions() {
        const element = coerceElement(this.element);
        this._parentPositions.cache(this._scrollableElements);
        // The list element is always in the `scrollableElements`
        // so we can take advantage of the cached `ClientRect`.
        this._clientRect = this._parentPositions.positions.get(element).clientRect;
    }
    /** Refreshes the position cache of the items and sibling containers. */
    _cacheItemPositions() {
        const isHorizontal = this._orientation === 'horizontal';
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
    /** Resets the container to its initial state. */
    _reset() {
        this._isDragging = false;
        const styles = coerceElement(this.element).style;
        styles.scrollSnapType = styles.msScrollSnapType = this._initialScrollSnap;
        // TODO(crisbeto): may have to wait for the animations to finish.
        this._activeDraggables.forEach(item => {
            const rootElement = item.getRootElement();
            if (rootElement) {
                const initialTransform = this._itemPositions.find(current => current.drag === item)?.initialTransform;
                rootElement.style.transform = initialTransform || '';
            }
        });
        this._siblings.forEach(sibling => sibling._stopReceiving(this));
        this._activeDraggables = [];
        this._itemPositions = [];
        this._previousSwap.drag = null;
        this._previousSwap.delta = 0;
        this._previousSwap.overlaps = false;
        this._stopScrolling();
        this._viewportScrollSubscription.unsubscribe();
        this._parentPositions.clear();
    }
    /**
     * Gets the offset in pixels by which the items that aren't being dragged should be moved.
     * @param currentIndex Index of the item currently being dragged.
     * @param siblings All of the items in the list.
     * @param delta Direction in which the user is moving.
     */
    _getSiblingOffsetPx(currentIndex, siblings, delta) {
        const isHorizontal = this._orientation === 'horizontal';
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
     * Gets the offset in pixels by which the item that is being dragged should be moved.
     * @param currentPosition Current position of the item.
     * @param newPosition Position of the item where the current item should be moved.
     * @param delta Direction in which the user is moving.
     */
    _getItemOffsetPx(currentPosition, newPosition, delta) {
        const isHorizontal = this._orientation === 'horizontal';
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
     * Checks if pointer is entering in the first position
     * @param pointerX Position of the user's pointer along the X axis.
     * @param pointerY Position of the user's pointer along the Y axis.
     */
    _shouldEnterAsFirstChild(pointerX, pointerY) {
        if (!this._activeDraggables.length) {
            return false;
        }
        const itemPositions = this._itemPositions;
        const isHorizontal = this._orientation === 'horizontal';
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
        const isHorizontal = this._orientation === 'horizontal';
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
        return index === -1 || !this.sortPredicate(index, item, this) ? -1 : index;
    }
    /** Caches the current items in the list and their positions. */
    _cacheItems() {
        this._activeDraggables = this._draggables.slice();
        this._cacheItemPositions();
        this._cacheParentPositions();
    }
    /**
     * Checks whether the user's pointer is positioned over the container.
     * @param x Pointer position along the X axis.
     * @param y Pointer position along the Y axis.
     */
    _isOverContainer(x, y) {
        return this._clientRect != null && isInsideClientRect(this._clientRect, x, y);
    }
    /**
     * Figures out whether an item should be moved into a sibling
     * drop container, based on its current position.
     * @param item Drag item that is being moved.
     * @param x Position of the item along the X axis.
     * @param y Position of the item along the Y axis.
     */
    _getSiblingContainerFromPosition(item, x, y) {
        return this._siblings.find(sibling => sibling._canReceive(item, x, y));
    }
    /**
     * Checks whether the drop list can receive the passed-in item.
     * @param item Item that is being dragged into the list.
     * @param x Position of the item along the X axis.
     * @param y Position of the item along the Y axis.
     */
    _canReceive(item, x, y) {
        if (!this._clientRect ||
            !isInsideClientRect(this._clientRect, x, y) ||
            !this.enterPredicate(item, this)) {
            return false;
        }
        const elementFromPoint = this._getShadowRoot().elementFromPoint(x, y);
        // If there's no element at the pointer position, then
        // the client rect is probably scrolled out of the view.
        if (!elementFromPoint) {
            return false;
        }
        const nativeElement = coerceElement(this.element);
        // The `ClientRect`, that we're using to find the container over which the user is
        // hovering, doesn't give us any information on whether the element has been scrolled
        // out of the view or whether it's overlapping with other containers. This means that
        // we could end up transferring the item into a container that's invisible or is positioned
        // below another one. We use the result from `elementFromPoint` to get the top-most element
        // at the pointer position and to find whether it's one of the intersecting drop containers.
        return elementFromPoint === nativeElement || nativeElement.contains(elementFromPoint);
    }
    /**
     * Called by one of the connected drop lists when a dragging sequence has started.
     * @param sibling Sibling in which dragging has started.
     */
    _startReceiving(sibling, items) {
        const activeSiblings = this._activeSiblings;
        if (!activeSiblings.has(sibling) &&
            items.every(item => {
                // Note that we have to add an exception to the `enterPredicate` for items that started off
                // in this drop list. The drag ref has logic that allows an item to return to its initial
                // container, if it has left the initial container and none of the connected containers
                // allow it to enter. See `DragRef._updateActiveDropContainer` for more context.
                return this.enterPredicate(item, this) || this._draggables.indexOf(item) > -1;
            })) {
            activeSiblings.add(sibling);
            this._cacheParentPositions();
            this._listenToScrollEvents();
        }
    }
    /**
     * Called by a connected drop list when dragging has stopped.
     * @param sibling Sibling whose dragging has stopped.
     */
    _stopReceiving(sibling) {
        this._activeSiblings.delete(sibling);
        this._viewportScrollSubscription.unsubscribe();
    }
    /**
     * Starts listening to scroll events on the viewport.
     * Used for updating the internal state of the list.
     */
    _listenToScrollEvents() {
        this._viewportScrollSubscription = this._dragDropRegistry
            .scrolled(this._getShadowRoot())
            .subscribe(event => {
            if (this.isDragging()) {
                const scrollDifference = this._parentPositions.handleScroll(event);
                if (scrollDifference) {
                    // Since we know the amount that the user has scrolled we can shift all of the
                    // client rectangles ourselves. This is cheaper than re-measuring everything and
                    // we can avoid inconsistent behavior where we might be measuring the element before
                    // its position has changed.
                    this._itemPositions.forEach(({ clientRect }) => {
                        adjustClientRect(clientRect, scrollDifference.top, scrollDifference.left);
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
            }
            else if (this.isReceiving()) {
                this._cacheParentPositions();
            }
        });
    }
    /**
     * Lazily resolves and returns the shadow root of the element. We do this in a function, rather
     * than saving it in property directly on init, because we want to resolve it as late as possible
     * in order to ensure that the element has been moved into the shadow DOM. Doing it inside the
     * constructor might be too early if the element is inside of something like `ngFor` or `ngIf`.
     */
    _getShadowRoot() {
        if (!this._cachedShadowRoot) {
            const shadowRoot = _getShadowRoot(coerceElement(this.element));
            this._cachedShadowRoot = (shadowRoot || this._document);
        }
        return this._cachedShadowRoot;
    }
    /** Notifies any siblings that may potentially receive the item. */
    _notifyReceivingSiblings() {
        const draggedItems = this._activeDraggables.filter(item => item.isDragging());
        this._siblings.forEach(sibling => sibling._startReceiving(this, draggedItems));
    }
}
/**
 * Gets whether the vertical auto-scroll direction of a node.
 * @param clientRect Dimensions of the node.
 * @param pointerY Position of the user's pointer along the y axis.
 */
function getVerticalScrollDirection(clientRect, pointerY) {
    const { top, bottom, height } = clientRect;
    const yThreshold = height * SCROLL_PROXIMITY_THRESHOLD;
    if (pointerY >= top - yThreshold && pointerY <= top + yThreshold) {
        return 1 /* AutoScrollVerticalDirection.UP */;
    }
    else if (pointerY >= bottom - yThreshold && pointerY <= bottom + yThreshold) {
        return 2 /* AutoScrollVerticalDirection.DOWN */;
    }
    return 0 /* AutoScrollVerticalDirection.NONE */;
}
/**
 * Gets whether the horizontal auto-scroll direction of a node.
 * @param clientRect Dimensions of the node.
 * @param pointerX Position of the user's pointer along the x axis.
 */
function getHorizontalScrollDirection(clientRect, pointerX) {
    const { left, right, width } = clientRect;
    const xThreshold = width * SCROLL_PROXIMITY_THRESHOLD;
    if (pointerX >= left - xThreshold && pointerX <= left + xThreshold) {
        return 1 /* AutoScrollHorizontalDirection.LEFT */;
    }
    else if (pointerX >= right - xThreshold && pointerX <= right + xThreshold) {
        return 2 /* AutoScrollHorizontalDirection.RIGHT */;
    }
    return 0 /* AutoScrollHorizontalDirection.NONE */;
}
/**
 * Gets the directions in which an element node should be scrolled,
 * assuming that the user's pointer is already within it scrollable region.
 * @param element Element for which we should calculate the scroll direction.
 * @param clientRect Bounding client rectangle of the element.
 * @param pointerX Position of the user's pointer along the x axis.
 * @param pointerY Position of the user's pointer along the y axis.
 */
function getElementScrollDirections(element, clientRect, pointerX, pointerY) {
    const computedVertical = getVerticalScrollDirection(clientRect, pointerY);
    const computedHorizontal = getHorizontalScrollDirection(clientRect, pointerX);
    let verticalScrollDirection = 0 /* AutoScrollVerticalDirection.NONE */;
    let horizontalScrollDirection = 0 /* AutoScrollHorizontalDirection.NONE */;
    // Note that we here we do some extra checks for whether the element is actually scrollable in
    // a certain direction and we only assign the scroll direction if it is. We do this so that we
    // can allow other elements to be scrolled, if the current element can't be scrolled anymore.
    // This allows us to handle cases where the scroll regions of two scrollable elements overlap.
    if (computedVertical) {
        const scrollTop = element.scrollTop;
        if (computedVertical === 1 /* AutoScrollVerticalDirection.UP */) {
            if (scrollTop > 0) {
                verticalScrollDirection = 1 /* AutoScrollVerticalDirection.UP */;
            }
        }
        else if (element.scrollHeight - scrollTop > element.clientHeight) {
            verticalScrollDirection = 2 /* AutoScrollVerticalDirection.DOWN */;
        }
    }
    if (computedHorizontal) {
        const scrollLeft = element.scrollLeft;
        if (computedHorizontal === 1 /* AutoScrollHorizontalDirection.LEFT */) {
            if (scrollLeft > 0) {
                horizontalScrollDirection = 1 /* AutoScrollHorizontalDirection.LEFT */;
            }
        }
        else if (element.scrollWidth - scrollLeft > element.clientWidth) {
            horizontalScrollDirection = 2 /* AutoScrollHorizontalDirection.RIGHT */;
        }
    }
    return [verticalScrollDirection, horizontalScrollDirection];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LXJlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2Ryb3AtbGlzdC1yZWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBSUgsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRXBELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsT0FBTyxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsdUJBQXVCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDOUUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFHN0MsT0FBTyxFQUNMLHVCQUF1QixFQUN2QixnQkFBZ0IsRUFDaEIsb0JBQW9CLEVBQ3BCLGtCQUFrQixHQUNuQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUNoRSxPQUFPLEVBQUMsaUJBQWlCLEVBQTBCLE1BQU0sZ0JBQWdCLENBQUM7QUFFMUU7OztHQUdHO0FBQ0gsTUFBTSx3QkFBd0IsR0FBRyxJQUFJLENBQUM7QUFFdEM7OztHQUdHO0FBQ0gsTUFBTSwwQkFBMEIsR0FBRyxJQUFJLENBQUM7QUE2Q3hDOztHQUVHO0FBQ0gsTUFBTSxPQUFPLFdBQVc7SUF5SXRCLFlBQ0UsT0FBOEMsRUFDdEMsaUJBQXlELEVBQ2pFLFNBQWMsRUFDTixPQUFlLEVBQ2YsY0FBNkI7UUFIN0Isc0JBQWlCLEdBQWpCLGlCQUFpQixDQUF3QztRQUV6RCxZQUFPLEdBQVAsT0FBTyxDQUFRO1FBQ2YsbUJBQWMsR0FBZCxjQUFjLENBQWU7UUExSXZDLDRFQUE0RTtRQUM1RSxhQUFRLEdBQVksS0FBSyxDQUFDO1FBRTFCLHlEQUF5RDtR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bEUsdUJBQXVCLDJDQUFtQyxDQUFDO1NBQzVEO0tBQ0Y7SUFFRCxJQUFJLGtCQUFrQixFQUFFO1FBQ3RCLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUM7UUFFdEMsSUFBSSxrQkFBa0IsK0NBQXVDLEVBQUU7WUFDN0QsSUFBSSxVQUFVLEdBQUcsQ0FBQyxFQUFFO2dCQUNsQix5QkFBeUIsNkNBQXFDLENBQUM7YUFDaEU7U0FDRjthQUFNLElBQUksT0FBTyxDQUFDLFdBQVcsR0FBRyxVQUFVLEdBQUcsT0FBTyxDQUFDLFdBQVcsRUFBRTtZQUNqRSx5QkFBeUIsOENBQXNDLENBQUM7U0FDakU7S0FDRjtJQUVELE9BQU8sQ0FBQyx1QkFBdUIsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO0FBQzlELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtFbGVtZW50UmVmLCBOZ1pvbmV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtEaXJlY3Rpb259IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7Y29lcmNlRWxlbWVudH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7Vmlld3BvcnRSdWxlcn0gZnJvbSAnQGFuZ3VsYXIvY2RrL3Njcm9sbGluZyc7XG5pbXBvcnQge19nZXRTaGFkb3dSb290fSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtTdWJqZWN0LCBTdWJzY3JpcHRpb24sIGludGVydmFsLCBhbmltYXRpb25GcmFtZVNjaGVkdWxlcn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3Rha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHttb3ZlSXRlbUluQXJyYXl9IGZyb20gJy4vZHJhZy11dGlscyc7XG5pbXBvcnQge0RyYWdEcm9wUmVnaXN0cnl9IGZyb20gJy4vZHJhZy1kcm9wLXJlZ2lzdHJ5JztcbmltcG9ydCB7RHJhZ1JlZkludGVybmFsIGFzIERyYWdSZWYsIFBvaW50fSBmcm9tICcuL2RyYWctcmVmJztcbmltcG9ydCB7XG4gIGlzUG9pbnRlck5lYXJDbGllbnRSZWN0LFxuICBhZGp1c3RDbGllbnRSZWN0LFxuICBnZXRNdXRhYmxlQ2xpZW50UmVjdCxcbiAgaXNJbnNpZGVDbGllbnRSZWN0LFxufSBmcm9tICcuL2NsaWVudC1yZWN0JztcbmltcG9ydCB7UGFyZW50UG9zaXRpb25UcmFja2VyfSBmcm9tICcuL3BhcmVudC1wb3NpdGlvbi10cmFja2VyJztcbmltcG9ydCB7Y29tYmluZVRyYW5zZm9ybXMsIERyYWdDU1NTdHlsZURlY2xhcmF0aW9ufSBmcm9tICcuL2RyYWctc3R5bGluZyc7XG5cbi8qKlxuICogUHJveGltaXR5LCBhcyBhIHJhdGlvIHRvIHdpZHRoL2hlaWdodCwgYXQgd2hpY2ggYVxuICogZHJhZ2dlZCBpdGVtIHdpbGwgYWZmZWN0IHRoZSBkcm9wIGNvbnRhaW5lci5cbiAqL1xuY29uc3QgRFJPUF9QUk9YSU1JVFlfVEhSRVNIT0xEID0gMC4wNTtcblxuLyoqXG4gKiBQcm94aW1pdHksIGFzIGEgcmF0aW8gdG8gd2lkdGgvaGVpZ2h0IGF0IHdoaWNoIHRvIHN0YXJ0IGF1dG8tc2Nyb2xsaW5nIHRoZSBkcm9wIGxpc3Qgb3IgdGhlXG4gKiB2aWV3cG9ydC4gVGhlIHZhbHVlIGNvbWVzIGZyb20gdHJ5aW5nIGl0IG91dCBtYW51YWxseSB1bnRpbCBpdCBmZWVscyByaWdodC5cbiAqL1xuY29uc3QgU0NST0xMX1BST1hJTUlUWV9USFJFU0hPTEQgPSAwLjA1O1xuXG4vKipcbiAqIEVudHJ5IGluIHRoZSBwb3NpdGlvbiBjYWNoZSBmb3IgZHJhZ2dhYmxlIGl0ZW1zLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5pbnRlcmZhY2UgQ2FjaGVkSXRlbVBvc2l0aW9uIHtcbiAgLyoqIEluc3RhbmNlIG9mIHRoZSBkcmFnIGl0ZW0uICovXG4gIGRyYWc6IERyYWdSZWY7XG4gIC8qKiBEaW1lbnNpb25zIG9mIHRoZSBpdGVtLiAqL1xuICBjbGllbnRSZWN0OiBDbGllbnRSZWN0O1xuICAvKiogQW1vdW50IGJ5IHdoaWNoIHRoZSBpdGVtIGhhcyBiZWVuIG1vdmVkIHNpbmNlIGRyYWdnaW5nIHN0YXJ0ZWQuICovXG4gIG9mZnNldDogbnVtYmVyO1xuICAvKiogSW5saW5lIHRyYW5zZm9ybSB0aGF0IHRoZSBkcmFnIGl0ZW0gaGFkIHdoZW4gZHJhZ2dpbmcgc3RhcnRlZC4gKi9cbiAgaW5pdGlhbFRyYW5zZm9ybTogc3RyaW5nO1xufVxuXG4vKiogVmVydGljYWwgZGlyZWN0aW9uIGluIHdoaWNoIHdlIGNhbiBhdXRvLXNjcm9sbC4gKi9cbmNvbnN0IGVudW0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uIHtcbiAgTk9ORSxcbiAgVVAsXG4gIERPV04sXG59XG5cbi8qKiBIb3Jpem9udGFsIGRpcmVjdGlvbiBpbiB3aGljaCB3ZSBjYW4gYXV0by1zY3JvbGwuICovXG5jb25zdCBlbnVtIEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uIHtcbiAgTk9ORSxcbiAgTEVGVCxcbiAgUklHSFQsXG59XG5cbi8qKlxuICogSW50ZXJuYWwgY29tcGlsZS10aW1lLW9ubHkgcmVwcmVzZW50YXRpb24gb2YgYSBgRHJvcExpc3RSZWZgLlxuICogVXNlZCB0byBhdm9pZCBjaXJjdWxhciBpbXBvcnQgaXNzdWVzIGJldHdlZW4gdGhlIGBEcm9wTGlzdFJlZmAgYW5kIHRoZSBgRHJhZ1JlZmAuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRHJvcExpc3RSZWZJbnRlcm5hbCBleHRlbmRzIERyb3BMaXN0UmVmIHt9XG5cbnR5cGUgUm9vdE5vZGUgPSBEb2N1bWVudE9yU2hhZG93Um9vdCAmIHtcbiAgLy8gQXMgb2YgVFMgNC40IHRoZSBidWlsdCBpbiBET00gdHlwaW5ncyBkb24ndCBpbmNsdWRlIGBlbGVtZW50RnJvbVBvaW50YCBvbiBgU2hhZG93Um9vdGAsXG4gIC8vIGV2ZW4gdGhvdWdoIGl0IGV4aXN0cyAoc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9TaGFkb3dSb290KS5cbiAgLy8gVGhpcyB0eXBlIGlzIGEgdXRpbGl0eSB0byBhdm9pZCBoYXZpbmcgdG8gYWRkIGNhc3RzIGV2ZXJ5d2hlcmUuXG4gIGVsZW1lbnRGcm9tUG9pbnQoeDogbnVtYmVyLCB5OiBudW1iZXIpOiBFbGVtZW50IHwgbnVsbDtcbn07XG5cbi8qKlxuICogUmVmZXJlbmNlIHRvIGEgZHJvcCBsaXN0LiBVc2VkIHRvIG1hbmlwdWxhdGUgb3IgZGlzcG9zZSBvZiB0aGUgY29udGFpbmVyLlxuICovXG5leHBvcnQgY2xhc3MgRHJvcExpc3RSZWY8VCA9IGFueT4ge1xuICAvKiogRWxlbWVudCB0aGF0IHRoZSBkcm9wIGxpc3QgaXMgYXR0YWNoZWQgdG8uICovXG4gIGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD47XG5cbiAgLyoqIFdoZXRoZXIgc3RhcnRpbmcgYSBkcmFnZ2luZyBzZXF1ZW5jZSBmcm9tIHRoaXMgY29udGFpbmVyIGlzIGRpc2FibGVkLiAqL1xuICBkaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIHNvcnRpbmcgaXRlbXMgd2l0aGluIHRoZSBsaXN0IGlzIGRpc2FibGVkLiAqL1xuICBzb3J0aW5nRGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogTG9ja3MgdGhlIHBvc2l0aW9uIG9mIHRoZSBkcmFnZ2FibGUgZWxlbWVudHMgaW5zaWRlIHRoZSBjb250YWluZXIgYWxvbmcgdGhlIHNwZWNpZmllZCBheGlzLiAqL1xuICBsb2NrQXhpczogJ3gnIHwgJ3knO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIGF1dG8tc2Nyb2xsaW5nIHRoZSB2aWV3IHdoZW4gdGhlIHVzZXJcbiAgICogbW92ZXMgdGhlaXIgcG9pbnRlciBjbG9zZSB0byB0aGUgZWRnZXMgaXMgZGlzYWJsZWQuXG4gICAqL1xuICBhdXRvU2Nyb2xsRGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogTnVtYmVyIG9mIHBpeGVscyB0byBzY3JvbGwgZm9yIGVhY2ggZnJhbWUgd2hlbiBhdXRvLXNjcm9sbGluZyBhbiBlbGVtZW50LiAqL1xuICBhdXRvU2Nyb2xsU3RlcDogbnVtYmVyID0gMjtcblxuICAvKipcbiAgICogRnVuY3Rpb24gdGhhdCBpcyB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIGFuIGl0ZW1cbiAgICogaXMgYWxsb3dlZCB0byBiZSBtb3ZlZCBpbnRvIGEgZHJvcCBjb250YWluZXIuXG4gICAqL1xuICBlbnRlclByZWRpY2F0ZTogKGRyYWc6IERyYWdSZWYsIGRyb3A6IERyb3BMaXN0UmVmKSA9PiBib29sZWFuID0gKCkgPT4gdHJ1ZTtcblxuICAvKiogRnVuY3Rpb25zIHRoYXQgaXMgdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBhbiBpdGVtIGNhbiBiZSBzb3J0ZWQgaW50byBhIHBhcnRpY3VsYXIgaW5kZXguICovXG4gIHNvcnRQcmVkaWNhdGU6IChpbmRleDogbnVtYmVyLCBkcmFnOiBEcmFnUmVmLCBkcm9wOiBEcm9wTGlzdFJlZikgPT4gYm9vbGVhbiA9ICgpID0+IHRydWU7XG5cbiAgLyoqIEVtaXRzIHJpZ2h0IGJlZm9yZSBkcmFnZ2luZyBoYXMgc3RhcnRlZC4gKi9cbiAgcmVhZG9ubHkgYmVmb3JlU3RhcnRlZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqXG4gICAqIEVtaXRzIHdoZW4gdGhlIHVzZXIgaGFzIG1vdmVkIGEgbmV3IGRyYWcgaXRlbSBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKi9cbiAgcmVhZG9ubHkgZW50ZXJlZCA9IG5ldyBTdWJqZWN0PHtpdGVtOiBEcmFnUmVmOyBjb250YWluZXI6IERyb3BMaXN0UmVmOyBjdXJyZW50SW5kZXg6IG51bWJlcn0+KCk7XG5cbiAgLyoqXG4gICAqIEVtaXRzIHdoZW4gdGhlIHVzZXIgcmVtb3ZlcyBhbiBpdGVtIGZyb20gdGhlIGNvbnRhaW5lclxuICAgKiBieSBkcmFnZ2luZyBpdCBpbnRvIGFub3RoZXIgY29udGFpbmVyLlxuICAgKi9cbiAgcmVhZG9ubHkgZXhpdGVkID0gbmV3IFN1YmplY3Q8e2l0ZW06IERyYWdSZWY7IGNvbnRhaW5lcjogRHJvcExpc3RSZWZ9PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGRyb3BzIGFuIGl0ZW0gaW5zaWRlIHRoZSBjb250YWluZXIuICovXG4gIHJlYWRvbmx5IGRyb3BwZWQgPSBuZXcgU3ViamVjdDx7XG4gICAgaXRlbTogRHJhZ1JlZjtcbiAgICBjdXJyZW50SW5kZXg6IG51bWJlcjtcbiAgICBwcmV2aW91c0luZGV4OiBudW1iZXI7XG4gICAgY29udGFpbmVyOiBEcm9wTGlzdFJlZjtcbiAgICBwcmV2aW91c0NvbnRhaW5lcjogRHJvcExpc3RSZWY7XG4gICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcjogYm9vbGVhbjtcbiAgICBkaXN0YW5jZTogUG9pbnQ7XG4gICAgZHJvcFBvaW50OiBQb2ludDtcbiAgICBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQ7XG4gIH0+KCk7XG5cbiAgLyoqIEVtaXRzIGFzIHRoZSB1c2VyIGlzIHN3YXBwaW5nIGl0ZW1zIHdoaWxlIGFjdGl2ZWx5IGRyYWdnaW5nLiAqL1xuICByZWFkb25seSBzb3J0ZWQgPSBuZXcgU3ViamVjdDx7XG4gICAgcHJldmlvdXNJbmRleDogbnVtYmVyO1xuICAgIGN1cnJlbnRJbmRleDogbnVtYmVyO1xuICAgIGNvbnRhaW5lcjogRHJvcExpc3RSZWY7XG4gICAgaXRlbTogRHJhZ1JlZjtcbiAgfT4oKTtcblxuICAvKiogQXJiaXRyYXJ5IGRhdGEgdGhhdCBjYW4gYmUgYXR0YWNoZWQgdG8gdGhlIGRyb3AgbGlzdC4gKi9cbiAgZGF0YTogVDtcblxuICAvKiogV2hldGhlciBhbiBpdGVtIGluIHRoZSBsaXN0IGlzIGJlaW5nIGRyYWdnZWQuICovXG4gIHByaXZhdGUgX2lzRHJhZ2dpbmcgPSBmYWxzZTtcblxuICAvKiogQ2FjaGUgb2YgdGhlIGRpbWVuc2lvbnMgb2YgYWxsIHRoZSBpdGVtcyBpbnNpZGUgdGhlIGNvbnRhaW5lci4gKi9cbiAgcHJpdmF0ZSBfaXRlbVBvc2l0aW9uczogQ2FjaGVkSXRlbVBvc2l0aW9uW10gPSBbXTtcblxuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIHBvc2l0aW9ucyBvZiBhbnkgcGFyZW50IHNjcm9sbGFibGUgZWxlbWVudHMuICovXG4gIHByaXZhdGUgX3BhcmVudFBvc2l0aW9uczogUGFyZW50UG9zaXRpb25UcmFja2VyO1xuXG4gIC8qKiBDYWNoZWQgYENsaWVudFJlY3RgIG9mIHRoZSBkcm9wIGxpc3QuICovXG4gIHByaXZhdGUgX2NsaWVudFJlY3Q6IENsaWVudFJlY3QgfCB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIERyYWdnYWJsZSBpdGVtcyB0aGF0IGFyZSBjdXJyZW50bHkgYWN0aXZlIGluc2lkZSB0aGUgY29udGFpbmVyLiBJbmNsdWRlcyB0aGUgaXRlbXNcbiAgICogZnJvbSBgX2RyYWdnYWJsZXNgLCBhcyB3ZWxsIGFzIGFueSBpdGVtcyB0aGF0IGhhdmUgYmVlbiBkcmFnZ2VkIGluLCBidXQgaGF2ZW4ndFxuICAgKiBiZWVuIGRyb3BwZWQgeWV0LlxuICAgKi9cbiAgcHJpdmF0ZSBfYWN0aXZlRHJhZ2dhYmxlczogRHJhZ1JlZltdO1xuXG4gIC8qKlxuICAgKiBLZWVwcyB0cmFjayBvZiB0aGUgaXRlbSB0aGF0IHdhcyBsYXN0IHN3YXBwZWQgd2l0aCB0aGUgZHJhZ2dlZCBpdGVtLCBhcyB3ZWxsIGFzIHdoYXQgZGlyZWN0aW9uXG4gICAqIHRoZSBwb2ludGVyIHdhcyBtb3ZpbmcgaW4gd2hlbiB0aGUgc3dhcCBvY2N1cmVkIGFuZCB3aGV0aGVyIHRoZSB1c2VyJ3MgcG9pbnRlciBjb250aW51ZWQgdG9cbiAgICogb3ZlcmxhcCB3aXRoIHRoZSBzd2FwcGVkIGl0ZW0gYWZ0ZXIgdGhlIHN3YXBwaW5nIG9jY3VycmVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfcHJldmlvdXNTd2FwID0ge2RyYWc6IG51bGwgYXMgRHJhZ1JlZiB8IG51bGwsIGRlbHRhOiAwLCBvdmVybGFwczogZmFsc2V9O1xuXG4gIC8qKiBEcmFnZ2FibGUgaXRlbXMgaW4gdGhlIGNvbnRhaW5lci4gKi9cbiAgcHJpdmF0ZSBfZHJhZ2dhYmxlczogcmVhZG9ubHkgRHJhZ1JlZltdID0gW107XG5cbiAgLyoqIERyb3AgbGlzdHMgdGhhdCBhcmUgY29ubmVjdGVkIHRvIHRoZSBjdXJyZW50IG9uZS4gKi9cbiAgcHJpdmF0ZSBfc2libGluZ3M6IHJlYWRvbmx5IERyb3BMaXN0UmVmW10gPSBbXTtcblxuICAvKiogRGlyZWN0aW9uIGluIHdoaWNoIHRoZSBsaXN0IGlzIG9yaWVudGVkLiAqL1xuICBwcml2YXRlIF9vcmllbnRhdGlvbjogJ2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJyA9ICd2ZXJ0aWNhbCc7XG5cbiAgLyoqIENvbm5lY3RlZCBzaWJsaW5ncyB0aGF0IGN1cnJlbnRseSBoYXZlIGEgZHJhZ2dlZCBpdGVtLiAqL1xuICBwcml2YXRlIF9hY3RpdmVTaWJsaW5ncyA9IG5ldyBTZXQ8RHJvcExpc3RSZWY+KCk7XG5cbiAgLyoqIExheW91dCBkaXJlY3Rpb24gb2YgdGhlIGRyb3AgbGlzdC4gKi9cbiAgcHJpdmF0ZSBfZGlyZWN0aW9uOiBEaXJlY3Rpb24gPSAnbHRyJztcblxuICAvKiogU3Vic2NyaXB0aW9uIHRvIHRoZSB3aW5kb3cgYmVpbmcgc2Nyb2xsZWQuICovXG4gIHByaXZhdGUgX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuXG4gIC8qKiBWZXJ0aWNhbCBkaXJlY3Rpb24gaW4gd2hpY2ggdGhlIGxpc3QgaXMgY3VycmVudGx5IHNjcm9sbGluZy4gKi9cbiAgcHJpdmF0ZSBfdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uTk9ORTtcblxuICAvKiogSG9yaXpvbnRhbCBkaXJlY3Rpb24gaW4gd2hpY2ggdGhlIGxpc3QgaXMgY3VycmVudGx5IHNjcm9sbGluZy4gKi9cbiAgcHJpdmF0ZSBfaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLk5PTkU7XG5cbiAgLyoqIE5vZGUgdGhhdCBpcyBiZWluZyBhdXRvLXNjcm9sbGVkLiAqL1xuICBwcml2YXRlIF9zY3JvbGxOb2RlOiBIVE1MRWxlbWVudCB8IFdpbmRvdztcblxuICAvKiogVXNlZCB0byBzaWduYWwgdG8gdGhlIGN1cnJlbnQgYXV0by1zY3JvbGwgc2VxdWVuY2Ugd2hlbiB0byBzdG9wLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9zdG9wU2Nyb2xsVGltZXJzID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogU2hhZG93IHJvb3Qgb2YgdGhlIGN1cnJlbnQgZWxlbWVudC4gTmVjZXNzYXJ5IGZvciBgZWxlbWVudEZyb21Qb2ludGAgdG8gcmVzb2x2ZSBjb3JyZWN0bHkuICovXG4gIHByaXZhdGUgX2NhY2hlZFNoYWRvd1Jvb3Q6IFJvb3ROb2RlIHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgZG9jdW1lbnQuICovXG4gIHByaXZhdGUgX2RvY3VtZW50OiBEb2N1bWVudDtcblxuICAvKiogRWxlbWVudHMgdGhhdCBjYW4gYmUgc2Nyb2xsZWQgd2hpbGUgdGhlIHVzZXIgaXMgZHJhZ2dpbmcuICovXG4gIHByaXZhdGUgX3Njcm9sbGFibGVFbGVtZW50czogSFRNTEVsZW1lbnRbXTtcblxuICAvKiogSW5pdGlhbCB2YWx1ZSBmb3IgdGhlIGVsZW1lbnQncyBgc2Nyb2xsLXNuYXAtdHlwZWAgc3R5bGUuICovXG4gIHByaXZhdGUgX2luaXRpYWxTY3JvbGxTbmFwOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBIVE1MRWxlbWVudCxcbiAgICBwcml2YXRlIF9kcmFnRHJvcFJlZ2lzdHJ5OiBEcmFnRHJvcFJlZ2lzdHJ5PERyYWdSZWYsIERyb3BMaXN0UmVmPixcbiAgICBfZG9jdW1lbnQ6IGFueSxcbiAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICBwcml2YXRlIF92aWV3cG9ydFJ1bGVyOiBWaWV3cG9ydFJ1bGVyLFxuICApIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnQpO1xuICAgIHRoaXMuX2RvY3VtZW50ID0gX2RvY3VtZW50O1xuICAgIHRoaXMud2l0aFNjcm9sbGFibGVQYXJlbnRzKFt0aGlzLmVsZW1lbnRdKTtcbiAgICBfZHJhZ0Ryb3BSZWdpc3RyeS5yZWdpc3RlckRyb3BDb250YWluZXIodGhpcyk7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zID0gbmV3IFBhcmVudFBvc2l0aW9uVHJhY2tlcihfZG9jdW1lbnQpO1xuICB9XG5cbiAgLyoqIFJlbW92ZXMgdGhlIGRyb3AgbGlzdCBmdW5jdGlvbmFsaXR5IGZyb20gdGhlIERPTSBlbGVtZW50LiAqL1xuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuX3N0b3BTY3JvbGxpbmcoKTtcbiAgICB0aGlzLl9zdG9wU2Nyb2xsVGltZXJzLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmJlZm9yZVN0YXJ0ZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmVudGVyZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmV4aXRlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuZHJvcHBlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuc29ydGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fYWN0aXZlU2libGluZ3MuY2xlYXIoKTtcbiAgICB0aGlzLl9zY3JvbGxOb2RlID0gbnVsbCE7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLmNsZWFyKCk7XG4gICAgdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5yZW1vdmVEcm9wQ29udGFpbmVyKHRoaXMpO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgYW4gaXRlbSBmcm9tIHRoaXMgbGlzdCBpcyBjdXJyZW50bHkgYmVpbmcgZHJhZ2dlZC4gKi9cbiAgaXNEcmFnZ2luZygpIHtcbiAgICByZXR1cm4gdGhpcy5faXNEcmFnZ2luZztcbiAgfVxuXG4gIC8qKiBTdGFydHMgZHJhZ2dpbmcgYW4gaXRlbS4gKi9cbiAgc3RhcnQoKTogdm9pZCB7XG4gICAgdGhpcy5fZHJhZ2dpbmdTdGFydGVkKCk7XG4gICAgdGhpcy5fbm90aWZ5UmVjZWl2aW5nU2libGluZ3MoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbWl0cyBhbiBldmVudCB0byBpbmRpY2F0ZSB0aGF0IHRoZSB1c2VyIG1vdmVkIGFuIGl0ZW0gaW50byB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRoYXQgd2FzIG1vdmVkIGludG8gdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKiBAcGFyYW0gaW5kZXggSW5kZXggYXQgd2hpY2ggdGhlIGl0ZW0gZW50ZXJlZC4gSWYgb21pdHRlZCwgdGhlIGNvbnRhaW5lciB3aWxsIHRyeSB0byBmaWd1cmUgaXRcbiAgICogICBvdXQgYXV0b21hdGljYWxseS5cbiAgICovXG4gIGVudGVyKGl0ZW06IERyYWdSZWYsIHBvaW50ZXJYOiBudW1iZXIsIHBvaW50ZXJZOiBudW1iZXIsIGluZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy5fZHJhZ2dpbmdTdGFydGVkKCk7XG5cbiAgICAvLyBJZiBzb3J0aW5nIGlzIGRpc2FibGVkLCB3ZSB3YW50IHRoZSBpdGVtIHRvIHJldHVybiB0byBpdHMgc3RhcnRpbmdcbiAgICAvLyBwb3NpdGlvbiBpZiB0aGUgdXNlciBpcyByZXR1cm5pbmcgaXQgdG8gaXRzIGluaXRpYWwgY29udGFpbmVyLlxuICAgIGxldCBuZXdJbmRleDogbnVtYmVyO1xuXG4gICAgaWYgKGluZGV4ID09IG51bGwpIHtcbiAgICAgIG5ld0luZGV4ID0gdGhpcy5zb3J0aW5nRGlzYWJsZWQgPyB0aGlzLl9kcmFnZ2FibGVzLmluZGV4T2YoaXRlbSkgOiAtMTtcblxuICAgICAgaWYgKG5ld0luZGV4ID09PSAtMSkge1xuICAgICAgICAvLyBXZSB1c2UgdGhlIGNvb3JkaW5hdGVzIG9mIHdoZXJlIHRoZSBpdGVtIGVudGVyZWQgdGhlIGRyb3BcbiAgICAgICAgLy8gem9uZSB0byBmaWd1cmUgb3V0IGF0IHdoaWNoIGluZGV4IGl0IHNob3VsZCBiZSBpbnNlcnRlZC5cbiAgICAgICAgbmV3SW5kZXggPSB0aGlzLl9nZXRJdGVtSW5kZXhGcm9tUG9pbnRlclBvc2l0aW9uKGl0ZW0sIHBvaW50ZXJYLCBwb2ludGVyWSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld0luZGV4ID0gaW5kZXg7XG4gICAgfVxuXG4gICAgY29uc3QgYWN0aXZlRHJhZ2dhYmxlcyA9IHRoaXMuX2FjdGl2ZURyYWdnYWJsZXM7XG4gICAgY29uc3QgY3VycmVudEluZGV4ID0gYWN0aXZlRHJhZ2dhYmxlcy5pbmRleE9mKGl0ZW0pO1xuICAgIGNvbnN0IHBsYWNlaG9sZGVyID0gaXRlbS5nZXRQbGFjZWhvbGRlckVsZW1lbnQoKTtcbiAgICBsZXQgbmV3UG9zaXRpb25SZWZlcmVuY2U6IERyYWdSZWYgfCB1bmRlZmluZWQgPSBhY3RpdmVEcmFnZ2FibGVzW25ld0luZGV4XTtcblxuICAgIC8vIElmIHRoZSBpdGVtIGF0IHRoZSBuZXcgcG9zaXRpb24gaXMgdGhlIHNhbWUgYXMgdGhlIGl0ZW0gdGhhdCBpcyBiZWluZyBkcmFnZ2VkLFxuICAgIC8vIGl0IG1lYW5zIHRoYXQgd2UncmUgdHJ5aW5nIHRvIHJlc3RvcmUgdGhlIGl0ZW0gdG8gaXRzIGluaXRpYWwgcG9zaXRpb24uIEluIHRoaXNcbiAgICAvLyBjYXNlIHdlIHNob3VsZCB1c2UgdGhlIG5leHQgaXRlbSBmcm9tIHRoZSBsaXN0IGFzIHRoZSByZWZlcmVuY2UuXG4gICAgaWYgKG5ld1Bvc2l0aW9uUmVmZXJlbmNlID09PSBpdGVtKSB7XG4gICAgICBuZXdQb3NpdGlvblJlZmVyZW5jZSA9IGFjdGl2ZURyYWdnYWJsZXNbbmV3SW5kZXggKyAxXTtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSBkaWRuJ3QgZmluZCBhIG5ldyBwb3NpdGlvbiByZWZlcmVuY2UsIGl0IG1lYW5zIHRoYXQgZWl0aGVyIHRoZSBpdGVtIGRpZG4ndCBzdGFydCBvZmZcbiAgICAvLyBpbiB0aGlzIGNvbnRhaW5lciwgb3IgdGhhdCB0aGUgaXRlbSByZXF1ZXN0ZWQgdG8gYmUgaW5zZXJ0ZWQgYXQgdGhlIGVuZCBvZiB0aGUgbGlzdC5cbiAgICBpZiAoXG4gICAgICAhbmV3UG9zaXRpb25SZWZlcmVuY2UgJiZcbiAgICAgIChuZXdJbmRleCA9PSBudWxsIHx8IG5ld0luZGV4ID09PSAtMSB8fCBuZXdJbmRleCA8IGFjdGl2ZURyYWdnYWJsZXMubGVuZ3RoIC0gMSkgJiZcbiAgICAgIHRoaXMuX3Nob3VsZEVudGVyQXNGaXJzdENoaWxkKHBvaW50ZXJYLCBwb2ludGVyWSlcbiAgICApIHtcbiAgICAgIG5ld1Bvc2l0aW9uUmVmZXJlbmNlID0gYWN0aXZlRHJhZ2dhYmxlc1swXTtcbiAgICB9XG5cbiAgICAvLyBTaW5jZSB0aGUgaXRlbSBtYXkgYmUgaW4gdGhlIGBhY3RpdmVEcmFnZ2FibGVzYCBhbHJlYWR5IChlLmcuIGlmIHRoZSB1c2VyIGRyYWdnZWQgaXRcbiAgICAvLyBpbnRvIGFub3RoZXIgY29udGFpbmVyIGFuZCBiYWNrIGFnYWluKSwgd2UgaGF2ZSB0byBlbnN1cmUgdGhhdCBpdCBpc24ndCBkdXBsaWNhdGVkLlxuICAgIGlmIChjdXJyZW50SW5kZXggPiAtMSkge1xuICAgICAgYWN0aXZlRHJhZ2dhYmxlcy5zcGxpY2UoY3VycmVudEluZGV4LCAxKTtcbiAgICB9XG5cbiAgICAvLyBEb24ndCB1c2UgaXRlbXMgdGhhdCBhcmUgYmVpbmcgZHJhZ2dlZCBhcyBhIHJlZmVyZW5jZSwgYmVjYXVzZVxuICAgIC8vIHRoZWlyIGVsZW1lbnQgaGFzIGJlZW4gbW92ZWQgZG93biB0byB0aGUgYm90dG9tIG9mIHRoZSBib2R5LlxuICAgIGlmIChuZXdQb3NpdGlvblJlZmVyZW5jZSAmJiAhdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5pc0RyYWdnaW5nKG5ld1Bvc2l0aW9uUmVmZXJlbmNlKSkge1xuICAgICAgY29uc3QgZWxlbWVudCA9IG5ld1Bvc2l0aW9uUmVmZXJlbmNlLmdldFJvb3RFbGVtZW50KCk7XG4gICAgICBlbGVtZW50LnBhcmVudEVsZW1lbnQhLmluc2VydEJlZm9yZShwbGFjZWhvbGRlciwgZWxlbWVudCk7XG4gICAgICBhY3RpdmVEcmFnZ2FibGVzLnNwbGljZShuZXdJbmRleCwgMCwgaXRlbSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KS5hcHBlbmRDaGlsZChwbGFjZWhvbGRlcik7XG4gICAgICBhY3RpdmVEcmFnZ2FibGVzLnB1c2goaXRlbSk7XG4gICAgfVxuXG4gICAgLy8gVGhlIHRyYW5zZm9ybSBuZWVkcyB0byBiZSBjbGVhcmVkIHNvIGl0IGRvZXNuJ3QgdGhyb3cgb2ZmIHRoZSBtZWFzdXJlbWVudHMuXG4gICAgcGxhY2Vob2xkZXIuc3R5bGUudHJhbnNmb3JtID0gJyc7XG5cbiAgICAvLyBOb3RlIHRoYXQgdGhlIHBvc2l0aW9ucyB3ZXJlIGFscmVhZHkgY2FjaGVkIHdoZW4gd2UgY2FsbGVkIGBzdGFydGAgYWJvdmUsXG4gICAgLy8gYnV0IHdlIG5lZWQgdG8gcmVmcmVzaCB0aGVtIHNpbmNlIHRoZSBhbW91bnQgb2YgaXRlbXMgaGFzIGNoYW5nZWQgYW5kIGFsc28gcGFyZW50IHJlY3RzLlxuICAgIHRoaXMuX2NhY2hlSXRlbVBvc2l0aW9ucygpO1xuICAgIHRoaXMuX2NhY2hlUGFyZW50UG9zaXRpb25zKCk7XG5cbiAgICAvLyBOb3RpZnkgc2libGluZ3MgYXQgdGhlIGVuZCBzbyB0aGF0IHRoZSBpdGVtIGhhcyBiZWVuIGluc2VydGVkIGludG8gdGhlIGBhY3RpdmVEcmFnZ2FibGVzYC5cbiAgICB0aGlzLl9ub3RpZnlSZWNlaXZpbmdTaWJsaW5ncygpO1xuICAgIHRoaXMuZW50ZXJlZC5uZXh0KHtpdGVtLCBjb250YWluZXI6IHRoaXMsIGN1cnJlbnRJbmRleDogdGhpcy5nZXRJdGVtSW5kZXgoaXRlbSl9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGFuIGl0ZW0gZnJvbSB0aGUgY29udGFpbmVyIGFmdGVyIGl0IHdhcyBkcmFnZ2VkIGludG8gYW5vdGhlciBjb250YWluZXIgYnkgdGhlIHVzZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdGhhdCB3YXMgZHJhZ2dlZCBvdXQuXG4gICAqL1xuICBleGl0KGl0ZW06IERyYWdSZWYpOiB2b2lkIHtcbiAgICB0aGlzLl9yZXNldCgpO1xuICAgIHRoaXMuZXhpdGVkLm5leHQoe2l0ZW0sIGNvbnRhaW5lcjogdGhpc30pO1xuICB9XG5cbiAgLyoqXG4gICAqIERyb3BzIGFuIGl0ZW0gaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSBiZWluZyBkcm9wcGVkIGludG8gdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGN1cnJlbnRJbmRleCBJbmRleCBhdCB3aGljaCB0aGUgaXRlbSBzaG91bGQgYmUgaW5zZXJ0ZWQuXG4gICAqIEBwYXJhbSBwcmV2aW91c0luZGV4IEluZGV4IG9mIHRoZSBpdGVtIHdoZW4gZHJhZ2dpbmcgc3RhcnRlZC5cbiAgICogQHBhcmFtIHByZXZpb3VzQ29udGFpbmVyIENvbnRhaW5lciBmcm9tIHdoaWNoIHRoZSBpdGVtIGdvdCBkcmFnZ2VkIGluLlxuICAgKiBAcGFyYW0gaXNQb2ludGVyT3ZlckNvbnRhaW5lciBXaGV0aGVyIHRoZSB1c2VyJ3MgcG9pbnRlciB3YXMgb3ZlciB0aGVcbiAgICogICAgY29udGFpbmVyIHdoZW4gdGhlIGl0ZW0gd2FzIGRyb3BwZWQuXG4gICAqIEBwYXJhbSBkaXN0YW5jZSBEaXN0YW5jZSB0aGUgdXNlciBoYXMgZHJhZ2dlZCBzaW5jZSB0aGUgc3RhcnQgb2YgdGhlIGRyYWdnaW5nIHNlcXVlbmNlLlxuICAgKiBAcGFyYW0gZXZlbnQgRXZlbnQgdGhhdCB0cmlnZ2VyZWQgdGhlIGRyb3BwaW5nIHNlcXVlbmNlLlxuICAgKlxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDE1LjAuMCBgcHJldmlvdXNJbmRleGAgYW5kIGBldmVudGAgcGFyYW1ldGVycyB0byBiZWNvbWUgcmVxdWlyZWQuXG4gICAqL1xuICBkcm9wKFxuICAgIGl0ZW06IERyYWdSZWYsXG4gICAgY3VycmVudEluZGV4OiBudW1iZXIsXG4gICAgcHJldmlvdXNJbmRleDogbnVtYmVyLFxuICAgIHByZXZpb3VzQ29udGFpbmVyOiBEcm9wTGlzdFJlZixcbiAgICBpc1BvaW50ZXJPdmVyQ29udGFpbmVyOiBib29sZWFuLFxuICAgIGRpc3RhbmNlOiBQb2ludCxcbiAgICBkcm9wUG9pbnQ6IFBvaW50LFxuICAgIGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCA9IHt9IGFzIGFueSxcbiAgKTogdm9pZCB7XG4gICAgdGhpcy5fcmVzZXQoKTtcbiAgICB0aGlzLmRyb3BwZWQubmV4dCh7XG4gICAgICBpdGVtLFxuICAgICAgY3VycmVudEluZGV4LFxuICAgICAgcHJldmlvdXNJbmRleCxcbiAgICAgIGNvbnRhaW5lcjogdGhpcyxcbiAgICAgIHByZXZpb3VzQ29udGFpbmVyLFxuICAgICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcixcbiAgICAgIGRpc3RhbmNlLFxuICAgICAgZHJvcFBvaW50LFxuICAgICAgZXZlbnQsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZHJhZ2dhYmxlIGl0ZW1zIHRoYXQgYXJlIGEgcGFydCBvZiB0aGlzIGxpc3QuXG4gICAqIEBwYXJhbSBpdGVtcyBJdGVtcyB0aGF0IGFyZSBhIHBhcnQgb2YgdGhpcyBsaXN0LlxuICAgKi9cbiAgd2l0aEl0ZW1zKGl0ZW1zOiBEcmFnUmVmW10pOiB0aGlzIHtcbiAgICBjb25zdCBwcmV2aW91c0l0ZW1zID0gdGhpcy5fZHJhZ2dhYmxlcztcbiAgICB0aGlzLl9kcmFnZ2FibGVzID0gaXRlbXM7XG4gICAgaXRlbXMuZm9yRWFjaChpdGVtID0+IGl0ZW0uX3dpdGhEcm9wQ29udGFpbmVyKHRoaXMpKTtcblxuICAgIGlmICh0aGlzLmlzRHJhZ2dpbmcoKSkge1xuICAgICAgY29uc3QgZHJhZ2dlZEl0ZW1zID0gcHJldmlvdXNJdGVtcy5maWx0ZXIoaXRlbSA9PiBpdGVtLmlzRHJhZ2dpbmcoKSk7XG5cbiAgICAgIC8vIElmIGFsbCBvZiB0aGUgaXRlbXMgYmVpbmcgZHJhZ2dlZCB3ZXJlIHJlbW92ZWRcbiAgICAgIC8vIGZyb20gdGhlIGxpc3QsIGFib3J0IHRoZSBjdXJyZW50IGRyYWcgc2VxdWVuY2UuXG4gICAgICBpZiAoZHJhZ2dlZEl0ZW1zLmV2ZXJ5KGl0ZW0gPT4gaXRlbXMuaW5kZXhPZihpdGVtKSA9PT0gLTEpKSB7XG4gICAgICAgIHRoaXMuX3Jlc2V0KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9jYWNoZUl0ZW1zKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogU2V0cyB0aGUgbGF5b3V0IGRpcmVjdGlvbiBvZiB0aGUgZHJvcCBsaXN0LiAqL1xuICB3aXRoRGlyZWN0aW9uKGRpcmVjdGlvbjogRGlyZWN0aW9uKTogdGhpcyB7XG4gICAgdGhpcy5fZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGNvbnRhaW5lcnMgdGhhdCBhcmUgY29ubmVjdGVkIHRvIHRoaXMgb25lLiBXaGVuIHR3byBvciBtb3JlIGNvbnRhaW5lcnMgYXJlXG4gICAqIGNvbm5lY3RlZCwgdGhlIHVzZXIgd2lsbCBiZSBhbGxvd2VkIHRvIHRyYW5zZmVyIGl0ZW1zIGJldHdlZW4gdGhlbS5cbiAgICogQHBhcmFtIGNvbm5lY3RlZFRvIE90aGVyIGNvbnRhaW5lcnMgdGhhdCB0aGUgY3VycmVudCBjb250YWluZXJzIHNob3VsZCBiZSBjb25uZWN0ZWQgdG8uXG4gICAqL1xuICBjb25uZWN0ZWRUbyhjb25uZWN0ZWRUbzogRHJvcExpc3RSZWZbXSk6IHRoaXMge1xuICAgIHRoaXMuX3NpYmxpbmdzID0gY29ubmVjdGVkVG8uc2xpY2UoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBvcmllbnRhdGlvbiBvZiB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gb3JpZW50YXRpb24gTmV3IG9yaWVudGF0aW9uIGZvciB0aGUgY29udGFpbmVyLlxuICAgKi9cbiAgd2l0aE9yaWVudGF0aW9uKG9yaWVudGF0aW9uOiAndmVydGljYWwnIHwgJ2hvcml6b250YWwnKTogdGhpcyB7XG4gICAgdGhpcy5fb3JpZW50YXRpb24gPSBvcmllbnRhdGlvbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHdoaWNoIHBhcmVudCBlbGVtZW50cyBhcmUgY2FuIGJlIHNjcm9sbGVkIHdoaWxlIHRoZSB1c2VyIGlzIGRyYWdnaW5nLlxuICAgKiBAcGFyYW0gZWxlbWVudHMgRWxlbWVudHMgdGhhdCBjYW4gYmUgc2Nyb2xsZWQuXG4gICAqL1xuICB3aXRoU2Nyb2xsYWJsZVBhcmVudHMoZWxlbWVudHM6IEhUTUxFbGVtZW50W10pOiB0aGlzIHtcbiAgICBjb25zdCBlbGVtZW50ID0gY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpO1xuXG4gICAgLy8gV2UgYWx3YXlzIGFsbG93IHRoZSBjdXJyZW50IGVsZW1lbnQgdG8gYmUgc2Nyb2xsYWJsZVxuICAgIC8vIHNvIHdlIG5lZWQgdG8gZW5zdXJlIHRoYXQgaXQncyBpbiB0aGUgYXJyYXkuXG4gICAgdGhpcy5fc2Nyb2xsYWJsZUVsZW1lbnRzID1cbiAgICAgIGVsZW1lbnRzLmluZGV4T2YoZWxlbWVudCkgPT09IC0xID8gW2VsZW1lbnQsIC4uLmVsZW1lbnRzXSA6IGVsZW1lbnRzLnNsaWNlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgc2Nyb2xsYWJsZSBwYXJlbnRzIHRoYXQgYXJlIHJlZ2lzdGVyZWQgd2l0aCB0aGlzIGRyb3AgY29udGFpbmVyLiAqL1xuICBnZXRTY3JvbGxhYmxlUGFyZW50cygpOiByZWFkb25seSBIVE1MRWxlbWVudFtdIHtcbiAgICByZXR1cm4gdGhpcy5fc2Nyb2xsYWJsZUVsZW1lbnRzO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpZ3VyZXMgb3V0IHRoZSBpbmRleCBvZiBhbiBpdGVtIGluIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gd2hvc2UgaW5kZXggc2hvdWxkIGJlIGRldGVybWluZWQuXG4gICAqL1xuICBnZXRJdGVtSW5kZXgoaXRlbTogRHJhZ1JlZik6IG51bWJlciB7XG4gICAgaWYgKCF0aGlzLl9pc0RyYWdnaW5nKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZHJhZ2dhYmxlcy5pbmRleE9mKGl0ZW0pO1xuICAgIH1cblxuICAgIC8vIEl0ZW1zIGFyZSBzb3J0ZWQgYWx3YXlzIGJ5IHRvcC9sZWZ0IGluIHRoZSBjYWNoZSwgaG93ZXZlciB0aGV5IGZsb3cgZGlmZmVyZW50bHkgaW4gUlRMLlxuICAgIC8vIFRoZSByZXN0IG9mIHRoZSBsb2dpYyBzdGlsbCBzdGFuZHMgbm8gbWF0dGVyIHdoYXQgb3JpZW50YXRpb24gd2UncmUgaW4sIGhvd2V2ZXJcbiAgICAvLyB3ZSBuZWVkIHRvIGludmVydCB0aGUgYXJyYXkgd2hlbiBkZXRlcm1pbmluZyB0aGUgaW5kZXguXG4gICAgY29uc3QgaXRlbXMgPVxuICAgICAgdGhpcy5fb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJyAmJiB0aGlzLl9kaXJlY3Rpb24gPT09ICdydGwnXG4gICAgICAgID8gdGhpcy5faXRlbVBvc2l0aW9ucy5zbGljZSgpLnJldmVyc2UoKVxuICAgICAgICA6IHRoaXMuX2l0ZW1Qb3NpdGlvbnM7XG5cbiAgICByZXR1cm4gaXRlbXMuZmluZEluZGV4KGN1cnJlbnRJdGVtID0+IGN1cnJlbnRJdGVtLmRyYWcgPT09IGl0ZW0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGxpc3QgaXMgYWJsZSB0byByZWNlaXZlIHRoZSBpdGVtIHRoYXRcbiAgICogaXMgY3VycmVudGx5IGJlaW5nIGRyYWdnZWQgaW5zaWRlIGEgY29ubmVjdGVkIGRyb3AgbGlzdC5cbiAgICovXG4gIGlzUmVjZWl2aW5nKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9hY3RpdmVTaWJsaW5ncy5zaXplID4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTb3J0cyBhbiBpdGVtIGluc2lkZSB0aGUgY29udGFpbmVyIGJhc2VkIG9uIGl0cyBwb3NpdGlvbi5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB0byBiZSBzb3J0ZWQuXG4gICAqIEBwYXJhbSBwb2ludGVyWCBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0gcG9pbnRlclkgUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFkgYXhpcy5cbiAgICogQHBhcmFtIHBvaW50ZXJEZWx0YSBEaXJlY3Rpb24gaW4gd2hpY2ggdGhlIHBvaW50ZXIgaXMgbW92aW5nIGFsb25nIGVhY2ggYXhpcy5cbiAgICovXG4gIF9zb3J0SXRlbShcbiAgICBpdGVtOiBEcmFnUmVmLFxuICAgIHBvaW50ZXJYOiBudW1iZXIsXG4gICAgcG9pbnRlclk6IG51bWJlcixcbiAgICBwb2ludGVyRGVsdGE6IHt4OiBudW1iZXI7IHk6IG51bWJlcn0sXG4gICk6IHZvaWQge1xuICAgIC8vIERvbid0IHNvcnQgdGhlIGl0ZW0gaWYgc29ydGluZyBpcyBkaXNhYmxlZCBvciBpdCdzIG91dCBvZiByYW5nZS5cbiAgICBpZiAoXG4gICAgICB0aGlzLnNvcnRpbmdEaXNhYmxlZCB8fFxuICAgICAgIXRoaXMuX2NsaWVudFJlY3QgfHxcbiAgICAgICFpc1BvaW50ZXJOZWFyQ2xpZW50UmVjdCh0aGlzLl9jbGllbnRSZWN0LCBEUk9QX1BST1hJTUlUWV9USFJFU0hPTEQsIHBvaW50ZXJYLCBwb2ludGVyWSlcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzaWJsaW5ncyA9IHRoaXMuX2l0ZW1Qb3NpdGlvbnM7XG4gICAgY29uc3QgbmV3SW5kZXggPSB0aGlzLl9nZXRJdGVtSW5kZXhGcm9tUG9pbnRlclBvc2l0aW9uKGl0ZW0sIHBvaW50ZXJYLCBwb2ludGVyWSwgcG9pbnRlckRlbHRhKTtcblxuICAgIGlmIChuZXdJbmRleCA9PT0gLTEgJiYgc2libGluZ3MubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCc7XG4gICAgY29uc3QgY3VycmVudEluZGV4ID0gc2libGluZ3MuZmluZEluZGV4KGN1cnJlbnRJdGVtID0+IGN1cnJlbnRJdGVtLmRyYWcgPT09IGl0ZW0pO1xuICAgIGNvbnN0IHNpYmxpbmdBdE5ld1Bvc2l0aW9uID0gc2libGluZ3NbbmV3SW5kZXhdO1xuICAgIGNvbnN0IGN1cnJlbnRQb3NpdGlvbiA9IHNpYmxpbmdzW2N1cnJlbnRJbmRleF0uY2xpZW50UmVjdDtcbiAgICBjb25zdCBuZXdQb3NpdGlvbiA9IHNpYmxpbmdBdE5ld1Bvc2l0aW9uLmNsaWVudFJlY3Q7XG4gICAgY29uc3QgZGVsdGEgPSBjdXJyZW50SW5kZXggPiBuZXdJbmRleCA/IDEgOiAtMTtcblxuICAgIC8vIEhvdyBtYW55IHBpeGVscyB0aGUgaXRlbSdzIHBsYWNlaG9sZGVyIHNob3VsZCBiZSBvZmZzZXQuXG4gICAgY29uc3QgaXRlbU9mZnNldCA9IHRoaXMuX2dldEl0ZW1PZmZzZXRQeChjdXJyZW50UG9zaXRpb24sIG5ld1Bvc2l0aW9uLCBkZWx0YSk7XG5cbiAgICAvLyBIb3cgbWFueSBwaXhlbHMgYWxsIHRoZSBvdGhlciBpdGVtcyBzaG91bGQgYmUgb2Zmc2V0LlxuICAgIGNvbnN0IHNpYmxpbmdPZmZzZXQgPSB0aGlzLl9nZXRTaWJsaW5nT2Zmc2V0UHgoY3VycmVudEluZGV4LCBzaWJsaW5ncywgZGVsdGEpO1xuXG4gICAgLy8gU2F2ZSB0aGUgcHJldmlvdXMgb3JkZXIgb2YgdGhlIGl0ZW1zIGJlZm9yZSBtb3ZpbmcgdGhlIGl0ZW0gdG8gaXRzIG5ldyBpbmRleC5cbiAgICAvLyBXZSB1c2UgdGhpcyB0byBjaGVjayB3aGV0aGVyIGFuIGl0ZW0gaGFzIGJlZW4gbW92ZWQgYXMgYSByZXN1bHQgb2YgdGhlIHNvcnRpbmcuXG4gICAgY29uc3Qgb2xkT3JkZXIgPSBzaWJsaW5ncy5zbGljZSgpO1xuXG4gICAgLy8gU2h1ZmZsZSB0aGUgYXJyYXkgaW4gcGxhY2UuXG4gICAgbW92ZUl0ZW1JbkFycmF5KHNpYmxpbmdzLCBjdXJyZW50SW5kZXgsIG5ld0luZGV4KTtcblxuICAgIHRoaXMuc29ydGVkLm5leHQoe1xuICAgICAgcHJldmlvdXNJbmRleDogY3VycmVudEluZGV4LFxuICAgICAgY3VycmVudEluZGV4OiBuZXdJbmRleCxcbiAgICAgIGNvbnRhaW5lcjogdGhpcyxcbiAgICAgIGl0ZW0sXG4gICAgfSk7XG5cbiAgICBzaWJsaW5ncy5mb3JFYWNoKChzaWJsaW5nLCBpbmRleCkgPT4ge1xuICAgICAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgdGhlIHBvc2l0aW9uIGhhc24ndCBjaGFuZ2VkLlxuICAgICAgaWYgKG9sZE9yZGVyW2luZGV4XSA9PT0gc2libGluZykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGlzRHJhZ2dlZEl0ZW0gPSBzaWJsaW5nLmRyYWcgPT09IGl0ZW07XG4gICAgICBjb25zdCBvZmZzZXQgPSBpc0RyYWdnZWRJdGVtID8gaXRlbU9mZnNldCA6IHNpYmxpbmdPZmZzZXQ7XG4gICAgICBjb25zdCBlbGVtZW50VG9PZmZzZXQgPSBpc0RyYWdnZWRJdGVtXG4gICAgICAgID8gaXRlbS5nZXRQbGFjZWhvbGRlckVsZW1lbnQoKVxuICAgICAgICA6IHNpYmxpbmcuZHJhZy5nZXRSb290RWxlbWVudCgpO1xuXG4gICAgICAvLyBVcGRhdGUgdGhlIG9mZnNldCB0byByZWZsZWN0IHRoZSBuZXcgcG9zaXRpb24uXG4gICAgICBzaWJsaW5nLm9mZnNldCArPSBvZmZzZXQ7XG5cbiAgICAgIC8vIFNpbmNlIHdlJ3JlIG1vdmluZyB0aGUgaXRlbXMgd2l0aCBhIGB0cmFuc2Zvcm1gLCB3ZSBuZWVkIHRvIGFkanVzdCB0aGVpciBjYWNoZWRcbiAgICAgIC8vIGNsaWVudCByZWN0cyB0byByZWZsZWN0IHRoZWlyIG5ldyBwb3NpdGlvbiwgYXMgd2VsbCBhcyBzd2FwIHRoZWlyIHBvc2l0aW9ucyBpbiB0aGUgY2FjaGUuXG4gICAgICAvLyBOb3RlIHRoYXQgd2Ugc2hvdWxkbid0IHVzZSBgZ2V0Qm91bmRpbmdDbGllbnRSZWN0YCBoZXJlIHRvIHVwZGF0ZSB0aGUgY2FjaGUsIGJlY2F1c2UgdGhlXG4gICAgICAvLyBlbGVtZW50cyBtYXkgYmUgbWlkLWFuaW1hdGlvbiB3aGljaCB3aWxsIGdpdmUgdXMgYSB3cm9uZyByZXN1bHQuXG4gICAgICBpZiAoaXNIb3Jpem9udGFsKSB7XG4gICAgICAgIC8vIFJvdW5kIHRoZSB0cmFuc2Zvcm1zIHNpbmNlIHNvbWUgYnJvd3NlcnMgd2lsbFxuICAgICAgICAvLyBibHVyIHRoZSBlbGVtZW50cywgZm9yIHN1Yi1waXhlbCB0cmFuc2Zvcm1zLlxuICAgICAgICBlbGVtZW50VG9PZmZzZXQuc3R5bGUudHJhbnNmb3JtID0gY29tYmluZVRyYW5zZm9ybXMoXG4gICAgICAgICAgYHRyYW5zbGF0ZTNkKCR7TWF0aC5yb3VuZChzaWJsaW5nLm9mZnNldCl9cHgsIDAsIDApYCxcbiAgICAgICAgICBzaWJsaW5nLmluaXRpYWxUcmFuc2Zvcm0sXG4gICAgICAgICk7XG4gICAgICAgIGFkanVzdENsaWVudFJlY3Qoc2libGluZy5jbGllbnRSZWN0LCAwLCBvZmZzZXQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWxlbWVudFRvT2Zmc2V0LnN0eWxlLnRyYW5zZm9ybSA9IGNvbWJpbmVUcmFuc2Zvcm1zKFxuICAgICAgICAgIGB0cmFuc2xhdGUzZCgwLCAke01hdGgucm91bmQoc2libGluZy5vZmZzZXQpfXB4LCAwKWAsXG4gICAgICAgICAgc2libGluZy5pbml0aWFsVHJhbnNmb3JtLFxuICAgICAgICApO1xuICAgICAgICBhZGp1c3RDbGllbnRSZWN0KHNpYmxpbmcuY2xpZW50UmVjdCwgb2Zmc2V0LCAwKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIE5vdGUgdGhhdCBpdCdzIGltcG9ydGFudCB0aGF0IHdlIGRvIHRoaXMgYWZ0ZXIgdGhlIGNsaWVudCByZWN0cyBoYXZlIGJlZW4gYWRqdXN0ZWQuXG4gICAgdGhpcy5fcHJldmlvdXNTd2FwLm92ZXJsYXBzID0gaXNJbnNpZGVDbGllbnRSZWN0KG5ld1Bvc2l0aW9uLCBwb2ludGVyWCwgcG9pbnRlclkpO1xuICAgIHRoaXMuX3ByZXZpb3VzU3dhcC5kcmFnID0gc2libGluZ0F0TmV3UG9zaXRpb24uZHJhZztcbiAgICB0aGlzLl9wcmV2aW91c1N3YXAuZGVsdGEgPSBpc0hvcml6b250YWwgPyBwb2ludGVyRGVsdGEueCA6IHBvaW50ZXJEZWx0YS55O1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSB1c2VyJ3MgcG9pbnRlciBpcyBjbG9zZSB0byB0aGUgZWRnZXMgb2YgZWl0aGVyIHRoZVxuICAgKiB2aWV3cG9ydCBvciB0aGUgZHJvcCBsaXN0IGFuZCBzdGFydHMgdGhlIGF1dG8tc2Nyb2xsIHNlcXVlbmNlLlxuICAgKiBAcGFyYW0gcG9pbnRlclggVXNlcidzIHBvaW50ZXIgcG9zaXRpb24gYWxvbmcgdGhlIHggYXhpcy5cbiAgICogQHBhcmFtIHBvaW50ZXJZIFVzZXIncyBwb2ludGVyIHBvc2l0aW9uIGFsb25nIHRoZSB5IGF4aXMuXG4gICAqL1xuICBfc3RhcnRTY3JvbGxpbmdJZk5lY2Vzc2FyeShwb2ludGVyWDogbnVtYmVyLCBwb2ludGVyWTogbnVtYmVyKSB7XG4gICAgaWYgKHRoaXMuYXV0b1Njcm9sbERpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IHNjcm9sbE5vZGU6IEhUTUxFbGVtZW50IHwgV2luZG93IHwgdW5kZWZpbmVkO1xuICAgIGxldCB2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5OT05FO1xuICAgIGxldCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTk9ORTtcblxuICAgIC8vIENoZWNrIHdoZXRoZXIgd2Ugc2hvdWxkIHN0YXJ0IHNjcm9sbGluZyBhbnkgb2YgdGhlIHBhcmVudCBjb250YWluZXJzLlxuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5wb3NpdGlvbnMuZm9yRWFjaCgocG9zaXRpb24sIGVsZW1lbnQpID0+IHtcbiAgICAgIC8vIFdlIGhhdmUgc3BlY2lhbCBoYW5kbGluZyBmb3IgdGhlIGBkb2N1bWVudGAgYmVsb3cuIEFsc28gdGhpcyB3b3VsZCBiZVxuICAgICAgLy8gbmljZXIgd2l0aCBhICBmb3IuLi5vZiBsb29wLCBidXQgaXQgcmVxdWlyZXMgY2hhbmdpbmcgYSBjb21waWxlciBmbGFnLlxuICAgICAgaWYgKGVsZW1lbnQgPT09IHRoaXMuX2RvY3VtZW50IHx8ICFwb3NpdGlvbi5jbGllbnRSZWN0IHx8IHNjcm9sbE5vZGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoXG4gICAgICAgIGlzUG9pbnRlck5lYXJDbGllbnRSZWN0KHBvc2l0aW9uLmNsaWVudFJlY3QsIERST1BfUFJPWElNSVRZX1RIUkVTSE9MRCwgcG9pbnRlclgsIHBvaW50ZXJZKVxuICAgICAgKSB7XG4gICAgICAgIFt2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiwgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbl0gPSBnZXRFbGVtZW50U2Nyb2xsRGlyZWN0aW9ucyhcbiAgICAgICAgICBlbGVtZW50IGFzIEhUTUxFbGVtZW50LFxuICAgICAgICAgIHBvc2l0aW9uLmNsaWVudFJlY3QsXG4gICAgICAgICAgcG9pbnRlclgsXG4gICAgICAgICAgcG9pbnRlclksXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uIHx8IGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24pIHtcbiAgICAgICAgICBzY3JvbGxOb2RlID0gZWxlbWVudCBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gT3RoZXJ3aXNlIGNoZWNrIGlmIHdlIGNhbiBzdGFydCBzY3JvbGxpbmcgdGhlIHZpZXdwb3J0LlxuICAgIGlmICghdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gJiYgIWhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24pIHtcbiAgICAgIGNvbnN0IHt3aWR0aCwgaGVpZ2h0fSA9IHRoaXMuX3ZpZXdwb3J0UnVsZXIuZ2V0Vmlld3BvcnRTaXplKCk7XG4gICAgICBjb25zdCBjbGllbnRSZWN0ID0ge1xuICAgICAgICB3aWR0aCxcbiAgICAgICAgaGVpZ2h0LFxuICAgICAgICB0b3A6IDAsXG4gICAgICAgIHJpZ2h0OiB3aWR0aCxcbiAgICAgICAgYm90dG9tOiBoZWlnaHQsXG4gICAgICAgIGxlZnQ6IDAsXG4gICAgICB9IGFzIENsaWVudFJlY3Q7XG4gICAgICB2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IGdldFZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uKGNsaWVudFJlY3QsIHBvaW50ZXJZKTtcbiAgICAgIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBnZXRIb3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKGNsaWVudFJlY3QsIHBvaW50ZXJYKTtcbiAgICAgIHNjcm9sbE5vZGUgPSB3aW5kb3c7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgc2Nyb2xsTm9kZSAmJlxuICAgICAgKHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uICE9PSB0aGlzLl92ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiB8fFxuICAgICAgICBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uICE9PSB0aGlzLl9ob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uIHx8XG4gICAgICAgIHNjcm9sbE5vZGUgIT09IHRoaXMuX3Njcm9sbE5vZGUpXG4gICAgKSB7XG4gICAgICB0aGlzLl92ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uO1xuICAgICAgdGhpcy5faG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb247XG4gICAgICB0aGlzLl9zY3JvbGxOb2RlID0gc2Nyb2xsTm9kZTtcblxuICAgICAgaWYgKCh2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiB8fCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKSAmJiBzY3JvbGxOb2RlKSB7XG4gICAgICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcih0aGlzLl9zdGFydFNjcm9sbEludGVydmFsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3N0b3BTY3JvbGxpbmcoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogU3RvcHMgYW55IGN1cnJlbnRseS1ydW5uaW5nIGF1dG8tc2Nyb2xsIHNlcXVlbmNlcy4gKi9cbiAgX3N0b3BTY3JvbGxpbmcoKSB7XG4gICAgdGhpcy5fc3RvcFNjcm9sbFRpbWVycy5uZXh0KCk7XG4gIH1cblxuICAvKiogU3RhcnRzIHRoZSBkcmFnZ2luZyBzZXF1ZW5jZSB3aXRoaW4gdGhlIGxpc3QuICovXG4gIHByaXZhdGUgX2RyYWdnaW5nU3RhcnRlZCgpIHtcbiAgICBjb25zdCBzdHlsZXMgPSBjb2VyY2VFbGVtZW50KHRoaXMuZWxlbWVudCkuc3R5bGUgYXMgRHJhZ0NTU1N0eWxlRGVjbGFyYXRpb247XG4gICAgdGhpcy5iZWZvcmVTdGFydGVkLm5leHQoKTtcbiAgICB0aGlzLl9pc0RyYWdnaW5nID0gdHJ1ZTtcblxuICAgIC8vIFdlIG5lZWQgdG8gZGlzYWJsZSBzY3JvbGwgc25hcHBpbmcgd2hpbGUgdGhlIHVzZXIgaXMgZHJhZ2dpbmcsIGJlY2F1c2UgaXQgYnJlYWtzIGF1dG9tYXRpY1xuICAgIC8vIHNjcm9sbGluZy4gVGhlIGJyb3dzZXIgc2VlbXMgdG8gcm91bmQgdGhlIHZhbHVlIGJhc2VkIG9uIHRoZSBzbmFwcGluZyBwb2ludHMgd2hpY2ggbWVhbnNcbiAgICAvLyB0aGF0IHdlIGNhbid0IGluY3JlbWVudC9kZWNyZW1lbnQgdGhlIHNjcm9sbCBwb3NpdGlvbi5cbiAgICB0aGlzLl9pbml0aWFsU2Nyb2xsU25hcCA9IHN0eWxlcy5tc1Njcm9sbFNuYXBUeXBlIHx8IHN0eWxlcy5zY3JvbGxTbmFwVHlwZSB8fCAnJztcbiAgICBzdHlsZXMuc2Nyb2xsU25hcFR5cGUgPSBzdHlsZXMubXNTY3JvbGxTbmFwVHlwZSA9ICdub25lJztcbiAgICB0aGlzLl9jYWNoZUl0ZW1zKCk7XG4gICAgdGhpcy5fdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9saXN0ZW5Ub1Njcm9sbEV2ZW50cygpO1xuICB9XG5cbiAgLyoqIENhY2hlcyB0aGUgcG9zaXRpb25zIG9mIHRoZSBjb25maWd1cmVkIHNjcm9sbGFibGUgcGFyZW50cy4gKi9cbiAgcHJpdmF0ZSBfY2FjaGVQYXJlbnRQb3NpdGlvbnMoKSB7XG4gICAgY29uc3QgZWxlbWVudCA9IGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KTtcbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuY2FjaGUodGhpcy5fc2Nyb2xsYWJsZUVsZW1lbnRzKTtcblxuICAgIC8vIFRoZSBsaXN0IGVsZW1lbnQgaXMgYWx3YXlzIGluIHRoZSBgc2Nyb2xsYWJsZUVsZW1lbnRzYFxuICAgIC8vIHNvIHdlIGNhbiB0YWtlIGFkdmFudGFnZSBvZiB0aGUgY2FjaGVkIGBDbGllbnRSZWN0YC5cbiAgICB0aGlzLl9jbGllbnRSZWN0ID0gdGhpcy5fcGFyZW50UG9zaXRpb25zLnBvc2l0aW9ucy5nZXQoZWxlbWVudCkhLmNsaWVudFJlY3QhO1xuICB9XG5cbiAgLyoqIFJlZnJlc2hlcyB0aGUgcG9zaXRpb24gY2FjaGUgb2YgdGhlIGl0ZW1zIGFuZCBzaWJsaW5nIGNvbnRhaW5lcnMuICovXG4gIHByaXZhdGUgX2NhY2hlSXRlbVBvc2l0aW9ucygpIHtcbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuXG4gICAgdGhpcy5faXRlbVBvc2l0aW9ucyA9IHRoaXMuX2FjdGl2ZURyYWdnYWJsZXNcbiAgICAgIC5tYXAoZHJhZyA9PiB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnRUb01lYXN1cmUgPSBkcmFnLmdldFZpc2libGVFbGVtZW50KCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZHJhZyxcbiAgICAgICAgICBvZmZzZXQ6IDAsXG4gICAgICAgICAgaW5pdGlhbFRyYW5zZm9ybTogZWxlbWVudFRvTWVhc3VyZS5zdHlsZS50cmFuc2Zvcm0gfHwgJycsXG4gICAgICAgICAgY2xpZW50UmVjdDogZ2V0TXV0YWJsZUNsaWVudFJlY3QoZWxlbWVudFRvTWVhc3VyZSksXG4gICAgICAgIH07XG4gICAgICB9KVxuICAgICAgLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgcmV0dXJuIGlzSG9yaXpvbnRhbFxuICAgICAgICAgID8gYS5jbGllbnRSZWN0LmxlZnQgLSBiLmNsaWVudFJlY3QubGVmdFxuICAgICAgICAgIDogYS5jbGllbnRSZWN0LnRvcCAtIGIuY2xpZW50UmVjdC50b3A7XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKiBSZXNldHMgdGhlIGNvbnRhaW5lciB0byBpdHMgaW5pdGlhbCBzdGF0ZS4gKi9cbiAgcHJpdmF0ZSBfcmVzZXQoKSB7XG4gICAgdGhpcy5faXNEcmFnZ2luZyA9IGZhbHNlO1xuXG4gICAgY29uc3Qgc3R5bGVzID0gY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpLnN0eWxlIGFzIERyYWdDU1NTdHlsZURlY2xhcmF0aW9uO1xuICAgIHN0eWxlcy5zY3JvbGxTbmFwVHlwZSA9IHN0eWxlcy5tc1Njcm9sbFNuYXBUeXBlID0gdGhpcy5faW5pdGlhbFNjcm9sbFNuYXA7XG5cbiAgICAvLyBUT0RPKGNyaXNiZXRvKTogbWF5IGhhdmUgdG8gd2FpdCBmb3IgdGhlIGFuaW1hdGlvbnMgdG8gZmluaXNoLlxuICAgIHRoaXMuX2FjdGl2ZURyYWdnYWJsZXMuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgIGNvbnN0IHJvb3RFbGVtZW50ID0gaXRlbS5nZXRSb290RWxlbWVudCgpO1xuXG4gICAgICBpZiAocm9vdEVsZW1lbnQpIHtcbiAgICAgICAgY29uc3QgaW5pdGlhbFRyYW5zZm9ybSA9IHRoaXMuX2l0ZW1Qb3NpdGlvbnMuZmluZChcbiAgICAgICAgICBjdXJyZW50ID0+IGN1cnJlbnQuZHJhZyA9PT0gaXRlbSxcbiAgICAgICAgKT8uaW5pdGlhbFRyYW5zZm9ybTtcbiAgICAgICAgcm9vdEVsZW1lbnQuc3R5bGUudHJhbnNmb3JtID0gaW5pdGlhbFRyYW5zZm9ybSB8fCAnJztcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLl9zaWJsaW5ncy5mb3JFYWNoKHNpYmxpbmcgPT4gc2libGluZy5fc3RvcFJlY2VpdmluZyh0aGlzKSk7XG4gICAgdGhpcy5fYWN0aXZlRHJhZ2dhYmxlcyA9IFtdO1xuICAgIHRoaXMuX2l0ZW1Qb3NpdGlvbnMgPSBbXTtcbiAgICB0aGlzLl9wcmV2aW91c1N3YXAuZHJhZyA9IG51bGw7XG4gICAgdGhpcy5fcHJldmlvdXNTd2FwLmRlbHRhID0gMDtcbiAgICB0aGlzLl9wcmV2aW91c1N3YXAub3ZlcmxhcHMgPSBmYWxzZTtcbiAgICB0aGlzLl9zdG9wU2Nyb2xsaW5nKCk7XG4gICAgdGhpcy5fdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBvZmZzZXQgaW4gcGl4ZWxzIGJ5IHdoaWNoIHRoZSBpdGVtcyB0aGF0IGFyZW4ndCBiZWluZyBkcmFnZ2VkIHNob3VsZCBiZSBtb3ZlZC5cbiAgICogQHBhcmFtIGN1cnJlbnRJbmRleCBJbmRleCBvZiB0aGUgaXRlbSBjdXJyZW50bHkgYmVpbmcgZHJhZ2dlZC5cbiAgICogQHBhcmFtIHNpYmxpbmdzIEFsbCBvZiB0aGUgaXRlbXMgaW4gdGhlIGxpc3QuXG4gICAqIEBwYXJhbSBkZWx0YSBEaXJlY3Rpb24gaW4gd2hpY2ggdGhlIHVzZXIgaXMgbW92aW5nLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0U2libGluZ09mZnNldFB4KGN1cnJlbnRJbmRleDogbnVtYmVyLCBzaWJsaW5nczogQ2FjaGVkSXRlbVBvc2l0aW9uW10sIGRlbHRhOiAxIHwgLTEpIHtcbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuICAgIGNvbnN0IGN1cnJlbnRQb3NpdGlvbiA9IHNpYmxpbmdzW2N1cnJlbnRJbmRleF0uY2xpZW50UmVjdDtcbiAgICBjb25zdCBpbW1lZGlhdGVTaWJsaW5nID0gc2libGluZ3NbY3VycmVudEluZGV4ICsgZGVsdGEgKiAtMV07XG4gICAgbGV0IHNpYmxpbmdPZmZzZXQgPSBjdXJyZW50UG9zaXRpb25baXNIb3Jpem9udGFsID8gJ3dpZHRoJyA6ICdoZWlnaHQnXSAqIGRlbHRhO1xuXG4gICAgaWYgKGltbWVkaWF0ZVNpYmxpbmcpIHtcbiAgICAgIGNvbnN0IHN0YXJ0ID0gaXNIb3Jpem9udGFsID8gJ2xlZnQnIDogJ3RvcCc7XG4gICAgICBjb25zdCBlbmQgPSBpc0hvcml6b250YWwgPyAncmlnaHQnIDogJ2JvdHRvbSc7XG5cbiAgICAgIC8vIEdldCB0aGUgc3BhY2luZyBiZXR3ZWVuIHRoZSBzdGFydCBvZiB0aGUgY3VycmVudCBpdGVtIGFuZCB0aGUgZW5kIG9mIHRoZSBvbmUgaW1tZWRpYXRlbHlcbiAgICAgIC8vIGFmdGVyIGl0IGluIHRoZSBkaXJlY3Rpb24gaW4gd2hpY2ggdGhlIHVzZXIgaXMgZHJhZ2dpbmcsIG9yIHZpY2UgdmVyc2EuIFdlIGFkZCBpdCB0byB0aGVcbiAgICAgIC8vIG9mZnNldCBpbiBvcmRlciB0byBwdXNoIHRoZSBlbGVtZW50IHRvIHdoZXJlIGl0IHdpbGwgYmUgd2hlbiBpdCdzIGlubGluZSBhbmQgaXMgaW5mbHVlbmNlZFxuICAgICAgLy8gYnkgdGhlIGBtYXJnaW5gIG9mIGl0cyBzaWJsaW5ncy5cbiAgICAgIGlmIChkZWx0YSA9PT0gLTEpIHtcbiAgICAgICAgc2libGluZ09mZnNldCAtPSBpbW1lZGlhdGVTaWJsaW5nLmNsaWVudFJlY3Rbc3RhcnRdIC0gY3VycmVudFBvc2l0aW9uW2VuZF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzaWJsaW5nT2Zmc2V0ICs9IGN1cnJlbnRQb3NpdGlvbltzdGFydF0gLSBpbW1lZGlhdGVTaWJsaW5nLmNsaWVudFJlY3RbZW5kXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2libGluZ09mZnNldDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBvZmZzZXQgaW4gcGl4ZWxzIGJ5IHdoaWNoIHRoZSBpdGVtIHRoYXQgaXMgYmVpbmcgZHJhZ2dlZCBzaG91bGQgYmUgbW92ZWQuXG4gICAqIEBwYXJhbSBjdXJyZW50UG9zaXRpb24gQ3VycmVudCBwb3NpdGlvbiBvZiB0aGUgaXRlbS5cbiAgICogQHBhcmFtIG5ld1Bvc2l0aW9uIFBvc2l0aW9uIG9mIHRoZSBpdGVtIHdoZXJlIHRoZSBjdXJyZW50IGl0ZW0gc2hvdWxkIGJlIG1vdmVkLlxuICAgKiBAcGFyYW0gZGVsdGEgRGlyZWN0aW9uIGluIHdoaWNoIHRoZSB1c2VyIGlzIG1vdmluZy5cbiAgICovXG4gIHByaXZhdGUgX2dldEl0ZW1PZmZzZXRQeChjdXJyZW50UG9zaXRpb246IENsaWVudFJlY3QsIG5ld1Bvc2l0aW9uOiBDbGllbnRSZWN0LCBkZWx0YTogMSB8IC0xKSB7XG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gdGhpcy5fb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJztcbiAgICBsZXQgaXRlbU9mZnNldCA9IGlzSG9yaXpvbnRhbFxuICAgICAgPyBuZXdQb3NpdGlvbi5sZWZ0IC0gY3VycmVudFBvc2l0aW9uLmxlZnRcbiAgICAgIDogbmV3UG9zaXRpb24udG9wIC0gY3VycmVudFBvc2l0aW9uLnRvcDtcblxuICAgIC8vIEFjY291bnQgZm9yIGRpZmZlcmVuY2VzIGluIHRoZSBpdGVtIHdpZHRoL2hlaWdodC5cbiAgICBpZiAoZGVsdGEgPT09IC0xKSB7XG4gICAgICBpdGVtT2Zmc2V0ICs9IGlzSG9yaXpvbnRhbFxuICAgICAgICA/IG5ld1Bvc2l0aW9uLndpZHRoIC0gY3VycmVudFBvc2l0aW9uLndpZHRoXG4gICAgICAgIDogbmV3UG9zaXRpb24uaGVpZ2h0IC0gY3VycmVudFBvc2l0aW9uLmhlaWdodDtcbiAgICB9XG5cbiAgICByZXR1cm4gaXRlbU9mZnNldDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgcG9pbnRlciBpcyBlbnRlcmluZyBpbiB0aGUgZmlyc3QgcG9zaXRpb25cbiAgICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0gcG9pbnRlclkgUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqL1xuICBwcml2YXRlIF9zaG91bGRFbnRlckFzRmlyc3RDaGlsZChwb2ludGVyWDogbnVtYmVyLCBwb2ludGVyWTogbnVtYmVyKSB7XG4gICAgaWYgKCF0aGlzLl9hY3RpdmVEcmFnZ2FibGVzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IGl0ZW1Qb3NpdGlvbnMgPSB0aGlzLl9pdGVtUG9zaXRpb25zO1xuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCc7XG5cbiAgICAvLyBgaXRlbVBvc2l0aW9uc2AgYXJlIHNvcnRlZCBieSBwb3NpdGlvbiB3aGlsZSBgYWN0aXZlRHJhZ2dhYmxlc2AgYXJlIHNvcnRlZCBieSBjaGlsZCBpbmRleFxuICAgIC8vIGNoZWNrIGlmIGNvbnRhaW5lciBpcyB1c2luZyBzb21lIHNvcnQgb2YgXCJyZXZlcnNlXCIgb3JkZXJpbmcgKGVnOiBmbGV4LWRpcmVjdGlvbjogcm93LXJldmVyc2UpXG4gICAgY29uc3QgcmV2ZXJzZWQgPSBpdGVtUG9zaXRpb25zWzBdLmRyYWcgIT09IHRoaXMuX2FjdGl2ZURyYWdnYWJsZXNbMF07XG4gICAgaWYgKHJldmVyc2VkKSB7XG4gICAgICBjb25zdCBsYXN0SXRlbVJlY3QgPSBpdGVtUG9zaXRpb25zW2l0ZW1Qb3NpdGlvbnMubGVuZ3RoIC0gMV0uY2xpZW50UmVjdDtcbiAgICAgIHJldHVybiBpc0hvcml6b250YWwgPyBwb2ludGVyWCA+PSBsYXN0SXRlbVJlY3QucmlnaHQgOiBwb2ludGVyWSA+PSBsYXN0SXRlbVJlY3QuYm90dG9tO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBmaXJzdEl0ZW1SZWN0ID0gaXRlbVBvc2l0aW9uc1swXS5jbGllbnRSZWN0O1xuICAgICAgcmV0dXJuIGlzSG9yaXpvbnRhbCA/IHBvaW50ZXJYIDw9IGZpcnN0SXRlbVJlY3QubGVmdCA6IHBvaW50ZXJZIDw9IGZpcnN0SXRlbVJlY3QudG9wO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpbmRleCBvZiBhbiBpdGVtIGluIHRoZSBkcm9wIGNvbnRhaW5lciwgYmFzZWQgb24gdGhlIHBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB0aGF0IGlzIGJlaW5nIHNvcnRlZC5cbiAgICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0gcG9pbnRlclkgUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqIEBwYXJhbSBkZWx0YSBEaXJlY3Rpb24gaW4gd2hpY2ggdGhlIHVzZXIgaXMgbW92aW5nIHRoZWlyIHBvaW50ZXIuXG4gICAqL1xuICBwcml2YXRlIF9nZXRJdGVtSW5kZXhGcm9tUG9pbnRlclBvc2l0aW9uKFxuICAgIGl0ZW06IERyYWdSZWYsXG4gICAgcG9pbnRlclg6IG51bWJlcixcbiAgICBwb2ludGVyWTogbnVtYmVyLFxuICAgIGRlbHRhPzoge3g6IG51bWJlcjsgeTogbnVtYmVyfSxcbiAgKTogbnVtYmVyIHtcbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5faXRlbVBvc2l0aW9ucy5maW5kSW5kZXgoKHtkcmFnLCBjbGllbnRSZWN0fSkgPT4ge1xuICAgICAgLy8gU2tpcCB0aGUgaXRlbSBpdHNlbGYuXG4gICAgICBpZiAoZHJhZyA9PT0gaXRlbSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmIChkZWx0YSkge1xuICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSBpc0hvcml6b250YWwgPyBkZWx0YS54IDogZGVsdGEueTtcblxuICAgICAgICAvLyBJZiB0aGUgdXNlciBpcyBzdGlsbCBob3ZlcmluZyBvdmVyIHRoZSBzYW1lIGl0ZW0gYXMgbGFzdCB0aW1lLCB0aGVpciBjdXJzb3IgaGFzbid0IGxlZnRcbiAgICAgICAgLy8gdGhlIGl0ZW0gYWZ0ZXIgd2UgbWFkZSB0aGUgc3dhcCwgYW5kIHRoZXkgZGlkbid0IGNoYW5nZSB0aGUgZGlyZWN0aW9uIGluIHdoaWNoIHRoZXkncmVcbiAgICAgICAgLy8gZHJhZ2dpbmcsIHdlIGRvbid0IGNvbnNpZGVyIGl0IGEgZGlyZWN0aW9uIHN3YXAuXG4gICAgICAgIGlmIChcbiAgICAgICAgICBkcmFnID09PSB0aGlzLl9wcmV2aW91c1N3YXAuZHJhZyAmJlxuICAgICAgICAgIHRoaXMuX3ByZXZpb3VzU3dhcC5vdmVybGFwcyAmJlxuICAgICAgICAgIGRpcmVjdGlvbiA9PT0gdGhpcy5fcHJldmlvdXNTd2FwLmRlbHRhXG4gICAgICAgICkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gaXNIb3Jpem9udGFsXG4gICAgICAgID8gLy8gUm91bmQgdGhlc2UgZG93biBzaW5jZSBtb3N0IGJyb3dzZXJzIHJlcG9ydCBjbGllbnQgcmVjdHMgd2l0aFxuICAgICAgICAgIC8vIHN1Yi1waXhlbCBwcmVjaXNpb24sIHdoZXJlYXMgdGhlIHBvaW50ZXIgY29vcmRpbmF0ZXMgYXJlIHJvdW5kZWQgdG8gcGl4ZWxzLlxuICAgICAgICAgIHBvaW50ZXJYID49IE1hdGguZmxvb3IoY2xpZW50UmVjdC5sZWZ0KSAmJiBwb2ludGVyWCA8IE1hdGguZmxvb3IoY2xpZW50UmVjdC5yaWdodClcbiAgICAgICAgOiBwb2ludGVyWSA+PSBNYXRoLmZsb29yKGNsaWVudFJlY3QudG9wKSAmJiBwb2ludGVyWSA8IE1hdGguZmxvb3IoY2xpZW50UmVjdC5ib3R0b20pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGluZGV4ID09PSAtMSB8fCAhdGhpcy5zb3J0UHJlZGljYXRlKGluZGV4LCBpdGVtLCB0aGlzKSA/IC0xIDogaW5kZXg7XG4gIH1cblxuICAvKiogQ2FjaGVzIHRoZSBjdXJyZW50IGl0ZW1zIGluIHRoZSBsaXN0IGFuZCB0aGVpciBwb3NpdGlvbnMuICovXG4gIHByaXZhdGUgX2NhY2hlSXRlbXMoKTogdm9pZCB7XG4gICAgdGhpcy5fYWN0aXZlRHJhZ2dhYmxlcyA9IHRoaXMuX2RyYWdnYWJsZXMuc2xpY2UoKTtcbiAgICB0aGlzLl9jYWNoZUl0ZW1Qb3NpdGlvbnMoKTtcbiAgICB0aGlzLl9jYWNoZVBhcmVudFBvc2l0aW9ucygpO1xuICB9XG5cbiAgLyoqIFN0YXJ0cyB0aGUgaW50ZXJ2YWwgdGhhdCdsbCBhdXRvLXNjcm9sbCB0aGUgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfc3RhcnRTY3JvbGxJbnRlcnZhbCA9ICgpID0+IHtcbiAgICB0aGlzLl9zdG9wU2Nyb2xsaW5nKCk7XG5cbiAgICBpbnRlcnZhbCgwLCBhbmltYXRpb25GcmFtZVNjaGVkdWxlcilcbiAgICAgIC5waXBlKHRha2VVbnRpbCh0aGlzLl9zdG9wU2Nyb2xsVGltZXJzKSlcbiAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICBjb25zdCBub2RlID0gdGhpcy5fc2Nyb2xsTm9kZTtcbiAgICAgICAgY29uc3Qgc2Nyb2xsU3RlcCA9IHRoaXMuYXV0b1Njcm9sbFN0ZXA7XG5cbiAgICAgICAgaWYgKHRoaXMuX3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID09PSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uVVApIHtcbiAgICAgICAgICBub2RlLnNjcm9sbEJ5KDAsIC1zY3JvbGxTdGVwKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl92ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9PT0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLkRPV04pIHtcbiAgICAgICAgICBub2RlLnNjcm9sbEJ5KDAsIHNjcm9sbFN0ZXApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX2hvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPT09IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLkxFRlQpIHtcbiAgICAgICAgICBub2RlLnNjcm9sbEJ5KC1zY3JvbGxTdGVwLCAwKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID09PSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5SSUdIVCkge1xuICAgICAgICAgIG5vZGUuc2Nyb2xsQnkoc2Nyb2xsU3RlcCwgMCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgdXNlcidzIHBvaW50ZXIgaXMgcG9zaXRpb25lZCBvdmVyIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSB4IFBvaW50ZXIgcG9zaXRpb24gYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHkgUG9pbnRlciBwb3NpdGlvbiBhbG9uZyB0aGUgWSBheGlzLlxuICAgKi9cbiAgX2lzT3ZlckNvbnRhaW5lcih4OiBudW1iZXIsIHk6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9jbGllbnRSZWN0ICE9IG51bGwgJiYgaXNJbnNpZGVDbGllbnRSZWN0KHRoaXMuX2NsaWVudFJlY3QsIHgsIHkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpZ3VyZXMgb3V0IHdoZXRoZXIgYW4gaXRlbSBzaG91bGQgYmUgbW92ZWQgaW50byBhIHNpYmxpbmdcbiAgICogZHJvcCBjb250YWluZXIsIGJhc2VkIG9uIGl0cyBjdXJyZW50IHBvc2l0aW9uLlxuICAgKiBAcGFyYW0gaXRlbSBEcmFnIGl0ZW0gdGhhdCBpcyBiZWluZyBtb3ZlZC5cbiAgICogQHBhcmFtIHggUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHkgUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFkgYXhpcy5cbiAgICovXG4gIF9nZXRTaWJsaW5nQ29udGFpbmVyRnJvbVBvc2l0aW9uKGl0ZW06IERyYWdSZWYsIHg6IG51bWJlciwgeTogbnVtYmVyKTogRHJvcExpc3RSZWYgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9zaWJsaW5ncy5maW5kKHNpYmxpbmcgPT4gc2libGluZy5fY2FuUmVjZWl2ZShpdGVtLCB4LCB5KSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGRyb3AgbGlzdCBjYW4gcmVjZWl2ZSB0aGUgcGFzc2VkLWluIGl0ZW0uXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdGhhdCBpcyBiZWluZyBkcmFnZ2VkIGludG8gdGhlIGxpc3QuXG4gICAqIEBwYXJhbSB4IFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSB5IFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqL1xuICBfY2FuUmVjZWl2ZShpdGVtOiBEcmFnUmVmLCB4OiBudW1iZXIsIHk6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGlmIChcbiAgICAgICF0aGlzLl9jbGllbnRSZWN0IHx8XG4gICAgICAhaXNJbnNpZGVDbGllbnRSZWN0KHRoaXMuX2NsaWVudFJlY3QsIHgsIHkpIHx8XG4gICAgICAhdGhpcy5lbnRlclByZWRpY2F0ZShpdGVtLCB0aGlzKVxuICAgICkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IGVsZW1lbnRGcm9tUG9pbnQgPSB0aGlzLl9nZXRTaGFkb3dSb290KCkuZWxlbWVudEZyb21Qb2ludCh4LCB5KSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG5cbiAgICAvLyBJZiB0aGVyZSdzIG5vIGVsZW1lbnQgYXQgdGhlIHBvaW50ZXIgcG9zaXRpb24sIHRoZW5cbiAgICAvLyB0aGUgY2xpZW50IHJlY3QgaXMgcHJvYmFibHkgc2Nyb2xsZWQgb3V0IG9mIHRoZSB2aWV3LlxuICAgIGlmICghZWxlbWVudEZyb21Qb2ludCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KHRoaXMuZWxlbWVudCk7XG5cbiAgICAvLyBUaGUgYENsaWVudFJlY3RgLCB0aGF0IHdlJ3JlIHVzaW5nIHRvIGZpbmQgdGhlIGNvbnRhaW5lciBvdmVyIHdoaWNoIHRoZSB1c2VyIGlzXG4gICAgLy8gaG92ZXJpbmcsIGRvZXNuJ3QgZ2l2ZSB1cyBhbnkgaW5mb3JtYXRpb24gb24gd2hldGhlciB0aGUgZWxlbWVudCBoYXMgYmVlbiBzY3JvbGxlZFxuICAgIC8vIG91dCBvZiB0aGUgdmlldyBvciB3aGV0aGVyIGl0J3Mgb3ZlcmxhcHBpbmcgd2l0aCBvdGhlciBjb250YWluZXJzLiBUaGlzIG1lYW5zIHRoYXRcbiAgICAvLyB3ZSBjb3VsZCBlbmQgdXAgdHJhbnNmZXJyaW5nIHRoZSBpdGVtIGludG8gYSBjb250YWluZXIgdGhhdCdzIGludmlzaWJsZSBvciBpcyBwb3NpdGlvbmVkXG4gICAgLy8gYmVsb3cgYW5vdGhlciBvbmUuIFdlIHVzZSB0aGUgcmVzdWx0IGZyb20gYGVsZW1lbnRGcm9tUG9pbnRgIHRvIGdldCB0aGUgdG9wLW1vc3QgZWxlbWVudFxuICAgIC8vIGF0IHRoZSBwb2ludGVyIHBvc2l0aW9uIGFuZCB0byBmaW5kIHdoZXRoZXIgaXQncyBvbmUgb2YgdGhlIGludGVyc2VjdGluZyBkcm9wIGNvbnRhaW5lcnMuXG4gICAgcmV0dXJuIGVsZW1lbnRGcm9tUG9pbnQgPT09IG5hdGl2ZUVsZW1lbnQgfHwgbmF0aXZlRWxlbWVudC5jb250YWlucyhlbGVtZW50RnJvbVBvaW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsZWQgYnkgb25lIG9mIHRoZSBjb25uZWN0ZWQgZHJvcCBsaXN0cyB3aGVuIGEgZHJhZ2dpbmcgc2VxdWVuY2UgaGFzIHN0YXJ0ZWQuXG4gICAqIEBwYXJhbSBzaWJsaW5nIFNpYmxpbmcgaW4gd2hpY2ggZHJhZ2dpbmcgaGFzIHN0YXJ0ZWQuXG4gICAqL1xuICBfc3RhcnRSZWNlaXZpbmcoc2libGluZzogRHJvcExpc3RSZWYsIGl0ZW1zOiBEcmFnUmVmW10pIHtcbiAgICBjb25zdCBhY3RpdmVTaWJsaW5ncyA9IHRoaXMuX2FjdGl2ZVNpYmxpbmdzO1xuXG4gICAgaWYgKFxuICAgICAgIWFjdGl2ZVNpYmxpbmdzLmhhcyhzaWJsaW5nKSAmJlxuICAgICAgaXRlbXMuZXZlcnkoaXRlbSA9PiB7XG4gICAgICAgIC8vIE5vdGUgdGhhdCB3ZSBoYXZlIHRvIGFkZCBhbiBleGNlcHRpb24gdG8gdGhlIGBlbnRlclByZWRpY2F0ZWAgZm9yIGl0ZW1zIHRoYXQgc3RhcnRlZCBvZmZcbiAgICAgICAgLy8gaW4gdGhpcyBkcm9wIGxpc3QuIFRoZSBkcmFnIHJlZiBoYXMgbG9naWMgdGhhdCBhbGxvd3MgYW4gaXRlbSB0byByZXR1cm4gdG8gaXRzIGluaXRpYWxcbiAgICAgICAgLy8gY29udGFpbmVyLCBpZiBpdCBoYXMgbGVmdCB0aGUgaW5pdGlhbCBjb250YWluZXIgYW5kIG5vbmUgb2YgdGhlIGNvbm5lY3RlZCBjb250YWluZXJzXG4gICAgICAgIC8vIGFsbG93IGl0IHRvIGVudGVyLiBTZWUgYERyYWdSZWYuX3VwZGF0ZUFjdGl2ZURyb3BDb250YWluZXJgIGZvciBtb3JlIGNvbnRleHQuXG4gICAgICAgIHJldHVybiB0aGlzLmVudGVyUHJlZGljYXRlKGl0ZW0sIHRoaXMpIHx8IHRoaXMuX2RyYWdnYWJsZXMuaW5kZXhPZihpdGVtKSA+IC0xO1xuICAgICAgfSlcbiAgICApIHtcbiAgICAgIGFjdGl2ZVNpYmxpbmdzLmFkZChzaWJsaW5nKTtcbiAgICAgIHRoaXMuX2NhY2hlUGFyZW50UG9zaXRpb25zKCk7XG4gICAgICB0aGlzLl9saXN0ZW5Ub1Njcm9sbEV2ZW50cygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsZWQgYnkgYSBjb25uZWN0ZWQgZHJvcCBsaXN0IHdoZW4gZHJhZ2dpbmcgaGFzIHN0b3BwZWQuXG4gICAqIEBwYXJhbSBzaWJsaW5nIFNpYmxpbmcgd2hvc2UgZHJhZ2dpbmcgaGFzIHN0b3BwZWQuXG4gICAqL1xuICBfc3RvcFJlY2VpdmluZyhzaWJsaW5nOiBEcm9wTGlzdFJlZikge1xuICAgIHRoaXMuX2FjdGl2ZVNpYmxpbmdzLmRlbGV0ZShzaWJsaW5nKTtcbiAgICB0aGlzLl92aWV3cG9ydFNjcm9sbFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0YXJ0cyBsaXN0ZW5pbmcgdG8gc2Nyb2xsIGV2ZW50cyBvbiB0aGUgdmlld3BvcnQuXG4gICAqIFVzZWQgZm9yIHVwZGF0aW5nIHRoZSBpbnRlcm5hbCBzdGF0ZSBvZiB0aGUgbGlzdC5cbiAgICovXG4gIHByaXZhdGUgX2xpc3RlblRvU2Nyb2xsRXZlbnRzKCkge1xuICAgIHRoaXMuX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uID0gdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeVxuICAgICAgLnNjcm9sbGVkKHRoaXMuX2dldFNoYWRvd1Jvb3QoKSlcbiAgICAgIC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgICBpZiAodGhpcy5pc0RyYWdnaW5nKCkpIHtcbiAgICAgICAgICBjb25zdCBzY3JvbGxEaWZmZXJlbmNlID0gdGhpcy5fcGFyZW50UG9zaXRpb25zLmhhbmRsZVNjcm9sbChldmVudCk7XG5cbiAgICAgICAgICBpZiAoc2Nyb2xsRGlmZmVyZW5jZSkge1xuICAgICAgICAgICAgLy8gU2luY2Ugd2Uga25vdyB0aGUgYW1vdW50IHRoYXQgdGhlIHVzZXIgaGFzIHNjcm9sbGVkIHdlIGNhbiBzaGlmdCBhbGwgb2YgdGhlXG4gICAgICAgICAgICAvLyBjbGllbnQgcmVjdGFuZ2xlcyBvdXJzZWx2ZXMuIFRoaXMgaXMgY2hlYXBlciB0aGFuIHJlLW1lYXN1cmluZyBldmVyeXRoaW5nIGFuZFxuICAgICAgICAgICAgLy8gd2UgY2FuIGF2b2lkIGluY29uc2lzdGVudCBiZWhhdmlvciB3aGVyZSB3ZSBtaWdodCBiZSBtZWFzdXJpbmcgdGhlIGVsZW1lbnQgYmVmb3JlXG4gICAgICAgICAgICAvLyBpdHMgcG9zaXRpb24gaGFzIGNoYW5nZWQuXG4gICAgICAgICAgICB0aGlzLl9pdGVtUG9zaXRpb25zLmZvckVhY2goKHtjbGllbnRSZWN0fSkgPT4ge1xuICAgICAgICAgICAgICBhZGp1c3RDbGllbnRSZWN0KGNsaWVudFJlY3QsIHNjcm9sbERpZmZlcmVuY2UudG9wLCBzY3JvbGxEaWZmZXJlbmNlLmxlZnQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIFdlIG5lZWQgdHdvIGxvb3BzIGZvciB0aGlzLCBiZWNhdXNlIHdlIHdhbnQgYWxsIG9mIHRoZSBjYWNoZWRcbiAgICAgICAgICAgIC8vIHBvc2l0aW9ucyB0byBiZSB1cC10by1kYXRlIGJlZm9yZSB3ZSByZS1zb3J0IHRoZSBpdGVtLlxuICAgICAgICAgICAgdGhpcy5faXRlbVBvc2l0aW9ucy5mb3JFYWNoKCh7ZHJhZ30pID0+IHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuaXNEcmFnZ2luZyhkcmFnKSkge1xuICAgICAgICAgICAgICAgIC8vIFdlIG5lZWQgdG8gcmUtc29ydCB0aGUgaXRlbSBtYW51YWxseSwgYmVjYXVzZSB0aGUgcG9pbnRlciBtb3ZlXG4gICAgICAgICAgICAgICAgLy8gZXZlbnRzIHdvbid0IGJlIGRpc3BhdGNoZWQgd2hpbGUgdGhlIHVzZXIgaXMgc2Nyb2xsaW5nLlxuICAgICAgICAgICAgICAgIGRyYWcuX3NvcnRGcm9tTGFzdFBvaW50ZXJQb3NpdGlvbigpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5pc1JlY2VpdmluZygpKSB7XG4gICAgICAgICAgdGhpcy5fY2FjaGVQYXJlbnRQb3NpdGlvbnMoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGF6aWx5IHJlc29sdmVzIGFuZCByZXR1cm5zIHRoZSBzaGFkb3cgcm9vdCBvZiB0aGUgZWxlbWVudC4gV2UgZG8gdGhpcyBpbiBhIGZ1bmN0aW9uLCByYXRoZXJcbiAgICogdGhhbiBzYXZpbmcgaXQgaW4gcHJvcGVydHkgZGlyZWN0bHkgb24gaW5pdCwgYmVjYXVzZSB3ZSB3YW50IHRvIHJlc29sdmUgaXQgYXMgbGF0ZSBhcyBwb3NzaWJsZVxuICAgKiBpbiBvcmRlciB0byBlbnN1cmUgdGhhdCB0aGUgZWxlbWVudCBoYXMgYmVlbiBtb3ZlZCBpbnRvIHRoZSBzaGFkb3cgRE9NLiBEb2luZyBpdCBpbnNpZGUgdGhlXG4gICAqIGNvbnN0cnVjdG9yIG1pZ2h0IGJlIHRvbyBlYXJseSBpZiB0aGUgZWxlbWVudCBpcyBpbnNpZGUgb2Ygc29tZXRoaW5nIGxpa2UgYG5nRm9yYCBvciBgbmdJZmAuXG4gICAqL1xuICBwcml2YXRlIF9nZXRTaGFkb3dSb290KCk6IFJvb3ROb2RlIHtcbiAgICBpZiAoIXRoaXMuX2NhY2hlZFNoYWRvd1Jvb3QpIHtcbiAgICAgIGNvbnN0IHNoYWRvd1Jvb3QgPSBfZ2V0U2hhZG93Um9vdChjb2VyY2VFbGVtZW50KHRoaXMuZWxlbWVudCkpO1xuICAgICAgdGhpcy5fY2FjaGVkU2hhZG93Um9vdCA9IChzaGFkb3dSb290IHx8IHRoaXMuX2RvY3VtZW50KSBhcyBSb290Tm9kZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fY2FjaGVkU2hhZG93Um9vdDtcbiAgfVxuXG4gIC8qKiBOb3RpZmllcyBhbnkgc2libGluZ3MgdGhhdCBtYXkgcG90ZW50aWFsbHkgcmVjZWl2ZSB0aGUgaXRlbS4gKi9cbiAgcHJpdmF0ZSBfbm90aWZ5UmVjZWl2aW5nU2libGluZ3MoKSB7XG4gICAgY29uc3QgZHJhZ2dlZEl0ZW1zID0gdGhpcy5fYWN0aXZlRHJhZ2dhYmxlcy5maWx0ZXIoaXRlbSA9PiBpdGVtLmlzRHJhZ2dpbmcoKSk7XG4gICAgdGhpcy5fc2libGluZ3MuZm9yRWFjaChzaWJsaW5nID0+IHNpYmxpbmcuX3N0YXJ0UmVjZWl2aW5nKHRoaXMsIGRyYWdnZWRJdGVtcykpO1xuICB9XG59XG5cbi8qKlxuICogR2V0cyB3aGV0aGVyIHRoZSB2ZXJ0aWNhbCBhdXRvLXNjcm9sbCBkaXJlY3Rpb24gb2YgYSBub2RlLlxuICogQHBhcmFtIGNsaWVudFJlY3QgRGltZW5zaW9ucyBvZiB0aGUgbm9kZS5cbiAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIHkgYXhpcy5cbiAqL1xuZnVuY3Rpb24gZ2V0VmVydGljYWxTY3JvbGxEaXJlY3Rpb24oY2xpZW50UmVjdDogQ2xpZW50UmVjdCwgcG9pbnRlclk6IG51bWJlcikge1xuICBjb25zdCB7dG9wLCBib3R0b20sIGhlaWdodH0gPSBjbGllbnRSZWN0O1xuICBjb25zdCB5VGhyZXNob2xkID0gaGVpZ2h0ICogU0NST0xMX1BST1hJTUlUWV9USFJFU0hPTEQ7XG5cbiAgaWYgKHBvaW50ZXJZID49IHRvcCAtIHlUaHJlc2hvbGQgJiYgcG9pbnRlclkgPD0gdG9wICsgeVRocmVzaG9sZCkge1xuICAgIHJldHVybiBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uVVA7XG4gIH0gZWxzZSBpZiAocG9pbnRlclkgPj0gYm90dG9tIC0geVRocmVzaG9sZCAmJiBwb2ludGVyWSA8PSBib3R0b20gKyB5VGhyZXNob2xkKSB7XG4gICAgcmV0dXJuIEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5ET1dOO1xuICB9XG5cbiAgcmV0dXJuIEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5OT05FO1xufVxuXG4vKipcbiAqIEdldHMgd2hldGhlciB0aGUgaG9yaXpvbnRhbCBhdXRvLXNjcm9sbCBkaXJlY3Rpb24gb2YgYSBub2RlLlxuICogQHBhcmFtIGNsaWVudFJlY3QgRGltZW5zaW9ucyBvZiB0aGUgbm9kZS5cbiAqIEBwYXJhbSBwb2ludGVyWCBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIHggYXhpcy5cbiAqL1xuZnVuY3Rpb24gZ2V0SG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0OiBDbGllbnRSZWN0LCBwb2ludGVyWDogbnVtYmVyKSB7XG4gIGNvbnN0IHtsZWZ0LCByaWdodCwgd2lkdGh9ID0gY2xpZW50UmVjdDtcbiAgY29uc3QgeFRocmVzaG9sZCA9IHdpZHRoICogU0NST0xMX1BST1hJTUlUWV9USFJFU0hPTEQ7XG5cbiAgaWYgKHBvaW50ZXJYID49IGxlZnQgLSB4VGhyZXNob2xkICYmIHBvaW50ZXJYIDw9IGxlZnQgKyB4VGhyZXNob2xkKSB7XG4gICAgcmV0dXJuIEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLkxFRlQ7XG4gIH0gZWxzZSBpZiAocG9pbnRlclggPj0gcmlnaHQgLSB4VGhyZXNob2xkICYmIHBvaW50ZXJYIDw9IHJpZ2h0ICsgeFRocmVzaG9sZCkge1xuICAgIHJldHVybiBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5SSUdIVDtcbiAgfVxuXG4gIHJldHVybiBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5OT05FO1xufVxuXG4vKipcbiAqIEdldHMgdGhlIGRpcmVjdGlvbnMgaW4gd2hpY2ggYW4gZWxlbWVudCBub2RlIHNob3VsZCBiZSBzY3JvbGxlZCxcbiAqIGFzc3VtaW5nIHRoYXQgdGhlIHVzZXIncyBwb2ludGVyIGlzIGFscmVhZHkgd2l0aGluIGl0IHNjcm9sbGFibGUgcmVnaW9uLlxuICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCBmb3Igd2hpY2ggd2Ugc2hvdWxkIGNhbGN1bGF0ZSB0aGUgc2Nyb2xsIGRpcmVjdGlvbi5cbiAqIEBwYXJhbSBjbGllbnRSZWN0IEJvdW5kaW5nIGNsaWVudCByZWN0YW5nbGUgb2YgdGhlIGVsZW1lbnQuXG4gKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSB4IGF4aXMuXG4gKiBAcGFyYW0gcG9pbnRlclkgUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSB5IGF4aXMuXG4gKi9cbmZ1bmN0aW9uIGdldEVsZW1lbnRTY3JvbGxEaXJlY3Rpb25zKFxuICBlbGVtZW50OiBIVE1MRWxlbWVudCxcbiAgY2xpZW50UmVjdDogQ2xpZW50UmVjdCxcbiAgcG9pbnRlclg6IG51bWJlcixcbiAgcG9pbnRlclk6IG51bWJlcixcbik6IFtBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24sIEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uXSB7XG4gIGNvbnN0IGNvbXB1dGVkVmVydGljYWwgPSBnZXRWZXJ0aWNhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0LCBwb2ludGVyWSk7XG4gIGNvbnN0IGNvbXB1dGVkSG9yaXpvbnRhbCA9IGdldEhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24oY2xpZW50UmVjdCwgcG9pbnRlclgpO1xuICBsZXQgdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uTk9ORTtcbiAgbGV0IGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5OT05FO1xuXG4gIC8vIE5vdGUgdGhhdCB3ZSBoZXJlIHdlIGRvIHNvbWUgZXh0cmEgY2hlY2tzIGZvciB3aGV0aGVyIHRoZSBlbGVtZW50IGlzIGFjdHVhbGx5IHNjcm9sbGFibGUgaW5cbiAgLy8gYSBjZXJ0YWluIGRpcmVjdGlvbiBhbmQgd2Ugb25seSBhc3NpZ24gdGhlIHNjcm9sbCBkaXJlY3Rpb24gaWYgaXQgaXMuIFdlIGRvIHRoaXMgc28gdGhhdCB3ZVxuICAvLyBjYW4gYWxsb3cgb3RoZXIgZWxlbWVudHMgdG8gYmUgc2Nyb2xsZWQsIGlmIHRoZSBjdXJyZW50IGVsZW1lbnQgY2FuJ3QgYmUgc2Nyb2xsZWQgYW55bW9yZS5cbiAgLy8gVGhpcyBhbGxvd3MgdXMgdG8gaGFuZGxlIGNhc2VzIHdoZXJlIHRoZSBzY3JvbGwgcmVnaW9ucyBvZiB0d28gc2Nyb2xsYWJsZSBlbGVtZW50cyBvdmVybGFwLlxuICBpZiAoY29tcHV0ZWRWZXJ0aWNhbCkge1xuICAgIGNvbnN0IHNjcm9sbFRvcCA9IGVsZW1lbnQuc2Nyb2xsVG9wO1xuXG4gICAgaWYgKGNvbXB1dGVkVmVydGljYWwgPT09IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5VUCkge1xuICAgICAgaWYgKHNjcm9sbFRvcCA+IDApIHtcbiAgICAgICAgdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uVVA7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChlbGVtZW50LnNjcm9sbEhlaWdodCAtIHNjcm9sbFRvcCA+IGVsZW1lbnQuY2xpZW50SGVpZ2h0KSB7XG4gICAgICB2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5ET1dOO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjb21wdXRlZEhvcml6b250YWwpIHtcbiAgICBjb25zdCBzY3JvbGxMZWZ0ID0gZWxlbWVudC5zY3JvbGxMZWZ0O1xuXG4gICAgaWYgKGNvbXB1dGVkSG9yaXpvbnRhbCA9PT0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTEVGVCkge1xuICAgICAgaWYgKHNjcm9sbExlZnQgPiAwKSB7XG4gICAgICAgIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5MRUZUO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZWxlbWVudC5zY3JvbGxXaWR0aCAtIHNjcm9sbExlZnQgPiBlbGVtZW50LmNsaWVudFdpZHRoKSB7XG4gICAgICBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uUklHSFQ7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFt2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiwgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbl07XG59XG4iXX0=