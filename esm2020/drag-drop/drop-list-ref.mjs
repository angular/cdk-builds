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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LXJlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2Ryb3AtbGlzdC1yZWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBSUgsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRXBELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsT0FBTyxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsdUJBQXVCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDOUUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFHN0MsT0FBTyxFQUNMLHVCQUF1QixFQUN2QixnQkFBZ0IsRUFDaEIsb0JBQW9CLEVBQ3BCLGtCQUFrQixHQUNuQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUNoRSxPQUFPLEVBQUMsaUJBQWlCLEVBQTBCLE1BQU0sZ0JBQWdCLENBQUM7QUFFMUU7OztHQUdHO0FBQ0gsTUFBTSx3QkFBd0IsR0FBRyxJQUFJLENBQUM7QUFFdEM7OztHQUdHO0FBQ0gsTUFBTSwwQkFBMEIsR0FBRyxJQUFJLENBQUM7QUE2Q3hDOztHQUVHO0FBQ0gsTUFBTSxPQUFPLFdBQVc7SUF3SXRCLFlBQ0UsT0FBOEMsRUFDdEMsaUJBQXlELEVBQ2pFLFNBQWMsRUFDTixPQUFlLEVBQ2YsY0FBNkI7UUFIN0Isc0JBQWlCLEdBQWpCLGlCQUFpQixDQUF3QztRQUV6RCxZQUFPLEdBQVAsT0FBTyxDQUFRO1FBQ2YsbUJBQWMsR0FBZCxjQUFjLENBQWU7UUF6SXZDLDRFQUE0RTtRQUM1RSxhQUFRLEdBQVksS0FBSyxDQUFDO1FBRTFCLHlEQUF5RDtR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S0FDRjtJQUVELElBQUksa0JBQWtCLEVBQUU7UUFDdEIsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQztRQUV0QyxJQUFJLGtCQUFrQixpQkFBdUMsRUFBRTtZQUM3RCxJQUFJLFVBQVUsR0FBRyxDQUFDLEVBQUU7Z0JBQ2xCLHlCQUF5QixlQUFxQyxDQUFDO2FBQ2hFO1NBQ0Y7YUFBTSxJQUFJLE9BQU8sQ0FBQyxXQUFXLEdBQUcsVUFBVSxHQUFHLE9BQU8sQ0FBQyxXQUFXLEVBQUU7WUFDakUseUJBQXlCLGdCQUFzQyxDQUFDO1NBQ2pFO0tBQ0Y7SUFFRCxPQUFPLENBQUMsdUJBQXVCLEVBQUUseUJBQXlCLENBQUMsQ0FBQztBQUM5RCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RWxlbWVudFJlZiwgTmdab25lfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7RGlyZWN0aW9ufSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge2NvZXJjZUVsZW1lbnR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge1ZpZXdwb3J0UnVsZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9zY3JvbGxpbmcnO1xuaW1wb3J0IHtfZ2V0U2hhZG93Um9vdH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7U3ViamVjdCwgU3Vic2NyaXB0aW9uLCBpbnRlcnZhbCwgYW5pbWF0aW9uRnJhbWVTY2hlZHVsZXJ9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHt0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7bW92ZUl0ZW1JbkFycmF5fSBmcm9tICcuL2RyYWctdXRpbHMnO1xuaW1wb3J0IHtEcmFnRHJvcFJlZ2lzdHJ5fSBmcm9tICcuL2RyYWctZHJvcC1yZWdpc3RyeSc7XG5pbXBvcnQge0RyYWdSZWZJbnRlcm5hbCBhcyBEcmFnUmVmLCBQb2ludH0gZnJvbSAnLi9kcmFnLXJlZic7XG5pbXBvcnQge1xuICBpc1BvaW50ZXJOZWFyQ2xpZW50UmVjdCxcbiAgYWRqdXN0Q2xpZW50UmVjdCxcbiAgZ2V0TXV0YWJsZUNsaWVudFJlY3QsXG4gIGlzSW5zaWRlQ2xpZW50UmVjdCxcbn0gZnJvbSAnLi9jbGllbnQtcmVjdCc7XG5pbXBvcnQge1BhcmVudFBvc2l0aW9uVHJhY2tlcn0gZnJvbSAnLi9wYXJlbnQtcG9zaXRpb24tdHJhY2tlcic7XG5pbXBvcnQge2NvbWJpbmVUcmFuc2Zvcm1zLCBEcmFnQ1NTU3R5bGVEZWNsYXJhdGlvbn0gZnJvbSAnLi9kcmFnLXN0eWxpbmcnO1xuXG4vKipcbiAqIFByb3hpbWl0eSwgYXMgYSByYXRpbyB0byB3aWR0aC9oZWlnaHQsIGF0IHdoaWNoIGFcbiAqIGRyYWdnZWQgaXRlbSB3aWxsIGFmZmVjdCB0aGUgZHJvcCBjb250YWluZXIuXG4gKi9cbmNvbnN0IERST1BfUFJPWElNSVRZX1RIUkVTSE9MRCA9IDAuMDU7XG5cbi8qKlxuICogUHJveGltaXR5LCBhcyBhIHJhdGlvIHRvIHdpZHRoL2hlaWdodCBhdCB3aGljaCB0byBzdGFydCBhdXRvLXNjcm9sbGluZyB0aGUgZHJvcCBsaXN0IG9yIHRoZVxuICogdmlld3BvcnQuIFRoZSB2YWx1ZSBjb21lcyBmcm9tIHRyeWluZyBpdCBvdXQgbWFudWFsbHkgdW50aWwgaXQgZmVlbHMgcmlnaHQuXG4gKi9cbmNvbnN0IFNDUk9MTF9QUk9YSU1JVFlfVEhSRVNIT0xEID0gMC4wNTtcblxuLyoqXG4gKiBFbnRyeSBpbiB0aGUgcG9zaXRpb24gY2FjaGUgZm9yIGRyYWdnYWJsZSBpdGVtcy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuaW50ZXJmYWNlIENhY2hlZEl0ZW1Qb3NpdGlvbiB7XG4gIC8qKiBJbnN0YW5jZSBvZiB0aGUgZHJhZyBpdGVtLiAqL1xuICBkcmFnOiBEcmFnUmVmO1xuICAvKiogRGltZW5zaW9ucyBvZiB0aGUgaXRlbS4gKi9cbiAgY2xpZW50UmVjdDogQ2xpZW50UmVjdDtcbiAgLyoqIEFtb3VudCBieSB3aGljaCB0aGUgaXRlbSBoYXMgYmVlbiBtb3ZlZCBzaW5jZSBkcmFnZ2luZyBzdGFydGVkLiAqL1xuICBvZmZzZXQ6IG51bWJlcjtcbiAgLyoqIElubGluZSB0cmFuc2Zvcm0gdGhhdCB0aGUgZHJhZyBpdGVtIGhhZCB3aGVuIGRyYWdnaW5nIHN0YXJ0ZWQuICovXG4gIGluaXRpYWxUcmFuc2Zvcm06IHN0cmluZztcbn1cblxuLyoqIFZlcnRpY2FsIGRpcmVjdGlvbiBpbiB3aGljaCB3ZSBjYW4gYXV0by1zY3JvbGwuICovXG5jb25zdCBlbnVtIEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbiB7XG4gIE5PTkUsXG4gIFVQLFxuICBET1dOLFxufVxuXG4vKiogSG9yaXpvbnRhbCBkaXJlY3Rpb24gaW4gd2hpY2ggd2UgY2FuIGF1dG8tc2Nyb2xsLiAqL1xuY29uc3QgZW51bSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbiB7XG4gIE5PTkUsXG4gIExFRlQsXG4gIFJJR0hULFxufVxuXG4vKipcbiAqIEludGVybmFsIGNvbXBpbGUtdGltZS1vbmx5IHJlcHJlc2VudGF0aW9uIG9mIGEgYERyb3BMaXN0UmVmYC5cbiAqIFVzZWQgdG8gYXZvaWQgY2lyY3VsYXIgaW1wb3J0IGlzc3VlcyBiZXR3ZWVuIHRoZSBgRHJvcExpc3RSZWZgIGFuZCB0aGUgYERyYWdSZWZgLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIERyb3BMaXN0UmVmSW50ZXJuYWwgZXh0ZW5kcyBEcm9wTGlzdFJlZiB7fVxuXG50eXBlIFJvb3ROb2RlID0gRG9jdW1lbnRPclNoYWRvd1Jvb3QgJiB7XG4gIC8vIEFzIG9mIFRTIDQuNCB0aGUgYnVpbHQgaW4gRE9NIHR5cGluZ3MgZG9uJ3QgaW5jbHVkZSBgZWxlbWVudEZyb21Qb2ludGAgb24gYFNoYWRvd1Jvb3RgLFxuICAvLyBldmVuIHRob3VnaCBpdCBleGlzdHMgKHNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvU2hhZG93Um9vdCkuXG4gIC8vIFRoaXMgdHlwZSBpcyBhIHV0aWxpdHkgdG8gYXZvaWQgaGF2aW5nIHRvIGFkZCBjYXN0cyBldmVyeXdoZXJlLlxuICBlbGVtZW50RnJvbVBvaW50KHg6IG51bWJlciwgeTogbnVtYmVyKTogRWxlbWVudCB8IG51bGw7XG59O1xuXG4vKipcbiAqIFJlZmVyZW5jZSB0byBhIGRyb3AgbGlzdC4gVXNlZCB0byBtYW5pcHVsYXRlIG9yIGRpc3Bvc2Ugb2YgdGhlIGNvbnRhaW5lci5cbiAqL1xuZXhwb3J0IGNsYXNzIERyb3BMaXN0UmVmPFQgPSBhbnk+IHtcbiAgLyoqIEVsZW1lbnQgdGhhdCB0aGUgZHJvcCBsaXN0IGlzIGF0dGFjaGVkIHRvLiAqL1xuICBlbGVtZW50OiBIVE1MRWxlbWVudCB8IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+O1xuXG4gIC8qKiBXaGV0aGVyIHN0YXJ0aW5nIGEgZHJhZ2dpbmcgc2VxdWVuY2UgZnJvbSB0aGlzIGNvbnRhaW5lciBpcyBkaXNhYmxlZC4gKi9cbiAgZGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogV2hldGhlciBzb3J0aW5nIGl0ZW1zIHdpdGhpbiB0aGUgbGlzdCBpcyBkaXNhYmxlZC4gKi9cbiAgc29ydGluZ0Rpc2FibGVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqIExvY2tzIHRoZSBwb3NpdGlvbiBvZiB0aGUgZHJhZ2dhYmxlIGVsZW1lbnRzIGluc2lkZSB0aGUgY29udGFpbmVyIGFsb25nIHRoZSBzcGVjaWZpZWQgYXhpcy4gKi9cbiAgbG9ja0F4aXM6ICd4JyB8ICd5JztcblxuICAvKipcbiAgICogV2hldGhlciBhdXRvLXNjcm9sbGluZyB0aGUgdmlldyB3aGVuIHRoZSB1c2VyXG4gICAqIG1vdmVzIHRoZWlyIHBvaW50ZXIgY2xvc2UgdG8gdGhlIGVkZ2VzIGlzIGRpc2FibGVkLlxuICAgKi9cbiAgYXV0b1Njcm9sbERpc2FibGVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqIE51bWJlciBvZiBwaXhlbHMgdG8gc2Nyb2xsIGZvciBlYWNoIGZyYW1lIHdoZW4gYXV0by1zY3JvbGxpbmcgYW4gZWxlbWVudC4gKi9cbiAgYXV0b1Njcm9sbFN0ZXA6IG51bWJlciA9IDI7XG5cbiAgLyoqXG4gICAqIEZ1bmN0aW9uIHRoYXQgaXMgdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBhbiBpdGVtXG4gICAqIGlzIGFsbG93ZWQgdG8gYmUgbW92ZWQgaW50byBhIGRyb3AgY29udGFpbmVyLlxuICAgKi9cbiAgZW50ZXJQcmVkaWNhdGU6IChkcmFnOiBEcmFnUmVmLCBkcm9wOiBEcm9wTGlzdFJlZikgPT4gYm9vbGVhbiA9ICgpID0+IHRydWU7XG5cbiAgLyoqIEZ1bmN0aW9ucyB0aGF0IGlzIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYW4gaXRlbSBjYW4gYmUgc29ydGVkIGludG8gYSBwYXJ0aWN1bGFyIGluZGV4LiAqL1xuICBzb3J0UHJlZGljYXRlOiAoaW5kZXg6IG51bWJlciwgZHJhZzogRHJhZ1JlZiwgZHJvcDogRHJvcExpc3RSZWYpID0+IGJvb2xlYW4gPSAoKSA9PiB0cnVlO1xuXG4gIC8qKiBFbWl0cyByaWdodCBiZWZvcmUgZHJhZ2dpbmcgaGFzIHN0YXJ0ZWQuICovXG4gIHJlYWRvbmx5IGJlZm9yZVN0YXJ0ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGhhcyBtb3ZlZCBhIG5ldyBkcmFnIGl0ZW0gaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICovXG4gIHJlYWRvbmx5IGVudGVyZWQgPSBuZXcgU3ViamVjdDx7aXRlbTogRHJhZ1JlZjsgY29udGFpbmVyOiBEcm9wTGlzdFJlZjsgY3VycmVudEluZGV4OiBudW1iZXJ9PigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHJlbW92ZXMgYW4gaXRlbSBmcm9tIHRoZSBjb250YWluZXJcbiAgICogYnkgZHJhZ2dpbmcgaXQgaW50byBhbm90aGVyIGNvbnRhaW5lci5cbiAgICovXG4gIHJlYWRvbmx5IGV4aXRlZCA9IG5ldyBTdWJqZWN0PHtpdGVtOiBEcmFnUmVmOyBjb250YWluZXI6IERyb3BMaXN0UmVmfT4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBkcm9wcyBhbiBpdGVtIGluc2lkZSB0aGUgY29udGFpbmVyLiAqL1xuICByZWFkb25seSBkcm9wcGVkID0gbmV3IFN1YmplY3Q8e1xuICAgIGl0ZW06IERyYWdSZWY7XG4gICAgY3VycmVudEluZGV4OiBudW1iZXI7XG4gICAgcHJldmlvdXNJbmRleDogbnVtYmVyO1xuICAgIGNvbnRhaW5lcjogRHJvcExpc3RSZWY7XG4gICAgcHJldmlvdXNDb250YWluZXI6IERyb3BMaXN0UmVmO1xuICAgIGlzUG9pbnRlck92ZXJDb250YWluZXI6IGJvb2xlYW47XG4gICAgZGlzdGFuY2U6IFBvaW50O1xuICAgIGRyb3BQb2ludDogUG9pbnQ7XG4gIH0+KCk7XG5cbiAgLyoqIEVtaXRzIGFzIHRoZSB1c2VyIGlzIHN3YXBwaW5nIGl0ZW1zIHdoaWxlIGFjdGl2ZWx5IGRyYWdnaW5nLiAqL1xuICByZWFkb25seSBzb3J0ZWQgPSBuZXcgU3ViamVjdDx7XG4gICAgcHJldmlvdXNJbmRleDogbnVtYmVyO1xuICAgIGN1cnJlbnRJbmRleDogbnVtYmVyO1xuICAgIGNvbnRhaW5lcjogRHJvcExpc3RSZWY7XG4gICAgaXRlbTogRHJhZ1JlZjtcbiAgfT4oKTtcblxuICAvKiogQXJiaXRyYXJ5IGRhdGEgdGhhdCBjYW4gYmUgYXR0YWNoZWQgdG8gdGhlIGRyb3AgbGlzdC4gKi9cbiAgZGF0YTogVDtcblxuICAvKiogV2hldGhlciBhbiBpdGVtIGluIHRoZSBsaXN0IGlzIGJlaW5nIGRyYWdnZWQuICovXG4gIHByaXZhdGUgX2lzRHJhZ2dpbmcgPSBmYWxzZTtcblxuICAvKiogQ2FjaGUgb2YgdGhlIGRpbWVuc2lvbnMgb2YgYWxsIHRoZSBpdGVtcyBpbnNpZGUgdGhlIGNvbnRhaW5lci4gKi9cbiAgcHJpdmF0ZSBfaXRlbVBvc2l0aW9uczogQ2FjaGVkSXRlbVBvc2l0aW9uW10gPSBbXTtcblxuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIHBvc2l0aW9ucyBvZiBhbnkgcGFyZW50IHNjcm9sbGFibGUgZWxlbWVudHMuICovXG4gIHByaXZhdGUgX3BhcmVudFBvc2l0aW9uczogUGFyZW50UG9zaXRpb25UcmFja2VyO1xuXG4gIC8qKiBDYWNoZWQgYENsaWVudFJlY3RgIG9mIHRoZSBkcm9wIGxpc3QuICovXG4gIHByaXZhdGUgX2NsaWVudFJlY3Q6IENsaWVudFJlY3QgfCB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIERyYWdnYWJsZSBpdGVtcyB0aGF0IGFyZSBjdXJyZW50bHkgYWN0aXZlIGluc2lkZSB0aGUgY29udGFpbmVyLiBJbmNsdWRlcyB0aGUgaXRlbXNcbiAgICogZnJvbSBgX2RyYWdnYWJsZXNgLCBhcyB3ZWxsIGFzIGFueSBpdGVtcyB0aGF0IGhhdmUgYmVlbiBkcmFnZ2VkIGluLCBidXQgaGF2ZW4ndFxuICAgKiBiZWVuIGRyb3BwZWQgeWV0LlxuICAgKi9cbiAgcHJpdmF0ZSBfYWN0aXZlRHJhZ2dhYmxlczogRHJhZ1JlZltdO1xuXG4gIC8qKlxuICAgKiBLZWVwcyB0cmFjayBvZiB0aGUgaXRlbSB0aGF0IHdhcyBsYXN0IHN3YXBwZWQgd2l0aCB0aGUgZHJhZ2dlZCBpdGVtLCBhcyB3ZWxsIGFzIHdoYXQgZGlyZWN0aW9uXG4gICAqIHRoZSBwb2ludGVyIHdhcyBtb3ZpbmcgaW4gd2hlbiB0aGUgc3dhcCBvY2N1cmVkIGFuZCB3aGV0aGVyIHRoZSB1c2VyJ3MgcG9pbnRlciBjb250aW51ZWQgdG9cbiAgICogb3ZlcmxhcCB3aXRoIHRoZSBzd2FwcGVkIGl0ZW0gYWZ0ZXIgdGhlIHN3YXBwaW5nIG9jY3VycmVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfcHJldmlvdXNTd2FwID0ge2RyYWc6IG51bGwgYXMgRHJhZ1JlZiB8IG51bGwsIGRlbHRhOiAwLCBvdmVybGFwczogZmFsc2V9O1xuXG4gIC8qKiBEcmFnZ2FibGUgaXRlbXMgaW4gdGhlIGNvbnRhaW5lci4gKi9cbiAgcHJpdmF0ZSBfZHJhZ2dhYmxlczogcmVhZG9ubHkgRHJhZ1JlZltdID0gW107XG5cbiAgLyoqIERyb3AgbGlzdHMgdGhhdCBhcmUgY29ubmVjdGVkIHRvIHRoZSBjdXJyZW50IG9uZS4gKi9cbiAgcHJpdmF0ZSBfc2libGluZ3M6IHJlYWRvbmx5IERyb3BMaXN0UmVmW10gPSBbXTtcblxuICAvKiogRGlyZWN0aW9uIGluIHdoaWNoIHRoZSBsaXN0IGlzIG9yaWVudGVkLiAqL1xuICBwcml2YXRlIF9vcmllbnRhdGlvbjogJ2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJyA9ICd2ZXJ0aWNhbCc7XG5cbiAgLyoqIENvbm5lY3RlZCBzaWJsaW5ncyB0aGF0IGN1cnJlbnRseSBoYXZlIGEgZHJhZ2dlZCBpdGVtLiAqL1xuICBwcml2YXRlIF9hY3RpdmVTaWJsaW5ncyA9IG5ldyBTZXQ8RHJvcExpc3RSZWY+KCk7XG5cbiAgLyoqIExheW91dCBkaXJlY3Rpb24gb2YgdGhlIGRyb3AgbGlzdC4gKi9cbiAgcHJpdmF0ZSBfZGlyZWN0aW9uOiBEaXJlY3Rpb24gPSAnbHRyJztcblxuICAvKiogU3Vic2NyaXB0aW9uIHRvIHRoZSB3aW5kb3cgYmVpbmcgc2Nyb2xsZWQuICovXG4gIHByaXZhdGUgX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuXG4gIC8qKiBWZXJ0aWNhbCBkaXJlY3Rpb24gaW4gd2hpY2ggdGhlIGxpc3QgaXMgY3VycmVudGx5IHNjcm9sbGluZy4gKi9cbiAgcHJpdmF0ZSBfdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uTk9ORTtcblxuICAvKiogSG9yaXpvbnRhbCBkaXJlY3Rpb24gaW4gd2hpY2ggdGhlIGxpc3QgaXMgY3VycmVudGx5IHNjcm9sbGluZy4gKi9cbiAgcHJpdmF0ZSBfaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLk5PTkU7XG5cbiAgLyoqIE5vZGUgdGhhdCBpcyBiZWluZyBhdXRvLXNjcm9sbGVkLiAqL1xuICBwcml2YXRlIF9zY3JvbGxOb2RlOiBIVE1MRWxlbWVudCB8IFdpbmRvdztcblxuICAvKiogVXNlZCB0byBzaWduYWwgdG8gdGhlIGN1cnJlbnQgYXV0by1zY3JvbGwgc2VxdWVuY2Ugd2hlbiB0byBzdG9wLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9zdG9wU2Nyb2xsVGltZXJzID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogU2hhZG93IHJvb3Qgb2YgdGhlIGN1cnJlbnQgZWxlbWVudC4gTmVjZXNzYXJ5IGZvciBgZWxlbWVudEZyb21Qb2ludGAgdG8gcmVzb2x2ZSBjb3JyZWN0bHkuICovXG4gIHByaXZhdGUgX2NhY2hlZFNoYWRvd1Jvb3Q6IFJvb3ROb2RlIHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgZG9jdW1lbnQuICovXG4gIHByaXZhdGUgX2RvY3VtZW50OiBEb2N1bWVudDtcblxuICAvKiogRWxlbWVudHMgdGhhdCBjYW4gYmUgc2Nyb2xsZWQgd2hpbGUgdGhlIHVzZXIgaXMgZHJhZ2dpbmcuICovXG4gIHByaXZhdGUgX3Njcm9sbGFibGVFbGVtZW50czogSFRNTEVsZW1lbnRbXTtcblxuICAvKiogSW5pdGlhbCB2YWx1ZSBmb3IgdGhlIGVsZW1lbnQncyBgc2Nyb2xsLXNuYXAtdHlwZWAgc3R5bGUuICovXG4gIHByaXZhdGUgX2luaXRpYWxTY3JvbGxTbmFwOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBIVE1MRWxlbWVudCxcbiAgICBwcml2YXRlIF9kcmFnRHJvcFJlZ2lzdHJ5OiBEcmFnRHJvcFJlZ2lzdHJ5PERyYWdSZWYsIERyb3BMaXN0UmVmPixcbiAgICBfZG9jdW1lbnQ6IGFueSxcbiAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICBwcml2YXRlIF92aWV3cG9ydFJ1bGVyOiBWaWV3cG9ydFJ1bGVyLFxuICApIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnQpO1xuICAgIHRoaXMuX2RvY3VtZW50ID0gX2RvY3VtZW50O1xuICAgIHRoaXMud2l0aFNjcm9sbGFibGVQYXJlbnRzKFt0aGlzLmVsZW1lbnRdKTtcbiAgICBfZHJhZ0Ryb3BSZWdpc3RyeS5yZWdpc3RlckRyb3BDb250YWluZXIodGhpcyk7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zID0gbmV3IFBhcmVudFBvc2l0aW9uVHJhY2tlcihfZG9jdW1lbnQsIF92aWV3cG9ydFJ1bGVyKTtcbiAgfVxuXG4gIC8qKiBSZW1vdmVzIHRoZSBkcm9wIGxpc3QgZnVuY3Rpb25hbGl0eSBmcm9tIHRoZSBET00gZWxlbWVudC4gKi9cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLl9zdG9wU2Nyb2xsaW5nKCk7XG4gICAgdGhpcy5fc3RvcFNjcm9sbFRpbWVycy5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5iZWZvcmVTdGFydGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5lbnRlcmVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5leGl0ZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmRyb3BwZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLnNvcnRlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX2FjdGl2ZVNpYmxpbmdzLmNsZWFyKCk7XG4gICAgdGhpcy5fc2Nyb2xsTm9kZSA9IG51bGwhO1xuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5jbGVhcigpO1xuICAgIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkucmVtb3ZlRHJvcENvbnRhaW5lcih0aGlzKTtcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIGFuIGl0ZW0gZnJvbSB0aGlzIGxpc3QgaXMgY3VycmVudGx5IGJlaW5nIGRyYWdnZWQuICovXG4gIGlzRHJhZ2dpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lzRHJhZ2dpbmc7XG4gIH1cblxuICAvKiogU3RhcnRzIGRyYWdnaW5nIGFuIGl0ZW0uICovXG4gIHN0YXJ0KCk6IHZvaWQge1xuICAgIHRoaXMuX2RyYWdnaW5nU3RhcnRlZCgpO1xuICAgIHRoaXMuX25vdGlmeVJlY2VpdmluZ1NpYmxpbmdzKCk7XG4gIH1cblxuICAvKipcbiAgICogRW1pdHMgYW4gZXZlbnQgdG8gaW5kaWNhdGUgdGhhdCB0aGUgdXNlciBtb3ZlZCBhbiBpdGVtIGludG8gdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB0aGF0IHdhcyBtb3ZlZCBpbnRvIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSBwb2ludGVyWCBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0gcG9pbnRlclkgUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFkgYXhpcy5cbiAgICogQHBhcmFtIGluZGV4IEluZGV4IGF0IHdoaWNoIHRoZSBpdGVtIGVudGVyZWQuIElmIG9taXR0ZWQsIHRoZSBjb250YWluZXIgd2lsbCB0cnkgdG8gZmlndXJlIGl0XG4gICAqICAgb3V0IGF1dG9tYXRpY2FsbHkuXG4gICAqL1xuICBlbnRlcihpdGVtOiBEcmFnUmVmLCBwb2ludGVyWDogbnVtYmVyLCBwb2ludGVyWTogbnVtYmVyLCBpbmRleD86IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMuX2RyYWdnaW5nU3RhcnRlZCgpO1xuXG4gICAgLy8gSWYgc29ydGluZyBpcyBkaXNhYmxlZCwgd2Ugd2FudCB0aGUgaXRlbSB0byByZXR1cm4gdG8gaXRzIHN0YXJ0aW5nXG4gICAgLy8gcG9zaXRpb24gaWYgdGhlIHVzZXIgaXMgcmV0dXJuaW5nIGl0IHRvIGl0cyBpbml0aWFsIGNvbnRhaW5lci5cbiAgICBsZXQgbmV3SW5kZXg6IG51bWJlcjtcblxuICAgIGlmIChpbmRleCA9PSBudWxsKSB7XG4gICAgICBuZXdJbmRleCA9IHRoaXMuc29ydGluZ0Rpc2FibGVkID8gdGhpcy5fZHJhZ2dhYmxlcy5pbmRleE9mKGl0ZW0pIDogLTE7XG5cbiAgICAgIGlmIChuZXdJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgLy8gV2UgdXNlIHRoZSBjb29yZGluYXRlcyBvZiB3aGVyZSB0aGUgaXRlbSBlbnRlcmVkIHRoZSBkcm9wXG4gICAgICAgIC8vIHpvbmUgdG8gZmlndXJlIG91dCBhdCB3aGljaCBpbmRleCBpdCBzaG91bGQgYmUgaW5zZXJ0ZWQuXG4gICAgICAgIG5ld0luZGV4ID0gdGhpcy5fZ2V0SXRlbUluZGV4RnJvbVBvaW50ZXJQb3NpdGlvbihpdGVtLCBwb2ludGVyWCwgcG9pbnRlclkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBuZXdJbmRleCA9IGluZGV4O1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGl2ZURyYWdnYWJsZXMgPSB0aGlzLl9hY3RpdmVEcmFnZ2FibGVzO1xuICAgIGNvbnN0IGN1cnJlbnRJbmRleCA9IGFjdGl2ZURyYWdnYWJsZXMuaW5kZXhPZihpdGVtKTtcbiAgICBjb25zdCBwbGFjZWhvbGRlciA9IGl0ZW0uZ2V0UGxhY2Vob2xkZXJFbGVtZW50KCk7XG4gICAgbGV0IG5ld1Bvc2l0aW9uUmVmZXJlbmNlOiBEcmFnUmVmIHwgdW5kZWZpbmVkID0gYWN0aXZlRHJhZ2dhYmxlc1tuZXdJbmRleF07XG5cbiAgICAvLyBJZiB0aGUgaXRlbSBhdCB0aGUgbmV3IHBvc2l0aW9uIGlzIHRoZSBzYW1lIGFzIHRoZSBpdGVtIHRoYXQgaXMgYmVpbmcgZHJhZ2dlZCxcbiAgICAvLyBpdCBtZWFucyB0aGF0IHdlJ3JlIHRyeWluZyB0byByZXN0b3JlIHRoZSBpdGVtIHRvIGl0cyBpbml0aWFsIHBvc2l0aW9uLiBJbiB0aGlzXG4gICAgLy8gY2FzZSB3ZSBzaG91bGQgdXNlIHRoZSBuZXh0IGl0ZW0gZnJvbSB0aGUgbGlzdCBhcyB0aGUgcmVmZXJlbmNlLlxuICAgIGlmIChuZXdQb3NpdGlvblJlZmVyZW5jZSA9PT0gaXRlbSkge1xuICAgICAgbmV3UG9zaXRpb25SZWZlcmVuY2UgPSBhY3RpdmVEcmFnZ2FibGVzW25ld0luZGV4ICsgMV07XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgZGlkbid0IGZpbmQgYSBuZXcgcG9zaXRpb24gcmVmZXJlbmNlLCBpdCBtZWFucyB0aGF0IGVpdGhlciB0aGUgaXRlbSBkaWRuJ3Qgc3RhcnQgb2ZmXG4gICAgLy8gaW4gdGhpcyBjb250YWluZXIsIG9yIHRoYXQgdGhlIGl0ZW0gcmVxdWVzdGVkIHRvIGJlIGluc2VydGVkIGF0IHRoZSBlbmQgb2YgdGhlIGxpc3QuXG4gICAgaWYgKFxuICAgICAgIW5ld1Bvc2l0aW9uUmVmZXJlbmNlICYmXG4gICAgICAobmV3SW5kZXggPT0gbnVsbCB8fCBuZXdJbmRleCA9PT0gLTEgfHwgbmV3SW5kZXggPCBhY3RpdmVEcmFnZ2FibGVzLmxlbmd0aCAtIDEpICYmXG4gICAgICB0aGlzLl9zaG91bGRFbnRlckFzRmlyc3RDaGlsZChwb2ludGVyWCwgcG9pbnRlclkpXG4gICAgKSB7XG4gICAgICBuZXdQb3NpdGlvblJlZmVyZW5jZSA9IGFjdGl2ZURyYWdnYWJsZXNbMF07XG4gICAgfVxuXG4gICAgLy8gU2luY2UgdGhlIGl0ZW0gbWF5IGJlIGluIHRoZSBgYWN0aXZlRHJhZ2dhYmxlc2AgYWxyZWFkeSAoZS5nLiBpZiB0aGUgdXNlciBkcmFnZ2VkIGl0XG4gICAgLy8gaW50byBhbm90aGVyIGNvbnRhaW5lciBhbmQgYmFjayBhZ2FpbiksIHdlIGhhdmUgdG8gZW5zdXJlIHRoYXQgaXQgaXNuJ3QgZHVwbGljYXRlZC5cbiAgICBpZiAoY3VycmVudEluZGV4ID4gLTEpIHtcbiAgICAgIGFjdGl2ZURyYWdnYWJsZXMuc3BsaWNlKGN1cnJlbnRJbmRleCwgMSk7XG4gICAgfVxuXG4gICAgLy8gRG9uJ3QgdXNlIGl0ZW1zIHRoYXQgYXJlIGJlaW5nIGRyYWdnZWQgYXMgYSByZWZlcmVuY2UsIGJlY2F1c2VcbiAgICAvLyB0aGVpciBlbGVtZW50IGhhcyBiZWVuIG1vdmVkIGRvd24gdG8gdGhlIGJvdHRvbSBvZiB0aGUgYm9keS5cbiAgICBpZiAobmV3UG9zaXRpb25SZWZlcmVuY2UgJiYgIXRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuaXNEcmFnZ2luZyhuZXdQb3NpdGlvblJlZmVyZW5jZSkpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBuZXdQb3NpdGlvblJlZmVyZW5jZS5nZXRSb290RWxlbWVudCgpO1xuICAgICAgZWxlbWVudC5wYXJlbnRFbGVtZW50IS5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXIsIGVsZW1lbnQpO1xuICAgICAgYWN0aXZlRHJhZ2dhYmxlcy5zcGxpY2UobmV3SW5kZXgsIDAsIGl0ZW0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb2VyY2VFbGVtZW50KHRoaXMuZWxlbWVudCkuYXBwZW5kQ2hpbGQocGxhY2Vob2xkZXIpO1xuICAgICAgYWN0aXZlRHJhZ2dhYmxlcy5wdXNoKGl0ZW0pO1xuICAgIH1cblxuICAgIC8vIFRoZSB0cmFuc2Zvcm0gbmVlZHMgdG8gYmUgY2xlYXJlZCBzbyBpdCBkb2Vzbid0IHRocm93IG9mZiB0aGUgbWVhc3VyZW1lbnRzLlxuICAgIHBsYWNlaG9sZGVyLnN0eWxlLnRyYW5zZm9ybSA9ICcnO1xuXG4gICAgLy8gTm90ZSB0aGF0IHRoZSBwb3NpdGlvbnMgd2VyZSBhbHJlYWR5IGNhY2hlZCB3aGVuIHdlIGNhbGxlZCBgc3RhcnRgIGFib3ZlLFxuICAgIC8vIGJ1dCB3ZSBuZWVkIHRvIHJlZnJlc2ggdGhlbSBzaW5jZSB0aGUgYW1vdW50IG9mIGl0ZW1zIGhhcyBjaGFuZ2VkIGFuZCBhbHNvIHBhcmVudCByZWN0cy5cbiAgICB0aGlzLl9jYWNoZUl0ZW1Qb3NpdGlvbnMoKTtcbiAgICB0aGlzLl9jYWNoZVBhcmVudFBvc2l0aW9ucygpO1xuXG4gICAgLy8gTm90aWZ5IHNpYmxpbmdzIGF0IHRoZSBlbmQgc28gdGhhdCB0aGUgaXRlbSBoYXMgYmVlbiBpbnNlcnRlZCBpbnRvIHRoZSBgYWN0aXZlRHJhZ2dhYmxlc2AuXG4gICAgdGhpcy5fbm90aWZ5UmVjZWl2aW5nU2libGluZ3MoKTtcbiAgICB0aGlzLmVudGVyZWQubmV4dCh7aXRlbSwgY29udGFpbmVyOiB0aGlzLCBjdXJyZW50SW5kZXg6IHRoaXMuZ2V0SXRlbUluZGV4KGl0ZW0pfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhbiBpdGVtIGZyb20gdGhlIGNvbnRhaW5lciBhZnRlciBpdCB3YXMgZHJhZ2dlZCBpbnRvIGFub3RoZXIgY29udGFpbmVyIGJ5IHRoZSB1c2VyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRoYXQgd2FzIGRyYWdnZWQgb3V0LlxuICAgKi9cbiAgZXhpdChpdGVtOiBEcmFnUmVmKTogdm9pZCB7XG4gICAgdGhpcy5fcmVzZXQoKTtcbiAgICB0aGlzLmV4aXRlZC5uZXh0KHtpdGVtLCBjb250YWluZXI6IHRoaXN9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEcm9wcyBhbiBpdGVtIGludG8gdGhpcyBjb250YWluZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gYmVpbmcgZHJvcHBlZCBpbnRvIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSBjdXJyZW50SW5kZXggSW5kZXggYXQgd2hpY2ggdGhlIGl0ZW0gc2hvdWxkIGJlIGluc2VydGVkLlxuICAgKiBAcGFyYW0gcHJldmlvdXNJbmRleCBJbmRleCBvZiB0aGUgaXRlbSB3aGVuIGRyYWdnaW5nIHN0YXJ0ZWQuXG4gICAqIEBwYXJhbSBwcmV2aW91c0NvbnRhaW5lciBDb250YWluZXIgZnJvbSB3aGljaCB0aGUgaXRlbSBnb3QgZHJhZ2dlZCBpbi5cbiAgICogQHBhcmFtIGlzUG9pbnRlck92ZXJDb250YWluZXIgV2hldGhlciB0aGUgdXNlcidzIHBvaW50ZXIgd2FzIG92ZXIgdGhlXG4gICAqICAgIGNvbnRhaW5lciB3aGVuIHRoZSBpdGVtIHdhcyBkcm9wcGVkLlxuICAgKiBAcGFyYW0gZGlzdGFuY2UgRGlzdGFuY2UgdGhlIHVzZXIgaGFzIGRyYWdnZWQgc2luY2UgdGhlIHN0YXJ0IG9mIHRoZSBkcmFnZ2luZyBzZXF1ZW5jZS5cbiAgICovXG4gIGRyb3AoXG4gICAgaXRlbTogRHJhZ1JlZixcbiAgICBjdXJyZW50SW5kZXg6IG51bWJlcixcbiAgICBwcmV2aW91c0luZGV4OiBudW1iZXIsXG4gICAgcHJldmlvdXNDb250YWluZXI6IERyb3BMaXN0UmVmLFxuICAgIGlzUG9pbnRlck92ZXJDb250YWluZXI6IGJvb2xlYW4sXG4gICAgZGlzdGFuY2U6IFBvaW50LFxuICAgIGRyb3BQb2ludDogUG9pbnQsXG4gICk6IHZvaWQge1xuICAgIHRoaXMuX3Jlc2V0KCk7XG4gICAgdGhpcy5kcm9wcGVkLm5leHQoe1xuICAgICAgaXRlbSxcbiAgICAgIGN1cnJlbnRJbmRleCxcbiAgICAgIHByZXZpb3VzSW5kZXgsXG4gICAgICBjb250YWluZXI6IHRoaXMsXG4gICAgICBwcmV2aW91c0NvbnRhaW5lcixcbiAgICAgIGlzUG9pbnRlck92ZXJDb250YWluZXIsXG4gICAgICBkaXN0YW5jZSxcbiAgICAgIGRyb3BQb2ludCxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBkcmFnZ2FibGUgaXRlbXMgdGhhdCBhcmUgYSBwYXJ0IG9mIHRoaXMgbGlzdC5cbiAgICogQHBhcmFtIGl0ZW1zIEl0ZW1zIHRoYXQgYXJlIGEgcGFydCBvZiB0aGlzIGxpc3QuXG4gICAqL1xuICB3aXRoSXRlbXMoaXRlbXM6IERyYWdSZWZbXSk6IHRoaXMge1xuICAgIGNvbnN0IHByZXZpb3VzSXRlbXMgPSB0aGlzLl9kcmFnZ2FibGVzO1xuICAgIHRoaXMuX2RyYWdnYWJsZXMgPSBpdGVtcztcbiAgICBpdGVtcy5mb3JFYWNoKGl0ZW0gPT4gaXRlbS5fd2l0aERyb3BDb250YWluZXIodGhpcykpO1xuXG4gICAgaWYgKHRoaXMuaXNEcmFnZ2luZygpKSB7XG4gICAgICBjb25zdCBkcmFnZ2VkSXRlbXMgPSBwcmV2aW91c0l0ZW1zLmZpbHRlcihpdGVtID0+IGl0ZW0uaXNEcmFnZ2luZygpKTtcblxuICAgICAgLy8gSWYgYWxsIG9mIHRoZSBpdGVtcyBiZWluZyBkcmFnZ2VkIHdlcmUgcmVtb3ZlZFxuICAgICAgLy8gZnJvbSB0aGUgbGlzdCwgYWJvcnQgdGhlIGN1cnJlbnQgZHJhZyBzZXF1ZW5jZS5cbiAgICAgIGlmIChkcmFnZ2VkSXRlbXMuZXZlcnkoaXRlbSA9PiBpdGVtcy5pbmRleE9mKGl0ZW0pID09PSAtMSkpIHtcbiAgICAgICAgdGhpcy5fcmVzZXQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2NhY2hlSXRlbXMoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBsYXlvdXQgZGlyZWN0aW9uIG9mIHRoZSBkcm9wIGxpc3QuICovXG4gIHdpdGhEaXJlY3Rpb24oZGlyZWN0aW9uOiBEaXJlY3Rpb24pOiB0aGlzIHtcbiAgICB0aGlzLl9kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY29udGFpbmVycyB0aGF0IGFyZSBjb25uZWN0ZWQgdG8gdGhpcyBvbmUuIFdoZW4gdHdvIG9yIG1vcmUgY29udGFpbmVycyBhcmVcbiAgICogY29ubmVjdGVkLCB0aGUgdXNlciB3aWxsIGJlIGFsbG93ZWQgdG8gdHJhbnNmZXIgaXRlbXMgYmV0d2VlbiB0aGVtLlxuICAgKiBAcGFyYW0gY29ubmVjdGVkVG8gT3RoZXIgY29udGFpbmVycyB0aGF0IHRoZSBjdXJyZW50IGNvbnRhaW5lcnMgc2hvdWxkIGJlIGNvbm5lY3RlZCB0by5cbiAgICovXG4gIGNvbm5lY3RlZFRvKGNvbm5lY3RlZFRvOiBEcm9wTGlzdFJlZltdKTogdGhpcyB7XG4gICAgdGhpcy5fc2libGluZ3MgPSBjb25uZWN0ZWRUby5zbGljZSgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG9yaWVudGF0aW9uIG9mIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSBvcmllbnRhdGlvbiBOZXcgb3JpZW50YXRpb24gZm9yIHRoZSBjb250YWluZXIuXG4gICAqL1xuICB3aXRoT3JpZW50YXRpb24ob3JpZW50YXRpb246ICd2ZXJ0aWNhbCcgfCAnaG9yaXpvbnRhbCcpOiB0aGlzIHtcbiAgICB0aGlzLl9vcmllbnRhdGlvbiA9IG9yaWVudGF0aW9uO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgd2hpY2ggcGFyZW50IGVsZW1lbnRzIGFyZSBjYW4gYmUgc2Nyb2xsZWQgd2hpbGUgdGhlIHVzZXIgaXMgZHJhZ2dpbmcuXG4gICAqIEBwYXJhbSBlbGVtZW50cyBFbGVtZW50cyB0aGF0IGNhbiBiZSBzY3JvbGxlZC5cbiAgICovXG4gIHdpdGhTY3JvbGxhYmxlUGFyZW50cyhlbGVtZW50czogSFRNTEVsZW1lbnRbXSk6IHRoaXMge1xuICAgIGNvbnN0IGVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KHRoaXMuZWxlbWVudCk7XG5cbiAgICAvLyBXZSBhbHdheXMgYWxsb3cgdGhlIGN1cnJlbnQgZWxlbWVudCB0byBiZSBzY3JvbGxhYmxlXG4gICAgLy8gc28gd2UgbmVlZCB0byBlbnN1cmUgdGhhdCBpdCdzIGluIHRoZSBhcnJheS5cbiAgICB0aGlzLl9zY3JvbGxhYmxlRWxlbWVudHMgPVxuICAgICAgZWxlbWVudHMuaW5kZXhPZihlbGVtZW50KSA9PT0gLTEgPyBbZWxlbWVudCwgLi4uZWxlbWVudHNdIDogZWxlbWVudHMuc2xpY2UoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBzY3JvbGxhYmxlIHBhcmVudHMgdGhhdCBhcmUgcmVnaXN0ZXJlZCB3aXRoIHRoaXMgZHJvcCBjb250YWluZXIuICovXG4gIGdldFNjcm9sbGFibGVQYXJlbnRzKCk6IHJlYWRvbmx5IEhUTUxFbGVtZW50W10ge1xuICAgIHJldHVybiB0aGlzLl9zY3JvbGxhYmxlRWxlbWVudHM7XG4gIH1cblxuICAvKipcbiAgICogRmlndXJlcyBvdXQgdGhlIGluZGV4IG9mIGFuIGl0ZW0gaW4gdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB3aG9zZSBpbmRleCBzaG91bGQgYmUgZGV0ZXJtaW5lZC5cbiAgICovXG4gIGdldEl0ZW1JbmRleChpdGVtOiBEcmFnUmVmKTogbnVtYmVyIHtcbiAgICBpZiAoIXRoaXMuX2lzRHJhZ2dpbmcpIHtcbiAgICAgIHJldHVybiB0aGlzLl9kcmFnZ2FibGVzLmluZGV4T2YoaXRlbSk7XG4gICAgfVxuXG4gICAgLy8gSXRlbXMgYXJlIHNvcnRlZCBhbHdheXMgYnkgdG9wL2xlZnQgaW4gdGhlIGNhY2hlLCBob3dldmVyIHRoZXkgZmxvdyBkaWZmZXJlbnRseSBpbiBSVEwuXG4gICAgLy8gVGhlIHJlc3Qgb2YgdGhlIGxvZ2ljIHN0aWxsIHN0YW5kcyBubyBtYXR0ZXIgd2hhdCBvcmllbnRhdGlvbiB3ZSdyZSBpbiwgaG93ZXZlclxuICAgIC8vIHdlIG5lZWQgdG8gaW52ZXJ0IHRoZSBhcnJheSB3aGVuIGRldGVybWluaW5nIHRoZSBpbmRleC5cbiAgICBjb25zdCBpdGVtcyA9XG4gICAgICB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnICYmIHRoaXMuX2RpcmVjdGlvbiA9PT0gJ3J0bCdcbiAgICAgICAgPyB0aGlzLl9pdGVtUG9zaXRpb25zLnNsaWNlKCkucmV2ZXJzZSgpXG4gICAgICAgIDogdGhpcy5faXRlbVBvc2l0aW9ucztcblxuICAgIHJldHVybiBpdGVtcy5maW5kSW5kZXgoY3VycmVudEl0ZW0gPT4gY3VycmVudEl0ZW0uZHJhZyA9PT0gaXRlbSk7XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0aGUgbGlzdCBpcyBhYmxlIHRvIHJlY2VpdmUgdGhlIGl0ZW0gdGhhdFxuICAgKiBpcyBjdXJyZW50bHkgYmVpbmcgZHJhZ2dlZCBpbnNpZGUgYSBjb25uZWN0ZWQgZHJvcCBsaXN0LlxuICAgKi9cbiAgaXNSZWNlaXZpbmcoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2FjdGl2ZVNpYmxpbmdzLnNpemUgPiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIFNvcnRzIGFuIGl0ZW0gaW5zaWRlIHRoZSBjb250YWluZXIgYmFzZWQgb24gaXRzIHBvc2l0aW9uLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRvIGJlIHNvcnRlZC5cbiAgICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKiBAcGFyYW0gcG9pbnRlckRlbHRhIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgcG9pbnRlciBpcyBtb3ZpbmcgYWxvbmcgZWFjaCBheGlzLlxuICAgKi9cbiAgX3NvcnRJdGVtKFxuICAgIGl0ZW06IERyYWdSZWYsXG4gICAgcG9pbnRlclg6IG51bWJlcixcbiAgICBwb2ludGVyWTogbnVtYmVyLFxuICAgIHBvaW50ZXJEZWx0YToge3g6IG51bWJlcjsgeTogbnVtYmVyfSxcbiAgKTogdm9pZCB7XG4gICAgLy8gRG9uJ3Qgc29ydCB0aGUgaXRlbSBpZiBzb3J0aW5nIGlzIGRpc2FibGVkIG9yIGl0J3Mgb3V0IG9mIHJhbmdlLlxuICAgIGlmIChcbiAgICAgIHRoaXMuc29ydGluZ0Rpc2FibGVkIHx8XG4gICAgICAhdGhpcy5fY2xpZW50UmVjdCB8fFxuICAgICAgIWlzUG9pbnRlck5lYXJDbGllbnRSZWN0KHRoaXMuX2NsaWVudFJlY3QsIERST1BfUFJPWElNSVRZX1RIUkVTSE9MRCwgcG9pbnRlclgsIHBvaW50ZXJZKVxuICAgICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNpYmxpbmdzID0gdGhpcy5faXRlbVBvc2l0aW9ucztcbiAgICBjb25zdCBuZXdJbmRleCA9IHRoaXMuX2dldEl0ZW1JbmRleEZyb21Qb2ludGVyUG9zaXRpb24oaXRlbSwgcG9pbnRlclgsIHBvaW50ZXJZLCBwb2ludGVyRGVsdGEpO1xuXG4gICAgaWYgKG5ld0luZGV4ID09PSAtMSAmJiBzaWJsaW5ncy5sZW5ndGggPiAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gdGhpcy5fb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJztcbiAgICBjb25zdCBjdXJyZW50SW5kZXggPSBzaWJsaW5ncy5maW5kSW5kZXgoY3VycmVudEl0ZW0gPT4gY3VycmVudEl0ZW0uZHJhZyA9PT0gaXRlbSk7XG4gICAgY29uc3Qgc2libGluZ0F0TmV3UG9zaXRpb24gPSBzaWJsaW5nc1tuZXdJbmRleF07XG4gICAgY29uc3QgY3VycmVudFBvc2l0aW9uID0gc2libGluZ3NbY3VycmVudEluZGV4XS5jbGllbnRSZWN0O1xuICAgIGNvbnN0IG5ld1Bvc2l0aW9uID0gc2libGluZ0F0TmV3UG9zaXRpb24uY2xpZW50UmVjdDtcbiAgICBjb25zdCBkZWx0YSA9IGN1cnJlbnRJbmRleCA+IG5ld0luZGV4ID8gMSA6IC0xO1xuXG4gICAgLy8gSG93IG1hbnkgcGl4ZWxzIHRoZSBpdGVtJ3MgcGxhY2Vob2xkZXIgc2hvdWxkIGJlIG9mZnNldC5cbiAgICBjb25zdCBpdGVtT2Zmc2V0ID0gdGhpcy5fZ2V0SXRlbU9mZnNldFB4KGN1cnJlbnRQb3NpdGlvbiwgbmV3UG9zaXRpb24sIGRlbHRhKTtcblxuICAgIC8vIEhvdyBtYW55IHBpeGVscyBhbGwgdGhlIG90aGVyIGl0ZW1zIHNob3VsZCBiZSBvZmZzZXQuXG4gICAgY29uc3Qgc2libGluZ09mZnNldCA9IHRoaXMuX2dldFNpYmxpbmdPZmZzZXRQeChjdXJyZW50SW5kZXgsIHNpYmxpbmdzLCBkZWx0YSk7XG5cbiAgICAvLyBTYXZlIHRoZSBwcmV2aW91cyBvcmRlciBvZiB0aGUgaXRlbXMgYmVmb3JlIG1vdmluZyB0aGUgaXRlbSB0byBpdHMgbmV3IGluZGV4LlxuICAgIC8vIFdlIHVzZSB0aGlzIHRvIGNoZWNrIHdoZXRoZXIgYW4gaXRlbSBoYXMgYmVlbiBtb3ZlZCBhcyBhIHJlc3VsdCBvZiB0aGUgc29ydGluZy5cbiAgICBjb25zdCBvbGRPcmRlciA9IHNpYmxpbmdzLnNsaWNlKCk7XG5cbiAgICAvLyBTaHVmZmxlIHRoZSBhcnJheSBpbiBwbGFjZS5cbiAgICBtb3ZlSXRlbUluQXJyYXkoc2libGluZ3MsIGN1cnJlbnRJbmRleCwgbmV3SW5kZXgpO1xuXG4gICAgdGhpcy5zb3J0ZWQubmV4dCh7XG4gICAgICBwcmV2aW91c0luZGV4OiBjdXJyZW50SW5kZXgsXG4gICAgICBjdXJyZW50SW5kZXg6IG5ld0luZGV4LFxuICAgICAgY29udGFpbmVyOiB0aGlzLFxuICAgICAgaXRlbSxcbiAgICB9KTtcblxuICAgIHNpYmxpbmdzLmZvckVhY2goKHNpYmxpbmcsIGluZGV4KSA9PiB7XG4gICAgICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiB0aGUgcG9zaXRpb24gaGFzbid0IGNoYW5nZWQuXG4gICAgICBpZiAob2xkT3JkZXJbaW5kZXhdID09PSBzaWJsaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgaXNEcmFnZ2VkSXRlbSA9IHNpYmxpbmcuZHJhZyA9PT0gaXRlbTtcbiAgICAgIGNvbnN0IG9mZnNldCA9IGlzRHJhZ2dlZEl0ZW0gPyBpdGVtT2Zmc2V0IDogc2libGluZ09mZnNldDtcbiAgICAgIGNvbnN0IGVsZW1lbnRUb09mZnNldCA9IGlzRHJhZ2dlZEl0ZW1cbiAgICAgICAgPyBpdGVtLmdldFBsYWNlaG9sZGVyRWxlbWVudCgpXG4gICAgICAgIDogc2libGluZy5kcmFnLmdldFJvb3RFbGVtZW50KCk7XG5cbiAgICAgIC8vIFVwZGF0ZSB0aGUgb2Zmc2V0IHRvIHJlZmxlY3QgdGhlIG5ldyBwb3NpdGlvbi5cbiAgICAgIHNpYmxpbmcub2Zmc2V0ICs9IG9mZnNldDtcblxuICAgICAgLy8gU2luY2Ugd2UncmUgbW92aW5nIHRoZSBpdGVtcyB3aXRoIGEgYHRyYW5zZm9ybWAsIHdlIG5lZWQgdG8gYWRqdXN0IHRoZWlyIGNhY2hlZFxuICAgICAgLy8gY2xpZW50IHJlY3RzIHRvIHJlZmxlY3QgdGhlaXIgbmV3IHBvc2l0aW9uLCBhcyB3ZWxsIGFzIHN3YXAgdGhlaXIgcG9zaXRpb25zIGluIHRoZSBjYWNoZS5cbiAgICAgIC8vIE5vdGUgdGhhdCB3ZSBzaG91bGRuJ3QgdXNlIGBnZXRCb3VuZGluZ0NsaWVudFJlY3RgIGhlcmUgdG8gdXBkYXRlIHRoZSBjYWNoZSwgYmVjYXVzZSB0aGVcbiAgICAgIC8vIGVsZW1lbnRzIG1heSBiZSBtaWQtYW5pbWF0aW9uIHdoaWNoIHdpbGwgZ2l2ZSB1cyBhIHdyb25nIHJlc3VsdC5cbiAgICAgIGlmIChpc0hvcml6b250YWwpIHtcbiAgICAgICAgLy8gUm91bmQgdGhlIHRyYW5zZm9ybXMgc2luY2Ugc29tZSBicm93c2VycyB3aWxsXG4gICAgICAgIC8vIGJsdXIgdGhlIGVsZW1lbnRzLCBmb3Igc3ViLXBpeGVsIHRyYW5zZm9ybXMuXG4gICAgICAgIGVsZW1lbnRUb09mZnNldC5zdHlsZS50cmFuc2Zvcm0gPSBjb21iaW5lVHJhbnNmb3JtcyhcbiAgICAgICAgICBgdHJhbnNsYXRlM2QoJHtNYXRoLnJvdW5kKHNpYmxpbmcub2Zmc2V0KX1weCwgMCwgMClgLFxuICAgICAgICAgIHNpYmxpbmcuaW5pdGlhbFRyYW5zZm9ybSxcbiAgICAgICAgKTtcbiAgICAgICAgYWRqdXN0Q2xpZW50UmVjdChzaWJsaW5nLmNsaWVudFJlY3QsIDAsIG9mZnNldCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbGVtZW50VG9PZmZzZXQuc3R5bGUudHJhbnNmb3JtID0gY29tYmluZVRyYW5zZm9ybXMoXG4gICAgICAgICAgYHRyYW5zbGF0ZTNkKDAsICR7TWF0aC5yb3VuZChzaWJsaW5nLm9mZnNldCl9cHgsIDApYCxcbiAgICAgICAgICBzaWJsaW5nLmluaXRpYWxUcmFuc2Zvcm0sXG4gICAgICAgICk7XG4gICAgICAgIGFkanVzdENsaWVudFJlY3Qoc2libGluZy5jbGllbnRSZWN0LCBvZmZzZXQsIDApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gTm90ZSB0aGF0IGl0J3MgaW1wb3J0YW50IHRoYXQgd2UgZG8gdGhpcyBhZnRlciB0aGUgY2xpZW50IHJlY3RzIGhhdmUgYmVlbiBhZGp1c3RlZC5cbiAgICB0aGlzLl9wcmV2aW91c1N3YXAub3ZlcmxhcHMgPSBpc0luc2lkZUNsaWVudFJlY3QobmV3UG9zaXRpb24sIHBvaW50ZXJYLCBwb2ludGVyWSk7XG4gICAgdGhpcy5fcHJldmlvdXNTd2FwLmRyYWcgPSBzaWJsaW5nQXROZXdQb3NpdGlvbi5kcmFnO1xuICAgIHRoaXMuX3ByZXZpb3VzU3dhcC5kZWx0YSA9IGlzSG9yaXpvbnRhbCA/IHBvaW50ZXJEZWx0YS54IDogcG9pbnRlckRlbHRhLnk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIHVzZXIncyBwb2ludGVyIGlzIGNsb3NlIHRvIHRoZSBlZGdlcyBvZiBlaXRoZXIgdGhlXG4gICAqIHZpZXdwb3J0IG9yIHRoZSBkcm9wIGxpc3QgYW5kIHN0YXJ0cyB0aGUgYXV0by1zY3JvbGwgc2VxdWVuY2UuXG4gICAqIEBwYXJhbSBwb2ludGVyWCBVc2VyJ3MgcG9pbnRlciBwb3NpdGlvbiBhbG9uZyB0aGUgeCBheGlzLlxuICAgKiBAcGFyYW0gcG9pbnRlclkgVXNlcidzIHBvaW50ZXIgcG9zaXRpb24gYWxvbmcgdGhlIHkgYXhpcy5cbiAgICovXG4gIF9zdGFydFNjcm9sbGluZ0lmTmVjZXNzYXJ5KHBvaW50ZXJYOiBudW1iZXIsIHBvaW50ZXJZOiBudW1iZXIpIHtcbiAgICBpZiAodGhpcy5hdXRvU2Nyb2xsRGlzYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgc2Nyb2xsTm9kZTogSFRNTEVsZW1lbnQgfCBXaW5kb3cgfCB1bmRlZmluZWQ7XG4gICAgbGV0IHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLk5PTkU7XG4gICAgbGV0IGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5OT05FO1xuXG4gICAgLy8gQ2hlY2sgd2hldGhlciB3ZSBzaG91bGQgc3RhcnQgc2Nyb2xsaW5nIGFueSBvZiB0aGUgcGFyZW50IGNvbnRhaW5lcnMuXG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLnBvc2l0aW9ucy5mb3JFYWNoKChwb3NpdGlvbiwgZWxlbWVudCkgPT4ge1xuICAgICAgLy8gV2UgaGF2ZSBzcGVjaWFsIGhhbmRsaW5nIGZvciB0aGUgYGRvY3VtZW50YCBiZWxvdy4gQWxzbyB0aGlzIHdvdWxkIGJlXG4gICAgICAvLyBuaWNlciB3aXRoIGEgIGZvci4uLm9mIGxvb3AsIGJ1dCBpdCByZXF1aXJlcyBjaGFuZ2luZyBhIGNvbXBpbGVyIGZsYWcuXG4gICAgICBpZiAoZWxlbWVudCA9PT0gdGhpcy5fZG9jdW1lbnQgfHwgIXBvc2l0aW9uLmNsaWVudFJlY3QgfHwgc2Nyb2xsTm9kZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChcbiAgICAgICAgaXNQb2ludGVyTmVhckNsaWVudFJlY3QocG9zaXRpb24uY2xpZW50UmVjdCwgRFJPUF9QUk9YSU1JVFlfVEhSRVNIT0xELCBwb2ludGVyWCwgcG9pbnRlclkpXG4gICAgICApIHtcbiAgICAgICAgW3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uLCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uXSA9IGdldEVsZW1lbnRTY3JvbGxEaXJlY3Rpb25zKFxuICAgICAgICAgIGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgcG9zaXRpb24uY2xpZW50UmVjdCxcbiAgICAgICAgICBwb2ludGVyWCxcbiAgICAgICAgICBwb2ludGVyWSxcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAodmVydGljYWxTY3JvbGxEaXJlY3Rpb24gfHwgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbikge1xuICAgICAgICAgIHNjcm9sbE5vZGUgPSBlbGVtZW50IGFzIEhUTUxFbGVtZW50O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBPdGhlcndpc2UgY2hlY2sgaWYgd2UgY2FuIHN0YXJ0IHNjcm9sbGluZyB0aGUgdmlld3BvcnQuXG4gICAgaWYgKCF2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiAmJiAhaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbikge1xuICAgICAgY29uc3Qge3dpZHRoLCBoZWlnaHR9ID0gdGhpcy5fdmlld3BvcnRSdWxlci5nZXRWaWV3cG9ydFNpemUoKTtcbiAgICAgIGNvbnN0IGNsaWVudFJlY3QgPSB7XG4gICAgICAgIHdpZHRoLFxuICAgICAgICBoZWlnaHQsXG4gICAgICAgIHRvcDogMCxcbiAgICAgICAgcmlnaHQ6IHdpZHRoLFxuICAgICAgICBib3R0b206IGhlaWdodCxcbiAgICAgICAgbGVmdDogMCxcbiAgICAgIH0gYXMgQ2xpZW50UmVjdDtcbiAgICAgIHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gZ2V0VmVydGljYWxTY3JvbGxEaXJlY3Rpb24oY2xpZW50UmVjdCwgcG9pbnRlclkpO1xuICAgICAgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IGdldEhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24oY2xpZW50UmVjdCwgcG9pbnRlclgpO1xuICAgICAgc2Nyb2xsTm9kZSA9IHdpbmRvdztcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICBzY3JvbGxOb2RlICYmXG4gICAgICAodmVydGljYWxTY3JvbGxEaXJlY3Rpb24gIT09IHRoaXMuX3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uIHx8XG4gICAgICAgIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gIT09IHRoaXMuX2hvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gfHxcbiAgICAgICAgc2Nyb2xsTm9kZSAhPT0gdGhpcy5fc2Nyb2xsTm9kZSlcbiAgICApIHtcbiAgICAgIHRoaXMuX3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gdmVydGljYWxTY3JvbGxEaXJlY3Rpb247XG4gICAgICB0aGlzLl9ob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbjtcbiAgICAgIHRoaXMuX3Njcm9sbE5vZGUgPSBzY3JvbGxOb2RlO1xuXG4gICAgICBpZiAoKHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uIHx8IGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24pICYmIHNjcm9sbE5vZGUpIHtcbiAgICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKHRoaXMuX3N0YXJ0U2Nyb2xsSW50ZXJ2YWwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fc3RvcFNjcm9sbGluZygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBTdG9wcyBhbnkgY3VycmVudGx5LXJ1bm5pbmcgYXV0by1zY3JvbGwgc2VxdWVuY2VzLiAqL1xuICBfc3RvcFNjcm9sbGluZygpIHtcbiAgICB0aGlzLl9zdG9wU2Nyb2xsVGltZXJzLm5leHQoKTtcbiAgfVxuXG4gIC8qKiBTdGFydHMgdGhlIGRyYWdnaW5nIHNlcXVlbmNlIHdpdGhpbiB0aGUgbGlzdC4gKi9cbiAgcHJpdmF0ZSBfZHJhZ2dpbmdTdGFydGVkKCkge1xuICAgIGNvbnN0IHN0eWxlcyA9IGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KS5zdHlsZSBhcyBEcmFnQ1NTU3R5bGVEZWNsYXJhdGlvbjtcbiAgICB0aGlzLmJlZm9yZVN0YXJ0ZWQubmV4dCgpO1xuICAgIHRoaXMuX2lzRHJhZ2dpbmcgPSB0cnVlO1xuXG4gICAgLy8gV2UgbmVlZCB0byBkaXNhYmxlIHNjcm9sbCBzbmFwcGluZyB3aGlsZSB0aGUgdXNlciBpcyBkcmFnZ2luZywgYmVjYXVzZSBpdCBicmVha3MgYXV0b21hdGljXG4gICAgLy8gc2Nyb2xsaW5nLiBUaGUgYnJvd3NlciBzZWVtcyB0byByb3VuZCB0aGUgdmFsdWUgYmFzZWQgb24gdGhlIHNuYXBwaW5nIHBvaW50cyB3aGljaCBtZWFuc1xuICAgIC8vIHRoYXQgd2UgY2FuJ3QgaW5jcmVtZW50L2RlY3JlbWVudCB0aGUgc2Nyb2xsIHBvc2l0aW9uLlxuICAgIHRoaXMuX2luaXRpYWxTY3JvbGxTbmFwID0gc3R5bGVzLm1zU2Nyb2xsU25hcFR5cGUgfHwgc3R5bGVzLnNjcm9sbFNuYXBUeXBlIHx8ICcnO1xuICAgIHN0eWxlcy5zY3JvbGxTbmFwVHlwZSA9IHN0eWxlcy5tc1Njcm9sbFNuYXBUeXBlID0gJ25vbmUnO1xuICAgIHRoaXMuX2NhY2hlSXRlbXMoKTtcbiAgICB0aGlzLl92aWV3cG9ydFNjcm9sbFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuX2xpc3RlblRvU2Nyb2xsRXZlbnRzKCk7XG4gIH1cblxuICAvKiogQ2FjaGVzIHRoZSBwb3NpdGlvbnMgb2YgdGhlIGNvbmZpZ3VyZWQgc2Nyb2xsYWJsZSBwYXJlbnRzLiAqL1xuICBwcml2YXRlIF9jYWNoZVBhcmVudFBvc2l0aW9ucygpIHtcbiAgICBjb25zdCBlbGVtZW50ID0gY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpO1xuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5jYWNoZSh0aGlzLl9zY3JvbGxhYmxlRWxlbWVudHMpO1xuXG4gICAgLy8gVGhlIGxpc3QgZWxlbWVudCBpcyBhbHdheXMgaW4gdGhlIGBzY3JvbGxhYmxlRWxlbWVudHNgXG4gICAgLy8gc28gd2UgY2FuIHRha2UgYWR2YW50YWdlIG9mIHRoZSBjYWNoZWQgYENsaWVudFJlY3RgLlxuICAgIHRoaXMuX2NsaWVudFJlY3QgPSB0aGlzLl9wYXJlbnRQb3NpdGlvbnMucG9zaXRpb25zLmdldChlbGVtZW50KSEuY2xpZW50UmVjdCE7XG4gIH1cblxuICAvKiogUmVmcmVzaGVzIHRoZSBwb3NpdGlvbiBjYWNoZSBvZiB0aGUgaXRlbXMgYW5kIHNpYmxpbmcgY29udGFpbmVycy4gKi9cbiAgcHJpdmF0ZSBfY2FjaGVJdGVtUG9zaXRpb25zKCkge1xuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCc7XG5cbiAgICB0aGlzLl9pdGVtUG9zaXRpb25zID0gdGhpcy5fYWN0aXZlRHJhZ2dhYmxlc1xuICAgICAgLm1hcChkcmFnID0+IHtcbiAgICAgICAgY29uc3QgZWxlbWVudFRvTWVhc3VyZSA9IGRyYWcuZ2V0VmlzaWJsZUVsZW1lbnQoKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBkcmFnLFxuICAgICAgICAgIG9mZnNldDogMCxcbiAgICAgICAgICBpbml0aWFsVHJhbnNmb3JtOiBlbGVtZW50VG9NZWFzdXJlLnN0eWxlLnRyYW5zZm9ybSB8fCAnJyxcbiAgICAgICAgICBjbGllbnRSZWN0OiBnZXRNdXRhYmxlQ2xpZW50UmVjdChlbGVtZW50VG9NZWFzdXJlKSxcbiAgICAgICAgfTtcbiAgICAgIH0pXG4gICAgICAuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICByZXR1cm4gaXNIb3Jpem9udGFsXG4gICAgICAgICAgPyBhLmNsaWVudFJlY3QubGVmdCAtIGIuY2xpZW50UmVjdC5sZWZ0XG4gICAgICAgICAgOiBhLmNsaWVudFJlY3QudG9wIC0gYi5jbGllbnRSZWN0LnRvcDtcbiAgICAgIH0pO1xuICB9XG5cbiAgLyoqIFJlc2V0cyB0aGUgY29udGFpbmVyIHRvIGl0cyBpbml0aWFsIHN0YXRlLiAqL1xuICBwcml2YXRlIF9yZXNldCgpIHtcbiAgICB0aGlzLl9pc0RyYWdnaW5nID0gZmFsc2U7XG5cbiAgICBjb25zdCBzdHlsZXMgPSBjb2VyY2VFbGVtZW50KHRoaXMuZWxlbWVudCkuc3R5bGUgYXMgRHJhZ0NTU1N0eWxlRGVjbGFyYXRpb247XG4gICAgc3R5bGVzLnNjcm9sbFNuYXBUeXBlID0gc3R5bGVzLm1zU2Nyb2xsU25hcFR5cGUgPSB0aGlzLl9pbml0aWFsU2Nyb2xsU25hcDtcblxuICAgIC8vIFRPRE8oY3Jpc2JldG8pOiBtYXkgaGF2ZSB0byB3YWl0IGZvciB0aGUgYW5pbWF0aW9ucyB0byBmaW5pc2guXG4gICAgdGhpcy5fYWN0aXZlRHJhZ2dhYmxlcy5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgY29uc3Qgcm9vdEVsZW1lbnQgPSBpdGVtLmdldFJvb3RFbGVtZW50KCk7XG5cbiAgICAgIGlmIChyb290RWxlbWVudCkge1xuICAgICAgICBjb25zdCBpbml0aWFsVHJhbnNmb3JtID0gdGhpcy5faXRlbVBvc2l0aW9ucy5maW5kKFxuICAgICAgICAgIGN1cnJlbnQgPT4gY3VycmVudC5kcmFnID09PSBpdGVtLFxuICAgICAgICApPy5pbml0aWFsVHJhbnNmb3JtO1xuICAgICAgICByb290RWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSBpbml0aWFsVHJhbnNmb3JtIHx8ICcnO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuX3NpYmxpbmdzLmZvckVhY2goc2libGluZyA9PiBzaWJsaW5nLl9zdG9wUmVjZWl2aW5nKHRoaXMpKTtcbiAgICB0aGlzLl9hY3RpdmVEcmFnZ2FibGVzID0gW107XG4gICAgdGhpcy5faXRlbVBvc2l0aW9ucyA9IFtdO1xuICAgIHRoaXMuX3ByZXZpb3VzU3dhcC5kcmFnID0gbnVsbDtcbiAgICB0aGlzLl9wcmV2aW91c1N3YXAuZGVsdGEgPSAwO1xuICAgIHRoaXMuX3ByZXZpb3VzU3dhcC5vdmVybGFwcyA9IGZhbHNlO1xuICAgIHRoaXMuX3N0b3BTY3JvbGxpbmcoKTtcbiAgICB0aGlzLl92aWV3cG9ydFNjcm9sbFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5jbGVhcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG9mZnNldCBpbiBwaXhlbHMgYnkgd2hpY2ggdGhlIGl0ZW1zIHRoYXQgYXJlbid0IGJlaW5nIGRyYWdnZWQgc2hvdWxkIGJlIG1vdmVkLlxuICAgKiBAcGFyYW0gY3VycmVudEluZGV4IEluZGV4IG9mIHRoZSBpdGVtIGN1cnJlbnRseSBiZWluZyBkcmFnZ2VkLlxuICAgKiBAcGFyYW0gc2libGluZ3MgQWxsIG9mIHRoZSBpdGVtcyBpbiB0aGUgbGlzdC5cbiAgICogQHBhcmFtIGRlbHRhIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgdXNlciBpcyBtb3ZpbmcuXG4gICAqL1xuICBwcml2YXRlIF9nZXRTaWJsaW5nT2Zmc2V0UHgoY3VycmVudEluZGV4OiBudW1iZXIsIHNpYmxpbmdzOiBDYWNoZWRJdGVtUG9zaXRpb25bXSwgZGVsdGE6IDEgfCAtMSkge1xuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCc7XG4gICAgY29uc3QgY3VycmVudFBvc2l0aW9uID0gc2libGluZ3NbY3VycmVudEluZGV4XS5jbGllbnRSZWN0O1xuICAgIGNvbnN0IGltbWVkaWF0ZVNpYmxpbmcgPSBzaWJsaW5nc1tjdXJyZW50SW5kZXggKyBkZWx0YSAqIC0xXTtcbiAgICBsZXQgc2libGluZ09mZnNldCA9IGN1cnJlbnRQb3NpdGlvbltpc0hvcml6b250YWwgPyAnd2lkdGgnIDogJ2hlaWdodCddICogZGVsdGE7XG5cbiAgICBpZiAoaW1tZWRpYXRlU2libGluZykge1xuICAgICAgY29uc3Qgc3RhcnQgPSBpc0hvcml6b250YWwgPyAnbGVmdCcgOiAndG9wJztcbiAgICAgIGNvbnN0IGVuZCA9IGlzSG9yaXpvbnRhbCA/ICdyaWdodCcgOiAnYm90dG9tJztcblxuICAgICAgLy8gR2V0IHRoZSBzcGFjaW5nIGJldHdlZW4gdGhlIHN0YXJ0IG9mIHRoZSBjdXJyZW50IGl0ZW0gYW5kIHRoZSBlbmQgb2YgdGhlIG9uZSBpbW1lZGlhdGVseVxuICAgICAgLy8gYWZ0ZXIgaXQgaW4gdGhlIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgdXNlciBpcyBkcmFnZ2luZywgb3IgdmljZSB2ZXJzYS4gV2UgYWRkIGl0IHRvIHRoZVxuICAgICAgLy8gb2Zmc2V0IGluIG9yZGVyIHRvIHB1c2ggdGhlIGVsZW1lbnQgdG8gd2hlcmUgaXQgd2lsbCBiZSB3aGVuIGl0J3MgaW5saW5lIGFuZCBpcyBpbmZsdWVuY2VkXG4gICAgICAvLyBieSB0aGUgYG1hcmdpbmAgb2YgaXRzIHNpYmxpbmdzLlxuICAgICAgaWYgKGRlbHRhID09PSAtMSkge1xuICAgICAgICBzaWJsaW5nT2Zmc2V0IC09IGltbWVkaWF0ZVNpYmxpbmcuY2xpZW50UmVjdFtzdGFydF0gLSBjdXJyZW50UG9zaXRpb25bZW5kXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNpYmxpbmdPZmZzZXQgKz0gY3VycmVudFBvc2l0aW9uW3N0YXJ0XSAtIGltbWVkaWF0ZVNpYmxpbmcuY2xpZW50UmVjdFtlbmRdO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzaWJsaW5nT2Zmc2V0O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG9mZnNldCBpbiBwaXhlbHMgYnkgd2hpY2ggdGhlIGl0ZW0gdGhhdCBpcyBiZWluZyBkcmFnZ2VkIHNob3VsZCBiZSBtb3ZlZC5cbiAgICogQHBhcmFtIGN1cnJlbnRQb3NpdGlvbiBDdXJyZW50IHBvc2l0aW9uIG9mIHRoZSBpdGVtLlxuICAgKiBAcGFyYW0gbmV3UG9zaXRpb24gUG9zaXRpb24gb2YgdGhlIGl0ZW0gd2hlcmUgdGhlIGN1cnJlbnQgaXRlbSBzaG91bGQgYmUgbW92ZWQuXG4gICAqIEBwYXJhbSBkZWx0YSBEaXJlY3Rpb24gaW4gd2hpY2ggdGhlIHVzZXIgaXMgbW92aW5nLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0SXRlbU9mZnNldFB4KGN1cnJlbnRQb3NpdGlvbjogQ2xpZW50UmVjdCwgbmV3UG9zaXRpb246IENsaWVudFJlY3QsIGRlbHRhOiAxIHwgLTEpIHtcbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuICAgIGxldCBpdGVtT2Zmc2V0ID0gaXNIb3Jpem9udGFsXG4gICAgICA/IG5ld1Bvc2l0aW9uLmxlZnQgLSBjdXJyZW50UG9zaXRpb24ubGVmdFxuICAgICAgOiBuZXdQb3NpdGlvbi50b3AgLSBjdXJyZW50UG9zaXRpb24udG9wO1xuXG4gICAgLy8gQWNjb3VudCBmb3IgZGlmZmVyZW5jZXMgaW4gdGhlIGl0ZW0gd2lkdGgvaGVpZ2h0LlxuICAgIGlmIChkZWx0YSA9PT0gLTEpIHtcbiAgICAgIGl0ZW1PZmZzZXQgKz0gaXNIb3Jpem9udGFsXG4gICAgICAgID8gbmV3UG9zaXRpb24ud2lkdGggLSBjdXJyZW50UG9zaXRpb24ud2lkdGhcbiAgICAgICAgOiBuZXdQb3NpdGlvbi5oZWlnaHQgLSBjdXJyZW50UG9zaXRpb24uaGVpZ2h0O1xuICAgIH1cblxuICAgIHJldHVybiBpdGVtT2Zmc2V0O1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBwb2ludGVyIGlzIGVudGVyaW5nIGluIHRoZSBmaXJzdCBwb3NpdGlvblxuICAgKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIFkgYXhpcy5cbiAgICovXG4gIHByaXZhdGUgX3Nob3VsZEVudGVyQXNGaXJzdENoaWxkKHBvaW50ZXJYOiBudW1iZXIsIHBvaW50ZXJZOiBudW1iZXIpIHtcbiAgICBpZiAoIXRoaXMuX2FjdGl2ZURyYWdnYWJsZXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgaXRlbVBvc2l0aW9ucyA9IHRoaXMuX2l0ZW1Qb3NpdGlvbnM7XG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gdGhpcy5fb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJztcblxuICAgIC8vIGBpdGVtUG9zaXRpb25zYCBhcmUgc29ydGVkIGJ5IHBvc2l0aW9uIHdoaWxlIGBhY3RpdmVEcmFnZ2FibGVzYCBhcmUgc29ydGVkIGJ5IGNoaWxkIGluZGV4XG4gICAgLy8gY2hlY2sgaWYgY29udGFpbmVyIGlzIHVzaW5nIHNvbWUgc29ydCBvZiBcInJldmVyc2VcIiBvcmRlcmluZyAoZWc6IGZsZXgtZGlyZWN0aW9uOiByb3ctcmV2ZXJzZSlcbiAgICBjb25zdCByZXZlcnNlZCA9IGl0ZW1Qb3NpdGlvbnNbMF0uZHJhZyAhPT0gdGhpcy5fYWN0aXZlRHJhZ2dhYmxlc1swXTtcbiAgICBpZiAocmV2ZXJzZWQpIHtcbiAgICAgIGNvbnN0IGxhc3RJdGVtUmVjdCA9IGl0ZW1Qb3NpdGlvbnNbaXRlbVBvc2l0aW9ucy5sZW5ndGggLSAxXS5jbGllbnRSZWN0O1xuICAgICAgcmV0dXJuIGlzSG9yaXpvbnRhbCA/IHBvaW50ZXJYID49IGxhc3RJdGVtUmVjdC5yaWdodCA6IHBvaW50ZXJZID49IGxhc3RJdGVtUmVjdC5ib3R0b207XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGZpcnN0SXRlbVJlY3QgPSBpdGVtUG9zaXRpb25zWzBdLmNsaWVudFJlY3Q7XG4gICAgICByZXR1cm4gaXNIb3Jpem9udGFsID8gcG9pbnRlclggPD0gZmlyc3RJdGVtUmVjdC5sZWZ0IDogcG9pbnRlclkgPD0gZmlyc3RJdGVtUmVjdC50b3A7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGluZGV4IG9mIGFuIGl0ZW0gaW4gdGhlIGRyb3AgY29udGFpbmVyLCBiYXNlZCBvbiB0aGUgcG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRoYXQgaXMgYmVpbmcgc29ydGVkLlxuICAgKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIFkgYXhpcy5cbiAgICogQHBhcmFtIGRlbHRhIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgdXNlciBpcyBtb3ZpbmcgdGhlaXIgcG9pbnRlci5cbiAgICovXG4gIHByaXZhdGUgX2dldEl0ZW1JbmRleEZyb21Qb2ludGVyUG9zaXRpb24oXG4gICAgaXRlbTogRHJhZ1JlZixcbiAgICBwb2ludGVyWDogbnVtYmVyLFxuICAgIHBvaW50ZXJZOiBudW1iZXIsXG4gICAgZGVsdGE/OiB7eDogbnVtYmVyOyB5OiBudW1iZXJ9LFxuICApOiBudW1iZXIge1xuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCc7XG4gICAgY29uc3QgaW5kZXggPSB0aGlzLl9pdGVtUG9zaXRpb25zLmZpbmRJbmRleCgoe2RyYWcsIGNsaWVudFJlY3R9KSA9PiB7XG4gICAgICAvLyBTa2lwIHRoZSBpdGVtIGl0c2VsZi5cbiAgICAgIGlmIChkcmFnID09PSBpdGVtKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRlbHRhKSB7XG4gICAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IGlzSG9yaXpvbnRhbCA/IGRlbHRhLnggOiBkZWx0YS55O1xuXG4gICAgICAgIC8vIElmIHRoZSB1c2VyIGlzIHN0aWxsIGhvdmVyaW5nIG92ZXIgdGhlIHNhbWUgaXRlbSBhcyBsYXN0IHRpbWUsIHRoZWlyIGN1cnNvciBoYXNuJ3QgbGVmdFxuICAgICAgICAvLyB0aGUgaXRlbSBhZnRlciB3ZSBtYWRlIHRoZSBzd2FwLCBhbmQgdGhleSBkaWRuJ3QgY2hhbmdlIHRoZSBkaXJlY3Rpb24gaW4gd2hpY2ggdGhleSdyZVxuICAgICAgICAvLyBkcmFnZ2luZywgd2UgZG9uJ3QgY29uc2lkZXIgaXQgYSBkaXJlY3Rpb24gc3dhcC5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIGRyYWcgPT09IHRoaXMuX3ByZXZpb3VzU3dhcC5kcmFnICYmXG4gICAgICAgICAgdGhpcy5fcHJldmlvdXNTd2FwLm92ZXJsYXBzICYmXG4gICAgICAgICAgZGlyZWN0aW9uID09PSB0aGlzLl9wcmV2aW91c1N3YXAuZGVsdGFcbiAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBpc0hvcml6b250YWxcbiAgICAgICAgPyAvLyBSb3VuZCB0aGVzZSBkb3duIHNpbmNlIG1vc3QgYnJvd3NlcnMgcmVwb3J0IGNsaWVudCByZWN0cyB3aXRoXG4gICAgICAgICAgLy8gc3ViLXBpeGVsIHByZWNpc2lvbiwgd2hlcmVhcyB0aGUgcG9pbnRlciBjb29yZGluYXRlcyBhcmUgcm91bmRlZCB0byBwaXhlbHMuXG4gICAgICAgICAgcG9pbnRlclggPj0gTWF0aC5mbG9vcihjbGllbnRSZWN0LmxlZnQpICYmIHBvaW50ZXJYIDwgTWF0aC5mbG9vcihjbGllbnRSZWN0LnJpZ2h0KVxuICAgICAgICA6IHBvaW50ZXJZID49IE1hdGguZmxvb3IoY2xpZW50UmVjdC50b3ApICYmIHBvaW50ZXJZIDwgTWF0aC5mbG9vcihjbGllbnRSZWN0LmJvdHRvbSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gaW5kZXggPT09IC0xIHx8ICF0aGlzLnNvcnRQcmVkaWNhdGUoaW5kZXgsIGl0ZW0sIHRoaXMpID8gLTEgOiBpbmRleDtcbiAgfVxuXG4gIC8qKiBDYWNoZXMgdGhlIGN1cnJlbnQgaXRlbXMgaW4gdGhlIGxpc3QgYW5kIHRoZWlyIHBvc2l0aW9ucy4gKi9cbiAgcHJpdmF0ZSBfY2FjaGVJdGVtcygpOiB2b2lkIHtcbiAgICB0aGlzLl9hY3RpdmVEcmFnZ2FibGVzID0gdGhpcy5fZHJhZ2dhYmxlcy5zbGljZSgpO1xuICAgIHRoaXMuX2NhY2hlSXRlbVBvc2l0aW9ucygpO1xuICAgIHRoaXMuX2NhY2hlUGFyZW50UG9zaXRpb25zKCk7XG4gIH1cblxuICAvKiogU3RhcnRzIHRoZSBpbnRlcnZhbCB0aGF0J2xsIGF1dG8tc2Nyb2xsIHRoZSBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9zdGFydFNjcm9sbEludGVydmFsID0gKCkgPT4ge1xuICAgIHRoaXMuX3N0b3BTY3JvbGxpbmcoKTtcblxuICAgIGludGVydmFsKDAsIGFuaW1hdGlvbkZyYW1lU2NoZWR1bGVyKVxuICAgICAgLnBpcGUodGFrZVVudGlsKHRoaXMuX3N0b3BTY3JvbGxUaW1lcnMpKVxuICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLl9zY3JvbGxOb2RlO1xuICAgICAgICBjb25zdCBzY3JvbGxTdGVwID0gdGhpcy5hdXRvU2Nyb2xsU3RlcDtcblxuICAgICAgICBpZiAodGhpcy5fdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPT09IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5VUCkge1xuICAgICAgICAgIG5vZGUuc2Nyb2xsQnkoMCwgLXNjcm9sbFN0ZXApO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID09PSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uRE9XTikge1xuICAgICAgICAgIG5vZGUuc2Nyb2xsQnkoMCwgc2Nyb2xsU3RlcCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5faG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9PT0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTEVGVCkge1xuICAgICAgICAgIG5vZGUuc2Nyb2xsQnkoLXNjcm9sbFN0ZXAsIDApO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2hvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPT09IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLlJJR0hUKSB7XG4gICAgICAgICAgbm9kZS5zY3JvbGxCeShzY3JvbGxTdGVwLCAwKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSB1c2VyJ3MgcG9pbnRlciBpcyBwb3NpdGlvbmVkIG92ZXIgdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHggUG9pbnRlciBwb3NpdGlvbiBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0geSBQb2ludGVyIHBvc2l0aW9uIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqL1xuICBfaXNPdmVyQ29udGFpbmVyKHg6IG51bWJlciwgeTogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2NsaWVudFJlY3QgIT0gbnVsbCAmJiBpc0luc2lkZUNsaWVudFJlY3QodGhpcy5fY2xpZW50UmVjdCwgeCwgeSk7XG4gIH1cblxuICAvKipcbiAgICogRmlndXJlcyBvdXQgd2hldGhlciBhbiBpdGVtIHNob3VsZCBiZSBtb3ZlZCBpbnRvIGEgc2libGluZ1xuICAgKiBkcm9wIGNvbnRhaW5lciwgYmFzZWQgb24gaXRzIGN1cnJlbnQgcG9zaXRpb24uXG4gICAqIEBwYXJhbSBpdGVtIERyYWcgaXRlbSB0aGF0IGlzIGJlaW5nIG1vdmVkLlxuICAgKiBAcGFyYW0geCBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0geSBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKi9cbiAgX2dldFNpYmxpbmdDb250YWluZXJGcm9tUG9zaXRpb24oaXRlbTogRHJhZ1JlZiwgeDogbnVtYmVyLCB5OiBudW1iZXIpOiBEcm9wTGlzdFJlZiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX3NpYmxpbmdzLmZpbmQoc2libGluZyA9PiBzaWJsaW5nLl9jYW5SZWNlaXZlKGl0ZW0sIHgsIHkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgZHJvcCBsaXN0IGNhbiByZWNlaXZlIHRoZSBwYXNzZWQtaW4gaXRlbS5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB0aGF0IGlzIGJlaW5nIGRyYWdnZWQgaW50byB0aGUgbGlzdC5cbiAgICogQHBhcmFtIHggUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHkgUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFkgYXhpcy5cbiAgICovXG4gIF9jYW5SZWNlaXZlKGl0ZW06IERyYWdSZWYsIHg6IG51bWJlciwgeTogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgaWYgKFxuICAgICAgIXRoaXMuX2NsaWVudFJlY3QgfHxcbiAgICAgICFpc0luc2lkZUNsaWVudFJlY3QodGhpcy5fY2xpZW50UmVjdCwgeCwgeSkgfHxcbiAgICAgICF0aGlzLmVudGVyUHJlZGljYXRlKGl0ZW0sIHRoaXMpXG4gICAgKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgZWxlbWVudEZyb21Qb2ludCA9IHRoaXMuX2dldFNoYWRvd1Jvb3QoKS5lbGVtZW50RnJvbVBvaW50KHgsIHkpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcblxuICAgIC8vIElmIHRoZXJlJ3Mgbm8gZWxlbWVudCBhdCB0aGUgcG9pbnRlciBwb3NpdGlvbiwgdGhlblxuICAgIC8vIHRoZSBjbGllbnQgcmVjdCBpcyBwcm9iYWJseSBzY3JvbGxlZCBvdXQgb2YgdGhlIHZpZXcuXG4gICAgaWYgKCFlbGVtZW50RnJvbVBvaW50KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KTtcblxuICAgIC8vIFRoZSBgQ2xpZW50UmVjdGAsIHRoYXQgd2UncmUgdXNpbmcgdG8gZmluZCB0aGUgY29udGFpbmVyIG92ZXIgd2hpY2ggdGhlIHVzZXIgaXNcbiAgICAvLyBob3ZlcmluZywgZG9lc24ndCBnaXZlIHVzIGFueSBpbmZvcm1hdGlvbiBvbiB3aGV0aGVyIHRoZSBlbGVtZW50IGhhcyBiZWVuIHNjcm9sbGVkXG4gICAgLy8gb3V0IG9mIHRoZSB2aWV3IG9yIHdoZXRoZXIgaXQncyBvdmVybGFwcGluZyB3aXRoIG90aGVyIGNvbnRhaW5lcnMuIFRoaXMgbWVhbnMgdGhhdFxuICAgIC8vIHdlIGNvdWxkIGVuZCB1cCB0cmFuc2ZlcnJpbmcgdGhlIGl0ZW0gaW50byBhIGNvbnRhaW5lciB0aGF0J3MgaW52aXNpYmxlIG9yIGlzIHBvc2l0aW9uZWRcbiAgICAvLyBiZWxvdyBhbm90aGVyIG9uZS4gV2UgdXNlIHRoZSByZXN1bHQgZnJvbSBgZWxlbWVudEZyb21Qb2ludGAgdG8gZ2V0IHRoZSB0b3AtbW9zdCBlbGVtZW50XG4gICAgLy8gYXQgdGhlIHBvaW50ZXIgcG9zaXRpb24gYW5kIHRvIGZpbmQgd2hldGhlciBpdCdzIG9uZSBvZiB0aGUgaW50ZXJzZWN0aW5nIGRyb3AgY29udGFpbmVycy5cbiAgICByZXR1cm4gZWxlbWVudEZyb21Qb2ludCA9PT0gbmF0aXZlRWxlbWVudCB8fCBuYXRpdmVFbGVtZW50LmNvbnRhaW5zKGVsZW1lbnRGcm9tUG9pbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCBieSBvbmUgb2YgdGhlIGNvbm5lY3RlZCBkcm9wIGxpc3RzIHdoZW4gYSBkcmFnZ2luZyBzZXF1ZW5jZSBoYXMgc3RhcnRlZC5cbiAgICogQHBhcmFtIHNpYmxpbmcgU2libGluZyBpbiB3aGljaCBkcmFnZ2luZyBoYXMgc3RhcnRlZC5cbiAgICovXG4gIF9zdGFydFJlY2VpdmluZyhzaWJsaW5nOiBEcm9wTGlzdFJlZiwgaXRlbXM6IERyYWdSZWZbXSkge1xuICAgIGNvbnN0IGFjdGl2ZVNpYmxpbmdzID0gdGhpcy5fYWN0aXZlU2libGluZ3M7XG5cbiAgICBpZiAoXG4gICAgICAhYWN0aXZlU2libGluZ3MuaGFzKHNpYmxpbmcpICYmXG4gICAgICBpdGVtcy5ldmVyeShpdGVtID0+IHtcbiAgICAgICAgLy8gTm90ZSB0aGF0IHdlIGhhdmUgdG8gYWRkIGFuIGV4Y2VwdGlvbiB0byB0aGUgYGVudGVyUHJlZGljYXRlYCBmb3IgaXRlbXMgdGhhdCBzdGFydGVkIG9mZlxuICAgICAgICAvLyBpbiB0aGlzIGRyb3AgbGlzdC4gVGhlIGRyYWcgcmVmIGhhcyBsb2dpYyB0aGF0IGFsbG93cyBhbiBpdGVtIHRvIHJldHVybiB0byBpdHMgaW5pdGlhbFxuICAgICAgICAvLyBjb250YWluZXIsIGlmIGl0IGhhcyBsZWZ0IHRoZSBpbml0aWFsIGNvbnRhaW5lciBhbmQgbm9uZSBvZiB0aGUgY29ubmVjdGVkIGNvbnRhaW5lcnNcbiAgICAgICAgLy8gYWxsb3cgaXQgdG8gZW50ZXIuIFNlZSBgRHJhZ1JlZi5fdXBkYXRlQWN0aXZlRHJvcENvbnRhaW5lcmAgZm9yIG1vcmUgY29udGV4dC5cbiAgICAgICAgcmV0dXJuIHRoaXMuZW50ZXJQcmVkaWNhdGUoaXRlbSwgdGhpcykgfHwgdGhpcy5fZHJhZ2dhYmxlcy5pbmRleE9mKGl0ZW0pID4gLTE7XG4gICAgICB9KVxuICAgICkge1xuICAgICAgYWN0aXZlU2libGluZ3MuYWRkKHNpYmxpbmcpO1xuICAgICAgdGhpcy5fY2FjaGVQYXJlbnRQb3NpdGlvbnMoKTtcbiAgICAgIHRoaXMuX2xpc3RlblRvU2Nyb2xsRXZlbnRzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCBieSBhIGNvbm5lY3RlZCBkcm9wIGxpc3Qgd2hlbiBkcmFnZ2luZyBoYXMgc3RvcHBlZC5cbiAgICogQHBhcmFtIHNpYmxpbmcgU2libGluZyB3aG9zZSBkcmFnZ2luZyBoYXMgc3RvcHBlZC5cbiAgICovXG4gIF9zdG9wUmVjZWl2aW5nKHNpYmxpbmc6IERyb3BMaXN0UmVmKSB7XG4gICAgdGhpcy5fYWN0aXZlU2libGluZ3MuZGVsZXRlKHNpYmxpbmcpO1xuICAgIHRoaXMuX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gIH1cblxuICAvKipcbiAgICogU3RhcnRzIGxpc3RlbmluZyB0byBzY3JvbGwgZXZlbnRzIG9uIHRoZSB2aWV3cG9ydC5cbiAgICogVXNlZCBmb3IgdXBkYXRpbmcgdGhlIGludGVybmFsIHN0YXRlIG9mIHRoZSBsaXN0LlxuICAgKi9cbiAgcHJpdmF0ZSBfbGlzdGVuVG9TY3JvbGxFdmVudHMoKSB7XG4gICAgdGhpcy5fdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24gPSB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5XG4gICAgICAuc2Nyb2xsZWQodGhpcy5fZ2V0U2hhZG93Um9vdCgpKVxuICAgICAgLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICAgIGlmICh0aGlzLmlzRHJhZ2dpbmcoKSkge1xuICAgICAgICAgIGNvbnN0IHNjcm9sbERpZmZlcmVuY2UgPSB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuaGFuZGxlU2Nyb2xsKGV2ZW50KTtcblxuICAgICAgICAgIGlmIChzY3JvbGxEaWZmZXJlbmNlKSB7XG4gICAgICAgICAgICAvLyBTaW5jZSB3ZSBrbm93IHRoZSBhbW91bnQgdGhhdCB0aGUgdXNlciBoYXMgc2Nyb2xsZWQgd2UgY2FuIHNoaWZ0IGFsbCBvZiB0aGVcbiAgICAgICAgICAgIC8vIGNsaWVudCByZWN0YW5nbGVzIG91cnNlbHZlcy4gVGhpcyBpcyBjaGVhcGVyIHRoYW4gcmUtbWVhc3VyaW5nIGV2ZXJ5dGhpbmcgYW5kXG4gICAgICAgICAgICAvLyB3ZSBjYW4gYXZvaWQgaW5jb25zaXN0ZW50IGJlaGF2aW9yIHdoZXJlIHdlIG1pZ2h0IGJlIG1lYXN1cmluZyB0aGUgZWxlbWVudCBiZWZvcmVcbiAgICAgICAgICAgIC8vIGl0cyBwb3NpdGlvbiBoYXMgY2hhbmdlZC5cbiAgICAgICAgICAgIHRoaXMuX2l0ZW1Qb3NpdGlvbnMuZm9yRWFjaCgoe2NsaWVudFJlY3R9KSA9PiB7XG4gICAgICAgICAgICAgIGFkanVzdENsaWVudFJlY3QoY2xpZW50UmVjdCwgc2Nyb2xsRGlmZmVyZW5jZS50b3AsIHNjcm9sbERpZmZlcmVuY2UubGVmdCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gV2UgbmVlZCB0d28gbG9vcHMgZm9yIHRoaXMsIGJlY2F1c2Ugd2Ugd2FudCBhbGwgb2YgdGhlIGNhY2hlZFxuICAgICAgICAgICAgLy8gcG9zaXRpb25zIHRvIGJlIHVwLXRvLWRhdGUgYmVmb3JlIHdlIHJlLXNvcnQgdGhlIGl0ZW0uXG4gICAgICAgICAgICB0aGlzLl9pdGVtUG9zaXRpb25zLmZvckVhY2goKHtkcmFnfSkgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5pc0RyYWdnaW5nKGRyYWcpKSB7XG4gICAgICAgICAgICAgICAgLy8gV2UgbmVlZCB0byByZS1zb3J0IHRoZSBpdGVtIG1hbnVhbGx5LCBiZWNhdXNlIHRoZSBwb2ludGVyIG1vdmVcbiAgICAgICAgICAgICAgICAvLyBldmVudHMgd29uJ3QgYmUgZGlzcGF0Y2hlZCB3aGlsZSB0aGUgdXNlciBpcyBzY3JvbGxpbmcuXG4gICAgICAgICAgICAgICAgZHJhZy5fc29ydEZyb21MYXN0UG9pbnRlclBvc2l0aW9uKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmlzUmVjZWl2aW5nKCkpIHtcbiAgICAgICAgICB0aGlzLl9jYWNoZVBhcmVudFBvc2l0aW9ucygpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMYXppbHkgcmVzb2x2ZXMgYW5kIHJldHVybnMgdGhlIHNoYWRvdyByb290IG9mIHRoZSBlbGVtZW50LiBXZSBkbyB0aGlzIGluIGEgZnVuY3Rpb24sIHJhdGhlclxuICAgKiB0aGFuIHNhdmluZyBpdCBpbiBwcm9wZXJ0eSBkaXJlY3RseSBvbiBpbml0LCBiZWNhdXNlIHdlIHdhbnQgdG8gcmVzb2x2ZSBpdCBhcyBsYXRlIGFzIHBvc3NpYmxlXG4gICAqIGluIG9yZGVyIHRvIGVuc3VyZSB0aGF0IHRoZSBlbGVtZW50IGhhcyBiZWVuIG1vdmVkIGludG8gdGhlIHNoYWRvdyBET00uIERvaW5nIGl0IGluc2lkZSB0aGVcbiAgICogY29uc3RydWN0b3IgbWlnaHQgYmUgdG9vIGVhcmx5IGlmIHRoZSBlbGVtZW50IGlzIGluc2lkZSBvZiBzb21ldGhpbmcgbGlrZSBgbmdGb3JgIG9yIGBuZ0lmYC5cbiAgICovXG4gIHByaXZhdGUgX2dldFNoYWRvd1Jvb3QoKTogUm9vdE5vZGUge1xuICAgIGlmICghdGhpcy5fY2FjaGVkU2hhZG93Um9vdCkge1xuICAgICAgY29uc3Qgc2hhZG93Um9vdCA9IF9nZXRTaGFkb3dSb290KGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KSk7XG4gICAgICB0aGlzLl9jYWNoZWRTaGFkb3dSb290ID0gKHNoYWRvd1Jvb3QgfHwgdGhpcy5fZG9jdW1lbnQpIGFzIFJvb3ROb2RlO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9jYWNoZWRTaGFkb3dSb290O1xuICB9XG5cbiAgLyoqIE5vdGlmaWVzIGFueSBzaWJsaW5ncyB0aGF0IG1heSBwb3RlbnRpYWxseSByZWNlaXZlIHRoZSBpdGVtLiAqL1xuICBwcml2YXRlIF9ub3RpZnlSZWNlaXZpbmdTaWJsaW5ncygpIHtcbiAgICBjb25zdCBkcmFnZ2VkSXRlbXMgPSB0aGlzLl9hY3RpdmVEcmFnZ2FibGVzLmZpbHRlcihpdGVtID0+IGl0ZW0uaXNEcmFnZ2luZygpKTtcbiAgICB0aGlzLl9zaWJsaW5ncy5mb3JFYWNoKHNpYmxpbmcgPT4gc2libGluZy5fc3RhcnRSZWNlaXZpbmcodGhpcywgZHJhZ2dlZEl0ZW1zKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIHdoZXRoZXIgdGhlIHZlcnRpY2FsIGF1dG8tc2Nyb2xsIGRpcmVjdGlvbiBvZiBhIG5vZGUuXG4gKiBAcGFyYW0gY2xpZW50UmVjdCBEaW1lbnNpb25zIG9mIHRoZSBub2RlLlxuICogQHBhcmFtIHBvaW50ZXJZIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgeSBheGlzLlxuICovXG5mdW5jdGlvbiBnZXRWZXJ0aWNhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0OiBDbGllbnRSZWN0LCBwb2ludGVyWTogbnVtYmVyKSB7XG4gIGNvbnN0IHt0b3AsIGJvdHRvbSwgaGVpZ2h0fSA9IGNsaWVudFJlY3Q7XG4gIGNvbnN0IHlUaHJlc2hvbGQgPSBoZWlnaHQgKiBTQ1JPTExfUFJPWElNSVRZX1RIUkVTSE9MRDtcblxuICBpZiAocG9pbnRlclkgPj0gdG9wIC0geVRocmVzaG9sZCAmJiBwb2ludGVyWSA8PSB0b3AgKyB5VGhyZXNob2xkKSB7XG4gICAgcmV0dXJuIEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5VUDtcbiAgfSBlbHNlIGlmIChwb2ludGVyWSA+PSBib3R0b20gLSB5VGhyZXNob2xkICYmIHBvaW50ZXJZIDw9IGJvdHRvbSArIHlUaHJlc2hvbGQpIHtcbiAgICByZXR1cm4gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLkRPV047XG4gIH1cblxuICByZXR1cm4gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLk5PTkU7XG59XG5cbi8qKlxuICogR2V0cyB3aGV0aGVyIHRoZSBob3Jpem9udGFsIGF1dG8tc2Nyb2xsIGRpcmVjdGlvbiBvZiBhIG5vZGUuXG4gKiBAcGFyYW0gY2xpZW50UmVjdCBEaW1lbnNpb25zIG9mIHRoZSBub2RlLlxuICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgeCBheGlzLlxuICovXG5mdW5jdGlvbiBnZXRIb3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKGNsaWVudFJlY3Q6IENsaWVudFJlY3QsIHBvaW50ZXJYOiBudW1iZXIpIHtcbiAgY29uc3Qge2xlZnQsIHJpZ2h0LCB3aWR0aH0gPSBjbGllbnRSZWN0O1xuICBjb25zdCB4VGhyZXNob2xkID0gd2lkdGggKiBTQ1JPTExfUFJPWElNSVRZX1RIUkVTSE9MRDtcblxuICBpZiAocG9pbnRlclggPj0gbGVmdCAtIHhUaHJlc2hvbGQgJiYgcG9pbnRlclggPD0gbGVmdCArIHhUaHJlc2hvbGQpIHtcbiAgICByZXR1cm4gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTEVGVDtcbiAgfSBlbHNlIGlmIChwb2ludGVyWCA+PSByaWdodCAtIHhUaHJlc2hvbGQgJiYgcG9pbnRlclggPD0gcmlnaHQgKyB4VGhyZXNob2xkKSB7XG4gICAgcmV0dXJuIEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLlJJR0hUO1xuICB9XG5cbiAgcmV0dXJuIEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLk5PTkU7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgZGlyZWN0aW9ucyBpbiB3aGljaCBhbiBlbGVtZW50IG5vZGUgc2hvdWxkIGJlIHNjcm9sbGVkLFxuICogYXNzdW1pbmcgdGhhdCB0aGUgdXNlcidzIHBvaW50ZXIgaXMgYWxyZWFkeSB3aXRoaW4gaXQgc2Nyb2xsYWJsZSByZWdpb24uXG4gKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IGZvciB3aGljaCB3ZSBzaG91bGQgY2FsY3VsYXRlIHRoZSBzY3JvbGwgZGlyZWN0aW9uLlxuICogQHBhcmFtIGNsaWVudFJlY3QgQm91bmRpbmcgY2xpZW50IHJlY3RhbmdsZSBvZiB0aGUgZWxlbWVudC5cbiAqIEBwYXJhbSBwb2ludGVyWCBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIHggYXhpcy5cbiAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIHkgYXhpcy5cbiAqL1xuZnVuY3Rpb24gZ2V0RWxlbWVudFNjcm9sbERpcmVjdGlvbnMoXG4gIGVsZW1lbnQ6IEhUTUxFbGVtZW50LFxuICBjbGllbnRSZWN0OiBDbGllbnRSZWN0LFxuICBwb2ludGVyWDogbnVtYmVyLFxuICBwb2ludGVyWTogbnVtYmVyLFxuKTogW0F1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbiwgQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb25dIHtcbiAgY29uc3QgY29tcHV0ZWRWZXJ0aWNhbCA9IGdldFZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uKGNsaWVudFJlY3QsIHBvaW50ZXJZKTtcbiAgY29uc3QgY29tcHV0ZWRIb3Jpem9udGFsID0gZ2V0SG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0LCBwb2ludGVyWCk7XG4gIGxldCB2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5OT05FO1xuICBsZXQgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLk5PTkU7XG5cbiAgLy8gTm90ZSB0aGF0IHdlIGhlcmUgd2UgZG8gc29tZSBleHRyYSBjaGVja3MgZm9yIHdoZXRoZXIgdGhlIGVsZW1lbnQgaXMgYWN0dWFsbHkgc2Nyb2xsYWJsZSBpblxuICAvLyBhIGNlcnRhaW4gZGlyZWN0aW9uIGFuZCB3ZSBvbmx5IGFzc2lnbiB0aGUgc2Nyb2xsIGRpcmVjdGlvbiBpZiBpdCBpcy4gV2UgZG8gdGhpcyBzbyB0aGF0IHdlXG4gIC8vIGNhbiBhbGxvdyBvdGhlciBlbGVtZW50cyB0byBiZSBzY3JvbGxlZCwgaWYgdGhlIGN1cnJlbnQgZWxlbWVudCBjYW4ndCBiZSBzY3JvbGxlZCBhbnltb3JlLlxuICAvLyBUaGlzIGFsbG93cyB1cyB0byBoYW5kbGUgY2FzZXMgd2hlcmUgdGhlIHNjcm9sbCByZWdpb25zIG9mIHR3byBzY3JvbGxhYmxlIGVsZW1lbnRzIG92ZXJsYXAuXG4gIGlmIChjb21wdXRlZFZlcnRpY2FsKSB7XG4gICAgY29uc3Qgc2Nyb2xsVG9wID0gZWxlbWVudC5zY3JvbGxUb3A7XG5cbiAgICBpZiAoY29tcHV0ZWRWZXJ0aWNhbCA9PT0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLlVQKSB7XG4gICAgICBpZiAoc2Nyb2xsVG9wID4gMCkge1xuICAgICAgICB2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5VUDtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0gc2Nyb2xsVG9wID4gZWxlbWVudC5jbGllbnRIZWlnaHQpIHtcbiAgICAgIHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLkRPV047XG4gICAgfVxuICB9XG5cbiAgaWYgKGNvbXB1dGVkSG9yaXpvbnRhbCkge1xuICAgIGNvbnN0IHNjcm9sbExlZnQgPSBlbGVtZW50LnNjcm9sbExlZnQ7XG5cbiAgICBpZiAoY29tcHV0ZWRIb3Jpem9udGFsID09PSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5MRUZUKSB7XG4gICAgICBpZiAoc2Nyb2xsTGVmdCA+IDApIHtcbiAgICAgICAgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLkxFRlQ7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChlbGVtZW50LnNjcm9sbFdpZHRoIC0gc2Nyb2xsTGVmdCA+IGVsZW1lbnQuY2xpZW50V2lkdGgpIHtcbiAgICAgIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5SSUdIVDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uLCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uXTtcbn1cbiJdfQ==