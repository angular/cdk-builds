/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __read, __spread } from "tslib";
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
var DROP_PROXIMITY_THRESHOLD = 0.05;
/**
 * Proximity, as a ratio to width/height at which to start auto-scrolling the drop list or the
 * viewport. The value comes from trying it out manually until it feels right.
 */
var SCROLL_PROXIMITY_THRESHOLD = 0.05;
/**
 * Number of pixels to scroll for each frame when auto-scrolling an element.
 * The value comes from trying it out manually until it feels right.
 */
var AUTO_SCROLL_STEP = 2;
/**
 * Reference to a drop list. Used to manipulate or dispose of the container.
 */
var DropListRef = /** @class */ (function () {
    function DropListRef(element, _dragDropRegistry, _document, _ngZone, _viewportRuler) {
        var _this = this;
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
        this.enterPredicate = function () { return true; };
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
         * Keeps track of the item that was last swapped with the dragged item, as
         * well as what direction the pointer was moving in when the swap occured.
         */
        this._previousSwap = { drag: null, delta: 0 };
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
        this._startScrollInterval = function () {
            _this._stopScrolling();
            interval(0, animationFrameScheduler)
                .pipe(takeUntil(_this._stopScrollTimers))
                .subscribe(function () {
                var node = _this._scrollNode;
                if (_this._verticalScrollDirection === 1 /* UP */) {
                    incrementVerticalScroll(node, -AUTO_SCROLL_STEP);
                }
                else if (_this._verticalScrollDirection === 2 /* DOWN */) {
                    incrementVerticalScroll(node, AUTO_SCROLL_STEP);
                }
                if (_this._horizontalScrollDirection === 1 /* LEFT */) {
                    incrementHorizontalScroll(node, -AUTO_SCROLL_STEP);
                }
                else if (_this._horizontalScrollDirection === 2 /* RIGHT */) {
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
    DropListRef.prototype.dispose = function () {
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
    };
    /** Whether an item from this list is currently being dragged. */
    DropListRef.prototype.isDragging = function () {
        return this._isDragging;
    };
    /** Starts dragging an item. */
    DropListRef.prototype.start = function () {
        var _this = this;
        var styles = coerceElement(this.element).style;
        this.beforeStarted.next();
        this._isDragging = true;
        // We need to disable scroll snapping while the user is dragging, because it breaks automatic
        // scrolling. The browser seems to round the value based on the snapping points which means
        // that we can't increment/decrement the scroll position.
        this._initialScrollSnap = styles.msScrollSnapType || styles.scrollSnapType || '';
        styles.scrollSnapType = styles.msScrollSnapType = 'none';
        this._cacheItems();
        this._siblings.forEach(function (sibling) { return sibling._startReceiving(_this); });
        this._viewportScrollSubscription.unsubscribe();
        this._listenToScrollEvents();
    };
    /**
     * Emits an event to indicate that the user moved an item into the container.
     * @param item Item that was moved into the container.
     * @param pointerX Position of the item along the X axis.
     * @param pointerY Position of the item along the Y axis.
     * @param index Index at which the item entered. If omitted, the container will try to figure it
     *   out automatically.
     */
    DropListRef.prototype.enter = function (item, pointerX, pointerY, index) {
        this.start();
        // If sorting is disabled, we want the item to return to its starting
        // position if the user is returning it to its initial container.
        var newIndex;
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
        var activeDraggables = this._activeDraggables;
        var currentIndex = activeDraggables.indexOf(item);
        var placeholder = item.getPlaceholderElement();
        var newPositionReference = activeDraggables[newIndex];
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
            var element = newPositionReference.getRootElement();
            element.parentElement.insertBefore(placeholder, element);
            activeDraggables.splice(newIndex, 0, item);
        }
        else {
            var element = coerceElement(this.element);
            if (this._shouldEnterAsFirstChild(pointerX, pointerY)) {
                element.insertBefore(placeholder, activeDraggables[0].getRootElement());
                activeDraggables.unshift(item);
            }
            else {
                element.appendChild(placeholder);
                activeDraggables.push(item);
            }
        }
        // The transform needs to be cleared so it doesn't throw off the measurements.
        placeholder.style.transform = '';
        // Note that the positions were already cached when we called `start` above,
        // but we need to refresh them since the amount of items has changed and also parent rects.
        this._cacheItemPositions();
        this._cacheParentPositions();
        this.entered.next({ item: item, container: this, currentIndex: this.getItemIndex(item) });
    };
    /**
     * Removes an item from the container after it was dragged into another container by the user.
     * @param item Item that was dragged out.
     */
    DropListRef.prototype.exit = function (item) {
        this._reset();
        this.exited.next({ item: item, container: this });
    };
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
    DropListRef.prototype.drop = function (item, currentIndex, previousContainer, isPointerOverContainer, distance, previousIndex) {
        this._reset();
        // @breaking-change 11.0.0 Remove this fallback logic once `previousIndex` is a required param.
        if (previousIndex == null) {
            previousIndex = previousContainer.getItemIndex(item);
        }
        this.dropped.next({ item: item,
            currentIndex: currentIndex,
            previousIndex: previousIndex,
            container: this,
            previousContainer: previousContainer,
            isPointerOverContainer: isPointerOverContainer,
            distance: distance
        });
    };
    /**
     * Sets the draggable items that are a part of this list.
     * @param items Items that are a part of this list.
     */
    DropListRef.prototype.withItems = function (items) {
        var _this = this;
        var previousItems = this._draggables;
        this._draggables = items;
        items.forEach(function (item) { return item._withDropContainer(_this); });
        if (this.isDragging()) {
            var draggedItems = previousItems.filter(function (item) { return item.isDragging(); });
            // If all of the items being dragged were removed
            // from the list, abort the current drag sequence.
            if (draggedItems.every(function (item) { return items.indexOf(item) === -1; })) {
                this._reset();
            }
            else {
                this._cacheItems();
            }
        }
        return this;
    };
    /** Sets the layout direction of the drop list. */
    DropListRef.prototype.withDirection = function (direction) {
        this._direction = direction;
        return this;
    };
    /**
     * Sets the containers that are connected to this one. When two or more containers are
     * connected, the user will be allowed to transfer items between them.
     * @param connectedTo Other containers that the current containers should be connected to.
     */
    DropListRef.prototype.connectedTo = function (connectedTo) {
        this._siblings = connectedTo.slice();
        return this;
    };
    /**
     * Sets the orientation of the container.
     * @param orientation New orientation for the container.
     */
    DropListRef.prototype.withOrientation = function (orientation) {
        this._orientation = orientation;
        return this;
    };
    /**
     * Sets which parent elements are can be scrolled while the user is dragging.
     * @param elements Elements that can be scrolled.
     */
    DropListRef.prototype.withScrollableParents = function (elements) {
        var element = coerceElement(this.element);
        // We always allow the current element to be scrollable
        // so we need to ensure that it's in the array.
        this._scrollableElements =
            elements.indexOf(element) === -1 ? __spread([element], elements) : elements.slice();
        return this;
    };
    /** Gets the scrollable parents that are registered with this drop container. */
    DropListRef.prototype.getScrollableParents = function () {
        return this._scrollableElements;
    };
    /**
     * Figures out the index of an item in the container.
     * @param item Item whose index should be determined.
     */
    DropListRef.prototype.getItemIndex = function (item) {
        if (!this._isDragging) {
            return this._draggables.indexOf(item);
        }
        // Items are sorted always by top/left in the cache, however they flow differently in RTL.
        // The rest of the logic still stands no matter what orientation we're in, however
        // we need to invert the array when determining the index.
        var items = this._orientation === 'horizontal' && this._direction === 'rtl' ?
            this._itemPositions.slice().reverse() : this._itemPositions;
        return findIndex(items, function (currentItem) { return currentItem.drag === item; });
    };
    /**
     * Whether the list is able to receive the item that
     * is currently being dragged inside a connected drop list.
     */
    DropListRef.prototype.isReceiving = function () {
        return this._activeSiblings.size > 0;
    };
    /**
     * Sorts an item inside the container based on its position.
     * @param item Item to be sorted.
     * @param pointerX Position of the item along the X axis.
     * @param pointerY Position of the item along the Y axis.
     * @param pointerDelta Direction in which the pointer is moving along each axis.
     */
    DropListRef.prototype._sortItem = function (item, pointerX, pointerY, pointerDelta) {
        // Don't sort the item if sorting is disabled or it's out of range.
        if (this.sortingDisabled ||
            !isPointerNearClientRect(this._clientRect, DROP_PROXIMITY_THRESHOLD, pointerX, pointerY)) {
            return;
        }
        var siblings = this._itemPositions;
        var newIndex = this._getItemIndexFromPointerPosition(item, pointerX, pointerY, pointerDelta);
        if (newIndex === -1 && siblings.length > 0) {
            return;
        }
        var isHorizontal = this._orientation === 'horizontal';
        var currentIndex = findIndex(siblings, function (currentItem) { return currentItem.drag === item; });
        var siblingAtNewPosition = siblings[newIndex];
        var currentPosition = siblings[currentIndex].clientRect;
        var newPosition = siblingAtNewPosition.clientRect;
        var delta = currentIndex > newIndex ? 1 : -1;
        this._previousSwap.drag = siblingAtNewPosition.drag;
        this._previousSwap.delta = isHorizontal ? pointerDelta.x : pointerDelta.y;
        // How many pixels the item's placeholder should be offset.
        var itemOffset = this._getItemOffsetPx(currentPosition, newPosition, delta);
        // How many pixels all the other items should be offset.
        var siblingOffset = this._getSiblingOffsetPx(currentIndex, siblings, delta);
        // Save the previous order of the items before moving the item to its new index.
        // We use this to check whether an item has been moved as a result of the sorting.
        var oldOrder = siblings.slice();
        // Shuffle the array in place.
        moveItemInArray(siblings, currentIndex, newIndex);
        this.sorted.next({
            previousIndex: currentIndex,
            currentIndex: newIndex,
            container: this,
            item: item
        });
        siblings.forEach(function (sibling, index) {
            // Don't do anything if the position hasn't changed.
            if (oldOrder[index] === sibling) {
                return;
            }
            var isDraggedItem = sibling.drag === item;
            var offset = isDraggedItem ? itemOffset : siblingOffset;
            var elementToOffset = isDraggedItem ? item.getPlaceholderElement() :
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
                elementToOffset.style.transform = "translate3d(" + Math.round(sibling.offset) + "px, 0, 0)";
                adjustClientRect(sibling.clientRect, 0, offset);
            }
            else {
                elementToOffset.style.transform = "translate3d(0, " + Math.round(sibling.offset) + "px, 0)";
                adjustClientRect(sibling.clientRect, offset, 0);
            }
        });
    };
    /**
     * Checks whether the user's pointer is close to the edges of either the
     * viewport or the drop list and starts the auto-scroll sequence.
     * @param pointerX User's pointer position along the x axis.
     * @param pointerY User's pointer position along the y axis.
     */
    DropListRef.prototype._startScrollingIfNecessary = function (pointerX, pointerY) {
        var _this = this;
        if (this.autoScrollDisabled) {
            return;
        }
        var scrollNode;
        var verticalScrollDirection = 0 /* NONE */;
        var horizontalScrollDirection = 0 /* NONE */;
        // Check whether we should start scrolling any of the parent containers.
        this._parentPositions.positions.forEach(function (position, element) {
            var _a;
            // We have special handling for the `document` below. Also this would be
            // nicer with a  for...of loop, but it requires changing a compiler flag.
            if (element === _this._document || !position.clientRect || scrollNode) {
                return;
            }
            if (isPointerNearClientRect(position.clientRect, DROP_PROXIMITY_THRESHOLD, pointerX, pointerY)) {
                _a = __read(getElementScrollDirections(element, position.clientRect, pointerX, pointerY), 2), verticalScrollDirection = _a[0], horizontalScrollDirection = _a[1];
                if (verticalScrollDirection || horizontalScrollDirection) {
                    scrollNode = element;
                }
            }
        });
        // Otherwise check if we can start scrolling the viewport.
        if (!verticalScrollDirection && !horizontalScrollDirection) {
            var _a = this._viewportRuler.getViewportSize(), width = _a.width, height = _a.height;
            var clientRect = { width: width, height: height, top: 0, right: width, bottom: height, left: 0 };
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
    };
    /** Stops any currently-running auto-scroll sequences. */
    DropListRef.prototype._stopScrolling = function () {
        this._stopScrollTimers.next();
    };
    /** Caches the positions of the configured scrollable parents. */
    DropListRef.prototype._cacheParentPositions = function () {
        var element = coerceElement(this.element);
        this._parentPositions.cache(this._scrollableElements);
        // The list element is always in the `scrollableElements`
        // so we can take advantage of the cached `ClientRect`.
        this._clientRect = this._parentPositions.positions.get(element).clientRect;
    };
    /** Refreshes the position cache of the items and sibling containers. */
    DropListRef.prototype._cacheItemPositions = function () {
        var isHorizontal = this._orientation === 'horizontal';
        this._itemPositions = this._activeDraggables.map(function (drag) {
            var elementToMeasure = drag.getVisibleElement();
            return { drag: drag, offset: 0, clientRect: getMutableClientRect(elementToMeasure) };
        }).sort(function (a, b) {
            return isHorizontal ? a.clientRect.left - b.clientRect.left :
                a.clientRect.top - b.clientRect.top;
        });
    };
    /** Resets the container to its initial state. */
    DropListRef.prototype._reset = function () {
        var _this = this;
        this._isDragging = false;
        var styles = coerceElement(this.element).style;
        styles.scrollSnapType = styles.msScrollSnapType = this._initialScrollSnap;
        // TODO(crisbeto): may have to wait for the animations to finish.
        this._activeDraggables.forEach(function (item) {
            var rootElement = item.getRootElement();
            if (rootElement) {
                rootElement.style.transform = '';
            }
        });
        this._siblings.forEach(function (sibling) { return sibling._stopReceiving(_this); });
        this._activeDraggables = [];
        this._itemPositions = [];
        this._previousSwap.drag = null;
        this._previousSwap.delta = 0;
        this._stopScrolling();
        this._viewportScrollSubscription.unsubscribe();
        this._parentPositions.clear();
    };
    /**
     * Gets the offset in pixels by which the items that aren't being dragged should be moved.
     * @param currentIndex Index of the item currently being dragged.
     * @param siblings All of the items in the list.
     * @param delta Direction in which the user is moving.
     */
    DropListRef.prototype._getSiblingOffsetPx = function (currentIndex, siblings, delta) {
        var isHorizontal = this._orientation === 'horizontal';
        var currentPosition = siblings[currentIndex].clientRect;
        var immediateSibling = siblings[currentIndex + delta * -1];
        var siblingOffset = currentPosition[isHorizontal ? 'width' : 'height'] * delta;
        if (immediateSibling) {
            var start = isHorizontal ? 'left' : 'top';
            var end = isHorizontal ? 'right' : 'bottom';
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
    };
    /**
     * Gets the offset in pixels by which the item that is being dragged should be moved.
     * @param currentPosition Current position of the item.
     * @param newPosition Position of the item where the current item should be moved.
     * @param delta Direction in which the user is moving.
     */
    DropListRef.prototype._getItemOffsetPx = function (currentPosition, newPosition, delta) {
        var isHorizontal = this._orientation === 'horizontal';
        var itemOffset = isHorizontal ? newPosition.left - currentPosition.left :
            newPosition.top - currentPosition.top;
        // Account for differences in the item width/height.
        if (delta === -1) {
            itemOffset += isHorizontal ? newPosition.width - currentPosition.width :
                newPosition.height - currentPosition.height;
        }
        return itemOffset;
    };
    /**
     * Checks if pointer is entering in the first position
     * @param pointerX Position of the user's pointer along the X axis.
     * @param pointerY Position of the user's pointer along the Y axis.
     */
    DropListRef.prototype._shouldEnterAsFirstChild = function (pointerX, pointerY) {
        if (!this._activeDraggables.length) {
            return false;
        }
        var itemPositions = this._itemPositions;
        var isHorizontal = this._orientation === 'horizontal';
        // `itemPositions` are sorted by position while `activeDraggables` are sorted by child index
        // check if container is using some sort of "reverse" ordering (eg: flex-direction: row-reverse)
        var reversed = itemPositions[0].drag !== this._activeDraggables[0];
        if (reversed) {
            var lastItemRect = itemPositions[itemPositions.length - 1].clientRect;
            return isHorizontal ? pointerX >= lastItemRect.right : pointerY >= lastItemRect.bottom;
        }
        else {
            var firstItemRect = itemPositions[0].clientRect;
            return isHorizontal ? pointerX <= firstItemRect.left : pointerY <= firstItemRect.top;
        }
    };
    /**
     * Gets the index of an item in the drop container, based on the position of the user's pointer.
     * @param item Item that is being sorted.
     * @param pointerX Position of the user's pointer along the X axis.
     * @param pointerY Position of the user's pointer along the Y axis.
     * @param delta Direction in which the user is moving their pointer.
     */
    DropListRef.prototype._getItemIndexFromPointerPosition = function (item, pointerX, pointerY, delta) {
        var _this = this;
        var isHorizontal = this._orientation === 'horizontal';
        return findIndex(this._itemPositions, function (_a, _, array) {
            var drag = _a.drag, clientRect = _a.clientRect;
            if (drag === item) {
                // If there's only one item left in the container, it must be
                // the dragged item itself so we use it as a reference.
                return array.length < 2;
            }
            if (delta) {
                var direction = isHorizontal ? delta.x : delta.y;
                // If the user is still hovering over the same item as last time, and they didn't change
                // the direction in which they're dragging, we don't consider it a direction swap.
                if (drag === _this._previousSwap.drag && direction === _this._previousSwap.delta) {
                    return false;
                }
            }
            return isHorizontal ?
                // Round these down since most browsers report client rects with
                // sub-pixel precision, whereas the pointer coordinates are rounded to pixels.
                pointerX >= Math.floor(clientRect.left) && pointerX < Math.floor(clientRect.right) :
                pointerY >= Math.floor(clientRect.top) && pointerY < Math.floor(clientRect.bottom);
        });
    };
    /** Caches the current items in the list and their positions. */
    DropListRef.prototype._cacheItems = function () {
        this._activeDraggables = this._draggables.slice();
        this._cacheItemPositions();
        this._cacheParentPositions();
    };
    /**
     * Checks whether the user's pointer is positioned over the container.
     * @param x Pointer position along the X axis.
     * @param y Pointer position along the Y axis.
     */
    DropListRef.prototype._isOverContainer = function (x, y) {
        return isInsideClientRect(this._clientRect, x, y);
    };
    /**
     * Figures out whether an item should be moved into a sibling
     * drop container, based on its current position.
     * @param item Drag item that is being moved.
     * @param x Position of the item along the X axis.
     * @param y Position of the item along the Y axis.
     */
    DropListRef.prototype._getSiblingContainerFromPosition = function (item, x, y) {
        return this._siblings.find(function (sibling) { return sibling._canReceive(item, x, y); });
    };
    /**
     * Checks whether the drop list can receive the passed-in item.
     * @param item Item that is being dragged into the list.
     * @param x Position of the item along the X axis.
     * @param y Position of the item along the Y axis.
     */
    DropListRef.prototype._canReceive = function (item, x, y) {
        if (!isInsideClientRect(this._clientRect, x, y) || !this.enterPredicate(item, this)) {
            return false;
        }
        var elementFromPoint = this._getShadowRoot().elementFromPoint(x, y);
        // If there's no element at the pointer position, then
        // the client rect is probably scrolled out of the view.
        if (!elementFromPoint) {
            return false;
        }
        var nativeElement = coerceElement(this.element);
        // The `ClientRect`, that we're using to find the container over which the user is
        // hovering, doesn't give us any information on whether the element has been scrolled
        // out of the view or whether it's overlapping with other containers. This means that
        // we could end up transferring the item into a container that's invisible or is positioned
        // below another one. We use the result from `elementFromPoint` to get the top-most element
        // at the pointer position and to find whether it's one of the intersecting drop containers.
        return elementFromPoint === nativeElement || nativeElement.contains(elementFromPoint);
    };
    /**
     * Called by one of the connected drop lists when a dragging sequence has started.
     * @param sibling Sibling in which dragging has started.
     */
    DropListRef.prototype._startReceiving = function (sibling) {
        var activeSiblings = this._activeSiblings;
        if (!activeSiblings.has(sibling)) {
            activeSiblings.add(sibling);
            this._cacheParentPositions();
            this._listenToScrollEvents();
        }
    };
    /**
     * Called by a connected drop list when dragging has stopped.
     * @param sibling Sibling whose dragging has stopped.
     */
    DropListRef.prototype._stopReceiving = function (sibling) {
        this._activeSiblings.delete(sibling);
        this._viewportScrollSubscription.unsubscribe();
    };
    /**
     * Starts listening to scroll events on the viewport.
     * Used for updating the internal state of the list.
     */
    DropListRef.prototype._listenToScrollEvents = function () {
        var _this = this;
        this._viewportScrollSubscription = this._dragDropRegistry.scroll.subscribe(function (event) {
            if (_this.isDragging()) {
                var scrollDifference_1 = _this._parentPositions.handleScroll(event);
                if (scrollDifference_1) {
                    // Since we know the amount that the user has scrolled we can shift all of the
                    // client rectangles ourselves. This is cheaper than re-measuring everything and
                    // we can avoid inconsistent behavior where we might be measuring the element before
                    // its position has changed.
                    _this._itemPositions.forEach(function (_a) {
                        var clientRect = _a.clientRect;
                        adjustClientRect(clientRect, scrollDifference_1.top, scrollDifference_1.left);
                    });
                    // We need two loops for this, because we want all of the cached
                    // positions to be up-to-date before we re-sort the item.
                    _this._itemPositions.forEach(function (_a) {
                        var drag = _a.drag;
                        if (_this._dragDropRegistry.isDragging(drag)) {
                            // We need to re-sort the item manually, because the pointer move
                            // events won't be dispatched while the user is scrolling.
                            drag._sortFromLastPointerPosition();
                        }
                    });
                }
            }
            else if (_this.isReceiving()) {
                _this._cacheParentPositions();
            }
        });
    };
    /**
     * Lazily resolves and returns the shadow root of the element. We do this in a function, rather
     * than saving it in property directly on init, because we want to resolve it as late as possible
     * in order to ensure that the element has been moved into the shadow DOM. Doing it inside the
     * constructor might be too early if the element is inside of something like `ngFor` or `ngIf`.
     */
    DropListRef.prototype._getShadowRoot = function () {
        if (!this._cachedShadowRoot) {
            var shadowRoot = _getShadowRoot(coerceElement(this.element));
            this._cachedShadowRoot = shadowRoot || this._document;
        }
        return this._cachedShadowRoot;
    };
    return DropListRef;
}());
export { DropListRef };
/**
 * Finds the index of an item that matches a predicate function. Used as an equivalent
 * of `Array.prototype.findIndex` which isn't part of the standard Google typings.
 * @param array Array in which to look for matches.
 * @param predicate Function used to determine whether an item is a match.
 */
function findIndex(array, predicate) {
    for (var i = 0; i < array.length; i++) {
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
    var top = clientRect.top, bottom = clientRect.bottom, height = clientRect.height;
    var yThreshold = height * SCROLL_PROXIMITY_THRESHOLD;
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
    var left = clientRect.left, right = clientRect.right, width = clientRect.width;
    var xThreshold = width * SCROLL_PROXIMITY_THRESHOLD;
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
    var computedVertical = getVerticalScrollDirection(clientRect, pointerY);
    var computedHorizontal = getHorizontalScrollDirection(clientRect, pointerX);
    var verticalScrollDirection = 0 /* NONE */;
    var horizontalScrollDirection = 0 /* NONE */;
    // Note that we here we do some extra checks for whether the element is actually scrollable in
    // a certain direction and we only assign the scroll direction if it is. We do this so that we
    // can allow other elements to be scrolled, if the current element can't be scrolled anymore.
    // This allows us to handle cases where the scroll regions of two scrollable elements overlap.
    if (computedVertical) {
        var scrollTop = element.scrollTop;
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
        var scrollLeft = element.scrollLeft;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LXJlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2Ryb3AtbGlzdC1yZWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUlILE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUVwRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDckQsT0FBTyxFQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLHVCQUF1QixFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQzlFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6QyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBRzdDLE9BQU8sRUFDTCx1QkFBdUIsRUFDdkIsZ0JBQWdCLEVBQ2hCLG9CQUFvQixFQUNwQixrQkFBa0IsR0FDbkIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFHaEU7OztHQUdHO0FBQ0gsSUFBTSx3QkFBd0IsR0FBRyxJQUFJLENBQUM7QUFFdEM7OztHQUdHO0FBQ0gsSUFBTSwwQkFBMEIsR0FBRyxJQUFJLENBQUM7QUFFeEM7OztHQUdHO0FBQ0gsSUFBTSxnQkFBZ0IsR0FBRyxDQUFDLENBQUM7QUE0QjNCOztHQUVHO0FBQ0g7SUFnSUUscUJBQ0UsT0FBOEMsRUFDdEMsaUJBQXlELEVBQ2pFLFNBQWMsRUFDTixPQUFlLEVBQ2YsY0FBNkI7UUFMdkMsaUJBV0M7UUFUUyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQXdDO1FBRXpELFlBQU8sR0FBUCxPQUFPLENBQVE7UUFDZixtQkFBYyxHQUFkLGNBQWMsQ0FBZTtRQWpJdkMsNEVBQTRFO1FBQzVFLGFBQVEsR0FBWSxLQUFLLENBQUM7UUFFMUIs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QUMsQ0FBQztJQUMxRSxJQUFNLGtCQUFrQixHQUFHLDRCQUE0QixDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUM5RSxJQUFJLHVCQUF1QixlQUFtQyxDQUFDO0lBQy9ELElBQUkseUJBQXlCLGVBQXFDLENBQUM7SUFFbkUsOEZBQThGO0lBQzlGLDhGQUE4RjtJQUM5Riw2RkFBNkY7SUFDN0YsOEZBQThGO0lBQzlGLElBQUksZ0JBQWdCLEVBQUU7UUFDcEIsSUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQztRQUVwQyxJQUFJLGdCQUFnQixlQUFtQyxFQUFFO1lBQ3ZELElBQUksU0FBUyxHQUFHLENBQUMsRUFBRTtnQkFDakIsdUJBQXVCLGFBQWlDLENBQUM7YUFDMUQ7U0FDRjthQUFNLElBQUksT0FBTyxDQUFDLFlBQVksR0FBRyxTQUFTLEdBQUcsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUNsRSx1QkFBdUIsZUFBbUMsQ0FBQztTQUM1RDtLQUNGO0lBRUQsSUFBSSxrQkFBa0IsRUFBRTtRQUN0QixJQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO1FBRXRDLElBQUksa0JBQWtCLGlCQUF1QyxFQUFFO1lBQzdELElBQUksVUFBVSxHQUFHLENBQUMsRUFBRTtnQkFDbEIseUJBQXlCLGVBQXFDLENBQUM7YUFDaEU7U0FDRjthQUFNLElBQUksT0FBTyxDQUFDLFdBQVcsR0FBRyxVQUFVLEdBQUcsT0FBTyxDQUFDLFdBQVcsRUFBRTtZQUNqRSx5QkFBeUIsZ0JBQXNDLENBQUM7U0FDakU7S0FDRjtJQUVELE9BQU8sQ0FBQyx1QkFBdUIsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO0FBQzlELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtFbGVtZW50UmVmLCBOZ1pvbmV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtEaXJlY3Rpb259IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7Y29lcmNlRWxlbWVudH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7Vmlld3BvcnRSdWxlcn0gZnJvbSAnQGFuZ3VsYXIvY2RrL3Njcm9sbGluZyc7XG5pbXBvcnQge19nZXRTaGFkb3dSb290fSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtTdWJqZWN0LCBTdWJzY3JpcHRpb24sIGludGVydmFsLCBhbmltYXRpb25GcmFtZVNjaGVkdWxlcn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3Rha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHttb3ZlSXRlbUluQXJyYXl9IGZyb20gJy4vZHJhZy11dGlscyc7XG5pbXBvcnQge0RyYWdEcm9wUmVnaXN0cnl9IGZyb20gJy4vZHJhZy1kcm9wLXJlZ2lzdHJ5JztcbmltcG9ydCB7RHJhZ1JlZkludGVybmFsIGFzIERyYWdSZWYsIFBvaW50fSBmcm9tICcuL2RyYWctcmVmJztcbmltcG9ydCB7XG4gIGlzUG9pbnRlck5lYXJDbGllbnRSZWN0LFxuICBhZGp1c3RDbGllbnRSZWN0LFxuICBnZXRNdXRhYmxlQ2xpZW50UmVjdCxcbiAgaXNJbnNpZGVDbGllbnRSZWN0LFxufSBmcm9tICcuL2NsaWVudC1yZWN0JztcbmltcG9ydCB7UGFyZW50UG9zaXRpb25UcmFja2VyfSBmcm9tICcuL3BhcmVudC1wb3NpdGlvbi10cmFja2VyJztcbmltcG9ydCB7RHJhZ0NTU1N0eWxlRGVjbGFyYXRpb259IGZyb20gJy4vZHJhZy1zdHlsaW5nJztcblxuLyoqXG4gKiBQcm94aW1pdHksIGFzIGEgcmF0aW8gdG8gd2lkdGgvaGVpZ2h0LCBhdCB3aGljaCBhXG4gKiBkcmFnZ2VkIGl0ZW0gd2lsbCBhZmZlY3QgdGhlIGRyb3AgY29udGFpbmVyLlxuICovXG5jb25zdCBEUk9QX1BST1hJTUlUWV9USFJFU0hPTEQgPSAwLjA1O1xuXG4vKipcbiAqIFByb3hpbWl0eSwgYXMgYSByYXRpbyB0byB3aWR0aC9oZWlnaHQgYXQgd2hpY2ggdG8gc3RhcnQgYXV0by1zY3JvbGxpbmcgdGhlIGRyb3AgbGlzdCBvciB0aGVcbiAqIHZpZXdwb3J0LiBUaGUgdmFsdWUgY29tZXMgZnJvbSB0cnlpbmcgaXQgb3V0IG1hbnVhbGx5IHVudGlsIGl0IGZlZWxzIHJpZ2h0LlxuICovXG5jb25zdCBTQ1JPTExfUFJPWElNSVRZX1RIUkVTSE9MRCA9IDAuMDU7XG5cbi8qKlxuICogTnVtYmVyIG9mIHBpeGVscyB0byBzY3JvbGwgZm9yIGVhY2ggZnJhbWUgd2hlbiBhdXRvLXNjcm9sbGluZyBhbiBlbGVtZW50LlxuICogVGhlIHZhbHVlIGNvbWVzIGZyb20gdHJ5aW5nIGl0IG91dCBtYW51YWxseSB1bnRpbCBpdCBmZWVscyByaWdodC5cbiAqL1xuY29uc3QgQVVUT19TQ1JPTExfU1RFUCA9IDI7XG5cbi8qKlxuICogRW50cnkgaW4gdGhlIHBvc2l0aW9uIGNhY2hlIGZvciBkcmFnZ2FibGUgaXRlbXMuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmludGVyZmFjZSBDYWNoZWRJdGVtUG9zaXRpb24ge1xuICAvKiogSW5zdGFuY2Ugb2YgdGhlIGRyYWcgaXRlbS4gKi9cbiAgZHJhZzogRHJhZ1JlZjtcbiAgLyoqIERpbWVuc2lvbnMgb2YgdGhlIGl0ZW0uICovXG4gIGNsaWVudFJlY3Q6IENsaWVudFJlY3Q7XG4gIC8qKiBBbW91bnQgYnkgd2hpY2ggdGhlIGl0ZW0gaGFzIGJlZW4gbW92ZWQgc2luY2UgZHJhZ2dpbmcgc3RhcnRlZC4gKi9cbiAgb2Zmc2V0OiBudW1iZXI7XG59XG5cbi8qKiBWZXJ0aWNhbCBkaXJlY3Rpb24gaW4gd2hpY2ggd2UgY2FuIGF1dG8tc2Nyb2xsLiAqL1xuY29uc3QgZW51bSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24ge05PTkUsIFVQLCBET1dOfVxuXG4vKiogSG9yaXpvbnRhbCBkaXJlY3Rpb24gaW4gd2hpY2ggd2UgY2FuIGF1dG8tc2Nyb2xsLiAqL1xuY29uc3QgZW51bSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbiB7Tk9ORSwgTEVGVCwgUklHSFR9XG5cbi8qKlxuICogSW50ZXJuYWwgY29tcGlsZS10aW1lLW9ubHkgcmVwcmVzZW50YXRpb24gb2YgYSBgRHJvcExpc3RSZWZgLlxuICogVXNlZCB0byBhdm9pZCBjaXJjdWxhciBpbXBvcnQgaXNzdWVzIGJldHdlZW4gdGhlIGBEcm9wTGlzdFJlZmAgYW5kIHRoZSBgRHJhZ1JlZmAuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRHJvcExpc3RSZWZJbnRlcm5hbCBleHRlbmRzIERyb3BMaXN0UmVmIHt9XG5cbi8qKlxuICogUmVmZXJlbmNlIHRvIGEgZHJvcCBsaXN0LiBVc2VkIHRvIG1hbmlwdWxhdGUgb3IgZGlzcG9zZSBvZiB0aGUgY29udGFpbmVyLlxuICovXG5leHBvcnQgY2xhc3MgRHJvcExpc3RSZWY8VCA9IGFueT4ge1xuICAvKiogRWxlbWVudCB0aGF0IHRoZSBkcm9wIGxpc3QgaXMgYXR0YWNoZWQgdG8uICovXG4gIGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD47XG5cbiAgLyoqIFdoZXRoZXIgc3RhcnRpbmcgYSBkcmFnZ2luZyBzZXF1ZW5jZSBmcm9tIHRoaXMgY29udGFpbmVyIGlzIGRpc2FibGVkLiAqL1xuICBkaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIHNvcnRpbmcgaXRlbXMgd2l0aGluIHRoZSBsaXN0IGlzIGRpc2FibGVkLiAqL1xuICBzb3J0aW5nRGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogTG9ja3MgdGhlIHBvc2l0aW9uIG9mIHRoZSBkcmFnZ2FibGUgZWxlbWVudHMgaW5zaWRlIHRoZSBjb250YWluZXIgYWxvbmcgdGhlIHNwZWNpZmllZCBheGlzLiAqL1xuICBsb2NrQXhpczogJ3gnIHwgJ3knO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIGF1dG8tc2Nyb2xsaW5nIHRoZSB2aWV3IHdoZW4gdGhlIHVzZXJcbiAgICogbW92ZXMgdGhlaXIgcG9pbnRlciBjbG9zZSB0byB0aGUgZWRnZXMgaXMgZGlzYWJsZWQuXG4gICAqL1xuICBhdXRvU2Nyb2xsRGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKipcbiAgICogRnVuY3Rpb24gdGhhdCBpcyB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIGFuIGl0ZW1cbiAgICogaXMgYWxsb3dlZCB0byBiZSBtb3ZlZCBpbnRvIGEgZHJvcCBjb250YWluZXIuXG4gICAqL1xuICBlbnRlclByZWRpY2F0ZTogKGRyYWc6IERyYWdSZWYsIGRyb3A6IERyb3BMaXN0UmVmKSA9PiBib29sZWFuID0gKCkgPT4gdHJ1ZTtcblxuICAvKiogRW1pdHMgcmlnaHQgYmVmb3JlIGRyYWdnaW5nIGhhcyBzdGFydGVkLiAqL1xuICBiZWZvcmVTdGFydGVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKipcbiAgICogRW1pdHMgd2hlbiB0aGUgdXNlciBoYXMgbW92ZWQgYSBuZXcgZHJhZyBpdGVtIGludG8gdGhpcyBjb250YWluZXIuXG4gICAqL1xuICBlbnRlcmVkID0gbmV3IFN1YmplY3Q8e2l0ZW06IERyYWdSZWYsIGNvbnRhaW5lcjogRHJvcExpc3RSZWYsIGN1cnJlbnRJbmRleDogbnVtYmVyfT4oKTtcblxuICAvKipcbiAgICogRW1pdHMgd2hlbiB0aGUgdXNlciByZW1vdmVzIGFuIGl0ZW0gZnJvbSB0aGUgY29udGFpbmVyXG4gICAqIGJ5IGRyYWdnaW5nIGl0IGludG8gYW5vdGhlciBjb250YWluZXIuXG4gICAqL1xuICBleGl0ZWQgPSBuZXcgU3ViamVjdDx7aXRlbTogRHJhZ1JlZiwgY29udGFpbmVyOiBEcm9wTGlzdFJlZn0+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgZHJvcHMgYW4gaXRlbSBpbnNpZGUgdGhlIGNvbnRhaW5lci4gKi9cbiAgZHJvcHBlZCA9IG5ldyBTdWJqZWN0PHtcbiAgICBpdGVtOiBEcmFnUmVmLFxuICAgIGN1cnJlbnRJbmRleDogbnVtYmVyLFxuICAgIHByZXZpb3VzSW5kZXg6IG51bWJlcixcbiAgICBjb250YWluZXI6IERyb3BMaXN0UmVmLFxuICAgIHByZXZpb3VzQ29udGFpbmVyOiBEcm9wTGlzdFJlZixcbiAgICBpc1BvaW50ZXJPdmVyQ29udGFpbmVyOiBib29sZWFuLFxuICAgIGRpc3RhbmNlOiBQb2ludDtcbiAgfT4oKTtcblxuICAvKiogRW1pdHMgYXMgdGhlIHVzZXIgaXMgc3dhcHBpbmcgaXRlbXMgd2hpbGUgYWN0aXZlbHkgZHJhZ2dpbmcuICovXG4gIHNvcnRlZCA9IG5ldyBTdWJqZWN0PHtcbiAgICBwcmV2aW91c0luZGV4OiBudW1iZXIsXG4gICAgY3VycmVudEluZGV4OiBudW1iZXIsXG4gICAgY29udGFpbmVyOiBEcm9wTGlzdFJlZixcbiAgICBpdGVtOiBEcmFnUmVmXG4gIH0+KCk7XG5cbiAgLyoqIEFyYml0cmFyeSBkYXRhIHRoYXQgY2FuIGJlIGF0dGFjaGVkIHRvIHRoZSBkcm9wIGxpc3QuICovXG4gIGRhdGE6IFQ7XG5cbiAgLyoqIFdoZXRoZXIgYW4gaXRlbSBpbiB0aGUgbGlzdCBpcyBiZWluZyBkcmFnZ2VkLiAqL1xuICBwcml2YXRlIF9pc0RyYWdnaW5nID0gZmFsc2U7XG5cbiAgLyoqIENhY2hlIG9mIHRoZSBkaW1lbnNpb25zIG9mIGFsbCB0aGUgaXRlbXMgaW5zaWRlIHRoZSBjb250YWluZXIuICovXG4gIHByaXZhdGUgX2l0ZW1Qb3NpdGlvbnM6IENhY2hlZEl0ZW1Qb3NpdGlvbltdID0gW107XG5cbiAgLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBwb3NpdGlvbnMgb2YgYW55IHBhcmVudCBzY3JvbGxhYmxlIGVsZW1lbnRzLiAqL1xuICBwcml2YXRlIF9wYXJlbnRQb3NpdGlvbnM6IFBhcmVudFBvc2l0aW9uVHJhY2tlcjtcblxuICAvKiogQ2FjaGVkIGBDbGllbnRSZWN0YCBvZiB0aGUgZHJvcCBsaXN0LiAqL1xuICBwcml2YXRlIF9jbGllbnRSZWN0OiBDbGllbnRSZWN0O1xuXG4gIC8qKlxuICAgKiBEcmFnZ2FibGUgaXRlbXMgdGhhdCBhcmUgY3VycmVudGx5IGFjdGl2ZSBpbnNpZGUgdGhlIGNvbnRhaW5lci4gSW5jbHVkZXMgdGhlIGl0ZW1zXG4gICAqIGZyb20gYF9kcmFnZ2FibGVzYCwgYXMgd2VsbCBhcyBhbnkgaXRlbXMgdGhhdCBoYXZlIGJlZW4gZHJhZ2dlZCBpbiwgYnV0IGhhdmVuJ3RcbiAgICogYmVlbiBkcm9wcGVkIHlldC5cbiAgICovXG4gIHByaXZhdGUgX2FjdGl2ZURyYWdnYWJsZXM6IERyYWdSZWZbXTtcblxuICAvKipcbiAgICogS2VlcHMgdHJhY2sgb2YgdGhlIGl0ZW0gdGhhdCB3YXMgbGFzdCBzd2FwcGVkIHdpdGggdGhlIGRyYWdnZWQgaXRlbSwgYXNcbiAgICogd2VsbCBhcyB3aGF0IGRpcmVjdGlvbiB0aGUgcG9pbnRlciB3YXMgbW92aW5nIGluIHdoZW4gdGhlIHN3YXAgb2NjdXJlZC5cbiAgICovXG4gIHByaXZhdGUgX3ByZXZpb3VzU3dhcCA9IHtkcmFnOiBudWxsIGFzIERyYWdSZWYgfCBudWxsLCBkZWx0YTogMH07XG5cbiAgLyoqIERyYWdnYWJsZSBpdGVtcyBpbiB0aGUgY29udGFpbmVyLiAqL1xuICBwcml2YXRlIF9kcmFnZ2FibGVzOiBSZWFkb25seUFycmF5PERyYWdSZWY+O1xuXG4gIC8qKiBEcm9wIGxpc3RzIHRoYXQgYXJlIGNvbm5lY3RlZCB0byB0aGUgY3VycmVudCBvbmUuICovXG4gIHByaXZhdGUgX3NpYmxpbmdzOiBSZWFkb25seUFycmF5PERyb3BMaXN0UmVmPiA9IFtdO1xuXG4gIC8qKiBEaXJlY3Rpb24gaW4gd2hpY2ggdGhlIGxpc3QgaXMgb3JpZW50ZWQuICovXG4gIHByaXZhdGUgX29yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcgfCAndmVydGljYWwnID0gJ3ZlcnRpY2FsJztcblxuICAvKiogQ29ubmVjdGVkIHNpYmxpbmdzIHRoYXQgY3VycmVudGx5IGhhdmUgYSBkcmFnZ2VkIGl0ZW0uICovXG4gIHByaXZhdGUgX2FjdGl2ZVNpYmxpbmdzID0gbmV3IFNldDxEcm9wTGlzdFJlZj4oKTtcblxuICAvKiogTGF5b3V0IGRpcmVjdGlvbiBvZiB0aGUgZHJvcCBsaXN0LiAqL1xuICBwcml2YXRlIF9kaXJlY3Rpb246IERpcmVjdGlvbiA9ICdsdHInO1xuXG4gIC8qKiBTdWJzY3JpcHRpb24gdG8gdGhlIHdpbmRvdyBiZWluZyBzY3JvbGxlZC4gKi9cbiAgcHJpdmF0ZSBfdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG5cbiAgLyoqIFZlcnRpY2FsIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgbGlzdCBpcyBjdXJyZW50bHkgc2Nyb2xsaW5nLiAqL1xuICBwcml2YXRlIF92ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5OT05FO1xuXG4gIC8qKiBIb3Jpem9udGFsIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgbGlzdCBpcyBjdXJyZW50bHkgc2Nyb2xsaW5nLiAqL1xuICBwcml2YXRlIF9ob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTk9ORTtcblxuICAvKiogTm9kZSB0aGF0IGlzIGJlaW5nIGF1dG8tc2Nyb2xsZWQuICovXG4gIHByaXZhdGUgX3Njcm9sbE5vZGU6IEhUTUxFbGVtZW50IHwgV2luZG93O1xuXG4gIC8qKiBVc2VkIHRvIHNpZ25hbCB0byB0aGUgY3VycmVudCBhdXRvLXNjcm9sbCBzZXF1ZW5jZSB3aGVuIHRvIHN0b3AuICovXG4gIHByaXZhdGUgX3N0b3BTY3JvbGxUaW1lcnMgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBTaGFkb3cgcm9vdCBvZiB0aGUgY3VycmVudCBlbGVtZW50LiBOZWNlc3NhcnkgZm9yIGBlbGVtZW50RnJvbVBvaW50YCB0byByZXNvbHZlIGNvcnJlY3RseS4gKi9cbiAgcHJpdmF0ZSBfY2FjaGVkU2hhZG93Um9vdDogRG9jdW1lbnRPclNoYWRvd1Jvb3QgfCBudWxsID0gbnVsbDtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSBkb2N1bWVudC4gKi9cbiAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50O1xuXG4gIC8qKiBFbGVtZW50cyB0aGF0IGNhbiBiZSBzY3JvbGxlZCB3aGlsZSB0aGUgdXNlciBpcyBkcmFnZ2luZy4gKi9cbiAgcHJpdmF0ZSBfc2Nyb2xsYWJsZUVsZW1lbnRzOiBIVE1MRWxlbWVudFtdO1xuXG4gIC8qKiBJbml0aWFsIHZhbHVlIGZvciB0aGUgZWxlbWVudCdzIGBzY3JvbGwtc25hcC10eXBlYCBzdHlsZS4gKi9cbiAgcHJpdmF0ZSBfaW5pdGlhbFNjcm9sbFNuYXA6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihcbiAgICBlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiB8IEhUTUxFbGVtZW50LFxuICAgIHByaXZhdGUgX2RyYWdEcm9wUmVnaXN0cnk6IERyYWdEcm9wUmVnaXN0cnk8RHJhZ1JlZiwgRHJvcExpc3RSZWY+LFxuICAgIF9kb2N1bWVudDogYW55LFxuICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgIHByaXZhdGUgX3ZpZXdwb3J0UnVsZXI6IFZpZXdwb3J0UnVsZXIpIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnQpO1xuICAgIHRoaXMuX2RvY3VtZW50ID0gX2RvY3VtZW50O1xuICAgIHRoaXMud2l0aFNjcm9sbGFibGVQYXJlbnRzKFt0aGlzLmVsZW1lbnRdKTtcbiAgICBfZHJhZ0Ryb3BSZWdpc3RyeS5yZWdpc3RlckRyb3BDb250YWluZXIodGhpcyk7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zID0gbmV3IFBhcmVudFBvc2l0aW9uVHJhY2tlcihfZG9jdW1lbnQsIF92aWV3cG9ydFJ1bGVyKTtcbiAgfVxuXG4gIC8qKiBSZW1vdmVzIHRoZSBkcm9wIGxpc3QgZnVuY3Rpb25hbGl0eSBmcm9tIHRoZSBET00gZWxlbWVudC4gKi9cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLl9zdG9wU2Nyb2xsaW5nKCk7XG4gICAgdGhpcy5fc3RvcFNjcm9sbFRpbWVycy5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5iZWZvcmVTdGFydGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5lbnRlcmVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5leGl0ZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmRyb3BwZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLnNvcnRlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX2FjdGl2ZVNpYmxpbmdzLmNsZWFyKCk7XG4gICAgdGhpcy5fc2Nyb2xsTm9kZSA9IG51bGwhO1xuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5jbGVhcigpO1xuICAgIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkucmVtb3ZlRHJvcENvbnRhaW5lcih0aGlzKTtcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIGFuIGl0ZW0gZnJvbSB0aGlzIGxpc3QgaXMgY3VycmVudGx5IGJlaW5nIGRyYWdnZWQuICovXG4gIGlzRHJhZ2dpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lzRHJhZ2dpbmc7XG4gIH1cblxuICAvKiogU3RhcnRzIGRyYWdnaW5nIGFuIGl0ZW0uICovXG4gIHN0YXJ0KCk6IHZvaWQge1xuICAgIGNvbnN0IHN0eWxlcyA9IGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KS5zdHlsZSBhcyBEcmFnQ1NTU3R5bGVEZWNsYXJhdGlvbjtcbiAgICB0aGlzLmJlZm9yZVN0YXJ0ZWQubmV4dCgpO1xuICAgIHRoaXMuX2lzRHJhZ2dpbmcgPSB0cnVlO1xuXG4gICAgLy8gV2UgbmVlZCB0byBkaXNhYmxlIHNjcm9sbCBzbmFwcGluZyB3aGlsZSB0aGUgdXNlciBpcyBkcmFnZ2luZywgYmVjYXVzZSBpdCBicmVha3MgYXV0b21hdGljXG4gICAgLy8gc2Nyb2xsaW5nLiBUaGUgYnJvd3NlciBzZWVtcyB0byByb3VuZCB0aGUgdmFsdWUgYmFzZWQgb24gdGhlIHNuYXBwaW5nIHBvaW50cyB3aGljaCBtZWFuc1xuICAgIC8vIHRoYXQgd2UgY2FuJ3QgaW5jcmVtZW50L2RlY3JlbWVudCB0aGUgc2Nyb2xsIHBvc2l0aW9uLlxuICAgIHRoaXMuX2luaXRpYWxTY3JvbGxTbmFwID0gc3R5bGVzLm1zU2Nyb2xsU25hcFR5cGUgfHwgc3R5bGVzLnNjcm9sbFNuYXBUeXBlIHx8ICcnO1xuICAgIHN0eWxlcy5zY3JvbGxTbmFwVHlwZSA9IHN0eWxlcy5tc1Njcm9sbFNuYXBUeXBlID0gJ25vbmUnO1xuICAgIHRoaXMuX2NhY2hlSXRlbXMoKTtcbiAgICB0aGlzLl9zaWJsaW5ncy5mb3JFYWNoKHNpYmxpbmcgPT4gc2libGluZy5fc3RhcnRSZWNlaXZpbmcodGhpcykpO1xuICAgIHRoaXMuX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fbGlzdGVuVG9TY3JvbGxFdmVudHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbWl0cyBhbiBldmVudCB0byBpbmRpY2F0ZSB0aGF0IHRoZSB1c2VyIG1vdmVkIGFuIGl0ZW0gaW50byB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRoYXQgd2FzIG1vdmVkIGludG8gdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKiBAcGFyYW0gaW5kZXggSW5kZXggYXQgd2hpY2ggdGhlIGl0ZW0gZW50ZXJlZC4gSWYgb21pdHRlZCwgdGhlIGNvbnRhaW5lciB3aWxsIHRyeSB0byBmaWd1cmUgaXRcbiAgICogICBvdXQgYXV0b21hdGljYWxseS5cbiAgICovXG4gIGVudGVyKGl0ZW06IERyYWdSZWYsIHBvaW50ZXJYOiBudW1iZXIsIHBvaW50ZXJZOiBudW1iZXIsIGluZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy5zdGFydCgpO1xuXG4gICAgLy8gSWYgc29ydGluZyBpcyBkaXNhYmxlZCwgd2Ugd2FudCB0aGUgaXRlbSB0byByZXR1cm4gdG8gaXRzIHN0YXJ0aW5nXG4gICAgLy8gcG9zaXRpb24gaWYgdGhlIHVzZXIgaXMgcmV0dXJuaW5nIGl0IHRvIGl0cyBpbml0aWFsIGNvbnRhaW5lci5cbiAgICBsZXQgbmV3SW5kZXg6IG51bWJlcjtcblxuICAgIGlmIChpbmRleCA9PSBudWxsKSB7XG4gICAgICBuZXdJbmRleCA9IHRoaXMuc29ydGluZ0Rpc2FibGVkID8gdGhpcy5fZHJhZ2dhYmxlcy5pbmRleE9mKGl0ZW0pIDogLTE7XG5cbiAgICAgIGlmIChuZXdJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgLy8gV2UgdXNlIHRoZSBjb29yZGluYXRlcyBvZiB3aGVyZSB0aGUgaXRlbSBlbnRlcmVkIHRoZSBkcm9wXG4gICAgICAgIC8vIHpvbmUgdG8gZmlndXJlIG91dCBhdCB3aGljaCBpbmRleCBpdCBzaG91bGQgYmUgaW5zZXJ0ZWQuXG4gICAgICAgIG5ld0luZGV4ID0gdGhpcy5fZ2V0SXRlbUluZGV4RnJvbVBvaW50ZXJQb3NpdGlvbihpdGVtLCBwb2ludGVyWCwgcG9pbnRlclkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBuZXdJbmRleCA9IGluZGV4O1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGl2ZURyYWdnYWJsZXMgPSB0aGlzLl9hY3RpdmVEcmFnZ2FibGVzO1xuICAgIGNvbnN0IGN1cnJlbnRJbmRleCA9IGFjdGl2ZURyYWdnYWJsZXMuaW5kZXhPZihpdGVtKTtcbiAgICBjb25zdCBwbGFjZWhvbGRlciA9IGl0ZW0uZ2V0UGxhY2Vob2xkZXJFbGVtZW50KCk7XG4gICAgbGV0IG5ld1Bvc2l0aW9uUmVmZXJlbmNlOiBEcmFnUmVmIHwgdW5kZWZpbmVkID0gYWN0aXZlRHJhZ2dhYmxlc1tuZXdJbmRleF07XG5cbiAgICAvLyBJZiB0aGUgaXRlbSBhdCB0aGUgbmV3IHBvc2l0aW9uIGlzIHRoZSBzYW1lIGFzIHRoZSBpdGVtIHRoYXQgaXMgYmVpbmcgZHJhZ2dlZCxcbiAgICAvLyBpdCBtZWFucyB0aGF0IHdlJ3JlIHRyeWluZyB0byByZXN0b3JlIHRoZSBpdGVtIHRvIGl0cyBpbml0aWFsIHBvc2l0aW9uLiBJbiB0aGlzXG4gICAgLy8gY2FzZSB3ZSBzaG91bGQgdXNlIHRoZSBuZXh0IGl0ZW0gZnJvbSB0aGUgbGlzdCBhcyB0aGUgcmVmZXJlbmNlLlxuICAgIGlmIChuZXdQb3NpdGlvblJlZmVyZW5jZSA9PT0gaXRlbSkge1xuICAgICAgbmV3UG9zaXRpb25SZWZlcmVuY2UgPSBhY3RpdmVEcmFnZ2FibGVzW25ld0luZGV4ICsgMV07XG4gICAgfVxuXG4gICAgLy8gU2luY2UgdGhlIGl0ZW0gbWF5IGJlIGluIHRoZSBgYWN0aXZlRHJhZ2dhYmxlc2AgYWxyZWFkeSAoZS5nLiBpZiB0aGUgdXNlciBkcmFnZ2VkIGl0XG4gICAgLy8gaW50byBhbm90aGVyIGNvbnRhaW5lciBhbmQgYmFjayBhZ2FpbiksIHdlIGhhdmUgdG8gZW5zdXJlIHRoYXQgaXQgaXNuJ3QgZHVwbGljYXRlZC5cbiAgICBpZiAoY3VycmVudEluZGV4ID4gLTEpIHtcbiAgICAgIGFjdGl2ZURyYWdnYWJsZXMuc3BsaWNlKGN1cnJlbnRJbmRleCwgMSk7XG4gICAgfVxuXG4gICAgLy8gRG9uJ3QgdXNlIGl0ZW1zIHRoYXQgYXJlIGJlaW5nIGRyYWdnZWQgYXMgYSByZWZlcmVuY2UsIGJlY2F1c2VcbiAgICAvLyB0aGVpciBlbGVtZW50IGhhcyBiZWVuIG1vdmVkIGRvd24gdG8gdGhlIGJvdHRvbSBvZiB0aGUgYm9keS5cbiAgICBpZiAobmV3UG9zaXRpb25SZWZlcmVuY2UgJiYgIXRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuaXNEcmFnZ2luZyhuZXdQb3NpdGlvblJlZmVyZW5jZSkpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBuZXdQb3NpdGlvblJlZmVyZW5jZS5nZXRSb290RWxlbWVudCgpO1xuICAgICAgZWxlbWVudC5wYXJlbnRFbGVtZW50IS5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXIsIGVsZW1lbnQpO1xuICAgICAgYWN0aXZlRHJhZ2dhYmxlcy5zcGxpY2UobmV3SW5kZXgsIDAsIGl0ZW0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpO1xuICAgICAgaWYgKHRoaXMuX3Nob3VsZEVudGVyQXNGaXJzdENoaWxkKHBvaW50ZXJYLCBwb2ludGVyWSkpIHtcbiAgICAgICAgZWxlbWVudC5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXIsIGFjdGl2ZURyYWdnYWJsZXNbMF0uZ2V0Um9vdEVsZW1lbnQoKSk7XG4gICAgICAgIGFjdGl2ZURyYWdnYWJsZXMudW5zaGlmdChpdGVtKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQocGxhY2Vob2xkZXIpO1xuICAgICAgICBhY3RpdmVEcmFnZ2FibGVzLnB1c2goaXRlbSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVGhlIHRyYW5zZm9ybSBuZWVkcyB0byBiZSBjbGVhcmVkIHNvIGl0IGRvZXNuJ3QgdGhyb3cgb2ZmIHRoZSBtZWFzdXJlbWVudHMuXG4gICAgcGxhY2Vob2xkZXIuc3R5bGUudHJhbnNmb3JtID0gJyc7XG5cbiAgICAvLyBOb3RlIHRoYXQgdGhlIHBvc2l0aW9ucyB3ZXJlIGFscmVhZHkgY2FjaGVkIHdoZW4gd2UgY2FsbGVkIGBzdGFydGAgYWJvdmUsXG4gICAgLy8gYnV0IHdlIG5lZWQgdG8gcmVmcmVzaCB0aGVtIHNpbmNlIHRoZSBhbW91bnQgb2YgaXRlbXMgaGFzIGNoYW5nZWQgYW5kIGFsc28gcGFyZW50IHJlY3RzLlxuICAgIHRoaXMuX2NhY2hlSXRlbVBvc2l0aW9ucygpO1xuICAgIHRoaXMuX2NhY2hlUGFyZW50UG9zaXRpb25zKCk7XG5cbiAgICB0aGlzLmVudGVyZWQubmV4dCh7aXRlbSwgY29udGFpbmVyOiB0aGlzLCBjdXJyZW50SW5kZXg6IHRoaXMuZ2V0SXRlbUluZGV4KGl0ZW0pfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhbiBpdGVtIGZyb20gdGhlIGNvbnRhaW5lciBhZnRlciBpdCB3YXMgZHJhZ2dlZCBpbnRvIGFub3RoZXIgY29udGFpbmVyIGJ5IHRoZSB1c2VyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRoYXQgd2FzIGRyYWdnZWQgb3V0LlxuICAgKi9cbiAgZXhpdChpdGVtOiBEcmFnUmVmKTogdm9pZCB7XG4gICAgdGhpcy5fcmVzZXQoKTtcbiAgICB0aGlzLmV4aXRlZC5uZXh0KHtpdGVtLCBjb250YWluZXI6IHRoaXN9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEcm9wcyBhbiBpdGVtIGludG8gdGhpcyBjb250YWluZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gYmVpbmcgZHJvcHBlZCBpbnRvIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSBjdXJyZW50SW5kZXggSW5kZXggYXQgd2hpY2ggdGhlIGl0ZW0gc2hvdWxkIGJlIGluc2VydGVkLlxuICAgKiBAcGFyYW0gcHJldmlvdXNDb250YWluZXIgQ29udGFpbmVyIGZyb20gd2hpY2ggdGhlIGl0ZW0gZ290IGRyYWdnZWQgaW4uXG4gICAqIEBwYXJhbSBpc1BvaW50ZXJPdmVyQ29udGFpbmVyIFdoZXRoZXIgdGhlIHVzZXIncyBwb2ludGVyIHdhcyBvdmVyIHRoZVxuICAgKiAgICBjb250YWluZXIgd2hlbiB0aGUgaXRlbSB3YXMgZHJvcHBlZC5cbiAgICogQHBhcmFtIGRpc3RhbmNlIERpc3RhbmNlIHRoZSB1c2VyIGhhcyBkcmFnZ2VkIHNpbmNlIHRoZSBzdGFydCBvZiB0aGUgZHJhZ2dpbmcgc2VxdWVuY2UuXG4gICAqIEBwYXJhbSBwcmV2aW91c0luZGV4IEluZGV4IG9mIHRoZSBpdGVtIHdoZW4gZHJhZ2dpbmcgc3RhcnRlZC5cbiAgICpcbiAgICogQGJyZWFraW5nLWNoYW5nZSAxMS4wLjAgYHByZXZpb3VzSW5kZXhgIHBhcmFtZXRlciB0byBiZWNvbWUgcmVxdWlyZWQuXG4gICAqL1xuICBkcm9wKGl0ZW06IERyYWdSZWYsIGN1cnJlbnRJbmRleDogbnVtYmVyLCBwcmV2aW91c0NvbnRhaW5lcjogRHJvcExpc3RSZWYsXG4gICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcjogYm9vbGVhbiwgZGlzdGFuY2U6IFBvaW50LCBwcmV2aW91c0luZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy5fcmVzZXQoKTtcblxuICAgIC8vIEBicmVha2luZy1jaGFuZ2UgMTEuMC4wIFJlbW92ZSB0aGlzIGZhbGxiYWNrIGxvZ2ljIG9uY2UgYHByZXZpb3VzSW5kZXhgIGlzIGEgcmVxdWlyZWQgcGFyYW0uXG4gICAgaWYgKHByZXZpb3VzSW5kZXggPT0gbnVsbCkge1xuICAgICAgcHJldmlvdXNJbmRleCA9IHByZXZpb3VzQ29udGFpbmVyLmdldEl0ZW1JbmRleChpdGVtKTtcbiAgICB9XG5cbiAgICB0aGlzLmRyb3BwZWQubmV4dCh7aXRlbSxcbiAgICAgIGN1cnJlbnRJbmRleCxcbiAgICAgIHByZXZpb3VzSW5kZXgsXG4gICAgICBjb250YWluZXI6IHRoaXMsXG4gICAgICBwcmV2aW91c0NvbnRhaW5lcixcbiAgICAgIGlzUG9pbnRlck92ZXJDb250YWluZXIsXG4gICAgICBkaXN0YW5jZVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGRyYWdnYWJsZSBpdGVtcyB0aGF0IGFyZSBhIHBhcnQgb2YgdGhpcyBsaXN0LlxuICAgKiBAcGFyYW0gaXRlbXMgSXRlbXMgdGhhdCBhcmUgYSBwYXJ0IG9mIHRoaXMgbGlzdC5cbiAgICovXG4gIHdpdGhJdGVtcyhpdGVtczogRHJhZ1JlZltdKTogdGhpcyB7XG4gICAgY29uc3QgcHJldmlvdXNJdGVtcyA9IHRoaXMuX2RyYWdnYWJsZXM7XG4gICAgdGhpcy5fZHJhZ2dhYmxlcyA9IGl0ZW1zO1xuICAgIGl0ZW1zLmZvckVhY2goaXRlbSA9PiBpdGVtLl93aXRoRHJvcENvbnRhaW5lcih0aGlzKSk7XG5cbiAgICBpZiAodGhpcy5pc0RyYWdnaW5nKCkpIHtcbiAgICAgIGNvbnN0IGRyYWdnZWRJdGVtcyA9IHByZXZpb3VzSXRlbXMuZmlsdGVyKGl0ZW0gPT4gaXRlbS5pc0RyYWdnaW5nKCkpO1xuXG4gICAgICAvLyBJZiBhbGwgb2YgdGhlIGl0ZW1zIGJlaW5nIGRyYWdnZWQgd2VyZSByZW1vdmVkXG4gICAgICAvLyBmcm9tIHRoZSBsaXN0LCBhYm9ydCB0aGUgY3VycmVudCBkcmFnIHNlcXVlbmNlLlxuICAgICAgaWYgKGRyYWdnZWRJdGVtcy5ldmVyeShpdGVtID0+IGl0ZW1zLmluZGV4T2YoaXRlbSkgPT09IC0xKSkge1xuICAgICAgICB0aGlzLl9yZXNldCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fY2FjaGVJdGVtcygpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFNldHMgdGhlIGxheW91dCBkaXJlY3Rpb24gb2YgdGhlIGRyb3AgbGlzdC4gKi9cbiAgd2l0aERpcmVjdGlvbihkaXJlY3Rpb246IERpcmVjdGlvbik6IHRoaXMge1xuICAgIHRoaXMuX2RpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjb250YWluZXJzIHRoYXQgYXJlIGNvbm5lY3RlZCB0byB0aGlzIG9uZS4gV2hlbiB0d28gb3IgbW9yZSBjb250YWluZXJzIGFyZVxuICAgKiBjb25uZWN0ZWQsIHRoZSB1c2VyIHdpbGwgYmUgYWxsb3dlZCB0byB0cmFuc2ZlciBpdGVtcyBiZXR3ZWVuIHRoZW0uXG4gICAqIEBwYXJhbSBjb25uZWN0ZWRUbyBPdGhlciBjb250YWluZXJzIHRoYXQgdGhlIGN1cnJlbnQgY29udGFpbmVycyBzaG91bGQgYmUgY29ubmVjdGVkIHRvLlxuICAgKi9cbiAgY29ubmVjdGVkVG8oY29ubmVjdGVkVG86IERyb3BMaXN0UmVmW10pOiB0aGlzIHtcbiAgICB0aGlzLl9zaWJsaW5ncyA9IGNvbm5lY3RlZFRvLnNsaWNlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgb3JpZW50YXRpb24gb2YgdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIG9yaWVudGF0aW9uIE5ldyBvcmllbnRhdGlvbiBmb3IgdGhlIGNvbnRhaW5lci5cbiAgICovXG4gIHdpdGhPcmllbnRhdGlvbihvcmllbnRhdGlvbjogJ3ZlcnRpY2FsJyB8ICdob3Jpem9udGFsJyk6IHRoaXMge1xuICAgIHRoaXMuX29yaWVudGF0aW9uID0gb3JpZW50YXRpb247XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB3aGljaCBwYXJlbnQgZWxlbWVudHMgYXJlIGNhbiBiZSBzY3JvbGxlZCB3aGlsZSB0aGUgdXNlciBpcyBkcmFnZ2luZy5cbiAgICogQHBhcmFtIGVsZW1lbnRzIEVsZW1lbnRzIHRoYXQgY2FuIGJlIHNjcm9sbGVkLlxuICAgKi9cbiAgd2l0aFNjcm9sbGFibGVQYXJlbnRzKGVsZW1lbnRzOiBIVE1MRWxlbWVudFtdKTogdGhpcyB7XG4gICAgY29uc3QgZWxlbWVudCA9IGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KTtcblxuICAgIC8vIFdlIGFsd2F5cyBhbGxvdyB0aGUgY3VycmVudCBlbGVtZW50IHRvIGJlIHNjcm9sbGFibGVcbiAgICAvLyBzbyB3ZSBuZWVkIHRvIGVuc3VyZSB0aGF0IGl0J3MgaW4gdGhlIGFycmF5LlxuICAgIHRoaXMuX3Njcm9sbGFibGVFbGVtZW50cyA9XG4gICAgICAgIGVsZW1lbnRzLmluZGV4T2YoZWxlbWVudCkgPT09IC0xID8gW2VsZW1lbnQsIC4uLmVsZW1lbnRzXSA6IGVsZW1lbnRzLnNsaWNlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgc2Nyb2xsYWJsZSBwYXJlbnRzIHRoYXQgYXJlIHJlZ2lzdGVyZWQgd2l0aCB0aGlzIGRyb3AgY29udGFpbmVyLiAqL1xuICBnZXRTY3JvbGxhYmxlUGFyZW50cygpOiBSZWFkb25seUFycmF5PEhUTUxFbGVtZW50PiB7XG4gICAgcmV0dXJuIHRoaXMuX3Njcm9sbGFibGVFbGVtZW50cztcbiAgfVxuXG4gIC8qKlxuICAgKiBGaWd1cmVzIG91dCB0aGUgaW5kZXggb2YgYW4gaXRlbSBpbiB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHdob3NlIGluZGV4IHNob3VsZCBiZSBkZXRlcm1pbmVkLlxuICAgKi9cbiAgZ2V0SXRlbUluZGV4KGl0ZW06IERyYWdSZWYpOiBudW1iZXIge1xuICAgIGlmICghdGhpcy5faXNEcmFnZ2luZykge1xuICAgICAgcmV0dXJuIHRoaXMuX2RyYWdnYWJsZXMuaW5kZXhPZihpdGVtKTtcbiAgICB9XG5cbiAgICAvLyBJdGVtcyBhcmUgc29ydGVkIGFsd2F5cyBieSB0b3AvbGVmdCBpbiB0aGUgY2FjaGUsIGhvd2V2ZXIgdGhleSBmbG93IGRpZmZlcmVudGx5IGluIFJUTC5cbiAgICAvLyBUaGUgcmVzdCBvZiB0aGUgbG9naWMgc3RpbGwgc3RhbmRzIG5vIG1hdHRlciB3aGF0IG9yaWVudGF0aW9uIHdlJ3JlIGluLCBob3dldmVyXG4gICAgLy8gd2UgbmVlZCB0byBpbnZlcnQgdGhlIGFycmF5IHdoZW4gZGV0ZXJtaW5pbmcgdGhlIGluZGV4LlxuICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5fb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJyAmJiB0aGlzLl9kaXJlY3Rpb24gPT09ICdydGwnID9cbiAgICAgICAgdGhpcy5faXRlbVBvc2l0aW9ucy5zbGljZSgpLnJldmVyc2UoKSA6IHRoaXMuX2l0ZW1Qb3NpdGlvbnM7XG5cbiAgICByZXR1cm4gZmluZEluZGV4KGl0ZW1zLCBjdXJyZW50SXRlbSA9PiBjdXJyZW50SXRlbS5kcmFnID09PSBpdGVtKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBsaXN0IGlzIGFibGUgdG8gcmVjZWl2ZSB0aGUgaXRlbSB0aGF0XG4gICAqIGlzIGN1cnJlbnRseSBiZWluZyBkcmFnZ2VkIGluc2lkZSBhIGNvbm5lY3RlZCBkcm9wIGxpc3QuXG4gICAqL1xuICBpc1JlY2VpdmluZygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fYWN0aXZlU2libGluZ3Muc2l6ZSA+IDA7XG4gIH1cblxuICAvKipcbiAgICogU29ydHMgYW4gaXRlbSBpbnNpZGUgdGhlIGNvbnRhaW5lciBiYXNlZCBvbiBpdHMgcG9zaXRpb24uXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdG8gYmUgc29ydGVkLlxuICAgKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHBvaW50ZXJZIFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyRGVsdGEgRGlyZWN0aW9uIGluIHdoaWNoIHRoZSBwb2ludGVyIGlzIG1vdmluZyBhbG9uZyBlYWNoIGF4aXMuXG4gICAqL1xuICBfc29ydEl0ZW0oaXRlbTogRHJhZ1JlZiwgcG9pbnRlclg6IG51bWJlciwgcG9pbnRlclk6IG51bWJlcixcbiAgICAgICAgICAgIHBvaW50ZXJEZWx0YToge3g6IG51bWJlciwgeTogbnVtYmVyfSk6IHZvaWQge1xuICAgIC8vIERvbid0IHNvcnQgdGhlIGl0ZW0gaWYgc29ydGluZyBpcyBkaXNhYmxlZCBvciBpdCdzIG91dCBvZiByYW5nZS5cbiAgICBpZiAodGhpcy5zb3J0aW5nRGlzYWJsZWQgfHxcbiAgICAgICAgIWlzUG9pbnRlck5lYXJDbGllbnRSZWN0KHRoaXMuX2NsaWVudFJlY3QsIERST1BfUFJPWElNSVRZX1RIUkVTSE9MRCwgcG9pbnRlclgsIHBvaW50ZXJZKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNpYmxpbmdzID0gdGhpcy5faXRlbVBvc2l0aW9ucztcbiAgICBjb25zdCBuZXdJbmRleCA9IHRoaXMuX2dldEl0ZW1JbmRleEZyb21Qb2ludGVyUG9zaXRpb24oaXRlbSwgcG9pbnRlclgsIHBvaW50ZXJZLCBwb2ludGVyRGVsdGEpO1xuXG4gICAgaWYgKG5ld0luZGV4ID09PSAtMSAmJiBzaWJsaW5ncy5sZW5ndGggPiAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gdGhpcy5fb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJztcbiAgICBjb25zdCBjdXJyZW50SW5kZXggPSBmaW5kSW5kZXgoc2libGluZ3MsIGN1cnJlbnRJdGVtID0+IGN1cnJlbnRJdGVtLmRyYWcgPT09IGl0ZW0pO1xuICAgIGNvbnN0IHNpYmxpbmdBdE5ld1Bvc2l0aW9uID0gc2libGluZ3NbbmV3SW5kZXhdO1xuICAgIGNvbnN0IGN1cnJlbnRQb3NpdGlvbiA9IHNpYmxpbmdzW2N1cnJlbnRJbmRleF0uY2xpZW50UmVjdDtcbiAgICBjb25zdCBuZXdQb3NpdGlvbiA9IHNpYmxpbmdBdE5ld1Bvc2l0aW9uLmNsaWVudFJlY3Q7XG4gICAgY29uc3QgZGVsdGEgPSBjdXJyZW50SW5kZXggPiBuZXdJbmRleCA/IDEgOiAtMTtcblxuICAgIHRoaXMuX3ByZXZpb3VzU3dhcC5kcmFnID0gc2libGluZ0F0TmV3UG9zaXRpb24uZHJhZztcbiAgICB0aGlzLl9wcmV2aW91c1N3YXAuZGVsdGEgPSBpc0hvcml6b250YWwgPyBwb2ludGVyRGVsdGEueCA6IHBvaW50ZXJEZWx0YS55O1xuXG4gICAgLy8gSG93IG1hbnkgcGl4ZWxzIHRoZSBpdGVtJ3MgcGxhY2Vob2xkZXIgc2hvdWxkIGJlIG9mZnNldC5cbiAgICBjb25zdCBpdGVtT2Zmc2V0ID0gdGhpcy5fZ2V0SXRlbU9mZnNldFB4KGN1cnJlbnRQb3NpdGlvbiwgbmV3UG9zaXRpb24sIGRlbHRhKTtcblxuICAgIC8vIEhvdyBtYW55IHBpeGVscyBhbGwgdGhlIG90aGVyIGl0ZW1zIHNob3VsZCBiZSBvZmZzZXQuXG4gICAgY29uc3Qgc2libGluZ09mZnNldCA9IHRoaXMuX2dldFNpYmxpbmdPZmZzZXRQeChjdXJyZW50SW5kZXgsIHNpYmxpbmdzLCBkZWx0YSk7XG5cbiAgICAvLyBTYXZlIHRoZSBwcmV2aW91cyBvcmRlciBvZiB0aGUgaXRlbXMgYmVmb3JlIG1vdmluZyB0aGUgaXRlbSB0byBpdHMgbmV3IGluZGV4LlxuICAgIC8vIFdlIHVzZSB0aGlzIHRvIGNoZWNrIHdoZXRoZXIgYW4gaXRlbSBoYXMgYmVlbiBtb3ZlZCBhcyBhIHJlc3VsdCBvZiB0aGUgc29ydGluZy5cbiAgICBjb25zdCBvbGRPcmRlciA9IHNpYmxpbmdzLnNsaWNlKCk7XG5cbiAgICAvLyBTaHVmZmxlIHRoZSBhcnJheSBpbiBwbGFjZS5cbiAgICBtb3ZlSXRlbUluQXJyYXkoc2libGluZ3MsIGN1cnJlbnRJbmRleCwgbmV3SW5kZXgpO1xuXG4gICAgdGhpcy5zb3J0ZWQubmV4dCh7XG4gICAgICBwcmV2aW91c0luZGV4OiBjdXJyZW50SW5kZXgsXG4gICAgICBjdXJyZW50SW5kZXg6IG5ld0luZGV4LFxuICAgICAgY29udGFpbmVyOiB0aGlzLFxuICAgICAgaXRlbVxuICAgIH0pO1xuXG4gICAgc2libGluZ3MuZm9yRWFjaCgoc2libGluZywgaW5kZXgpID0+IHtcbiAgICAgIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIHRoZSBwb3NpdGlvbiBoYXNuJ3QgY2hhbmdlZC5cbiAgICAgIGlmIChvbGRPcmRlcltpbmRleF0gPT09IHNpYmxpbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpc0RyYWdnZWRJdGVtID0gc2libGluZy5kcmFnID09PSBpdGVtO1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gaXNEcmFnZ2VkSXRlbSA/IGl0ZW1PZmZzZXQgOiBzaWJsaW5nT2Zmc2V0O1xuICAgICAgY29uc3QgZWxlbWVudFRvT2Zmc2V0ID0gaXNEcmFnZ2VkSXRlbSA/IGl0ZW0uZ2V0UGxhY2Vob2xkZXJFbGVtZW50KCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpYmxpbmcuZHJhZy5nZXRSb290RWxlbWVudCgpO1xuXG4gICAgICAvLyBVcGRhdGUgdGhlIG9mZnNldCB0byByZWZsZWN0IHRoZSBuZXcgcG9zaXRpb24uXG4gICAgICBzaWJsaW5nLm9mZnNldCArPSBvZmZzZXQ7XG5cbiAgICAgIC8vIFNpbmNlIHdlJ3JlIG1vdmluZyB0aGUgaXRlbXMgd2l0aCBhIGB0cmFuc2Zvcm1gLCB3ZSBuZWVkIHRvIGFkanVzdCB0aGVpciBjYWNoZWRcbiAgICAgIC8vIGNsaWVudCByZWN0cyB0byByZWZsZWN0IHRoZWlyIG5ldyBwb3NpdGlvbiwgYXMgd2VsbCBhcyBzd2FwIHRoZWlyIHBvc2l0aW9ucyBpbiB0aGUgY2FjaGUuXG4gICAgICAvLyBOb3RlIHRoYXQgd2Ugc2hvdWxkbid0IHVzZSBgZ2V0Qm91bmRpbmdDbGllbnRSZWN0YCBoZXJlIHRvIHVwZGF0ZSB0aGUgY2FjaGUsIGJlY2F1c2UgdGhlXG4gICAgICAvLyBlbGVtZW50cyBtYXkgYmUgbWlkLWFuaW1hdGlvbiB3aGljaCB3aWxsIGdpdmUgdXMgYSB3cm9uZyByZXN1bHQuXG4gICAgICBpZiAoaXNIb3Jpem9udGFsKSB7XG4gICAgICAgIC8vIFJvdW5kIHRoZSB0cmFuc2Zvcm1zIHNpbmNlIHNvbWUgYnJvd3NlcnMgd2lsbFxuICAgICAgICAvLyBibHVyIHRoZSBlbGVtZW50cywgZm9yIHN1Yi1waXhlbCB0cmFuc2Zvcm1zLlxuICAgICAgICBlbGVtZW50VG9PZmZzZXQuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZTNkKCR7TWF0aC5yb3VuZChzaWJsaW5nLm9mZnNldCl9cHgsIDAsIDApYDtcbiAgICAgICAgYWRqdXN0Q2xpZW50UmVjdChzaWJsaW5nLmNsaWVudFJlY3QsIDAsIG9mZnNldCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbGVtZW50VG9PZmZzZXQuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZTNkKDAsICR7TWF0aC5yb3VuZChzaWJsaW5nLm9mZnNldCl9cHgsIDApYDtcbiAgICAgICAgYWRqdXN0Q2xpZW50UmVjdChzaWJsaW5nLmNsaWVudFJlY3QsIG9mZnNldCwgMCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIHVzZXIncyBwb2ludGVyIGlzIGNsb3NlIHRvIHRoZSBlZGdlcyBvZiBlaXRoZXIgdGhlXG4gICAqIHZpZXdwb3J0IG9yIHRoZSBkcm9wIGxpc3QgYW5kIHN0YXJ0cyB0aGUgYXV0by1zY3JvbGwgc2VxdWVuY2UuXG4gICAqIEBwYXJhbSBwb2ludGVyWCBVc2VyJ3MgcG9pbnRlciBwb3NpdGlvbiBhbG9uZyB0aGUgeCBheGlzLlxuICAgKiBAcGFyYW0gcG9pbnRlclkgVXNlcidzIHBvaW50ZXIgcG9zaXRpb24gYWxvbmcgdGhlIHkgYXhpcy5cbiAgICovXG4gIF9zdGFydFNjcm9sbGluZ0lmTmVjZXNzYXJ5KHBvaW50ZXJYOiBudW1iZXIsIHBvaW50ZXJZOiBudW1iZXIpIHtcbiAgICBpZiAodGhpcy5hdXRvU2Nyb2xsRGlzYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgc2Nyb2xsTm9kZTogSFRNTEVsZW1lbnQgfCBXaW5kb3cgfCB1bmRlZmluZWQ7XG4gICAgbGV0IHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLk5PTkU7XG4gICAgbGV0IGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5OT05FO1xuXG4gICAgLy8gQ2hlY2sgd2hldGhlciB3ZSBzaG91bGQgc3RhcnQgc2Nyb2xsaW5nIGFueSBvZiB0aGUgcGFyZW50IGNvbnRhaW5lcnMuXG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLnBvc2l0aW9ucy5mb3JFYWNoKChwb3NpdGlvbiwgZWxlbWVudCkgPT4ge1xuICAgICAgLy8gV2UgaGF2ZSBzcGVjaWFsIGhhbmRsaW5nIGZvciB0aGUgYGRvY3VtZW50YCBiZWxvdy4gQWxzbyB0aGlzIHdvdWxkIGJlXG4gICAgICAvLyBuaWNlciB3aXRoIGEgIGZvci4uLm9mIGxvb3AsIGJ1dCBpdCByZXF1aXJlcyBjaGFuZ2luZyBhIGNvbXBpbGVyIGZsYWcuXG4gICAgICBpZiAoZWxlbWVudCA9PT0gdGhpcy5fZG9jdW1lbnQgfHwgIXBvc2l0aW9uLmNsaWVudFJlY3QgfHwgc2Nyb2xsTm9kZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChpc1BvaW50ZXJOZWFyQ2xpZW50UmVjdChwb3NpdGlvbi5jbGllbnRSZWN0LCBEUk9QX1BST1hJTUlUWV9USFJFU0hPTEQsXG4gICAgICAgICAgcG9pbnRlclgsIHBvaW50ZXJZKSkge1xuICAgICAgICBbdmVydGljYWxTY3JvbGxEaXJlY3Rpb24sIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb25dID0gZ2V0RWxlbWVudFNjcm9sbERpcmVjdGlvbnMoXG4gICAgICAgICAgICBlbGVtZW50IGFzIEhUTUxFbGVtZW50LCBwb3NpdGlvbi5jbGllbnRSZWN0LCBwb2ludGVyWCwgcG9pbnRlclkpO1xuXG4gICAgICAgIGlmICh2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiB8fCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKSB7XG4gICAgICAgICAgc2Nyb2xsTm9kZSA9IGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIE90aGVyd2lzZSBjaGVjayBpZiB3ZSBjYW4gc3RhcnQgc2Nyb2xsaW5nIHRoZSB2aWV3cG9ydC5cbiAgICBpZiAoIXZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uICYmICFob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKSB7XG4gICAgICBjb25zdCB7d2lkdGgsIGhlaWdodH0gPSB0aGlzLl92aWV3cG9ydFJ1bGVyLmdldFZpZXdwb3J0U2l6ZSgpO1xuICAgICAgY29uc3QgY2xpZW50UmVjdCA9IHt3aWR0aCwgaGVpZ2h0LCB0b3A6IDAsIHJpZ2h0OiB3aWR0aCwgYm90dG9tOiBoZWlnaHQsIGxlZnQ6IDB9O1xuICAgICAgdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSBnZXRWZXJ0aWNhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0LCBwb2ludGVyWSk7XG4gICAgICBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gZ2V0SG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0LCBwb2ludGVyWCk7XG4gICAgICBzY3JvbGxOb2RlID0gd2luZG93O1xuICAgIH1cblxuICAgIGlmIChzY3JvbGxOb2RlICYmICh2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiAhPT0gdGhpcy5fdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gfHxcbiAgICAgICAgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiAhPT0gdGhpcy5faG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiB8fFxuICAgICAgICBzY3JvbGxOb2RlICE9PSB0aGlzLl9zY3JvbGxOb2RlKSkge1xuICAgICAgdGhpcy5fdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSB2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbjtcbiAgICAgIHRoaXMuX2hvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uO1xuICAgICAgdGhpcy5fc2Nyb2xsTm9kZSA9IHNjcm9sbE5vZGU7XG5cbiAgICAgIGlmICgodmVydGljYWxTY3JvbGxEaXJlY3Rpb24gfHwgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbikgJiYgc2Nyb2xsTm9kZSkge1xuICAgICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIodGhpcy5fc3RhcnRTY3JvbGxJbnRlcnZhbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9zdG9wU2Nyb2xsaW5nKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIFN0b3BzIGFueSBjdXJyZW50bHktcnVubmluZyBhdXRvLXNjcm9sbCBzZXF1ZW5jZXMuICovXG4gIF9zdG9wU2Nyb2xsaW5nKCkge1xuICAgIHRoaXMuX3N0b3BTY3JvbGxUaW1lcnMubmV4dCgpO1xuICB9XG5cbiAgLyoqIENhY2hlcyB0aGUgcG9zaXRpb25zIG9mIHRoZSBjb25maWd1cmVkIHNjcm9sbGFibGUgcGFyZW50cy4gKi9cbiAgcHJpdmF0ZSBfY2FjaGVQYXJlbnRQb3NpdGlvbnMoKSB7XG4gICAgY29uc3QgZWxlbWVudCA9IGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KTtcbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuY2FjaGUodGhpcy5fc2Nyb2xsYWJsZUVsZW1lbnRzKTtcblxuICAgIC8vIFRoZSBsaXN0IGVsZW1lbnQgaXMgYWx3YXlzIGluIHRoZSBgc2Nyb2xsYWJsZUVsZW1lbnRzYFxuICAgIC8vIHNvIHdlIGNhbiB0YWtlIGFkdmFudGFnZSBvZiB0aGUgY2FjaGVkIGBDbGllbnRSZWN0YC5cbiAgICB0aGlzLl9jbGllbnRSZWN0ID0gdGhpcy5fcGFyZW50UG9zaXRpb25zLnBvc2l0aW9ucy5nZXQoZWxlbWVudCkhLmNsaWVudFJlY3QhO1xuICB9XG5cbiAgLyoqIFJlZnJlc2hlcyB0aGUgcG9zaXRpb24gY2FjaGUgb2YgdGhlIGl0ZW1zIGFuZCBzaWJsaW5nIGNvbnRhaW5lcnMuICovXG4gIHByaXZhdGUgX2NhY2hlSXRlbVBvc2l0aW9ucygpIHtcbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuXG4gICAgdGhpcy5faXRlbVBvc2l0aW9ucyA9IHRoaXMuX2FjdGl2ZURyYWdnYWJsZXMubWFwKGRyYWcgPT4ge1xuICAgICAgY29uc3QgZWxlbWVudFRvTWVhc3VyZSA9IGRyYWcuZ2V0VmlzaWJsZUVsZW1lbnQoKTtcbiAgICAgIHJldHVybiB7ZHJhZywgb2Zmc2V0OiAwLCBjbGllbnRSZWN0OiBnZXRNdXRhYmxlQ2xpZW50UmVjdChlbGVtZW50VG9NZWFzdXJlKX07XG4gICAgfSkuc29ydCgoYSwgYikgPT4ge1xuICAgICAgcmV0dXJuIGlzSG9yaXpvbnRhbCA/IGEuY2xpZW50UmVjdC5sZWZ0IC0gYi5jbGllbnRSZWN0LmxlZnQgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGEuY2xpZW50UmVjdC50b3AgLSBiLmNsaWVudFJlY3QudG9wO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIFJlc2V0cyB0aGUgY29udGFpbmVyIHRvIGl0cyBpbml0aWFsIHN0YXRlLiAqL1xuICBwcml2YXRlIF9yZXNldCgpIHtcbiAgICB0aGlzLl9pc0RyYWdnaW5nID0gZmFsc2U7XG5cbiAgICBjb25zdCBzdHlsZXMgPSBjb2VyY2VFbGVtZW50KHRoaXMuZWxlbWVudCkuc3R5bGUgYXMgRHJhZ0NTU1N0eWxlRGVjbGFyYXRpb247XG4gICAgc3R5bGVzLnNjcm9sbFNuYXBUeXBlID0gc3R5bGVzLm1zU2Nyb2xsU25hcFR5cGUgPSB0aGlzLl9pbml0aWFsU2Nyb2xsU25hcDtcblxuICAgIC8vIFRPRE8oY3Jpc2JldG8pOiBtYXkgaGF2ZSB0byB3YWl0IGZvciB0aGUgYW5pbWF0aW9ucyB0byBmaW5pc2guXG4gICAgdGhpcy5fYWN0aXZlRHJhZ2dhYmxlcy5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgY29uc3Qgcm9vdEVsZW1lbnQgPSBpdGVtLmdldFJvb3RFbGVtZW50KCk7XG5cbiAgICAgIGlmIChyb290RWxlbWVudCkge1xuICAgICAgICByb290RWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSAnJztcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLl9zaWJsaW5ncy5mb3JFYWNoKHNpYmxpbmcgPT4gc2libGluZy5fc3RvcFJlY2VpdmluZyh0aGlzKSk7XG4gICAgdGhpcy5fYWN0aXZlRHJhZ2dhYmxlcyA9IFtdO1xuICAgIHRoaXMuX2l0ZW1Qb3NpdGlvbnMgPSBbXTtcbiAgICB0aGlzLl9wcmV2aW91c1N3YXAuZHJhZyA9IG51bGw7XG4gICAgdGhpcy5fcHJldmlvdXNTd2FwLmRlbHRhID0gMDtcbiAgICB0aGlzLl9zdG9wU2Nyb2xsaW5nKCk7XG4gICAgdGhpcy5fdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBvZmZzZXQgaW4gcGl4ZWxzIGJ5IHdoaWNoIHRoZSBpdGVtcyB0aGF0IGFyZW4ndCBiZWluZyBkcmFnZ2VkIHNob3VsZCBiZSBtb3ZlZC5cbiAgICogQHBhcmFtIGN1cnJlbnRJbmRleCBJbmRleCBvZiB0aGUgaXRlbSBjdXJyZW50bHkgYmVpbmcgZHJhZ2dlZC5cbiAgICogQHBhcmFtIHNpYmxpbmdzIEFsbCBvZiB0aGUgaXRlbXMgaW4gdGhlIGxpc3QuXG4gICAqIEBwYXJhbSBkZWx0YSBEaXJlY3Rpb24gaW4gd2hpY2ggdGhlIHVzZXIgaXMgbW92aW5nLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0U2libGluZ09mZnNldFB4KGN1cnJlbnRJbmRleDogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2libGluZ3M6IENhY2hlZEl0ZW1Qb3NpdGlvbltdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsdGE6IDEgfCAtMSkge1xuXG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gdGhpcy5fb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJztcbiAgICBjb25zdCBjdXJyZW50UG9zaXRpb24gPSBzaWJsaW5nc1tjdXJyZW50SW5kZXhdLmNsaWVudFJlY3Q7XG4gICAgY29uc3QgaW1tZWRpYXRlU2libGluZyA9IHNpYmxpbmdzW2N1cnJlbnRJbmRleCArIGRlbHRhICogLTFdO1xuICAgIGxldCBzaWJsaW5nT2Zmc2V0ID0gY3VycmVudFBvc2l0aW9uW2lzSG9yaXpvbnRhbCA/ICd3aWR0aCcgOiAnaGVpZ2h0J10gKiBkZWx0YTtcblxuICAgIGlmIChpbW1lZGlhdGVTaWJsaW5nKSB7XG4gICAgICBjb25zdCBzdGFydCA9IGlzSG9yaXpvbnRhbCA/ICdsZWZ0JyA6ICd0b3AnO1xuICAgICAgY29uc3QgZW5kID0gaXNIb3Jpem9udGFsID8gJ3JpZ2h0JyA6ICdib3R0b20nO1xuXG4gICAgICAvLyBHZXQgdGhlIHNwYWNpbmcgYmV0d2VlbiB0aGUgc3RhcnQgb2YgdGhlIGN1cnJlbnQgaXRlbSBhbmQgdGhlIGVuZCBvZiB0aGUgb25lIGltbWVkaWF0ZWx5XG4gICAgICAvLyBhZnRlciBpdCBpbiB0aGUgZGlyZWN0aW9uIGluIHdoaWNoIHRoZSB1c2VyIGlzIGRyYWdnaW5nLCBvciB2aWNlIHZlcnNhLiBXZSBhZGQgaXQgdG8gdGhlXG4gICAgICAvLyBvZmZzZXQgaW4gb3JkZXIgdG8gcHVzaCB0aGUgZWxlbWVudCB0byB3aGVyZSBpdCB3aWxsIGJlIHdoZW4gaXQncyBpbmxpbmUgYW5kIGlzIGluZmx1ZW5jZWRcbiAgICAgIC8vIGJ5IHRoZSBgbWFyZ2luYCBvZiBpdHMgc2libGluZ3MuXG4gICAgICBpZiAoZGVsdGEgPT09IC0xKSB7XG4gICAgICAgIHNpYmxpbmdPZmZzZXQgLT0gaW1tZWRpYXRlU2libGluZy5jbGllbnRSZWN0W3N0YXJ0XSAtIGN1cnJlbnRQb3NpdGlvbltlbmRdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2libGluZ09mZnNldCArPSBjdXJyZW50UG9zaXRpb25bc3RhcnRdIC0gaW1tZWRpYXRlU2libGluZy5jbGllbnRSZWN0W2VuZF07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNpYmxpbmdPZmZzZXQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgb2Zmc2V0IGluIHBpeGVscyBieSB3aGljaCB0aGUgaXRlbSB0aGF0IGlzIGJlaW5nIGRyYWdnZWQgc2hvdWxkIGJlIG1vdmVkLlxuICAgKiBAcGFyYW0gY3VycmVudFBvc2l0aW9uIEN1cnJlbnQgcG9zaXRpb24gb2YgdGhlIGl0ZW0uXG4gICAqIEBwYXJhbSBuZXdQb3NpdGlvbiBQb3NpdGlvbiBvZiB0aGUgaXRlbSB3aGVyZSB0aGUgY3VycmVudCBpdGVtIHNob3VsZCBiZSBtb3ZlZC5cbiAgICogQHBhcmFtIGRlbHRhIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgdXNlciBpcyBtb3ZpbmcuXG4gICAqL1xuICBwcml2YXRlIF9nZXRJdGVtT2Zmc2V0UHgoY3VycmVudFBvc2l0aW9uOiBDbGllbnRSZWN0LCBuZXdQb3NpdGlvbjogQ2xpZW50UmVjdCwgZGVsdGE6IDEgfCAtMSkge1xuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCc7XG4gICAgbGV0IGl0ZW1PZmZzZXQgPSBpc0hvcml6b250YWwgPyBuZXdQb3NpdGlvbi5sZWZ0IC0gY3VycmVudFBvc2l0aW9uLmxlZnQgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3UG9zaXRpb24udG9wIC0gY3VycmVudFBvc2l0aW9uLnRvcDtcblxuICAgIC8vIEFjY291bnQgZm9yIGRpZmZlcmVuY2VzIGluIHRoZSBpdGVtIHdpZHRoL2hlaWdodC5cbiAgICBpZiAoZGVsdGEgPT09IC0xKSB7XG4gICAgICBpdGVtT2Zmc2V0ICs9IGlzSG9yaXpvbnRhbCA/IG5ld1Bvc2l0aW9uLndpZHRoIC0gY3VycmVudFBvc2l0aW9uLndpZHRoIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3UG9zaXRpb24uaGVpZ2h0IC0gY3VycmVudFBvc2l0aW9uLmhlaWdodDtcbiAgICB9XG5cbiAgICByZXR1cm4gaXRlbU9mZnNldDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgcG9pbnRlciBpcyBlbnRlcmluZyBpbiB0aGUgZmlyc3QgcG9zaXRpb25cbiAgICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0gcG9pbnRlclkgUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqL1xuICBwcml2YXRlIF9zaG91bGRFbnRlckFzRmlyc3RDaGlsZChwb2ludGVyWDogbnVtYmVyLCBwb2ludGVyWTogbnVtYmVyKSB7XG4gICAgaWYgKCF0aGlzLl9hY3RpdmVEcmFnZ2FibGVzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IGl0ZW1Qb3NpdGlvbnMgPSB0aGlzLl9pdGVtUG9zaXRpb25zO1xuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCc7XG5cbiAgICAvLyBgaXRlbVBvc2l0aW9uc2AgYXJlIHNvcnRlZCBieSBwb3NpdGlvbiB3aGlsZSBgYWN0aXZlRHJhZ2dhYmxlc2AgYXJlIHNvcnRlZCBieSBjaGlsZCBpbmRleFxuICAgIC8vIGNoZWNrIGlmIGNvbnRhaW5lciBpcyB1c2luZyBzb21lIHNvcnQgb2YgXCJyZXZlcnNlXCIgb3JkZXJpbmcgKGVnOiBmbGV4LWRpcmVjdGlvbjogcm93LXJldmVyc2UpXG4gICAgY29uc3QgcmV2ZXJzZWQgPSBpdGVtUG9zaXRpb25zWzBdLmRyYWcgIT09IHRoaXMuX2FjdGl2ZURyYWdnYWJsZXNbMF07XG4gICAgaWYgKHJldmVyc2VkKSB7XG4gICAgICBjb25zdCBsYXN0SXRlbVJlY3QgPSBpdGVtUG9zaXRpb25zW2l0ZW1Qb3NpdGlvbnMubGVuZ3RoIC0gMV0uY2xpZW50UmVjdDtcbiAgICAgIHJldHVybiBpc0hvcml6b250YWwgPyBwb2ludGVyWCA+PSBsYXN0SXRlbVJlY3QucmlnaHQgOiBwb2ludGVyWSA+PSBsYXN0SXRlbVJlY3QuYm90dG9tO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBmaXJzdEl0ZW1SZWN0ID0gaXRlbVBvc2l0aW9uc1swXS5jbGllbnRSZWN0O1xuICAgICAgcmV0dXJuIGlzSG9yaXpvbnRhbCA/IHBvaW50ZXJYIDw9IGZpcnN0SXRlbVJlY3QubGVmdCA6IHBvaW50ZXJZIDw9IGZpcnN0SXRlbVJlY3QudG9wO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpbmRleCBvZiBhbiBpdGVtIGluIHRoZSBkcm9wIGNvbnRhaW5lciwgYmFzZWQgb24gdGhlIHBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB0aGF0IGlzIGJlaW5nIHNvcnRlZC5cbiAgICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0gcG9pbnRlclkgUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqIEBwYXJhbSBkZWx0YSBEaXJlY3Rpb24gaW4gd2hpY2ggdGhlIHVzZXIgaXMgbW92aW5nIHRoZWlyIHBvaW50ZXIuXG4gICAqL1xuICBwcml2YXRlIF9nZXRJdGVtSW5kZXhGcm9tUG9pbnRlclBvc2l0aW9uKGl0ZW06IERyYWdSZWYsIHBvaW50ZXJYOiBudW1iZXIsIHBvaW50ZXJZOiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsdGE/OiB7eDogbnVtYmVyLCB5OiBudW1iZXJ9KSB7XG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gdGhpcy5fb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJztcblxuICAgIHJldHVybiBmaW5kSW5kZXgodGhpcy5faXRlbVBvc2l0aW9ucywgKHtkcmFnLCBjbGllbnRSZWN0fSwgXywgYXJyYXkpID0+IHtcbiAgICAgIGlmIChkcmFnID09PSBpdGVtKSB7XG4gICAgICAgIC8vIElmIHRoZXJlJ3Mgb25seSBvbmUgaXRlbSBsZWZ0IGluIHRoZSBjb250YWluZXIsIGl0IG11c3QgYmVcbiAgICAgICAgLy8gdGhlIGRyYWdnZWQgaXRlbSBpdHNlbGYgc28gd2UgdXNlIGl0IGFzIGEgcmVmZXJlbmNlLlxuICAgICAgICByZXR1cm4gYXJyYXkubGVuZ3RoIDwgMjtcbiAgICAgIH1cblxuICAgICAgaWYgKGRlbHRhKSB7XG4gICAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IGlzSG9yaXpvbnRhbCA/IGRlbHRhLnggOiBkZWx0YS55O1xuXG4gICAgICAgIC8vIElmIHRoZSB1c2VyIGlzIHN0aWxsIGhvdmVyaW5nIG92ZXIgdGhlIHNhbWUgaXRlbSBhcyBsYXN0IHRpbWUsIGFuZCB0aGV5IGRpZG4ndCBjaGFuZ2VcbiAgICAgICAgLy8gdGhlIGRpcmVjdGlvbiBpbiB3aGljaCB0aGV5J3JlIGRyYWdnaW5nLCB3ZSBkb24ndCBjb25zaWRlciBpdCBhIGRpcmVjdGlvbiBzd2FwLlxuICAgICAgICBpZiAoZHJhZyA9PT0gdGhpcy5fcHJldmlvdXNTd2FwLmRyYWcgJiYgZGlyZWN0aW9uID09PSB0aGlzLl9wcmV2aW91c1N3YXAuZGVsdGEpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGlzSG9yaXpvbnRhbCA/XG4gICAgICAgICAgLy8gUm91bmQgdGhlc2UgZG93biBzaW5jZSBtb3N0IGJyb3dzZXJzIHJlcG9ydCBjbGllbnQgcmVjdHMgd2l0aFxuICAgICAgICAgIC8vIHN1Yi1waXhlbCBwcmVjaXNpb24sIHdoZXJlYXMgdGhlIHBvaW50ZXIgY29vcmRpbmF0ZXMgYXJlIHJvdW5kZWQgdG8gcGl4ZWxzLlxuICAgICAgICAgIHBvaW50ZXJYID49IE1hdGguZmxvb3IoY2xpZW50UmVjdC5sZWZ0KSAmJiBwb2ludGVyWCA8IE1hdGguZmxvb3IoY2xpZW50UmVjdC5yaWdodCkgOlxuICAgICAgICAgIHBvaW50ZXJZID49IE1hdGguZmxvb3IoY2xpZW50UmVjdC50b3ApICYmIHBvaW50ZXJZIDwgTWF0aC5mbG9vcihjbGllbnRSZWN0LmJvdHRvbSk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogQ2FjaGVzIHRoZSBjdXJyZW50IGl0ZW1zIGluIHRoZSBsaXN0IGFuZCB0aGVpciBwb3NpdGlvbnMuICovXG4gIHByaXZhdGUgX2NhY2hlSXRlbXMoKTogdm9pZCB7XG4gICAgdGhpcy5fYWN0aXZlRHJhZ2dhYmxlcyA9IHRoaXMuX2RyYWdnYWJsZXMuc2xpY2UoKTtcbiAgICB0aGlzLl9jYWNoZUl0ZW1Qb3NpdGlvbnMoKTtcbiAgICB0aGlzLl9jYWNoZVBhcmVudFBvc2l0aW9ucygpO1xuICB9XG5cbiAgLyoqIFN0YXJ0cyB0aGUgaW50ZXJ2YWwgdGhhdCdsbCBhdXRvLXNjcm9sbCB0aGUgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfc3RhcnRTY3JvbGxJbnRlcnZhbCA9ICgpID0+IHtcbiAgICB0aGlzLl9zdG9wU2Nyb2xsaW5nKCk7XG5cbiAgICBpbnRlcnZhbCgwLCBhbmltYXRpb25GcmFtZVNjaGVkdWxlcilcbiAgICAgIC5waXBlKHRha2VVbnRpbCh0aGlzLl9zdG9wU2Nyb2xsVGltZXJzKSlcbiAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICBjb25zdCBub2RlID0gdGhpcy5fc2Nyb2xsTm9kZTtcblxuICAgICAgICBpZiAodGhpcy5fdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPT09IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5VUCkge1xuICAgICAgICAgIGluY3JlbWVudFZlcnRpY2FsU2Nyb2xsKG5vZGUsIC1BVVRPX1NDUk9MTF9TVEVQKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl92ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9PT0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLkRPV04pIHtcbiAgICAgICAgICBpbmNyZW1lbnRWZXJ0aWNhbFNjcm9sbChub2RlLCBBVVRPX1NDUk9MTF9TVEVQKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9ob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID09PSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5MRUZUKSB7XG4gICAgICAgICAgaW5jcmVtZW50SG9yaXpvbnRhbFNjcm9sbChub2RlLCAtQVVUT19TQ1JPTExfU1RFUCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5faG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9PT0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uUklHSFQpIHtcbiAgICAgICAgICBpbmNyZW1lbnRIb3Jpem9udGFsU2Nyb2xsKG5vZGUsIEFVVE9fU0NST0xMX1NURVApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgdXNlcidzIHBvaW50ZXIgaXMgcG9zaXRpb25lZCBvdmVyIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSB4IFBvaW50ZXIgcG9zaXRpb24gYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHkgUG9pbnRlciBwb3NpdGlvbiBhbG9uZyB0aGUgWSBheGlzLlxuICAgKi9cbiAgX2lzT3ZlckNvbnRhaW5lcih4OiBudW1iZXIsIHk6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIHJldHVybiBpc0luc2lkZUNsaWVudFJlY3QodGhpcy5fY2xpZW50UmVjdCwgeCwgeSk7XG4gIH1cblxuICAvKipcbiAgICogRmlndXJlcyBvdXQgd2hldGhlciBhbiBpdGVtIHNob3VsZCBiZSBtb3ZlZCBpbnRvIGEgc2libGluZ1xuICAgKiBkcm9wIGNvbnRhaW5lciwgYmFzZWQgb24gaXRzIGN1cnJlbnQgcG9zaXRpb24uXG4gICAqIEBwYXJhbSBpdGVtIERyYWcgaXRlbSB0aGF0IGlzIGJlaW5nIG1vdmVkLlxuICAgKiBAcGFyYW0geCBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0geSBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKi9cbiAgX2dldFNpYmxpbmdDb250YWluZXJGcm9tUG9zaXRpb24oaXRlbTogRHJhZ1JlZiwgeDogbnVtYmVyLCB5OiBudW1iZXIpOiBEcm9wTGlzdFJlZiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX3NpYmxpbmdzLmZpbmQoc2libGluZyA9PiBzaWJsaW5nLl9jYW5SZWNlaXZlKGl0ZW0sIHgsIHkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgZHJvcCBsaXN0IGNhbiByZWNlaXZlIHRoZSBwYXNzZWQtaW4gaXRlbS5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB0aGF0IGlzIGJlaW5nIGRyYWdnZWQgaW50byB0aGUgbGlzdC5cbiAgICogQHBhcmFtIHggUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHkgUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFkgYXhpcy5cbiAgICovXG4gIF9jYW5SZWNlaXZlKGl0ZW06IERyYWdSZWYsIHg6IG51bWJlciwgeTogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgaWYgKCFpc0luc2lkZUNsaWVudFJlY3QodGhpcy5fY2xpZW50UmVjdCwgeCwgeSkgfHwgIXRoaXMuZW50ZXJQcmVkaWNhdGUoaXRlbSwgdGhpcykpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBlbGVtZW50RnJvbVBvaW50ID0gdGhpcy5fZ2V0U2hhZG93Um9vdCgpLmVsZW1lbnRGcm9tUG9pbnQoeCwgeSkgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuXG4gICAgLy8gSWYgdGhlcmUncyBubyBlbGVtZW50IGF0IHRoZSBwb2ludGVyIHBvc2l0aW9uLCB0aGVuXG4gICAgLy8gdGhlIGNsaWVudCByZWN0IGlzIHByb2JhYmx5IHNjcm9sbGVkIG91dCBvZiB0aGUgdmlldy5cbiAgICBpZiAoIWVsZW1lbnRGcm9tUG9pbnQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpO1xuXG4gICAgLy8gVGhlIGBDbGllbnRSZWN0YCwgdGhhdCB3ZSdyZSB1c2luZyB0byBmaW5kIHRoZSBjb250YWluZXIgb3ZlciB3aGljaCB0aGUgdXNlciBpc1xuICAgIC8vIGhvdmVyaW5nLCBkb2Vzbid0IGdpdmUgdXMgYW55IGluZm9ybWF0aW9uIG9uIHdoZXRoZXIgdGhlIGVsZW1lbnQgaGFzIGJlZW4gc2Nyb2xsZWRcbiAgICAvLyBvdXQgb2YgdGhlIHZpZXcgb3Igd2hldGhlciBpdCdzIG92ZXJsYXBwaW5nIHdpdGggb3RoZXIgY29udGFpbmVycy4gVGhpcyBtZWFucyB0aGF0XG4gICAgLy8gd2UgY291bGQgZW5kIHVwIHRyYW5zZmVycmluZyB0aGUgaXRlbSBpbnRvIGEgY29udGFpbmVyIHRoYXQncyBpbnZpc2libGUgb3IgaXMgcG9zaXRpb25lZFxuICAgIC8vIGJlbG93IGFub3RoZXIgb25lLiBXZSB1c2UgdGhlIHJlc3VsdCBmcm9tIGBlbGVtZW50RnJvbVBvaW50YCB0byBnZXQgdGhlIHRvcC1tb3N0IGVsZW1lbnRcbiAgICAvLyBhdCB0aGUgcG9pbnRlciBwb3NpdGlvbiBhbmQgdG8gZmluZCB3aGV0aGVyIGl0J3Mgb25lIG9mIHRoZSBpbnRlcnNlY3RpbmcgZHJvcCBjb250YWluZXJzLlxuICAgIHJldHVybiBlbGVtZW50RnJvbVBvaW50ID09PSBuYXRpdmVFbGVtZW50IHx8IG5hdGl2ZUVsZW1lbnQuY29udGFpbnMoZWxlbWVudEZyb21Qb2ludCk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIGJ5IG9uZSBvZiB0aGUgY29ubmVjdGVkIGRyb3AgbGlzdHMgd2hlbiBhIGRyYWdnaW5nIHNlcXVlbmNlIGhhcyBzdGFydGVkLlxuICAgKiBAcGFyYW0gc2libGluZyBTaWJsaW5nIGluIHdoaWNoIGRyYWdnaW5nIGhhcyBzdGFydGVkLlxuICAgKi9cbiAgX3N0YXJ0UmVjZWl2aW5nKHNpYmxpbmc6IERyb3BMaXN0UmVmKSB7XG4gICAgY29uc3QgYWN0aXZlU2libGluZ3MgPSB0aGlzLl9hY3RpdmVTaWJsaW5ncztcblxuICAgIGlmICghYWN0aXZlU2libGluZ3MuaGFzKHNpYmxpbmcpKSB7XG4gICAgICBhY3RpdmVTaWJsaW5ncy5hZGQoc2libGluZyk7XG4gICAgICB0aGlzLl9jYWNoZVBhcmVudFBvc2l0aW9ucygpO1xuICAgICAgdGhpcy5fbGlzdGVuVG9TY3JvbGxFdmVudHMoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIGJ5IGEgY29ubmVjdGVkIGRyb3AgbGlzdCB3aGVuIGRyYWdnaW5nIGhhcyBzdG9wcGVkLlxuICAgKiBAcGFyYW0gc2libGluZyBTaWJsaW5nIHdob3NlIGRyYWdnaW5nIGhhcyBzdG9wcGVkLlxuICAgKi9cbiAgX3N0b3BSZWNlaXZpbmcoc2libGluZzogRHJvcExpc3RSZWYpIHtcbiAgICB0aGlzLl9hY3RpdmVTaWJsaW5ncy5kZWxldGUoc2libGluZyk7XG4gICAgdGhpcy5fdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydHMgbGlzdGVuaW5nIHRvIHNjcm9sbCBldmVudHMgb24gdGhlIHZpZXdwb3J0LlxuICAgKiBVc2VkIGZvciB1cGRhdGluZyB0aGUgaW50ZXJuYWwgc3RhdGUgb2YgdGhlIGxpc3QuXG4gICAqL1xuICBwcml2YXRlIF9saXN0ZW5Ub1Njcm9sbEV2ZW50cygpIHtcbiAgICB0aGlzLl92aWV3cG9ydFNjcm9sbFN1YnNjcmlwdGlvbiA9IHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuc2Nyb2xsLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICBpZiAodGhpcy5pc0RyYWdnaW5nKCkpIHtcbiAgICAgICAgY29uc3Qgc2Nyb2xsRGlmZmVyZW5jZSA9IHRoaXMuX3BhcmVudFBvc2l0aW9ucy5oYW5kbGVTY3JvbGwoZXZlbnQpO1xuXG4gICAgICAgIGlmIChzY3JvbGxEaWZmZXJlbmNlKSB7XG4gICAgICAgICAgLy8gU2luY2Ugd2Uga25vdyB0aGUgYW1vdW50IHRoYXQgdGhlIHVzZXIgaGFzIHNjcm9sbGVkIHdlIGNhbiBzaGlmdCBhbGwgb2YgdGhlXG4gICAgICAgICAgLy8gY2xpZW50IHJlY3RhbmdsZXMgb3Vyc2VsdmVzLiBUaGlzIGlzIGNoZWFwZXIgdGhhbiByZS1tZWFzdXJpbmcgZXZlcnl0aGluZyBhbmRcbiAgICAgICAgICAvLyB3ZSBjYW4gYXZvaWQgaW5jb25zaXN0ZW50IGJlaGF2aW9yIHdoZXJlIHdlIG1pZ2h0IGJlIG1lYXN1cmluZyB0aGUgZWxlbWVudCBiZWZvcmVcbiAgICAgICAgICAvLyBpdHMgcG9zaXRpb24gaGFzIGNoYW5nZWQuXG4gICAgICAgICAgdGhpcy5faXRlbVBvc2l0aW9ucy5mb3JFYWNoKCh7Y2xpZW50UmVjdH0pID0+IHtcbiAgICAgICAgICAgIGFkanVzdENsaWVudFJlY3QoY2xpZW50UmVjdCwgc2Nyb2xsRGlmZmVyZW5jZS50b3AsIHNjcm9sbERpZmZlcmVuY2UubGVmdCk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICAvLyBXZSBuZWVkIHR3byBsb29wcyBmb3IgdGhpcywgYmVjYXVzZSB3ZSB3YW50IGFsbCBvZiB0aGUgY2FjaGVkXG4gICAgICAgICAgLy8gcG9zaXRpb25zIHRvIGJlIHVwLXRvLWRhdGUgYmVmb3JlIHdlIHJlLXNvcnQgdGhlIGl0ZW0uXG4gICAgICAgICAgdGhpcy5faXRlbVBvc2l0aW9ucy5mb3JFYWNoKCh7ZHJhZ30pID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LmlzRHJhZ2dpbmcoZHJhZykpIHtcbiAgICAgICAgICAgICAgLy8gV2UgbmVlZCB0byByZS1zb3J0IHRoZSBpdGVtIG1hbnVhbGx5LCBiZWNhdXNlIHRoZSBwb2ludGVyIG1vdmVcbiAgICAgICAgICAgICAgLy8gZXZlbnRzIHdvbid0IGJlIGRpc3BhdGNoZWQgd2hpbGUgdGhlIHVzZXIgaXMgc2Nyb2xsaW5nLlxuICAgICAgICAgICAgICBkcmFnLl9zb3J0RnJvbUxhc3RQb2ludGVyUG9zaXRpb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0aGlzLmlzUmVjZWl2aW5nKCkpIHtcbiAgICAgICAgdGhpcy5fY2FjaGVQYXJlbnRQb3NpdGlvbnMoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMYXppbHkgcmVzb2x2ZXMgYW5kIHJldHVybnMgdGhlIHNoYWRvdyByb290IG9mIHRoZSBlbGVtZW50LiBXZSBkbyB0aGlzIGluIGEgZnVuY3Rpb24sIHJhdGhlclxuICAgKiB0aGFuIHNhdmluZyBpdCBpbiBwcm9wZXJ0eSBkaXJlY3RseSBvbiBpbml0LCBiZWNhdXNlIHdlIHdhbnQgdG8gcmVzb2x2ZSBpdCBhcyBsYXRlIGFzIHBvc3NpYmxlXG4gICAqIGluIG9yZGVyIHRvIGVuc3VyZSB0aGF0IHRoZSBlbGVtZW50IGhhcyBiZWVuIG1vdmVkIGludG8gdGhlIHNoYWRvdyBET00uIERvaW5nIGl0IGluc2lkZSB0aGVcbiAgICogY29uc3RydWN0b3IgbWlnaHQgYmUgdG9vIGVhcmx5IGlmIHRoZSBlbGVtZW50IGlzIGluc2lkZSBvZiBzb21ldGhpbmcgbGlrZSBgbmdGb3JgIG9yIGBuZ0lmYC5cbiAgICovXG4gIHByaXZhdGUgX2dldFNoYWRvd1Jvb3QoKTogRG9jdW1lbnRPclNoYWRvd1Jvb3Qge1xuICAgIGlmICghdGhpcy5fY2FjaGVkU2hhZG93Um9vdCkge1xuICAgICAgY29uc3Qgc2hhZG93Um9vdCA9IF9nZXRTaGFkb3dSb290KGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KSkgYXMgU2hhZG93Um9vdCB8IG51bGw7XG4gICAgICB0aGlzLl9jYWNoZWRTaGFkb3dSb290ID0gc2hhZG93Um9vdCB8fCB0aGlzLl9kb2N1bWVudDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fY2FjaGVkU2hhZG93Um9vdDtcbiAgfVxufVxuXG5cbi8qKlxuICogRmluZHMgdGhlIGluZGV4IG9mIGFuIGl0ZW0gdGhhdCBtYXRjaGVzIGEgcHJlZGljYXRlIGZ1bmN0aW9uLiBVc2VkIGFzIGFuIGVxdWl2YWxlbnRcbiAqIG9mIGBBcnJheS5wcm90b3R5cGUuZmluZEluZGV4YCB3aGljaCBpc24ndCBwYXJ0IG9mIHRoZSBzdGFuZGFyZCBHb29nbGUgdHlwaW5ncy5cbiAqIEBwYXJhbSBhcnJheSBBcnJheSBpbiB3aGljaCB0byBsb29rIGZvciBtYXRjaGVzLlxuICogQHBhcmFtIHByZWRpY2F0ZSBGdW5jdGlvbiB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIGFuIGl0ZW0gaXMgYSBtYXRjaC5cbiAqL1xuZnVuY3Rpb24gZmluZEluZGV4PFQ+KGFycmF5OiBUW10sXG4gICAgICAgICAgICAgICAgICAgICAgcHJlZGljYXRlOiAodmFsdWU6IFQsIGluZGV4OiBudW1iZXIsIG9iajogVFtdKSA9PiBib29sZWFuKTogbnVtYmVyIHtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHByZWRpY2F0ZShhcnJheVtpXSwgaSwgYXJyYXkpKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gLTE7XG59XG5cbi8qKlxuICogSW5jcmVtZW50cyB0aGUgdmVydGljYWwgc2Nyb2xsIHBvc2l0aW9uIG9mIGEgbm9kZS5cbiAqIEBwYXJhbSBub2RlIE5vZGUgd2hvc2Ugc2Nyb2xsIHBvc2l0aW9uIHNob3VsZCBjaGFuZ2UuXG4gKiBAcGFyYW0gYW1vdW50IEFtb3VudCBvZiBwaXhlbHMgdGhhdCB0aGUgYG5vZGVgIHNob3VsZCBiZSBzY3JvbGxlZC5cbiAqL1xuZnVuY3Rpb24gaW5jcmVtZW50VmVydGljYWxTY3JvbGwobm9kZTogSFRNTEVsZW1lbnQgfCBXaW5kb3csIGFtb3VudDogbnVtYmVyKSB7XG4gIGlmIChub2RlID09PSB3aW5kb3cpIHtcbiAgICAobm9kZSBhcyBXaW5kb3cpLnNjcm9sbEJ5KDAsIGFtb3VudCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gSWRlYWxseSB3ZSBjb3VsZCB1c2UgYEVsZW1lbnQuc2Nyb2xsQnlgIGhlcmUgYXMgd2VsbCwgYnV0IElFIGFuZCBFZGdlIGRvbid0IHN1cHBvcnQgaXQuXG4gICAgKG5vZGUgYXMgSFRNTEVsZW1lbnQpLnNjcm9sbFRvcCArPSBhbW91bnQ7XG4gIH1cbn1cblxuLyoqXG4gKiBJbmNyZW1lbnRzIHRoZSBob3Jpem9udGFsIHNjcm9sbCBwb3NpdGlvbiBvZiBhIG5vZGUuXG4gKiBAcGFyYW0gbm9kZSBOb2RlIHdob3NlIHNjcm9sbCBwb3NpdGlvbiBzaG91bGQgY2hhbmdlLlxuICogQHBhcmFtIGFtb3VudCBBbW91bnQgb2YgcGl4ZWxzIHRoYXQgdGhlIGBub2RlYCBzaG91bGQgYmUgc2Nyb2xsZWQuXG4gKi9cbmZ1bmN0aW9uIGluY3JlbWVudEhvcml6b250YWxTY3JvbGwobm9kZTogSFRNTEVsZW1lbnQgfCBXaW5kb3csIGFtb3VudDogbnVtYmVyKSB7XG4gIGlmIChub2RlID09PSB3aW5kb3cpIHtcbiAgICAobm9kZSBhcyBXaW5kb3cpLnNjcm9sbEJ5KGFtb3VudCwgMCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gSWRlYWxseSB3ZSBjb3VsZCB1c2UgYEVsZW1lbnQuc2Nyb2xsQnlgIGhlcmUgYXMgd2VsbCwgYnV0IElFIGFuZCBFZGdlIGRvbid0IHN1cHBvcnQgaXQuXG4gICAgKG5vZGUgYXMgSFRNTEVsZW1lbnQpLnNjcm9sbExlZnQgKz0gYW1vdW50O1xuICB9XG59XG5cbi8qKlxuICogR2V0cyB3aGV0aGVyIHRoZSB2ZXJ0aWNhbCBhdXRvLXNjcm9sbCBkaXJlY3Rpb24gb2YgYSBub2RlLlxuICogQHBhcmFtIGNsaWVudFJlY3QgRGltZW5zaW9ucyBvZiB0aGUgbm9kZS5cbiAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIHkgYXhpcy5cbiAqL1xuZnVuY3Rpb24gZ2V0VmVydGljYWxTY3JvbGxEaXJlY3Rpb24oY2xpZW50UmVjdDogQ2xpZW50UmVjdCwgcG9pbnRlclk6IG51bWJlcikge1xuICBjb25zdCB7dG9wLCBib3R0b20sIGhlaWdodH0gPSBjbGllbnRSZWN0O1xuICBjb25zdCB5VGhyZXNob2xkID0gaGVpZ2h0ICogU0NST0xMX1BST1hJTUlUWV9USFJFU0hPTEQ7XG5cbiAgaWYgKHBvaW50ZXJZID49IHRvcCAtIHlUaHJlc2hvbGQgJiYgcG9pbnRlclkgPD0gdG9wICsgeVRocmVzaG9sZCkge1xuICAgIHJldHVybiBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uVVA7XG4gIH0gZWxzZSBpZiAocG9pbnRlclkgPj0gYm90dG9tIC0geVRocmVzaG9sZCAmJiBwb2ludGVyWSA8PSBib3R0b20gKyB5VGhyZXNob2xkKSB7XG4gICAgcmV0dXJuIEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5ET1dOO1xuICB9XG5cbiAgcmV0dXJuIEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5OT05FO1xufVxuXG4vKipcbiAqIEdldHMgd2hldGhlciB0aGUgaG9yaXpvbnRhbCBhdXRvLXNjcm9sbCBkaXJlY3Rpb24gb2YgYSBub2RlLlxuICogQHBhcmFtIGNsaWVudFJlY3QgRGltZW5zaW9ucyBvZiB0aGUgbm9kZS5cbiAqIEBwYXJhbSBwb2ludGVyWCBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIHggYXhpcy5cbiAqL1xuZnVuY3Rpb24gZ2V0SG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0OiBDbGllbnRSZWN0LCBwb2ludGVyWDogbnVtYmVyKSB7XG4gIGNvbnN0IHtsZWZ0LCByaWdodCwgd2lkdGh9ID0gY2xpZW50UmVjdDtcbiAgY29uc3QgeFRocmVzaG9sZCA9IHdpZHRoICogU0NST0xMX1BST1hJTUlUWV9USFJFU0hPTEQ7XG5cbiAgaWYgKHBvaW50ZXJYID49IGxlZnQgLSB4VGhyZXNob2xkICYmIHBvaW50ZXJYIDw9IGxlZnQgKyB4VGhyZXNob2xkKSB7XG4gICAgcmV0dXJuIEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLkxFRlQ7XG4gIH0gZWxzZSBpZiAocG9pbnRlclggPj0gcmlnaHQgLSB4VGhyZXNob2xkICYmIHBvaW50ZXJYIDw9IHJpZ2h0ICsgeFRocmVzaG9sZCkge1xuICAgIHJldHVybiBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5SSUdIVDtcbiAgfVxuXG4gIHJldHVybiBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5OT05FO1xufVxuXG4vKipcbiAqIEdldHMgdGhlIGRpcmVjdGlvbnMgaW4gd2hpY2ggYW4gZWxlbWVudCBub2RlIHNob3VsZCBiZSBzY3JvbGxlZCxcbiAqIGFzc3VtaW5nIHRoYXQgdGhlIHVzZXIncyBwb2ludGVyIGlzIGFscmVhZHkgd2l0aGluIGl0IHNjcm9sbGFibGUgcmVnaW9uLlxuICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCBmb3Igd2hpY2ggd2Ugc2hvdWxkIGNhbGN1bGF0ZSB0aGUgc2Nyb2xsIGRpcmVjdGlvbi5cbiAqIEBwYXJhbSBjbGllbnRSZWN0IEJvdW5kaW5nIGNsaWVudCByZWN0YW5nbGUgb2YgdGhlIGVsZW1lbnQuXG4gKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSB4IGF4aXMuXG4gKiBAcGFyYW0gcG9pbnRlclkgUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSB5IGF4aXMuXG4gKi9cbmZ1bmN0aW9uIGdldEVsZW1lbnRTY3JvbGxEaXJlY3Rpb25zKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBjbGllbnRSZWN0OiBDbGllbnRSZWN0LCBwb2ludGVyWDogbnVtYmVyLFxuICBwb2ludGVyWTogbnVtYmVyKTogW0F1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbiwgQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb25dIHtcbiAgY29uc3QgY29tcHV0ZWRWZXJ0aWNhbCA9IGdldFZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uKGNsaWVudFJlY3QsIHBvaW50ZXJZKTtcbiAgY29uc3QgY29tcHV0ZWRIb3Jpem9udGFsID0gZ2V0SG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0LCBwb2ludGVyWCk7XG4gIGxldCB2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5OT05FO1xuICBsZXQgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLk5PTkU7XG5cbiAgLy8gTm90ZSB0aGF0IHdlIGhlcmUgd2UgZG8gc29tZSBleHRyYSBjaGVja3MgZm9yIHdoZXRoZXIgdGhlIGVsZW1lbnQgaXMgYWN0dWFsbHkgc2Nyb2xsYWJsZSBpblxuICAvLyBhIGNlcnRhaW4gZGlyZWN0aW9uIGFuZCB3ZSBvbmx5IGFzc2lnbiB0aGUgc2Nyb2xsIGRpcmVjdGlvbiBpZiBpdCBpcy4gV2UgZG8gdGhpcyBzbyB0aGF0IHdlXG4gIC8vIGNhbiBhbGxvdyBvdGhlciBlbGVtZW50cyB0byBiZSBzY3JvbGxlZCwgaWYgdGhlIGN1cnJlbnQgZWxlbWVudCBjYW4ndCBiZSBzY3JvbGxlZCBhbnltb3JlLlxuICAvLyBUaGlzIGFsbG93cyB1cyB0byBoYW5kbGUgY2FzZXMgd2hlcmUgdGhlIHNjcm9sbCByZWdpb25zIG9mIHR3byBzY3JvbGxhYmxlIGVsZW1lbnRzIG92ZXJsYXAuXG4gIGlmIChjb21wdXRlZFZlcnRpY2FsKSB7XG4gICAgY29uc3Qgc2Nyb2xsVG9wID0gZWxlbWVudC5zY3JvbGxUb3A7XG5cbiAgICBpZiAoY29tcHV0ZWRWZXJ0aWNhbCA9PT0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLlVQKSB7XG4gICAgICBpZiAoc2Nyb2xsVG9wID4gMCkge1xuICAgICAgICB2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5VUDtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0gc2Nyb2xsVG9wID4gZWxlbWVudC5jbGllbnRIZWlnaHQpIHtcbiAgICAgIHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLkRPV047XG4gICAgfVxuICB9XG5cbiAgaWYgKGNvbXB1dGVkSG9yaXpvbnRhbCkge1xuICAgIGNvbnN0IHNjcm9sbExlZnQgPSBlbGVtZW50LnNjcm9sbExlZnQ7XG5cbiAgICBpZiAoY29tcHV0ZWRIb3Jpem9udGFsID09PSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5MRUZUKSB7XG4gICAgICBpZiAoc2Nyb2xsTGVmdCA+IDApIHtcbiAgICAgICAgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLkxFRlQ7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChlbGVtZW50LnNjcm9sbFdpZHRoIC0gc2Nyb2xsTGVmdCA+IGVsZW1lbnQuY2xpZW50V2lkdGgpIHtcbiAgICAgIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5SSUdIVDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uLCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uXTtcbn1cbiJdfQ==