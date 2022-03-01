/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { normalizePassiveListenerOptions, _getEventTarget, _getShadowRoot, } from '@angular/cdk/platform';
import { coerceBooleanProperty, coerceElement } from '@angular/cdk/coercion';
import { isFakeMousedownFromScreenReader, isFakeTouchstartFromScreenReader } from '@angular/cdk/a11y';
import { Subscription, Subject } from 'rxjs';
import { combineTransforms, extendStyles, toggleNativeDragInteractions, toggleVisibility, } from './drag-styling';
import { getTransformTransitionDurationInMs } from './transition-duration';
import { getMutableClientRect, adjustClientRect } from './client-rect';
import { ParentPositionTracker } from './parent-position-tracker';
import { deepCloneNode } from './clone-node';
/** Options that can be used to bind a passive event listener. */
const passiveEventListenerOptions = normalizePassiveListenerOptions({ passive: true });
/** Options that can be used to bind an active event listener. */
const activeEventListenerOptions = normalizePassiveListenerOptions({ passive: false });
/**
 * Time in milliseconds for which to ignore mouse events, after
 * receiving a touch event. Used to avoid doing double work for
 * touch devices where the browser fires fake mouse events, in
 * addition to touch events.
 */
const MOUSE_EVENT_IGNORE_TIME = 800;
/** Inline styles to be set as `!important` while dragging. */
const dragImportantProperties = new Set([
    // Needs to be important, because some `mat-table` sets `position: sticky !important`. See #22781.
    'position',
]);
/**
 * Reference to a draggable item. Used to manipulate or dispose of the item.
 */
export class DragRef {
    constructor(element, _config, _document, _ngZone, _viewportRuler, _dragDropRegistry) {
        this._config = _config;
        this._document = _document;
        this._ngZone = _ngZone;
        this._viewportRuler = _viewportRuler;
        this._dragDropRegistry = _dragDropRegistry;
        /**
         * CSS `transform` applied to the element when it isn't being dragged. We need a
         * passive transform in order for the dragged element to retain its new position
         * after the user has stopped dragging and because we need to know the relative
         * position in case they start dragging again. This corresponds to `element.style.transform`.
         */
        this._passiveTransform = { x: 0, y: 0 };
        /** CSS `transform` that is applied to the element while it's being dragged. */
        this._activeTransform = { x: 0, y: 0 };
        /**
         * Whether the dragging sequence has been started. Doesn't
         * necessarily mean that the element has been moved.
         */
        this._hasStartedDragging = false;
        /** Emits when the item is being moved. */
        this._moveEvents = new Subject();
        /** Subscription to pointer movement events. */
        this._pointerMoveSubscription = Subscription.EMPTY;
        /** Subscription to the event that is dispatched when the user lifts their pointer. */
        this._pointerUpSubscription = Subscription.EMPTY;
        /** Subscription to the viewport being scrolled. */
        this._scrollSubscription = Subscription.EMPTY;
        /** Subscription to the viewport being resized. */
        this._resizeSubscription = Subscription.EMPTY;
        /** Cached reference to the boundary element. */
        this._boundaryElement = null;
        /** Whether the native dragging interactions have been enabled on the root element. */
        this._nativeInteractionsEnabled = true;
        /** Elements that can be used to drag the draggable item. */
        this._handles = [];
        /** Registered handles that are currently disabled. */
        this._disabledHandles = new Set();
        /** Layout direction of the item. */
        this._direction = 'ltr';
        /**
         * Amount of milliseconds to wait after the user has put their
         * pointer down before starting to drag the element.
         */
        this.dragStartDelay = 0;
        this._disabled = false;
        /** Emits as the drag sequence is being prepared. */
        this.beforeStarted = new Subject();
        /** Emits when the user starts dragging the item. */
        this.started = new Subject();
        /** Emits when the user has released a drag item, before any animations have started. */
        this.released = new Subject();
        /** Emits when the user stops dragging an item in the container. */
        this.ended = new Subject();
        /** Emits when the user has moved the item into a new container. */
        this.entered = new Subject();
        /** Emits when the user removes the item its container by dragging it into another container. */
        this.exited = new Subject();
        /** Emits when the user drops the item inside a container. */
        this.dropped = new Subject();
        /**
         * Emits as the user is dragging the item. Use with caution,
         * because this event will fire for every pixel that the user has dragged.
         */
        this.moved = this._moveEvents;
        /** Handler for the `mousedown`/`touchstart` events. */
        this._pointerDown = (event) => {
            this.beforeStarted.next();
            // Delegate the event based on whether it started from a handle or the element itself.
            if (this._handles.length) {
                const targetHandle = this._handles.find(handle => {
                    return event.target && (event.target === handle || handle.contains(event.target));
                });
                if (targetHandle && !this._disabledHandles.has(targetHandle) && !this.disabled) {
                    this._initializeDragSequence(targetHandle, event);
                }
            }
            else if (!this.disabled) {
                this._initializeDragSequence(this._rootElement, event);
            }
        };
        /** Handler that is invoked when the user moves their pointer after they've initiated a drag. */
        this._pointerMove = (event) => {
            const pointerPosition = this._getPointerPositionOnPage(event);
            if (!this._hasStartedDragging) {
                const distanceX = Math.abs(pointerPosition.x - this._pickupPositionOnPage.x);
                const distanceY = Math.abs(pointerPosition.y - this._pickupPositionOnPage.y);
                const isOverThreshold = distanceX + distanceY >= this._config.dragStartThreshold;
                // Only start dragging after the user has moved more than the minimum distance in either
                // direction. Note that this is preferrable over doing something like `skip(minimumDistance)`
                // in the `pointerMove` subscription, because we're not guaranteed to have one move event
                // per pixel of movement (e.g. if the user moves their pointer quickly).
                if (isOverThreshold) {
                    const isDelayElapsed = Date.now() >= this._dragStartTime + this._getDragStartDelay(event);
                    const container = this._dropContainer;
                    if (!isDelayElapsed) {
                        this._endDragSequence(event);
                        return;
                    }
                    // Prevent other drag sequences from starting while something in the container is still
                    // being dragged. This can happen while we're waiting for the drop animation to finish
                    // and can cause errors, because some elements might still be moving around.
                    if (!container || (!container.isDragging() && !container.isReceiving())) {
                        // Prevent the default action as soon as the dragging sequence is considered as
                        // "started" since waiting for the next event can allow the device to begin scrolling.
                        event.preventDefault();
                        this._hasStartedDragging = true;
                        this._ngZone.run(() => this._startDragSequence(event));
                    }
                }
                return;
            }
            // We prevent the default action down here so that we know that dragging has started. This is
            // important for touch devices where doing this too early can unnecessarily block scrolling,
            // if there's a dragging delay.
            event.preventDefault();
            const constrainedPointerPosition = this._getConstrainedPointerPosition(pointerPosition);
            this._hasMoved = true;
            this._lastKnownPointerPosition = pointerPosition;
            this._updatePointerDirectionDelta(constrainedPointerPosition);
            if (this._dropContainer) {
                this._updateActiveDropContainer(constrainedPointerPosition, pointerPosition);
            }
            else {
                const activeTransform = this._activeTransform;
                activeTransform.x =
                    constrainedPointerPosition.x - this._pickupPositionOnPage.x + this._passiveTransform.x;
                activeTransform.y =
                    constrainedPointerPosition.y - this._pickupPositionOnPage.y + this._passiveTransform.y;
                this._applyRootElementTransform(activeTransform.x, activeTransform.y);
            }
            // Since this event gets fired for every pixel while dragging, we only
            // want to fire it if the consumer opted into it. Also we have to
            // re-enter the zone because we run all of the events on the outside.
            if (this._moveEvents.observers.length) {
                this._ngZone.run(() => {
                    this._moveEvents.next({
                        source: this,
                        pointerPosition: constrainedPointerPosition,
                        event,
                        distance: this._getDragDistance(constrainedPointerPosition),
                        delta: this._pointerDirectionDelta,
                    });
                });
            }
        };
        /** Handler that is invoked when the user lifts their pointer up, after initiating a drag. */
        this._pointerUp = (event) => {
            this._endDragSequence(event);
        };
        this.withRootElement(element).withParent(_config.parentDragRef || null);
        this._parentPositions = new ParentPositionTracker(_document);
        _dragDropRegistry.registerDragItem(this);
    }
    /** Whether starting to drag this element is disabled. */
    get disabled() {
        return this._disabled || !!(this._dropContainer && this._dropContainer.disabled);
    }
    set disabled(value) {
        const newValue = coerceBooleanProperty(value);
        if (newValue !== this._disabled) {
            this._disabled = newValue;
            this._toggleNativeDragInteractions();
            this._handles.forEach(handle => toggleNativeDragInteractions(handle, newValue));
        }
    }
    /**
     * Returns the element that is being used as a placeholder
     * while the current element is being dragged.
     */
    getPlaceholderElement() {
        return this._placeholder;
    }
    /** Returns the root draggable element. */
    getRootElement() {
        return this._rootElement;
    }
    /**
     * Gets the currently-visible element that represents the drag item.
     * While dragging this is the placeholder, otherwise it's the root element.
     */
    getVisibleElement() {
        return this.isDragging() ? this.getPlaceholderElement() : this.getRootElement();
    }
    /** Registers the handles that can be used to drag the element. */
    withHandles(handles) {
        this._handles = handles.map(handle => coerceElement(handle));
        this._handles.forEach(handle => toggleNativeDragInteractions(handle, this.disabled));
        this._toggleNativeDragInteractions();
        // Delete any lingering disabled handles that may have been destroyed. Note that we re-create
        // the set, rather than iterate over it and filter out the destroyed handles, because while
        // the ES spec allows for sets to be modified while they're being iterated over, some polyfills
        // use an array internally which may throw an error.
        const disabledHandles = new Set();
        this._disabledHandles.forEach(handle => {
            if (this._handles.indexOf(handle) > -1) {
                disabledHandles.add(handle);
            }
        });
        this._disabledHandles = disabledHandles;
        return this;
    }
    /**
     * Registers the template that should be used for the drag preview.
     * @param template Template that from which to stamp out the preview.
     */
    withPreviewTemplate(template) {
        this._previewTemplate = template;
        return this;
    }
    /**
     * Registers the template that should be used for the drag placeholder.
     * @param template Template that from which to stamp out the placeholder.
     */
    withPlaceholderTemplate(template) {
        this._placeholderTemplate = template;
        return this;
    }
    /**
     * Sets an alternate drag root element. The root element is the element that will be moved as
     * the user is dragging. Passing an alternate root element is useful when trying to enable
     * dragging on an element that you might not have access to.
     */
    withRootElement(rootElement) {
        const element = coerceElement(rootElement);
        if (element !== this._rootElement) {
            if (this._rootElement) {
                this._removeRootElementListeners(this._rootElement);
            }
            this._ngZone.runOutsideAngular(() => {
                element.addEventListener('mousedown', this._pointerDown, activeEventListenerOptions);
                element.addEventListener('touchstart', this._pointerDown, passiveEventListenerOptions);
                // Usually this isn't necessary since the we prevent the default action in `pointerDown`,
                // but some cases like dragging of links can slip through (see #24403).
                element.addEventListener('dragstart', preventDefault, activeEventListenerOptions);
            });
            this._initialTransform = undefined;
            this._rootElement = element;
        }
        if (typeof SVGElement !== 'undefined' && this._rootElement instanceof SVGElement) {
            this._ownerSVGElement = this._rootElement.ownerSVGElement;
        }
        return this;
    }
    /**
     * Element to which the draggable's position will be constrained.
     */
    withBoundaryElement(boundaryElement) {
        this._boundaryElement = boundaryElement ? coerceElement(boundaryElement) : null;
        this._resizeSubscription.unsubscribe();
        if (boundaryElement) {
            this._resizeSubscription = this._viewportRuler
                .change(10)
                .subscribe(() => this._containInsideBoundaryOnResize());
        }
        return this;
    }
    /** Sets the parent ref that the ref is nested in.  */
    withParent(parent) {
        this._parentDragRef = parent;
        return this;
    }
    /** Removes the dragging functionality from the DOM element. */
    dispose() {
        this._removeRootElementListeners(this._rootElement);
        // Do this check before removing from the registry since it'll
        // stop being considered as dragged once it is removed.
        if (this.isDragging()) {
            // Since we move out the element to the end of the body while it's being
            // dragged, we have to make sure that it's removed if it gets destroyed.
            this._rootElement?.remove();
        }
        this._anchor?.remove();
        this._destroyPreview();
        this._destroyPlaceholder();
        this._dragDropRegistry.removeDragItem(this);
        this._removeSubscriptions();
        this.beforeStarted.complete();
        this.started.complete();
        this.released.complete();
        this.ended.complete();
        this.entered.complete();
        this.exited.complete();
        this.dropped.complete();
        this._moveEvents.complete();
        this._handles = [];
        this._disabledHandles.clear();
        this._dropContainer = undefined;
        this._resizeSubscription.unsubscribe();
        this._parentPositions.clear();
        this._boundaryElement =
            this._rootElement =
                this._ownerSVGElement =
                    this._placeholderTemplate =
                        this._previewTemplate =
                            this._anchor =
                                this._parentDragRef =
                                    null;
    }
    /** Checks whether the element is currently being dragged. */
    isDragging() {
        return this._hasStartedDragging && this._dragDropRegistry.isDragging(this);
    }
    /** Resets a standalone drag item to its initial position. */
    reset() {
        this._rootElement.style.transform = this._initialTransform || '';
        this._activeTransform = { x: 0, y: 0 };
        this._passiveTransform = { x: 0, y: 0 };
    }
    /**
     * Sets a handle as disabled. While a handle is disabled, it'll capture and interrupt dragging.
     * @param handle Handle element that should be disabled.
     */
    disableHandle(handle) {
        if (!this._disabledHandles.has(handle) && this._handles.indexOf(handle) > -1) {
            this._disabledHandles.add(handle);
            toggleNativeDragInteractions(handle, true);
        }
    }
    /**
     * Enables a handle, if it has been disabled.
     * @param handle Handle element to be enabled.
     */
    enableHandle(handle) {
        if (this._disabledHandles.has(handle)) {
            this._disabledHandles.delete(handle);
            toggleNativeDragInteractions(handle, this.disabled);
        }
    }
    /** Sets the layout direction of the draggable item. */
    withDirection(direction) {
        this._direction = direction;
        return this;
    }
    /** Sets the container that the item is part of. */
    _withDropContainer(container) {
        this._dropContainer = container;
    }
    /**
     * Gets the current position in pixels the draggable outside of a drop container.
     */
    getFreeDragPosition() {
        const position = this.isDragging() ? this._activeTransform : this._passiveTransform;
        return { x: position.x, y: position.y };
    }
    /**
     * Sets the current position in pixels the draggable outside of a drop container.
     * @param value New position to be set.
     */
    setFreeDragPosition(value) {
        this._activeTransform = { x: 0, y: 0 };
        this._passiveTransform.x = value.x;
        this._passiveTransform.y = value.y;
        if (!this._dropContainer) {
            this._applyRootElementTransform(value.x, value.y);
        }
        return this;
    }
    /**
     * Sets the container into which to insert the preview element.
     * @param value Container into which to insert the preview.
     */
    withPreviewContainer(value) {
        this._previewContainer = value;
        return this;
    }
    /** Updates the item's sort order based on the last-known pointer position. */
    _sortFromLastPointerPosition() {
        const position = this._lastKnownPointerPosition;
        if (position && this._dropContainer) {
            this._updateActiveDropContainer(this._getConstrainedPointerPosition(position), position);
        }
    }
    /** Unsubscribes from the global subscriptions. */
    _removeSubscriptions() {
        this._pointerMoveSubscription.unsubscribe();
        this._pointerUpSubscription.unsubscribe();
        this._scrollSubscription.unsubscribe();
    }
    /** Destroys the preview element and its ViewRef. */
    _destroyPreview() {
        this._preview?.remove();
        this._previewRef?.destroy();
        this._preview = this._previewRef = null;
    }
    /** Destroys the placeholder element and its ViewRef. */
    _destroyPlaceholder() {
        this._placeholder?.remove();
        this._placeholderRef?.destroy();
        this._placeholder = this._placeholderRef = null;
    }
    /**
     * Clears subscriptions and stops the dragging sequence.
     * @param event Browser event object that ended the sequence.
     */
    _endDragSequence(event) {
        // Note that here we use `isDragging` from the service, rather than from `this`.
        // The difference is that the one from the service reflects whether a dragging sequence
        // has been initiated, whereas the one on `this` includes whether the user has passed
        // the minimum dragging threshold.
        if (!this._dragDropRegistry.isDragging(this)) {
            return;
        }
        this._removeSubscriptions();
        this._dragDropRegistry.stopDragging(this);
        this._toggleNativeDragInteractions();
        if (this._handles) {
            this._rootElement.style.webkitTapHighlightColor =
                this._rootElementTapHighlight;
        }
        if (!this._hasStartedDragging) {
            return;
        }
        this.released.next({ source: this, event });
        if (this._dropContainer) {
            // Stop scrolling immediately, instead of waiting for the animation to finish.
            this._dropContainer._stopScrolling();
            this._animatePreviewToPlaceholder().then(() => {
                this._cleanupDragArtifacts(event);
                this._cleanupCachedDimensions();
                this._dragDropRegistry.stopDragging(this);
            });
        }
        else {
            // Convert the active transform into a passive one. This means that next time
            // the user starts dragging the item, its position will be calculated relatively
            // to the new passive transform.
            this._passiveTransform.x = this._activeTransform.x;
            const pointerPosition = this._getPointerPositionOnPage(event);
            this._passiveTransform.y = this._activeTransform.y;
            this._ngZone.run(() => {
                this.ended.next({
                    source: this,
                    distance: this._getDragDistance(pointerPosition),
                    dropPoint: pointerPosition,
                    event,
                });
            });
            this._cleanupCachedDimensions();
            this._dragDropRegistry.stopDragging(this);
        }
    }
    /** Starts the dragging sequence. */
    _startDragSequence(event) {
        if (isTouchEvent(event)) {
            this._lastTouchEventTime = Date.now();
        }
        this._toggleNativeDragInteractions();
        const dropContainer = this._dropContainer;
        if (dropContainer) {
            const element = this._rootElement;
            const parent = element.parentNode;
            const placeholder = (this._placeholder = this._createPlaceholderElement());
            const anchor = (this._anchor = this._anchor || this._document.createComment(''));
            // Needs to happen before the root element is moved.
            const shadowRoot = this._getShadowRoot();
            // Insert an anchor node so that we can restore the element's position in the DOM.
            parent.insertBefore(anchor, element);
            // There's no risk of transforms stacking when inside a drop container so
            // we can keep the initial transform up to date any time dragging starts.
            this._initialTransform = element.style.transform || '';
            // Create the preview after the initial transform has
            // been cached, because it can be affected by the transform.
            this._preview = this._createPreviewElement();
            // We move the element out at the end of the body and we make it hidden, because keeping it in
            // place will throw off the consumer's `:last-child` selectors. We can't remove the element
            // from the DOM completely, because iOS will stop firing all subsequent events in the chain.
            toggleVisibility(element, false, dragImportantProperties);
            this._document.body.appendChild(parent.replaceChild(placeholder, element));
            this._getPreviewInsertionPoint(parent, shadowRoot).appendChild(this._preview);
            this.started.next({ source: this, event }); // Emit before notifying the container.
            dropContainer.start();
            this._initialContainer = dropContainer;
            this._initialIndex = dropContainer.getItemIndex(this);
        }
        else {
            this.started.next({ source: this, event });
            this._initialContainer = this._initialIndex = undefined;
        }
        // Important to run after we've called `start` on the parent container
        // so that it has had time to resolve its scrollable parents.
        this._parentPositions.cache(dropContainer ? dropContainer.getScrollableParents() : []);
    }
    /**
     * Sets up the different variables and subscriptions
     * that will be necessary for the dragging sequence.
     * @param referenceElement Element that started the drag sequence.
     * @param event Browser event object that started the sequence.
     */
    _initializeDragSequence(referenceElement, event) {
        // Stop propagation if the item is inside another
        // draggable so we don't start multiple drag sequences.
        if (this._parentDragRef) {
            event.stopPropagation();
        }
        const isDragging = this.isDragging();
        const isTouchSequence = isTouchEvent(event);
        const isAuxiliaryMouseButton = !isTouchSequence && event.button !== 0;
        const rootElement = this._rootElement;
        const target = _getEventTarget(event);
        const isSyntheticEvent = !isTouchSequence &&
            this._lastTouchEventTime &&
            this._lastTouchEventTime + MOUSE_EVENT_IGNORE_TIME > Date.now();
        const isFakeEvent = isTouchSequence
            ? isFakeTouchstartFromScreenReader(event)
            : isFakeMousedownFromScreenReader(event);
        // If the event started from an element with the native HTML drag&drop, it'll interfere
        // with our own dragging (e.g. `img` tags do it by default). Prevent the default action
        // to stop it from happening. Note that preventing on `dragstart` also seems to work, but
        // it's flaky and it fails if the user drags it away quickly. Also note that we only want
        // to do this for `mousedown` since doing the same for `touchstart` will stop any `click`
        // events from firing on touch devices.
        if (target && target.draggable && event.type === 'mousedown') {
            event.preventDefault();
        }
        // Abort if the user is already dragging or is using a mouse button other than the primary one.
        if (isDragging || isAuxiliaryMouseButton || isSyntheticEvent || isFakeEvent) {
            return;
        }
        // If we've got handles, we need to disable the tap highlight on the entire root element,
        // otherwise iOS will still add it, even though all the drag interactions on the handle
        // are disabled.
        if (this._handles.length) {
            const rootStyles = rootElement.style;
            this._rootElementTapHighlight = rootStyles.webkitTapHighlightColor || '';
            rootStyles.webkitTapHighlightColor = 'transparent';
        }
        this._hasStartedDragging = this._hasMoved = false;
        // Avoid multiple subscriptions and memory leaks when multi touch
        // (isDragging check above isn't enough because of possible temporal and/or dimensional delays)
        this._removeSubscriptions();
        this._pointerMoveSubscription = this._dragDropRegistry.pointerMove.subscribe(this._pointerMove);
        this._pointerUpSubscription = this._dragDropRegistry.pointerUp.subscribe(this._pointerUp);
        this._scrollSubscription = this._dragDropRegistry
            .scrolled(this._getShadowRoot())
            .subscribe(scrollEvent => this._updateOnScroll(scrollEvent));
        if (this._boundaryElement) {
            this._boundaryRect = getMutableClientRect(this._boundaryElement);
        }
        // If we have a custom preview we can't know ahead of time how large it'll be so we position
        // it next to the cursor. The exception is when the consumer has opted into making the preview
        // the same size as the root element, in which case we do know the size.
        const previewTemplate = this._previewTemplate;
        this._pickupPositionInElement =
            previewTemplate && previewTemplate.template && !previewTemplate.matchSize
                ? { x: 0, y: 0 }
                : this._getPointerPositionInElement(referenceElement, event);
        const pointerPosition = (this._pickupPositionOnPage =
            this._lastKnownPointerPosition =
                this._getPointerPositionOnPage(event));
        this._pointerDirectionDelta = { x: 0, y: 0 };
        this._pointerPositionAtLastDirectionChange = { x: pointerPosition.x, y: pointerPosition.y };
        this._dragStartTime = Date.now();
        this._dragDropRegistry.startDragging(this, event);
    }
    /** Cleans up the DOM artifacts that were added to facilitate the element being dragged. */
    _cleanupDragArtifacts(event) {
        // Restore the element's visibility and insert it at its old position in the DOM.
        // It's important that we maintain the position, because moving the element around in the DOM
        // can throw off `NgFor` which does smart diffing and re-creates elements only when necessary,
        // while moving the existing elements in all other cases.
        toggleVisibility(this._rootElement, true, dragImportantProperties);
        this._anchor.parentNode.replaceChild(this._rootElement, this._anchor);
        this._destroyPreview();
        this._destroyPlaceholder();
        this._boundaryRect = this._previewRect = this._initialTransform = undefined;
        // Re-enter the NgZone since we bound `document` events on the outside.
        this._ngZone.run(() => {
            const container = this._dropContainer;
            const currentIndex = container.getItemIndex(this);
            const pointerPosition = this._getPointerPositionOnPage(event);
            const distance = this._getDragDistance(pointerPosition);
            const isPointerOverContainer = container._isOverContainer(pointerPosition.x, pointerPosition.y);
            this.ended.next({ source: this, distance, dropPoint: pointerPosition, event });
            this.dropped.next({
                item: this,
                currentIndex,
                previousIndex: this._initialIndex,
                container: container,
                previousContainer: this._initialContainer,
                isPointerOverContainer,
                distance,
                dropPoint: pointerPosition,
                event,
            });
            container.drop(this, currentIndex, this._initialIndex, this._initialContainer, isPointerOverContainer, distance, pointerPosition);
            this._dropContainer = this._initialContainer;
        });
    }
    /**
     * Updates the item's position in its drop container, or moves it
     * into a new one, depending on its current drag position.
     */
    _updateActiveDropContainer({ x, y }, { x: rawX, y: rawY }) {
        // Drop container that draggable has been moved into.
        let newContainer = this._initialContainer._getSiblingContainerFromPosition(this, x, y);
        // If we couldn't find a new container to move the item into, and the item has left its
        // initial container, check whether the it's over the initial container. This handles the
        // case where two containers are connected one way and the user tries to undo dragging an
        // item into a new container.
        if (!newContainer &&
            this._dropContainer !== this._initialContainer &&
            this._initialContainer._isOverContainer(x, y)) {
            newContainer = this._initialContainer;
        }
        if (newContainer && newContainer !== this._dropContainer) {
            this._ngZone.run(() => {
                // Notify the old container that the item has left.
                this.exited.next({ item: this, container: this._dropContainer });
                this._dropContainer.exit(this);
                // Notify the new container that the item has entered.
                this._dropContainer = newContainer;
                this._dropContainer.enter(this, x, y, newContainer === this._initialContainer &&
                    // If we're re-entering the initial container and sorting is disabled,
                    // put item the into its starting index to begin with.
                    newContainer.sortingDisabled
                    ? this._initialIndex
                    : undefined);
                this.entered.next({
                    item: this,
                    container: newContainer,
                    currentIndex: newContainer.getItemIndex(this),
                });
            });
        }
        // Dragging may have been interrupted as a result of the events above.
        if (this.isDragging()) {
            this._dropContainer._startScrollingIfNecessary(rawX, rawY);
            this._dropContainer._sortItem(this, x, y, this._pointerDirectionDelta);
            this._applyPreviewTransform(x - this._pickupPositionInElement.x, y - this._pickupPositionInElement.y);
        }
    }
    /**
     * Creates the element that will be rendered next to the user's pointer
     * and will be used as a preview of the element that is being dragged.
     */
    _createPreviewElement() {
        const previewConfig = this._previewTemplate;
        const previewClass = this.previewClass;
        const previewTemplate = previewConfig ? previewConfig.template : null;
        let preview;
        if (previewTemplate && previewConfig) {
            // Measure the element before we've inserted the preview
            // since the insertion could throw off the measurement.
            const rootRect = previewConfig.matchSize ? this._rootElement.getBoundingClientRect() : null;
            const viewRef = previewConfig.viewContainer.createEmbeddedView(previewTemplate, previewConfig.context);
            viewRef.detectChanges();
            preview = getRootNode(viewRef, this._document);
            this._previewRef = viewRef;
            if (previewConfig.matchSize) {
                matchElementSize(preview, rootRect);
            }
            else {
                preview.style.transform = getTransform(this._pickupPositionOnPage.x, this._pickupPositionOnPage.y);
            }
        }
        else {
            const element = this._rootElement;
            preview = deepCloneNode(element);
            matchElementSize(preview, element.getBoundingClientRect());
            if (this._initialTransform) {
                preview.style.transform = this._initialTransform;
            }
        }
        extendStyles(preview.style, {
            // It's important that we disable the pointer events on the preview, because
            // it can throw off the `document.elementFromPoint` calls in the `CdkDropList`.
            'pointer-events': 'none',
            // We have to reset the margin, because it can throw off positioning relative to the viewport.
            'margin': '0',
            'position': 'fixed',
            'top': '0',
            'left': '0',
            'z-index': `${this._config.zIndex || 1000}`,
        }, dragImportantProperties);
        toggleNativeDragInteractions(preview, false);
        preview.classList.add('cdk-drag-preview');
        preview.setAttribute('dir', this._direction);
        if (previewClass) {
            if (Array.isArray(previewClass)) {
                previewClass.forEach(className => preview.classList.add(className));
            }
            else {
                preview.classList.add(previewClass);
            }
        }
        return preview;
    }
    /**
     * Animates the preview element from its current position to the location of the drop placeholder.
     * @returns Promise that resolves when the animation completes.
     */
    _animatePreviewToPlaceholder() {
        // If the user hasn't moved yet, the transitionend event won't fire.
        if (!this._hasMoved) {
            return Promise.resolve();
        }
        const placeholderRect = this._placeholder.getBoundingClientRect();
        // Apply the class that adds a transition to the preview.
        this._preview.classList.add('cdk-drag-animating');
        // Move the preview to the placeholder position.
        this._applyPreviewTransform(placeholderRect.left, placeholderRect.top);
        // If the element doesn't have a `transition`, the `transitionend` event won't fire. Since
        // we need to trigger a style recalculation in order for the `cdk-drag-animating` class to
        // apply its style, we take advantage of the available info to figure out whether we need to
        // bind the event in the first place.
        const duration = getTransformTransitionDurationInMs(this._preview);
        if (duration === 0) {
            return Promise.resolve();
        }
        return this._ngZone.runOutsideAngular(() => {
            return new Promise(resolve => {
                const handler = ((event) => {
                    if (!event ||
                        (_getEventTarget(event) === this._preview && event.propertyName === 'transform')) {
                        this._preview?.removeEventListener('transitionend', handler);
                        resolve();
                        clearTimeout(timeout);
                    }
                });
                // If a transition is short enough, the browser might not fire the `transitionend` event.
                // Since we know how long it's supposed to take, add a timeout with a 50% buffer that'll
                // fire if the transition hasn't completed when it was supposed to.
                const timeout = setTimeout(handler, duration * 1.5);
                this._preview.addEventListener('transitionend', handler);
            });
        });
    }
    /** Creates an element that will be shown instead of the current element while dragging. */
    _createPlaceholderElement() {
        const placeholderConfig = this._placeholderTemplate;
        const placeholderTemplate = placeholderConfig ? placeholderConfig.template : null;
        let placeholder;
        if (placeholderTemplate) {
            this._placeholderRef = placeholderConfig.viewContainer.createEmbeddedView(placeholderTemplate, placeholderConfig.context);
            this._placeholderRef.detectChanges();
            placeholder = getRootNode(this._placeholderRef, this._document);
        }
        else {
            placeholder = deepCloneNode(this._rootElement);
        }
        // Stop pointer events on the preview so the user can't
        // interact with it while the preview is animating.
        placeholder.style.pointerEvents = 'none';
        placeholder.classList.add('cdk-drag-placeholder');
        return placeholder;
    }
    /**
     * Figures out the coordinates at which an element was picked up.
     * @param referenceElement Element that initiated the dragging.
     * @param event Event that initiated the dragging.
     */
    _getPointerPositionInElement(referenceElement, event) {
        const elementRect = this._rootElement.getBoundingClientRect();
        const handleElement = referenceElement === this._rootElement ? null : referenceElement;
        const referenceRect = handleElement ? handleElement.getBoundingClientRect() : elementRect;
        const point = isTouchEvent(event) ? event.targetTouches[0] : event;
        const scrollPosition = this._getViewportScrollPosition();
        const x = point.pageX - referenceRect.left - scrollPosition.left;
        const y = point.pageY - referenceRect.top - scrollPosition.top;
        return {
            x: referenceRect.left - elementRect.left + x,
            y: referenceRect.top - elementRect.top + y,
        };
    }
    /** Determines the point of the page that was touched by the user. */
    _getPointerPositionOnPage(event) {
        const scrollPosition = this._getViewportScrollPosition();
        const point = isTouchEvent(event)
            ? // `touches` will be empty for start/end events so we have to fall back to `changedTouches`.
                // Also note that on real devices we're guaranteed for either `touches` or `changedTouches`
                // to have a value, but Firefox in device emulation mode has a bug where both can be empty
                // for `touchstart` and `touchend` so we fall back to a dummy object in order to avoid
                // throwing an error. The value returned here will be incorrect, but since this only
                // breaks inside a developer tool and the value is only used for secondary information,
                // we can get away with it. See https://bugzilla.mozilla.org/show_bug.cgi?id=1615824.
                event.touches[0] || event.changedTouches[0] || { pageX: 0, pageY: 0 }
            : event;
        const x = point.pageX - scrollPosition.left;
        const y = point.pageY - scrollPosition.top;
        // if dragging SVG element, try to convert from the screen coordinate system to the SVG
        // coordinate system
        if (this._ownerSVGElement) {
            const svgMatrix = this._ownerSVGElement.getScreenCTM();
            if (svgMatrix) {
                const svgPoint = this._ownerSVGElement.createSVGPoint();
                svgPoint.x = x;
                svgPoint.y = y;
                return svgPoint.matrixTransform(svgMatrix.inverse());
            }
        }
        return { x, y };
    }
    /** Gets the pointer position on the page, accounting for any position constraints. */
    _getConstrainedPointerPosition(point) {
        const dropContainerLock = this._dropContainer ? this._dropContainer.lockAxis : null;
        let { x, y } = this.constrainPosition ? this.constrainPosition(point, this) : point;
        if (this.lockAxis === 'x' || dropContainerLock === 'x') {
            y = this._pickupPositionOnPage.y;
        }
        else if (this.lockAxis === 'y' || dropContainerLock === 'y') {
            x = this._pickupPositionOnPage.x;
        }
        if (this._boundaryRect) {
            const { x: pickupX, y: pickupY } = this._pickupPositionInElement;
            const boundaryRect = this._boundaryRect;
            const { width: previewWidth, height: previewHeight } = this._getPreviewRect();
            const minY = boundaryRect.top + pickupY;
            const maxY = boundaryRect.bottom - (previewHeight - pickupY);
            const minX = boundaryRect.left + pickupX;
            const maxX = boundaryRect.right - (previewWidth - pickupX);
            x = clamp(x, minX, maxX);
            y = clamp(y, minY, maxY);
        }
        return { x, y };
    }
    /** Updates the current drag delta, based on the user's current pointer position on the page. */
    _updatePointerDirectionDelta(pointerPositionOnPage) {
        const { x, y } = pointerPositionOnPage;
        const delta = this._pointerDirectionDelta;
        const positionSinceLastChange = this._pointerPositionAtLastDirectionChange;
        // Amount of pixels the user has dragged since the last time the direction changed.
        const changeX = Math.abs(x - positionSinceLastChange.x);
        const changeY = Math.abs(y - positionSinceLastChange.y);
        // Because we handle pointer events on a per-pixel basis, we don't want the delta
        // to change for every pixel, otherwise anything that depends on it can look erratic.
        // To make the delta more consistent, we track how much the user has moved since the last
        // delta change and we only update it after it has reached a certain threshold.
        if (changeX > this._config.pointerDirectionChangeThreshold) {
            delta.x = x > positionSinceLastChange.x ? 1 : -1;
            positionSinceLastChange.x = x;
        }
        if (changeY > this._config.pointerDirectionChangeThreshold) {
            delta.y = y > positionSinceLastChange.y ? 1 : -1;
            positionSinceLastChange.y = y;
        }
        return delta;
    }
    /** Toggles the native drag interactions, based on how many handles are registered. */
    _toggleNativeDragInteractions() {
        if (!this._rootElement || !this._handles) {
            return;
        }
        const shouldEnable = this._handles.length > 0 || !this.isDragging();
        if (shouldEnable !== this._nativeInteractionsEnabled) {
            this._nativeInteractionsEnabled = shouldEnable;
            toggleNativeDragInteractions(this._rootElement, shouldEnable);
        }
    }
    /** Removes the manually-added event listeners from the root element. */
    _removeRootElementListeners(element) {
        element.removeEventListener('mousedown', this._pointerDown, activeEventListenerOptions);
        element.removeEventListener('touchstart', this._pointerDown, passiveEventListenerOptions);
        element.removeEventListener('dragstart', preventDefault, activeEventListenerOptions);
    }
    /**
     * Applies a `transform` to the root element, taking into account any existing transforms on it.
     * @param x New transform value along the X axis.
     * @param y New transform value along the Y axis.
     */
    _applyRootElementTransform(x, y) {
        const transform = getTransform(x, y);
        const styles = this._rootElement.style;
        // Cache the previous transform amount only after the first drag sequence, because
        // we don't want our own transforms to stack on top of each other.
        // Should be excluded none because none + translate3d(x, y, x) is invalid css
        if (this._initialTransform == null) {
            this._initialTransform =
                styles.transform && styles.transform != 'none' ? styles.transform : '';
        }
        // Preserve the previous `transform` value, if there was one. Note that we apply our own
        // transform before the user's, because things like rotation can affect which direction
        // the element will be translated towards.
        styles.transform = combineTransforms(transform, this._initialTransform);
    }
    /**
     * Applies a `transform` to the preview, taking into account any existing transforms on it.
     * @param x New transform value along the X axis.
     * @param y New transform value along the Y axis.
     */
    _applyPreviewTransform(x, y) {
        // Only apply the initial transform if the preview is a clone of the original element, otherwise
        // it could be completely different and the transform might not make sense anymore.
        const initialTransform = this._previewTemplate?.template ? undefined : this._initialTransform;
        const transform = getTransform(x, y);
        this._preview.style.transform = combineTransforms(transform, initialTransform);
    }
    /**
     * Gets the distance that the user has dragged during the current drag sequence.
     * @param currentPosition Current position of the user's pointer.
     */
    _getDragDistance(currentPosition) {
        const pickupPosition = this._pickupPositionOnPage;
        if (pickupPosition) {
            return { x: currentPosition.x - pickupPosition.x, y: currentPosition.y - pickupPosition.y };
        }
        return { x: 0, y: 0 };
    }
    /** Cleans up any cached element dimensions that we don't need after dragging has stopped. */
    _cleanupCachedDimensions() {
        this._boundaryRect = this._previewRect = undefined;
        this._parentPositions.clear();
    }
    /**
     * Checks whether the element is still inside its boundary after the viewport has been resized.
     * If not, the position is adjusted so that the element fits again.
     */
    _containInsideBoundaryOnResize() {
        let { x, y } = this._passiveTransform;
        if ((x === 0 && y === 0) || this.isDragging() || !this._boundaryElement) {
            return;
        }
        const boundaryRect = this._boundaryElement.getBoundingClientRect();
        const elementRect = this._rootElement.getBoundingClientRect();
        // It's possible that the element got hidden away after dragging (e.g. by switching to a
        // different tab). Don't do anything in this case so we don't clear the user's position.
        if ((boundaryRect.width === 0 && boundaryRect.height === 0) ||
            (elementRect.width === 0 && elementRect.height === 0)) {
            return;
        }
        const leftOverflow = boundaryRect.left - elementRect.left;
        const rightOverflow = elementRect.right - boundaryRect.right;
        const topOverflow = boundaryRect.top - elementRect.top;
        const bottomOverflow = elementRect.bottom - boundaryRect.bottom;
        // If the element has become wider than the boundary, we can't
        // do much to make it fit so we just anchor it to the left.
        if (boundaryRect.width > elementRect.width) {
            if (leftOverflow > 0) {
                x += leftOverflow;
            }
            if (rightOverflow > 0) {
                x -= rightOverflow;
            }
        }
        else {
            x = 0;
        }
        // If the element has become taller than the boundary, we can't
        // do much to make it fit so we just anchor it to the top.
        if (boundaryRect.height > elementRect.height) {
            if (topOverflow > 0) {
                y += topOverflow;
            }
            if (bottomOverflow > 0) {
                y -= bottomOverflow;
            }
        }
        else {
            y = 0;
        }
        if (x !== this._passiveTransform.x || y !== this._passiveTransform.y) {
            this.setFreeDragPosition({ y, x });
        }
    }
    /** Gets the drag start delay, based on the event type. */
    _getDragStartDelay(event) {
        const value = this.dragStartDelay;
        if (typeof value === 'number') {
            return value;
        }
        else if (isTouchEvent(event)) {
            return value.touch;
        }
        return value ? value.mouse : 0;
    }
    /** Updates the internal state of the draggable element when scrolling has occurred. */
    _updateOnScroll(event) {
        const scrollDifference = this._parentPositions.handleScroll(event);
        if (scrollDifference) {
            const target = _getEventTarget(event);
            // ClientRect dimensions are based on the scroll position of the page and its parent
            // node so we have to update the cached boundary ClientRect if the user has scrolled.
            if (this._boundaryRect &&
                target !== this._boundaryElement &&
                target.contains(this._boundaryElement)) {
                adjustClientRect(this._boundaryRect, scrollDifference.top, scrollDifference.left);
            }
            this._pickupPositionOnPage.x += scrollDifference.left;
            this._pickupPositionOnPage.y += scrollDifference.top;
            // If we're in free drag mode, we have to update the active transform, because
            // it isn't relative to the viewport like the preview inside a drop list.
            if (!this._dropContainer) {
                this._activeTransform.x -= scrollDifference.left;
                this._activeTransform.y -= scrollDifference.top;
                this._applyRootElementTransform(this._activeTransform.x, this._activeTransform.y);
            }
        }
    }
    /** Gets the scroll position of the viewport. */
    _getViewportScrollPosition() {
        return (this._parentPositions.positions.get(this._document)?.scrollPosition ||
            this._parentPositions.getViewportScrollPosition());
    }
    /**
     * Lazily resolves and returns the shadow root of the element. We do this in a function, rather
     * than saving it in property directly on init, because we want to resolve it as late as possible
     * in order to ensure that the element has been moved into the shadow DOM. Doing it inside the
     * constructor might be too early if the element is inside of something like `ngFor` or `ngIf`.
     */
    _getShadowRoot() {
        if (this._cachedShadowRoot === undefined) {
            this._cachedShadowRoot = _getShadowRoot(this._rootElement);
        }
        return this._cachedShadowRoot;
    }
    /** Gets the element into which the drag preview should be inserted. */
    _getPreviewInsertionPoint(initialParent, shadowRoot) {
        const previewContainer = this._previewContainer || 'global';
        if (previewContainer === 'parent') {
            return initialParent;
        }
        if (previewContainer === 'global') {
            const documentRef = this._document;
            // We can't use the body if the user is in fullscreen mode,
            // because the preview will render under the fullscreen element.
            // TODO(crisbeto): dedupe this with the `FullscreenOverlayContainer` eventually.
            return (shadowRoot ||
                documentRef.fullscreenElement ||
                documentRef.webkitFullscreenElement ||
                documentRef.mozFullScreenElement ||
                documentRef.msFullscreenElement ||
                documentRef.body);
        }
        return coerceElement(previewContainer);
    }
    /** Lazily resolves and returns the dimensions of the preview. */
    _getPreviewRect() {
        // Cache the preview element rect if we haven't cached it already or if
        // we cached it too early before the element dimensions were computed.
        if (!this._previewRect || (!this._previewRect.width && !this._previewRect.height)) {
            this._previewRect = (this._preview || this._rootElement).getBoundingClientRect();
        }
        return this._previewRect;
    }
}
/**
 * Gets a 3d `transform` that can be applied to an element.
 * @param x Desired position of the element along the X axis.
 * @param y Desired position of the element along the Y axis.
 */
function getTransform(x, y) {
    // Round the transforms since some browsers will
    // blur the elements for sub-pixel transforms.
    return `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
}
/** Clamps a value between a minimum and a maximum. */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
/** Determines whether an event is a touch event. */
function isTouchEvent(event) {
    // This function is called for every pixel that the user has dragged so we need it to be
    // as fast as possible. Since we only bind mouse events and touch events, we can assume
    // that if the event's name starts with `t`, it's a touch event.
    return event.type[0] === 't';
}
/**
 * Gets the root HTML element of an embedded view.
 * If the root is not an HTML element it gets wrapped in one.
 */
function getRootNode(viewRef, _document) {
    const rootNodes = viewRef.rootNodes;
    if (rootNodes.length === 1 && rootNodes[0].nodeType === _document.ELEMENT_NODE) {
        return rootNodes[0];
    }
    const wrapper = _document.createElement('div');
    rootNodes.forEach(node => wrapper.appendChild(node));
    return wrapper;
}
/**
 * Matches the target element's size to the source's size.
 * @param target Element that needs to be resized.
 * @param sourceRect Dimensions of the source element.
 */
function matchElementSize(target, sourceRect) {
    target.style.width = `${sourceRect.width}px`;
    target.style.height = `${sourceRect.height}px`;
    target.style.transform = getTransform(sourceRect.left, sourceRect.top);
}
/** Utility to prevent the default action of an event. */
function preventDefault(event) {
    event.preventDefault();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2RyYWctZHJvcC9kcmFnLXJlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFLSCxPQUFPLEVBQ0wsK0JBQStCLEVBQy9CLGVBQWUsRUFDZixjQUFjLEdBQ2YsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQUMscUJBQXFCLEVBQUUsYUFBYSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDM0UsT0FBTyxFQUFDLCtCQUErQixFQUFFLGdDQUFnQyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDcEcsT0FBTyxFQUFDLFlBQVksRUFBRSxPQUFPLEVBQWEsTUFBTSxNQUFNLENBQUM7QUFHdkQsT0FBTyxFQUNMLGlCQUFpQixFQUVqQixZQUFZLEVBQ1osNEJBQTRCLEVBQzVCLGdCQUFnQixHQUNqQixNQUFNLGdCQUFnQixDQUFDO0FBQ3hCLE9BQU8sRUFBQyxrQ0FBa0MsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3pFLE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNyRSxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUNoRSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBdUIzQyxpRUFBaUU7QUFDakUsTUFBTSwyQkFBMkIsR0FBRywrQkFBK0IsQ0FBQyxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0FBRXJGLGlFQUFpRTtBQUNqRSxNQUFNLDBCQUEwQixHQUFHLCtCQUErQixDQUFDLEVBQUMsT0FBTyxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUM7QUFFckY7Ozs7O0dBS0c7QUFDSCxNQUFNLHVCQUF1QixHQUFHLEdBQUcsQ0FBQztBQThCcEMsOERBQThEO0FBQzlELE1BQU0sdUJBQXVCLEdBQUcsSUFB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QyxDQUFDLFFBQVEsS0FBSyxTQUFTLENBQUMsWUFBWSxFQUFFO1FBQzlFLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBZ0IsQ0FBQztLQUNwQztJQUVELE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDL0MsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNyRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQVMsZ0JBQWdCLENBQUMsTUFBbUIsRUFBRSxVQUFzQjtJQUNuRSxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxHQUFHLFVBQVUsQ0FBQyxLQUFLLElBQUksQ0FBQztJQUM3QyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxHQUFHLFVBQVUsQ0FBQyxNQUFNLElBQUksQ0FBQztJQUMvQyxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxZQUFZLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDekUsQ0FBQztBQUVELHlEQUF5RDtBQUN6RCxTQUFTLGNBQWMsQ0FBQyxLQUFZO0lBQ2xDLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUN6QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RW1iZWRkZWRWaWV3UmVmLCBFbGVtZW50UmVmLCBOZ1pvbmUsIFZpZXdDb250YWluZXJSZWYsIFRlbXBsYXRlUmVmfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Vmlld3BvcnRSdWxlcn0gZnJvbSAnQGFuZ3VsYXIvY2RrL3Njcm9sbGluZyc7XG5pbXBvcnQge0RpcmVjdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtcbiAgbm9ybWFsaXplUGFzc2l2ZUxpc3RlbmVyT3B0aW9ucyxcbiAgX2dldEV2ZW50VGFyZ2V0LFxuICBfZ2V0U2hhZG93Um9vdCxcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7Y29lcmNlQm9vbGVhblByb3BlcnR5LCBjb2VyY2VFbGVtZW50fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtpc0Zha2VNb3VzZWRvd25Gcm9tU2NyZWVuUmVhZGVyLCBpc0Zha2VUb3VjaHN0YXJ0RnJvbVNjcmVlblJlYWRlcn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2ExMXknO1xuaW1wb3J0IHtTdWJzY3JpcHRpb24sIFN1YmplY3QsIE9ic2VydmFibGV9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtEcm9wTGlzdFJlZkludGVybmFsIGFzIERyb3BMaXN0UmVmfSBmcm9tICcuL2Ryb3AtbGlzdC1yZWYnO1xuaW1wb3J0IHtEcmFnRHJvcFJlZ2lzdHJ5fSBmcm9tICcuL2RyYWctZHJvcC1yZWdpc3RyeSc7XG5pbXBvcnQge1xuICBjb21iaW5lVHJhbnNmb3JtcyxcbiAgRHJhZ0NTU1N0eWxlRGVjbGFyYXRpb24sXG4gIGV4dGVuZFN0eWxlcyxcbiAgdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucyxcbiAgdG9nZ2xlVmlzaWJpbGl0eSxcbn0gZnJvbSAnLi9kcmFnLXN0eWxpbmcnO1xuaW1wb3J0IHtnZXRUcmFuc2Zvcm1UcmFuc2l0aW9uRHVyYXRpb25Jbk1zfSBmcm9tICcuL3RyYW5zaXRpb24tZHVyYXRpb24nO1xuaW1wb3J0IHtnZXRNdXRhYmxlQ2xpZW50UmVjdCwgYWRqdXN0Q2xpZW50UmVjdH0gZnJvbSAnLi9jbGllbnQtcmVjdCc7XG5pbXBvcnQge1BhcmVudFBvc2l0aW9uVHJhY2tlcn0gZnJvbSAnLi9wYXJlbnQtcG9zaXRpb24tdHJhY2tlcic7XG5pbXBvcnQge2RlZXBDbG9uZU5vZGV9IGZyb20gJy4vY2xvbmUtbm9kZSc7XG5cbi8qKiBPYmplY3QgdGhhdCBjYW4gYmUgdXNlZCB0byBjb25maWd1cmUgdGhlIGJlaGF2aW9yIG9mIERyYWdSZWYuICovXG5leHBvcnQgaW50ZXJmYWNlIERyYWdSZWZDb25maWcge1xuICAvKipcbiAgICogTWluaW11bSBhbW91bnQgb2YgcGl4ZWxzIHRoYXQgdGhlIHVzZXIgc2hvdWxkXG4gICAqIGRyYWcsIGJlZm9yZSB0aGUgQ0RLIGluaXRpYXRlcyBhIGRyYWcgc2VxdWVuY2UuXG4gICAqL1xuICBkcmFnU3RhcnRUaHJlc2hvbGQ6IG51bWJlcjtcblxuICAvKipcbiAgICogQW1vdW50IHRoZSBwaXhlbHMgdGhlIHVzZXIgc2hvdWxkIGRyYWcgYmVmb3JlIHRoZSBDREtcbiAgICogY29uc2lkZXJzIHRoZW0gdG8gaGF2ZSBjaGFuZ2VkIHRoZSBkcmFnIGRpcmVjdGlvbi5cbiAgICovXG4gIHBvaW50ZXJEaXJlY3Rpb25DaGFuZ2VUaHJlc2hvbGQ6IG51bWJlcjtcblxuICAvKiogYHotaW5kZXhgIGZvciB0aGUgYWJzb2x1dGVseS1wb3NpdGlvbmVkIGVsZW1lbnRzIHRoYXQgYXJlIGNyZWF0ZWQgYnkgdGhlIGRyYWcgaXRlbS4gKi9cbiAgekluZGV4PzogbnVtYmVyO1xuXG4gIC8qKiBSZWYgdGhhdCB0aGUgY3VycmVudCBkcmFnIGl0ZW0gaXMgbmVzdGVkIGluLiAqL1xuICBwYXJlbnREcmFnUmVmPzogRHJhZ1JlZjtcbn1cblxuLyoqIE9wdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCB0byBiaW5kIGEgcGFzc2l2ZSBldmVudCBsaXN0ZW5lci4gKi9cbmNvbnN0IHBhc3NpdmVFdmVudExpc3RlbmVyT3B0aW9ucyA9IG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMoe3Bhc3NpdmU6IHRydWV9KTtcblxuLyoqIE9wdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCB0byBiaW5kIGFuIGFjdGl2ZSBldmVudCBsaXN0ZW5lci4gKi9cbmNvbnN0IGFjdGl2ZUV2ZW50TGlzdGVuZXJPcHRpb25zID0gbm9ybWFsaXplUGFzc2l2ZUxpc3RlbmVyT3B0aW9ucyh7cGFzc2l2ZTogZmFsc2V9KTtcblxuLyoqXG4gKiBUaW1lIGluIG1pbGxpc2Vjb25kcyBmb3Igd2hpY2ggdG8gaWdub3JlIG1vdXNlIGV2ZW50cywgYWZ0ZXJcbiAqIHJlY2VpdmluZyBhIHRvdWNoIGV2ZW50LiBVc2VkIHRvIGF2b2lkIGRvaW5nIGRvdWJsZSB3b3JrIGZvclxuICogdG91Y2ggZGV2aWNlcyB3aGVyZSB0aGUgYnJvd3NlciBmaXJlcyBmYWtlIG1vdXNlIGV2ZW50cywgaW5cbiAqIGFkZGl0aW9uIHRvIHRvdWNoIGV2ZW50cy5cbiAqL1xuY29uc3QgTU9VU0VfRVZFTlRfSUdOT1JFX1RJTUUgPSA4MDA7XG5cbi8vIFRPRE8oY3Jpc2JldG8pOiBhZGQgYW4gQVBJIGZvciBtb3ZpbmcgYSBkcmFnZ2FibGUgdXAvZG93biB0aGVcbi8vIGxpc3QgcHJvZ3JhbW1hdGljYWxseS4gVXNlZnVsIGZvciBrZXlib2FyZCBjb250cm9scy5cblxuLyoqXG4gKiBJbnRlcm5hbCBjb21waWxlLXRpbWUtb25seSByZXByZXNlbnRhdGlvbiBvZiBhIGBEcmFnUmVmYC5cbiAqIFVzZWQgdG8gYXZvaWQgY2lyY3VsYXIgaW1wb3J0IGlzc3VlcyBiZXR3ZWVuIHRoZSBgRHJhZ1JlZmAgYW5kIHRoZSBgRHJvcExpc3RSZWZgLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIERyYWdSZWZJbnRlcm5hbCBleHRlbmRzIERyYWdSZWYge31cblxuLyoqIFRlbXBsYXRlIHRoYXQgY2FuIGJlIHVzZWQgdG8gY3JlYXRlIGEgZHJhZyBoZWxwZXIgZWxlbWVudCAoZS5nLiBhIHByZXZpZXcgb3IgYSBwbGFjZWhvbGRlcikuICovXG5pbnRlcmZhY2UgRHJhZ0hlbHBlclRlbXBsYXRlPFQgPSBhbnk+IHtcbiAgdGVtcGxhdGU6IFRlbXBsYXRlUmVmPFQ+IHwgbnVsbDtcbiAgdmlld0NvbnRhaW5lcjogVmlld0NvbnRhaW5lclJlZjtcbiAgY29udGV4dDogVDtcbn1cblxuLyoqIFRlbXBsYXRlIHRoYXQgY2FuIGJlIHVzZWQgdG8gY3JlYXRlIGEgZHJhZyBwcmV2aWV3IGVsZW1lbnQuICovXG5pbnRlcmZhY2UgRHJhZ1ByZXZpZXdUZW1wbGF0ZTxUID0gYW55PiBleHRlbmRzIERyYWdIZWxwZXJUZW1wbGF0ZTxUPiB7XG4gIG1hdGNoU2l6ZT86IGJvb2xlYW47XG59XG5cbi8qKiBQb2ludCBvbiB0aGUgcGFnZSBvciB3aXRoaW4gYW4gZWxlbWVudC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUG9pbnQge1xuICB4OiBudW1iZXI7XG4gIHk6IG51bWJlcjtcbn1cblxuLyoqIElubGluZSBzdHlsZXMgdG8gYmUgc2V0IGFzIGAhaW1wb3J0YW50YCB3aGlsZSBkcmFnZ2luZy4gKi9cbmNvbnN0IGRyYWdJbXBvcnRhbnRQcm9wZXJ0aWVzID0gbmV3IFNldChbXG4gIC8vIE5lZWRzIHRvIGJlIGltcG9ydGFudCwgYmVjYXVzZSBzb21lIGBtYXQtdGFibGVgIHNldHMgYHBvc2l0aW9uOiBzdGlja3kgIWltcG9ydGFudGAuIFNlZSAjMjI3ODEuXG4gICdwb3NpdGlvbicsXG5dKTtcblxuLyoqXG4gKiBQb3NzaWJsZSBwbGFjZXMgaW50byB3aGljaCB0aGUgcHJldmlldyBvZiBhIGRyYWcgaXRlbSBjYW4gYmUgaW5zZXJ0ZWQuXG4gKiAtIGBnbG9iYWxgIC0gUHJldmlldyB3aWxsIGJlIGluc2VydGVkIGF0IHRoZSBib3R0b20gb2YgdGhlIGA8Ym9keT5gLiBUaGUgYWR2YW50YWdlIGlzIHRoYXRcbiAqIHlvdSBkb24ndCBoYXZlIHRvIHdvcnJ5IGFib3V0IGBvdmVyZmxvdzogaGlkZGVuYCBvciBgei1pbmRleGAsIGJ1dCB0aGUgaXRlbSB3b24ndCByZXRhaW5cbiAqIGl0cyBpbmhlcml0ZWQgc3R5bGVzLlxuICogLSBgcGFyZW50YCAtIFByZXZpZXcgd2lsbCBiZSBpbnNlcnRlZCBpbnRvIHRoZSBwYXJlbnQgb2YgdGhlIGRyYWcgaXRlbS4gVGhlIGFkdmFudGFnZSBpcyB0aGF0XG4gKiBpbmhlcml0ZWQgc3R5bGVzIHdpbGwgYmUgcHJlc2VydmVkLCBidXQgaXQgbWF5IGJlIGNsaXBwZWQgYnkgYG92ZXJmbG93OiBoaWRkZW5gIG9yIG5vdCBiZVxuICogdmlzaWJsZSBkdWUgdG8gYHotaW5kZXhgLiBGdXJ0aGVybW9yZSwgdGhlIHByZXZpZXcgaXMgZ29pbmcgdG8gaGF2ZSBhbiBlZmZlY3Qgb3ZlciBzZWxlY3RvcnNcbiAqIGxpa2UgYDpudGgtY2hpbGRgIGFuZCBzb21lIGZsZXhib3ggY29uZmlndXJhdGlvbnMuXG4gKiAtIGBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiB8IEhUTUxFbGVtZW50YCAtIFByZXZpZXcgd2lsbCBiZSBpbnNlcnRlZCBpbnRvIGEgc3BlY2lmaWMgZWxlbWVudC5cbiAqIFNhbWUgYWR2YW50YWdlcyBhbmQgZGlzYWR2YW50YWdlcyBhcyBgcGFyZW50YC5cbiAqL1xuZXhwb3J0IHR5cGUgUHJldmlld0NvbnRhaW5lciA9ICdnbG9iYWwnIHwgJ3BhcmVudCcgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiB8IEhUTUxFbGVtZW50O1xuXG4vKipcbiAqIFJlZmVyZW5jZSB0byBhIGRyYWdnYWJsZSBpdGVtLiBVc2VkIHRvIG1hbmlwdWxhdGUgb3IgZGlzcG9zZSBvZiB0aGUgaXRlbS5cbiAqL1xuZXhwb3J0IGNsYXNzIERyYWdSZWY8VCA9IGFueT4ge1xuICAvKiogRWxlbWVudCBkaXNwbGF5ZWQgbmV4dCB0byB0aGUgdXNlcidzIHBvaW50ZXIgd2hpbGUgdGhlIGVsZW1lbnQgaXMgZHJhZ2dlZC4gKi9cbiAgcHJpdmF0ZSBfcHJldmlldzogSFRNTEVsZW1lbnQ7XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgdmlldyBvZiB0aGUgcHJldmlldyBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9wcmV2aWV3UmVmOiBFbWJlZGRlZFZpZXdSZWY8YW55PiB8IG51bGw7XG5cbiAgLyoqIENvbnRhaW5lciBpbnRvIHdoaWNoIHRvIGluc2VydCB0aGUgcHJldmlldy4gKi9cbiAgcHJpdmF0ZSBfcHJldmlld0NvbnRhaW5lcjogUHJldmlld0NvbnRhaW5lciB8IHVuZGVmaW5lZDtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSB2aWV3IG9mIHRoZSBwbGFjZWhvbGRlciBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9wbGFjZWhvbGRlclJlZjogRW1iZWRkZWRWaWV3UmVmPGFueT4gfCBudWxsO1xuXG4gIC8qKiBFbGVtZW50IHRoYXQgaXMgcmVuZGVyZWQgaW5zdGVhZCBvZiB0aGUgZHJhZ2dhYmxlIGl0ZW0gd2hpbGUgaXQgaXMgYmVpbmcgc29ydGVkLiAqL1xuICBwcml2YXRlIF9wbGFjZWhvbGRlcjogSFRNTEVsZW1lbnQ7XG5cbiAgLyoqIENvb3JkaW5hdGVzIHdpdGhpbiB0aGUgZWxlbWVudCBhdCB3aGljaCB0aGUgdXNlciBwaWNrZWQgdXAgdGhlIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3BpY2t1cFBvc2l0aW9uSW5FbGVtZW50OiBQb2ludDtcblxuICAvKiogQ29vcmRpbmF0ZXMgb24gdGhlIHBhZ2UgYXQgd2hpY2ggdGhlIHVzZXIgcGlja2VkIHVwIHRoZSBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9waWNrdXBQb3NpdGlvbk9uUGFnZTogUG9pbnQ7XG5cbiAgLyoqXG4gICAqIEFuY2hvciBub2RlIHVzZWQgdG8gc2F2ZSB0aGUgcGxhY2UgaW4gdGhlIERPTSB3aGVyZSB0aGUgZWxlbWVudCB3YXNcbiAgICogcGlja2VkIHVwIHNvIHRoYXQgaXQgY2FuIGJlIHJlc3RvcmVkIGF0IHRoZSBlbmQgb2YgdGhlIGRyYWcgc2VxdWVuY2UuXG4gICAqL1xuICBwcml2YXRlIF9hbmNob3I6IENvbW1lbnQ7XG5cbiAgLyoqXG4gICAqIENTUyBgdHJhbnNmb3JtYCBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IHdoZW4gaXQgaXNuJ3QgYmVpbmcgZHJhZ2dlZC4gV2UgbmVlZCBhXG4gICAqIHBhc3NpdmUgdHJhbnNmb3JtIGluIG9yZGVyIGZvciB0aGUgZHJhZ2dlZCBlbGVtZW50IHRvIHJldGFpbiBpdHMgbmV3IHBvc2l0aW9uXG4gICAqIGFmdGVyIHRoZSB1c2VyIGhhcyBzdG9wcGVkIGRyYWdnaW5nIGFuZCBiZWNhdXNlIHdlIG5lZWQgdG8ga25vdyB0aGUgcmVsYXRpdmVcbiAgICogcG9zaXRpb24gaW4gY2FzZSB0aGV5IHN0YXJ0IGRyYWdnaW5nIGFnYWluLiBUaGlzIGNvcnJlc3BvbmRzIHRvIGBlbGVtZW50LnN0eWxlLnRyYW5zZm9ybWAuXG4gICAqL1xuICBwcml2YXRlIF9wYXNzaXZlVHJhbnNmb3JtOiBQb2ludCA9IHt4OiAwLCB5OiAwfTtcblxuICAvKiogQ1NTIGB0cmFuc2Zvcm1gIHRoYXQgaXMgYXBwbGllZCB0byB0aGUgZWxlbWVudCB3aGlsZSBpdCdzIGJlaW5nIGRyYWdnZWQuICovXG4gIHByaXZhdGUgX2FjdGl2ZVRyYW5zZm9ybTogUG9pbnQgPSB7eDogMCwgeTogMH07XG5cbiAgLyoqIElubGluZSBgdHJhbnNmb3JtYCB2YWx1ZSB0aGF0IHRoZSBlbGVtZW50IGhhZCBiZWZvcmUgdGhlIGZpcnN0IGRyYWdnaW5nIHNlcXVlbmNlLiAqL1xuICBwcml2YXRlIF9pbml0aWFsVHJhbnNmb3JtPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBkcmFnZ2luZyBzZXF1ZW5jZSBoYXMgYmVlbiBzdGFydGVkLiBEb2Vzbid0XG4gICAqIG5lY2Vzc2FyaWx5IG1lYW4gdGhhdCB0aGUgZWxlbWVudCBoYXMgYmVlbiBtb3ZlZC5cbiAgICovXG4gIHByaXZhdGUgX2hhc1N0YXJ0ZWREcmFnZ2luZyA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBlbGVtZW50IGhhcyBtb3ZlZCBzaW5jZSB0aGUgdXNlciBzdGFydGVkIGRyYWdnaW5nIGl0LiAqL1xuICBwcml2YXRlIF9oYXNNb3ZlZDogYm9vbGVhbjtcblxuICAvKiogRHJvcCBjb250YWluZXIgaW4gd2hpY2ggdGhlIERyYWdSZWYgcmVzaWRlZCB3aGVuIGRyYWdnaW5nIGJlZ2FuLiAqL1xuICBwcml2YXRlIF9pbml0aWFsQ29udGFpbmVyOiBEcm9wTGlzdFJlZjtcblxuICAvKiogSW5kZXggYXQgd2hpY2ggdGhlIGl0ZW0gc3RhcnRlZCBpbiBpdHMgaW5pdGlhbCBjb250YWluZXIuICovXG4gIHByaXZhdGUgX2luaXRpYWxJbmRleDogbnVtYmVyO1xuXG4gIC8qKiBDYWNoZWQgcG9zaXRpb25zIG9mIHNjcm9sbGFibGUgcGFyZW50IGVsZW1lbnRzLiAqL1xuICBwcml2YXRlIF9wYXJlbnRQb3NpdGlvbnM6IFBhcmVudFBvc2l0aW9uVHJhY2tlcjtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgaXRlbSBpcyBiZWluZyBtb3ZlZC4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfbW92ZUV2ZW50cyA9IG5ldyBTdWJqZWN0PHtcbiAgICBzb3VyY2U6IERyYWdSZWY7XG4gICAgcG9pbnRlclBvc2l0aW9uOiB7eDogbnVtYmVyOyB5OiBudW1iZXJ9O1xuICAgIGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudDtcbiAgICBkaXN0YW5jZTogUG9pbnQ7XG4gICAgZGVsdGE6IHt4OiAtMSB8IDAgfCAxOyB5OiAtMSB8IDAgfCAxfTtcbiAgfT4oKTtcblxuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgdXNlciBpcyBkcmFnZ2luZyBhbG9uZyBlYWNoIGF4aXMuICovXG4gIHByaXZhdGUgX3BvaW50ZXJEaXJlY3Rpb25EZWx0YToge3g6IC0xIHwgMCB8IDE7IHk6IC0xIHwgMCB8IDF9O1xuXG4gIC8qKiBQb2ludGVyIHBvc2l0aW9uIGF0IHdoaWNoIHRoZSBsYXN0IGNoYW5nZSBpbiB0aGUgZGVsdGEgb2NjdXJyZWQuICovXG4gIHByaXZhdGUgX3BvaW50ZXJQb3NpdGlvbkF0TGFzdERpcmVjdGlvbkNoYW5nZTogUG9pbnQ7XG5cbiAgLyoqIFBvc2l0aW9uIG9mIHRoZSBwb2ludGVyIGF0IHRoZSBsYXN0IHBvaW50ZXIgZXZlbnQuICovXG4gIHByaXZhdGUgX2xhc3RLbm93blBvaW50ZXJQb3NpdGlvbjogUG9pbnQ7XG5cbiAgLyoqXG4gICAqIFJvb3QgRE9NIG5vZGUgb2YgdGhlIGRyYWcgaW5zdGFuY2UuIFRoaXMgaXMgdGhlIGVsZW1lbnQgdGhhdCB3aWxsXG4gICAqIGJlIG1vdmVkIGFyb3VuZCBhcyB0aGUgdXNlciBpcyBkcmFnZ2luZy5cbiAgICovXG4gIHByaXZhdGUgX3Jvb3RFbGVtZW50OiBIVE1MRWxlbWVudDtcblxuICAvKipcbiAgICogTmVhcmVzdCBhbmNlc3RvciBTVkcsIHJlbGF0aXZlIHRvIHdoaWNoIGNvb3JkaW5hdGVzIGFyZSBjYWxjdWxhdGVkIGlmIGRyYWdnaW5nIFNWR0VsZW1lbnRcbiAgICovXG4gIHByaXZhdGUgX293bmVyU1ZHRWxlbWVudDogU1ZHU1ZHRWxlbWVudCB8IG51bGw7XG5cbiAgLyoqXG4gICAqIElubGluZSBzdHlsZSB2YWx1ZSBvZiBgLXdlYmtpdC10YXAtaGlnaGxpZ2h0LWNvbG9yYCBhdCB0aGUgdGltZSB0aGVcbiAgICogZHJhZ2dpbmcgd2FzIHN0YXJ0ZWQuIFVzZWQgdG8gcmVzdG9yZSB0aGUgdmFsdWUgb25jZSB3ZSdyZSBkb25lIGRyYWdnaW5nLlxuICAgKi9cbiAgcHJpdmF0ZSBfcm9vdEVsZW1lbnRUYXBIaWdobGlnaHQ6IHN0cmluZztcblxuICAvKiogU3Vic2NyaXB0aW9uIHRvIHBvaW50ZXIgbW92ZW1lbnQgZXZlbnRzLiAqL1xuICBwcml2YXRlIF9wb2ludGVyTW92ZVN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcblxuICAvKiogU3Vic2NyaXB0aW9uIHRvIHRoZSBldmVudCB0aGF0IGlzIGRpc3BhdGNoZWQgd2hlbiB0aGUgdXNlciBsaWZ0cyB0aGVpciBwb2ludGVyLiAqL1xuICBwcml2YXRlIF9wb2ludGVyVXBTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG5cbiAgLyoqIFN1YnNjcmlwdGlvbiB0byB0aGUgdmlld3BvcnQgYmVpbmcgc2Nyb2xsZWQuICovXG4gIHByaXZhdGUgX3Njcm9sbFN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcblxuICAvKiogU3Vic2NyaXB0aW9uIHRvIHRoZSB2aWV3cG9ydCBiZWluZyByZXNpemVkLiAqL1xuICBwcml2YXRlIF9yZXNpemVTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG5cbiAgLyoqXG4gICAqIFRpbWUgYXQgd2hpY2ggdGhlIGxhc3QgdG91Y2ggZXZlbnQgb2NjdXJyZWQuIFVzZWQgdG8gYXZvaWQgZmlyaW5nIHRoZSBzYW1lXG4gICAqIGV2ZW50cyBtdWx0aXBsZSB0aW1lcyBvbiB0b3VjaCBkZXZpY2VzIHdoZXJlIHRoZSBicm93c2VyIHdpbGwgZmlyZSBhIGZha2VcbiAgICogbW91c2UgZXZlbnQgZm9yIGVhY2ggdG91Y2ggZXZlbnQsIGFmdGVyIGEgY2VydGFpbiB0aW1lLlxuICAgKi9cbiAgcHJpdmF0ZSBfbGFzdFRvdWNoRXZlbnRUaW1lOiBudW1iZXI7XG5cbiAgLyoqIFRpbWUgYXQgd2hpY2ggdGhlIGxhc3QgZHJhZ2dpbmcgc2VxdWVuY2Ugd2FzIHN0YXJ0ZWQuICovXG4gIHByaXZhdGUgX2RyYWdTdGFydFRpbWU6IG51bWJlcjtcblxuICAvKiogQ2FjaGVkIHJlZmVyZW5jZSB0byB0aGUgYm91bmRhcnkgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfYm91bmRhcnlFbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBuYXRpdmUgZHJhZ2dpbmcgaW50ZXJhY3Rpb25zIGhhdmUgYmVlbiBlbmFibGVkIG9uIHRoZSByb290IGVsZW1lbnQuICovXG4gIHByaXZhdGUgX25hdGl2ZUludGVyYWN0aW9uc0VuYWJsZWQgPSB0cnVlO1xuXG4gIC8qKiBDYWNoZWQgZGltZW5zaW9ucyBvZiB0aGUgcHJldmlldyBlbGVtZW50LiBTaG91bGQgYmUgcmVhZCB2aWEgYF9nZXRQcmV2aWV3UmVjdGAuICovXG4gIHByaXZhdGUgX3ByZXZpZXdSZWN0PzogQ2xpZW50UmVjdDtcblxuICAvKiogQ2FjaGVkIGRpbWVuc2lvbnMgb2YgdGhlIGJvdW5kYXJ5IGVsZW1lbnQuICovXG4gIHByaXZhdGUgX2JvdW5kYXJ5UmVjdD86IENsaWVudFJlY3Q7XG5cbiAgLyoqIEVsZW1lbnQgdGhhdCB3aWxsIGJlIHVzZWQgYXMgYSB0ZW1wbGF0ZSB0byBjcmVhdGUgdGhlIGRyYWdnYWJsZSBpdGVtJ3MgcHJldmlldy4gKi9cbiAgcHJpdmF0ZSBfcHJldmlld1RlbXBsYXRlPzogRHJhZ1ByZXZpZXdUZW1wbGF0ZSB8IG51bGw7XG5cbiAgLyoqIFRlbXBsYXRlIGZvciBwbGFjZWhvbGRlciBlbGVtZW50IHJlbmRlcmVkIHRvIHNob3cgd2hlcmUgYSBkcmFnZ2FibGUgd291bGQgYmUgZHJvcHBlZC4gKi9cbiAgcHJpdmF0ZSBfcGxhY2Vob2xkZXJUZW1wbGF0ZT86IERyYWdIZWxwZXJUZW1wbGF0ZSB8IG51bGw7XG5cbiAgLyoqIEVsZW1lbnRzIHRoYXQgY2FuIGJlIHVzZWQgdG8gZHJhZyB0aGUgZHJhZ2dhYmxlIGl0ZW0uICovXG4gIHByaXZhdGUgX2hhbmRsZXM6IEhUTUxFbGVtZW50W10gPSBbXTtcblxuICAvKiogUmVnaXN0ZXJlZCBoYW5kbGVzIHRoYXQgYXJlIGN1cnJlbnRseSBkaXNhYmxlZC4gKi9cbiAgcHJpdmF0ZSBfZGlzYWJsZWRIYW5kbGVzID0gbmV3IFNldDxIVE1MRWxlbWVudD4oKTtcblxuICAvKiogRHJvcHBhYmxlIGNvbnRhaW5lciB0aGF0IHRoZSBkcmFnZ2FibGUgaXMgYSBwYXJ0IG9mLiAqL1xuICBwcml2YXRlIF9kcm9wQ29udGFpbmVyPzogRHJvcExpc3RSZWY7XG5cbiAgLyoqIExheW91dCBkaXJlY3Rpb24gb2YgdGhlIGl0ZW0uICovXG4gIHByaXZhdGUgX2RpcmVjdGlvbjogRGlyZWN0aW9uID0gJ2x0cic7XG5cbiAgLyoqIFJlZiB0aGF0IHRoZSBjdXJyZW50IGRyYWcgaXRlbSBpcyBuZXN0ZWQgaW4uICovXG4gIHByaXZhdGUgX3BhcmVudERyYWdSZWY6IERyYWdSZWY8dW5rbm93bj4gfCBudWxsO1xuXG4gIC8qKlxuICAgKiBDYWNoZWQgc2hhZG93IHJvb3QgdGhhdCB0aGUgZWxlbWVudCBpcyBwbGFjZWQgaW4uIGBudWxsYCBtZWFucyB0aGF0IHRoZSBlbGVtZW50IGlzbid0IGluXG4gICAqIHRoZSBzaGFkb3cgRE9NIGFuZCBgdW5kZWZpbmVkYCBtZWFucyB0aGF0IGl0IGhhc24ndCBiZWVuIHJlc29sdmVkIHlldC4gU2hvdWxkIGJlIHJlYWQgdmlhXG4gICAqIGBfZ2V0U2hhZG93Um9vdGAsIG5vdCBkaXJlY3RseS5cbiAgICovXG4gIHByaXZhdGUgX2NhY2hlZFNoYWRvd1Jvb3Q6IFNoYWRvd1Jvb3QgfCBudWxsIHwgdW5kZWZpbmVkO1xuXG4gIC8qKiBBeGlzIGFsb25nIHdoaWNoIGRyYWdnaW5nIGlzIGxvY2tlZC4gKi9cbiAgbG9ja0F4aXM6ICd4JyB8ICd5JztcblxuICAvKipcbiAgICogQW1vdW50IG9mIG1pbGxpc2Vjb25kcyB0byB3YWl0IGFmdGVyIHRoZSB1c2VyIGhhcyBwdXQgdGhlaXJcbiAgICogcG9pbnRlciBkb3duIGJlZm9yZSBzdGFydGluZyB0byBkcmFnIHRoZSBlbGVtZW50LlxuICAgKi9cbiAgZHJhZ1N0YXJ0RGVsYXk6IG51bWJlciB8IHt0b3VjaDogbnVtYmVyOyBtb3VzZTogbnVtYmVyfSA9IDA7XG5cbiAgLyoqIENsYXNzIHRvIGJlIGFkZGVkIHRvIHRoZSBwcmV2aWV3IGVsZW1lbnQuICovXG4gIHByZXZpZXdDbGFzczogc3RyaW5nIHwgc3RyaW5nW10gfCB1bmRlZmluZWQ7XG5cbiAgLyoqIFdoZXRoZXIgc3RhcnRpbmcgdG8gZHJhZyB0aGlzIGVsZW1lbnQgaXMgZGlzYWJsZWQuICovXG4gIGdldCBkaXNhYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fZGlzYWJsZWQgfHwgISEodGhpcy5fZHJvcENvbnRhaW5lciAmJiB0aGlzLl9kcm9wQ29udGFpbmVyLmRpc2FibGVkKTtcbiAgfVxuICBzZXQgZGlzYWJsZWQodmFsdWU6IGJvb2xlYW4pIHtcbiAgICBjb25zdCBuZXdWYWx1ZSA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG5cbiAgICBpZiAobmV3VmFsdWUgIT09IHRoaXMuX2Rpc2FibGVkKSB7XG4gICAgICB0aGlzLl9kaXNhYmxlZCA9IG5ld1ZhbHVlO1xuICAgICAgdGhpcy5fdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucygpO1xuICAgICAgdGhpcy5faGFuZGxlcy5mb3JFYWNoKGhhbmRsZSA9PiB0b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKGhhbmRsZSwgbmV3VmFsdWUpKTtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBfZGlzYWJsZWQgPSBmYWxzZTtcblxuICAvKiogRW1pdHMgYXMgdGhlIGRyYWcgc2VxdWVuY2UgaXMgYmVpbmcgcHJlcGFyZWQuICovXG4gIHJlYWRvbmx5IGJlZm9yZVN0YXJ0ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHN0YXJ0cyBkcmFnZ2luZyB0aGUgaXRlbS4gKi9cbiAgcmVhZG9ubHkgc3RhcnRlZCA9IG5ldyBTdWJqZWN0PHtzb3VyY2U6IERyYWdSZWY7IGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudH0+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgaGFzIHJlbGVhc2VkIGEgZHJhZyBpdGVtLCBiZWZvcmUgYW55IGFuaW1hdGlvbnMgaGF2ZSBzdGFydGVkLiAqL1xuICByZWFkb25seSByZWxlYXNlZCA9IG5ldyBTdWJqZWN0PHtzb3VyY2U6IERyYWdSZWY7IGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudH0+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgc3RvcHMgZHJhZ2dpbmcgYW4gaXRlbSBpbiB0aGUgY29udGFpbmVyLiAqL1xuICByZWFkb25seSBlbmRlZCA9IG5ldyBTdWJqZWN0PHtcbiAgICBzb3VyY2U6IERyYWdSZWY7XG4gICAgZGlzdGFuY2U6IFBvaW50O1xuICAgIGRyb3BQb2ludDogUG9pbnQ7XG4gICAgZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50O1xuICB9PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGhhcyBtb3ZlZCB0aGUgaXRlbSBpbnRvIGEgbmV3IGNvbnRhaW5lci4gKi9cbiAgcmVhZG9ubHkgZW50ZXJlZCA9IG5ldyBTdWJqZWN0PHtjb250YWluZXI6IERyb3BMaXN0UmVmOyBpdGVtOiBEcmFnUmVmOyBjdXJyZW50SW5kZXg6IG51bWJlcn0+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgcmVtb3ZlcyB0aGUgaXRlbSBpdHMgY29udGFpbmVyIGJ5IGRyYWdnaW5nIGl0IGludG8gYW5vdGhlciBjb250YWluZXIuICovXG4gIHJlYWRvbmx5IGV4aXRlZCA9IG5ldyBTdWJqZWN0PHtjb250YWluZXI6IERyb3BMaXN0UmVmOyBpdGVtOiBEcmFnUmVmfT4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBkcm9wcyB0aGUgaXRlbSBpbnNpZGUgYSBjb250YWluZXIuICovXG4gIHJlYWRvbmx5IGRyb3BwZWQgPSBuZXcgU3ViamVjdDx7XG4gICAgcHJldmlvdXNJbmRleDogbnVtYmVyO1xuICAgIGN1cnJlbnRJbmRleDogbnVtYmVyO1xuICAgIGl0ZW06IERyYWdSZWY7XG4gICAgY29udGFpbmVyOiBEcm9wTGlzdFJlZjtcbiAgICBwcmV2aW91c0NvbnRhaW5lcjogRHJvcExpc3RSZWY7XG4gICAgZGlzdGFuY2U6IFBvaW50O1xuICAgIGRyb3BQb2ludDogUG9pbnQ7XG4gICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcjogYm9vbGVhbjtcbiAgICBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQ7XG4gIH0+KCk7XG5cbiAgLyoqXG4gICAqIEVtaXRzIGFzIHRoZSB1c2VyIGlzIGRyYWdnaW5nIHRoZSBpdGVtLiBVc2Ugd2l0aCBjYXV0aW9uLFxuICAgKiBiZWNhdXNlIHRoaXMgZXZlbnQgd2lsbCBmaXJlIGZvciBldmVyeSBwaXhlbCB0aGF0IHRoZSB1c2VyIGhhcyBkcmFnZ2VkLlxuICAgKi9cbiAgcmVhZG9ubHkgbW92ZWQ6IE9ic2VydmFibGU8e1xuICAgIHNvdXJjZTogRHJhZ1JlZjtcbiAgICBwb2ludGVyUG9zaXRpb246IHt4OiBudW1iZXI7IHk6IG51bWJlcn07XG4gICAgZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50O1xuICAgIGRpc3RhbmNlOiBQb2ludDtcbiAgICBkZWx0YToge3g6IC0xIHwgMCB8IDE7IHk6IC0xIHwgMCB8IDF9O1xuICB9PiA9IHRoaXMuX21vdmVFdmVudHM7XG5cbiAgLyoqIEFyYml0cmFyeSBkYXRhIHRoYXQgY2FuIGJlIGF0dGFjaGVkIHRvIHRoZSBkcmFnIGl0ZW0uICovXG4gIGRhdGE6IFQ7XG5cbiAgLyoqXG4gICAqIEZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gY3VzdG9taXplIHRoZSBsb2dpYyBvZiBob3cgdGhlIHBvc2l0aW9uIG9mIHRoZSBkcmFnIGl0ZW1cbiAgICogaXMgbGltaXRlZCB3aGlsZSBpdCdzIGJlaW5nIGRyYWdnZWQuIEdldHMgY2FsbGVkIHdpdGggYSBwb2ludCBjb250YWluaW5nIHRoZSBjdXJyZW50IHBvc2l0aW9uXG4gICAqIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBvbiB0aGUgcGFnZSBhbmQgc2hvdWxkIHJldHVybiBhIHBvaW50IGRlc2NyaWJpbmcgd2hlcmUgdGhlIGl0ZW0gc2hvdWxkXG4gICAqIGJlIHJlbmRlcmVkLlxuICAgKi9cbiAgY29uc3RyYWluUG9zaXRpb24/OiAocG9pbnQ6IFBvaW50LCBkcmFnUmVmOiBEcmFnUmVmKSA9PiBQb2ludDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiB8IEhUTUxFbGVtZW50LFxuICAgIHByaXZhdGUgX2NvbmZpZzogRHJhZ1JlZkNvbmZpZyxcbiAgICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQsXG4gICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgcHJpdmF0ZSBfdmlld3BvcnRSdWxlcjogVmlld3BvcnRSdWxlcixcbiAgICBwcml2YXRlIF9kcmFnRHJvcFJlZ2lzdHJ5OiBEcmFnRHJvcFJlZ2lzdHJ5PERyYWdSZWYsIERyb3BMaXN0UmVmPixcbiAgKSB7XG4gICAgdGhpcy53aXRoUm9vdEVsZW1lbnQoZWxlbWVudCkud2l0aFBhcmVudChfY29uZmlnLnBhcmVudERyYWdSZWYgfHwgbnVsbCk7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zID0gbmV3IFBhcmVudFBvc2l0aW9uVHJhY2tlcihfZG9jdW1lbnQpO1xuICAgIF9kcmFnRHJvcFJlZ2lzdHJ5LnJlZ2lzdGVyRHJhZ0l0ZW0odGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZWxlbWVudCB0aGF0IGlzIGJlaW5nIHVzZWQgYXMgYSBwbGFjZWhvbGRlclxuICAgKiB3aGlsZSB0aGUgY3VycmVudCBlbGVtZW50IGlzIGJlaW5nIGRyYWdnZWQuXG4gICAqL1xuICBnZXRQbGFjZWhvbGRlckVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLl9wbGFjZWhvbGRlcjtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHRoZSByb290IGRyYWdnYWJsZSBlbGVtZW50LiAqL1xuICBnZXRSb290RWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX3Jvb3RFbGVtZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnRseS12aXNpYmxlIGVsZW1lbnQgdGhhdCByZXByZXNlbnRzIHRoZSBkcmFnIGl0ZW0uXG4gICAqIFdoaWxlIGRyYWdnaW5nIHRoaXMgaXMgdGhlIHBsYWNlaG9sZGVyLCBvdGhlcndpc2UgaXQncyB0aGUgcm9vdCBlbGVtZW50LlxuICAgKi9cbiAgZ2V0VmlzaWJsZUVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLmlzRHJhZ2dpbmcoKSA/IHRoaXMuZ2V0UGxhY2Vob2xkZXJFbGVtZW50KCkgOiB0aGlzLmdldFJvb3RFbGVtZW50KCk7XG4gIH1cblxuICAvKiogUmVnaXN0ZXJzIHRoZSBoYW5kbGVzIHRoYXQgY2FuIGJlIHVzZWQgdG8gZHJhZyB0aGUgZWxlbWVudC4gKi9cbiAgd2l0aEhhbmRsZXMoaGFuZGxlczogKEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4pW10pOiB0aGlzIHtcbiAgICB0aGlzLl9oYW5kbGVzID0gaGFuZGxlcy5tYXAoaGFuZGxlID0+IGNvZXJjZUVsZW1lbnQoaGFuZGxlKSk7XG4gICAgdGhpcy5faGFuZGxlcy5mb3JFYWNoKGhhbmRsZSA9PiB0b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKGhhbmRsZSwgdGhpcy5kaXNhYmxlZCkpO1xuICAgIHRoaXMuX3RvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMoKTtcblxuICAgIC8vIERlbGV0ZSBhbnkgbGluZ2VyaW5nIGRpc2FibGVkIGhhbmRsZXMgdGhhdCBtYXkgaGF2ZSBiZWVuIGRlc3Ryb3llZC4gTm90ZSB0aGF0IHdlIHJlLWNyZWF0ZVxuICAgIC8vIHRoZSBzZXQsIHJhdGhlciB0aGFuIGl0ZXJhdGUgb3ZlciBpdCBhbmQgZmlsdGVyIG91dCB0aGUgZGVzdHJveWVkIGhhbmRsZXMsIGJlY2F1c2Ugd2hpbGVcbiAgICAvLyB0aGUgRVMgc3BlYyBhbGxvd3MgZm9yIHNldHMgdG8gYmUgbW9kaWZpZWQgd2hpbGUgdGhleSdyZSBiZWluZyBpdGVyYXRlZCBvdmVyLCBzb21lIHBvbHlmaWxsc1xuICAgIC8vIHVzZSBhbiBhcnJheSBpbnRlcm5hbGx5IHdoaWNoIG1heSB0aHJvdyBhbiBlcnJvci5cbiAgICBjb25zdCBkaXNhYmxlZEhhbmRsZXMgPSBuZXcgU2V0PEhUTUxFbGVtZW50PigpO1xuICAgIHRoaXMuX2Rpc2FibGVkSGFuZGxlcy5mb3JFYWNoKGhhbmRsZSA9PiB7XG4gICAgICBpZiAodGhpcy5faGFuZGxlcy5pbmRleE9mKGhhbmRsZSkgPiAtMSkge1xuICAgICAgICBkaXNhYmxlZEhhbmRsZXMuYWRkKGhhbmRsZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5fZGlzYWJsZWRIYW5kbGVzID0gZGlzYWJsZWRIYW5kbGVzO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyB0aGUgdGVtcGxhdGUgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgdGhlIGRyYWcgcHJldmlldy5cbiAgICogQHBhcmFtIHRlbXBsYXRlIFRlbXBsYXRlIHRoYXQgZnJvbSB3aGljaCB0byBzdGFtcCBvdXQgdGhlIHByZXZpZXcuXG4gICAqL1xuICB3aXRoUHJldmlld1RlbXBsYXRlKHRlbXBsYXRlOiBEcmFnUHJldmlld1RlbXBsYXRlIHwgbnVsbCk6IHRoaXMge1xuICAgIHRoaXMuX3ByZXZpZXdUZW1wbGF0ZSA9IHRlbXBsYXRlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyB0aGUgdGVtcGxhdGUgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgdGhlIGRyYWcgcGxhY2Vob2xkZXIuXG4gICAqIEBwYXJhbSB0ZW1wbGF0ZSBUZW1wbGF0ZSB0aGF0IGZyb20gd2hpY2ggdG8gc3RhbXAgb3V0IHRoZSBwbGFjZWhvbGRlci5cbiAgICovXG4gIHdpdGhQbGFjZWhvbGRlclRlbXBsYXRlKHRlbXBsYXRlOiBEcmFnSGVscGVyVGVtcGxhdGUgfCBudWxsKTogdGhpcyB7XG4gICAgdGhpcy5fcGxhY2Vob2xkZXJUZW1wbGF0ZSA9IHRlbXBsYXRlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYW4gYWx0ZXJuYXRlIGRyYWcgcm9vdCBlbGVtZW50LiBUaGUgcm9vdCBlbGVtZW50IGlzIHRoZSBlbGVtZW50IHRoYXQgd2lsbCBiZSBtb3ZlZCBhc1xuICAgKiB0aGUgdXNlciBpcyBkcmFnZ2luZy4gUGFzc2luZyBhbiBhbHRlcm5hdGUgcm9vdCBlbGVtZW50IGlzIHVzZWZ1bCB3aGVuIHRyeWluZyB0byBlbmFibGVcbiAgICogZHJhZ2dpbmcgb24gYW4gZWxlbWVudCB0aGF0IHlvdSBtaWdodCBub3QgaGF2ZSBhY2Nlc3MgdG8uXG4gICAqL1xuICB3aXRoUm9vdEVsZW1lbnQocm9vdEVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+IHwgSFRNTEVsZW1lbnQpOiB0aGlzIHtcbiAgICBjb25zdCBlbGVtZW50ID0gY29lcmNlRWxlbWVudChyb290RWxlbWVudCk7XG5cbiAgICBpZiAoZWxlbWVudCAhPT0gdGhpcy5fcm9vdEVsZW1lbnQpIHtcbiAgICAgIGlmICh0aGlzLl9yb290RWxlbWVudCkge1xuICAgICAgICB0aGlzLl9yZW1vdmVSb290RWxlbWVudExpc3RlbmVycyh0aGlzLl9yb290RWxlbWVudCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fcG9pbnRlckRvd24sIGFjdGl2ZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5fcG9pbnRlckRvd24sIHBhc3NpdmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICAgIC8vIFVzdWFsbHkgdGhpcyBpc24ndCBuZWNlc3Nhcnkgc2luY2UgdGhlIHdlIHByZXZlbnQgdGhlIGRlZmF1bHQgYWN0aW9uIGluIGBwb2ludGVyRG93bmAsXG4gICAgICAgIC8vIGJ1dCBzb21lIGNhc2VzIGxpa2UgZHJhZ2dpbmcgb2YgbGlua3MgY2FuIHNsaXAgdGhyb3VnaCAoc2VlICMyNDQwMykuXG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ3N0YXJ0JywgcHJldmVudERlZmF1bHQsIGFjdGl2ZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5faW5pdGlhbFRyYW5zZm9ybSA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuX3Jvb3RFbGVtZW50ID0gZWxlbWVudDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIFNWR0VsZW1lbnQgIT09ICd1bmRlZmluZWQnICYmIHRoaXMuX3Jvb3RFbGVtZW50IGluc3RhbmNlb2YgU1ZHRWxlbWVudCkge1xuICAgICAgdGhpcy5fb3duZXJTVkdFbGVtZW50ID0gdGhpcy5fcm9vdEVsZW1lbnQub3duZXJTVkdFbGVtZW50O1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEVsZW1lbnQgdG8gd2hpY2ggdGhlIGRyYWdnYWJsZSdzIHBvc2l0aW9uIHdpbGwgYmUgY29uc3RyYWluZWQuXG4gICAqL1xuICB3aXRoQm91bmRhcnlFbGVtZW50KGJvdW5kYXJ5RWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBIVE1MRWxlbWVudCB8IG51bGwpOiB0aGlzIHtcbiAgICB0aGlzLl9ib3VuZGFyeUVsZW1lbnQgPSBib3VuZGFyeUVsZW1lbnQgPyBjb2VyY2VFbGVtZW50KGJvdW5kYXJ5RWxlbWVudCkgOiBudWxsO1xuICAgIHRoaXMuX3Jlc2l6ZVN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIGlmIChib3VuZGFyeUVsZW1lbnQpIHtcbiAgICAgIHRoaXMuX3Jlc2l6ZVN1YnNjcmlwdGlvbiA9IHRoaXMuX3ZpZXdwb3J0UnVsZXJcbiAgICAgICAgLmNoYW5nZSgxMClcbiAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9jb250YWluSW5zaWRlQm91bmRhcnlPblJlc2l6ZSgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogU2V0cyB0aGUgcGFyZW50IHJlZiB0aGF0IHRoZSByZWYgaXMgbmVzdGVkIGluLiAgKi9cbiAgd2l0aFBhcmVudChwYXJlbnQ6IERyYWdSZWY8dW5rbm93bj4gfCBudWxsKTogdGhpcyB7XG4gICAgdGhpcy5fcGFyZW50RHJhZ1JlZiA9IHBhcmVudDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBSZW1vdmVzIHRoZSBkcmFnZ2luZyBmdW5jdGlvbmFsaXR5IGZyb20gdGhlIERPTSBlbGVtZW50LiAqL1xuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuX3JlbW92ZVJvb3RFbGVtZW50TGlzdGVuZXJzKHRoaXMuX3Jvb3RFbGVtZW50KTtcblxuICAgIC8vIERvIHRoaXMgY2hlY2sgYmVmb3JlIHJlbW92aW5nIGZyb20gdGhlIHJlZ2lzdHJ5IHNpbmNlIGl0J2xsXG4gICAgLy8gc3RvcCBiZWluZyBjb25zaWRlcmVkIGFzIGRyYWdnZWQgb25jZSBpdCBpcyByZW1vdmVkLlxuICAgIGlmICh0aGlzLmlzRHJhZ2dpbmcoKSkge1xuICAgICAgLy8gU2luY2Ugd2UgbW92ZSBvdXQgdGhlIGVsZW1lbnQgdG8gdGhlIGVuZCBvZiB0aGUgYm9keSB3aGlsZSBpdCdzIGJlaW5nXG4gICAgICAvLyBkcmFnZ2VkLCB3ZSBoYXZlIHRvIG1ha2Ugc3VyZSB0aGF0IGl0J3MgcmVtb3ZlZCBpZiBpdCBnZXRzIGRlc3Ryb3llZC5cbiAgICAgIHRoaXMuX3Jvb3RFbGVtZW50Py5yZW1vdmUoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9hbmNob3I/LnJlbW92ZSgpO1xuICAgIHRoaXMuX2Rlc3Ryb3lQcmV2aWV3KCk7XG4gICAgdGhpcy5fZGVzdHJveVBsYWNlaG9sZGVyKCk7XG4gICAgdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5yZW1vdmVEcmFnSXRlbSh0aGlzKTtcbiAgICB0aGlzLl9yZW1vdmVTdWJzY3JpcHRpb25zKCk7XG4gICAgdGhpcy5iZWZvcmVTdGFydGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5zdGFydGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5yZWxlYXNlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuZW5kZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmVudGVyZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmV4aXRlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuZHJvcHBlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX21vdmVFdmVudHMuY29tcGxldGUoKTtcbiAgICB0aGlzLl9oYW5kbGVzID0gW107XG4gICAgdGhpcy5fZGlzYWJsZWRIYW5kbGVzLmNsZWFyKCk7XG4gICAgdGhpcy5fZHJvcENvbnRhaW5lciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9yZXNpemVTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuY2xlYXIoKTtcbiAgICB0aGlzLl9ib3VuZGFyeUVsZW1lbnQgPVxuICAgICAgdGhpcy5fcm9vdEVsZW1lbnQgPVxuICAgICAgdGhpcy5fb3duZXJTVkdFbGVtZW50ID1cbiAgICAgIHRoaXMuX3BsYWNlaG9sZGVyVGVtcGxhdGUgPVxuICAgICAgdGhpcy5fcHJldmlld1RlbXBsYXRlID1cbiAgICAgIHRoaXMuX2FuY2hvciA9XG4gICAgICB0aGlzLl9wYXJlbnREcmFnUmVmID1cbiAgICAgICAgbnVsbCE7XG4gIH1cblxuICAvKiogQ2hlY2tzIHdoZXRoZXIgdGhlIGVsZW1lbnQgaXMgY3VycmVudGx5IGJlaW5nIGRyYWdnZWQuICovXG4gIGlzRHJhZ2dpbmcoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2hhc1N0YXJ0ZWREcmFnZ2luZyAmJiB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LmlzRHJhZ2dpbmcodGhpcyk7XG4gIH1cblxuICAvKiogUmVzZXRzIGEgc3RhbmRhbG9uZSBkcmFnIGl0ZW0gdG8gaXRzIGluaXRpYWwgcG9zaXRpb24uICovXG4gIHJlc2V0KCk6IHZvaWQge1xuICAgIHRoaXMuX3Jvb3RFbGVtZW50LnN0eWxlLnRyYW5zZm9ybSA9IHRoaXMuX2luaXRpYWxUcmFuc2Zvcm0gfHwgJyc7XG4gICAgdGhpcy5fYWN0aXZlVHJhbnNmb3JtID0ge3g6IDAsIHk6IDB9O1xuICAgIHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm0gPSB7eDogMCwgeTogMH07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIGhhbmRsZSBhcyBkaXNhYmxlZC4gV2hpbGUgYSBoYW5kbGUgaXMgZGlzYWJsZWQsIGl0J2xsIGNhcHR1cmUgYW5kIGludGVycnVwdCBkcmFnZ2luZy5cbiAgICogQHBhcmFtIGhhbmRsZSBIYW5kbGUgZWxlbWVudCB0aGF0IHNob3VsZCBiZSBkaXNhYmxlZC5cbiAgICovXG4gIGRpc2FibGVIYW5kbGUoaGFuZGxlOiBIVE1MRWxlbWVudCkge1xuICAgIGlmICghdGhpcy5fZGlzYWJsZWRIYW5kbGVzLmhhcyhoYW5kbGUpICYmIHRoaXMuX2hhbmRsZXMuaW5kZXhPZihoYW5kbGUpID4gLTEpIHtcbiAgICAgIHRoaXMuX2Rpc2FibGVkSGFuZGxlcy5hZGQoaGFuZGxlKTtcbiAgICAgIHRvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMoaGFuZGxlLCB0cnVlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlcyBhIGhhbmRsZSwgaWYgaXQgaGFzIGJlZW4gZGlzYWJsZWQuXG4gICAqIEBwYXJhbSBoYW5kbGUgSGFuZGxlIGVsZW1lbnQgdG8gYmUgZW5hYmxlZC5cbiAgICovXG4gIGVuYWJsZUhhbmRsZShoYW5kbGU6IEhUTUxFbGVtZW50KSB7XG4gICAgaWYgKHRoaXMuX2Rpc2FibGVkSGFuZGxlcy5oYXMoaGFuZGxlKSkge1xuICAgICAgdGhpcy5fZGlzYWJsZWRIYW5kbGVzLmRlbGV0ZShoYW5kbGUpO1xuICAgICAgdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucyhoYW5kbGUsIHRoaXMuZGlzYWJsZWQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBsYXlvdXQgZGlyZWN0aW9uIG9mIHRoZSBkcmFnZ2FibGUgaXRlbS4gKi9cbiAgd2l0aERpcmVjdGlvbihkaXJlY3Rpb246IERpcmVjdGlvbik6IHRoaXMge1xuICAgIHRoaXMuX2RpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBjb250YWluZXIgdGhhdCB0aGUgaXRlbSBpcyBwYXJ0IG9mLiAqL1xuICBfd2l0aERyb3BDb250YWluZXIoY29udGFpbmVyOiBEcm9wTGlzdFJlZikge1xuICAgIHRoaXMuX2Ryb3BDb250YWluZXIgPSBjb250YWluZXI7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCBwb3NpdGlvbiBpbiBwaXhlbHMgdGhlIGRyYWdnYWJsZSBvdXRzaWRlIG9mIGEgZHJvcCBjb250YWluZXIuXG4gICAqL1xuICBnZXRGcmVlRHJhZ1Bvc2l0aW9uKCk6IFJlYWRvbmx5PFBvaW50PiB7XG4gICAgY29uc3QgcG9zaXRpb24gPSB0aGlzLmlzRHJhZ2dpbmcoKSA/IHRoaXMuX2FjdGl2ZVRyYW5zZm9ybSA6IHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm07XG4gICAgcmV0dXJuIHt4OiBwb3NpdGlvbi54LCB5OiBwb3NpdGlvbi55fTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjdXJyZW50IHBvc2l0aW9uIGluIHBpeGVscyB0aGUgZHJhZ2dhYmxlIG91dHNpZGUgb2YgYSBkcm9wIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHZhbHVlIE5ldyBwb3NpdGlvbiB0byBiZSBzZXQuXG4gICAqL1xuICBzZXRGcmVlRHJhZ1Bvc2l0aW9uKHZhbHVlOiBQb2ludCk6IHRoaXMge1xuICAgIHRoaXMuX2FjdGl2ZVRyYW5zZm9ybSA9IHt4OiAwLCB5OiAwfTtcbiAgICB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtLnggPSB2YWx1ZS54O1xuICAgIHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm0ueSA9IHZhbHVlLnk7XG5cbiAgICBpZiAoIXRoaXMuX2Ryb3BDb250YWluZXIpIHtcbiAgICAgIHRoaXMuX2FwcGx5Um9vdEVsZW1lbnRUcmFuc2Zvcm0odmFsdWUueCwgdmFsdWUueSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY29udGFpbmVyIGludG8gd2hpY2ggdG8gaW5zZXJ0IHRoZSBwcmV2aWV3IGVsZW1lbnQuXG4gICAqIEBwYXJhbSB2YWx1ZSBDb250YWluZXIgaW50byB3aGljaCB0byBpbnNlcnQgdGhlIHByZXZpZXcuXG4gICAqL1xuICB3aXRoUHJldmlld0NvbnRhaW5lcih2YWx1ZTogUHJldmlld0NvbnRhaW5lcik6IHRoaXMge1xuICAgIHRoaXMuX3ByZXZpZXdDb250YWluZXIgPSB2YWx1ZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBVcGRhdGVzIHRoZSBpdGVtJ3Mgc29ydCBvcmRlciBiYXNlZCBvbiB0aGUgbGFzdC1rbm93biBwb2ludGVyIHBvc2l0aW9uLiAqL1xuICBfc29ydEZyb21MYXN0UG9pbnRlclBvc2l0aW9uKCkge1xuICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5fbGFzdEtub3duUG9pbnRlclBvc2l0aW9uO1xuXG4gICAgaWYgKHBvc2l0aW9uICYmIHRoaXMuX2Ryb3BDb250YWluZXIpIHtcbiAgICAgIHRoaXMuX3VwZGF0ZUFjdGl2ZURyb3BDb250YWluZXIodGhpcy5fZ2V0Q29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24ocG9zaXRpb24pLCBwb3NpdGlvbik7XG4gICAgfVxuICB9XG5cbiAgLyoqIFVuc3Vic2NyaWJlcyBmcm9tIHRoZSBnbG9iYWwgc3Vic2NyaXB0aW9ucy4gKi9cbiAgcHJpdmF0ZSBfcmVtb3ZlU3Vic2NyaXB0aW9ucygpIHtcbiAgICB0aGlzLl9wb2ludGVyTW92ZVN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuX3BvaW50ZXJVcFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuX3Njcm9sbFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICB9XG5cbiAgLyoqIERlc3Ryb3lzIHRoZSBwcmV2aWV3IGVsZW1lbnQgYW5kIGl0cyBWaWV3UmVmLiAqL1xuICBwcml2YXRlIF9kZXN0cm95UHJldmlldygpIHtcbiAgICB0aGlzLl9wcmV2aWV3Py5yZW1vdmUoKTtcbiAgICB0aGlzLl9wcmV2aWV3UmVmPy5kZXN0cm95KCk7XG4gICAgdGhpcy5fcHJldmlldyA9IHRoaXMuX3ByZXZpZXdSZWYgPSBudWxsITtcbiAgfVxuXG4gIC8qKiBEZXN0cm95cyB0aGUgcGxhY2Vob2xkZXIgZWxlbWVudCBhbmQgaXRzIFZpZXdSZWYuICovXG4gIHByaXZhdGUgX2Rlc3Ryb3lQbGFjZWhvbGRlcigpIHtcbiAgICB0aGlzLl9wbGFjZWhvbGRlcj8ucmVtb3ZlKCk7XG4gICAgdGhpcy5fcGxhY2Vob2xkZXJSZWY/LmRlc3Ryb3koKTtcbiAgICB0aGlzLl9wbGFjZWhvbGRlciA9IHRoaXMuX3BsYWNlaG9sZGVyUmVmID0gbnVsbCE7XG4gIH1cblxuICAvKiogSGFuZGxlciBmb3IgdGhlIGBtb3VzZWRvd25gL2B0b3VjaHN0YXJ0YCBldmVudHMuICovXG4gIHByaXZhdGUgX3BvaW50ZXJEb3duID0gKGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCkgPT4ge1xuICAgIHRoaXMuYmVmb3JlU3RhcnRlZC5uZXh0KCk7XG5cbiAgICAvLyBEZWxlZ2F0ZSB0aGUgZXZlbnQgYmFzZWQgb24gd2hldGhlciBpdCBzdGFydGVkIGZyb20gYSBoYW5kbGUgb3IgdGhlIGVsZW1lbnQgaXRzZWxmLlxuICAgIGlmICh0aGlzLl9oYW5kbGVzLmxlbmd0aCkge1xuICAgICAgY29uc3QgdGFyZ2V0SGFuZGxlID0gdGhpcy5faGFuZGxlcy5maW5kKGhhbmRsZSA9PiB7XG4gICAgICAgIHJldHVybiBldmVudC50YXJnZXQgJiYgKGV2ZW50LnRhcmdldCA9PT0gaGFuZGxlIHx8IGhhbmRsZS5jb250YWlucyhldmVudC50YXJnZXQgYXMgTm9kZSkpO1xuICAgICAgfSk7XG5cbiAgICAgIGlmICh0YXJnZXRIYW5kbGUgJiYgIXRoaXMuX2Rpc2FibGVkSGFuZGxlcy5oYXModGFyZ2V0SGFuZGxlKSAmJiAhdGhpcy5kaXNhYmxlZCkge1xuICAgICAgICB0aGlzLl9pbml0aWFsaXplRHJhZ1NlcXVlbmNlKHRhcmdldEhhbmRsZSwgZXZlbnQpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIXRoaXMuZGlzYWJsZWQpIHtcbiAgICAgIHRoaXMuX2luaXRpYWxpemVEcmFnU2VxdWVuY2UodGhpcy5fcm9vdEVsZW1lbnQsIGV2ZW50KTtcbiAgICB9XG4gIH07XG5cbiAgLyoqIEhhbmRsZXIgdGhhdCBpcyBpbnZva2VkIHdoZW4gdGhlIHVzZXIgbW92ZXMgdGhlaXIgcG9pbnRlciBhZnRlciB0aGV5J3ZlIGluaXRpYXRlZCBhIGRyYWcuICovXG4gIHByaXZhdGUgX3BvaW50ZXJNb3ZlID0gKGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCkgPT4ge1xuICAgIGNvbnN0IHBvaW50ZXJQb3NpdGlvbiA9IHRoaXMuX2dldFBvaW50ZXJQb3NpdGlvbk9uUGFnZShldmVudCk7XG5cbiAgICBpZiAoIXRoaXMuX2hhc1N0YXJ0ZWREcmFnZ2luZykge1xuICAgICAgY29uc3QgZGlzdGFuY2VYID0gTWF0aC5hYnMocG9pbnRlclBvc2l0aW9uLnggLSB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZS54KTtcbiAgICAgIGNvbnN0IGRpc3RhbmNlWSA9IE1hdGguYWJzKHBvaW50ZXJQb3NpdGlvbi55IC0gdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UueSk7XG4gICAgICBjb25zdCBpc092ZXJUaHJlc2hvbGQgPSBkaXN0YW5jZVggKyBkaXN0YW5jZVkgPj0gdGhpcy5fY29uZmlnLmRyYWdTdGFydFRocmVzaG9sZDtcblxuICAgICAgLy8gT25seSBzdGFydCBkcmFnZ2luZyBhZnRlciB0aGUgdXNlciBoYXMgbW92ZWQgbW9yZSB0aGFuIHRoZSBtaW5pbXVtIGRpc3RhbmNlIGluIGVpdGhlclxuICAgICAgLy8gZGlyZWN0aW9uLiBOb3RlIHRoYXQgdGhpcyBpcyBwcmVmZXJyYWJsZSBvdmVyIGRvaW5nIHNvbWV0aGluZyBsaWtlIGBza2lwKG1pbmltdW1EaXN0YW5jZSlgXG4gICAgICAvLyBpbiB0aGUgYHBvaW50ZXJNb3ZlYCBzdWJzY3JpcHRpb24sIGJlY2F1c2Ugd2UncmUgbm90IGd1YXJhbnRlZWQgdG8gaGF2ZSBvbmUgbW92ZSBldmVudFxuICAgICAgLy8gcGVyIHBpeGVsIG9mIG1vdmVtZW50IChlLmcuIGlmIHRoZSB1c2VyIG1vdmVzIHRoZWlyIHBvaW50ZXIgcXVpY2tseSkuXG4gICAgICBpZiAoaXNPdmVyVGhyZXNob2xkKSB7XG4gICAgICAgIGNvbnN0IGlzRGVsYXlFbGFwc2VkID0gRGF0ZS5ub3coKSA+PSB0aGlzLl9kcmFnU3RhcnRUaW1lICsgdGhpcy5fZ2V0RHJhZ1N0YXJ0RGVsYXkoZXZlbnQpO1xuICAgICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLl9kcm9wQ29udGFpbmVyO1xuXG4gICAgICAgIGlmICghaXNEZWxheUVsYXBzZWQpIHtcbiAgICAgICAgICB0aGlzLl9lbmREcmFnU2VxdWVuY2UoZXZlbnQpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByZXZlbnQgb3RoZXIgZHJhZyBzZXF1ZW5jZXMgZnJvbSBzdGFydGluZyB3aGlsZSBzb21ldGhpbmcgaW4gdGhlIGNvbnRhaW5lciBpcyBzdGlsbFxuICAgICAgICAvLyBiZWluZyBkcmFnZ2VkLiBUaGlzIGNhbiBoYXBwZW4gd2hpbGUgd2UncmUgd2FpdGluZyBmb3IgdGhlIGRyb3AgYW5pbWF0aW9uIHRvIGZpbmlzaFxuICAgICAgICAvLyBhbmQgY2FuIGNhdXNlIGVycm9ycywgYmVjYXVzZSBzb21lIGVsZW1lbnRzIG1pZ2h0IHN0aWxsIGJlIG1vdmluZyBhcm91bmQuXG4gICAgICAgIGlmICghY29udGFpbmVyIHx8ICghY29udGFpbmVyLmlzRHJhZ2dpbmcoKSAmJiAhY29udGFpbmVyLmlzUmVjZWl2aW5nKCkpKSB7XG4gICAgICAgICAgLy8gUHJldmVudCB0aGUgZGVmYXVsdCBhY3Rpb24gYXMgc29vbiBhcyB0aGUgZHJhZ2dpbmcgc2VxdWVuY2UgaXMgY29uc2lkZXJlZCBhc1xuICAgICAgICAgIC8vIFwic3RhcnRlZFwiIHNpbmNlIHdhaXRpbmcgZm9yIHRoZSBuZXh0IGV2ZW50IGNhbiBhbGxvdyB0aGUgZGV2aWNlIHRvIGJlZ2luIHNjcm9sbGluZy5cbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHRoaXMuX2hhc1N0YXJ0ZWREcmFnZ2luZyA9IHRydWU7XG4gICAgICAgICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiB0aGlzLl9zdGFydERyYWdTZXF1ZW5jZShldmVudCkpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBXZSBwcmV2ZW50IHRoZSBkZWZhdWx0IGFjdGlvbiBkb3duIGhlcmUgc28gdGhhdCB3ZSBrbm93IHRoYXQgZHJhZ2dpbmcgaGFzIHN0YXJ0ZWQuIFRoaXMgaXNcbiAgICAvLyBpbXBvcnRhbnQgZm9yIHRvdWNoIGRldmljZXMgd2hlcmUgZG9pbmcgdGhpcyB0b28gZWFybHkgY2FuIHVubmVjZXNzYXJpbHkgYmxvY2sgc2Nyb2xsaW5nLFxuICAgIC8vIGlmIHRoZXJlJ3MgYSBkcmFnZ2luZyBkZWxheS5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgY29uc3QgY29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24gPSB0aGlzLl9nZXRDb25zdHJhaW5lZFBvaW50ZXJQb3NpdGlvbihwb2ludGVyUG9zaXRpb24pO1xuICAgIHRoaXMuX2hhc01vdmVkID0gdHJ1ZTtcbiAgICB0aGlzLl9sYXN0S25vd25Qb2ludGVyUG9zaXRpb24gPSBwb2ludGVyUG9zaXRpb247XG4gICAgdGhpcy5fdXBkYXRlUG9pbnRlckRpcmVjdGlvbkRlbHRhKGNvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uKTtcblxuICAgIGlmICh0aGlzLl9kcm9wQ29udGFpbmVyKSB7XG4gICAgICB0aGlzLl91cGRhdGVBY3RpdmVEcm9wQ29udGFpbmVyKGNvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uLCBwb2ludGVyUG9zaXRpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBhY3RpdmVUcmFuc2Zvcm0gPSB0aGlzLl9hY3RpdmVUcmFuc2Zvcm07XG4gICAgICBhY3RpdmVUcmFuc2Zvcm0ueCA9XG4gICAgICAgIGNvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uLnggLSB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZS54ICsgdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybS54O1xuICAgICAgYWN0aXZlVHJhbnNmb3JtLnkgPVxuICAgICAgICBjb25zdHJhaW5lZFBvaW50ZXJQb3NpdGlvbi55IC0gdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UueSArIHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm0ueTtcblxuICAgICAgdGhpcy5fYXBwbHlSb290RWxlbWVudFRyYW5zZm9ybShhY3RpdmVUcmFuc2Zvcm0ueCwgYWN0aXZlVHJhbnNmb3JtLnkpO1xuICAgIH1cblxuICAgIC8vIFNpbmNlIHRoaXMgZXZlbnQgZ2V0cyBmaXJlZCBmb3IgZXZlcnkgcGl4ZWwgd2hpbGUgZHJhZ2dpbmcsIHdlIG9ubHlcbiAgICAvLyB3YW50IHRvIGZpcmUgaXQgaWYgdGhlIGNvbnN1bWVyIG9wdGVkIGludG8gaXQuIEFsc28gd2UgaGF2ZSB0b1xuICAgIC8vIHJlLWVudGVyIHRoZSB6b25lIGJlY2F1c2Ugd2UgcnVuIGFsbCBvZiB0aGUgZXZlbnRzIG9uIHRoZSBvdXRzaWRlLlxuICAgIGlmICh0aGlzLl9tb3ZlRXZlbnRzLm9ic2VydmVycy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICB0aGlzLl9tb3ZlRXZlbnRzLm5leHQoe1xuICAgICAgICAgIHNvdXJjZTogdGhpcyxcbiAgICAgICAgICBwb2ludGVyUG9zaXRpb246IGNvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uLFxuICAgICAgICAgIGV2ZW50LFxuICAgICAgICAgIGRpc3RhbmNlOiB0aGlzLl9nZXREcmFnRGlzdGFuY2UoY29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24pLFxuICAgICAgICAgIGRlbHRhOiB0aGlzLl9wb2ludGVyRGlyZWN0aW9uRGVsdGEsXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIC8qKiBIYW5kbGVyIHRoYXQgaXMgaW52b2tlZCB3aGVuIHRoZSB1c2VyIGxpZnRzIHRoZWlyIHBvaW50ZXIgdXAsIGFmdGVyIGluaXRpYXRpbmcgYSBkcmFnLiAqL1xuICBwcml2YXRlIF9wb2ludGVyVXAgPSAoZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KSA9PiB7XG4gICAgdGhpcy5fZW5kRHJhZ1NlcXVlbmNlKGV2ZW50KTtcbiAgfTtcblxuICAvKipcbiAgICogQ2xlYXJzIHN1YnNjcmlwdGlvbnMgYW5kIHN0b3BzIHRoZSBkcmFnZ2luZyBzZXF1ZW5jZS5cbiAgICogQHBhcmFtIGV2ZW50IEJyb3dzZXIgZXZlbnQgb2JqZWN0IHRoYXQgZW5kZWQgdGhlIHNlcXVlbmNlLlxuICAgKi9cbiAgcHJpdmF0ZSBfZW5kRHJhZ1NlcXVlbmNlKGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCkge1xuICAgIC8vIE5vdGUgdGhhdCBoZXJlIHdlIHVzZSBgaXNEcmFnZ2luZ2AgZnJvbSB0aGUgc2VydmljZSwgcmF0aGVyIHRoYW4gZnJvbSBgdGhpc2AuXG4gICAgLy8gVGhlIGRpZmZlcmVuY2UgaXMgdGhhdCB0aGUgb25lIGZyb20gdGhlIHNlcnZpY2UgcmVmbGVjdHMgd2hldGhlciBhIGRyYWdnaW5nIHNlcXVlbmNlXG4gICAgLy8gaGFzIGJlZW4gaW5pdGlhdGVkLCB3aGVyZWFzIHRoZSBvbmUgb24gYHRoaXNgIGluY2x1ZGVzIHdoZXRoZXIgdGhlIHVzZXIgaGFzIHBhc3NlZFxuICAgIC8vIHRoZSBtaW5pbXVtIGRyYWdnaW5nIHRocmVzaG9sZC5cbiAgICBpZiAoIXRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuaXNEcmFnZ2luZyh0aGlzKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3JlbW92ZVN1YnNjcmlwdGlvbnMoKTtcbiAgICB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnN0b3BEcmFnZ2luZyh0aGlzKTtcbiAgICB0aGlzLl90b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKCk7XG5cbiAgICBpZiAodGhpcy5faGFuZGxlcykge1xuICAgICAgKHRoaXMuX3Jvb3RFbGVtZW50LnN0eWxlIGFzIERyYWdDU1NTdHlsZURlY2xhcmF0aW9uKS53ZWJraXRUYXBIaWdobGlnaHRDb2xvciA9XG4gICAgICAgIHRoaXMuX3Jvb3RFbGVtZW50VGFwSGlnaGxpZ2h0O1xuICAgIH1cblxuICAgIGlmICghdGhpcy5faGFzU3RhcnRlZERyYWdnaW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5yZWxlYXNlZC5uZXh0KHtzb3VyY2U6IHRoaXMsIGV2ZW50fSk7XG5cbiAgICBpZiAodGhpcy5fZHJvcENvbnRhaW5lcikge1xuICAgICAgLy8gU3RvcCBzY3JvbGxpbmcgaW1tZWRpYXRlbHksIGluc3RlYWQgb2Ygd2FpdGluZyBmb3IgdGhlIGFuaW1hdGlvbiB0byBmaW5pc2guXG4gICAgICB0aGlzLl9kcm9wQ29udGFpbmVyLl9zdG9wU2Nyb2xsaW5nKCk7XG4gICAgICB0aGlzLl9hbmltYXRlUHJldmlld1RvUGxhY2Vob2xkZXIoKS50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5fY2xlYW51cERyYWdBcnRpZmFjdHMoZXZlbnQpO1xuICAgICAgICB0aGlzLl9jbGVhbnVwQ2FjaGVkRGltZW5zaW9ucygpO1xuICAgICAgICB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnN0b3BEcmFnZ2luZyh0aGlzKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBDb252ZXJ0IHRoZSBhY3RpdmUgdHJhbnNmb3JtIGludG8gYSBwYXNzaXZlIG9uZS4gVGhpcyBtZWFucyB0aGF0IG5leHQgdGltZVxuICAgICAgLy8gdGhlIHVzZXIgc3RhcnRzIGRyYWdnaW5nIHRoZSBpdGVtLCBpdHMgcG9zaXRpb24gd2lsbCBiZSBjYWxjdWxhdGVkIHJlbGF0aXZlbHlcbiAgICAgIC8vIHRvIHRoZSBuZXcgcGFzc2l2ZSB0cmFuc2Zvcm0uXG4gICAgICB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtLnggPSB0aGlzLl9hY3RpdmVUcmFuc2Zvcm0ueDtcbiAgICAgIGNvbnN0IHBvaW50ZXJQb3NpdGlvbiA9IHRoaXMuX2dldFBvaW50ZXJQb3NpdGlvbk9uUGFnZShldmVudCk7XG4gICAgICB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtLnkgPSB0aGlzLl9hY3RpdmVUcmFuc2Zvcm0ueTtcbiAgICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICB0aGlzLmVuZGVkLm5leHQoe1xuICAgICAgICAgIHNvdXJjZTogdGhpcyxcbiAgICAgICAgICBkaXN0YW5jZTogdGhpcy5fZ2V0RHJhZ0Rpc3RhbmNlKHBvaW50ZXJQb3NpdGlvbiksXG4gICAgICAgICAgZHJvcFBvaW50OiBwb2ludGVyUG9zaXRpb24sXG4gICAgICAgICAgZXZlbnQsXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICB0aGlzLl9jbGVhbnVwQ2FjaGVkRGltZW5zaW9ucygpO1xuICAgICAgdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5zdG9wRHJhZ2dpbmcodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFN0YXJ0cyB0aGUgZHJhZ2dpbmcgc2VxdWVuY2UuICovXG4gIHByaXZhdGUgX3N0YXJ0RHJhZ1NlcXVlbmNlKGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCkge1xuICAgIGlmIChpc1RvdWNoRXZlbnQoZXZlbnQpKSB7XG4gICAgICB0aGlzLl9sYXN0VG91Y2hFdmVudFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIH1cblxuICAgIHRoaXMuX3RvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMoKTtcblxuICAgIGNvbnN0IGRyb3BDb250YWluZXIgPSB0aGlzLl9kcm9wQ29udGFpbmVyO1xuXG4gICAgaWYgKGRyb3BDb250YWluZXIpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9yb290RWxlbWVudDtcbiAgICAgIGNvbnN0IHBhcmVudCA9IGVsZW1lbnQucGFyZW50Tm9kZSBhcyBIVE1MRWxlbWVudDtcbiAgICAgIGNvbnN0IHBsYWNlaG9sZGVyID0gKHRoaXMuX3BsYWNlaG9sZGVyID0gdGhpcy5fY3JlYXRlUGxhY2Vob2xkZXJFbGVtZW50KCkpO1xuICAgICAgY29uc3QgYW5jaG9yID0gKHRoaXMuX2FuY2hvciA9IHRoaXMuX2FuY2hvciB8fCB0aGlzLl9kb2N1bWVudC5jcmVhdGVDb21tZW50KCcnKSk7XG5cbiAgICAgIC8vIE5lZWRzIHRvIGhhcHBlbiBiZWZvcmUgdGhlIHJvb3QgZWxlbWVudCBpcyBtb3ZlZC5cbiAgICAgIGNvbnN0IHNoYWRvd1Jvb3QgPSB0aGlzLl9nZXRTaGFkb3dSb290KCk7XG5cbiAgICAgIC8vIEluc2VydCBhbiBhbmNob3Igbm9kZSBzbyB0aGF0IHdlIGNhbiByZXN0b3JlIHRoZSBlbGVtZW50J3MgcG9zaXRpb24gaW4gdGhlIERPTS5cbiAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUoYW5jaG9yLCBlbGVtZW50KTtcblxuICAgICAgLy8gVGhlcmUncyBubyByaXNrIG9mIHRyYW5zZm9ybXMgc3RhY2tpbmcgd2hlbiBpbnNpZGUgYSBkcm9wIGNvbnRhaW5lciBzb1xuICAgICAgLy8gd2UgY2FuIGtlZXAgdGhlIGluaXRpYWwgdHJhbnNmb3JtIHVwIHRvIGRhdGUgYW55IHRpbWUgZHJhZ2dpbmcgc3RhcnRzLlxuICAgICAgdGhpcy5faW5pdGlhbFRyYW5zZm9ybSA9IGVsZW1lbnQuc3R5bGUudHJhbnNmb3JtIHx8ICcnO1xuXG4gICAgICAvLyBDcmVhdGUgdGhlIHByZXZpZXcgYWZ0ZXIgdGhlIGluaXRpYWwgdHJhbnNmb3JtIGhhc1xuICAgICAgLy8gYmVlbiBjYWNoZWQsIGJlY2F1c2UgaXQgY2FuIGJlIGFmZmVjdGVkIGJ5IHRoZSB0cmFuc2Zvcm0uXG4gICAgICB0aGlzLl9wcmV2aWV3ID0gdGhpcy5fY3JlYXRlUHJldmlld0VsZW1lbnQoKTtcblxuICAgICAgLy8gV2UgbW92ZSB0aGUgZWxlbWVudCBvdXQgYXQgdGhlIGVuZCBvZiB0aGUgYm9keSBhbmQgd2UgbWFrZSBpdCBoaWRkZW4sIGJlY2F1c2Uga2VlcGluZyBpdCBpblxuICAgICAgLy8gcGxhY2Ugd2lsbCB0aHJvdyBvZmYgdGhlIGNvbnN1bWVyJ3MgYDpsYXN0LWNoaWxkYCBzZWxlY3RvcnMuIFdlIGNhbid0IHJlbW92ZSB0aGUgZWxlbWVudFxuICAgICAgLy8gZnJvbSB0aGUgRE9NIGNvbXBsZXRlbHksIGJlY2F1c2UgaU9TIHdpbGwgc3RvcCBmaXJpbmcgYWxsIHN1YnNlcXVlbnQgZXZlbnRzIGluIHRoZSBjaGFpbi5cbiAgICAgIHRvZ2dsZVZpc2liaWxpdHkoZWxlbWVudCwgZmFsc2UsIGRyYWdJbXBvcnRhbnRQcm9wZXJ0aWVzKTtcbiAgICAgIHRoaXMuX2RvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocGFyZW50LnJlcGxhY2VDaGlsZChwbGFjZWhvbGRlciwgZWxlbWVudCkpO1xuICAgICAgdGhpcy5fZ2V0UHJldmlld0luc2VydGlvblBvaW50KHBhcmVudCwgc2hhZG93Um9vdCkuYXBwZW5kQ2hpbGQodGhpcy5fcHJldmlldyk7XG4gICAgICB0aGlzLnN0YXJ0ZWQubmV4dCh7c291cmNlOiB0aGlzLCBldmVudH0pOyAvLyBFbWl0IGJlZm9yZSBub3RpZnlpbmcgdGhlIGNvbnRhaW5lci5cbiAgICAgIGRyb3BDb250YWluZXIuc3RhcnQoKTtcbiAgICAgIHRoaXMuX2luaXRpYWxDb250YWluZXIgPSBkcm9wQ29udGFpbmVyO1xuICAgICAgdGhpcy5faW5pdGlhbEluZGV4ID0gZHJvcENvbnRhaW5lci5nZXRJdGVtSW5kZXgodGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3RhcnRlZC5uZXh0KHtzb3VyY2U6IHRoaXMsIGV2ZW50fSk7XG4gICAgICB0aGlzLl9pbml0aWFsQ29udGFpbmVyID0gdGhpcy5faW5pdGlhbEluZGV4ID0gdW5kZWZpbmVkITtcbiAgICB9XG5cbiAgICAvLyBJbXBvcnRhbnQgdG8gcnVuIGFmdGVyIHdlJ3ZlIGNhbGxlZCBgc3RhcnRgIG9uIHRoZSBwYXJlbnQgY29udGFpbmVyXG4gICAgLy8gc28gdGhhdCBpdCBoYXMgaGFkIHRpbWUgdG8gcmVzb2x2ZSBpdHMgc2Nyb2xsYWJsZSBwYXJlbnRzLlxuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5jYWNoZShkcm9wQ29udGFpbmVyID8gZHJvcENvbnRhaW5lci5nZXRTY3JvbGxhYmxlUGFyZW50cygpIDogW10pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgdGhlIGRpZmZlcmVudCB2YXJpYWJsZXMgYW5kIHN1YnNjcmlwdGlvbnNcbiAgICogdGhhdCB3aWxsIGJlIG5lY2Vzc2FyeSBmb3IgdGhlIGRyYWdnaW5nIHNlcXVlbmNlLlxuICAgKiBAcGFyYW0gcmVmZXJlbmNlRWxlbWVudCBFbGVtZW50IHRoYXQgc3RhcnRlZCB0aGUgZHJhZyBzZXF1ZW5jZS5cbiAgICogQHBhcmFtIGV2ZW50IEJyb3dzZXIgZXZlbnQgb2JqZWN0IHRoYXQgc3RhcnRlZCB0aGUgc2VxdWVuY2UuXG4gICAqL1xuICBwcml2YXRlIF9pbml0aWFsaXplRHJhZ1NlcXVlbmNlKHJlZmVyZW5jZUVsZW1lbnQ6IEhUTUxFbGVtZW50LCBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpIHtcbiAgICAvLyBTdG9wIHByb3BhZ2F0aW9uIGlmIHRoZSBpdGVtIGlzIGluc2lkZSBhbm90aGVyXG4gICAgLy8gZHJhZ2dhYmxlIHNvIHdlIGRvbid0IHN0YXJ0IG11bHRpcGxlIGRyYWcgc2VxdWVuY2VzLlxuICAgIGlmICh0aGlzLl9wYXJlbnREcmFnUmVmKSB7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG5cbiAgICBjb25zdCBpc0RyYWdnaW5nID0gdGhpcy5pc0RyYWdnaW5nKCk7XG4gICAgY29uc3QgaXNUb3VjaFNlcXVlbmNlID0gaXNUb3VjaEV2ZW50KGV2ZW50KTtcbiAgICBjb25zdCBpc0F1eGlsaWFyeU1vdXNlQnV0dG9uID0gIWlzVG91Y2hTZXF1ZW5jZSAmJiAoZXZlbnQgYXMgTW91c2VFdmVudCkuYnV0dG9uICE9PSAwO1xuICAgIGNvbnN0IHJvb3RFbGVtZW50ID0gdGhpcy5fcm9vdEVsZW1lbnQ7XG4gICAgY29uc3QgdGFyZ2V0ID0gX2dldEV2ZW50VGFyZ2V0KGV2ZW50KTtcbiAgICBjb25zdCBpc1N5bnRoZXRpY0V2ZW50ID1cbiAgICAgICFpc1RvdWNoU2VxdWVuY2UgJiZcbiAgICAgIHRoaXMuX2xhc3RUb3VjaEV2ZW50VGltZSAmJlxuICAgICAgdGhpcy5fbGFzdFRvdWNoRXZlbnRUaW1lICsgTU9VU0VfRVZFTlRfSUdOT1JFX1RJTUUgPiBEYXRlLm5vdygpO1xuICAgIGNvbnN0IGlzRmFrZUV2ZW50ID0gaXNUb3VjaFNlcXVlbmNlXG4gICAgICA/IGlzRmFrZVRvdWNoc3RhcnRGcm9tU2NyZWVuUmVhZGVyKGV2ZW50IGFzIFRvdWNoRXZlbnQpXG4gICAgICA6IGlzRmFrZU1vdXNlZG93bkZyb21TY3JlZW5SZWFkZXIoZXZlbnQgYXMgTW91c2VFdmVudCk7XG5cbiAgICAvLyBJZiB0aGUgZXZlbnQgc3RhcnRlZCBmcm9tIGFuIGVsZW1lbnQgd2l0aCB0aGUgbmF0aXZlIEhUTUwgZHJhZyZkcm9wLCBpdCdsbCBpbnRlcmZlcmVcbiAgICAvLyB3aXRoIG91ciBvd24gZHJhZ2dpbmcgKGUuZy4gYGltZ2AgdGFncyBkbyBpdCBieSBkZWZhdWx0KS4gUHJldmVudCB0aGUgZGVmYXVsdCBhY3Rpb25cbiAgICAvLyB0byBzdG9wIGl0IGZyb20gaGFwcGVuaW5nLiBOb3RlIHRoYXQgcHJldmVudGluZyBvbiBgZHJhZ3N0YXJ0YCBhbHNvIHNlZW1zIHRvIHdvcmssIGJ1dFxuICAgIC8vIGl0J3MgZmxha3kgYW5kIGl0IGZhaWxzIGlmIHRoZSB1c2VyIGRyYWdzIGl0IGF3YXkgcXVpY2tseS4gQWxzbyBub3RlIHRoYXQgd2Ugb25seSB3YW50XG4gICAgLy8gdG8gZG8gdGhpcyBmb3IgYG1vdXNlZG93bmAgc2luY2UgZG9pbmcgdGhlIHNhbWUgZm9yIGB0b3VjaHN0YXJ0YCB3aWxsIHN0b3AgYW55IGBjbGlja2BcbiAgICAvLyBldmVudHMgZnJvbSBmaXJpbmcgb24gdG91Y2ggZGV2aWNlcy5cbiAgICBpZiAodGFyZ2V0ICYmICh0YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmRyYWdnYWJsZSAmJiBldmVudC50eXBlID09PSAnbW91c2Vkb3duJykge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICAvLyBBYm9ydCBpZiB0aGUgdXNlciBpcyBhbHJlYWR5IGRyYWdnaW5nIG9yIGlzIHVzaW5nIGEgbW91c2UgYnV0dG9uIG90aGVyIHRoYW4gdGhlIHByaW1hcnkgb25lLlxuICAgIGlmIChpc0RyYWdnaW5nIHx8IGlzQXV4aWxpYXJ5TW91c2VCdXR0b24gfHwgaXNTeW50aGV0aWNFdmVudCB8fCBpc0Zha2VFdmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIElmIHdlJ3ZlIGdvdCBoYW5kbGVzLCB3ZSBuZWVkIHRvIGRpc2FibGUgdGhlIHRhcCBoaWdobGlnaHQgb24gdGhlIGVudGlyZSByb290IGVsZW1lbnQsXG4gICAgLy8gb3RoZXJ3aXNlIGlPUyB3aWxsIHN0aWxsIGFkZCBpdCwgZXZlbiB0aG91Z2ggYWxsIHRoZSBkcmFnIGludGVyYWN0aW9ucyBvbiB0aGUgaGFuZGxlXG4gICAgLy8gYXJlIGRpc2FibGVkLlxuICAgIGlmICh0aGlzLl9oYW5kbGVzLmxlbmd0aCkge1xuICAgICAgY29uc3Qgcm9vdFN0eWxlcyA9IHJvb3RFbGVtZW50LnN0eWxlIGFzIERyYWdDU1NTdHlsZURlY2xhcmF0aW9uO1xuICAgICAgdGhpcy5fcm9vdEVsZW1lbnRUYXBIaWdobGlnaHQgPSByb290U3R5bGVzLndlYmtpdFRhcEhpZ2hsaWdodENvbG9yIHx8ICcnO1xuICAgICAgcm9vdFN0eWxlcy53ZWJraXRUYXBIaWdobGlnaHRDb2xvciA9ICd0cmFuc3BhcmVudCc7XG4gICAgfVxuXG4gICAgdGhpcy5faGFzU3RhcnRlZERyYWdnaW5nID0gdGhpcy5faGFzTW92ZWQgPSBmYWxzZTtcblxuICAgIC8vIEF2b2lkIG11bHRpcGxlIHN1YnNjcmlwdGlvbnMgYW5kIG1lbW9yeSBsZWFrcyB3aGVuIG11bHRpIHRvdWNoXG4gICAgLy8gKGlzRHJhZ2dpbmcgY2hlY2sgYWJvdmUgaXNuJ3QgZW5vdWdoIGJlY2F1c2Ugb2YgcG9zc2libGUgdGVtcG9yYWwgYW5kL29yIGRpbWVuc2lvbmFsIGRlbGF5cylcbiAgICB0aGlzLl9yZW1vdmVTdWJzY3JpcHRpb25zKCk7XG4gICAgdGhpcy5fcG9pbnRlck1vdmVTdWJzY3JpcHRpb24gPSB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnBvaW50ZXJNb3ZlLnN1YnNjcmliZSh0aGlzLl9wb2ludGVyTW92ZSk7XG4gICAgdGhpcy5fcG9pbnRlclVwU3Vic2NyaXB0aW9uID0gdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5wb2ludGVyVXAuc3Vic2NyaWJlKHRoaXMuX3BvaW50ZXJVcCk7XG4gICAgdGhpcy5fc2Nyb2xsU3Vic2NyaXB0aW9uID0gdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeVxuICAgICAgLnNjcm9sbGVkKHRoaXMuX2dldFNoYWRvd1Jvb3QoKSlcbiAgICAgIC5zdWJzY3JpYmUoc2Nyb2xsRXZlbnQgPT4gdGhpcy5fdXBkYXRlT25TY3JvbGwoc2Nyb2xsRXZlbnQpKTtcblxuICAgIGlmICh0aGlzLl9ib3VuZGFyeUVsZW1lbnQpIHtcbiAgICAgIHRoaXMuX2JvdW5kYXJ5UmVjdCA9IGdldE11dGFibGVDbGllbnRSZWN0KHRoaXMuX2JvdW5kYXJ5RWxlbWVudCk7XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgaGF2ZSBhIGN1c3RvbSBwcmV2aWV3IHdlIGNhbid0IGtub3cgYWhlYWQgb2YgdGltZSBob3cgbGFyZ2UgaXQnbGwgYmUgc28gd2UgcG9zaXRpb25cbiAgICAvLyBpdCBuZXh0IHRvIHRoZSBjdXJzb3IuIFRoZSBleGNlcHRpb24gaXMgd2hlbiB0aGUgY29uc3VtZXIgaGFzIG9wdGVkIGludG8gbWFraW5nIHRoZSBwcmV2aWV3XG4gICAgLy8gdGhlIHNhbWUgc2l6ZSBhcyB0aGUgcm9vdCBlbGVtZW50LCBpbiB3aGljaCBjYXNlIHdlIGRvIGtub3cgdGhlIHNpemUuXG4gICAgY29uc3QgcHJldmlld1RlbXBsYXRlID0gdGhpcy5fcHJldmlld1RlbXBsYXRlO1xuICAgIHRoaXMuX3BpY2t1cFBvc2l0aW9uSW5FbGVtZW50ID1cbiAgICAgIHByZXZpZXdUZW1wbGF0ZSAmJiBwcmV2aWV3VGVtcGxhdGUudGVtcGxhdGUgJiYgIXByZXZpZXdUZW1wbGF0ZS5tYXRjaFNpemVcbiAgICAgICAgPyB7eDogMCwgeTogMH1cbiAgICAgICAgOiB0aGlzLl9nZXRQb2ludGVyUG9zaXRpb25JbkVsZW1lbnQocmVmZXJlbmNlRWxlbWVudCwgZXZlbnQpO1xuICAgIGNvbnN0IHBvaW50ZXJQb3NpdGlvbiA9XG4gICAgICAodGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UgPVxuICAgICAgdGhpcy5fbGFzdEtub3duUG9pbnRlclBvc2l0aW9uID1cbiAgICAgICAgdGhpcy5fZ2V0UG9pbnRlclBvc2l0aW9uT25QYWdlKGV2ZW50KSk7XG4gICAgdGhpcy5fcG9pbnRlckRpcmVjdGlvbkRlbHRhID0ge3g6IDAsIHk6IDB9O1xuICAgIHRoaXMuX3BvaW50ZXJQb3NpdGlvbkF0TGFzdERpcmVjdGlvbkNoYW5nZSA9IHt4OiBwb2ludGVyUG9zaXRpb24ueCwgeTogcG9pbnRlclBvc2l0aW9uLnl9O1xuICAgIHRoaXMuX2RyYWdTdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuc3RhcnREcmFnZ2luZyh0aGlzLCBldmVudCk7XG4gIH1cblxuICAvKiogQ2xlYW5zIHVwIHRoZSBET00gYXJ0aWZhY3RzIHRoYXQgd2VyZSBhZGRlZCB0byBmYWNpbGl0YXRlIHRoZSBlbGVtZW50IGJlaW5nIGRyYWdnZWQuICovXG4gIHByaXZhdGUgX2NsZWFudXBEcmFnQXJ0aWZhY3RzKGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCkge1xuICAgIC8vIFJlc3RvcmUgdGhlIGVsZW1lbnQncyB2aXNpYmlsaXR5IGFuZCBpbnNlcnQgaXQgYXQgaXRzIG9sZCBwb3NpdGlvbiBpbiB0aGUgRE9NLlxuICAgIC8vIEl0J3MgaW1wb3J0YW50IHRoYXQgd2UgbWFpbnRhaW4gdGhlIHBvc2l0aW9uLCBiZWNhdXNlIG1vdmluZyB0aGUgZWxlbWVudCBhcm91bmQgaW4gdGhlIERPTVxuICAgIC8vIGNhbiB0aHJvdyBvZmYgYE5nRm9yYCB3aGljaCBkb2VzIHNtYXJ0IGRpZmZpbmcgYW5kIHJlLWNyZWF0ZXMgZWxlbWVudHMgb25seSB3aGVuIG5lY2Vzc2FyeSxcbiAgICAvLyB3aGlsZSBtb3ZpbmcgdGhlIGV4aXN0aW5nIGVsZW1lbnRzIGluIGFsbCBvdGhlciBjYXNlcy5cbiAgICB0b2dnbGVWaXNpYmlsaXR5KHRoaXMuX3Jvb3RFbGVtZW50LCB0cnVlLCBkcmFnSW1wb3J0YW50UHJvcGVydGllcyk7XG4gICAgdGhpcy5fYW5jaG9yLnBhcmVudE5vZGUhLnJlcGxhY2VDaGlsZCh0aGlzLl9yb290RWxlbWVudCwgdGhpcy5fYW5jaG9yKTtcblxuICAgIHRoaXMuX2Rlc3Ryb3lQcmV2aWV3KCk7XG4gICAgdGhpcy5fZGVzdHJveVBsYWNlaG9sZGVyKCk7XG4gICAgdGhpcy5fYm91bmRhcnlSZWN0ID0gdGhpcy5fcHJldmlld1JlY3QgPSB0aGlzLl9pbml0aWFsVHJhbnNmb3JtID0gdW5kZWZpbmVkO1xuXG4gICAgLy8gUmUtZW50ZXIgdGhlIE5nWm9uZSBzaW5jZSB3ZSBib3VuZCBgZG9jdW1lbnRgIGV2ZW50cyBvbiB0aGUgb3V0c2lkZS5cbiAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuX2Ryb3BDb250YWluZXIhO1xuICAgICAgY29uc3QgY3VycmVudEluZGV4ID0gY29udGFpbmVyLmdldEl0ZW1JbmRleCh0aGlzKTtcbiAgICAgIGNvbnN0IHBvaW50ZXJQb3NpdGlvbiA9IHRoaXMuX2dldFBvaW50ZXJQb3NpdGlvbk9uUGFnZShldmVudCk7XG4gICAgICBjb25zdCBkaXN0YW5jZSA9IHRoaXMuX2dldERyYWdEaXN0YW5jZShwb2ludGVyUG9zaXRpb24pO1xuICAgICAgY29uc3QgaXNQb2ludGVyT3ZlckNvbnRhaW5lciA9IGNvbnRhaW5lci5faXNPdmVyQ29udGFpbmVyKFxuICAgICAgICBwb2ludGVyUG9zaXRpb24ueCxcbiAgICAgICAgcG9pbnRlclBvc2l0aW9uLnksXG4gICAgICApO1xuXG4gICAgICB0aGlzLmVuZGVkLm5leHQoe3NvdXJjZTogdGhpcywgZGlzdGFuY2UsIGRyb3BQb2ludDogcG9pbnRlclBvc2l0aW9uLCBldmVudH0pO1xuICAgICAgdGhpcy5kcm9wcGVkLm5leHQoe1xuICAgICAgICBpdGVtOiB0aGlzLFxuICAgICAgICBjdXJyZW50SW5kZXgsXG4gICAgICAgIHByZXZpb3VzSW5kZXg6IHRoaXMuX2luaXRpYWxJbmRleCxcbiAgICAgICAgY29udGFpbmVyOiBjb250YWluZXIsXG4gICAgICAgIHByZXZpb3VzQ29udGFpbmVyOiB0aGlzLl9pbml0aWFsQ29udGFpbmVyLFxuICAgICAgICBpc1BvaW50ZXJPdmVyQ29udGFpbmVyLFxuICAgICAgICBkaXN0YW5jZSxcbiAgICAgICAgZHJvcFBvaW50OiBwb2ludGVyUG9zaXRpb24sXG4gICAgICAgIGV2ZW50LFxuICAgICAgfSk7XG4gICAgICBjb250YWluZXIuZHJvcChcbiAgICAgICAgdGhpcyxcbiAgICAgICAgY3VycmVudEluZGV4LFxuICAgICAgICB0aGlzLl9pbml0aWFsSW5kZXgsXG4gICAgICAgIHRoaXMuX2luaXRpYWxDb250YWluZXIsXG4gICAgICAgIGlzUG9pbnRlck92ZXJDb250YWluZXIsXG4gICAgICAgIGRpc3RhbmNlLFxuICAgICAgICBwb2ludGVyUG9zaXRpb24sXG4gICAgICApO1xuICAgICAgdGhpcy5fZHJvcENvbnRhaW5lciA9IHRoaXMuX2luaXRpYWxDb250YWluZXI7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgaXRlbSdzIHBvc2l0aW9uIGluIGl0cyBkcm9wIGNvbnRhaW5lciwgb3IgbW92ZXMgaXRcbiAgICogaW50byBhIG5ldyBvbmUsIGRlcGVuZGluZyBvbiBpdHMgY3VycmVudCBkcmFnIHBvc2l0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBfdXBkYXRlQWN0aXZlRHJvcENvbnRhaW5lcih7eCwgeX06IFBvaW50LCB7eDogcmF3WCwgeTogcmF3WX06IFBvaW50KSB7XG4gICAgLy8gRHJvcCBjb250YWluZXIgdGhhdCBkcmFnZ2FibGUgaGFzIGJlZW4gbW92ZWQgaW50by5cbiAgICBsZXQgbmV3Q29udGFpbmVyID0gdGhpcy5faW5pdGlhbENvbnRhaW5lci5fZ2V0U2libGluZ0NvbnRhaW5lckZyb21Qb3NpdGlvbih0aGlzLCB4LCB5KTtcblxuICAgIC8vIElmIHdlIGNvdWxkbid0IGZpbmQgYSBuZXcgY29udGFpbmVyIHRvIG1vdmUgdGhlIGl0ZW0gaW50bywgYW5kIHRoZSBpdGVtIGhhcyBsZWZ0IGl0c1xuICAgIC8vIGluaXRpYWwgY29udGFpbmVyLCBjaGVjayB3aGV0aGVyIHRoZSBpdCdzIG92ZXIgdGhlIGluaXRpYWwgY29udGFpbmVyLiBUaGlzIGhhbmRsZXMgdGhlXG4gICAgLy8gY2FzZSB3aGVyZSB0d28gY29udGFpbmVycyBhcmUgY29ubmVjdGVkIG9uZSB3YXkgYW5kIHRoZSB1c2VyIHRyaWVzIHRvIHVuZG8gZHJhZ2dpbmcgYW5cbiAgICAvLyBpdGVtIGludG8gYSBuZXcgY29udGFpbmVyLlxuICAgIGlmIChcbiAgICAgICFuZXdDb250YWluZXIgJiZcbiAgICAgIHRoaXMuX2Ryb3BDb250YWluZXIgIT09IHRoaXMuX2luaXRpYWxDb250YWluZXIgJiZcbiAgICAgIHRoaXMuX2luaXRpYWxDb250YWluZXIuX2lzT3ZlckNvbnRhaW5lcih4LCB5KVxuICAgICkge1xuICAgICAgbmV3Q29udGFpbmVyID0gdGhpcy5faW5pdGlhbENvbnRhaW5lcjtcbiAgICB9XG5cbiAgICBpZiAobmV3Q29udGFpbmVyICYmIG5ld0NvbnRhaW5lciAhPT0gdGhpcy5fZHJvcENvbnRhaW5lcikge1xuICAgICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiB7XG4gICAgICAgIC8vIE5vdGlmeSB0aGUgb2xkIGNvbnRhaW5lciB0aGF0IHRoZSBpdGVtIGhhcyBsZWZ0LlxuICAgICAgICB0aGlzLmV4aXRlZC5uZXh0KHtpdGVtOiB0aGlzLCBjb250YWluZXI6IHRoaXMuX2Ryb3BDb250YWluZXIhfSk7XG4gICAgICAgIHRoaXMuX2Ryb3BDb250YWluZXIhLmV4aXQodGhpcyk7XG4gICAgICAgIC8vIE5vdGlmeSB0aGUgbmV3IGNvbnRhaW5lciB0aGF0IHRoZSBpdGVtIGhhcyBlbnRlcmVkLlxuICAgICAgICB0aGlzLl9kcm9wQ29udGFpbmVyID0gbmV3Q29udGFpbmVyITtcbiAgICAgICAgdGhpcy5fZHJvcENvbnRhaW5lci5lbnRlcihcbiAgICAgICAgICB0aGlzLFxuICAgICAgICAgIHgsXG4gICAgICAgICAgeSxcbiAgICAgICAgICBuZXdDb250YWluZXIgPT09IHRoaXMuX2luaXRpYWxDb250YWluZXIgJiZcbiAgICAgICAgICAgIC8vIElmIHdlJ3JlIHJlLWVudGVyaW5nIHRoZSBpbml0aWFsIGNvbnRhaW5lciBhbmQgc29ydGluZyBpcyBkaXNhYmxlZCxcbiAgICAgICAgICAgIC8vIHB1dCBpdGVtIHRoZSBpbnRvIGl0cyBzdGFydGluZyBpbmRleCB0byBiZWdpbiB3aXRoLlxuICAgICAgICAgICAgbmV3Q29udGFpbmVyLnNvcnRpbmdEaXNhYmxlZFxuICAgICAgICAgICAgPyB0aGlzLl9pbml0aWFsSW5kZXhcbiAgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICApO1xuICAgICAgICB0aGlzLmVudGVyZWQubmV4dCh7XG4gICAgICAgICAgaXRlbTogdGhpcyxcbiAgICAgICAgICBjb250YWluZXI6IG5ld0NvbnRhaW5lciEsXG4gICAgICAgICAgY3VycmVudEluZGV4OiBuZXdDb250YWluZXIhLmdldEl0ZW1JbmRleCh0aGlzKSxcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBEcmFnZ2luZyBtYXkgaGF2ZSBiZWVuIGludGVycnVwdGVkIGFzIGEgcmVzdWx0IG9mIHRoZSBldmVudHMgYWJvdmUuXG4gICAgaWYgKHRoaXMuaXNEcmFnZ2luZygpKSB7XG4gICAgICB0aGlzLl9kcm9wQ29udGFpbmVyIS5fc3RhcnRTY3JvbGxpbmdJZk5lY2Vzc2FyeShyYXdYLCByYXdZKTtcbiAgICAgIHRoaXMuX2Ryb3BDb250YWluZXIhLl9zb3J0SXRlbSh0aGlzLCB4LCB5LCB0aGlzLl9wb2ludGVyRGlyZWN0aW9uRGVsdGEpO1xuICAgICAgdGhpcy5fYXBwbHlQcmV2aWV3VHJhbnNmb3JtKFxuICAgICAgICB4IC0gdGhpcy5fcGlja3VwUG9zaXRpb25JbkVsZW1lbnQueCxcbiAgICAgICAgeSAtIHRoaXMuX3BpY2t1cFBvc2l0aW9uSW5FbGVtZW50LnksXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIHRoZSBlbGVtZW50IHRoYXQgd2lsbCBiZSByZW5kZXJlZCBuZXh0IHRvIHRoZSB1c2VyJ3MgcG9pbnRlclxuICAgKiBhbmQgd2lsbCBiZSB1c2VkIGFzIGEgcHJldmlldyBvZiB0aGUgZWxlbWVudCB0aGF0IGlzIGJlaW5nIGRyYWdnZWQuXG4gICAqL1xuICBwcml2YXRlIF9jcmVhdGVQcmV2aWV3RWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3QgcHJldmlld0NvbmZpZyA9IHRoaXMuX3ByZXZpZXdUZW1wbGF0ZTtcbiAgICBjb25zdCBwcmV2aWV3Q2xhc3MgPSB0aGlzLnByZXZpZXdDbGFzcztcbiAgICBjb25zdCBwcmV2aWV3VGVtcGxhdGUgPSBwcmV2aWV3Q29uZmlnID8gcHJldmlld0NvbmZpZy50ZW1wbGF0ZSA6IG51bGw7XG4gICAgbGV0IHByZXZpZXc6IEhUTUxFbGVtZW50O1xuXG4gICAgaWYgKHByZXZpZXdUZW1wbGF0ZSAmJiBwcmV2aWV3Q29uZmlnKSB7XG4gICAgICAvLyBNZWFzdXJlIHRoZSBlbGVtZW50IGJlZm9yZSB3ZSd2ZSBpbnNlcnRlZCB0aGUgcHJldmlld1xuICAgICAgLy8gc2luY2UgdGhlIGluc2VydGlvbiBjb3VsZCB0aHJvdyBvZmYgdGhlIG1lYXN1cmVtZW50LlxuICAgICAgY29uc3Qgcm9vdFJlY3QgPSBwcmV2aWV3Q29uZmlnLm1hdGNoU2l6ZSA/IHRoaXMuX3Jvb3RFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpIDogbnVsbDtcbiAgICAgIGNvbnN0IHZpZXdSZWYgPSBwcmV2aWV3Q29uZmlnLnZpZXdDb250YWluZXIuY3JlYXRlRW1iZWRkZWRWaWV3KFxuICAgICAgICBwcmV2aWV3VGVtcGxhdGUsXG4gICAgICAgIHByZXZpZXdDb25maWcuY29udGV4dCxcbiAgICAgICk7XG4gICAgICB2aWV3UmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIHByZXZpZXcgPSBnZXRSb290Tm9kZSh2aWV3UmVmLCB0aGlzLl9kb2N1bWVudCk7XG4gICAgICB0aGlzLl9wcmV2aWV3UmVmID0gdmlld1JlZjtcbiAgICAgIGlmIChwcmV2aWV3Q29uZmlnLm1hdGNoU2l6ZSkge1xuICAgICAgICBtYXRjaEVsZW1lbnRTaXplKHByZXZpZXcsIHJvb3RSZWN0ISk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcmV2aWV3LnN0eWxlLnRyYW5zZm9ybSA9IGdldFRyYW5zZm9ybShcbiAgICAgICAgICB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZS54LFxuICAgICAgICAgIHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLnksXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9yb290RWxlbWVudDtcbiAgICAgIHByZXZpZXcgPSBkZWVwQ2xvbmVOb2RlKGVsZW1lbnQpO1xuICAgICAgbWF0Y2hFbGVtZW50U2l6ZShwcmV2aWV3LCBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpKTtcblxuICAgICAgaWYgKHRoaXMuX2luaXRpYWxUcmFuc2Zvcm0pIHtcbiAgICAgICAgcHJldmlldy5zdHlsZS50cmFuc2Zvcm0gPSB0aGlzLl9pbml0aWFsVHJhbnNmb3JtO1xuICAgICAgfVxuICAgIH1cblxuICAgIGV4dGVuZFN0eWxlcyhcbiAgICAgIHByZXZpZXcuc3R5bGUsXG4gICAgICB7XG4gICAgICAgIC8vIEl0J3MgaW1wb3J0YW50IHRoYXQgd2UgZGlzYWJsZSB0aGUgcG9pbnRlciBldmVudHMgb24gdGhlIHByZXZpZXcsIGJlY2F1c2VcbiAgICAgICAgLy8gaXQgY2FuIHRocm93IG9mZiB0aGUgYGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnRgIGNhbGxzIGluIHRoZSBgQ2RrRHJvcExpc3RgLlxuICAgICAgICAncG9pbnRlci1ldmVudHMnOiAnbm9uZScsXG4gICAgICAgIC8vIFdlIGhhdmUgdG8gcmVzZXQgdGhlIG1hcmdpbiwgYmVjYXVzZSBpdCBjYW4gdGhyb3cgb2ZmIHBvc2l0aW9uaW5nIHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydC5cbiAgICAgICAgJ21hcmdpbic6ICcwJyxcbiAgICAgICAgJ3Bvc2l0aW9uJzogJ2ZpeGVkJyxcbiAgICAgICAgJ3RvcCc6ICcwJyxcbiAgICAgICAgJ2xlZnQnOiAnMCcsXG4gICAgICAgICd6LWluZGV4JzogYCR7dGhpcy5fY29uZmlnLnpJbmRleCB8fCAxMDAwfWAsXG4gICAgICB9LFxuICAgICAgZHJhZ0ltcG9ydGFudFByb3BlcnRpZXMsXG4gICAgKTtcblxuICAgIHRvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMocHJldmlldywgZmFsc2UpO1xuICAgIHByZXZpZXcuY2xhc3NMaXN0LmFkZCgnY2RrLWRyYWctcHJldmlldycpO1xuICAgIHByZXZpZXcuc2V0QXR0cmlidXRlKCdkaXInLCB0aGlzLl9kaXJlY3Rpb24pO1xuXG4gICAgaWYgKHByZXZpZXdDbGFzcykge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkocHJldmlld0NsYXNzKSkge1xuICAgICAgICBwcmV2aWV3Q2xhc3MuZm9yRWFjaChjbGFzc05hbWUgPT4gcHJldmlldy5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJldmlldy5jbGFzc0xpc3QuYWRkKHByZXZpZXdDbGFzcyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHByZXZpZXc7XG4gIH1cblxuICAvKipcbiAgICogQW5pbWF0ZXMgdGhlIHByZXZpZXcgZWxlbWVudCBmcm9tIGl0cyBjdXJyZW50IHBvc2l0aW9uIHRvIHRoZSBsb2NhdGlvbiBvZiB0aGUgZHJvcCBwbGFjZWhvbGRlci5cbiAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIGFuaW1hdGlvbiBjb21wbGV0ZXMuXG4gICAqL1xuICBwcml2YXRlIF9hbmltYXRlUHJldmlld1RvUGxhY2Vob2xkZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gSWYgdGhlIHVzZXIgaGFzbid0IG1vdmVkIHlldCwgdGhlIHRyYW5zaXRpb25lbmQgZXZlbnQgd29uJ3QgZmlyZS5cbiAgICBpZiAoIXRoaXMuX2hhc01vdmVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgY29uc3QgcGxhY2Vob2xkZXJSZWN0ID0gdGhpcy5fcGxhY2Vob2xkZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAvLyBBcHBseSB0aGUgY2xhc3MgdGhhdCBhZGRzIGEgdHJhbnNpdGlvbiB0byB0aGUgcHJldmlldy5cbiAgICB0aGlzLl9wcmV2aWV3LmNsYXNzTGlzdC5hZGQoJ2Nkay1kcmFnLWFuaW1hdGluZycpO1xuXG4gICAgLy8gTW92ZSB0aGUgcHJldmlldyB0byB0aGUgcGxhY2Vob2xkZXIgcG9zaXRpb24uXG4gICAgdGhpcy5fYXBwbHlQcmV2aWV3VHJhbnNmb3JtKHBsYWNlaG9sZGVyUmVjdC5sZWZ0LCBwbGFjZWhvbGRlclJlY3QudG9wKTtcblxuICAgIC8vIElmIHRoZSBlbGVtZW50IGRvZXNuJ3QgaGF2ZSBhIGB0cmFuc2l0aW9uYCwgdGhlIGB0cmFuc2l0aW9uZW5kYCBldmVudCB3b24ndCBmaXJlLiBTaW5jZVxuICAgIC8vIHdlIG5lZWQgdG8gdHJpZ2dlciBhIHN0eWxlIHJlY2FsY3VsYXRpb24gaW4gb3JkZXIgZm9yIHRoZSBgY2RrLWRyYWctYW5pbWF0aW5nYCBjbGFzcyB0b1xuICAgIC8vIGFwcGx5IGl0cyBzdHlsZSwgd2UgdGFrZSBhZHZhbnRhZ2Ugb2YgdGhlIGF2YWlsYWJsZSBpbmZvIHRvIGZpZ3VyZSBvdXQgd2hldGhlciB3ZSBuZWVkIHRvXG4gICAgLy8gYmluZCB0aGUgZXZlbnQgaW4gdGhlIGZpcnN0IHBsYWNlLlxuICAgIGNvbnN0IGR1cmF0aW9uID0gZ2V0VHJhbnNmb3JtVHJhbnNpdGlvbkR1cmF0aW9uSW5Ncyh0aGlzLl9wcmV2aWV3KTtcblxuICAgIGlmIChkdXJhdGlvbiA9PT0gMCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICBjb25zdCBoYW5kbGVyID0gKChldmVudDogVHJhbnNpdGlvbkV2ZW50KSA9PiB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgIWV2ZW50IHx8XG4gICAgICAgICAgICAoX2dldEV2ZW50VGFyZ2V0KGV2ZW50KSA9PT0gdGhpcy5fcHJldmlldyAmJiBldmVudC5wcm9wZXJ0eU5hbWUgPT09ICd0cmFuc2Zvcm0nKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy5fcHJldmlldz8ucmVtb3ZlRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIGhhbmRsZXIpO1xuICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkgYXMgRXZlbnRMaXN0ZW5lck9yRXZlbnRMaXN0ZW5lck9iamVjdDtcblxuICAgICAgICAvLyBJZiBhIHRyYW5zaXRpb24gaXMgc2hvcnQgZW5vdWdoLCB0aGUgYnJvd3NlciBtaWdodCBub3QgZmlyZSB0aGUgYHRyYW5zaXRpb25lbmRgIGV2ZW50LlxuICAgICAgICAvLyBTaW5jZSB3ZSBrbm93IGhvdyBsb25nIGl0J3Mgc3VwcG9zZWQgdG8gdGFrZSwgYWRkIGEgdGltZW91dCB3aXRoIGEgNTAlIGJ1ZmZlciB0aGF0J2xsXG4gICAgICAgIC8vIGZpcmUgaWYgdGhlIHRyYW5zaXRpb24gaGFzbid0IGNvbXBsZXRlZCB3aGVuIGl0IHdhcyBzdXBwb3NlZCB0by5cbiAgICAgICAgY29uc3QgdGltZW91dCA9IHNldFRpbWVvdXQoaGFuZGxlciBhcyBGdW5jdGlvbiwgZHVyYXRpb24gKiAxLjUpO1xuICAgICAgICB0aGlzLl9wcmV2aWV3LmFkZEV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBoYW5kbGVyKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYW4gZWxlbWVudCB0aGF0IHdpbGwgYmUgc2hvd24gaW5zdGVhZCBvZiB0aGUgY3VycmVudCBlbGVtZW50IHdoaWxlIGRyYWdnaW5nLiAqL1xuICBwcml2YXRlIF9jcmVhdGVQbGFjZWhvbGRlckVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IHBsYWNlaG9sZGVyQ29uZmlnID0gdGhpcy5fcGxhY2Vob2xkZXJUZW1wbGF0ZTtcbiAgICBjb25zdCBwbGFjZWhvbGRlclRlbXBsYXRlID0gcGxhY2Vob2xkZXJDb25maWcgPyBwbGFjZWhvbGRlckNvbmZpZy50ZW1wbGF0ZSA6IG51bGw7XG4gICAgbGV0IHBsYWNlaG9sZGVyOiBIVE1MRWxlbWVudDtcblxuICAgIGlmIChwbGFjZWhvbGRlclRlbXBsYXRlKSB7XG4gICAgICB0aGlzLl9wbGFjZWhvbGRlclJlZiA9IHBsYWNlaG9sZGVyQ29uZmlnIS52aWV3Q29udGFpbmVyLmNyZWF0ZUVtYmVkZGVkVmlldyhcbiAgICAgICAgcGxhY2Vob2xkZXJUZW1wbGF0ZSxcbiAgICAgICAgcGxhY2Vob2xkZXJDb25maWchLmNvbnRleHQsXG4gICAgICApO1xuICAgICAgdGhpcy5fcGxhY2Vob2xkZXJSZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgcGxhY2Vob2xkZXIgPSBnZXRSb290Tm9kZSh0aGlzLl9wbGFjZWhvbGRlclJlZiwgdGhpcy5fZG9jdW1lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwbGFjZWhvbGRlciA9IGRlZXBDbG9uZU5vZGUodGhpcy5fcm9vdEVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8vIFN0b3AgcG9pbnRlciBldmVudHMgb24gdGhlIHByZXZpZXcgc28gdGhlIHVzZXIgY2FuJ3RcbiAgICAvLyBpbnRlcmFjdCB3aXRoIGl0IHdoaWxlIHRoZSBwcmV2aWV3IGlzIGFuaW1hdGluZy5cbiAgICBwbGFjZWhvbGRlci5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuICAgIHBsYWNlaG9sZGVyLmNsYXNzTGlzdC5hZGQoJ2Nkay1kcmFnLXBsYWNlaG9sZGVyJyk7XG4gICAgcmV0dXJuIHBsYWNlaG9sZGVyO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpZ3VyZXMgb3V0IHRoZSBjb29yZGluYXRlcyBhdCB3aGljaCBhbiBlbGVtZW50IHdhcyBwaWNrZWQgdXAuXG4gICAqIEBwYXJhbSByZWZlcmVuY2VFbGVtZW50IEVsZW1lbnQgdGhhdCBpbml0aWF0ZWQgdGhlIGRyYWdnaW5nLlxuICAgKiBAcGFyYW0gZXZlbnQgRXZlbnQgdGhhdCBpbml0aWF0ZWQgdGhlIGRyYWdnaW5nLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0UG9pbnRlclBvc2l0aW9uSW5FbGVtZW50KFxuICAgIHJlZmVyZW5jZUVsZW1lbnQ6IEhUTUxFbGVtZW50LFxuICAgIGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCxcbiAgKTogUG9pbnQge1xuICAgIGNvbnN0IGVsZW1lbnRSZWN0ID0gdGhpcy5fcm9vdEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgY29uc3QgaGFuZGxlRWxlbWVudCA9IHJlZmVyZW5jZUVsZW1lbnQgPT09IHRoaXMuX3Jvb3RFbGVtZW50ID8gbnVsbCA6IHJlZmVyZW5jZUVsZW1lbnQ7XG4gICAgY29uc3QgcmVmZXJlbmNlUmVjdCA9IGhhbmRsZUVsZW1lbnQgPyBoYW5kbGVFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpIDogZWxlbWVudFJlY3Q7XG4gICAgY29uc3QgcG9pbnQgPSBpc1RvdWNoRXZlbnQoZXZlbnQpID8gZXZlbnQudGFyZ2V0VG91Y2hlc1swXSA6IGV2ZW50O1xuICAgIGNvbnN0IHNjcm9sbFBvc2l0aW9uID0gdGhpcy5fZ2V0Vmlld3BvcnRTY3JvbGxQb3NpdGlvbigpO1xuICAgIGNvbnN0IHggPSBwb2ludC5wYWdlWCAtIHJlZmVyZW5jZVJlY3QubGVmdCAtIHNjcm9sbFBvc2l0aW9uLmxlZnQ7XG4gICAgY29uc3QgeSA9IHBvaW50LnBhZ2VZIC0gcmVmZXJlbmNlUmVjdC50b3AgLSBzY3JvbGxQb3NpdGlvbi50b3A7XG5cbiAgICByZXR1cm4ge1xuICAgICAgeDogcmVmZXJlbmNlUmVjdC5sZWZ0IC0gZWxlbWVudFJlY3QubGVmdCArIHgsXG4gICAgICB5OiByZWZlcmVuY2VSZWN0LnRvcCAtIGVsZW1lbnRSZWN0LnRvcCArIHksXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBEZXRlcm1pbmVzIHRoZSBwb2ludCBvZiB0aGUgcGFnZSB0aGF0IHdhcyB0b3VjaGVkIGJ5IHRoZSB1c2VyLiAqL1xuICBwcml2YXRlIF9nZXRQb2ludGVyUG9zaXRpb25PblBhZ2UoZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KTogUG9pbnQge1xuICAgIGNvbnN0IHNjcm9sbFBvc2l0aW9uID0gdGhpcy5fZ2V0Vmlld3BvcnRTY3JvbGxQb3NpdGlvbigpO1xuICAgIGNvbnN0IHBvaW50ID0gaXNUb3VjaEV2ZW50KGV2ZW50KVxuICAgICAgPyAvLyBgdG91Y2hlc2Agd2lsbCBiZSBlbXB0eSBmb3Igc3RhcnQvZW5kIGV2ZW50cyBzbyB3ZSBoYXZlIHRvIGZhbGwgYmFjayB0byBgY2hhbmdlZFRvdWNoZXNgLlxuICAgICAgICAvLyBBbHNvIG5vdGUgdGhhdCBvbiByZWFsIGRldmljZXMgd2UncmUgZ3VhcmFudGVlZCBmb3IgZWl0aGVyIGB0b3VjaGVzYCBvciBgY2hhbmdlZFRvdWNoZXNgXG4gICAgICAgIC8vIHRvIGhhdmUgYSB2YWx1ZSwgYnV0IEZpcmVmb3ggaW4gZGV2aWNlIGVtdWxhdGlvbiBtb2RlIGhhcyBhIGJ1ZyB3aGVyZSBib3RoIGNhbiBiZSBlbXB0eVxuICAgICAgICAvLyBmb3IgYHRvdWNoc3RhcnRgIGFuZCBgdG91Y2hlbmRgIHNvIHdlIGZhbGwgYmFjayB0byBhIGR1bW15IG9iamVjdCBpbiBvcmRlciB0byBhdm9pZFxuICAgICAgICAvLyB0aHJvd2luZyBhbiBlcnJvci4gVGhlIHZhbHVlIHJldHVybmVkIGhlcmUgd2lsbCBiZSBpbmNvcnJlY3QsIGJ1dCBzaW5jZSB0aGlzIG9ubHlcbiAgICAgICAgLy8gYnJlYWtzIGluc2lkZSBhIGRldmVsb3BlciB0b29sIGFuZCB0aGUgdmFsdWUgaXMgb25seSB1c2VkIGZvciBzZWNvbmRhcnkgaW5mb3JtYXRpb24sXG4gICAgICAgIC8vIHdlIGNhbiBnZXQgYXdheSB3aXRoIGl0LiBTZWUgaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTYxNTgyNC5cbiAgICAgICAgZXZlbnQudG91Y2hlc1swXSB8fCBldmVudC5jaGFuZ2VkVG91Y2hlc1swXSB8fCB7cGFnZVg6IDAsIHBhZ2VZOiAwfVxuICAgICAgOiBldmVudDtcblxuICAgIGNvbnN0IHggPSBwb2ludC5wYWdlWCAtIHNjcm9sbFBvc2l0aW9uLmxlZnQ7XG4gICAgY29uc3QgeSA9IHBvaW50LnBhZ2VZIC0gc2Nyb2xsUG9zaXRpb24udG9wO1xuXG4gICAgLy8gaWYgZHJhZ2dpbmcgU1ZHIGVsZW1lbnQsIHRyeSB0byBjb252ZXJ0IGZyb20gdGhlIHNjcmVlbiBjb29yZGluYXRlIHN5c3RlbSB0byB0aGUgU1ZHXG4gICAgLy8gY29vcmRpbmF0ZSBzeXN0ZW1cbiAgICBpZiAodGhpcy5fb3duZXJTVkdFbGVtZW50KSB7XG4gICAgICBjb25zdCBzdmdNYXRyaXggPSB0aGlzLl9vd25lclNWR0VsZW1lbnQuZ2V0U2NyZWVuQ1RNKCk7XG4gICAgICBpZiAoc3ZnTWF0cml4KSB7XG4gICAgICAgIGNvbnN0IHN2Z1BvaW50ID0gdGhpcy5fb3duZXJTVkdFbGVtZW50LmNyZWF0ZVNWR1BvaW50KCk7XG4gICAgICAgIHN2Z1BvaW50LnggPSB4O1xuICAgICAgICBzdmdQb2ludC55ID0geTtcbiAgICAgICAgcmV0dXJuIHN2Z1BvaW50Lm1hdHJpeFRyYW5zZm9ybShzdmdNYXRyaXguaW52ZXJzZSgpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge3gsIHl9O1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIHBvaW50ZXIgcG9zaXRpb24gb24gdGhlIHBhZ2UsIGFjY291bnRpbmcgZm9yIGFueSBwb3NpdGlvbiBjb25zdHJhaW50cy4gKi9cbiAgcHJpdmF0ZSBfZ2V0Q29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24ocG9pbnQ6IFBvaW50KTogUG9pbnQge1xuICAgIGNvbnN0IGRyb3BDb250YWluZXJMb2NrID0gdGhpcy5fZHJvcENvbnRhaW5lciA/IHRoaXMuX2Ryb3BDb250YWluZXIubG9ja0F4aXMgOiBudWxsO1xuICAgIGxldCB7eCwgeX0gPSB0aGlzLmNvbnN0cmFpblBvc2l0aW9uID8gdGhpcy5jb25zdHJhaW5Qb3NpdGlvbihwb2ludCwgdGhpcykgOiBwb2ludDtcblxuICAgIGlmICh0aGlzLmxvY2tBeGlzID09PSAneCcgfHwgZHJvcENvbnRhaW5lckxvY2sgPT09ICd4Jykge1xuICAgICAgeSA9IHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLnk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmxvY2tBeGlzID09PSAneScgfHwgZHJvcENvbnRhaW5lckxvY2sgPT09ICd5Jykge1xuICAgICAgeCA9IHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLng7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2JvdW5kYXJ5UmVjdCkge1xuICAgICAgY29uc3Qge3g6IHBpY2t1cFgsIHk6IHBpY2t1cFl9ID0gdGhpcy5fcGlja3VwUG9zaXRpb25JbkVsZW1lbnQ7XG4gICAgICBjb25zdCBib3VuZGFyeVJlY3QgPSB0aGlzLl9ib3VuZGFyeVJlY3Q7XG4gICAgICBjb25zdCB7d2lkdGg6IHByZXZpZXdXaWR0aCwgaGVpZ2h0OiBwcmV2aWV3SGVpZ2h0fSA9IHRoaXMuX2dldFByZXZpZXdSZWN0KCk7XG4gICAgICBjb25zdCBtaW5ZID0gYm91bmRhcnlSZWN0LnRvcCArIHBpY2t1cFk7XG4gICAgICBjb25zdCBtYXhZID0gYm91bmRhcnlSZWN0LmJvdHRvbSAtIChwcmV2aWV3SGVpZ2h0IC0gcGlja3VwWSk7XG4gICAgICBjb25zdCBtaW5YID0gYm91bmRhcnlSZWN0LmxlZnQgKyBwaWNrdXBYO1xuICAgICAgY29uc3QgbWF4WCA9IGJvdW5kYXJ5UmVjdC5yaWdodCAtIChwcmV2aWV3V2lkdGggLSBwaWNrdXBYKTtcblxuICAgICAgeCA9IGNsYW1wKHgsIG1pblgsIG1heFgpO1xuICAgICAgeSA9IGNsYW1wKHksIG1pblksIG1heFkpO1xuICAgIH1cblxuICAgIHJldHVybiB7eCwgeX07XG4gIH1cblxuICAvKiogVXBkYXRlcyB0aGUgY3VycmVudCBkcmFnIGRlbHRhLCBiYXNlZCBvbiB0aGUgdXNlcidzIGN1cnJlbnQgcG9pbnRlciBwb3NpdGlvbiBvbiB0aGUgcGFnZS4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlUG9pbnRlckRpcmVjdGlvbkRlbHRhKHBvaW50ZXJQb3NpdGlvbk9uUGFnZTogUG9pbnQpIHtcbiAgICBjb25zdCB7eCwgeX0gPSBwb2ludGVyUG9zaXRpb25PblBhZ2U7XG4gICAgY29uc3QgZGVsdGEgPSB0aGlzLl9wb2ludGVyRGlyZWN0aW9uRGVsdGE7XG4gICAgY29uc3QgcG9zaXRpb25TaW5jZUxhc3RDaGFuZ2UgPSB0aGlzLl9wb2ludGVyUG9zaXRpb25BdExhc3REaXJlY3Rpb25DaGFuZ2U7XG5cbiAgICAvLyBBbW91bnQgb2YgcGl4ZWxzIHRoZSB1c2VyIGhhcyBkcmFnZ2VkIHNpbmNlIHRoZSBsYXN0IHRpbWUgdGhlIGRpcmVjdGlvbiBjaGFuZ2VkLlxuICAgIGNvbnN0IGNoYW5nZVggPSBNYXRoLmFicyh4IC0gcG9zaXRpb25TaW5jZUxhc3RDaGFuZ2UueCk7XG4gICAgY29uc3QgY2hhbmdlWSA9IE1hdGguYWJzKHkgLSBwb3NpdGlvblNpbmNlTGFzdENoYW5nZS55KTtcblxuICAgIC8vIEJlY2F1c2Ugd2UgaGFuZGxlIHBvaW50ZXIgZXZlbnRzIG9uIGEgcGVyLXBpeGVsIGJhc2lzLCB3ZSBkb24ndCB3YW50IHRoZSBkZWx0YVxuICAgIC8vIHRvIGNoYW5nZSBmb3IgZXZlcnkgcGl4ZWwsIG90aGVyd2lzZSBhbnl0aGluZyB0aGF0IGRlcGVuZHMgb24gaXQgY2FuIGxvb2sgZXJyYXRpYy5cbiAgICAvLyBUbyBtYWtlIHRoZSBkZWx0YSBtb3JlIGNvbnNpc3RlbnQsIHdlIHRyYWNrIGhvdyBtdWNoIHRoZSB1c2VyIGhhcyBtb3ZlZCBzaW5jZSB0aGUgbGFzdFxuICAgIC8vIGRlbHRhIGNoYW5nZSBhbmQgd2Ugb25seSB1cGRhdGUgaXQgYWZ0ZXIgaXQgaGFzIHJlYWNoZWQgYSBjZXJ0YWluIHRocmVzaG9sZC5cbiAgICBpZiAoY2hhbmdlWCA+IHRoaXMuX2NvbmZpZy5wb2ludGVyRGlyZWN0aW9uQ2hhbmdlVGhyZXNob2xkKSB7XG4gICAgICBkZWx0YS54ID0geCA+IHBvc2l0aW9uU2luY2VMYXN0Q2hhbmdlLnggPyAxIDogLTE7XG4gICAgICBwb3NpdGlvblNpbmNlTGFzdENoYW5nZS54ID0geDtcbiAgICB9XG5cbiAgICBpZiAoY2hhbmdlWSA+IHRoaXMuX2NvbmZpZy5wb2ludGVyRGlyZWN0aW9uQ2hhbmdlVGhyZXNob2xkKSB7XG4gICAgICBkZWx0YS55ID0geSA+IHBvc2l0aW9uU2luY2VMYXN0Q2hhbmdlLnkgPyAxIDogLTE7XG4gICAgICBwb3NpdGlvblNpbmNlTGFzdENoYW5nZS55ID0geTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGVsdGE7XG4gIH1cblxuICAvKiogVG9nZ2xlcyB0aGUgbmF0aXZlIGRyYWcgaW50ZXJhY3Rpb25zLCBiYXNlZCBvbiBob3cgbWFueSBoYW5kbGVzIGFyZSByZWdpc3RlcmVkLiAqL1xuICBwcml2YXRlIF90b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKCkge1xuICAgIGlmICghdGhpcy5fcm9vdEVsZW1lbnQgfHwgIXRoaXMuX2hhbmRsZXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzaG91bGRFbmFibGUgPSB0aGlzLl9oYW5kbGVzLmxlbmd0aCA+IDAgfHwgIXRoaXMuaXNEcmFnZ2luZygpO1xuXG4gICAgaWYgKHNob3VsZEVuYWJsZSAhPT0gdGhpcy5fbmF0aXZlSW50ZXJhY3Rpb25zRW5hYmxlZCkge1xuICAgICAgdGhpcy5fbmF0aXZlSW50ZXJhY3Rpb25zRW5hYmxlZCA9IHNob3VsZEVuYWJsZTtcbiAgICAgIHRvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnModGhpcy5fcm9vdEVsZW1lbnQsIHNob3VsZEVuYWJsZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFJlbW92ZXMgdGhlIG1hbnVhbGx5LWFkZGVkIGV2ZW50IGxpc3RlbmVycyBmcm9tIHRoZSByb290IGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3JlbW92ZVJvb3RFbGVtZW50TGlzdGVuZXJzKGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9wb2ludGVyRG93biwgYWN0aXZlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuX3BvaW50ZXJEb3duLCBwYXNzaXZlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignZHJhZ3N0YXJ0JywgcHJldmVudERlZmF1bHQsIGFjdGl2ZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBsaWVzIGEgYHRyYW5zZm9ybWAgdG8gdGhlIHJvb3QgZWxlbWVudCwgdGFraW5nIGludG8gYWNjb3VudCBhbnkgZXhpc3RpbmcgdHJhbnNmb3JtcyBvbiBpdC5cbiAgICogQHBhcmFtIHggTmV3IHRyYW5zZm9ybSB2YWx1ZSBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0geSBOZXcgdHJhbnNmb3JtIHZhbHVlIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqL1xuICBwcml2YXRlIF9hcHBseVJvb3RFbGVtZW50VHJhbnNmb3JtKHg6IG51bWJlciwgeTogbnVtYmVyKSB7XG4gICAgY29uc3QgdHJhbnNmb3JtID0gZ2V0VHJhbnNmb3JtKHgsIHkpO1xuICAgIGNvbnN0IHN0eWxlcyA9IHRoaXMuX3Jvb3RFbGVtZW50LnN0eWxlO1xuXG4gICAgLy8gQ2FjaGUgdGhlIHByZXZpb3VzIHRyYW5zZm9ybSBhbW91bnQgb25seSBhZnRlciB0aGUgZmlyc3QgZHJhZyBzZXF1ZW5jZSwgYmVjYXVzZVxuICAgIC8vIHdlIGRvbid0IHdhbnQgb3VyIG93biB0cmFuc2Zvcm1zIHRvIHN0YWNrIG9uIHRvcCBvZiBlYWNoIG90aGVyLlxuICAgIC8vIFNob3VsZCBiZSBleGNsdWRlZCBub25lIGJlY2F1c2Ugbm9uZSArIHRyYW5zbGF0ZTNkKHgsIHksIHgpIGlzIGludmFsaWQgY3NzXG4gICAgaWYgKHRoaXMuX2luaXRpYWxUcmFuc2Zvcm0gPT0gbnVsbCkge1xuICAgICAgdGhpcy5faW5pdGlhbFRyYW5zZm9ybSA9XG4gICAgICAgIHN0eWxlcy50cmFuc2Zvcm0gJiYgc3R5bGVzLnRyYW5zZm9ybSAhPSAnbm9uZScgPyBzdHlsZXMudHJhbnNmb3JtIDogJyc7XG4gICAgfVxuXG4gICAgLy8gUHJlc2VydmUgdGhlIHByZXZpb3VzIGB0cmFuc2Zvcm1gIHZhbHVlLCBpZiB0aGVyZSB3YXMgb25lLiBOb3RlIHRoYXQgd2UgYXBwbHkgb3VyIG93blxuICAgIC8vIHRyYW5zZm9ybSBiZWZvcmUgdGhlIHVzZXIncywgYmVjYXVzZSB0aGluZ3MgbGlrZSByb3RhdGlvbiBjYW4gYWZmZWN0IHdoaWNoIGRpcmVjdGlvblxuICAgIC8vIHRoZSBlbGVtZW50IHdpbGwgYmUgdHJhbnNsYXRlZCB0b3dhcmRzLlxuICAgIHN0eWxlcy50cmFuc2Zvcm0gPSBjb21iaW5lVHJhbnNmb3Jtcyh0cmFuc2Zvcm0sIHRoaXMuX2luaXRpYWxUcmFuc2Zvcm0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgYSBgdHJhbnNmb3JtYCB0byB0aGUgcHJldmlldywgdGFraW5nIGludG8gYWNjb3VudCBhbnkgZXhpc3RpbmcgdHJhbnNmb3JtcyBvbiBpdC5cbiAgICogQHBhcmFtIHggTmV3IHRyYW5zZm9ybSB2YWx1ZSBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0geSBOZXcgdHJhbnNmb3JtIHZhbHVlIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqL1xuICBwcml2YXRlIF9hcHBseVByZXZpZXdUcmFuc2Zvcm0oeDogbnVtYmVyLCB5OiBudW1iZXIpIHtcbiAgICAvLyBPbmx5IGFwcGx5IHRoZSBpbml0aWFsIHRyYW5zZm9ybSBpZiB0aGUgcHJldmlldyBpcyBhIGNsb25lIG9mIHRoZSBvcmlnaW5hbCBlbGVtZW50LCBvdGhlcndpc2VcbiAgICAvLyBpdCBjb3VsZCBiZSBjb21wbGV0ZWx5IGRpZmZlcmVudCBhbmQgdGhlIHRyYW5zZm9ybSBtaWdodCBub3QgbWFrZSBzZW5zZSBhbnltb3JlLlxuICAgIGNvbnN0IGluaXRpYWxUcmFuc2Zvcm0gPSB0aGlzLl9wcmV2aWV3VGVtcGxhdGU/LnRlbXBsYXRlID8gdW5kZWZpbmVkIDogdGhpcy5faW5pdGlhbFRyYW5zZm9ybTtcbiAgICBjb25zdCB0cmFuc2Zvcm0gPSBnZXRUcmFuc2Zvcm0oeCwgeSk7XG4gICAgdGhpcy5fcHJldmlldy5zdHlsZS50cmFuc2Zvcm0gPSBjb21iaW5lVHJhbnNmb3Jtcyh0cmFuc2Zvcm0sIGluaXRpYWxUcmFuc2Zvcm0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGRpc3RhbmNlIHRoYXQgdGhlIHVzZXIgaGFzIGRyYWdnZWQgZHVyaW5nIHRoZSBjdXJyZW50IGRyYWcgc2VxdWVuY2UuXG4gICAqIEBwYXJhbSBjdXJyZW50UG9zaXRpb24gQ3VycmVudCBwb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIuXG4gICAqL1xuICBwcml2YXRlIF9nZXREcmFnRGlzdGFuY2UoY3VycmVudFBvc2l0aW9uOiBQb2ludCk6IFBvaW50IHtcbiAgICBjb25zdCBwaWNrdXBQb3NpdGlvbiA9IHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlO1xuXG4gICAgaWYgKHBpY2t1cFBvc2l0aW9uKSB7XG4gICAgICByZXR1cm4ge3g6IGN1cnJlbnRQb3NpdGlvbi54IC0gcGlja3VwUG9zaXRpb24ueCwgeTogY3VycmVudFBvc2l0aW9uLnkgLSBwaWNrdXBQb3NpdGlvbi55fTtcbiAgICB9XG5cbiAgICByZXR1cm4ge3g6IDAsIHk6IDB9O1xuICB9XG5cbiAgLyoqIENsZWFucyB1cCBhbnkgY2FjaGVkIGVsZW1lbnQgZGltZW5zaW9ucyB0aGF0IHdlIGRvbid0IG5lZWQgYWZ0ZXIgZHJhZ2dpbmcgaGFzIHN0b3BwZWQuICovXG4gIHByaXZhdGUgX2NsZWFudXBDYWNoZWREaW1lbnNpb25zKCkge1xuICAgIHRoaXMuX2JvdW5kYXJ5UmVjdCA9IHRoaXMuX3ByZXZpZXdSZWN0ID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5jbGVhcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSBlbGVtZW50IGlzIHN0aWxsIGluc2lkZSBpdHMgYm91bmRhcnkgYWZ0ZXIgdGhlIHZpZXdwb3J0IGhhcyBiZWVuIHJlc2l6ZWQuXG4gICAqIElmIG5vdCwgdGhlIHBvc2l0aW9uIGlzIGFkanVzdGVkIHNvIHRoYXQgdGhlIGVsZW1lbnQgZml0cyBhZ2Fpbi5cbiAgICovXG4gIHByaXZhdGUgX2NvbnRhaW5JbnNpZGVCb3VuZGFyeU9uUmVzaXplKCkge1xuICAgIGxldCB7eCwgeX0gPSB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtO1xuXG4gICAgaWYgKCh4ID09PSAwICYmIHkgPT09IDApIHx8IHRoaXMuaXNEcmFnZ2luZygpIHx8ICF0aGlzLl9ib3VuZGFyeUVsZW1lbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBib3VuZGFyeVJlY3QgPSB0aGlzLl9ib3VuZGFyeUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgY29uc3QgZWxlbWVudFJlY3QgPSB0aGlzLl9yb290RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgIC8vIEl0J3MgcG9zc2libGUgdGhhdCB0aGUgZWxlbWVudCBnb3QgaGlkZGVuIGF3YXkgYWZ0ZXIgZHJhZ2dpbmcgKGUuZy4gYnkgc3dpdGNoaW5nIHRvIGFcbiAgICAvLyBkaWZmZXJlbnQgdGFiKS4gRG9uJ3QgZG8gYW55dGhpbmcgaW4gdGhpcyBjYXNlIHNvIHdlIGRvbid0IGNsZWFyIHRoZSB1c2VyJ3MgcG9zaXRpb24uXG4gICAgaWYgKFxuICAgICAgKGJvdW5kYXJ5UmVjdC53aWR0aCA9PT0gMCAmJiBib3VuZGFyeVJlY3QuaGVpZ2h0ID09PSAwKSB8fFxuICAgICAgKGVsZW1lbnRSZWN0LndpZHRoID09PSAwICYmIGVsZW1lbnRSZWN0LmhlaWdodCA9PT0gMClcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBsZWZ0T3ZlcmZsb3cgPSBib3VuZGFyeVJlY3QubGVmdCAtIGVsZW1lbnRSZWN0LmxlZnQ7XG4gICAgY29uc3QgcmlnaHRPdmVyZmxvdyA9IGVsZW1lbnRSZWN0LnJpZ2h0IC0gYm91bmRhcnlSZWN0LnJpZ2h0O1xuICAgIGNvbnN0IHRvcE92ZXJmbG93ID0gYm91bmRhcnlSZWN0LnRvcCAtIGVsZW1lbnRSZWN0LnRvcDtcbiAgICBjb25zdCBib3R0b21PdmVyZmxvdyA9IGVsZW1lbnRSZWN0LmJvdHRvbSAtIGJvdW5kYXJ5UmVjdC5ib3R0b207XG5cbiAgICAvLyBJZiB0aGUgZWxlbWVudCBoYXMgYmVjb21lIHdpZGVyIHRoYW4gdGhlIGJvdW5kYXJ5LCB3ZSBjYW4ndFxuICAgIC8vIGRvIG11Y2ggdG8gbWFrZSBpdCBmaXQgc28gd2UganVzdCBhbmNob3IgaXQgdG8gdGhlIGxlZnQuXG4gICAgaWYgKGJvdW5kYXJ5UmVjdC53aWR0aCA+IGVsZW1lbnRSZWN0LndpZHRoKSB7XG4gICAgICBpZiAobGVmdE92ZXJmbG93ID4gMCkge1xuICAgICAgICB4ICs9IGxlZnRPdmVyZmxvdztcbiAgICAgIH1cblxuICAgICAgaWYgKHJpZ2h0T3ZlcmZsb3cgPiAwKSB7XG4gICAgICAgIHggLT0gcmlnaHRPdmVyZmxvdztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgeCA9IDA7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGVsZW1lbnQgaGFzIGJlY29tZSB0YWxsZXIgdGhhbiB0aGUgYm91bmRhcnksIHdlIGNhbid0XG4gICAgLy8gZG8gbXVjaCB0byBtYWtlIGl0IGZpdCBzbyB3ZSBqdXN0IGFuY2hvciBpdCB0byB0aGUgdG9wLlxuICAgIGlmIChib3VuZGFyeVJlY3QuaGVpZ2h0ID4gZWxlbWVudFJlY3QuaGVpZ2h0KSB7XG4gICAgICBpZiAodG9wT3ZlcmZsb3cgPiAwKSB7XG4gICAgICAgIHkgKz0gdG9wT3ZlcmZsb3c7XG4gICAgICB9XG5cbiAgICAgIGlmIChib3R0b21PdmVyZmxvdyA+IDApIHtcbiAgICAgICAgeSAtPSBib3R0b21PdmVyZmxvdztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgeSA9IDA7XG4gICAgfVxuXG4gICAgaWYgKHggIT09IHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm0ueCB8fCB5ICE9PSB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtLnkpIHtcbiAgICAgIHRoaXMuc2V0RnJlZURyYWdQb3NpdGlvbih7eSwgeH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBkcmFnIHN0YXJ0IGRlbGF5LCBiYXNlZCBvbiB0aGUgZXZlbnQgdHlwZS4gKi9cbiAgcHJpdmF0ZSBfZ2V0RHJhZ1N0YXJ0RGVsYXkoZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KTogbnVtYmVyIHtcbiAgICBjb25zdCB2YWx1ZSA9IHRoaXMuZHJhZ1N0YXJ0RGVsYXk7XG5cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH0gZWxzZSBpZiAoaXNUb3VjaEV2ZW50KGV2ZW50KSkge1xuICAgICAgcmV0dXJuIHZhbHVlLnRvdWNoO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZSA/IHZhbHVlLm1vdXNlIDogMDtcbiAgfVxuXG4gIC8qKiBVcGRhdGVzIHRoZSBpbnRlcm5hbCBzdGF0ZSBvZiB0aGUgZHJhZ2dhYmxlIGVsZW1lbnQgd2hlbiBzY3JvbGxpbmcgaGFzIG9jY3VycmVkLiAqL1xuICBwcml2YXRlIF91cGRhdGVPblNjcm9sbChldmVudDogRXZlbnQpIHtcbiAgICBjb25zdCBzY3JvbGxEaWZmZXJlbmNlID0gdGhpcy5fcGFyZW50UG9zaXRpb25zLmhhbmRsZVNjcm9sbChldmVudCk7XG5cbiAgICBpZiAoc2Nyb2xsRGlmZmVyZW5jZSkge1xuICAgICAgY29uc3QgdGFyZ2V0ID0gX2dldEV2ZW50VGFyZ2V0PEhUTUxFbGVtZW50IHwgRG9jdW1lbnQ+KGV2ZW50KSE7XG5cbiAgICAgIC8vIENsaWVudFJlY3QgZGltZW5zaW9ucyBhcmUgYmFzZWQgb24gdGhlIHNjcm9sbCBwb3NpdGlvbiBvZiB0aGUgcGFnZSBhbmQgaXRzIHBhcmVudFxuICAgICAgLy8gbm9kZSBzbyB3ZSBoYXZlIHRvIHVwZGF0ZSB0aGUgY2FjaGVkIGJvdW5kYXJ5IENsaWVudFJlY3QgaWYgdGhlIHVzZXIgaGFzIHNjcm9sbGVkLlxuICAgICAgaWYgKFxuICAgICAgICB0aGlzLl9ib3VuZGFyeVJlY3QgJiZcbiAgICAgICAgdGFyZ2V0ICE9PSB0aGlzLl9ib3VuZGFyeUVsZW1lbnQgJiZcbiAgICAgICAgdGFyZ2V0LmNvbnRhaW5zKHRoaXMuX2JvdW5kYXJ5RWxlbWVudClcbiAgICAgICkge1xuICAgICAgICBhZGp1c3RDbGllbnRSZWN0KHRoaXMuX2JvdW5kYXJ5UmVjdCwgc2Nyb2xsRGlmZmVyZW5jZS50b3AsIHNjcm9sbERpZmZlcmVuY2UubGVmdCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLnggKz0gc2Nyb2xsRGlmZmVyZW5jZS5sZWZ0O1xuICAgICAgdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UueSArPSBzY3JvbGxEaWZmZXJlbmNlLnRvcDtcblxuICAgICAgLy8gSWYgd2UncmUgaW4gZnJlZSBkcmFnIG1vZGUsIHdlIGhhdmUgdG8gdXBkYXRlIHRoZSBhY3RpdmUgdHJhbnNmb3JtLCBiZWNhdXNlXG4gICAgICAvLyBpdCBpc24ndCByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQgbGlrZSB0aGUgcHJldmlldyBpbnNpZGUgYSBkcm9wIGxpc3QuXG4gICAgICBpZiAoIXRoaXMuX2Ryb3BDb250YWluZXIpIHtcbiAgICAgICAgdGhpcy5fYWN0aXZlVHJhbnNmb3JtLnggLT0gc2Nyb2xsRGlmZmVyZW5jZS5sZWZ0O1xuICAgICAgICB0aGlzLl9hY3RpdmVUcmFuc2Zvcm0ueSAtPSBzY3JvbGxEaWZmZXJlbmNlLnRvcDtcbiAgICAgICAgdGhpcy5fYXBwbHlSb290RWxlbWVudFRyYW5zZm9ybSh0aGlzLl9hY3RpdmVUcmFuc2Zvcm0ueCwgdGhpcy5fYWN0aXZlVHJhbnNmb3JtLnkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBzY3JvbGwgcG9zaXRpb24gb2YgdGhlIHZpZXdwb3J0LiAqL1xuICBwcml2YXRlIF9nZXRWaWV3cG9ydFNjcm9sbFBvc2l0aW9uKCkge1xuICAgIHJldHVybiAoXG4gICAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMucG9zaXRpb25zLmdldCh0aGlzLl9kb2N1bWVudCk/LnNjcm9sbFBvc2l0aW9uIHx8XG4gICAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuZ2V0Vmlld3BvcnRTY3JvbGxQb3NpdGlvbigpXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMYXppbHkgcmVzb2x2ZXMgYW5kIHJldHVybnMgdGhlIHNoYWRvdyByb290IG9mIHRoZSBlbGVtZW50LiBXZSBkbyB0aGlzIGluIGEgZnVuY3Rpb24sIHJhdGhlclxuICAgKiB0aGFuIHNhdmluZyBpdCBpbiBwcm9wZXJ0eSBkaXJlY3RseSBvbiBpbml0LCBiZWNhdXNlIHdlIHdhbnQgdG8gcmVzb2x2ZSBpdCBhcyBsYXRlIGFzIHBvc3NpYmxlXG4gICAqIGluIG9yZGVyIHRvIGVuc3VyZSB0aGF0IHRoZSBlbGVtZW50IGhhcyBiZWVuIG1vdmVkIGludG8gdGhlIHNoYWRvdyBET00uIERvaW5nIGl0IGluc2lkZSB0aGVcbiAgICogY29uc3RydWN0b3IgbWlnaHQgYmUgdG9vIGVhcmx5IGlmIHRoZSBlbGVtZW50IGlzIGluc2lkZSBvZiBzb21ldGhpbmcgbGlrZSBgbmdGb3JgIG9yIGBuZ0lmYC5cbiAgICovXG4gIHByaXZhdGUgX2dldFNoYWRvd1Jvb3QoKTogU2hhZG93Um9vdCB8IG51bGwge1xuICAgIGlmICh0aGlzLl9jYWNoZWRTaGFkb3dSb290ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuX2NhY2hlZFNoYWRvd1Jvb3QgPSBfZ2V0U2hhZG93Um9vdCh0aGlzLl9yb290RWxlbWVudCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX2NhY2hlZFNoYWRvd1Jvb3Q7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgZWxlbWVudCBpbnRvIHdoaWNoIHRoZSBkcmFnIHByZXZpZXcgc2hvdWxkIGJlIGluc2VydGVkLiAqL1xuICBwcml2YXRlIF9nZXRQcmV2aWV3SW5zZXJ0aW9uUG9pbnQoXG4gICAgaW5pdGlhbFBhcmVudDogSFRNTEVsZW1lbnQsXG4gICAgc2hhZG93Um9vdDogU2hhZG93Um9vdCB8IG51bGwsXG4gICk6IEhUTUxFbGVtZW50IHtcbiAgICBjb25zdCBwcmV2aWV3Q29udGFpbmVyID0gdGhpcy5fcHJldmlld0NvbnRhaW5lciB8fCAnZ2xvYmFsJztcblxuICAgIGlmIChwcmV2aWV3Q29udGFpbmVyID09PSAncGFyZW50Jykge1xuICAgICAgcmV0dXJuIGluaXRpYWxQYXJlbnQ7XG4gICAgfVxuXG4gICAgaWYgKHByZXZpZXdDb250YWluZXIgPT09ICdnbG9iYWwnKSB7XG4gICAgICBjb25zdCBkb2N1bWVudFJlZiA9IHRoaXMuX2RvY3VtZW50O1xuXG4gICAgICAvLyBXZSBjYW4ndCB1c2UgdGhlIGJvZHkgaWYgdGhlIHVzZXIgaXMgaW4gZnVsbHNjcmVlbiBtb2RlLFxuICAgICAgLy8gYmVjYXVzZSB0aGUgcHJldmlldyB3aWxsIHJlbmRlciB1bmRlciB0aGUgZnVsbHNjcmVlbiBlbGVtZW50LlxuICAgICAgLy8gVE9ETyhjcmlzYmV0byk6IGRlZHVwZSB0aGlzIHdpdGggdGhlIGBGdWxsc2NyZWVuT3ZlcmxheUNvbnRhaW5lcmAgZXZlbnR1YWxseS5cbiAgICAgIHJldHVybiAoXG4gICAgICAgIHNoYWRvd1Jvb3QgfHxcbiAgICAgICAgZG9jdW1lbnRSZWYuZnVsbHNjcmVlbkVsZW1lbnQgfHxcbiAgICAgICAgKGRvY3VtZW50UmVmIGFzIGFueSkud2Via2l0RnVsbHNjcmVlbkVsZW1lbnQgfHxcbiAgICAgICAgKGRvY3VtZW50UmVmIGFzIGFueSkubW96RnVsbFNjcmVlbkVsZW1lbnQgfHxcbiAgICAgICAgKGRvY3VtZW50UmVmIGFzIGFueSkubXNGdWxsc2NyZWVuRWxlbWVudCB8fFxuICAgICAgICBkb2N1bWVudFJlZi5ib2R5XG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBjb2VyY2VFbGVtZW50KHByZXZpZXdDb250YWluZXIpO1xuICB9XG5cbiAgLyoqIExhemlseSByZXNvbHZlcyBhbmQgcmV0dXJucyB0aGUgZGltZW5zaW9ucyBvZiB0aGUgcHJldmlldy4gKi9cbiAgcHJpdmF0ZSBfZ2V0UHJldmlld1JlY3QoKTogQ2xpZW50UmVjdCB7XG4gICAgLy8gQ2FjaGUgdGhlIHByZXZpZXcgZWxlbWVudCByZWN0IGlmIHdlIGhhdmVuJ3QgY2FjaGVkIGl0IGFscmVhZHkgb3IgaWZcbiAgICAvLyB3ZSBjYWNoZWQgaXQgdG9vIGVhcmx5IGJlZm9yZSB0aGUgZWxlbWVudCBkaW1lbnNpb25zIHdlcmUgY29tcHV0ZWQuXG4gICAgaWYgKCF0aGlzLl9wcmV2aWV3UmVjdCB8fCAoIXRoaXMuX3ByZXZpZXdSZWN0LndpZHRoICYmICF0aGlzLl9wcmV2aWV3UmVjdC5oZWlnaHQpKSB7XG4gICAgICB0aGlzLl9wcmV2aWV3UmVjdCA9ICh0aGlzLl9wcmV2aWV3IHx8IHRoaXMuX3Jvb3RFbGVtZW50KS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fcHJldmlld1JlY3Q7XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIGEgM2QgYHRyYW5zZm9ybWAgdGhhdCBjYW4gYmUgYXBwbGllZCB0byBhbiBlbGVtZW50LlxuICogQHBhcmFtIHggRGVzaXJlZCBwb3NpdGlvbiBvZiB0aGUgZWxlbWVudCBhbG9uZyB0aGUgWCBheGlzLlxuICogQHBhcmFtIHkgRGVzaXJlZCBwb3NpdGlvbiBvZiB0aGUgZWxlbWVudCBhbG9uZyB0aGUgWSBheGlzLlxuICovXG5mdW5jdGlvbiBnZXRUcmFuc2Zvcm0oeDogbnVtYmVyLCB5OiBudW1iZXIpOiBzdHJpbmcge1xuICAvLyBSb3VuZCB0aGUgdHJhbnNmb3JtcyBzaW5jZSBzb21lIGJyb3dzZXJzIHdpbGxcbiAgLy8gYmx1ciB0aGUgZWxlbWVudHMgZm9yIHN1Yi1waXhlbCB0cmFuc2Zvcm1zLlxuICByZXR1cm4gYHRyYW5zbGF0ZTNkKCR7TWF0aC5yb3VuZCh4KX1weCwgJHtNYXRoLnJvdW5kKHkpfXB4LCAwKWA7XG59XG5cbi8qKiBDbGFtcHMgYSB2YWx1ZSBiZXR3ZWVuIGEgbWluaW11bSBhbmQgYSBtYXhpbXVtLiAqL1xuZnVuY3Rpb24gY2xhbXAodmFsdWU6IG51bWJlciwgbWluOiBudW1iZXIsIG1heDogbnVtYmVyKSB7XG4gIHJldHVybiBNYXRoLm1heChtaW4sIE1hdGgubWluKG1heCwgdmFsdWUpKTtcbn1cblxuLyoqIERldGVybWluZXMgd2hldGhlciBhbiBldmVudCBpcyBhIHRvdWNoIGV2ZW50LiAqL1xuZnVuY3Rpb24gaXNUb3VjaEV2ZW50KGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCk6IGV2ZW50IGlzIFRvdWNoRXZlbnQge1xuICAvLyBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBmb3IgZXZlcnkgcGl4ZWwgdGhhdCB0aGUgdXNlciBoYXMgZHJhZ2dlZCBzbyB3ZSBuZWVkIGl0IHRvIGJlXG4gIC8vIGFzIGZhc3QgYXMgcG9zc2libGUuIFNpbmNlIHdlIG9ubHkgYmluZCBtb3VzZSBldmVudHMgYW5kIHRvdWNoIGV2ZW50cywgd2UgY2FuIGFzc3VtZVxuICAvLyB0aGF0IGlmIHRoZSBldmVudCdzIG5hbWUgc3RhcnRzIHdpdGggYHRgLCBpdCdzIGEgdG91Y2ggZXZlbnQuXG4gIHJldHVybiBldmVudC50eXBlWzBdID09PSAndCc7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgcm9vdCBIVE1MIGVsZW1lbnQgb2YgYW4gZW1iZWRkZWQgdmlldy5cbiAqIElmIHRoZSByb290IGlzIG5vdCBhbiBIVE1MIGVsZW1lbnQgaXQgZ2V0cyB3cmFwcGVkIGluIG9uZS5cbiAqL1xuZnVuY3Rpb24gZ2V0Um9vdE5vZGUodmlld1JlZjogRW1iZWRkZWRWaWV3UmVmPGFueT4sIF9kb2N1bWVudDogRG9jdW1lbnQpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IHJvb3ROb2RlczogTm9kZVtdID0gdmlld1JlZi5yb290Tm9kZXM7XG5cbiAgaWYgKHJvb3ROb2Rlcy5sZW5ndGggPT09IDEgJiYgcm9vdE5vZGVzWzBdLm5vZGVUeXBlID09PSBfZG9jdW1lbnQuRUxFTUVOVF9OT0RFKSB7XG4gICAgcmV0dXJuIHJvb3ROb2Rlc1swXSBhcyBIVE1MRWxlbWVudDtcbiAgfVxuXG4gIGNvbnN0IHdyYXBwZXIgPSBfZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHJvb3ROb2Rlcy5mb3JFYWNoKG5vZGUgPT4gd3JhcHBlci5hcHBlbmRDaGlsZChub2RlKSk7XG4gIHJldHVybiB3cmFwcGVyO1xufVxuXG4vKipcbiAqIE1hdGNoZXMgdGhlIHRhcmdldCBlbGVtZW50J3Mgc2l6ZSB0byB0aGUgc291cmNlJ3Mgc2l6ZS5cbiAqIEBwYXJhbSB0YXJnZXQgRWxlbWVudCB0aGF0IG5lZWRzIHRvIGJlIHJlc2l6ZWQuXG4gKiBAcGFyYW0gc291cmNlUmVjdCBEaW1lbnNpb25zIG9mIHRoZSBzb3VyY2UgZWxlbWVudC5cbiAqL1xuZnVuY3Rpb24gbWF0Y2hFbGVtZW50U2l6ZSh0YXJnZXQ6IEhUTUxFbGVtZW50LCBzb3VyY2VSZWN0OiBDbGllbnRSZWN0KTogdm9pZCB7XG4gIHRhcmdldC5zdHlsZS53aWR0aCA9IGAke3NvdXJjZVJlY3Qud2lkdGh9cHhgO1xuICB0YXJnZXQuc3R5bGUuaGVpZ2h0ID0gYCR7c291cmNlUmVjdC5oZWlnaHR9cHhgO1xuICB0YXJnZXQuc3R5bGUudHJhbnNmb3JtID0gZ2V0VHJhbnNmb3JtKHNvdXJjZVJlY3QubGVmdCwgc291cmNlUmVjdC50b3ApO1xufVxuXG4vKiogVXRpbGl0eSB0byBwcmV2ZW50IHRoZSBkZWZhdWx0IGFjdGlvbiBvZiBhbiBldmVudC4gKi9cbmZ1bmN0aW9uIHByZXZlbnREZWZhdWx0KGV2ZW50OiBFdmVudCk6IHZvaWQge1xuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xufVxuIl19