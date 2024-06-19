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
import { isPointerNearDomRect, isInsideClientRect } from './dom/dom-rect';
import { ParentPositionTracker } from './dom/parent-position-tracker';
import { SingleAxisSortStrategy } from './sorting/single-axis-sort-strategy';
import { MixedSortStrategy } from './sorting/mixed-sort-strategy';
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
/** Vertical direction in which we can auto-scroll. */
var AutoScrollVerticalDirection;
(function (AutoScrollVerticalDirection) {
    AutoScrollVerticalDirection[AutoScrollVerticalDirection["NONE"] = 0] = "NONE";
    AutoScrollVerticalDirection[AutoScrollVerticalDirection["UP"] = 1] = "UP";
    AutoScrollVerticalDirection[AutoScrollVerticalDirection["DOWN"] = 2] = "DOWN";
})(AutoScrollVerticalDirection || (AutoScrollVerticalDirection = {}));
/** Horizontal direction in which we can auto-scroll. */
var AutoScrollHorizontalDirection;
(function (AutoScrollHorizontalDirection) {
    AutoScrollHorizontalDirection[AutoScrollHorizontalDirection["NONE"] = 0] = "NONE";
    AutoScrollHorizontalDirection[AutoScrollHorizontalDirection["LEFT"] = 1] = "LEFT";
    AutoScrollHorizontalDirection[AutoScrollHorizontalDirection["RIGHT"] = 2] = "RIGHT";
})(AutoScrollHorizontalDirection || (AutoScrollHorizontalDirection = {}));
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
        /** Function that is used to determine whether an item can be sorted into a particular index. */
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
        /** Emits when a dragging sequence is started in a list connected to the current one. */
        this.receivingStarted = new Subject();
        /** Emits when a dragging sequence is stopped from a list connected to the current one. */
        this.receivingStopped = new Subject();
        /** Whether an item in the list is being dragged. */
        this._isDragging = false;
        /** Draggable items in the container. */
        this._draggables = [];
        /** Drop lists that are connected to the current one. */
        this._siblings = [];
        /** Connected siblings that currently have a dragged item. */
        this._activeSiblings = new Set();
        /** Subscription to the window being scrolled. */
        this._viewportScrollSubscription = Subscription.EMPTY;
        /** Vertical direction in which the list is currently scrolling. */
        this._verticalScrollDirection = AutoScrollVerticalDirection.NONE;
        /** Horizontal direction in which the list is currently scrolling. */
        this._horizontalScrollDirection = AutoScrollHorizontalDirection.NONE;
        /** Used to signal to the current auto-scroll sequence when to stop. */
        this._stopScrollTimers = new Subject();
        /** Shadow root of the current element. Necessary for `elementFromPoint` to resolve correctly. */
        this._cachedShadowRoot = null;
        /** Elements that can be scrolled while the user is dragging. */
        this._scrollableElements = [];
        /** Direction of the list's layout. */
        this._direction = 'ltr';
        /** Starts the interval that'll auto-scroll the element. */
        this._startScrollInterval = () => {
            this._stopScrolling();
            interval(0, animationFrameScheduler)
                .pipe(takeUntil(this._stopScrollTimers))
                .subscribe(() => {
                const node = this._scrollNode;
                const scrollStep = this.autoScrollStep;
                if (this._verticalScrollDirection === AutoScrollVerticalDirection.UP) {
                    node.scrollBy(0, -scrollStep);
                }
                else if (this._verticalScrollDirection === AutoScrollVerticalDirection.DOWN) {
                    node.scrollBy(0, scrollStep);
                }
                if (this._horizontalScrollDirection === AutoScrollHorizontalDirection.LEFT) {
                    node.scrollBy(-scrollStep, 0);
                }
                else if (this._horizontalScrollDirection === AutoScrollHorizontalDirection.RIGHT) {
                    node.scrollBy(scrollStep, 0);
                }
            });
        };
        const coercedElement = (this.element = coerceElement(element));
        this._document = _document;
        this.withOrientation('vertical').withElementContainer(coercedElement);
        _dragDropRegistry.registerDropContainer(this);
        this._parentPositions = new ParentPositionTracker(_document);
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
        this.receivingStarted.complete();
        this.receivingStopped.complete();
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
     * Attempts to move an item into the container.
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
        if (index == null && this.sortingDisabled) {
            index = this._draggables.indexOf(item);
        }
        this._sortStrategy.enter(item, pointerX, pointerY, index);
        // Note that this usually happens inside `_draggingStarted` as well, but the dimensions
        // can change when the sort strategy moves the item around inside `enter`.
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
     * @param event Event that triggered the dropping sequence.
     *
     * @breaking-change 15.0.0 `previousIndex` and `event` parameters to become required.
     */
    drop(item, currentIndex, previousIndex, previousContainer, isPointerOverContainer, distance, dropPoint, event = {}) {
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
            event,
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
                this._sortStrategy.withItems(this._draggables);
            }
        }
        return this;
    }
    /** Sets the layout direction of the drop list. */
    withDirection(direction) {
        this._direction = direction;
        if (this._sortStrategy instanceof SingleAxisSortStrategy) {
            this._sortStrategy.direction = direction;
        }
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
        if (orientation === 'mixed') {
            this._sortStrategy = new MixedSortStrategy(this._document, this._dragDropRegistry);
        }
        else {
            const strategy = new SingleAxisSortStrategy(this._dragDropRegistry);
            strategy.direction = this._direction;
            strategy.orientation = orientation;
            this._sortStrategy = strategy;
        }
        this._sortStrategy.withElementContainer(this._container);
        this._sortStrategy.withSortPredicate((index, item) => this.sortPredicate(index, item, this));
        return this;
    }
    /**
     * Sets which parent elements are can be scrolled while the user is dragging.
     * @param elements Elements that can be scrolled.
     */
    withScrollableParents(elements) {
        const element = this._container;
        // We always allow the current element to be scrollable
        // so we need to ensure that it's in the array.
        this._scrollableElements =
            elements.indexOf(element) === -1 ? [element, ...elements] : elements.slice();
        return this;
    }
    /**
     * Configures the drop list so that a different element is used as the container for the
     * dragged items. This is useful for the cases when one might not have control over the
     * full DOM that sets up the dragging.
     * Note that the alternate container needs to be a descendant of the drop list.
     * @param container New element container to be assigned.
     */
    withElementContainer(container) {
        if (container === this._container) {
            return this;
        }
        const element = coerceElement(this.element);
        if ((typeof ngDevMode === 'undefined' || ngDevMode) &&
            container !== element &&
            !element.contains(container)) {
            throw new Error('Invalid DOM structure for drop list. Alternate container element must be a descendant of the drop list.');
        }
        const oldContainerIndex = this._scrollableElements.indexOf(this._container);
        const newContainerIndex = this._scrollableElements.indexOf(container);
        if (oldContainerIndex > -1) {
            this._scrollableElements.splice(oldContainerIndex, 1);
        }
        if (newContainerIndex > -1) {
            this._scrollableElements.splice(newContainerIndex, 1);
        }
        if (this._sortStrategy) {
            this._sortStrategy.withElementContainer(container);
        }
        this._cachedShadowRoot = null;
        this._scrollableElements.unshift(container);
        this._container = container;
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
        return this._isDragging
            ? this._sortStrategy.getItemIndex(item)
            : this._draggables.indexOf(item);
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
            !this._domRect ||
            !isPointerNearDomRect(this._domRect, DROP_PROXIMITY_THRESHOLD, pointerX, pointerY)) {
            return;
        }
        const result = this._sortStrategy.sort(item, pointerX, pointerY, pointerDelta);
        if (result) {
            this.sorted.next({
                previousIndex: result.previousIndex,
                currentIndex: result.currentIndex,
                container: this,
                item,
            });
        }
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
        let verticalScrollDirection = AutoScrollVerticalDirection.NONE;
        let horizontalScrollDirection = AutoScrollHorizontalDirection.NONE;
        // Check whether we should start scrolling any of the parent containers.
        this._parentPositions.positions.forEach((position, element) => {
            // We have special handling for the `document` below. Also this would be
            // nicer with a  for...of loop, but it requires changing a compiler flag.
            if (element === this._document || !position.clientRect || scrollNode) {
                return;
            }
            if (isPointerNearDomRect(position.clientRect, DROP_PROXIMITY_THRESHOLD, pointerX, pointerY)) {
                [verticalScrollDirection, horizontalScrollDirection] = getElementScrollDirections(element, position.clientRect, this._direction, pointerX, pointerY);
                if (verticalScrollDirection || horizontalScrollDirection) {
                    scrollNode = element;
                }
            }
        });
        // Otherwise check if we can start scrolling the viewport.
        if (!verticalScrollDirection && !horizontalScrollDirection) {
            const { width, height } = this._viewportRuler.getViewportSize();
            const domRect = {
                width,
                height,
                top: 0,
                right: width,
                bottom: height,
                left: 0,
            };
            verticalScrollDirection = getVerticalScrollDirection(domRect, pointerY);
            horizontalScrollDirection = getHorizontalScrollDirection(domRect, pointerX);
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
        const styles = this._container.style;
        this.beforeStarted.next();
        this._isDragging = true;
        if ((typeof ngDevMode === 'undefined' || ngDevMode) &&
            // Prevent the check from running on apps not using an alternate container. Ideally we
            // would always run it, but introducing it at this stage would be a breaking change.
            this._container !== coerceElement(this.element)) {
            for (const drag of this._draggables) {
                if (!drag.isDragging() && drag.getVisibleElement().parentNode !== this._container) {
                    throw new Error('Invalid DOM structure for drop list. All items must be placed directly inside of the element container.');
                }
            }
        }
        // We need to disable scroll snapping while the user is dragging, because it breaks automatic
        // scrolling. The browser seems to round the value based on the snapping points which means
        // that we can't increment/decrement the scroll position.
        this._initialScrollSnap = styles.msScrollSnapType || styles.scrollSnapType || '';
        styles.scrollSnapType = styles.msScrollSnapType = 'none';
        this._sortStrategy.start(this._draggables);
        this._cacheParentPositions();
        this._viewportScrollSubscription.unsubscribe();
        this._listenToScrollEvents();
    }
    /** Caches the positions of the configured scrollable parents. */
    _cacheParentPositions() {
        this._parentPositions.cache(this._scrollableElements);
        // The list element is always in the `scrollableElements`
        // so we can take advantage of the cached `DOMRect`.
        this._domRect = this._parentPositions.positions.get(this._container).clientRect;
    }
    /** Resets the container to its initial state. */
    _reset() {
        this._isDragging = false;
        const styles = this._container.style;
        styles.scrollSnapType = styles.msScrollSnapType = this._initialScrollSnap;
        this._siblings.forEach(sibling => sibling._stopReceiving(this));
        this._sortStrategy.reset();
        this._stopScrolling();
        this._viewportScrollSubscription.unsubscribe();
        this._parentPositions.clear();
    }
    /**
     * Checks whether the user's pointer is positioned over the container.
     * @param x Pointer position along the X axis.
     * @param y Pointer position along the Y axis.
     */
    _isOverContainer(x, y) {
        return this._domRect != null && isInsideClientRect(this._domRect, x, y);
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
        if (!this._domRect ||
            !isInsideClientRect(this._domRect, x, y) ||
            !this.enterPredicate(item, this)) {
            return false;
        }
        const elementFromPoint = this._getShadowRoot().elementFromPoint(x, y);
        // If there's no element at the pointer position, then
        // the client rect is probably scrolled out of the view.
        if (!elementFromPoint) {
            return false;
        }
        // The `DOMRect`, that we're using to find the container over which the user is
        // hovering, doesn't give us any information on whether the element has been scrolled
        // out of the view or whether it's overlapping with other containers. This means that
        // we could end up transferring the item into a container that's invisible or is positioned
        // below another one. We use the result from `elementFromPoint` to get the top-most element
        // at the pointer position and to find whether it's one of the intersecting drop containers.
        return elementFromPoint === this._container || this._container.contains(elementFromPoint);
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
            this.receivingStarted.next({
                initiator: sibling,
                receiver: this,
                items,
            });
        }
    }
    /**
     * Called by a connected drop list when dragging has stopped.
     * @param sibling Sibling whose dragging has stopped.
     */
    _stopReceiving(sibling) {
        this._activeSiblings.delete(sibling);
        this._viewportScrollSubscription.unsubscribe();
        this.receivingStopped.next({ initiator: sibling, receiver: this });
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
                    this._sortStrategy.updateOnScroll(scrollDifference.top, scrollDifference.left);
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
            const shadowRoot = _getShadowRoot(this._container);
            this._cachedShadowRoot = (shadowRoot || this._document);
        }
        return this._cachedShadowRoot;
    }
    /** Notifies any siblings that may potentially receive the item. */
    _notifyReceivingSiblings() {
        const draggedItems = this._sortStrategy
            .getActiveItemsSnapshot()
            .filter(item => item.isDragging());
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
        return AutoScrollVerticalDirection.UP;
    }
    else if (pointerY >= bottom - yThreshold && pointerY <= bottom + yThreshold) {
        return AutoScrollVerticalDirection.DOWN;
    }
    return AutoScrollVerticalDirection.NONE;
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
        return AutoScrollHorizontalDirection.LEFT;
    }
    else if (pointerX >= right - xThreshold && pointerX <= right + xThreshold) {
        return AutoScrollHorizontalDirection.RIGHT;
    }
    return AutoScrollHorizontalDirection.NONE;
}
/**
 * Gets the directions in which an element node should be scrolled,
 * assuming that the user's pointer is already within it scrollable region.
 * @param element Element for which we should calculate the scroll direction.
 * @param clientRect Bounding client rectangle of the element.
 * @param direction Layout direction of the drop list.
 * @param pointerX Position of the user's pointer along the x axis.
 * @param pointerY Position of the user's pointer along the y axis.
 */
function getElementScrollDirections(element, clientRect, direction, pointerX, pointerY) {
    const computedVertical = getVerticalScrollDirection(clientRect, pointerY);
    const computedHorizontal = getHorizontalScrollDirection(clientRect, pointerX);
    let verticalScrollDirection = AutoScrollVerticalDirection.NONE;
    let horizontalScrollDirection = AutoScrollHorizontalDirection.NONE;
    // Note that we here we do some extra checks for whether the element is actually scrollable in
    // a certain direction and we only assign the scroll direction if it is. We do this so that we
    // can allow other elements to be scrolled, if the current element can't be scrolled anymore.
    // This allows us to handle cases where the scroll regions of two scrollable elements overlap.
    if (computedVertical) {
        const scrollTop = element.scrollTop;
        if (computedVertical === AutoScrollVerticalDirection.UP) {
            if (scrollTop > 0) {
                verticalScrollDirection = AutoScrollVerticalDirection.UP;
            }
        }
        else if (element.scrollHeight - scrollTop > element.clientHeight) {
            verticalScrollDirection = AutoScrollVerticalDirection.DOWN;
        }
    }
    if (computedHorizontal) {
        const scrollLeft = element.scrollLeft;
        if (direction === 'rtl') {
            if (computedHorizontal === AutoScrollHorizontalDirection.RIGHT) {
                // In RTL `scrollLeft` will be negative when scrolled.
                if (scrollLeft < 0) {
                    horizontalScrollDirection = AutoScrollHorizontalDirection.RIGHT;
                }
            }
            else if (element.scrollWidth + scrollLeft > element.clientWidth) {
                horizontalScrollDirection = AutoScrollHorizontalDirection.LEFT;
            }
        }
        else {
            if (computedHorizontal === AutoScrollHorizontalDirection.LEFT) {
                if (scrollLeft > 0) {
                    horizontalScrollDirection = AutoScrollHorizontalDirection.LEFT;
                }
            }
            else if (element.scrollWidth - scrollLeft > element.clientWidth) {
                horizontalScrollDirection = AutoScrollHorizontalDirection.RIGHT;
            }
        }
    }
    return [verticalScrollDirection, horizontalScrollDirection];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LXJlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2Ryb3AtbGlzdC1yZWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBSUgsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRXBELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsT0FBTyxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsdUJBQXVCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDOUUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBR3pDLE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3hFLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLCtCQUErQixDQUFDO0FBR3BFLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLHFDQUFxQyxDQUFDO0FBQzNFLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLCtCQUErQixDQUFDO0FBR2hFOzs7R0FHRztBQUNILE1BQU0sd0JBQXdCLEdBQUcsSUFBSSxDQUFDO0FBRXRDOzs7R0FHRztBQUNILE1BQU0sMEJBQTBCLEdBQUcsSUFBSSxDQUFDO0FBRXhDLHNEQUFzRDtBQUN0RCxJQUFLLDJCQUlKO0FBSkQsV0FBSywyQkFBMkI7SUFDOUIsNkVBQUksQ0FBQTtJQUNKLHlFQUFFLENBQUE7SUFDRiw2RUFBSSxDQUFBO0FBQ04sQ0FBQyxFQUpJLDJCQUEyQixLQUEzQiwyQkFBMkIsUUFJL0I7QUFFRCx3REFBd0Q7QUFDeEQsSUFBSyw2QkFJSjtBQUpELFdBQUssNkJBQTZCO0lBQ2hDLGlGQUFJLENBQUE7SUFDSixpRkFBSSxDQUFBO0lBQ0osbUZBQUssQ0FBQTtBQUNQLENBQUMsRUFKSSw2QkFBNkIsS0FB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QVUsR0FBRyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ2xFLHlCQUF5QixHQUFHLDZCQUE2QixDQUFDLEtBQUssQ0FBQztZQUNsRSxDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFFRCxPQUFPLENBQUMsdUJBQXVCLEVBQUUseUJBQXlCLENBQUMsQ0FBQztBQUM5RCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RWxlbWVudFJlZiwgTmdab25lfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7RGlyZWN0aW9ufSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge2NvZXJjZUVsZW1lbnR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge1ZpZXdwb3J0UnVsZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9zY3JvbGxpbmcnO1xuaW1wb3J0IHtfZ2V0U2hhZG93Um9vdH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7U3ViamVjdCwgU3Vic2NyaXB0aW9uLCBpbnRlcnZhbCwgYW5pbWF0aW9uRnJhbWVTY2hlZHVsZXJ9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHt0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7RHJhZ0Ryb3BSZWdpc3RyeX0gZnJvbSAnLi9kcmFnLWRyb3AtcmVnaXN0cnknO1xuaW1wb3J0IHR5cGUge0RyYWdSZWYsIFBvaW50fSBmcm9tICcuL2RyYWctcmVmJztcbmltcG9ydCB7aXNQb2ludGVyTmVhckRvbVJlY3QsIGlzSW5zaWRlQ2xpZW50UmVjdH0gZnJvbSAnLi9kb20vZG9tLXJlY3QnO1xuaW1wb3J0IHtQYXJlbnRQb3NpdGlvblRyYWNrZXJ9IGZyb20gJy4vZG9tL3BhcmVudC1wb3NpdGlvbi10cmFja2VyJztcbmltcG9ydCB7RHJhZ0NTU1N0eWxlRGVjbGFyYXRpb259IGZyb20gJy4vZG9tL3N0eWxpbmcnO1xuaW1wb3J0IHtEcm9wTGlzdFNvcnRTdHJhdGVneX0gZnJvbSAnLi9zb3J0aW5nL2Ryb3AtbGlzdC1zb3J0LXN0cmF0ZWd5JztcbmltcG9ydCB7U2luZ2xlQXhpc1NvcnRTdHJhdGVneX0gZnJvbSAnLi9zb3J0aW5nL3NpbmdsZS1heGlzLXNvcnQtc3RyYXRlZ3knO1xuaW1wb3J0IHtNaXhlZFNvcnRTdHJhdGVneX0gZnJvbSAnLi9zb3J0aW5nL21peGVkLXNvcnQtc3RyYXRlZ3knO1xuaW1wb3J0IHtEcm9wTGlzdE9yaWVudGF0aW9ufSBmcm9tICcuL2RpcmVjdGl2ZXMvY29uZmlnJztcblxuLyoqXG4gKiBQcm94aW1pdHksIGFzIGEgcmF0aW8gdG8gd2lkdGgvaGVpZ2h0LCBhdCB3aGljaCBhXG4gKiBkcmFnZ2VkIGl0ZW0gd2lsbCBhZmZlY3QgdGhlIGRyb3AgY29udGFpbmVyLlxuICovXG5jb25zdCBEUk9QX1BST1hJTUlUWV9USFJFU0hPTEQgPSAwLjA1O1xuXG4vKipcbiAqIFByb3hpbWl0eSwgYXMgYSByYXRpbyB0byB3aWR0aC9oZWlnaHQgYXQgd2hpY2ggdG8gc3RhcnQgYXV0by1zY3JvbGxpbmcgdGhlIGRyb3AgbGlzdCBvciB0aGVcbiAqIHZpZXdwb3J0LiBUaGUgdmFsdWUgY29tZXMgZnJvbSB0cnlpbmcgaXQgb3V0IG1hbnVhbGx5IHVudGlsIGl0IGZlZWxzIHJpZ2h0LlxuICovXG5jb25zdCBTQ1JPTExfUFJPWElNSVRZX1RIUkVTSE9MRCA9IDAuMDU7XG5cbi8qKiBWZXJ0aWNhbCBkaXJlY3Rpb24gaW4gd2hpY2ggd2UgY2FuIGF1dG8tc2Nyb2xsLiAqL1xuZW51bSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24ge1xuICBOT05FLFxuICBVUCxcbiAgRE9XTixcbn1cblxuLyoqIEhvcml6b250YWwgZGlyZWN0aW9uIGluIHdoaWNoIHdlIGNhbiBhdXRvLXNjcm9sbC4gKi9cbmVudW0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24ge1xuICBOT05FLFxuICBMRUZULFxuICBSSUdIVCxcbn1cblxudHlwZSBSb290Tm9kZSA9IERvY3VtZW50T3JTaGFkb3dSb290ICYge1xuICAvLyBBcyBvZiBUUyA0LjQgdGhlIGJ1aWx0IGluIERPTSB0eXBpbmdzIGRvbid0IGluY2x1ZGUgYGVsZW1lbnRGcm9tUG9pbnRgIG9uIGBTaGFkb3dSb290YCxcbiAgLy8gZXZlbiB0aG91Z2ggaXQgZXhpc3RzIChzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1NoYWRvd1Jvb3QpLlxuICAvLyBUaGlzIHR5cGUgaXMgYSB1dGlsaXR5IHRvIGF2b2lkIGhhdmluZyB0byBhZGQgY2FzdHMgZXZlcnl3aGVyZS5cbiAgZWxlbWVudEZyb21Qb2ludCh4OiBudW1iZXIsIHk6IG51bWJlcik6IEVsZW1lbnQgfCBudWxsO1xufTtcblxuLyoqXG4gKiBSZWZlcmVuY2UgdG8gYSBkcm9wIGxpc3QuIFVzZWQgdG8gbWFuaXB1bGF0ZSBvciBkaXNwb3NlIG9mIHRoZSBjb250YWluZXIuXG4gKi9cbmV4cG9ydCBjbGFzcyBEcm9wTGlzdFJlZjxUID0gYW55PiB7XG4gIC8qKiBFbGVtZW50IHRoYXQgdGhlIGRyb3AgbGlzdCBpcyBhdHRhY2hlZCB0by4gKi9cbiAgZWxlbWVudDogSFRNTEVsZW1lbnQgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50PjtcblxuICAvKiogV2hldGhlciBzdGFydGluZyBhIGRyYWdnaW5nIHNlcXVlbmNlIGZyb20gdGhpcyBjb250YWluZXIgaXMgZGlzYWJsZWQuICovXG4gIGRpc2FibGVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgc29ydGluZyBpdGVtcyB3aXRoaW4gdGhlIGxpc3QgaXMgZGlzYWJsZWQuICovXG4gIHNvcnRpbmdEaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBMb2NrcyB0aGUgcG9zaXRpb24gb2YgdGhlIGRyYWdnYWJsZSBlbGVtZW50cyBpbnNpZGUgdGhlIGNvbnRhaW5lciBhbG9uZyB0aGUgc3BlY2lmaWVkIGF4aXMuICovXG4gIGxvY2tBeGlzOiAneCcgfCAneSc7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgYXV0by1zY3JvbGxpbmcgdGhlIHZpZXcgd2hlbiB0aGUgdXNlclxuICAgKiBtb3ZlcyB0aGVpciBwb2ludGVyIGNsb3NlIHRvIHRoZSBlZGdlcyBpcyBkaXNhYmxlZC5cbiAgICovXG4gIGF1dG9TY3JvbGxEaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBOdW1iZXIgb2YgcGl4ZWxzIHRvIHNjcm9sbCBmb3IgZWFjaCBmcmFtZSB3aGVuIGF1dG8tc2Nyb2xsaW5nIGFuIGVsZW1lbnQuICovXG4gIGF1dG9TY3JvbGxTdGVwOiBudW1iZXIgPSAyO1xuXG4gIC8qKlxuICAgKiBGdW5jdGlvbiB0aGF0IGlzIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYW4gaXRlbVxuICAgKiBpcyBhbGxvd2VkIHRvIGJlIG1vdmVkIGludG8gYSBkcm9wIGNvbnRhaW5lci5cbiAgICovXG4gIGVudGVyUHJlZGljYXRlOiAoZHJhZzogRHJhZ1JlZiwgZHJvcDogRHJvcExpc3RSZWYpID0+IGJvb2xlYW4gPSAoKSA9PiB0cnVlO1xuXG4gIC8qKiBGdW5jdGlvbiB0aGF0IGlzIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYW4gaXRlbSBjYW4gYmUgc29ydGVkIGludG8gYSBwYXJ0aWN1bGFyIGluZGV4LiAqL1xuICBzb3J0UHJlZGljYXRlOiAoaW5kZXg6IG51bWJlciwgZHJhZzogRHJhZ1JlZiwgZHJvcDogRHJvcExpc3RSZWYpID0+IGJvb2xlYW4gPSAoKSA9PiB0cnVlO1xuXG4gIC8qKiBFbWl0cyByaWdodCBiZWZvcmUgZHJhZ2dpbmcgaGFzIHN0YXJ0ZWQuICovXG4gIHJlYWRvbmx5IGJlZm9yZVN0YXJ0ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGhhcyBtb3ZlZCBhIG5ldyBkcmFnIGl0ZW0gaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICovXG4gIHJlYWRvbmx5IGVudGVyZWQgPSBuZXcgU3ViamVjdDx7aXRlbTogRHJhZ1JlZjsgY29udGFpbmVyOiBEcm9wTGlzdFJlZjsgY3VycmVudEluZGV4OiBudW1iZXJ9PigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHJlbW92ZXMgYW4gaXRlbSBmcm9tIHRoZSBjb250YWluZXJcbiAgICogYnkgZHJhZ2dpbmcgaXQgaW50byBhbm90aGVyIGNvbnRhaW5lci5cbiAgICovXG4gIHJlYWRvbmx5IGV4aXRlZCA9IG5ldyBTdWJqZWN0PHtpdGVtOiBEcmFnUmVmOyBjb250YWluZXI6IERyb3BMaXN0UmVmfT4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBkcm9wcyBhbiBpdGVtIGluc2lkZSB0aGUgY29udGFpbmVyLiAqL1xuICByZWFkb25seSBkcm9wcGVkID0gbmV3IFN1YmplY3Q8e1xuICAgIGl0ZW06IERyYWdSZWY7XG4gICAgY3VycmVudEluZGV4OiBudW1iZXI7XG4gICAgcHJldmlvdXNJbmRleDogbnVtYmVyO1xuICAgIGNvbnRhaW5lcjogRHJvcExpc3RSZWY7XG4gICAgcHJldmlvdXNDb250YWluZXI6IERyb3BMaXN0UmVmO1xuICAgIGlzUG9pbnRlck92ZXJDb250YWluZXI6IGJvb2xlYW47XG4gICAgZGlzdGFuY2U6IFBvaW50O1xuICAgIGRyb3BQb2ludDogUG9pbnQ7XG4gICAgZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50O1xuICB9PigpO1xuXG4gIC8qKiBFbWl0cyBhcyB0aGUgdXNlciBpcyBzd2FwcGluZyBpdGVtcyB3aGlsZSBhY3RpdmVseSBkcmFnZ2luZy4gKi9cbiAgcmVhZG9ubHkgc29ydGVkID0gbmV3IFN1YmplY3Q8e1xuICAgIHByZXZpb3VzSW5kZXg6IG51bWJlcjtcbiAgICBjdXJyZW50SW5kZXg6IG51bWJlcjtcbiAgICBjb250YWluZXI6IERyb3BMaXN0UmVmO1xuICAgIGl0ZW06IERyYWdSZWY7XG4gIH0+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gYSBkcmFnZ2luZyBzZXF1ZW5jZSBpcyBzdGFydGVkIGluIGEgbGlzdCBjb25uZWN0ZWQgdG8gdGhlIGN1cnJlbnQgb25lLiAqL1xuICByZWFkb25seSByZWNlaXZpbmdTdGFydGVkID0gbmV3IFN1YmplY3Q8e1xuICAgIHJlY2VpdmVyOiBEcm9wTGlzdFJlZjtcbiAgICBpbml0aWF0b3I6IERyb3BMaXN0UmVmO1xuICAgIGl0ZW1zOiBEcmFnUmVmW107XG4gIH0+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gYSBkcmFnZ2luZyBzZXF1ZW5jZSBpcyBzdG9wcGVkIGZyb20gYSBsaXN0IGNvbm5lY3RlZCB0byB0aGUgY3VycmVudCBvbmUuICovXG4gIHJlYWRvbmx5IHJlY2VpdmluZ1N0b3BwZWQgPSBuZXcgU3ViamVjdDx7XG4gICAgcmVjZWl2ZXI6IERyb3BMaXN0UmVmO1xuICAgIGluaXRpYXRvcjogRHJvcExpc3RSZWY7XG4gIH0+KCk7XG5cbiAgLyoqIEFyYml0cmFyeSBkYXRhIHRoYXQgY2FuIGJlIGF0dGFjaGVkIHRvIHRoZSBkcm9wIGxpc3QuICovXG4gIGRhdGE6IFQ7XG5cbiAgLyoqIEVsZW1lbnQgdGhhdCBpcyB0aGUgZGlyZWN0IHBhcmVudCBvZiB0aGUgZHJhZyBpdGVtcy4gKi9cbiAgcHJpdmF0ZSBfY29udGFpbmVyOiBIVE1MRWxlbWVudDtcblxuICAvKiogV2hldGhlciBhbiBpdGVtIGluIHRoZSBsaXN0IGlzIGJlaW5nIGRyYWdnZWQuICovXG4gIHByaXZhdGUgX2lzRHJhZ2dpbmcgPSBmYWxzZTtcblxuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIHBvc2l0aW9ucyBvZiBhbnkgcGFyZW50IHNjcm9sbGFibGUgZWxlbWVudHMuICovXG4gIHByaXZhdGUgX3BhcmVudFBvc2l0aW9uczogUGFyZW50UG9zaXRpb25UcmFja2VyO1xuXG4gIC8qKiBTdHJhdGVneSBiZWluZyB1c2VkIHRvIHNvcnQgaXRlbXMgd2l0aGluIHRoZSBsaXN0LiAqL1xuICBwcml2YXRlIF9zb3J0U3RyYXRlZ3k6IERyb3BMaXN0U29ydFN0cmF0ZWd5O1xuXG4gIC8qKiBDYWNoZWQgYERPTVJlY3RgIG9mIHRoZSBkcm9wIGxpc3QuICovXG4gIHByaXZhdGUgX2RvbVJlY3Q6IERPTVJlY3QgfCB1bmRlZmluZWQ7XG5cbiAgLyoqIERyYWdnYWJsZSBpdGVtcyBpbiB0aGUgY29udGFpbmVyLiAqL1xuICBwcml2YXRlIF9kcmFnZ2FibGVzOiByZWFkb25seSBEcmFnUmVmW10gPSBbXTtcblxuICAvKiogRHJvcCBsaXN0cyB0aGF0IGFyZSBjb25uZWN0ZWQgdG8gdGhlIGN1cnJlbnQgb25lLiAqL1xuICBwcml2YXRlIF9zaWJsaW5nczogcmVhZG9ubHkgRHJvcExpc3RSZWZbXSA9IFtdO1xuXG4gIC8qKiBDb25uZWN0ZWQgc2libGluZ3MgdGhhdCBjdXJyZW50bHkgaGF2ZSBhIGRyYWdnZWQgaXRlbS4gKi9cbiAgcHJpdmF0ZSBfYWN0aXZlU2libGluZ3MgPSBuZXcgU2V0PERyb3BMaXN0UmVmPigpO1xuXG4gIC8qKiBTdWJzY3JpcHRpb24gdG8gdGhlIHdpbmRvdyBiZWluZyBzY3JvbGxlZC4gKi9cbiAgcHJpdmF0ZSBfdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG5cbiAgLyoqIFZlcnRpY2FsIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgbGlzdCBpcyBjdXJyZW50bHkgc2Nyb2xsaW5nLiAqL1xuICBwcml2YXRlIF92ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5OT05FO1xuXG4gIC8qKiBIb3Jpem9udGFsIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgbGlzdCBpcyBjdXJyZW50bHkgc2Nyb2xsaW5nLiAqL1xuICBwcml2YXRlIF9ob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTk9ORTtcblxuICAvKiogTm9kZSB0aGF0IGlzIGJlaW5nIGF1dG8tc2Nyb2xsZWQuICovXG4gIHByaXZhdGUgX3Njcm9sbE5vZGU6IEhUTUxFbGVtZW50IHwgV2luZG93O1xuXG4gIC8qKiBVc2VkIHRvIHNpZ25hbCB0byB0aGUgY3VycmVudCBhdXRvLXNjcm9sbCBzZXF1ZW5jZSB3aGVuIHRvIHN0b3AuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX3N0b3BTY3JvbGxUaW1lcnMgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBTaGFkb3cgcm9vdCBvZiB0aGUgY3VycmVudCBlbGVtZW50LiBOZWNlc3NhcnkgZm9yIGBlbGVtZW50RnJvbVBvaW50YCB0byByZXNvbHZlIGNvcnJlY3RseS4gKi9cbiAgcHJpdmF0ZSBfY2FjaGVkU2hhZG93Um9vdDogUm9vdE5vZGUgfCBudWxsID0gbnVsbDtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSBkb2N1bWVudC4gKi9cbiAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50O1xuXG4gIC8qKiBFbGVtZW50cyB0aGF0IGNhbiBiZSBzY3JvbGxlZCB3aGlsZSB0aGUgdXNlciBpcyBkcmFnZ2luZy4gKi9cbiAgcHJpdmF0ZSBfc2Nyb2xsYWJsZUVsZW1lbnRzOiBIVE1MRWxlbWVudFtdID0gW107XG5cbiAgLyoqIEluaXRpYWwgdmFsdWUgZm9yIHRoZSBlbGVtZW50J3MgYHNjcm9sbC1zbmFwLXR5cGVgIHN0eWxlLiAqL1xuICBwcml2YXRlIF9pbml0aWFsU2Nyb2xsU25hcDogc3RyaW5nO1xuXG4gIC8qKiBEaXJlY3Rpb24gb2YgdGhlIGxpc3QncyBsYXlvdXQuICovXG4gIHByaXZhdGUgX2RpcmVjdGlvbjogRGlyZWN0aW9uID0gJ2x0cic7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBIVE1MRWxlbWVudCxcbiAgICBwcml2YXRlIF9kcmFnRHJvcFJlZ2lzdHJ5OiBEcmFnRHJvcFJlZ2lzdHJ5PERyYWdSZWYsIERyb3BMaXN0UmVmPixcbiAgICBfZG9jdW1lbnQ6IGFueSxcbiAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICBwcml2YXRlIF92aWV3cG9ydFJ1bGVyOiBWaWV3cG9ydFJ1bGVyLFxuICApIHtcbiAgICBjb25zdCBjb2VyY2VkRWxlbWVudCA9ICh0aGlzLmVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnQpKTtcbiAgICB0aGlzLl9kb2N1bWVudCA9IF9kb2N1bWVudDtcbiAgICB0aGlzLndpdGhPcmllbnRhdGlvbigndmVydGljYWwnKS53aXRoRWxlbWVudENvbnRhaW5lcihjb2VyY2VkRWxlbWVudCk7XG4gICAgX2RyYWdEcm9wUmVnaXN0cnkucmVnaXN0ZXJEcm9wQ29udGFpbmVyKHRoaXMpO1xuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucyA9IG5ldyBQYXJlbnRQb3NpdGlvblRyYWNrZXIoX2RvY3VtZW50KTtcbiAgfVxuXG4gIC8qKiBSZW1vdmVzIHRoZSBkcm9wIGxpc3QgZnVuY3Rpb25hbGl0eSBmcm9tIHRoZSBET00gZWxlbWVudC4gKi9cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLl9zdG9wU2Nyb2xsaW5nKCk7XG4gICAgdGhpcy5fc3RvcFNjcm9sbFRpbWVycy5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5iZWZvcmVTdGFydGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5lbnRlcmVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5leGl0ZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmRyb3BwZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLnNvcnRlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMucmVjZWl2aW5nU3RhcnRlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMucmVjZWl2aW5nU3RvcHBlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX2FjdGl2ZVNpYmxpbmdzLmNsZWFyKCk7XG4gICAgdGhpcy5fc2Nyb2xsTm9kZSA9IG51bGwhO1xuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5jbGVhcigpO1xuICAgIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkucmVtb3ZlRHJvcENvbnRhaW5lcih0aGlzKTtcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIGFuIGl0ZW0gZnJvbSB0aGlzIGxpc3QgaXMgY3VycmVudGx5IGJlaW5nIGRyYWdnZWQuICovXG4gIGlzRHJhZ2dpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lzRHJhZ2dpbmc7XG4gIH1cblxuICAvKiogU3RhcnRzIGRyYWdnaW5nIGFuIGl0ZW0uICovXG4gIHN0YXJ0KCk6IHZvaWQge1xuICAgIHRoaXMuX2RyYWdnaW5nU3RhcnRlZCgpO1xuICAgIHRoaXMuX25vdGlmeVJlY2VpdmluZ1NpYmxpbmdzKCk7XG4gIH1cblxuICAvKipcbiAgICogQXR0ZW1wdHMgdG8gbW92ZSBhbiBpdGVtIGludG8gdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB0aGF0IHdhcyBtb3ZlZCBpbnRvIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSBwb2ludGVyWCBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0gcG9pbnRlclkgUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFkgYXhpcy5cbiAgICogQHBhcmFtIGluZGV4IEluZGV4IGF0IHdoaWNoIHRoZSBpdGVtIGVudGVyZWQuIElmIG9taXR0ZWQsIHRoZSBjb250YWluZXIgd2lsbCB0cnkgdG8gZmlndXJlIGl0XG4gICAqICAgb3V0IGF1dG9tYXRpY2FsbHkuXG4gICAqL1xuICBlbnRlcihpdGVtOiBEcmFnUmVmLCBwb2ludGVyWDogbnVtYmVyLCBwb2ludGVyWTogbnVtYmVyLCBpbmRleD86IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMuX2RyYWdnaW5nU3RhcnRlZCgpO1xuXG4gICAgLy8gSWYgc29ydGluZyBpcyBkaXNhYmxlZCwgd2Ugd2FudCB0aGUgaXRlbSB0byByZXR1cm4gdG8gaXRzIHN0YXJ0aW5nXG4gICAgLy8gcG9zaXRpb24gaWYgdGhlIHVzZXIgaXMgcmV0dXJuaW5nIGl0IHRvIGl0cyBpbml0aWFsIGNvbnRhaW5lci5cbiAgICBpZiAoaW5kZXggPT0gbnVsbCAmJiB0aGlzLnNvcnRpbmdEaXNhYmxlZCkge1xuICAgICAgaW5kZXggPSB0aGlzLl9kcmFnZ2FibGVzLmluZGV4T2YoaXRlbSk7XG4gICAgfVxuXG4gICAgdGhpcy5fc29ydFN0cmF0ZWd5LmVudGVyKGl0ZW0sIHBvaW50ZXJYLCBwb2ludGVyWSwgaW5kZXgpO1xuXG4gICAgLy8gTm90ZSB0aGF0IHRoaXMgdXN1YWxseSBoYXBwZW5zIGluc2lkZSBgX2RyYWdnaW5nU3RhcnRlZGAgYXMgd2VsbCwgYnV0IHRoZSBkaW1lbnNpb25zXG4gICAgLy8gY2FuIGNoYW5nZSB3aGVuIHRoZSBzb3J0IHN0cmF0ZWd5IG1vdmVzIHRoZSBpdGVtIGFyb3VuZCBpbnNpZGUgYGVudGVyYC5cbiAgICB0aGlzLl9jYWNoZVBhcmVudFBvc2l0aW9ucygpO1xuXG4gICAgLy8gTm90aWZ5IHNpYmxpbmdzIGF0IHRoZSBlbmQgc28gdGhhdCB0aGUgaXRlbSBoYXMgYmVlbiBpbnNlcnRlZCBpbnRvIHRoZSBgYWN0aXZlRHJhZ2dhYmxlc2AuXG4gICAgdGhpcy5fbm90aWZ5UmVjZWl2aW5nU2libGluZ3MoKTtcbiAgICB0aGlzLmVudGVyZWQubmV4dCh7aXRlbSwgY29udGFpbmVyOiB0aGlzLCBjdXJyZW50SW5kZXg6IHRoaXMuZ2V0SXRlbUluZGV4KGl0ZW0pfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhbiBpdGVtIGZyb20gdGhlIGNvbnRhaW5lciBhZnRlciBpdCB3YXMgZHJhZ2dlZCBpbnRvIGFub3RoZXIgY29udGFpbmVyIGJ5IHRoZSB1c2VyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRoYXQgd2FzIGRyYWdnZWQgb3V0LlxuICAgKi9cbiAgZXhpdChpdGVtOiBEcmFnUmVmKTogdm9pZCB7XG4gICAgdGhpcy5fcmVzZXQoKTtcbiAgICB0aGlzLmV4aXRlZC5uZXh0KHtpdGVtLCBjb250YWluZXI6IHRoaXN9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEcm9wcyBhbiBpdGVtIGludG8gdGhpcyBjb250YWluZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gYmVpbmcgZHJvcHBlZCBpbnRvIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSBjdXJyZW50SW5kZXggSW5kZXggYXQgd2hpY2ggdGhlIGl0ZW0gc2hvdWxkIGJlIGluc2VydGVkLlxuICAgKiBAcGFyYW0gcHJldmlvdXNJbmRleCBJbmRleCBvZiB0aGUgaXRlbSB3aGVuIGRyYWdnaW5nIHN0YXJ0ZWQuXG4gICAqIEBwYXJhbSBwcmV2aW91c0NvbnRhaW5lciBDb250YWluZXIgZnJvbSB3aGljaCB0aGUgaXRlbSBnb3QgZHJhZ2dlZCBpbi5cbiAgICogQHBhcmFtIGlzUG9pbnRlck92ZXJDb250YWluZXIgV2hldGhlciB0aGUgdXNlcidzIHBvaW50ZXIgd2FzIG92ZXIgdGhlXG4gICAqICAgIGNvbnRhaW5lciB3aGVuIHRoZSBpdGVtIHdhcyBkcm9wcGVkLlxuICAgKiBAcGFyYW0gZGlzdGFuY2UgRGlzdGFuY2UgdGhlIHVzZXIgaGFzIGRyYWdnZWQgc2luY2UgdGhlIHN0YXJ0IG9mIHRoZSBkcmFnZ2luZyBzZXF1ZW5jZS5cbiAgICogQHBhcmFtIGV2ZW50IEV2ZW50IHRoYXQgdHJpZ2dlcmVkIHRoZSBkcm9wcGluZyBzZXF1ZW5jZS5cbiAgICpcbiAgICogQGJyZWFraW5nLWNoYW5nZSAxNS4wLjAgYHByZXZpb3VzSW5kZXhgIGFuZCBgZXZlbnRgIHBhcmFtZXRlcnMgdG8gYmVjb21lIHJlcXVpcmVkLlxuICAgKi9cbiAgZHJvcChcbiAgICBpdGVtOiBEcmFnUmVmLFxuICAgIGN1cnJlbnRJbmRleDogbnVtYmVyLFxuICAgIHByZXZpb3VzSW5kZXg6IG51bWJlcixcbiAgICBwcmV2aW91c0NvbnRhaW5lcjogRHJvcExpc3RSZWYsXG4gICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcjogYm9vbGVhbixcbiAgICBkaXN0YW5jZTogUG9pbnQsXG4gICAgZHJvcFBvaW50OiBQb2ludCxcbiAgICBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQgPSB7fSBhcyBhbnksXG4gICk6IHZvaWQge1xuICAgIHRoaXMuX3Jlc2V0KCk7XG4gICAgdGhpcy5kcm9wcGVkLm5leHQoe1xuICAgICAgaXRlbSxcbiAgICAgIGN1cnJlbnRJbmRleCxcbiAgICAgIHByZXZpb3VzSW5kZXgsXG4gICAgICBjb250YWluZXI6IHRoaXMsXG4gICAgICBwcmV2aW91c0NvbnRhaW5lcixcbiAgICAgIGlzUG9pbnRlck92ZXJDb250YWluZXIsXG4gICAgICBkaXN0YW5jZSxcbiAgICAgIGRyb3BQb2ludCxcbiAgICAgIGV2ZW50LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGRyYWdnYWJsZSBpdGVtcyB0aGF0IGFyZSBhIHBhcnQgb2YgdGhpcyBsaXN0LlxuICAgKiBAcGFyYW0gaXRlbXMgSXRlbXMgdGhhdCBhcmUgYSBwYXJ0IG9mIHRoaXMgbGlzdC5cbiAgICovXG4gIHdpdGhJdGVtcyhpdGVtczogRHJhZ1JlZltdKTogdGhpcyB7XG4gICAgY29uc3QgcHJldmlvdXNJdGVtcyA9IHRoaXMuX2RyYWdnYWJsZXM7XG4gICAgdGhpcy5fZHJhZ2dhYmxlcyA9IGl0ZW1zO1xuICAgIGl0ZW1zLmZvckVhY2goaXRlbSA9PiBpdGVtLl93aXRoRHJvcENvbnRhaW5lcih0aGlzKSk7XG5cbiAgICBpZiAodGhpcy5pc0RyYWdnaW5nKCkpIHtcbiAgICAgIGNvbnN0IGRyYWdnZWRJdGVtcyA9IHByZXZpb3VzSXRlbXMuZmlsdGVyKGl0ZW0gPT4gaXRlbS5pc0RyYWdnaW5nKCkpO1xuXG4gICAgICAvLyBJZiBhbGwgb2YgdGhlIGl0ZW1zIGJlaW5nIGRyYWdnZWQgd2VyZSByZW1vdmVkXG4gICAgICAvLyBmcm9tIHRoZSBsaXN0LCBhYm9ydCB0aGUgY3VycmVudCBkcmFnIHNlcXVlbmNlLlxuICAgICAgaWYgKGRyYWdnZWRJdGVtcy5ldmVyeShpdGVtID0+IGl0ZW1zLmluZGV4T2YoaXRlbSkgPT09IC0xKSkge1xuICAgICAgICB0aGlzLl9yZXNldCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fc29ydFN0cmF0ZWd5LndpdGhJdGVtcyh0aGlzLl9kcmFnZ2FibGVzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBsYXlvdXQgZGlyZWN0aW9uIG9mIHRoZSBkcm9wIGxpc3QuICovXG4gIHdpdGhEaXJlY3Rpb24oZGlyZWN0aW9uOiBEaXJlY3Rpb24pOiB0aGlzIHtcbiAgICB0aGlzLl9kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG4gICAgaWYgKHRoaXMuX3NvcnRTdHJhdGVneSBpbnN0YW5jZW9mIFNpbmdsZUF4aXNTb3J0U3RyYXRlZ3kpIHtcbiAgICAgIHRoaXMuX3NvcnRTdHJhdGVneS5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGNvbnRhaW5lcnMgdGhhdCBhcmUgY29ubmVjdGVkIHRvIHRoaXMgb25lLiBXaGVuIHR3byBvciBtb3JlIGNvbnRhaW5lcnMgYXJlXG4gICAqIGNvbm5lY3RlZCwgdGhlIHVzZXIgd2lsbCBiZSBhbGxvd2VkIHRvIHRyYW5zZmVyIGl0ZW1zIGJldHdlZW4gdGhlbS5cbiAgICogQHBhcmFtIGNvbm5lY3RlZFRvIE90aGVyIGNvbnRhaW5lcnMgdGhhdCB0aGUgY3VycmVudCBjb250YWluZXJzIHNob3VsZCBiZSBjb25uZWN0ZWQgdG8uXG4gICAqL1xuICBjb25uZWN0ZWRUbyhjb25uZWN0ZWRUbzogRHJvcExpc3RSZWZbXSk6IHRoaXMge1xuICAgIHRoaXMuX3NpYmxpbmdzID0gY29ubmVjdGVkVG8uc2xpY2UoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBvcmllbnRhdGlvbiBvZiB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gb3JpZW50YXRpb24gTmV3IG9yaWVudGF0aW9uIGZvciB0aGUgY29udGFpbmVyLlxuICAgKi9cbiAgd2l0aE9yaWVudGF0aW9uKG9yaWVudGF0aW9uOiBEcm9wTGlzdE9yaWVudGF0aW9uKTogdGhpcyB7XG4gICAgaWYgKG9yaWVudGF0aW9uID09PSAnbWl4ZWQnKSB7XG4gICAgICB0aGlzLl9zb3J0U3RyYXRlZ3kgPSBuZXcgTWl4ZWRTb3J0U3RyYXRlZ3kodGhpcy5fZG9jdW1lbnQsIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBzdHJhdGVneSA9IG5ldyBTaW5nbGVBeGlzU29ydFN0cmF0ZWd5KHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkpO1xuICAgICAgc3RyYXRlZ3kuZGlyZWN0aW9uID0gdGhpcy5fZGlyZWN0aW9uO1xuICAgICAgc3RyYXRlZ3kub3JpZW50YXRpb24gPSBvcmllbnRhdGlvbjtcbiAgICAgIHRoaXMuX3NvcnRTdHJhdGVneSA9IHN0cmF0ZWd5O1xuICAgIH1cbiAgICB0aGlzLl9zb3J0U3RyYXRlZ3kud2l0aEVsZW1lbnRDb250YWluZXIodGhpcy5fY29udGFpbmVyKTtcbiAgICB0aGlzLl9zb3J0U3RyYXRlZ3kud2l0aFNvcnRQcmVkaWNhdGUoKGluZGV4LCBpdGVtKSA9PiB0aGlzLnNvcnRQcmVkaWNhdGUoaW5kZXgsIGl0ZW0sIHRoaXMpKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHdoaWNoIHBhcmVudCBlbGVtZW50cyBhcmUgY2FuIGJlIHNjcm9sbGVkIHdoaWxlIHRoZSB1c2VyIGlzIGRyYWdnaW5nLlxuICAgKiBAcGFyYW0gZWxlbWVudHMgRWxlbWVudHMgdGhhdCBjYW4gYmUgc2Nyb2xsZWQuXG4gICAqL1xuICB3aXRoU2Nyb2xsYWJsZVBhcmVudHMoZWxlbWVudHM6IEhUTUxFbGVtZW50W10pOiB0aGlzIHtcbiAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fY29udGFpbmVyO1xuXG4gICAgLy8gV2UgYWx3YXlzIGFsbG93IHRoZSBjdXJyZW50IGVsZW1lbnQgdG8gYmUgc2Nyb2xsYWJsZVxuICAgIC8vIHNvIHdlIG5lZWQgdG8gZW5zdXJlIHRoYXQgaXQncyBpbiB0aGUgYXJyYXkuXG4gICAgdGhpcy5fc2Nyb2xsYWJsZUVsZW1lbnRzID1cbiAgICAgIGVsZW1lbnRzLmluZGV4T2YoZWxlbWVudCkgPT09IC0xID8gW2VsZW1lbnQsIC4uLmVsZW1lbnRzXSA6IGVsZW1lbnRzLnNsaWNlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ29uZmlndXJlcyB0aGUgZHJvcCBsaXN0IHNvIHRoYXQgYSBkaWZmZXJlbnQgZWxlbWVudCBpcyB1c2VkIGFzIHRoZSBjb250YWluZXIgZm9yIHRoZVxuICAgKiBkcmFnZ2VkIGl0ZW1zLiBUaGlzIGlzIHVzZWZ1bCBmb3IgdGhlIGNhc2VzIHdoZW4gb25lIG1pZ2h0IG5vdCBoYXZlIGNvbnRyb2wgb3ZlciB0aGVcbiAgICogZnVsbCBET00gdGhhdCBzZXRzIHVwIHRoZSBkcmFnZ2luZy5cbiAgICogTm90ZSB0aGF0IHRoZSBhbHRlcm5hdGUgY29udGFpbmVyIG5lZWRzIHRvIGJlIGEgZGVzY2VuZGFudCBvZiB0aGUgZHJvcCBsaXN0LlxuICAgKiBAcGFyYW0gY29udGFpbmVyIE5ldyBlbGVtZW50IGNvbnRhaW5lciB0byBiZSBhc3NpZ25lZC5cbiAgICovXG4gIHdpdGhFbGVtZW50Q29udGFpbmVyKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQpOiB0aGlzIHtcbiAgICBpZiAoY29udGFpbmVyID09PSB0aGlzLl9jb250YWluZXIpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNvbnN0IGVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KHRoaXMuZWxlbWVudCk7XG5cbiAgICBpZiAoXG4gICAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJlxuICAgICAgY29udGFpbmVyICE9PSBlbGVtZW50ICYmXG4gICAgICAhZWxlbWVudC5jb250YWlucyhjb250YWluZXIpXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdJbnZhbGlkIERPTSBzdHJ1Y3R1cmUgZm9yIGRyb3AgbGlzdC4gQWx0ZXJuYXRlIGNvbnRhaW5lciBlbGVtZW50IG11c3QgYmUgYSBkZXNjZW5kYW50IG9mIHRoZSBkcm9wIGxpc3QuJyxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3Qgb2xkQ29udGFpbmVySW5kZXggPSB0aGlzLl9zY3JvbGxhYmxlRWxlbWVudHMuaW5kZXhPZih0aGlzLl9jb250YWluZXIpO1xuICAgIGNvbnN0IG5ld0NvbnRhaW5lckluZGV4ID0gdGhpcy5fc2Nyb2xsYWJsZUVsZW1lbnRzLmluZGV4T2YoY29udGFpbmVyKTtcblxuICAgIGlmIChvbGRDb250YWluZXJJbmRleCA+IC0xKSB7XG4gICAgICB0aGlzLl9zY3JvbGxhYmxlRWxlbWVudHMuc3BsaWNlKG9sZENvbnRhaW5lckluZGV4LCAxKTtcbiAgICB9XG5cbiAgICBpZiAobmV3Q29udGFpbmVySW5kZXggPiAtMSkge1xuICAgICAgdGhpcy5fc2Nyb2xsYWJsZUVsZW1lbnRzLnNwbGljZShuZXdDb250YWluZXJJbmRleCwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3NvcnRTdHJhdGVneSkge1xuICAgICAgdGhpcy5fc29ydFN0cmF0ZWd5LndpdGhFbGVtZW50Q29udGFpbmVyKGNvbnRhaW5lcik7XG4gICAgfVxuXG4gICAgdGhpcy5fY2FjaGVkU2hhZG93Um9vdCA9IG51bGw7XG4gICAgdGhpcy5fc2Nyb2xsYWJsZUVsZW1lbnRzLnVuc2hpZnQoY29udGFpbmVyKTtcbiAgICB0aGlzLl9jb250YWluZXIgPSBjb250YWluZXI7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgc2Nyb2xsYWJsZSBwYXJlbnRzIHRoYXQgYXJlIHJlZ2lzdGVyZWQgd2l0aCB0aGlzIGRyb3AgY29udGFpbmVyLiAqL1xuICBnZXRTY3JvbGxhYmxlUGFyZW50cygpOiByZWFkb25seSBIVE1MRWxlbWVudFtdIHtcbiAgICByZXR1cm4gdGhpcy5fc2Nyb2xsYWJsZUVsZW1lbnRzO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpZ3VyZXMgb3V0IHRoZSBpbmRleCBvZiBhbiBpdGVtIGluIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gd2hvc2UgaW5kZXggc2hvdWxkIGJlIGRldGVybWluZWQuXG4gICAqL1xuICBnZXRJdGVtSW5kZXgoaXRlbTogRHJhZ1JlZik6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX2lzRHJhZ2dpbmdcbiAgICAgID8gdGhpcy5fc29ydFN0cmF0ZWd5LmdldEl0ZW1JbmRleChpdGVtKVxuICAgICAgOiB0aGlzLl9kcmFnZ2FibGVzLmluZGV4T2YoaXRlbSk7XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0aGUgbGlzdCBpcyBhYmxlIHRvIHJlY2VpdmUgdGhlIGl0ZW0gdGhhdFxuICAgKiBpcyBjdXJyZW50bHkgYmVpbmcgZHJhZ2dlZCBpbnNpZGUgYSBjb25uZWN0ZWQgZHJvcCBsaXN0LlxuICAgKi9cbiAgaXNSZWNlaXZpbmcoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2FjdGl2ZVNpYmxpbmdzLnNpemUgPiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIFNvcnRzIGFuIGl0ZW0gaW5zaWRlIHRoZSBjb250YWluZXIgYmFzZWQgb24gaXRzIHBvc2l0aW9uLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRvIGJlIHNvcnRlZC5cbiAgICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKiBAcGFyYW0gcG9pbnRlckRlbHRhIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgcG9pbnRlciBpcyBtb3ZpbmcgYWxvbmcgZWFjaCBheGlzLlxuICAgKi9cbiAgX3NvcnRJdGVtKFxuICAgIGl0ZW06IERyYWdSZWYsXG4gICAgcG9pbnRlclg6IG51bWJlcixcbiAgICBwb2ludGVyWTogbnVtYmVyLFxuICAgIHBvaW50ZXJEZWx0YToge3g6IG51bWJlcjsgeTogbnVtYmVyfSxcbiAgKTogdm9pZCB7XG4gICAgLy8gRG9uJ3Qgc29ydCB0aGUgaXRlbSBpZiBzb3J0aW5nIGlzIGRpc2FibGVkIG9yIGl0J3Mgb3V0IG9mIHJhbmdlLlxuICAgIGlmIChcbiAgICAgIHRoaXMuc29ydGluZ0Rpc2FibGVkIHx8XG4gICAgICAhdGhpcy5fZG9tUmVjdCB8fFxuICAgICAgIWlzUG9pbnRlck5lYXJEb21SZWN0KHRoaXMuX2RvbVJlY3QsIERST1BfUFJPWElNSVRZX1RIUkVTSE9MRCwgcG9pbnRlclgsIHBvaW50ZXJZKVxuICAgICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX3NvcnRTdHJhdGVneS5zb3J0KGl0ZW0sIHBvaW50ZXJYLCBwb2ludGVyWSwgcG9pbnRlckRlbHRhKTtcblxuICAgIGlmIChyZXN1bHQpIHtcbiAgICAgIHRoaXMuc29ydGVkLm5leHQoe1xuICAgICAgICBwcmV2aW91c0luZGV4OiByZXN1bHQucHJldmlvdXNJbmRleCxcbiAgICAgICAgY3VycmVudEluZGV4OiByZXN1bHQuY3VycmVudEluZGV4LFxuICAgICAgICBjb250YWluZXI6IHRoaXMsXG4gICAgICAgIGl0ZW0sXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIHVzZXIncyBwb2ludGVyIGlzIGNsb3NlIHRvIHRoZSBlZGdlcyBvZiBlaXRoZXIgdGhlXG4gICAqIHZpZXdwb3J0IG9yIHRoZSBkcm9wIGxpc3QgYW5kIHN0YXJ0cyB0aGUgYXV0by1zY3JvbGwgc2VxdWVuY2UuXG4gICAqIEBwYXJhbSBwb2ludGVyWCBVc2VyJ3MgcG9pbnRlciBwb3NpdGlvbiBhbG9uZyB0aGUgeCBheGlzLlxuICAgKiBAcGFyYW0gcG9pbnRlclkgVXNlcidzIHBvaW50ZXIgcG9zaXRpb24gYWxvbmcgdGhlIHkgYXhpcy5cbiAgICovXG4gIF9zdGFydFNjcm9sbGluZ0lmTmVjZXNzYXJ5KHBvaW50ZXJYOiBudW1iZXIsIHBvaW50ZXJZOiBudW1iZXIpIHtcbiAgICBpZiAodGhpcy5hdXRvU2Nyb2xsRGlzYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgc2Nyb2xsTm9kZTogSFRNTEVsZW1lbnQgfCBXaW5kb3cgfCB1bmRlZmluZWQ7XG4gICAgbGV0IHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLk5PTkU7XG4gICAgbGV0IGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5OT05FO1xuXG4gICAgLy8gQ2hlY2sgd2hldGhlciB3ZSBzaG91bGQgc3RhcnQgc2Nyb2xsaW5nIGFueSBvZiB0aGUgcGFyZW50IGNvbnRhaW5lcnMuXG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLnBvc2l0aW9ucy5mb3JFYWNoKChwb3NpdGlvbiwgZWxlbWVudCkgPT4ge1xuICAgICAgLy8gV2UgaGF2ZSBzcGVjaWFsIGhhbmRsaW5nIGZvciB0aGUgYGRvY3VtZW50YCBiZWxvdy4gQWxzbyB0aGlzIHdvdWxkIGJlXG4gICAgICAvLyBuaWNlciB3aXRoIGEgIGZvci4uLm9mIGxvb3AsIGJ1dCBpdCByZXF1aXJlcyBjaGFuZ2luZyBhIGNvbXBpbGVyIGZsYWcuXG4gICAgICBpZiAoZWxlbWVudCA9PT0gdGhpcy5fZG9jdW1lbnQgfHwgIXBvc2l0aW9uLmNsaWVudFJlY3QgfHwgc2Nyb2xsTm9kZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChpc1BvaW50ZXJOZWFyRG9tUmVjdChwb3NpdGlvbi5jbGllbnRSZWN0LCBEUk9QX1BST1hJTUlUWV9USFJFU0hPTEQsIHBvaW50ZXJYLCBwb2ludGVyWSkpIHtcbiAgICAgICAgW3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uLCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uXSA9IGdldEVsZW1lbnRTY3JvbGxEaXJlY3Rpb25zKFxuICAgICAgICAgIGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgcG9zaXRpb24uY2xpZW50UmVjdCxcbiAgICAgICAgICB0aGlzLl9kaXJlY3Rpb24sXG4gICAgICAgICAgcG9pbnRlclgsXG4gICAgICAgICAgcG9pbnRlclksXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uIHx8IGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24pIHtcbiAgICAgICAgICBzY3JvbGxOb2RlID0gZWxlbWVudCBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gT3RoZXJ3aXNlIGNoZWNrIGlmIHdlIGNhbiBzdGFydCBzY3JvbGxpbmcgdGhlIHZpZXdwb3J0LlxuICAgIGlmICghdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gJiYgIWhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24pIHtcbiAgICAgIGNvbnN0IHt3aWR0aCwgaGVpZ2h0fSA9IHRoaXMuX3ZpZXdwb3J0UnVsZXIuZ2V0Vmlld3BvcnRTaXplKCk7XG4gICAgICBjb25zdCBkb21SZWN0ID0ge1xuICAgICAgICB3aWR0aCxcbiAgICAgICAgaGVpZ2h0LFxuICAgICAgICB0b3A6IDAsXG4gICAgICAgIHJpZ2h0OiB3aWR0aCxcbiAgICAgICAgYm90dG9tOiBoZWlnaHQsXG4gICAgICAgIGxlZnQ6IDAsXG4gICAgICB9IGFzIERPTVJlY3Q7XG4gICAgICB2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IGdldFZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uKGRvbVJlY3QsIHBvaW50ZXJZKTtcbiAgICAgIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPSBnZXRIb3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKGRvbVJlY3QsIHBvaW50ZXJYKTtcbiAgICAgIHNjcm9sbE5vZGUgPSB3aW5kb3c7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgc2Nyb2xsTm9kZSAmJlxuICAgICAgKHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uICE9PSB0aGlzLl92ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiB8fFxuICAgICAgICBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uICE9PSB0aGlzLl9ob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uIHx8XG4gICAgICAgIHNjcm9sbE5vZGUgIT09IHRoaXMuX3Njcm9sbE5vZGUpXG4gICAgKSB7XG4gICAgICB0aGlzLl92ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiA9IHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uO1xuICAgICAgdGhpcy5faG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb247XG4gICAgICB0aGlzLl9zY3JvbGxOb2RlID0gc2Nyb2xsTm9kZTtcblxuICAgICAgaWYgKCh2ZXJ0aWNhbFNjcm9sbERpcmVjdGlvbiB8fCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKSAmJiBzY3JvbGxOb2RlKSB7XG4gICAgICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcih0aGlzLl9zdGFydFNjcm9sbEludGVydmFsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3N0b3BTY3JvbGxpbmcoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogU3RvcHMgYW55IGN1cnJlbnRseS1ydW5uaW5nIGF1dG8tc2Nyb2xsIHNlcXVlbmNlcy4gKi9cbiAgX3N0b3BTY3JvbGxpbmcoKSB7XG4gICAgdGhpcy5fc3RvcFNjcm9sbFRpbWVycy5uZXh0KCk7XG4gIH1cblxuICAvKiogU3RhcnRzIHRoZSBkcmFnZ2luZyBzZXF1ZW5jZSB3aXRoaW4gdGhlIGxpc3QuICovXG4gIHByaXZhdGUgX2RyYWdnaW5nU3RhcnRlZCgpIHtcbiAgICBjb25zdCBzdHlsZXMgPSB0aGlzLl9jb250YWluZXIuc3R5bGUgYXMgRHJhZ0NTU1N0eWxlRGVjbGFyYXRpb247XG4gICAgdGhpcy5iZWZvcmVTdGFydGVkLm5leHQoKTtcbiAgICB0aGlzLl9pc0RyYWdnaW5nID0gdHJ1ZTtcblxuICAgIGlmIChcbiAgICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmXG4gICAgICAvLyBQcmV2ZW50IHRoZSBjaGVjayBmcm9tIHJ1bm5pbmcgb24gYXBwcyBub3QgdXNpbmcgYW4gYWx0ZXJuYXRlIGNvbnRhaW5lci4gSWRlYWxseSB3ZVxuICAgICAgLy8gd291bGQgYWx3YXlzIHJ1biBpdCwgYnV0IGludHJvZHVjaW5nIGl0IGF0IHRoaXMgc3RhZ2Ugd291bGQgYmUgYSBicmVha2luZyBjaGFuZ2UuXG4gICAgICB0aGlzLl9jb250YWluZXIgIT09IGNvZXJjZUVsZW1lbnQodGhpcy5lbGVtZW50KVxuICAgICkge1xuICAgICAgZm9yIChjb25zdCBkcmFnIG9mIHRoaXMuX2RyYWdnYWJsZXMpIHtcbiAgICAgICAgaWYgKCFkcmFnLmlzRHJhZ2dpbmcoKSAmJiBkcmFnLmdldFZpc2libGVFbGVtZW50KCkucGFyZW50Tm9kZSAhPT0gdGhpcy5fY29udGFpbmVyKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgJ0ludmFsaWQgRE9NIHN0cnVjdHVyZSBmb3IgZHJvcCBsaXN0LiBBbGwgaXRlbXMgbXVzdCBiZSBwbGFjZWQgZGlyZWN0bHkgaW5zaWRlIG9mIHRoZSBlbGVtZW50IGNvbnRhaW5lci4nLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBXZSBuZWVkIHRvIGRpc2FibGUgc2Nyb2xsIHNuYXBwaW5nIHdoaWxlIHRoZSB1c2VyIGlzIGRyYWdnaW5nLCBiZWNhdXNlIGl0IGJyZWFrcyBhdXRvbWF0aWNcbiAgICAvLyBzY3JvbGxpbmcuIFRoZSBicm93c2VyIHNlZW1zIHRvIHJvdW5kIHRoZSB2YWx1ZSBiYXNlZCBvbiB0aGUgc25hcHBpbmcgcG9pbnRzIHdoaWNoIG1lYW5zXG4gICAgLy8gdGhhdCB3ZSBjYW4ndCBpbmNyZW1lbnQvZGVjcmVtZW50IHRoZSBzY3JvbGwgcG9zaXRpb24uXG4gICAgdGhpcy5faW5pdGlhbFNjcm9sbFNuYXAgPSBzdHlsZXMubXNTY3JvbGxTbmFwVHlwZSB8fCBzdHlsZXMuc2Nyb2xsU25hcFR5cGUgfHwgJyc7XG4gICAgc3R5bGVzLnNjcm9sbFNuYXBUeXBlID0gc3R5bGVzLm1zU2Nyb2xsU25hcFR5cGUgPSAnbm9uZSc7XG4gICAgdGhpcy5fc29ydFN0cmF0ZWd5LnN0YXJ0KHRoaXMuX2RyYWdnYWJsZXMpO1xuICAgIHRoaXMuX2NhY2hlUGFyZW50UG9zaXRpb25zKCk7XG4gICAgdGhpcy5fdmlld3BvcnRTY3JvbGxTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9saXN0ZW5Ub1Njcm9sbEV2ZW50cygpO1xuICB9XG5cbiAgLyoqIENhY2hlcyB0aGUgcG9zaXRpb25zIG9mIHRoZSBjb25maWd1cmVkIHNjcm9sbGFibGUgcGFyZW50cy4gKi9cbiAgcHJpdmF0ZSBfY2FjaGVQYXJlbnRQb3NpdGlvbnMoKSB7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLmNhY2hlKHRoaXMuX3Njcm9sbGFibGVFbGVtZW50cyk7XG5cbiAgICAvLyBUaGUgbGlzdCBlbGVtZW50IGlzIGFsd2F5cyBpbiB0aGUgYHNjcm9sbGFibGVFbGVtZW50c2BcbiAgICAvLyBzbyB3ZSBjYW4gdGFrZSBhZHZhbnRhZ2Ugb2YgdGhlIGNhY2hlZCBgRE9NUmVjdGAuXG4gICAgdGhpcy5fZG9tUmVjdCA9IHRoaXMuX3BhcmVudFBvc2l0aW9ucy5wb3NpdGlvbnMuZ2V0KHRoaXMuX2NvbnRhaW5lcikhLmNsaWVudFJlY3QhO1xuICB9XG5cbiAgLyoqIFJlc2V0cyB0aGUgY29udGFpbmVyIHRvIGl0cyBpbml0aWFsIHN0YXRlLiAqL1xuICBwcml2YXRlIF9yZXNldCgpIHtcbiAgICB0aGlzLl9pc0RyYWdnaW5nID0gZmFsc2U7XG4gICAgY29uc3Qgc3R5bGVzID0gdGhpcy5fY29udGFpbmVyLnN0eWxlIGFzIERyYWdDU1NTdHlsZURlY2xhcmF0aW9uO1xuICAgIHN0eWxlcy5zY3JvbGxTbmFwVHlwZSA9IHN0eWxlcy5tc1Njcm9sbFNuYXBUeXBlID0gdGhpcy5faW5pdGlhbFNjcm9sbFNuYXA7XG5cbiAgICB0aGlzLl9zaWJsaW5ncy5mb3JFYWNoKHNpYmxpbmcgPT4gc2libGluZy5fc3RvcFJlY2VpdmluZyh0aGlzKSk7XG4gICAgdGhpcy5fc29ydFN0cmF0ZWd5LnJlc2V0KCk7XG4gICAgdGhpcy5fc3RvcFNjcm9sbGluZygpO1xuICAgIHRoaXMuX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLmNsZWFyKCk7XG4gIH1cblxuICAvKiogU3RhcnRzIHRoZSBpbnRlcnZhbCB0aGF0J2xsIGF1dG8tc2Nyb2xsIHRoZSBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9zdGFydFNjcm9sbEludGVydmFsID0gKCkgPT4ge1xuICAgIHRoaXMuX3N0b3BTY3JvbGxpbmcoKTtcblxuICAgIGludGVydmFsKDAsIGFuaW1hdGlvbkZyYW1lU2NoZWR1bGVyKVxuICAgICAgLnBpcGUodGFrZVVudGlsKHRoaXMuX3N0b3BTY3JvbGxUaW1lcnMpKVxuICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLl9zY3JvbGxOb2RlO1xuICAgICAgICBjb25zdCBzY3JvbGxTdGVwID0gdGhpcy5hdXRvU2Nyb2xsU3RlcDtcblxuICAgICAgICBpZiAodGhpcy5fdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPT09IEF1dG9TY3JvbGxWZXJ0aWNhbERpcmVjdGlvbi5VUCkge1xuICAgICAgICAgIG5vZGUuc2Nyb2xsQnkoMCwgLXNjcm9sbFN0ZXApO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX3ZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID09PSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uRE9XTikge1xuICAgICAgICAgIG5vZGUuc2Nyb2xsQnkoMCwgc2Nyb2xsU3RlcCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5faG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9PT0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTEVGVCkge1xuICAgICAgICAgIG5vZGUuc2Nyb2xsQnkoLXNjcm9sbFN0ZXAsIDApO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2hvcml6b250YWxTY3JvbGxEaXJlY3Rpb24gPT09IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLlJJR0hUKSB7XG4gICAgICAgICAgbm9kZS5zY3JvbGxCeShzY3JvbGxTdGVwLCAwKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSB1c2VyJ3MgcG9pbnRlciBpcyBwb3NpdGlvbmVkIG92ZXIgdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHggUG9pbnRlciBwb3NpdGlvbiBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0geSBQb2ludGVyIHBvc2l0aW9uIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqL1xuICBfaXNPdmVyQ29udGFpbmVyKHg6IG51bWJlciwgeTogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2RvbVJlY3QgIT0gbnVsbCAmJiBpc0luc2lkZUNsaWVudFJlY3QodGhpcy5fZG9tUmVjdCwgeCwgeSk7XG4gIH1cblxuICAvKipcbiAgICogRmlndXJlcyBvdXQgd2hldGhlciBhbiBpdGVtIHNob3VsZCBiZSBtb3ZlZCBpbnRvIGEgc2libGluZ1xuICAgKiBkcm9wIGNvbnRhaW5lciwgYmFzZWQgb24gaXRzIGN1cnJlbnQgcG9zaXRpb24uXG4gICAqIEBwYXJhbSBpdGVtIERyYWcgaXRlbSB0aGF0IGlzIGJlaW5nIG1vdmVkLlxuICAgKiBAcGFyYW0geCBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0geSBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKi9cbiAgX2dldFNpYmxpbmdDb250YWluZXJGcm9tUG9zaXRpb24oaXRlbTogRHJhZ1JlZiwgeDogbnVtYmVyLCB5OiBudW1iZXIpOiBEcm9wTGlzdFJlZiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX3NpYmxpbmdzLmZpbmQoc2libGluZyA9PiBzaWJsaW5nLl9jYW5SZWNlaXZlKGl0ZW0sIHgsIHkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgZHJvcCBsaXN0IGNhbiByZWNlaXZlIHRoZSBwYXNzZWQtaW4gaXRlbS5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB0aGF0IGlzIGJlaW5nIGRyYWdnZWQgaW50byB0aGUgbGlzdC5cbiAgICogQHBhcmFtIHggUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHkgUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFkgYXhpcy5cbiAgICovXG4gIF9jYW5SZWNlaXZlKGl0ZW06IERyYWdSZWYsIHg6IG51bWJlciwgeTogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgaWYgKFxuICAgICAgIXRoaXMuX2RvbVJlY3QgfHxcbiAgICAgICFpc0luc2lkZUNsaWVudFJlY3QodGhpcy5fZG9tUmVjdCwgeCwgeSkgfHxcbiAgICAgICF0aGlzLmVudGVyUHJlZGljYXRlKGl0ZW0sIHRoaXMpXG4gICAgKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgZWxlbWVudEZyb21Qb2ludCA9IHRoaXMuX2dldFNoYWRvd1Jvb3QoKS5lbGVtZW50RnJvbVBvaW50KHgsIHkpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcblxuICAgIC8vIElmIHRoZXJlJ3Mgbm8gZWxlbWVudCBhdCB0aGUgcG9pbnRlciBwb3NpdGlvbiwgdGhlblxuICAgIC8vIHRoZSBjbGllbnQgcmVjdCBpcyBwcm9iYWJseSBzY3JvbGxlZCBvdXQgb2YgdGhlIHZpZXcuXG4gICAgaWYgKCFlbGVtZW50RnJvbVBvaW50KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gVGhlIGBET01SZWN0YCwgdGhhdCB3ZSdyZSB1c2luZyB0byBmaW5kIHRoZSBjb250YWluZXIgb3ZlciB3aGljaCB0aGUgdXNlciBpc1xuICAgIC8vIGhvdmVyaW5nLCBkb2Vzbid0IGdpdmUgdXMgYW55IGluZm9ybWF0aW9uIG9uIHdoZXRoZXIgdGhlIGVsZW1lbnQgaGFzIGJlZW4gc2Nyb2xsZWRcbiAgICAvLyBvdXQgb2YgdGhlIHZpZXcgb3Igd2hldGhlciBpdCdzIG92ZXJsYXBwaW5nIHdpdGggb3RoZXIgY29udGFpbmVycy4gVGhpcyBtZWFucyB0aGF0XG4gICAgLy8gd2UgY291bGQgZW5kIHVwIHRyYW5zZmVycmluZyB0aGUgaXRlbSBpbnRvIGEgY29udGFpbmVyIHRoYXQncyBpbnZpc2libGUgb3IgaXMgcG9zaXRpb25lZFxuICAgIC8vIGJlbG93IGFub3RoZXIgb25lLiBXZSB1c2UgdGhlIHJlc3VsdCBmcm9tIGBlbGVtZW50RnJvbVBvaW50YCB0byBnZXQgdGhlIHRvcC1tb3N0IGVsZW1lbnRcbiAgICAvLyBhdCB0aGUgcG9pbnRlciBwb3NpdGlvbiBhbmQgdG8gZmluZCB3aGV0aGVyIGl0J3Mgb25lIG9mIHRoZSBpbnRlcnNlY3RpbmcgZHJvcCBjb250YWluZXJzLlxuICAgIHJldHVybiBlbGVtZW50RnJvbVBvaW50ID09PSB0aGlzLl9jb250YWluZXIgfHwgdGhpcy5fY29udGFpbmVyLmNvbnRhaW5zKGVsZW1lbnRGcm9tUG9pbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCBieSBvbmUgb2YgdGhlIGNvbm5lY3RlZCBkcm9wIGxpc3RzIHdoZW4gYSBkcmFnZ2luZyBzZXF1ZW5jZSBoYXMgc3RhcnRlZC5cbiAgICogQHBhcmFtIHNpYmxpbmcgU2libGluZyBpbiB3aGljaCBkcmFnZ2luZyBoYXMgc3RhcnRlZC5cbiAgICovXG4gIF9zdGFydFJlY2VpdmluZyhzaWJsaW5nOiBEcm9wTGlzdFJlZiwgaXRlbXM6IERyYWdSZWZbXSkge1xuICAgIGNvbnN0IGFjdGl2ZVNpYmxpbmdzID0gdGhpcy5fYWN0aXZlU2libGluZ3M7XG5cbiAgICBpZiAoXG4gICAgICAhYWN0aXZlU2libGluZ3MuaGFzKHNpYmxpbmcpICYmXG4gICAgICBpdGVtcy5ldmVyeShpdGVtID0+IHtcbiAgICAgICAgLy8gTm90ZSB0aGF0IHdlIGhhdmUgdG8gYWRkIGFuIGV4Y2VwdGlvbiB0byB0aGUgYGVudGVyUHJlZGljYXRlYCBmb3IgaXRlbXMgdGhhdCBzdGFydGVkIG9mZlxuICAgICAgICAvLyBpbiB0aGlzIGRyb3AgbGlzdC4gVGhlIGRyYWcgcmVmIGhhcyBsb2dpYyB0aGF0IGFsbG93cyBhbiBpdGVtIHRvIHJldHVybiB0byBpdHMgaW5pdGlhbFxuICAgICAgICAvLyBjb250YWluZXIsIGlmIGl0IGhhcyBsZWZ0IHRoZSBpbml0aWFsIGNvbnRhaW5lciBhbmQgbm9uZSBvZiB0aGUgY29ubmVjdGVkIGNvbnRhaW5lcnNcbiAgICAgICAgLy8gYWxsb3cgaXQgdG8gZW50ZXIuIFNlZSBgRHJhZ1JlZi5fdXBkYXRlQWN0aXZlRHJvcENvbnRhaW5lcmAgZm9yIG1vcmUgY29udGV4dC5cbiAgICAgICAgcmV0dXJuIHRoaXMuZW50ZXJQcmVkaWNhdGUoaXRlbSwgdGhpcykgfHwgdGhpcy5fZHJhZ2dhYmxlcy5pbmRleE9mKGl0ZW0pID4gLTE7XG4gICAgICB9KVxuICAgICkge1xuICAgICAgYWN0aXZlU2libGluZ3MuYWRkKHNpYmxpbmcpO1xuICAgICAgdGhpcy5fY2FjaGVQYXJlbnRQb3NpdGlvbnMoKTtcbiAgICAgIHRoaXMuX2xpc3RlblRvU2Nyb2xsRXZlbnRzKCk7XG4gICAgICB0aGlzLnJlY2VpdmluZ1N0YXJ0ZWQubmV4dCh7XG4gICAgICAgIGluaXRpYXRvcjogc2libGluZyxcbiAgICAgICAgcmVjZWl2ZXI6IHRoaXMsXG4gICAgICAgIGl0ZW1zLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCBieSBhIGNvbm5lY3RlZCBkcm9wIGxpc3Qgd2hlbiBkcmFnZ2luZyBoYXMgc3RvcHBlZC5cbiAgICogQHBhcmFtIHNpYmxpbmcgU2libGluZyB3aG9zZSBkcmFnZ2luZyBoYXMgc3RvcHBlZC5cbiAgICovXG4gIF9zdG9wUmVjZWl2aW5nKHNpYmxpbmc6IERyb3BMaXN0UmVmKSB7XG4gICAgdGhpcy5fYWN0aXZlU2libGluZ3MuZGVsZXRlKHNpYmxpbmcpO1xuICAgIHRoaXMuX3ZpZXdwb3J0U2Nyb2xsU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5yZWNlaXZpbmdTdG9wcGVkLm5leHQoe2luaXRpYXRvcjogc2libGluZywgcmVjZWl2ZXI6IHRoaXN9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydHMgbGlzdGVuaW5nIHRvIHNjcm9sbCBldmVudHMgb24gdGhlIHZpZXdwb3J0LlxuICAgKiBVc2VkIGZvciB1cGRhdGluZyB0aGUgaW50ZXJuYWwgc3RhdGUgb2YgdGhlIGxpc3QuXG4gICAqL1xuICBwcml2YXRlIF9saXN0ZW5Ub1Njcm9sbEV2ZW50cygpIHtcbiAgICB0aGlzLl92aWV3cG9ydFNjcm9sbFN1YnNjcmlwdGlvbiA9IHRoaXMuX2RyYWdEcm9wUmVnaXN0cnlcbiAgICAgIC5zY3JvbGxlZCh0aGlzLl9nZXRTaGFkb3dSb290KCkpXG4gICAgICAuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgICAgaWYgKHRoaXMuaXNEcmFnZ2luZygpKSB7XG4gICAgICAgICAgY29uc3Qgc2Nyb2xsRGlmZmVyZW5jZSA9IHRoaXMuX3BhcmVudFBvc2l0aW9ucy5oYW5kbGVTY3JvbGwoZXZlbnQpO1xuXG4gICAgICAgICAgaWYgKHNjcm9sbERpZmZlcmVuY2UpIHtcbiAgICAgICAgICAgIHRoaXMuX3NvcnRTdHJhdGVneS51cGRhdGVPblNjcm9sbChzY3JvbGxEaWZmZXJlbmNlLnRvcCwgc2Nyb2xsRGlmZmVyZW5jZS5sZWZ0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5pc1JlY2VpdmluZygpKSB7XG4gICAgICAgICAgdGhpcy5fY2FjaGVQYXJlbnRQb3NpdGlvbnMoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGF6aWx5IHJlc29sdmVzIGFuZCByZXR1cm5zIHRoZSBzaGFkb3cgcm9vdCBvZiB0aGUgZWxlbWVudC4gV2UgZG8gdGhpcyBpbiBhIGZ1bmN0aW9uLCByYXRoZXJcbiAgICogdGhhbiBzYXZpbmcgaXQgaW4gcHJvcGVydHkgZGlyZWN0bHkgb24gaW5pdCwgYmVjYXVzZSB3ZSB3YW50IHRvIHJlc29sdmUgaXQgYXMgbGF0ZSBhcyBwb3NzaWJsZVxuICAgKiBpbiBvcmRlciB0byBlbnN1cmUgdGhhdCB0aGUgZWxlbWVudCBoYXMgYmVlbiBtb3ZlZCBpbnRvIHRoZSBzaGFkb3cgRE9NLiBEb2luZyBpdCBpbnNpZGUgdGhlXG4gICAqIGNvbnN0cnVjdG9yIG1pZ2h0IGJlIHRvbyBlYXJseSBpZiB0aGUgZWxlbWVudCBpcyBpbnNpZGUgb2Ygc29tZXRoaW5nIGxpa2UgYG5nRm9yYCBvciBgbmdJZmAuXG4gICAqL1xuICBwcml2YXRlIF9nZXRTaGFkb3dSb290KCk6IFJvb3ROb2RlIHtcbiAgICBpZiAoIXRoaXMuX2NhY2hlZFNoYWRvd1Jvb3QpIHtcbiAgICAgIGNvbnN0IHNoYWRvd1Jvb3QgPSBfZ2V0U2hhZG93Um9vdCh0aGlzLl9jb250YWluZXIpO1xuICAgICAgdGhpcy5fY2FjaGVkU2hhZG93Um9vdCA9IChzaGFkb3dSb290IHx8IHRoaXMuX2RvY3VtZW50KSBhcyBSb290Tm9kZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fY2FjaGVkU2hhZG93Um9vdDtcbiAgfVxuXG4gIC8qKiBOb3RpZmllcyBhbnkgc2libGluZ3MgdGhhdCBtYXkgcG90ZW50aWFsbHkgcmVjZWl2ZSB0aGUgaXRlbS4gKi9cbiAgcHJpdmF0ZSBfbm90aWZ5UmVjZWl2aW5nU2libGluZ3MoKSB7XG4gICAgY29uc3QgZHJhZ2dlZEl0ZW1zID0gdGhpcy5fc29ydFN0cmF0ZWd5XG4gICAgICAuZ2V0QWN0aXZlSXRlbXNTbmFwc2hvdCgpXG4gICAgICAuZmlsdGVyKGl0ZW0gPT4gaXRlbS5pc0RyYWdnaW5nKCkpO1xuICAgIHRoaXMuX3NpYmxpbmdzLmZvckVhY2goc2libGluZyA9PiBzaWJsaW5nLl9zdGFydFJlY2VpdmluZyh0aGlzLCBkcmFnZ2VkSXRlbXMpKTtcbiAgfVxufVxuXG4vKipcbiAqIEdldHMgd2hldGhlciB0aGUgdmVydGljYWwgYXV0by1zY3JvbGwgZGlyZWN0aW9uIG9mIGEgbm9kZS5cbiAqIEBwYXJhbSBjbGllbnRSZWN0IERpbWVuc2lvbnMgb2YgdGhlIG5vZGUuXG4gKiBAcGFyYW0gcG9pbnRlclkgUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSB5IGF4aXMuXG4gKi9cbmZ1bmN0aW9uIGdldFZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uKGNsaWVudFJlY3Q6IERPTVJlY3QsIHBvaW50ZXJZOiBudW1iZXIpIHtcbiAgY29uc3Qge3RvcCwgYm90dG9tLCBoZWlnaHR9ID0gY2xpZW50UmVjdDtcbiAgY29uc3QgeVRocmVzaG9sZCA9IGhlaWdodCAqIFNDUk9MTF9QUk9YSU1JVFlfVEhSRVNIT0xEO1xuXG4gIGlmIChwb2ludGVyWSA+PSB0b3AgLSB5VGhyZXNob2xkICYmIHBvaW50ZXJZIDw9IHRvcCArIHlUaHJlc2hvbGQpIHtcbiAgICByZXR1cm4gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLlVQO1xuICB9IGVsc2UgaWYgKHBvaW50ZXJZID49IGJvdHRvbSAtIHlUaHJlc2hvbGQgJiYgcG9pbnRlclkgPD0gYm90dG9tICsgeVRocmVzaG9sZCkge1xuICAgIHJldHVybiBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uRE9XTjtcbiAgfVxuXG4gIHJldHVybiBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uTk9ORTtcbn1cblxuLyoqXG4gKiBHZXRzIHdoZXRoZXIgdGhlIGhvcml6b250YWwgYXV0by1zY3JvbGwgZGlyZWN0aW9uIG9mIGEgbm9kZS5cbiAqIEBwYXJhbSBjbGllbnRSZWN0IERpbWVuc2lvbnMgb2YgdGhlIG5vZGUuXG4gKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSB4IGF4aXMuXG4gKi9cbmZ1bmN0aW9uIGdldEhvcml6b250YWxTY3JvbGxEaXJlY3Rpb24oY2xpZW50UmVjdDogRE9NUmVjdCwgcG9pbnRlclg6IG51bWJlcikge1xuICBjb25zdCB7bGVmdCwgcmlnaHQsIHdpZHRofSA9IGNsaWVudFJlY3Q7XG4gIGNvbnN0IHhUaHJlc2hvbGQgPSB3aWR0aCAqIFNDUk9MTF9QUk9YSU1JVFlfVEhSRVNIT0xEO1xuXG4gIGlmIChwb2ludGVyWCA+PSBsZWZ0IC0geFRocmVzaG9sZCAmJiBwb2ludGVyWCA8PSBsZWZ0ICsgeFRocmVzaG9sZCkge1xuICAgIHJldHVybiBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5MRUZUO1xuICB9IGVsc2UgaWYgKHBvaW50ZXJYID49IHJpZ2h0IC0geFRocmVzaG9sZCAmJiBwb2ludGVyWCA8PSByaWdodCArIHhUaHJlc2hvbGQpIHtcbiAgICByZXR1cm4gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uUklHSFQ7XG4gIH1cblxuICByZXR1cm4gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTk9ORTtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBkaXJlY3Rpb25zIGluIHdoaWNoIGFuIGVsZW1lbnQgbm9kZSBzaG91bGQgYmUgc2Nyb2xsZWQsXG4gKiBhc3N1bWluZyB0aGF0IHRoZSB1c2VyJ3MgcG9pbnRlciBpcyBhbHJlYWR5IHdpdGhpbiBpdCBzY3JvbGxhYmxlIHJlZ2lvbi5cbiAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgZm9yIHdoaWNoIHdlIHNob3VsZCBjYWxjdWxhdGUgdGhlIHNjcm9sbCBkaXJlY3Rpb24uXG4gKiBAcGFyYW0gY2xpZW50UmVjdCBCb3VuZGluZyBjbGllbnQgcmVjdGFuZ2xlIG9mIHRoZSBlbGVtZW50LlxuICogQHBhcmFtIGRpcmVjdGlvbiBMYXlvdXQgZGlyZWN0aW9uIG9mIHRoZSBkcm9wIGxpc3QuXG4gKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSB4IGF4aXMuXG4gKiBAcGFyYW0gcG9pbnRlclkgUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIGFsb25nIHRoZSB5IGF4aXMuXG4gKi9cbmZ1bmN0aW9uIGdldEVsZW1lbnRTY3JvbGxEaXJlY3Rpb25zKFxuICBlbGVtZW50OiBIVE1MRWxlbWVudCxcbiAgY2xpZW50UmVjdDogRE9NUmVjdCxcbiAgZGlyZWN0aW9uOiBEaXJlY3Rpb24sXG4gIHBvaW50ZXJYOiBudW1iZXIsXG4gIHBvaW50ZXJZOiBudW1iZXIsXG4pOiBbQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLCBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbl0ge1xuICBjb25zdCBjb21wdXRlZFZlcnRpY2FsID0gZ2V0VmVydGljYWxTY3JvbGxEaXJlY3Rpb24oY2xpZW50UmVjdCwgcG9pbnRlclkpO1xuICBjb25zdCBjb21wdXRlZEhvcml6b250YWwgPSBnZXRIb3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uKGNsaWVudFJlY3QsIHBvaW50ZXJYKTtcbiAgbGV0IHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLk5PTkU7XG4gIGxldCBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTk9ORTtcblxuICAvLyBOb3RlIHRoYXQgd2UgaGVyZSB3ZSBkbyBzb21lIGV4dHJhIGNoZWNrcyBmb3Igd2hldGhlciB0aGUgZWxlbWVudCBpcyBhY3R1YWxseSBzY3JvbGxhYmxlIGluXG4gIC8vIGEgY2VydGFpbiBkaXJlY3Rpb24gYW5kIHdlIG9ubHkgYXNzaWduIHRoZSBzY3JvbGwgZGlyZWN0aW9uIGlmIGl0IGlzLiBXZSBkbyB0aGlzIHNvIHRoYXQgd2VcbiAgLy8gY2FuIGFsbG93IG90aGVyIGVsZW1lbnRzIHRvIGJlIHNjcm9sbGVkLCBpZiB0aGUgY3VycmVudCBlbGVtZW50IGNhbid0IGJlIHNjcm9sbGVkIGFueW1vcmUuXG4gIC8vIFRoaXMgYWxsb3dzIHVzIHRvIGhhbmRsZSBjYXNlcyB3aGVyZSB0aGUgc2Nyb2xsIHJlZ2lvbnMgb2YgdHdvIHNjcm9sbGFibGUgZWxlbWVudHMgb3ZlcmxhcC5cbiAgaWYgKGNvbXB1dGVkVmVydGljYWwpIHtcbiAgICBjb25zdCBzY3JvbGxUb3AgPSBlbGVtZW50LnNjcm9sbFRvcDtcblxuICAgIGlmIChjb21wdXRlZFZlcnRpY2FsID09PSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uVVApIHtcbiAgICAgIGlmIChzY3JvbGxUb3AgPiAwKSB7XG4gICAgICAgIHZlcnRpY2FsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbFZlcnRpY2FsRGlyZWN0aW9uLlVQO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZWxlbWVudC5zY3JvbGxIZWlnaHQgLSBzY3JvbGxUb3AgPiBlbGVtZW50LmNsaWVudEhlaWdodCkge1xuICAgICAgdmVydGljYWxTY3JvbGxEaXJlY3Rpb24gPSBBdXRvU2Nyb2xsVmVydGljYWxEaXJlY3Rpb24uRE9XTjtcbiAgICB9XG4gIH1cblxuICBpZiAoY29tcHV0ZWRIb3Jpem9udGFsKSB7XG4gICAgY29uc3Qgc2Nyb2xsTGVmdCA9IGVsZW1lbnQuc2Nyb2xsTGVmdDtcblxuICAgIGlmIChkaXJlY3Rpb24gPT09ICdydGwnKSB7XG4gICAgICBpZiAoY29tcHV0ZWRIb3Jpem9udGFsID09PSBBdXRvU2Nyb2xsSG9yaXpvbnRhbERpcmVjdGlvbi5SSUdIVCkge1xuICAgICAgICAvLyBJbiBSVEwgYHNjcm9sbExlZnRgIHdpbGwgYmUgbmVnYXRpdmUgd2hlbiBzY3JvbGxlZC5cbiAgICAgICAgaWYgKHNjcm9sbExlZnQgPCAwKSB7XG4gICAgICAgICAgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLlJJR0hUO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGVsZW1lbnQuc2Nyb2xsV2lkdGggKyBzY3JvbGxMZWZ0ID4gZWxlbWVudC5jbGllbnRXaWR0aCkge1xuICAgICAgICBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTEVGVDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGNvbXB1dGVkSG9yaXpvbnRhbCA9PT0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTEVGVCkge1xuICAgICAgICBpZiAoc2Nyb2xsTGVmdCA+IDApIHtcbiAgICAgICAgICBob3Jpem9udGFsU2Nyb2xsRGlyZWN0aW9uID0gQXV0b1Njcm9sbEhvcml6b250YWxEaXJlY3Rpb24uTEVGVDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChlbGVtZW50LnNjcm9sbFdpZHRoIC0gc2Nyb2xsTGVmdCA+IGVsZW1lbnQuY2xpZW50V2lkdGgpIHtcbiAgICAgICAgaG9yaXpvbnRhbFNjcm9sbERpcmVjdGlvbiA9IEF1dG9TY3JvbGxIb3Jpem9udGFsRGlyZWN0aW9uLlJJR0hUO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBbdmVydGljYWxTY3JvbGxEaXJlY3Rpb24sIGhvcml6b250YWxTY3JvbGxEaXJlY3Rpb25dO1xufVxuIl19