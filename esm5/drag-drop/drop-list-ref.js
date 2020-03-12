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
        /** Cached positions of the scrollable parent elements. */
        this._parentPositions = new Map();
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
            coerceElement(this.element).appendChild(placeholder);
            activeDraggables.push(item);
        }
        // The transform needs to be cleared so it doesn't throw off the measurements.
        placeholder.style.transform = '';
        // Note that the positions were already cached when we called `start` above,
        // but we need to refresh them since the amount of items has changed.
        this._cacheItemPositions();
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
        this._draggables = items;
        items.forEach(function (item) { return item._withDropContainer(_this); });
        if (this.isDragging()) {
            this._cacheItems();
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
        if (this.sortingDisabled || !isPointerNearClientRect(this._clientRect, pointerX, pointerY)) {
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
        this._parentPositions.forEach(function (position, element) {
            var _a;
            // We have special handling for the `document` below. Also this would be
            // nicer with a  for...of loop, but it requires changing a compiler flag.
            if (element === _this._document || !position.clientRect || scrollNode) {
                return;
            }
            if (isPointerNearClientRect(position.clientRect, pointerX, pointerY)) {
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
        var _this = this;
        this._parentPositions.clear();
        this._parentPositions.set(this._document, {
            scrollPosition: this._viewportRuler.getViewportScrollPosition(),
        });
        this._scrollableElements.forEach(function (element) {
            var clientRect = getMutableClientRect(element);
            // We keep the ClientRect cached in two properties, because it's referenced in a lot of
            // performance-sensitive places and we want to avoid the extra lookups. The `element` is
            // guaranteed to always be in the `_scrollableElements` so this should always match.
            if (element === _this.element) {
                _this._clientRect = clientRect;
            }
            _this._parentPositions.set(element, {
                scrollPosition: { top: element.scrollTop, left: element.scrollLeft },
                clientRect: clientRect
            });
        });
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
        this._activeDraggables.forEach(function (item) { return item.getRootElement().style.transform = ''; });
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
                pointerX >= Math.floor(clientRect.left) && pointerX <= Math.floor(clientRect.right) :
                pointerY >= Math.floor(clientRect.top) && pointerY <= Math.floor(clientRect.bottom);
        });
    };
    /** Caches the current items in the list and their positions. */
    DropListRef.prototype._cacheItems = function () {
        this._activeDraggables = this._draggables.slice();
        this._cacheItemPositions();
        this._cacheParentPositions();
    };
    /**
     * Updates the internal state of the container after a scroll event has happened.
     * @param scrolledParent Element that was scrolled.
     * @param newTop New top scroll position.
     * @param newLeft New left scroll position.
     */
    DropListRef.prototype._updateAfterScroll = function (scrolledParent, newTop, newLeft) {
        var _this = this;
        var scrollPosition = this._parentPositions.get(scrolledParent).scrollPosition;
        var topDifference = scrollPosition.top - newTop;
        var leftDifference = scrollPosition.left - newLeft;
        // Go through and update the cached positions of the scroll
        // parents that are inside the element that was scrolled.
        this._parentPositions.forEach(function (position, node) {
            if (position.clientRect && scrolledParent !== node && scrolledParent.contains(node)) {
                adjustClientRect(position.clientRect, topDifference, leftDifference);
            }
        });
        // Since we know the amount that the user has scrolled we can shift all of the client rectangles
        // ourselves. This is cheaper than re-measuring everything and we can avoid inconsistent
        // behavior where we might be measuring the element before its position has changed.
        this._itemPositions.forEach(function (_a) {
            var clientRect = _a.clientRect;
            adjustClientRect(clientRect, topDifference, leftDifference);
        });
        // We need two loops for this, because we want all of the cached
        // positions to be up-to-date before we re-sort the item.
        this._itemPositions.forEach(function (_a) {
            var drag = _a.drag;
            if (_this._dragDropRegistry.isDragging(drag)) {
                // We need to re-sort the item manually, because the pointer move
                // events won't be dispatched while the user is scrolling.
                drag._sortFromLastPointerPosition();
            }
        });
        scrollPosition.top = newTop;
        scrollPosition.left = newLeft;
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
                var target = event.target;
                var position = _this._parentPositions.get(target);
                if (position) {
                    var newTop = void 0;
                    var newLeft = void 0;
                    if (target === _this._document) {
                        var scrollPosition = _this._viewportRuler.getViewportScrollPosition();
                        newTop = scrollPosition.top;
                        newLeft = scrollPosition.left;
                    }
                    else {
                        newTop = target.scrollTop;
                        newLeft = target.scrollLeft;
                    }
                    _this._updateAfterScroll(target, newTop, newLeft);
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
 * Updates the top/left positions of a `ClientRect`, as well as their bottom/right counterparts.
 * @param clientRect `ClientRect` that should be updated.
 * @param top Amount to add to the `top` position.
 * @param left Amount to add to the `left` position.
 */
function adjustClientRect(clientRect, top, left) {
    clientRect.top += top;
    clientRect.bottom = clientRect.top + clientRect.height;
    clientRect.left += left;
    clientRect.right = clientRect.left + clientRect.width;
}
/**
 * Checks whether the pointer coordinates are close to a ClientRect.
 * @param rect ClientRect to check against.
 * @param pointerX Coordinates along the X axis.
 * @param pointerY Coordinates along the Y axis.
 */
function isPointerNearClientRect(rect, pointerX, pointerY) {
    var top = rect.top, right = rect.right, bottom = rect.bottom, left = rect.left, width = rect.width, height = rect.height;
    var xThreshold = width * DROP_PROXIMITY_THRESHOLD;
    var yThreshold = height * DROP_PROXIMITY_THRESHOLD;
    return pointerY > top - yThreshold && pointerY < bottom + yThreshold &&
        pointerX > left - xThreshold && pointerX < right + xThreshold;
}
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
 * Checks whether some coordinates are within a `ClientRect`.
 * @param clientRect ClientRect that is being checked.
 * @param x Coordinates along the X axis.
 * @param y Coordinates along the Y axis.
 */
function isInsideClientRect(clientRect, x, y) {
    var top = clientRect.top, bottom = clientRect.bottom, left = clientRect.left, right = clientRect.right;
    return y >= top && y <= bottom && x >= left && x <= right;
}
/** Gets a mutable version of an element's bounding `ClientRect`. */
function getMutableClientRect(element) {
    var clientRect = element.getBoundingClientRect();
    // We need to clone the `clientRect` here, because all the values on it are readonly
    // and we need to be able to update them. Also we can't use a spread here, because
    // the values on a `ClientRect` aren't own properties. See:
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect#Notes
    return {
        top: clientRect.top,
        right: clientRect.right,
        bottom: clientRect.bottom,
        left: clientRect.left,
        width: clientRect.width,
        height: clientRect.height
    };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LXJlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2Ryb3AtbGlzdC1yZWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUlILE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUVwRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDckQsT0FBTyxFQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLHVCQUF1QixFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQzlFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6QyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBSTdDOzs7R0FHRztBQUNILElBQU0sd0JBQXdCLEdBQUcsSUFBSSxDQUFDO0FBRXRDOzs7R0FHRztBQUNILElBQU0sMEJBQTBCLEdBQUcsSUFBSSxDQUFDO0FBRXhDOzs7R0FHRztBQUNILElBQU0sZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDO0FBa0MzQjs7R0FFRztBQUNIO0lBbUlFLHFCQUNFLE9BQThDLEVBQ3RDLGlCQUF5RCxFQUNqRSxTQUFjLEVBQ04sT0FBZSxFQUNmLGNBQTZCO1FBTHZDLGlCQVVDO1FBUlMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUF3QztRQUV6RCxZQUFPLEdBQVAsT0FBTyxDQUFRO1FBQ2YsbUJBQWMsR0FBZCxjQUFjLENBQWU7UUFwSXZDLDRFQUE0RTtRQUM1RSxhQUFRLEdBQVksS0FBSyxDQUFDO1FBRTFCLHlEQUF5RDtRQUN6RCxvQkFBZSxHQUFZLEtBQUssQ0FBQztRQUtqQzs7O1dBR0c7UUFDSCx1QkFBa0IsR0FBWSxLQUFLLENBQUM7UUFFcEM7OztXQUdHO1FBQ0gsbUJBQWMsR0FBa0QsY0FBTSxPQUFBLElBQUksRUFBSixDQUFJ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QztJQUMxRSxJQUFNLGtCQUFrQixHQUFHLDRCQUE0QixDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUM5RSxJQUFJLHVCQUF1QixlQUFtQyxDQUFDO0lBQy9ELElBQUkseUJBQXlCLGVBQXFDLENBQUM7SUFFbkUsOEZBQThGO0lBQzlGLDhGQUE4RjtJQUM5Riw2RkFBNkY7SUFDN0YsOEZBQThGO0lBQzlGLElBQUksZ0JBQWdCLEVBQUU7UUFDcEIsSUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQztRQUVwQyxJQUFJLGdCQUFnQixlQUFtQyxFQUFFO1lBQ3ZELElBQUksU0FBUyxHQUFHLENBQUMsRUFBRTtnQkFDakIsdUJBQXVCLGFBQWlDLENBQUM7YUFDMUQ7U0FDRjthQUFNLElBQUksT0FBTyxDQUFDLFlBQVksR0FBRyxTQUFTLEdBQUcsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUNsRSx1QkFBdUIsZUFBbUMsQ0FBQztTQUM1RDtLQUNGO0lBRUQsSUFBSSxrQkFBa0IsRUFBRTtRQUN0QixJQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO1FBRXRDLElBQUksa0JBQWtCLGlCQUF1QyxFQUFFO1lBQzdELElBQUksVUFBVSxHQUFHLENBQUMsRUFBRTtnQkFDbEIseUJBQXlCLGVBQXFDLENBQUM7YUFDaEU7U0FDRjthQUFNLElBQUksT0FBTyxDQUFDLFdBQVcsR0FBRyxVQUFVLEdBQUcsT0FBTyxDQUFDLFdBQVcsRUFBRTtZQUNqRSx5QkFBeUIsZ0JBQXNDLENBQUM7U0FDakU7S0FDRjtJQUVELE9BQU8sQ0FBQyx1QkFBdUIsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO0FBQzlELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtFbGVtZW50UmVmLCBOZ1pvbmV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtEaXJlY3Rpb259IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7Y29lcmNlRWxlbWVudH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7Vmlld3BvcnRSdWxlcn0gZnJvbSAnQGFuZ3VsYXIvY2RrL3Njcm9sbGluZyc7XG5pbXBvcnQge19nZXRTaGFkb3dSb290fSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtTdWJqZWN0LCBTdWJzY3JpcHRpb24sIGludGVydmFsLCBhbmltYXRpb25GcmFtZVNjaGVkdWxlcn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3Rha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHttb3ZlSXRlbUluQXJyYXl9IGZyb20gJy4vZHJhZy11dGlscyc7XG5pbXBvcnQge0RyYWdEcm9wUmVnaXN0cnl9IGZyb20gJy4vZHJhZy1kcm9wLXJlZ2lzdHJ5JztcbmltcG9ydCB7RHJhZ1JlZkludGVybmFsIGFzIERyYWdSZWYsIFBvaW50fSBmcm9tICcuL2RyYWctcmVmJztcblxuLyoqXG4gKiBQcm94aW1pdHksIGFzIGEgcmF0aW8gdG8gd2lkdGgvaGVpZ2h0LCBhdCB3aGljaCBhXG4gKiBkcmFnZ2VkIGl0ZW0gd2lsbCBhZmZlY3QgdGhlIGRyb3AgY29udGFpbmVyLlxuICovXG5jb25zdCBEUk9QX1BST1hJTUlUWV9USFJFU0hPTEQgPSAwLjA1O1xuXG4vKipcbiAqIFByb3hpbWl0eSwgYXMgYSByYXRpbyB0byB3aWR0aC9oZWlnaHQgYXQgd2hpY2ggdG8gc3RhcnQgYXV0by1zY3JvbGxpbmcgdGhlIGRyb3AgbGlzdCBvciB0aGVcbiAqIHZpZXdwb3J0LiBUaGUgdmFsdWUgY29tZXMgZnJvbSB0cnlpbmcgaXQgb3V0IG1hbnVhbGx5IHVudGlsIGl0IGZlZWxzIHJpZ2h0LlxuICovXG5jb25zdCBTQ1JPTExfUFJPWElNSVRZX1RIUkVTSE9MRCA9IDAuMDU7XG5cbi8qKlxuICogTnVtYmVyIG9mIHBpeGVscyB0byBzY3JvbGwgZm9yIGVhY2ggZnJhbWUgd2hlbiBhdXRvLXNjcm9sbGluZyBhbiBlbGVtZW50LlxuICogVGhlIHZhbHVlIGNvbWVzIGZyb20gdHJ5aW5nIGl0IG91dCBtYW51YWxseSB1bnRpbCBpdCBmZWVscyByaWdodC5cbiAqL1xuY29uc3QgQVVUT19TQ1JPTExfU1RFUCA9IDI7XG5cbi8qKlxuICogRW50cnkgaW4gdGhlIHBvc2l0aW9uIGNhY2hlIGZvciBkcmFnZ2FibGUgaXRlbXMuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmludGVyZmFjZSBDYWNoZWRJdGVtUG9zaXRpb24ge1xuICAvKiogSW5zdGFuY2Ugb2YgdGhlIGRyYWcgaXRlbS4gKi9cbiAgZHJhZzogRHJhZ1JlZjtcbiAgLyoqIERpbWVuc2lvbnMgb2YgdGhlIGl0ZW0uICovXG4gIGNsaWVudFJlY3Q6IENsaWVudFJlY3Q7XG4gIC8qKiBBbW91bnQgYnkgd2hpY2ggdGhlIGl0ZW0gaGFzIGJlZW4gbW92ZWQgc2luY2UgZHJhZ2dpbmcgc3RhcnRlZC4gKi9cbiAgb2Zmc2V0OiBudW1iZXI7XG59XG5cbi8qKiBPYmplY3QgaG9sZGluZyB0aGUgc2Nyb2xsIHBvc2l0aW9uIG9mIHNvbWV0aGluZy4gKi9cbmludGVyZmFjZSBTY3JvbGxQb3NpdGlvbiB7XG4gIHRvcDogbnVtYmVyO1xuICBsZWZ0OiBudW1iZXI7XG59XG5cbi8qKiBWZXJ0aWNhbCBkaXJlY3Rpb24gaW4gd2hpY2ggd2UgY2FuIGF1dG8tc2Nyb2xsLiAqL1xuY29uc3QgZW51bSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24ge05PTkUsIFVQLCBET1dOfVxuXG4vKiogSG9yaXpvbnRhbCBkaXJlY3Rpb24gaW4gd2hpY2ggd2UgY2FuIGF1dG8tc2Nyb2xsLiAqL1xuY29uc3QgZW51bSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbiB7Tk9ORSwgTEVGVCwgUklHSFR9XG5cbi8qKlxuICogSW50ZXJuYWwgY29tcGlsZS10aW1lLW9ubHkgcmVwcmVzZW50YXRpb24gb2YgYSBgRHJvcExpc3RSZWZgLlxuICogVXNlZCB0byBhdm9pZCBjaXJjdWxhciBpbXBvcnQgaXNzdWVzIGJldHdlZW4gdGhlIGBEcm9wTGlzdFJlZmAgYW5kIHRoZSBgRHJhZ1JlZmAuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRHJvcExpc3RSZWZJbnRlcm5hbCBleHRlbmRzIERyb3BMaXN0UmVmIHt9XG5cbi8qKlxuICogUmVmZXJlbmNlIHRvIGEgZHJvcCBsaXN0LiBVc2VkIHRvIG1hbmlwdWxhdGUgb3IgZGlzcG9zZSBvZiB0aGUgY29udGFpbmVyLlxuICovXG5leHBvcnQgY2xhc3MgRHJvcExpc3RSZWY8VCA9IGFueT4ge1xuICAvKiogRWxlbWVudCB0aGF0IHRoZSBkcm9wIGxpc3QgaXMgYXR0YWNoZWQgdG8uICovXG4gIGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD47XG5cbiAgLyoqIFdoZXRoZXIgc3RhcnRpbmcgYSBkcmFnZ2luZyBzZXF1ZW5jZSBmcm9tIHRoaXMgY29udGFpbmVyIGlzIGRpc2FibGVkLiAqL1xuICBkaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIHNvcnRpbmcgaXRlbXMgd2l0aGluIHRoZSBsaXN0IGlzIGRpc2FibGVkLiAqL1xuICBzb3J0aW5nRGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogTG9ja3MgdGhlIHBvc2l0aW9uIG9mIHRoZSBkcmFnZ2FibGUgZWxlbWVudHMgaW5zaWRlIHRoZSBjb250YWluZXIgYWxvbmcgdGhlIHNwZWNpZmllZCBheGlzLiAqL1xuICBsb2NrQXhpczogJ3gnIHwgJ3knO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIGF1dG8tc2Nyb2xsaW5nIHRoZSB2aWV3IHdoZW4gdGhlIHVzZXJcbiAgICogbW92ZXMgdGhlaXIgcG9pbnRlciBjbG9zZSB0byB0aGUgZWRnZXMgaXMgZGlzYWJsZWQuXG4gICAqL1xuICBhdXRvU2Nyb2xsRGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKipcbiAgICogRnVuY3Rpb24gdGhhdCBpcyB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIGFuIGl0ZW1cbiAgICogaXMgYWxsb3dlZCB0byBiZSBtb3ZlZCBpbnRvIGEgZHJvcCBjb250YWluZXIuXG4gICAqL1xuICBlbnRlclByZWRpY2F0ZTogKGRyYWc6IERyYWdSZWYsIGRyb3A6IERyb3BMaXN0UmVmKSA9PiBib29sZWFuID0gKCkgPT4gdHJ1ZTtcblxuICAvKiogRW1pdHMgcmlnaHQgYmVmb3JlIGRyYWdnaW5nIGhhcyBzdGFydGVkLiAqL1xuICBiZWZvcmVTdGFydGVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKipcbiAgICogRW1pdHMgd2hlbiB0aGUgdXNlciBoYXMgbW92ZWQgYSBuZXcgZHJhZyBpdGVtIGludG8gdGhpcyBjb250YWluZXIuXG4gICAqL1xuICBlbnRlcmVkID0gbmV3IFN1YmplY3Q8e2l0ZW06IERyYWdSZWYsIGNvbnRhaW5lcjogRHJvcExpc3RSZWYsIGN1cnJlbnRJbmRleDogbnVtYmVyfT4oKTtcblxuICAvKipcbiAgICogRW1pdHMgd2hlbiB0aGUgdXNlciByZW1vdmVzIGFuIGl0ZW0gZnJvbSB0aGUgY29udGFpbmVyXG4gICAqIGJ5IGRyYWdnaW5nIGl0IGludG8gYW5vdGhlciBjb250YWluZXIuXG4gICAqL1xuICBleGl0ZWQgPSBuZXcgU3ViamVjdDx7aXRlbTogRHJhZ1JlZiwgY29udGFpbmVyOiBEcm9wTGlzdFJlZn0+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgZHJvcHMgYW4gaXRlbSBpbnNpZGUgdGhlIGNvbnRhaW5lci4gKi9cbiAgZHJvcHBlZCA9IG5ldyBTdWJqZWN0PHtcbiAgICBpdGVtOiBEcmFnUmVmLFxuICAgIGN1cnJlbnRJbmRleDogbnVtYmVyLFxuICAgIHByZXZpb3VzSW5kZXg6IG51bWJlcixcbiAgICBjb250YWluZXI6IERyb3BMaXN0UmVmLFxuICAgIHByZXZpb3VzQ29udGFpbmVyOiBEcm9wTGlzdFJlZixcbiAgICBpc1BvaW50ZXJPdmVyQ29udGFpbmVyOiBib29sZWFuLFxuICAgIGRpc3RhbmNlOiBQb2ludDtcbiAgfT4oKTtcblxuICAvKiogRW1pdHMgYXMgdGhlIHVzZXIgaXMgc3dhcHBpbmcgaXRlbXMgd2hpbGUgYWN0aXZlbHkgZHJhZ2dpbmcuICovXG4gIHNvcnRlZCA9IG5ldyBTdWJqZWN0PHtcbiAgICBwcmV2aW91c0luZGV4OiBudW1iZXIsXG4gICAgY3VycmVudEluZGV4OiBudW1iZXIsXG4gICAgY29udGFpbmVyOiBEcm9wTGlzdFJlZixcbiAgICBpdGVtOiBEcmFnUmVmXG4gIH0+KCk7XG5cbiAgLyoqIEFyYml0cmFyeSBkYXRhIHRoYXQgY2FuIGJlIGF0dGFjaGVkIHRvIHRoZSBkcm9wIGxpc3QuICovXG4gIGRhdGE6IFQ7XG5cbiAgLyoqIFdoZXRoZXIgYW4gaXRlbSBpbiB0aGUgbGlzdCBpcyBiZWluZyBkcmFnZ2VkLiAqL1xuICBwcml2YXRlIF9pc0RyYWdnaW5nID0gZmFsc2U7XG5cbiAgLyoqIENhY2hlIG9mIHRoZSBkaW1lbnNpb25zIG9mIGFsbCB0aGUgaXRlbXMgaW5zaWRlIHRoZSBjb250YWluZXIuICovXG4gIHByaXZhdGUgX2l0ZW1Qb3NpdGlvbnM6IENhY2hlZEl0ZW1Qb3NpdGlvbltdID0gW107XG5cbiAgLyoqIENhY2hlZCBwb3NpdGlvbnMgb2YgdGhlIHNjcm9sbGFibGUgcGFyZW50IGVsZW1lbnRzLiAqL1xuICBwcml2YXRlIF9wYXJlbnRQb3NpdGlvbnMgPSBuZXcgTWFwPERvY3VtZW50fEhUTUxFbGVtZW50LCB7XG4gICAgc2Nyb2xsUG9zaXRpb246IFNjcm9sbFBvc2l0aW9uLFxuICAgIGNsaWVudFJlY3Q/OiBDbGllbnRSZWN0XG4gIH0+KCk7XG5cbiAgLyoqIENhY2hlZCBgQ2xpZW50UmVjdGAgb2YgdGhlIGRyb3AgbGlzdC4gKi9cbiAgcHJpdmF0ZSBfY2xpZW50UmVjdDogQ2xpZW50UmVjdDtcblxuICAvKipcbiAgICogRHJhZ2dhYmxlIGl0ZW1zIHRoYXQgYXJlIGN1cnJlbnRseSBhY3RpdmUgaW5zaWRlIHRoZSBjb250YWluZXIuIEluY2x1ZGVzIHRoZSBpdGVtc1xuICAgKiBmcm9tIGBfZHJhZ2dhYmxlc2AsIGFzIHdlbGwgYXMgYW55IGl0ZW1zIHRoYXQgaGF2ZSBiZWVuIGRyYWdnZWQgaW4sIGJ1dCBoYXZlbid0XG4gICAqIGJlZW4gZHJvcHBlZCB5ZXQuXG4gICAqL1xuICBwcml2YXRlIF9hY3RpdmVEcmFnZ2FibGVzOiBEcmFnUmVmW107XG5cbiAgLyoqXG4gICAqIEtlZXBzIHRyYWNrIG9mIHRoZSBpdGVtIHRoYXQgd2FzIGxhc3Qgc3dhcHBlZCB3aXRoIHRoZSBkcmFnZ2VkIGl0ZW0sIGFzXG4gICAqIHdlbGwgYXMgd2hhdCBkaXJlY3Rpb24gdGhlIHBvaW50ZXIgd2FzIG1vdmluZyBpbiB3aGVuIHRoZSBzd2FwIG9jY3VyZWQuXG4gICAqL1xuICBwcml2YXRlIF9wcmV2aW91c1N3YXAgPSB7ZHJhZzogbnVsbCBhcyBEcmFnUmVmIHwgbnVsbCwgZGVsdGE6IDB9O1xuXG4gIC8qKiBEcmFnZ2FibGUgaXRlbXMgaW4gdGhlIGNvbnRhaW5lci4gKi9cbiAgcHJpdmF0ZSBfZHJhZ2dhYmxlczogUmVhZG9ubHlBcnJheTxEcmFnUmVmPjtcblxuICAvKiogRHJvcCBsaXN0cyB0aGF0IGFyZSBjb25uZWN0ZWQgdG8gdGhlIGN1cnJlbnQgb25lLiAqL1xuICBwcml2YXRlIF9zaWJsaW5nczogUmVhZG9ubHlBcnJheTxEcm9wTGlzdFJlZj4gPSBbXTtcblxuICAvKiogRGlyZWN0aW9uIGluIHdoaWNoIHRoZSBsaXN0IGlzIG9yaWVudGVkLiAqL1xuICBwcml2YXRlIF9vcmllbnRhdGlvbjogJ2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJyA9ICd2ZXJ0aWNhbCc7XG5cbiAgLyoqIENvbm5lY3RlZCBzaWJsaW5ncyB0aGF0IGN1cnJlbnRseSBoYXZlIGEgZHJhZ2dlZCBpdGVtLiAqL1xuICBwcml2YXRlIF9hY3RpdmVTaWJsaW5ncyA9IG5ldyBTZXQ8RHJvcExpc3RSZWY+KCk7XG5cbiAgLyoqIExheW91dCBkaXJlY3Rpb24gb2YgdGhlIGRyb3AgbGlzdC4gKi9cbiAgcHJpdmF0ZSBfZGlyZWN0aW9uOiBEaXJlY3Rpb24gPSAnbHRyJztcblxuICAvKiogU3Vic2NyaXB0aW9uIHRvIHRoZSB3aW5kb3cgYmVpbmcgc2Nyb2xsZWQuICovXG4gIHByaXZhdGUgX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuXG4gIC8qKiBWZXJ0aWNhbCBkaXJlY3Rpb24gaW4gd2hpY2ggdGhlIGxpc3QgaXMgY3VycmVudGx5IHNjcm9sbGluZy4gKi9cbiAgcHJpdmF0ZSBfdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uTk9ORTtcblxuICAvKiogSG9yaXpvbnRhbCBkaXJlY3Rpb24gaW4gd2hpY2ggdGhlIGxpc3QgaXMgY3VycmVudGx5IHNjcm9sbGluZy4gKi9cbiAgcHJpdmF0ZSBfaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLk5PTkU7XG5cbiAgLyoqIE5vZGUgdGhhdCBpcyBiZWluZyBhdXRvLXNjcm9sbGVkLiAqL1xuICBwcml2YXRlIF9zY3JvbGxOb2RlOiBIVE1MRWxlbWVudCB8IFdpbmRvdztcblxuICAvKiogVXNlZCB0byBzaWduYWwgdG8gdGhlIGN1cnJlbnQgYXV0by1zY3JvbGwgc2VxdWVuY2Ugd2hlbiB0byBzdG9wLiAqL1xuICBwcml2YXRlIF9zdG9wU2Nyb2xsVGltZXJzID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogU2hhZG93IHJvb3Qgb2YgdGhlIGN1cnJlbnQgZWxlbWVudC4gTmVjZXNzYXJ5IGZvciBgZWxlbWVudEZyb21Qb2ludGAgdG8gcmVzb2x2ZSBjb3JyZWN0bHkuICovXG4gIHByaXZhdGUgX2NhY2hlZFNoYWRvd1Jvb3Q6IERvY3VtZW50T3JTaGFkb3dSb290IHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgZG9jdW1lbnQuICovXG4gIHByaXZhdGUgX2RvY3VtZW50OiBEb2N1bWVudDtcblxuICAvKiogRWxlbWVudHMgdGhhdCBjYW4gYmUgc2Nyb2xsZWQgd2hpbGUgdGhlIHVzZXIgaXMgZHJhZ2dpbmcuICovXG4gIHByaXZhdGUgX3Njcm9sbGFibGVFbGVtZW50czogSFRNTEVsZW1lbnRbXTtcblxuICAvKiogSW5pdGlhbCB2YWx1ZSBmb3IgdGhlIGVsZW1lbnQncyBgc2Nyb2xsLXNuYXAtdHlwZWAgc3R5bGUuICovXG4gIHByaXZhdGUgX2luaXRpYWxTY3JvbGxTbmFwOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBIVE1MRWxlbWVudCxcbiAgICBwcml2YXRlIF9kcmFnRHJvcFJlZ2lzdHJ5OiBEcmFnRHJvcFJlZ2lzdHJ5PERyYWdSZWYsIERyb3BMaXN0UmVmPixcbiAgICBfZG9jdW1lbnQ6IGFueSxcbiAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICBwcml2YXRlIF92aWV3cG9ydFJ1bGVyOiBWaWV3cG9ydFJ1bGVyKSB7XG4gICAgdGhpcy5lbGVtZW50ID0gY29lcmNlRWxlbWVudChlbGVtZW50KTtcbiAgICB0aGlzLl9kb2N1bWVudCA9IF9kb2N1bWVudDtcbiAgICB0aGlzLndpdGhTY3JvbGxhYmxlUGFyZW50cyhbdGhpcy5lbGVtZW50XSk7XG4gICAgX2RyYWdEcm9wUmVnaXN0cnkucmVnaXN0ZXJEcm9wQ29udGFpbmVyKHRoaXMpO1xuICB9XG5cbiAgLyoqIFJlbW92ZXMgdGhlIGRyb3AgbGlzdCBmdW5jdGlvbmFsaXR5IGZyb20gdGhlIERPTSBlbGVtZW50LiAqL1xuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuX3N0b3BTY3JvbGxpbmcoKTtcbiAgICB0aGlzLl9zdG9wU2Nyb2xsVGltZXJzLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmJlZm9yZVN0YXJ0ZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmVudGVyZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmV4aXRlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuZHJvcHBlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuc29ydGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fYWN0aXZlU2libGluZ3MuY2xlYXIoKTtcbiAgICB0aGlzLl9zY3JvbGxOb2RlID0gbnVsbCE7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLmNsZWFyKCk7XG4gICAgdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5yZW1vdmVEcm9wQ29udGFpbmVyKHRoaXMpO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgYW4gaXRlbSBmcm9tIHRoaXMgbGlzdCBpcyBjdXJyZW50bHkgYmVpbmcgZHJhZ2dlZC4gKi9cbiAgaXNEcmFnZ2luZygpIHtcbiAgICByZXR1cm4gdGhpcy5faXNEcmFnZ2luZztcbiAgfVxuXG4gIC8qKiBTdGFydHMgZHJhZ2dpbmcgYW4gaXRlbS4gKi9cbiAgc3RhcnQoKTogdm9pZCB7XG4gICAgY29uc3Qgc3R5bGVzID0gY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpLnN0eWxlO1xuICAgIHRoaXMuYmVmb3JlU3RhcnRlZC5uZXh0KCk7XG4gICAgdGhpcy5faXNEcmFnZ2luZyA9IHRydWU7XG5cbiAgICAvLyBXZSBuZWVkIHRvIGRpc2FibGUgc2Nyb2xsIHNuYXBwaW5nIHdoaWxlIHRoZSB1c2VyIGlzIGRyYWdnaW5nLCBiZWNhdXNlIGl0IGJyZWFrcyBhdXRvbWF0aWNcbiAgICAvLyBzY3JvbGxpbmcuIFRoZSBicm93c2VyIHNlZW1zIHRvIHJvdW5kIHRoZSB2YWx1ZSBiYXNlZCBvbiB0aGUgc25hcHBpbmcgcG9pbnRzIHdoaWNoIG1lYW5zXG4gICAgLy8gdGhhdCB3ZSBjYW4ndCBpbmNyZW1lbnQvZGVjcmVtZW50IHRoZSBzY3JvbGwgcG9zaXRpb24uXG4gICAgdGhpcy5faW5pdGlhbFNjcm9sbFNuYXAgPSBzdHlsZXMubXNTY3JvbGxTbmFwVHlwZSB8fCAoc3R5bGVzIGFzIGFueSkuc2Nyb2xsU25hcFR5cGUgfHwgJyc7XG4gICAgKHN0eWxlcyBhcyBhbnkpLnNjcm9sbFNuYXBUeXBlID0gc3R5bGVzLm1zU2Nyb2xsU25hcFR5cGUgPSAnbm9uZSc7XG4gICAgdGhpcy5fY2FjaGVJdGVtcygpO1xuICAgIHRoaXMuX3NpYmxpbmdzLmZvckVhY2goc2libGluZyA9PiBzaWJsaW5nLl9zdGFydFJlY2VpdmluZyh0aGlzKSk7XG4gICAgdGhpcy5fdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9saXN0ZW5Ub1Njcm9sbEV2ZW50cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEVtaXRzIGFuIGV2ZW50IHRvIGluZGljYXRlIHRoYXQgdGhlIHVzZXIgbW92ZWQgYW4gaXRlbSBpbnRvIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdGhhdCB3YXMgbW92ZWQgaW50byB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHBvaW50ZXJZIFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqIEBwYXJhbSBpbmRleCBJbmRleCBhdCB3aGljaCB0aGUgaXRlbSBlbnRlcmVkLiBJZiBvbWl0dGVkLCB0aGUgY29udGFpbmVyIHdpbGwgdHJ5IHRvIGZpZ3VyZSBpdFxuICAgKiAgIG91dCBhdXRvbWF0aWNhbGx5LlxuICAgKi9cbiAgZW50ZXIoaXRlbTogRHJhZ1JlZiwgcG9pbnRlclg6IG51bWJlciwgcG9pbnRlclk6IG51bWJlciwgaW5kZXg/OiBudW1iZXIpOiB2b2lkIHtcbiAgICB0aGlzLnN0YXJ0KCk7XG5cbiAgICAvLyBJZiBzb3J0aW5nIGlzIGRpc2FibGVkLCB3ZSB3YW50IHRoZSBpdGVtIHRvIHJldHVybiB0byBpdHMgc3RhcnRpbmdcbiAgICAvLyBwb3NpdGlvbiBpZiB0aGUgdXNlciBpcyByZXR1cm5pbmcgaXQgdG8gaXRzIGluaXRpYWwgY29udGFpbmVyLlxuICAgIGxldCBuZXdJbmRleDogbnVtYmVyO1xuXG4gICAgaWYgKGluZGV4ID09IG51bGwpIHtcbiAgICAgIG5ld0luZGV4ID0gdGhpcy5zb3J0aW5nRGlzYWJsZWQgPyB0aGlzLl9kcmFnZ2FibGVzLmluZGV4T2YoaXRlbSkgOiAtMTtcblxuICAgICAgaWYgKG5ld0luZGV4ID09PSAtMSkge1xuICAgICAgICAvLyBXZSB1c2UgdGhlIGNvb3JkaW5hdGVzIG9mIHdoZXJlIHRoZSBpdGVtIGVudGVyZWQgdGhlIGRyb3BcbiAgICAgICAgLy8gem9uZSB0byBmaWd1cmUgb3V0IGF0IHdoaWNoIGluZGV4IGl0IHNob3VsZCBiZSBpbnNlcnRlZC5cbiAgICAgICAgbmV3SW5kZXggPSB0aGlzLl9nZXRJdGVtSW5kZXhGcm9tUG9pbnRlclBvc2l0aW9uKGl0ZW0sIHBvaW50ZXJYLCBwb2ludGVyWSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld0luZGV4ID0gaW5kZXg7XG4gICAgfVxuXG4gICAgY29uc3QgYWN0aXZlRHJhZ2dhYmxlcyA9IHRoaXMuX2FjdGl2ZURyYWdnYWJsZXM7XG4gICAgY29uc3QgY3VycmVudEluZGV4ID0gYWN0aXZlRHJhZ2dhYmxlcy5pbmRleE9mKGl0ZW0pO1xuICAgIGNvbnN0IHBsYWNlaG9sZGVyID0gaXRlbS5nZXRQbGFjZWhvbGRlckVsZW1lbnQoKTtcbiAgICBsZXQgbmV3UG9zaXRpb25SZWZlcmVuY2U6IERyYWdSZWYgfCB1bmRlZmluZWQgPSBhY3RpdmVEcmFnZ2FibGVzW25ld0luZGV4XTtcblxuICAgIC8vIElmIHRoZSBpdGVtIGF0IHRoZSBuZXcgcG9zaXRpb24gaXMgdGhlIHNhbWUgYXMgdGhlIGl0ZW0gdGhhdCBpcyBiZWluZyBkcmFnZ2VkLFxuICAgIC8vIGl0IG1lYW5zIHRoYXQgd2UncmUgdHJ5aW5nIHRvIHJlc3RvcmUgdGhlIGl0ZW0gdG8gaXRzIGluaXRpYWwgcG9zaXRpb24uIEluIHRoaXNcbiAgICAvLyBjYXNlIHdlIHNob3VsZCB1c2UgdGhlIG5leHQgaXRlbSBmcm9tIHRoZSBsaXN0IGFzIHRoZSByZWZlcmVuY2UuXG4gICAgaWYgKG5ld1Bvc2l0aW9uUmVmZXJlbmNlID09PSBpdGVtKSB7XG4gICAgICBuZXdQb3NpdGlvblJlZmVyZW5jZSA9IGFjdGl2ZURyYWdnYWJsZXNbbmV3SW5kZXggKyAxXTtcbiAgICB9XG5cbiAgICAvLyBTaW5jZSB0aGUgaXRlbSBtYXkgYmUgaW4gdGhlIGBhY3RpdmVEcmFnZ2FibGVzYCBhbHJlYWR5IChlLmcuIGlmIHRoZSB1c2VyIGRyYWdnZWQgaXRcbiAgICAvLyBpbnRvIGFub3RoZXIgY29udGFpbmVyIGFuZCBiYWNrIGFnYWluKSwgd2UgaGF2ZSB0byBlbnN1cmUgdGhhdCBpdCBpc24ndCBkdXBsaWNhdGVkLlxuICAgIGlmIChjdXJyZW50SW5kZXggPiAtMSkge1xuICAgICAgYWN0aXZlRHJhZ2dhYmxlcy5zcGxpY2UoY3VycmVudEluZGV4LCAxKTtcbiAgICB9XG5cbiAgICAvLyBEb24ndCB1c2UgaXRlbXMgdGhhdCBhcmUgYmVpbmcgZHJhZ2dlZCBhcyBhIHJlZmVyZW5jZSwgYmVjYXVzZVxuICAgIC8vIHRoZWlyIGVsZW1lbnQgaGFzIGJlZW4gbW92ZWQgZG93biB0byB0aGUgYm90dG9tIG9mIHRoZSBib2R5LlxuICAgIGlmIChuZXdQb3NpdGlvblJlZmVyZW5jZSAmJiAhdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5pc0RyYWdnaW5nKG5ld1Bvc2l0aW9uUmVmZXJlbmNlKSkge1xuICAgICAgY29uc3QgZWxlbWVudCA9IG5ld1Bvc2l0aW9uUmVmZXJlbmNlLmdldFJvb3RFbGVtZW50KCk7XG4gICAgICBlbGVtZW50LnBhcmVudEVsZW1lbnQhLmluc2VydEJlZm9yZShwbGFjZWhvbGRlciwgZWxlbWVudCk7XG4gICAgICBhY3RpdmVEcmFnZ2FibGVzLnNwbGljZShuZXdJbmRleCwgMCwgaXRlbSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KS5hcHBlbmRDaGlsZChwbGFjZWhvbGRlcik7XG4gICAgICBhY3RpdmVEcmFnZ2FibGVzLnB1c2goaXRlbSk7XG4gICAgfVxuXG4gICAgLy8gVGhlIHRyYW5zZm9ybSBuZWVkcyB0byBiZSBjbGVhcmVkIHNvIGl0IGRvZXNuJ3QgdGhyb3cgb2ZmIHRoZSBtZWFzdXJlbWVudHMuXG4gICAgcGxhY2Vob2xkZXIuc3R5bGUudHJhbnNmb3JtID0gJyc7XG5cbiAgICAvLyBOb3RlIHRoYXQgdGhlIHBvc2l0aW9ucyB3ZXJlIGFscmVhZHkgY2FjaGVkIHdoZW4gd2UgY2FsbGVkIGBzdGFydGAgYWJvdmUsXG4gICAgLy8gYnV0IHdlIG5lZWQgdG8gcmVmcmVzaCB0aGVtIHNpbmNlIHRoZSBhbW91bnQgb2YgaXRlbXMgaGFzIGNoYW5nZWQuXG4gICAgdGhpcy5fY2FjaGVJdGVtUG9zaXRpb25zKCk7XG4gICAgdGhpcy5lbnRlcmVkLm5leHQoe2l0ZW0sIGNvbnRhaW5lcjogdGhpcywgY3VycmVudEluZGV4OiB0aGlzLmdldEl0ZW1JbmRleChpdGVtKX0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYW4gaXRlbSBmcm9tIHRoZSBjb250YWluZXIgYWZ0ZXIgaXQgd2FzIGRyYWdnZWQgaW50byBhbm90aGVyIGNvbnRhaW5lciBieSB0aGUgdXNlci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB0aGF0IHdhcyBkcmFnZ2VkIG91dC5cbiAgICovXG4gIGV4aXQoaXRlbTogRHJhZ1JlZik6IHZvaWQge1xuICAgIHRoaXMuX3Jlc2V0KCk7XG4gICAgdGhpcy5leGl0ZWQubmV4dCh7aXRlbSwgY29udGFpbmVyOiB0aGlzfSk7XG4gIH1cblxuICAvKipcbiAgICogRHJvcHMgYW4gaXRlbSBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIGJlaW5nIGRyb3BwZWQgaW50byB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gY3VycmVudEluZGV4IEluZGV4IGF0IHdoaWNoIHRoZSBpdGVtIHNob3VsZCBiZSBpbnNlcnRlZC5cbiAgICogQHBhcmFtIHByZXZpb3VzQ29udGFpbmVyIENvbnRhaW5lciBmcm9tIHdoaWNoIHRoZSBpdGVtIGdvdCBkcmFnZ2VkIGluLlxuICAgKiBAcGFyYW0gaXNQb2ludGVyT3ZlckNvbnRhaW5lciBXaGV0aGVyIHRoZSB1c2VyJ3MgcG9pbnRlciB3YXMgb3ZlciB0aGVcbiAgICogICAgY29udGFpbmVyIHdoZW4gdGhlIGl0ZW0gd2FzIGRyb3BwZWQuXG4gICAqIEBwYXJhbSBkaXN0YW5jZSBEaXN0YW5jZSB0aGUgdXNlciBoYXMgZHJhZ2dlZCBzaW5jZSB0aGUgc3RhcnQgb2YgdGhlIGRyYWdnaW5nIHNlcXVlbmNlLlxuICAgKiBAcGFyYW0gcHJldmlvdXNJbmRleCBJbmRleCBvZiB0aGUgaXRlbSB3aGVuIGRyYWdnaW5nIHN0YXJ0ZWQuXG4gICAqXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMTEuMC4wIGBwcmV2aW91c0luZGV4YCBwYXJhbWV0ZXIgdG8gYmVjb21lIHJlcXVpcmVkLlxuICAgKi9cbiAgZHJvcChpdGVtOiBEcmFnUmVmLCBjdXJyZW50SW5kZXg6IG51bWJlciwgcHJldmlvdXNDb250YWluZXI6IERyb3BMaXN0UmVmLFxuICAgIGlzUG9pbnRlck92ZXJDb250YWluZXI6IGJvb2xlYW4sIGRpc3RhbmNlOiBQb2ludCwgcHJldmlvdXNJbmRleD86IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMuX3Jlc2V0KCk7XG5cbiAgICAvLyBAYnJlYWtpbmctY2hhbmdlIDExLjAuMCBSZW1vdmUgdGhpcyBmYWxsYmFjayBsb2dpYyBvbmNlIGBwcmV2aW91c0luZGV4YCBpcyBhIHJlcXVpcmVkIHBhcmFtLlxuICAgIGlmIChwcmV2aW91c0luZGV4ID09IG51bGwpIHtcbiAgICAgIHByZXZpb3VzSW5kZXggPSBwcmV2aW91c0NvbnRhaW5lci5nZXRJdGVtSW5kZXgoaXRlbSk7XG4gICAgfVxuXG4gICAgdGhpcy5kcm9wcGVkLm5leHQoe2l0ZW0sXG4gICAgICBjdXJyZW50SW5kZXgsXG4gICAgICBwcmV2aW91c0luZGV4LFxuICAgICAgY29udGFpbmVyOiB0aGlzLFxuICAgICAgcHJldmlvdXNDb250YWluZXIsXG4gICAgICBpc1BvaW50ZXJPdmVyQ29udGFpbmVyLFxuICAgICAgZGlzdGFuY2VcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBkcmFnZ2FibGUgaXRlbXMgdGhhdCBhcmUgYSBwYXJ0IG9mIHRoaXMgbGlzdC5cbiAgICogQHBhcmFtIGl0ZW1zIEl0ZW1zIHRoYXQgYXJlIGEgcGFydCBvZiB0aGlzIGxpc3QuXG4gICAqL1xuICB3aXRoSXRlbXMoaXRlbXM6IERyYWdSZWZbXSk6IHRoaXMge1xuICAgIHRoaXMuX2RyYWdnYWJsZXMgPSBpdGVtcztcbiAgICBpdGVtcy5mb3JFYWNoKGl0ZW0gPT4gaXRlbS5fd2l0aERyb3BDb250YWluZXIodGhpcykpO1xuXG4gICAgaWYgKHRoaXMuaXNEcmFnZ2luZygpKSB7XG4gICAgICB0aGlzLl9jYWNoZUl0ZW1zKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogU2V0cyB0aGUgbGF5b3V0IGRpcmVjdGlvbiBvZiB0aGUgZHJvcCBsaXN0LiAqL1xuICB3aXRoRGlyZWN0aW9uKGRpcmVjdGlvbjogRGlyZWN0aW9uKTogdGhpcyB7XG4gICAgdGhpcy5fZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGNvbnRhaW5lcnMgdGhhdCBhcmUgY29ubmVjdGVkIHRvIHRoaXMgb25lLiBXaGVuIHR3byBvciBtb3JlIGNvbnRhaW5lcnMgYXJlXG4gICAqIGNvbm5lY3RlZCwgdGhlIHVzZXIgd2lsbCBiZSBhbGxvd2VkIHRvIHRyYW5zZmVyIGl0ZW1zIGJldHdlZW4gdGhlbS5cbiAgICogQHBhcmFtIGNvbm5lY3RlZFRvIE90aGVyIGNvbnRhaW5lcnMgdGhhdCB0aGUgY3VycmVudCBjb250YWluZXJzIHNob3VsZCBiZSBjb25uZWN0ZWQgdG8uXG4gICAqL1xuICBjb25uZWN0ZWRUbyhjb25uZWN0ZWRUbzogRHJvcExpc3RSZWZbXSk6IHRoaXMge1xuICAgIHRoaXMuX3NpYmxpbmdzID0gY29ubmVjdGVkVG8uc2xpY2UoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBvcmllbnRhdGlvbiBvZiB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gb3JpZW50YXRpb24gTmV3IG9yaWVudGF0aW9uIGZvciB0aGUgY29udGFpbmVyLlxuICAgKi9cbiAgd2l0aE9yaWVudGF0aW9uKG9yaWVudGF0aW9uOiAndmVydGljYWwnIHwgJ2hvcml6b250YWwnKTogdGhpcyB7XG4gICAgdGhpcy5fb3JpZW50YXRpb24gPSBvcmllbnRhdGlvbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHdoaWNoIHBhcmVudCBlbGVtZW50cyBhcmUgY2FuIGJlIHNjcm9sbGVkIHdoaWxlIHRoZSB1c2VyIGlzIGRyYWdnaW5nLlxuICAgKiBAcGFyYW0gZWxlbWVudHMgRWxlbWVudHMgdGhhdCBjYW4gYmUgc2Nyb2xsZWQuXG4gICAqL1xuICB3aXRoU2Nyb2xsYWJsZVBhcmVudHMoZWxlbWVudHM6IEhUTUxFbGVtZW50W10pOiB0aGlzIHtcbiAgICBjb25zdCBlbGVtZW50ID0gY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpO1xuXG4gICAgLy8gV2UgYWx3YXlzIGFsbG93IHRoZSBjdXJyZW50IGVsZW1lbnQgdG8gYmUgc2Nyb2xsYWJsZVxuICAgIC8vIHNvIHdlIG5lZWQgdG8gZW5zdXJlIHRoYXQgaXQncyBpbiB0aGUgYXJyYXkuXG4gICAgdGhpcy5fc2Nyb2xsYWJsZUVsZW1lbnRzID1cbiAgICAgICAgZWxlbWVudHMuaW5kZXhPZihlbGVtZW50KSA9PT0gLTEgPyBbZWxlbWVudCwgLi4uZWxlbWVudHNdIDogZWxlbWVudHMuc2xpY2UoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBGaWd1cmVzIG91dCB0aGUgaW5kZXggb2YgYW4gaXRlbSBpbiB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHdob3NlIGluZGV4IHNob3VsZCBiZSBkZXRlcm1pbmVkLlxuICAgKi9cbiAgZ2V0SXRlbUluZGV4KGl0ZW06IERyYWdSZWYpOiBudW1iZXIge1xuICAgIGlmICghdGhpcy5faXNEcmFnZ2luZykge1xuICAgICAgcmV0dXJuIHRoaXMuX2RyYWdnYWJsZXMuaW5kZXhPZihpdGVtKTtcbiAgICB9XG5cbiAgICAvLyBJdGVtcyBhcmUgc29ydGVkIGFsd2F5cyBieSB0b3AvbGVmdCBpbiB0aGUgY2FjaGUsIGhvd2V2ZXIgdGhleSBmbG93IGRpZmZlcmVudGx5IGluIFJUTC5cbiAgICAvLyBUaGUgcmVzdCBvZiB0aGUgbG9naWMgc3RpbGwgc3RhbmRzIG5vIG1hdHRlciB3aGF0IG9yaWVudGF0aW9uIHdlJ3JlIGluLCBob3dldmVyXG4gICAgLy8gd2UgbmVlZCB0byBpbnZlcnQgdGhlIGFycmF5IHdoZW4gZGV0ZXJtaW5pbmcgdGhlIGluZGV4LlxuICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5fb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJyAmJiB0aGlzLl9kaXJlY3Rpb24gPT09ICdydGwnID9cbiAgICAgICAgdGhpcy5faXRlbVBvc2l0aW9ucy5zbGljZSgpLnJldmVyc2UoKSA6IHRoaXMuX2l0ZW1Qb3NpdGlvbnM7XG5cbiAgICByZXR1cm4gZmluZEluZGV4KGl0ZW1zLCBjdXJyZW50SXRlbSA9PiBjdXJyZW50SXRlbS5kcmFnID09PSBpdGVtKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBsaXN0IGlzIGFibGUgdG8gcmVjZWl2ZSB0aGUgaXRlbSB0aGF0XG4gICAqIGlzIGN1cnJlbnRseSBiZWluZyBkcmFnZ2VkIGluc2lkZSBhIGNvbm5lY3RlZCBkcm9wIGxpc3QuXG4gICAqL1xuICBpc1JlY2VpdmluZygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fYWN0aXZlU2libGluZ3Muc2l6ZSA+IDA7XG4gIH1cblxuICAvKipcbiAgICogU29ydHMgYW4gaXRlbSBpbnNpZGUgdGhlIGNvbnRhaW5lciBiYXNlZCBvbiBpdHMgcG9zaXRpb24uXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdG8gYmUgc29ydGVkLlxuICAgKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHBvaW50ZXJZIFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyRGVsdGEgRGlyZWN0aW9uIGluIHdoaWNoIHRoZSBwb2ludGVyIGlzIG1vdmluZyBhbG9uZyBlYWNoIGF4aXMuXG4gICAqL1xuICBfc29ydEl0ZW0oaXRlbTogRHJhZ1JlZiwgcG9pbnRlclg6IG51bWJlciwgcG9pbnRlclk6IG51bWJlcixcbiAgICAgICAgICAgIHBvaW50ZXJEZWx0YToge3g6IG51bWJlciwgeTogbnVtYmVyfSk6IHZvaWQge1xuICAgIC8vIERvbid0IHNvcnQgdGhlIGl0ZW0gaWYgc29ydGluZyBpcyBkaXNhYmxlZCBvciBpdCdzIG91dCBvZiByYW5nZS5cbiAgICBpZiAodGhpcy5zb3J0aW5nRGlzYWJsZWQgfHwgIWlzUG9pbnRlck5lYXJDbGllbnRSZWN0KHRoaXMuX2NsaWVudFJlY3QsIHBvaW50ZXJYLCBwb2ludGVyWSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzaWJsaW5ncyA9IHRoaXMuX2l0ZW1Qb3NpdGlvbnM7XG4gICAgY29uc3QgbmV3SW5kZXggPSB0aGlzLl9nZXRJdGVtSW5kZXhGcm9tUG9pbnRlclBvc2l0aW9uKGl0ZW0sIHBvaW50ZXJYLCBwb2ludGVyWSwgcG9pbnRlckRlbHRhKTtcblxuICAgIGlmIChuZXdJbmRleCA9PT0gLTEgJiYgc2libGluZ3MubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCc7XG4gICAgY29uc3QgY3VycmVudEluZGV4ID0gZmluZEluZGV4KHNpYmxpbmdzLCBjdXJyZW50SXRlbSA9PiBjdXJyZW50SXRlbS5kcmFnID09PSBpdGVtKTtcbiAgICBjb25zdCBzaWJsaW5nQXROZXdQb3NpdGlvbiA9IHNpYmxpbmdzW25ld0luZGV4XTtcbiAgICBjb25zdCBjdXJyZW50UG9zaXRpb24gPSBzaWJsaW5nc1tjdXJyZW50SW5kZXhdLmNsaWVudFJlY3Q7XG4gICAgY29uc3QgbmV3UG9zaXRpb24gPSBzaWJsaW5nQXROZXdQb3NpdGlvbi5jbGllbnRSZWN0O1xuICAgIGNvbnN0IGRlbHRhID0gY3VycmVudEluZGV4ID4gbmV3SW5kZXggPyAxIDogLTE7XG5cbiAgICB0aGlzLl9wcmV2aW91c1N3YXAuZHJhZyA9IHNpYmxpbmdBdE5ld1Bvc2l0aW9uLmRyYWc7XG4gICAgdGhpcy5fcHJldmlvdXNTd2FwLmRlbHRhID0gaXNIb3Jpem9udGFsID8gcG9pbnRlckRlbHRhLnggOiBwb2ludGVyRGVsdGEueTtcblxuICAgIC8vIEhvdyBtYW55IHBpeGVscyB0aGUgaXRlbSdzIHBsYWNlaG9sZGVyIHNob3VsZCBiZSBvZmZzZXQuXG4gICAgY29uc3QgaXRlbU9mZnNldCA9IHRoaXMuX2dldEl0ZW1PZmZzZXRQeChjdXJyZW50UG9zaXRpb24sIG5ld1Bvc2l0aW9uLCBkZWx0YSk7XG5cbiAgICAvLyBIb3cgbWFueSBwaXhlbHMgYWxsIHRoZSBvdGhlciBpdGVtcyBzaG91bGQgYmUgb2Zmc2V0LlxuICAgIGNvbnN0IHNpYmxpbmdPZmZzZXQgPSB0aGlzLl9nZXRTaWJsaW5nT2Zmc2V0UHgoY3VycmVudEluZGV4LCBzaWJsaW5ncywgZGVsdGEpO1xuXG4gICAgLy8gU2F2ZSB0aGUgcHJldmlvdXMgb3JkZXIgb2YgdGhlIGl0ZW1zIGJlZm9yZSBtb3ZpbmcgdGhlIGl0ZW0gdG8gaXRzIG5ldyBpbmRleC5cbiAgICAvLyBXZSB1c2UgdGhpcyB0byBjaGVjayB3aGV0aGVyIGFuIGl0ZW0gaGFzIGJlZW4gbW92ZWQgYXMgYSByZXN1bHQgb2YgdGhlIHNvcnRpbmcuXG4gICAgY29uc3Qgb2xkT3JkZXIgPSBzaWJsaW5ncy5zbGljZSgpO1xuXG4gICAgLy8gU2h1ZmZsZSB0aGUgYXJyYXkgaW4gcGxhY2UuXG4gICAgbW92ZUl0ZW1JbkFycmF5KHNpYmxpbmdzLCBjdXJyZW50SW5kZXgsIG5ld0luZGV4KTtcblxuICAgIHRoaXMuc29ydGVkLm5leHQoe1xuICAgICAgcHJldmlvdXNJbmRleDogY3VycmVudEluZGV4LFxuICAgICAgY3VycmVudEluZGV4OiBuZXdJbmRleCxcbiAgICAgIGNvbnRhaW5lcjogdGhpcyxcbiAgICAgIGl0ZW1cbiAgICB9KTtcblxuICAgIHNpYmxpbmdzLmZvckVhY2goKHNpYmxpbmcsIGluZGV4KSA9PiB7XG4gICAgICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiB0aGUgcG9zaXRpb24gaGFzbid0IGNoYW5nZWQuXG4gICAgICBpZiAob2xkT3JkZXJbaW5kZXhdID09PSBzaWJsaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgaXNEcmFnZ2VkSXRlbSA9IHNpYmxpbmcuZHJhZyA9PT0gaXRlbTtcbiAgICAgIGNvbnN0IG9mZnNldCA9IGlzRHJhZ2dlZEl0ZW0gPyBpdGVtT2Zmc2V0IDogc2libGluZ09mZnNldDtcbiAgICAgIGNvbnN0IGVsZW1lbnRUb09mZnNldCA9IGlzRHJhZ2dlZEl0ZW0gPyBpdGVtLmdldFBsYWNlaG9sZGVyRWxlbWVudCgpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWJsaW5nLmRyYWcuZ2V0Um9vdEVsZW1lbnQoKTtcblxuICAgICAgLy8gVXBkYXRlIHRoZSBvZmZzZXQgdG8gcmVmbGVjdCB0aGUgbmV3IHBvc2l0aW9uLlxuICAgICAgc2libGluZy5vZmZzZXQgKz0gb2Zmc2V0O1xuXG4gICAgICAvLyBTaW5jZSB3ZSdyZSBtb3ZpbmcgdGhlIGl0ZW1zIHdpdGggYSBgdHJhbnNmb3JtYCwgd2UgbmVlZCB0byBhZGp1c3QgdGhlaXIgY2FjaGVkXG4gICAgICAvLyBjbGllbnQgcmVjdHMgdG8gcmVmbGVjdCB0aGVpciBuZXcgcG9zaXRpb24sIGFzIHdlbGwgYXMgc3dhcCB0aGVpciBwb3NpdGlvbnMgaW4gdGhlIGNhY2hlLlxuICAgICAgLy8gTm90ZSB0aGF0IHdlIHNob3VsZG4ndCB1c2UgYGdldEJvdW5kaW5nQ2xpZW50UmVjdGAgaGVyZSB0byB1cGRhdGUgdGhlIGNhY2hlLCBiZWNhdXNlIHRoZVxuICAgICAgLy8gZWxlbWVudHMgbWF5IGJlIG1pZC1hbmltYXRpb24gd2hpY2ggd2lsbCBnaXZlIHVzIGEgd3JvbmcgcmVzdWx0LlxuICAgICAgaWYgKGlzSG9yaXpvbnRhbCkge1xuICAgICAgICAvLyBSb3VuZCB0aGUgdHJhbnNmb3JtcyBzaW5jZSBzb21lIGJyb3dzZXJzIHdpbGxcbiAgICAgICAgLy8gYmx1ciB0aGUgZWxlbWVudHMsIGZvciBzdWItcGl4ZWwgdHJhbnNmb3Jtcy5cbiAgICAgICAgZWxlbWVudFRvT2Zmc2V0LnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGUzZCgke01hdGgucm91bmQoc2libGluZy5vZmZzZXQpfXB4LCAwLCAwKWA7XG4gICAgICAgIGFkanVzdENsaWVudFJlY3Qoc2libGluZy5jbGllbnRSZWN0LCAwLCBvZmZzZXQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWxlbWVudFRvT2Zmc2V0LnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGUzZCgwLCAke01hdGgucm91bmQoc2libGluZy5vZmZzZXQpfXB4LCAwKWA7XG4gICAgICAgIGFkanVzdENsaWVudFJlY3Qoc2libGluZy5jbGllbnRSZWN0LCBvZmZzZXQsIDApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSB1c2VyJ3MgcG9pbnRlciBpcyBjbG9zZSB0byB0aGUgZWRnZXMgb2YgZWl0aGVyIHRoZVxuICAgKiB2aWV3cG9ydCBvciB0aGUgZHJvcCBsaXN0IGFuZCBzdGFydHMgdGhlIGF1dG8tc2Nyb2xsIHNlcXVlbmNlLlxuICAgKiBAcGFyYW0gcG9pbnRlclggVXNlcidzIHBvaW50ZXIgcG9zaXRpb24gYWxvbmcgdGhlIHggYXhpcy5cbiAgICogQHBhcmFtIHBvaW50ZXJZIFVzZXIncyBwb2ludGVyIHBvc2l0aW9uIGFsb25nIHRoZSB5IGF4aXMuXG4gICAqL1xuICBfc3RhcnRTY3JvbGxpbmdJZk5lY2Vzc2FyeShwb2ludGVyWDogbnVtYmVyLCBwb2ludGVyWTogbnVtYmVyKSB7XG4gICAgaWYgKHRoaXMuYXV0b1Njcm9sbERpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IHNjcm9sbE5vZGU6IEhUTUxFbGVtZW50IHwgV2luZG93IHwgdW5kZWZpbmVkO1xuICAgIGxldCB2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5OT05FO1xuICAgIGxldCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTk9ORTtcblxuICAgIC8vIENoZWNrIHdoZXRoZXIgd2Ugc2hvdWxkIHN0YXJ0IHNjcm9sbGluZyBhbnkgb2YgdGhlIHBhcmVudCBjb250YWluZXJzLlxuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5mb3JFYWNoKChwb3NpdGlvbiwgZWxlbWVudCkgPT4ge1xuICAgICAgLy8gV2UgaGF2ZSBzcGVjaWFsIGhhbmRsaW5nIGZvciB0aGUgYGRvY3VtZW50YCBiZWxvdy4gQWxzbyB0aGlzIHdvdWxkIGJlXG4gICAgICAvLyBuaWNlciB3aXRoIGEgIGZvci4uLm9mIGxvb3AsIGJ1dCBpdCByZXF1aXJlcyBjaGFuZ2luZyBhIGNvbXBpbGVyIGZsYWcuXG4gICAgICBpZiAoZWxlbWVudCA9PT0gdGhpcy5fZG9jdW1lbnQgfHwgIXBvc2l0aW9uLmNsaWVudFJlY3QgfHwgc2Nyb2xsTm9kZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChpc1BvaW50ZXJOZWFyQ2xpZW50UmVjdChwb3NpdGlvbi5jbGllbnRSZWN0LCBwb2ludGVyWCwgcG9pbnRlclkpKSB7XG4gICAgICAgIFt2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiwgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbl0gPSBnZXRFbGVtZW50U2Nyb2xsRGlyZWN0aW9ucyhcbiAgICAgICAgICAgIGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQsIHBvc2l0aW9uLmNsaWVudFJlY3QsIHBvaW50ZXJYLCBwb2ludGVyWSk7XG5cbiAgICAgICAgaWYgKHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uIHx8IGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24pIHtcbiAgICAgICAgICBzY3JvbGxOb2RlID0gZWxlbWVudCBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gT3RoZXJ3aXNlIGNoZWNrIGlmIHdlIGNhbiBzdGFydCBzY3JvbGxpbmcgdGhlIHZpZXdwb3J0LlxuICAgIGlmICghdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gJiYgIWhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24pIHtcbiAgICAgIGNvbnN0IHt3aWR0aCwgaGVpZ2h0fSA9IHRoaXMuX3ZpZXdwb3J0UnVsZXIuZ2V0Vmlld3BvcnRTaXplKCk7XG4gICAgICBjb25zdCBjbGllbnRSZWN0ID0ge3dpZHRoLCBoZWlnaHQsIHRvcDogMCwgcmlnaHQ6IHdpZHRoLCBib3R0b206IGhlaWdodCwgbGVmdDogMH07XG4gICAgICB2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IGdldFZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uKGNsaWVudFJlY3QsIHBvaW50ZXJZKTtcbiAgICAgIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBnZXRIb3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKGNsaWVudFJlY3QsIHBvaW50ZXJYKTtcbiAgICAgIHNjcm9sbE5vZGUgPSB3aW5kb3c7XG4gICAgfVxuXG4gICAgaWYgKHNjcm9sbE5vZGUgJiYgKHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uICE9PSB0aGlzLl92ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiB8fFxuICAgICAgICBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uICE9PSB0aGlzLl9ob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uIHx8XG4gICAgICAgIHNjcm9sbE5vZGUgIT09IHRoaXMuX3Njcm9sbE5vZGUpKSB7XG4gICAgICB0aGlzLl92ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uO1xuICAgICAgdGhpcy5faG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb247XG4gICAgICB0aGlzLl9zY3JvbGxOb2RlID0gc2Nyb2xsTm9kZTtcblxuICAgICAgaWYgKCh2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiB8fCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKSAmJiBzY3JvbGxOb2RlKSB7XG4gICAgICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcih0aGlzLl9zdGFydFNjcm9sbEludGVydmFsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3N0b3BTY3JvbGxpbmcoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogU3RvcHMgYW55IGN1cnJlbnRseS1ydW5uaW5nIGF1dG8tc2Nyb2xsIHNlcXVlbmNlcy4gKi9cbiAgX3N0b3BTY3JvbGxpbmcoKSB7XG4gICAgdGhpcy5fc3RvcFNjcm9sbFRpbWVycy5uZXh0KCk7XG4gIH1cblxuICAvKiogQ2FjaGVzIHRoZSBwb3NpdGlvbnMgb2YgdGhlIGNvbmZpZ3VyZWQgc2Nyb2xsYWJsZSBwYXJlbnRzLiAqL1xuICBwcml2YXRlIF9jYWNoZVBhcmVudFBvc2l0aW9ucygpIHtcbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuY2xlYXIoKTtcbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuc2V0KHRoaXMuX2RvY3VtZW50LCB7XG4gICAgICBzY3JvbGxQb3NpdGlvbjogdGhpcy5fdmlld3BvcnRSdWxlciEuZ2V0Vmlld3BvcnRTY3JvbGxQb3NpdGlvbigpLFxuICAgIH0pO1xuICAgIHRoaXMuX3Njcm9sbGFibGVFbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgY29uc3QgY2xpZW50UmVjdCA9IGdldE11dGFibGVDbGllbnRSZWN0KGVsZW1lbnQpO1xuXG4gICAgICAvLyBXZSBrZWVwIHRoZSBDbGllbnRSZWN0IGNhY2hlZCBpbiB0d28gcHJvcGVydGllcywgYmVjYXVzZSBpdCdzIHJlZmVyZW5jZWQgaW4gYSBsb3Qgb2ZcbiAgICAgIC8vIHBlcmZvcm1hbmNlLXNlbnNpdGl2ZSBwbGFjZXMgYW5kIHdlIHdhbnQgdG8gYXZvaWQgdGhlIGV4dHJhIGxvb2t1cHMuIFRoZSBgZWxlbWVudGAgaXNcbiAgICAgIC8vIGd1YXJhbnRlZWQgdG8gYWx3YXlzIGJlIGluIHRoZSBgX3Njcm9sbGFibGVFbGVtZW50c2Agc28gdGhpcyBzaG91bGQgYWx3YXlzIG1hdGNoLlxuICAgICAgaWYgKGVsZW1lbnQgPT09IHRoaXMuZWxlbWVudCkge1xuICAgICAgICB0aGlzLl9jbGllbnRSZWN0ID0gY2xpZW50UmVjdDtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLnNldChlbGVtZW50LCB7XG4gICAgICAgIHNjcm9sbFBvc2l0aW9uOiB7dG9wOiBlbGVtZW50LnNjcm9sbFRvcCwgbGVmdDogZWxlbWVudC5zY3JvbGxMZWZ0fSxcbiAgICAgICAgY2xpZW50UmVjdFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogUmVmcmVzaGVzIHRoZSBwb3NpdGlvbiBjYWNoZSBvZiB0aGUgaXRlbXMgYW5kIHNpYmxpbmcgY29udGFpbmVycy4gKi9cbiAgcHJpdmF0ZSBfY2FjaGVJdGVtUG9zaXRpb25zKCkge1xuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCc7XG5cbiAgICB0aGlzLl9pdGVtUG9zaXRpb25zID0gdGhpcy5fYWN0aXZlRHJhZ2dhYmxlcy5tYXAoZHJhZyA9PiB7XG4gICAgICBjb25zdCBlbGVtZW50VG9NZWFzdXJlID0gZHJhZy5nZXRWaXNpYmxlRWxlbWVudCgpO1xuICAgICAgcmV0dXJuIHtkcmFnLCBvZmZzZXQ6IDAsIGNsaWVudFJlY3Q6IGdldE11dGFibGVDbGllbnRSZWN0KGVsZW1lbnRUb01lYXN1cmUpfTtcbiAgICB9KS5zb3J0KChhLCBiKSA9PiB7XG4gICAgICByZXR1cm4gaXNIb3Jpem9udGFsID8gYS5jbGllbnRSZWN0LmxlZnQgLSBiLmNsaWVudFJlY3QubGVmdCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYS5jbGllbnRSZWN0LnRvcCAtIGIuY2xpZW50UmVjdC50b3A7XG4gICAgfSk7XG4gIH1cblxuICAvKiogUmVzZXRzIHRoZSBjb250YWluZXIgdG8gaXRzIGluaXRpYWwgc3RhdGUuICovXG4gIHByaXZhdGUgX3Jlc2V0KCkge1xuICAgIHRoaXMuX2lzRHJhZ2dpbmcgPSBmYWxzZTtcblxuICAgIGNvbnN0IHN0eWxlcyA9IGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KS5zdHlsZTtcbiAgICAoc3R5bGVzIGFzIGFueSkuc2Nyb2xsU25hcFR5cGUgPSBzdHlsZXMubXNTY3JvbGxTbmFwVHlwZSA9IHRoaXMuX2luaXRpYWxTY3JvbGxTbmFwO1xuXG4gICAgLy8gVE9ETyhjcmlzYmV0byk6IG1heSBoYXZlIHRvIHdhaXQgZm9yIHRoZSBhbmltYXRpb25zIHRvIGZpbmlzaC5cbiAgICB0aGlzLl9hY3RpdmVEcmFnZ2FibGVzLmZvckVhY2goaXRlbSA9PiBpdGVtLmdldFJvb3RFbGVtZW50KCkuc3R5bGUudHJhbnNmb3JtID0gJycpO1xuICAgIHRoaXMuX3NpYmxpbmdzLmZvckVhY2goc2libGluZyA9PiBzaWJsaW5nLl9zdG9wUmVjZWl2aW5nKHRoaXMpKTtcbiAgICB0aGlzLl9hY3RpdmVEcmFnZ2FibGVzID0gW107XG4gICAgdGhpcy5faXRlbVBvc2l0aW9ucyA9IFtdO1xuICAgIHRoaXMuX3ByZXZpb3VzU3dhcC5kcmFnID0gbnVsbDtcbiAgICB0aGlzLl9wcmV2aW91c1N3YXAuZGVsdGEgPSAwO1xuICAgIHRoaXMuX3N0b3BTY3JvbGxpbmcoKTtcbiAgICB0aGlzLl92aWV3cG9ydFNjcm9sbFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5jbGVhcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG9mZnNldCBpbiBwaXhlbHMgYnkgd2hpY2ggdGhlIGl0ZW1zIHRoYXQgYXJlbid0IGJlaW5nIGRyYWdnZWQgc2hvdWxkIGJlIG1vdmVkLlxuICAgKiBAcGFyYW0gY3VycmVudEluZGV4IEluZGV4IG9mIHRoZSBpdGVtIGN1cnJlbnRseSBiZWluZyBkcmFnZ2VkLlxuICAgKiBAcGFyYW0gc2libGluZ3MgQWxsIG9mIHRoZSBpdGVtcyBpbiB0aGUgbGlzdC5cbiAgICogQHBhcmFtIGRlbHRhIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgdXNlciBpcyBtb3ZpbmcuXG4gICAqL1xuICBwcml2YXRlIF9nZXRTaWJsaW5nT2Zmc2V0UHgoY3VycmVudEluZGV4OiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWJsaW5nczogQ2FjaGVkSXRlbVBvc2l0aW9uW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWx0YTogMSB8IC0xKSB7XG5cbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuICAgIGNvbnN0IGN1cnJlbnRQb3NpdGlvbiA9IHNpYmxpbmdzW2N1cnJlbnRJbmRleF0uY2xpZW50UmVjdDtcbiAgICBjb25zdCBpbW1lZGlhdGVTaWJsaW5nID0gc2libGluZ3NbY3VycmVudEluZGV4ICsgZGVsdGEgKiAtMV07XG4gICAgbGV0IHNpYmxpbmdPZmZzZXQgPSBjdXJyZW50UG9zaXRpb25baXNIb3Jpem9udGFsID8gJ3dpZHRoJyA6ICdoZWlnaHQnXSAqIGRlbHRhO1xuXG4gICAgaWYgKGltbWVkaWF0ZVNpYmxpbmcpIHtcbiAgICAgIGNvbnN0IHN0YXJ0ID0gaXNIb3Jpem9udGFsID8gJ2xlZnQnIDogJ3RvcCc7XG4gICAgICBjb25zdCBlbmQgPSBpc0hvcml6b250YWwgPyAncmlnaHQnIDogJ2JvdHRvbSc7XG5cbiAgICAgIC8vIEdldCB0aGUgc3BhY2luZyBiZXR3ZWVuIHRoZSBzdGFydCBvZiB0aGUgY3VycmVudCBpdGVtIGFuZCB0aGUgZW5kIG9mIHRoZSBvbmUgaW1tZWRpYXRlbHlcbiAgICAgIC8vIGFmdGVyIGl0IGluIHRoZSBkaXJlY3Rpb24gaW4gd2hpY2ggdGhlIHVzZXIgaXMgZHJhZ2dpbmcsIG9yIHZpY2UgdmVyc2EuIFdlIGFkZCBpdCB0byB0aGVcbiAgICAgIC8vIG9mZnNldCBpbiBvcmRlciB0byBwdXNoIHRoZSBlbGVtZW50IHRvIHdoZXJlIGl0IHdpbGwgYmUgd2hlbiBpdCdzIGlubGluZSBhbmQgaXMgaW5mbHVlbmNlZFxuICAgICAgLy8gYnkgdGhlIGBtYXJnaW5gIG9mIGl0cyBzaWJsaW5ncy5cbiAgICAgIGlmIChkZWx0YSA9PT0gLTEpIHtcbiAgICAgICAgc2libGluZ09mZnNldCAtPSBpbW1lZGlhdGVTaWJsaW5nLmNsaWVudFJlY3Rbc3RhcnRdIC0gY3VycmVudFBvc2l0aW9uW2VuZF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzaWJsaW5nT2Zmc2V0ICs9IGN1cnJlbnRQb3NpdGlvbltzdGFydF0gLSBpbW1lZGlhdGVTaWJsaW5nLmNsaWVudFJlY3RbZW5kXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2libGluZ09mZnNldDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBvZmZzZXQgaW4gcGl4ZWxzIGJ5IHdoaWNoIHRoZSBpdGVtIHRoYXQgaXMgYmVpbmcgZHJhZ2dlZCBzaG91bGQgYmUgbW92ZWQuXG4gICAqIEBwYXJhbSBjdXJyZW50UG9zaXRpb24gQ3VycmVudCBwb3NpdGlvbiBvZiB0aGUgaXRlbS5cbiAgICogQHBhcmFtIG5ld1Bvc2l0aW9uIFBvc2l0aW9uIG9mIHRoZSBpdGVtIHdoZXJlIHRoZSBjdXJyZW50IGl0ZW0gc2hvdWxkIGJlIG1vdmVkLlxuICAgKiBAcGFyYW0gZGVsdGEgRGlyZWN0aW9uIGluIHdoaWNoIHRoZSB1c2VyIGlzIG1vdmluZy5cbiAgICovXG4gIHByaXZhdGUgX2dldEl0ZW1PZmZzZXRQeChjdXJyZW50UG9zaXRpb246IENsaWVudFJlY3QsIG5ld1Bvc2l0aW9uOiBDbGllbnRSZWN0LCBkZWx0YTogMSB8IC0xKSB7XG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gdGhpcy5fb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJztcbiAgICBsZXQgaXRlbU9mZnNldCA9IGlzSG9yaXpvbnRhbCA/IG5ld1Bvc2l0aW9uLmxlZnQgLSBjdXJyZW50UG9zaXRpb24ubGVmdCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdQb3NpdGlvbi50b3AgLSBjdXJyZW50UG9zaXRpb24udG9wO1xuXG4gICAgLy8gQWNjb3VudCBmb3IgZGlmZmVyZW5jZXMgaW4gdGhlIGl0ZW0gd2lkdGgvaGVpZ2h0LlxuICAgIGlmIChkZWx0YSA9PT0gLTEpIHtcbiAgICAgIGl0ZW1PZmZzZXQgKz0gaXNIb3Jpem9udGFsID8gbmV3UG9zaXRpb24ud2lkdGggLSBjdXJyZW50UG9zaXRpb24ud2lkdGggOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdQb3NpdGlvbi5oZWlnaHQgLSBjdXJyZW50UG9zaXRpb24uaGVpZ2h0O1xuICAgIH1cblxuICAgIHJldHVybiBpdGVtT2Zmc2V0O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGluZGV4IG9mIGFuIGl0ZW0gaW4gdGhlIGRyb3AgY29udGFpbmVyLCBiYXNlZCBvbiB0aGUgcG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRoYXQgaXMgYmVpbmcgc29ydGVkLlxuICAgKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIFkgYXhpcy5cbiAgICogQHBhcmFtIGRlbHRhIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgdXNlciBpcyBtb3ZpbmcgdGhlaXIgcG9pbnRlci5cbiAgICovXG4gIHByaXZhdGUgX2dldEl0ZW1JbmRleEZyb21Qb2ludGVyUG9zaXRpb24oaXRlbTogRHJhZ1JlZiwgcG9pbnRlclg6IG51bWJlciwgcG9pbnRlclk6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWx0YT86IHt4OiBudW1iZXIsIHk6IG51bWJlcn0pIHtcbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuXG4gICAgcmV0dXJuIGZpbmRJbmRleCh0aGlzLl9pdGVtUG9zaXRpb25zLCAoe2RyYWcsIGNsaWVudFJlY3R9LCBfLCBhcnJheSkgPT4ge1xuICAgICAgaWYgKGRyYWcgPT09IGl0ZW0pIHtcbiAgICAgICAgLy8gSWYgdGhlcmUncyBvbmx5IG9uZSBpdGVtIGxlZnQgaW4gdGhlIGNvbnRhaW5lciwgaXQgbXVzdCBiZVxuICAgICAgICAvLyB0aGUgZHJhZ2dlZCBpdGVtIGl0c2VsZiBzbyB3ZSB1c2UgaXQgYXMgYSByZWZlcmVuY2UuXG4gICAgICAgIHJldHVybiBhcnJheS5sZW5ndGggPCAyO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGVsdGEpIHtcbiAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gaXNIb3Jpem9udGFsID8gZGVsdGEueCA6IGRlbHRhLnk7XG5cbiAgICAgICAgLy8gSWYgdGhlIHVzZXIgaXMgc3RpbGwgaG92ZXJpbmcgb3ZlciB0aGUgc2FtZSBpdGVtIGFzIGxhc3QgdGltZSwgYW5kIHRoZXkgZGlkbid0IGNoYW5nZVxuICAgICAgICAvLyB0aGUgZGlyZWN0aW9uIGluIHdoaWNoIHRoZXkncmUgZHJhZ2dpbmcsIHdlIGRvbid0IGNvbnNpZGVyIGl0IGEgZGlyZWN0aW9uIHN3YXAuXG4gICAgICAgIGlmIChkcmFnID09PSB0aGlzLl9wcmV2aW91c1N3YXAuZHJhZyAmJiBkaXJlY3Rpb24gPT09IHRoaXMuX3ByZXZpb3VzU3dhcC5kZWx0YSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gaXNIb3Jpem9udGFsID9cbiAgICAgICAgICAvLyBSb3VuZCB0aGVzZSBkb3duIHNpbmNlIG1vc3QgYnJvd3NlcnMgcmVwb3J0IGNsaWVudCByZWN0cyB3aXRoXG4gICAgICAgICAgLy8gc3ViLXBpeGVsIHByZWNpc2lvbiwgd2hlcmVhcyB0aGUgcG9pbnRlciBjb29yZGluYXRlcyBhcmUgcm91bmRlZCB0byBwaXhlbHMuXG4gICAgICAgICAgcG9pbnRlclggPj0gTWF0aC5mbG9vcihjbGllbnRSZWN0LmxlZnQpICYmIHBvaW50ZXJYIDw9IE1hdGguZmxvb3IoY2xpZW50UmVjdC5yaWdodCkgOlxuICAgICAgICAgIHBvaW50ZXJZID49IE1hdGguZmxvb3IoY2xpZW50UmVjdC50b3ApICYmIHBvaW50ZXJZIDw9IE1hdGguZmxvb3IoY2xpZW50UmVjdC5ib3R0b20pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIENhY2hlcyB0aGUgY3VycmVudCBpdGVtcyBpbiB0aGUgbGlzdCBhbmQgdGhlaXIgcG9zaXRpb25zLiAqL1xuICBwcml2YXRlIF9jYWNoZUl0ZW1zKCk6IHZvaWQge1xuICAgIHRoaXMuX2FjdGl2ZURyYWdnYWJsZXMgPSB0aGlzLl9kcmFnZ2FibGVzLnNsaWNlKCk7XG4gICAgdGhpcy5fY2FjaGVJdGVtUG9zaXRpb25zKCk7XG4gICAgdGhpcy5fY2FjaGVQYXJlbnRQb3NpdGlvbnMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBpbnRlcm5hbCBzdGF0ZSBvZiB0aGUgY29udGFpbmVyIGFmdGVyIGEgc2Nyb2xsIGV2ZW50IGhhcyBoYXBwZW5lZC5cbiAgICogQHBhcmFtIHNjcm9sbGVkUGFyZW50IEVsZW1lbnQgdGhhdCB3YXMgc2Nyb2xsZWQuXG4gICAqIEBwYXJhbSBuZXdUb3AgTmV3IHRvcCBzY3JvbGwgcG9zaXRpb24uXG4gICAqIEBwYXJhbSBuZXdMZWZ0IE5ldyBsZWZ0IHNjcm9sbCBwb3NpdGlvbi5cbiAgICovXG4gIHByaXZhdGUgX3VwZGF0ZUFmdGVyU2Nyb2xsKHNjcm9sbGVkUGFyZW50OiBIVE1MRWxlbWVudCB8IERvY3VtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdUb3A6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3TGVmdDogbnVtYmVyKSB7XG4gICAgY29uc3Qgc2Nyb2xsUG9zaXRpb24gPSB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuZ2V0KHNjcm9sbGVkUGFyZW50KSEuc2Nyb2xsUG9zaXRpb247XG4gICAgY29uc3QgdG9wRGlmZmVyZW5jZSA9IHNjcm9sbFBvc2l0aW9uLnRvcCAtIG5ld1RvcDtcbiAgICBjb25zdCBsZWZ0RGlmZmVyZW5jZSA9IHNjcm9sbFBvc2l0aW9uLmxlZnQgLSBuZXdMZWZ0O1xuXG4gICAgLy8gR28gdGhyb3VnaCBhbmQgdXBkYXRlIHRoZSBjYWNoZWQgcG9zaXRpb25zIG9mIHRoZSBzY3JvbGxcbiAgICAvLyBwYXJlbnRzIHRoYXQgYXJlIGluc2lkZSB0aGUgZWxlbWVudCB0aGF0IHdhcyBzY3JvbGxlZC5cbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuZm9yRWFjaCgocG9zaXRpb24sIG5vZGUpID0+IHtcbiAgICAgIGlmIChwb3NpdGlvbi5jbGllbnRSZWN0ICYmIHNjcm9sbGVkUGFyZW50ICE9PSBub2RlICYmIHNjcm9sbGVkUGFyZW50LmNvbnRhaW5zKG5vZGUpKSB7XG4gICAgICAgIGFkanVzdENsaWVudFJlY3QocG9zaXRpb24uY2xpZW50UmVjdCwgdG9wRGlmZmVyZW5jZSwgbGVmdERpZmZlcmVuY2UpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gU2luY2Ugd2Uga25vdyB0aGUgYW1vdW50IHRoYXQgdGhlIHVzZXIgaGFzIHNjcm9sbGVkIHdlIGNhbiBzaGlmdCBhbGwgb2YgdGhlIGNsaWVudCByZWN0YW5nbGVzXG4gICAgLy8gb3Vyc2VsdmVzLiBUaGlzIGlzIGNoZWFwZXIgdGhhbiByZS1tZWFzdXJpbmcgZXZlcnl0aGluZyBhbmQgd2UgY2FuIGF2b2lkIGluY29uc2lzdGVudFxuICAgIC8vIGJlaGF2aW9yIHdoZXJlIHdlIG1pZ2h0IGJlIG1lYXN1cmluZyB0aGUgZWxlbWVudCBiZWZvcmUgaXRzIHBvc2l0aW9uIGhhcyBjaGFuZ2VkLlxuICAgIHRoaXMuX2l0ZW1Qb3NpdGlvbnMuZm9yRWFjaCgoe2NsaWVudFJlY3R9KSA9PiB7XG4gICAgICBhZGp1c3RDbGllbnRSZWN0KGNsaWVudFJlY3QsIHRvcERpZmZlcmVuY2UsIGxlZnREaWZmZXJlbmNlKTtcbiAgICB9KTtcblxuICAgIC8vIFdlIG5lZWQgdHdvIGxvb3BzIGZvciB0aGlzLCBiZWNhdXNlIHdlIHdhbnQgYWxsIG9mIHRoZSBjYWNoZWRcbiAgICAvLyBwb3NpdGlvbnMgdG8gYmUgdXAtdG8tZGF0ZSBiZWZvcmUgd2UgcmUtc29ydCB0aGUgaXRlbS5cbiAgICB0aGlzLl9pdGVtUG9zaXRpb25zLmZvckVhY2goKHtkcmFnfSkgPT4ge1xuICAgICAgaWYgKHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuaXNEcmFnZ2luZyhkcmFnKSkge1xuICAgICAgICAvLyBXZSBuZWVkIHRvIHJlLXNvcnQgdGhlIGl0ZW0gbWFudWFsbHksIGJlY2F1c2UgdGhlIHBvaW50ZXIgbW92ZVxuICAgICAgICAvLyBldmVudHMgd29uJ3QgYmUgZGlzcGF0Y2hlZCB3aGlsZSB0aGUgdXNlciBpcyBzY3JvbGxpbmcuXG4gICAgICAgIGRyYWcuX3NvcnRGcm9tTGFzdFBvaW50ZXJQb3NpdGlvbigpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgc2Nyb2xsUG9zaXRpb24udG9wID0gbmV3VG9wO1xuICAgIHNjcm9sbFBvc2l0aW9uLmxlZnQgPSBuZXdMZWZ0O1xuICB9XG5cbiAgLyoqIFN0YXJ0cyB0aGUgaW50ZXJ2YWwgdGhhdCdsbCBhdXRvLXNjcm9sbCB0aGUgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfc3RhcnRTY3JvbGxJbnRlcnZhbCA9ICgpID0+IHtcbiAgICB0aGlzLl9zdG9wU2Nyb2xsaW5nKCk7XG5cbiAgICBpbnRlcnZhbCgwLCBhbmltYXRpb25GcmFtZVNjaGVkdWxlcilcbiAgICAgIC5waXBlKHRha2VVbnRpbCh0aGlzLl9zdG9wU2Nyb2xsVGltZXJzKSlcbiAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICBjb25zdCBub2RlID0gdGhpcy5fc2Nyb2xsTm9kZTtcblxuICAgICAgICBpZiAodGhpcy5fdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPT09IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5VUCkge1xuICAgICAgICAgIGluY3JlbWVudFZlcnRpY2FsU2Nyb2xsKG5vZGUsIC1BVVRPX1NDUk9MTF9TVEVQKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl92ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9PT0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLkRPV04pIHtcbiAgICAgICAgICBpbmNyZW1lbnRWZXJ0aWNhbFNjcm9sbChub2RlLCBBVVRPX1NDUk9MTF9TVEVQKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9ob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID09PSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5MRUZUKSB7XG4gICAgICAgICAgaW5jcmVtZW50SG9yaXpvbnRhbFNjcm9sbChub2RlLCAtQVVUT19TQ1JPTExfU1RFUCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5faG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9PT0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uUklHSFQpIHtcbiAgICAgICAgICBpbmNyZW1lbnRIb3Jpem9udGFsU2Nyb2xsKG5vZGUsIEFVVE9fU0NST0xMX1NURVApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgdXNlcidzIHBvaW50ZXIgaXMgcG9zaXRpb25lZCBvdmVyIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSB4IFBvaW50ZXIgcG9zaXRpb24gYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHkgUG9pbnRlciBwb3NpdGlvbiBhbG9uZyB0aGUgWSBheGlzLlxuICAgKi9cbiAgX2lzT3ZlckNvbnRhaW5lcih4OiBudW1iZXIsIHk6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIHJldHVybiBpc0luc2lkZUNsaWVudFJlY3QodGhpcy5fY2xpZW50UmVjdCwgeCwgeSk7XG4gIH1cblxuICAvKipcbiAgICogRmlndXJlcyBvdXQgd2hldGhlciBhbiBpdGVtIHNob3VsZCBiZSBtb3ZlZCBpbnRvIGEgc2libGluZ1xuICAgKiBkcm9wIGNvbnRhaW5lciwgYmFzZWQgb24gaXRzIGN1cnJlbnQgcG9zaXRpb24uXG4gICAqIEBwYXJhbSBpdGVtIERyYWcgaXRlbSB0aGF0IGlzIGJlaW5nIG1vdmVkLlxuICAgKiBAcGFyYW0geCBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0geSBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKi9cbiAgX2dldFNpYmxpbmdDb250YWluZXJGcm9tUG9zaXRpb24oaXRlbTogRHJhZ1JlZiwgeDogbnVtYmVyLCB5OiBudW1iZXIpOiBEcm9wTGlzdFJlZiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX3NpYmxpbmdzLmZpbmQoc2libGluZyA9PiBzaWJsaW5nLl9jYW5SZWNlaXZlKGl0ZW0sIHgsIHkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgZHJvcCBsaXN0IGNhbiByZWNlaXZlIHRoZSBwYXNzZWQtaW4gaXRlbS5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB0aGF0IGlzIGJlaW5nIGRyYWdnZWQgaW50byB0aGUgbGlzdC5cbiAgICogQHBhcmFtIHggUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHkgUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFkgYXhpcy5cbiAgICovXG4gIF9jYW5SZWNlaXZlKGl0ZW06IERyYWdSZWYsIHg6IG51bWJlciwgeTogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgaWYgKCFpc0luc2lkZUNsaWVudFJlY3QodGhpcy5fY2xpZW50UmVjdCwgeCwgeSkgfHwgIXRoaXMuZW50ZXJQcmVkaWNhdGUoaXRlbSwgdGhpcykpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBlbGVtZW50RnJvbVBvaW50ID0gdGhpcy5fZ2V0U2hhZG93Um9vdCgpLmVsZW1lbnRGcm9tUG9pbnQoeCwgeSkgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuXG4gICAgLy8gSWYgdGhlcmUncyBubyBlbGVtZW50IGF0IHRoZSBwb2ludGVyIHBvc2l0aW9uLCB0aGVuXG4gICAgLy8gdGhlIGNsaWVudCByZWN0IGlzIHByb2JhYmx5IHNjcm9sbGVkIG91dCBvZiB0aGUgdmlldy5cbiAgICBpZiAoIWVsZW1lbnRGcm9tUG9pbnQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpO1xuXG4gICAgLy8gVGhlIGBDbGllbnRSZWN0YCwgdGhhdCB3ZSdyZSB1c2luZyB0byBmaW5kIHRoZSBjb250YWluZXIgb3ZlciB3aGljaCB0aGUgdXNlciBpc1xuICAgIC8vIGhvdmVyaW5nLCBkb2Vzbid0IGdpdmUgdXMgYW55IGluZm9ybWF0aW9uIG9uIHdoZXRoZXIgdGhlIGVsZW1lbnQgaGFzIGJlZW4gc2Nyb2xsZWRcbiAgICAvLyBvdXQgb2YgdGhlIHZpZXcgb3Igd2hldGhlciBpdCdzIG92ZXJsYXBwaW5nIHdpdGggb3RoZXIgY29udGFpbmVycy4gVGhpcyBtZWFucyB0aGF0XG4gICAgLy8gd2UgY291bGQgZW5kIHVwIHRyYW5zZmVycmluZyB0aGUgaXRlbSBpbnRvIGEgY29udGFpbmVyIHRoYXQncyBpbnZpc2libGUgb3IgaXMgcG9zaXRpb25lZFxuICAgIC8vIGJlbG93IGFub3RoZXIgb25lLiBXZSB1c2UgdGhlIHJlc3VsdCBmcm9tIGBlbGVtZW50RnJvbVBvaW50YCB0byBnZXQgdGhlIHRvcC1tb3N0IGVsZW1lbnRcbiAgICAvLyBhdCB0aGUgcG9pbnRlciBwb3NpdGlvbiBhbmQgdG8gZmluZCB3aGV0aGVyIGl0J3Mgb25lIG9mIHRoZSBpbnRlcnNlY3RpbmcgZHJvcCBjb250YWluZXJzLlxuICAgIHJldHVybiBlbGVtZW50RnJvbVBvaW50ID09PSBuYXRpdmVFbGVtZW50IHx8IG5hdGl2ZUVsZW1lbnQuY29udGFpbnMoZWxlbWVudEZyb21Qb2ludCk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIGJ5IG9uZSBvZiB0aGUgY29ubmVjdGVkIGRyb3AgbGlzdHMgd2hlbiBhIGRyYWdnaW5nIHNlcXVlbmNlIGhhcyBzdGFydGVkLlxuICAgKiBAcGFyYW0gc2libGluZyBTaWJsaW5nIGluIHdoaWNoIGRyYWdnaW5nIGhhcyBzdGFydGVkLlxuICAgKi9cbiAgX3N0YXJ0UmVjZWl2aW5nKHNpYmxpbmc6IERyb3BMaXN0UmVmKSB7XG4gICAgY29uc3QgYWN0aXZlU2libGluZ3MgPSB0aGlzLl9hY3RpdmVTaWJsaW5ncztcblxuICAgIGlmICghYWN0aXZlU2libGluZ3MuaGFzKHNpYmxpbmcpKSB7XG4gICAgICBhY3RpdmVTaWJsaW5ncy5hZGQoc2libGluZyk7XG4gICAgICB0aGlzLl9jYWNoZVBhcmVudFBvc2l0aW9ucygpO1xuICAgICAgdGhpcy5fbGlzdGVuVG9TY3JvbGxFdmVudHMoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIGJ5IGEgY29ubmVjdGVkIGRyb3AgbGlzdCB3aGVuIGRyYWdnaW5nIGhhcyBzdG9wcGVkLlxuICAgKiBAcGFyYW0gc2libGluZyBTaWJsaW5nIHdob3NlIGRyYWdnaW5nIGhhcyBzdG9wcGVkLlxuICAgKi9cbiAgX3N0b3BSZWNlaXZpbmcoc2libGluZzogRHJvcExpc3RSZWYpIHtcbiAgICB0aGlzLl9hY3RpdmVTaWJsaW5ncy5kZWxldGUoc2libGluZyk7XG4gICAgdGhpcy5fdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydHMgbGlzdGVuaW5nIHRvIHNjcm9sbCBldmVudHMgb24gdGhlIHZpZXdwb3J0LlxuICAgKiBVc2VkIGZvciB1cGRhdGluZyB0aGUgaW50ZXJuYWwgc3RhdGUgb2YgdGhlIGxpc3QuXG4gICAqL1xuICBwcml2YXRlIF9saXN0ZW5Ub1Njcm9sbEV2ZW50cygpIHtcbiAgICB0aGlzLl92aWV3cG9ydFNjcm9sbFN1YnNjcmlwdGlvbiA9IHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuc2Nyb2xsLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICBpZiAodGhpcy5pc0RyYWdnaW5nKCkpIHtcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50IHwgRG9jdW1lbnQ7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5fcGFyZW50UG9zaXRpb25zLmdldCh0YXJnZXQpO1xuXG4gICAgICAgIGlmIChwb3NpdGlvbikge1xuICAgICAgICAgIGxldCBuZXdUb3A6IG51bWJlcjtcbiAgICAgICAgICBsZXQgbmV3TGVmdDogbnVtYmVyO1xuXG4gICAgICAgICAgaWYgKHRhcmdldCA9PT0gdGhpcy5fZG9jdW1lbnQpIHtcbiAgICAgICAgICAgIGNvbnN0IHNjcm9sbFBvc2l0aW9uID0gdGhpcy5fdmlld3BvcnRSdWxlciEuZ2V0Vmlld3BvcnRTY3JvbGxQb3NpdGlvbigpO1xuICAgICAgICAgICAgbmV3VG9wID0gc2Nyb2xsUG9zaXRpb24udG9wO1xuICAgICAgICAgICAgbmV3TGVmdCA9IHNjcm9sbFBvc2l0aW9uLmxlZnQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5ld1RvcCA9ICh0YXJnZXQgYXMgSFRNTEVsZW1lbnQpLnNjcm9sbFRvcDtcbiAgICAgICAgICAgIG5ld0xlZnQgPSAodGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5zY3JvbGxMZWZ0O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuX3VwZGF0ZUFmdGVyU2Nyb2xsKHRhcmdldCwgbmV3VG9wLCBuZXdMZWZ0KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0aGlzLmlzUmVjZWl2aW5nKCkpIHtcbiAgICAgICAgdGhpcy5fY2FjaGVQYXJlbnRQb3NpdGlvbnMoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMYXppbHkgcmVzb2x2ZXMgYW5kIHJldHVybnMgdGhlIHNoYWRvdyByb290IG9mIHRoZSBlbGVtZW50LiBXZSBkbyB0aGlzIGluIGEgZnVuY3Rpb24sIHJhdGhlclxuICAgKiB0aGFuIHNhdmluZyBpdCBpbiBwcm9wZXJ0eSBkaXJlY3RseSBvbiBpbml0LCBiZWNhdXNlIHdlIHdhbnQgdG8gcmVzb2x2ZSBpdCBhcyBsYXRlIGFzIHBvc3NpYmxlXG4gICAqIGluIG9yZGVyIHRvIGVuc3VyZSB0aGF0IHRoZSBlbGVtZW50IGhhcyBiZWVuIG1vdmVkIGludG8gdGhlIHNoYWRvdyBET00uIERvaW5nIGl0IGluc2lkZSB0aGVcbiAgICogY29uc3RydWN0b3IgbWlnaHQgYmUgdG9vIGVhcmx5IGlmIHRoZSBlbGVtZW50IGlzIGluc2lkZSBvZiBzb21ldGhpbmcgbGlrZSBgbmdGb3JgIG9yIGBuZ0lmYC5cbiAgICovXG4gIHByaXZhdGUgX2dldFNoYWRvd1Jvb3QoKTogRG9jdW1lbnRPclNoYWRvd1Jvb3Qge1xuICAgIGlmICghdGhpcy5fY2FjaGVkU2hhZG93Um9vdCkge1xuICAgICAgY29uc3Qgc2hhZG93Um9vdCA9IF9nZXRTaGFkb3dSb290KGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KSkgYXMgU2hhZG93Um9vdCB8IG51bGw7XG4gICAgICB0aGlzLl9jYWNoZWRTaGFkb3dSb290ID0gc2hhZG93Um9vdCB8fCB0aGlzLl9kb2N1bWVudDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fY2FjaGVkU2hhZG93Um9vdDtcbiAgfVxufVxuXG5cbi8qKlxuICogVXBkYXRlcyB0aGUgdG9wL2xlZnQgcG9zaXRpb25zIG9mIGEgYENsaWVudFJlY3RgLCBhcyB3ZWxsIGFzIHRoZWlyIGJvdHRvbS9yaWdodCBjb3VudGVycGFydHMuXG4gKiBAcGFyYW0gY2xpZW50UmVjdCBgQ2xpZW50UmVjdGAgdGhhdCBzaG91bGQgYmUgdXBkYXRlZC5cbiAqIEBwYXJhbSB0b3AgQW1vdW50IHRvIGFkZCB0byB0aGUgYHRvcGAgcG9zaXRpb24uXG4gKiBAcGFyYW0gbGVmdCBBbW91bnQgdG8gYWRkIHRvIHRoZSBgbGVmdGAgcG9zaXRpb24uXG4gKi9cbmZ1bmN0aW9uIGFkanVzdENsaWVudFJlY3QoY2xpZW50UmVjdDogQ2xpZW50UmVjdCwgdG9wOiBudW1iZXIsIGxlZnQ6IG51bWJlcikge1xuICBjbGllbnRSZWN0LnRvcCArPSB0b3A7XG4gIGNsaWVudFJlY3QuYm90dG9tID0gY2xpZW50UmVjdC50b3AgKyBjbGllbnRSZWN0LmhlaWdodDtcblxuICBjbGllbnRSZWN0LmxlZnQgKz0gbGVmdDtcbiAgY2xpZW50UmVjdC5yaWdodCA9IGNsaWVudFJlY3QubGVmdCArIGNsaWVudFJlY3Qud2lkdGg7XG59XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgdGhlIHBvaW50ZXIgY29vcmRpbmF0ZXMgYXJlIGNsb3NlIHRvIGEgQ2xpZW50UmVjdC5cbiAqIEBwYXJhbSByZWN0IENsaWVudFJlY3QgdG8gY2hlY2sgYWdhaW5zdC5cbiAqIEBwYXJhbSBwb2ludGVyWCBDb29yZGluYXRlcyBhbG9uZyB0aGUgWCBheGlzLlxuICogQHBhcmFtIHBvaW50ZXJZIENvb3JkaW5hdGVzIGFsb25nIHRoZSBZIGF4aXMuXG4gKi9cbmZ1bmN0aW9uIGlzUG9pbnRlck5lYXJDbGllbnRSZWN0KHJlY3Q6IENsaWVudFJlY3QsIHBvaW50ZXJYOiBudW1iZXIsIHBvaW50ZXJZOiBudW1iZXIpOiBib29sZWFuIHtcbiAgY29uc3Qge3RvcCwgcmlnaHQsIGJvdHRvbSwgbGVmdCwgd2lkdGgsIGhlaWdodH0gPSByZWN0O1xuICBjb25zdCB4VGhyZXNob2xkID0gd2lkdGggKiBEUk9QX1BST1hJTUlUWV9USFJFU0hPTEQ7XG4gIGNvbnN0IHlUaHJlc2hvbGQgPSBoZWlnaHQgKiBEUk9QX1BST1hJTUlUWV9USFJFU0hPTEQ7XG5cbiAgcmV0dXJuIHBvaW50ZXJZID4gdG9wIC0geVRocmVzaG9sZCAmJiBwb2ludGVyWSA8IGJvdHRvbSArIHlUaHJlc2hvbGQgJiZcbiAgICAgICAgIHBvaW50ZXJYID4gbGVmdCAtIHhUaHJlc2hvbGQgJiYgcG9pbnRlclggPCByaWdodCArIHhUaHJlc2hvbGQ7XG59XG5cbi8qKlxuICogRmluZHMgdGhlIGluZGV4IG9mIGFuIGl0ZW0gdGhhdCBtYXRjaGVzIGEgcHJlZGljYXRlIGZ1bmN0aW9uLiBVc2VkIGFzIGFuIGVxdWl2YWxlbnRcbiAqIG9mIGBBcnJheS5wcm90b3R5cGUuZmluZEluZGV4YCB3aGljaCBpc24ndCBwYXJ0IG9mIHRoZSBzdGFuZGFyZCBHb29nbGUgdHlwaW5ncy5cbiAqIEBwYXJhbSBhcnJheSBBcnJheSBpbiB3aGljaCB0byBsb29rIGZvciBtYXRjaGVzLlxuICogQHBhcmFtIHByZWRpY2F0ZSBGdW5jdGlvbiB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIGFuIGl0ZW0gaXMgYSBtYXRjaC5cbiAqL1xuZnVuY3Rpb24gZmluZEluZGV4PFQ+KGFycmF5OiBUW10sXG4gICAgICAgICAgICAgICAgICAgICAgcHJlZGljYXRlOiAodmFsdWU6IFQsIGluZGV4OiBudW1iZXIsIG9iajogVFtdKSA9PiBib29sZWFuKTogbnVtYmVyIHtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHByZWRpY2F0ZShhcnJheVtpXSwgaSwgYXJyYXkpKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gLTE7XG59XG5cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciBzb21lIGNvb3JkaW5hdGVzIGFyZSB3aXRoaW4gYSBgQ2xpZW50UmVjdGAuXG4gKiBAcGFyYW0gY2xpZW50UmVjdCBDbGllbnRSZWN0IHRoYXQgaXMgYmVpbmcgY2hlY2tlZC5cbiAqIEBwYXJhbSB4IENvb3JkaW5hdGVzIGFsb25nIHRoZSBYIGF4aXMuXG4gKiBAcGFyYW0geSBDb29yZGluYXRlcyBhbG9uZyB0aGUgWSBheGlzLlxuICovXG5mdW5jdGlvbiBpc0luc2lkZUNsaWVudFJlY3QoY2xpZW50UmVjdDogQ2xpZW50UmVjdCwgeDogbnVtYmVyLCB5OiBudW1iZXIpIHtcbiAgY29uc3Qge3RvcCwgYm90dG9tLCBsZWZ0LCByaWdodH0gPSBjbGllbnRSZWN0O1xuICByZXR1cm4geSA+PSB0b3AgJiYgeSA8PSBib3R0b20gJiYgeCA+PSBsZWZ0ICYmIHggPD0gcmlnaHQ7XG59XG5cblxuLyoqIEdldHMgYSBtdXRhYmxlIHZlcnNpb24gb2YgYW4gZWxlbWVudCdzIGJvdW5kaW5nIGBDbGllbnRSZWN0YC4gKi9cbmZ1bmN0aW9uIGdldE11dGFibGVDbGllbnRSZWN0KGVsZW1lbnQ6IEVsZW1lbnQpOiBDbGllbnRSZWN0IHtcbiAgY29uc3QgY2xpZW50UmVjdCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgLy8gV2UgbmVlZCB0byBjbG9uZSB0aGUgYGNsaWVudFJlY3RgIGhlcmUsIGJlY2F1c2UgYWxsIHRoZSB2YWx1ZXMgb24gaXQgYXJlIHJlYWRvbmx5XG4gIC8vIGFuZCB3ZSBuZWVkIHRvIGJlIGFibGUgdG8gdXBkYXRlIHRoZW0uIEFsc28gd2UgY2FuJ3QgdXNlIGEgc3ByZWFkIGhlcmUsIGJlY2F1c2VcbiAgLy8gdGhlIHZhbHVlcyBvbiBhIGBDbGllbnRSZWN0YCBhcmVuJ3Qgb3duIHByb3BlcnRpZXMuIFNlZTpcbiAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0VsZW1lbnQvZ2V0Qm91bmRpbmdDbGllbnRSZWN0I05vdGVzXG4gIHJldHVybiB7XG4gICAgdG9wOiBjbGllbnRSZWN0LnRvcCxcbiAgICByaWdodDogY2xpZW50UmVjdC5yaWdodCxcbiAgICBib3R0b206IGNsaWVudFJlY3QuYm90dG9tLFxuICAgIGxlZnQ6IGNsaWVudFJlY3QubGVmdCxcbiAgICB3aWR0aDogY2xpZW50UmVjdC53aWR0aCxcbiAgICBoZWlnaHQ6IGNsaWVudFJlY3QuaGVpZ2h0XG4gIH07XG59XG5cbi8qKlxuICogSW5jcmVtZW50cyB0aGUgdmVydGljYWwgc2Nyb2xsIHBvc2l0aW9uIG9mIGEgbm9kZS5cbiAqIEBwYXJhbSBub2RlIE5vZGUgd2hvc2Ugc2Nyb2xsIHBvc2l0aW9uIHNob3VsZCBjaGFuZ2UuXG4gKiBAcGFyYW0gYW1vdW50IEFtb3VudCBvZiBwaXhlbHMgdGhhdCB0aGUgYG5vZGVgIHNob3VsZCBiZSBzY3JvbGxlZC5cbiAqL1xuZnVuY3Rpb24gaW5jcmVtZW50VmVydGljYWxTY3JvbGwobm9kZTogSFRNTEVsZW1lbnQgfCBXaW5kb3csIGFtb3VudDogbnVtYmVyKSB7XG4gIGlmIChub2RlID09PSB3aW5kb3cpIHtcbiAgICAobm9kZSBhcyBXaW5kb3cpLnNjcm9sbEJ5KDAsIGFtb3VudCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gSWRlYWxseSB3ZSBjb3VsZCB1c2UgYEVsZW1lbnQuc2Nyb2xsQnlgIGhlcmUgYXMgd2VsbCwgYnV0IElFIGFuZCBFZGdlIGRvbid0IHN1cHBvcnQgaXQuXG4gICAgKG5vZGUgYXMgSFRNTEVsZW1lbnQpLnNjcm9sbFRvcCArPSBhbW91bnQ7XG4gIH1cbn1cblxuLyoqXG4gKiBJbmNyZW1lbnRzIHRoZSBob3Jpem9udGFsIHNjcm9sbCBwb3NpdGlvbiBvZiBhIG5vZGUuXG4gKiBAcGFyYW0gbm9kZSBOb2RlIHdob3NlIHNjcm9sbCBwb3NpdGlvbiBzaG91bGQgY2hhbmdlLlxuICogQHBhcmFtIGFtb3VudCBBbW91bnQgb2YgcGl4ZWxzIHRoYXQgdGhlIGBub2RlYCBzaG91bGQgYmUgc2Nyb2xsZWQuXG4gKi9cbmZ1bmN0aW9uIGluY3JlbWVudEhvcml6b250YWxTY3JvbGwobm9kZTogSFRNTEVsZW1lbnQgfCBXaW5kb3csIGFtb3VudDogbnVtYmVyKSB7XG4gIGlmIChub2RlID09PSB3aW5kb3cpIHtcbiAgICAobm9kZSBhcyBXaW5kb3cpLnNjcm9sbEJ5KGFtb3VudCwgMCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gSWRlYWxseSB3ZSBjb3VsZCB1c2UgYEVsZW1lbnQuc2Nyb2xsQnlgIGhlcmUgYXMgd2VsbCwgYnV0IElFIGFuZCBFZGdlIGRvbid0IHN1cHBvcnQgaXQuXG4gICAgKG5vZGUgYXMgSFRNTEVsZW1lbnQpLnNjcm9sbExlZnQgKz0gYW1vdW50O1xuICB9XG59XG5cbi8qKlxuICogR2V0cyB3aGV0aGVyIHRoZSB2ZXJ0aWNhbCBhdXRvLXNjcm9sbCBkaXJlY3Rpb24gb2YgYSBub2RlLlxuICogQHBhcmFtIGNsaWVudFJlY3QgRGltZW5zaW9ucyBvZiB0aGUgbm9kZS5cbiAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIHkgYXhpcy5cbiAqL1xuZnVuY3Rpb24gZ2V0VmVydGljYWxTY3JvbGxEaXJlY3Rpb24oY2xpZW50UmVjdDogQ2xpZW50UmVjdCwgcG9pbnRlclk6IG51bWJlcikge1xuICBjb25zdCB7dG9wLCBib3R0b20sIGhlaWdodH0gPSBjbGllbnRSZWN0O1xuICBjb25zdCB5VGhyZXNob2xkID0gaGVpZ2h0ICogU0NST0xMX1BST1hJTUlUWV9USFJFU0hPTEQ7XG5cbiAgaWYgKHBvaW50ZXJZID49IHRvcCAtIHlUaHJlc2hvbGQgJiYgcG9pbnRlclkgPD0gdG9wICsgeVRocmVzaG9sZCkge1xuICAgIHJldHVybiBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uVVA7XG4gIH0gZWxzZSBpZiAocG9pbnRlclkgPj0gYm90dG9tIC0geVRocmVzaG9sZCAmJiBwb2ludGVyWSA8PSBib3R0b20gKyB5VGhyZXNob2xkKSB7XG4gICAgcmV0dXJuIEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5ET1dOO1xuICB9XG5cbiAgcmV0dXJuIEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5OT05FO1xufVxuXG4vKipcbiAqIEdldHMgd2hldGhlciB0aGUgaG9yaXpvbnRhbCBhdXRvLXNjcm9sbCBkaXJlY3Rpb24gb2YgYSBub2RlLlxuICogQHBhcmFtIGNsaWVudFJlY3QgRGltZW5zaW9ucyBvZiB0aGUgbm9kZS5cbiAqIEBwYXJhbSBwb2ludGVyWCBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIHggYXhpcy5cbiAqL1xuZnVuY3Rpb24gZ2V0SG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0OiBDbGllbnRSZWN0LCBwb2ludGVyWDogbnVtYmVyKSB7XG4gIGNvbnN0IHtsZWZ0LCByaWdodCwgd2lkdGh9ID0gY2xpZW50UmVjdDtcbiAgY29uc3QgeFRocmVzaG9sZCA9IHdpZHRoICogU0NST0xMX1BST1hJTUlUWV9USFJFU0hPTEQ7XG5cbiAgaWYgKHBvaW50ZXJYID49IGxlZnQgLSB4VGhyZXNob2xkICYmIHBvaW50ZXJYIDw9IGxlZnQgKyB4VGhyZXNob2xkKSB7XG4gICAgcmV0dXJuIEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLkxFRlQ7XG4gIH0gZWxzZSBpZiAocG9pbnRlclggPj0gcmlnaHQgLSB4VGhyZXNob2xkICYmIHBvaW50ZXJYIDw9IHJpZ2h0ICsgeFRocmVzaG9sZCkge1xuICAgIHJldHVybiBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5SSUdIVDtcbiAgfVxuXG4gIHJldHVybiBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5OT05FO1xufVxuXG4vKipcbiAqIEdldHMgdGhlIGRpcmVjdGlvbnMgaW4gd2hpY2ggYW4gZWxlbWVudCBub2RlIHNob3VsZCBiZSBzY3JvbGxlZCxcbiAqIGFzc3VtaW5nIHRoYXQgdGhlIHVzZXIncyBwb2ludGVyIGlzIGFscmVhZHkgd2l0aGluIGl0IHNjcm9sbGFibGUgcmVnaW9uLlxuICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCBmb3Igd2hpY2ggd2Ugc2hvdWxkIGNhbGN1bGF0ZSB0aGUgc2Nyb2xsIGRpcmVjdGlvbi5cbiAqIEBwYXJhbSBjbGllbnRSZWN0IEJvdW5kaW5nIGNsaWVudCByZWN0YW5nbGUgb2YgdGhlIGVsZW1lbnQuXG4gKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSB4IGF4aXMuXG4gKiBAcGFyYW0gcG9pbnRlclkgUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSB5IGF4aXMuXG4gKi9cbmZ1bmN0aW9uIGdldEVsZW1lbnRTY3JvbGxEaXJlY3Rpb25zKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBjbGllbnRSZWN0OiBDbGllbnRSZWN0LCBwb2ludGVyWDogbnVtYmVyLFxuICBwb2ludGVyWTogbnVtYmVyKTogW0F1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbiwgQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb25dIHtcbiAgY29uc3QgY29tcHV0ZWRWZXJ0aWNhbCA9IGdldFZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uKGNsaWVudFJlY3QsIHBvaW50ZXJZKTtcbiAgY29uc3QgY29tcHV0ZWRIb3Jpem9udGFsID0gZ2V0SG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0LCBwb2ludGVyWCk7XG4gIGxldCB2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5OT05FO1xuICBsZXQgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLk5PTkU7XG5cbiAgLy8gTm90ZSB0aGF0IHdlIGhlcmUgd2UgZG8gc29tZSBleHRyYSBjaGVja3MgZm9yIHdoZXRoZXIgdGhlIGVsZW1lbnQgaXMgYWN0dWFsbHkgc2Nyb2xsYWJsZSBpblxuICAvLyBhIGNlcnRhaW4gZGlyZWN0aW9uIGFuZCB3ZSBvbmx5IGFzc2lnbiB0aGUgc2Nyb2xsIGRpcmVjdGlvbiBpZiBpdCBpcy4gV2UgZG8gdGhpcyBzbyB0aGF0IHdlXG4gIC8vIGNhbiBhbGxvdyBvdGhlciBlbGVtZW50cyB0byBiZSBzY3JvbGxlZCwgaWYgdGhlIGN1cnJlbnQgZWxlbWVudCBjYW4ndCBiZSBzY3JvbGxlZCBhbnltb3JlLlxuICAvLyBUaGlzIGFsbG93cyB1cyB0byBoYW5kbGUgY2FzZXMgd2hlcmUgdGhlIHNjcm9sbCByZWdpb25zIG9mIHR3byBzY3JvbGxhYmxlIGVsZW1lbnRzIG92ZXJsYXAuXG4gIGlmIChjb21wdXRlZFZlcnRpY2FsKSB7XG4gICAgY29uc3Qgc2Nyb2xsVG9wID0gZWxlbWVudC5zY3JvbGxUb3A7XG5cbiAgICBpZiAoY29tcHV0ZWRWZXJ0aWNhbCA9PT0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLlVQKSB7XG4gICAgICBpZiAoc2Nyb2xsVG9wID4gMCkge1xuICAgICAgICB2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5VUDtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0gc2Nyb2xsVG9wID4gZWxlbWVudC5jbGllbnRIZWlnaHQpIHtcbiAgICAgIHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLkRPV047XG4gICAgfVxuICB9XG5cbiAgaWYgKGNvbXB1dGVkSG9yaXpvbnRhbCkge1xuICAgIGNvbnN0IHNjcm9sbExlZnQgPSBlbGVtZW50LnNjcm9sbExlZnQ7XG5cbiAgICBpZiAoY29tcHV0ZWRIb3Jpem9udGFsID09PSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5MRUZUKSB7XG4gICAgICBpZiAoc2Nyb2xsTGVmdCA+IDApIHtcbiAgICAgICAgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLkxFRlQ7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChlbGVtZW50LnNjcm9sbFdpZHRoIC0gc2Nyb2xsTGVmdCA+IGVsZW1lbnQuY2xpZW50V2lkdGgpIHtcbiAgICAgIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5SSUdIVDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uLCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uXTtcbn1cbiJdfQ==