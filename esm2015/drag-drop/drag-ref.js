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
import { extendStyles, toggleNativeDragInteractions } from './drag-styling';
import { getTransformTransitionDurationInMs } from './transition-duration';
import { getMutableClientRect, adjustClientRect } from './client-rect';
import { ParentPositionTracker } from './parent-position-tracker';
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
        this.moved = this._moveEvents.asObservable();
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
                    if (!isDelayElapsed) {
                        this._endDragSequence(event);
                        return;
                    }
                    // Prevent other drag sequences from starting while something in the container is still
                    // being dragged. This can happen while we're waiting for the drop animation to finish
                    // and can cause errors, because some elements might still be moving around.
                    if (!this._dropContainer || !this._dropContainer.isDragging()) {
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
            this._updatePointerDirectionDelta(constrainedPointerPosition);
            if (this._dropContainer) {
                this._updateActiveDropContainer(constrainedPointerPosition);
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
        this._boundaryElement = this._rootElement = this._placeholderTemplate =
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
        const position = this._pointerPositionAtLastDirectionChange;
        if (position && this._dropContainer) {
            this._updateActiveDropContainer(this._getConstrainedPointerPosition(position));
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
        // Emit the event on the item before the one on the container.
        this.started.next({ source: this });
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
            element.style.display = 'none';
            this._document.body.appendChild(parent.replaceChild(placeholder, element));
            getPreviewInsertionPoint(this._document).appendChild(preview);
            dropContainer.start();
            this._initialContainer = dropContainer;
            this._initialIndex = dropContainer.getItemIndex(this);
        }
        else {
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
        const pointerPosition = this._pickupPositionOnPage = this._getPointerPositionOnPage(event);
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
        this._rootElement.style.display = '';
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
    _updateActiveDropContainer({ x, y }) {
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
        this._dropContainer._startScrollingIfNecessary(x, y);
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
        return {
            x: point.pageX - scrollPosition.left,
            y: point.pageY - scrollPosition.top
        };
    }
    /** Gets the pointer position on the page, accounting for any position constraints. */
    _getConstrainedPointerPosition(point) {
        const constrainedPoint = this.constrainPosition ? this.constrainPosition(point, this) : point;
        const dropContainerLock = this._dropContainer ? this._dropContainer.lockAxis : null;
        if (this.lockAxis === 'x' || dropContainerLock === 'x') {
            constrainedPoint.y = this._pickupPositionOnPage.y;
        }
        else if (this.lockAxis === 'y' || dropContainerLock === 'y') {
            constrainedPoint.x = this._pickupPositionOnPage.x;
        }
        if (this._boundaryRect) {
            const { x: pickupX, y: pickupY } = this._pickupPositionInElement;
            const boundaryRect = this._boundaryRect;
            const previewRect = this._previewRect;
            const minY = boundaryRect.top + pickupY;
            const maxY = boundaryRect.bottom - (previewRect.height - pickupY);
            const minX = boundaryRect.left + pickupX;
            const maxX = boundaryRect.right - (previewRect.width - pickupX);
            constrainedPoint.x = clamp(constrainedPoint.x, minX, maxX);
            constrainedPoint.y = clamp(constrainedPoint.y, minY, maxY);
        }
        return constrainedPoint;
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
            // ClientRect dimensions are based on the page's scroll position so
            // we have to update the cached boundary ClientRect if the user has scrolled.
            if (this._boundaryRect) {
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
/** Creates a deep clone of an element. */
function deepCloneNode(node) {
    const clone = node.cloneNode(true);
    const descendantsWithId = clone.querySelectorAll('[id]');
    const descendantCanvases = node.querySelectorAll('canvas');
    // Remove the `id` to avoid having multiple elements with the same id on the page.
    clone.removeAttribute('id');
    for (let i = 0; i < descendantsWithId.length; i++) {
        descendantsWithId[i].removeAttribute('id');
    }
    // `cloneNode` won't transfer the content of `canvas` elements so we have to do it ourselves.
    // We match up the cloned canvas to their sources using their index in the DOM.
    if (descendantCanvases.length) {
        const cloneCanvases = clone.querySelectorAll('canvas');
        for (let i = 0; i < descendantCanvases.length; i++) {
            const correspondingCloneContext = cloneCanvases[i].getContext('2d');
            if (correspondingCloneContext) {
                // In some cases `drawImage` can throw (e.g. if the canvas size is 0x0).
                // We can't do much about it so just ignore the error.
                try {
                    correspondingCloneContext.drawImage(descendantCanvases[i], 0, 0);
                }
                catch (_a) { }
            }
        }
    }
    return clone;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2RyYWctZHJvcC9kcmFnLXJlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFLSCxPQUFPLEVBQUMsK0JBQStCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN0RSxPQUFPLEVBQUMscUJBQXFCLEVBQUUsYUFBYSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDM0UsT0FBTyxFQUFDLFlBQVksRUFBRSxPQUFPLEVBQWEsTUFBTSxNQUFNLENBQUM7QUFHdkQsT0FBTyxFQUFDLFlBQVksRUFBRSw0QkFBNEIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzFFLE9BQU8sRUFBQyxrQ0FBa0MsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3pFLE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNyRSxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQW9CaEUsaUVBQWlFO0FBQ2pFLE1BQU0sMkJBQTJCLEdBQUcsK0JBQStCLENBQUMsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUVyRixpRUFBaUU7QUFDakUsTUFBTSwwQkFBMEIsR0FBRywrQkFBK0IsQ0FBQyxFQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDO0FBRXJGOzs7OztHQUtHO0FBQ0gsTUFBTSx1QkFBdUIsR0FBRyxHQUFHLENBQUM7QUE4QnBDOztHQUVHO0FBQ0gsTUFBTSxPQUFPLE9BQU87SUFzTmxCLFlBQ0UsT0FBOEMsRUFDdEMsT0FBc0IsRUFDdEIsU0FBbUIsRUFDbkIsT0FBZSxFQUNmLGNBQTZCLEVBQzdCLGlCQUF5RDtRQUp6RCxZQUFPLEdBQVAsT0FBTyxDQUFlO1FBQ3RCLGNBQVMsR0FBVCxTQUFTLENBQVU7UUFDbkIsWUFBTyxHQUFQLE9BQU8sQ0FB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QUNuQyxXQUFXLENBQUMsb0JBQW9CO1FBQ2hDLFdBQVcsQ0FBQyxtQkFBbUI7UUFDL0IsV0FBVyxDQUFDLElBQUksQ0FBQztBQUMxQixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyxXQUFXLENBQUMsT0FBNkIsRUFBRSxTQUFtQjtJQUNyRSxNQUFNLFNBQVMsR0FBVyxPQUFPLENBQUMsU0FBUyxDQUFDO0lBRTVDLElBQUksU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsS0FBSyxTQUFTLENBQUMsWUFBWSxFQUFFO1FBQzlFLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBZ0IsQ0FBQztLQUNwQztJQUVELE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDL0MsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNyRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQVMsZ0JBQWdCLENBQUMsTUFBbUIsRUFBRSxVQUFzQjtJQUNuRSxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxHQUFHLFVBQVUsQ0FBQyxLQUFLLElBQUksQ0FBQztJQUM3QyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxHQUFHLFVBQVUsQ0FBQyxNQUFNLElBQUksQ0FBQztJQUMvQyxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxZQUFZLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDekUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0VtYmVkZGVkVmlld1JlZiwgRWxlbWVudFJlZiwgTmdab25lLCBWaWV3Q29udGFpbmVyUmVmLCBUZW1wbGF0ZVJlZn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1ZpZXdwb3J0UnVsZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9zY3JvbGxpbmcnO1xuaW1wb3J0IHtEaXJlY3Rpb259IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7bm9ybWFsaXplUGFzc2l2ZUxpc3RlbmVyT3B0aW9uc30gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7Y29lcmNlQm9vbGVhblByb3BlcnR5LCBjb2VyY2VFbGVtZW50fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtTdWJzY3JpcHRpb24sIFN1YmplY3QsIE9ic2VydmFibGV9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtEcm9wTGlzdFJlZkludGVybmFsIGFzIERyb3BMaXN0UmVmfSBmcm9tICcuL2Ryb3AtbGlzdC1yZWYnO1xuaW1wb3J0IHtEcmFnRHJvcFJlZ2lzdHJ5fSBmcm9tICcuL2RyYWctZHJvcC1yZWdpc3RyeSc7XG5pbXBvcnQge2V4dGVuZFN0eWxlcywgdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9uc30gZnJvbSAnLi9kcmFnLXN0eWxpbmcnO1xuaW1wb3J0IHtnZXRUcmFuc2Zvcm1UcmFuc2l0aW9uRHVyYXRpb25Jbk1zfSBmcm9tICcuL3RyYW5zaXRpb24tZHVyYXRpb24nO1xuaW1wb3J0IHtnZXRNdXRhYmxlQ2xpZW50UmVjdCwgYWRqdXN0Q2xpZW50UmVjdH0gZnJvbSAnLi9jbGllbnQtcmVjdCc7XG5pbXBvcnQge1BhcmVudFBvc2l0aW9uVHJhY2tlcn0gZnJvbSAnLi9wYXJlbnQtcG9zaXRpb24tdHJhY2tlcic7XG5cbi8qKiBPYmplY3QgdGhhdCBjYW4gYmUgdXNlZCB0byBjb25maWd1cmUgdGhlIGJlaGF2aW9yIG9mIERyYWdSZWYuICovXG5leHBvcnQgaW50ZXJmYWNlIERyYWdSZWZDb25maWcge1xuICAvKipcbiAgICogTWluaW11bSBhbW91bnQgb2YgcGl4ZWxzIHRoYXQgdGhlIHVzZXIgc2hvdWxkXG4gICAqIGRyYWcsIGJlZm9yZSB0aGUgQ0RLIGluaXRpYXRlcyBhIGRyYWcgc2VxdWVuY2UuXG4gICAqL1xuICBkcmFnU3RhcnRUaHJlc2hvbGQ6IG51bWJlcjtcblxuICAvKipcbiAgICogQW1vdW50IHRoZSBwaXhlbHMgdGhlIHVzZXIgc2hvdWxkIGRyYWcgYmVmb3JlIHRoZSBDREtcbiAgICogY29uc2lkZXJzIHRoZW0gdG8gaGF2ZSBjaGFuZ2VkIHRoZSBkcmFnIGRpcmVjdGlvbi5cbiAgICovXG4gIHBvaW50ZXJEaXJlY3Rpb25DaGFuZ2VUaHJlc2hvbGQ6IG51bWJlcjtcblxuICAvKiogYHotaW5kZXhgIGZvciB0aGUgYWJzb2x1dGVseS1wb3NpdGlvbmVkIGVsZW1lbnRzIHRoYXQgYXJlIGNyZWF0ZWQgYnkgdGhlIGRyYWcgaXRlbS4gKi9cbiAgekluZGV4PzogbnVtYmVyO1xufVxuXG4vKiogT3B0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIHRvIGJpbmQgYSBwYXNzaXZlIGV2ZW50IGxpc3RlbmVyLiAqL1xuY29uc3QgcGFzc2l2ZUV2ZW50TGlzdGVuZXJPcHRpb25zID0gbm9ybWFsaXplUGFzc2l2ZUxpc3RlbmVyT3B0aW9ucyh7cGFzc2l2ZTogdHJ1ZX0pO1xuXG4vKiogT3B0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIHRvIGJpbmQgYW4gYWN0aXZlIGV2ZW50IGxpc3RlbmVyLiAqL1xuY29uc3QgYWN0aXZlRXZlbnRMaXN0ZW5lck9wdGlvbnMgPSBub3JtYWxpemVQYXNzaXZlTGlzdGVuZXJPcHRpb25zKHtwYXNzaXZlOiBmYWxzZX0pO1xuXG4vKipcbiAqIFRpbWUgaW4gbWlsbGlzZWNvbmRzIGZvciB3aGljaCB0byBpZ25vcmUgbW91c2UgZXZlbnRzLCBhZnRlclxuICogcmVjZWl2aW5nIGEgdG91Y2ggZXZlbnQuIFVzZWQgdG8gYXZvaWQgZG9pbmcgZG91YmxlIHdvcmsgZm9yXG4gKiB0b3VjaCBkZXZpY2VzIHdoZXJlIHRoZSBicm93c2VyIGZpcmVzIGZha2UgbW91c2UgZXZlbnRzLCBpblxuICogYWRkaXRpb24gdG8gdG91Y2ggZXZlbnRzLlxuICovXG5jb25zdCBNT1VTRV9FVkVOVF9JR05PUkVfVElNRSA9IDgwMDtcblxuLy8gVE9ETyhjcmlzYmV0byk6IGFkZCBhbiBBUEkgZm9yIG1vdmluZyBhIGRyYWdnYWJsZSB1cC9kb3duIHRoZVxuLy8gbGlzdCBwcm9ncmFtbWF0aWNhbGx5LiBVc2VmdWwgZm9yIGtleWJvYXJkIGNvbnRyb2xzLlxuXG4vKipcbiAqIEludGVybmFsIGNvbXBpbGUtdGltZS1vbmx5IHJlcHJlc2VudGF0aW9uIG9mIGEgYERyYWdSZWZgLlxuICogVXNlZCB0byBhdm9pZCBjaXJjdWxhciBpbXBvcnQgaXNzdWVzIGJldHdlZW4gdGhlIGBEcmFnUmVmYCBhbmQgdGhlIGBEcm9wTGlzdFJlZmAuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRHJhZ1JlZkludGVybmFsIGV4dGVuZHMgRHJhZ1JlZiB7fVxuXG4vKiogVGVtcGxhdGUgdGhhdCBjYW4gYmUgdXNlZCB0byBjcmVhdGUgYSBkcmFnIGhlbHBlciBlbGVtZW50IChlLmcuIGEgcHJldmlldyBvciBhIHBsYWNlaG9sZGVyKS4gKi9cbmludGVyZmFjZSBEcmFnSGVscGVyVGVtcGxhdGU8VCA9IGFueT4ge1xuICB0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8VD4gfCBudWxsO1xuICB2aWV3Q29udGFpbmVyOiBWaWV3Q29udGFpbmVyUmVmO1xuICBjb250ZXh0OiBUO1xufVxuXG4vKiogVGVtcGxhdGUgdGhhdCBjYW4gYmUgdXNlZCB0byBjcmVhdGUgYSBkcmFnIHByZXZpZXcgZWxlbWVudC4gKi9cbmludGVyZmFjZSBEcmFnUHJldmlld1RlbXBsYXRlPFQgPSBhbnk+IGV4dGVuZHMgRHJhZ0hlbHBlclRlbXBsYXRlPFQ+IHtcbiAgbWF0Y2hTaXplPzogYm9vbGVhbjtcbn1cblxuLyoqIFBvaW50IG9uIHRoZSBwYWdlIG9yIHdpdGhpbiBhbiBlbGVtZW50LiAqL1xuZXhwb3J0IGludGVyZmFjZSBQb2ludCB7XG4gIHg6IG51bWJlcjtcbiAgeTogbnVtYmVyO1xufVxuXG4vKipcbiAqIFJlZmVyZW5jZSB0byBhIGRyYWdnYWJsZSBpdGVtLiBVc2VkIHRvIG1hbmlwdWxhdGUgb3IgZGlzcG9zZSBvZiB0aGUgaXRlbS5cbiAqL1xuZXhwb3J0IGNsYXNzIERyYWdSZWY8VCA9IGFueT4ge1xuICAvKiogRWxlbWVudCBkaXNwbGF5ZWQgbmV4dCB0byB0aGUgdXNlcidzIHBvaW50ZXIgd2hpbGUgdGhlIGVsZW1lbnQgaXMgZHJhZ2dlZC4gKi9cbiAgcHJpdmF0ZSBfcHJldmlldzogSFRNTEVsZW1lbnQ7XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgdmlldyBvZiB0aGUgcHJldmlldyBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9wcmV2aWV3UmVmOiBFbWJlZGRlZFZpZXdSZWY8YW55PiB8IG51bGw7XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgdmlldyBvZiB0aGUgcGxhY2Vob2xkZXIgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfcGxhY2Vob2xkZXJSZWY6IEVtYmVkZGVkVmlld1JlZjxhbnk+IHwgbnVsbDtcblxuICAvKiogRWxlbWVudCB0aGF0IGlzIHJlbmRlcmVkIGluc3RlYWQgb2YgdGhlIGRyYWdnYWJsZSBpdGVtIHdoaWxlIGl0IGlzIGJlaW5nIHNvcnRlZC4gKi9cbiAgcHJpdmF0ZSBfcGxhY2Vob2xkZXI6IEhUTUxFbGVtZW50O1xuXG4gIC8qKiBDb29yZGluYXRlcyB3aXRoaW4gdGhlIGVsZW1lbnQgYXQgd2hpY2ggdGhlIHVzZXIgcGlja2VkIHVwIHRoZSBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9waWNrdXBQb3NpdGlvbkluRWxlbWVudDogUG9pbnQ7XG5cbiAgLyoqIENvb3JkaW5hdGVzIG9uIHRoZSBwYWdlIGF0IHdoaWNoIHRoZSB1c2VyIHBpY2tlZCB1cCB0aGUgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfcGlja3VwUG9zaXRpb25PblBhZ2U6IFBvaW50O1xuXG4gIC8qKlxuICAgKiBBbmNob3Igbm9kZSB1c2VkIHRvIHNhdmUgdGhlIHBsYWNlIGluIHRoZSBET00gd2hlcmUgdGhlIGVsZW1lbnQgd2FzXG4gICAqIHBpY2tlZCB1cCBzbyB0aGF0IGl0IGNhbiBiZSByZXN0b3JlZCBhdCB0aGUgZW5kIG9mIHRoZSBkcmFnIHNlcXVlbmNlLlxuICAgKi9cbiAgcHJpdmF0ZSBfYW5jaG9yOiBDb21tZW50O1xuXG4gIC8qKlxuICAgKiBDU1MgYHRyYW5zZm9ybWAgYXBwbGllZCB0byB0aGUgZWxlbWVudCB3aGVuIGl0IGlzbid0IGJlaW5nIGRyYWdnZWQuIFdlIG5lZWQgYVxuICAgKiBwYXNzaXZlIHRyYW5zZm9ybSBpbiBvcmRlciBmb3IgdGhlIGRyYWdnZWQgZWxlbWVudCB0byByZXRhaW4gaXRzIG5ldyBwb3NpdGlvblxuICAgKiBhZnRlciB0aGUgdXNlciBoYXMgc3RvcHBlZCBkcmFnZ2luZyBhbmQgYmVjYXVzZSB3ZSBuZWVkIHRvIGtub3cgdGhlIHJlbGF0aXZlXG4gICAqIHBvc2l0aW9uIGluIGNhc2UgdGhleSBzdGFydCBkcmFnZ2luZyBhZ2Fpbi4gVGhpcyBjb3JyZXNwb25kcyB0byBgZWxlbWVudC5zdHlsZS50cmFuc2Zvcm1gLlxuICAgKi9cbiAgcHJpdmF0ZSBfcGFzc2l2ZVRyYW5zZm9ybTogUG9pbnQgPSB7eDogMCwgeTogMH07XG5cbiAgLyoqIENTUyBgdHJhbnNmb3JtYCB0aGF0IGlzIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgd2hpbGUgaXQncyBiZWluZyBkcmFnZ2VkLiAqL1xuICBwcml2YXRlIF9hY3RpdmVUcmFuc2Zvcm06IFBvaW50ID0ge3g6IDAsIHk6IDB9O1xuXG4gIC8qKiBJbmxpbmUgYHRyYW5zZm9ybWAgdmFsdWUgdGhhdCB0aGUgZWxlbWVudCBoYWQgYmVmb3JlIHRoZSBmaXJzdCBkcmFnZ2luZyBzZXF1ZW5jZS4gKi9cbiAgcHJpdmF0ZSBfaW5pdGlhbFRyYW5zZm9ybT86IHN0cmluZztcblxuICAvKipcbiAgICogV2hldGhlciB0aGUgZHJhZ2dpbmcgc2VxdWVuY2UgaGFzIGJlZW4gc3RhcnRlZC4gRG9lc24ndFxuICAgKiBuZWNlc3NhcmlseSBtZWFuIHRoYXQgdGhlIGVsZW1lbnQgaGFzIGJlZW4gbW92ZWQuXG4gICAqL1xuICBwcml2YXRlIF9oYXNTdGFydGVkRHJhZ2dpbmc6IGJvb2xlYW47XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGVsZW1lbnQgaGFzIG1vdmVkIHNpbmNlIHRoZSB1c2VyIHN0YXJ0ZWQgZHJhZ2dpbmcgaXQuICovXG4gIHByaXZhdGUgX2hhc01vdmVkOiBib29sZWFuO1xuXG4gIC8qKiBEcm9wIGNvbnRhaW5lciBpbiB3aGljaCB0aGUgRHJhZ1JlZiByZXNpZGVkIHdoZW4gZHJhZ2dpbmcgYmVnYW4uICovXG4gIHByaXZhdGUgX2luaXRpYWxDb250YWluZXI6IERyb3BMaXN0UmVmO1xuXG4gIC8qKiBJbmRleCBhdCB3aGljaCB0aGUgaXRlbSBzdGFydGVkIGluIGl0cyBpbml0aWFsIGNvbnRhaW5lci4gKi9cbiAgcHJpdmF0ZSBfaW5pdGlhbEluZGV4OiBudW1iZXI7XG5cbiAgLyoqIENhY2hlZCBwb3NpdGlvbnMgb2Ygc2Nyb2xsYWJsZSBwYXJlbnQgZWxlbWVudHMuICovXG4gIHByaXZhdGUgX3BhcmVudFBvc2l0aW9uczogUGFyZW50UG9zaXRpb25UcmFja2VyO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBpdGVtIGlzIGJlaW5nIG1vdmVkLiAqL1xuICBwcml2YXRlIF9tb3ZlRXZlbnRzID0gbmV3IFN1YmplY3Q8e1xuICAgIHNvdXJjZTogRHJhZ1JlZjtcbiAgICBwb2ludGVyUG9zaXRpb246IHt4OiBudW1iZXIsIHk6IG51bWJlcn07XG4gICAgZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50O1xuICAgIGRpc3RhbmNlOiBQb2ludDtcbiAgICBkZWx0YToge3g6IC0xIHwgMCB8IDEsIHk6IC0xIHwgMCB8IDF9O1xuICB9PigpO1xuXG4gIC8qKiBLZWVwcyB0cmFjayBvZiB0aGUgZGlyZWN0aW9uIGluIHdoaWNoIHRoZSB1c2VyIGlzIGRyYWdnaW5nIGFsb25nIGVhY2ggYXhpcy4gKi9cbiAgcHJpdmF0ZSBfcG9pbnRlckRpcmVjdGlvbkRlbHRhOiB7eDogLTEgfCAwIHwgMSwgeTogLTEgfCAwIHwgMX07XG5cbiAgLyoqIFBvaW50ZXIgcG9zaXRpb24gYXQgd2hpY2ggdGhlIGxhc3QgY2hhbmdlIGluIHRoZSBkZWx0YSBvY2N1cnJlZC4gKi9cbiAgcHJpdmF0ZSBfcG9pbnRlclBvc2l0aW9uQXRMYXN0RGlyZWN0aW9uQ2hhbmdlOiBQb2ludDtcblxuICAvKipcbiAgICogUm9vdCBET00gbm9kZSBvZiB0aGUgZHJhZyBpbnN0YW5jZS4gVGhpcyBpcyB0aGUgZWxlbWVudCB0aGF0IHdpbGxcbiAgICogYmUgbW92ZWQgYXJvdW5kIGFzIHRoZSB1c2VyIGlzIGRyYWdnaW5nLlxuICAgKi9cbiAgcHJpdmF0ZSBfcm9vdEVsZW1lbnQ6IEhUTUxFbGVtZW50O1xuXG4gIC8qKlxuICAgKiBJbmxpbmUgc3R5bGUgdmFsdWUgb2YgYC13ZWJraXQtdGFwLWhpZ2hsaWdodC1jb2xvcmAgYXQgdGhlIHRpbWUgdGhlXG4gICAqIGRyYWdnaW5nIHdhcyBzdGFydGVkLiBVc2VkIHRvIHJlc3RvcmUgdGhlIHZhbHVlIG9uY2Ugd2UncmUgZG9uZSBkcmFnZ2luZy5cbiAgICovXG4gIHByaXZhdGUgX3Jvb3RFbGVtZW50VGFwSGlnaGxpZ2h0OiBzdHJpbmc7XG5cbiAgLyoqIFN1YnNjcmlwdGlvbiB0byBwb2ludGVyIG1vdmVtZW50IGV2ZW50cy4gKi9cbiAgcHJpdmF0ZSBfcG9pbnRlck1vdmVTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG5cbiAgLyoqIFN1YnNjcmlwdGlvbiB0byB0aGUgZXZlbnQgdGhhdCBpcyBkaXNwYXRjaGVkIHdoZW4gdGhlIHVzZXIgbGlmdHMgdGhlaXIgcG9pbnRlci4gKi9cbiAgcHJpdmF0ZSBfcG9pbnRlclVwU3Vic2NyaXB0aW9uID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuXG4gIC8qKiBTdWJzY3JpcHRpb24gdG8gdGhlIHZpZXdwb3J0IGJlaW5nIHNjcm9sbGVkLiAqL1xuICBwcml2YXRlIF9zY3JvbGxTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG5cbiAgLyoqIFN1YnNjcmlwdGlvbiB0byB0aGUgdmlld3BvcnQgYmVpbmcgcmVzaXplZC4gKi9cbiAgcHJpdmF0ZSBfcmVzaXplU3Vic2NyaXB0aW9uID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuXG4gIC8qKlxuICAgKiBUaW1lIGF0IHdoaWNoIHRoZSBsYXN0IHRvdWNoIGV2ZW50IG9jY3VycmVkLiBVc2VkIHRvIGF2b2lkIGZpcmluZyB0aGUgc2FtZVxuICAgKiBldmVudHMgbXVsdGlwbGUgdGltZXMgb24gdG91Y2ggZGV2aWNlcyB3aGVyZSB0aGUgYnJvd3NlciB3aWxsIGZpcmUgYSBmYWtlXG4gICAqIG1vdXNlIGV2ZW50IGZvciBlYWNoIHRvdWNoIGV2ZW50LCBhZnRlciBhIGNlcnRhaW4gdGltZS5cbiAgICovXG4gIHByaXZhdGUgX2xhc3RUb3VjaEV2ZW50VGltZTogbnVtYmVyO1xuXG4gIC8qKiBUaW1lIGF0IHdoaWNoIHRoZSBsYXN0IGRyYWdnaW5nIHNlcXVlbmNlIHdhcyBzdGFydGVkLiAqL1xuICBwcml2YXRlIF9kcmFnU3RhcnRUaW1lOiBudW1iZXI7XG5cbiAgLyoqIENhY2hlZCByZWZlcmVuY2UgdG8gdGhlIGJvdW5kYXJ5IGVsZW1lbnQuICovXG4gIHByaXZhdGUgX2JvdW5kYXJ5RWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcblxuICAvKiogV2hldGhlciB0aGUgbmF0aXZlIGRyYWdnaW5nIGludGVyYWN0aW9ucyBoYXZlIGJlZW4gZW5hYmxlZCBvbiB0aGUgcm9vdCBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9uYXRpdmVJbnRlcmFjdGlvbnNFbmFibGVkID0gdHJ1ZTtcblxuICAvKiogQ2FjaGVkIGRpbWVuc2lvbnMgb2YgdGhlIHByZXZpZXcgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfcHJldmlld1JlY3Q/OiBDbGllbnRSZWN0O1xuXG4gIC8qKiBDYWNoZWQgZGltZW5zaW9ucyBvZiB0aGUgYm91bmRhcnkgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfYm91bmRhcnlSZWN0PzogQ2xpZW50UmVjdDtcblxuICAvKiogRWxlbWVudCB0aGF0IHdpbGwgYmUgdXNlZCBhcyBhIHRlbXBsYXRlIHRvIGNyZWF0ZSB0aGUgZHJhZ2dhYmxlIGl0ZW0ncyBwcmV2aWV3LiAqL1xuICBwcml2YXRlIF9wcmV2aWV3VGVtcGxhdGU/OiBEcmFnUHJldmlld1RlbXBsYXRlIHwgbnVsbDtcblxuICAvKiogVGVtcGxhdGUgZm9yIHBsYWNlaG9sZGVyIGVsZW1lbnQgcmVuZGVyZWQgdG8gc2hvdyB3aGVyZSBhIGRyYWdnYWJsZSB3b3VsZCBiZSBkcm9wcGVkLiAqL1xuICBwcml2YXRlIF9wbGFjZWhvbGRlclRlbXBsYXRlPzogRHJhZ0hlbHBlclRlbXBsYXRlIHwgbnVsbDtcblxuICAvKiogRWxlbWVudHMgdGhhdCBjYW4gYmUgdXNlZCB0byBkcmFnIHRoZSBkcmFnZ2FibGUgaXRlbS4gKi9cbiAgcHJpdmF0ZSBfaGFuZGxlczogSFRNTEVsZW1lbnRbXSA9IFtdO1xuXG4gIC8qKiBSZWdpc3RlcmVkIGhhbmRsZXMgdGhhdCBhcmUgY3VycmVudGx5IGRpc2FibGVkLiAqL1xuICBwcml2YXRlIF9kaXNhYmxlZEhhbmRsZXMgPSBuZXcgU2V0PEhUTUxFbGVtZW50PigpO1xuXG4gIC8qKiBEcm9wcGFibGUgY29udGFpbmVyIHRoYXQgdGhlIGRyYWdnYWJsZSBpcyBhIHBhcnQgb2YuICovXG4gIHByaXZhdGUgX2Ryb3BDb250YWluZXI/OiBEcm9wTGlzdFJlZjtcblxuICAvKiogTGF5b3V0IGRpcmVjdGlvbiBvZiB0aGUgaXRlbS4gKi9cbiAgcHJpdmF0ZSBfZGlyZWN0aW9uOiBEaXJlY3Rpb24gPSAnbHRyJztcblxuICAvKiogQXhpcyBhbG9uZyB3aGljaCBkcmFnZ2luZyBpcyBsb2NrZWQuICovXG4gIGxvY2tBeGlzOiAneCcgfCAneSc7XG5cbiAgLyoqXG4gICAqIEFtb3VudCBvZiBtaWxsaXNlY29uZHMgdG8gd2FpdCBhZnRlciB0aGUgdXNlciBoYXMgcHV0IHRoZWlyXG4gICAqIHBvaW50ZXIgZG93biBiZWZvcmUgc3RhcnRpbmcgdG8gZHJhZyB0aGUgZWxlbWVudC5cbiAgICovXG4gIGRyYWdTdGFydERlbGF5OiBudW1iZXIgfCB7dG91Y2g6IG51bWJlciwgbW91c2U6IG51bWJlcn0gPSAwO1xuXG4gIC8qKiBDbGFzcyB0byBiZSBhZGRlZCB0byB0aGUgcHJldmlldyBlbGVtZW50LiAqL1xuICBwcmV2aWV3Q2xhc3M6IHN0cmluZ3xzdHJpbmdbXXx1bmRlZmluZWQ7XG5cbiAgLyoqIFdoZXRoZXIgc3RhcnRpbmcgdG8gZHJhZyB0aGlzIGVsZW1lbnQgaXMgZGlzYWJsZWQuICovXG4gIGdldCBkaXNhYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fZGlzYWJsZWQgfHwgISEodGhpcy5fZHJvcENvbnRhaW5lciAmJiB0aGlzLl9kcm9wQ29udGFpbmVyLmRpc2FibGVkKTtcbiAgfVxuICBzZXQgZGlzYWJsZWQodmFsdWU6IGJvb2xlYW4pIHtcbiAgICBjb25zdCBuZXdWYWx1ZSA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG5cbiAgICBpZiAobmV3VmFsdWUgIT09IHRoaXMuX2Rpc2FibGVkKSB7XG4gICAgICB0aGlzLl9kaXNhYmxlZCA9IG5ld1ZhbHVlO1xuICAgICAgdGhpcy5fdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucygpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIF9kaXNhYmxlZCA9IGZhbHNlO1xuXG4gIC8qKiBFbWl0cyBhcyB0aGUgZHJhZyBzZXF1ZW5jZSBpcyBiZWluZyBwcmVwYXJlZC4gKi9cbiAgYmVmb3JlU3RhcnRlZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgc3RhcnRzIGRyYWdnaW5nIHRoZSBpdGVtLiAqL1xuICBzdGFydGVkID0gbmV3IFN1YmplY3Q8e3NvdXJjZTogRHJhZ1JlZn0+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgaGFzIHJlbGVhc2VkIGEgZHJhZyBpdGVtLCBiZWZvcmUgYW55IGFuaW1hdGlvbnMgaGF2ZSBzdGFydGVkLiAqL1xuICByZWxlYXNlZCA9IG5ldyBTdWJqZWN0PHtzb3VyY2U6IERyYWdSZWZ9PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHN0b3BzIGRyYWdnaW5nIGFuIGl0ZW0gaW4gdGhlIGNvbnRhaW5lci4gKi9cbiAgZW5kZWQgPSBuZXcgU3ViamVjdDx7c291cmNlOiBEcmFnUmVmLCBkaXN0YW5jZTogUG9pbnR9PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGhhcyBtb3ZlZCB0aGUgaXRlbSBpbnRvIGEgbmV3IGNvbnRhaW5lci4gKi9cbiAgZW50ZXJlZCA9IG5ldyBTdWJqZWN0PHtjb250YWluZXI6IERyb3BMaXN0UmVmLCBpdGVtOiBEcmFnUmVmLCBjdXJyZW50SW5kZXg6IG51bWJlcn0+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgcmVtb3ZlcyB0aGUgaXRlbSBpdHMgY29udGFpbmVyIGJ5IGRyYWdnaW5nIGl0IGludG8gYW5vdGhlciBjb250YWluZXIuICovXG4gIGV4aXRlZCA9IG5ldyBTdWJqZWN0PHtjb250YWluZXI6IERyb3BMaXN0UmVmLCBpdGVtOiBEcmFnUmVmfT4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBkcm9wcyB0aGUgaXRlbSBpbnNpZGUgYSBjb250YWluZXIuICovXG4gIGRyb3BwZWQgPSBuZXcgU3ViamVjdDx7XG4gICAgcHJldmlvdXNJbmRleDogbnVtYmVyO1xuICAgIGN1cnJlbnRJbmRleDogbnVtYmVyO1xuICAgIGl0ZW06IERyYWdSZWY7XG4gICAgY29udGFpbmVyOiBEcm9wTGlzdFJlZjtcbiAgICBwcmV2aW91c0NvbnRhaW5lcjogRHJvcExpc3RSZWY7XG4gICAgZGlzdGFuY2U6IFBvaW50O1xuICAgIGlzUG9pbnRlck92ZXJDb250YWluZXI6IGJvb2xlYW47XG4gIH0+KCk7XG5cbiAgLyoqXG4gICAqIEVtaXRzIGFzIHRoZSB1c2VyIGlzIGRyYWdnaW5nIHRoZSBpdGVtLiBVc2Ugd2l0aCBjYXV0aW9uLFxuICAgKiBiZWNhdXNlIHRoaXMgZXZlbnQgd2lsbCBmaXJlIGZvciBldmVyeSBwaXhlbCB0aGF0IHRoZSB1c2VyIGhhcyBkcmFnZ2VkLlxuICAgKi9cbiAgbW92ZWQ6IE9ic2VydmFibGU8e1xuICAgIHNvdXJjZTogRHJhZ1JlZjtcbiAgICBwb2ludGVyUG9zaXRpb246IHt4OiBudW1iZXIsIHk6IG51bWJlcn07XG4gICAgZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50O1xuICAgIGRpc3RhbmNlOiBQb2ludDtcbiAgICBkZWx0YToge3g6IC0xIHwgMCB8IDEsIHk6IC0xIHwgMCB8IDF9O1xuICB9PiA9IHRoaXMuX21vdmVFdmVudHMuYXNPYnNlcnZhYmxlKCk7XG5cbiAgLyoqIEFyYml0cmFyeSBkYXRhIHRoYXQgY2FuIGJlIGF0dGFjaGVkIHRvIHRoZSBkcmFnIGl0ZW0uICovXG4gIGRhdGE6IFQ7XG5cbiAgLyoqXG4gICAqIEZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gY3VzdG9taXplIHRoZSBsb2dpYyBvZiBob3cgdGhlIHBvc2l0aW9uIG9mIHRoZSBkcmFnIGl0ZW1cbiAgICogaXMgbGltaXRlZCB3aGlsZSBpdCdzIGJlaW5nIGRyYWdnZWQuIEdldHMgY2FsbGVkIHdpdGggYSBwb2ludCBjb250YWluaW5nIHRoZSBjdXJyZW50IHBvc2l0aW9uXG4gICAqIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBvbiB0aGUgcGFnZSBhbmQgc2hvdWxkIHJldHVybiBhIHBvaW50IGRlc2NyaWJpbmcgd2hlcmUgdGhlIGl0ZW0gc2hvdWxkXG4gICAqIGJlIHJlbmRlcmVkLlxuICAgKi9cbiAgY29uc3RyYWluUG9zaXRpb24/OiAocG9pbnQ6IFBvaW50LCBkcmFnUmVmOiBEcmFnUmVmKSA9PiBQb2ludDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiB8IEhUTUxFbGVtZW50LFxuICAgIHByaXZhdGUgX2NvbmZpZzogRHJhZ1JlZkNvbmZpZyxcbiAgICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQsXG4gICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgcHJpdmF0ZSBfdmlld3BvcnRSdWxlcjogVmlld3BvcnRSdWxlcixcbiAgICBwcml2YXRlIF9kcmFnRHJvcFJlZ2lzdHJ5OiBEcmFnRHJvcFJlZ2lzdHJ5PERyYWdSZWYsIERyb3BMaXN0UmVmPikge1xuXG4gICAgdGhpcy53aXRoUm9vdEVsZW1lbnQoZWxlbWVudCk7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zID0gbmV3IFBhcmVudFBvc2l0aW9uVHJhY2tlcihfZG9jdW1lbnQsIF92aWV3cG9ydFJ1bGVyKTtcbiAgICBfZHJhZ0Ryb3BSZWdpc3RyeS5yZWdpc3RlckRyYWdJdGVtKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGVsZW1lbnQgdGhhdCBpcyBiZWluZyB1c2VkIGFzIGEgcGxhY2Vob2xkZXJcbiAgICogd2hpbGUgdGhlIGN1cnJlbnQgZWxlbWVudCBpcyBiZWluZyBkcmFnZ2VkLlxuICAgKi9cbiAgZ2V0UGxhY2Vob2xkZXJFbGVtZW50KCk6IEhUTUxFbGVtZW50IHtcbiAgICByZXR1cm4gdGhpcy5fcGxhY2Vob2xkZXI7XG4gIH1cblxuICAvKiogUmV0dXJucyB0aGUgcm9vdCBkcmFnZ2FibGUgZWxlbWVudC4gKi9cbiAgZ2V0Um9vdEVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLl9yb290RWxlbWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50bHktdmlzaWJsZSBlbGVtZW50IHRoYXQgcmVwcmVzZW50cyB0aGUgZHJhZyBpdGVtLlxuICAgKiBXaGlsZSBkcmFnZ2luZyB0aGlzIGlzIHRoZSBwbGFjZWhvbGRlciwgb3RoZXJ3aXNlIGl0J3MgdGhlIHJvb3QgZWxlbWVudC5cbiAgICovXG4gIGdldFZpc2libGVFbGVtZW50KCk6IEhUTUxFbGVtZW50IHtcbiAgICByZXR1cm4gdGhpcy5pc0RyYWdnaW5nKCkgPyB0aGlzLmdldFBsYWNlaG9sZGVyRWxlbWVudCgpIDogdGhpcy5nZXRSb290RWxlbWVudCgpO1xuICB9XG5cbiAgLyoqIFJlZ2lzdGVycyB0aGUgaGFuZGxlcyB0aGF0IGNhbiBiZSB1c2VkIHRvIGRyYWcgdGhlIGVsZW1lbnQuICovXG4gIHdpdGhIYW5kbGVzKGhhbmRsZXM6IChIVE1MRWxlbWVudCB8IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+KVtdKTogdGhpcyB7XG4gICAgdGhpcy5faGFuZGxlcyA9IGhhbmRsZXMubWFwKGhhbmRsZSA9PiBjb2VyY2VFbGVtZW50KGhhbmRsZSkpO1xuICAgIHRoaXMuX2hhbmRsZXMuZm9yRWFjaChoYW5kbGUgPT4gdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucyhoYW5kbGUsIGZhbHNlKSk7XG4gICAgdGhpcy5fdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucygpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyB0aGUgdGVtcGxhdGUgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgdGhlIGRyYWcgcHJldmlldy5cbiAgICogQHBhcmFtIHRlbXBsYXRlIFRlbXBsYXRlIHRoYXQgZnJvbSB3aGljaCB0byBzdGFtcCBvdXQgdGhlIHByZXZpZXcuXG4gICAqL1xuICB3aXRoUHJldmlld1RlbXBsYXRlKHRlbXBsYXRlOiBEcmFnUHJldmlld1RlbXBsYXRlIHwgbnVsbCk6IHRoaXMge1xuICAgIHRoaXMuX3ByZXZpZXdUZW1wbGF0ZSA9IHRlbXBsYXRlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyB0aGUgdGVtcGxhdGUgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgdGhlIGRyYWcgcGxhY2Vob2xkZXIuXG4gICAqIEBwYXJhbSB0ZW1wbGF0ZSBUZW1wbGF0ZSB0aGF0IGZyb20gd2hpY2ggdG8gc3RhbXAgb3V0IHRoZSBwbGFjZWhvbGRlci5cbiAgICovXG4gIHdpdGhQbGFjZWhvbGRlclRlbXBsYXRlKHRlbXBsYXRlOiBEcmFnSGVscGVyVGVtcGxhdGUgfCBudWxsKTogdGhpcyB7XG4gICAgdGhpcy5fcGxhY2Vob2xkZXJUZW1wbGF0ZSA9IHRlbXBsYXRlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYW4gYWx0ZXJuYXRlIGRyYWcgcm9vdCBlbGVtZW50LiBUaGUgcm9vdCBlbGVtZW50IGlzIHRoZSBlbGVtZW50IHRoYXQgd2lsbCBiZSBtb3ZlZCBhc1xuICAgKiB0aGUgdXNlciBpcyBkcmFnZ2luZy4gUGFzc2luZyBhbiBhbHRlcm5hdGUgcm9vdCBlbGVtZW50IGlzIHVzZWZ1bCB3aGVuIHRyeWluZyB0byBlbmFibGVcbiAgICogZHJhZ2dpbmcgb24gYW4gZWxlbWVudCB0aGF0IHlvdSBtaWdodCBub3QgaGF2ZSBhY2Nlc3MgdG8uXG4gICAqL1xuICB3aXRoUm9vdEVsZW1lbnQocm9vdEVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+IHwgSFRNTEVsZW1lbnQpOiB0aGlzIHtcbiAgICBjb25zdCBlbGVtZW50ID0gY29lcmNlRWxlbWVudChyb290RWxlbWVudCk7XG5cbiAgICBpZiAoZWxlbWVudCAhPT0gdGhpcy5fcm9vdEVsZW1lbnQpIHtcbiAgICAgIGlmICh0aGlzLl9yb290RWxlbWVudCkge1xuICAgICAgICB0aGlzLl9yZW1vdmVSb290RWxlbWVudExpc3RlbmVycyh0aGlzLl9yb290RWxlbWVudCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fcG9pbnRlckRvd24sIGFjdGl2ZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5fcG9pbnRlckRvd24sIHBhc3NpdmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuX2luaXRpYWxUcmFuc2Zvcm0gPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9yb290RWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogRWxlbWVudCB0byB3aGljaCB0aGUgZHJhZ2dhYmxlJ3MgcG9zaXRpb24gd2lsbCBiZSBjb25zdHJhaW5lZC5cbiAgICovXG4gIHdpdGhCb3VuZGFyeUVsZW1lbnQoYm91bmRhcnlFbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiB8IEhUTUxFbGVtZW50IHwgbnVsbCk6IHRoaXMge1xuICAgIHRoaXMuX2JvdW5kYXJ5RWxlbWVudCA9IGJvdW5kYXJ5RWxlbWVudCA/IGNvZXJjZUVsZW1lbnQoYm91bmRhcnlFbGVtZW50KSA6IG51bGw7XG4gICAgdGhpcy5fcmVzaXplU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgaWYgKGJvdW5kYXJ5RWxlbWVudCkge1xuICAgICAgdGhpcy5fcmVzaXplU3Vic2NyaXB0aW9uID0gdGhpcy5fdmlld3BvcnRSdWxlclxuICAgICAgICAuY2hhbmdlKDEwKVxuICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMuX2NvbnRhaW5JbnNpZGVCb3VuZGFyeU9uUmVzaXplKCkpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBSZW1vdmVzIHRoZSBkcmFnZ2luZyBmdW5jdGlvbmFsaXR5IGZyb20gdGhlIERPTSBlbGVtZW50LiAqL1xuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuX3JlbW92ZVJvb3RFbGVtZW50TGlzdGVuZXJzKHRoaXMuX3Jvb3RFbGVtZW50KTtcblxuICAgIC8vIERvIHRoaXMgY2hlY2sgYmVmb3JlIHJlbW92aW5nIGZyb20gdGhlIHJlZ2lzdHJ5IHNpbmNlIGl0J2xsXG4gICAgLy8gc3RvcCBiZWluZyBjb25zaWRlcmVkIGFzIGRyYWdnZWQgb25jZSBpdCBpcyByZW1vdmVkLlxuICAgIGlmICh0aGlzLmlzRHJhZ2dpbmcoKSkge1xuICAgICAgLy8gU2luY2Ugd2UgbW92ZSBvdXQgdGhlIGVsZW1lbnQgdG8gdGhlIGVuZCBvZiB0aGUgYm9keSB3aGlsZSBpdCdzIGJlaW5nXG4gICAgICAvLyBkcmFnZ2VkLCB3ZSBoYXZlIHRvIG1ha2Ugc3VyZSB0aGF0IGl0J3MgcmVtb3ZlZCBpZiBpdCBnZXRzIGRlc3Ryb3llZC5cbiAgICAgIHJlbW92ZU5vZGUodGhpcy5fcm9vdEVsZW1lbnQpO1xuICAgIH1cblxuICAgIHJlbW92ZU5vZGUodGhpcy5fYW5jaG9yKTtcbiAgICB0aGlzLl9kZXN0cm95UHJldmlldygpO1xuICAgIHRoaXMuX2Rlc3Ryb3lQbGFjZWhvbGRlcigpO1xuICAgIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkucmVtb3ZlRHJhZ0l0ZW0odGhpcyk7XG4gICAgdGhpcy5fcmVtb3ZlU3Vic2NyaXB0aW9ucygpO1xuICAgIHRoaXMuYmVmb3JlU3RhcnRlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuc3RhcnRlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMucmVsZWFzZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmVuZGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5lbnRlcmVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5leGl0ZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmRyb3BwZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLl9tb3ZlRXZlbnRzLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5faGFuZGxlcyA9IFtdO1xuICAgIHRoaXMuX2Rpc2FibGVkSGFuZGxlcy5jbGVhcigpO1xuICAgIHRoaXMuX2Ryb3BDb250YWluZXIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fcmVzaXplU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLmNsZWFyKCk7XG4gICAgdGhpcy5fYm91bmRhcnlFbGVtZW50ID0gdGhpcy5fcm9vdEVsZW1lbnQgPSB0aGlzLl9wbGFjZWhvbGRlclRlbXBsYXRlID1cbiAgICAgICAgdGhpcy5fcHJldmlld1RlbXBsYXRlID0gdGhpcy5fYW5jaG9yID0gbnVsbCE7XG4gIH1cblxuICAvKiogQ2hlY2tzIHdoZXRoZXIgdGhlIGVsZW1lbnQgaXMgY3VycmVudGx5IGJlaW5nIGRyYWdnZWQuICovXG4gIGlzRHJhZ2dpbmcoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2hhc1N0YXJ0ZWREcmFnZ2luZyAmJiB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LmlzRHJhZ2dpbmcodGhpcyk7XG4gIH1cblxuICAvKiogUmVzZXRzIGEgc3RhbmRhbG9uZSBkcmFnIGl0ZW0gdG8gaXRzIGluaXRpYWwgcG9zaXRpb24uICovXG4gIHJlc2V0KCk6IHZvaWQge1xuICAgIHRoaXMuX3Jvb3RFbGVtZW50LnN0eWxlLnRyYW5zZm9ybSA9IHRoaXMuX2luaXRpYWxUcmFuc2Zvcm0gfHwgJyc7XG4gICAgdGhpcy5fYWN0aXZlVHJhbnNmb3JtID0ge3g6IDAsIHk6IDB9O1xuICAgIHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm0gPSB7eDogMCwgeTogMH07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIGhhbmRsZSBhcyBkaXNhYmxlZC4gV2hpbGUgYSBoYW5kbGUgaXMgZGlzYWJsZWQsIGl0J2xsIGNhcHR1cmUgYW5kIGludGVycnVwdCBkcmFnZ2luZy5cbiAgICogQHBhcmFtIGhhbmRsZSBIYW5kbGUgZWxlbWVudCB0aGF0IHNob3VsZCBiZSBkaXNhYmxlZC5cbiAgICovXG4gIGRpc2FibGVIYW5kbGUoaGFuZGxlOiBIVE1MRWxlbWVudCkge1xuICAgIGlmICh0aGlzLl9oYW5kbGVzLmluZGV4T2YoaGFuZGxlKSA+IC0xKSB7XG4gICAgICB0aGlzLl9kaXNhYmxlZEhhbmRsZXMuYWRkKGhhbmRsZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEVuYWJsZXMgYSBoYW5kbGUsIGlmIGl0IGhhcyBiZWVuIGRpc2FibGVkLlxuICAgKiBAcGFyYW0gaGFuZGxlIEhhbmRsZSBlbGVtZW50IHRvIGJlIGVuYWJsZWQuXG4gICAqL1xuICBlbmFibGVIYW5kbGUoaGFuZGxlOiBIVE1MRWxlbWVudCkge1xuICAgIHRoaXMuX2Rpc2FibGVkSGFuZGxlcy5kZWxldGUoaGFuZGxlKTtcbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBsYXlvdXQgZGlyZWN0aW9uIG9mIHRoZSBkcmFnZ2FibGUgaXRlbS4gKi9cbiAgd2l0aERpcmVjdGlvbihkaXJlY3Rpb246IERpcmVjdGlvbik6IHRoaXMge1xuICAgIHRoaXMuX2RpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBjb250YWluZXIgdGhhdCB0aGUgaXRlbSBpcyBwYXJ0IG9mLiAqL1xuICBfd2l0aERyb3BDb250YWluZXIoY29udGFpbmVyOiBEcm9wTGlzdFJlZikge1xuICAgIHRoaXMuX2Ryb3BDb250YWluZXIgPSBjb250YWluZXI7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCBwb3NpdGlvbiBpbiBwaXhlbHMgdGhlIGRyYWdnYWJsZSBvdXRzaWRlIG9mIGEgZHJvcCBjb250YWluZXIuXG4gICAqL1xuICBnZXRGcmVlRHJhZ1Bvc2l0aW9uKCk6IFJlYWRvbmx5PFBvaW50PiB7XG4gICAgY29uc3QgcG9zaXRpb24gPSB0aGlzLmlzRHJhZ2dpbmcoKSA/IHRoaXMuX2FjdGl2ZVRyYW5zZm9ybSA6IHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm07XG4gICAgcmV0dXJuIHt4OiBwb3NpdGlvbi54LCB5OiBwb3NpdGlvbi55fTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjdXJyZW50IHBvc2l0aW9uIGluIHBpeGVscyB0aGUgZHJhZ2dhYmxlIG91dHNpZGUgb2YgYSBkcm9wIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHZhbHVlIE5ldyBwb3NpdGlvbiB0byBiZSBzZXQuXG4gICAqL1xuICBzZXRGcmVlRHJhZ1Bvc2l0aW9uKHZhbHVlOiBQb2ludCk6IHRoaXMge1xuICAgIHRoaXMuX2FjdGl2ZVRyYW5zZm9ybSA9IHt4OiAwLCB5OiAwfTtcbiAgICB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtLnggPSB2YWx1ZS54O1xuICAgIHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm0ueSA9IHZhbHVlLnk7XG5cbiAgICBpZiAoIXRoaXMuX2Ryb3BDb250YWluZXIpIHtcbiAgICAgIHRoaXMuX2FwcGx5Um9vdEVsZW1lbnRUcmFuc2Zvcm0odmFsdWUueCwgdmFsdWUueSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogVXBkYXRlcyB0aGUgaXRlbSdzIHNvcnQgb3JkZXIgYmFzZWQgb24gdGhlIGxhc3Qta25vd24gcG9pbnRlciBwb3NpdGlvbi4gKi9cbiAgX3NvcnRGcm9tTGFzdFBvaW50ZXJQb3NpdGlvbigpIHtcbiAgICBjb25zdCBwb3NpdGlvbiA9IHRoaXMuX3BvaW50ZXJQb3NpdGlvbkF0TGFzdERpcmVjdGlvbkNoYW5nZTtcblxuICAgIGlmIChwb3NpdGlvbiAmJiB0aGlzLl9kcm9wQ29udGFpbmVyKSB7XG4gICAgICB0aGlzLl91cGRhdGVBY3RpdmVEcm9wQ29udGFpbmVyKHRoaXMuX2dldENvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uKHBvc2l0aW9uKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFVuc3Vic2NyaWJlcyBmcm9tIHRoZSBnbG9iYWwgc3Vic2NyaXB0aW9ucy4gKi9cbiAgcHJpdmF0ZSBfcmVtb3ZlU3Vic2NyaXB0aW9ucygpIHtcbiAgICB0aGlzLl9wb2ludGVyTW92ZVN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuX3BvaW50ZXJVcFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuX3Njcm9sbFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICB9XG5cbiAgLyoqIERlc3Ryb3lzIHRoZSBwcmV2aWV3IGVsZW1lbnQgYW5kIGl0cyBWaWV3UmVmLiAqL1xuICBwcml2YXRlIF9kZXN0cm95UHJldmlldygpIHtcbiAgICBpZiAodGhpcy5fcHJldmlldykge1xuICAgICAgcmVtb3ZlTm9kZSh0aGlzLl9wcmV2aWV3KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fcHJldmlld1JlZikge1xuICAgICAgdGhpcy5fcHJldmlld1JlZi5kZXN0cm95KCk7XG4gICAgfVxuXG4gICAgdGhpcy5fcHJldmlldyA9IHRoaXMuX3ByZXZpZXdSZWYgPSBudWxsITtcbiAgfVxuXG4gIC8qKiBEZXN0cm95cyB0aGUgcGxhY2Vob2xkZXIgZWxlbWVudCBhbmQgaXRzIFZpZXdSZWYuICovXG4gIHByaXZhdGUgX2Rlc3Ryb3lQbGFjZWhvbGRlcigpIHtcbiAgICBpZiAodGhpcy5fcGxhY2Vob2xkZXIpIHtcbiAgICAgIHJlbW92ZU5vZGUodGhpcy5fcGxhY2Vob2xkZXIpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9wbGFjZWhvbGRlclJlZikge1xuICAgICAgdGhpcy5fcGxhY2Vob2xkZXJSZWYuZGVzdHJveSgpO1xuICAgIH1cblxuICAgIHRoaXMuX3BsYWNlaG9sZGVyID0gdGhpcy5fcGxhY2Vob2xkZXJSZWYgPSBudWxsITtcbiAgfVxuXG4gIC8qKiBIYW5kbGVyIGZvciB0aGUgYG1vdXNlZG93bmAvYHRvdWNoc3RhcnRgIGV2ZW50cy4gKi9cbiAgcHJpdmF0ZSBfcG9pbnRlckRvd24gPSAoZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KSA9PiB7XG4gICAgdGhpcy5iZWZvcmVTdGFydGVkLm5leHQoKTtcblxuICAgIC8vIERlbGVnYXRlIHRoZSBldmVudCBiYXNlZCBvbiB3aGV0aGVyIGl0IHN0YXJ0ZWQgZnJvbSBhIGhhbmRsZSBvciB0aGUgZWxlbWVudCBpdHNlbGYuXG4gICAgaWYgKHRoaXMuX2hhbmRsZXMubGVuZ3RoKSB7XG4gICAgICBjb25zdCB0YXJnZXRIYW5kbGUgPSB0aGlzLl9oYW5kbGVzLmZpbmQoaGFuZGxlID0+IHtcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0O1xuICAgICAgICByZXR1cm4gISF0YXJnZXQgJiYgKHRhcmdldCA9PT0gaGFuZGxlIHx8IGhhbmRsZS5jb250YWlucyh0YXJnZXQgYXMgSFRNTEVsZW1lbnQpKTtcbiAgICAgIH0pO1xuXG4gICAgICBpZiAodGFyZ2V0SGFuZGxlICYmICF0aGlzLl9kaXNhYmxlZEhhbmRsZXMuaGFzKHRhcmdldEhhbmRsZSkgJiYgIXRoaXMuZGlzYWJsZWQpIHtcbiAgICAgICAgdGhpcy5faW5pdGlhbGl6ZURyYWdTZXF1ZW5jZSh0YXJnZXRIYW5kbGUsIGV2ZW50KTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCF0aGlzLmRpc2FibGVkKSB7XG4gICAgICB0aGlzLl9pbml0aWFsaXplRHJhZ1NlcXVlbmNlKHRoaXMuX3Jvb3RFbGVtZW50LCBldmVudCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEhhbmRsZXIgdGhhdCBpcyBpbnZva2VkIHdoZW4gdGhlIHVzZXIgbW92ZXMgdGhlaXIgcG9pbnRlciBhZnRlciB0aGV5J3ZlIGluaXRpYXRlZCBhIGRyYWcuICovXG4gIHByaXZhdGUgX3BvaW50ZXJNb3ZlID0gKGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCkgPT4ge1xuICAgIC8vIFByZXZlbnQgdGhlIGRlZmF1bHQgYWN0aW9uIGFzIGVhcmx5IGFzIHBvc3NpYmxlIGluIG9yZGVyIHRvIGJsb2NrXG4gICAgLy8gbmF0aXZlIGFjdGlvbnMgbGlrZSBkcmFnZ2luZyB0aGUgc2VsZWN0ZWQgdGV4dCBvciBpbWFnZXMgd2l0aCB0aGUgbW91c2UuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCBwb2ludGVyUG9zaXRpb24gPSB0aGlzLl9nZXRQb2ludGVyUG9zaXRpb25PblBhZ2UoZXZlbnQpO1xuXG4gICAgaWYgKCF0aGlzLl9oYXNTdGFydGVkRHJhZ2dpbmcpIHtcbiAgICAgIGNvbnN0IGRpc3RhbmNlWCA9IE1hdGguYWJzKHBvaW50ZXJQb3NpdGlvbi54IC0gdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UueCk7XG4gICAgICBjb25zdCBkaXN0YW5jZVkgPSBNYXRoLmFicyhwb2ludGVyUG9zaXRpb24ueSAtIHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLnkpO1xuICAgICAgY29uc3QgaXNPdmVyVGhyZXNob2xkID0gZGlzdGFuY2VYICsgZGlzdGFuY2VZID49IHRoaXMuX2NvbmZpZy5kcmFnU3RhcnRUaHJlc2hvbGQ7XG5cbiAgICAgIC8vIE9ubHkgc3RhcnQgZHJhZ2dpbmcgYWZ0ZXIgdGhlIHVzZXIgaGFzIG1vdmVkIG1vcmUgdGhhbiB0aGUgbWluaW11bSBkaXN0YW5jZSBpbiBlaXRoZXJcbiAgICAgIC8vIGRpcmVjdGlvbi4gTm90ZSB0aGF0IHRoaXMgaXMgcHJlZmVycmFibGUgb3ZlciBkb2luZyBzb21ldGhpbmcgbGlrZSBgc2tpcChtaW5pbXVtRGlzdGFuY2UpYFxuICAgICAgLy8gaW4gdGhlIGBwb2ludGVyTW92ZWAgc3Vic2NyaXB0aW9uLCBiZWNhdXNlIHdlJ3JlIG5vdCBndWFyYW50ZWVkIHRvIGhhdmUgb25lIG1vdmUgZXZlbnRcbiAgICAgIC8vIHBlciBwaXhlbCBvZiBtb3ZlbWVudCAoZS5nLiBpZiB0aGUgdXNlciBtb3ZlcyB0aGVpciBwb2ludGVyIHF1aWNrbHkpLlxuICAgICAgaWYgKGlzT3ZlclRocmVzaG9sZCkge1xuICAgICAgICBjb25zdCBpc0RlbGF5RWxhcHNlZCA9IERhdGUubm93KCkgPj0gdGhpcy5fZHJhZ1N0YXJ0VGltZSArIHRoaXMuX2dldERyYWdTdGFydERlbGF5KGV2ZW50KTtcbiAgICAgICAgaWYgKCFpc0RlbGF5RWxhcHNlZCkge1xuICAgICAgICAgIHRoaXMuX2VuZERyYWdTZXF1ZW5jZShldmVudCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHJldmVudCBvdGhlciBkcmFnIHNlcXVlbmNlcyBmcm9tIHN0YXJ0aW5nIHdoaWxlIHNvbWV0aGluZyBpbiB0aGUgY29udGFpbmVyIGlzIHN0aWxsXG4gICAgICAgIC8vIGJlaW5nIGRyYWdnZWQuIFRoaXMgY2FuIGhhcHBlbiB3aGlsZSB3ZSdyZSB3YWl0aW5nIGZvciB0aGUgZHJvcCBhbmltYXRpb24gdG8gZmluaXNoXG4gICAgICAgIC8vIGFuZCBjYW4gY2F1c2UgZXJyb3JzLCBiZWNhdXNlIHNvbWUgZWxlbWVudHMgbWlnaHQgc3RpbGwgYmUgbW92aW5nIGFyb3VuZC5cbiAgICAgICAgaWYgKCF0aGlzLl9kcm9wQ29udGFpbmVyIHx8ICF0aGlzLl9kcm9wQ29udGFpbmVyLmlzRHJhZ2dpbmcoKSkge1xuICAgICAgICAgIHRoaXMuX2hhc1N0YXJ0ZWREcmFnZ2luZyA9IHRydWU7XG4gICAgICAgICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiB0aGlzLl9zdGFydERyYWdTZXF1ZW5jZShldmVudCkpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBXZSBvbmx5IG5lZWQgdGhlIHByZXZpZXcgZGltZW5zaW9ucyBpZiB3ZSBoYXZlIGEgYm91bmRhcnkgZWxlbWVudC5cbiAgICBpZiAodGhpcy5fYm91bmRhcnlFbGVtZW50KSB7XG4gICAgICAvLyBDYWNoZSB0aGUgcHJldmlldyBlbGVtZW50IHJlY3QgaWYgd2UgaGF2ZW4ndCBjYWNoZWQgaXQgYWxyZWFkeSBvciBpZlxuICAgICAgLy8gd2UgY2FjaGVkIGl0IHRvbyBlYXJseSBiZWZvcmUgdGhlIGVsZW1lbnQgZGltZW5zaW9ucyB3ZXJlIGNvbXB1dGVkLlxuICAgICAgaWYgKCF0aGlzLl9wcmV2aWV3UmVjdCB8fCAoIXRoaXMuX3ByZXZpZXdSZWN0LndpZHRoICYmICF0aGlzLl9wcmV2aWV3UmVjdC5oZWlnaHQpKSB7XG4gICAgICAgIHRoaXMuX3ByZXZpZXdSZWN0ID0gKHRoaXMuX3ByZXZpZXcgfHwgdGhpcy5fcm9vdEVsZW1lbnQpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGNvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uID0gdGhpcy5fZ2V0Q29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24ocG9pbnRlclBvc2l0aW9uKTtcbiAgICB0aGlzLl9oYXNNb3ZlZCA9IHRydWU7XG4gICAgdGhpcy5fdXBkYXRlUG9pbnRlckRpcmVjdGlvbkRlbHRhKGNvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uKTtcblxuICAgIGlmICh0aGlzLl9kcm9wQ29udGFpbmVyKSB7XG4gICAgICB0aGlzLl91cGRhdGVBY3RpdmVEcm9wQ29udGFpbmVyKGNvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgYWN0aXZlVHJhbnNmb3JtID0gdGhpcy5fYWN0aXZlVHJhbnNmb3JtO1xuICAgICAgYWN0aXZlVHJhbnNmb3JtLnggPVxuICAgICAgICAgIGNvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uLnggLSB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZS54ICsgdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybS54O1xuICAgICAgYWN0aXZlVHJhbnNmb3JtLnkgPVxuICAgICAgICAgIGNvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uLnkgLSB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZS55ICsgdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybS55O1xuXG4gICAgICB0aGlzLl9hcHBseVJvb3RFbGVtZW50VHJhbnNmb3JtKGFjdGl2ZVRyYW5zZm9ybS54LCBhY3RpdmVUcmFuc2Zvcm0ueSk7XG5cbiAgICAgIC8vIEFwcGx5IHRyYW5zZm9ybSBhcyBhdHRyaWJ1dGUgaWYgZHJhZ2dpbmcgYW5kIHN2ZyBlbGVtZW50IHRvIHdvcmsgZm9yIElFXG4gICAgICBpZiAodHlwZW9mIFNWR0VsZW1lbnQgIT09ICd1bmRlZmluZWQnICYmIHRoaXMuX3Jvb3RFbGVtZW50IGluc3RhbmNlb2YgU1ZHRWxlbWVudCkge1xuICAgICAgICBjb25zdCBhcHBsaWVkVHJhbnNmb3JtID0gYHRyYW5zbGF0ZSgke2FjdGl2ZVRyYW5zZm9ybS54fSAke2FjdGl2ZVRyYW5zZm9ybS55fSlgO1xuICAgICAgICB0aGlzLl9yb290RWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3RyYW5zZm9ybScsIGFwcGxpZWRUcmFuc2Zvcm0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFNpbmNlIHRoaXMgZXZlbnQgZ2V0cyBmaXJlZCBmb3IgZXZlcnkgcGl4ZWwgd2hpbGUgZHJhZ2dpbmcsIHdlIG9ubHlcbiAgICAvLyB3YW50IHRvIGZpcmUgaXQgaWYgdGhlIGNvbnN1bWVyIG9wdGVkIGludG8gaXQuIEFsc28gd2UgaGF2ZSB0b1xuICAgIC8vIHJlLWVudGVyIHRoZSB6b25lIGJlY2F1c2Ugd2UgcnVuIGFsbCBvZiB0aGUgZXZlbnRzIG9uIHRoZSBvdXRzaWRlLlxuICAgIGlmICh0aGlzLl9tb3ZlRXZlbnRzLm9ic2VydmVycy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICB0aGlzLl9tb3ZlRXZlbnRzLm5leHQoe1xuICAgICAgICAgIHNvdXJjZTogdGhpcyxcbiAgICAgICAgICBwb2ludGVyUG9zaXRpb246IGNvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uLFxuICAgICAgICAgIGV2ZW50LFxuICAgICAgICAgIGRpc3RhbmNlOiB0aGlzLl9nZXREcmFnRGlzdGFuY2UoY29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24pLFxuICAgICAgICAgIGRlbHRhOiB0aGlzLl9wb2ludGVyRGlyZWN0aW9uRGVsdGFcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKiogSGFuZGxlciB0aGF0IGlzIGludm9rZWQgd2hlbiB0aGUgdXNlciBsaWZ0cyB0aGVpciBwb2ludGVyIHVwLCBhZnRlciBpbml0aWF0aW5nIGEgZHJhZy4gKi9cbiAgcHJpdmF0ZSBfcG9pbnRlclVwID0gKGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCkgPT4ge1xuICAgIHRoaXMuX2VuZERyYWdTZXF1ZW5jZShldmVudCk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIHN1YnNjcmlwdGlvbnMgYW5kIHN0b3BzIHRoZSBkcmFnZ2luZyBzZXF1ZW5jZS5cbiAgICogQHBhcmFtIGV2ZW50IEJyb3dzZXIgZXZlbnQgb2JqZWN0IHRoYXQgZW5kZWQgdGhlIHNlcXVlbmNlLlxuICAgKi9cbiAgcHJpdmF0ZSBfZW5kRHJhZ1NlcXVlbmNlKGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCkge1xuICAgIC8vIE5vdGUgdGhhdCBoZXJlIHdlIHVzZSBgaXNEcmFnZ2luZ2AgZnJvbSB0aGUgc2VydmljZSwgcmF0aGVyIHRoYW4gZnJvbSBgdGhpc2AuXG4gICAgLy8gVGhlIGRpZmZlcmVuY2UgaXMgdGhhdCB0aGUgb25lIGZyb20gdGhlIHNlcnZpY2UgcmVmbGVjdHMgd2hldGhlciBhIGRyYWdnaW5nIHNlcXVlbmNlXG4gICAgLy8gaGFzIGJlZW4gaW5pdGlhdGVkLCB3aGVyZWFzIHRoZSBvbmUgb24gYHRoaXNgIGluY2x1ZGVzIHdoZXRoZXIgdGhlIHVzZXIgaGFzIHBhc3NlZFxuICAgIC8vIHRoZSBtaW5pbXVtIGRyYWdnaW5nIHRocmVzaG9sZC5cbiAgICBpZiAoIXRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuaXNEcmFnZ2luZyh0aGlzKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3JlbW92ZVN1YnNjcmlwdGlvbnMoKTtcbiAgICB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnN0b3BEcmFnZ2luZyh0aGlzKTtcbiAgICB0aGlzLl90b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKCk7XG5cbiAgICBpZiAodGhpcy5faGFuZGxlcykge1xuICAgICAgdGhpcy5fcm9vdEVsZW1lbnQuc3R5bGUud2Via2l0VGFwSGlnaGxpZ2h0Q29sb3IgPSB0aGlzLl9yb290RWxlbWVudFRhcEhpZ2hsaWdodDtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX2hhc1N0YXJ0ZWREcmFnZ2luZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMucmVsZWFzZWQubmV4dCh7c291cmNlOiB0aGlzfSk7XG5cbiAgICBpZiAodGhpcy5fZHJvcENvbnRhaW5lcikge1xuICAgICAgLy8gU3RvcCBzY3JvbGxpbmcgaW1tZWRpYXRlbHksIGluc3RlYWQgb2Ygd2FpdGluZyBmb3IgdGhlIGFuaW1hdGlvbiB0byBmaW5pc2guXG4gICAgICB0aGlzLl9kcm9wQ29udGFpbmVyLl9zdG9wU2Nyb2xsaW5nKCk7XG4gICAgICB0aGlzLl9hbmltYXRlUHJldmlld1RvUGxhY2Vob2xkZXIoKS50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5fY2xlYW51cERyYWdBcnRpZmFjdHMoZXZlbnQpO1xuICAgICAgICB0aGlzLl9jbGVhbnVwQ2FjaGVkRGltZW5zaW9ucygpO1xuICAgICAgICB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnN0b3BEcmFnZ2luZyh0aGlzKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBDb252ZXJ0IHRoZSBhY3RpdmUgdHJhbnNmb3JtIGludG8gYSBwYXNzaXZlIG9uZS4gVGhpcyBtZWFucyB0aGF0IG5leHQgdGltZVxuICAgICAgLy8gdGhlIHVzZXIgc3RhcnRzIGRyYWdnaW5nIHRoZSBpdGVtLCBpdHMgcG9zaXRpb24gd2lsbCBiZSBjYWxjdWxhdGVkIHJlbGF0aXZlbHlcbiAgICAgIC8vIHRvIHRoZSBuZXcgcGFzc2l2ZSB0cmFuc2Zvcm0uXG4gICAgICB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtLnggPSB0aGlzLl9hY3RpdmVUcmFuc2Zvcm0ueDtcbiAgICAgIHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm0ueSA9IHRoaXMuX2FjdGl2ZVRyYW5zZm9ybS55O1xuICAgICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiB7XG4gICAgICAgIHRoaXMuZW5kZWQubmV4dCh7XG4gICAgICAgICAgc291cmNlOiB0aGlzLFxuICAgICAgICAgIGRpc3RhbmNlOiB0aGlzLl9nZXREcmFnRGlzdGFuY2UodGhpcy5fZ2V0UG9pbnRlclBvc2l0aW9uT25QYWdlKGV2ZW50KSlcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuX2NsZWFudXBDYWNoZWREaW1lbnNpb25zKCk7XG4gICAgICB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnN0b3BEcmFnZ2luZyh0aGlzKTtcbiAgICB9XG4gIH1cblxuICAvKiogU3RhcnRzIHRoZSBkcmFnZ2luZyBzZXF1ZW5jZS4gKi9cbiAgcHJpdmF0ZSBfc3RhcnREcmFnU2VxdWVuY2UoZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KSB7XG4gICAgLy8gRW1pdCB0aGUgZXZlbnQgb24gdGhlIGl0ZW0gYmVmb3JlIHRoZSBvbmUgb24gdGhlIGNvbnRhaW5lci5cbiAgICB0aGlzLnN0YXJ0ZWQubmV4dCh7c291cmNlOiB0aGlzfSk7XG5cbiAgICBpZiAoaXNUb3VjaEV2ZW50KGV2ZW50KSkge1xuICAgICAgdGhpcy5fbGFzdFRvdWNoRXZlbnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICB9XG5cbiAgICB0aGlzLl90b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKCk7XG5cbiAgICBjb25zdCBkcm9wQ29udGFpbmVyID0gdGhpcy5fZHJvcENvbnRhaW5lcjtcblxuICAgIGlmIChkcm9wQ29udGFpbmVyKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fcm9vdEVsZW1lbnQ7XG4gICAgICBjb25zdCBwYXJlbnQgPSBlbGVtZW50LnBhcmVudE5vZGUhO1xuICAgICAgY29uc3QgcHJldmlldyA9IHRoaXMuX3ByZXZpZXcgPSB0aGlzLl9jcmVhdGVQcmV2aWV3RWxlbWVudCgpO1xuICAgICAgY29uc3QgcGxhY2Vob2xkZXIgPSB0aGlzLl9wbGFjZWhvbGRlciA9IHRoaXMuX2NyZWF0ZVBsYWNlaG9sZGVyRWxlbWVudCgpO1xuICAgICAgY29uc3QgYW5jaG9yID0gdGhpcy5fYW5jaG9yID0gdGhpcy5fYW5jaG9yIHx8IHRoaXMuX2RvY3VtZW50LmNyZWF0ZUNvbW1lbnQoJycpO1xuXG4gICAgICAvLyBJbnNlcnQgYW4gYW5jaG9yIG5vZGUgc28gdGhhdCB3ZSBjYW4gcmVzdG9yZSB0aGUgZWxlbWVudCdzIHBvc2l0aW9uIGluIHRoZSBET00uXG4gICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGFuY2hvciwgZWxlbWVudCk7XG5cbiAgICAgIC8vIFdlIG1vdmUgdGhlIGVsZW1lbnQgb3V0IGF0IHRoZSBlbmQgb2YgdGhlIGJvZHkgYW5kIHdlIG1ha2UgaXQgaGlkZGVuLCBiZWNhdXNlIGtlZXBpbmcgaXQgaW5cbiAgICAgIC8vIHBsYWNlIHdpbGwgdGhyb3cgb2ZmIHRoZSBjb25zdW1lcidzIGA6bGFzdC1jaGlsZGAgc2VsZWN0b3JzLiBXZSBjYW4ndCByZW1vdmUgdGhlIGVsZW1lbnRcbiAgICAgIC8vIGZyb20gdGhlIERPTSBjb21wbGV0ZWx5LCBiZWNhdXNlIGlPUyB3aWxsIHN0b3AgZmlyaW5nIGFsbCBzdWJzZXF1ZW50IGV2ZW50cyBpbiB0aGUgY2hhaW4uXG4gICAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICB0aGlzLl9kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHBhcmVudC5yZXBsYWNlQ2hpbGQocGxhY2Vob2xkZXIsIGVsZW1lbnQpKTtcbiAgICAgIGdldFByZXZpZXdJbnNlcnRpb25Qb2ludCh0aGlzLl9kb2N1bWVudCkuYXBwZW5kQ2hpbGQocHJldmlldyk7XG4gICAgICBkcm9wQ29udGFpbmVyLnN0YXJ0KCk7XG4gICAgICB0aGlzLl9pbml0aWFsQ29udGFpbmVyID0gZHJvcENvbnRhaW5lcjtcbiAgICAgIHRoaXMuX2luaXRpYWxJbmRleCA9IGRyb3BDb250YWluZXIuZ2V0SXRlbUluZGV4KHRoaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9pbml0aWFsQ29udGFpbmVyID0gdGhpcy5faW5pdGlhbEluZGV4ID0gdW5kZWZpbmVkITtcbiAgICB9XG5cbiAgICAvLyBJbXBvcnRhbnQgdG8gcnVuIGFmdGVyIHdlJ3ZlIGNhbGxlZCBgc3RhcnRgIG9uIHRoZSBwYXJlbnQgY29udGFpbmVyXG4gICAgLy8gc28gdGhhdCBpdCBoYXMgaGFkIHRpbWUgdG8gcmVzb2x2ZSBpdHMgc2Nyb2xsYWJsZSBwYXJlbnRzLlxuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5jYWNoZShkcm9wQ29udGFpbmVyID8gZHJvcENvbnRhaW5lci5nZXRTY3JvbGxhYmxlUGFyZW50cygpIDogW10pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgdGhlIGRpZmZlcmVudCB2YXJpYWJsZXMgYW5kIHN1YnNjcmlwdGlvbnNcbiAgICogdGhhdCB3aWxsIGJlIG5lY2Vzc2FyeSBmb3IgdGhlIGRyYWdnaW5nIHNlcXVlbmNlLlxuICAgKiBAcGFyYW0gcmVmZXJlbmNlRWxlbWVudCBFbGVtZW50IHRoYXQgc3RhcnRlZCB0aGUgZHJhZyBzZXF1ZW5jZS5cbiAgICogQHBhcmFtIGV2ZW50IEJyb3dzZXIgZXZlbnQgb2JqZWN0IHRoYXQgc3RhcnRlZCB0aGUgc2VxdWVuY2UuXG4gICAqL1xuICBwcml2YXRlIF9pbml0aWFsaXplRHJhZ1NlcXVlbmNlKHJlZmVyZW5jZUVsZW1lbnQ6IEhUTUxFbGVtZW50LCBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpIHtcbiAgICAvLyBBbHdheXMgc3RvcCBwcm9wYWdhdGlvbiBmb3IgdGhlIGV2ZW50IHRoYXQgaW5pdGlhbGl6ZXNcbiAgICAvLyB0aGUgZHJhZ2dpbmcgc2VxdWVuY2UsIGluIG9yZGVyIHRvIHByZXZlbnQgaXQgZnJvbSBwb3RlbnRpYWxseVxuICAgIC8vIHN0YXJ0aW5nIGFub3RoZXIgc2VxdWVuY2UgZm9yIGEgZHJhZ2dhYmxlIHBhcmVudCBzb21ld2hlcmUgdXAgdGhlIERPTSB0cmVlLlxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgY29uc3QgaXNEcmFnZ2luZyA9IHRoaXMuaXNEcmFnZ2luZygpO1xuICAgIGNvbnN0IGlzVG91Y2hTZXF1ZW5jZSA9IGlzVG91Y2hFdmVudChldmVudCk7XG4gICAgY29uc3QgaXNBdXhpbGlhcnlNb3VzZUJ1dHRvbiA9ICFpc1RvdWNoU2VxdWVuY2UgJiYgKGV2ZW50IGFzIE1vdXNlRXZlbnQpLmJ1dHRvbiAhPT0gMDtcbiAgICBjb25zdCByb290RWxlbWVudCA9IHRoaXMuX3Jvb3RFbGVtZW50O1xuICAgIGNvbnN0IGlzU3ludGhldGljRXZlbnQgPSAhaXNUb3VjaFNlcXVlbmNlICYmIHRoaXMuX2xhc3RUb3VjaEV2ZW50VGltZSAmJlxuICAgICAgdGhpcy5fbGFzdFRvdWNoRXZlbnRUaW1lICsgTU9VU0VfRVZFTlRfSUdOT1JFX1RJTUUgPiBEYXRlLm5vdygpO1xuXG4gICAgLy8gSWYgdGhlIGV2ZW50IHN0YXJ0ZWQgZnJvbSBhbiBlbGVtZW50IHdpdGggdGhlIG5hdGl2ZSBIVE1MIGRyYWcmZHJvcCwgaXQnbGwgaW50ZXJmZXJlXG4gICAgLy8gd2l0aCBvdXIgb3duIGRyYWdnaW5nIChlLmcuIGBpbWdgIHRhZ3MgZG8gaXQgYnkgZGVmYXVsdCkuIFByZXZlbnQgdGhlIGRlZmF1bHQgYWN0aW9uXG4gICAgLy8gdG8gc3RvcCBpdCBmcm9tIGhhcHBlbmluZy4gTm90ZSB0aGF0IHByZXZlbnRpbmcgb24gYGRyYWdzdGFydGAgYWxzbyBzZWVtcyB0byB3b3JrLCBidXRcbiAgICAvLyBpdCdzIGZsYWt5IGFuZCBpdCBmYWlscyBpZiB0aGUgdXNlciBkcmFncyBpdCBhd2F5IHF1aWNrbHkuIEFsc28gbm90ZSB0aGF0IHdlIG9ubHkgd2FudFxuICAgIC8vIHRvIGRvIHRoaXMgZm9yIGBtb3VzZWRvd25gIHNpbmNlIGRvaW5nIHRoZSBzYW1lIGZvciBgdG91Y2hzdGFydGAgd2lsbCBzdG9wIGFueSBgY2xpY2tgXG4gICAgLy8gZXZlbnRzIGZyb20gZmlyaW5nIG9uIHRvdWNoIGRldmljZXMuXG4gICAgaWYgKGV2ZW50LnRhcmdldCAmJiAoZXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5kcmFnZ2FibGUgJiYgZXZlbnQudHlwZSA9PT0gJ21vdXNlZG93bicpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuXG4gICAgLy8gQWJvcnQgaWYgdGhlIHVzZXIgaXMgYWxyZWFkeSBkcmFnZ2luZyBvciBpcyB1c2luZyBhIG1vdXNlIGJ1dHRvbiBvdGhlciB0aGFuIHRoZSBwcmltYXJ5IG9uZS5cbiAgICBpZiAoaXNEcmFnZ2luZyB8fCBpc0F1eGlsaWFyeU1vdXNlQnV0dG9uIHx8IGlzU3ludGhldGljRXZlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSd2ZSBnb3QgaGFuZGxlcywgd2UgbmVlZCB0byBkaXNhYmxlIHRoZSB0YXAgaGlnaGxpZ2h0IG9uIHRoZSBlbnRpcmUgcm9vdCBlbGVtZW50LFxuICAgIC8vIG90aGVyd2lzZSBpT1Mgd2lsbCBzdGlsbCBhZGQgaXQsIGV2ZW4gdGhvdWdoIGFsbCB0aGUgZHJhZyBpbnRlcmFjdGlvbnMgb24gdGhlIGhhbmRsZVxuICAgIC8vIGFyZSBkaXNhYmxlZC5cbiAgICBpZiAodGhpcy5faGFuZGxlcy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuX3Jvb3RFbGVtZW50VGFwSGlnaGxpZ2h0ID0gcm9vdEVsZW1lbnQuc3R5bGUud2Via2l0VGFwSGlnaGxpZ2h0Q29sb3IgfHwgJyc7XG4gICAgICByb290RWxlbWVudC5zdHlsZS53ZWJraXRUYXBIaWdobGlnaHRDb2xvciA9ICd0cmFuc3BhcmVudCc7XG4gICAgfVxuXG4gICAgdGhpcy5faGFzU3RhcnRlZERyYWdnaW5nID0gdGhpcy5faGFzTW92ZWQgPSBmYWxzZTtcblxuICAgIC8vIEF2b2lkIG11bHRpcGxlIHN1YnNjcmlwdGlvbnMgYW5kIG1lbW9yeSBsZWFrcyB3aGVuIG11bHRpIHRvdWNoXG4gICAgLy8gKGlzRHJhZ2dpbmcgY2hlY2sgYWJvdmUgaXNuJ3QgZW5vdWdoIGJlY2F1c2Ugb2YgcG9zc2libGUgdGVtcG9yYWwgYW5kL29yIGRpbWVuc2lvbmFsIGRlbGF5cylcbiAgICB0aGlzLl9yZW1vdmVTdWJzY3JpcHRpb25zKCk7XG4gICAgdGhpcy5fcG9pbnRlck1vdmVTdWJzY3JpcHRpb24gPSB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnBvaW50ZXJNb3ZlLnN1YnNjcmliZSh0aGlzLl9wb2ludGVyTW92ZSk7XG4gICAgdGhpcy5fcG9pbnRlclVwU3Vic2NyaXB0aW9uID0gdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5wb2ludGVyVXAuc3Vic2NyaWJlKHRoaXMuX3BvaW50ZXJVcCk7XG4gICAgdGhpcy5fc2Nyb2xsU3Vic2NyaXB0aW9uID0gdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5zY3JvbGwuc3Vic2NyaWJlKHNjcm9sbEV2ZW50ID0+IHtcbiAgICAgIHRoaXMuX3VwZGF0ZU9uU2Nyb2xsKHNjcm9sbEV2ZW50KTtcbiAgICB9KTtcblxuICAgIGlmICh0aGlzLl9ib3VuZGFyeUVsZW1lbnQpIHtcbiAgICAgIHRoaXMuX2JvdW5kYXJ5UmVjdCA9IGdldE11dGFibGVDbGllbnRSZWN0KHRoaXMuX2JvdW5kYXJ5RWxlbWVudCk7XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgaGF2ZSBhIGN1c3RvbSBwcmV2aWV3IHdlIGNhbid0IGtub3cgYWhlYWQgb2YgdGltZSBob3cgbGFyZ2UgaXQnbGwgYmUgc28gd2UgcG9zaXRpb25cbiAgICAvLyBpdCBuZXh0IHRvIHRoZSBjdXJzb3IuIFRoZSBleGNlcHRpb24gaXMgd2hlbiB0aGUgY29uc3VtZXIgaGFzIG9wdGVkIGludG8gbWFraW5nIHRoZSBwcmV2aWV3XG4gICAgLy8gdGhlIHNhbWUgc2l6ZSBhcyB0aGUgcm9vdCBlbGVtZW50LCBpbiB3aGljaCBjYXNlIHdlIGRvIGtub3cgdGhlIHNpemUuXG4gICAgY29uc3QgcHJldmlld1RlbXBsYXRlID0gdGhpcy5fcHJldmlld1RlbXBsYXRlO1xuICAgIHRoaXMuX3BpY2t1cFBvc2l0aW9uSW5FbGVtZW50ID0gcHJldmlld1RlbXBsYXRlICYmIHByZXZpZXdUZW1wbGF0ZS50ZW1wbGF0ZSAmJlxuICAgICAgIXByZXZpZXdUZW1wbGF0ZS5tYXRjaFNpemUgPyB7eDogMCwgeTogMH0gOlxuICAgICAgdGhpcy5fZ2V0UG9pbnRlclBvc2l0aW9uSW5FbGVtZW50KHJlZmVyZW5jZUVsZW1lbnQsIGV2ZW50KTtcbiAgICBjb25zdCBwb2ludGVyUG9zaXRpb24gPSB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZSA9IHRoaXMuX2dldFBvaW50ZXJQb3NpdGlvbk9uUGFnZShldmVudCk7XG4gICAgdGhpcy5fcG9pbnRlckRpcmVjdGlvbkRlbHRhID0ge3g6IDAsIHk6IDB9O1xuICAgIHRoaXMuX3BvaW50ZXJQb3NpdGlvbkF0TGFzdERpcmVjdGlvbkNoYW5nZSA9IHt4OiBwb2ludGVyUG9zaXRpb24ueCwgeTogcG9pbnRlclBvc2l0aW9uLnl9O1xuICAgIHRoaXMuX2RyYWdTdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuc3RhcnREcmFnZ2luZyh0aGlzLCBldmVudCk7XG4gIH1cblxuICAvKiogQ2xlYW5zIHVwIHRoZSBET00gYXJ0aWZhY3RzIHRoYXQgd2VyZSBhZGRlZCB0byBmYWNpbGl0YXRlIHRoZSBlbGVtZW50IGJlaW5nIGRyYWdnZWQuICovXG4gIHByaXZhdGUgX2NsZWFudXBEcmFnQXJ0aWZhY3RzKGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCkge1xuICAgIC8vIFJlc3RvcmUgdGhlIGVsZW1lbnQncyB2aXNpYmlsaXR5IGFuZCBpbnNlcnQgaXQgYXQgaXRzIG9sZCBwb3NpdGlvbiBpbiB0aGUgRE9NLlxuICAgIC8vIEl0J3MgaW1wb3J0YW50IHRoYXQgd2UgbWFpbnRhaW4gdGhlIHBvc2l0aW9uLCBiZWNhdXNlIG1vdmluZyB0aGUgZWxlbWVudCBhcm91bmQgaW4gdGhlIERPTVxuICAgIC8vIGNhbiB0aHJvdyBvZmYgYE5nRm9yYCB3aGljaCBkb2VzIHNtYXJ0IGRpZmZpbmcgYW5kIHJlLWNyZWF0ZXMgZWxlbWVudHMgb25seSB3aGVuIG5lY2Vzc2FyeSxcbiAgICAvLyB3aGlsZSBtb3ZpbmcgdGhlIGV4aXN0aW5nIGVsZW1lbnRzIGluIGFsbCBvdGhlciBjYXNlcy5cbiAgICB0aGlzLl9yb290RWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgdGhpcy5fYW5jaG9yLnBhcmVudE5vZGUhLnJlcGxhY2VDaGlsZCh0aGlzLl9yb290RWxlbWVudCwgdGhpcy5fYW5jaG9yKTtcblxuICAgIHRoaXMuX2Rlc3Ryb3lQcmV2aWV3KCk7XG4gICAgdGhpcy5fZGVzdHJveVBsYWNlaG9sZGVyKCk7XG4gICAgdGhpcy5fYm91bmRhcnlSZWN0ID0gdGhpcy5fcHJldmlld1JlY3QgPSB1bmRlZmluZWQ7XG5cbiAgICAvLyBSZS1lbnRlciB0aGUgTmdab25lIHNpbmNlIHdlIGJvdW5kIGBkb2N1bWVudGAgZXZlbnRzIG9uIHRoZSBvdXRzaWRlLlxuICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5fZHJvcENvbnRhaW5lciE7XG4gICAgICBjb25zdCBjdXJyZW50SW5kZXggPSBjb250YWluZXIuZ2V0SXRlbUluZGV4KHRoaXMpO1xuICAgICAgY29uc3QgcG9pbnRlclBvc2l0aW9uID0gdGhpcy5fZ2V0UG9pbnRlclBvc2l0aW9uT25QYWdlKGV2ZW50KTtcbiAgICAgIGNvbnN0IGRpc3RhbmNlID0gdGhpcy5fZ2V0RHJhZ0Rpc3RhbmNlKHRoaXMuX2dldFBvaW50ZXJQb3NpdGlvbk9uUGFnZShldmVudCkpO1xuICAgICAgY29uc3QgaXNQb2ludGVyT3ZlckNvbnRhaW5lciA9IGNvbnRhaW5lci5faXNPdmVyQ29udGFpbmVyKFxuICAgICAgICBwb2ludGVyUG9zaXRpb24ueCwgcG9pbnRlclBvc2l0aW9uLnkpO1xuXG4gICAgICB0aGlzLmVuZGVkLm5leHQoe3NvdXJjZTogdGhpcywgZGlzdGFuY2V9KTtcbiAgICAgIHRoaXMuZHJvcHBlZC5uZXh0KHtcbiAgICAgICAgaXRlbTogdGhpcyxcbiAgICAgICAgY3VycmVudEluZGV4LFxuICAgICAgICBwcmV2aW91c0luZGV4OiB0aGlzLl9pbml0aWFsSW5kZXgsXG4gICAgICAgIGNvbnRhaW5lcjogY29udGFpbmVyLFxuICAgICAgICBwcmV2aW91c0NvbnRhaW5lcjogdGhpcy5faW5pdGlhbENvbnRhaW5lcixcbiAgICAgICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcixcbiAgICAgICAgZGlzdGFuY2VcbiAgICAgIH0pO1xuICAgICAgY29udGFpbmVyLmRyb3AodGhpcywgY3VycmVudEluZGV4LCB0aGlzLl9pbml0aWFsQ29udGFpbmVyLCBpc1BvaW50ZXJPdmVyQ29udGFpbmVyLCBkaXN0YW5jZSxcbiAgICAgICAgICB0aGlzLl9pbml0aWFsSW5kZXgpO1xuICAgICAgdGhpcy5fZHJvcENvbnRhaW5lciA9IHRoaXMuX2luaXRpYWxDb250YWluZXI7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgaXRlbSdzIHBvc2l0aW9uIGluIGl0cyBkcm9wIGNvbnRhaW5lciwgb3IgbW92ZXMgaXRcbiAgICogaW50byBhIG5ldyBvbmUsIGRlcGVuZGluZyBvbiBpdHMgY3VycmVudCBkcmFnIHBvc2l0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBfdXBkYXRlQWN0aXZlRHJvcENvbnRhaW5lcih7eCwgeX06IFBvaW50KSB7XG4gICAgLy8gRHJvcCBjb250YWluZXIgdGhhdCBkcmFnZ2FibGUgaGFzIGJlZW4gbW92ZWQgaW50by5cbiAgICBsZXQgbmV3Q29udGFpbmVyID0gdGhpcy5faW5pdGlhbENvbnRhaW5lci5fZ2V0U2libGluZ0NvbnRhaW5lckZyb21Qb3NpdGlvbih0aGlzLCB4LCB5KTtcblxuICAgIC8vIElmIHdlIGNvdWxkbid0IGZpbmQgYSBuZXcgY29udGFpbmVyIHRvIG1vdmUgdGhlIGl0ZW0gaW50bywgYW5kIHRoZSBpdGVtIGhhcyBsZWZ0IGl0c1xuICAgIC8vIGluaXRpYWwgY29udGFpbmVyLCBjaGVjayB3aGV0aGVyIHRoZSBpdCdzIG92ZXIgdGhlIGluaXRpYWwgY29udGFpbmVyLiBUaGlzIGhhbmRsZXMgdGhlXG4gICAgLy8gY2FzZSB3aGVyZSB0d28gY29udGFpbmVycyBhcmUgY29ubmVjdGVkIG9uZSB3YXkgYW5kIHRoZSB1c2VyIHRyaWVzIHRvIHVuZG8gZHJhZ2dpbmcgYW5cbiAgICAvLyBpdGVtIGludG8gYSBuZXcgY29udGFpbmVyLlxuICAgIGlmICghbmV3Q29udGFpbmVyICYmIHRoaXMuX2Ryb3BDb250YWluZXIgIT09IHRoaXMuX2luaXRpYWxDb250YWluZXIgJiZcbiAgICAgICAgdGhpcy5faW5pdGlhbENvbnRhaW5lci5faXNPdmVyQ29udGFpbmVyKHgsIHkpKSB7XG4gICAgICBuZXdDb250YWluZXIgPSB0aGlzLl9pbml0aWFsQ29udGFpbmVyO1xuICAgIH1cblxuICAgIGlmIChuZXdDb250YWluZXIgJiYgbmV3Q29udGFpbmVyICE9PSB0aGlzLl9kcm9wQ29udGFpbmVyKSB7XG4gICAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgLy8gTm90aWZ5IHRoZSBvbGQgY29udGFpbmVyIHRoYXQgdGhlIGl0ZW0gaGFzIGxlZnQuXG4gICAgICAgIHRoaXMuZXhpdGVkLm5leHQoe2l0ZW06IHRoaXMsIGNvbnRhaW5lcjogdGhpcy5fZHJvcENvbnRhaW5lciF9KTtcbiAgICAgICAgdGhpcy5fZHJvcENvbnRhaW5lciEuZXhpdCh0aGlzKTtcbiAgICAgICAgLy8gTm90aWZ5IHRoZSBuZXcgY29udGFpbmVyIHRoYXQgdGhlIGl0ZW0gaGFzIGVudGVyZWQuXG4gICAgICAgIHRoaXMuX2Ryb3BDb250YWluZXIgPSBuZXdDb250YWluZXIhO1xuICAgICAgICB0aGlzLl9kcm9wQ29udGFpbmVyLmVudGVyKHRoaXMsIHgsIHksIG5ld0NvbnRhaW5lciA9PT0gdGhpcy5faW5pdGlhbENvbnRhaW5lciAmJlxuICAgICAgICAgICAgLy8gSWYgd2UncmUgcmUtZW50ZXJpbmcgdGhlIGluaXRpYWwgY29udGFpbmVyIGFuZCBzb3J0aW5nIGlzIGRpc2FibGVkLFxuICAgICAgICAgICAgLy8gcHV0IGl0ZW0gdGhlIGludG8gaXRzIHN0YXJ0aW5nIGluZGV4IHRvIGJlZ2luIHdpdGguXG4gICAgICAgICAgICBuZXdDb250YWluZXIuc29ydGluZ0Rpc2FibGVkID8gdGhpcy5faW5pdGlhbEluZGV4IDogdW5kZWZpbmVkKTtcbiAgICAgICAgdGhpcy5lbnRlcmVkLm5leHQoe1xuICAgICAgICAgIGl0ZW06IHRoaXMsXG4gICAgICAgICAgY29udGFpbmVyOiBuZXdDb250YWluZXIhLFxuICAgICAgICAgIGN1cnJlbnRJbmRleDogbmV3Q29udGFpbmVyIS5nZXRJdGVtSW5kZXgodGhpcylcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLl9kcm9wQ29udGFpbmVyIS5fc3RhcnRTY3JvbGxpbmdJZk5lY2Vzc2FyeSh4LCB5KTtcbiAgICB0aGlzLl9kcm9wQ29udGFpbmVyIS5fc29ydEl0ZW0odGhpcywgeCwgeSwgdGhpcy5fcG9pbnRlckRpcmVjdGlvbkRlbHRhKTtcbiAgICB0aGlzLl9wcmV2aWV3LnN0eWxlLnRyYW5zZm9ybSA9XG4gICAgICAgIGdldFRyYW5zZm9ybSh4IC0gdGhpcy5fcGlja3VwUG9zaXRpb25JbkVsZW1lbnQueCwgeSAtIHRoaXMuX3BpY2t1cFBvc2l0aW9uSW5FbGVtZW50LnkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgdGhlIGVsZW1lbnQgdGhhdCB3aWxsIGJlIHJlbmRlcmVkIG5leHQgdG8gdGhlIHVzZXIncyBwb2ludGVyXG4gICAqIGFuZCB3aWxsIGJlIHVzZWQgYXMgYSBwcmV2aWV3IG9mIHRoZSBlbGVtZW50IHRoYXQgaXMgYmVpbmcgZHJhZ2dlZC5cbiAgICovXG4gIHByaXZhdGUgX2NyZWF0ZVByZXZpZXdFbGVtZW50KCk6IEhUTUxFbGVtZW50IHtcbiAgICBjb25zdCBwcmV2aWV3Q29uZmlnID0gdGhpcy5fcHJldmlld1RlbXBsYXRlO1xuICAgIGNvbnN0IHByZXZpZXdDbGFzcyA9IHRoaXMucHJldmlld0NsYXNzO1xuICAgIGNvbnN0IHByZXZpZXdUZW1wbGF0ZSA9IHByZXZpZXdDb25maWcgPyBwcmV2aWV3Q29uZmlnLnRlbXBsYXRlIDogbnVsbDtcbiAgICBsZXQgcHJldmlldzogSFRNTEVsZW1lbnQ7XG5cbiAgICBpZiAocHJldmlld1RlbXBsYXRlICYmIHByZXZpZXdDb25maWcpIHtcbiAgICAgIC8vIE1lYXN1cmUgdGhlIGVsZW1lbnQgYmVmb3JlIHdlJ3ZlIGluc2VydGVkIHRoZSBwcmV2aWV3XG4gICAgICAvLyBzaW5jZSB0aGUgaW5zZXJ0aW9uIGNvdWxkIHRocm93IG9mZiB0aGUgbWVhc3VyZW1lbnQuXG4gICAgICBjb25zdCByb290UmVjdCA9IHByZXZpZXdDb25maWcubWF0Y2hTaXplID8gdGhpcy5fcm9vdEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkgOiBudWxsO1xuICAgICAgY29uc3Qgdmlld1JlZiA9IHByZXZpZXdDb25maWcudmlld0NvbnRhaW5lci5jcmVhdGVFbWJlZGRlZFZpZXcocHJldmlld1RlbXBsYXRlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlld0NvbmZpZy5jb250ZXh0KTtcbiAgICAgIHZpZXdSZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgcHJldmlldyA9IGdldFJvb3ROb2RlKHZpZXdSZWYsIHRoaXMuX2RvY3VtZW50KTtcbiAgICAgIHRoaXMuX3ByZXZpZXdSZWYgPSB2aWV3UmVmO1xuICAgICAgaWYgKHByZXZpZXdDb25maWcubWF0Y2hTaXplKSB7XG4gICAgICAgIG1hdGNoRWxlbWVudFNpemUocHJldmlldywgcm9vdFJlY3QhKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHByZXZpZXcuc3R5bGUudHJhbnNmb3JtID1cbiAgICAgICAgICAgIGdldFRyYW5zZm9ybSh0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZS54LCB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZS55KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX3Jvb3RFbGVtZW50O1xuICAgICAgcHJldmlldyA9IGRlZXBDbG9uZU5vZGUoZWxlbWVudCk7XG4gICAgICBtYXRjaEVsZW1lbnRTaXplKHByZXZpZXcsIGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkpO1xuICAgIH1cblxuICAgIGV4dGVuZFN0eWxlcyhwcmV2aWV3LnN0eWxlLCB7XG4gICAgICAvLyBJdCdzIGltcG9ydGFudCB0aGF0IHdlIGRpc2FibGUgdGhlIHBvaW50ZXIgZXZlbnRzIG9uIHRoZSBwcmV2aWV3LCBiZWNhdXNlXG4gICAgICAvLyBpdCBjYW4gdGhyb3cgb2ZmIHRoZSBgZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludGAgY2FsbHMgaW4gdGhlIGBDZGtEcm9wTGlzdGAuXG4gICAgICBwb2ludGVyRXZlbnRzOiAnbm9uZScsXG4gICAgICAvLyBXZSBoYXZlIHRvIHJlc2V0IHRoZSBtYXJnaW4sIGJlY2F1c2UgaXQgY2FuIHRocm93IG9mZiBwb3NpdGlvbmluZyByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQuXG4gICAgICBtYXJnaW46ICcwJyxcbiAgICAgIHBvc2l0aW9uOiAnZml4ZWQnLFxuICAgICAgdG9wOiAnMCcsXG4gICAgICBsZWZ0OiAnMCcsXG4gICAgICB6SW5kZXg6IGAke3RoaXMuX2NvbmZpZy56SW5kZXggfHwgMTAwMH1gXG4gICAgfSk7XG5cbiAgICB0b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKHByZXZpZXcsIGZhbHNlKTtcbiAgICBwcmV2aWV3LmNsYXNzTGlzdC5hZGQoJ2Nkay1kcmFnLXByZXZpZXcnKTtcbiAgICBwcmV2aWV3LnNldEF0dHJpYnV0ZSgnZGlyJywgdGhpcy5fZGlyZWN0aW9uKTtcblxuICAgIGlmIChwcmV2aWV3Q2xhc3MpIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHByZXZpZXdDbGFzcykpIHtcbiAgICAgICAgcHJldmlld0NsYXNzLmZvckVhY2goY2xhc3NOYW1lID0+IHByZXZpZXcuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHByZXZpZXcuY2xhc3NMaXN0LmFkZChwcmV2aWV3Q2xhc3MpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwcmV2aWV3O1xuICB9XG5cbiAgLyoqXG4gICAqIEFuaW1hdGVzIHRoZSBwcmV2aWV3IGVsZW1lbnQgZnJvbSBpdHMgY3VycmVudCBwb3NpdGlvbiB0byB0aGUgbG9jYXRpb24gb2YgdGhlIGRyb3AgcGxhY2Vob2xkZXIuXG4gICAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBhbmltYXRpb24gY29tcGxldGVzLlxuICAgKi9cbiAgcHJpdmF0ZSBfYW5pbWF0ZVByZXZpZXdUb1BsYWNlaG9sZGVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIElmIHRoZSB1c2VyIGhhc24ndCBtb3ZlZCB5ZXQsIHRoZSB0cmFuc2l0aW9uZW5kIGV2ZW50IHdvbid0IGZpcmUuXG4gICAgaWYgKCF0aGlzLl9oYXNNb3ZlZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cblxuICAgIGNvbnN0IHBsYWNlaG9sZGVyUmVjdCA9IHRoaXMuX3BsYWNlaG9sZGVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgLy8gQXBwbHkgdGhlIGNsYXNzIHRoYXQgYWRkcyBhIHRyYW5zaXRpb24gdG8gdGhlIHByZXZpZXcuXG4gICAgdGhpcy5fcHJldmlldy5jbGFzc0xpc3QuYWRkKCdjZGstZHJhZy1hbmltYXRpbmcnKTtcblxuICAgIC8vIE1vdmUgdGhlIHByZXZpZXcgdG8gdGhlIHBsYWNlaG9sZGVyIHBvc2l0aW9uLlxuICAgIHRoaXMuX3ByZXZpZXcuc3R5bGUudHJhbnNmb3JtID0gZ2V0VHJhbnNmb3JtKHBsYWNlaG9sZGVyUmVjdC5sZWZ0LCBwbGFjZWhvbGRlclJlY3QudG9wKTtcblxuICAgIC8vIElmIHRoZSBlbGVtZW50IGRvZXNuJ3QgaGF2ZSBhIGB0cmFuc2l0aW9uYCwgdGhlIGB0cmFuc2l0aW9uZW5kYCBldmVudCB3b24ndCBmaXJlLiBTaW5jZVxuICAgIC8vIHdlIG5lZWQgdG8gdHJpZ2dlciBhIHN0eWxlIHJlY2FsY3VsYXRpb24gaW4gb3JkZXIgZm9yIHRoZSBgY2RrLWRyYWctYW5pbWF0aW5nYCBjbGFzcyB0b1xuICAgIC8vIGFwcGx5IGl0cyBzdHlsZSwgd2UgdGFrZSBhZHZhbnRhZ2Ugb2YgdGhlIGF2YWlsYWJsZSBpbmZvIHRvIGZpZ3VyZSBvdXQgd2hldGhlciB3ZSBuZWVkIHRvXG4gICAgLy8gYmluZCB0aGUgZXZlbnQgaW4gdGhlIGZpcnN0IHBsYWNlLlxuICAgIGNvbnN0IGR1cmF0aW9uID0gZ2V0VHJhbnNmb3JtVHJhbnNpdGlvbkR1cmF0aW9uSW5Ncyh0aGlzLl9wcmV2aWV3KTtcblxuICAgIGlmIChkdXJhdGlvbiA9PT0gMCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICBjb25zdCBoYW5kbGVyID0gKChldmVudDogVHJhbnNpdGlvbkV2ZW50KSA9PiB7XG4gICAgICAgICAgaWYgKCFldmVudCB8fCAoZXZlbnQudGFyZ2V0ID09PSB0aGlzLl9wcmV2aWV3ICYmIGV2ZW50LnByb3BlcnR5TmFtZSA9PT0gJ3RyYW5zZm9ybScpKSB7XG4gICAgICAgICAgICB0aGlzLl9wcmV2aWV3LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBoYW5kbGVyKTtcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pIGFzIEV2ZW50TGlzdGVuZXJPckV2ZW50TGlzdGVuZXJPYmplY3Q7XG5cbiAgICAgICAgLy8gSWYgYSB0cmFuc2l0aW9uIGlzIHNob3J0IGVub3VnaCwgdGhlIGJyb3dzZXIgbWlnaHQgbm90IGZpcmUgdGhlIGB0cmFuc2l0aW9uZW5kYCBldmVudC5cbiAgICAgICAgLy8gU2luY2Ugd2Uga25vdyBob3cgbG9uZyBpdCdzIHN1cHBvc2VkIHRvIHRha2UsIGFkZCBhIHRpbWVvdXQgd2l0aCBhIDUwJSBidWZmZXIgdGhhdCdsbFxuICAgICAgICAvLyBmaXJlIGlmIHRoZSB0cmFuc2l0aW9uIGhhc24ndCBjb21wbGV0ZWQgd2hlbiBpdCB3YXMgc3VwcG9zZWQgdG8uXG4gICAgICAgIGNvbnN0IHRpbWVvdXQgPSBzZXRUaW1lb3V0KGhhbmRsZXIgYXMgRnVuY3Rpb24sIGR1cmF0aW9uICogMS41KTtcbiAgICAgICAgdGhpcy5fcHJldmlldy5hZGRFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgaGFuZGxlcik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGFuIGVsZW1lbnQgdGhhdCB3aWxsIGJlIHNob3duIGluc3RlYWQgb2YgdGhlIGN1cnJlbnQgZWxlbWVudCB3aGlsZSBkcmFnZ2luZy4gKi9cbiAgcHJpdmF0ZSBfY3JlYXRlUGxhY2Vob2xkZXJFbGVtZW50KCk6IEhUTUxFbGVtZW50IHtcbiAgICBjb25zdCBwbGFjZWhvbGRlckNvbmZpZyA9IHRoaXMuX3BsYWNlaG9sZGVyVGVtcGxhdGU7XG4gICAgY29uc3QgcGxhY2Vob2xkZXJUZW1wbGF0ZSA9IHBsYWNlaG9sZGVyQ29uZmlnID8gcGxhY2Vob2xkZXJDb25maWcudGVtcGxhdGUgOiBudWxsO1xuICAgIGxldCBwbGFjZWhvbGRlcjogSFRNTEVsZW1lbnQ7XG5cbiAgICBpZiAocGxhY2Vob2xkZXJUZW1wbGF0ZSkge1xuICAgICAgdGhpcy5fcGxhY2Vob2xkZXJSZWYgPSBwbGFjZWhvbGRlckNvbmZpZyEudmlld0NvbnRhaW5lci5jcmVhdGVFbWJlZGRlZFZpZXcoXG4gICAgICAgIHBsYWNlaG9sZGVyVGVtcGxhdGUsXG4gICAgICAgIHBsYWNlaG9sZGVyQ29uZmlnIS5jb250ZXh0XG4gICAgICApO1xuICAgICAgdGhpcy5fcGxhY2Vob2xkZXJSZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgcGxhY2Vob2xkZXIgPSBnZXRSb290Tm9kZSh0aGlzLl9wbGFjZWhvbGRlclJlZiwgdGhpcy5fZG9jdW1lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwbGFjZWhvbGRlciA9IGRlZXBDbG9uZU5vZGUodGhpcy5fcm9vdEVsZW1lbnQpO1xuICAgIH1cblxuICAgIHBsYWNlaG9sZGVyLmNsYXNzTGlzdC5hZGQoJ2Nkay1kcmFnLXBsYWNlaG9sZGVyJyk7XG4gICAgcmV0dXJuIHBsYWNlaG9sZGVyO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpZ3VyZXMgb3V0IHRoZSBjb29yZGluYXRlcyBhdCB3aGljaCBhbiBlbGVtZW50IHdhcyBwaWNrZWQgdXAuXG4gICAqIEBwYXJhbSByZWZlcmVuY2VFbGVtZW50IEVsZW1lbnQgdGhhdCBpbml0aWF0ZWQgdGhlIGRyYWdnaW5nLlxuICAgKiBAcGFyYW0gZXZlbnQgRXZlbnQgdGhhdCBpbml0aWF0ZWQgdGhlIGRyYWdnaW5nLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0UG9pbnRlclBvc2l0aW9uSW5FbGVtZW50KHJlZmVyZW5jZUVsZW1lbnQ6IEhUTUxFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KTogUG9pbnQge1xuICAgIGNvbnN0IGVsZW1lbnRSZWN0ID0gdGhpcy5fcm9vdEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgY29uc3QgaGFuZGxlRWxlbWVudCA9IHJlZmVyZW5jZUVsZW1lbnQgPT09IHRoaXMuX3Jvb3RFbGVtZW50ID8gbnVsbCA6IHJlZmVyZW5jZUVsZW1lbnQ7XG4gICAgY29uc3QgcmVmZXJlbmNlUmVjdCA9IGhhbmRsZUVsZW1lbnQgPyBoYW5kbGVFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpIDogZWxlbWVudFJlY3Q7XG4gICAgY29uc3QgcG9pbnQgPSBpc1RvdWNoRXZlbnQoZXZlbnQpID8gZXZlbnQudGFyZ2V0VG91Y2hlc1swXSA6IGV2ZW50O1xuICAgIGNvbnN0IHNjcm9sbFBvc2l0aW9uID0gdGhpcy5fZ2V0Vmlld3BvcnRTY3JvbGxQb3NpdGlvbigpO1xuICAgIGNvbnN0IHggPSBwb2ludC5wYWdlWCAtIHJlZmVyZW5jZVJlY3QubGVmdCAtIHNjcm9sbFBvc2l0aW9uLmxlZnQ7XG4gICAgY29uc3QgeSA9IHBvaW50LnBhZ2VZIC0gcmVmZXJlbmNlUmVjdC50b3AgLSBzY3JvbGxQb3NpdGlvbi50b3A7XG5cbiAgICByZXR1cm4ge1xuICAgICAgeDogcmVmZXJlbmNlUmVjdC5sZWZ0IC0gZWxlbWVudFJlY3QubGVmdCArIHgsXG4gICAgICB5OiByZWZlcmVuY2VSZWN0LnRvcCAtIGVsZW1lbnRSZWN0LnRvcCArIHlcbiAgICB9O1xuICB9XG5cbiAgLyoqIERldGVybWluZXMgdGhlIHBvaW50IG9mIHRoZSBwYWdlIHRoYXQgd2FzIHRvdWNoZWQgYnkgdGhlIHVzZXIuICovXG4gIHByaXZhdGUgX2dldFBvaW50ZXJQb3NpdGlvbk9uUGFnZShldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpOiBQb2ludCB7XG4gICAgY29uc3Qgc2Nyb2xsUG9zaXRpb24gPSB0aGlzLl9nZXRWaWV3cG9ydFNjcm9sbFBvc2l0aW9uKCk7XG4gICAgY29uc3QgcG9pbnQgPSBpc1RvdWNoRXZlbnQoZXZlbnQpID9cbiAgICAgICAgLy8gYHRvdWNoZXNgIHdpbGwgYmUgZW1wdHkgZm9yIHN0YXJ0L2VuZCBldmVudHMgc28gd2UgaGF2ZSB0byBmYWxsIGJhY2sgdG8gYGNoYW5nZWRUb3VjaGVzYC5cbiAgICAgICAgLy8gQWxzbyBub3RlIHRoYXQgb24gcmVhbCBkZXZpY2VzIHdlJ3JlIGd1YXJhbnRlZWQgZm9yIGVpdGhlciBgdG91Y2hlc2Agb3IgYGNoYW5nZWRUb3VjaGVzYFxuICAgICAgICAvLyB0byBoYXZlIGEgdmFsdWUsIGJ1dCBGaXJlZm94IGluIGRldmljZSBlbXVsYXRpb24gbW9kZSBoYXMgYSBidWcgd2hlcmUgYm90aCBjYW4gYmUgZW1wdHlcbiAgICAgICAgLy8gZm9yIGB0b3VjaHN0YXJ0YCBhbmQgYHRvdWNoZW5kYCBzbyB3ZSBmYWxsIGJhY2sgdG8gYSBkdW1teSBvYmplY3QgaW4gb3JkZXIgdG8gYXZvaWRcbiAgICAgICAgLy8gdGhyb3dpbmcgYW4gZXJyb3IuIFRoZSB2YWx1ZSByZXR1cm5lZCBoZXJlIHdpbGwgYmUgaW5jb3JyZWN0LCBidXQgc2luY2UgdGhpcyBvbmx5XG4gICAgICAgIC8vIGJyZWFrcyBpbnNpZGUgYSBkZXZlbG9wZXIgdG9vbCBhbmQgdGhlIHZhbHVlIGlzIG9ubHkgdXNlZCBmb3Igc2Vjb25kYXJ5IGluZm9ybWF0aW9uLFxuICAgICAgICAvLyB3ZSBjYW4gZ2V0IGF3YXkgd2l0aCBpdC4gU2VlIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTE2MTU4MjQuXG4gICAgICAgIChldmVudC50b3VjaGVzWzBdIHx8IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdIHx8IHtwYWdlWDogMCwgcGFnZVk6IDB9KSA6IGV2ZW50O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IHBvaW50LnBhZ2VYIC0gc2Nyb2xsUG9zaXRpb24ubGVmdCxcbiAgICAgIHk6IHBvaW50LnBhZ2VZIC0gc2Nyb2xsUG9zaXRpb24udG9wXG4gICAgfTtcbiAgfVxuXG5cbiAgLyoqIEdldHMgdGhlIHBvaW50ZXIgcG9zaXRpb24gb24gdGhlIHBhZ2UsIGFjY291bnRpbmcgZm9yIGFueSBwb3NpdGlvbiBjb25zdHJhaW50cy4gKi9cbiAgcHJpdmF0ZSBfZ2V0Q29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24ocG9pbnQ6IFBvaW50KTogUG9pbnQge1xuICAgIGNvbnN0IGNvbnN0cmFpbmVkUG9pbnQgPSB0aGlzLmNvbnN0cmFpblBvc2l0aW9uID8gdGhpcy5jb25zdHJhaW5Qb3NpdGlvbihwb2ludCwgdGhpcykgOiBwb2ludDtcbiAgICBjb25zdCBkcm9wQ29udGFpbmVyTG9jayA9IHRoaXMuX2Ryb3BDb250YWluZXIgPyB0aGlzLl9kcm9wQ29udGFpbmVyLmxvY2tBeGlzIDogbnVsbDtcblxuICAgIGlmICh0aGlzLmxvY2tBeGlzID09PSAneCcgfHwgZHJvcENvbnRhaW5lckxvY2sgPT09ICd4Jykge1xuICAgICAgY29uc3RyYWluZWRQb2ludC55ID0gdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UueTtcbiAgICB9IGVsc2UgaWYgKHRoaXMubG9ja0F4aXMgPT09ICd5JyB8fCBkcm9wQ29udGFpbmVyTG9jayA9PT0gJ3knKSB7XG4gICAgICBjb25zdHJhaW5lZFBvaW50LnggPSB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZS54O1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ib3VuZGFyeVJlY3QpIHtcbiAgICAgIGNvbnN0IHt4OiBwaWNrdXBYLCB5OiBwaWNrdXBZfSA9IHRoaXMuX3BpY2t1cFBvc2l0aW9uSW5FbGVtZW50O1xuICAgICAgY29uc3QgYm91bmRhcnlSZWN0ID0gdGhpcy5fYm91bmRhcnlSZWN0O1xuICAgICAgY29uc3QgcHJldmlld1JlY3QgPSB0aGlzLl9wcmV2aWV3UmVjdCE7XG4gICAgICBjb25zdCBtaW5ZID0gYm91bmRhcnlSZWN0LnRvcCArIHBpY2t1cFk7XG4gICAgICBjb25zdCBtYXhZID0gYm91bmRhcnlSZWN0LmJvdHRvbSAtIChwcmV2aWV3UmVjdC5oZWlnaHQgLSBwaWNrdXBZKTtcbiAgICAgIGNvbnN0IG1pblggPSBib3VuZGFyeVJlY3QubGVmdCArIHBpY2t1cFg7XG4gICAgICBjb25zdCBtYXhYID0gYm91bmRhcnlSZWN0LnJpZ2h0IC0gKHByZXZpZXdSZWN0LndpZHRoIC0gcGlja3VwWCk7XG5cbiAgICAgIGNvbnN0cmFpbmVkUG9pbnQueCA9IGNsYW1wKGNvbnN0cmFpbmVkUG9pbnQueCwgbWluWCwgbWF4WCk7XG4gICAgICBjb25zdHJhaW5lZFBvaW50LnkgPSBjbGFtcChjb25zdHJhaW5lZFBvaW50LnksIG1pblksIG1heFkpO1xuICAgIH1cblxuICAgIHJldHVybiBjb25zdHJhaW5lZFBvaW50O1xuICB9XG5cblxuICAvKiogVXBkYXRlcyB0aGUgY3VycmVudCBkcmFnIGRlbHRhLCBiYXNlZCBvbiB0aGUgdXNlcidzIGN1cnJlbnQgcG9pbnRlciBwb3NpdGlvbiBvbiB0aGUgcGFnZS4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlUG9pbnRlckRpcmVjdGlvbkRlbHRhKHBvaW50ZXJQb3NpdGlvbk9uUGFnZTogUG9pbnQpIHtcbiAgICBjb25zdCB7eCwgeX0gPSBwb2ludGVyUG9zaXRpb25PblBhZ2U7XG4gICAgY29uc3QgZGVsdGEgPSB0aGlzLl9wb2ludGVyRGlyZWN0aW9uRGVsdGE7XG4gICAgY29uc3QgcG9zaXRpb25TaW5jZUxhc3RDaGFuZ2UgPSB0aGlzLl9wb2ludGVyUG9zaXRpb25BdExhc3REaXJlY3Rpb25DaGFuZ2U7XG5cbiAgICAvLyBBbW91bnQgb2YgcGl4ZWxzIHRoZSB1c2VyIGhhcyBkcmFnZ2VkIHNpbmNlIHRoZSBsYXN0IHRpbWUgdGhlIGRpcmVjdGlvbiBjaGFuZ2VkLlxuICAgIGNvbnN0IGNoYW5nZVggPSBNYXRoLmFicyh4IC0gcG9zaXRpb25TaW5jZUxhc3RDaGFuZ2UueCk7XG4gICAgY29uc3QgY2hhbmdlWSA9IE1hdGguYWJzKHkgLSBwb3NpdGlvblNpbmNlTGFzdENoYW5nZS55KTtcblxuICAgIC8vIEJlY2F1c2Ugd2UgaGFuZGxlIHBvaW50ZXIgZXZlbnRzIG9uIGEgcGVyLXBpeGVsIGJhc2lzLCB3ZSBkb24ndCB3YW50IHRoZSBkZWx0YVxuICAgIC8vIHRvIGNoYW5nZSBmb3IgZXZlcnkgcGl4ZWwsIG90aGVyd2lzZSBhbnl0aGluZyB0aGF0IGRlcGVuZHMgb24gaXQgY2FuIGxvb2sgZXJyYXRpYy5cbiAgICAvLyBUbyBtYWtlIHRoZSBkZWx0YSBtb3JlIGNvbnNpc3RlbnQsIHdlIHRyYWNrIGhvdyBtdWNoIHRoZSB1c2VyIGhhcyBtb3ZlZCBzaW5jZSB0aGUgbGFzdFxuICAgIC8vIGRlbHRhIGNoYW5nZSBhbmQgd2Ugb25seSB1cGRhdGUgaXQgYWZ0ZXIgaXQgaGFzIHJlYWNoZWQgYSBjZXJ0YWluIHRocmVzaG9sZC5cbiAgICBpZiAoY2hhbmdlWCA+IHRoaXMuX2NvbmZpZy5wb2ludGVyRGlyZWN0aW9uQ2hhbmdlVGhyZXNob2xkKSB7XG4gICAgICBkZWx0YS54ID0geCA+IHBvc2l0aW9uU2luY2VMYXN0Q2hhbmdlLnggPyAxIDogLTE7XG4gICAgICBwb3NpdGlvblNpbmNlTGFzdENoYW5nZS54ID0geDtcbiAgICB9XG5cbiAgICBpZiAoY2hhbmdlWSA+IHRoaXMuX2NvbmZpZy5wb2ludGVyRGlyZWN0aW9uQ2hhbmdlVGhyZXNob2xkKSB7XG4gICAgICBkZWx0YS55ID0geSA+IHBvc2l0aW9uU2luY2VMYXN0Q2hhbmdlLnkgPyAxIDogLTE7XG4gICAgICBwb3NpdGlvblNpbmNlTGFzdENoYW5nZS55ID0geTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGVsdGE7XG4gIH1cblxuICAvKiogVG9nZ2xlcyB0aGUgbmF0aXZlIGRyYWcgaW50ZXJhY3Rpb25zLCBiYXNlZCBvbiBob3cgbWFueSBoYW5kbGVzIGFyZSByZWdpc3RlcmVkLiAqL1xuICBwcml2YXRlIF90b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKCkge1xuICAgIGlmICghdGhpcy5fcm9vdEVsZW1lbnQgfHwgIXRoaXMuX2hhbmRsZXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzaG91bGRFbmFibGUgPSB0aGlzLl9oYW5kbGVzLmxlbmd0aCA+IDAgfHwgIXRoaXMuaXNEcmFnZ2luZygpO1xuXG4gICAgaWYgKHNob3VsZEVuYWJsZSAhPT0gdGhpcy5fbmF0aXZlSW50ZXJhY3Rpb25zRW5hYmxlZCkge1xuICAgICAgdGhpcy5fbmF0aXZlSW50ZXJhY3Rpb25zRW5hYmxlZCA9IHNob3VsZEVuYWJsZTtcbiAgICAgIHRvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnModGhpcy5fcm9vdEVsZW1lbnQsIHNob3VsZEVuYWJsZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFJlbW92ZXMgdGhlIG1hbnVhbGx5LWFkZGVkIGV2ZW50IGxpc3RlbmVycyBmcm9tIHRoZSByb290IGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3JlbW92ZVJvb3RFbGVtZW50TGlzdGVuZXJzKGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9wb2ludGVyRG93biwgYWN0aXZlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuX3BvaW50ZXJEb3duLCBwYXNzaXZlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgYSBgdHJhbnNmb3JtYCB0byB0aGUgcm9vdCBlbGVtZW50LCB0YWtpbmcgaW50byBhY2NvdW50IGFueSBleGlzdGluZyB0cmFuc2Zvcm1zIG9uIGl0LlxuICAgKiBAcGFyYW0geCBOZXcgdHJhbnNmb3JtIHZhbHVlIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSB5IE5ldyB0cmFuc2Zvcm0gdmFsdWUgYWxvbmcgdGhlIFkgYXhpcy5cbiAgICovXG4gIHByaXZhdGUgX2FwcGx5Um9vdEVsZW1lbnRUcmFuc2Zvcm0oeDogbnVtYmVyLCB5OiBudW1iZXIpIHtcbiAgICBjb25zdCB0cmFuc2Zvcm0gPSBnZXRUcmFuc2Zvcm0oeCwgeSk7XG5cbiAgICAvLyBDYWNoZSB0aGUgcHJldmlvdXMgdHJhbnNmb3JtIGFtb3VudCBvbmx5IGFmdGVyIHRoZSBmaXJzdCBkcmFnIHNlcXVlbmNlLCBiZWNhdXNlXG4gICAgLy8gd2UgZG9uJ3Qgd2FudCBvdXIgb3duIHRyYW5zZm9ybXMgdG8gc3RhY2sgb24gdG9wIG9mIGVhY2ggb3RoZXIuXG4gICAgaWYgKHRoaXMuX2luaXRpYWxUcmFuc2Zvcm0gPT0gbnVsbCkge1xuICAgICAgdGhpcy5faW5pdGlhbFRyYW5zZm9ybSA9IHRoaXMuX3Jvb3RFbGVtZW50LnN0eWxlLnRyYW5zZm9ybSB8fCAnJztcbiAgICB9XG5cbiAgICAvLyBQcmVzZXJ2ZSB0aGUgcHJldmlvdXMgYHRyYW5zZm9ybWAgdmFsdWUsIGlmIHRoZXJlIHdhcyBvbmUuIE5vdGUgdGhhdCB3ZSBhcHBseSBvdXIgb3duXG4gICAgLy8gdHJhbnNmb3JtIGJlZm9yZSB0aGUgdXNlcidzLCBiZWNhdXNlIHRoaW5ncyBsaWtlIHJvdGF0aW9uIGNhbiBhZmZlY3Qgd2hpY2ggZGlyZWN0aW9uXG4gICAgLy8gdGhlIGVsZW1lbnQgd2lsbCBiZSB0cmFuc2xhdGVkIHRvd2FyZHMuXG4gICAgdGhpcy5fcm9vdEVsZW1lbnQuc3R5bGUudHJhbnNmb3JtID0gdGhpcy5faW5pdGlhbFRyYW5zZm9ybSA/XG4gICAgICB0cmFuc2Zvcm0gKyAnICcgKyB0aGlzLl9pbml0aWFsVHJhbnNmb3JtICA6IHRyYW5zZm9ybTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBkaXN0YW5jZSB0aGF0IHRoZSB1c2VyIGhhcyBkcmFnZ2VkIGR1cmluZyB0aGUgY3VycmVudCBkcmFnIHNlcXVlbmNlLlxuICAgKiBAcGFyYW0gY3VycmVudFBvc2l0aW9uIEN1cnJlbnQgcG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0RHJhZ0Rpc3RhbmNlKGN1cnJlbnRQb3NpdGlvbjogUG9pbnQpOiBQb2ludCB7XG4gICAgY29uc3QgcGlja3VwUG9zaXRpb24gPSB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZTtcblxuICAgIGlmIChwaWNrdXBQb3NpdGlvbikge1xuICAgICAgcmV0dXJuIHt4OiBjdXJyZW50UG9zaXRpb24ueCAtIHBpY2t1cFBvc2l0aW9uLngsIHk6IGN1cnJlbnRQb3NpdGlvbi55IC0gcGlja3VwUG9zaXRpb24ueX07XG4gICAgfVxuXG4gICAgcmV0dXJuIHt4OiAwLCB5OiAwfTtcbiAgfVxuXG4gIC8qKiBDbGVhbnMgdXAgYW55IGNhY2hlZCBlbGVtZW50IGRpbWVuc2lvbnMgdGhhdCB3ZSBkb24ndCBuZWVkIGFmdGVyIGRyYWdnaW5nIGhhcyBzdG9wcGVkLiAqL1xuICBwcml2YXRlIF9jbGVhbnVwQ2FjaGVkRGltZW5zaW9ucygpIHtcbiAgICB0aGlzLl9ib3VuZGFyeVJlY3QgPSB0aGlzLl9wcmV2aWV3UmVjdCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgZWxlbWVudCBpcyBzdGlsbCBpbnNpZGUgaXRzIGJvdW5kYXJ5IGFmdGVyIHRoZSB2aWV3cG9ydCBoYXMgYmVlbiByZXNpemVkLlxuICAgKiBJZiBub3QsIHRoZSBwb3NpdGlvbiBpcyBhZGp1c3RlZCBzbyB0aGF0IHRoZSBlbGVtZW50IGZpdHMgYWdhaW4uXG4gICAqL1xuICBwcml2YXRlIF9jb250YWluSW5zaWRlQm91bmRhcnlPblJlc2l6ZSgpIHtcbiAgICBsZXQge3gsIHl9ID0gdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybTtcblxuICAgIGlmICgoeCA9PT0gMCAmJiB5ID09PSAwKSB8fCB0aGlzLmlzRHJhZ2dpbmcoKSB8fCAhdGhpcy5fYm91bmRhcnlFbGVtZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgYm91bmRhcnlSZWN0ID0gdGhpcy5fYm91bmRhcnlFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IGVsZW1lbnRSZWN0ID0gdGhpcy5fcm9vdEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAvLyBJdCdzIHBvc3NpYmxlIHRoYXQgdGhlIGVsZW1lbnQgZ290IGhpZGRlbiBhd2F5IGFmdGVyIGRyYWdnaW5nIChlLmcuIGJ5IHN3aXRjaGluZyB0byBhXG4gICAgLy8gZGlmZmVyZW50IHRhYikuIERvbid0IGRvIGFueXRoaW5nIGluIHRoaXMgY2FzZSBzbyB3ZSBkb24ndCBjbGVhciB0aGUgdXNlcidzIHBvc2l0aW9uLlxuICAgIGlmICgoYm91bmRhcnlSZWN0LndpZHRoID09PSAwICYmIGJvdW5kYXJ5UmVjdC5oZWlnaHQgPT09IDApIHx8XG4gICAgICAgIChlbGVtZW50UmVjdC53aWR0aCA9PT0gMCAmJiBlbGVtZW50UmVjdC5oZWlnaHQgPT09IDApKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbGVmdE92ZXJmbG93ID0gYm91bmRhcnlSZWN0LmxlZnQgLSBlbGVtZW50UmVjdC5sZWZ0O1xuICAgIGNvbnN0IHJpZ2h0T3ZlcmZsb3cgPSBlbGVtZW50UmVjdC5yaWdodCAtIGJvdW5kYXJ5UmVjdC5yaWdodDtcbiAgICBjb25zdCB0b3BPdmVyZmxvdyA9IGJvdW5kYXJ5UmVjdC50b3AgLSBlbGVtZW50UmVjdC50b3A7XG4gICAgY29uc3QgYm90dG9tT3ZlcmZsb3cgPSBlbGVtZW50UmVjdC5ib3R0b20gLSBib3VuZGFyeVJlY3QuYm90dG9tO1xuXG4gICAgLy8gSWYgdGhlIGVsZW1lbnQgaGFzIGJlY29tZSB3aWRlciB0aGFuIHRoZSBib3VuZGFyeSwgd2UgY2FuJ3RcbiAgICAvLyBkbyBtdWNoIHRvIG1ha2UgaXQgZml0IHNvIHdlIGp1c3QgYW5jaG9yIGl0IHRvIHRoZSBsZWZ0LlxuICAgIGlmIChib3VuZGFyeVJlY3Qud2lkdGggPiBlbGVtZW50UmVjdC53aWR0aCkge1xuICAgICAgaWYgKGxlZnRPdmVyZmxvdyA+IDApIHtcbiAgICAgICAgeCArPSBsZWZ0T3ZlcmZsb3c7XG4gICAgICB9XG5cbiAgICAgIGlmIChyaWdodE92ZXJmbG93ID4gMCkge1xuICAgICAgICB4IC09IHJpZ2h0T3ZlcmZsb3c7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHggPSAwO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBlbGVtZW50IGhhcyBiZWNvbWUgdGFsbGVyIHRoYW4gdGhlIGJvdW5kYXJ5LCB3ZSBjYW4ndFxuICAgIC8vIGRvIG11Y2ggdG8gbWFrZSBpdCBmaXQgc28gd2UganVzdCBhbmNob3IgaXQgdG8gdGhlIHRvcC5cbiAgICBpZiAoYm91bmRhcnlSZWN0LmhlaWdodCA+IGVsZW1lbnRSZWN0LmhlaWdodCkge1xuICAgICAgaWYgKHRvcE92ZXJmbG93ID4gMCkge1xuICAgICAgICB5ICs9IHRvcE92ZXJmbG93O1xuICAgICAgfVxuXG4gICAgICBpZiAoYm90dG9tT3ZlcmZsb3cgPiAwKSB7XG4gICAgICAgIHkgLT0gYm90dG9tT3ZlcmZsb3c7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHkgPSAwO1xuICAgIH1cblxuICAgIGlmICh4ICE9PSB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtLnggfHwgeSAhPT0gdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybS55KSB7XG4gICAgICB0aGlzLnNldEZyZWVEcmFnUG9zaXRpb24oe3ksIHh9KTtcbiAgICB9XG4gIH1cblxuICAvKiogR2V0cyB0aGUgZHJhZyBzdGFydCBkZWxheSwgYmFzZWQgb24gdGhlIGV2ZW50IHR5cGUuICovXG4gIHByaXZhdGUgX2dldERyYWdTdGFydERlbGF5KGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCk6IG51bWJlciB7XG4gICAgY29uc3QgdmFsdWUgPSB0aGlzLmRyYWdTdGFydERlbGF5O1xuXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9IGVsc2UgaWYgKGlzVG91Y2hFdmVudChldmVudCkpIHtcbiAgICAgIHJldHVybiB2YWx1ZS50b3VjaDtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWUgPyB2YWx1ZS5tb3VzZSA6IDA7XG4gIH1cblxuICAvKiogVXBkYXRlcyB0aGUgaW50ZXJuYWwgc3RhdGUgb2YgdGhlIGRyYWdnYWJsZSBlbGVtZW50IHdoZW4gc2Nyb2xsaW5nIGhhcyBvY2N1cnJlZC4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlT25TY3JvbGwoZXZlbnQ6IEV2ZW50KSB7XG4gICAgY29uc3Qgc2Nyb2xsRGlmZmVyZW5jZSA9IHRoaXMuX3BhcmVudFBvc2l0aW9ucy5oYW5kbGVTY3JvbGwoZXZlbnQpO1xuXG4gICAgaWYgKHNjcm9sbERpZmZlcmVuY2UpIHtcbiAgICAgIC8vIENsaWVudFJlY3QgZGltZW5zaW9ucyBhcmUgYmFzZWQgb24gdGhlIHBhZ2UncyBzY3JvbGwgcG9zaXRpb24gc29cbiAgICAgIC8vIHdlIGhhdmUgdG8gdXBkYXRlIHRoZSBjYWNoZWQgYm91bmRhcnkgQ2xpZW50UmVjdCBpZiB0aGUgdXNlciBoYXMgc2Nyb2xsZWQuXG4gICAgICBpZiAodGhpcy5fYm91bmRhcnlSZWN0KSB7XG4gICAgICAgIGFkanVzdENsaWVudFJlY3QodGhpcy5fYm91bmRhcnlSZWN0LCBzY3JvbGxEaWZmZXJlbmNlLnRvcCwgc2Nyb2xsRGlmZmVyZW5jZS5sZWZ0KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UueCArPSBzY3JvbGxEaWZmZXJlbmNlLmxlZnQ7XG4gICAgICB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZS55ICs9IHNjcm9sbERpZmZlcmVuY2UudG9wO1xuXG4gICAgICAvLyBJZiB3ZSdyZSBpbiBmcmVlIGRyYWcgbW9kZSwgd2UgaGF2ZSB0byB1cGRhdGUgdGhlIGFjdGl2ZSB0cmFuc2Zvcm0sIGJlY2F1c2VcbiAgICAgIC8vIGl0IGlzbid0IHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydCBsaWtlIHRoZSBwcmV2aWV3IGluc2lkZSBhIGRyb3AgbGlzdC5cbiAgICAgIGlmICghdGhpcy5fZHJvcENvbnRhaW5lcikge1xuICAgICAgICB0aGlzLl9hY3RpdmVUcmFuc2Zvcm0ueCAtPSBzY3JvbGxEaWZmZXJlbmNlLmxlZnQ7XG4gICAgICAgIHRoaXMuX2FjdGl2ZVRyYW5zZm9ybS55IC09IHNjcm9sbERpZmZlcmVuY2UudG9wO1xuICAgICAgICB0aGlzLl9hcHBseVJvb3RFbGVtZW50VHJhbnNmb3JtKHRoaXMuX2FjdGl2ZVRyYW5zZm9ybS54LCB0aGlzLl9hY3RpdmVUcmFuc2Zvcm0ueSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIEdldHMgdGhlIHNjcm9sbCBwb3NpdGlvbiBvZiB0aGUgdmlld3BvcnQuICovXG4gIHByaXZhdGUgX2dldFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24oKSB7XG4gICAgY29uc3QgY2FjaGVkUG9zaXRpb24gPSB0aGlzLl9wYXJlbnRQb3NpdGlvbnMucG9zaXRpb25zLmdldCh0aGlzLl9kb2N1bWVudCk7XG4gICAgcmV0dXJuIGNhY2hlZFBvc2l0aW9uID8gY2FjaGVkUG9zaXRpb24uc2Nyb2xsUG9zaXRpb24gOlxuICAgICAgICB0aGlzLl92aWV3cG9ydFJ1bGVyLmdldFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24oKTtcbiAgfVxufVxuXG4vKipcbiAqIEdldHMgYSAzZCBgdHJhbnNmb3JtYCB0aGF0IGNhbiBiZSBhcHBsaWVkIHRvIGFuIGVsZW1lbnQuXG4gKiBAcGFyYW0geCBEZXNpcmVkIHBvc2l0aW9uIG9mIHRoZSBlbGVtZW50IGFsb25nIHRoZSBYIGF4aXMuXG4gKiBAcGFyYW0geSBEZXNpcmVkIHBvc2l0aW9uIG9mIHRoZSBlbGVtZW50IGFsb25nIHRoZSBZIGF4aXMuXG4gKi9cbmZ1bmN0aW9uIGdldFRyYW5zZm9ybSh4OiBudW1iZXIsIHk6IG51bWJlcik6IHN0cmluZyB7XG4gIC8vIFJvdW5kIHRoZSB0cmFuc2Zvcm1zIHNpbmNlIHNvbWUgYnJvd3NlcnMgd2lsbFxuICAvLyBibHVyIHRoZSBlbGVtZW50cyBmb3Igc3ViLXBpeGVsIHRyYW5zZm9ybXMuXG4gIHJldHVybiBgdHJhbnNsYXRlM2QoJHtNYXRoLnJvdW5kKHgpfXB4LCAke01hdGgucm91bmQoeSl9cHgsIDApYDtcbn1cblxuLyoqIENyZWF0ZXMgYSBkZWVwIGNsb25lIG9mIGFuIGVsZW1lbnQuICovXG5mdW5jdGlvbiBkZWVwQ2xvbmVOb2RlKG5vZGU6IEhUTUxFbGVtZW50KTogSFRNTEVsZW1lbnQge1xuICBjb25zdCBjbG9uZSA9IG5vZGUuY2xvbmVOb2RlKHRydWUpIGFzIEhUTUxFbGVtZW50O1xuICBjb25zdCBkZXNjZW5kYW50c1dpdGhJZCA9IGNsb25lLnF1ZXJ5U2VsZWN0b3JBbGwoJ1tpZF0nKTtcbiAgY29uc3QgZGVzY2VuZGFudENhbnZhc2VzID0gbm9kZS5xdWVyeVNlbGVjdG9yQWxsKCdjYW52YXMnKTtcblxuICAvLyBSZW1vdmUgdGhlIGBpZGAgdG8gYXZvaWQgaGF2aW5nIG11bHRpcGxlIGVsZW1lbnRzIHdpdGggdGhlIHNhbWUgaWQgb24gdGhlIHBhZ2UuXG4gIGNsb25lLnJlbW92ZUF0dHJpYnV0ZSgnaWQnKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGRlc2NlbmRhbnRzV2l0aElkLmxlbmd0aDsgaSsrKSB7XG4gICAgZGVzY2VuZGFudHNXaXRoSWRbaV0ucmVtb3ZlQXR0cmlidXRlKCdpZCcpO1xuICB9XG5cbiAgLy8gYGNsb25lTm9kZWAgd29uJ3QgdHJhbnNmZXIgdGhlIGNvbnRlbnQgb2YgYGNhbnZhc2AgZWxlbWVudHMgc28gd2UgaGF2ZSB0byBkbyBpdCBvdXJzZWx2ZXMuXG4gIC8vIFdlIG1hdGNoIHVwIHRoZSBjbG9uZWQgY2FudmFzIHRvIHRoZWlyIHNvdXJjZXMgdXNpbmcgdGhlaXIgaW5kZXggaW4gdGhlIERPTS5cbiAgaWYgKGRlc2NlbmRhbnRDYW52YXNlcy5sZW5ndGgpIHtcbiAgICBjb25zdCBjbG9uZUNhbnZhc2VzID0gY2xvbmUucXVlcnlTZWxlY3RvckFsbCgnY2FudmFzJyk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlc2NlbmRhbnRDYW52YXNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgY29ycmVzcG9uZGluZ0Nsb25lQ29udGV4dCA9IGNsb25lQ2FudmFzZXNbaV0uZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgICAgaWYgKGNvcnJlc3BvbmRpbmdDbG9uZUNvbnRleHQpIHtcbiAgICAgICAgLy8gSW4gc29tZSBjYXNlcyBgZHJhd0ltYWdlYCBjYW4gdGhyb3cgKGUuZy4gaWYgdGhlIGNhbnZhcyBzaXplIGlzIDB4MCkuXG4gICAgICAgIC8vIFdlIGNhbid0IGRvIG11Y2ggYWJvdXQgaXQgc28ganVzdCBpZ25vcmUgdGhlIGVycm9yLlxuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvcnJlc3BvbmRpbmdDbG9uZUNvbnRleHQuZHJhd0ltYWdlKGRlc2NlbmRhbnRDYW52YXNlc1tpXSwgMCwgMCk7XG4gICAgICAgIH0gY2F0Y2gge31cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gY2xvbmU7XG59XG5cbi8qKiBDbGFtcHMgYSB2YWx1ZSBiZXR3ZWVuIGEgbWluaW11bSBhbmQgYSBtYXhpbXVtLiAqL1xuZnVuY3Rpb24gY2xhbXAodmFsdWU6IG51bWJlciwgbWluOiBudW1iZXIsIG1heDogbnVtYmVyKSB7XG4gIHJldHVybiBNYXRoLm1heChtaW4sIE1hdGgubWluKG1heCwgdmFsdWUpKTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgdG8gcmVtb3ZlIGEgbm9kZSBmcm9tIHRoZSBET00gYW5kIHRvIGRvIGFsbCB0aGUgbmVjZXNzYXJ5IG51bGwgY2hlY2tzLlxuICogQHBhcmFtIG5vZGUgTm9kZSB0byBiZSByZW1vdmVkLlxuICovXG5mdW5jdGlvbiByZW1vdmVOb2RlKG5vZGU6IE5vZGUgfCBudWxsKSB7XG4gIGlmIChub2RlICYmIG5vZGUucGFyZW50Tm9kZSkge1xuICAgIG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbiAgfVxufVxuXG4vKiogRGV0ZXJtaW5lcyB3aGV0aGVyIGFuIGV2ZW50IGlzIGEgdG91Y2ggZXZlbnQuICovXG5mdW5jdGlvbiBpc1RvdWNoRXZlbnQoZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KTogZXZlbnQgaXMgVG91Y2hFdmVudCB7XG4gIC8vIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGZvciBldmVyeSBwaXhlbCB0aGF0IHRoZSB1c2VyIGhhcyBkcmFnZ2VkIHNvIHdlIG5lZWQgaXQgdG8gYmVcbiAgLy8gYXMgZmFzdCBhcyBwb3NzaWJsZS4gU2luY2Ugd2Ugb25seSBiaW5kIG1vdXNlIGV2ZW50cyBhbmQgdG91Y2ggZXZlbnRzLCB3ZSBjYW4gYXNzdW1lXG4gIC8vIHRoYXQgaWYgdGhlIGV2ZW50J3MgbmFtZSBzdGFydHMgd2l0aCBgdGAsIGl0J3MgYSB0b3VjaCBldmVudC5cbiAgcmV0dXJuIGV2ZW50LnR5cGVbMF0gPT09ICd0Jztcbn1cblxuLyoqIEdldHMgdGhlIGVsZW1lbnQgaW50byB3aGljaCB0aGUgZHJhZyBwcmV2aWV3IHNob3VsZCBiZSBpbnNlcnRlZC4gKi9cbmZ1bmN0aW9uIGdldFByZXZpZXdJbnNlcnRpb25Qb2ludChkb2N1bWVudFJlZjogYW55KTogSFRNTEVsZW1lbnQge1xuICAvLyBXZSBjYW4ndCB1c2UgdGhlIGJvZHkgaWYgdGhlIHVzZXIgaXMgaW4gZnVsbHNjcmVlbiBtb2RlLFxuICAvLyBiZWNhdXNlIHRoZSBwcmV2aWV3IHdpbGwgcmVuZGVyIHVuZGVyIHRoZSBmdWxsc2NyZWVuIGVsZW1lbnQuXG4gIC8vIFRPRE8oY3Jpc2JldG8pOiBkZWR1cGUgdGhpcyB3aXRoIHRoZSBgRnVsbHNjcmVlbk92ZXJsYXlDb250YWluZXJgIGV2ZW50dWFsbHkuXG4gIHJldHVybiBkb2N1bWVudFJlZi5mdWxsc2NyZWVuRWxlbWVudCB8fFxuICAgICAgICAgZG9jdW1lbnRSZWYud2Via2l0RnVsbHNjcmVlbkVsZW1lbnQgfHxcbiAgICAgICAgIGRvY3VtZW50UmVmLm1vekZ1bGxTY3JlZW5FbGVtZW50IHx8XG4gICAgICAgICBkb2N1bWVudFJlZi5tc0Z1bGxzY3JlZW5FbGVtZW50IHx8XG4gICAgICAgICBkb2N1bWVudFJlZi5ib2R5O1xufVxuXG4vKipcbiAqIEdldHMgdGhlIHJvb3QgSFRNTCBlbGVtZW50IG9mIGFuIGVtYmVkZGVkIHZpZXcuXG4gKiBJZiB0aGUgcm9vdCBpcyBub3QgYW4gSFRNTCBlbGVtZW50IGl0IGdldHMgd3JhcHBlZCBpbiBvbmUuXG4gKi9cbmZ1bmN0aW9uIGdldFJvb3ROb2RlKHZpZXdSZWY6IEVtYmVkZGVkVmlld1JlZjxhbnk+LCBfZG9jdW1lbnQ6IERvY3VtZW50KTogSFRNTEVsZW1lbnQge1xuICBjb25zdCByb290Tm9kZXM6IE5vZGVbXSA9IHZpZXdSZWYucm9vdE5vZGVzO1xuXG4gIGlmIChyb290Tm9kZXMubGVuZ3RoID09PSAxICYmIHJvb3ROb2Rlc1swXS5ub2RlVHlwZSA9PT0gX2RvY3VtZW50LkVMRU1FTlRfTk9ERSkge1xuICAgIHJldHVybiByb290Tm9kZXNbMF0gYXMgSFRNTEVsZW1lbnQ7XG4gIH1cblxuICBjb25zdCB3cmFwcGVyID0gX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICByb290Tm9kZXMuZm9yRWFjaChub2RlID0+IHdyYXBwZXIuYXBwZW5kQ2hpbGQobm9kZSkpO1xuICByZXR1cm4gd3JhcHBlcjtcbn1cblxuLyoqXG4gKiBNYXRjaGVzIHRoZSB0YXJnZXQgZWxlbWVudCdzIHNpemUgdG8gdGhlIHNvdXJjZSdzIHNpemUuXG4gKiBAcGFyYW0gdGFyZ2V0IEVsZW1lbnQgdGhhdCBuZWVkcyB0byBiZSByZXNpemVkLlxuICogQHBhcmFtIHNvdXJjZVJlY3QgRGltZW5zaW9ucyBvZiB0aGUgc291cmNlIGVsZW1lbnQuXG4gKi9cbmZ1bmN0aW9uIG1hdGNoRWxlbWVudFNpemUodGFyZ2V0OiBIVE1MRWxlbWVudCwgc291cmNlUmVjdDogQ2xpZW50UmVjdCk6IHZvaWQge1xuICB0YXJnZXQuc3R5bGUud2lkdGggPSBgJHtzb3VyY2VSZWN0LndpZHRofXB4YDtcbiAgdGFyZ2V0LnN0eWxlLmhlaWdodCA9IGAke3NvdXJjZVJlY3QuaGVpZ2h0fXB4YDtcbiAgdGFyZ2V0LnN0eWxlLnRyYW5zZm9ybSA9IGdldFRyYW5zZm9ybShzb3VyY2VSZWN0LmxlZnQsIHNvdXJjZVJlY3QudG9wKTtcbn1cbiJdfQ==