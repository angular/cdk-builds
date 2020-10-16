/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { normalizePassiveListenerOptions } from '@angular/cdk/platform';
import { coerceBooleanProperty, coerceElement } from '@angular/cdk/coercion';
import { Subscription, Subject } from 'rxjs';
import { extendStyles, toggleNativeDragInteractions, toggleVisibility } from './drag-styling';
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
                    const target = event.target;
                    return !!target && (target === handle || handle.contains(target));
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
            // Prevent the default action as early as possible in order to block
            // native actions like dragging the selected text or images with the mouse.
            event.preventDefault();
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
                        this._hasStartedDragging = true;
                        this._ngZone.run(() => this._startDragSequence(event));
                    }
                }
                return;
            }
            // We only need the preview dimensions if we have a boundary element.
            if (this._boundaryElement) {
                // Cache the preview element rect if we haven't cached it already or if
                // we cached it too early before the element dimensions were computed.
                if (!this._previewRect || (!this._previewRect.width && !this._previewRect.height)) {
                    this._previewRect = (this._preview || this._rootElement).getBoundingClientRect();
                }
            }
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
                // Apply transform as attribute if dragging and svg element to work for IE
                if (typeof SVGElement !== 'undefined' && this._rootElement instanceof SVGElement) {
                    const appliedTransform = `translate(${activeTransform.x} ${activeTransform.y})`;
                    this._rootElement.setAttribute('transform', appliedTransform);
                }
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
                        delta: this._pointerDirectionDelta
                    });
                });
            }
        };
        /** Handler that is invoked when the user lifts their pointer up, after initiating a drag. */
        this._pointerUp = (event) => {
            this._endDragSequence(event);
        };
        this.withRootElement(element);
        this._parentPositions = new ParentPositionTracker(_document, _viewportRuler);
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
        this._handles.forEach(handle => toggleNativeDragInteractions(handle, false));
        this._toggleNativeDragInteractions();
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
    /** Removes the dragging functionality from the DOM element. */
    dispose() {
        this._removeRootElementListeners(this._rootElement);
        // Do this check before removing from the registry since it'll
        // stop being considered as dragged once it is removed.
        if (this.isDragging()) {
            // Since we move out the element to the end of the body while it's being
            // dragged, we have to make sure that it's removed if it gets destroyed.
            removeNode(this._rootElement);
        }
        removeNode(this._anchor);
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
        this._boundaryElement = this._rootElement = this._ownerSVGElement = this._placeholderTemplate =
            this._previewTemplate = this._anchor = null;
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
        if (this._handles.indexOf(handle) > -1) {
            this._disabledHandles.add(handle);
        }
    }
    /**
     * Enables a handle, if it has been disabled.
     * @param handle Handle element to be enabled.
     */
    enableHandle(handle) {
        this._disabledHandles.delete(handle);
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
        if (this._preview) {
            removeNode(this._preview);
        }
        if (this._previewRef) {
            this._previewRef.destroy();
        }
        this._preview = this._previewRef = null;
    }
    /** Destroys the placeholder element and its ViewRef. */
    _destroyPlaceholder() {
        if (this._placeholder) {
            removeNode(this._placeholder);
        }
        if (this._placeholderRef) {
            this._placeholderRef.destroy();
        }
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
            this._rootElement.style.webkitTapHighlightColor = this._rootElementTapHighlight;
        }
        if (!this._hasStartedDragging) {
            return;
        }
        this.released.next({ source: this });
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
            this._passiveTransform.y = this._activeTransform.y;
            this._ngZone.run(() => {
                this.ended.next({
                    source: this,
                    distance: this._getDragDistance(this._getPointerPositionOnPage(event))
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
            const preview = this._preview = this._createPreviewElement();
            const placeholder = this._placeholder = this._createPlaceholderElement();
            const anchor = this._anchor = this._anchor || this._document.createComment('');
            // Insert an anchor node so that we can restore the element's position in the DOM.
            parent.insertBefore(anchor, element);
            // We move the element out at the end of the body and we make it hidden, because keeping it in
            // place will throw off the consumer's `:last-child` selectors. We can't remove the element
            // from the DOM completely, because iOS will stop firing all subsequent events in the chain.
            toggleVisibility(element, false);
            this._document.body.appendChild(parent.replaceChild(placeholder, element));
            getPreviewInsertionPoint(this._document).appendChild(preview);
            this.started.next({ source: this }); // Emit before notifying the container.
            dropContainer.start();
            this._initialContainer = dropContainer;
            this._initialIndex = dropContainer.getItemIndex(this);
        }
        else {
            this.started.next({ source: this });
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
        // Always stop propagation for the event that initializes
        // the dragging sequence, in order to prevent it from potentially
        // starting another sequence for a draggable parent somewhere up the DOM tree.
        event.stopPropagation();
        const isDragging = this.isDragging();
        const isTouchSequence = isTouchEvent(event);
        const isAuxiliaryMouseButton = !isTouchSequence && event.button !== 0;
        const rootElement = this._rootElement;
        const isSyntheticEvent = !isTouchSequence && this._lastTouchEventTime &&
            this._lastTouchEventTime + MOUSE_EVENT_IGNORE_TIME > Date.now();
        // If the event started from an element with the native HTML drag&drop, it'll interfere
        // with our own dragging (e.g. `img` tags do it by default). Prevent the default action
        // to stop it from happening. Note that preventing on `dragstart` also seems to work, but
        // it's flaky and it fails if the user drags it away quickly. Also note that we only want
        // to do this for `mousedown` since doing the same for `touchstart` will stop any `click`
        // events from firing on touch devices.
        if (event.target && event.target.draggable && event.type === 'mousedown') {
            event.preventDefault();
        }
        // Abort if the user is already dragging or is using a mouse button other than the primary one.
        if (isDragging || isAuxiliaryMouseButton || isSyntheticEvent) {
            return;
        }
        // If we've got handles, we need to disable the tap highlight on the entire root element,
        // otherwise iOS will still add it, even though all the drag interactions on the handle
        // are disabled.
        if (this._handles.length) {
            this._rootElementTapHighlight = rootElement.style.webkitTapHighlightColor || '';
            rootElement.style.webkitTapHighlightColor = 'transparent';
        }
        this._hasStartedDragging = this._hasMoved = false;
        // Avoid multiple subscriptions and memory leaks when multi touch
        // (isDragging check above isn't enough because of possible temporal and/or dimensional delays)
        this._removeSubscriptions();
        this._pointerMoveSubscription = this._dragDropRegistry.pointerMove.subscribe(this._pointerMove);
        this._pointerUpSubscription = this._dragDropRegistry.pointerUp.subscribe(this._pointerUp);
        this._scrollSubscription = this._dragDropRegistry.scroll.subscribe(scrollEvent => {
            this._updateOnScroll(scrollEvent);
        });
        if (this._boundaryElement) {
            this._boundaryRect = getMutableClientRect(this._boundaryElement);
        }
        // If we have a custom preview we can't know ahead of time how large it'll be so we position
        // it next to the cursor. The exception is when the consumer has opted into making the preview
        // the same size as the root element, in which case we do know the size.
        const previewTemplate = this._previewTemplate;
        this._pickupPositionInElement = previewTemplate && previewTemplate.template &&
            !previewTemplate.matchSize ? { x: 0, y: 0 } :
            this._getPointerPositionInElement(referenceElement, event);
        const pointerPosition = this._pickupPositionOnPage = this._lastKnownPointerPosition =
            this._getPointerPositionOnPage(event);
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
        toggleVisibility(this._rootElement, true);
        this._anchor.parentNode.replaceChild(this._rootElement, this._anchor);
        this._destroyPreview();
        this._destroyPlaceholder();
        this._boundaryRect = this._previewRect = undefined;
        // Re-enter the NgZone since we bound `document` events on the outside.
        this._ngZone.run(() => {
            const container = this._dropContainer;
            const currentIndex = container.getItemIndex(this);
            const pointerPosition = this._getPointerPositionOnPage(event);
            const distance = this._getDragDistance(this._getPointerPositionOnPage(event));
            const isPointerOverContainer = container._isOverContainer(pointerPosition.x, pointerPosition.y);
            this.ended.next({ source: this, distance });
            this.dropped.next({
                item: this,
                currentIndex,
                previousIndex: this._initialIndex,
                container: container,
                previousContainer: this._initialContainer,
                isPointerOverContainer,
                distance
            });
            container.drop(this, currentIndex, this._initialContainer, isPointerOverContainer, distance, this._initialIndex);
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
        if (!newContainer && this._dropContainer !== this._initialContainer &&
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
                    newContainer.sortingDisabled ? this._initialIndex : undefined);
                this.entered.next({
                    item: this,
                    container: newContainer,
                    currentIndex: newContainer.getItemIndex(this)
                });
            });
        }
        this._dropContainer._startScrollingIfNecessary(rawX, rawY);
        this._dropContainer._sortItem(this, x, y, this._pointerDirectionDelta);
        this._preview.style.transform =
            getTransform(x - this._pickupPositionInElement.x, y - this._pickupPositionInElement.y);
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
                preview.style.transform =
                    getTransform(this._pickupPositionOnPage.x, this._pickupPositionOnPage.y);
            }
        }
        else {
            const element = this._rootElement;
            preview = deepCloneNode(element);
            matchElementSize(preview, element.getBoundingClientRect());
        }
        extendStyles(preview.style, {
            // It's important that we disable the pointer events on the preview, because
            // it can throw off the `document.elementFromPoint` calls in the `CdkDropList`.
            pointerEvents: 'none',
            // We have to reset the margin, because it can throw off positioning relative to the viewport.
            margin: '0',
            position: 'fixed',
            top: '0',
            left: '0',
            zIndex: `${this._config.zIndex || 1000}`
        });
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
        this._preview.style.transform = getTransform(placeholderRect.left, placeholderRect.top);
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
                    if (!event || (event.target === this._preview && event.propertyName === 'transform')) {
                        this._preview.removeEventListener('transitionend', handler);
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
            y: referenceRect.top - elementRect.top + y
        };
    }
    /** Determines the point of the page that was touched by the user. */
    _getPointerPositionOnPage(event) {
        const scrollPosition = this._getViewportScrollPosition();
        const point = isTouchEvent(event) ?
            // `touches` will be empty for start/end events so we have to fall back to `changedTouches`.
            // Also note that on real devices we're guaranteed for either `touches` or `changedTouches`
            // to have a value, but Firefox in device emulation mode has a bug where both can be empty
            // for `touchstart` and `touchend` so we fall back to a dummy object in order to avoid
            // throwing an error. The value returned here will be incorrect, but since this only
            // breaks inside a developer tool and the value is only used for secondary information,
            // we can get away with it. See https://bugzilla.mozilla.org/show_bug.cgi?id=1615824.
            (event.touches[0] || event.changedTouches[0] || { pageX: 0, pageY: 0 }) : event;
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
            const previewRect = this._previewRect;
            const minY = boundaryRect.top + pickupY;
            const maxY = boundaryRect.bottom - (previewRect.height - pickupY);
            const minX = boundaryRect.left + pickupX;
            const maxX = boundaryRect.right - (previewRect.width - pickupX);
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
    }
    /**
     * Applies a `transform` to the root element, taking into account any existing transforms on it.
     * @param x New transform value along the X axis.
     * @param y New transform value along the Y axis.
     */
    _applyRootElementTransform(x, y) {
        const transform = getTransform(x, y);
        // Cache the previous transform amount only after the first drag sequence, because
        // we don't want our own transforms to stack on top of each other.
        if (this._initialTransform == null) {
            this._initialTransform = this._rootElement.style.transform || '';
        }
        // Preserve the previous `transform` value, if there was one. Note that we apply our own
        // transform before the user's, because things like rotation can affect which direction
        // the element will be translated towards.
        this._rootElement.style.transform = this._initialTransform ?
            transform + ' ' + this._initialTransform : transform;
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
            const target = event.target;
            // ClientRect dimensions are based on the scroll position of the page and its parent node so
            // we have to update the cached boundary ClientRect if the user has scrolled. Check for
            // the `document` specifically since IE doesn't support `contains` on it.
            if (this._boundaryRect && (target === this._document ||
                (target !== this._boundaryElement && target.contains(this._boundaryElement)))) {
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
        const cachedPosition = this._parentPositions.positions.get(this._document);
        return cachedPosition ? cachedPosition.scrollPosition :
            this._viewportRuler.getViewportScrollPosition();
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
/**
 * Helper to remove a node from the DOM and to do all the necessary null checks.
 * @param node Node to be removed.
 */
function removeNode(node) {
    if (node && node.parentNode) {
        node.parentNode.removeChild(node);
    }
}
/** Determines whether an event is a touch event. */
function isTouchEvent(event) {
    // This function is called for every pixel that the user has dragged so we need it to be
    // as fast as possible. Since we only bind mouse events and touch events, we can assume
    // that if the event's name starts with `t`, it's a touch event.
    return event.type[0] === 't';
}
/** Gets the element into which the drag preview should be inserted. */
function getPreviewInsertionPoint(documentRef) {
    // We can't use the body if the user is in fullscreen mode,
    // because the preview will render under the fullscreen element.
    // TODO(crisbeto): dedupe this with the `FullscreenOverlayContainer` eventually.
    return documentRef.fullscreenElement ||
        documentRef.webkitFullscreenElement ||
        documentRef.mozFullScreenElement ||
        documentRef.msFullscreenElement ||
        documentRef.body;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2RyYWctZHJvcC9kcmFnLXJlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFLSCxPQUFPLEVBQUMsK0JBQStCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN0RSxPQUFPLEVBQUMscUJBQXFCLEVBQUUsYUFBYSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDM0UsT0FBTyxFQUFDLFlBQVksRUFBRSxPQUFPLEVBQWEsTUFBTSxNQUFNLENBQUM7QUFHdkQsT0FBTyxFQUFDLFlBQVksRUFBRSw0QkFBNEIsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzVGLE9BQU8sRUFBQyxrQ0FBa0MsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3pFLE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNyRSxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUNoRSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBb0IzQyxpRUFBaUU7QUFDakUsTUFBTSwyQkFBMkIsR0FBRywrQkFBK0IsQ0FBQyxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0FBRXJGLGlFQUFpRTtBQUNqRSxNQUFNLDBCQUEwQixHQUFHLCtCQUErQixDQUFDLEVBQUMsT0FBTyxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUM7QUFFckY7Ozs7O0dBS0c7QUFDSCxNQUFNLHVCQUF1QixHQUFHLEdBQUcsQ0FBQztBQThCcEM7O0dBRUc7QUFDSCxNQUFNLE9BQU8sT0FBTztJQThObEIsWUFDRSxPQUE4QyxFQUN0QyxPQUFzQixFQUN0QixTQUFtQixFQUNuQixPQUFlLEVBQ2YsY0FBNkIsRUFDN0IsaUJBQXlEO1FBSnpELFlBQU8sR0FBUCxPQUFPLENB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Z2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtFbWJlZGRlZFZpZXdSZWYsIEVsZW1lbnRSZWYsIE5nWm9uZSwgVmlld0NvbnRhaW5lclJlZiwgVGVtcGxhdGVSZWZ9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtWaWV3cG9ydFJ1bGVyfSBmcm9tICdAYW5ndWxhci9jZGsvc2Nyb2xsaW5nJztcbmltcG9ydCB7RGlyZWN0aW9ufSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge25vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnN9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge2NvZXJjZUJvb2xlYW5Qcm9wZXJ0eSwgY29lcmNlRWxlbWVudH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7U3Vic2NyaXB0aW9uLCBTdWJqZWN0LCBPYnNlcnZhYmxlfSBmcm9tICdyeGpzJztcbmltcG9ydCB7RHJvcExpc3RSZWZJbnRlcm5hbCBhcyBEcm9wTGlzdFJlZn0gZnJvbSAnLi9kcm9wLWxpc3QtcmVmJztcbmltcG9ydCB7RHJhZ0Ryb3BSZWdpc3RyeX0gZnJvbSAnLi9kcmFnLWRyb3AtcmVnaXN0cnknO1xuaW1wb3J0IHtleHRlbmRTdHlsZXMsIHRvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMsIHRvZ2dsZVZpc2liaWxpdHl9IGZyb20gJy4vZHJhZy1zdHlsaW5nJztcbmltcG9ydCB7Z2V0VHJhbnNmb3JtVHJhbnNpdGlvbkR1cmF0aW9uSW5Nc30gZnJvbSAnLi90cmFuc2l0aW9uLWR1cmF0aW9uJztcbmltcG9ydCB7Z2V0TXV0YWJsZUNsaWVudFJlY3QsIGFkanVzdENsaWVudFJlY3R9IGZyb20gJy4vY2xpZW50LXJlY3QnO1xuaW1wb3J0IHtQYXJlbnRQb3NpdGlvblRyYWNrZXJ9IGZyb20gJy4vcGFyZW50LXBvc2l0aW9uLXRyYWNrZXInO1xuaW1wb3J0IHtkZWVwQ2xvbmVOb2RlfSBmcm9tICcuL2Nsb25lLW5vZGUnO1xuXG4vKiogT2JqZWN0IHRoYXQgY2FuIGJlIHVzZWQgdG8gY29uZmlndXJlIHRoZSBiZWhhdmlvciBvZiBEcmFnUmVmLiAqL1xuZXhwb3J0IGludGVyZmFjZSBEcmFnUmVmQ29uZmlnIHtcbiAgLyoqXG4gICAqIE1pbmltdW0gYW1vdW50IG9mIHBpeGVscyB0aGF0IHRoZSB1c2VyIHNob3VsZFxuICAgKiBkcmFnLCBiZWZvcmUgdGhlIENESyBpbml0aWF0ZXMgYSBkcmFnIHNlcXVlbmNlLlxuICAgKi9cbiAgZHJhZ1N0YXJ0VGhyZXNob2xkOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEFtb3VudCB0aGUgcGl4ZWxzIHRoZSB1c2VyIHNob3VsZCBkcmFnIGJlZm9yZSB0aGUgQ0RLXG4gICAqIGNvbnNpZGVycyB0aGVtIHRvIGhhdmUgY2hhbmdlZCB0aGUgZHJhZyBkaXJlY3Rpb24uXG4gICAqL1xuICBwb2ludGVyRGlyZWN0aW9uQ2hhbmdlVGhyZXNob2xkOiBudW1iZXI7XG5cbiAgLyoqIGB6LWluZGV4YCBmb3IgdGhlIGFic29sdXRlbHktcG9zaXRpb25lZCBlbGVtZW50cyB0aGF0IGFyZSBjcmVhdGVkIGJ5IHRoZSBkcmFnIGl0ZW0uICovXG4gIHpJbmRleD86IG51bWJlcjtcbn1cblxuLyoqIE9wdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCB0byBiaW5kIGEgcGFzc2l2ZSBldmVudCBsaXN0ZW5lci4gKi9cbmNvbnN0IHBhc3NpdmVFdmVudExpc3RlbmVyT3B0aW9ucyA9IG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMoe3Bhc3NpdmU6IHRydWV9KTtcblxuLyoqIE9wdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCB0byBiaW5kIGFuIGFjdGl2ZSBldmVudCBsaXN0ZW5lci4gKi9cbmNvbnN0IGFjdGl2ZUV2ZW50TGlzdGVuZXJPcHRpb25zID0gbm9ybWFsaXplUGFzc2l2ZUxpc3RlbmVyT3B0aW9ucyh7cGFzc2l2ZTogZmFsc2V9KTtcblxuLyoqXG4gKiBUaW1lIGluIG1pbGxpc2Vjb25kcyBmb3Igd2hpY2ggdG8gaWdub3JlIG1vdXNlIGV2ZW50cywgYWZ0ZXJcbiAqIHJlY2VpdmluZyBhIHRvdWNoIGV2ZW50LiBVc2VkIHRvIGF2b2lkIGRvaW5nIGRvdWJsZSB3b3JrIGZvclxuICogdG91Y2ggZGV2aWNlcyB3aGVyZSB0aGUgYnJvd3NlciBmaXJlcyBmYWtlIG1vdXNlIGV2ZW50cywgaW5cbiAqIGFkZGl0aW9uIHRvIHRvdWNoIGV2ZW50cy5cbiAqL1xuY29uc3QgTU9VU0VfRVZFTlRfSUdOT1JFX1RJTUUgPSA4MDA7XG5cbi8vIFRPRE8oY3Jpc2JldG8pOiBhZGQgYW4gQVBJIGZvciBtb3ZpbmcgYSBkcmFnZ2FibGUgdXAvZG93biB0aGVcbi8vIGxpc3QgcHJvZ3JhbW1hdGljYWxseS4gVXNlZnVsIGZvciBrZXlib2FyZCBjb250cm9scy5cblxuLyoqXG4gKiBJbnRlcm5hbCBjb21waWxlLXRpbWUtb25seSByZXByZXNlbnRhdGlvbiBvZiBhIGBEcmFnUmVmYC5cbiAqIFVzZWQgdG8gYXZvaWQgY2lyY3VsYXIgaW1wb3J0IGlzc3VlcyBiZXR3ZWVuIHRoZSBgRHJhZ1JlZmAgYW5kIHRoZSBgRHJvcExpc3RSZWZgLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIERyYWdSZWZJbnRlcm5hbCBleHRlbmRzIERyYWdSZWYge31cblxuLyoqIFRlbXBsYXRlIHRoYXQgY2FuIGJlIHVzZWQgdG8gY3JlYXRlIGEgZHJhZyBoZWxwZXIgZWxlbWVudCAoZS5nLiBhIHByZXZpZXcgb3IgYSBwbGFjZWhvbGRlcikuICovXG5pbnRlcmZhY2UgRHJhZ0hlbHBlclRlbXBsYXRlPFQgPSBhbnk+IHtcbiAgdGVtcGxhdGU6IFRlbXBsYXRlUmVmPFQ+IHwgbnVsbDtcbiAgdmlld0NvbnRhaW5lcjogVmlld0NvbnRhaW5lclJlZjtcbiAgY29udGV4dDogVDtcbn1cblxuLyoqIFRlbXBsYXRlIHRoYXQgY2FuIGJlIHVzZWQgdG8gY3JlYXRlIGEgZHJhZyBwcmV2aWV3IGVsZW1lbnQuICovXG5pbnRlcmZhY2UgRHJhZ1ByZXZpZXdUZW1wbGF0ZTxUID0gYW55PiBleHRlbmRzIERyYWdIZWxwZXJUZW1wbGF0ZTxUPiB7XG4gIG1hdGNoU2l6ZT86IGJvb2xlYW47XG59XG5cbi8qKiBQb2ludCBvbiB0aGUgcGFnZSBvciB3aXRoaW4gYW4gZWxlbWVudC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUG9pbnQge1xuICB4OiBudW1iZXI7XG4gIHk6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBSZWZlcmVuY2UgdG8gYSBkcmFnZ2FibGUgaXRlbS4gVXNlZCB0byBtYW5pcHVsYXRlIG9yIGRpc3Bvc2Ugb2YgdGhlIGl0ZW0uXG4gKi9cbmV4cG9ydCBjbGFzcyBEcmFnUmVmPFQgPSBhbnk+IHtcbiAgLyoqIEVsZW1lbnQgZGlzcGxheWVkIG5leHQgdG8gdGhlIHVzZXIncyBwb2ludGVyIHdoaWxlIHRoZSBlbGVtZW50IGlzIGRyYWdnZWQuICovXG4gIHByaXZhdGUgX3ByZXZpZXc6IEhUTUxFbGVtZW50O1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIHZpZXcgb2YgdGhlIHByZXZpZXcgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfcHJldmlld1JlZjogRW1iZWRkZWRWaWV3UmVmPGFueT4gfCBudWxsO1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIHZpZXcgb2YgdGhlIHBsYWNlaG9sZGVyIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3BsYWNlaG9sZGVyUmVmOiBFbWJlZGRlZFZpZXdSZWY8YW55PiB8IG51bGw7XG5cbiAgLyoqIEVsZW1lbnQgdGhhdCBpcyByZW5kZXJlZCBpbnN0ZWFkIG9mIHRoZSBkcmFnZ2FibGUgaXRlbSB3aGlsZSBpdCBpcyBiZWluZyBzb3J0ZWQuICovXG4gIHByaXZhdGUgX3BsYWNlaG9sZGVyOiBIVE1MRWxlbWVudDtcblxuICAvKiogQ29vcmRpbmF0ZXMgd2l0aGluIHRoZSBlbGVtZW50IGF0IHdoaWNoIHRoZSB1c2VyIHBpY2tlZCB1cCB0aGUgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfcGlja3VwUG9zaXRpb25JbkVsZW1lbnQ6IFBvaW50O1xuXG4gIC8qKiBDb29yZGluYXRlcyBvbiB0aGUgcGFnZSBhdCB3aGljaCB0aGUgdXNlciBwaWNrZWQgdXAgdGhlIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3BpY2t1cFBvc2l0aW9uT25QYWdlOiBQb2ludDtcblxuICAvKipcbiAgICogQW5jaG9yIG5vZGUgdXNlZCB0byBzYXZlIHRoZSBwbGFjZSBpbiB0aGUgRE9NIHdoZXJlIHRoZSBlbGVtZW50IHdhc1xuICAgKiBwaWNrZWQgdXAgc28gdGhhdCBpdCBjYW4gYmUgcmVzdG9yZWQgYXQgdGhlIGVuZCBvZiB0aGUgZHJhZyBzZXF1ZW5jZS5cbiAgICovXG4gIHByaXZhdGUgX2FuY2hvcjogQ29tbWVudDtcblxuICAvKipcbiAgICogQ1NTIGB0cmFuc2Zvcm1gIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgd2hlbiBpdCBpc24ndCBiZWluZyBkcmFnZ2VkLiBXZSBuZWVkIGFcbiAgICogcGFzc2l2ZSB0cmFuc2Zvcm0gaW4gb3JkZXIgZm9yIHRoZSBkcmFnZ2VkIGVsZW1lbnQgdG8gcmV0YWluIGl0cyBuZXcgcG9zaXRpb25cbiAgICogYWZ0ZXIgdGhlIHVzZXIgaGFzIHN0b3BwZWQgZHJhZ2dpbmcgYW5kIGJlY2F1c2Ugd2UgbmVlZCB0byBrbm93IHRoZSByZWxhdGl2ZVxuICAgKiBwb3NpdGlvbiBpbiBjYXNlIHRoZXkgc3RhcnQgZHJhZ2dpbmcgYWdhaW4uIFRoaXMgY29ycmVzcG9uZHMgdG8gYGVsZW1lbnQuc3R5bGUudHJhbnNmb3JtYC5cbiAgICovXG4gIHByaXZhdGUgX3Bhc3NpdmVUcmFuc2Zvcm06IFBvaW50ID0ge3g6IDAsIHk6IDB9O1xuXG4gIC8qKiBDU1MgYHRyYW5zZm9ybWAgdGhhdCBpcyBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IHdoaWxlIGl0J3MgYmVpbmcgZHJhZ2dlZC4gKi9cbiAgcHJpdmF0ZSBfYWN0aXZlVHJhbnNmb3JtOiBQb2ludCA9IHt4OiAwLCB5OiAwfTtcblxuICAvKiogSW5saW5lIGB0cmFuc2Zvcm1gIHZhbHVlIHRoYXQgdGhlIGVsZW1lbnQgaGFkIGJlZm9yZSB0aGUgZmlyc3QgZHJhZ2dpbmcgc2VxdWVuY2UuICovXG4gIHByaXZhdGUgX2luaXRpYWxUcmFuc2Zvcm0/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGRyYWdnaW5nIHNlcXVlbmNlIGhhcyBiZWVuIHN0YXJ0ZWQuIERvZXNuJ3RcbiAgICogbmVjZXNzYXJpbHkgbWVhbiB0aGF0IHRoZSBlbGVtZW50IGhhcyBiZWVuIG1vdmVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfaGFzU3RhcnRlZERyYWdnaW5nOiBib29sZWFuO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBlbGVtZW50IGhhcyBtb3ZlZCBzaW5jZSB0aGUgdXNlciBzdGFydGVkIGRyYWdnaW5nIGl0LiAqL1xuICBwcml2YXRlIF9oYXNNb3ZlZDogYm9vbGVhbjtcblxuICAvKiogRHJvcCBjb250YWluZXIgaW4gd2hpY2ggdGhlIERyYWdSZWYgcmVzaWRlZCB3aGVuIGRyYWdnaW5nIGJlZ2FuLiAqL1xuICBwcml2YXRlIF9pbml0aWFsQ29udGFpbmVyOiBEcm9wTGlzdFJlZjtcblxuICAvKiogSW5kZXggYXQgd2hpY2ggdGhlIGl0ZW0gc3RhcnRlZCBpbiBpdHMgaW5pdGlhbCBjb250YWluZXIuICovXG4gIHByaXZhdGUgX2luaXRpYWxJbmRleDogbnVtYmVyO1xuXG4gIC8qKiBDYWNoZWQgcG9zaXRpb25zIG9mIHNjcm9sbGFibGUgcGFyZW50IGVsZW1lbnRzLiAqL1xuICBwcml2YXRlIF9wYXJlbnRQb3NpdGlvbnM6IFBhcmVudFBvc2l0aW9uVHJhY2tlcjtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgaXRlbSBpcyBiZWluZyBtb3ZlZC4gKi9cbiAgcHJpdmF0ZSBfbW92ZUV2ZW50cyA9IG5ldyBTdWJqZWN0PHtcbiAgICBzb3VyY2U6IERyYWdSZWY7XG4gICAgcG9pbnRlclBvc2l0aW9uOiB7eDogbnVtYmVyLCB5OiBudW1iZXJ9O1xuICAgIGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudDtcbiAgICBkaXN0YW5jZTogUG9pbnQ7XG4gICAgZGVsdGE6IHt4OiAtMSB8IDAgfCAxLCB5OiAtMSB8IDAgfCAxfTtcbiAgfT4oKTtcblxuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgdXNlciBpcyBkcmFnZ2luZyBhbG9uZyBlYWNoIGF4aXMuICovXG4gIHByaXZhdGUgX3BvaW50ZXJEaXJlY3Rpb25EZWx0YToge3g6IC0xIHwgMCB8IDEsIHk6IC0xIHwgMCB8IDF9O1xuXG4gIC8qKiBQb2ludGVyIHBvc2l0aW9uIGF0IHdoaWNoIHRoZSBsYXN0IGNoYW5nZSBpbiB0aGUgZGVsdGEgb2NjdXJyZWQuICovXG4gIHByaXZhdGUgX3BvaW50ZXJQb3NpdGlvbkF0TGFzdERpcmVjdGlvbkNoYW5nZTogUG9pbnQ7XG5cbiAgLyoqIFBvc2l0aW9uIG9mIHRoZSBwb2ludGVyIGF0IHRoZSBsYXN0IHBvaW50ZXIgZXZlbnQuICovXG4gIHByaXZhdGUgX2xhc3RLbm93blBvaW50ZXJQb3NpdGlvbjogUG9pbnQ7XG5cbiAgLyoqXG4gICAqIFJvb3QgRE9NIG5vZGUgb2YgdGhlIGRyYWcgaW5zdGFuY2UuIFRoaXMgaXMgdGhlIGVsZW1lbnQgdGhhdCB3aWxsXG4gICAqIGJlIG1vdmVkIGFyb3VuZCBhcyB0aGUgdXNlciBpcyBkcmFnZ2luZy5cbiAgICovXG4gIHByaXZhdGUgX3Jvb3RFbGVtZW50OiBIVE1MRWxlbWVudDtcblxuICAvKipcbiAgICogTmVhcmVzdCBhbmNlc3RvciBTVkcsIHJlbGF0aXZlIHRvIHdoaWNoIGNvb3JkaW5hdGVzIGFyZSBjYWxjdWxhdGVkIGlmIGRyYWdnaW5nIFNWR0VsZW1lbnRcbiAgICovXG4gIHByaXZhdGUgX293bmVyU1ZHRWxlbWVudDogU1ZHU1ZHRWxlbWVudCB8IG51bGw7XG5cbiAgLyoqXG4gICAqIElubGluZSBzdHlsZSB2YWx1ZSBvZiBgLXdlYmtpdC10YXAtaGlnaGxpZ2h0LWNvbG9yYCBhdCB0aGUgdGltZSB0aGVcbiAgICogZHJhZ2dpbmcgd2FzIHN0YXJ0ZWQuIFVzZWQgdG8gcmVzdG9yZSB0aGUgdmFsdWUgb25jZSB3ZSdyZSBkb25lIGRyYWdnaW5nLlxuICAgKi9cbiAgcHJpdmF0ZSBfcm9vdEVsZW1lbnRUYXBIaWdobGlnaHQ6IHN0cmluZztcblxuICAvKiogU3Vic2NyaXB0aW9uIHRvIHBvaW50ZXIgbW92ZW1lbnQgZXZlbnRzLiAqL1xuICBwcml2YXRlIF9wb2ludGVyTW92ZVN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcblxuICAvKiogU3Vic2NyaXB0aW9uIHRvIHRoZSBldmVudCB0aGF0IGlzIGRpc3BhdGNoZWQgd2hlbiB0aGUgdXNlciBsaWZ0cyB0aGVpciBwb2ludGVyLiAqL1xuICBwcml2YXRlIF9wb2ludGVyVXBTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG5cbiAgLyoqIFN1YnNjcmlwdGlvbiB0byB0aGUgdmlld3BvcnQgYmVpbmcgc2Nyb2xsZWQuICovXG4gIHByaXZhdGUgX3Njcm9sbFN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcblxuICAvKiogU3Vic2NyaXB0aW9uIHRvIHRoZSB2aWV3cG9ydCBiZWluZyByZXNpemVkLiAqL1xuICBwcml2YXRlIF9yZXNpemVTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG5cbiAgLyoqXG4gICAqIFRpbWUgYXQgd2hpY2ggdGhlIGxhc3QgdG91Y2ggZXZlbnQgb2NjdXJyZWQuIFVzZWQgdG8gYXZvaWQgZmlyaW5nIHRoZSBzYW1lXG4gICAqIGV2ZW50cyBtdWx0aXBsZSB0aW1lcyBvbiB0b3VjaCBkZXZpY2VzIHdoZXJlIHRoZSBicm93c2VyIHdpbGwgZmlyZSBhIGZha2VcbiAgICogbW91c2UgZXZlbnQgZm9yIGVhY2ggdG91Y2ggZXZlbnQsIGFmdGVyIGEgY2VydGFpbiB0aW1lLlxuICAgKi9cbiAgcHJpdmF0ZSBfbGFzdFRvdWNoRXZlbnRUaW1lOiBudW1iZXI7XG5cbiAgLyoqIFRpbWUgYXQgd2hpY2ggdGhlIGxhc3QgZHJhZ2dpbmcgc2VxdWVuY2Ugd2FzIHN0YXJ0ZWQuICovXG4gIHByaXZhdGUgX2RyYWdTdGFydFRpbWU6IG51bWJlcjtcblxuICAvKiogQ2FjaGVkIHJlZmVyZW5jZSB0byB0aGUgYm91bmRhcnkgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfYm91bmRhcnlFbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBuYXRpdmUgZHJhZ2dpbmcgaW50ZXJhY3Rpb25zIGhhdmUgYmVlbiBlbmFibGVkIG9uIHRoZSByb290IGVsZW1lbnQuICovXG4gIHByaXZhdGUgX25hdGl2ZUludGVyYWN0aW9uc0VuYWJsZWQgPSB0cnVlO1xuXG4gIC8qKiBDYWNoZWQgZGltZW5zaW9ucyBvZiB0aGUgcHJldmlldyBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9wcmV2aWV3UmVjdD86IENsaWVudFJlY3Q7XG5cbiAgLyoqIENhY2hlZCBkaW1lbnNpb25zIG9mIHRoZSBib3VuZGFyeSBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9ib3VuZGFyeVJlY3Q/OiBDbGllbnRSZWN0O1xuXG4gIC8qKiBFbGVtZW50IHRoYXQgd2lsbCBiZSB1c2VkIGFzIGEgdGVtcGxhdGUgdG8gY3JlYXRlIHRoZSBkcmFnZ2FibGUgaXRlbSdzIHByZXZpZXcuICovXG4gIHByaXZhdGUgX3ByZXZpZXdUZW1wbGF0ZT86IERyYWdQcmV2aWV3VGVtcGxhdGUgfCBudWxsO1xuXG4gIC8qKiBUZW1wbGF0ZSBmb3IgcGxhY2Vob2xkZXIgZWxlbWVudCByZW5kZXJlZCB0byBzaG93IHdoZXJlIGEgZHJhZ2dhYmxlIHdvdWxkIGJlIGRyb3BwZWQuICovXG4gIHByaXZhdGUgX3BsYWNlaG9sZGVyVGVtcGxhdGU/OiBEcmFnSGVscGVyVGVtcGxhdGUgfCBudWxsO1xuXG4gIC8qKiBFbGVtZW50cyB0aGF0IGNhbiBiZSB1c2VkIHRvIGRyYWcgdGhlIGRyYWdnYWJsZSBpdGVtLiAqL1xuICBwcml2YXRlIF9oYW5kbGVzOiBIVE1MRWxlbWVudFtdID0gW107XG5cbiAgLyoqIFJlZ2lzdGVyZWQgaGFuZGxlcyB0aGF0IGFyZSBjdXJyZW50bHkgZGlzYWJsZWQuICovXG4gIHByaXZhdGUgX2Rpc2FibGVkSGFuZGxlcyA9IG5ldyBTZXQ8SFRNTEVsZW1lbnQ+KCk7XG5cbiAgLyoqIERyb3BwYWJsZSBjb250YWluZXIgdGhhdCB0aGUgZHJhZ2dhYmxlIGlzIGEgcGFydCBvZi4gKi9cbiAgcHJpdmF0ZSBfZHJvcENvbnRhaW5lcj86IERyb3BMaXN0UmVmO1xuXG4gIC8qKiBMYXlvdXQgZGlyZWN0aW9uIG9mIHRoZSBpdGVtLiAqL1xuICBwcml2YXRlIF9kaXJlY3Rpb246IERpcmVjdGlvbiA9ICdsdHInO1xuXG4gIC8qKiBBeGlzIGFsb25nIHdoaWNoIGRyYWdnaW5nIGlzIGxvY2tlZC4gKi9cbiAgbG9ja0F4aXM6ICd4JyB8ICd5JztcblxuICAvKipcbiAgICogQW1vdW50IG9mIG1pbGxpc2Vjb25kcyB0byB3YWl0IGFmdGVyIHRoZSB1c2VyIGhhcyBwdXQgdGhlaXJcbiAgICogcG9pbnRlciBkb3duIGJlZm9yZSBzdGFydGluZyB0byBkcmFnIHRoZSBlbGVtZW50LlxuICAgKi9cbiAgZHJhZ1N0YXJ0RGVsYXk6IG51bWJlciB8IHt0b3VjaDogbnVtYmVyLCBtb3VzZTogbnVtYmVyfSA9IDA7XG5cbiAgLyoqIENsYXNzIHRvIGJlIGFkZGVkIHRvIHRoZSBwcmV2aWV3IGVsZW1lbnQuICovXG4gIHByZXZpZXdDbGFzczogc3RyaW5nfHN0cmluZ1tdfHVuZGVmaW5lZDtcblxuICAvKiogV2hldGhlciBzdGFydGluZyB0byBkcmFnIHRoaXMgZWxlbWVudCBpcyBkaXNhYmxlZC4gKi9cbiAgZ2V0IGRpc2FibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9kaXNhYmxlZCB8fCAhISh0aGlzLl9kcm9wQ29udGFpbmVyICYmIHRoaXMuX2Ryb3BDb250YWluZXIuZGlzYWJsZWQpO1xuICB9XG4gIHNldCBkaXNhYmxlZCh2YWx1ZTogYm9vbGVhbikge1xuICAgIGNvbnN0IG5ld1ZhbHVlID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcblxuICAgIGlmIChuZXdWYWx1ZSAhPT0gdGhpcy5fZGlzYWJsZWQpIHtcbiAgICAgIHRoaXMuX2Rpc2FibGVkID0gbmV3VmFsdWU7XG4gICAgICB0aGlzLl90b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKCk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgX2Rpc2FibGVkID0gZmFsc2U7XG5cbiAgLyoqIEVtaXRzIGFzIHRoZSBkcmFnIHNlcXVlbmNlIGlzIGJlaW5nIHByZXBhcmVkLiAqL1xuICBiZWZvcmVTdGFydGVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBzdGFydHMgZHJhZ2dpbmcgdGhlIGl0ZW0uICovXG4gIHN0YXJ0ZWQgPSBuZXcgU3ViamVjdDx7c291cmNlOiBEcmFnUmVmfT4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBoYXMgcmVsZWFzZWQgYSBkcmFnIGl0ZW0sIGJlZm9yZSBhbnkgYW5pbWF0aW9ucyBoYXZlIHN0YXJ0ZWQuICovXG4gIHJlbGVhc2VkID0gbmV3IFN1YmplY3Q8e3NvdXJjZTogRHJhZ1JlZn0+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgc3RvcHMgZHJhZ2dpbmcgYW4gaXRlbSBpbiB0aGUgY29udGFpbmVyLiAqL1xuICBlbmRlZCA9IG5ldyBTdWJqZWN0PHtzb3VyY2U6IERyYWdSZWYsIGRpc3RhbmNlOiBQb2ludH0+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgaGFzIG1vdmVkIHRoZSBpdGVtIGludG8gYSBuZXcgY29udGFpbmVyLiAqL1xuICBlbnRlcmVkID0gbmV3IFN1YmplY3Q8e2NvbnRhaW5lcjogRHJvcExpc3RSZWYsIGl0ZW06IERyYWdSZWYsIGN1cnJlbnRJbmRleDogbnVtYmVyfT4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciByZW1vdmVzIHRoZSBpdGVtIGl0cyBjb250YWluZXIgYnkgZHJhZ2dpbmcgaXQgaW50byBhbm90aGVyIGNvbnRhaW5lci4gKi9cbiAgZXhpdGVkID0gbmV3IFN1YmplY3Q8e2NvbnRhaW5lcjogRHJvcExpc3RSZWYsIGl0ZW06IERyYWdSZWZ9PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGRyb3BzIHRoZSBpdGVtIGluc2lkZSBhIGNvbnRhaW5lci4gKi9cbiAgZHJvcHBlZCA9IG5ldyBTdWJqZWN0PHtcbiAgICBwcmV2aW91c0luZGV4OiBudW1iZXI7XG4gICAgY3VycmVudEluZGV4OiBudW1iZXI7XG4gICAgaXRlbTogRHJhZ1JlZjtcbiAgICBjb250YWluZXI6IERyb3BMaXN0UmVmO1xuICAgIHByZXZpb3VzQ29udGFpbmVyOiBEcm9wTGlzdFJlZjtcbiAgICBkaXN0YW5jZTogUG9pbnQ7XG4gICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcjogYm9vbGVhbjtcbiAgfT4oKTtcblxuICAvKipcbiAgICogRW1pdHMgYXMgdGhlIHVzZXIgaXMgZHJhZ2dpbmcgdGhlIGl0ZW0uIFVzZSB3aXRoIGNhdXRpb24sXG4gICAqIGJlY2F1c2UgdGhpcyBldmVudCB3aWxsIGZpcmUgZm9yIGV2ZXJ5IHBpeGVsIHRoYXQgdGhlIHVzZXIgaGFzIGRyYWdnZWQuXG4gICAqL1xuICBtb3ZlZDogT2JzZXJ2YWJsZTx7XG4gICAgc291cmNlOiBEcmFnUmVmO1xuICAgIHBvaW50ZXJQb3NpdGlvbjoge3g6IG51bWJlciwgeTogbnVtYmVyfTtcbiAgICBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQ7XG4gICAgZGlzdGFuY2U6IFBvaW50O1xuICAgIGRlbHRhOiB7eDogLTEgfCAwIHwgMSwgeTogLTEgfCAwIHwgMX07XG4gIH0+ID0gdGhpcy5fbW92ZUV2ZW50cztcblxuICAvKiogQXJiaXRyYXJ5IGRhdGEgdGhhdCBjYW4gYmUgYXR0YWNoZWQgdG8gdGhlIGRyYWcgaXRlbS4gKi9cbiAgZGF0YTogVDtcblxuICAvKipcbiAgICogRnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB0byBjdXN0b21pemUgdGhlIGxvZ2ljIG9mIGhvdyB0aGUgcG9zaXRpb24gb2YgdGhlIGRyYWcgaXRlbVxuICAgKiBpcyBsaW1pdGVkIHdoaWxlIGl0J3MgYmVpbmcgZHJhZ2dlZC4gR2V0cyBjYWxsZWQgd2l0aCBhIHBvaW50IGNvbnRhaW5pbmcgdGhlIGN1cnJlbnQgcG9zaXRpb25cbiAgICogb2YgdGhlIHVzZXIncyBwb2ludGVyIG9uIHRoZSBwYWdlIGFuZCBzaG91bGQgcmV0dXJuIGEgcG9pbnQgZGVzY3JpYmluZyB3aGVyZSB0aGUgaXRlbSBzaG91bGRcbiAgICogYmUgcmVuZGVyZWQuXG4gICAqL1xuICBjb25zdHJhaW5Qb3NpdGlvbj86IChwb2ludDogUG9pbnQsIGRyYWdSZWY6IERyYWdSZWYpID0+IFBvaW50O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+IHwgSFRNTEVsZW1lbnQsXG4gICAgcHJpdmF0ZSBfY29uZmlnOiBEcmFnUmVmQ29uZmlnLFxuICAgIHByaXZhdGUgX2RvY3VtZW50OiBEb2N1bWVudCxcbiAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICBwcml2YXRlIF92aWV3cG9ydFJ1bGVyOiBWaWV3cG9ydFJ1bGVyLFxuICAgIHByaXZhdGUgX2RyYWdEcm9wUmVnaXN0cnk6IERyYWdEcm9wUmVnaXN0cnk8RHJhZ1JlZiwgRHJvcExpc3RSZWY+KSB7XG5cbiAgICB0aGlzLndpdGhSb290RWxlbWVudChlbGVtZW50KTtcbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMgPSBuZXcgUGFyZW50UG9zaXRpb25UcmFja2VyKF9kb2N1bWVudCwgX3ZpZXdwb3J0UnVsZXIpO1xuICAgIF9kcmFnRHJvcFJlZ2lzdHJ5LnJlZ2lzdGVyRHJhZ0l0ZW0odGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZWxlbWVudCB0aGF0IGlzIGJlaW5nIHVzZWQgYXMgYSBwbGFjZWhvbGRlclxuICAgKiB3aGlsZSB0aGUgY3VycmVudCBlbGVtZW50IGlzIGJlaW5nIGRyYWdnZWQuXG4gICAqL1xuICBnZXRQbGFjZWhvbGRlckVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLl9wbGFjZWhvbGRlcjtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHRoZSByb290IGRyYWdnYWJsZSBlbGVtZW50LiAqL1xuICBnZXRSb290RWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX3Jvb3RFbGVtZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnRseS12aXNpYmxlIGVsZW1lbnQgdGhhdCByZXByZXNlbnRzIHRoZSBkcmFnIGl0ZW0uXG4gICAqIFdoaWxlIGRyYWdnaW5nIHRoaXMgaXMgdGhlIHBsYWNlaG9sZGVyLCBvdGhlcndpc2UgaXQncyB0aGUgcm9vdCBlbGVtZW50LlxuICAgKi9cbiAgZ2V0VmlzaWJsZUVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLmlzRHJhZ2dpbmcoKSA/IHRoaXMuZ2V0UGxhY2Vob2xkZXJFbGVtZW50KCkgOiB0aGlzLmdldFJvb3RFbGVtZW50KCk7XG4gIH1cblxuICAvKiogUmVnaXN0ZXJzIHRoZSBoYW5kbGVzIHRoYXQgY2FuIGJlIHVzZWQgdG8gZHJhZyB0aGUgZWxlbWVudC4gKi9cbiAgd2l0aEhhbmRsZXMoaGFuZGxlczogKEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4pW10pOiB0aGlzIHtcbiAgICB0aGlzLl9oYW5kbGVzID0gaGFuZGxlcy5tYXAoaGFuZGxlID0+IGNvZXJjZUVsZW1lbnQoaGFuZGxlKSk7XG4gICAgdGhpcy5faGFuZGxlcy5mb3JFYWNoKGhhbmRsZSA9PiB0b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKGhhbmRsZSwgZmFsc2UpKTtcbiAgICB0aGlzLl90b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIHRoZSB0ZW1wbGF0ZSB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciB0aGUgZHJhZyBwcmV2aWV3LlxuICAgKiBAcGFyYW0gdGVtcGxhdGUgVGVtcGxhdGUgdGhhdCBmcm9tIHdoaWNoIHRvIHN0YW1wIG91dCB0aGUgcHJldmlldy5cbiAgICovXG4gIHdpdGhQcmV2aWV3VGVtcGxhdGUodGVtcGxhdGU6IERyYWdQcmV2aWV3VGVtcGxhdGUgfCBudWxsKTogdGhpcyB7XG4gICAgdGhpcy5fcHJldmlld1RlbXBsYXRlID0gdGVtcGxhdGU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIHRoZSB0ZW1wbGF0ZSB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciB0aGUgZHJhZyBwbGFjZWhvbGRlci5cbiAgICogQHBhcmFtIHRlbXBsYXRlIFRlbXBsYXRlIHRoYXQgZnJvbSB3aGljaCB0byBzdGFtcCBvdXQgdGhlIHBsYWNlaG9sZGVyLlxuICAgKi9cbiAgd2l0aFBsYWNlaG9sZGVyVGVtcGxhdGUodGVtcGxhdGU6IERyYWdIZWxwZXJUZW1wbGF0ZSB8IG51bGwpOiB0aGlzIHtcbiAgICB0aGlzLl9wbGFjZWhvbGRlclRlbXBsYXRlID0gdGVtcGxhdGU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhbiBhbHRlcm5hdGUgZHJhZyByb290IGVsZW1lbnQuIFRoZSByb290IGVsZW1lbnQgaXMgdGhlIGVsZW1lbnQgdGhhdCB3aWxsIGJlIG1vdmVkIGFzXG4gICAqIHRoZSB1c2VyIGlzIGRyYWdnaW5nLiBQYXNzaW5nIGFuIGFsdGVybmF0ZSByb290IGVsZW1lbnQgaXMgdXNlZnVsIHdoZW4gdHJ5aW5nIHRvIGVuYWJsZVxuICAgKiBkcmFnZ2luZyBvbiBhbiBlbGVtZW50IHRoYXQgeW91IG1pZ2h0IG5vdCBoYXZlIGFjY2VzcyB0by5cbiAgICovXG4gIHdpdGhSb290RWxlbWVudChyb290RWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBIVE1MRWxlbWVudCk6IHRoaXMge1xuICAgIGNvbnN0IGVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KHJvb3RFbGVtZW50KTtcblxuICAgIGlmIChlbGVtZW50ICE9PSB0aGlzLl9yb290RWxlbWVudCkge1xuICAgICAgaWYgKHRoaXMuX3Jvb3RFbGVtZW50KSB7XG4gICAgICAgIHRoaXMuX3JlbW92ZVJvb3RFbGVtZW50TGlzdGVuZXJzKHRoaXMuX3Jvb3RFbGVtZW50KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9wb2ludGVyRG93biwgYWN0aXZlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9wb2ludGVyRG93biwgcGFzc2l2ZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5faW5pdGlhbFRyYW5zZm9ybSA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuX3Jvb3RFbGVtZW50ID0gZWxlbWVudDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIFNWR0VsZW1lbnQgIT09ICd1bmRlZmluZWQnICYmIHRoaXMuX3Jvb3RFbGVtZW50IGluc3RhbmNlb2YgU1ZHRWxlbWVudCkge1xuICAgICAgdGhpcy5fb3duZXJTVkdFbGVtZW50ID0gdGhpcy5fcm9vdEVsZW1lbnQub3duZXJTVkdFbGVtZW50O1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEVsZW1lbnQgdG8gd2hpY2ggdGhlIGRyYWdnYWJsZSdzIHBvc2l0aW9uIHdpbGwgYmUgY29uc3RyYWluZWQuXG4gICAqL1xuICB3aXRoQm91bmRhcnlFbGVtZW50KGJvdW5kYXJ5RWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBIVE1MRWxlbWVudCB8IG51bGwpOiB0aGlzIHtcbiAgICB0aGlzLl9ib3VuZGFyeUVsZW1lbnQgPSBib3VuZGFyeUVsZW1lbnQgPyBjb2VyY2VFbGVtZW50KGJvdW5kYXJ5RWxlbWVudCkgOiBudWxsO1xuICAgIHRoaXMuX3Jlc2l6ZVN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIGlmIChib3VuZGFyeUVsZW1lbnQpIHtcbiAgICAgIHRoaXMuX3Jlc2l6ZVN1YnNjcmlwdGlvbiA9IHRoaXMuX3ZpZXdwb3J0UnVsZXJcbiAgICAgICAgLmNoYW5nZSgxMClcbiAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9jb250YWluSW5zaWRlQm91bmRhcnlPblJlc2l6ZSgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogUmVtb3ZlcyB0aGUgZHJhZ2dpbmcgZnVuY3Rpb25hbGl0eSBmcm9tIHRoZSBET00gZWxlbWVudC4gKi9cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLl9yZW1vdmVSb290RWxlbWVudExpc3RlbmVycyh0aGlzLl9yb290RWxlbWVudCk7XG5cbiAgICAvLyBEbyB0aGlzIGNoZWNrIGJlZm9yZSByZW1vdmluZyBmcm9tIHRoZSByZWdpc3RyeSBzaW5jZSBpdCdsbFxuICAgIC8vIHN0b3AgYmVpbmcgY29uc2lkZXJlZCBhcyBkcmFnZ2VkIG9uY2UgaXQgaXMgcmVtb3ZlZC5cbiAgICBpZiAodGhpcy5pc0RyYWdnaW5nKCkpIHtcbiAgICAgIC8vIFNpbmNlIHdlIG1vdmUgb3V0IHRoZSBlbGVtZW50IHRvIHRoZSBlbmQgb2YgdGhlIGJvZHkgd2hpbGUgaXQncyBiZWluZ1xuICAgICAgLy8gZHJhZ2dlZCwgd2UgaGF2ZSB0byBtYWtlIHN1cmUgdGhhdCBpdCdzIHJlbW92ZWQgaWYgaXQgZ2V0cyBkZXN0cm95ZWQuXG4gICAgICByZW1vdmVOb2RlKHRoaXMuX3Jvb3RFbGVtZW50KTtcbiAgICB9XG5cbiAgICByZW1vdmVOb2RlKHRoaXMuX2FuY2hvcik7XG4gICAgdGhpcy5fZGVzdHJveVByZXZpZXcoKTtcbiAgICB0aGlzLl9kZXN0cm95UGxhY2Vob2xkZXIoKTtcbiAgICB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnJlbW92ZURyYWdJdGVtKHRoaXMpO1xuICAgIHRoaXMuX3JlbW92ZVN1YnNjcmlwdGlvbnMoKTtcbiAgICB0aGlzLmJlZm9yZVN0YXJ0ZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLnN0YXJ0ZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLnJlbGVhc2VkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5lbmRlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuZW50ZXJlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuZXhpdGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5kcm9wcGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fbW92ZUV2ZW50cy5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX2hhbmRsZXMgPSBbXTtcbiAgICB0aGlzLl9kaXNhYmxlZEhhbmRsZXMuY2xlYXIoKTtcbiAgICB0aGlzLl9kcm9wQ29udGFpbmVyID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3Jlc2l6ZVN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5jbGVhcigpO1xuICAgIHRoaXMuX2JvdW5kYXJ5RWxlbWVudCA9IHRoaXMuX3Jvb3RFbGVtZW50ID0gdGhpcy5fb3duZXJTVkdFbGVtZW50ID0gdGhpcy5fcGxhY2Vob2xkZXJUZW1wbGF0ZSA9XG4gICAgICAgIHRoaXMuX3ByZXZpZXdUZW1wbGF0ZSA9IHRoaXMuX2FuY2hvciA9IG51bGwhO1xuICB9XG5cbiAgLyoqIENoZWNrcyB3aGV0aGVyIHRoZSBlbGVtZW50IGlzIGN1cnJlbnRseSBiZWluZyBkcmFnZ2VkLiAqL1xuICBpc0RyYWdnaW5nKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9oYXNTdGFydGVkRHJhZ2dpbmcgJiYgdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5pc0RyYWdnaW5nKHRoaXMpO1xuICB9XG5cbiAgLyoqIFJlc2V0cyBhIHN0YW5kYWxvbmUgZHJhZyBpdGVtIHRvIGl0cyBpbml0aWFsIHBvc2l0aW9uLiAqL1xuICByZXNldCgpOiB2b2lkIHtcbiAgICB0aGlzLl9yb290RWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSB0aGlzLl9pbml0aWFsVHJhbnNmb3JtIHx8ICcnO1xuICAgIHRoaXMuX2FjdGl2ZVRyYW5zZm9ybSA9IHt4OiAwLCB5OiAwfTtcbiAgICB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtID0ge3g6IDAsIHk6IDB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSBoYW5kbGUgYXMgZGlzYWJsZWQuIFdoaWxlIGEgaGFuZGxlIGlzIGRpc2FibGVkLCBpdCdsbCBjYXB0dXJlIGFuZCBpbnRlcnJ1cHQgZHJhZ2dpbmcuXG4gICAqIEBwYXJhbSBoYW5kbGUgSGFuZGxlIGVsZW1lbnQgdGhhdCBzaG91bGQgYmUgZGlzYWJsZWQuXG4gICAqL1xuICBkaXNhYmxlSGFuZGxlKGhhbmRsZTogSFRNTEVsZW1lbnQpIHtcbiAgICBpZiAodGhpcy5faGFuZGxlcy5pbmRleE9mKGhhbmRsZSkgPiAtMSkge1xuICAgICAgdGhpcy5fZGlzYWJsZWRIYW5kbGVzLmFkZChoYW5kbGUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGVzIGEgaGFuZGxlLCBpZiBpdCBoYXMgYmVlbiBkaXNhYmxlZC5cbiAgICogQHBhcmFtIGhhbmRsZSBIYW5kbGUgZWxlbWVudCB0byBiZSBlbmFibGVkLlxuICAgKi9cbiAgZW5hYmxlSGFuZGxlKGhhbmRsZTogSFRNTEVsZW1lbnQpIHtcbiAgICB0aGlzLl9kaXNhYmxlZEhhbmRsZXMuZGVsZXRlKGhhbmRsZSk7XG4gIH1cblxuICAvKiogU2V0cyB0aGUgbGF5b3V0IGRpcmVjdGlvbiBvZiB0aGUgZHJhZ2dhYmxlIGl0ZW0uICovXG4gIHdpdGhEaXJlY3Rpb24oZGlyZWN0aW9uOiBEaXJlY3Rpb24pOiB0aGlzIHtcbiAgICB0aGlzLl9kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogU2V0cyB0aGUgY29udGFpbmVyIHRoYXQgdGhlIGl0ZW0gaXMgcGFydCBvZi4gKi9cbiAgX3dpdGhEcm9wQ29udGFpbmVyKGNvbnRhaW5lcjogRHJvcExpc3RSZWYpIHtcbiAgICB0aGlzLl9kcm9wQ29udGFpbmVyID0gY29udGFpbmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgcG9zaXRpb24gaW4gcGl4ZWxzIHRoZSBkcmFnZ2FibGUgb3V0c2lkZSBvZiBhIGRyb3AgY29udGFpbmVyLlxuICAgKi9cbiAgZ2V0RnJlZURyYWdQb3NpdGlvbigpOiBSZWFkb25seTxQb2ludD4ge1xuICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5pc0RyYWdnaW5nKCkgPyB0aGlzLl9hY3RpdmVUcmFuc2Zvcm0gOiB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtO1xuICAgIHJldHVybiB7eDogcG9zaXRpb24ueCwgeTogcG9zaXRpb24ueX07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY3VycmVudCBwb3NpdGlvbiBpbiBwaXhlbHMgdGhlIGRyYWdnYWJsZSBvdXRzaWRlIG9mIGEgZHJvcCBjb250YWluZXIuXG4gICAqIEBwYXJhbSB2YWx1ZSBOZXcgcG9zaXRpb24gdG8gYmUgc2V0LlxuICAgKi9cbiAgc2V0RnJlZURyYWdQb3NpdGlvbih2YWx1ZTogUG9pbnQpOiB0aGlzIHtcbiAgICB0aGlzLl9hY3RpdmVUcmFuc2Zvcm0gPSB7eDogMCwgeTogMH07XG4gICAgdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybS54ID0gdmFsdWUueDtcbiAgICB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtLnkgPSB2YWx1ZS55O1xuXG4gICAgaWYgKCF0aGlzLl9kcm9wQ29udGFpbmVyKSB7XG4gICAgICB0aGlzLl9hcHBseVJvb3RFbGVtZW50VHJhbnNmb3JtKHZhbHVlLngsIHZhbHVlLnkpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFVwZGF0ZXMgdGhlIGl0ZW0ncyBzb3J0IG9yZGVyIGJhc2VkIG9uIHRoZSBsYXN0LWtub3duIHBvaW50ZXIgcG9zaXRpb24uICovXG4gIF9zb3J0RnJvbUxhc3RQb2ludGVyUG9zaXRpb24oKSB7XG4gICAgY29uc3QgcG9zaXRpb24gPSB0aGlzLl9sYXN0S25vd25Qb2ludGVyUG9zaXRpb247XG5cbiAgICBpZiAocG9zaXRpb24gJiYgdGhpcy5fZHJvcENvbnRhaW5lcikge1xuICAgICAgdGhpcy5fdXBkYXRlQWN0aXZlRHJvcENvbnRhaW5lcih0aGlzLl9nZXRDb25zdHJhaW5lZFBvaW50ZXJQb3NpdGlvbihwb3NpdGlvbiksIHBvc2l0aW9uKTtcbiAgICB9XG4gIH1cblxuICAvKiogVW5zdWJzY3JpYmVzIGZyb20gdGhlIGdsb2JhbCBzdWJzY3JpcHRpb25zLiAqL1xuICBwcml2YXRlIF9yZW1vdmVTdWJzY3JpcHRpb25zKCkge1xuICAgIHRoaXMuX3BvaW50ZXJNb3ZlU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fcG9pbnRlclVwU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fc2Nyb2xsU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gIH1cblxuICAvKiogRGVzdHJveXMgdGhlIHByZXZpZXcgZWxlbWVudCBhbmQgaXRzIFZpZXdSZWYuICovXG4gIHByaXZhdGUgX2Rlc3Ryb3lQcmV2aWV3KCkge1xuICAgIGlmICh0aGlzLl9wcmV2aWV3KSB7XG4gICAgICByZW1vdmVOb2RlKHRoaXMuX3ByZXZpZXcpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9wcmV2aWV3UmVmKSB7XG4gICAgICB0aGlzLl9wcmV2aWV3UmVmLmRlc3Ryb3koKTtcbiAgICB9XG5cbiAgICB0aGlzLl9wcmV2aWV3ID0gdGhpcy5fcHJldmlld1JlZiA9IG51bGwhO1xuICB9XG5cbiAgLyoqIERlc3Ryb3lzIHRoZSBwbGFjZWhvbGRlciBlbGVtZW50IGFuZCBpdHMgVmlld1JlZi4gKi9cbiAgcHJpdmF0ZSBfZGVzdHJveVBsYWNlaG9sZGVyKCkge1xuICAgIGlmICh0aGlzLl9wbGFjZWhvbGRlcikge1xuICAgICAgcmVtb3ZlTm9kZSh0aGlzLl9wbGFjZWhvbGRlcik7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3BsYWNlaG9sZGVyUmVmKSB7XG4gICAgICB0aGlzLl9wbGFjZWhvbGRlclJlZi5kZXN0cm95KCk7XG4gICAgfVxuXG4gICAgdGhpcy5fcGxhY2Vob2xkZXIgPSB0aGlzLl9wbGFjZWhvbGRlclJlZiA9IG51bGwhO1xuICB9XG5cbiAgLyoqIEhhbmRsZXIgZm9yIHRoZSBgbW91c2Vkb3duYC9gdG91Y2hzdGFydGAgZXZlbnRzLiAqL1xuICBwcml2YXRlIF9wb2ludGVyRG93biA9IChldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpID0+IHtcbiAgICB0aGlzLmJlZm9yZVN0YXJ0ZWQubmV4dCgpO1xuXG4gICAgLy8gRGVsZWdhdGUgdGhlIGV2ZW50IGJhc2VkIG9uIHdoZXRoZXIgaXQgc3RhcnRlZCBmcm9tIGEgaGFuZGxlIG9yIHRoZSBlbGVtZW50IGl0c2VsZi5cbiAgICBpZiAodGhpcy5faGFuZGxlcy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHRhcmdldEhhbmRsZSA9IHRoaXMuX2hhbmRsZXMuZmluZChoYW5kbGUgPT4ge1xuICAgICAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQ7XG4gICAgICAgIHJldHVybiAhIXRhcmdldCAmJiAodGFyZ2V0ID09PSBoYW5kbGUgfHwgaGFuZGxlLmNvbnRhaW5zKHRhcmdldCBhcyBIVE1MRWxlbWVudCkpO1xuICAgICAgfSk7XG5cbiAgICAgIGlmICh0YXJnZXRIYW5kbGUgJiYgIXRoaXMuX2Rpc2FibGVkSGFuZGxlcy5oYXModGFyZ2V0SGFuZGxlKSAmJiAhdGhpcy5kaXNhYmxlZCkge1xuICAgICAgICB0aGlzLl9pbml0aWFsaXplRHJhZ1NlcXVlbmNlKHRhcmdldEhhbmRsZSwgZXZlbnQpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIXRoaXMuZGlzYWJsZWQpIHtcbiAgICAgIHRoaXMuX2luaXRpYWxpemVEcmFnU2VxdWVuY2UodGhpcy5fcm9vdEVsZW1lbnQsIGV2ZW50KTtcbiAgICB9XG4gIH1cblxuICAvKiogSGFuZGxlciB0aGF0IGlzIGludm9rZWQgd2hlbiB0aGUgdXNlciBtb3ZlcyB0aGVpciBwb2ludGVyIGFmdGVyIHRoZXkndmUgaW5pdGlhdGVkIGEgZHJhZy4gKi9cbiAgcHJpdmF0ZSBfcG9pbnRlck1vdmUgPSAoZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KSA9PiB7XG4gICAgLy8gUHJldmVudCB0aGUgZGVmYXVsdCBhY3Rpb24gYXMgZWFybHkgYXMgcG9zc2libGUgaW4gb3JkZXIgdG8gYmxvY2tcbiAgICAvLyBuYXRpdmUgYWN0aW9ucyBsaWtlIGRyYWdnaW5nIHRoZSBzZWxlY3RlZCB0ZXh0IG9yIGltYWdlcyB3aXRoIHRoZSBtb3VzZS5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnN0IHBvaW50ZXJQb3NpdGlvbiA9IHRoaXMuX2dldFBvaW50ZXJQb3NpdGlvbk9uUGFnZShldmVudCk7XG5cbiAgICBpZiAoIXRoaXMuX2hhc1N0YXJ0ZWREcmFnZ2luZykge1xuICAgICAgY29uc3QgZGlzdGFuY2VYID0gTWF0aC5hYnMocG9pbnRlclBvc2l0aW9uLnggLSB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZS54KTtcbiAgICAgIGNvbnN0IGRpc3RhbmNlWSA9IE1hdGguYWJzKHBvaW50ZXJQb3NpdGlvbi55IC0gdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UueSk7XG4gICAgICBjb25zdCBpc092ZXJUaHJlc2hvbGQgPSBkaXN0YW5jZVggKyBkaXN0YW5jZVkgPj0gdGhpcy5fY29uZmlnLmRyYWdTdGFydFRocmVzaG9sZDtcblxuICAgICAgLy8gT25seSBzdGFydCBkcmFnZ2luZyBhZnRlciB0aGUgdXNlciBoYXMgbW92ZWQgbW9yZSB0aGFuIHRoZSBtaW5pbXVtIGRpc3RhbmNlIGluIGVpdGhlclxuICAgICAgLy8gZGlyZWN0aW9uLiBOb3RlIHRoYXQgdGhpcyBpcyBwcmVmZXJyYWJsZSBvdmVyIGRvaW5nIHNvbWV0aGluZyBsaWtlIGBza2lwKG1pbmltdW1EaXN0YW5jZSlgXG4gICAgICAvLyBpbiB0aGUgYHBvaW50ZXJNb3ZlYCBzdWJzY3JpcHRpb24sIGJlY2F1c2Ugd2UncmUgbm90IGd1YXJhbnRlZWQgdG8gaGF2ZSBvbmUgbW92ZSBldmVudFxuICAgICAgLy8gcGVyIHBpeGVsIG9mIG1vdmVtZW50IChlLmcuIGlmIHRoZSB1c2VyIG1vdmVzIHRoZWlyIHBvaW50ZXIgcXVpY2tseSkuXG4gICAgICBpZiAoaXNPdmVyVGhyZXNob2xkKSB7XG4gICAgICAgIGNvbnN0IGlzRGVsYXlFbGFwc2VkID0gRGF0ZS5ub3coKSA+PSB0aGlzLl9kcmFnU3RhcnRUaW1lICsgdGhpcy5fZ2V0RHJhZ1N0YXJ0RGVsYXkoZXZlbnQpO1xuICAgICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLl9kcm9wQ29udGFpbmVyO1xuXG4gICAgICAgIGlmICghaXNEZWxheUVsYXBzZWQpIHtcbiAgICAgICAgICB0aGlzLl9lbmREcmFnU2VxdWVuY2UoZXZlbnQpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByZXZlbnQgb3RoZXIgZHJhZyBzZXF1ZW5jZXMgZnJvbSBzdGFydGluZyB3aGlsZSBzb21ldGhpbmcgaW4gdGhlIGNvbnRhaW5lciBpcyBzdGlsbFxuICAgICAgICAvLyBiZWluZyBkcmFnZ2VkLiBUaGlzIGNhbiBoYXBwZW4gd2hpbGUgd2UncmUgd2FpdGluZyBmb3IgdGhlIGRyb3AgYW5pbWF0aW9uIHRvIGZpbmlzaFxuICAgICAgICAvLyBhbmQgY2FuIGNhdXNlIGVycm9ycywgYmVjYXVzZSBzb21lIGVsZW1lbnRzIG1pZ2h0IHN0aWxsIGJlIG1vdmluZyBhcm91bmQuXG4gICAgICAgIGlmICghY29udGFpbmVyIHx8ICghY29udGFpbmVyLmlzRHJhZ2dpbmcoKSAmJiAhY29udGFpbmVyLmlzUmVjZWl2aW5nKCkpKSB7XG4gICAgICAgICAgdGhpcy5faGFzU3RhcnRlZERyYWdnaW5nID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHRoaXMuX3N0YXJ0RHJhZ1NlcXVlbmNlKGV2ZW50KSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFdlIG9ubHkgbmVlZCB0aGUgcHJldmlldyBkaW1lbnNpb25zIGlmIHdlIGhhdmUgYSBib3VuZGFyeSBlbGVtZW50LlxuICAgIGlmICh0aGlzLl9ib3VuZGFyeUVsZW1lbnQpIHtcbiAgICAgIC8vIENhY2hlIHRoZSBwcmV2aWV3IGVsZW1lbnQgcmVjdCBpZiB3ZSBoYXZlbid0IGNhY2hlZCBpdCBhbHJlYWR5IG9yIGlmXG4gICAgICAvLyB3ZSBjYWNoZWQgaXQgdG9vIGVhcmx5IGJlZm9yZSB0aGUgZWxlbWVudCBkaW1lbnNpb25zIHdlcmUgY29tcHV0ZWQuXG4gICAgICBpZiAoIXRoaXMuX3ByZXZpZXdSZWN0IHx8ICghdGhpcy5fcHJldmlld1JlY3Qud2lkdGggJiYgIXRoaXMuX3ByZXZpZXdSZWN0LmhlaWdodCkpIHtcbiAgICAgICAgdGhpcy5fcHJldmlld1JlY3QgPSAodGhpcy5fcHJldmlldyB8fCB0aGlzLl9yb290RWxlbWVudCkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgY29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24gPSB0aGlzLl9nZXRDb25zdHJhaW5lZFBvaW50ZXJQb3NpdGlvbihwb2ludGVyUG9zaXRpb24pO1xuICAgIHRoaXMuX2hhc01vdmVkID0gdHJ1ZTtcbiAgICB0aGlzLl9sYXN0S25vd25Qb2ludGVyUG9zaXRpb24gPSBwb2ludGVyUG9zaXRpb247XG4gICAgdGhpcy5fdXBkYXRlUG9pbnRlckRpcmVjdGlvbkRlbHRhKGNvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uKTtcblxuICAgIGlmICh0aGlzLl9kcm9wQ29udGFpbmVyKSB7XG4gICAgICB0aGlzLl91cGRhdGVBY3RpdmVEcm9wQ29udGFpbmVyKGNvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uLCBwb2ludGVyUG9zaXRpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBhY3RpdmVUcmFuc2Zvcm0gPSB0aGlzLl9hY3RpdmVUcmFuc2Zvcm07XG4gICAgICBhY3RpdmVUcmFuc2Zvcm0ueCA9XG4gICAgICAgICAgY29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24ueCAtIHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLnggKyB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtLng7XG4gICAgICBhY3RpdmVUcmFuc2Zvcm0ueSA9XG4gICAgICAgICAgY29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24ueSAtIHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLnkgKyB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtLnk7XG5cbiAgICAgIHRoaXMuX2FwcGx5Um9vdEVsZW1lbnRUcmFuc2Zvcm0oYWN0aXZlVHJhbnNmb3JtLngsIGFjdGl2ZVRyYW5zZm9ybS55KTtcblxuICAgICAgLy8gQXBwbHkgdHJhbnNmb3JtIGFzIGF0dHJpYnV0ZSBpZiBkcmFnZ2luZyBhbmQgc3ZnIGVsZW1lbnQgdG8gd29yayBmb3IgSUVcbiAgICAgIGlmICh0eXBlb2YgU1ZHRWxlbWVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5fcm9vdEVsZW1lbnQgaW5zdGFuY2VvZiBTVkdFbGVtZW50KSB7XG4gICAgICAgIGNvbnN0IGFwcGxpZWRUcmFuc2Zvcm0gPSBgdHJhbnNsYXRlKCR7YWN0aXZlVHJhbnNmb3JtLnh9ICR7YWN0aXZlVHJhbnNmb3JtLnl9KWA7XG4gICAgICAgIHRoaXMuX3Jvb3RFbGVtZW50LnNldEF0dHJpYnV0ZSgndHJhbnNmb3JtJywgYXBwbGllZFRyYW5zZm9ybSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gU2luY2UgdGhpcyBldmVudCBnZXRzIGZpcmVkIGZvciBldmVyeSBwaXhlbCB3aGlsZSBkcmFnZ2luZywgd2Ugb25seVxuICAgIC8vIHdhbnQgdG8gZmlyZSBpdCBpZiB0aGUgY29uc3VtZXIgb3B0ZWQgaW50byBpdC4gQWxzbyB3ZSBoYXZlIHRvXG4gICAgLy8gcmUtZW50ZXIgdGhlIHpvbmUgYmVjYXVzZSB3ZSBydW4gYWxsIG9mIHRoZSBldmVudHMgb24gdGhlIG91dHNpZGUuXG4gICAgaWYgKHRoaXMuX21vdmVFdmVudHMub2JzZXJ2ZXJzLmxlbmd0aCkge1xuICAgICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiB7XG4gICAgICAgIHRoaXMuX21vdmVFdmVudHMubmV4dCh7XG4gICAgICAgICAgc291cmNlOiB0aGlzLFxuICAgICAgICAgIHBvaW50ZXJQb3NpdGlvbjogY29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24sXG4gICAgICAgICAgZXZlbnQsXG4gICAgICAgICAgZGlzdGFuY2U6IHRoaXMuX2dldERyYWdEaXN0YW5jZShjb25zdHJhaW5lZFBvaW50ZXJQb3NpdGlvbiksXG4gICAgICAgICAgZGVsdGE6IHRoaXMuX3BvaW50ZXJEaXJlY3Rpb25EZWx0YVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBIYW5kbGVyIHRoYXQgaXMgaW52b2tlZCB3aGVuIHRoZSB1c2VyIGxpZnRzIHRoZWlyIHBvaW50ZXIgdXAsIGFmdGVyIGluaXRpYXRpbmcgYSBkcmFnLiAqL1xuICBwcml2YXRlIF9wb2ludGVyVXAgPSAoZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KSA9PiB7XG4gICAgdGhpcy5fZW5kRHJhZ1NlcXVlbmNlKGV2ZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgc3Vic2NyaXB0aW9ucyBhbmQgc3RvcHMgdGhlIGRyYWdnaW5nIHNlcXVlbmNlLlxuICAgKiBAcGFyYW0gZXZlbnQgQnJvd3NlciBldmVudCBvYmplY3QgdGhhdCBlbmRlZCB0aGUgc2VxdWVuY2UuXG4gICAqL1xuICBwcml2YXRlIF9lbmREcmFnU2VxdWVuY2UoZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KSB7XG4gICAgLy8gTm90ZSB0aGF0IGhlcmUgd2UgdXNlIGBpc0RyYWdnaW5nYCBmcm9tIHRoZSBzZXJ2aWNlLCByYXRoZXIgdGhhbiBmcm9tIGB0aGlzYC5cbiAgICAvLyBUaGUgZGlmZmVyZW5jZSBpcyB0aGF0IHRoZSBvbmUgZnJvbSB0aGUgc2VydmljZSByZWZsZWN0cyB3aGV0aGVyIGEgZHJhZ2dpbmcgc2VxdWVuY2VcbiAgICAvLyBoYXMgYmVlbiBpbml0aWF0ZWQsIHdoZXJlYXMgdGhlIG9uZSBvbiBgdGhpc2AgaW5jbHVkZXMgd2hldGhlciB0aGUgdXNlciBoYXMgcGFzc2VkXG4gICAgLy8gdGhlIG1pbmltdW0gZHJhZ2dpbmcgdGhyZXNob2xkLlxuICAgIGlmICghdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5pc0RyYWdnaW5nKHRoaXMpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fcmVtb3ZlU3Vic2NyaXB0aW9ucygpO1xuICAgIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuc3RvcERyYWdnaW5nKHRoaXMpO1xuICAgIHRoaXMuX3RvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMoKTtcblxuICAgIGlmICh0aGlzLl9oYW5kbGVzKSB7XG4gICAgICB0aGlzLl9yb290RWxlbWVudC5zdHlsZS53ZWJraXRUYXBIaWdobGlnaHRDb2xvciA9IHRoaXMuX3Jvb3RFbGVtZW50VGFwSGlnaGxpZ2h0O1xuICAgIH1cblxuICAgIGlmICghdGhpcy5faGFzU3RhcnRlZERyYWdnaW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5yZWxlYXNlZC5uZXh0KHtzb3VyY2U6IHRoaXN9KTtcblxuICAgIGlmICh0aGlzLl9kcm9wQ29udGFpbmVyKSB7XG4gICAgICAvLyBTdG9wIHNjcm9sbGluZyBpbW1lZGlhdGVseSwgaW5zdGVhZCBvZiB3YWl0aW5nIGZvciB0aGUgYW5pbWF0aW9uIHRvIGZpbmlzaC5cbiAgICAgIHRoaXMuX2Ryb3BDb250YWluZXIuX3N0b3BTY3JvbGxpbmcoKTtcbiAgICAgIHRoaXMuX2FuaW1hdGVQcmV2aWV3VG9QbGFjZWhvbGRlcigpLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLl9jbGVhbnVwRHJhZ0FydGlmYWN0cyhldmVudCk7XG4gICAgICAgIHRoaXMuX2NsZWFudXBDYWNoZWREaW1lbnNpb25zKCk7XG4gICAgICAgIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuc3RvcERyYWdnaW5nKHRoaXMpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIENvbnZlcnQgdGhlIGFjdGl2ZSB0cmFuc2Zvcm0gaW50byBhIHBhc3NpdmUgb25lLiBUaGlzIG1lYW5zIHRoYXQgbmV4dCB0aW1lXG4gICAgICAvLyB0aGUgdXNlciBzdGFydHMgZHJhZ2dpbmcgdGhlIGl0ZW0sIGl0cyBwb3NpdGlvbiB3aWxsIGJlIGNhbGN1bGF0ZWQgcmVsYXRpdmVseVxuICAgICAgLy8gdG8gdGhlIG5ldyBwYXNzaXZlIHRyYW5zZm9ybS5cbiAgICAgIHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm0ueCA9IHRoaXMuX2FjdGl2ZVRyYW5zZm9ybS54O1xuICAgICAgdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybS55ID0gdGhpcy5fYWN0aXZlVHJhbnNmb3JtLnk7XG4gICAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5lbmRlZC5uZXh0KHtcbiAgICAgICAgICBzb3VyY2U6IHRoaXMsXG4gICAgICAgICAgZGlzdGFuY2U6IHRoaXMuX2dldERyYWdEaXN0YW5jZSh0aGlzLl9nZXRQb2ludGVyUG9zaXRpb25PblBhZ2UoZXZlbnQpKVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5fY2xlYW51cENhY2hlZERpbWVuc2lvbnMoKTtcbiAgICAgIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuc3RvcERyYWdnaW5nKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTdGFydHMgdGhlIGRyYWdnaW5nIHNlcXVlbmNlLiAqL1xuICBwcml2YXRlIF9zdGFydERyYWdTZXF1ZW5jZShldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpIHtcbiAgICBpZiAoaXNUb3VjaEV2ZW50KGV2ZW50KSkge1xuICAgICAgdGhpcy5fbGFzdFRvdWNoRXZlbnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICB9XG5cbiAgICB0aGlzLl90b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKCk7XG5cbiAgICBjb25zdCBkcm9wQ29udGFpbmVyID0gdGhpcy5fZHJvcENvbnRhaW5lcjtcblxuICAgIGlmIChkcm9wQ29udGFpbmVyKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fcm9vdEVsZW1lbnQ7XG4gICAgICBjb25zdCBwYXJlbnQgPSBlbGVtZW50LnBhcmVudE5vZGUhO1xuICAgICAgY29uc3QgcHJldmlldyA9IHRoaXMuX3ByZXZpZXcgPSB0aGlzLl9jcmVhdGVQcmV2aWV3RWxlbWVudCgpO1xuICAgICAgY29uc3QgcGxhY2Vob2xkZXIgPSB0aGlzLl9wbGFjZWhvbGRlciA9IHRoaXMuX2NyZWF0ZVBsYWNlaG9sZGVyRWxlbWVudCgpO1xuICAgICAgY29uc3QgYW5jaG9yID0gdGhpcy5fYW5jaG9yID0gdGhpcy5fYW5jaG9yIHx8IHRoaXMuX2RvY3VtZW50LmNyZWF0ZUNvbW1lbnQoJycpO1xuXG4gICAgICAvLyBJbnNlcnQgYW4gYW5jaG9yIG5vZGUgc28gdGhhdCB3ZSBjYW4gcmVzdG9yZSB0aGUgZWxlbWVudCdzIHBvc2l0aW9uIGluIHRoZSBET00uXG4gICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGFuY2hvciwgZWxlbWVudCk7XG5cbiAgICAgIC8vIFdlIG1vdmUgdGhlIGVsZW1lbnQgb3V0IGF0IHRoZSBlbmQgb2YgdGhlIGJvZHkgYW5kIHdlIG1ha2UgaXQgaGlkZGVuLCBiZWNhdXNlIGtlZXBpbmcgaXQgaW5cbiAgICAgIC8vIHBsYWNlIHdpbGwgdGhyb3cgb2ZmIHRoZSBjb25zdW1lcidzIGA6bGFzdC1jaGlsZGAgc2VsZWN0b3JzLiBXZSBjYW4ndCByZW1vdmUgdGhlIGVsZW1lbnRcbiAgICAgIC8vIGZyb20gdGhlIERPTSBjb21wbGV0ZWx5LCBiZWNhdXNlIGlPUyB3aWxsIHN0b3AgZmlyaW5nIGFsbCBzdWJzZXF1ZW50IGV2ZW50cyBpbiB0aGUgY2hhaW4uXG4gICAgICB0b2dnbGVWaXNpYmlsaXR5KGVsZW1lbnQsIGZhbHNlKTtcbiAgICAgIHRoaXMuX2RvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocGFyZW50LnJlcGxhY2VDaGlsZChwbGFjZWhvbGRlciwgZWxlbWVudCkpO1xuICAgICAgZ2V0UHJldmlld0luc2VydGlvblBvaW50KHRoaXMuX2RvY3VtZW50KS5hcHBlbmRDaGlsZChwcmV2aWV3KTtcbiAgICAgIHRoaXMuc3RhcnRlZC5uZXh0KHtzb3VyY2U6IHRoaXN9KTsgLy8gRW1pdCBiZWZvcmUgbm90aWZ5aW5nIHRoZSBjb250YWluZXIuXG4gICAgICBkcm9wQ29udGFpbmVyLnN0YXJ0KCk7XG4gICAgICB0aGlzLl9pbml0aWFsQ29udGFpbmVyID0gZHJvcENvbnRhaW5lcjtcbiAgICAgIHRoaXMuX2luaXRpYWxJbmRleCA9IGRyb3BDb250YWluZXIuZ2V0SXRlbUluZGV4KHRoaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnN0YXJ0ZWQubmV4dCh7c291cmNlOiB0aGlzfSk7XG4gICAgICB0aGlzLl9pbml0aWFsQ29udGFpbmVyID0gdGhpcy5faW5pdGlhbEluZGV4ID0gdW5kZWZpbmVkITtcbiAgICB9XG5cbiAgICAvLyBJbXBvcnRhbnQgdG8gcnVuIGFmdGVyIHdlJ3ZlIGNhbGxlZCBgc3RhcnRgIG9uIHRoZSBwYXJlbnQgY29udGFpbmVyXG4gICAgLy8gc28gdGhhdCBpdCBoYXMgaGFkIHRpbWUgdG8gcmVzb2x2ZSBpdHMgc2Nyb2xsYWJsZSBwYXJlbnRzLlxuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5jYWNoZShkcm9wQ29udGFpbmVyID8gZHJvcENvbnRhaW5lci5nZXRTY3JvbGxhYmxlUGFyZW50cygpIDogW10pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgdGhlIGRpZmZlcmVudCB2YXJpYWJsZXMgYW5kIHN1YnNjcmlwdGlvbnNcbiAgICogdGhhdCB3aWxsIGJlIG5lY2Vzc2FyeSBmb3IgdGhlIGRyYWdnaW5nIHNlcXVlbmNlLlxuICAgKiBAcGFyYW0gcmVmZXJlbmNlRWxlbWVudCBFbGVtZW50IHRoYXQgc3RhcnRlZCB0aGUgZHJhZyBzZXF1ZW5jZS5cbiAgICogQHBhcmFtIGV2ZW50IEJyb3dzZXIgZXZlbnQgb2JqZWN0IHRoYXQgc3RhcnRlZCB0aGUgc2VxdWVuY2UuXG4gICAqL1xuICBwcml2YXRlIF9pbml0aWFsaXplRHJhZ1NlcXVlbmNlKHJlZmVyZW5jZUVsZW1lbnQ6IEhUTUxFbGVtZW50LCBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpIHtcbiAgICAvLyBBbHdheXMgc3RvcCBwcm9wYWdhdGlvbiBmb3IgdGhlIGV2ZW50IHRoYXQgaW5pdGlhbGl6ZXNcbiAgICAvLyB0aGUgZHJhZ2dpbmcgc2VxdWVuY2UsIGluIG9yZGVyIHRvIHByZXZlbnQgaXQgZnJvbSBwb3RlbnRpYWxseVxuICAgIC8vIHN0YXJ0aW5nIGFub3RoZXIgc2VxdWVuY2UgZm9yIGEgZHJhZ2dhYmxlIHBhcmVudCBzb21ld2hlcmUgdXAgdGhlIERPTSB0cmVlLlxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgY29uc3QgaXNEcmFnZ2luZyA9IHRoaXMuaXNEcmFnZ2luZygpO1xuICAgIGNvbnN0IGlzVG91Y2hTZXF1ZW5jZSA9IGlzVG91Y2hFdmVudChldmVudCk7XG4gICAgY29uc3QgaXNBdXhpbGlhcnlNb3VzZUJ1dHRvbiA9ICFpc1RvdWNoU2VxdWVuY2UgJiYgKGV2ZW50IGFzIE1vdXNlRXZlbnQpLmJ1dHRvbiAhPT0gMDtcbiAgICBjb25zdCByb290RWxlbWVudCA9IHRoaXMuX3Jvb3RFbGVtZW50O1xuICAgIGNvbnN0IGlzU3ludGhldGljRXZlbnQgPSAhaXNUb3VjaFNlcXVlbmNlICYmIHRoaXMuX2xhc3RUb3VjaEV2ZW50VGltZSAmJlxuICAgICAgdGhpcy5fbGFzdFRvdWNoRXZlbnRUaW1lICsgTU9VU0VfRVZFTlRfSUdOT1JFX1RJTUUgPiBEYXRlLm5vdygpO1xuXG4gICAgLy8gSWYgdGhlIGV2ZW50IHN0YXJ0ZWQgZnJvbSBhbiBlbGVtZW50IHdpdGggdGhlIG5hdGl2ZSBIVE1MIGRyYWcmZHJvcCwgaXQnbGwgaW50ZXJmZXJlXG4gICAgLy8gd2l0aCBvdXIgb3duIGRyYWdnaW5nIChlLmcuIGBpbWdgIHRhZ3MgZG8gaXQgYnkgZGVmYXVsdCkuIFByZXZlbnQgdGhlIGRlZmF1bHQgYWN0aW9uXG4gICAgLy8gdG8gc3RvcCBpdCBmcm9tIGhhcHBlbmluZy4gTm90ZSB0aGF0IHByZXZlbnRpbmcgb24gYGRyYWdzdGFydGAgYWxzbyBzZWVtcyB0byB3b3JrLCBidXRcbiAgICAvLyBpdCdzIGZsYWt5IGFuZCBpdCBmYWlscyBpZiB0aGUgdXNlciBkcmFncyBpdCBhd2F5IHF1aWNrbHkuIEFsc28gbm90ZSB0aGF0IHdlIG9ubHkgd2FudFxuICAgIC8vIHRvIGRvIHRoaXMgZm9yIGBtb3VzZWRvd25gIHNpbmNlIGRvaW5nIHRoZSBzYW1lIGZvciBgdG91Y2hzdGFydGAgd2lsbCBzdG9wIGFueSBgY2xpY2tgXG4gICAgLy8gZXZlbnRzIGZyb20gZmlyaW5nIG9uIHRvdWNoIGRldmljZXMuXG4gICAgaWYgKGV2ZW50LnRhcmdldCAmJiAoZXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5kcmFnZ2FibGUgJiYgZXZlbnQudHlwZSA9PT0gJ21vdXNlZG93bicpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuXG4gICAgLy8gQWJvcnQgaWYgdGhlIHVzZXIgaXMgYWxyZWFkeSBkcmFnZ2luZyBvciBpcyB1c2luZyBhIG1vdXNlIGJ1dHRvbiBvdGhlciB0aGFuIHRoZSBwcmltYXJ5IG9uZS5cbiAgICBpZiAoaXNEcmFnZ2luZyB8fCBpc0F1eGlsaWFyeU1vdXNlQnV0dG9uIHx8IGlzU3ludGhldGljRXZlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSd2ZSBnb3QgaGFuZGxlcywgd2UgbmVlZCB0byBkaXNhYmxlIHRoZSB0YXAgaGlnaGxpZ2h0IG9uIHRoZSBlbnRpcmUgcm9vdCBlbGVtZW50LFxuICAgIC8vIG90aGVyd2lzZSBpT1Mgd2lsbCBzdGlsbCBhZGQgaXQsIGV2ZW4gdGhvdWdoIGFsbCB0aGUgZHJhZyBpbnRlcmFjdGlvbnMgb24gdGhlIGhhbmRsZVxuICAgIC8vIGFyZSBkaXNhYmxlZC5cbiAgICBpZiAodGhpcy5faGFuZGxlcy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuX3Jvb3RFbGVtZW50VGFwSGlnaGxpZ2h0ID0gcm9vdEVsZW1lbnQuc3R5bGUud2Via2l0VGFwSGlnaGxpZ2h0Q29sb3IgfHwgJyc7XG4gICAgICByb290RWxlbWVudC5zdHlsZS53ZWJraXRUYXBIaWdobGlnaHRDb2xvciA9ICd0cmFuc3BhcmVudCc7XG4gICAgfVxuXG4gICAgdGhpcy5faGFzU3RhcnRlZERyYWdnaW5nID0gdGhpcy5faGFzTW92ZWQgPSBmYWxzZTtcblxuICAgIC8vIEF2b2lkIG11bHRpcGxlIHN1YnNjcmlwdGlvbnMgYW5kIG1lbW9yeSBsZWFrcyB3aGVuIG11bHRpIHRvdWNoXG4gICAgLy8gKGlzRHJhZ2dpbmcgY2hlY2sgYWJvdmUgaXNuJ3QgZW5vdWdoIGJlY2F1c2Ugb2YgcG9zc2libGUgdGVtcG9yYWwgYW5kL29yIGRpbWVuc2lvbmFsIGRlbGF5cylcbiAgICB0aGlzLl9yZW1vdmVTdWJzY3JpcHRpb25zKCk7XG4gICAgdGhpcy5fcG9pbnRlck1vdmVTdWJzY3JpcHRpb24gPSB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnBvaW50ZXJNb3ZlLnN1YnNjcmliZSh0aGlzLl9wb2ludGVyTW92ZSk7XG4gICAgdGhpcy5fcG9pbnRlclVwU3Vic2NyaXB0aW9uID0gdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5wb2ludGVyVXAuc3Vic2NyaWJlKHRoaXMuX3BvaW50ZXJVcCk7XG4gICAgdGhpcy5fc2Nyb2xsU3Vic2NyaXB0aW9uID0gdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5zY3JvbGwuc3Vic2NyaWJlKHNjcm9sbEV2ZW50ID0+IHtcbiAgICAgIHRoaXMuX3VwZGF0ZU9uU2Nyb2xsKHNjcm9sbEV2ZW50KTtcbiAgICB9KTtcblxuICAgIGlmICh0aGlzLl9ib3VuZGFyeUVsZW1lbnQpIHtcbiAgICAgIHRoaXMuX2JvdW5kYXJ5UmVjdCA9IGdldE11dGFibGVDbGllbnRSZWN0KHRoaXMuX2JvdW5kYXJ5RWxlbWVudCk7XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgaGF2ZSBhIGN1c3RvbSBwcmV2aWV3IHdlIGNhbid0IGtub3cgYWhlYWQgb2YgdGltZSBob3cgbGFyZ2UgaXQnbGwgYmUgc28gd2UgcG9zaXRpb25cbiAgICAvLyBpdCBuZXh0IHRvIHRoZSBjdXJzb3IuIFRoZSBleGNlcHRpb24gaXMgd2hlbiB0aGUgY29uc3VtZXIgaGFzIG9wdGVkIGludG8gbWFraW5nIHRoZSBwcmV2aWV3XG4gICAgLy8gdGhlIHNhbWUgc2l6ZSBhcyB0aGUgcm9vdCBlbGVtZW50LCBpbiB3aGljaCBjYXNlIHdlIGRvIGtub3cgdGhlIHNpemUuXG4gICAgY29uc3QgcHJldmlld1RlbXBsYXRlID0gdGhpcy5fcHJldmlld1RlbXBsYXRlO1xuICAgIHRoaXMuX3BpY2t1cFBvc2l0aW9uSW5FbGVtZW50ID0gcHJldmlld1RlbXBsYXRlICYmIHByZXZpZXdUZW1wbGF0ZS50ZW1wbGF0ZSAmJlxuICAgICAgIXByZXZpZXdUZW1wbGF0ZS5tYXRjaFNpemUgPyB7eDogMCwgeTogMH0gOlxuICAgICAgdGhpcy5fZ2V0UG9pbnRlclBvc2l0aW9uSW5FbGVtZW50KHJlZmVyZW5jZUVsZW1lbnQsIGV2ZW50KTtcbiAgICBjb25zdCBwb2ludGVyUG9zaXRpb24gPSB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZSA9IHRoaXMuX2xhc3RLbm93blBvaW50ZXJQb3NpdGlvbiA9XG4gICAgICAgIHRoaXMuX2dldFBvaW50ZXJQb3NpdGlvbk9uUGFnZShldmVudCk7XG4gICAgdGhpcy5fcG9pbnRlckRpcmVjdGlvbkRlbHRhID0ge3g6IDAsIHk6IDB9O1xuICAgIHRoaXMuX3BvaW50ZXJQb3NpdGlvbkF0TGFzdERpcmVjdGlvbkNoYW5nZSA9IHt4OiBwb2ludGVyUG9zaXRpb24ueCwgeTogcG9pbnRlclBvc2l0aW9uLnl9O1xuICAgIHRoaXMuX2RyYWdTdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuc3RhcnREcmFnZ2luZyh0aGlzLCBldmVudCk7XG4gIH1cblxuICAvKiogQ2xlYW5zIHVwIHRoZSBET00gYXJ0aWZhY3RzIHRoYXQgd2VyZSBhZGRlZCB0byBmYWNpbGl0YXRlIHRoZSBlbGVtZW50IGJlaW5nIGRyYWdnZWQuICovXG4gIHByaXZhdGUgX2NsZWFudXBEcmFnQXJ0aWZhY3RzKGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCkge1xuICAgIC8vIFJlc3RvcmUgdGhlIGVsZW1lbnQncyB2aXNpYmlsaXR5IGFuZCBpbnNlcnQgaXQgYXQgaXRzIG9sZCBwb3NpdGlvbiBpbiB0aGUgRE9NLlxuICAgIC8vIEl0J3MgaW1wb3J0YW50IHRoYXQgd2UgbWFpbnRhaW4gdGhlIHBvc2l0aW9uLCBiZWNhdXNlIG1vdmluZyB0aGUgZWxlbWVudCBhcm91bmQgaW4gdGhlIERPTVxuICAgIC8vIGNhbiB0aHJvdyBvZmYgYE5nRm9yYCB3aGljaCBkb2VzIHNtYXJ0IGRpZmZpbmcgYW5kIHJlLWNyZWF0ZXMgZWxlbWVudHMgb25seSB3aGVuIG5lY2Vzc2FyeSxcbiAgICAvLyB3aGlsZSBtb3ZpbmcgdGhlIGV4aXN0aW5nIGVsZW1lbnRzIGluIGFsbCBvdGhlciBjYXNlcy5cbiAgICB0b2dnbGVWaXNpYmlsaXR5KHRoaXMuX3Jvb3RFbGVtZW50LCB0cnVlKTtcbiAgICB0aGlzLl9hbmNob3IucGFyZW50Tm9kZSEucmVwbGFjZUNoaWxkKHRoaXMuX3Jvb3RFbGVtZW50LCB0aGlzLl9hbmNob3IpO1xuXG4gICAgdGhpcy5fZGVzdHJveVByZXZpZXcoKTtcbiAgICB0aGlzLl9kZXN0cm95UGxhY2Vob2xkZXIoKTtcbiAgICB0aGlzLl9ib3VuZGFyeVJlY3QgPSB0aGlzLl9wcmV2aWV3UmVjdCA9IHVuZGVmaW5lZDtcblxuICAgIC8vIFJlLWVudGVyIHRoZSBOZ1pvbmUgc2luY2Ugd2UgYm91bmQgYGRvY3VtZW50YCBldmVudHMgb24gdGhlIG91dHNpZGUuXG4gICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiB7XG4gICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLl9kcm9wQ29udGFpbmVyITtcbiAgICAgIGNvbnN0IGN1cnJlbnRJbmRleCA9IGNvbnRhaW5lci5nZXRJdGVtSW5kZXgodGhpcyk7XG4gICAgICBjb25zdCBwb2ludGVyUG9zaXRpb24gPSB0aGlzLl9nZXRQb2ludGVyUG9zaXRpb25PblBhZ2UoZXZlbnQpO1xuICAgICAgY29uc3QgZGlzdGFuY2UgPSB0aGlzLl9nZXREcmFnRGlzdGFuY2UodGhpcy5fZ2V0UG9pbnRlclBvc2l0aW9uT25QYWdlKGV2ZW50KSk7XG4gICAgICBjb25zdCBpc1BvaW50ZXJPdmVyQ29udGFpbmVyID0gY29udGFpbmVyLl9pc092ZXJDb250YWluZXIoXG4gICAgICAgIHBvaW50ZXJQb3NpdGlvbi54LCBwb2ludGVyUG9zaXRpb24ueSk7XG5cbiAgICAgIHRoaXMuZW5kZWQubmV4dCh7c291cmNlOiB0aGlzLCBkaXN0YW5jZX0pO1xuICAgICAgdGhpcy5kcm9wcGVkLm5leHQoe1xuICAgICAgICBpdGVtOiB0aGlzLFxuICAgICAgICBjdXJyZW50SW5kZXgsXG4gICAgICAgIHByZXZpb3VzSW5kZXg6IHRoaXMuX2luaXRpYWxJbmRleCxcbiAgICAgICAgY29udGFpbmVyOiBjb250YWluZXIsXG4gICAgICAgIHByZXZpb3VzQ29udGFpbmVyOiB0aGlzLl9pbml0aWFsQ29udGFpbmVyLFxuICAgICAgICBpc1BvaW50ZXJPdmVyQ29udGFpbmVyLFxuICAgICAgICBkaXN0YW5jZVxuICAgICAgfSk7XG4gICAgICBjb250YWluZXIuZHJvcCh0aGlzLCBjdXJyZW50SW5kZXgsIHRoaXMuX2luaXRpYWxDb250YWluZXIsIGlzUG9pbnRlck92ZXJDb250YWluZXIsIGRpc3RhbmNlLFxuICAgICAgICAgIHRoaXMuX2luaXRpYWxJbmRleCk7XG4gICAgICB0aGlzLl9kcm9wQ29udGFpbmVyID0gdGhpcy5faW5pdGlhbENvbnRhaW5lcjtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBpdGVtJ3MgcG9zaXRpb24gaW4gaXRzIGRyb3AgY29udGFpbmVyLCBvciBtb3ZlcyBpdFxuICAgKiBpbnRvIGEgbmV3IG9uZSwgZGVwZW5kaW5nIG9uIGl0cyBjdXJyZW50IGRyYWcgcG9zaXRpb24uXG4gICAqL1xuICBwcml2YXRlIF91cGRhdGVBY3RpdmVEcm9wQ29udGFpbmVyKHt4LCB5fTogUG9pbnQsIHt4OiByYXdYLCB5OiByYXdZfTogUG9pbnQpIHtcbiAgICAvLyBEcm9wIGNvbnRhaW5lciB0aGF0IGRyYWdnYWJsZSBoYXMgYmVlbiBtb3ZlZCBpbnRvLlxuICAgIGxldCBuZXdDb250YWluZXIgPSB0aGlzLl9pbml0aWFsQ29udGFpbmVyLl9nZXRTaWJsaW5nQ29udGFpbmVyRnJvbVBvc2l0aW9uKHRoaXMsIHgsIHkpO1xuXG4gICAgLy8gSWYgd2UgY291bGRuJ3QgZmluZCBhIG5ldyBjb250YWluZXIgdG8gbW92ZSB0aGUgaXRlbSBpbnRvLCBhbmQgdGhlIGl0ZW0gaGFzIGxlZnQgaXRzXG4gICAgLy8gaW5pdGlhbCBjb250YWluZXIsIGNoZWNrIHdoZXRoZXIgdGhlIGl0J3Mgb3ZlciB0aGUgaW5pdGlhbCBjb250YWluZXIuIFRoaXMgaGFuZGxlcyB0aGVcbiAgICAvLyBjYXNlIHdoZXJlIHR3byBjb250YWluZXJzIGFyZSBjb25uZWN0ZWQgb25lIHdheSBhbmQgdGhlIHVzZXIgdHJpZXMgdG8gdW5kbyBkcmFnZ2luZyBhblxuICAgIC8vIGl0ZW0gaW50byBhIG5ldyBjb250YWluZXIuXG4gICAgaWYgKCFuZXdDb250YWluZXIgJiYgdGhpcy5fZHJvcENvbnRhaW5lciAhPT0gdGhpcy5faW5pdGlhbENvbnRhaW5lciAmJlxuICAgICAgICB0aGlzLl9pbml0aWFsQ29udGFpbmVyLl9pc092ZXJDb250YWluZXIoeCwgeSkpIHtcbiAgICAgIG5ld0NvbnRhaW5lciA9IHRoaXMuX2luaXRpYWxDb250YWluZXI7XG4gICAgfVxuXG4gICAgaWYgKG5ld0NvbnRhaW5lciAmJiBuZXdDb250YWluZXIgIT09IHRoaXMuX2Ryb3BDb250YWluZXIpIHtcbiAgICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAvLyBOb3RpZnkgdGhlIG9sZCBjb250YWluZXIgdGhhdCB0aGUgaXRlbSBoYXMgbGVmdC5cbiAgICAgICAgdGhpcy5leGl0ZWQubmV4dCh7aXRlbTogdGhpcywgY29udGFpbmVyOiB0aGlzLl9kcm9wQ29udGFpbmVyIX0pO1xuICAgICAgICB0aGlzLl9kcm9wQ29udGFpbmVyIS5leGl0KHRoaXMpO1xuICAgICAgICAvLyBOb3RpZnkgdGhlIG5ldyBjb250YWluZXIgdGhhdCB0aGUgaXRlbSBoYXMgZW50ZXJlZC5cbiAgICAgICAgdGhpcy5fZHJvcENvbnRhaW5lciA9IG5ld0NvbnRhaW5lciE7XG4gICAgICAgIHRoaXMuX2Ryb3BDb250YWluZXIuZW50ZXIodGhpcywgeCwgeSwgbmV3Q29udGFpbmVyID09PSB0aGlzLl9pbml0aWFsQ29udGFpbmVyICYmXG4gICAgICAgICAgICAvLyBJZiB3ZSdyZSByZS1lbnRlcmluZyB0aGUgaW5pdGlhbCBjb250YWluZXIgYW5kIHNvcnRpbmcgaXMgZGlzYWJsZWQsXG4gICAgICAgICAgICAvLyBwdXQgaXRlbSB0aGUgaW50byBpdHMgc3RhcnRpbmcgaW5kZXggdG8gYmVnaW4gd2l0aC5cbiAgICAgICAgICAgIG5ld0NvbnRhaW5lci5zb3J0aW5nRGlzYWJsZWQgPyB0aGlzLl9pbml0aWFsSW5kZXggOiB1bmRlZmluZWQpO1xuICAgICAgICB0aGlzLmVudGVyZWQubmV4dCh7XG4gICAgICAgICAgaXRlbTogdGhpcyxcbiAgICAgICAgICBjb250YWluZXI6IG5ld0NvbnRhaW5lciEsXG4gICAgICAgICAgY3VycmVudEluZGV4OiBuZXdDb250YWluZXIhLmdldEl0ZW1JbmRleCh0aGlzKVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMuX2Ryb3BDb250YWluZXIhLl9zdGFydFNjcm9sbGluZ0lmTmVjZXNzYXJ5KHJhd1gsIHJhd1kpO1xuICAgIHRoaXMuX2Ryb3BDb250YWluZXIhLl9zb3J0SXRlbSh0aGlzLCB4LCB5LCB0aGlzLl9wb2ludGVyRGlyZWN0aW9uRGVsdGEpO1xuICAgIHRoaXMuX3ByZXZpZXcuc3R5bGUudHJhbnNmb3JtID1cbiAgICAgICAgZ2V0VHJhbnNmb3JtKHggLSB0aGlzLl9waWNrdXBQb3NpdGlvbkluRWxlbWVudC54LCB5IC0gdGhpcy5fcGlja3VwUG9zaXRpb25JbkVsZW1lbnQueSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyB0aGUgZWxlbWVudCB0aGF0IHdpbGwgYmUgcmVuZGVyZWQgbmV4dCB0byB0aGUgdXNlcidzIHBvaW50ZXJcbiAgICogYW5kIHdpbGwgYmUgdXNlZCBhcyBhIHByZXZpZXcgb2YgdGhlIGVsZW1lbnQgdGhhdCBpcyBiZWluZyBkcmFnZ2VkLlxuICAgKi9cbiAgcHJpdmF0ZSBfY3JlYXRlUHJldmlld0VsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IHByZXZpZXdDb25maWcgPSB0aGlzLl9wcmV2aWV3VGVtcGxhdGU7XG4gICAgY29uc3QgcHJldmlld0NsYXNzID0gdGhpcy5wcmV2aWV3Q2xhc3M7XG4gICAgY29uc3QgcHJldmlld1RlbXBsYXRlID0gcHJldmlld0NvbmZpZyA/IHByZXZpZXdDb25maWcudGVtcGxhdGUgOiBudWxsO1xuICAgIGxldCBwcmV2aWV3OiBIVE1MRWxlbWVudDtcblxuICAgIGlmIChwcmV2aWV3VGVtcGxhdGUgJiYgcHJldmlld0NvbmZpZykge1xuICAgICAgLy8gTWVhc3VyZSB0aGUgZWxlbWVudCBiZWZvcmUgd2UndmUgaW5zZXJ0ZWQgdGhlIHByZXZpZXdcbiAgICAgIC8vIHNpbmNlIHRoZSBpbnNlcnRpb24gY291bGQgdGhyb3cgb2ZmIHRoZSBtZWFzdXJlbWVudC5cbiAgICAgIGNvbnN0IHJvb3RSZWN0ID0gcHJldmlld0NvbmZpZy5tYXRjaFNpemUgPyB0aGlzLl9yb290RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSA6IG51bGw7XG4gICAgICBjb25zdCB2aWV3UmVmID0gcHJldmlld0NvbmZpZy52aWV3Q29udGFpbmVyLmNyZWF0ZUVtYmVkZGVkVmlldyhwcmV2aWV3VGVtcGxhdGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmV2aWV3Q29uZmlnLmNvbnRleHQpO1xuICAgICAgdmlld1JlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICBwcmV2aWV3ID0gZ2V0Um9vdE5vZGUodmlld1JlZiwgdGhpcy5fZG9jdW1lbnQpO1xuICAgICAgdGhpcy5fcHJldmlld1JlZiA9IHZpZXdSZWY7XG4gICAgICBpZiAocHJldmlld0NvbmZpZy5tYXRjaFNpemUpIHtcbiAgICAgICAgbWF0Y2hFbGVtZW50U2l6ZShwcmV2aWV3LCByb290UmVjdCEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJldmlldy5zdHlsZS50cmFuc2Zvcm0gPVxuICAgICAgICAgICAgZ2V0VHJhbnNmb3JtKHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLngsIHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLnkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fcm9vdEVsZW1lbnQ7XG4gICAgICBwcmV2aWV3ID0gZGVlcENsb25lTm9kZShlbGVtZW50KTtcbiAgICAgIG1hdGNoRWxlbWVudFNpemUocHJldmlldywgZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSk7XG4gICAgfVxuXG4gICAgZXh0ZW5kU3R5bGVzKHByZXZpZXcuc3R5bGUsIHtcbiAgICAgIC8vIEl0J3MgaW1wb3J0YW50IHRoYXQgd2UgZGlzYWJsZSB0aGUgcG9pbnRlciBldmVudHMgb24gdGhlIHByZXZpZXcsIGJlY2F1c2VcbiAgICAgIC8vIGl0IGNhbiB0aHJvdyBvZmYgdGhlIGBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50YCBjYWxscyBpbiB0aGUgYENka0Ryb3BMaXN0YC5cbiAgICAgIHBvaW50ZXJFdmVudHM6ICdub25lJyxcbiAgICAgIC8vIFdlIGhhdmUgdG8gcmVzZXQgdGhlIG1hcmdpbiwgYmVjYXVzZSBpdCBjYW4gdGhyb3cgb2ZmIHBvc2l0aW9uaW5nIHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydC5cbiAgICAgIG1hcmdpbjogJzAnLFxuICAgICAgcG9zaXRpb246ICdmaXhlZCcsXG4gICAgICB0b3A6ICcwJyxcbiAgICAgIGxlZnQ6ICcwJyxcbiAgICAgIHpJbmRleDogYCR7dGhpcy5fY29uZmlnLnpJbmRleCB8fCAxMDAwfWBcbiAgICB9KTtcblxuICAgIHRvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMocHJldmlldywgZmFsc2UpO1xuICAgIHByZXZpZXcuY2xhc3NMaXN0LmFkZCgnY2RrLWRyYWctcHJldmlldycpO1xuICAgIHByZXZpZXcuc2V0QXR0cmlidXRlKCdkaXInLCB0aGlzLl9kaXJlY3Rpb24pO1xuXG4gICAgaWYgKHByZXZpZXdDbGFzcykge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkocHJldmlld0NsYXNzKSkge1xuICAgICAgICBwcmV2aWV3Q2xhc3MuZm9yRWFjaChjbGFzc05hbWUgPT4gcHJldmlldy5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJldmlldy5jbGFzc0xpc3QuYWRkKHByZXZpZXdDbGFzcyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHByZXZpZXc7XG4gIH1cblxuICAvKipcbiAgICogQW5pbWF0ZXMgdGhlIHByZXZpZXcgZWxlbWVudCBmcm9tIGl0cyBjdXJyZW50IHBvc2l0aW9uIHRvIHRoZSBsb2NhdGlvbiBvZiB0aGUgZHJvcCBwbGFjZWhvbGRlci5cbiAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIGFuaW1hdGlvbiBjb21wbGV0ZXMuXG4gICAqL1xuICBwcml2YXRlIF9hbmltYXRlUHJldmlld1RvUGxhY2Vob2xkZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gSWYgdGhlIHVzZXIgaGFzbid0IG1vdmVkIHlldCwgdGhlIHRyYW5zaXRpb25lbmQgZXZlbnQgd29uJ3QgZmlyZS5cbiAgICBpZiAoIXRoaXMuX2hhc01vdmVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgY29uc3QgcGxhY2Vob2xkZXJSZWN0ID0gdGhpcy5fcGxhY2Vob2xkZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAvLyBBcHBseSB0aGUgY2xhc3MgdGhhdCBhZGRzIGEgdHJhbnNpdGlvbiB0byB0aGUgcHJldmlldy5cbiAgICB0aGlzLl9wcmV2aWV3LmNsYXNzTGlzdC5hZGQoJ2Nkay1kcmFnLWFuaW1hdGluZycpO1xuXG4gICAgLy8gTW92ZSB0aGUgcHJldmlldyB0byB0aGUgcGxhY2Vob2xkZXIgcG9zaXRpb24uXG4gICAgdGhpcy5fcHJldmlldy5zdHlsZS50cmFuc2Zvcm0gPSBnZXRUcmFuc2Zvcm0ocGxhY2Vob2xkZXJSZWN0LmxlZnQsIHBsYWNlaG9sZGVyUmVjdC50b3ApO1xuXG4gICAgLy8gSWYgdGhlIGVsZW1lbnQgZG9lc24ndCBoYXZlIGEgYHRyYW5zaXRpb25gLCB0aGUgYHRyYW5zaXRpb25lbmRgIGV2ZW50IHdvbid0IGZpcmUuIFNpbmNlXG4gICAgLy8gd2UgbmVlZCB0byB0cmlnZ2VyIGEgc3R5bGUgcmVjYWxjdWxhdGlvbiBpbiBvcmRlciBmb3IgdGhlIGBjZGstZHJhZy1hbmltYXRpbmdgIGNsYXNzIHRvXG4gICAgLy8gYXBwbHkgaXRzIHN0eWxlLCB3ZSB0YWtlIGFkdmFudGFnZSBvZiB0aGUgYXZhaWxhYmxlIGluZm8gdG8gZmlndXJlIG91dCB3aGV0aGVyIHdlIG5lZWQgdG9cbiAgICAvLyBiaW5kIHRoZSBldmVudCBpbiB0aGUgZmlyc3QgcGxhY2UuXG4gICAgY29uc3QgZHVyYXRpb24gPSBnZXRUcmFuc2Zvcm1UcmFuc2l0aW9uRHVyYXRpb25Jbk1zKHRoaXMuX3ByZXZpZXcpO1xuXG4gICAgaWYgKGR1cmF0aW9uID09PSAwKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIGNvbnN0IGhhbmRsZXIgPSAoKGV2ZW50OiBUcmFuc2l0aW9uRXZlbnQpID0+IHtcbiAgICAgICAgICBpZiAoIWV2ZW50IHx8IChldmVudC50YXJnZXQgPT09IHRoaXMuX3ByZXZpZXcgJiYgZXZlbnQucHJvcGVydHlOYW1lID09PSAndHJhbnNmb3JtJykpIHtcbiAgICAgICAgICAgIHRoaXMuX3ByZXZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIGhhbmRsZXIpO1xuICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkgYXMgRXZlbnRMaXN0ZW5lck9yRXZlbnRMaXN0ZW5lck9iamVjdDtcblxuICAgICAgICAvLyBJZiBhIHRyYW5zaXRpb24gaXMgc2hvcnQgZW5vdWdoLCB0aGUgYnJvd3NlciBtaWdodCBub3QgZmlyZSB0aGUgYHRyYW5zaXRpb25lbmRgIGV2ZW50LlxuICAgICAgICAvLyBTaW5jZSB3ZSBrbm93IGhvdyBsb25nIGl0J3Mgc3VwcG9zZWQgdG8gdGFrZSwgYWRkIGEgdGltZW91dCB3aXRoIGEgNTAlIGJ1ZmZlciB0aGF0J2xsXG4gICAgICAgIC8vIGZpcmUgaWYgdGhlIHRyYW5zaXRpb24gaGFzbid0IGNvbXBsZXRlZCB3aGVuIGl0IHdhcyBzdXBwb3NlZCB0by5cbiAgICAgICAgY29uc3QgdGltZW91dCA9IHNldFRpbWVvdXQoaGFuZGxlciBhcyBGdW5jdGlvbiwgZHVyYXRpb24gKiAxLjUpO1xuICAgICAgICB0aGlzLl9wcmV2aWV3LmFkZEV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBoYW5kbGVyKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYW4gZWxlbWVudCB0aGF0IHdpbGwgYmUgc2hvd24gaW5zdGVhZCBvZiB0aGUgY3VycmVudCBlbGVtZW50IHdoaWxlIGRyYWdnaW5nLiAqL1xuICBwcml2YXRlIF9jcmVhdGVQbGFjZWhvbGRlckVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IHBsYWNlaG9sZGVyQ29uZmlnID0gdGhpcy5fcGxhY2Vob2xkZXJUZW1wbGF0ZTtcbiAgICBjb25zdCBwbGFjZWhvbGRlclRlbXBsYXRlID0gcGxhY2Vob2xkZXJDb25maWcgPyBwbGFjZWhvbGRlckNvbmZpZy50ZW1wbGF0ZSA6IG51bGw7XG4gICAgbGV0IHBsYWNlaG9sZGVyOiBIVE1MRWxlbWVudDtcblxuICAgIGlmIChwbGFjZWhvbGRlclRlbXBsYXRlKSB7XG4gICAgICB0aGlzLl9wbGFjZWhvbGRlclJlZiA9IHBsYWNlaG9sZGVyQ29uZmlnIS52aWV3Q29udGFpbmVyLmNyZWF0ZUVtYmVkZGVkVmlldyhcbiAgICAgICAgcGxhY2Vob2xkZXJUZW1wbGF0ZSxcbiAgICAgICAgcGxhY2Vob2xkZXJDb25maWchLmNvbnRleHRcbiAgICAgICk7XG4gICAgICB0aGlzLl9wbGFjZWhvbGRlclJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICBwbGFjZWhvbGRlciA9IGdldFJvb3ROb2RlKHRoaXMuX3BsYWNlaG9sZGVyUmVmLCB0aGlzLl9kb2N1bWVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBsYWNlaG9sZGVyID0gZGVlcENsb25lTm9kZSh0aGlzLl9yb290RWxlbWVudCk7XG4gICAgfVxuXG4gICAgcGxhY2Vob2xkZXIuY2xhc3NMaXN0LmFkZCgnY2RrLWRyYWctcGxhY2Vob2xkZXInKTtcbiAgICByZXR1cm4gcGxhY2Vob2xkZXI7XG4gIH1cblxuICAvKipcbiAgICogRmlndXJlcyBvdXQgdGhlIGNvb3JkaW5hdGVzIGF0IHdoaWNoIGFuIGVsZW1lbnQgd2FzIHBpY2tlZCB1cC5cbiAgICogQHBhcmFtIHJlZmVyZW5jZUVsZW1lbnQgRWxlbWVudCB0aGF0IGluaXRpYXRlZCB0aGUgZHJhZ2dpbmcuXG4gICAqIEBwYXJhbSBldmVudCBFdmVudCB0aGF0IGluaXRpYXRlZCB0aGUgZHJhZ2dpbmcuXG4gICAqL1xuICBwcml2YXRlIF9nZXRQb2ludGVyUG9zaXRpb25JbkVsZW1lbnQocmVmZXJlbmNlRWxlbWVudDogSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpOiBQb2ludCB7XG4gICAgY29uc3QgZWxlbWVudFJlY3QgPSB0aGlzLl9yb290RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCBoYW5kbGVFbGVtZW50ID0gcmVmZXJlbmNlRWxlbWVudCA9PT0gdGhpcy5fcm9vdEVsZW1lbnQgPyBudWxsIDogcmVmZXJlbmNlRWxlbWVudDtcbiAgICBjb25zdCByZWZlcmVuY2VSZWN0ID0gaGFuZGxlRWxlbWVudCA/IGhhbmRsZUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkgOiBlbGVtZW50UmVjdDtcbiAgICBjb25zdCBwb2ludCA9IGlzVG91Y2hFdmVudChldmVudCkgPyBldmVudC50YXJnZXRUb3VjaGVzWzBdIDogZXZlbnQ7XG4gICAgY29uc3Qgc2Nyb2xsUG9zaXRpb24gPSB0aGlzLl9nZXRWaWV3cG9ydFNjcm9sbFBvc2l0aW9uKCk7XG4gICAgY29uc3QgeCA9IHBvaW50LnBhZ2VYIC0gcmVmZXJlbmNlUmVjdC5sZWZ0IC0gc2Nyb2xsUG9zaXRpb24ubGVmdDtcbiAgICBjb25zdCB5ID0gcG9pbnQucGFnZVkgLSByZWZlcmVuY2VSZWN0LnRvcCAtIHNjcm9sbFBvc2l0aW9uLnRvcDtcblxuICAgIHJldHVybiB7XG4gICAgICB4OiByZWZlcmVuY2VSZWN0LmxlZnQgLSBlbGVtZW50UmVjdC5sZWZ0ICsgeCxcbiAgICAgIHk6IHJlZmVyZW5jZVJlY3QudG9wIC0gZWxlbWVudFJlY3QudG9wICsgeVxuICAgIH07XG4gIH1cblxuICAvKiogRGV0ZXJtaW5lcyB0aGUgcG9pbnQgb2YgdGhlIHBhZ2UgdGhhdCB3YXMgdG91Y2hlZCBieSB0aGUgdXNlci4gKi9cbiAgcHJpdmF0ZSBfZ2V0UG9pbnRlclBvc2l0aW9uT25QYWdlKGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCk6IFBvaW50IHtcbiAgICBjb25zdCBzY3JvbGxQb3NpdGlvbiA9IHRoaXMuX2dldFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24oKTtcbiAgICBjb25zdCBwb2ludCA9IGlzVG91Y2hFdmVudChldmVudCkgP1xuICAgICAgICAvLyBgdG91Y2hlc2Agd2lsbCBiZSBlbXB0eSBmb3Igc3RhcnQvZW5kIGV2ZW50cyBzbyB3ZSBoYXZlIHRvIGZhbGwgYmFjayB0byBgY2hhbmdlZFRvdWNoZXNgLlxuICAgICAgICAvLyBBbHNvIG5vdGUgdGhhdCBvbiByZWFsIGRldmljZXMgd2UncmUgZ3VhcmFudGVlZCBmb3IgZWl0aGVyIGB0b3VjaGVzYCBvciBgY2hhbmdlZFRvdWNoZXNgXG4gICAgICAgIC8vIHRvIGhhdmUgYSB2YWx1ZSwgYnV0IEZpcmVmb3ggaW4gZGV2aWNlIGVtdWxhdGlvbiBtb2RlIGhhcyBhIGJ1ZyB3aGVyZSBib3RoIGNhbiBiZSBlbXB0eVxuICAgICAgICAvLyBmb3IgYHRvdWNoc3RhcnRgIGFuZCBgdG91Y2hlbmRgIHNvIHdlIGZhbGwgYmFjayB0byBhIGR1bW15IG9iamVjdCBpbiBvcmRlciB0byBhdm9pZFxuICAgICAgICAvLyB0aHJvd2luZyBhbiBlcnJvci4gVGhlIHZhbHVlIHJldHVybmVkIGhlcmUgd2lsbCBiZSBpbmNvcnJlY3QsIGJ1dCBzaW5jZSB0aGlzIG9ubHlcbiAgICAgICAgLy8gYnJlYWtzIGluc2lkZSBhIGRldmVsb3BlciB0b29sIGFuZCB0aGUgdmFsdWUgaXMgb25seSB1c2VkIGZvciBzZWNvbmRhcnkgaW5mb3JtYXRpb24sXG4gICAgICAgIC8vIHdlIGNhbiBnZXQgYXdheSB3aXRoIGl0LiBTZWUgaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTYxNTgyNC5cbiAgICAgICAgKGV2ZW50LnRvdWNoZXNbMF0gfHwgZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0gfHwge3BhZ2VYOiAwLCBwYWdlWTogMH0pIDogZXZlbnQ7XG5cbiAgICBjb25zdCB4ID0gcG9pbnQucGFnZVggLSBzY3JvbGxQb3NpdGlvbi5sZWZ0O1xuICAgIGNvbnN0IHkgPSBwb2ludC5wYWdlWSAtIHNjcm9sbFBvc2l0aW9uLnRvcDtcblxuICAgIC8vIGlmIGRyYWdnaW5nIFNWRyBlbGVtZW50LCB0cnkgdG8gY29udmVydCBmcm9tIHRoZSBzY3JlZW4gY29vcmRpbmF0ZSBzeXN0ZW0gdG8gdGhlIFNWR1xuICAgIC8vIGNvb3JkaW5hdGUgc3lzdGVtXG4gICAgaWYgKHRoaXMuX293bmVyU1ZHRWxlbWVudCkge1xuICAgICAgY29uc3Qgc3ZnTWF0cml4ID0gdGhpcy5fb3duZXJTVkdFbGVtZW50LmdldFNjcmVlbkNUTSgpO1xuICAgICAgaWYgKHN2Z01hdHJpeCkge1xuICAgICAgICBjb25zdCBzdmdQb2ludCA9IHRoaXMuX293bmVyU1ZHRWxlbWVudC5jcmVhdGVTVkdQb2ludCgpO1xuICAgICAgICBzdmdQb2ludC54ID0geDtcbiAgICAgICAgc3ZnUG9pbnQueSA9IHk7XG4gICAgICAgIHJldHVybiBzdmdQb2ludC5tYXRyaXhUcmFuc2Zvcm0oc3ZnTWF0cml4LmludmVyc2UoKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHt4LCB5fTtcbiAgfVxuXG5cbiAgLyoqIEdldHMgdGhlIHBvaW50ZXIgcG9zaXRpb24gb24gdGhlIHBhZ2UsIGFjY291bnRpbmcgZm9yIGFueSBwb3NpdGlvbiBjb25zdHJhaW50cy4gKi9cbiAgcHJpdmF0ZSBfZ2V0Q29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24ocG9pbnQ6IFBvaW50KTogUG9pbnQge1xuICAgIGNvbnN0IGRyb3BDb250YWluZXJMb2NrID0gdGhpcy5fZHJvcENvbnRhaW5lciA/IHRoaXMuX2Ryb3BDb250YWluZXIubG9ja0F4aXMgOiBudWxsO1xuICAgIGxldCB7eCwgeX0gPSB0aGlzLmNvbnN0cmFpblBvc2l0aW9uID8gdGhpcy5jb25zdHJhaW5Qb3NpdGlvbihwb2ludCwgdGhpcykgOiBwb2ludDtcblxuICAgIGlmICh0aGlzLmxvY2tBeGlzID09PSAneCcgfHwgZHJvcENvbnRhaW5lckxvY2sgPT09ICd4Jykge1xuICAgICAgeSA9IHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLnk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmxvY2tBeGlzID09PSAneScgfHwgZHJvcENvbnRhaW5lckxvY2sgPT09ICd5Jykge1xuICAgICAgeCA9IHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLng7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2JvdW5kYXJ5UmVjdCkge1xuICAgICAgY29uc3Qge3g6IHBpY2t1cFgsIHk6IHBpY2t1cFl9ID0gdGhpcy5fcGlja3VwUG9zaXRpb25JbkVsZW1lbnQ7XG4gICAgICBjb25zdCBib3VuZGFyeVJlY3QgPSB0aGlzLl9ib3VuZGFyeVJlY3Q7XG4gICAgICBjb25zdCBwcmV2aWV3UmVjdCA9IHRoaXMuX3ByZXZpZXdSZWN0ITtcbiAgICAgIGNvbnN0IG1pblkgPSBib3VuZGFyeVJlY3QudG9wICsgcGlja3VwWTtcbiAgICAgIGNvbnN0IG1heFkgPSBib3VuZGFyeVJlY3QuYm90dG9tIC0gKHByZXZpZXdSZWN0LmhlaWdodCAtIHBpY2t1cFkpO1xuICAgICAgY29uc3QgbWluWCA9IGJvdW5kYXJ5UmVjdC5sZWZ0ICsgcGlja3VwWDtcbiAgICAgIGNvbnN0IG1heFggPSBib3VuZGFyeVJlY3QucmlnaHQgLSAocHJldmlld1JlY3Qud2lkdGggLSBwaWNrdXBYKTtcblxuICAgICAgeCA9IGNsYW1wKHgsIG1pblgsIG1heFgpO1xuICAgICAgeSA9IGNsYW1wKHksIG1pblksIG1heFkpO1xuICAgIH1cblxuICAgIHJldHVybiB7eCwgeX07XG4gIH1cblxuXG4gIC8qKiBVcGRhdGVzIHRoZSBjdXJyZW50IGRyYWcgZGVsdGEsIGJhc2VkIG9uIHRoZSB1c2VyJ3MgY3VycmVudCBwb2ludGVyIHBvc2l0aW9uIG9uIHRoZSBwYWdlLiAqL1xuICBwcml2YXRlIF91cGRhdGVQb2ludGVyRGlyZWN0aW9uRGVsdGEocG9pbnRlclBvc2l0aW9uT25QYWdlOiBQb2ludCkge1xuICAgIGNvbnN0IHt4LCB5fSA9IHBvaW50ZXJQb3NpdGlvbk9uUGFnZTtcbiAgICBjb25zdCBkZWx0YSA9IHRoaXMuX3BvaW50ZXJEaXJlY3Rpb25EZWx0YTtcbiAgICBjb25zdCBwb3NpdGlvblNpbmNlTGFzdENoYW5nZSA9IHRoaXMuX3BvaW50ZXJQb3NpdGlvbkF0TGFzdERpcmVjdGlvbkNoYW5nZTtcblxuICAgIC8vIEFtb3VudCBvZiBwaXhlbHMgdGhlIHVzZXIgaGFzIGRyYWdnZWQgc2luY2UgdGhlIGxhc3QgdGltZSB0aGUgZGlyZWN0aW9uIGNoYW5nZWQuXG4gICAgY29uc3QgY2hhbmdlWCA9IE1hdGguYWJzKHggLSBwb3NpdGlvblNpbmNlTGFzdENoYW5nZS54KTtcbiAgICBjb25zdCBjaGFuZ2VZID0gTWF0aC5hYnMoeSAtIHBvc2l0aW9uU2luY2VMYXN0Q2hhbmdlLnkpO1xuXG4gICAgLy8gQmVjYXVzZSB3ZSBoYW5kbGUgcG9pbnRlciBldmVudHMgb24gYSBwZXItcGl4ZWwgYmFzaXMsIHdlIGRvbid0IHdhbnQgdGhlIGRlbHRhXG4gICAgLy8gdG8gY2hhbmdlIGZvciBldmVyeSBwaXhlbCwgb3RoZXJ3aXNlIGFueXRoaW5nIHRoYXQgZGVwZW5kcyBvbiBpdCBjYW4gbG9vayBlcnJhdGljLlxuICAgIC8vIFRvIG1ha2UgdGhlIGRlbHRhIG1vcmUgY29uc2lzdGVudCwgd2UgdHJhY2sgaG93IG11Y2ggdGhlIHVzZXIgaGFzIG1vdmVkIHNpbmNlIHRoZSBsYXN0XG4gICAgLy8gZGVsdGEgY2hhbmdlIGFuZCB3ZSBvbmx5IHVwZGF0ZSBpdCBhZnRlciBpdCBoYXMgcmVhY2hlZCBhIGNlcnRhaW4gdGhyZXNob2xkLlxuICAgIGlmIChjaGFuZ2VYID4gdGhpcy5fY29uZmlnLnBvaW50ZXJEaXJlY3Rpb25DaGFuZ2VUaHJlc2hvbGQpIHtcbiAgICAgIGRlbHRhLnggPSB4ID4gcG9zaXRpb25TaW5jZUxhc3RDaGFuZ2UueCA/IDEgOiAtMTtcbiAgICAgIHBvc2l0aW9uU2luY2VMYXN0Q2hhbmdlLnggPSB4O1xuICAgIH1cblxuICAgIGlmIChjaGFuZ2VZID4gdGhpcy5fY29uZmlnLnBvaW50ZXJEaXJlY3Rpb25DaGFuZ2VUaHJlc2hvbGQpIHtcbiAgICAgIGRlbHRhLnkgPSB5ID4gcG9zaXRpb25TaW5jZUxhc3RDaGFuZ2UueSA/IDEgOiAtMTtcbiAgICAgIHBvc2l0aW9uU2luY2VMYXN0Q2hhbmdlLnkgPSB5O1xuICAgIH1cblxuICAgIHJldHVybiBkZWx0YTtcbiAgfVxuXG4gIC8qKiBUb2dnbGVzIHRoZSBuYXRpdmUgZHJhZyBpbnRlcmFjdGlvbnMsIGJhc2VkIG9uIGhvdyBtYW55IGhhbmRsZXMgYXJlIHJlZ2lzdGVyZWQuICovXG4gIHByaXZhdGUgX3RvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMoKSB7XG4gICAgaWYgKCF0aGlzLl9yb290RWxlbWVudCB8fCAhdGhpcy5faGFuZGxlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNob3VsZEVuYWJsZSA9IHRoaXMuX2hhbmRsZXMubGVuZ3RoID4gMCB8fCAhdGhpcy5pc0RyYWdnaW5nKCk7XG5cbiAgICBpZiAoc2hvdWxkRW5hYmxlICE9PSB0aGlzLl9uYXRpdmVJbnRlcmFjdGlvbnNFbmFibGVkKSB7XG4gICAgICB0aGlzLl9uYXRpdmVJbnRlcmFjdGlvbnNFbmFibGVkID0gc2hvdWxkRW5hYmxlO1xuICAgICAgdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucyh0aGlzLl9yb290RWxlbWVudCwgc2hvdWxkRW5hYmxlKTtcbiAgICB9XG4gIH1cblxuICAvKiogUmVtb3ZlcyB0aGUgbWFudWFsbHktYWRkZWQgZXZlbnQgbGlzdGVuZXJzIGZyb20gdGhlIHJvb3QgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfcmVtb3ZlUm9vdEVsZW1lbnRMaXN0ZW5lcnMoZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX3BvaW50ZXJEb3duLCBhY3RpdmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5fcG9pbnRlckRvd24sIHBhc3NpdmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyBhIGB0cmFuc2Zvcm1gIHRvIHRoZSByb290IGVsZW1lbnQsIHRha2luZyBpbnRvIGFjY291bnQgYW55IGV4aXN0aW5nIHRyYW5zZm9ybXMgb24gaXQuXG4gICAqIEBwYXJhbSB4IE5ldyB0cmFuc2Zvcm0gdmFsdWUgYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHkgTmV3IHRyYW5zZm9ybSB2YWx1ZSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKi9cbiAgcHJpdmF0ZSBfYXBwbHlSb290RWxlbWVudFRyYW5zZm9ybSh4OiBudW1iZXIsIHk6IG51bWJlcikge1xuICAgIGNvbnN0IHRyYW5zZm9ybSA9IGdldFRyYW5zZm9ybSh4LCB5KTtcblxuICAgIC8vIENhY2hlIHRoZSBwcmV2aW91cyB0cmFuc2Zvcm0gYW1vdW50IG9ubHkgYWZ0ZXIgdGhlIGZpcnN0IGRyYWcgc2VxdWVuY2UsIGJlY2F1c2VcbiAgICAvLyB3ZSBkb24ndCB3YW50IG91ciBvd24gdHJhbnNmb3JtcyB0byBzdGFjayBvbiB0b3Agb2YgZWFjaCBvdGhlci5cbiAgICBpZiAodGhpcy5faW5pdGlhbFRyYW5zZm9ybSA9PSBudWxsKSB7XG4gICAgICB0aGlzLl9pbml0aWFsVHJhbnNmb3JtID0gdGhpcy5fcm9vdEVsZW1lbnQuc3R5bGUudHJhbnNmb3JtIHx8ICcnO1xuICAgIH1cblxuICAgIC8vIFByZXNlcnZlIHRoZSBwcmV2aW91cyBgdHJhbnNmb3JtYCB2YWx1ZSwgaWYgdGhlcmUgd2FzIG9uZS4gTm90ZSB0aGF0IHdlIGFwcGx5IG91ciBvd25cbiAgICAvLyB0cmFuc2Zvcm0gYmVmb3JlIHRoZSB1c2VyJ3MsIGJlY2F1c2UgdGhpbmdzIGxpa2Ugcm90YXRpb24gY2FuIGFmZmVjdCB3aGljaCBkaXJlY3Rpb25cbiAgICAvLyB0aGUgZWxlbWVudCB3aWxsIGJlIHRyYW5zbGF0ZWQgdG93YXJkcy5cbiAgICB0aGlzLl9yb290RWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSB0aGlzLl9pbml0aWFsVHJhbnNmb3JtID9cbiAgICAgIHRyYW5zZm9ybSArICcgJyArIHRoaXMuX2luaXRpYWxUcmFuc2Zvcm0gIDogdHJhbnNmb3JtO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGRpc3RhbmNlIHRoYXQgdGhlIHVzZXIgaGFzIGRyYWdnZWQgZHVyaW5nIHRoZSBjdXJyZW50IGRyYWcgc2VxdWVuY2UuXG4gICAqIEBwYXJhbSBjdXJyZW50UG9zaXRpb24gQ3VycmVudCBwb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIuXG4gICAqL1xuICBwcml2YXRlIF9nZXREcmFnRGlzdGFuY2UoY3VycmVudFBvc2l0aW9uOiBQb2ludCk6IFBvaW50IHtcbiAgICBjb25zdCBwaWNrdXBQb3NpdGlvbiA9IHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlO1xuXG4gICAgaWYgKHBpY2t1cFBvc2l0aW9uKSB7XG4gICAgICByZXR1cm4ge3g6IGN1cnJlbnRQb3NpdGlvbi54IC0gcGlja3VwUG9zaXRpb24ueCwgeTogY3VycmVudFBvc2l0aW9uLnkgLSBwaWNrdXBQb3NpdGlvbi55fTtcbiAgICB9XG5cbiAgICByZXR1cm4ge3g6IDAsIHk6IDB9O1xuICB9XG5cbiAgLyoqIENsZWFucyB1cCBhbnkgY2FjaGVkIGVsZW1lbnQgZGltZW5zaW9ucyB0aGF0IHdlIGRvbid0IG5lZWQgYWZ0ZXIgZHJhZ2dpbmcgaGFzIHN0b3BwZWQuICovXG4gIHByaXZhdGUgX2NsZWFudXBDYWNoZWREaW1lbnNpb25zKCkge1xuICAgIHRoaXMuX2JvdW5kYXJ5UmVjdCA9IHRoaXMuX3ByZXZpZXdSZWN0ID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5jbGVhcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSBlbGVtZW50IGlzIHN0aWxsIGluc2lkZSBpdHMgYm91bmRhcnkgYWZ0ZXIgdGhlIHZpZXdwb3J0IGhhcyBiZWVuIHJlc2l6ZWQuXG4gICAqIElmIG5vdCwgdGhlIHBvc2l0aW9uIGlzIGFkanVzdGVkIHNvIHRoYXQgdGhlIGVsZW1lbnQgZml0cyBhZ2Fpbi5cbiAgICovXG4gIHByaXZhdGUgX2NvbnRhaW5JbnNpZGVCb3VuZGFyeU9uUmVzaXplKCkge1xuICAgIGxldCB7eCwgeX0gPSB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtO1xuXG4gICAgaWYgKCh4ID09PSAwICYmIHkgPT09IDApIHx8IHRoaXMuaXNEcmFnZ2luZygpIHx8ICF0aGlzLl9ib3VuZGFyeUVsZW1lbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBib3VuZGFyeVJlY3QgPSB0aGlzLl9ib3VuZGFyeUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgY29uc3QgZWxlbWVudFJlY3QgPSB0aGlzLl9yb290RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgIC8vIEl0J3MgcG9zc2libGUgdGhhdCB0aGUgZWxlbWVudCBnb3QgaGlkZGVuIGF3YXkgYWZ0ZXIgZHJhZ2dpbmcgKGUuZy4gYnkgc3dpdGNoaW5nIHRvIGFcbiAgICAvLyBkaWZmZXJlbnQgdGFiKS4gRG9uJ3QgZG8gYW55dGhpbmcgaW4gdGhpcyBjYXNlIHNvIHdlIGRvbid0IGNsZWFyIHRoZSB1c2VyJ3MgcG9zaXRpb24uXG4gICAgaWYgKChib3VuZGFyeVJlY3Qud2lkdGggPT09IDAgJiYgYm91bmRhcnlSZWN0LmhlaWdodCA9PT0gMCkgfHxcbiAgICAgICAgKGVsZW1lbnRSZWN0LndpZHRoID09PSAwICYmIGVsZW1lbnRSZWN0LmhlaWdodCA9PT0gMCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBsZWZ0T3ZlcmZsb3cgPSBib3VuZGFyeVJlY3QubGVmdCAtIGVsZW1lbnRSZWN0LmxlZnQ7XG4gICAgY29uc3QgcmlnaHRPdmVyZmxvdyA9IGVsZW1lbnRSZWN0LnJpZ2h0IC0gYm91bmRhcnlSZWN0LnJpZ2h0O1xuICAgIGNvbnN0IHRvcE92ZXJmbG93ID0gYm91bmRhcnlSZWN0LnRvcCAtIGVsZW1lbnRSZWN0LnRvcDtcbiAgICBjb25zdCBib3R0b21PdmVyZmxvdyA9IGVsZW1lbnRSZWN0LmJvdHRvbSAtIGJvdW5kYXJ5UmVjdC5ib3R0b207XG5cbiAgICAvLyBJZiB0aGUgZWxlbWVudCBoYXMgYmVjb21lIHdpZGVyIHRoYW4gdGhlIGJvdW5kYXJ5LCB3ZSBjYW4ndFxuICAgIC8vIGRvIG11Y2ggdG8gbWFrZSBpdCBmaXQgc28gd2UganVzdCBhbmNob3IgaXQgdG8gdGhlIGxlZnQuXG4gICAgaWYgKGJvdW5kYXJ5UmVjdC53aWR0aCA+IGVsZW1lbnRSZWN0LndpZHRoKSB7XG4gICAgICBpZiAobGVmdE92ZXJmbG93ID4gMCkge1xuICAgICAgICB4ICs9IGxlZnRPdmVyZmxvdztcbiAgICAgIH1cblxuICAgICAgaWYgKHJpZ2h0T3ZlcmZsb3cgPiAwKSB7XG4gICAgICAgIHggLT0gcmlnaHRPdmVyZmxvdztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgeCA9IDA7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGVsZW1lbnQgaGFzIGJlY29tZSB0YWxsZXIgdGhhbiB0aGUgYm91bmRhcnksIHdlIGNhbid0XG4gICAgLy8gZG8gbXVjaCB0byBtYWtlIGl0IGZpdCBzbyB3ZSBqdXN0IGFuY2hvciBpdCB0byB0aGUgdG9wLlxuICAgIGlmIChib3VuZGFyeVJlY3QuaGVpZ2h0ID4gZWxlbWVudFJlY3QuaGVpZ2h0KSB7XG4gICAgICBpZiAodG9wT3ZlcmZsb3cgPiAwKSB7XG4gICAgICAgIHkgKz0gdG9wT3ZlcmZsb3c7XG4gICAgICB9XG5cbiAgICAgIGlmIChib3R0b21PdmVyZmxvdyA+IDApIHtcbiAgICAgICAgeSAtPSBib3R0b21PdmVyZmxvdztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgeSA9IDA7XG4gICAgfVxuXG4gICAgaWYgKHggIT09IHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm0ueCB8fCB5ICE9PSB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtLnkpIHtcbiAgICAgIHRoaXMuc2V0RnJlZURyYWdQb3NpdGlvbih7eSwgeH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBkcmFnIHN0YXJ0IGRlbGF5LCBiYXNlZCBvbiB0aGUgZXZlbnQgdHlwZS4gKi9cbiAgcHJpdmF0ZSBfZ2V0RHJhZ1N0YXJ0RGVsYXkoZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KTogbnVtYmVyIHtcbiAgICBjb25zdCB2YWx1ZSA9IHRoaXMuZHJhZ1N0YXJ0RGVsYXk7XG5cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH0gZWxzZSBpZiAoaXNUb3VjaEV2ZW50KGV2ZW50KSkge1xuICAgICAgcmV0dXJuIHZhbHVlLnRvdWNoO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZSA/IHZhbHVlLm1vdXNlIDogMDtcbiAgfVxuXG4gIC8qKiBVcGRhdGVzIHRoZSBpbnRlcm5hbCBzdGF0ZSBvZiB0aGUgZHJhZ2dhYmxlIGVsZW1lbnQgd2hlbiBzY3JvbGxpbmcgaGFzIG9jY3VycmVkLiAqL1xuICBwcml2YXRlIF91cGRhdGVPblNjcm9sbChldmVudDogRXZlbnQpIHtcbiAgICBjb25zdCBzY3JvbGxEaWZmZXJlbmNlID0gdGhpcy5fcGFyZW50UG9zaXRpb25zLmhhbmRsZVNjcm9sbChldmVudCk7XG5cbiAgICBpZiAoc2Nyb2xsRGlmZmVyZW5jZSkge1xuICAgICAgY29uc3QgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IGFzIE5vZGU7XG5cbiAgICAgIC8vIENsaWVudFJlY3QgZGltZW5zaW9ucyBhcmUgYmFzZWQgb24gdGhlIHNjcm9sbCBwb3NpdGlvbiBvZiB0aGUgcGFnZSBhbmQgaXRzIHBhcmVudCBub2RlIHNvXG4gICAgICAvLyB3ZSBoYXZlIHRvIHVwZGF0ZSB0aGUgY2FjaGVkIGJvdW5kYXJ5IENsaWVudFJlY3QgaWYgdGhlIHVzZXIgaGFzIHNjcm9sbGVkLiBDaGVjayBmb3JcbiAgICAgIC8vIHRoZSBgZG9jdW1lbnRgIHNwZWNpZmljYWxseSBzaW5jZSBJRSBkb2Vzbid0IHN1cHBvcnQgYGNvbnRhaW5zYCBvbiBpdC5cbiAgICAgIGlmICh0aGlzLl9ib3VuZGFyeVJlY3QgJiYgKHRhcmdldCA9PT0gdGhpcy5fZG9jdW1lbnQgfHxcbiAgICAgICAgICAodGFyZ2V0ICE9PSB0aGlzLl9ib3VuZGFyeUVsZW1lbnQgJiYgdGFyZ2V0LmNvbnRhaW5zKHRoaXMuX2JvdW5kYXJ5RWxlbWVudCkpKSkge1xuICAgICAgICBhZGp1c3RDbGllbnRSZWN0KHRoaXMuX2JvdW5kYXJ5UmVjdCwgc2Nyb2xsRGlmZmVyZW5jZS50b3AsIHNjcm9sbERpZmZlcmVuY2UubGVmdCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLnggKz0gc2Nyb2xsRGlmZmVyZW5jZS5sZWZ0O1xuICAgICAgdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UueSArPSBzY3JvbGxEaWZmZXJlbmNlLnRvcDtcblxuICAgICAgLy8gSWYgd2UncmUgaW4gZnJlZSBkcmFnIG1vZGUsIHdlIGhhdmUgdG8gdXBkYXRlIHRoZSBhY3RpdmUgdHJhbnNmb3JtLCBiZWNhdXNlXG4gICAgICAvLyBpdCBpc24ndCByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQgbGlrZSB0aGUgcHJldmlldyBpbnNpZGUgYSBkcm9wIGxpc3QuXG4gICAgICBpZiAoIXRoaXMuX2Ryb3BDb250YWluZXIpIHtcbiAgICAgICAgdGhpcy5fYWN0aXZlVHJhbnNmb3JtLnggLT0gc2Nyb2xsRGlmZmVyZW5jZS5sZWZ0O1xuICAgICAgICB0aGlzLl9hY3RpdmVUcmFuc2Zvcm0ueSAtPSBzY3JvbGxEaWZmZXJlbmNlLnRvcDtcbiAgICAgICAgdGhpcy5fYXBwbHlSb290RWxlbWVudFRyYW5zZm9ybSh0aGlzLl9hY3RpdmVUcmFuc2Zvcm0ueCwgdGhpcy5fYWN0aXZlVHJhbnNmb3JtLnkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBzY3JvbGwgcG9zaXRpb24gb2YgdGhlIHZpZXdwb3J0LiAqL1xuICBwcml2YXRlIF9nZXRWaWV3cG9ydFNjcm9sbFBvc2l0aW9uKCkge1xuICAgIGNvbnN0IGNhY2hlZFBvc2l0aW9uID0gdGhpcy5fcGFyZW50UG9zaXRpb25zLnBvc2l0aW9ucy5nZXQodGhpcy5fZG9jdW1lbnQpO1xuICAgIHJldHVybiBjYWNoZWRQb3NpdGlvbiA/IGNhY2hlZFBvc2l0aW9uLnNjcm9sbFBvc2l0aW9uIDpcbiAgICAgICAgdGhpcy5fdmlld3BvcnRSdWxlci5nZXRWaWV3cG9ydFNjcm9sbFBvc2l0aW9uKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIGEgM2QgYHRyYW5zZm9ybWAgdGhhdCBjYW4gYmUgYXBwbGllZCB0byBhbiBlbGVtZW50LlxuICogQHBhcmFtIHggRGVzaXJlZCBwb3NpdGlvbiBvZiB0aGUgZWxlbWVudCBhbG9uZyB0aGUgWCBheGlzLlxuICogQHBhcmFtIHkgRGVzaXJlZCBwb3NpdGlvbiBvZiB0aGUgZWxlbWVudCBhbG9uZyB0aGUgWSBheGlzLlxuICovXG5mdW5jdGlvbiBnZXRUcmFuc2Zvcm0oeDogbnVtYmVyLCB5OiBudW1iZXIpOiBzdHJpbmcge1xuICAvLyBSb3VuZCB0aGUgdHJhbnNmb3JtcyBzaW5jZSBzb21lIGJyb3dzZXJzIHdpbGxcbiAgLy8gYmx1ciB0aGUgZWxlbWVudHMgZm9yIHN1Yi1waXhlbCB0cmFuc2Zvcm1zLlxuICByZXR1cm4gYHRyYW5zbGF0ZTNkKCR7TWF0aC5yb3VuZCh4KX1weCwgJHtNYXRoLnJvdW5kKHkpfXB4LCAwKWA7XG59XG5cbi8qKiBDbGFtcHMgYSB2YWx1ZSBiZXR3ZWVuIGEgbWluaW11bSBhbmQgYSBtYXhpbXVtLiAqL1xuZnVuY3Rpb24gY2xhbXAodmFsdWU6IG51bWJlciwgbWluOiBudW1iZXIsIG1heDogbnVtYmVyKSB7XG4gIHJldHVybiBNYXRoLm1heChtaW4sIE1hdGgubWluKG1heCwgdmFsdWUpKTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgdG8gcmVtb3ZlIGEgbm9kZSBmcm9tIHRoZSBET00gYW5kIHRvIGRvIGFsbCB0aGUgbmVjZXNzYXJ5IG51bGwgY2hlY2tzLlxuICogQHBhcmFtIG5vZGUgTm9kZSB0byBiZSByZW1vdmVkLlxuICovXG5mdW5jdGlvbiByZW1vdmVOb2RlKG5vZGU6IE5vZGUgfCBudWxsKSB7XG4gIGlmIChub2RlICYmIG5vZGUucGFyZW50Tm9kZSkge1xuICAgIG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbiAgfVxufVxuXG4vKiogRGV0ZXJtaW5lcyB3aGV0aGVyIGFuIGV2ZW50IGlzIGEgdG91Y2ggZXZlbnQuICovXG5mdW5jdGlvbiBpc1RvdWNoRXZlbnQoZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KTogZXZlbnQgaXMgVG91Y2hFdmVudCB7XG4gIC8vIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGZvciBldmVyeSBwaXhlbCB0aGF0IHRoZSB1c2VyIGhhcyBkcmFnZ2VkIHNvIHdlIG5lZWQgaXQgdG8gYmVcbiAgLy8gYXMgZmFzdCBhcyBwb3NzaWJsZS4gU2luY2Ugd2Ugb25seSBiaW5kIG1vdXNlIGV2ZW50cyBhbmQgdG91Y2ggZXZlbnRzLCB3ZSBjYW4gYXNzdW1lXG4gIC8vIHRoYXQgaWYgdGhlIGV2ZW50J3MgbmFtZSBzdGFydHMgd2l0aCBgdGAsIGl0J3MgYSB0b3VjaCBldmVudC5cbiAgcmV0dXJuIGV2ZW50LnR5cGVbMF0gPT09ICd0Jztcbn1cblxuLyoqIEdldHMgdGhlIGVsZW1lbnQgaW50byB3aGljaCB0aGUgZHJhZyBwcmV2aWV3IHNob3VsZCBiZSBpbnNlcnRlZC4gKi9cbmZ1bmN0aW9uIGdldFByZXZpZXdJbnNlcnRpb25Qb2ludChkb2N1bWVudFJlZjogYW55KTogSFRNTEVsZW1lbnQge1xuICAvLyBXZSBjYW4ndCB1c2UgdGhlIGJvZHkgaWYgdGhlIHVzZXIgaXMgaW4gZnVsbHNjcmVlbiBtb2RlLFxuICAvLyBiZWNhdXNlIHRoZSBwcmV2aWV3IHdpbGwgcmVuZGVyIHVuZGVyIHRoZSBmdWxsc2NyZWVuIGVsZW1lbnQuXG4gIC8vIFRPRE8oY3Jpc2JldG8pOiBkZWR1cGUgdGhpcyB3aXRoIHRoZSBgRnVsbHNjcmVlbk92ZXJsYXlDb250YWluZXJgIGV2ZW50dWFsbHkuXG4gIHJldHVybiBkb2N1bWVudFJlZi5mdWxsc2NyZWVuRWxlbWVudCB8fFxuICAgICAgICAgZG9jdW1lbnRSZWYud2Via2l0RnVsbHNjcmVlbkVsZW1lbnQgfHxcbiAgICAgICAgIGRvY3VtZW50UmVmLm1vekZ1bGxTY3JlZW5FbGVtZW50IHx8XG4gICAgICAgICBkb2N1bWVudFJlZi5tc0Z1bGxzY3JlZW5FbGVtZW50IHx8XG4gICAgICAgICBkb2N1bWVudFJlZi5ib2R5O1xufVxuXG4vKipcbiAqIEdldHMgdGhlIHJvb3QgSFRNTCBlbGVtZW50IG9mIGFuIGVtYmVkZGVkIHZpZXcuXG4gKiBJZiB0aGUgcm9vdCBpcyBub3QgYW4gSFRNTCBlbGVtZW50IGl0IGdldHMgd3JhcHBlZCBpbiBvbmUuXG4gKi9cbmZ1bmN0aW9uIGdldFJvb3ROb2RlKHZpZXdSZWY6IEVtYmVkZGVkVmlld1JlZjxhbnk+LCBfZG9jdW1lbnQ6IERvY3VtZW50KTogSFRNTEVsZW1lbnQge1xuICBjb25zdCByb290Tm9kZXM6IE5vZGVbXSA9IHZpZXdSZWYucm9vdE5vZGVzO1xuXG4gIGlmIChyb290Tm9kZXMubGVuZ3RoID09PSAxICYmIHJvb3ROb2Rlc1swXS5ub2RlVHlwZSA9PT0gX2RvY3VtZW50LkVMRU1FTlRfTk9ERSkge1xuICAgIHJldHVybiByb290Tm9kZXNbMF0gYXMgSFRNTEVsZW1lbnQ7XG4gIH1cblxuICBjb25zdCB3cmFwcGVyID0gX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICByb290Tm9kZXMuZm9yRWFjaChub2RlID0+IHdyYXBwZXIuYXBwZW5kQ2hpbGQobm9kZSkpO1xuICByZXR1cm4gd3JhcHBlcjtcbn1cblxuLyoqXG4gKiBNYXRjaGVzIHRoZSB0YXJnZXQgZWxlbWVudCdzIHNpemUgdG8gdGhlIHNvdXJjZSdzIHNpemUuXG4gKiBAcGFyYW0gdGFyZ2V0IEVsZW1lbnQgdGhhdCBuZWVkcyB0byBiZSByZXNpemVkLlxuICogQHBhcmFtIHNvdXJjZVJlY3QgRGltZW5zaW9ucyBvZiB0aGUgc291cmNlIGVsZW1lbnQuXG4gKi9cbmZ1bmN0aW9uIG1hdGNoRWxlbWVudFNpemUodGFyZ2V0OiBIVE1MRWxlbWVudCwgc291cmNlUmVjdDogQ2xpZW50UmVjdCk6IHZvaWQge1xuICB0YXJnZXQuc3R5bGUud2lkdGggPSBgJHtzb3VyY2VSZWN0LndpZHRofXB4YDtcbiAgdGFyZ2V0LnN0eWxlLmhlaWdodCA9IGAke3NvdXJjZVJlY3QuaGVpZ2h0fXB4YDtcbiAgdGFyZ2V0LnN0eWxlLnRyYW5zZm9ybSA9IGdldFRyYW5zZm9ybShzb3VyY2VSZWN0LmxlZnQsIHNvdXJjZVJlY3QudG9wKTtcbn1cbiJdfQ==