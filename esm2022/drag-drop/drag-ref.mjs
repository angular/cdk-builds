/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { normalizePassiveListenerOptions, _getEventTarget, _getShadowRoot, } from '@angular/cdk/platform';
import { coerceElement } from '@angular/cdk/coercion';
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
    /** Whether starting to drag this element is disabled. */
    get disabled() {
        return this._disabled || !!(this._dropContainer && this._dropContainer.disabled);
    }
    set disabled(value) {
        if (value !== this._disabled) {
            this._disabled = value;
            this._toggleNativeDragInteractions();
            this._handles.forEach(handle => toggleNativeDragInteractions(handle, value));
        }
    }
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
                // direction. Note that this is preferable over doing something like `skip(minimumDistance)`
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
            container.drop(this, currentIndex, this._initialIndex, this._initialContainer, isPointerOverContainer, distance, pointerPosition, event);
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
            ? this.constrainPosition(point, this, this._initialClientRect, this._pickupPositionInElement)
            : point;
        if (this.lockAxis === 'x' || dropContainerLock === 'x') {
            y =
                this._pickupPositionOnPage.y -
                    (this.constrainPosition ? this._pickupPositionInElement.y : 0);
        }
        else if (this.lockAxis === 'y' || dropContainerLock === 'y') {
            x =
                this._pickupPositionOnPage.x -
                    (this.constrainPosition ? this._pickupPositionInElement.x : 0);
        }
        if (this._boundaryRect) {
            // If not using a custom constrain we need to account for the pickup position in the element
            // otherwise we do not need to do this, as it has already been accounted for
            const { x: pickupX, y: pickupY } = !this.constrainPosition
                ? this._pickupPositionInElement
                : { x: 0, y: 0 };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2RyYWctZHJvcC9kcmFnLXJlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFLSCxPQUFPLEVBQ0wsK0JBQStCLEVBQy9CLGVBQWUsRUFDZixjQUFjLEdBQ2YsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDcEQsT0FBTyxFQUFDLCtCQUErQixFQUFFLGdDQUFnQyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDcEcsT0FBTyxFQUFDLFlBQVksRUFBRSxPQUFPLEVBQWEsTUFBTSxNQUFNLENBQUM7QUFHdkQsT0FBTyxFQUNMLGlCQUFpQixFQUVqQixZQUFZLEVBQ1osNEJBQTRCLEVBQzVCLGdCQUFnQixHQUNqQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsa0NBQWtDLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUM3RSxPQUFPLEVBQUMsb0JBQW9CLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN6RSxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUNwRSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUF1Qi9DLGlFQUFpRTtBQUNqRSxNQUFNLDJCQUEyQixHQUFHLCtCQUErQixDQUFDLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7QUFFckYsaUVBQWlFO0FBQ2pFLE1BQU0sMEJBQTBCLEdBQUcsK0JBQStCLENBQUMsRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQztBQUVyRjs7Ozs7R0FLRztBQUNILE1BQU0sdUJBQXVCLEdBQUcsR0FBRyxDQUFDO0FBdUJwQyw4REFBOEQ7QUFDOUQsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLEdBQUcsQ0FB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LENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQztBQUMvQixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyxXQUFXLENBQUMsT0FBNkIsRUFBRSxTQUFtQjtJQUNyRSxNQUFNLFNBQVMsR0FBVyxPQUFPLENBQUMsU0FBUyxDQUFDO0lBRTVDLElBQUksU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsS0FBSyxTQUFTLENBQUMsWUFBWSxFQUFFO1FBQzlFLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBZ0IsQ0FBQztLQUNwQztJQUVELE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDL0MsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNyRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQVMsZ0JBQWdCLENBQUMsTUFBbUIsRUFBRSxVQUFzQjtJQUNuRSxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxHQUFHLFVBQVUsQ0FBQyxLQUFLLElBQUksQ0FBQztJQUM3QyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxHQUFHLFVBQVUsQ0FBQyxNQUFNLElBQUksQ0FBQztJQUMvQyxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxZQUFZLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDekUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0VtYmVkZGVkVmlld1JlZiwgRWxlbWVudFJlZiwgTmdab25lLCBWaWV3Q29udGFpbmVyUmVmLCBUZW1wbGF0ZVJlZn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1ZpZXdwb3J0UnVsZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9zY3JvbGxpbmcnO1xuaW1wb3J0IHtEaXJlY3Rpb259IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7XG4gIG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMsXG4gIF9nZXRFdmVudFRhcmdldCxcbiAgX2dldFNoYWRvd1Jvb3QsXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge2NvZXJjZUVsZW1lbnR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge2lzRmFrZU1vdXNlZG93bkZyb21TY3JlZW5SZWFkZXIsIGlzRmFrZVRvdWNoc3RhcnRGcm9tU2NyZWVuUmVhZGVyfSBmcm9tICdAYW5ndWxhci9jZGsvYTExeSc7XG5pbXBvcnQge1N1YnNjcmlwdGlvbiwgU3ViamVjdCwgT2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XG5pbXBvcnQgdHlwZSB7RHJvcExpc3RSZWZ9IGZyb20gJy4vZHJvcC1saXN0LXJlZic7XG5pbXBvcnQge0RyYWdEcm9wUmVnaXN0cnl9IGZyb20gJy4vZHJhZy1kcm9wLXJlZ2lzdHJ5JztcbmltcG9ydCB7XG4gIGNvbWJpbmVUcmFuc2Zvcm1zLFxuICBEcmFnQ1NTU3R5bGVEZWNsYXJhdGlvbixcbiAgZXh0ZW5kU3R5bGVzLFxuICB0b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zLFxuICB0b2dnbGVWaXNpYmlsaXR5LFxufSBmcm9tICcuL2RvbS9zdHlsaW5nJztcbmltcG9ydCB7Z2V0VHJhbnNmb3JtVHJhbnNpdGlvbkR1cmF0aW9uSW5Nc30gZnJvbSAnLi9kb20vdHJhbnNpdGlvbi1kdXJhdGlvbic7XG5pbXBvcnQge2dldE11dGFibGVDbGllbnRSZWN0LCBhZGp1c3RDbGllbnRSZWN0fSBmcm9tICcuL2RvbS9jbGllbnQtcmVjdCc7XG5pbXBvcnQge1BhcmVudFBvc2l0aW9uVHJhY2tlcn0gZnJvbSAnLi9kb20vcGFyZW50LXBvc2l0aW9uLXRyYWNrZXInO1xuaW1wb3J0IHtkZWVwQ2xvbmVOb2RlfSBmcm9tICcuL2RvbS9jbG9uZS1ub2RlJztcblxuLyoqIE9iamVjdCB0aGF0IGNhbiBiZSB1c2VkIHRvIGNvbmZpZ3VyZSB0aGUgYmVoYXZpb3Igb2YgRHJhZ1JlZi4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRHJhZ1JlZkNvbmZpZyB7XG4gIC8qKlxuICAgKiBNaW5pbXVtIGFtb3VudCBvZiBwaXhlbHMgdGhhdCB0aGUgdXNlciBzaG91bGRcbiAgICogZHJhZywgYmVmb3JlIHRoZSBDREsgaW5pdGlhdGVzIGEgZHJhZyBzZXF1ZW5jZS5cbiAgICovXG4gIGRyYWdTdGFydFRocmVzaG9sZDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBBbW91bnQgdGhlIHBpeGVscyB0aGUgdXNlciBzaG91bGQgZHJhZyBiZWZvcmUgdGhlIENES1xuICAgKiBjb25zaWRlcnMgdGhlbSB0byBoYXZlIGNoYW5nZWQgdGhlIGRyYWcgZGlyZWN0aW9uLlxuICAgKi9cbiAgcG9pbnRlckRpcmVjdGlvbkNoYW5nZVRocmVzaG9sZDogbnVtYmVyO1xuXG4gIC8qKiBgei1pbmRleGAgZm9yIHRoZSBhYnNvbHV0ZWx5LXBvc2l0aW9uZWQgZWxlbWVudHMgdGhhdCBhcmUgY3JlYXRlZCBieSB0aGUgZHJhZyBpdGVtLiAqL1xuICB6SW5kZXg/OiBudW1iZXI7XG5cbiAgLyoqIFJlZiB0aGF0IHRoZSBjdXJyZW50IGRyYWcgaXRlbSBpcyBuZXN0ZWQgaW4uICovXG4gIHBhcmVudERyYWdSZWY/OiBEcmFnUmVmO1xufVxuXG4vKiogT3B0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIHRvIGJpbmQgYSBwYXNzaXZlIGV2ZW50IGxpc3RlbmVyLiAqL1xuY29uc3QgcGFzc2l2ZUV2ZW50TGlzdGVuZXJPcHRpb25zID0gbm9ybWFsaXplUGFzc2l2ZUxpc3RlbmVyT3B0aW9ucyh7cGFzc2l2ZTogdHJ1ZX0pO1xuXG4vKiogT3B0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIHRvIGJpbmQgYW4gYWN0aXZlIGV2ZW50IGxpc3RlbmVyLiAqL1xuY29uc3QgYWN0aXZlRXZlbnRMaXN0ZW5lck9wdGlvbnMgPSBub3JtYWxpemVQYXNzaXZlTGlzdGVuZXJPcHRpb25zKHtwYXNzaXZlOiBmYWxzZX0pO1xuXG4vKipcbiAqIFRpbWUgaW4gbWlsbGlzZWNvbmRzIGZvciB3aGljaCB0byBpZ25vcmUgbW91c2UgZXZlbnRzLCBhZnRlclxuICogcmVjZWl2aW5nIGEgdG91Y2ggZXZlbnQuIFVzZWQgdG8gYXZvaWQgZG9pbmcgZG91YmxlIHdvcmsgZm9yXG4gKiB0b3VjaCBkZXZpY2VzIHdoZXJlIHRoZSBicm93c2VyIGZpcmVzIGZha2UgbW91c2UgZXZlbnRzLCBpblxuICogYWRkaXRpb24gdG8gdG91Y2ggZXZlbnRzLlxuICovXG5jb25zdCBNT1VTRV9FVkVOVF9JR05PUkVfVElNRSA9IDgwMDtcblxuLy8gVE9ETyhjcmlzYmV0byk6IGFkZCBhbiBBUEkgZm9yIG1vdmluZyBhIGRyYWdnYWJsZSB1cC9kb3duIHRoZVxuLy8gbGlzdCBwcm9ncmFtbWF0aWNhbGx5LiBVc2VmdWwgZm9yIGtleWJvYXJkIGNvbnRyb2xzLlxuXG4vKiogVGVtcGxhdGUgdGhhdCBjYW4gYmUgdXNlZCB0byBjcmVhdGUgYSBkcmFnIGhlbHBlciBlbGVtZW50IChlLmcuIGEgcHJldmlldyBvciBhIHBsYWNlaG9sZGVyKS4gKi9cbmludGVyZmFjZSBEcmFnSGVscGVyVGVtcGxhdGU8VCA9IGFueT4ge1xuICB0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8VD4gfCBudWxsO1xuICB2aWV3Q29udGFpbmVyOiBWaWV3Q29udGFpbmVyUmVmO1xuICBjb250ZXh0OiBUO1xufVxuXG4vKiogVGVtcGxhdGUgdGhhdCBjYW4gYmUgdXNlZCB0byBjcmVhdGUgYSBkcmFnIHByZXZpZXcgZWxlbWVudC4gKi9cbmludGVyZmFjZSBEcmFnUHJldmlld1RlbXBsYXRlPFQgPSBhbnk+IGV4dGVuZHMgRHJhZ0hlbHBlclRlbXBsYXRlPFQ+IHtcbiAgbWF0Y2hTaXplPzogYm9vbGVhbjtcbn1cblxuLyoqIFBvaW50IG9uIHRoZSBwYWdlIG9yIHdpdGhpbiBhbiBlbGVtZW50LiAqL1xuZXhwb3J0IGludGVyZmFjZSBQb2ludCB7XG4gIHg6IG51bWJlcjtcbiAgeTogbnVtYmVyO1xufVxuXG4vKiogSW5saW5lIHN0eWxlcyB0byBiZSBzZXQgYXMgYCFpbXBvcnRhbnRgIHdoaWxlIGRyYWdnaW5nLiAqL1xuY29uc3QgZHJhZ0ltcG9ydGFudFByb3BlcnRpZXMgPSBuZXcgU2V0KFtcbiAgLy8gTmVlZHMgdG8gYmUgaW1wb3J0YW50LCBiZWNhdXNlIHNvbWUgYG1hdC10YWJsZWAgc2V0cyBgcG9zaXRpb246IHN0aWNreSAhaW1wb3J0YW50YC4gU2VlICMyMjc4MS5cbiAgJ3Bvc2l0aW9uJyxcbl0pO1xuXG4vKipcbiAqIFBvc3NpYmxlIHBsYWNlcyBpbnRvIHdoaWNoIHRoZSBwcmV2aWV3IG9mIGEgZHJhZyBpdGVtIGNhbiBiZSBpbnNlcnRlZC5cbiAqIC0gYGdsb2JhbGAgLSBQcmV2aWV3IHdpbGwgYmUgaW5zZXJ0ZWQgYXQgdGhlIGJvdHRvbSBvZiB0aGUgYDxib2R5PmAuIFRoZSBhZHZhbnRhZ2UgaXMgdGhhdFxuICogeW91IGRvbid0IGhhdmUgdG8gd29ycnkgYWJvdXQgYG92ZXJmbG93OiBoaWRkZW5gIG9yIGB6LWluZGV4YCwgYnV0IHRoZSBpdGVtIHdvbid0IHJldGFpblxuICogaXRzIGluaGVyaXRlZCBzdHlsZXMuXG4gKiAtIGBwYXJlbnRgIC0gUHJldmlldyB3aWxsIGJlIGluc2VydGVkIGludG8gdGhlIHBhcmVudCBvZiB0aGUgZHJhZyBpdGVtLiBUaGUgYWR2YW50YWdlIGlzIHRoYXRcbiAqIGluaGVyaXRlZCBzdHlsZXMgd2lsbCBiZSBwcmVzZXJ2ZWQsIGJ1dCBpdCBtYXkgYmUgY2xpcHBlZCBieSBgb3ZlcmZsb3c6IGhpZGRlbmAgb3Igbm90IGJlXG4gKiB2aXNpYmxlIGR1ZSB0byBgei1pbmRleGAuIEZ1cnRoZXJtb3JlLCB0aGUgcHJldmlldyBpcyBnb2luZyB0byBoYXZlIGFuIGVmZmVjdCBvdmVyIHNlbGVjdG9yc1xuICogbGlrZSBgOm50aC1jaGlsZGAgYW5kIHNvbWUgZmxleGJveCBjb25maWd1cmF0aW9ucy5cbiAqIC0gYEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+IHwgSFRNTEVsZW1lbnRgIC0gUHJldmlldyB3aWxsIGJlIGluc2VydGVkIGludG8gYSBzcGVjaWZpYyBlbGVtZW50LlxuICogU2FtZSBhZHZhbnRhZ2VzIGFuZCBkaXNhZHZhbnRhZ2VzIGFzIGBwYXJlbnRgLlxuICovXG5leHBvcnQgdHlwZSBQcmV2aWV3Q29udGFpbmVyID0gJ2dsb2JhbCcgfCAncGFyZW50JyB8IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+IHwgSFRNTEVsZW1lbnQ7XG5cbi8qKlxuICogUmVmZXJlbmNlIHRvIGEgZHJhZ2dhYmxlIGl0ZW0uIFVzZWQgdG8gbWFuaXB1bGF0ZSBvciBkaXNwb3NlIG9mIHRoZSBpdGVtLlxuICovXG5leHBvcnQgY2xhc3MgRHJhZ1JlZjxUID0gYW55PiB7XG4gIC8qKiBFbGVtZW50IGRpc3BsYXllZCBuZXh0IHRvIHRoZSB1c2VyJ3MgcG9pbnRlciB3aGlsZSB0aGUgZWxlbWVudCBpcyBkcmFnZ2VkLiAqL1xuICBwcml2YXRlIF9wcmV2aWV3OiBIVE1MRWxlbWVudDtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSB2aWV3IG9mIHRoZSBwcmV2aWV3IGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3ByZXZpZXdSZWY6IEVtYmVkZGVkVmlld1JlZjxhbnk+IHwgbnVsbDtcblxuICAvKiogQ29udGFpbmVyIGludG8gd2hpY2ggdG8gaW5zZXJ0IHRoZSBwcmV2aWV3LiAqL1xuICBwcml2YXRlIF9wcmV2aWV3Q29udGFpbmVyOiBQcmV2aWV3Q29udGFpbmVyIHwgdW5kZWZpbmVkO1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIHZpZXcgb2YgdGhlIHBsYWNlaG9sZGVyIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3BsYWNlaG9sZGVyUmVmOiBFbWJlZGRlZFZpZXdSZWY8YW55PiB8IG51bGw7XG5cbiAgLyoqIEVsZW1lbnQgdGhhdCBpcyByZW5kZXJlZCBpbnN0ZWFkIG9mIHRoZSBkcmFnZ2FibGUgaXRlbSB3aGlsZSBpdCBpcyBiZWluZyBzb3J0ZWQuICovXG4gIHByaXZhdGUgX3BsYWNlaG9sZGVyOiBIVE1MRWxlbWVudDtcblxuICAvKiogQ29vcmRpbmF0ZXMgd2l0aGluIHRoZSBlbGVtZW50IGF0IHdoaWNoIHRoZSB1c2VyIHBpY2tlZCB1cCB0aGUgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfcGlja3VwUG9zaXRpb25JbkVsZW1lbnQ6IFBvaW50O1xuXG4gIC8qKiBDb29yZGluYXRlcyBvbiB0aGUgcGFnZSBhdCB3aGljaCB0aGUgdXNlciBwaWNrZWQgdXAgdGhlIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3BpY2t1cFBvc2l0aW9uT25QYWdlOiBQb2ludDtcblxuICAvKipcbiAgICogQW5jaG9yIG5vZGUgdXNlZCB0byBzYXZlIHRoZSBwbGFjZSBpbiB0aGUgRE9NIHdoZXJlIHRoZSBlbGVtZW50IHdhc1xuICAgKiBwaWNrZWQgdXAgc28gdGhhdCBpdCBjYW4gYmUgcmVzdG9yZWQgYXQgdGhlIGVuZCBvZiB0aGUgZHJhZyBzZXF1ZW5jZS5cbiAgICovXG4gIHByaXZhdGUgX2FuY2hvcjogQ29tbWVudDtcblxuICAvKipcbiAgICogQ1NTIGB0cmFuc2Zvcm1gIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgd2hlbiBpdCBpc24ndCBiZWluZyBkcmFnZ2VkLiBXZSBuZWVkIGFcbiAgICogcGFzc2l2ZSB0cmFuc2Zvcm0gaW4gb3JkZXIgZm9yIHRoZSBkcmFnZ2VkIGVsZW1lbnQgdG8gcmV0YWluIGl0cyBuZXcgcG9zaXRpb25cbiAgICogYWZ0ZXIgdGhlIHVzZXIgaGFzIHN0b3BwZWQgZHJhZ2dpbmcgYW5kIGJlY2F1c2Ugd2UgbmVlZCB0byBrbm93IHRoZSByZWxhdGl2ZVxuICAgKiBwb3NpdGlvbiBpbiBjYXNlIHRoZXkgc3RhcnQgZHJhZ2dpbmcgYWdhaW4uIFRoaXMgY29ycmVzcG9uZHMgdG8gYGVsZW1lbnQuc3R5bGUudHJhbnNmb3JtYC5cbiAgICovXG4gIHByaXZhdGUgX3Bhc3NpdmVUcmFuc2Zvcm06IFBvaW50ID0ge3g6IDAsIHk6IDB9O1xuXG4gIC8qKiBDU1MgYHRyYW5zZm9ybWAgdGhhdCBpcyBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IHdoaWxlIGl0J3MgYmVpbmcgZHJhZ2dlZC4gKi9cbiAgcHJpdmF0ZSBfYWN0aXZlVHJhbnNmb3JtOiBQb2ludCA9IHt4OiAwLCB5OiAwfTtcblxuICAvKiogSW5saW5lIGB0cmFuc2Zvcm1gIHZhbHVlIHRoYXQgdGhlIGVsZW1lbnQgaGFkIGJlZm9yZSB0aGUgZmlyc3QgZHJhZ2dpbmcgc2VxdWVuY2UuICovXG4gIHByaXZhdGUgX2luaXRpYWxUcmFuc2Zvcm0/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGRyYWdnaW5nIHNlcXVlbmNlIGhhcyBiZWVuIHN0YXJ0ZWQuIERvZXNuJ3RcbiAgICogbmVjZXNzYXJpbHkgbWVhbiB0aGF0IHRoZSBlbGVtZW50IGhhcyBiZWVuIG1vdmVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfaGFzU3RhcnRlZERyYWdnaW5nID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGVsZW1lbnQgaGFzIG1vdmVkIHNpbmNlIHRoZSB1c2VyIHN0YXJ0ZWQgZHJhZ2dpbmcgaXQuICovXG4gIHByaXZhdGUgX2hhc01vdmVkOiBib29sZWFuO1xuXG4gIC8qKiBEcm9wIGNvbnRhaW5lciBpbiB3aGljaCB0aGUgRHJhZ1JlZiByZXNpZGVkIHdoZW4gZHJhZ2dpbmcgYmVnYW4uICovXG4gIHByaXZhdGUgX2luaXRpYWxDb250YWluZXI6IERyb3BMaXN0UmVmO1xuXG4gIC8qKiBJbmRleCBhdCB3aGljaCB0aGUgaXRlbSBzdGFydGVkIGluIGl0cyBpbml0aWFsIGNvbnRhaW5lci4gKi9cbiAgcHJpdmF0ZSBfaW5pdGlhbEluZGV4OiBudW1iZXI7XG5cbiAgLyoqIENhY2hlZCBwb3NpdGlvbnMgb2Ygc2Nyb2xsYWJsZSBwYXJlbnQgZWxlbWVudHMuICovXG4gIHByaXZhdGUgX3BhcmVudFBvc2l0aW9uczogUGFyZW50UG9zaXRpb25UcmFja2VyO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBpdGVtIGlzIGJlaW5nIG1vdmVkLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9tb3ZlRXZlbnRzID0gbmV3IFN1YmplY3Q8e1xuICAgIHNvdXJjZTogRHJhZ1JlZjtcbiAgICBwb2ludGVyUG9zaXRpb246IHt4OiBudW1iZXI7IHk6IG51bWJlcn07XG4gICAgZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50O1xuICAgIGRpc3RhbmNlOiBQb2ludDtcbiAgICBkZWx0YToge3g6IC0xIHwgMCB8IDE7IHk6IC0xIHwgMCB8IDF9O1xuICB9PigpO1xuXG4gIC8qKiBLZWVwcyB0cmFjayBvZiB0aGUgZGlyZWN0aW9uIGluIHdoaWNoIHRoZSB1c2VyIGlzIGRyYWdnaW5nIGFsb25nIGVhY2ggYXhpcy4gKi9cbiAgcHJpdmF0ZSBfcG9pbnRlckRpcmVjdGlvbkRlbHRhOiB7eDogLTEgfCAwIHwgMTsgeTogLTEgfCAwIHwgMX07XG5cbiAgLyoqIFBvaW50ZXIgcG9zaXRpb24gYXQgd2hpY2ggdGhlIGxhc3QgY2hhbmdlIGluIHRoZSBkZWx0YSBvY2N1cnJlZC4gKi9cbiAgcHJpdmF0ZSBfcG9pbnRlclBvc2l0aW9uQXRMYXN0RGlyZWN0aW9uQ2hhbmdlOiBQb2ludDtcblxuICAvKiogUG9zaXRpb24gb2YgdGhlIHBvaW50ZXIgYXQgdGhlIGxhc3QgcG9pbnRlciBldmVudC4gKi9cbiAgcHJpdmF0ZSBfbGFzdEtub3duUG9pbnRlclBvc2l0aW9uOiBQb2ludDtcblxuICAvKipcbiAgICogUm9vdCBET00gbm9kZSBvZiB0aGUgZHJhZyBpbnN0YW5jZS4gVGhpcyBpcyB0aGUgZWxlbWVudCB0aGF0IHdpbGxcbiAgICogYmUgbW92ZWQgYXJvdW5kIGFzIHRoZSB1c2VyIGlzIGRyYWdnaW5nLlxuICAgKi9cbiAgcHJpdmF0ZSBfcm9vdEVsZW1lbnQ6IEhUTUxFbGVtZW50O1xuXG4gIC8qKlxuICAgKiBOZWFyZXN0IGFuY2VzdG9yIFNWRywgcmVsYXRpdmUgdG8gd2hpY2ggY29vcmRpbmF0ZXMgYXJlIGNhbGN1bGF0ZWQgaWYgZHJhZ2dpbmcgU1ZHRWxlbWVudFxuICAgKi9cbiAgcHJpdmF0ZSBfb3duZXJTVkdFbGVtZW50OiBTVkdTVkdFbGVtZW50IHwgbnVsbDtcblxuICAvKipcbiAgICogSW5saW5lIHN0eWxlIHZhbHVlIG9mIGAtd2Via2l0LXRhcC1oaWdobGlnaHQtY29sb3JgIGF0IHRoZSB0aW1lIHRoZVxuICAgKiBkcmFnZ2luZyB3YXMgc3RhcnRlZC4gVXNlZCB0byByZXN0b3JlIHRoZSB2YWx1ZSBvbmNlIHdlJ3JlIGRvbmUgZHJhZ2dpbmcuXG4gICAqL1xuICBwcml2YXRlIF9yb290RWxlbWVudFRhcEhpZ2hsaWdodDogc3RyaW5nO1xuXG4gIC8qKiBTdWJzY3JpcHRpb24gdG8gcG9pbnRlciBtb3ZlbWVudCBldmVudHMuICovXG4gIHByaXZhdGUgX3BvaW50ZXJNb3ZlU3Vic2NyaXB0aW9uID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuXG4gIC8qKiBTdWJzY3JpcHRpb24gdG8gdGhlIGV2ZW50IHRoYXQgaXMgZGlzcGF0Y2hlZCB3aGVuIHRoZSB1c2VyIGxpZnRzIHRoZWlyIHBvaW50ZXIuICovXG4gIHByaXZhdGUgX3BvaW50ZXJVcFN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcblxuICAvKiogU3Vic2NyaXB0aW9uIHRvIHRoZSB2aWV3cG9ydCBiZWluZyBzY3JvbGxlZC4gKi9cbiAgcHJpdmF0ZSBfc2Nyb2xsU3Vic2NyaXB0aW9uID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuXG4gIC8qKiBTdWJzY3JpcHRpb24gdG8gdGhlIHZpZXdwb3J0IGJlaW5nIHJlc2l6ZWQuICovXG4gIHByaXZhdGUgX3Jlc2l6ZVN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcblxuICAvKipcbiAgICogVGltZSBhdCB3aGljaCB0aGUgbGFzdCB0b3VjaCBldmVudCBvY2N1cnJlZC4gVXNlZCB0byBhdm9pZCBmaXJpbmcgdGhlIHNhbWVcbiAgICogZXZlbnRzIG11bHRpcGxlIHRpbWVzIG9uIHRvdWNoIGRldmljZXMgd2hlcmUgdGhlIGJyb3dzZXIgd2lsbCBmaXJlIGEgZmFrZVxuICAgKiBtb3VzZSBldmVudCBmb3IgZWFjaCB0b3VjaCBldmVudCwgYWZ0ZXIgYSBjZXJ0YWluIHRpbWUuXG4gICAqL1xuICBwcml2YXRlIF9sYXN0VG91Y2hFdmVudFRpbWU6IG51bWJlcjtcblxuICAvKiogVGltZSBhdCB3aGljaCB0aGUgbGFzdCBkcmFnZ2luZyBzZXF1ZW5jZSB3YXMgc3RhcnRlZC4gKi9cbiAgcHJpdmF0ZSBfZHJhZ1N0YXJ0VGltZTogbnVtYmVyO1xuXG4gIC8qKiBDYWNoZWQgcmVmZXJlbmNlIHRvIHRoZSBib3VuZGFyeSBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9ib3VuZGFyeUVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG5hdGl2ZSBkcmFnZ2luZyBpbnRlcmFjdGlvbnMgaGF2ZSBiZWVuIGVuYWJsZWQgb24gdGhlIHJvb3QgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfbmF0aXZlSW50ZXJhY3Rpb25zRW5hYmxlZCA9IHRydWU7XG5cbiAgLyoqIENsaWVudCByZWN0IG9mIHRoZSByb290IGVsZW1lbnQgd2hlbiB0aGUgZHJhZ2dpbmcgc2VxdWVuY2UgaGFzIHN0YXJ0ZWQuICovXG4gIHByaXZhdGUgX2luaXRpYWxDbGllbnRSZWN0PzogQ2xpZW50UmVjdDtcblxuICAvKiogQ2FjaGVkIGRpbWVuc2lvbnMgb2YgdGhlIHByZXZpZXcgZWxlbWVudC4gU2hvdWxkIGJlIHJlYWQgdmlhIGBfZ2V0UHJldmlld1JlY3RgLiAqL1xuICBwcml2YXRlIF9wcmV2aWV3UmVjdD86IENsaWVudFJlY3Q7XG5cbiAgLyoqIENhY2hlZCBkaW1lbnNpb25zIG9mIHRoZSBib3VuZGFyeSBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9ib3VuZGFyeVJlY3Q/OiBDbGllbnRSZWN0O1xuXG4gIC8qKiBFbGVtZW50IHRoYXQgd2lsbCBiZSB1c2VkIGFzIGEgdGVtcGxhdGUgdG8gY3JlYXRlIHRoZSBkcmFnZ2FibGUgaXRlbSdzIHByZXZpZXcuICovXG4gIHByaXZhdGUgX3ByZXZpZXdUZW1wbGF0ZT86IERyYWdQcmV2aWV3VGVtcGxhdGUgfCBudWxsO1xuXG4gIC8qKiBUZW1wbGF0ZSBmb3IgcGxhY2Vob2xkZXIgZWxlbWVudCByZW5kZXJlZCB0byBzaG93IHdoZXJlIGEgZHJhZ2dhYmxlIHdvdWxkIGJlIGRyb3BwZWQuICovXG4gIHByaXZhdGUgX3BsYWNlaG9sZGVyVGVtcGxhdGU/OiBEcmFnSGVscGVyVGVtcGxhdGUgfCBudWxsO1xuXG4gIC8qKiBFbGVtZW50cyB0aGF0IGNhbiBiZSB1c2VkIHRvIGRyYWcgdGhlIGRyYWdnYWJsZSBpdGVtLiAqL1xuICBwcml2YXRlIF9oYW5kbGVzOiBIVE1MRWxlbWVudFtdID0gW107XG5cbiAgLyoqIFJlZ2lzdGVyZWQgaGFuZGxlcyB0aGF0IGFyZSBjdXJyZW50bHkgZGlzYWJsZWQuICovXG4gIHByaXZhdGUgX2Rpc2FibGVkSGFuZGxlcyA9IG5ldyBTZXQ8SFRNTEVsZW1lbnQ+KCk7XG5cbiAgLyoqIERyb3BwYWJsZSBjb250YWluZXIgdGhhdCB0aGUgZHJhZ2dhYmxlIGlzIGEgcGFydCBvZi4gKi9cbiAgcHJpdmF0ZSBfZHJvcENvbnRhaW5lcj86IERyb3BMaXN0UmVmO1xuXG4gIC8qKiBMYXlvdXQgZGlyZWN0aW9uIG9mIHRoZSBpdGVtLiAqL1xuICBwcml2YXRlIF9kaXJlY3Rpb246IERpcmVjdGlvbiA9ICdsdHInO1xuXG4gIC8qKiBSZWYgdGhhdCB0aGUgY3VycmVudCBkcmFnIGl0ZW0gaXMgbmVzdGVkIGluLiAqL1xuICBwcml2YXRlIF9wYXJlbnREcmFnUmVmOiBEcmFnUmVmPHVua25vd24+IHwgbnVsbDtcblxuICAvKipcbiAgICogQ2FjaGVkIHNoYWRvdyByb290IHRoYXQgdGhlIGVsZW1lbnQgaXMgcGxhY2VkIGluLiBgbnVsbGAgbWVhbnMgdGhhdCB0aGUgZWxlbWVudCBpc24ndCBpblxuICAgKiB0aGUgc2hhZG93IERPTSBhbmQgYHVuZGVmaW5lZGAgbWVhbnMgdGhhdCBpdCBoYXNuJ3QgYmVlbiByZXNvbHZlZCB5ZXQuIFNob3VsZCBiZSByZWFkIHZpYVxuICAgKiBgX2dldFNoYWRvd1Jvb3RgLCBub3QgZGlyZWN0bHkuXG4gICAqL1xuICBwcml2YXRlIF9jYWNoZWRTaGFkb3dSb290OiBTaGFkb3dSb290IHwgbnVsbCB8IHVuZGVmaW5lZDtcblxuICAvKiogQXhpcyBhbG9uZyB3aGljaCBkcmFnZ2luZyBpcyBsb2NrZWQuICovXG4gIGxvY2tBeGlzOiAneCcgfCAneSc7XG5cbiAgLyoqXG4gICAqIEFtb3VudCBvZiBtaWxsaXNlY29uZHMgdG8gd2FpdCBhZnRlciB0aGUgdXNlciBoYXMgcHV0IHRoZWlyXG4gICAqIHBvaW50ZXIgZG93biBiZWZvcmUgc3RhcnRpbmcgdG8gZHJhZyB0aGUgZWxlbWVudC5cbiAgICovXG4gIGRyYWdTdGFydERlbGF5OiBudW1iZXIgfCB7dG91Y2g6IG51bWJlcjsgbW91c2U6IG51bWJlcn0gPSAwO1xuXG4gIC8qKiBDbGFzcyB0byBiZSBhZGRlZCB0byB0aGUgcHJldmlldyBlbGVtZW50LiAqL1xuICBwcmV2aWV3Q2xhc3M6IHN0cmluZyB8IHN0cmluZ1tdIHwgdW5kZWZpbmVkO1xuXG4gIC8qKiBXaGV0aGVyIHN0YXJ0aW5nIHRvIGRyYWcgdGhpcyBlbGVtZW50IGlzIGRpc2FibGVkLiAqL1xuICBnZXQgZGlzYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2Rpc2FibGVkIHx8ICEhKHRoaXMuX2Ryb3BDb250YWluZXIgJiYgdGhpcy5fZHJvcENvbnRhaW5lci5kaXNhYmxlZCk7XG4gIH1cbiAgc2V0IGRpc2FibGVkKHZhbHVlOiBib29sZWFuKSB7XG4gICAgaWYgKHZhbHVlICE9PSB0aGlzLl9kaXNhYmxlZCkge1xuICAgICAgdGhpcy5fZGlzYWJsZWQgPSB2YWx1ZTtcbiAgICAgIHRoaXMuX3RvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMoKTtcbiAgICAgIHRoaXMuX2hhbmRsZXMuZm9yRWFjaChoYW5kbGUgPT4gdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucyhoYW5kbGUsIHZhbHVlKSk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgX2Rpc2FibGVkID0gZmFsc2U7XG5cbiAgLyoqIEVtaXRzIGFzIHRoZSBkcmFnIHNlcXVlbmNlIGlzIGJlaW5nIHByZXBhcmVkLiAqL1xuICByZWFkb25seSBiZWZvcmVTdGFydGVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBzdGFydHMgZHJhZ2dpbmcgdGhlIGl0ZW0uICovXG4gIHJlYWRvbmx5IHN0YXJ0ZWQgPSBuZXcgU3ViamVjdDx7c291cmNlOiBEcmFnUmVmOyBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnR9PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGhhcyByZWxlYXNlZCBhIGRyYWcgaXRlbSwgYmVmb3JlIGFueSBhbmltYXRpb25zIGhhdmUgc3RhcnRlZC4gKi9cbiAgcmVhZG9ubHkgcmVsZWFzZWQgPSBuZXcgU3ViamVjdDx7c291cmNlOiBEcmFnUmVmOyBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnR9PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHN0b3BzIGRyYWdnaW5nIGFuIGl0ZW0gaW4gdGhlIGNvbnRhaW5lci4gKi9cbiAgcmVhZG9ubHkgZW5kZWQgPSBuZXcgU3ViamVjdDx7XG4gICAgc291cmNlOiBEcmFnUmVmO1xuICAgIGRpc3RhbmNlOiBQb2ludDtcbiAgICBkcm9wUG9pbnQ6IFBvaW50O1xuICAgIGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudDtcbiAgfT4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBoYXMgbW92ZWQgdGhlIGl0ZW0gaW50byBhIG5ldyBjb250YWluZXIuICovXG4gIHJlYWRvbmx5IGVudGVyZWQgPSBuZXcgU3ViamVjdDx7Y29udGFpbmVyOiBEcm9wTGlzdFJlZjsgaXRlbTogRHJhZ1JlZjsgY3VycmVudEluZGV4OiBudW1iZXJ9PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHJlbW92ZXMgdGhlIGl0ZW0gaXRzIGNvbnRhaW5lciBieSBkcmFnZ2luZyBpdCBpbnRvIGFub3RoZXIgY29udGFpbmVyLiAqL1xuICByZWFkb25seSBleGl0ZWQgPSBuZXcgU3ViamVjdDx7Y29udGFpbmVyOiBEcm9wTGlzdFJlZjsgaXRlbTogRHJhZ1JlZn0+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgZHJvcHMgdGhlIGl0ZW0gaW5zaWRlIGEgY29udGFpbmVyLiAqL1xuICByZWFkb25seSBkcm9wcGVkID0gbmV3IFN1YmplY3Q8e1xuICAgIHByZXZpb3VzSW5kZXg6IG51bWJlcjtcbiAgICBjdXJyZW50SW5kZXg6IG51bWJlcjtcbiAgICBpdGVtOiBEcmFnUmVmO1xuICAgIGNvbnRhaW5lcjogRHJvcExpc3RSZWY7XG4gICAgcHJldmlvdXNDb250YWluZXI6IERyb3BMaXN0UmVmO1xuICAgIGRpc3RhbmNlOiBQb2ludDtcbiAgICBkcm9wUG9pbnQ6IFBvaW50O1xuICAgIGlzUG9pbnRlck92ZXJDb250YWluZXI6IGJvb2xlYW47XG4gICAgZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50O1xuICB9PigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyBhcyB0aGUgdXNlciBpcyBkcmFnZ2luZyB0aGUgaXRlbS4gVXNlIHdpdGggY2F1dGlvbixcbiAgICogYmVjYXVzZSB0aGlzIGV2ZW50IHdpbGwgZmlyZSBmb3IgZXZlcnkgcGl4ZWwgdGhhdCB0aGUgdXNlciBoYXMgZHJhZ2dlZC5cbiAgICovXG4gIHJlYWRvbmx5IG1vdmVkOiBPYnNlcnZhYmxlPHtcbiAgICBzb3VyY2U6IERyYWdSZWY7XG4gICAgcG9pbnRlclBvc2l0aW9uOiB7eDogbnVtYmVyOyB5OiBudW1iZXJ9O1xuICAgIGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudDtcbiAgICBkaXN0YW5jZTogUG9pbnQ7XG4gICAgZGVsdGE6IHt4OiAtMSB8IDAgfCAxOyB5OiAtMSB8IDAgfCAxfTtcbiAgfT4gPSB0aGlzLl9tb3ZlRXZlbnRzO1xuXG4gIC8qKiBBcmJpdHJhcnkgZGF0YSB0aGF0IGNhbiBiZSBhdHRhY2hlZCB0byB0aGUgZHJhZyBpdGVtLiAqL1xuICBkYXRhOiBUO1xuXG4gIC8qKlxuICAgKiBGdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHRvIGN1c3RvbWl6ZSB0aGUgbG9naWMgb2YgaG93IHRoZSBwb3NpdGlvbiBvZiB0aGUgZHJhZyBpdGVtXG4gICAqIGlzIGxpbWl0ZWQgd2hpbGUgaXQncyBiZWluZyBkcmFnZ2VkLiBHZXRzIGNhbGxlZCB3aXRoIGEgcG9pbnQgY29udGFpbmluZyB0aGUgY3VycmVudCBwb3NpdGlvblxuICAgKiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgb24gdGhlIHBhZ2UsIGEgcmVmZXJlbmNlIHRvIHRoZSBpdGVtIGJlaW5nIGRyYWdnZWQgYW5kIGl0cyBkaW1lbnNpb25zLlxuICAgKiBTaG91bGQgcmV0dXJuIGEgcG9pbnQgZGVzY3JpYmluZyB3aGVyZSB0aGUgaXRlbSBzaG91bGQgYmUgcmVuZGVyZWQuXG4gICAqL1xuICBjb25zdHJhaW5Qb3NpdGlvbj86IChcbiAgICB1c2VyUG9pbnRlclBvc2l0aW9uOiBQb2ludCxcbiAgICBkcmFnUmVmOiBEcmFnUmVmLFxuICAgIGRpbWVuc2lvbnM6IENsaWVudFJlY3QsXG4gICAgcGlja3VwUG9zaXRpb25JbkVsZW1lbnQ6IFBvaW50LFxuICApID0+IFBvaW50O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+IHwgSFRNTEVsZW1lbnQsXG4gICAgcHJpdmF0ZSBfY29uZmlnOiBEcmFnUmVmQ29uZmlnLFxuICAgIHByaXZhdGUgX2RvY3VtZW50OiBEb2N1bWVudCxcbiAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICBwcml2YXRlIF92aWV3cG9ydFJ1bGVyOiBWaWV3cG9ydFJ1bGVyLFxuICAgIHByaXZhdGUgX2RyYWdEcm9wUmVnaXN0cnk6IERyYWdEcm9wUmVnaXN0cnk8RHJhZ1JlZiwgRHJvcExpc3RSZWY+LFxuICApIHtcbiAgICB0aGlzLndpdGhSb290RWxlbWVudChlbGVtZW50KS53aXRoUGFyZW50KF9jb25maWcucGFyZW50RHJhZ1JlZiB8fCBudWxsKTtcbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMgPSBuZXcgUGFyZW50UG9zaXRpb25UcmFja2VyKF9kb2N1bWVudCk7XG4gICAgX2RyYWdEcm9wUmVnaXN0cnkucmVnaXN0ZXJEcmFnSXRlbSh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBlbGVtZW50IHRoYXQgaXMgYmVpbmcgdXNlZCBhcyBhIHBsYWNlaG9sZGVyXG4gICAqIHdoaWxlIHRoZSBjdXJyZW50IGVsZW1lbnQgaXMgYmVpbmcgZHJhZ2dlZC5cbiAgICovXG4gIGdldFBsYWNlaG9sZGVyRWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX3BsYWNlaG9sZGVyO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIHJvb3QgZHJhZ2dhYmxlIGVsZW1lbnQuICovXG4gIGdldFJvb3RFbGVtZW50KCk6IEhUTUxFbGVtZW50IHtcbiAgICByZXR1cm4gdGhpcy5fcm9vdEVsZW1lbnQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudGx5LXZpc2libGUgZWxlbWVudCB0aGF0IHJlcHJlc2VudHMgdGhlIGRyYWcgaXRlbS5cbiAgICogV2hpbGUgZHJhZ2dpbmcgdGhpcyBpcyB0aGUgcGxhY2Vob2xkZXIsIG90aGVyd2lzZSBpdCdzIHRoZSByb290IGVsZW1lbnQuXG4gICAqL1xuICBnZXRWaXNpYmxlRWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuaXNEcmFnZ2luZygpID8gdGhpcy5nZXRQbGFjZWhvbGRlckVsZW1lbnQoKSA6IHRoaXMuZ2V0Um9vdEVsZW1lbnQoKTtcbiAgfVxuXG4gIC8qKiBSZWdpc3RlcnMgdGhlIGhhbmRsZXMgdGhhdCBjYW4gYmUgdXNlZCB0byBkcmFnIHRoZSBlbGVtZW50LiAqL1xuICB3aXRoSGFuZGxlcyhoYW5kbGVzOiAoSFRNTEVsZW1lbnQgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50PilbXSk6IHRoaXMge1xuICAgIHRoaXMuX2hhbmRsZXMgPSBoYW5kbGVzLm1hcChoYW5kbGUgPT4gY29lcmNlRWxlbWVudChoYW5kbGUpKTtcbiAgICB0aGlzLl9oYW5kbGVzLmZvckVhY2goaGFuZGxlID0+IHRvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMoaGFuZGxlLCB0aGlzLmRpc2FibGVkKSk7XG4gICAgdGhpcy5fdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucygpO1xuXG4gICAgLy8gRGVsZXRlIGFueSBsaW5nZXJpbmcgZGlzYWJsZWQgaGFuZGxlcyB0aGF0IG1heSBoYXZlIGJlZW4gZGVzdHJveWVkLiBOb3RlIHRoYXQgd2UgcmUtY3JlYXRlXG4gICAgLy8gdGhlIHNldCwgcmF0aGVyIHRoYW4gaXRlcmF0ZSBvdmVyIGl0IGFuZCBmaWx0ZXIgb3V0IHRoZSBkZXN0cm95ZWQgaGFuZGxlcywgYmVjYXVzZSB3aGlsZVxuICAgIC8vIHRoZSBFUyBzcGVjIGFsbG93cyBmb3Igc2V0cyB0byBiZSBtb2RpZmllZCB3aGlsZSB0aGV5J3JlIGJlaW5nIGl0ZXJhdGVkIG92ZXIsIHNvbWUgcG9seWZpbGxzXG4gICAgLy8gdXNlIGFuIGFycmF5IGludGVybmFsbHkgd2hpY2ggbWF5IHRocm93IGFuIGVycm9yLlxuICAgIGNvbnN0IGRpc2FibGVkSGFuZGxlcyA9IG5ldyBTZXQ8SFRNTEVsZW1lbnQ+KCk7XG4gICAgdGhpcy5fZGlzYWJsZWRIYW5kbGVzLmZvckVhY2goaGFuZGxlID0+IHtcbiAgICAgIGlmICh0aGlzLl9oYW5kbGVzLmluZGV4T2YoaGFuZGxlKSA+IC0xKSB7XG4gICAgICAgIGRpc2FibGVkSGFuZGxlcy5hZGQoaGFuZGxlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLl9kaXNhYmxlZEhhbmRsZXMgPSBkaXNhYmxlZEhhbmRsZXM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIHRoZSB0ZW1wbGF0ZSB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciB0aGUgZHJhZyBwcmV2aWV3LlxuICAgKiBAcGFyYW0gdGVtcGxhdGUgVGVtcGxhdGUgdGhhdCBmcm9tIHdoaWNoIHRvIHN0YW1wIG91dCB0aGUgcHJldmlldy5cbiAgICovXG4gIHdpdGhQcmV2aWV3VGVtcGxhdGUodGVtcGxhdGU6IERyYWdQcmV2aWV3VGVtcGxhdGUgfCBudWxsKTogdGhpcyB7XG4gICAgdGhpcy5fcHJldmlld1RlbXBsYXRlID0gdGVtcGxhdGU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIHRoZSB0ZW1wbGF0ZSB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciB0aGUgZHJhZyBwbGFjZWhvbGRlci5cbiAgICogQHBhcmFtIHRlbXBsYXRlIFRlbXBsYXRlIHRoYXQgZnJvbSB3aGljaCB0byBzdGFtcCBvdXQgdGhlIHBsYWNlaG9sZGVyLlxuICAgKi9cbiAgd2l0aFBsYWNlaG9sZGVyVGVtcGxhdGUodGVtcGxhdGU6IERyYWdIZWxwZXJUZW1wbGF0ZSB8IG51bGwpOiB0aGlzIHtcbiAgICB0aGlzLl9wbGFjZWhvbGRlclRlbXBsYXRlID0gdGVtcGxhdGU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhbiBhbHRlcm5hdGUgZHJhZyByb290IGVsZW1lbnQuIFRoZSByb290IGVsZW1lbnQgaXMgdGhlIGVsZW1lbnQgdGhhdCB3aWxsIGJlIG1vdmVkIGFzXG4gICAqIHRoZSB1c2VyIGlzIGRyYWdnaW5nLiBQYXNzaW5nIGFuIGFsdGVybmF0ZSByb290IGVsZW1lbnQgaXMgdXNlZnVsIHdoZW4gdHJ5aW5nIHRvIGVuYWJsZVxuICAgKiBkcmFnZ2luZyBvbiBhbiBlbGVtZW50IHRoYXQgeW91IG1pZ2h0IG5vdCBoYXZlIGFjY2VzcyB0by5cbiAgICovXG4gIHdpdGhSb290RWxlbWVudChyb290RWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBIVE1MRWxlbWVudCk6IHRoaXMge1xuICAgIGNvbnN0IGVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KHJvb3RFbGVtZW50KTtcblxuICAgIGlmIChlbGVtZW50ICE9PSB0aGlzLl9yb290RWxlbWVudCkge1xuICAgICAgaWYgKHRoaXMuX3Jvb3RFbGVtZW50KSB7XG4gICAgICAgIHRoaXMuX3JlbW92ZVJvb3RFbGVtZW50TGlzdGVuZXJzKHRoaXMuX3Jvb3RFbGVtZW50KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9wb2ludGVyRG93biwgYWN0aXZlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9wb2ludGVyRG93biwgcGFzc2l2ZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdkcmFnc3RhcnQnLCB0aGlzLl9uYXRpdmVEcmFnU3RhcnQsIGFjdGl2ZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5faW5pdGlhbFRyYW5zZm9ybSA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuX3Jvb3RFbGVtZW50ID0gZWxlbWVudDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIFNWR0VsZW1lbnQgIT09ICd1bmRlZmluZWQnICYmIHRoaXMuX3Jvb3RFbGVtZW50IGluc3RhbmNlb2YgU1ZHRWxlbWVudCkge1xuICAgICAgdGhpcy5fb3duZXJTVkdFbGVtZW50ID0gdGhpcy5fcm9vdEVsZW1lbnQub3duZXJTVkdFbGVtZW50O1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEVsZW1lbnQgdG8gd2hpY2ggdGhlIGRyYWdnYWJsZSdzIHBvc2l0aW9uIHdpbGwgYmUgY29uc3RyYWluZWQuXG4gICAqL1xuICB3aXRoQm91bmRhcnlFbGVtZW50KGJvdW5kYXJ5RWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBIVE1MRWxlbWVudCB8IG51bGwpOiB0aGlzIHtcbiAgICB0aGlzLl9ib3VuZGFyeUVsZW1lbnQgPSBib3VuZGFyeUVsZW1lbnQgPyBjb2VyY2VFbGVtZW50KGJvdW5kYXJ5RWxlbWVudCkgOiBudWxsO1xuICAgIHRoaXMuX3Jlc2l6ZVN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIGlmIChib3VuZGFyeUVsZW1lbnQpIHtcbiAgICAgIHRoaXMuX3Jlc2l6ZVN1YnNjcmlwdGlvbiA9IHRoaXMuX3ZpZXdwb3J0UnVsZXJcbiAgICAgICAgLmNoYW5nZSgxMClcbiAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9jb250YWluSW5zaWRlQm91bmRhcnlPblJlc2l6ZSgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogU2V0cyB0aGUgcGFyZW50IHJlZiB0aGF0IHRoZSByZWYgaXMgbmVzdGVkIGluLiAgKi9cbiAgd2l0aFBhcmVudChwYXJlbnQ6IERyYWdSZWY8dW5rbm93bj4gfCBudWxsKTogdGhpcyB7XG4gICAgdGhpcy5fcGFyZW50RHJhZ1JlZiA9IHBhcmVudDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBSZW1vdmVzIHRoZSBkcmFnZ2luZyBmdW5jdGlvbmFsaXR5IGZyb20gdGhlIERPTSBlbGVtZW50LiAqL1xuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuX3JlbW92ZVJvb3RFbGVtZW50TGlzdGVuZXJzKHRoaXMuX3Jvb3RFbGVtZW50KTtcblxuICAgIC8vIERvIHRoaXMgY2hlY2sgYmVmb3JlIHJlbW92aW5nIGZyb20gdGhlIHJlZ2lzdHJ5IHNpbmNlIGl0J2xsXG4gICAgLy8gc3RvcCBiZWluZyBjb25zaWRlcmVkIGFzIGRyYWdnZWQgb25jZSBpdCBpcyByZW1vdmVkLlxuICAgIGlmICh0aGlzLmlzRHJhZ2dpbmcoKSkge1xuICAgICAgLy8gU2luY2Ugd2UgbW92ZSBvdXQgdGhlIGVsZW1lbnQgdG8gdGhlIGVuZCBvZiB0aGUgYm9keSB3aGlsZSBpdCdzIGJlaW5nXG4gICAgICAvLyBkcmFnZ2VkLCB3ZSBoYXZlIHRvIG1ha2Ugc3VyZSB0aGF0IGl0J3MgcmVtb3ZlZCBpZiBpdCBnZXRzIGRlc3Ryb3llZC5cbiAgICAgIHRoaXMuX3Jvb3RFbGVtZW50Py5yZW1vdmUoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9hbmNob3I/LnJlbW92ZSgpO1xuICAgIHRoaXMuX2Rlc3Ryb3lQcmV2aWV3KCk7XG4gICAgdGhpcy5fZGVzdHJveVBsYWNlaG9sZGVyKCk7XG4gICAgdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5yZW1vdmVEcmFnSXRlbSh0aGlzKTtcbiAgICB0aGlzLl9yZW1vdmVTdWJzY3JpcHRpb25zKCk7XG4gICAgdGhpcy5iZWZvcmVTdGFydGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5zdGFydGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5yZWxlYXNlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuZW5kZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmVudGVyZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmV4aXRlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuZHJvcHBlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX21vdmVFdmVudHMuY29tcGxldGUoKTtcbiAgICB0aGlzLl9oYW5kbGVzID0gW107XG4gICAgdGhpcy5fZGlzYWJsZWRIYW5kbGVzLmNsZWFyKCk7XG4gICAgdGhpcy5fZHJvcENvbnRhaW5lciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9yZXNpemVTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuY2xlYXIoKTtcbiAgICB0aGlzLl9ib3VuZGFyeUVsZW1lbnQgPVxuICAgICAgdGhpcy5fcm9vdEVsZW1lbnQgPVxuICAgICAgdGhpcy5fb3duZXJTVkdFbGVtZW50ID1cbiAgICAgIHRoaXMuX3BsYWNlaG9sZGVyVGVtcGxhdGUgPVxuICAgICAgdGhpcy5fcHJldmlld1RlbXBsYXRlID1cbiAgICAgIHRoaXMuX2FuY2hvciA9XG4gICAgICB0aGlzLl9wYXJlbnREcmFnUmVmID1cbiAgICAgICAgbnVsbCE7XG4gIH1cblxuICAvKiogQ2hlY2tzIHdoZXRoZXIgdGhlIGVsZW1lbnQgaXMgY3VycmVudGx5IGJlaW5nIGRyYWdnZWQuICovXG4gIGlzRHJhZ2dpbmcoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2hhc1N0YXJ0ZWREcmFnZ2luZyAmJiB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LmlzRHJhZ2dpbmcodGhpcyk7XG4gIH1cblxuICAvKiogUmVzZXRzIGEgc3RhbmRhbG9uZSBkcmFnIGl0ZW0gdG8gaXRzIGluaXRpYWwgcG9zaXRpb24uICovXG4gIHJlc2V0KCk6IHZvaWQge1xuICAgIHRoaXMuX3Jvb3RFbGVtZW50LnN0eWxlLnRyYW5zZm9ybSA9IHRoaXMuX2luaXRpYWxUcmFuc2Zvcm0gfHwgJyc7XG4gICAgdGhpcy5fYWN0aXZlVHJhbnNmb3JtID0ge3g6IDAsIHk6IDB9O1xuICAgIHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm0gPSB7eDogMCwgeTogMH07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIGhhbmRsZSBhcyBkaXNhYmxlZC4gV2hpbGUgYSBoYW5kbGUgaXMgZGlzYWJsZWQsIGl0J2xsIGNhcHR1cmUgYW5kIGludGVycnVwdCBkcmFnZ2luZy5cbiAgICogQHBhcmFtIGhhbmRsZSBIYW5kbGUgZWxlbWVudCB0aGF0IHNob3VsZCBiZSBkaXNhYmxlZC5cbiAgICovXG4gIGRpc2FibGVIYW5kbGUoaGFuZGxlOiBIVE1MRWxlbWVudCkge1xuICAgIGlmICghdGhpcy5fZGlzYWJsZWRIYW5kbGVzLmhhcyhoYW5kbGUpICYmIHRoaXMuX2hhbmRsZXMuaW5kZXhPZihoYW5kbGUpID4gLTEpIHtcbiAgICAgIHRoaXMuX2Rpc2FibGVkSGFuZGxlcy5hZGQoaGFuZGxlKTtcbiAgICAgIHRvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMoaGFuZGxlLCB0cnVlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlcyBhIGhhbmRsZSwgaWYgaXQgaGFzIGJlZW4gZGlzYWJsZWQuXG4gICAqIEBwYXJhbSBoYW5kbGUgSGFuZGxlIGVsZW1lbnQgdG8gYmUgZW5hYmxlZC5cbiAgICovXG4gIGVuYWJsZUhhbmRsZShoYW5kbGU6IEhUTUxFbGVtZW50KSB7XG4gICAgaWYgKHRoaXMuX2Rpc2FibGVkSGFuZGxlcy5oYXMoaGFuZGxlKSkge1xuICAgICAgdGhpcy5fZGlzYWJsZWRIYW5kbGVzLmRlbGV0ZShoYW5kbGUpO1xuICAgICAgdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucyhoYW5kbGUsIHRoaXMuZGlzYWJsZWQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBsYXlvdXQgZGlyZWN0aW9uIG9mIHRoZSBkcmFnZ2FibGUgaXRlbS4gKi9cbiAgd2l0aERpcmVjdGlvbihkaXJlY3Rpb246IERpcmVjdGlvbik6IHRoaXMge1xuICAgIHRoaXMuX2RpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBjb250YWluZXIgdGhhdCB0aGUgaXRlbSBpcyBwYXJ0IG9mLiAqL1xuICBfd2l0aERyb3BDb250YWluZXIoY29udGFpbmVyOiBEcm9wTGlzdFJlZikge1xuICAgIHRoaXMuX2Ryb3BDb250YWluZXIgPSBjb250YWluZXI7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCBwb3NpdGlvbiBpbiBwaXhlbHMgdGhlIGRyYWdnYWJsZSBvdXRzaWRlIG9mIGEgZHJvcCBjb250YWluZXIuXG4gICAqL1xuICBnZXRGcmVlRHJhZ1Bvc2l0aW9uKCk6IFJlYWRvbmx5PFBvaW50PiB7XG4gICAgY29uc3QgcG9zaXRpb24gPSB0aGlzLmlzRHJhZ2dpbmcoKSA/IHRoaXMuX2FjdGl2ZVRyYW5zZm9ybSA6IHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm07XG4gICAgcmV0dXJuIHt4OiBwb3NpdGlvbi54LCB5OiBwb3NpdGlvbi55fTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjdXJyZW50IHBvc2l0aW9uIGluIHBpeGVscyB0aGUgZHJhZ2dhYmxlIG91dHNpZGUgb2YgYSBkcm9wIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHZhbHVlIE5ldyBwb3NpdGlvbiB0byBiZSBzZXQuXG4gICAqL1xuICBzZXRGcmVlRHJhZ1Bvc2l0aW9uKHZhbHVlOiBQb2ludCk6IHRoaXMge1xuICAgIHRoaXMuX2FjdGl2ZVRyYW5zZm9ybSA9IHt4OiAwLCB5OiAwfTtcbiAgICB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtLnggPSB2YWx1ZS54O1xuICAgIHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm0ueSA9IHZhbHVlLnk7XG5cbiAgICBpZiAoIXRoaXMuX2Ryb3BDb250YWluZXIpIHtcbiAgICAgIHRoaXMuX2FwcGx5Um9vdEVsZW1lbnRUcmFuc2Zvcm0odmFsdWUueCwgdmFsdWUueSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY29udGFpbmVyIGludG8gd2hpY2ggdG8gaW5zZXJ0IHRoZSBwcmV2aWV3IGVsZW1lbnQuXG4gICAqIEBwYXJhbSB2YWx1ZSBDb250YWluZXIgaW50byB3aGljaCB0byBpbnNlcnQgdGhlIHByZXZpZXcuXG4gICAqL1xuICB3aXRoUHJldmlld0NvbnRhaW5lcih2YWx1ZTogUHJldmlld0NvbnRhaW5lcik6IHRoaXMge1xuICAgIHRoaXMuX3ByZXZpZXdDb250YWluZXIgPSB2YWx1ZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBVcGRhdGVzIHRoZSBpdGVtJ3Mgc29ydCBvcmRlciBiYXNlZCBvbiB0aGUgbGFzdC1rbm93biBwb2ludGVyIHBvc2l0aW9uLiAqL1xuICBfc29ydEZyb21MYXN0UG9pbnRlclBvc2l0aW9uKCkge1xuICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5fbGFzdEtub3duUG9pbnRlclBvc2l0aW9uO1xuXG4gICAgaWYgKHBvc2l0aW9uICYmIHRoaXMuX2Ryb3BDb250YWluZXIpIHtcbiAgICAgIHRoaXMuX3VwZGF0ZUFjdGl2ZURyb3BDb250YWluZXIodGhpcy5fZ2V0Q29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24ocG9zaXRpb24pLCBwb3NpdGlvbik7XG4gICAgfVxuICB9XG5cbiAgLyoqIFVuc3Vic2NyaWJlcyBmcm9tIHRoZSBnbG9iYWwgc3Vic2NyaXB0aW9ucy4gKi9cbiAgcHJpdmF0ZSBfcmVtb3ZlU3Vic2NyaXB0aW9ucygpIHtcbiAgICB0aGlzLl9wb2ludGVyTW92ZVN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuX3BvaW50ZXJVcFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuX3Njcm9sbFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICB9XG5cbiAgLyoqIERlc3Ryb3lzIHRoZSBwcmV2aWV3IGVsZW1lbnQgYW5kIGl0cyBWaWV3UmVmLiAqL1xuICBwcml2YXRlIF9kZXN0cm95UHJldmlldygpIHtcbiAgICB0aGlzLl9wcmV2aWV3Py5yZW1vdmUoKTtcbiAgICB0aGlzLl9wcmV2aWV3UmVmPy5kZXN0cm95KCk7XG4gICAgdGhpcy5fcHJldmlldyA9IHRoaXMuX3ByZXZpZXdSZWYgPSBudWxsITtcbiAgfVxuXG4gIC8qKiBEZXN0cm95cyB0aGUgcGxhY2Vob2xkZXIgZWxlbWVudCBhbmQgaXRzIFZpZXdSZWYuICovXG4gIHByaXZhdGUgX2Rlc3Ryb3lQbGFjZWhvbGRlcigpIHtcbiAgICB0aGlzLl9wbGFjZWhvbGRlcj8ucmVtb3ZlKCk7XG4gICAgdGhpcy5fcGxhY2Vob2xkZXJSZWY/LmRlc3Ryb3koKTtcbiAgICB0aGlzLl9wbGFjZWhvbGRlciA9IHRoaXMuX3BsYWNlaG9sZGVyUmVmID0gbnVsbCE7XG4gIH1cblxuICAvKiogSGFuZGxlciBmb3IgdGhlIGBtb3VzZWRvd25gL2B0b3VjaHN0YXJ0YCBldmVudHMuICovXG4gIHByaXZhdGUgX3BvaW50ZXJEb3duID0gKGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCkgPT4ge1xuICAgIHRoaXMuYmVmb3JlU3RhcnRlZC5uZXh0KCk7XG5cbiAgICAvLyBEZWxlZ2F0ZSB0aGUgZXZlbnQgYmFzZWQgb24gd2hldGhlciBpdCBzdGFydGVkIGZyb20gYSBoYW5kbGUgb3IgdGhlIGVsZW1lbnQgaXRzZWxmLlxuICAgIGlmICh0aGlzLl9oYW5kbGVzLmxlbmd0aCkge1xuICAgICAgY29uc3QgdGFyZ2V0SGFuZGxlID0gdGhpcy5fZ2V0VGFyZ2V0SGFuZGxlKGV2ZW50KTtcblxuICAgICAgaWYgKHRhcmdldEhhbmRsZSAmJiAhdGhpcy5fZGlzYWJsZWRIYW5kbGVzLmhhcyh0YXJnZXRIYW5kbGUpICYmICF0aGlzLmRpc2FibGVkKSB7XG4gICAgICAgIHRoaXMuX2luaXRpYWxpemVEcmFnU2VxdWVuY2UodGFyZ2V0SGFuZGxlLCBldmVudCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICghdGhpcy5kaXNhYmxlZCkge1xuICAgICAgdGhpcy5faW5pdGlhbGl6ZURyYWdTZXF1ZW5jZSh0aGlzLl9yb290RWxlbWVudCwgZXZlbnQpO1xuICAgIH1cbiAgfTtcblxuICAvKiogSGFuZGxlciB0aGF0IGlzIGludm9rZWQgd2hlbiB0aGUgdXNlciBtb3ZlcyB0aGVpciBwb2ludGVyIGFmdGVyIHRoZXkndmUgaW5pdGlhdGVkIGEgZHJhZy4gKi9cbiAgcHJpdmF0ZSBfcG9pbnRlck1vdmUgPSAoZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KSA9PiB7XG4gICAgY29uc3QgcG9pbnRlclBvc2l0aW9uID0gdGhpcy5fZ2V0UG9pbnRlclBvc2l0aW9uT25QYWdlKGV2ZW50KTtcblxuICAgIGlmICghdGhpcy5faGFzU3RhcnRlZERyYWdnaW5nKSB7XG4gICAgICBjb25zdCBkaXN0YW5jZVggPSBNYXRoLmFicyhwb2ludGVyUG9zaXRpb24ueCAtIHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLngpO1xuICAgICAgY29uc3QgZGlzdGFuY2VZID0gTWF0aC5hYnMocG9pbnRlclBvc2l0aW9uLnkgLSB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZS55KTtcbiAgICAgIGNvbnN0IGlzT3ZlclRocmVzaG9sZCA9IGRpc3RhbmNlWCArIGRpc3RhbmNlWSA+PSB0aGlzLl9jb25maWcuZHJhZ1N0YXJ0VGhyZXNob2xkO1xuXG4gICAgICAvLyBPbmx5IHN0YXJ0IGRyYWdnaW5nIGFmdGVyIHRoZSB1c2VyIGhhcyBtb3ZlZCBtb3JlIHRoYW4gdGhlIG1pbmltdW0gZGlzdGFuY2UgaW4gZWl0aGVyXG4gICAgICAvLyBkaXJlY3Rpb24uIE5vdGUgdGhhdCB0aGlzIGlzIHByZWZlcmFibGUgb3ZlciBkb2luZyBzb21ldGhpbmcgbGlrZSBgc2tpcChtaW5pbXVtRGlzdGFuY2UpYFxuICAgICAgLy8gaW4gdGhlIGBwb2ludGVyTW92ZWAgc3Vic2NyaXB0aW9uLCBiZWNhdXNlIHdlJ3JlIG5vdCBndWFyYW50ZWVkIHRvIGhhdmUgb25lIG1vdmUgZXZlbnRcbiAgICAgIC8vIHBlciBwaXhlbCBvZiBtb3ZlbWVudCAoZS5nLiBpZiB0aGUgdXNlciBtb3ZlcyB0aGVpciBwb2ludGVyIHF1aWNrbHkpLlxuICAgICAgaWYgKGlzT3ZlclRocmVzaG9sZCkge1xuICAgICAgICBjb25zdCBpc0RlbGF5RWxhcHNlZCA9IERhdGUubm93KCkgPj0gdGhpcy5fZHJhZ1N0YXJ0VGltZSArIHRoaXMuX2dldERyYWdTdGFydERlbGF5KGV2ZW50KTtcbiAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5fZHJvcENvbnRhaW5lcjtcblxuICAgICAgICBpZiAoIWlzRGVsYXlFbGFwc2VkKSB7XG4gICAgICAgICAgdGhpcy5fZW5kRHJhZ1NlcXVlbmNlKGV2ZW50KTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcmV2ZW50IG90aGVyIGRyYWcgc2VxdWVuY2VzIGZyb20gc3RhcnRpbmcgd2hpbGUgc29tZXRoaW5nIGluIHRoZSBjb250YWluZXIgaXMgc3RpbGxcbiAgICAgICAgLy8gYmVpbmcgZHJhZ2dlZC4gVGhpcyBjYW4gaGFwcGVuIHdoaWxlIHdlJ3JlIHdhaXRpbmcgZm9yIHRoZSBkcm9wIGFuaW1hdGlvbiB0byBmaW5pc2hcbiAgICAgICAgLy8gYW5kIGNhbiBjYXVzZSBlcnJvcnMsIGJlY2F1c2Ugc29tZSBlbGVtZW50cyBtaWdodCBzdGlsbCBiZSBtb3ZpbmcgYXJvdW5kLlxuICAgICAgICBpZiAoIWNvbnRhaW5lciB8fCAoIWNvbnRhaW5lci5pc0RyYWdnaW5nKCkgJiYgIWNvbnRhaW5lci5pc1JlY2VpdmluZygpKSkge1xuICAgICAgICAgIC8vIFByZXZlbnQgdGhlIGRlZmF1bHQgYWN0aW9uIGFzIHNvb24gYXMgdGhlIGRyYWdnaW5nIHNlcXVlbmNlIGlzIGNvbnNpZGVyZWQgYXNcbiAgICAgICAgICAvLyBcInN0YXJ0ZWRcIiBzaW5jZSB3YWl0aW5nIGZvciB0aGUgbmV4dCBldmVudCBjYW4gYWxsb3cgdGhlIGRldmljZSB0byBiZWdpbiBzY3JvbGxpbmcuXG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB0aGlzLl9oYXNTdGFydGVkRHJhZ2dpbmcgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4gdGhpcy5fc3RhcnREcmFnU2VxdWVuY2UoZXZlbnQpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gV2UgcHJldmVudCB0aGUgZGVmYXVsdCBhY3Rpb24gZG93biBoZXJlIHNvIHRoYXQgd2Uga25vdyB0aGF0IGRyYWdnaW5nIGhhcyBzdGFydGVkLiBUaGlzIGlzXG4gICAgLy8gaW1wb3J0YW50IGZvciB0b3VjaCBkZXZpY2VzIHdoZXJlIGRvaW5nIHRoaXMgdG9vIGVhcmx5IGNhbiB1bm5lY2Vzc2FyaWx5IGJsb2NrIHNjcm9sbGluZyxcbiAgICAvLyBpZiB0aGVyZSdzIGEgZHJhZ2dpbmcgZGVsYXkuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIGNvbnN0IGNvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uID0gdGhpcy5fZ2V0Q29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24ocG9pbnRlclBvc2l0aW9uKTtcbiAgICB0aGlzLl9oYXNNb3ZlZCA9IHRydWU7XG4gICAgdGhpcy5fbGFzdEtub3duUG9pbnRlclBvc2l0aW9uID0gcG9pbnRlclBvc2l0aW9uO1xuICAgIHRoaXMuX3VwZGF0ZVBvaW50ZXJEaXJlY3Rpb25EZWx0YShjb25zdHJhaW5lZFBvaW50ZXJQb3NpdGlvbik7XG5cbiAgICBpZiAodGhpcy5fZHJvcENvbnRhaW5lcikge1xuICAgICAgdGhpcy5fdXBkYXRlQWN0aXZlRHJvcENvbnRhaW5lcihjb25zdHJhaW5lZFBvaW50ZXJQb3NpdGlvbiwgcG9pbnRlclBvc2l0aW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgdGhlcmUncyBhIHBvc2l0aW9uIGNvbnN0cmFpbnQgZnVuY3Rpb24sIHdlIHdhbnQgdGhlIGVsZW1lbnQncyB0b3AvbGVmdCB0byBiZSBhdCB0aGVcbiAgICAgIC8vIHNwZWNpZmljIHBvc2l0aW9uIG9uIHRoZSBwYWdlLiBVc2UgdGhlIGluaXRpYWwgcG9zaXRpb24gYXMgYSByZWZlcmVuY2UgaWYgdGhhdCdzIHRoZSBjYXNlLlxuICAgICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy5jb25zdHJhaW5Qb3NpdGlvbiA/IHRoaXMuX2luaXRpYWxDbGllbnRSZWN0ISA6IHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlO1xuICAgICAgY29uc3QgYWN0aXZlVHJhbnNmb3JtID0gdGhpcy5fYWN0aXZlVHJhbnNmb3JtO1xuICAgICAgYWN0aXZlVHJhbnNmb3JtLnggPSBjb25zdHJhaW5lZFBvaW50ZXJQb3NpdGlvbi54IC0gb2Zmc2V0LnggKyB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtLng7XG4gICAgICBhY3RpdmVUcmFuc2Zvcm0ueSA9IGNvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uLnkgLSBvZmZzZXQueSArIHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm0ueTtcbiAgICAgIHRoaXMuX2FwcGx5Um9vdEVsZW1lbnRUcmFuc2Zvcm0oYWN0aXZlVHJhbnNmb3JtLngsIGFjdGl2ZVRyYW5zZm9ybS55KTtcbiAgICB9XG5cbiAgICAvLyBTaW5jZSB0aGlzIGV2ZW50IGdldHMgZmlyZWQgZm9yIGV2ZXJ5IHBpeGVsIHdoaWxlIGRyYWdnaW5nLCB3ZSBvbmx5XG4gICAgLy8gd2FudCB0byBmaXJlIGl0IGlmIHRoZSBjb25zdW1lciBvcHRlZCBpbnRvIGl0LiBBbHNvIHdlIGhhdmUgdG9cbiAgICAvLyByZS1lbnRlciB0aGUgem9uZSBiZWNhdXNlIHdlIHJ1biBhbGwgb2YgdGhlIGV2ZW50cyBvbiB0aGUgb3V0c2lkZS5cbiAgICBpZiAodGhpcy5fbW92ZUV2ZW50cy5vYnNlcnZlcnMubGVuZ3RoKSB7XG4gICAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5fbW92ZUV2ZW50cy5uZXh0KHtcbiAgICAgICAgICBzb3VyY2U6IHRoaXMsXG4gICAgICAgICAgcG9pbnRlclBvc2l0aW9uOiBjb25zdHJhaW5lZFBvaW50ZXJQb3NpdGlvbixcbiAgICAgICAgICBldmVudCxcbiAgICAgICAgICBkaXN0YW5jZTogdGhpcy5fZ2V0RHJhZ0Rpc3RhbmNlKGNvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uKSxcbiAgICAgICAgICBkZWx0YTogdGhpcy5fcG9pbnRlckRpcmVjdGlvbkRlbHRhLFxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAvKiogSGFuZGxlciB0aGF0IGlzIGludm9rZWQgd2hlbiB0aGUgdXNlciBsaWZ0cyB0aGVpciBwb2ludGVyIHVwLCBhZnRlciBpbml0aWF0aW5nIGEgZHJhZy4gKi9cbiAgcHJpdmF0ZSBfcG9pbnRlclVwID0gKGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCkgPT4ge1xuICAgIHRoaXMuX2VuZERyYWdTZXF1ZW5jZShldmVudCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENsZWFycyBzdWJzY3JpcHRpb25zIGFuZCBzdG9wcyB0aGUgZHJhZ2dpbmcgc2VxdWVuY2UuXG4gICAqIEBwYXJhbSBldmVudCBCcm93c2VyIGV2ZW50IG9iamVjdCB0aGF0IGVuZGVkIHRoZSBzZXF1ZW5jZS5cbiAgICovXG4gIHByaXZhdGUgX2VuZERyYWdTZXF1ZW5jZShldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpIHtcbiAgICAvLyBOb3RlIHRoYXQgaGVyZSB3ZSB1c2UgYGlzRHJhZ2dpbmdgIGZyb20gdGhlIHNlcnZpY2UsIHJhdGhlciB0aGFuIGZyb20gYHRoaXNgLlxuICAgIC8vIFRoZSBkaWZmZXJlbmNlIGlzIHRoYXQgdGhlIG9uZSBmcm9tIHRoZSBzZXJ2aWNlIHJlZmxlY3RzIHdoZXRoZXIgYSBkcmFnZ2luZyBzZXF1ZW5jZVxuICAgIC8vIGhhcyBiZWVuIGluaXRpYXRlZCwgd2hlcmVhcyB0aGUgb25lIG9uIGB0aGlzYCBpbmNsdWRlcyB3aGV0aGVyIHRoZSB1c2VyIGhhcyBwYXNzZWRcbiAgICAvLyB0aGUgbWluaW11bSBkcmFnZ2luZyB0aHJlc2hvbGQuXG4gICAgaWYgKCF0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LmlzRHJhZ2dpbmcodGhpcykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9yZW1vdmVTdWJzY3JpcHRpb25zKCk7XG4gICAgdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5zdG9wRHJhZ2dpbmcodGhpcyk7XG4gICAgdGhpcy5fdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucygpO1xuXG4gICAgaWYgKHRoaXMuX2hhbmRsZXMpIHtcbiAgICAgICh0aGlzLl9yb290RWxlbWVudC5zdHlsZSBhcyBEcmFnQ1NTU3R5bGVEZWNsYXJhdGlvbikud2Via2l0VGFwSGlnaGxpZ2h0Q29sb3IgPVxuICAgICAgICB0aGlzLl9yb290RWxlbWVudFRhcEhpZ2hsaWdodDtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX2hhc1N0YXJ0ZWREcmFnZ2luZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMucmVsZWFzZWQubmV4dCh7c291cmNlOiB0aGlzLCBldmVudH0pO1xuXG4gICAgaWYgKHRoaXMuX2Ryb3BDb250YWluZXIpIHtcbiAgICAgIC8vIFN0b3Agc2Nyb2xsaW5nIGltbWVkaWF0ZWx5LCBpbnN0ZWFkIG9mIHdhaXRpbmcgZm9yIHRoZSBhbmltYXRpb24gdG8gZmluaXNoLlxuICAgICAgdGhpcy5fZHJvcENvbnRhaW5lci5fc3RvcFNjcm9sbGluZygpO1xuICAgICAgdGhpcy5fYW5pbWF0ZVByZXZpZXdUb1BsYWNlaG9sZGVyKCkudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMuX2NsZWFudXBEcmFnQXJ0aWZhY3RzKGV2ZW50KTtcbiAgICAgICAgdGhpcy5fY2xlYW51cENhY2hlZERpbWVuc2lvbnMoKTtcbiAgICAgICAgdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5zdG9wRHJhZ2dpbmcodGhpcyk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQ29udmVydCB0aGUgYWN0aXZlIHRyYW5zZm9ybSBpbnRvIGEgcGFzc2l2ZSBvbmUuIFRoaXMgbWVhbnMgdGhhdCBuZXh0IHRpbWVcbiAgICAgIC8vIHRoZSB1c2VyIHN0YXJ0cyBkcmFnZ2luZyB0aGUgaXRlbSwgaXRzIHBvc2l0aW9uIHdpbGwgYmUgY2FsY3VsYXRlZCByZWxhdGl2ZWx5XG4gICAgICAvLyB0byB0aGUgbmV3IHBhc3NpdmUgdHJhbnNmb3JtLlxuICAgICAgdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybS54ID0gdGhpcy5fYWN0aXZlVHJhbnNmb3JtLng7XG4gICAgICBjb25zdCBwb2ludGVyUG9zaXRpb24gPSB0aGlzLl9nZXRQb2ludGVyUG9zaXRpb25PblBhZ2UoZXZlbnQpO1xuICAgICAgdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybS55ID0gdGhpcy5fYWN0aXZlVHJhbnNmb3JtLnk7XG4gICAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5lbmRlZC5uZXh0KHtcbiAgICAgICAgICBzb3VyY2U6IHRoaXMsXG4gICAgICAgICAgZGlzdGFuY2U6IHRoaXMuX2dldERyYWdEaXN0YW5jZShwb2ludGVyUG9zaXRpb24pLFxuICAgICAgICAgIGRyb3BQb2ludDogcG9pbnRlclBvc2l0aW9uLFxuICAgICAgICAgIGV2ZW50LFxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5fY2xlYW51cENhY2hlZERpbWVuc2lvbnMoKTtcbiAgICAgIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuc3RvcERyYWdnaW5nKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTdGFydHMgdGhlIGRyYWdnaW5nIHNlcXVlbmNlLiAqL1xuICBwcml2YXRlIF9zdGFydERyYWdTZXF1ZW5jZShldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpIHtcbiAgICBpZiAoaXNUb3VjaEV2ZW50KGV2ZW50KSkge1xuICAgICAgdGhpcy5fbGFzdFRvdWNoRXZlbnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICB9XG5cbiAgICB0aGlzLl90b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKCk7XG5cbiAgICBjb25zdCBkcm9wQ29udGFpbmVyID0gdGhpcy5fZHJvcENvbnRhaW5lcjtcblxuICAgIGlmIChkcm9wQ29udGFpbmVyKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fcm9vdEVsZW1lbnQ7XG4gICAgICBjb25zdCBwYXJlbnQgPSBlbGVtZW50LnBhcmVudE5vZGUgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICBjb25zdCBwbGFjZWhvbGRlciA9ICh0aGlzLl9wbGFjZWhvbGRlciA9IHRoaXMuX2NyZWF0ZVBsYWNlaG9sZGVyRWxlbWVudCgpKTtcbiAgICAgIGNvbnN0IGFuY2hvciA9ICh0aGlzLl9hbmNob3IgPSB0aGlzLl9hbmNob3IgfHwgdGhpcy5fZG9jdW1lbnQuY3JlYXRlQ29tbWVudCgnJykpO1xuXG4gICAgICAvLyBOZWVkcyB0byBoYXBwZW4gYmVmb3JlIHRoZSByb290IGVsZW1lbnQgaXMgbW92ZWQuXG4gICAgICBjb25zdCBzaGFkb3dSb290ID0gdGhpcy5fZ2V0U2hhZG93Um9vdCgpO1xuXG4gICAgICAvLyBJbnNlcnQgYW4gYW5jaG9yIG5vZGUgc28gdGhhdCB3ZSBjYW4gcmVzdG9yZSB0aGUgZWxlbWVudCdzIHBvc2l0aW9uIGluIHRoZSBET00uXG4gICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGFuY2hvciwgZWxlbWVudCk7XG5cbiAgICAgIC8vIFRoZXJlJ3Mgbm8gcmlzayBvZiB0cmFuc2Zvcm1zIHN0YWNraW5nIHdoZW4gaW5zaWRlIGEgZHJvcCBjb250YWluZXIgc29cbiAgICAgIC8vIHdlIGNhbiBrZWVwIHRoZSBpbml0aWFsIHRyYW5zZm9ybSB1cCB0byBkYXRlIGFueSB0aW1lIGRyYWdnaW5nIHN0YXJ0cy5cbiAgICAgIHRoaXMuX2luaXRpYWxUcmFuc2Zvcm0gPSBlbGVtZW50LnN0eWxlLnRyYW5zZm9ybSB8fCAnJztcblxuICAgICAgLy8gQ3JlYXRlIHRoZSBwcmV2aWV3IGFmdGVyIHRoZSBpbml0aWFsIHRyYW5zZm9ybSBoYXNcbiAgICAgIC8vIGJlZW4gY2FjaGVkLCBiZWNhdXNlIGl0IGNhbiBiZSBhZmZlY3RlZCBieSB0aGUgdHJhbnNmb3JtLlxuICAgICAgdGhpcy5fcHJldmlldyA9IHRoaXMuX2NyZWF0ZVByZXZpZXdFbGVtZW50KCk7XG5cbiAgICAgIC8vIFdlIG1vdmUgdGhlIGVsZW1lbnQgb3V0IGF0IHRoZSBlbmQgb2YgdGhlIGJvZHkgYW5kIHdlIG1ha2UgaXQgaGlkZGVuLCBiZWNhdXNlIGtlZXBpbmcgaXQgaW5cbiAgICAgIC8vIHBsYWNlIHdpbGwgdGhyb3cgb2ZmIHRoZSBjb25zdW1lcidzIGA6bGFzdC1jaGlsZGAgc2VsZWN0b3JzLiBXZSBjYW4ndCByZW1vdmUgdGhlIGVsZW1lbnRcbiAgICAgIC8vIGZyb20gdGhlIERPTSBjb21wbGV0ZWx5LCBiZWNhdXNlIGlPUyB3aWxsIHN0b3AgZmlyaW5nIGFsbCBzdWJzZXF1ZW50IGV2ZW50cyBpbiB0aGUgY2hhaW4uXG4gICAgICB0b2dnbGVWaXNpYmlsaXR5KGVsZW1lbnQsIGZhbHNlLCBkcmFnSW1wb3J0YW50UHJvcGVydGllcyk7XG4gICAgICB0aGlzLl9kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHBhcmVudC5yZXBsYWNlQ2hpbGQocGxhY2Vob2xkZXIsIGVsZW1lbnQpKTtcbiAgICAgIHRoaXMuX2dldFByZXZpZXdJbnNlcnRpb25Qb2ludChwYXJlbnQsIHNoYWRvd1Jvb3QpLmFwcGVuZENoaWxkKHRoaXMuX3ByZXZpZXcpO1xuICAgICAgdGhpcy5zdGFydGVkLm5leHQoe3NvdXJjZTogdGhpcywgZXZlbnR9KTsgLy8gRW1pdCBiZWZvcmUgbm90aWZ5aW5nIHRoZSBjb250YWluZXIuXG4gICAgICBkcm9wQ29udGFpbmVyLnN0YXJ0KCk7XG4gICAgICB0aGlzLl9pbml0aWFsQ29udGFpbmVyID0gZHJvcENvbnRhaW5lcjtcbiAgICAgIHRoaXMuX2luaXRpYWxJbmRleCA9IGRyb3BDb250YWluZXIuZ2V0SXRlbUluZGV4KHRoaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnN0YXJ0ZWQubmV4dCh7c291cmNlOiB0aGlzLCBldmVudH0pO1xuICAgICAgdGhpcy5faW5pdGlhbENvbnRhaW5lciA9IHRoaXMuX2luaXRpYWxJbmRleCA9IHVuZGVmaW5lZCE7XG4gICAgfVxuXG4gICAgLy8gSW1wb3J0YW50IHRvIHJ1biBhZnRlciB3ZSd2ZSBjYWxsZWQgYHN0YXJ0YCBvbiB0aGUgcGFyZW50IGNvbnRhaW5lclxuICAgIC8vIHNvIHRoYXQgaXQgaGFzIGhhZCB0aW1lIHRvIHJlc29sdmUgaXRzIHNjcm9sbGFibGUgcGFyZW50cy5cbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuY2FjaGUoZHJvcENvbnRhaW5lciA/IGRyb3BDb250YWluZXIuZ2V0U2Nyb2xsYWJsZVBhcmVudHMoKSA6IFtdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIHRoZSBkaWZmZXJlbnQgdmFyaWFibGVzIGFuZCBzdWJzY3JpcHRpb25zXG4gICAqIHRoYXQgd2lsbCBiZSBuZWNlc3NhcnkgZm9yIHRoZSBkcmFnZ2luZyBzZXF1ZW5jZS5cbiAgICogQHBhcmFtIHJlZmVyZW5jZUVsZW1lbnQgRWxlbWVudCB0aGF0IHN0YXJ0ZWQgdGhlIGRyYWcgc2VxdWVuY2UuXG4gICAqIEBwYXJhbSBldmVudCBCcm93c2VyIGV2ZW50IG9iamVjdCB0aGF0IHN0YXJ0ZWQgdGhlIHNlcXVlbmNlLlxuICAgKi9cbiAgcHJpdmF0ZSBfaW5pdGlhbGl6ZURyYWdTZXF1ZW5jZShyZWZlcmVuY2VFbGVtZW50OiBIVE1MRWxlbWVudCwgZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KSB7XG4gICAgLy8gU3RvcCBwcm9wYWdhdGlvbiBpZiB0aGUgaXRlbSBpcyBpbnNpZGUgYW5vdGhlclxuICAgIC8vIGRyYWdnYWJsZSBzbyB3ZSBkb24ndCBzdGFydCBtdWx0aXBsZSBkcmFnIHNlcXVlbmNlcy5cbiAgICBpZiAodGhpcy5fcGFyZW50RHJhZ1JlZikge1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfVxuXG4gICAgY29uc3QgaXNEcmFnZ2luZyA9IHRoaXMuaXNEcmFnZ2luZygpO1xuICAgIGNvbnN0IGlzVG91Y2hTZXF1ZW5jZSA9IGlzVG91Y2hFdmVudChldmVudCk7XG4gICAgY29uc3QgaXNBdXhpbGlhcnlNb3VzZUJ1dHRvbiA9ICFpc1RvdWNoU2VxdWVuY2UgJiYgKGV2ZW50IGFzIE1vdXNlRXZlbnQpLmJ1dHRvbiAhPT0gMDtcbiAgICBjb25zdCByb290RWxlbWVudCA9IHRoaXMuX3Jvb3RFbGVtZW50O1xuICAgIGNvbnN0IHRhcmdldCA9IF9nZXRFdmVudFRhcmdldChldmVudCk7XG4gICAgY29uc3QgaXNTeW50aGV0aWNFdmVudCA9XG4gICAgICAhaXNUb3VjaFNlcXVlbmNlICYmXG4gICAgICB0aGlzLl9sYXN0VG91Y2hFdmVudFRpbWUgJiZcbiAgICAgIHRoaXMuX2xhc3RUb3VjaEV2ZW50VGltZSArIE1PVVNFX0VWRU5UX0lHTk9SRV9USU1FID4gRGF0ZS5ub3coKTtcbiAgICBjb25zdCBpc0Zha2VFdmVudCA9IGlzVG91Y2hTZXF1ZW5jZVxuICAgICAgPyBpc0Zha2VUb3VjaHN0YXJ0RnJvbVNjcmVlblJlYWRlcihldmVudCBhcyBUb3VjaEV2ZW50KVxuICAgICAgOiBpc0Zha2VNb3VzZWRvd25Gcm9tU2NyZWVuUmVhZGVyKGV2ZW50IGFzIE1vdXNlRXZlbnQpO1xuXG4gICAgLy8gSWYgdGhlIGV2ZW50IHN0YXJ0ZWQgZnJvbSBhbiBlbGVtZW50IHdpdGggdGhlIG5hdGl2ZSBIVE1MIGRyYWcmZHJvcCwgaXQnbGwgaW50ZXJmZXJlXG4gICAgLy8gd2l0aCBvdXIgb3duIGRyYWdnaW5nIChlLmcuIGBpbWdgIHRhZ3MgZG8gaXQgYnkgZGVmYXVsdCkuIFByZXZlbnQgdGhlIGRlZmF1bHQgYWN0aW9uXG4gICAgLy8gdG8gc3RvcCBpdCBmcm9tIGhhcHBlbmluZy4gTm90ZSB0aGF0IHByZXZlbnRpbmcgb24gYGRyYWdzdGFydGAgYWxzbyBzZWVtcyB0byB3b3JrLCBidXRcbiAgICAvLyBpdCdzIGZsYWt5IGFuZCBpdCBmYWlscyBpZiB0aGUgdXNlciBkcmFncyBpdCBhd2F5IHF1aWNrbHkuIEFsc28gbm90ZSB0aGF0IHdlIG9ubHkgd2FudFxuICAgIC8vIHRvIGRvIHRoaXMgZm9yIGBtb3VzZWRvd25gIHNpbmNlIGRvaW5nIHRoZSBzYW1lIGZvciBgdG91Y2hzdGFydGAgd2lsbCBzdG9wIGFueSBgY2xpY2tgXG4gICAgLy8gZXZlbnRzIGZyb20gZmlyaW5nIG9uIHRvdWNoIGRldmljZXMuXG4gICAgaWYgKHRhcmdldCAmJiAodGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5kcmFnZ2FibGUgJiYgZXZlbnQudHlwZSA9PT0gJ21vdXNlZG93bicpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuXG4gICAgLy8gQWJvcnQgaWYgdGhlIHVzZXIgaXMgYWxyZWFkeSBkcmFnZ2luZyBvciBpcyB1c2luZyBhIG1vdXNlIGJ1dHRvbiBvdGhlciB0aGFuIHRoZSBwcmltYXJ5IG9uZS5cbiAgICBpZiAoaXNEcmFnZ2luZyB8fCBpc0F1eGlsaWFyeU1vdXNlQnV0dG9uIHx8IGlzU3ludGhldGljRXZlbnQgfHwgaXNGYWtlRXZlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSd2ZSBnb3QgaGFuZGxlcywgd2UgbmVlZCB0byBkaXNhYmxlIHRoZSB0YXAgaGlnaGxpZ2h0IG9uIHRoZSBlbnRpcmUgcm9vdCBlbGVtZW50LFxuICAgIC8vIG90aGVyd2lzZSBpT1Mgd2lsbCBzdGlsbCBhZGQgaXQsIGV2ZW4gdGhvdWdoIGFsbCB0aGUgZHJhZyBpbnRlcmFjdGlvbnMgb24gdGhlIGhhbmRsZVxuICAgIC8vIGFyZSBkaXNhYmxlZC5cbiAgICBpZiAodGhpcy5faGFuZGxlcy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHJvb3RTdHlsZXMgPSByb290RWxlbWVudC5zdHlsZSBhcyBEcmFnQ1NTU3R5bGVEZWNsYXJhdGlvbjtcbiAgICAgIHRoaXMuX3Jvb3RFbGVtZW50VGFwSGlnaGxpZ2h0ID0gcm9vdFN0eWxlcy53ZWJraXRUYXBIaWdobGlnaHRDb2xvciB8fCAnJztcbiAgICAgIHJvb3RTdHlsZXMud2Via2l0VGFwSGlnaGxpZ2h0Q29sb3IgPSAndHJhbnNwYXJlbnQnO1xuICAgIH1cblxuICAgIHRoaXMuX2hhc1N0YXJ0ZWREcmFnZ2luZyA9IHRoaXMuX2hhc01vdmVkID0gZmFsc2U7XG5cbiAgICAvLyBBdm9pZCBtdWx0aXBsZSBzdWJzY3JpcHRpb25zIGFuZCBtZW1vcnkgbGVha3Mgd2hlbiBtdWx0aSB0b3VjaFxuICAgIC8vIChpc0RyYWdnaW5nIGNoZWNrIGFib3ZlIGlzbid0IGVub3VnaCBiZWNhdXNlIG9mIHBvc3NpYmxlIHRlbXBvcmFsIGFuZC9vciBkaW1lbnNpb25hbCBkZWxheXMpXG4gICAgdGhpcy5fcmVtb3ZlU3Vic2NyaXB0aW9ucygpO1xuICAgIHRoaXMuX2luaXRpYWxDbGllbnRSZWN0ID0gdGhpcy5fcm9vdEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgdGhpcy5fcG9pbnRlck1vdmVTdWJzY3JpcHRpb24gPSB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnBvaW50ZXJNb3ZlLnN1YnNjcmliZSh0aGlzLl9wb2ludGVyTW92ZSk7XG4gICAgdGhpcy5fcG9pbnRlclVwU3Vic2NyaXB0aW9uID0gdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5wb2ludGVyVXAuc3Vic2NyaWJlKHRoaXMuX3BvaW50ZXJVcCk7XG4gICAgdGhpcy5fc2Nyb2xsU3Vic2NyaXB0aW9uID0gdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeVxuICAgICAgLnNjcm9sbGVkKHRoaXMuX2dldFNoYWRvd1Jvb3QoKSlcbiAgICAgIC5zdWJzY3JpYmUoc2Nyb2xsRXZlbnQgPT4gdGhpcy5fdXBkYXRlT25TY3JvbGwoc2Nyb2xsRXZlbnQpKTtcblxuICAgIGlmICh0aGlzLl9ib3VuZGFyeUVsZW1lbnQpIHtcbiAgICAgIHRoaXMuX2JvdW5kYXJ5UmVjdCA9IGdldE11dGFibGVDbGllbnRSZWN0KHRoaXMuX2JvdW5kYXJ5RWxlbWVudCk7XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgaGF2ZSBhIGN1c3RvbSBwcmV2aWV3IHdlIGNhbid0IGtub3cgYWhlYWQgb2YgdGltZSBob3cgbGFyZ2UgaXQnbGwgYmUgc28gd2UgcG9zaXRpb25cbiAgICAvLyBpdCBuZXh0IHRvIHRoZSBjdXJzb3IuIFRoZSBleGNlcHRpb24gaXMgd2hlbiB0aGUgY29uc3VtZXIgaGFzIG9wdGVkIGludG8gbWFraW5nIHRoZSBwcmV2aWV3XG4gICAgLy8gdGhlIHNhbWUgc2l6ZSBhcyB0aGUgcm9vdCBlbGVtZW50LCBpbiB3aGljaCBjYXNlIHdlIGRvIGtub3cgdGhlIHNpemUuXG4gICAgY29uc3QgcHJldmlld1RlbXBsYXRlID0gdGhpcy5fcHJldmlld1RlbXBsYXRlO1xuICAgIHRoaXMuX3BpY2t1cFBvc2l0aW9uSW5FbGVtZW50ID1cbiAgICAgIHByZXZpZXdUZW1wbGF0ZSAmJiBwcmV2aWV3VGVtcGxhdGUudGVtcGxhdGUgJiYgIXByZXZpZXdUZW1wbGF0ZS5tYXRjaFNpemVcbiAgICAgICAgPyB7eDogMCwgeTogMH1cbiAgICAgICAgOiB0aGlzLl9nZXRQb2ludGVyUG9zaXRpb25JbkVsZW1lbnQodGhpcy5faW5pdGlhbENsaWVudFJlY3QsIHJlZmVyZW5jZUVsZW1lbnQsIGV2ZW50KTtcbiAgICBjb25zdCBwb2ludGVyUG9zaXRpb24gPVxuICAgICAgKHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlID1cbiAgICAgIHRoaXMuX2xhc3RLbm93blBvaW50ZXJQb3NpdGlvbiA9XG4gICAgICAgIHRoaXMuX2dldFBvaW50ZXJQb3NpdGlvbk9uUGFnZShldmVudCkpO1xuICAgIHRoaXMuX3BvaW50ZXJEaXJlY3Rpb25EZWx0YSA9IHt4OiAwLCB5OiAwfTtcbiAgICB0aGlzLl9wb2ludGVyUG9zaXRpb25BdExhc3REaXJlY3Rpb25DaGFuZ2UgPSB7eDogcG9pbnRlclBvc2l0aW9uLngsIHk6IHBvaW50ZXJQb3NpdGlvbi55fTtcbiAgICB0aGlzLl9kcmFnU3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnN0YXJ0RHJhZ2dpbmcodGhpcywgZXZlbnQpO1xuICB9XG5cbiAgLyoqIENsZWFucyB1cCB0aGUgRE9NIGFydGlmYWN0cyB0aGF0IHdlcmUgYWRkZWQgdG8gZmFjaWxpdGF0ZSB0aGUgZWxlbWVudCBiZWluZyBkcmFnZ2VkLiAqL1xuICBwcml2YXRlIF9jbGVhbnVwRHJhZ0FydGlmYWN0cyhldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpIHtcbiAgICAvLyBSZXN0b3JlIHRoZSBlbGVtZW50J3MgdmlzaWJpbGl0eSBhbmQgaW5zZXJ0IGl0IGF0IGl0cyBvbGQgcG9zaXRpb24gaW4gdGhlIERPTS5cbiAgICAvLyBJdCdzIGltcG9ydGFudCB0aGF0IHdlIG1haW50YWluIHRoZSBwb3NpdGlvbiwgYmVjYXVzZSBtb3ZpbmcgdGhlIGVsZW1lbnQgYXJvdW5kIGluIHRoZSBET01cbiAgICAvLyBjYW4gdGhyb3cgb2ZmIGBOZ0ZvcmAgd2hpY2ggZG9lcyBzbWFydCBkaWZmaW5nIGFuZCByZS1jcmVhdGVzIGVsZW1lbnRzIG9ubHkgd2hlbiBuZWNlc3NhcnksXG4gICAgLy8gd2hpbGUgbW92aW5nIHRoZSBleGlzdGluZyBlbGVtZW50cyBpbiBhbGwgb3RoZXIgY2FzZXMuXG4gICAgdG9nZ2xlVmlzaWJpbGl0eSh0aGlzLl9yb290RWxlbWVudCwgdHJ1ZSwgZHJhZ0ltcG9ydGFudFByb3BlcnRpZXMpO1xuICAgIHRoaXMuX2FuY2hvci5wYXJlbnROb2RlIS5yZXBsYWNlQ2hpbGQodGhpcy5fcm9vdEVsZW1lbnQsIHRoaXMuX2FuY2hvcik7XG5cbiAgICB0aGlzLl9kZXN0cm95UHJldmlldygpO1xuICAgIHRoaXMuX2Rlc3Ryb3lQbGFjZWhvbGRlcigpO1xuICAgIHRoaXMuX2luaXRpYWxDbGllbnRSZWN0ID1cbiAgICAgIHRoaXMuX2JvdW5kYXJ5UmVjdCA9XG4gICAgICB0aGlzLl9wcmV2aWV3UmVjdCA9XG4gICAgICB0aGlzLl9pbml0aWFsVHJhbnNmb3JtID1cbiAgICAgICAgdW5kZWZpbmVkO1xuXG4gICAgLy8gUmUtZW50ZXIgdGhlIE5nWm9uZSBzaW5jZSB3ZSBib3VuZCBgZG9jdW1lbnRgIGV2ZW50cyBvbiB0aGUgb3V0c2lkZS5cbiAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuX2Ryb3BDb250YWluZXIhO1xuICAgICAgY29uc3QgY3VycmVudEluZGV4ID0gY29udGFpbmVyLmdldEl0ZW1JbmRleCh0aGlzKTtcbiAgICAgIGNvbnN0IHBvaW50ZXJQb3NpdGlvbiA9IHRoaXMuX2dldFBvaW50ZXJQb3NpdGlvbk9uUGFnZShldmVudCk7XG4gICAgICBjb25zdCBkaXN0YW5jZSA9IHRoaXMuX2dldERyYWdEaXN0YW5jZShwb2ludGVyUG9zaXRpb24pO1xuICAgICAgY29uc3QgaXNQb2ludGVyT3ZlckNvbnRhaW5lciA9IGNvbnRhaW5lci5faXNPdmVyQ29udGFpbmVyKFxuICAgICAgICBwb2ludGVyUG9zaXRpb24ueCxcbiAgICAgICAgcG9pbnRlclBvc2l0aW9uLnksXG4gICAgICApO1xuXG4gICAgICB0aGlzLmVuZGVkLm5leHQoe3NvdXJjZTogdGhpcywgZGlzdGFuY2UsIGRyb3BQb2ludDogcG9pbnRlclBvc2l0aW9uLCBldmVudH0pO1xuICAgICAgdGhpcy5kcm9wcGVkLm5leHQoe1xuICAgICAgICBpdGVtOiB0aGlzLFxuICAgICAgICBjdXJyZW50SW5kZXgsXG4gICAgICAgIHByZXZpb3VzSW5kZXg6IHRoaXMuX2luaXRpYWxJbmRleCxcbiAgICAgICAgY29udGFpbmVyOiBjb250YWluZXIsXG4gICAgICAgIHByZXZpb3VzQ29udGFpbmVyOiB0aGlzLl9pbml0aWFsQ29udGFpbmVyLFxuICAgICAgICBpc1BvaW50ZXJPdmVyQ29udGFpbmVyLFxuICAgICAgICBkaXN0YW5jZSxcbiAgICAgICAgZHJvcFBvaW50OiBwb2ludGVyUG9zaXRpb24sXG4gICAgICAgIGV2ZW50LFxuICAgICAgfSk7XG4gICAgICBjb250YWluZXIuZHJvcChcbiAgICAgICAgdGhpcyxcbiAgICAgICAgY3VycmVudEluZGV4LFxuICAgICAgICB0aGlzLl9pbml0aWFsSW5kZXgsXG4gICAgICAgIHRoaXMuX2luaXRpYWxDb250YWluZXIsXG4gICAgICAgIGlzUG9pbnRlck92ZXJDb250YWluZXIsXG4gICAgICAgIGRpc3RhbmNlLFxuICAgICAgICBwb2ludGVyUG9zaXRpb24sXG4gICAgICAgIGV2ZW50LFxuICAgICAgKTtcbiAgICAgIHRoaXMuX2Ryb3BDb250YWluZXIgPSB0aGlzLl9pbml0aWFsQ29udGFpbmVyO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGl0ZW0ncyBwb3NpdGlvbiBpbiBpdHMgZHJvcCBjb250YWluZXIsIG9yIG1vdmVzIGl0XG4gICAqIGludG8gYSBuZXcgb25lLCBkZXBlbmRpbmcgb24gaXRzIGN1cnJlbnQgZHJhZyBwb3NpdGlvbi5cbiAgICovXG4gIHByaXZhdGUgX3VwZGF0ZUFjdGl2ZURyb3BDb250YWluZXIoe3gsIHl9OiBQb2ludCwge3g6IHJhd1gsIHk6IHJhd1l9OiBQb2ludCkge1xuICAgIC8vIERyb3AgY29udGFpbmVyIHRoYXQgZHJhZ2dhYmxlIGhhcyBiZWVuIG1vdmVkIGludG8uXG4gICAgbGV0IG5ld0NvbnRhaW5lciA9IHRoaXMuX2luaXRpYWxDb250YWluZXIuX2dldFNpYmxpbmdDb250YWluZXJGcm9tUG9zaXRpb24odGhpcywgeCwgeSk7XG5cbiAgICAvLyBJZiB3ZSBjb3VsZG4ndCBmaW5kIGEgbmV3IGNvbnRhaW5lciB0byBtb3ZlIHRoZSBpdGVtIGludG8sIGFuZCB0aGUgaXRlbSBoYXMgbGVmdCBpdHNcbiAgICAvLyBpbml0aWFsIGNvbnRhaW5lciwgY2hlY2sgd2hldGhlciB0aGUgaXQncyBvdmVyIHRoZSBpbml0aWFsIGNvbnRhaW5lci4gVGhpcyBoYW5kbGVzIHRoZVxuICAgIC8vIGNhc2Ugd2hlcmUgdHdvIGNvbnRhaW5lcnMgYXJlIGNvbm5lY3RlZCBvbmUgd2F5IGFuZCB0aGUgdXNlciB0cmllcyB0byB1bmRvIGRyYWdnaW5nIGFuXG4gICAgLy8gaXRlbSBpbnRvIGEgbmV3IGNvbnRhaW5lci5cbiAgICBpZiAoXG4gICAgICAhbmV3Q29udGFpbmVyICYmXG4gICAgICB0aGlzLl9kcm9wQ29udGFpbmVyICE9PSB0aGlzLl9pbml0aWFsQ29udGFpbmVyICYmXG4gICAgICB0aGlzLl9pbml0aWFsQ29udGFpbmVyLl9pc092ZXJDb250YWluZXIoeCwgeSlcbiAgICApIHtcbiAgICAgIG5ld0NvbnRhaW5lciA9IHRoaXMuX2luaXRpYWxDb250YWluZXI7XG4gICAgfVxuXG4gICAgaWYgKG5ld0NvbnRhaW5lciAmJiBuZXdDb250YWluZXIgIT09IHRoaXMuX2Ryb3BDb250YWluZXIpIHtcbiAgICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAvLyBOb3RpZnkgdGhlIG9sZCBjb250YWluZXIgdGhhdCB0aGUgaXRlbSBoYXMgbGVmdC5cbiAgICAgICAgdGhpcy5leGl0ZWQubmV4dCh7aXRlbTogdGhpcywgY29udGFpbmVyOiB0aGlzLl9kcm9wQ29udGFpbmVyIX0pO1xuICAgICAgICB0aGlzLl9kcm9wQ29udGFpbmVyIS5leGl0KHRoaXMpO1xuICAgICAgICAvLyBOb3RpZnkgdGhlIG5ldyBjb250YWluZXIgdGhhdCB0aGUgaXRlbSBoYXMgZW50ZXJlZC5cbiAgICAgICAgdGhpcy5fZHJvcENvbnRhaW5lciA9IG5ld0NvbnRhaW5lciE7XG4gICAgICAgIHRoaXMuX2Ryb3BDb250YWluZXIuZW50ZXIoXG4gICAgICAgICAgdGhpcyxcbiAgICAgICAgICB4LFxuICAgICAgICAgIHksXG4gICAgICAgICAgbmV3Q29udGFpbmVyID09PSB0aGlzLl9pbml0aWFsQ29udGFpbmVyICYmXG4gICAgICAgICAgICAvLyBJZiB3ZSdyZSByZS1lbnRlcmluZyB0aGUgaW5pdGlhbCBjb250YWluZXIgYW5kIHNvcnRpbmcgaXMgZGlzYWJsZWQsXG4gICAgICAgICAgICAvLyBwdXQgaXRlbSB0aGUgaW50byBpdHMgc3RhcnRpbmcgaW5kZXggdG8gYmVnaW4gd2l0aC5cbiAgICAgICAgICAgIG5ld0NvbnRhaW5lci5zb3J0aW5nRGlzYWJsZWRcbiAgICAgICAgICAgID8gdGhpcy5faW5pdGlhbEluZGV4XG4gICAgICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5lbnRlcmVkLm5leHQoe1xuICAgICAgICAgIGl0ZW06IHRoaXMsXG4gICAgICAgICAgY29udGFpbmVyOiBuZXdDb250YWluZXIhLFxuICAgICAgICAgIGN1cnJlbnRJbmRleDogbmV3Q29udGFpbmVyIS5nZXRJdGVtSW5kZXgodGhpcyksXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gRHJhZ2dpbmcgbWF5IGhhdmUgYmVlbiBpbnRlcnJ1cHRlZCBhcyBhIHJlc3VsdCBvZiB0aGUgZXZlbnRzIGFib3ZlLlxuICAgIGlmICh0aGlzLmlzRHJhZ2dpbmcoKSkge1xuICAgICAgdGhpcy5fZHJvcENvbnRhaW5lciEuX3N0YXJ0U2Nyb2xsaW5nSWZOZWNlc3NhcnkocmF3WCwgcmF3WSk7XG4gICAgICB0aGlzLl9kcm9wQ29udGFpbmVyIS5fc29ydEl0ZW0odGhpcywgeCwgeSwgdGhpcy5fcG9pbnRlckRpcmVjdGlvbkRlbHRhKTtcblxuICAgICAgaWYgKHRoaXMuY29uc3RyYWluUG9zaXRpb24pIHtcbiAgICAgICAgdGhpcy5fYXBwbHlQcmV2aWV3VHJhbnNmb3JtKHgsIHkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fYXBwbHlQcmV2aWV3VHJhbnNmb3JtKFxuICAgICAgICAgIHggLSB0aGlzLl9waWNrdXBQb3NpdGlvbkluRWxlbWVudC54LFxuICAgICAgICAgIHkgLSB0aGlzLl9waWNrdXBQb3NpdGlvbkluRWxlbWVudC55LFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIHRoZSBlbGVtZW50IHRoYXQgd2lsbCBiZSByZW5kZXJlZCBuZXh0IHRvIHRoZSB1c2VyJ3MgcG9pbnRlclxuICAgKiBhbmQgd2lsbCBiZSB1c2VkIGFzIGEgcHJldmlldyBvZiB0aGUgZWxlbWVudCB0aGF0IGlzIGJlaW5nIGRyYWdnZWQuXG4gICAqL1xuICBwcml2YXRlIF9jcmVhdGVQcmV2aWV3RWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3QgcHJldmlld0NvbmZpZyA9IHRoaXMuX3ByZXZpZXdUZW1wbGF0ZTtcbiAgICBjb25zdCBwcmV2aWV3Q2xhc3MgPSB0aGlzLnByZXZpZXdDbGFzcztcbiAgICBjb25zdCBwcmV2aWV3VGVtcGxhdGUgPSBwcmV2aWV3Q29uZmlnID8gcHJldmlld0NvbmZpZy50ZW1wbGF0ZSA6IG51bGw7XG4gICAgbGV0IHByZXZpZXc6IEhUTUxFbGVtZW50O1xuXG4gICAgaWYgKHByZXZpZXdUZW1wbGF0ZSAmJiBwcmV2aWV3Q29uZmlnKSB7XG4gICAgICAvLyBNZWFzdXJlIHRoZSBlbGVtZW50IGJlZm9yZSB3ZSd2ZSBpbnNlcnRlZCB0aGUgcHJldmlld1xuICAgICAgLy8gc2luY2UgdGhlIGluc2VydGlvbiBjb3VsZCB0aHJvdyBvZmYgdGhlIG1lYXN1cmVtZW50LlxuICAgICAgY29uc3Qgcm9vdFJlY3QgPSBwcmV2aWV3Q29uZmlnLm1hdGNoU2l6ZSA/IHRoaXMuX2luaXRpYWxDbGllbnRSZWN0IDogbnVsbDtcbiAgICAgIGNvbnN0IHZpZXdSZWYgPSBwcmV2aWV3Q29uZmlnLnZpZXdDb250YWluZXIuY3JlYXRlRW1iZWRkZWRWaWV3KFxuICAgICAgICBwcmV2aWV3VGVtcGxhdGUsXG4gICAgICAgIHByZXZpZXdDb25maWcuY29udGV4dCxcbiAgICAgICk7XG4gICAgICB2aWV3UmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIHByZXZpZXcgPSBnZXRSb290Tm9kZSh2aWV3UmVmLCB0aGlzLl9kb2N1bWVudCk7XG4gICAgICB0aGlzLl9wcmV2aWV3UmVmID0gdmlld1JlZjtcbiAgICAgIGlmIChwcmV2aWV3Q29uZmlnLm1hdGNoU2l6ZSkge1xuICAgICAgICBtYXRjaEVsZW1lbnRTaXplKHByZXZpZXcsIHJvb3RSZWN0ISk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcmV2aWV3LnN0eWxlLnRyYW5zZm9ybSA9IGdldFRyYW5zZm9ybShcbiAgICAgICAgICB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZS54LFxuICAgICAgICAgIHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLnksXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHByZXZpZXcgPSBkZWVwQ2xvbmVOb2RlKHRoaXMuX3Jvb3RFbGVtZW50KTtcbiAgICAgIG1hdGNoRWxlbWVudFNpemUocHJldmlldywgdGhpcy5faW5pdGlhbENsaWVudFJlY3QhKTtcblxuICAgICAgaWYgKHRoaXMuX2luaXRpYWxUcmFuc2Zvcm0pIHtcbiAgICAgICAgcHJldmlldy5zdHlsZS50cmFuc2Zvcm0gPSB0aGlzLl9pbml0aWFsVHJhbnNmb3JtO1xuICAgICAgfVxuICAgIH1cblxuICAgIGV4dGVuZFN0eWxlcyhcbiAgICAgIHByZXZpZXcuc3R5bGUsXG4gICAgICB7XG4gICAgICAgIC8vIEl0J3MgaW1wb3J0YW50IHRoYXQgd2UgZGlzYWJsZSB0aGUgcG9pbnRlciBldmVudHMgb24gdGhlIHByZXZpZXcsIGJlY2F1c2VcbiAgICAgICAgLy8gaXQgY2FuIHRocm93IG9mZiB0aGUgYGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnRgIGNhbGxzIGluIHRoZSBgQ2RrRHJvcExpc3RgLlxuICAgICAgICAncG9pbnRlci1ldmVudHMnOiAnbm9uZScsXG4gICAgICAgIC8vIFdlIGhhdmUgdG8gcmVzZXQgdGhlIG1hcmdpbiwgYmVjYXVzZSBpdCBjYW4gdGhyb3cgb2ZmIHBvc2l0aW9uaW5nIHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydC5cbiAgICAgICAgJ21hcmdpbic6ICcwJyxcbiAgICAgICAgJ3Bvc2l0aW9uJzogJ2ZpeGVkJyxcbiAgICAgICAgJ3RvcCc6ICcwJyxcbiAgICAgICAgJ2xlZnQnOiAnMCcsXG4gICAgICAgICd6LWluZGV4JzogYCR7dGhpcy5fY29uZmlnLnpJbmRleCB8fCAxMDAwfWAsXG4gICAgICB9LFxuICAgICAgZHJhZ0ltcG9ydGFudFByb3BlcnRpZXMsXG4gICAgKTtcblxuICAgIHRvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMocHJldmlldywgZmFsc2UpO1xuICAgIHByZXZpZXcuY2xhc3NMaXN0LmFkZCgnY2RrLWRyYWctcHJldmlldycpO1xuICAgIHByZXZpZXcuc2V0QXR0cmlidXRlKCdkaXInLCB0aGlzLl9kaXJlY3Rpb24pO1xuXG4gICAgaWYgKHByZXZpZXdDbGFzcykge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkocHJldmlld0NsYXNzKSkge1xuICAgICAgICBwcmV2aWV3Q2xhc3MuZm9yRWFjaChjbGFzc05hbWUgPT4gcHJldmlldy5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJldmlldy5jbGFzc0xpc3QuYWRkKHByZXZpZXdDbGFzcyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHByZXZpZXc7XG4gIH1cblxuICAvKipcbiAgICogQW5pbWF0ZXMgdGhlIHByZXZpZXcgZWxlbWVudCBmcm9tIGl0cyBjdXJyZW50IHBvc2l0aW9uIHRvIHRoZSBsb2NhdGlvbiBvZiB0aGUgZHJvcCBwbGFjZWhvbGRlci5cbiAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIGFuaW1hdGlvbiBjb21wbGV0ZXMuXG4gICAqL1xuICBwcml2YXRlIF9hbmltYXRlUHJldmlld1RvUGxhY2Vob2xkZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gSWYgdGhlIHVzZXIgaGFzbid0IG1vdmVkIHlldCwgdGhlIHRyYW5zaXRpb25lbmQgZXZlbnQgd29uJ3QgZmlyZS5cbiAgICBpZiAoIXRoaXMuX2hhc01vdmVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgY29uc3QgcGxhY2Vob2xkZXJSZWN0ID0gdGhpcy5fcGxhY2Vob2xkZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAvLyBBcHBseSB0aGUgY2xhc3MgdGhhdCBhZGRzIGEgdHJhbnNpdGlvbiB0byB0aGUgcHJldmlldy5cbiAgICB0aGlzLl9wcmV2aWV3LmNsYXNzTGlzdC5hZGQoJ2Nkay1kcmFnLWFuaW1hdGluZycpO1xuXG4gICAgLy8gTW92ZSB0aGUgcHJldmlldyB0byB0aGUgcGxhY2Vob2xkZXIgcG9zaXRpb24uXG4gICAgdGhpcy5fYXBwbHlQcmV2aWV3VHJhbnNmb3JtKHBsYWNlaG9sZGVyUmVjdC5sZWZ0LCBwbGFjZWhvbGRlclJlY3QudG9wKTtcblxuICAgIC8vIElmIHRoZSBlbGVtZW50IGRvZXNuJ3QgaGF2ZSBhIGB0cmFuc2l0aW9uYCwgdGhlIGB0cmFuc2l0aW9uZW5kYCBldmVudCB3b24ndCBmaXJlLiBTaW5jZVxuICAgIC8vIHdlIG5lZWQgdG8gdHJpZ2dlciBhIHN0eWxlIHJlY2FsY3VsYXRpb24gaW4gb3JkZXIgZm9yIHRoZSBgY2RrLWRyYWctYW5pbWF0aW5nYCBjbGFzcyB0b1xuICAgIC8vIGFwcGx5IGl0cyBzdHlsZSwgd2UgdGFrZSBhZHZhbnRhZ2Ugb2YgdGhlIGF2YWlsYWJsZSBpbmZvIHRvIGZpZ3VyZSBvdXQgd2hldGhlciB3ZSBuZWVkIHRvXG4gICAgLy8gYmluZCB0aGUgZXZlbnQgaW4gdGhlIGZpcnN0IHBsYWNlLlxuICAgIGNvbnN0IGR1cmF0aW9uID0gZ2V0VHJhbnNmb3JtVHJhbnNpdGlvbkR1cmF0aW9uSW5Ncyh0aGlzLl9wcmV2aWV3KTtcblxuICAgIGlmIChkdXJhdGlvbiA9PT0gMCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICBjb25zdCBoYW5kbGVyID0gKChldmVudDogVHJhbnNpdGlvbkV2ZW50KSA9PiB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgIWV2ZW50IHx8XG4gICAgICAgICAgICAoX2dldEV2ZW50VGFyZ2V0KGV2ZW50KSA9PT0gdGhpcy5fcHJldmlldyAmJiBldmVudC5wcm9wZXJ0eU5hbWUgPT09ICd0cmFuc2Zvcm0nKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy5fcHJldmlldz8ucmVtb3ZlRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIGhhbmRsZXIpO1xuICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkgYXMgRXZlbnRMaXN0ZW5lck9yRXZlbnRMaXN0ZW5lck9iamVjdDtcblxuICAgICAgICAvLyBJZiBhIHRyYW5zaXRpb24gaXMgc2hvcnQgZW5vdWdoLCB0aGUgYnJvd3NlciBtaWdodCBub3QgZmlyZSB0aGUgYHRyYW5zaXRpb25lbmRgIGV2ZW50LlxuICAgICAgICAvLyBTaW5jZSB3ZSBrbm93IGhvdyBsb25nIGl0J3Mgc3VwcG9zZWQgdG8gdGFrZSwgYWRkIGEgdGltZW91dCB3aXRoIGEgNTAlIGJ1ZmZlciB0aGF0J2xsXG4gICAgICAgIC8vIGZpcmUgaWYgdGhlIHRyYW5zaXRpb24gaGFzbid0IGNvbXBsZXRlZCB3aGVuIGl0IHdhcyBzdXBwb3NlZCB0by5cbiAgICAgICAgY29uc3QgdGltZW91dCA9IHNldFRpbWVvdXQoaGFuZGxlciBhcyBGdW5jdGlvbiwgZHVyYXRpb24gKiAxLjUpO1xuICAgICAgICB0aGlzLl9wcmV2aWV3LmFkZEV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBoYW5kbGVyKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYW4gZWxlbWVudCB0aGF0IHdpbGwgYmUgc2hvd24gaW5zdGVhZCBvZiB0aGUgY3VycmVudCBlbGVtZW50IHdoaWxlIGRyYWdnaW5nLiAqL1xuICBwcml2YXRlIF9jcmVhdGVQbGFjZWhvbGRlckVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IHBsYWNlaG9sZGVyQ29uZmlnID0gdGhpcy5fcGxhY2Vob2xkZXJUZW1wbGF0ZTtcbiAgICBjb25zdCBwbGFjZWhvbGRlclRlbXBsYXRlID0gcGxhY2Vob2xkZXJDb25maWcgPyBwbGFjZWhvbGRlckNvbmZpZy50ZW1wbGF0ZSA6IG51bGw7XG4gICAgbGV0IHBsYWNlaG9sZGVyOiBIVE1MRWxlbWVudDtcblxuICAgIGlmIChwbGFjZWhvbGRlclRlbXBsYXRlKSB7XG4gICAgICB0aGlzLl9wbGFjZWhvbGRlclJlZiA9IHBsYWNlaG9sZGVyQ29uZmlnIS52aWV3Q29udGFpbmVyLmNyZWF0ZUVtYmVkZGVkVmlldyhcbiAgICAgICAgcGxhY2Vob2xkZXJUZW1wbGF0ZSxcbiAgICAgICAgcGxhY2Vob2xkZXJDb25maWchLmNvbnRleHQsXG4gICAgICApO1xuICAgICAgdGhpcy5fcGxhY2Vob2xkZXJSZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgcGxhY2Vob2xkZXIgPSBnZXRSb290Tm9kZSh0aGlzLl9wbGFjZWhvbGRlclJlZiwgdGhpcy5fZG9jdW1lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwbGFjZWhvbGRlciA9IGRlZXBDbG9uZU5vZGUodGhpcy5fcm9vdEVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8vIFN0b3AgcG9pbnRlciBldmVudHMgb24gdGhlIHByZXZpZXcgc28gdGhlIHVzZXIgY2FuJ3RcbiAgICAvLyBpbnRlcmFjdCB3aXRoIGl0IHdoaWxlIHRoZSBwcmV2aWV3IGlzIGFuaW1hdGluZy5cbiAgICBwbGFjZWhvbGRlci5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuICAgIHBsYWNlaG9sZGVyLmNsYXNzTGlzdC5hZGQoJ2Nkay1kcmFnLXBsYWNlaG9sZGVyJyk7XG4gICAgcmV0dXJuIHBsYWNlaG9sZGVyO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpZ3VyZXMgb3V0IHRoZSBjb29yZGluYXRlcyBhdCB3aGljaCBhbiBlbGVtZW50IHdhcyBwaWNrZWQgdXAuXG4gICAqIEBwYXJhbSByZWZlcmVuY2VFbGVtZW50IEVsZW1lbnQgdGhhdCBpbml0aWF0ZWQgdGhlIGRyYWdnaW5nLlxuICAgKiBAcGFyYW0gZXZlbnQgRXZlbnQgdGhhdCBpbml0aWF0ZWQgdGhlIGRyYWdnaW5nLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0UG9pbnRlclBvc2l0aW9uSW5FbGVtZW50KFxuICAgIGVsZW1lbnRSZWN0OiBDbGllbnRSZWN0LFxuICAgIHJlZmVyZW5jZUVsZW1lbnQ6IEhUTUxFbGVtZW50LFxuICAgIGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCxcbiAgKTogUG9pbnQge1xuICAgIGNvbnN0IGhhbmRsZUVsZW1lbnQgPSByZWZlcmVuY2VFbGVtZW50ID09PSB0aGlzLl9yb290RWxlbWVudCA/IG51bGwgOiByZWZlcmVuY2VFbGVtZW50O1xuICAgIGNvbnN0IHJlZmVyZW5jZVJlY3QgPSBoYW5kbGVFbGVtZW50ID8gaGFuZGxlRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSA6IGVsZW1lbnRSZWN0O1xuICAgIGNvbnN0IHBvaW50ID0gaXNUb3VjaEV2ZW50KGV2ZW50KSA/IGV2ZW50LnRhcmdldFRvdWNoZXNbMF0gOiBldmVudDtcbiAgICBjb25zdCBzY3JvbGxQb3NpdGlvbiA9IHRoaXMuX2dldFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24oKTtcbiAgICBjb25zdCB4ID0gcG9pbnQucGFnZVggLSByZWZlcmVuY2VSZWN0LmxlZnQgLSBzY3JvbGxQb3NpdGlvbi5sZWZ0O1xuICAgIGNvbnN0IHkgPSBwb2ludC5wYWdlWSAtIHJlZmVyZW5jZVJlY3QudG9wIC0gc2Nyb2xsUG9zaXRpb24udG9wO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IHJlZmVyZW5jZVJlY3QubGVmdCAtIGVsZW1lbnRSZWN0LmxlZnQgKyB4LFxuICAgICAgeTogcmVmZXJlbmNlUmVjdC50b3AgLSBlbGVtZW50UmVjdC50b3AgKyB5LFxuICAgIH07XG4gIH1cblxuICAvKiogRGV0ZXJtaW5lcyB0aGUgcG9pbnQgb2YgdGhlIHBhZ2UgdGhhdCB3YXMgdG91Y2hlZCBieSB0aGUgdXNlci4gKi9cbiAgcHJpdmF0ZSBfZ2V0UG9pbnRlclBvc2l0aW9uT25QYWdlKGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCk6IFBvaW50IHtcbiAgICBjb25zdCBzY3JvbGxQb3NpdGlvbiA9IHRoaXMuX2dldFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24oKTtcbiAgICBjb25zdCBwb2ludCA9IGlzVG91Y2hFdmVudChldmVudClcbiAgICAgID8gLy8gYHRvdWNoZXNgIHdpbGwgYmUgZW1wdHkgZm9yIHN0YXJ0L2VuZCBldmVudHMgc28gd2UgaGF2ZSB0byBmYWxsIGJhY2sgdG8gYGNoYW5nZWRUb3VjaGVzYC5cbiAgICAgICAgLy8gQWxzbyBub3RlIHRoYXQgb24gcmVhbCBkZXZpY2VzIHdlJ3JlIGd1YXJhbnRlZWQgZm9yIGVpdGhlciBgdG91Y2hlc2Agb3IgYGNoYW5nZWRUb3VjaGVzYFxuICAgICAgICAvLyB0byBoYXZlIGEgdmFsdWUsIGJ1dCBGaXJlZm94IGluIGRldmljZSBlbXVsYXRpb24gbW9kZSBoYXMgYSBidWcgd2hlcmUgYm90aCBjYW4gYmUgZW1wdHlcbiAgICAgICAgLy8gZm9yIGB0b3VjaHN0YXJ0YCBhbmQgYHRvdWNoZW5kYCBzbyB3ZSBmYWxsIGJhY2sgdG8gYSBkdW1teSBvYmplY3QgaW4gb3JkZXIgdG8gYXZvaWRcbiAgICAgICAgLy8gdGhyb3dpbmcgYW4gZXJyb3IuIFRoZSB2YWx1ZSByZXR1cm5lZCBoZXJlIHdpbGwgYmUgaW5jb3JyZWN0LCBidXQgc2luY2UgdGhpcyBvbmx5XG4gICAgICAgIC8vIGJyZWFrcyBpbnNpZGUgYSBkZXZlbG9wZXIgdG9vbCBhbmQgdGhlIHZhbHVlIGlzIG9ubHkgdXNlZCBmb3Igc2Vjb25kYXJ5IGluZm9ybWF0aW9uLFxuICAgICAgICAvLyB3ZSBjYW4gZ2V0IGF3YXkgd2l0aCBpdC4gU2VlIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTE2MTU4MjQuXG4gICAgICAgIGV2ZW50LnRvdWNoZXNbMF0gfHwgZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0gfHwge3BhZ2VYOiAwLCBwYWdlWTogMH1cbiAgICAgIDogZXZlbnQ7XG5cbiAgICBjb25zdCB4ID0gcG9pbnQucGFnZVggLSBzY3JvbGxQb3NpdGlvbi5sZWZ0O1xuICAgIGNvbnN0IHkgPSBwb2ludC5wYWdlWSAtIHNjcm9sbFBvc2l0aW9uLnRvcDtcblxuICAgIC8vIGlmIGRyYWdnaW5nIFNWRyBlbGVtZW50LCB0cnkgdG8gY29udmVydCBmcm9tIHRoZSBzY3JlZW4gY29vcmRpbmF0ZSBzeXN0ZW0gdG8gdGhlIFNWR1xuICAgIC8vIGNvb3JkaW5hdGUgc3lzdGVtXG4gICAgaWYgKHRoaXMuX293bmVyU1ZHRWxlbWVudCkge1xuICAgICAgY29uc3Qgc3ZnTWF0cml4ID0gdGhpcy5fb3duZXJTVkdFbGVtZW50LmdldFNjcmVlbkNUTSgpO1xuICAgICAgaWYgKHN2Z01hdHJpeCkge1xuICAgICAgICBjb25zdCBzdmdQb2ludCA9IHRoaXMuX293bmVyU1ZHRWxlbWVudC5jcmVhdGVTVkdQb2ludCgpO1xuICAgICAgICBzdmdQb2ludC54ID0geDtcbiAgICAgICAgc3ZnUG9pbnQueSA9IHk7XG4gICAgICAgIHJldHVybiBzdmdQb2ludC5tYXRyaXhUcmFuc2Zvcm0oc3ZnTWF0cml4LmludmVyc2UoKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHt4LCB5fTtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBwb2ludGVyIHBvc2l0aW9uIG9uIHRoZSBwYWdlLCBhY2NvdW50aW5nIGZvciBhbnkgcG9zaXRpb24gY29uc3RyYWludHMuICovXG4gIHByaXZhdGUgX2dldENvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uKHBvaW50OiBQb2ludCk6IFBvaW50IHtcbiAgICBjb25zdCBkcm9wQ29udGFpbmVyTG9jayA9IHRoaXMuX2Ryb3BDb250YWluZXIgPyB0aGlzLl9kcm9wQ29udGFpbmVyLmxvY2tBeGlzIDogbnVsbDtcbiAgICBsZXQge3gsIHl9ID0gdGhpcy5jb25zdHJhaW5Qb3NpdGlvblxuICAgICAgPyB0aGlzLmNvbnN0cmFpblBvc2l0aW9uKHBvaW50LCB0aGlzLCB0aGlzLl9pbml0aWFsQ2xpZW50UmVjdCEsIHRoaXMuX3BpY2t1cFBvc2l0aW9uSW5FbGVtZW50KVxuICAgICAgOiBwb2ludDtcblxuICAgIGlmICh0aGlzLmxvY2tBeGlzID09PSAneCcgfHwgZHJvcENvbnRhaW5lckxvY2sgPT09ICd4Jykge1xuICAgICAgeSA9XG4gICAgICAgIHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLnkgLVxuICAgICAgICAodGhpcy5jb25zdHJhaW5Qb3NpdGlvbiA/IHRoaXMuX3BpY2t1cFBvc2l0aW9uSW5FbGVtZW50LnkgOiAwKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMubG9ja0F4aXMgPT09ICd5JyB8fCBkcm9wQ29udGFpbmVyTG9jayA9PT0gJ3knKSB7XG4gICAgICB4ID1cbiAgICAgICAgdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UueCAtXG4gICAgICAgICh0aGlzLmNvbnN0cmFpblBvc2l0aW9uID8gdGhpcy5fcGlja3VwUG9zaXRpb25JbkVsZW1lbnQueCA6IDApO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ib3VuZGFyeVJlY3QpIHtcbiAgICAgIC8vIElmIG5vdCB1c2luZyBhIGN1c3RvbSBjb25zdHJhaW4gd2UgbmVlZCB0byBhY2NvdW50IGZvciB0aGUgcGlja3VwIHBvc2l0aW9uIGluIHRoZSBlbGVtZW50XG4gICAgICAvLyBvdGhlcndpc2Ugd2UgZG8gbm90IG5lZWQgdG8gZG8gdGhpcywgYXMgaXQgaGFzIGFscmVhZHkgYmVlbiBhY2NvdW50ZWQgZm9yXG4gICAgICBjb25zdCB7eDogcGlja3VwWCwgeTogcGlja3VwWX0gPSAhdGhpcy5jb25zdHJhaW5Qb3NpdGlvblxuICAgICAgICA/IHRoaXMuX3BpY2t1cFBvc2l0aW9uSW5FbGVtZW50XG4gICAgICAgIDoge3g6IDAsIHk6IDB9O1xuXG4gICAgICBjb25zdCBib3VuZGFyeVJlY3QgPSB0aGlzLl9ib3VuZGFyeVJlY3Q7XG4gICAgICBjb25zdCB7d2lkdGg6IHByZXZpZXdXaWR0aCwgaGVpZ2h0OiBwcmV2aWV3SGVpZ2h0fSA9IHRoaXMuX2dldFByZXZpZXdSZWN0KCk7XG4gICAgICBjb25zdCBtaW5ZID0gYm91bmRhcnlSZWN0LnRvcCArIHBpY2t1cFk7XG4gICAgICBjb25zdCBtYXhZID0gYm91bmRhcnlSZWN0LmJvdHRvbSAtIChwcmV2aWV3SGVpZ2h0IC0gcGlja3VwWSk7XG4gICAgICBjb25zdCBtaW5YID0gYm91bmRhcnlSZWN0LmxlZnQgKyBwaWNrdXBYO1xuICAgICAgY29uc3QgbWF4WCA9IGJvdW5kYXJ5UmVjdC5yaWdodCAtIChwcmV2aWV3V2lkdGggLSBwaWNrdXBYKTtcblxuICAgICAgeCA9IGNsYW1wKHgsIG1pblgsIG1heFgpO1xuICAgICAgeSA9IGNsYW1wKHksIG1pblksIG1heFkpO1xuICAgIH1cblxuICAgIHJldHVybiB7eCwgeX07XG4gIH1cblxuICAvKiogVXBkYXRlcyB0aGUgY3VycmVudCBkcmFnIGRlbHRhLCBiYXNlZCBvbiB0aGUgdXNlcidzIGN1cnJlbnQgcG9pbnRlciBwb3NpdGlvbiBvbiB0aGUgcGFnZS4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlUG9pbnRlckRpcmVjdGlvbkRlbHRhKHBvaW50ZXJQb3NpdGlvbk9uUGFnZTogUG9pbnQpIHtcbiAgICBjb25zdCB7eCwgeX0gPSBwb2ludGVyUG9zaXRpb25PblBhZ2U7XG4gICAgY29uc3QgZGVsdGEgPSB0aGlzLl9wb2ludGVyRGlyZWN0aW9uRGVsdGE7XG4gICAgY29uc3QgcG9zaXRpb25TaW5jZUxhc3RDaGFuZ2UgPSB0aGlzLl9wb2ludGVyUG9zaXRpb25BdExhc3REaXJlY3Rpb25DaGFuZ2U7XG5cbiAgICAvLyBBbW91bnQgb2YgcGl4ZWxzIHRoZSB1c2VyIGhhcyBkcmFnZ2VkIHNpbmNlIHRoZSBsYXN0IHRpbWUgdGhlIGRpcmVjdGlvbiBjaGFuZ2VkLlxuICAgIGNvbnN0IGNoYW5nZVggPSBNYXRoLmFicyh4IC0gcG9zaXRpb25TaW5jZUxhc3RDaGFuZ2UueCk7XG4gICAgY29uc3QgY2hhbmdlWSA9IE1hdGguYWJzKHkgLSBwb3NpdGlvblNpbmNlTGFzdENoYW5nZS55KTtcblxuICAgIC8vIEJlY2F1c2Ugd2UgaGFuZGxlIHBvaW50ZXIgZXZlbnRzIG9uIGEgcGVyLXBpeGVsIGJhc2lzLCB3ZSBkb24ndCB3YW50IHRoZSBkZWx0YVxuICAgIC8vIHRvIGNoYW5nZSBmb3IgZXZlcnkgcGl4ZWwsIG90aGVyd2lzZSBhbnl0aGluZyB0aGF0IGRlcGVuZHMgb24gaXQgY2FuIGxvb2sgZXJyYXRpYy5cbiAgICAvLyBUbyBtYWtlIHRoZSBkZWx0YSBtb3JlIGNvbnNpc3RlbnQsIHdlIHRyYWNrIGhvdyBtdWNoIHRoZSB1c2VyIGhhcyBtb3ZlZCBzaW5jZSB0aGUgbGFzdFxuICAgIC8vIGRlbHRhIGNoYW5nZSBhbmQgd2Ugb25seSB1cGRhdGUgaXQgYWZ0ZXIgaXQgaGFzIHJlYWNoZWQgYSBjZXJ0YWluIHRocmVzaG9sZC5cbiAgICBpZiAoY2hhbmdlWCA+IHRoaXMuX2NvbmZpZy5wb2ludGVyRGlyZWN0aW9uQ2hhbmdlVGhyZXNob2xkKSB7XG4gICAgICBkZWx0YS54ID0geCA+IHBvc2l0aW9uU2luY2VMYXN0Q2hhbmdlLnggPyAxIDogLTE7XG4gICAgICBwb3NpdGlvblNpbmNlTGFzdENoYW5nZS54ID0geDtcbiAgICB9XG5cbiAgICBpZiAoY2hhbmdlWSA+IHRoaXMuX2NvbmZpZy5wb2ludGVyRGlyZWN0aW9uQ2hhbmdlVGhyZXNob2xkKSB7XG4gICAgICBkZWx0YS55ID0geSA+IHBvc2l0aW9uU2luY2VMYXN0Q2hhbmdlLnkgPyAxIDogLTE7XG4gICAgICBwb3NpdGlvblNpbmNlTGFzdENoYW5nZS55ID0geTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGVsdGE7XG4gIH1cblxuICAvKiogVG9nZ2xlcyB0aGUgbmF0aXZlIGRyYWcgaW50ZXJhY3Rpb25zLCBiYXNlZCBvbiBob3cgbWFueSBoYW5kbGVzIGFyZSByZWdpc3RlcmVkLiAqL1xuICBwcml2YXRlIF90b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKCkge1xuICAgIGlmICghdGhpcy5fcm9vdEVsZW1lbnQgfHwgIXRoaXMuX2hhbmRsZXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzaG91bGRFbmFibGUgPSB0aGlzLl9oYW5kbGVzLmxlbmd0aCA+IDAgfHwgIXRoaXMuaXNEcmFnZ2luZygpO1xuXG4gICAgaWYgKHNob3VsZEVuYWJsZSAhPT0gdGhpcy5fbmF0aXZlSW50ZXJhY3Rpb25zRW5hYmxlZCkge1xuICAgICAgdGhpcy5fbmF0aXZlSW50ZXJhY3Rpb25zRW5hYmxlZCA9IHNob3VsZEVuYWJsZTtcbiAgICAgIHRvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnModGhpcy5fcm9vdEVsZW1lbnQsIHNob3VsZEVuYWJsZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFJlbW92ZXMgdGhlIG1hbnVhbGx5LWFkZGVkIGV2ZW50IGxpc3RlbmVycyBmcm9tIHRoZSByb290IGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3JlbW92ZVJvb3RFbGVtZW50TGlzdGVuZXJzKGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9wb2ludGVyRG93biwgYWN0aXZlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuX3BvaW50ZXJEb3duLCBwYXNzaXZlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignZHJhZ3N0YXJ0JywgdGhpcy5fbmF0aXZlRHJhZ1N0YXJ0LCBhY3RpdmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyBhIGB0cmFuc2Zvcm1gIHRvIHRoZSByb290IGVsZW1lbnQsIHRha2luZyBpbnRvIGFjY291bnQgYW55IGV4aXN0aW5nIHRyYW5zZm9ybXMgb24gaXQuXG4gICAqIEBwYXJhbSB4IE5ldyB0cmFuc2Zvcm0gdmFsdWUgYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHkgTmV3IHRyYW5zZm9ybSB2YWx1ZSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKi9cbiAgcHJpdmF0ZSBfYXBwbHlSb290RWxlbWVudFRyYW5zZm9ybSh4OiBudW1iZXIsIHk6IG51bWJlcikge1xuICAgIGNvbnN0IHRyYW5zZm9ybSA9IGdldFRyYW5zZm9ybSh4LCB5KTtcbiAgICBjb25zdCBzdHlsZXMgPSB0aGlzLl9yb290RWxlbWVudC5zdHlsZTtcblxuICAgIC8vIENhY2hlIHRoZSBwcmV2aW91cyB0cmFuc2Zvcm0gYW1vdW50IG9ubHkgYWZ0ZXIgdGhlIGZpcnN0IGRyYWcgc2VxdWVuY2UsIGJlY2F1c2VcbiAgICAvLyB3ZSBkb24ndCB3YW50IG91ciBvd24gdHJhbnNmb3JtcyB0byBzdGFjayBvbiB0b3Agb2YgZWFjaCBvdGhlci5cbiAgICAvLyBTaG91bGQgYmUgZXhjbHVkZWQgbm9uZSBiZWNhdXNlIG5vbmUgKyB0cmFuc2xhdGUzZCh4LCB5LCB4KSBpcyBpbnZhbGlkIGNzc1xuICAgIGlmICh0aGlzLl9pbml0aWFsVHJhbnNmb3JtID09IG51bGwpIHtcbiAgICAgIHRoaXMuX2luaXRpYWxUcmFuc2Zvcm0gPVxuICAgICAgICBzdHlsZXMudHJhbnNmb3JtICYmIHN0eWxlcy50cmFuc2Zvcm0gIT0gJ25vbmUnID8gc3R5bGVzLnRyYW5zZm9ybSA6ICcnO1xuICAgIH1cblxuICAgIC8vIFByZXNlcnZlIHRoZSBwcmV2aW91cyBgdHJhbnNmb3JtYCB2YWx1ZSwgaWYgdGhlcmUgd2FzIG9uZS4gTm90ZSB0aGF0IHdlIGFwcGx5IG91ciBvd25cbiAgICAvLyB0cmFuc2Zvcm0gYmVmb3JlIHRoZSB1c2VyJ3MsIGJlY2F1c2UgdGhpbmdzIGxpa2Ugcm90YXRpb24gY2FuIGFmZmVjdCB3aGljaCBkaXJlY3Rpb25cbiAgICAvLyB0aGUgZWxlbWVudCB3aWxsIGJlIHRyYW5zbGF0ZWQgdG93YXJkcy5cbiAgICBzdHlsZXMudHJhbnNmb3JtID0gY29tYmluZVRyYW5zZm9ybXModHJhbnNmb3JtLCB0aGlzLl9pbml0aWFsVHJhbnNmb3JtKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBsaWVzIGEgYHRyYW5zZm9ybWAgdG8gdGhlIHByZXZpZXcsIHRha2luZyBpbnRvIGFjY291bnQgYW55IGV4aXN0aW5nIHRyYW5zZm9ybXMgb24gaXQuXG4gICAqIEBwYXJhbSB4IE5ldyB0cmFuc2Zvcm0gdmFsdWUgYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHkgTmV3IHRyYW5zZm9ybSB2YWx1ZSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKi9cbiAgcHJpdmF0ZSBfYXBwbHlQcmV2aWV3VHJhbnNmb3JtKHg6IG51bWJlciwgeTogbnVtYmVyKSB7XG4gICAgLy8gT25seSBhcHBseSB0aGUgaW5pdGlhbCB0cmFuc2Zvcm0gaWYgdGhlIHByZXZpZXcgaXMgYSBjbG9uZSBvZiB0aGUgb3JpZ2luYWwgZWxlbWVudCwgb3RoZXJ3aXNlXG4gICAgLy8gaXQgY291bGQgYmUgY29tcGxldGVseSBkaWZmZXJlbnQgYW5kIHRoZSB0cmFuc2Zvcm0gbWlnaHQgbm90IG1ha2Ugc2Vuc2UgYW55bW9yZS5cbiAgICBjb25zdCBpbml0aWFsVHJhbnNmb3JtID0gdGhpcy5fcHJldmlld1RlbXBsYXRlPy50ZW1wbGF0ZSA/IHVuZGVmaW5lZCA6IHRoaXMuX2luaXRpYWxUcmFuc2Zvcm07XG4gICAgY29uc3QgdHJhbnNmb3JtID0gZ2V0VHJhbnNmb3JtKHgsIHkpO1xuICAgIHRoaXMuX3ByZXZpZXcuc3R5bGUudHJhbnNmb3JtID0gY29tYmluZVRyYW5zZm9ybXModHJhbnNmb3JtLCBpbml0aWFsVHJhbnNmb3JtKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBkaXN0YW5jZSB0aGF0IHRoZSB1c2VyIGhhcyBkcmFnZ2VkIGR1cmluZyB0aGUgY3VycmVudCBkcmFnIHNlcXVlbmNlLlxuICAgKiBAcGFyYW0gY3VycmVudFBvc2l0aW9uIEN1cnJlbnQgcG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0RHJhZ0Rpc3RhbmNlKGN1cnJlbnRQb3NpdGlvbjogUG9pbnQpOiBQb2ludCB7XG4gICAgY29uc3QgcGlja3VwUG9zaXRpb24gPSB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZTtcblxuICAgIGlmIChwaWNrdXBQb3NpdGlvbikge1xuICAgICAgcmV0dXJuIHt4OiBjdXJyZW50UG9zaXRpb24ueCAtIHBpY2t1cFBvc2l0aW9uLngsIHk6IGN1cnJlbnRQb3NpdGlvbi55IC0gcGlja3VwUG9zaXRpb24ueX07XG4gICAgfVxuXG4gICAgcmV0dXJuIHt4OiAwLCB5OiAwfTtcbiAgfVxuXG4gIC8qKiBDbGVhbnMgdXAgYW55IGNhY2hlZCBlbGVtZW50IGRpbWVuc2lvbnMgdGhhdCB3ZSBkb24ndCBuZWVkIGFmdGVyIGRyYWdnaW5nIGhhcyBzdG9wcGVkLiAqL1xuICBwcml2YXRlIF9jbGVhbnVwQ2FjaGVkRGltZW5zaW9ucygpIHtcbiAgICB0aGlzLl9ib3VuZGFyeVJlY3QgPSB0aGlzLl9wcmV2aWV3UmVjdCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgZWxlbWVudCBpcyBzdGlsbCBpbnNpZGUgaXRzIGJvdW5kYXJ5IGFmdGVyIHRoZSB2aWV3cG9ydCBoYXMgYmVlbiByZXNpemVkLlxuICAgKiBJZiBub3QsIHRoZSBwb3NpdGlvbiBpcyBhZGp1c3RlZCBzbyB0aGF0IHRoZSBlbGVtZW50IGZpdHMgYWdhaW4uXG4gICAqL1xuICBwcml2YXRlIF9jb250YWluSW5zaWRlQm91bmRhcnlPblJlc2l6ZSgpIHtcbiAgICBsZXQge3gsIHl9ID0gdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybTtcblxuICAgIGlmICgoeCA9PT0gMCAmJiB5ID09PSAwKSB8fCB0aGlzLmlzRHJhZ2dpbmcoKSB8fCAhdGhpcy5fYm91bmRhcnlFbGVtZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gTm90ZTogZG9uJ3QgdXNlIGBfY2xpZW50UmVjdEF0U3RhcnRgIGhlcmUsIGJlY2F1c2Ugd2Ugd2FudCB0aGUgbGF0ZXN0IHBvc2l0aW9uLlxuICAgIGNvbnN0IGVsZW1lbnRSZWN0ID0gdGhpcy5fcm9vdEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgY29uc3QgYm91bmRhcnlSZWN0ID0gdGhpcy5fYm91bmRhcnlFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgLy8gSXQncyBwb3NzaWJsZSB0aGF0IHRoZSBlbGVtZW50IGdvdCBoaWRkZW4gYXdheSBhZnRlciBkcmFnZ2luZyAoZS5nLiBieSBzd2l0Y2hpbmcgdG8gYVxuICAgIC8vIGRpZmZlcmVudCB0YWIpLiBEb24ndCBkbyBhbnl0aGluZyBpbiB0aGlzIGNhc2Ugc28gd2UgZG9uJ3QgY2xlYXIgdGhlIHVzZXIncyBwb3NpdGlvbi5cbiAgICBpZiAoXG4gICAgICAoYm91bmRhcnlSZWN0LndpZHRoID09PSAwICYmIGJvdW5kYXJ5UmVjdC5oZWlnaHQgPT09IDApIHx8XG4gICAgICAoZWxlbWVudFJlY3Qud2lkdGggPT09IDAgJiYgZWxlbWVudFJlY3QuaGVpZ2h0ID09PSAwKVxuICAgICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGxlZnRPdmVyZmxvdyA9IGJvdW5kYXJ5UmVjdC5sZWZ0IC0gZWxlbWVudFJlY3QubGVmdDtcbiAgICBjb25zdCByaWdodE92ZXJmbG93ID0gZWxlbWVudFJlY3QucmlnaHQgLSBib3VuZGFyeVJlY3QucmlnaHQ7XG4gICAgY29uc3QgdG9wT3ZlcmZsb3cgPSBib3VuZGFyeVJlY3QudG9wIC0gZWxlbWVudFJlY3QudG9wO1xuICAgIGNvbnN0IGJvdHRvbU92ZXJmbG93ID0gZWxlbWVudFJlY3QuYm90dG9tIC0gYm91bmRhcnlSZWN0LmJvdHRvbTtcblxuICAgIC8vIElmIHRoZSBlbGVtZW50IGhhcyBiZWNvbWUgd2lkZXIgdGhhbiB0aGUgYm91bmRhcnksIHdlIGNhbid0XG4gICAgLy8gZG8gbXVjaCB0byBtYWtlIGl0IGZpdCBzbyB3ZSBqdXN0IGFuY2hvciBpdCB0byB0aGUgbGVmdC5cbiAgICBpZiAoYm91bmRhcnlSZWN0LndpZHRoID4gZWxlbWVudFJlY3Qud2lkdGgpIHtcbiAgICAgIGlmIChsZWZ0T3ZlcmZsb3cgPiAwKSB7XG4gICAgICAgIHggKz0gbGVmdE92ZXJmbG93O1xuICAgICAgfVxuXG4gICAgICBpZiAocmlnaHRPdmVyZmxvdyA+IDApIHtcbiAgICAgICAgeCAtPSByaWdodE92ZXJmbG93O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB4ID0gMDtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgZWxlbWVudCBoYXMgYmVjb21lIHRhbGxlciB0aGFuIHRoZSBib3VuZGFyeSwgd2UgY2FuJ3RcbiAgICAvLyBkbyBtdWNoIHRvIG1ha2UgaXQgZml0IHNvIHdlIGp1c3QgYW5jaG9yIGl0IHRvIHRoZSB0b3AuXG4gICAgaWYgKGJvdW5kYXJ5UmVjdC5oZWlnaHQgPiBlbGVtZW50UmVjdC5oZWlnaHQpIHtcbiAgICAgIGlmICh0b3BPdmVyZmxvdyA+IDApIHtcbiAgICAgICAgeSArPSB0b3BPdmVyZmxvdztcbiAgICAgIH1cblxuICAgICAgaWYgKGJvdHRvbU92ZXJmbG93ID4gMCkge1xuICAgICAgICB5IC09IGJvdHRvbU92ZXJmbG93O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB5ID0gMDtcbiAgICB9XG5cbiAgICBpZiAoeCAhPT0gdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybS54IHx8IHkgIT09IHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm0ueSkge1xuICAgICAgdGhpcy5zZXRGcmVlRHJhZ1Bvc2l0aW9uKHt5LCB4fSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEdldHMgdGhlIGRyYWcgc3RhcnQgZGVsYXksIGJhc2VkIG9uIHRoZSBldmVudCB0eXBlLiAqL1xuICBwcml2YXRlIF9nZXREcmFnU3RhcnREZWxheShldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpOiBudW1iZXIge1xuICAgIGNvbnN0IHZhbHVlID0gdGhpcy5kcmFnU3RhcnREZWxheTtcblxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSBlbHNlIGlmIChpc1RvdWNoRXZlbnQoZXZlbnQpKSB7XG4gICAgICByZXR1cm4gdmFsdWUudG91Y2g7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlID8gdmFsdWUubW91c2UgOiAwO1xuICB9XG5cbiAgLyoqIFVwZGF0ZXMgdGhlIGludGVybmFsIHN0YXRlIG9mIHRoZSBkcmFnZ2FibGUgZWxlbWVudCB3aGVuIHNjcm9sbGluZyBoYXMgb2NjdXJyZWQuICovXG4gIHByaXZhdGUgX3VwZGF0ZU9uU2Nyb2xsKGV2ZW50OiBFdmVudCkge1xuICAgIGNvbnN0IHNjcm9sbERpZmZlcmVuY2UgPSB0aGlzLl9wYXJlbnRQb3NpdGlvbnMuaGFuZGxlU2Nyb2xsKGV2ZW50KTtcblxuICAgIGlmIChzY3JvbGxEaWZmZXJlbmNlKSB7XG4gICAgICBjb25zdCB0YXJnZXQgPSBfZ2V0RXZlbnRUYXJnZXQ8SFRNTEVsZW1lbnQgfCBEb2N1bWVudD4oZXZlbnQpITtcblxuICAgICAgLy8gQ2xpZW50UmVjdCBkaW1lbnNpb25zIGFyZSBiYXNlZCBvbiB0aGUgc2Nyb2xsIHBvc2l0aW9uIG9mIHRoZSBwYWdlIGFuZCBpdHMgcGFyZW50XG4gICAgICAvLyBub2RlIHNvIHdlIGhhdmUgdG8gdXBkYXRlIHRoZSBjYWNoZWQgYm91bmRhcnkgQ2xpZW50UmVjdCBpZiB0aGUgdXNlciBoYXMgc2Nyb2xsZWQuXG4gICAgICBpZiAoXG4gICAgICAgIHRoaXMuX2JvdW5kYXJ5UmVjdCAmJlxuICAgICAgICB0YXJnZXQgIT09IHRoaXMuX2JvdW5kYXJ5RWxlbWVudCAmJlxuICAgICAgICB0YXJnZXQuY29udGFpbnModGhpcy5fYm91bmRhcnlFbGVtZW50KVxuICAgICAgKSB7XG4gICAgICAgIGFkanVzdENsaWVudFJlY3QodGhpcy5fYm91bmRhcnlSZWN0LCBzY3JvbGxEaWZmZXJlbmNlLnRvcCwgc2Nyb2xsRGlmZmVyZW5jZS5sZWZ0KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UueCArPSBzY3JvbGxEaWZmZXJlbmNlLmxlZnQ7XG4gICAgICB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZS55ICs9IHNjcm9sbERpZmZlcmVuY2UudG9wO1xuXG4gICAgICAvLyBJZiB3ZSdyZSBpbiBmcmVlIGRyYWcgbW9kZSwgd2UgaGF2ZSB0byB1cGRhdGUgdGhlIGFjdGl2ZSB0cmFuc2Zvcm0sIGJlY2F1c2VcbiAgICAgIC8vIGl0IGlzbid0IHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydCBsaWtlIHRoZSBwcmV2aWV3IGluc2lkZSBhIGRyb3AgbGlzdC5cbiAgICAgIGlmICghdGhpcy5fZHJvcENvbnRhaW5lcikge1xuICAgICAgICB0aGlzLl9hY3RpdmVUcmFuc2Zvcm0ueCAtPSBzY3JvbGxEaWZmZXJlbmNlLmxlZnQ7XG4gICAgICAgIHRoaXMuX2FjdGl2ZVRyYW5zZm9ybS55IC09IHNjcm9sbERpZmZlcmVuY2UudG9wO1xuICAgICAgICB0aGlzLl9hcHBseVJvb3RFbGVtZW50VHJhbnNmb3JtKHRoaXMuX2FjdGl2ZVRyYW5zZm9ybS54LCB0aGlzLl9hY3RpdmVUcmFuc2Zvcm0ueSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIEdldHMgdGhlIHNjcm9sbCBwb3NpdGlvbiBvZiB0aGUgdmlld3BvcnQuICovXG4gIHByaXZhdGUgX2dldFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24oKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5wb3NpdGlvbnMuZ2V0KHRoaXMuX2RvY3VtZW50KT8uc2Nyb2xsUG9zaXRpb24gfHxcbiAgICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5nZXRWaWV3cG9ydFNjcm9sbFBvc2l0aW9uKClcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIExhemlseSByZXNvbHZlcyBhbmQgcmV0dXJucyB0aGUgc2hhZG93IHJvb3Qgb2YgdGhlIGVsZW1lbnQuIFdlIGRvIHRoaXMgaW4gYSBmdW5jdGlvbiwgcmF0aGVyXG4gICAqIHRoYW4gc2F2aW5nIGl0IGluIHByb3BlcnR5IGRpcmVjdGx5IG9uIGluaXQsIGJlY2F1c2Ugd2Ugd2FudCB0byByZXNvbHZlIGl0IGFzIGxhdGUgYXMgcG9zc2libGVcbiAgICogaW4gb3JkZXIgdG8gZW5zdXJlIHRoYXQgdGhlIGVsZW1lbnQgaGFzIGJlZW4gbW92ZWQgaW50byB0aGUgc2hhZG93IERPTS4gRG9pbmcgaXQgaW5zaWRlIHRoZVxuICAgKiBjb25zdHJ1Y3RvciBtaWdodCBiZSB0b28gZWFybHkgaWYgdGhlIGVsZW1lbnQgaXMgaW5zaWRlIG9mIHNvbWV0aGluZyBsaWtlIGBuZ0ZvcmAgb3IgYG5nSWZgLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0U2hhZG93Um9vdCgpOiBTaGFkb3dSb290IHwgbnVsbCB7XG4gICAgaWYgKHRoaXMuX2NhY2hlZFNoYWRvd1Jvb3QgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5fY2FjaGVkU2hhZG93Um9vdCA9IF9nZXRTaGFkb3dSb290KHRoaXMuX3Jvb3RFbGVtZW50KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fY2FjaGVkU2hhZG93Um9vdDtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBlbGVtZW50IGludG8gd2hpY2ggdGhlIGRyYWcgcHJldmlldyBzaG91bGQgYmUgaW5zZXJ0ZWQuICovXG4gIHByaXZhdGUgX2dldFByZXZpZXdJbnNlcnRpb25Qb2ludChcbiAgICBpbml0aWFsUGFyZW50OiBIVE1MRWxlbWVudCxcbiAgICBzaGFkb3dSb290OiBTaGFkb3dSb290IHwgbnVsbCxcbiAgKTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IHByZXZpZXdDb250YWluZXIgPSB0aGlzLl9wcmV2aWV3Q29udGFpbmVyIHx8ICdnbG9iYWwnO1xuXG4gICAgaWYgKHByZXZpZXdDb250YWluZXIgPT09ICdwYXJlbnQnKSB7XG4gICAgICByZXR1cm4gaW5pdGlhbFBhcmVudDtcbiAgICB9XG5cbiAgICBpZiAocHJldmlld0NvbnRhaW5lciA9PT0gJ2dsb2JhbCcpIHtcbiAgICAgIGNvbnN0IGRvY3VtZW50UmVmID0gdGhpcy5fZG9jdW1lbnQ7XG5cbiAgICAgIC8vIFdlIGNhbid0IHVzZSB0aGUgYm9keSBpZiB0aGUgdXNlciBpcyBpbiBmdWxsc2NyZWVuIG1vZGUsXG4gICAgICAvLyBiZWNhdXNlIHRoZSBwcmV2aWV3IHdpbGwgcmVuZGVyIHVuZGVyIHRoZSBmdWxsc2NyZWVuIGVsZW1lbnQuXG4gICAgICAvLyBUT0RPKGNyaXNiZXRvKTogZGVkdXBlIHRoaXMgd2l0aCB0aGUgYEZ1bGxzY3JlZW5PdmVybGF5Q29udGFpbmVyYCBldmVudHVhbGx5LlxuICAgICAgcmV0dXJuIChcbiAgICAgICAgc2hhZG93Um9vdCB8fFxuICAgICAgICBkb2N1bWVudFJlZi5mdWxsc2NyZWVuRWxlbWVudCB8fFxuICAgICAgICAoZG9jdW1lbnRSZWYgYXMgYW55KS53ZWJraXRGdWxsc2NyZWVuRWxlbWVudCB8fFxuICAgICAgICAoZG9jdW1lbnRSZWYgYXMgYW55KS5tb3pGdWxsU2NyZWVuRWxlbWVudCB8fFxuICAgICAgICAoZG9jdW1lbnRSZWYgYXMgYW55KS5tc0Z1bGxzY3JlZW5FbGVtZW50IHx8XG4gICAgICAgIGRvY3VtZW50UmVmLmJvZHlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvZXJjZUVsZW1lbnQocHJldmlld0NvbnRhaW5lcik7XG4gIH1cblxuICAvKiogTGF6aWx5IHJlc29sdmVzIGFuZCByZXR1cm5zIHRoZSBkaW1lbnNpb25zIG9mIHRoZSBwcmV2aWV3LiAqL1xuICBwcml2YXRlIF9nZXRQcmV2aWV3UmVjdCgpOiBDbGllbnRSZWN0IHtcbiAgICAvLyBDYWNoZSB0aGUgcHJldmlldyBlbGVtZW50IHJlY3QgaWYgd2UgaGF2ZW4ndCBjYWNoZWQgaXQgYWxyZWFkeSBvciBpZlxuICAgIC8vIHdlIGNhY2hlZCBpdCB0b28gZWFybHkgYmVmb3JlIHRoZSBlbGVtZW50IGRpbWVuc2lvbnMgd2VyZSBjb21wdXRlZC5cbiAgICBpZiAoIXRoaXMuX3ByZXZpZXdSZWN0IHx8ICghdGhpcy5fcHJldmlld1JlY3Qud2lkdGggJiYgIXRoaXMuX3ByZXZpZXdSZWN0LmhlaWdodCkpIHtcbiAgICAgIHRoaXMuX3ByZXZpZXdSZWN0ID0gdGhpcy5fcHJldmlld1xuICAgICAgICA/IHRoaXMuX3ByZXZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgOiB0aGlzLl9pbml0aWFsQ2xpZW50UmVjdCE7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX3ByZXZpZXdSZWN0O1xuICB9XG5cbiAgLyoqIEhhbmRsZXMgYSBuYXRpdmUgYGRyYWdzdGFydGAgZXZlbnQuICovXG4gIHByaXZhdGUgX25hdGl2ZURyYWdTdGFydCA9IChldmVudDogRHJhZ0V2ZW50KSA9PiB7XG4gICAgaWYgKHRoaXMuX2hhbmRsZXMubGVuZ3RoKSB7XG4gICAgICBjb25zdCB0YXJnZXRIYW5kbGUgPSB0aGlzLl9nZXRUYXJnZXRIYW5kbGUoZXZlbnQpO1xuXG4gICAgICBpZiAodGFyZ2V0SGFuZGxlICYmICF0aGlzLl9kaXNhYmxlZEhhbmRsZXMuaGFzKHRhcmdldEhhbmRsZSkgJiYgIXRoaXMuZGlzYWJsZWQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCF0aGlzLmRpc2FibGVkKSB7XG4gICAgICAvLyBVc3VhbGx5IHRoaXMgaXNuJ3QgbmVjZXNzYXJ5IHNpbmNlIHRoZSB3ZSBwcmV2ZW50IHRoZSBkZWZhdWx0IGFjdGlvbiBpbiBgcG9pbnRlckRvd25gLFxuICAgICAgLy8gYnV0IHNvbWUgY2FzZXMgbGlrZSBkcmFnZ2luZyBvZiBsaW5rcyBjYW4gc2xpcCB0aHJvdWdoIChzZWUgIzI0NDAzKS5cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKiBHZXRzIGEgaGFuZGxlIHRoYXQgaXMgdGhlIHRhcmdldCBvZiBhbiBldmVudC4gKi9cbiAgcHJpdmF0ZSBfZ2V0VGFyZ2V0SGFuZGxlKGV2ZW50OiBFdmVudCk6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5faGFuZGxlcy5maW5kKGhhbmRsZSA9PiB7XG4gICAgICByZXR1cm4gZXZlbnQudGFyZ2V0ICYmIChldmVudC50YXJnZXQgPT09IGhhbmRsZSB8fCBoYW5kbGUuY29udGFpbnMoZXZlbnQudGFyZ2V0IGFzIE5vZGUpKTtcbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIEdldHMgYSAzZCBgdHJhbnNmb3JtYCB0aGF0IGNhbiBiZSBhcHBsaWVkIHRvIGFuIGVsZW1lbnQuXG4gKiBAcGFyYW0geCBEZXNpcmVkIHBvc2l0aW9uIG9mIHRoZSBlbGVtZW50IGFsb25nIHRoZSBYIGF4aXMuXG4gKiBAcGFyYW0geSBEZXNpcmVkIHBvc2l0aW9uIG9mIHRoZSBlbGVtZW50IGFsb25nIHRoZSBZIGF4aXMuXG4gKi9cbmZ1bmN0aW9uIGdldFRyYW5zZm9ybSh4OiBudW1iZXIsIHk6IG51bWJlcik6IHN0cmluZyB7XG4gIC8vIFJvdW5kIHRoZSB0cmFuc2Zvcm1zIHNpbmNlIHNvbWUgYnJvd3NlcnMgd2lsbFxuICAvLyBibHVyIHRoZSBlbGVtZW50cyBmb3Igc3ViLXBpeGVsIHRyYW5zZm9ybXMuXG4gIHJldHVybiBgdHJhbnNsYXRlM2QoJHtNYXRoLnJvdW5kKHgpfXB4LCAke01hdGgucm91bmQoeSl9cHgsIDApYDtcbn1cblxuLyoqIENsYW1wcyBhIHZhbHVlIGJldHdlZW4gYSBtaW5pbXVtIGFuZCBhIG1heGltdW0uICovXG5mdW5jdGlvbiBjbGFtcCh2YWx1ZTogbnVtYmVyLCBtaW46IG51bWJlciwgbWF4OiBudW1iZXIpIHtcbiAgcmV0dXJuIE1hdGgubWF4KG1pbiwgTWF0aC5taW4obWF4LCB2YWx1ZSkpO1xufVxuXG4vKiogRGV0ZXJtaW5lcyB3aGV0aGVyIGFuIGV2ZW50IGlzIGEgdG91Y2ggZXZlbnQuICovXG5mdW5jdGlvbiBpc1RvdWNoRXZlbnQoZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KTogZXZlbnQgaXMgVG91Y2hFdmVudCB7XG4gIC8vIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGZvciBldmVyeSBwaXhlbCB0aGF0IHRoZSB1c2VyIGhhcyBkcmFnZ2VkIHNvIHdlIG5lZWQgaXQgdG8gYmVcbiAgLy8gYXMgZmFzdCBhcyBwb3NzaWJsZS4gU2luY2Ugd2Ugb25seSBiaW5kIG1vdXNlIGV2ZW50cyBhbmQgdG91Y2ggZXZlbnRzLCB3ZSBjYW4gYXNzdW1lXG4gIC8vIHRoYXQgaWYgdGhlIGV2ZW50J3MgbmFtZSBzdGFydHMgd2l0aCBgdGAsIGl0J3MgYSB0b3VjaCBldmVudC5cbiAgcmV0dXJuIGV2ZW50LnR5cGVbMF0gPT09ICd0Jztcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSByb290IEhUTUwgZWxlbWVudCBvZiBhbiBlbWJlZGRlZCB2aWV3LlxuICogSWYgdGhlIHJvb3QgaXMgbm90IGFuIEhUTUwgZWxlbWVudCBpdCBnZXRzIHdyYXBwZWQgaW4gb25lLlxuICovXG5mdW5jdGlvbiBnZXRSb290Tm9kZSh2aWV3UmVmOiBFbWJlZGRlZFZpZXdSZWY8YW55PiwgX2RvY3VtZW50OiBEb2N1bWVudCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3Qgcm9vdE5vZGVzOiBOb2RlW10gPSB2aWV3UmVmLnJvb3ROb2RlcztcblxuICBpZiAocm9vdE5vZGVzLmxlbmd0aCA9PT0gMSAmJiByb290Tm9kZXNbMF0ubm9kZVR5cGUgPT09IF9kb2N1bWVudC5FTEVNRU5UX05PREUpIHtcbiAgICByZXR1cm4gcm9vdE5vZGVzWzBdIGFzIEhUTUxFbGVtZW50O1xuICB9XG5cbiAgY29uc3Qgd3JhcHBlciA9IF9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgcm9vdE5vZGVzLmZvckVhY2gobm9kZSA9PiB3cmFwcGVyLmFwcGVuZENoaWxkKG5vZGUpKTtcbiAgcmV0dXJuIHdyYXBwZXI7XG59XG5cbi8qKlxuICogTWF0Y2hlcyB0aGUgdGFyZ2V0IGVsZW1lbnQncyBzaXplIHRvIHRoZSBzb3VyY2UncyBzaXplLlxuICogQHBhcmFtIHRhcmdldCBFbGVtZW50IHRoYXQgbmVlZHMgdG8gYmUgcmVzaXplZC5cbiAqIEBwYXJhbSBzb3VyY2VSZWN0IERpbWVuc2lvbnMgb2YgdGhlIHNvdXJjZSBlbGVtZW50LlxuICovXG5mdW5jdGlvbiBtYXRjaEVsZW1lbnRTaXplKHRhcmdldDogSFRNTEVsZW1lbnQsIHNvdXJjZVJlY3Q6IENsaWVudFJlY3QpOiB2b2lkIHtcbiAgdGFyZ2V0LnN0eWxlLndpZHRoID0gYCR7c291cmNlUmVjdC53aWR0aH1weGA7XG4gIHRhcmdldC5zdHlsZS5oZWlnaHQgPSBgJHtzb3VyY2VSZWN0LmhlaWdodH1weGA7XG4gIHRhcmdldC5zdHlsZS50cmFuc2Zvcm0gPSBnZXRUcmFuc2Zvcm0oc291cmNlUmVjdC5sZWZ0LCBzb3VyY2VSZWN0LnRvcCk7XG59XG4iXX0=