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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LXJlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2Ryb3AtbGlzdC1yZWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBVUEsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRXBELE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3pELE9BQU8sRUFBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSx1QkFBdUIsRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUM5RSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDekMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGNBQWMsQ0FBQzs7Ozs7O01BUXZDLHdCQUF3QixHQUFHLElBQUk7Ozs7OztNQU0vQiwwQkFBMEIsR0FBRyxJQUFJOzs7Ozs7TUFNakMsZ0JBQWdCLEdBQUcsQ0FBQzs7Ozs7O0FBTTFCLGlDQU9DOzs7Ozs7SUFMQyxrQ0FBYzs7Ozs7SUFFZCx3Q0FBdUI7Ozs7O0lBRXZCLG9DQUFlOzs7Ozs7QUFJakIsNkJBR0M7OztJQUZDLDZCQUFZOztJQUNaLDhCQUFhOzs7QUFJZixNQUFXLDJCQUEyQjtJQUFFLElBQUksR0FBQSxFQUFFLEVBQUUsR0FBQSxFQUFFLElBQUksR0FBQTtFQUFDOztBQUd2RCxNQUFXLDZCQUE2QjtJQUFFLElBQUksR0FBQSxFQUFFLElBQUksR0FBQSxFQUFFLEtBQUssR0FBQTtFQUFDOzs7Ozs7O0FBTzVELHlDQUEyRDs7Ozs7QUFLM0QsTUFBTSxPQUFPLFdBQVc7Ozs7Ozs7O0lBbUl0QixZQUNFLE9BQThDLEVBQ3RDLGlCQUF5RCxFQUNqRSxTQUFjLEVBQ04sT0FBZSxFQUNmLGNBQTZCO1FBSDdCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBd0M7UUFFekQsWUFBTyxHQUFQLE9BQU8sQ0FB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RjtJQUM5RixJQUFJLGdCQUFnQixFQUFFOztjQUNkLFNBQVMsR0FBRyxPQUFPLENBQUMsU0FBUztRQUVuQyxJQUFJLGdCQUFnQixlQUFtQyxFQUFFO1lBQ3ZELElBQUksU0FBUyxHQUFHLENBQUMsRUFBRTtnQkFDakIsdUJBQXVCLGFBQWlDLENBQUM7YUFDMUQ7U0FDRjthQUFNLElBQUksT0FBTyxDQUFDLFlBQVksR0FBRyxTQUFTLEdBQUcsT0FBTyxDQUFDLFlBQVksRUFBRTtZQUNsRSx1QkFBdUIsZUFBbUMsQ0FBQztTQUM1RDtLQUNGO0lBRUQsSUFBSSxrQkFBa0IsRUFBRTs7Y0FDaEIsVUFBVSxHQUFHLE9BQU8sQ0FBQyxVQUFVO1FBRXJDLElBQUksa0JBQWtCLGlCQUF1QyxFQUFFO1lBQzdELElBQUksVUFBVSxHQUFHLENBQUMsRUFBRTtnQkFDbEIseUJBQXlCLGVBQXFDLENBQUM7YUFDaEU7U0FDRjthQUFNLElBQUksT0FBTyxDQUFDLFdBQVcsR0FBRyxVQUFVLEdBQUcsT0FBTyxDQUFDLFdBQVcsRUFBRTtZQUNqRSx5QkFBeUIsZ0JBQXNDLENBQUM7U0FDakU7S0FDRjtJQUVELE9BQU8sQ0FBQyx1QkFBdUIsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO0FBQzlELENBQUM7Ozs7OztBQUdELFNBQVMsYUFBYSxDQUFDLE9BQW9CO0lBQ3pDLElBQUksa0JBQWtCLEVBQUUsRUFBRTs7Y0FDbEIsUUFBUSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSTtRQUVuRSxJQUFJLFFBQVEsWUFBWSxVQUFVLEVBQUU7WUFDbEMsT0FBTyxRQUFRLENBQUM7U0FDakI7S0FDRjtJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0VsZW1lbnRSZWYsIE5nWm9uZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0RpcmVjdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtjb2VyY2VFbGVtZW50fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtWaWV3cG9ydFJ1bGVyfSBmcm9tICdAYW5ndWxhci9jZGsvc2Nyb2xsaW5nJztcbmltcG9ydCB7X3N1cHBvcnRzU2hhZG93RG9tfSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtTdWJqZWN0LCBTdWJzY3JpcHRpb24sIGludGVydmFsLCBhbmltYXRpb25GcmFtZVNjaGVkdWxlcn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3Rha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHttb3ZlSXRlbUluQXJyYXl9IGZyb20gJy4vZHJhZy11dGlscyc7XG5pbXBvcnQge0RyYWdEcm9wUmVnaXN0cnl9IGZyb20gJy4vZHJhZy1kcm9wLXJlZ2lzdHJ5JztcbmltcG9ydCB7RHJhZ1JlZkludGVybmFsIGFzIERyYWdSZWYsIFBvaW50fSBmcm9tICcuL2RyYWctcmVmJztcblxuLyoqXG4gKiBQcm94aW1pdHksIGFzIGEgcmF0aW8gdG8gd2lkdGgvaGVpZ2h0LCBhdCB3aGljaCBhXG4gKiBkcmFnZ2VkIGl0ZW0gd2lsbCBhZmZlY3QgdGhlIGRyb3AgY29udGFpbmVyLlxuICovXG5jb25zdCBEUk9QX1BST1hJTUlUWV9USFJFU0hPTEQgPSAwLjA1O1xuXG4vKipcbiAqIFByb3hpbWl0eSwgYXMgYSByYXRpbyB0byB3aWR0aC9oZWlnaHQgYXQgd2hpY2ggdG8gc3RhcnQgYXV0by1zY3JvbGxpbmcgdGhlIGRyb3AgbGlzdCBvciB0aGVcbiAqIHZpZXdwb3J0LiBUaGUgdmFsdWUgY29tZXMgZnJvbSB0cnlpbmcgaXQgb3V0IG1hbnVhbGx5IHVudGlsIGl0IGZlZWxzIHJpZ2h0LlxuICovXG5jb25zdCBTQ1JPTExfUFJPWElNSVRZX1RIUkVTSE9MRCA9IDAuMDU7XG5cbi8qKlxuICogTnVtYmVyIG9mIHBpeGVscyB0byBzY3JvbGwgZm9yIGVhY2ggZnJhbWUgd2hlbiBhdXRvLXNjcm9sbGluZyBhbiBlbGVtZW50LlxuICogVGhlIHZhbHVlIGNvbWVzIGZyb20gdHJ5aW5nIGl0IG91dCBtYW51YWxseSB1bnRpbCBpdCBmZWVscyByaWdodC5cbiAqL1xuY29uc3QgQVVUT19TQ1JPTExfU1RFUCA9IDI7XG5cbi8qKlxuICogRW50cnkgaW4gdGhlIHBvc2l0aW9uIGNhY2hlIGZvciBkcmFnZ2FibGUgaXRlbXMuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmludGVyZmFjZSBDYWNoZWRJdGVtUG9zaXRpb24ge1xuICAvKiogSW5zdGFuY2Ugb2YgdGhlIGRyYWcgaXRlbS4gKi9cbiAgZHJhZzogRHJhZ1JlZjtcbiAgLyoqIERpbWVuc2lvbnMgb2YgdGhlIGl0ZW0uICovXG4gIGNsaWVudFJlY3Q6IENsaWVudFJlY3Q7XG4gIC8qKiBBbW91bnQgYnkgd2hpY2ggdGhlIGl0ZW0gaGFzIGJlZW4gbW92ZWQgc2luY2UgZHJhZ2dpbmcgc3RhcnRlZC4gKi9cbiAgb2Zmc2V0OiBudW1iZXI7XG59XG5cbi8qKiBPYmplY3QgaG9sZGluZyB0aGUgc2Nyb2xsIHBvc2l0aW9uIG9mIHNvbWV0aGluZy4gKi9cbmludGVyZmFjZSBTY3JvbGxQb3NpdGlvbiB7XG4gIHRvcDogbnVtYmVyO1xuICBsZWZ0OiBudW1iZXI7XG59XG5cbi8qKiBWZXJ0aWNhbCBkaXJlY3Rpb24gaW4gd2hpY2ggd2UgY2FuIGF1dG8tc2Nyb2xsLiAqL1xuY29uc3QgZW51bSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24ge05PTkUsIFVQLCBET1dOfVxuXG4vKiogSG9yaXpvbnRhbCBkaXJlY3Rpb24gaW4gd2hpY2ggd2UgY2FuIGF1dG8tc2Nyb2xsLiAqL1xuY29uc3QgZW51bSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbiB7Tk9ORSwgTEVGVCwgUklHSFR9XG5cbi8qKlxuICogSW50ZXJuYWwgY29tcGlsZS10aW1lLW9ubHkgcmVwcmVzZW50YXRpb24gb2YgYSBgRHJvcExpc3RSZWZgLlxuICogVXNlZCB0byBhdm9pZCBjaXJjdWxhciBpbXBvcnQgaXNzdWVzIGJldHdlZW4gdGhlIGBEcm9wTGlzdFJlZmAgYW5kIHRoZSBgRHJhZ1JlZmAuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRHJvcExpc3RSZWZJbnRlcm5hbCBleHRlbmRzIERyb3BMaXN0UmVmIHt9XG5cbi8qKlxuICogUmVmZXJlbmNlIHRvIGEgZHJvcCBsaXN0LiBVc2VkIHRvIG1hbmlwdWxhdGUgb3IgZGlzcG9zZSBvZiB0aGUgY29udGFpbmVyLlxuICovXG5leHBvcnQgY2xhc3MgRHJvcExpc3RSZWY8VCA9IGFueT4ge1xuICAvKiogRWxlbWVudCB0aGF0IHRoZSBkcm9wIGxpc3QgaXMgYXR0YWNoZWQgdG8uICovXG4gIGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD47XG5cbiAgLyoqIFdoZXRoZXIgc3RhcnRpbmcgYSBkcmFnZ2luZyBzZXF1ZW5jZSBmcm9tIHRoaXMgY29udGFpbmVyIGlzIGRpc2FibGVkLiAqL1xuICBkaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIHNvcnRpbmcgaXRlbXMgd2l0aGluIHRoZSBsaXN0IGlzIGRpc2FibGVkLiAqL1xuICBzb3J0aW5nRGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogTG9ja3MgdGhlIHBvc2l0aW9uIG9mIHRoZSBkcmFnZ2FibGUgZWxlbWVudHMgaW5zaWRlIHRoZSBjb250YWluZXIgYWxvbmcgdGhlIHNwZWNpZmllZCBheGlzLiAqL1xuICBsb2NrQXhpczogJ3gnIHwgJ3knO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIGF1dG8tc2Nyb2xsaW5nIHRoZSB2aWV3IHdoZW4gdGhlIHVzZXJcbiAgICogbW92ZXMgdGhlaXIgcG9pbnRlciBjbG9zZSB0byB0aGUgZWRnZXMgaXMgZGlzYWJsZWQuXG4gICAqL1xuICBhdXRvU2Nyb2xsRGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKipcbiAgICogRnVuY3Rpb24gdGhhdCBpcyB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIGFuIGl0ZW1cbiAgICogaXMgYWxsb3dlZCB0byBiZSBtb3ZlZCBpbnRvIGEgZHJvcCBjb250YWluZXIuXG4gICAqL1xuICBlbnRlclByZWRpY2F0ZTogKGRyYWc6IERyYWdSZWYsIGRyb3A6IERyb3BMaXN0UmVmKSA9PiBib29sZWFuID0gKCkgPT4gdHJ1ZTtcblxuICAvKiogRW1pdHMgcmlnaHQgYmVmb3JlIGRyYWdnaW5nIGhhcyBzdGFydGVkLiAqL1xuICBiZWZvcmVTdGFydGVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKipcbiAgICogRW1pdHMgd2hlbiB0aGUgdXNlciBoYXMgbW92ZWQgYSBuZXcgZHJhZyBpdGVtIGludG8gdGhpcyBjb250YWluZXIuXG4gICAqL1xuICBlbnRlcmVkID0gbmV3IFN1YmplY3Q8e2l0ZW06IERyYWdSZWYsIGNvbnRhaW5lcjogRHJvcExpc3RSZWYsIGN1cnJlbnRJbmRleDogbnVtYmVyfT4oKTtcblxuICAvKipcbiAgICogRW1pdHMgd2hlbiB0aGUgdXNlciByZW1vdmVzIGFuIGl0ZW0gZnJvbSB0aGUgY29udGFpbmVyXG4gICAqIGJ5IGRyYWdnaW5nIGl0IGludG8gYW5vdGhlciBjb250YWluZXIuXG4gICAqL1xuICBleGl0ZWQgPSBuZXcgU3ViamVjdDx7aXRlbTogRHJhZ1JlZiwgY29udGFpbmVyOiBEcm9wTGlzdFJlZn0+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgZHJvcHMgYW4gaXRlbSBpbnNpZGUgdGhlIGNvbnRhaW5lci4gKi9cbiAgZHJvcHBlZCA9IG5ldyBTdWJqZWN0PHtcbiAgICBpdGVtOiBEcmFnUmVmLFxuICAgIGN1cnJlbnRJbmRleDogbnVtYmVyLFxuICAgIHByZXZpb3VzSW5kZXg6IG51bWJlcixcbiAgICBjb250YWluZXI6IERyb3BMaXN0UmVmLFxuICAgIHByZXZpb3VzQ29udGFpbmVyOiBEcm9wTGlzdFJlZixcbiAgICBpc1BvaW50ZXJPdmVyQ29udGFpbmVyOiBib29sZWFuLFxuICAgIGRpc3RhbmNlOiBQb2ludDtcbiAgfT4oKTtcblxuICAvKiogRW1pdHMgYXMgdGhlIHVzZXIgaXMgc3dhcHBpbmcgaXRlbXMgd2hpbGUgYWN0aXZlbHkgZHJhZ2dpbmcuICovXG4gIHNvcnRlZCA9IG5ldyBTdWJqZWN0PHtcbiAgICBwcmV2aW91c0luZGV4OiBudW1iZXIsXG4gICAgY3VycmVudEluZGV4OiBudW1iZXIsXG4gICAgY29udGFpbmVyOiBEcm9wTGlzdFJlZixcbiAgICBpdGVtOiBEcmFnUmVmXG4gIH0+KCk7XG5cbiAgLyoqIEFyYml0cmFyeSBkYXRhIHRoYXQgY2FuIGJlIGF0dGFjaGVkIHRvIHRoZSBkcm9wIGxpc3QuICovXG4gIGRhdGE6IFQ7XG5cbiAgLyoqIFdoZXRoZXIgYW4gaXRlbSBpbiB0aGUgbGlzdCBpcyBiZWluZyBkcmFnZ2VkLiAqL1xuICBwcml2YXRlIF9pc0RyYWdnaW5nID0gZmFsc2U7XG5cbiAgLyoqIENhY2hlIG9mIHRoZSBkaW1lbnNpb25zIG9mIGFsbCB0aGUgaXRlbXMgaW5zaWRlIHRoZSBjb250YWluZXIuICovXG4gIHByaXZhdGUgX2l0ZW1Qb3NpdGlvbnM6IENhY2hlZEl0ZW1Qb3NpdGlvbltdID0gW107XG5cbiAgLyoqIENhY2hlZCBwb3NpdGlvbnMgb2YgdGhlIHNjcm9sbGFibGUgcGFyZW50IGVsZW1lbnRzLiAqL1xuICBwcml2YXRlIF9wYXJlbnRQb3NpdGlvbnMgPSBuZXcgTWFwPERvY3VtZW50fEhUTUxFbGVtZW50LCB7XG4gICAgc2Nyb2xsUG9zaXRpb246IFNjcm9sbFBvc2l0aW9uLFxuICAgIGNsaWVudFJlY3Q/OiBDbGllbnRSZWN0XG4gIH0+KCk7XG5cbiAgLyoqIENhY2hlZCBgQ2xpZW50UmVjdGAgb2YgdGhlIGRyb3AgbGlzdC4gKi9cbiAgcHJpdmF0ZSBfY2xpZW50UmVjdDogQ2xpZW50UmVjdDtcblxuICAvKipcbiAgICogRHJhZ2dhYmxlIGl0ZW1zIHRoYXQgYXJlIGN1cnJlbnRseSBhY3RpdmUgaW5zaWRlIHRoZSBjb250YWluZXIuIEluY2x1ZGVzIHRoZSBpdGVtc1xuICAgKiBmcm9tIGBfZHJhZ2dhYmxlc2AsIGFzIHdlbGwgYXMgYW55IGl0ZW1zIHRoYXQgaGF2ZSBiZWVuIGRyYWdnZWQgaW4sIGJ1dCBoYXZlbid0XG4gICAqIGJlZW4gZHJvcHBlZCB5ZXQuXG4gICAqL1xuICBwcml2YXRlIF9hY3RpdmVEcmFnZ2FibGVzOiBEcmFnUmVmW107XG5cbiAgLyoqXG4gICAqIEtlZXBzIHRyYWNrIG9mIHRoZSBpdGVtIHRoYXQgd2FzIGxhc3Qgc3dhcHBlZCB3aXRoIHRoZSBkcmFnZ2VkIGl0ZW0sIGFzXG4gICAqIHdlbGwgYXMgd2hhdCBkaXJlY3Rpb24gdGhlIHBvaW50ZXIgd2FzIG1vdmluZyBpbiB3aGVuIHRoZSBzd2FwIG9jY3VyZWQuXG4gICAqL1xuICBwcml2YXRlIF9wcmV2aW91c1N3YXAgPSB7ZHJhZzogbnVsbCBhcyBEcmFnUmVmIHwgbnVsbCwgZGVsdGE6IDB9O1xuXG4gIC8qKiBEcmFnZ2FibGUgaXRlbXMgaW4gdGhlIGNvbnRhaW5lci4gKi9cbiAgcHJpdmF0ZSBfZHJhZ2dhYmxlczogUmVhZG9ubHlBcnJheTxEcmFnUmVmPjtcblxuICAvKiogRHJvcCBsaXN0cyB0aGF0IGFyZSBjb25uZWN0ZWQgdG8gdGhlIGN1cnJlbnQgb25lLiAqL1xuICBwcml2YXRlIF9zaWJsaW5nczogUmVhZG9ubHlBcnJheTxEcm9wTGlzdFJlZj4gPSBbXTtcblxuICAvKiogRGlyZWN0aW9uIGluIHdoaWNoIHRoZSBsaXN0IGlzIG9yaWVudGVkLiAqL1xuICBwcml2YXRlIF9vcmllbnRhdGlvbjogJ2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJyA9ICd2ZXJ0aWNhbCc7XG5cbiAgLyoqIENvbm5lY3RlZCBzaWJsaW5ncyB0aGF0IGN1cnJlbnRseSBoYXZlIGEgZHJhZ2dlZCBpdGVtLiAqL1xuICBwcml2YXRlIF9hY3RpdmVTaWJsaW5ncyA9IG5ldyBTZXQ8RHJvcExpc3RSZWY+KCk7XG5cbiAgLyoqIExheW91dCBkaXJlY3Rpb24gb2YgdGhlIGRyb3AgbGlzdC4gKi9cbiAgcHJpdmF0ZSBfZGlyZWN0aW9uOiBEaXJlY3Rpb24gPSAnbHRyJztcblxuICAvKiogU3Vic2NyaXB0aW9uIHRvIHRoZSB3aW5kb3cgYmVpbmcgc2Nyb2xsZWQuICovXG4gIHByaXZhdGUgX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuXG4gIC8qKiBWZXJ0aWNhbCBkaXJlY3Rpb24gaW4gd2hpY2ggdGhlIGxpc3QgaXMgY3VycmVudGx5IHNjcm9sbGluZy4gKi9cbiAgcHJpdmF0ZSBfdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uTk9ORTtcblxuICAvKiogSG9yaXpvbnRhbCBkaXJlY3Rpb24gaW4gd2hpY2ggdGhlIGxpc3QgaXMgY3VycmVudGx5IHNjcm9sbGluZy4gKi9cbiAgcHJpdmF0ZSBfaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLk5PTkU7XG5cbiAgLyoqIE5vZGUgdGhhdCBpcyBiZWluZyBhdXRvLXNjcm9sbGVkLiAqL1xuICBwcml2YXRlIF9zY3JvbGxOb2RlOiBIVE1MRWxlbWVudCB8IFdpbmRvdztcblxuICAvKiogVXNlZCB0byBzaWduYWwgdG8gdGhlIGN1cnJlbnQgYXV0by1zY3JvbGwgc2VxdWVuY2Ugd2hlbiB0byBzdG9wLiAqL1xuICBwcml2YXRlIF9zdG9wU2Nyb2xsVGltZXJzID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogU2hhZG93IHJvb3Qgb2YgdGhlIGN1cnJlbnQgZWxlbWVudC4gTmVjZXNzYXJ5IGZvciBgZWxlbWVudEZyb21Qb2ludGAgdG8gcmVzb2x2ZSBjb3JyZWN0bHkuICovXG4gIHByaXZhdGUgX2NhY2hlZFNoYWRvd1Jvb3Q6IERvY3VtZW50T3JTaGFkb3dSb290IHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgZG9jdW1lbnQuICovXG4gIHByaXZhdGUgX2RvY3VtZW50OiBEb2N1bWVudDtcblxuICAvKiogRWxlbWVudHMgdGhhdCBjYW4gYmUgc2Nyb2xsZWQgd2hpbGUgdGhlIHVzZXIgaXMgZHJhZ2dpbmcuICovXG4gIHByaXZhdGUgX3Njcm9sbGFibGVFbGVtZW50czogSFRNTEVsZW1lbnRbXTtcblxuICAvKiogSW5pdGlhbCB2YWx1ZSBmb3IgdGhlIGVsZW1lbnQncyBgc2Nyb2xsLXNuYXAtdHlwZWAgc3R5bGUuICovXG4gIHByaXZhdGUgX2luaXRpYWxTY3JvbGxTbmFwOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBIVE1MRWxlbWVudCxcbiAgICBwcml2YXRlIF9kcmFnRHJvcFJlZ2lzdHJ5OiBEcmFnRHJvcFJlZ2lzdHJ5PERyYWdSZWYsIERyb3BMaXN0UmVmPixcbiAgICBfZG9jdW1lbnQ6IGFueSxcbiAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICBwcml2YXRlIF92aWV3cG9ydFJ1bGVyOiBWaWV3cG9ydFJ1bGVyKSB7XG4gICAgdGhpcy5lbGVtZW50ID0gY29lcmNlRWxlbWVudChlbGVtZW50KTtcbiAgICB0aGlzLl9kb2N1bWVudCA9IF9kb2N1bWVudDtcbiAgICB0aGlzLndpdGhTY3JvbGxhYmxlUGFyZW50cyhbdGhpcy5lbGVtZW50XSk7XG4gICAgX2RyYWdEcm9wUmVnaXN0cnkucmVnaXN0ZXJEcm9wQ29udGFpbmVyKHRoaXMpO1xuICB9XG5cbiAgLyoqIFJlbW92ZXMgdGhlIGRyb3AgbGlzdCBmdW5jdGlvbmFsaXR5IGZyb20gdGhlIERPTSBlbGVtZW50LiAqL1xuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuX3N0b3BTY3JvbGxpbmcoKTtcbiAgICB0aGlzLl9zdG9wU2Nyb2xsVGltZXJzLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmJlZm9yZVN0YXJ0ZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmVudGVyZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmV4aXRlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuZHJvcHBlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuc29ydGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fYWN0aXZlU2libGluZ3MuY2xlYXIoKTtcbiAgICB0aGlzLl9zY3JvbGxOb2RlID0gbnVsbCE7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLmNsZWFyKCk7XG4gICAgdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5yZW1vdmVEcm9wQ29udGFpbmVyKHRoaXMpO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgYW4gaXRlbSBmcm9tIHRoaXMgbGlzdCBpcyBjdXJyZW50bHkgYmVpbmcgZHJhZ2dlZC4gKi9cbiAgaXNEcmFnZ2luZygpIHtcbiAgICByZXR1cm4gdGhpcy5faXNEcmFnZ2luZztcbiAgfVxuXG4gIC8qKiBTdGFydHMgZHJhZ2dpbmcgYW4gaXRlbS4gKi9cbiAgc3RhcnQoKTogdm9pZCB7XG4gICAgY29uc3Qgc3R5bGVzID0gY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpLnN0eWxlO1xuICAgIHRoaXMuYmVmb3JlU3RhcnRlZC5uZXh0KCk7XG4gICAgdGhpcy5faXNEcmFnZ2luZyA9IHRydWU7XG5cbiAgICAvLyBXZSBuZWVkIHRvIGRpc2FibGUgc2Nyb2xsIHNuYXBwaW5nIHdoaWxlIHRoZSB1c2VyIGlzIGRyYWdnaW5nLCBiZWNhdXNlIGl0IGJyZWFrcyBhdXRvbWF0aWNcbiAgICAvLyBzY3JvbGxpbmcuIFRoZSBicm93c2VyIHNlZW1zIHRvIHJvdW5kIHRoZSB2YWx1ZSBiYXNlZCBvbiB0aGUgc25hcHBpbmcgcG9pbnRzIHdoaWNoIG1lYW5zXG4gICAgLy8gdGhhdCB3ZSBjYW4ndCBpbmNyZW1lbnQvZGVjcmVtZW50IHRoZSBzY3JvbGwgcG9zaXRpb24uXG4gICAgdGhpcy5faW5pdGlhbFNjcm9sbFNuYXAgPSBzdHlsZXMubXNTY3JvbGxTbmFwVHlwZSB8fCAoc3R5bGVzIGFzIGFueSkuc2Nyb2xsU25hcFR5cGUgfHwgJyc7XG4gICAgKHN0eWxlcyBhcyBhbnkpLnNjcm9sbFNuYXBUeXBlID0gc3R5bGVzLm1zU2Nyb2xsU25hcFR5cGUgPSAnbm9uZSc7XG4gICAgdGhpcy5fY2FjaGVJdGVtcygpO1xuICAgIHRoaXMuX3NpYmxpbmdzLmZvckVhY2goc2libGluZyA9PiBzaWJsaW5nLl9zdGFydFJlY2VpdmluZyh0aGlzKSk7XG4gICAgdGhpcy5fdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9saXN0ZW5Ub1Njcm9sbEV2ZW50cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEVtaXRzIGFuIGV2ZW50IHRvIGluZGljYXRlIHRoYXQgdGhlIHVzZXIgbW92ZWQgYW4gaXRlbSBpbnRvIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdGhhdCB3YXMgbW92ZWQgaW50byB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHBvaW50ZXJZIFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqL1xuICBlbnRlcihpdGVtOiBEcmFnUmVmLCBwb2ludGVyWDogbnVtYmVyLCBwb2ludGVyWTogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy5zdGFydCgpO1xuXG4gICAgLy8gSWYgc29ydGluZyBpcyBkaXNhYmxlZCwgd2Ugd2FudCB0aGUgaXRlbSB0byByZXR1cm4gdG8gaXRzIHN0YXJ0aW5nXG4gICAgLy8gcG9zaXRpb24gaWYgdGhlIHVzZXIgaXMgcmV0dXJuaW5nIGl0IHRvIGl0cyBpbml0aWFsIGNvbnRhaW5lci5cbiAgICBsZXQgbmV3SW5kZXggPSB0aGlzLnNvcnRpbmdEaXNhYmxlZCA/IHRoaXMuX2RyYWdnYWJsZXMuaW5kZXhPZihpdGVtKSA6IC0xO1xuXG4gICAgaWYgKG5ld0luZGV4ID09PSAtMSkge1xuICAgICAgLy8gV2UgdXNlIHRoZSBjb29yZGluYXRlcyBvZiB3aGVyZSB0aGUgaXRlbSBlbnRlcmVkIHRoZSBkcm9wXG4gICAgICAvLyB6b25lIHRvIGZpZ3VyZSBvdXQgYXQgd2hpY2ggaW5kZXggaXQgc2hvdWxkIGJlIGluc2VydGVkLlxuICAgICAgbmV3SW5kZXggPSB0aGlzLl9nZXRJdGVtSW5kZXhGcm9tUG9pbnRlclBvc2l0aW9uKGl0ZW0sIHBvaW50ZXJYLCBwb2ludGVyWSk7XG4gICAgfVxuXG4gICAgY29uc3QgYWN0aXZlRHJhZ2dhYmxlcyA9IHRoaXMuX2FjdGl2ZURyYWdnYWJsZXM7XG4gICAgY29uc3QgY3VycmVudEluZGV4ID0gYWN0aXZlRHJhZ2dhYmxlcy5pbmRleE9mKGl0ZW0pO1xuICAgIGNvbnN0IHBsYWNlaG9sZGVyID0gaXRlbS5nZXRQbGFjZWhvbGRlckVsZW1lbnQoKTtcbiAgICBsZXQgbmV3UG9zaXRpb25SZWZlcmVuY2U6IERyYWdSZWYgfCB1bmRlZmluZWQgPSBhY3RpdmVEcmFnZ2FibGVzW25ld0luZGV4XTtcblxuICAgIC8vIElmIHRoZSBpdGVtIGF0IHRoZSBuZXcgcG9zaXRpb24gaXMgdGhlIHNhbWUgYXMgdGhlIGl0ZW0gdGhhdCBpcyBiZWluZyBkcmFnZ2VkLFxuICAgIC8vIGl0IG1lYW5zIHRoYXQgd2UncmUgdHJ5aW5nIHRvIHJlc3RvcmUgdGhlIGl0ZW0gdG8gaXRzIGluaXRpYWwgcG9zaXRpb24uIEluIHRoaXNcbiAgICAvLyBjYXNlIHdlIHNob3VsZCB1c2UgdGhlIG5leHQgaXRlbSBmcm9tIHRoZSBsaXN0IGFzIHRoZSByZWZlcmVuY2UuXG4gICAgaWYgKG5ld1Bvc2l0aW9uUmVmZXJlbmNlID09PSBpdGVtKSB7XG4gICAgICBuZXdQb3NpdGlvblJlZmVyZW5jZSA9IGFjdGl2ZURyYWdnYWJsZXNbbmV3SW5kZXggKyAxXTtcbiAgICB9XG5cbiAgICAvLyBTaW5jZSB0aGUgaXRlbSBtYXkgYmUgaW4gdGhlIGBhY3RpdmVEcmFnZ2FibGVzYCBhbHJlYWR5IChlLmcuIGlmIHRoZSB1c2VyIGRyYWdnZWQgaXRcbiAgICAvLyBpbnRvIGFub3RoZXIgY29udGFpbmVyIGFuZCBiYWNrIGFnYWluKSwgd2UgaGF2ZSB0byBlbnN1cmUgdGhhdCBpdCBpc24ndCBkdXBsaWNhdGVkLlxuICAgIGlmIChjdXJyZW50SW5kZXggPiAtMSkge1xuICAgICAgYWN0aXZlRHJhZ2dhYmxlcy5zcGxpY2UoY3VycmVudEluZGV4LCAxKTtcbiAgICB9XG5cbiAgICAvLyBEb24ndCB1c2UgaXRlbXMgdGhhdCBhcmUgYmVpbmcgZHJhZ2dlZCBhcyBhIHJlZmVyZW5jZSwgYmVjYXVzZVxuICAgIC8vIHRoZWlyIGVsZW1lbnQgaGFzIGJlZW4gbW92ZWQgZG93biB0byB0aGUgYm90dG9tIG9mIHRoZSBib2R5LlxuICAgIGlmIChuZXdQb3NpdGlvblJlZmVyZW5jZSAmJiAhdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5pc0RyYWdnaW5nKG5ld1Bvc2l0aW9uUmVmZXJlbmNlKSkge1xuICAgICAgY29uc3QgZWxlbWVudCA9IG5ld1Bvc2l0aW9uUmVmZXJlbmNlLmdldFJvb3RFbGVtZW50KCk7XG4gICAgICBlbGVtZW50LnBhcmVudEVsZW1lbnQhLmluc2VydEJlZm9yZShwbGFjZWhvbGRlciwgZWxlbWVudCk7XG4gICAgICBhY3RpdmVEcmFnZ2FibGVzLnNwbGljZShuZXdJbmRleCwgMCwgaXRlbSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KS5hcHBlbmRDaGlsZChwbGFjZWhvbGRlcik7XG4gICAgICBhY3RpdmVEcmFnZ2FibGVzLnB1c2goaXRlbSk7XG4gICAgfVxuXG4gICAgLy8gVGhlIHRyYW5zZm9ybSBuZWVkcyB0byBiZSBjbGVhcmVkIHNvIGl0IGRvZXNuJ3QgdGhyb3cgb2ZmIHRoZSBtZWFzdXJlbWVudHMuXG4gICAgcGxhY2Vob2xkZXIuc3R5bGUudHJhbnNmb3JtID0gJyc7XG5cbiAgICAvLyBOb3RlIHRoYXQgdGhlIHBvc2l0aW9ucyB3ZXJlIGFscmVhZHkgY2FjaGVkIHdoZW4gd2UgY2FsbGVkIGBzdGFydGAgYWJvdmUsXG4gICAgLy8gYnV0IHdlIG5lZWQgdG8gcmVmcmVzaCB0aGVtIHNpbmNlIHRoZSBhbW91bnQgb2YgaXRlbXMgaGFzIGNoYW5nZWQuXG4gICAgdGhpcy5fY2FjaGVJdGVtUG9zaXRpb25zKCk7XG4gICAgdGhpcy5lbnRlcmVkLm5leHQoe2l0ZW0sIGNvbnRhaW5lcjogdGhpcywgY3VycmVudEluZGV4OiB0aGlzLmdldEl0ZW1JbmRleChpdGVtKX0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYW4gaXRlbSBmcm9tIHRoZSBjb250YWluZXIgYWZ0ZXIgaXQgd2FzIGRyYWdnZWQgaW50byBhbm90aGVyIGNvbnRhaW5lciBieSB0aGUgdXNlci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB0aGF0IHdhcyBkcmFnZ2VkIG91dC5cbiAgICovXG4gIGV4aXQoaXRlbTogRHJhZ1JlZik6IHZvaWQge1xuICAgIHRoaXMuX3Jlc2V0KCk7XG4gICAgdGhpcy5leGl0ZWQubmV4dCh7aXRlbSwgY29udGFpbmVyOiB0aGlzfSk7XG4gIH1cblxuICAvKipcbiAgICogRHJvcHMgYW4gaXRlbSBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIGJlaW5nIGRyb3BwZWQgaW50byB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gY3VycmVudEluZGV4IEluZGV4IGF0IHdoaWNoIHRoZSBpdGVtIHNob3VsZCBiZSBpbnNlcnRlZC5cbiAgICogQHBhcmFtIHByZXZpb3VzQ29udGFpbmVyIENvbnRhaW5lciBmcm9tIHdoaWNoIHRoZSBpdGVtIGdvdCBkcmFnZ2VkIGluLlxuICAgKiBAcGFyYW0gaXNQb2ludGVyT3ZlckNvbnRhaW5lciBXaGV0aGVyIHRoZSB1c2VyJ3MgcG9pbnRlciB3YXMgb3ZlciB0aGVcbiAgICogICAgY29udGFpbmVyIHdoZW4gdGhlIGl0ZW0gd2FzIGRyb3BwZWQuXG4gICAqIEBwYXJhbSBkaXN0YW5jZSBEaXN0YW5jZSB0aGUgdXNlciBoYXMgZHJhZ2dlZCBzaW5jZSB0aGUgc3RhcnQgb2YgdGhlIGRyYWdnaW5nIHNlcXVlbmNlLlxuICAgKi9cbiAgZHJvcChpdGVtOiBEcmFnUmVmLCBjdXJyZW50SW5kZXg6IG51bWJlciwgcHJldmlvdXNDb250YWluZXI6IERyb3BMaXN0UmVmLFxuICAgIGlzUG9pbnRlck92ZXJDb250YWluZXI6IGJvb2xlYW4sIGRpc3RhbmNlOiBQb2ludCk6IHZvaWQge1xuICAgIHRoaXMuX3Jlc2V0KCk7XG4gICAgdGhpcy5kcm9wcGVkLm5leHQoe1xuICAgICAgaXRlbSxcbiAgICAgIGN1cnJlbnRJbmRleCxcbiAgICAgIHByZXZpb3VzSW5kZXg6IHByZXZpb3VzQ29udGFpbmVyLmdldEl0ZW1JbmRleChpdGVtKSxcbiAgICAgIGNvbnRhaW5lcjogdGhpcyxcbiAgICAgIHByZXZpb3VzQ29udGFpbmVyLFxuICAgICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcixcbiAgICAgIGRpc3RhbmNlXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZHJhZ2dhYmxlIGl0ZW1zIHRoYXQgYXJlIGEgcGFydCBvZiB0aGlzIGxpc3QuXG4gICAqIEBwYXJhbSBpdGVtcyBJdGVtcyB0aGF0IGFyZSBhIHBhcnQgb2YgdGhpcyBsaXN0LlxuICAgKi9cbiAgd2l0aEl0ZW1zKGl0ZW1zOiBEcmFnUmVmW10pOiB0aGlzIHtcbiAgICB0aGlzLl9kcmFnZ2FibGVzID0gaXRlbXM7XG4gICAgaXRlbXMuZm9yRWFjaChpdGVtID0+IGl0ZW0uX3dpdGhEcm9wQ29udGFpbmVyKHRoaXMpKTtcblxuICAgIGlmICh0aGlzLmlzRHJhZ2dpbmcoKSkge1xuICAgICAgdGhpcy5fY2FjaGVJdGVtcygpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFNldHMgdGhlIGxheW91dCBkaXJlY3Rpb24gb2YgdGhlIGRyb3AgbGlzdC4gKi9cbiAgd2l0aERpcmVjdGlvbihkaXJlY3Rpb246IERpcmVjdGlvbik6IHRoaXMge1xuICAgIHRoaXMuX2RpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjb250YWluZXJzIHRoYXQgYXJlIGNvbm5lY3RlZCB0byB0aGlzIG9uZS4gV2hlbiB0d28gb3IgbW9yZSBjb250YWluZXJzIGFyZVxuICAgKiBjb25uZWN0ZWQsIHRoZSB1c2VyIHdpbGwgYmUgYWxsb3dlZCB0byB0cmFuc2ZlciBpdGVtcyBiZXR3ZWVuIHRoZW0uXG4gICAqIEBwYXJhbSBjb25uZWN0ZWRUbyBPdGhlciBjb250YWluZXJzIHRoYXQgdGhlIGN1cnJlbnQgY29udGFpbmVycyBzaG91bGQgYmUgY29ubmVjdGVkIHRvLlxuICAgKi9cbiAgY29ubmVjdGVkVG8oY29ubmVjdGVkVG86IERyb3BMaXN0UmVmW10pOiB0aGlzIHtcbiAgICB0aGlzLl9zaWJsaW5ncyA9IGNvbm5lY3RlZFRvLnNsaWNlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgb3JpZW50YXRpb24gb2YgdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIG9yaWVudGF0aW9uIE5ldyBvcmllbnRhdGlvbiBmb3IgdGhlIGNvbnRhaW5lci5cbiAgICovXG4gIHdpdGhPcmllbnRhdGlvbihvcmllbnRhdGlvbjogJ3ZlcnRpY2FsJyB8ICdob3Jpem9udGFsJyk6IHRoaXMge1xuICAgIHRoaXMuX29yaWVudGF0aW9uID0gb3JpZW50YXRpb247XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB3aGljaCBwYXJlbnQgZWxlbWVudHMgYXJlIGNhbiBiZSBzY3JvbGxlZCB3aGlsZSB0aGUgdXNlciBpcyBkcmFnZ2luZy5cbiAgICogQHBhcmFtIGVsZW1lbnRzIEVsZW1lbnRzIHRoYXQgY2FuIGJlIHNjcm9sbGVkLlxuICAgKi9cbiAgd2l0aFNjcm9sbGFibGVQYXJlbnRzKGVsZW1lbnRzOiBIVE1MRWxlbWVudFtdKTogdGhpcyB7XG4gICAgY29uc3QgZWxlbWVudCA9IGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KTtcblxuICAgIC8vIFdlIGFsd2F5cyBhbGxvdyB0aGUgY3VycmVudCBlbGVtZW50IHRvIGJlIHNjcm9sbGFibGVcbiAgICAvLyBzbyB3ZSBuZWVkIHRvIGVuc3VyZSB0aGF0IGl0J3MgaW4gdGhlIGFycmF5LlxuICAgIHRoaXMuX3Njcm9sbGFibGVFbGVtZW50cyA9XG4gICAgICAgIGVsZW1lbnRzLmluZGV4T2YoZWxlbWVudCkgPT09IC0xID8gW2VsZW1lbnQsIC4uLmVsZW1lbnRzXSA6IGVsZW1lbnRzLnNsaWNlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogRmlndXJlcyBvdXQgdGhlIGluZGV4IG9mIGFuIGl0ZW0gaW4gdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB3aG9zZSBpbmRleCBzaG91bGQgYmUgZGV0ZXJtaW5lZC5cbiAgICovXG4gIGdldEl0ZW1JbmRleChpdGVtOiBEcmFnUmVmKTogbnVtYmVyIHtcbiAgICBpZiAoIXRoaXMuX2lzRHJhZ2dpbmcpIHtcbiAgICAgIHJldHVybiB0aGlzLl9kcmFnZ2FibGVzLmluZGV4T2YoaXRlbSk7XG4gICAgfVxuXG4gICAgLy8gSXRlbXMgYXJlIHNvcnRlZCBhbHdheXMgYnkgdG9wL2xlZnQgaW4gdGhlIGNhY2hlLCBob3dldmVyIHRoZXkgZmxvdyBkaWZmZXJlbnRseSBpbiBSVEwuXG4gICAgLy8gVGhlIHJlc3Qgb2YgdGhlIGxvZ2ljIHN0aWxsIHN0YW5kcyBubyBtYXR0ZXIgd2hhdCBvcmllbnRhdGlvbiB3ZSdyZSBpbiwgaG93ZXZlclxuICAgIC8vIHdlIG5lZWQgdG8gaW52ZXJ0IHRoZSBhcnJheSB3aGVuIGRldGVybWluaW5nIHRoZSBpbmRleC5cbiAgICBjb25zdCBpdGVtcyA9IHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcgJiYgdGhpcy5fZGlyZWN0aW9uID09PSAncnRsJyA/XG4gICAgICAgIHRoaXMuX2l0ZW1Qb3NpdGlvbnMuc2xpY2UoKS5yZXZlcnNlKCkgOiB0aGlzLl9pdGVtUG9zaXRpb25zO1xuXG4gICAgcmV0dXJuIGZpbmRJbmRleChpdGVtcywgY3VycmVudEl0ZW0gPT4gY3VycmVudEl0ZW0uZHJhZyA9PT0gaXRlbSk7XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0aGUgbGlzdCBpcyBhYmxlIHRvIHJlY2VpdmUgdGhlIGl0ZW0gdGhhdFxuICAgKiBpcyBjdXJyZW50bHkgYmVpbmcgZHJhZ2dlZCBpbnNpZGUgYSBjb25uZWN0ZWQgZHJvcCBsaXN0LlxuICAgKi9cbiAgaXNSZWNlaXZpbmcoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2FjdGl2ZVNpYmxpbmdzLnNpemUgPiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIFNvcnRzIGFuIGl0ZW0gaW5zaWRlIHRoZSBjb250YWluZXIgYmFzZWQgb24gaXRzIHBvc2l0aW9uLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRvIGJlIHNvcnRlZC5cbiAgICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKiBAcGFyYW0gcG9pbnRlckRlbHRhIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgcG9pbnRlciBpcyBtb3ZpbmcgYWxvbmcgZWFjaCBheGlzLlxuICAgKi9cbiAgX3NvcnRJdGVtKGl0ZW06IERyYWdSZWYsIHBvaW50ZXJYOiBudW1iZXIsIHBvaW50ZXJZOiBudW1iZXIsXG4gICAgICAgICAgICBwb2ludGVyRGVsdGE6IHt4OiBudW1iZXIsIHk6IG51bWJlcn0pOiB2b2lkIHtcbiAgICAvLyBEb24ndCBzb3J0IHRoZSBpdGVtIGlmIHNvcnRpbmcgaXMgZGlzYWJsZWQgb3IgaXQncyBvdXQgb2YgcmFuZ2UuXG4gICAgaWYgKHRoaXMuc29ydGluZ0Rpc2FibGVkIHx8ICFpc1BvaW50ZXJOZWFyQ2xpZW50UmVjdCh0aGlzLl9jbGllbnRSZWN0LCBwb2ludGVyWCwgcG9pbnRlclkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc2libGluZ3MgPSB0aGlzLl9pdGVtUG9zaXRpb25zO1xuICAgIGNvbnN0IG5ld0luZGV4ID0gdGhpcy5fZ2V0SXRlbUluZGV4RnJvbVBvaW50ZXJQb3NpdGlvbihpdGVtLCBwb2ludGVyWCwgcG9pbnRlclksIHBvaW50ZXJEZWx0YSk7XG5cbiAgICBpZiAobmV3SW5kZXggPT09IC0xICYmIHNpYmxpbmdzLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuICAgIGNvbnN0IGN1cnJlbnRJbmRleCA9IGZpbmRJbmRleChzaWJsaW5ncywgY3VycmVudEl0ZW0gPT4gY3VycmVudEl0ZW0uZHJhZyA9PT0gaXRlbSk7XG4gICAgY29uc3Qgc2libGluZ0F0TmV3UG9zaXRpb24gPSBzaWJsaW5nc1tuZXdJbmRleF07XG4gICAgY29uc3QgY3VycmVudFBvc2l0aW9uID0gc2libGluZ3NbY3VycmVudEluZGV4XS5jbGllbnRSZWN0O1xuICAgIGNvbnN0IG5ld1Bvc2l0aW9uID0gc2libGluZ0F0TmV3UG9zaXRpb24uY2xpZW50UmVjdDtcbiAgICBjb25zdCBkZWx0YSA9IGN1cnJlbnRJbmRleCA+IG5ld0luZGV4ID8gMSA6IC0xO1xuXG4gICAgdGhpcy5fcHJldmlvdXNTd2FwLmRyYWcgPSBzaWJsaW5nQXROZXdQb3NpdGlvbi5kcmFnO1xuICAgIHRoaXMuX3ByZXZpb3VzU3dhcC5kZWx0YSA9IGlzSG9yaXpvbnRhbCA/IHBvaW50ZXJEZWx0YS54IDogcG9pbnRlckRlbHRhLnk7XG5cbiAgICAvLyBIb3cgbWFueSBwaXhlbHMgdGhlIGl0ZW0ncyBwbGFjZWhvbGRlciBzaG91bGQgYmUgb2Zmc2V0LlxuICAgIGNvbnN0IGl0ZW1PZmZzZXQgPSB0aGlzLl9nZXRJdGVtT2Zmc2V0UHgoY3VycmVudFBvc2l0aW9uLCBuZXdQb3NpdGlvbiwgZGVsdGEpO1xuXG4gICAgLy8gSG93IG1hbnkgcGl4ZWxzIGFsbCB0aGUgb3RoZXIgaXRlbXMgc2hvdWxkIGJlIG9mZnNldC5cbiAgICBjb25zdCBzaWJsaW5nT2Zmc2V0ID0gdGhpcy5fZ2V0U2libGluZ09mZnNldFB4KGN1cnJlbnRJbmRleCwgc2libGluZ3MsIGRlbHRhKTtcblxuICAgIC8vIFNhdmUgdGhlIHByZXZpb3VzIG9yZGVyIG9mIHRoZSBpdGVtcyBiZWZvcmUgbW92aW5nIHRoZSBpdGVtIHRvIGl0cyBuZXcgaW5kZXguXG4gICAgLy8gV2UgdXNlIHRoaXMgdG8gY2hlY2sgd2hldGhlciBhbiBpdGVtIGhhcyBiZWVuIG1vdmVkIGFzIGEgcmVzdWx0IG9mIHRoZSBzb3J0aW5nLlxuICAgIGNvbnN0IG9sZE9yZGVyID0gc2libGluZ3Muc2xpY2UoKTtcblxuICAgIC8vIFNodWZmbGUgdGhlIGFycmF5IGluIHBsYWNlLlxuICAgIG1vdmVJdGVtSW5BcnJheShzaWJsaW5ncywgY3VycmVudEluZGV4LCBuZXdJbmRleCk7XG5cbiAgICB0aGlzLnNvcnRlZC5uZXh0KHtcbiAgICAgIHByZXZpb3VzSW5kZXg6IGN1cnJlbnRJbmRleCxcbiAgICAgIGN1cnJlbnRJbmRleDogbmV3SW5kZXgsXG4gICAgICBjb250YWluZXI6IHRoaXMsXG4gICAgICBpdGVtXG4gICAgfSk7XG5cbiAgICBzaWJsaW5ncy5mb3JFYWNoKChzaWJsaW5nLCBpbmRleCkgPT4ge1xuICAgICAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgdGhlIHBvc2l0aW9uIGhhc24ndCBjaGFuZ2VkLlxuICAgICAgaWYgKG9sZE9yZGVyW2luZGV4XSA9PT0gc2libGluZykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGlzRHJhZ2dlZEl0ZW0gPSBzaWJsaW5nLmRyYWcgPT09IGl0ZW07XG4gICAgICBjb25zdCBvZmZzZXQgPSBpc0RyYWdnZWRJdGVtID8gaXRlbU9mZnNldCA6IHNpYmxpbmdPZmZzZXQ7XG4gICAgICBjb25zdCBlbGVtZW50VG9PZmZzZXQgPSBpc0RyYWdnZWRJdGVtID8gaXRlbS5nZXRQbGFjZWhvbGRlckVsZW1lbnQoKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2libGluZy5kcmFnLmdldFJvb3RFbGVtZW50KCk7XG5cbiAgICAgIC8vIFVwZGF0ZSB0aGUgb2Zmc2V0IHRvIHJlZmxlY3QgdGhlIG5ldyBwb3NpdGlvbi5cbiAgICAgIHNpYmxpbmcub2Zmc2V0ICs9IG9mZnNldDtcblxuICAgICAgLy8gU2luY2Ugd2UncmUgbW92aW5nIHRoZSBpdGVtcyB3aXRoIGEgYHRyYW5zZm9ybWAsIHdlIG5lZWQgdG8gYWRqdXN0IHRoZWlyIGNhY2hlZFxuICAgICAgLy8gY2xpZW50IHJlY3RzIHRvIHJlZmxlY3QgdGhlaXIgbmV3IHBvc2l0aW9uLCBhcyB3ZWxsIGFzIHN3YXAgdGhlaXIgcG9zaXRpb25zIGluIHRoZSBjYWNoZS5cbiAgICAgIC8vIE5vdGUgdGhhdCB3ZSBzaG91bGRuJ3QgdXNlIGBnZXRCb3VuZGluZ0NsaWVudFJlY3RgIGhlcmUgdG8gdXBkYXRlIHRoZSBjYWNoZSwgYmVjYXVzZSB0aGVcbiAgICAgIC8vIGVsZW1lbnRzIG1heSBiZSBtaWQtYW5pbWF0aW9uIHdoaWNoIHdpbGwgZ2l2ZSB1cyBhIHdyb25nIHJlc3VsdC5cbiAgICAgIGlmIChpc0hvcml6b250YWwpIHtcbiAgICAgICAgLy8gUm91bmQgdGhlIHRyYW5zZm9ybXMgc2luY2Ugc29tZSBicm93c2VycyB3aWxsXG4gICAgICAgIC8vIGJsdXIgdGhlIGVsZW1lbnRzLCBmb3Igc3ViLXBpeGVsIHRyYW5zZm9ybXMuXG4gICAgICAgIGVsZW1lbnRUb09mZnNldC5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlM2QoJHtNYXRoLnJvdW5kKHNpYmxpbmcub2Zmc2V0KX1weCwgMCwgMClgO1xuICAgICAgICBhZGp1c3RDbGllbnRSZWN0KHNpYmxpbmcuY2xpZW50UmVjdCwgMCwgb2Zmc2V0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsZW1lbnRUb09mZnNldC5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlM2QoMCwgJHtNYXRoLnJvdW5kKHNpYmxpbmcub2Zmc2V0KX1weCwgMClgO1xuICAgICAgICBhZGp1c3RDbGllbnRSZWN0KHNpYmxpbmcuY2xpZW50UmVjdCwgb2Zmc2V0LCAwKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgdXNlcidzIHBvaW50ZXIgaXMgY2xvc2UgdG8gdGhlIGVkZ2VzIG9mIGVpdGhlciB0aGVcbiAgICogdmlld3BvcnQgb3IgdGhlIGRyb3AgbGlzdCBhbmQgc3RhcnRzIHRoZSBhdXRvLXNjcm9sbCBzZXF1ZW5jZS5cbiAgICogQHBhcmFtIHBvaW50ZXJYIFVzZXIncyBwb2ludGVyIHBvc2l0aW9uIGFsb25nIHRoZSB4IGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBVc2VyJ3MgcG9pbnRlciBwb3NpdGlvbiBhbG9uZyB0aGUgeSBheGlzLlxuICAgKi9cbiAgX3N0YXJ0U2Nyb2xsaW5nSWZOZWNlc3NhcnkocG9pbnRlclg6IG51bWJlciwgcG9pbnRlclk6IG51bWJlcikge1xuICAgIGlmICh0aGlzLmF1dG9TY3JvbGxEaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBzY3JvbGxOb2RlOiBIVE1MRWxlbWVudCB8IFdpbmRvdyB8IHVuZGVmaW5lZDtcbiAgICBsZXQgdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uTk9ORTtcbiAgICBsZXQgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLk5PTkU7XG5cbiAgICAvLyBDaGVjayB3aGV0aGVyIHdlIHNob3VsZCBzdGFydCBzY3JvbGxpbmcgYW55IG9mIHRoZSBwYXJlbnQgY29udGFpbmVycy5cbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuZm9yRWFjaCgocG9zaXRpb24sIGVsZW1lbnQpID0+IHtcbiAgICAgIC8vIFdlIGhhdmUgc3BlY2lhbCBoYW5kbGluZyBmb3IgdGhlIGBkb2N1bWVudGAgYmVsb3cuIEFsc28gdGhpcyB3b3VsZCBiZVxuICAgICAgLy8gbmljZXIgd2l0aCBhICBmb3IuLi5vZiBsb29wLCBidXQgaXQgcmVxdWlyZXMgY2hhbmdpbmcgYSBjb21waWxlciBmbGFnLlxuICAgICAgaWYgKGVsZW1lbnQgPT09IHRoaXMuX2RvY3VtZW50IHx8ICFwb3NpdGlvbi5jbGllbnRSZWN0IHx8IHNjcm9sbE5vZGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNQb2ludGVyTmVhckNsaWVudFJlY3QocG9zaXRpb24uY2xpZW50UmVjdCwgcG9pbnRlclgsIHBvaW50ZXJZKSkge1xuICAgICAgICBbdmVydGljYWxTY3JvbGxEaXJlY3Rpb24sIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb25dID0gZ2V0RWxlbWVudFNjcm9sbERpcmVjdGlvbnMoXG4gICAgICAgICAgICBlbGVtZW50IGFzIEhUTUxFbGVtZW50LCBwb3NpdGlvbi5jbGllbnRSZWN0LCBwb2ludGVyWCwgcG9pbnRlclkpO1xuXG4gICAgICAgIGlmICh2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiB8fCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKSB7XG4gICAgICAgICAgc2Nyb2xsTm9kZSA9IGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIE90aGVyd2lzZSBjaGVjayBpZiB3ZSBjYW4gc3RhcnQgc2Nyb2xsaW5nIHRoZSB2aWV3cG9ydC5cbiAgICBpZiAoIXZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uICYmICFob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKSB7XG4gICAgICBjb25zdCB7d2lkdGgsIGhlaWdodH0gPSB0aGlzLl92aWV3cG9ydFJ1bGVyLmdldFZpZXdwb3J0U2l6ZSgpO1xuICAgICAgY29uc3QgY2xpZW50UmVjdCA9IHt3aWR0aCwgaGVpZ2h0LCB0b3A6IDAsIHJpZ2h0OiB3aWR0aCwgYm90dG9tOiBoZWlnaHQsIGxlZnQ6IDB9O1xuICAgICAgdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSBnZXRWZXJ0aWNhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0LCBwb2ludGVyWSk7XG4gICAgICBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gZ2V0SG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0LCBwb2ludGVyWCk7XG4gICAgICBzY3JvbGxOb2RlID0gd2luZG93O1xuICAgIH1cblxuICAgIGlmIChzY3JvbGxOb2RlICYmICh2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiAhPT0gdGhpcy5fdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gfHxcbiAgICAgICAgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiAhPT0gdGhpcy5faG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiB8fFxuICAgICAgICBzY3JvbGxOb2RlICE9PSB0aGlzLl9zY3JvbGxOb2RlKSkge1xuICAgICAgdGhpcy5fdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSB2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbjtcbiAgICAgIHRoaXMuX2hvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uO1xuICAgICAgdGhpcy5fc2Nyb2xsTm9kZSA9IHNjcm9sbE5vZGU7XG5cbiAgICAgIGlmICgodmVydGljYWxTY3JvbGxEaXJlY3Rpb24gfHwgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbikgJiYgc2Nyb2xsTm9kZSkge1xuICAgICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIodGhpcy5fc3RhcnRTY3JvbGxJbnRlcnZhbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9zdG9wU2Nyb2xsaW5nKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIFN0b3BzIGFueSBjdXJyZW50bHktcnVubmluZyBhdXRvLXNjcm9sbCBzZXF1ZW5jZXMuICovXG4gIF9zdG9wU2Nyb2xsaW5nKCkge1xuICAgIHRoaXMuX3N0b3BTY3JvbGxUaW1lcnMubmV4dCgpO1xuICB9XG5cbiAgLyoqIENhY2hlcyB0aGUgcG9zaXRpb25zIG9mIHRoZSBjb25maWd1cmVkIHNjcm9sbGFibGUgcGFyZW50cy4gKi9cbiAgcHJpdmF0ZSBfY2FjaGVQYXJlbnRQb3NpdGlvbnMoKSB7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLmNsZWFyKCk7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLnNldCh0aGlzLl9kb2N1bWVudCwge1xuICAgICAgc2Nyb2xsUG9zaXRpb246IHRoaXMuX3ZpZXdwb3J0UnVsZXIhLmdldFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24oKSxcbiAgICB9KTtcbiAgICB0aGlzLl9zY3JvbGxhYmxlRWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgIGNvbnN0IGNsaWVudFJlY3QgPSBnZXRNdXRhYmxlQ2xpZW50UmVjdChlbGVtZW50KTtcblxuICAgICAgLy8gV2Uga2VlcCB0aGUgQ2xpZW50UmVjdCBjYWNoZWQgaW4gdHdvIHByb3BlcnRpZXMsIGJlY2F1c2UgaXQncyByZWZlcmVuY2VkIGluIGEgbG90IG9mXG4gICAgICAvLyBwZXJmb3JtYW5jZS1zZW5zaXRpdmUgcGxhY2VzIGFuZCB3ZSB3YW50IHRvIGF2b2lkIHRoZSBleHRyYSBsb29rdXBzLiBUaGUgYGVsZW1lbnRgIGlzXG4gICAgICAvLyBndWFyYW50ZWVkIHRvIGFsd2F5cyBiZSBpbiB0aGUgYF9zY3JvbGxhYmxlRWxlbWVudHNgIHNvIHRoaXMgc2hvdWxkIGFsd2F5cyBtYXRjaC5cbiAgICAgIGlmIChlbGVtZW50ID09PSB0aGlzLmVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5fY2xpZW50UmVjdCA9IGNsaWVudFJlY3Q7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5zZXQoZWxlbWVudCwge1xuICAgICAgICBzY3JvbGxQb3NpdGlvbjoge3RvcDogZWxlbWVudC5zY3JvbGxUb3AsIGxlZnQ6IGVsZW1lbnQuc2Nyb2xsTGVmdH0sXG4gICAgICAgIGNsaWVudFJlY3RcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIFJlZnJlc2hlcyB0aGUgcG9zaXRpb24gY2FjaGUgb2YgdGhlIGl0ZW1zIGFuZCBzaWJsaW5nIGNvbnRhaW5lcnMuICovXG4gIHByaXZhdGUgX2NhY2hlSXRlbVBvc2l0aW9ucygpIHtcbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuXG4gICAgdGhpcy5faXRlbVBvc2l0aW9ucyA9IHRoaXMuX2FjdGl2ZURyYWdnYWJsZXMubWFwKGRyYWcgPT4ge1xuICAgICAgY29uc3QgZWxlbWVudFRvTWVhc3VyZSA9IHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuaXNEcmFnZ2luZyhkcmFnKSA/XG4gICAgICAgICAgLy8gSWYgdGhlIGVsZW1lbnQgaXMgYmVpbmcgZHJhZ2dlZCwgd2UgaGF2ZSB0byBtZWFzdXJlIHRoZVxuICAgICAgICAgIC8vIHBsYWNlaG9sZGVyLCBiZWNhdXNlIHRoZSBlbGVtZW50IGlzIGhpZGRlbi5cbiAgICAgICAgICBkcmFnLmdldFBsYWNlaG9sZGVyRWxlbWVudCgpIDpcbiAgICAgICAgICBkcmFnLmdldFJvb3RFbGVtZW50KCk7XG4gICAgICByZXR1cm4ge2RyYWcsIG9mZnNldDogMCwgY2xpZW50UmVjdDogZ2V0TXV0YWJsZUNsaWVudFJlY3QoZWxlbWVudFRvTWVhc3VyZSl9O1xuICAgIH0pLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgIHJldHVybiBpc0hvcml6b250YWwgPyBhLmNsaWVudFJlY3QubGVmdCAtIGIuY2xpZW50UmVjdC5sZWZ0IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhLmNsaWVudFJlY3QudG9wIC0gYi5jbGllbnRSZWN0LnRvcDtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBSZXNldHMgdGhlIGNvbnRhaW5lciB0byBpdHMgaW5pdGlhbCBzdGF0ZS4gKi9cbiAgcHJpdmF0ZSBfcmVzZXQoKSB7XG4gICAgdGhpcy5faXNEcmFnZ2luZyA9IGZhbHNlO1xuXG4gICAgY29uc3Qgc3R5bGVzID0gY29lcmNlRWxlbWVudCh0aGlzLmVsZW1lbnQpLnN0eWxlO1xuICAgIChzdHlsZXMgYXMgYW55KS5zY3JvbGxTbmFwVHlwZSA9IHN0eWxlcy5tc1Njcm9sbFNuYXBUeXBlID0gdGhpcy5faW5pdGlhbFNjcm9sbFNuYXA7XG5cbiAgICAvLyBUT0RPKGNyaXNiZXRvKTogbWF5IGhhdmUgdG8gd2FpdCBmb3IgdGhlIGFuaW1hdGlvbnMgdG8gZmluaXNoLlxuICAgIHRoaXMuX2FjdGl2ZURyYWdnYWJsZXMuZm9yRWFjaChpdGVtID0+IGl0ZW0uZ2V0Um9vdEVsZW1lbnQoKS5zdHlsZS50cmFuc2Zvcm0gPSAnJyk7XG4gICAgdGhpcy5fc2libGluZ3MuZm9yRWFjaChzaWJsaW5nID0+IHNpYmxpbmcuX3N0b3BSZWNlaXZpbmcodGhpcykpO1xuICAgIHRoaXMuX2FjdGl2ZURyYWdnYWJsZXMgPSBbXTtcbiAgICB0aGlzLl9pdGVtUG9zaXRpb25zID0gW107XG4gICAgdGhpcy5fcHJldmlvdXNTd2FwLmRyYWcgPSBudWxsO1xuICAgIHRoaXMuX3ByZXZpb3VzU3dhcC5kZWx0YSA9IDA7XG4gICAgdGhpcy5fc3RvcFNjcm9sbGluZygpO1xuICAgIHRoaXMuX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLmNsZWFyKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgb2Zmc2V0IGluIHBpeGVscyBieSB3aGljaCB0aGUgaXRlbXMgdGhhdCBhcmVuJ3QgYmVpbmcgZHJhZ2dlZCBzaG91bGQgYmUgbW92ZWQuXG4gICAqIEBwYXJhbSBjdXJyZW50SW5kZXggSW5kZXggb2YgdGhlIGl0ZW0gY3VycmVudGx5IGJlaW5nIGRyYWdnZWQuXG4gICAqIEBwYXJhbSBzaWJsaW5ncyBBbGwgb2YgdGhlIGl0ZW1zIGluIHRoZSBsaXN0LlxuICAgKiBAcGFyYW0gZGVsdGEgRGlyZWN0aW9uIGluIHdoaWNoIHRoZSB1c2VyIGlzIG1vdmluZy5cbiAgICovXG4gIHByaXZhdGUgX2dldFNpYmxpbmdPZmZzZXRQeChjdXJyZW50SW5kZXg6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpYmxpbmdzOiBDYWNoZWRJdGVtUG9zaXRpb25bXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhOiAxIHwgLTEpIHtcblxuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCc7XG4gICAgY29uc3QgY3VycmVudFBvc2l0aW9uID0gc2libGluZ3NbY3VycmVudEluZGV4XS5jbGllbnRSZWN0O1xuICAgIGNvbnN0IGltbWVkaWF0ZVNpYmxpbmcgPSBzaWJsaW5nc1tjdXJyZW50SW5kZXggKyBkZWx0YSAqIC0xXTtcbiAgICBsZXQgc2libGluZ09mZnNldCA9IGN1cnJlbnRQb3NpdGlvbltpc0hvcml6b250YWwgPyAnd2lkdGgnIDogJ2hlaWdodCddICogZGVsdGE7XG5cbiAgICBpZiAoaW1tZWRpYXRlU2libGluZykge1xuICAgICAgY29uc3Qgc3RhcnQgPSBpc0hvcml6b250YWwgPyAnbGVmdCcgOiAndG9wJztcbiAgICAgIGNvbnN0IGVuZCA9IGlzSG9yaXpvbnRhbCA/ICdyaWdodCcgOiAnYm90dG9tJztcblxuICAgICAgLy8gR2V0IHRoZSBzcGFjaW5nIGJldHdlZW4gdGhlIHN0YXJ0IG9mIHRoZSBjdXJyZW50IGl0ZW0gYW5kIHRoZSBlbmQgb2YgdGhlIG9uZSBpbW1lZGlhdGVseVxuICAgICAgLy8gYWZ0ZXIgaXQgaW4gdGhlIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgdXNlciBpcyBkcmFnZ2luZywgb3IgdmljZSB2ZXJzYS4gV2UgYWRkIGl0IHRvIHRoZVxuICAgICAgLy8gb2Zmc2V0IGluIG9yZGVyIHRvIHB1c2ggdGhlIGVsZW1lbnQgdG8gd2hlcmUgaXQgd2lsbCBiZSB3aGVuIGl0J3MgaW5saW5lIGFuZCBpcyBpbmZsdWVuY2VkXG4gICAgICAvLyBieSB0aGUgYG1hcmdpbmAgb2YgaXRzIHNpYmxpbmdzLlxuICAgICAgaWYgKGRlbHRhID09PSAtMSkge1xuICAgICAgICBzaWJsaW5nT2Zmc2V0IC09IGltbWVkaWF0ZVNpYmxpbmcuY2xpZW50UmVjdFtzdGFydF0gLSBjdXJyZW50UG9zaXRpb25bZW5kXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNpYmxpbmdPZmZzZXQgKz0gY3VycmVudFBvc2l0aW9uW3N0YXJ0XSAtIGltbWVkaWF0ZVNpYmxpbmcuY2xpZW50UmVjdFtlbmRdO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzaWJsaW5nT2Zmc2V0O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG9mZnNldCBpbiBwaXhlbHMgYnkgd2hpY2ggdGhlIGl0ZW0gdGhhdCBpcyBiZWluZyBkcmFnZ2VkIHNob3VsZCBiZSBtb3ZlZC5cbiAgICogQHBhcmFtIGN1cnJlbnRQb3NpdGlvbiBDdXJyZW50IHBvc2l0aW9uIG9mIHRoZSBpdGVtLlxuICAgKiBAcGFyYW0gbmV3UG9zaXRpb24gUG9zaXRpb24gb2YgdGhlIGl0ZW0gd2hlcmUgdGhlIGN1cnJlbnQgaXRlbSBzaG91bGQgYmUgbW92ZWQuXG4gICAqIEBwYXJhbSBkZWx0YSBEaXJlY3Rpb24gaW4gd2hpY2ggdGhlIHVzZXIgaXMgbW92aW5nLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0SXRlbU9mZnNldFB4KGN1cnJlbnRQb3NpdGlvbjogQ2xpZW50UmVjdCwgbmV3UG9zaXRpb246IENsaWVudFJlY3QsIGRlbHRhOiAxIHwgLTEpIHtcbiAgICBjb25zdCBpc0hvcml6b250YWwgPSB0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnO1xuICAgIGxldCBpdGVtT2Zmc2V0ID0gaXNIb3Jpem9udGFsID8gbmV3UG9zaXRpb24ubGVmdCAtIGN1cnJlbnRQb3NpdGlvbi5sZWZ0IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1Bvc2l0aW9uLnRvcCAtIGN1cnJlbnRQb3NpdGlvbi50b3A7XG5cbiAgICAvLyBBY2NvdW50IGZvciBkaWZmZXJlbmNlcyBpbiB0aGUgaXRlbSB3aWR0aC9oZWlnaHQuXG4gICAgaWYgKGRlbHRhID09PSAtMSkge1xuICAgICAgaXRlbU9mZnNldCArPSBpc0hvcml6b250YWwgPyBuZXdQb3NpdGlvbi53aWR0aCAtIGN1cnJlbnRQb3NpdGlvbi53aWR0aCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1Bvc2l0aW9uLmhlaWdodCAtIGN1cnJlbnRQb3NpdGlvbi5oZWlnaHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIGl0ZW1PZmZzZXQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW5kZXggb2YgYW4gaXRlbSBpbiB0aGUgZHJvcCBjb250YWluZXIsIGJhc2VkIG9uIHRoZSBwb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdGhhdCBpcyBiZWluZyBzb3J0ZWQuXG4gICAqIEBwYXJhbSBwb2ludGVyWCBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHBvaW50ZXJZIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgWSBheGlzLlxuICAgKiBAcGFyYW0gZGVsdGEgRGlyZWN0aW9uIGluIHdoaWNoIHRoZSB1c2VyIGlzIG1vdmluZyB0aGVpciBwb2ludGVyLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0SXRlbUluZGV4RnJvbVBvaW50ZXJQb3NpdGlvbihpdGVtOiBEcmFnUmVmLCBwb2ludGVyWDogbnVtYmVyLCBwb2ludGVyWTogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhPzoge3g6IG51bWJlciwgeTogbnVtYmVyfSkge1xuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IHRoaXMuX29yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCc7XG5cbiAgICByZXR1cm4gZmluZEluZGV4KHRoaXMuX2l0ZW1Qb3NpdGlvbnMsICh7ZHJhZywgY2xpZW50UmVjdH0sIF8sIGFycmF5KSA9PiB7XG4gICAgICBpZiAoZHJhZyA9PT0gaXRlbSkge1xuICAgICAgICAvLyBJZiB0aGVyZSdzIG9ubHkgb25lIGl0ZW0gbGVmdCBpbiB0aGUgY29udGFpbmVyLCBpdCBtdXN0IGJlXG4gICAgICAgIC8vIHRoZSBkcmFnZ2VkIGl0ZW0gaXRzZWxmIHNvIHdlIHVzZSBpdCBhcyBhIHJlZmVyZW5jZS5cbiAgICAgICAgcmV0dXJuIGFycmF5Lmxlbmd0aCA8IDI7XG4gICAgICB9XG5cbiAgICAgIGlmIChkZWx0YSkge1xuICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSBpc0hvcml6b250YWwgPyBkZWx0YS54IDogZGVsdGEueTtcblxuICAgICAgICAvLyBJZiB0aGUgdXNlciBpcyBzdGlsbCBob3ZlcmluZyBvdmVyIHRoZSBzYW1lIGl0ZW0gYXMgbGFzdCB0aW1lLCBhbmQgdGhleSBkaWRuJ3QgY2hhbmdlXG4gICAgICAgIC8vIHRoZSBkaXJlY3Rpb24gaW4gd2hpY2ggdGhleSdyZSBkcmFnZ2luZywgd2UgZG9uJ3QgY29uc2lkZXIgaXQgYSBkaXJlY3Rpb24gc3dhcC5cbiAgICAgICAgaWYgKGRyYWcgPT09IHRoaXMuX3ByZXZpb3VzU3dhcC5kcmFnICYmIGRpcmVjdGlvbiA9PT0gdGhpcy5fcHJldmlvdXNTd2FwLmRlbHRhKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBpc0hvcml6b250YWwgP1xuICAgICAgICAgIC8vIFJvdW5kIHRoZXNlIGRvd24gc2luY2UgbW9zdCBicm93c2VycyByZXBvcnQgY2xpZW50IHJlY3RzIHdpdGhcbiAgICAgICAgICAvLyBzdWItcGl4ZWwgcHJlY2lzaW9uLCB3aGVyZWFzIHRoZSBwb2ludGVyIGNvb3JkaW5hdGVzIGFyZSByb3VuZGVkIHRvIHBpeGVscy5cbiAgICAgICAgICBwb2ludGVyWCA+PSBNYXRoLmZsb29yKGNsaWVudFJlY3QubGVmdCkgJiYgcG9pbnRlclggPD0gTWF0aC5mbG9vcihjbGllbnRSZWN0LnJpZ2h0KSA6XG4gICAgICAgICAgcG9pbnRlclkgPj0gTWF0aC5mbG9vcihjbGllbnRSZWN0LnRvcCkgJiYgcG9pbnRlclkgPD0gTWF0aC5mbG9vcihjbGllbnRSZWN0LmJvdHRvbSk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogQ2FjaGVzIHRoZSBjdXJyZW50IGl0ZW1zIGluIHRoZSBsaXN0IGFuZCB0aGVpciBwb3NpdGlvbnMuICovXG4gIHByaXZhdGUgX2NhY2hlSXRlbXMoKTogdm9pZCB7XG4gICAgdGhpcy5fYWN0aXZlRHJhZ2dhYmxlcyA9IHRoaXMuX2RyYWdnYWJsZXMuc2xpY2UoKTtcbiAgICB0aGlzLl9jYWNoZUl0ZW1Qb3NpdGlvbnMoKTtcbiAgICB0aGlzLl9jYWNoZVBhcmVudFBvc2l0aW9ucygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGludGVybmFsIHN0YXRlIG9mIHRoZSBjb250YWluZXIgYWZ0ZXIgYSBzY3JvbGwgZXZlbnQgaGFzIGhhcHBlbmVkLlxuICAgKiBAcGFyYW0gc2Nyb2xsZWRQYXJlbnQgRWxlbWVudCB0aGF0IHdhcyBzY3JvbGxlZC5cbiAgICogQHBhcmFtIG5ld1RvcCBOZXcgdG9wIHNjcm9sbCBwb3NpdGlvbi5cbiAgICogQHBhcmFtIG5ld0xlZnQgTmV3IGxlZnQgc2Nyb2xsIHBvc2l0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBfdXBkYXRlQWZ0ZXJTY3JvbGwoc2Nyb2xsZWRQYXJlbnQ6IEhUTUxFbGVtZW50IHwgRG9jdW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1RvcDogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdMZWZ0OiBudW1iZXIpIHtcbiAgICBjb25zdCBzY3JvbGxQb3NpdGlvbiA9IHRoaXMuX3BhcmVudFBvc2l0aW9ucy5nZXQoc2Nyb2xsZWRQYXJlbnQpIS5zY3JvbGxQb3NpdGlvbjtcbiAgICBjb25zdCB0b3BEaWZmZXJlbmNlID0gc2Nyb2xsUG9zaXRpb24udG9wIC0gbmV3VG9wO1xuICAgIGNvbnN0IGxlZnREaWZmZXJlbmNlID0gc2Nyb2xsUG9zaXRpb24ubGVmdCAtIG5ld0xlZnQ7XG5cbiAgICAvLyBHbyB0aHJvdWdoIGFuZCB1cGRhdGUgdGhlIGNhY2hlZCBwb3NpdGlvbnMgb2YgdGhlIHNjcm9sbFxuICAgIC8vIHBhcmVudHMgdGhhdCBhcmUgaW5zaWRlIHRoZSBlbGVtZW50IHRoYXQgd2FzIHNjcm9sbGVkLlxuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5mb3JFYWNoKChwb3NpdGlvbiwgbm9kZSkgPT4ge1xuICAgICAgaWYgKHBvc2l0aW9uLmNsaWVudFJlY3QgJiYgc2Nyb2xsZWRQYXJlbnQgIT09IG5vZGUgJiYgc2Nyb2xsZWRQYXJlbnQuY29udGFpbnMobm9kZSkpIHtcbiAgICAgICAgYWRqdXN0Q2xpZW50UmVjdChwb3NpdGlvbi5jbGllbnRSZWN0LCB0b3BEaWZmZXJlbmNlLCBsZWZ0RGlmZmVyZW5jZSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBTaW5jZSB3ZSBrbm93IHRoZSBhbW91bnQgdGhhdCB0aGUgdXNlciBoYXMgc2Nyb2xsZWQgd2UgY2FuIHNoaWZ0IGFsbCBvZiB0aGUgY2xpZW50IHJlY3RhbmdsZXNcbiAgICAvLyBvdXJzZWx2ZXMuIFRoaXMgaXMgY2hlYXBlciB0aGFuIHJlLW1lYXN1cmluZyBldmVyeXRoaW5nIGFuZCB3ZSBjYW4gYXZvaWQgaW5jb25zaXN0ZW50XG4gICAgLy8gYmVoYXZpb3Igd2hlcmUgd2UgbWlnaHQgYmUgbWVhc3VyaW5nIHRoZSBlbGVtZW50IGJlZm9yZSBpdHMgcG9zaXRpb24gaGFzIGNoYW5nZWQuXG4gICAgdGhpcy5faXRlbVBvc2l0aW9ucy5mb3JFYWNoKCh7Y2xpZW50UmVjdH0pID0+IHtcbiAgICAgIGFkanVzdENsaWVudFJlY3QoY2xpZW50UmVjdCwgdG9wRGlmZmVyZW5jZSwgbGVmdERpZmZlcmVuY2UpO1xuICAgIH0pO1xuXG4gICAgLy8gV2UgbmVlZCB0d28gbG9vcHMgZm9yIHRoaXMsIGJlY2F1c2Ugd2Ugd2FudCBhbGwgb2YgdGhlIGNhY2hlZFxuICAgIC8vIHBvc2l0aW9ucyB0byBiZSB1cC10by1kYXRlIGJlZm9yZSB3ZSByZS1zb3J0IHRoZSBpdGVtLlxuICAgIHRoaXMuX2l0ZW1Qb3NpdGlvbnMuZm9yRWFjaCgoe2RyYWd9KSA9PiB7XG4gICAgICBpZiAodGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5pc0RyYWdnaW5nKGRyYWcpKSB7XG4gICAgICAgIC8vIFdlIG5lZWQgdG8gcmUtc29ydCB0aGUgaXRlbSBtYW51YWxseSwgYmVjYXVzZSB0aGUgcG9pbnRlciBtb3ZlXG4gICAgICAgIC8vIGV2ZW50cyB3b24ndCBiZSBkaXNwYXRjaGVkIHdoaWxlIHRoZSB1c2VyIGlzIHNjcm9sbGluZy5cbiAgICAgICAgZHJhZy5fc29ydEZyb21MYXN0UG9pbnRlclBvc2l0aW9uKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBzY3JvbGxQb3NpdGlvbi50b3AgPSBuZXdUb3A7XG4gICAgc2Nyb2xsUG9zaXRpb24ubGVmdCA9IG5ld0xlZnQ7XG4gIH1cblxuICAvKiogU3RhcnRzIHRoZSBpbnRlcnZhbCB0aGF0J2xsIGF1dG8tc2Nyb2xsIHRoZSBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9zdGFydFNjcm9sbEludGVydmFsID0gKCkgPT4ge1xuICAgIHRoaXMuX3N0b3BTY3JvbGxpbmcoKTtcblxuICAgIGludGVydmFsKDAsIGFuaW1hdGlvbkZyYW1lU2NoZWR1bGVyKVxuICAgICAgLnBpcGUodGFrZVVudGlsKHRoaXMuX3N0b3BTY3JvbGxUaW1lcnMpKVxuICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLl9zY3JvbGxOb2RlO1xuXG4gICAgICAgIGlmICh0aGlzLl92ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9PT0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLlVQKSB7XG4gICAgICAgICAgaW5jcmVtZW50VmVydGljYWxTY3JvbGwobm9kZSwgLUFVVE9fU0NST0xMX1NURVApO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID09PSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uRE9XTikge1xuICAgICAgICAgIGluY3JlbWVudFZlcnRpY2FsU2Nyb2xsKG5vZGUsIEFVVE9fU0NST0xMX1NURVApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX2hvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPT09IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLkxFRlQpIHtcbiAgICAgICAgICBpbmNyZW1lbnRIb3Jpem9udGFsU2Nyb2xsKG5vZGUsIC1BVVRPX1NDUk9MTF9TVEVQKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID09PSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5SSUdIVCkge1xuICAgICAgICAgIGluY3JlbWVudEhvcml6b250YWxTY3JvbGwobm9kZSwgQVVUT19TQ1JPTExfU1RFUCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSB1c2VyJ3MgcG9pbnRlciBpcyBwb3NpdGlvbmVkIG92ZXIgdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHggUG9pbnRlciBwb3NpdGlvbiBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0geSBQb2ludGVyIHBvc2l0aW9uIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqL1xuICBfaXNPdmVyQ29udGFpbmVyKHg6IG51bWJlciwgeTogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGlzSW5zaWRlQ2xpZW50UmVjdCh0aGlzLl9jbGllbnRSZWN0LCB4LCB5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaWd1cmVzIG91dCB3aGV0aGVyIGFuIGl0ZW0gc2hvdWxkIGJlIG1vdmVkIGludG8gYSBzaWJsaW5nXG4gICAqIGRyb3AgY29udGFpbmVyLCBiYXNlZCBvbiBpdHMgY3VycmVudCBwb3NpdGlvbi5cbiAgICogQHBhcmFtIGl0ZW0gRHJhZyBpdGVtIHRoYXQgaXMgYmVpbmcgbW92ZWQuXG4gICAqIEBwYXJhbSB4IFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSB5IFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqL1xuICBfZ2V0U2libGluZ0NvbnRhaW5lckZyb21Qb3NpdGlvbihpdGVtOiBEcmFnUmVmLCB4OiBudW1iZXIsIHk6IG51bWJlcik6IERyb3BMaXN0UmVmIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fc2libGluZ3MuZmluZChzaWJsaW5nID0+IHNpYmxpbmcuX2NhblJlY2VpdmUoaXRlbSwgeCwgeSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSBkcm9wIGxpc3QgY2FuIHJlY2VpdmUgdGhlIHBhc3NlZC1pbiBpdGVtLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRoYXQgaXMgYmVpbmcgZHJhZ2dlZCBpbnRvIHRoZSBsaXN0LlxuICAgKiBAcGFyYW0geCBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0geSBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKi9cbiAgX2NhblJlY2VpdmUoaXRlbTogRHJhZ1JlZiwgeDogbnVtYmVyLCB5OiBudW1iZXIpOiBib29sZWFuIHtcbiAgICBpZiAoIWlzSW5zaWRlQ2xpZW50UmVjdCh0aGlzLl9jbGllbnRSZWN0LCB4LCB5KSB8fCAhdGhpcy5lbnRlclByZWRpY2F0ZShpdGVtLCB0aGlzKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IGVsZW1lbnRGcm9tUG9pbnQgPSB0aGlzLl9nZXRTaGFkb3dSb290KCkuZWxlbWVudEZyb21Qb2ludCh4LCB5KSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG5cbiAgICAvLyBJZiB0aGVyZSdzIG5vIGVsZW1lbnQgYXQgdGhlIHBvaW50ZXIgcG9zaXRpb24sIHRoZW5cbiAgICAvLyB0aGUgY2xpZW50IHJlY3QgaXMgcHJvYmFibHkgc2Nyb2xsZWQgb3V0IG9mIHRoZSB2aWV3LlxuICAgIGlmICghZWxlbWVudEZyb21Qb2ludCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KHRoaXMuZWxlbWVudCk7XG5cbiAgICAvLyBUaGUgYENsaWVudFJlY3RgLCB0aGF0IHdlJ3JlIHVzaW5nIHRvIGZpbmQgdGhlIGNvbnRhaW5lciBvdmVyIHdoaWNoIHRoZSB1c2VyIGlzXG4gICAgLy8gaG92ZXJpbmcsIGRvZXNuJ3QgZ2l2ZSB1cyBhbnkgaW5mb3JtYXRpb24gb24gd2hldGhlciB0aGUgZWxlbWVudCBoYXMgYmVlbiBzY3JvbGxlZFxuICAgIC8vIG91dCBvZiB0aGUgdmlldyBvciB3aGV0aGVyIGl0J3Mgb3ZlcmxhcHBpbmcgd2l0aCBvdGhlciBjb250YWluZXJzLiBUaGlzIG1lYW5zIHRoYXRcbiAgICAvLyB3ZSBjb3VsZCBlbmQgdXAgdHJhbnNmZXJyaW5nIHRoZSBpdGVtIGludG8gYSBjb250YWluZXIgdGhhdCdzIGludmlzaWJsZSBvciBpcyBwb3NpdGlvbmVkXG4gICAgLy8gYmVsb3cgYW5vdGhlciBvbmUuIFdlIHVzZSB0aGUgcmVzdWx0IGZyb20gYGVsZW1lbnRGcm9tUG9pbnRgIHRvIGdldCB0aGUgdG9wLW1vc3QgZWxlbWVudFxuICAgIC8vIGF0IHRoZSBwb2ludGVyIHBvc2l0aW9uIGFuZCB0byBmaW5kIHdoZXRoZXIgaXQncyBvbmUgb2YgdGhlIGludGVyc2VjdGluZyBkcm9wIGNvbnRhaW5lcnMuXG4gICAgcmV0dXJuIGVsZW1lbnRGcm9tUG9pbnQgPT09IG5hdGl2ZUVsZW1lbnQgfHwgbmF0aXZlRWxlbWVudC5jb250YWlucyhlbGVtZW50RnJvbVBvaW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsZWQgYnkgb25lIG9mIHRoZSBjb25uZWN0ZWQgZHJvcCBsaXN0cyB3aGVuIGEgZHJhZ2dpbmcgc2VxdWVuY2UgaGFzIHN0YXJ0ZWQuXG4gICAqIEBwYXJhbSBzaWJsaW5nIFNpYmxpbmcgaW4gd2hpY2ggZHJhZ2dpbmcgaGFzIHN0YXJ0ZWQuXG4gICAqL1xuICBfc3RhcnRSZWNlaXZpbmcoc2libGluZzogRHJvcExpc3RSZWYpIHtcbiAgICBjb25zdCBhY3RpdmVTaWJsaW5ncyA9IHRoaXMuX2FjdGl2ZVNpYmxpbmdzO1xuXG4gICAgaWYgKCFhY3RpdmVTaWJsaW5ncy5oYXMoc2libGluZykpIHtcbiAgICAgIGFjdGl2ZVNpYmxpbmdzLmFkZChzaWJsaW5nKTtcbiAgICAgIHRoaXMuX2NhY2hlUGFyZW50UG9zaXRpb25zKCk7XG4gICAgICB0aGlzLl9saXN0ZW5Ub1Njcm9sbEV2ZW50cygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsZWQgYnkgYSBjb25uZWN0ZWQgZHJvcCBsaXN0IHdoZW4gZHJhZ2dpbmcgaGFzIHN0b3BwZWQuXG4gICAqIEBwYXJhbSBzaWJsaW5nIFNpYmxpbmcgd2hvc2UgZHJhZ2dpbmcgaGFzIHN0b3BwZWQuXG4gICAqL1xuICBfc3RvcFJlY2VpdmluZyhzaWJsaW5nOiBEcm9wTGlzdFJlZikge1xuICAgIHRoaXMuX2FjdGl2ZVNpYmxpbmdzLmRlbGV0ZShzaWJsaW5nKTtcbiAgICB0aGlzLl92aWV3cG9ydFNjcm9sbFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0YXJ0cyBsaXN0ZW5pbmcgdG8gc2Nyb2xsIGV2ZW50cyBvbiB0aGUgdmlld3BvcnQuXG4gICAqIFVzZWQgZm9yIHVwZGF0aW5nIHRoZSBpbnRlcm5hbCBzdGF0ZSBvZiB0aGUgbGlzdC5cbiAgICovXG4gIHByaXZhdGUgX2xpc3RlblRvU2Nyb2xsRXZlbnRzKCkge1xuICAgIHRoaXMuX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uID0gdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5zY3JvbGwuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgIGlmICh0aGlzLmlzRHJhZ2dpbmcoKSkge1xuICAgICAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQgfCBEb2N1bWVudDtcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuZ2V0KHRhcmdldCk7XG5cbiAgICAgICAgaWYgKHBvc2l0aW9uKSB7XG4gICAgICAgICAgbGV0IG5ld1RvcDogbnVtYmVyO1xuICAgICAgICAgIGxldCBuZXdMZWZ0OiBudW1iZXI7XG5cbiAgICAgICAgICBpZiAodGFyZ2V0ID09PSB0aGlzLl9kb2N1bWVudCkge1xuICAgICAgICAgICAgY29uc3Qgc2Nyb2xsUG9zaXRpb24gPSB0aGlzLl92aWV3cG9ydFJ1bGVyIS5nZXRWaWV3cG9ydFNjcm9sbFBvc2l0aW9uKCk7XG4gICAgICAgICAgICBuZXdUb3AgPSBzY3JvbGxQb3NpdGlvbi50b3A7XG4gICAgICAgICAgICBuZXdMZWZ0ID0gc2Nyb2xsUG9zaXRpb24ubGVmdDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmV3VG9wID0gKHRhcmdldCBhcyBIVE1MRWxlbWVudCkuc2Nyb2xsVG9wO1xuICAgICAgICAgICAgbmV3TGVmdCA9ICh0YXJnZXQgYXMgSFRNTEVsZW1lbnQpLnNjcm9sbExlZnQ7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5fdXBkYXRlQWZ0ZXJTY3JvbGwodGFyZ2V0LCBuZXdUb3AsIG5ld0xlZnQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuaXNSZWNlaXZpbmcoKSkge1xuICAgICAgICB0aGlzLl9jYWNoZVBhcmVudFBvc2l0aW9ucygpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIExhemlseSByZXNvbHZlcyBhbmQgcmV0dXJucyB0aGUgc2hhZG93IHJvb3Qgb2YgdGhlIGVsZW1lbnQuIFdlIGRvIHRoaXMgaW4gYSBmdW5jdGlvbiwgcmF0aGVyXG4gICAqIHRoYW4gc2F2aW5nIGl0IGluIHByb3BlcnR5IGRpcmVjdGx5IG9uIGluaXQsIGJlY2F1c2Ugd2Ugd2FudCB0byByZXNvbHZlIGl0IGFzIGxhdGUgYXMgcG9zc2libGVcbiAgICogaW4gb3JkZXIgdG8gZW5zdXJlIHRoYXQgdGhlIGVsZW1lbnQgaGFzIGJlZW4gbW92ZWQgaW50byB0aGUgc2hhZG93IERPTS4gRG9pbmcgaXQgaW5zaWRlIHRoZVxuICAgKiBjb25zdHJ1Y3RvciBtaWdodCBiZSB0b28gZWFybHkgaWYgdGhlIGVsZW1lbnQgaXMgaW5zaWRlIG9mIHNvbWV0aGluZyBsaWtlIGBuZ0ZvcmAgb3IgYG5nSWZgLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0U2hhZG93Um9vdCgpOiBEb2N1bWVudE9yU2hhZG93Um9vdCB7XG4gICAgaWYgKCF0aGlzLl9jYWNoZWRTaGFkb3dSb290KSB7XG4gICAgICB0aGlzLl9jYWNoZWRTaGFkb3dSb290ID0gZ2V0U2hhZG93Um9vdChjb2VyY2VFbGVtZW50KHRoaXMuZWxlbWVudCkpIHx8IHRoaXMuX2RvY3VtZW50O1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9jYWNoZWRTaGFkb3dSb290O1xuICB9XG59XG5cblxuLyoqXG4gKiBVcGRhdGVzIHRoZSB0b3AvbGVmdCBwb3NpdGlvbnMgb2YgYSBgQ2xpZW50UmVjdGAsIGFzIHdlbGwgYXMgdGhlaXIgYm90dG9tL3JpZ2h0IGNvdW50ZXJwYXJ0cy5cbiAqIEBwYXJhbSBjbGllbnRSZWN0IGBDbGllbnRSZWN0YCB0aGF0IHNob3VsZCBiZSB1cGRhdGVkLlxuICogQHBhcmFtIHRvcCBBbW91bnQgdG8gYWRkIHRvIHRoZSBgdG9wYCBwb3NpdGlvbi5cbiAqIEBwYXJhbSBsZWZ0IEFtb3VudCB0byBhZGQgdG8gdGhlIGBsZWZ0YCBwb3NpdGlvbi5cbiAqL1xuZnVuY3Rpb24gYWRqdXN0Q2xpZW50UmVjdChjbGllbnRSZWN0OiBDbGllbnRSZWN0LCB0b3A6IG51bWJlciwgbGVmdDogbnVtYmVyKSB7XG4gIGNsaWVudFJlY3QudG9wICs9IHRvcDtcbiAgY2xpZW50UmVjdC5ib3R0b20gPSBjbGllbnRSZWN0LnRvcCArIGNsaWVudFJlY3QuaGVpZ2h0O1xuXG4gIGNsaWVudFJlY3QubGVmdCArPSBsZWZ0O1xuICBjbGllbnRSZWN0LnJpZ2h0ID0gY2xpZW50UmVjdC5sZWZ0ICsgY2xpZW50UmVjdC53aWR0aDtcbn1cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciB0aGUgcG9pbnRlciBjb29yZGluYXRlcyBhcmUgY2xvc2UgdG8gYSBDbGllbnRSZWN0LlxuICogQHBhcmFtIHJlY3QgQ2xpZW50UmVjdCB0byBjaGVjayBhZ2FpbnN0LlxuICogQHBhcmFtIHBvaW50ZXJYIENvb3JkaW5hdGVzIGFsb25nIHRoZSBYIGF4aXMuXG4gKiBAcGFyYW0gcG9pbnRlclkgQ29vcmRpbmF0ZXMgYWxvbmcgdGhlIFkgYXhpcy5cbiAqL1xuZnVuY3Rpb24gaXNQb2ludGVyTmVhckNsaWVudFJlY3QocmVjdDogQ2xpZW50UmVjdCwgcG9pbnRlclg6IG51bWJlciwgcG9pbnRlclk6IG51bWJlcik6IGJvb2xlYW4ge1xuICBjb25zdCB7dG9wLCByaWdodCwgYm90dG9tLCBsZWZ0LCB3aWR0aCwgaGVpZ2h0fSA9IHJlY3Q7XG4gIGNvbnN0IHhUaHJlc2hvbGQgPSB3aWR0aCAqIERST1BfUFJPWElNSVRZX1RIUkVTSE9MRDtcbiAgY29uc3QgeVRocmVzaG9sZCA9IGhlaWdodCAqIERST1BfUFJPWElNSVRZX1RIUkVTSE9MRDtcblxuICByZXR1cm4gcG9pbnRlclkgPiB0b3AgLSB5VGhyZXNob2xkICYmIHBvaW50ZXJZIDwgYm90dG9tICsgeVRocmVzaG9sZCAmJlxuICAgICAgICAgcG9pbnRlclggPiBsZWZ0IC0geFRocmVzaG9sZCAmJiBwb2ludGVyWCA8IHJpZ2h0ICsgeFRocmVzaG9sZDtcbn1cblxuLyoqXG4gKiBGaW5kcyB0aGUgaW5kZXggb2YgYW4gaXRlbSB0aGF0IG1hdGNoZXMgYSBwcmVkaWNhdGUgZnVuY3Rpb24uIFVzZWQgYXMgYW4gZXF1aXZhbGVudFxuICogb2YgYEFycmF5LnByb3RvdHlwZS5maW5kSW5kZXhgIHdoaWNoIGlzbid0IHBhcnQgb2YgdGhlIHN0YW5kYXJkIEdvb2dsZSB0eXBpbmdzLlxuICogQHBhcmFtIGFycmF5IEFycmF5IGluIHdoaWNoIHRvIGxvb2sgZm9yIG1hdGNoZXMuXG4gKiBAcGFyYW0gcHJlZGljYXRlIEZ1bmN0aW9uIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYW4gaXRlbSBpcyBhIG1hdGNoLlxuICovXG5mdW5jdGlvbiBmaW5kSW5kZXg8VD4oYXJyYXk6IFRbXSxcbiAgICAgICAgICAgICAgICAgICAgICBwcmVkaWNhdGU6ICh2YWx1ZTogVCwgaW5kZXg6IG51bWJlciwgb2JqOiBUW10pID0+IGJvb2xlYW4pOiBudW1iZXIge1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAocHJlZGljYXRlKGFycmF5W2ldLCBpLCBhcnJheSkpIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiAtMTtcbn1cblxuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIHNvbWUgY29vcmRpbmF0ZXMgYXJlIHdpdGhpbiBhIGBDbGllbnRSZWN0YC5cbiAqIEBwYXJhbSBjbGllbnRSZWN0IENsaWVudFJlY3QgdGhhdCBpcyBiZWluZyBjaGVja2VkLlxuICogQHBhcmFtIHggQ29vcmRpbmF0ZXMgYWxvbmcgdGhlIFggYXhpcy5cbiAqIEBwYXJhbSB5IENvb3JkaW5hdGVzIGFsb25nIHRoZSBZIGF4aXMuXG4gKi9cbmZ1bmN0aW9uIGlzSW5zaWRlQ2xpZW50UmVjdChjbGllbnRSZWN0OiBDbGllbnRSZWN0LCB4OiBudW1iZXIsIHk6IG51bWJlcikge1xuICBjb25zdCB7dG9wLCBib3R0b20sIGxlZnQsIHJpZ2h0fSA9IGNsaWVudFJlY3Q7XG4gIHJldHVybiB5ID49IHRvcCAmJiB5IDw9IGJvdHRvbSAmJiB4ID49IGxlZnQgJiYgeCA8PSByaWdodDtcbn1cblxuXG4vKiogR2V0cyBhIG11dGFibGUgdmVyc2lvbiBvZiBhbiBlbGVtZW50J3MgYm91bmRpbmcgYENsaWVudFJlY3RgLiAqL1xuZnVuY3Rpb24gZ2V0TXV0YWJsZUNsaWVudFJlY3QoZWxlbWVudDogRWxlbWVudCk6IENsaWVudFJlY3Qge1xuICBjb25zdCBjbGllbnRSZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAvLyBXZSBuZWVkIHRvIGNsb25lIHRoZSBgY2xpZW50UmVjdGAgaGVyZSwgYmVjYXVzZSBhbGwgdGhlIHZhbHVlcyBvbiBpdCBhcmUgcmVhZG9ubHlcbiAgLy8gYW5kIHdlIG5lZWQgdG8gYmUgYWJsZSB0byB1cGRhdGUgdGhlbS4gQWxzbyB3ZSBjYW4ndCB1c2UgYSBzcHJlYWQgaGVyZSwgYmVjYXVzZVxuICAvLyB0aGUgdmFsdWVzIG9uIGEgYENsaWVudFJlY3RgIGFyZW4ndCBvd24gcHJvcGVydGllcy4gU2VlOlxuICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRWxlbWVudC9nZXRCb3VuZGluZ0NsaWVudFJlY3QjTm90ZXNcbiAgcmV0dXJuIHtcbiAgICB0b3A6IGNsaWVudFJlY3QudG9wLFxuICAgIHJpZ2h0OiBjbGllbnRSZWN0LnJpZ2h0LFxuICAgIGJvdHRvbTogY2xpZW50UmVjdC5ib3R0b20sXG4gICAgbGVmdDogY2xpZW50UmVjdC5sZWZ0LFxuICAgIHdpZHRoOiBjbGllbnRSZWN0LndpZHRoLFxuICAgIGhlaWdodDogY2xpZW50UmVjdC5oZWlnaHRcbiAgfTtcbn1cblxuLyoqXG4gKiBJbmNyZW1lbnRzIHRoZSB2ZXJ0aWNhbCBzY3JvbGwgcG9zaXRpb24gb2YgYSBub2RlLlxuICogQHBhcmFtIG5vZGUgTm9kZSB3aG9zZSBzY3JvbGwgcG9zaXRpb24gc2hvdWxkIGNoYW5nZS5cbiAqIEBwYXJhbSBhbW91bnQgQW1vdW50IG9mIHBpeGVscyB0aGF0IHRoZSBgbm9kZWAgc2hvdWxkIGJlIHNjcm9sbGVkLlxuICovXG5mdW5jdGlvbiBpbmNyZW1lbnRWZXJ0aWNhbFNjcm9sbChub2RlOiBIVE1MRWxlbWVudCB8IFdpbmRvdywgYW1vdW50OiBudW1iZXIpIHtcbiAgaWYgKG5vZGUgPT09IHdpbmRvdykge1xuICAgIChub2RlIGFzIFdpbmRvdykuc2Nyb2xsQnkoMCwgYW1vdW50KTtcbiAgfSBlbHNlIHtcbiAgICAvLyBJZGVhbGx5IHdlIGNvdWxkIHVzZSBgRWxlbWVudC5zY3JvbGxCeWAgaGVyZSBhcyB3ZWxsLCBidXQgSUUgYW5kIEVkZ2UgZG9uJ3Qgc3VwcG9ydCBpdC5cbiAgICAobm9kZSBhcyBIVE1MRWxlbWVudCkuc2Nyb2xsVG9wICs9IGFtb3VudDtcbiAgfVxufVxuXG4vKipcbiAqIEluY3JlbWVudHMgdGhlIGhvcml6b250YWwgc2Nyb2xsIHBvc2l0aW9uIG9mIGEgbm9kZS5cbiAqIEBwYXJhbSBub2RlIE5vZGUgd2hvc2Ugc2Nyb2xsIHBvc2l0aW9uIHNob3VsZCBjaGFuZ2UuXG4gKiBAcGFyYW0gYW1vdW50IEFtb3VudCBvZiBwaXhlbHMgdGhhdCB0aGUgYG5vZGVgIHNob3VsZCBiZSBzY3JvbGxlZC5cbiAqL1xuZnVuY3Rpb24gaW5jcmVtZW50SG9yaXpvbnRhbFNjcm9sbChub2RlOiBIVE1MRWxlbWVudCB8IFdpbmRvdywgYW1vdW50OiBudW1iZXIpIHtcbiAgaWYgKG5vZGUgPT09IHdpbmRvdykge1xuICAgIChub2RlIGFzIFdpbmRvdykuc2Nyb2xsQnkoYW1vdW50LCAwKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBJZGVhbGx5IHdlIGNvdWxkIHVzZSBgRWxlbWVudC5zY3JvbGxCeWAgaGVyZSBhcyB3ZWxsLCBidXQgSUUgYW5kIEVkZ2UgZG9uJ3Qgc3VwcG9ydCBpdC5cbiAgICAobm9kZSBhcyBIVE1MRWxlbWVudCkuc2Nyb2xsTGVmdCArPSBhbW91bnQ7XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIHdoZXRoZXIgdGhlIHZlcnRpY2FsIGF1dG8tc2Nyb2xsIGRpcmVjdGlvbiBvZiBhIG5vZGUuXG4gKiBAcGFyYW0gY2xpZW50UmVjdCBEaW1lbnNpb25zIG9mIHRoZSBub2RlLlxuICogQHBhcmFtIHBvaW50ZXJZIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgeSBheGlzLlxuICovXG5mdW5jdGlvbiBnZXRWZXJ0aWNhbFNjcm9sbERpcmVjdGlvbihjbGllbnRSZWN0OiBDbGllbnRSZWN0LCBwb2ludGVyWTogbnVtYmVyKSB7XG4gIGNvbnN0IHt0b3AsIGJvdHRvbSwgaGVpZ2h0fSA9IGNsaWVudFJlY3Q7XG4gIGNvbnN0IHlUaHJlc2hvbGQgPSBoZWlnaHQgKiBTQ1JPTExfUFJPWElNSVRZX1RIUkVTSE9MRDtcblxuICBpZiAocG9pbnRlclkgPj0gdG9wIC0geVRocmVzaG9sZCAmJiBwb2ludGVyWSA8PSB0b3AgKyB5VGhyZXNob2xkKSB7XG4gICAgcmV0dXJuIEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5VUDtcbiAgfSBlbHNlIGlmIChwb2ludGVyWSA+PSBib3R0b20gLSB5VGhyZXNob2xkICYmIHBvaW50ZXJZIDw9IGJvdHRvbSArIHlUaHJlc2hvbGQpIHtcbiAgICByZXR1cm4gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLkRPV047XG4gIH1cblxuICByZXR1cm4gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLk5PTkU7XG59XG5cbi8qKlxuICogR2V0cyB3aGV0aGVyIHRoZSBob3Jpem9udGFsIGF1dG8tc2Nyb2xsIGRpcmVjdGlvbiBvZiBhIG5vZGUuXG4gKiBAcGFyYW0gY2xpZW50UmVjdCBEaW1lbnNpb25zIG9mIHRoZSBub2RlLlxuICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBhbG9uZyB0aGUgeCBheGlzLlxuICovXG5mdW5jdGlvbiBnZXRIb3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKGNsaWVudFJlY3Q6IENsaWVudFJlY3QsIHBvaW50ZXJYOiBudW1iZXIpIHtcbiAgY29uc3Qge2xlZnQsIHJpZ2h0LCB3aWR0aH0gPSBjbGllbnRSZWN0O1xuICBjb25zdCB4VGhyZXNob2xkID0gd2lkdGggKiBTQ1JPTExfUFJPWElNSVRZX1RIUkVTSE9MRDtcblxuICBpZiAocG9pbnRlclggPj0gbGVmdCAtIHhUaHJlc2hvbGQgJiYgcG9pbnRlclggPD0gbGVmdCArIHhUaHJlc2hvbGQpIHtcbiAgICByZXR1cm4gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTEVGVDtcbiAgfSBlbHNlIGlmIChwb2ludGVyWCA+PSByaWdodCAtIHhUaHJlc2hvbGQgJiYgcG9pbnRlclggPD0gcmlnaHQgKyB4VGhyZXNob2xkKSB7XG4gICAgcmV0dXJuIEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLlJJR0hUO1xuICB9XG5cbiAgcmV0dXJuIEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLk5PTkU7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgZGlyZWN0aW9ucyBpbiB3aGljaCBhbiBlbGVtZW50IG5vZGUgc2hvdWxkIGJlIHNjcm9sbGVkLFxuICogYXNzdW1pbmcgdGhhdCB0aGUgdXNlcidzIHBvaW50ZXIgaXMgYWxyZWFkeSB3aXRoaW4gaXQgc2Nyb2xsYWJsZSByZWdpb24uXG4gKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IGZvciB3aGljaCB3ZSBzaG91bGQgY2FsY3VsYXRlIHRoZSBzY3JvbGwgZGlyZWN0aW9uLlxuICogQHBhcmFtIGNsaWVudFJlY3QgQm91bmRpbmcgY2xpZW50IHJlY3RhbmdsZSBvZiB0aGUgZWxlbWVudC5cbiAqIEBwYXJhbSBwb2ludGVyWCBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIHggYXhpcy5cbiAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgYWxvbmcgdGhlIHkgYXhpcy5cbiAqL1xuZnVuY3Rpb24gZ2V0RWxlbWVudFNjcm9sbERpcmVjdGlvbnMoZWxlbWVudDogSFRNTEVsZW1lbnQsIGNsaWVudFJlY3Q6IENsaWVudFJlY3QsIHBvaW50ZXJYOiBudW1iZXIsXG4gIHBvaW50ZXJZOiBudW1iZXIpOiBbQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLCBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbl0ge1xuICBjb25zdCBjb21wdXRlZFZlcnRpY2FsID0gZ2V0VmVydGljYWxTY3JvbGxEaXJlY3Rpb24oY2xpZW50UmVjdCwgcG9pbnRlclkpO1xuICBjb25zdCBjb21wdXRlZEhvcml6b250YWwgPSBnZXRIb3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKGNsaWVudFJlY3QsIHBvaW50ZXJYKTtcbiAgbGV0IHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLk5PTkU7XG4gIGxldCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTk9ORTtcblxuICAvLyBOb3RlIHRoYXQgd2UgaGVyZSB3ZSBkbyBzb21lIGV4dHJhIGNoZWNrcyBmb3Igd2hldGhlciB0aGUgZWxlbWVudCBpcyBhY3R1YWxseSBzY3JvbGxhYmxlIGluXG4gIC8vIGEgY2VydGFpbiBkaXJlY3Rpb24gYW5kIHdlIG9ubHkgYXNzaWduIHRoZSBzY3JvbGwgZGlyZWN0aW9uIGlmIGl0IGlzLiBXZSBkbyB0aGlzIHNvIHRoYXQgd2VcbiAgLy8gY2FuIGFsbG93IG90aGVyIGVsZW1lbnRzIHRvIGJlIHNjcm9sbGVkLCBpZiB0aGUgY3VycmVudCBlbGVtZW50IGNhbid0IGJlIHNjcm9sbGVkIGFueW1vcmUuXG4gIC8vIFRoaXMgYWxsb3dzIHVzIHRvIGhhbmRsZSBjYXNlcyB3aGVyZSB0aGUgc2Nyb2xsIHJlZ2lvbnMgb2YgdHdvIHNjcm9sbGFibGUgZWxlbWVudHMgb3ZlcmxhcC5cbiAgaWYgKGNvbXB1dGVkVmVydGljYWwpIHtcbiAgICBjb25zdCBzY3JvbGxUb3AgPSBlbGVtZW50LnNjcm9sbFRvcDtcblxuICAgIGlmIChjb21wdXRlZFZlcnRpY2FsID09PSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uVVApIHtcbiAgICAgIGlmIChzY3JvbGxUb3AgPiAwKSB7XG4gICAgICAgIHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLlVQO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZWxlbWVudC5zY3JvbGxIZWlnaHQgLSBzY3JvbGxUb3AgPiBlbGVtZW50LmNsaWVudEhlaWdodCkge1xuICAgICAgdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uRE9XTjtcbiAgICB9XG4gIH1cblxuICBpZiAoY29tcHV0ZWRIb3Jpem9udGFsKSB7XG4gICAgY29uc3Qgc2Nyb2xsTGVmdCA9IGVsZW1lbnQuc2Nyb2xsTGVmdDtcblxuICAgIGlmIChjb21wdXRlZEhvcml6b250YWwgPT09IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLkxFRlQpIHtcbiAgICAgIGlmIChzY3JvbGxMZWZ0ID4gMCkge1xuICAgICAgICBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTEVGVDtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGVsZW1lbnQuc2Nyb2xsV2lkdGggLSBzY3JvbGxMZWZ0ID4gZWxlbWVudC5jbGllbnRXaWR0aCkge1xuICAgICAgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLlJJR0hUO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBbdmVydGljYWxTY3JvbGxEaXJlY3Rpb24sIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb25dO1xufVxuXG4vKiogR2V0cyB0aGUgc2hhZG93IHJvb3Qgb2YgYW4gZWxlbWVudCwgaWYgYW55LiAqL1xuZnVuY3Rpb24gZ2V0U2hhZG93Um9vdChlbGVtZW50OiBIVE1MRWxlbWVudCk6IERvY3VtZW50T3JTaGFkb3dSb290IHwgbnVsbCB7XG4gIGlmIChfc3VwcG9ydHNTaGFkb3dEb20oKSkge1xuICAgIGNvbnN0IHJvb3ROb2RlID0gZWxlbWVudC5nZXRSb290Tm9kZSA/IGVsZW1lbnQuZ2V0Um9vdE5vZGUoKSA6IG51bGw7XG5cbiAgICBpZiAocm9vdE5vZGUgaW5zdGFuY2VvZiBTaGFkb3dSb290KSB7XG4gICAgICByZXR1cm4gcm9vdE5vZGU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG4iXX0=