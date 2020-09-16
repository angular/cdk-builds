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
     * @param previousContainer Container from which the item got dragged in.
     * @param isPointerOverContainer Whether the user's pointer was over the
     *    container when the item was dropped.
     * @param distance Distance the user has dragged since the start of the dragging sequence.
     * @param previousIndex Index of the item when dragging started.
     *
     * @breaking-change 11.0.0 `previousIndex` parameter to become required.
     */
    drop(item, currentIndex, previousContainer, isPointerOverContainer, distance, previousIndex) {
        this._reset();
        // @breaking-change 11.0.0 Remove this fallback logic once `previousIndex` is a required param.
        if (previousIndex == null) {
            previousIndex = previousContainer.getItemIndex(item);
        }
        this.dropped.next({ item,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LXJlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2Ryb3AtbGlzdC1yZWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBSUgsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRXBELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsT0FBTyxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsdUJBQXVCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDOUUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFHN0MsT0FBTyxFQUNMLHVCQUF1QixFQUN2QixnQkFBZ0IsRUFDaEIsb0JBQW9CLEVBQ3BCLGtCQUFrQixHQUNuQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUdoRTs7O0dBR0c7QUFDSCxNQUFNLHdCQUF3QixHQUFHLElBQUksQ0FBQztBQUV0Qzs7O0dBR0c7QUFDSCxNQUFNLDBCQUEwQixHQUFHLElBQUksQ0FBQztBQUV4Qzs7O0dBR0c7QUFDSCxNQUFNLGdCQUFnQixHQUFHLENBQUMsQ0FBQztBQTRCM0I7O0dBRUc7QUFDSCxNQUFNLE9BQU8sV0FBVztJQW9JdEIsWUFDRSxPQUE4QyxFQUN0QyxpQkFBeUQsRUFDakUsU0FBYyxFQUNOLE9BQWUsRUFDZixjQUE2QjtRQUg3QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQXdDO1FBRXpELFlBQU8sR0FBUCxPQUFPLENBQVE7UUFDZixtQkFBYyxHQUFkLGNBQWMsQ0FBZTtRQXJJdkMsNEVBQTRFO1FBQzVFLGFBQVEsR0FBWSxLQUFLLENBQUM7UUFFMUIseURBQXlEO1FB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LENBQUM7QUFDOUQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0VsZW1lbnRSZWYsIE5nWm9uZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0RpcmVjdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtjb2VyY2VFbGVtZW50fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtWaWV3cG9ydFJ1bGVyfSBmcm9tICdAYW5ndWxhci9jZGsvc2Nyb2xsaW5nJztcbmltcG9ydCB7X2dldFNoYWRvd1Jvb3R9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge1N1YmplY3QsIFN1YnNjcmlwdGlvbiwgaW50ZXJ2YWwsIGFuaW1hdGlvbkZyYW1lU2NoZWR1bGVyfSBmcm9tICdyeGpzJztcbmltcG9ydCB7dGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge21vdmVJdGVtSW5BcnJheX0gZnJvbSAnLi9kcmFnLXV0aWxzJztcbmltcG9ydCB7RHJhZ0Ryb3BSZWdpc3RyeX0gZnJvbSAnLi9kcmFnLWRyb3AtcmVnaXN0cnknO1xuaW1wb3J0IHtEcmFnUmVmSW50ZXJuYWwgYXMgRHJhZ1JlZiwgUG9pbnR9IGZyb20gJy4vZHJhZy1yZWYnO1xuaW1wb3J0IHtcbiAgaXNQb2ludGVyTmVhckNsaWVudFJlY3QsXG4gIGFkanVzdENsaWVudFJlY3QsXG4gIGdldE11dGFibGVDbGllbnRSZWN0LFxuICBpc0luc2lkZUNsaWVudFJlY3QsXG59IGZyb20gJy4vY2xpZW50LXJlY3QnO1xuaW1wb3J0IHtQYXJlbnRQb3NpdGlvblRyYWNrZXJ9IGZyb20gJy4vcGFyZW50LXBvc2l0aW9uLXRyYWNrZXInO1xuaW1wb3J0IHtEcmFnQ1NTU3R5bGVEZWNsYXJhdGlvbn0gZnJvbSAnLi9kcmFnLXN0eWxpbmcnO1xuXG4vKipcbiAqIFByb3hpbWl0eSwgYXMgYSByYXRpbyB0byB3aWR0aC9oZWlnaHQsIGF0IHdoaWNoIGFcbiAqIGRyYWdnZWQgaXRlbSB3aWxsIGFmZmVjdCB0aGUgZHJvcCBjb250YWluZXIuXG4gKi9cbmNvbnN0IERST1BfUFJPWElNSVRZX1RIUkVTSE9MRCA9IDAuMDU7XG5cbi8qKlxuICogUHJveGltaXR5LCBhcyBhIHJhdGlvIHRvIHdpZHRoL2hlaWdodCBhdCB3aGljaCB0byBzdGFydCBhdXRvLXNjcm9sbGluZyB0aGUgZHJvcCBsaXN0IG9yIHRoZVxuICogdmlld3BvcnQuIFRoZSB2YWx1ZSBjb21lcyBmcm9tIHRyeWluZyBpdCBvdXQgbWFudWFsbHkgdW50aWwgaXQgZmVlbHMgcmlnaHQuXG4gKi9cbmNvbnN0IFNDUk9MTF9QUk9YSU1JVFlfVEhSRVNIT0xEID0gMC4wNTtcblxuLyoqXG4gKiBOdW1iZXIgb2YgcGl4ZWxzIHRvIHNjcm9sbCBmb3IgZWFjaCBmcmFtZSB3aGVuIGF1dG8tc2Nyb2xsaW5nIGFuIGVsZW1lbnQuXG4gKiBUaGUgdmFsdWUgY29tZXMgZnJvbSB0cnlpbmcgaXQgb3V0IG1hbnVhbGx5IHVudGlsIGl0IGZlZWxzIHJpZ2h0LlxuICovXG5jb25zdCBBVVRPX1NDUk9MTF9TVEVQID0gMjtcblxuLyoqXG4gKiBFbnRyeSBpbiB0aGUgcG9zaXRpb24gY2FjaGUgZm9yIGRyYWdnYWJsZSBpdGVtcy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuaW50ZXJmYWNlIENhY2hlZEl0ZW1Qb3NpdGlvbiB7XG4gIC8qKiBJbnN0YW5jZSBvZiB0aGUgZHJhZyBpdGVtLiAqL1xuICBkcmFnOiBEcmFnUmVmO1xuICAvKiogRGltZW5zaW9ucyBvZiB0aGUgaXRlbS4gKi9cbiAgY2xpZW50UmVjdDogQ2xpZW50UmVjdDtcbiAgLyoqIEFtb3VudCBieSB3aGljaCB0aGUgaXRlbSBoYXMgYmVlbiBtb3ZlZCBzaW5jZSBkcmFnZ2luZyBzdGFydGVkLiAqL1xuICBvZmZzZXQ6IG51bWJlcjtcbn1cblxuLyoqIFZlcnRpY2FsIGRpcmVjdGlvbiBpbiB3aGljaCB3ZSBjYW4gYXV0by1zY3JvbGwuICovXG5jb25zdCBlbnVtIEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbiB7Tk9ORSwgVVAsIERPV059XG5cbi8qKiBIb3Jpem9udGFsIGRpcmVjdGlvbiBpbiB3aGljaCB3ZSBjYW4gYXV0by1zY3JvbGwuICovXG5jb25zdCBlbnVtIEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uIHtOT05FLCBMRUZULCBSSUdIVH1cblxuLyoqXG4gKiBJbnRlcm5hbCBjb21waWxlLXRpbWUtb25seSByZXByZXNlbnRhdGlvbiBvZiBhIGBEcm9wTGlzdFJlZmAuXG4gKiBVc2VkIHRvIGF2b2lkIGNpcmN1bGFyIGltcG9ydCBpc3N1ZXMgYmV0d2VlbiB0aGUgYERyb3BMaXN0UmVmYCBhbmQgdGhlIGBEcmFnUmVmYC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEcm9wTGlzdFJlZkludGVybmFsIGV4dGVuZHMgRHJvcExpc3RSZWYge31cblxuLyoqXG4gKiBSZWZlcmVuY2UgdG8gYSBkcm9wIGxpc3QuIFVzZWQgdG8gbWFuaXB1bGF0ZSBvciBkaXNwb3NlIG9mIHRoZSBjb250YWluZXIuXG4gKi9cbmV4cG9ydCBjbGFzcyBEcm9wTGlzdFJlZjxUID0gYW55PiB7XG4gIC8qKiBFbGVtZW50IHRoYXQgdGhlIGRyb3AgbGlzdCBpcyBhdHRhY2hlZCB0by4gKi9cbiAgZWxlbWVudDogSFRNTEVsZW1lbnQgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50PjtcblxuICAvKiogV2hldGhlciBzdGFydGluZyBhIGRyYWdnaW5nIHNlcXVlbmNlIGZyb20gdGhpcyBjb250YWluZXIgaXMgZGlzYWJsZWQuICovXG4gIGRpc2FibGVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgc29ydGluZyBpdGVtcyB3aXRoaW4gdGhlIGxpc3QgaXMgZGlzYWJsZWQuICovXG4gIHNvcnRpbmdEaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBMb2NrcyB0aGUgcG9zaXRpb24gb2YgdGhlIGRyYWdnYWJsZSBlbGVtZW50cyBpbnNpZGUgdGhlIGNvbnRhaW5lciBhbG9uZyB0aGUgc3BlY2lmaWVkIGF4aXMuICovXG4gIGxvY2tBeGlzOiAneCcgfCAneSc7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgYXV0by1zY3JvbGxpbmcgdGhlIHZpZXcgd2hlbiB0aGUgdXNlclxuICAgKiBtb3ZlcyB0aGVpciBwb2ludGVyIGNsb3NlIHRvIHRoZSBlZGdlcyBpcyBkaXNhYmxlZC5cbiAgICovXG4gIGF1dG9TY3JvbGxEaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBGdW5jdGlvbiB0aGF0IGlzIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYW4gaXRlbVxuICAgKiBpcyBhbGxvd2VkIHRvIGJlIG1vdmVkIGludG8gYSBkcm9wIGNvbnRhaW5lci5cbiAgICovXG4gIGVudGVyUHJlZGljYXRlOiAoZHJhZzogRHJhZ1JlZiwgZHJvcDogRHJvcExpc3RSZWYpID0+IGJvb2xlYW4gPSAoKSA9PiB0cnVlO1xuXG4gIC8qKiBGdW5jdGlvbnMgdGhhdCBpcyB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIGFuIGl0ZW0gY2FuIGJlIHNvcnRlZCBpbnRvIGEgcGFydGljdWxhciBpbmRleC4gKi9cbiAgc29ydFByZWRpY2F0ZTogKGluZGV4OiBudW1iZXIsIGRyYWc6IERyYWdSZWYsIGRyb3A6IERyb3BMaXN0UmVmKSA9PiBib29sZWFuID0gKCkgPT4gdHJ1ZTtcblxuICAvKiogRW1pdHMgcmlnaHQgYmVmb3JlIGRyYWdnaW5nIGhhcyBzdGFydGVkLiAqL1xuICBiZWZvcmVTdGFydGVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKipcbiAgICogRW1pdHMgd2hlbiB0aGUgdXNlciBoYXMgbW92ZWQgYSBuZXcgZHJhZyBpdGVtIGludG8gdGhpcyBjb250YWluZXIuXG4gICAqL1xuICBlbnRlcmVkID0gbmV3IFN1YmplY3Q8e2l0ZW06IERyYWdSZWYsIGNvbnRhaW5lcjogRHJvcExpc3RSZWYsIGN1cnJlbnRJbmRleDogbnVtYmVyfT4oKTtcblxuICAvKipcbiAgICogRW1pdHMgd2hlbiB0aGUgdXNlciByZW1vdmVzIGFuIGl0ZW0gZnJvbSB0aGUgY29udGFpbmVyXG4gICAqIGJ5IGRyYWdnaW5nIGl0IGludG8gYW5vdGhlciBjb250YWluZXIuXG4gICAqL1xuICBleGl0ZWQgPSBuZXcgU3ViamVjdDx7aXRlbTogRHJhZ1JlZiwgY29udGFpbmVyOiBEcm9wTGlzdFJlZn0+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgZHJvcHMgYW4gaXRlbSBpbnNpZGUgdGhlIGNvbnRhaW5lci4gKi9cbiAgZHJvcHBlZCA9IG5ldyBTdWJqZWN0PHtcbiAgICBpdGVtOiBEcmFnUmVmLFxuICAgIGN1cnJlbnRJbmRleDogbnVtYmVyLFxuICAgIHByZXZpb3VzSW5kZXg6IG51bWJlcixcbiAgICBjb250YWluZXI6IERyb3BMaXN0UmVmLFxuICAgIHByZXZpb3VzQ29udGFpbmVyOiBEcm9wTGlzdFJlZixcbiAgICBpc1BvaW50ZXJPdmVyQ29udGFpbmVyOiBib29sZWFuLFxuICAgIGRpc3RhbmNlOiBQb2ludDtcbiAgfT4oKTtcblxuICAvKiogRW1pdHMgYXMgdGhlIHVzZXIgaXMgc3dhcHBpbmcgaXRlbXMgd2hpbGUgYWN0aXZlbHkgZHJhZ2dpbmcuICovXG4gIHNvcnRlZCA9IG5ldyBTdWJqZWN0PHtcbiAgICBwcmV2aW91c0luZGV4OiBudW1iZXIsXG4gICAgY3VycmVudEluZGV4OiBudW1iZXIsXG4gICAgY29udGFpbmVyOiBEcm9wTGlzdFJlZixcbiAgICBpdGVtOiBEcmFnUmVmXG4gIH0+KCk7XG5cbiAgLyoqIEFyYml0cmFyeSBkYXRhIHRoYXQgY2FuIGJlIGF0dGFjaGVkIHRvIHRoZSBkcm9wIGxpc3QuICovXG4gIGRhdGE6IFQ7XG5cbiAgLyoqIFdoZXRoZXIgYW4gaXRlbSBpbiB0aGUgbGlzdCBpcyBiZWluZyBkcmFnZ2VkLiAqL1xuICBwcml2YXRlIF9pc0RyYWdnaW5nID0gZmFsc2U7XG5cbiAgLyoqIENhY2hlIG9mIHRoZSBkaW1lbnNpb25zIG9mIGFsbCB0aGUgaXRlbXMgaW5zaWRlIHRoZSBjb250YWluZXIuICovXG4gIHByaXZhdGUgX2l0ZW1Qb3NpdGlvbnM6IENhY2hlZEl0ZW1Qb3NpdGlvbltdID0gW107XG5cbiAgLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBwb3NpdGlvbnMgb2YgYW55IHBhcmVudCBzY3JvbGxhYmxlIGVsZW1lbnRzLiAqL1xuICBwcml2YXRlIF9wYXJlbnRQb3NpdGlvbnM6IFBhcmVudFBvc2l0aW9uVHJhY2tlcjtcblxuICAvKiogQ2FjaGVkIGBDbGllbnRSZWN0YCBvZiB0aGUgZHJvcCBsaXN0LiAqL1xuICBwcml2YXRlIF9jbGllbnRSZWN0OiBDbGllbnRSZWN0O1xuXG4gIC8qKlxuICAgKiBEcmFnZ2FibGUgaXRlbXMgdGhhdCBhcmUgY3VycmVudGx5IGFjdGl2ZSBpbnNpZGUgdGhlIGNvbnRhaW5lci4gSW5jbHVkZXMgdGhlIGl0ZW1zXG4gICAqIGZyb20gYF9kcmFnZ2FibGVzYCwgYXMgd2VsbCBhcyBhbnkgaXRlbXMgdGhhdCBoYXZlIGJlZW4gZHJhZ2dlZCBpbiwgYnV0IGhhdmVuJ3RcbiAgICogYmVlbiBkcm9wcGVkIHlldC5cbiAgICovXG4gIHByaXZhdGUgX2FjdGl2ZURyYWdnYWJsZXM6IERyYWdSZWZbXTtcblxuICAvKipcbiAgICogS2VlcHMgdHJhY2sgb2YgdGhlIGl0ZW0gdGhhdCB3YXMgbGFzdCBzd2FwcGVkIHdpdGggdGhlIGRyYWdnZWQgaXRlbSwgYXMgd2VsbCBhcyB3aGF0IGRpcmVjdGlvblxuICAgKiB0aGUgcG9pbnRlciB3YXMgbW92aW5nIGluIHdoZW4gdGhlIHN3YXAgb2NjdXJlZCBhbmQgd2hldGhlciB0aGUgdXNlcidzIHBvaW50ZXIgY29udGludWVkIHRvXG4gICAqIG92ZXJsYXAgd2l0aCB0aGUgc3dhcHBlZCBpdGVtIGFmdGVyIHRoZSBzd2FwcGluZyBvY2N1cnJlZC5cbiAgICovXG4gIHByaXZhdGUgX3ByZXZpb3VzU3dhcCA9IHtkcmFnOiBudWxsIGFzIERyYWdSZWYgfCBudWxsLCBkZWx0YTogMCwgb3ZlcmxhcHM6IGZhbHNlfTtcblxuICAvKiogRHJhZ2dhYmxlIGl0ZW1zIGluIHRoZSBjb250YWluZXIuICovXG4gIHByaXZhdGUgX2RyYWdnYWJsZXM6IFJlYWRvbmx5QXJyYXk8RHJhZ1JlZj47XG5cbiAgLyoqIERyb3AgbGlzdHMgdGhhdCBhcmUgY29ubmVjdGVkIHRvIHRoZSBjdXJyZW50IG9uZS4gKi9cbiAgcHJpdmF0ZSBfc2libGluZ3M6IFJlYWRvbmx5QXJyYXk8RHJvcExpc3RSZWY+ID0gW107XG5cbiAgLyoqIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgbGlzdCBpcyBvcmllbnRlZC4gKi9cbiAgcHJpdmF0ZSBfb3JpZW50YXRpb246ICdob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCcgPSAndmVydGljYWwnO1xuXG4gIC8qKiBDb25uZWN0ZWQgc2libGluZ3MgdGhhdCBjdXJyZW50bHkgaGF2ZSBhIGRyYWdnZWQgaXRlbS4gKi9cbiAgcHJpdmF0ZSBfYWN0aXZlU2libGluZ3MgPSBuZXcgU2V0PERyb3BMaXN0UmVmPigpO1xuXG4gIC8qKiBMYXlvdXQgZGlyZWN0aW9uIG9mIHRoZSBkcm9wIGxpc3QuICovXG4gIHByaXZhdGUgX2RpcmVjdGlvbjogRGlyZWN0aW9uID0gJ2x0cic7XG5cbiAgLyoqIFN1YnNjcmlwdGlvbiB0byB0aGUgd2luZG93IGJlaW5nIHNjcm9sbGVkLiAqL1xuICBwcml2YXRlIF92aWV3cG9ydFNjcm9sbFN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcblxuICAvKiogVmVydGljYWwgZGlyZWN0aW9uIGluIHdoaWNoIHRoZSBsaXN0IGlzIGN1cnJlbnRseSBzY3JvbGxpbmcuICovXG4gIHByaXZhdGUgX3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLk5PTkU7XG5cbiAgLyoqIEhvcml6b250YWwgZGlyZWN0aW9uIGluIHdoaWNoIHRoZSBsaXN0IGlzIGN1cnJlbnRseSBzY3JvbGxpbmcuICovXG4gIHByaXZhdGUgX2hvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5OT05FO1xuXG4gIC8qKiBOb2RlIHRoYXQgaXMgYmVpbmcgYXV0by1zY3JvbGxlZC4gKi9cbiAgcHJpdmF0ZSBfc2Nyb2xsTm9kZTogSFRNTEVsZW1lbnQgfCBXaW5kb3c7XG5cbiAgLyoqIFVzZWQgdG8gc2lnbmFsIHRvIHRoZSBjdXJyZW50IGF1dG8tc2Nyb2xsIHNlcXVlbmNlIHdoZW4gdG8gc3RvcC4gKi9cbiAgcHJpdmF0ZSBfc3RvcFNjcm9sbFRpbWVycyA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIFNoYWRvdyByb290IG9mIHRoZSBjdXJyZW50IGVsZW1lbnQuIE5lY2Vzc2FyeSBmb3IgYGVsZW1lbnRGcm9tUG9pbnRgIHRvIHJlc29sdmUgY29ycmVjdGx5LiAqL1xuICBwcml2YXRlIF9jYWNoZWRTaGFkb3dSb290OiBEb2N1bWVudE9yU2hhZG93Um9vdCB8IG51bGwgPSBudWxsO1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIGRvY3VtZW50LiAqL1xuICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQ7XG5cbiAgLyoqIEVsZW1lbnRzIHRoYXQgY2FuIGJlIHNjcm9sbGVkIHdoaWxlIHRoZSB1c2VyIGlzIGRyYWdnaW5nLiAqL1xuICBwcml2YXRlIF9zY3JvbGxhYmxlRWxlbWVudHM6IEhUTUxFbGVtZW50W107XG5cbiAgLyoqIEluaXRpYWwgdmFsdWUgZm9yIHRoZSBlbGVtZW50J3MgYHNjcm9sbC1zbmFwLXR5cGVgIHN0eWxlLiAqL1xuICBwcml2YXRlIF9pbml0aWFsU2Nyb2xsU25hcDogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+IHwgSFRNTEVsZW1lbnQsXG4gICAgcHJpdmF0ZSBfZHJhZ0Ryb3BSZWdpc3RyeTogRHJhZ0Ryb3BSZWdpc3RyeTxEcmFnUmVmLCBEcm9wTGlzdFJlZj4sXG4gICAgX2RvY3VtZW50OiBhbnksXG4gICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgcHJpdmF0ZSBfdmlld3BvcnRSdWxlcjogVmlld3BvcnRSdWxlcikge1xuICAgIHRoaXMuZWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoZWxlbWVudCk7XG4gICAgdGhpcy5fZG9jdW1lbnQgPSBfZG9jdW1lbnQ7XG4gICAgdGhpcy53aXRoU2Nyb2xsYWJsZVBhcmVudHMoW3RoaXMuZWxlbWVudF0pO1xuICAgIF9kcmFnRHJvcFJlZ2lzdHJ5LnJlZ2lzdGVyRHJvcENvbnRhaW5lcih0aGlzKTtcbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMgPSBuZXcgUGFyZW50UG9zaXRpb25UcmFja2VyKF9kb2N1bWVudCwgX3ZpZXdwb3J0UnVsZXIpO1xuICB9XG5cbiAgLyoqIFJlbW92ZXMgdGhlIGRyb3AgbGlzdCBmdW5jdGlvbmFsaXR5IGZyb20gdGhlIERPTSBlbGVtZW50LiAqL1xuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuX3N0b3BTY3JvbGxpbmcoKTtcbiAgICB0aGlzLl9zdG9wU2Nyb2xsVGltZXJzLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmJlZm9yZVN0YXJ0ZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmVudGVyZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmV4aXRlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuZHJvcHBlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuc29ydGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fYWN0aXZlU2libGluZ3MuY2xlYXIoKTtcbiAgICB0aGlzLl9zY3JvbGxOb2RlID0gbnVsbCE7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLmNsZWFyKCk7XG4gICAgdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5yZW1vdmVEcm9wQ29udGFpbmVyKHRoaXMpO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgYW4gaXRlbSBmcm9tIHRoaXMgbGlzdCBpcyBjdXJyZW50bHkgYmVpbmcgZHJhZ2dlZC4gKi9cbiAgaXNEcmFnZ2luZygpIHtcbiAgICByZXR1cm4gdGhpcy5faXNEcmFnZ2luZztcbiAgfVxuXG4gIC8qKiBTdGFydHMgZHJhZ2dpbmcgYW4gaXRlbS4gKi9cbiAgc3RhcnQoKTogdm9pZCB7XG4gICAgY29uc3Qgc3R5bGVzID0gY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpLnN0eWxlIGFzIERyYWdDU1NTdHlsZURlY2xhcmF0aW9uO1xuICAgIHRoaXMuYmVmb3JlU3RhcnRlZC5uZXh0KCk7XG4gICAgdGhpcy5faXNEcmFnZ2luZyA9IHRydWU7XG5cbiAgICAvLyBXZSBuZWVkIHRvIGRpc2FibGUgc2Nyb2xsIHNuYXBwaW5nIHdoaWxlIHRoZSB1c2VyIGlzIGRyYWdnaW5nLCBiZWNhdXNlIGl0IGJyZWFrcyBhdXRvbWF0aWNcbiAgICAvLyBzY3JvbGxpbmcuIFRoZSBicm93c2VyIHNlZW1zIHRvIHJvdW5kIHRoZSB2YWx1ZSBiYXNlZCBvbiB0aGUgc25hcHBpbmcgcG9pbnRzIHdoaWNoIG1lYW5zXG4gICAgLy8gdGhhdCB3ZSBjYW4ndCBpbmNyZW1lbnQvZGVjcmVtZW50IHRoZSBzY3JvbGwgcG9zaXRpb24uXG4gICAgdGhpcy5faW5pdGlhbFNjcm9sbFNuYXAgPSBzdHlsZXMubXNTY3JvbGxTbmFwVHlwZSB8fCBzdHlsZXMuc2Nyb2xsU25hcFR5cGUgfHwgJyc7XG4gICAgc3R5bGVzLnNjcm9sbFNuYXBUeXBlID0gc3R5bGVzLm1zU2Nyb2xsU25hcFR5cGUgPSAnbm9uZSc7XG4gICAgdGhpcy5fY2FjaGVJdGVtcygpO1xuICAgIHRoaXMuX3NpYmxpbmdzLmZvckVhY2goc2libGluZyA9PiBzaWJsaW5nLl9zdGFydFJlY2VpdmluZyh0aGlzKSk7XG4gICAgdGhpcy5fdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9saXN0ZW5Ub1Njcm9sbEV2ZW50cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEVtaXRzIGFuIGV2ZW50IHRvIGluZGljYXRlIHRoYXQgdGhlIHVzZXIgbW92ZWQgYW4gaXRlbSBpbnRvIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdGhhdCB3YXMgbW92ZWQgaW50byB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHBvaW50ZXJZIFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqIEBwYXJhbSBpbmRleCBJbmRleCBhdCB3aGljaCB0aGUgaXRlbSBlbnRlcmVkLiBJZiBvbWl0dGVkLCB0aGUgY29udGFpbmVyIHdpbGwgdHJ5IHRvIGZpZ3VyZSBpdFxuICAgKiAgIG91dCBhdXRvbWF0aWNhbGx5LlxuICAgKi9cbiAgZW50ZXIoaXRlbTogRHJhZ1JlZiwgcG9pbnRlclg6IG51bWJlciwgcG9pbnRlclk6IG51bWJlciwgaW5kZXg/OiBudW1iZXIpOiB2b2lkIHtcbiAgICB0aGlzLnN0YXJ0KCk7XG5cbiAgICAvLyBJZiBzb3J0aW5nIGlzIGRpc2FibGVkLCB3ZSB3YW50IHRoZSBpdGVtIHRvIHJldHVybiB0byBpdHMgc3RhcnRpbmdcbiAgICAvLyBwb3NpdGlvbiBpZiB0aGUgdXNlciBpcyByZXR1cm5pbmcgaXQgdG8gaXRzIGluaXRpYWwgY29udGFpbmVyLlxuICAgIGxldCBuZXdJbmRleDogbnVtYmVyO1xuXG4gICAgaWYgKGluZGV4ID09IG51bGwpIHtcbiAgICAgIG5ld0luZGV4ID0gdGhpcy5zb3J0aW5nRGlzYWJsZWQgPyB0aGlzLl9kcmFnZ2FibGVzLmluZGV4T2YoaXRlbSkgOiAtMTtcblxuICAgICAgaWYgKG5ld0luZGV4ID09PSAtMSkge1xuICAgICAgICAvLyBXZSB1c2UgdGhlIGNvb3JkaW5hdGVzIG9mIHdoZXJlIHRoZSBpdGVtIGVudGVyZWQgdGhlIGRyb3BcbiAgICAgICAgLy8gem9uZSB0byBmaWd1cmUgb3V0IGF0IHdoaWNoIGluZGV4IGl0IHNob3VsZCBiZSBpbnNlcnRlZC5cbiAgICAgICAgbmV3SW5kZXggPSB0aGlzLl9nZXRJdGVtSW5kZXhGcm9tUG9pbnRlclBvc2l0aW9uKGl0ZW0sIHBvaW50ZXJYLCBwb2ludGVyWSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld0luZGV4ID0gaW5kZXg7XG4gICAgfVxuXG4gICAgY29uc3QgYWN0aXZlRHJhZ2dhYmxlcyA9IHRoaXMuX2FjdGl2ZURyYWdnYWJsZXM7XG4gICAgY29uc3QgY3VycmVudEluZGV4ID0gYWN0aXZlRHJhZ2dhYmxlcy5pbmRleE9mKGl0ZW0pO1xuICAgIGNvbnN0IHBsYWNlaG9sZGVyID0gaXRlbS5nZXRQbGFjZWhvbGRlckVsZW1lbnQoKTtcbiAgICBsZXQgbmV3UG9zaXRpb25SZWZlcmVuY2U6IERyYWdSZWYgfCB1bmRlZmluZWQgPSBhY3RpdmVEcmFnZ2FibGVzW25ld0luZGV4XTtcblxuICAgIC8vIElmIHRoZSBpdGVtIGF0IHRoZSBuZXcgcG9zaXRpb24gaXMgdGhlIHNhbWUgYXMgdGhlIGl0ZW0gdGhhdCBpcyBiZWluZyBkcmFnZ2VkLFxuICAgIC8vIGl0IG1lYW5zIHRoYXQgd2UncmUgdHJ5aW5nIHRvIHJlc3RvcmUgdGhlIGl0ZW0gdG8gaXRzIGluaXRpYWwgcG9zaXRpb24uIEluIHRoaXNcbiAgICAvLyBjYXNlIHdlIHNob3VsZCB1c2UgdGhlIG5leHQgaXRlbSBmcm9tIHRoZSBsaXN0IGFzIHRoZSByZWZlcmVuY2UuXG4gICAgaWYgKG5ld1Bvc2l0aW9uUmVmZXJlbmNlID09PSBpdGVtKSB7XG4gICAgICBuZXdQb3NpdGlvblJlZmVyZW5jZSA9IGFjdGl2ZURyYWdnYWJsZXNbbmV3SW5kZXggKyAxXTtcbiAgICB9XG5cbiAgICAvLyBTaW5jZSB0aGUgaXRlbSBtYXkgYmUgaW4gdGhlIGBhY3RpdmVEcmFnZ2FibGVzYCBhbHJlYWR5IChlLmcuIGlmIHRoZSB1c2VyIGRyYWdnZWQgaXRcbiAgICAvLyBpbnRvIGFub3RoZXIgY29udGFpbmVyIGFuZCBiYWNrIGFnYWluKSwgd2UgaGF2ZSB0byBlbnN1cmUgdGhhdCBpdCBpc24ndCBkdXBsaWNhdGVkLlxuICAgIGlmIChjdXJyZW50SW5kZXggPiAtMSkge1xuICAgICAgYWN0aXZlRHJhZ2dhYmxlcy5zcGxpY2UoY3VycmVudEluZGV4LCAxKTtcbiAgICB9XG5cbiAgICAvLyBEb24ndCB1c2UgaXRlbXMgdGhhdCBhcmUgYmVpbmcgZHJhZ2dlZCBhcyBhIHJlZmVyZW5jZSwgYmVjYXVzZVxuICAgIC8vIHRoZWlyIGVsZW1lbnQgaGFzIGJlZW4gbW92ZWQgZG93biB0byB0aGUgYm90dG9tIG9mIHRoZSBib2R5LlxuICAgIGlmIChuZXdQb3NpdGlvblJlZmVyZW5jZSAmJiAhdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5pc0RyYWdnaW5nKG5ld1Bvc2l0aW9uUmVmZXJlbmNlKSkge1xuICAgICAgY29uc3QgZWxlbWVudCA9IG5ld1Bvc2l0aW9uUmVmZXJlbmNlLmdldFJvb3RFbGVtZW50KCk7XG4gICAgICBlbGVtZW50LnBhcmVudEVsZW1lbnQhLmluc2VydEJlZm9yZShwbGFjZWhvbGRlciwgZWxlbWVudCk7XG4gICAgICBhY3RpdmVEcmFnZ2FibGVzLnNwbGljZShuZXdJbmRleCwgMCwgaXRlbSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9zaG91bGRFbnRlckFzRmlyc3RDaGlsZChwb2ludGVyWCwgcG9pbnRlclkpKSB7XG4gICAgICBjb25zdCByZWZlcmVuY2UgPSBhY3RpdmVEcmFnZ2FibGVzWzBdLmdldFJvb3RFbGVtZW50KCk7XG4gICAgICByZWZlcmVuY2UucGFyZW50Tm9kZSEuaW5zZXJ0QmVmb3JlKHBsYWNlaG9sZGVyLCByZWZlcmVuY2UpO1xuICAgICAgYWN0aXZlRHJhZ2dhYmxlcy51bnNoaWZ0KGl0ZW0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb2VyY2VFbGVtZW50KHRoaXMuZWxlbWVudCkuYXBwZW5kQ2hpbGQocGxhY2Vob2xkZXIpO1xuICAgICAgYWN0aXZlRHJhZ2dhYmxlcy5wdXNoKGl0ZW0pO1xuICAgIH1cblxuICAgIC8vIFRoZSB0cmFuc2Zvcm0gbmVlZHMgdG8gYmUgY2xlYXJlZCBzbyBpdCBkb2Vzbid0IHRocm93IG9mZiB0aGUgbWVhc3VyZW1lbnRzLlxuICAgIHBsYWNlaG9sZGVyLnN0eWxlLnRyYW5zZm9ybSA9ICcnO1xuXG4gICAgLy8gTm90ZSB0aGF0IHRoZSBwb3NpdGlvbnMgd2VyZSBhbHJlYWR5IGNhY2hlZCB3aGVuIHdlIGNhbGxlZCBgc3RhcnRgIGFib3ZlLFxuICAgIC8vIGJ1dCB3ZSBuZWVkIHRvIHJlZnJlc2ggdGhlbSBzaW5jZSB0aGUgYW1vdW50IG9mIGl0ZW1zIGhhcyBjaGFuZ2VkIGFuZCBhbHNvIHBhcmVudCByZWN0cy5cbiAgICB0aGlzLl9jYWNoZUl0ZW1Qb3NpdGlvbnMoKTtcbiAgICB0aGlzLl9jYWNoZVBhcmVudFBvc2l0aW9ucygpO1xuXG4gICAgdGhpcy5lbnRlcmVkLm5leHQoe2l0ZW0sIGNvbnRhaW5lcjogdGhpcywgY3VycmVudEluZGV4OiB0aGlzLmdldEl0ZW1JbmRleChpdGVtKX0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYW4gaXRlbSBmcm9tIHRoZSBjb250YWluZXIgYWZ0ZXIgaXQgd2FzIGRyYWdnZWQgaW50byBhbm90aGVyIGNvbnRhaW5lciBieSB0aGUgdXNlci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB0aGF0IHdhcyBkcmFnZ2VkIG91dC5cbiAgICovXG4gIGV4aXQoaXRlbTogRHJhZ1JlZik6IHZvaWQge1xuICAgIHRoaXMuX3Jlc2V0KCk7XG4gICAgdGhpcy5leGl0ZWQubmV4dCh7aXRlbSwgY29udGFpbmVyOiB0aGlzfSk7XG4gIH1cblxuICAvKipcbiAgICogRHJvcHMgYW4gaXRlbSBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIGJlaW5nIGRyb3BwZWQgaW50byB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gY3VycmVudEluZGV4IEluZGV4IGF0IHdoaWNoIHRoZSBpdGVtIHNob3VsZCBiZSBpbnNlcnRlZC5cbiAgICogQHBhcmFtIHByZXZpb3VzQ29udGFpbmVyIENvbnRhaW5lciBmcm9tIHdoaWNoIHRoZSBpdGVtIGdvdCBkcmFnZ2VkIGluLlxuICAgKiBAcGFyYW0gaXNQb2ludGVyT3ZlckNvbnRhaW5lciBXaGV0aGVyIHRoZSB1c2VyJ3MgcG9pbnRlciB3YXMgb3ZlciB0aGVcbiAgICogICAgY29udGFpbmVyIHdoZW4gdGhlIGl0ZW0gd2FzIGRyb3BwZWQuXG4gICAqIEBwYXJhbSBkaXN0YW5jZSBEaXN0YW5jZSB0aGUgdXNlciBoYXMgZHJhZ2dlZCBzaW5jZSB0aGUgc3RhcnQgb2YgdGhlIGRyYWdnaW5nIHNlcXVlbmNlLlxuICAgKiBAcGFyYW0gcHJldmlvdXNJbmRleCBJbmRleCBvZiB0aGUgaXRlbSB3aGVuIGRyYWdnaW5nIHN0YXJ0ZWQuXG4gICAqXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMTEuMC4wIGBwcmV2aW91c0luZGV4YCBwYXJhbWV0ZXIgdG8gYmVjb21lIHJlcXVpcmVkLlxuICAgKi9cbiAgZHJvcChpdGVtOiBEcmFnUmVmLCBjdXJyZW50SW5kZXg6IG51bWJlciwgcHJldmlvdXNDb250YWluZXI6IERyb3BMaXN0UmVmLFxuICAgIGlzUG9pbnRlck92ZXJDb250YWluZXI6IGJvb2xlYW4sIGRpc3RhbmNlOiBQb2ludCwgcHJldmlvdXNJbmRleD86IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMuX3Jlc2V0KCk7XG5cbiAgICAvLyBAYnJlYWtpbmctY2hhbmdlIDExLjAuMCBSZW1vdmUgdGhpcyBmYWxsYmFjayBsb2dpYyBvbmNlIGBwcmV2aW91c0luZGV4YCBpcyBhIHJlcXVpcmVkIHBhcmFtLlxuICAgIGlmIChwcmV2aW91c0luZGV4ID09IG51bGwpIHtcbiAgICAgIHByZXZpb3VzSW5kZXggPSBwcmV2aW91c0NvbnRhaW5lci5nZXRJdGVtSW5kZXgoaXRlbSk7XG4gICAgfVxuXG4gICAgdGhpcy5kcm9wcGVkLm5leHQoe2l0ZW0sXG4gICAgICBjdXJyZW50SW5kZXgsXG4gICAgICBwcmV2aW91c0luZGV4LFxuICAgICAgY29udGFpbmVyOiB0aGlzLFxuICAgICAgcHJldmlvdXNDb250YWluZXIsXG4gICAgICBpc1BvaW50ZXJPdmVyQ29udGFpbmVyLFxuICAgICAgZGlzdGFuY2VcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBkcmFnZ2FibGUgaXRlbXMgdGhhdCBhcmUgYSBwYXJ0IG9mIHRoaXMgbGlzdC5cbiAgICogQHBhcmFtIGl0ZW1zIEl0ZW1zIHRoYXQgYXJlIGEgcGFydCBvZiB0aGlzIGxpc3QuXG4gICAqL1xuICB3aXRoSXRlbXMoaXRlbXM6IERyYWdSZWZbXSk6IHRoaXMge1xuICAgIGNvbnN0IHByZXZpb3VzSXRlbXMgPSB0aGlzLl9kcmFnZ2FibGVzO1xuICAgIHRoaXMuX2RyYWdnYWJsZXMgPSBpdGVtcztcbiAgICBpdGVtcy5mb3JFYWNoKGl0ZW0gPT4gaXRlbS5fd2l0aERyb3BDb250YWluZXIodGhpcykpO1xuXG4gICAgaWYgKHRoaXMuaXNEcmFnZ2luZygpKSB7XG4gICAgICBjb25zdCBkcmFnZ2VkSXRlbXMgPSBwcmV2aW91c0l0ZW1zLmZpbHRlcihpdGVtID0+IGl0ZW0uaXNEcmFnZ2luZygpKTtcblxuICAgICAgLy8gSWYgYWxsIG9mIHRoZSBpdGVtcyBiZWluZyBkcmFnZ2VkIHdlcmUgcmVtb3ZlZFxuICAgICAgLy8gZnJvbSB0aGUgbGlzdCwgYWJvcnQgdGhlIGN1cnJlbnQgZHJhZyBzZXF1ZW5jZS5cbiAgICAgIGlmIChkcmFnZ2VkSXRlbXMuZXZlcnkoaXRlbSA9PiBpdGVtcy5pbmRleE9mKGl0ZW0pID09PSAtMSkpIHtcbiAgICAgICAgdGhpcy5fcmVzZXQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2NhY2hlSXRlbXMoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBsYXlvdXQgZGlyZWN0aW9uIG9mIHRoZSBkcm9wIGxpc3QuICovXG4gIHdpdGhEaXJlY3Rpb24oZGlyZWN0aW9uOiBEaXJlY3Rpb24pOiB0aGlzIHtcbiAgICB0aGlzLl9kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY29udGFpbmVycyB0aGF0IGFyZSBjb25uZWN0ZWQgdG8gdGhpcyBvbmUuIFdoZW4gdHdvIG9yIG1vcmUgY29udGFpbmVycyBhcmVcbiAgICogY29ubmVjdGVkLCB0aGUgdXNlciB3aWxsIGJlIGFsbG93ZWQgdG8gdHJhbnNmZXIgaXRlbXMgYmV0d2VlbiB0aGVtLlxuICAgKiBAcGFyYW0gY29ubmVjdGVkVG8gT3RoZXIgY29udGFpbmVycyB0aGF0IHRoZSBjdXJyZW50IGNvbnRhaW5lcnMgc2hvdWxkIGJlIGNvbm5lY3RlZCB0by5cbiAgICovXG4gIGNvbm5lY3RlZFRvKGNvbm5lY3RlZFRvOiBEcm9wTGlzdFJlZltdKTogdGhpcyB7XG4gICAgdGhpcy5fc2libGluZ3MgPSBjb25uZWN0ZWRUby5zbGljZSgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG9yaWVudGF0aW9uIG9mIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSBvcmllbnRhdGlvbiBOZXcgb3JpZW50YXRpb24gZm9yIHRoZSBjb250YWluZXIuXG4gICAqL1xuICB3aXRoT3JpZW50YXRpb24ob3JpZW50YXRpb246ICd2ZXJ0aWNhbCcgfCAnaG9yaXpvbnRhbCcpOiB0aGlzIHtcbiAgICB0aGlzLl9vcmllbnRhdGlvbiA9IG9yaWVudGF0aW9uO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgd2hpY2ggcGFyZW50IGVsZW1lbnRzIGFyZSBjYW4gYmUgc2Nyb2xsZWQgd2hpbGUgdGhlIHVzZXIgaXMgZHJhZ2dpbmcuXG4gICAqIEBwYXJhbSBlbGVtZW50cyBFbGVtZW50cyB0aGF0IGNhbiBiZSBzY3JvbGxlZC5cbiAgICovXG4gIHdpdGhTY3JvbGxhYmxlUGFyZW50cyhlbGVtZW50czogSFRNTEVsZW1lbnRbXSk6IHRoaXMge1xuICAgIGNvbnN0IGVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KHRoaXMuZWxlbWVudCk7XG5cbiAgICAvLyBXZSBhbHdheXMgYWxsb3cgdGhlIGN1cnJlbnQgZWxlbWVudCB0byBiZSBzY3JvbGxhYmxlXG4gICAgLy8gc28gd2UgbmVlZCB0byBlbnN1cmUgdGhhdCBpdCdzIGluIHRoZSBhcnJheS5cbiAgICB0aGlzLl9zY3JvbGxhYmxlRWxlbWVudHMgPVxuICAgICAgICBlbGVtZW50cy5pbmRleE9mKGVsZW1lbnQpID09PSAtMSA/IFtlbGVtZW50LCAuLi5lbGVtZW50c10gOiBlbGVtZW50cy5zbGljZSgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIHNjcm9sbGFibGUgcGFyZW50cyB0aGF0IGFyZSByZWdpc3RlcmVkIHdpdGggdGhpcyBkcm9wIGNvbnRhaW5lci4gKi9cbiAgZ2V0U2Nyb2xsYWJsZVBhcmVudHMoKTogUmVhZG9ubHlBcnJheTxIVE1MRWxlbWVudD4ge1xuICAgIHJldHVybiB0aGlzLl9zY3JvbGxhYmxlRWxlbWVudHM7XG4gIH1cblxuICAvKipcbiAgICogRmlndXJlcyBvdXQgdGhlIGluZGV4IG9mIGFuIGl0ZW0gaW4gdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB3aG9zZSBpbmRleCBzaG91bGQgYmUgZGV0ZXJtaW5lZC5cbiAgICovXG4gIGdldEl0ZW1JbmRleChpdGVtOiBEcmFnUmVmKTogbnVtYmVyIHtcbiAgICBpZiAoIXRoaXMuX2lzRHJhZ2dpbmcpIHtcbiAgICAgIHJldHVybiB0aGlzLl9kcmFnZ2FibGVzLmluZGV4T2YoaXRlbSk7XG4gICAgfVxuXG4gICAgLy8gSXRlbXMgYXJlIHNvcnRlZCBhbHdheXMgYnkgdG9wL2xlZnQgaW4gdGhlIGNhY2hlLCBob3dldmVyIHRoZXkgZmxvdyBkaWZmZXJlbnRseSBpbiBSVEwuXG4gICAgLy8gVGhlIHJlc3Qgb2YgdGhlIGxvZ2ljIHN0aWxsIHN0YW5kcyBubyBtYXR0ZXIgd2hhdCBvcmllbnRhdGlvbiB3ZSdyZSBpbiwgaG93ZXZlclxuICAgIC8vIHdlIG5lZWQgdG8gaW52ZXJ0IHRoZSBhcnJheSB3aGVuIGRldGVybWluaW5nIHRoZSBpbmRleC5cbiAgICBjb25zdCBpdGVtcyA9IHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcgJiYgdGhpcy5fZGlyZWN0aW9uID09PSAncnRsJyA/XG4gICAgICAgIHRoaXMuX2l0ZW1Qb3NpdGlvbnMuc2xpY2UoKS5yZXZlcnNlKCkgOiB0aGlzLl9pdGVtUG9zaXRpb25zO1xuXG4gICAgcmV0dXJuIGZpbmRJbmRleChpdGVtcywgY3VycmVudEl0ZW0gPT4gY3VycmVudEl0ZW0uZHJhZyA9PT0gaXRlbSk7XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0aGUgbGlzdCBpcyBhYmxlIHRvIHJlY2VpdmUgdGhlIGl0ZW0gdGhhdFxuICAgKiBpcyBjdXJyZW50bHkgYmVpbmcgZHJhZ2dlZCBpbnNpZGUgYSBjb25uZWN0ZWQgZHJvcCBsaXN0LlxuICAgKi9cbiAgaXNSZWNlaXZpbmcoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2FjdGl2ZVNpYmxpbmdzLnNpemUgPiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIFNvcnRzIGFuIGl0ZW0gaW5zaWRlIHRoZSBjb250YWluZXIgYmFzZWQgb24gaXRzIHBvc2l0aW9uLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRvIGJlIHNvcnRlZC5cbiAgICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKiBAcGFyYW0gcG9pbnRlckRlbHRhIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgcG9pbnRlciBpcyBtb3ZpbmcgYWxvbmcgZWFjaCBheGlzLlxuICAgKi9cbiAgX3NvcnRJdGVtKGl0ZW06IERyYWdSZWYsIHBvaW50ZXJYOiBudW1iZXIsIHBvaW50ZXJZOiBudW1iZXIsXG4gICAgICAgICAgICBwb2ludGVyRGVsdGE6IHt4OiBudW1iZXIsIHk6IG51bWJlcn0pOiB2b2lkIHtcbiAgICAvLyBEb24ndCBzb3J0IHRoZSBpdGVtIGlmIHNvcnRpbmcgaXMgZGlzYWJsZWQgb3IgaXQncyBvdXQgb2YgcmFuZ2UuXG4gICAgaWYgKHRoaXMuc29ydGluZ0Rpc2FibGVkIHx8XG4gICAgICAgICFpc1BvaW50ZXJOZWFyQ2xpZW50UmVjdCh0aGlzLl9jbGllbnRSZWN0LCBEUk9QX1BST1hJTUlUWV9USFJFU0hPTEQsIHBvaW50ZXJYLCBwb2ludGVyWSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzaWJsaW5ncyA9IHRoaXMuX2l0ZW1Qb3NpdGlvbnM7XG4gICAgY29uc3QgbmV3SW5kZXggPSB0aGlzLl9nZXRJdGVtSW5kZXhGcm9tUG9pbnRlclBvc2l0aW9uKGl0ZW0sIHBvaW50ZXJYLCBwb2ludGVyWSwgcG9pbnRlckRlbHRhKTtcblxuICAgIGlmIChuZXdJbmRleCA9PT0gLTEgJiYgc2libGluZ3MubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCc7XG4gICAgY29uc3QgY3VycmVudEluZGV4ID0gZmluZEluZGV4KHNpYmxpbmdzLCBjdXJyZW50SXRlbSA9PiBjdXJyZW50SXRlbS5kcmFnID09PSBpdGVtKTtcbiAgICBjb25zdCBzaWJsaW5nQXROZXdQb3NpdGlvbiA9IHNpYmxpbmdzW25ld0luZGV4XTtcbiAgICBjb25zdCBjdXJyZW50UG9zaXRpb24gPSBzaWJsaW5nc1tjdXJyZW50SW5kZXhdLmNsaWVudFJlY3Q7XG4gICAgY29uc3QgbmV3UG9zaXRpb24gPSBzaWJsaW5nQXROZXdQb3NpdGlvbi5jbGllbnRSZWN0O1xuICAgIGNvbnN0IGRlbHRhID0gY3VycmVudEluZGV4ID4gbmV3SW5kZXggPyAxIDogLTE7XG5cbiAgICAvLyBIb3cgbWFueSBwaXhlbHMgdGhlIGl0ZW0ncyBwbGFjZWhvbGRlciBzaG91bGQgYmUgb2Zmc2V0LlxuICAgIGNvbnN0IGl0ZW1PZmZzZXQgPSB0aGlzLl9nZXRJdGVtT2Zmc2V0UHgoY3VycmVudFBvc2l0aW9uLCBuZXdQb3NpdGlvbiwgZGVsdGEpO1xuXG4gICAgLy8gSG93IG1hbnkgcGl4ZWxzIGFsbCB0aGUgb3RoZXIgaXRlbXMgc2hvdWxkIGJlIG9mZnNldC5cbiAgICBjb25zdCBzaWJsaW5nT2Zmc2V0ID0gdGhpcy5fZ2V0U2libGluZ09mZnNldFB4KGN1cnJlbnRJbmRleCwgc2libGluZ3MsIGRlbHRhKTtcblxuICAgIC8vIFNhdmUgdGhlIHByZXZpb3VzIG9yZGVyIG9mIHRoZSBpdGVtcyBiZWZvcmUgbW92aW5nIHRoZSBpdGVtIHRvIGl0cyBuZXcgaW5kZXguXG4gICAgLy8gV2UgdXNlIHRoaXMgdG8gY2hlY2sgd2hldGhlciBhbiBpdGVtIGhhcyBiZWVuIG1vdmVkIGFzIGEgcmVzdWx0IG9mIHRoZSBzb3J0aW5nLlxuICAgIGNvbnN0IG9sZE9yZGVyID0gc2libGluZ3Muc2xpY2UoKTtcblxuICAgIC8vIFNodWZmbGUgdGhlIGFycmF5IGluIHBsYWNlLlxuICAgIG1vdmVJdGVtSW5BcnJheShzaWJsaW5ncywgY3VycmVudEluZGV4LCBuZXdJbmRleCk7XG5cbiAgICB0aGlzLnNvcnRlZC5uZXh0KHtcbiAgICAgIHByZXZpb3VzSW5kZXg6IGN1cnJlbnRJbmRleCxcbiAgICAgIGN1cnJlbnRJbmRleDogbmV3SW5kZXgsXG4gICAgICBjb250YWluZXI6IHRoaXMsXG4gICAgICBpdGVtXG4gICAgfSk7XG5cbiAgICBzaWJsaW5ncy5mb3JFYWNoKChzaWJsaW5nLCBpbmRleCkgPT4ge1xuICAgICAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgdGhlIHBvc2l0aW9uIGhhc24ndCBjaGFuZ2VkLlxuICAgICAgaWYgKG9sZE9yZGVyW2luZGV4XSA9PT0gc2libGluZykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGlzRHJhZ2dlZEl0ZW0gPSBzaWJsaW5nLmRyYWcgPT09IGl0ZW07XG4gICAgICBjb25zdCBvZmZzZXQgPSBpc0RyYWdnZWRJdGVtID8gaXRlbU9mZnNldCA6IHNpYmxpbmdPZmZzZXQ7XG4gICAgICBjb25zdCBlbGVtZW50VG9PZmZzZXQgPSBpc0RyYWdnZWRJdGVtID8gaXRlbS5nZXRQbGFjZWhvbGRlckVsZW1lbnQoKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2libGluZy5kcmFnLmdldFJvb3RFbGVtZW50KCk7XG5cbiAgICAgIC8vIFVwZGF0ZSB0aGUgb2Zmc2V0IHRvIHJlZmxlY3QgdGhlIG5ldyBwb3NpdGlvbi5cbiAgICAgIHNpYmxpbmcub2Zmc2V0ICs9IG9mZnNldDtcblxuICAgICAgLy8gU2luY2Ugd2UncmUgbW92aW5nIHRoZSBpdGVtcyB3aXRoIGEgYHRyYW5zZm9ybWAsIHdlIG5lZWQgdG8gYWRqdXN0IHRoZWlyIGNhY2hlZFxuICAgICAgLy8gY2xpZW50IHJlY3RzIHRvIHJlZmxlY3QgdGhlaXIgbmV3IHBvc2l0aW9uLCBhcyB3ZWxsIGFzIHN3YXAgdGhlaXIgcG9zaXRpb25zIGluIHRoZSBjYWNoZS5cbiAgICAgIC8vIE5vdGUgdGhhdCB3ZSBzaG91bGRuJ3QgdXNlIGBnZXRCb3VuZGluZ0NsaWVudFJlY3RgIGhlcmUgdG8gdXBkYXRlIHRoZSBjYWNoZSwgYmVjYXVzZSB0aGVcbiAgICAgIC8vIGVsZW1lbnRzIG1heSBiZSBtaWQtYW5pbWF0aW9uIHdoaWNoIHdpbGwgZ2l2ZSB1cyBhIHdyb25nIHJlc3VsdC5cbiAgICAgIGlmIChpc0hvcml6b250YWwpIHtcbiAgICAgICAgLy8gUm91bmQgdGhlIHRyYW5zZm9ybXMgc2luY2Ugc29tZSBicm93c2VycyB3aWxsXG4gICAgICAgIC8vIGJsdXIgdGhlIGVsZW1lbnRzLCBmb3Igc3ViLXBpeGVsIHRyYW5zZm9ybXMuXG4gICAgICAgIGVsZW1lbnRUb09mZnNldC5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlM2QoJHtNYXRoLnJvdW5kKHNpYmxpbmcub2Zmc2V0KX1weCwgMCwgMClgO1xuICAgICAgICBhZGp1c3RDbGllbnRSZWN0KHNpYmxpbmcuY2xpZW50UmVjdCwgMCwgb2Zmc2V0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsZW1lbnRUb09mZnNldC5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlM2QoMCwgJHtNYXRoLnJvdW5kKHNpYmxpbmcub2Zmc2V0KX1weCwgMClgO1xuICAgICAgICBhZGp1c3RDbGllbnRSZWN0KHNpYmxpbmcuY2xpZW50UmVjdCwgb2Zmc2V0LCAwKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIE5vdGUgdGhhdCBpdCdzIGltcG9ydGFudCB0aGF0IHdlIGRvIHRoaXMgYWZ0ZXIgdGhlIGNsaWVudCByZWN0cyBoYXZlIGJlZW4gYWRqdXN0ZWQuXG4gICAgdGhpcy5fcHJldmlvdXNTd2FwLm92ZXJsYXBzID0gaXNJbnNpZGVDbGllbnRSZWN0KG5ld1Bvc2l0aW9uLCBwb2ludGVyWCwgcG9pbnRlclkpO1xuICAgIHRoaXMuX3ByZXZpb3VzU3dhcC5kcmFnID0gc2libGluZ0F0TmV3UG9zaXRpb24uZHJhZztcbiAgICB0aGlzLl9wcmV2aW91c1N3YXAuZGVsdGEgPSBpc0hvcml6b250YWwgPyBwb2ludGVyRGVsdGEueCA6IHBvaW50ZXJEZWx0YS55O1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSB1c2VyJ3MgcG9pbnRlciBpcyBjbG9zZSB0byB0aGUgZWRnZXMgb2YgZWl0aGVyIHRoZVxuICAgKiB2aWV3cG9ydCBvciB0aGUgZHJvcCBsaXN0IGFuZCBzdGFydHMgdGhlIGF1dG8tc2Nyb2xsIHNlcXVlbmNlLlxuICAgKiBAcGFyYW0gcG9pbnRlclggVXNlcidzIHBvaW50ZXIgcG9zaXRpb24gYWxvbmcgdGhlIHggYXhpcy5cbiAgICogQHBhcmFtIHBvaW50ZXJZIFVzZXIncyBwb2ludGVyIHBvc2l0aW9uIGFsb25nIHRoZSB5IGF4aXMuXG4gICAqL1xuICBfc3RhcnRTY3JvbGxpbmdJZk5lY2Vzc2FyeShwb2ludGVyWDogbnVtYmVyLCBwb2ludGVyWTogbnVtYmVyKSB7XG4gICAgaWYgKHRoaXMuYXV0b1Njcm9sbERpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IHNjcm9sbE5vZGU6IEhUTUxFbGVtZW50IHwgV2luZG93IHwgdW5kZWZpbmVkO1xuICAgIGxldCB2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5OT05FO1xuICAgIGxldCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTk9ORTtcblxuICAgIC8vIENoZWNrIHdoZXRoZXIgd2Ugc2hvdWxkIHN0YXJ0IHNjcm9sbGluZyBhbnkgb2YgdGhlIHBhcmVudCBjb250YWluZXJzLlxuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5wb3NpdGlvbnMuZm9yRWFjaCgocG9zaXRpb24sIGVsZW1lbnQpID0+IHtcbiAgICAgIC8vIFdlIGhhdmUgc3BlY2lhbCBoYW5kbGluZyBmb3IgdGhlIGBkb2N1bWVudGAgYmVsb3cuIEFsc28gdGhpcyB3b3VsZCBiZVxuICAgICAgLy8gbmljZXIgd2l0aCBhICBmb3IuLi5vZiBsb29wLCBidXQgaXQgcmVxdWlyZXMgY2hhbmdpbmcgYSBjb21waWxlciBmbGFnLlxuICAgICAgaWYgKGVsZW1lbnQgPT09IHRoaXMuX2RvY3VtZW50IHx8ICFwb3NpdGlvbi5jbGllbnRSZWN0IHx8IHNjcm9sbE5vZGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNQb2ludGVyTmVhckNsaWVudFJlY3QocG9zaXRpb24uY2xpZW50UmVjdCwgRFJPUF9QUk9YSU1JVFlfVEhSRVNIT0xELFxuICAgICAgICAgIHBvaW50ZXJYLCBwb2ludGVyWSkpIHtcbiAgICAgICAgW3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uLCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uXSA9IGdldEVsZW1lbnRTY3JvbGxEaXJlY3Rpb25zKFxuICAgICAgICAgICAgZWxlbWVudCBhcyBIVE1MRWxlbWVudCwgcG9zaXRpb24uY2xpZW50UmVjdCwgcG9pbnRlclgsIHBvaW50ZXJZKTtcblxuICAgICAgICBpZiAodmVydGljYWxTY3JvbGxEaXJlY3Rpb24gfHwgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbikge1xuICAgICAgICAgIHNjcm9sbE5vZGUgPSBlbGVtZW50IGFzIEhUTUxFbGVtZW50O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBPdGhlcndpc2UgY2hlY2sgaWYgd2UgY2FuIHN0YXJ0IHNjcm9sbGluZyB0aGUgdmlld3BvcnQuXG4gICAgaWYgKCF2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiAmJiAhaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbikge1xuICAgICAgY29uc3Qge3dpZHRoLCBoZWlnaHR9ID0gdGhpcy5fdmlld3BvcnRSdWxlci5nZXRWaWV3cG9ydFNpemUoKTtcbiAgICAgIGNvbnN0IGNsaWVudFJlY3QgPSB7d2lkdGgsIGhlaWdodCwgdG9wOiAwLCByaWdodDogd2lkdGgsIGJvdHRvbTogaGVpZ2h0LCBsZWZ0OiAwfTtcbiAgICAgIHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gZ2V0VmVydGljYWxTY3JvbGxEaXJlY3Rpb24oY2xpZW50UmVjdCwgcG9pbnRlclkpO1xuICAgICAgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IGdldEhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24oY2xpZW50UmVjdCwgcG9pbnRlclgpO1xuICAgICAgc2Nyb2xsTm9kZSA9IHdpbmRvdztcbiAgICB9XG5cbiAgICBpZiAoc2Nyb2xsTm9kZSAmJiAodmVydGljYWxTY3JvbGxEaXJlY3Rpb24gIT09IHRoaXMuX3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uIHx8XG4gICAgICAgIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gIT09IHRoaXMuX2hvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gfHxcbiAgICAgICAgc2Nyb2xsTm9kZSAhPT0gdGhpcy5fc2Nyb2xsTm9kZSkpIHtcbiAgICAgIHRoaXMuX3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gdmVydGljYWxTY3JvbGxEaXJlY3Rpb247XG4gICAgICB0aGlzLl9ob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbjtcbiAgICAgIHRoaXMuX3Njcm9sbE5vZGUgPSBzY3JvbGxOb2RlO1xuXG4gICAgICBpZiAoKHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uIHx8IGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24pICYmIHNjcm9sbE5vZGUpIHtcbiAgICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKHRoaXMuX3N0YXJ0U2Nyb2xsSW50ZXJ2YWwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fc3RvcFNjcm9sbGluZygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBTdG9wcyBhbnkgY3VycmVudGx5LXJ1bm5pbmcgYXV0by1zY3JvbGwgc2VxdWVuY2VzLiAqL1xuICBfc3RvcFNjcm9sbGluZygpIHtcbiAgICB0aGlzLl9zdG9wU2Nyb2xsVGltZXJzLm5leHQoKTtcbiAgfVxuXG4gIC8qKiBDYWNoZXMgdGhlIHBvc2l0aW9ucyBvZiB0aGUgY29uZmlndXJlZCBzY3JvbGxhYmxlIHBhcmVudHMuICovXG4gIHByaXZhdGUgX2NhY2hlUGFyZW50UG9zaXRpb25zKCkge1xuICAgIGNvbnN0IGVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KHRoaXMuZWxlbWVudCk7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLmNhY2hlKHRoaXMuX3Njcm9sbGFibGVFbGVtZW50cyk7XG5cbiAgICAvLyBUaGUgbGlzdCBlbGVtZW50IGlzIGFsd2F5cyBpbiB0aGUgYHNjcm9sbGFibGVFbGVtZW50c2BcbiAgICAvLyBzbyB3ZSBjYW4gdGFrZSBhZHZhbnRhZ2Ugb2YgdGhlIGNhY2hlZCBgQ2xpZW50UmVjdGAuXG4gICAgdGhpcy5fY2xpZW50UmVjdCA9IHRoaXMuX3BhcmVudFBvc2l0aW9ucy5wb3NpdGlvbnMuZ2V0KGVsZW1lbnQpIS5jbGllbnRSZWN0ITtcbiAgfVxuXG4gIC8qKiBSZWZyZXNoZXMgdGhlIHBvc2l0aW9uIGNhY2hlIG9mIHRoZSBpdGVtcyBhbmQgc2libGluZyBjb250YWluZXJzLiAqL1xuICBwcml2YXRlIF9jYWNoZUl0ZW1Qb3NpdGlvbnMoKSB7XG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gdGhpcy5fb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJztcblxuICAgIHRoaXMuX2l0ZW1Qb3NpdGlvbnMgPSB0aGlzLl9hY3RpdmVEcmFnZ2FibGVzLm1hcChkcmFnID0+IHtcbiAgICAgIGNvbnN0IGVsZW1lbnRUb01lYXN1cmUgPSBkcmFnLmdldFZpc2libGVFbGVtZW50KCk7XG4gICAgICByZXR1cm4ge2RyYWcsIG9mZnNldDogMCwgY2xpZW50UmVjdDogZ2V0TXV0YWJsZUNsaWVudFJlY3QoZWxlbWVudFRvTWVhc3VyZSl9O1xuICAgIH0pLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgIHJldHVybiBpc0hvcml6b250YWwgPyBhLmNsaWVudFJlY3QubGVmdCAtIGIuY2xpZW50UmVjdC5sZWZ0IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhLmNsaWVudFJlY3QudG9wIC0gYi5jbGllbnRSZWN0LnRvcDtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBSZXNldHMgdGhlIGNvbnRhaW5lciB0byBpdHMgaW5pdGlhbCBzdGF0ZS4gKi9cbiAgcHJpdmF0ZSBfcmVzZXQoKSB7XG4gICAgdGhpcy5faXNEcmFnZ2luZyA9IGZhbHNlO1xuXG4gICAgY29uc3Qgc3R5bGVzID0gY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpLnN0eWxlIGFzIERyYWdDU1NTdHlsZURlY2xhcmF0aW9uO1xuICAgIHN0eWxlcy5zY3JvbGxTbmFwVHlwZSA9IHN0eWxlcy5tc1Njcm9sbFNuYXBUeXBlID0gdGhpcy5faW5pdGlhbFNjcm9sbFNuYXA7XG5cbiAgICAvLyBUT0RPKGNyaXNiZXRvKTogbWF5IGhhdmUgdG8gd2FpdCBmb3IgdGhlIGFuaW1hdGlvbnMgdG8gZmluaXNoLlxuICAgIHRoaXMuX2FjdGl2ZURyYWdnYWJsZXMuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgIGNvbnN0IHJvb3RFbGVtZW50ID0gaXRlbS5nZXRSb290RWxlbWVudCgpO1xuXG4gICAgICBpZiAocm9vdEVsZW1lbnQpIHtcbiAgICAgICAgcm9vdEVsZW1lbnQuc3R5bGUudHJhbnNmb3JtID0gJyc7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5fc2libGluZ3MuZm9yRWFjaChzaWJsaW5nID0+IHNpYmxpbmcuX3N0b3BSZWNlaXZpbmcodGhpcykpO1xuICAgIHRoaXMuX2FjdGl2ZURyYWdnYWJsZXMgPSBbXTtcbiAgICB0aGlzLl9pdGVtUG9zaXRpb25zID0gW107XG4gICAgdGhpcy5fcHJldmlvdXNTd2FwLmRyYWcgPSBudWxsO1xuICAgIHRoaXMuX3ByZXZpb3VzU3dhcC5kZWx0YSA9IDA7XG4gICAgdGhpcy5fcHJldmlvdXNTd2FwLm92ZXJsYXBzID0gZmFsc2U7XG4gICAgdGhpcy5fc3RvcFNjcm9sbGluZygpO1xuICAgIHRoaXMuX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLmNsZWFyKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgb2Zmc2V0IGluIHBpeGVscyBieSB3aGljaCB0aGUgaXRlbXMgdGhhdCBhcmVuJ3QgYmVpbmcgZHJhZ2dlZCBzaG91bGQgYmUgbW92ZWQuXG4gICAqIEBwYXJhbSBjdXJyZW50SW5kZXggSW5kZXggb2YgdGhlIGl0ZW0gY3VycmVudGx5IGJlaW5nIGRyYWdnZWQuXG4gICAqIEBwYXJhbSBzaWJsaW5ncyBBbGwgb2YgdGhlIGl0ZW1zIGluIHRoZSBsaXN0LlxuICAgKiBAcGFyYW0gZGVsdGEgRGlyZWN0aW9uIGluIHdoaWNoIHRoZSB1c2VyIGlzIG1vdmluZy5cbiAgICovXG4gIHByaXZhdGUgX2dldFNpYmxpbmdPZmZzZXRQeChjdXJyZW50SW5kZXg6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpYmxpbmdzOiBDYWNoZWRJdGVtUG9zaXRpb25bXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhOiAxIHwgLTEpIHtcblxuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCc7XG4gICAgY29uc3QgY3VycmVudFBvc2l0aW9uID0gc2libGluZ3NbY3VycmVudEluZGV4XS5jbGllbnRSZWN0O1xuICAgIGNvbnN0IGltbWVkaWF0ZVNpYmxpbmcgPSBzaWJsaW5nc1tjdXJyZW50SW5kZXggKyBkZWx0YSAqIC0xXTtcbiAgICBsZXQgc2libGluZ09mZnNldCA9IGN1cnJlbnRQb3NpdGlvbltpc0hvcml6b250YWwgPyAnd2lkdGgnIDogJ2hlaWdodCddICogZGVsdGE7XG5cbiAgICBpZiAoaW1tZWRpYXRlU2libGluZykge1xuICAgICAgY29uc3Qgc3RhcnQgPSBpc0hvcml6b250YWwgPyAnbGVmdCcgOiAndG9wJztcbiAgICAgIGNvbnN0IGVuZCA9IGlzSG9yaXpvbnRhbCA/ICdyaWdodCcgOiAnYm90dG9tJztcblxuICAgICAgLy8gR2V0IHRoZSBzcGFjaW5nIGJldHdlZW4gdGhlIHN0YXJ0IG9mIHRoZSBjdXJyZW50IGl0ZW0gYW5kIHRoZSBlbmQgb2YgdGhlIG9uZSBpbW1lZGlhdGVseVxuICAgICAgLy8gYWZ0ZXIgaXQgaW4gdGhlIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgdXNlciBpcyBkcmFnZ2luZywgb3IgdmljZSB2ZXJzYS4gV2UgYWRkIGl0IHRvIHRoZVxuICAgICAgLy8gb2Zmc2V0IGluIG9yZGVyIHRvIHB1c2ggdGhlIGVsZW1lbnQgdG8gd2hlcmUgaXQgd2lsbCBiZSB3aGVuIGl0J3MgaW5saW5lIGFuZCBpcyBpbmZsdWVuY2VkXG4gICAgICAvLyBieSB0aGUgYG1hcmdpbmAgb2YgaXRzIHNpYmxpbmdzLlxuICAgICAgaWYgKGRlbHRhID09PSAtMSkge1xuICAgICAgICBzaWJsaW5nT2Zmc2V0IC09IGltbWVkaWF0ZVNpYmxpbmcuY2xpZW50UmVjdFtzdGFydF0gLSBjdXJyZW50UG9zaXRpb25bZW5kXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNpYmxpbmdPZmZzZXQgKz0gY3VycmVudFBvc2l0aW9uW3N0YXJ0XSAtIGltbWVkaWF0ZVNpYmxpbmcuY2xpZW50UmVjdFtlbmRdO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzaWJsaW5nT2Zmc2V0O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG9mZnNldCBpbiBwaXhlbHMgYnkgd2hpY2ggdGhlIGl0ZW0gdGhhdCBpcyBiZWluZyBkcmFnZ2VkIHNob3VsZCBiZSBtb3ZlZC5cbiAgICogQHBhcmFtIGN1cnJlbnRQb3NpdGlvbiBDdXJyZW50IHBvc2l0aW9uIG9mIHRoZSBpdGVtLlxuICAgKiBAcGFyYW0gbmV3UG9zaXRpb24gUG9zaXRpb24gb2YgdGhlIGl0ZW0gd2hlcmUgdGhlIGN1cnJlbnQgaXRlbSBzaG91bGQgYmUgbW92ZWQuXG4gICAqIEBwYXJhbSBkZWx0YSBEaXJlY3Rpb24gaW4gd2hpY2ggdGhlIHVzZXIgaXMgbW92aW5nLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0SXRlbU9mZnNldFB4KGN1cnJlbnRQb3NpdGlvbjogQ2xpZW50UmVjdCwgbmV3UG9zaXRpb246IENsaWVudFJlY3QsIGRlbHRhOiAxIHwgLTEpIHtcbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuICAgIGxldCBpdGVtT2Zmc2V0ID0gaXNIb3Jpem9udGFsID8gbmV3UG9zaXRpb24ubGVmdCAtIGN1cnJlbnRQb3NpdGlvbi5sZWZ0IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1Bvc2l0aW9uLnRvcCAtIGN1cnJlbnRQb3NpdGlvbi50b3A7XG5cbiAgICAvLyBBY2NvdW50IGZvciBkaWZmZXJlbmNlcyBpbiB0aGUgaXRlbSB3aWR0aC9oZWlnaHQuXG4gICAgaWYgKGRlbHRhID09PSAtMSkge1xuICAgICAgaXRlbU9mZnNldCArPSBpc0hvcml6b250YWwgPyBuZXdQb3NpdGlvbi53aWR0aCAtIGN1cnJlbnRQb3NpdGlvbi53aWR0aCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1Bvc2l0aW9uLmhlaWdodCAtIGN1cnJlbnRQb3NpdGlvbi5oZWlnaHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIGl0ZW1PZmZzZXQ7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHBvaW50ZXIgaXMgZW50ZXJpbmcgaW4gdGhlIGZpcnN0IHBvc2l0aW9uXG4gICAqIEBwYXJhbSBwb2ludGVyWCBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHBvaW50ZXJZIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgWSBheGlzLlxuICAgKi9cbiAgcHJpdmF0ZSBfc2hvdWxkRW50ZXJBc0ZpcnN0Q2hpbGQocG9pbnRlclg6IG51bWJlciwgcG9pbnRlclk6IG51bWJlcikge1xuICAgIGlmICghdGhpcy5fYWN0aXZlRHJhZ2dhYmxlcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBpdGVtUG9zaXRpb25zID0gdGhpcy5faXRlbVBvc2l0aW9ucztcbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuXG4gICAgLy8gYGl0ZW1Qb3NpdGlvbnNgIGFyZSBzb3J0ZWQgYnkgcG9zaXRpb24gd2hpbGUgYGFjdGl2ZURyYWdnYWJsZXNgIGFyZSBzb3J0ZWQgYnkgY2hpbGQgaW5kZXhcbiAgICAvLyBjaGVjayBpZiBjb250YWluZXIgaXMgdXNpbmcgc29tZSBzb3J0IG9mIFwicmV2ZXJzZVwiIG9yZGVyaW5nIChlZzogZmxleC1kaXJlY3Rpb246IHJvdy1yZXZlcnNlKVxuICAgIGNvbnN0IHJldmVyc2VkID0gaXRlbVBvc2l0aW9uc1swXS5kcmFnICE9PSB0aGlzLl9hY3RpdmVEcmFnZ2FibGVzWzBdO1xuICAgIGlmIChyZXZlcnNlZCkge1xuICAgICAgY29uc3QgbGFzdEl0ZW1SZWN0ID0gaXRlbVBvc2l0aW9uc1tpdGVtUG9zaXRpb25zLmxlbmd0aCAtIDFdLmNsaWVudFJlY3Q7XG4gICAgICByZXR1cm4gaXNIb3Jpem9udGFsID8gcG9pbnRlclggPj0gbGFzdEl0ZW1SZWN0LnJpZ2h0IDogcG9pbnRlclkgPj0gbGFzdEl0ZW1SZWN0LmJvdHRvbTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZmlyc3RJdGVtUmVjdCA9IGl0ZW1Qb3NpdGlvbnNbMF0uY2xpZW50UmVjdDtcbiAgICAgIHJldHVybiBpc0hvcml6b250YWwgPyBwb2ludGVyWCA8PSBmaXJzdEl0ZW1SZWN0LmxlZnQgOiBwb2ludGVyWSA8PSBmaXJzdEl0ZW1SZWN0LnRvcDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW5kZXggb2YgYW4gaXRlbSBpbiB0aGUgZHJvcCBjb250YWluZXIsIGJhc2VkIG9uIHRoZSBwb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdGhhdCBpcyBiZWluZyBzb3J0ZWQuXG4gICAqIEBwYXJhbSBwb2ludGVyWCBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHBvaW50ZXJZIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgWSBheGlzLlxuICAgKiBAcGFyYW0gZGVsdGEgRGlyZWN0aW9uIGluIHdoaWNoIHRoZSB1c2VyIGlzIG1vdmluZyB0aGVpciBwb2ludGVyLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0SXRlbUluZGV4RnJvbVBvaW50ZXJQb3NpdGlvbihpdGVtOiBEcmFnUmVmLCBwb2ludGVyWDogbnVtYmVyLCBwb2ludGVyWTogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhPzoge3g6IG51bWJlciwgeTogbnVtYmVyfSk6IG51bWJlciB7XG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gdGhpcy5fb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJztcbiAgICBjb25zdCBpbmRleCA9IGZpbmRJbmRleCh0aGlzLl9pdGVtUG9zaXRpb25zLCAoe2RyYWcsIGNsaWVudFJlY3R9LCBfLCBhcnJheSkgPT4ge1xuICAgICAgaWYgKGRyYWcgPT09IGl0ZW0pIHtcbiAgICAgICAgLy8gSWYgdGhlcmUncyBvbmx5IG9uZSBpdGVtIGxlZnQgaW4gdGhlIGNvbnRhaW5lciwgaXQgbXVzdCBiZVxuICAgICAgICAvLyB0aGUgZHJhZ2dlZCBpdGVtIGl0c2VsZiBzbyB3ZSB1c2UgaXQgYXMgYSByZWZlcmVuY2UuXG4gICAgICAgIHJldHVybiBhcnJheS5sZW5ndGggPCAyO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGVsdGEpIHtcbiAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gaXNIb3Jpem9udGFsID8gZGVsdGEueCA6IGRlbHRhLnk7XG5cbiAgICAgICAgLy8gSWYgdGhlIHVzZXIgaXMgc3RpbGwgaG92ZXJpbmcgb3ZlciB0aGUgc2FtZSBpdGVtIGFzIGxhc3QgdGltZSwgdGhlaXIgY3Vyc29yIGhhc24ndCBsZWZ0XG4gICAgICAgIC8vIHRoZSBpdGVtIGFmdGVyIHdlIG1hZGUgdGhlIHN3YXAsIGFuZCB0aGV5IGRpZG4ndCBjaGFuZ2UgdGhlIGRpcmVjdGlvbiBpbiB3aGljaCB0aGV5J3JlXG4gICAgICAgIC8vIGRyYWdnaW5nLCB3ZSBkb24ndCBjb25zaWRlciBpdCBhIGRpcmVjdGlvbiBzd2FwLlxuICAgICAgICBpZiAoZHJhZyA9PT0gdGhpcy5fcHJldmlvdXNTd2FwLmRyYWcgJiYgdGhpcy5fcHJldmlvdXNTd2FwLm92ZXJsYXBzICYmXG4gICAgICAgICAgICBkaXJlY3Rpb24gPT09IHRoaXMuX3ByZXZpb3VzU3dhcC5kZWx0YSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gaXNIb3Jpem9udGFsID9cbiAgICAgICAgICAvLyBSb3VuZCB0aGVzZSBkb3duIHNpbmNlIG1vc3QgYnJvd3NlcnMgcmVwb3J0IGNsaWVudCByZWN0cyB3aXRoXG4gICAgICAgICAgLy8gc3ViLXBpeGVsIHByZWNpc2lvbiwgd2hlcmVhcyB0aGUgcG9pbnRlciBjb29yZGluYXRlcyBhcmUgcm91bmRlZCB0byBwaXhlbHMuXG4gICAgICAgICAgcG9pbnRlclggPj0gTWF0aC5mbG9vcihjbGllbnRSZWN0LmxlZnQpICYmIHBvaW50ZXJYIDwgTWF0aC5mbG9vcihjbGllbnRSZWN0LnJpZ2h0KSA6XG4gICAgICAgICAgcG9pbnRlclkgPj0gTWF0aC5mbG9vcihjbGllbnRSZWN0LnRvcCkgJiYgcG9pbnRlclkgPCBNYXRoLmZsb29yKGNsaWVudFJlY3QuYm90dG9tKTtcbiAgICB9KTtcblxuICAgIHJldHVybiAoaW5kZXggPT09IC0xIHx8ICF0aGlzLnNvcnRQcmVkaWNhdGUoaW5kZXgsIGl0ZW0sIHRoaXMpKSA/IC0xIDogaW5kZXg7XG4gIH1cblxuICAvKiogQ2FjaGVzIHRoZSBjdXJyZW50IGl0ZW1zIGluIHRoZSBsaXN0IGFuZCB0aGVpciBwb3NpdGlvbnMuICovXG4gIHByaXZhdGUgX2NhY2hlSXRlbXMoKTogdm9pZCB7XG4gICAgdGhpcy5fYWN0aXZlRHJhZ2dhYmxlcyA9IHRoaXMuX2RyYWdnYWJsZXMuc2xpY2UoKTtcbiAgICB0aGlzLl9jYWNoZUl0ZW1Qb3NpdGlvbnMoKTtcbiAgICB0aGlzLl9jYWNoZVBhcmVudFBvc2l0aW9ucygpO1xuICB9XG5cbiAgLyoqIFN0YXJ0cyB0aGUgaW50ZXJ2YWwgdGhhdCdsbCBhdXRvLXNjcm9sbCB0aGUgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfc3RhcnRTY3JvbGxJbnRlcnZhbCA9ICgpID0+IHtcbiAgICB0aGlzLl9zdG9wU2Nyb2xsaW5nKCk7XG5cbiAgICBpbnRlcnZhbCgwLCBhbmltYXRpb25GcmFtZVNjaGVkdWxlcilcbiAgICAgIC5waXBlKHRha2VVbnRpbCh0aGlzLl9zdG9wU2Nyb2xsVGltZXJzKSlcbiAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICBjb25zdCBub2RlID0gdGhpcy5fc2Nyb2xsTm9kZTtcblxuICAgICAgICBpZiAodGhpcy5fdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPT09IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5VUCkge1xuICAgICAgICAgIGluY3JlbWVudFZlcnRpY2FsU2Nyb2xsKG5vZGUsIC1BVVRPX1NDUk9MTF9TVEVQKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl92ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9PT0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLkRPV04pIHtcbiAgICAgICAgICBpbmNyZW1lbnRWZXJ0aWNhbFNjcm9sbChub2RlLCBBVVRPX1NDUk9MTF9TVEVQKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9ob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID09PSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5MRUZUKSB7XG4gICAgICAgICAgaW5jcmVtZW50SG9yaXpvbnRhbFNjcm9sbChub2RlLCAtQVVUT19TQ1JPTExfU1RFUCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5faG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9PT0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uUklHSFQpIHtcbiAgICAgICAgICBpbmNyZW1lbnRIb3Jpem9udGFsU2Nyb2xsKG5vZGUsIEFVVE9fU0NST0xMX1NURVApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgdXNlcidzIHBvaW50ZXIgaXMgcG9zaXRpb25lZCBvdmVyIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSB4IFBvaW50ZXIgcG9zaXRpb24gYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHkgUG9pbnRlciBwb3NpdGlvbiBhbG9uZyB0aGUgWSBheGlzLlxuICAgKi9cbiAgX2lzT3ZlckNvbnRhaW5lcih4OiBudW1iZXIsIHk6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIHJldHVybiBpc0luc2lkZUNsaWVudFJlY3QodGhpcy5fY2xpZW50UmVjdCwgeCwgeSk7XG4gIH1cblxuICAvKipcbiAgICogRmlndXJlcyBvdXQgd2hldGhlciBhbiBpdGVtIHNob3VsZCBiZSBtb3ZlZCBpbnRvIGEgc2libGluZ1xuICAgKiBkcm9wIGNvbnRhaW5lciwgYmFzZWQgb24gaXRzIGN1cnJlbnQgcG9zaXRpb24uXG4gICAqIEBwYXJhbSBpdGVtIERyYWcgaXRlbSB0aGF0IGlzIGJlaW5nIG1vdmVkLlxuICAgKiBAcGFyYW0geCBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0geSBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKi9cbiAgX2dldFNpYmxpbmdDb250YWluZXJGcm9tUG9zaXRpb24oaXRlbTogRHJhZ1JlZiwgeDogbnVtYmVyLCB5OiBudW1iZXIpOiBEcm9wTGlzdFJlZiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX3NpYmxpbmdzLmZpbmQoc2libGluZyA9PiBzaWJsaW5nLl9jYW5SZWNlaXZlKGl0ZW0sIHgsIHkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgZHJvcCBsaXN0IGNhbiByZWNlaXZlIHRoZSBwYXNzZWQtaW4gaXRlbS5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB0aGF0IGlzIGJlaW5nIGRyYWdnZWQgaW50byB0aGUgbGlzdC5cbiAgICogQHBhcmFtIHggUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHkgUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFkgYXhpcy5cbiAgICovXG4gIF9jYW5SZWNlaXZlKGl0ZW06IERyYWdSZWYsIHg6IG51bWJlciwgeTogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgaWYgKCFpc0luc2lkZUNsaWVudFJlY3QodGhpcy5fY2xpZW50UmVjdCwgeCwgeSkgfHwgIXRoaXMuZW50ZXJQcmVkaWNhdGUoaXRlbSwgdGhpcykpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBlbGVtZW50RnJvbVBvaW50ID0gdGhpcy5fZ2V0U2hhZG93Um9vdCgpLmVsZW1lbnRGcm9tUG9pbnQoeCwgeSkgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuXG4gICAgLy8gSWYgdGhlcmUncyBubyBlbGVtZW50IGF0IHRoZSBwb2ludGVyIHBvc2l0aW9uLCB0aGVuXG4gICAgLy8gdGhlIGNsaWVudCByZWN0IGlzIHByb2JhYmx5IHNjcm9sbGVkIG91dCBvZiB0aGUgdmlldy5cbiAgICBpZiAoIWVsZW1lbnRGcm9tUG9pbnQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpO1xuXG4gICAgLy8gVGhlIGBDbGllbnRSZWN0YCwgdGhhdCB3ZSdyZSB1c2luZyB0byBmaW5kIHRoZSBjb250YWluZXIgb3ZlciB3aGljaCB0aGUgdXNlciBpc1xuICAgIC8vIGhvdmVyaW5nLCBkb2Vzbid0IGdpdmUgdXMgYW55IGluZm9ybWF0aW9uIG9uIHdoZXRoZXIgdGhlIGVsZW1lbnQgaGFzIGJlZW4gc2Nyb2xsZWRcbiAgICAvLyBvdXQgb2YgdGhlIHZpZXcgb3Igd2hldGhlciBpdCdzIG92ZXJsYXBwaW5nIHdpdGggb3RoZXIgY29udGFpbmVycy4gVGhpcyBtZWFucyB0aGF0XG4gICAgLy8gd2UgY291bGQgZW5kIHVwIHRyYW5zZmVycmluZyB0aGUgaXRlbSBpbnRvIGEgY29udGFpbmVyIHRoYXQncyBpbnZpc2libGUgb3IgaXMgcG9zaXRpb25lZFxuICAgIC8vIGJlbG93IGFub3RoZXIgb25lLiBXZSB1c2UgdGhlIHJlc3VsdCBmcm9tIGBlbGVtZW50RnJvbVBvaW50YCB0byBnZXQgdGhlIHRvcC1tb3N0IGVsZW1lbnRcbiAgICAvLyBhdCB0aGUgcG9pbnRlciBwb3NpdGlvbiBhbmQgdG8gZmluZCB3aGV0aGVyIGl0J3Mgb25lIG9mIHRoZSBpbnRlcnNlY3RpbmcgZHJvcCBjb250YWluZXJzLlxuICAgIHJldHVybiBlbGVtZW50RnJvbVBvaW50ID09PSBuYXRpdmVFbGVtZW50IHx8IG5hdGl2ZUVsZW1lbnQuY29udGFpbnMoZWxlbWVudEZyb21Qb2ludCk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIGJ5IG9uZSBvZiB0aGUgY29ubmVjdGVkIGRyb3AgbGlzdHMgd2hlbiBhIGRyYWdnaW5nIHNlcXVlbmNlIGhhcyBzdGFydGVkLlxuICAgKiBAcGFyYW0gc2libGluZyBTaWJsaW5nIGluIHdoaWNoIGRyYWdnaW5nIGhhcyBzdGFydGVkLlxuICAgKi9cbiAgX3N0YXJ0UmVjZWl2aW5nKHNpYmxpbmc6IERyb3BMaXN0UmVmKSB7XG4gICAgY29uc3QgYWN0aXZlU2libGluZ3MgPSB0aGlzLl9hY3RpdmVTaWJsaW5ncztcblxuICAgIGlmICghYWN0aXZlU2libGluZ3MuaGFzKHNpYmxpbmcpKSB7XG4gICAgICBhY3RpdmVTaWJsaW5ncy5hZGQoc2libGluZyk7XG4gICAgICB0aGlzLl9jYWNoZVBhcmVudFBvc2l0aW9ucygpO1xuICAgICAgdGhpcy5fbGlzdGVuVG9TY3JvbGxFdmVudHMoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIGJ5IGEgY29ubmVjdGVkIGRyb3AgbGlzdCB3aGVuIGRyYWdnaW5nIGhhcyBzdG9wcGVkLlxuICAgKiBAcGFyYW0gc2libGluZyBTaWJsaW5nIHdob3NlIGRyYWdnaW5nIGhhcyBzdG9wcGVkLlxuICAgKi9cbiAgX3N0b3BSZWNlaXZpbmcoc2libGluZzogRHJvcExpc3RSZWYpIHtcbiAgICB0aGlzLl9hY3RpdmVTaWJsaW5ncy5kZWxldGUoc2libGluZyk7XG4gICAgdGhpcy5fdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydHMgbGlzdGVuaW5nIHRvIHNjcm9sbCBldmVudHMgb24gdGhlIHZpZXdwb3J0LlxuICAgKiBVc2VkIGZvciB1cGRhdGluZyB0aGUgaW50ZXJuYWwgc3RhdGUgb2YgdGhlIGxpc3QuXG4gICAqL1xuICBwcml2YXRlIF9saXN0ZW5Ub1Njcm9sbEV2ZW50cygpIHtcbiAgICB0aGlzLl92aWV3cG9ydFNjcm9sbFN1YnNjcmlwdGlvbiA9IHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuc2Nyb2xsLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICBpZiAodGhpcy5pc0RyYWdnaW5nKCkpIHtcbiAgICAgICAgY29uc3Qgc2Nyb2xsRGlmZmVyZW5jZSA9IHRoaXMuX3BhcmVudFBvc2l0aW9ucy5oYW5kbGVTY3JvbGwoZXZlbnQpO1xuXG4gICAgICAgIGlmIChzY3JvbGxEaWZmZXJlbmNlKSB7XG4gICAgICAgICAgLy8gU2luY2Ugd2Uga25vdyB0aGUgYW1vdW50IHRoYXQgdGhlIHVzZXIgaGFzIHNjcm9sbGVkIHdlIGNhbiBzaGlmdCBhbGwgb2YgdGhlXG4gICAgICAgICAgLy8gY2xpZW50IHJlY3RhbmdsZXMgb3Vyc2VsdmVzLiBUaGlzIGlzIGNoZWFwZXIgdGhhbiByZS1tZWFzdXJpbmcgZXZlcnl0aGluZyBhbmRcbiAgICAgICAgICAvLyB3ZSBjYW4gYXZvaWQgaW5jb25zaXN0ZW50IGJlaGF2aW9yIHdoZXJlIHdlIG1pZ2h0IGJlIG1lYXN1cmluZyB0aGUgZWxlbWVudCBiZWZvcmVcbiAgICAgICAgICAvLyBpdHMgcG9zaXRpb24gaGFzIGNoYW5nZWQuXG4gICAgICAgICAgdGhpcy5faXRlbVBvc2l0aW9ucy5mb3JFYWNoKCh7Y2xpZW50UmVjdH0pID0+IHtcbiAgICAgICAgICAgIGFkanVzdENsaWVudFJlY3QoY2xpZW50UmVjdCwgc2Nyb2xsRGlmZmVyZW5jZS50b3AsIHNjcm9sbERpZmZlcmVuY2UubGVmdCk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICAvLyBXZSBuZWVkIHR3byBsb29wcyBmb3IgdGhpcywgYmVjYXVzZSB3ZSB3YW50IGFsbCBvZiB0aGUgY2FjaGVkXG4gICAgICAgICAgLy8gcG9zaXRpb25zIHRvIGJlIHVwLXRvLWRhdGUgYmVmb3JlIHdlIHJlLXNvcnQgdGhlIGl0ZW0uXG4gICAgICAgICAgdGhpcy5faXRlbVBvc2l0aW9ucy5mb3JFYWNoKCh7ZHJhZ30pID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LmlzRHJhZ2dpbmcoZHJhZykpIHtcbiAgICAgICAgICAgICAgLy8gV2UgbmVlZCB0byByZS1zb3J0IHRoZSBpdGVtIG1hbnVhbGx5LCBiZWNhdXNlIHRoZSBwb2ludGVyIG1vdmVcbiAgICAgICAgICAgICAgLy8gZXZlbnRzIHdvbid0IGJlIGRpc3BhdGNoZWQgd2hpbGUgdGhlIHVzZXIgaXMgc2Nyb2xsaW5nLlxuICAgICAgICAgICAgICBkcmFnLl9zb3J0RnJvbUxhc3RQb2ludGVyUG9zaXRpb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0aGlzLmlzUmVjZWl2aW5nKCkpIHtcbiAgICAgICAgdGhpcy5fY2FjaGVQYXJlbnRQb3NpdGlvbnMoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMYXppbHkgcmVzb2x2ZXMgYW5kIHJldHVybnMgdGhlIHNoYWRvdyByb290IG9mIHRoZSBlbGVtZW50LiBXZSBkbyB0aGlzIGluIGEgZnVuY3Rpb24sIHJhdGhlclxuICAgKiB0aGFuIHNhdmluZyBpdCBpbiBwcm9wZXJ0eSBkaXJlY3RseSBvbiBpbml0LCBiZWNhdXNlIHdlIHdhbnQgdG8gcmVzb2x2ZSBpdCBhcyBsYXRlIGFzIHBvc3NpYmxlXG4gICAqIGluIG9yZGVyIHRvIGVuc3VyZSB0aGF0IHRoZSBlbGVtZW50IGhhcyBiZWVuIG1vdmVkIGludG8gdGhlIHNoYWRvdyBET00uIERvaW5nIGl0IGluc2lkZSB0aGVcbiAgICogY29uc3RydWN0b3IgbWlnaHQgYmUgdG9vIGVhcmx5IGlmIHRoZSBlbGVtZW50IGlzIGluc2lkZSBvZiBzb21ldGhpbmcgbGlrZSBgbmdGb3JgIG9yIGBuZ0lmYC5cbiAgICovXG4gIHByaXZhdGUgX2dldFNoYWRvd1Jvb3QoKTogRG9jdW1lbnRPclNoYWRvd1Jvb3Qge1xuICAgIGlmICghdGhpcy5fY2FjaGVkU2hhZG93Um9vdCkge1xuICAgICAgY29uc3Qgc2hhZG93Um9vdCA9IF9nZXRTaGFkb3dSb290KGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KSkgYXMgU2hhZG93Um9vdCB8IG51bGw7XG4gICAgICB0aGlzLl9jYWNoZWRTaGFkb3dSb290ID0gc2hhZG93Um9vdCB8fCB0aGlzLl9kb2N1bWVudDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fY2FjaGVkU2hhZG93Um9vdDtcbiAgfVxufVxuXG5cbi8qKlxuICogRmluZHMgdGhlIGluZGV4IG9mIGFuIGl0ZW0gdGhhdCBtYXRjaGVzIGEgcHJlZGljYXRlIGZ1bmN0aW9uLiBVc2VkIGFzIGFuIGVxdWl2YWxlbnRcbiAqIG9mIGBBcnJheS5wcm90b3R5cGUuZmluZEluZGV4YCB3aGljaCBpc24ndCBwYXJ0IG9mIHRoZSBzdGFuZGFyZCBHb29nbGUgdHlwaW5ncy5cbiAqIEBwYXJhbSBhcnJheSBBcnJheSBpbiB3aGljaCB0byBsb29rIGZvciBtYXRjaGVzLlxuICogQHBhcmFtIHByZWRpY2F0ZSBGdW5jdGlvbiB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIGFuIGl0ZW0gaXMgYSBtYXRjaC5cbiAqL1xuZnVuY3Rpb24gZmluZEluZGV4PFQ+KGFycmF5OiBUW10sXG4gICAgICAgICAgICAgICAgICAgICAgcHJlZGljYXRlOiAodmFsdWU6IFQsIGluZGV4OiBudW1iZXIsIG9iajogVFtdKSA9PiBib29sZWFuKTogbnVtYmVyIHtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHByZWRpY2F0ZShhcnJheVtpXSwgaSwgYXJyYXkpKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gLTE7XG59XG5cbi8qKlxuICogSW5jcmVtZW50cyB0aGUgdmVydGljYWwgc2Nyb2xsIHBvc2l0aW9uIG9mIGEgbm9kZS5cbiAqIEBwYXJhbSBub2RlIE5vZGUgd2hvc2Ugc2Nyb2xsIHBvc2l0aW9uIHNob3VsZCBjaGFuZ2UuXG4gKiBAcGFyYW0gYW1vdW50IEFtb3VudCBvZiBwaXhlbHMgdGhhdCB0aGUgYG5vZGVgIHNob3VsZCBiZSBzY3JvbGxlZC5cbiAqL1xuZnVuY3Rpb24gaW5jcmVtZW50VmVydGljYWxTY3JvbGwobm9kZTogSFRNTEVsZW1lbnQgfCBXaW5kb3csIGFtb3VudDogbnVtYmVyKSB7XG4gIGlmIChub2RlID09PSB3aW5kb3cpIHtcbiAgICAobm9kZSBhcyBXaW5kb3cpLnNjcm9sbEJ5KDAsIGFtb3VudCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gSWRlYWxseSB3ZSBjb3VsZCB1c2UgYEVsZW1lbnQuc2Nyb2xsQnlgIGhlcmUgYXMgd2VsbCwgYnV0IElFIGFuZCBFZGdlIGRvbid0IHN1cHBvcnQgaXQuXG4gICAgKG5vZGUgYXMgSFRNTEVsZW1lbnQpLnNjcm9sbFRvcCArPSBhbW91bnQ7XG4gIH1cbn1cblxuLyoqXG4gKiBJbmNyZW1lbnRzIHRoZSBob3Jpem9udGFsIHNjcm9sbCBwb3NpdGlvbiBvZiBhIG5vZGUuXG4gKiBAcGFyYW0gbm9kZSBOb2RlIHdob3NlIHNjcm9sbCBwb3NpdGlvbiBzaG91bGQgY2hhbmdlLlxuICogQHBhcmFtIGFtb3VudCBBbW91bnQgb2YgcGl4ZWxzIHRoYXQgdGhlIGBub2RlYCBzaG91bGQgYmUgc2Nyb2xsZWQuXG4gKi9cbmZ1bmN0aW9uIGluY3JlbWVudEhvcml6b250YWxTY3JvbGwobm9kZTogSFRNTEVsZW1lbnQgfCBXaW5kb3csIGFtb3VudDogbnVtYmVyKSB7XG4gIGlmIChub2RlID09PSB3aW5kb3cpIHtcbiAgICAobm9kZSBhcyBXaW5kb3cpLnNjcm9sbEJ5KGFtb3VudCwgMCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gSWRlYWxseSB3ZSBjb3VsZCB1c2UgYEVsZW1lbnQuc2Nyb2xsQnlgIGhlcmUgYXMgd2VsbCwgYnV0IElFIGFuZCBFZGdlIGRvbid0IHN1cHBvcnQgaXQuXG4gICAgKG5vZGUgYXMgSFRNTEVsZW1lbnQpLnNjcm9sbExlZnQgKz0gYW1vdW50O1xuICB9XG59XG5cbi8qKlxuICogR2V0cyB3aGV0aGVyIHRoZSB2ZXJ0aWNhbCBhdXRvLXNjcm9sbCBkaXJlY3Rpb24gb2YgYSBub2RlLlxuICogQHBhcmFtIGNsaWVudFJlY3QgRGltZW5zaW9ucyBvZiB0aGUgbm9kZS5cbiAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIHkgYXhpcy5cbiAqL1xuZnVuY3Rpb24gZ2V0VmVydGljYWxTY3JvbGxEaXJlY3Rpb24oY2xpZW50UmVjdDogQ2xpZW50UmVjdCwgcG9pbnRlclk6IG51bWJlcikge1xuICBjb25zdCB7dG9wLCBib3R0b20sIGhlaWdodH0gPSBjbGllbnRSZWN0O1xuICBjb25zdCB5VGhyZXNob2xkID0gaGVpZ2h0ICogU0NST0xMX1BST1hJTUlUWV9USFJFU0hPTEQ7XG5cbiAgaWYgKHBvaW50ZXJZID49IHRvcCAtIHlUaHJlc2hvbGQgJiYgcG9pbnRlclkgPD0gdG9wICsgeVRocmVzaG9sZCkge1xuICAgIHJldHVybiBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uVVA7XG4gIH0gZWxzZSBpZiAocG9pbnRlclkgPj0gYm90dG9tIC0geVRocmVzaG9sZCAmJiBwb2ludGVyWSA8PSBib3R0b20gKyB5VGhyZXNob2xkKSB7XG4gICAgcmV0dXJuIEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5ET1dOO1xuICB9XG5cbiAgcmV0dXJuIEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5OT05FO1xufVxuXG4vKipcbiAqIEdldHMgd2hldGhlciB0aGUgaG9yaXpvbnRhbCBhdXRvLXNjcm9sbCBkaXJlY3Rpb24gb2YgYSBub2RlLlxuICogQHBhcmFtIGNsaWVudFJlY3QgRGltZW5zaW9ucyBvZiB0aGUgbm9kZS5cbiAqIEBwYXJhbSBwb2ludGVyWCBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIHggYXhpcy5cbiAqL1xuZnVuY3Rpb24gZ2V0SG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0OiBDbGllbnRSZWN0LCBwb2ludGVyWDogbnVtYmVyKSB7XG4gIGNvbnN0IHtsZWZ0LCByaWdodCwgd2lkdGh9ID0gY2xpZW50UmVjdDtcbiAgY29uc3QgeFRocmVzaG9sZCA9IHdpZHRoICogU0NST0xMX1BST1hJTUlUWV9USFJFU0hPTEQ7XG5cbiAgaWYgKHBvaW50ZXJYID49IGxlZnQgLSB4VGhyZXNob2xkICYmIHBvaW50ZXJYIDw9IGxlZnQgKyB4VGhyZXNob2xkKSB7XG4gICAgcmV0dXJuIEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLkxFRlQ7XG4gIH0gZWxzZSBpZiAocG9pbnRlclggPj0gcmlnaHQgLSB4VGhyZXNob2xkICYmIHBvaW50ZXJYIDw9IHJpZ2h0ICsgeFRocmVzaG9sZCkge1xuICAgIHJldHVybiBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5SSUdIVDtcbiAgfVxuXG4gIHJldHVybiBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5OT05FO1xufVxuXG4vKipcbiAqIEdldHMgdGhlIGRpcmVjdGlvbnMgaW4gd2hpY2ggYW4gZWxlbWVudCBub2RlIHNob3VsZCBiZSBzY3JvbGxlZCxcbiAqIGFzc3VtaW5nIHRoYXQgdGhlIHVzZXIncyBwb2ludGVyIGlzIGFscmVhZHkgd2l0aGluIGl0IHNjcm9sbGFibGUgcmVnaW9uLlxuICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCBmb3Igd2hpY2ggd2Ugc2hvdWxkIGNhbGN1bGF0ZSB0aGUgc2Nyb2xsIGRpcmVjdGlvbi5cbiAqIEBwYXJhbSBjbGllbnRSZWN0IEJvdW5kaW5nIGNsaWVudCByZWN0YW5nbGUgb2YgdGhlIGVsZW1lbnQuXG4gKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSB4IGF4aXMuXG4gKiBAcGFyYW0gcG9pbnRlclkgUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSB5IGF4aXMuXG4gKi9cbmZ1bmN0aW9uIGdldEVsZW1lbnRTY3JvbGxEaXJlY3Rpb25zKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBjbGllbnRSZWN0OiBDbGllbnRSZWN0LCBwb2ludGVyWDogbnVtYmVyLFxuICBwb2ludGVyWTogbnVtYmVyKTogW0F1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbiwgQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb25dIHtcbiAgY29uc3QgY29tcHV0ZWRWZXJ0aWNhbCA9IGdldFZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uKGNsaWVudFJlY3QsIHBvaW50ZXJZKTtcbiAgY29uc3QgY29tcHV0ZWRIb3Jpem9udGFsID0gZ2V0SG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0LCBwb2ludGVyWCk7XG4gIGxldCB2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5OT05FO1xuICBsZXQgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLk5PTkU7XG5cbiAgLy8gTm90ZSB0aGF0IHdlIGhlcmUgd2UgZG8gc29tZSBleHRyYSBjaGVja3MgZm9yIHdoZXRoZXIgdGhlIGVsZW1lbnQgaXMgYWN0dWFsbHkgc2Nyb2xsYWJsZSBpblxuICAvLyBhIGNlcnRhaW4gZGlyZWN0aW9uIGFuZCB3ZSBvbmx5IGFzc2lnbiB0aGUgc2Nyb2xsIGRpcmVjdGlvbiBpZiBpdCBpcy4gV2UgZG8gdGhpcyBzbyB0aGF0IHdlXG4gIC8vIGNhbiBhbGxvdyBvdGhlciBlbGVtZW50cyB0byBiZSBzY3JvbGxlZCwgaWYgdGhlIGN1cnJlbnQgZWxlbWVudCBjYW4ndCBiZSBzY3JvbGxlZCBhbnltb3JlLlxuICAvLyBUaGlzIGFsbG93cyB1cyB0byBoYW5kbGUgY2FzZXMgd2hlcmUgdGhlIHNjcm9sbCByZWdpb25zIG9mIHR3byBzY3JvbGxhYmxlIGVsZW1lbnRzIG92ZXJsYXAuXG4gIGlmIChjb21wdXRlZFZlcnRpY2FsKSB7XG4gICAgY29uc3Qgc2Nyb2xsVG9wID0gZWxlbWVudC5zY3JvbGxUb3A7XG5cbiAgICBpZiAoY29tcHV0ZWRWZXJ0aWNhbCA9PT0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLlVQKSB7XG4gICAgICBpZiAoc2Nyb2xsVG9wID4gMCkge1xuICAgICAgICB2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5VUDtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0gc2Nyb2xsVG9wID4gZWxlbWVudC5jbGllbnRIZWlnaHQpIHtcbiAgICAgIHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLkRPV047XG4gICAgfVxuICB9XG5cbiAgaWYgKGNvbXB1dGVkSG9yaXpvbnRhbCkge1xuICAgIGNvbnN0IHNjcm9sbExlZnQgPSBlbGVtZW50LnNjcm9sbExlZnQ7XG5cbiAgICBpZiAoY29tcHV0ZWRIb3Jpem9udGFsID09PSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5MRUZUKSB7XG4gICAgICBpZiAoc2Nyb2xsTGVmdCA+IDApIHtcbiAgICAgICAgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLkxFRlQ7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChlbGVtZW50LnNjcm9sbFdpZHRoIC0gc2Nyb2xsTGVmdCA+IGVsZW1lbnQuY2xpZW50V2lkdGgpIHtcbiAgICAgIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5SSUdIVDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uLCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uXTtcbn1cbiJdfQ==