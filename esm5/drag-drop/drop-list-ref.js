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
        // Used when figuring out whether an element is inside the scroll parent. If the scrolled
        // parent is the `document`, we use the `documentElement`, because IE doesn't support `contains`
        // on the `document`.
        var scrolledParentNode = scrolledParent === this._document ? scrolledParent.documentElement : scrolledParent;
        var scrollPosition = this._parentPositions.get(scrolledParent).scrollPosition;
        var topDifference = scrollPosition.top - newTop;
        var leftDifference = scrollPosition.left - newLeft;
        // Go through and update the cached positions of the scroll
        // parents that are inside the element that was scrolled.
        this._parentPositions.forEach(function (position, node) {
            if (position.clientRect && scrolledParent !== node && scrolledParentNode.contains(node)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LXJlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2Ryb3AtbGlzdC1yZWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUlILE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUVwRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDckQsT0FBTyxFQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLHVCQUF1QixFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQzlFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6QyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBSTdDOzs7R0FHRztBQUNILElBQU0sd0JBQXdCLEdBQUcsSUFBSSxDQUFDO0FBRXRDOzs7R0FHRztBQUNILElBQU0sMEJBQTBCLEdBQUcsSUFBSSxDQUFDO0FBRXhDOzs7R0FHRztBQUNILElBQU0sZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDO0FBa0MzQjs7R0FFRztBQUNIO0lBbUlFLHFCQUNFLE9BQThDLEVBQ3RDLGlCQUF5RCxFQUNqRSxTQUFjLEVBQ04sT0FBZSxFQUNmLGNBQTZCO1FBTHZDLGlCQVVDO1FBUlMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUF3QztRQUV6RCxZQUFPLEdBQVAsT0FBTyxDQUFRO1FBQ2YsbUJBQWMsR0FBZCxjQUFjLENBQWU7UUFwSXZDLDRFQUE0RTtRQUM1RSxhQUFRLEdBQVksS0FBSyxDQUFDO1FBRTFCLHlEQUF5RDtRQUN6RCxvQkFBZSxHQUFZLEtBQUssQ0FBQztRQUtqQzs7O1dBR0c7UUFDSCx1QkFBa0IsR0FBWSxLQUFLLENBQUM7UUFFcEM7OztXQUdHO1FBQ0gsbUJBQWMsR0FBa0QsY0FBTSxPQUFBLElBQUksRUFBSixDQUFJ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OlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RWxlbWVudFJlZiwgTmdab25lfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7RGlyZWN0aW9ufSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge2NvZXJjZUVsZW1lbnR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge1ZpZXdwb3J0UnVsZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9zY3JvbGxpbmcnO1xuaW1wb3J0IHtfZ2V0U2hhZG93Um9vdH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7U3ViamVjdCwgU3Vic2NyaXB0aW9uLCBpbnRlcnZhbCwgYW5pbWF0aW9uRnJhbWVTY2hlZHVsZXJ9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHt0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7bW92ZUl0ZW1JbkFycmF5fSBmcm9tICcuL2RyYWctdXRpbHMnO1xuaW1wb3J0IHtEcmFnRHJvcFJlZ2lzdHJ5fSBmcm9tICcuL2RyYWctZHJvcC1yZWdpc3RyeSc7XG5pbXBvcnQge0RyYWdSZWZJbnRlcm5hbCBhcyBEcmFnUmVmLCBQb2ludH0gZnJvbSAnLi9kcmFnLXJlZic7XG5cbi8qKlxuICogUHJveGltaXR5LCBhcyBhIHJhdGlvIHRvIHdpZHRoL2hlaWdodCwgYXQgd2hpY2ggYVxuICogZHJhZ2dlZCBpdGVtIHdpbGwgYWZmZWN0IHRoZSBkcm9wIGNvbnRhaW5lci5cbiAqL1xuY29uc3QgRFJPUF9QUk9YSU1JVFlfVEhSRVNIT0xEID0gMC4wNTtcblxuLyoqXG4gKiBQcm94aW1pdHksIGFzIGEgcmF0aW8gdG8gd2lkdGgvaGVpZ2h0IGF0IHdoaWNoIHRvIHN0YXJ0IGF1dG8tc2Nyb2xsaW5nIHRoZSBkcm9wIGxpc3Qgb3IgdGhlXG4gKiB2aWV3cG9ydC4gVGhlIHZhbHVlIGNvbWVzIGZyb20gdHJ5aW5nIGl0IG91dCBtYW51YWxseSB1bnRpbCBpdCBmZWVscyByaWdodC5cbiAqL1xuY29uc3QgU0NST0xMX1BST1hJTUlUWV9USFJFU0hPTEQgPSAwLjA1O1xuXG4vKipcbiAqIE51bWJlciBvZiBwaXhlbHMgdG8gc2Nyb2xsIGZvciBlYWNoIGZyYW1lIHdoZW4gYXV0by1zY3JvbGxpbmcgYW4gZWxlbWVudC5cbiAqIFRoZSB2YWx1ZSBjb21lcyBmcm9tIHRyeWluZyBpdCBvdXQgbWFudWFsbHkgdW50aWwgaXQgZmVlbHMgcmlnaHQuXG4gKi9cbmNvbnN0IEFVVE9fU0NST0xMX1NURVAgPSAyO1xuXG4vKipcbiAqIEVudHJ5IGluIHRoZSBwb3NpdGlvbiBjYWNoZSBmb3IgZHJhZ2dhYmxlIGl0ZW1zLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5pbnRlcmZhY2UgQ2FjaGVkSXRlbVBvc2l0aW9uIHtcbiAgLyoqIEluc3RhbmNlIG9mIHRoZSBkcmFnIGl0ZW0uICovXG4gIGRyYWc6IERyYWdSZWY7XG4gIC8qKiBEaW1lbnNpb25zIG9mIHRoZSBpdGVtLiAqL1xuICBjbGllbnRSZWN0OiBDbGllbnRSZWN0O1xuICAvKiogQW1vdW50IGJ5IHdoaWNoIHRoZSBpdGVtIGhhcyBiZWVuIG1vdmVkIHNpbmNlIGRyYWdnaW5nIHN0YXJ0ZWQuICovXG4gIG9mZnNldDogbnVtYmVyO1xufVxuXG4vKiogT2JqZWN0IGhvbGRpbmcgdGhlIHNjcm9sbCBwb3NpdGlvbiBvZiBzb21ldGhpbmcuICovXG5pbnRlcmZhY2UgU2Nyb2xsUG9zaXRpb24ge1xuICB0b3A6IG51bWJlcjtcbiAgbGVmdDogbnVtYmVyO1xufVxuXG4vKiogVmVydGljYWwgZGlyZWN0aW9uIGluIHdoaWNoIHdlIGNhbiBhdXRvLXNjcm9sbC4gKi9cbmNvbnN0IGVudW0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uIHtOT05FLCBVUCwgRE9XTn1cblxuLyoqIEhvcml6b250YWwgZGlyZWN0aW9uIGluIHdoaWNoIHdlIGNhbiBhdXRvLXNjcm9sbC4gKi9cbmNvbnN0IGVudW0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24ge05PTkUsIExFRlQsIFJJR0hUfVxuXG4vKipcbiAqIEludGVybmFsIGNvbXBpbGUtdGltZS1vbmx5IHJlcHJlc2VudGF0aW9uIG9mIGEgYERyb3BMaXN0UmVmYC5cbiAqIFVzZWQgdG8gYXZvaWQgY2lyY3VsYXIgaW1wb3J0IGlzc3VlcyBiZXR3ZWVuIHRoZSBgRHJvcExpc3RSZWZgIGFuZCB0aGUgYERyYWdSZWZgLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIERyb3BMaXN0UmVmSW50ZXJuYWwgZXh0ZW5kcyBEcm9wTGlzdFJlZiB7fVxuXG4vKipcbiAqIFJlZmVyZW5jZSB0byBhIGRyb3AgbGlzdC4gVXNlZCB0byBtYW5pcHVsYXRlIG9yIGRpc3Bvc2Ugb2YgdGhlIGNvbnRhaW5lci5cbiAqL1xuZXhwb3J0IGNsYXNzIERyb3BMaXN0UmVmPFQgPSBhbnk+IHtcbiAgLyoqIEVsZW1lbnQgdGhhdCB0aGUgZHJvcCBsaXN0IGlzIGF0dGFjaGVkIHRvLiAqL1xuICBlbGVtZW50OiBIVE1MRWxlbWVudCB8IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+O1xuXG4gIC8qKiBXaGV0aGVyIHN0YXJ0aW5nIGEgZHJhZ2dpbmcgc2VxdWVuY2UgZnJvbSB0aGlzIGNvbnRhaW5lciBpcyBkaXNhYmxlZC4gKi9cbiAgZGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogV2hldGhlciBzb3J0aW5nIGl0ZW1zIHdpdGhpbiB0aGUgbGlzdCBpcyBkaXNhYmxlZC4gKi9cbiAgc29ydGluZ0Rpc2FibGVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqIExvY2tzIHRoZSBwb3NpdGlvbiBvZiB0aGUgZHJhZ2dhYmxlIGVsZW1lbnRzIGluc2lkZSB0aGUgY29udGFpbmVyIGFsb25nIHRoZSBzcGVjaWZpZWQgYXhpcy4gKi9cbiAgbG9ja0F4aXM6ICd4JyB8ICd5JztcblxuICAvKipcbiAgICogV2hldGhlciBhdXRvLXNjcm9sbGluZyB0aGUgdmlldyB3aGVuIHRoZSB1c2VyXG4gICAqIG1vdmVzIHRoZWlyIHBvaW50ZXIgY2xvc2UgdG8gdGhlIGVkZ2VzIGlzIGRpc2FibGVkLlxuICAgKi9cbiAgYXV0b1Njcm9sbERpc2FibGVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIEZ1bmN0aW9uIHRoYXQgaXMgdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBhbiBpdGVtXG4gICAqIGlzIGFsbG93ZWQgdG8gYmUgbW92ZWQgaW50byBhIGRyb3AgY29udGFpbmVyLlxuICAgKi9cbiAgZW50ZXJQcmVkaWNhdGU6IChkcmFnOiBEcmFnUmVmLCBkcm9wOiBEcm9wTGlzdFJlZikgPT4gYm9vbGVhbiA9ICgpID0+IHRydWU7XG5cbiAgLyoqIEVtaXRzIHJpZ2h0IGJlZm9yZSBkcmFnZ2luZyBoYXMgc3RhcnRlZC4gKi9cbiAgYmVmb3JlU3RhcnRlZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqXG4gICAqIEVtaXRzIHdoZW4gdGhlIHVzZXIgaGFzIG1vdmVkIGEgbmV3IGRyYWcgaXRlbSBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKi9cbiAgZW50ZXJlZCA9IG5ldyBTdWJqZWN0PHtpdGVtOiBEcmFnUmVmLCBjb250YWluZXI6IERyb3BMaXN0UmVmLCBjdXJyZW50SW5kZXg6IG51bWJlcn0+KCk7XG5cbiAgLyoqXG4gICAqIEVtaXRzIHdoZW4gdGhlIHVzZXIgcmVtb3ZlcyBhbiBpdGVtIGZyb20gdGhlIGNvbnRhaW5lclxuICAgKiBieSBkcmFnZ2luZyBpdCBpbnRvIGFub3RoZXIgY29udGFpbmVyLlxuICAgKi9cbiAgZXhpdGVkID0gbmV3IFN1YmplY3Q8e2l0ZW06IERyYWdSZWYsIGNvbnRhaW5lcjogRHJvcExpc3RSZWZ9PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGRyb3BzIGFuIGl0ZW0gaW5zaWRlIHRoZSBjb250YWluZXIuICovXG4gIGRyb3BwZWQgPSBuZXcgU3ViamVjdDx7XG4gICAgaXRlbTogRHJhZ1JlZixcbiAgICBjdXJyZW50SW5kZXg6IG51bWJlcixcbiAgICBwcmV2aW91c0luZGV4OiBudW1iZXIsXG4gICAgY29udGFpbmVyOiBEcm9wTGlzdFJlZixcbiAgICBwcmV2aW91c0NvbnRhaW5lcjogRHJvcExpc3RSZWYsXG4gICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcjogYm9vbGVhbixcbiAgICBkaXN0YW5jZTogUG9pbnQ7XG4gIH0+KCk7XG5cbiAgLyoqIEVtaXRzIGFzIHRoZSB1c2VyIGlzIHN3YXBwaW5nIGl0ZW1zIHdoaWxlIGFjdGl2ZWx5IGRyYWdnaW5nLiAqL1xuICBzb3J0ZWQgPSBuZXcgU3ViamVjdDx7XG4gICAgcHJldmlvdXNJbmRleDogbnVtYmVyLFxuICAgIGN1cnJlbnRJbmRleDogbnVtYmVyLFxuICAgIGNvbnRhaW5lcjogRHJvcExpc3RSZWYsXG4gICAgaXRlbTogRHJhZ1JlZlxuICB9PigpO1xuXG4gIC8qKiBBcmJpdHJhcnkgZGF0YSB0aGF0IGNhbiBiZSBhdHRhY2hlZCB0byB0aGUgZHJvcCBsaXN0LiAqL1xuICBkYXRhOiBUO1xuXG4gIC8qKiBXaGV0aGVyIGFuIGl0ZW0gaW4gdGhlIGxpc3QgaXMgYmVpbmcgZHJhZ2dlZC4gKi9cbiAgcHJpdmF0ZSBfaXNEcmFnZ2luZyA9IGZhbHNlO1xuXG4gIC8qKiBDYWNoZSBvZiB0aGUgZGltZW5zaW9ucyBvZiBhbGwgdGhlIGl0ZW1zIGluc2lkZSB0aGUgY29udGFpbmVyLiAqL1xuICBwcml2YXRlIF9pdGVtUG9zaXRpb25zOiBDYWNoZWRJdGVtUG9zaXRpb25bXSA9IFtdO1xuXG4gIC8qKiBDYWNoZWQgcG9zaXRpb25zIG9mIHRoZSBzY3JvbGxhYmxlIHBhcmVudCBlbGVtZW50cy4gKi9cbiAgcHJpdmF0ZSBfcGFyZW50UG9zaXRpb25zID0gbmV3IE1hcDxEb2N1bWVudHxIVE1MRWxlbWVudCwge1xuICAgIHNjcm9sbFBvc2l0aW9uOiBTY3JvbGxQb3NpdGlvbixcbiAgICBjbGllbnRSZWN0PzogQ2xpZW50UmVjdFxuICB9PigpO1xuXG4gIC8qKiBDYWNoZWQgYENsaWVudFJlY3RgIG9mIHRoZSBkcm9wIGxpc3QuICovXG4gIHByaXZhdGUgX2NsaWVudFJlY3Q6IENsaWVudFJlY3Q7XG5cbiAgLyoqXG4gICAqIERyYWdnYWJsZSBpdGVtcyB0aGF0IGFyZSBjdXJyZW50bHkgYWN0aXZlIGluc2lkZSB0aGUgY29udGFpbmVyLiBJbmNsdWRlcyB0aGUgaXRlbXNcbiAgICogZnJvbSBgX2RyYWdnYWJsZXNgLCBhcyB3ZWxsIGFzIGFueSBpdGVtcyB0aGF0IGhhdmUgYmVlbiBkcmFnZ2VkIGluLCBidXQgaGF2ZW4ndFxuICAgKiBiZWVuIGRyb3BwZWQgeWV0LlxuICAgKi9cbiAgcHJpdmF0ZSBfYWN0aXZlRHJhZ2dhYmxlczogRHJhZ1JlZltdO1xuXG4gIC8qKlxuICAgKiBLZWVwcyB0cmFjayBvZiB0aGUgaXRlbSB0aGF0IHdhcyBsYXN0IHN3YXBwZWQgd2l0aCB0aGUgZHJhZ2dlZCBpdGVtLCBhc1xuICAgKiB3ZWxsIGFzIHdoYXQgZGlyZWN0aW9uIHRoZSBwb2ludGVyIHdhcyBtb3ZpbmcgaW4gd2hlbiB0aGUgc3dhcCBvY2N1cmVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfcHJldmlvdXNTd2FwID0ge2RyYWc6IG51bGwgYXMgRHJhZ1JlZiB8IG51bGwsIGRlbHRhOiAwfTtcblxuICAvKiogRHJhZ2dhYmxlIGl0ZW1zIGluIHRoZSBjb250YWluZXIuICovXG4gIHByaXZhdGUgX2RyYWdnYWJsZXM6IFJlYWRvbmx5QXJyYXk8RHJhZ1JlZj47XG5cbiAgLyoqIERyb3AgbGlzdHMgdGhhdCBhcmUgY29ubmVjdGVkIHRvIHRoZSBjdXJyZW50IG9uZS4gKi9cbiAgcHJpdmF0ZSBfc2libGluZ3M6IFJlYWRvbmx5QXJyYXk8RHJvcExpc3RSZWY+ID0gW107XG5cbiAgLyoqIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgbGlzdCBpcyBvcmllbnRlZC4gKi9cbiAgcHJpdmF0ZSBfb3JpZW50YXRpb246ICdob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCcgPSAndmVydGljYWwnO1xuXG4gIC8qKiBDb25uZWN0ZWQgc2libGluZ3MgdGhhdCBjdXJyZW50bHkgaGF2ZSBhIGRyYWdnZWQgaXRlbS4gKi9cbiAgcHJpdmF0ZSBfYWN0aXZlU2libGluZ3MgPSBuZXcgU2V0PERyb3BMaXN0UmVmPigpO1xuXG4gIC8qKiBMYXlvdXQgZGlyZWN0aW9uIG9mIHRoZSBkcm9wIGxpc3QuICovXG4gIHByaXZhdGUgX2RpcmVjdGlvbjogRGlyZWN0aW9uID0gJ2x0cic7XG5cbiAgLyoqIFN1YnNjcmlwdGlvbiB0byB0aGUgd2luZG93IGJlaW5nIHNjcm9sbGVkLiAqL1xuICBwcml2YXRlIF92aWV3cG9ydFNjcm9sbFN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcblxuICAvKiogVmVydGljYWwgZGlyZWN0aW9uIGluIHdoaWNoIHRoZSBsaXN0IGlzIGN1cnJlbnRseSBzY3JvbGxpbmcuICovXG4gIHByaXZhdGUgX3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLk5PTkU7XG5cbiAgLyoqIEhvcml6b250YWwgZGlyZWN0aW9uIGluIHdoaWNoIHRoZSBsaXN0IGlzIGN1cnJlbnRseSBzY3JvbGxpbmcuICovXG4gIHByaXZhdGUgX2hvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5OT05FO1xuXG4gIC8qKiBOb2RlIHRoYXQgaXMgYmVpbmcgYXV0by1zY3JvbGxlZC4gKi9cbiAgcHJpdmF0ZSBfc2Nyb2xsTm9kZTogSFRNTEVsZW1lbnQgfCBXaW5kb3c7XG5cbiAgLyoqIFVzZWQgdG8gc2lnbmFsIHRvIHRoZSBjdXJyZW50IGF1dG8tc2Nyb2xsIHNlcXVlbmNlIHdoZW4gdG8gc3RvcC4gKi9cbiAgcHJpdmF0ZSBfc3RvcFNjcm9sbFRpbWVycyA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIFNoYWRvdyByb290IG9mIHRoZSBjdXJyZW50IGVsZW1lbnQuIE5lY2Vzc2FyeSBmb3IgYGVsZW1lbnRGcm9tUG9pbnRgIHRvIHJlc29sdmUgY29ycmVjdGx5LiAqL1xuICBwcml2YXRlIF9jYWNoZWRTaGFkb3dSb290OiBEb2N1bWVudE9yU2hhZG93Um9vdCB8IG51bGwgPSBudWxsO1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIGRvY3VtZW50LiAqL1xuICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQ7XG5cbiAgLyoqIEVsZW1lbnRzIHRoYXQgY2FuIGJlIHNjcm9sbGVkIHdoaWxlIHRoZSB1c2VyIGlzIGRyYWdnaW5nLiAqL1xuICBwcml2YXRlIF9zY3JvbGxhYmxlRWxlbWVudHM6IEhUTUxFbGVtZW50W107XG5cbiAgLyoqIEluaXRpYWwgdmFsdWUgZm9yIHRoZSBlbGVtZW50J3MgYHNjcm9sbC1zbmFwLXR5cGVgIHN0eWxlLiAqL1xuICBwcml2YXRlIF9pbml0aWFsU2Nyb2xsU25hcDogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+IHwgSFRNTEVsZW1lbnQsXG4gICAgcHJpdmF0ZSBfZHJhZ0Ryb3BSZWdpc3RyeTogRHJhZ0Ryb3BSZWdpc3RyeTxEcmFnUmVmLCBEcm9wTGlzdFJlZj4sXG4gICAgX2RvY3VtZW50OiBhbnksXG4gICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgcHJpdmF0ZSBfdmlld3BvcnRSdWxlcjogVmlld3BvcnRSdWxlcikge1xuICAgIHRoaXMuZWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoZWxlbWVudCk7XG4gICAgdGhpcy5fZG9jdW1lbnQgPSBfZG9jdW1lbnQ7XG4gICAgdGhpcy53aXRoU2Nyb2xsYWJsZVBhcmVudHMoW3RoaXMuZWxlbWVudF0pO1xuICAgIF9kcmFnRHJvcFJlZ2lzdHJ5LnJlZ2lzdGVyRHJvcENvbnRhaW5lcih0aGlzKTtcbiAgfVxuXG4gIC8qKiBSZW1vdmVzIHRoZSBkcm9wIGxpc3QgZnVuY3Rpb25hbGl0eSBmcm9tIHRoZSBET00gZWxlbWVudC4gKi9cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLl9zdG9wU2Nyb2xsaW5nKCk7XG4gICAgdGhpcy5fc3RvcFNjcm9sbFRpbWVycy5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5iZWZvcmVTdGFydGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5lbnRlcmVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5leGl0ZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmRyb3BwZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLnNvcnRlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX2FjdGl2ZVNpYmxpbmdzLmNsZWFyKCk7XG4gICAgdGhpcy5fc2Nyb2xsTm9kZSA9IG51bGwhO1xuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5jbGVhcigpO1xuICAgIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkucmVtb3ZlRHJvcENvbnRhaW5lcih0aGlzKTtcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIGFuIGl0ZW0gZnJvbSB0aGlzIGxpc3QgaXMgY3VycmVudGx5IGJlaW5nIGRyYWdnZWQuICovXG4gIGlzRHJhZ2dpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lzRHJhZ2dpbmc7XG4gIH1cblxuICAvKiogU3RhcnRzIGRyYWdnaW5nIGFuIGl0ZW0uICovXG4gIHN0YXJ0KCk6IHZvaWQge1xuICAgIGNvbnN0IHN0eWxlcyA9IGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KS5zdHlsZTtcbiAgICB0aGlzLmJlZm9yZVN0YXJ0ZWQubmV4dCgpO1xuICAgIHRoaXMuX2lzRHJhZ2dpbmcgPSB0cnVlO1xuXG4gICAgLy8gV2UgbmVlZCB0byBkaXNhYmxlIHNjcm9sbCBzbmFwcGluZyB3aGlsZSB0aGUgdXNlciBpcyBkcmFnZ2luZywgYmVjYXVzZSBpdCBicmVha3MgYXV0b21hdGljXG4gICAgLy8gc2Nyb2xsaW5nLiBUaGUgYnJvd3NlciBzZWVtcyB0byByb3VuZCB0aGUgdmFsdWUgYmFzZWQgb24gdGhlIHNuYXBwaW5nIHBvaW50cyB3aGljaCBtZWFuc1xuICAgIC8vIHRoYXQgd2UgY2FuJ3QgaW5jcmVtZW50L2RlY3JlbWVudCB0aGUgc2Nyb2xsIHBvc2l0aW9uLlxuICAgIHRoaXMuX2luaXRpYWxTY3JvbGxTbmFwID0gc3R5bGVzLm1zU2Nyb2xsU25hcFR5cGUgfHwgKHN0eWxlcyBhcyBhbnkpLnNjcm9sbFNuYXBUeXBlIHx8ICcnO1xuICAgIChzdHlsZXMgYXMgYW55KS5zY3JvbGxTbmFwVHlwZSA9IHN0eWxlcy5tc1Njcm9sbFNuYXBUeXBlID0gJ25vbmUnO1xuICAgIHRoaXMuX2NhY2hlSXRlbXMoKTtcbiAgICB0aGlzLl9zaWJsaW5ncy5mb3JFYWNoKHNpYmxpbmcgPT4gc2libGluZy5fc3RhcnRSZWNlaXZpbmcodGhpcykpO1xuICAgIHRoaXMuX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fbGlzdGVuVG9TY3JvbGxFdmVudHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbWl0cyBhbiBldmVudCB0byBpbmRpY2F0ZSB0aGF0IHRoZSB1c2VyIG1vdmVkIGFuIGl0ZW0gaW50byB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRoYXQgd2FzIG1vdmVkIGludG8gdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKiBAcGFyYW0gaW5kZXggSW5kZXggYXQgd2hpY2ggdGhlIGl0ZW0gZW50ZXJlZC4gSWYgb21pdHRlZCwgdGhlIGNvbnRhaW5lciB3aWxsIHRyeSB0byBmaWd1cmUgaXRcbiAgICogICBvdXQgYXV0b21hdGljYWxseS5cbiAgICovXG4gIGVudGVyKGl0ZW06IERyYWdSZWYsIHBvaW50ZXJYOiBudW1iZXIsIHBvaW50ZXJZOiBudW1iZXIsIGluZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy5zdGFydCgpO1xuXG4gICAgLy8gSWYgc29ydGluZyBpcyBkaXNhYmxlZCwgd2Ugd2FudCB0aGUgaXRlbSB0byByZXR1cm4gdG8gaXRzIHN0YXJ0aW5nXG4gICAgLy8gcG9zaXRpb24gaWYgdGhlIHVzZXIgaXMgcmV0dXJuaW5nIGl0IHRvIGl0cyBpbml0aWFsIGNvbnRhaW5lci5cbiAgICBsZXQgbmV3SW5kZXg6IG51bWJlcjtcblxuICAgIGlmIChpbmRleCA9PSBudWxsKSB7XG4gICAgICBuZXdJbmRleCA9IHRoaXMuc29ydGluZ0Rpc2FibGVkID8gdGhpcy5fZHJhZ2dhYmxlcy5pbmRleE9mKGl0ZW0pIDogLTE7XG5cbiAgICAgIGlmIChuZXdJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgLy8gV2UgdXNlIHRoZSBjb29yZGluYXRlcyBvZiB3aGVyZSB0aGUgaXRlbSBlbnRlcmVkIHRoZSBkcm9wXG4gICAgICAgIC8vIHpvbmUgdG8gZmlndXJlIG91dCBhdCB3aGljaCBpbmRleCBpdCBzaG91bGQgYmUgaW5zZXJ0ZWQuXG4gICAgICAgIG5ld0luZGV4ID0gdGhpcy5fZ2V0SXRlbUluZGV4RnJvbVBvaW50ZXJQb3NpdGlvbihpdGVtLCBwb2ludGVyWCwgcG9pbnRlclkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBuZXdJbmRleCA9IGluZGV4O1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGl2ZURyYWdnYWJsZXMgPSB0aGlzLl9hY3RpdmVEcmFnZ2FibGVzO1xuICAgIGNvbnN0IGN1cnJlbnRJbmRleCA9IGFjdGl2ZURyYWdnYWJsZXMuaW5kZXhPZihpdGVtKTtcbiAgICBjb25zdCBwbGFjZWhvbGRlciA9IGl0ZW0uZ2V0UGxhY2Vob2xkZXJFbGVtZW50KCk7XG4gICAgbGV0IG5ld1Bvc2l0aW9uUmVmZXJlbmNlOiBEcmFnUmVmIHwgdW5kZWZpbmVkID0gYWN0aXZlRHJhZ2dhYmxlc1tuZXdJbmRleF07XG5cbiAgICAvLyBJZiB0aGUgaXRlbSBhdCB0aGUgbmV3IHBvc2l0aW9uIGlzIHRoZSBzYW1lIGFzIHRoZSBpdGVtIHRoYXQgaXMgYmVpbmcgZHJhZ2dlZCxcbiAgICAvLyBpdCBtZWFucyB0aGF0IHdlJ3JlIHRyeWluZyB0byByZXN0b3JlIHRoZSBpdGVtIHRvIGl0cyBpbml0aWFsIHBvc2l0aW9uLiBJbiB0aGlzXG4gICAgLy8gY2FzZSB3ZSBzaG91bGQgdXNlIHRoZSBuZXh0IGl0ZW0gZnJvbSB0aGUgbGlzdCBhcyB0aGUgcmVmZXJlbmNlLlxuICAgIGlmIChuZXdQb3NpdGlvblJlZmVyZW5jZSA9PT0gaXRlbSkge1xuICAgICAgbmV3UG9zaXRpb25SZWZlcmVuY2UgPSBhY3RpdmVEcmFnZ2FibGVzW25ld0luZGV4ICsgMV07XG4gICAgfVxuXG4gICAgLy8gU2luY2UgdGhlIGl0ZW0gbWF5IGJlIGluIHRoZSBgYWN0aXZlRHJhZ2dhYmxlc2AgYWxyZWFkeSAoZS5nLiBpZiB0aGUgdXNlciBkcmFnZ2VkIGl0XG4gICAgLy8gaW50byBhbm90aGVyIGNvbnRhaW5lciBhbmQgYmFjayBhZ2FpbiksIHdlIGhhdmUgdG8gZW5zdXJlIHRoYXQgaXQgaXNuJ3QgZHVwbGljYXRlZC5cbiAgICBpZiAoY3VycmVudEluZGV4ID4gLTEpIHtcbiAgICAgIGFjdGl2ZURyYWdnYWJsZXMuc3BsaWNlKGN1cnJlbnRJbmRleCwgMSk7XG4gICAgfVxuXG4gICAgLy8gRG9uJ3QgdXNlIGl0ZW1zIHRoYXQgYXJlIGJlaW5nIGRyYWdnZWQgYXMgYSByZWZlcmVuY2UsIGJlY2F1c2VcbiAgICAvLyB0aGVpciBlbGVtZW50IGhhcyBiZWVuIG1vdmVkIGRvd24gdG8gdGhlIGJvdHRvbSBvZiB0aGUgYm9keS5cbiAgICBpZiAobmV3UG9zaXRpb25SZWZlcmVuY2UgJiYgIXRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuaXNEcmFnZ2luZyhuZXdQb3NpdGlvblJlZmVyZW5jZSkpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBuZXdQb3NpdGlvblJlZmVyZW5jZS5nZXRSb290RWxlbWVudCgpO1xuICAgICAgZWxlbWVudC5wYXJlbnRFbGVtZW50IS5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXIsIGVsZW1lbnQpO1xuICAgICAgYWN0aXZlRHJhZ2dhYmxlcy5zcGxpY2UobmV3SW5kZXgsIDAsIGl0ZW0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb2VyY2VFbGVtZW50KHRoaXMuZWxlbWVudCkuYXBwZW5kQ2hpbGQocGxhY2Vob2xkZXIpO1xuICAgICAgYWN0aXZlRHJhZ2dhYmxlcy5wdXNoKGl0ZW0pO1xuICAgIH1cblxuICAgIC8vIFRoZSB0cmFuc2Zvcm0gbmVlZHMgdG8gYmUgY2xlYXJlZCBzbyBpdCBkb2Vzbid0IHRocm93IG9mZiB0aGUgbWVhc3VyZW1lbnRzLlxuICAgIHBsYWNlaG9sZGVyLnN0eWxlLnRyYW5zZm9ybSA9ICcnO1xuXG4gICAgLy8gTm90ZSB0aGF0IHRoZSBwb3NpdGlvbnMgd2VyZSBhbHJlYWR5IGNhY2hlZCB3aGVuIHdlIGNhbGxlZCBgc3RhcnRgIGFib3ZlLFxuICAgIC8vIGJ1dCB3ZSBuZWVkIHRvIHJlZnJlc2ggdGhlbSBzaW5jZSB0aGUgYW1vdW50IG9mIGl0ZW1zIGhhcyBjaGFuZ2VkLlxuICAgIHRoaXMuX2NhY2hlSXRlbVBvc2l0aW9ucygpO1xuICAgIHRoaXMuZW50ZXJlZC5uZXh0KHtpdGVtLCBjb250YWluZXI6IHRoaXMsIGN1cnJlbnRJbmRleDogdGhpcy5nZXRJdGVtSW5kZXgoaXRlbSl9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGFuIGl0ZW0gZnJvbSB0aGUgY29udGFpbmVyIGFmdGVyIGl0IHdhcyBkcmFnZ2VkIGludG8gYW5vdGhlciBjb250YWluZXIgYnkgdGhlIHVzZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdGhhdCB3YXMgZHJhZ2dlZCBvdXQuXG4gICAqL1xuICBleGl0KGl0ZW06IERyYWdSZWYpOiB2b2lkIHtcbiAgICB0aGlzLl9yZXNldCgpO1xuICAgIHRoaXMuZXhpdGVkLm5leHQoe2l0ZW0sIGNvbnRhaW5lcjogdGhpc30pO1xuICB9XG5cbiAgLyoqXG4gICAqIERyb3BzIGFuIGl0ZW0gaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSBiZWluZyBkcm9wcGVkIGludG8gdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGN1cnJlbnRJbmRleCBJbmRleCBhdCB3aGljaCB0aGUgaXRlbSBzaG91bGQgYmUgaW5zZXJ0ZWQuXG4gICAqIEBwYXJhbSBwcmV2aW91c0NvbnRhaW5lciBDb250YWluZXIgZnJvbSB3aGljaCB0aGUgaXRlbSBnb3QgZHJhZ2dlZCBpbi5cbiAgICogQHBhcmFtIGlzUG9pbnRlck92ZXJDb250YWluZXIgV2hldGhlciB0aGUgdXNlcidzIHBvaW50ZXIgd2FzIG92ZXIgdGhlXG4gICAqICAgIGNvbnRhaW5lciB3aGVuIHRoZSBpdGVtIHdhcyBkcm9wcGVkLlxuICAgKiBAcGFyYW0gZGlzdGFuY2UgRGlzdGFuY2UgdGhlIHVzZXIgaGFzIGRyYWdnZWQgc2luY2UgdGhlIHN0YXJ0IG9mIHRoZSBkcmFnZ2luZyBzZXF1ZW5jZS5cbiAgICogQHBhcmFtIHByZXZpb3VzSW5kZXggSW5kZXggb2YgdGhlIGl0ZW0gd2hlbiBkcmFnZ2luZyBzdGFydGVkLlxuICAgKlxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDExLjAuMCBgcHJldmlvdXNJbmRleGAgcGFyYW1ldGVyIHRvIGJlY29tZSByZXF1aXJlZC5cbiAgICovXG4gIGRyb3AoaXRlbTogRHJhZ1JlZiwgY3VycmVudEluZGV4OiBudW1iZXIsIHByZXZpb3VzQ29udGFpbmVyOiBEcm9wTGlzdFJlZixcbiAgICBpc1BvaW50ZXJPdmVyQ29udGFpbmVyOiBib29sZWFuLCBkaXN0YW5jZTogUG9pbnQsIHByZXZpb3VzSW5kZXg/OiBudW1iZXIpOiB2b2lkIHtcbiAgICB0aGlzLl9yZXNldCgpO1xuXG4gICAgLy8gQGJyZWFraW5nLWNoYW5nZSAxMS4wLjAgUmVtb3ZlIHRoaXMgZmFsbGJhY2sgbG9naWMgb25jZSBgcHJldmlvdXNJbmRleGAgaXMgYSByZXF1aXJlZCBwYXJhbS5cbiAgICBpZiAocHJldmlvdXNJbmRleCA9PSBudWxsKSB7XG4gICAgICBwcmV2aW91c0luZGV4ID0gcHJldmlvdXNDb250YWluZXIuZ2V0SXRlbUluZGV4KGl0ZW0pO1xuICAgIH1cblxuICAgIHRoaXMuZHJvcHBlZC5uZXh0KHtpdGVtLFxuICAgICAgY3VycmVudEluZGV4LFxuICAgICAgcHJldmlvdXNJbmRleCxcbiAgICAgIGNvbnRhaW5lcjogdGhpcyxcbiAgICAgIHByZXZpb3VzQ29udGFpbmVyLFxuICAgICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcixcbiAgICAgIGRpc3RhbmNlXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZHJhZ2dhYmxlIGl0ZW1zIHRoYXQgYXJlIGEgcGFydCBvZiB0aGlzIGxpc3QuXG4gICAqIEBwYXJhbSBpdGVtcyBJdGVtcyB0aGF0IGFyZSBhIHBhcnQgb2YgdGhpcyBsaXN0LlxuICAgKi9cbiAgd2l0aEl0ZW1zKGl0ZW1zOiBEcmFnUmVmW10pOiB0aGlzIHtcbiAgICB0aGlzLl9kcmFnZ2FibGVzID0gaXRlbXM7XG4gICAgaXRlbXMuZm9yRWFjaChpdGVtID0+IGl0ZW0uX3dpdGhEcm9wQ29udGFpbmVyKHRoaXMpKTtcblxuICAgIGlmICh0aGlzLmlzRHJhZ2dpbmcoKSkge1xuICAgICAgdGhpcy5fY2FjaGVJdGVtcygpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFNldHMgdGhlIGxheW91dCBkaXJlY3Rpb24gb2YgdGhlIGRyb3AgbGlzdC4gKi9cbiAgd2l0aERpcmVjdGlvbihkaXJlY3Rpb246IERpcmVjdGlvbik6IHRoaXMge1xuICAgIHRoaXMuX2RpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjb250YWluZXJzIHRoYXQgYXJlIGNvbm5lY3RlZCB0byB0aGlzIG9uZS4gV2hlbiB0d28gb3IgbW9yZSBjb250YWluZXJzIGFyZVxuICAgKiBjb25uZWN0ZWQsIHRoZSB1c2VyIHdpbGwgYmUgYWxsb3dlZCB0byB0cmFuc2ZlciBpdGVtcyBiZXR3ZWVuIHRoZW0uXG4gICAqIEBwYXJhbSBjb25uZWN0ZWRUbyBPdGhlciBjb250YWluZXJzIHRoYXQgdGhlIGN1cnJlbnQgY29udGFpbmVycyBzaG91bGQgYmUgY29ubmVjdGVkIHRvLlxuICAgKi9cbiAgY29ubmVjdGVkVG8oY29ubmVjdGVkVG86IERyb3BMaXN0UmVmW10pOiB0aGlzIHtcbiAgICB0aGlzLl9zaWJsaW5ncyA9IGNvbm5lY3RlZFRvLnNsaWNlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgb3JpZW50YXRpb24gb2YgdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIG9yaWVudGF0aW9uIE5ldyBvcmllbnRhdGlvbiBmb3IgdGhlIGNvbnRhaW5lci5cbiAgICovXG4gIHdpdGhPcmllbnRhdGlvbihvcmllbnRhdGlvbjogJ3ZlcnRpY2FsJyB8ICdob3Jpem9udGFsJyk6IHRoaXMge1xuICAgIHRoaXMuX29yaWVudGF0aW9uID0gb3JpZW50YXRpb247XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB3aGljaCBwYXJlbnQgZWxlbWVudHMgYXJlIGNhbiBiZSBzY3JvbGxlZCB3aGlsZSB0aGUgdXNlciBpcyBkcmFnZ2luZy5cbiAgICogQHBhcmFtIGVsZW1lbnRzIEVsZW1lbnRzIHRoYXQgY2FuIGJlIHNjcm9sbGVkLlxuICAgKi9cbiAgd2l0aFNjcm9sbGFibGVQYXJlbnRzKGVsZW1lbnRzOiBIVE1MRWxlbWVudFtdKTogdGhpcyB7XG4gICAgY29uc3QgZWxlbWVudCA9IGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KTtcblxuICAgIC8vIFdlIGFsd2F5cyBhbGxvdyB0aGUgY3VycmVudCBlbGVtZW50IHRvIGJlIHNjcm9sbGFibGVcbiAgICAvLyBzbyB3ZSBuZWVkIHRvIGVuc3VyZSB0aGF0IGl0J3MgaW4gdGhlIGFycmF5LlxuICAgIHRoaXMuX3Njcm9sbGFibGVFbGVtZW50cyA9XG4gICAgICAgIGVsZW1lbnRzLmluZGV4T2YoZWxlbWVudCkgPT09IC0xID8gW2VsZW1lbnQsIC4uLmVsZW1lbnRzXSA6IGVsZW1lbnRzLnNsaWNlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogRmlndXJlcyBvdXQgdGhlIGluZGV4IG9mIGFuIGl0ZW0gaW4gdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB3aG9zZSBpbmRleCBzaG91bGQgYmUgZGV0ZXJtaW5lZC5cbiAgICovXG4gIGdldEl0ZW1JbmRleChpdGVtOiBEcmFnUmVmKTogbnVtYmVyIHtcbiAgICBpZiAoIXRoaXMuX2lzRHJhZ2dpbmcpIHtcbiAgICAgIHJldHVybiB0aGlzLl9kcmFnZ2FibGVzLmluZGV4T2YoaXRlbSk7XG4gICAgfVxuXG4gICAgLy8gSXRlbXMgYXJlIHNvcnRlZCBhbHdheXMgYnkgdG9wL2xlZnQgaW4gdGhlIGNhY2hlLCBob3dldmVyIHRoZXkgZmxvdyBkaWZmZXJlbnRseSBpbiBSVEwuXG4gICAgLy8gVGhlIHJlc3Qgb2YgdGhlIGxvZ2ljIHN0aWxsIHN0YW5kcyBubyBtYXR0ZXIgd2hhdCBvcmllbnRhdGlvbiB3ZSdyZSBpbiwgaG93ZXZlclxuICAgIC8vIHdlIG5lZWQgdG8gaW52ZXJ0IHRoZSBhcnJheSB3aGVuIGRldGVybWluaW5nIHRoZSBpbmRleC5cbiAgICBjb25zdCBpdGVtcyA9IHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcgJiYgdGhpcy5fZGlyZWN0aW9uID09PSAncnRsJyA/XG4gICAgICAgIHRoaXMuX2l0ZW1Qb3NpdGlvbnMuc2xpY2UoKS5yZXZlcnNlKCkgOiB0aGlzLl9pdGVtUG9zaXRpb25zO1xuXG4gICAgcmV0dXJuIGZpbmRJbmRleChpdGVtcywgY3VycmVudEl0ZW0gPT4gY3VycmVudEl0ZW0uZHJhZyA9PT0gaXRlbSk7XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0aGUgbGlzdCBpcyBhYmxlIHRvIHJlY2VpdmUgdGhlIGl0ZW0gdGhhdFxuICAgKiBpcyBjdXJyZW50bHkgYmVpbmcgZHJhZ2dlZCBpbnNpZGUgYSBjb25uZWN0ZWQgZHJvcCBsaXN0LlxuICAgKi9cbiAgaXNSZWNlaXZpbmcoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2FjdGl2ZVNpYmxpbmdzLnNpemUgPiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIFNvcnRzIGFuIGl0ZW0gaW5zaWRlIHRoZSBjb250YWluZXIgYmFzZWQgb24gaXRzIHBvc2l0aW9uLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRvIGJlIHNvcnRlZC5cbiAgICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKiBAcGFyYW0gcG9pbnRlckRlbHRhIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgcG9pbnRlciBpcyBtb3ZpbmcgYWxvbmcgZWFjaCBheGlzLlxuICAgKi9cbiAgX3NvcnRJdGVtKGl0ZW06IERyYWdSZWYsIHBvaW50ZXJYOiBudW1iZXIsIHBvaW50ZXJZOiBudW1iZXIsXG4gICAgICAgICAgICBwb2ludGVyRGVsdGE6IHt4OiBudW1iZXIsIHk6IG51bWJlcn0pOiB2b2lkIHtcbiAgICAvLyBEb24ndCBzb3J0IHRoZSBpdGVtIGlmIHNvcnRpbmcgaXMgZGlzYWJsZWQgb3IgaXQncyBvdXQgb2YgcmFuZ2UuXG4gICAgaWYgKHRoaXMuc29ydGluZ0Rpc2FibGVkIHx8ICFpc1BvaW50ZXJOZWFyQ2xpZW50UmVjdCh0aGlzLl9jbGllbnRSZWN0LCBwb2ludGVyWCwgcG9pbnRlclkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc2libGluZ3MgPSB0aGlzLl9pdGVtUG9zaXRpb25zO1xuICAgIGNvbnN0IG5ld0luZGV4ID0gdGhpcy5fZ2V0SXRlbUluZGV4RnJvbVBvaW50ZXJQb3NpdGlvbihpdGVtLCBwb2ludGVyWCwgcG9pbnRlclksIHBvaW50ZXJEZWx0YSk7XG5cbiAgICBpZiAobmV3SW5kZXggPT09IC0xICYmIHNpYmxpbmdzLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuICAgIGNvbnN0IGN1cnJlbnRJbmRleCA9IGZpbmRJbmRleChzaWJsaW5ncywgY3VycmVudEl0ZW0gPT4gY3VycmVudEl0ZW0uZHJhZyA9PT0gaXRlbSk7XG4gICAgY29uc3Qgc2libGluZ0F0TmV3UG9zaXRpb24gPSBzaWJsaW5nc1tuZXdJbmRleF07XG4gICAgY29uc3QgY3VycmVudFBvc2l0aW9uID0gc2libGluZ3NbY3VycmVudEluZGV4XS5jbGllbnRSZWN0O1xuICAgIGNvbnN0IG5ld1Bvc2l0aW9uID0gc2libGluZ0F0TmV3UG9zaXRpb24uY2xpZW50UmVjdDtcbiAgICBjb25zdCBkZWx0YSA9IGN1cnJlbnRJbmRleCA+IG5ld0luZGV4ID8gMSA6IC0xO1xuXG4gICAgdGhpcy5fcHJldmlvdXNTd2FwLmRyYWcgPSBzaWJsaW5nQXROZXdQb3NpdGlvbi5kcmFnO1xuICAgIHRoaXMuX3ByZXZpb3VzU3dhcC5kZWx0YSA9IGlzSG9yaXpvbnRhbCA/IHBvaW50ZXJEZWx0YS54IDogcG9pbnRlckRlbHRhLnk7XG5cbiAgICAvLyBIb3cgbWFueSBwaXhlbHMgdGhlIGl0ZW0ncyBwbGFjZWhvbGRlciBzaG91bGQgYmUgb2Zmc2V0LlxuICAgIGNvbnN0IGl0ZW1PZmZzZXQgPSB0aGlzLl9nZXRJdGVtT2Zmc2V0UHgoY3VycmVudFBvc2l0aW9uLCBuZXdQb3NpdGlvbiwgZGVsdGEpO1xuXG4gICAgLy8gSG93IG1hbnkgcGl4ZWxzIGFsbCB0aGUgb3RoZXIgaXRlbXMgc2hvdWxkIGJlIG9mZnNldC5cbiAgICBjb25zdCBzaWJsaW5nT2Zmc2V0ID0gdGhpcy5fZ2V0U2libGluZ09mZnNldFB4KGN1cnJlbnRJbmRleCwgc2libGluZ3MsIGRlbHRhKTtcblxuICAgIC8vIFNhdmUgdGhlIHByZXZpb3VzIG9yZGVyIG9mIHRoZSBpdGVtcyBiZWZvcmUgbW92aW5nIHRoZSBpdGVtIHRvIGl0cyBuZXcgaW5kZXguXG4gICAgLy8gV2UgdXNlIHRoaXMgdG8gY2hlY2sgd2hldGhlciBhbiBpdGVtIGhhcyBiZWVuIG1vdmVkIGFzIGEgcmVzdWx0IG9mIHRoZSBzb3J0aW5nLlxuICAgIGNvbnN0IG9sZE9yZGVyID0gc2libGluZ3Muc2xpY2UoKTtcblxuICAgIC8vIFNodWZmbGUgdGhlIGFycmF5IGluIHBsYWNlLlxuICAgIG1vdmVJdGVtSW5BcnJheShzaWJsaW5ncywgY3VycmVudEluZGV4LCBuZXdJbmRleCk7XG5cbiAgICB0aGlzLnNvcnRlZC5uZXh0KHtcbiAgICAgIHByZXZpb3VzSW5kZXg6IGN1cnJlbnRJbmRleCxcbiAgICAgIGN1cnJlbnRJbmRleDogbmV3SW5kZXgsXG4gICAgICBjb250YWluZXI6IHRoaXMsXG4gICAgICBpdGVtXG4gICAgfSk7XG5cbiAgICBzaWJsaW5ncy5mb3JFYWNoKChzaWJsaW5nLCBpbmRleCkgPT4ge1xuICAgICAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgdGhlIHBvc2l0aW9uIGhhc24ndCBjaGFuZ2VkLlxuICAgICAgaWYgKG9sZE9yZGVyW2luZGV4XSA9PT0gc2libGluZykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGlzRHJhZ2dlZEl0ZW0gPSBzaWJsaW5nLmRyYWcgPT09IGl0ZW07XG4gICAgICBjb25zdCBvZmZzZXQgPSBpc0RyYWdnZWRJdGVtID8gaXRlbU9mZnNldCA6IHNpYmxpbmdPZmZzZXQ7XG4gICAgICBjb25zdCBlbGVtZW50VG9PZmZzZXQgPSBpc0RyYWdnZWRJdGVtID8gaXRlbS5nZXRQbGFjZWhvbGRlckVsZW1lbnQoKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2libGluZy5kcmFnLmdldFJvb3RFbGVtZW50KCk7XG5cbiAgICAgIC8vIFVwZGF0ZSB0aGUgb2Zmc2V0IHRvIHJlZmxlY3QgdGhlIG5ldyBwb3NpdGlvbi5cbiAgICAgIHNpYmxpbmcub2Zmc2V0ICs9IG9mZnNldDtcblxuICAgICAgLy8gU2luY2Ugd2UncmUgbW92aW5nIHRoZSBpdGVtcyB3aXRoIGEgYHRyYW5zZm9ybWAsIHdlIG5lZWQgdG8gYWRqdXN0IHRoZWlyIGNhY2hlZFxuICAgICAgLy8gY2xpZW50IHJlY3RzIHRvIHJlZmxlY3QgdGhlaXIgbmV3IHBvc2l0aW9uLCBhcyB3ZWxsIGFzIHN3YXAgdGhlaXIgcG9zaXRpb25zIGluIHRoZSBjYWNoZS5cbiAgICAgIC8vIE5vdGUgdGhhdCB3ZSBzaG91bGRuJ3QgdXNlIGBnZXRCb3VuZGluZ0NsaWVudFJlY3RgIGhlcmUgdG8gdXBkYXRlIHRoZSBjYWNoZSwgYmVjYXVzZSB0aGVcbiAgICAgIC8vIGVsZW1lbnRzIG1heSBiZSBtaWQtYW5pbWF0aW9uIHdoaWNoIHdpbGwgZ2l2ZSB1cyBhIHdyb25nIHJlc3VsdC5cbiAgICAgIGlmIChpc0hvcml6b250YWwpIHtcbiAgICAgICAgLy8gUm91bmQgdGhlIHRyYW5zZm9ybXMgc2luY2Ugc29tZSBicm93c2VycyB3aWxsXG4gICAgICAgIC8vIGJsdXIgdGhlIGVsZW1lbnRzLCBmb3Igc3ViLXBpeGVsIHRyYW5zZm9ybXMuXG4gICAgICAgIGVsZW1lbnRUb09mZnNldC5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlM2QoJHtNYXRoLnJvdW5kKHNpYmxpbmcub2Zmc2V0KX1weCwgMCwgMClgO1xuICAgICAgICBhZGp1c3RDbGllbnRSZWN0KHNpYmxpbmcuY2xpZW50UmVjdCwgMCwgb2Zmc2V0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsZW1lbnRUb09mZnNldC5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlM2QoMCwgJHtNYXRoLnJvdW5kKHNpYmxpbmcub2Zmc2V0KX1weCwgMClgO1xuICAgICAgICBhZGp1c3RDbGllbnRSZWN0KHNpYmxpbmcuY2xpZW50UmVjdCwgb2Zmc2V0LCAwKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgdXNlcidzIHBvaW50ZXIgaXMgY2xvc2UgdG8gdGhlIGVkZ2VzIG9mIGVpdGhlciB0aGVcbiAgICogdmlld3BvcnQgb3IgdGhlIGRyb3AgbGlzdCBhbmQgc3RhcnRzIHRoZSBhdXRvLXNjcm9sbCBzZXF1ZW5jZS5cbiAgICogQHBhcmFtIHBvaW50ZXJYIFVzZXIncyBwb2ludGVyIHBvc2l0aW9uIGFsb25nIHRoZSB4IGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBVc2VyJ3MgcG9pbnRlciBwb3NpdGlvbiBhbG9uZyB0aGUgeSBheGlzLlxuICAgKi9cbiAgX3N0YXJ0U2Nyb2xsaW5nSWZOZWNlc3NhcnkocG9pbnRlclg6IG51bWJlciwgcG9pbnRlclk6IG51bWJlcikge1xuICAgIGlmICh0aGlzLmF1dG9TY3JvbGxEaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBzY3JvbGxOb2RlOiBIVE1MRWxlbWVudCB8IFdpbmRvdyB8IHVuZGVmaW5lZDtcbiAgICBsZXQgdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uTk9ORTtcbiAgICBsZXQgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLk5PTkU7XG5cbiAgICAvLyBDaGVjayB3aGV0aGVyIHdlIHNob3VsZCBzdGFydCBzY3JvbGxpbmcgYW55IG9mIHRoZSBwYXJlbnQgY29udGFpbmVycy5cbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuZm9yRWFjaCgocG9zaXRpb24sIGVsZW1lbnQpID0+IHtcbiAgICAgIC8vIFdlIGhhdmUgc3BlY2lhbCBoYW5kbGluZyBmb3IgdGhlIGBkb2N1bWVudGAgYmVsb3cuIEFsc28gdGhpcyB3b3VsZCBiZVxuICAgICAgLy8gbmljZXIgd2l0aCBhICBmb3IuLi5vZiBsb29wLCBidXQgaXQgcmVxdWlyZXMgY2hhbmdpbmcgYSBjb21waWxlciBmbGFnLlxuICAgICAgaWYgKGVsZW1lbnQgPT09IHRoaXMuX2RvY3VtZW50IHx8ICFwb3NpdGlvbi5jbGllbnRSZWN0IHx8IHNjcm9sbE5vZGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNQb2ludGVyTmVhckNsaWVudFJlY3QocG9zaXRpb24uY2xpZW50UmVjdCwgcG9pbnRlclgsIHBvaW50ZXJZKSkge1xuICAgICAgICBbdmVydGljYWxTY3JvbGxEaXJlY3Rpb24sIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb25dID0gZ2V0RWxlbWVudFNjcm9sbERpcmVjdGlvbnMoXG4gICAgICAgICAgICBlbGVtZW50IGFzIEhUTUxFbGVtZW50LCBwb3NpdGlvbi5jbGllbnRSZWN0LCBwb2ludGVyWCwgcG9pbnRlclkpO1xuXG4gICAgICAgIGlmICh2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiB8fCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKSB7XG4gICAgICAgICAgc2Nyb2xsTm9kZSA9IGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIE90aGVyd2lzZSBjaGVjayBpZiB3ZSBjYW4gc3RhcnQgc2Nyb2xsaW5nIHRoZSB2aWV3cG9ydC5cbiAgICBpZiAoIXZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uICYmICFob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKSB7XG4gICAgICBjb25zdCB7d2lkdGgsIGhlaWdodH0gPSB0aGlzLl92aWV3cG9ydFJ1bGVyLmdldFZpZXdwb3J0U2l6ZSgpO1xuICAgICAgY29uc3QgY2xpZW50UmVjdCA9IHt3aWR0aCwgaGVpZ2h0LCB0b3A6IDAsIHJpZ2h0OiB3aWR0aCwgYm90dG9tOiBoZWlnaHQsIGxlZnQ6IDB9O1xuICAgICAgdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSBnZXRWZXJ0aWNhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0LCBwb2ludGVyWSk7XG4gICAgICBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gZ2V0SG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0LCBwb2ludGVyWCk7XG4gICAgICBzY3JvbGxOb2RlID0gd2luZG93O1xuICAgIH1cblxuICAgIGlmIChzY3JvbGxOb2RlICYmICh2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiAhPT0gdGhpcy5fdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gfHxcbiAgICAgICAgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiAhPT0gdGhpcy5faG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiB8fFxuICAgICAgICBzY3JvbGxOb2RlICE9PSB0aGlzLl9zY3JvbGxOb2RlKSkge1xuICAgICAgdGhpcy5fdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSB2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbjtcbiAgICAgIHRoaXMuX2hvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uO1xuICAgICAgdGhpcy5fc2Nyb2xsTm9kZSA9IHNjcm9sbE5vZGU7XG5cbiAgICAgIGlmICgodmVydGljYWxTY3JvbGxEaXJlY3Rpb24gfHwgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbikgJiYgc2Nyb2xsTm9kZSkge1xuICAgICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIodGhpcy5fc3RhcnRTY3JvbGxJbnRlcnZhbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9zdG9wU2Nyb2xsaW5nKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIFN0b3BzIGFueSBjdXJyZW50bHktcnVubmluZyBhdXRvLXNjcm9sbCBzZXF1ZW5jZXMuICovXG4gIF9zdG9wU2Nyb2xsaW5nKCkge1xuICAgIHRoaXMuX3N0b3BTY3JvbGxUaW1lcnMubmV4dCgpO1xuICB9XG5cbiAgLyoqIENhY2hlcyB0aGUgcG9zaXRpb25zIG9mIHRoZSBjb25maWd1cmVkIHNjcm9sbGFibGUgcGFyZW50cy4gKi9cbiAgcHJpdmF0ZSBfY2FjaGVQYXJlbnRQb3NpdGlvbnMoKSB7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLmNsZWFyKCk7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLnNldCh0aGlzLl9kb2N1bWVudCwge1xuICAgICAgc2Nyb2xsUG9zaXRpb246IHRoaXMuX3ZpZXdwb3J0UnVsZXIhLmdldFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24oKSxcbiAgICB9KTtcbiAgICB0aGlzLl9zY3JvbGxhYmxlRWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgIGNvbnN0IGNsaWVudFJlY3QgPSBnZXRNdXRhYmxlQ2xpZW50UmVjdChlbGVtZW50KTtcblxuICAgICAgLy8gV2Uga2VlcCB0aGUgQ2xpZW50UmVjdCBjYWNoZWQgaW4gdHdvIHByb3BlcnRpZXMsIGJlY2F1c2UgaXQncyByZWZlcmVuY2VkIGluIGEgbG90IG9mXG4gICAgICAvLyBwZXJmb3JtYW5jZS1zZW5zaXRpdmUgcGxhY2VzIGFuZCB3ZSB3YW50IHRvIGF2b2lkIHRoZSBleHRyYSBsb29rdXBzLiBUaGUgYGVsZW1lbnRgIGlzXG4gICAgICAvLyBndWFyYW50ZWVkIHRvIGFsd2F5cyBiZSBpbiB0aGUgYF9zY3JvbGxhYmxlRWxlbWVudHNgIHNvIHRoaXMgc2hvdWxkIGFsd2F5cyBtYXRjaC5cbiAgICAgIGlmIChlbGVtZW50ID09PSB0aGlzLmVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5fY2xpZW50UmVjdCA9IGNsaWVudFJlY3Q7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5zZXQoZWxlbWVudCwge1xuICAgICAgICBzY3JvbGxQb3NpdGlvbjoge3RvcDogZWxlbWVudC5zY3JvbGxUb3AsIGxlZnQ6IGVsZW1lbnQuc2Nyb2xsTGVmdH0sXG4gICAgICAgIGNsaWVudFJlY3RcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIFJlZnJlc2hlcyB0aGUgcG9zaXRpb24gY2FjaGUgb2YgdGhlIGl0ZW1zIGFuZCBzaWJsaW5nIGNvbnRhaW5lcnMuICovXG4gIHByaXZhdGUgX2NhY2hlSXRlbVBvc2l0aW9ucygpIHtcbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuXG4gICAgdGhpcy5faXRlbVBvc2l0aW9ucyA9IHRoaXMuX2FjdGl2ZURyYWdnYWJsZXMubWFwKGRyYWcgPT4ge1xuICAgICAgY29uc3QgZWxlbWVudFRvTWVhc3VyZSA9IGRyYWcuZ2V0VmlzaWJsZUVsZW1lbnQoKTtcbiAgICAgIHJldHVybiB7ZHJhZywgb2Zmc2V0OiAwLCBjbGllbnRSZWN0OiBnZXRNdXRhYmxlQ2xpZW50UmVjdChlbGVtZW50VG9NZWFzdXJlKX07XG4gICAgfSkuc29ydCgoYSwgYikgPT4ge1xuICAgICAgcmV0dXJuIGlzSG9yaXpvbnRhbCA/IGEuY2xpZW50UmVjdC5sZWZ0IC0gYi5jbGllbnRSZWN0LmxlZnQgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGEuY2xpZW50UmVjdC50b3AgLSBiLmNsaWVudFJlY3QudG9wO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIFJlc2V0cyB0aGUgY29udGFpbmVyIHRvIGl0cyBpbml0aWFsIHN0YXRlLiAqL1xuICBwcml2YXRlIF9yZXNldCgpIHtcbiAgICB0aGlzLl9pc0RyYWdnaW5nID0gZmFsc2U7XG5cbiAgICBjb25zdCBzdHlsZXMgPSBjb2VyY2VFbGVtZW50KHRoaXMuZWxlbWVudCkuc3R5bGU7XG4gICAgKHN0eWxlcyBhcyBhbnkpLnNjcm9sbFNuYXBUeXBlID0gc3R5bGVzLm1zU2Nyb2xsU25hcFR5cGUgPSB0aGlzLl9pbml0aWFsU2Nyb2xsU25hcDtcblxuICAgIC8vIFRPRE8oY3Jpc2JldG8pOiBtYXkgaGF2ZSB0byB3YWl0IGZvciB0aGUgYW5pbWF0aW9ucyB0byBmaW5pc2guXG4gICAgdGhpcy5fYWN0aXZlRHJhZ2dhYmxlcy5mb3JFYWNoKGl0ZW0gPT4gaXRlbS5nZXRSb290RWxlbWVudCgpLnN0eWxlLnRyYW5zZm9ybSA9ICcnKTtcbiAgICB0aGlzLl9zaWJsaW5ncy5mb3JFYWNoKHNpYmxpbmcgPT4gc2libGluZy5fc3RvcFJlY2VpdmluZyh0aGlzKSk7XG4gICAgdGhpcy5fYWN0aXZlRHJhZ2dhYmxlcyA9IFtdO1xuICAgIHRoaXMuX2l0ZW1Qb3NpdGlvbnMgPSBbXTtcbiAgICB0aGlzLl9wcmV2aW91c1N3YXAuZHJhZyA9IG51bGw7XG4gICAgdGhpcy5fcHJldmlvdXNTd2FwLmRlbHRhID0gMDtcbiAgICB0aGlzLl9zdG9wU2Nyb2xsaW5nKCk7XG4gICAgdGhpcy5fdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBvZmZzZXQgaW4gcGl4ZWxzIGJ5IHdoaWNoIHRoZSBpdGVtcyB0aGF0IGFyZW4ndCBiZWluZyBkcmFnZ2VkIHNob3VsZCBiZSBtb3ZlZC5cbiAgICogQHBhcmFtIGN1cnJlbnRJbmRleCBJbmRleCBvZiB0aGUgaXRlbSBjdXJyZW50bHkgYmVpbmcgZHJhZ2dlZC5cbiAgICogQHBhcmFtIHNpYmxpbmdzIEFsbCBvZiB0aGUgaXRlbXMgaW4gdGhlIGxpc3QuXG4gICAqIEBwYXJhbSBkZWx0YSBEaXJlY3Rpb24gaW4gd2hpY2ggdGhlIHVzZXIgaXMgbW92aW5nLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0U2libGluZ09mZnNldFB4KGN1cnJlbnRJbmRleDogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2libGluZ3M6IENhY2hlZEl0ZW1Qb3NpdGlvbltdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsdGE6IDEgfCAtMSkge1xuXG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gdGhpcy5fb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJztcbiAgICBjb25zdCBjdXJyZW50UG9zaXRpb24gPSBzaWJsaW5nc1tjdXJyZW50SW5kZXhdLmNsaWVudFJlY3Q7XG4gICAgY29uc3QgaW1tZWRpYXRlU2libGluZyA9IHNpYmxpbmdzW2N1cnJlbnRJbmRleCArIGRlbHRhICogLTFdO1xuICAgIGxldCBzaWJsaW5nT2Zmc2V0ID0gY3VycmVudFBvc2l0aW9uW2lzSG9yaXpvbnRhbCA/ICd3aWR0aCcgOiAnaGVpZ2h0J10gKiBkZWx0YTtcblxuICAgIGlmIChpbW1lZGlhdGVTaWJsaW5nKSB7XG4gICAgICBjb25zdCBzdGFydCA9IGlzSG9yaXpvbnRhbCA/ICdsZWZ0JyA6ICd0b3AnO1xuICAgICAgY29uc3QgZW5kID0gaXNIb3Jpem9udGFsID8gJ3JpZ2h0JyA6ICdib3R0b20nO1xuXG4gICAgICAvLyBHZXQgdGhlIHNwYWNpbmcgYmV0d2VlbiB0aGUgc3RhcnQgb2YgdGhlIGN1cnJlbnQgaXRlbSBhbmQgdGhlIGVuZCBvZiB0aGUgb25lIGltbWVkaWF0ZWx5XG4gICAgICAvLyBhZnRlciBpdCBpbiB0aGUgZGlyZWN0aW9uIGluIHdoaWNoIHRoZSB1c2VyIGlzIGRyYWdnaW5nLCBvciB2aWNlIHZlcnNhLiBXZSBhZGQgaXQgdG8gdGhlXG4gICAgICAvLyBvZmZzZXQgaW4gb3JkZXIgdG8gcHVzaCB0aGUgZWxlbWVudCB0byB3aGVyZSBpdCB3aWxsIGJlIHdoZW4gaXQncyBpbmxpbmUgYW5kIGlzIGluZmx1ZW5jZWRcbiAgICAgIC8vIGJ5IHRoZSBgbWFyZ2luYCBvZiBpdHMgc2libGluZ3MuXG4gICAgICBpZiAoZGVsdGEgPT09IC0xKSB7XG4gICAgICAgIHNpYmxpbmdPZmZzZXQgLT0gaW1tZWRpYXRlU2libGluZy5jbGllbnRSZWN0W3N0YXJ0XSAtIGN1cnJlbnRQb3NpdGlvbltlbmRdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2libGluZ09mZnNldCArPSBjdXJyZW50UG9zaXRpb25bc3RhcnRdIC0gaW1tZWRpYXRlU2libGluZy5jbGllbnRSZWN0W2VuZF07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNpYmxpbmdPZmZzZXQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgb2Zmc2V0IGluIHBpeGVscyBieSB3aGljaCB0aGUgaXRlbSB0aGF0IGlzIGJlaW5nIGRyYWdnZWQgc2hvdWxkIGJlIG1vdmVkLlxuICAgKiBAcGFyYW0gY3VycmVudFBvc2l0aW9uIEN1cnJlbnQgcG9zaXRpb24gb2YgdGhlIGl0ZW0uXG4gICAqIEBwYXJhbSBuZXdQb3NpdGlvbiBQb3NpdGlvbiBvZiB0aGUgaXRlbSB3aGVyZSB0aGUgY3VycmVudCBpdGVtIHNob3VsZCBiZSBtb3ZlZC5cbiAgICogQHBhcmFtIGRlbHRhIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgdXNlciBpcyBtb3ZpbmcuXG4gICAqL1xuICBwcml2YXRlIF9nZXRJdGVtT2Zmc2V0UHgoY3VycmVudFBvc2l0aW9uOiBDbGllbnRSZWN0LCBuZXdQb3NpdGlvbjogQ2xpZW50UmVjdCwgZGVsdGE6IDEgfCAtMSkge1xuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCc7XG4gICAgbGV0IGl0ZW1PZmZzZXQgPSBpc0hvcml6b250YWwgPyBuZXdQb3NpdGlvbi5sZWZ0IC0gY3VycmVudFBvc2l0aW9uLmxlZnQgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3UG9zaXRpb24udG9wIC0gY3VycmVudFBvc2l0aW9uLnRvcDtcblxuICAgIC8vIEFjY291bnQgZm9yIGRpZmZlcmVuY2VzIGluIHRoZSBpdGVtIHdpZHRoL2hlaWdodC5cbiAgICBpZiAoZGVsdGEgPT09IC0xKSB7XG4gICAgICBpdGVtT2Zmc2V0ICs9IGlzSG9yaXpvbnRhbCA/IG5ld1Bvc2l0aW9uLndpZHRoIC0gY3VycmVudFBvc2l0aW9uLndpZHRoIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3UG9zaXRpb24uaGVpZ2h0IC0gY3VycmVudFBvc2l0aW9uLmhlaWdodDtcbiAgICB9XG5cbiAgICByZXR1cm4gaXRlbU9mZnNldDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpbmRleCBvZiBhbiBpdGVtIGluIHRoZSBkcm9wIGNvbnRhaW5lciwgYmFzZWQgb24gdGhlIHBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB0aGF0IGlzIGJlaW5nIHNvcnRlZC5cbiAgICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0gcG9pbnRlclkgUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqIEBwYXJhbSBkZWx0YSBEaXJlY3Rpb24gaW4gd2hpY2ggdGhlIHVzZXIgaXMgbW92aW5nIHRoZWlyIHBvaW50ZXIuXG4gICAqL1xuICBwcml2YXRlIF9nZXRJdGVtSW5kZXhGcm9tUG9pbnRlclBvc2l0aW9uKGl0ZW06IERyYWdSZWYsIHBvaW50ZXJYOiBudW1iZXIsIHBvaW50ZXJZOiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsdGE/OiB7eDogbnVtYmVyLCB5OiBudW1iZXJ9KSB7XG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gdGhpcy5fb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJztcblxuICAgIHJldHVybiBmaW5kSW5kZXgodGhpcy5faXRlbVBvc2l0aW9ucywgKHtkcmFnLCBjbGllbnRSZWN0fSwgXywgYXJyYXkpID0+IHtcbiAgICAgIGlmIChkcmFnID09PSBpdGVtKSB7XG4gICAgICAgIC8vIElmIHRoZXJlJ3Mgb25seSBvbmUgaXRlbSBsZWZ0IGluIHRoZSBjb250YWluZXIsIGl0IG11c3QgYmVcbiAgICAgICAgLy8gdGhlIGRyYWdnZWQgaXRlbSBpdHNlbGYgc28gd2UgdXNlIGl0IGFzIGEgcmVmZXJlbmNlLlxuICAgICAgICByZXR1cm4gYXJyYXkubGVuZ3RoIDwgMjtcbiAgICAgIH1cblxuICAgICAgaWYgKGRlbHRhKSB7XG4gICAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IGlzSG9yaXpvbnRhbCA/IGRlbHRhLnggOiBkZWx0YS55O1xuXG4gICAgICAgIC8vIElmIHRoZSB1c2VyIGlzIHN0aWxsIGhvdmVyaW5nIG92ZXIgdGhlIHNhbWUgaXRlbSBhcyBsYXN0IHRpbWUsIGFuZCB0aGV5IGRpZG4ndCBjaGFuZ2VcbiAgICAgICAgLy8gdGhlIGRpcmVjdGlvbiBpbiB3aGljaCB0aGV5J3JlIGRyYWdnaW5nLCB3ZSBkb24ndCBjb25zaWRlciBpdCBhIGRpcmVjdGlvbiBzd2FwLlxuICAgICAgICBpZiAoZHJhZyA9PT0gdGhpcy5fcHJldmlvdXNTd2FwLmRyYWcgJiYgZGlyZWN0aW9uID09PSB0aGlzLl9wcmV2aW91c1N3YXAuZGVsdGEpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGlzSG9yaXpvbnRhbCA/XG4gICAgICAgICAgLy8gUm91bmQgdGhlc2UgZG93biBzaW5jZSBtb3N0IGJyb3dzZXJzIHJlcG9ydCBjbGllbnQgcmVjdHMgd2l0aFxuICAgICAgICAgIC8vIHN1Yi1waXhlbCBwcmVjaXNpb24sIHdoZXJlYXMgdGhlIHBvaW50ZXIgY29vcmRpbmF0ZXMgYXJlIHJvdW5kZWQgdG8gcGl4ZWxzLlxuICAgICAgICAgIHBvaW50ZXJYID49IE1hdGguZmxvb3IoY2xpZW50UmVjdC5sZWZ0KSAmJiBwb2ludGVyWCA8PSBNYXRoLmZsb29yKGNsaWVudFJlY3QucmlnaHQpIDpcbiAgICAgICAgICBwb2ludGVyWSA+PSBNYXRoLmZsb29yKGNsaWVudFJlY3QudG9wKSAmJiBwb2ludGVyWSA8PSBNYXRoLmZsb29yKGNsaWVudFJlY3QuYm90dG9tKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBDYWNoZXMgdGhlIGN1cnJlbnQgaXRlbXMgaW4gdGhlIGxpc3QgYW5kIHRoZWlyIHBvc2l0aW9ucy4gKi9cbiAgcHJpdmF0ZSBfY2FjaGVJdGVtcygpOiB2b2lkIHtcbiAgICB0aGlzLl9hY3RpdmVEcmFnZ2FibGVzID0gdGhpcy5fZHJhZ2dhYmxlcy5zbGljZSgpO1xuICAgIHRoaXMuX2NhY2hlSXRlbVBvc2l0aW9ucygpO1xuICAgIHRoaXMuX2NhY2hlUGFyZW50UG9zaXRpb25zKCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgaW50ZXJuYWwgc3RhdGUgb2YgdGhlIGNvbnRhaW5lciBhZnRlciBhIHNjcm9sbCBldmVudCBoYXMgaGFwcGVuZWQuXG4gICAqIEBwYXJhbSBzY3JvbGxlZFBhcmVudCBFbGVtZW50IHRoYXQgd2FzIHNjcm9sbGVkLlxuICAgKiBAcGFyYW0gbmV3VG9wIE5ldyB0b3Agc2Nyb2xsIHBvc2l0aW9uLlxuICAgKiBAcGFyYW0gbmV3TGVmdCBOZXcgbGVmdCBzY3JvbGwgcG9zaXRpb24uXG4gICAqL1xuICBwcml2YXRlIF91cGRhdGVBZnRlclNjcm9sbChzY3JvbGxlZFBhcmVudDogSFRNTEVsZW1lbnQgfCBEb2N1bWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3VG9wOiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0xlZnQ6IG51bWJlcikge1xuICAgIC8vIFVzZWQgd2hlbiBmaWd1cmluZyBvdXQgd2hldGhlciBhbiBlbGVtZW50IGlzIGluc2lkZSB0aGUgc2Nyb2xsIHBhcmVudC4gSWYgdGhlIHNjcm9sbGVkXG4gICAgLy8gcGFyZW50IGlzIHRoZSBgZG9jdW1lbnRgLCB3ZSB1c2UgdGhlIGBkb2N1bWVudEVsZW1lbnRgLCBiZWNhdXNlIElFIGRvZXNuJ3Qgc3VwcG9ydCBgY29udGFpbnNgXG4gICAgLy8gb24gdGhlIGBkb2N1bWVudGAuXG4gICAgY29uc3Qgc2Nyb2xsZWRQYXJlbnROb2RlID1cbiAgICAgICAgc2Nyb2xsZWRQYXJlbnQgPT09IHRoaXMuX2RvY3VtZW50ID8gc2Nyb2xsZWRQYXJlbnQuZG9jdW1lbnRFbGVtZW50IDogc2Nyb2xsZWRQYXJlbnQ7XG4gICAgY29uc3Qgc2Nyb2xsUG9zaXRpb24gPSB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuZ2V0KHNjcm9sbGVkUGFyZW50KSEuc2Nyb2xsUG9zaXRpb247XG4gICAgY29uc3QgdG9wRGlmZmVyZW5jZSA9IHNjcm9sbFBvc2l0aW9uLnRvcCAtIG5ld1RvcDtcbiAgICBjb25zdCBsZWZ0RGlmZmVyZW5jZSA9IHNjcm9sbFBvc2l0aW9uLmxlZnQgLSBuZXdMZWZ0O1xuXG4gICAgLy8gR28gdGhyb3VnaCBhbmQgdXBkYXRlIHRoZSBjYWNoZWQgcG9zaXRpb25zIG9mIHRoZSBzY3JvbGxcbiAgICAvLyBwYXJlbnRzIHRoYXQgYXJlIGluc2lkZSB0aGUgZWxlbWVudCB0aGF0IHdhcyBzY3JvbGxlZC5cbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuZm9yRWFjaCgocG9zaXRpb24sIG5vZGUpID0+IHtcbiAgICAgIGlmIChwb3NpdGlvbi5jbGllbnRSZWN0ICYmIHNjcm9sbGVkUGFyZW50ICE9PSBub2RlICYmIHNjcm9sbGVkUGFyZW50Tm9kZS5jb250YWlucyhub2RlKSkge1xuICAgICAgICBhZGp1c3RDbGllbnRSZWN0KHBvc2l0aW9uLmNsaWVudFJlY3QsIHRvcERpZmZlcmVuY2UsIGxlZnREaWZmZXJlbmNlKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFNpbmNlIHdlIGtub3cgdGhlIGFtb3VudCB0aGF0IHRoZSB1c2VyIGhhcyBzY3JvbGxlZCB3ZSBjYW4gc2hpZnQgYWxsIG9mIHRoZSBjbGllbnQgcmVjdGFuZ2xlc1xuICAgIC8vIG91cnNlbHZlcy4gVGhpcyBpcyBjaGVhcGVyIHRoYW4gcmUtbWVhc3VyaW5nIGV2ZXJ5dGhpbmcgYW5kIHdlIGNhbiBhdm9pZCBpbmNvbnNpc3RlbnRcbiAgICAvLyBiZWhhdmlvciB3aGVyZSB3ZSBtaWdodCBiZSBtZWFzdXJpbmcgdGhlIGVsZW1lbnQgYmVmb3JlIGl0cyBwb3NpdGlvbiBoYXMgY2hhbmdlZC5cbiAgICB0aGlzLl9pdGVtUG9zaXRpb25zLmZvckVhY2goKHtjbGllbnRSZWN0fSkgPT4ge1xuICAgICAgYWRqdXN0Q2xpZW50UmVjdChjbGllbnRSZWN0LCB0b3BEaWZmZXJlbmNlLCBsZWZ0RGlmZmVyZW5jZSk7XG4gICAgfSk7XG5cbiAgICAvLyBXZSBuZWVkIHR3byBsb29wcyBmb3IgdGhpcywgYmVjYXVzZSB3ZSB3YW50IGFsbCBvZiB0aGUgY2FjaGVkXG4gICAgLy8gcG9zaXRpb25zIHRvIGJlIHVwLXRvLWRhdGUgYmVmb3JlIHdlIHJlLXNvcnQgdGhlIGl0ZW0uXG4gICAgdGhpcy5faXRlbVBvc2l0aW9ucy5mb3JFYWNoKCh7ZHJhZ30pID0+IHtcbiAgICAgIGlmICh0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LmlzRHJhZ2dpbmcoZHJhZykpIHtcbiAgICAgICAgLy8gV2UgbmVlZCB0byByZS1zb3J0IHRoZSBpdGVtIG1hbnVhbGx5LCBiZWNhdXNlIHRoZSBwb2ludGVyIG1vdmVcbiAgICAgICAgLy8gZXZlbnRzIHdvbid0IGJlIGRpc3BhdGNoZWQgd2hpbGUgdGhlIHVzZXIgaXMgc2Nyb2xsaW5nLlxuICAgICAgICBkcmFnLl9zb3J0RnJvbUxhc3RQb2ludGVyUG9zaXRpb24oKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHNjcm9sbFBvc2l0aW9uLnRvcCA9IG5ld1RvcDtcbiAgICBzY3JvbGxQb3NpdGlvbi5sZWZ0ID0gbmV3TGVmdDtcbiAgfVxuXG4gIC8qKiBTdGFydHMgdGhlIGludGVydmFsIHRoYXQnbGwgYXV0by1zY3JvbGwgdGhlIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3N0YXJ0U2Nyb2xsSW50ZXJ2YWwgPSAoKSA9PiB7XG4gICAgdGhpcy5fc3RvcFNjcm9sbGluZygpO1xuXG4gICAgaW50ZXJ2YWwoMCwgYW5pbWF0aW9uRnJhbWVTY2hlZHVsZXIpXG4gICAgICAucGlwZSh0YWtlVW50aWwodGhpcy5fc3RvcFNjcm9sbFRpbWVycykpXG4gICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMuX3Njcm9sbE5vZGU7XG5cbiAgICAgICAgaWYgKHRoaXMuX3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID09PSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uVVApIHtcbiAgICAgICAgICBpbmNyZW1lbnRWZXJ0aWNhbFNjcm9sbChub2RlLCAtQVVUT19TQ1JPTExfU1RFUCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPT09IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5ET1dOKSB7XG4gICAgICAgICAgaW5jcmVtZW50VmVydGljYWxTY3JvbGwobm9kZSwgQVVUT19TQ1JPTExfU1RFUCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5faG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9PT0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTEVGVCkge1xuICAgICAgICAgIGluY3JlbWVudEhvcml6b250YWxTY3JvbGwobm9kZSwgLUFVVE9fU0NST0xMX1NURVApO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2hvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPT09IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLlJJR0hUKSB7XG4gICAgICAgICAgaW5jcmVtZW50SG9yaXpvbnRhbFNjcm9sbChub2RlLCBBVVRPX1NDUk9MTF9TVEVQKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIHVzZXIncyBwb2ludGVyIGlzIHBvc2l0aW9uZWQgb3ZlciB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0geCBQb2ludGVyIHBvc2l0aW9uIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSB5IFBvaW50ZXIgcG9zaXRpb24gYWxvbmcgdGhlIFkgYXhpcy5cbiAgICovXG4gIF9pc092ZXJDb250YWluZXIoeDogbnVtYmVyLCB5OiBudW1iZXIpOiBib29sZWFuIHtcbiAgICByZXR1cm4gaXNJbnNpZGVDbGllbnRSZWN0KHRoaXMuX2NsaWVudFJlY3QsIHgsIHkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpZ3VyZXMgb3V0IHdoZXRoZXIgYW4gaXRlbSBzaG91bGQgYmUgbW92ZWQgaW50byBhIHNpYmxpbmdcbiAgICogZHJvcCBjb250YWluZXIsIGJhc2VkIG9uIGl0cyBjdXJyZW50IHBvc2l0aW9uLlxuICAgKiBAcGFyYW0gaXRlbSBEcmFnIGl0ZW0gdGhhdCBpcyBiZWluZyBtb3ZlZC5cbiAgICogQHBhcmFtIHggUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHkgUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFkgYXhpcy5cbiAgICovXG4gIF9nZXRTaWJsaW5nQ29udGFpbmVyRnJvbVBvc2l0aW9uKGl0ZW06IERyYWdSZWYsIHg6IG51bWJlciwgeTogbnVtYmVyKTogRHJvcExpc3RSZWYgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9zaWJsaW5ncy5maW5kKHNpYmxpbmcgPT4gc2libGluZy5fY2FuUmVjZWl2ZShpdGVtLCB4LCB5KSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGRyb3AgbGlzdCBjYW4gcmVjZWl2ZSB0aGUgcGFzc2VkLWluIGl0ZW0uXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdGhhdCBpcyBiZWluZyBkcmFnZ2VkIGludG8gdGhlIGxpc3QuXG4gICAqIEBwYXJhbSB4IFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSB5IFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqL1xuICBfY2FuUmVjZWl2ZShpdGVtOiBEcmFnUmVmLCB4OiBudW1iZXIsIHk6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGlmICghaXNJbnNpZGVDbGllbnRSZWN0KHRoaXMuX2NsaWVudFJlY3QsIHgsIHkpIHx8ICF0aGlzLmVudGVyUHJlZGljYXRlKGl0ZW0sIHRoaXMpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgZWxlbWVudEZyb21Qb2ludCA9IHRoaXMuX2dldFNoYWRvd1Jvb3QoKS5lbGVtZW50RnJvbVBvaW50KHgsIHkpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcblxuICAgIC8vIElmIHRoZXJlJ3Mgbm8gZWxlbWVudCBhdCB0aGUgcG9pbnRlciBwb3NpdGlvbiwgdGhlblxuICAgIC8vIHRoZSBjbGllbnQgcmVjdCBpcyBwcm9iYWJseSBzY3JvbGxlZCBvdXQgb2YgdGhlIHZpZXcuXG4gICAgaWYgKCFlbGVtZW50RnJvbVBvaW50KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KTtcblxuICAgIC8vIFRoZSBgQ2xpZW50UmVjdGAsIHRoYXQgd2UncmUgdXNpbmcgdG8gZmluZCB0aGUgY29udGFpbmVyIG92ZXIgd2hpY2ggdGhlIHVzZXIgaXNcbiAgICAvLyBob3ZlcmluZywgZG9lc24ndCBnaXZlIHVzIGFueSBpbmZvcm1hdGlvbiBvbiB3aGV0aGVyIHRoZSBlbGVtZW50IGhhcyBiZWVuIHNjcm9sbGVkXG4gICAgLy8gb3V0IG9mIHRoZSB2aWV3IG9yIHdoZXRoZXIgaXQncyBvdmVybGFwcGluZyB3aXRoIG90aGVyIGNvbnRhaW5lcnMuIFRoaXMgbWVhbnMgdGhhdFxuICAgIC8vIHdlIGNvdWxkIGVuZCB1cCB0cmFuc2ZlcnJpbmcgdGhlIGl0ZW0gaW50byBhIGNvbnRhaW5lciB0aGF0J3MgaW52aXNpYmxlIG9yIGlzIHBvc2l0aW9uZWRcbiAgICAvLyBiZWxvdyBhbm90aGVyIG9uZS4gV2UgdXNlIHRoZSByZXN1bHQgZnJvbSBgZWxlbWVudEZyb21Qb2ludGAgdG8gZ2V0IHRoZSB0b3AtbW9zdCBlbGVtZW50XG4gICAgLy8gYXQgdGhlIHBvaW50ZXIgcG9zaXRpb24gYW5kIHRvIGZpbmQgd2hldGhlciBpdCdzIG9uZSBvZiB0aGUgaW50ZXJzZWN0aW5nIGRyb3AgY29udGFpbmVycy5cbiAgICByZXR1cm4gZWxlbWVudEZyb21Qb2ludCA9PT0gbmF0aXZlRWxlbWVudCB8fCBuYXRpdmVFbGVtZW50LmNvbnRhaW5zKGVsZW1lbnRGcm9tUG9pbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCBieSBvbmUgb2YgdGhlIGNvbm5lY3RlZCBkcm9wIGxpc3RzIHdoZW4gYSBkcmFnZ2luZyBzZXF1ZW5jZSBoYXMgc3RhcnRlZC5cbiAgICogQHBhcmFtIHNpYmxpbmcgU2libGluZyBpbiB3aGljaCBkcmFnZ2luZyBoYXMgc3RhcnRlZC5cbiAgICovXG4gIF9zdGFydFJlY2VpdmluZyhzaWJsaW5nOiBEcm9wTGlzdFJlZikge1xuICAgIGNvbnN0IGFjdGl2ZVNpYmxpbmdzID0gdGhpcy5fYWN0aXZlU2libGluZ3M7XG5cbiAgICBpZiAoIWFjdGl2ZVNpYmxpbmdzLmhhcyhzaWJsaW5nKSkge1xuICAgICAgYWN0aXZlU2libGluZ3MuYWRkKHNpYmxpbmcpO1xuICAgICAgdGhpcy5fY2FjaGVQYXJlbnRQb3NpdGlvbnMoKTtcbiAgICAgIHRoaXMuX2xpc3RlblRvU2Nyb2xsRXZlbnRzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCBieSBhIGNvbm5lY3RlZCBkcm9wIGxpc3Qgd2hlbiBkcmFnZ2luZyBoYXMgc3RvcHBlZC5cbiAgICogQHBhcmFtIHNpYmxpbmcgU2libGluZyB3aG9zZSBkcmFnZ2luZyBoYXMgc3RvcHBlZC5cbiAgICovXG4gIF9zdG9wUmVjZWl2aW5nKHNpYmxpbmc6IERyb3BMaXN0UmVmKSB7XG4gICAgdGhpcy5fYWN0aXZlU2libGluZ3MuZGVsZXRlKHNpYmxpbmcpO1xuICAgIHRoaXMuX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gIH1cblxuICAvKipcbiAgICogU3RhcnRzIGxpc3RlbmluZyB0byBzY3JvbGwgZXZlbnRzIG9uIHRoZSB2aWV3cG9ydC5cbiAgICogVXNlZCBmb3IgdXBkYXRpbmcgdGhlIGludGVybmFsIHN0YXRlIG9mIHRoZSBsaXN0LlxuICAgKi9cbiAgcHJpdmF0ZSBfbGlzdGVuVG9TY3JvbGxFdmVudHMoKSB7XG4gICAgdGhpcy5fdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24gPSB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnNjcm9sbC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgaWYgKHRoaXMuaXNEcmFnZ2luZygpKSB7XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudCB8IERvY3VtZW50O1xuICAgICAgICBjb25zdCBwb3NpdGlvbiA9IHRoaXMuX3BhcmVudFBvc2l0aW9ucy5nZXQodGFyZ2V0KTtcblxuICAgICAgICBpZiAocG9zaXRpb24pIHtcbiAgICAgICAgICBsZXQgbmV3VG9wOiBudW1iZXI7XG4gICAgICAgICAgbGV0IG5ld0xlZnQ6IG51bWJlcjtcblxuICAgICAgICAgIGlmICh0YXJnZXQgPT09IHRoaXMuX2RvY3VtZW50KSB7XG4gICAgICAgICAgICBjb25zdCBzY3JvbGxQb3NpdGlvbiA9IHRoaXMuX3ZpZXdwb3J0UnVsZXIhLmdldFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24oKTtcbiAgICAgICAgICAgIG5ld1RvcCA9IHNjcm9sbFBvc2l0aW9uLnRvcDtcbiAgICAgICAgICAgIG5ld0xlZnQgPSBzY3JvbGxQb3NpdGlvbi5sZWZ0O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBuZXdUb3AgPSAodGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5zY3JvbGxUb3A7XG4gICAgICAgICAgICBuZXdMZWZ0ID0gKHRhcmdldCBhcyBIVE1MRWxlbWVudCkuc2Nyb2xsTGVmdDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLl91cGRhdGVBZnRlclNjcm9sbCh0YXJnZXQsIG5ld1RvcCwgbmV3TGVmdCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodGhpcy5pc1JlY2VpdmluZygpKSB7XG4gICAgICAgIHRoaXMuX2NhY2hlUGFyZW50UG9zaXRpb25zKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGF6aWx5IHJlc29sdmVzIGFuZCByZXR1cm5zIHRoZSBzaGFkb3cgcm9vdCBvZiB0aGUgZWxlbWVudC4gV2UgZG8gdGhpcyBpbiBhIGZ1bmN0aW9uLCByYXRoZXJcbiAgICogdGhhbiBzYXZpbmcgaXQgaW4gcHJvcGVydHkgZGlyZWN0bHkgb24gaW5pdCwgYmVjYXVzZSB3ZSB3YW50IHRvIHJlc29sdmUgaXQgYXMgbGF0ZSBhcyBwb3NzaWJsZVxuICAgKiBpbiBvcmRlciB0byBlbnN1cmUgdGhhdCB0aGUgZWxlbWVudCBoYXMgYmVlbiBtb3ZlZCBpbnRvIHRoZSBzaGFkb3cgRE9NLiBEb2luZyBpdCBpbnNpZGUgdGhlXG4gICAqIGNvbnN0cnVjdG9yIG1pZ2h0IGJlIHRvbyBlYXJseSBpZiB0aGUgZWxlbWVudCBpcyBpbnNpZGUgb2Ygc29tZXRoaW5nIGxpa2UgYG5nRm9yYCBvciBgbmdJZmAuXG4gICAqL1xuICBwcml2YXRlIF9nZXRTaGFkb3dSb290KCk6IERvY3VtZW50T3JTaGFkb3dSb290IHtcbiAgICBpZiAoIXRoaXMuX2NhY2hlZFNoYWRvd1Jvb3QpIHtcbiAgICAgIGNvbnN0IHNoYWRvd1Jvb3QgPSBfZ2V0U2hhZG93Um9vdChjb2VyY2VFbGVtZW50KHRoaXMuZWxlbWVudCkpIGFzIFNoYWRvd1Jvb3QgfCBudWxsO1xuICAgICAgdGhpcy5fY2FjaGVkU2hhZG93Um9vdCA9IHNoYWRvd1Jvb3QgfHwgdGhpcy5fZG9jdW1lbnQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX2NhY2hlZFNoYWRvd1Jvb3Q7XG4gIH1cbn1cblxuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIHRvcC9sZWZ0IHBvc2l0aW9ucyBvZiBhIGBDbGllbnRSZWN0YCwgYXMgd2VsbCBhcyB0aGVpciBib3R0b20vcmlnaHQgY291bnRlcnBhcnRzLlxuICogQHBhcmFtIGNsaWVudFJlY3QgYENsaWVudFJlY3RgIHRoYXQgc2hvdWxkIGJlIHVwZGF0ZWQuXG4gKiBAcGFyYW0gdG9wIEFtb3VudCB0byBhZGQgdG8gdGhlIGB0b3BgIHBvc2l0aW9uLlxuICogQHBhcmFtIGxlZnQgQW1vdW50IHRvIGFkZCB0byB0aGUgYGxlZnRgIHBvc2l0aW9uLlxuICovXG5mdW5jdGlvbiBhZGp1c3RDbGllbnRSZWN0KGNsaWVudFJlY3Q6IENsaWVudFJlY3QsIHRvcDogbnVtYmVyLCBsZWZ0OiBudW1iZXIpIHtcbiAgY2xpZW50UmVjdC50b3AgKz0gdG9wO1xuICBjbGllbnRSZWN0LmJvdHRvbSA9IGNsaWVudFJlY3QudG9wICsgY2xpZW50UmVjdC5oZWlnaHQ7XG5cbiAgY2xpZW50UmVjdC5sZWZ0ICs9IGxlZnQ7XG4gIGNsaWVudFJlY3QucmlnaHQgPSBjbGllbnRSZWN0LmxlZnQgKyBjbGllbnRSZWN0LndpZHRoO1xufVxuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIHRoZSBwb2ludGVyIGNvb3JkaW5hdGVzIGFyZSBjbG9zZSB0byBhIENsaWVudFJlY3QuXG4gKiBAcGFyYW0gcmVjdCBDbGllbnRSZWN0IHRvIGNoZWNrIGFnYWluc3QuXG4gKiBAcGFyYW0gcG9pbnRlclggQ29vcmRpbmF0ZXMgYWxvbmcgdGhlIFggYXhpcy5cbiAqIEBwYXJhbSBwb2ludGVyWSBDb29yZGluYXRlcyBhbG9uZyB0aGUgWSBheGlzLlxuICovXG5mdW5jdGlvbiBpc1BvaW50ZXJOZWFyQ2xpZW50UmVjdChyZWN0OiBDbGllbnRSZWN0LCBwb2ludGVyWDogbnVtYmVyLCBwb2ludGVyWTogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IHt0b3AsIHJpZ2h0LCBib3R0b20sIGxlZnQsIHdpZHRoLCBoZWlnaHR9ID0gcmVjdDtcbiAgY29uc3QgeFRocmVzaG9sZCA9IHdpZHRoICogRFJPUF9QUk9YSU1JVFlfVEhSRVNIT0xEO1xuICBjb25zdCB5VGhyZXNob2xkID0gaGVpZ2h0ICogRFJPUF9QUk9YSU1JVFlfVEhSRVNIT0xEO1xuXG4gIHJldHVybiBwb2ludGVyWSA+IHRvcCAtIHlUaHJlc2hvbGQgJiYgcG9pbnRlclkgPCBib3R0b20gKyB5VGhyZXNob2xkICYmXG4gICAgICAgICBwb2ludGVyWCA+IGxlZnQgLSB4VGhyZXNob2xkICYmIHBvaW50ZXJYIDwgcmlnaHQgKyB4VGhyZXNob2xkO1xufVxuXG4vKipcbiAqIEZpbmRzIHRoZSBpbmRleCBvZiBhbiBpdGVtIHRoYXQgbWF0Y2hlcyBhIHByZWRpY2F0ZSBmdW5jdGlvbi4gVXNlZCBhcyBhbiBlcXVpdmFsZW50XG4gKiBvZiBgQXJyYXkucHJvdG90eXBlLmZpbmRJbmRleGAgd2hpY2ggaXNuJ3QgcGFydCBvZiB0aGUgc3RhbmRhcmQgR29vZ2xlIHR5cGluZ3MuXG4gKiBAcGFyYW0gYXJyYXkgQXJyYXkgaW4gd2hpY2ggdG8gbG9vayBmb3IgbWF0Y2hlcy5cbiAqIEBwYXJhbSBwcmVkaWNhdGUgRnVuY3Rpb24gdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBhbiBpdGVtIGlzIGEgbWF0Y2guXG4gKi9cbmZ1bmN0aW9uIGZpbmRJbmRleDxUPihhcnJheTogVFtdLFxuICAgICAgICAgICAgICAgICAgICAgIHByZWRpY2F0ZTogKHZhbHVlOiBULCBpbmRleDogbnVtYmVyLCBvYmo6IFRbXSkgPT4gYm9vbGVhbik6IG51bWJlciB7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuICAgIGlmIChwcmVkaWNhdGUoYXJyYXlbaV0sIGksIGFycmF5KSkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIC0xO1xufVxuXG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgc29tZSBjb29yZGluYXRlcyBhcmUgd2l0aGluIGEgYENsaWVudFJlY3RgLlxuICogQHBhcmFtIGNsaWVudFJlY3QgQ2xpZW50UmVjdCB0aGF0IGlzIGJlaW5nIGNoZWNrZWQuXG4gKiBAcGFyYW0geCBDb29yZGluYXRlcyBhbG9uZyB0aGUgWCBheGlzLlxuICogQHBhcmFtIHkgQ29vcmRpbmF0ZXMgYWxvbmcgdGhlIFkgYXhpcy5cbiAqL1xuZnVuY3Rpb24gaXNJbnNpZGVDbGllbnRSZWN0KGNsaWVudFJlY3Q6IENsaWVudFJlY3QsIHg6IG51bWJlciwgeTogbnVtYmVyKSB7XG4gIGNvbnN0IHt0b3AsIGJvdHRvbSwgbGVmdCwgcmlnaHR9ID0gY2xpZW50UmVjdDtcbiAgcmV0dXJuIHkgPj0gdG9wICYmIHkgPD0gYm90dG9tICYmIHggPj0gbGVmdCAmJiB4IDw9IHJpZ2h0O1xufVxuXG5cbi8qKiBHZXRzIGEgbXV0YWJsZSB2ZXJzaW9uIG9mIGFuIGVsZW1lbnQncyBib3VuZGluZyBgQ2xpZW50UmVjdGAuICovXG5mdW5jdGlvbiBnZXRNdXRhYmxlQ2xpZW50UmVjdChlbGVtZW50OiBFbGVtZW50KTogQ2xpZW50UmVjdCB7XG4gIGNvbnN0IGNsaWVudFJlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gIC8vIFdlIG5lZWQgdG8gY2xvbmUgdGhlIGBjbGllbnRSZWN0YCBoZXJlLCBiZWNhdXNlIGFsbCB0aGUgdmFsdWVzIG9uIGl0IGFyZSByZWFkb25seVxuICAvLyBhbmQgd2UgbmVlZCB0byBiZSBhYmxlIHRvIHVwZGF0ZSB0aGVtLiBBbHNvIHdlIGNhbid0IHVzZSBhIHNwcmVhZCBoZXJlLCBiZWNhdXNlXG4gIC8vIHRoZSB2YWx1ZXMgb24gYSBgQ2xpZW50UmVjdGAgYXJlbid0IG93biBwcm9wZXJ0aWVzLiBTZWU6XG4gIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9FbGVtZW50L2dldEJvdW5kaW5nQ2xpZW50UmVjdCNOb3Rlc1xuICByZXR1cm4ge1xuICAgIHRvcDogY2xpZW50UmVjdC50b3AsXG4gICAgcmlnaHQ6IGNsaWVudFJlY3QucmlnaHQsXG4gICAgYm90dG9tOiBjbGllbnRSZWN0LmJvdHRvbSxcbiAgICBsZWZ0OiBjbGllbnRSZWN0LmxlZnQsXG4gICAgd2lkdGg6IGNsaWVudFJlY3Qud2lkdGgsXG4gICAgaGVpZ2h0OiBjbGllbnRSZWN0LmhlaWdodFxuICB9O1xufVxuXG4vKipcbiAqIEluY3JlbWVudHMgdGhlIHZlcnRpY2FsIHNjcm9sbCBwb3NpdGlvbiBvZiBhIG5vZGUuXG4gKiBAcGFyYW0gbm9kZSBOb2RlIHdob3NlIHNjcm9sbCBwb3NpdGlvbiBzaG91bGQgY2hhbmdlLlxuICogQHBhcmFtIGFtb3VudCBBbW91bnQgb2YgcGl4ZWxzIHRoYXQgdGhlIGBub2RlYCBzaG91bGQgYmUgc2Nyb2xsZWQuXG4gKi9cbmZ1bmN0aW9uIGluY3JlbWVudFZlcnRpY2FsU2Nyb2xsKG5vZGU6IEhUTUxFbGVtZW50IHwgV2luZG93LCBhbW91bnQ6IG51bWJlcikge1xuICBpZiAobm9kZSA9PT0gd2luZG93KSB7XG4gICAgKG5vZGUgYXMgV2luZG93KS5zY3JvbGxCeSgwLCBhbW91bnQpO1xuICB9IGVsc2Uge1xuICAgIC8vIElkZWFsbHkgd2UgY291bGQgdXNlIGBFbGVtZW50LnNjcm9sbEJ5YCBoZXJlIGFzIHdlbGwsIGJ1dCBJRSBhbmQgRWRnZSBkb24ndCBzdXBwb3J0IGl0LlxuICAgIChub2RlIGFzIEhUTUxFbGVtZW50KS5zY3JvbGxUb3AgKz0gYW1vdW50O1xuICB9XG59XG5cbi8qKlxuICogSW5jcmVtZW50cyB0aGUgaG9yaXpvbnRhbCBzY3JvbGwgcG9zaXRpb24gb2YgYSBub2RlLlxuICogQHBhcmFtIG5vZGUgTm9kZSB3aG9zZSBzY3JvbGwgcG9zaXRpb24gc2hvdWxkIGNoYW5nZS5cbiAqIEBwYXJhbSBhbW91bnQgQW1vdW50IG9mIHBpeGVscyB0aGF0IHRoZSBgbm9kZWAgc2hvdWxkIGJlIHNjcm9sbGVkLlxuICovXG5mdW5jdGlvbiBpbmNyZW1lbnRIb3Jpem9udGFsU2Nyb2xsKG5vZGU6IEhUTUxFbGVtZW50IHwgV2luZG93LCBhbW91bnQ6IG51bWJlcikge1xuICBpZiAobm9kZSA9PT0gd2luZG93KSB7XG4gICAgKG5vZGUgYXMgV2luZG93KS5zY3JvbGxCeShhbW91bnQsIDApO1xuICB9IGVsc2Uge1xuICAgIC8vIElkZWFsbHkgd2UgY291bGQgdXNlIGBFbGVtZW50LnNjcm9sbEJ5YCBoZXJlIGFzIHdlbGwsIGJ1dCBJRSBhbmQgRWRnZSBkb24ndCBzdXBwb3J0IGl0LlxuICAgIChub2RlIGFzIEhUTUxFbGVtZW50KS5zY3JvbGxMZWZ0ICs9IGFtb3VudDtcbiAgfVxufVxuXG4vKipcbiAqIEdldHMgd2hldGhlciB0aGUgdmVydGljYWwgYXV0by1zY3JvbGwgZGlyZWN0aW9uIG9mIGEgbm9kZS5cbiAqIEBwYXJhbSBjbGllbnRSZWN0IERpbWVuc2lvbnMgb2YgdGhlIG5vZGUuXG4gKiBAcGFyYW0gcG9pbnRlclkgUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSB5IGF4aXMuXG4gKi9cbmZ1bmN0aW9uIGdldFZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uKGNsaWVudFJlY3Q6IENsaWVudFJlY3QsIHBvaW50ZXJZOiBudW1iZXIpIHtcbiAgY29uc3Qge3RvcCwgYm90dG9tLCBoZWlnaHR9ID0gY2xpZW50UmVjdDtcbiAgY29uc3QgeVRocmVzaG9sZCA9IGhlaWdodCAqIFNDUk9MTF9QUk9YSU1JVFlfVEhSRVNIT0xEO1xuXG4gIGlmIChwb2ludGVyWSA+PSB0b3AgLSB5VGhyZXNob2xkICYmIHBvaW50ZXJZIDw9IHRvcCArIHlUaHJlc2hvbGQpIHtcbiAgICByZXR1cm4gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLlVQO1xuICB9IGVsc2UgaWYgKHBvaW50ZXJZID49IGJvdHRvbSAtIHlUaHJlc2hvbGQgJiYgcG9pbnRlclkgPD0gYm90dG9tICsgeVRocmVzaG9sZCkge1xuICAgIHJldHVybiBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uRE9XTjtcbiAgfVxuXG4gIHJldHVybiBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uTk9ORTtcbn1cblxuLyoqXG4gKiBHZXRzIHdoZXRoZXIgdGhlIGhvcml6b250YWwgYXV0by1zY3JvbGwgZGlyZWN0aW9uIG9mIGEgbm9kZS5cbiAqIEBwYXJhbSBjbGllbnRSZWN0IERpbWVuc2lvbnMgb2YgdGhlIG5vZGUuXG4gKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSB4IGF4aXMuXG4gKi9cbmZ1bmN0aW9uIGdldEhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24oY2xpZW50UmVjdDogQ2xpZW50UmVjdCwgcG9pbnRlclg6IG51bWJlcikge1xuICBjb25zdCB7bGVmdCwgcmlnaHQsIHdpZHRofSA9IGNsaWVudFJlY3Q7XG4gIGNvbnN0IHhUaHJlc2hvbGQgPSB3aWR0aCAqIFNDUk9MTF9QUk9YSU1JVFlfVEhSRVNIT0xEO1xuXG4gIGlmIChwb2ludGVyWCA+PSBsZWZ0IC0geFRocmVzaG9sZCAmJiBwb2ludGVyWCA8PSBsZWZ0ICsgeFRocmVzaG9sZCkge1xuICAgIHJldHVybiBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5MRUZUO1xuICB9IGVsc2UgaWYgKHBvaW50ZXJYID49IHJpZ2h0IC0geFRocmVzaG9sZCAmJiBwb2ludGVyWCA8PSByaWdodCArIHhUaHJlc2hvbGQpIHtcbiAgICByZXR1cm4gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uUklHSFQ7XG4gIH1cblxuICByZXR1cm4gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTk9ORTtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBkaXJlY3Rpb25zIGluIHdoaWNoIGFuIGVsZW1lbnQgbm9kZSBzaG91bGQgYmUgc2Nyb2xsZWQsXG4gKiBhc3N1bWluZyB0aGF0IHRoZSB1c2VyJ3MgcG9pbnRlciBpcyBhbHJlYWR5IHdpdGhpbiBpdCBzY3JvbGxhYmxlIHJlZ2lvbi5cbiAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgZm9yIHdoaWNoIHdlIHNob3VsZCBjYWxjdWxhdGUgdGhlIHNjcm9sbCBkaXJlY3Rpb24uXG4gKiBAcGFyYW0gY2xpZW50UmVjdCBCb3VuZGluZyBjbGllbnQgcmVjdGFuZ2xlIG9mIHRoZSBlbGVtZW50LlxuICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgeCBheGlzLlxuICogQHBhcmFtIHBvaW50ZXJZIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgeSBheGlzLlxuICovXG5mdW5jdGlvbiBnZXRFbGVtZW50U2Nyb2xsRGlyZWN0aW9ucyhlbGVtZW50OiBIVE1MRWxlbWVudCwgY2xpZW50UmVjdDogQ2xpZW50UmVjdCwgcG9pbnRlclg6IG51bWJlcixcbiAgcG9pbnRlclk6IG51bWJlcik6IFtBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24sIEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uXSB7XG4gIGNvbnN0IGNvbXB1dGVkVmVydGljYWwgPSBnZXRWZXJ0aWNhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0LCBwb2ludGVyWSk7XG4gIGNvbnN0IGNvbXB1dGVkSG9yaXpvbnRhbCA9IGdldEhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24oY2xpZW50UmVjdCwgcG9pbnRlclgpO1xuICBsZXQgdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uTk9ORTtcbiAgbGV0IGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5OT05FO1xuXG4gIC8vIE5vdGUgdGhhdCB3ZSBoZXJlIHdlIGRvIHNvbWUgZXh0cmEgY2hlY2tzIGZvciB3aGV0aGVyIHRoZSBlbGVtZW50IGlzIGFjdHVhbGx5IHNjcm9sbGFibGUgaW5cbiAgLy8gYSBjZXJ0YWluIGRpcmVjdGlvbiBhbmQgd2Ugb25seSBhc3NpZ24gdGhlIHNjcm9sbCBkaXJlY3Rpb24gaWYgaXQgaXMuIFdlIGRvIHRoaXMgc28gdGhhdCB3ZVxuICAvLyBjYW4gYWxsb3cgb3RoZXIgZWxlbWVudHMgdG8gYmUgc2Nyb2xsZWQsIGlmIHRoZSBjdXJyZW50IGVsZW1lbnQgY2FuJ3QgYmUgc2Nyb2xsZWQgYW55bW9yZS5cbiAgLy8gVGhpcyBhbGxvd3MgdXMgdG8gaGFuZGxlIGNhc2VzIHdoZXJlIHRoZSBzY3JvbGwgcmVnaW9ucyBvZiB0d28gc2Nyb2xsYWJsZSBlbGVtZW50cyBvdmVybGFwLlxuICBpZiAoY29tcHV0ZWRWZXJ0aWNhbCkge1xuICAgIGNvbnN0IHNjcm9sbFRvcCA9IGVsZW1lbnQuc2Nyb2xsVG9wO1xuXG4gICAgaWYgKGNvbXB1dGVkVmVydGljYWwgPT09IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5VUCkge1xuICAgICAgaWYgKHNjcm9sbFRvcCA+IDApIHtcbiAgICAgICAgdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uVVA7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChlbGVtZW50LnNjcm9sbEhlaWdodCAtIHNjcm9sbFRvcCA+IGVsZW1lbnQuY2xpZW50SGVpZ2h0KSB7XG4gICAgICB2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5ET1dOO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjb21wdXRlZEhvcml6b250YWwpIHtcbiAgICBjb25zdCBzY3JvbGxMZWZ0ID0gZWxlbWVudC5zY3JvbGxMZWZ0O1xuXG4gICAgaWYgKGNvbXB1dGVkSG9yaXpvbnRhbCA9PT0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTEVGVCkge1xuICAgICAgaWYgKHNjcm9sbExlZnQgPiAwKSB7XG4gICAgICAgIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5MRUZUO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZWxlbWVudC5zY3JvbGxXaWR0aCAtIHNjcm9sbExlZnQgPiBlbGVtZW50LmNsaWVudFdpZHRoKSB7XG4gICAgICBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uUklHSFQ7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFt2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiwgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbl07XG59XG4iXX0=