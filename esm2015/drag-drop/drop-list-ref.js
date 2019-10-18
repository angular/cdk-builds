/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { coerceElement } from '@angular/cdk/coercion';
import { _supportsShadowDom } from '@angular/cdk/platform';
import { Subject, Subscription, interval, animationFrameScheduler } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { moveItemInArray } from './drag-utils';
/**
 * Proximity, as a ratio to width/height, at which a
 * dragged item will affect the drop container.
 * @type {?}
 */
const DROP_PROXIMITY_THRESHOLD = 0.05;
/**
 * Proximity, as a ratio to width/height at which to start auto-scrolling the drop list or the
 * viewport. The value comes from trying it out manually until it feels right.
 * @type {?}
 */
const SCROLL_PROXIMITY_THRESHOLD = 0.05;
/**
 * Number of pixels to scroll for each frame when auto-scrolling an element.
 * The value comes from trying it out manually until it feels right.
 * @type {?}
 */
const AUTO_SCROLL_STEP = 2;
/**
 * Entry in the position cache for draggable items.
 * \@docs-private
 * @record
 */
function CachedItemPosition() { }
if (false) {
    /**
     * Instance of the drag item.
     * @type {?}
     */
    CachedItemPosition.prototype.drag;
    /**
     * Dimensions of the item.
     * @type {?}
     */
    CachedItemPosition.prototype.clientRect;
    /**
     * Amount by which the item has been moved since dragging started.
     * @type {?}
     */
    CachedItemPosition.prototype.offset;
}
/**
 * Object holding the scroll position of something.
 * @record
 */
function ScrollPosition() { }
if (false) {
    /** @type {?} */
    ScrollPosition.prototype.top;
    /** @type {?} */
    ScrollPosition.prototype.left;
}
/** @enum {number} */
const AutoScrollVerticalDirection = {
    NONE: 0, UP: 1, DOWN: 2,
};
/** @enum {number} */
const AutoScrollHorizontalDirection = {
    NONE: 0, LEFT: 1, RIGHT: 2,
};
/**
 * Internal compile-time-only representation of a `DropListRef`.
 * Used to avoid circular import issues between the `DropListRef` and the `DragRef`.
 * \@docs-private
 * @record
 */
export function DropListRefInternal() { }
/**
 * Reference to a drop list. Used to manipulate or dispose of the container.
 * @template T
 */
export class DropListRef {
    /**
     * @param {?} element
     * @param {?} _dragDropRegistry
     * @param {?} _document
     * @param {?} _ngZone
     * @param {?} _viewportRuler
     */
    constructor(element, _dragDropRegistry, _document, _ngZone, _viewportRuler) {
        this._dragDropRegistry = _dragDropRegistry;
        this._ngZone = _ngZone;
        this._viewportRuler = _viewportRuler;
        /**
         * Whether starting a dragging sequence from this container is disabled.
         */
        this.disabled = false;
        /**
         * Whether sorting items within the list is disabled.
         */
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
        this.enterPredicate = (/**
         * @return {?}
         */
        () => true);
        /**
         * Emits right before dragging has started.
         */
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
        /**
         * Emits when the user drops an item inside the container.
         */
        this.dropped = new Subject();
        /**
         * Emits as the user is swapping items while actively dragging.
         */
        this.sorted = new Subject();
        /**
         * Whether an item in the list is being dragged.
         */
        this._isDragging = false;
        /**
         * Cache of the dimensions of all the items inside the container.
         */
        this._itemPositions = [];
        /**
         * Keeps track of the container's scroll position.
         */
        this._scrollPosition = { top: 0, left: 0 };
        /**
         * Keeps track of the scroll position of the viewport.
         */
        this._viewportScrollPosition = { top: 0, left: 0 };
        /**
         * Keeps track of the item that was last swapped with the dragged item, as
         * well as what direction the pointer was moving in when the swap occured.
         */
        this._previousSwap = { drag: (/** @type {?} */ (null)), delta: 0 };
        /**
         * Drop lists that are connected to the current one.
         */
        this._siblings = [];
        /**
         * Direction in which the list is oriented.
         */
        this._orientation = 'vertical';
        /**
         * Connected siblings that currently have a dragged item.
         */
        this._activeSiblings = new Set();
        /**
         * Layout direction of the drop list.
         */
        this._direction = 'ltr';
        /**
         * Subscription to the window being scrolled.
         */
        this._viewportScrollSubscription = Subscription.EMPTY;
        /**
         * Vertical direction in which the list is currently scrolling.
         */
        this._verticalScrollDirection = 0 /* NONE */;
        /**
         * Horizontal direction in which the list is currently scrolling.
         */
        this._horizontalScrollDirection = 0 /* NONE */;
        /**
         * Used to signal to the current auto-scroll sequence when to stop.
         */
        this._stopScrollTimers = new Subject();
        /**
         * Shadow root of the current element. Necessary for `elementFromPoint` to resolve correctly.
         */
        this._cachedShadowRoot = null;
        /**
         * Handles the container being scrolled. Has to be an arrow function to preserve the context.
         */
        this._handleScroll = (/**
         * @return {?}
         */
        () => {
            if (!this.isDragging()) {
                return;
            }
            /** @type {?} */
            const element = coerceElement(this.element);
            this._updateAfterScroll(this._scrollPosition, element.scrollTop, element.scrollLeft);
        });
        /**
         * Starts the interval that'll auto-scroll the element.
         */
        this._startScrollInterval = (/**
         * @return {?}
         */
        () => {
            this._stopScrolling();
            interval(0, animationFrameScheduler)
                .pipe(takeUntil(this._stopScrollTimers))
                .subscribe((/**
             * @return {?}
             */
            () => {
                /** @type {?} */
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
            }));
        });
        this.element = coerceElement(element);
        this._document = _document;
        _dragDropRegistry.registerDropContainer(this);
    }
    /**
     * Removes the drop list functionality from the DOM element.
     * @return {?}
     */
    dispose() {
        this._stopScrolling();
        this._stopScrollTimers.complete();
        this._removeListeners();
        this.beforeStarted.complete();
        this.entered.complete();
        this.exited.complete();
        this.dropped.complete();
        this.sorted.complete();
        this._activeSiblings.clear();
        this._scrollNode = (/** @type {?} */ (null));
        this._dragDropRegistry.removeDropContainer(this);
    }
    /**
     * Whether an item from this list is currently being dragged.
     * @return {?}
     */
    isDragging() {
        return this._isDragging;
    }
    /**
     * Starts dragging an item.
     * @return {?}
     */
    start() {
        /** @type {?} */
        const element = coerceElement(this.element);
        this.beforeStarted.next();
        this._isDragging = true;
        this._cacheItems();
        this._siblings.forEach((/**
         * @param {?} sibling
         * @return {?}
         */
        sibling => sibling._startReceiving(this)));
        this._removeListeners();
        this._ngZone.runOutsideAngular((/**
         * @return {?}
         */
        () => element.addEventListener('scroll', this._handleScroll)));
        this._listenToScrollEvents();
    }
    /**
     * Emits an event to indicate that the user moved an item into the container.
     * @param {?} item Item that was moved into the container.
     * @param {?} pointerX Position of the item along the X axis.
     * @param {?} pointerY Position of the item along the Y axis.
     * @return {?}
     */
    enter(item, pointerX, pointerY) {
        this.start();
        // If sorting is disabled, we want the item to return to its starting
        // position if the user is returning it to its initial container.
        /** @type {?} */
        let newIndex = this.sortingDisabled ? this._draggables.indexOf(item) : -1;
        if (newIndex === -1) {
            // We use the coordinates of where the item entered the drop
            // zone to figure out at which index it should be inserted.
            newIndex = this._getItemIndexFromPointerPosition(item, pointerX, pointerY);
        }
        /** @type {?} */
        const activeDraggables = this._activeDraggables;
        /** @type {?} */
        const currentIndex = activeDraggables.indexOf(item);
        /** @type {?} */
        const placeholder = item.getPlaceholderElement();
        /** @type {?} */
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
            /** @type {?} */
            const element = newPositionReference.getRootElement();
            (/** @type {?} */ (element.parentElement)).insertBefore(placeholder, element);
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
        this.entered.next({ item, container: this, currentIndex: this.getItemIndex(item) });
    }
    /**
     * Removes an item from the container after it was dragged into another container by the user.
     * @param {?} item Item that was dragged out.
     * @return {?}
     */
    exit(item) {
        this._reset();
        this.exited.next({ item, container: this });
    }
    /**
     * Drops an item into this container.
     * @param {?} item Item being dropped into the container.
     * @param {?} currentIndex Index at which the item should be inserted.
     * @param {?} previousContainer Container from which the item got dragged in.
     * @param {?} isPointerOverContainer Whether the user's pointer was over the
     *    container when the item was dropped.
     * @param {?} distance Distance the user has dragged since the start of the dragging sequence.
     * @return {?}
     */
    drop(item, currentIndex, previousContainer, isPointerOverContainer, distance) {
        this._reset();
        this.dropped.next({
            item,
            currentIndex,
            previousIndex: previousContainer.getItemIndex(item),
            container: this,
            previousContainer,
            isPointerOverContainer,
            distance
        });
    }
    /**
     * Sets the draggable items that are a part of this list.
     * @template THIS
     * @this {THIS}
     * @param {?} items Items that are a part of this list.
     * @return {THIS}
     */
    withItems(items) {
        (/** @type {?} */ (this))._draggables = items;
        items.forEach((/**
         * @param {?} item
         * @return {?}
         */
        item => item._withDropContainer((/** @type {?} */ (this)))));
        if ((/** @type {?} */ (this)).isDragging()) {
            (/** @type {?} */ (this))._cacheItems();
        }
        return (/** @type {?} */ (this));
    }
    /**
     * Sets the layout direction of the drop list.
     * @template THIS
     * @this {THIS}
     * @param {?} direction
     * @return {THIS}
     */
    withDirection(direction) {
        (/** @type {?} */ (this))._direction = direction;
        return (/** @type {?} */ (this));
    }
    /**
     * Sets the containers that are connected to this one. When two or more containers are
     * connected, the user will be allowed to transfer items between them.
     * @template THIS
     * @this {THIS}
     * @param {?} connectedTo Other containers that the current containers should be connected to.
     * @return {THIS}
     */
    connectedTo(connectedTo) {
        (/** @type {?} */ (this))._siblings = connectedTo.slice();
        return (/** @type {?} */ (this));
    }
    /**
     * Sets the orientation of the container.
     * @template THIS
     * @this {THIS}
     * @param {?} orientation New orientation for the container.
     * @return {THIS}
     */
    withOrientation(orientation) {
        (/** @type {?} */ (this))._orientation = orientation;
        return (/** @type {?} */ (this));
    }
    /**
     * Figures out the index of an item in the container.
     * @param {?} item Item whose index should be determined.
     * @return {?}
     */
    getItemIndex(item) {
        if (!this._isDragging) {
            return this._draggables.indexOf(item);
        }
        // Items are sorted always by top/left in the cache, however they flow differently in RTL.
        // The rest of the logic still stands no matter what orientation we're in, however
        // we need to invert the array when determining the index.
        /** @type {?} */
        const items = this._orientation === 'horizontal' && this._direction === 'rtl' ?
            this._itemPositions.slice().reverse() : this._itemPositions;
        return findIndex(items, (/**
         * @param {?} currentItem
         * @return {?}
         */
        currentItem => currentItem.drag === item));
    }
    /**
     * Whether the list is able to receive the item that
     * is currently being dragged inside a connected drop list.
     * @return {?}
     */
    isReceiving() {
        return this._activeSiblings.size > 0;
    }
    /**
     * Sorts an item inside the container based on its position.
     * @param {?} item Item to be sorted.
     * @param {?} pointerX Position of the item along the X axis.
     * @param {?} pointerY Position of the item along the Y axis.
     * @param {?} pointerDelta Direction in which the pointer is moving along each axis.
     * @return {?}
     */
    _sortItem(item, pointerX, pointerY, pointerDelta) {
        // Don't sort the item if sorting is disabled or it's out of range.
        if (this.sortingDisabled || !this._isPointerNearDropContainer(pointerX, pointerY)) {
            return;
        }
        /** @type {?} */
        const siblings = this._itemPositions;
        /** @type {?} */
        const newIndex = this._getItemIndexFromPointerPosition(item, pointerX, pointerY, pointerDelta);
        if (newIndex === -1 && siblings.length > 0) {
            return;
        }
        /** @type {?} */
        const isHorizontal = this._orientation === 'horizontal';
        /** @type {?} */
        const currentIndex = findIndex(siblings, (/**
         * @param {?} currentItem
         * @return {?}
         */
        currentItem => currentItem.drag === item));
        /** @type {?} */
        const siblingAtNewPosition = siblings[newIndex];
        /** @type {?} */
        const currentPosition = siblings[currentIndex].clientRect;
        /** @type {?} */
        const newPosition = siblingAtNewPosition.clientRect;
        /** @type {?} */
        const delta = currentIndex > newIndex ? 1 : -1;
        this._previousSwap.drag = siblingAtNewPosition.drag;
        this._previousSwap.delta = isHorizontal ? pointerDelta.x : pointerDelta.y;
        // How many pixels the item's placeholder should be offset.
        /** @type {?} */
        const itemOffset = this._getItemOffsetPx(currentPosition, newPosition, delta);
        // How many pixels all the other items should be offset.
        /** @type {?} */
        const siblingOffset = this._getSiblingOffsetPx(currentIndex, siblings, delta);
        // Save the previous order of the items before moving the item to its new index.
        // We use this to check whether an item has been moved as a result of the sorting.
        /** @type {?} */
        const oldOrder = siblings.slice();
        // Shuffle the array in place.
        moveItemInArray(siblings, currentIndex, newIndex);
        this.sorted.next({
            previousIndex: currentIndex,
            currentIndex: newIndex,
            container: this,
            item
        });
        siblings.forEach((/**
         * @param {?} sibling
         * @param {?} index
         * @return {?}
         */
        (sibling, index) => {
            // Don't do anything if the position hasn't changed.
            if (oldOrder[index] === sibling) {
                return;
            }
            /** @type {?} */
            const isDraggedItem = sibling.drag === item;
            /** @type {?} */
            const offset = isDraggedItem ? itemOffset : siblingOffset;
            /** @type {?} */
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
        }));
    }
    /**
     * Checks whether the user's pointer is close to the edges of either the
     * viewport or the drop list and starts the auto-scroll sequence.
     * @param {?} pointerX User's pointer position along the x axis.
     * @param {?} pointerY User's pointer position along the y axis.
     * @return {?}
     */
    _startScrollingIfNecessary(pointerX, pointerY) {
        if (this.autoScrollDisabled) {
            return;
        }
        /** @type {?} */
        let scrollNode;
        /** @type {?} */
        let verticalScrollDirection = 0 /* NONE */;
        /** @type {?} */
        let horizontalScrollDirection = 0 /* NONE */;
        // Check whether we should start scrolling the container.
        if (this._isPointerNearDropContainer(pointerX, pointerY)) {
            /** @type {?} */
            const element = coerceElement(this.element);
            [verticalScrollDirection, horizontalScrollDirection] =
                getElementScrollDirections(element, this._clientRect, pointerX, pointerY);
            if (verticalScrollDirection || horizontalScrollDirection) {
                scrollNode = element;
            }
        }
        // Otherwise check if we can start scrolling the viewport.
        if (!verticalScrollDirection && !horizontalScrollDirection) {
            const { width, height } = this._viewportRuler.getViewportSize();
            /** @type {?} */
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
    /**
     * Stops any currently-running auto-scroll sequences.
     * @return {?}
     */
    _stopScrolling() {
        this._stopScrollTimers.next();
    }
    /**
     * Caches the position of the drop list.
     * @private
     * @return {?}
     */
    _cacheOwnPosition() {
        /** @type {?} */
        const element = coerceElement(this.element);
        this._clientRect = getMutableClientRect(element);
        this._scrollPosition = { top: element.scrollTop, left: element.scrollLeft };
    }
    /**
     * Refreshes the position cache of the items and sibling containers.
     * @private
     * @return {?}
     */
    _cacheItemPositions() {
        /** @type {?} */
        const isHorizontal = this._orientation === 'horizontal';
        this._itemPositions = this._activeDraggables.map((/**
         * @param {?} drag
         * @return {?}
         */
        drag => {
            /** @type {?} */
            const elementToMeasure = this._dragDropRegistry.isDragging(drag) ?
                // If the element is being dragged, we have to measure the
                // placeholder, because the element is hidden.
                drag.getPlaceholderElement() :
                drag.getRootElement();
            return { drag, offset: 0, clientRect: getMutableClientRect(elementToMeasure) };
        })).sort((/**
         * @param {?} a
         * @param {?} b
         * @return {?}
         */
        (a, b) => {
            return isHorizontal ? a.clientRect.left - b.clientRect.left :
                a.clientRect.top - b.clientRect.top;
        }));
    }
    /**
     * Resets the container to its initial state.
     * @private
     * @return {?}
     */
    _reset() {
        this._isDragging = false;
        // TODO(crisbeto): may have to wait for the animations to finish.
        this._activeDraggables.forEach((/**
         * @param {?} item
         * @return {?}
         */
        item => item.getRootElement().style.transform = ''));
        this._siblings.forEach((/**
         * @param {?} sibling
         * @return {?}
         */
        sibling => sibling._stopReceiving(this)));
        this._activeDraggables = [];
        this._itemPositions = [];
        this._previousSwap.drag = null;
        this._previousSwap.delta = 0;
        this._stopScrolling();
        this._removeListeners();
    }
    /**
     * Gets the offset in pixels by which the items that aren't being dragged should be moved.
     * @private
     * @param {?} currentIndex Index of the item currently being dragged.
     * @param {?} siblings All of the items in the list.
     * @param {?} delta Direction in which the user is moving.
     * @return {?}
     */
    _getSiblingOffsetPx(currentIndex, siblings, delta) {
        /** @type {?} */
        const isHorizontal = this._orientation === 'horizontal';
        /** @type {?} */
        const currentPosition = siblings[currentIndex].clientRect;
        /** @type {?} */
        const immediateSibling = siblings[currentIndex + delta * -1];
        /** @type {?} */
        let siblingOffset = currentPosition[isHorizontal ? 'width' : 'height'] * delta;
        if (immediateSibling) {
            /** @type {?} */
            const start = isHorizontal ? 'left' : 'top';
            /** @type {?} */
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
     * Checks whether the pointer coordinates are close to the drop container.
     * @private
     * @param {?} pointerX Coordinates along the X axis.
     * @param {?} pointerY Coordinates along the Y axis.
     * @return {?}
     */
    _isPointerNearDropContainer(pointerX, pointerY) {
        const { top, right, bottom, left, width, height } = this._clientRect;
        /** @type {?} */
        const xThreshold = width * DROP_PROXIMITY_THRESHOLD;
        /** @type {?} */
        const yThreshold = height * DROP_PROXIMITY_THRESHOLD;
        return pointerY > top - yThreshold && pointerY < bottom + yThreshold &&
            pointerX > left - xThreshold && pointerX < right + xThreshold;
    }
    /**
     * Gets the offset in pixels by which the item that is being dragged should be moved.
     * @private
     * @param {?} currentPosition Current position of the item.
     * @param {?} newPosition Position of the item where the current item should be moved.
     * @param {?} delta Direction in which the user is moving.
     * @return {?}
     */
    _getItemOffsetPx(currentPosition, newPosition, delta) {
        /** @type {?} */
        const isHorizontal = this._orientation === 'horizontal';
        /** @type {?} */
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
     * Gets the index of an item in the drop container, based on the position of the user's pointer.
     * @private
     * @param {?} item Item that is being sorted.
     * @param {?} pointerX Position of the user's pointer along the X axis.
     * @param {?} pointerY Position of the user's pointer along the Y axis.
     * @param {?=} delta Direction in which the user is moving their pointer.
     * @return {?}
     */
    _getItemIndexFromPointerPosition(item, pointerX, pointerY, delta) {
        /** @type {?} */
        const isHorizontal = this._orientation === 'horizontal';
        return findIndex(this._itemPositions, (/**
         * @param {?} __0
         * @param {?} _
         * @param {?} array
         * @return {?}
         */
        ({ drag, clientRect }, _, array) => {
            if (drag === item) {
                // If there's only one item left in the container, it must be
                // the dragged item itself so we use it as a reference.
                return array.length < 2;
            }
            if (delta) {
                /** @type {?} */
                const direction = isHorizontal ? delta.x : delta.y;
                // If the user is still hovering over the same item as last time, and they didn't change
                // the direction in which they're dragging, we don't consider it a direction swap.
                if (drag === this._previousSwap.drag && direction === this._previousSwap.delta) {
                    return false;
                }
            }
            return isHorizontal ?
                // Round these down since most browsers report client rects with
                // sub-pixel precision, whereas the pointer coordinates are rounded to pixels.
                pointerX >= Math.floor(clientRect.left) && pointerX <= Math.floor(clientRect.right) :
                pointerY >= Math.floor(clientRect.top) && pointerY <= Math.floor(clientRect.bottom);
        }));
    }
    /**
     * Caches the current items in the list and their positions.
     * @private
     * @return {?}
     */
    _cacheItems() {
        this._activeDraggables = this._draggables.slice();
        this._cacheItemPositions();
        this._cacheOwnPosition();
    }
    /**
     * Updates the internal state of the container after a scroll event has happened.
     * @private
     * @param {?} scrollPosition Object that is keeping track of the scroll position.
     * @param {?} newTop New top scroll position.
     * @param {?} newLeft New left scroll position.
     * @param {?=} extraClientRect Extra `ClientRect` object that should be updated, in addition to the
     *  ones of the drag items. Useful when the viewport has been scrolled and we also need to update
     *  the `ClientRect` of the list.
     * @return {?}
     */
    _updateAfterScroll(scrollPosition, newTop, newLeft, extraClientRect) {
        /** @type {?} */
        const topDifference = scrollPosition.top - newTop;
        /** @type {?} */
        const leftDifference = scrollPosition.left - newLeft;
        if (extraClientRect) {
            adjustClientRect(extraClientRect, topDifference, leftDifference);
        }
        // Since we know the amount that the user has scrolled we can shift all of the client rectangles
        // ourselves. This is cheaper than re-measuring everything and we can avoid inconsistent
        // behavior where we might be measuring the element before its position has changed.
        this._itemPositions.forEach((/**
         * @param {?} __0
         * @return {?}
         */
        ({ clientRect }) => {
            adjustClientRect(clientRect, topDifference, leftDifference);
        }));
        // We need two loops for this, because we want all of the cached
        // positions to be up-to-date before we re-sort the item.
        this._itemPositions.forEach((/**
         * @param {?} __0
         * @return {?}
         */
        ({ drag }) => {
            if (this._dragDropRegistry.isDragging(drag)) {
                // We need to re-sort the item manually, because the pointer move
                // events won't be dispatched while the user is scrolling.
                drag._sortFromLastPointerPosition();
            }
        }));
        scrollPosition.top = newTop;
        scrollPosition.left = newLeft;
    }
    /**
     * Removes the event listeners associated with this drop list.
     * @private
     * @return {?}
     */
    _removeListeners() {
        coerceElement(this.element).removeEventListener('scroll', this._handleScroll);
        this._viewportScrollSubscription.unsubscribe();
    }
    /**
     * Checks whether the user's pointer is positioned over the container.
     * @param {?} x Pointer position along the X axis.
     * @param {?} y Pointer position along the Y axis.
     * @return {?}
     */
    _isOverContainer(x, y) {
        return isInsideClientRect(this._clientRect, x, y);
    }
    /**
     * Figures out whether an item should be moved into a sibling
     * drop container, based on its current position.
     * @param {?} item Drag item that is being moved.
     * @param {?} x Position of the item along the X axis.
     * @param {?} y Position of the item along the Y axis.
     * @return {?}
     */
    _getSiblingContainerFromPosition(item, x, y) {
        return this._siblings.find((/**
         * @param {?} sibling
         * @return {?}
         */
        sibling => sibling._canReceive(item, x, y)));
    }
    /**
     * Checks whether the drop list can receive the passed-in item.
     * @param {?} item Item that is being dragged into the list.
     * @param {?} x Position of the item along the X axis.
     * @param {?} y Position of the item along the Y axis.
     * @return {?}
     */
    _canReceive(item, x, y) {
        if (!isInsideClientRect(this._clientRect, x, y) || !this.enterPredicate(item, this)) {
            return false;
        }
        /** @type {?} */
        const elementFromPoint = (/** @type {?} */ (this._getShadowRoot().elementFromPoint(x, y)));
        // If there's no element at the pointer position, then
        // the client rect is probably scrolled out of the view.
        if (!elementFromPoint) {
            return false;
        }
        /** @type {?} */
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
     * @param {?} sibling Sibling in which dragging has started.
     * @return {?}
     */
    _startReceiving(sibling) {
        /** @type {?} */
        const activeSiblings = this._activeSiblings;
        if (!activeSiblings.has(sibling)) {
            activeSiblings.add(sibling);
            this._cacheOwnPosition();
            this._listenToScrollEvents();
        }
    }
    /**
     * Called by a connected drop list when dragging has stopped.
     * @param {?} sibling Sibling whose dragging has stopped.
     * @return {?}
     */
    _stopReceiving(sibling) {
        this._activeSiblings.delete(sibling);
        this._viewportScrollSubscription.unsubscribe();
    }
    /**
     * Starts listening to scroll events on the viewport.
     * Used for updating the internal state of the list.
     * @private
     * @return {?}
     */
    _listenToScrollEvents() {
        this._viewportScrollPosition = (/** @type {?} */ (this._viewportRuler)).getViewportScrollPosition();
        this._viewportScrollSubscription = this._dragDropRegistry.scroll.subscribe((/**
         * @return {?}
         */
        () => {
            if (this.isDragging()) {
                /** @type {?} */
                const newPosition = (/** @type {?} */ (this._viewportRuler)).getViewportScrollPosition();
                this._updateAfterScroll(this._viewportScrollPosition, newPosition.top, newPosition.left, this._clientRect);
            }
            else if (this.isReceiving()) {
                this._cacheOwnPosition();
            }
        }));
    }
    /**
     * Lazily resolves and returns the shadow root of the element. We do this in a function, rather
     * than saving it in property directly on init, because we want to resolve it as late as possible
     * in order to ensure that the element has been moved into the shadow DOM. Doing it inside the
     * constructor might be too early if the element is inside of something like `ngFor` or `ngIf`.
     * @private
     * @return {?}
     */
    _getShadowRoot() {
        if (!this._cachedShadowRoot) {
            this._cachedShadowRoot = getShadowRoot(coerceElement(this.element)) || this._document;
        }
        return this._cachedShadowRoot;
    }
}
if (false) {
    /**
     * Element that the drop list is attached to.
     * @type {?}
     */
    DropListRef.prototype.element;
    /**
     * Whether starting a dragging sequence from this container is disabled.
     * @type {?}
     */
    DropListRef.prototype.disabled;
    /**
     * Whether sorting items within the list is disabled.
     * @type {?}
     */
    DropListRef.prototype.sortingDisabled;
    /**
     * Locks the position of the draggable elements inside the container along the specified axis.
     * @type {?}
     */
    DropListRef.prototype.lockAxis;
    /**
     * Whether auto-scrolling the view when the user
     * moves their pointer close to the edges is disabled.
     * @type {?}
     */
    DropListRef.prototype.autoScrollDisabled;
    /**
     * Function that is used to determine whether an item
     * is allowed to be moved into a drop container.
     * @type {?}
     */
    DropListRef.prototype.enterPredicate;
    /**
     * Emits right before dragging has started.
     * @type {?}
     */
    DropListRef.prototype.beforeStarted;
    /**
     * Emits when the user has moved a new drag item into this container.
     * @type {?}
     */
    DropListRef.prototype.entered;
    /**
     * Emits when the user removes an item from the container
     * by dragging it into another container.
     * @type {?}
     */
    DropListRef.prototype.exited;
    /**
     * Emits when the user drops an item inside the container.
     * @type {?}
     */
    DropListRef.prototype.dropped;
    /**
     * Emits as the user is swapping items while actively dragging.
     * @type {?}
     */
    DropListRef.prototype.sorted;
    /**
     * Arbitrary data that can be attached to the drop list.
     * @type {?}
     */
    DropListRef.prototype.data;
    /**
     * Whether an item in the list is being dragged.
     * @type {?}
     * @private
     */
    DropListRef.prototype._isDragging;
    /**
     * Cache of the dimensions of all the items inside the container.
     * @type {?}
     * @private
     */
    DropListRef.prototype._itemPositions;
    /**
     * Keeps track of the container's scroll position.
     * @type {?}
     * @private
     */
    DropListRef.prototype._scrollPosition;
    /**
     * Keeps track of the scroll position of the viewport.
     * @type {?}
     * @private
     */
    DropListRef.prototype._viewportScrollPosition;
    /**
     * Cached `ClientRect` of the drop list.
     * @type {?}
     * @private
     */
    DropListRef.prototype._clientRect;
    /**
     * Draggable items that are currently active inside the container. Includes the items
     * from `_draggables`, as well as any items that have been dragged in, but haven't
     * been dropped yet.
     * @type {?}
     * @private
     */
    DropListRef.prototype._activeDraggables;
    /**
     * Keeps track of the item that was last swapped with the dragged item, as
     * well as what direction the pointer was moving in when the swap occured.
     * @type {?}
     * @private
     */
    DropListRef.prototype._previousSwap;
    /**
     * Draggable items in the container.
     * @type {?}
     * @private
     */
    DropListRef.prototype._draggables;
    /**
     * Drop lists that are connected to the current one.
     * @type {?}
     * @private
     */
    DropListRef.prototype._siblings;
    /**
     * Direction in which the list is oriented.
     * @type {?}
     * @private
     */
    DropListRef.prototype._orientation;
    /**
     * Connected siblings that currently have a dragged item.
     * @type {?}
     * @private
     */
    DropListRef.prototype._activeSiblings;
    /**
     * Layout direction of the drop list.
     * @type {?}
     * @private
     */
    DropListRef.prototype._direction;
    /**
     * Subscription to the window being scrolled.
     * @type {?}
     * @private
     */
    DropListRef.prototype._viewportScrollSubscription;
    /**
     * Vertical direction in which the list is currently scrolling.
     * @type {?}
     * @private
     */
    DropListRef.prototype._verticalScrollDirection;
    /**
     * Horizontal direction in which the list is currently scrolling.
     * @type {?}
     * @private
     */
    DropListRef.prototype._horizontalScrollDirection;
    /**
     * Node that is being auto-scrolled.
     * @type {?}
     * @private
     */
    DropListRef.prototype._scrollNode;
    /**
     * Used to signal to the current auto-scroll sequence when to stop.
     * @type {?}
     * @private
     */
    DropListRef.prototype._stopScrollTimers;
    /**
     * Shadow root of the current element. Necessary for `elementFromPoint` to resolve correctly.
     * @type {?}
     * @private
     */
    DropListRef.prototype._cachedShadowRoot;
    /**
     * Reference to the document.
     * @type {?}
     * @private
     */
    DropListRef.prototype._document;
    /**
     * Handles the container being scrolled. Has to be an arrow function to preserve the context.
     * @type {?}
     * @private
     */
    DropListRef.prototype._handleScroll;
    /**
     * Starts the interval that'll auto-scroll the element.
     * @type {?}
     * @private
     */
    DropListRef.prototype._startScrollInterval;
    /**
     * @type {?}
     * @private
     */
    DropListRef.prototype._dragDropRegistry;
    /**
     * @type {?}
     * @private
     */
    DropListRef.prototype._ngZone;
    /**
     * @type {?}
     * @private
     */
    DropListRef.prototype._viewportRuler;
}
/**
 * Updates the top/left positions of a `ClientRect`, as well as their bottom/right counterparts.
 * @param {?} clientRect `ClientRect` that should be updated.
 * @param {?} top Amount to add to the `top` position.
 * @param {?} left Amount to add to the `left` position.
 * @return {?}
 */
function adjustClientRect(clientRect, top, left) {
    clientRect.top += top;
    clientRect.bottom = clientRect.top + clientRect.height;
    clientRect.left += left;
    clientRect.right = clientRect.left + clientRect.width;
}
/**
 * Finds the index of an item that matches a predicate function. Used as an equivalent
 * of `Array.prototype.findIndex` which isn't part of the standard Google typings.
 * @template T
 * @param {?} array Array in which to look for matches.
 * @param {?} predicate Function used to determine whether an item is a match.
 * @return {?}
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
 * Checks whether some coordinates are within a `ClientRect`.
 * @param {?} clientRect ClientRect that is being checked.
 * @param {?} x Coordinates along the X axis.
 * @param {?} y Coordinates along the Y axis.
 * @return {?}
 */
function isInsideClientRect(clientRect, x, y) {
    const { top, bottom, left, right } = clientRect;
    return y >= top && y <= bottom && x >= left && x <= right;
}
/**
 * Gets a mutable version of an element's bounding `ClientRect`.
 * @param {?} element
 * @return {?}
 */
function getMutableClientRect(element) {
    /** @type {?} */
    const clientRect = element.getBoundingClientRect();
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
 * @param {?} node Node whose scroll position should change.
 * @param {?} amount Amount of pixels that the `node` should be scrolled.
 * @return {?}
 */
function incrementVerticalScroll(node, amount) {
    if (node === window) {
        ((/** @type {?} */ (node))).scrollBy(0, amount);
    }
    else {
        // Ideally we could use `Element.scrollBy` here as well, but IE and Edge don't support it.
        ((/** @type {?} */ (node))).scrollTop += amount;
    }
}
/**
 * Increments the horizontal scroll position of a node.
 * @param {?} node Node whose scroll position should change.
 * @param {?} amount Amount of pixels that the `node` should be scrolled.
 * @return {?}
 */
function incrementHorizontalScroll(node, amount) {
    if (node === window) {
        ((/** @type {?} */ (node))).scrollBy(amount, 0);
    }
    else {
        // Ideally we could use `Element.scrollBy` here as well, but IE and Edge don't support it.
        ((/** @type {?} */ (node))).scrollLeft += amount;
    }
}
/**
 * Gets whether the vertical auto-scroll direction of a node.
 * @param {?} clientRect Dimensions of the node.
 * @param {?} pointerY Position of the user's pointer along the y axis.
 * @return {?}
 */
function getVerticalScrollDirection(clientRect, pointerY) {
    const { top, bottom, height } = clientRect;
    /** @type {?} */
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
 * @param {?} clientRect Dimensions of the node.
 * @param {?} pointerX Position of the user's pointer along the x axis.
 * @return {?}
 */
function getHorizontalScrollDirection(clientRect, pointerX) {
    const { left, right, width } = clientRect;
    /** @type {?} */
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
 * @param {?} element Element for which we should calculate the scroll direction.
 * @param {?} clientRect Bounding client rectangle of the element.
 * @param {?} pointerX Position of the user's pointer along the x axis.
 * @param {?} pointerY Position of the user's pointer along the y axis.
 * @return {?}
 */
function getElementScrollDirections(element, clientRect, pointerX, pointerY) {
    /** @type {?} */
    const computedVertical = getVerticalScrollDirection(clientRect, pointerY);
    /** @type {?} */
    const computedHorizontal = getHorizontalScrollDirection(clientRect, pointerX);
    /** @type {?} */
    let verticalScrollDirection = 0 /* NONE */;
    /** @type {?} */
    let horizontalScrollDirection = 0 /* NONE */;
    // Note that we here we do some extra checks for whether the element is actually scrollable in
    // a certain direction and we only assign the scroll direction if it is. We do this so that we
    // can allow other elements to be scrolled, if the current element can't be scrolled anymore.
    // This allows us to handle cases where the scroll regions of two scrollable elements overlap.
    if (computedVertical) {
        /** @type {?} */
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
        /** @type {?} */
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
/**
 * Gets the shadow root of an element, if any.
 * @param {?} element
 * @return {?}
 */
function getShadowRoot(element) {
    if (_supportsShadowDom()) {
        /** @type {?} */
        const rootNode = element.getRootNode ? element.getRootNode() : null;
        if (rootNode instanceof ShadowRoot) {
            return rootNode;
        }
    }
    return null;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LXJlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2Ryb3AtbGlzdC1yZWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFVQSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFcEQsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDekQsT0FBTyxFQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLHVCQUF1QixFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQzlFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6QyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sY0FBYyxDQUFDOzs7Ozs7TUFRdkMsd0JBQXdCLEdBQUcsSUFBSTs7Ozs7O01BTS9CLDBCQUEwQixHQUFHLElBQUk7Ozs7OztNQU1qQyxnQkFBZ0IsR0FBRyxDQUFDOzs7Ozs7QUFNMUIsaUNBT0M7Ozs7OztJQUxDLGtDQUFjOzs7OztJQUVkLHdDQUF1Qjs7Ozs7SUFFdkIsb0NBQWU7Ozs7OztBQUlqQiw2QkFHQzs7O0lBRkMsNkJBQVk7O0lBQ1osOEJBQWE7Ozs7SUFJeUIsT0FBSSxFQUFFLEtBQUUsRUFBRSxPQUFJOzs7O0lBR1osT0FBSSxFQUFFLE9BQUksRUFBRSxRQUFLOzs7Ozs7OztBQU8zRCx5Q0FBMkQ7Ozs7O0FBSzNELE1BQU0sT0FBTyxXQUFXOzs7Ozs7OztJQTZIdEIsWUFDRSxPQUE4QyxFQUN0QyxpQkFBeUQsRUFDakUsU0FBYyxFQUNOLE9BQWUsRUFDZixjQUE2QjtRQUg3QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQXdDO1FBRXpELFlBQU8sR0FBUCxPQUFPLENBQVE7UUFDZixtQkFBYyxHQUFkLGNBQWMsQ0FBZTs7OztRQTdIdkMsYUFBUSxHQUFZLEtBQUssQ0FBQzs7OztRQUcxQixvQkFB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U0FBUyxhQUFhLENBQUMsT0FBb0I7SUFDekMsSUFBSSxrQkFBa0IsRUFBRSxFQUFFOztjQUNsQixRQUFRLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJO1FBRW5FLElBQUksUUFBUSxZQUFZLFVBQVUsRUFBRTtZQUNsQyxPQUFPLFFBQVEsQ0FBQztTQUNqQjtLQUNGO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RWxlbWVudFJlZiwgTmdab25lfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7RGlyZWN0aW9ufSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge2NvZXJjZUVsZW1lbnR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge1ZpZXdwb3J0UnVsZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9zY3JvbGxpbmcnO1xuaW1wb3J0IHtfc3VwcG9ydHNTaGFkb3dEb219IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge1N1YmplY3QsIFN1YnNjcmlwdGlvbiwgaW50ZXJ2YWwsIGFuaW1hdGlvbkZyYW1lU2NoZWR1bGVyfSBmcm9tICdyeGpzJztcbmltcG9ydCB7dGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge21vdmVJdGVtSW5BcnJheX0gZnJvbSAnLi9kcmFnLXV0aWxzJztcbmltcG9ydCB7RHJhZ0Ryb3BSZWdpc3RyeX0gZnJvbSAnLi9kcmFnLWRyb3AtcmVnaXN0cnknO1xuaW1wb3J0IHtEcmFnUmVmSW50ZXJuYWwgYXMgRHJhZ1JlZiwgUG9pbnR9IGZyb20gJy4vZHJhZy1yZWYnO1xuXG4vKipcbiAqIFByb3hpbWl0eSwgYXMgYSByYXRpbyB0byB3aWR0aC9oZWlnaHQsIGF0IHdoaWNoIGFcbiAqIGRyYWdnZWQgaXRlbSB3aWxsIGFmZmVjdCB0aGUgZHJvcCBjb250YWluZXIuXG4gKi9cbmNvbnN0IERST1BfUFJPWElNSVRZX1RIUkVTSE9MRCA9IDAuMDU7XG5cbi8qKlxuICogUHJveGltaXR5LCBhcyBhIHJhdGlvIHRvIHdpZHRoL2hlaWdodCBhdCB3aGljaCB0byBzdGFydCBhdXRvLXNjcm9sbGluZyB0aGUgZHJvcCBsaXN0IG9yIHRoZVxuICogdmlld3BvcnQuIFRoZSB2YWx1ZSBjb21lcyBmcm9tIHRyeWluZyBpdCBvdXQgbWFudWFsbHkgdW50aWwgaXQgZmVlbHMgcmlnaHQuXG4gKi9cbmNvbnN0IFNDUk9MTF9QUk9YSU1JVFlfVEhSRVNIT0xEID0gMC4wNTtcblxuLyoqXG4gKiBOdW1iZXIgb2YgcGl4ZWxzIHRvIHNjcm9sbCBmb3IgZWFjaCBmcmFtZSB3aGVuIGF1dG8tc2Nyb2xsaW5nIGFuIGVsZW1lbnQuXG4gKiBUaGUgdmFsdWUgY29tZXMgZnJvbSB0cnlpbmcgaXQgb3V0IG1hbnVhbGx5IHVudGlsIGl0IGZlZWxzIHJpZ2h0LlxuICovXG5jb25zdCBBVVRPX1NDUk9MTF9TVEVQID0gMjtcblxuLyoqXG4gKiBFbnRyeSBpbiB0aGUgcG9zaXRpb24gY2FjaGUgZm9yIGRyYWdnYWJsZSBpdGVtcy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuaW50ZXJmYWNlIENhY2hlZEl0ZW1Qb3NpdGlvbiB7XG4gIC8qKiBJbnN0YW5jZSBvZiB0aGUgZHJhZyBpdGVtLiAqL1xuICBkcmFnOiBEcmFnUmVmO1xuICAvKiogRGltZW5zaW9ucyBvZiB0aGUgaXRlbS4gKi9cbiAgY2xpZW50UmVjdDogQ2xpZW50UmVjdDtcbiAgLyoqIEFtb3VudCBieSB3aGljaCB0aGUgaXRlbSBoYXMgYmVlbiBtb3ZlZCBzaW5jZSBkcmFnZ2luZyBzdGFydGVkLiAqL1xuICBvZmZzZXQ6IG51bWJlcjtcbn1cblxuLyoqIE9iamVjdCBob2xkaW5nIHRoZSBzY3JvbGwgcG9zaXRpb24gb2Ygc29tZXRoaW5nLiAqL1xuaW50ZXJmYWNlIFNjcm9sbFBvc2l0aW9uIHtcbiAgdG9wOiBudW1iZXI7XG4gIGxlZnQ6IG51bWJlcjtcbn1cblxuLyoqIFZlcnRpY2FsIGRpcmVjdGlvbiBpbiB3aGljaCB3ZSBjYW4gYXV0by1zY3JvbGwuICovXG5jb25zdCBlbnVtIEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbiB7Tk9ORSwgVVAsIERPV059XG5cbi8qKiBIb3Jpem9udGFsIGRpcmVjdGlvbiBpbiB3aGljaCB3ZSBjYW4gYXV0by1zY3JvbGwuICovXG5jb25zdCBlbnVtIEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uIHtOT05FLCBMRUZULCBSSUdIVH1cblxuLyoqXG4gKiBJbnRlcm5hbCBjb21waWxlLXRpbWUtb25seSByZXByZXNlbnRhdGlvbiBvZiBhIGBEcm9wTGlzdFJlZmAuXG4gKiBVc2VkIHRvIGF2b2lkIGNpcmN1bGFyIGltcG9ydCBpc3N1ZXMgYmV0d2VlbiB0aGUgYERyb3BMaXN0UmVmYCBhbmQgdGhlIGBEcmFnUmVmYC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEcm9wTGlzdFJlZkludGVybmFsIGV4dGVuZHMgRHJvcExpc3RSZWYge31cblxuLyoqXG4gKiBSZWZlcmVuY2UgdG8gYSBkcm9wIGxpc3QuIFVzZWQgdG8gbWFuaXB1bGF0ZSBvciBkaXNwb3NlIG9mIHRoZSBjb250YWluZXIuXG4gKi9cbmV4cG9ydCBjbGFzcyBEcm9wTGlzdFJlZjxUID0gYW55PiB7XG4gIC8qKiBFbGVtZW50IHRoYXQgdGhlIGRyb3AgbGlzdCBpcyBhdHRhY2hlZCB0by4gKi9cbiAgZWxlbWVudDogSFRNTEVsZW1lbnQgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50PjtcblxuICAvKiogV2hldGhlciBzdGFydGluZyBhIGRyYWdnaW5nIHNlcXVlbmNlIGZyb20gdGhpcyBjb250YWluZXIgaXMgZGlzYWJsZWQuICovXG4gIGRpc2FibGVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgc29ydGluZyBpdGVtcyB3aXRoaW4gdGhlIGxpc3QgaXMgZGlzYWJsZWQuICovXG4gIHNvcnRpbmdEaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBMb2NrcyB0aGUgcG9zaXRpb24gb2YgdGhlIGRyYWdnYWJsZSBlbGVtZW50cyBpbnNpZGUgdGhlIGNvbnRhaW5lciBhbG9uZyB0aGUgc3BlY2lmaWVkIGF4aXMuICovXG4gIGxvY2tBeGlzOiAneCcgfCAneSc7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgYXV0by1zY3JvbGxpbmcgdGhlIHZpZXcgd2hlbiB0aGUgdXNlclxuICAgKiBtb3ZlcyB0aGVpciBwb2ludGVyIGNsb3NlIHRvIHRoZSBlZGdlcyBpcyBkaXNhYmxlZC5cbiAgICovXG4gIGF1dG9TY3JvbGxEaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBGdW5jdGlvbiB0aGF0IGlzIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYW4gaXRlbVxuICAgKiBpcyBhbGxvd2VkIHRvIGJlIG1vdmVkIGludG8gYSBkcm9wIGNvbnRhaW5lci5cbiAgICovXG4gIGVudGVyUHJlZGljYXRlOiAoZHJhZzogRHJhZ1JlZiwgZHJvcDogRHJvcExpc3RSZWYpID0+IGJvb2xlYW4gPSAoKSA9PiB0cnVlO1xuXG4gIC8qKiBFbWl0cyByaWdodCBiZWZvcmUgZHJhZ2dpbmcgaGFzIHN0YXJ0ZWQuICovXG4gIGJlZm9yZVN0YXJ0ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGhhcyBtb3ZlZCBhIG5ldyBkcmFnIGl0ZW0gaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICovXG4gIGVudGVyZWQgPSBuZXcgU3ViamVjdDx7aXRlbTogRHJhZ1JlZiwgY29udGFpbmVyOiBEcm9wTGlzdFJlZiwgY3VycmVudEluZGV4OiBudW1iZXJ9PigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHJlbW92ZXMgYW4gaXRlbSBmcm9tIHRoZSBjb250YWluZXJcbiAgICogYnkgZHJhZ2dpbmcgaXQgaW50byBhbm90aGVyIGNvbnRhaW5lci5cbiAgICovXG4gIGV4aXRlZCA9IG5ldyBTdWJqZWN0PHtpdGVtOiBEcmFnUmVmLCBjb250YWluZXI6IERyb3BMaXN0UmVmfT4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBkcm9wcyBhbiBpdGVtIGluc2lkZSB0aGUgY29udGFpbmVyLiAqL1xuICBkcm9wcGVkID0gbmV3IFN1YmplY3Q8e1xuICAgIGl0ZW06IERyYWdSZWYsXG4gICAgY3VycmVudEluZGV4OiBudW1iZXIsXG4gICAgcHJldmlvdXNJbmRleDogbnVtYmVyLFxuICAgIGNvbnRhaW5lcjogRHJvcExpc3RSZWYsXG4gICAgcHJldmlvdXNDb250YWluZXI6IERyb3BMaXN0UmVmLFxuICAgIGlzUG9pbnRlck92ZXJDb250YWluZXI6IGJvb2xlYW4sXG4gICAgZGlzdGFuY2U6IFBvaW50O1xuICB9PigpO1xuXG4gIC8qKiBFbWl0cyBhcyB0aGUgdXNlciBpcyBzd2FwcGluZyBpdGVtcyB3aGlsZSBhY3RpdmVseSBkcmFnZ2luZy4gKi9cbiAgc29ydGVkID0gbmV3IFN1YmplY3Q8e1xuICAgIHByZXZpb3VzSW5kZXg6IG51bWJlcixcbiAgICBjdXJyZW50SW5kZXg6IG51bWJlcixcbiAgICBjb250YWluZXI6IERyb3BMaXN0UmVmLFxuICAgIGl0ZW06IERyYWdSZWZcbiAgfT4oKTtcblxuICAvKiogQXJiaXRyYXJ5IGRhdGEgdGhhdCBjYW4gYmUgYXR0YWNoZWQgdG8gdGhlIGRyb3AgbGlzdC4gKi9cbiAgZGF0YTogVDtcblxuICAvKiogV2hldGhlciBhbiBpdGVtIGluIHRoZSBsaXN0IGlzIGJlaW5nIGRyYWdnZWQuICovXG4gIHByaXZhdGUgX2lzRHJhZ2dpbmcgPSBmYWxzZTtcblxuICAvKiogQ2FjaGUgb2YgdGhlIGRpbWVuc2lvbnMgb2YgYWxsIHRoZSBpdGVtcyBpbnNpZGUgdGhlIGNvbnRhaW5lci4gKi9cbiAgcHJpdmF0ZSBfaXRlbVBvc2l0aW9uczogQ2FjaGVkSXRlbVBvc2l0aW9uW10gPSBbXTtcblxuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIGNvbnRhaW5lcidzIHNjcm9sbCBwb3NpdGlvbi4gKi9cbiAgcHJpdmF0ZSBfc2Nyb2xsUG9zaXRpb246IFNjcm9sbFBvc2l0aW9uID0ge3RvcDogMCwgbGVmdDogMH07XG5cbiAgLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBzY3JvbGwgcG9zaXRpb24gb2YgdGhlIHZpZXdwb3J0LiAqL1xuICBwcml2YXRlIF92aWV3cG9ydFNjcm9sbFBvc2l0aW9uOiBTY3JvbGxQb3NpdGlvbiA9IHt0b3A6IDAsIGxlZnQ6IDB9O1xuXG4gIC8qKiBDYWNoZWQgYENsaWVudFJlY3RgIG9mIHRoZSBkcm9wIGxpc3QuICovXG4gIHByaXZhdGUgX2NsaWVudFJlY3Q6IENsaWVudFJlY3Q7XG5cbiAgLyoqXG4gICAqIERyYWdnYWJsZSBpdGVtcyB0aGF0IGFyZSBjdXJyZW50bHkgYWN0aXZlIGluc2lkZSB0aGUgY29udGFpbmVyLiBJbmNsdWRlcyB0aGUgaXRlbXNcbiAgICogZnJvbSBgX2RyYWdnYWJsZXNgLCBhcyB3ZWxsIGFzIGFueSBpdGVtcyB0aGF0IGhhdmUgYmVlbiBkcmFnZ2VkIGluLCBidXQgaGF2ZW4ndFxuICAgKiBiZWVuIGRyb3BwZWQgeWV0LlxuICAgKi9cbiAgcHJpdmF0ZSBfYWN0aXZlRHJhZ2dhYmxlczogRHJhZ1JlZltdO1xuXG4gIC8qKlxuICAgKiBLZWVwcyB0cmFjayBvZiB0aGUgaXRlbSB0aGF0IHdhcyBsYXN0IHN3YXBwZWQgd2l0aCB0aGUgZHJhZ2dlZCBpdGVtLCBhc1xuICAgKiB3ZWxsIGFzIHdoYXQgZGlyZWN0aW9uIHRoZSBwb2ludGVyIHdhcyBtb3ZpbmcgaW4gd2hlbiB0aGUgc3dhcCBvY2N1cmVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfcHJldmlvdXNTd2FwID0ge2RyYWc6IG51bGwgYXMgRHJhZ1JlZiB8IG51bGwsIGRlbHRhOiAwfTtcblxuICAvKiogRHJhZ2dhYmxlIGl0ZW1zIGluIHRoZSBjb250YWluZXIuICovXG4gIHByaXZhdGUgX2RyYWdnYWJsZXM6IFJlYWRvbmx5QXJyYXk8RHJhZ1JlZj47XG5cbiAgLyoqIERyb3AgbGlzdHMgdGhhdCBhcmUgY29ubmVjdGVkIHRvIHRoZSBjdXJyZW50IG9uZS4gKi9cbiAgcHJpdmF0ZSBfc2libGluZ3M6IFJlYWRvbmx5QXJyYXk8RHJvcExpc3RSZWY+ID0gW107XG5cbiAgLyoqIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgbGlzdCBpcyBvcmllbnRlZC4gKi9cbiAgcHJpdmF0ZSBfb3JpZW50YXRpb246ICdob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCcgPSAndmVydGljYWwnO1xuXG4gIC8qKiBDb25uZWN0ZWQgc2libGluZ3MgdGhhdCBjdXJyZW50bHkgaGF2ZSBhIGRyYWdnZWQgaXRlbS4gKi9cbiAgcHJpdmF0ZSBfYWN0aXZlU2libGluZ3MgPSBuZXcgU2V0PERyb3BMaXN0UmVmPigpO1xuXG4gIC8qKiBMYXlvdXQgZGlyZWN0aW9uIG9mIHRoZSBkcm9wIGxpc3QuICovXG4gIHByaXZhdGUgX2RpcmVjdGlvbjogRGlyZWN0aW9uID0gJ2x0cic7XG5cbiAgLyoqIFN1YnNjcmlwdGlvbiB0byB0aGUgd2luZG93IGJlaW5nIHNjcm9sbGVkLiAqL1xuICBwcml2YXRlIF92aWV3cG9ydFNjcm9sbFN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcblxuICAvKiogVmVydGljYWwgZGlyZWN0aW9uIGluIHdoaWNoIHRoZSBsaXN0IGlzIGN1cnJlbnRseSBzY3JvbGxpbmcuICovXG4gIHByaXZhdGUgX3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLk5PTkU7XG5cbiAgLyoqIEhvcml6b250YWwgZGlyZWN0aW9uIGluIHdoaWNoIHRoZSBsaXN0IGlzIGN1cnJlbnRseSBzY3JvbGxpbmcuICovXG4gIHByaXZhdGUgX2hvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5OT05FO1xuXG4gIC8qKiBOb2RlIHRoYXQgaXMgYmVpbmcgYXV0by1zY3JvbGxlZC4gKi9cbiAgcHJpdmF0ZSBfc2Nyb2xsTm9kZTogSFRNTEVsZW1lbnQgfCBXaW5kb3c7XG5cbiAgLyoqIFVzZWQgdG8gc2lnbmFsIHRvIHRoZSBjdXJyZW50IGF1dG8tc2Nyb2xsIHNlcXVlbmNlIHdoZW4gdG8gc3RvcC4gKi9cbiAgcHJpdmF0ZSBfc3RvcFNjcm9sbFRpbWVycyA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIFNoYWRvdyByb290IG9mIHRoZSBjdXJyZW50IGVsZW1lbnQuIE5lY2Vzc2FyeSBmb3IgYGVsZW1lbnRGcm9tUG9pbnRgIHRvIHJlc29sdmUgY29ycmVjdGx5LiAqL1xuICBwcml2YXRlIF9jYWNoZWRTaGFkb3dSb290OiBEb2N1bWVudE9yU2hhZG93Um9vdCB8IG51bGwgPSBudWxsO1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIGRvY3VtZW50LiAqL1xuICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBIVE1MRWxlbWVudCxcbiAgICBwcml2YXRlIF9kcmFnRHJvcFJlZ2lzdHJ5OiBEcmFnRHJvcFJlZ2lzdHJ5PERyYWdSZWYsIERyb3BMaXN0UmVmPixcbiAgICBfZG9jdW1lbnQ6IGFueSxcbiAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICBwcml2YXRlIF92aWV3cG9ydFJ1bGVyOiBWaWV3cG9ydFJ1bGVyKSB7XG4gICAgdGhpcy5lbGVtZW50ID0gY29lcmNlRWxlbWVudChlbGVtZW50KTtcbiAgICB0aGlzLl9kb2N1bWVudCA9IF9kb2N1bWVudDtcbiAgICBfZHJhZ0Ryb3BSZWdpc3RyeS5yZWdpc3RlckRyb3BDb250YWluZXIodGhpcyk7XG4gIH1cblxuICAvKiogUmVtb3ZlcyB0aGUgZHJvcCBsaXN0IGZ1bmN0aW9uYWxpdHkgZnJvbSB0aGUgRE9NIGVsZW1lbnQuICovXG4gIGRpc3Bvc2UoKSB7XG4gICAgdGhpcy5fc3RvcFNjcm9sbGluZygpO1xuICAgIHRoaXMuX3N0b3BTY3JvbGxUaW1lcnMuY29tcGxldGUoKTtcbiAgICB0aGlzLl9yZW1vdmVMaXN0ZW5lcnMoKTtcbiAgICB0aGlzLmJlZm9yZVN0YXJ0ZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmVudGVyZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmV4aXRlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuZHJvcHBlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuc29ydGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fYWN0aXZlU2libGluZ3MuY2xlYXIoKTtcbiAgICB0aGlzLl9zY3JvbGxOb2RlID0gbnVsbCE7XG4gICAgdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5yZW1vdmVEcm9wQ29udGFpbmVyKHRoaXMpO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgYW4gaXRlbSBmcm9tIHRoaXMgbGlzdCBpcyBjdXJyZW50bHkgYmVpbmcgZHJhZ2dlZC4gKi9cbiAgaXNEcmFnZ2luZygpIHtcbiAgICByZXR1cm4gdGhpcy5faXNEcmFnZ2luZztcbiAgfVxuXG4gIC8qKiBTdGFydHMgZHJhZ2dpbmcgYW4gaXRlbS4gKi9cbiAgc3RhcnQoKTogdm9pZCB7XG4gICAgY29uc3QgZWxlbWVudCA9IGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KTtcbiAgICB0aGlzLmJlZm9yZVN0YXJ0ZWQubmV4dCgpO1xuICAgIHRoaXMuX2lzRHJhZ2dpbmcgPSB0cnVlO1xuICAgIHRoaXMuX2NhY2hlSXRlbXMoKTtcbiAgICB0aGlzLl9zaWJsaW5ncy5mb3JFYWNoKHNpYmxpbmcgPT4gc2libGluZy5fc3RhcnRSZWNlaXZpbmcodGhpcykpO1xuICAgIHRoaXMuX3JlbW92ZUxpc3RlbmVycygpO1xuICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHRoaXMuX2hhbmRsZVNjcm9sbCkpO1xuICAgIHRoaXMuX2xpc3RlblRvU2Nyb2xsRXZlbnRzKCk7XG4gIH1cblxuICAvKipcbiAgICogRW1pdHMgYW4gZXZlbnQgdG8gaW5kaWNhdGUgdGhhdCB0aGUgdXNlciBtb3ZlZCBhbiBpdGVtIGludG8gdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB0aGF0IHdhcyBtb3ZlZCBpbnRvIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSBwb2ludGVyWCBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0gcG9pbnRlclkgUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFkgYXhpcy5cbiAgICovXG4gIGVudGVyKGl0ZW06IERyYWdSZWYsIHBvaW50ZXJYOiBudW1iZXIsIHBvaW50ZXJZOiBudW1iZXIpOiB2b2lkIHtcbiAgICB0aGlzLnN0YXJ0KCk7XG5cbiAgICAvLyBJZiBzb3J0aW5nIGlzIGRpc2FibGVkLCB3ZSB3YW50IHRoZSBpdGVtIHRvIHJldHVybiB0byBpdHMgc3RhcnRpbmdcbiAgICAvLyBwb3NpdGlvbiBpZiB0aGUgdXNlciBpcyByZXR1cm5pbmcgaXQgdG8gaXRzIGluaXRpYWwgY29udGFpbmVyLlxuICAgIGxldCBuZXdJbmRleCA9IHRoaXMuc29ydGluZ0Rpc2FibGVkID8gdGhpcy5fZHJhZ2dhYmxlcy5pbmRleE9mKGl0ZW0pIDogLTE7XG5cbiAgICBpZiAobmV3SW5kZXggPT09IC0xKSB7XG4gICAgICAvLyBXZSB1c2UgdGhlIGNvb3JkaW5hdGVzIG9mIHdoZXJlIHRoZSBpdGVtIGVudGVyZWQgdGhlIGRyb3BcbiAgICAgIC8vIHpvbmUgdG8gZmlndXJlIG91dCBhdCB3aGljaCBpbmRleCBpdCBzaG91bGQgYmUgaW5zZXJ0ZWQuXG4gICAgICBuZXdJbmRleCA9IHRoaXMuX2dldEl0ZW1JbmRleEZyb21Qb2ludGVyUG9zaXRpb24oaXRlbSwgcG9pbnRlclgsIHBvaW50ZXJZKTtcbiAgICB9XG5cbiAgICBjb25zdCBhY3RpdmVEcmFnZ2FibGVzID0gdGhpcy5fYWN0aXZlRHJhZ2dhYmxlcztcbiAgICBjb25zdCBjdXJyZW50SW5kZXggPSBhY3RpdmVEcmFnZ2FibGVzLmluZGV4T2YoaXRlbSk7XG4gICAgY29uc3QgcGxhY2Vob2xkZXIgPSBpdGVtLmdldFBsYWNlaG9sZGVyRWxlbWVudCgpO1xuICAgIGxldCBuZXdQb3NpdGlvblJlZmVyZW5jZTogRHJhZ1JlZiB8IHVuZGVmaW5lZCA9IGFjdGl2ZURyYWdnYWJsZXNbbmV3SW5kZXhdO1xuXG4gICAgLy8gSWYgdGhlIGl0ZW0gYXQgdGhlIG5ldyBwb3NpdGlvbiBpcyB0aGUgc2FtZSBhcyB0aGUgaXRlbSB0aGF0IGlzIGJlaW5nIGRyYWdnZWQsXG4gICAgLy8gaXQgbWVhbnMgdGhhdCB3ZSdyZSB0cnlpbmcgdG8gcmVzdG9yZSB0aGUgaXRlbSB0byBpdHMgaW5pdGlhbCBwb3NpdGlvbi4gSW4gdGhpc1xuICAgIC8vIGNhc2Ugd2Ugc2hvdWxkIHVzZSB0aGUgbmV4dCBpdGVtIGZyb20gdGhlIGxpc3QgYXMgdGhlIHJlZmVyZW5jZS5cbiAgICBpZiAobmV3UG9zaXRpb25SZWZlcmVuY2UgPT09IGl0ZW0pIHtcbiAgICAgIG5ld1Bvc2l0aW9uUmVmZXJlbmNlID0gYWN0aXZlRHJhZ2dhYmxlc1tuZXdJbmRleCArIDFdO1xuICAgIH1cblxuICAgIC8vIFNpbmNlIHRoZSBpdGVtIG1heSBiZSBpbiB0aGUgYGFjdGl2ZURyYWdnYWJsZXNgIGFscmVhZHkgKGUuZy4gaWYgdGhlIHVzZXIgZHJhZ2dlZCBpdFxuICAgIC8vIGludG8gYW5vdGhlciBjb250YWluZXIgYW5kIGJhY2sgYWdhaW4pLCB3ZSBoYXZlIHRvIGVuc3VyZSB0aGF0IGl0IGlzbid0IGR1cGxpY2F0ZWQuXG4gICAgaWYgKGN1cnJlbnRJbmRleCA+IC0xKSB7XG4gICAgICBhY3RpdmVEcmFnZ2FibGVzLnNwbGljZShjdXJyZW50SW5kZXgsIDEpO1xuICAgIH1cblxuICAgIC8vIERvbid0IHVzZSBpdGVtcyB0aGF0IGFyZSBiZWluZyBkcmFnZ2VkIGFzIGEgcmVmZXJlbmNlLCBiZWNhdXNlXG4gICAgLy8gdGhlaXIgZWxlbWVudCBoYXMgYmVlbiBtb3ZlZCBkb3duIHRvIHRoZSBib3R0b20gb2YgdGhlIGJvZHkuXG4gICAgaWYgKG5ld1Bvc2l0aW9uUmVmZXJlbmNlICYmICF0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LmlzRHJhZ2dpbmcobmV3UG9zaXRpb25SZWZlcmVuY2UpKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gbmV3UG9zaXRpb25SZWZlcmVuY2UuZ2V0Um9vdEVsZW1lbnQoKTtcbiAgICAgIGVsZW1lbnQucGFyZW50RWxlbWVudCEuaW5zZXJ0QmVmb3JlKHBsYWNlaG9sZGVyLCBlbGVtZW50KTtcbiAgICAgIGFjdGl2ZURyYWdnYWJsZXMuc3BsaWNlKG5ld0luZGV4LCAwLCBpdGVtKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpLmFwcGVuZENoaWxkKHBsYWNlaG9sZGVyKTtcbiAgICAgIGFjdGl2ZURyYWdnYWJsZXMucHVzaChpdGVtKTtcbiAgICB9XG5cbiAgICAvLyBUaGUgdHJhbnNmb3JtIG5lZWRzIHRvIGJlIGNsZWFyZWQgc28gaXQgZG9lc24ndCB0aHJvdyBvZmYgdGhlIG1lYXN1cmVtZW50cy5cbiAgICBwbGFjZWhvbGRlci5zdHlsZS50cmFuc2Zvcm0gPSAnJztcblxuICAgIC8vIE5vdGUgdGhhdCB0aGUgcG9zaXRpb25zIHdlcmUgYWxyZWFkeSBjYWNoZWQgd2hlbiB3ZSBjYWxsZWQgYHN0YXJ0YCBhYm92ZSxcbiAgICAvLyBidXQgd2UgbmVlZCB0byByZWZyZXNoIHRoZW0gc2luY2UgdGhlIGFtb3VudCBvZiBpdGVtcyBoYXMgY2hhbmdlZC5cbiAgICB0aGlzLl9jYWNoZUl0ZW1Qb3NpdGlvbnMoKTtcbiAgICB0aGlzLmVudGVyZWQubmV4dCh7aXRlbSwgY29udGFpbmVyOiB0aGlzLCBjdXJyZW50SW5kZXg6IHRoaXMuZ2V0SXRlbUluZGV4KGl0ZW0pfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhbiBpdGVtIGZyb20gdGhlIGNvbnRhaW5lciBhZnRlciBpdCB3YXMgZHJhZ2dlZCBpbnRvIGFub3RoZXIgY29udGFpbmVyIGJ5IHRoZSB1c2VyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRoYXQgd2FzIGRyYWdnZWQgb3V0LlxuICAgKi9cbiAgZXhpdChpdGVtOiBEcmFnUmVmKTogdm9pZCB7XG4gICAgdGhpcy5fcmVzZXQoKTtcbiAgICB0aGlzLmV4aXRlZC5uZXh0KHtpdGVtLCBjb250YWluZXI6IHRoaXN9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEcm9wcyBhbiBpdGVtIGludG8gdGhpcyBjb250YWluZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gYmVpbmcgZHJvcHBlZCBpbnRvIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSBjdXJyZW50SW5kZXggSW5kZXggYXQgd2hpY2ggdGhlIGl0ZW0gc2hvdWxkIGJlIGluc2VydGVkLlxuICAgKiBAcGFyYW0gcHJldmlvdXNDb250YWluZXIgQ29udGFpbmVyIGZyb20gd2hpY2ggdGhlIGl0ZW0gZ290IGRyYWdnZWQgaW4uXG4gICAqIEBwYXJhbSBpc1BvaW50ZXJPdmVyQ29udGFpbmVyIFdoZXRoZXIgdGhlIHVzZXIncyBwb2ludGVyIHdhcyBvdmVyIHRoZVxuICAgKiAgICBjb250YWluZXIgd2hlbiB0aGUgaXRlbSB3YXMgZHJvcHBlZC5cbiAgICogQHBhcmFtIGRpc3RhbmNlIERpc3RhbmNlIHRoZSB1c2VyIGhhcyBkcmFnZ2VkIHNpbmNlIHRoZSBzdGFydCBvZiB0aGUgZHJhZ2dpbmcgc2VxdWVuY2UuXG4gICAqL1xuICBkcm9wKGl0ZW06IERyYWdSZWYsIGN1cnJlbnRJbmRleDogbnVtYmVyLCBwcmV2aW91c0NvbnRhaW5lcjogRHJvcExpc3RSZWYsXG4gICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcjogYm9vbGVhbiwgZGlzdGFuY2U6IFBvaW50KTogdm9pZCB7XG4gICAgdGhpcy5fcmVzZXQoKTtcbiAgICB0aGlzLmRyb3BwZWQubmV4dCh7XG4gICAgICBpdGVtLFxuICAgICAgY3VycmVudEluZGV4LFxuICAgICAgcHJldmlvdXNJbmRleDogcHJldmlvdXNDb250YWluZXIuZ2V0SXRlbUluZGV4KGl0ZW0pLFxuICAgICAgY29udGFpbmVyOiB0aGlzLFxuICAgICAgcHJldmlvdXNDb250YWluZXIsXG4gICAgICBpc1BvaW50ZXJPdmVyQ29udGFpbmVyLFxuICAgICAgZGlzdGFuY2VcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBkcmFnZ2FibGUgaXRlbXMgdGhhdCBhcmUgYSBwYXJ0IG9mIHRoaXMgbGlzdC5cbiAgICogQHBhcmFtIGl0ZW1zIEl0ZW1zIHRoYXQgYXJlIGEgcGFydCBvZiB0aGlzIGxpc3QuXG4gICAqL1xuICB3aXRoSXRlbXMoaXRlbXM6IERyYWdSZWZbXSk6IHRoaXMge1xuICAgIHRoaXMuX2RyYWdnYWJsZXMgPSBpdGVtcztcbiAgICBpdGVtcy5mb3JFYWNoKGl0ZW0gPT4gaXRlbS5fd2l0aERyb3BDb250YWluZXIodGhpcykpO1xuXG4gICAgaWYgKHRoaXMuaXNEcmFnZ2luZygpKSB7XG4gICAgICB0aGlzLl9jYWNoZUl0ZW1zKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogU2V0cyB0aGUgbGF5b3V0IGRpcmVjdGlvbiBvZiB0aGUgZHJvcCBsaXN0LiAqL1xuICB3aXRoRGlyZWN0aW9uKGRpcmVjdGlvbjogRGlyZWN0aW9uKTogdGhpcyB7XG4gICAgdGhpcy5fZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGNvbnRhaW5lcnMgdGhhdCBhcmUgY29ubmVjdGVkIHRvIHRoaXMgb25lLiBXaGVuIHR3byBvciBtb3JlIGNvbnRhaW5lcnMgYXJlXG4gICAqIGNvbm5lY3RlZCwgdGhlIHVzZXIgd2lsbCBiZSBhbGxvd2VkIHRvIHRyYW5zZmVyIGl0ZW1zIGJldHdlZW4gdGhlbS5cbiAgICogQHBhcmFtIGNvbm5lY3RlZFRvIE90aGVyIGNvbnRhaW5lcnMgdGhhdCB0aGUgY3VycmVudCBjb250YWluZXJzIHNob3VsZCBiZSBjb25uZWN0ZWQgdG8uXG4gICAqL1xuICBjb25uZWN0ZWRUbyhjb25uZWN0ZWRUbzogRHJvcExpc3RSZWZbXSk6IHRoaXMge1xuICAgIHRoaXMuX3NpYmxpbmdzID0gY29ubmVjdGVkVG8uc2xpY2UoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBvcmllbnRhdGlvbiBvZiB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gb3JpZW50YXRpb24gTmV3IG9yaWVudGF0aW9uIGZvciB0aGUgY29udGFpbmVyLlxuICAgKi9cbiAgd2l0aE9yaWVudGF0aW9uKG9yaWVudGF0aW9uOiAndmVydGljYWwnIHwgJ2hvcml6b250YWwnKTogdGhpcyB7XG4gICAgdGhpcy5fb3JpZW50YXRpb24gPSBvcmllbnRhdGlvbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBGaWd1cmVzIG91dCB0aGUgaW5kZXggb2YgYW4gaXRlbSBpbiB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHdob3NlIGluZGV4IHNob3VsZCBiZSBkZXRlcm1pbmVkLlxuICAgKi9cbiAgZ2V0SXRlbUluZGV4KGl0ZW06IERyYWdSZWYpOiBudW1iZXIge1xuICAgIGlmICghdGhpcy5faXNEcmFnZ2luZykge1xuICAgICAgcmV0dXJuIHRoaXMuX2RyYWdnYWJsZXMuaW5kZXhPZihpdGVtKTtcbiAgICB9XG5cbiAgICAvLyBJdGVtcyBhcmUgc29ydGVkIGFsd2F5cyBieSB0b3AvbGVmdCBpbiB0aGUgY2FjaGUsIGhvd2V2ZXIgdGhleSBmbG93IGRpZmZlcmVudGx5IGluIFJUTC5cbiAgICAvLyBUaGUgcmVzdCBvZiB0aGUgbG9naWMgc3RpbGwgc3RhbmRzIG5vIG1hdHRlciB3aGF0IG9yaWVudGF0aW9uIHdlJ3JlIGluLCBob3dldmVyXG4gICAgLy8gd2UgbmVlZCB0byBpbnZlcnQgdGhlIGFycmF5IHdoZW4gZGV0ZXJtaW5pbmcgdGhlIGluZGV4LlxuICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5fb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJyAmJiB0aGlzLl9kaXJlY3Rpb24gPT09ICdydGwnID9cbiAgICAgICAgdGhpcy5faXRlbVBvc2l0aW9ucy5zbGljZSgpLnJldmVyc2UoKSA6IHRoaXMuX2l0ZW1Qb3NpdGlvbnM7XG5cbiAgICByZXR1cm4gZmluZEluZGV4KGl0ZW1zLCBjdXJyZW50SXRlbSA9PiBjdXJyZW50SXRlbS5kcmFnID09PSBpdGVtKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBsaXN0IGlzIGFibGUgdG8gcmVjZWl2ZSB0aGUgaXRlbSB0aGF0XG4gICAqIGlzIGN1cnJlbnRseSBiZWluZyBkcmFnZ2VkIGluc2lkZSBhIGNvbm5lY3RlZCBkcm9wIGxpc3QuXG4gICAqL1xuICBpc1JlY2VpdmluZygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fYWN0aXZlU2libGluZ3Muc2l6ZSA+IDA7XG4gIH1cblxuICAvKipcbiAgICogU29ydHMgYW4gaXRlbSBpbnNpZGUgdGhlIGNvbnRhaW5lciBiYXNlZCBvbiBpdHMgcG9zaXRpb24uXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdG8gYmUgc29ydGVkLlxuICAgKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHBvaW50ZXJZIFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyRGVsdGEgRGlyZWN0aW9uIGluIHdoaWNoIHRoZSBwb2ludGVyIGlzIG1vdmluZyBhbG9uZyBlYWNoIGF4aXMuXG4gICAqL1xuICBfc29ydEl0ZW0oaXRlbTogRHJhZ1JlZiwgcG9pbnRlclg6IG51bWJlciwgcG9pbnRlclk6IG51bWJlcixcbiAgICAgICAgICAgIHBvaW50ZXJEZWx0YToge3g6IG51bWJlciwgeTogbnVtYmVyfSk6IHZvaWQge1xuICAgIC8vIERvbid0IHNvcnQgdGhlIGl0ZW0gaWYgc29ydGluZyBpcyBkaXNhYmxlZCBvciBpdCdzIG91dCBvZiByYW5nZS5cbiAgICBpZiAodGhpcy5zb3J0aW5nRGlzYWJsZWQgfHwgIXRoaXMuX2lzUG9pbnRlck5lYXJEcm9wQ29udGFpbmVyKHBvaW50ZXJYLCBwb2ludGVyWSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzaWJsaW5ncyA9IHRoaXMuX2l0ZW1Qb3NpdGlvbnM7XG4gICAgY29uc3QgbmV3SW5kZXggPSB0aGlzLl9nZXRJdGVtSW5kZXhGcm9tUG9pbnRlclBvc2l0aW9uKGl0ZW0sIHBvaW50ZXJYLCBwb2ludGVyWSwgcG9pbnRlckRlbHRhKTtcblxuICAgIGlmIChuZXdJbmRleCA9PT0gLTEgJiYgc2libGluZ3MubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCc7XG4gICAgY29uc3QgY3VycmVudEluZGV4ID0gZmluZEluZGV4KHNpYmxpbmdzLCBjdXJyZW50SXRlbSA9PiBjdXJyZW50SXRlbS5kcmFnID09PSBpdGVtKTtcbiAgICBjb25zdCBzaWJsaW5nQXROZXdQb3NpdGlvbiA9IHNpYmxpbmdzW25ld0luZGV4XTtcbiAgICBjb25zdCBjdXJyZW50UG9zaXRpb24gPSBzaWJsaW5nc1tjdXJyZW50SW5kZXhdLmNsaWVudFJlY3Q7XG4gICAgY29uc3QgbmV3UG9zaXRpb24gPSBzaWJsaW5nQXROZXdQb3NpdGlvbi5jbGllbnRSZWN0O1xuICAgIGNvbnN0IGRlbHRhID0gY3VycmVudEluZGV4ID4gbmV3SW5kZXggPyAxIDogLTE7XG5cbiAgICB0aGlzLl9wcmV2aW91c1N3YXAuZHJhZyA9IHNpYmxpbmdBdE5ld1Bvc2l0aW9uLmRyYWc7XG4gICAgdGhpcy5fcHJldmlvdXNTd2FwLmRlbHRhID0gaXNIb3Jpem9udGFsID8gcG9pbnRlckRlbHRhLnggOiBwb2ludGVyRGVsdGEueTtcblxuICAgIC8vIEhvdyBtYW55IHBpeGVscyB0aGUgaXRlbSdzIHBsYWNlaG9sZGVyIHNob3VsZCBiZSBvZmZzZXQuXG4gICAgY29uc3QgaXRlbU9mZnNldCA9IHRoaXMuX2dldEl0ZW1PZmZzZXRQeChjdXJyZW50UG9zaXRpb24sIG5ld1Bvc2l0aW9uLCBkZWx0YSk7XG5cbiAgICAvLyBIb3cgbWFueSBwaXhlbHMgYWxsIHRoZSBvdGhlciBpdGVtcyBzaG91bGQgYmUgb2Zmc2V0LlxuICAgIGNvbnN0IHNpYmxpbmdPZmZzZXQgPSB0aGlzLl9nZXRTaWJsaW5nT2Zmc2V0UHgoY3VycmVudEluZGV4LCBzaWJsaW5ncywgZGVsdGEpO1xuXG4gICAgLy8gU2F2ZSB0aGUgcHJldmlvdXMgb3JkZXIgb2YgdGhlIGl0ZW1zIGJlZm9yZSBtb3ZpbmcgdGhlIGl0ZW0gdG8gaXRzIG5ldyBpbmRleC5cbiAgICAvLyBXZSB1c2UgdGhpcyB0byBjaGVjayB3aGV0aGVyIGFuIGl0ZW0gaGFzIGJlZW4gbW92ZWQgYXMgYSByZXN1bHQgb2YgdGhlIHNvcnRpbmcuXG4gICAgY29uc3Qgb2xkT3JkZXIgPSBzaWJsaW5ncy5zbGljZSgpO1xuXG4gICAgLy8gU2h1ZmZsZSB0aGUgYXJyYXkgaW4gcGxhY2UuXG4gICAgbW92ZUl0ZW1JbkFycmF5KHNpYmxpbmdzLCBjdXJyZW50SW5kZXgsIG5ld0luZGV4KTtcblxuICAgIHRoaXMuc29ydGVkLm5leHQoe1xuICAgICAgcHJldmlvdXNJbmRleDogY3VycmVudEluZGV4LFxuICAgICAgY3VycmVudEluZGV4OiBuZXdJbmRleCxcbiAgICAgIGNvbnRhaW5lcjogdGhpcyxcbiAgICAgIGl0ZW1cbiAgICB9KTtcblxuICAgIHNpYmxpbmdzLmZvckVhY2goKHNpYmxpbmcsIGluZGV4KSA9PiB7XG4gICAgICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiB0aGUgcG9zaXRpb24gaGFzbid0IGNoYW5nZWQuXG4gICAgICBpZiAob2xkT3JkZXJbaW5kZXhdID09PSBzaWJsaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgaXNEcmFnZ2VkSXRlbSA9IHNpYmxpbmcuZHJhZyA9PT0gaXRlbTtcbiAgICAgIGNvbnN0IG9mZnNldCA9IGlzRHJhZ2dlZEl0ZW0gPyBpdGVtT2Zmc2V0IDogc2libGluZ09mZnNldDtcbiAgICAgIGNvbnN0IGVsZW1lbnRUb09mZnNldCA9IGlzRHJhZ2dlZEl0ZW0gPyBpdGVtLmdldFBsYWNlaG9sZGVyRWxlbWVudCgpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWJsaW5nLmRyYWcuZ2V0Um9vdEVsZW1lbnQoKTtcblxuICAgICAgLy8gVXBkYXRlIHRoZSBvZmZzZXQgdG8gcmVmbGVjdCB0aGUgbmV3IHBvc2l0aW9uLlxuICAgICAgc2libGluZy5vZmZzZXQgKz0gb2Zmc2V0O1xuXG4gICAgICAvLyBTaW5jZSB3ZSdyZSBtb3ZpbmcgdGhlIGl0ZW1zIHdpdGggYSBgdHJhbnNmb3JtYCwgd2UgbmVlZCB0byBhZGp1c3QgdGhlaXIgY2FjaGVkXG4gICAgICAvLyBjbGllbnQgcmVjdHMgdG8gcmVmbGVjdCB0aGVpciBuZXcgcG9zaXRpb24sIGFzIHdlbGwgYXMgc3dhcCB0aGVpciBwb3NpdGlvbnMgaW4gdGhlIGNhY2hlLlxuICAgICAgLy8gTm90ZSB0aGF0IHdlIHNob3VsZG4ndCB1c2UgYGdldEJvdW5kaW5nQ2xpZW50UmVjdGAgaGVyZSB0byB1cGRhdGUgdGhlIGNhY2hlLCBiZWNhdXNlIHRoZVxuICAgICAgLy8gZWxlbWVudHMgbWF5IGJlIG1pZC1hbmltYXRpb24gd2hpY2ggd2lsbCBnaXZlIHVzIGEgd3JvbmcgcmVzdWx0LlxuICAgICAgaWYgKGlzSG9yaXpvbnRhbCkge1xuICAgICAgICAvLyBSb3VuZCB0aGUgdHJhbnNmb3JtcyBzaW5jZSBzb21lIGJyb3dzZXJzIHdpbGxcbiAgICAgICAgLy8gYmx1ciB0aGUgZWxlbWVudHMsIGZvciBzdWItcGl4ZWwgdHJhbnNmb3Jtcy5cbiAgICAgICAgZWxlbWVudFRvT2Zmc2V0LnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGUzZCgke01hdGgucm91bmQoc2libGluZy5vZmZzZXQpfXB4LCAwLCAwKWA7XG4gICAgICAgIGFkanVzdENsaWVudFJlY3Qoc2libGluZy5jbGllbnRSZWN0LCAwLCBvZmZzZXQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWxlbWVudFRvT2Zmc2V0LnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGUzZCgwLCAke01hdGgucm91bmQoc2libGluZy5vZmZzZXQpfXB4LCAwKWA7XG4gICAgICAgIGFkanVzdENsaWVudFJlY3Qoc2libGluZy5jbGllbnRSZWN0LCBvZmZzZXQsIDApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSB1c2VyJ3MgcG9pbnRlciBpcyBjbG9zZSB0byB0aGUgZWRnZXMgb2YgZWl0aGVyIHRoZVxuICAgKiB2aWV3cG9ydCBvciB0aGUgZHJvcCBsaXN0IGFuZCBzdGFydHMgdGhlIGF1dG8tc2Nyb2xsIHNlcXVlbmNlLlxuICAgKiBAcGFyYW0gcG9pbnRlclggVXNlcidzIHBvaW50ZXIgcG9zaXRpb24gYWxvbmcgdGhlIHggYXhpcy5cbiAgICogQHBhcmFtIHBvaW50ZXJZIFVzZXIncyBwb2ludGVyIHBvc2l0aW9uIGFsb25nIHRoZSB5IGF4aXMuXG4gICAqL1xuICBfc3RhcnRTY3JvbGxpbmdJZk5lY2Vzc2FyeShwb2ludGVyWDogbnVtYmVyLCBwb2ludGVyWTogbnVtYmVyKSB7XG4gICAgaWYgKHRoaXMuYXV0b1Njcm9sbERpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IHNjcm9sbE5vZGU6IEhUTUxFbGVtZW50IHwgV2luZG93IHwgdW5kZWZpbmVkO1xuICAgIGxldCB2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5OT05FO1xuICAgIGxldCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTk9ORTtcblxuICAgIC8vIENoZWNrIHdoZXRoZXIgd2Ugc2hvdWxkIHN0YXJ0IHNjcm9sbGluZyB0aGUgY29udGFpbmVyLlxuICAgIGlmICh0aGlzLl9pc1BvaW50ZXJOZWFyRHJvcENvbnRhaW5lcihwb2ludGVyWCwgcG9pbnRlclkpKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpO1xuXG4gICAgICBbdmVydGljYWxTY3JvbGxEaXJlY3Rpb24sIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb25dID1cbiAgICAgICAgICBnZXRFbGVtZW50U2Nyb2xsRGlyZWN0aW9ucyhlbGVtZW50LCB0aGlzLl9jbGllbnRSZWN0LCBwb2ludGVyWCwgcG9pbnRlclkpO1xuXG4gICAgICBpZiAodmVydGljYWxTY3JvbGxEaXJlY3Rpb24gfHwgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbikge1xuICAgICAgICBzY3JvbGxOb2RlID0gZWxlbWVudDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBPdGhlcndpc2UgY2hlY2sgaWYgd2UgY2FuIHN0YXJ0IHNjcm9sbGluZyB0aGUgdmlld3BvcnQuXG4gICAgaWYgKCF2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiAmJiAhaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbikge1xuICAgICAgY29uc3Qge3dpZHRoLCBoZWlnaHR9ID0gdGhpcy5fdmlld3BvcnRSdWxlci5nZXRWaWV3cG9ydFNpemUoKTtcbiAgICAgIGNvbnN0IGNsaWVudFJlY3QgPSB7d2lkdGgsIGhlaWdodCwgdG9wOiAwLCByaWdodDogd2lkdGgsIGJvdHRvbTogaGVpZ2h0LCBsZWZ0OiAwfTtcbiAgICAgIHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gZ2V0VmVydGljYWxTY3JvbGxEaXJlY3Rpb24oY2xpZW50UmVjdCwgcG9pbnRlclkpO1xuICAgICAgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IGdldEhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24oY2xpZW50UmVjdCwgcG9pbnRlclgpO1xuICAgICAgc2Nyb2xsTm9kZSA9IHdpbmRvdztcbiAgICB9XG5cbiAgICBpZiAoc2Nyb2xsTm9kZSAmJiAodmVydGljYWxTY3JvbGxEaXJlY3Rpb24gIT09IHRoaXMuX3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uIHx8XG4gICAgICAgIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gIT09IHRoaXMuX2hvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gfHxcbiAgICAgICAgc2Nyb2xsTm9kZSAhPT0gdGhpcy5fc2Nyb2xsTm9kZSkpIHtcbiAgICAgIHRoaXMuX3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gdmVydGljYWxTY3JvbGxEaXJlY3Rpb247XG4gICAgICB0aGlzLl9ob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbjtcbiAgICAgIHRoaXMuX3Njcm9sbE5vZGUgPSBzY3JvbGxOb2RlO1xuXG4gICAgICBpZiAoKHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uIHx8IGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24pICYmIHNjcm9sbE5vZGUpIHtcbiAgICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKHRoaXMuX3N0YXJ0U2Nyb2xsSW50ZXJ2YWwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fc3RvcFNjcm9sbGluZygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBTdG9wcyBhbnkgY3VycmVudGx5LXJ1bm5pbmcgYXV0by1zY3JvbGwgc2VxdWVuY2VzLiAqL1xuICBfc3RvcFNjcm9sbGluZygpIHtcbiAgICB0aGlzLl9zdG9wU2Nyb2xsVGltZXJzLm5leHQoKTtcbiAgfVxuXG4gIC8qKiBDYWNoZXMgdGhlIHBvc2l0aW9uIG9mIHRoZSBkcm9wIGxpc3QuICovXG4gIHByaXZhdGUgX2NhY2hlT3duUG9zaXRpb24oKSB7XG4gICAgY29uc3QgZWxlbWVudCA9IGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KTtcbiAgICB0aGlzLl9jbGllbnRSZWN0ID0gZ2V0TXV0YWJsZUNsaWVudFJlY3QoZWxlbWVudCk7XG4gICAgdGhpcy5fc2Nyb2xsUG9zaXRpb24gPSB7dG9wOiBlbGVtZW50LnNjcm9sbFRvcCwgbGVmdDogZWxlbWVudC5zY3JvbGxMZWZ0fTtcbiAgfVxuXG4gIC8qKiBSZWZyZXNoZXMgdGhlIHBvc2l0aW9uIGNhY2hlIG9mIHRoZSBpdGVtcyBhbmQgc2libGluZyBjb250YWluZXJzLiAqL1xuICBwcml2YXRlIF9jYWNoZUl0ZW1Qb3NpdGlvbnMoKSB7XG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gdGhpcy5fb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJztcblxuICAgIHRoaXMuX2l0ZW1Qb3NpdGlvbnMgPSB0aGlzLl9hY3RpdmVEcmFnZ2FibGVzLm1hcChkcmFnID0+IHtcbiAgICAgIGNvbnN0IGVsZW1lbnRUb01lYXN1cmUgPSB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LmlzRHJhZ2dpbmcoZHJhZykgP1xuICAgICAgICAgIC8vIElmIHRoZSBlbGVtZW50IGlzIGJlaW5nIGRyYWdnZWQsIHdlIGhhdmUgdG8gbWVhc3VyZSB0aGVcbiAgICAgICAgICAvLyBwbGFjZWhvbGRlciwgYmVjYXVzZSB0aGUgZWxlbWVudCBpcyBoaWRkZW4uXG4gICAgICAgICAgZHJhZy5nZXRQbGFjZWhvbGRlckVsZW1lbnQoKSA6XG4gICAgICAgICAgZHJhZy5nZXRSb290RWxlbWVudCgpO1xuICAgICAgcmV0dXJuIHtkcmFnLCBvZmZzZXQ6IDAsIGNsaWVudFJlY3Q6IGdldE11dGFibGVDbGllbnRSZWN0KGVsZW1lbnRUb01lYXN1cmUpfTtcbiAgICB9KS5zb3J0KChhLCBiKSA9PiB7XG4gICAgICByZXR1cm4gaXNIb3Jpem9udGFsID8gYS5jbGllbnRSZWN0LmxlZnQgLSBiLmNsaWVudFJlY3QubGVmdCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYS5jbGllbnRSZWN0LnRvcCAtIGIuY2xpZW50UmVjdC50b3A7XG4gICAgfSk7XG4gIH1cblxuICAvKiogUmVzZXRzIHRoZSBjb250YWluZXIgdG8gaXRzIGluaXRpYWwgc3RhdGUuICovXG4gIHByaXZhdGUgX3Jlc2V0KCkge1xuICAgIHRoaXMuX2lzRHJhZ2dpbmcgPSBmYWxzZTtcblxuICAgIC8vIFRPRE8oY3Jpc2JldG8pOiBtYXkgaGF2ZSB0byB3YWl0IGZvciB0aGUgYW5pbWF0aW9ucyB0byBmaW5pc2guXG4gICAgdGhpcy5fYWN0aXZlRHJhZ2dhYmxlcy5mb3JFYWNoKGl0ZW0gPT4gaXRlbS5nZXRSb290RWxlbWVudCgpLnN0eWxlLnRyYW5zZm9ybSA9ICcnKTtcbiAgICB0aGlzLl9zaWJsaW5ncy5mb3JFYWNoKHNpYmxpbmcgPT4gc2libGluZy5fc3RvcFJlY2VpdmluZyh0aGlzKSk7XG4gICAgdGhpcy5fYWN0aXZlRHJhZ2dhYmxlcyA9IFtdO1xuICAgIHRoaXMuX2l0ZW1Qb3NpdGlvbnMgPSBbXTtcbiAgICB0aGlzLl9wcmV2aW91c1N3YXAuZHJhZyA9IG51bGw7XG4gICAgdGhpcy5fcHJldmlvdXNTd2FwLmRlbHRhID0gMDtcbiAgICB0aGlzLl9zdG9wU2Nyb2xsaW5nKCk7XG4gICAgdGhpcy5fcmVtb3ZlTGlzdGVuZXJzKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgb2Zmc2V0IGluIHBpeGVscyBieSB3aGljaCB0aGUgaXRlbXMgdGhhdCBhcmVuJ3QgYmVpbmcgZHJhZ2dlZCBzaG91bGQgYmUgbW92ZWQuXG4gICAqIEBwYXJhbSBjdXJyZW50SW5kZXggSW5kZXggb2YgdGhlIGl0ZW0gY3VycmVudGx5IGJlaW5nIGRyYWdnZWQuXG4gICAqIEBwYXJhbSBzaWJsaW5ncyBBbGwgb2YgdGhlIGl0ZW1zIGluIHRoZSBsaXN0LlxuICAgKiBAcGFyYW0gZGVsdGEgRGlyZWN0aW9uIGluIHdoaWNoIHRoZSB1c2VyIGlzIG1vdmluZy5cbiAgICovXG4gIHByaXZhdGUgX2dldFNpYmxpbmdPZmZzZXRQeChjdXJyZW50SW5kZXg6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpYmxpbmdzOiBDYWNoZWRJdGVtUG9zaXRpb25bXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhOiAxIHwgLTEpIHtcblxuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCc7XG4gICAgY29uc3QgY3VycmVudFBvc2l0aW9uID0gc2libGluZ3NbY3VycmVudEluZGV4XS5jbGllbnRSZWN0O1xuICAgIGNvbnN0IGltbWVkaWF0ZVNpYmxpbmcgPSBzaWJsaW5nc1tjdXJyZW50SW5kZXggKyBkZWx0YSAqIC0xXTtcbiAgICBsZXQgc2libGluZ09mZnNldCA9IGN1cnJlbnRQb3NpdGlvbltpc0hvcml6b250YWwgPyAnd2lkdGgnIDogJ2hlaWdodCddICogZGVsdGE7XG5cbiAgICBpZiAoaW1tZWRpYXRlU2libGluZykge1xuICAgICAgY29uc3Qgc3RhcnQgPSBpc0hvcml6b250YWwgPyAnbGVmdCcgOiAndG9wJztcbiAgICAgIGNvbnN0IGVuZCA9IGlzSG9yaXpvbnRhbCA/ICdyaWdodCcgOiAnYm90dG9tJztcblxuICAgICAgLy8gR2V0IHRoZSBzcGFjaW5nIGJldHdlZW4gdGhlIHN0YXJ0IG9mIHRoZSBjdXJyZW50IGl0ZW0gYW5kIHRoZSBlbmQgb2YgdGhlIG9uZSBpbW1lZGlhdGVseVxuICAgICAgLy8gYWZ0ZXIgaXQgaW4gdGhlIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgdXNlciBpcyBkcmFnZ2luZywgb3IgdmljZSB2ZXJzYS4gV2UgYWRkIGl0IHRvIHRoZVxuICAgICAgLy8gb2Zmc2V0IGluIG9yZGVyIHRvIHB1c2ggdGhlIGVsZW1lbnQgdG8gd2hlcmUgaXQgd2lsbCBiZSB3aGVuIGl0J3MgaW5saW5lIGFuZCBpcyBpbmZsdWVuY2VkXG4gICAgICAvLyBieSB0aGUgYG1hcmdpbmAgb2YgaXRzIHNpYmxpbmdzLlxuICAgICAgaWYgKGRlbHRhID09PSAtMSkge1xuICAgICAgICBzaWJsaW5nT2Zmc2V0IC09IGltbWVkaWF0ZVNpYmxpbmcuY2xpZW50UmVjdFtzdGFydF0gLSBjdXJyZW50UG9zaXRpb25bZW5kXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNpYmxpbmdPZmZzZXQgKz0gY3VycmVudFBvc2l0aW9uW3N0YXJ0XSAtIGltbWVkaWF0ZVNpYmxpbmcuY2xpZW50UmVjdFtlbmRdO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzaWJsaW5nT2Zmc2V0O1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSBwb2ludGVyIGNvb3JkaW5hdGVzIGFyZSBjbG9zZSB0byB0aGUgZHJvcCBjb250YWluZXIuXG4gICAqIEBwYXJhbSBwb2ludGVyWCBDb29yZGluYXRlcyBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0gcG9pbnRlclkgQ29vcmRpbmF0ZXMgYWxvbmcgdGhlIFkgYXhpcy5cbiAgICovXG4gIHByaXZhdGUgX2lzUG9pbnRlck5lYXJEcm9wQ29udGFpbmVyKHBvaW50ZXJYOiBudW1iZXIsIHBvaW50ZXJZOiBudW1iZXIpOiBib29sZWFuIHtcbiAgICBjb25zdCB7dG9wLCByaWdodCwgYm90dG9tLCBsZWZ0LCB3aWR0aCwgaGVpZ2h0fSA9IHRoaXMuX2NsaWVudFJlY3Q7XG4gICAgY29uc3QgeFRocmVzaG9sZCA9IHdpZHRoICogRFJPUF9QUk9YSU1JVFlfVEhSRVNIT0xEO1xuICAgIGNvbnN0IHlUaHJlc2hvbGQgPSBoZWlnaHQgKiBEUk9QX1BST1hJTUlUWV9USFJFU0hPTEQ7XG5cbiAgICByZXR1cm4gcG9pbnRlclkgPiB0b3AgLSB5VGhyZXNob2xkICYmIHBvaW50ZXJZIDwgYm90dG9tICsgeVRocmVzaG9sZCAmJlxuICAgICAgICAgICBwb2ludGVyWCA+IGxlZnQgLSB4VGhyZXNob2xkICYmIHBvaW50ZXJYIDwgcmlnaHQgKyB4VGhyZXNob2xkO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG9mZnNldCBpbiBwaXhlbHMgYnkgd2hpY2ggdGhlIGl0ZW0gdGhhdCBpcyBiZWluZyBkcmFnZ2VkIHNob3VsZCBiZSBtb3ZlZC5cbiAgICogQHBhcmFtIGN1cnJlbnRQb3NpdGlvbiBDdXJyZW50IHBvc2l0aW9uIG9mIHRoZSBpdGVtLlxuICAgKiBAcGFyYW0gbmV3UG9zaXRpb24gUG9zaXRpb24gb2YgdGhlIGl0ZW0gd2hlcmUgdGhlIGN1cnJlbnQgaXRlbSBzaG91bGQgYmUgbW92ZWQuXG4gICAqIEBwYXJhbSBkZWx0YSBEaXJlY3Rpb24gaW4gd2hpY2ggdGhlIHVzZXIgaXMgbW92aW5nLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0SXRlbU9mZnNldFB4KGN1cnJlbnRQb3NpdGlvbjogQ2xpZW50UmVjdCwgbmV3UG9zaXRpb246IENsaWVudFJlY3QsIGRlbHRhOiAxIHwgLTEpIHtcbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuICAgIGxldCBpdGVtT2Zmc2V0ID0gaXNIb3Jpem9udGFsID8gbmV3UG9zaXRpb24ubGVmdCAtIGN1cnJlbnRQb3NpdGlvbi5sZWZ0IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1Bvc2l0aW9uLnRvcCAtIGN1cnJlbnRQb3NpdGlvbi50b3A7XG5cbiAgICAvLyBBY2NvdW50IGZvciBkaWZmZXJlbmNlcyBpbiB0aGUgaXRlbSB3aWR0aC9oZWlnaHQuXG4gICAgaWYgKGRlbHRhID09PSAtMSkge1xuICAgICAgaXRlbU9mZnNldCArPSBpc0hvcml6b250YWwgPyBuZXdQb3NpdGlvbi53aWR0aCAtIGN1cnJlbnRQb3NpdGlvbi53aWR0aCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1Bvc2l0aW9uLmhlaWdodCAtIGN1cnJlbnRQb3NpdGlvbi5oZWlnaHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIGl0ZW1PZmZzZXQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW5kZXggb2YgYW4gaXRlbSBpbiB0aGUgZHJvcCBjb250YWluZXIsIGJhc2VkIG9uIHRoZSBwb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdGhhdCBpcyBiZWluZyBzb3J0ZWQuXG4gICAqIEBwYXJhbSBwb2ludGVyWCBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHBvaW50ZXJZIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgWSBheGlzLlxuICAgKiBAcGFyYW0gZGVsdGEgRGlyZWN0aW9uIGluIHdoaWNoIHRoZSB1c2VyIGlzIG1vdmluZyB0aGVpciBwb2ludGVyLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0SXRlbUluZGV4RnJvbVBvaW50ZXJQb3NpdGlvbihpdGVtOiBEcmFnUmVmLCBwb2ludGVyWDogbnVtYmVyLCBwb2ludGVyWTogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhPzoge3g6IG51bWJlciwgeTogbnVtYmVyfSkge1xuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCc7XG5cbiAgICByZXR1cm4gZmluZEluZGV4KHRoaXMuX2l0ZW1Qb3NpdGlvbnMsICh7ZHJhZywgY2xpZW50UmVjdH0sIF8sIGFycmF5KSA9PiB7XG4gICAgICBpZiAoZHJhZyA9PT0gaXRlbSkge1xuICAgICAgICAvLyBJZiB0aGVyZSdzIG9ubHkgb25lIGl0ZW0gbGVmdCBpbiB0aGUgY29udGFpbmVyLCBpdCBtdXN0IGJlXG4gICAgICAgIC8vIHRoZSBkcmFnZ2VkIGl0ZW0gaXRzZWxmIHNvIHdlIHVzZSBpdCBhcyBhIHJlZmVyZW5jZS5cbiAgICAgICAgcmV0dXJuIGFycmF5Lmxlbmd0aCA8IDI7XG4gICAgICB9XG5cbiAgICAgIGlmIChkZWx0YSkge1xuICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSBpc0hvcml6b250YWwgPyBkZWx0YS54IDogZGVsdGEueTtcblxuICAgICAgICAvLyBJZiB0aGUgdXNlciBpcyBzdGlsbCBob3ZlcmluZyBvdmVyIHRoZSBzYW1lIGl0ZW0gYXMgbGFzdCB0aW1lLCBhbmQgdGhleSBkaWRuJ3QgY2hhbmdlXG4gICAgICAgIC8vIHRoZSBkaXJlY3Rpb24gaW4gd2hpY2ggdGhleSdyZSBkcmFnZ2luZywgd2UgZG9uJ3QgY29uc2lkZXIgaXQgYSBkaXJlY3Rpb24gc3dhcC5cbiAgICAgICAgaWYgKGRyYWcgPT09IHRoaXMuX3ByZXZpb3VzU3dhcC5kcmFnICYmIGRpcmVjdGlvbiA9PT0gdGhpcy5fcHJldmlvdXNTd2FwLmRlbHRhKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBpc0hvcml6b250YWwgP1xuICAgICAgICAgIC8vIFJvdW5kIHRoZXNlIGRvd24gc2luY2UgbW9zdCBicm93c2VycyByZXBvcnQgY2xpZW50IHJlY3RzIHdpdGhcbiAgICAgICAgICAvLyBzdWItcGl4ZWwgcHJlY2lzaW9uLCB3aGVyZWFzIHRoZSBwb2ludGVyIGNvb3JkaW5hdGVzIGFyZSByb3VuZGVkIHRvIHBpeGVscy5cbiAgICAgICAgICBwb2ludGVyWCA+PSBNYXRoLmZsb29yKGNsaWVudFJlY3QubGVmdCkgJiYgcG9pbnRlclggPD0gTWF0aC5mbG9vcihjbGllbnRSZWN0LnJpZ2h0KSA6XG4gICAgICAgICAgcG9pbnRlclkgPj0gTWF0aC5mbG9vcihjbGllbnRSZWN0LnRvcCkgJiYgcG9pbnRlclkgPD0gTWF0aC5mbG9vcihjbGllbnRSZWN0LmJvdHRvbSk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogQ2FjaGVzIHRoZSBjdXJyZW50IGl0ZW1zIGluIHRoZSBsaXN0IGFuZCB0aGVpciBwb3NpdGlvbnMuICovXG4gIHByaXZhdGUgX2NhY2hlSXRlbXMoKTogdm9pZCB7XG4gICAgdGhpcy5fYWN0aXZlRHJhZ2dhYmxlcyA9IHRoaXMuX2RyYWdnYWJsZXMuc2xpY2UoKTtcbiAgICB0aGlzLl9jYWNoZUl0ZW1Qb3NpdGlvbnMoKTtcbiAgICB0aGlzLl9jYWNoZU93blBvc2l0aW9uKCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgaW50ZXJuYWwgc3RhdGUgb2YgdGhlIGNvbnRhaW5lciBhZnRlciBhIHNjcm9sbCBldmVudCBoYXMgaGFwcGVuZWQuXG4gICAqIEBwYXJhbSBzY3JvbGxQb3NpdGlvbiBPYmplY3QgdGhhdCBpcyBrZWVwaW5nIHRyYWNrIG9mIHRoZSBzY3JvbGwgcG9zaXRpb24uXG4gICAqIEBwYXJhbSBuZXdUb3AgTmV3IHRvcCBzY3JvbGwgcG9zaXRpb24uXG4gICAqIEBwYXJhbSBuZXdMZWZ0IE5ldyBsZWZ0IHNjcm9sbCBwb3NpdGlvbi5cbiAgICogQHBhcmFtIGV4dHJhQ2xpZW50UmVjdCBFeHRyYSBgQ2xpZW50UmVjdGAgb2JqZWN0IHRoYXQgc2hvdWxkIGJlIHVwZGF0ZWQsIGluIGFkZGl0aW9uIHRvIHRoZVxuICAgKiAgb25lcyBvZiB0aGUgZHJhZyBpdGVtcy4gVXNlZnVsIHdoZW4gdGhlIHZpZXdwb3J0IGhhcyBiZWVuIHNjcm9sbGVkIGFuZCB3ZSBhbHNvIG5lZWQgdG8gdXBkYXRlXG4gICAqICB0aGUgYENsaWVudFJlY3RgIG9mIHRoZSBsaXN0LlxuICAgKi9cbiAgcHJpdmF0ZSBfdXBkYXRlQWZ0ZXJTY3JvbGwoc2Nyb2xsUG9zaXRpb246IFNjcm9sbFBvc2l0aW9uLCBuZXdUb3A6IG51bWJlciwgbmV3TGVmdDogbnVtYmVyLFxuICAgIGV4dHJhQ2xpZW50UmVjdD86IENsaWVudFJlY3QpIHtcbiAgICBjb25zdCB0b3BEaWZmZXJlbmNlID0gc2Nyb2xsUG9zaXRpb24udG9wIC0gbmV3VG9wO1xuICAgIGNvbnN0IGxlZnREaWZmZXJlbmNlID0gc2Nyb2xsUG9zaXRpb24ubGVmdCAtIG5ld0xlZnQ7XG5cbiAgICBpZiAoZXh0cmFDbGllbnRSZWN0KSB7XG4gICAgICBhZGp1c3RDbGllbnRSZWN0KGV4dHJhQ2xpZW50UmVjdCwgdG9wRGlmZmVyZW5jZSwgbGVmdERpZmZlcmVuY2UpO1xuICAgIH1cblxuICAgIC8vIFNpbmNlIHdlIGtub3cgdGhlIGFtb3VudCB0aGF0IHRoZSB1c2VyIGhhcyBzY3JvbGxlZCB3ZSBjYW4gc2hpZnQgYWxsIG9mIHRoZSBjbGllbnQgcmVjdGFuZ2xlc1xuICAgIC8vIG91cnNlbHZlcy4gVGhpcyBpcyBjaGVhcGVyIHRoYW4gcmUtbWVhc3VyaW5nIGV2ZXJ5dGhpbmcgYW5kIHdlIGNhbiBhdm9pZCBpbmNvbnNpc3RlbnRcbiAgICAvLyBiZWhhdmlvciB3aGVyZSB3ZSBtaWdodCBiZSBtZWFzdXJpbmcgdGhlIGVsZW1lbnQgYmVmb3JlIGl0cyBwb3NpdGlvbiBoYXMgY2hhbmdlZC5cbiAgICB0aGlzLl9pdGVtUG9zaXRpb25zLmZvckVhY2goKHtjbGllbnRSZWN0fSkgPT4ge1xuICAgICAgYWRqdXN0Q2xpZW50UmVjdChjbGllbnRSZWN0LCB0b3BEaWZmZXJlbmNlLCBsZWZ0RGlmZmVyZW5jZSk7XG4gICAgfSk7XG5cbiAgICAvLyBXZSBuZWVkIHR3byBsb29wcyBmb3IgdGhpcywgYmVjYXVzZSB3ZSB3YW50IGFsbCBvZiB0aGUgY2FjaGVkXG4gICAgLy8gcG9zaXRpb25zIHRvIGJlIHVwLXRvLWRhdGUgYmVmb3JlIHdlIHJlLXNvcnQgdGhlIGl0ZW0uXG4gICAgdGhpcy5faXRlbVBvc2l0aW9ucy5mb3JFYWNoKCh7ZHJhZ30pID0+IHtcbiAgICAgIGlmICh0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LmlzRHJhZ2dpbmcoZHJhZykpIHtcbiAgICAgICAgLy8gV2UgbmVlZCB0byByZS1zb3J0IHRoZSBpdGVtIG1hbnVhbGx5LCBiZWNhdXNlIHRoZSBwb2ludGVyIG1vdmVcbiAgICAgICAgLy8gZXZlbnRzIHdvbid0IGJlIGRpc3BhdGNoZWQgd2hpbGUgdGhlIHVzZXIgaXMgc2Nyb2xsaW5nLlxuICAgICAgICBkcmFnLl9zb3J0RnJvbUxhc3RQb2ludGVyUG9zaXRpb24oKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHNjcm9sbFBvc2l0aW9uLnRvcCA9IG5ld1RvcDtcbiAgICBzY3JvbGxQb3NpdGlvbi5sZWZ0ID0gbmV3TGVmdDtcbiAgfVxuXG4gIC8qKiBIYW5kbGVzIHRoZSBjb250YWluZXIgYmVpbmcgc2Nyb2xsZWQuIEhhcyB0byBiZSBhbiBhcnJvdyBmdW5jdGlvbiB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dC4gKi9cbiAgcHJpdmF0ZSBfaGFuZGxlU2Nyb2xsID0gKCkgPT4ge1xuICAgIGlmICghdGhpcy5pc0RyYWdnaW5nKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBlbGVtZW50ID0gY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpO1xuICAgIHRoaXMuX3VwZGF0ZUFmdGVyU2Nyb2xsKHRoaXMuX3Njcm9sbFBvc2l0aW9uLCBlbGVtZW50LnNjcm9sbFRvcCwgZWxlbWVudC5zY3JvbGxMZWZ0KTtcbiAgfVxuXG4gIC8qKiBSZW1vdmVzIHRoZSBldmVudCBsaXN0ZW5lcnMgYXNzb2NpYXRlZCB3aXRoIHRoaXMgZHJvcCBsaXN0LiAqL1xuICBwcml2YXRlIF9yZW1vdmVMaXN0ZW5lcnMoKSB7XG4gICAgY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHRoaXMuX2hhbmRsZVNjcm9sbCk7XG4gICAgdGhpcy5fdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIC8qKiBTdGFydHMgdGhlIGludGVydmFsIHRoYXQnbGwgYXV0by1zY3JvbGwgdGhlIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3N0YXJ0U2Nyb2xsSW50ZXJ2YWwgPSAoKSA9PiB7XG4gICAgdGhpcy5fc3RvcFNjcm9sbGluZygpO1xuXG4gICAgaW50ZXJ2YWwoMCwgYW5pbWF0aW9uRnJhbWVTY2hlZHVsZXIpXG4gICAgICAucGlwZSh0YWtlVW50aWwodGhpcy5fc3RvcFNjcm9sbFRpbWVycykpXG4gICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMuX3Njcm9sbE5vZGU7XG5cbiAgICAgICAgaWYgKHRoaXMuX3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID09PSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uVVApIHtcbiAgICAgICAgICBpbmNyZW1lbnRWZXJ0aWNhbFNjcm9sbChub2RlLCAtQVVUT19TQ1JPTExfU1RFUCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPT09IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5ET1dOKSB7XG4gICAgICAgICAgaW5jcmVtZW50VmVydGljYWxTY3JvbGwobm9kZSwgQVVUT19TQ1JPTExfU1RFUCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5faG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9PT0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTEVGVCkge1xuICAgICAgICAgIGluY3JlbWVudEhvcml6b250YWxTY3JvbGwobm9kZSwgLUFVVE9fU0NST0xMX1NURVApO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2hvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPT09IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLlJJR0hUKSB7XG4gICAgICAgICAgaW5jcmVtZW50SG9yaXpvbnRhbFNjcm9sbChub2RlLCBBVVRPX1NDUk9MTF9TVEVQKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIHVzZXIncyBwb2ludGVyIGlzIHBvc2l0aW9uZWQgb3ZlciB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0geCBQb2ludGVyIHBvc2l0aW9uIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSB5IFBvaW50ZXIgcG9zaXRpb24gYWxvbmcgdGhlIFkgYXhpcy5cbiAgICovXG4gIF9pc092ZXJDb250YWluZXIoeDogbnVtYmVyLCB5OiBudW1iZXIpOiBib29sZWFuIHtcbiAgICByZXR1cm4gaXNJbnNpZGVDbGllbnRSZWN0KHRoaXMuX2NsaWVudFJlY3QsIHgsIHkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpZ3VyZXMgb3V0IHdoZXRoZXIgYW4gaXRlbSBzaG91bGQgYmUgbW92ZWQgaW50byBhIHNpYmxpbmdcbiAgICogZHJvcCBjb250YWluZXIsIGJhc2VkIG9uIGl0cyBjdXJyZW50IHBvc2l0aW9uLlxuICAgKiBAcGFyYW0gaXRlbSBEcmFnIGl0ZW0gdGhhdCBpcyBiZWluZyBtb3ZlZC5cbiAgICogQHBhcmFtIHggUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHkgUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFkgYXhpcy5cbiAgICovXG4gIF9nZXRTaWJsaW5nQ29udGFpbmVyRnJvbVBvc2l0aW9uKGl0ZW06IERyYWdSZWYsIHg6IG51bWJlciwgeTogbnVtYmVyKTogRHJvcExpc3RSZWYgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9zaWJsaW5ncy5maW5kKHNpYmxpbmcgPT4gc2libGluZy5fY2FuUmVjZWl2ZShpdGVtLCB4LCB5KSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGRyb3AgbGlzdCBjYW4gcmVjZWl2ZSB0aGUgcGFzc2VkLWluIGl0ZW0uXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdGhhdCBpcyBiZWluZyBkcmFnZ2VkIGludG8gdGhlIGxpc3QuXG4gICAqIEBwYXJhbSB4IFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSB5IFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqL1xuICBfY2FuUmVjZWl2ZShpdGVtOiBEcmFnUmVmLCB4OiBudW1iZXIsIHk6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGlmICghaXNJbnNpZGVDbGllbnRSZWN0KHRoaXMuX2NsaWVudFJlY3QsIHgsIHkpIHx8ICF0aGlzLmVudGVyUHJlZGljYXRlKGl0ZW0sIHRoaXMpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgZWxlbWVudEZyb21Qb2ludCA9IHRoaXMuX2dldFNoYWRvd1Jvb3QoKS5lbGVtZW50RnJvbVBvaW50KHgsIHkpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcblxuICAgIC8vIElmIHRoZXJlJ3Mgbm8gZWxlbWVudCBhdCB0aGUgcG9pbnRlciBwb3NpdGlvbiwgdGhlblxuICAgIC8vIHRoZSBjbGllbnQgcmVjdCBpcyBwcm9iYWJseSBzY3JvbGxlZCBvdXQgb2YgdGhlIHZpZXcuXG4gICAgaWYgKCFlbGVtZW50RnJvbVBvaW50KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KTtcblxuICAgIC8vIFRoZSBgQ2xpZW50UmVjdGAsIHRoYXQgd2UncmUgdXNpbmcgdG8gZmluZCB0aGUgY29udGFpbmVyIG92ZXIgd2hpY2ggdGhlIHVzZXIgaXNcbiAgICAvLyBob3ZlcmluZywgZG9lc24ndCBnaXZlIHVzIGFueSBpbmZvcm1hdGlvbiBvbiB3aGV0aGVyIHRoZSBlbGVtZW50IGhhcyBiZWVuIHNjcm9sbGVkXG4gICAgLy8gb3V0IG9mIHRoZSB2aWV3IG9yIHdoZXRoZXIgaXQncyBvdmVybGFwcGluZyB3aXRoIG90aGVyIGNvbnRhaW5lcnMuIFRoaXMgbWVhbnMgdGhhdFxuICAgIC8vIHdlIGNvdWxkIGVuZCB1cCB0cmFuc2ZlcnJpbmcgdGhlIGl0ZW0gaW50byBhIGNvbnRhaW5lciB0aGF0J3MgaW52aXNpYmxlIG9yIGlzIHBvc2l0aW9uZWRcbiAgICAvLyBiZWxvdyBhbm90aGVyIG9uZS4gV2UgdXNlIHRoZSByZXN1bHQgZnJvbSBgZWxlbWVudEZyb21Qb2ludGAgdG8gZ2V0IHRoZSB0b3AtbW9zdCBlbGVtZW50XG4gICAgLy8gYXQgdGhlIHBvaW50ZXIgcG9zaXRpb24gYW5kIHRvIGZpbmQgd2hldGhlciBpdCdzIG9uZSBvZiB0aGUgaW50ZXJzZWN0aW5nIGRyb3AgY29udGFpbmVycy5cbiAgICByZXR1cm4gZWxlbWVudEZyb21Qb2ludCA9PT0gbmF0aXZlRWxlbWVudCB8fCBuYXRpdmVFbGVtZW50LmNvbnRhaW5zKGVsZW1lbnRGcm9tUG9pbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCBieSBvbmUgb2YgdGhlIGNvbm5lY3RlZCBkcm9wIGxpc3RzIHdoZW4gYSBkcmFnZ2luZyBzZXF1ZW5jZSBoYXMgc3RhcnRlZC5cbiAgICogQHBhcmFtIHNpYmxpbmcgU2libGluZyBpbiB3aGljaCBkcmFnZ2luZyBoYXMgc3RhcnRlZC5cbiAgICovXG4gIF9zdGFydFJlY2VpdmluZyhzaWJsaW5nOiBEcm9wTGlzdFJlZikge1xuICAgIGNvbnN0IGFjdGl2ZVNpYmxpbmdzID0gdGhpcy5fYWN0aXZlU2libGluZ3M7XG5cbiAgICBpZiAoIWFjdGl2ZVNpYmxpbmdzLmhhcyhzaWJsaW5nKSkge1xuICAgICAgYWN0aXZlU2libGluZ3MuYWRkKHNpYmxpbmcpO1xuICAgICAgdGhpcy5fY2FjaGVPd25Qb3NpdGlvbigpO1xuICAgICAgdGhpcy5fbGlzdGVuVG9TY3JvbGxFdmVudHMoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIGJ5IGEgY29ubmVjdGVkIGRyb3AgbGlzdCB3aGVuIGRyYWdnaW5nIGhhcyBzdG9wcGVkLlxuICAgKiBAcGFyYW0gc2libGluZyBTaWJsaW5nIHdob3NlIGRyYWdnaW5nIGhhcyBzdG9wcGVkLlxuICAgKi9cbiAgX3N0b3BSZWNlaXZpbmcoc2libGluZzogRHJvcExpc3RSZWYpIHtcbiAgICB0aGlzLl9hY3RpdmVTaWJsaW5ncy5kZWxldGUoc2libGluZyk7XG4gICAgdGhpcy5fdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydHMgbGlzdGVuaW5nIHRvIHNjcm9sbCBldmVudHMgb24gdGhlIHZpZXdwb3J0LlxuICAgKiBVc2VkIGZvciB1cGRhdGluZyB0aGUgaW50ZXJuYWwgc3RhdGUgb2YgdGhlIGxpc3QuXG4gICAqL1xuICBwcml2YXRlIF9saXN0ZW5Ub1Njcm9sbEV2ZW50cygpIHtcbiAgICB0aGlzLl92aWV3cG9ydFNjcm9sbFBvc2l0aW9uID0gdGhpcy5fdmlld3BvcnRSdWxlciEuZ2V0Vmlld3BvcnRTY3JvbGxQb3NpdGlvbigpO1xuICAgIHRoaXMuX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uID0gdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5zY3JvbGwuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmlzRHJhZ2dpbmcoKSkge1xuICAgICAgICBjb25zdCBuZXdQb3NpdGlvbiA9IHRoaXMuX3ZpZXdwb3J0UnVsZXIhLmdldFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24oKTtcbiAgICAgICAgdGhpcy5fdXBkYXRlQWZ0ZXJTY3JvbGwodGhpcy5fdmlld3BvcnRTY3JvbGxQb3NpdGlvbiwgbmV3UG9zaXRpb24udG9wLCBuZXdQb3NpdGlvbi5sZWZ0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jbGllbnRSZWN0KTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5pc1JlY2VpdmluZygpKSB7XG4gICAgICAgIHRoaXMuX2NhY2hlT3duUG9zaXRpb24oKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMYXppbHkgcmVzb2x2ZXMgYW5kIHJldHVybnMgdGhlIHNoYWRvdyByb290IG9mIHRoZSBlbGVtZW50LiBXZSBkbyB0aGlzIGluIGEgZnVuY3Rpb24sIHJhdGhlclxuICAgKiB0aGFuIHNhdmluZyBpdCBpbiBwcm9wZXJ0eSBkaXJlY3RseSBvbiBpbml0LCBiZWNhdXNlIHdlIHdhbnQgdG8gcmVzb2x2ZSBpdCBhcyBsYXRlIGFzIHBvc3NpYmxlXG4gICAqIGluIG9yZGVyIHRvIGVuc3VyZSB0aGF0IHRoZSBlbGVtZW50IGhhcyBiZWVuIG1vdmVkIGludG8gdGhlIHNoYWRvdyBET00uIERvaW5nIGl0IGluc2lkZSB0aGVcbiAgICogY29uc3RydWN0b3IgbWlnaHQgYmUgdG9vIGVhcmx5IGlmIHRoZSBlbGVtZW50IGlzIGluc2lkZSBvZiBzb21ldGhpbmcgbGlrZSBgbmdGb3JgIG9yIGBuZ0lmYC5cbiAgICovXG4gIHByaXZhdGUgX2dldFNoYWRvd1Jvb3QoKTogRG9jdW1lbnRPclNoYWRvd1Jvb3Qge1xuICAgIGlmICghdGhpcy5fY2FjaGVkU2hhZG93Um9vdCkge1xuICAgICAgdGhpcy5fY2FjaGVkU2hhZG93Um9vdCA9IGdldFNoYWRvd1Jvb3QoY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpKSB8fCB0aGlzLl9kb2N1bWVudDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fY2FjaGVkU2hhZG93Um9vdDtcbiAgfVxufVxuXG5cbi8qKlxuICogVXBkYXRlcyB0aGUgdG9wL2xlZnQgcG9zaXRpb25zIG9mIGEgYENsaWVudFJlY3RgLCBhcyB3ZWxsIGFzIHRoZWlyIGJvdHRvbS9yaWdodCBjb3VudGVycGFydHMuXG4gKiBAcGFyYW0gY2xpZW50UmVjdCBgQ2xpZW50UmVjdGAgdGhhdCBzaG91bGQgYmUgdXBkYXRlZC5cbiAqIEBwYXJhbSB0b3AgQW1vdW50IHRvIGFkZCB0byB0aGUgYHRvcGAgcG9zaXRpb24uXG4gKiBAcGFyYW0gbGVmdCBBbW91bnQgdG8gYWRkIHRvIHRoZSBgbGVmdGAgcG9zaXRpb24uXG4gKi9cbmZ1bmN0aW9uIGFkanVzdENsaWVudFJlY3QoY2xpZW50UmVjdDogQ2xpZW50UmVjdCwgdG9wOiBudW1iZXIsIGxlZnQ6IG51bWJlcikge1xuICBjbGllbnRSZWN0LnRvcCArPSB0b3A7XG4gIGNsaWVudFJlY3QuYm90dG9tID0gY2xpZW50UmVjdC50b3AgKyBjbGllbnRSZWN0LmhlaWdodDtcblxuICBjbGllbnRSZWN0LmxlZnQgKz0gbGVmdDtcbiAgY2xpZW50UmVjdC5yaWdodCA9IGNsaWVudFJlY3QubGVmdCArIGNsaWVudFJlY3Qud2lkdGg7XG59XG5cblxuLyoqXG4gKiBGaW5kcyB0aGUgaW5kZXggb2YgYW4gaXRlbSB0aGF0IG1hdGNoZXMgYSBwcmVkaWNhdGUgZnVuY3Rpb24uIFVzZWQgYXMgYW4gZXF1aXZhbGVudFxuICogb2YgYEFycmF5LnByb3RvdHlwZS5maW5kSW5kZXhgIHdoaWNoIGlzbid0IHBhcnQgb2YgdGhlIHN0YW5kYXJkIEdvb2dsZSB0eXBpbmdzLlxuICogQHBhcmFtIGFycmF5IEFycmF5IGluIHdoaWNoIHRvIGxvb2sgZm9yIG1hdGNoZXMuXG4gKiBAcGFyYW0gcHJlZGljYXRlIEZ1bmN0aW9uIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYW4gaXRlbSBpcyBhIG1hdGNoLlxuICovXG5mdW5jdGlvbiBmaW5kSW5kZXg8VD4oYXJyYXk6IFRbXSxcbiAgICAgICAgICAgICAgICAgICAgICBwcmVkaWNhdGU6ICh2YWx1ZTogVCwgaW5kZXg6IG51bWJlciwgb2JqOiBUW10pID0+IGJvb2xlYW4pOiBudW1iZXIge1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAocHJlZGljYXRlKGFycmF5W2ldLCBpLCBhcnJheSkpIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiAtMTtcbn1cblxuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIHNvbWUgY29vcmRpbmF0ZXMgYXJlIHdpdGhpbiBhIGBDbGllbnRSZWN0YC5cbiAqIEBwYXJhbSBjbGllbnRSZWN0IENsaWVudFJlY3QgdGhhdCBpcyBiZWluZyBjaGVja2VkLlxuICogQHBhcmFtIHggQ29vcmRpbmF0ZXMgYWxvbmcgdGhlIFggYXhpcy5cbiAqIEBwYXJhbSB5IENvb3JkaW5hdGVzIGFsb25nIHRoZSBZIGF4aXMuXG4gKi9cbmZ1bmN0aW9uIGlzSW5zaWRlQ2xpZW50UmVjdChjbGllbnRSZWN0OiBDbGllbnRSZWN0LCB4OiBudW1iZXIsIHk6IG51bWJlcikge1xuICBjb25zdCB7dG9wLCBib3R0b20sIGxlZnQsIHJpZ2h0fSA9IGNsaWVudFJlY3Q7XG4gIHJldHVybiB5ID49IHRvcCAmJiB5IDw9IGJvdHRvbSAmJiB4ID49IGxlZnQgJiYgeCA8PSByaWdodDtcbn1cblxuXG4vKiogR2V0cyBhIG11dGFibGUgdmVyc2lvbiBvZiBhbiBlbGVtZW50J3MgYm91bmRpbmcgYENsaWVudFJlY3RgLiAqL1xuZnVuY3Rpb24gZ2V0TXV0YWJsZUNsaWVudFJlY3QoZWxlbWVudDogRWxlbWVudCk6IENsaWVudFJlY3Qge1xuICBjb25zdCBjbGllbnRSZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAvLyBXZSBuZWVkIHRvIGNsb25lIHRoZSBgY2xpZW50UmVjdGAgaGVyZSwgYmVjYXVzZSBhbGwgdGhlIHZhbHVlcyBvbiBpdCBhcmUgcmVhZG9ubHlcbiAgLy8gYW5kIHdlIG5lZWQgdG8gYmUgYWJsZSB0byB1cGRhdGUgdGhlbS4gQWxzbyB3ZSBjYW4ndCB1c2UgYSBzcHJlYWQgaGVyZSwgYmVjYXVzZVxuICAvLyB0aGUgdmFsdWVzIG9uIGEgYENsaWVudFJlY3RgIGFyZW4ndCBvd24gcHJvcGVydGllcy4gU2VlOlxuICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRWxlbWVudC9nZXRCb3VuZGluZ0NsaWVudFJlY3QjTm90ZXNcbiAgcmV0dXJuIHtcbiAgICB0b3A6IGNsaWVudFJlY3QudG9wLFxuICAgIHJpZ2h0OiBjbGllbnRSZWN0LnJpZ2h0LFxuICAgIGJvdHRvbTogY2xpZW50UmVjdC5ib3R0b20sXG4gICAgbGVmdDogY2xpZW50UmVjdC5sZWZ0LFxuICAgIHdpZHRoOiBjbGllbnRSZWN0LndpZHRoLFxuICAgIGhlaWdodDogY2xpZW50UmVjdC5oZWlnaHRcbiAgfTtcbn1cblxuLyoqXG4gKiBJbmNyZW1lbnRzIHRoZSB2ZXJ0aWNhbCBzY3JvbGwgcG9zaXRpb24gb2YgYSBub2RlLlxuICogQHBhcmFtIG5vZGUgTm9kZSB3aG9zZSBzY3JvbGwgcG9zaXRpb24gc2hvdWxkIGNoYW5nZS5cbiAqIEBwYXJhbSBhbW91bnQgQW1vdW50IG9mIHBpeGVscyB0aGF0IHRoZSBgbm9kZWAgc2hvdWxkIGJlIHNjcm9sbGVkLlxuICovXG5mdW5jdGlvbiBpbmNyZW1lbnRWZXJ0aWNhbFNjcm9sbChub2RlOiBIVE1MRWxlbWVudCB8IFdpbmRvdywgYW1vdW50OiBudW1iZXIpIHtcbiAgaWYgKG5vZGUgPT09IHdpbmRvdykge1xuICAgIChub2RlIGFzIFdpbmRvdykuc2Nyb2xsQnkoMCwgYW1vdW50KTtcbiAgfSBlbHNlIHtcbiAgICAvLyBJZGVhbGx5IHdlIGNvdWxkIHVzZSBgRWxlbWVudC5zY3JvbGxCeWAgaGVyZSBhcyB3ZWxsLCBidXQgSUUgYW5kIEVkZ2UgZG9uJ3Qgc3VwcG9ydCBpdC5cbiAgICAobm9kZSBhcyBIVE1MRWxlbWVudCkuc2Nyb2xsVG9wICs9IGFtb3VudDtcbiAgfVxufVxuXG4vKipcbiAqIEluY3JlbWVudHMgdGhlIGhvcml6b250YWwgc2Nyb2xsIHBvc2l0aW9uIG9mIGEgbm9kZS5cbiAqIEBwYXJhbSBub2RlIE5vZGUgd2hvc2Ugc2Nyb2xsIHBvc2l0aW9uIHNob3VsZCBjaGFuZ2UuXG4gKiBAcGFyYW0gYW1vdW50IEFtb3VudCBvZiBwaXhlbHMgdGhhdCB0aGUgYG5vZGVgIHNob3VsZCBiZSBzY3JvbGxlZC5cbiAqL1xuZnVuY3Rpb24gaW5jcmVtZW50SG9yaXpvbnRhbFNjcm9sbChub2RlOiBIVE1MRWxlbWVudCB8IFdpbmRvdywgYW1vdW50OiBudW1iZXIpIHtcbiAgaWYgKG5vZGUgPT09IHdpbmRvdykge1xuICAgIChub2RlIGFzIFdpbmRvdykuc2Nyb2xsQnkoYW1vdW50LCAwKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBJZGVhbGx5IHdlIGNvdWxkIHVzZSBgRWxlbWVudC5zY3JvbGxCeWAgaGVyZSBhcyB3ZWxsLCBidXQgSUUgYW5kIEVkZ2UgZG9uJ3Qgc3VwcG9ydCBpdC5cbiAgICAobm9kZSBhcyBIVE1MRWxlbWVudCkuc2Nyb2xsTGVmdCArPSBhbW91bnQ7XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIHdoZXRoZXIgdGhlIHZlcnRpY2FsIGF1dG8tc2Nyb2xsIGRpcmVjdGlvbiBvZiBhIG5vZGUuXG4gKiBAcGFyYW0gY2xpZW50UmVjdCBEaW1lbnNpb25zIG9mIHRoZSBub2RlLlxuICogQHBhcmFtIHBvaW50ZXJZIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgeSBheGlzLlxuICovXG5mdW5jdGlvbiBnZXRWZXJ0aWNhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0OiBDbGllbnRSZWN0LCBwb2ludGVyWTogbnVtYmVyKSB7XG4gIGNvbnN0IHt0b3AsIGJvdHRvbSwgaGVpZ2h0fSA9IGNsaWVudFJlY3Q7XG4gIGNvbnN0IHlUaHJlc2hvbGQgPSBoZWlnaHQgKiBTQ1JPTExfUFJPWElNSVRZX1RIUkVTSE9MRDtcblxuICBpZiAocG9pbnRlclkgPj0gdG9wIC0geVRocmVzaG9sZCAmJiBwb2ludGVyWSA8PSB0b3AgKyB5VGhyZXNob2xkKSB7XG4gICAgcmV0dXJuIEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5VUDtcbiAgfSBlbHNlIGlmIChwb2ludGVyWSA+PSBib3R0b20gLSB5VGhyZXNob2xkICYmIHBvaW50ZXJZIDw9IGJvdHRvbSArIHlUaHJlc2hvbGQpIHtcbiAgICByZXR1cm4gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLkRPV047XG4gIH1cblxuICByZXR1cm4gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLk5PTkU7XG59XG5cbi8qKlxuICogR2V0cyB3aGV0aGVyIHRoZSBob3Jpem9udGFsIGF1dG8tc2Nyb2xsIGRpcmVjdGlvbiBvZiBhIG5vZGUuXG4gKiBAcGFyYW0gY2xpZW50UmVjdCBEaW1lbnNpb25zIG9mIHRoZSBub2RlLlxuICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgeCBheGlzLlxuICovXG5mdW5jdGlvbiBnZXRIb3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKGNsaWVudFJlY3Q6IENsaWVudFJlY3QsIHBvaW50ZXJYOiBudW1iZXIpIHtcbiAgY29uc3Qge2xlZnQsIHJpZ2h0LCB3aWR0aH0gPSBjbGllbnRSZWN0O1xuICBjb25zdCB4VGhyZXNob2xkID0gd2lkdGggKiBTQ1JPTExfUFJPWElNSVRZX1RIUkVTSE9MRDtcblxuICBpZiAocG9pbnRlclggPj0gbGVmdCAtIHhUaHJlc2hvbGQgJiYgcG9pbnRlclggPD0gbGVmdCArIHhUaHJlc2hvbGQpIHtcbiAgICByZXR1cm4gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTEVGVDtcbiAgfSBlbHNlIGlmIChwb2ludGVyWCA+PSByaWdodCAtIHhUaHJlc2hvbGQgJiYgcG9pbnRlclggPD0gcmlnaHQgKyB4VGhyZXNob2xkKSB7XG4gICAgcmV0dXJuIEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLlJJR0hUO1xuICB9XG5cbiAgcmV0dXJuIEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLk5PTkU7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgZGlyZWN0aW9ucyBpbiB3aGljaCBhbiBlbGVtZW50IG5vZGUgc2hvdWxkIGJlIHNjcm9sbGVkLFxuICogYXNzdW1pbmcgdGhhdCB0aGUgdXNlcidzIHBvaW50ZXIgaXMgYWxyZWFkeSB3aXRoaW4gaXQgc2Nyb2xsYWJsZSByZWdpb24uXG4gKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IGZvciB3aGljaCB3ZSBzaG91bGQgY2FsY3VsYXRlIHRoZSBzY3JvbGwgZGlyZWN0aW9uLlxuICogQHBhcmFtIGNsaWVudFJlY3QgQm91bmRpbmcgY2xpZW50IHJlY3RhbmdsZSBvZiB0aGUgZWxlbWVudC5cbiAqIEBwYXJhbSBwb2ludGVyWCBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIHggYXhpcy5cbiAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIHkgYXhpcy5cbiAqL1xuZnVuY3Rpb24gZ2V0RWxlbWVudFNjcm9sbERpcmVjdGlvbnMoZWxlbWVudDogSFRNTEVsZW1lbnQsIGNsaWVudFJlY3Q6IENsaWVudFJlY3QsIHBvaW50ZXJYOiBudW1iZXIsXG4gIHBvaW50ZXJZOiBudW1iZXIpOiBbQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLCBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbl0ge1xuICBjb25zdCBjb21wdXRlZFZlcnRpY2FsID0gZ2V0VmVydGljYWxTY3JvbGxEaXJlY3Rpb24oY2xpZW50UmVjdCwgcG9pbnRlclkpO1xuICBjb25zdCBjb21wdXRlZEhvcml6b250YWwgPSBnZXRIb3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKGNsaWVudFJlY3QsIHBvaW50ZXJYKTtcbiAgbGV0IHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLk5PTkU7XG4gIGxldCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTk9ORTtcblxuICAvLyBOb3RlIHRoYXQgd2UgaGVyZSB3ZSBkbyBzb21lIGV4dHJhIGNoZWNrcyBmb3Igd2hldGhlciB0aGUgZWxlbWVudCBpcyBhY3R1YWxseSBzY3JvbGxhYmxlIGluXG4gIC8vIGEgY2VydGFpbiBkaXJlY3Rpb24gYW5kIHdlIG9ubHkgYXNzaWduIHRoZSBzY3JvbGwgZGlyZWN0aW9uIGlmIGl0IGlzLiBXZSBkbyB0aGlzIHNvIHRoYXQgd2VcbiAgLy8gY2FuIGFsbG93IG90aGVyIGVsZW1lbnRzIHRvIGJlIHNjcm9sbGVkLCBpZiB0aGUgY3VycmVudCBlbGVtZW50IGNhbid0IGJlIHNjcm9sbGVkIGFueW1vcmUuXG4gIC8vIFRoaXMgYWxsb3dzIHVzIHRvIGhhbmRsZSBjYXNlcyB3aGVyZSB0aGUgc2Nyb2xsIHJlZ2lvbnMgb2YgdHdvIHNjcm9sbGFibGUgZWxlbWVudHMgb3ZlcmxhcC5cbiAgaWYgKGNvbXB1dGVkVmVydGljYWwpIHtcbiAgICBjb25zdCBzY3JvbGxUb3AgPSBlbGVtZW50LnNjcm9sbFRvcDtcblxuICAgIGlmIChjb21wdXRlZFZlcnRpY2FsID09PSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uVVApIHtcbiAgICAgIGlmIChzY3JvbGxUb3AgPiAwKSB7XG4gICAgICAgIHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLlVQO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZWxlbWVudC5zY3JvbGxIZWlnaHQgLSBzY3JvbGxUb3AgPiBlbGVtZW50LmNsaWVudEhlaWdodCkge1xuICAgICAgdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uRE9XTjtcbiAgICB9XG4gIH1cblxuICBpZiAoY29tcHV0ZWRIb3Jpem9udGFsKSB7XG4gICAgY29uc3Qgc2Nyb2xsTGVmdCA9IGVsZW1lbnQuc2Nyb2xsTGVmdDtcblxuICAgIGlmIChjb21wdXRlZEhvcml6b250YWwgPT09IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLkxFRlQpIHtcbiAgICAgIGlmIChzY3JvbGxMZWZ0ID4gMCkge1xuICAgICAgICBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTEVGVDtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGVsZW1lbnQuc2Nyb2xsV2lkdGggLSBzY3JvbGxMZWZ0ID4gZWxlbWVudC5jbGllbnRXaWR0aCkge1xuICAgICAgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLlJJR0hUO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBbdmVydGljYWxTY3JvbGxEaXJlY3Rpb24sIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb25dO1xufVxuXG4vKiogR2V0cyB0aGUgc2hhZG93IHJvb3Qgb2YgYW4gZWxlbWVudCwgaWYgYW55LiAqL1xuZnVuY3Rpb24gZ2V0U2hhZG93Um9vdChlbGVtZW50OiBIVE1MRWxlbWVudCk6IERvY3VtZW50T3JTaGFkb3dSb290IHwgbnVsbCB7XG4gIGlmIChfc3VwcG9ydHNTaGFkb3dEb20oKSkge1xuICAgIGNvbnN0IHJvb3ROb2RlID0gZWxlbWVudC5nZXRSb290Tm9kZSA/IGVsZW1lbnQuZ2V0Um9vdE5vZGUoKSA6IG51bGw7XG5cbiAgICBpZiAocm9vdE5vZGUgaW5zdGFuY2VvZiBTaGFkb3dSb290KSB7XG4gICAgICByZXR1cm4gcm9vdE5vZGU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG4iXX0=