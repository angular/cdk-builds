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
        this._verticalScrollDirection = 0 /* NONE */;
        /** Horizontal direction in which the list is currently scrolling. */
        this._horizontalScrollDirection = 0 /* NONE */;
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
                if (this._verticalScrollDirection === 1 /* UP */) {
                    node.scrollBy(0, -scrollStep);
                }
                else if (this._verticalScrollDirection === 2 /* DOWN */) {
                    node.scrollBy(0, scrollStep);
                }
                if (this._horizontalScrollDirection === 1 /* LEFT */) {
                    node.scrollBy(-scrollStep, 0);
                }
                else if (this._horizontalScrollDirection === 2 /* RIGHT */) {
                    node.scrollBy(scrollStep, 0);
                }
            });
        };
        this.element = coerceElement(element);
        this._document = _document;
        this.withScrollableParents([this.element]);
        _dragDropRegistry.registerDropContainer(this);
        this._parentPositions = new ParentPositionTracker(_document, _viewportRuler);
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
        else if (this._shouldEnterAsFirstChild(pointerX, pointerY)) {
            const reference = activeDraggables[0].getRootElement();
            reference.parentNode.insertBefore(placeholder, reference);
            activeDraggables.unshift(item);
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
     */
    drop(item, currentIndex, previousIndex, previousContainer, isPointerOverContainer, distance, dropPoint) {
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
        let verticalScrollDirection = 0 /* NONE */;
        let horizontalScrollDirection = 0 /* NONE */;
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
        return 1 /* UP */;
    }
    else if (pointerY >= bottom - yThreshold && pointerY <= bottom + yThreshold) {
        return 2 /* DOWN */;
    }
    return 0 /* NONE */;
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
        return 1 /* LEFT */;
    }
    else if (pointerX >= right - xThreshold && pointerX <= right + xThreshold) {
        return 2 /* RIGHT */;
    }
    return 0 /* NONE */;
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
    let verticalScrollDirection = 0 /* NONE */;
    let horizontalScrollDirection = 0 /* NONE */;
    // Note that we here we do some extra checks for whether the element is actually scrollable in
    // a certain direction and we only assign the scroll direction if it is. We do this so that we
    // can allow other elements to be scrolled, if the current element can't be scrolled anymore.
    // This allows us to handle cases where the scroll regions of two scrollable elements overlap.
    if (computedVertical) {
        const scrollTop = element.scrollTop;
        if (computedVertical === 1 /* UP */) {
            if (scrollTop > 0) {
                verticalScrollDirection = 1 /* UP */;
            }
        }
        else if (element.scrollHeight - scrollTop > element.clientHeight) {
            verticalScrollDirection = 2 /* DOWN */;
        }
    }
    if (computedHorizontal) {
        const scrollLeft = element.scrollLeft;
        if (computedHorizontal === 1 /* LEFT */) {
            if (scrollLeft > 0) {
                horizontalScrollDirection = 1 /* LEFT */;
            }
        }
        else if (element.scrollWidth - scrollLeft > element.clientWidth) {
            horizontalScrollDirection = 2 /* RIGHT */;
        }
    }
    return [verticalScrollDirection, horizontalScrollDirection];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LXJlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2Ryb3AtbGlzdC1yZWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBSUgsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRXBELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsT0FBTyxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsdUJBQXVCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDOUUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFHN0MsT0FBTyxFQUNMLHVCQUF1QixFQUN2QixnQkFBZ0IsRUFDaEIsb0JBQW9CLEVBQ3BCLGtCQUFrQixHQUNuQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUNoRSxPQUFPLEVBQUMsaUJBQWlCLEVBQTBCLE1BQU0sZ0JBQWdCLENBQUM7QUFFMUU7OztHQUdHO0FBQ0gsTUFBTSx3QkFBd0IsR0FBRyxJQUFJLENBQUM7QUFFdEM7OztHQUdHO0FBQ0gsTUFBTSwwQkFBMEIsR0FBRyxJQUFJLENBQUM7QUE2Q3hDOztHQUVHO0FBQ0gsTUFBTSxPQUFPLFdBQVc7SUF3SXRCLFlBQ0UsT0FBOEMsRUFDdEMsaUJBQXlELEVBQ2pFLFNBQWMsRUFDTixPQUFlLEVBQ2YsY0FBNkI7UUFIN0Isc0JBQWlCLEdBQWpCLGlCQUFpQixDQUF3QztRQUV6RCxZQUFPLEdBQVAsT0FBTyxDQUFRO1FBQ2YsbUJBQWMsR0FBZCxjQUFjLENBQWU7UUF6SXZDLDRFQUE0RTtRQUM1RSxhQUFRLEdBQVksS0FBSyxDQUFDO1FBRTFCLHlEQUF5RDtR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QixFQUFFO1FBQ3RCLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUM7UUFFdEMsSUFBSSxrQkFBa0IsaUJBQXVDLEVBQUU7WUFDN0QsSUFBSSxVQUFVLEdBQUcsQ0FBQyxFQUFFO2dCQUNsQix5QkFBeUIsZUFBcUMsQ0FBQzthQUNoRTtTQUNGO2FBQU0sSUFBSSxPQUFPLENBQUMsV0FBVyxHQUFHLFVBQVUsR0FBRyxPQUFPLENBQUMsV0FBVyxFQUFFO1lBQ2pFLHlCQUF5QixnQkFBc0MsQ0FBQztTQUNqRTtLQUNGO0lBRUQsT0FBTyxDQUFDLHVCQUF1QixFQUFFLHlCQUF5QixDQUFDLENBQUM7QUFDOUQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0VsZW1lbnRSZWYsIE5nWm9uZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0RpcmVjdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtjb2VyY2VFbGVtZW50fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtWaWV3cG9ydFJ1bGVyfSBmcm9tICdAYW5ndWxhci9jZGsvc2Nyb2xsaW5nJztcbmltcG9ydCB7X2dldFNoYWRvd1Jvb3R9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge1N1YmplY3QsIFN1YnNjcmlwdGlvbiwgaW50ZXJ2YWwsIGFuaW1hdGlvbkZyYW1lU2NoZWR1bGVyfSBmcm9tICdyeGpzJztcbmltcG9ydCB7dGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge21vdmVJdGVtSW5BcnJheX0gZnJvbSAnLi9kcmFnLXV0aWxzJztcbmltcG9ydCB7RHJhZ0Ryb3BSZWdpc3RyeX0gZnJvbSAnLi9kcmFnLWRyb3AtcmVnaXN0cnknO1xuaW1wb3J0IHtEcmFnUmVmSW50ZXJuYWwgYXMgRHJhZ1JlZiwgUG9pbnR9IGZyb20gJy4vZHJhZy1yZWYnO1xuaW1wb3J0IHtcbiAgaXNQb2ludGVyTmVhckNsaWVudFJlY3QsXG4gIGFkanVzdENsaWVudFJlY3QsXG4gIGdldE11dGFibGVDbGllbnRSZWN0LFxuICBpc0luc2lkZUNsaWVudFJlY3QsXG59IGZyb20gJy4vY2xpZW50LXJlY3QnO1xuaW1wb3J0IHtQYXJlbnRQb3NpdGlvblRyYWNrZXJ9IGZyb20gJy4vcGFyZW50LXBvc2l0aW9uLXRyYWNrZXInO1xuaW1wb3J0IHtjb21iaW5lVHJhbnNmb3JtcywgRHJhZ0NTU1N0eWxlRGVjbGFyYXRpb259IGZyb20gJy4vZHJhZy1zdHlsaW5nJztcblxuLyoqXG4gKiBQcm94aW1pdHksIGFzIGEgcmF0aW8gdG8gd2lkdGgvaGVpZ2h0LCBhdCB3aGljaCBhXG4gKiBkcmFnZ2VkIGl0ZW0gd2lsbCBhZmZlY3QgdGhlIGRyb3AgY29udGFpbmVyLlxuICovXG5jb25zdCBEUk9QX1BST1hJTUlUWV9USFJFU0hPTEQgPSAwLjA1O1xuXG4vKipcbiAqIFByb3hpbWl0eSwgYXMgYSByYXRpbyB0byB3aWR0aC9oZWlnaHQgYXQgd2hpY2ggdG8gc3RhcnQgYXV0by1zY3JvbGxpbmcgdGhlIGRyb3AgbGlzdCBvciB0aGVcbiAqIHZpZXdwb3J0LiBUaGUgdmFsdWUgY29tZXMgZnJvbSB0cnlpbmcgaXQgb3V0IG1hbnVhbGx5IHVudGlsIGl0IGZlZWxzIHJpZ2h0LlxuICovXG5jb25zdCBTQ1JPTExfUFJPWElNSVRZX1RIUkVTSE9MRCA9IDAuMDU7XG5cbi8qKlxuICogRW50cnkgaW4gdGhlIHBvc2l0aW9uIGNhY2hlIGZvciBkcmFnZ2FibGUgaXRlbXMuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmludGVyZmFjZSBDYWNoZWRJdGVtUG9zaXRpb24ge1xuICAvKiogSW5zdGFuY2Ugb2YgdGhlIGRyYWcgaXRlbS4gKi9cbiAgZHJhZzogRHJhZ1JlZjtcbiAgLyoqIERpbWVuc2lvbnMgb2YgdGhlIGl0ZW0uICovXG4gIGNsaWVudFJlY3Q6IENsaWVudFJlY3Q7XG4gIC8qKiBBbW91bnQgYnkgd2hpY2ggdGhlIGl0ZW0gaGFzIGJlZW4gbW92ZWQgc2luY2UgZHJhZ2dpbmcgc3RhcnRlZC4gKi9cbiAgb2Zmc2V0OiBudW1iZXI7XG4gIC8qKiBJbmxpbmUgdHJhbnNmb3JtIHRoYXQgdGhlIGRyYWcgaXRlbSBoYWQgd2hlbiBkcmFnZ2luZyBzdGFydGVkLiAqL1xuICBpbml0aWFsVHJhbnNmb3JtOiBzdHJpbmc7XG59XG5cbi8qKiBWZXJ0aWNhbCBkaXJlY3Rpb24gaW4gd2hpY2ggd2UgY2FuIGF1dG8tc2Nyb2xsLiAqL1xuY29uc3QgZW51bSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24ge1xuICBOT05FLFxuICBVUCxcbiAgRE9XTixcbn1cblxuLyoqIEhvcml6b250YWwgZGlyZWN0aW9uIGluIHdoaWNoIHdlIGNhbiBhdXRvLXNjcm9sbC4gKi9cbmNvbnN0IGVudW0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24ge1xuICBOT05FLFxuICBMRUZULFxuICBSSUdIVCxcbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBjb21waWxlLXRpbWUtb25seSByZXByZXNlbnRhdGlvbiBvZiBhIGBEcm9wTGlzdFJlZmAuXG4gKiBVc2VkIHRvIGF2b2lkIGNpcmN1bGFyIGltcG9ydCBpc3N1ZXMgYmV0d2VlbiB0aGUgYERyb3BMaXN0UmVmYCBhbmQgdGhlIGBEcmFnUmVmYC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEcm9wTGlzdFJlZkludGVybmFsIGV4dGVuZHMgRHJvcExpc3RSZWYge31cblxudHlwZSBSb290Tm9kZSA9IERvY3VtZW50T3JTaGFkb3dSb290ICYge1xuICAvLyBBcyBvZiBUUyA0LjQgdGhlIGJ1aWx0IGluIERPTSB0eXBpbmdzIGRvbid0IGluY2x1ZGUgYGVsZW1lbnRGcm9tUG9pbnRgIG9uIGBTaGFkb3dSb290YCxcbiAgLy8gZXZlbiB0aG91Z2ggaXQgZXhpc3RzIChzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1NoYWRvd1Jvb3QpLlxuICAvLyBUaGlzIHR5cGUgaXMgYSB1dGlsaXR5IHRvIGF2b2lkIGhhdmluZyB0byBhZGQgY2FzdHMgZXZlcnl3aGVyZS5cbiAgZWxlbWVudEZyb21Qb2ludCh4OiBudW1iZXIsIHk6IG51bWJlcik6IEVsZW1lbnQgfCBudWxsO1xufTtcblxuLyoqXG4gKiBSZWZlcmVuY2UgdG8gYSBkcm9wIGxpc3QuIFVzZWQgdG8gbWFuaXB1bGF0ZSBvciBkaXNwb3NlIG9mIHRoZSBjb250YWluZXIuXG4gKi9cbmV4cG9ydCBjbGFzcyBEcm9wTGlzdFJlZjxUID0gYW55PiB7XG4gIC8qKiBFbGVtZW50IHRoYXQgdGhlIGRyb3AgbGlzdCBpcyBhdHRhY2hlZCB0by4gKi9cbiAgZWxlbWVudDogSFRNTEVsZW1lbnQgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50PjtcblxuICAvKiogV2hldGhlciBzdGFydGluZyBhIGRyYWdnaW5nIHNlcXVlbmNlIGZyb20gdGhpcyBjb250YWluZXIgaXMgZGlzYWJsZWQuICovXG4gIGRpc2FibGVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgc29ydGluZyBpdGVtcyB3aXRoaW4gdGhlIGxpc3QgaXMgZGlzYWJsZWQuICovXG4gIHNvcnRpbmdEaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBMb2NrcyB0aGUgcG9zaXRpb24gb2YgdGhlIGRyYWdnYWJsZSBlbGVtZW50cyBpbnNpZGUgdGhlIGNvbnRhaW5lciBhbG9uZyB0aGUgc3BlY2lmaWVkIGF4aXMuICovXG4gIGxvY2tBeGlzOiAneCcgfCAneSc7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgYXV0by1zY3JvbGxpbmcgdGhlIHZpZXcgd2hlbiB0aGUgdXNlclxuICAgKiBtb3ZlcyB0aGVpciBwb2ludGVyIGNsb3NlIHRvIHRoZSBlZGdlcyBpcyBkaXNhYmxlZC5cbiAgICovXG4gIGF1dG9TY3JvbGxEaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBOdW1iZXIgb2YgcGl4ZWxzIHRvIHNjcm9sbCBmb3IgZWFjaCBmcmFtZSB3aGVuIGF1dG8tc2Nyb2xsaW5nIGFuIGVsZW1lbnQuICovXG4gIGF1dG9TY3JvbGxTdGVwOiBudW1iZXIgPSAyO1xuXG4gIC8qKlxuICAgKiBGdW5jdGlvbiB0aGF0IGlzIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYW4gaXRlbVxuICAgKiBpcyBhbGxvd2VkIHRvIGJlIG1vdmVkIGludG8gYSBkcm9wIGNvbnRhaW5lci5cbiAgICovXG4gIGVudGVyUHJlZGljYXRlOiAoZHJhZzogRHJhZ1JlZiwgZHJvcDogRHJvcExpc3RSZWYpID0+IGJvb2xlYW4gPSAoKSA9PiB0cnVlO1xuXG4gIC8qKiBGdW5jdGlvbnMgdGhhdCBpcyB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIGFuIGl0ZW0gY2FuIGJlIHNvcnRlZCBpbnRvIGEgcGFydGljdWxhciBpbmRleC4gKi9cbiAgc29ydFByZWRpY2F0ZTogKGluZGV4OiBudW1iZXIsIGRyYWc6IERyYWdSZWYsIGRyb3A6IERyb3BMaXN0UmVmKSA9PiBib29sZWFuID0gKCkgPT4gdHJ1ZTtcblxuICAvKiogRW1pdHMgcmlnaHQgYmVmb3JlIGRyYWdnaW5nIGhhcyBzdGFydGVkLiAqL1xuICByZWFkb25seSBiZWZvcmVTdGFydGVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKipcbiAgICogRW1pdHMgd2hlbiB0aGUgdXNlciBoYXMgbW92ZWQgYSBuZXcgZHJhZyBpdGVtIGludG8gdGhpcyBjb250YWluZXIuXG4gICAqL1xuICByZWFkb25seSBlbnRlcmVkID0gbmV3IFN1YmplY3Q8e2l0ZW06IERyYWdSZWY7IGNvbnRhaW5lcjogRHJvcExpc3RSZWY7IGN1cnJlbnRJbmRleDogbnVtYmVyfT4oKTtcblxuICAvKipcbiAgICogRW1pdHMgd2hlbiB0aGUgdXNlciByZW1vdmVzIGFuIGl0ZW0gZnJvbSB0aGUgY29udGFpbmVyXG4gICAqIGJ5IGRyYWdnaW5nIGl0IGludG8gYW5vdGhlciBjb250YWluZXIuXG4gICAqL1xuICByZWFkb25seSBleGl0ZWQgPSBuZXcgU3ViamVjdDx7aXRlbTogRHJhZ1JlZjsgY29udGFpbmVyOiBEcm9wTGlzdFJlZn0+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgZHJvcHMgYW4gaXRlbSBpbnNpZGUgdGhlIGNvbnRhaW5lci4gKi9cbiAgcmVhZG9ubHkgZHJvcHBlZCA9IG5ldyBTdWJqZWN0PHtcbiAgICBpdGVtOiBEcmFnUmVmO1xuICAgIGN1cnJlbnRJbmRleDogbnVtYmVyO1xuICAgIHByZXZpb3VzSW5kZXg6IG51bWJlcjtcbiAgICBjb250YWluZXI6IERyb3BMaXN0UmVmO1xuICAgIHByZXZpb3VzQ29udGFpbmVyOiBEcm9wTGlzdFJlZjtcbiAgICBpc1BvaW50ZXJPdmVyQ29udGFpbmVyOiBib29sZWFuO1xuICAgIGRpc3RhbmNlOiBQb2ludDtcbiAgICBkcm9wUG9pbnQ6IFBvaW50O1xuICB9PigpO1xuXG4gIC8qKiBFbWl0cyBhcyB0aGUgdXNlciBpcyBzd2FwcGluZyBpdGVtcyB3aGlsZSBhY3RpdmVseSBkcmFnZ2luZy4gKi9cbiAgcmVhZG9ubHkgc29ydGVkID0gbmV3IFN1YmplY3Q8e1xuICAgIHByZXZpb3VzSW5kZXg6IG51bWJlcjtcbiAgICBjdXJyZW50SW5kZXg6IG51bWJlcjtcbiAgICBjb250YWluZXI6IERyb3BMaXN0UmVmO1xuICAgIGl0ZW06IERyYWdSZWY7XG4gIH0+KCk7XG5cbiAgLyoqIEFyYml0cmFyeSBkYXRhIHRoYXQgY2FuIGJlIGF0dGFjaGVkIHRvIHRoZSBkcm9wIGxpc3QuICovXG4gIGRhdGE6IFQ7XG5cbiAgLyoqIFdoZXRoZXIgYW4gaXRlbSBpbiB0aGUgbGlzdCBpcyBiZWluZyBkcmFnZ2VkLiAqL1xuICBwcml2YXRlIF9pc0RyYWdnaW5nID0gZmFsc2U7XG5cbiAgLyoqIENhY2hlIG9mIHRoZSBkaW1lbnNpb25zIG9mIGFsbCB0aGUgaXRlbXMgaW5zaWRlIHRoZSBjb250YWluZXIuICovXG4gIHByaXZhdGUgX2l0ZW1Qb3NpdGlvbnM6IENhY2hlZEl0ZW1Qb3NpdGlvbltdID0gW107XG5cbiAgLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBwb3NpdGlvbnMgb2YgYW55IHBhcmVudCBzY3JvbGxhYmxlIGVsZW1lbnRzLiAqL1xuICBwcml2YXRlIF9wYXJlbnRQb3NpdGlvbnM6IFBhcmVudFBvc2l0aW9uVHJhY2tlcjtcblxuICAvKiogQ2FjaGVkIGBDbGllbnRSZWN0YCBvZiB0aGUgZHJvcCBsaXN0LiAqL1xuICBwcml2YXRlIF9jbGllbnRSZWN0OiBDbGllbnRSZWN0IHwgdW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBEcmFnZ2FibGUgaXRlbXMgdGhhdCBhcmUgY3VycmVudGx5IGFjdGl2ZSBpbnNpZGUgdGhlIGNvbnRhaW5lci4gSW5jbHVkZXMgdGhlIGl0ZW1zXG4gICAqIGZyb20gYF9kcmFnZ2FibGVzYCwgYXMgd2VsbCBhcyBhbnkgaXRlbXMgdGhhdCBoYXZlIGJlZW4gZHJhZ2dlZCBpbiwgYnV0IGhhdmVuJ3RcbiAgICogYmVlbiBkcm9wcGVkIHlldC5cbiAgICovXG4gIHByaXZhdGUgX2FjdGl2ZURyYWdnYWJsZXM6IERyYWdSZWZbXTtcblxuICAvKipcbiAgICogS2VlcHMgdHJhY2sgb2YgdGhlIGl0ZW0gdGhhdCB3YXMgbGFzdCBzd2FwcGVkIHdpdGggdGhlIGRyYWdnZWQgaXRlbSwgYXMgd2VsbCBhcyB3aGF0IGRpcmVjdGlvblxuICAgKiB0aGUgcG9pbnRlciB3YXMgbW92aW5nIGluIHdoZW4gdGhlIHN3YXAgb2NjdXJlZCBhbmQgd2hldGhlciB0aGUgdXNlcidzIHBvaW50ZXIgY29udGludWVkIHRvXG4gICAqIG92ZXJsYXAgd2l0aCB0aGUgc3dhcHBlZCBpdGVtIGFmdGVyIHRoZSBzd2FwcGluZyBvY2N1cnJlZC5cbiAgICovXG4gIHByaXZhdGUgX3ByZXZpb3VzU3dhcCA9IHtkcmFnOiBudWxsIGFzIERyYWdSZWYgfCBudWxsLCBkZWx0YTogMCwgb3ZlcmxhcHM6IGZhbHNlfTtcblxuICAvKiogRHJhZ2dhYmxlIGl0ZW1zIGluIHRoZSBjb250YWluZXIuICovXG4gIHByaXZhdGUgX2RyYWdnYWJsZXM6IHJlYWRvbmx5IERyYWdSZWZbXSA9IFtdO1xuXG4gIC8qKiBEcm9wIGxpc3RzIHRoYXQgYXJlIGNvbm5lY3RlZCB0byB0aGUgY3VycmVudCBvbmUuICovXG4gIHByaXZhdGUgX3NpYmxpbmdzOiByZWFkb25seSBEcm9wTGlzdFJlZltdID0gW107XG5cbiAgLyoqIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgbGlzdCBpcyBvcmllbnRlZC4gKi9cbiAgcHJpdmF0ZSBfb3JpZW50YXRpb246ICdob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCcgPSAndmVydGljYWwnO1xuXG4gIC8qKiBDb25uZWN0ZWQgc2libGluZ3MgdGhhdCBjdXJyZW50bHkgaGF2ZSBhIGRyYWdnZWQgaXRlbS4gKi9cbiAgcHJpdmF0ZSBfYWN0aXZlU2libGluZ3MgPSBuZXcgU2V0PERyb3BMaXN0UmVmPigpO1xuXG4gIC8qKiBMYXlvdXQgZGlyZWN0aW9uIG9mIHRoZSBkcm9wIGxpc3QuICovXG4gIHByaXZhdGUgX2RpcmVjdGlvbjogRGlyZWN0aW9uID0gJ2x0cic7XG5cbiAgLyoqIFN1YnNjcmlwdGlvbiB0byB0aGUgd2luZG93IGJlaW5nIHNjcm9sbGVkLiAqL1xuICBwcml2YXRlIF92aWV3cG9ydFNjcm9sbFN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcblxuICAvKiogVmVydGljYWwgZGlyZWN0aW9uIGluIHdoaWNoIHRoZSBsaXN0IGlzIGN1cnJlbnRseSBzY3JvbGxpbmcuICovXG4gIHByaXZhdGUgX3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLk5PTkU7XG5cbiAgLyoqIEhvcml6b250YWwgZGlyZWN0aW9uIGluIHdoaWNoIHRoZSBsaXN0IGlzIGN1cnJlbnRseSBzY3JvbGxpbmcuICovXG4gIHByaXZhdGUgX2hvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5OT05FO1xuXG4gIC8qKiBOb2RlIHRoYXQgaXMgYmVpbmcgYXV0by1zY3JvbGxlZC4gKi9cbiAgcHJpdmF0ZSBfc2Nyb2xsTm9kZTogSFRNTEVsZW1lbnQgfCBXaW5kb3c7XG5cbiAgLyoqIFVzZWQgdG8gc2lnbmFsIHRvIHRoZSBjdXJyZW50IGF1dG8tc2Nyb2xsIHNlcXVlbmNlIHdoZW4gdG8gc3RvcC4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfc3RvcFNjcm9sbFRpbWVycyA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIFNoYWRvdyByb290IG9mIHRoZSBjdXJyZW50IGVsZW1lbnQuIE5lY2Vzc2FyeSBmb3IgYGVsZW1lbnRGcm9tUG9pbnRgIHRvIHJlc29sdmUgY29ycmVjdGx5LiAqL1xuICBwcml2YXRlIF9jYWNoZWRTaGFkb3dSb290OiBSb290Tm9kZSB8IG51bGwgPSBudWxsO1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIGRvY3VtZW50LiAqL1xuICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQ7XG5cbiAgLyoqIEVsZW1lbnRzIHRoYXQgY2FuIGJlIHNjcm9sbGVkIHdoaWxlIHRoZSB1c2VyIGlzIGRyYWdnaW5nLiAqL1xuICBwcml2YXRlIF9zY3JvbGxhYmxlRWxlbWVudHM6IEhUTUxFbGVtZW50W107XG5cbiAgLyoqIEluaXRpYWwgdmFsdWUgZm9yIHRoZSBlbGVtZW50J3MgYHNjcm9sbC1zbmFwLXR5cGVgIHN0eWxlLiAqL1xuICBwcml2YXRlIF9pbml0aWFsU2Nyb2xsU25hcDogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+IHwgSFRNTEVsZW1lbnQsXG4gICAgcHJpdmF0ZSBfZHJhZ0Ryb3BSZWdpc3RyeTogRHJhZ0Ryb3BSZWdpc3RyeTxEcmFnUmVmLCBEcm9wTGlzdFJlZj4sXG4gICAgX2RvY3VtZW50OiBhbnksXG4gICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgcHJpdmF0ZSBfdmlld3BvcnRSdWxlcjogVmlld3BvcnRSdWxlcixcbiAgKSB7XG4gICAgdGhpcy5lbGVtZW50ID0gY29lcmNlRWxlbWVudChlbGVtZW50KTtcbiAgICB0aGlzLl9kb2N1bWVudCA9IF9kb2N1bWVudDtcbiAgICB0aGlzLndpdGhTY3JvbGxhYmxlUGFyZW50cyhbdGhpcy5lbGVtZW50XSk7XG4gICAgX2RyYWdEcm9wUmVnaXN0cnkucmVnaXN0ZXJEcm9wQ29udGFpbmVyKHRoaXMpO1xuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucyA9IG5ldyBQYXJlbnRQb3NpdGlvblRyYWNrZXIoX2RvY3VtZW50LCBfdmlld3BvcnRSdWxlcik7XG4gIH1cblxuICAvKiogUmVtb3ZlcyB0aGUgZHJvcCBsaXN0IGZ1bmN0aW9uYWxpdHkgZnJvbSB0aGUgRE9NIGVsZW1lbnQuICovXG4gIGRpc3Bvc2UoKSB7XG4gICAgdGhpcy5fc3RvcFNjcm9sbGluZygpO1xuICAgIHRoaXMuX3N0b3BTY3JvbGxUaW1lcnMuY29tcGxldGUoKTtcbiAgICB0aGlzLl92aWV3cG9ydFNjcm9sbFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuYmVmb3JlU3RhcnRlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuZW50ZXJlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuZXhpdGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5kcm9wcGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5zb3J0ZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLl9hY3RpdmVTaWJsaW5ncy5jbGVhcigpO1xuICAgIHRoaXMuX3Njcm9sbE5vZGUgPSBudWxsITtcbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuY2xlYXIoKTtcbiAgICB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnJlbW92ZURyb3BDb250YWluZXIodGhpcyk7XG4gIH1cblxuICAvKiogV2hldGhlciBhbiBpdGVtIGZyb20gdGhpcyBsaXN0IGlzIGN1cnJlbnRseSBiZWluZyBkcmFnZ2VkLiAqL1xuICBpc0RyYWdnaW5nKCkge1xuICAgIHJldHVybiB0aGlzLl9pc0RyYWdnaW5nO1xuICB9XG5cbiAgLyoqIFN0YXJ0cyBkcmFnZ2luZyBhbiBpdGVtLiAqL1xuICBzdGFydCgpOiB2b2lkIHtcbiAgICB0aGlzLl9kcmFnZ2luZ1N0YXJ0ZWQoKTtcbiAgICB0aGlzLl9ub3RpZnlSZWNlaXZpbmdTaWJsaW5ncygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEVtaXRzIGFuIGV2ZW50IHRvIGluZGljYXRlIHRoYXQgdGhlIHVzZXIgbW92ZWQgYW4gaXRlbSBpbnRvIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdGhhdCB3YXMgbW92ZWQgaW50byB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHBvaW50ZXJZIFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqIEBwYXJhbSBpbmRleCBJbmRleCBhdCB3aGljaCB0aGUgaXRlbSBlbnRlcmVkLiBJZiBvbWl0dGVkLCB0aGUgY29udGFpbmVyIHdpbGwgdHJ5IHRvIGZpZ3VyZSBpdFxuICAgKiAgIG91dCBhdXRvbWF0aWNhbGx5LlxuICAgKi9cbiAgZW50ZXIoaXRlbTogRHJhZ1JlZiwgcG9pbnRlclg6IG51bWJlciwgcG9pbnRlclk6IG51bWJlciwgaW5kZXg/OiBudW1iZXIpOiB2b2lkIHtcbiAgICB0aGlzLl9kcmFnZ2luZ1N0YXJ0ZWQoKTtcblxuICAgIC8vIElmIHNvcnRpbmcgaXMgZGlzYWJsZWQsIHdlIHdhbnQgdGhlIGl0ZW0gdG8gcmV0dXJuIHRvIGl0cyBzdGFydGluZ1xuICAgIC8vIHBvc2l0aW9uIGlmIHRoZSB1c2VyIGlzIHJldHVybmluZyBpdCB0byBpdHMgaW5pdGlhbCBjb250YWluZXIuXG4gICAgbGV0IG5ld0luZGV4OiBudW1iZXI7XG5cbiAgICBpZiAoaW5kZXggPT0gbnVsbCkge1xuICAgICAgbmV3SW5kZXggPSB0aGlzLnNvcnRpbmdEaXNhYmxlZCA/IHRoaXMuX2RyYWdnYWJsZXMuaW5kZXhPZihpdGVtKSA6IC0xO1xuXG4gICAgICBpZiAobmV3SW5kZXggPT09IC0xKSB7XG4gICAgICAgIC8vIFdlIHVzZSB0aGUgY29vcmRpbmF0ZXMgb2Ygd2hlcmUgdGhlIGl0ZW0gZW50ZXJlZCB0aGUgZHJvcFxuICAgICAgICAvLyB6b25lIHRvIGZpZ3VyZSBvdXQgYXQgd2hpY2ggaW5kZXggaXQgc2hvdWxkIGJlIGluc2VydGVkLlxuICAgICAgICBuZXdJbmRleCA9IHRoaXMuX2dldEl0ZW1JbmRleEZyb21Qb2ludGVyUG9zaXRpb24oaXRlbSwgcG9pbnRlclgsIHBvaW50ZXJZKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbmV3SW5kZXggPSBpbmRleDtcbiAgICB9XG5cbiAgICBjb25zdCBhY3RpdmVEcmFnZ2FibGVzID0gdGhpcy5fYWN0aXZlRHJhZ2dhYmxlcztcbiAgICBjb25zdCBjdXJyZW50SW5kZXggPSBhY3RpdmVEcmFnZ2FibGVzLmluZGV4T2YoaXRlbSk7XG4gICAgY29uc3QgcGxhY2Vob2xkZXIgPSBpdGVtLmdldFBsYWNlaG9sZGVyRWxlbWVudCgpO1xuICAgIGxldCBuZXdQb3NpdGlvblJlZmVyZW5jZTogRHJhZ1JlZiB8IHVuZGVmaW5lZCA9IGFjdGl2ZURyYWdnYWJsZXNbbmV3SW5kZXhdO1xuXG4gICAgLy8gSWYgdGhlIGl0ZW0gYXQgdGhlIG5ldyBwb3NpdGlvbiBpcyB0aGUgc2FtZSBhcyB0aGUgaXRlbSB0aGF0IGlzIGJlaW5nIGRyYWdnZWQsXG4gICAgLy8gaXQgbWVhbnMgdGhhdCB3ZSdyZSB0cnlpbmcgdG8gcmVzdG9yZSB0aGUgaXRlbSB0byBpdHMgaW5pdGlhbCBwb3NpdGlvbi4gSW4gdGhpc1xuICAgIC8vIGNhc2Ugd2Ugc2hvdWxkIHVzZSB0aGUgbmV4dCBpdGVtIGZyb20gdGhlIGxpc3QgYXMgdGhlIHJlZmVyZW5jZS5cbiAgICBpZiAobmV3UG9zaXRpb25SZWZlcmVuY2UgPT09IGl0ZW0pIHtcbiAgICAgIG5ld1Bvc2l0aW9uUmVmZXJlbmNlID0gYWN0aXZlRHJhZ2dhYmxlc1tuZXdJbmRleCArIDFdO1xuICAgIH1cblxuICAgIC8vIFNpbmNlIHRoZSBpdGVtIG1heSBiZSBpbiB0aGUgYGFjdGl2ZURyYWdnYWJsZXNgIGFscmVhZHkgKGUuZy4gaWYgdGhlIHVzZXIgZHJhZ2dlZCBpdFxuICAgIC8vIGludG8gYW5vdGhlciBjb250YWluZXIgYW5kIGJhY2sgYWdhaW4pLCB3ZSBoYXZlIHRvIGVuc3VyZSB0aGF0IGl0IGlzbid0IGR1cGxpY2F0ZWQuXG4gICAgaWYgKGN1cnJlbnRJbmRleCA+IC0xKSB7XG4gICAgICBhY3RpdmVEcmFnZ2FibGVzLnNwbGljZShjdXJyZW50SW5kZXgsIDEpO1xuICAgIH1cblxuICAgIC8vIERvbid0IHVzZSBpdGVtcyB0aGF0IGFyZSBiZWluZyBkcmFnZ2VkIGFzIGEgcmVmZXJlbmNlLCBiZWNhdXNlXG4gICAgLy8gdGhlaXIgZWxlbWVudCBoYXMgYmVlbiBtb3ZlZCBkb3duIHRvIHRoZSBib3R0b20gb2YgdGhlIGJvZHkuXG4gICAgaWYgKG5ld1Bvc2l0aW9uUmVmZXJlbmNlICYmICF0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LmlzRHJhZ2dpbmcobmV3UG9zaXRpb25SZWZlcmVuY2UpKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gbmV3UG9zaXRpb25SZWZlcmVuY2UuZ2V0Um9vdEVsZW1lbnQoKTtcbiAgICAgIGVsZW1lbnQucGFyZW50RWxlbWVudCEuaW5zZXJ0QmVmb3JlKHBsYWNlaG9sZGVyLCBlbGVtZW50KTtcbiAgICAgIGFjdGl2ZURyYWdnYWJsZXMuc3BsaWNlKG5ld0luZGV4LCAwLCBpdGVtKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX3Nob3VsZEVudGVyQXNGaXJzdENoaWxkKHBvaW50ZXJYLCBwb2ludGVyWSkpIHtcbiAgICAgIGNvbnN0IHJlZmVyZW5jZSA9IGFjdGl2ZURyYWdnYWJsZXNbMF0uZ2V0Um9vdEVsZW1lbnQoKTtcbiAgICAgIHJlZmVyZW5jZS5wYXJlbnROb2RlIS5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXIsIHJlZmVyZW5jZSk7XG4gICAgICBhY3RpdmVEcmFnZ2FibGVzLnVuc2hpZnQoaXRlbSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KS5hcHBlbmRDaGlsZChwbGFjZWhvbGRlcik7XG4gICAgICBhY3RpdmVEcmFnZ2FibGVzLnB1c2goaXRlbSk7XG4gICAgfVxuXG4gICAgLy8gVGhlIHRyYW5zZm9ybSBuZWVkcyB0byBiZSBjbGVhcmVkIHNvIGl0IGRvZXNuJ3QgdGhyb3cgb2ZmIHRoZSBtZWFzdXJlbWVudHMuXG4gICAgcGxhY2Vob2xkZXIuc3R5bGUudHJhbnNmb3JtID0gJyc7XG5cbiAgICAvLyBOb3RlIHRoYXQgdGhlIHBvc2l0aW9ucyB3ZXJlIGFscmVhZHkgY2FjaGVkIHdoZW4gd2UgY2FsbGVkIGBzdGFydGAgYWJvdmUsXG4gICAgLy8gYnV0IHdlIG5lZWQgdG8gcmVmcmVzaCB0aGVtIHNpbmNlIHRoZSBhbW91bnQgb2YgaXRlbXMgaGFzIGNoYW5nZWQgYW5kIGFsc28gcGFyZW50IHJlY3RzLlxuICAgIHRoaXMuX2NhY2hlSXRlbVBvc2l0aW9ucygpO1xuICAgIHRoaXMuX2NhY2hlUGFyZW50UG9zaXRpb25zKCk7XG5cbiAgICAvLyBOb3RpZnkgc2libGluZ3MgYXQgdGhlIGVuZCBzbyB0aGF0IHRoZSBpdGVtIGhhcyBiZWVuIGluc2VydGVkIGludG8gdGhlIGBhY3RpdmVEcmFnZ2FibGVzYC5cbiAgICB0aGlzLl9ub3RpZnlSZWNlaXZpbmdTaWJsaW5ncygpO1xuICAgIHRoaXMuZW50ZXJlZC5uZXh0KHtpdGVtLCBjb250YWluZXI6IHRoaXMsIGN1cnJlbnRJbmRleDogdGhpcy5nZXRJdGVtSW5kZXgoaXRlbSl9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGFuIGl0ZW0gZnJvbSB0aGUgY29udGFpbmVyIGFmdGVyIGl0IHdhcyBkcmFnZ2VkIGludG8gYW5vdGhlciBjb250YWluZXIgYnkgdGhlIHVzZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdGhhdCB3YXMgZHJhZ2dlZCBvdXQuXG4gICAqL1xuICBleGl0KGl0ZW06IERyYWdSZWYpOiB2b2lkIHtcbiAgICB0aGlzLl9yZXNldCgpO1xuICAgIHRoaXMuZXhpdGVkLm5leHQoe2l0ZW0sIGNvbnRhaW5lcjogdGhpc30pO1xuICB9XG5cbiAgLyoqXG4gICAqIERyb3BzIGFuIGl0ZW0gaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSBiZWluZyBkcm9wcGVkIGludG8gdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGN1cnJlbnRJbmRleCBJbmRleCBhdCB3aGljaCB0aGUgaXRlbSBzaG91bGQgYmUgaW5zZXJ0ZWQuXG4gICAqIEBwYXJhbSBwcmV2aW91c0luZGV4IEluZGV4IG9mIHRoZSBpdGVtIHdoZW4gZHJhZ2dpbmcgc3RhcnRlZC5cbiAgICogQHBhcmFtIHByZXZpb3VzQ29udGFpbmVyIENvbnRhaW5lciBmcm9tIHdoaWNoIHRoZSBpdGVtIGdvdCBkcmFnZ2VkIGluLlxuICAgKiBAcGFyYW0gaXNQb2ludGVyT3ZlckNvbnRhaW5lciBXaGV0aGVyIHRoZSB1c2VyJ3MgcG9pbnRlciB3YXMgb3ZlciB0aGVcbiAgICogICAgY29udGFpbmVyIHdoZW4gdGhlIGl0ZW0gd2FzIGRyb3BwZWQuXG4gICAqIEBwYXJhbSBkaXN0YW5jZSBEaXN0YW5jZSB0aGUgdXNlciBoYXMgZHJhZ2dlZCBzaW5jZSB0aGUgc3RhcnQgb2YgdGhlIGRyYWdnaW5nIHNlcXVlbmNlLlxuICAgKi9cbiAgZHJvcChcbiAgICBpdGVtOiBEcmFnUmVmLFxuICAgIGN1cnJlbnRJbmRleDogbnVtYmVyLFxuICAgIHByZXZpb3VzSW5kZXg6IG51bWJlcixcbiAgICBwcmV2aW91c0NvbnRhaW5lcjogRHJvcExpc3RSZWYsXG4gICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcjogYm9vbGVhbixcbiAgICBkaXN0YW5jZTogUG9pbnQsXG4gICAgZHJvcFBvaW50OiBQb2ludCxcbiAgKTogdm9pZCB7XG4gICAgdGhpcy5fcmVzZXQoKTtcbiAgICB0aGlzLmRyb3BwZWQubmV4dCh7XG4gICAgICBpdGVtLFxuICAgICAgY3VycmVudEluZGV4LFxuICAgICAgcHJldmlvdXNJbmRleCxcbiAgICAgIGNvbnRhaW5lcjogdGhpcyxcbiAgICAgIHByZXZpb3VzQ29udGFpbmVyLFxuICAgICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcixcbiAgICAgIGRpc3RhbmNlLFxuICAgICAgZHJvcFBvaW50LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGRyYWdnYWJsZSBpdGVtcyB0aGF0IGFyZSBhIHBhcnQgb2YgdGhpcyBsaXN0LlxuICAgKiBAcGFyYW0gaXRlbXMgSXRlbXMgdGhhdCBhcmUgYSBwYXJ0IG9mIHRoaXMgbGlzdC5cbiAgICovXG4gIHdpdGhJdGVtcyhpdGVtczogRHJhZ1JlZltdKTogdGhpcyB7XG4gICAgY29uc3QgcHJldmlvdXNJdGVtcyA9IHRoaXMuX2RyYWdnYWJsZXM7XG4gICAgdGhpcy5fZHJhZ2dhYmxlcyA9IGl0ZW1zO1xuICAgIGl0ZW1zLmZvckVhY2goaXRlbSA9PiBpdGVtLl93aXRoRHJvcENvbnRhaW5lcih0aGlzKSk7XG5cbiAgICBpZiAodGhpcy5pc0RyYWdnaW5nKCkpIHtcbiAgICAgIGNvbnN0IGRyYWdnZWRJdGVtcyA9IHByZXZpb3VzSXRlbXMuZmlsdGVyKGl0ZW0gPT4gaXRlbS5pc0RyYWdnaW5nKCkpO1xuXG4gICAgICAvLyBJZiBhbGwgb2YgdGhlIGl0ZW1zIGJlaW5nIGRyYWdnZWQgd2VyZSByZW1vdmVkXG4gICAgICAvLyBmcm9tIHRoZSBsaXN0LCBhYm9ydCB0aGUgY3VycmVudCBkcmFnIHNlcXVlbmNlLlxuICAgICAgaWYgKGRyYWdnZWRJdGVtcy5ldmVyeShpdGVtID0+IGl0ZW1zLmluZGV4T2YoaXRlbSkgPT09IC0xKSkge1xuICAgICAgICB0aGlzLl9yZXNldCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fY2FjaGVJdGVtcygpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFNldHMgdGhlIGxheW91dCBkaXJlY3Rpb24gb2YgdGhlIGRyb3AgbGlzdC4gKi9cbiAgd2l0aERpcmVjdGlvbihkaXJlY3Rpb246IERpcmVjdGlvbik6IHRoaXMge1xuICAgIHRoaXMuX2RpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjb250YWluZXJzIHRoYXQgYXJlIGNvbm5lY3RlZCB0byB0aGlzIG9uZS4gV2hlbiB0d28gb3IgbW9yZSBjb250YWluZXJzIGFyZVxuICAgKiBjb25uZWN0ZWQsIHRoZSB1c2VyIHdpbGwgYmUgYWxsb3dlZCB0byB0cmFuc2ZlciBpdGVtcyBiZXR3ZWVuIHRoZW0uXG4gICAqIEBwYXJhbSBjb25uZWN0ZWRUbyBPdGhlciBjb250YWluZXJzIHRoYXQgdGhlIGN1cnJlbnQgY29udGFpbmVycyBzaG91bGQgYmUgY29ubmVjdGVkIHRvLlxuICAgKi9cbiAgY29ubmVjdGVkVG8oY29ubmVjdGVkVG86IERyb3BMaXN0UmVmW10pOiB0aGlzIHtcbiAgICB0aGlzLl9zaWJsaW5ncyA9IGNvbm5lY3RlZFRvLnNsaWNlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgb3JpZW50YXRpb24gb2YgdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIG9yaWVudGF0aW9uIE5ldyBvcmllbnRhdGlvbiBmb3IgdGhlIGNvbnRhaW5lci5cbiAgICovXG4gIHdpdGhPcmllbnRhdGlvbihvcmllbnRhdGlvbjogJ3ZlcnRpY2FsJyB8ICdob3Jpem9udGFsJyk6IHRoaXMge1xuICAgIHRoaXMuX29yaWVudGF0aW9uID0gb3JpZW50YXRpb247XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB3aGljaCBwYXJlbnQgZWxlbWVudHMgYXJlIGNhbiBiZSBzY3JvbGxlZCB3aGlsZSB0aGUgdXNlciBpcyBkcmFnZ2luZy5cbiAgICogQHBhcmFtIGVsZW1lbnRzIEVsZW1lbnRzIHRoYXQgY2FuIGJlIHNjcm9sbGVkLlxuICAgKi9cbiAgd2l0aFNjcm9sbGFibGVQYXJlbnRzKGVsZW1lbnRzOiBIVE1MRWxlbWVudFtdKTogdGhpcyB7XG4gICAgY29uc3QgZWxlbWVudCA9IGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KTtcblxuICAgIC8vIFdlIGFsd2F5cyBhbGxvdyB0aGUgY3VycmVudCBlbGVtZW50IHRvIGJlIHNjcm9sbGFibGVcbiAgICAvLyBzbyB3ZSBuZWVkIHRvIGVuc3VyZSB0aGF0IGl0J3MgaW4gdGhlIGFycmF5LlxuICAgIHRoaXMuX3Njcm9sbGFibGVFbGVtZW50cyA9XG4gICAgICBlbGVtZW50cy5pbmRleE9mKGVsZW1lbnQpID09PSAtMSA/IFtlbGVtZW50LCAuLi5lbGVtZW50c10gOiBlbGVtZW50cy5zbGljZSgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIHNjcm9sbGFibGUgcGFyZW50cyB0aGF0IGFyZSByZWdpc3RlcmVkIHdpdGggdGhpcyBkcm9wIGNvbnRhaW5lci4gKi9cbiAgZ2V0U2Nyb2xsYWJsZVBhcmVudHMoKTogcmVhZG9ubHkgSFRNTEVsZW1lbnRbXSB7XG4gICAgcmV0dXJuIHRoaXMuX3Njcm9sbGFibGVFbGVtZW50cztcbiAgfVxuXG4gIC8qKlxuICAgKiBGaWd1cmVzIG91dCB0aGUgaW5kZXggb2YgYW4gaXRlbSBpbiB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHdob3NlIGluZGV4IHNob3VsZCBiZSBkZXRlcm1pbmVkLlxuICAgKi9cbiAgZ2V0SXRlbUluZGV4KGl0ZW06IERyYWdSZWYpOiBudW1iZXIge1xuICAgIGlmICghdGhpcy5faXNEcmFnZ2luZykge1xuICAgICAgcmV0dXJuIHRoaXMuX2RyYWdnYWJsZXMuaW5kZXhPZihpdGVtKTtcbiAgICB9XG5cbiAgICAvLyBJdGVtcyBhcmUgc29ydGVkIGFsd2F5cyBieSB0b3AvbGVmdCBpbiB0aGUgY2FjaGUsIGhvd2V2ZXIgdGhleSBmbG93IGRpZmZlcmVudGx5IGluIFJUTC5cbiAgICAvLyBUaGUgcmVzdCBvZiB0aGUgbG9naWMgc3RpbGwgc3RhbmRzIG5vIG1hdHRlciB3aGF0IG9yaWVudGF0aW9uIHdlJ3JlIGluLCBob3dldmVyXG4gICAgLy8gd2UgbmVlZCB0byBpbnZlcnQgdGhlIGFycmF5IHdoZW4gZGV0ZXJtaW5pbmcgdGhlIGluZGV4LlxuICAgIGNvbnN0IGl0ZW1zID1cbiAgICAgIHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcgJiYgdGhpcy5fZGlyZWN0aW9uID09PSAncnRsJ1xuICAgICAgICA/IHRoaXMuX2l0ZW1Qb3NpdGlvbnMuc2xpY2UoKS5yZXZlcnNlKClcbiAgICAgICAgOiB0aGlzLl9pdGVtUG9zaXRpb25zO1xuXG4gICAgcmV0dXJuIGl0ZW1zLmZpbmRJbmRleChjdXJyZW50SXRlbSA9PiBjdXJyZW50SXRlbS5kcmFnID09PSBpdGVtKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBsaXN0IGlzIGFibGUgdG8gcmVjZWl2ZSB0aGUgaXRlbSB0aGF0XG4gICAqIGlzIGN1cnJlbnRseSBiZWluZyBkcmFnZ2VkIGluc2lkZSBhIGNvbm5lY3RlZCBkcm9wIGxpc3QuXG4gICAqL1xuICBpc1JlY2VpdmluZygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fYWN0aXZlU2libGluZ3Muc2l6ZSA+IDA7XG4gIH1cblxuICAvKipcbiAgICogU29ydHMgYW4gaXRlbSBpbnNpZGUgdGhlIGNvbnRhaW5lciBiYXNlZCBvbiBpdHMgcG9zaXRpb24uXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdG8gYmUgc29ydGVkLlxuICAgKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHBvaW50ZXJZIFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyRGVsdGEgRGlyZWN0aW9uIGluIHdoaWNoIHRoZSBwb2ludGVyIGlzIG1vdmluZyBhbG9uZyBlYWNoIGF4aXMuXG4gICAqL1xuICBfc29ydEl0ZW0oXG4gICAgaXRlbTogRHJhZ1JlZixcbiAgICBwb2ludGVyWDogbnVtYmVyLFxuICAgIHBvaW50ZXJZOiBudW1iZXIsXG4gICAgcG9pbnRlckRlbHRhOiB7eDogbnVtYmVyOyB5OiBudW1iZXJ9LFxuICApOiB2b2lkIHtcbiAgICAvLyBEb24ndCBzb3J0IHRoZSBpdGVtIGlmIHNvcnRpbmcgaXMgZGlzYWJsZWQgb3IgaXQncyBvdXQgb2YgcmFuZ2UuXG4gICAgaWYgKFxuICAgICAgdGhpcy5zb3J0aW5nRGlzYWJsZWQgfHxcbiAgICAgICF0aGlzLl9jbGllbnRSZWN0IHx8XG4gICAgICAhaXNQb2ludGVyTmVhckNsaWVudFJlY3QodGhpcy5fY2xpZW50UmVjdCwgRFJPUF9QUk9YSU1JVFlfVEhSRVNIT0xELCBwb2ludGVyWCwgcG9pbnRlclkpXG4gICAgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc2libGluZ3MgPSB0aGlzLl9pdGVtUG9zaXRpb25zO1xuICAgIGNvbnN0IG5ld0luZGV4ID0gdGhpcy5fZ2V0SXRlbUluZGV4RnJvbVBvaW50ZXJQb3NpdGlvbihpdGVtLCBwb2ludGVyWCwgcG9pbnRlclksIHBvaW50ZXJEZWx0YSk7XG5cbiAgICBpZiAobmV3SW5kZXggPT09IC0xICYmIHNpYmxpbmdzLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuICAgIGNvbnN0IGN1cnJlbnRJbmRleCA9IHNpYmxpbmdzLmZpbmRJbmRleChjdXJyZW50SXRlbSA9PiBjdXJyZW50SXRlbS5kcmFnID09PSBpdGVtKTtcbiAgICBjb25zdCBzaWJsaW5nQXROZXdQb3NpdGlvbiA9IHNpYmxpbmdzW25ld0luZGV4XTtcbiAgICBjb25zdCBjdXJyZW50UG9zaXRpb24gPSBzaWJsaW5nc1tjdXJyZW50SW5kZXhdLmNsaWVudFJlY3Q7XG4gICAgY29uc3QgbmV3UG9zaXRpb24gPSBzaWJsaW5nQXROZXdQb3NpdGlvbi5jbGllbnRSZWN0O1xuICAgIGNvbnN0IGRlbHRhID0gY3VycmVudEluZGV4ID4gbmV3SW5kZXggPyAxIDogLTE7XG5cbiAgICAvLyBIb3cgbWFueSBwaXhlbHMgdGhlIGl0ZW0ncyBwbGFjZWhvbGRlciBzaG91bGQgYmUgb2Zmc2V0LlxuICAgIGNvbnN0IGl0ZW1PZmZzZXQgPSB0aGlzLl9nZXRJdGVtT2Zmc2V0UHgoY3VycmVudFBvc2l0aW9uLCBuZXdQb3NpdGlvbiwgZGVsdGEpO1xuXG4gICAgLy8gSG93IG1hbnkgcGl4ZWxzIGFsbCB0aGUgb3RoZXIgaXRlbXMgc2hvdWxkIGJlIG9mZnNldC5cbiAgICBjb25zdCBzaWJsaW5nT2Zmc2V0ID0gdGhpcy5fZ2V0U2libGluZ09mZnNldFB4KGN1cnJlbnRJbmRleCwgc2libGluZ3MsIGRlbHRhKTtcblxuICAgIC8vIFNhdmUgdGhlIHByZXZpb3VzIG9yZGVyIG9mIHRoZSBpdGVtcyBiZWZvcmUgbW92aW5nIHRoZSBpdGVtIHRvIGl0cyBuZXcgaW5kZXguXG4gICAgLy8gV2UgdXNlIHRoaXMgdG8gY2hlY2sgd2hldGhlciBhbiBpdGVtIGhhcyBiZWVuIG1vdmVkIGFzIGEgcmVzdWx0IG9mIHRoZSBzb3J0aW5nLlxuICAgIGNvbnN0IG9sZE9yZGVyID0gc2libGluZ3Muc2xpY2UoKTtcblxuICAgIC8vIFNodWZmbGUgdGhlIGFycmF5IGluIHBsYWNlLlxuICAgIG1vdmVJdGVtSW5BcnJheShzaWJsaW5ncywgY3VycmVudEluZGV4LCBuZXdJbmRleCk7XG5cbiAgICB0aGlzLnNvcnRlZC5uZXh0KHtcbiAgICAgIHByZXZpb3VzSW5kZXg6IGN1cnJlbnRJbmRleCxcbiAgICAgIGN1cnJlbnRJbmRleDogbmV3SW5kZXgsXG4gICAgICBjb250YWluZXI6IHRoaXMsXG4gICAgICBpdGVtLFxuICAgIH0pO1xuXG4gICAgc2libGluZ3MuZm9yRWFjaCgoc2libGluZywgaW5kZXgpID0+IHtcbiAgICAgIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIHRoZSBwb3NpdGlvbiBoYXNuJ3QgY2hhbmdlZC5cbiAgICAgIGlmIChvbGRPcmRlcltpbmRleF0gPT09IHNpYmxpbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpc0RyYWdnZWRJdGVtID0gc2libGluZy5kcmFnID09PSBpdGVtO1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gaXNEcmFnZ2VkSXRlbSA/IGl0ZW1PZmZzZXQgOiBzaWJsaW5nT2Zmc2V0O1xuICAgICAgY29uc3QgZWxlbWVudFRvT2Zmc2V0ID0gaXNEcmFnZ2VkSXRlbVxuICAgICAgICA/IGl0ZW0uZ2V0UGxhY2Vob2xkZXJFbGVtZW50KClcbiAgICAgICAgOiBzaWJsaW5nLmRyYWcuZ2V0Um9vdEVsZW1lbnQoKTtcblxuICAgICAgLy8gVXBkYXRlIHRoZSBvZmZzZXQgdG8gcmVmbGVjdCB0aGUgbmV3IHBvc2l0aW9uLlxuICAgICAgc2libGluZy5vZmZzZXQgKz0gb2Zmc2V0O1xuXG4gICAgICAvLyBTaW5jZSB3ZSdyZSBtb3ZpbmcgdGhlIGl0ZW1zIHdpdGggYSBgdHJhbnNmb3JtYCwgd2UgbmVlZCB0byBhZGp1c3QgdGhlaXIgY2FjaGVkXG4gICAgICAvLyBjbGllbnQgcmVjdHMgdG8gcmVmbGVjdCB0aGVpciBuZXcgcG9zaXRpb24sIGFzIHdlbGwgYXMgc3dhcCB0aGVpciBwb3NpdGlvbnMgaW4gdGhlIGNhY2hlLlxuICAgICAgLy8gTm90ZSB0aGF0IHdlIHNob3VsZG4ndCB1c2UgYGdldEJvdW5kaW5nQ2xpZW50UmVjdGAgaGVyZSB0byB1cGRhdGUgdGhlIGNhY2hlLCBiZWNhdXNlIHRoZVxuICAgICAgLy8gZWxlbWVudHMgbWF5IGJlIG1pZC1hbmltYXRpb24gd2hpY2ggd2lsbCBnaXZlIHVzIGEgd3JvbmcgcmVzdWx0LlxuICAgICAgaWYgKGlzSG9yaXpvbnRhbCkge1xuICAgICAgICAvLyBSb3VuZCB0aGUgdHJhbnNmb3JtcyBzaW5jZSBzb21lIGJyb3dzZXJzIHdpbGxcbiAgICAgICAgLy8gYmx1ciB0aGUgZWxlbWVudHMsIGZvciBzdWItcGl4ZWwgdHJhbnNmb3Jtcy5cbiAgICAgICAgZWxlbWVudFRvT2Zmc2V0LnN0eWxlLnRyYW5zZm9ybSA9IGNvbWJpbmVUcmFuc2Zvcm1zKFxuICAgICAgICAgIGB0cmFuc2xhdGUzZCgke01hdGgucm91bmQoc2libGluZy5vZmZzZXQpfXB4LCAwLCAwKWAsXG4gICAgICAgICAgc2libGluZy5pbml0aWFsVHJhbnNmb3JtLFxuICAgICAgICApO1xuICAgICAgICBhZGp1c3RDbGllbnRSZWN0KHNpYmxpbmcuY2xpZW50UmVjdCwgMCwgb2Zmc2V0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsZW1lbnRUb09mZnNldC5zdHlsZS50cmFuc2Zvcm0gPSBjb21iaW5lVHJhbnNmb3JtcyhcbiAgICAgICAgICBgdHJhbnNsYXRlM2QoMCwgJHtNYXRoLnJvdW5kKHNpYmxpbmcub2Zmc2V0KX1weCwgMClgLFxuICAgICAgICAgIHNpYmxpbmcuaW5pdGlhbFRyYW5zZm9ybSxcbiAgICAgICAgKTtcbiAgICAgICAgYWRqdXN0Q2xpZW50UmVjdChzaWJsaW5nLmNsaWVudFJlY3QsIG9mZnNldCwgMCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBOb3RlIHRoYXQgaXQncyBpbXBvcnRhbnQgdGhhdCB3ZSBkbyB0aGlzIGFmdGVyIHRoZSBjbGllbnQgcmVjdHMgaGF2ZSBiZWVuIGFkanVzdGVkLlxuICAgIHRoaXMuX3ByZXZpb3VzU3dhcC5vdmVybGFwcyA9IGlzSW5zaWRlQ2xpZW50UmVjdChuZXdQb3NpdGlvbiwgcG9pbnRlclgsIHBvaW50ZXJZKTtcbiAgICB0aGlzLl9wcmV2aW91c1N3YXAuZHJhZyA9IHNpYmxpbmdBdE5ld1Bvc2l0aW9uLmRyYWc7XG4gICAgdGhpcy5fcHJldmlvdXNTd2FwLmRlbHRhID0gaXNIb3Jpem9udGFsID8gcG9pbnRlckRlbHRhLnggOiBwb2ludGVyRGVsdGEueTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgdXNlcidzIHBvaW50ZXIgaXMgY2xvc2UgdG8gdGhlIGVkZ2VzIG9mIGVpdGhlciB0aGVcbiAgICogdmlld3BvcnQgb3IgdGhlIGRyb3AgbGlzdCBhbmQgc3RhcnRzIHRoZSBhdXRvLXNjcm9sbCBzZXF1ZW5jZS5cbiAgICogQHBhcmFtIHBvaW50ZXJYIFVzZXIncyBwb2ludGVyIHBvc2l0aW9uIGFsb25nIHRoZSB4IGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBVc2VyJ3MgcG9pbnRlciBwb3NpdGlvbiBhbG9uZyB0aGUgeSBheGlzLlxuICAgKi9cbiAgX3N0YXJ0U2Nyb2xsaW5nSWZOZWNlc3NhcnkocG9pbnRlclg6IG51bWJlciwgcG9pbnRlclk6IG51bWJlcikge1xuICAgIGlmICh0aGlzLmF1dG9TY3JvbGxEaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBzY3JvbGxOb2RlOiBIVE1MRWxlbWVudCB8IFdpbmRvdyB8IHVuZGVmaW5lZDtcbiAgICBsZXQgdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uTk9ORTtcbiAgICBsZXQgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLk5PTkU7XG5cbiAgICAvLyBDaGVjayB3aGV0aGVyIHdlIHNob3VsZCBzdGFydCBzY3JvbGxpbmcgYW55IG9mIHRoZSBwYXJlbnQgY29udGFpbmVycy5cbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMucG9zaXRpb25zLmZvckVhY2goKHBvc2l0aW9uLCBlbGVtZW50KSA9PiB7XG4gICAgICAvLyBXZSBoYXZlIHNwZWNpYWwgaGFuZGxpbmcgZm9yIHRoZSBgZG9jdW1lbnRgIGJlbG93LiBBbHNvIHRoaXMgd291bGQgYmVcbiAgICAgIC8vIG5pY2VyIHdpdGggYSAgZm9yLi4ub2YgbG9vcCwgYnV0IGl0IHJlcXVpcmVzIGNoYW5naW5nIGEgY29tcGlsZXIgZmxhZy5cbiAgICAgIGlmIChlbGVtZW50ID09PSB0aGlzLl9kb2N1bWVudCB8fCAhcG9zaXRpb24uY2xpZW50UmVjdCB8fCBzY3JvbGxOb2RlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKFxuICAgICAgICBpc1BvaW50ZXJOZWFyQ2xpZW50UmVjdChwb3NpdGlvbi5jbGllbnRSZWN0LCBEUk9QX1BST1hJTUlUWV9USFJFU0hPTEQsIHBvaW50ZXJYLCBwb2ludGVyWSlcbiAgICAgICkge1xuICAgICAgICBbdmVydGljYWxTY3JvbGxEaXJlY3Rpb24sIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb25dID0gZ2V0RWxlbWVudFNjcm9sbERpcmVjdGlvbnMoXG4gICAgICAgICAgZWxlbWVudCBhcyBIVE1MRWxlbWVudCxcbiAgICAgICAgICBwb3NpdGlvbi5jbGllbnRSZWN0LFxuICAgICAgICAgIHBvaW50ZXJYLFxuICAgICAgICAgIHBvaW50ZXJZLFxuICAgICAgICApO1xuXG4gICAgICAgIGlmICh2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiB8fCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKSB7XG4gICAgICAgICAgc2Nyb2xsTm9kZSA9IGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIE90aGVyd2lzZSBjaGVjayBpZiB3ZSBjYW4gc3RhcnQgc2Nyb2xsaW5nIHRoZSB2aWV3cG9ydC5cbiAgICBpZiAoIXZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uICYmICFob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKSB7XG4gICAgICBjb25zdCB7d2lkdGgsIGhlaWdodH0gPSB0aGlzLl92aWV3cG9ydFJ1bGVyLmdldFZpZXdwb3J0U2l6ZSgpO1xuICAgICAgY29uc3QgY2xpZW50UmVjdCA9IHtcbiAgICAgICAgd2lkdGgsXG4gICAgICAgIGhlaWdodCxcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICByaWdodDogd2lkdGgsXG4gICAgICAgIGJvdHRvbTogaGVpZ2h0LFxuICAgICAgICBsZWZ0OiAwLFxuICAgICAgfSBhcyBDbGllbnRSZWN0O1xuICAgICAgdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSBnZXRWZXJ0aWNhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0LCBwb2ludGVyWSk7XG4gICAgICBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gZ2V0SG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0LCBwb2ludGVyWCk7XG4gICAgICBzY3JvbGxOb2RlID0gd2luZG93O1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgIHNjcm9sbE5vZGUgJiZcbiAgICAgICh2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiAhPT0gdGhpcy5fdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gfHxcbiAgICAgICAgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiAhPT0gdGhpcy5faG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiB8fFxuICAgICAgICBzY3JvbGxOb2RlICE9PSB0aGlzLl9zY3JvbGxOb2RlKVxuICAgICkge1xuICAgICAgdGhpcy5fdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSB2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbjtcbiAgICAgIHRoaXMuX2hvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uO1xuICAgICAgdGhpcy5fc2Nyb2xsTm9kZSA9IHNjcm9sbE5vZGU7XG5cbiAgICAgIGlmICgodmVydGljYWxTY3JvbGxEaXJlY3Rpb24gfHwgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbikgJiYgc2Nyb2xsTm9kZSkge1xuICAgICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIodGhpcy5fc3RhcnRTY3JvbGxJbnRlcnZhbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9zdG9wU2Nyb2xsaW5nKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIFN0b3BzIGFueSBjdXJyZW50bHktcnVubmluZyBhdXRvLXNjcm9sbCBzZXF1ZW5jZXMuICovXG4gIF9zdG9wU2Nyb2xsaW5nKCkge1xuICAgIHRoaXMuX3N0b3BTY3JvbGxUaW1lcnMubmV4dCgpO1xuICB9XG5cbiAgLyoqIFN0YXJ0cyB0aGUgZHJhZ2dpbmcgc2VxdWVuY2Ugd2l0aGluIHRoZSBsaXN0LiAqL1xuICBwcml2YXRlIF9kcmFnZ2luZ1N0YXJ0ZWQoKSB7XG4gICAgY29uc3Qgc3R5bGVzID0gY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpLnN0eWxlIGFzIERyYWdDU1NTdHlsZURlY2xhcmF0aW9uO1xuICAgIHRoaXMuYmVmb3JlU3RhcnRlZC5uZXh0KCk7XG4gICAgdGhpcy5faXNEcmFnZ2luZyA9IHRydWU7XG5cbiAgICAvLyBXZSBuZWVkIHRvIGRpc2FibGUgc2Nyb2xsIHNuYXBwaW5nIHdoaWxlIHRoZSB1c2VyIGlzIGRyYWdnaW5nLCBiZWNhdXNlIGl0IGJyZWFrcyBhdXRvbWF0aWNcbiAgICAvLyBzY3JvbGxpbmcuIFRoZSBicm93c2VyIHNlZW1zIHRvIHJvdW5kIHRoZSB2YWx1ZSBiYXNlZCBvbiB0aGUgc25hcHBpbmcgcG9pbnRzIHdoaWNoIG1lYW5zXG4gICAgLy8gdGhhdCB3ZSBjYW4ndCBpbmNyZW1lbnQvZGVjcmVtZW50IHRoZSBzY3JvbGwgcG9zaXRpb24uXG4gICAgdGhpcy5faW5pdGlhbFNjcm9sbFNuYXAgPSBzdHlsZXMubXNTY3JvbGxTbmFwVHlwZSB8fCBzdHlsZXMuc2Nyb2xsU25hcFR5cGUgfHwgJyc7XG4gICAgc3R5bGVzLnNjcm9sbFNuYXBUeXBlID0gc3R5bGVzLm1zU2Nyb2xsU25hcFR5cGUgPSAnbm9uZSc7XG4gICAgdGhpcy5fY2FjaGVJdGVtcygpO1xuICAgIHRoaXMuX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fbGlzdGVuVG9TY3JvbGxFdmVudHMoKTtcbiAgfVxuXG4gIC8qKiBDYWNoZXMgdGhlIHBvc2l0aW9ucyBvZiB0aGUgY29uZmlndXJlZCBzY3JvbGxhYmxlIHBhcmVudHMuICovXG4gIHByaXZhdGUgX2NhY2hlUGFyZW50UG9zaXRpb25zKCkge1xuICAgIGNvbnN0IGVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KHRoaXMuZWxlbWVudCk7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLmNhY2hlKHRoaXMuX3Njcm9sbGFibGVFbGVtZW50cyk7XG5cbiAgICAvLyBUaGUgbGlzdCBlbGVtZW50IGlzIGFsd2F5cyBpbiB0aGUgYHNjcm9sbGFibGVFbGVtZW50c2BcbiAgICAvLyBzbyB3ZSBjYW4gdGFrZSBhZHZhbnRhZ2Ugb2YgdGhlIGNhY2hlZCBgQ2xpZW50UmVjdGAuXG4gICAgdGhpcy5fY2xpZW50UmVjdCA9IHRoaXMuX3BhcmVudFBvc2l0aW9ucy5wb3NpdGlvbnMuZ2V0KGVsZW1lbnQpIS5jbGllbnRSZWN0ITtcbiAgfVxuXG4gIC8qKiBSZWZyZXNoZXMgdGhlIHBvc2l0aW9uIGNhY2hlIG9mIHRoZSBpdGVtcyBhbmQgc2libGluZyBjb250YWluZXJzLiAqL1xuICBwcml2YXRlIF9jYWNoZUl0ZW1Qb3NpdGlvbnMoKSB7XG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gdGhpcy5fb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJztcblxuICAgIHRoaXMuX2l0ZW1Qb3NpdGlvbnMgPSB0aGlzLl9hY3RpdmVEcmFnZ2FibGVzXG4gICAgICAubWFwKGRyYWcgPT4ge1xuICAgICAgICBjb25zdCBlbGVtZW50VG9NZWFzdXJlID0gZHJhZy5nZXRWaXNpYmxlRWxlbWVudCgpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGRyYWcsXG4gICAgICAgICAgb2Zmc2V0OiAwLFxuICAgICAgICAgIGluaXRpYWxUcmFuc2Zvcm06IGVsZW1lbnRUb01lYXN1cmUuc3R5bGUudHJhbnNmb3JtIHx8ICcnLFxuICAgICAgICAgIGNsaWVudFJlY3Q6IGdldE11dGFibGVDbGllbnRSZWN0KGVsZW1lbnRUb01lYXN1cmUpLFxuICAgICAgICB9O1xuICAgICAgfSlcbiAgICAgIC5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgIHJldHVybiBpc0hvcml6b250YWxcbiAgICAgICAgICA/IGEuY2xpZW50UmVjdC5sZWZ0IC0gYi5jbGllbnRSZWN0LmxlZnRcbiAgICAgICAgICA6IGEuY2xpZW50UmVjdC50b3AgLSBiLmNsaWVudFJlY3QudG9wO1xuICAgICAgfSk7XG4gIH1cblxuICAvKiogUmVzZXRzIHRoZSBjb250YWluZXIgdG8gaXRzIGluaXRpYWwgc3RhdGUuICovXG4gIHByaXZhdGUgX3Jlc2V0KCkge1xuICAgIHRoaXMuX2lzRHJhZ2dpbmcgPSBmYWxzZTtcblxuICAgIGNvbnN0IHN0eWxlcyA9IGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KS5zdHlsZSBhcyBEcmFnQ1NTU3R5bGVEZWNsYXJhdGlvbjtcbiAgICBzdHlsZXMuc2Nyb2xsU25hcFR5cGUgPSBzdHlsZXMubXNTY3JvbGxTbmFwVHlwZSA9IHRoaXMuX2luaXRpYWxTY3JvbGxTbmFwO1xuXG4gICAgLy8gVE9ETyhjcmlzYmV0byk6IG1heSBoYXZlIHRvIHdhaXQgZm9yIHRoZSBhbmltYXRpb25zIHRvIGZpbmlzaC5cbiAgICB0aGlzLl9hY3RpdmVEcmFnZ2FibGVzLmZvckVhY2goaXRlbSA9PiB7XG4gICAgICBjb25zdCByb290RWxlbWVudCA9IGl0ZW0uZ2V0Um9vdEVsZW1lbnQoKTtcblxuICAgICAgaWYgKHJvb3RFbGVtZW50KSB7XG4gICAgICAgIGNvbnN0IGluaXRpYWxUcmFuc2Zvcm0gPSB0aGlzLl9pdGVtUG9zaXRpb25zLmZpbmQoXG4gICAgICAgICAgY3VycmVudCA9PiBjdXJyZW50LmRyYWcgPT09IGl0ZW0sXG4gICAgICAgICk/LmluaXRpYWxUcmFuc2Zvcm07XG4gICAgICAgIHJvb3RFbGVtZW50LnN0eWxlLnRyYW5zZm9ybSA9IGluaXRpYWxUcmFuc2Zvcm0gfHwgJyc7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5fc2libGluZ3MuZm9yRWFjaChzaWJsaW5nID0+IHNpYmxpbmcuX3N0b3BSZWNlaXZpbmcodGhpcykpO1xuICAgIHRoaXMuX2FjdGl2ZURyYWdnYWJsZXMgPSBbXTtcbiAgICB0aGlzLl9pdGVtUG9zaXRpb25zID0gW107XG4gICAgdGhpcy5fcHJldmlvdXNTd2FwLmRyYWcgPSBudWxsO1xuICAgIHRoaXMuX3ByZXZpb3VzU3dhcC5kZWx0YSA9IDA7XG4gICAgdGhpcy5fcHJldmlvdXNTd2FwLm92ZXJsYXBzID0gZmFsc2U7XG4gICAgdGhpcy5fc3RvcFNjcm9sbGluZygpO1xuICAgIHRoaXMuX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLmNsZWFyKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgb2Zmc2V0IGluIHBpeGVscyBieSB3aGljaCB0aGUgaXRlbXMgdGhhdCBhcmVuJ3QgYmVpbmcgZHJhZ2dlZCBzaG91bGQgYmUgbW92ZWQuXG4gICAqIEBwYXJhbSBjdXJyZW50SW5kZXggSW5kZXggb2YgdGhlIGl0ZW0gY3VycmVudGx5IGJlaW5nIGRyYWdnZWQuXG4gICAqIEBwYXJhbSBzaWJsaW5ncyBBbGwgb2YgdGhlIGl0ZW1zIGluIHRoZSBsaXN0LlxuICAgKiBAcGFyYW0gZGVsdGEgRGlyZWN0aW9uIGluIHdoaWNoIHRoZSB1c2VyIGlzIG1vdmluZy5cbiAgICovXG4gIHByaXZhdGUgX2dldFNpYmxpbmdPZmZzZXRQeChjdXJyZW50SW5kZXg6IG51bWJlciwgc2libGluZ3M6IENhY2hlZEl0ZW1Qb3NpdGlvbltdLCBkZWx0YTogMSB8IC0xKSB7XG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gdGhpcy5fb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJztcbiAgICBjb25zdCBjdXJyZW50UG9zaXRpb24gPSBzaWJsaW5nc1tjdXJyZW50SW5kZXhdLmNsaWVudFJlY3Q7XG4gICAgY29uc3QgaW1tZWRpYXRlU2libGluZyA9IHNpYmxpbmdzW2N1cnJlbnRJbmRleCArIGRlbHRhICogLTFdO1xuICAgIGxldCBzaWJsaW5nT2Zmc2V0ID0gY3VycmVudFBvc2l0aW9uW2lzSG9yaXpvbnRhbCA/ICd3aWR0aCcgOiAnaGVpZ2h0J10gKiBkZWx0YTtcblxuICAgIGlmIChpbW1lZGlhdGVTaWJsaW5nKSB7XG4gICAgICBjb25zdCBzdGFydCA9IGlzSG9yaXpvbnRhbCA/ICdsZWZ0JyA6ICd0b3AnO1xuICAgICAgY29uc3QgZW5kID0gaXNIb3Jpem9udGFsID8gJ3JpZ2h0JyA6ICdib3R0b20nO1xuXG4gICAgICAvLyBHZXQgdGhlIHNwYWNpbmcgYmV0d2VlbiB0aGUgc3RhcnQgb2YgdGhlIGN1cnJlbnQgaXRlbSBhbmQgdGhlIGVuZCBvZiB0aGUgb25lIGltbWVkaWF0ZWx5XG4gICAgICAvLyBhZnRlciBpdCBpbiB0aGUgZGlyZWN0aW9uIGluIHdoaWNoIHRoZSB1c2VyIGlzIGRyYWdnaW5nLCBvciB2aWNlIHZlcnNhLiBXZSBhZGQgaXQgdG8gdGhlXG4gICAgICAvLyBvZmZzZXQgaW4gb3JkZXIgdG8gcHVzaCB0aGUgZWxlbWVudCB0byB3aGVyZSBpdCB3aWxsIGJlIHdoZW4gaXQncyBpbmxpbmUgYW5kIGlzIGluZmx1ZW5jZWRcbiAgICAgIC8vIGJ5IHRoZSBgbWFyZ2luYCBvZiBpdHMgc2libGluZ3MuXG4gICAgICBpZiAoZGVsdGEgPT09IC0xKSB7XG4gICAgICAgIHNpYmxpbmdPZmZzZXQgLT0gaW1tZWRpYXRlU2libGluZy5jbGllbnRSZWN0W3N0YXJ0XSAtIGN1cnJlbnRQb3NpdGlvbltlbmRdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2libGluZ09mZnNldCArPSBjdXJyZW50UG9zaXRpb25bc3RhcnRdIC0gaW1tZWRpYXRlU2libGluZy5jbGllbnRSZWN0W2VuZF07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNpYmxpbmdPZmZzZXQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgb2Zmc2V0IGluIHBpeGVscyBieSB3aGljaCB0aGUgaXRlbSB0aGF0IGlzIGJlaW5nIGRyYWdnZWQgc2hvdWxkIGJlIG1vdmVkLlxuICAgKiBAcGFyYW0gY3VycmVudFBvc2l0aW9uIEN1cnJlbnQgcG9zaXRpb24gb2YgdGhlIGl0ZW0uXG4gICAqIEBwYXJhbSBuZXdQb3NpdGlvbiBQb3NpdGlvbiBvZiB0aGUgaXRlbSB3aGVyZSB0aGUgY3VycmVudCBpdGVtIHNob3VsZCBiZSBtb3ZlZC5cbiAgICogQHBhcmFtIGRlbHRhIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgdXNlciBpcyBtb3ZpbmcuXG4gICAqL1xuICBwcml2YXRlIF9nZXRJdGVtT2Zmc2V0UHgoY3VycmVudFBvc2l0aW9uOiBDbGllbnRSZWN0LCBuZXdQb3NpdGlvbjogQ2xpZW50UmVjdCwgZGVsdGE6IDEgfCAtMSkge1xuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCc7XG4gICAgbGV0IGl0ZW1PZmZzZXQgPSBpc0hvcml6b250YWxcbiAgICAgID8gbmV3UG9zaXRpb24ubGVmdCAtIGN1cnJlbnRQb3NpdGlvbi5sZWZ0XG4gICAgICA6IG5ld1Bvc2l0aW9uLnRvcCAtIGN1cnJlbnRQb3NpdGlvbi50b3A7XG5cbiAgICAvLyBBY2NvdW50IGZvciBkaWZmZXJlbmNlcyBpbiB0aGUgaXRlbSB3aWR0aC9oZWlnaHQuXG4gICAgaWYgKGRlbHRhID09PSAtMSkge1xuICAgICAgaXRlbU9mZnNldCArPSBpc0hvcml6b250YWxcbiAgICAgICAgPyBuZXdQb3NpdGlvbi53aWR0aCAtIGN1cnJlbnRQb3NpdGlvbi53aWR0aFxuICAgICAgICA6IG5ld1Bvc2l0aW9uLmhlaWdodCAtIGN1cnJlbnRQb3NpdGlvbi5oZWlnaHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIGl0ZW1PZmZzZXQ7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHBvaW50ZXIgaXMgZW50ZXJpbmcgaW4gdGhlIGZpcnN0IHBvc2l0aW9uXG4gICAqIEBwYXJhbSBwb2ludGVyWCBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHBvaW50ZXJZIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgWSBheGlzLlxuICAgKi9cbiAgcHJpdmF0ZSBfc2hvdWxkRW50ZXJBc0ZpcnN0Q2hpbGQocG9pbnRlclg6IG51bWJlciwgcG9pbnRlclk6IG51bWJlcikge1xuICAgIGlmICghdGhpcy5fYWN0aXZlRHJhZ2dhYmxlcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBpdGVtUG9zaXRpb25zID0gdGhpcy5faXRlbVBvc2l0aW9ucztcbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuXG4gICAgLy8gYGl0ZW1Qb3NpdGlvbnNgIGFyZSBzb3J0ZWQgYnkgcG9zaXRpb24gd2hpbGUgYGFjdGl2ZURyYWdnYWJsZXNgIGFyZSBzb3J0ZWQgYnkgY2hpbGQgaW5kZXhcbiAgICAvLyBjaGVjayBpZiBjb250YWluZXIgaXMgdXNpbmcgc29tZSBzb3J0IG9mIFwicmV2ZXJzZVwiIG9yZGVyaW5nIChlZzogZmxleC1kaXJlY3Rpb246IHJvdy1yZXZlcnNlKVxuICAgIGNvbnN0IHJldmVyc2VkID0gaXRlbVBvc2l0aW9uc1swXS5kcmFnICE9PSB0aGlzLl9hY3RpdmVEcmFnZ2FibGVzWzBdO1xuICAgIGlmIChyZXZlcnNlZCkge1xuICAgICAgY29uc3QgbGFzdEl0ZW1SZWN0ID0gaXRlbVBvc2l0aW9uc1tpdGVtUG9zaXRpb25zLmxlbmd0aCAtIDFdLmNsaWVudFJlY3Q7XG4gICAgICByZXR1cm4gaXNIb3Jpem9udGFsID8gcG9pbnRlclggPj0gbGFzdEl0ZW1SZWN0LnJpZ2h0IDogcG9pbnRlclkgPj0gbGFzdEl0ZW1SZWN0LmJvdHRvbTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZmlyc3RJdGVtUmVjdCA9IGl0ZW1Qb3NpdGlvbnNbMF0uY2xpZW50UmVjdDtcbiAgICAgIHJldHVybiBpc0hvcml6b250YWwgPyBwb2ludGVyWCA8PSBmaXJzdEl0ZW1SZWN0LmxlZnQgOiBwb2ludGVyWSA8PSBmaXJzdEl0ZW1SZWN0LnRvcDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW5kZXggb2YgYW4gaXRlbSBpbiB0aGUgZHJvcCBjb250YWluZXIsIGJhc2VkIG9uIHRoZSBwb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdGhhdCBpcyBiZWluZyBzb3J0ZWQuXG4gICAqIEBwYXJhbSBwb2ludGVyWCBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHBvaW50ZXJZIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgWSBheGlzLlxuICAgKiBAcGFyYW0gZGVsdGEgRGlyZWN0aW9uIGluIHdoaWNoIHRoZSB1c2VyIGlzIG1vdmluZyB0aGVpciBwb2ludGVyLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0SXRlbUluZGV4RnJvbVBvaW50ZXJQb3NpdGlvbihcbiAgICBpdGVtOiBEcmFnUmVmLFxuICAgIHBvaW50ZXJYOiBudW1iZXIsXG4gICAgcG9pbnRlclk6IG51bWJlcixcbiAgICBkZWx0YT86IHt4OiBudW1iZXI7IHk6IG51bWJlcn0sXG4gICk6IG51bWJlciB7XG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gdGhpcy5fb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJztcbiAgICBjb25zdCBpbmRleCA9IHRoaXMuX2l0ZW1Qb3NpdGlvbnMuZmluZEluZGV4KCh7ZHJhZywgY2xpZW50UmVjdH0pID0+IHtcbiAgICAgIC8vIFNraXAgdGhlIGl0ZW0gaXRzZWxmLlxuICAgICAgaWYgKGRyYWcgPT09IGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGVsdGEpIHtcbiAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gaXNIb3Jpem9udGFsID8gZGVsdGEueCA6IGRlbHRhLnk7XG5cbiAgICAgICAgLy8gSWYgdGhlIHVzZXIgaXMgc3RpbGwgaG92ZXJpbmcgb3ZlciB0aGUgc2FtZSBpdGVtIGFzIGxhc3QgdGltZSwgdGhlaXIgY3Vyc29yIGhhc24ndCBsZWZ0XG4gICAgICAgIC8vIHRoZSBpdGVtIGFmdGVyIHdlIG1hZGUgdGhlIHN3YXAsIGFuZCB0aGV5IGRpZG4ndCBjaGFuZ2UgdGhlIGRpcmVjdGlvbiBpbiB3aGljaCB0aGV5J3JlXG4gICAgICAgIC8vIGRyYWdnaW5nLCB3ZSBkb24ndCBjb25zaWRlciBpdCBhIGRpcmVjdGlvbiBzd2FwLlxuICAgICAgICBpZiAoXG4gICAgICAgICAgZHJhZyA9PT0gdGhpcy5fcHJldmlvdXNTd2FwLmRyYWcgJiZcbiAgICAgICAgICB0aGlzLl9wcmV2aW91c1N3YXAub3ZlcmxhcHMgJiZcbiAgICAgICAgICBkaXJlY3Rpb24gPT09IHRoaXMuX3ByZXZpb3VzU3dhcC5kZWx0YVxuICAgICAgICApIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGlzSG9yaXpvbnRhbFxuICAgICAgICA/IC8vIFJvdW5kIHRoZXNlIGRvd24gc2luY2UgbW9zdCBicm93c2VycyByZXBvcnQgY2xpZW50IHJlY3RzIHdpdGhcbiAgICAgICAgICAvLyBzdWItcGl4ZWwgcHJlY2lzaW9uLCB3aGVyZWFzIHRoZSBwb2ludGVyIGNvb3JkaW5hdGVzIGFyZSByb3VuZGVkIHRvIHBpeGVscy5cbiAgICAgICAgICBwb2ludGVyWCA+PSBNYXRoLmZsb29yKGNsaWVudFJlY3QubGVmdCkgJiYgcG9pbnRlclggPCBNYXRoLmZsb29yKGNsaWVudFJlY3QucmlnaHQpXG4gICAgICAgIDogcG9pbnRlclkgPj0gTWF0aC5mbG9vcihjbGllbnRSZWN0LnRvcCkgJiYgcG9pbnRlclkgPCBNYXRoLmZsb29yKGNsaWVudFJlY3QuYm90dG9tKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBpbmRleCA9PT0gLTEgfHwgIXRoaXMuc29ydFByZWRpY2F0ZShpbmRleCwgaXRlbSwgdGhpcykgPyAtMSA6IGluZGV4O1xuICB9XG5cbiAgLyoqIENhY2hlcyB0aGUgY3VycmVudCBpdGVtcyBpbiB0aGUgbGlzdCBhbmQgdGhlaXIgcG9zaXRpb25zLiAqL1xuICBwcml2YXRlIF9jYWNoZUl0ZW1zKCk6IHZvaWQge1xuICAgIHRoaXMuX2FjdGl2ZURyYWdnYWJsZXMgPSB0aGlzLl9kcmFnZ2FibGVzLnNsaWNlKCk7XG4gICAgdGhpcy5fY2FjaGVJdGVtUG9zaXRpb25zKCk7XG4gICAgdGhpcy5fY2FjaGVQYXJlbnRQb3NpdGlvbnMoKTtcbiAgfVxuXG4gIC8qKiBTdGFydHMgdGhlIGludGVydmFsIHRoYXQnbGwgYXV0by1zY3JvbGwgdGhlIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3N0YXJ0U2Nyb2xsSW50ZXJ2YWwgPSAoKSA9PiB7XG4gICAgdGhpcy5fc3RvcFNjcm9sbGluZygpO1xuXG4gICAgaW50ZXJ2YWwoMCwgYW5pbWF0aW9uRnJhbWVTY2hlZHVsZXIpXG4gICAgICAucGlwZSh0YWtlVW50aWwodGhpcy5fc3RvcFNjcm9sbFRpbWVycykpXG4gICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMuX3Njcm9sbE5vZGU7XG4gICAgICAgIGNvbnN0IHNjcm9sbFN0ZXAgPSB0aGlzLmF1dG9TY3JvbGxTdGVwO1xuXG4gICAgICAgIGlmICh0aGlzLl92ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9PT0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLlVQKSB7XG4gICAgICAgICAgbm9kZS5zY3JvbGxCeSgwLCAtc2Nyb2xsU3RlcCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPT09IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5ET1dOKSB7XG4gICAgICAgICAgbm9kZS5zY3JvbGxCeSgwLCBzY3JvbGxTdGVwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9ob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID09PSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5MRUZUKSB7XG4gICAgICAgICAgbm9kZS5zY3JvbGxCeSgtc2Nyb2xsU3RlcCwgMCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5faG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9PT0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uUklHSFQpIHtcbiAgICAgICAgICBub2RlLnNjcm9sbEJ5KHNjcm9sbFN0ZXAsIDApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIHVzZXIncyBwb2ludGVyIGlzIHBvc2l0aW9uZWQgb3ZlciB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0geCBQb2ludGVyIHBvc2l0aW9uIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSB5IFBvaW50ZXIgcG9zaXRpb24gYWxvbmcgdGhlIFkgYXhpcy5cbiAgICovXG4gIF9pc092ZXJDb250YWluZXIoeDogbnVtYmVyLCB5OiBudW1iZXIpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fY2xpZW50UmVjdCAhPSBudWxsICYmIGlzSW5zaWRlQ2xpZW50UmVjdCh0aGlzLl9jbGllbnRSZWN0LCB4LCB5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaWd1cmVzIG91dCB3aGV0aGVyIGFuIGl0ZW0gc2hvdWxkIGJlIG1vdmVkIGludG8gYSBzaWJsaW5nXG4gICAqIGRyb3AgY29udGFpbmVyLCBiYXNlZCBvbiBpdHMgY3VycmVudCBwb3NpdGlvbi5cbiAgICogQHBhcmFtIGl0ZW0gRHJhZyBpdGVtIHRoYXQgaXMgYmVpbmcgbW92ZWQuXG4gICAqIEBwYXJhbSB4IFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSB5IFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqL1xuICBfZ2V0U2libGluZ0NvbnRhaW5lckZyb21Qb3NpdGlvbihpdGVtOiBEcmFnUmVmLCB4OiBudW1iZXIsIHk6IG51bWJlcik6IERyb3BMaXN0UmVmIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fc2libGluZ3MuZmluZChzaWJsaW5nID0+IHNpYmxpbmcuX2NhblJlY2VpdmUoaXRlbSwgeCwgeSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSBkcm9wIGxpc3QgY2FuIHJlY2VpdmUgdGhlIHBhc3NlZC1pbiBpdGVtLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRoYXQgaXMgYmVpbmcgZHJhZ2dlZCBpbnRvIHRoZSBsaXN0LlxuICAgKiBAcGFyYW0geCBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0geSBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKi9cbiAgX2NhblJlY2VpdmUoaXRlbTogRHJhZ1JlZiwgeDogbnVtYmVyLCB5OiBudW1iZXIpOiBib29sZWFuIHtcbiAgICBpZiAoXG4gICAgICAhdGhpcy5fY2xpZW50UmVjdCB8fFxuICAgICAgIWlzSW5zaWRlQ2xpZW50UmVjdCh0aGlzLl9jbGllbnRSZWN0LCB4LCB5KSB8fFxuICAgICAgIXRoaXMuZW50ZXJQcmVkaWNhdGUoaXRlbSwgdGhpcylcbiAgICApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBlbGVtZW50RnJvbVBvaW50ID0gdGhpcy5fZ2V0U2hhZG93Um9vdCgpLmVsZW1lbnRGcm9tUG9pbnQoeCwgeSkgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuXG4gICAgLy8gSWYgdGhlcmUncyBubyBlbGVtZW50IGF0IHRoZSBwb2ludGVyIHBvc2l0aW9uLCB0aGVuXG4gICAgLy8gdGhlIGNsaWVudCByZWN0IGlzIHByb2JhYmx5IHNjcm9sbGVkIG91dCBvZiB0aGUgdmlldy5cbiAgICBpZiAoIWVsZW1lbnRGcm9tUG9pbnQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpO1xuXG4gICAgLy8gVGhlIGBDbGllbnRSZWN0YCwgdGhhdCB3ZSdyZSB1c2luZyB0byBmaW5kIHRoZSBjb250YWluZXIgb3ZlciB3aGljaCB0aGUgdXNlciBpc1xuICAgIC8vIGhvdmVyaW5nLCBkb2Vzbid0IGdpdmUgdXMgYW55IGluZm9ybWF0aW9uIG9uIHdoZXRoZXIgdGhlIGVsZW1lbnQgaGFzIGJlZW4gc2Nyb2xsZWRcbiAgICAvLyBvdXQgb2YgdGhlIHZpZXcgb3Igd2hldGhlciBpdCdzIG92ZXJsYXBwaW5nIHdpdGggb3RoZXIgY29udGFpbmVycy4gVGhpcyBtZWFucyB0aGF0XG4gICAgLy8gd2UgY291bGQgZW5kIHVwIHRyYW5zZmVycmluZyB0aGUgaXRlbSBpbnRvIGEgY29udGFpbmVyIHRoYXQncyBpbnZpc2libGUgb3IgaXMgcG9zaXRpb25lZFxuICAgIC8vIGJlbG93IGFub3RoZXIgb25lLiBXZSB1c2UgdGhlIHJlc3VsdCBmcm9tIGBlbGVtZW50RnJvbVBvaW50YCB0byBnZXQgdGhlIHRvcC1tb3N0IGVsZW1lbnRcbiAgICAvLyBhdCB0aGUgcG9pbnRlciBwb3NpdGlvbiBhbmQgdG8gZmluZCB3aGV0aGVyIGl0J3Mgb25lIG9mIHRoZSBpbnRlcnNlY3RpbmcgZHJvcCBjb250YWluZXJzLlxuICAgIHJldHVybiBlbGVtZW50RnJvbVBvaW50ID09PSBuYXRpdmVFbGVtZW50IHx8IG5hdGl2ZUVsZW1lbnQuY29udGFpbnMoZWxlbWVudEZyb21Qb2ludCk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIGJ5IG9uZSBvZiB0aGUgY29ubmVjdGVkIGRyb3AgbGlzdHMgd2hlbiBhIGRyYWdnaW5nIHNlcXVlbmNlIGhhcyBzdGFydGVkLlxuICAgKiBAcGFyYW0gc2libGluZyBTaWJsaW5nIGluIHdoaWNoIGRyYWdnaW5nIGhhcyBzdGFydGVkLlxuICAgKi9cbiAgX3N0YXJ0UmVjZWl2aW5nKHNpYmxpbmc6IERyb3BMaXN0UmVmLCBpdGVtczogRHJhZ1JlZltdKSB7XG4gICAgY29uc3QgYWN0aXZlU2libGluZ3MgPSB0aGlzLl9hY3RpdmVTaWJsaW5ncztcblxuICAgIGlmIChcbiAgICAgICFhY3RpdmVTaWJsaW5ncy5oYXMoc2libGluZykgJiZcbiAgICAgIGl0ZW1zLmV2ZXJ5KGl0ZW0gPT4ge1xuICAgICAgICAvLyBOb3RlIHRoYXQgd2UgaGF2ZSB0byBhZGQgYW4gZXhjZXB0aW9uIHRvIHRoZSBgZW50ZXJQcmVkaWNhdGVgIGZvciBpdGVtcyB0aGF0IHN0YXJ0ZWQgb2ZmXG4gICAgICAgIC8vIGluIHRoaXMgZHJvcCBsaXN0LiBUaGUgZHJhZyByZWYgaGFzIGxvZ2ljIHRoYXQgYWxsb3dzIGFuIGl0ZW0gdG8gcmV0dXJuIHRvIGl0cyBpbml0aWFsXG4gICAgICAgIC8vIGNvbnRhaW5lciwgaWYgaXQgaGFzIGxlZnQgdGhlIGluaXRpYWwgY29udGFpbmVyIGFuZCBub25lIG9mIHRoZSBjb25uZWN0ZWQgY29udGFpbmVyc1xuICAgICAgICAvLyBhbGxvdyBpdCB0byBlbnRlci4gU2VlIGBEcmFnUmVmLl91cGRhdGVBY3RpdmVEcm9wQ29udGFpbmVyYCBmb3IgbW9yZSBjb250ZXh0LlxuICAgICAgICByZXR1cm4gdGhpcy5lbnRlclByZWRpY2F0ZShpdGVtLCB0aGlzKSB8fCB0aGlzLl9kcmFnZ2FibGVzLmluZGV4T2YoaXRlbSkgPiAtMTtcbiAgICAgIH0pXG4gICAgKSB7XG4gICAgICBhY3RpdmVTaWJsaW5ncy5hZGQoc2libGluZyk7XG4gICAgICB0aGlzLl9jYWNoZVBhcmVudFBvc2l0aW9ucygpO1xuICAgICAgdGhpcy5fbGlzdGVuVG9TY3JvbGxFdmVudHMoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIGJ5IGEgY29ubmVjdGVkIGRyb3AgbGlzdCB3aGVuIGRyYWdnaW5nIGhhcyBzdG9wcGVkLlxuICAgKiBAcGFyYW0gc2libGluZyBTaWJsaW5nIHdob3NlIGRyYWdnaW5nIGhhcyBzdG9wcGVkLlxuICAgKi9cbiAgX3N0b3BSZWNlaXZpbmcoc2libGluZzogRHJvcExpc3RSZWYpIHtcbiAgICB0aGlzLl9hY3RpdmVTaWJsaW5ncy5kZWxldGUoc2libGluZyk7XG4gICAgdGhpcy5fdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydHMgbGlzdGVuaW5nIHRvIHNjcm9sbCBldmVudHMgb24gdGhlIHZpZXdwb3J0LlxuICAgKiBVc2VkIGZvciB1cGRhdGluZyB0aGUgaW50ZXJuYWwgc3RhdGUgb2YgdGhlIGxpc3QuXG4gICAqL1xuICBwcml2YXRlIF9saXN0ZW5Ub1Njcm9sbEV2ZW50cygpIHtcbiAgICB0aGlzLl92aWV3cG9ydFNjcm9sbFN1YnNjcmlwdGlvbiA9IHRoaXMuX2RyYWdEcm9wUmVnaXN0cnlcbiAgICAgIC5zY3JvbGxlZCh0aGlzLl9nZXRTaGFkb3dSb290KCkpXG4gICAgICAuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgICAgaWYgKHRoaXMuaXNEcmFnZ2luZygpKSB7XG4gICAgICAgICAgY29uc3Qgc2Nyb2xsRGlmZmVyZW5jZSA9IHRoaXMuX3BhcmVudFBvc2l0aW9ucy5oYW5kbGVTY3JvbGwoZXZlbnQpO1xuXG4gICAgICAgICAgaWYgKHNjcm9sbERpZmZlcmVuY2UpIHtcbiAgICAgICAgICAgIC8vIFNpbmNlIHdlIGtub3cgdGhlIGFtb3VudCB0aGF0IHRoZSB1c2VyIGhhcyBzY3JvbGxlZCB3ZSBjYW4gc2hpZnQgYWxsIG9mIHRoZVxuICAgICAgICAgICAgLy8gY2xpZW50IHJlY3RhbmdsZXMgb3Vyc2VsdmVzLiBUaGlzIGlzIGNoZWFwZXIgdGhhbiByZS1tZWFzdXJpbmcgZXZlcnl0aGluZyBhbmRcbiAgICAgICAgICAgIC8vIHdlIGNhbiBhdm9pZCBpbmNvbnNpc3RlbnQgYmVoYXZpb3Igd2hlcmUgd2UgbWlnaHQgYmUgbWVhc3VyaW5nIHRoZSBlbGVtZW50IGJlZm9yZVxuICAgICAgICAgICAgLy8gaXRzIHBvc2l0aW9uIGhhcyBjaGFuZ2VkLlxuICAgICAgICAgICAgdGhpcy5faXRlbVBvc2l0aW9ucy5mb3JFYWNoKCh7Y2xpZW50UmVjdH0pID0+IHtcbiAgICAgICAgICAgICAgYWRqdXN0Q2xpZW50UmVjdChjbGllbnRSZWN0LCBzY3JvbGxEaWZmZXJlbmNlLnRvcCwgc2Nyb2xsRGlmZmVyZW5jZS5sZWZ0KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBXZSBuZWVkIHR3byBsb29wcyBmb3IgdGhpcywgYmVjYXVzZSB3ZSB3YW50IGFsbCBvZiB0aGUgY2FjaGVkXG4gICAgICAgICAgICAvLyBwb3NpdGlvbnMgdG8gYmUgdXAtdG8tZGF0ZSBiZWZvcmUgd2UgcmUtc29ydCB0aGUgaXRlbS5cbiAgICAgICAgICAgIHRoaXMuX2l0ZW1Qb3NpdGlvbnMuZm9yRWFjaCgoe2RyYWd9KSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LmlzRHJhZ2dpbmcoZHJhZykpIHtcbiAgICAgICAgICAgICAgICAvLyBXZSBuZWVkIHRvIHJlLXNvcnQgdGhlIGl0ZW0gbWFudWFsbHksIGJlY2F1c2UgdGhlIHBvaW50ZXIgbW92ZVxuICAgICAgICAgICAgICAgIC8vIGV2ZW50cyB3b24ndCBiZSBkaXNwYXRjaGVkIHdoaWxlIHRoZSB1c2VyIGlzIHNjcm9sbGluZy5cbiAgICAgICAgICAgICAgICBkcmFnLl9zb3J0RnJvbUxhc3RQb2ludGVyUG9zaXRpb24oKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuaXNSZWNlaXZpbmcoKSkge1xuICAgICAgICAgIHRoaXMuX2NhY2hlUGFyZW50UG9zaXRpb25zKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIExhemlseSByZXNvbHZlcyBhbmQgcmV0dXJucyB0aGUgc2hhZG93IHJvb3Qgb2YgdGhlIGVsZW1lbnQuIFdlIGRvIHRoaXMgaW4gYSBmdW5jdGlvbiwgcmF0aGVyXG4gICAqIHRoYW4gc2F2aW5nIGl0IGluIHByb3BlcnR5IGRpcmVjdGx5IG9uIGluaXQsIGJlY2F1c2Ugd2Ugd2FudCB0byByZXNvbHZlIGl0IGFzIGxhdGUgYXMgcG9zc2libGVcbiAgICogaW4gb3JkZXIgdG8gZW5zdXJlIHRoYXQgdGhlIGVsZW1lbnQgaGFzIGJlZW4gbW92ZWQgaW50byB0aGUgc2hhZG93IERPTS4gRG9pbmcgaXQgaW5zaWRlIHRoZVxuICAgKiBjb25zdHJ1Y3RvciBtaWdodCBiZSB0b28gZWFybHkgaWYgdGhlIGVsZW1lbnQgaXMgaW5zaWRlIG9mIHNvbWV0aGluZyBsaWtlIGBuZ0ZvcmAgb3IgYG5nSWZgLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0U2hhZG93Um9vdCgpOiBSb290Tm9kZSB7XG4gICAgaWYgKCF0aGlzLl9jYWNoZWRTaGFkb3dSb290KSB7XG4gICAgICBjb25zdCBzaGFkb3dSb290ID0gX2dldFNoYWRvd1Jvb3QoY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpKTtcbiAgICAgIHRoaXMuX2NhY2hlZFNoYWRvd1Jvb3QgPSAoc2hhZG93Um9vdCB8fCB0aGlzLl9kb2N1bWVudCkgYXMgUm9vdE5vZGU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX2NhY2hlZFNoYWRvd1Jvb3Q7XG4gIH1cblxuICAvKiogTm90aWZpZXMgYW55IHNpYmxpbmdzIHRoYXQgbWF5IHBvdGVudGlhbGx5IHJlY2VpdmUgdGhlIGl0ZW0uICovXG4gIHByaXZhdGUgX25vdGlmeVJlY2VpdmluZ1NpYmxpbmdzKCkge1xuICAgIGNvbnN0IGRyYWdnZWRJdGVtcyA9IHRoaXMuX2FjdGl2ZURyYWdnYWJsZXMuZmlsdGVyKGl0ZW0gPT4gaXRlbS5pc0RyYWdnaW5nKCkpO1xuICAgIHRoaXMuX3NpYmxpbmdzLmZvckVhY2goc2libGluZyA9PiBzaWJsaW5nLl9zdGFydFJlY2VpdmluZyh0aGlzLCBkcmFnZ2VkSXRlbXMpKTtcbiAgfVxufVxuXG4vKipcbiAqIEdldHMgd2hldGhlciB0aGUgdmVydGljYWwgYXV0by1zY3JvbGwgZGlyZWN0aW9uIG9mIGEgbm9kZS5cbiAqIEBwYXJhbSBjbGllbnRSZWN0IERpbWVuc2lvbnMgb2YgdGhlIG5vZGUuXG4gKiBAcGFyYW0gcG9pbnRlclkgUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSB5IGF4aXMuXG4gKi9cbmZ1bmN0aW9uIGdldFZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uKGNsaWVudFJlY3Q6IENsaWVudFJlY3QsIHBvaW50ZXJZOiBudW1iZXIpIHtcbiAgY29uc3Qge3RvcCwgYm90dG9tLCBoZWlnaHR9ID0gY2xpZW50UmVjdDtcbiAgY29uc3QgeVRocmVzaG9sZCA9IGhlaWdodCAqIFNDUk9MTF9QUk9YSU1JVFlfVEhSRVNIT0xEO1xuXG4gIGlmIChwb2ludGVyWSA+PSB0b3AgLSB5VGhyZXNob2xkICYmIHBvaW50ZXJZIDw9IHRvcCArIHlUaHJlc2hvbGQpIHtcbiAgICByZXR1cm4gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLlVQO1xuICB9IGVsc2UgaWYgKHBvaW50ZXJZID49IGJvdHRvbSAtIHlUaHJlc2hvbGQgJiYgcG9pbnRlclkgPD0gYm90dG9tICsgeVRocmVzaG9sZCkge1xuICAgIHJldHVybiBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uRE9XTjtcbiAgfVxuXG4gIHJldHVybiBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uTk9ORTtcbn1cblxuLyoqXG4gKiBHZXRzIHdoZXRoZXIgdGhlIGhvcml6b250YWwgYXV0by1zY3JvbGwgZGlyZWN0aW9uIG9mIGEgbm9kZS5cbiAqIEBwYXJhbSBjbGllbnRSZWN0IERpbWVuc2lvbnMgb2YgdGhlIG5vZGUuXG4gKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSB4IGF4aXMuXG4gKi9cbmZ1bmN0aW9uIGdldEhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24oY2xpZW50UmVjdDogQ2xpZW50UmVjdCwgcG9pbnRlclg6IG51bWJlcikge1xuICBjb25zdCB7bGVmdCwgcmlnaHQsIHdpZHRofSA9IGNsaWVudFJlY3Q7XG4gIGNvbnN0IHhUaHJlc2hvbGQgPSB3aWR0aCAqIFNDUk9MTF9QUk9YSU1JVFlfVEhSRVNIT0xEO1xuXG4gIGlmIChwb2ludGVyWCA+PSBsZWZ0IC0geFRocmVzaG9sZCAmJiBwb2ludGVyWCA8PSBsZWZ0ICsgeFRocmVzaG9sZCkge1xuICAgIHJldHVybiBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5MRUZUO1xuICB9IGVsc2UgaWYgKHBvaW50ZXJYID49IHJpZ2h0IC0geFRocmVzaG9sZCAmJiBwb2ludGVyWCA8PSByaWdodCArIHhUaHJlc2hvbGQpIHtcbiAgICByZXR1cm4gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uUklHSFQ7XG4gIH1cblxuICByZXR1cm4gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTk9ORTtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBkaXJlY3Rpb25zIGluIHdoaWNoIGFuIGVsZW1lbnQgbm9kZSBzaG91bGQgYmUgc2Nyb2xsZWQsXG4gKiBhc3N1bWluZyB0aGF0IHRoZSB1c2VyJ3MgcG9pbnRlciBpcyBhbHJlYWR5IHdpdGhpbiBpdCBzY3JvbGxhYmxlIHJlZ2lvbi5cbiAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgZm9yIHdoaWNoIHdlIHNob3VsZCBjYWxjdWxhdGUgdGhlIHNjcm9sbCBkaXJlY3Rpb24uXG4gKiBAcGFyYW0gY2xpZW50UmVjdCBCb3VuZGluZyBjbGllbnQgcmVjdGFuZ2xlIG9mIHRoZSBlbGVtZW50LlxuICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgeCBheGlzLlxuICogQHBhcmFtIHBvaW50ZXJZIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgeSBheGlzLlxuICovXG5mdW5jdGlvbiBnZXRFbGVtZW50U2Nyb2xsRGlyZWN0aW9ucyhcbiAgZWxlbWVudDogSFRNTEVsZW1lbnQsXG4gIGNsaWVudFJlY3Q6IENsaWVudFJlY3QsXG4gIHBvaW50ZXJYOiBudW1iZXIsXG4gIHBvaW50ZXJZOiBudW1iZXIsXG4pOiBbQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLCBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbl0ge1xuICBjb25zdCBjb21wdXRlZFZlcnRpY2FsID0gZ2V0VmVydGljYWxTY3JvbGxEaXJlY3Rpb24oY2xpZW50UmVjdCwgcG9pbnRlclkpO1xuICBjb25zdCBjb21wdXRlZEhvcml6b250YWwgPSBnZXRIb3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKGNsaWVudFJlY3QsIHBvaW50ZXJYKTtcbiAgbGV0IHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLk5PTkU7XG4gIGxldCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTk9ORTtcblxuICAvLyBOb3RlIHRoYXQgd2UgaGVyZSB3ZSBkbyBzb21lIGV4dHJhIGNoZWNrcyBmb3Igd2hldGhlciB0aGUgZWxlbWVudCBpcyBhY3R1YWxseSBzY3JvbGxhYmxlIGluXG4gIC8vIGEgY2VydGFpbiBkaXJlY3Rpb24gYW5kIHdlIG9ubHkgYXNzaWduIHRoZSBzY3JvbGwgZGlyZWN0aW9uIGlmIGl0IGlzLiBXZSBkbyB0aGlzIHNvIHRoYXQgd2VcbiAgLy8gY2FuIGFsbG93IG90aGVyIGVsZW1lbnRzIHRvIGJlIHNjcm9sbGVkLCBpZiB0aGUgY3VycmVudCBlbGVtZW50IGNhbid0IGJlIHNjcm9sbGVkIGFueW1vcmUuXG4gIC8vIFRoaXMgYWxsb3dzIHVzIHRvIGhhbmRsZSBjYXNlcyB3aGVyZSB0aGUgc2Nyb2xsIHJlZ2lvbnMgb2YgdHdvIHNjcm9sbGFibGUgZWxlbWVudHMgb3ZlcmxhcC5cbiAgaWYgKGNvbXB1dGVkVmVydGljYWwpIHtcbiAgICBjb25zdCBzY3JvbGxUb3AgPSBlbGVtZW50LnNjcm9sbFRvcDtcblxuICAgIGlmIChjb21wdXRlZFZlcnRpY2FsID09PSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uVVApIHtcbiAgICAgIGlmIChzY3JvbGxUb3AgPiAwKSB7XG4gICAgICAgIHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLlVQO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZWxlbWVudC5zY3JvbGxIZWlnaHQgLSBzY3JvbGxUb3AgPiBlbGVtZW50LmNsaWVudEhlaWdodCkge1xuICAgICAgdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uRE9XTjtcbiAgICB9XG4gIH1cblxuICBpZiAoY29tcHV0ZWRIb3Jpem9udGFsKSB7XG4gICAgY29uc3Qgc2Nyb2xsTGVmdCA9IGVsZW1lbnQuc2Nyb2xsTGVmdDtcblxuICAgIGlmIChjb21wdXRlZEhvcml6b250YWwgPT09IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLkxFRlQpIHtcbiAgICAgIGlmIChzY3JvbGxMZWZ0ID4gMCkge1xuICAgICAgICBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTEVGVDtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGVsZW1lbnQuc2Nyb2xsV2lkdGggLSBzY3JvbGxMZWZ0ID4gZWxlbWVudC5jbGllbnRXaWR0aCkge1xuICAgICAgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLlJJR0hUO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBbdmVydGljYWxTY3JvbGxEaXJlY3Rpb24sIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb25dO1xufVxuIl19