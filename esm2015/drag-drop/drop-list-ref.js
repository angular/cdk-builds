/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/drag-drop/drop-list-ref.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
         * Cached positions of the scrollable parent elements.
         */
        this._parentPositions = new Map();
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
        this.withScrollableParents([this.element]);
        _dragDropRegistry.registerDropContainer(this);
    }
    /**
     * Removes the drop list functionality from the DOM element.
     * @return {?}
     */
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
        this._scrollNode = (/** @type {?} */ (null));
        this._parentPositions.clear();
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
        this.beforeStarted.next();
        this._isDragging = true;
        this._cacheItems();
        this._siblings.forEach((/**
         * @param {?} sibling
         * @return {?}
         */
        sibling => sibling._startReceiving(this)));
        this._viewportScrollSubscription.unsubscribe();
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
     * Sets which parent elements are can be scrolled while the user is dragging.
     * @template THIS
     * @this {THIS}
     * @param {?} elements Elements that can be scrolled.
     * @return {THIS}
     */
    withScrollableParents(elements) {
        /** @type {?} */
        const element = coerceElement((/** @type {?} */ (this)).element);
        // We always allow the current element to be scrollable
        // so we need to ensure that it's in the array.
        (/** @type {?} */ (this))._scrollableElements =
            elements.indexOf(element) === -1 ? [element, ...elements] : elements.slice();
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
        if (this.sortingDisabled || !isPointerNearClientRect(this._clientRect, pointerX, pointerY)) {
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
        // Check whether we should start scrolling any of the parent containers.
        this._parentPositions.forEach((/**
         * @param {?} position
         * @param {?} element
         * @return {?}
         */
        (position, element) => {
            // We have special handling for the `document` below. Also this would be
            // nicer with a  for...of loop, but it requires changing a compiler flag.
            if (element === this._document || !position.clientRect || scrollNode) {
                return;
            }
            if (isPointerNearClientRect(position.clientRect, pointerX, pointerY)) {
                [verticalScrollDirection, horizontalScrollDirection] = getElementScrollDirections((/** @type {?} */ (element)), position.clientRect, pointerX, pointerY);
                if (verticalScrollDirection || horizontalScrollDirection) {
                    scrollNode = (/** @type {?} */ (element));
                }
            }
        }));
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
     * Caches the positions of the configured scrollable parents.
     * @private
     * @return {?}
     */
    _cacheParentPositions() {
        this._parentPositions.clear();
        this._parentPositions.set(this._document, {
            scrollPosition: (/** @type {?} */ (this._viewportRuler)).getViewportScrollPosition(),
        });
        this._scrollableElements.forEach((/**
         * @param {?} element
         * @return {?}
         */
        element => {
            /** @type {?} */
            const clientRect = getMutableClientRect(element);
            // We keep the ClientRect cached in two properties, because it's referenced in a lot of
            // performance-sensitive places and we want to avoid the extra lookups. The `element` is
            // guaranteed to always be in the `_scrollableElements` so this should always match.
            if (element === this.element) {
                this._clientRect = clientRect;
            }
            this._parentPositions.set(element, {
                scrollPosition: { top: element.scrollTop, left: element.scrollLeft },
                clientRect
            });
        }));
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
        this._viewportScrollSubscription.unsubscribe();
        this._parentPositions.clear();
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
        this._cacheParentPositions();
    }
    /**
     * Updates the internal state of the container after a scroll event has happened.
     * @private
     * @param {?} scrolledParent Element that was scrolled.
     * @param {?} newTop New top scroll position.
     * @param {?} newLeft New left scroll position.
     * @return {?}
     */
    _updateAfterScroll(scrolledParent, newTop, newLeft) {
        /** @type {?} */
        const scrollPosition = (/** @type {?} */ (this._parentPositions.get(scrolledParent))).scrollPosition;
        /** @type {?} */
        const topDifference = scrollPosition.top - newTop;
        /** @type {?} */
        const leftDifference = scrollPosition.left - newLeft;
        // Go through and update the cached positions of the scroll
        // parents that are inside the element that was scrolled.
        this._parentPositions.forEach((/**
         * @param {?} position
         * @param {?} node
         * @return {?}
         */
        (position, node) => {
            if (position.clientRect && scrolledParent !== node && scrolledParent.contains(node)) {
                adjustClientRect(position.clientRect, topDifference, leftDifference);
            }
        }));
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
            this._cacheParentPositions();
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
        this._viewportScrollSubscription = this._dragDropRegistry.scroll.subscribe((/**
         * @param {?} event
         * @return {?}
         */
        event => {
            if (this.isDragging()) {
                /** @type {?} */
                const target = (/** @type {?} */ (event.target));
                /** @type {?} */
                const position = this._parentPositions.get(target);
                if (position) {
                    /** @type {?} */
                    let newTop;
                    /** @type {?} */
                    let newLeft;
                    if (target === this._document) {
                        /** @type {?} */
                        const scrollPosition = (/** @type {?} */ (this._viewportRuler)).getViewportScrollPosition();
                        newTop = scrollPosition.top;
                        newLeft = scrollPosition.left;
                    }
                    else {
                        newTop = ((/** @type {?} */ (target))).scrollTop;
                        newLeft = ((/** @type {?} */ (target))).scrollLeft;
                    }
                    this._updateAfterScroll(target, newTop, newLeft);
                }
            }
            else if (this.isReceiving()) {
                this._cacheParentPositions();
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
     * Cached positions of the scrollable parent elements.
     * @type {?}
     * @private
     */
    DropListRef.prototype._parentPositions;
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
     * Elements that can be scrolled while the user is dragging.
     * @type {?}
     * @private
     */
    DropListRef.prototype._scrollableElements;
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
 * Checks whether the pointer coordinates are close to a ClientRect.
 * @param {?} rect ClientRect to check against.
 * @param {?} pointerX Coordinates along the X axis.
 * @param {?} pointerY Coordinates along the Y axis.
 * @return {?}
 */
function isPointerNearClientRect(rect, pointerX, pointerY) {
    const { top, right, bottom, left, width, height } = rect;
    /** @type {?} */
    const xThreshold = width * DROP_PROXIMITY_THRESHOLD;
    /** @type {?} */
    const yThreshold = height * DROP_PROXIMITY_THRESHOLD;
    return pointerY > top - yThreshold && pointerY < bottom + yThreshold &&
        pointerX > left - xThreshold && pointerX < right + xThreshold;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LXJlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2Ryb3AtbGlzdC1yZWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBVUEsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRXBELE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3pELE9BQU8sRUFBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSx1QkFBdUIsRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUM5RSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDekMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGNBQWMsQ0FBQzs7Ozs7O01BUXZDLHdCQUF3QixHQUFHLElBQUk7Ozs7OztNQU0vQiwwQkFBMEIsR0FBRyxJQUFJOzs7Ozs7TUFNakMsZ0JBQWdCLEdBQUcsQ0FBQzs7Ozs7O0FBTTFCLGlDQU9DOzs7Ozs7SUFMQyxrQ0FBYzs7Ozs7SUFFZCx3Q0FBdUI7Ozs7O0lBRXZCLG9DQUFlOzs7Ozs7QUFJakIsNkJBR0M7OztJQUZDLDZCQUFZOztJQUNaLDhCQUFhOzs7QUFJZixNQUFXLDJCQUEyQjtJQUFFLElBQUksR0FBQSxFQUFFLEVBQUUsR0FBQSxFQUFFLElBQUksR0FBQTtFQUFDOztBQUd2RCxNQUFXLDZCQUE2QjtJQUFFLElBQUksR0FBQSxFQUFFLElBQUksR0FBQSxFQUFFLEtBQUssR0FBQTtFQUFDOzs7Ozs7O0FBTzVELHlDQUEyRDs7Ozs7QUFLM0QsTUFBTSxPQUFPLFdBQVc7Ozs7Ozs7O0lBZ0l0QixZQUNFLE9BQThDLEVBQ3RDLGlCQUF5RCxFQUNqRSxTQUFjLEVBQ04sT0FBZSxFQUNmLGNBQTZCO1FBSDdCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBd0M7UUFFekQsWUFBTyxHQUFQLE9BQU8sQ0FB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LENBQUMsV0FBVyxFQUFFO1lBQ2pFLHlCQUF5QixnQkFBc0MsQ0FBQztTQUNqRTtLQUNGO0lBRUQsT0FBTyxDQUFDLHVCQUF1QixFQUFFLHlCQUF5QixDQUFDLENBQUM7QUFDOUQsQ0FBQzs7Ozs7O0FBR0QsU0FBUyxhQUFhLENBQUMsT0FBb0I7SUFDekMsSUFBSSxrQkFBa0IsRUFBRSxFQUFFOztjQUNsQixRQUFRLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJO1FBRW5FLElBQUksUUFBUSxZQUFZLFVBQVUsRUFBRTtZQUNsQyxPQUFPLFFBQVEsQ0FBQztTQUNqQjtLQUNGO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RWxlbWVudFJlZiwgTmdab25lfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7RGlyZWN0aW9ufSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge2NvZXJjZUVsZW1lbnR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge1ZpZXdwb3J0UnVsZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9zY3JvbGxpbmcnO1xuaW1wb3J0IHtfc3VwcG9ydHNTaGFkb3dEb219IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge1N1YmplY3QsIFN1YnNjcmlwdGlvbiwgaW50ZXJ2YWwsIGFuaW1hdGlvbkZyYW1lU2NoZWR1bGVyfSBmcm9tICdyeGpzJztcbmltcG9ydCB7dGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge21vdmVJdGVtSW5BcnJheX0gZnJvbSAnLi9kcmFnLXV0aWxzJztcbmltcG9ydCB7RHJhZ0Ryb3BSZWdpc3RyeX0gZnJvbSAnLi9kcmFnLWRyb3AtcmVnaXN0cnknO1xuaW1wb3J0IHtEcmFnUmVmSW50ZXJuYWwgYXMgRHJhZ1JlZiwgUG9pbnR9IGZyb20gJy4vZHJhZy1yZWYnO1xuXG4vKipcbiAqIFByb3hpbWl0eSwgYXMgYSByYXRpbyB0byB3aWR0aC9oZWlnaHQsIGF0IHdoaWNoIGFcbiAqIGRyYWdnZWQgaXRlbSB3aWxsIGFmZmVjdCB0aGUgZHJvcCBjb250YWluZXIuXG4gKi9cbmNvbnN0IERST1BfUFJPWElNSVRZX1RIUkVTSE9MRCA9IDAuMDU7XG5cbi8qKlxuICogUHJveGltaXR5LCBhcyBhIHJhdGlvIHRvIHdpZHRoL2hlaWdodCBhdCB3aGljaCB0byBzdGFydCBhdXRvLXNjcm9sbGluZyB0aGUgZHJvcCBsaXN0IG9yIHRoZVxuICogdmlld3BvcnQuIFRoZSB2YWx1ZSBjb21lcyBmcm9tIHRyeWluZyBpdCBvdXQgbWFudWFsbHkgdW50aWwgaXQgZmVlbHMgcmlnaHQuXG4gKi9cbmNvbnN0IFNDUk9MTF9QUk9YSU1JVFlfVEhSRVNIT0xEID0gMC4wNTtcblxuLyoqXG4gKiBOdW1iZXIgb2YgcGl4ZWxzIHRvIHNjcm9sbCBmb3IgZWFjaCBmcmFtZSB3aGVuIGF1dG8tc2Nyb2xsaW5nIGFuIGVsZW1lbnQuXG4gKiBUaGUgdmFsdWUgY29tZXMgZnJvbSB0cnlpbmcgaXQgb3V0IG1hbnVhbGx5IHVudGlsIGl0IGZlZWxzIHJpZ2h0LlxuICovXG5jb25zdCBBVVRPX1NDUk9MTF9TVEVQID0gMjtcblxuLyoqXG4gKiBFbnRyeSBpbiB0aGUgcG9zaXRpb24gY2FjaGUgZm9yIGRyYWdnYWJsZSBpdGVtcy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuaW50ZXJmYWNlIENhY2hlZEl0ZW1Qb3NpdGlvbiB7XG4gIC8qKiBJbnN0YW5jZSBvZiB0aGUgZHJhZyBpdGVtLiAqL1xuICBkcmFnOiBEcmFnUmVmO1xuICAvKiogRGltZW5zaW9ucyBvZiB0aGUgaXRlbS4gKi9cbiAgY2xpZW50UmVjdDogQ2xpZW50UmVjdDtcbiAgLyoqIEFtb3VudCBieSB3aGljaCB0aGUgaXRlbSBoYXMgYmVlbiBtb3ZlZCBzaW5jZSBkcmFnZ2luZyBzdGFydGVkLiAqL1xuICBvZmZzZXQ6IG51bWJlcjtcbn1cblxuLyoqIE9iamVjdCBob2xkaW5nIHRoZSBzY3JvbGwgcG9zaXRpb24gb2Ygc29tZXRoaW5nLiAqL1xuaW50ZXJmYWNlIFNjcm9sbFBvc2l0aW9uIHtcbiAgdG9wOiBudW1iZXI7XG4gIGxlZnQ6IG51bWJlcjtcbn1cblxuLyoqIFZlcnRpY2FsIGRpcmVjdGlvbiBpbiB3aGljaCB3ZSBjYW4gYXV0by1zY3JvbGwuICovXG5jb25zdCBlbnVtIEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbiB7Tk9ORSwgVVAsIERPV059XG5cbi8qKiBIb3Jpem9udGFsIGRpcmVjdGlvbiBpbiB3aGljaCB3ZSBjYW4gYXV0by1zY3JvbGwuICovXG5jb25zdCBlbnVtIEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uIHtOT05FLCBMRUZULCBSSUdIVH1cblxuLyoqXG4gKiBJbnRlcm5hbCBjb21waWxlLXRpbWUtb25seSByZXByZXNlbnRhdGlvbiBvZiBhIGBEcm9wTGlzdFJlZmAuXG4gKiBVc2VkIHRvIGF2b2lkIGNpcmN1bGFyIGltcG9ydCBpc3N1ZXMgYmV0d2VlbiB0aGUgYERyb3BMaXN0UmVmYCBhbmQgdGhlIGBEcmFnUmVmYC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEcm9wTGlzdFJlZkludGVybmFsIGV4dGVuZHMgRHJvcExpc3RSZWYge31cblxuLyoqXG4gKiBSZWZlcmVuY2UgdG8gYSBkcm9wIGxpc3QuIFVzZWQgdG8gbWFuaXB1bGF0ZSBvciBkaXNwb3NlIG9mIHRoZSBjb250YWluZXIuXG4gKi9cbmV4cG9ydCBjbGFzcyBEcm9wTGlzdFJlZjxUID0gYW55PiB7XG4gIC8qKiBFbGVtZW50IHRoYXQgdGhlIGRyb3AgbGlzdCBpcyBhdHRhY2hlZCB0by4gKi9cbiAgZWxlbWVudDogSFRNTEVsZW1lbnQgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50PjtcblxuICAvKiogV2hldGhlciBzdGFydGluZyBhIGRyYWdnaW5nIHNlcXVlbmNlIGZyb20gdGhpcyBjb250YWluZXIgaXMgZGlzYWJsZWQuICovXG4gIGRpc2FibGVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgc29ydGluZyBpdGVtcyB3aXRoaW4gdGhlIGxpc3QgaXMgZGlzYWJsZWQuICovXG4gIHNvcnRpbmdEaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBMb2NrcyB0aGUgcG9zaXRpb24gb2YgdGhlIGRyYWdnYWJsZSBlbGVtZW50cyBpbnNpZGUgdGhlIGNvbnRhaW5lciBhbG9uZyB0aGUgc3BlY2lmaWVkIGF4aXMuICovXG4gIGxvY2tBeGlzOiAneCcgfCAneSc7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgYXV0by1zY3JvbGxpbmcgdGhlIHZpZXcgd2hlbiB0aGUgdXNlclxuICAgKiBtb3ZlcyB0aGVpciBwb2ludGVyIGNsb3NlIHRvIHRoZSBlZGdlcyBpcyBkaXNhYmxlZC5cbiAgICovXG4gIGF1dG9TY3JvbGxEaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBGdW5jdGlvbiB0aGF0IGlzIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYW4gaXRlbVxuICAgKiBpcyBhbGxvd2VkIHRvIGJlIG1vdmVkIGludG8gYSBkcm9wIGNvbnRhaW5lci5cbiAgICovXG4gIGVudGVyUHJlZGljYXRlOiAoZHJhZzogRHJhZ1JlZiwgZHJvcDogRHJvcExpc3RSZWYpID0+IGJvb2xlYW4gPSAoKSA9PiB0cnVlO1xuXG4gIC8qKiBFbWl0cyByaWdodCBiZWZvcmUgZHJhZ2dpbmcgaGFzIHN0YXJ0ZWQuICovXG4gIGJlZm9yZVN0YXJ0ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGhhcyBtb3ZlZCBhIG5ldyBkcmFnIGl0ZW0gaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICovXG4gIGVudGVyZWQgPSBuZXcgU3ViamVjdDx7aXRlbTogRHJhZ1JlZiwgY29udGFpbmVyOiBEcm9wTGlzdFJlZiwgY3VycmVudEluZGV4OiBudW1iZXJ9PigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHJlbW92ZXMgYW4gaXRlbSBmcm9tIHRoZSBjb250YWluZXJcbiAgICogYnkgZHJhZ2dpbmcgaXQgaW50byBhbm90aGVyIGNvbnRhaW5lci5cbiAgICovXG4gIGV4aXRlZCA9IG5ldyBTdWJqZWN0PHtpdGVtOiBEcmFnUmVmLCBjb250YWluZXI6IERyb3BMaXN0UmVmfT4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBkcm9wcyBhbiBpdGVtIGluc2lkZSB0aGUgY29udGFpbmVyLiAqL1xuICBkcm9wcGVkID0gbmV3IFN1YmplY3Q8e1xuICAgIGl0ZW06IERyYWdSZWYsXG4gICAgY3VycmVudEluZGV4OiBudW1iZXIsXG4gICAgcHJldmlvdXNJbmRleDogbnVtYmVyLFxuICAgIGNvbnRhaW5lcjogRHJvcExpc3RSZWYsXG4gICAgcHJldmlvdXNDb250YWluZXI6IERyb3BMaXN0UmVmLFxuICAgIGlzUG9pbnRlck92ZXJDb250YWluZXI6IGJvb2xlYW4sXG4gICAgZGlzdGFuY2U6IFBvaW50O1xuICB9PigpO1xuXG4gIC8qKiBFbWl0cyBhcyB0aGUgdXNlciBpcyBzd2FwcGluZyBpdGVtcyB3aGlsZSBhY3RpdmVseSBkcmFnZ2luZy4gKi9cbiAgc29ydGVkID0gbmV3IFN1YmplY3Q8e1xuICAgIHByZXZpb3VzSW5kZXg6IG51bWJlcixcbiAgICBjdXJyZW50SW5kZXg6IG51bWJlcixcbiAgICBjb250YWluZXI6IERyb3BMaXN0UmVmLFxuICAgIGl0ZW06IERyYWdSZWZcbiAgfT4oKTtcblxuICAvKiogQXJiaXRyYXJ5IGRhdGEgdGhhdCBjYW4gYmUgYXR0YWNoZWQgdG8gdGhlIGRyb3AgbGlzdC4gKi9cbiAgZGF0YTogVDtcblxuICAvKiogV2hldGhlciBhbiBpdGVtIGluIHRoZSBsaXN0IGlzIGJlaW5nIGRyYWdnZWQuICovXG4gIHByaXZhdGUgX2lzRHJhZ2dpbmcgPSBmYWxzZTtcblxuICAvKiogQ2FjaGUgb2YgdGhlIGRpbWVuc2lvbnMgb2YgYWxsIHRoZSBpdGVtcyBpbnNpZGUgdGhlIGNvbnRhaW5lci4gKi9cbiAgcHJpdmF0ZSBfaXRlbVBvc2l0aW9uczogQ2FjaGVkSXRlbVBvc2l0aW9uW10gPSBbXTtcblxuICAvKiogQ2FjaGVkIHBvc2l0aW9ucyBvZiB0aGUgc2Nyb2xsYWJsZSBwYXJlbnQgZWxlbWVudHMuICovXG4gIHByaXZhdGUgX3BhcmVudFBvc2l0aW9ucyA9IG5ldyBNYXA8RG9jdW1lbnR8SFRNTEVsZW1lbnQsIHtcbiAgICBzY3JvbGxQb3NpdGlvbjogU2Nyb2xsUG9zaXRpb24sXG4gICAgY2xpZW50UmVjdD86IENsaWVudFJlY3RcbiAgfT4oKTtcblxuICAvKiogQ2FjaGVkIGBDbGllbnRSZWN0YCBvZiB0aGUgZHJvcCBsaXN0LiAqL1xuICBwcml2YXRlIF9jbGllbnRSZWN0OiBDbGllbnRSZWN0O1xuXG4gIC8qKlxuICAgKiBEcmFnZ2FibGUgaXRlbXMgdGhhdCBhcmUgY3VycmVudGx5IGFjdGl2ZSBpbnNpZGUgdGhlIGNvbnRhaW5lci4gSW5jbHVkZXMgdGhlIGl0ZW1zXG4gICAqIGZyb20gYF9kcmFnZ2FibGVzYCwgYXMgd2VsbCBhcyBhbnkgaXRlbXMgdGhhdCBoYXZlIGJlZW4gZHJhZ2dlZCBpbiwgYnV0IGhhdmVuJ3RcbiAgICogYmVlbiBkcm9wcGVkIHlldC5cbiAgICovXG4gIHByaXZhdGUgX2FjdGl2ZURyYWdnYWJsZXM6IERyYWdSZWZbXTtcblxuICAvKipcbiAgICogS2VlcHMgdHJhY2sgb2YgdGhlIGl0ZW0gdGhhdCB3YXMgbGFzdCBzd2FwcGVkIHdpdGggdGhlIGRyYWdnZWQgaXRlbSwgYXNcbiAgICogd2VsbCBhcyB3aGF0IGRpcmVjdGlvbiB0aGUgcG9pbnRlciB3YXMgbW92aW5nIGluIHdoZW4gdGhlIHN3YXAgb2NjdXJlZC5cbiAgICovXG4gIHByaXZhdGUgX3ByZXZpb3VzU3dhcCA9IHtkcmFnOiBudWxsIGFzIERyYWdSZWYgfCBudWxsLCBkZWx0YTogMH07XG5cbiAgLyoqIERyYWdnYWJsZSBpdGVtcyBpbiB0aGUgY29udGFpbmVyLiAqL1xuICBwcml2YXRlIF9kcmFnZ2FibGVzOiBSZWFkb25seUFycmF5PERyYWdSZWY+O1xuXG4gIC8qKiBEcm9wIGxpc3RzIHRoYXQgYXJlIGNvbm5lY3RlZCB0byB0aGUgY3VycmVudCBvbmUuICovXG4gIHByaXZhdGUgX3NpYmxpbmdzOiBSZWFkb25seUFycmF5PERyb3BMaXN0UmVmPiA9IFtdO1xuXG4gIC8qKiBEaXJlY3Rpb24gaW4gd2hpY2ggdGhlIGxpc3QgaXMgb3JpZW50ZWQuICovXG4gIHByaXZhdGUgX29yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcgfCAndmVydGljYWwnID0gJ3ZlcnRpY2FsJztcblxuICAvKiogQ29ubmVjdGVkIHNpYmxpbmdzIHRoYXQgY3VycmVudGx5IGhhdmUgYSBkcmFnZ2VkIGl0ZW0uICovXG4gIHByaXZhdGUgX2FjdGl2ZVNpYmxpbmdzID0gbmV3IFNldDxEcm9wTGlzdFJlZj4oKTtcblxuICAvKiogTGF5b3V0IGRpcmVjdGlvbiBvZiB0aGUgZHJvcCBsaXN0LiAqL1xuICBwcml2YXRlIF9kaXJlY3Rpb246IERpcmVjdGlvbiA9ICdsdHInO1xuXG4gIC8qKiBTdWJzY3JpcHRpb24gdG8gdGhlIHdpbmRvdyBiZWluZyBzY3JvbGxlZC4gKi9cbiAgcHJpdmF0ZSBfdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG5cbiAgLyoqIFZlcnRpY2FsIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgbGlzdCBpcyBjdXJyZW50bHkgc2Nyb2xsaW5nLiAqL1xuICBwcml2YXRlIF92ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5OT05FO1xuXG4gIC8qKiBIb3Jpem9udGFsIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgbGlzdCBpcyBjdXJyZW50bHkgc2Nyb2xsaW5nLiAqL1xuICBwcml2YXRlIF9ob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTk9ORTtcblxuICAvKiogTm9kZSB0aGF0IGlzIGJlaW5nIGF1dG8tc2Nyb2xsZWQuICovXG4gIHByaXZhdGUgX3Njcm9sbE5vZGU6IEhUTUxFbGVtZW50IHwgV2luZG93O1xuXG4gIC8qKiBVc2VkIHRvIHNpZ25hbCB0byB0aGUgY3VycmVudCBhdXRvLXNjcm9sbCBzZXF1ZW5jZSB3aGVuIHRvIHN0b3AuICovXG4gIHByaXZhdGUgX3N0b3BTY3JvbGxUaW1lcnMgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBTaGFkb3cgcm9vdCBvZiB0aGUgY3VycmVudCBlbGVtZW50LiBOZWNlc3NhcnkgZm9yIGBlbGVtZW50RnJvbVBvaW50YCB0byByZXNvbHZlIGNvcnJlY3RseS4gKi9cbiAgcHJpdmF0ZSBfY2FjaGVkU2hhZG93Um9vdDogRG9jdW1lbnRPclNoYWRvd1Jvb3QgfCBudWxsID0gbnVsbDtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSBkb2N1bWVudC4gKi9cbiAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50O1xuXG4gIC8qKiBFbGVtZW50cyB0aGF0IGNhbiBiZSBzY3JvbGxlZCB3aGlsZSB0aGUgdXNlciBpcyBkcmFnZ2luZy4gKi9cbiAgcHJpdmF0ZSBfc2Nyb2xsYWJsZUVsZW1lbnRzOiBIVE1MRWxlbWVudFtdO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+IHwgSFRNTEVsZW1lbnQsXG4gICAgcHJpdmF0ZSBfZHJhZ0Ryb3BSZWdpc3RyeTogRHJhZ0Ryb3BSZWdpc3RyeTxEcmFnUmVmLCBEcm9wTGlzdFJlZj4sXG4gICAgX2RvY3VtZW50OiBhbnksXG4gICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgcHJpdmF0ZSBfdmlld3BvcnRSdWxlcjogVmlld3BvcnRSdWxlcikge1xuICAgIHRoaXMuZWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoZWxlbWVudCk7XG4gICAgdGhpcy5fZG9jdW1lbnQgPSBfZG9jdW1lbnQ7XG4gICAgdGhpcy53aXRoU2Nyb2xsYWJsZVBhcmVudHMoW3RoaXMuZWxlbWVudF0pO1xuICAgIF9kcmFnRHJvcFJlZ2lzdHJ5LnJlZ2lzdGVyRHJvcENvbnRhaW5lcih0aGlzKTtcbiAgfVxuXG4gIC8qKiBSZW1vdmVzIHRoZSBkcm9wIGxpc3QgZnVuY3Rpb25hbGl0eSBmcm9tIHRoZSBET00gZWxlbWVudC4gKi9cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLl9zdG9wU2Nyb2xsaW5nKCk7XG4gICAgdGhpcy5fc3RvcFNjcm9sbFRpbWVycy5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5iZWZvcmVTdGFydGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5lbnRlcmVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5leGl0ZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmRyb3BwZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLnNvcnRlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX2FjdGl2ZVNpYmxpbmdzLmNsZWFyKCk7XG4gICAgdGhpcy5fc2Nyb2xsTm9kZSA9IG51bGwhO1xuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5jbGVhcigpO1xuICAgIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkucmVtb3ZlRHJvcENvbnRhaW5lcih0aGlzKTtcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIGFuIGl0ZW0gZnJvbSB0aGlzIGxpc3QgaXMgY3VycmVudGx5IGJlaW5nIGRyYWdnZWQuICovXG4gIGlzRHJhZ2dpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lzRHJhZ2dpbmc7XG4gIH1cblxuICAvKiogU3RhcnRzIGRyYWdnaW5nIGFuIGl0ZW0uICovXG4gIHN0YXJ0KCk6IHZvaWQge1xuICAgIHRoaXMuYmVmb3JlU3RhcnRlZC5uZXh0KCk7XG4gICAgdGhpcy5faXNEcmFnZ2luZyA9IHRydWU7XG4gICAgdGhpcy5fY2FjaGVJdGVtcygpO1xuICAgIHRoaXMuX3NpYmxpbmdzLmZvckVhY2goc2libGluZyA9PiBzaWJsaW5nLl9zdGFydFJlY2VpdmluZyh0aGlzKSk7XG4gICAgdGhpcy5fdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9saXN0ZW5Ub1Njcm9sbEV2ZW50cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEVtaXRzIGFuIGV2ZW50IHRvIGluZGljYXRlIHRoYXQgdGhlIHVzZXIgbW92ZWQgYW4gaXRlbSBpbnRvIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdGhhdCB3YXMgbW92ZWQgaW50byB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHBvaW50ZXJZIFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqL1xuICBlbnRlcihpdGVtOiBEcmFnUmVmLCBwb2ludGVyWDogbnVtYmVyLCBwb2ludGVyWTogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy5zdGFydCgpO1xuXG4gICAgLy8gSWYgc29ydGluZyBpcyBkaXNhYmxlZCwgd2Ugd2FudCB0aGUgaXRlbSB0byByZXR1cm4gdG8gaXRzIHN0YXJ0aW5nXG4gICAgLy8gcG9zaXRpb24gaWYgdGhlIHVzZXIgaXMgcmV0dXJuaW5nIGl0IHRvIGl0cyBpbml0aWFsIGNvbnRhaW5lci5cbiAgICBsZXQgbmV3SW5kZXggPSB0aGlzLnNvcnRpbmdEaXNhYmxlZCA/IHRoaXMuX2RyYWdnYWJsZXMuaW5kZXhPZihpdGVtKSA6IC0xO1xuXG4gICAgaWYgKG5ld0luZGV4ID09PSAtMSkge1xuICAgICAgLy8gV2UgdXNlIHRoZSBjb29yZGluYXRlcyBvZiB3aGVyZSB0aGUgaXRlbSBlbnRlcmVkIHRoZSBkcm9wXG4gICAgICAvLyB6b25lIHRvIGZpZ3VyZSBvdXQgYXQgd2hpY2ggaW5kZXggaXQgc2hvdWxkIGJlIGluc2VydGVkLlxuICAgICAgbmV3SW5kZXggPSB0aGlzLl9nZXRJdGVtSW5kZXhGcm9tUG9pbnRlclBvc2l0aW9uKGl0ZW0sIHBvaW50ZXJYLCBwb2ludGVyWSk7XG4gICAgfVxuXG4gICAgY29uc3QgYWN0aXZlRHJhZ2dhYmxlcyA9IHRoaXMuX2FjdGl2ZURyYWdnYWJsZXM7XG4gICAgY29uc3QgY3VycmVudEluZGV4ID0gYWN0aXZlRHJhZ2dhYmxlcy5pbmRleE9mKGl0ZW0pO1xuICAgIGNvbnN0IHBsYWNlaG9sZGVyID0gaXRlbS5nZXRQbGFjZWhvbGRlckVsZW1lbnQoKTtcbiAgICBsZXQgbmV3UG9zaXRpb25SZWZlcmVuY2U6IERyYWdSZWYgfCB1bmRlZmluZWQgPSBhY3RpdmVEcmFnZ2FibGVzW25ld0luZGV4XTtcblxuICAgIC8vIElmIHRoZSBpdGVtIGF0IHRoZSBuZXcgcG9zaXRpb24gaXMgdGhlIHNhbWUgYXMgdGhlIGl0ZW0gdGhhdCBpcyBiZWluZyBkcmFnZ2VkLFxuICAgIC8vIGl0IG1lYW5zIHRoYXQgd2UncmUgdHJ5aW5nIHRvIHJlc3RvcmUgdGhlIGl0ZW0gdG8gaXRzIGluaXRpYWwgcG9zaXRpb24uIEluIHRoaXNcbiAgICAvLyBjYXNlIHdlIHNob3VsZCB1c2UgdGhlIG5leHQgaXRlbSBmcm9tIHRoZSBsaXN0IGFzIHRoZSByZWZlcmVuY2UuXG4gICAgaWYgKG5ld1Bvc2l0aW9uUmVmZXJlbmNlID09PSBpdGVtKSB7XG4gICAgICBuZXdQb3NpdGlvblJlZmVyZW5jZSA9IGFjdGl2ZURyYWdnYWJsZXNbbmV3SW5kZXggKyAxXTtcbiAgICB9XG5cbiAgICAvLyBTaW5jZSB0aGUgaXRlbSBtYXkgYmUgaW4gdGhlIGBhY3RpdmVEcmFnZ2FibGVzYCBhbHJlYWR5IChlLmcuIGlmIHRoZSB1c2VyIGRyYWdnZWQgaXRcbiAgICAvLyBpbnRvIGFub3RoZXIgY29udGFpbmVyIGFuZCBiYWNrIGFnYWluKSwgd2UgaGF2ZSB0byBlbnN1cmUgdGhhdCBpdCBpc24ndCBkdXBsaWNhdGVkLlxuICAgIGlmIChjdXJyZW50SW5kZXggPiAtMSkge1xuICAgICAgYWN0aXZlRHJhZ2dhYmxlcy5zcGxpY2UoY3VycmVudEluZGV4LCAxKTtcbiAgICB9XG5cbiAgICAvLyBEb24ndCB1c2UgaXRlbXMgdGhhdCBhcmUgYmVpbmcgZHJhZ2dlZCBhcyBhIHJlZmVyZW5jZSwgYmVjYXVzZVxuICAgIC8vIHRoZWlyIGVsZW1lbnQgaGFzIGJlZW4gbW92ZWQgZG93biB0byB0aGUgYm90dG9tIG9mIHRoZSBib2R5LlxuICAgIGlmIChuZXdQb3NpdGlvblJlZmVyZW5jZSAmJiAhdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5pc0RyYWdnaW5nKG5ld1Bvc2l0aW9uUmVmZXJlbmNlKSkge1xuICAgICAgY29uc3QgZWxlbWVudCA9IG5ld1Bvc2l0aW9uUmVmZXJlbmNlLmdldFJvb3RFbGVtZW50KCk7XG4gICAgICBlbGVtZW50LnBhcmVudEVsZW1lbnQhLmluc2VydEJlZm9yZShwbGFjZWhvbGRlciwgZWxlbWVudCk7XG4gICAgICBhY3RpdmVEcmFnZ2FibGVzLnNwbGljZShuZXdJbmRleCwgMCwgaXRlbSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KS5hcHBlbmRDaGlsZChwbGFjZWhvbGRlcik7XG4gICAgICBhY3RpdmVEcmFnZ2FibGVzLnB1c2goaXRlbSk7XG4gICAgfVxuXG4gICAgLy8gVGhlIHRyYW5zZm9ybSBuZWVkcyB0byBiZSBjbGVhcmVkIHNvIGl0IGRvZXNuJ3QgdGhyb3cgb2ZmIHRoZSBtZWFzdXJlbWVudHMuXG4gICAgcGxhY2Vob2xkZXIuc3R5bGUudHJhbnNmb3JtID0gJyc7XG5cbiAgICAvLyBOb3RlIHRoYXQgdGhlIHBvc2l0aW9ucyB3ZXJlIGFscmVhZHkgY2FjaGVkIHdoZW4gd2UgY2FsbGVkIGBzdGFydGAgYWJvdmUsXG4gICAgLy8gYnV0IHdlIG5lZWQgdG8gcmVmcmVzaCB0aGVtIHNpbmNlIHRoZSBhbW91bnQgb2YgaXRlbXMgaGFzIGNoYW5nZWQuXG4gICAgdGhpcy5fY2FjaGVJdGVtUG9zaXRpb25zKCk7XG4gICAgdGhpcy5lbnRlcmVkLm5leHQoe2l0ZW0sIGNvbnRhaW5lcjogdGhpcywgY3VycmVudEluZGV4OiB0aGlzLmdldEl0ZW1JbmRleChpdGVtKX0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYW4gaXRlbSBmcm9tIHRoZSBjb250YWluZXIgYWZ0ZXIgaXQgd2FzIGRyYWdnZWQgaW50byBhbm90aGVyIGNvbnRhaW5lciBieSB0aGUgdXNlci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB0aGF0IHdhcyBkcmFnZ2VkIG91dC5cbiAgICovXG4gIGV4aXQoaXRlbTogRHJhZ1JlZik6IHZvaWQge1xuICAgIHRoaXMuX3Jlc2V0KCk7XG4gICAgdGhpcy5leGl0ZWQubmV4dCh7aXRlbSwgY29udGFpbmVyOiB0aGlzfSk7XG4gIH1cblxuICAvKipcbiAgICogRHJvcHMgYW4gaXRlbSBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIGJlaW5nIGRyb3BwZWQgaW50byB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gY3VycmVudEluZGV4IEluZGV4IGF0IHdoaWNoIHRoZSBpdGVtIHNob3VsZCBiZSBpbnNlcnRlZC5cbiAgICogQHBhcmFtIHByZXZpb3VzQ29udGFpbmVyIENvbnRhaW5lciBmcm9tIHdoaWNoIHRoZSBpdGVtIGdvdCBkcmFnZ2VkIGluLlxuICAgKiBAcGFyYW0gaXNQb2ludGVyT3ZlckNvbnRhaW5lciBXaGV0aGVyIHRoZSB1c2VyJ3MgcG9pbnRlciB3YXMgb3ZlciB0aGVcbiAgICogICAgY29udGFpbmVyIHdoZW4gdGhlIGl0ZW0gd2FzIGRyb3BwZWQuXG4gICAqIEBwYXJhbSBkaXN0YW5jZSBEaXN0YW5jZSB0aGUgdXNlciBoYXMgZHJhZ2dlZCBzaW5jZSB0aGUgc3RhcnQgb2YgdGhlIGRyYWdnaW5nIHNlcXVlbmNlLlxuICAgKi9cbiAgZHJvcChpdGVtOiBEcmFnUmVmLCBjdXJyZW50SW5kZXg6IG51bWJlciwgcHJldmlvdXNDb250YWluZXI6IERyb3BMaXN0UmVmLFxuICAgIGlzUG9pbnRlck92ZXJDb250YWluZXI6IGJvb2xlYW4sIGRpc3RhbmNlOiBQb2ludCk6IHZvaWQge1xuICAgIHRoaXMuX3Jlc2V0KCk7XG4gICAgdGhpcy5kcm9wcGVkLm5leHQoe1xuICAgICAgaXRlbSxcbiAgICAgIGN1cnJlbnRJbmRleCxcbiAgICAgIHByZXZpb3VzSW5kZXg6IHByZXZpb3VzQ29udGFpbmVyLmdldEl0ZW1JbmRleChpdGVtKSxcbiAgICAgIGNvbnRhaW5lcjogdGhpcyxcbiAgICAgIHByZXZpb3VzQ29udGFpbmVyLFxuICAgICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcixcbiAgICAgIGRpc3RhbmNlXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZHJhZ2dhYmxlIGl0ZW1zIHRoYXQgYXJlIGEgcGFydCBvZiB0aGlzIGxpc3QuXG4gICAqIEBwYXJhbSBpdGVtcyBJdGVtcyB0aGF0IGFyZSBhIHBhcnQgb2YgdGhpcyBsaXN0LlxuICAgKi9cbiAgd2l0aEl0ZW1zKGl0ZW1zOiBEcmFnUmVmW10pOiB0aGlzIHtcbiAgICB0aGlzLl9kcmFnZ2FibGVzID0gaXRlbXM7XG4gICAgaXRlbXMuZm9yRWFjaChpdGVtID0+IGl0ZW0uX3dpdGhEcm9wQ29udGFpbmVyKHRoaXMpKTtcblxuICAgIGlmICh0aGlzLmlzRHJhZ2dpbmcoKSkge1xuICAgICAgdGhpcy5fY2FjaGVJdGVtcygpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFNldHMgdGhlIGxheW91dCBkaXJlY3Rpb24gb2YgdGhlIGRyb3AgbGlzdC4gKi9cbiAgd2l0aERpcmVjdGlvbihkaXJlY3Rpb246IERpcmVjdGlvbik6IHRoaXMge1xuICAgIHRoaXMuX2RpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjb250YWluZXJzIHRoYXQgYXJlIGNvbm5lY3RlZCB0byB0aGlzIG9uZS4gV2hlbiB0d28gb3IgbW9yZSBjb250YWluZXJzIGFyZVxuICAgKiBjb25uZWN0ZWQsIHRoZSB1c2VyIHdpbGwgYmUgYWxsb3dlZCB0byB0cmFuc2ZlciBpdGVtcyBiZXR3ZWVuIHRoZW0uXG4gICAqIEBwYXJhbSBjb25uZWN0ZWRUbyBPdGhlciBjb250YWluZXJzIHRoYXQgdGhlIGN1cnJlbnQgY29udGFpbmVycyBzaG91bGQgYmUgY29ubmVjdGVkIHRvLlxuICAgKi9cbiAgY29ubmVjdGVkVG8oY29ubmVjdGVkVG86IERyb3BMaXN0UmVmW10pOiB0aGlzIHtcbiAgICB0aGlzLl9zaWJsaW5ncyA9IGNvbm5lY3RlZFRvLnNsaWNlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgb3JpZW50YXRpb24gb2YgdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIG9yaWVudGF0aW9uIE5ldyBvcmllbnRhdGlvbiBmb3IgdGhlIGNvbnRhaW5lci5cbiAgICovXG4gIHdpdGhPcmllbnRhdGlvbihvcmllbnRhdGlvbjogJ3ZlcnRpY2FsJyB8ICdob3Jpem9udGFsJyk6IHRoaXMge1xuICAgIHRoaXMuX29yaWVudGF0aW9uID0gb3JpZW50YXRpb247XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB3aGljaCBwYXJlbnQgZWxlbWVudHMgYXJlIGNhbiBiZSBzY3JvbGxlZCB3aGlsZSB0aGUgdXNlciBpcyBkcmFnZ2luZy5cbiAgICogQHBhcmFtIGVsZW1lbnRzIEVsZW1lbnRzIHRoYXQgY2FuIGJlIHNjcm9sbGVkLlxuICAgKi9cbiAgd2l0aFNjcm9sbGFibGVQYXJlbnRzKGVsZW1lbnRzOiBIVE1MRWxlbWVudFtdKTogdGhpcyB7XG4gICAgY29uc3QgZWxlbWVudCA9IGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KTtcblxuICAgIC8vIFdlIGFsd2F5cyBhbGxvdyB0aGUgY3VycmVudCBlbGVtZW50IHRvIGJlIHNjcm9sbGFibGVcbiAgICAvLyBzbyB3ZSBuZWVkIHRvIGVuc3VyZSB0aGF0IGl0J3MgaW4gdGhlIGFycmF5LlxuICAgIHRoaXMuX3Njcm9sbGFibGVFbGVtZW50cyA9XG4gICAgICAgIGVsZW1lbnRzLmluZGV4T2YoZWxlbWVudCkgPT09IC0xID8gW2VsZW1lbnQsIC4uLmVsZW1lbnRzXSA6IGVsZW1lbnRzLnNsaWNlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogRmlndXJlcyBvdXQgdGhlIGluZGV4IG9mIGFuIGl0ZW0gaW4gdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB3aG9zZSBpbmRleCBzaG91bGQgYmUgZGV0ZXJtaW5lZC5cbiAgICovXG4gIGdldEl0ZW1JbmRleChpdGVtOiBEcmFnUmVmKTogbnVtYmVyIHtcbiAgICBpZiAoIXRoaXMuX2lzRHJhZ2dpbmcpIHtcbiAgICAgIHJldHVybiB0aGlzLl9kcmFnZ2FibGVzLmluZGV4T2YoaXRlbSk7XG4gICAgfVxuXG4gICAgLy8gSXRlbXMgYXJlIHNvcnRlZCBhbHdheXMgYnkgdG9wL2xlZnQgaW4gdGhlIGNhY2hlLCBob3dldmVyIHRoZXkgZmxvdyBkaWZmZXJlbnRseSBpbiBSVEwuXG4gICAgLy8gVGhlIHJlc3Qgb2YgdGhlIGxvZ2ljIHN0aWxsIHN0YW5kcyBubyBtYXR0ZXIgd2hhdCBvcmllbnRhdGlvbiB3ZSdyZSBpbiwgaG93ZXZlclxuICAgIC8vIHdlIG5lZWQgdG8gaW52ZXJ0IHRoZSBhcnJheSB3aGVuIGRldGVybWluaW5nIHRoZSBpbmRleC5cbiAgICBjb25zdCBpdGVtcyA9IHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcgJiYgdGhpcy5fZGlyZWN0aW9uID09PSAncnRsJyA/XG4gICAgICAgIHRoaXMuX2l0ZW1Qb3NpdGlvbnMuc2xpY2UoKS5yZXZlcnNlKCkgOiB0aGlzLl9pdGVtUG9zaXRpb25zO1xuXG4gICAgcmV0dXJuIGZpbmRJbmRleChpdGVtcywgY3VycmVudEl0ZW0gPT4gY3VycmVudEl0ZW0uZHJhZyA9PT0gaXRlbSk7XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0aGUgbGlzdCBpcyBhYmxlIHRvIHJlY2VpdmUgdGhlIGl0ZW0gdGhhdFxuICAgKiBpcyBjdXJyZW50bHkgYmVpbmcgZHJhZ2dlZCBpbnNpZGUgYSBjb25uZWN0ZWQgZHJvcCBsaXN0LlxuICAgKi9cbiAgaXNSZWNlaXZpbmcoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2FjdGl2ZVNpYmxpbmdzLnNpemUgPiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIFNvcnRzIGFuIGl0ZW0gaW5zaWRlIHRoZSBjb250YWluZXIgYmFzZWQgb24gaXRzIHBvc2l0aW9uLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRvIGJlIHNvcnRlZC5cbiAgICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKiBAcGFyYW0gcG9pbnRlckRlbHRhIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgcG9pbnRlciBpcyBtb3ZpbmcgYWxvbmcgZWFjaCBheGlzLlxuICAgKi9cbiAgX3NvcnRJdGVtKGl0ZW06IERyYWdSZWYsIHBvaW50ZXJYOiBudW1iZXIsIHBvaW50ZXJZOiBudW1iZXIsXG4gICAgICAgICAgICBwb2ludGVyRGVsdGE6IHt4OiBudW1iZXIsIHk6IG51bWJlcn0pOiB2b2lkIHtcbiAgICAvLyBEb24ndCBzb3J0IHRoZSBpdGVtIGlmIHNvcnRpbmcgaXMgZGlzYWJsZWQgb3IgaXQncyBvdXQgb2YgcmFuZ2UuXG4gICAgaWYgKHRoaXMuc29ydGluZ0Rpc2FibGVkIHx8ICFpc1BvaW50ZXJOZWFyQ2xpZW50UmVjdCh0aGlzLl9jbGllbnRSZWN0LCBwb2ludGVyWCwgcG9pbnRlclkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc2libGluZ3MgPSB0aGlzLl9pdGVtUG9zaXRpb25zO1xuICAgIGNvbnN0IG5ld0luZGV4ID0gdGhpcy5fZ2V0SXRlbUluZGV4RnJvbVBvaW50ZXJQb3NpdGlvbihpdGVtLCBwb2ludGVyWCwgcG9pbnRlclksIHBvaW50ZXJEZWx0YSk7XG5cbiAgICBpZiAobmV3SW5kZXggPT09IC0xICYmIHNpYmxpbmdzLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuICAgIGNvbnN0IGN1cnJlbnRJbmRleCA9IGZpbmRJbmRleChzaWJsaW5ncywgY3VycmVudEl0ZW0gPT4gY3VycmVudEl0ZW0uZHJhZyA9PT0gaXRlbSk7XG4gICAgY29uc3Qgc2libGluZ0F0TmV3UG9zaXRpb24gPSBzaWJsaW5nc1tuZXdJbmRleF07XG4gICAgY29uc3QgY3VycmVudFBvc2l0aW9uID0gc2libGluZ3NbY3VycmVudEluZGV4XS5jbGllbnRSZWN0O1xuICAgIGNvbnN0IG5ld1Bvc2l0aW9uID0gc2libGluZ0F0TmV3UG9zaXRpb24uY2xpZW50UmVjdDtcbiAgICBjb25zdCBkZWx0YSA9IGN1cnJlbnRJbmRleCA+IG5ld0luZGV4ID8gMSA6IC0xO1xuXG4gICAgdGhpcy5fcHJldmlvdXNTd2FwLmRyYWcgPSBzaWJsaW5nQXROZXdQb3NpdGlvbi5kcmFnO1xuICAgIHRoaXMuX3ByZXZpb3VzU3dhcC5kZWx0YSA9IGlzSG9yaXpvbnRhbCA/IHBvaW50ZXJEZWx0YS54IDogcG9pbnRlckRlbHRhLnk7XG5cbiAgICAvLyBIb3cgbWFueSBwaXhlbHMgdGhlIGl0ZW0ncyBwbGFjZWhvbGRlciBzaG91bGQgYmUgb2Zmc2V0LlxuICAgIGNvbnN0IGl0ZW1PZmZzZXQgPSB0aGlzLl9nZXRJdGVtT2Zmc2V0UHgoY3VycmVudFBvc2l0aW9uLCBuZXdQb3NpdGlvbiwgZGVsdGEpO1xuXG4gICAgLy8gSG93IG1hbnkgcGl4ZWxzIGFsbCB0aGUgb3RoZXIgaXRlbXMgc2hvdWxkIGJlIG9mZnNldC5cbiAgICBjb25zdCBzaWJsaW5nT2Zmc2V0ID0gdGhpcy5fZ2V0U2libGluZ09mZnNldFB4KGN1cnJlbnRJbmRleCwgc2libGluZ3MsIGRlbHRhKTtcblxuICAgIC8vIFNhdmUgdGhlIHByZXZpb3VzIG9yZGVyIG9mIHRoZSBpdGVtcyBiZWZvcmUgbW92aW5nIHRoZSBpdGVtIHRvIGl0cyBuZXcgaW5kZXguXG4gICAgLy8gV2UgdXNlIHRoaXMgdG8gY2hlY2sgd2hldGhlciBhbiBpdGVtIGhhcyBiZWVuIG1vdmVkIGFzIGEgcmVzdWx0IG9mIHRoZSBzb3J0aW5nLlxuICAgIGNvbnN0IG9sZE9yZGVyID0gc2libGluZ3Muc2xpY2UoKTtcblxuICAgIC8vIFNodWZmbGUgdGhlIGFycmF5IGluIHBsYWNlLlxuICAgIG1vdmVJdGVtSW5BcnJheShzaWJsaW5ncywgY3VycmVudEluZGV4LCBuZXdJbmRleCk7XG5cbiAgICB0aGlzLnNvcnRlZC5uZXh0KHtcbiAgICAgIHByZXZpb3VzSW5kZXg6IGN1cnJlbnRJbmRleCxcbiAgICAgIGN1cnJlbnRJbmRleDogbmV3SW5kZXgsXG4gICAgICBjb250YWluZXI6IHRoaXMsXG4gICAgICBpdGVtXG4gICAgfSk7XG5cbiAgICBzaWJsaW5ncy5mb3JFYWNoKChzaWJsaW5nLCBpbmRleCkgPT4ge1xuICAgICAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgdGhlIHBvc2l0aW9uIGhhc24ndCBjaGFuZ2VkLlxuICAgICAgaWYgKG9sZE9yZGVyW2luZGV4XSA9PT0gc2libGluZykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGlzRHJhZ2dlZEl0ZW0gPSBzaWJsaW5nLmRyYWcgPT09IGl0ZW07XG4gICAgICBjb25zdCBvZmZzZXQgPSBpc0RyYWdnZWRJdGVtID8gaXRlbU9mZnNldCA6IHNpYmxpbmdPZmZzZXQ7XG4gICAgICBjb25zdCBlbGVtZW50VG9PZmZzZXQgPSBpc0RyYWdnZWRJdGVtID8gaXRlbS5nZXRQbGFjZWhvbGRlckVsZW1lbnQoKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2libGluZy5kcmFnLmdldFJvb3RFbGVtZW50KCk7XG5cbiAgICAgIC8vIFVwZGF0ZSB0aGUgb2Zmc2V0IHRvIHJlZmxlY3QgdGhlIG5ldyBwb3NpdGlvbi5cbiAgICAgIHNpYmxpbmcub2Zmc2V0ICs9IG9mZnNldDtcblxuICAgICAgLy8gU2luY2Ugd2UncmUgbW92aW5nIHRoZSBpdGVtcyB3aXRoIGEgYHRyYW5zZm9ybWAsIHdlIG5lZWQgdG8gYWRqdXN0IHRoZWlyIGNhY2hlZFxuICAgICAgLy8gY2xpZW50IHJlY3RzIHRvIHJlZmxlY3QgdGhlaXIgbmV3IHBvc2l0aW9uLCBhcyB3ZWxsIGFzIHN3YXAgdGhlaXIgcG9zaXRpb25zIGluIHRoZSBjYWNoZS5cbiAgICAgIC8vIE5vdGUgdGhhdCB3ZSBzaG91bGRuJ3QgdXNlIGBnZXRCb3VuZGluZ0NsaWVudFJlY3RgIGhlcmUgdG8gdXBkYXRlIHRoZSBjYWNoZSwgYmVjYXVzZSB0aGVcbiAgICAgIC8vIGVsZW1lbnRzIG1heSBiZSBtaWQtYW5pbWF0aW9uIHdoaWNoIHdpbGwgZ2l2ZSB1cyBhIHdyb25nIHJlc3VsdC5cbiAgICAgIGlmIChpc0hvcml6b250YWwpIHtcbiAgICAgICAgLy8gUm91bmQgdGhlIHRyYW5zZm9ybXMgc2luY2Ugc29tZSBicm93c2VycyB3aWxsXG4gICAgICAgIC8vIGJsdXIgdGhlIGVsZW1lbnRzLCBmb3Igc3ViLXBpeGVsIHRyYW5zZm9ybXMuXG4gICAgICAgIGVsZW1lbnRUb09mZnNldC5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlM2QoJHtNYXRoLnJvdW5kKHNpYmxpbmcub2Zmc2V0KX1weCwgMCwgMClgO1xuICAgICAgICBhZGp1c3RDbGllbnRSZWN0KHNpYmxpbmcuY2xpZW50UmVjdCwgMCwgb2Zmc2V0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsZW1lbnRUb09mZnNldC5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlM2QoMCwgJHtNYXRoLnJvdW5kKHNpYmxpbmcub2Zmc2V0KX1weCwgMClgO1xuICAgICAgICBhZGp1c3RDbGllbnRSZWN0KHNpYmxpbmcuY2xpZW50UmVjdCwgb2Zmc2V0LCAwKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgdXNlcidzIHBvaW50ZXIgaXMgY2xvc2UgdG8gdGhlIGVkZ2VzIG9mIGVpdGhlciB0aGVcbiAgICogdmlld3BvcnQgb3IgdGhlIGRyb3AgbGlzdCBhbmQgc3RhcnRzIHRoZSBhdXRvLXNjcm9sbCBzZXF1ZW5jZS5cbiAgICogQHBhcmFtIHBvaW50ZXJYIFVzZXIncyBwb2ludGVyIHBvc2l0aW9uIGFsb25nIHRoZSB4IGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBVc2VyJ3MgcG9pbnRlciBwb3NpdGlvbiBhbG9uZyB0aGUgeSBheGlzLlxuICAgKi9cbiAgX3N0YXJ0U2Nyb2xsaW5nSWZOZWNlc3NhcnkocG9pbnRlclg6IG51bWJlciwgcG9pbnRlclk6IG51bWJlcikge1xuICAgIGlmICh0aGlzLmF1dG9TY3JvbGxEaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBzY3JvbGxOb2RlOiBIVE1MRWxlbWVudCB8IFdpbmRvdyB8IHVuZGVmaW5lZDtcbiAgICBsZXQgdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uTk9ORTtcbiAgICBsZXQgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLk5PTkU7XG5cbiAgICAvLyBDaGVjayB3aGV0aGVyIHdlIHNob3VsZCBzdGFydCBzY3JvbGxpbmcgYW55IG9mIHRoZSBwYXJlbnQgY29udGFpbmVycy5cbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuZm9yRWFjaCgocG9zaXRpb24sIGVsZW1lbnQpID0+IHtcbiAgICAgIC8vIFdlIGhhdmUgc3BlY2lhbCBoYW5kbGluZyBmb3IgdGhlIGBkb2N1bWVudGAgYmVsb3cuIEFsc28gdGhpcyB3b3VsZCBiZVxuICAgICAgLy8gbmljZXIgd2l0aCBhICBmb3IuLi5vZiBsb29wLCBidXQgaXQgcmVxdWlyZXMgY2hhbmdpbmcgYSBjb21waWxlciBmbGFnLlxuICAgICAgaWYgKGVsZW1lbnQgPT09IHRoaXMuX2RvY3VtZW50IHx8ICFwb3NpdGlvbi5jbGllbnRSZWN0IHx8IHNjcm9sbE5vZGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNQb2ludGVyTmVhckNsaWVudFJlY3QocG9zaXRpb24uY2xpZW50UmVjdCwgcG9pbnRlclgsIHBvaW50ZXJZKSkge1xuICAgICAgICBbdmVydGljYWxTY3JvbGxEaXJlY3Rpb24sIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb25dID0gZ2V0RWxlbWVudFNjcm9sbERpcmVjdGlvbnMoXG4gICAgICAgICAgICBlbGVtZW50IGFzIEhUTUxFbGVtZW50LCBwb3NpdGlvbi5jbGllbnRSZWN0LCBwb2ludGVyWCwgcG9pbnRlclkpO1xuXG4gICAgICAgIGlmICh2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiB8fCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKSB7XG4gICAgICAgICAgc2Nyb2xsTm9kZSA9IGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIE90aGVyd2lzZSBjaGVjayBpZiB3ZSBjYW4gc3RhcnQgc2Nyb2xsaW5nIHRoZSB2aWV3cG9ydC5cbiAgICBpZiAoIXZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uICYmICFob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKSB7XG4gICAgICBjb25zdCB7d2lkdGgsIGhlaWdodH0gPSB0aGlzLl92aWV3cG9ydFJ1bGVyLmdldFZpZXdwb3J0U2l6ZSgpO1xuICAgICAgY29uc3QgY2xpZW50UmVjdCA9IHt3aWR0aCwgaGVpZ2h0LCB0b3A6IDAsIHJpZ2h0OiB3aWR0aCwgYm90dG9tOiBoZWlnaHQsIGxlZnQ6IDB9O1xuICAgICAgdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSBnZXRWZXJ0aWNhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0LCBwb2ludGVyWSk7XG4gICAgICBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gZ2V0SG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0LCBwb2ludGVyWCk7XG4gICAgICBzY3JvbGxOb2RlID0gd2luZG93O1xuICAgIH1cblxuICAgIGlmIChzY3JvbGxOb2RlICYmICh2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiAhPT0gdGhpcy5fdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gfHxcbiAgICAgICAgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiAhPT0gdGhpcy5faG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiB8fFxuICAgICAgICBzY3JvbGxOb2RlICE9PSB0aGlzLl9zY3JvbGxOb2RlKSkge1xuICAgICAgdGhpcy5fdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSB2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbjtcbiAgICAgIHRoaXMuX2hvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uO1xuICAgICAgdGhpcy5fc2Nyb2xsTm9kZSA9IHNjcm9sbE5vZGU7XG5cbiAgICAgIGlmICgodmVydGljYWxTY3JvbGxEaXJlY3Rpb24gfHwgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbikgJiYgc2Nyb2xsTm9kZSkge1xuICAgICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIodGhpcy5fc3RhcnRTY3JvbGxJbnRlcnZhbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9zdG9wU2Nyb2xsaW5nKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIFN0b3BzIGFueSBjdXJyZW50bHktcnVubmluZyBhdXRvLXNjcm9sbCBzZXF1ZW5jZXMuICovXG4gIF9zdG9wU2Nyb2xsaW5nKCkge1xuICAgIHRoaXMuX3N0b3BTY3JvbGxUaW1lcnMubmV4dCgpO1xuICB9XG5cbiAgLyoqIENhY2hlcyB0aGUgcG9zaXRpb25zIG9mIHRoZSBjb25maWd1cmVkIHNjcm9sbGFibGUgcGFyZW50cy4gKi9cbiAgcHJpdmF0ZSBfY2FjaGVQYXJlbnRQb3NpdGlvbnMoKSB7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLmNsZWFyKCk7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLnNldCh0aGlzLl9kb2N1bWVudCwge1xuICAgICAgc2Nyb2xsUG9zaXRpb246IHRoaXMuX3ZpZXdwb3J0UnVsZXIhLmdldFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24oKSxcbiAgICB9KTtcbiAgICB0aGlzLl9zY3JvbGxhYmxlRWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgIGNvbnN0IGNsaWVudFJlY3QgPSBnZXRNdXRhYmxlQ2xpZW50UmVjdChlbGVtZW50KTtcblxuICAgICAgLy8gV2Uga2VlcCB0aGUgQ2xpZW50UmVjdCBjYWNoZWQgaW4gdHdvIHByb3BlcnRpZXMsIGJlY2F1c2UgaXQncyByZWZlcmVuY2VkIGluIGEgbG90IG9mXG4gICAgICAvLyBwZXJmb3JtYW5jZS1zZW5zaXRpdmUgcGxhY2VzIGFuZCB3ZSB3YW50IHRvIGF2b2lkIHRoZSBleHRyYSBsb29rdXBzLiBUaGUgYGVsZW1lbnRgIGlzXG4gICAgICAvLyBndWFyYW50ZWVkIHRvIGFsd2F5cyBiZSBpbiB0aGUgYF9zY3JvbGxhYmxlRWxlbWVudHNgIHNvIHRoaXMgc2hvdWxkIGFsd2F5cyBtYXRjaC5cbiAgICAgIGlmIChlbGVtZW50ID09PSB0aGlzLmVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5fY2xpZW50UmVjdCA9IGNsaWVudFJlY3Q7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5zZXQoZWxlbWVudCwge1xuICAgICAgICBzY3JvbGxQb3NpdGlvbjoge3RvcDogZWxlbWVudC5zY3JvbGxUb3AsIGxlZnQ6IGVsZW1lbnQuc2Nyb2xsTGVmdH0sXG4gICAgICAgIGNsaWVudFJlY3RcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIFJlZnJlc2hlcyB0aGUgcG9zaXRpb24gY2FjaGUgb2YgdGhlIGl0ZW1zIGFuZCBzaWJsaW5nIGNvbnRhaW5lcnMuICovXG4gIHByaXZhdGUgX2NhY2hlSXRlbVBvc2l0aW9ucygpIHtcbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuXG4gICAgdGhpcy5faXRlbVBvc2l0aW9ucyA9IHRoaXMuX2FjdGl2ZURyYWdnYWJsZXMubWFwKGRyYWcgPT4ge1xuICAgICAgY29uc3QgZWxlbWVudFRvTWVhc3VyZSA9IHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuaXNEcmFnZ2luZyhkcmFnKSA/XG4gICAgICAgICAgLy8gSWYgdGhlIGVsZW1lbnQgaXMgYmVpbmcgZHJhZ2dlZCwgd2UgaGF2ZSB0byBtZWFzdXJlIHRoZVxuICAgICAgICAgIC8vIHBsYWNlaG9sZGVyLCBiZWNhdXNlIHRoZSBlbGVtZW50IGlzIGhpZGRlbi5cbiAgICAgICAgICBkcmFnLmdldFBsYWNlaG9sZGVyRWxlbWVudCgpIDpcbiAgICAgICAgICBkcmFnLmdldFJvb3RFbGVtZW50KCk7XG4gICAgICByZXR1cm4ge2RyYWcsIG9mZnNldDogMCwgY2xpZW50UmVjdDogZ2V0TXV0YWJsZUNsaWVudFJlY3QoZWxlbWVudFRvTWVhc3VyZSl9O1xuICAgIH0pLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgIHJldHVybiBpc0hvcml6b250YWwgPyBhLmNsaWVudFJlY3QubGVmdCAtIGIuY2xpZW50UmVjdC5sZWZ0IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhLmNsaWVudFJlY3QudG9wIC0gYi5jbGllbnRSZWN0LnRvcDtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBSZXNldHMgdGhlIGNvbnRhaW5lciB0byBpdHMgaW5pdGlhbCBzdGF0ZS4gKi9cbiAgcHJpdmF0ZSBfcmVzZXQoKSB7XG4gICAgdGhpcy5faXNEcmFnZ2luZyA9IGZhbHNlO1xuXG4gICAgLy8gVE9ETyhjcmlzYmV0byk6IG1heSBoYXZlIHRvIHdhaXQgZm9yIHRoZSBhbmltYXRpb25zIHRvIGZpbmlzaC5cbiAgICB0aGlzLl9hY3RpdmVEcmFnZ2FibGVzLmZvckVhY2goaXRlbSA9PiBpdGVtLmdldFJvb3RFbGVtZW50KCkuc3R5bGUudHJhbnNmb3JtID0gJycpO1xuICAgIHRoaXMuX3NpYmxpbmdzLmZvckVhY2goc2libGluZyA9PiBzaWJsaW5nLl9zdG9wUmVjZWl2aW5nKHRoaXMpKTtcbiAgICB0aGlzLl9hY3RpdmVEcmFnZ2FibGVzID0gW107XG4gICAgdGhpcy5faXRlbVBvc2l0aW9ucyA9IFtdO1xuICAgIHRoaXMuX3ByZXZpb3VzU3dhcC5kcmFnID0gbnVsbDtcbiAgICB0aGlzLl9wcmV2aW91c1N3YXAuZGVsdGEgPSAwO1xuICAgIHRoaXMuX3N0b3BTY3JvbGxpbmcoKTtcbiAgICB0aGlzLl92aWV3cG9ydFNjcm9sbFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5jbGVhcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG9mZnNldCBpbiBwaXhlbHMgYnkgd2hpY2ggdGhlIGl0ZW1zIHRoYXQgYXJlbid0IGJlaW5nIGRyYWdnZWQgc2hvdWxkIGJlIG1vdmVkLlxuICAgKiBAcGFyYW0gY3VycmVudEluZGV4IEluZGV4IG9mIHRoZSBpdGVtIGN1cnJlbnRseSBiZWluZyBkcmFnZ2VkLlxuICAgKiBAcGFyYW0gc2libGluZ3MgQWxsIG9mIHRoZSBpdGVtcyBpbiB0aGUgbGlzdC5cbiAgICogQHBhcmFtIGRlbHRhIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgdXNlciBpcyBtb3ZpbmcuXG4gICAqL1xuICBwcml2YXRlIF9nZXRTaWJsaW5nT2Zmc2V0UHgoY3VycmVudEluZGV4OiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWJsaW5nczogQ2FjaGVkSXRlbVBvc2l0aW9uW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWx0YTogMSB8IC0xKSB7XG5cbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuICAgIGNvbnN0IGN1cnJlbnRQb3NpdGlvbiA9IHNpYmxpbmdzW2N1cnJlbnRJbmRleF0uY2xpZW50UmVjdDtcbiAgICBjb25zdCBpbW1lZGlhdGVTaWJsaW5nID0gc2libGluZ3NbY3VycmVudEluZGV4ICsgZGVsdGEgKiAtMV07XG4gICAgbGV0IHNpYmxpbmdPZmZzZXQgPSBjdXJyZW50UG9zaXRpb25baXNIb3Jpem9udGFsID8gJ3dpZHRoJyA6ICdoZWlnaHQnXSAqIGRlbHRhO1xuXG4gICAgaWYgKGltbWVkaWF0ZVNpYmxpbmcpIHtcbiAgICAgIGNvbnN0IHN0YXJ0ID0gaXNIb3Jpem9udGFsID8gJ2xlZnQnIDogJ3RvcCc7XG4gICAgICBjb25zdCBlbmQgPSBpc0hvcml6b250YWwgPyAncmlnaHQnIDogJ2JvdHRvbSc7XG5cbiAgICAgIC8vIEdldCB0aGUgc3BhY2luZyBiZXR3ZWVuIHRoZSBzdGFydCBvZiB0aGUgY3VycmVudCBpdGVtIGFuZCB0aGUgZW5kIG9mIHRoZSBvbmUgaW1tZWRpYXRlbHlcbiAgICAgIC8vIGFmdGVyIGl0IGluIHRoZSBkaXJlY3Rpb24gaW4gd2hpY2ggdGhlIHVzZXIgaXMgZHJhZ2dpbmcsIG9yIHZpY2UgdmVyc2EuIFdlIGFkZCBpdCB0byB0aGVcbiAgICAgIC8vIG9mZnNldCBpbiBvcmRlciB0byBwdXNoIHRoZSBlbGVtZW50IHRvIHdoZXJlIGl0IHdpbGwgYmUgd2hlbiBpdCdzIGlubGluZSBhbmQgaXMgaW5mbHVlbmNlZFxuICAgICAgLy8gYnkgdGhlIGBtYXJnaW5gIG9mIGl0cyBzaWJsaW5ncy5cbiAgICAgIGlmIChkZWx0YSA9PT0gLTEpIHtcbiAgICAgICAgc2libGluZ09mZnNldCAtPSBpbW1lZGlhdGVTaWJsaW5nLmNsaWVudFJlY3Rbc3RhcnRdIC0gY3VycmVudFBvc2l0aW9uW2VuZF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzaWJsaW5nT2Zmc2V0ICs9IGN1cnJlbnRQb3NpdGlvbltzdGFydF0gLSBpbW1lZGlhdGVTaWJsaW5nLmNsaWVudFJlY3RbZW5kXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2libGluZ09mZnNldDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBvZmZzZXQgaW4gcGl4ZWxzIGJ5IHdoaWNoIHRoZSBpdGVtIHRoYXQgaXMgYmVpbmcgZHJhZ2dlZCBzaG91bGQgYmUgbW92ZWQuXG4gICAqIEBwYXJhbSBjdXJyZW50UG9zaXRpb24gQ3VycmVudCBwb3NpdGlvbiBvZiB0aGUgaXRlbS5cbiAgICogQHBhcmFtIG5ld1Bvc2l0aW9uIFBvc2l0aW9uIG9mIHRoZSBpdGVtIHdoZXJlIHRoZSBjdXJyZW50IGl0ZW0gc2hvdWxkIGJlIG1vdmVkLlxuICAgKiBAcGFyYW0gZGVsdGEgRGlyZWN0aW9uIGluIHdoaWNoIHRoZSB1c2VyIGlzIG1vdmluZy5cbiAgICovXG4gIHByaXZhdGUgX2dldEl0ZW1PZmZzZXRQeChjdXJyZW50UG9zaXRpb246IENsaWVudFJlY3QsIG5ld1Bvc2l0aW9uOiBDbGllbnRSZWN0LCBkZWx0YTogMSB8IC0xKSB7XG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gdGhpcy5fb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJztcbiAgICBsZXQgaXRlbU9mZnNldCA9IGlzSG9yaXpvbnRhbCA/IG5ld1Bvc2l0aW9uLmxlZnQgLSBjdXJyZW50UG9zaXRpb24ubGVmdCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdQb3NpdGlvbi50b3AgLSBjdXJyZW50UG9zaXRpb24udG9wO1xuXG4gICAgLy8gQWNjb3VudCBmb3IgZGlmZmVyZW5jZXMgaW4gdGhlIGl0ZW0gd2lkdGgvaGVpZ2h0LlxuICAgIGlmIChkZWx0YSA9PT0gLTEpIHtcbiAgICAgIGl0ZW1PZmZzZXQgKz0gaXNIb3Jpem9udGFsID8gbmV3UG9zaXRpb24ud2lkdGggLSBjdXJyZW50UG9zaXRpb24ud2lkdGggOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdQb3NpdGlvbi5oZWlnaHQgLSBjdXJyZW50UG9zaXRpb24uaGVpZ2h0O1xuICAgIH1cblxuICAgIHJldHVybiBpdGVtT2Zmc2V0O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGluZGV4IG9mIGFuIGl0ZW0gaW4gdGhlIGRyb3AgY29udGFpbmVyLCBiYXNlZCBvbiB0aGUgcG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRoYXQgaXMgYmVpbmcgc29ydGVkLlxuICAgKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIFkgYXhpcy5cbiAgICogQHBhcmFtIGRlbHRhIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgdXNlciBpcyBtb3ZpbmcgdGhlaXIgcG9pbnRlci5cbiAgICovXG4gIHByaXZhdGUgX2dldEl0ZW1JbmRleEZyb21Qb2ludGVyUG9zaXRpb24oaXRlbTogRHJhZ1JlZiwgcG9pbnRlclg6IG51bWJlciwgcG9pbnRlclk6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWx0YT86IHt4OiBudW1iZXIsIHk6IG51bWJlcn0pIHtcbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuXG4gICAgcmV0dXJuIGZpbmRJbmRleCh0aGlzLl9pdGVtUG9zaXRpb25zLCAoe2RyYWcsIGNsaWVudFJlY3R9LCBfLCBhcnJheSkgPT4ge1xuICAgICAgaWYgKGRyYWcgPT09IGl0ZW0pIHtcbiAgICAgICAgLy8gSWYgdGhlcmUncyBvbmx5IG9uZSBpdGVtIGxlZnQgaW4gdGhlIGNvbnRhaW5lciwgaXQgbXVzdCBiZVxuICAgICAgICAvLyB0aGUgZHJhZ2dlZCBpdGVtIGl0c2VsZiBzbyB3ZSB1c2UgaXQgYXMgYSByZWZlcmVuY2UuXG4gICAgICAgIHJldHVybiBhcnJheS5sZW5ndGggPCAyO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGVsdGEpIHtcbiAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gaXNIb3Jpem9udGFsID8gZGVsdGEueCA6IGRlbHRhLnk7XG5cbiAgICAgICAgLy8gSWYgdGhlIHVzZXIgaXMgc3RpbGwgaG92ZXJpbmcgb3ZlciB0aGUgc2FtZSBpdGVtIGFzIGxhc3QgdGltZSwgYW5kIHRoZXkgZGlkbid0IGNoYW5nZVxuICAgICAgICAvLyB0aGUgZGlyZWN0aW9uIGluIHdoaWNoIHRoZXkncmUgZHJhZ2dpbmcsIHdlIGRvbid0IGNvbnNpZGVyIGl0IGEgZGlyZWN0aW9uIHN3YXAuXG4gICAgICAgIGlmIChkcmFnID09PSB0aGlzLl9wcmV2aW91c1N3YXAuZHJhZyAmJiBkaXJlY3Rpb24gPT09IHRoaXMuX3ByZXZpb3VzU3dhcC5kZWx0YSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gaXNIb3Jpem9udGFsID9cbiAgICAgICAgICAvLyBSb3VuZCB0aGVzZSBkb3duIHNpbmNlIG1vc3QgYnJvd3NlcnMgcmVwb3J0IGNsaWVudCByZWN0cyB3aXRoXG4gICAgICAgICAgLy8gc3ViLXBpeGVsIHByZWNpc2lvbiwgd2hlcmVhcyB0aGUgcG9pbnRlciBjb29yZGluYXRlcyBhcmUgcm91bmRlZCB0byBwaXhlbHMuXG4gICAgICAgICAgcG9pbnRlclggPj0gTWF0aC5mbG9vcihjbGllbnRSZWN0LmxlZnQpICYmIHBvaW50ZXJYIDw9IE1hdGguZmxvb3IoY2xpZW50UmVjdC5yaWdodCkgOlxuICAgICAgICAgIHBvaW50ZXJZID49IE1hdGguZmxvb3IoY2xpZW50UmVjdC50b3ApICYmIHBvaW50ZXJZIDw9IE1hdGguZmxvb3IoY2xpZW50UmVjdC5ib3R0b20pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIENhY2hlcyB0aGUgY3VycmVudCBpdGVtcyBpbiB0aGUgbGlzdCBhbmQgdGhlaXIgcG9zaXRpb25zLiAqL1xuICBwcml2YXRlIF9jYWNoZUl0ZW1zKCk6IHZvaWQge1xuICAgIHRoaXMuX2FjdGl2ZURyYWdnYWJsZXMgPSB0aGlzLl9kcmFnZ2FibGVzLnNsaWNlKCk7XG4gICAgdGhpcy5fY2FjaGVJdGVtUG9zaXRpb25zKCk7XG4gICAgdGhpcy5fY2FjaGVQYXJlbnRQb3NpdGlvbnMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBpbnRlcm5hbCBzdGF0ZSBvZiB0aGUgY29udGFpbmVyIGFmdGVyIGEgc2Nyb2xsIGV2ZW50IGhhcyBoYXBwZW5lZC5cbiAgICogQHBhcmFtIHNjcm9sbGVkUGFyZW50IEVsZW1lbnQgdGhhdCB3YXMgc2Nyb2xsZWQuXG4gICAqIEBwYXJhbSBuZXdUb3AgTmV3IHRvcCBzY3JvbGwgcG9zaXRpb24uXG4gICAqIEBwYXJhbSBuZXdMZWZ0IE5ldyBsZWZ0IHNjcm9sbCBwb3NpdGlvbi5cbiAgICovXG4gIHByaXZhdGUgX3VwZGF0ZUFmdGVyU2Nyb2xsKHNjcm9sbGVkUGFyZW50OiBIVE1MRWxlbWVudCB8IERvY3VtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdUb3A6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3TGVmdDogbnVtYmVyKSB7XG4gICAgY29uc3Qgc2Nyb2xsUG9zaXRpb24gPSB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuZ2V0KHNjcm9sbGVkUGFyZW50KSEuc2Nyb2xsUG9zaXRpb247XG4gICAgY29uc3QgdG9wRGlmZmVyZW5jZSA9IHNjcm9sbFBvc2l0aW9uLnRvcCAtIG5ld1RvcDtcbiAgICBjb25zdCBsZWZ0RGlmZmVyZW5jZSA9IHNjcm9sbFBvc2l0aW9uLmxlZnQgLSBuZXdMZWZ0O1xuXG4gICAgLy8gR28gdGhyb3VnaCBhbmQgdXBkYXRlIHRoZSBjYWNoZWQgcG9zaXRpb25zIG9mIHRoZSBzY3JvbGxcbiAgICAvLyBwYXJlbnRzIHRoYXQgYXJlIGluc2lkZSB0aGUgZWxlbWVudCB0aGF0IHdhcyBzY3JvbGxlZC5cbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuZm9yRWFjaCgocG9zaXRpb24sIG5vZGUpID0+IHtcbiAgICAgIGlmIChwb3NpdGlvbi5jbGllbnRSZWN0ICYmIHNjcm9sbGVkUGFyZW50ICE9PSBub2RlICYmIHNjcm9sbGVkUGFyZW50LmNvbnRhaW5zKG5vZGUpKSB7XG4gICAgICAgIGFkanVzdENsaWVudFJlY3QocG9zaXRpb24uY2xpZW50UmVjdCwgdG9wRGlmZmVyZW5jZSwgbGVmdERpZmZlcmVuY2UpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gU2luY2Ugd2Uga25vdyB0aGUgYW1vdW50IHRoYXQgdGhlIHVzZXIgaGFzIHNjcm9sbGVkIHdlIGNhbiBzaGlmdCBhbGwgb2YgdGhlIGNsaWVudCByZWN0YW5nbGVzXG4gICAgLy8gb3Vyc2VsdmVzLiBUaGlzIGlzIGNoZWFwZXIgdGhhbiByZS1tZWFzdXJpbmcgZXZlcnl0aGluZyBhbmQgd2UgY2FuIGF2b2lkIGluY29uc2lzdGVudFxuICAgIC8vIGJlaGF2aW9yIHdoZXJlIHdlIG1pZ2h0IGJlIG1lYXN1cmluZyB0aGUgZWxlbWVudCBiZWZvcmUgaXRzIHBvc2l0aW9uIGhhcyBjaGFuZ2VkLlxuICAgIHRoaXMuX2l0ZW1Qb3NpdGlvbnMuZm9yRWFjaCgoe2NsaWVudFJlY3R9KSA9PiB7XG4gICAgICBhZGp1c3RDbGllbnRSZWN0KGNsaWVudFJlY3QsIHRvcERpZmZlcmVuY2UsIGxlZnREaWZmZXJlbmNlKTtcbiAgICB9KTtcblxuICAgIC8vIFdlIG5lZWQgdHdvIGxvb3BzIGZvciB0aGlzLCBiZWNhdXNlIHdlIHdhbnQgYWxsIG9mIHRoZSBjYWNoZWRcbiAgICAvLyBwb3NpdGlvbnMgdG8gYmUgdXAtdG8tZGF0ZSBiZWZvcmUgd2UgcmUtc29ydCB0aGUgaXRlbS5cbiAgICB0aGlzLl9pdGVtUG9zaXRpb25zLmZvckVhY2goKHtkcmFnfSkgPT4ge1xuICAgICAgaWYgKHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuaXNEcmFnZ2luZyhkcmFnKSkge1xuICAgICAgICAvLyBXZSBuZWVkIHRvIHJlLXNvcnQgdGhlIGl0ZW0gbWFudWFsbHksIGJlY2F1c2UgdGhlIHBvaW50ZXIgbW92ZVxuICAgICAgICAvLyBldmVudHMgd29uJ3QgYmUgZGlzcGF0Y2hlZCB3aGlsZSB0aGUgdXNlciBpcyBzY3JvbGxpbmcuXG4gICAgICAgIGRyYWcuX3NvcnRGcm9tTGFzdFBvaW50ZXJQb3NpdGlvbigpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgc2Nyb2xsUG9zaXRpb24udG9wID0gbmV3VG9wO1xuICAgIHNjcm9sbFBvc2l0aW9uLmxlZnQgPSBuZXdMZWZ0O1xuICB9XG5cbiAgLyoqIFN0YXJ0cyB0aGUgaW50ZXJ2YWwgdGhhdCdsbCBhdXRvLXNjcm9sbCB0aGUgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfc3RhcnRTY3JvbGxJbnRlcnZhbCA9ICgpID0+IHtcbiAgICB0aGlzLl9zdG9wU2Nyb2xsaW5nKCk7XG5cbiAgICBpbnRlcnZhbCgwLCBhbmltYXRpb25GcmFtZVNjaGVkdWxlcilcbiAgICAgIC5waXBlKHRha2VVbnRpbCh0aGlzLl9zdG9wU2Nyb2xsVGltZXJzKSlcbiAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICBjb25zdCBub2RlID0gdGhpcy5fc2Nyb2xsTm9kZTtcblxuICAgICAgICBpZiAodGhpcy5fdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPT09IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5VUCkge1xuICAgICAgICAgIGluY3JlbWVudFZlcnRpY2FsU2Nyb2xsKG5vZGUsIC1BVVRPX1NDUk9MTF9TVEVQKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl92ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9PT0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLkRPV04pIHtcbiAgICAgICAgICBpbmNyZW1lbnRWZXJ0aWNhbFNjcm9sbChub2RlLCBBVVRPX1NDUk9MTF9TVEVQKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9ob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID09PSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5MRUZUKSB7XG4gICAgICAgICAgaW5jcmVtZW50SG9yaXpvbnRhbFNjcm9sbChub2RlLCAtQVVUT19TQ1JPTExfU1RFUCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5faG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9PT0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uUklHSFQpIHtcbiAgICAgICAgICBpbmNyZW1lbnRIb3Jpem9udGFsU2Nyb2xsKG5vZGUsIEFVVE9fU0NST0xMX1NURVApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgdXNlcidzIHBvaW50ZXIgaXMgcG9zaXRpb25lZCBvdmVyIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSB4IFBvaW50ZXIgcG9zaXRpb24gYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHkgUG9pbnRlciBwb3NpdGlvbiBhbG9uZyB0aGUgWSBheGlzLlxuICAgKi9cbiAgX2lzT3ZlckNvbnRhaW5lcih4OiBudW1iZXIsIHk6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIHJldHVybiBpc0luc2lkZUNsaWVudFJlY3QodGhpcy5fY2xpZW50UmVjdCwgeCwgeSk7XG4gIH1cblxuICAvKipcbiAgICogRmlndXJlcyBvdXQgd2hldGhlciBhbiBpdGVtIHNob3VsZCBiZSBtb3ZlZCBpbnRvIGEgc2libGluZ1xuICAgKiBkcm9wIGNvbnRhaW5lciwgYmFzZWQgb24gaXRzIGN1cnJlbnQgcG9zaXRpb24uXG4gICAqIEBwYXJhbSBpdGVtIERyYWcgaXRlbSB0aGF0IGlzIGJlaW5nIG1vdmVkLlxuICAgKiBAcGFyYW0geCBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0geSBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKi9cbiAgX2dldFNpYmxpbmdDb250YWluZXJGcm9tUG9zaXRpb24oaXRlbTogRHJhZ1JlZiwgeDogbnVtYmVyLCB5OiBudW1iZXIpOiBEcm9wTGlzdFJlZiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX3NpYmxpbmdzLmZpbmQoc2libGluZyA9PiBzaWJsaW5nLl9jYW5SZWNlaXZlKGl0ZW0sIHgsIHkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgZHJvcCBsaXN0IGNhbiByZWNlaXZlIHRoZSBwYXNzZWQtaW4gaXRlbS5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB0aGF0IGlzIGJlaW5nIGRyYWdnZWQgaW50byB0aGUgbGlzdC5cbiAgICogQHBhcmFtIHggUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHkgUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFkgYXhpcy5cbiAgICovXG4gIF9jYW5SZWNlaXZlKGl0ZW06IERyYWdSZWYsIHg6IG51bWJlciwgeTogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgaWYgKCFpc0luc2lkZUNsaWVudFJlY3QodGhpcy5fY2xpZW50UmVjdCwgeCwgeSkgfHwgIXRoaXMuZW50ZXJQcmVkaWNhdGUoaXRlbSwgdGhpcykpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBlbGVtZW50RnJvbVBvaW50ID0gdGhpcy5fZ2V0U2hhZG93Um9vdCgpLmVsZW1lbnRGcm9tUG9pbnQoeCwgeSkgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuXG4gICAgLy8gSWYgdGhlcmUncyBubyBlbGVtZW50IGF0IHRoZSBwb2ludGVyIHBvc2l0aW9uLCB0aGVuXG4gICAgLy8gdGhlIGNsaWVudCByZWN0IGlzIHByb2JhYmx5IHNjcm9sbGVkIG91dCBvZiB0aGUgdmlldy5cbiAgICBpZiAoIWVsZW1lbnRGcm9tUG9pbnQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpO1xuXG4gICAgLy8gVGhlIGBDbGllbnRSZWN0YCwgdGhhdCB3ZSdyZSB1c2luZyB0byBmaW5kIHRoZSBjb250YWluZXIgb3ZlciB3aGljaCB0aGUgdXNlciBpc1xuICAgIC8vIGhvdmVyaW5nLCBkb2Vzbid0IGdpdmUgdXMgYW55IGluZm9ybWF0aW9uIG9uIHdoZXRoZXIgdGhlIGVsZW1lbnQgaGFzIGJlZW4gc2Nyb2xsZWRcbiAgICAvLyBvdXQgb2YgdGhlIHZpZXcgb3Igd2hldGhlciBpdCdzIG92ZXJsYXBwaW5nIHdpdGggb3RoZXIgY29udGFpbmVycy4gVGhpcyBtZWFucyB0aGF0XG4gICAgLy8gd2UgY291bGQgZW5kIHVwIHRyYW5zZmVycmluZyB0aGUgaXRlbSBpbnRvIGEgY29udGFpbmVyIHRoYXQncyBpbnZpc2libGUgb3IgaXMgcG9zaXRpb25lZFxuICAgIC8vIGJlbG93IGFub3RoZXIgb25lLiBXZSB1c2UgdGhlIHJlc3VsdCBmcm9tIGBlbGVtZW50RnJvbVBvaW50YCB0byBnZXQgdGhlIHRvcC1tb3N0IGVsZW1lbnRcbiAgICAvLyBhdCB0aGUgcG9pbnRlciBwb3NpdGlvbiBhbmQgdG8gZmluZCB3aGV0aGVyIGl0J3Mgb25lIG9mIHRoZSBpbnRlcnNlY3RpbmcgZHJvcCBjb250YWluZXJzLlxuICAgIHJldHVybiBlbGVtZW50RnJvbVBvaW50ID09PSBuYXRpdmVFbGVtZW50IHx8IG5hdGl2ZUVsZW1lbnQuY29udGFpbnMoZWxlbWVudEZyb21Qb2ludCk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIGJ5IG9uZSBvZiB0aGUgY29ubmVjdGVkIGRyb3AgbGlzdHMgd2hlbiBhIGRyYWdnaW5nIHNlcXVlbmNlIGhhcyBzdGFydGVkLlxuICAgKiBAcGFyYW0gc2libGluZyBTaWJsaW5nIGluIHdoaWNoIGRyYWdnaW5nIGhhcyBzdGFydGVkLlxuICAgKi9cbiAgX3N0YXJ0UmVjZWl2aW5nKHNpYmxpbmc6IERyb3BMaXN0UmVmKSB7XG4gICAgY29uc3QgYWN0aXZlU2libGluZ3MgPSB0aGlzLl9hY3RpdmVTaWJsaW5ncztcblxuICAgIGlmICghYWN0aXZlU2libGluZ3MuaGFzKHNpYmxpbmcpKSB7XG4gICAgICBhY3RpdmVTaWJsaW5ncy5hZGQoc2libGluZyk7XG4gICAgICB0aGlzLl9jYWNoZVBhcmVudFBvc2l0aW9ucygpO1xuICAgICAgdGhpcy5fbGlzdGVuVG9TY3JvbGxFdmVudHMoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIGJ5IGEgY29ubmVjdGVkIGRyb3AgbGlzdCB3aGVuIGRyYWdnaW5nIGhhcyBzdG9wcGVkLlxuICAgKiBAcGFyYW0gc2libGluZyBTaWJsaW5nIHdob3NlIGRyYWdnaW5nIGhhcyBzdG9wcGVkLlxuICAgKi9cbiAgX3N0b3BSZWNlaXZpbmcoc2libGluZzogRHJvcExpc3RSZWYpIHtcbiAgICB0aGlzLl9hY3RpdmVTaWJsaW5ncy5kZWxldGUoc2libGluZyk7XG4gICAgdGhpcy5fdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydHMgbGlzdGVuaW5nIHRvIHNjcm9sbCBldmVudHMgb24gdGhlIHZpZXdwb3J0LlxuICAgKiBVc2VkIGZvciB1cGRhdGluZyB0aGUgaW50ZXJuYWwgc3RhdGUgb2YgdGhlIGxpc3QuXG4gICAqL1xuICBwcml2YXRlIF9saXN0ZW5Ub1Njcm9sbEV2ZW50cygpIHtcbiAgICB0aGlzLl92aWV3cG9ydFNjcm9sbFN1YnNjcmlwdGlvbiA9IHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuc2Nyb2xsLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICBpZiAodGhpcy5pc0RyYWdnaW5nKCkpIHtcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50IHwgRG9jdW1lbnQ7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5fcGFyZW50UG9zaXRpb25zLmdldCh0YXJnZXQpO1xuXG4gICAgICAgIGlmIChwb3NpdGlvbikge1xuICAgICAgICAgIGxldCBuZXdUb3A6IG51bWJlcjtcbiAgICAgICAgICBsZXQgbmV3TGVmdDogbnVtYmVyO1xuXG4gICAgICAgICAgaWYgKHRhcmdldCA9PT0gdGhpcy5fZG9jdW1lbnQpIHtcbiAgICAgICAgICAgIGNvbnN0IHNjcm9sbFBvc2l0aW9uID0gdGhpcy5fdmlld3BvcnRSdWxlciEuZ2V0Vmlld3BvcnRTY3JvbGxQb3NpdGlvbigpO1xuICAgICAgICAgICAgbmV3VG9wID0gc2Nyb2xsUG9zaXRpb24udG9wO1xuICAgICAgICAgICAgbmV3TGVmdCA9IHNjcm9sbFBvc2l0aW9uLmxlZnQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5ld1RvcCA9ICh0YXJnZXQgYXMgSFRNTEVsZW1lbnQpLnNjcm9sbFRvcDtcbiAgICAgICAgICAgIG5ld0xlZnQgPSAodGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5zY3JvbGxMZWZ0O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuX3VwZGF0ZUFmdGVyU2Nyb2xsKHRhcmdldCwgbmV3VG9wLCBuZXdMZWZ0KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0aGlzLmlzUmVjZWl2aW5nKCkpIHtcbiAgICAgICAgdGhpcy5fY2FjaGVQYXJlbnRQb3NpdGlvbnMoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMYXppbHkgcmVzb2x2ZXMgYW5kIHJldHVybnMgdGhlIHNoYWRvdyByb290IG9mIHRoZSBlbGVtZW50LiBXZSBkbyB0aGlzIGluIGEgZnVuY3Rpb24sIHJhdGhlclxuICAgKiB0aGFuIHNhdmluZyBpdCBpbiBwcm9wZXJ0eSBkaXJlY3RseSBvbiBpbml0LCBiZWNhdXNlIHdlIHdhbnQgdG8gcmVzb2x2ZSBpdCBhcyBsYXRlIGFzIHBvc3NpYmxlXG4gICAqIGluIG9yZGVyIHRvIGVuc3VyZSB0aGF0IHRoZSBlbGVtZW50IGhhcyBiZWVuIG1vdmVkIGludG8gdGhlIHNoYWRvdyBET00uIERvaW5nIGl0IGluc2lkZSB0aGVcbiAgICogY29uc3RydWN0b3IgbWlnaHQgYmUgdG9vIGVhcmx5IGlmIHRoZSBlbGVtZW50IGlzIGluc2lkZSBvZiBzb21ldGhpbmcgbGlrZSBgbmdGb3JgIG9yIGBuZ0lmYC5cbiAgICovXG4gIHByaXZhdGUgX2dldFNoYWRvd1Jvb3QoKTogRG9jdW1lbnRPclNoYWRvd1Jvb3Qge1xuICAgIGlmICghdGhpcy5fY2FjaGVkU2hhZG93Um9vdCkge1xuICAgICAgdGhpcy5fY2FjaGVkU2hhZG93Um9vdCA9IGdldFNoYWRvd1Jvb3QoY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpKSB8fCB0aGlzLl9kb2N1bWVudDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fY2FjaGVkU2hhZG93Um9vdDtcbiAgfVxufVxuXG5cbi8qKlxuICogVXBkYXRlcyB0aGUgdG9wL2xlZnQgcG9zaXRpb25zIG9mIGEgYENsaWVudFJlY3RgLCBhcyB3ZWxsIGFzIHRoZWlyIGJvdHRvbS9yaWdodCBjb3VudGVycGFydHMuXG4gKiBAcGFyYW0gY2xpZW50UmVjdCBgQ2xpZW50UmVjdGAgdGhhdCBzaG91bGQgYmUgdXBkYXRlZC5cbiAqIEBwYXJhbSB0b3AgQW1vdW50IHRvIGFkZCB0byB0aGUgYHRvcGAgcG9zaXRpb24uXG4gKiBAcGFyYW0gbGVmdCBBbW91bnQgdG8gYWRkIHRvIHRoZSBgbGVmdGAgcG9zaXRpb24uXG4gKi9cbmZ1bmN0aW9uIGFkanVzdENsaWVudFJlY3QoY2xpZW50UmVjdDogQ2xpZW50UmVjdCwgdG9wOiBudW1iZXIsIGxlZnQ6IG51bWJlcikge1xuICBjbGllbnRSZWN0LnRvcCArPSB0b3A7XG4gIGNsaWVudFJlY3QuYm90dG9tID0gY2xpZW50UmVjdC50b3AgKyBjbGllbnRSZWN0LmhlaWdodDtcblxuICBjbGllbnRSZWN0LmxlZnQgKz0gbGVmdDtcbiAgY2xpZW50UmVjdC5yaWdodCA9IGNsaWVudFJlY3QubGVmdCArIGNsaWVudFJlY3Qud2lkdGg7XG59XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgdGhlIHBvaW50ZXIgY29vcmRpbmF0ZXMgYXJlIGNsb3NlIHRvIGEgQ2xpZW50UmVjdC5cbiAqIEBwYXJhbSByZWN0IENsaWVudFJlY3QgdG8gY2hlY2sgYWdhaW5zdC5cbiAqIEBwYXJhbSBwb2ludGVyWCBDb29yZGluYXRlcyBhbG9uZyB0aGUgWCBheGlzLlxuICogQHBhcmFtIHBvaW50ZXJZIENvb3JkaW5hdGVzIGFsb25nIHRoZSBZIGF4aXMuXG4gKi9cbmZ1bmN0aW9uIGlzUG9pbnRlck5lYXJDbGllbnRSZWN0KHJlY3Q6IENsaWVudFJlY3QsIHBvaW50ZXJYOiBudW1iZXIsIHBvaW50ZXJZOiBudW1iZXIpOiBib29sZWFuIHtcbiAgY29uc3Qge3RvcCwgcmlnaHQsIGJvdHRvbSwgbGVmdCwgd2lkdGgsIGhlaWdodH0gPSByZWN0O1xuICBjb25zdCB4VGhyZXNob2xkID0gd2lkdGggKiBEUk9QX1BST1hJTUlUWV9USFJFU0hPTEQ7XG4gIGNvbnN0IHlUaHJlc2hvbGQgPSBoZWlnaHQgKiBEUk9QX1BST1hJTUlUWV9USFJFU0hPTEQ7XG5cbiAgcmV0dXJuIHBvaW50ZXJZID4gdG9wIC0geVRocmVzaG9sZCAmJiBwb2ludGVyWSA8IGJvdHRvbSArIHlUaHJlc2hvbGQgJiZcbiAgICAgICAgIHBvaW50ZXJYID4gbGVmdCAtIHhUaHJlc2hvbGQgJiYgcG9pbnRlclggPCByaWdodCArIHhUaHJlc2hvbGQ7XG59XG5cbi8qKlxuICogRmluZHMgdGhlIGluZGV4IG9mIGFuIGl0ZW0gdGhhdCBtYXRjaGVzIGEgcHJlZGljYXRlIGZ1bmN0aW9uLiBVc2VkIGFzIGFuIGVxdWl2YWxlbnRcbiAqIG9mIGBBcnJheS5wcm90b3R5cGUuZmluZEluZGV4YCB3aGljaCBpc24ndCBwYXJ0IG9mIHRoZSBzdGFuZGFyZCBHb29nbGUgdHlwaW5ncy5cbiAqIEBwYXJhbSBhcnJheSBBcnJheSBpbiB3aGljaCB0byBsb29rIGZvciBtYXRjaGVzLlxuICogQHBhcmFtIHByZWRpY2F0ZSBGdW5jdGlvbiB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIGFuIGl0ZW0gaXMgYSBtYXRjaC5cbiAqL1xuZnVuY3Rpb24gZmluZEluZGV4PFQ+KGFycmF5OiBUW10sXG4gICAgICAgICAgICAgICAgICAgICAgcHJlZGljYXRlOiAodmFsdWU6IFQsIGluZGV4OiBudW1iZXIsIG9iajogVFtdKSA9PiBib29sZWFuKTogbnVtYmVyIHtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHByZWRpY2F0ZShhcnJheVtpXSwgaSwgYXJyYXkpKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gLTE7XG59XG5cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciBzb21lIGNvb3JkaW5hdGVzIGFyZSB3aXRoaW4gYSBgQ2xpZW50UmVjdGAuXG4gKiBAcGFyYW0gY2xpZW50UmVjdCBDbGllbnRSZWN0IHRoYXQgaXMgYmVpbmcgY2hlY2tlZC5cbiAqIEBwYXJhbSB4IENvb3JkaW5hdGVzIGFsb25nIHRoZSBYIGF4aXMuXG4gKiBAcGFyYW0geSBDb29yZGluYXRlcyBhbG9uZyB0aGUgWSBheGlzLlxuICovXG5mdW5jdGlvbiBpc0luc2lkZUNsaWVudFJlY3QoY2xpZW50UmVjdDogQ2xpZW50UmVjdCwgeDogbnVtYmVyLCB5OiBudW1iZXIpIHtcbiAgY29uc3Qge3RvcCwgYm90dG9tLCBsZWZ0LCByaWdodH0gPSBjbGllbnRSZWN0O1xuICByZXR1cm4geSA+PSB0b3AgJiYgeSA8PSBib3R0b20gJiYgeCA+PSBsZWZ0ICYmIHggPD0gcmlnaHQ7XG59XG5cblxuLyoqIEdldHMgYSBtdXRhYmxlIHZlcnNpb24gb2YgYW4gZWxlbWVudCdzIGJvdW5kaW5nIGBDbGllbnRSZWN0YC4gKi9cbmZ1bmN0aW9uIGdldE11dGFibGVDbGllbnRSZWN0KGVsZW1lbnQ6IEVsZW1lbnQpOiBDbGllbnRSZWN0IHtcbiAgY29uc3QgY2xpZW50UmVjdCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgLy8gV2UgbmVlZCB0byBjbG9uZSB0aGUgYGNsaWVudFJlY3RgIGhlcmUsIGJlY2F1c2UgYWxsIHRoZSB2YWx1ZXMgb24gaXQgYXJlIHJlYWRvbmx5XG4gIC8vIGFuZCB3ZSBuZWVkIHRvIGJlIGFibGUgdG8gdXBkYXRlIHRoZW0uIEFsc28gd2UgY2FuJ3QgdXNlIGEgc3ByZWFkIGhlcmUsIGJlY2F1c2VcbiAgLy8gdGhlIHZhbHVlcyBvbiBhIGBDbGllbnRSZWN0YCBhcmVuJ3Qgb3duIHByb3BlcnRpZXMuIFNlZTpcbiAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0VsZW1lbnQvZ2V0Qm91bmRpbmdDbGllbnRSZWN0I05vdGVzXG4gIHJldHVybiB7XG4gICAgdG9wOiBjbGllbnRSZWN0LnRvcCxcbiAgICByaWdodDogY2xpZW50UmVjdC5yaWdodCxcbiAgICBib3R0b206IGNsaWVudFJlY3QuYm90dG9tLFxuICAgIGxlZnQ6IGNsaWVudFJlY3QubGVmdCxcbiAgICB3aWR0aDogY2xpZW50UmVjdC53aWR0aCxcbiAgICBoZWlnaHQ6IGNsaWVudFJlY3QuaGVpZ2h0XG4gIH07XG59XG5cbi8qKlxuICogSW5jcmVtZW50cyB0aGUgdmVydGljYWwgc2Nyb2xsIHBvc2l0aW9uIG9mIGEgbm9kZS5cbiAqIEBwYXJhbSBub2RlIE5vZGUgd2hvc2Ugc2Nyb2xsIHBvc2l0aW9uIHNob3VsZCBjaGFuZ2UuXG4gKiBAcGFyYW0gYW1vdW50IEFtb3VudCBvZiBwaXhlbHMgdGhhdCB0aGUgYG5vZGVgIHNob3VsZCBiZSBzY3JvbGxlZC5cbiAqL1xuZnVuY3Rpb24gaW5jcmVtZW50VmVydGljYWxTY3JvbGwobm9kZTogSFRNTEVsZW1lbnQgfCBXaW5kb3csIGFtb3VudDogbnVtYmVyKSB7XG4gIGlmIChub2RlID09PSB3aW5kb3cpIHtcbiAgICAobm9kZSBhcyBXaW5kb3cpLnNjcm9sbEJ5KDAsIGFtb3VudCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gSWRlYWxseSB3ZSBjb3VsZCB1c2UgYEVsZW1lbnQuc2Nyb2xsQnlgIGhlcmUgYXMgd2VsbCwgYnV0IElFIGFuZCBFZGdlIGRvbid0IHN1cHBvcnQgaXQuXG4gICAgKG5vZGUgYXMgSFRNTEVsZW1lbnQpLnNjcm9sbFRvcCArPSBhbW91bnQ7XG4gIH1cbn1cblxuLyoqXG4gKiBJbmNyZW1lbnRzIHRoZSBob3Jpem9udGFsIHNjcm9sbCBwb3NpdGlvbiBvZiBhIG5vZGUuXG4gKiBAcGFyYW0gbm9kZSBOb2RlIHdob3NlIHNjcm9sbCBwb3NpdGlvbiBzaG91bGQgY2hhbmdlLlxuICogQHBhcmFtIGFtb3VudCBBbW91bnQgb2YgcGl4ZWxzIHRoYXQgdGhlIGBub2RlYCBzaG91bGQgYmUgc2Nyb2xsZWQuXG4gKi9cbmZ1bmN0aW9uIGluY3JlbWVudEhvcml6b250YWxTY3JvbGwobm9kZTogSFRNTEVsZW1lbnQgfCBXaW5kb3csIGFtb3VudDogbnVtYmVyKSB7XG4gIGlmIChub2RlID09PSB3aW5kb3cpIHtcbiAgICAobm9kZSBhcyBXaW5kb3cpLnNjcm9sbEJ5KGFtb3VudCwgMCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gSWRlYWxseSB3ZSBjb3VsZCB1c2UgYEVsZW1lbnQuc2Nyb2xsQnlgIGhlcmUgYXMgd2VsbCwgYnV0IElFIGFuZCBFZGdlIGRvbid0IHN1cHBvcnQgaXQuXG4gICAgKG5vZGUgYXMgSFRNTEVsZW1lbnQpLnNjcm9sbExlZnQgKz0gYW1vdW50O1xuICB9XG59XG5cbi8qKlxuICogR2V0cyB3aGV0aGVyIHRoZSB2ZXJ0aWNhbCBhdXRvLXNjcm9sbCBkaXJlY3Rpb24gb2YgYSBub2RlLlxuICogQHBhcmFtIGNsaWVudFJlY3QgRGltZW5zaW9ucyBvZiB0aGUgbm9kZS5cbiAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIHkgYXhpcy5cbiAqL1xuZnVuY3Rpb24gZ2V0VmVydGljYWxTY3JvbGxEaXJlY3Rpb24oY2xpZW50UmVjdDogQ2xpZW50UmVjdCwgcG9pbnRlclk6IG51bWJlcikge1xuICBjb25zdCB7dG9wLCBib3R0b20sIGhlaWdodH0gPSBjbGllbnRSZWN0O1xuICBjb25zdCB5VGhyZXNob2xkID0gaGVpZ2h0ICogU0NST0xMX1BST1hJTUlUWV9USFJFU0hPTEQ7XG5cbiAgaWYgKHBvaW50ZXJZID49IHRvcCAtIHlUaHJlc2hvbGQgJiYgcG9pbnRlclkgPD0gdG9wICsgeVRocmVzaG9sZCkge1xuICAgIHJldHVybiBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uVVA7XG4gIH0gZWxzZSBpZiAocG9pbnRlclkgPj0gYm90dG9tIC0geVRocmVzaG9sZCAmJiBwb2ludGVyWSA8PSBib3R0b20gKyB5VGhyZXNob2xkKSB7XG4gICAgcmV0dXJuIEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5ET1dOO1xuICB9XG5cbiAgcmV0dXJuIEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5OT05FO1xufVxuXG4vKipcbiAqIEdldHMgd2hldGhlciB0aGUgaG9yaXpvbnRhbCBhdXRvLXNjcm9sbCBkaXJlY3Rpb24gb2YgYSBub2RlLlxuICogQHBhcmFtIGNsaWVudFJlY3QgRGltZW5zaW9ucyBvZiB0aGUgbm9kZS5cbiAqIEBwYXJhbSBwb2ludGVyWCBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIHggYXhpcy5cbiAqL1xuZnVuY3Rpb24gZ2V0SG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0OiBDbGllbnRSZWN0LCBwb2ludGVyWDogbnVtYmVyKSB7XG4gIGNvbnN0IHtsZWZ0LCByaWdodCwgd2lkdGh9ID0gY2xpZW50UmVjdDtcbiAgY29uc3QgeFRocmVzaG9sZCA9IHdpZHRoICogU0NST0xMX1BST1hJTUlUWV9USFJFU0hPTEQ7XG5cbiAgaWYgKHBvaW50ZXJYID49IGxlZnQgLSB4VGhyZXNob2xkICYmIHBvaW50ZXJYIDw9IGxlZnQgKyB4VGhyZXNob2xkKSB7XG4gICAgcmV0dXJuIEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLkxFRlQ7XG4gIH0gZWxzZSBpZiAocG9pbnRlclggPj0gcmlnaHQgLSB4VGhyZXNob2xkICYmIHBvaW50ZXJYIDw9IHJpZ2h0ICsgeFRocmVzaG9sZCkge1xuICAgIHJldHVybiBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5SSUdIVDtcbiAgfVxuXG4gIHJldHVybiBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5OT05FO1xufVxuXG4vKipcbiAqIEdldHMgdGhlIGRpcmVjdGlvbnMgaW4gd2hpY2ggYW4gZWxlbWVudCBub2RlIHNob3VsZCBiZSBzY3JvbGxlZCxcbiAqIGFzc3VtaW5nIHRoYXQgdGhlIHVzZXIncyBwb2ludGVyIGlzIGFscmVhZHkgd2l0aGluIGl0IHNjcm9sbGFibGUgcmVnaW9uLlxuICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCBmb3Igd2hpY2ggd2Ugc2hvdWxkIGNhbGN1bGF0ZSB0aGUgc2Nyb2xsIGRpcmVjdGlvbi5cbiAqIEBwYXJhbSBjbGllbnRSZWN0IEJvdW5kaW5nIGNsaWVudCByZWN0YW5nbGUgb2YgdGhlIGVsZW1lbnQuXG4gKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSB4IGF4aXMuXG4gKiBAcGFyYW0gcG9pbnRlclkgUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSB5IGF4aXMuXG4gKi9cbmZ1bmN0aW9uIGdldEVsZW1lbnRTY3JvbGxEaXJlY3Rpb25zKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBjbGllbnRSZWN0OiBDbGllbnRSZWN0LCBwb2ludGVyWDogbnVtYmVyLFxuICBwb2ludGVyWTogbnVtYmVyKTogW0F1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbiwgQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb25dIHtcbiAgY29uc3QgY29tcHV0ZWRWZXJ0aWNhbCA9IGdldFZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uKGNsaWVudFJlY3QsIHBvaW50ZXJZKTtcbiAgY29uc3QgY29tcHV0ZWRIb3Jpem9udGFsID0gZ2V0SG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0LCBwb2ludGVyWCk7XG4gIGxldCB2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5OT05FO1xuICBsZXQgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLk5PTkU7XG5cbiAgLy8gTm90ZSB0aGF0IHdlIGhlcmUgd2UgZG8gc29tZSBleHRyYSBjaGVja3MgZm9yIHdoZXRoZXIgdGhlIGVsZW1lbnQgaXMgYWN0dWFsbHkgc2Nyb2xsYWJsZSBpblxuICAvLyBhIGNlcnRhaW4gZGlyZWN0aW9uIGFuZCB3ZSBvbmx5IGFzc2lnbiB0aGUgc2Nyb2xsIGRpcmVjdGlvbiBpZiBpdCBpcy4gV2UgZG8gdGhpcyBzbyB0aGF0IHdlXG4gIC8vIGNhbiBhbGxvdyBvdGhlciBlbGVtZW50cyB0byBiZSBzY3JvbGxlZCwgaWYgdGhlIGN1cnJlbnQgZWxlbWVudCBjYW4ndCBiZSBzY3JvbGxlZCBhbnltb3JlLlxuICAvLyBUaGlzIGFsbG93cyB1cyB0byBoYW5kbGUgY2FzZXMgd2hlcmUgdGhlIHNjcm9sbCByZWdpb25zIG9mIHR3byBzY3JvbGxhYmxlIGVsZW1lbnRzIG92ZXJsYXAuXG4gIGlmIChjb21wdXRlZFZlcnRpY2FsKSB7XG4gICAgY29uc3Qgc2Nyb2xsVG9wID0gZWxlbWVudC5zY3JvbGxUb3A7XG5cbiAgICBpZiAoY29tcHV0ZWRWZXJ0aWNhbCA9PT0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLlVQKSB7XG4gICAgICBpZiAoc2Nyb2xsVG9wID4gMCkge1xuICAgICAgICB2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5VUDtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0gc2Nyb2xsVG9wID4gZWxlbWVudC5jbGllbnRIZWlnaHQpIHtcbiAgICAgIHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLkRPV047XG4gICAgfVxuICB9XG5cbiAgaWYgKGNvbXB1dGVkSG9yaXpvbnRhbCkge1xuICAgIGNvbnN0IHNjcm9sbExlZnQgPSBlbGVtZW50LnNjcm9sbExlZnQ7XG5cbiAgICBpZiAoY29tcHV0ZWRIb3Jpem9udGFsID09PSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5MRUZUKSB7XG4gICAgICBpZiAoc2Nyb2xsTGVmdCA+IDApIHtcbiAgICAgICAgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLkxFRlQ7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChlbGVtZW50LnNjcm9sbFdpZHRoIC0gc2Nyb2xsTGVmdCA+IGVsZW1lbnQuY2xpZW50V2lkdGgpIHtcbiAgICAgIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5SSUdIVDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uLCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uXTtcbn1cblxuLyoqIEdldHMgdGhlIHNoYWRvdyByb290IG9mIGFuIGVsZW1lbnQsIGlmIGFueS4gKi9cbmZ1bmN0aW9uIGdldFNoYWRvd1Jvb3QoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBEb2N1bWVudE9yU2hhZG93Um9vdCB8IG51bGwge1xuICBpZiAoX3N1cHBvcnRzU2hhZG93RG9tKCkpIHtcbiAgICBjb25zdCByb290Tm9kZSA9IGVsZW1lbnQuZ2V0Um9vdE5vZGUgPyBlbGVtZW50LmdldFJvb3ROb2RlKCkgOiBudWxsO1xuXG4gICAgaWYgKHJvb3ROb2RlIGluc3RhbmNlb2YgU2hhZG93Um9vdCkge1xuICAgICAgcmV0dXJuIHJvb3ROb2RlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuIl19