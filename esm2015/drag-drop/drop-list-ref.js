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
 * Number of pixels to scroll for each frame when auto-scrolling an element.
 * The value comes from trying it out manually until it feels right.
 */
const AUTO_SCROLL_STEP = 2;
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
                if (this._verticalScrollDirection === 1 /* UP */) {
                    incrementVerticalScroll(node, -AUTO_SCROLL_STEP);
                }
                else if (this._verticalScrollDirection === 2 /* DOWN */) {
                    incrementVerticalScroll(node, AUTO_SCROLL_STEP);
                }
                if (this._horizontalScrollDirection === 1 /* LEFT */) {
                    incrementHorizontalScroll(node, -AUTO_SCROLL_STEP);
                }
                else if (this._horizontalScrollDirection === 2 /* RIGHT */) {
                    incrementHorizontalScroll(node, AUTO_SCROLL_STEP);
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
        const styles = coerceElement(this.element).style;
        this.beforeStarted.next();
        this._isDragging = true;
        // We need to disable scroll snapping while the user is dragging, because it breaks automatic
        // scrolling. The browser seems to round the value based on the snapping points which means
        // that we can't increment/decrement the scroll position.
        this._initialScrollSnap = styles.msScrollSnapType || styles.scrollSnapType || '';
        styles.scrollSnapType = styles.msScrollSnapType = 'none';
        this._cacheItems();
        this._siblings.forEach(sibling => sibling._startReceiving(this));
        this._viewportScrollSubscription.unsubscribe();
        this._listenToScrollEvents();
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
        this.start();
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
    drop(item, currentIndex, previousIndex, previousContainer, isPointerOverContainer, distance) {
        this._reset();
        this.dropped.next({
            item,
            currentIndex,
            previousIndex,
            container: this,
            previousContainer,
            isPointerOverContainer,
            distance
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
        const items = this._orientation === 'horizontal' && this._direction === 'rtl' ?
            this._itemPositions.slice().reverse() : this._itemPositions;
        return findIndex(items, currentItem => currentItem.drag === item);
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
            !isPointerNearClientRect(this._clientRect, DROP_PROXIMITY_THRESHOLD, pointerX, pointerY)) {
            return;
        }
        const siblings = this._itemPositions;
        const newIndex = this._getItemIndexFromPointerPosition(item, pointerX, pointerY, pointerDelta);
        if (newIndex === -1 && siblings.length > 0) {
            return;
        }
        const isHorizontal = this._orientation === 'horizontal';
        const currentIndex = findIndex(siblings, currentItem => currentItem.drag === item);
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
            item
        });
        siblings.forEach((sibling, index) => {
            // Don't do anything if the position hasn't changed.
            if (oldOrder[index] === sibling) {
                return;
            }
            const isDraggedItem = sibling.drag === item;
            const offset = isDraggedItem ? itemOffset : siblingOffset;
            const elementToOffset = isDraggedItem ? item.getPlaceholderElement() :
                sibling.drag.getRootElement();
            // Update the offset to reflect the new position.
            sibling.offset += offset;
            // Since we're moving the items with a `transform`, we need to adjust their cached
            // client rects to reflect their new position, as well as swap their positions in the cache.
            // Note that we shouldn't use `getBoundingClientRect` here to update the cache, because the
            // elements may be mid-animation which will give us a wrong result.
            if (isHorizontal) {
                // Round the transforms since some browsers will
                // blur the elements, for sub-pixel transforms.
                elementToOffset.style.transform = `translate3d(${Math.round(sibling.offset)}px, 0, 0)`;
                adjustClientRect(sibling.clientRect, 0, offset);
            }
            else {
                elementToOffset.style.transform = `translate3d(0, ${Math.round(sibling.offset)}px, 0)`;
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
            const clientRect = { width, height, top: 0, right: width, bottom: height, left: 0 };
            verticalScrollDirection = getVerticalScrollDirection(clientRect, pointerY);
            horizontalScrollDirection = getHorizontalScrollDirection(clientRect, pointerX);
            scrollNode = window;
        }
        if (scrollNode && (verticalScrollDirection !== this._verticalScrollDirection ||
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
        this._itemPositions = this._activeDraggables.map(drag => {
            const elementToMeasure = drag.getVisibleElement();
            return { drag, offset: 0, clientRect: getMutableClientRect(elementToMeasure) };
        }).sort((a, b) => {
            return isHorizontal ? a.clientRect.left - b.clientRect.left :
                a.clientRect.top - b.clientRect.top;
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
                rootElement.style.transform = '';
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
        let itemOffset = isHorizontal ? newPosition.left - currentPosition.left :
            newPosition.top - currentPosition.top;
        // Account for differences in the item width/height.
        if (delta === -1) {
            itemOffset += isHorizontal ? newPosition.width - currentPosition.width :
                newPosition.height - currentPosition.height;
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
        const index = findIndex(this._itemPositions, ({ drag, clientRect }, _, array) => {
            if (drag === item) {
                // If there's only one item left in the container, it must be
                // the dragged item itself so we use it as a reference.
                return array.length < 2;
            }
            if (delta) {
                const direction = isHorizontal ? delta.x : delta.y;
                // If the user is still hovering over the same item as last time, their cursor hasn't left
                // the item after we made the swap, and they didn't change the direction in which they're
                // dragging, we don't consider it a direction swap.
                if (drag === this._previousSwap.drag && this._previousSwap.overlaps &&
                    direction === this._previousSwap.delta) {
                    return false;
                }
            }
            return isHorizontal ?
                // Round these down since most browsers report client rects with
                // sub-pixel precision, whereas the pointer coordinates are rounded to pixels.
                pointerX >= Math.floor(clientRect.left) && pointerX < Math.floor(clientRect.right) :
                pointerY >= Math.floor(clientRect.top) && pointerY < Math.floor(clientRect.bottom);
        });
        return (index === -1 || !this.sortPredicate(index, item, this)) ? -1 : index;
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
        return isInsideClientRect(this._clientRect, x, y);
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
        if (!isInsideClientRect(this._clientRect, x, y) || !this.enterPredicate(item, this)) {
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
    _startReceiving(sibling) {
        const activeSiblings = this._activeSiblings;
        if (!activeSiblings.has(sibling)) {
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
        this._viewportScrollSubscription = this._dragDropRegistry.scroll.subscribe(event => {
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
            this._cachedShadowRoot = shadowRoot || this._document;
        }
        return this._cachedShadowRoot;
    }
}
/**
 * Finds the index of an item that matches a predicate function. Used as an equivalent
 * of `Array.prototype.findIndex` which isn't part of the standard Google typings.
 * @param array Array in which to look for matches.
 * @param predicate Function used to determine whether an item is a match.
 */
function findIndex(array, predicate) {
    for (let i = 0; i < array.length; i++) {
        if (predicate(array[i], i, array)) {
            return i;
        }
    }
    return -1;
}
/**
 * Increments the vertical scroll position of a node.
 * @param node Node whose scroll position should change.
 * @param amount Amount of pixels that the `node` should be scrolled.
 */
function incrementVerticalScroll(node, amount) {
    if (node === window) {
        node.scrollBy(0, amount);
    }
    else {
        // Ideally we could use `Element.scrollBy` here as well, but IE and Edge don't support it.
        node.scrollTop += amount;
    }
}
/**
 * Increments the horizontal scroll position of a node.
 * @param node Node whose scroll position should change.
 * @param amount Amount of pixels that the `node` should be scrolled.
 */
function incrementHorizontalScroll(node, amount) {
    if (node === window) {
        node.scrollBy(amount, 0);
    }
    else {
        // Ideally we could use `Element.scrollBy` here as well, but IE and Edge don't support it.
        node.scrollLeft += amount;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LXJlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2Ryb3AtbGlzdC1yZWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBSUgsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRXBELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsT0FBTyxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsdUJBQXVCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDOUUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFHN0MsT0FBTyxFQUNMLHVCQUF1QixFQUN2QixnQkFBZ0IsRUFDaEIsb0JBQW9CLEVBQ3BCLGtCQUFrQixHQUNuQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUdoRTs7O0dBR0c7QUFDSCxNQUFNLHdCQUF3QixHQUFHLElBQUksQ0FBQztBQUV0Qzs7O0dBR0c7QUFDSCxNQUFNLDBCQUEwQixHQUFHLElBQUksQ0FBQztBQUV4Qzs7O0dBR0c7QUFDSCxNQUFNLGdCQUFnQixHQUFHLENBQUMsQ0FBQztBQTRCM0I7O0dBRUc7QUFDSCxNQUFNLE9BQU8sV0FBVztJQW9JdEIsWUFDRSxPQUE4QyxFQUN0QyxpQkFBeUQsRUFDakUsU0FBYyxFQUNOLE9BQWUsRUFDZixjQUE2QjtRQUg3QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQXdDO1FBRXpELFlBQU8sR0FBUCxPQUFPLENBQVE7UUFDZixtQkFBYyxHQUFkLGNBQWMsQ0FBZTtRQXJJdkMsNEVBQTRFO1FBQzVFLGFBQVEsR0FBWSxLQUFLLENBQUM7UUFFMUIseURBQXlEO1FB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QUFnQixFQUNoRyxRQUFnQjtJQUNoQixNQUFNLGdCQUFnQixHQUFHLDBCQUEwQixDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUMxRSxNQUFNLGtCQUFrQixHQUFHLDRCQUE0QixDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUM5RSxJQUFJLHVCQUF1QixlQUFtQyxDQUFDO0lBQy9ELElBQUkseUJBQXlCLGVBQXFDLENBQUM7SUFFbkUsOEZBQThGO0lBQzlGLDhGQUE4RjtJQUM5Riw2RkFBNkY7SUFDN0YsOEZBQThGO0lBQzlGLElBQUksZ0JBQWdCLEVBQUU7UUFDcEIsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQztRQUVwQyxJQUFJLGdCQUFnQixlQUFtQyxFQUFFO1lBQ3ZELElBQUksU0FBUyxHQUFHLENBQUMsRUFBRTtnQkFDakIsdUJBQXVCLGFBQWlDLENBQUM7YUFDMUQ7U0FDRjthQUFNLElBQUksT0FBTyxDQUFDLFlBQVksR0FBRyxTQUFTLEdBQUcsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUNsRSx1QkFBdUIsZUFBbUMsQ0FBQztTQUM1RDtLQUNGO0lBRUQsSUFBSSxrQkFBa0IsRUFBRTtRQUN0QixNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO1FBRXRDLElBQUksa0JBQWtCLGlCQUF1QyxFQUFFO1lBQzdELElBQUksVUFBVSxHQUFHLENBQUMsRUFBRTtnQkFDbEIseUJBQXlCLGVBQXFDLENBQUM7YUFDaEU7U0FDRjthQUFNLElBQUksT0FBTyxDQUFDLFdBQVcsR0FBRyxVQUFVLEdBQUcsT0FBTyxDQUFDLFdBQVcsRUFBRTtZQUNqRSx5QkFBeUIsZ0JBQXNDLENBQUM7U0FDakU7S0FDRjtJQUVELE9BQU8sQ0FBQyx1QkFBdUIsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO0FBQzlELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtFbGVtZW50UmVmLCBOZ1pvbmV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtEaXJlY3Rpb259IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7Y29lcmNlRWxlbWVudH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7Vmlld3BvcnRSdWxlcn0gZnJvbSAnQGFuZ3VsYXIvY2RrL3Njcm9sbGluZyc7XG5pbXBvcnQge19nZXRTaGFkb3dSb290fSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtTdWJqZWN0LCBTdWJzY3JpcHRpb24sIGludGVydmFsLCBhbmltYXRpb25GcmFtZVNjaGVkdWxlcn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3Rha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHttb3ZlSXRlbUluQXJyYXl9IGZyb20gJy4vZHJhZy11dGlscyc7XG5pbXBvcnQge0RyYWdEcm9wUmVnaXN0cnl9IGZyb20gJy4vZHJhZy1kcm9wLXJlZ2lzdHJ5JztcbmltcG9ydCB7RHJhZ1JlZkludGVybmFsIGFzIERyYWdSZWYsIFBvaW50fSBmcm9tICcuL2RyYWctcmVmJztcbmltcG9ydCB7XG4gIGlzUG9pbnRlck5lYXJDbGllbnRSZWN0LFxuICBhZGp1c3RDbGllbnRSZWN0LFxuICBnZXRNdXRhYmxlQ2xpZW50UmVjdCxcbiAgaXNJbnNpZGVDbGllbnRSZWN0LFxufSBmcm9tICcuL2NsaWVudC1yZWN0JztcbmltcG9ydCB7UGFyZW50UG9zaXRpb25UcmFja2VyfSBmcm9tICcuL3BhcmVudC1wb3NpdGlvbi10cmFja2VyJztcbmltcG9ydCB7RHJhZ0NTU1N0eWxlRGVjbGFyYXRpb259IGZyb20gJy4vZHJhZy1zdHlsaW5nJztcblxuLyoqXG4gKiBQcm94aW1pdHksIGFzIGEgcmF0aW8gdG8gd2lkdGgvaGVpZ2h0LCBhdCB3aGljaCBhXG4gKiBkcmFnZ2VkIGl0ZW0gd2lsbCBhZmZlY3QgdGhlIGRyb3AgY29udGFpbmVyLlxuICovXG5jb25zdCBEUk9QX1BST1hJTUlUWV9USFJFU0hPTEQgPSAwLjA1O1xuXG4vKipcbiAqIFByb3hpbWl0eSwgYXMgYSByYXRpbyB0byB3aWR0aC9oZWlnaHQgYXQgd2hpY2ggdG8gc3RhcnQgYXV0by1zY3JvbGxpbmcgdGhlIGRyb3AgbGlzdCBvciB0aGVcbiAqIHZpZXdwb3J0LiBUaGUgdmFsdWUgY29tZXMgZnJvbSB0cnlpbmcgaXQgb3V0IG1hbnVhbGx5IHVudGlsIGl0IGZlZWxzIHJpZ2h0LlxuICovXG5jb25zdCBTQ1JPTExfUFJPWElNSVRZX1RIUkVTSE9MRCA9IDAuMDU7XG5cbi8qKlxuICogTnVtYmVyIG9mIHBpeGVscyB0byBzY3JvbGwgZm9yIGVhY2ggZnJhbWUgd2hlbiBhdXRvLXNjcm9sbGluZyBhbiBlbGVtZW50LlxuICogVGhlIHZhbHVlIGNvbWVzIGZyb20gdHJ5aW5nIGl0IG91dCBtYW51YWxseSB1bnRpbCBpdCBmZWVscyByaWdodC5cbiAqL1xuY29uc3QgQVVUT19TQ1JPTExfU1RFUCA9IDI7XG5cbi8qKlxuICogRW50cnkgaW4gdGhlIHBvc2l0aW9uIGNhY2hlIGZvciBkcmFnZ2FibGUgaXRlbXMuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmludGVyZmFjZSBDYWNoZWRJdGVtUG9zaXRpb24ge1xuICAvKiogSW5zdGFuY2Ugb2YgdGhlIGRyYWcgaXRlbS4gKi9cbiAgZHJhZzogRHJhZ1JlZjtcbiAgLyoqIERpbWVuc2lvbnMgb2YgdGhlIGl0ZW0uICovXG4gIGNsaWVudFJlY3Q6IENsaWVudFJlY3Q7XG4gIC8qKiBBbW91bnQgYnkgd2hpY2ggdGhlIGl0ZW0gaGFzIGJlZW4gbW92ZWQgc2luY2UgZHJhZ2dpbmcgc3RhcnRlZC4gKi9cbiAgb2Zmc2V0OiBudW1iZXI7XG59XG5cbi8qKiBWZXJ0aWNhbCBkaXJlY3Rpb24gaW4gd2hpY2ggd2UgY2FuIGF1dG8tc2Nyb2xsLiAqL1xuY29uc3QgZW51bSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24ge05PTkUsIFVQLCBET1dOfVxuXG4vKiogSG9yaXpvbnRhbCBkaXJlY3Rpb24gaW4gd2hpY2ggd2UgY2FuIGF1dG8tc2Nyb2xsLiAqL1xuY29uc3QgZW51bSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbiB7Tk9ORSwgTEVGVCwgUklHSFR9XG5cbi8qKlxuICogSW50ZXJuYWwgY29tcGlsZS10aW1lLW9ubHkgcmVwcmVzZW50YXRpb24gb2YgYSBgRHJvcExpc3RSZWZgLlxuICogVXNlZCB0byBhdm9pZCBjaXJjdWxhciBpbXBvcnQgaXNzdWVzIGJldHdlZW4gdGhlIGBEcm9wTGlzdFJlZmAgYW5kIHRoZSBgRHJhZ1JlZmAuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRHJvcExpc3RSZWZJbnRlcm5hbCBleHRlbmRzIERyb3BMaXN0UmVmIHt9XG5cbi8qKlxuICogUmVmZXJlbmNlIHRvIGEgZHJvcCBsaXN0LiBVc2VkIHRvIG1hbmlwdWxhdGUgb3IgZGlzcG9zZSBvZiB0aGUgY29udGFpbmVyLlxuICovXG5leHBvcnQgY2xhc3MgRHJvcExpc3RSZWY8VCA9IGFueT4ge1xuICAvKiogRWxlbWVudCB0aGF0IHRoZSBkcm9wIGxpc3QgaXMgYXR0YWNoZWQgdG8uICovXG4gIGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD47XG5cbiAgLyoqIFdoZXRoZXIgc3RhcnRpbmcgYSBkcmFnZ2luZyBzZXF1ZW5jZSBmcm9tIHRoaXMgY29udGFpbmVyIGlzIGRpc2FibGVkLiAqL1xuICBkaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIHNvcnRpbmcgaXRlbXMgd2l0aGluIHRoZSBsaXN0IGlzIGRpc2FibGVkLiAqL1xuICBzb3J0aW5nRGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogTG9ja3MgdGhlIHBvc2l0aW9uIG9mIHRoZSBkcmFnZ2FibGUgZWxlbWVudHMgaW5zaWRlIHRoZSBjb250YWluZXIgYWxvbmcgdGhlIHNwZWNpZmllZCBheGlzLiAqL1xuICBsb2NrQXhpczogJ3gnIHwgJ3knO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIGF1dG8tc2Nyb2xsaW5nIHRoZSB2aWV3IHdoZW4gdGhlIHVzZXJcbiAgICogbW92ZXMgdGhlaXIgcG9pbnRlciBjbG9zZSB0byB0aGUgZWRnZXMgaXMgZGlzYWJsZWQuXG4gICAqL1xuICBhdXRvU2Nyb2xsRGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKipcbiAgICogRnVuY3Rpb24gdGhhdCBpcyB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIGFuIGl0ZW1cbiAgICogaXMgYWxsb3dlZCB0byBiZSBtb3ZlZCBpbnRvIGEgZHJvcCBjb250YWluZXIuXG4gICAqL1xuICBlbnRlclByZWRpY2F0ZTogKGRyYWc6IERyYWdSZWYsIGRyb3A6IERyb3BMaXN0UmVmKSA9PiBib29sZWFuID0gKCkgPT4gdHJ1ZTtcblxuICAvKiogRnVuY3Rpb25zIHRoYXQgaXMgdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBhbiBpdGVtIGNhbiBiZSBzb3J0ZWQgaW50byBhIHBhcnRpY3VsYXIgaW5kZXguICovXG4gIHNvcnRQcmVkaWNhdGU6IChpbmRleDogbnVtYmVyLCBkcmFnOiBEcmFnUmVmLCBkcm9wOiBEcm9wTGlzdFJlZikgPT4gYm9vbGVhbiA9ICgpID0+IHRydWU7XG5cbiAgLyoqIEVtaXRzIHJpZ2h0IGJlZm9yZSBkcmFnZ2luZyBoYXMgc3RhcnRlZC4gKi9cbiAgYmVmb3JlU3RhcnRlZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqXG4gICAqIEVtaXRzIHdoZW4gdGhlIHVzZXIgaGFzIG1vdmVkIGEgbmV3IGRyYWcgaXRlbSBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKi9cbiAgZW50ZXJlZCA9IG5ldyBTdWJqZWN0PHtpdGVtOiBEcmFnUmVmLCBjb250YWluZXI6IERyb3BMaXN0UmVmLCBjdXJyZW50SW5kZXg6IG51bWJlcn0+KCk7XG5cbiAgLyoqXG4gICAqIEVtaXRzIHdoZW4gdGhlIHVzZXIgcmVtb3ZlcyBhbiBpdGVtIGZyb20gdGhlIGNvbnRhaW5lclxuICAgKiBieSBkcmFnZ2luZyBpdCBpbnRvIGFub3RoZXIgY29udGFpbmVyLlxuICAgKi9cbiAgZXhpdGVkID0gbmV3IFN1YmplY3Q8e2l0ZW06IERyYWdSZWYsIGNvbnRhaW5lcjogRHJvcExpc3RSZWZ9PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGRyb3BzIGFuIGl0ZW0gaW5zaWRlIHRoZSBjb250YWluZXIuICovXG4gIGRyb3BwZWQgPSBuZXcgU3ViamVjdDx7XG4gICAgaXRlbTogRHJhZ1JlZixcbiAgICBjdXJyZW50SW5kZXg6IG51bWJlcixcbiAgICBwcmV2aW91c0luZGV4OiBudW1iZXIsXG4gICAgY29udGFpbmVyOiBEcm9wTGlzdFJlZixcbiAgICBwcmV2aW91c0NvbnRhaW5lcjogRHJvcExpc3RSZWYsXG4gICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcjogYm9vbGVhbixcbiAgICBkaXN0YW5jZTogUG9pbnQ7XG4gIH0+KCk7XG5cbiAgLyoqIEVtaXRzIGFzIHRoZSB1c2VyIGlzIHN3YXBwaW5nIGl0ZW1zIHdoaWxlIGFjdGl2ZWx5IGRyYWdnaW5nLiAqL1xuICBzb3J0ZWQgPSBuZXcgU3ViamVjdDx7XG4gICAgcHJldmlvdXNJbmRleDogbnVtYmVyLFxuICAgIGN1cnJlbnRJbmRleDogbnVtYmVyLFxuICAgIGNvbnRhaW5lcjogRHJvcExpc3RSZWYsXG4gICAgaXRlbTogRHJhZ1JlZlxuICB9PigpO1xuXG4gIC8qKiBBcmJpdHJhcnkgZGF0YSB0aGF0IGNhbiBiZSBhdHRhY2hlZCB0byB0aGUgZHJvcCBsaXN0LiAqL1xuICBkYXRhOiBUO1xuXG4gIC8qKiBXaGV0aGVyIGFuIGl0ZW0gaW4gdGhlIGxpc3QgaXMgYmVpbmcgZHJhZ2dlZC4gKi9cbiAgcHJpdmF0ZSBfaXNEcmFnZ2luZyA9IGZhbHNlO1xuXG4gIC8qKiBDYWNoZSBvZiB0aGUgZGltZW5zaW9ucyBvZiBhbGwgdGhlIGl0ZW1zIGluc2lkZSB0aGUgY29udGFpbmVyLiAqL1xuICBwcml2YXRlIF9pdGVtUG9zaXRpb25zOiBDYWNoZWRJdGVtUG9zaXRpb25bXSA9IFtdO1xuXG4gIC8qKiBLZWVwcyB0cmFjayBvZiB0aGUgcG9zaXRpb25zIG9mIGFueSBwYXJlbnQgc2Nyb2xsYWJsZSBlbGVtZW50cy4gKi9cbiAgcHJpdmF0ZSBfcGFyZW50UG9zaXRpb25zOiBQYXJlbnRQb3NpdGlvblRyYWNrZXI7XG5cbiAgLyoqIENhY2hlZCBgQ2xpZW50UmVjdGAgb2YgdGhlIGRyb3AgbGlzdC4gKi9cbiAgcHJpdmF0ZSBfY2xpZW50UmVjdDogQ2xpZW50UmVjdDtcblxuICAvKipcbiAgICogRHJhZ2dhYmxlIGl0ZW1zIHRoYXQgYXJlIGN1cnJlbnRseSBhY3RpdmUgaW5zaWRlIHRoZSBjb250YWluZXIuIEluY2x1ZGVzIHRoZSBpdGVtc1xuICAgKiBmcm9tIGBfZHJhZ2dhYmxlc2AsIGFzIHdlbGwgYXMgYW55IGl0ZW1zIHRoYXQgaGF2ZSBiZWVuIGRyYWdnZWQgaW4sIGJ1dCBoYXZlbid0XG4gICAqIGJlZW4gZHJvcHBlZCB5ZXQuXG4gICAqL1xuICBwcml2YXRlIF9hY3RpdmVEcmFnZ2FibGVzOiBEcmFnUmVmW107XG5cbiAgLyoqXG4gICAqIEtlZXBzIHRyYWNrIG9mIHRoZSBpdGVtIHRoYXQgd2FzIGxhc3Qgc3dhcHBlZCB3aXRoIHRoZSBkcmFnZ2VkIGl0ZW0sIGFzIHdlbGwgYXMgd2hhdCBkaXJlY3Rpb25cbiAgICogdGhlIHBvaW50ZXIgd2FzIG1vdmluZyBpbiB3aGVuIHRoZSBzd2FwIG9jY3VyZWQgYW5kIHdoZXRoZXIgdGhlIHVzZXIncyBwb2ludGVyIGNvbnRpbnVlZCB0b1xuICAgKiBvdmVybGFwIHdpdGggdGhlIHN3YXBwZWQgaXRlbSBhZnRlciB0aGUgc3dhcHBpbmcgb2NjdXJyZWQuXG4gICAqL1xuICBwcml2YXRlIF9wcmV2aW91c1N3YXAgPSB7ZHJhZzogbnVsbCBhcyBEcmFnUmVmIHwgbnVsbCwgZGVsdGE6IDAsIG92ZXJsYXBzOiBmYWxzZX07XG5cbiAgLyoqIERyYWdnYWJsZSBpdGVtcyBpbiB0aGUgY29udGFpbmVyLiAqL1xuICBwcml2YXRlIF9kcmFnZ2FibGVzOiBSZWFkb25seUFycmF5PERyYWdSZWY+O1xuXG4gIC8qKiBEcm9wIGxpc3RzIHRoYXQgYXJlIGNvbm5lY3RlZCB0byB0aGUgY3VycmVudCBvbmUuICovXG4gIHByaXZhdGUgX3NpYmxpbmdzOiBSZWFkb25seUFycmF5PERyb3BMaXN0UmVmPiA9IFtdO1xuXG4gIC8qKiBEaXJlY3Rpb24gaW4gd2hpY2ggdGhlIGxpc3QgaXMgb3JpZW50ZWQuICovXG4gIHByaXZhdGUgX29yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcgfCAndmVydGljYWwnID0gJ3ZlcnRpY2FsJztcblxuICAvKiogQ29ubmVjdGVkIHNpYmxpbmdzIHRoYXQgY3VycmVudGx5IGhhdmUgYSBkcmFnZ2VkIGl0ZW0uICovXG4gIHByaXZhdGUgX2FjdGl2ZVNpYmxpbmdzID0gbmV3IFNldDxEcm9wTGlzdFJlZj4oKTtcblxuICAvKiogTGF5b3V0IGRpcmVjdGlvbiBvZiB0aGUgZHJvcCBsaXN0LiAqL1xuICBwcml2YXRlIF9kaXJlY3Rpb246IERpcmVjdGlvbiA9ICdsdHInO1xuXG4gIC8qKiBTdWJzY3JpcHRpb24gdG8gdGhlIHdpbmRvdyBiZWluZyBzY3JvbGxlZC4gKi9cbiAgcHJpdmF0ZSBfdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG5cbiAgLyoqIFZlcnRpY2FsIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgbGlzdCBpcyBjdXJyZW50bHkgc2Nyb2xsaW5nLiAqL1xuICBwcml2YXRlIF92ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5OT05FO1xuXG4gIC8qKiBIb3Jpem9udGFsIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgbGlzdCBpcyBjdXJyZW50bHkgc2Nyb2xsaW5nLiAqL1xuICBwcml2YXRlIF9ob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTk9ORTtcblxuICAvKiogTm9kZSB0aGF0IGlzIGJlaW5nIGF1dG8tc2Nyb2xsZWQuICovXG4gIHByaXZhdGUgX3Njcm9sbE5vZGU6IEhUTUxFbGVtZW50IHwgV2luZG93O1xuXG4gIC8qKiBVc2VkIHRvIHNpZ25hbCB0byB0aGUgY3VycmVudCBhdXRvLXNjcm9sbCBzZXF1ZW5jZSB3aGVuIHRvIHN0b3AuICovXG4gIHByaXZhdGUgX3N0b3BTY3JvbGxUaW1lcnMgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBTaGFkb3cgcm9vdCBvZiB0aGUgY3VycmVudCBlbGVtZW50LiBOZWNlc3NhcnkgZm9yIGBlbGVtZW50RnJvbVBvaW50YCB0byByZXNvbHZlIGNvcnJlY3RseS4gKi9cbiAgcHJpdmF0ZSBfY2FjaGVkU2hhZG93Um9vdDogRG9jdW1lbnRPclNoYWRvd1Jvb3QgfCBudWxsID0gbnVsbDtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSBkb2N1bWVudC4gKi9cbiAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50O1xuXG4gIC8qKiBFbGVtZW50cyB0aGF0IGNhbiBiZSBzY3JvbGxlZCB3aGlsZSB0aGUgdXNlciBpcyBkcmFnZ2luZy4gKi9cbiAgcHJpdmF0ZSBfc2Nyb2xsYWJsZUVsZW1lbnRzOiBIVE1MRWxlbWVudFtdO1xuXG4gIC8qKiBJbml0aWFsIHZhbHVlIGZvciB0aGUgZWxlbWVudCdzIGBzY3JvbGwtc25hcC10eXBlYCBzdHlsZS4gKi9cbiAgcHJpdmF0ZSBfaW5pdGlhbFNjcm9sbFNuYXA6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihcbiAgICBlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiB8IEhUTUxFbGVtZW50LFxuICAgIHByaXZhdGUgX2RyYWdEcm9wUmVnaXN0cnk6IERyYWdEcm9wUmVnaXN0cnk8RHJhZ1JlZiwgRHJvcExpc3RSZWY+LFxuICAgIF9kb2N1bWVudDogYW55LFxuICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgIHByaXZhdGUgX3ZpZXdwb3J0UnVsZXI6IFZpZXdwb3J0UnVsZXIpIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnQpO1xuICAgIHRoaXMuX2RvY3VtZW50ID0gX2RvY3VtZW50O1xuICAgIHRoaXMud2l0aFNjcm9sbGFibGVQYXJlbnRzKFt0aGlzLmVsZW1lbnRdKTtcbiAgICBfZHJhZ0Ryb3BSZWdpc3RyeS5yZWdpc3RlckRyb3BDb250YWluZXIodGhpcyk7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zID0gbmV3IFBhcmVudFBvc2l0aW9uVHJhY2tlcihfZG9jdW1lbnQsIF92aWV3cG9ydFJ1bGVyKTtcbiAgfVxuXG4gIC8qKiBSZW1vdmVzIHRoZSBkcm9wIGxpc3QgZnVuY3Rpb25hbGl0eSBmcm9tIHRoZSBET00gZWxlbWVudC4gKi9cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLl9zdG9wU2Nyb2xsaW5nKCk7XG4gICAgdGhpcy5fc3RvcFNjcm9sbFRpbWVycy5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5iZWZvcmVTdGFydGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5lbnRlcmVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5leGl0ZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmRyb3BwZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLnNvcnRlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX2FjdGl2ZVNpYmxpbmdzLmNsZWFyKCk7XG4gICAgdGhpcy5fc2Nyb2xsTm9kZSA9IG51bGwhO1xuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5jbGVhcigpO1xuICAgIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkucmVtb3ZlRHJvcENvbnRhaW5lcih0aGlzKTtcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIGFuIGl0ZW0gZnJvbSB0aGlzIGxpc3QgaXMgY3VycmVudGx5IGJlaW5nIGRyYWdnZWQuICovXG4gIGlzRHJhZ2dpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lzRHJhZ2dpbmc7XG4gIH1cblxuICAvKiogU3RhcnRzIGRyYWdnaW5nIGFuIGl0ZW0uICovXG4gIHN0YXJ0KCk6IHZvaWQge1xuICAgIGNvbnN0IHN0eWxlcyA9IGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KS5zdHlsZSBhcyBEcmFnQ1NTU3R5bGVEZWNsYXJhdGlvbjtcbiAgICB0aGlzLmJlZm9yZVN0YXJ0ZWQubmV4dCgpO1xuICAgIHRoaXMuX2lzRHJhZ2dpbmcgPSB0cnVlO1xuXG4gICAgLy8gV2UgbmVlZCB0byBkaXNhYmxlIHNjcm9sbCBzbmFwcGluZyB3aGlsZSB0aGUgdXNlciBpcyBkcmFnZ2luZywgYmVjYXVzZSBpdCBicmVha3MgYXV0b21hdGljXG4gICAgLy8gc2Nyb2xsaW5nLiBUaGUgYnJvd3NlciBzZWVtcyB0byByb3VuZCB0aGUgdmFsdWUgYmFzZWQgb24gdGhlIHNuYXBwaW5nIHBvaW50cyB3aGljaCBtZWFuc1xuICAgIC8vIHRoYXQgd2UgY2FuJ3QgaW5jcmVtZW50L2RlY3JlbWVudCB0aGUgc2Nyb2xsIHBvc2l0aW9uLlxuICAgIHRoaXMuX2luaXRpYWxTY3JvbGxTbmFwID0gc3R5bGVzLm1zU2Nyb2xsU25hcFR5cGUgfHwgc3R5bGVzLnNjcm9sbFNuYXBUeXBlIHx8ICcnO1xuICAgIHN0eWxlcy5zY3JvbGxTbmFwVHlwZSA9IHN0eWxlcy5tc1Njcm9sbFNuYXBUeXBlID0gJ25vbmUnO1xuICAgIHRoaXMuX2NhY2hlSXRlbXMoKTtcbiAgICB0aGlzLl9zaWJsaW5ncy5mb3JFYWNoKHNpYmxpbmcgPT4gc2libGluZy5fc3RhcnRSZWNlaXZpbmcodGhpcykpO1xuICAgIHRoaXMuX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fbGlzdGVuVG9TY3JvbGxFdmVudHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbWl0cyBhbiBldmVudCB0byBpbmRpY2F0ZSB0aGF0IHRoZSB1c2VyIG1vdmVkIGFuIGl0ZW0gaW50byB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRoYXQgd2FzIG1vdmVkIGludG8gdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKiBAcGFyYW0gaW5kZXggSW5kZXggYXQgd2hpY2ggdGhlIGl0ZW0gZW50ZXJlZC4gSWYgb21pdHRlZCwgdGhlIGNvbnRhaW5lciB3aWxsIHRyeSB0byBmaWd1cmUgaXRcbiAgICogICBvdXQgYXV0b21hdGljYWxseS5cbiAgICovXG4gIGVudGVyKGl0ZW06IERyYWdSZWYsIHBvaW50ZXJYOiBudW1iZXIsIHBvaW50ZXJZOiBudW1iZXIsIGluZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy5zdGFydCgpO1xuXG4gICAgLy8gSWYgc29ydGluZyBpcyBkaXNhYmxlZCwgd2Ugd2FudCB0aGUgaXRlbSB0byByZXR1cm4gdG8gaXRzIHN0YXJ0aW5nXG4gICAgLy8gcG9zaXRpb24gaWYgdGhlIHVzZXIgaXMgcmV0dXJuaW5nIGl0IHRvIGl0cyBpbml0aWFsIGNvbnRhaW5lci5cbiAgICBsZXQgbmV3SW5kZXg6IG51bWJlcjtcblxuICAgIGlmIChpbmRleCA9PSBudWxsKSB7XG4gICAgICBuZXdJbmRleCA9IHRoaXMuc29ydGluZ0Rpc2FibGVkID8gdGhpcy5fZHJhZ2dhYmxlcy5pbmRleE9mKGl0ZW0pIDogLTE7XG5cbiAgICAgIGlmIChuZXdJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgLy8gV2UgdXNlIHRoZSBjb29yZGluYXRlcyBvZiB3aGVyZSB0aGUgaXRlbSBlbnRlcmVkIHRoZSBkcm9wXG4gICAgICAgIC8vIHpvbmUgdG8gZmlndXJlIG91dCBhdCB3aGljaCBpbmRleCBpdCBzaG91bGQgYmUgaW5zZXJ0ZWQuXG4gICAgICAgIG5ld0luZGV4ID0gdGhpcy5fZ2V0SXRlbUluZGV4RnJvbVBvaW50ZXJQb3NpdGlvbihpdGVtLCBwb2ludGVyWCwgcG9pbnRlclkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBuZXdJbmRleCA9IGluZGV4O1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGl2ZURyYWdnYWJsZXMgPSB0aGlzLl9hY3RpdmVEcmFnZ2FibGVzO1xuICAgIGNvbnN0IGN1cnJlbnRJbmRleCA9IGFjdGl2ZURyYWdnYWJsZXMuaW5kZXhPZihpdGVtKTtcbiAgICBjb25zdCBwbGFjZWhvbGRlciA9IGl0ZW0uZ2V0UGxhY2Vob2xkZXJFbGVtZW50KCk7XG4gICAgbGV0IG5ld1Bvc2l0aW9uUmVmZXJlbmNlOiBEcmFnUmVmIHwgdW5kZWZpbmVkID0gYWN0aXZlRHJhZ2dhYmxlc1tuZXdJbmRleF07XG5cbiAgICAvLyBJZiB0aGUgaXRlbSBhdCB0aGUgbmV3IHBvc2l0aW9uIGlzIHRoZSBzYW1lIGFzIHRoZSBpdGVtIHRoYXQgaXMgYmVpbmcgZHJhZ2dlZCxcbiAgICAvLyBpdCBtZWFucyB0aGF0IHdlJ3JlIHRyeWluZyB0byByZXN0b3JlIHRoZSBpdGVtIHRvIGl0cyBpbml0aWFsIHBvc2l0aW9uLiBJbiB0aGlzXG4gICAgLy8gY2FzZSB3ZSBzaG91bGQgdXNlIHRoZSBuZXh0IGl0ZW0gZnJvbSB0aGUgbGlzdCBhcyB0aGUgcmVmZXJlbmNlLlxuICAgIGlmIChuZXdQb3NpdGlvblJlZmVyZW5jZSA9PT0gaXRlbSkge1xuICAgICAgbmV3UG9zaXRpb25SZWZlcmVuY2UgPSBhY3RpdmVEcmFnZ2FibGVzW25ld0luZGV4ICsgMV07XG4gICAgfVxuXG4gICAgLy8gU2luY2UgdGhlIGl0ZW0gbWF5IGJlIGluIHRoZSBgYWN0aXZlRHJhZ2dhYmxlc2AgYWxyZWFkeSAoZS5nLiBpZiB0aGUgdXNlciBkcmFnZ2VkIGl0XG4gICAgLy8gaW50byBhbm90aGVyIGNvbnRhaW5lciBhbmQgYmFjayBhZ2FpbiksIHdlIGhhdmUgdG8gZW5zdXJlIHRoYXQgaXQgaXNuJ3QgZHVwbGljYXRlZC5cbiAgICBpZiAoY3VycmVudEluZGV4ID4gLTEpIHtcbiAgICAgIGFjdGl2ZURyYWdnYWJsZXMuc3BsaWNlKGN1cnJlbnRJbmRleCwgMSk7XG4gICAgfVxuXG4gICAgLy8gRG9uJ3QgdXNlIGl0ZW1zIHRoYXQgYXJlIGJlaW5nIGRyYWdnZWQgYXMgYSByZWZlcmVuY2UsIGJlY2F1c2VcbiAgICAvLyB0aGVpciBlbGVtZW50IGhhcyBiZWVuIG1vdmVkIGRvd24gdG8gdGhlIGJvdHRvbSBvZiB0aGUgYm9keS5cbiAgICBpZiAobmV3UG9zaXRpb25SZWZlcmVuY2UgJiYgIXRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuaXNEcmFnZ2luZyhuZXdQb3NpdGlvblJlZmVyZW5jZSkpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBuZXdQb3NpdGlvblJlZmVyZW5jZS5nZXRSb290RWxlbWVudCgpO1xuICAgICAgZWxlbWVudC5wYXJlbnRFbGVtZW50IS5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXIsIGVsZW1lbnQpO1xuICAgICAgYWN0aXZlRHJhZ2dhYmxlcy5zcGxpY2UobmV3SW5kZXgsIDAsIGl0ZW0pO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fc2hvdWxkRW50ZXJBc0ZpcnN0Q2hpbGQocG9pbnRlclgsIHBvaW50ZXJZKSkge1xuICAgICAgY29uc3QgcmVmZXJlbmNlID0gYWN0aXZlRHJhZ2dhYmxlc1swXS5nZXRSb290RWxlbWVudCgpO1xuICAgICAgcmVmZXJlbmNlLnBhcmVudE5vZGUhLmluc2VydEJlZm9yZShwbGFjZWhvbGRlciwgcmVmZXJlbmNlKTtcbiAgICAgIGFjdGl2ZURyYWdnYWJsZXMudW5zaGlmdChpdGVtKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpLmFwcGVuZENoaWxkKHBsYWNlaG9sZGVyKTtcbiAgICAgIGFjdGl2ZURyYWdnYWJsZXMucHVzaChpdGVtKTtcbiAgICB9XG5cbiAgICAvLyBUaGUgdHJhbnNmb3JtIG5lZWRzIHRvIGJlIGNsZWFyZWQgc28gaXQgZG9lc24ndCB0aHJvdyBvZmYgdGhlIG1lYXN1cmVtZW50cy5cbiAgICBwbGFjZWhvbGRlci5zdHlsZS50cmFuc2Zvcm0gPSAnJztcblxuICAgIC8vIE5vdGUgdGhhdCB0aGUgcG9zaXRpb25zIHdlcmUgYWxyZWFkeSBjYWNoZWQgd2hlbiB3ZSBjYWxsZWQgYHN0YXJ0YCBhYm92ZSxcbiAgICAvLyBidXQgd2UgbmVlZCB0byByZWZyZXNoIHRoZW0gc2luY2UgdGhlIGFtb3VudCBvZiBpdGVtcyBoYXMgY2hhbmdlZCBhbmQgYWxzbyBwYXJlbnQgcmVjdHMuXG4gICAgdGhpcy5fY2FjaGVJdGVtUG9zaXRpb25zKCk7XG4gICAgdGhpcy5fY2FjaGVQYXJlbnRQb3NpdGlvbnMoKTtcblxuICAgIHRoaXMuZW50ZXJlZC5uZXh0KHtpdGVtLCBjb250YWluZXI6IHRoaXMsIGN1cnJlbnRJbmRleDogdGhpcy5nZXRJdGVtSW5kZXgoaXRlbSl9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGFuIGl0ZW0gZnJvbSB0aGUgY29udGFpbmVyIGFmdGVyIGl0IHdhcyBkcmFnZ2VkIGludG8gYW5vdGhlciBjb250YWluZXIgYnkgdGhlIHVzZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdGhhdCB3YXMgZHJhZ2dlZCBvdXQuXG4gICAqL1xuICBleGl0KGl0ZW06IERyYWdSZWYpOiB2b2lkIHtcbiAgICB0aGlzLl9yZXNldCgpO1xuICAgIHRoaXMuZXhpdGVkLm5leHQoe2l0ZW0sIGNvbnRhaW5lcjogdGhpc30pO1xuICB9XG5cbiAgLyoqXG4gICAqIERyb3BzIGFuIGl0ZW0gaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSBiZWluZyBkcm9wcGVkIGludG8gdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGN1cnJlbnRJbmRleCBJbmRleCBhdCB3aGljaCB0aGUgaXRlbSBzaG91bGQgYmUgaW5zZXJ0ZWQuXG4gICAqIEBwYXJhbSBwcmV2aW91c0luZGV4IEluZGV4IG9mIHRoZSBpdGVtIHdoZW4gZHJhZ2dpbmcgc3RhcnRlZC5cbiAgICogQHBhcmFtIHByZXZpb3VzQ29udGFpbmVyIENvbnRhaW5lciBmcm9tIHdoaWNoIHRoZSBpdGVtIGdvdCBkcmFnZ2VkIGluLlxuICAgKiBAcGFyYW0gaXNQb2ludGVyT3ZlckNvbnRhaW5lciBXaGV0aGVyIHRoZSB1c2VyJ3MgcG9pbnRlciB3YXMgb3ZlciB0aGVcbiAgICogICAgY29udGFpbmVyIHdoZW4gdGhlIGl0ZW0gd2FzIGRyb3BwZWQuXG4gICAqIEBwYXJhbSBkaXN0YW5jZSBEaXN0YW5jZSB0aGUgdXNlciBoYXMgZHJhZ2dlZCBzaW5jZSB0aGUgc3RhcnQgb2YgdGhlIGRyYWdnaW5nIHNlcXVlbmNlLlxuICAgKi9cbiAgZHJvcChpdGVtOiBEcmFnUmVmLCBjdXJyZW50SW5kZXg6IG51bWJlciwgcHJldmlvdXNJbmRleDogbnVtYmVyLCBwcmV2aW91c0NvbnRhaW5lcjogRHJvcExpc3RSZWYsXG4gICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcjogYm9vbGVhbiwgZGlzdGFuY2U6IFBvaW50KTogdm9pZCB7XG4gICAgdGhpcy5fcmVzZXQoKTtcbiAgICB0aGlzLmRyb3BwZWQubmV4dCh7XG4gICAgICBpdGVtLFxuICAgICAgY3VycmVudEluZGV4LFxuICAgICAgcHJldmlvdXNJbmRleCxcbiAgICAgIGNvbnRhaW5lcjogdGhpcyxcbiAgICAgIHByZXZpb3VzQ29udGFpbmVyLFxuICAgICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcixcbiAgICAgIGRpc3RhbmNlXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZHJhZ2dhYmxlIGl0ZW1zIHRoYXQgYXJlIGEgcGFydCBvZiB0aGlzIGxpc3QuXG4gICAqIEBwYXJhbSBpdGVtcyBJdGVtcyB0aGF0IGFyZSBhIHBhcnQgb2YgdGhpcyBsaXN0LlxuICAgKi9cbiAgd2l0aEl0ZW1zKGl0ZW1zOiBEcmFnUmVmW10pOiB0aGlzIHtcbiAgICBjb25zdCBwcmV2aW91c0l0ZW1zID0gdGhpcy5fZHJhZ2dhYmxlcztcbiAgICB0aGlzLl9kcmFnZ2FibGVzID0gaXRlbXM7XG4gICAgaXRlbXMuZm9yRWFjaChpdGVtID0+IGl0ZW0uX3dpdGhEcm9wQ29udGFpbmVyKHRoaXMpKTtcblxuICAgIGlmICh0aGlzLmlzRHJhZ2dpbmcoKSkge1xuICAgICAgY29uc3QgZHJhZ2dlZEl0ZW1zID0gcHJldmlvdXNJdGVtcy5maWx0ZXIoaXRlbSA9PiBpdGVtLmlzRHJhZ2dpbmcoKSk7XG5cbiAgICAgIC8vIElmIGFsbCBvZiB0aGUgaXRlbXMgYmVpbmcgZHJhZ2dlZCB3ZXJlIHJlbW92ZWRcbiAgICAgIC8vIGZyb20gdGhlIGxpc3QsIGFib3J0IHRoZSBjdXJyZW50IGRyYWcgc2VxdWVuY2UuXG4gICAgICBpZiAoZHJhZ2dlZEl0ZW1zLmV2ZXJ5KGl0ZW0gPT4gaXRlbXMuaW5kZXhPZihpdGVtKSA9PT0gLTEpKSB7XG4gICAgICAgIHRoaXMuX3Jlc2V0KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9jYWNoZUl0ZW1zKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogU2V0cyB0aGUgbGF5b3V0IGRpcmVjdGlvbiBvZiB0aGUgZHJvcCBsaXN0LiAqL1xuICB3aXRoRGlyZWN0aW9uKGRpcmVjdGlvbjogRGlyZWN0aW9uKTogdGhpcyB7XG4gICAgdGhpcy5fZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGNvbnRhaW5lcnMgdGhhdCBhcmUgY29ubmVjdGVkIHRvIHRoaXMgb25lLiBXaGVuIHR3byBvciBtb3JlIGNvbnRhaW5lcnMgYXJlXG4gICAqIGNvbm5lY3RlZCwgdGhlIHVzZXIgd2lsbCBiZSBhbGxvd2VkIHRvIHRyYW5zZmVyIGl0ZW1zIGJldHdlZW4gdGhlbS5cbiAgICogQHBhcmFtIGNvbm5lY3RlZFRvIE90aGVyIGNvbnRhaW5lcnMgdGhhdCB0aGUgY3VycmVudCBjb250YWluZXJzIHNob3VsZCBiZSBjb25uZWN0ZWQgdG8uXG4gICAqL1xuICBjb25uZWN0ZWRUbyhjb25uZWN0ZWRUbzogRHJvcExpc3RSZWZbXSk6IHRoaXMge1xuICAgIHRoaXMuX3NpYmxpbmdzID0gY29ubmVjdGVkVG8uc2xpY2UoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBvcmllbnRhdGlvbiBvZiB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gb3JpZW50YXRpb24gTmV3IG9yaWVudGF0aW9uIGZvciB0aGUgY29udGFpbmVyLlxuICAgKi9cbiAgd2l0aE9yaWVudGF0aW9uKG9yaWVudGF0aW9uOiAndmVydGljYWwnIHwgJ2hvcml6b250YWwnKTogdGhpcyB7XG4gICAgdGhpcy5fb3JpZW50YXRpb24gPSBvcmllbnRhdGlvbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHdoaWNoIHBhcmVudCBlbGVtZW50cyBhcmUgY2FuIGJlIHNjcm9sbGVkIHdoaWxlIHRoZSB1c2VyIGlzIGRyYWdnaW5nLlxuICAgKiBAcGFyYW0gZWxlbWVudHMgRWxlbWVudHMgdGhhdCBjYW4gYmUgc2Nyb2xsZWQuXG4gICAqL1xuICB3aXRoU2Nyb2xsYWJsZVBhcmVudHMoZWxlbWVudHM6IEhUTUxFbGVtZW50W10pOiB0aGlzIHtcbiAgICBjb25zdCBlbGVtZW50ID0gY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpO1xuXG4gICAgLy8gV2UgYWx3YXlzIGFsbG93IHRoZSBjdXJyZW50IGVsZW1lbnQgdG8gYmUgc2Nyb2xsYWJsZVxuICAgIC8vIHNvIHdlIG5lZWQgdG8gZW5zdXJlIHRoYXQgaXQncyBpbiB0aGUgYXJyYXkuXG4gICAgdGhpcy5fc2Nyb2xsYWJsZUVsZW1lbnRzID1cbiAgICAgICAgZWxlbWVudHMuaW5kZXhPZihlbGVtZW50KSA9PT0gLTEgPyBbZWxlbWVudCwgLi4uZWxlbWVudHNdIDogZWxlbWVudHMuc2xpY2UoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBzY3JvbGxhYmxlIHBhcmVudHMgdGhhdCBhcmUgcmVnaXN0ZXJlZCB3aXRoIHRoaXMgZHJvcCBjb250YWluZXIuICovXG4gIGdldFNjcm9sbGFibGVQYXJlbnRzKCk6IFJlYWRvbmx5QXJyYXk8SFRNTEVsZW1lbnQ+IHtcbiAgICByZXR1cm4gdGhpcy5fc2Nyb2xsYWJsZUVsZW1lbnRzO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpZ3VyZXMgb3V0IHRoZSBpbmRleCBvZiBhbiBpdGVtIGluIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gd2hvc2UgaW5kZXggc2hvdWxkIGJlIGRldGVybWluZWQuXG4gICAqL1xuICBnZXRJdGVtSW5kZXgoaXRlbTogRHJhZ1JlZik6IG51bWJlciB7XG4gICAgaWYgKCF0aGlzLl9pc0RyYWdnaW5nKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZHJhZ2dhYmxlcy5pbmRleE9mKGl0ZW0pO1xuICAgIH1cblxuICAgIC8vIEl0ZW1zIGFyZSBzb3J0ZWQgYWx3YXlzIGJ5IHRvcC9sZWZ0IGluIHRoZSBjYWNoZSwgaG93ZXZlciB0aGV5IGZsb3cgZGlmZmVyZW50bHkgaW4gUlRMLlxuICAgIC8vIFRoZSByZXN0IG9mIHRoZSBsb2dpYyBzdGlsbCBzdGFuZHMgbm8gbWF0dGVyIHdoYXQgb3JpZW50YXRpb24gd2UncmUgaW4sIGhvd2V2ZXJcbiAgICAvLyB3ZSBuZWVkIHRvIGludmVydCB0aGUgYXJyYXkgd2hlbiBkZXRlcm1pbmluZyB0aGUgaW5kZXguXG4gICAgY29uc3QgaXRlbXMgPSB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnICYmIHRoaXMuX2RpcmVjdGlvbiA9PT0gJ3J0bCcgP1xuICAgICAgICB0aGlzLl9pdGVtUG9zaXRpb25zLnNsaWNlKCkucmV2ZXJzZSgpIDogdGhpcy5faXRlbVBvc2l0aW9ucztcblxuICAgIHJldHVybiBmaW5kSW5kZXgoaXRlbXMsIGN1cnJlbnRJdGVtID0+IGN1cnJlbnRJdGVtLmRyYWcgPT09IGl0ZW0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGxpc3QgaXMgYWJsZSB0byByZWNlaXZlIHRoZSBpdGVtIHRoYXRcbiAgICogaXMgY3VycmVudGx5IGJlaW5nIGRyYWdnZWQgaW5zaWRlIGEgY29ubmVjdGVkIGRyb3AgbGlzdC5cbiAgICovXG4gIGlzUmVjZWl2aW5nKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9hY3RpdmVTaWJsaW5ncy5zaXplID4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTb3J0cyBhbiBpdGVtIGluc2lkZSB0aGUgY29udGFpbmVyIGJhc2VkIG9uIGl0cyBwb3NpdGlvbi5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB0byBiZSBzb3J0ZWQuXG4gICAqIEBwYXJhbSBwb2ludGVyWCBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0gcG9pbnRlclkgUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFkgYXhpcy5cbiAgICogQHBhcmFtIHBvaW50ZXJEZWx0YSBEaXJlY3Rpb24gaW4gd2hpY2ggdGhlIHBvaW50ZXIgaXMgbW92aW5nIGFsb25nIGVhY2ggYXhpcy5cbiAgICovXG4gIF9zb3J0SXRlbShpdGVtOiBEcmFnUmVmLCBwb2ludGVyWDogbnVtYmVyLCBwb2ludGVyWTogbnVtYmVyLFxuICAgICAgICAgICAgcG9pbnRlckRlbHRhOiB7eDogbnVtYmVyLCB5OiBudW1iZXJ9KTogdm9pZCB7XG4gICAgLy8gRG9uJ3Qgc29ydCB0aGUgaXRlbSBpZiBzb3J0aW5nIGlzIGRpc2FibGVkIG9yIGl0J3Mgb3V0IG9mIHJhbmdlLlxuICAgIGlmICh0aGlzLnNvcnRpbmdEaXNhYmxlZCB8fFxuICAgICAgICAhaXNQb2ludGVyTmVhckNsaWVudFJlY3QodGhpcy5fY2xpZW50UmVjdCwgRFJPUF9QUk9YSU1JVFlfVEhSRVNIT0xELCBwb2ludGVyWCwgcG9pbnRlclkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc2libGluZ3MgPSB0aGlzLl9pdGVtUG9zaXRpb25zO1xuICAgIGNvbnN0IG5ld0luZGV4ID0gdGhpcy5fZ2V0SXRlbUluZGV4RnJvbVBvaW50ZXJQb3NpdGlvbihpdGVtLCBwb2ludGVyWCwgcG9pbnRlclksIHBvaW50ZXJEZWx0YSk7XG5cbiAgICBpZiAobmV3SW5kZXggPT09IC0xICYmIHNpYmxpbmdzLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuICAgIGNvbnN0IGN1cnJlbnRJbmRleCA9IGZpbmRJbmRleChzaWJsaW5ncywgY3VycmVudEl0ZW0gPT4gY3VycmVudEl0ZW0uZHJhZyA9PT0gaXRlbSk7XG4gICAgY29uc3Qgc2libGluZ0F0TmV3UG9zaXRpb24gPSBzaWJsaW5nc1tuZXdJbmRleF07XG4gICAgY29uc3QgY3VycmVudFBvc2l0aW9uID0gc2libGluZ3NbY3VycmVudEluZGV4XS5jbGllbnRSZWN0O1xuICAgIGNvbnN0IG5ld1Bvc2l0aW9uID0gc2libGluZ0F0TmV3UG9zaXRpb24uY2xpZW50UmVjdDtcbiAgICBjb25zdCBkZWx0YSA9IGN1cnJlbnRJbmRleCA+IG5ld0luZGV4ID8gMSA6IC0xO1xuXG4gICAgLy8gSG93IG1hbnkgcGl4ZWxzIHRoZSBpdGVtJ3MgcGxhY2Vob2xkZXIgc2hvdWxkIGJlIG9mZnNldC5cbiAgICBjb25zdCBpdGVtT2Zmc2V0ID0gdGhpcy5fZ2V0SXRlbU9mZnNldFB4KGN1cnJlbnRQb3NpdGlvbiwgbmV3UG9zaXRpb24sIGRlbHRhKTtcblxuICAgIC8vIEhvdyBtYW55IHBpeGVscyBhbGwgdGhlIG90aGVyIGl0ZW1zIHNob3VsZCBiZSBvZmZzZXQuXG4gICAgY29uc3Qgc2libGluZ09mZnNldCA9IHRoaXMuX2dldFNpYmxpbmdPZmZzZXRQeChjdXJyZW50SW5kZXgsIHNpYmxpbmdzLCBkZWx0YSk7XG5cbiAgICAvLyBTYXZlIHRoZSBwcmV2aW91cyBvcmRlciBvZiB0aGUgaXRlbXMgYmVmb3JlIG1vdmluZyB0aGUgaXRlbSB0byBpdHMgbmV3IGluZGV4LlxuICAgIC8vIFdlIHVzZSB0aGlzIHRvIGNoZWNrIHdoZXRoZXIgYW4gaXRlbSBoYXMgYmVlbiBtb3ZlZCBhcyBhIHJlc3VsdCBvZiB0aGUgc29ydGluZy5cbiAgICBjb25zdCBvbGRPcmRlciA9IHNpYmxpbmdzLnNsaWNlKCk7XG5cbiAgICAvLyBTaHVmZmxlIHRoZSBhcnJheSBpbiBwbGFjZS5cbiAgICBtb3ZlSXRlbUluQXJyYXkoc2libGluZ3MsIGN1cnJlbnRJbmRleCwgbmV3SW5kZXgpO1xuXG4gICAgdGhpcy5zb3J0ZWQubmV4dCh7XG4gICAgICBwcmV2aW91c0luZGV4OiBjdXJyZW50SW5kZXgsXG4gICAgICBjdXJyZW50SW5kZXg6IG5ld0luZGV4LFxuICAgICAgY29udGFpbmVyOiB0aGlzLFxuICAgICAgaXRlbVxuICAgIH0pO1xuXG4gICAgc2libGluZ3MuZm9yRWFjaCgoc2libGluZywgaW5kZXgpID0+IHtcbiAgICAgIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIHRoZSBwb3NpdGlvbiBoYXNuJ3QgY2hhbmdlZC5cbiAgICAgIGlmIChvbGRPcmRlcltpbmRleF0gPT09IHNpYmxpbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpc0RyYWdnZWRJdGVtID0gc2libGluZy5kcmFnID09PSBpdGVtO1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gaXNEcmFnZ2VkSXRlbSA/IGl0ZW1PZmZzZXQgOiBzaWJsaW5nT2Zmc2V0O1xuICAgICAgY29uc3QgZWxlbWVudFRvT2Zmc2V0ID0gaXNEcmFnZ2VkSXRlbSA/IGl0ZW0uZ2V0UGxhY2Vob2xkZXJFbGVtZW50KCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpYmxpbmcuZHJhZy5nZXRSb290RWxlbWVudCgpO1xuXG4gICAgICAvLyBVcGRhdGUgdGhlIG9mZnNldCB0byByZWZsZWN0IHRoZSBuZXcgcG9zaXRpb24uXG4gICAgICBzaWJsaW5nLm9mZnNldCArPSBvZmZzZXQ7XG5cbiAgICAgIC8vIFNpbmNlIHdlJ3JlIG1vdmluZyB0aGUgaXRlbXMgd2l0aCBhIGB0cmFuc2Zvcm1gLCB3ZSBuZWVkIHRvIGFkanVzdCB0aGVpciBjYWNoZWRcbiAgICAgIC8vIGNsaWVudCByZWN0cyB0byByZWZsZWN0IHRoZWlyIG5ldyBwb3NpdGlvbiwgYXMgd2VsbCBhcyBzd2FwIHRoZWlyIHBvc2l0aW9ucyBpbiB0aGUgY2FjaGUuXG4gICAgICAvLyBOb3RlIHRoYXQgd2Ugc2hvdWxkbid0IHVzZSBgZ2V0Qm91bmRpbmdDbGllbnRSZWN0YCBoZXJlIHRvIHVwZGF0ZSB0aGUgY2FjaGUsIGJlY2F1c2UgdGhlXG4gICAgICAvLyBlbGVtZW50cyBtYXkgYmUgbWlkLWFuaW1hdGlvbiB3aGljaCB3aWxsIGdpdmUgdXMgYSB3cm9uZyByZXN1bHQuXG4gICAgICBpZiAoaXNIb3Jpem9udGFsKSB7XG4gICAgICAgIC8vIFJvdW5kIHRoZSB0cmFuc2Zvcm1zIHNpbmNlIHNvbWUgYnJvd3NlcnMgd2lsbFxuICAgICAgICAvLyBibHVyIHRoZSBlbGVtZW50cywgZm9yIHN1Yi1waXhlbCB0cmFuc2Zvcm1zLlxuICAgICAgICBlbGVtZW50VG9PZmZzZXQuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZTNkKCR7TWF0aC5yb3VuZChzaWJsaW5nLm9mZnNldCl9cHgsIDAsIDApYDtcbiAgICAgICAgYWRqdXN0Q2xpZW50UmVjdChzaWJsaW5nLmNsaWVudFJlY3QsIDAsIG9mZnNldCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbGVtZW50VG9PZmZzZXQuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZTNkKDAsICR7TWF0aC5yb3VuZChzaWJsaW5nLm9mZnNldCl9cHgsIDApYDtcbiAgICAgICAgYWRqdXN0Q2xpZW50UmVjdChzaWJsaW5nLmNsaWVudFJlY3QsIG9mZnNldCwgMCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBOb3RlIHRoYXQgaXQncyBpbXBvcnRhbnQgdGhhdCB3ZSBkbyB0aGlzIGFmdGVyIHRoZSBjbGllbnQgcmVjdHMgaGF2ZSBiZWVuIGFkanVzdGVkLlxuICAgIHRoaXMuX3ByZXZpb3VzU3dhcC5vdmVybGFwcyA9IGlzSW5zaWRlQ2xpZW50UmVjdChuZXdQb3NpdGlvbiwgcG9pbnRlclgsIHBvaW50ZXJZKTtcbiAgICB0aGlzLl9wcmV2aW91c1N3YXAuZHJhZyA9IHNpYmxpbmdBdE5ld1Bvc2l0aW9uLmRyYWc7XG4gICAgdGhpcy5fcHJldmlvdXNTd2FwLmRlbHRhID0gaXNIb3Jpem9udGFsID8gcG9pbnRlckRlbHRhLnggOiBwb2ludGVyRGVsdGEueTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgdXNlcidzIHBvaW50ZXIgaXMgY2xvc2UgdG8gdGhlIGVkZ2VzIG9mIGVpdGhlciB0aGVcbiAgICogdmlld3BvcnQgb3IgdGhlIGRyb3AgbGlzdCBhbmQgc3RhcnRzIHRoZSBhdXRvLXNjcm9sbCBzZXF1ZW5jZS5cbiAgICogQHBhcmFtIHBvaW50ZXJYIFVzZXIncyBwb2ludGVyIHBvc2l0aW9uIGFsb25nIHRoZSB4IGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBVc2VyJ3MgcG9pbnRlciBwb3NpdGlvbiBhbG9uZyB0aGUgeSBheGlzLlxuICAgKi9cbiAgX3N0YXJ0U2Nyb2xsaW5nSWZOZWNlc3NhcnkocG9pbnRlclg6IG51bWJlciwgcG9pbnRlclk6IG51bWJlcikge1xuICAgIGlmICh0aGlzLmF1dG9TY3JvbGxEaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBzY3JvbGxOb2RlOiBIVE1MRWxlbWVudCB8IFdpbmRvdyB8IHVuZGVmaW5lZDtcbiAgICBsZXQgdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uTk9ORTtcbiAgICBsZXQgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLk5PTkU7XG5cbiAgICAvLyBDaGVjayB3aGV0aGVyIHdlIHNob3VsZCBzdGFydCBzY3JvbGxpbmcgYW55IG9mIHRoZSBwYXJlbnQgY29udGFpbmVycy5cbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMucG9zaXRpb25zLmZvckVhY2goKHBvc2l0aW9uLCBlbGVtZW50KSA9PiB7XG4gICAgICAvLyBXZSBoYXZlIHNwZWNpYWwgaGFuZGxpbmcgZm9yIHRoZSBgZG9jdW1lbnRgIGJlbG93LiBBbHNvIHRoaXMgd291bGQgYmVcbiAgICAgIC8vIG5pY2VyIHdpdGggYSAgZm9yLi4ub2YgbG9vcCwgYnV0IGl0IHJlcXVpcmVzIGNoYW5naW5nIGEgY29tcGlsZXIgZmxhZy5cbiAgICAgIGlmIChlbGVtZW50ID09PSB0aGlzLl9kb2N1bWVudCB8fCAhcG9zaXRpb24uY2xpZW50UmVjdCB8fCBzY3JvbGxOb2RlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGlzUG9pbnRlck5lYXJDbGllbnRSZWN0KHBvc2l0aW9uLmNsaWVudFJlY3QsIERST1BfUFJPWElNSVRZX1RIUkVTSE9MRCxcbiAgICAgICAgICBwb2ludGVyWCwgcG9pbnRlclkpKSB7XG4gICAgICAgIFt2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiwgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbl0gPSBnZXRFbGVtZW50U2Nyb2xsRGlyZWN0aW9ucyhcbiAgICAgICAgICAgIGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQsIHBvc2l0aW9uLmNsaWVudFJlY3QsIHBvaW50ZXJYLCBwb2ludGVyWSk7XG5cbiAgICAgICAgaWYgKHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uIHx8IGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24pIHtcbiAgICAgICAgICBzY3JvbGxOb2RlID0gZWxlbWVudCBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gT3RoZXJ3aXNlIGNoZWNrIGlmIHdlIGNhbiBzdGFydCBzY3JvbGxpbmcgdGhlIHZpZXdwb3J0LlxuICAgIGlmICghdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gJiYgIWhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24pIHtcbiAgICAgIGNvbnN0IHt3aWR0aCwgaGVpZ2h0fSA9IHRoaXMuX3ZpZXdwb3J0UnVsZXIuZ2V0Vmlld3BvcnRTaXplKCk7XG4gICAgICBjb25zdCBjbGllbnRSZWN0ID0ge3dpZHRoLCBoZWlnaHQsIHRvcDogMCwgcmlnaHQ6IHdpZHRoLCBib3R0b206IGhlaWdodCwgbGVmdDogMH07XG4gICAgICB2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IGdldFZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uKGNsaWVudFJlY3QsIHBvaW50ZXJZKTtcbiAgICAgIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBnZXRIb3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKGNsaWVudFJlY3QsIHBvaW50ZXJYKTtcbiAgICAgIHNjcm9sbE5vZGUgPSB3aW5kb3c7XG4gICAgfVxuXG4gICAgaWYgKHNjcm9sbE5vZGUgJiYgKHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uICE9PSB0aGlzLl92ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiB8fFxuICAgICAgICBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uICE9PSB0aGlzLl9ob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uIHx8XG4gICAgICAgIHNjcm9sbE5vZGUgIT09IHRoaXMuX3Njcm9sbE5vZGUpKSB7XG4gICAgICB0aGlzLl92ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uO1xuICAgICAgdGhpcy5faG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb247XG4gICAgICB0aGlzLl9zY3JvbGxOb2RlID0gc2Nyb2xsTm9kZTtcblxuICAgICAgaWYgKCh2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiB8fCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKSAmJiBzY3JvbGxOb2RlKSB7XG4gICAgICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcih0aGlzLl9zdGFydFNjcm9sbEludGVydmFsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3N0b3BTY3JvbGxpbmcoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogU3RvcHMgYW55IGN1cnJlbnRseS1ydW5uaW5nIGF1dG8tc2Nyb2xsIHNlcXVlbmNlcy4gKi9cbiAgX3N0b3BTY3JvbGxpbmcoKSB7XG4gICAgdGhpcy5fc3RvcFNjcm9sbFRpbWVycy5uZXh0KCk7XG4gIH1cblxuICAvKiogQ2FjaGVzIHRoZSBwb3NpdGlvbnMgb2YgdGhlIGNvbmZpZ3VyZWQgc2Nyb2xsYWJsZSBwYXJlbnRzLiAqL1xuICBwcml2YXRlIF9jYWNoZVBhcmVudFBvc2l0aW9ucygpIHtcbiAgICBjb25zdCBlbGVtZW50ID0gY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpO1xuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5jYWNoZSh0aGlzLl9zY3JvbGxhYmxlRWxlbWVudHMpO1xuXG4gICAgLy8gVGhlIGxpc3QgZWxlbWVudCBpcyBhbHdheXMgaW4gdGhlIGBzY3JvbGxhYmxlRWxlbWVudHNgXG4gICAgLy8gc28gd2UgY2FuIHRha2UgYWR2YW50YWdlIG9mIHRoZSBjYWNoZWQgYENsaWVudFJlY3RgLlxuICAgIHRoaXMuX2NsaWVudFJlY3QgPSB0aGlzLl9wYXJlbnRQb3NpdGlvbnMucG9zaXRpb25zLmdldChlbGVtZW50KSEuY2xpZW50UmVjdCE7XG4gIH1cblxuICAvKiogUmVmcmVzaGVzIHRoZSBwb3NpdGlvbiBjYWNoZSBvZiB0aGUgaXRlbXMgYW5kIHNpYmxpbmcgY29udGFpbmVycy4gKi9cbiAgcHJpdmF0ZSBfY2FjaGVJdGVtUG9zaXRpb25zKCkge1xuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCc7XG5cbiAgICB0aGlzLl9pdGVtUG9zaXRpb25zID0gdGhpcy5fYWN0aXZlRHJhZ2dhYmxlcy5tYXAoZHJhZyA9PiB7XG4gICAgICBjb25zdCBlbGVtZW50VG9NZWFzdXJlID0gZHJhZy5nZXRWaXNpYmxlRWxlbWVudCgpO1xuICAgICAgcmV0dXJuIHtkcmFnLCBvZmZzZXQ6IDAsIGNsaWVudFJlY3Q6IGdldE11dGFibGVDbGllbnRSZWN0KGVsZW1lbnRUb01lYXN1cmUpfTtcbiAgICB9KS5zb3J0KChhLCBiKSA9PiB7XG4gICAgICByZXR1cm4gaXNIb3Jpem9udGFsID8gYS5jbGllbnRSZWN0LmxlZnQgLSBiLmNsaWVudFJlY3QubGVmdCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYS5jbGllbnRSZWN0LnRvcCAtIGIuY2xpZW50UmVjdC50b3A7XG4gICAgfSk7XG4gIH1cblxuICAvKiogUmVzZXRzIHRoZSBjb250YWluZXIgdG8gaXRzIGluaXRpYWwgc3RhdGUuICovXG4gIHByaXZhdGUgX3Jlc2V0KCkge1xuICAgIHRoaXMuX2lzRHJhZ2dpbmcgPSBmYWxzZTtcblxuICAgIGNvbnN0IHN0eWxlcyA9IGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KS5zdHlsZSBhcyBEcmFnQ1NTU3R5bGVEZWNsYXJhdGlvbjtcbiAgICBzdHlsZXMuc2Nyb2xsU25hcFR5cGUgPSBzdHlsZXMubXNTY3JvbGxTbmFwVHlwZSA9IHRoaXMuX2luaXRpYWxTY3JvbGxTbmFwO1xuXG4gICAgLy8gVE9ETyhjcmlzYmV0byk6IG1heSBoYXZlIHRvIHdhaXQgZm9yIHRoZSBhbmltYXRpb25zIHRvIGZpbmlzaC5cbiAgICB0aGlzLl9hY3RpdmVEcmFnZ2FibGVzLmZvckVhY2goaXRlbSA9PiB7XG4gICAgICBjb25zdCByb290RWxlbWVudCA9IGl0ZW0uZ2V0Um9vdEVsZW1lbnQoKTtcblxuICAgICAgaWYgKHJvb3RFbGVtZW50KSB7XG4gICAgICAgIHJvb3RFbGVtZW50LnN0eWxlLnRyYW5zZm9ybSA9ICcnO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuX3NpYmxpbmdzLmZvckVhY2goc2libGluZyA9PiBzaWJsaW5nLl9zdG9wUmVjZWl2aW5nKHRoaXMpKTtcbiAgICB0aGlzLl9hY3RpdmVEcmFnZ2FibGVzID0gW107XG4gICAgdGhpcy5faXRlbVBvc2l0aW9ucyA9IFtdO1xuICAgIHRoaXMuX3ByZXZpb3VzU3dhcC5kcmFnID0gbnVsbDtcbiAgICB0aGlzLl9wcmV2aW91c1N3YXAuZGVsdGEgPSAwO1xuICAgIHRoaXMuX3ByZXZpb3VzU3dhcC5vdmVybGFwcyA9IGZhbHNlO1xuICAgIHRoaXMuX3N0b3BTY3JvbGxpbmcoKTtcbiAgICB0aGlzLl92aWV3cG9ydFNjcm9sbFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5jbGVhcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG9mZnNldCBpbiBwaXhlbHMgYnkgd2hpY2ggdGhlIGl0ZW1zIHRoYXQgYXJlbid0IGJlaW5nIGRyYWdnZWQgc2hvdWxkIGJlIG1vdmVkLlxuICAgKiBAcGFyYW0gY3VycmVudEluZGV4IEluZGV4IG9mIHRoZSBpdGVtIGN1cnJlbnRseSBiZWluZyBkcmFnZ2VkLlxuICAgKiBAcGFyYW0gc2libGluZ3MgQWxsIG9mIHRoZSBpdGVtcyBpbiB0aGUgbGlzdC5cbiAgICogQHBhcmFtIGRlbHRhIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgdXNlciBpcyBtb3ZpbmcuXG4gICAqL1xuICBwcml2YXRlIF9nZXRTaWJsaW5nT2Zmc2V0UHgoY3VycmVudEluZGV4OiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWJsaW5nczogQ2FjaGVkSXRlbVBvc2l0aW9uW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWx0YTogMSB8IC0xKSB7XG5cbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuICAgIGNvbnN0IGN1cnJlbnRQb3NpdGlvbiA9IHNpYmxpbmdzW2N1cnJlbnRJbmRleF0uY2xpZW50UmVjdDtcbiAgICBjb25zdCBpbW1lZGlhdGVTaWJsaW5nID0gc2libGluZ3NbY3VycmVudEluZGV4ICsgZGVsdGEgKiAtMV07XG4gICAgbGV0IHNpYmxpbmdPZmZzZXQgPSBjdXJyZW50UG9zaXRpb25baXNIb3Jpem9udGFsID8gJ3dpZHRoJyA6ICdoZWlnaHQnXSAqIGRlbHRhO1xuXG4gICAgaWYgKGltbWVkaWF0ZVNpYmxpbmcpIHtcbiAgICAgIGNvbnN0IHN0YXJ0ID0gaXNIb3Jpem9udGFsID8gJ2xlZnQnIDogJ3RvcCc7XG4gICAgICBjb25zdCBlbmQgPSBpc0hvcml6b250YWwgPyAncmlnaHQnIDogJ2JvdHRvbSc7XG5cbiAgICAgIC8vIEdldCB0aGUgc3BhY2luZyBiZXR3ZWVuIHRoZSBzdGFydCBvZiB0aGUgY3VycmVudCBpdGVtIGFuZCB0aGUgZW5kIG9mIHRoZSBvbmUgaW1tZWRpYXRlbHlcbiAgICAgIC8vIGFmdGVyIGl0IGluIHRoZSBkaXJlY3Rpb24gaW4gd2hpY2ggdGhlIHVzZXIgaXMgZHJhZ2dpbmcsIG9yIHZpY2UgdmVyc2EuIFdlIGFkZCBpdCB0byB0aGVcbiAgICAgIC8vIG9mZnNldCBpbiBvcmRlciB0byBwdXNoIHRoZSBlbGVtZW50IHRvIHdoZXJlIGl0IHdpbGwgYmUgd2hlbiBpdCdzIGlubGluZSBhbmQgaXMgaW5mbHVlbmNlZFxuICAgICAgLy8gYnkgdGhlIGBtYXJnaW5gIG9mIGl0cyBzaWJsaW5ncy5cbiAgICAgIGlmIChkZWx0YSA9PT0gLTEpIHtcbiAgICAgICAgc2libGluZ09mZnNldCAtPSBpbW1lZGlhdGVTaWJsaW5nLmNsaWVudFJlY3Rbc3RhcnRdIC0gY3VycmVudFBvc2l0aW9uW2VuZF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzaWJsaW5nT2Zmc2V0ICs9IGN1cnJlbnRQb3NpdGlvbltzdGFydF0gLSBpbW1lZGlhdGVTaWJsaW5nLmNsaWVudFJlY3RbZW5kXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2libGluZ09mZnNldDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBvZmZzZXQgaW4gcGl4ZWxzIGJ5IHdoaWNoIHRoZSBpdGVtIHRoYXQgaXMgYmVpbmcgZHJhZ2dlZCBzaG91bGQgYmUgbW92ZWQuXG4gICAqIEBwYXJhbSBjdXJyZW50UG9zaXRpb24gQ3VycmVudCBwb3NpdGlvbiBvZiB0aGUgaXRlbS5cbiAgICogQHBhcmFtIG5ld1Bvc2l0aW9uIFBvc2l0aW9uIG9mIHRoZSBpdGVtIHdoZXJlIHRoZSBjdXJyZW50IGl0ZW0gc2hvdWxkIGJlIG1vdmVkLlxuICAgKiBAcGFyYW0gZGVsdGEgRGlyZWN0aW9uIGluIHdoaWNoIHRoZSB1c2VyIGlzIG1vdmluZy5cbiAgICovXG4gIHByaXZhdGUgX2dldEl0ZW1PZmZzZXRQeChjdXJyZW50UG9zaXRpb246IENsaWVudFJlY3QsIG5ld1Bvc2l0aW9uOiBDbGllbnRSZWN0LCBkZWx0YTogMSB8IC0xKSB7XG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gdGhpcy5fb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJztcbiAgICBsZXQgaXRlbU9mZnNldCA9IGlzSG9yaXpvbnRhbCA/IG5ld1Bvc2l0aW9uLmxlZnQgLSBjdXJyZW50UG9zaXRpb24ubGVmdCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdQb3NpdGlvbi50b3AgLSBjdXJyZW50UG9zaXRpb24udG9wO1xuXG4gICAgLy8gQWNjb3VudCBmb3IgZGlmZmVyZW5jZXMgaW4gdGhlIGl0ZW0gd2lkdGgvaGVpZ2h0LlxuICAgIGlmIChkZWx0YSA9PT0gLTEpIHtcbiAgICAgIGl0ZW1PZmZzZXQgKz0gaXNIb3Jpem9udGFsID8gbmV3UG9zaXRpb24ud2lkdGggLSBjdXJyZW50UG9zaXRpb24ud2lkdGggOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdQb3NpdGlvbi5oZWlnaHQgLSBjdXJyZW50UG9zaXRpb24uaGVpZ2h0O1xuICAgIH1cblxuICAgIHJldHVybiBpdGVtT2Zmc2V0O1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBwb2ludGVyIGlzIGVudGVyaW5nIGluIHRoZSBmaXJzdCBwb3NpdGlvblxuICAgKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIFkgYXhpcy5cbiAgICovXG4gIHByaXZhdGUgX3Nob3VsZEVudGVyQXNGaXJzdENoaWxkKHBvaW50ZXJYOiBudW1iZXIsIHBvaW50ZXJZOiBudW1iZXIpIHtcbiAgICBpZiAoIXRoaXMuX2FjdGl2ZURyYWdnYWJsZXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgaXRlbVBvc2l0aW9ucyA9IHRoaXMuX2l0ZW1Qb3NpdGlvbnM7XG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gdGhpcy5fb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJztcblxuICAgIC8vIGBpdGVtUG9zaXRpb25zYCBhcmUgc29ydGVkIGJ5IHBvc2l0aW9uIHdoaWxlIGBhY3RpdmVEcmFnZ2FibGVzYCBhcmUgc29ydGVkIGJ5IGNoaWxkIGluZGV4XG4gICAgLy8gY2hlY2sgaWYgY29udGFpbmVyIGlzIHVzaW5nIHNvbWUgc29ydCBvZiBcInJldmVyc2VcIiBvcmRlcmluZyAoZWc6IGZsZXgtZGlyZWN0aW9uOiByb3ctcmV2ZXJzZSlcbiAgICBjb25zdCByZXZlcnNlZCA9IGl0ZW1Qb3NpdGlvbnNbMF0uZHJhZyAhPT0gdGhpcy5fYWN0aXZlRHJhZ2dhYmxlc1swXTtcbiAgICBpZiAocmV2ZXJzZWQpIHtcbiAgICAgIGNvbnN0IGxhc3RJdGVtUmVjdCA9IGl0ZW1Qb3NpdGlvbnNbaXRlbVBvc2l0aW9ucy5sZW5ndGggLSAxXS5jbGllbnRSZWN0O1xuICAgICAgcmV0dXJuIGlzSG9yaXpvbnRhbCA/IHBvaW50ZXJYID49IGxhc3RJdGVtUmVjdC5yaWdodCA6IHBvaW50ZXJZID49IGxhc3RJdGVtUmVjdC5ib3R0b207XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGZpcnN0SXRlbVJlY3QgPSBpdGVtUG9zaXRpb25zWzBdLmNsaWVudFJlY3Q7XG4gICAgICByZXR1cm4gaXNIb3Jpem9udGFsID8gcG9pbnRlclggPD0gZmlyc3RJdGVtUmVjdC5sZWZ0IDogcG9pbnRlclkgPD0gZmlyc3RJdGVtUmVjdC50b3A7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGluZGV4IG9mIGFuIGl0ZW0gaW4gdGhlIGRyb3AgY29udGFpbmVyLCBiYXNlZCBvbiB0aGUgcG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRoYXQgaXMgYmVpbmcgc29ydGVkLlxuICAgKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIFkgYXhpcy5cbiAgICogQHBhcmFtIGRlbHRhIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgdXNlciBpcyBtb3ZpbmcgdGhlaXIgcG9pbnRlci5cbiAgICovXG4gIHByaXZhdGUgX2dldEl0ZW1JbmRleEZyb21Qb2ludGVyUG9zaXRpb24oaXRlbTogRHJhZ1JlZiwgcG9pbnRlclg6IG51bWJlciwgcG9pbnRlclk6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWx0YT86IHt4OiBudW1iZXIsIHk6IG51bWJlcn0pOiBudW1iZXIge1xuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCc7XG4gICAgY29uc3QgaW5kZXggPSBmaW5kSW5kZXgodGhpcy5faXRlbVBvc2l0aW9ucywgKHtkcmFnLCBjbGllbnRSZWN0fSwgXywgYXJyYXkpID0+IHtcbiAgICAgIGlmIChkcmFnID09PSBpdGVtKSB7XG4gICAgICAgIC8vIElmIHRoZXJlJ3Mgb25seSBvbmUgaXRlbSBsZWZ0IGluIHRoZSBjb250YWluZXIsIGl0IG11c3QgYmVcbiAgICAgICAgLy8gdGhlIGRyYWdnZWQgaXRlbSBpdHNlbGYgc28gd2UgdXNlIGl0IGFzIGEgcmVmZXJlbmNlLlxuICAgICAgICByZXR1cm4gYXJyYXkubGVuZ3RoIDwgMjtcbiAgICAgIH1cblxuICAgICAgaWYgKGRlbHRhKSB7XG4gICAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IGlzSG9yaXpvbnRhbCA/IGRlbHRhLnggOiBkZWx0YS55O1xuXG4gICAgICAgIC8vIElmIHRoZSB1c2VyIGlzIHN0aWxsIGhvdmVyaW5nIG92ZXIgdGhlIHNhbWUgaXRlbSBhcyBsYXN0IHRpbWUsIHRoZWlyIGN1cnNvciBoYXNuJ3QgbGVmdFxuICAgICAgICAvLyB0aGUgaXRlbSBhZnRlciB3ZSBtYWRlIHRoZSBzd2FwLCBhbmQgdGhleSBkaWRuJ3QgY2hhbmdlIHRoZSBkaXJlY3Rpb24gaW4gd2hpY2ggdGhleSdyZVxuICAgICAgICAvLyBkcmFnZ2luZywgd2UgZG9uJ3QgY29uc2lkZXIgaXQgYSBkaXJlY3Rpb24gc3dhcC5cbiAgICAgICAgaWYgKGRyYWcgPT09IHRoaXMuX3ByZXZpb3VzU3dhcC5kcmFnICYmIHRoaXMuX3ByZXZpb3VzU3dhcC5vdmVybGFwcyAmJlxuICAgICAgICAgICAgZGlyZWN0aW9uID09PSB0aGlzLl9wcmV2aW91c1N3YXAuZGVsdGEpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGlzSG9yaXpvbnRhbCA/XG4gICAgICAgICAgLy8gUm91bmQgdGhlc2UgZG93biBzaW5jZSBtb3N0IGJyb3dzZXJzIHJlcG9ydCBjbGllbnQgcmVjdHMgd2l0aFxuICAgICAgICAgIC8vIHN1Yi1waXhlbCBwcmVjaXNpb24sIHdoZXJlYXMgdGhlIHBvaW50ZXIgY29vcmRpbmF0ZXMgYXJlIHJvdW5kZWQgdG8gcGl4ZWxzLlxuICAgICAgICAgIHBvaW50ZXJYID49IE1hdGguZmxvb3IoY2xpZW50UmVjdC5sZWZ0KSAmJiBwb2ludGVyWCA8IE1hdGguZmxvb3IoY2xpZW50UmVjdC5yaWdodCkgOlxuICAgICAgICAgIHBvaW50ZXJZID49IE1hdGguZmxvb3IoY2xpZW50UmVjdC50b3ApICYmIHBvaW50ZXJZIDwgTWF0aC5mbG9vcihjbGllbnRSZWN0LmJvdHRvbSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gKGluZGV4ID09PSAtMSB8fCAhdGhpcy5zb3J0UHJlZGljYXRlKGluZGV4LCBpdGVtLCB0aGlzKSkgPyAtMSA6IGluZGV4O1xuICB9XG5cbiAgLyoqIENhY2hlcyB0aGUgY3VycmVudCBpdGVtcyBpbiB0aGUgbGlzdCBhbmQgdGhlaXIgcG9zaXRpb25zLiAqL1xuICBwcml2YXRlIF9jYWNoZUl0ZW1zKCk6IHZvaWQge1xuICAgIHRoaXMuX2FjdGl2ZURyYWdnYWJsZXMgPSB0aGlzLl9kcmFnZ2FibGVzLnNsaWNlKCk7XG4gICAgdGhpcy5fY2FjaGVJdGVtUG9zaXRpb25zKCk7XG4gICAgdGhpcy5fY2FjaGVQYXJlbnRQb3NpdGlvbnMoKTtcbiAgfVxuXG4gIC8qKiBTdGFydHMgdGhlIGludGVydmFsIHRoYXQnbGwgYXV0by1zY3JvbGwgdGhlIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3N0YXJ0U2Nyb2xsSW50ZXJ2YWwgPSAoKSA9PiB7XG4gICAgdGhpcy5fc3RvcFNjcm9sbGluZygpO1xuXG4gICAgaW50ZXJ2YWwoMCwgYW5pbWF0aW9uRnJhbWVTY2hlZHVsZXIpXG4gICAgICAucGlwZSh0YWtlVW50aWwodGhpcy5fc3RvcFNjcm9sbFRpbWVycykpXG4gICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMuX3Njcm9sbE5vZGU7XG5cbiAgICAgICAgaWYgKHRoaXMuX3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID09PSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uVVApIHtcbiAgICAgICAgICBpbmNyZW1lbnRWZXJ0aWNhbFNjcm9sbChub2RlLCAtQVVUT19TQ1JPTExfU1RFUCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPT09IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5ET1dOKSB7XG4gICAgICAgICAgaW5jcmVtZW50VmVydGljYWxTY3JvbGwobm9kZSwgQVVUT19TQ1JPTExfU1RFUCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5faG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9PT0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTEVGVCkge1xuICAgICAgICAgIGluY3JlbWVudEhvcml6b250YWxTY3JvbGwobm9kZSwgLUFVVE9fU0NST0xMX1NURVApO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2hvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPT09IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLlJJR0hUKSB7XG4gICAgICAgICAgaW5jcmVtZW50SG9yaXpvbnRhbFNjcm9sbChub2RlLCBBVVRPX1NDUk9MTF9TVEVQKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIHVzZXIncyBwb2ludGVyIGlzIHBvc2l0aW9uZWQgb3ZlciB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0geCBQb2ludGVyIHBvc2l0aW9uIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSB5IFBvaW50ZXIgcG9zaXRpb24gYWxvbmcgdGhlIFkgYXhpcy5cbiAgICovXG4gIF9pc092ZXJDb250YWluZXIoeDogbnVtYmVyLCB5OiBudW1iZXIpOiBib29sZWFuIHtcbiAgICByZXR1cm4gaXNJbnNpZGVDbGllbnRSZWN0KHRoaXMuX2NsaWVudFJlY3QsIHgsIHkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpZ3VyZXMgb3V0IHdoZXRoZXIgYW4gaXRlbSBzaG91bGQgYmUgbW92ZWQgaW50byBhIHNpYmxpbmdcbiAgICogZHJvcCBjb250YWluZXIsIGJhc2VkIG9uIGl0cyBjdXJyZW50IHBvc2l0aW9uLlxuICAgKiBAcGFyYW0gaXRlbSBEcmFnIGl0ZW0gdGhhdCBpcyBiZWluZyBtb3ZlZC5cbiAgICogQHBhcmFtIHggUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHkgUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFkgYXhpcy5cbiAgICovXG4gIF9nZXRTaWJsaW5nQ29udGFpbmVyRnJvbVBvc2l0aW9uKGl0ZW06IERyYWdSZWYsIHg6IG51bWJlciwgeTogbnVtYmVyKTogRHJvcExpc3RSZWYgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9zaWJsaW5ncy5maW5kKHNpYmxpbmcgPT4gc2libGluZy5fY2FuUmVjZWl2ZShpdGVtLCB4LCB5KSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGRyb3AgbGlzdCBjYW4gcmVjZWl2ZSB0aGUgcGFzc2VkLWluIGl0ZW0uXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdGhhdCBpcyBiZWluZyBkcmFnZ2VkIGludG8gdGhlIGxpc3QuXG4gICAqIEBwYXJhbSB4IFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSB5IFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqL1xuICBfY2FuUmVjZWl2ZShpdGVtOiBEcmFnUmVmLCB4OiBudW1iZXIsIHk6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGlmICghaXNJbnNpZGVDbGllbnRSZWN0KHRoaXMuX2NsaWVudFJlY3QsIHgsIHkpIHx8ICF0aGlzLmVudGVyUHJlZGljYXRlKGl0ZW0sIHRoaXMpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgZWxlbWVudEZyb21Qb2ludCA9IHRoaXMuX2dldFNoYWRvd1Jvb3QoKS5lbGVtZW50RnJvbVBvaW50KHgsIHkpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcblxuICAgIC8vIElmIHRoZXJlJ3Mgbm8gZWxlbWVudCBhdCB0aGUgcG9pbnRlciBwb3NpdGlvbiwgdGhlblxuICAgIC8vIHRoZSBjbGllbnQgcmVjdCBpcyBwcm9iYWJseSBzY3JvbGxlZCBvdXQgb2YgdGhlIHZpZXcuXG4gICAgaWYgKCFlbGVtZW50RnJvbVBvaW50KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KTtcblxuICAgIC8vIFRoZSBgQ2xpZW50UmVjdGAsIHRoYXQgd2UncmUgdXNpbmcgdG8gZmluZCB0aGUgY29udGFpbmVyIG92ZXIgd2hpY2ggdGhlIHVzZXIgaXNcbiAgICAvLyBob3ZlcmluZywgZG9lc24ndCBnaXZlIHVzIGFueSBpbmZvcm1hdGlvbiBvbiB3aGV0aGVyIHRoZSBlbGVtZW50IGhhcyBiZWVuIHNjcm9sbGVkXG4gICAgLy8gb3V0IG9mIHRoZSB2aWV3IG9yIHdoZXRoZXIgaXQncyBvdmVybGFwcGluZyB3aXRoIG90aGVyIGNvbnRhaW5lcnMuIFRoaXMgbWVhbnMgdGhhdFxuICAgIC8vIHdlIGNvdWxkIGVuZCB1cCB0cmFuc2ZlcnJpbmcgdGhlIGl0ZW0gaW50byBhIGNvbnRhaW5lciB0aGF0J3MgaW52aXNpYmxlIG9yIGlzIHBvc2l0aW9uZWRcbiAgICAvLyBiZWxvdyBhbm90aGVyIG9uZS4gV2UgdXNlIHRoZSByZXN1bHQgZnJvbSBgZWxlbWVudEZyb21Qb2ludGAgdG8gZ2V0IHRoZSB0b3AtbW9zdCBlbGVtZW50XG4gICAgLy8gYXQgdGhlIHBvaW50ZXIgcG9zaXRpb24gYW5kIHRvIGZpbmQgd2hldGhlciBpdCdzIG9uZSBvZiB0aGUgaW50ZXJzZWN0aW5nIGRyb3AgY29udGFpbmVycy5cbiAgICByZXR1cm4gZWxlbWVudEZyb21Qb2ludCA9PT0gbmF0aXZlRWxlbWVudCB8fCBuYXRpdmVFbGVtZW50LmNvbnRhaW5zKGVsZW1lbnRGcm9tUG9pbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCBieSBvbmUgb2YgdGhlIGNvbm5lY3RlZCBkcm9wIGxpc3RzIHdoZW4gYSBkcmFnZ2luZyBzZXF1ZW5jZSBoYXMgc3RhcnRlZC5cbiAgICogQHBhcmFtIHNpYmxpbmcgU2libGluZyBpbiB3aGljaCBkcmFnZ2luZyBoYXMgc3RhcnRlZC5cbiAgICovXG4gIF9zdGFydFJlY2VpdmluZyhzaWJsaW5nOiBEcm9wTGlzdFJlZikge1xuICAgIGNvbnN0IGFjdGl2ZVNpYmxpbmdzID0gdGhpcy5fYWN0aXZlU2libGluZ3M7XG5cbiAgICBpZiAoIWFjdGl2ZVNpYmxpbmdzLmhhcyhzaWJsaW5nKSkge1xuICAgICAgYWN0aXZlU2libGluZ3MuYWRkKHNpYmxpbmcpO1xuICAgICAgdGhpcy5fY2FjaGVQYXJlbnRQb3NpdGlvbnMoKTtcbiAgICAgIHRoaXMuX2xpc3RlblRvU2Nyb2xsRXZlbnRzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCBieSBhIGNvbm5lY3RlZCBkcm9wIGxpc3Qgd2hlbiBkcmFnZ2luZyBoYXMgc3RvcHBlZC5cbiAgICogQHBhcmFtIHNpYmxpbmcgU2libGluZyB3aG9zZSBkcmFnZ2luZyBoYXMgc3RvcHBlZC5cbiAgICovXG4gIF9zdG9wUmVjZWl2aW5nKHNpYmxpbmc6IERyb3BMaXN0UmVmKSB7XG4gICAgdGhpcy5fYWN0aXZlU2libGluZ3MuZGVsZXRlKHNpYmxpbmcpO1xuICAgIHRoaXMuX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gIH1cblxuICAvKipcbiAgICogU3RhcnRzIGxpc3RlbmluZyB0byBzY3JvbGwgZXZlbnRzIG9uIHRoZSB2aWV3cG9ydC5cbiAgICogVXNlZCBmb3IgdXBkYXRpbmcgdGhlIGludGVybmFsIHN0YXRlIG9mIHRoZSBsaXN0LlxuICAgKi9cbiAgcHJpdmF0ZSBfbGlzdGVuVG9TY3JvbGxFdmVudHMoKSB7XG4gICAgdGhpcy5fdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24gPSB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnNjcm9sbC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgaWYgKHRoaXMuaXNEcmFnZ2luZygpKSB7XG4gICAgICAgIGNvbnN0IHNjcm9sbERpZmZlcmVuY2UgPSB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuaGFuZGxlU2Nyb2xsKGV2ZW50KTtcblxuICAgICAgICBpZiAoc2Nyb2xsRGlmZmVyZW5jZSkge1xuICAgICAgICAgIC8vIFNpbmNlIHdlIGtub3cgdGhlIGFtb3VudCB0aGF0IHRoZSB1c2VyIGhhcyBzY3JvbGxlZCB3ZSBjYW4gc2hpZnQgYWxsIG9mIHRoZVxuICAgICAgICAgIC8vIGNsaWVudCByZWN0YW5nbGVzIG91cnNlbHZlcy4gVGhpcyBpcyBjaGVhcGVyIHRoYW4gcmUtbWVhc3VyaW5nIGV2ZXJ5dGhpbmcgYW5kXG4gICAgICAgICAgLy8gd2UgY2FuIGF2b2lkIGluY29uc2lzdGVudCBiZWhhdmlvciB3aGVyZSB3ZSBtaWdodCBiZSBtZWFzdXJpbmcgdGhlIGVsZW1lbnQgYmVmb3JlXG4gICAgICAgICAgLy8gaXRzIHBvc2l0aW9uIGhhcyBjaGFuZ2VkLlxuICAgICAgICAgIHRoaXMuX2l0ZW1Qb3NpdGlvbnMuZm9yRWFjaCgoe2NsaWVudFJlY3R9KSA9PiB7XG4gICAgICAgICAgICBhZGp1c3RDbGllbnRSZWN0KGNsaWVudFJlY3QsIHNjcm9sbERpZmZlcmVuY2UudG9wLCBzY3JvbGxEaWZmZXJlbmNlLmxlZnQpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgLy8gV2UgbmVlZCB0d28gbG9vcHMgZm9yIHRoaXMsIGJlY2F1c2Ugd2Ugd2FudCBhbGwgb2YgdGhlIGNhY2hlZFxuICAgICAgICAgIC8vIHBvc2l0aW9ucyB0byBiZSB1cC10by1kYXRlIGJlZm9yZSB3ZSByZS1zb3J0IHRoZSBpdGVtLlxuICAgICAgICAgIHRoaXMuX2l0ZW1Qb3NpdGlvbnMuZm9yRWFjaCgoe2RyYWd9KSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5pc0RyYWdnaW5nKGRyYWcpKSB7XG4gICAgICAgICAgICAgIC8vIFdlIG5lZWQgdG8gcmUtc29ydCB0aGUgaXRlbSBtYW51YWxseSwgYmVjYXVzZSB0aGUgcG9pbnRlciBtb3ZlXG4gICAgICAgICAgICAgIC8vIGV2ZW50cyB3b24ndCBiZSBkaXNwYXRjaGVkIHdoaWxlIHRoZSB1c2VyIGlzIHNjcm9sbGluZy5cbiAgICAgICAgICAgICAgZHJhZy5fc29ydEZyb21MYXN0UG9pbnRlclBvc2l0aW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodGhpcy5pc1JlY2VpdmluZygpKSB7XG4gICAgICAgIHRoaXMuX2NhY2hlUGFyZW50UG9zaXRpb25zKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGF6aWx5IHJlc29sdmVzIGFuZCByZXR1cm5zIHRoZSBzaGFkb3cgcm9vdCBvZiB0aGUgZWxlbWVudC4gV2UgZG8gdGhpcyBpbiBhIGZ1bmN0aW9uLCByYXRoZXJcbiAgICogdGhhbiBzYXZpbmcgaXQgaW4gcHJvcGVydHkgZGlyZWN0bHkgb24gaW5pdCwgYmVjYXVzZSB3ZSB3YW50IHRvIHJlc29sdmUgaXQgYXMgbGF0ZSBhcyBwb3NzaWJsZVxuICAgKiBpbiBvcmRlciB0byBlbnN1cmUgdGhhdCB0aGUgZWxlbWVudCBoYXMgYmVlbiBtb3ZlZCBpbnRvIHRoZSBzaGFkb3cgRE9NLiBEb2luZyBpdCBpbnNpZGUgdGhlXG4gICAqIGNvbnN0cnVjdG9yIG1pZ2h0IGJlIHRvbyBlYXJseSBpZiB0aGUgZWxlbWVudCBpcyBpbnNpZGUgb2Ygc29tZXRoaW5nIGxpa2UgYG5nRm9yYCBvciBgbmdJZmAuXG4gICAqL1xuICBwcml2YXRlIF9nZXRTaGFkb3dSb290KCk6IERvY3VtZW50T3JTaGFkb3dSb290IHtcbiAgICBpZiAoIXRoaXMuX2NhY2hlZFNoYWRvd1Jvb3QpIHtcbiAgICAgIGNvbnN0IHNoYWRvd1Jvb3QgPSBfZ2V0U2hhZG93Um9vdChjb2VyY2VFbGVtZW50KHRoaXMuZWxlbWVudCkpIGFzIFNoYWRvd1Jvb3QgfCBudWxsO1xuICAgICAgdGhpcy5fY2FjaGVkU2hhZG93Um9vdCA9IHNoYWRvd1Jvb3QgfHwgdGhpcy5fZG9jdW1lbnQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX2NhY2hlZFNoYWRvd1Jvb3Q7XG4gIH1cbn1cblxuXG4vKipcbiAqIEZpbmRzIHRoZSBpbmRleCBvZiBhbiBpdGVtIHRoYXQgbWF0Y2hlcyBhIHByZWRpY2F0ZSBmdW5jdGlvbi4gVXNlZCBhcyBhbiBlcXVpdmFsZW50XG4gKiBvZiBgQXJyYXkucHJvdG90eXBlLmZpbmRJbmRleGAgd2hpY2ggaXNuJ3QgcGFydCBvZiB0aGUgc3RhbmRhcmQgR29vZ2xlIHR5cGluZ3MuXG4gKiBAcGFyYW0gYXJyYXkgQXJyYXkgaW4gd2hpY2ggdG8gbG9vayBmb3IgbWF0Y2hlcy5cbiAqIEBwYXJhbSBwcmVkaWNhdGUgRnVuY3Rpb24gdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBhbiBpdGVtIGlzIGEgbWF0Y2guXG4gKi9cbmZ1bmN0aW9uIGZpbmRJbmRleDxUPihhcnJheTogVFtdLFxuICAgICAgICAgICAgICAgICAgICAgIHByZWRpY2F0ZTogKHZhbHVlOiBULCBpbmRleDogbnVtYmVyLCBvYmo6IFRbXSkgPT4gYm9vbGVhbik6IG51bWJlciB7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuICAgIGlmIChwcmVkaWNhdGUoYXJyYXlbaV0sIGksIGFycmF5KSkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIC0xO1xufVxuXG4vKipcbiAqIEluY3JlbWVudHMgdGhlIHZlcnRpY2FsIHNjcm9sbCBwb3NpdGlvbiBvZiBhIG5vZGUuXG4gKiBAcGFyYW0gbm9kZSBOb2RlIHdob3NlIHNjcm9sbCBwb3NpdGlvbiBzaG91bGQgY2hhbmdlLlxuICogQHBhcmFtIGFtb3VudCBBbW91bnQgb2YgcGl4ZWxzIHRoYXQgdGhlIGBub2RlYCBzaG91bGQgYmUgc2Nyb2xsZWQuXG4gKi9cbmZ1bmN0aW9uIGluY3JlbWVudFZlcnRpY2FsU2Nyb2xsKG5vZGU6IEhUTUxFbGVtZW50IHwgV2luZG93LCBhbW91bnQ6IG51bWJlcikge1xuICBpZiAobm9kZSA9PT0gd2luZG93KSB7XG4gICAgKG5vZGUgYXMgV2luZG93KS5zY3JvbGxCeSgwLCBhbW91bnQpO1xuICB9IGVsc2Uge1xuICAgIC8vIElkZWFsbHkgd2UgY291bGQgdXNlIGBFbGVtZW50LnNjcm9sbEJ5YCBoZXJlIGFzIHdlbGwsIGJ1dCBJRSBhbmQgRWRnZSBkb24ndCBzdXBwb3J0IGl0LlxuICAgIChub2RlIGFzIEhUTUxFbGVtZW50KS5zY3JvbGxUb3AgKz0gYW1vdW50O1xuICB9XG59XG5cbi8qKlxuICogSW5jcmVtZW50cyB0aGUgaG9yaXpvbnRhbCBzY3JvbGwgcG9zaXRpb24gb2YgYSBub2RlLlxuICogQHBhcmFtIG5vZGUgTm9kZSB3aG9zZSBzY3JvbGwgcG9zaXRpb24gc2hvdWxkIGNoYW5nZS5cbiAqIEBwYXJhbSBhbW91bnQgQW1vdW50IG9mIHBpeGVscyB0aGF0IHRoZSBgbm9kZWAgc2hvdWxkIGJlIHNjcm9sbGVkLlxuICovXG5mdW5jdGlvbiBpbmNyZW1lbnRIb3Jpem9udGFsU2Nyb2xsKG5vZGU6IEhUTUxFbGVtZW50IHwgV2luZG93LCBhbW91bnQ6IG51bWJlcikge1xuICBpZiAobm9kZSA9PT0gd2luZG93KSB7XG4gICAgKG5vZGUgYXMgV2luZG93KS5zY3JvbGxCeShhbW91bnQsIDApO1xuICB9IGVsc2Uge1xuICAgIC8vIElkZWFsbHkgd2UgY291bGQgdXNlIGBFbGVtZW50LnNjcm9sbEJ5YCBoZXJlIGFzIHdlbGwsIGJ1dCBJRSBhbmQgRWRnZSBkb24ndCBzdXBwb3J0IGl0LlxuICAgIChub2RlIGFzIEhUTUxFbGVtZW50KS5zY3JvbGxMZWZ0ICs9IGFtb3VudDtcbiAgfVxufVxuXG4vKipcbiAqIEdldHMgd2hldGhlciB0aGUgdmVydGljYWwgYXV0by1zY3JvbGwgZGlyZWN0aW9uIG9mIGEgbm9kZS5cbiAqIEBwYXJhbSBjbGllbnRSZWN0IERpbWVuc2lvbnMgb2YgdGhlIG5vZGUuXG4gKiBAcGFyYW0gcG9pbnRlclkgUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSB5IGF4aXMuXG4gKi9cbmZ1bmN0aW9uIGdldFZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uKGNsaWVudFJlY3Q6IENsaWVudFJlY3QsIHBvaW50ZXJZOiBudW1iZXIpIHtcbiAgY29uc3Qge3RvcCwgYm90dG9tLCBoZWlnaHR9ID0gY2xpZW50UmVjdDtcbiAgY29uc3QgeVRocmVzaG9sZCA9IGhlaWdodCAqIFNDUk9MTF9QUk9YSU1JVFlfVEhSRVNIT0xEO1xuXG4gIGlmIChwb2ludGVyWSA+PSB0b3AgLSB5VGhyZXNob2xkICYmIHBvaW50ZXJZIDw9IHRvcCArIHlUaHJlc2hvbGQpIHtcbiAgICByZXR1cm4gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLlVQO1xuICB9IGVsc2UgaWYgKHBvaW50ZXJZID49IGJvdHRvbSAtIHlUaHJlc2hvbGQgJiYgcG9pbnRlclkgPD0gYm90dG9tICsgeVRocmVzaG9sZCkge1xuICAgIHJldHVybiBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uRE9XTjtcbiAgfVxuXG4gIHJldHVybiBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uTk9ORTtcbn1cblxuLyoqXG4gKiBHZXRzIHdoZXRoZXIgdGhlIGhvcml6b250YWwgYXV0by1zY3JvbGwgZGlyZWN0aW9uIG9mIGEgbm9kZS5cbiAqIEBwYXJhbSBjbGllbnRSZWN0IERpbWVuc2lvbnMgb2YgdGhlIG5vZGUuXG4gKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSB4IGF4aXMuXG4gKi9cbmZ1bmN0aW9uIGdldEhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24oY2xpZW50UmVjdDogQ2xpZW50UmVjdCwgcG9pbnRlclg6IG51bWJlcikge1xuICBjb25zdCB7bGVmdCwgcmlnaHQsIHdpZHRofSA9IGNsaWVudFJlY3Q7XG4gIGNvbnN0IHhUaHJlc2hvbGQgPSB3aWR0aCAqIFNDUk9MTF9QUk9YSU1JVFlfVEhSRVNIT0xEO1xuXG4gIGlmIChwb2ludGVyWCA+PSBsZWZ0IC0geFRocmVzaG9sZCAmJiBwb2ludGVyWCA8PSBsZWZ0ICsgeFRocmVzaG9sZCkge1xuICAgIHJldHVybiBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5MRUZUO1xuICB9IGVsc2UgaWYgKHBvaW50ZXJYID49IHJpZ2h0IC0geFRocmVzaG9sZCAmJiBwb2ludGVyWCA8PSByaWdodCArIHhUaHJlc2hvbGQpIHtcbiAgICByZXR1cm4gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uUklHSFQ7XG4gIH1cblxuICByZXR1cm4gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTk9ORTtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBkaXJlY3Rpb25zIGluIHdoaWNoIGFuIGVsZW1lbnQgbm9kZSBzaG91bGQgYmUgc2Nyb2xsZWQsXG4gKiBhc3N1bWluZyB0aGF0IHRoZSB1c2VyJ3MgcG9pbnRlciBpcyBhbHJlYWR5IHdpdGhpbiBpdCBzY3JvbGxhYmxlIHJlZ2lvbi5cbiAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgZm9yIHdoaWNoIHdlIHNob3VsZCBjYWxjdWxhdGUgdGhlIHNjcm9sbCBkaXJlY3Rpb24uXG4gKiBAcGFyYW0gY2xpZW50UmVjdCBCb3VuZGluZyBjbGllbnQgcmVjdGFuZ2xlIG9mIHRoZSBlbGVtZW50LlxuICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgeCBheGlzLlxuICogQHBhcmFtIHBvaW50ZXJZIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgeSBheGlzLlxuICovXG5mdW5jdGlvbiBnZXRFbGVtZW50U2Nyb2xsRGlyZWN0aW9ucyhlbGVtZW50OiBIVE1MRWxlbWVudCwgY2xpZW50UmVjdDogQ2xpZW50UmVjdCwgcG9pbnRlclg6IG51bWJlcixcbiAgcG9pbnRlclk6IG51bWJlcik6IFtBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24sIEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uXSB7XG4gIGNvbnN0IGNvbXB1dGVkVmVydGljYWwgPSBnZXRWZXJ0aWNhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0LCBwb2ludGVyWSk7XG4gIGNvbnN0IGNvbXB1dGVkSG9yaXpvbnRhbCA9IGdldEhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24oY2xpZW50UmVjdCwgcG9pbnRlclgpO1xuICBsZXQgdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uTk9ORTtcbiAgbGV0IGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5OT05FO1xuXG4gIC8vIE5vdGUgdGhhdCB3ZSBoZXJlIHdlIGRvIHNvbWUgZXh0cmEgY2hlY2tzIGZvciB3aGV0aGVyIHRoZSBlbGVtZW50IGlzIGFjdHVhbGx5IHNjcm9sbGFibGUgaW5cbiAgLy8gYSBjZXJ0YWluIGRpcmVjdGlvbiBhbmQgd2Ugb25seSBhc3NpZ24gdGhlIHNjcm9sbCBkaXJlY3Rpb24gaWYgaXQgaXMuIFdlIGRvIHRoaXMgc28gdGhhdCB3ZVxuICAvLyBjYW4gYWxsb3cgb3RoZXIgZWxlbWVudHMgdG8gYmUgc2Nyb2xsZWQsIGlmIHRoZSBjdXJyZW50IGVsZW1lbnQgY2FuJ3QgYmUgc2Nyb2xsZWQgYW55bW9yZS5cbiAgLy8gVGhpcyBhbGxvd3MgdXMgdG8gaGFuZGxlIGNhc2VzIHdoZXJlIHRoZSBzY3JvbGwgcmVnaW9ucyBvZiB0d28gc2Nyb2xsYWJsZSBlbGVtZW50cyBvdmVybGFwLlxuICBpZiAoY29tcHV0ZWRWZXJ0aWNhbCkge1xuICAgIGNvbnN0IHNjcm9sbFRvcCA9IGVsZW1lbnQuc2Nyb2xsVG9wO1xuXG4gICAgaWYgKGNvbXB1dGVkVmVydGljYWwgPT09IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5VUCkge1xuICAgICAgaWYgKHNjcm9sbFRvcCA+IDApIHtcbiAgICAgICAgdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uVVA7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChlbGVtZW50LnNjcm9sbEhlaWdodCAtIHNjcm9sbFRvcCA+IGVsZW1lbnQuY2xpZW50SGVpZ2h0KSB7XG4gICAgICB2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5ET1dOO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjb21wdXRlZEhvcml6b250YWwpIHtcbiAgICBjb25zdCBzY3JvbGxMZWZ0ID0gZWxlbWVudC5zY3JvbGxMZWZ0O1xuXG4gICAgaWYgKGNvbXB1dGVkSG9yaXpvbnRhbCA9PT0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTEVGVCkge1xuICAgICAgaWYgKHNjcm9sbExlZnQgPiAwKSB7XG4gICAgICAgIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5MRUZUO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZWxlbWVudC5zY3JvbGxXaWR0aCAtIHNjcm9sbExlZnQgPiBlbGVtZW50LmNsaWVudFdpZHRoKSB7XG4gICAgICBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uUklHSFQ7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFt2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiwgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbl07XG59XG4iXX0=