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
import { _getShadowRoot } from '@angular/cdk/platform';
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
        /** @type {?} */
        const styles = coerceElement(this.element).style;
        this.beforeStarted.next();
        this._isDragging = true;
        // We need to disable scroll snapping while the user is dragging, because it breaks automatic
        // scrolling. The browser seems to round the value based on the snapping points which means
        // that we can't increment/decrement the scroll position.
        this._initialScrollSnap = styles.msScrollSnapType || ((/** @type {?} */ (styles))).scrollSnapType || '';
        ((/** @type {?} */ (styles))).scrollSnapType = styles.msScrollSnapType = 'none';
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
     * @param {?=} index Index at which the item entered. If omitted, the container will try to figure it
     *   out automatically.
     * @return {?}
     */
    enter(item, pointerX, pointerY, index) {
        this.start();
        // If sorting is disabled, we want the item to return to its starting
        // position if the user is returning it to its initial container.
        /** @type {?} */
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
     * \@breaking-change 11.0.0 `previousIndex` parameter to become required.
     * @param {?} item Item being dropped into the container.
     * @param {?} currentIndex Index at which the item should be inserted.
     * @param {?} previousContainer Container from which the item got dragged in.
     * @param {?} isPointerOverContainer Whether the user's pointer was over the
     *    container when the item was dropped.
     * @param {?} distance Distance the user has dragged since the start of the dragging sequence.
     * @param {?=} previousIndex Index of the item when dragging started.
     *
     * @return {?}
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
            const elementToMeasure = drag.getVisibleElement();
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
        /** @type {?} */
        const styles = coerceElement(this.element).style;
        ((/** @type {?} */ (styles))).scrollSnapType = styles.msScrollSnapType = this._initialScrollSnap;
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
        // Used when figuring out whether an element is inside the scroll parent. If the scrolled
        // parent is the `document`, we use the `documentElement`, because IE doesn't support `contains`
        // on the `document`.
        /** @type {?} */
        const scrolledParentNode = scrolledParent === this._document ? scrolledParent.documentElement : scrolledParent;
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
            if (position.clientRect && scrolledParent !== node && scrolledParentNode.contains(node)) {
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
            /** @type {?} */
            const shadowRoot = (/** @type {?} */ (_getShadowRoot(coerceElement(this.element))));
            this._cachedShadowRoot = shadowRoot || this._document;
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
     * Initial value for the element's `scroll-snap-type` style.
     * @type {?}
     * @private
     */
    DropListRef.prototype._initialScrollSnap;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LXJlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2Ryb3AtbGlzdC1yZWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBVUEsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRXBELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsT0FBTyxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsdUJBQXVCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDOUUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxjQUFjLENBQUM7Ozs7OztNQVF2Qyx3QkFBd0IsR0FBRyxJQUFJOzs7Ozs7TUFNL0IsMEJBQTBCLEdBQUcsSUFBSTs7Ozs7O01BTWpDLGdCQUFnQixHQUFHLENBQUM7Ozs7OztBQU0xQixpQ0FPQzs7Ozs7O0lBTEMsa0NBQWM7Ozs7O0lBRWQsd0NBQXVCOzs7OztJQUV2QixvQ0FBZTs7Ozs7O0FBSWpCLDZCQUdDOzs7SUFGQyw2QkFBWTs7SUFDWiw4QkFBYTs7O0FBSWYsTUFBVywyQkFBMkI7SUFBRSxJQUFJLEdBQUEsRUFBRSxFQUFFLEdBQUEsRUFBRSxJQUFJLEdBQUE7RUFBQzs7QUFHdkQsTUFBVyw2QkFBNkI7SUFBRSxJQUFJLEdBQUEsRUFBRSxJQUFJLEdBQUEsRUFBRSxLQUFLLEdBQUE7RUFBQzs7Ozs7OztBQU81RCx5Q0FBMkQ7Ozs7O0FBSzNELE1BQU0sT0FBTyxXQUFXOzs7Ozs7OztJQW1JdEIsWUFDRSxPQUE4QyxFQUN0QyxpQkFBeUQsRUFDakUsU0FBYyxFQUNOLE9BQWUsRUFDZixjQUE2QjtRQUg3QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQXdDO1FBRXpELFlBQU8sR0FBUCxPQUFPLENBQVE7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O1VBQ1YsZ0JBQWdCLEdBQUcsMEJBQTBCLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQzs7VUFDbkUsa0JBQWtCLEdBQUcsNEJBQTRCLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQzs7UUFDekUsdUJBQXVCLGVBQW1DOztRQUMxRCx5QkFBeUIsZUFBcUM7SUFFbEUsOEZBQThGO0lBQzlGLDhGQUE4RjtJQUM5Riw2RkFBNkY7SUFDN0YsOEZBQThGO0lBQzlGLElBQUksZ0JBQWdCLEVBQUU7O2NBQ2QsU0FBUyxHQUFHLE9BQU8sQ0FBQyxTQUFTO1FBRW5DLElBQUksZ0JBQWdCLGVBQW1DLEVBQUU7WUFDdkQsSUFBSSxTQUFTLEdBQUcsQ0FBQyxFQUFFO2dCQUNqQix1QkFBdUIsYUFBaUMsQ0FBQzthQUMxRDtTQUNGO2FBQU0sSUFBSSxPQUFPLENBQUMsWUFBWSxHQUFHLFNBQVMsR0FBRyxPQUFPLENBQUMsWUFBWSxFQUFFO1lBQ2xFLHVCQUF1QixlQUFtQyxDQUFDO1NBQzVEO0tBQ0Y7SUFFRCxJQUFJLGtCQUFrQixFQUFFOztjQUNoQixVQUFVLEdBQUcsT0FBTyxDQUFDLFVBQVU7UUFFckMsSUFBSSxrQkFBa0IsaUJBQXVDLEVBQUU7WUFDN0QsSUFBSSxVQUFVLEdBQUcsQ0FBQyxFQUFFO2dCQUNsQix5QkFBeUIsZUFBcUMsQ0FBQzthQUNoRTtTQUNGO2FBQU0sSUFBSSxPQUFPLENBQUMsV0FBVyxHQUFHLFVBQVUsR0FBRyxPQUFPLENBQUMsV0FBVyxFQUFFO1lBQ2pFLHlCQUF5QixnQkFBc0MsQ0FBQztTQUNqRTtLQUNGO0lBRUQsT0FBTyxDQUFDLHVCQUF1QixFQUFFLHlCQUF5QixDQUFDLENBQUM7QUFDOUQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0VsZW1lbnRSZWYsIE5nWm9uZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0RpcmVjdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtjb2VyY2VFbGVtZW50fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtWaWV3cG9ydFJ1bGVyfSBmcm9tICdAYW5ndWxhci9jZGsvc2Nyb2xsaW5nJztcbmltcG9ydCB7X2dldFNoYWRvd1Jvb3R9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge1N1YmplY3QsIFN1YnNjcmlwdGlvbiwgaW50ZXJ2YWwsIGFuaW1hdGlvbkZyYW1lU2NoZWR1bGVyfSBmcm9tICdyeGpzJztcbmltcG9ydCB7dGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge21vdmVJdGVtSW5BcnJheX0gZnJvbSAnLi9kcmFnLXV0aWxzJztcbmltcG9ydCB7RHJhZ0Ryb3BSZWdpc3RyeX0gZnJvbSAnLi9kcmFnLWRyb3AtcmVnaXN0cnknO1xuaW1wb3J0IHtEcmFnUmVmSW50ZXJuYWwgYXMgRHJhZ1JlZiwgUG9pbnR9IGZyb20gJy4vZHJhZy1yZWYnO1xuXG4vKipcbiAqIFByb3hpbWl0eSwgYXMgYSByYXRpbyB0byB3aWR0aC9oZWlnaHQsIGF0IHdoaWNoIGFcbiAqIGRyYWdnZWQgaXRlbSB3aWxsIGFmZmVjdCB0aGUgZHJvcCBjb250YWluZXIuXG4gKi9cbmNvbnN0IERST1BfUFJPWElNSVRZX1RIUkVTSE9MRCA9IDAuMDU7XG5cbi8qKlxuICogUHJveGltaXR5LCBhcyBhIHJhdGlvIHRvIHdpZHRoL2hlaWdodCBhdCB3aGljaCB0byBzdGFydCBhdXRvLXNjcm9sbGluZyB0aGUgZHJvcCBsaXN0IG9yIHRoZVxuICogdmlld3BvcnQuIFRoZSB2YWx1ZSBjb21lcyBmcm9tIHRyeWluZyBpdCBvdXQgbWFudWFsbHkgdW50aWwgaXQgZmVlbHMgcmlnaHQuXG4gKi9cbmNvbnN0IFNDUk9MTF9QUk9YSU1JVFlfVEhSRVNIT0xEID0gMC4wNTtcblxuLyoqXG4gKiBOdW1iZXIgb2YgcGl4ZWxzIHRvIHNjcm9sbCBmb3IgZWFjaCBmcmFtZSB3aGVuIGF1dG8tc2Nyb2xsaW5nIGFuIGVsZW1lbnQuXG4gKiBUaGUgdmFsdWUgY29tZXMgZnJvbSB0cnlpbmcgaXQgb3V0IG1hbnVhbGx5IHVudGlsIGl0IGZlZWxzIHJpZ2h0LlxuICovXG5jb25zdCBBVVRPX1NDUk9MTF9TVEVQID0gMjtcblxuLyoqXG4gKiBFbnRyeSBpbiB0aGUgcG9zaXRpb24gY2FjaGUgZm9yIGRyYWdnYWJsZSBpdGVtcy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuaW50ZXJmYWNlIENhY2hlZEl0ZW1Qb3NpdGlvbiB7XG4gIC8qKiBJbnN0YW5jZSBvZiB0aGUgZHJhZyBpdGVtLiAqL1xuICBkcmFnOiBEcmFnUmVmO1xuICAvKiogRGltZW5zaW9ucyBvZiB0aGUgaXRlbS4gKi9cbiAgY2xpZW50UmVjdDogQ2xpZW50UmVjdDtcbiAgLyoqIEFtb3VudCBieSB3aGljaCB0aGUgaXRlbSBoYXMgYmVlbiBtb3ZlZCBzaW5jZSBkcmFnZ2luZyBzdGFydGVkLiAqL1xuICBvZmZzZXQ6IG51bWJlcjtcbn1cblxuLyoqIE9iamVjdCBob2xkaW5nIHRoZSBzY3JvbGwgcG9zaXRpb24gb2Ygc29tZXRoaW5nLiAqL1xuaW50ZXJmYWNlIFNjcm9sbFBvc2l0aW9uIHtcbiAgdG9wOiBudW1iZXI7XG4gIGxlZnQ6IG51bWJlcjtcbn1cblxuLyoqIFZlcnRpY2FsIGRpcmVjdGlvbiBpbiB3aGljaCB3ZSBjYW4gYXV0by1zY3JvbGwuICovXG5jb25zdCBlbnVtIEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbiB7Tk9ORSwgVVAsIERPV059XG5cbi8qKiBIb3Jpem9udGFsIGRpcmVjdGlvbiBpbiB3aGljaCB3ZSBjYW4gYXV0by1zY3JvbGwuICovXG5jb25zdCBlbnVtIEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uIHtOT05FLCBMRUZULCBSSUdIVH1cblxuLyoqXG4gKiBJbnRlcm5hbCBjb21waWxlLXRpbWUtb25seSByZXByZXNlbnRhdGlvbiBvZiBhIGBEcm9wTGlzdFJlZmAuXG4gKiBVc2VkIHRvIGF2b2lkIGNpcmN1bGFyIGltcG9ydCBpc3N1ZXMgYmV0d2VlbiB0aGUgYERyb3BMaXN0UmVmYCBhbmQgdGhlIGBEcmFnUmVmYC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEcm9wTGlzdFJlZkludGVybmFsIGV4dGVuZHMgRHJvcExpc3RSZWYge31cblxuLyoqXG4gKiBSZWZlcmVuY2UgdG8gYSBkcm9wIGxpc3QuIFVzZWQgdG8gbWFuaXB1bGF0ZSBvciBkaXNwb3NlIG9mIHRoZSBjb250YWluZXIuXG4gKi9cbmV4cG9ydCBjbGFzcyBEcm9wTGlzdFJlZjxUID0gYW55PiB7XG4gIC8qKiBFbGVtZW50IHRoYXQgdGhlIGRyb3AgbGlzdCBpcyBhdHRhY2hlZCB0by4gKi9cbiAgZWxlbWVudDogSFRNTEVsZW1lbnQgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50PjtcblxuICAvKiogV2hldGhlciBzdGFydGluZyBhIGRyYWdnaW5nIHNlcXVlbmNlIGZyb20gdGhpcyBjb250YWluZXIgaXMgZGlzYWJsZWQuICovXG4gIGRpc2FibGVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgc29ydGluZyBpdGVtcyB3aXRoaW4gdGhlIGxpc3QgaXMgZGlzYWJsZWQuICovXG4gIHNvcnRpbmdEaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBMb2NrcyB0aGUgcG9zaXRpb24gb2YgdGhlIGRyYWdnYWJsZSBlbGVtZW50cyBpbnNpZGUgdGhlIGNvbnRhaW5lciBhbG9uZyB0aGUgc3BlY2lmaWVkIGF4aXMuICovXG4gIGxvY2tBeGlzOiAneCcgfCAneSc7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgYXV0by1zY3JvbGxpbmcgdGhlIHZpZXcgd2hlbiB0aGUgdXNlclxuICAgKiBtb3ZlcyB0aGVpciBwb2ludGVyIGNsb3NlIHRvIHRoZSBlZGdlcyBpcyBkaXNhYmxlZC5cbiAgICovXG4gIGF1dG9TY3JvbGxEaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBGdW5jdGlvbiB0aGF0IGlzIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYW4gaXRlbVxuICAgKiBpcyBhbGxvd2VkIHRvIGJlIG1vdmVkIGludG8gYSBkcm9wIGNvbnRhaW5lci5cbiAgICovXG4gIGVudGVyUHJlZGljYXRlOiAoZHJhZzogRHJhZ1JlZiwgZHJvcDogRHJvcExpc3RSZWYpID0+IGJvb2xlYW4gPSAoKSA9PiB0cnVlO1xuXG4gIC8qKiBFbWl0cyByaWdodCBiZWZvcmUgZHJhZ2dpbmcgaGFzIHN0YXJ0ZWQuICovXG4gIGJlZm9yZVN0YXJ0ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGhhcyBtb3ZlZCBhIG5ldyBkcmFnIGl0ZW0gaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICovXG4gIGVudGVyZWQgPSBuZXcgU3ViamVjdDx7aXRlbTogRHJhZ1JlZiwgY29udGFpbmVyOiBEcm9wTGlzdFJlZiwgY3VycmVudEluZGV4OiBudW1iZXJ9PigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHJlbW92ZXMgYW4gaXRlbSBmcm9tIHRoZSBjb250YWluZXJcbiAgICogYnkgZHJhZ2dpbmcgaXQgaW50byBhbm90aGVyIGNvbnRhaW5lci5cbiAgICovXG4gIGV4aXRlZCA9IG5ldyBTdWJqZWN0PHtpdGVtOiBEcmFnUmVmLCBjb250YWluZXI6IERyb3BMaXN0UmVmfT4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBkcm9wcyBhbiBpdGVtIGluc2lkZSB0aGUgY29udGFpbmVyLiAqL1xuICBkcm9wcGVkID0gbmV3IFN1YmplY3Q8e1xuICAgIGl0ZW06IERyYWdSZWYsXG4gICAgY3VycmVudEluZGV4OiBudW1iZXIsXG4gICAgcHJldmlvdXNJbmRleDogbnVtYmVyLFxuICAgIGNvbnRhaW5lcjogRHJvcExpc3RSZWYsXG4gICAgcHJldmlvdXNDb250YWluZXI6IERyb3BMaXN0UmVmLFxuICAgIGlzUG9pbnRlck92ZXJDb250YWluZXI6IGJvb2xlYW4sXG4gICAgZGlzdGFuY2U6IFBvaW50O1xuICB9PigpO1xuXG4gIC8qKiBFbWl0cyBhcyB0aGUgdXNlciBpcyBzd2FwcGluZyBpdGVtcyB3aGlsZSBhY3RpdmVseSBkcmFnZ2luZy4gKi9cbiAgc29ydGVkID0gbmV3IFN1YmplY3Q8e1xuICAgIHByZXZpb3VzSW5kZXg6IG51bWJlcixcbiAgICBjdXJyZW50SW5kZXg6IG51bWJlcixcbiAgICBjb250YWluZXI6IERyb3BMaXN0UmVmLFxuICAgIGl0ZW06IERyYWdSZWZcbiAgfT4oKTtcblxuICAvKiogQXJiaXRyYXJ5IGRhdGEgdGhhdCBjYW4gYmUgYXR0YWNoZWQgdG8gdGhlIGRyb3AgbGlzdC4gKi9cbiAgZGF0YTogVDtcblxuICAvKiogV2hldGhlciBhbiBpdGVtIGluIHRoZSBsaXN0IGlzIGJlaW5nIGRyYWdnZWQuICovXG4gIHByaXZhdGUgX2lzRHJhZ2dpbmcgPSBmYWxzZTtcblxuICAvKiogQ2FjaGUgb2YgdGhlIGRpbWVuc2lvbnMgb2YgYWxsIHRoZSBpdGVtcyBpbnNpZGUgdGhlIGNvbnRhaW5lci4gKi9cbiAgcHJpdmF0ZSBfaXRlbVBvc2l0aW9uczogQ2FjaGVkSXRlbVBvc2l0aW9uW10gPSBbXTtcblxuICAvKiogQ2FjaGVkIHBvc2l0aW9ucyBvZiB0aGUgc2Nyb2xsYWJsZSBwYXJlbnQgZWxlbWVudHMuICovXG4gIHByaXZhdGUgX3BhcmVudFBvc2l0aW9ucyA9IG5ldyBNYXA8RG9jdW1lbnR8SFRNTEVsZW1lbnQsIHtcbiAgICBzY3JvbGxQb3NpdGlvbjogU2Nyb2xsUG9zaXRpb24sXG4gICAgY2xpZW50UmVjdD86IENsaWVudFJlY3RcbiAgfT4oKTtcblxuICAvKiogQ2FjaGVkIGBDbGllbnRSZWN0YCBvZiB0aGUgZHJvcCBsaXN0LiAqL1xuICBwcml2YXRlIF9jbGllbnRSZWN0OiBDbGllbnRSZWN0O1xuXG4gIC8qKlxuICAgKiBEcmFnZ2FibGUgaXRlbXMgdGhhdCBhcmUgY3VycmVudGx5IGFjdGl2ZSBpbnNpZGUgdGhlIGNvbnRhaW5lci4gSW5jbHVkZXMgdGhlIGl0ZW1zXG4gICAqIGZyb20gYF9kcmFnZ2FibGVzYCwgYXMgd2VsbCBhcyBhbnkgaXRlbXMgdGhhdCBoYXZlIGJlZW4gZHJhZ2dlZCBpbiwgYnV0IGhhdmVuJ3RcbiAgICogYmVlbiBkcm9wcGVkIHlldC5cbiAgICovXG4gIHByaXZhdGUgX2FjdGl2ZURyYWdnYWJsZXM6IERyYWdSZWZbXTtcblxuICAvKipcbiAgICogS2VlcHMgdHJhY2sgb2YgdGhlIGl0ZW0gdGhhdCB3YXMgbGFzdCBzd2FwcGVkIHdpdGggdGhlIGRyYWdnZWQgaXRlbSwgYXNcbiAgICogd2VsbCBhcyB3aGF0IGRpcmVjdGlvbiB0aGUgcG9pbnRlciB3YXMgbW92aW5nIGluIHdoZW4gdGhlIHN3YXAgb2NjdXJlZC5cbiAgICovXG4gIHByaXZhdGUgX3ByZXZpb3VzU3dhcCA9IHtkcmFnOiBudWxsIGFzIERyYWdSZWYgfCBudWxsLCBkZWx0YTogMH07XG5cbiAgLyoqIERyYWdnYWJsZSBpdGVtcyBpbiB0aGUgY29udGFpbmVyLiAqL1xuICBwcml2YXRlIF9kcmFnZ2FibGVzOiBSZWFkb25seUFycmF5PERyYWdSZWY+O1xuXG4gIC8qKiBEcm9wIGxpc3RzIHRoYXQgYXJlIGNvbm5lY3RlZCB0byB0aGUgY3VycmVudCBvbmUuICovXG4gIHByaXZhdGUgX3NpYmxpbmdzOiBSZWFkb25seUFycmF5PERyb3BMaXN0UmVmPiA9IFtdO1xuXG4gIC8qKiBEaXJlY3Rpb24gaW4gd2hpY2ggdGhlIGxpc3QgaXMgb3JpZW50ZWQuICovXG4gIHByaXZhdGUgX29yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcgfCAndmVydGljYWwnID0gJ3ZlcnRpY2FsJztcblxuICAvKiogQ29ubmVjdGVkIHNpYmxpbmdzIHRoYXQgY3VycmVudGx5IGhhdmUgYSBkcmFnZ2VkIGl0ZW0uICovXG4gIHByaXZhdGUgX2FjdGl2ZVNpYmxpbmdzID0gbmV3IFNldDxEcm9wTGlzdFJlZj4oKTtcblxuICAvKiogTGF5b3V0IGRpcmVjdGlvbiBvZiB0aGUgZHJvcCBsaXN0LiAqL1xuICBwcml2YXRlIF9kaXJlY3Rpb246IERpcmVjdGlvbiA9ICdsdHInO1xuXG4gIC8qKiBTdWJzY3JpcHRpb24gdG8gdGhlIHdpbmRvdyBiZWluZyBzY3JvbGxlZC4gKi9cbiAgcHJpdmF0ZSBfdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG5cbiAgLyoqIFZlcnRpY2FsIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgbGlzdCBpcyBjdXJyZW50bHkgc2Nyb2xsaW5nLiAqL1xuICBwcml2YXRlIF92ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5OT05FO1xuXG4gIC8qKiBIb3Jpem9udGFsIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgbGlzdCBpcyBjdXJyZW50bHkgc2Nyb2xsaW5nLiAqL1xuICBwcml2YXRlIF9ob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTk9ORTtcblxuICAvKiogTm9kZSB0aGF0IGlzIGJlaW5nIGF1dG8tc2Nyb2xsZWQuICovXG4gIHByaXZhdGUgX3Njcm9sbE5vZGU6IEhUTUxFbGVtZW50IHwgV2luZG93O1xuXG4gIC8qKiBVc2VkIHRvIHNpZ25hbCB0byB0aGUgY3VycmVudCBhdXRvLXNjcm9sbCBzZXF1ZW5jZSB3aGVuIHRvIHN0b3AuICovXG4gIHByaXZhdGUgX3N0b3BTY3JvbGxUaW1lcnMgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBTaGFkb3cgcm9vdCBvZiB0aGUgY3VycmVudCBlbGVtZW50LiBOZWNlc3NhcnkgZm9yIGBlbGVtZW50RnJvbVBvaW50YCB0byByZXNvbHZlIGNvcnJlY3RseS4gKi9cbiAgcHJpdmF0ZSBfY2FjaGVkU2hhZG93Um9vdDogRG9jdW1lbnRPclNoYWRvd1Jvb3QgfCBudWxsID0gbnVsbDtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSBkb2N1bWVudC4gKi9cbiAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50O1xuXG4gIC8qKiBFbGVtZW50cyB0aGF0IGNhbiBiZSBzY3JvbGxlZCB3aGlsZSB0aGUgdXNlciBpcyBkcmFnZ2luZy4gKi9cbiAgcHJpdmF0ZSBfc2Nyb2xsYWJsZUVsZW1lbnRzOiBIVE1MRWxlbWVudFtdO1xuXG4gIC8qKiBJbml0aWFsIHZhbHVlIGZvciB0aGUgZWxlbWVudCdzIGBzY3JvbGwtc25hcC10eXBlYCBzdHlsZS4gKi9cbiAgcHJpdmF0ZSBfaW5pdGlhbFNjcm9sbFNuYXA6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihcbiAgICBlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiB8IEhUTUxFbGVtZW50LFxuICAgIHByaXZhdGUgX2RyYWdEcm9wUmVnaXN0cnk6IERyYWdEcm9wUmVnaXN0cnk8RHJhZ1JlZiwgRHJvcExpc3RSZWY+LFxuICAgIF9kb2N1bWVudDogYW55LFxuICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgIHByaXZhdGUgX3ZpZXdwb3J0UnVsZXI6IFZpZXdwb3J0UnVsZXIpIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnQpO1xuICAgIHRoaXMuX2RvY3VtZW50ID0gX2RvY3VtZW50O1xuICAgIHRoaXMud2l0aFNjcm9sbGFibGVQYXJlbnRzKFt0aGlzLmVsZW1lbnRdKTtcbiAgICBfZHJhZ0Ryb3BSZWdpc3RyeS5yZWdpc3RlckRyb3BDb250YWluZXIodGhpcyk7XG4gIH1cblxuICAvKiogUmVtb3ZlcyB0aGUgZHJvcCBsaXN0IGZ1bmN0aW9uYWxpdHkgZnJvbSB0aGUgRE9NIGVsZW1lbnQuICovXG4gIGRpc3Bvc2UoKSB7XG4gICAgdGhpcy5fc3RvcFNjcm9sbGluZygpO1xuICAgIHRoaXMuX3N0b3BTY3JvbGxUaW1lcnMuY29tcGxldGUoKTtcbiAgICB0aGlzLl92aWV3cG9ydFNjcm9sbFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuYmVmb3JlU3RhcnRlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuZW50ZXJlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuZXhpdGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5kcm9wcGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5zb3J0ZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLl9hY3RpdmVTaWJsaW5ncy5jbGVhcigpO1xuICAgIHRoaXMuX3Njcm9sbE5vZGUgPSBudWxsITtcbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuY2xlYXIoKTtcbiAgICB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnJlbW92ZURyb3BDb250YWluZXIodGhpcyk7XG4gIH1cblxuICAvKiogV2hldGhlciBhbiBpdGVtIGZyb20gdGhpcyBsaXN0IGlzIGN1cnJlbnRseSBiZWluZyBkcmFnZ2VkLiAqL1xuICBpc0RyYWdnaW5nKCkge1xuICAgIHJldHVybiB0aGlzLl9pc0RyYWdnaW5nO1xuICB9XG5cbiAgLyoqIFN0YXJ0cyBkcmFnZ2luZyBhbiBpdGVtLiAqL1xuICBzdGFydCgpOiB2b2lkIHtcbiAgICBjb25zdCBzdHlsZXMgPSBjb2VyY2VFbGVtZW50KHRoaXMuZWxlbWVudCkuc3R5bGU7XG4gICAgdGhpcy5iZWZvcmVTdGFydGVkLm5leHQoKTtcbiAgICB0aGlzLl9pc0RyYWdnaW5nID0gdHJ1ZTtcblxuICAgIC8vIFdlIG5lZWQgdG8gZGlzYWJsZSBzY3JvbGwgc25hcHBpbmcgd2hpbGUgdGhlIHVzZXIgaXMgZHJhZ2dpbmcsIGJlY2F1c2UgaXQgYnJlYWtzIGF1dG9tYXRpY1xuICAgIC8vIHNjcm9sbGluZy4gVGhlIGJyb3dzZXIgc2VlbXMgdG8gcm91bmQgdGhlIHZhbHVlIGJhc2VkIG9uIHRoZSBzbmFwcGluZyBwb2ludHMgd2hpY2ggbWVhbnNcbiAgICAvLyB0aGF0IHdlIGNhbid0IGluY3JlbWVudC9kZWNyZW1lbnQgdGhlIHNjcm9sbCBwb3NpdGlvbi5cbiAgICB0aGlzLl9pbml0aWFsU2Nyb2xsU25hcCA9IHN0eWxlcy5tc1Njcm9sbFNuYXBUeXBlIHx8IChzdHlsZXMgYXMgYW55KS5zY3JvbGxTbmFwVHlwZSB8fCAnJztcbiAgICAoc3R5bGVzIGFzIGFueSkuc2Nyb2xsU25hcFR5cGUgPSBzdHlsZXMubXNTY3JvbGxTbmFwVHlwZSA9ICdub25lJztcbiAgICB0aGlzLl9jYWNoZUl0ZW1zKCk7XG4gICAgdGhpcy5fc2libGluZ3MuZm9yRWFjaChzaWJsaW5nID0+IHNpYmxpbmcuX3N0YXJ0UmVjZWl2aW5nKHRoaXMpKTtcbiAgICB0aGlzLl92aWV3cG9ydFNjcm9sbFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuX2xpc3RlblRvU2Nyb2xsRXZlbnRzKCk7XG4gIH1cblxuICAvKipcbiAgICogRW1pdHMgYW4gZXZlbnQgdG8gaW5kaWNhdGUgdGhhdCB0aGUgdXNlciBtb3ZlZCBhbiBpdGVtIGludG8gdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB0aGF0IHdhcyBtb3ZlZCBpbnRvIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSBwb2ludGVyWCBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0gcG9pbnRlclkgUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFkgYXhpcy5cbiAgICogQHBhcmFtIGluZGV4IEluZGV4IGF0IHdoaWNoIHRoZSBpdGVtIGVudGVyZWQuIElmIG9taXR0ZWQsIHRoZSBjb250YWluZXIgd2lsbCB0cnkgdG8gZmlndXJlIGl0XG4gICAqICAgb3V0IGF1dG9tYXRpY2FsbHkuXG4gICAqL1xuICBlbnRlcihpdGVtOiBEcmFnUmVmLCBwb2ludGVyWDogbnVtYmVyLCBwb2ludGVyWTogbnVtYmVyLCBpbmRleD86IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMuc3RhcnQoKTtcblxuICAgIC8vIElmIHNvcnRpbmcgaXMgZGlzYWJsZWQsIHdlIHdhbnQgdGhlIGl0ZW0gdG8gcmV0dXJuIHRvIGl0cyBzdGFydGluZ1xuICAgIC8vIHBvc2l0aW9uIGlmIHRoZSB1c2VyIGlzIHJldHVybmluZyBpdCB0byBpdHMgaW5pdGlhbCBjb250YWluZXIuXG4gICAgbGV0IG5ld0luZGV4OiBudW1iZXI7XG5cbiAgICBpZiAoaW5kZXggPT0gbnVsbCkge1xuICAgICAgbmV3SW5kZXggPSB0aGlzLnNvcnRpbmdEaXNhYmxlZCA/IHRoaXMuX2RyYWdnYWJsZXMuaW5kZXhPZihpdGVtKSA6IC0xO1xuXG4gICAgICBpZiAobmV3SW5kZXggPT09IC0xKSB7XG4gICAgICAgIC8vIFdlIHVzZSB0aGUgY29vcmRpbmF0ZXMgb2Ygd2hlcmUgdGhlIGl0ZW0gZW50ZXJlZCB0aGUgZHJvcFxuICAgICAgICAvLyB6b25lIHRvIGZpZ3VyZSBvdXQgYXQgd2hpY2ggaW5kZXggaXQgc2hvdWxkIGJlIGluc2VydGVkLlxuICAgICAgICBuZXdJbmRleCA9IHRoaXMuX2dldEl0ZW1JbmRleEZyb21Qb2ludGVyUG9zaXRpb24oaXRlbSwgcG9pbnRlclgsIHBvaW50ZXJZKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbmV3SW5kZXggPSBpbmRleDtcbiAgICB9XG5cbiAgICBjb25zdCBhY3RpdmVEcmFnZ2FibGVzID0gdGhpcy5fYWN0aXZlRHJhZ2dhYmxlcztcbiAgICBjb25zdCBjdXJyZW50SW5kZXggPSBhY3RpdmVEcmFnZ2FibGVzLmluZGV4T2YoaXRlbSk7XG4gICAgY29uc3QgcGxhY2Vob2xkZXIgPSBpdGVtLmdldFBsYWNlaG9sZGVyRWxlbWVudCgpO1xuICAgIGxldCBuZXdQb3NpdGlvblJlZmVyZW5jZTogRHJhZ1JlZiB8IHVuZGVmaW5lZCA9IGFjdGl2ZURyYWdnYWJsZXNbbmV3SW5kZXhdO1xuXG4gICAgLy8gSWYgdGhlIGl0ZW0gYXQgdGhlIG5ldyBwb3NpdGlvbiBpcyB0aGUgc2FtZSBhcyB0aGUgaXRlbSB0aGF0IGlzIGJlaW5nIGRyYWdnZWQsXG4gICAgLy8gaXQgbWVhbnMgdGhhdCB3ZSdyZSB0cnlpbmcgdG8gcmVzdG9yZSB0aGUgaXRlbSB0byBpdHMgaW5pdGlhbCBwb3NpdGlvbi4gSW4gdGhpc1xuICAgIC8vIGNhc2Ugd2Ugc2hvdWxkIHVzZSB0aGUgbmV4dCBpdGVtIGZyb20gdGhlIGxpc3QgYXMgdGhlIHJlZmVyZW5jZS5cbiAgICBpZiAobmV3UG9zaXRpb25SZWZlcmVuY2UgPT09IGl0ZW0pIHtcbiAgICAgIG5ld1Bvc2l0aW9uUmVmZXJlbmNlID0gYWN0aXZlRHJhZ2dhYmxlc1tuZXdJbmRleCArIDFdO1xuICAgIH1cblxuICAgIC8vIFNpbmNlIHRoZSBpdGVtIG1heSBiZSBpbiB0aGUgYGFjdGl2ZURyYWdnYWJsZXNgIGFscmVhZHkgKGUuZy4gaWYgdGhlIHVzZXIgZHJhZ2dlZCBpdFxuICAgIC8vIGludG8gYW5vdGhlciBjb250YWluZXIgYW5kIGJhY2sgYWdhaW4pLCB3ZSBoYXZlIHRvIGVuc3VyZSB0aGF0IGl0IGlzbid0IGR1cGxpY2F0ZWQuXG4gICAgaWYgKGN1cnJlbnRJbmRleCA+IC0xKSB7XG4gICAgICBhY3RpdmVEcmFnZ2FibGVzLnNwbGljZShjdXJyZW50SW5kZXgsIDEpO1xuICAgIH1cblxuICAgIC8vIERvbid0IHVzZSBpdGVtcyB0aGF0IGFyZSBiZWluZyBkcmFnZ2VkIGFzIGEgcmVmZXJlbmNlLCBiZWNhdXNlXG4gICAgLy8gdGhlaXIgZWxlbWVudCBoYXMgYmVlbiBtb3ZlZCBkb3duIHRvIHRoZSBib3R0b20gb2YgdGhlIGJvZHkuXG4gICAgaWYgKG5ld1Bvc2l0aW9uUmVmZXJlbmNlICYmICF0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LmlzRHJhZ2dpbmcobmV3UG9zaXRpb25SZWZlcmVuY2UpKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gbmV3UG9zaXRpb25SZWZlcmVuY2UuZ2V0Um9vdEVsZW1lbnQoKTtcbiAgICAgIGVsZW1lbnQucGFyZW50RWxlbWVudCEuaW5zZXJ0QmVmb3JlKHBsYWNlaG9sZGVyLCBlbGVtZW50KTtcbiAgICAgIGFjdGl2ZURyYWdnYWJsZXMuc3BsaWNlKG5ld0luZGV4LCAwLCBpdGVtKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpLmFwcGVuZENoaWxkKHBsYWNlaG9sZGVyKTtcbiAgICAgIGFjdGl2ZURyYWdnYWJsZXMucHVzaChpdGVtKTtcbiAgICB9XG5cbiAgICAvLyBUaGUgdHJhbnNmb3JtIG5lZWRzIHRvIGJlIGNsZWFyZWQgc28gaXQgZG9lc24ndCB0aHJvdyBvZmYgdGhlIG1lYXN1cmVtZW50cy5cbiAgICBwbGFjZWhvbGRlci5zdHlsZS50cmFuc2Zvcm0gPSAnJztcblxuICAgIC8vIE5vdGUgdGhhdCB0aGUgcG9zaXRpb25zIHdlcmUgYWxyZWFkeSBjYWNoZWQgd2hlbiB3ZSBjYWxsZWQgYHN0YXJ0YCBhYm92ZSxcbiAgICAvLyBidXQgd2UgbmVlZCB0byByZWZyZXNoIHRoZW0gc2luY2UgdGhlIGFtb3VudCBvZiBpdGVtcyBoYXMgY2hhbmdlZC5cbiAgICB0aGlzLl9jYWNoZUl0ZW1Qb3NpdGlvbnMoKTtcbiAgICB0aGlzLmVudGVyZWQubmV4dCh7aXRlbSwgY29udGFpbmVyOiB0aGlzLCBjdXJyZW50SW5kZXg6IHRoaXMuZ2V0SXRlbUluZGV4KGl0ZW0pfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhbiBpdGVtIGZyb20gdGhlIGNvbnRhaW5lciBhZnRlciBpdCB3YXMgZHJhZ2dlZCBpbnRvIGFub3RoZXIgY29udGFpbmVyIGJ5IHRoZSB1c2VyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRoYXQgd2FzIGRyYWdnZWQgb3V0LlxuICAgKi9cbiAgZXhpdChpdGVtOiBEcmFnUmVmKTogdm9pZCB7XG4gICAgdGhpcy5fcmVzZXQoKTtcbiAgICB0aGlzLmV4aXRlZC5uZXh0KHtpdGVtLCBjb250YWluZXI6IHRoaXN9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEcm9wcyBhbiBpdGVtIGludG8gdGhpcyBjb250YWluZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gYmVpbmcgZHJvcHBlZCBpbnRvIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSBjdXJyZW50SW5kZXggSW5kZXggYXQgd2hpY2ggdGhlIGl0ZW0gc2hvdWxkIGJlIGluc2VydGVkLlxuICAgKiBAcGFyYW0gcHJldmlvdXNDb250YWluZXIgQ29udGFpbmVyIGZyb20gd2hpY2ggdGhlIGl0ZW0gZ290IGRyYWdnZWQgaW4uXG4gICAqIEBwYXJhbSBpc1BvaW50ZXJPdmVyQ29udGFpbmVyIFdoZXRoZXIgdGhlIHVzZXIncyBwb2ludGVyIHdhcyBvdmVyIHRoZVxuICAgKiAgICBjb250YWluZXIgd2hlbiB0aGUgaXRlbSB3YXMgZHJvcHBlZC5cbiAgICogQHBhcmFtIGRpc3RhbmNlIERpc3RhbmNlIHRoZSB1c2VyIGhhcyBkcmFnZ2VkIHNpbmNlIHRoZSBzdGFydCBvZiB0aGUgZHJhZ2dpbmcgc2VxdWVuY2UuXG4gICAqIEBwYXJhbSBwcmV2aW91c0luZGV4IEluZGV4IG9mIHRoZSBpdGVtIHdoZW4gZHJhZ2dpbmcgc3RhcnRlZC5cbiAgICpcbiAgICogQGJyZWFraW5nLWNoYW5nZSAxMS4wLjAgYHByZXZpb3VzSW5kZXhgIHBhcmFtZXRlciB0byBiZWNvbWUgcmVxdWlyZWQuXG4gICAqL1xuICBkcm9wKGl0ZW06IERyYWdSZWYsIGN1cnJlbnRJbmRleDogbnVtYmVyLCBwcmV2aW91c0NvbnRhaW5lcjogRHJvcExpc3RSZWYsXG4gICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcjogYm9vbGVhbiwgZGlzdGFuY2U6IFBvaW50LCBwcmV2aW91c0luZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy5fcmVzZXQoKTtcblxuICAgIC8vIEBicmVha2luZy1jaGFuZ2UgMTEuMC4wIFJlbW92ZSB0aGlzIGZhbGxiYWNrIGxvZ2ljIG9uY2UgYHByZXZpb3VzSW5kZXhgIGlzIGEgcmVxdWlyZWQgcGFyYW0uXG4gICAgaWYgKHByZXZpb3VzSW5kZXggPT0gbnVsbCkge1xuICAgICAgcHJldmlvdXNJbmRleCA9IHByZXZpb3VzQ29udGFpbmVyLmdldEl0ZW1JbmRleChpdGVtKTtcbiAgICB9XG5cbiAgICB0aGlzLmRyb3BwZWQubmV4dCh7aXRlbSxcbiAgICAgIGN1cnJlbnRJbmRleCxcbiAgICAgIHByZXZpb3VzSW5kZXgsXG4gICAgICBjb250YWluZXI6IHRoaXMsXG4gICAgICBwcmV2aW91c0NvbnRhaW5lcixcbiAgICAgIGlzUG9pbnRlck92ZXJDb250YWluZXIsXG4gICAgICBkaXN0YW5jZVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGRyYWdnYWJsZSBpdGVtcyB0aGF0IGFyZSBhIHBhcnQgb2YgdGhpcyBsaXN0LlxuICAgKiBAcGFyYW0gaXRlbXMgSXRlbXMgdGhhdCBhcmUgYSBwYXJ0IG9mIHRoaXMgbGlzdC5cbiAgICovXG4gIHdpdGhJdGVtcyhpdGVtczogRHJhZ1JlZltdKTogdGhpcyB7XG4gICAgdGhpcy5fZHJhZ2dhYmxlcyA9IGl0ZW1zO1xuICAgIGl0ZW1zLmZvckVhY2goaXRlbSA9PiBpdGVtLl93aXRoRHJvcENvbnRhaW5lcih0aGlzKSk7XG5cbiAgICBpZiAodGhpcy5pc0RyYWdnaW5nKCkpIHtcbiAgICAgIHRoaXMuX2NhY2hlSXRlbXMoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBsYXlvdXQgZGlyZWN0aW9uIG9mIHRoZSBkcm9wIGxpc3QuICovXG4gIHdpdGhEaXJlY3Rpb24oZGlyZWN0aW9uOiBEaXJlY3Rpb24pOiB0aGlzIHtcbiAgICB0aGlzLl9kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY29udGFpbmVycyB0aGF0IGFyZSBjb25uZWN0ZWQgdG8gdGhpcyBvbmUuIFdoZW4gdHdvIG9yIG1vcmUgY29udGFpbmVycyBhcmVcbiAgICogY29ubmVjdGVkLCB0aGUgdXNlciB3aWxsIGJlIGFsbG93ZWQgdG8gdHJhbnNmZXIgaXRlbXMgYmV0d2VlbiB0aGVtLlxuICAgKiBAcGFyYW0gY29ubmVjdGVkVG8gT3RoZXIgY29udGFpbmVycyB0aGF0IHRoZSBjdXJyZW50IGNvbnRhaW5lcnMgc2hvdWxkIGJlIGNvbm5lY3RlZCB0by5cbiAgICovXG4gIGNvbm5lY3RlZFRvKGNvbm5lY3RlZFRvOiBEcm9wTGlzdFJlZltdKTogdGhpcyB7XG4gICAgdGhpcy5fc2libGluZ3MgPSBjb25uZWN0ZWRUby5zbGljZSgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG9yaWVudGF0aW9uIG9mIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSBvcmllbnRhdGlvbiBOZXcgb3JpZW50YXRpb24gZm9yIHRoZSBjb250YWluZXIuXG4gICAqL1xuICB3aXRoT3JpZW50YXRpb24ob3JpZW50YXRpb246ICd2ZXJ0aWNhbCcgfCAnaG9yaXpvbnRhbCcpOiB0aGlzIHtcbiAgICB0aGlzLl9vcmllbnRhdGlvbiA9IG9yaWVudGF0aW9uO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgd2hpY2ggcGFyZW50IGVsZW1lbnRzIGFyZSBjYW4gYmUgc2Nyb2xsZWQgd2hpbGUgdGhlIHVzZXIgaXMgZHJhZ2dpbmcuXG4gICAqIEBwYXJhbSBlbGVtZW50cyBFbGVtZW50cyB0aGF0IGNhbiBiZSBzY3JvbGxlZC5cbiAgICovXG4gIHdpdGhTY3JvbGxhYmxlUGFyZW50cyhlbGVtZW50czogSFRNTEVsZW1lbnRbXSk6IHRoaXMge1xuICAgIGNvbnN0IGVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KHRoaXMuZWxlbWVudCk7XG5cbiAgICAvLyBXZSBhbHdheXMgYWxsb3cgdGhlIGN1cnJlbnQgZWxlbWVudCB0byBiZSBzY3JvbGxhYmxlXG4gICAgLy8gc28gd2UgbmVlZCB0byBlbnN1cmUgdGhhdCBpdCdzIGluIHRoZSBhcnJheS5cbiAgICB0aGlzLl9zY3JvbGxhYmxlRWxlbWVudHMgPVxuICAgICAgICBlbGVtZW50cy5pbmRleE9mKGVsZW1lbnQpID09PSAtMSA/IFtlbGVtZW50LCAuLi5lbGVtZW50c10gOiBlbGVtZW50cy5zbGljZSgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpZ3VyZXMgb3V0IHRoZSBpbmRleCBvZiBhbiBpdGVtIGluIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gd2hvc2UgaW5kZXggc2hvdWxkIGJlIGRldGVybWluZWQuXG4gICAqL1xuICBnZXRJdGVtSW5kZXgoaXRlbTogRHJhZ1JlZik6IG51bWJlciB7XG4gICAgaWYgKCF0aGlzLl9pc0RyYWdnaW5nKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZHJhZ2dhYmxlcy5pbmRleE9mKGl0ZW0pO1xuICAgIH1cblxuICAgIC8vIEl0ZW1zIGFyZSBzb3J0ZWQgYWx3YXlzIGJ5IHRvcC9sZWZ0IGluIHRoZSBjYWNoZSwgaG93ZXZlciB0aGV5IGZsb3cgZGlmZmVyZW50bHkgaW4gUlRMLlxuICAgIC8vIFRoZSByZXN0IG9mIHRoZSBsb2dpYyBzdGlsbCBzdGFuZHMgbm8gbWF0dGVyIHdoYXQgb3JpZW50YXRpb24gd2UncmUgaW4sIGhvd2V2ZXJcbiAgICAvLyB3ZSBuZWVkIHRvIGludmVydCB0aGUgYXJyYXkgd2hlbiBkZXRlcm1pbmluZyB0aGUgaW5kZXguXG4gICAgY29uc3QgaXRlbXMgPSB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnICYmIHRoaXMuX2RpcmVjdGlvbiA9PT0gJ3J0bCcgP1xuICAgICAgICB0aGlzLl9pdGVtUG9zaXRpb25zLnNsaWNlKCkucmV2ZXJzZSgpIDogdGhpcy5faXRlbVBvc2l0aW9ucztcblxuICAgIHJldHVybiBmaW5kSW5kZXgoaXRlbXMsIGN1cnJlbnRJdGVtID0+IGN1cnJlbnRJdGVtLmRyYWcgPT09IGl0ZW0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGxpc3QgaXMgYWJsZSB0byByZWNlaXZlIHRoZSBpdGVtIHRoYXRcbiAgICogaXMgY3VycmVudGx5IGJlaW5nIGRyYWdnZWQgaW5zaWRlIGEgY29ubmVjdGVkIGRyb3AgbGlzdC5cbiAgICovXG4gIGlzUmVjZWl2aW5nKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9hY3RpdmVTaWJsaW5ncy5zaXplID4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTb3J0cyBhbiBpdGVtIGluc2lkZSB0aGUgY29udGFpbmVyIGJhc2VkIG9uIGl0cyBwb3NpdGlvbi5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB0byBiZSBzb3J0ZWQuXG4gICAqIEBwYXJhbSBwb2ludGVyWCBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0gcG9pbnRlclkgUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFkgYXhpcy5cbiAgICogQHBhcmFtIHBvaW50ZXJEZWx0YSBEaXJlY3Rpb24gaW4gd2hpY2ggdGhlIHBvaW50ZXIgaXMgbW92aW5nIGFsb25nIGVhY2ggYXhpcy5cbiAgICovXG4gIF9zb3J0SXRlbShpdGVtOiBEcmFnUmVmLCBwb2ludGVyWDogbnVtYmVyLCBwb2ludGVyWTogbnVtYmVyLFxuICAgICAgICAgICAgcG9pbnRlckRlbHRhOiB7eDogbnVtYmVyLCB5OiBudW1iZXJ9KTogdm9pZCB7XG4gICAgLy8gRG9uJ3Qgc29ydCB0aGUgaXRlbSBpZiBzb3J0aW5nIGlzIGRpc2FibGVkIG9yIGl0J3Mgb3V0IG9mIHJhbmdlLlxuICAgIGlmICh0aGlzLnNvcnRpbmdEaXNhYmxlZCB8fCAhaXNQb2ludGVyTmVhckNsaWVudFJlY3QodGhpcy5fY2xpZW50UmVjdCwgcG9pbnRlclgsIHBvaW50ZXJZKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNpYmxpbmdzID0gdGhpcy5faXRlbVBvc2l0aW9ucztcbiAgICBjb25zdCBuZXdJbmRleCA9IHRoaXMuX2dldEl0ZW1JbmRleEZyb21Qb2ludGVyUG9zaXRpb24oaXRlbSwgcG9pbnRlclgsIHBvaW50ZXJZLCBwb2ludGVyRGVsdGEpO1xuXG4gICAgaWYgKG5ld0luZGV4ID09PSAtMSAmJiBzaWJsaW5ncy5sZW5ndGggPiAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gdGhpcy5fb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJztcbiAgICBjb25zdCBjdXJyZW50SW5kZXggPSBmaW5kSW5kZXgoc2libGluZ3MsIGN1cnJlbnRJdGVtID0+IGN1cnJlbnRJdGVtLmRyYWcgPT09IGl0ZW0pO1xuICAgIGNvbnN0IHNpYmxpbmdBdE5ld1Bvc2l0aW9uID0gc2libGluZ3NbbmV3SW5kZXhdO1xuICAgIGNvbnN0IGN1cnJlbnRQb3NpdGlvbiA9IHNpYmxpbmdzW2N1cnJlbnRJbmRleF0uY2xpZW50UmVjdDtcbiAgICBjb25zdCBuZXdQb3NpdGlvbiA9IHNpYmxpbmdBdE5ld1Bvc2l0aW9uLmNsaWVudFJlY3Q7XG4gICAgY29uc3QgZGVsdGEgPSBjdXJyZW50SW5kZXggPiBuZXdJbmRleCA/IDEgOiAtMTtcblxuICAgIHRoaXMuX3ByZXZpb3VzU3dhcC5kcmFnID0gc2libGluZ0F0TmV3UG9zaXRpb24uZHJhZztcbiAgICB0aGlzLl9wcmV2aW91c1N3YXAuZGVsdGEgPSBpc0hvcml6b250YWwgPyBwb2ludGVyRGVsdGEueCA6IHBvaW50ZXJEZWx0YS55O1xuXG4gICAgLy8gSG93IG1hbnkgcGl4ZWxzIHRoZSBpdGVtJ3MgcGxhY2Vob2xkZXIgc2hvdWxkIGJlIG9mZnNldC5cbiAgICBjb25zdCBpdGVtT2Zmc2V0ID0gdGhpcy5fZ2V0SXRlbU9mZnNldFB4KGN1cnJlbnRQb3NpdGlvbiwgbmV3UG9zaXRpb24sIGRlbHRhKTtcblxuICAgIC8vIEhvdyBtYW55IHBpeGVscyBhbGwgdGhlIG90aGVyIGl0ZW1zIHNob3VsZCBiZSBvZmZzZXQuXG4gICAgY29uc3Qgc2libGluZ09mZnNldCA9IHRoaXMuX2dldFNpYmxpbmdPZmZzZXRQeChjdXJyZW50SW5kZXgsIHNpYmxpbmdzLCBkZWx0YSk7XG5cbiAgICAvLyBTYXZlIHRoZSBwcmV2aW91cyBvcmRlciBvZiB0aGUgaXRlbXMgYmVmb3JlIG1vdmluZyB0aGUgaXRlbSB0byBpdHMgbmV3IGluZGV4LlxuICAgIC8vIFdlIHVzZSB0aGlzIHRvIGNoZWNrIHdoZXRoZXIgYW4gaXRlbSBoYXMgYmVlbiBtb3ZlZCBhcyBhIHJlc3VsdCBvZiB0aGUgc29ydGluZy5cbiAgICBjb25zdCBvbGRPcmRlciA9IHNpYmxpbmdzLnNsaWNlKCk7XG5cbiAgICAvLyBTaHVmZmxlIHRoZSBhcnJheSBpbiBwbGFjZS5cbiAgICBtb3ZlSXRlbUluQXJyYXkoc2libGluZ3MsIGN1cnJlbnRJbmRleCwgbmV3SW5kZXgpO1xuXG4gICAgdGhpcy5zb3J0ZWQubmV4dCh7XG4gICAgICBwcmV2aW91c0luZGV4OiBjdXJyZW50SW5kZXgsXG4gICAgICBjdXJyZW50SW5kZXg6IG5ld0luZGV4LFxuICAgICAgY29udGFpbmVyOiB0aGlzLFxuICAgICAgaXRlbVxuICAgIH0pO1xuXG4gICAgc2libGluZ3MuZm9yRWFjaCgoc2libGluZywgaW5kZXgpID0+IHtcbiAgICAgIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIHRoZSBwb3NpdGlvbiBoYXNuJ3QgY2hhbmdlZC5cbiAgICAgIGlmIChvbGRPcmRlcltpbmRleF0gPT09IHNpYmxpbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpc0RyYWdnZWRJdGVtID0gc2libGluZy5kcmFnID09PSBpdGVtO1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gaXNEcmFnZ2VkSXRlbSA/IGl0ZW1PZmZzZXQgOiBzaWJsaW5nT2Zmc2V0O1xuICAgICAgY29uc3QgZWxlbWVudFRvT2Zmc2V0ID0gaXNEcmFnZ2VkSXRlbSA/IGl0ZW0uZ2V0UGxhY2Vob2xkZXJFbGVtZW50KCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpYmxpbmcuZHJhZy5nZXRSb290RWxlbWVudCgpO1xuXG4gICAgICAvLyBVcGRhdGUgdGhlIG9mZnNldCB0byByZWZsZWN0IHRoZSBuZXcgcG9zaXRpb24uXG4gICAgICBzaWJsaW5nLm9mZnNldCArPSBvZmZzZXQ7XG5cbiAgICAgIC8vIFNpbmNlIHdlJ3JlIG1vdmluZyB0aGUgaXRlbXMgd2l0aCBhIGB0cmFuc2Zvcm1gLCB3ZSBuZWVkIHRvIGFkanVzdCB0aGVpciBjYWNoZWRcbiAgICAgIC8vIGNsaWVudCByZWN0cyB0byByZWZsZWN0IHRoZWlyIG5ldyBwb3NpdGlvbiwgYXMgd2VsbCBhcyBzd2FwIHRoZWlyIHBvc2l0aW9ucyBpbiB0aGUgY2FjaGUuXG4gICAgICAvLyBOb3RlIHRoYXQgd2Ugc2hvdWxkbid0IHVzZSBgZ2V0Qm91bmRpbmdDbGllbnRSZWN0YCBoZXJlIHRvIHVwZGF0ZSB0aGUgY2FjaGUsIGJlY2F1c2UgdGhlXG4gICAgICAvLyBlbGVtZW50cyBtYXkgYmUgbWlkLWFuaW1hdGlvbiB3aGljaCB3aWxsIGdpdmUgdXMgYSB3cm9uZyByZXN1bHQuXG4gICAgICBpZiAoaXNIb3Jpem9udGFsKSB7XG4gICAgICAgIC8vIFJvdW5kIHRoZSB0cmFuc2Zvcm1zIHNpbmNlIHNvbWUgYnJvd3NlcnMgd2lsbFxuICAgICAgICAvLyBibHVyIHRoZSBlbGVtZW50cywgZm9yIHN1Yi1waXhlbCB0cmFuc2Zvcm1zLlxuICAgICAgICBlbGVtZW50VG9PZmZzZXQuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZTNkKCR7TWF0aC5yb3VuZChzaWJsaW5nLm9mZnNldCl9cHgsIDAsIDApYDtcbiAgICAgICAgYWRqdXN0Q2xpZW50UmVjdChzaWJsaW5nLmNsaWVudFJlY3QsIDAsIG9mZnNldCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbGVtZW50VG9PZmZzZXQuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZTNkKDAsICR7TWF0aC5yb3VuZChzaWJsaW5nLm9mZnNldCl9cHgsIDApYDtcbiAgICAgICAgYWRqdXN0Q2xpZW50UmVjdChzaWJsaW5nLmNsaWVudFJlY3QsIG9mZnNldCwgMCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIHVzZXIncyBwb2ludGVyIGlzIGNsb3NlIHRvIHRoZSBlZGdlcyBvZiBlaXRoZXIgdGhlXG4gICAqIHZpZXdwb3J0IG9yIHRoZSBkcm9wIGxpc3QgYW5kIHN0YXJ0cyB0aGUgYXV0by1zY3JvbGwgc2VxdWVuY2UuXG4gICAqIEBwYXJhbSBwb2ludGVyWCBVc2VyJ3MgcG9pbnRlciBwb3NpdGlvbiBhbG9uZyB0aGUgeCBheGlzLlxuICAgKiBAcGFyYW0gcG9pbnRlclkgVXNlcidzIHBvaW50ZXIgcG9zaXRpb24gYWxvbmcgdGhlIHkgYXhpcy5cbiAgICovXG4gIF9zdGFydFNjcm9sbGluZ0lmTmVjZXNzYXJ5KHBvaW50ZXJYOiBudW1iZXIsIHBvaW50ZXJZOiBudW1iZXIpIHtcbiAgICBpZiAodGhpcy5hdXRvU2Nyb2xsRGlzYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgc2Nyb2xsTm9kZTogSFRNTEVsZW1lbnQgfCBXaW5kb3cgfCB1bmRlZmluZWQ7XG4gICAgbGV0IHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLk5PTkU7XG4gICAgbGV0IGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5OT05FO1xuXG4gICAgLy8gQ2hlY2sgd2hldGhlciB3ZSBzaG91bGQgc3RhcnQgc2Nyb2xsaW5nIGFueSBvZiB0aGUgcGFyZW50IGNvbnRhaW5lcnMuXG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLmZvckVhY2goKHBvc2l0aW9uLCBlbGVtZW50KSA9PiB7XG4gICAgICAvLyBXZSBoYXZlIHNwZWNpYWwgaGFuZGxpbmcgZm9yIHRoZSBgZG9jdW1lbnRgIGJlbG93LiBBbHNvIHRoaXMgd291bGQgYmVcbiAgICAgIC8vIG5pY2VyIHdpdGggYSAgZm9yLi4ub2YgbG9vcCwgYnV0IGl0IHJlcXVpcmVzIGNoYW5naW5nIGEgY29tcGlsZXIgZmxhZy5cbiAgICAgIGlmIChlbGVtZW50ID09PSB0aGlzLl9kb2N1bWVudCB8fCAhcG9zaXRpb24uY2xpZW50UmVjdCB8fCBzY3JvbGxOb2RlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGlzUG9pbnRlck5lYXJDbGllbnRSZWN0KHBvc2l0aW9uLmNsaWVudFJlY3QsIHBvaW50ZXJYLCBwb2ludGVyWSkpIHtcbiAgICAgICAgW3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uLCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uXSA9IGdldEVsZW1lbnRTY3JvbGxEaXJlY3Rpb25zKFxuICAgICAgICAgICAgZWxlbWVudCBhcyBIVE1MRWxlbWVudCwgcG9zaXRpb24uY2xpZW50UmVjdCwgcG9pbnRlclgsIHBvaW50ZXJZKTtcblxuICAgICAgICBpZiAodmVydGljYWxTY3JvbGxEaXJlY3Rpb24gfHwgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbikge1xuICAgICAgICAgIHNjcm9sbE5vZGUgPSBlbGVtZW50IGFzIEhUTUxFbGVtZW50O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBPdGhlcndpc2UgY2hlY2sgaWYgd2UgY2FuIHN0YXJ0IHNjcm9sbGluZyB0aGUgdmlld3BvcnQuXG4gICAgaWYgKCF2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiAmJiAhaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbikge1xuICAgICAgY29uc3Qge3dpZHRoLCBoZWlnaHR9ID0gdGhpcy5fdmlld3BvcnRSdWxlci5nZXRWaWV3cG9ydFNpemUoKTtcbiAgICAgIGNvbnN0IGNsaWVudFJlY3QgPSB7d2lkdGgsIGhlaWdodCwgdG9wOiAwLCByaWdodDogd2lkdGgsIGJvdHRvbTogaGVpZ2h0LCBsZWZ0OiAwfTtcbiAgICAgIHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gZ2V0VmVydGljYWxTY3JvbGxEaXJlY3Rpb24oY2xpZW50UmVjdCwgcG9pbnRlclkpO1xuICAgICAgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IGdldEhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24oY2xpZW50UmVjdCwgcG9pbnRlclgpO1xuICAgICAgc2Nyb2xsTm9kZSA9IHdpbmRvdztcbiAgICB9XG5cbiAgICBpZiAoc2Nyb2xsTm9kZSAmJiAodmVydGljYWxTY3JvbGxEaXJlY3Rpb24gIT09IHRoaXMuX3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uIHx8XG4gICAgICAgIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gIT09IHRoaXMuX2hvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gfHxcbiAgICAgICAgc2Nyb2xsTm9kZSAhPT0gdGhpcy5fc2Nyb2xsTm9kZSkpIHtcbiAgICAgIHRoaXMuX3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gdmVydGljYWxTY3JvbGxEaXJlY3Rpb247XG4gICAgICB0aGlzLl9ob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbjtcbiAgICAgIHRoaXMuX3Njcm9sbE5vZGUgPSBzY3JvbGxOb2RlO1xuXG4gICAgICBpZiAoKHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uIHx8IGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24pICYmIHNjcm9sbE5vZGUpIHtcbiAgICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKHRoaXMuX3N0YXJ0U2Nyb2xsSW50ZXJ2YWwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fc3RvcFNjcm9sbGluZygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBTdG9wcyBhbnkgY3VycmVudGx5LXJ1bm5pbmcgYXV0by1zY3JvbGwgc2VxdWVuY2VzLiAqL1xuICBfc3RvcFNjcm9sbGluZygpIHtcbiAgICB0aGlzLl9zdG9wU2Nyb2xsVGltZXJzLm5leHQoKTtcbiAgfVxuXG4gIC8qKiBDYWNoZXMgdGhlIHBvc2l0aW9ucyBvZiB0aGUgY29uZmlndXJlZCBzY3JvbGxhYmxlIHBhcmVudHMuICovXG4gIHByaXZhdGUgX2NhY2hlUGFyZW50UG9zaXRpb25zKCkge1xuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5jbGVhcigpO1xuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5zZXQodGhpcy5fZG9jdW1lbnQsIHtcbiAgICAgIHNjcm9sbFBvc2l0aW9uOiB0aGlzLl92aWV3cG9ydFJ1bGVyIS5nZXRWaWV3cG9ydFNjcm9sbFBvc2l0aW9uKCksXG4gICAgfSk7XG4gICAgdGhpcy5fc2Nyb2xsYWJsZUVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICBjb25zdCBjbGllbnRSZWN0ID0gZ2V0TXV0YWJsZUNsaWVudFJlY3QoZWxlbWVudCk7XG5cbiAgICAgIC8vIFdlIGtlZXAgdGhlIENsaWVudFJlY3QgY2FjaGVkIGluIHR3byBwcm9wZXJ0aWVzLCBiZWNhdXNlIGl0J3MgcmVmZXJlbmNlZCBpbiBhIGxvdCBvZlxuICAgICAgLy8gcGVyZm9ybWFuY2Utc2Vuc2l0aXZlIHBsYWNlcyBhbmQgd2Ugd2FudCB0byBhdm9pZCB0aGUgZXh0cmEgbG9va3Vwcy4gVGhlIGBlbGVtZW50YCBpc1xuICAgICAgLy8gZ3VhcmFudGVlZCB0byBhbHdheXMgYmUgaW4gdGhlIGBfc2Nyb2xsYWJsZUVsZW1lbnRzYCBzbyB0aGlzIHNob3VsZCBhbHdheXMgbWF0Y2guXG4gICAgICBpZiAoZWxlbWVudCA9PT0gdGhpcy5lbGVtZW50KSB7XG4gICAgICAgIHRoaXMuX2NsaWVudFJlY3QgPSBjbGllbnRSZWN0O1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuc2V0KGVsZW1lbnQsIHtcbiAgICAgICAgc2Nyb2xsUG9zaXRpb246IHt0b3A6IGVsZW1lbnQuc2Nyb2xsVG9wLCBsZWZ0OiBlbGVtZW50LnNjcm9sbExlZnR9LFxuICAgICAgICBjbGllbnRSZWN0XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBSZWZyZXNoZXMgdGhlIHBvc2l0aW9uIGNhY2hlIG9mIHRoZSBpdGVtcyBhbmQgc2libGluZyBjb250YWluZXJzLiAqL1xuICBwcml2YXRlIF9jYWNoZUl0ZW1Qb3NpdGlvbnMoKSB7XG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gdGhpcy5fb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJztcblxuICAgIHRoaXMuX2l0ZW1Qb3NpdGlvbnMgPSB0aGlzLl9hY3RpdmVEcmFnZ2FibGVzLm1hcChkcmFnID0+IHtcbiAgICAgIGNvbnN0IGVsZW1lbnRUb01lYXN1cmUgPSBkcmFnLmdldFZpc2libGVFbGVtZW50KCk7XG4gICAgICByZXR1cm4ge2RyYWcsIG9mZnNldDogMCwgY2xpZW50UmVjdDogZ2V0TXV0YWJsZUNsaWVudFJlY3QoZWxlbWVudFRvTWVhc3VyZSl9O1xuICAgIH0pLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgIHJldHVybiBpc0hvcml6b250YWwgPyBhLmNsaWVudFJlY3QubGVmdCAtIGIuY2xpZW50UmVjdC5sZWZ0IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhLmNsaWVudFJlY3QudG9wIC0gYi5jbGllbnRSZWN0LnRvcDtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBSZXNldHMgdGhlIGNvbnRhaW5lciB0byBpdHMgaW5pdGlhbCBzdGF0ZS4gKi9cbiAgcHJpdmF0ZSBfcmVzZXQoKSB7XG4gICAgdGhpcy5faXNEcmFnZ2luZyA9IGZhbHNlO1xuXG4gICAgY29uc3Qgc3R5bGVzID0gY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpLnN0eWxlO1xuICAgIChzdHlsZXMgYXMgYW55KS5zY3JvbGxTbmFwVHlwZSA9IHN0eWxlcy5tc1Njcm9sbFNuYXBUeXBlID0gdGhpcy5faW5pdGlhbFNjcm9sbFNuYXA7XG5cbiAgICAvLyBUT0RPKGNyaXNiZXRvKTogbWF5IGhhdmUgdG8gd2FpdCBmb3IgdGhlIGFuaW1hdGlvbnMgdG8gZmluaXNoLlxuICAgIHRoaXMuX2FjdGl2ZURyYWdnYWJsZXMuZm9yRWFjaChpdGVtID0+IGl0ZW0uZ2V0Um9vdEVsZW1lbnQoKS5zdHlsZS50cmFuc2Zvcm0gPSAnJyk7XG4gICAgdGhpcy5fc2libGluZ3MuZm9yRWFjaChzaWJsaW5nID0+IHNpYmxpbmcuX3N0b3BSZWNlaXZpbmcodGhpcykpO1xuICAgIHRoaXMuX2FjdGl2ZURyYWdnYWJsZXMgPSBbXTtcbiAgICB0aGlzLl9pdGVtUG9zaXRpb25zID0gW107XG4gICAgdGhpcy5fcHJldmlvdXNTd2FwLmRyYWcgPSBudWxsO1xuICAgIHRoaXMuX3ByZXZpb3VzU3dhcC5kZWx0YSA9IDA7XG4gICAgdGhpcy5fc3RvcFNjcm9sbGluZygpO1xuICAgIHRoaXMuX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLmNsZWFyKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgb2Zmc2V0IGluIHBpeGVscyBieSB3aGljaCB0aGUgaXRlbXMgdGhhdCBhcmVuJ3QgYmVpbmcgZHJhZ2dlZCBzaG91bGQgYmUgbW92ZWQuXG4gICAqIEBwYXJhbSBjdXJyZW50SW5kZXggSW5kZXggb2YgdGhlIGl0ZW0gY3VycmVudGx5IGJlaW5nIGRyYWdnZWQuXG4gICAqIEBwYXJhbSBzaWJsaW5ncyBBbGwgb2YgdGhlIGl0ZW1zIGluIHRoZSBsaXN0LlxuICAgKiBAcGFyYW0gZGVsdGEgRGlyZWN0aW9uIGluIHdoaWNoIHRoZSB1c2VyIGlzIG1vdmluZy5cbiAgICovXG4gIHByaXZhdGUgX2dldFNpYmxpbmdPZmZzZXRQeChjdXJyZW50SW5kZXg6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpYmxpbmdzOiBDYWNoZWRJdGVtUG9zaXRpb25bXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhOiAxIHwgLTEpIHtcblxuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCc7XG4gICAgY29uc3QgY3VycmVudFBvc2l0aW9uID0gc2libGluZ3NbY3VycmVudEluZGV4XS5jbGllbnRSZWN0O1xuICAgIGNvbnN0IGltbWVkaWF0ZVNpYmxpbmcgPSBzaWJsaW5nc1tjdXJyZW50SW5kZXggKyBkZWx0YSAqIC0xXTtcbiAgICBsZXQgc2libGluZ09mZnNldCA9IGN1cnJlbnRQb3NpdGlvbltpc0hvcml6b250YWwgPyAnd2lkdGgnIDogJ2hlaWdodCddICogZGVsdGE7XG5cbiAgICBpZiAoaW1tZWRpYXRlU2libGluZykge1xuICAgICAgY29uc3Qgc3RhcnQgPSBpc0hvcml6b250YWwgPyAnbGVmdCcgOiAndG9wJztcbiAgICAgIGNvbnN0IGVuZCA9IGlzSG9yaXpvbnRhbCA/ICdyaWdodCcgOiAnYm90dG9tJztcblxuICAgICAgLy8gR2V0IHRoZSBzcGFjaW5nIGJldHdlZW4gdGhlIHN0YXJ0IG9mIHRoZSBjdXJyZW50IGl0ZW0gYW5kIHRoZSBlbmQgb2YgdGhlIG9uZSBpbW1lZGlhdGVseVxuICAgICAgLy8gYWZ0ZXIgaXQgaW4gdGhlIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgdXNlciBpcyBkcmFnZ2luZywgb3IgdmljZSB2ZXJzYS4gV2UgYWRkIGl0IHRvIHRoZVxuICAgICAgLy8gb2Zmc2V0IGluIG9yZGVyIHRvIHB1c2ggdGhlIGVsZW1lbnQgdG8gd2hlcmUgaXQgd2lsbCBiZSB3aGVuIGl0J3MgaW5saW5lIGFuZCBpcyBpbmZsdWVuY2VkXG4gICAgICAvLyBieSB0aGUgYG1hcmdpbmAgb2YgaXRzIHNpYmxpbmdzLlxuICAgICAgaWYgKGRlbHRhID09PSAtMSkge1xuICAgICAgICBzaWJsaW5nT2Zmc2V0IC09IGltbWVkaWF0ZVNpYmxpbmcuY2xpZW50UmVjdFtzdGFydF0gLSBjdXJyZW50UG9zaXRpb25bZW5kXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNpYmxpbmdPZmZzZXQgKz0gY3VycmVudFBvc2l0aW9uW3N0YXJ0XSAtIGltbWVkaWF0ZVNpYmxpbmcuY2xpZW50UmVjdFtlbmRdO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzaWJsaW5nT2Zmc2V0O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG9mZnNldCBpbiBwaXhlbHMgYnkgd2hpY2ggdGhlIGl0ZW0gdGhhdCBpcyBiZWluZyBkcmFnZ2VkIHNob3VsZCBiZSBtb3ZlZC5cbiAgICogQHBhcmFtIGN1cnJlbnRQb3NpdGlvbiBDdXJyZW50IHBvc2l0aW9uIG9mIHRoZSBpdGVtLlxuICAgKiBAcGFyYW0gbmV3UG9zaXRpb24gUG9zaXRpb24gb2YgdGhlIGl0ZW0gd2hlcmUgdGhlIGN1cnJlbnQgaXRlbSBzaG91bGQgYmUgbW92ZWQuXG4gICAqIEBwYXJhbSBkZWx0YSBEaXJlY3Rpb24gaW4gd2hpY2ggdGhlIHVzZXIgaXMgbW92aW5nLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0SXRlbU9mZnNldFB4KGN1cnJlbnRQb3NpdGlvbjogQ2xpZW50UmVjdCwgbmV3UG9zaXRpb246IENsaWVudFJlY3QsIGRlbHRhOiAxIHwgLTEpIHtcbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuICAgIGxldCBpdGVtT2Zmc2V0ID0gaXNIb3Jpem9udGFsID8gbmV3UG9zaXRpb24ubGVmdCAtIGN1cnJlbnRQb3NpdGlvbi5sZWZ0IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1Bvc2l0aW9uLnRvcCAtIGN1cnJlbnRQb3NpdGlvbi50b3A7XG5cbiAgICAvLyBBY2NvdW50IGZvciBkaWZmZXJlbmNlcyBpbiB0aGUgaXRlbSB3aWR0aC9oZWlnaHQuXG4gICAgaWYgKGRlbHRhID09PSAtMSkge1xuICAgICAgaXRlbU9mZnNldCArPSBpc0hvcml6b250YWwgPyBuZXdQb3NpdGlvbi53aWR0aCAtIGN1cnJlbnRQb3NpdGlvbi53aWR0aCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1Bvc2l0aW9uLmhlaWdodCAtIGN1cnJlbnRQb3NpdGlvbi5oZWlnaHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIGl0ZW1PZmZzZXQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW5kZXggb2YgYW4gaXRlbSBpbiB0aGUgZHJvcCBjb250YWluZXIsIGJhc2VkIG9uIHRoZSBwb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdGhhdCBpcyBiZWluZyBzb3J0ZWQuXG4gICAqIEBwYXJhbSBwb2ludGVyWCBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHBvaW50ZXJZIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgWSBheGlzLlxuICAgKiBAcGFyYW0gZGVsdGEgRGlyZWN0aW9uIGluIHdoaWNoIHRoZSB1c2VyIGlzIG1vdmluZyB0aGVpciBwb2ludGVyLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0SXRlbUluZGV4RnJvbVBvaW50ZXJQb3NpdGlvbihpdGVtOiBEcmFnUmVmLCBwb2ludGVyWDogbnVtYmVyLCBwb2ludGVyWTogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhPzoge3g6IG51bWJlciwgeTogbnVtYmVyfSkge1xuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCc7XG5cbiAgICByZXR1cm4gZmluZEluZGV4KHRoaXMuX2l0ZW1Qb3NpdGlvbnMsICh7ZHJhZywgY2xpZW50UmVjdH0sIF8sIGFycmF5KSA9PiB7XG4gICAgICBpZiAoZHJhZyA9PT0gaXRlbSkge1xuICAgICAgICAvLyBJZiB0aGVyZSdzIG9ubHkgb25lIGl0ZW0gbGVmdCBpbiB0aGUgY29udGFpbmVyLCBpdCBtdXN0IGJlXG4gICAgICAgIC8vIHRoZSBkcmFnZ2VkIGl0ZW0gaXRzZWxmIHNvIHdlIHVzZSBpdCBhcyBhIHJlZmVyZW5jZS5cbiAgICAgICAgcmV0dXJuIGFycmF5Lmxlbmd0aCA8IDI7XG4gICAgICB9XG5cbiAgICAgIGlmIChkZWx0YSkge1xuICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSBpc0hvcml6b250YWwgPyBkZWx0YS54IDogZGVsdGEueTtcblxuICAgICAgICAvLyBJZiB0aGUgdXNlciBpcyBzdGlsbCBob3ZlcmluZyBvdmVyIHRoZSBzYW1lIGl0ZW0gYXMgbGFzdCB0aW1lLCBhbmQgdGhleSBkaWRuJ3QgY2hhbmdlXG4gICAgICAgIC8vIHRoZSBkaXJlY3Rpb24gaW4gd2hpY2ggdGhleSdyZSBkcmFnZ2luZywgd2UgZG9uJ3QgY29uc2lkZXIgaXQgYSBkaXJlY3Rpb24gc3dhcC5cbiAgICAgICAgaWYgKGRyYWcgPT09IHRoaXMuX3ByZXZpb3VzU3dhcC5kcmFnICYmIGRpcmVjdGlvbiA9PT0gdGhpcy5fcHJldmlvdXNTd2FwLmRlbHRhKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBpc0hvcml6b250YWwgP1xuICAgICAgICAgIC8vIFJvdW5kIHRoZXNlIGRvd24gc2luY2UgbW9zdCBicm93c2VycyByZXBvcnQgY2xpZW50IHJlY3RzIHdpdGhcbiAgICAgICAgICAvLyBzdWItcGl4ZWwgcHJlY2lzaW9uLCB3aGVyZWFzIHRoZSBwb2ludGVyIGNvb3JkaW5hdGVzIGFyZSByb3VuZGVkIHRvIHBpeGVscy5cbiAgICAgICAgICBwb2ludGVyWCA+PSBNYXRoLmZsb29yKGNsaWVudFJlY3QubGVmdCkgJiYgcG9pbnRlclggPD0gTWF0aC5mbG9vcihjbGllbnRSZWN0LnJpZ2h0KSA6XG4gICAgICAgICAgcG9pbnRlclkgPj0gTWF0aC5mbG9vcihjbGllbnRSZWN0LnRvcCkgJiYgcG9pbnRlclkgPD0gTWF0aC5mbG9vcihjbGllbnRSZWN0LmJvdHRvbSk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogQ2FjaGVzIHRoZSBjdXJyZW50IGl0ZW1zIGluIHRoZSBsaXN0IGFuZCB0aGVpciBwb3NpdGlvbnMuICovXG4gIHByaXZhdGUgX2NhY2hlSXRlbXMoKTogdm9pZCB7XG4gICAgdGhpcy5fYWN0aXZlRHJhZ2dhYmxlcyA9IHRoaXMuX2RyYWdnYWJsZXMuc2xpY2UoKTtcbiAgICB0aGlzLl9jYWNoZUl0ZW1Qb3NpdGlvbnMoKTtcbiAgICB0aGlzLl9jYWNoZVBhcmVudFBvc2l0aW9ucygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGludGVybmFsIHN0YXRlIG9mIHRoZSBjb250YWluZXIgYWZ0ZXIgYSBzY3JvbGwgZXZlbnQgaGFzIGhhcHBlbmVkLlxuICAgKiBAcGFyYW0gc2Nyb2xsZWRQYXJlbnQgRWxlbWVudCB0aGF0IHdhcyBzY3JvbGxlZC5cbiAgICogQHBhcmFtIG5ld1RvcCBOZXcgdG9wIHNjcm9sbCBwb3NpdGlvbi5cbiAgICogQHBhcmFtIG5ld0xlZnQgTmV3IGxlZnQgc2Nyb2xsIHBvc2l0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBfdXBkYXRlQWZ0ZXJTY3JvbGwoc2Nyb2xsZWRQYXJlbnQ6IEhUTUxFbGVtZW50IHwgRG9jdW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1RvcDogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdMZWZ0OiBudW1iZXIpIHtcbiAgICAvLyBVc2VkIHdoZW4gZmlndXJpbmcgb3V0IHdoZXRoZXIgYW4gZWxlbWVudCBpcyBpbnNpZGUgdGhlIHNjcm9sbCBwYXJlbnQuIElmIHRoZSBzY3JvbGxlZFxuICAgIC8vIHBhcmVudCBpcyB0aGUgYGRvY3VtZW50YCwgd2UgdXNlIHRoZSBgZG9jdW1lbnRFbGVtZW50YCwgYmVjYXVzZSBJRSBkb2Vzbid0IHN1cHBvcnQgYGNvbnRhaW5zYFxuICAgIC8vIG9uIHRoZSBgZG9jdW1lbnRgLlxuICAgIGNvbnN0IHNjcm9sbGVkUGFyZW50Tm9kZSA9XG4gICAgICAgIHNjcm9sbGVkUGFyZW50ID09PSB0aGlzLl9kb2N1bWVudCA/IHNjcm9sbGVkUGFyZW50LmRvY3VtZW50RWxlbWVudCA6IHNjcm9sbGVkUGFyZW50O1xuICAgIGNvbnN0IHNjcm9sbFBvc2l0aW9uID0gdGhpcy5fcGFyZW50UG9zaXRpb25zLmdldChzY3JvbGxlZFBhcmVudCkhLnNjcm9sbFBvc2l0aW9uO1xuICAgIGNvbnN0IHRvcERpZmZlcmVuY2UgPSBzY3JvbGxQb3NpdGlvbi50b3AgLSBuZXdUb3A7XG4gICAgY29uc3QgbGVmdERpZmZlcmVuY2UgPSBzY3JvbGxQb3NpdGlvbi5sZWZ0IC0gbmV3TGVmdDtcblxuICAgIC8vIEdvIHRocm91Z2ggYW5kIHVwZGF0ZSB0aGUgY2FjaGVkIHBvc2l0aW9ucyBvZiB0aGUgc2Nyb2xsXG4gICAgLy8gcGFyZW50cyB0aGF0IGFyZSBpbnNpZGUgdGhlIGVsZW1lbnQgdGhhdCB3YXMgc2Nyb2xsZWQuXG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLmZvckVhY2goKHBvc2l0aW9uLCBub2RlKSA9PiB7XG4gICAgICBpZiAocG9zaXRpb24uY2xpZW50UmVjdCAmJiBzY3JvbGxlZFBhcmVudCAhPT0gbm9kZSAmJiBzY3JvbGxlZFBhcmVudE5vZGUuY29udGFpbnMobm9kZSkpIHtcbiAgICAgICAgYWRqdXN0Q2xpZW50UmVjdChwb3NpdGlvbi5jbGllbnRSZWN0LCB0b3BEaWZmZXJlbmNlLCBsZWZ0RGlmZmVyZW5jZSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBTaW5jZSB3ZSBrbm93IHRoZSBhbW91bnQgdGhhdCB0aGUgdXNlciBoYXMgc2Nyb2xsZWQgd2UgY2FuIHNoaWZ0IGFsbCBvZiB0aGUgY2xpZW50IHJlY3RhbmdsZXNcbiAgICAvLyBvdXJzZWx2ZXMuIFRoaXMgaXMgY2hlYXBlciB0aGFuIHJlLW1lYXN1cmluZyBldmVyeXRoaW5nIGFuZCB3ZSBjYW4gYXZvaWQgaW5jb25zaXN0ZW50XG4gICAgLy8gYmVoYXZpb3Igd2hlcmUgd2UgbWlnaHQgYmUgbWVhc3VyaW5nIHRoZSBlbGVtZW50IGJlZm9yZSBpdHMgcG9zaXRpb24gaGFzIGNoYW5nZWQuXG4gICAgdGhpcy5faXRlbVBvc2l0aW9ucy5mb3JFYWNoKCh7Y2xpZW50UmVjdH0pID0+IHtcbiAgICAgIGFkanVzdENsaWVudFJlY3QoY2xpZW50UmVjdCwgdG9wRGlmZmVyZW5jZSwgbGVmdERpZmZlcmVuY2UpO1xuICAgIH0pO1xuXG4gICAgLy8gV2UgbmVlZCB0d28gbG9vcHMgZm9yIHRoaXMsIGJlY2F1c2Ugd2Ugd2FudCBhbGwgb2YgdGhlIGNhY2hlZFxuICAgIC8vIHBvc2l0aW9ucyB0byBiZSB1cC10by1kYXRlIGJlZm9yZSB3ZSByZS1zb3J0IHRoZSBpdGVtLlxuICAgIHRoaXMuX2l0ZW1Qb3NpdGlvbnMuZm9yRWFjaCgoe2RyYWd9KSA9PiB7XG4gICAgICBpZiAodGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5pc0RyYWdnaW5nKGRyYWcpKSB7XG4gICAgICAgIC8vIFdlIG5lZWQgdG8gcmUtc29ydCB0aGUgaXRlbSBtYW51YWxseSwgYmVjYXVzZSB0aGUgcG9pbnRlciBtb3ZlXG4gICAgICAgIC8vIGV2ZW50cyB3b24ndCBiZSBkaXNwYXRjaGVkIHdoaWxlIHRoZSB1c2VyIGlzIHNjcm9sbGluZy5cbiAgICAgICAgZHJhZy5fc29ydEZyb21MYXN0UG9pbnRlclBvc2l0aW9uKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBzY3JvbGxQb3NpdGlvbi50b3AgPSBuZXdUb3A7XG4gICAgc2Nyb2xsUG9zaXRpb24ubGVmdCA9IG5ld0xlZnQ7XG4gIH1cblxuICAvKiogU3RhcnRzIHRoZSBpbnRlcnZhbCB0aGF0J2xsIGF1dG8tc2Nyb2xsIHRoZSBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9zdGFydFNjcm9sbEludGVydmFsID0gKCkgPT4ge1xuICAgIHRoaXMuX3N0b3BTY3JvbGxpbmcoKTtcblxuICAgIGludGVydmFsKDAsIGFuaW1hdGlvbkZyYW1lU2NoZWR1bGVyKVxuICAgICAgLnBpcGUodGFrZVVudGlsKHRoaXMuX3N0b3BTY3JvbGxUaW1lcnMpKVxuICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLl9zY3JvbGxOb2RlO1xuXG4gICAgICAgIGlmICh0aGlzLl92ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9PT0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLlVQKSB7XG4gICAgICAgICAgaW5jcmVtZW50VmVydGljYWxTY3JvbGwobm9kZSwgLUFVVE9fU0NST0xMX1NURVApO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID09PSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uRE9XTikge1xuICAgICAgICAgIGluY3JlbWVudFZlcnRpY2FsU2Nyb2xsKG5vZGUsIEFVVE9fU0NST0xMX1NURVApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX2hvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPT09IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLkxFRlQpIHtcbiAgICAgICAgICBpbmNyZW1lbnRIb3Jpem9udGFsU2Nyb2xsKG5vZGUsIC1BVVRPX1NDUk9MTF9TVEVQKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID09PSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5SSUdIVCkge1xuICAgICAgICAgIGluY3JlbWVudEhvcml6b250YWxTY3JvbGwobm9kZSwgQVVUT19TQ1JPTExfU1RFUCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSB1c2VyJ3MgcG9pbnRlciBpcyBwb3NpdGlvbmVkIG92ZXIgdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHggUG9pbnRlciBwb3NpdGlvbiBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0geSBQb2ludGVyIHBvc2l0aW9uIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqL1xuICBfaXNPdmVyQ29udGFpbmVyKHg6IG51bWJlciwgeTogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGlzSW5zaWRlQ2xpZW50UmVjdCh0aGlzLl9jbGllbnRSZWN0LCB4LCB5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaWd1cmVzIG91dCB3aGV0aGVyIGFuIGl0ZW0gc2hvdWxkIGJlIG1vdmVkIGludG8gYSBzaWJsaW5nXG4gICAqIGRyb3AgY29udGFpbmVyLCBiYXNlZCBvbiBpdHMgY3VycmVudCBwb3NpdGlvbi5cbiAgICogQHBhcmFtIGl0ZW0gRHJhZyBpdGVtIHRoYXQgaXMgYmVpbmcgbW92ZWQuXG4gICAqIEBwYXJhbSB4IFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSB5IFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqL1xuICBfZ2V0U2libGluZ0NvbnRhaW5lckZyb21Qb3NpdGlvbihpdGVtOiBEcmFnUmVmLCB4OiBudW1iZXIsIHk6IG51bWJlcik6IERyb3BMaXN0UmVmIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fc2libGluZ3MuZmluZChzaWJsaW5nID0+IHNpYmxpbmcuX2NhblJlY2VpdmUoaXRlbSwgeCwgeSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSBkcm9wIGxpc3QgY2FuIHJlY2VpdmUgdGhlIHBhc3NlZC1pbiBpdGVtLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRoYXQgaXMgYmVpbmcgZHJhZ2dlZCBpbnRvIHRoZSBsaXN0LlxuICAgKiBAcGFyYW0geCBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0geSBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKi9cbiAgX2NhblJlY2VpdmUoaXRlbTogRHJhZ1JlZiwgeDogbnVtYmVyLCB5OiBudW1iZXIpOiBib29sZWFuIHtcbiAgICBpZiAoIWlzSW5zaWRlQ2xpZW50UmVjdCh0aGlzLl9jbGllbnRSZWN0LCB4LCB5KSB8fCAhdGhpcy5lbnRlclByZWRpY2F0ZShpdGVtLCB0aGlzKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IGVsZW1lbnRGcm9tUG9pbnQgPSB0aGlzLl9nZXRTaGFkb3dSb290KCkuZWxlbWVudEZyb21Qb2ludCh4LCB5KSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG5cbiAgICAvLyBJZiB0aGVyZSdzIG5vIGVsZW1lbnQgYXQgdGhlIHBvaW50ZXIgcG9zaXRpb24sIHRoZW5cbiAgICAvLyB0aGUgY2xpZW50IHJlY3QgaXMgcHJvYmFibHkgc2Nyb2xsZWQgb3V0IG9mIHRoZSB2aWV3LlxuICAgIGlmICghZWxlbWVudEZyb21Qb2ludCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KHRoaXMuZWxlbWVudCk7XG5cbiAgICAvLyBUaGUgYENsaWVudFJlY3RgLCB0aGF0IHdlJ3JlIHVzaW5nIHRvIGZpbmQgdGhlIGNvbnRhaW5lciBvdmVyIHdoaWNoIHRoZSB1c2VyIGlzXG4gICAgLy8gaG92ZXJpbmcsIGRvZXNuJ3QgZ2l2ZSB1cyBhbnkgaW5mb3JtYXRpb24gb24gd2hldGhlciB0aGUgZWxlbWVudCBoYXMgYmVlbiBzY3JvbGxlZFxuICAgIC8vIG91dCBvZiB0aGUgdmlldyBvciB3aGV0aGVyIGl0J3Mgb3ZlcmxhcHBpbmcgd2l0aCBvdGhlciBjb250YWluZXJzLiBUaGlzIG1lYW5zIHRoYXRcbiAgICAvLyB3ZSBjb3VsZCBlbmQgdXAgdHJhbnNmZXJyaW5nIHRoZSBpdGVtIGludG8gYSBjb250YWluZXIgdGhhdCdzIGludmlzaWJsZSBvciBpcyBwb3NpdGlvbmVkXG4gICAgLy8gYmVsb3cgYW5vdGhlciBvbmUuIFdlIHVzZSB0aGUgcmVzdWx0IGZyb20gYGVsZW1lbnRGcm9tUG9pbnRgIHRvIGdldCB0aGUgdG9wLW1vc3QgZWxlbWVudFxuICAgIC8vIGF0IHRoZSBwb2ludGVyIHBvc2l0aW9uIGFuZCB0byBmaW5kIHdoZXRoZXIgaXQncyBvbmUgb2YgdGhlIGludGVyc2VjdGluZyBkcm9wIGNvbnRhaW5lcnMuXG4gICAgcmV0dXJuIGVsZW1lbnRGcm9tUG9pbnQgPT09IG5hdGl2ZUVsZW1lbnQgfHwgbmF0aXZlRWxlbWVudC5jb250YWlucyhlbGVtZW50RnJvbVBvaW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsZWQgYnkgb25lIG9mIHRoZSBjb25uZWN0ZWQgZHJvcCBsaXN0cyB3aGVuIGEgZHJhZ2dpbmcgc2VxdWVuY2UgaGFzIHN0YXJ0ZWQuXG4gICAqIEBwYXJhbSBzaWJsaW5nIFNpYmxpbmcgaW4gd2hpY2ggZHJhZ2dpbmcgaGFzIHN0YXJ0ZWQuXG4gICAqL1xuICBfc3RhcnRSZWNlaXZpbmcoc2libGluZzogRHJvcExpc3RSZWYpIHtcbiAgICBjb25zdCBhY3RpdmVTaWJsaW5ncyA9IHRoaXMuX2FjdGl2ZVNpYmxpbmdzO1xuXG4gICAgaWYgKCFhY3RpdmVTaWJsaW5ncy5oYXMoc2libGluZykpIHtcbiAgICAgIGFjdGl2ZVNpYmxpbmdzLmFkZChzaWJsaW5nKTtcbiAgICAgIHRoaXMuX2NhY2hlUGFyZW50UG9zaXRpb25zKCk7XG4gICAgICB0aGlzLl9saXN0ZW5Ub1Njcm9sbEV2ZW50cygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsZWQgYnkgYSBjb25uZWN0ZWQgZHJvcCBsaXN0IHdoZW4gZHJhZ2dpbmcgaGFzIHN0b3BwZWQuXG4gICAqIEBwYXJhbSBzaWJsaW5nIFNpYmxpbmcgd2hvc2UgZHJhZ2dpbmcgaGFzIHN0b3BwZWQuXG4gICAqL1xuICBfc3RvcFJlY2VpdmluZyhzaWJsaW5nOiBEcm9wTGlzdFJlZikge1xuICAgIHRoaXMuX2FjdGl2ZVNpYmxpbmdzLmRlbGV0ZShzaWJsaW5nKTtcbiAgICB0aGlzLl92aWV3cG9ydFNjcm9sbFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0YXJ0cyBsaXN0ZW5pbmcgdG8gc2Nyb2xsIGV2ZW50cyBvbiB0aGUgdmlld3BvcnQuXG4gICAqIFVzZWQgZm9yIHVwZGF0aW5nIHRoZSBpbnRlcm5hbCBzdGF0ZSBvZiB0aGUgbGlzdC5cbiAgICovXG4gIHByaXZhdGUgX2xpc3RlblRvU2Nyb2xsRXZlbnRzKCkge1xuICAgIHRoaXMuX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uID0gdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5zY3JvbGwuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgIGlmICh0aGlzLmlzRHJhZ2dpbmcoKSkge1xuICAgICAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQgfCBEb2N1bWVudDtcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuZ2V0KHRhcmdldCk7XG5cbiAgICAgICAgaWYgKHBvc2l0aW9uKSB7XG4gICAgICAgICAgbGV0IG5ld1RvcDogbnVtYmVyO1xuICAgICAgICAgIGxldCBuZXdMZWZ0OiBudW1iZXI7XG5cbiAgICAgICAgICBpZiAodGFyZ2V0ID09PSB0aGlzLl9kb2N1bWVudCkge1xuICAgICAgICAgICAgY29uc3Qgc2Nyb2xsUG9zaXRpb24gPSB0aGlzLl92aWV3cG9ydFJ1bGVyIS5nZXRWaWV3cG9ydFNjcm9sbFBvc2l0aW9uKCk7XG4gICAgICAgICAgICBuZXdUb3AgPSBzY3JvbGxQb3NpdGlvbi50b3A7XG4gICAgICAgICAgICBuZXdMZWZ0ID0gc2Nyb2xsUG9zaXRpb24ubGVmdDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmV3VG9wID0gKHRhcmdldCBhcyBIVE1MRWxlbWVudCkuc2Nyb2xsVG9wO1xuICAgICAgICAgICAgbmV3TGVmdCA9ICh0YXJnZXQgYXMgSFRNTEVsZW1lbnQpLnNjcm9sbExlZnQ7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5fdXBkYXRlQWZ0ZXJTY3JvbGwodGFyZ2V0LCBuZXdUb3AsIG5ld0xlZnQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuaXNSZWNlaXZpbmcoKSkge1xuICAgICAgICB0aGlzLl9jYWNoZVBhcmVudFBvc2l0aW9ucygpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIExhemlseSByZXNvbHZlcyBhbmQgcmV0dXJucyB0aGUgc2hhZG93IHJvb3Qgb2YgdGhlIGVsZW1lbnQuIFdlIGRvIHRoaXMgaW4gYSBmdW5jdGlvbiwgcmF0aGVyXG4gICAqIHRoYW4gc2F2aW5nIGl0IGluIHByb3BlcnR5IGRpcmVjdGx5IG9uIGluaXQsIGJlY2F1c2Ugd2Ugd2FudCB0byByZXNvbHZlIGl0IGFzIGxhdGUgYXMgcG9zc2libGVcbiAgICogaW4gb3JkZXIgdG8gZW5zdXJlIHRoYXQgdGhlIGVsZW1lbnQgaGFzIGJlZW4gbW92ZWQgaW50byB0aGUgc2hhZG93IERPTS4gRG9pbmcgaXQgaW5zaWRlIHRoZVxuICAgKiBjb25zdHJ1Y3RvciBtaWdodCBiZSB0b28gZWFybHkgaWYgdGhlIGVsZW1lbnQgaXMgaW5zaWRlIG9mIHNvbWV0aGluZyBsaWtlIGBuZ0ZvcmAgb3IgYG5nSWZgLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0U2hhZG93Um9vdCgpOiBEb2N1bWVudE9yU2hhZG93Um9vdCB7XG4gICAgaWYgKCF0aGlzLl9jYWNoZWRTaGFkb3dSb290KSB7XG4gICAgICBjb25zdCBzaGFkb3dSb290ID0gX2dldFNoYWRvd1Jvb3QoY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpKSBhcyBTaGFkb3dSb290IHwgbnVsbDtcbiAgICAgIHRoaXMuX2NhY2hlZFNoYWRvd1Jvb3QgPSBzaGFkb3dSb290IHx8IHRoaXMuX2RvY3VtZW50O1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9jYWNoZWRTaGFkb3dSb290O1xuICB9XG59XG5cblxuLyoqXG4gKiBVcGRhdGVzIHRoZSB0b3AvbGVmdCBwb3NpdGlvbnMgb2YgYSBgQ2xpZW50UmVjdGAsIGFzIHdlbGwgYXMgdGhlaXIgYm90dG9tL3JpZ2h0IGNvdW50ZXJwYXJ0cy5cbiAqIEBwYXJhbSBjbGllbnRSZWN0IGBDbGllbnRSZWN0YCB0aGF0IHNob3VsZCBiZSB1cGRhdGVkLlxuICogQHBhcmFtIHRvcCBBbW91bnQgdG8gYWRkIHRvIHRoZSBgdG9wYCBwb3NpdGlvbi5cbiAqIEBwYXJhbSBsZWZ0IEFtb3VudCB0byBhZGQgdG8gdGhlIGBsZWZ0YCBwb3NpdGlvbi5cbiAqL1xuZnVuY3Rpb24gYWRqdXN0Q2xpZW50UmVjdChjbGllbnRSZWN0OiBDbGllbnRSZWN0LCB0b3A6IG51bWJlciwgbGVmdDogbnVtYmVyKSB7XG4gIGNsaWVudFJlY3QudG9wICs9IHRvcDtcbiAgY2xpZW50UmVjdC5ib3R0b20gPSBjbGllbnRSZWN0LnRvcCArIGNsaWVudFJlY3QuaGVpZ2h0O1xuXG4gIGNsaWVudFJlY3QubGVmdCArPSBsZWZ0O1xuICBjbGllbnRSZWN0LnJpZ2h0ID0gY2xpZW50UmVjdC5sZWZ0ICsgY2xpZW50UmVjdC53aWR0aDtcbn1cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciB0aGUgcG9pbnRlciBjb29yZGluYXRlcyBhcmUgY2xvc2UgdG8gYSBDbGllbnRSZWN0LlxuICogQHBhcmFtIHJlY3QgQ2xpZW50UmVjdCB0byBjaGVjayBhZ2FpbnN0LlxuICogQHBhcmFtIHBvaW50ZXJYIENvb3JkaW5hdGVzIGFsb25nIHRoZSBYIGF4aXMuXG4gKiBAcGFyYW0gcG9pbnRlclkgQ29vcmRpbmF0ZXMgYWxvbmcgdGhlIFkgYXhpcy5cbiAqL1xuZnVuY3Rpb24gaXNQb2ludGVyTmVhckNsaWVudFJlY3QocmVjdDogQ2xpZW50UmVjdCwgcG9pbnRlclg6IG51bWJlciwgcG9pbnRlclk6IG51bWJlcik6IGJvb2xlYW4ge1xuICBjb25zdCB7dG9wLCByaWdodCwgYm90dG9tLCBsZWZ0LCB3aWR0aCwgaGVpZ2h0fSA9IHJlY3Q7XG4gIGNvbnN0IHhUaHJlc2hvbGQgPSB3aWR0aCAqIERST1BfUFJPWElNSVRZX1RIUkVTSE9MRDtcbiAgY29uc3QgeVRocmVzaG9sZCA9IGhlaWdodCAqIERST1BfUFJPWElNSVRZX1RIUkVTSE9MRDtcblxuICByZXR1cm4gcG9pbnRlclkgPiB0b3AgLSB5VGhyZXNob2xkICYmIHBvaW50ZXJZIDwgYm90dG9tICsgeVRocmVzaG9sZCAmJlxuICAgICAgICAgcG9pbnRlclggPiBsZWZ0IC0geFRocmVzaG9sZCAmJiBwb2ludGVyWCA8IHJpZ2h0ICsgeFRocmVzaG9sZDtcbn1cblxuLyoqXG4gKiBGaW5kcyB0aGUgaW5kZXggb2YgYW4gaXRlbSB0aGF0IG1hdGNoZXMgYSBwcmVkaWNhdGUgZnVuY3Rpb24uIFVzZWQgYXMgYW4gZXF1aXZhbGVudFxuICogb2YgYEFycmF5LnByb3RvdHlwZS5maW5kSW5kZXhgIHdoaWNoIGlzbid0IHBhcnQgb2YgdGhlIHN0YW5kYXJkIEdvb2dsZSB0eXBpbmdzLlxuICogQHBhcmFtIGFycmF5IEFycmF5IGluIHdoaWNoIHRvIGxvb2sgZm9yIG1hdGNoZXMuXG4gKiBAcGFyYW0gcHJlZGljYXRlIEZ1bmN0aW9uIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYW4gaXRlbSBpcyBhIG1hdGNoLlxuICovXG5mdW5jdGlvbiBmaW5kSW5kZXg8VD4oYXJyYXk6IFRbXSxcbiAgICAgICAgICAgICAgICAgICAgICBwcmVkaWNhdGU6ICh2YWx1ZTogVCwgaW5kZXg6IG51bWJlciwgb2JqOiBUW10pID0+IGJvb2xlYW4pOiBudW1iZXIge1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAocHJlZGljYXRlKGFycmF5W2ldLCBpLCBhcnJheSkpIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiAtMTtcbn1cblxuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIHNvbWUgY29vcmRpbmF0ZXMgYXJlIHdpdGhpbiBhIGBDbGllbnRSZWN0YC5cbiAqIEBwYXJhbSBjbGllbnRSZWN0IENsaWVudFJlY3QgdGhhdCBpcyBiZWluZyBjaGVja2VkLlxuICogQHBhcmFtIHggQ29vcmRpbmF0ZXMgYWxvbmcgdGhlIFggYXhpcy5cbiAqIEBwYXJhbSB5IENvb3JkaW5hdGVzIGFsb25nIHRoZSBZIGF4aXMuXG4gKi9cbmZ1bmN0aW9uIGlzSW5zaWRlQ2xpZW50UmVjdChjbGllbnRSZWN0OiBDbGllbnRSZWN0LCB4OiBudW1iZXIsIHk6IG51bWJlcikge1xuICBjb25zdCB7dG9wLCBib3R0b20sIGxlZnQsIHJpZ2h0fSA9IGNsaWVudFJlY3Q7XG4gIHJldHVybiB5ID49IHRvcCAmJiB5IDw9IGJvdHRvbSAmJiB4ID49IGxlZnQgJiYgeCA8PSByaWdodDtcbn1cblxuXG4vKiogR2V0cyBhIG11dGFibGUgdmVyc2lvbiBvZiBhbiBlbGVtZW50J3MgYm91bmRpbmcgYENsaWVudFJlY3RgLiAqL1xuZnVuY3Rpb24gZ2V0TXV0YWJsZUNsaWVudFJlY3QoZWxlbWVudDogRWxlbWVudCk6IENsaWVudFJlY3Qge1xuICBjb25zdCBjbGllbnRSZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAvLyBXZSBuZWVkIHRvIGNsb25lIHRoZSBgY2xpZW50UmVjdGAgaGVyZSwgYmVjYXVzZSBhbGwgdGhlIHZhbHVlcyBvbiBpdCBhcmUgcmVhZG9ubHlcbiAgLy8gYW5kIHdlIG5lZWQgdG8gYmUgYWJsZSB0byB1cGRhdGUgdGhlbS4gQWxzbyB3ZSBjYW4ndCB1c2UgYSBzcHJlYWQgaGVyZSwgYmVjYXVzZVxuICAvLyB0aGUgdmFsdWVzIG9uIGEgYENsaWVudFJlY3RgIGFyZW4ndCBvd24gcHJvcGVydGllcy4gU2VlOlxuICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRWxlbWVudC9nZXRCb3VuZGluZ0NsaWVudFJlY3QjTm90ZXNcbiAgcmV0dXJuIHtcbiAgICB0b3A6IGNsaWVudFJlY3QudG9wLFxuICAgIHJpZ2h0OiBjbGllbnRSZWN0LnJpZ2h0LFxuICAgIGJvdHRvbTogY2xpZW50UmVjdC5ib3R0b20sXG4gICAgbGVmdDogY2xpZW50UmVjdC5sZWZ0LFxuICAgIHdpZHRoOiBjbGllbnRSZWN0LndpZHRoLFxuICAgIGhlaWdodDogY2xpZW50UmVjdC5oZWlnaHRcbiAgfTtcbn1cblxuLyoqXG4gKiBJbmNyZW1lbnRzIHRoZSB2ZXJ0aWNhbCBzY3JvbGwgcG9zaXRpb24gb2YgYSBub2RlLlxuICogQHBhcmFtIG5vZGUgTm9kZSB3aG9zZSBzY3JvbGwgcG9zaXRpb24gc2hvdWxkIGNoYW5nZS5cbiAqIEBwYXJhbSBhbW91bnQgQW1vdW50IG9mIHBpeGVscyB0aGF0IHRoZSBgbm9kZWAgc2hvdWxkIGJlIHNjcm9sbGVkLlxuICovXG5mdW5jdGlvbiBpbmNyZW1lbnRWZXJ0aWNhbFNjcm9sbChub2RlOiBIVE1MRWxlbWVudCB8IFdpbmRvdywgYW1vdW50OiBudW1iZXIpIHtcbiAgaWYgKG5vZGUgPT09IHdpbmRvdykge1xuICAgIChub2RlIGFzIFdpbmRvdykuc2Nyb2xsQnkoMCwgYW1vdW50KTtcbiAgfSBlbHNlIHtcbiAgICAvLyBJZGVhbGx5IHdlIGNvdWxkIHVzZSBgRWxlbWVudC5zY3JvbGxCeWAgaGVyZSBhcyB3ZWxsLCBidXQgSUUgYW5kIEVkZ2UgZG9uJ3Qgc3VwcG9ydCBpdC5cbiAgICAobm9kZSBhcyBIVE1MRWxlbWVudCkuc2Nyb2xsVG9wICs9IGFtb3VudDtcbiAgfVxufVxuXG4vKipcbiAqIEluY3JlbWVudHMgdGhlIGhvcml6b250YWwgc2Nyb2xsIHBvc2l0aW9uIG9mIGEgbm9kZS5cbiAqIEBwYXJhbSBub2RlIE5vZGUgd2hvc2Ugc2Nyb2xsIHBvc2l0aW9uIHNob3VsZCBjaGFuZ2UuXG4gKiBAcGFyYW0gYW1vdW50IEFtb3VudCBvZiBwaXhlbHMgdGhhdCB0aGUgYG5vZGVgIHNob3VsZCBiZSBzY3JvbGxlZC5cbiAqL1xuZnVuY3Rpb24gaW5jcmVtZW50SG9yaXpvbnRhbFNjcm9sbChub2RlOiBIVE1MRWxlbWVudCB8IFdpbmRvdywgYW1vdW50OiBudW1iZXIpIHtcbiAgaWYgKG5vZGUgPT09IHdpbmRvdykge1xuICAgIChub2RlIGFzIFdpbmRvdykuc2Nyb2xsQnkoYW1vdW50LCAwKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBJZGVhbGx5IHdlIGNvdWxkIHVzZSBgRWxlbWVudC5zY3JvbGxCeWAgaGVyZSBhcyB3ZWxsLCBidXQgSUUgYW5kIEVkZ2UgZG9uJ3Qgc3VwcG9ydCBpdC5cbiAgICAobm9kZSBhcyBIVE1MRWxlbWVudCkuc2Nyb2xsTGVmdCArPSBhbW91bnQ7XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIHdoZXRoZXIgdGhlIHZlcnRpY2FsIGF1dG8tc2Nyb2xsIGRpcmVjdGlvbiBvZiBhIG5vZGUuXG4gKiBAcGFyYW0gY2xpZW50UmVjdCBEaW1lbnNpb25zIG9mIHRoZSBub2RlLlxuICogQHBhcmFtIHBvaW50ZXJZIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgeSBheGlzLlxuICovXG5mdW5jdGlvbiBnZXRWZXJ0aWNhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0OiBDbGllbnRSZWN0LCBwb2ludGVyWTogbnVtYmVyKSB7XG4gIGNvbnN0IHt0b3AsIGJvdHRvbSwgaGVpZ2h0fSA9IGNsaWVudFJlY3Q7XG4gIGNvbnN0IHlUaHJlc2hvbGQgPSBoZWlnaHQgKiBTQ1JPTExfUFJPWElNSVRZX1RIUkVTSE9MRDtcblxuICBpZiAocG9pbnRlclkgPj0gdG9wIC0geVRocmVzaG9sZCAmJiBwb2ludGVyWSA8PSB0b3AgKyB5VGhyZXNob2xkKSB7XG4gICAgcmV0dXJuIEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5VUDtcbiAgfSBlbHNlIGlmIChwb2ludGVyWSA+PSBib3R0b20gLSB5VGhyZXNob2xkICYmIHBvaW50ZXJZIDw9IGJvdHRvbSArIHlUaHJlc2hvbGQpIHtcbiAgICByZXR1cm4gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLkRPV047XG4gIH1cblxuICByZXR1cm4gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLk5PTkU7XG59XG5cbi8qKlxuICogR2V0cyB3aGV0aGVyIHRoZSBob3Jpem9udGFsIGF1dG8tc2Nyb2xsIGRpcmVjdGlvbiBvZiBhIG5vZGUuXG4gKiBAcGFyYW0gY2xpZW50UmVjdCBEaW1lbnNpb25zIG9mIHRoZSBub2RlLlxuICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgeCBheGlzLlxuICovXG5mdW5jdGlvbiBnZXRIb3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKGNsaWVudFJlY3Q6IENsaWVudFJlY3QsIHBvaW50ZXJYOiBudW1iZXIpIHtcbiAgY29uc3Qge2xlZnQsIHJpZ2h0LCB3aWR0aH0gPSBjbGllbnRSZWN0O1xuICBjb25zdCB4VGhyZXNob2xkID0gd2lkdGggKiBTQ1JPTExfUFJPWElNSVRZX1RIUkVTSE9MRDtcblxuICBpZiAocG9pbnRlclggPj0gbGVmdCAtIHhUaHJlc2hvbGQgJiYgcG9pbnRlclggPD0gbGVmdCArIHhUaHJlc2hvbGQpIHtcbiAgICByZXR1cm4gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTEVGVDtcbiAgfSBlbHNlIGlmIChwb2ludGVyWCA+PSByaWdodCAtIHhUaHJlc2hvbGQgJiYgcG9pbnRlclggPD0gcmlnaHQgKyB4VGhyZXNob2xkKSB7XG4gICAgcmV0dXJuIEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLlJJR0hUO1xuICB9XG5cbiAgcmV0dXJuIEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLk5PTkU7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgZGlyZWN0aW9ucyBpbiB3aGljaCBhbiBlbGVtZW50IG5vZGUgc2hvdWxkIGJlIHNjcm9sbGVkLFxuICogYXNzdW1pbmcgdGhhdCB0aGUgdXNlcidzIHBvaW50ZXIgaXMgYWxyZWFkeSB3aXRoaW4gaXQgc2Nyb2xsYWJsZSByZWdpb24uXG4gKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IGZvciB3aGljaCB3ZSBzaG91bGQgY2FsY3VsYXRlIHRoZSBzY3JvbGwgZGlyZWN0aW9uLlxuICogQHBhcmFtIGNsaWVudFJlY3QgQm91bmRpbmcgY2xpZW50IHJlY3RhbmdsZSBvZiB0aGUgZWxlbWVudC5cbiAqIEBwYXJhbSBwb2ludGVyWCBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIHggYXhpcy5cbiAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIHkgYXhpcy5cbiAqL1xuZnVuY3Rpb24gZ2V0RWxlbWVudFNjcm9sbERpcmVjdGlvbnMoZWxlbWVudDogSFRNTEVsZW1lbnQsIGNsaWVudFJlY3Q6IENsaWVudFJlY3QsIHBvaW50ZXJYOiBudW1iZXIsXG4gIHBvaW50ZXJZOiBudW1iZXIpOiBbQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLCBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbl0ge1xuICBjb25zdCBjb21wdXRlZFZlcnRpY2FsID0gZ2V0VmVydGljYWxTY3JvbGxEaXJlY3Rpb24oY2xpZW50UmVjdCwgcG9pbnRlclkpO1xuICBjb25zdCBjb21wdXRlZEhvcml6b250YWwgPSBnZXRIb3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKGNsaWVudFJlY3QsIHBvaW50ZXJYKTtcbiAgbGV0IHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLk5PTkU7XG4gIGxldCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTk9ORTtcblxuICAvLyBOb3RlIHRoYXQgd2UgaGVyZSB3ZSBkbyBzb21lIGV4dHJhIGNoZWNrcyBmb3Igd2hldGhlciB0aGUgZWxlbWVudCBpcyBhY3R1YWxseSBzY3JvbGxhYmxlIGluXG4gIC8vIGEgY2VydGFpbiBkaXJlY3Rpb24gYW5kIHdlIG9ubHkgYXNzaWduIHRoZSBzY3JvbGwgZGlyZWN0aW9uIGlmIGl0IGlzLiBXZSBkbyB0aGlzIHNvIHRoYXQgd2VcbiAgLy8gY2FuIGFsbG93IG90aGVyIGVsZW1lbnRzIHRvIGJlIHNjcm9sbGVkLCBpZiB0aGUgY3VycmVudCBlbGVtZW50IGNhbid0IGJlIHNjcm9sbGVkIGFueW1vcmUuXG4gIC8vIFRoaXMgYWxsb3dzIHVzIHRvIGhhbmRsZSBjYXNlcyB3aGVyZSB0aGUgc2Nyb2xsIHJlZ2lvbnMgb2YgdHdvIHNjcm9sbGFibGUgZWxlbWVudHMgb3ZlcmxhcC5cbiAgaWYgKGNvbXB1dGVkVmVydGljYWwpIHtcbiAgICBjb25zdCBzY3JvbGxUb3AgPSBlbGVtZW50LnNjcm9sbFRvcDtcblxuICAgIGlmIChjb21wdXRlZFZlcnRpY2FsID09PSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uVVApIHtcbiAgICAgIGlmIChzY3JvbGxUb3AgPiAwKSB7XG4gICAgICAgIHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLlVQO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZWxlbWVudC5zY3JvbGxIZWlnaHQgLSBzY3JvbGxUb3AgPiBlbGVtZW50LmNsaWVudEhlaWdodCkge1xuICAgICAgdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uRE9XTjtcbiAgICB9XG4gIH1cblxuICBpZiAoY29tcHV0ZWRIb3Jpem9udGFsKSB7XG4gICAgY29uc3Qgc2Nyb2xsTGVmdCA9IGVsZW1lbnQuc2Nyb2xsTGVmdDtcblxuICAgIGlmIChjb21wdXRlZEhvcml6b250YWwgPT09IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLkxFRlQpIHtcbiAgICAgIGlmIChzY3JvbGxMZWZ0ID4gMCkge1xuICAgICAgICBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTEVGVDtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGVsZW1lbnQuc2Nyb2xsV2lkdGggLSBzY3JvbGxMZWZ0ID4gZWxlbWVudC5jbGllbnRXaWR0aCkge1xuICAgICAgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLlJJR0hUO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBbdmVydGljYWxTY3JvbGxEaXJlY3Rpb24sIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb25dO1xufVxuIl19