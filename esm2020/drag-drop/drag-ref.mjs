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
import { combineTransforms, extendStyles, toggleNativeDragInteractions, toggleVisibility, } from './dom/styling';
import { getTransformTransitionDurationInMs } from './dom/transition-duration';
import { getMutableClientRect, adjustClientRect } from './dom/client-rect';
import { ParentPositionTracker } from './dom/parent-position-tracker';
import { deepCloneNode } from './dom/clone-node';
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
                const targetHandle = this._getTargetHandle(event);
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
                // If there's a position constraint function, we want the element's top/left to be at the
                // specific position on the page. Use the initial position as a reference if that's the case.
                const offset = this.constrainPosition ? this._initialClientRect : this._pickupPositionOnPage;
                const activeTransform = this._activeTransform;
                activeTransform.x = constrainedPointerPosition.x - offset.x + this._passiveTransform.x;
                activeTransform.y = constrainedPointerPosition.y - offset.y + this._passiveTransform.y;
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
        /** Handles a native `dragstart` event. */
        this._nativeDragStart = (event) => {
            if (this._handles.length) {
                const targetHandle = this._getTargetHandle(event);
                if (targetHandle && !this._disabledHandles.has(targetHandle) && !this.disabled) {
                    event.preventDefault();
                }
            }
            else if (!this.disabled) {
                // Usually this isn't necessary since the we prevent the default action in `pointerDown`,
                // but some cases like dragging of links can slip through (see #24403).
                event.preventDefault();
            }
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
                element.addEventListener('dragstart', this._nativeDragStart, activeEventListenerOptions);
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
        this._initialClientRect = this._rootElement.getBoundingClientRect();
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
                : this._getPointerPositionInElement(this._initialClientRect, referenceElement, event);
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
        this._initialClientRect =
            this._boundaryRect =
                this._previewRect =
                    this._initialTransform =
                        undefined;
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
            if (this.constrainPosition) {
                this._applyPreviewTransform(x, y);
            }
            else {
                this._applyPreviewTransform(x - this._pickupPositionInElement.x, y - this._pickupPositionInElement.y);
            }
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
            const rootRect = previewConfig.matchSize ? this._initialClientRect : null;
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
            preview = deepCloneNode(this._rootElement);
            matchElementSize(preview, this._initialClientRect);
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
    _getPointerPositionInElement(elementRect, referenceElement, event) {
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
        let { x, y } = this.constrainPosition
            ? this.constrainPosition(point, this, this._initialClientRect)
            : point;
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
        element.removeEventListener('dragstart', this._nativeDragStart, activeEventListenerOptions);
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
        // Note: don't use `_clientRectAtStart` here, because we want the latest position.
        const elementRect = this._rootElement.getBoundingClientRect();
        const boundaryRect = this._boundaryElement.getBoundingClientRect();
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
            this._previewRect = this._preview
                ? this._preview.getBoundingClientRect()
                : this._initialClientRect;
        }
        return this._previewRect;
    }
    /** Gets a handle that is the target of an event. */
    _getTargetHandle(event) {
        return this._handles.find(handle => {
            return event.target && (event.target === handle || handle.contains(event.target));
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2RyYWctZHJvcC9kcmFnLXJlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFLSCxPQUFPLEVBQ0wsK0JBQStCLEVBQy9CLGVBQWUsRUFDZixjQUFjLEdBQ2YsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQUMscUJBQXFCLEVBQUUsYUFBYSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDM0UsT0FBTyxFQUFDLCtCQUErQixFQUFFLGdDQUFnQyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDcEcsT0FBTyxFQUFDLFlBQVksRUFBRSxPQUFPLEVBQWEsTUFBTSxNQUFNLENBQUM7QUFHdkQsT0FBTyxFQUNMLGlCQUFpQixFQUVqQixZQUFZLEVBQ1osNEJBQTRCLEVBQzVCLGdCQUFnQixHQUNqQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsa0NBQWtDLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUM3RSxPQUFPLEVBQUMsb0JBQW9CLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN6RSxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUNwRSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUF1Qi9DLGlFQUFpRTtBQUNqRSxNQUFNLDJCQUEyQixHQUFHLCtCQUErQixDQUFDLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7QUFFckYsaUVBQWlFO0FBQ2pFLE1BQU0sMEJBQTBCLEdBQUcsK0JBQStCLENBQUMsRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQztBQUVyRjs7Ozs7R0FLRztBQUNILE1BQU0sdUJBQXVCLEdBQUcsR0FBRyxDQUFDO0FBOEJwQyw4REFBOEQ7QUFDOUQsTUFBTSx1QkFBdUIsR0FBRyxJ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T0FBTyxHQUFHLFNBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDL0MsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNyRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQVMsZ0JBQWdCLENBQUMsTUFBbUIsRUFBRSxVQUFzQjtJQUNuRSxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxHQUFHLFVBQVUsQ0FBQyxLQUFLLElBQUksQ0FBQztJQUM3QyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxHQUFHLFVBQVUsQ0FBQyxNQUFNLElBQUksQ0FBQztJQUMvQyxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxZQUFZLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDekUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0VtYmVkZGVkVmlld1JlZiwgRWxlbWVudFJlZiwgTmdab25lLCBWaWV3Q29udGFpbmVyUmVmLCBUZW1wbGF0ZVJlZn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1ZpZXdwb3J0UnVsZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9zY3JvbGxpbmcnO1xuaW1wb3J0IHtEaXJlY3Rpb259IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7XG4gIG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMsXG4gIF9nZXRFdmVudFRhcmdldCxcbiAgX2dldFNoYWRvd1Jvb3QsXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge2NvZXJjZUJvb2xlYW5Qcm9wZXJ0eSwgY29lcmNlRWxlbWVudH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7aXNGYWtlTW91c2Vkb3duRnJvbVNjcmVlblJlYWRlciwgaXNGYWtlVG91Y2hzdGFydEZyb21TY3JlZW5SZWFkZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9hMTF5JztcbmltcG9ydCB7U3Vic2NyaXB0aW9uLCBTdWJqZWN0LCBPYnNlcnZhYmxlfSBmcm9tICdyeGpzJztcbmltcG9ydCB7RHJvcExpc3RSZWZJbnRlcm5hbCBhcyBEcm9wTGlzdFJlZn0gZnJvbSAnLi9kcm9wLWxpc3QtcmVmJztcbmltcG9ydCB7RHJhZ0Ryb3BSZWdpc3RyeX0gZnJvbSAnLi9kcmFnLWRyb3AtcmVnaXN0cnknO1xuaW1wb3J0IHtcbiAgY29tYmluZVRyYW5zZm9ybXMsXG4gIERyYWdDU1NTdHlsZURlY2xhcmF0aW9uLFxuICBleHRlbmRTdHlsZXMsXG4gIHRvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMsXG4gIHRvZ2dsZVZpc2liaWxpdHksXG59IGZyb20gJy4vZG9tL3N0eWxpbmcnO1xuaW1wb3J0IHtnZXRUcmFuc2Zvcm1UcmFuc2l0aW9uRHVyYXRpb25Jbk1zfSBmcm9tICcuL2RvbS90cmFuc2l0aW9uLWR1cmF0aW9uJztcbmltcG9ydCB7Z2V0TXV0YWJsZUNsaWVudFJlY3QsIGFkanVzdENsaWVudFJlY3R9IGZyb20gJy4vZG9tL2NsaWVudC1yZWN0JztcbmltcG9ydCB7UGFyZW50UG9zaXRpb25UcmFja2VyfSBmcm9tICcuL2RvbS9wYXJlbnQtcG9zaXRpb24tdHJhY2tlcic7XG5pbXBvcnQge2RlZXBDbG9uZU5vZGV9IGZyb20gJy4vZG9tL2Nsb25lLW5vZGUnO1xuXG4vKiogT2JqZWN0IHRoYXQgY2FuIGJlIHVzZWQgdG8gY29uZmlndXJlIHRoZSBiZWhhdmlvciBvZiBEcmFnUmVmLiAqL1xuZXhwb3J0IGludGVyZmFjZSBEcmFnUmVmQ29uZmlnIHtcbiAgLyoqXG4gICAqIE1pbmltdW0gYW1vdW50IG9mIHBpeGVscyB0aGF0IHRoZSB1c2VyIHNob3VsZFxuICAgKiBkcmFnLCBiZWZvcmUgdGhlIENESyBpbml0aWF0ZXMgYSBkcmFnIHNlcXVlbmNlLlxuICAgKi9cbiAgZHJhZ1N0YXJ0VGhyZXNob2xkOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEFtb3VudCB0aGUgcGl4ZWxzIHRoZSB1c2VyIHNob3VsZCBkcmFnIGJlZm9yZSB0aGUgQ0RLXG4gICAqIGNvbnNpZGVycyB0aGVtIHRvIGhhdmUgY2hhbmdlZCB0aGUgZHJhZyBkaXJlY3Rpb24uXG4gICAqL1xuICBwb2ludGVyRGlyZWN0aW9uQ2hhbmdlVGhyZXNob2xkOiBudW1iZXI7XG5cbiAgLyoqIGB6LWluZGV4YCBmb3IgdGhlIGFic29sdXRlbHktcG9zaXRpb25lZCBlbGVtZW50cyB0aGF0IGFyZSBjcmVhdGVkIGJ5IHRoZSBkcmFnIGl0ZW0uICovXG4gIHpJbmRleD86IG51bWJlcjtcblxuICAvKiogUmVmIHRoYXQgdGhlIGN1cnJlbnQgZHJhZyBpdGVtIGlzIG5lc3RlZCBpbi4gKi9cbiAgcGFyZW50RHJhZ1JlZj86IERyYWdSZWY7XG59XG5cbi8qKiBPcHRpb25zIHRoYXQgY2FuIGJlIHVzZWQgdG8gYmluZCBhIHBhc3NpdmUgZXZlbnQgbGlzdGVuZXIuICovXG5jb25zdCBwYXNzaXZlRXZlbnRMaXN0ZW5lck9wdGlvbnMgPSBub3JtYWxpemVQYXNzaXZlTGlzdGVuZXJPcHRpb25zKHtwYXNzaXZlOiB0cnVlfSk7XG5cbi8qKiBPcHRpb25zIHRoYXQgY2FuIGJlIHVzZWQgdG8gYmluZCBhbiBhY3RpdmUgZXZlbnQgbGlzdGVuZXIuICovXG5jb25zdCBhY3RpdmVFdmVudExpc3RlbmVyT3B0aW9ucyA9IG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMoe3Bhc3NpdmU6IGZhbHNlfSk7XG5cbi8qKlxuICogVGltZSBpbiBtaWxsaXNlY29uZHMgZm9yIHdoaWNoIHRvIGlnbm9yZSBtb3VzZSBldmVudHMsIGFmdGVyXG4gKiByZWNlaXZpbmcgYSB0b3VjaCBldmVudC4gVXNlZCB0byBhdm9pZCBkb2luZyBkb3VibGUgd29yayBmb3JcbiAqIHRvdWNoIGRldmljZXMgd2hlcmUgdGhlIGJyb3dzZXIgZmlyZXMgZmFrZSBtb3VzZSBldmVudHMsIGluXG4gKiBhZGRpdGlvbiB0byB0b3VjaCBldmVudHMuXG4gKi9cbmNvbnN0IE1PVVNFX0VWRU5UX0lHTk9SRV9USU1FID0gODAwO1xuXG4vLyBUT0RPKGNyaXNiZXRvKTogYWRkIGFuIEFQSSBmb3IgbW92aW5nIGEgZHJhZ2dhYmxlIHVwL2Rvd24gdGhlXG4vLyBsaXN0IHByb2dyYW1tYXRpY2FsbHkuIFVzZWZ1bCBmb3Iga2V5Ym9hcmQgY29udHJvbHMuXG5cbi8qKlxuICogSW50ZXJuYWwgY29tcGlsZS10aW1lLW9ubHkgcmVwcmVzZW50YXRpb24gb2YgYSBgRHJhZ1JlZmAuXG4gKiBVc2VkIHRvIGF2b2lkIGNpcmN1bGFyIGltcG9ydCBpc3N1ZXMgYmV0d2VlbiB0aGUgYERyYWdSZWZgIGFuZCB0aGUgYERyb3BMaXN0UmVmYC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEcmFnUmVmSW50ZXJuYWwgZXh0ZW5kcyBEcmFnUmVmIHt9XG5cbi8qKiBUZW1wbGF0ZSB0aGF0IGNhbiBiZSB1c2VkIHRvIGNyZWF0ZSBhIGRyYWcgaGVscGVyIGVsZW1lbnQgKGUuZy4gYSBwcmV2aWV3IG9yIGEgcGxhY2Vob2xkZXIpLiAqL1xuaW50ZXJmYWNlIERyYWdIZWxwZXJUZW1wbGF0ZTxUID0gYW55PiB7XG4gIHRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxUPiB8IG51bGw7XG4gIHZpZXdDb250YWluZXI6IFZpZXdDb250YWluZXJSZWY7XG4gIGNvbnRleHQ6IFQ7XG59XG5cbi8qKiBUZW1wbGF0ZSB0aGF0IGNhbiBiZSB1c2VkIHRvIGNyZWF0ZSBhIGRyYWcgcHJldmlldyBlbGVtZW50LiAqL1xuaW50ZXJmYWNlIERyYWdQcmV2aWV3VGVtcGxhdGU8VCA9IGFueT4gZXh0ZW5kcyBEcmFnSGVscGVyVGVtcGxhdGU8VD4ge1xuICBtYXRjaFNpemU/OiBib29sZWFuO1xufVxuXG4vKiogUG9pbnQgb24gdGhlIHBhZ2Ugb3Igd2l0aGluIGFuIGVsZW1lbnQuICovXG5leHBvcnQgaW50ZXJmYWNlIFBvaW50IHtcbiAgeDogbnVtYmVyO1xuICB5OiBudW1iZXI7XG59XG5cbi8qKiBJbmxpbmUgc3R5bGVzIHRvIGJlIHNldCBhcyBgIWltcG9ydGFudGAgd2hpbGUgZHJhZ2dpbmcuICovXG5jb25zdCBkcmFnSW1wb3J0YW50UHJvcGVydGllcyA9IG5ldyBTZXQoW1xuICAvLyBOZWVkcyB0byBiZSBpbXBvcnRhbnQsIGJlY2F1c2Ugc29tZSBgbWF0LXRhYmxlYCBzZXRzIGBwb3NpdGlvbjogc3RpY2t5ICFpbXBvcnRhbnRgLiBTZWUgIzIyNzgxLlxuICAncG9zaXRpb24nLFxuXSk7XG5cbi8qKlxuICogUG9zc2libGUgcGxhY2VzIGludG8gd2hpY2ggdGhlIHByZXZpZXcgb2YgYSBkcmFnIGl0ZW0gY2FuIGJlIGluc2VydGVkLlxuICogLSBgZ2xvYmFsYCAtIFByZXZpZXcgd2lsbCBiZSBpbnNlcnRlZCBhdCB0aGUgYm90dG9tIG9mIHRoZSBgPGJvZHk+YC4gVGhlIGFkdmFudGFnZSBpcyB0aGF0XG4gKiB5b3UgZG9uJ3QgaGF2ZSB0byB3b3JyeSBhYm91dCBgb3ZlcmZsb3c6IGhpZGRlbmAgb3IgYHotaW5kZXhgLCBidXQgdGhlIGl0ZW0gd29uJ3QgcmV0YWluXG4gKiBpdHMgaW5oZXJpdGVkIHN0eWxlcy5cbiAqIC0gYHBhcmVudGAgLSBQcmV2aWV3IHdpbGwgYmUgaW5zZXJ0ZWQgaW50byB0aGUgcGFyZW50IG9mIHRoZSBkcmFnIGl0ZW0uIFRoZSBhZHZhbnRhZ2UgaXMgdGhhdFxuICogaW5oZXJpdGVkIHN0eWxlcyB3aWxsIGJlIHByZXNlcnZlZCwgYnV0IGl0IG1heSBiZSBjbGlwcGVkIGJ5IGBvdmVyZmxvdzogaGlkZGVuYCBvciBub3QgYmVcbiAqIHZpc2libGUgZHVlIHRvIGB6LWluZGV4YC4gRnVydGhlcm1vcmUsIHRoZSBwcmV2aWV3IGlzIGdvaW5nIHRvIGhhdmUgYW4gZWZmZWN0IG92ZXIgc2VsZWN0b3JzXG4gKiBsaWtlIGA6bnRoLWNoaWxkYCBhbmQgc29tZSBmbGV4Ym94IGNvbmZpZ3VyYXRpb25zLlxuICogLSBgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBIVE1MRWxlbWVudGAgLSBQcmV2aWV3IHdpbGwgYmUgaW5zZXJ0ZWQgaW50byBhIHNwZWNpZmljIGVsZW1lbnQuXG4gKiBTYW1lIGFkdmFudGFnZXMgYW5kIGRpc2FkdmFudGFnZXMgYXMgYHBhcmVudGAuXG4gKi9cbmV4cG9ydCB0eXBlIFByZXZpZXdDb250YWluZXIgPSAnZ2xvYmFsJyB8ICdwYXJlbnQnIHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBIVE1MRWxlbWVudDtcblxuLyoqXG4gKiBSZWZlcmVuY2UgdG8gYSBkcmFnZ2FibGUgaXRlbS4gVXNlZCB0byBtYW5pcHVsYXRlIG9yIGRpc3Bvc2Ugb2YgdGhlIGl0ZW0uXG4gKi9cbmV4cG9ydCBjbGFzcyBEcmFnUmVmPFQgPSBhbnk+IHtcbiAgLyoqIEVsZW1lbnQgZGlzcGxheWVkIG5leHQgdG8gdGhlIHVzZXIncyBwb2ludGVyIHdoaWxlIHRoZSBlbGVtZW50IGlzIGRyYWdnZWQuICovXG4gIHByaXZhdGUgX3ByZXZpZXc6IEhUTUxFbGVtZW50O1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIHZpZXcgb2YgdGhlIHByZXZpZXcgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfcHJldmlld1JlZjogRW1iZWRkZWRWaWV3UmVmPGFueT4gfCBudWxsO1xuXG4gIC8qKiBDb250YWluZXIgaW50byB3aGljaCB0byBpbnNlcnQgdGhlIHByZXZpZXcuICovXG4gIHByaXZhdGUgX3ByZXZpZXdDb250YWluZXI6IFByZXZpZXdDb250YWluZXIgfCB1bmRlZmluZWQ7XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgdmlldyBvZiB0aGUgcGxhY2Vob2xkZXIgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfcGxhY2Vob2xkZXJSZWY6IEVtYmVkZGVkVmlld1JlZjxhbnk+IHwgbnVsbDtcblxuICAvKiogRWxlbWVudCB0aGF0IGlzIHJlbmRlcmVkIGluc3RlYWQgb2YgdGhlIGRyYWdnYWJsZSBpdGVtIHdoaWxlIGl0IGlzIGJlaW5nIHNvcnRlZC4gKi9cbiAgcHJpdmF0ZSBfcGxhY2Vob2xkZXI6IEhUTUxFbGVtZW50O1xuXG4gIC8qKiBDb29yZGluYXRlcyB3aXRoaW4gdGhlIGVsZW1lbnQgYXQgd2hpY2ggdGhlIHVzZXIgcGlja2VkIHVwIHRoZSBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9waWNrdXBQb3NpdGlvbkluRWxlbWVudDogUG9pbnQ7XG5cbiAgLyoqIENvb3JkaW5hdGVzIG9uIHRoZSBwYWdlIGF0IHdoaWNoIHRoZSB1c2VyIHBpY2tlZCB1cCB0aGUgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfcGlja3VwUG9zaXRpb25PblBhZ2U6IFBvaW50O1xuXG4gIC8qKlxuICAgKiBBbmNob3Igbm9kZSB1c2VkIHRvIHNhdmUgdGhlIHBsYWNlIGluIHRoZSBET00gd2hlcmUgdGhlIGVsZW1lbnQgd2FzXG4gICAqIHBpY2tlZCB1cCBzbyB0aGF0IGl0IGNhbiBiZSByZXN0b3JlZCBhdCB0aGUgZW5kIG9mIHRoZSBkcmFnIHNlcXVlbmNlLlxuICAgKi9cbiAgcHJpdmF0ZSBfYW5jaG9yOiBDb21tZW50O1xuXG4gIC8qKlxuICAgKiBDU1MgYHRyYW5zZm9ybWAgYXBwbGllZCB0byB0aGUgZWxlbWVudCB3aGVuIGl0IGlzbid0IGJlaW5nIGRyYWdnZWQuIFdlIG5lZWQgYVxuICAgKiBwYXNzaXZlIHRyYW5zZm9ybSBpbiBvcmRlciBmb3IgdGhlIGRyYWdnZWQgZWxlbWVudCB0byByZXRhaW4gaXRzIG5ldyBwb3NpdGlvblxuICAgKiBhZnRlciB0aGUgdXNlciBoYXMgc3RvcHBlZCBkcmFnZ2luZyBhbmQgYmVjYXVzZSB3ZSBuZWVkIHRvIGtub3cgdGhlIHJlbGF0aXZlXG4gICAqIHBvc2l0aW9uIGluIGNhc2UgdGhleSBzdGFydCBkcmFnZ2luZyBhZ2Fpbi4gVGhpcyBjb3JyZXNwb25kcyB0byBgZWxlbWVudC5zdHlsZS50cmFuc2Zvcm1gLlxuICAgKi9cbiAgcHJpdmF0ZSBfcGFzc2l2ZVRyYW5zZm9ybTogUG9pbnQgPSB7eDogMCwgeTogMH07XG5cbiAgLyoqIENTUyBgdHJhbnNmb3JtYCB0aGF0IGlzIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgd2hpbGUgaXQncyBiZWluZyBkcmFnZ2VkLiAqL1xuICBwcml2YXRlIF9hY3RpdmVUcmFuc2Zvcm06IFBvaW50ID0ge3g6IDAsIHk6IDB9O1xuXG4gIC8qKiBJbmxpbmUgYHRyYW5zZm9ybWAgdmFsdWUgdGhhdCB0aGUgZWxlbWVudCBoYWQgYmVmb3JlIHRoZSBmaXJzdCBkcmFnZ2luZyBzZXF1ZW5jZS4gKi9cbiAgcHJpdmF0ZSBfaW5pdGlhbFRyYW5zZm9ybT86IHN0cmluZztcblxuICAvKipcbiAgICogV2hldGhlciB0aGUgZHJhZ2dpbmcgc2VxdWVuY2UgaGFzIGJlZW4gc3RhcnRlZC4gRG9lc24ndFxuICAgKiBuZWNlc3NhcmlseSBtZWFuIHRoYXQgdGhlIGVsZW1lbnQgaGFzIGJlZW4gbW92ZWQuXG4gICAqL1xuICBwcml2YXRlIF9oYXNTdGFydGVkRHJhZ2dpbmcgPSBmYWxzZTtcblxuICAvKiogV2hldGhlciB0aGUgZWxlbWVudCBoYXMgbW92ZWQgc2luY2UgdGhlIHVzZXIgc3RhcnRlZCBkcmFnZ2luZyBpdC4gKi9cbiAgcHJpdmF0ZSBfaGFzTW92ZWQ6IGJvb2xlYW47XG5cbiAgLyoqIERyb3AgY29udGFpbmVyIGluIHdoaWNoIHRoZSBEcmFnUmVmIHJlc2lkZWQgd2hlbiBkcmFnZ2luZyBiZWdhbi4gKi9cbiAgcHJpdmF0ZSBfaW5pdGlhbENvbnRhaW5lcjogRHJvcExpc3RSZWY7XG5cbiAgLyoqIEluZGV4IGF0IHdoaWNoIHRoZSBpdGVtIHN0YXJ0ZWQgaW4gaXRzIGluaXRpYWwgY29udGFpbmVyLiAqL1xuICBwcml2YXRlIF9pbml0aWFsSW5kZXg6IG51bWJlcjtcblxuICAvKiogQ2FjaGVkIHBvc2l0aW9ucyBvZiBzY3JvbGxhYmxlIHBhcmVudCBlbGVtZW50cy4gKi9cbiAgcHJpdmF0ZSBfcGFyZW50UG9zaXRpb25zOiBQYXJlbnRQb3NpdGlvblRyYWNrZXI7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIGl0ZW0gaXMgYmVpbmcgbW92ZWQuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX21vdmVFdmVudHMgPSBuZXcgU3ViamVjdDx7XG4gICAgc291cmNlOiBEcmFnUmVmO1xuICAgIHBvaW50ZXJQb3NpdGlvbjoge3g6IG51bWJlcjsgeTogbnVtYmVyfTtcbiAgICBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQ7XG4gICAgZGlzdGFuY2U6IFBvaW50O1xuICAgIGRlbHRhOiB7eDogLTEgfCAwIHwgMTsgeTogLTEgfCAwIHwgMX07XG4gIH0+KCk7XG5cbiAgLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBkaXJlY3Rpb24gaW4gd2hpY2ggdGhlIHVzZXIgaXMgZHJhZ2dpbmcgYWxvbmcgZWFjaCBheGlzLiAqL1xuICBwcml2YXRlIF9wb2ludGVyRGlyZWN0aW9uRGVsdGE6IHt4OiAtMSB8IDAgfCAxOyB5OiAtMSB8IDAgfCAxfTtcblxuICAvKiogUG9pbnRlciBwb3NpdGlvbiBhdCB3aGljaCB0aGUgbGFzdCBjaGFuZ2UgaW4gdGhlIGRlbHRhIG9jY3VycmVkLiAqL1xuICBwcml2YXRlIF9wb2ludGVyUG9zaXRpb25BdExhc3REaXJlY3Rpb25DaGFuZ2U6IFBvaW50O1xuXG4gIC8qKiBQb3NpdGlvbiBvZiB0aGUgcG9pbnRlciBhdCB0aGUgbGFzdCBwb2ludGVyIGV2ZW50LiAqL1xuICBwcml2YXRlIF9sYXN0S25vd25Qb2ludGVyUG9zaXRpb246IFBvaW50O1xuXG4gIC8qKlxuICAgKiBSb290IERPTSBub2RlIG9mIHRoZSBkcmFnIGluc3RhbmNlLiBUaGlzIGlzIHRoZSBlbGVtZW50IHRoYXQgd2lsbFxuICAgKiBiZSBtb3ZlZCBhcm91bmQgYXMgdGhlIHVzZXIgaXMgZHJhZ2dpbmcuXG4gICAqL1xuICBwcml2YXRlIF9yb290RWxlbWVudDogSFRNTEVsZW1lbnQ7XG5cbiAgLyoqXG4gICAqIE5lYXJlc3QgYW5jZXN0b3IgU1ZHLCByZWxhdGl2ZSB0byB3aGljaCBjb29yZGluYXRlcyBhcmUgY2FsY3VsYXRlZCBpZiBkcmFnZ2luZyBTVkdFbGVtZW50XG4gICAqL1xuICBwcml2YXRlIF9vd25lclNWR0VsZW1lbnQ6IFNWR1NWR0VsZW1lbnQgfCBudWxsO1xuXG4gIC8qKlxuICAgKiBJbmxpbmUgc3R5bGUgdmFsdWUgb2YgYC13ZWJraXQtdGFwLWhpZ2hsaWdodC1jb2xvcmAgYXQgdGhlIHRpbWUgdGhlXG4gICAqIGRyYWdnaW5nIHdhcyBzdGFydGVkLiBVc2VkIHRvIHJlc3RvcmUgdGhlIHZhbHVlIG9uY2Ugd2UncmUgZG9uZSBkcmFnZ2luZy5cbiAgICovXG4gIHByaXZhdGUgX3Jvb3RFbGVtZW50VGFwSGlnaGxpZ2h0OiBzdHJpbmc7XG5cbiAgLyoqIFN1YnNjcmlwdGlvbiB0byBwb2ludGVyIG1vdmVtZW50IGV2ZW50cy4gKi9cbiAgcHJpdmF0ZSBfcG9pbnRlck1vdmVTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG5cbiAgLyoqIFN1YnNjcmlwdGlvbiB0byB0aGUgZXZlbnQgdGhhdCBpcyBkaXNwYXRjaGVkIHdoZW4gdGhlIHVzZXIgbGlmdHMgdGhlaXIgcG9pbnRlci4gKi9cbiAgcHJpdmF0ZSBfcG9pbnRlclVwU3Vic2NyaXB0aW9uID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuXG4gIC8qKiBTdWJzY3JpcHRpb24gdG8gdGhlIHZpZXdwb3J0IGJlaW5nIHNjcm9sbGVkLiAqL1xuICBwcml2YXRlIF9zY3JvbGxTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG5cbiAgLyoqIFN1YnNjcmlwdGlvbiB0byB0aGUgdmlld3BvcnQgYmVpbmcgcmVzaXplZC4gKi9cbiAgcHJpdmF0ZSBfcmVzaXplU3Vic2NyaXB0aW9uID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuXG4gIC8qKlxuICAgKiBUaW1lIGF0IHdoaWNoIHRoZSBsYXN0IHRvdWNoIGV2ZW50IG9jY3VycmVkLiBVc2VkIHRvIGF2b2lkIGZpcmluZyB0aGUgc2FtZVxuICAgKiBldmVudHMgbXVsdGlwbGUgdGltZXMgb24gdG91Y2ggZGV2aWNlcyB3aGVyZSB0aGUgYnJvd3NlciB3aWxsIGZpcmUgYSBmYWtlXG4gICAqIG1vdXNlIGV2ZW50IGZvciBlYWNoIHRvdWNoIGV2ZW50LCBhZnRlciBhIGNlcnRhaW4gdGltZS5cbiAgICovXG4gIHByaXZhdGUgX2xhc3RUb3VjaEV2ZW50VGltZTogbnVtYmVyO1xuXG4gIC8qKiBUaW1lIGF0IHdoaWNoIHRoZSBsYXN0IGRyYWdnaW5nIHNlcXVlbmNlIHdhcyBzdGFydGVkLiAqL1xuICBwcml2YXRlIF9kcmFnU3RhcnRUaW1lOiBudW1iZXI7XG5cbiAgLyoqIENhY2hlZCByZWZlcmVuY2UgdG8gdGhlIGJvdW5kYXJ5IGVsZW1lbnQuICovXG4gIHByaXZhdGUgX2JvdW5kYXJ5RWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcblxuICAvKiogV2hldGhlciB0aGUgbmF0aXZlIGRyYWdnaW5nIGludGVyYWN0aW9ucyBoYXZlIGJlZW4gZW5hYmxlZCBvbiB0aGUgcm9vdCBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9uYXRpdmVJbnRlcmFjdGlvbnNFbmFibGVkID0gdHJ1ZTtcblxuICAvKiogQ2xpZW50IHJlY3Qgb2YgdGhlIHJvb3QgZWxlbWVudCB3aGVuIHRoZSBkcmFnZ2luZyBzZXF1ZW5jZSBoYXMgc3RhcnRlZC4gKi9cbiAgcHJpdmF0ZSBfaW5pdGlhbENsaWVudFJlY3Q/OiBDbGllbnRSZWN0O1xuXG4gIC8qKiBDYWNoZWQgZGltZW5zaW9ucyBvZiB0aGUgcHJldmlldyBlbGVtZW50LiBTaG91bGQgYmUgcmVhZCB2aWEgYF9nZXRQcmV2aWV3UmVjdGAuICovXG4gIHByaXZhdGUgX3ByZXZpZXdSZWN0PzogQ2xpZW50UmVjdDtcblxuICAvKiogQ2FjaGVkIGRpbWVuc2lvbnMgb2YgdGhlIGJvdW5kYXJ5IGVsZW1lbnQuICovXG4gIHByaXZhdGUgX2JvdW5kYXJ5UmVjdD86IENsaWVudFJlY3Q7XG5cbiAgLyoqIEVsZW1lbnQgdGhhdCB3aWxsIGJlIHVzZWQgYXMgYSB0ZW1wbGF0ZSB0byBjcmVhdGUgdGhlIGRyYWdnYWJsZSBpdGVtJ3MgcHJldmlldy4gKi9cbiAgcHJpdmF0ZSBfcHJldmlld1RlbXBsYXRlPzogRHJhZ1ByZXZpZXdUZW1wbGF0ZSB8IG51bGw7XG5cbiAgLyoqIFRlbXBsYXRlIGZvciBwbGFjZWhvbGRlciBlbGVtZW50IHJlbmRlcmVkIHRvIHNob3cgd2hlcmUgYSBkcmFnZ2FibGUgd291bGQgYmUgZHJvcHBlZC4gKi9cbiAgcHJpdmF0ZSBfcGxhY2Vob2xkZXJUZW1wbGF0ZT86IERyYWdIZWxwZXJUZW1wbGF0ZSB8IG51bGw7XG5cbiAgLyoqIEVsZW1lbnRzIHRoYXQgY2FuIGJlIHVzZWQgdG8gZHJhZyB0aGUgZHJhZ2dhYmxlIGl0ZW0uICovXG4gIHByaXZhdGUgX2hhbmRsZXM6IEhUTUxFbGVtZW50W10gPSBbXTtcblxuICAvKiogUmVnaXN0ZXJlZCBoYW5kbGVzIHRoYXQgYXJlIGN1cnJlbnRseSBkaXNhYmxlZC4gKi9cbiAgcHJpdmF0ZSBfZGlzYWJsZWRIYW5kbGVzID0gbmV3IFNldDxIVE1MRWxlbWVudD4oKTtcblxuICAvKiogRHJvcHBhYmxlIGNvbnRhaW5lciB0aGF0IHRoZSBkcmFnZ2FibGUgaXMgYSBwYXJ0IG9mLiAqL1xuICBwcml2YXRlIF9kcm9wQ29udGFpbmVyPzogRHJvcExpc3RSZWY7XG5cbiAgLyoqIExheW91dCBkaXJlY3Rpb24gb2YgdGhlIGl0ZW0uICovXG4gIHByaXZhdGUgX2RpcmVjdGlvbjogRGlyZWN0aW9uID0gJ2x0cic7XG5cbiAgLyoqIFJlZiB0aGF0IHRoZSBjdXJyZW50IGRyYWcgaXRlbSBpcyBuZXN0ZWQgaW4uICovXG4gIHByaXZhdGUgX3BhcmVudERyYWdSZWY6IERyYWdSZWY8dW5rbm93bj4gfCBudWxsO1xuXG4gIC8qKlxuICAgKiBDYWNoZWQgc2hhZG93IHJvb3QgdGhhdCB0aGUgZWxlbWVudCBpcyBwbGFjZWQgaW4uIGBudWxsYCBtZWFucyB0aGF0IHRoZSBlbGVtZW50IGlzbid0IGluXG4gICAqIHRoZSBzaGFkb3cgRE9NIGFuZCBgdW5kZWZpbmVkYCBtZWFucyB0aGF0IGl0IGhhc24ndCBiZWVuIHJlc29sdmVkIHlldC4gU2hvdWxkIGJlIHJlYWQgdmlhXG4gICAqIGBfZ2V0U2hhZG93Um9vdGAsIG5vdCBkaXJlY3RseS5cbiAgICovXG4gIHByaXZhdGUgX2NhY2hlZFNoYWRvd1Jvb3Q6IFNoYWRvd1Jvb3QgfCBudWxsIHwgdW5kZWZpbmVkO1xuXG4gIC8qKiBBeGlzIGFsb25nIHdoaWNoIGRyYWdnaW5nIGlzIGxvY2tlZC4gKi9cbiAgbG9ja0F4aXM6ICd4JyB8ICd5JztcblxuICAvKipcbiAgICogQW1vdW50IG9mIG1pbGxpc2Vjb25kcyB0byB3YWl0IGFmdGVyIHRoZSB1c2VyIGhhcyBwdXQgdGhlaXJcbiAgICogcG9pbnRlciBkb3duIGJlZm9yZSBzdGFydGluZyB0byBkcmFnIHRoZSBlbGVtZW50LlxuICAgKi9cbiAgZHJhZ1N0YXJ0RGVsYXk6IG51bWJlciB8IHt0b3VjaDogbnVtYmVyOyBtb3VzZTogbnVtYmVyfSA9IDA7XG5cbiAgLyoqIENsYXNzIHRvIGJlIGFkZGVkIHRvIHRoZSBwcmV2aWV3IGVsZW1lbnQuICovXG4gIHByZXZpZXdDbGFzczogc3RyaW5nIHwgc3RyaW5nW10gfCB1bmRlZmluZWQ7XG5cbiAgLyoqIFdoZXRoZXIgc3RhcnRpbmcgdG8gZHJhZyB0aGlzIGVsZW1lbnQgaXMgZGlzYWJsZWQuICovXG4gIGdldCBkaXNhYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fZGlzYWJsZWQgfHwgISEodGhpcy5fZHJvcENvbnRhaW5lciAmJiB0aGlzLl9kcm9wQ29udGFpbmVyLmRpc2FibGVkKTtcbiAgfVxuICBzZXQgZGlzYWJsZWQodmFsdWU6IGJvb2xlYW4pIHtcbiAgICBjb25zdCBuZXdWYWx1ZSA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG5cbiAgICBpZiAobmV3VmFsdWUgIT09IHRoaXMuX2Rpc2FibGVkKSB7XG4gICAgICB0aGlzLl9kaXNhYmxlZCA9IG5ld1ZhbHVlO1xuICAgICAgdGhpcy5fdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucygpO1xuICAgICAgdGhpcy5faGFuZGxlcy5mb3JFYWNoKGhhbmRsZSA9PiB0b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKGhhbmRsZSwgbmV3VmFsdWUpKTtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBfZGlzYWJsZWQgPSBmYWxzZTtcblxuICAvKiogRW1pdHMgYXMgdGhlIGRyYWcgc2VxdWVuY2UgaXMgYmVpbmcgcHJlcGFyZWQuICovXG4gIHJlYWRvbmx5IGJlZm9yZVN0YXJ0ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHN0YXJ0cyBkcmFnZ2luZyB0aGUgaXRlbS4gKi9cbiAgcmVhZG9ubHkgc3RhcnRlZCA9IG5ldyBTdWJqZWN0PHtzb3VyY2U6IERyYWdSZWY7IGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudH0+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgaGFzIHJlbGVhc2VkIGEgZHJhZyBpdGVtLCBiZWZvcmUgYW55IGFuaW1hdGlvbnMgaGF2ZSBzdGFydGVkLiAqL1xuICByZWFkb25seSByZWxlYXNlZCA9IG5ldyBTdWJqZWN0PHtzb3VyY2U6IERyYWdSZWY7IGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudH0+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgc3RvcHMgZHJhZ2dpbmcgYW4gaXRlbSBpbiB0aGUgY29udGFpbmVyLiAqL1xuICByZWFkb25seSBlbmRlZCA9IG5ldyBTdWJqZWN0PHtcbiAgICBzb3VyY2U6IERyYWdSZWY7XG4gICAgZGlzdGFuY2U6IFBvaW50O1xuICAgIGRyb3BQb2ludDogUG9pbnQ7XG4gICAgZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50O1xuICB9PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGhhcyBtb3ZlZCB0aGUgaXRlbSBpbnRvIGEgbmV3IGNvbnRhaW5lci4gKi9cbiAgcmVhZG9ubHkgZW50ZXJlZCA9IG5ldyBTdWJqZWN0PHtjb250YWluZXI6IERyb3BMaXN0UmVmOyBpdGVtOiBEcmFnUmVmOyBjdXJyZW50SW5kZXg6IG51bWJlcn0+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgcmVtb3ZlcyB0aGUgaXRlbSBpdHMgY29udGFpbmVyIGJ5IGRyYWdnaW5nIGl0IGludG8gYW5vdGhlciBjb250YWluZXIuICovXG4gIHJlYWRvbmx5IGV4aXRlZCA9IG5ldyBTdWJqZWN0PHtjb250YWluZXI6IERyb3BMaXN0UmVmOyBpdGVtOiBEcmFnUmVmfT4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBkcm9wcyB0aGUgaXRlbSBpbnNpZGUgYSBjb250YWluZXIuICovXG4gIHJlYWRvbmx5IGRyb3BwZWQgPSBuZXcgU3ViamVjdDx7XG4gICAgcHJldmlvdXNJbmRleDogbnVtYmVyO1xuICAgIGN1cnJlbnRJbmRleDogbnVtYmVyO1xuICAgIGl0ZW06IERyYWdSZWY7XG4gICAgY29udGFpbmVyOiBEcm9wTGlzdFJlZjtcbiAgICBwcmV2aW91c0NvbnRhaW5lcjogRHJvcExpc3RSZWY7XG4gICAgZGlzdGFuY2U6IFBvaW50O1xuICAgIGRyb3BQb2ludDogUG9pbnQ7XG4gICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcjogYm9vbGVhbjtcbiAgICBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQ7XG4gIH0+KCk7XG5cbiAgLyoqXG4gICAqIEVtaXRzIGFzIHRoZSB1c2VyIGlzIGRyYWdnaW5nIHRoZSBpdGVtLiBVc2Ugd2l0aCBjYXV0aW9uLFxuICAgKiBiZWNhdXNlIHRoaXMgZXZlbnQgd2lsbCBmaXJlIGZvciBldmVyeSBwaXhlbCB0aGF0IHRoZSB1c2VyIGhhcyBkcmFnZ2VkLlxuICAgKi9cbiAgcmVhZG9ubHkgbW92ZWQ6IE9ic2VydmFibGU8e1xuICAgIHNvdXJjZTogRHJhZ1JlZjtcbiAgICBwb2ludGVyUG9zaXRpb246IHt4OiBudW1iZXI7IHk6IG51bWJlcn07XG4gICAgZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50O1xuICAgIGRpc3RhbmNlOiBQb2ludDtcbiAgICBkZWx0YToge3g6IC0xIHwgMCB8IDE7IHk6IC0xIHwgMCB8IDF9O1xuICB9PiA9IHRoaXMuX21vdmVFdmVudHM7XG5cbiAgLyoqIEFyYml0cmFyeSBkYXRhIHRoYXQgY2FuIGJlIGF0dGFjaGVkIHRvIHRoZSBkcmFnIGl0ZW0uICovXG4gIGRhdGE6IFQ7XG5cbiAgLyoqXG4gICAqIEZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gY3VzdG9taXplIHRoZSBsb2dpYyBvZiBob3cgdGhlIHBvc2l0aW9uIG9mIHRoZSBkcmFnIGl0ZW1cbiAgICogaXMgbGltaXRlZCB3aGlsZSBpdCdzIGJlaW5nIGRyYWdnZWQuIEdldHMgY2FsbGVkIHdpdGggYSBwb2ludCBjb250YWluaW5nIHRoZSBjdXJyZW50IHBvc2l0aW9uXG4gICAqIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBvbiB0aGUgcGFnZSwgYSByZWZlcmVuY2UgdG8gdGhlIGl0ZW0gYmVpbmcgZHJhZ2dlZCBhbmQgaXRzIGRpbWVuc3Rpb25zLlxuICAgKiBTaG91bGQgcmV0dXJuIGEgcG9pbnQgZGVzY3JpYmluZyB3aGVyZSB0aGUgaXRlbSBzaG91bGQgYmUgcmVuZGVyZWQuXG4gICAqL1xuICBjb25zdHJhaW5Qb3NpdGlvbj86IChcbiAgICB1c2VyUG9pbnRlclBvc2l0aW9uOiBQb2ludCxcbiAgICBkcmFnUmVmOiBEcmFnUmVmLFxuICAgIGRpbWVuc2lvbnM6IENsaWVudFJlY3QsXG4gICkgPT4gUG9pbnQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBIVE1MRWxlbWVudCxcbiAgICBwcml2YXRlIF9jb25maWc6IERyYWdSZWZDb25maWcsXG4gICAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50LFxuICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgIHByaXZhdGUgX3ZpZXdwb3J0UnVsZXI6IFZpZXdwb3J0UnVsZXIsXG4gICAgcHJpdmF0ZSBfZHJhZ0Ryb3BSZWdpc3RyeTogRHJhZ0Ryb3BSZWdpc3RyeTxEcmFnUmVmLCBEcm9wTGlzdFJlZj4sXG4gICkge1xuICAgIHRoaXMud2l0aFJvb3RFbGVtZW50KGVsZW1lbnQpLndpdGhQYXJlbnQoX2NvbmZpZy5wYXJlbnREcmFnUmVmIHx8IG51bGwpO1xuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucyA9IG5ldyBQYXJlbnRQb3NpdGlvblRyYWNrZXIoX2RvY3VtZW50KTtcbiAgICBfZHJhZ0Ryb3BSZWdpc3RyeS5yZWdpc3RlckRyYWdJdGVtKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGVsZW1lbnQgdGhhdCBpcyBiZWluZyB1c2VkIGFzIGEgcGxhY2Vob2xkZXJcbiAgICogd2hpbGUgdGhlIGN1cnJlbnQgZWxlbWVudCBpcyBiZWluZyBkcmFnZ2VkLlxuICAgKi9cbiAgZ2V0UGxhY2Vob2xkZXJFbGVtZW50KCk6IEhUTUxFbGVtZW50IHtcbiAgICByZXR1cm4gdGhpcy5fcGxhY2Vob2xkZXI7XG4gIH1cblxuICAvKiogUmV0dXJucyB0aGUgcm9vdCBkcmFnZ2FibGUgZWxlbWVudC4gKi9cbiAgZ2V0Um9vdEVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLl9yb290RWxlbWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50bHktdmlzaWJsZSBlbGVtZW50IHRoYXQgcmVwcmVzZW50cyB0aGUgZHJhZyBpdGVtLlxuICAgKiBXaGlsZSBkcmFnZ2luZyB0aGlzIGlzIHRoZSBwbGFjZWhvbGRlciwgb3RoZXJ3aXNlIGl0J3MgdGhlIHJvb3QgZWxlbWVudC5cbiAgICovXG4gIGdldFZpc2libGVFbGVtZW50KCk6IEhUTUxFbGVtZW50IHtcbiAgICByZXR1cm4gdGhpcy5pc0RyYWdnaW5nKCkgPyB0aGlzLmdldFBsYWNlaG9sZGVyRWxlbWVudCgpIDogdGhpcy5nZXRSb290RWxlbWVudCgpO1xuICB9XG5cbiAgLyoqIFJlZ2lzdGVycyB0aGUgaGFuZGxlcyB0aGF0IGNhbiBiZSB1c2VkIHRvIGRyYWcgdGhlIGVsZW1lbnQuICovXG4gIHdpdGhIYW5kbGVzKGhhbmRsZXM6IChIVE1MRWxlbWVudCB8IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+KVtdKTogdGhpcyB7XG4gICAgdGhpcy5faGFuZGxlcyA9IGhhbmRsZXMubWFwKGhhbmRsZSA9PiBjb2VyY2VFbGVtZW50KGhhbmRsZSkpO1xuICAgIHRoaXMuX2hhbmRsZXMuZm9yRWFjaChoYW5kbGUgPT4gdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucyhoYW5kbGUsIHRoaXMuZGlzYWJsZWQpKTtcbiAgICB0aGlzLl90b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKCk7XG5cbiAgICAvLyBEZWxldGUgYW55IGxpbmdlcmluZyBkaXNhYmxlZCBoYW5kbGVzIHRoYXQgbWF5IGhhdmUgYmVlbiBkZXN0cm95ZWQuIE5vdGUgdGhhdCB3ZSByZS1jcmVhdGVcbiAgICAvLyB0aGUgc2V0LCByYXRoZXIgdGhhbiBpdGVyYXRlIG92ZXIgaXQgYW5kIGZpbHRlciBvdXQgdGhlIGRlc3Ryb3llZCBoYW5kbGVzLCBiZWNhdXNlIHdoaWxlXG4gICAgLy8gdGhlIEVTIHNwZWMgYWxsb3dzIGZvciBzZXRzIHRvIGJlIG1vZGlmaWVkIHdoaWxlIHRoZXkncmUgYmVpbmcgaXRlcmF0ZWQgb3Zlciwgc29tZSBwb2x5ZmlsbHNcbiAgICAvLyB1c2UgYW4gYXJyYXkgaW50ZXJuYWxseSB3aGljaCBtYXkgdGhyb3cgYW4gZXJyb3IuXG4gICAgY29uc3QgZGlzYWJsZWRIYW5kbGVzID0gbmV3IFNldDxIVE1MRWxlbWVudD4oKTtcbiAgICB0aGlzLl9kaXNhYmxlZEhhbmRsZXMuZm9yRWFjaChoYW5kbGUgPT4ge1xuICAgICAgaWYgKHRoaXMuX2hhbmRsZXMuaW5kZXhPZihoYW5kbGUpID4gLTEpIHtcbiAgICAgICAgZGlzYWJsZWRIYW5kbGVzLmFkZChoYW5kbGUpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuX2Rpc2FibGVkSGFuZGxlcyA9IGRpc2FibGVkSGFuZGxlcztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgdGhlIHRlbXBsYXRlIHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIHRoZSBkcmFnIHByZXZpZXcuXG4gICAqIEBwYXJhbSB0ZW1wbGF0ZSBUZW1wbGF0ZSB0aGF0IGZyb20gd2hpY2ggdG8gc3RhbXAgb3V0IHRoZSBwcmV2aWV3LlxuICAgKi9cbiAgd2l0aFByZXZpZXdUZW1wbGF0ZSh0ZW1wbGF0ZTogRHJhZ1ByZXZpZXdUZW1wbGF0ZSB8IG51bGwpOiB0aGlzIHtcbiAgICB0aGlzLl9wcmV2aWV3VGVtcGxhdGUgPSB0ZW1wbGF0ZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgdGhlIHRlbXBsYXRlIHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIHRoZSBkcmFnIHBsYWNlaG9sZGVyLlxuICAgKiBAcGFyYW0gdGVtcGxhdGUgVGVtcGxhdGUgdGhhdCBmcm9tIHdoaWNoIHRvIHN0YW1wIG91dCB0aGUgcGxhY2Vob2xkZXIuXG4gICAqL1xuICB3aXRoUGxhY2Vob2xkZXJUZW1wbGF0ZSh0ZW1wbGF0ZTogRHJhZ0hlbHBlclRlbXBsYXRlIHwgbnVsbCk6IHRoaXMge1xuICAgIHRoaXMuX3BsYWNlaG9sZGVyVGVtcGxhdGUgPSB0ZW1wbGF0ZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGFuIGFsdGVybmF0ZSBkcmFnIHJvb3QgZWxlbWVudC4gVGhlIHJvb3QgZWxlbWVudCBpcyB0aGUgZWxlbWVudCB0aGF0IHdpbGwgYmUgbW92ZWQgYXNcbiAgICogdGhlIHVzZXIgaXMgZHJhZ2dpbmcuIFBhc3NpbmcgYW4gYWx0ZXJuYXRlIHJvb3QgZWxlbWVudCBpcyB1c2VmdWwgd2hlbiB0cnlpbmcgdG8gZW5hYmxlXG4gICAqIGRyYWdnaW5nIG9uIGFuIGVsZW1lbnQgdGhhdCB5b3UgbWlnaHQgbm90IGhhdmUgYWNjZXNzIHRvLlxuICAgKi9cbiAgd2l0aFJvb3RFbGVtZW50KHJvb3RFbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiB8IEhUTUxFbGVtZW50KTogdGhpcyB7XG4gICAgY29uc3QgZWxlbWVudCA9IGNvZXJjZUVsZW1lbnQocm9vdEVsZW1lbnQpO1xuXG4gICAgaWYgKGVsZW1lbnQgIT09IHRoaXMuX3Jvb3RFbGVtZW50KSB7XG4gICAgICBpZiAodGhpcy5fcm9vdEVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5fcmVtb3ZlUm9vdEVsZW1lbnRMaXN0ZW5lcnModGhpcy5fcm9vdEVsZW1lbnQpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX3BvaW50ZXJEb3duLCBhY3RpdmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuX3BvaW50ZXJEb3duLCBwYXNzaXZlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdzdGFydCcsIHRoaXMuX25hdGl2ZURyYWdTdGFydCwgYWN0aXZlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgfSk7XG4gICAgICB0aGlzLl9pbml0aWFsVHJhbnNmb3JtID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fcm9vdEVsZW1lbnQgPSBlbGVtZW50O1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgU1ZHRWxlbWVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5fcm9vdEVsZW1lbnQgaW5zdGFuY2VvZiBTVkdFbGVtZW50KSB7XG4gICAgICB0aGlzLl9vd25lclNWR0VsZW1lbnQgPSB0aGlzLl9yb290RWxlbWVudC5vd25lclNWR0VsZW1lbnQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogRWxlbWVudCB0byB3aGljaCB0aGUgZHJhZ2dhYmxlJ3MgcG9zaXRpb24gd2lsbCBiZSBjb25zdHJhaW5lZC5cbiAgICovXG4gIHdpdGhCb3VuZGFyeUVsZW1lbnQoYm91bmRhcnlFbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiB8IEhUTUxFbGVtZW50IHwgbnVsbCk6IHRoaXMge1xuICAgIHRoaXMuX2JvdW5kYXJ5RWxlbWVudCA9IGJvdW5kYXJ5RWxlbWVudCA/IGNvZXJjZUVsZW1lbnQoYm91bmRhcnlFbGVtZW50KSA6IG51bGw7XG4gICAgdGhpcy5fcmVzaXplU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgaWYgKGJvdW5kYXJ5RWxlbWVudCkge1xuICAgICAgdGhpcy5fcmVzaXplU3Vic2NyaXB0aW9uID0gdGhpcy5fdmlld3BvcnRSdWxlclxuICAgICAgICAuY2hhbmdlKDEwKVxuICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMuX2NvbnRhaW5JbnNpZGVCb3VuZGFyeU9uUmVzaXplKCkpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBwYXJlbnQgcmVmIHRoYXQgdGhlIHJlZiBpcyBuZXN0ZWQgaW4uICAqL1xuICB3aXRoUGFyZW50KHBhcmVudDogRHJhZ1JlZjx1bmtub3duPiB8IG51bGwpOiB0aGlzIHtcbiAgICB0aGlzLl9wYXJlbnREcmFnUmVmID0gcGFyZW50O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFJlbW92ZXMgdGhlIGRyYWdnaW5nIGZ1bmN0aW9uYWxpdHkgZnJvbSB0aGUgRE9NIGVsZW1lbnQuICovXG4gIGRpc3Bvc2UoKSB7XG4gICAgdGhpcy5fcmVtb3ZlUm9vdEVsZW1lbnRMaXN0ZW5lcnModGhpcy5fcm9vdEVsZW1lbnQpO1xuXG4gICAgLy8gRG8gdGhpcyBjaGVjayBiZWZvcmUgcmVtb3ZpbmcgZnJvbSB0aGUgcmVnaXN0cnkgc2luY2UgaXQnbGxcbiAgICAvLyBzdG9wIGJlaW5nIGNvbnNpZGVyZWQgYXMgZHJhZ2dlZCBvbmNlIGl0IGlzIHJlbW92ZWQuXG4gICAgaWYgKHRoaXMuaXNEcmFnZ2luZygpKSB7XG4gICAgICAvLyBTaW5jZSB3ZSBtb3ZlIG91dCB0aGUgZWxlbWVudCB0byB0aGUgZW5kIG9mIHRoZSBib2R5IHdoaWxlIGl0J3MgYmVpbmdcbiAgICAgIC8vIGRyYWdnZWQsIHdlIGhhdmUgdG8gbWFrZSBzdXJlIHRoYXQgaXQncyByZW1vdmVkIGlmIGl0IGdldHMgZGVzdHJveWVkLlxuICAgICAgdGhpcy5fcm9vdEVsZW1lbnQ/LnJlbW92ZSgpO1xuICAgIH1cblxuICAgIHRoaXMuX2FuY2hvcj8ucmVtb3ZlKCk7XG4gICAgdGhpcy5fZGVzdHJveVByZXZpZXcoKTtcbiAgICB0aGlzLl9kZXN0cm95UGxhY2Vob2xkZXIoKTtcbiAgICB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnJlbW92ZURyYWdJdGVtKHRoaXMpO1xuICAgIHRoaXMuX3JlbW92ZVN1YnNjcmlwdGlvbnMoKTtcbiAgICB0aGlzLmJlZm9yZVN0YXJ0ZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLnN0YXJ0ZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLnJlbGVhc2VkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5lbmRlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuZW50ZXJlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuZXhpdGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5kcm9wcGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fbW92ZUV2ZW50cy5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX2hhbmRsZXMgPSBbXTtcbiAgICB0aGlzLl9kaXNhYmxlZEhhbmRsZXMuY2xlYXIoKTtcbiAgICB0aGlzLl9kcm9wQ29udGFpbmVyID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3Jlc2l6ZVN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5jbGVhcigpO1xuICAgIHRoaXMuX2JvdW5kYXJ5RWxlbWVudCA9XG4gICAgICB0aGlzLl9yb290RWxlbWVudCA9XG4gICAgICB0aGlzLl9vd25lclNWR0VsZW1lbnQgPVxuICAgICAgdGhpcy5fcGxhY2Vob2xkZXJUZW1wbGF0ZSA9XG4gICAgICB0aGlzLl9wcmV2aWV3VGVtcGxhdGUgPVxuICAgICAgdGhpcy5fYW5jaG9yID1cbiAgICAgIHRoaXMuX3BhcmVudERyYWdSZWYgPVxuICAgICAgICBudWxsITtcbiAgfVxuXG4gIC8qKiBDaGVja3Mgd2hldGhlciB0aGUgZWxlbWVudCBpcyBjdXJyZW50bHkgYmVpbmcgZHJhZ2dlZC4gKi9cbiAgaXNEcmFnZ2luZygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5faGFzU3RhcnRlZERyYWdnaW5nICYmIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuaXNEcmFnZ2luZyh0aGlzKTtcbiAgfVxuXG4gIC8qKiBSZXNldHMgYSBzdGFuZGFsb25lIGRyYWcgaXRlbSB0byBpdHMgaW5pdGlhbCBwb3NpdGlvbi4gKi9cbiAgcmVzZXQoKTogdm9pZCB7XG4gICAgdGhpcy5fcm9vdEVsZW1lbnQuc3R5bGUudHJhbnNmb3JtID0gdGhpcy5faW5pdGlhbFRyYW5zZm9ybSB8fCAnJztcbiAgICB0aGlzLl9hY3RpdmVUcmFuc2Zvcm0gPSB7eDogMCwgeTogMH07XG4gICAgdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybSA9IHt4OiAwLCB5OiAwfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGEgaGFuZGxlIGFzIGRpc2FibGVkLiBXaGlsZSBhIGhhbmRsZSBpcyBkaXNhYmxlZCwgaXQnbGwgY2FwdHVyZSBhbmQgaW50ZXJydXB0IGRyYWdnaW5nLlxuICAgKiBAcGFyYW0gaGFuZGxlIEhhbmRsZSBlbGVtZW50IHRoYXQgc2hvdWxkIGJlIGRpc2FibGVkLlxuICAgKi9cbiAgZGlzYWJsZUhhbmRsZShoYW5kbGU6IEhUTUxFbGVtZW50KSB7XG4gICAgaWYgKCF0aGlzLl9kaXNhYmxlZEhhbmRsZXMuaGFzKGhhbmRsZSkgJiYgdGhpcy5faGFuZGxlcy5pbmRleE9mKGhhbmRsZSkgPiAtMSkge1xuICAgICAgdGhpcy5fZGlzYWJsZWRIYW5kbGVzLmFkZChoYW5kbGUpO1xuICAgICAgdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucyhoYW5kbGUsIHRydWUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGVzIGEgaGFuZGxlLCBpZiBpdCBoYXMgYmVlbiBkaXNhYmxlZC5cbiAgICogQHBhcmFtIGhhbmRsZSBIYW5kbGUgZWxlbWVudCB0byBiZSBlbmFibGVkLlxuICAgKi9cbiAgZW5hYmxlSGFuZGxlKGhhbmRsZTogSFRNTEVsZW1lbnQpIHtcbiAgICBpZiAodGhpcy5fZGlzYWJsZWRIYW5kbGVzLmhhcyhoYW5kbGUpKSB7XG4gICAgICB0aGlzLl9kaXNhYmxlZEhhbmRsZXMuZGVsZXRlKGhhbmRsZSk7XG4gICAgICB0b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKGhhbmRsZSwgdGhpcy5kaXNhYmxlZCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFNldHMgdGhlIGxheW91dCBkaXJlY3Rpb24gb2YgdGhlIGRyYWdnYWJsZSBpdGVtLiAqL1xuICB3aXRoRGlyZWN0aW9uKGRpcmVjdGlvbjogRGlyZWN0aW9uKTogdGhpcyB7XG4gICAgdGhpcy5fZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFNldHMgdGhlIGNvbnRhaW5lciB0aGF0IHRoZSBpdGVtIGlzIHBhcnQgb2YuICovXG4gIF93aXRoRHJvcENvbnRhaW5lcihjb250YWluZXI6IERyb3BMaXN0UmVmKSB7XG4gICAgdGhpcy5fZHJvcENvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IHBvc2l0aW9uIGluIHBpeGVscyB0aGUgZHJhZ2dhYmxlIG91dHNpZGUgb2YgYSBkcm9wIGNvbnRhaW5lci5cbiAgICovXG4gIGdldEZyZWVEcmFnUG9zaXRpb24oKTogUmVhZG9ubHk8UG9pbnQ+IHtcbiAgICBjb25zdCBwb3NpdGlvbiA9IHRoaXMuaXNEcmFnZ2luZygpID8gdGhpcy5fYWN0aXZlVHJhbnNmb3JtIDogdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybTtcbiAgICByZXR1cm4ge3g6IHBvc2l0aW9uLngsIHk6IHBvc2l0aW9uLnl9O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGN1cnJlbnQgcG9zaXRpb24gaW4gcGl4ZWxzIHRoZSBkcmFnZ2FibGUgb3V0c2lkZSBvZiBhIGRyb3AgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gdmFsdWUgTmV3IHBvc2l0aW9uIHRvIGJlIHNldC5cbiAgICovXG4gIHNldEZyZWVEcmFnUG9zaXRpb24odmFsdWU6IFBvaW50KTogdGhpcyB7XG4gICAgdGhpcy5fYWN0aXZlVHJhbnNmb3JtID0ge3g6IDAsIHk6IDB9O1xuICAgIHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm0ueCA9IHZhbHVlLng7XG4gICAgdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybS55ID0gdmFsdWUueTtcblxuICAgIGlmICghdGhpcy5fZHJvcENvbnRhaW5lcikge1xuICAgICAgdGhpcy5fYXBwbHlSb290RWxlbWVudFRyYW5zZm9ybSh2YWx1ZS54LCB2YWx1ZS55KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjb250YWluZXIgaW50byB3aGljaCB0byBpbnNlcnQgdGhlIHByZXZpZXcgZWxlbWVudC5cbiAgICogQHBhcmFtIHZhbHVlIENvbnRhaW5lciBpbnRvIHdoaWNoIHRvIGluc2VydCB0aGUgcHJldmlldy5cbiAgICovXG4gIHdpdGhQcmV2aWV3Q29udGFpbmVyKHZhbHVlOiBQcmV2aWV3Q29udGFpbmVyKTogdGhpcyB7XG4gICAgdGhpcy5fcHJldmlld0NvbnRhaW5lciA9IHZhbHVlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFVwZGF0ZXMgdGhlIGl0ZW0ncyBzb3J0IG9yZGVyIGJhc2VkIG9uIHRoZSBsYXN0LWtub3duIHBvaW50ZXIgcG9zaXRpb24uICovXG4gIF9zb3J0RnJvbUxhc3RQb2ludGVyUG9zaXRpb24oKSB7XG4gICAgY29uc3QgcG9zaXRpb24gPSB0aGlzLl9sYXN0S25vd25Qb2ludGVyUG9zaXRpb247XG5cbiAgICBpZiAocG9zaXRpb24gJiYgdGhpcy5fZHJvcENvbnRhaW5lcikge1xuICAgICAgdGhpcy5fdXBkYXRlQWN0aXZlRHJvcENvbnRhaW5lcih0aGlzLl9nZXRDb25zdHJhaW5lZFBvaW50ZXJQb3NpdGlvbihwb3NpdGlvbiksIHBvc2l0aW9uKTtcbiAgICB9XG4gIH1cblxuICAvKiogVW5zdWJzY3JpYmVzIGZyb20gdGhlIGdsb2JhbCBzdWJzY3JpcHRpb25zLiAqL1xuICBwcml2YXRlIF9yZW1vdmVTdWJzY3JpcHRpb25zKCkge1xuICAgIHRoaXMuX3BvaW50ZXJNb3ZlU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fcG9pbnRlclVwU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fc2Nyb2xsU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gIH1cblxuICAvKiogRGVzdHJveXMgdGhlIHByZXZpZXcgZWxlbWVudCBhbmQgaXRzIFZpZXdSZWYuICovXG4gIHByaXZhdGUgX2Rlc3Ryb3lQcmV2aWV3KCkge1xuICAgIHRoaXMuX3ByZXZpZXc/LnJlbW92ZSgpO1xuICAgIHRoaXMuX3ByZXZpZXdSZWY/LmRlc3Ryb3koKTtcbiAgICB0aGlzLl9wcmV2aWV3ID0gdGhpcy5fcHJldmlld1JlZiA9IG51bGwhO1xuICB9XG5cbiAgLyoqIERlc3Ryb3lzIHRoZSBwbGFjZWhvbGRlciBlbGVtZW50IGFuZCBpdHMgVmlld1JlZi4gKi9cbiAgcHJpdmF0ZSBfZGVzdHJveVBsYWNlaG9sZGVyKCkge1xuICAgIHRoaXMuX3BsYWNlaG9sZGVyPy5yZW1vdmUoKTtcbiAgICB0aGlzLl9wbGFjZWhvbGRlclJlZj8uZGVzdHJveSgpO1xuICAgIHRoaXMuX3BsYWNlaG9sZGVyID0gdGhpcy5fcGxhY2Vob2xkZXJSZWYgPSBudWxsITtcbiAgfVxuXG4gIC8qKiBIYW5kbGVyIGZvciB0aGUgYG1vdXNlZG93bmAvYHRvdWNoc3RhcnRgIGV2ZW50cy4gKi9cbiAgcHJpdmF0ZSBfcG9pbnRlckRvd24gPSAoZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KSA9PiB7XG4gICAgdGhpcy5iZWZvcmVTdGFydGVkLm5leHQoKTtcblxuICAgIC8vIERlbGVnYXRlIHRoZSBldmVudCBiYXNlZCBvbiB3aGV0aGVyIGl0IHN0YXJ0ZWQgZnJvbSBhIGhhbmRsZSBvciB0aGUgZWxlbWVudCBpdHNlbGYuXG4gICAgaWYgKHRoaXMuX2hhbmRsZXMubGVuZ3RoKSB7XG4gICAgICBjb25zdCB0YXJnZXRIYW5kbGUgPSB0aGlzLl9nZXRUYXJnZXRIYW5kbGUoZXZlbnQpO1xuXG4gICAgICBpZiAodGFyZ2V0SGFuZGxlICYmICF0aGlzLl9kaXNhYmxlZEhhbmRsZXMuaGFzKHRhcmdldEhhbmRsZSkgJiYgIXRoaXMuZGlzYWJsZWQpIHtcbiAgICAgICAgdGhpcy5faW5pdGlhbGl6ZURyYWdTZXF1ZW5jZSh0YXJnZXRIYW5kbGUsIGV2ZW50KTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCF0aGlzLmRpc2FibGVkKSB7XG4gICAgICB0aGlzLl9pbml0aWFsaXplRHJhZ1NlcXVlbmNlKHRoaXMuX3Jvb3RFbGVtZW50LCBldmVudCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKiBIYW5kbGVyIHRoYXQgaXMgaW52b2tlZCB3aGVuIHRoZSB1c2VyIG1vdmVzIHRoZWlyIHBvaW50ZXIgYWZ0ZXIgdGhleSd2ZSBpbml0aWF0ZWQgYSBkcmFnLiAqL1xuICBwcml2YXRlIF9wb2ludGVyTW92ZSA9IChldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpID0+IHtcbiAgICBjb25zdCBwb2ludGVyUG9zaXRpb24gPSB0aGlzLl9nZXRQb2ludGVyUG9zaXRpb25PblBhZ2UoZXZlbnQpO1xuXG4gICAgaWYgKCF0aGlzLl9oYXNTdGFydGVkRHJhZ2dpbmcpIHtcbiAgICAgIGNvbnN0IGRpc3RhbmNlWCA9IE1hdGguYWJzKHBvaW50ZXJQb3NpdGlvbi54IC0gdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UueCk7XG4gICAgICBjb25zdCBkaXN0YW5jZVkgPSBNYXRoLmFicyhwb2ludGVyUG9zaXRpb24ueSAtIHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLnkpO1xuICAgICAgY29uc3QgaXNPdmVyVGhyZXNob2xkID0gZGlzdGFuY2VYICsgZGlzdGFuY2VZID49IHRoaXMuX2NvbmZpZy5kcmFnU3RhcnRUaHJlc2hvbGQ7XG5cbiAgICAgIC8vIE9ubHkgc3RhcnQgZHJhZ2dpbmcgYWZ0ZXIgdGhlIHVzZXIgaGFzIG1vdmVkIG1vcmUgdGhhbiB0aGUgbWluaW11bSBkaXN0YW5jZSBpbiBlaXRoZXJcbiAgICAgIC8vIGRpcmVjdGlvbi4gTm90ZSB0aGF0IHRoaXMgaXMgcHJlZmVycmFibGUgb3ZlciBkb2luZyBzb21ldGhpbmcgbGlrZSBgc2tpcChtaW5pbXVtRGlzdGFuY2UpYFxuICAgICAgLy8gaW4gdGhlIGBwb2ludGVyTW92ZWAgc3Vic2NyaXB0aW9uLCBiZWNhdXNlIHdlJ3JlIG5vdCBndWFyYW50ZWVkIHRvIGhhdmUgb25lIG1vdmUgZXZlbnRcbiAgICAgIC8vIHBlciBwaXhlbCBvZiBtb3ZlbWVudCAoZS5nLiBpZiB0aGUgdXNlciBtb3ZlcyB0aGVpciBwb2ludGVyIHF1aWNrbHkpLlxuICAgICAgaWYgKGlzT3ZlclRocmVzaG9sZCkge1xuICAgICAgICBjb25zdCBpc0RlbGF5RWxhcHNlZCA9IERhdGUubm93KCkgPj0gdGhpcy5fZHJhZ1N0YXJ0VGltZSArIHRoaXMuX2dldERyYWdTdGFydERlbGF5KGV2ZW50KTtcbiAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5fZHJvcENvbnRhaW5lcjtcblxuICAgICAgICBpZiAoIWlzRGVsYXlFbGFwc2VkKSB7XG4gICAgICAgICAgdGhpcy5fZW5kRHJhZ1NlcXVlbmNlKGV2ZW50KTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcmV2ZW50IG90aGVyIGRyYWcgc2VxdWVuY2VzIGZyb20gc3RhcnRpbmcgd2hpbGUgc29tZXRoaW5nIGluIHRoZSBjb250YWluZXIgaXMgc3RpbGxcbiAgICAgICAgLy8gYmVpbmcgZHJhZ2dlZC4gVGhpcyBjYW4gaGFwcGVuIHdoaWxlIHdlJ3JlIHdhaXRpbmcgZm9yIHRoZSBkcm9wIGFuaW1hdGlvbiB0byBmaW5pc2hcbiAgICAgICAgLy8gYW5kIGNhbiBjYXVzZSBlcnJvcnMsIGJlY2F1c2Ugc29tZSBlbGVtZW50cyBtaWdodCBzdGlsbCBiZSBtb3ZpbmcgYXJvdW5kLlxuICAgICAgICBpZiAoIWNvbnRhaW5lciB8fCAoIWNvbnRhaW5lci5pc0RyYWdnaW5nKCkgJiYgIWNvbnRhaW5lci5pc1JlY2VpdmluZygpKSkge1xuICAgICAgICAgIC8vIFByZXZlbnQgdGhlIGRlZmF1bHQgYWN0aW9uIGFzIHNvb24gYXMgdGhlIGRyYWdnaW5nIHNlcXVlbmNlIGlzIGNvbnNpZGVyZWQgYXNcbiAgICAgICAgICAvLyBcInN0YXJ0ZWRcIiBzaW5jZSB3YWl0aW5nIGZvciB0aGUgbmV4dCBldmVudCBjYW4gYWxsb3cgdGhlIGRldmljZSB0byBiZWdpbiBzY3JvbGxpbmcuXG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB0aGlzLl9oYXNTdGFydGVkRHJhZ2dpbmcgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4gdGhpcy5fc3RhcnREcmFnU2VxdWVuY2UoZXZlbnQpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gV2UgcHJldmVudCB0aGUgZGVmYXVsdCBhY3Rpb24gZG93biBoZXJlIHNvIHRoYXQgd2Uga25vdyB0aGF0IGRyYWdnaW5nIGhhcyBzdGFydGVkLiBUaGlzIGlzXG4gICAgLy8gaW1wb3J0YW50IGZvciB0b3VjaCBkZXZpY2VzIHdoZXJlIGRvaW5nIHRoaXMgdG9vIGVhcmx5IGNhbiB1bm5lY2Vzc2FyaWx5IGJsb2NrIHNjcm9sbGluZyxcbiAgICAvLyBpZiB0aGVyZSdzIGEgZHJhZ2dpbmcgZGVsYXkuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIGNvbnN0IGNvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uID0gdGhpcy5fZ2V0Q29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24ocG9pbnRlclBvc2l0aW9uKTtcbiAgICB0aGlzLl9oYXNNb3ZlZCA9IHRydWU7XG4gICAgdGhpcy5fbGFzdEtub3duUG9pbnRlclBvc2l0aW9uID0gcG9pbnRlclBvc2l0aW9uO1xuICAgIHRoaXMuX3VwZGF0ZVBvaW50ZXJEaXJlY3Rpb25EZWx0YShjb25zdHJhaW5lZFBvaW50ZXJQb3NpdGlvbik7XG5cbiAgICBpZiAodGhpcy5fZHJvcENvbnRhaW5lcikge1xuICAgICAgdGhpcy5fdXBkYXRlQWN0aXZlRHJvcENvbnRhaW5lcihjb25zdHJhaW5lZFBvaW50ZXJQb3NpdGlvbiwgcG9pbnRlclBvc2l0aW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgdGhlcmUncyBhIHBvc2l0aW9uIGNvbnN0cmFpbnQgZnVuY3Rpb24sIHdlIHdhbnQgdGhlIGVsZW1lbnQncyB0b3AvbGVmdCB0byBiZSBhdCB0aGVcbiAgICAgIC8vIHNwZWNpZmljIHBvc2l0aW9uIG9uIHRoZSBwYWdlLiBVc2UgdGhlIGluaXRpYWwgcG9zaXRpb24gYXMgYSByZWZlcmVuY2UgaWYgdGhhdCdzIHRoZSBjYXNlLlxuICAgICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy5jb25zdHJhaW5Qb3NpdGlvbiA/IHRoaXMuX2luaXRpYWxDbGllbnRSZWN0ISA6IHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlO1xuICAgICAgY29uc3QgYWN0aXZlVHJhbnNmb3JtID0gdGhpcy5fYWN0aXZlVHJhbnNmb3JtO1xuICAgICAgYWN0aXZlVHJhbnNmb3JtLnggPSBjb25zdHJhaW5lZFBvaW50ZXJQb3NpdGlvbi54IC0gb2Zmc2V0LnggKyB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtLng7XG4gICAgICBhY3RpdmVUcmFuc2Zvcm0ueSA9IGNvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uLnkgLSBvZmZzZXQueSArIHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm0ueTtcbiAgICAgIHRoaXMuX2FwcGx5Um9vdEVsZW1lbnRUcmFuc2Zvcm0oYWN0aXZlVHJhbnNmb3JtLngsIGFjdGl2ZVRyYW5zZm9ybS55KTtcbiAgICB9XG5cbiAgICAvLyBTaW5jZSB0aGlzIGV2ZW50IGdldHMgZmlyZWQgZm9yIGV2ZXJ5IHBpeGVsIHdoaWxlIGRyYWdnaW5nLCB3ZSBvbmx5XG4gICAgLy8gd2FudCB0byBmaXJlIGl0IGlmIHRoZSBjb25zdW1lciBvcHRlZCBpbnRvIGl0LiBBbHNvIHdlIGhhdmUgdG9cbiAgICAvLyByZS1lbnRlciB0aGUgem9uZSBiZWNhdXNlIHdlIHJ1biBhbGwgb2YgdGhlIGV2ZW50cyBvbiB0aGUgb3V0c2lkZS5cbiAgICBpZiAodGhpcy5fbW92ZUV2ZW50cy5vYnNlcnZlcnMubGVuZ3RoKSB7XG4gICAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5fbW92ZUV2ZW50cy5uZXh0KHtcbiAgICAgICAgICBzb3VyY2U6IHRoaXMsXG4gICAgICAgICAgcG9pbnRlclBvc2l0aW9uOiBjb25zdHJhaW5lZFBvaW50ZXJQb3NpdGlvbixcbiAgICAgICAgICBldmVudCxcbiAgICAgICAgICBkaXN0YW5jZTogdGhpcy5fZ2V0RHJhZ0Rpc3RhbmNlKGNvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uKSxcbiAgICAgICAgICBkZWx0YTogdGhpcy5fcG9pbnRlckRpcmVjdGlvbkRlbHRhLFxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAvKiogSGFuZGxlciB0aGF0IGlzIGludm9rZWQgd2hlbiB0aGUgdXNlciBsaWZ0cyB0aGVpciBwb2ludGVyIHVwLCBhZnRlciBpbml0aWF0aW5nIGEgZHJhZy4gKi9cbiAgcHJpdmF0ZSBfcG9pbnRlclVwID0gKGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCkgPT4ge1xuICAgIHRoaXMuX2VuZERyYWdTZXF1ZW5jZShldmVudCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENsZWFycyBzdWJzY3JpcHRpb25zIGFuZCBzdG9wcyB0aGUgZHJhZ2dpbmcgc2VxdWVuY2UuXG4gICAqIEBwYXJhbSBldmVudCBCcm93c2VyIGV2ZW50IG9iamVjdCB0aGF0IGVuZGVkIHRoZSBzZXF1ZW5jZS5cbiAgICovXG4gIHByaXZhdGUgX2VuZERyYWdTZXF1ZW5jZShldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpIHtcbiAgICAvLyBOb3RlIHRoYXQgaGVyZSB3ZSB1c2UgYGlzRHJhZ2dpbmdgIGZyb20gdGhlIHNlcnZpY2UsIHJhdGhlciB0aGFuIGZyb20gYHRoaXNgLlxuICAgIC8vIFRoZSBkaWZmZXJlbmNlIGlzIHRoYXQgdGhlIG9uZSBmcm9tIHRoZSBzZXJ2aWNlIHJlZmxlY3RzIHdoZXRoZXIgYSBkcmFnZ2luZyBzZXF1ZW5jZVxuICAgIC8vIGhhcyBiZWVuIGluaXRpYXRlZCwgd2hlcmVhcyB0aGUgb25lIG9uIGB0aGlzYCBpbmNsdWRlcyB3aGV0aGVyIHRoZSB1c2VyIGhhcyBwYXNzZWRcbiAgICAvLyB0aGUgbWluaW11bSBkcmFnZ2luZyB0aHJlc2hvbGQuXG4gICAgaWYgKCF0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LmlzRHJhZ2dpbmcodGhpcykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9yZW1vdmVTdWJzY3JpcHRpb25zKCk7XG4gICAgdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5zdG9wRHJhZ2dpbmcodGhpcyk7XG4gICAgdGhpcy5fdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucygpO1xuXG4gICAgaWYgKHRoaXMuX2hhbmRsZXMpIHtcbiAgICAgICh0aGlzLl9yb290RWxlbWVudC5zdHlsZSBhcyBEcmFnQ1NTU3R5bGVEZWNsYXJhdGlvbikud2Via2l0VGFwSGlnaGxpZ2h0Q29sb3IgPVxuICAgICAgICB0aGlzLl9yb290RWxlbWVudFRhcEhpZ2hsaWdodDtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX2hhc1N0YXJ0ZWREcmFnZ2luZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMucmVsZWFzZWQubmV4dCh7c291cmNlOiB0aGlzLCBldmVudH0pO1xuXG4gICAgaWYgKHRoaXMuX2Ryb3BDb250YWluZXIpIHtcbiAgICAgIC8vIFN0b3Agc2Nyb2xsaW5nIGltbWVkaWF0ZWx5LCBpbnN0ZWFkIG9mIHdhaXRpbmcgZm9yIHRoZSBhbmltYXRpb24gdG8gZmluaXNoLlxuICAgICAgdGhpcy5fZHJvcENvbnRhaW5lci5fc3RvcFNjcm9sbGluZygpO1xuICAgICAgdGhpcy5fYW5pbWF0ZVByZXZpZXdUb1BsYWNlaG9sZGVyKCkudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMuX2NsZWFudXBEcmFnQXJ0aWZhY3RzKGV2ZW50KTtcbiAgICAgICAgdGhpcy5fY2xlYW51cENhY2hlZERpbWVuc2lvbnMoKTtcbiAgICAgICAgdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5zdG9wRHJhZ2dpbmcodGhpcyk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQ29udmVydCB0aGUgYWN0aXZlIHRyYW5zZm9ybSBpbnRvIGEgcGFzc2l2ZSBvbmUuIFRoaXMgbWVhbnMgdGhhdCBuZXh0IHRpbWVcbiAgICAgIC8vIHRoZSB1c2VyIHN0YXJ0cyBkcmFnZ2luZyB0aGUgaXRlbSwgaXRzIHBvc2l0aW9uIHdpbGwgYmUgY2FsY3VsYXRlZCByZWxhdGl2ZWx5XG4gICAgICAvLyB0byB0aGUgbmV3IHBhc3NpdmUgdHJhbnNmb3JtLlxuICAgICAgdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybS54ID0gdGhpcy5fYWN0aXZlVHJhbnNmb3JtLng7XG4gICAgICBjb25zdCBwb2ludGVyUG9zaXRpb24gPSB0aGlzLl9nZXRQb2ludGVyUG9zaXRpb25PblBhZ2UoZXZlbnQpO1xuICAgICAgdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybS55ID0gdGhpcy5fYWN0aXZlVHJhbnNmb3JtLnk7XG4gICAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5lbmRlZC5uZXh0KHtcbiAgICAgICAgICBzb3VyY2U6IHRoaXMsXG4gICAgICAgICAgZGlzdGFuY2U6IHRoaXMuX2dldERyYWdEaXN0YW5jZShwb2ludGVyUG9zaXRpb24pLFxuICAgICAgICAgIGRyb3BQb2ludDogcG9pbnRlclBvc2l0aW9uLFxuICAgICAgICAgIGV2ZW50LFxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5fY2xlYW51cENhY2hlZERpbWVuc2lvbnMoKTtcbiAgICAgIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuc3RvcERyYWdnaW5nKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTdGFydHMgdGhlIGRyYWdnaW5nIHNlcXVlbmNlLiAqL1xuICBwcml2YXRlIF9zdGFydERyYWdTZXF1ZW5jZShldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpIHtcbiAgICBpZiAoaXNUb3VjaEV2ZW50KGV2ZW50KSkge1xuICAgICAgdGhpcy5fbGFzdFRvdWNoRXZlbnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICB9XG5cbiAgICB0aGlzLl90b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKCk7XG5cbiAgICBjb25zdCBkcm9wQ29udGFpbmVyID0gdGhpcy5fZHJvcENvbnRhaW5lcjtcblxuICAgIGlmIChkcm9wQ29udGFpbmVyKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fcm9vdEVsZW1lbnQ7XG4gICAgICBjb25zdCBwYXJlbnQgPSBlbGVtZW50LnBhcmVudE5vZGUgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICBjb25zdCBwbGFjZWhvbGRlciA9ICh0aGlzLl9wbGFjZWhvbGRlciA9IHRoaXMuX2NyZWF0ZVBsYWNlaG9sZGVyRWxlbWVudCgpKTtcbiAgICAgIGNvbnN0IGFuY2hvciA9ICh0aGlzLl9hbmNob3IgPSB0aGlzLl9hbmNob3IgfHwgdGhpcy5fZG9jdW1lbnQuY3JlYXRlQ29tbWVudCgnJykpO1xuXG4gICAgICAvLyBOZWVkcyB0byBoYXBwZW4gYmVmb3JlIHRoZSByb290IGVsZW1lbnQgaXMgbW92ZWQuXG4gICAgICBjb25zdCBzaGFkb3dSb290ID0gdGhpcy5fZ2V0U2hhZG93Um9vdCgpO1xuXG4gICAgICAvLyBJbnNlcnQgYW4gYW5jaG9yIG5vZGUgc28gdGhhdCB3ZSBjYW4gcmVzdG9yZSB0aGUgZWxlbWVudCdzIHBvc2l0aW9uIGluIHRoZSBET00uXG4gICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGFuY2hvciwgZWxlbWVudCk7XG5cbiAgICAgIC8vIFRoZXJlJ3Mgbm8gcmlzayBvZiB0cmFuc2Zvcm1zIHN0YWNraW5nIHdoZW4gaW5zaWRlIGEgZHJvcCBjb250YWluZXIgc29cbiAgICAgIC8vIHdlIGNhbiBrZWVwIHRoZSBpbml0aWFsIHRyYW5zZm9ybSB1cCB0byBkYXRlIGFueSB0aW1lIGRyYWdnaW5nIHN0YXJ0cy5cbiAgICAgIHRoaXMuX2luaXRpYWxUcmFuc2Zvcm0gPSBlbGVtZW50LnN0eWxlLnRyYW5zZm9ybSB8fCAnJztcblxuICAgICAgLy8gQ3JlYXRlIHRoZSBwcmV2aWV3IGFmdGVyIHRoZSBpbml0aWFsIHRyYW5zZm9ybSBoYXNcbiAgICAgIC8vIGJlZW4gY2FjaGVkLCBiZWNhdXNlIGl0IGNhbiBiZSBhZmZlY3RlZCBieSB0aGUgdHJhbnNmb3JtLlxuICAgICAgdGhpcy5fcHJldmlldyA9IHRoaXMuX2NyZWF0ZVByZXZpZXdFbGVtZW50KCk7XG5cbiAgICAgIC8vIFdlIG1vdmUgdGhlIGVsZW1lbnQgb3V0IGF0IHRoZSBlbmQgb2YgdGhlIGJvZHkgYW5kIHdlIG1ha2UgaXQgaGlkZGVuLCBiZWNhdXNlIGtlZXBpbmcgaXQgaW5cbiAgICAgIC8vIHBsYWNlIHdpbGwgdGhyb3cgb2ZmIHRoZSBjb25zdW1lcidzIGA6bGFzdC1jaGlsZGAgc2VsZWN0b3JzLiBXZSBjYW4ndCByZW1vdmUgdGhlIGVsZW1lbnRcbiAgICAgIC8vIGZyb20gdGhlIERPTSBjb21wbGV0ZWx5LCBiZWNhdXNlIGlPUyB3aWxsIHN0b3AgZmlyaW5nIGFsbCBzdWJzZXF1ZW50IGV2ZW50cyBpbiB0aGUgY2hhaW4uXG4gICAgICB0b2dnbGVWaXNpYmlsaXR5KGVsZW1lbnQsIGZhbHNlLCBkcmFnSW1wb3J0YW50UHJvcGVydGllcyk7XG4gICAgICB0aGlzLl9kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHBhcmVudC5yZXBsYWNlQ2hpbGQocGxhY2Vob2xkZXIsIGVsZW1lbnQpKTtcbiAgICAgIHRoaXMuX2dldFByZXZpZXdJbnNlcnRpb25Qb2ludChwYXJlbnQsIHNoYWRvd1Jvb3QpLmFwcGVuZENoaWxkKHRoaXMuX3ByZXZpZXcpO1xuICAgICAgdGhpcy5zdGFydGVkLm5leHQoe3NvdXJjZTogdGhpcywgZXZlbnR9KTsgLy8gRW1pdCBiZWZvcmUgbm90aWZ5aW5nIHRoZSBjb250YWluZXIuXG4gICAgICBkcm9wQ29udGFpbmVyLnN0YXJ0KCk7XG4gICAgICB0aGlzLl9pbml0aWFsQ29udGFpbmVyID0gZHJvcENvbnRhaW5lcjtcbiAgICAgIHRoaXMuX2luaXRpYWxJbmRleCA9IGRyb3BDb250YWluZXIuZ2V0SXRlbUluZGV4KHRoaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnN0YXJ0ZWQubmV4dCh7c291cmNlOiB0aGlzLCBldmVudH0pO1xuICAgICAgdGhpcy5faW5pdGlhbENvbnRhaW5lciA9IHRoaXMuX2luaXRpYWxJbmRleCA9IHVuZGVmaW5lZCE7XG4gICAgfVxuXG4gICAgLy8gSW1wb3J0YW50IHRvIHJ1biBhZnRlciB3ZSd2ZSBjYWxsZWQgYHN0YXJ0YCBvbiB0aGUgcGFyZW50IGNvbnRhaW5lclxuICAgIC8vIHNvIHRoYXQgaXQgaGFzIGhhZCB0aW1lIHRvIHJlc29sdmUgaXRzIHNjcm9sbGFibGUgcGFyZW50cy5cbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuY2FjaGUoZHJvcENvbnRhaW5lciA/IGRyb3BDb250YWluZXIuZ2V0U2Nyb2xsYWJsZVBhcmVudHMoKSA6IFtdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIHRoZSBkaWZmZXJlbnQgdmFyaWFibGVzIGFuZCBzdWJzY3JpcHRpb25zXG4gICAqIHRoYXQgd2lsbCBiZSBuZWNlc3NhcnkgZm9yIHRoZSBkcmFnZ2luZyBzZXF1ZW5jZS5cbiAgICogQHBhcmFtIHJlZmVyZW5jZUVsZW1lbnQgRWxlbWVudCB0aGF0IHN0YXJ0ZWQgdGhlIGRyYWcgc2VxdWVuY2UuXG4gICAqIEBwYXJhbSBldmVudCBCcm93c2VyIGV2ZW50IG9iamVjdCB0aGF0IHN0YXJ0ZWQgdGhlIHNlcXVlbmNlLlxuICAgKi9cbiAgcHJpdmF0ZSBfaW5pdGlhbGl6ZURyYWdTZXF1ZW5jZShyZWZlcmVuY2VFbGVtZW50OiBIVE1MRWxlbWVudCwgZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KSB7XG4gICAgLy8gU3RvcCBwcm9wYWdhdGlvbiBpZiB0aGUgaXRlbSBpcyBpbnNpZGUgYW5vdGhlclxuICAgIC8vIGRyYWdnYWJsZSBzbyB3ZSBkb24ndCBzdGFydCBtdWx0aXBsZSBkcmFnIHNlcXVlbmNlcy5cbiAgICBpZiAodGhpcy5fcGFyZW50RHJhZ1JlZikge1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfVxuXG4gICAgY29uc3QgaXNEcmFnZ2luZyA9IHRoaXMuaXNEcmFnZ2luZygpO1xuICAgIGNvbnN0IGlzVG91Y2hTZXF1ZW5jZSA9IGlzVG91Y2hFdmVudChldmVudCk7XG4gICAgY29uc3QgaXNBdXhpbGlhcnlNb3VzZUJ1dHRvbiA9ICFpc1RvdWNoU2VxdWVuY2UgJiYgKGV2ZW50IGFzIE1vdXNlRXZlbnQpLmJ1dHRvbiAhPT0gMDtcbiAgICBjb25zdCByb290RWxlbWVudCA9IHRoaXMuX3Jvb3RFbGVtZW50O1xuICAgIGNvbnN0IHRhcmdldCA9IF9nZXRFdmVudFRhcmdldChldmVudCk7XG4gICAgY29uc3QgaXNTeW50aGV0aWNFdmVudCA9XG4gICAgICAhaXNUb3VjaFNlcXVlbmNlICYmXG4gICAgICB0aGlzLl9sYXN0VG91Y2hFdmVudFRpbWUgJiZcbiAgICAgIHRoaXMuX2xhc3RUb3VjaEV2ZW50VGltZSArIE1PVVNFX0VWRU5UX0lHTk9SRV9USU1FID4gRGF0ZS5ub3coKTtcbiAgICBjb25zdCBpc0Zha2VFdmVudCA9IGlzVG91Y2hTZXF1ZW5jZVxuICAgICAgPyBpc0Zha2VUb3VjaHN0YXJ0RnJvbVNjcmVlblJlYWRlcihldmVudCBhcyBUb3VjaEV2ZW50KVxuICAgICAgOiBpc0Zha2VNb3VzZWRvd25Gcm9tU2NyZWVuUmVhZGVyKGV2ZW50IGFzIE1vdXNlRXZlbnQpO1xuXG4gICAgLy8gSWYgdGhlIGV2ZW50IHN0YXJ0ZWQgZnJvbSBhbiBlbGVtZW50IHdpdGggdGhlIG5hdGl2ZSBIVE1MIGRyYWcmZHJvcCwgaXQnbGwgaW50ZXJmZXJlXG4gICAgLy8gd2l0aCBvdXIgb3duIGRyYWdnaW5nIChlLmcuIGBpbWdgIHRhZ3MgZG8gaXQgYnkgZGVmYXVsdCkuIFByZXZlbnQgdGhlIGRlZmF1bHQgYWN0aW9uXG4gICAgLy8gdG8gc3RvcCBpdCBmcm9tIGhhcHBlbmluZy4gTm90ZSB0aGF0IHByZXZlbnRpbmcgb24gYGRyYWdzdGFydGAgYWxzbyBzZWVtcyB0byB3b3JrLCBidXRcbiAgICAvLyBpdCdzIGZsYWt5IGFuZCBpdCBmYWlscyBpZiB0aGUgdXNlciBkcmFncyBpdCBhd2F5IHF1aWNrbHkuIEFsc28gbm90ZSB0aGF0IHdlIG9ubHkgd2FudFxuICAgIC8vIHRvIGRvIHRoaXMgZm9yIGBtb3VzZWRvd25gIHNpbmNlIGRvaW5nIHRoZSBzYW1lIGZvciBgdG91Y2hzdGFydGAgd2lsbCBzdG9wIGFueSBgY2xpY2tgXG4gICAgLy8gZXZlbnRzIGZyb20gZmlyaW5nIG9uIHRvdWNoIGRldmljZXMuXG4gICAgaWYgKHRhcmdldCAmJiAodGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5kcmFnZ2FibGUgJiYgZXZlbnQudHlwZSA9PT0gJ21vdXNlZG93bicpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuXG4gICAgLy8gQWJvcnQgaWYgdGhlIHVzZXIgaXMgYWxyZWFkeSBkcmFnZ2luZyBvciBpcyB1c2luZyBhIG1vdXNlIGJ1dHRvbiBvdGhlciB0aGFuIHRoZSBwcmltYXJ5IG9uZS5cbiAgICBpZiAoaXNEcmFnZ2luZyB8fCBpc0F1eGlsaWFyeU1vdXNlQnV0dG9uIHx8IGlzU3ludGhldGljRXZlbnQgfHwgaXNGYWtlRXZlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSd2ZSBnb3QgaGFuZGxlcywgd2UgbmVlZCB0byBkaXNhYmxlIHRoZSB0YXAgaGlnaGxpZ2h0IG9uIHRoZSBlbnRpcmUgcm9vdCBlbGVtZW50LFxuICAgIC8vIG90aGVyd2lzZSBpT1Mgd2lsbCBzdGlsbCBhZGQgaXQsIGV2ZW4gdGhvdWdoIGFsbCB0aGUgZHJhZyBpbnRlcmFjdGlvbnMgb24gdGhlIGhhbmRsZVxuICAgIC8vIGFyZSBkaXNhYmxlZC5cbiAgICBpZiAodGhpcy5faGFuZGxlcy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHJvb3RTdHlsZXMgPSByb290RWxlbWVudC5zdHlsZSBhcyBEcmFnQ1NTU3R5bGVEZWNsYXJhdGlvbjtcbiAgICAgIHRoaXMuX3Jvb3RFbGVtZW50VGFwSGlnaGxpZ2h0ID0gcm9vdFN0eWxlcy53ZWJraXRUYXBIaWdobGlnaHRDb2xvciB8fCAnJztcbiAgICAgIHJvb3RTdHlsZXMud2Via2l0VGFwSGlnaGxpZ2h0Q29sb3IgPSAndHJhbnNwYXJlbnQnO1xuICAgIH1cblxuICAgIHRoaXMuX2hhc1N0YXJ0ZWREcmFnZ2luZyA9IHRoaXMuX2hhc01vdmVkID0gZmFsc2U7XG5cbiAgICAvLyBBdm9pZCBtdWx0aXBsZSBzdWJzY3JpcHRpb25zIGFuZCBtZW1vcnkgbGVha3Mgd2hlbiBtdWx0aSB0b3VjaFxuICAgIC8vIChpc0RyYWdnaW5nIGNoZWNrIGFib3ZlIGlzbid0IGVub3VnaCBiZWNhdXNlIG9mIHBvc3NpYmxlIHRlbXBvcmFsIGFuZC9vciBkaW1lbnNpb25hbCBkZWxheXMpXG4gICAgdGhpcy5fcmVtb3ZlU3Vic2NyaXB0aW9ucygpO1xuICAgIHRoaXMuX2luaXRpYWxDbGllbnRSZWN0ID0gdGhpcy5fcm9vdEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgdGhpcy5fcG9pbnRlck1vdmVTdWJzY3JpcHRpb24gPSB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnBvaW50ZXJNb3ZlLnN1YnNjcmliZSh0aGlzLl9wb2ludGVyTW92ZSk7XG4gICAgdGhpcy5fcG9pbnRlclVwU3Vic2NyaXB0aW9uID0gdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5wb2ludGVyVXAuc3Vic2NyaWJlKHRoaXMuX3BvaW50ZXJVcCk7XG4gICAgdGhpcy5fc2Nyb2xsU3Vic2NyaXB0aW9uID0gdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeVxuICAgICAgLnNjcm9sbGVkKHRoaXMuX2dldFNoYWRvd1Jvb3QoKSlcbiAgICAgIC5zdWJzY3JpYmUoc2Nyb2xsRXZlbnQgPT4gdGhpcy5fdXBkYXRlT25TY3JvbGwoc2Nyb2xsRXZlbnQpKTtcblxuICAgIGlmICh0aGlzLl9ib3VuZGFyeUVsZW1lbnQpIHtcbiAgICAgIHRoaXMuX2JvdW5kYXJ5UmVjdCA9IGdldE11dGFibGVDbGllbnRSZWN0KHRoaXMuX2JvdW5kYXJ5RWxlbWVudCk7XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgaGF2ZSBhIGN1c3RvbSBwcmV2aWV3IHdlIGNhbid0IGtub3cgYWhlYWQgb2YgdGltZSBob3cgbGFyZ2UgaXQnbGwgYmUgc28gd2UgcG9zaXRpb25cbiAgICAvLyBpdCBuZXh0IHRvIHRoZSBjdXJzb3IuIFRoZSBleGNlcHRpb24gaXMgd2hlbiB0aGUgY29uc3VtZXIgaGFzIG9wdGVkIGludG8gbWFraW5nIHRoZSBwcmV2aWV3XG4gICAgLy8gdGhlIHNhbWUgc2l6ZSBhcyB0aGUgcm9vdCBlbGVtZW50LCBpbiB3aGljaCBjYXNlIHdlIGRvIGtub3cgdGhlIHNpemUuXG4gICAgY29uc3QgcHJldmlld1RlbXBsYXRlID0gdGhpcy5fcHJldmlld1RlbXBsYXRlO1xuICAgIHRoaXMuX3BpY2t1cFBvc2l0aW9uSW5FbGVtZW50ID1cbiAgICAgIHByZXZpZXdUZW1wbGF0ZSAmJiBwcmV2aWV3VGVtcGxhdGUudGVtcGxhdGUgJiYgIXByZXZpZXdUZW1wbGF0ZS5tYXRjaFNpemVcbiAgICAgICAgPyB7eDogMCwgeTogMH1cbiAgICAgICAgOiB0aGlzLl9nZXRQb2ludGVyUG9zaXRpb25JbkVsZW1lbnQodGhpcy5faW5pdGlhbENsaWVudFJlY3QsIHJlZmVyZW5jZUVsZW1lbnQsIGV2ZW50KTtcbiAgICBjb25zdCBwb2ludGVyUG9zaXRpb24gPVxuICAgICAgKHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlID1cbiAgICAgIHRoaXMuX2xhc3RLbm93blBvaW50ZXJQb3NpdGlvbiA9XG4gICAgICAgIHRoaXMuX2dldFBvaW50ZXJQb3NpdGlvbk9uUGFnZShldmVudCkpO1xuICAgIHRoaXMuX3BvaW50ZXJEaXJlY3Rpb25EZWx0YSA9IHt4OiAwLCB5OiAwfTtcbiAgICB0aGlzLl9wb2ludGVyUG9zaXRpb25BdExhc3REaXJlY3Rpb25DaGFuZ2UgPSB7eDogcG9pbnRlclBvc2l0aW9uLngsIHk6IHBvaW50ZXJQb3NpdGlvbi55fTtcbiAgICB0aGlzLl9kcmFnU3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnN0YXJ0RHJhZ2dpbmcodGhpcywgZXZlbnQpO1xuICB9XG5cbiAgLyoqIENsZWFucyB1cCB0aGUgRE9NIGFydGlmYWN0cyB0aGF0IHdlcmUgYWRkZWQgdG8gZmFjaWxpdGF0ZSB0aGUgZWxlbWVudCBiZWluZyBkcmFnZ2VkLiAqL1xuICBwcml2YXRlIF9jbGVhbnVwRHJhZ0FydGlmYWN0cyhldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpIHtcbiAgICAvLyBSZXN0b3JlIHRoZSBlbGVtZW50J3MgdmlzaWJpbGl0eSBhbmQgaW5zZXJ0IGl0IGF0IGl0cyBvbGQgcG9zaXRpb24gaW4gdGhlIERPTS5cbiAgICAvLyBJdCdzIGltcG9ydGFudCB0aGF0IHdlIG1haW50YWluIHRoZSBwb3NpdGlvbiwgYmVjYXVzZSBtb3ZpbmcgdGhlIGVsZW1lbnQgYXJvdW5kIGluIHRoZSBET01cbiAgICAvLyBjYW4gdGhyb3cgb2ZmIGBOZ0ZvcmAgd2hpY2ggZG9lcyBzbWFydCBkaWZmaW5nIGFuZCByZS1jcmVhdGVzIGVsZW1lbnRzIG9ubHkgd2hlbiBuZWNlc3NhcnksXG4gICAgLy8gd2hpbGUgbW92aW5nIHRoZSBleGlzdGluZyBlbGVtZW50cyBpbiBhbGwgb3RoZXIgY2FzZXMuXG4gICAgdG9nZ2xlVmlzaWJpbGl0eSh0aGlzLl9yb290RWxlbWVudCwgdHJ1ZSwgZHJhZ0ltcG9ydGFudFByb3BlcnRpZXMpO1xuICAgIHRoaXMuX2FuY2hvci5wYXJlbnROb2RlIS5yZXBsYWNlQ2hpbGQodGhpcy5fcm9vdEVsZW1lbnQsIHRoaXMuX2FuY2hvcik7XG5cbiAgICB0aGlzLl9kZXN0cm95UHJldmlldygpO1xuICAgIHRoaXMuX2Rlc3Ryb3lQbGFjZWhvbGRlcigpO1xuICAgIHRoaXMuX2luaXRpYWxDbGllbnRSZWN0ID1cbiAgICAgIHRoaXMuX2JvdW5kYXJ5UmVjdCA9XG4gICAgICB0aGlzLl9wcmV2aWV3UmVjdCA9XG4gICAgICB0aGlzLl9pbml0aWFsVHJhbnNmb3JtID1cbiAgICAgICAgdW5kZWZpbmVkO1xuXG4gICAgLy8gUmUtZW50ZXIgdGhlIE5nWm9uZSBzaW5jZSB3ZSBib3VuZCBgZG9jdW1lbnRgIGV2ZW50cyBvbiB0aGUgb3V0c2lkZS5cbiAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuX2Ryb3BDb250YWluZXIhO1xuICAgICAgY29uc3QgY3VycmVudEluZGV4ID0gY29udGFpbmVyLmdldEl0ZW1JbmRleCh0aGlzKTtcbiAgICAgIGNvbnN0IHBvaW50ZXJQb3NpdGlvbiA9IHRoaXMuX2dldFBvaW50ZXJQb3NpdGlvbk9uUGFnZShldmVudCk7XG4gICAgICBjb25zdCBkaXN0YW5jZSA9IHRoaXMuX2dldERyYWdEaXN0YW5jZShwb2ludGVyUG9zaXRpb24pO1xuICAgICAgY29uc3QgaXNQb2ludGVyT3ZlckNvbnRhaW5lciA9IGNvbnRhaW5lci5faXNPdmVyQ29udGFpbmVyKFxuICAgICAgICBwb2ludGVyUG9zaXRpb24ueCxcbiAgICAgICAgcG9pbnRlclBvc2l0aW9uLnksXG4gICAgICApO1xuXG4gICAgICB0aGlzLmVuZGVkLm5leHQoe3NvdXJjZTogdGhpcywgZGlzdGFuY2UsIGRyb3BQb2ludDogcG9pbnRlclBvc2l0aW9uLCBldmVudH0pO1xuICAgICAgdGhpcy5kcm9wcGVkLm5leHQoe1xuICAgICAgICBpdGVtOiB0aGlzLFxuICAgICAgICBjdXJyZW50SW5kZXgsXG4gICAgICAgIHByZXZpb3VzSW5kZXg6IHRoaXMuX2luaXRpYWxJbmRleCxcbiAgICAgICAgY29udGFpbmVyOiBjb250YWluZXIsXG4gICAgICAgIHByZXZpb3VzQ29udGFpbmVyOiB0aGlzLl9pbml0aWFsQ29udGFpbmVyLFxuICAgICAgICBpc1BvaW50ZXJPdmVyQ29udGFpbmVyLFxuICAgICAgICBkaXN0YW5jZSxcbiAgICAgICAgZHJvcFBvaW50OiBwb2ludGVyUG9zaXRpb24sXG4gICAgICAgIGV2ZW50LFxuICAgICAgfSk7XG4gICAgICBjb250YWluZXIuZHJvcChcbiAgICAgICAgdGhpcyxcbiAgICAgICAgY3VycmVudEluZGV4LFxuICAgICAgICB0aGlzLl9pbml0aWFsSW5kZXgsXG4gICAgICAgIHRoaXMuX2luaXRpYWxDb250YWluZXIsXG4gICAgICAgIGlzUG9pbnRlck92ZXJDb250YWluZXIsXG4gICAgICAgIGRpc3RhbmNlLFxuICAgICAgICBwb2ludGVyUG9zaXRpb24sXG4gICAgICApO1xuICAgICAgdGhpcy5fZHJvcENvbnRhaW5lciA9IHRoaXMuX2luaXRpYWxDb250YWluZXI7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgaXRlbSdzIHBvc2l0aW9uIGluIGl0cyBkcm9wIGNvbnRhaW5lciwgb3IgbW92ZXMgaXRcbiAgICogaW50byBhIG5ldyBvbmUsIGRlcGVuZGluZyBvbiBpdHMgY3VycmVudCBkcmFnIHBvc2l0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBfdXBkYXRlQWN0aXZlRHJvcENvbnRhaW5lcih7eCwgeX06IFBvaW50LCB7eDogcmF3WCwgeTogcmF3WX06IFBvaW50KSB7XG4gICAgLy8gRHJvcCBjb250YWluZXIgdGhhdCBkcmFnZ2FibGUgaGFzIGJlZW4gbW92ZWQgaW50by5cbiAgICBsZXQgbmV3Q29udGFpbmVyID0gdGhpcy5faW5pdGlhbENvbnRhaW5lci5fZ2V0U2libGluZ0NvbnRhaW5lckZyb21Qb3NpdGlvbih0aGlzLCB4LCB5KTtcblxuICAgIC8vIElmIHdlIGNvdWxkbid0IGZpbmQgYSBuZXcgY29udGFpbmVyIHRvIG1vdmUgdGhlIGl0ZW0gaW50bywgYW5kIHRoZSBpdGVtIGhhcyBsZWZ0IGl0c1xuICAgIC8vIGluaXRpYWwgY29udGFpbmVyLCBjaGVjayB3aGV0aGVyIHRoZSBpdCdzIG92ZXIgdGhlIGluaXRpYWwgY29udGFpbmVyLiBUaGlzIGhhbmRsZXMgdGhlXG4gICAgLy8gY2FzZSB3aGVyZSB0d28gY29udGFpbmVycyBhcmUgY29ubmVjdGVkIG9uZSB3YXkgYW5kIHRoZSB1c2VyIHRyaWVzIHRvIHVuZG8gZHJhZ2dpbmcgYW5cbiAgICAvLyBpdGVtIGludG8gYSBuZXcgY29udGFpbmVyLlxuICAgIGlmIChcbiAgICAgICFuZXdDb250YWluZXIgJiZcbiAgICAgIHRoaXMuX2Ryb3BDb250YWluZXIgIT09IHRoaXMuX2luaXRpYWxDb250YWluZXIgJiZcbiAgICAgIHRoaXMuX2luaXRpYWxDb250YWluZXIuX2lzT3ZlckNvbnRhaW5lcih4LCB5KVxuICAgICkge1xuICAgICAgbmV3Q29udGFpbmVyID0gdGhpcy5faW5pdGlhbENvbnRhaW5lcjtcbiAgICB9XG5cbiAgICBpZiAobmV3Q29udGFpbmVyICYmIG5ld0NvbnRhaW5lciAhPT0gdGhpcy5fZHJvcENvbnRhaW5lcikge1xuICAgICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiB7XG4gICAgICAgIC8vIE5vdGlmeSB0aGUgb2xkIGNvbnRhaW5lciB0aGF0IHRoZSBpdGVtIGhhcyBsZWZ0LlxuICAgICAgICB0aGlzLmV4aXRlZC5uZXh0KHtpdGVtOiB0aGlzLCBjb250YWluZXI6IHRoaXMuX2Ryb3BDb250YWluZXIhfSk7XG4gICAgICAgIHRoaXMuX2Ryb3BDb250YWluZXIhLmV4aXQodGhpcyk7XG4gICAgICAgIC8vIE5vdGlmeSB0aGUgbmV3IGNvbnRhaW5lciB0aGF0IHRoZSBpdGVtIGhhcyBlbnRlcmVkLlxuICAgICAgICB0aGlzLl9kcm9wQ29udGFpbmVyID0gbmV3Q29udGFpbmVyITtcbiAgICAgICAgdGhpcy5fZHJvcENvbnRhaW5lci5lbnRlcihcbiAgICAgICAgICB0aGlzLFxuICAgICAgICAgIHgsXG4gICAgICAgICAgeSxcbiAgICAgICAgICBuZXdDb250YWluZXIgPT09IHRoaXMuX2luaXRpYWxDb250YWluZXIgJiZcbiAgICAgICAgICAgIC8vIElmIHdlJ3JlIHJlLWVudGVyaW5nIHRoZSBpbml0aWFsIGNvbnRhaW5lciBhbmQgc29ydGluZyBpcyBkaXNhYmxlZCxcbiAgICAgICAgICAgIC8vIHB1dCBpdGVtIHRoZSBpbnRvIGl0cyBzdGFydGluZyBpbmRleCB0byBiZWdpbiB3aXRoLlxuICAgICAgICAgICAgbmV3Q29udGFpbmVyLnNvcnRpbmdEaXNhYmxlZFxuICAgICAgICAgICAgPyB0aGlzLl9pbml0aWFsSW5kZXhcbiAgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICApO1xuICAgICAgICB0aGlzLmVudGVyZWQubmV4dCh7XG4gICAgICAgICAgaXRlbTogdGhpcyxcbiAgICAgICAgICBjb250YWluZXI6IG5ld0NvbnRhaW5lciEsXG4gICAgICAgICAgY3VycmVudEluZGV4OiBuZXdDb250YWluZXIhLmdldEl0ZW1JbmRleCh0aGlzKSxcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBEcmFnZ2luZyBtYXkgaGF2ZSBiZWVuIGludGVycnVwdGVkIGFzIGEgcmVzdWx0IG9mIHRoZSBldmVudHMgYWJvdmUuXG4gICAgaWYgKHRoaXMuaXNEcmFnZ2luZygpKSB7XG4gICAgICB0aGlzLl9kcm9wQ29udGFpbmVyIS5fc3RhcnRTY3JvbGxpbmdJZk5lY2Vzc2FyeShyYXdYLCByYXdZKTtcbiAgICAgIHRoaXMuX2Ryb3BDb250YWluZXIhLl9zb3J0SXRlbSh0aGlzLCB4LCB5LCB0aGlzLl9wb2ludGVyRGlyZWN0aW9uRGVsdGEpO1xuXG4gICAgICBpZiAodGhpcy5jb25zdHJhaW5Qb3NpdGlvbikge1xuICAgICAgICB0aGlzLl9hcHBseVByZXZpZXdUcmFuc2Zvcm0oeCwgeSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9hcHBseVByZXZpZXdUcmFuc2Zvcm0oXG4gICAgICAgICAgeCAtIHRoaXMuX3BpY2t1cFBvc2l0aW9uSW5FbGVtZW50LngsXG4gICAgICAgICAgeSAtIHRoaXMuX3BpY2t1cFBvc2l0aW9uSW5FbGVtZW50LnksXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgdGhlIGVsZW1lbnQgdGhhdCB3aWxsIGJlIHJlbmRlcmVkIG5leHQgdG8gdGhlIHVzZXIncyBwb2ludGVyXG4gICAqIGFuZCB3aWxsIGJlIHVzZWQgYXMgYSBwcmV2aWV3IG9mIHRoZSBlbGVtZW50IHRoYXQgaXMgYmVpbmcgZHJhZ2dlZC5cbiAgICovXG4gIHByaXZhdGUgX2NyZWF0ZVByZXZpZXdFbGVtZW50KCk6IEhUTUxFbGVtZW50IHtcbiAgICBjb25zdCBwcmV2aWV3Q29uZmlnID0gdGhpcy5fcHJldmlld1RlbXBsYXRlO1xuICAgIGNvbnN0IHByZXZpZXdDbGFzcyA9IHRoaXMucHJldmlld0NsYXNzO1xuICAgIGNvbnN0IHByZXZpZXdUZW1wbGF0ZSA9IHByZXZpZXdDb25maWcgPyBwcmV2aWV3Q29uZmlnLnRlbXBsYXRlIDogbnVsbDtcbiAgICBsZXQgcHJldmlldzogSFRNTEVsZW1lbnQ7XG5cbiAgICBpZiAocHJldmlld1RlbXBsYXRlICYmIHByZXZpZXdDb25maWcpIHtcbiAgICAgIC8vIE1lYXN1cmUgdGhlIGVsZW1lbnQgYmVmb3JlIHdlJ3ZlIGluc2VydGVkIHRoZSBwcmV2aWV3XG4gICAgICAvLyBzaW5jZSB0aGUgaW5zZXJ0aW9uIGNvdWxkIHRocm93IG9mZiB0aGUgbWVhc3VyZW1lbnQuXG4gICAgICBjb25zdCByb290UmVjdCA9IHByZXZpZXdDb25maWcubWF0Y2hTaXplID8gdGhpcy5faW5pdGlhbENsaWVudFJlY3QgOiBudWxsO1xuICAgICAgY29uc3Qgdmlld1JlZiA9IHByZXZpZXdDb25maWcudmlld0NvbnRhaW5lci5jcmVhdGVFbWJlZGRlZFZpZXcoXG4gICAgICAgIHByZXZpZXdUZW1wbGF0ZSxcbiAgICAgICAgcHJldmlld0NvbmZpZy5jb250ZXh0LFxuICAgICAgKTtcbiAgICAgIHZpZXdSZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgcHJldmlldyA9IGdldFJvb3ROb2RlKHZpZXdSZWYsIHRoaXMuX2RvY3VtZW50KTtcbiAgICAgIHRoaXMuX3ByZXZpZXdSZWYgPSB2aWV3UmVmO1xuICAgICAgaWYgKHByZXZpZXdDb25maWcubWF0Y2hTaXplKSB7XG4gICAgICAgIG1hdGNoRWxlbWVudFNpemUocHJldmlldywgcm9vdFJlY3QhKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHByZXZpZXcuc3R5bGUudHJhbnNmb3JtID0gZ2V0VHJhbnNmb3JtKFxuICAgICAgICAgIHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLngsXG4gICAgICAgICAgdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UueSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcHJldmlldyA9IGRlZXBDbG9uZU5vZGUodGhpcy5fcm9vdEVsZW1lbnQpO1xuICAgICAgbWF0Y2hFbGVtZW50U2l6ZShwcmV2aWV3LCB0aGlzLl9pbml0aWFsQ2xpZW50UmVjdCEpO1xuXG4gICAgICBpZiAodGhpcy5faW5pdGlhbFRyYW5zZm9ybSkge1xuICAgICAgICBwcmV2aWV3LnN0eWxlLnRyYW5zZm9ybSA9IHRoaXMuX2luaXRpYWxUcmFuc2Zvcm07XG4gICAgICB9XG4gICAgfVxuXG4gICAgZXh0ZW5kU3R5bGVzKFxuICAgICAgcHJldmlldy5zdHlsZSxcbiAgICAgIHtcbiAgICAgICAgLy8gSXQncyBpbXBvcnRhbnQgdGhhdCB3ZSBkaXNhYmxlIHRoZSBwb2ludGVyIGV2ZW50cyBvbiB0aGUgcHJldmlldywgYmVjYXVzZVxuICAgICAgICAvLyBpdCBjYW4gdGhyb3cgb2ZmIHRoZSBgZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludGAgY2FsbHMgaW4gdGhlIGBDZGtEcm9wTGlzdGAuXG4gICAgICAgICdwb2ludGVyLWV2ZW50cyc6ICdub25lJyxcbiAgICAgICAgLy8gV2UgaGF2ZSB0byByZXNldCB0aGUgbWFyZ2luLCBiZWNhdXNlIGl0IGNhbiB0aHJvdyBvZmYgcG9zaXRpb25pbmcgcmVsYXRpdmUgdG8gdGhlIHZpZXdwb3J0LlxuICAgICAgICAnbWFyZ2luJzogJzAnLFxuICAgICAgICAncG9zaXRpb24nOiAnZml4ZWQnLFxuICAgICAgICAndG9wJzogJzAnLFxuICAgICAgICAnbGVmdCc6ICcwJyxcbiAgICAgICAgJ3otaW5kZXgnOiBgJHt0aGlzLl9jb25maWcuekluZGV4IHx8IDEwMDB9YCxcbiAgICAgIH0sXG4gICAgICBkcmFnSW1wb3J0YW50UHJvcGVydGllcyxcbiAgICApO1xuXG4gICAgdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucyhwcmV2aWV3LCBmYWxzZSk7XG4gICAgcHJldmlldy5jbGFzc0xpc3QuYWRkKCdjZGstZHJhZy1wcmV2aWV3Jyk7XG4gICAgcHJldmlldy5zZXRBdHRyaWJ1dGUoJ2RpcicsIHRoaXMuX2RpcmVjdGlvbik7XG5cbiAgICBpZiAocHJldmlld0NsYXNzKSB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShwcmV2aWV3Q2xhc3MpKSB7XG4gICAgICAgIHByZXZpZXdDbGFzcy5mb3JFYWNoKGNsYXNzTmFtZSA9PiBwcmV2aWV3LmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcmV2aWV3LmNsYXNzTGlzdC5hZGQocHJldmlld0NsYXNzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcHJldmlldztcbiAgfVxuXG4gIC8qKlxuICAgKiBBbmltYXRlcyB0aGUgcHJldmlldyBlbGVtZW50IGZyb20gaXRzIGN1cnJlbnQgcG9zaXRpb24gdG8gdGhlIGxvY2F0aW9uIG9mIHRoZSBkcm9wIHBsYWNlaG9sZGVyLlxuICAgKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgYW5pbWF0aW9uIGNvbXBsZXRlcy5cbiAgICovXG4gIHByaXZhdGUgX2FuaW1hdGVQcmV2aWV3VG9QbGFjZWhvbGRlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyBJZiB0aGUgdXNlciBoYXNuJ3QgbW92ZWQgeWV0LCB0aGUgdHJhbnNpdGlvbmVuZCBldmVudCB3b24ndCBmaXJlLlxuICAgIGlmICghdGhpcy5faGFzTW92ZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICBjb25zdCBwbGFjZWhvbGRlclJlY3QgPSB0aGlzLl9wbGFjZWhvbGRlci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgIC8vIEFwcGx5IHRoZSBjbGFzcyB0aGF0IGFkZHMgYSB0cmFuc2l0aW9uIHRvIHRoZSBwcmV2aWV3LlxuICAgIHRoaXMuX3ByZXZpZXcuY2xhc3NMaXN0LmFkZCgnY2RrLWRyYWctYW5pbWF0aW5nJyk7XG5cbiAgICAvLyBNb3ZlIHRoZSBwcmV2aWV3IHRvIHRoZSBwbGFjZWhvbGRlciBwb3NpdGlvbi5cbiAgICB0aGlzLl9hcHBseVByZXZpZXdUcmFuc2Zvcm0ocGxhY2Vob2xkZXJSZWN0LmxlZnQsIHBsYWNlaG9sZGVyUmVjdC50b3ApO1xuXG4gICAgLy8gSWYgdGhlIGVsZW1lbnQgZG9lc24ndCBoYXZlIGEgYHRyYW5zaXRpb25gLCB0aGUgYHRyYW5zaXRpb25lbmRgIGV2ZW50IHdvbid0IGZpcmUuIFNpbmNlXG4gICAgLy8gd2UgbmVlZCB0byB0cmlnZ2VyIGEgc3R5bGUgcmVjYWxjdWxhdGlvbiBpbiBvcmRlciBmb3IgdGhlIGBjZGstZHJhZy1hbmltYXRpbmdgIGNsYXNzIHRvXG4gICAgLy8gYXBwbHkgaXRzIHN0eWxlLCB3ZSB0YWtlIGFkdmFudGFnZSBvZiB0aGUgYXZhaWxhYmxlIGluZm8gdG8gZmlndXJlIG91dCB3aGV0aGVyIHdlIG5lZWQgdG9cbiAgICAvLyBiaW5kIHRoZSBldmVudCBpbiB0aGUgZmlyc3QgcGxhY2UuXG4gICAgY29uc3QgZHVyYXRpb24gPSBnZXRUcmFuc2Zvcm1UcmFuc2l0aW9uRHVyYXRpb25Jbk1zKHRoaXMuX3ByZXZpZXcpO1xuXG4gICAgaWYgKGR1cmF0aW9uID09PSAwKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIGNvbnN0IGhhbmRsZXIgPSAoKGV2ZW50OiBUcmFuc2l0aW9uRXZlbnQpID0+IHtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAhZXZlbnQgfHxcbiAgICAgICAgICAgIChfZ2V0RXZlbnRUYXJnZXQoZXZlbnQpID09PSB0aGlzLl9wcmV2aWV3ICYmIGV2ZW50LnByb3BlcnR5TmFtZSA9PT0gJ3RyYW5zZm9ybScpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLl9wcmV2aWV3Py5yZW1vdmVFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgaGFuZGxlcik7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KSBhcyBFdmVudExpc3RlbmVyT3JFdmVudExpc3RlbmVyT2JqZWN0O1xuXG4gICAgICAgIC8vIElmIGEgdHJhbnNpdGlvbiBpcyBzaG9ydCBlbm91Z2gsIHRoZSBicm93c2VyIG1pZ2h0IG5vdCBmaXJlIHRoZSBgdHJhbnNpdGlvbmVuZGAgZXZlbnQuXG4gICAgICAgIC8vIFNpbmNlIHdlIGtub3cgaG93IGxvbmcgaXQncyBzdXBwb3NlZCB0byB0YWtlLCBhZGQgYSB0aW1lb3V0IHdpdGggYSA1MCUgYnVmZmVyIHRoYXQnbGxcbiAgICAgICAgLy8gZmlyZSBpZiB0aGUgdHJhbnNpdGlvbiBoYXNuJ3QgY29tcGxldGVkIHdoZW4gaXQgd2FzIHN1cHBvc2VkIHRvLlxuICAgICAgICBjb25zdCB0aW1lb3V0ID0gc2V0VGltZW91dChoYW5kbGVyIGFzIEZ1bmN0aW9uLCBkdXJhdGlvbiAqIDEuNSk7XG4gICAgICAgIHRoaXMuX3ByZXZpZXcuYWRkRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIGhhbmRsZXIpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhbiBlbGVtZW50IHRoYXQgd2lsbCBiZSBzaG93biBpbnN0ZWFkIG9mIHRoZSBjdXJyZW50IGVsZW1lbnQgd2hpbGUgZHJhZ2dpbmcuICovXG4gIHByaXZhdGUgX2NyZWF0ZVBsYWNlaG9sZGVyRWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3QgcGxhY2Vob2xkZXJDb25maWcgPSB0aGlzLl9wbGFjZWhvbGRlclRlbXBsYXRlO1xuICAgIGNvbnN0IHBsYWNlaG9sZGVyVGVtcGxhdGUgPSBwbGFjZWhvbGRlckNvbmZpZyA/IHBsYWNlaG9sZGVyQ29uZmlnLnRlbXBsYXRlIDogbnVsbDtcbiAgICBsZXQgcGxhY2Vob2xkZXI6IEhUTUxFbGVtZW50O1xuXG4gICAgaWYgKHBsYWNlaG9sZGVyVGVtcGxhdGUpIHtcbiAgICAgIHRoaXMuX3BsYWNlaG9sZGVyUmVmID0gcGxhY2Vob2xkZXJDb25maWchLnZpZXdDb250YWluZXIuY3JlYXRlRW1iZWRkZWRWaWV3KFxuICAgICAgICBwbGFjZWhvbGRlclRlbXBsYXRlLFxuICAgICAgICBwbGFjZWhvbGRlckNvbmZpZyEuY29udGV4dCxcbiAgICAgICk7XG4gICAgICB0aGlzLl9wbGFjZWhvbGRlclJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICBwbGFjZWhvbGRlciA9IGdldFJvb3ROb2RlKHRoaXMuX3BsYWNlaG9sZGVyUmVmLCB0aGlzLl9kb2N1bWVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBsYWNlaG9sZGVyID0gZGVlcENsb25lTm9kZSh0aGlzLl9yb290RWxlbWVudCk7XG4gICAgfVxuXG4gICAgLy8gU3RvcCBwb2ludGVyIGV2ZW50cyBvbiB0aGUgcHJldmlldyBzbyB0aGUgdXNlciBjYW4ndFxuICAgIC8vIGludGVyYWN0IHdpdGggaXQgd2hpbGUgdGhlIHByZXZpZXcgaXMgYW5pbWF0aW5nLlxuICAgIHBsYWNlaG9sZGVyLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XG4gICAgcGxhY2Vob2xkZXIuY2xhc3NMaXN0LmFkZCgnY2RrLWRyYWctcGxhY2Vob2xkZXInKTtcbiAgICByZXR1cm4gcGxhY2Vob2xkZXI7XG4gIH1cblxuICAvKipcbiAgICogRmlndXJlcyBvdXQgdGhlIGNvb3JkaW5hdGVzIGF0IHdoaWNoIGFuIGVsZW1lbnQgd2FzIHBpY2tlZCB1cC5cbiAgICogQHBhcmFtIHJlZmVyZW5jZUVsZW1lbnQgRWxlbWVudCB0aGF0IGluaXRpYXRlZCB0aGUgZHJhZ2dpbmcuXG4gICAqIEBwYXJhbSBldmVudCBFdmVudCB0aGF0IGluaXRpYXRlZCB0aGUgZHJhZ2dpbmcuXG4gICAqL1xuICBwcml2YXRlIF9nZXRQb2ludGVyUG9zaXRpb25JbkVsZW1lbnQoXG4gICAgZWxlbWVudFJlY3Q6IENsaWVudFJlY3QsXG4gICAgcmVmZXJlbmNlRWxlbWVudDogSFRNTEVsZW1lbnQsXG4gICAgZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50LFxuICApOiBQb2ludCB7XG4gICAgY29uc3QgaGFuZGxlRWxlbWVudCA9IHJlZmVyZW5jZUVsZW1lbnQgPT09IHRoaXMuX3Jvb3RFbGVtZW50ID8gbnVsbCA6IHJlZmVyZW5jZUVsZW1lbnQ7XG4gICAgY29uc3QgcmVmZXJlbmNlUmVjdCA9IGhhbmRsZUVsZW1lbnQgPyBoYW5kbGVFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpIDogZWxlbWVudFJlY3Q7XG4gICAgY29uc3QgcG9pbnQgPSBpc1RvdWNoRXZlbnQoZXZlbnQpID8gZXZlbnQudGFyZ2V0VG91Y2hlc1swXSA6IGV2ZW50O1xuICAgIGNvbnN0IHNjcm9sbFBvc2l0aW9uID0gdGhpcy5fZ2V0Vmlld3BvcnRTY3JvbGxQb3NpdGlvbigpO1xuICAgIGNvbnN0IHggPSBwb2ludC5wYWdlWCAtIHJlZmVyZW5jZVJlY3QubGVmdCAtIHNjcm9sbFBvc2l0aW9uLmxlZnQ7XG4gICAgY29uc3QgeSA9IHBvaW50LnBhZ2VZIC0gcmVmZXJlbmNlUmVjdC50b3AgLSBzY3JvbGxQb3NpdGlvbi50b3A7XG5cbiAgICByZXR1cm4ge1xuICAgICAgeDogcmVmZXJlbmNlUmVjdC5sZWZ0IC0gZWxlbWVudFJlY3QubGVmdCArIHgsXG4gICAgICB5OiByZWZlcmVuY2VSZWN0LnRvcCAtIGVsZW1lbnRSZWN0LnRvcCArIHksXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBEZXRlcm1pbmVzIHRoZSBwb2ludCBvZiB0aGUgcGFnZSB0aGF0IHdhcyB0b3VjaGVkIGJ5IHRoZSB1c2VyLiAqL1xuICBwcml2YXRlIF9nZXRQb2ludGVyUG9zaXRpb25PblBhZ2UoZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KTogUG9pbnQge1xuICAgIGNvbnN0IHNjcm9sbFBvc2l0aW9uID0gdGhpcy5fZ2V0Vmlld3BvcnRTY3JvbGxQb3NpdGlvbigpO1xuICAgIGNvbnN0IHBvaW50ID0gaXNUb3VjaEV2ZW50KGV2ZW50KVxuICAgICAgPyAvLyBgdG91Y2hlc2Agd2lsbCBiZSBlbXB0eSBmb3Igc3RhcnQvZW5kIGV2ZW50cyBzbyB3ZSBoYXZlIHRvIGZhbGwgYmFjayB0byBgY2hhbmdlZFRvdWNoZXNgLlxuICAgICAgICAvLyBBbHNvIG5vdGUgdGhhdCBvbiByZWFsIGRldmljZXMgd2UncmUgZ3VhcmFudGVlZCBmb3IgZWl0aGVyIGB0b3VjaGVzYCBvciBgY2hhbmdlZFRvdWNoZXNgXG4gICAgICAgIC8vIHRvIGhhdmUgYSB2YWx1ZSwgYnV0IEZpcmVmb3ggaW4gZGV2aWNlIGVtdWxhdGlvbiBtb2RlIGhhcyBhIGJ1ZyB3aGVyZSBib3RoIGNhbiBiZSBlbXB0eVxuICAgICAgICAvLyBmb3IgYHRvdWNoc3RhcnRgIGFuZCBgdG91Y2hlbmRgIHNvIHdlIGZhbGwgYmFjayB0byBhIGR1bW15IG9iamVjdCBpbiBvcmRlciB0byBhdm9pZFxuICAgICAgICAvLyB0aHJvd2luZyBhbiBlcnJvci4gVGhlIHZhbHVlIHJldHVybmVkIGhlcmUgd2lsbCBiZSBpbmNvcnJlY3QsIGJ1dCBzaW5jZSB0aGlzIG9ubHlcbiAgICAgICAgLy8gYnJlYWtzIGluc2lkZSBhIGRldmVsb3BlciB0b29sIGFuZCB0aGUgdmFsdWUgaXMgb25seSB1c2VkIGZvciBzZWNvbmRhcnkgaW5mb3JtYXRpb24sXG4gICAgICAgIC8vIHdlIGNhbiBnZXQgYXdheSB3aXRoIGl0LiBTZWUgaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTYxNTgyNC5cbiAgICAgICAgZXZlbnQudG91Y2hlc1swXSB8fCBldmVudC5jaGFuZ2VkVG91Y2hlc1swXSB8fCB7cGFnZVg6IDAsIHBhZ2VZOiAwfVxuICAgICAgOiBldmVudDtcblxuICAgIGNvbnN0IHggPSBwb2ludC5wYWdlWCAtIHNjcm9sbFBvc2l0aW9uLmxlZnQ7XG4gICAgY29uc3QgeSA9IHBvaW50LnBhZ2VZIC0gc2Nyb2xsUG9zaXRpb24udG9wO1xuXG4gICAgLy8gaWYgZHJhZ2dpbmcgU1ZHIGVsZW1lbnQsIHRyeSB0byBjb252ZXJ0IGZyb20gdGhlIHNjcmVlbiBjb29yZGluYXRlIHN5c3RlbSB0byB0aGUgU1ZHXG4gICAgLy8gY29vcmRpbmF0ZSBzeXN0ZW1cbiAgICBpZiAodGhpcy5fb3duZXJTVkdFbGVtZW50KSB7XG4gICAgICBjb25zdCBzdmdNYXRyaXggPSB0aGlzLl9vd25lclNWR0VsZW1lbnQuZ2V0U2NyZWVuQ1RNKCk7XG4gICAgICBpZiAoc3ZnTWF0cml4KSB7XG4gICAgICAgIGNvbnN0IHN2Z1BvaW50ID0gdGhpcy5fb3duZXJTVkdFbGVtZW50LmNyZWF0ZVNWR1BvaW50KCk7XG4gICAgICAgIHN2Z1BvaW50LnggPSB4O1xuICAgICAgICBzdmdQb2ludC55ID0geTtcbiAgICAgICAgcmV0dXJuIHN2Z1BvaW50Lm1hdHJpeFRyYW5zZm9ybShzdmdNYXRyaXguaW52ZXJzZSgpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge3gsIHl9O1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIHBvaW50ZXIgcG9zaXRpb24gb24gdGhlIHBhZ2UsIGFjY291bnRpbmcgZm9yIGFueSBwb3NpdGlvbiBjb25zdHJhaW50cy4gKi9cbiAgcHJpdmF0ZSBfZ2V0Q29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24ocG9pbnQ6IFBvaW50KTogUG9pbnQge1xuICAgIGNvbnN0IGRyb3BDb250YWluZXJMb2NrID0gdGhpcy5fZHJvcENvbnRhaW5lciA/IHRoaXMuX2Ryb3BDb250YWluZXIubG9ja0F4aXMgOiBudWxsO1xuICAgIGxldCB7eCwgeX0gPSB0aGlzLmNvbnN0cmFpblBvc2l0aW9uXG4gICAgICA/IHRoaXMuY29uc3RyYWluUG9zaXRpb24ocG9pbnQsIHRoaXMsIHRoaXMuX2luaXRpYWxDbGllbnRSZWN0ISlcbiAgICAgIDogcG9pbnQ7XG5cbiAgICBpZiAodGhpcy5sb2NrQXhpcyA9PT0gJ3gnIHx8IGRyb3BDb250YWluZXJMb2NrID09PSAneCcpIHtcbiAgICAgIHkgPSB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZS55O1xuICAgIH0gZWxzZSBpZiAodGhpcy5sb2NrQXhpcyA9PT0gJ3knIHx8IGRyb3BDb250YWluZXJMb2NrID09PSAneScpIHtcbiAgICAgIHggPSB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZS54O1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ib3VuZGFyeVJlY3QpIHtcbiAgICAgIGNvbnN0IHt4OiBwaWNrdXBYLCB5OiBwaWNrdXBZfSA9IHRoaXMuX3BpY2t1cFBvc2l0aW9uSW5FbGVtZW50O1xuICAgICAgY29uc3QgYm91bmRhcnlSZWN0ID0gdGhpcy5fYm91bmRhcnlSZWN0O1xuICAgICAgY29uc3Qge3dpZHRoOiBwcmV2aWV3V2lkdGgsIGhlaWdodDogcHJldmlld0hlaWdodH0gPSB0aGlzLl9nZXRQcmV2aWV3UmVjdCgpO1xuICAgICAgY29uc3QgbWluWSA9IGJvdW5kYXJ5UmVjdC50b3AgKyBwaWNrdXBZO1xuICAgICAgY29uc3QgbWF4WSA9IGJvdW5kYXJ5UmVjdC5ib3R0b20gLSAocHJldmlld0hlaWdodCAtIHBpY2t1cFkpO1xuICAgICAgY29uc3QgbWluWCA9IGJvdW5kYXJ5UmVjdC5sZWZ0ICsgcGlja3VwWDtcbiAgICAgIGNvbnN0IG1heFggPSBib3VuZGFyeVJlY3QucmlnaHQgLSAocHJldmlld1dpZHRoIC0gcGlja3VwWCk7XG5cbiAgICAgIHggPSBjbGFtcCh4LCBtaW5YLCBtYXhYKTtcbiAgICAgIHkgPSBjbGFtcCh5LCBtaW5ZLCBtYXhZKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge3gsIHl9O1xuICB9XG5cbiAgLyoqIFVwZGF0ZXMgdGhlIGN1cnJlbnQgZHJhZyBkZWx0YSwgYmFzZWQgb24gdGhlIHVzZXIncyBjdXJyZW50IHBvaW50ZXIgcG9zaXRpb24gb24gdGhlIHBhZ2UuICovXG4gIHByaXZhdGUgX3VwZGF0ZVBvaW50ZXJEaXJlY3Rpb25EZWx0YShwb2ludGVyUG9zaXRpb25PblBhZ2U6IFBvaW50KSB7XG4gICAgY29uc3Qge3gsIHl9ID0gcG9pbnRlclBvc2l0aW9uT25QYWdlO1xuICAgIGNvbnN0IGRlbHRhID0gdGhpcy5fcG9pbnRlckRpcmVjdGlvbkRlbHRhO1xuICAgIGNvbnN0IHBvc2l0aW9uU2luY2VMYXN0Q2hhbmdlID0gdGhpcy5fcG9pbnRlclBvc2l0aW9uQXRMYXN0RGlyZWN0aW9uQ2hhbmdlO1xuXG4gICAgLy8gQW1vdW50IG9mIHBpeGVscyB0aGUgdXNlciBoYXMgZHJhZ2dlZCBzaW5jZSB0aGUgbGFzdCB0aW1lIHRoZSBkaXJlY3Rpb24gY2hhbmdlZC5cbiAgICBjb25zdCBjaGFuZ2VYID0gTWF0aC5hYnMoeCAtIHBvc2l0aW9uU2luY2VMYXN0Q2hhbmdlLngpO1xuICAgIGNvbnN0IGNoYW5nZVkgPSBNYXRoLmFicyh5IC0gcG9zaXRpb25TaW5jZUxhc3RDaGFuZ2UueSk7XG5cbiAgICAvLyBCZWNhdXNlIHdlIGhhbmRsZSBwb2ludGVyIGV2ZW50cyBvbiBhIHBlci1waXhlbCBiYXNpcywgd2UgZG9uJ3Qgd2FudCB0aGUgZGVsdGFcbiAgICAvLyB0byBjaGFuZ2UgZm9yIGV2ZXJ5IHBpeGVsLCBvdGhlcndpc2UgYW55dGhpbmcgdGhhdCBkZXBlbmRzIG9uIGl0IGNhbiBsb29rIGVycmF0aWMuXG4gICAgLy8gVG8gbWFrZSB0aGUgZGVsdGEgbW9yZSBjb25zaXN0ZW50LCB3ZSB0cmFjayBob3cgbXVjaCB0aGUgdXNlciBoYXMgbW92ZWQgc2luY2UgdGhlIGxhc3RcbiAgICAvLyBkZWx0YSBjaGFuZ2UgYW5kIHdlIG9ubHkgdXBkYXRlIGl0IGFmdGVyIGl0IGhhcyByZWFjaGVkIGEgY2VydGFpbiB0aHJlc2hvbGQuXG4gICAgaWYgKGNoYW5nZVggPiB0aGlzLl9jb25maWcucG9pbnRlckRpcmVjdGlvbkNoYW5nZVRocmVzaG9sZCkge1xuICAgICAgZGVsdGEueCA9IHggPiBwb3NpdGlvblNpbmNlTGFzdENoYW5nZS54ID8gMSA6IC0xO1xuICAgICAgcG9zaXRpb25TaW5jZUxhc3RDaGFuZ2UueCA9IHg7XG4gICAgfVxuXG4gICAgaWYgKGNoYW5nZVkgPiB0aGlzLl9jb25maWcucG9pbnRlckRpcmVjdGlvbkNoYW5nZVRocmVzaG9sZCkge1xuICAgICAgZGVsdGEueSA9IHkgPiBwb3NpdGlvblNpbmNlTGFzdENoYW5nZS55ID8gMSA6IC0xO1xuICAgICAgcG9zaXRpb25TaW5jZUxhc3RDaGFuZ2UueSA9IHk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlbHRhO1xuICB9XG5cbiAgLyoqIFRvZ2dsZXMgdGhlIG5hdGl2ZSBkcmFnIGludGVyYWN0aW9ucywgYmFzZWQgb24gaG93IG1hbnkgaGFuZGxlcyBhcmUgcmVnaXN0ZXJlZC4gKi9cbiAgcHJpdmF0ZSBfdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucygpIHtcbiAgICBpZiAoIXRoaXMuX3Jvb3RFbGVtZW50IHx8ICF0aGlzLl9oYW5kbGVzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc2hvdWxkRW5hYmxlID0gdGhpcy5faGFuZGxlcy5sZW5ndGggPiAwIHx8ICF0aGlzLmlzRHJhZ2dpbmcoKTtcblxuICAgIGlmIChzaG91bGRFbmFibGUgIT09IHRoaXMuX25hdGl2ZUludGVyYWN0aW9uc0VuYWJsZWQpIHtcbiAgICAgIHRoaXMuX25hdGl2ZUludGVyYWN0aW9uc0VuYWJsZWQgPSBzaG91bGRFbmFibGU7XG4gICAgICB0b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKHRoaXMuX3Jvb3RFbGVtZW50LCBzaG91bGRFbmFibGUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSZW1vdmVzIHRoZSBtYW51YWxseS1hZGRlZCBldmVudCBsaXN0ZW5lcnMgZnJvbSB0aGUgcm9vdCBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9yZW1vdmVSb290RWxlbWVudExpc3RlbmVycyhlbGVtZW50OiBIVE1MRWxlbWVudCkge1xuICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fcG9pbnRlckRvd24sIGFjdGl2ZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9wb2ludGVyRG93biwgcGFzc2l2ZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2RyYWdzdGFydCcsIHRoaXMuX25hdGl2ZURyYWdTdGFydCwgYWN0aXZlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgYSBgdHJhbnNmb3JtYCB0byB0aGUgcm9vdCBlbGVtZW50LCB0YWtpbmcgaW50byBhY2NvdW50IGFueSBleGlzdGluZyB0cmFuc2Zvcm1zIG9uIGl0LlxuICAgKiBAcGFyYW0geCBOZXcgdHJhbnNmb3JtIHZhbHVlIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSB5IE5ldyB0cmFuc2Zvcm0gdmFsdWUgYWxvbmcgdGhlIFkgYXhpcy5cbiAgICovXG4gIHByaXZhdGUgX2FwcGx5Um9vdEVsZW1lbnRUcmFuc2Zvcm0oeDogbnVtYmVyLCB5OiBudW1iZXIpIHtcbiAgICBjb25zdCB0cmFuc2Zvcm0gPSBnZXRUcmFuc2Zvcm0oeCwgeSk7XG4gICAgY29uc3Qgc3R5bGVzID0gdGhpcy5fcm9vdEVsZW1lbnQuc3R5bGU7XG5cbiAgICAvLyBDYWNoZSB0aGUgcHJldmlvdXMgdHJhbnNmb3JtIGFtb3VudCBvbmx5IGFmdGVyIHRoZSBmaXJzdCBkcmFnIHNlcXVlbmNlLCBiZWNhdXNlXG4gICAgLy8gd2UgZG9uJ3Qgd2FudCBvdXIgb3duIHRyYW5zZm9ybXMgdG8gc3RhY2sgb24gdG9wIG9mIGVhY2ggb3RoZXIuXG4gICAgLy8gU2hvdWxkIGJlIGV4Y2x1ZGVkIG5vbmUgYmVjYXVzZSBub25lICsgdHJhbnNsYXRlM2QoeCwgeSwgeCkgaXMgaW52YWxpZCBjc3NcbiAgICBpZiAodGhpcy5faW5pdGlhbFRyYW5zZm9ybSA9PSBudWxsKSB7XG4gICAgICB0aGlzLl9pbml0aWFsVHJhbnNmb3JtID1cbiAgICAgICAgc3R5bGVzLnRyYW5zZm9ybSAmJiBzdHlsZXMudHJhbnNmb3JtICE9ICdub25lJyA/IHN0eWxlcy50cmFuc2Zvcm0gOiAnJztcbiAgICB9XG5cbiAgICAvLyBQcmVzZXJ2ZSB0aGUgcHJldmlvdXMgYHRyYW5zZm9ybWAgdmFsdWUsIGlmIHRoZXJlIHdhcyBvbmUuIE5vdGUgdGhhdCB3ZSBhcHBseSBvdXIgb3duXG4gICAgLy8gdHJhbnNmb3JtIGJlZm9yZSB0aGUgdXNlcidzLCBiZWNhdXNlIHRoaW5ncyBsaWtlIHJvdGF0aW9uIGNhbiBhZmZlY3Qgd2hpY2ggZGlyZWN0aW9uXG4gICAgLy8gdGhlIGVsZW1lbnQgd2lsbCBiZSB0cmFuc2xhdGVkIHRvd2FyZHMuXG4gICAgc3R5bGVzLnRyYW5zZm9ybSA9IGNvbWJpbmVUcmFuc2Zvcm1zKHRyYW5zZm9ybSwgdGhpcy5faW5pdGlhbFRyYW5zZm9ybSk7XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyBhIGB0cmFuc2Zvcm1gIHRvIHRoZSBwcmV2aWV3LCB0YWtpbmcgaW50byBhY2NvdW50IGFueSBleGlzdGluZyB0cmFuc2Zvcm1zIG9uIGl0LlxuICAgKiBAcGFyYW0geCBOZXcgdHJhbnNmb3JtIHZhbHVlIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSB5IE5ldyB0cmFuc2Zvcm0gdmFsdWUgYWxvbmcgdGhlIFkgYXhpcy5cbiAgICovXG4gIHByaXZhdGUgX2FwcGx5UHJldmlld1RyYW5zZm9ybSh4OiBudW1iZXIsIHk6IG51bWJlcikge1xuICAgIC8vIE9ubHkgYXBwbHkgdGhlIGluaXRpYWwgdHJhbnNmb3JtIGlmIHRoZSBwcmV2aWV3IGlzIGEgY2xvbmUgb2YgdGhlIG9yaWdpbmFsIGVsZW1lbnQsIG90aGVyd2lzZVxuICAgIC8vIGl0IGNvdWxkIGJlIGNvbXBsZXRlbHkgZGlmZmVyZW50IGFuZCB0aGUgdHJhbnNmb3JtIG1pZ2h0IG5vdCBtYWtlIHNlbnNlIGFueW1vcmUuXG4gICAgY29uc3QgaW5pdGlhbFRyYW5zZm9ybSA9IHRoaXMuX3ByZXZpZXdUZW1wbGF0ZT8udGVtcGxhdGUgPyB1bmRlZmluZWQgOiB0aGlzLl9pbml0aWFsVHJhbnNmb3JtO1xuICAgIGNvbnN0IHRyYW5zZm9ybSA9IGdldFRyYW5zZm9ybSh4LCB5KTtcbiAgICB0aGlzLl9wcmV2aWV3LnN0eWxlLnRyYW5zZm9ybSA9IGNvbWJpbmVUcmFuc2Zvcm1zKHRyYW5zZm9ybSwgaW5pdGlhbFRyYW5zZm9ybSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZGlzdGFuY2UgdGhhdCB0aGUgdXNlciBoYXMgZHJhZ2dlZCBkdXJpbmcgdGhlIGN1cnJlbnQgZHJhZyBzZXF1ZW5jZS5cbiAgICogQHBhcmFtIGN1cnJlbnRQb3NpdGlvbiBDdXJyZW50IHBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlci5cbiAgICovXG4gIHByaXZhdGUgX2dldERyYWdEaXN0YW5jZShjdXJyZW50UG9zaXRpb246IFBvaW50KTogUG9pbnQge1xuICAgIGNvbnN0IHBpY2t1cFBvc2l0aW9uID0gdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2U7XG5cbiAgICBpZiAocGlja3VwUG9zaXRpb24pIHtcbiAgICAgIHJldHVybiB7eDogY3VycmVudFBvc2l0aW9uLnggLSBwaWNrdXBQb3NpdGlvbi54LCB5OiBjdXJyZW50UG9zaXRpb24ueSAtIHBpY2t1cFBvc2l0aW9uLnl9O1xuICAgIH1cblxuICAgIHJldHVybiB7eDogMCwgeTogMH07XG4gIH1cblxuICAvKiogQ2xlYW5zIHVwIGFueSBjYWNoZWQgZWxlbWVudCBkaW1lbnNpb25zIHRoYXQgd2UgZG9uJ3QgbmVlZCBhZnRlciBkcmFnZ2luZyBoYXMgc3RvcHBlZC4gKi9cbiAgcHJpdmF0ZSBfY2xlYW51cENhY2hlZERpbWVuc2lvbnMoKSB7XG4gICAgdGhpcy5fYm91bmRhcnlSZWN0ID0gdGhpcy5fcHJldmlld1JlY3QgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLmNsZWFyKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGVsZW1lbnQgaXMgc3RpbGwgaW5zaWRlIGl0cyBib3VuZGFyeSBhZnRlciB0aGUgdmlld3BvcnQgaGFzIGJlZW4gcmVzaXplZC5cbiAgICogSWYgbm90LCB0aGUgcG9zaXRpb24gaXMgYWRqdXN0ZWQgc28gdGhhdCB0aGUgZWxlbWVudCBmaXRzIGFnYWluLlxuICAgKi9cbiAgcHJpdmF0ZSBfY29udGFpbkluc2lkZUJvdW5kYXJ5T25SZXNpemUoKSB7XG4gICAgbGV0IHt4LCB5fSA9IHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm07XG5cbiAgICBpZiAoKHggPT09IDAgJiYgeSA9PT0gMCkgfHwgdGhpcy5pc0RyYWdnaW5nKCkgfHwgIXRoaXMuX2JvdW5kYXJ5RWxlbWVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIE5vdGU6IGRvbid0IHVzZSBgX2NsaWVudFJlY3RBdFN0YXJ0YCBoZXJlLCBiZWNhdXNlIHdlIHdhbnQgdGhlIGxhdGVzdCBwb3NpdGlvbi5cbiAgICBjb25zdCBlbGVtZW50UmVjdCA9IHRoaXMuX3Jvb3RFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IGJvdW5kYXJ5UmVjdCA9IHRoaXMuX2JvdW5kYXJ5RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgIC8vIEl0J3MgcG9zc2libGUgdGhhdCB0aGUgZWxlbWVudCBnb3QgaGlkZGVuIGF3YXkgYWZ0ZXIgZHJhZ2dpbmcgKGUuZy4gYnkgc3dpdGNoaW5nIHRvIGFcbiAgICAvLyBkaWZmZXJlbnQgdGFiKS4gRG9uJ3QgZG8gYW55dGhpbmcgaW4gdGhpcyBjYXNlIHNvIHdlIGRvbid0IGNsZWFyIHRoZSB1c2VyJ3MgcG9zaXRpb24uXG4gICAgaWYgKFxuICAgICAgKGJvdW5kYXJ5UmVjdC53aWR0aCA9PT0gMCAmJiBib3VuZGFyeVJlY3QuaGVpZ2h0ID09PSAwKSB8fFxuICAgICAgKGVsZW1lbnRSZWN0LndpZHRoID09PSAwICYmIGVsZW1lbnRSZWN0LmhlaWdodCA9PT0gMClcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBsZWZ0T3ZlcmZsb3cgPSBib3VuZGFyeVJlY3QubGVmdCAtIGVsZW1lbnRSZWN0LmxlZnQ7XG4gICAgY29uc3QgcmlnaHRPdmVyZmxvdyA9IGVsZW1lbnRSZWN0LnJpZ2h0IC0gYm91bmRhcnlSZWN0LnJpZ2h0O1xuICAgIGNvbnN0IHRvcE92ZXJmbG93ID0gYm91bmRhcnlSZWN0LnRvcCAtIGVsZW1lbnRSZWN0LnRvcDtcbiAgICBjb25zdCBib3R0b21PdmVyZmxvdyA9IGVsZW1lbnRSZWN0LmJvdHRvbSAtIGJvdW5kYXJ5UmVjdC5ib3R0b207XG5cbiAgICAvLyBJZiB0aGUgZWxlbWVudCBoYXMgYmVjb21lIHdpZGVyIHRoYW4gdGhlIGJvdW5kYXJ5LCB3ZSBjYW4ndFxuICAgIC8vIGRvIG11Y2ggdG8gbWFrZSBpdCBmaXQgc28gd2UganVzdCBhbmNob3IgaXQgdG8gdGhlIGxlZnQuXG4gICAgaWYgKGJvdW5kYXJ5UmVjdC53aWR0aCA+IGVsZW1lbnRSZWN0LndpZHRoKSB7XG4gICAgICBpZiAobGVmdE92ZXJmbG93ID4gMCkge1xuICAgICAgICB4ICs9IGxlZnRPdmVyZmxvdztcbiAgICAgIH1cblxuICAgICAgaWYgKHJpZ2h0T3ZlcmZsb3cgPiAwKSB7XG4gICAgICAgIHggLT0gcmlnaHRPdmVyZmxvdztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgeCA9IDA7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGVsZW1lbnQgaGFzIGJlY29tZSB0YWxsZXIgdGhhbiB0aGUgYm91bmRhcnksIHdlIGNhbid0XG4gICAgLy8gZG8gbXVjaCB0byBtYWtlIGl0IGZpdCBzbyB3ZSBqdXN0IGFuY2hvciBpdCB0byB0aGUgdG9wLlxuICAgIGlmIChib3VuZGFyeVJlY3QuaGVpZ2h0ID4gZWxlbWVudFJlY3QuaGVpZ2h0KSB7XG4gICAgICBpZiAodG9wT3ZlcmZsb3cgPiAwKSB7XG4gICAgICAgIHkgKz0gdG9wT3ZlcmZsb3c7XG4gICAgICB9XG5cbiAgICAgIGlmIChib3R0b21PdmVyZmxvdyA+IDApIHtcbiAgICAgICAgeSAtPSBib3R0b21PdmVyZmxvdztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgeSA9IDA7XG4gICAgfVxuXG4gICAgaWYgKHggIT09IHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm0ueCB8fCB5ICE9PSB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtLnkpIHtcbiAgICAgIHRoaXMuc2V0RnJlZURyYWdQb3NpdGlvbih7eSwgeH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBkcmFnIHN0YXJ0IGRlbGF5LCBiYXNlZCBvbiB0aGUgZXZlbnQgdHlwZS4gKi9cbiAgcHJpdmF0ZSBfZ2V0RHJhZ1N0YXJ0RGVsYXkoZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KTogbnVtYmVyIHtcbiAgICBjb25zdCB2YWx1ZSA9IHRoaXMuZHJhZ1N0YXJ0RGVsYXk7XG5cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH0gZWxzZSBpZiAoaXNUb3VjaEV2ZW50KGV2ZW50KSkge1xuICAgICAgcmV0dXJuIHZhbHVlLnRvdWNoO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZSA/IHZhbHVlLm1vdXNlIDogMDtcbiAgfVxuXG4gIC8qKiBVcGRhdGVzIHRoZSBpbnRlcm5hbCBzdGF0ZSBvZiB0aGUgZHJhZ2dhYmxlIGVsZW1lbnQgd2hlbiBzY3JvbGxpbmcgaGFzIG9jY3VycmVkLiAqL1xuICBwcml2YXRlIF91cGRhdGVPblNjcm9sbChldmVudDogRXZlbnQpIHtcbiAgICBjb25zdCBzY3JvbGxEaWZmZXJlbmNlID0gdGhpcy5fcGFyZW50UG9zaXRpb25zLmhhbmRsZVNjcm9sbChldmVudCk7XG5cbiAgICBpZiAoc2Nyb2xsRGlmZmVyZW5jZSkge1xuICAgICAgY29uc3QgdGFyZ2V0ID0gX2dldEV2ZW50VGFyZ2V0PEhUTUxFbGVtZW50IHwgRG9jdW1lbnQ+KGV2ZW50KSE7XG5cbiAgICAgIC8vIENsaWVudFJlY3QgZGltZW5zaW9ucyBhcmUgYmFzZWQgb24gdGhlIHNjcm9sbCBwb3NpdGlvbiBvZiB0aGUgcGFnZSBhbmQgaXRzIHBhcmVudFxuICAgICAgLy8gbm9kZSBzbyB3ZSBoYXZlIHRvIHVwZGF0ZSB0aGUgY2FjaGVkIGJvdW5kYXJ5IENsaWVudFJlY3QgaWYgdGhlIHVzZXIgaGFzIHNjcm9sbGVkLlxuICAgICAgaWYgKFxuICAgICAgICB0aGlzLl9ib3VuZGFyeVJlY3QgJiZcbiAgICAgICAgdGFyZ2V0ICE9PSB0aGlzLl9ib3VuZGFyeUVsZW1lbnQgJiZcbiAgICAgICAgdGFyZ2V0LmNvbnRhaW5zKHRoaXMuX2JvdW5kYXJ5RWxlbWVudClcbiAgICAgICkge1xuICAgICAgICBhZGp1c3RDbGllbnRSZWN0KHRoaXMuX2JvdW5kYXJ5UmVjdCwgc2Nyb2xsRGlmZmVyZW5jZS50b3AsIHNjcm9sbERpZmZlcmVuY2UubGVmdCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLnggKz0gc2Nyb2xsRGlmZmVyZW5jZS5sZWZ0O1xuICAgICAgdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UueSArPSBzY3JvbGxEaWZmZXJlbmNlLnRvcDtcblxuICAgICAgLy8gSWYgd2UncmUgaW4gZnJlZSBkcmFnIG1vZGUsIHdlIGhhdmUgdG8gdXBkYXRlIHRoZSBhY3RpdmUgdHJhbnNmb3JtLCBiZWNhdXNlXG4gICAgICAvLyBpdCBpc24ndCByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQgbGlrZSB0aGUgcHJldmlldyBpbnNpZGUgYSBkcm9wIGxpc3QuXG4gICAgICBpZiAoIXRoaXMuX2Ryb3BDb250YWluZXIpIHtcbiAgICAgICAgdGhpcy5fYWN0aXZlVHJhbnNmb3JtLnggLT0gc2Nyb2xsRGlmZmVyZW5jZS5sZWZ0O1xuICAgICAgICB0aGlzLl9hY3RpdmVUcmFuc2Zvcm0ueSAtPSBzY3JvbGxEaWZmZXJlbmNlLnRvcDtcbiAgICAgICAgdGhpcy5fYXBwbHlSb290RWxlbWVudFRyYW5zZm9ybSh0aGlzLl9hY3RpdmVUcmFuc2Zvcm0ueCwgdGhpcy5fYWN0aXZlVHJhbnNmb3JtLnkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBzY3JvbGwgcG9zaXRpb24gb2YgdGhlIHZpZXdwb3J0LiAqL1xuICBwcml2YXRlIF9nZXRWaWV3cG9ydFNjcm9sbFBvc2l0aW9uKCkge1xuICAgIHJldHVybiAoXG4gICAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMucG9zaXRpb25zLmdldCh0aGlzLl9kb2N1bWVudCk/LnNjcm9sbFBvc2l0aW9uIHx8XG4gICAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuZ2V0Vmlld3BvcnRTY3JvbGxQb3NpdGlvbigpXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMYXppbHkgcmVzb2x2ZXMgYW5kIHJldHVybnMgdGhlIHNoYWRvdyByb290IG9mIHRoZSBlbGVtZW50LiBXZSBkbyB0aGlzIGluIGEgZnVuY3Rpb24sIHJhdGhlclxuICAgKiB0aGFuIHNhdmluZyBpdCBpbiBwcm9wZXJ0eSBkaXJlY3RseSBvbiBpbml0LCBiZWNhdXNlIHdlIHdhbnQgdG8gcmVzb2x2ZSBpdCBhcyBsYXRlIGFzIHBvc3NpYmxlXG4gICAqIGluIG9yZGVyIHRvIGVuc3VyZSB0aGF0IHRoZSBlbGVtZW50IGhhcyBiZWVuIG1vdmVkIGludG8gdGhlIHNoYWRvdyBET00uIERvaW5nIGl0IGluc2lkZSB0aGVcbiAgICogY29uc3RydWN0b3IgbWlnaHQgYmUgdG9vIGVhcmx5IGlmIHRoZSBlbGVtZW50IGlzIGluc2lkZSBvZiBzb21ldGhpbmcgbGlrZSBgbmdGb3JgIG9yIGBuZ0lmYC5cbiAgICovXG4gIHByaXZhdGUgX2dldFNoYWRvd1Jvb3QoKTogU2hhZG93Um9vdCB8IG51bGwge1xuICAgIGlmICh0aGlzLl9jYWNoZWRTaGFkb3dSb290ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuX2NhY2hlZFNoYWRvd1Jvb3QgPSBfZ2V0U2hhZG93Um9vdCh0aGlzLl9yb290RWxlbWVudCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX2NhY2hlZFNoYWRvd1Jvb3Q7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgZWxlbWVudCBpbnRvIHdoaWNoIHRoZSBkcmFnIHByZXZpZXcgc2hvdWxkIGJlIGluc2VydGVkLiAqL1xuICBwcml2YXRlIF9nZXRQcmV2aWV3SW5zZXJ0aW9uUG9pbnQoXG4gICAgaW5pdGlhbFBhcmVudDogSFRNTEVsZW1lbnQsXG4gICAgc2hhZG93Um9vdDogU2hhZG93Um9vdCB8IG51bGwsXG4gICk6IEhUTUxFbGVtZW50IHtcbiAgICBjb25zdCBwcmV2aWV3Q29udGFpbmVyID0gdGhpcy5fcHJldmlld0NvbnRhaW5lciB8fCAnZ2xvYmFsJztcblxuICAgIGlmIChwcmV2aWV3Q29udGFpbmVyID09PSAncGFyZW50Jykge1xuICAgICAgcmV0dXJuIGluaXRpYWxQYXJlbnQ7XG4gICAgfVxuXG4gICAgaWYgKHByZXZpZXdDb250YWluZXIgPT09ICdnbG9iYWwnKSB7XG4gICAgICBjb25zdCBkb2N1bWVudFJlZiA9IHRoaXMuX2RvY3VtZW50O1xuXG4gICAgICAvLyBXZSBjYW4ndCB1c2UgdGhlIGJvZHkgaWYgdGhlIHVzZXIgaXMgaW4gZnVsbHNjcmVlbiBtb2RlLFxuICAgICAgLy8gYmVjYXVzZSB0aGUgcHJldmlldyB3aWxsIHJlbmRlciB1bmRlciB0aGUgZnVsbHNjcmVlbiBlbGVtZW50LlxuICAgICAgLy8gVE9ETyhjcmlzYmV0byk6IGRlZHVwZSB0aGlzIHdpdGggdGhlIGBGdWxsc2NyZWVuT3ZlcmxheUNvbnRhaW5lcmAgZXZlbnR1YWxseS5cbiAgICAgIHJldHVybiAoXG4gICAgICAgIHNoYWRvd1Jvb3QgfHxcbiAgICAgICAgZG9jdW1lbnRSZWYuZnVsbHNjcmVlbkVsZW1lbnQgfHxcbiAgICAgICAgKGRvY3VtZW50UmVmIGFzIGFueSkud2Via2l0RnVsbHNjcmVlbkVsZW1lbnQgfHxcbiAgICAgICAgKGRvY3VtZW50UmVmIGFzIGFueSkubW96RnVsbFNjcmVlbkVsZW1lbnQgfHxcbiAgICAgICAgKGRvY3VtZW50UmVmIGFzIGFueSkubXNGdWxsc2NyZWVuRWxlbWVudCB8fFxuICAgICAgICBkb2N1bWVudFJlZi5ib2R5XG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBjb2VyY2VFbGVtZW50KHByZXZpZXdDb250YWluZXIpO1xuICB9XG5cbiAgLyoqIExhemlseSByZXNvbHZlcyBhbmQgcmV0dXJucyB0aGUgZGltZW5zaW9ucyBvZiB0aGUgcHJldmlldy4gKi9cbiAgcHJpdmF0ZSBfZ2V0UHJldmlld1JlY3QoKTogQ2xpZW50UmVjdCB7XG4gICAgLy8gQ2FjaGUgdGhlIHByZXZpZXcgZWxlbWVudCByZWN0IGlmIHdlIGhhdmVuJ3QgY2FjaGVkIGl0IGFscmVhZHkgb3IgaWZcbiAgICAvLyB3ZSBjYWNoZWQgaXQgdG9vIGVhcmx5IGJlZm9yZSB0aGUgZWxlbWVudCBkaW1lbnNpb25zIHdlcmUgY29tcHV0ZWQuXG4gICAgaWYgKCF0aGlzLl9wcmV2aWV3UmVjdCB8fCAoIXRoaXMuX3ByZXZpZXdSZWN0LndpZHRoICYmICF0aGlzLl9wcmV2aWV3UmVjdC5oZWlnaHQpKSB7XG4gICAgICB0aGlzLl9wcmV2aWV3UmVjdCA9IHRoaXMuX3ByZXZpZXdcbiAgICAgICAgPyB0aGlzLl9wcmV2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgIDogdGhpcy5faW5pdGlhbENsaWVudFJlY3QhO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9wcmV2aWV3UmVjdDtcbiAgfVxuXG4gIC8qKiBIYW5kbGVzIGEgbmF0aXZlIGBkcmFnc3RhcnRgIGV2ZW50LiAqL1xuICBwcml2YXRlIF9uYXRpdmVEcmFnU3RhcnQgPSAoZXZlbnQ6IERyYWdFdmVudCkgPT4ge1xuICAgIGlmICh0aGlzLl9oYW5kbGVzLmxlbmd0aCkge1xuICAgICAgY29uc3QgdGFyZ2V0SGFuZGxlID0gdGhpcy5fZ2V0VGFyZ2V0SGFuZGxlKGV2ZW50KTtcblxuICAgICAgaWYgKHRhcmdldEhhbmRsZSAmJiAhdGhpcy5fZGlzYWJsZWRIYW5kbGVzLmhhcyh0YXJnZXRIYW5kbGUpICYmICF0aGlzLmRpc2FibGVkKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICghdGhpcy5kaXNhYmxlZCkge1xuICAgICAgLy8gVXN1YWxseSB0aGlzIGlzbid0IG5lY2Vzc2FyeSBzaW5jZSB0aGUgd2UgcHJldmVudCB0aGUgZGVmYXVsdCBhY3Rpb24gaW4gYHBvaW50ZXJEb3duYCxcbiAgICAgIC8vIGJ1dCBzb21lIGNhc2VzIGxpa2UgZHJhZ2dpbmcgb2YgbGlua3MgY2FuIHNsaXAgdGhyb3VnaCAoc2VlICMyNDQwMykuXG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cbiAgfTtcblxuICAvKiogR2V0cyBhIGhhbmRsZSB0aGF0IGlzIHRoZSB0YXJnZXQgb2YgYW4gZXZlbnQuICovXG4gIHByaXZhdGUgX2dldFRhcmdldEhhbmRsZShldmVudDogRXZlbnQpOiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX2hhbmRsZXMuZmluZChoYW5kbGUgPT4ge1xuICAgICAgcmV0dXJuIGV2ZW50LnRhcmdldCAmJiAoZXZlbnQudGFyZ2V0ID09PSBoYW5kbGUgfHwgaGFuZGxlLmNvbnRhaW5zKGV2ZW50LnRhcmdldCBhcyBOb2RlKSk7XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIGEgM2QgYHRyYW5zZm9ybWAgdGhhdCBjYW4gYmUgYXBwbGllZCB0byBhbiBlbGVtZW50LlxuICogQHBhcmFtIHggRGVzaXJlZCBwb3NpdGlvbiBvZiB0aGUgZWxlbWVudCBhbG9uZyB0aGUgWCBheGlzLlxuICogQHBhcmFtIHkgRGVzaXJlZCBwb3NpdGlvbiBvZiB0aGUgZWxlbWVudCBhbG9uZyB0aGUgWSBheGlzLlxuICovXG5mdW5jdGlvbiBnZXRUcmFuc2Zvcm0oeDogbnVtYmVyLCB5OiBudW1iZXIpOiBzdHJpbmcge1xuICAvLyBSb3VuZCB0aGUgdHJhbnNmb3JtcyBzaW5jZSBzb21lIGJyb3dzZXJzIHdpbGxcbiAgLy8gYmx1ciB0aGUgZWxlbWVudHMgZm9yIHN1Yi1waXhlbCB0cmFuc2Zvcm1zLlxuICByZXR1cm4gYHRyYW5zbGF0ZTNkKCR7TWF0aC5yb3VuZCh4KX1weCwgJHtNYXRoLnJvdW5kKHkpfXB4LCAwKWA7XG59XG5cbi8qKiBDbGFtcHMgYSB2YWx1ZSBiZXR3ZWVuIGEgbWluaW11bSBhbmQgYSBtYXhpbXVtLiAqL1xuZnVuY3Rpb24gY2xhbXAodmFsdWU6IG51bWJlciwgbWluOiBudW1iZXIsIG1heDogbnVtYmVyKSB7XG4gIHJldHVybiBNYXRoLm1heChtaW4sIE1hdGgubWluKG1heCwgdmFsdWUpKTtcbn1cblxuLyoqIERldGVybWluZXMgd2hldGhlciBhbiBldmVudCBpcyBhIHRvdWNoIGV2ZW50LiAqL1xuZnVuY3Rpb24gaXNUb3VjaEV2ZW50KGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCk6IGV2ZW50IGlzIFRvdWNoRXZlbnQge1xuICAvLyBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBmb3IgZXZlcnkgcGl4ZWwgdGhhdCB0aGUgdXNlciBoYXMgZHJhZ2dlZCBzbyB3ZSBuZWVkIGl0IHRvIGJlXG4gIC8vIGFzIGZhc3QgYXMgcG9zc2libGUuIFNpbmNlIHdlIG9ubHkgYmluZCBtb3VzZSBldmVudHMgYW5kIHRvdWNoIGV2ZW50cywgd2UgY2FuIGFzc3VtZVxuICAvLyB0aGF0IGlmIHRoZSBldmVudCdzIG5hbWUgc3RhcnRzIHdpdGggYHRgLCBpdCdzIGEgdG91Y2ggZXZlbnQuXG4gIHJldHVybiBldmVudC50eXBlWzBdID09PSAndCc7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgcm9vdCBIVE1MIGVsZW1lbnQgb2YgYW4gZW1iZWRkZWQgdmlldy5cbiAqIElmIHRoZSByb290IGlzIG5vdCBhbiBIVE1MIGVsZW1lbnQgaXQgZ2V0cyB3cmFwcGVkIGluIG9uZS5cbiAqL1xuZnVuY3Rpb24gZ2V0Um9vdE5vZGUodmlld1JlZjogRW1iZWRkZWRWaWV3UmVmPGFueT4sIF9kb2N1bWVudDogRG9jdW1lbnQpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IHJvb3ROb2RlczogTm9kZVtdID0gdmlld1JlZi5yb290Tm9kZXM7XG5cbiAgaWYgKHJvb3ROb2Rlcy5sZW5ndGggPT09IDEgJiYgcm9vdE5vZGVzWzBdLm5vZGVUeXBlID09PSBfZG9jdW1lbnQuRUxFTUVOVF9OT0RFKSB7XG4gICAgcmV0dXJuIHJvb3ROb2Rlc1swXSBhcyBIVE1MRWxlbWVudDtcbiAgfVxuXG4gIGNvbnN0IHdyYXBwZXIgPSBfZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHJvb3ROb2Rlcy5mb3JFYWNoKG5vZGUgPT4gd3JhcHBlci5hcHBlbmRDaGlsZChub2RlKSk7XG4gIHJldHVybiB3cmFwcGVyO1xufVxuXG4vKipcbiAqIE1hdGNoZXMgdGhlIHRhcmdldCBlbGVtZW50J3Mgc2l6ZSB0byB0aGUgc291cmNlJ3Mgc2l6ZS5cbiAqIEBwYXJhbSB0YXJnZXQgRWxlbWVudCB0aGF0IG5lZWRzIHRvIGJlIHJlc2l6ZWQuXG4gKiBAcGFyYW0gc291cmNlUmVjdCBEaW1lbnNpb25zIG9mIHRoZSBzb3VyY2UgZWxlbWVudC5cbiAqL1xuZnVuY3Rpb24gbWF0Y2hFbGVtZW50U2l6ZSh0YXJnZXQ6IEhUTUxFbGVtZW50LCBzb3VyY2VSZWN0OiBDbGllbnRSZWN0KTogdm9pZCB7XG4gIHRhcmdldC5zdHlsZS53aWR0aCA9IGAke3NvdXJjZVJlY3Qud2lkdGh9cHhgO1xuICB0YXJnZXQuc3R5bGUuaGVpZ2h0ID0gYCR7c291cmNlUmVjdC5oZWlnaHR9cHhgO1xuICB0YXJnZXQuc3R5bGUudHJhbnNmb3JtID0gZ2V0VHJhbnNmb3JtKHNvdXJjZVJlY3QubGVmdCwgc291cmNlUmVjdC50b3ApO1xufVxuIl19