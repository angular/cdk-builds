/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { normalizePassiveListenerOptions, _getEventTarget, _getShadowRoot, } from '@angular/cdk/platform';
import { coerceBooleanProperty, coerceElement } from '@angular/cdk/coercion';
import { isFakeMousedownFromScreenReader, isFakeTouchstartFromScreenReader, } from '@angular/cdk/a11y';
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
    'position'
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
                    const target = _getEventTarget(event);
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
            // We only need the preview dimensions if we have a boundary element.
            if (this._boundaryElement) {
                // Cache the preview element rect if we haven't cached it already or if
                // we cached it too early before the element dimensions were computed.
                if (!this._previewRect || (!this._previewRect.width && !this._previewRect.height)) {
                    this._previewRect = (this._preview || this._rootElement).getBoundingClientRect();
                }
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
                        delta: this._pointerDirectionDelta
                    });
                });
            }
        };
        /** Handler that is invoked when the user lifts their pointer up, after initiating a drag. */
        this._pointerUp = (event) => {
            this._endDragSequence(event);
        };
        this.withRootElement(element).withParent(_config.parentDragRef || null);
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
        this._boundaryElement = this._rootElement = this._ownerSVGElement = this._placeholderTemplate =
            this._previewTemplate = this._anchor = this._parentDragRef = null;
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
            const pointerPosition = this._getPointerPositionOnPage(event);
            this._passiveTransform.y = this._activeTransform.y;
            this._ngZone.run(() => {
                this.ended.next({
                    source: this,
                    distance: this._getDragDistance(pointerPosition),
                    dropPoint: pointerPosition
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
            const placeholder = this._placeholder = this._createPlaceholderElement();
            const anchor = this._anchor = this._anchor || this._document.createComment('');
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
        const isSyntheticEvent = !isTouchSequence && this._lastTouchEventTime &&
            this._lastTouchEventTime + MOUSE_EVENT_IGNORE_TIME > Date.now();
        const isFakeEvent = isTouchSequence ? isFakeTouchstartFromScreenReader(event) :
            isFakeMousedownFromScreenReader(event);
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
            this.ended.next({ source: this, distance, dropPoint: pointerPosition });
            this.dropped.next({
                item: this,
                currentIndex,
                previousIndex: this._initialIndex,
                container: container,
                previousContainer: this._initialContainer,
                isPointerOverContainer,
                distance,
                dropPoint: pointerPosition
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
                preview.style.transform =
                    getTransform(this._pickupPositionOnPage.x, this._pickupPositionOnPage.y);
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
            'z-index': `${this._config.zIndex || 1000}`
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
                    if (!event || (_getEventTarget(event) === this._preview &&
                        event.propertyName === 'transform')) {
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
            if (this._boundaryRect && target !== this._boundaryElement &&
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
        const cachedPosition = this._parentPositions.positions.get(this._document);
        return cachedPosition ? cachedPosition.scrollPosition :
            this._viewportRuler.getViewportScrollPosition();
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
            return shadowRoot ||
                documentRef.fullscreenElement ||
                documentRef.webkitFullscreenElement ||
                documentRef.mozFullScreenElement ||
                documentRef.msFullscreenElement ||
                documentRef.body;
        }
        return coerceElement(previewContainer);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2RyYWctZHJvcC9kcmFnLXJlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFLSCxPQUFPLEVBQ0wsK0JBQStCLEVBQy9CLGVBQWUsRUFDZixjQUFjLEdBQ2YsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQUMscUJBQXFCLEVBQUUsYUFBYSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDM0UsT0FBTyxFQUNMLCtCQUErQixFQUMvQixnQ0FBZ0MsR0FDakMsTUFBTSxtQkFBbUIsQ0FBQztBQUMzQixPQUFPLEVBQUMsWUFBWSxFQUFFLE9BQU8sRUFBYSxNQUFNLE1BQU0sQ0FBQztBQUd2RCxPQUFPLEVBQ0wsaUJBQWlCLEVBQ2pCLFlBQVksRUFDWiw0QkFBNEIsRUFDNUIsZ0JBQWdCLEdBQ2pCLE1BQU0sZ0JBQWdCLENBQUM7QUFDeEIsT0FBTyxFQUFDLGtDQUFrQyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDekUsT0FBTyxFQUFDLG9CQUFvQixFQUFFLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3JFLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQ2hFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxjQUFjLENBQUM7QUF1QjNDLGlFQUFpRTtBQUNqRSxNQUFNLDJCQUEyQixHQUFHLCtCQUErQixDQUFDLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7QUFFckYsaUVBQWlFO0FBQ2pFLE1BQU0sMEJBQTBCLEdBQUcsK0JBQStCLENBQUMsRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQztBQUVyRjs7Ozs7R0FLRztBQUNILE1BQU0sdUJBQXVCLEdBQUcsR0FBRyxDQUFDO0FBOEJwQyw4REFBOEQ7QUFDOUQsTUFBTSx1QkFBdUIsR0FBRyxJ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Q25FLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEdBQUcsVUFBVSxDQUFDLEtBQUssSUFBSSxDQUFDO0lBQzdDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLEdBQUcsVUFBVSxDQUFDLE1BQU0sSUFBSSxDQUFDO0lBQy9DLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLFlBQVksQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN6RSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RW1iZWRkZWRWaWV3UmVmLCBFbGVtZW50UmVmLCBOZ1pvbmUsIFZpZXdDb250YWluZXJSZWYsIFRlbXBsYXRlUmVmfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Vmlld3BvcnRSdWxlcn0gZnJvbSAnQGFuZ3VsYXIvY2RrL3Njcm9sbGluZyc7XG5pbXBvcnQge0RpcmVjdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtcbiAgbm9ybWFsaXplUGFzc2l2ZUxpc3RlbmVyT3B0aW9ucyxcbiAgX2dldEV2ZW50VGFyZ2V0LFxuICBfZ2V0U2hhZG93Um9vdCxcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7Y29lcmNlQm9vbGVhblByb3BlcnR5LCBjb2VyY2VFbGVtZW50fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtcbiAgaXNGYWtlTW91c2Vkb3duRnJvbVNjcmVlblJlYWRlcixcbiAgaXNGYWtlVG91Y2hzdGFydEZyb21TY3JlZW5SZWFkZXIsXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9hMTF5JztcbmltcG9ydCB7U3Vic2NyaXB0aW9uLCBTdWJqZWN0LCBPYnNlcnZhYmxlfSBmcm9tICdyeGpzJztcbmltcG9ydCB7RHJvcExpc3RSZWZJbnRlcm5hbCBhcyBEcm9wTGlzdFJlZn0gZnJvbSAnLi9kcm9wLWxpc3QtcmVmJztcbmltcG9ydCB7RHJhZ0Ryb3BSZWdpc3RyeX0gZnJvbSAnLi9kcmFnLWRyb3AtcmVnaXN0cnknO1xuaW1wb3J0IHtcbiAgY29tYmluZVRyYW5zZm9ybXMsXG4gIGV4dGVuZFN0eWxlcyxcbiAgdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucyxcbiAgdG9nZ2xlVmlzaWJpbGl0eSxcbn0gZnJvbSAnLi9kcmFnLXN0eWxpbmcnO1xuaW1wb3J0IHtnZXRUcmFuc2Zvcm1UcmFuc2l0aW9uRHVyYXRpb25Jbk1zfSBmcm9tICcuL3RyYW5zaXRpb24tZHVyYXRpb24nO1xuaW1wb3J0IHtnZXRNdXRhYmxlQ2xpZW50UmVjdCwgYWRqdXN0Q2xpZW50UmVjdH0gZnJvbSAnLi9jbGllbnQtcmVjdCc7XG5pbXBvcnQge1BhcmVudFBvc2l0aW9uVHJhY2tlcn0gZnJvbSAnLi9wYXJlbnQtcG9zaXRpb24tdHJhY2tlcic7XG5pbXBvcnQge2RlZXBDbG9uZU5vZGV9IGZyb20gJy4vY2xvbmUtbm9kZSc7XG5cbi8qKiBPYmplY3QgdGhhdCBjYW4gYmUgdXNlZCB0byBjb25maWd1cmUgdGhlIGJlaGF2aW9yIG9mIERyYWdSZWYuICovXG5leHBvcnQgaW50ZXJmYWNlIERyYWdSZWZDb25maWcge1xuICAvKipcbiAgICogTWluaW11bSBhbW91bnQgb2YgcGl4ZWxzIHRoYXQgdGhlIHVzZXIgc2hvdWxkXG4gICAqIGRyYWcsIGJlZm9yZSB0aGUgQ0RLIGluaXRpYXRlcyBhIGRyYWcgc2VxdWVuY2UuXG4gICAqL1xuICBkcmFnU3RhcnRUaHJlc2hvbGQ6IG51bWJlcjtcblxuICAvKipcbiAgICogQW1vdW50IHRoZSBwaXhlbHMgdGhlIHVzZXIgc2hvdWxkIGRyYWcgYmVmb3JlIHRoZSBDREtcbiAgICogY29uc2lkZXJzIHRoZW0gdG8gaGF2ZSBjaGFuZ2VkIHRoZSBkcmFnIGRpcmVjdGlvbi5cbiAgICovXG4gIHBvaW50ZXJEaXJlY3Rpb25DaGFuZ2VUaHJlc2hvbGQ6IG51bWJlcjtcblxuICAvKiogYHotaW5kZXhgIGZvciB0aGUgYWJzb2x1dGVseS1wb3NpdGlvbmVkIGVsZW1lbnRzIHRoYXQgYXJlIGNyZWF0ZWQgYnkgdGhlIGRyYWcgaXRlbS4gKi9cbiAgekluZGV4PzogbnVtYmVyO1xuXG4gIC8qKiBSZWYgdGhhdCB0aGUgY3VycmVudCBkcmFnIGl0ZW0gaXMgbmVzdGVkIGluLiAqL1xuICBwYXJlbnREcmFnUmVmPzogRHJhZ1JlZjtcbn1cblxuLyoqIE9wdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCB0byBiaW5kIGEgcGFzc2l2ZSBldmVudCBsaXN0ZW5lci4gKi9cbmNvbnN0IHBhc3NpdmVFdmVudExpc3RlbmVyT3B0aW9ucyA9IG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMoe3Bhc3NpdmU6IHRydWV9KTtcblxuLyoqIE9wdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCB0byBiaW5kIGFuIGFjdGl2ZSBldmVudCBsaXN0ZW5lci4gKi9cbmNvbnN0IGFjdGl2ZUV2ZW50TGlzdGVuZXJPcHRpb25zID0gbm9ybWFsaXplUGFzc2l2ZUxpc3RlbmVyT3B0aW9ucyh7cGFzc2l2ZTogZmFsc2V9KTtcblxuLyoqXG4gKiBUaW1lIGluIG1pbGxpc2Vjb25kcyBmb3Igd2hpY2ggdG8gaWdub3JlIG1vdXNlIGV2ZW50cywgYWZ0ZXJcbiAqIHJlY2VpdmluZyBhIHRvdWNoIGV2ZW50LiBVc2VkIHRvIGF2b2lkIGRvaW5nIGRvdWJsZSB3b3JrIGZvclxuICogdG91Y2ggZGV2aWNlcyB3aGVyZSB0aGUgYnJvd3NlciBmaXJlcyBmYWtlIG1vdXNlIGV2ZW50cywgaW5cbiAqIGFkZGl0aW9uIHRvIHRvdWNoIGV2ZW50cy5cbiAqL1xuY29uc3QgTU9VU0VfRVZFTlRfSUdOT1JFX1RJTUUgPSA4MDA7XG5cbi8vIFRPRE8oY3Jpc2JldG8pOiBhZGQgYW4gQVBJIGZvciBtb3ZpbmcgYSBkcmFnZ2FibGUgdXAvZG93biB0aGVcbi8vIGxpc3QgcHJvZ3JhbW1hdGljYWxseS4gVXNlZnVsIGZvciBrZXlib2FyZCBjb250cm9scy5cblxuLyoqXG4gKiBJbnRlcm5hbCBjb21waWxlLXRpbWUtb25seSByZXByZXNlbnRhdGlvbiBvZiBhIGBEcmFnUmVmYC5cbiAqIFVzZWQgdG8gYXZvaWQgY2lyY3VsYXIgaW1wb3J0IGlzc3VlcyBiZXR3ZWVuIHRoZSBgRHJhZ1JlZmAgYW5kIHRoZSBgRHJvcExpc3RSZWZgLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIERyYWdSZWZJbnRlcm5hbCBleHRlbmRzIERyYWdSZWYge31cblxuLyoqIFRlbXBsYXRlIHRoYXQgY2FuIGJlIHVzZWQgdG8gY3JlYXRlIGEgZHJhZyBoZWxwZXIgZWxlbWVudCAoZS5nLiBhIHByZXZpZXcgb3IgYSBwbGFjZWhvbGRlcikuICovXG5pbnRlcmZhY2UgRHJhZ0hlbHBlclRlbXBsYXRlPFQgPSBhbnk+IHtcbiAgdGVtcGxhdGU6IFRlbXBsYXRlUmVmPFQ+IHwgbnVsbDtcbiAgdmlld0NvbnRhaW5lcjogVmlld0NvbnRhaW5lclJlZjtcbiAgY29udGV4dDogVDtcbn1cblxuLyoqIFRlbXBsYXRlIHRoYXQgY2FuIGJlIHVzZWQgdG8gY3JlYXRlIGEgZHJhZyBwcmV2aWV3IGVsZW1lbnQuICovXG5pbnRlcmZhY2UgRHJhZ1ByZXZpZXdUZW1wbGF0ZTxUID0gYW55PiBleHRlbmRzIERyYWdIZWxwZXJUZW1wbGF0ZTxUPiB7XG4gIG1hdGNoU2l6ZT86IGJvb2xlYW47XG59XG5cbi8qKiBQb2ludCBvbiB0aGUgcGFnZSBvciB3aXRoaW4gYW4gZWxlbWVudC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUG9pbnQge1xuICB4OiBudW1iZXI7XG4gIHk6IG51bWJlcjtcbn1cblxuLyoqIElubGluZSBzdHlsZXMgdG8gYmUgc2V0IGFzIGAhaW1wb3J0YW50YCB3aGlsZSBkcmFnZ2luZy4gKi9cbmNvbnN0IGRyYWdJbXBvcnRhbnRQcm9wZXJ0aWVzID0gbmV3IFNldChbXG4gIC8vIE5lZWRzIHRvIGJlIGltcG9ydGFudCwgYmVjYXVzZSBzb21lIGBtYXQtdGFibGVgIHNldHMgYHBvc2l0aW9uOiBzdGlja3kgIWltcG9ydGFudGAuIFNlZSAjMjI3ODEuXG4gICdwb3NpdGlvbidcbl0pO1xuXG4vKipcbiAqIFBvc3NpYmxlIHBsYWNlcyBpbnRvIHdoaWNoIHRoZSBwcmV2aWV3IG9mIGEgZHJhZyBpdGVtIGNhbiBiZSBpbnNlcnRlZC5cbiAqIC0gYGdsb2JhbGAgLSBQcmV2aWV3IHdpbGwgYmUgaW5zZXJ0ZWQgYXQgdGhlIGJvdHRvbSBvZiB0aGUgYDxib2R5PmAuIFRoZSBhZHZhbnRhZ2UgaXMgdGhhdFxuICogeW91IGRvbid0IGhhdmUgdG8gd29ycnkgYWJvdXQgYG92ZXJmbG93OiBoaWRkZW5gIG9yIGB6LWluZGV4YCwgYnV0IHRoZSBpdGVtIHdvbid0IHJldGFpblxuICogaXRzIGluaGVyaXRlZCBzdHlsZXMuXG4gKiAtIGBwYXJlbnRgIC0gUHJldmlldyB3aWxsIGJlIGluc2VydGVkIGludG8gdGhlIHBhcmVudCBvZiB0aGUgZHJhZyBpdGVtLiBUaGUgYWR2YW50YWdlIGlzIHRoYXRcbiAqIGluaGVyaXRlZCBzdHlsZXMgd2lsbCBiZSBwcmVzZXJ2ZWQsIGJ1dCBpdCBtYXkgYmUgY2xpcHBlZCBieSBgb3ZlcmZsb3c6IGhpZGRlbmAgb3Igbm90IGJlXG4gKiB2aXNpYmxlIGR1ZSB0byBgei1pbmRleGAuIEZ1cnRoZXJtb3JlLCB0aGUgcHJldmlldyBpcyBnb2luZyB0byBoYXZlIGFuIGVmZmVjdCBvdmVyIHNlbGVjdG9yc1xuICogbGlrZSBgOm50aC1jaGlsZGAgYW5kIHNvbWUgZmxleGJveCBjb25maWd1cmF0aW9ucy5cbiAqIC0gYEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+IHwgSFRNTEVsZW1lbnRgIC0gUHJldmlldyB3aWxsIGJlIGluc2VydGVkIGludG8gYSBzcGVjaWZpYyBlbGVtZW50LlxuICogU2FtZSBhZHZhbnRhZ2VzIGFuZCBkaXNhZHZhbnRhZ2VzIGFzIGBwYXJlbnRgLlxuICovXG5leHBvcnQgdHlwZSBQcmV2aWV3Q29udGFpbmVyID0gJ2dsb2JhbCcgfCAncGFyZW50JyB8IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+IHwgSFRNTEVsZW1lbnQ7XG5cbi8qKlxuICogUmVmZXJlbmNlIHRvIGEgZHJhZ2dhYmxlIGl0ZW0uIFVzZWQgdG8gbWFuaXB1bGF0ZSBvciBkaXNwb3NlIG9mIHRoZSBpdGVtLlxuICovXG5leHBvcnQgY2xhc3MgRHJhZ1JlZjxUID0gYW55PiB7XG4gIC8qKiBFbGVtZW50IGRpc3BsYXllZCBuZXh0IHRvIHRoZSB1c2VyJ3MgcG9pbnRlciB3aGlsZSB0aGUgZWxlbWVudCBpcyBkcmFnZ2VkLiAqL1xuICBwcml2YXRlIF9wcmV2aWV3OiBIVE1MRWxlbWVudDtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSB2aWV3IG9mIHRoZSBwcmV2aWV3IGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3ByZXZpZXdSZWY6IEVtYmVkZGVkVmlld1JlZjxhbnk+IHwgbnVsbDtcblxuICAvKiogQ29udGFpbmVyIGludG8gd2hpY2ggdG8gaW5zZXJ0IHRoZSBwcmV2aWV3LiAqL1xuICBwcml2YXRlIF9wcmV2aWV3Q29udGFpbmVyOiBQcmV2aWV3Q29udGFpbmVyIHwgdW5kZWZpbmVkO1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIHZpZXcgb2YgdGhlIHBsYWNlaG9sZGVyIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3BsYWNlaG9sZGVyUmVmOiBFbWJlZGRlZFZpZXdSZWY8YW55PiB8IG51bGw7XG5cbiAgLyoqIEVsZW1lbnQgdGhhdCBpcyByZW5kZXJlZCBpbnN0ZWFkIG9mIHRoZSBkcmFnZ2FibGUgaXRlbSB3aGlsZSBpdCBpcyBiZWluZyBzb3J0ZWQuICovXG4gIHByaXZhdGUgX3BsYWNlaG9sZGVyOiBIVE1MRWxlbWVudDtcblxuICAvKiogQ29vcmRpbmF0ZXMgd2l0aGluIHRoZSBlbGVtZW50IGF0IHdoaWNoIHRoZSB1c2VyIHBpY2tlZCB1cCB0aGUgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfcGlja3VwUG9zaXRpb25JbkVsZW1lbnQ6IFBvaW50O1xuXG4gIC8qKiBDb29yZGluYXRlcyBvbiB0aGUgcGFnZSBhdCB3aGljaCB0aGUgdXNlciBwaWNrZWQgdXAgdGhlIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3BpY2t1cFBvc2l0aW9uT25QYWdlOiBQb2ludDtcblxuICAvKipcbiAgICogQW5jaG9yIG5vZGUgdXNlZCB0byBzYXZlIHRoZSBwbGFjZSBpbiB0aGUgRE9NIHdoZXJlIHRoZSBlbGVtZW50IHdhc1xuICAgKiBwaWNrZWQgdXAgc28gdGhhdCBpdCBjYW4gYmUgcmVzdG9yZWQgYXQgdGhlIGVuZCBvZiB0aGUgZHJhZyBzZXF1ZW5jZS5cbiAgICovXG4gIHByaXZhdGUgX2FuY2hvcjogQ29tbWVudDtcblxuICAvKipcbiAgICogQ1NTIGB0cmFuc2Zvcm1gIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgd2hlbiBpdCBpc24ndCBiZWluZyBkcmFnZ2VkLiBXZSBuZWVkIGFcbiAgICogcGFzc2l2ZSB0cmFuc2Zvcm0gaW4gb3JkZXIgZm9yIHRoZSBkcmFnZ2VkIGVsZW1lbnQgdG8gcmV0YWluIGl0cyBuZXcgcG9zaXRpb25cbiAgICogYWZ0ZXIgdGhlIHVzZXIgaGFzIHN0b3BwZWQgZHJhZ2dpbmcgYW5kIGJlY2F1c2Ugd2UgbmVlZCB0byBrbm93IHRoZSByZWxhdGl2ZVxuICAgKiBwb3NpdGlvbiBpbiBjYXNlIHRoZXkgc3RhcnQgZHJhZ2dpbmcgYWdhaW4uIFRoaXMgY29ycmVzcG9uZHMgdG8gYGVsZW1lbnQuc3R5bGUudHJhbnNmb3JtYC5cbiAgICovXG4gIHByaXZhdGUgX3Bhc3NpdmVUcmFuc2Zvcm06IFBvaW50ID0ge3g6IDAsIHk6IDB9O1xuXG4gIC8qKiBDU1MgYHRyYW5zZm9ybWAgdGhhdCBpcyBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IHdoaWxlIGl0J3MgYmVpbmcgZHJhZ2dlZC4gKi9cbiAgcHJpdmF0ZSBfYWN0aXZlVHJhbnNmb3JtOiBQb2ludCA9IHt4OiAwLCB5OiAwfTtcblxuICAvKiogSW5saW5lIGB0cmFuc2Zvcm1gIHZhbHVlIHRoYXQgdGhlIGVsZW1lbnQgaGFkIGJlZm9yZSB0aGUgZmlyc3QgZHJhZ2dpbmcgc2VxdWVuY2UuICovXG4gIHByaXZhdGUgX2luaXRpYWxUcmFuc2Zvcm0/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGRyYWdnaW5nIHNlcXVlbmNlIGhhcyBiZWVuIHN0YXJ0ZWQuIERvZXNuJ3RcbiAgICogbmVjZXNzYXJpbHkgbWVhbiB0aGF0IHRoZSBlbGVtZW50IGhhcyBiZWVuIG1vdmVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfaGFzU3RhcnRlZERyYWdnaW5nID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGVsZW1lbnQgaGFzIG1vdmVkIHNpbmNlIHRoZSB1c2VyIHN0YXJ0ZWQgZHJhZ2dpbmcgaXQuICovXG4gIHByaXZhdGUgX2hhc01vdmVkOiBib29sZWFuO1xuXG4gIC8qKiBEcm9wIGNvbnRhaW5lciBpbiB3aGljaCB0aGUgRHJhZ1JlZiByZXNpZGVkIHdoZW4gZHJhZ2dpbmcgYmVnYW4uICovXG4gIHByaXZhdGUgX2luaXRpYWxDb250YWluZXI6IERyb3BMaXN0UmVmO1xuXG4gIC8qKiBJbmRleCBhdCB3aGljaCB0aGUgaXRlbSBzdGFydGVkIGluIGl0cyBpbml0aWFsIGNvbnRhaW5lci4gKi9cbiAgcHJpdmF0ZSBfaW5pdGlhbEluZGV4OiBudW1iZXI7XG5cbiAgLyoqIENhY2hlZCBwb3NpdGlvbnMgb2Ygc2Nyb2xsYWJsZSBwYXJlbnQgZWxlbWVudHMuICovXG4gIHByaXZhdGUgX3BhcmVudFBvc2l0aW9uczogUGFyZW50UG9zaXRpb25UcmFja2VyO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBpdGVtIGlzIGJlaW5nIG1vdmVkLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9tb3ZlRXZlbnRzID0gbmV3IFN1YmplY3Q8e1xuICAgIHNvdXJjZTogRHJhZ1JlZjtcbiAgICBwb2ludGVyUG9zaXRpb246IHt4OiBudW1iZXIsIHk6IG51bWJlcn07XG4gICAgZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50O1xuICAgIGRpc3RhbmNlOiBQb2ludDtcbiAgICBkZWx0YToge3g6IC0xIHwgMCB8IDEsIHk6IC0xIHwgMCB8IDF9O1xuICB9PigpO1xuXG4gIC8qKiBLZWVwcyB0cmFjayBvZiB0aGUgZGlyZWN0aW9uIGluIHdoaWNoIHRoZSB1c2VyIGlzIGRyYWdnaW5nIGFsb25nIGVhY2ggYXhpcy4gKi9cbiAgcHJpdmF0ZSBfcG9pbnRlckRpcmVjdGlvbkRlbHRhOiB7eDogLTEgfCAwIHwgMSwgeTogLTEgfCAwIHwgMX07XG5cbiAgLyoqIFBvaW50ZXIgcG9zaXRpb24gYXQgd2hpY2ggdGhlIGxhc3QgY2hhbmdlIGluIHRoZSBkZWx0YSBvY2N1cnJlZC4gKi9cbiAgcHJpdmF0ZSBfcG9pbnRlclBvc2l0aW9uQXRMYXN0RGlyZWN0aW9uQ2hhbmdlOiBQb2ludDtcblxuICAvKiogUG9zaXRpb24gb2YgdGhlIHBvaW50ZXIgYXQgdGhlIGxhc3QgcG9pbnRlciBldmVudC4gKi9cbiAgcHJpdmF0ZSBfbGFzdEtub3duUG9pbnRlclBvc2l0aW9uOiBQb2ludDtcblxuICAvKipcbiAgICogUm9vdCBET00gbm9kZSBvZiB0aGUgZHJhZyBpbnN0YW5jZS4gVGhpcyBpcyB0aGUgZWxlbWVudCB0aGF0IHdpbGxcbiAgICogYmUgbW92ZWQgYXJvdW5kIGFzIHRoZSB1c2VyIGlzIGRyYWdnaW5nLlxuICAgKi9cbiAgcHJpdmF0ZSBfcm9vdEVsZW1lbnQ6IEhUTUxFbGVtZW50O1xuXG4gIC8qKlxuICAgKiBOZWFyZXN0IGFuY2VzdG9yIFNWRywgcmVsYXRpdmUgdG8gd2hpY2ggY29vcmRpbmF0ZXMgYXJlIGNhbGN1bGF0ZWQgaWYgZHJhZ2dpbmcgU1ZHRWxlbWVudFxuICAgKi9cbiAgcHJpdmF0ZSBfb3duZXJTVkdFbGVtZW50OiBTVkdTVkdFbGVtZW50IHwgbnVsbDtcblxuICAvKipcbiAgICogSW5saW5lIHN0eWxlIHZhbHVlIG9mIGAtd2Via2l0LXRhcC1oaWdobGlnaHQtY29sb3JgIGF0IHRoZSB0aW1lIHRoZVxuICAgKiBkcmFnZ2luZyB3YXMgc3RhcnRlZC4gVXNlZCB0byByZXN0b3JlIHRoZSB2YWx1ZSBvbmNlIHdlJ3JlIGRvbmUgZHJhZ2dpbmcuXG4gICAqL1xuICBwcml2YXRlIF9yb290RWxlbWVudFRhcEhpZ2hsaWdodDogc3RyaW5nO1xuXG4gIC8qKiBTdWJzY3JpcHRpb24gdG8gcG9pbnRlciBtb3ZlbWVudCBldmVudHMuICovXG4gIHByaXZhdGUgX3BvaW50ZXJNb3ZlU3Vic2NyaXB0aW9uID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuXG4gIC8qKiBTdWJzY3JpcHRpb24gdG8gdGhlIGV2ZW50IHRoYXQgaXMgZGlzcGF0Y2hlZCB3aGVuIHRoZSB1c2VyIGxpZnRzIHRoZWlyIHBvaW50ZXIuICovXG4gIHByaXZhdGUgX3BvaW50ZXJVcFN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcblxuICAvKiogU3Vic2NyaXB0aW9uIHRvIHRoZSB2aWV3cG9ydCBiZWluZyBzY3JvbGxlZC4gKi9cbiAgcHJpdmF0ZSBfc2Nyb2xsU3Vic2NyaXB0aW9uID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuXG4gIC8qKiBTdWJzY3JpcHRpb24gdG8gdGhlIHZpZXdwb3J0IGJlaW5nIHJlc2l6ZWQuICovXG4gIHByaXZhdGUgX3Jlc2l6ZVN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcblxuICAvKipcbiAgICogVGltZSBhdCB3aGljaCB0aGUgbGFzdCB0b3VjaCBldmVudCBvY2N1cnJlZC4gVXNlZCB0byBhdm9pZCBmaXJpbmcgdGhlIHNhbWVcbiAgICogZXZlbnRzIG11bHRpcGxlIHRpbWVzIG9uIHRvdWNoIGRldmljZXMgd2hlcmUgdGhlIGJyb3dzZXIgd2lsbCBmaXJlIGEgZmFrZVxuICAgKiBtb3VzZSBldmVudCBmb3IgZWFjaCB0b3VjaCBldmVudCwgYWZ0ZXIgYSBjZXJ0YWluIHRpbWUuXG4gICAqL1xuICBwcml2YXRlIF9sYXN0VG91Y2hFdmVudFRpbWU6IG51bWJlcjtcblxuICAvKiogVGltZSBhdCB3aGljaCB0aGUgbGFzdCBkcmFnZ2luZyBzZXF1ZW5jZSB3YXMgc3RhcnRlZC4gKi9cbiAgcHJpdmF0ZSBfZHJhZ1N0YXJ0VGltZTogbnVtYmVyO1xuXG4gIC8qKiBDYWNoZWQgcmVmZXJlbmNlIHRvIHRoZSBib3VuZGFyeSBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9ib3VuZGFyeUVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG5hdGl2ZSBkcmFnZ2luZyBpbnRlcmFjdGlvbnMgaGF2ZSBiZWVuIGVuYWJsZWQgb24gdGhlIHJvb3QgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfbmF0aXZlSW50ZXJhY3Rpb25zRW5hYmxlZCA9IHRydWU7XG5cbiAgLyoqIENhY2hlZCBkaW1lbnNpb25zIG9mIHRoZSBwcmV2aWV3IGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3ByZXZpZXdSZWN0PzogQ2xpZW50UmVjdDtcblxuICAvKiogQ2FjaGVkIGRpbWVuc2lvbnMgb2YgdGhlIGJvdW5kYXJ5IGVsZW1lbnQuICovXG4gIHByaXZhdGUgX2JvdW5kYXJ5UmVjdD86IENsaWVudFJlY3Q7XG5cbiAgLyoqIEVsZW1lbnQgdGhhdCB3aWxsIGJlIHVzZWQgYXMgYSB0ZW1wbGF0ZSB0byBjcmVhdGUgdGhlIGRyYWdnYWJsZSBpdGVtJ3MgcHJldmlldy4gKi9cbiAgcHJpdmF0ZSBfcHJldmlld1RlbXBsYXRlPzogRHJhZ1ByZXZpZXdUZW1wbGF0ZSB8IG51bGw7XG5cbiAgLyoqIFRlbXBsYXRlIGZvciBwbGFjZWhvbGRlciBlbGVtZW50IHJlbmRlcmVkIHRvIHNob3cgd2hlcmUgYSBkcmFnZ2FibGUgd291bGQgYmUgZHJvcHBlZC4gKi9cbiAgcHJpdmF0ZSBfcGxhY2Vob2xkZXJUZW1wbGF0ZT86IERyYWdIZWxwZXJUZW1wbGF0ZSB8IG51bGw7XG5cbiAgLyoqIEVsZW1lbnRzIHRoYXQgY2FuIGJlIHVzZWQgdG8gZHJhZyB0aGUgZHJhZ2dhYmxlIGl0ZW0uICovXG4gIHByaXZhdGUgX2hhbmRsZXM6IEhUTUxFbGVtZW50W10gPSBbXTtcblxuICAvKiogUmVnaXN0ZXJlZCBoYW5kbGVzIHRoYXQgYXJlIGN1cnJlbnRseSBkaXNhYmxlZC4gKi9cbiAgcHJpdmF0ZSBfZGlzYWJsZWRIYW5kbGVzID0gbmV3IFNldDxIVE1MRWxlbWVudD4oKTtcblxuICAvKiogRHJvcHBhYmxlIGNvbnRhaW5lciB0aGF0IHRoZSBkcmFnZ2FibGUgaXMgYSBwYXJ0IG9mLiAqL1xuICBwcml2YXRlIF9kcm9wQ29udGFpbmVyPzogRHJvcExpc3RSZWY7XG5cbiAgLyoqIExheW91dCBkaXJlY3Rpb24gb2YgdGhlIGl0ZW0uICovXG4gIHByaXZhdGUgX2RpcmVjdGlvbjogRGlyZWN0aW9uID0gJ2x0cic7XG5cbiAgLyoqIFJlZiB0aGF0IHRoZSBjdXJyZW50IGRyYWcgaXRlbSBpcyBuZXN0ZWQgaW4uICovXG4gIHByaXZhdGUgX3BhcmVudERyYWdSZWY6IERyYWdSZWY8dW5rbm93bj4gfCBudWxsO1xuXG4gIC8qKlxuICAgKiBDYWNoZWQgc2hhZG93IHJvb3QgdGhhdCB0aGUgZWxlbWVudCBpcyBwbGFjZWQgaW4uIGBudWxsYCBtZWFucyB0aGF0IHRoZSBlbGVtZW50IGlzbid0IGluXG4gICAqIHRoZSBzaGFkb3cgRE9NIGFuZCBgdW5kZWZpbmVkYCBtZWFucyB0aGF0IGl0IGhhc24ndCBiZWVuIHJlc29sdmVkIHlldC4gU2hvdWxkIGJlIHJlYWQgdmlhXG4gICAqIGBfZ2V0U2hhZG93Um9vdGAsIG5vdCBkaXJlY3RseS5cbiAgICovXG4gIHByaXZhdGUgX2NhY2hlZFNoYWRvd1Jvb3Q6IFNoYWRvd1Jvb3QgfCBudWxsIHwgdW5kZWZpbmVkO1xuXG4gIC8qKiBBeGlzIGFsb25nIHdoaWNoIGRyYWdnaW5nIGlzIGxvY2tlZC4gKi9cbiAgbG9ja0F4aXM6ICd4JyB8ICd5JztcblxuICAvKipcbiAgICogQW1vdW50IG9mIG1pbGxpc2Vjb25kcyB0byB3YWl0IGFmdGVyIHRoZSB1c2VyIGhhcyBwdXQgdGhlaXJcbiAgICogcG9pbnRlciBkb3duIGJlZm9yZSBzdGFydGluZyB0byBkcmFnIHRoZSBlbGVtZW50LlxuICAgKi9cbiAgZHJhZ1N0YXJ0RGVsYXk6IG51bWJlciB8IHt0b3VjaDogbnVtYmVyLCBtb3VzZTogbnVtYmVyfSA9IDA7XG5cbiAgLyoqIENsYXNzIHRvIGJlIGFkZGVkIHRvIHRoZSBwcmV2aWV3IGVsZW1lbnQuICovXG4gIHByZXZpZXdDbGFzczogc3RyaW5nfHN0cmluZ1tdfHVuZGVmaW5lZDtcblxuICAvKiogV2hldGhlciBzdGFydGluZyB0byBkcmFnIHRoaXMgZWxlbWVudCBpcyBkaXNhYmxlZC4gKi9cbiAgZ2V0IGRpc2FibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9kaXNhYmxlZCB8fCAhISh0aGlzLl9kcm9wQ29udGFpbmVyICYmIHRoaXMuX2Ryb3BDb250YWluZXIuZGlzYWJsZWQpO1xuICB9XG4gIHNldCBkaXNhYmxlZCh2YWx1ZTogYm9vbGVhbikge1xuICAgIGNvbnN0IG5ld1ZhbHVlID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcblxuICAgIGlmIChuZXdWYWx1ZSAhPT0gdGhpcy5fZGlzYWJsZWQpIHtcbiAgICAgIHRoaXMuX2Rpc2FibGVkID0gbmV3VmFsdWU7XG4gICAgICB0aGlzLl90b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKCk7XG4gICAgICB0aGlzLl9oYW5kbGVzLmZvckVhY2goaGFuZGxlID0+IHRvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMoaGFuZGxlLCBuZXdWYWx1ZSkpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIF9kaXNhYmxlZCA9IGZhbHNlO1xuXG4gIC8qKiBFbWl0cyBhcyB0aGUgZHJhZyBzZXF1ZW5jZSBpcyBiZWluZyBwcmVwYXJlZC4gKi9cbiAgcmVhZG9ubHkgYmVmb3JlU3RhcnRlZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgc3RhcnRzIGRyYWdnaW5nIHRoZSBpdGVtLiAqL1xuICByZWFkb25seSBzdGFydGVkID0gbmV3IFN1YmplY3Q8e3NvdXJjZTogRHJhZ1JlZn0+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgaGFzIHJlbGVhc2VkIGEgZHJhZyBpdGVtLCBiZWZvcmUgYW55IGFuaW1hdGlvbnMgaGF2ZSBzdGFydGVkLiAqL1xuICByZWFkb25seSByZWxlYXNlZCA9IG5ldyBTdWJqZWN0PHtzb3VyY2U6IERyYWdSZWZ9PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHN0b3BzIGRyYWdnaW5nIGFuIGl0ZW0gaW4gdGhlIGNvbnRhaW5lci4gKi9cbiAgcmVhZG9ubHkgZW5kZWQgPSBuZXcgU3ViamVjdDx7c291cmNlOiBEcmFnUmVmLCBkaXN0YW5jZTogUG9pbnQsIGRyb3BQb2ludDogUG9pbnR9PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGhhcyBtb3ZlZCB0aGUgaXRlbSBpbnRvIGEgbmV3IGNvbnRhaW5lci4gKi9cbiAgcmVhZG9ubHkgZW50ZXJlZCA9IG5ldyBTdWJqZWN0PHtjb250YWluZXI6IERyb3BMaXN0UmVmLCBpdGVtOiBEcmFnUmVmLCBjdXJyZW50SW5kZXg6IG51bWJlcn0+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgcmVtb3ZlcyB0aGUgaXRlbSBpdHMgY29udGFpbmVyIGJ5IGRyYWdnaW5nIGl0IGludG8gYW5vdGhlciBjb250YWluZXIuICovXG4gIHJlYWRvbmx5IGV4aXRlZCA9IG5ldyBTdWJqZWN0PHtjb250YWluZXI6IERyb3BMaXN0UmVmLCBpdGVtOiBEcmFnUmVmfT4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBkcm9wcyB0aGUgaXRlbSBpbnNpZGUgYSBjb250YWluZXIuICovXG4gIHJlYWRvbmx5IGRyb3BwZWQgPSBuZXcgU3ViamVjdDx7XG4gICAgcHJldmlvdXNJbmRleDogbnVtYmVyO1xuICAgIGN1cnJlbnRJbmRleDogbnVtYmVyO1xuICAgIGl0ZW06IERyYWdSZWY7XG4gICAgY29udGFpbmVyOiBEcm9wTGlzdFJlZjtcbiAgICBwcmV2aW91c0NvbnRhaW5lcjogRHJvcExpc3RSZWY7XG4gICAgZGlzdGFuY2U6IFBvaW50O1xuICAgIGRyb3BQb2ludDogUG9pbnQ7XG4gICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcjogYm9vbGVhbjtcbiAgfT4oKTtcblxuICAvKipcbiAgICogRW1pdHMgYXMgdGhlIHVzZXIgaXMgZHJhZ2dpbmcgdGhlIGl0ZW0uIFVzZSB3aXRoIGNhdXRpb24sXG4gICAqIGJlY2F1c2UgdGhpcyBldmVudCB3aWxsIGZpcmUgZm9yIGV2ZXJ5IHBpeGVsIHRoYXQgdGhlIHVzZXIgaGFzIGRyYWdnZWQuXG4gICAqL1xuICByZWFkb25seSBtb3ZlZDogT2JzZXJ2YWJsZTx7XG4gICAgc291cmNlOiBEcmFnUmVmO1xuICAgIHBvaW50ZXJQb3NpdGlvbjoge3g6IG51bWJlciwgeTogbnVtYmVyfTtcbiAgICBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQ7XG4gICAgZGlzdGFuY2U6IFBvaW50O1xuICAgIGRlbHRhOiB7eDogLTEgfCAwIHwgMSwgeTogLTEgfCAwIHwgMX07XG4gIH0+ID0gdGhpcy5fbW92ZUV2ZW50cztcblxuICAvKiogQXJiaXRyYXJ5IGRhdGEgdGhhdCBjYW4gYmUgYXR0YWNoZWQgdG8gdGhlIGRyYWcgaXRlbS4gKi9cbiAgZGF0YTogVDtcblxuICAvKipcbiAgICogRnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB0byBjdXN0b21pemUgdGhlIGxvZ2ljIG9mIGhvdyB0aGUgcG9zaXRpb24gb2YgdGhlIGRyYWcgaXRlbVxuICAgKiBpcyBsaW1pdGVkIHdoaWxlIGl0J3MgYmVpbmcgZHJhZ2dlZC4gR2V0cyBjYWxsZWQgd2l0aCBhIHBvaW50IGNvbnRhaW5pbmcgdGhlIGN1cnJlbnQgcG9zaXRpb25cbiAgICogb2YgdGhlIHVzZXIncyBwb2ludGVyIG9uIHRoZSBwYWdlIGFuZCBzaG91bGQgcmV0dXJuIGEgcG9pbnQgZGVzY3JpYmluZyB3aGVyZSB0aGUgaXRlbSBzaG91bGRcbiAgICogYmUgcmVuZGVyZWQuXG4gICAqL1xuICBjb25zdHJhaW5Qb3NpdGlvbj86IChwb2ludDogUG9pbnQsIGRyYWdSZWY6IERyYWdSZWYpID0+IFBvaW50O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+IHwgSFRNTEVsZW1lbnQsXG4gICAgcHJpdmF0ZSBfY29uZmlnOiBEcmFnUmVmQ29uZmlnLFxuICAgIHByaXZhdGUgX2RvY3VtZW50OiBEb2N1bWVudCxcbiAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICBwcml2YXRlIF92aWV3cG9ydFJ1bGVyOiBWaWV3cG9ydFJ1bGVyLFxuICAgIHByaXZhdGUgX2RyYWdEcm9wUmVnaXN0cnk6IERyYWdEcm9wUmVnaXN0cnk8RHJhZ1JlZiwgRHJvcExpc3RSZWY+KSB7XG5cbiAgICB0aGlzLndpdGhSb290RWxlbWVudChlbGVtZW50KS53aXRoUGFyZW50KF9jb25maWcucGFyZW50RHJhZ1JlZiB8fCBudWxsKTtcbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMgPSBuZXcgUGFyZW50UG9zaXRpb25UcmFja2VyKF9kb2N1bWVudCwgX3ZpZXdwb3J0UnVsZXIpO1xuICAgIF9kcmFnRHJvcFJlZ2lzdHJ5LnJlZ2lzdGVyRHJhZ0l0ZW0odGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZWxlbWVudCB0aGF0IGlzIGJlaW5nIHVzZWQgYXMgYSBwbGFjZWhvbGRlclxuICAgKiB3aGlsZSB0aGUgY3VycmVudCBlbGVtZW50IGlzIGJlaW5nIGRyYWdnZWQuXG4gICAqL1xuICBnZXRQbGFjZWhvbGRlckVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLl9wbGFjZWhvbGRlcjtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHRoZSByb290IGRyYWdnYWJsZSBlbGVtZW50LiAqL1xuICBnZXRSb290RWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX3Jvb3RFbGVtZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnRseS12aXNpYmxlIGVsZW1lbnQgdGhhdCByZXByZXNlbnRzIHRoZSBkcmFnIGl0ZW0uXG4gICAqIFdoaWxlIGRyYWdnaW5nIHRoaXMgaXMgdGhlIHBsYWNlaG9sZGVyLCBvdGhlcndpc2UgaXQncyB0aGUgcm9vdCBlbGVtZW50LlxuICAgKi9cbiAgZ2V0VmlzaWJsZUVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLmlzRHJhZ2dpbmcoKSA/IHRoaXMuZ2V0UGxhY2Vob2xkZXJFbGVtZW50KCkgOiB0aGlzLmdldFJvb3RFbGVtZW50KCk7XG4gIH1cblxuICAvKiogUmVnaXN0ZXJzIHRoZSBoYW5kbGVzIHRoYXQgY2FuIGJlIHVzZWQgdG8gZHJhZyB0aGUgZWxlbWVudC4gKi9cbiAgd2l0aEhhbmRsZXMoaGFuZGxlczogKEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4pW10pOiB0aGlzIHtcbiAgICB0aGlzLl9oYW5kbGVzID0gaGFuZGxlcy5tYXAoaGFuZGxlID0+IGNvZXJjZUVsZW1lbnQoaGFuZGxlKSk7XG4gICAgdGhpcy5faGFuZGxlcy5mb3JFYWNoKGhhbmRsZSA9PiB0b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKGhhbmRsZSwgdGhpcy5kaXNhYmxlZCkpO1xuICAgIHRoaXMuX3RvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMoKTtcblxuICAgIC8vIERlbGV0ZSBhbnkgbGluZ2VyaW5nIGRpc2FibGVkIGhhbmRsZXMgdGhhdCBtYXkgaGF2ZSBiZWVuIGRlc3Ryb3llZC4gTm90ZSB0aGF0IHdlIHJlLWNyZWF0ZVxuICAgIC8vIHRoZSBzZXQsIHJhdGhlciB0aGFuIGl0ZXJhdGUgb3ZlciBpdCBhbmQgZmlsdGVyIG91dCB0aGUgZGVzdHJveWVkIGhhbmRsZXMsIGJlY2F1c2Ugd2hpbGVcbiAgICAvLyB0aGUgRVMgc3BlYyBhbGxvd3MgZm9yIHNldHMgdG8gYmUgbW9kaWZpZWQgd2hpbGUgdGhleSdyZSBiZWluZyBpdGVyYXRlZCBvdmVyLCBzb21lIHBvbHlmaWxsc1xuICAgIC8vIHVzZSBhbiBhcnJheSBpbnRlcm5hbGx5IHdoaWNoIG1heSB0aHJvdyBhbiBlcnJvci5cbiAgICBjb25zdCBkaXNhYmxlZEhhbmRsZXMgPSBuZXcgU2V0PEhUTUxFbGVtZW50PigpO1xuICAgIHRoaXMuX2Rpc2FibGVkSGFuZGxlcy5mb3JFYWNoKGhhbmRsZSA9PiB7XG4gICAgICBpZiAodGhpcy5faGFuZGxlcy5pbmRleE9mKGhhbmRsZSkgPiAtMSkge1xuICAgICAgICBkaXNhYmxlZEhhbmRsZXMuYWRkKGhhbmRsZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5fZGlzYWJsZWRIYW5kbGVzID0gZGlzYWJsZWRIYW5kbGVzO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyB0aGUgdGVtcGxhdGUgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgdGhlIGRyYWcgcHJldmlldy5cbiAgICogQHBhcmFtIHRlbXBsYXRlIFRlbXBsYXRlIHRoYXQgZnJvbSB3aGljaCB0byBzdGFtcCBvdXQgdGhlIHByZXZpZXcuXG4gICAqL1xuICB3aXRoUHJldmlld1RlbXBsYXRlKHRlbXBsYXRlOiBEcmFnUHJldmlld1RlbXBsYXRlIHwgbnVsbCk6IHRoaXMge1xuICAgIHRoaXMuX3ByZXZpZXdUZW1wbGF0ZSA9IHRlbXBsYXRlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyB0aGUgdGVtcGxhdGUgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgdGhlIGRyYWcgcGxhY2Vob2xkZXIuXG4gICAqIEBwYXJhbSB0ZW1wbGF0ZSBUZW1wbGF0ZSB0aGF0IGZyb20gd2hpY2ggdG8gc3RhbXAgb3V0IHRoZSBwbGFjZWhvbGRlci5cbiAgICovXG4gIHdpdGhQbGFjZWhvbGRlclRlbXBsYXRlKHRlbXBsYXRlOiBEcmFnSGVscGVyVGVtcGxhdGUgfCBudWxsKTogdGhpcyB7XG4gICAgdGhpcy5fcGxhY2Vob2xkZXJUZW1wbGF0ZSA9IHRlbXBsYXRlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYW4gYWx0ZXJuYXRlIGRyYWcgcm9vdCBlbGVtZW50LiBUaGUgcm9vdCBlbGVtZW50IGlzIHRoZSBlbGVtZW50IHRoYXQgd2lsbCBiZSBtb3ZlZCBhc1xuICAgKiB0aGUgdXNlciBpcyBkcmFnZ2luZy4gUGFzc2luZyBhbiBhbHRlcm5hdGUgcm9vdCBlbGVtZW50IGlzIHVzZWZ1bCB3aGVuIHRyeWluZyB0byBlbmFibGVcbiAgICogZHJhZ2dpbmcgb24gYW4gZWxlbWVudCB0aGF0IHlvdSBtaWdodCBub3QgaGF2ZSBhY2Nlc3MgdG8uXG4gICAqL1xuICB3aXRoUm9vdEVsZW1lbnQocm9vdEVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+IHwgSFRNTEVsZW1lbnQpOiB0aGlzIHtcbiAgICBjb25zdCBlbGVtZW50ID0gY29lcmNlRWxlbWVudChyb290RWxlbWVudCk7XG5cbiAgICBpZiAoZWxlbWVudCAhPT0gdGhpcy5fcm9vdEVsZW1lbnQpIHtcbiAgICAgIGlmICh0aGlzLl9yb290RWxlbWVudCkge1xuICAgICAgICB0aGlzLl9yZW1vdmVSb290RWxlbWVudExpc3RlbmVycyh0aGlzLl9yb290RWxlbWVudCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fcG9pbnRlckRvd24sIGFjdGl2ZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5fcG9pbnRlckRvd24sIHBhc3NpdmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuX2luaXRpYWxUcmFuc2Zvcm0gPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9yb290RWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBTVkdFbGVtZW50ICE9PSAndW5kZWZpbmVkJyAmJiB0aGlzLl9yb290RWxlbWVudCBpbnN0YW5jZW9mIFNWR0VsZW1lbnQpIHtcbiAgICAgIHRoaXMuX293bmVyU1ZHRWxlbWVudCA9IHRoaXMuX3Jvb3RFbGVtZW50Lm93bmVyU1ZHRWxlbWVudDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBFbGVtZW50IHRvIHdoaWNoIHRoZSBkcmFnZ2FibGUncyBwb3NpdGlvbiB3aWxsIGJlIGNvbnN0cmFpbmVkLlxuICAgKi9cbiAgd2l0aEJvdW5kYXJ5RWxlbWVudChib3VuZGFyeUVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+IHwgSFRNTEVsZW1lbnQgfCBudWxsKTogdGhpcyB7XG4gICAgdGhpcy5fYm91bmRhcnlFbGVtZW50ID0gYm91bmRhcnlFbGVtZW50ID8gY29lcmNlRWxlbWVudChib3VuZGFyeUVsZW1lbnQpIDogbnVsbDtcbiAgICB0aGlzLl9yZXNpemVTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICBpZiAoYm91bmRhcnlFbGVtZW50KSB7XG4gICAgICB0aGlzLl9yZXNpemVTdWJzY3JpcHRpb24gPSB0aGlzLl92aWV3cG9ydFJ1bGVyXG4gICAgICAgIC5jaGFuZ2UoMTApXG4gICAgICAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy5fY29udGFpbkluc2lkZUJvdW5kYXJ5T25SZXNpemUoKSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFNldHMgdGhlIHBhcmVudCByZWYgdGhhdCB0aGUgcmVmIGlzIG5lc3RlZCBpbi4gICovXG4gIHdpdGhQYXJlbnQocGFyZW50OiBEcmFnUmVmPHVua25vd24+IHwgbnVsbCk6IHRoaXMge1xuICAgIHRoaXMuX3BhcmVudERyYWdSZWYgPSBwYXJlbnQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogUmVtb3ZlcyB0aGUgZHJhZ2dpbmcgZnVuY3Rpb25hbGl0eSBmcm9tIHRoZSBET00gZWxlbWVudC4gKi9cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLl9yZW1vdmVSb290RWxlbWVudExpc3RlbmVycyh0aGlzLl9yb290RWxlbWVudCk7XG5cbiAgICAvLyBEbyB0aGlzIGNoZWNrIGJlZm9yZSByZW1vdmluZyBmcm9tIHRoZSByZWdpc3RyeSBzaW5jZSBpdCdsbFxuICAgIC8vIHN0b3AgYmVpbmcgY29uc2lkZXJlZCBhcyBkcmFnZ2VkIG9uY2UgaXQgaXMgcmVtb3ZlZC5cbiAgICBpZiAodGhpcy5pc0RyYWdnaW5nKCkpIHtcbiAgICAgIC8vIFNpbmNlIHdlIG1vdmUgb3V0IHRoZSBlbGVtZW50IHRvIHRoZSBlbmQgb2YgdGhlIGJvZHkgd2hpbGUgaXQncyBiZWluZ1xuICAgICAgLy8gZHJhZ2dlZCwgd2UgaGF2ZSB0byBtYWtlIHN1cmUgdGhhdCBpdCdzIHJlbW92ZWQgaWYgaXQgZ2V0cyBkZXN0cm95ZWQuXG4gICAgICB0aGlzLl9yb290RWxlbWVudD8ucmVtb3ZlKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fYW5jaG9yPy5yZW1vdmUoKTtcbiAgICB0aGlzLl9kZXN0cm95UHJldmlldygpO1xuICAgIHRoaXMuX2Rlc3Ryb3lQbGFjZWhvbGRlcigpO1xuICAgIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkucmVtb3ZlRHJhZ0l0ZW0odGhpcyk7XG4gICAgdGhpcy5fcmVtb3ZlU3Vic2NyaXB0aW9ucygpO1xuICAgIHRoaXMuYmVmb3JlU3RhcnRlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuc3RhcnRlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMucmVsZWFzZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmVuZGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5lbnRlcmVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5leGl0ZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmRyb3BwZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLl9tb3ZlRXZlbnRzLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5faGFuZGxlcyA9IFtdO1xuICAgIHRoaXMuX2Rpc2FibGVkSGFuZGxlcy5jbGVhcigpO1xuICAgIHRoaXMuX2Ryb3BDb250YWluZXIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fcmVzaXplU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLmNsZWFyKCk7XG4gICAgdGhpcy5fYm91bmRhcnlFbGVtZW50ID0gdGhpcy5fcm9vdEVsZW1lbnQgPSB0aGlzLl9vd25lclNWR0VsZW1lbnQgPSB0aGlzLl9wbGFjZWhvbGRlclRlbXBsYXRlID1cbiAgICAgICAgdGhpcy5fcHJldmlld1RlbXBsYXRlID0gdGhpcy5fYW5jaG9yID0gdGhpcy5fcGFyZW50RHJhZ1JlZiA9IG51bGwhO1xuICB9XG5cbiAgLyoqIENoZWNrcyB3aGV0aGVyIHRoZSBlbGVtZW50IGlzIGN1cnJlbnRseSBiZWluZyBkcmFnZ2VkLiAqL1xuICBpc0RyYWdnaW5nKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9oYXNTdGFydGVkRHJhZ2dpbmcgJiYgdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5pc0RyYWdnaW5nKHRoaXMpO1xuICB9XG5cbiAgLyoqIFJlc2V0cyBhIHN0YW5kYWxvbmUgZHJhZyBpdGVtIHRvIGl0cyBpbml0aWFsIHBvc2l0aW9uLiAqL1xuICByZXNldCgpOiB2b2lkIHtcbiAgICB0aGlzLl9yb290RWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSB0aGlzLl9pbml0aWFsVHJhbnNmb3JtIHx8ICcnO1xuICAgIHRoaXMuX2FjdGl2ZVRyYW5zZm9ybSA9IHt4OiAwLCB5OiAwfTtcbiAgICB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtID0ge3g6IDAsIHk6IDB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSBoYW5kbGUgYXMgZGlzYWJsZWQuIFdoaWxlIGEgaGFuZGxlIGlzIGRpc2FibGVkLCBpdCdsbCBjYXB0dXJlIGFuZCBpbnRlcnJ1cHQgZHJhZ2dpbmcuXG4gICAqIEBwYXJhbSBoYW5kbGUgSGFuZGxlIGVsZW1lbnQgdGhhdCBzaG91bGQgYmUgZGlzYWJsZWQuXG4gICAqL1xuICBkaXNhYmxlSGFuZGxlKGhhbmRsZTogSFRNTEVsZW1lbnQpIHtcbiAgICBpZiAoIXRoaXMuX2Rpc2FibGVkSGFuZGxlcy5oYXMoaGFuZGxlKSAmJiB0aGlzLl9oYW5kbGVzLmluZGV4T2YoaGFuZGxlKSA+IC0xKSB7XG4gICAgICB0aGlzLl9kaXNhYmxlZEhhbmRsZXMuYWRkKGhhbmRsZSk7XG4gICAgICB0b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKGhhbmRsZSwgdHJ1ZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEVuYWJsZXMgYSBoYW5kbGUsIGlmIGl0IGhhcyBiZWVuIGRpc2FibGVkLlxuICAgKiBAcGFyYW0gaGFuZGxlIEhhbmRsZSBlbGVtZW50IHRvIGJlIGVuYWJsZWQuXG4gICAqL1xuICBlbmFibGVIYW5kbGUoaGFuZGxlOiBIVE1MRWxlbWVudCkge1xuICAgIGlmICh0aGlzLl9kaXNhYmxlZEhhbmRsZXMuaGFzKGhhbmRsZSkpIHtcbiAgICAgIHRoaXMuX2Rpc2FibGVkSGFuZGxlcy5kZWxldGUoaGFuZGxlKTtcbiAgICAgIHRvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMoaGFuZGxlLCB0aGlzLmRpc2FibGVkKTtcbiAgICB9XG4gIH1cblxuICAvKiogU2V0cyB0aGUgbGF5b3V0IGRpcmVjdGlvbiBvZiB0aGUgZHJhZ2dhYmxlIGl0ZW0uICovXG4gIHdpdGhEaXJlY3Rpb24oZGlyZWN0aW9uOiBEaXJlY3Rpb24pOiB0aGlzIHtcbiAgICB0aGlzLl9kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogU2V0cyB0aGUgY29udGFpbmVyIHRoYXQgdGhlIGl0ZW0gaXMgcGFydCBvZi4gKi9cbiAgX3dpdGhEcm9wQ29udGFpbmVyKGNvbnRhaW5lcjogRHJvcExpc3RSZWYpIHtcbiAgICB0aGlzLl9kcm9wQ29udGFpbmVyID0gY29udGFpbmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgcG9zaXRpb24gaW4gcGl4ZWxzIHRoZSBkcmFnZ2FibGUgb3V0c2lkZSBvZiBhIGRyb3AgY29udGFpbmVyLlxuICAgKi9cbiAgZ2V0RnJlZURyYWdQb3NpdGlvbigpOiBSZWFkb25seTxQb2ludD4ge1xuICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5pc0RyYWdnaW5nKCkgPyB0aGlzLl9hY3RpdmVUcmFuc2Zvcm0gOiB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtO1xuICAgIHJldHVybiB7eDogcG9zaXRpb24ueCwgeTogcG9zaXRpb24ueX07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY3VycmVudCBwb3NpdGlvbiBpbiBwaXhlbHMgdGhlIGRyYWdnYWJsZSBvdXRzaWRlIG9mIGEgZHJvcCBjb250YWluZXIuXG4gICAqIEBwYXJhbSB2YWx1ZSBOZXcgcG9zaXRpb24gdG8gYmUgc2V0LlxuICAgKi9cbiAgc2V0RnJlZURyYWdQb3NpdGlvbih2YWx1ZTogUG9pbnQpOiB0aGlzIHtcbiAgICB0aGlzLl9hY3RpdmVUcmFuc2Zvcm0gPSB7eDogMCwgeTogMH07XG4gICAgdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybS54ID0gdmFsdWUueDtcbiAgICB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtLnkgPSB2YWx1ZS55O1xuXG4gICAgaWYgKCF0aGlzLl9kcm9wQ29udGFpbmVyKSB7XG4gICAgICB0aGlzLl9hcHBseVJvb3RFbGVtZW50VHJhbnNmb3JtKHZhbHVlLngsIHZhbHVlLnkpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGNvbnRhaW5lciBpbnRvIHdoaWNoIHRvIGluc2VydCB0aGUgcHJldmlldyBlbGVtZW50LlxuICAgKiBAcGFyYW0gdmFsdWUgQ29udGFpbmVyIGludG8gd2hpY2ggdG8gaW5zZXJ0IHRoZSBwcmV2aWV3LlxuICAgKi9cbiAgd2l0aFByZXZpZXdDb250YWluZXIodmFsdWU6IFByZXZpZXdDb250YWluZXIpOiB0aGlzIHtcbiAgICB0aGlzLl9wcmV2aWV3Q29udGFpbmVyID0gdmFsdWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogVXBkYXRlcyB0aGUgaXRlbSdzIHNvcnQgb3JkZXIgYmFzZWQgb24gdGhlIGxhc3Qta25vd24gcG9pbnRlciBwb3NpdGlvbi4gKi9cbiAgX3NvcnRGcm9tTGFzdFBvaW50ZXJQb3NpdGlvbigpIHtcbiAgICBjb25zdCBwb3NpdGlvbiA9IHRoaXMuX2xhc3RLbm93blBvaW50ZXJQb3NpdGlvbjtcblxuICAgIGlmIChwb3NpdGlvbiAmJiB0aGlzLl9kcm9wQ29udGFpbmVyKSB7XG4gICAgICB0aGlzLl91cGRhdGVBY3RpdmVEcm9wQ29udGFpbmVyKHRoaXMuX2dldENvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uKHBvc2l0aW9uKSwgcG9zaXRpb24pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBVbnN1YnNjcmliZXMgZnJvbSB0aGUgZ2xvYmFsIHN1YnNjcmlwdGlvbnMuICovXG4gIHByaXZhdGUgX3JlbW92ZVN1YnNjcmlwdGlvbnMoKSB7XG4gICAgdGhpcy5fcG9pbnRlck1vdmVTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9wb2ludGVyVXBTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9zY3JvbGxTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIC8qKiBEZXN0cm95cyB0aGUgcHJldmlldyBlbGVtZW50IGFuZCBpdHMgVmlld1JlZi4gKi9cbiAgcHJpdmF0ZSBfZGVzdHJveVByZXZpZXcoKSB7XG4gICAgdGhpcy5fcHJldmlldz8ucmVtb3ZlKCk7XG4gICAgdGhpcy5fcHJldmlld1JlZj8uZGVzdHJveSgpO1xuICAgIHRoaXMuX3ByZXZpZXcgPSB0aGlzLl9wcmV2aWV3UmVmID0gbnVsbCE7XG4gIH1cblxuICAvKiogRGVzdHJveXMgdGhlIHBsYWNlaG9sZGVyIGVsZW1lbnQgYW5kIGl0cyBWaWV3UmVmLiAqL1xuICBwcml2YXRlIF9kZXN0cm95UGxhY2Vob2xkZXIoKSB7XG4gICAgdGhpcy5fcGxhY2Vob2xkZXI/LnJlbW92ZSgpO1xuICAgIHRoaXMuX3BsYWNlaG9sZGVyUmVmPy5kZXN0cm95KCk7XG4gICAgdGhpcy5fcGxhY2Vob2xkZXIgPSB0aGlzLl9wbGFjZWhvbGRlclJlZiA9IG51bGwhO1xuICB9XG5cbiAgLyoqIEhhbmRsZXIgZm9yIHRoZSBgbW91c2Vkb3duYC9gdG91Y2hzdGFydGAgZXZlbnRzLiAqL1xuICBwcml2YXRlIF9wb2ludGVyRG93biA9IChldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpID0+IHtcbiAgICB0aGlzLmJlZm9yZVN0YXJ0ZWQubmV4dCgpO1xuXG4gICAgLy8gRGVsZWdhdGUgdGhlIGV2ZW50IGJhc2VkIG9uIHdoZXRoZXIgaXQgc3RhcnRlZCBmcm9tIGEgaGFuZGxlIG9yIHRoZSBlbGVtZW50IGl0c2VsZi5cbiAgICBpZiAodGhpcy5faGFuZGxlcy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHRhcmdldEhhbmRsZSA9IHRoaXMuX2hhbmRsZXMuZmluZChoYW5kbGUgPT4ge1xuICAgICAgICBjb25zdCB0YXJnZXQgPSBfZ2V0RXZlbnRUYXJnZXQoZXZlbnQpO1xuICAgICAgICByZXR1cm4gISF0YXJnZXQgJiYgKHRhcmdldCA9PT0gaGFuZGxlIHx8IGhhbmRsZS5jb250YWlucyh0YXJnZXQgYXMgSFRNTEVsZW1lbnQpKTtcbiAgICAgIH0pO1xuXG4gICAgICBpZiAodGFyZ2V0SGFuZGxlICYmICF0aGlzLl9kaXNhYmxlZEhhbmRsZXMuaGFzKHRhcmdldEhhbmRsZSkgJiYgIXRoaXMuZGlzYWJsZWQpIHtcbiAgICAgICAgdGhpcy5faW5pdGlhbGl6ZURyYWdTZXF1ZW5jZSh0YXJnZXRIYW5kbGUsIGV2ZW50KTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCF0aGlzLmRpc2FibGVkKSB7XG4gICAgICB0aGlzLl9pbml0aWFsaXplRHJhZ1NlcXVlbmNlKHRoaXMuX3Jvb3RFbGVtZW50LCBldmVudCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEhhbmRsZXIgdGhhdCBpcyBpbnZva2VkIHdoZW4gdGhlIHVzZXIgbW92ZXMgdGhlaXIgcG9pbnRlciBhZnRlciB0aGV5J3ZlIGluaXRpYXRlZCBhIGRyYWcuICovXG4gIHByaXZhdGUgX3BvaW50ZXJNb3ZlID0gKGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCkgPT4ge1xuICAgIGNvbnN0IHBvaW50ZXJQb3NpdGlvbiA9IHRoaXMuX2dldFBvaW50ZXJQb3NpdGlvbk9uUGFnZShldmVudCk7XG5cbiAgICBpZiAoIXRoaXMuX2hhc1N0YXJ0ZWREcmFnZ2luZykge1xuICAgICAgY29uc3QgZGlzdGFuY2VYID0gTWF0aC5hYnMocG9pbnRlclBvc2l0aW9uLnggLSB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZS54KTtcbiAgICAgIGNvbnN0IGRpc3RhbmNlWSA9IE1hdGguYWJzKHBvaW50ZXJQb3NpdGlvbi55IC0gdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UueSk7XG4gICAgICBjb25zdCBpc092ZXJUaHJlc2hvbGQgPSBkaXN0YW5jZVggKyBkaXN0YW5jZVkgPj0gdGhpcy5fY29uZmlnLmRyYWdTdGFydFRocmVzaG9sZDtcblxuICAgICAgLy8gT25seSBzdGFydCBkcmFnZ2luZyBhZnRlciB0aGUgdXNlciBoYXMgbW92ZWQgbW9yZSB0aGFuIHRoZSBtaW5pbXVtIGRpc3RhbmNlIGluIGVpdGhlclxuICAgICAgLy8gZGlyZWN0aW9uLiBOb3RlIHRoYXQgdGhpcyBpcyBwcmVmZXJyYWJsZSBvdmVyIGRvaW5nIHNvbWV0aGluZyBsaWtlIGBza2lwKG1pbmltdW1EaXN0YW5jZSlgXG4gICAgICAvLyBpbiB0aGUgYHBvaW50ZXJNb3ZlYCBzdWJzY3JpcHRpb24sIGJlY2F1c2Ugd2UncmUgbm90IGd1YXJhbnRlZWQgdG8gaGF2ZSBvbmUgbW92ZSBldmVudFxuICAgICAgLy8gcGVyIHBpeGVsIG9mIG1vdmVtZW50IChlLmcuIGlmIHRoZSB1c2VyIG1vdmVzIHRoZWlyIHBvaW50ZXIgcXVpY2tseSkuXG4gICAgICBpZiAoaXNPdmVyVGhyZXNob2xkKSB7XG4gICAgICAgIGNvbnN0IGlzRGVsYXlFbGFwc2VkID0gRGF0ZS5ub3coKSA+PSB0aGlzLl9kcmFnU3RhcnRUaW1lICsgdGhpcy5fZ2V0RHJhZ1N0YXJ0RGVsYXkoZXZlbnQpO1xuICAgICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLl9kcm9wQ29udGFpbmVyO1xuXG4gICAgICAgIGlmICghaXNEZWxheUVsYXBzZWQpIHtcbiAgICAgICAgICB0aGlzLl9lbmREcmFnU2VxdWVuY2UoZXZlbnQpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByZXZlbnQgb3RoZXIgZHJhZyBzZXF1ZW5jZXMgZnJvbSBzdGFydGluZyB3aGlsZSBzb21ldGhpbmcgaW4gdGhlIGNvbnRhaW5lciBpcyBzdGlsbFxuICAgICAgICAvLyBiZWluZyBkcmFnZ2VkLiBUaGlzIGNhbiBoYXBwZW4gd2hpbGUgd2UncmUgd2FpdGluZyBmb3IgdGhlIGRyb3AgYW5pbWF0aW9uIHRvIGZpbmlzaFxuICAgICAgICAvLyBhbmQgY2FuIGNhdXNlIGVycm9ycywgYmVjYXVzZSBzb21lIGVsZW1lbnRzIG1pZ2h0IHN0aWxsIGJlIG1vdmluZyBhcm91bmQuXG4gICAgICAgIGlmICghY29udGFpbmVyIHx8ICghY29udGFpbmVyLmlzRHJhZ2dpbmcoKSAmJiAhY29udGFpbmVyLmlzUmVjZWl2aW5nKCkpKSB7XG4gICAgICAgICAgLy8gUHJldmVudCB0aGUgZGVmYXVsdCBhY3Rpb24gYXMgc29vbiBhcyB0aGUgZHJhZ2dpbmcgc2VxdWVuY2UgaXMgY29uc2lkZXJlZCBhc1xuICAgICAgICAgIC8vIFwic3RhcnRlZFwiIHNpbmNlIHdhaXRpbmcgZm9yIHRoZSBuZXh0IGV2ZW50IGNhbiBhbGxvdyB0aGUgZGV2aWNlIHRvIGJlZ2luIHNjcm9sbGluZy5cbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHRoaXMuX2hhc1N0YXJ0ZWREcmFnZ2luZyA9IHRydWU7XG4gICAgICAgICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiB0aGlzLl9zdGFydERyYWdTZXF1ZW5jZShldmVudCkpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBXZSBvbmx5IG5lZWQgdGhlIHByZXZpZXcgZGltZW5zaW9ucyBpZiB3ZSBoYXZlIGEgYm91bmRhcnkgZWxlbWVudC5cbiAgICBpZiAodGhpcy5fYm91bmRhcnlFbGVtZW50KSB7XG4gICAgICAvLyBDYWNoZSB0aGUgcHJldmlldyBlbGVtZW50IHJlY3QgaWYgd2UgaGF2ZW4ndCBjYWNoZWQgaXQgYWxyZWFkeSBvciBpZlxuICAgICAgLy8gd2UgY2FjaGVkIGl0IHRvbyBlYXJseSBiZWZvcmUgdGhlIGVsZW1lbnQgZGltZW5zaW9ucyB3ZXJlIGNvbXB1dGVkLlxuICAgICAgaWYgKCF0aGlzLl9wcmV2aWV3UmVjdCB8fCAoIXRoaXMuX3ByZXZpZXdSZWN0LndpZHRoICYmICF0aGlzLl9wcmV2aWV3UmVjdC5oZWlnaHQpKSB7XG4gICAgICAgIHRoaXMuX3ByZXZpZXdSZWN0ID0gKHRoaXMuX3ByZXZpZXcgfHwgdGhpcy5fcm9vdEVsZW1lbnQpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFdlIHByZXZlbnQgdGhlIGRlZmF1bHQgYWN0aW9uIGRvd24gaGVyZSBzbyB0aGF0IHdlIGtub3cgdGhhdCBkcmFnZ2luZyBoYXMgc3RhcnRlZC4gVGhpcyBpc1xuICAgIC8vIGltcG9ydGFudCBmb3IgdG91Y2ggZGV2aWNlcyB3aGVyZSBkb2luZyB0aGlzIHRvbyBlYXJseSBjYW4gdW5uZWNlc3NhcmlseSBibG9jayBzY3JvbGxpbmcsXG4gICAgLy8gaWYgdGhlcmUncyBhIGRyYWdnaW5nIGRlbGF5LlxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICBjb25zdCBjb25zdHJhaW5lZFBvaW50ZXJQb3NpdGlvbiA9IHRoaXMuX2dldENvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uKHBvaW50ZXJQb3NpdGlvbik7XG4gICAgdGhpcy5faGFzTW92ZWQgPSB0cnVlO1xuICAgIHRoaXMuX2xhc3RLbm93blBvaW50ZXJQb3NpdGlvbiA9IHBvaW50ZXJQb3NpdGlvbjtcbiAgICB0aGlzLl91cGRhdGVQb2ludGVyRGlyZWN0aW9uRGVsdGEoY29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24pO1xuXG4gICAgaWYgKHRoaXMuX2Ryb3BDb250YWluZXIpIHtcbiAgICAgIHRoaXMuX3VwZGF0ZUFjdGl2ZURyb3BDb250YWluZXIoY29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24sIHBvaW50ZXJQb3NpdGlvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGFjdGl2ZVRyYW5zZm9ybSA9IHRoaXMuX2FjdGl2ZVRyYW5zZm9ybTtcbiAgICAgIGFjdGl2ZVRyYW5zZm9ybS54ID1cbiAgICAgICAgICBjb25zdHJhaW5lZFBvaW50ZXJQb3NpdGlvbi54IC0gdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UueCArIHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm0ueDtcbiAgICAgIGFjdGl2ZVRyYW5zZm9ybS55ID1cbiAgICAgICAgICBjb25zdHJhaW5lZFBvaW50ZXJQb3NpdGlvbi55IC0gdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UueSArIHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm0ueTtcblxuICAgICAgdGhpcy5fYXBwbHlSb290RWxlbWVudFRyYW5zZm9ybShhY3RpdmVUcmFuc2Zvcm0ueCwgYWN0aXZlVHJhbnNmb3JtLnkpO1xuICAgIH1cblxuICAgIC8vIFNpbmNlIHRoaXMgZXZlbnQgZ2V0cyBmaXJlZCBmb3IgZXZlcnkgcGl4ZWwgd2hpbGUgZHJhZ2dpbmcsIHdlIG9ubHlcbiAgICAvLyB3YW50IHRvIGZpcmUgaXQgaWYgdGhlIGNvbnN1bWVyIG9wdGVkIGludG8gaXQuIEFsc28gd2UgaGF2ZSB0b1xuICAgIC8vIHJlLWVudGVyIHRoZSB6b25lIGJlY2F1c2Ugd2UgcnVuIGFsbCBvZiB0aGUgZXZlbnRzIG9uIHRoZSBvdXRzaWRlLlxuICAgIGlmICh0aGlzLl9tb3ZlRXZlbnRzLm9ic2VydmVycy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICB0aGlzLl9tb3ZlRXZlbnRzLm5leHQoe1xuICAgICAgICAgIHNvdXJjZTogdGhpcyxcbiAgICAgICAgICBwb2ludGVyUG9zaXRpb246IGNvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uLFxuICAgICAgICAgIGV2ZW50LFxuICAgICAgICAgIGRpc3RhbmNlOiB0aGlzLl9nZXREcmFnRGlzdGFuY2UoY29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24pLFxuICAgICAgICAgIGRlbHRhOiB0aGlzLl9wb2ludGVyRGlyZWN0aW9uRGVsdGFcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKiogSGFuZGxlciB0aGF0IGlzIGludm9rZWQgd2hlbiB0aGUgdXNlciBsaWZ0cyB0aGVpciBwb2ludGVyIHVwLCBhZnRlciBpbml0aWF0aW5nIGEgZHJhZy4gKi9cbiAgcHJpdmF0ZSBfcG9pbnRlclVwID0gKGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCkgPT4ge1xuICAgIHRoaXMuX2VuZERyYWdTZXF1ZW5jZShldmVudCk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIHN1YnNjcmlwdGlvbnMgYW5kIHN0b3BzIHRoZSBkcmFnZ2luZyBzZXF1ZW5jZS5cbiAgICogQHBhcmFtIGV2ZW50IEJyb3dzZXIgZXZlbnQgb2JqZWN0IHRoYXQgZW5kZWQgdGhlIHNlcXVlbmNlLlxuICAgKi9cbiAgcHJpdmF0ZSBfZW5kRHJhZ1NlcXVlbmNlKGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCkge1xuICAgIC8vIE5vdGUgdGhhdCBoZXJlIHdlIHVzZSBgaXNEcmFnZ2luZ2AgZnJvbSB0aGUgc2VydmljZSwgcmF0aGVyIHRoYW4gZnJvbSBgdGhpc2AuXG4gICAgLy8gVGhlIGRpZmZlcmVuY2UgaXMgdGhhdCB0aGUgb25lIGZyb20gdGhlIHNlcnZpY2UgcmVmbGVjdHMgd2hldGhlciBhIGRyYWdnaW5nIHNlcXVlbmNlXG4gICAgLy8gaGFzIGJlZW4gaW5pdGlhdGVkLCB3aGVyZWFzIHRoZSBvbmUgb24gYHRoaXNgIGluY2x1ZGVzIHdoZXRoZXIgdGhlIHVzZXIgaGFzIHBhc3NlZFxuICAgIC8vIHRoZSBtaW5pbXVtIGRyYWdnaW5nIHRocmVzaG9sZC5cbiAgICBpZiAoIXRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuaXNEcmFnZ2luZyh0aGlzKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3JlbW92ZVN1YnNjcmlwdGlvbnMoKTtcbiAgICB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnN0b3BEcmFnZ2luZyh0aGlzKTtcbiAgICB0aGlzLl90b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKCk7XG5cbiAgICBpZiAodGhpcy5faGFuZGxlcykge1xuICAgICAgKHRoaXMuX3Jvb3RFbGVtZW50LnN0eWxlIGFzIGFueSkud2Via2l0VGFwSGlnaGxpZ2h0Q29sb3IgPSB0aGlzLl9yb290RWxlbWVudFRhcEhpZ2hsaWdodDtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX2hhc1N0YXJ0ZWREcmFnZ2luZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMucmVsZWFzZWQubmV4dCh7c291cmNlOiB0aGlzfSk7XG5cbiAgICBpZiAodGhpcy5fZHJvcENvbnRhaW5lcikge1xuICAgICAgLy8gU3RvcCBzY3JvbGxpbmcgaW1tZWRpYXRlbHksIGluc3RlYWQgb2Ygd2FpdGluZyBmb3IgdGhlIGFuaW1hdGlvbiB0byBmaW5pc2guXG4gICAgICB0aGlzLl9kcm9wQ29udGFpbmVyLl9zdG9wU2Nyb2xsaW5nKCk7XG4gICAgICB0aGlzLl9hbmltYXRlUHJldmlld1RvUGxhY2Vob2xkZXIoKS50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5fY2xlYW51cERyYWdBcnRpZmFjdHMoZXZlbnQpO1xuICAgICAgICB0aGlzLl9jbGVhbnVwQ2FjaGVkRGltZW5zaW9ucygpO1xuICAgICAgICB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnN0b3BEcmFnZ2luZyh0aGlzKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBDb252ZXJ0IHRoZSBhY3RpdmUgdHJhbnNmb3JtIGludG8gYSBwYXNzaXZlIG9uZS4gVGhpcyBtZWFucyB0aGF0IG5leHQgdGltZVxuICAgICAgLy8gdGhlIHVzZXIgc3RhcnRzIGRyYWdnaW5nIHRoZSBpdGVtLCBpdHMgcG9zaXRpb24gd2lsbCBiZSBjYWxjdWxhdGVkIHJlbGF0aXZlbHlcbiAgICAgIC8vIHRvIHRoZSBuZXcgcGFzc2l2ZSB0cmFuc2Zvcm0uXG4gICAgICB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtLnggPSB0aGlzLl9hY3RpdmVUcmFuc2Zvcm0ueDtcbiAgICAgIGNvbnN0IHBvaW50ZXJQb3NpdGlvbiA9IHRoaXMuX2dldFBvaW50ZXJQb3NpdGlvbk9uUGFnZShldmVudCk7XG4gICAgICB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtLnkgPSB0aGlzLl9hY3RpdmVUcmFuc2Zvcm0ueTtcbiAgICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICB0aGlzLmVuZGVkLm5leHQoe1xuICAgICAgICAgIHNvdXJjZTogdGhpcyxcbiAgICAgICAgICBkaXN0YW5jZTogdGhpcy5fZ2V0RHJhZ0Rpc3RhbmNlKHBvaW50ZXJQb3NpdGlvbiksXG4gICAgICAgICAgZHJvcFBvaW50OiBwb2ludGVyUG9zaXRpb25cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuX2NsZWFudXBDYWNoZWREaW1lbnNpb25zKCk7XG4gICAgICB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnN0b3BEcmFnZ2luZyh0aGlzKTtcbiAgICB9XG4gIH1cblxuICAvKiogU3RhcnRzIHRoZSBkcmFnZ2luZyBzZXF1ZW5jZS4gKi9cbiAgcHJpdmF0ZSBfc3RhcnREcmFnU2VxdWVuY2UoZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KSB7XG4gICAgaWYgKGlzVG91Y2hFdmVudChldmVudCkpIHtcbiAgICAgIHRoaXMuX2xhc3RUb3VjaEV2ZW50VGltZSA9IERhdGUubm93KCk7XG4gICAgfVxuXG4gICAgdGhpcy5fdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucygpO1xuXG4gICAgY29uc3QgZHJvcENvbnRhaW5lciA9IHRoaXMuX2Ryb3BDb250YWluZXI7XG5cbiAgICBpZiAoZHJvcENvbnRhaW5lcikge1xuICAgICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX3Jvb3RFbGVtZW50O1xuICAgICAgY29uc3QgcGFyZW50ID0gZWxlbWVudC5wYXJlbnROb2RlIGFzIEhUTUxFbGVtZW50O1xuICAgICAgY29uc3QgcGxhY2Vob2xkZXIgPSB0aGlzLl9wbGFjZWhvbGRlciA9IHRoaXMuX2NyZWF0ZVBsYWNlaG9sZGVyRWxlbWVudCgpO1xuICAgICAgY29uc3QgYW5jaG9yID0gdGhpcy5fYW5jaG9yID0gdGhpcy5fYW5jaG9yIHx8IHRoaXMuX2RvY3VtZW50LmNyZWF0ZUNvbW1lbnQoJycpO1xuXG4gICAgICAvLyBOZWVkcyB0byBoYXBwZW4gYmVmb3JlIHRoZSByb290IGVsZW1lbnQgaXMgbW92ZWQuXG4gICAgICBjb25zdCBzaGFkb3dSb290ID0gdGhpcy5fZ2V0U2hhZG93Um9vdCgpO1xuXG4gICAgICAvLyBJbnNlcnQgYW4gYW5jaG9yIG5vZGUgc28gdGhhdCB3ZSBjYW4gcmVzdG9yZSB0aGUgZWxlbWVudCdzIHBvc2l0aW9uIGluIHRoZSBET00uXG4gICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGFuY2hvciwgZWxlbWVudCk7XG5cbiAgICAgIC8vIFRoZXJlJ3Mgbm8gcmlzayBvZiB0cmFuc2Zvcm1zIHN0YWNraW5nIHdoZW4gaW5zaWRlIGEgZHJvcCBjb250YWluZXIgc29cbiAgICAgIC8vIHdlIGNhbiBrZWVwIHRoZSBpbml0aWFsIHRyYW5zZm9ybSB1cCB0byBkYXRlIGFueSB0aW1lIGRyYWdnaW5nIHN0YXJ0cy5cbiAgICAgIHRoaXMuX2luaXRpYWxUcmFuc2Zvcm0gPSBlbGVtZW50LnN0eWxlLnRyYW5zZm9ybSB8fCAnJztcblxuICAgICAgLy8gQ3JlYXRlIHRoZSBwcmV2aWV3IGFmdGVyIHRoZSBpbml0aWFsIHRyYW5zZm9ybSBoYXNcbiAgICAgIC8vIGJlZW4gY2FjaGVkLCBiZWNhdXNlIGl0IGNhbiBiZSBhZmZlY3RlZCBieSB0aGUgdHJhbnNmb3JtLlxuICAgICAgdGhpcy5fcHJldmlldyA9IHRoaXMuX2NyZWF0ZVByZXZpZXdFbGVtZW50KCk7XG5cbiAgICAgIC8vIFdlIG1vdmUgdGhlIGVsZW1lbnQgb3V0IGF0IHRoZSBlbmQgb2YgdGhlIGJvZHkgYW5kIHdlIG1ha2UgaXQgaGlkZGVuLCBiZWNhdXNlIGtlZXBpbmcgaXQgaW5cbiAgICAgIC8vIHBsYWNlIHdpbGwgdGhyb3cgb2ZmIHRoZSBjb25zdW1lcidzIGA6bGFzdC1jaGlsZGAgc2VsZWN0b3JzLiBXZSBjYW4ndCByZW1vdmUgdGhlIGVsZW1lbnRcbiAgICAgIC8vIGZyb20gdGhlIERPTSBjb21wbGV0ZWx5LCBiZWNhdXNlIGlPUyB3aWxsIHN0b3AgZmlyaW5nIGFsbCBzdWJzZXF1ZW50IGV2ZW50cyBpbiB0aGUgY2hhaW4uXG4gICAgICB0b2dnbGVWaXNpYmlsaXR5KGVsZW1lbnQsIGZhbHNlLCBkcmFnSW1wb3J0YW50UHJvcGVydGllcyk7XG4gICAgICB0aGlzLl9kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHBhcmVudC5yZXBsYWNlQ2hpbGQocGxhY2Vob2xkZXIsIGVsZW1lbnQpKTtcbiAgICAgIHRoaXMuX2dldFByZXZpZXdJbnNlcnRpb25Qb2ludChwYXJlbnQsIHNoYWRvd1Jvb3QpLmFwcGVuZENoaWxkKHRoaXMuX3ByZXZpZXcpO1xuICAgICAgdGhpcy5zdGFydGVkLm5leHQoe3NvdXJjZTogdGhpc30pOyAvLyBFbWl0IGJlZm9yZSBub3RpZnlpbmcgdGhlIGNvbnRhaW5lci5cbiAgICAgIGRyb3BDb250YWluZXIuc3RhcnQoKTtcbiAgICAgIHRoaXMuX2luaXRpYWxDb250YWluZXIgPSBkcm9wQ29udGFpbmVyO1xuICAgICAgdGhpcy5faW5pdGlhbEluZGV4ID0gZHJvcENvbnRhaW5lci5nZXRJdGVtSW5kZXgodGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3RhcnRlZC5uZXh0KHtzb3VyY2U6IHRoaXN9KTtcbiAgICAgIHRoaXMuX2luaXRpYWxDb250YWluZXIgPSB0aGlzLl9pbml0aWFsSW5kZXggPSB1bmRlZmluZWQhO1xuICAgIH1cblxuICAgIC8vIEltcG9ydGFudCB0byBydW4gYWZ0ZXIgd2UndmUgY2FsbGVkIGBzdGFydGAgb24gdGhlIHBhcmVudCBjb250YWluZXJcbiAgICAvLyBzbyB0aGF0IGl0IGhhcyBoYWQgdGltZSB0byByZXNvbHZlIGl0cyBzY3JvbGxhYmxlIHBhcmVudHMuXG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLmNhY2hlKGRyb3BDb250YWluZXIgPyBkcm9wQ29udGFpbmVyLmdldFNjcm9sbGFibGVQYXJlbnRzKCkgOiBbXSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCB0aGUgZGlmZmVyZW50IHZhcmlhYmxlcyBhbmQgc3Vic2NyaXB0aW9uc1xuICAgKiB0aGF0IHdpbGwgYmUgbmVjZXNzYXJ5IGZvciB0aGUgZHJhZ2dpbmcgc2VxdWVuY2UuXG4gICAqIEBwYXJhbSByZWZlcmVuY2VFbGVtZW50IEVsZW1lbnQgdGhhdCBzdGFydGVkIHRoZSBkcmFnIHNlcXVlbmNlLlxuICAgKiBAcGFyYW0gZXZlbnQgQnJvd3NlciBldmVudCBvYmplY3QgdGhhdCBzdGFydGVkIHRoZSBzZXF1ZW5jZS5cbiAgICovXG4gIHByaXZhdGUgX2luaXRpYWxpemVEcmFnU2VxdWVuY2UocmVmZXJlbmNlRWxlbWVudDogSFRNTEVsZW1lbnQsIGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCkge1xuICAgIC8vIFN0b3AgcHJvcGFnYXRpb24gaWYgdGhlIGl0ZW0gaXMgaW5zaWRlIGFub3RoZXJcbiAgICAvLyBkcmFnZ2FibGUgc28gd2UgZG9uJ3Qgc3RhcnQgbXVsdGlwbGUgZHJhZyBzZXF1ZW5jZXMuXG4gICAgaWYgKHRoaXMuX3BhcmVudERyYWdSZWYpIHtcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cblxuICAgIGNvbnN0IGlzRHJhZ2dpbmcgPSB0aGlzLmlzRHJhZ2dpbmcoKTtcbiAgICBjb25zdCBpc1RvdWNoU2VxdWVuY2UgPSBpc1RvdWNoRXZlbnQoZXZlbnQpO1xuICAgIGNvbnN0IGlzQXV4aWxpYXJ5TW91c2VCdXR0b24gPSAhaXNUb3VjaFNlcXVlbmNlICYmIChldmVudCBhcyBNb3VzZUV2ZW50KS5idXR0b24gIT09IDA7XG4gICAgY29uc3Qgcm9vdEVsZW1lbnQgPSB0aGlzLl9yb290RWxlbWVudDtcbiAgICBjb25zdCB0YXJnZXQgPSBfZ2V0RXZlbnRUYXJnZXQoZXZlbnQpO1xuICAgIGNvbnN0IGlzU3ludGhldGljRXZlbnQgPSAhaXNUb3VjaFNlcXVlbmNlICYmIHRoaXMuX2xhc3RUb3VjaEV2ZW50VGltZSAmJlxuICAgICAgdGhpcy5fbGFzdFRvdWNoRXZlbnRUaW1lICsgTU9VU0VfRVZFTlRfSUdOT1JFX1RJTUUgPiBEYXRlLm5vdygpO1xuICAgIGNvbnN0IGlzRmFrZUV2ZW50ID0gaXNUb3VjaFNlcXVlbmNlID8gaXNGYWtlVG91Y2hzdGFydEZyb21TY3JlZW5SZWFkZXIoZXZlbnQgYXMgVG91Y2hFdmVudCkgOlxuICAgICAgaXNGYWtlTW91c2Vkb3duRnJvbVNjcmVlblJlYWRlcihldmVudCBhcyBNb3VzZUV2ZW50KTtcblxuICAgIC8vIElmIHRoZSBldmVudCBzdGFydGVkIGZyb20gYW4gZWxlbWVudCB3aXRoIHRoZSBuYXRpdmUgSFRNTCBkcmFnJmRyb3AsIGl0J2xsIGludGVyZmVyZVxuICAgIC8vIHdpdGggb3VyIG93biBkcmFnZ2luZyAoZS5nLiBgaW1nYCB0YWdzIGRvIGl0IGJ5IGRlZmF1bHQpLiBQcmV2ZW50IHRoZSBkZWZhdWx0IGFjdGlvblxuICAgIC8vIHRvIHN0b3AgaXQgZnJvbSBoYXBwZW5pbmcuIE5vdGUgdGhhdCBwcmV2ZW50aW5nIG9uIGBkcmFnc3RhcnRgIGFsc28gc2VlbXMgdG8gd29yaywgYnV0XG4gICAgLy8gaXQncyBmbGFreSBhbmQgaXQgZmFpbHMgaWYgdGhlIHVzZXIgZHJhZ3MgaXQgYXdheSBxdWlja2x5LiBBbHNvIG5vdGUgdGhhdCB3ZSBvbmx5IHdhbnRcbiAgICAvLyB0byBkbyB0aGlzIGZvciBgbW91c2Vkb3duYCBzaW5jZSBkb2luZyB0aGUgc2FtZSBmb3IgYHRvdWNoc3RhcnRgIHdpbGwgc3RvcCBhbnkgYGNsaWNrYFxuICAgIC8vIGV2ZW50cyBmcm9tIGZpcmluZyBvbiB0b3VjaCBkZXZpY2VzLlxuICAgIGlmICh0YXJnZXQgJiYgKHRhcmdldCBhcyBIVE1MRWxlbWVudCkuZHJhZ2dhYmxlICYmIGV2ZW50LnR5cGUgPT09ICdtb3VzZWRvd24nKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cblxuICAgIC8vIEFib3J0IGlmIHRoZSB1c2VyIGlzIGFscmVhZHkgZHJhZ2dpbmcgb3IgaXMgdXNpbmcgYSBtb3VzZSBidXR0b24gb3RoZXIgdGhhbiB0aGUgcHJpbWFyeSBvbmUuXG4gICAgaWYgKGlzRHJhZ2dpbmcgfHwgaXNBdXhpbGlhcnlNb3VzZUJ1dHRvbiB8fCBpc1N5bnRoZXRpY0V2ZW50IHx8IGlzRmFrZUV2ZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSWYgd2UndmUgZ290IGhhbmRsZXMsIHdlIG5lZWQgdG8gZGlzYWJsZSB0aGUgdGFwIGhpZ2hsaWdodCBvbiB0aGUgZW50aXJlIHJvb3QgZWxlbWVudCxcbiAgICAvLyBvdGhlcndpc2UgaU9TIHdpbGwgc3RpbGwgYWRkIGl0LCBldmVuIHRob3VnaCBhbGwgdGhlIGRyYWcgaW50ZXJhY3Rpb25zIG9uIHRoZSBoYW5kbGVcbiAgICAvLyBhcmUgZGlzYWJsZWQuXG4gICAgaWYgKHRoaXMuX2hhbmRsZXMubGVuZ3RoKSB7XG4gICAgICBjb25zdCByb290U3R5bGVzID0gcm9vdEVsZW1lbnQuc3R5bGUgYXMgYW55O1xuICAgICAgdGhpcy5fcm9vdEVsZW1lbnRUYXBIaWdobGlnaHQgPSByb290U3R5bGVzLndlYmtpdFRhcEhpZ2hsaWdodENvbG9yIHx8ICcnO1xuICAgICAgcm9vdFN0eWxlcy53ZWJraXRUYXBIaWdobGlnaHRDb2xvciA9ICd0cmFuc3BhcmVudCc7XG4gICAgfVxuXG4gICAgdGhpcy5faGFzU3RhcnRlZERyYWdnaW5nID0gdGhpcy5faGFzTW92ZWQgPSBmYWxzZTtcblxuICAgIC8vIEF2b2lkIG11bHRpcGxlIHN1YnNjcmlwdGlvbnMgYW5kIG1lbW9yeSBsZWFrcyB3aGVuIG11bHRpIHRvdWNoXG4gICAgLy8gKGlzRHJhZ2dpbmcgY2hlY2sgYWJvdmUgaXNuJ3QgZW5vdWdoIGJlY2F1c2Ugb2YgcG9zc2libGUgdGVtcG9yYWwgYW5kL29yIGRpbWVuc2lvbmFsIGRlbGF5cylcbiAgICB0aGlzLl9yZW1vdmVTdWJzY3JpcHRpb25zKCk7XG4gICAgdGhpcy5fcG9pbnRlck1vdmVTdWJzY3JpcHRpb24gPSB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnBvaW50ZXJNb3ZlLnN1YnNjcmliZSh0aGlzLl9wb2ludGVyTW92ZSk7XG4gICAgdGhpcy5fcG9pbnRlclVwU3Vic2NyaXB0aW9uID0gdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5wb2ludGVyVXAuc3Vic2NyaWJlKHRoaXMuX3BvaW50ZXJVcCk7XG4gICAgdGhpcy5fc2Nyb2xsU3Vic2NyaXB0aW9uID0gdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeVxuICAgICAgLnNjcm9sbGVkKHRoaXMuX2dldFNoYWRvd1Jvb3QoKSlcbiAgICAgIC5zdWJzY3JpYmUoc2Nyb2xsRXZlbnQgPT4gdGhpcy5fdXBkYXRlT25TY3JvbGwoc2Nyb2xsRXZlbnQpKTtcblxuICAgIGlmICh0aGlzLl9ib3VuZGFyeUVsZW1lbnQpIHtcbiAgICAgIHRoaXMuX2JvdW5kYXJ5UmVjdCA9IGdldE11dGFibGVDbGllbnRSZWN0KHRoaXMuX2JvdW5kYXJ5RWxlbWVudCk7XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgaGF2ZSBhIGN1c3RvbSBwcmV2aWV3IHdlIGNhbid0IGtub3cgYWhlYWQgb2YgdGltZSBob3cgbGFyZ2UgaXQnbGwgYmUgc28gd2UgcG9zaXRpb25cbiAgICAvLyBpdCBuZXh0IHRvIHRoZSBjdXJzb3IuIFRoZSBleGNlcHRpb24gaXMgd2hlbiB0aGUgY29uc3VtZXIgaGFzIG9wdGVkIGludG8gbWFraW5nIHRoZSBwcmV2aWV3XG4gICAgLy8gdGhlIHNhbWUgc2l6ZSBhcyB0aGUgcm9vdCBlbGVtZW50LCBpbiB3aGljaCBjYXNlIHdlIGRvIGtub3cgdGhlIHNpemUuXG4gICAgY29uc3QgcHJldmlld1RlbXBsYXRlID0gdGhpcy5fcHJldmlld1RlbXBsYXRlO1xuICAgIHRoaXMuX3BpY2t1cFBvc2l0aW9uSW5FbGVtZW50ID0gcHJldmlld1RlbXBsYXRlICYmIHByZXZpZXdUZW1wbGF0ZS50ZW1wbGF0ZSAmJlxuICAgICAgIXByZXZpZXdUZW1wbGF0ZS5tYXRjaFNpemUgPyB7eDogMCwgeTogMH0gOlxuICAgICAgdGhpcy5fZ2V0UG9pbnRlclBvc2l0aW9uSW5FbGVtZW50KHJlZmVyZW5jZUVsZW1lbnQsIGV2ZW50KTtcbiAgICBjb25zdCBwb2ludGVyUG9zaXRpb24gPSB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZSA9IHRoaXMuX2xhc3RLbm93blBvaW50ZXJQb3NpdGlvbiA9XG4gICAgICAgIHRoaXMuX2dldFBvaW50ZXJQb3NpdGlvbk9uUGFnZShldmVudCk7XG4gICAgdGhpcy5fcG9pbnRlckRpcmVjdGlvbkRlbHRhID0ge3g6IDAsIHk6IDB9O1xuICAgIHRoaXMuX3BvaW50ZXJQb3NpdGlvbkF0TGFzdERpcmVjdGlvbkNoYW5nZSA9IHt4OiBwb2ludGVyUG9zaXRpb24ueCwgeTogcG9pbnRlclBvc2l0aW9uLnl9O1xuICAgIHRoaXMuX2RyYWdTdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuc3RhcnREcmFnZ2luZyh0aGlzLCBldmVudCk7XG4gIH1cblxuICAvKiogQ2xlYW5zIHVwIHRoZSBET00gYXJ0aWZhY3RzIHRoYXQgd2VyZSBhZGRlZCB0byBmYWNpbGl0YXRlIHRoZSBlbGVtZW50IGJlaW5nIGRyYWdnZWQuICovXG4gIHByaXZhdGUgX2NsZWFudXBEcmFnQXJ0aWZhY3RzKGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCkge1xuICAgIC8vIFJlc3RvcmUgdGhlIGVsZW1lbnQncyB2aXNpYmlsaXR5IGFuZCBpbnNlcnQgaXQgYXQgaXRzIG9sZCBwb3NpdGlvbiBpbiB0aGUgRE9NLlxuICAgIC8vIEl0J3MgaW1wb3J0YW50IHRoYXQgd2UgbWFpbnRhaW4gdGhlIHBvc2l0aW9uLCBiZWNhdXNlIG1vdmluZyB0aGUgZWxlbWVudCBhcm91bmQgaW4gdGhlIERPTVxuICAgIC8vIGNhbiB0aHJvdyBvZmYgYE5nRm9yYCB3aGljaCBkb2VzIHNtYXJ0IGRpZmZpbmcgYW5kIHJlLWNyZWF0ZXMgZWxlbWVudHMgb25seSB3aGVuIG5lY2Vzc2FyeSxcbiAgICAvLyB3aGlsZSBtb3ZpbmcgdGhlIGV4aXN0aW5nIGVsZW1lbnRzIGluIGFsbCBvdGhlciBjYXNlcy5cbiAgICB0b2dnbGVWaXNpYmlsaXR5KHRoaXMuX3Jvb3RFbGVtZW50LCB0cnVlLCBkcmFnSW1wb3J0YW50UHJvcGVydGllcyk7XG4gICAgdGhpcy5fYW5jaG9yLnBhcmVudE5vZGUhLnJlcGxhY2VDaGlsZCh0aGlzLl9yb290RWxlbWVudCwgdGhpcy5fYW5jaG9yKTtcblxuICAgIHRoaXMuX2Rlc3Ryb3lQcmV2aWV3KCk7XG4gICAgdGhpcy5fZGVzdHJveVBsYWNlaG9sZGVyKCk7XG4gICAgdGhpcy5fYm91bmRhcnlSZWN0ID0gdGhpcy5fcHJldmlld1JlY3QgPSB0aGlzLl9pbml0aWFsVHJhbnNmb3JtID0gdW5kZWZpbmVkO1xuXG4gICAgLy8gUmUtZW50ZXIgdGhlIE5nWm9uZSBzaW5jZSB3ZSBib3VuZCBgZG9jdW1lbnRgIGV2ZW50cyBvbiB0aGUgb3V0c2lkZS5cbiAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuX2Ryb3BDb250YWluZXIhO1xuICAgICAgY29uc3QgY3VycmVudEluZGV4ID0gY29udGFpbmVyLmdldEl0ZW1JbmRleCh0aGlzKTtcbiAgICAgIGNvbnN0IHBvaW50ZXJQb3NpdGlvbiA9IHRoaXMuX2dldFBvaW50ZXJQb3NpdGlvbk9uUGFnZShldmVudCk7XG4gICAgICBjb25zdCBkaXN0YW5jZSA9IHRoaXMuX2dldERyYWdEaXN0YW5jZShwb2ludGVyUG9zaXRpb24pO1xuICAgICAgY29uc3QgaXNQb2ludGVyT3ZlckNvbnRhaW5lciA9IGNvbnRhaW5lci5faXNPdmVyQ29udGFpbmVyKFxuICAgICAgICBwb2ludGVyUG9zaXRpb24ueCwgcG9pbnRlclBvc2l0aW9uLnkpO1xuXG4gICAgICB0aGlzLmVuZGVkLm5leHQoe3NvdXJjZTogdGhpcywgZGlzdGFuY2UsIGRyb3BQb2ludDogcG9pbnRlclBvc2l0aW9ufSk7XG4gICAgICB0aGlzLmRyb3BwZWQubmV4dCh7XG4gICAgICAgIGl0ZW06IHRoaXMsXG4gICAgICAgIGN1cnJlbnRJbmRleCxcbiAgICAgICAgcHJldmlvdXNJbmRleDogdGhpcy5faW5pdGlhbEluZGV4LFxuICAgICAgICBjb250YWluZXI6IGNvbnRhaW5lcixcbiAgICAgICAgcHJldmlvdXNDb250YWluZXI6IHRoaXMuX2luaXRpYWxDb250YWluZXIsXG4gICAgICAgIGlzUG9pbnRlck92ZXJDb250YWluZXIsXG4gICAgICAgIGRpc3RhbmNlLFxuICAgICAgICBkcm9wUG9pbnQ6IHBvaW50ZXJQb3NpdGlvblxuICAgICAgfSk7XG4gICAgICBjb250YWluZXIuZHJvcCh0aGlzLCBjdXJyZW50SW5kZXgsIHRoaXMuX2luaXRpYWxJbmRleCwgdGhpcy5faW5pdGlhbENvbnRhaW5lcixcbiAgICAgICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lciwgZGlzdGFuY2UsIHBvaW50ZXJQb3NpdGlvbik7XG4gICAgICB0aGlzLl9kcm9wQ29udGFpbmVyID0gdGhpcy5faW5pdGlhbENvbnRhaW5lcjtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBpdGVtJ3MgcG9zaXRpb24gaW4gaXRzIGRyb3AgY29udGFpbmVyLCBvciBtb3ZlcyBpdFxuICAgKiBpbnRvIGEgbmV3IG9uZSwgZGVwZW5kaW5nIG9uIGl0cyBjdXJyZW50IGRyYWcgcG9zaXRpb24uXG4gICAqL1xuICBwcml2YXRlIF91cGRhdGVBY3RpdmVEcm9wQ29udGFpbmVyKHt4LCB5fTogUG9pbnQsIHt4OiByYXdYLCB5OiByYXdZfTogUG9pbnQpIHtcbiAgICAvLyBEcm9wIGNvbnRhaW5lciB0aGF0IGRyYWdnYWJsZSBoYXMgYmVlbiBtb3ZlZCBpbnRvLlxuICAgIGxldCBuZXdDb250YWluZXIgPSB0aGlzLl9pbml0aWFsQ29udGFpbmVyLl9nZXRTaWJsaW5nQ29udGFpbmVyRnJvbVBvc2l0aW9uKHRoaXMsIHgsIHkpO1xuXG4gICAgLy8gSWYgd2UgY291bGRuJ3QgZmluZCBhIG5ldyBjb250YWluZXIgdG8gbW92ZSB0aGUgaXRlbSBpbnRvLCBhbmQgdGhlIGl0ZW0gaGFzIGxlZnQgaXRzXG4gICAgLy8gaW5pdGlhbCBjb250YWluZXIsIGNoZWNrIHdoZXRoZXIgdGhlIGl0J3Mgb3ZlciB0aGUgaW5pdGlhbCBjb250YWluZXIuIFRoaXMgaGFuZGxlcyB0aGVcbiAgICAvLyBjYXNlIHdoZXJlIHR3byBjb250YWluZXJzIGFyZSBjb25uZWN0ZWQgb25lIHdheSBhbmQgdGhlIHVzZXIgdHJpZXMgdG8gdW5kbyBkcmFnZ2luZyBhblxuICAgIC8vIGl0ZW0gaW50byBhIG5ldyBjb250YWluZXIuXG4gICAgaWYgKCFuZXdDb250YWluZXIgJiYgdGhpcy5fZHJvcENvbnRhaW5lciAhPT0gdGhpcy5faW5pdGlhbENvbnRhaW5lciAmJlxuICAgICAgICB0aGlzLl9pbml0aWFsQ29udGFpbmVyLl9pc092ZXJDb250YWluZXIoeCwgeSkpIHtcbiAgICAgIG5ld0NvbnRhaW5lciA9IHRoaXMuX2luaXRpYWxDb250YWluZXI7XG4gICAgfVxuXG4gICAgaWYgKG5ld0NvbnRhaW5lciAmJiBuZXdDb250YWluZXIgIT09IHRoaXMuX2Ryb3BDb250YWluZXIpIHtcbiAgICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAvLyBOb3RpZnkgdGhlIG9sZCBjb250YWluZXIgdGhhdCB0aGUgaXRlbSBoYXMgbGVmdC5cbiAgICAgICAgdGhpcy5leGl0ZWQubmV4dCh7aXRlbTogdGhpcywgY29udGFpbmVyOiB0aGlzLl9kcm9wQ29udGFpbmVyIX0pO1xuICAgICAgICB0aGlzLl9kcm9wQ29udGFpbmVyIS5leGl0KHRoaXMpO1xuICAgICAgICAvLyBOb3RpZnkgdGhlIG5ldyBjb250YWluZXIgdGhhdCB0aGUgaXRlbSBoYXMgZW50ZXJlZC5cbiAgICAgICAgdGhpcy5fZHJvcENvbnRhaW5lciA9IG5ld0NvbnRhaW5lciE7XG4gICAgICAgIHRoaXMuX2Ryb3BDb250YWluZXIuZW50ZXIodGhpcywgeCwgeSwgbmV3Q29udGFpbmVyID09PSB0aGlzLl9pbml0aWFsQ29udGFpbmVyICYmXG4gICAgICAgICAgICAvLyBJZiB3ZSdyZSByZS1lbnRlcmluZyB0aGUgaW5pdGlhbCBjb250YWluZXIgYW5kIHNvcnRpbmcgaXMgZGlzYWJsZWQsXG4gICAgICAgICAgICAvLyBwdXQgaXRlbSB0aGUgaW50byBpdHMgc3RhcnRpbmcgaW5kZXggdG8gYmVnaW4gd2l0aC5cbiAgICAgICAgICAgIG5ld0NvbnRhaW5lci5zb3J0aW5nRGlzYWJsZWQgPyB0aGlzLl9pbml0aWFsSW5kZXggOiB1bmRlZmluZWQpO1xuICAgICAgICB0aGlzLmVudGVyZWQubmV4dCh7XG4gICAgICAgICAgaXRlbTogdGhpcyxcbiAgICAgICAgICBjb250YWluZXI6IG5ld0NvbnRhaW5lciEsXG4gICAgICAgICAgY3VycmVudEluZGV4OiBuZXdDb250YWluZXIhLmdldEl0ZW1JbmRleCh0aGlzKVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIERyYWdnaW5nIG1heSBoYXZlIGJlZW4gaW50ZXJydXB0ZWQgYXMgYSByZXN1bHQgb2YgdGhlIGV2ZW50cyBhYm92ZS5cbiAgICBpZiAodGhpcy5pc0RyYWdnaW5nKCkpIHtcbiAgICAgIHRoaXMuX2Ryb3BDb250YWluZXIhLl9zdGFydFNjcm9sbGluZ0lmTmVjZXNzYXJ5KHJhd1gsIHJhd1kpO1xuICAgICAgdGhpcy5fZHJvcENvbnRhaW5lciEuX3NvcnRJdGVtKHRoaXMsIHgsIHksIHRoaXMuX3BvaW50ZXJEaXJlY3Rpb25EZWx0YSk7XG4gICAgICB0aGlzLl9hcHBseVByZXZpZXdUcmFuc2Zvcm0oXG4gICAgICAgIHggLSB0aGlzLl9waWNrdXBQb3NpdGlvbkluRWxlbWVudC54LCB5IC0gdGhpcy5fcGlja3VwUG9zaXRpb25JbkVsZW1lbnQueSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgdGhlIGVsZW1lbnQgdGhhdCB3aWxsIGJlIHJlbmRlcmVkIG5leHQgdG8gdGhlIHVzZXIncyBwb2ludGVyXG4gICAqIGFuZCB3aWxsIGJlIHVzZWQgYXMgYSBwcmV2aWV3IG9mIHRoZSBlbGVtZW50IHRoYXQgaXMgYmVpbmcgZHJhZ2dlZC5cbiAgICovXG4gIHByaXZhdGUgX2NyZWF0ZVByZXZpZXdFbGVtZW50KCk6IEhUTUxFbGVtZW50IHtcbiAgICBjb25zdCBwcmV2aWV3Q29uZmlnID0gdGhpcy5fcHJldmlld1RlbXBsYXRlO1xuICAgIGNvbnN0IHByZXZpZXdDbGFzcyA9IHRoaXMucHJldmlld0NsYXNzO1xuICAgIGNvbnN0IHByZXZpZXdUZW1wbGF0ZSA9IHByZXZpZXdDb25maWcgPyBwcmV2aWV3Q29uZmlnLnRlbXBsYXRlIDogbnVsbDtcbiAgICBsZXQgcHJldmlldzogSFRNTEVsZW1lbnQ7XG5cbiAgICBpZiAocHJldmlld1RlbXBsYXRlICYmIHByZXZpZXdDb25maWcpIHtcbiAgICAgIC8vIE1lYXN1cmUgdGhlIGVsZW1lbnQgYmVmb3JlIHdlJ3ZlIGluc2VydGVkIHRoZSBwcmV2aWV3XG4gICAgICAvLyBzaW5jZSB0aGUgaW5zZXJ0aW9uIGNvdWxkIHRocm93IG9mZiB0aGUgbWVhc3VyZW1lbnQuXG4gICAgICBjb25zdCByb290UmVjdCA9IHByZXZpZXdDb25maWcubWF0Y2hTaXplID8gdGhpcy5fcm9vdEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkgOiBudWxsO1xuICAgICAgY29uc3Qgdmlld1JlZiA9IHByZXZpZXdDb25maWcudmlld0NvbnRhaW5lci5jcmVhdGVFbWJlZGRlZFZpZXcocHJldmlld1RlbXBsYXRlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlld0NvbmZpZy5jb250ZXh0KTtcbiAgICAgIHZpZXdSZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgcHJldmlldyA9IGdldFJvb3ROb2RlKHZpZXdSZWYsIHRoaXMuX2RvY3VtZW50KTtcbiAgICAgIHRoaXMuX3ByZXZpZXdSZWYgPSB2aWV3UmVmO1xuICAgICAgaWYgKHByZXZpZXdDb25maWcubWF0Y2hTaXplKSB7XG4gICAgICAgIG1hdGNoRWxlbWVudFNpemUocHJldmlldywgcm9vdFJlY3QhKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHByZXZpZXcuc3R5bGUudHJhbnNmb3JtID1cbiAgICAgICAgICAgIGdldFRyYW5zZm9ybSh0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZS54LCB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZS55KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX3Jvb3RFbGVtZW50O1xuICAgICAgcHJldmlldyA9IGRlZXBDbG9uZU5vZGUoZWxlbWVudCk7XG4gICAgICBtYXRjaEVsZW1lbnRTaXplKHByZXZpZXcsIGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkpO1xuXG4gICAgICBpZiAodGhpcy5faW5pdGlhbFRyYW5zZm9ybSkge1xuICAgICAgICBwcmV2aWV3LnN0eWxlLnRyYW5zZm9ybSA9IHRoaXMuX2luaXRpYWxUcmFuc2Zvcm07XG4gICAgICB9XG4gICAgfVxuXG4gICAgZXh0ZW5kU3R5bGVzKHByZXZpZXcuc3R5bGUsIHtcbiAgICAgIC8vIEl0J3MgaW1wb3J0YW50IHRoYXQgd2UgZGlzYWJsZSB0aGUgcG9pbnRlciBldmVudHMgb24gdGhlIHByZXZpZXcsIGJlY2F1c2VcbiAgICAgIC8vIGl0IGNhbiB0aHJvdyBvZmYgdGhlIGBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50YCBjYWxscyBpbiB0aGUgYENka0Ryb3BMaXN0YC5cbiAgICAgICdwb2ludGVyLWV2ZW50cyc6ICdub25lJyxcbiAgICAgIC8vIFdlIGhhdmUgdG8gcmVzZXQgdGhlIG1hcmdpbiwgYmVjYXVzZSBpdCBjYW4gdGhyb3cgb2ZmIHBvc2l0aW9uaW5nIHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydC5cbiAgICAgICdtYXJnaW4nOiAnMCcsXG4gICAgICAncG9zaXRpb24nOiAnZml4ZWQnLFxuICAgICAgJ3RvcCc6ICcwJyxcbiAgICAgICdsZWZ0JzogJzAnLFxuICAgICAgJ3otaW5kZXgnOiBgJHt0aGlzLl9jb25maWcuekluZGV4IHx8IDEwMDB9YFxuICAgIH0sIGRyYWdJbXBvcnRhbnRQcm9wZXJ0aWVzKTtcblxuICAgIHRvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMocHJldmlldywgZmFsc2UpO1xuICAgIHByZXZpZXcuY2xhc3NMaXN0LmFkZCgnY2RrLWRyYWctcHJldmlldycpO1xuICAgIHByZXZpZXcuc2V0QXR0cmlidXRlKCdkaXInLCB0aGlzLl9kaXJlY3Rpb24pO1xuXG4gICAgaWYgKHByZXZpZXdDbGFzcykge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkocHJldmlld0NsYXNzKSkge1xuICAgICAgICBwcmV2aWV3Q2xhc3MuZm9yRWFjaChjbGFzc05hbWUgPT4gcHJldmlldy5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJldmlldy5jbGFzc0xpc3QuYWRkKHByZXZpZXdDbGFzcyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHByZXZpZXc7XG4gIH1cblxuICAvKipcbiAgICogQW5pbWF0ZXMgdGhlIHByZXZpZXcgZWxlbWVudCBmcm9tIGl0cyBjdXJyZW50IHBvc2l0aW9uIHRvIHRoZSBsb2NhdGlvbiBvZiB0aGUgZHJvcCBwbGFjZWhvbGRlci5cbiAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIGFuaW1hdGlvbiBjb21wbGV0ZXMuXG4gICAqL1xuICBwcml2YXRlIF9hbmltYXRlUHJldmlld1RvUGxhY2Vob2xkZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gSWYgdGhlIHVzZXIgaGFzbid0IG1vdmVkIHlldCwgdGhlIHRyYW5zaXRpb25lbmQgZXZlbnQgd29uJ3QgZmlyZS5cbiAgICBpZiAoIXRoaXMuX2hhc01vdmVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgY29uc3QgcGxhY2Vob2xkZXJSZWN0ID0gdGhpcy5fcGxhY2Vob2xkZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAvLyBBcHBseSB0aGUgY2xhc3MgdGhhdCBhZGRzIGEgdHJhbnNpdGlvbiB0byB0aGUgcHJldmlldy5cbiAgICB0aGlzLl9wcmV2aWV3LmNsYXNzTGlzdC5hZGQoJ2Nkay1kcmFnLWFuaW1hdGluZycpO1xuXG4gICAgLy8gTW92ZSB0aGUgcHJldmlldyB0byB0aGUgcGxhY2Vob2xkZXIgcG9zaXRpb24uXG4gICAgdGhpcy5fYXBwbHlQcmV2aWV3VHJhbnNmb3JtKHBsYWNlaG9sZGVyUmVjdC5sZWZ0LCBwbGFjZWhvbGRlclJlY3QudG9wKTtcblxuICAgIC8vIElmIHRoZSBlbGVtZW50IGRvZXNuJ3QgaGF2ZSBhIGB0cmFuc2l0aW9uYCwgdGhlIGB0cmFuc2l0aW9uZW5kYCBldmVudCB3b24ndCBmaXJlLiBTaW5jZVxuICAgIC8vIHdlIG5lZWQgdG8gdHJpZ2dlciBhIHN0eWxlIHJlY2FsY3VsYXRpb24gaW4gb3JkZXIgZm9yIHRoZSBgY2RrLWRyYWctYW5pbWF0aW5nYCBjbGFzcyB0b1xuICAgIC8vIGFwcGx5IGl0cyBzdHlsZSwgd2UgdGFrZSBhZHZhbnRhZ2Ugb2YgdGhlIGF2YWlsYWJsZSBpbmZvIHRvIGZpZ3VyZSBvdXQgd2hldGhlciB3ZSBuZWVkIHRvXG4gICAgLy8gYmluZCB0aGUgZXZlbnQgaW4gdGhlIGZpcnN0IHBsYWNlLlxuICAgIGNvbnN0IGR1cmF0aW9uID0gZ2V0VHJhbnNmb3JtVHJhbnNpdGlvbkR1cmF0aW9uSW5Ncyh0aGlzLl9wcmV2aWV3KTtcblxuICAgIGlmIChkdXJhdGlvbiA9PT0gMCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICBjb25zdCBoYW5kbGVyID0gKChldmVudDogVHJhbnNpdGlvbkV2ZW50KSA9PiB7XG4gICAgICAgICAgaWYgKCFldmVudCB8fCAoX2dldEV2ZW50VGFyZ2V0KGV2ZW50KSA9PT0gdGhpcy5fcHJldmlldyAmJlxuICAgICAgICAgICAgICBldmVudC5wcm9wZXJ0eU5hbWUgPT09ICd0cmFuc2Zvcm0nKSkge1xuICAgICAgICAgICAgdGhpcy5fcHJldmlldz8ucmVtb3ZlRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIGhhbmRsZXIpO1xuICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkgYXMgRXZlbnRMaXN0ZW5lck9yRXZlbnRMaXN0ZW5lck9iamVjdDtcblxuICAgICAgICAvLyBJZiBhIHRyYW5zaXRpb24gaXMgc2hvcnQgZW5vdWdoLCB0aGUgYnJvd3NlciBtaWdodCBub3QgZmlyZSB0aGUgYHRyYW5zaXRpb25lbmRgIGV2ZW50LlxuICAgICAgICAvLyBTaW5jZSB3ZSBrbm93IGhvdyBsb25nIGl0J3Mgc3VwcG9zZWQgdG8gdGFrZSwgYWRkIGEgdGltZW91dCB3aXRoIGEgNTAlIGJ1ZmZlciB0aGF0J2xsXG4gICAgICAgIC8vIGZpcmUgaWYgdGhlIHRyYW5zaXRpb24gaGFzbid0IGNvbXBsZXRlZCB3aGVuIGl0IHdhcyBzdXBwb3NlZCB0by5cbiAgICAgICAgY29uc3QgdGltZW91dCA9IHNldFRpbWVvdXQoaGFuZGxlciBhcyBGdW5jdGlvbiwgZHVyYXRpb24gKiAxLjUpO1xuICAgICAgICB0aGlzLl9wcmV2aWV3LmFkZEV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBoYW5kbGVyKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYW4gZWxlbWVudCB0aGF0IHdpbGwgYmUgc2hvd24gaW5zdGVhZCBvZiB0aGUgY3VycmVudCBlbGVtZW50IHdoaWxlIGRyYWdnaW5nLiAqL1xuICBwcml2YXRlIF9jcmVhdGVQbGFjZWhvbGRlckVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IHBsYWNlaG9sZGVyQ29uZmlnID0gdGhpcy5fcGxhY2Vob2xkZXJUZW1wbGF0ZTtcbiAgICBjb25zdCBwbGFjZWhvbGRlclRlbXBsYXRlID0gcGxhY2Vob2xkZXJDb25maWcgPyBwbGFjZWhvbGRlckNvbmZpZy50ZW1wbGF0ZSA6IG51bGw7XG4gICAgbGV0IHBsYWNlaG9sZGVyOiBIVE1MRWxlbWVudDtcblxuICAgIGlmIChwbGFjZWhvbGRlclRlbXBsYXRlKSB7XG4gICAgICB0aGlzLl9wbGFjZWhvbGRlclJlZiA9IHBsYWNlaG9sZGVyQ29uZmlnIS52aWV3Q29udGFpbmVyLmNyZWF0ZUVtYmVkZGVkVmlldyhcbiAgICAgICAgcGxhY2Vob2xkZXJUZW1wbGF0ZSxcbiAgICAgICAgcGxhY2Vob2xkZXJDb25maWchLmNvbnRleHRcbiAgICAgICk7XG4gICAgICB0aGlzLl9wbGFjZWhvbGRlclJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICBwbGFjZWhvbGRlciA9IGdldFJvb3ROb2RlKHRoaXMuX3BsYWNlaG9sZGVyUmVmLCB0aGlzLl9kb2N1bWVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBsYWNlaG9sZGVyID0gZGVlcENsb25lTm9kZSh0aGlzLl9yb290RWxlbWVudCk7XG4gICAgfVxuXG4gICAgcGxhY2Vob2xkZXIuY2xhc3NMaXN0LmFkZCgnY2RrLWRyYWctcGxhY2Vob2xkZXInKTtcbiAgICByZXR1cm4gcGxhY2Vob2xkZXI7XG4gIH1cblxuICAvKipcbiAgICogRmlndXJlcyBvdXQgdGhlIGNvb3JkaW5hdGVzIGF0IHdoaWNoIGFuIGVsZW1lbnQgd2FzIHBpY2tlZCB1cC5cbiAgICogQHBhcmFtIHJlZmVyZW5jZUVsZW1lbnQgRWxlbWVudCB0aGF0IGluaXRpYXRlZCB0aGUgZHJhZ2dpbmcuXG4gICAqIEBwYXJhbSBldmVudCBFdmVudCB0aGF0IGluaXRpYXRlZCB0aGUgZHJhZ2dpbmcuXG4gICAqL1xuICBwcml2YXRlIF9nZXRQb2ludGVyUG9zaXRpb25JbkVsZW1lbnQocmVmZXJlbmNlRWxlbWVudDogSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpOiBQb2ludCB7XG4gICAgY29uc3QgZWxlbWVudFJlY3QgPSB0aGlzLl9yb290RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCBoYW5kbGVFbGVtZW50ID0gcmVmZXJlbmNlRWxlbWVudCA9PT0gdGhpcy5fcm9vdEVsZW1lbnQgPyBudWxsIDogcmVmZXJlbmNlRWxlbWVudDtcbiAgICBjb25zdCByZWZlcmVuY2VSZWN0ID0gaGFuZGxlRWxlbWVudCA/IGhhbmRsZUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkgOiBlbGVtZW50UmVjdDtcbiAgICBjb25zdCBwb2ludCA9IGlzVG91Y2hFdmVudChldmVudCkgPyBldmVudC50YXJnZXRUb3VjaGVzWzBdIDogZXZlbnQ7XG4gICAgY29uc3Qgc2Nyb2xsUG9zaXRpb24gPSB0aGlzLl9nZXRWaWV3cG9ydFNjcm9sbFBvc2l0aW9uKCk7XG4gICAgY29uc3QgeCA9IHBvaW50LnBhZ2VYIC0gcmVmZXJlbmNlUmVjdC5sZWZ0IC0gc2Nyb2xsUG9zaXRpb24ubGVmdDtcbiAgICBjb25zdCB5ID0gcG9pbnQucGFnZVkgLSByZWZlcmVuY2VSZWN0LnRvcCAtIHNjcm9sbFBvc2l0aW9uLnRvcDtcblxuICAgIHJldHVybiB7XG4gICAgICB4OiByZWZlcmVuY2VSZWN0LmxlZnQgLSBlbGVtZW50UmVjdC5sZWZ0ICsgeCxcbiAgICAgIHk6IHJlZmVyZW5jZVJlY3QudG9wIC0gZWxlbWVudFJlY3QudG9wICsgeVxuICAgIH07XG4gIH1cblxuICAvKiogRGV0ZXJtaW5lcyB0aGUgcG9pbnQgb2YgdGhlIHBhZ2UgdGhhdCB3YXMgdG91Y2hlZCBieSB0aGUgdXNlci4gKi9cbiAgcHJpdmF0ZSBfZ2V0UG9pbnRlclBvc2l0aW9uT25QYWdlKGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCk6IFBvaW50IHtcbiAgICBjb25zdCBzY3JvbGxQb3NpdGlvbiA9IHRoaXMuX2dldFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24oKTtcbiAgICBjb25zdCBwb2ludCA9IGlzVG91Y2hFdmVudChldmVudCkgP1xuICAgICAgICAvLyBgdG91Y2hlc2Agd2lsbCBiZSBlbXB0eSBmb3Igc3RhcnQvZW5kIGV2ZW50cyBzbyB3ZSBoYXZlIHRvIGZhbGwgYmFjayB0byBgY2hhbmdlZFRvdWNoZXNgLlxuICAgICAgICAvLyBBbHNvIG5vdGUgdGhhdCBvbiByZWFsIGRldmljZXMgd2UncmUgZ3VhcmFudGVlZCBmb3IgZWl0aGVyIGB0b3VjaGVzYCBvciBgY2hhbmdlZFRvdWNoZXNgXG4gICAgICAgIC8vIHRvIGhhdmUgYSB2YWx1ZSwgYnV0IEZpcmVmb3ggaW4gZGV2aWNlIGVtdWxhdGlvbiBtb2RlIGhhcyBhIGJ1ZyB3aGVyZSBib3RoIGNhbiBiZSBlbXB0eVxuICAgICAgICAvLyBmb3IgYHRvdWNoc3RhcnRgIGFuZCBgdG91Y2hlbmRgIHNvIHdlIGZhbGwgYmFjayB0byBhIGR1bW15IG9iamVjdCBpbiBvcmRlciB0byBhdm9pZFxuICAgICAgICAvLyB0aHJvd2luZyBhbiBlcnJvci4gVGhlIHZhbHVlIHJldHVybmVkIGhlcmUgd2lsbCBiZSBpbmNvcnJlY3QsIGJ1dCBzaW5jZSB0aGlzIG9ubHlcbiAgICAgICAgLy8gYnJlYWtzIGluc2lkZSBhIGRldmVsb3BlciB0b29sIGFuZCB0aGUgdmFsdWUgaXMgb25seSB1c2VkIGZvciBzZWNvbmRhcnkgaW5mb3JtYXRpb24sXG4gICAgICAgIC8vIHdlIGNhbiBnZXQgYXdheSB3aXRoIGl0LiBTZWUgaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTYxNTgyNC5cbiAgICAgICAgKGV2ZW50LnRvdWNoZXNbMF0gfHwgZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0gfHwge3BhZ2VYOiAwLCBwYWdlWTogMH0pIDogZXZlbnQ7XG5cbiAgICBjb25zdCB4ID0gcG9pbnQucGFnZVggLSBzY3JvbGxQb3NpdGlvbi5sZWZ0O1xuICAgIGNvbnN0IHkgPSBwb2ludC5wYWdlWSAtIHNjcm9sbFBvc2l0aW9uLnRvcDtcblxuICAgIC8vIGlmIGRyYWdnaW5nIFNWRyBlbGVtZW50LCB0cnkgdG8gY29udmVydCBmcm9tIHRoZSBzY3JlZW4gY29vcmRpbmF0ZSBzeXN0ZW0gdG8gdGhlIFNWR1xuICAgIC8vIGNvb3JkaW5hdGUgc3lzdGVtXG4gICAgaWYgKHRoaXMuX293bmVyU1ZHRWxlbWVudCkge1xuICAgICAgY29uc3Qgc3ZnTWF0cml4ID0gdGhpcy5fb3duZXJTVkdFbGVtZW50LmdldFNjcmVlbkNUTSgpO1xuICAgICAgaWYgKHN2Z01hdHJpeCkge1xuICAgICAgICBjb25zdCBzdmdQb2ludCA9IHRoaXMuX293bmVyU1ZHRWxlbWVudC5jcmVhdGVTVkdQb2ludCgpO1xuICAgICAgICBzdmdQb2ludC54ID0geDtcbiAgICAgICAgc3ZnUG9pbnQueSA9IHk7XG4gICAgICAgIHJldHVybiBzdmdQb2ludC5tYXRyaXhUcmFuc2Zvcm0oc3ZnTWF0cml4LmludmVyc2UoKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHt4LCB5fTtcbiAgfVxuXG5cbiAgLyoqIEdldHMgdGhlIHBvaW50ZXIgcG9zaXRpb24gb24gdGhlIHBhZ2UsIGFjY291bnRpbmcgZm9yIGFueSBwb3NpdGlvbiBjb25zdHJhaW50cy4gKi9cbiAgcHJpdmF0ZSBfZ2V0Q29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24ocG9pbnQ6IFBvaW50KTogUG9pbnQge1xuICAgIGNvbnN0IGRyb3BDb250YWluZXJMb2NrID0gdGhpcy5fZHJvcENvbnRhaW5lciA/IHRoaXMuX2Ryb3BDb250YWluZXIubG9ja0F4aXMgOiBudWxsO1xuICAgIGxldCB7eCwgeX0gPSB0aGlzLmNvbnN0cmFpblBvc2l0aW9uID8gdGhpcy5jb25zdHJhaW5Qb3NpdGlvbihwb2ludCwgdGhpcykgOiBwb2ludDtcblxuICAgIGlmICh0aGlzLmxvY2tBeGlzID09PSAneCcgfHwgZHJvcENvbnRhaW5lckxvY2sgPT09ICd4Jykge1xuICAgICAgeSA9IHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLnk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmxvY2tBeGlzID09PSAneScgfHwgZHJvcENvbnRhaW5lckxvY2sgPT09ICd5Jykge1xuICAgICAgeCA9IHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLng7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2JvdW5kYXJ5UmVjdCkge1xuICAgICAgY29uc3Qge3g6IHBpY2t1cFgsIHk6IHBpY2t1cFl9ID0gdGhpcy5fcGlja3VwUG9zaXRpb25JbkVsZW1lbnQ7XG4gICAgICBjb25zdCBib3VuZGFyeVJlY3QgPSB0aGlzLl9ib3VuZGFyeVJlY3Q7XG4gICAgICBjb25zdCBwcmV2aWV3UmVjdCA9IHRoaXMuX3ByZXZpZXdSZWN0ITtcbiAgICAgIGNvbnN0IG1pblkgPSBib3VuZGFyeVJlY3QudG9wICsgcGlja3VwWTtcbiAgICAgIGNvbnN0IG1heFkgPSBib3VuZGFyeVJlY3QuYm90dG9tIC0gKHByZXZpZXdSZWN0LmhlaWdodCAtIHBpY2t1cFkpO1xuICAgICAgY29uc3QgbWluWCA9IGJvdW5kYXJ5UmVjdC5sZWZ0ICsgcGlja3VwWDtcbiAgICAgIGNvbnN0IG1heFggPSBib3VuZGFyeVJlY3QucmlnaHQgLSAocHJldmlld1JlY3Qud2lkdGggLSBwaWNrdXBYKTtcblxuICAgICAgeCA9IGNsYW1wKHgsIG1pblgsIG1heFgpO1xuICAgICAgeSA9IGNsYW1wKHksIG1pblksIG1heFkpO1xuICAgIH1cblxuICAgIHJldHVybiB7eCwgeX07XG4gIH1cblxuXG4gIC8qKiBVcGRhdGVzIHRoZSBjdXJyZW50IGRyYWcgZGVsdGEsIGJhc2VkIG9uIHRoZSB1c2VyJ3MgY3VycmVudCBwb2ludGVyIHBvc2l0aW9uIG9uIHRoZSBwYWdlLiAqL1xuICBwcml2YXRlIF91cGRhdGVQb2ludGVyRGlyZWN0aW9uRGVsdGEocG9pbnRlclBvc2l0aW9uT25QYWdlOiBQb2ludCkge1xuICAgIGNvbnN0IHt4LCB5fSA9IHBvaW50ZXJQb3NpdGlvbk9uUGFnZTtcbiAgICBjb25zdCBkZWx0YSA9IHRoaXMuX3BvaW50ZXJEaXJlY3Rpb25EZWx0YTtcbiAgICBjb25zdCBwb3NpdGlvblNpbmNlTGFzdENoYW5nZSA9IHRoaXMuX3BvaW50ZXJQb3NpdGlvbkF0TGFzdERpcmVjdGlvbkNoYW5nZTtcblxuICAgIC8vIEFtb3VudCBvZiBwaXhlbHMgdGhlIHVzZXIgaGFzIGRyYWdnZWQgc2luY2UgdGhlIGxhc3QgdGltZSB0aGUgZGlyZWN0aW9uIGNoYW5nZWQuXG4gICAgY29uc3QgY2hhbmdlWCA9IE1hdGguYWJzKHggLSBwb3NpdGlvblNpbmNlTGFzdENoYW5nZS54KTtcbiAgICBjb25zdCBjaGFuZ2VZID0gTWF0aC5hYnMoeSAtIHBvc2l0aW9uU2luY2VMYXN0Q2hhbmdlLnkpO1xuXG4gICAgLy8gQmVjYXVzZSB3ZSBoYW5kbGUgcG9pbnRlciBldmVudHMgb24gYSBwZXItcGl4ZWwgYmFzaXMsIHdlIGRvbid0IHdhbnQgdGhlIGRlbHRhXG4gICAgLy8gdG8gY2hhbmdlIGZvciBldmVyeSBwaXhlbCwgb3RoZXJ3aXNlIGFueXRoaW5nIHRoYXQgZGVwZW5kcyBvbiBpdCBjYW4gbG9vayBlcnJhdGljLlxuICAgIC8vIFRvIG1ha2UgdGhlIGRlbHRhIG1vcmUgY29uc2lzdGVudCwgd2UgdHJhY2sgaG93IG11Y2ggdGhlIHVzZXIgaGFzIG1vdmVkIHNpbmNlIHRoZSBsYXN0XG4gICAgLy8gZGVsdGEgY2hhbmdlIGFuZCB3ZSBvbmx5IHVwZGF0ZSBpdCBhZnRlciBpdCBoYXMgcmVhY2hlZCBhIGNlcnRhaW4gdGhyZXNob2xkLlxuICAgIGlmIChjaGFuZ2VYID4gdGhpcy5fY29uZmlnLnBvaW50ZXJEaXJlY3Rpb25DaGFuZ2VUaHJlc2hvbGQpIHtcbiAgICAgIGRlbHRhLnggPSB4ID4gcG9zaXRpb25TaW5jZUxhc3RDaGFuZ2UueCA/IDEgOiAtMTtcbiAgICAgIHBvc2l0aW9uU2luY2VMYXN0Q2hhbmdlLnggPSB4O1xuICAgIH1cblxuICAgIGlmIChjaGFuZ2VZID4gdGhpcy5fY29uZmlnLnBvaW50ZXJEaXJlY3Rpb25DaGFuZ2VUaHJlc2hvbGQpIHtcbiAgICAgIGRlbHRhLnkgPSB5ID4gcG9zaXRpb25TaW5jZUxhc3RDaGFuZ2UueSA/IDEgOiAtMTtcbiAgICAgIHBvc2l0aW9uU2luY2VMYXN0Q2hhbmdlLnkgPSB5O1xuICAgIH1cblxuICAgIHJldHVybiBkZWx0YTtcbiAgfVxuXG4gIC8qKiBUb2dnbGVzIHRoZSBuYXRpdmUgZHJhZyBpbnRlcmFjdGlvbnMsIGJhc2VkIG9uIGhvdyBtYW55IGhhbmRsZXMgYXJlIHJlZ2lzdGVyZWQuICovXG4gIHByaXZhdGUgX3RvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMoKSB7XG4gICAgaWYgKCF0aGlzLl9yb290RWxlbWVudCB8fCAhdGhpcy5faGFuZGxlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNob3VsZEVuYWJsZSA9IHRoaXMuX2hhbmRsZXMubGVuZ3RoID4gMCB8fCAhdGhpcy5pc0RyYWdnaW5nKCk7XG5cbiAgICBpZiAoc2hvdWxkRW5hYmxlICE9PSB0aGlzLl9uYXRpdmVJbnRlcmFjdGlvbnNFbmFibGVkKSB7XG4gICAgICB0aGlzLl9uYXRpdmVJbnRlcmFjdGlvbnNFbmFibGVkID0gc2hvdWxkRW5hYmxlO1xuICAgICAgdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucyh0aGlzLl9yb290RWxlbWVudCwgc2hvdWxkRW5hYmxlKTtcbiAgICB9XG4gIH1cblxuICAvKiogUmVtb3ZlcyB0aGUgbWFudWFsbHktYWRkZWQgZXZlbnQgbGlzdGVuZXJzIGZyb20gdGhlIHJvb3QgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfcmVtb3ZlUm9vdEVsZW1lbnRMaXN0ZW5lcnMoZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX3BvaW50ZXJEb3duLCBhY3RpdmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5fcG9pbnRlckRvd24sIHBhc3NpdmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyBhIGB0cmFuc2Zvcm1gIHRvIHRoZSByb290IGVsZW1lbnQsIHRha2luZyBpbnRvIGFjY291bnQgYW55IGV4aXN0aW5nIHRyYW5zZm9ybXMgb24gaXQuXG4gICAqIEBwYXJhbSB4IE5ldyB0cmFuc2Zvcm0gdmFsdWUgYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHkgTmV3IHRyYW5zZm9ybSB2YWx1ZSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKi9cbiAgcHJpdmF0ZSBfYXBwbHlSb290RWxlbWVudFRyYW5zZm9ybSh4OiBudW1iZXIsIHk6IG51bWJlcikge1xuICAgIGNvbnN0IHRyYW5zZm9ybSA9IGdldFRyYW5zZm9ybSh4LCB5KTtcbiAgICBjb25zdCBzdHlsZXMgPSB0aGlzLl9yb290RWxlbWVudC5zdHlsZTtcblxuICAgIC8vIENhY2hlIHRoZSBwcmV2aW91cyB0cmFuc2Zvcm0gYW1vdW50IG9ubHkgYWZ0ZXIgdGhlIGZpcnN0IGRyYWcgc2VxdWVuY2UsIGJlY2F1c2VcbiAgICAvLyB3ZSBkb24ndCB3YW50IG91ciBvd24gdHJhbnNmb3JtcyB0byBzdGFjayBvbiB0b3Agb2YgZWFjaCBvdGhlci5cbiAgICAvLyBTaG91bGQgYmUgZXhjbHVkZWQgbm9uZSBiZWNhdXNlIG5vbmUgKyB0cmFuc2xhdGUzZCh4LCB5LCB4KSBpcyBpbnZhbGlkIGNzc1xuICAgIGlmICh0aGlzLl9pbml0aWFsVHJhbnNmb3JtID09IG51bGwpIHtcbiAgICAgIHRoaXMuX2luaXRpYWxUcmFuc2Zvcm0gPVxuICAgICAgICBzdHlsZXMudHJhbnNmb3JtICYmIHN0eWxlcy50cmFuc2Zvcm0gIT0gJ25vbmUnID8gc3R5bGVzLnRyYW5zZm9ybSA6ICcnO1xuICAgIH1cblxuICAgIC8vIFByZXNlcnZlIHRoZSBwcmV2aW91cyBgdHJhbnNmb3JtYCB2YWx1ZSwgaWYgdGhlcmUgd2FzIG9uZS4gTm90ZSB0aGF0IHdlIGFwcGx5IG91ciBvd25cbiAgICAvLyB0cmFuc2Zvcm0gYmVmb3JlIHRoZSB1c2VyJ3MsIGJlY2F1c2UgdGhpbmdzIGxpa2Ugcm90YXRpb24gY2FuIGFmZmVjdCB3aGljaCBkaXJlY3Rpb25cbiAgICAvLyB0aGUgZWxlbWVudCB3aWxsIGJlIHRyYW5zbGF0ZWQgdG93YXJkcy5cbiAgICBzdHlsZXMudHJhbnNmb3JtID0gY29tYmluZVRyYW5zZm9ybXModHJhbnNmb3JtLCB0aGlzLl9pbml0aWFsVHJhbnNmb3JtKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBsaWVzIGEgYHRyYW5zZm9ybWAgdG8gdGhlIHByZXZpZXcsIHRha2luZyBpbnRvIGFjY291bnQgYW55IGV4aXN0aW5nIHRyYW5zZm9ybXMgb24gaXQuXG4gICAqIEBwYXJhbSB4IE5ldyB0cmFuc2Zvcm0gdmFsdWUgYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHkgTmV3IHRyYW5zZm9ybSB2YWx1ZSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKi9cbiAgcHJpdmF0ZSBfYXBwbHlQcmV2aWV3VHJhbnNmb3JtKHg6IG51bWJlciwgeTogbnVtYmVyKSB7XG4gICAgLy8gT25seSBhcHBseSB0aGUgaW5pdGlhbCB0cmFuc2Zvcm0gaWYgdGhlIHByZXZpZXcgaXMgYSBjbG9uZSBvZiB0aGUgb3JpZ2luYWwgZWxlbWVudCwgb3RoZXJ3aXNlXG4gICAgLy8gaXQgY291bGQgYmUgY29tcGxldGVseSBkaWZmZXJlbnQgYW5kIHRoZSB0cmFuc2Zvcm0gbWlnaHQgbm90IG1ha2Ugc2Vuc2UgYW55bW9yZS5cbiAgICBjb25zdCBpbml0aWFsVHJhbnNmb3JtID0gdGhpcy5fcHJldmlld1RlbXBsYXRlPy50ZW1wbGF0ZSA/IHVuZGVmaW5lZCA6IHRoaXMuX2luaXRpYWxUcmFuc2Zvcm07XG4gICAgY29uc3QgdHJhbnNmb3JtID0gZ2V0VHJhbnNmb3JtKHgsIHkpO1xuICAgIHRoaXMuX3ByZXZpZXcuc3R5bGUudHJhbnNmb3JtID0gY29tYmluZVRyYW5zZm9ybXModHJhbnNmb3JtLCBpbml0aWFsVHJhbnNmb3JtKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBkaXN0YW5jZSB0aGF0IHRoZSB1c2VyIGhhcyBkcmFnZ2VkIGR1cmluZyB0aGUgY3VycmVudCBkcmFnIHNlcXVlbmNlLlxuICAgKiBAcGFyYW0gY3VycmVudFBvc2l0aW9uIEN1cnJlbnQgcG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0RHJhZ0Rpc3RhbmNlKGN1cnJlbnRQb3NpdGlvbjogUG9pbnQpOiBQb2ludCB7XG4gICAgY29uc3QgcGlja3VwUG9zaXRpb24gPSB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZTtcblxuICAgIGlmIChwaWNrdXBQb3NpdGlvbikge1xuICAgICAgcmV0dXJuIHt4OiBjdXJyZW50UG9zaXRpb24ueCAtIHBpY2t1cFBvc2l0aW9uLngsIHk6IGN1cnJlbnRQb3NpdGlvbi55IC0gcGlja3VwUG9zaXRpb24ueX07XG4gICAgfVxuXG4gICAgcmV0dXJuIHt4OiAwLCB5OiAwfTtcbiAgfVxuXG4gIC8qKiBDbGVhbnMgdXAgYW55IGNhY2hlZCBlbGVtZW50IGRpbWVuc2lvbnMgdGhhdCB3ZSBkb24ndCBuZWVkIGFmdGVyIGRyYWdnaW5nIGhhcyBzdG9wcGVkLiAqL1xuICBwcml2YXRlIF9jbGVhbnVwQ2FjaGVkRGltZW5zaW9ucygpIHtcbiAgICB0aGlzLl9ib3VuZGFyeVJlY3QgPSB0aGlzLl9wcmV2aWV3UmVjdCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgZWxlbWVudCBpcyBzdGlsbCBpbnNpZGUgaXRzIGJvdW5kYXJ5IGFmdGVyIHRoZSB2aWV3cG9ydCBoYXMgYmVlbiByZXNpemVkLlxuICAgKiBJZiBub3QsIHRoZSBwb3NpdGlvbiBpcyBhZGp1c3RlZCBzbyB0aGF0IHRoZSBlbGVtZW50IGZpdHMgYWdhaW4uXG4gICAqL1xuICBwcml2YXRlIF9jb250YWluSW5zaWRlQm91bmRhcnlPblJlc2l6ZSgpIHtcbiAgICBsZXQge3gsIHl9ID0gdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybTtcblxuICAgIGlmICgoeCA9PT0gMCAmJiB5ID09PSAwKSB8fCB0aGlzLmlzRHJhZ2dpbmcoKSB8fCAhdGhpcy5fYm91bmRhcnlFbGVtZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgYm91bmRhcnlSZWN0ID0gdGhpcy5fYm91bmRhcnlFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IGVsZW1lbnRSZWN0ID0gdGhpcy5fcm9vdEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAvLyBJdCdzIHBvc3NpYmxlIHRoYXQgdGhlIGVsZW1lbnQgZ290IGhpZGRlbiBhd2F5IGFmdGVyIGRyYWdnaW5nIChlLmcuIGJ5IHN3aXRjaGluZyB0byBhXG4gICAgLy8gZGlmZmVyZW50IHRhYikuIERvbid0IGRvIGFueXRoaW5nIGluIHRoaXMgY2FzZSBzbyB3ZSBkb24ndCBjbGVhciB0aGUgdXNlcidzIHBvc2l0aW9uLlxuICAgIGlmICgoYm91bmRhcnlSZWN0LndpZHRoID09PSAwICYmIGJvdW5kYXJ5UmVjdC5oZWlnaHQgPT09IDApIHx8XG4gICAgICAgIChlbGVtZW50UmVjdC53aWR0aCA9PT0gMCAmJiBlbGVtZW50UmVjdC5oZWlnaHQgPT09IDApKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbGVmdE92ZXJmbG93ID0gYm91bmRhcnlSZWN0LmxlZnQgLSBlbGVtZW50UmVjdC5sZWZ0O1xuICAgIGNvbnN0IHJpZ2h0T3ZlcmZsb3cgPSBlbGVtZW50UmVjdC5yaWdodCAtIGJvdW5kYXJ5UmVjdC5yaWdodDtcbiAgICBjb25zdCB0b3BPdmVyZmxvdyA9IGJvdW5kYXJ5UmVjdC50b3AgLSBlbGVtZW50UmVjdC50b3A7XG4gICAgY29uc3QgYm90dG9tT3ZlcmZsb3cgPSBlbGVtZW50UmVjdC5ib3R0b20gLSBib3VuZGFyeVJlY3QuYm90dG9tO1xuXG4gICAgLy8gSWYgdGhlIGVsZW1lbnQgaGFzIGJlY29tZSB3aWRlciB0aGFuIHRoZSBib3VuZGFyeSwgd2UgY2FuJ3RcbiAgICAvLyBkbyBtdWNoIHRvIG1ha2UgaXQgZml0IHNvIHdlIGp1c3QgYW5jaG9yIGl0IHRvIHRoZSBsZWZ0LlxuICAgIGlmIChib3VuZGFyeVJlY3Qud2lkdGggPiBlbGVtZW50UmVjdC53aWR0aCkge1xuICAgICAgaWYgKGxlZnRPdmVyZmxvdyA+IDApIHtcbiAgICAgICAgeCArPSBsZWZ0T3ZlcmZsb3c7XG4gICAgICB9XG5cbiAgICAgIGlmIChyaWdodE92ZXJmbG93ID4gMCkge1xuICAgICAgICB4IC09IHJpZ2h0T3ZlcmZsb3c7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHggPSAwO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBlbGVtZW50IGhhcyBiZWNvbWUgdGFsbGVyIHRoYW4gdGhlIGJvdW5kYXJ5LCB3ZSBjYW4ndFxuICAgIC8vIGRvIG11Y2ggdG8gbWFrZSBpdCBmaXQgc28gd2UganVzdCBhbmNob3IgaXQgdG8gdGhlIHRvcC5cbiAgICBpZiAoYm91bmRhcnlSZWN0LmhlaWdodCA+IGVsZW1lbnRSZWN0LmhlaWdodCkge1xuICAgICAgaWYgKHRvcE92ZXJmbG93ID4gMCkge1xuICAgICAgICB5ICs9IHRvcE92ZXJmbG93O1xuICAgICAgfVxuXG4gICAgICBpZiAoYm90dG9tT3ZlcmZsb3cgPiAwKSB7XG4gICAgICAgIHkgLT0gYm90dG9tT3ZlcmZsb3c7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHkgPSAwO1xuICAgIH1cblxuICAgIGlmICh4ICE9PSB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtLnggfHwgeSAhPT0gdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybS55KSB7XG4gICAgICB0aGlzLnNldEZyZWVEcmFnUG9zaXRpb24oe3ksIHh9KTtcbiAgICB9XG4gIH1cblxuICAvKiogR2V0cyB0aGUgZHJhZyBzdGFydCBkZWxheSwgYmFzZWQgb24gdGhlIGV2ZW50IHR5cGUuICovXG4gIHByaXZhdGUgX2dldERyYWdTdGFydERlbGF5KGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCk6IG51bWJlciB7XG4gICAgY29uc3QgdmFsdWUgPSB0aGlzLmRyYWdTdGFydERlbGF5O1xuXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9IGVsc2UgaWYgKGlzVG91Y2hFdmVudChldmVudCkpIHtcbiAgICAgIHJldHVybiB2YWx1ZS50b3VjaDtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWUgPyB2YWx1ZS5tb3VzZSA6IDA7XG4gIH1cblxuICAvKiogVXBkYXRlcyB0aGUgaW50ZXJuYWwgc3RhdGUgb2YgdGhlIGRyYWdnYWJsZSBlbGVtZW50IHdoZW4gc2Nyb2xsaW5nIGhhcyBvY2N1cnJlZC4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlT25TY3JvbGwoZXZlbnQ6IEV2ZW50KSB7XG4gICAgY29uc3Qgc2Nyb2xsRGlmZmVyZW5jZSA9IHRoaXMuX3BhcmVudFBvc2l0aW9ucy5oYW5kbGVTY3JvbGwoZXZlbnQpO1xuXG4gICAgaWYgKHNjcm9sbERpZmZlcmVuY2UpIHtcbiAgICAgIGNvbnN0IHRhcmdldCA9IF9nZXRFdmVudFRhcmdldDxIVE1MRWxlbWVudHxEb2N1bWVudD4oZXZlbnQpITtcblxuICAgICAgLy8gQ2xpZW50UmVjdCBkaW1lbnNpb25zIGFyZSBiYXNlZCBvbiB0aGUgc2Nyb2xsIHBvc2l0aW9uIG9mIHRoZSBwYWdlIGFuZCBpdHMgcGFyZW50XG4gICAgICAvLyBub2RlIHNvIHdlIGhhdmUgdG8gdXBkYXRlIHRoZSBjYWNoZWQgYm91bmRhcnkgQ2xpZW50UmVjdCBpZiB0aGUgdXNlciBoYXMgc2Nyb2xsZWQuXG4gICAgICBpZiAodGhpcy5fYm91bmRhcnlSZWN0ICYmIHRhcmdldCAhPT0gdGhpcy5fYm91bmRhcnlFbGVtZW50ICYmXG4gICAgICAgICAgdGFyZ2V0LmNvbnRhaW5zKHRoaXMuX2JvdW5kYXJ5RWxlbWVudCkpIHtcbiAgICAgICAgYWRqdXN0Q2xpZW50UmVjdCh0aGlzLl9ib3VuZGFyeVJlY3QsIHNjcm9sbERpZmZlcmVuY2UudG9wLCBzY3JvbGxEaWZmZXJlbmNlLmxlZnQpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZS54ICs9IHNjcm9sbERpZmZlcmVuY2UubGVmdDtcbiAgICAgIHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLnkgKz0gc2Nyb2xsRGlmZmVyZW5jZS50b3A7XG5cbiAgICAgIC8vIElmIHdlJ3JlIGluIGZyZWUgZHJhZyBtb2RlLCB3ZSBoYXZlIHRvIHVwZGF0ZSB0aGUgYWN0aXZlIHRyYW5zZm9ybSwgYmVjYXVzZVxuICAgICAgLy8gaXQgaXNuJ3QgcmVsYXRpdmUgdG8gdGhlIHZpZXdwb3J0IGxpa2UgdGhlIHByZXZpZXcgaW5zaWRlIGEgZHJvcCBsaXN0LlxuICAgICAgaWYgKCF0aGlzLl9kcm9wQ29udGFpbmVyKSB7XG4gICAgICAgIHRoaXMuX2FjdGl2ZVRyYW5zZm9ybS54IC09IHNjcm9sbERpZmZlcmVuY2UubGVmdDtcbiAgICAgICAgdGhpcy5fYWN0aXZlVHJhbnNmb3JtLnkgLT0gc2Nyb2xsRGlmZmVyZW5jZS50b3A7XG4gICAgICAgIHRoaXMuX2FwcGx5Um9vdEVsZW1lbnRUcmFuc2Zvcm0odGhpcy5fYWN0aXZlVHJhbnNmb3JtLngsIHRoaXMuX2FjdGl2ZVRyYW5zZm9ybS55KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogR2V0cyB0aGUgc2Nyb2xsIHBvc2l0aW9uIG9mIHRoZSB2aWV3cG9ydC4gKi9cbiAgcHJpdmF0ZSBfZ2V0Vmlld3BvcnRTY3JvbGxQb3NpdGlvbigpIHtcbiAgICBjb25zdCBjYWNoZWRQb3NpdGlvbiA9IHRoaXMuX3BhcmVudFBvc2l0aW9ucy5wb3NpdGlvbnMuZ2V0KHRoaXMuX2RvY3VtZW50KTtcbiAgICByZXR1cm4gY2FjaGVkUG9zaXRpb24gPyBjYWNoZWRQb3NpdGlvbi5zY3JvbGxQb3NpdGlvbiA6XG4gICAgICAgIHRoaXMuX3ZpZXdwb3J0UnVsZXIuZ2V0Vmlld3BvcnRTY3JvbGxQb3NpdGlvbigpO1xuICB9XG5cbiAgLyoqXG4gICAqIExhemlseSByZXNvbHZlcyBhbmQgcmV0dXJucyB0aGUgc2hhZG93IHJvb3Qgb2YgdGhlIGVsZW1lbnQuIFdlIGRvIHRoaXMgaW4gYSBmdW5jdGlvbiwgcmF0aGVyXG4gICAqIHRoYW4gc2F2aW5nIGl0IGluIHByb3BlcnR5IGRpcmVjdGx5IG9uIGluaXQsIGJlY2F1c2Ugd2Ugd2FudCB0byByZXNvbHZlIGl0IGFzIGxhdGUgYXMgcG9zc2libGVcbiAgICogaW4gb3JkZXIgdG8gZW5zdXJlIHRoYXQgdGhlIGVsZW1lbnQgaGFzIGJlZW4gbW92ZWQgaW50byB0aGUgc2hhZG93IERPTS4gRG9pbmcgaXQgaW5zaWRlIHRoZVxuICAgKiBjb25zdHJ1Y3RvciBtaWdodCBiZSB0b28gZWFybHkgaWYgdGhlIGVsZW1lbnQgaXMgaW5zaWRlIG9mIHNvbWV0aGluZyBsaWtlIGBuZ0ZvcmAgb3IgYG5nSWZgLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0U2hhZG93Um9vdCgpOiBTaGFkb3dSb290IHwgbnVsbCB7XG4gICAgaWYgKHRoaXMuX2NhY2hlZFNoYWRvd1Jvb3QgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5fY2FjaGVkU2hhZG93Um9vdCA9IF9nZXRTaGFkb3dSb290KHRoaXMuX3Jvb3RFbGVtZW50KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fY2FjaGVkU2hhZG93Um9vdDtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBlbGVtZW50IGludG8gd2hpY2ggdGhlIGRyYWcgcHJldmlldyBzaG91bGQgYmUgaW5zZXJ0ZWQuICovXG4gIHByaXZhdGUgX2dldFByZXZpZXdJbnNlcnRpb25Qb2ludChpbml0aWFsUGFyZW50OiBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNoYWRvd1Jvb3Q6IFNoYWRvd1Jvb3QgfCBudWxsKTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IHByZXZpZXdDb250YWluZXIgPSB0aGlzLl9wcmV2aWV3Q29udGFpbmVyIHx8ICdnbG9iYWwnO1xuXG4gICAgaWYgKHByZXZpZXdDb250YWluZXIgPT09ICdwYXJlbnQnKSB7XG4gICAgICByZXR1cm4gaW5pdGlhbFBhcmVudDtcbiAgICB9XG5cbiAgICBpZiAocHJldmlld0NvbnRhaW5lciA9PT0gJ2dsb2JhbCcpIHtcbiAgICAgIGNvbnN0IGRvY3VtZW50UmVmID0gdGhpcy5fZG9jdW1lbnQ7XG5cbiAgICAgIC8vIFdlIGNhbid0IHVzZSB0aGUgYm9keSBpZiB0aGUgdXNlciBpcyBpbiBmdWxsc2NyZWVuIG1vZGUsXG4gICAgICAvLyBiZWNhdXNlIHRoZSBwcmV2aWV3IHdpbGwgcmVuZGVyIHVuZGVyIHRoZSBmdWxsc2NyZWVuIGVsZW1lbnQuXG4gICAgICAvLyBUT0RPKGNyaXNiZXRvKTogZGVkdXBlIHRoaXMgd2l0aCB0aGUgYEZ1bGxzY3JlZW5PdmVybGF5Q29udGFpbmVyYCBldmVudHVhbGx5LlxuICAgICAgcmV0dXJuIHNoYWRvd1Jvb3QgfHxcbiAgICAgICAgICAgICBkb2N1bWVudFJlZi5mdWxsc2NyZWVuRWxlbWVudCB8fFxuICAgICAgICAgICAgIChkb2N1bWVudFJlZiBhcyBhbnkpLndlYmtpdEZ1bGxzY3JlZW5FbGVtZW50IHx8XG4gICAgICAgICAgICAgKGRvY3VtZW50UmVmIGFzIGFueSkubW96RnVsbFNjcmVlbkVsZW1lbnQgfHxcbiAgICAgICAgICAgICAoZG9jdW1lbnRSZWYgYXMgYW55KS5tc0Z1bGxzY3JlZW5FbGVtZW50IHx8XG4gICAgICAgICAgICAgZG9jdW1lbnRSZWYuYm9keTtcbiAgICB9XG5cbiAgICByZXR1cm4gY29lcmNlRWxlbWVudChwcmV2aWV3Q29udGFpbmVyKTtcbiAgfVxufVxuXG4vKipcbiAqIEdldHMgYSAzZCBgdHJhbnNmb3JtYCB0aGF0IGNhbiBiZSBhcHBsaWVkIHRvIGFuIGVsZW1lbnQuXG4gKiBAcGFyYW0geCBEZXNpcmVkIHBvc2l0aW9uIG9mIHRoZSBlbGVtZW50IGFsb25nIHRoZSBYIGF4aXMuXG4gKiBAcGFyYW0geSBEZXNpcmVkIHBvc2l0aW9uIG9mIHRoZSBlbGVtZW50IGFsb25nIHRoZSBZIGF4aXMuXG4gKi9cbmZ1bmN0aW9uIGdldFRyYW5zZm9ybSh4OiBudW1iZXIsIHk6IG51bWJlcik6IHN0cmluZyB7XG4gIC8vIFJvdW5kIHRoZSB0cmFuc2Zvcm1zIHNpbmNlIHNvbWUgYnJvd3NlcnMgd2lsbFxuICAvLyBibHVyIHRoZSBlbGVtZW50cyBmb3Igc3ViLXBpeGVsIHRyYW5zZm9ybXMuXG4gIHJldHVybiBgdHJhbnNsYXRlM2QoJHtNYXRoLnJvdW5kKHgpfXB4LCAke01hdGgucm91bmQoeSl9cHgsIDApYDtcbn1cblxuLyoqIENsYW1wcyBhIHZhbHVlIGJldHdlZW4gYSBtaW5pbXVtIGFuZCBhIG1heGltdW0uICovXG5mdW5jdGlvbiBjbGFtcCh2YWx1ZTogbnVtYmVyLCBtaW46IG51bWJlciwgbWF4OiBudW1iZXIpIHtcbiAgcmV0dXJuIE1hdGgubWF4KG1pbiwgTWF0aC5taW4obWF4LCB2YWx1ZSkpO1xufVxuXG4vKiogRGV0ZXJtaW5lcyB3aGV0aGVyIGFuIGV2ZW50IGlzIGEgdG91Y2ggZXZlbnQuICovXG5mdW5jdGlvbiBpc1RvdWNoRXZlbnQoZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KTogZXZlbnQgaXMgVG91Y2hFdmVudCB7XG4gIC8vIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGZvciBldmVyeSBwaXhlbCB0aGF0IHRoZSB1c2VyIGhhcyBkcmFnZ2VkIHNvIHdlIG5lZWQgaXQgdG8gYmVcbiAgLy8gYXMgZmFzdCBhcyBwb3NzaWJsZS4gU2luY2Ugd2Ugb25seSBiaW5kIG1vdXNlIGV2ZW50cyBhbmQgdG91Y2ggZXZlbnRzLCB3ZSBjYW4gYXNzdW1lXG4gIC8vIHRoYXQgaWYgdGhlIGV2ZW50J3MgbmFtZSBzdGFydHMgd2l0aCBgdGAsIGl0J3MgYSB0b3VjaCBldmVudC5cbiAgcmV0dXJuIGV2ZW50LnR5cGVbMF0gPT09ICd0Jztcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSByb290IEhUTUwgZWxlbWVudCBvZiBhbiBlbWJlZGRlZCB2aWV3LlxuICogSWYgdGhlIHJvb3QgaXMgbm90IGFuIEhUTUwgZWxlbWVudCBpdCBnZXRzIHdyYXBwZWQgaW4gb25lLlxuICovXG5mdW5jdGlvbiBnZXRSb290Tm9kZSh2aWV3UmVmOiBFbWJlZGRlZFZpZXdSZWY8YW55PiwgX2RvY3VtZW50OiBEb2N1bWVudCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3Qgcm9vdE5vZGVzOiBOb2RlW10gPSB2aWV3UmVmLnJvb3ROb2RlcztcblxuICBpZiAocm9vdE5vZGVzLmxlbmd0aCA9PT0gMSAmJiByb290Tm9kZXNbMF0ubm9kZVR5cGUgPT09IF9kb2N1bWVudC5FTEVNRU5UX05PREUpIHtcbiAgICByZXR1cm4gcm9vdE5vZGVzWzBdIGFzIEhUTUxFbGVtZW50O1xuICB9XG5cbiAgY29uc3Qgd3JhcHBlciA9IF9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgcm9vdE5vZGVzLmZvckVhY2gobm9kZSA9PiB3cmFwcGVyLmFwcGVuZENoaWxkKG5vZGUpKTtcbiAgcmV0dXJuIHdyYXBwZXI7XG59XG5cbi8qKlxuICogTWF0Y2hlcyB0aGUgdGFyZ2V0IGVsZW1lbnQncyBzaXplIHRvIHRoZSBzb3VyY2UncyBzaXplLlxuICogQHBhcmFtIHRhcmdldCBFbGVtZW50IHRoYXQgbmVlZHMgdG8gYmUgcmVzaXplZC5cbiAqIEBwYXJhbSBzb3VyY2VSZWN0IERpbWVuc2lvbnMgb2YgdGhlIHNvdXJjZSBlbGVtZW50LlxuICovXG5mdW5jdGlvbiBtYXRjaEVsZW1lbnRTaXplKHRhcmdldDogSFRNTEVsZW1lbnQsIHNvdXJjZVJlY3Q6IENsaWVudFJlY3QpOiB2b2lkIHtcbiAgdGFyZ2V0LnN0eWxlLndpZHRoID0gYCR7c291cmNlUmVjdC53aWR0aH1weGA7XG4gIHRhcmdldC5zdHlsZS5oZWlnaHQgPSBgJHtzb3VyY2VSZWN0LmhlaWdodH1weGA7XG4gIHRhcmdldC5zdHlsZS50cmFuc2Zvcm0gPSBnZXRUcmFuc2Zvcm0oc291cmNlUmVjdC5sZWZ0LCBzb3VyY2VSZWN0LnRvcCk7XG59XG4iXX0=