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
import { getMutableClientRect, adjustDomRect } from './dom/dom-rect';
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
                        if (event.cancelable) {
                            event.preventDefault();
                        }
                        this._hasStartedDragging = true;
                        this._ngZone.run(() => this._startDragSequence(event));
                    }
                }
                return;
            }
            // We prevent the default action down here so that we know that dragging has started. This is
            // important for touch devices where doing this too early can unnecessarily block scrolling,
            // if there's a dragging delay.
            if (event.cancelable) {
                event.preventDefault();
            }
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
                const offset = this.constrainPosition ? this._initialDomRect : this._pickupPositionOnPage;
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
        this._initialDomRect = this._rootElement.getBoundingClientRect();
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
                : this._getPointerPositionInElement(this._initialDomRect, referenceElement, event);
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
        this._initialDomRect =
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
            const rootRect = previewConfig.matchSize ? this._initialDomRect : null;
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
            matchElementSize(preview, this._initialDomRect);
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
            ? this.constrainPosition(point, this, this._initialDomRect, this._pickupPositionInElement)
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
            // DOMRect dimensions are based on the scroll position of the page and its parent
            // node so we have to update the cached boundary DOMRect if the user has scrolled.
            if (this._boundaryRect &&
                target !== this._boundaryElement &&
                target.contains(this._boundaryElement)) {
                adjustDomRect(this._boundaryRect, scrollDifference.top, scrollDifference.left);
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
                : this._initialDomRect;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2RyYWctZHJvcC9kcmFnLXJlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFLSCxPQUFPLEVBQ0wsK0JBQStCLEVBQy9CLGVBQWUsRUFDZixjQUFjLEdBQ2YsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDcEQsT0FBTyxFQUFDLCtCQUErQixFQUFFLGdDQUFnQyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDcEcsT0FBTyxFQUFDLFlBQVksRUFBRSxPQUFPLEVBQWEsTUFBTSxNQUFNLENBQUM7QUFHdkQsT0FBTyxFQUNMLGlCQUFpQixFQUVqQixZQUFZLEVBQ1osNEJBQTRCLEVBQzVCLGdCQUFnQixHQUNqQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsa0NBQWtDLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUM3RSxPQUFPLEVBQUMsb0JBQW9CLEVBQUUsYUFBYSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDbkUsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDcEUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBdUIvQyxpRUFBaUU7QUFDakUsTUFBTSwyQkFBMkIsR0FBRywrQkFBK0IsQ0FBQyxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0FBRXJGLGlFQUFpRTtBQUNqRSxNQUFNLDBCQUEwQixHQUFHLCtCQUErQixDQUFDLEVBQUMsT0FBTyxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUM7QUFFckY7Ozs7O0dBS0c7QUFDSCxNQUFNLHVCQUF1QixHQUFHLEdBQUcsQ0FBQztBQXVCcEMsOERBQThEO0FBQzlELE1BQU0sdUJBQXVCLEdBQUcsSUFBSSxHQUFHLENBQUM7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Q3hGLHVGQUF1RjtJQUN2RixnRUFBZ0U7SUFDaEUsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQztBQUMvQixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyxXQUFXLENBQUMsT0FBNkIsRUFBRSxTQUFtQjtJQUNyRSxNQUFNLFNBQVMsR0FBVyxPQUFPLENBQUMsU0FBUyxDQUFDO0lBRTVDLElBQUksU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsS0FBSyxTQUFTLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDL0UsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFnQixDQUFDO0lBQ3JDLENBQUM7SUFFRCxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9DLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDckQsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFTLGdCQUFnQixDQUFDLE1BQW1CLEVBQUUsVUFBbUI7SUFDaEUsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsR0FBRyxVQUFVLENBQUMsS0FBSyxJQUFJLENBQUM7SUFDN0MsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsR0FBRyxVQUFVLENBQUMsTUFBTSxJQUFJLENBQUM7SUFDL0MsTUFBTSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsWUFBWSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3pFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtFbWJlZGRlZFZpZXdSZWYsIEVsZW1lbnRSZWYsIE5nWm9uZSwgVmlld0NvbnRhaW5lclJlZiwgVGVtcGxhdGVSZWZ9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtWaWV3cG9ydFJ1bGVyfSBmcm9tICdAYW5ndWxhci9jZGsvc2Nyb2xsaW5nJztcbmltcG9ydCB7RGlyZWN0aW9ufSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge1xuICBub3JtYWxpemVQYXNzaXZlTGlzdGVuZXJPcHRpb25zLFxuICBfZ2V0RXZlbnRUYXJnZXQsXG4gIF9nZXRTaGFkb3dSb290LFxufSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtjb2VyY2VFbGVtZW50fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtpc0Zha2VNb3VzZWRvd25Gcm9tU2NyZWVuUmVhZGVyLCBpc0Zha2VUb3VjaHN0YXJ0RnJvbVNjcmVlblJlYWRlcn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2ExMXknO1xuaW1wb3J0IHtTdWJzY3JpcHRpb24sIFN1YmplY3QsIE9ic2VydmFibGV9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHR5cGUge0Ryb3BMaXN0UmVmfSBmcm9tICcuL2Ryb3AtbGlzdC1yZWYnO1xuaW1wb3J0IHtEcmFnRHJvcFJlZ2lzdHJ5fSBmcm9tICcuL2RyYWctZHJvcC1yZWdpc3RyeSc7XG5pbXBvcnQge1xuICBjb21iaW5lVHJhbnNmb3JtcyxcbiAgRHJhZ0NTU1N0eWxlRGVjbGFyYXRpb24sXG4gIGV4dGVuZFN0eWxlcyxcbiAgdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucyxcbiAgdG9nZ2xlVmlzaWJpbGl0eSxcbn0gZnJvbSAnLi9kb20vc3R5bGluZyc7XG5pbXBvcnQge2dldFRyYW5zZm9ybVRyYW5zaXRpb25EdXJhdGlvbkluTXN9IGZyb20gJy4vZG9tL3RyYW5zaXRpb24tZHVyYXRpb24nO1xuaW1wb3J0IHtnZXRNdXRhYmxlQ2xpZW50UmVjdCwgYWRqdXN0RG9tUmVjdH0gZnJvbSAnLi9kb20vZG9tLXJlY3QnO1xuaW1wb3J0IHtQYXJlbnRQb3NpdGlvblRyYWNrZXJ9IGZyb20gJy4vZG9tL3BhcmVudC1wb3NpdGlvbi10cmFja2VyJztcbmltcG9ydCB7ZGVlcENsb25lTm9kZX0gZnJvbSAnLi9kb20vY2xvbmUtbm9kZSc7XG5cbi8qKiBPYmplY3QgdGhhdCBjYW4gYmUgdXNlZCB0byBjb25maWd1cmUgdGhlIGJlaGF2aW9yIG9mIERyYWdSZWYuICovXG5leHBvcnQgaW50ZXJmYWNlIERyYWdSZWZDb25maWcge1xuICAvKipcbiAgICogTWluaW11bSBhbW91bnQgb2YgcGl4ZWxzIHRoYXQgdGhlIHVzZXIgc2hvdWxkXG4gICAqIGRyYWcsIGJlZm9yZSB0aGUgQ0RLIGluaXRpYXRlcyBhIGRyYWcgc2VxdWVuY2UuXG4gICAqL1xuICBkcmFnU3RhcnRUaHJlc2hvbGQ6IG51bWJlcjtcblxuICAvKipcbiAgICogQW1vdW50IHRoZSBwaXhlbHMgdGhlIHVzZXIgc2hvdWxkIGRyYWcgYmVmb3JlIHRoZSBDREtcbiAgICogY29uc2lkZXJzIHRoZW0gdG8gaGF2ZSBjaGFuZ2VkIHRoZSBkcmFnIGRpcmVjdGlvbi5cbiAgICovXG4gIHBvaW50ZXJEaXJlY3Rpb25DaGFuZ2VUaHJlc2hvbGQ6IG51bWJlcjtcblxuICAvKiogYHotaW5kZXhgIGZvciB0aGUgYWJzb2x1dGVseS1wb3NpdGlvbmVkIGVsZW1lbnRzIHRoYXQgYXJlIGNyZWF0ZWQgYnkgdGhlIGRyYWcgaXRlbS4gKi9cbiAgekluZGV4PzogbnVtYmVyO1xuXG4gIC8qKiBSZWYgdGhhdCB0aGUgY3VycmVudCBkcmFnIGl0ZW0gaXMgbmVzdGVkIGluLiAqL1xuICBwYXJlbnREcmFnUmVmPzogRHJhZ1JlZjtcbn1cblxuLyoqIE9wdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCB0byBiaW5kIGEgcGFzc2l2ZSBldmVudCBsaXN0ZW5lci4gKi9cbmNvbnN0IHBhc3NpdmVFdmVudExpc3RlbmVyT3B0aW9ucyA9IG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMoe3Bhc3NpdmU6IHRydWV9KTtcblxuLyoqIE9wdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCB0byBiaW5kIGFuIGFjdGl2ZSBldmVudCBsaXN0ZW5lci4gKi9cbmNvbnN0IGFjdGl2ZUV2ZW50TGlzdGVuZXJPcHRpb25zID0gbm9ybWFsaXplUGFzc2l2ZUxpc3RlbmVyT3B0aW9ucyh7cGFzc2l2ZTogZmFsc2V9KTtcblxuLyoqXG4gKiBUaW1lIGluIG1pbGxpc2Vjb25kcyBmb3Igd2hpY2ggdG8gaWdub3JlIG1vdXNlIGV2ZW50cywgYWZ0ZXJcbiAqIHJlY2VpdmluZyBhIHRvdWNoIGV2ZW50LiBVc2VkIHRvIGF2b2lkIGRvaW5nIGRvdWJsZSB3b3JrIGZvclxuICogdG91Y2ggZGV2aWNlcyB3aGVyZSB0aGUgYnJvd3NlciBmaXJlcyBmYWtlIG1vdXNlIGV2ZW50cywgaW5cbiAqIGFkZGl0aW9uIHRvIHRvdWNoIGV2ZW50cy5cbiAqL1xuY29uc3QgTU9VU0VfRVZFTlRfSUdOT1JFX1RJTUUgPSA4MDA7XG5cbi8vIFRPRE8oY3Jpc2JldG8pOiBhZGQgYW4gQVBJIGZvciBtb3ZpbmcgYSBkcmFnZ2FibGUgdXAvZG93biB0aGVcbi8vIGxpc3QgcHJvZ3JhbW1hdGljYWxseS4gVXNlZnVsIGZvciBrZXlib2FyZCBjb250cm9scy5cblxuLyoqIFRlbXBsYXRlIHRoYXQgY2FuIGJlIHVzZWQgdG8gY3JlYXRlIGEgZHJhZyBoZWxwZXIgZWxlbWVudCAoZS5nLiBhIHByZXZpZXcgb3IgYSBwbGFjZWhvbGRlcikuICovXG5pbnRlcmZhY2UgRHJhZ0hlbHBlclRlbXBsYXRlPFQgPSBhbnk+IHtcbiAgdGVtcGxhdGU6IFRlbXBsYXRlUmVmPFQ+IHwgbnVsbDtcbiAgdmlld0NvbnRhaW5lcjogVmlld0NvbnRhaW5lclJlZjtcbiAgY29udGV4dDogVDtcbn1cblxuLyoqIFRlbXBsYXRlIHRoYXQgY2FuIGJlIHVzZWQgdG8gY3JlYXRlIGEgZHJhZyBwcmV2aWV3IGVsZW1lbnQuICovXG5pbnRlcmZhY2UgRHJhZ1ByZXZpZXdUZW1wbGF0ZTxUID0gYW55PiBleHRlbmRzIERyYWdIZWxwZXJUZW1wbGF0ZTxUPiB7XG4gIG1hdGNoU2l6ZT86IGJvb2xlYW47XG59XG5cbi8qKiBQb2ludCBvbiB0aGUgcGFnZSBvciB3aXRoaW4gYW4gZWxlbWVudC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUG9pbnQge1xuICB4OiBudW1iZXI7XG4gIHk6IG51bWJlcjtcbn1cblxuLyoqIElubGluZSBzdHlsZXMgdG8gYmUgc2V0IGFzIGAhaW1wb3J0YW50YCB3aGlsZSBkcmFnZ2luZy4gKi9cbmNvbnN0IGRyYWdJbXBvcnRhbnRQcm9wZXJ0aWVzID0gbmV3IFNldChbXG4gIC8vIE5lZWRzIHRvIGJlIGltcG9ydGFudCwgYmVjYXVzZSBzb21lIGBtYXQtdGFibGVgIHNldHMgYHBvc2l0aW9uOiBzdGlja3kgIWltcG9ydGFudGAuIFNlZSAjMjI3ODEuXG4gICdwb3NpdGlvbicsXG5dKTtcblxuLyoqXG4gKiBQb3NzaWJsZSBwbGFjZXMgaW50byB3aGljaCB0aGUgcHJldmlldyBvZiBhIGRyYWcgaXRlbSBjYW4gYmUgaW5zZXJ0ZWQuXG4gKiAtIGBnbG9iYWxgIC0gUHJldmlldyB3aWxsIGJlIGluc2VydGVkIGF0IHRoZSBib3R0b20gb2YgdGhlIGA8Ym9keT5gLiBUaGUgYWR2YW50YWdlIGlzIHRoYXRcbiAqIHlvdSBkb24ndCBoYXZlIHRvIHdvcnJ5IGFib3V0IGBvdmVyZmxvdzogaGlkZGVuYCBvciBgei1pbmRleGAsIGJ1dCB0aGUgaXRlbSB3b24ndCByZXRhaW5cbiAqIGl0cyBpbmhlcml0ZWQgc3R5bGVzLlxuICogLSBgcGFyZW50YCAtIFByZXZpZXcgd2lsbCBiZSBpbnNlcnRlZCBpbnRvIHRoZSBwYXJlbnQgb2YgdGhlIGRyYWcgaXRlbS4gVGhlIGFkdmFudGFnZSBpcyB0aGF0XG4gKiBpbmhlcml0ZWQgc3R5bGVzIHdpbGwgYmUgcHJlc2VydmVkLCBidXQgaXQgbWF5IGJlIGNsaXBwZWQgYnkgYG92ZXJmbG93OiBoaWRkZW5gIG9yIG5vdCBiZVxuICogdmlzaWJsZSBkdWUgdG8gYHotaW5kZXhgLiBGdXJ0aGVybW9yZSwgdGhlIHByZXZpZXcgaXMgZ29pbmcgdG8gaGF2ZSBhbiBlZmZlY3Qgb3ZlciBzZWxlY3RvcnNcbiAqIGxpa2UgYDpudGgtY2hpbGRgIGFuZCBzb21lIGZsZXhib3ggY29uZmlndXJhdGlvbnMuXG4gKiAtIGBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiB8IEhUTUxFbGVtZW50YCAtIFByZXZpZXcgd2lsbCBiZSBpbnNlcnRlZCBpbnRvIGEgc3BlY2lmaWMgZWxlbWVudC5cbiAqIFNhbWUgYWR2YW50YWdlcyBhbmQgZGlzYWR2YW50YWdlcyBhcyBgcGFyZW50YC5cbiAqL1xuZXhwb3J0IHR5cGUgUHJldmlld0NvbnRhaW5lciA9ICdnbG9iYWwnIHwgJ3BhcmVudCcgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiB8IEhUTUxFbGVtZW50O1xuXG4vKipcbiAqIFJlZmVyZW5jZSB0byBhIGRyYWdnYWJsZSBpdGVtLiBVc2VkIHRvIG1hbmlwdWxhdGUgb3IgZGlzcG9zZSBvZiB0aGUgaXRlbS5cbiAqL1xuZXhwb3J0IGNsYXNzIERyYWdSZWY8VCA9IGFueT4ge1xuICAvKiogRWxlbWVudCBkaXNwbGF5ZWQgbmV4dCB0byB0aGUgdXNlcidzIHBvaW50ZXIgd2hpbGUgdGhlIGVsZW1lbnQgaXMgZHJhZ2dlZC4gKi9cbiAgcHJpdmF0ZSBfcHJldmlldzogSFRNTEVsZW1lbnQ7XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgdmlldyBvZiB0aGUgcHJldmlldyBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9wcmV2aWV3UmVmOiBFbWJlZGRlZFZpZXdSZWY8YW55PiB8IG51bGw7XG5cbiAgLyoqIENvbnRhaW5lciBpbnRvIHdoaWNoIHRvIGluc2VydCB0aGUgcHJldmlldy4gKi9cbiAgcHJpdmF0ZSBfcHJldmlld0NvbnRhaW5lcjogUHJldmlld0NvbnRhaW5lciB8IHVuZGVmaW5lZDtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSB2aWV3IG9mIHRoZSBwbGFjZWhvbGRlciBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9wbGFjZWhvbGRlclJlZjogRW1iZWRkZWRWaWV3UmVmPGFueT4gfCBudWxsO1xuXG4gIC8qKiBFbGVtZW50IHRoYXQgaXMgcmVuZGVyZWQgaW5zdGVhZCBvZiB0aGUgZHJhZ2dhYmxlIGl0ZW0gd2hpbGUgaXQgaXMgYmVpbmcgc29ydGVkLiAqL1xuICBwcml2YXRlIF9wbGFjZWhvbGRlcjogSFRNTEVsZW1lbnQ7XG5cbiAgLyoqIENvb3JkaW5hdGVzIHdpdGhpbiB0aGUgZWxlbWVudCBhdCB3aGljaCB0aGUgdXNlciBwaWNrZWQgdXAgdGhlIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3BpY2t1cFBvc2l0aW9uSW5FbGVtZW50OiBQb2ludDtcblxuICAvKiogQ29vcmRpbmF0ZXMgb24gdGhlIHBhZ2UgYXQgd2hpY2ggdGhlIHVzZXIgcGlja2VkIHVwIHRoZSBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9waWNrdXBQb3NpdGlvbk9uUGFnZTogUG9pbnQ7XG5cbiAgLyoqXG4gICAqIEFuY2hvciBub2RlIHVzZWQgdG8gc2F2ZSB0aGUgcGxhY2UgaW4gdGhlIERPTSB3aGVyZSB0aGUgZWxlbWVudCB3YXNcbiAgICogcGlja2VkIHVwIHNvIHRoYXQgaXQgY2FuIGJlIHJlc3RvcmVkIGF0IHRoZSBlbmQgb2YgdGhlIGRyYWcgc2VxdWVuY2UuXG4gICAqL1xuICBwcml2YXRlIF9hbmNob3I6IENvbW1lbnQ7XG5cbiAgLyoqXG4gICAqIENTUyBgdHJhbnNmb3JtYCBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IHdoZW4gaXQgaXNuJ3QgYmVpbmcgZHJhZ2dlZC4gV2UgbmVlZCBhXG4gICAqIHBhc3NpdmUgdHJhbnNmb3JtIGluIG9yZGVyIGZvciB0aGUgZHJhZ2dlZCBlbGVtZW50IHRvIHJldGFpbiBpdHMgbmV3IHBvc2l0aW9uXG4gICAqIGFmdGVyIHRoZSB1c2VyIGhhcyBzdG9wcGVkIGRyYWdnaW5nIGFuZCBiZWNhdXNlIHdlIG5lZWQgdG8ga25vdyB0aGUgcmVsYXRpdmVcbiAgICogcG9zaXRpb24gaW4gY2FzZSB0aGV5IHN0YXJ0IGRyYWdnaW5nIGFnYWluLiBUaGlzIGNvcnJlc3BvbmRzIHRvIGBlbGVtZW50LnN0eWxlLnRyYW5zZm9ybWAuXG4gICAqL1xuICBwcml2YXRlIF9wYXNzaXZlVHJhbnNmb3JtOiBQb2ludCA9IHt4OiAwLCB5OiAwfTtcblxuICAvKiogQ1NTIGB0cmFuc2Zvcm1gIHRoYXQgaXMgYXBwbGllZCB0byB0aGUgZWxlbWVudCB3aGlsZSBpdCdzIGJlaW5nIGRyYWdnZWQuICovXG4gIHByaXZhdGUgX2FjdGl2ZVRyYW5zZm9ybTogUG9pbnQgPSB7eDogMCwgeTogMH07XG5cbiAgLyoqIElubGluZSBgdHJhbnNmb3JtYCB2YWx1ZSB0aGF0IHRoZSBlbGVtZW50IGhhZCBiZWZvcmUgdGhlIGZpcnN0IGRyYWdnaW5nIHNlcXVlbmNlLiAqL1xuICBwcml2YXRlIF9pbml0aWFsVHJhbnNmb3JtPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBkcmFnZ2luZyBzZXF1ZW5jZSBoYXMgYmVlbiBzdGFydGVkLiBEb2Vzbid0XG4gICAqIG5lY2Vzc2FyaWx5IG1lYW4gdGhhdCB0aGUgZWxlbWVudCBoYXMgYmVlbiBtb3ZlZC5cbiAgICovXG4gIHByaXZhdGUgX2hhc1N0YXJ0ZWREcmFnZ2luZyA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBlbGVtZW50IGhhcyBtb3ZlZCBzaW5jZSB0aGUgdXNlciBzdGFydGVkIGRyYWdnaW5nIGl0LiAqL1xuICBwcml2YXRlIF9oYXNNb3ZlZDogYm9vbGVhbjtcblxuICAvKiogRHJvcCBjb250YWluZXIgaW4gd2hpY2ggdGhlIERyYWdSZWYgcmVzaWRlZCB3aGVuIGRyYWdnaW5nIGJlZ2FuLiAqL1xuICBwcml2YXRlIF9pbml0aWFsQ29udGFpbmVyOiBEcm9wTGlzdFJlZjtcblxuICAvKiogSW5kZXggYXQgd2hpY2ggdGhlIGl0ZW0gc3RhcnRlZCBpbiBpdHMgaW5pdGlhbCBjb250YWluZXIuICovXG4gIHByaXZhdGUgX2luaXRpYWxJbmRleDogbnVtYmVyO1xuXG4gIC8qKiBDYWNoZWQgcG9zaXRpb25zIG9mIHNjcm9sbGFibGUgcGFyZW50IGVsZW1lbnRzLiAqL1xuICBwcml2YXRlIF9wYXJlbnRQb3NpdGlvbnM6IFBhcmVudFBvc2l0aW9uVHJhY2tlcjtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgaXRlbSBpcyBiZWluZyBtb3ZlZC4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfbW92ZUV2ZW50cyA9IG5ldyBTdWJqZWN0PHtcbiAgICBzb3VyY2U6IERyYWdSZWY7XG4gICAgcG9pbnRlclBvc2l0aW9uOiB7eDogbnVtYmVyOyB5OiBudW1iZXJ9O1xuICAgIGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudDtcbiAgICBkaXN0YW5jZTogUG9pbnQ7XG4gICAgZGVsdGE6IHt4OiAtMSB8IDAgfCAxOyB5OiAtMSB8IDAgfCAxfTtcbiAgfT4oKTtcblxuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgdXNlciBpcyBkcmFnZ2luZyBhbG9uZyBlYWNoIGF4aXMuICovXG4gIHByaXZhdGUgX3BvaW50ZXJEaXJlY3Rpb25EZWx0YToge3g6IC0xIHwgMCB8IDE7IHk6IC0xIHwgMCB8IDF9O1xuXG4gIC8qKiBQb2ludGVyIHBvc2l0aW9uIGF0IHdoaWNoIHRoZSBsYXN0IGNoYW5nZSBpbiB0aGUgZGVsdGEgb2NjdXJyZWQuICovXG4gIHByaXZhdGUgX3BvaW50ZXJQb3NpdGlvbkF0TGFzdERpcmVjdGlvbkNoYW5nZTogUG9pbnQ7XG5cbiAgLyoqIFBvc2l0aW9uIG9mIHRoZSBwb2ludGVyIGF0IHRoZSBsYXN0IHBvaW50ZXIgZXZlbnQuICovXG4gIHByaXZhdGUgX2xhc3RLbm93blBvaW50ZXJQb3NpdGlvbjogUG9pbnQ7XG5cbiAgLyoqXG4gICAqIFJvb3QgRE9NIG5vZGUgb2YgdGhlIGRyYWcgaW5zdGFuY2UuIFRoaXMgaXMgdGhlIGVsZW1lbnQgdGhhdCB3aWxsXG4gICAqIGJlIG1vdmVkIGFyb3VuZCBhcyB0aGUgdXNlciBpcyBkcmFnZ2luZy5cbiAgICovXG4gIHByaXZhdGUgX3Jvb3RFbGVtZW50OiBIVE1MRWxlbWVudDtcblxuICAvKipcbiAgICogTmVhcmVzdCBhbmNlc3RvciBTVkcsIHJlbGF0aXZlIHRvIHdoaWNoIGNvb3JkaW5hdGVzIGFyZSBjYWxjdWxhdGVkIGlmIGRyYWdnaW5nIFNWR0VsZW1lbnRcbiAgICovXG4gIHByaXZhdGUgX293bmVyU1ZHRWxlbWVudDogU1ZHU1ZHRWxlbWVudCB8IG51bGw7XG5cbiAgLyoqXG4gICAqIElubGluZSBzdHlsZSB2YWx1ZSBvZiBgLXdlYmtpdC10YXAtaGlnaGxpZ2h0LWNvbG9yYCBhdCB0aGUgdGltZSB0aGVcbiAgICogZHJhZ2dpbmcgd2FzIHN0YXJ0ZWQuIFVzZWQgdG8gcmVzdG9yZSB0aGUgdmFsdWUgb25jZSB3ZSdyZSBkb25lIGRyYWdnaW5nLlxuICAgKi9cbiAgcHJpdmF0ZSBfcm9vdEVsZW1lbnRUYXBIaWdobGlnaHQ6IHN0cmluZztcblxuICAvKiogU3Vic2NyaXB0aW9uIHRvIHBvaW50ZXIgbW92ZW1lbnQgZXZlbnRzLiAqL1xuICBwcml2YXRlIF9wb2ludGVyTW92ZVN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcblxuICAvKiogU3Vic2NyaXB0aW9uIHRvIHRoZSBldmVudCB0aGF0IGlzIGRpc3BhdGNoZWQgd2hlbiB0aGUgdXNlciBsaWZ0cyB0aGVpciBwb2ludGVyLiAqL1xuICBwcml2YXRlIF9wb2ludGVyVXBTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG5cbiAgLyoqIFN1YnNjcmlwdGlvbiB0byB0aGUgdmlld3BvcnQgYmVpbmcgc2Nyb2xsZWQuICovXG4gIHByaXZhdGUgX3Njcm9sbFN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcblxuICAvKiogU3Vic2NyaXB0aW9uIHRvIHRoZSB2aWV3cG9ydCBiZWluZyByZXNpemVkLiAqL1xuICBwcml2YXRlIF9yZXNpemVTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG5cbiAgLyoqXG4gICAqIFRpbWUgYXQgd2hpY2ggdGhlIGxhc3QgdG91Y2ggZXZlbnQgb2NjdXJyZWQuIFVzZWQgdG8gYXZvaWQgZmlyaW5nIHRoZSBzYW1lXG4gICAqIGV2ZW50cyBtdWx0aXBsZSB0aW1lcyBvbiB0b3VjaCBkZXZpY2VzIHdoZXJlIHRoZSBicm93c2VyIHdpbGwgZmlyZSBhIGZha2VcbiAgICogbW91c2UgZXZlbnQgZm9yIGVhY2ggdG91Y2ggZXZlbnQsIGFmdGVyIGEgY2VydGFpbiB0aW1lLlxuICAgKi9cbiAgcHJpdmF0ZSBfbGFzdFRvdWNoRXZlbnRUaW1lOiBudW1iZXI7XG5cbiAgLyoqIFRpbWUgYXQgd2hpY2ggdGhlIGxhc3QgZHJhZ2dpbmcgc2VxdWVuY2Ugd2FzIHN0YXJ0ZWQuICovXG4gIHByaXZhdGUgX2RyYWdTdGFydFRpbWU6IG51bWJlcjtcblxuICAvKiogQ2FjaGVkIHJlZmVyZW5jZSB0byB0aGUgYm91bmRhcnkgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfYm91bmRhcnlFbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBuYXRpdmUgZHJhZ2dpbmcgaW50ZXJhY3Rpb25zIGhhdmUgYmVlbiBlbmFibGVkIG9uIHRoZSByb290IGVsZW1lbnQuICovXG4gIHByaXZhdGUgX25hdGl2ZUludGVyYWN0aW9uc0VuYWJsZWQgPSB0cnVlO1xuXG4gIC8qKiBDbGllbnQgcmVjdCBvZiB0aGUgcm9vdCBlbGVtZW50IHdoZW4gdGhlIGRyYWdnaW5nIHNlcXVlbmNlIGhhcyBzdGFydGVkLiAqL1xuICBwcml2YXRlIF9pbml0aWFsRG9tUmVjdD86IERPTVJlY3Q7XG5cbiAgLyoqIENhY2hlZCBkaW1lbnNpb25zIG9mIHRoZSBwcmV2aWV3IGVsZW1lbnQuIFNob3VsZCBiZSByZWFkIHZpYSBgX2dldFByZXZpZXdSZWN0YC4gKi9cbiAgcHJpdmF0ZSBfcHJldmlld1JlY3Q/OiBET01SZWN0O1xuXG4gIC8qKiBDYWNoZWQgZGltZW5zaW9ucyBvZiB0aGUgYm91bmRhcnkgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfYm91bmRhcnlSZWN0PzogRE9NUmVjdDtcblxuICAvKiogRWxlbWVudCB0aGF0IHdpbGwgYmUgdXNlZCBhcyBhIHRlbXBsYXRlIHRvIGNyZWF0ZSB0aGUgZHJhZ2dhYmxlIGl0ZW0ncyBwcmV2aWV3LiAqL1xuICBwcml2YXRlIF9wcmV2aWV3VGVtcGxhdGU/OiBEcmFnUHJldmlld1RlbXBsYXRlIHwgbnVsbDtcblxuICAvKiogVGVtcGxhdGUgZm9yIHBsYWNlaG9sZGVyIGVsZW1lbnQgcmVuZGVyZWQgdG8gc2hvdyB3aGVyZSBhIGRyYWdnYWJsZSB3b3VsZCBiZSBkcm9wcGVkLiAqL1xuICBwcml2YXRlIF9wbGFjZWhvbGRlclRlbXBsYXRlPzogRHJhZ0hlbHBlclRlbXBsYXRlIHwgbnVsbDtcblxuICAvKiogRWxlbWVudHMgdGhhdCBjYW4gYmUgdXNlZCB0byBkcmFnIHRoZSBkcmFnZ2FibGUgaXRlbS4gKi9cbiAgcHJpdmF0ZSBfaGFuZGxlczogSFRNTEVsZW1lbnRbXSA9IFtdO1xuXG4gIC8qKiBSZWdpc3RlcmVkIGhhbmRsZXMgdGhhdCBhcmUgY3VycmVudGx5IGRpc2FibGVkLiAqL1xuICBwcml2YXRlIF9kaXNhYmxlZEhhbmRsZXMgPSBuZXcgU2V0PEhUTUxFbGVtZW50PigpO1xuXG4gIC8qKiBEcm9wcGFibGUgY29udGFpbmVyIHRoYXQgdGhlIGRyYWdnYWJsZSBpcyBhIHBhcnQgb2YuICovXG4gIHByaXZhdGUgX2Ryb3BDb250YWluZXI/OiBEcm9wTGlzdFJlZjtcblxuICAvKiogTGF5b3V0IGRpcmVjdGlvbiBvZiB0aGUgaXRlbS4gKi9cbiAgcHJpdmF0ZSBfZGlyZWN0aW9uOiBEaXJlY3Rpb24gPSAnbHRyJztcblxuICAvKiogUmVmIHRoYXQgdGhlIGN1cnJlbnQgZHJhZyBpdGVtIGlzIG5lc3RlZCBpbi4gKi9cbiAgcHJpdmF0ZSBfcGFyZW50RHJhZ1JlZjogRHJhZ1JlZjx1bmtub3duPiB8IG51bGw7XG5cbiAgLyoqXG4gICAqIENhY2hlZCBzaGFkb3cgcm9vdCB0aGF0IHRoZSBlbGVtZW50IGlzIHBsYWNlZCBpbi4gYG51bGxgIG1lYW5zIHRoYXQgdGhlIGVsZW1lbnQgaXNuJ3QgaW5cbiAgICogdGhlIHNoYWRvdyBET00gYW5kIGB1bmRlZmluZWRgIG1lYW5zIHRoYXQgaXQgaGFzbid0IGJlZW4gcmVzb2x2ZWQgeWV0LiBTaG91bGQgYmUgcmVhZCB2aWFcbiAgICogYF9nZXRTaGFkb3dSb290YCwgbm90IGRpcmVjdGx5LlxuICAgKi9cbiAgcHJpdmF0ZSBfY2FjaGVkU2hhZG93Um9vdDogU2hhZG93Um9vdCB8IG51bGwgfCB1bmRlZmluZWQ7XG5cbiAgLyoqIEF4aXMgYWxvbmcgd2hpY2ggZHJhZ2dpbmcgaXMgbG9ja2VkLiAqL1xuICBsb2NrQXhpczogJ3gnIHwgJ3knO1xuXG4gIC8qKlxuICAgKiBBbW91bnQgb2YgbWlsbGlzZWNvbmRzIHRvIHdhaXQgYWZ0ZXIgdGhlIHVzZXIgaGFzIHB1dCB0aGVpclxuICAgKiBwb2ludGVyIGRvd24gYmVmb3JlIHN0YXJ0aW5nIHRvIGRyYWcgdGhlIGVsZW1lbnQuXG4gICAqL1xuICBkcmFnU3RhcnREZWxheTogbnVtYmVyIHwge3RvdWNoOiBudW1iZXI7IG1vdXNlOiBudW1iZXJ9ID0gMDtcblxuICAvKiogQ2xhc3MgdG8gYmUgYWRkZWQgdG8gdGhlIHByZXZpZXcgZWxlbWVudC4gKi9cbiAgcHJldmlld0NsYXNzOiBzdHJpbmcgfCBzdHJpbmdbXSB8IHVuZGVmaW5lZDtcblxuICAvKiogV2hldGhlciBzdGFydGluZyB0byBkcmFnIHRoaXMgZWxlbWVudCBpcyBkaXNhYmxlZC4gKi9cbiAgZ2V0IGRpc2FibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9kaXNhYmxlZCB8fCAhISh0aGlzLl9kcm9wQ29udGFpbmVyICYmIHRoaXMuX2Ryb3BDb250YWluZXIuZGlzYWJsZWQpO1xuICB9XG4gIHNldCBkaXNhYmxlZCh2YWx1ZTogYm9vbGVhbikge1xuICAgIGlmICh2YWx1ZSAhPT0gdGhpcy5fZGlzYWJsZWQpIHtcbiAgICAgIHRoaXMuX2Rpc2FibGVkID0gdmFsdWU7XG4gICAgICB0aGlzLl90b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKCk7XG4gICAgICB0aGlzLl9oYW5kbGVzLmZvckVhY2goaGFuZGxlID0+IHRvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMoaGFuZGxlLCB2YWx1ZSkpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIF9kaXNhYmxlZCA9IGZhbHNlO1xuXG4gIC8qKiBFbWl0cyBhcyB0aGUgZHJhZyBzZXF1ZW5jZSBpcyBiZWluZyBwcmVwYXJlZC4gKi9cbiAgcmVhZG9ubHkgYmVmb3JlU3RhcnRlZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgc3RhcnRzIGRyYWdnaW5nIHRoZSBpdGVtLiAqL1xuICByZWFkb25seSBzdGFydGVkID0gbmV3IFN1YmplY3Q8e3NvdXJjZTogRHJhZ1JlZjsgZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50fT4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBoYXMgcmVsZWFzZWQgYSBkcmFnIGl0ZW0sIGJlZm9yZSBhbnkgYW5pbWF0aW9ucyBoYXZlIHN0YXJ0ZWQuICovXG4gIHJlYWRvbmx5IHJlbGVhc2VkID0gbmV3IFN1YmplY3Q8e3NvdXJjZTogRHJhZ1JlZjsgZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50fT4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBzdG9wcyBkcmFnZ2luZyBhbiBpdGVtIGluIHRoZSBjb250YWluZXIuICovXG4gIHJlYWRvbmx5IGVuZGVkID0gbmV3IFN1YmplY3Q8e1xuICAgIHNvdXJjZTogRHJhZ1JlZjtcbiAgICBkaXN0YW5jZTogUG9pbnQ7XG4gICAgZHJvcFBvaW50OiBQb2ludDtcbiAgICBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQ7XG4gIH0+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgaGFzIG1vdmVkIHRoZSBpdGVtIGludG8gYSBuZXcgY29udGFpbmVyLiAqL1xuICByZWFkb25seSBlbnRlcmVkID0gbmV3IFN1YmplY3Q8e2NvbnRhaW5lcjogRHJvcExpc3RSZWY7IGl0ZW06IERyYWdSZWY7IGN1cnJlbnRJbmRleDogbnVtYmVyfT4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciByZW1vdmVzIHRoZSBpdGVtIGl0cyBjb250YWluZXIgYnkgZHJhZ2dpbmcgaXQgaW50byBhbm90aGVyIGNvbnRhaW5lci4gKi9cbiAgcmVhZG9ubHkgZXhpdGVkID0gbmV3IFN1YmplY3Q8e2NvbnRhaW5lcjogRHJvcExpc3RSZWY7IGl0ZW06IERyYWdSZWZ9PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGRyb3BzIHRoZSBpdGVtIGluc2lkZSBhIGNvbnRhaW5lci4gKi9cbiAgcmVhZG9ubHkgZHJvcHBlZCA9IG5ldyBTdWJqZWN0PHtcbiAgICBwcmV2aW91c0luZGV4OiBudW1iZXI7XG4gICAgY3VycmVudEluZGV4OiBudW1iZXI7XG4gICAgaXRlbTogRHJhZ1JlZjtcbiAgICBjb250YWluZXI6IERyb3BMaXN0UmVmO1xuICAgIHByZXZpb3VzQ29udGFpbmVyOiBEcm9wTGlzdFJlZjtcbiAgICBkaXN0YW5jZTogUG9pbnQ7XG4gICAgZHJvcFBvaW50OiBQb2ludDtcbiAgICBpc1BvaW50ZXJPdmVyQ29udGFpbmVyOiBib29sZWFuO1xuICAgIGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudDtcbiAgfT4oKTtcblxuICAvKipcbiAgICogRW1pdHMgYXMgdGhlIHVzZXIgaXMgZHJhZ2dpbmcgdGhlIGl0ZW0uIFVzZSB3aXRoIGNhdXRpb24sXG4gICAqIGJlY2F1c2UgdGhpcyBldmVudCB3aWxsIGZpcmUgZm9yIGV2ZXJ5IHBpeGVsIHRoYXQgdGhlIHVzZXIgaGFzIGRyYWdnZWQuXG4gICAqL1xuICByZWFkb25seSBtb3ZlZDogT2JzZXJ2YWJsZTx7XG4gICAgc291cmNlOiBEcmFnUmVmO1xuICAgIHBvaW50ZXJQb3NpdGlvbjoge3g6IG51bWJlcjsgeTogbnVtYmVyfTtcbiAgICBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQ7XG4gICAgZGlzdGFuY2U6IFBvaW50O1xuICAgIGRlbHRhOiB7eDogLTEgfCAwIHwgMTsgeTogLTEgfCAwIHwgMX07XG4gIH0+ID0gdGhpcy5fbW92ZUV2ZW50cztcblxuICAvKiogQXJiaXRyYXJ5IGRhdGEgdGhhdCBjYW4gYmUgYXR0YWNoZWQgdG8gdGhlIGRyYWcgaXRlbS4gKi9cbiAgZGF0YTogVDtcblxuICAvKipcbiAgICogRnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB0byBjdXN0b21pemUgdGhlIGxvZ2ljIG9mIGhvdyB0aGUgcG9zaXRpb24gb2YgdGhlIGRyYWcgaXRlbVxuICAgKiBpcyBsaW1pdGVkIHdoaWxlIGl0J3MgYmVpbmcgZHJhZ2dlZC4gR2V0cyBjYWxsZWQgd2l0aCBhIHBvaW50IGNvbnRhaW5pbmcgdGhlIGN1cnJlbnQgcG9zaXRpb25cbiAgICogb2YgdGhlIHVzZXIncyBwb2ludGVyIG9uIHRoZSBwYWdlLCBhIHJlZmVyZW5jZSB0byB0aGUgaXRlbSBiZWluZyBkcmFnZ2VkIGFuZCBpdHMgZGltZW5zaW9ucy5cbiAgICogU2hvdWxkIHJldHVybiBhIHBvaW50IGRlc2NyaWJpbmcgd2hlcmUgdGhlIGl0ZW0gc2hvdWxkIGJlIHJlbmRlcmVkLlxuICAgKi9cbiAgY29uc3RyYWluUG9zaXRpb24/OiAoXG4gICAgdXNlclBvaW50ZXJQb3NpdGlvbjogUG9pbnQsXG4gICAgZHJhZ1JlZjogRHJhZ1JlZixcbiAgICBkaW1lbnNpb25zOiBET01SZWN0LFxuICAgIHBpY2t1cFBvc2l0aW9uSW5FbGVtZW50OiBQb2ludCxcbiAgKSA9PiBQb2ludDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiB8IEhUTUxFbGVtZW50LFxuICAgIHByaXZhdGUgX2NvbmZpZzogRHJhZ1JlZkNvbmZpZyxcbiAgICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQsXG4gICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgcHJpdmF0ZSBfdmlld3BvcnRSdWxlcjogVmlld3BvcnRSdWxlcixcbiAgICBwcml2YXRlIF9kcmFnRHJvcFJlZ2lzdHJ5OiBEcmFnRHJvcFJlZ2lzdHJ5PERyYWdSZWYsIERyb3BMaXN0UmVmPixcbiAgKSB7XG4gICAgdGhpcy53aXRoUm9vdEVsZW1lbnQoZWxlbWVudCkud2l0aFBhcmVudChfY29uZmlnLnBhcmVudERyYWdSZWYgfHwgbnVsbCk7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zID0gbmV3IFBhcmVudFBvc2l0aW9uVHJhY2tlcihfZG9jdW1lbnQpO1xuICAgIF9kcmFnRHJvcFJlZ2lzdHJ5LnJlZ2lzdGVyRHJhZ0l0ZW0odGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZWxlbWVudCB0aGF0IGlzIGJlaW5nIHVzZWQgYXMgYSBwbGFjZWhvbGRlclxuICAgKiB3aGlsZSB0aGUgY3VycmVudCBlbGVtZW50IGlzIGJlaW5nIGRyYWdnZWQuXG4gICAqL1xuICBnZXRQbGFjZWhvbGRlckVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLl9wbGFjZWhvbGRlcjtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHRoZSByb290IGRyYWdnYWJsZSBlbGVtZW50LiAqL1xuICBnZXRSb290RWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX3Jvb3RFbGVtZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnRseS12aXNpYmxlIGVsZW1lbnQgdGhhdCByZXByZXNlbnRzIHRoZSBkcmFnIGl0ZW0uXG4gICAqIFdoaWxlIGRyYWdnaW5nIHRoaXMgaXMgdGhlIHBsYWNlaG9sZGVyLCBvdGhlcndpc2UgaXQncyB0aGUgcm9vdCBlbGVtZW50LlxuICAgKi9cbiAgZ2V0VmlzaWJsZUVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLmlzRHJhZ2dpbmcoKSA/IHRoaXMuZ2V0UGxhY2Vob2xkZXJFbGVtZW50KCkgOiB0aGlzLmdldFJvb3RFbGVtZW50KCk7XG4gIH1cblxuICAvKiogUmVnaXN0ZXJzIHRoZSBoYW5kbGVzIHRoYXQgY2FuIGJlIHVzZWQgdG8gZHJhZyB0aGUgZWxlbWVudC4gKi9cbiAgd2l0aEhhbmRsZXMoaGFuZGxlczogKEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4pW10pOiB0aGlzIHtcbiAgICB0aGlzLl9oYW5kbGVzID0gaGFuZGxlcy5tYXAoaGFuZGxlID0+IGNvZXJjZUVsZW1lbnQoaGFuZGxlKSk7XG4gICAgdGhpcy5faGFuZGxlcy5mb3JFYWNoKGhhbmRsZSA9PiB0b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKGhhbmRsZSwgdGhpcy5kaXNhYmxlZCkpO1xuICAgIHRoaXMuX3RvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMoKTtcblxuICAgIC8vIERlbGV0ZSBhbnkgbGluZ2VyaW5nIGRpc2FibGVkIGhhbmRsZXMgdGhhdCBtYXkgaGF2ZSBiZWVuIGRlc3Ryb3llZC4gTm90ZSB0aGF0IHdlIHJlLWNyZWF0ZVxuICAgIC8vIHRoZSBzZXQsIHJhdGhlciB0aGFuIGl0ZXJhdGUgb3ZlciBpdCBhbmQgZmlsdGVyIG91dCB0aGUgZGVzdHJveWVkIGhhbmRsZXMsIGJlY2F1c2Ugd2hpbGVcbiAgICAvLyB0aGUgRVMgc3BlYyBhbGxvd3MgZm9yIHNldHMgdG8gYmUgbW9kaWZpZWQgd2hpbGUgdGhleSdyZSBiZWluZyBpdGVyYXRlZCBvdmVyLCBzb21lIHBvbHlmaWxsc1xuICAgIC8vIHVzZSBhbiBhcnJheSBpbnRlcm5hbGx5IHdoaWNoIG1heSB0aHJvdyBhbiBlcnJvci5cbiAgICBjb25zdCBkaXNhYmxlZEhhbmRsZXMgPSBuZXcgU2V0PEhUTUxFbGVtZW50PigpO1xuICAgIHRoaXMuX2Rpc2FibGVkSGFuZGxlcy5mb3JFYWNoKGhhbmRsZSA9PiB7XG4gICAgICBpZiAodGhpcy5faGFuZGxlcy5pbmRleE9mKGhhbmRsZSkgPiAtMSkge1xuICAgICAgICBkaXNhYmxlZEhhbmRsZXMuYWRkKGhhbmRsZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5fZGlzYWJsZWRIYW5kbGVzID0gZGlzYWJsZWRIYW5kbGVzO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyB0aGUgdGVtcGxhdGUgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgdGhlIGRyYWcgcHJldmlldy5cbiAgICogQHBhcmFtIHRlbXBsYXRlIFRlbXBsYXRlIHRoYXQgZnJvbSB3aGljaCB0byBzdGFtcCBvdXQgdGhlIHByZXZpZXcuXG4gICAqL1xuICB3aXRoUHJldmlld1RlbXBsYXRlKHRlbXBsYXRlOiBEcmFnUHJldmlld1RlbXBsYXRlIHwgbnVsbCk6IHRoaXMge1xuICAgIHRoaXMuX3ByZXZpZXdUZW1wbGF0ZSA9IHRlbXBsYXRlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyB0aGUgdGVtcGxhdGUgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgdGhlIGRyYWcgcGxhY2Vob2xkZXIuXG4gICAqIEBwYXJhbSB0ZW1wbGF0ZSBUZW1wbGF0ZSB0aGF0IGZyb20gd2hpY2ggdG8gc3RhbXAgb3V0IHRoZSBwbGFjZWhvbGRlci5cbiAgICovXG4gIHdpdGhQbGFjZWhvbGRlclRlbXBsYXRlKHRlbXBsYXRlOiBEcmFnSGVscGVyVGVtcGxhdGUgfCBudWxsKTogdGhpcyB7XG4gICAgdGhpcy5fcGxhY2Vob2xkZXJUZW1wbGF0ZSA9IHRlbXBsYXRlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYW4gYWx0ZXJuYXRlIGRyYWcgcm9vdCBlbGVtZW50LiBUaGUgcm9vdCBlbGVtZW50IGlzIHRoZSBlbGVtZW50IHRoYXQgd2lsbCBiZSBtb3ZlZCBhc1xuICAgKiB0aGUgdXNlciBpcyBkcmFnZ2luZy4gUGFzc2luZyBhbiBhbHRlcm5hdGUgcm9vdCBlbGVtZW50IGlzIHVzZWZ1bCB3aGVuIHRyeWluZyB0byBlbmFibGVcbiAgICogZHJhZ2dpbmcgb24gYW4gZWxlbWVudCB0aGF0IHlvdSBtaWdodCBub3QgaGF2ZSBhY2Nlc3MgdG8uXG4gICAqL1xuICB3aXRoUm9vdEVsZW1lbnQocm9vdEVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+IHwgSFRNTEVsZW1lbnQpOiB0aGlzIHtcbiAgICBjb25zdCBlbGVtZW50ID0gY29lcmNlRWxlbWVudChyb290RWxlbWVudCk7XG5cbiAgICBpZiAoZWxlbWVudCAhPT0gdGhpcy5fcm9vdEVsZW1lbnQpIHtcbiAgICAgIGlmICh0aGlzLl9yb290RWxlbWVudCkge1xuICAgICAgICB0aGlzLl9yZW1vdmVSb290RWxlbWVudExpc3RlbmVycyh0aGlzLl9yb290RWxlbWVudCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fcG9pbnRlckRvd24sIGFjdGl2ZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5fcG9pbnRlckRvd24sIHBhc3NpdmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ3N0YXJ0JywgdGhpcy5fbmF0aXZlRHJhZ1N0YXJ0LCBhY3RpdmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuX2luaXRpYWxUcmFuc2Zvcm0gPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9yb290RWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBTVkdFbGVtZW50ICE9PSAndW5kZWZpbmVkJyAmJiB0aGlzLl9yb290RWxlbWVudCBpbnN0YW5jZW9mIFNWR0VsZW1lbnQpIHtcbiAgICAgIHRoaXMuX293bmVyU1ZHRWxlbWVudCA9IHRoaXMuX3Jvb3RFbGVtZW50Lm93bmVyU1ZHRWxlbWVudDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBFbGVtZW50IHRvIHdoaWNoIHRoZSBkcmFnZ2FibGUncyBwb3NpdGlvbiB3aWxsIGJlIGNvbnN0cmFpbmVkLlxuICAgKi9cbiAgd2l0aEJvdW5kYXJ5RWxlbWVudChib3VuZGFyeUVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+IHwgSFRNTEVsZW1lbnQgfCBudWxsKTogdGhpcyB7XG4gICAgdGhpcy5fYm91bmRhcnlFbGVtZW50ID0gYm91bmRhcnlFbGVtZW50ID8gY29lcmNlRWxlbWVudChib3VuZGFyeUVsZW1lbnQpIDogbnVsbDtcbiAgICB0aGlzLl9yZXNpemVTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICBpZiAoYm91bmRhcnlFbGVtZW50KSB7XG4gICAgICB0aGlzLl9yZXNpemVTdWJzY3JpcHRpb24gPSB0aGlzLl92aWV3cG9ydFJ1bGVyXG4gICAgICAgIC5jaGFuZ2UoMTApXG4gICAgICAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy5fY29udGFpbkluc2lkZUJvdW5kYXJ5T25SZXNpemUoKSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFNldHMgdGhlIHBhcmVudCByZWYgdGhhdCB0aGUgcmVmIGlzIG5lc3RlZCBpbi4gICovXG4gIHdpdGhQYXJlbnQocGFyZW50OiBEcmFnUmVmPHVua25vd24+IHwgbnVsbCk6IHRoaXMge1xuICAgIHRoaXMuX3BhcmVudERyYWdSZWYgPSBwYXJlbnQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogUmVtb3ZlcyB0aGUgZHJhZ2dpbmcgZnVuY3Rpb25hbGl0eSBmcm9tIHRoZSBET00gZWxlbWVudC4gKi9cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLl9yZW1vdmVSb290RWxlbWVudExpc3RlbmVycyh0aGlzLl9yb290RWxlbWVudCk7XG5cbiAgICAvLyBEbyB0aGlzIGNoZWNrIGJlZm9yZSByZW1vdmluZyBmcm9tIHRoZSByZWdpc3RyeSBzaW5jZSBpdCdsbFxuICAgIC8vIHN0b3AgYmVpbmcgY29uc2lkZXJlZCBhcyBkcmFnZ2VkIG9uY2UgaXQgaXMgcmVtb3ZlZC5cbiAgICBpZiAodGhpcy5pc0RyYWdnaW5nKCkpIHtcbiAgICAgIC8vIFNpbmNlIHdlIG1vdmUgb3V0IHRoZSBlbGVtZW50IHRvIHRoZSBlbmQgb2YgdGhlIGJvZHkgd2hpbGUgaXQncyBiZWluZ1xuICAgICAgLy8gZHJhZ2dlZCwgd2UgaGF2ZSB0byBtYWtlIHN1cmUgdGhhdCBpdCdzIHJlbW92ZWQgaWYgaXQgZ2V0cyBkZXN0cm95ZWQuXG4gICAgICB0aGlzLl9yb290RWxlbWVudD8ucmVtb3ZlKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fYW5jaG9yPy5yZW1vdmUoKTtcbiAgICB0aGlzLl9kZXN0cm95UHJldmlldygpO1xuICAgIHRoaXMuX2Rlc3Ryb3lQbGFjZWhvbGRlcigpO1xuICAgIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkucmVtb3ZlRHJhZ0l0ZW0odGhpcyk7XG4gICAgdGhpcy5fcmVtb3ZlU3Vic2NyaXB0aW9ucygpO1xuICAgIHRoaXMuYmVmb3JlU3RhcnRlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuc3RhcnRlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMucmVsZWFzZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmVuZGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5lbnRlcmVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5leGl0ZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmRyb3BwZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLl9tb3ZlRXZlbnRzLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5faGFuZGxlcyA9IFtdO1xuICAgIHRoaXMuX2Rpc2FibGVkSGFuZGxlcy5jbGVhcigpO1xuICAgIHRoaXMuX2Ryb3BDb250YWluZXIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fcmVzaXplU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLmNsZWFyKCk7XG4gICAgdGhpcy5fYm91bmRhcnlFbGVtZW50ID1cbiAgICAgIHRoaXMuX3Jvb3RFbGVtZW50ID1cbiAgICAgIHRoaXMuX293bmVyU1ZHRWxlbWVudCA9XG4gICAgICB0aGlzLl9wbGFjZWhvbGRlclRlbXBsYXRlID1cbiAgICAgIHRoaXMuX3ByZXZpZXdUZW1wbGF0ZSA9XG4gICAgICB0aGlzLl9hbmNob3IgPVxuICAgICAgdGhpcy5fcGFyZW50RHJhZ1JlZiA9XG4gICAgICAgIG51bGwhO1xuICB9XG5cbiAgLyoqIENoZWNrcyB3aGV0aGVyIHRoZSBlbGVtZW50IGlzIGN1cnJlbnRseSBiZWluZyBkcmFnZ2VkLiAqL1xuICBpc0RyYWdnaW5nKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9oYXNTdGFydGVkRHJhZ2dpbmcgJiYgdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5pc0RyYWdnaW5nKHRoaXMpO1xuICB9XG5cbiAgLyoqIFJlc2V0cyBhIHN0YW5kYWxvbmUgZHJhZyBpdGVtIHRvIGl0cyBpbml0aWFsIHBvc2l0aW9uLiAqL1xuICByZXNldCgpOiB2b2lkIHtcbiAgICB0aGlzLl9yb290RWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSB0aGlzLl9pbml0aWFsVHJhbnNmb3JtIHx8ICcnO1xuICAgIHRoaXMuX2FjdGl2ZVRyYW5zZm9ybSA9IHt4OiAwLCB5OiAwfTtcbiAgICB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtID0ge3g6IDAsIHk6IDB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSBoYW5kbGUgYXMgZGlzYWJsZWQuIFdoaWxlIGEgaGFuZGxlIGlzIGRpc2FibGVkLCBpdCdsbCBjYXB0dXJlIGFuZCBpbnRlcnJ1cHQgZHJhZ2dpbmcuXG4gICAqIEBwYXJhbSBoYW5kbGUgSGFuZGxlIGVsZW1lbnQgdGhhdCBzaG91bGQgYmUgZGlzYWJsZWQuXG4gICAqL1xuICBkaXNhYmxlSGFuZGxlKGhhbmRsZTogSFRNTEVsZW1lbnQpIHtcbiAgICBpZiAoIXRoaXMuX2Rpc2FibGVkSGFuZGxlcy5oYXMoaGFuZGxlKSAmJiB0aGlzLl9oYW5kbGVzLmluZGV4T2YoaGFuZGxlKSA+IC0xKSB7XG4gICAgICB0aGlzLl9kaXNhYmxlZEhhbmRsZXMuYWRkKGhhbmRsZSk7XG4gICAgICB0b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKGhhbmRsZSwgdHJ1ZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEVuYWJsZXMgYSBoYW5kbGUsIGlmIGl0IGhhcyBiZWVuIGRpc2FibGVkLlxuICAgKiBAcGFyYW0gaGFuZGxlIEhhbmRsZSBlbGVtZW50IHRvIGJlIGVuYWJsZWQuXG4gICAqL1xuICBlbmFibGVIYW5kbGUoaGFuZGxlOiBIVE1MRWxlbWVudCkge1xuICAgIGlmICh0aGlzLl9kaXNhYmxlZEhhbmRsZXMuaGFzKGhhbmRsZSkpIHtcbiAgICAgIHRoaXMuX2Rpc2FibGVkSGFuZGxlcy5kZWxldGUoaGFuZGxlKTtcbiAgICAgIHRvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMoaGFuZGxlLCB0aGlzLmRpc2FibGVkKTtcbiAgICB9XG4gIH1cblxuICAvKiogU2V0cyB0aGUgbGF5b3V0IGRpcmVjdGlvbiBvZiB0aGUgZHJhZ2dhYmxlIGl0ZW0uICovXG4gIHdpdGhEaXJlY3Rpb24oZGlyZWN0aW9uOiBEaXJlY3Rpb24pOiB0aGlzIHtcbiAgICB0aGlzLl9kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogU2V0cyB0aGUgY29udGFpbmVyIHRoYXQgdGhlIGl0ZW0gaXMgcGFydCBvZi4gKi9cbiAgX3dpdGhEcm9wQ29udGFpbmVyKGNvbnRhaW5lcjogRHJvcExpc3RSZWYpIHtcbiAgICB0aGlzLl9kcm9wQ29udGFpbmVyID0gY29udGFpbmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgcG9zaXRpb24gaW4gcGl4ZWxzIHRoZSBkcmFnZ2FibGUgb3V0c2lkZSBvZiBhIGRyb3AgY29udGFpbmVyLlxuICAgKi9cbiAgZ2V0RnJlZURyYWdQb3NpdGlvbigpOiBSZWFkb25seTxQb2ludD4ge1xuICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5pc0RyYWdnaW5nKCkgPyB0aGlzLl9hY3RpdmVUcmFuc2Zvcm0gOiB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtO1xuICAgIHJldHVybiB7eDogcG9zaXRpb24ueCwgeTogcG9zaXRpb24ueX07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY3VycmVudCBwb3NpdGlvbiBpbiBwaXhlbHMgdGhlIGRyYWdnYWJsZSBvdXRzaWRlIG9mIGEgZHJvcCBjb250YWluZXIuXG4gICAqIEBwYXJhbSB2YWx1ZSBOZXcgcG9zaXRpb24gdG8gYmUgc2V0LlxuICAgKi9cbiAgc2V0RnJlZURyYWdQb3NpdGlvbih2YWx1ZTogUG9pbnQpOiB0aGlzIHtcbiAgICB0aGlzLl9hY3RpdmVUcmFuc2Zvcm0gPSB7eDogMCwgeTogMH07XG4gICAgdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybS54ID0gdmFsdWUueDtcbiAgICB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtLnkgPSB2YWx1ZS55O1xuXG4gICAgaWYgKCF0aGlzLl9kcm9wQ29udGFpbmVyKSB7XG4gICAgICB0aGlzLl9hcHBseVJvb3RFbGVtZW50VHJhbnNmb3JtKHZhbHVlLngsIHZhbHVlLnkpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGNvbnRhaW5lciBpbnRvIHdoaWNoIHRvIGluc2VydCB0aGUgcHJldmlldyBlbGVtZW50LlxuICAgKiBAcGFyYW0gdmFsdWUgQ29udGFpbmVyIGludG8gd2hpY2ggdG8gaW5zZXJ0IHRoZSBwcmV2aWV3LlxuICAgKi9cbiAgd2l0aFByZXZpZXdDb250YWluZXIodmFsdWU6IFByZXZpZXdDb250YWluZXIpOiB0aGlzIHtcbiAgICB0aGlzLl9wcmV2aWV3Q29udGFpbmVyID0gdmFsdWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogVXBkYXRlcyB0aGUgaXRlbSdzIHNvcnQgb3JkZXIgYmFzZWQgb24gdGhlIGxhc3Qta25vd24gcG9pbnRlciBwb3NpdGlvbi4gKi9cbiAgX3NvcnRGcm9tTGFzdFBvaW50ZXJQb3NpdGlvbigpIHtcbiAgICBjb25zdCBwb3NpdGlvbiA9IHRoaXMuX2xhc3RLbm93blBvaW50ZXJQb3NpdGlvbjtcblxuICAgIGlmIChwb3NpdGlvbiAmJiB0aGlzLl9kcm9wQ29udGFpbmVyKSB7XG4gICAgICB0aGlzLl91cGRhdGVBY3RpdmVEcm9wQ29udGFpbmVyKHRoaXMuX2dldENvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uKHBvc2l0aW9uKSwgcG9zaXRpb24pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBVbnN1YnNjcmliZXMgZnJvbSB0aGUgZ2xvYmFsIHN1YnNjcmlwdGlvbnMuICovXG4gIHByaXZhdGUgX3JlbW92ZVN1YnNjcmlwdGlvbnMoKSB7XG4gICAgdGhpcy5fcG9pbnRlck1vdmVTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9wb2ludGVyVXBTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9zY3JvbGxTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIC8qKiBEZXN0cm95cyB0aGUgcHJldmlldyBlbGVtZW50IGFuZCBpdHMgVmlld1JlZi4gKi9cbiAgcHJpdmF0ZSBfZGVzdHJveVByZXZpZXcoKSB7XG4gICAgdGhpcy5fcHJldmlldz8ucmVtb3ZlKCk7XG4gICAgdGhpcy5fcHJldmlld1JlZj8uZGVzdHJveSgpO1xuICAgIHRoaXMuX3ByZXZpZXcgPSB0aGlzLl9wcmV2aWV3UmVmID0gbnVsbCE7XG4gIH1cblxuICAvKiogRGVzdHJveXMgdGhlIHBsYWNlaG9sZGVyIGVsZW1lbnQgYW5kIGl0cyBWaWV3UmVmLiAqL1xuICBwcml2YXRlIF9kZXN0cm95UGxhY2Vob2xkZXIoKSB7XG4gICAgdGhpcy5fcGxhY2Vob2xkZXI/LnJlbW92ZSgpO1xuICAgIHRoaXMuX3BsYWNlaG9sZGVyUmVmPy5kZXN0cm95KCk7XG4gICAgdGhpcy5fcGxhY2Vob2xkZXIgPSB0aGlzLl9wbGFjZWhvbGRlclJlZiA9IG51bGwhO1xuICB9XG5cbiAgLyoqIEhhbmRsZXIgZm9yIHRoZSBgbW91c2Vkb3duYC9gdG91Y2hzdGFydGAgZXZlbnRzLiAqL1xuICBwcml2YXRlIF9wb2ludGVyRG93biA9IChldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpID0+IHtcbiAgICB0aGlzLmJlZm9yZVN0YXJ0ZWQubmV4dCgpO1xuXG4gICAgLy8gRGVsZWdhdGUgdGhlIGV2ZW50IGJhc2VkIG9uIHdoZXRoZXIgaXQgc3RhcnRlZCBmcm9tIGEgaGFuZGxlIG9yIHRoZSBlbGVtZW50IGl0c2VsZi5cbiAgICBpZiAodGhpcy5faGFuZGxlcy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHRhcmdldEhhbmRsZSA9IHRoaXMuX2dldFRhcmdldEhhbmRsZShldmVudCk7XG5cbiAgICAgIGlmICh0YXJnZXRIYW5kbGUgJiYgIXRoaXMuX2Rpc2FibGVkSGFuZGxlcy5oYXModGFyZ2V0SGFuZGxlKSAmJiAhdGhpcy5kaXNhYmxlZCkge1xuICAgICAgICB0aGlzLl9pbml0aWFsaXplRHJhZ1NlcXVlbmNlKHRhcmdldEhhbmRsZSwgZXZlbnQpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIXRoaXMuZGlzYWJsZWQpIHtcbiAgICAgIHRoaXMuX2luaXRpYWxpemVEcmFnU2VxdWVuY2UodGhpcy5fcm9vdEVsZW1lbnQsIGV2ZW50KTtcbiAgICB9XG4gIH07XG5cbiAgLyoqIEhhbmRsZXIgdGhhdCBpcyBpbnZva2VkIHdoZW4gdGhlIHVzZXIgbW92ZXMgdGhlaXIgcG9pbnRlciBhZnRlciB0aGV5J3ZlIGluaXRpYXRlZCBhIGRyYWcuICovXG4gIHByaXZhdGUgX3BvaW50ZXJNb3ZlID0gKGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCkgPT4ge1xuICAgIGNvbnN0IHBvaW50ZXJQb3NpdGlvbiA9IHRoaXMuX2dldFBvaW50ZXJQb3NpdGlvbk9uUGFnZShldmVudCk7XG5cbiAgICBpZiAoIXRoaXMuX2hhc1N0YXJ0ZWREcmFnZ2luZykge1xuICAgICAgY29uc3QgZGlzdGFuY2VYID0gTWF0aC5hYnMocG9pbnRlclBvc2l0aW9uLnggLSB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZS54KTtcbiAgICAgIGNvbnN0IGRpc3RhbmNlWSA9IE1hdGguYWJzKHBvaW50ZXJQb3NpdGlvbi55IC0gdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UueSk7XG4gICAgICBjb25zdCBpc092ZXJUaHJlc2hvbGQgPSBkaXN0YW5jZVggKyBkaXN0YW5jZVkgPj0gdGhpcy5fY29uZmlnLmRyYWdTdGFydFRocmVzaG9sZDtcblxuICAgICAgLy8gT25seSBzdGFydCBkcmFnZ2luZyBhZnRlciB0aGUgdXNlciBoYXMgbW92ZWQgbW9yZSB0aGFuIHRoZSBtaW5pbXVtIGRpc3RhbmNlIGluIGVpdGhlclxuICAgICAgLy8gZGlyZWN0aW9uLiBOb3RlIHRoYXQgdGhpcyBpcyBwcmVmZXJhYmxlIG92ZXIgZG9pbmcgc29tZXRoaW5nIGxpa2UgYHNraXAobWluaW11bURpc3RhbmNlKWBcbiAgICAgIC8vIGluIHRoZSBgcG9pbnRlck1vdmVgIHN1YnNjcmlwdGlvbiwgYmVjYXVzZSB3ZSdyZSBub3QgZ3VhcmFudGVlZCB0byBoYXZlIG9uZSBtb3ZlIGV2ZW50XG4gICAgICAvLyBwZXIgcGl4ZWwgb2YgbW92ZW1lbnQgKGUuZy4gaWYgdGhlIHVzZXIgbW92ZXMgdGhlaXIgcG9pbnRlciBxdWlja2x5KS5cbiAgICAgIGlmIChpc092ZXJUaHJlc2hvbGQpIHtcbiAgICAgICAgY29uc3QgaXNEZWxheUVsYXBzZWQgPSBEYXRlLm5vdygpID49IHRoaXMuX2RyYWdTdGFydFRpbWUgKyB0aGlzLl9nZXREcmFnU3RhcnREZWxheShldmVudCk7XG4gICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuX2Ryb3BDb250YWluZXI7XG5cbiAgICAgICAgaWYgKCFpc0RlbGF5RWxhcHNlZCkge1xuICAgICAgICAgIHRoaXMuX2VuZERyYWdTZXF1ZW5jZShldmVudCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHJldmVudCBvdGhlciBkcmFnIHNlcXVlbmNlcyBmcm9tIHN0YXJ0aW5nIHdoaWxlIHNvbWV0aGluZyBpbiB0aGUgY29udGFpbmVyIGlzIHN0aWxsXG4gICAgICAgIC8vIGJlaW5nIGRyYWdnZWQuIFRoaXMgY2FuIGhhcHBlbiB3aGlsZSB3ZSdyZSB3YWl0aW5nIGZvciB0aGUgZHJvcCBhbmltYXRpb24gdG8gZmluaXNoXG4gICAgICAgIC8vIGFuZCBjYW4gY2F1c2UgZXJyb3JzLCBiZWNhdXNlIHNvbWUgZWxlbWVudHMgbWlnaHQgc3RpbGwgYmUgbW92aW5nIGFyb3VuZC5cbiAgICAgICAgaWYgKCFjb250YWluZXIgfHwgKCFjb250YWluZXIuaXNEcmFnZ2luZygpICYmICFjb250YWluZXIuaXNSZWNlaXZpbmcoKSkpIHtcbiAgICAgICAgICAvLyBQcmV2ZW50IHRoZSBkZWZhdWx0IGFjdGlvbiBhcyBzb29uIGFzIHRoZSBkcmFnZ2luZyBzZXF1ZW5jZSBpcyBjb25zaWRlcmVkIGFzXG4gICAgICAgICAgLy8gXCJzdGFydGVkXCIgc2luY2Ugd2FpdGluZyBmb3IgdGhlIG5leHQgZXZlbnQgY2FuIGFsbG93IHRoZSBkZXZpY2UgdG8gYmVnaW4gc2Nyb2xsaW5nLlxuICAgICAgICAgIGlmIChldmVudC5jYW5jZWxhYmxlKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLl9oYXNTdGFydGVkRHJhZ2dpbmcgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4gdGhpcy5fc3RhcnREcmFnU2VxdWVuY2UoZXZlbnQpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gV2UgcHJldmVudCB0aGUgZGVmYXVsdCBhY3Rpb24gZG93biBoZXJlIHNvIHRoYXQgd2Uga25vdyB0aGF0IGRyYWdnaW5nIGhhcyBzdGFydGVkLiBUaGlzIGlzXG4gICAgLy8gaW1wb3J0YW50IGZvciB0b3VjaCBkZXZpY2VzIHdoZXJlIGRvaW5nIHRoaXMgdG9vIGVhcmx5IGNhbiB1bm5lY2Vzc2FyaWx5IGJsb2NrIHNjcm9sbGluZyxcbiAgICAvLyBpZiB0aGVyZSdzIGEgZHJhZ2dpbmcgZGVsYXkuXG4gICAgaWYgKGV2ZW50LmNhbmNlbGFibGUpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuXG4gICAgY29uc3QgY29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24gPSB0aGlzLl9nZXRDb25zdHJhaW5lZFBvaW50ZXJQb3NpdGlvbihwb2ludGVyUG9zaXRpb24pO1xuICAgIHRoaXMuX2hhc01vdmVkID0gdHJ1ZTtcbiAgICB0aGlzLl9sYXN0S25vd25Qb2ludGVyUG9zaXRpb24gPSBwb2ludGVyUG9zaXRpb247XG4gICAgdGhpcy5fdXBkYXRlUG9pbnRlckRpcmVjdGlvbkRlbHRhKGNvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uKTtcblxuICAgIGlmICh0aGlzLl9kcm9wQ29udGFpbmVyKSB7XG4gICAgICB0aGlzLl91cGRhdGVBY3RpdmVEcm9wQ29udGFpbmVyKGNvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uLCBwb2ludGVyUG9zaXRpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB0aGVyZSdzIGEgcG9zaXRpb24gY29uc3RyYWludCBmdW5jdGlvbiwgd2Ugd2FudCB0aGUgZWxlbWVudCdzIHRvcC9sZWZ0IHRvIGJlIGF0IHRoZVxuICAgICAgLy8gc3BlY2lmaWMgcG9zaXRpb24gb24gdGhlIHBhZ2UuIFVzZSB0aGUgaW5pdGlhbCBwb3NpdGlvbiBhcyBhIHJlZmVyZW5jZSBpZiB0aGF0J3MgdGhlIGNhc2UuXG4gICAgICBjb25zdCBvZmZzZXQgPSB0aGlzLmNvbnN0cmFpblBvc2l0aW9uID8gdGhpcy5faW5pdGlhbERvbVJlY3QhIDogdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2U7XG4gICAgICBjb25zdCBhY3RpdmVUcmFuc2Zvcm0gPSB0aGlzLl9hY3RpdmVUcmFuc2Zvcm07XG4gICAgICBhY3RpdmVUcmFuc2Zvcm0ueCA9IGNvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uLnggLSBvZmZzZXQueCArIHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm0ueDtcbiAgICAgIGFjdGl2ZVRyYW5zZm9ybS55ID0gY29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24ueSAtIG9mZnNldC55ICsgdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybS55O1xuICAgICAgdGhpcy5fYXBwbHlSb290RWxlbWVudFRyYW5zZm9ybShhY3RpdmVUcmFuc2Zvcm0ueCwgYWN0aXZlVHJhbnNmb3JtLnkpO1xuICAgIH1cblxuICAgIC8vIFNpbmNlIHRoaXMgZXZlbnQgZ2V0cyBmaXJlZCBmb3IgZXZlcnkgcGl4ZWwgd2hpbGUgZHJhZ2dpbmcsIHdlIG9ubHlcbiAgICAvLyB3YW50IHRvIGZpcmUgaXQgaWYgdGhlIGNvbnN1bWVyIG9wdGVkIGludG8gaXQuIEFsc28gd2UgaGF2ZSB0b1xuICAgIC8vIHJlLWVudGVyIHRoZSB6b25lIGJlY2F1c2Ugd2UgcnVuIGFsbCBvZiB0aGUgZXZlbnRzIG9uIHRoZSBvdXRzaWRlLlxuICAgIGlmICh0aGlzLl9tb3ZlRXZlbnRzLm9ic2VydmVycy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICB0aGlzLl9tb3ZlRXZlbnRzLm5leHQoe1xuICAgICAgICAgIHNvdXJjZTogdGhpcyxcbiAgICAgICAgICBwb2ludGVyUG9zaXRpb246IGNvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uLFxuICAgICAgICAgIGV2ZW50LFxuICAgICAgICAgIGRpc3RhbmNlOiB0aGlzLl9nZXREcmFnRGlzdGFuY2UoY29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24pLFxuICAgICAgICAgIGRlbHRhOiB0aGlzLl9wb2ludGVyRGlyZWN0aW9uRGVsdGEsXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIC8qKiBIYW5kbGVyIHRoYXQgaXMgaW52b2tlZCB3aGVuIHRoZSB1c2VyIGxpZnRzIHRoZWlyIHBvaW50ZXIgdXAsIGFmdGVyIGluaXRpYXRpbmcgYSBkcmFnLiAqL1xuICBwcml2YXRlIF9wb2ludGVyVXAgPSAoZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KSA9PiB7XG4gICAgdGhpcy5fZW5kRHJhZ1NlcXVlbmNlKGV2ZW50KTtcbiAgfTtcblxuICAvKipcbiAgICogQ2xlYXJzIHN1YnNjcmlwdGlvbnMgYW5kIHN0b3BzIHRoZSBkcmFnZ2luZyBzZXF1ZW5jZS5cbiAgICogQHBhcmFtIGV2ZW50IEJyb3dzZXIgZXZlbnQgb2JqZWN0IHRoYXQgZW5kZWQgdGhlIHNlcXVlbmNlLlxuICAgKi9cbiAgcHJpdmF0ZSBfZW5kRHJhZ1NlcXVlbmNlKGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCkge1xuICAgIC8vIE5vdGUgdGhhdCBoZXJlIHdlIHVzZSBgaXNEcmFnZ2luZ2AgZnJvbSB0aGUgc2VydmljZSwgcmF0aGVyIHRoYW4gZnJvbSBgdGhpc2AuXG4gICAgLy8gVGhlIGRpZmZlcmVuY2UgaXMgdGhhdCB0aGUgb25lIGZyb20gdGhlIHNlcnZpY2UgcmVmbGVjdHMgd2hldGhlciBhIGRyYWdnaW5nIHNlcXVlbmNlXG4gICAgLy8gaGFzIGJlZW4gaW5pdGlhdGVkLCB3aGVyZWFzIHRoZSBvbmUgb24gYHRoaXNgIGluY2x1ZGVzIHdoZXRoZXIgdGhlIHVzZXIgaGFzIHBhc3NlZFxuICAgIC8vIHRoZSBtaW5pbXVtIGRyYWdnaW5nIHRocmVzaG9sZC5cbiAgICBpZiAoIXRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuaXNEcmFnZ2luZyh0aGlzKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3JlbW92ZVN1YnNjcmlwdGlvbnMoKTtcbiAgICB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnN0b3BEcmFnZ2luZyh0aGlzKTtcbiAgICB0aGlzLl90b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKCk7XG5cbiAgICBpZiAodGhpcy5faGFuZGxlcykge1xuICAgICAgKHRoaXMuX3Jvb3RFbGVtZW50LnN0eWxlIGFzIERyYWdDU1NTdHlsZURlY2xhcmF0aW9uKS53ZWJraXRUYXBIaWdobGlnaHRDb2xvciA9XG4gICAgICAgIHRoaXMuX3Jvb3RFbGVtZW50VGFwSGlnaGxpZ2h0O1xuICAgIH1cblxuICAgIGlmICghdGhpcy5faGFzU3RhcnRlZERyYWdnaW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5yZWxlYXNlZC5uZXh0KHtzb3VyY2U6IHRoaXMsIGV2ZW50fSk7XG5cbiAgICBpZiAodGhpcy5fZHJvcENvbnRhaW5lcikge1xuICAgICAgLy8gU3RvcCBzY3JvbGxpbmcgaW1tZWRpYXRlbHksIGluc3RlYWQgb2Ygd2FpdGluZyBmb3IgdGhlIGFuaW1hdGlvbiB0byBmaW5pc2guXG4gICAgICB0aGlzLl9kcm9wQ29udGFpbmVyLl9zdG9wU2Nyb2xsaW5nKCk7XG4gICAgICB0aGlzLl9hbmltYXRlUHJldmlld1RvUGxhY2Vob2xkZXIoKS50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5fY2xlYW51cERyYWdBcnRpZmFjdHMoZXZlbnQpO1xuICAgICAgICB0aGlzLl9jbGVhbnVwQ2FjaGVkRGltZW5zaW9ucygpO1xuICAgICAgICB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnN0b3BEcmFnZ2luZyh0aGlzKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBDb252ZXJ0IHRoZSBhY3RpdmUgdHJhbnNmb3JtIGludG8gYSBwYXNzaXZlIG9uZS4gVGhpcyBtZWFucyB0aGF0IG5leHQgdGltZVxuICAgICAgLy8gdGhlIHVzZXIgc3RhcnRzIGRyYWdnaW5nIHRoZSBpdGVtLCBpdHMgcG9zaXRpb24gd2lsbCBiZSBjYWxjdWxhdGVkIHJlbGF0aXZlbHlcbiAgICAgIC8vIHRvIHRoZSBuZXcgcGFzc2l2ZSB0cmFuc2Zvcm0uXG4gICAgICB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtLnggPSB0aGlzLl9hY3RpdmVUcmFuc2Zvcm0ueDtcbiAgICAgIGNvbnN0IHBvaW50ZXJQb3NpdGlvbiA9IHRoaXMuX2dldFBvaW50ZXJQb3NpdGlvbk9uUGFnZShldmVudCk7XG4gICAgICB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtLnkgPSB0aGlzLl9hY3RpdmVUcmFuc2Zvcm0ueTtcbiAgICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICB0aGlzLmVuZGVkLm5leHQoe1xuICAgICAgICAgIHNvdXJjZTogdGhpcyxcbiAgICAgICAgICBkaXN0YW5jZTogdGhpcy5fZ2V0RHJhZ0Rpc3RhbmNlKHBvaW50ZXJQb3NpdGlvbiksXG4gICAgICAgICAgZHJvcFBvaW50OiBwb2ludGVyUG9zaXRpb24sXG4gICAgICAgICAgZXZlbnQsXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICB0aGlzLl9jbGVhbnVwQ2FjaGVkRGltZW5zaW9ucygpO1xuICAgICAgdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5zdG9wRHJhZ2dpbmcodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFN0YXJ0cyB0aGUgZHJhZ2dpbmcgc2VxdWVuY2UuICovXG4gIHByaXZhdGUgX3N0YXJ0RHJhZ1NlcXVlbmNlKGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCkge1xuICAgIGlmIChpc1RvdWNoRXZlbnQoZXZlbnQpKSB7XG4gICAgICB0aGlzLl9sYXN0VG91Y2hFdmVudFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIH1cblxuICAgIHRoaXMuX3RvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMoKTtcblxuICAgIGNvbnN0IGRyb3BDb250YWluZXIgPSB0aGlzLl9kcm9wQ29udGFpbmVyO1xuXG4gICAgaWYgKGRyb3BDb250YWluZXIpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9yb290RWxlbWVudDtcbiAgICAgIGNvbnN0IHBhcmVudCA9IGVsZW1lbnQucGFyZW50Tm9kZSBhcyBIVE1MRWxlbWVudDtcbiAgICAgIGNvbnN0IHBsYWNlaG9sZGVyID0gKHRoaXMuX3BsYWNlaG9sZGVyID0gdGhpcy5fY3JlYXRlUGxhY2Vob2xkZXJFbGVtZW50KCkpO1xuICAgICAgY29uc3QgYW5jaG9yID0gKHRoaXMuX2FuY2hvciA9IHRoaXMuX2FuY2hvciB8fCB0aGlzLl9kb2N1bWVudC5jcmVhdGVDb21tZW50KCcnKSk7XG5cbiAgICAgIC8vIE5lZWRzIHRvIGhhcHBlbiBiZWZvcmUgdGhlIHJvb3QgZWxlbWVudCBpcyBtb3ZlZC5cbiAgICAgIGNvbnN0IHNoYWRvd1Jvb3QgPSB0aGlzLl9nZXRTaGFkb3dSb290KCk7XG5cbiAgICAgIC8vIEluc2VydCBhbiBhbmNob3Igbm9kZSBzbyB0aGF0IHdlIGNhbiByZXN0b3JlIHRoZSBlbGVtZW50J3MgcG9zaXRpb24gaW4gdGhlIERPTS5cbiAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUoYW5jaG9yLCBlbGVtZW50KTtcblxuICAgICAgLy8gVGhlcmUncyBubyByaXNrIG9mIHRyYW5zZm9ybXMgc3RhY2tpbmcgd2hlbiBpbnNpZGUgYSBkcm9wIGNvbnRhaW5lciBzb1xuICAgICAgLy8gd2UgY2FuIGtlZXAgdGhlIGluaXRpYWwgdHJhbnNmb3JtIHVwIHRvIGRhdGUgYW55IHRpbWUgZHJhZ2dpbmcgc3RhcnRzLlxuICAgICAgdGhpcy5faW5pdGlhbFRyYW5zZm9ybSA9IGVsZW1lbnQuc3R5bGUudHJhbnNmb3JtIHx8ICcnO1xuXG4gICAgICAvLyBDcmVhdGUgdGhlIHByZXZpZXcgYWZ0ZXIgdGhlIGluaXRpYWwgdHJhbnNmb3JtIGhhc1xuICAgICAgLy8gYmVlbiBjYWNoZWQsIGJlY2F1c2UgaXQgY2FuIGJlIGFmZmVjdGVkIGJ5IHRoZSB0cmFuc2Zvcm0uXG4gICAgICB0aGlzLl9wcmV2aWV3ID0gdGhpcy5fY3JlYXRlUHJldmlld0VsZW1lbnQoKTtcblxuICAgICAgLy8gV2UgbW92ZSB0aGUgZWxlbWVudCBvdXQgYXQgdGhlIGVuZCBvZiB0aGUgYm9keSBhbmQgd2UgbWFrZSBpdCBoaWRkZW4sIGJlY2F1c2Uga2VlcGluZyBpdCBpblxuICAgICAgLy8gcGxhY2Ugd2lsbCB0aHJvdyBvZmYgdGhlIGNvbnN1bWVyJ3MgYDpsYXN0LWNoaWxkYCBzZWxlY3RvcnMuIFdlIGNhbid0IHJlbW92ZSB0aGUgZWxlbWVudFxuICAgICAgLy8gZnJvbSB0aGUgRE9NIGNvbXBsZXRlbHksIGJlY2F1c2UgaU9TIHdpbGwgc3RvcCBmaXJpbmcgYWxsIHN1YnNlcXVlbnQgZXZlbnRzIGluIHRoZSBjaGFpbi5cbiAgICAgIHRvZ2dsZVZpc2liaWxpdHkoZWxlbWVudCwgZmFsc2UsIGRyYWdJbXBvcnRhbnRQcm9wZXJ0aWVzKTtcbiAgICAgIHRoaXMuX2RvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocGFyZW50LnJlcGxhY2VDaGlsZChwbGFjZWhvbGRlciwgZWxlbWVudCkpO1xuICAgICAgdGhpcy5fZ2V0UHJldmlld0luc2VydGlvblBvaW50KHBhcmVudCwgc2hhZG93Um9vdCkuYXBwZW5kQ2hpbGQodGhpcy5fcHJldmlldyk7XG4gICAgICB0aGlzLnN0YXJ0ZWQubmV4dCh7c291cmNlOiB0aGlzLCBldmVudH0pOyAvLyBFbWl0IGJlZm9yZSBub3RpZnlpbmcgdGhlIGNvbnRhaW5lci5cbiAgICAgIGRyb3BDb250YWluZXIuc3RhcnQoKTtcbiAgICAgIHRoaXMuX2luaXRpYWxDb250YWluZXIgPSBkcm9wQ29udGFpbmVyO1xuICAgICAgdGhpcy5faW5pdGlhbEluZGV4ID0gZHJvcENvbnRhaW5lci5nZXRJdGVtSW5kZXgodGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3RhcnRlZC5uZXh0KHtzb3VyY2U6IHRoaXMsIGV2ZW50fSk7XG4gICAgICB0aGlzLl9pbml0aWFsQ29udGFpbmVyID0gdGhpcy5faW5pdGlhbEluZGV4ID0gdW5kZWZpbmVkITtcbiAgICB9XG5cbiAgICAvLyBJbXBvcnRhbnQgdG8gcnVuIGFmdGVyIHdlJ3ZlIGNhbGxlZCBgc3RhcnRgIG9uIHRoZSBwYXJlbnQgY29udGFpbmVyXG4gICAgLy8gc28gdGhhdCBpdCBoYXMgaGFkIHRpbWUgdG8gcmVzb2x2ZSBpdHMgc2Nyb2xsYWJsZSBwYXJlbnRzLlxuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5jYWNoZShkcm9wQ29udGFpbmVyID8gZHJvcENvbnRhaW5lci5nZXRTY3JvbGxhYmxlUGFyZW50cygpIDogW10pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgdGhlIGRpZmZlcmVudCB2YXJpYWJsZXMgYW5kIHN1YnNjcmlwdGlvbnNcbiAgICogdGhhdCB3aWxsIGJlIG5lY2Vzc2FyeSBmb3IgdGhlIGRyYWdnaW5nIHNlcXVlbmNlLlxuICAgKiBAcGFyYW0gcmVmZXJlbmNlRWxlbWVudCBFbGVtZW50IHRoYXQgc3RhcnRlZCB0aGUgZHJhZyBzZXF1ZW5jZS5cbiAgICogQHBhcmFtIGV2ZW50IEJyb3dzZXIgZXZlbnQgb2JqZWN0IHRoYXQgc3RhcnRlZCB0aGUgc2VxdWVuY2UuXG4gICAqL1xuICBwcml2YXRlIF9pbml0aWFsaXplRHJhZ1NlcXVlbmNlKHJlZmVyZW5jZUVsZW1lbnQ6IEhUTUxFbGVtZW50LCBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpIHtcbiAgICAvLyBTdG9wIHByb3BhZ2F0aW9uIGlmIHRoZSBpdGVtIGlzIGluc2lkZSBhbm90aGVyXG4gICAgLy8gZHJhZ2dhYmxlIHNvIHdlIGRvbid0IHN0YXJ0IG11bHRpcGxlIGRyYWcgc2VxdWVuY2VzLlxuICAgIGlmICh0aGlzLl9wYXJlbnREcmFnUmVmKSB7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG5cbiAgICBjb25zdCBpc0RyYWdnaW5nID0gdGhpcy5pc0RyYWdnaW5nKCk7XG4gICAgY29uc3QgaXNUb3VjaFNlcXVlbmNlID0gaXNUb3VjaEV2ZW50KGV2ZW50KTtcbiAgICBjb25zdCBpc0F1eGlsaWFyeU1vdXNlQnV0dG9uID0gIWlzVG91Y2hTZXF1ZW5jZSAmJiAoZXZlbnQgYXMgTW91c2VFdmVudCkuYnV0dG9uICE9PSAwO1xuICAgIGNvbnN0IHJvb3RFbGVtZW50ID0gdGhpcy5fcm9vdEVsZW1lbnQ7XG4gICAgY29uc3QgdGFyZ2V0ID0gX2dldEV2ZW50VGFyZ2V0KGV2ZW50KTtcbiAgICBjb25zdCBpc1N5bnRoZXRpY0V2ZW50ID1cbiAgICAgICFpc1RvdWNoU2VxdWVuY2UgJiZcbiAgICAgIHRoaXMuX2xhc3RUb3VjaEV2ZW50VGltZSAmJlxuICAgICAgdGhpcy5fbGFzdFRvdWNoRXZlbnRUaW1lICsgTU9VU0VfRVZFTlRfSUdOT1JFX1RJTUUgPiBEYXRlLm5vdygpO1xuICAgIGNvbnN0IGlzRmFrZUV2ZW50ID0gaXNUb3VjaFNlcXVlbmNlXG4gICAgICA/IGlzRmFrZVRvdWNoc3RhcnRGcm9tU2NyZWVuUmVhZGVyKGV2ZW50IGFzIFRvdWNoRXZlbnQpXG4gICAgICA6IGlzRmFrZU1vdXNlZG93bkZyb21TY3JlZW5SZWFkZXIoZXZlbnQgYXMgTW91c2VFdmVudCk7XG5cbiAgICAvLyBJZiB0aGUgZXZlbnQgc3RhcnRlZCBmcm9tIGFuIGVsZW1lbnQgd2l0aCB0aGUgbmF0aXZlIEhUTUwgZHJhZyZkcm9wLCBpdCdsbCBpbnRlcmZlcmVcbiAgICAvLyB3aXRoIG91ciBvd24gZHJhZ2dpbmcgKGUuZy4gYGltZ2AgdGFncyBkbyBpdCBieSBkZWZhdWx0KS4gUHJldmVudCB0aGUgZGVmYXVsdCBhY3Rpb25cbiAgICAvLyB0byBzdG9wIGl0IGZyb20gaGFwcGVuaW5nLiBOb3RlIHRoYXQgcHJldmVudGluZyBvbiBgZHJhZ3N0YXJ0YCBhbHNvIHNlZW1zIHRvIHdvcmssIGJ1dFxuICAgIC8vIGl0J3MgZmxha3kgYW5kIGl0IGZhaWxzIGlmIHRoZSB1c2VyIGRyYWdzIGl0IGF3YXkgcXVpY2tseS4gQWxzbyBub3RlIHRoYXQgd2Ugb25seSB3YW50XG4gICAgLy8gdG8gZG8gdGhpcyBmb3IgYG1vdXNlZG93bmAgc2luY2UgZG9pbmcgdGhlIHNhbWUgZm9yIGB0b3VjaHN0YXJ0YCB3aWxsIHN0b3AgYW55IGBjbGlja2BcbiAgICAvLyBldmVudHMgZnJvbSBmaXJpbmcgb24gdG91Y2ggZGV2aWNlcy5cbiAgICBpZiAodGFyZ2V0ICYmICh0YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmRyYWdnYWJsZSAmJiBldmVudC50eXBlID09PSAnbW91c2Vkb3duJykge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICAvLyBBYm9ydCBpZiB0aGUgdXNlciBpcyBhbHJlYWR5IGRyYWdnaW5nIG9yIGlzIHVzaW5nIGEgbW91c2UgYnV0dG9uIG90aGVyIHRoYW4gdGhlIHByaW1hcnkgb25lLlxuICAgIGlmIChpc0RyYWdnaW5nIHx8IGlzQXV4aWxpYXJ5TW91c2VCdXR0b24gfHwgaXNTeW50aGV0aWNFdmVudCB8fCBpc0Zha2VFdmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIElmIHdlJ3ZlIGdvdCBoYW5kbGVzLCB3ZSBuZWVkIHRvIGRpc2FibGUgdGhlIHRhcCBoaWdobGlnaHQgb24gdGhlIGVudGlyZSByb290IGVsZW1lbnQsXG4gICAgLy8gb3RoZXJ3aXNlIGlPUyB3aWxsIHN0aWxsIGFkZCBpdCwgZXZlbiB0aG91Z2ggYWxsIHRoZSBkcmFnIGludGVyYWN0aW9ucyBvbiB0aGUgaGFuZGxlXG4gICAgLy8gYXJlIGRpc2FibGVkLlxuICAgIGlmICh0aGlzLl9oYW5kbGVzLmxlbmd0aCkge1xuICAgICAgY29uc3Qgcm9vdFN0eWxlcyA9IHJvb3RFbGVtZW50LnN0eWxlIGFzIERyYWdDU1NTdHlsZURlY2xhcmF0aW9uO1xuICAgICAgdGhpcy5fcm9vdEVsZW1lbnRUYXBIaWdobGlnaHQgPSByb290U3R5bGVzLndlYmtpdFRhcEhpZ2hsaWdodENvbG9yIHx8ICcnO1xuICAgICAgcm9vdFN0eWxlcy53ZWJraXRUYXBIaWdobGlnaHRDb2xvciA9ICd0cmFuc3BhcmVudCc7XG4gICAgfVxuXG4gICAgdGhpcy5faGFzU3RhcnRlZERyYWdnaW5nID0gdGhpcy5faGFzTW92ZWQgPSBmYWxzZTtcblxuICAgIC8vIEF2b2lkIG11bHRpcGxlIHN1YnNjcmlwdGlvbnMgYW5kIG1lbW9yeSBsZWFrcyB3aGVuIG11bHRpIHRvdWNoXG4gICAgLy8gKGlzRHJhZ2dpbmcgY2hlY2sgYWJvdmUgaXNuJ3QgZW5vdWdoIGJlY2F1c2Ugb2YgcG9zc2libGUgdGVtcG9yYWwgYW5kL29yIGRpbWVuc2lvbmFsIGRlbGF5cylcbiAgICB0aGlzLl9yZW1vdmVTdWJzY3JpcHRpb25zKCk7XG4gICAgdGhpcy5faW5pdGlhbERvbVJlY3QgPSB0aGlzLl9yb290RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICB0aGlzLl9wb2ludGVyTW92ZVN1YnNjcmlwdGlvbiA9IHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkucG9pbnRlck1vdmUuc3Vic2NyaWJlKHRoaXMuX3BvaW50ZXJNb3ZlKTtcbiAgICB0aGlzLl9wb2ludGVyVXBTdWJzY3JpcHRpb24gPSB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnBvaW50ZXJVcC5zdWJzY3JpYmUodGhpcy5fcG9pbnRlclVwKTtcbiAgICB0aGlzLl9zY3JvbGxTdWJzY3JpcHRpb24gPSB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5XG4gICAgICAuc2Nyb2xsZWQodGhpcy5fZ2V0U2hhZG93Um9vdCgpKVxuICAgICAgLnN1YnNjcmliZShzY3JvbGxFdmVudCA9PiB0aGlzLl91cGRhdGVPblNjcm9sbChzY3JvbGxFdmVudCkpO1xuXG4gICAgaWYgKHRoaXMuX2JvdW5kYXJ5RWxlbWVudCkge1xuICAgICAgdGhpcy5fYm91bmRhcnlSZWN0ID0gZ2V0TXV0YWJsZUNsaWVudFJlY3QodGhpcy5fYm91bmRhcnlFbGVtZW50KTtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSBoYXZlIGEgY3VzdG9tIHByZXZpZXcgd2UgY2FuJ3Qga25vdyBhaGVhZCBvZiB0aW1lIGhvdyBsYXJnZSBpdCdsbCBiZSBzbyB3ZSBwb3NpdGlvblxuICAgIC8vIGl0IG5leHQgdG8gdGhlIGN1cnNvci4gVGhlIGV4Y2VwdGlvbiBpcyB3aGVuIHRoZSBjb25zdW1lciBoYXMgb3B0ZWQgaW50byBtYWtpbmcgdGhlIHByZXZpZXdcbiAgICAvLyB0aGUgc2FtZSBzaXplIGFzIHRoZSByb290IGVsZW1lbnQsIGluIHdoaWNoIGNhc2Ugd2UgZG8ga25vdyB0aGUgc2l6ZS5cbiAgICBjb25zdCBwcmV2aWV3VGVtcGxhdGUgPSB0aGlzLl9wcmV2aWV3VGVtcGxhdGU7XG4gICAgdGhpcy5fcGlja3VwUG9zaXRpb25JbkVsZW1lbnQgPVxuICAgICAgcHJldmlld1RlbXBsYXRlICYmIHByZXZpZXdUZW1wbGF0ZS50ZW1wbGF0ZSAmJiAhcHJldmlld1RlbXBsYXRlLm1hdGNoU2l6ZVxuICAgICAgICA/IHt4OiAwLCB5OiAwfVxuICAgICAgICA6IHRoaXMuX2dldFBvaW50ZXJQb3NpdGlvbkluRWxlbWVudCh0aGlzLl9pbml0aWFsRG9tUmVjdCwgcmVmZXJlbmNlRWxlbWVudCwgZXZlbnQpO1xuICAgIGNvbnN0IHBvaW50ZXJQb3NpdGlvbiA9XG4gICAgICAodGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UgPVxuICAgICAgdGhpcy5fbGFzdEtub3duUG9pbnRlclBvc2l0aW9uID1cbiAgICAgICAgdGhpcy5fZ2V0UG9pbnRlclBvc2l0aW9uT25QYWdlKGV2ZW50KSk7XG4gICAgdGhpcy5fcG9pbnRlckRpcmVjdGlvbkRlbHRhID0ge3g6IDAsIHk6IDB9O1xuICAgIHRoaXMuX3BvaW50ZXJQb3NpdGlvbkF0TGFzdERpcmVjdGlvbkNoYW5nZSA9IHt4OiBwb2ludGVyUG9zaXRpb24ueCwgeTogcG9pbnRlclBvc2l0aW9uLnl9O1xuICAgIHRoaXMuX2RyYWdTdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuc3RhcnREcmFnZ2luZyh0aGlzLCBldmVudCk7XG4gIH1cblxuICAvKiogQ2xlYW5zIHVwIHRoZSBET00gYXJ0aWZhY3RzIHRoYXQgd2VyZSBhZGRlZCB0byBmYWNpbGl0YXRlIHRoZSBlbGVtZW50IGJlaW5nIGRyYWdnZWQuICovXG4gIHByaXZhdGUgX2NsZWFudXBEcmFnQXJ0aWZhY3RzKGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCkge1xuICAgIC8vIFJlc3RvcmUgdGhlIGVsZW1lbnQncyB2aXNpYmlsaXR5IGFuZCBpbnNlcnQgaXQgYXQgaXRzIG9sZCBwb3NpdGlvbiBpbiB0aGUgRE9NLlxuICAgIC8vIEl0J3MgaW1wb3J0YW50IHRoYXQgd2UgbWFpbnRhaW4gdGhlIHBvc2l0aW9uLCBiZWNhdXNlIG1vdmluZyB0aGUgZWxlbWVudCBhcm91bmQgaW4gdGhlIERPTVxuICAgIC8vIGNhbiB0aHJvdyBvZmYgYE5nRm9yYCB3aGljaCBkb2VzIHNtYXJ0IGRpZmZpbmcgYW5kIHJlLWNyZWF0ZXMgZWxlbWVudHMgb25seSB3aGVuIG5lY2Vzc2FyeSxcbiAgICAvLyB3aGlsZSBtb3ZpbmcgdGhlIGV4aXN0aW5nIGVsZW1lbnRzIGluIGFsbCBvdGhlciBjYXNlcy5cbiAgICB0b2dnbGVWaXNpYmlsaXR5KHRoaXMuX3Jvb3RFbGVtZW50LCB0cnVlLCBkcmFnSW1wb3J0YW50UHJvcGVydGllcyk7XG4gICAgdGhpcy5fYW5jaG9yLnBhcmVudE5vZGUhLnJlcGxhY2VDaGlsZCh0aGlzLl9yb290RWxlbWVudCwgdGhpcy5fYW5jaG9yKTtcblxuICAgIHRoaXMuX2Rlc3Ryb3lQcmV2aWV3KCk7XG4gICAgdGhpcy5fZGVzdHJveVBsYWNlaG9sZGVyKCk7XG4gICAgdGhpcy5faW5pdGlhbERvbVJlY3QgPVxuICAgICAgdGhpcy5fYm91bmRhcnlSZWN0ID1cbiAgICAgIHRoaXMuX3ByZXZpZXdSZWN0ID1cbiAgICAgIHRoaXMuX2luaXRpYWxUcmFuc2Zvcm0gPVxuICAgICAgICB1bmRlZmluZWQ7XG5cbiAgICAvLyBSZS1lbnRlciB0aGUgTmdab25lIHNpbmNlIHdlIGJvdW5kIGBkb2N1bWVudGAgZXZlbnRzIG9uIHRoZSBvdXRzaWRlLlxuICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5fZHJvcENvbnRhaW5lciE7XG4gICAgICBjb25zdCBjdXJyZW50SW5kZXggPSBjb250YWluZXIuZ2V0SXRlbUluZGV4KHRoaXMpO1xuICAgICAgY29uc3QgcG9pbnRlclBvc2l0aW9uID0gdGhpcy5fZ2V0UG9pbnRlclBvc2l0aW9uT25QYWdlKGV2ZW50KTtcbiAgICAgIGNvbnN0IGRpc3RhbmNlID0gdGhpcy5fZ2V0RHJhZ0Rpc3RhbmNlKHBvaW50ZXJQb3NpdGlvbik7XG4gICAgICBjb25zdCBpc1BvaW50ZXJPdmVyQ29udGFpbmVyID0gY29udGFpbmVyLl9pc092ZXJDb250YWluZXIoXG4gICAgICAgIHBvaW50ZXJQb3NpdGlvbi54LFxuICAgICAgICBwb2ludGVyUG9zaXRpb24ueSxcbiAgICAgICk7XG5cbiAgICAgIHRoaXMuZW5kZWQubmV4dCh7c291cmNlOiB0aGlzLCBkaXN0YW5jZSwgZHJvcFBvaW50OiBwb2ludGVyUG9zaXRpb24sIGV2ZW50fSk7XG4gICAgICB0aGlzLmRyb3BwZWQubmV4dCh7XG4gICAgICAgIGl0ZW06IHRoaXMsXG4gICAgICAgIGN1cnJlbnRJbmRleCxcbiAgICAgICAgcHJldmlvdXNJbmRleDogdGhpcy5faW5pdGlhbEluZGV4LFxuICAgICAgICBjb250YWluZXI6IGNvbnRhaW5lcixcbiAgICAgICAgcHJldmlvdXNDb250YWluZXI6IHRoaXMuX2luaXRpYWxDb250YWluZXIsXG4gICAgICAgIGlzUG9pbnRlck92ZXJDb250YWluZXIsXG4gICAgICAgIGRpc3RhbmNlLFxuICAgICAgICBkcm9wUG9pbnQ6IHBvaW50ZXJQb3NpdGlvbixcbiAgICAgICAgZXZlbnQsXG4gICAgICB9KTtcbiAgICAgIGNvbnRhaW5lci5kcm9wKFxuICAgICAgICB0aGlzLFxuICAgICAgICBjdXJyZW50SW5kZXgsXG4gICAgICAgIHRoaXMuX2luaXRpYWxJbmRleCxcbiAgICAgICAgdGhpcy5faW5pdGlhbENvbnRhaW5lcixcbiAgICAgICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcixcbiAgICAgICAgZGlzdGFuY2UsXG4gICAgICAgIHBvaW50ZXJQb3NpdGlvbixcbiAgICAgICAgZXZlbnQsXG4gICAgICApO1xuICAgICAgdGhpcy5fZHJvcENvbnRhaW5lciA9IHRoaXMuX2luaXRpYWxDb250YWluZXI7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgaXRlbSdzIHBvc2l0aW9uIGluIGl0cyBkcm9wIGNvbnRhaW5lciwgb3IgbW92ZXMgaXRcbiAgICogaW50byBhIG5ldyBvbmUsIGRlcGVuZGluZyBvbiBpdHMgY3VycmVudCBkcmFnIHBvc2l0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBfdXBkYXRlQWN0aXZlRHJvcENvbnRhaW5lcih7eCwgeX06IFBvaW50LCB7eDogcmF3WCwgeTogcmF3WX06IFBvaW50KSB7XG4gICAgLy8gRHJvcCBjb250YWluZXIgdGhhdCBkcmFnZ2FibGUgaGFzIGJlZW4gbW92ZWQgaW50by5cbiAgICBsZXQgbmV3Q29udGFpbmVyID0gdGhpcy5faW5pdGlhbENvbnRhaW5lci5fZ2V0U2libGluZ0NvbnRhaW5lckZyb21Qb3NpdGlvbih0aGlzLCB4LCB5KTtcblxuICAgIC8vIElmIHdlIGNvdWxkbid0IGZpbmQgYSBuZXcgY29udGFpbmVyIHRvIG1vdmUgdGhlIGl0ZW0gaW50bywgYW5kIHRoZSBpdGVtIGhhcyBsZWZ0IGl0c1xuICAgIC8vIGluaXRpYWwgY29udGFpbmVyLCBjaGVjayB3aGV0aGVyIHRoZSBpdCdzIG92ZXIgdGhlIGluaXRpYWwgY29udGFpbmVyLiBUaGlzIGhhbmRsZXMgdGhlXG4gICAgLy8gY2FzZSB3aGVyZSB0d28gY29udGFpbmVycyBhcmUgY29ubmVjdGVkIG9uZSB3YXkgYW5kIHRoZSB1c2VyIHRyaWVzIHRvIHVuZG8gZHJhZ2dpbmcgYW5cbiAgICAvLyBpdGVtIGludG8gYSBuZXcgY29udGFpbmVyLlxuICAgIGlmIChcbiAgICAgICFuZXdDb250YWluZXIgJiZcbiAgICAgIHRoaXMuX2Ryb3BDb250YWluZXIgIT09IHRoaXMuX2luaXRpYWxDb250YWluZXIgJiZcbiAgICAgIHRoaXMuX2luaXRpYWxDb250YWluZXIuX2lzT3ZlckNvbnRhaW5lcih4LCB5KVxuICAgICkge1xuICAgICAgbmV3Q29udGFpbmVyID0gdGhpcy5faW5pdGlhbENvbnRhaW5lcjtcbiAgICB9XG5cbiAgICBpZiAobmV3Q29udGFpbmVyICYmIG5ld0NvbnRhaW5lciAhPT0gdGhpcy5fZHJvcENvbnRhaW5lcikge1xuICAgICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiB7XG4gICAgICAgIC8vIE5vdGlmeSB0aGUgb2xkIGNvbnRhaW5lciB0aGF0IHRoZSBpdGVtIGhhcyBsZWZ0LlxuICAgICAgICB0aGlzLmV4aXRlZC5uZXh0KHtpdGVtOiB0aGlzLCBjb250YWluZXI6IHRoaXMuX2Ryb3BDb250YWluZXIhfSk7XG4gICAgICAgIHRoaXMuX2Ryb3BDb250YWluZXIhLmV4aXQodGhpcyk7XG4gICAgICAgIC8vIE5vdGlmeSB0aGUgbmV3IGNvbnRhaW5lciB0aGF0IHRoZSBpdGVtIGhhcyBlbnRlcmVkLlxuICAgICAgICB0aGlzLl9kcm9wQ29udGFpbmVyID0gbmV3Q29udGFpbmVyITtcbiAgICAgICAgdGhpcy5fZHJvcENvbnRhaW5lci5lbnRlcihcbiAgICAgICAgICB0aGlzLFxuICAgICAgICAgIHgsXG4gICAgICAgICAgeSxcbiAgICAgICAgICBuZXdDb250YWluZXIgPT09IHRoaXMuX2luaXRpYWxDb250YWluZXIgJiZcbiAgICAgICAgICAgIC8vIElmIHdlJ3JlIHJlLWVudGVyaW5nIHRoZSBpbml0aWFsIGNvbnRhaW5lciBhbmQgc29ydGluZyBpcyBkaXNhYmxlZCxcbiAgICAgICAgICAgIC8vIHB1dCBpdGVtIHRoZSBpbnRvIGl0cyBzdGFydGluZyBpbmRleCB0byBiZWdpbiB3aXRoLlxuICAgICAgICAgICAgbmV3Q29udGFpbmVyLnNvcnRpbmdEaXNhYmxlZFxuICAgICAgICAgICAgPyB0aGlzLl9pbml0aWFsSW5kZXhcbiAgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICApO1xuICAgICAgICB0aGlzLmVudGVyZWQubmV4dCh7XG4gICAgICAgICAgaXRlbTogdGhpcyxcbiAgICAgICAgICBjb250YWluZXI6IG5ld0NvbnRhaW5lciEsXG4gICAgICAgICAgY3VycmVudEluZGV4OiBuZXdDb250YWluZXIhLmdldEl0ZW1JbmRleCh0aGlzKSxcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBEcmFnZ2luZyBtYXkgaGF2ZSBiZWVuIGludGVycnVwdGVkIGFzIGEgcmVzdWx0IG9mIHRoZSBldmVudHMgYWJvdmUuXG4gICAgaWYgKHRoaXMuaXNEcmFnZ2luZygpKSB7XG4gICAgICB0aGlzLl9kcm9wQ29udGFpbmVyIS5fc3RhcnRTY3JvbGxpbmdJZk5lY2Vzc2FyeShyYXdYLCByYXdZKTtcbiAgICAgIHRoaXMuX2Ryb3BDb250YWluZXIhLl9zb3J0SXRlbSh0aGlzLCB4LCB5LCB0aGlzLl9wb2ludGVyRGlyZWN0aW9uRGVsdGEpO1xuXG4gICAgICBpZiAodGhpcy5jb25zdHJhaW5Qb3NpdGlvbikge1xuICAgICAgICB0aGlzLl9hcHBseVByZXZpZXdUcmFuc2Zvcm0oeCwgeSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9hcHBseVByZXZpZXdUcmFuc2Zvcm0oXG4gICAgICAgICAgeCAtIHRoaXMuX3BpY2t1cFBvc2l0aW9uSW5FbGVtZW50LngsXG4gICAgICAgICAgeSAtIHRoaXMuX3BpY2t1cFBvc2l0aW9uSW5FbGVtZW50LnksXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgdGhlIGVsZW1lbnQgdGhhdCB3aWxsIGJlIHJlbmRlcmVkIG5leHQgdG8gdGhlIHVzZXIncyBwb2ludGVyXG4gICAqIGFuZCB3aWxsIGJlIHVzZWQgYXMgYSBwcmV2aWV3IG9mIHRoZSBlbGVtZW50IHRoYXQgaXMgYmVpbmcgZHJhZ2dlZC5cbiAgICovXG4gIHByaXZhdGUgX2NyZWF0ZVByZXZpZXdFbGVtZW50KCk6IEhUTUxFbGVtZW50IHtcbiAgICBjb25zdCBwcmV2aWV3Q29uZmlnID0gdGhpcy5fcHJldmlld1RlbXBsYXRlO1xuICAgIGNvbnN0IHByZXZpZXdDbGFzcyA9IHRoaXMucHJldmlld0NsYXNzO1xuICAgIGNvbnN0IHByZXZpZXdUZW1wbGF0ZSA9IHByZXZpZXdDb25maWcgPyBwcmV2aWV3Q29uZmlnLnRlbXBsYXRlIDogbnVsbDtcbiAgICBsZXQgcHJldmlldzogSFRNTEVsZW1lbnQ7XG5cbiAgICBpZiAocHJldmlld1RlbXBsYXRlICYmIHByZXZpZXdDb25maWcpIHtcbiAgICAgIC8vIE1lYXN1cmUgdGhlIGVsZW1lbnQgYmVmb3JlIHdlJ3ZlIGluc2VydGVkIHRoZSBwcmV2aWV3XG4gICAgICAvLyBzaW5jZSB0aGUgaW5zZXJ0aW9uIGNvdWxkIHRocm93IG9mZiB0aGUgbWVhc3VyZW1lbnQuXG4gICAgICBjb25zdCByb290UmVjdCA9IHByZXZpZXdDb25maWcubWF0Y2hTaXplID8gdGhpcy5faW5pdGlhbERvbVJlY3QgOiBudWxsO1xuICAgICAgY29uc3Qgdmlld1JlZiA9IHByZXZpZXdDb25maWcudmlld0NvbnRhaW5lci5jcmVhdGVFbWJlZGRlZFZpZXcoXG4gICAgICAgIHByZXZpZXdUZW1wbGF0ZSxcbiAgICAgICAgcHJldmlld0NvbmZpZy5jb250ZXh0LFxuICAgICAgKTtcbiAgICAgIHZpZXdSZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgcHJldmlldyA9IGdldFJvb3ROb2RlKHZpZXdSZWYsIHRoaXMuX2RvY3VtZW50KTtcbiAgICAgIHRoaXMuX3ByZXZpZXdSZWYgPSB2aWV3UmVmO1xuICAgICAgaWYgKHByZXZpZXdDb25maWcubWF0Y2hTaXplKSB7XG4gICAgICAgIG1hdGNoRWxlbWVudFNpemUocHJldmlldywgcm9vdFJlY3QhKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHByZXZpZXcuc3R5bGUudHJhbnNmb3JtID0gZ2V0VHJhbnNmb3JtKFxuICAgICAgICAgIHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLngsXG4gICAgICAgICAgdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UueSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcHJldmlldyA9IGRlZXBDbG9uZU5vZGUodGhpcy5fcm9vdEVsZW1lbnQpO1xuICAgICAgbWF0Y2hFbGVtZW50U2l6ZShwcmV2aWV3LCB0aGlzLl9pbml0aWFsRG9tUmVjdCEpO1xuXG4gICAgICBpZiAodGhpcy5faW5pdGlhbFRyYW5zZm9ybSkge1xuICAgICAgICBwcmV2aWV3LnN0eWxlLnRyYW5zZm9ybSA9IHRoaXMuX2luaXRpYWxUcmFuc2Zvcm07XG4gICAgICB9XG4gICAgfVxuXG4gICAgZXh0ZW5kU3R5bGVzKFxuICAgICAgcHJldmlldy5zdHlsZSxcbiAgICAgIHtcbiAgICAgICAgLy8gSXQncyBpbXBvcnRhbnQgdGhhdCB3ZSBkaXNhYmxlIHRoZSBwb2ludGVyIGV2ZW50cyBvbiB0aGUgcHJldmlldywgYmVjYXVzZVxuICAgICAgICAvLyBpdCBjYW4gdGhyb3cgb2ZmIHRoZSBgZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludGAgY2FsbHMgaW4gdGhlIGBDZGtEcm9wTGlzdGAuXG4gICAgICAgICdwb2ludGVyLWV2ZW50cyc6ICdub25lJyxcbiAgICAgICAgLy8gV2UgaGF2ZSB0byByZXNldCB0aGUgbWFyZ2luLCBiZWNhdXNlIGl0IGNhbiB0aHJvdyBvZmYgcG9zaXRpb25pbmcgcmVsYXRpdmUgdG8gdGhlIHZpZXdwb3J0LlxuICAgICAgICAnbWFyZ2luJzogJzAnLFxuICAgICAgICAncG9zaXRpb24nOiAnZml4ZWQnLFxuICAgICAgICAndG9wJzogJzAnLFxuICAgICAgICAnbGVmdCc6ICcwJyxcbiAgICAgICAgJ3otaW5kZXgnOiBgJHt0aGlzLl9jb25maWcuekluZGV4IHx8IDEwMDB9YCxcbiAgICAgIH0sXG4gICAgICBkcmFnSW1wb3J0YW50UHJvcGVydGllcyxcbiAgICApO1xuXG4gICAgdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucyhwcmV2aWV3LCBmYWxzZSk7XG4gICAgcHJldmlldy5jbGFzc0xpc3QuYWRkKCdjZGstZHJhZy1wcmV2aWV3Jyk7XG4gICAgcHJldmlldy5zZXRBdHRyaWJ1dGUoJ2RpcicsIHRoaXMuX2RpcmVjdGlvbik7XG5cbiAgICBpZiAocHJldmlld0NsYXNzKSB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShwcmV2aWV3Q2xhc3MpKSB7XG4gICAgICAgIHByZXZpZXdDbGFzcy5mb3JFYWNoKGNsYXNzTmFtZSA9PiBwcmV2aWV3LmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcmV2aWV3LmNsYXNzTGlzdC5hZGQocHJldmlld0NsYXNzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcHJldmlldztcbiAgfVxuXG4gIC8qKlxuICAgKiBBbmltYXRlcyB0aGUgcHJldmlldyBlbGVtZW50IGZyb20gaXRzIGN1cnJlbnQgcG9zaXRpb24gdG8gdGhlIGxvY2F0aW9uIG9mIHRoZSBkcm9wIHBsYWNlaG9sZGVyLlxuICAgKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgYW5pbWF0aW9uIGNvbXBsZXRlcy5cbiAgICovXG4gIHByaXZhdGUgX2FuaW1hdGVQcmV2aWV3VG9QbGFjZWhvbGRlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyBJZiB0aGUgdXNlciBoYXNuJ3QgbW92ZWQgeWV0LCB0aGUgdHJhbnNpdGlvbmVuZCBldmVudCB3b24ndCBmaXJlLlxuICAgIGlmICghdGhpcy5faGFzTW92ZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICBjb25zdCBwbGFjZWhvbGRlclJlY3QgPSB0aGlzLl9wbGFjZWhvbGRlci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgIC8vIEFwcGx5IHRoZSBjbGFzcyB0aGF0IGFkZHMgYSB0cmFuc2l0aW9uIHRvIHRoZSBwcmV2aWV3LlxuICAgIHRoaXMuX3ByZXZpZXcuY2xhc3NMaXN0LmFkZCgnY2RrLWRyYWctYW5pbWF0aW5nJyk7XG5cbiAgICAvLyBNb3ZlIHRoZSBwcmV2aWV3IHRvIHRoZSBwbGFjZWhvbGRlciBwb3NpdGlvbi5cbiAgICB0aGlzLl9hcHBseVByZXZpZXdUcmFuc2Zvcm0ocGxhY2Vob2xkZXJSZWN0LmxlZnQsIHBsYWNlaG9sZGVyUmVjdC50b3ApO1xuXG4gICAgLy8gSWYgdGhlIGVsZW1lbnQgZG9lc24ndCBoYXZlIGEgYHRyYW5zaXRpb25gLCB0aGUgYHRyYW5zaXRpb25lbmRgIGV2ZW50IHdvbid0IGZpcmUuIFNpbmNlXG4gICAgLy8gd2UgbmVlZCB0byB0cmlnZ2VyIGEgc3R5bGUgcmVjYWxjdWxhdGlvbiBpbiBvcmRlciBmb3IgdGhlIGBjZGstZHJhZy1hbmltYXRpbmdgIGNsYXNzIHRvXG4gICAgLy8gYXBwbHkgaXRzIHN0eWxlLCB3ZSB0YWtlIGFkdmFudGFnZSBvZiB0aGUgYXZhaWxhYmxlIGluZm8gdG8gZmlndXJlIG91dCB3aGV0aGVyIHdlIG5lZWQgdG9cbiAgICAvLyBiaW5kIHRoZSBldmVudCBpbiB0aGUgZmlyc3QgcGxhY2UuXG4gICAgY29uc3QgZHVyYXRpb24gPSBnZXRUcmFuc2Zvcm1UcmFuc2l0aW9uRHVyYXRpb25Jbk1zKHRoaXMuX3ByZXZpZXcpO1xuXG4gICAgaWYgKGR1cmF0aW9uID09PSAwKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIGNvbnN0IGhhbmRsZXIgPSAoKGV2ZW50OiBUcmFuc2l0aW9uRXZlbnQpID0+IHtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAhZXZlbnQgfHxcbiAgICAgICAgICAgIChfZ2V0RXZlbnRUYXJnZXQoZXZlbnQpID09PSB0aGlzLl9wcmV2aWV3ICYmIGV2ZW50LnByb3BlcnR5TmFtZSA9PT0gJ3RyYW5zZm9ybScpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLl9wcmV2aWV3Py5yZW1vdmVFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgaGFuZGxlcik7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KSBhcyBFdmVudExpc3RlbmVyT3JFdmVudExpc3RlbmVyT2JqZWN0O1xuXG4gICAgICAgIC8vIElmIGEgdHJhbnNpdGlvbiBpcyBzaG9ydCBlbm91Z2gsIHRoZSBicm93c2VyIG1pZ2h0IG5vdCBmaXJlIHRoZSBgdHJhbnNpdGlvbmVuZGAgZXZlbnQuXG4gICAgICAgIC8vIFNpbmNlIHdlIGtub3cgaG93IGxvbmcgaXQncyBzdXBwb3NlZCB0byB0YWtlLCBhZGQgYSB0aW1lb3V0IHdpdGggYSA1MCUgYnVmZmVyIHRoYXQnbGxcbiAgICAgICAgLy8gZmlyZSBpZiB0aGUgdHJhbnNpdGlvbiBoYXNuJ3QgY29tcGxldGVkIHdoZW4gaXQgd2FzIHN1cHBvc2VkIHRvLlxuICAgICAgICBjb25zdCB0aW1lb3V0ID0gc2V0VGltZW91dChoYW5kbGVyIGFzIEZ1bmN0aW9uLCBkdXJhdGlvbiAqIDEuNSk7XG4gICAgICAgIHRoaXMuX3ByZXZpZXcuYWRkRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIGhhbmRsZXIpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhbiBlbGVtZW50IHRoYXQgd2lsbCBiZSBzaG93biBpbnN0ZWFkIG9mIHRoZSBjdXJyZW50IGVsZW1lbnQgd2hpbGUgZHJhZ2dpbmcuICovXG4gIHByaXZhdGUgX2NyZWF0ZVBsYWNlaG9sZGVyRWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3QgcGxhY2Vob2xkZXJDb25maWcgPSB0aGlzLl9wbGFjZWhvbGRlclRlbXBsYXRlO1xuICAgIGNvbnN0IHBsYWNlaG9sZGVyVGVtcGxhdGUgPSBwbGFjZWhvbGRlckNvbmZpZyA/IHBsYWNlaG9sZGVyQ29uZmlnLnRlbXBsYXRlIDogbnVsbDtcbiAgICBsZXQgcGxhY2Vob2xkZXI6IEhUTUxFbGVtZW50O1xuXG4gICAgaWYgKHBsYWNlaG9sZGVyVGVtcGxhdGUpIHtcbiAgICAgIHRoaXMuX3BsYWNlaG9sZGVyUmVmID0gcGxhY2Vob2xkZXJDb25maWchLnZpZXdDb250YWluZXIuY3JlYXRlRW1iZWRkZWRWaWV3KFxuICAgICAgICBwbGFjZWhvbGRlclRlbXBsYXRlLFxuICAgICAgICBwbGFjZWhvbGRlckNvbmZpZyEuY29udGV4dCxcbiAgICAgICk7XG4gICAgICB0aGlzLl9wbGFjZWhvbGRlclJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICBwbGFjZWhvbGRlciA9IGdldFJvb3ROb2RlKHRoaXMuX3BsYWNlaG9sZGVyUmVmLCB0aGlzLl9kb2N1bWVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBsYWNlaG9sZGVyID0gZGVlcENsb25lTm9kZSh0aGlzLl9yb290RWxlbWVudCk7XG4gICAgfVxuXG4gICAgLy8gU3RvcCBwb2ludGVyIGV2ZW50cyBvbiB0aGUgcHJldmlldyBzbyB0aGUgdXNlciBjYW4ndFxuICAgIC8vIGludGVyYWN0IHdpdGggaXQgd2hpbGUgdGhlIHByZXZpZXcgaXMgYW5pbWF0aW5nLlxuICAgIHBsYWNlaG9sZGVyLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XG4gICAgcGxhY2Vob2xkZXIuY2xhc3NMaXN0LmFkZCgnY2RrLWRyYWctcGxhY2Vob2xkZXInKTtcbiAgICByZXR1cm4gcGxhY2Vob2xkZXI7XG4gIH1cblxuICAvKipcbiAgICogRmlndXJlcyBvdXQgdGhlIGNvb3JkaW5hdGVzIGF0IHdoaWNoIGFuIGVsZW1lbnQgd2FzIHBpY2tlZCB1cC5cbiAgICogQHBhcmFtIHJlZmVyZW5jZUVsZW1lbnQgRWxlbWVudCB0aGF0IGluaXRpYXRlZCB0aGUgZHJhZ2dpbmcuXG4gICAqIEBwYXJhbSBldmVudCBFdmVudCB0aGF0IGluaXRpYXRlZCB0aGUgZHJhZ2dpbmcuXG4gICAqL1xuICBwcml2YXRlIF9nZXRQb2ludGVyUG9zaXRpb25JbkVsZW1lbnQoXG4gICAgZWxlbWVudFJlY3Q6IERPTVJlY3QsXG4gICAgcmVmZXJlbmNlRWxlbWVudDogSFRNTEVsZW1lbnQsXG4gICAgZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50LFxuICApOiBQb2ludCB7XG4gICAgY29uc3QgaGFuZGxlRWxlbWVudCA9IHJlZmVyZW5jZUVsZW1lbnQgPT09IHRoaXMuX3Jvb3RFbGVtZW50ID8gbnVsbCA6IHJlZmVyZW5jZUVsZW1lbnQ7XG4gICAgY29uc3QgcmVmZXJlbmNlUmVjdCA9IGhhbmRsZUVsZW1lbnQgPyBoYW5kbGVFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpIDogZWxlbWVudFJlY3Q7XG4gICAgY29uc3QgcG9pbnQgPSBpc1RvdWNoRXZlbnQoZXZlbnQpID8gZXZlbnQudGFyZ2V0VG91Y2hlc1swXSA6IGV2ZW50O1xuICAgIGNvbnN0IHNjcm9sbFBvc2l0aW9uID0gdGhpcy5fZ2V0Vmlld3BvcnRTY3JvbGxQb3NpdGlvbigpO1xuICAgIGNvbnN0IHggPSBwb2ludC5wYWdlWCAtIHJlZmVyZW5jZVJlY3QubGVmdCAtIHNjcm9sbFBvc2l0aW9uLmxlZnQ7XG4gICAgY29uc3QgeSA9IHBvaW50LnBhZ2VZIC0gcmVmZXJlbmNlUmVjdC50b3AgLSBzY3JvbGxQb3NpdGlvbi50b3A7XG5cbiAgICByZXR1cm4ge1xuICAgICAgeDogcmVmZXJlbmNlUmVjdC5sZWZ0IC0gZWxlbWVudFJlY3QubGVmdCArIHgsXG4gICAgICB5OiByZWZlcmVuY2VSZWN0LnRvcCAtIGVsZW1lbnRSZWN0LnRvcCArIHksXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBEZXRlcm1pbmVzIHRoZSBwb2ludCBvZiB0aGUgcGFnZSB0aGF0IHdhcyB0b3VjaGVkIGJ5IHRoZSB1c2VyLiAqL1xuICBwcml2YXRlIF9nZXRQb2ludGVyUG9zaXRpb25PblBhZ2UoZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KTogUG9pbnQge1xuICAgIGNvbnN0IHNjcm9sbFBvc2l0aW9uID0gdGhpcy5fZ2V0Vmlld3BvcnRTY3JvbGxQb3NpdGlvbigpO1xuICAgIGNvbnN0IHBvaW50ID0gaXNUb3VjaEV2ZW50KGV2ZW50KVxuICAgICAgPyAvLyBgdG91Y2hlc2Agd2lsbCBiZSBlbXB0eSBmb3Igc3RhcnQvZW5kIGV2ZW50cyBzbyB3ZSBoYXZlIHRvIGZhbGwgYmFjayB0byBgY2hhbmdlZFRvdWNoZXNgLlxuICAgICAgICAvLyBBbHNvIG5vdGUgdGhhdCBvbiByZWFsIGRldmljZXMgd2UncmUgZ3VhcmFudGVlZCBmb3IgZWl0aGVyIGB0b3VjaGVzYCBvciBgY2hhbmdlZFRvdWNoZXNgXG4gICAgICAgIC8vIHRvIGhhdmUgYSB2YWx1ZSwgYnV0IEZpcmVmb3ggaW4gZGV2aWNlIGVtdWxhdGlvbiBtb2RlIGhhcyBhIGJ1ZyB3aGVyZSBib3RoIGNhbiBiZSBlbXB0eVxuICAgICAgICAvLyBmb3IgYHRvdWNoc3RhcnRgIGFuZCBgdG91Y2hlbmRgIHNvIHdlIGZhbGwgYmFjayB0byBhIGR1bW15IG9iamVjdCBpbiBvcmRlciB0byBhdm9pZFxuICAgICAgICAvLyB0aHJvd2luZyBhbiBlcnJvci4gVGhlIHZhbHVlIHJldHVybmVkIGhlcmUgd2lsbCBiZSBpbmNvcnJlY3QsIGJ1dCBzaW5jZSB0aGlzIG9ubHlcbiAgICAgICAgLy8gYnJlYWtzIGluc2lkZSBhIGRldmVsb3BlciB0b29sIGFuZCB0aGUgdmFsdWUgaXMgb25seSB1c2VkIGZvciBzZWNvbmRhcnkgaW5mb3JtYXRpb24sXG4gICAgICAgIC8vIHdlIGNhbiBnZXQgYXdheSB3aXRoIGl0LiBTZWUgaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTYxNTgyNC5cbiAgICAgICAgZXZlbnQudG91Y2hlc1swXSB8fCBldmVudC5jaGFuZ2VkVG91Y2hlc1swXSB8fCB7cGFnZVg6IDAsIHBhZ2VZOiAwfVxuICAgICAgOiBldmVudDtcblxuICAgIGNvbnN0IHggPSBwb2ludC5wYWdlWCAtIHNjcm9sbFBvc2l0aW9uLmxlZnQ7XG4gICAgY29uc3QgeSA9IHBvaW50LnBhZ2VZIC0gc2Nyb2xsUG9zaXRpb24udG9wO1xuXG4gICAgLy8gaWYgZHJhZ2dpbmcgU1ZHIGVsZW1lbnQsIHRyeSB0byBjb252ZXJ0IGZyb20gdGhlIHNjcmVlbiBjb29yZGluYXRlIHN5c3RlbSB0byB0aGUgU1ZHXG4gICAgLy8gY29vcmRpbmF0ZSBzeXN0ZW1cbiAgICBpZiAodGhpcy5fb3duZXJTVkdFbGVtZW50KSB7XG4gICAgICBjb25zdCBzdmdNYXRyaXggPSB0aGlzLl9vd25lclNWR0VsZW1lbnQuZ2V0U2NyZWVuQ1RNKCk7XG4gICAgICBpZiAoc3ZnTWF0cml4KSB7XG4gICAgICAgIGNvbnN0IHN2Z1BvaW50ID0gdGhpcy5fb3duZXJTVkdFbGVtZW50LmNyZWF0ZVNWR1BvaW50KCk7XG4gICAgICAgIHN2Z1BvaW50LnggPSB4O1xuICAgICAgICBzdmdQb2ludC55ID0geTtcbiAgICAgICAgcmV0dXJuIHN2Z1BvaW50Lm1hdHJpeFRyYW5zZm9ybShzdmdNYXRyaXguaW52ZXJzZSgpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge3gsIHl9O1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIHBvaW50ZXIgcG9zaXRpb24gb24gdGhlIHBhZ2UsIGFjY291bnRpbmcgZm9yIGFueSBwb3NpdGlvbiBjb25zdHJhaW50cy4gKi9cbiAgcHJpdmF0ZSBfZ2V0Q29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24ocG9pbnQ6IFBvaW50KTogUG9pbnQge1xuICAgIGNvbnN0IGRyb3BDb250YWluZXJMb2NrID0gdGhpcy5fZHJvcENvbnRhaW5lciA/IHRoaXMuX2Ryb3BDb250YWluZXIubG9ja0F4aXMgOiBudWxsO1xuICAgIGxldCB7eCwgeX0gPSB0aGlzLmNvbnN0cmFpblBvc2l0aW9uXG4gICAgICA/IHRoaXMuY29uc3RyYWluUG9zaXRpb24ocG9pbnQsIHRoaXMsIHRoaXMuX2luaXRpYWxEb21SZWN0ISwgdGhpcy5fcGlja3VwUG9zaXRpb25JbkVsZW1lbnQpXG4gICAgICA6IHBvaW50O1xuXG4gICAgaWYgKHRoaXMubG9ja0F4aXMgPT09ICd4JyB8fCBkcm9wQ29udGFpbmVyTG9jayA9PT0gJ3gnKSB7XG4gICAgICB5ID1cbiAgICAgICAgdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UueSAtXG4gICAgICAgICh0aGlzLmNvbnN0cmFpblBvc2l0aW9uID8gdGhpcy5fcGlja3VwUG9zaXRpb25JbkVsZW1lbnQueSA6IDApO1xuICAgIH0gZWxzZSBpZiAodGhpcy5sb2NrQXhpcyA9PT0gJ3knIHx8IGRyb3BDb250YWluZXJMb2NrID09PSAneScpIHtcbiAgICAgIHggPVxuICAgICAgICB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZS54IC1cbiAgICAgICAgKHRoaXMuY29uc3RyYWluUG9zaXRpb24gPyB0aGlzLl9waWNrdXBQb3NpdGlvbkluRWxlbWVudC54IDogMCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2JvdW5kYXJ5UmVjdCkge1xuICAgICAgLy8gSWYgbm90IHVzaW5nIGEgY3VzdG9tIGNvbnN0cmFpbiB3ZSBuZWVkIHRvIGFjY291bnQgZm9yIHRoZSBwaWNrdXAgcG9zaXRpb24gaW4gdGhlIGVsZW1lbnRcbiAgICAgIC8vIG90aGVyd2lzZSB3ZSBkbyBub3QgbmVlZCB0byBkbyB0aGlzLCBhcyBpdCBoYXMgYWxyZWFkeSBiZWVuIGFjY291bnRlZCBmb3JcbiAgICAgIGNvbnN0IHt4OiBwaWNrdXBYLCB5OiBwaWNrdXBZfSA9ICF0aGlzLmNvbnN0cmFpblBvc2l0aW9uXG4gICAgICAgID8gdGhpcy5fcGlja3VwUG9zaXRpb25JbkVsZW1lbnRcbiAgICAgICAgOiB7eDogMCwgeTogMH07XG5cbiAgICAgIGNvbnN0IGJvdW5kYXJ5UmVjdCA9IHRoaXMuX2JvdW5kYXJ5UmVjdDtcbiAgICAgIGNvbnN0IHt3aWR0aDogcHJldmlld1dpZHRoLCBoZWlnaHQ6IHByZXZpZXdIZWlnaHR9ID0gdGhpcy5fZ2V0UHJldmlld1JlY3QoKTtcbiAgICAgIGNvbnN0IG1pblkgPSBib3VuZGFyeVJlY3QudG9wICsgcGlja3VwWTtcbiAgICAgIGNvbnN0IG1heFkgPSBib3VuZGFyeVJlY3QuYm90dG9tIC0gKHByZXZpZXdIZWlnaHQgLSBwaWNrdXBZKTtcbiAgICAgIGNvbnN0IG1pblggPSBib3VuZGFyeVJlY3QubGVmdCArIHBpY2t1cFg7XG4gICAgICBjb25zdCBtYXhYID0gYm91bmRhcnlSZWN0LnJpZ2h0IC0gKHByZXZpZXdXaWR0aCAtIHBpY2t1cFgpO1xuXG4gICAgICB4ID0gY2xhbXAoeCwgbWluWCwgbWF4WCk7XG4gICAgICB5ID0gY2xhbXAoeSwgbWluWSwgbWF4WSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHt4LCB5fTtcbiAgfVxuXG4gIC8qKiBVcGRhdGVzIHRoZSBjdXJyZW50IGRyYWcgZGVsdGEsIGJhc2VkIG9uIHRoZSB1c2VyJ3MgY3VycmVudCBwb2ludGVyIHBvc2l0aW9uIG9uIHRoZSBwYWdlLiAqL1xuICBwcml2YXRlIF91cGRhdGVQb2ludGVyRGlyZWN0aW9uRGVsdGEocG9pbnRlclBvc2l0aW9uT25QYWdlOiBQb2ludCkge1xuICAgIGNvbnN0IHt4LCB5fSA9IHBvaW50ZXJQb3NpdGlvbk9uUGFnZTtcbiAgICBjb25zdCBkZWx0YSA9IHRoaXMuX3BvaW50ZXJEaXJlY3Rpb25EZWx0YTtcbiAgICBjb25zdCBwb3NpdGlvblNpbmNlTGFzdENoYW5nZSA9IHRoaXMuX3BvaW50ZXJQb3NpdGlvbkF0TGFzdERpcmVjdGlvbkNoYW5nZTtcblxuICAgIC8vIEFtb3VudCBvZiBwaXhlbHMgdGhlIHVzZXIgaGFzIGRyYWdnZWQgc2luY2UgdGhlIGxhc3QgdGltZSB0aGUgZGlyZWN0aW9uIGNoYW5nZWQuXG4gICAgY29uc3QgY2hhbmdlWCA9IE1hdGguYWJzKHggLSBwb3NpdGlvblNpbmNlTGFzdENoYW5nZS54KTtcbiAgICBjb25zdCBjaGFuZ2VZID0gTWF0aC5hYnMoeSAtIHBvc2l0aW9uU2luY2VMYXN0Q2hhbmdlLnkpO1xuXG4gICAgLy8gQmVjYXVzZSB3ZSBoYW5kbGUgcG9pbnRlciBldmVudHMgb24gYSBwZXItcGl4ZWwgYmFzaXMsIHdlIGRvbid0IHdhbnQgdGhlIGRlbHRhXG4gICAgLy8gdG8gY2hhbmdlIGZvciBldmVyeSBwaXhlbCwgb3RoZXJ3aXNlIGFueXRoaW5nIHRoYXQgZGVwZW5kcyBvbiBpdCBjYW4gbG9vayBlcnJhdGljLlxuICAgIC8vIFRvIG1ha2UgdGhlIGRlbHRhIG1vcmUgY29uc2lzdGVudCwgd2UgdHJhY2sgaG93IG11Y2ggdGhlIHVzZXIgaGFzIG1vdmVkIHNpbmNlIHRoZSBsYXN0XG4gICAgLy8gZGVsdGEgY2hhbmdlIGFuZCB3ZSBvbmx5IHVwZGF0ZSBpdCBhZnRlciBpdCBoYXMgcmVhY2hlZCBhIGNlcnRhaW4gdGhyZXNob2xkLlxuICAgIGlmIChjaGFuZ2VYID4gdGhpcy5fY29uZmlnLnBvaW50ZXJEaXJlY3Rpb25DaGFuZ2VUaHJlc2hvbGQpIHtcbiAgICAgIGRlbHRhLnggPSB4ID4gcG9zaXRpb25TaW5jZUxhc3RDaGFuZ2UueCA/IDEgOiAtMTtcbiAgICAgIHBvc2l0aW9uU2luY2VMYXN0Q2hhbmdlLnggPSB4O1xuICAgIH1cblxuICAgIGlmIChjaGFuZ2VZID4gdGhpcy5fY29uZmlnLnBvaW50ZXJEaXJlY3Rpb25DaGFuZ2VUaHJlc2hvbGQpIHtcbiAgICAgIGRlbHRhLnkgPSB5ID4gcG9zaXRpb25TaW5jZUxhc3RDaGFuZ2UueSA/IDEgOiAtMTtcbiAgICAgIHBvc2l0aW9uU2luY2VMYXN0Q2hhbmdlLnkgPSB5O1xuICAgIH1cblxuICAgIHJldHVybiBkZWx0YTtcbiAgfVxuXG4gIC8qKiBUb2dnbGVzIHRoZSBuYXRpdmUgZHJhZyBpbnRlcmFjdGlvbnMsIGJhc2VkIG9uIGhvdyBtYW55IGhhbmRsZXMgYXJlIHJlZ2lzdGVyZWQuICovXG4gIHByaXZhdGUgX3RvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMoKSB7XG4gICAgaWYgKCF0aGlzLl9yb290RWxlbWVudCB8fCAhdGhpcy5faGFuZGxlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNob3VsZEVuYWJsZSA9IHRoaXMuX2hhbmRsZXMubGVuZ3RoID4gMCB8fCAhdGhpcy5pc0RyYWdnaW5nKCk7XG5cbiAgICBpZiAoc2hvdWxkRW5hYmxlICE9PSB0aGlzLl9uYXRpdmVJbnRlcmFjdGlvbnNFbmFibGVkKSB7XG4gICAgICB0aGlzLl9uYXRpdmVJbnRlcmFjdGlvbnNFbmFibGVkID0gc2hvdWxkRW5hYmxlO1xuICAgICAgdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucyh0aGlzLl9yb290RWxlbWVudCwgc2hvdWxkRW5hYmxlKTtcbiAgICB9XG4gIH1cblxuICAvKiogUmVtb3ZlcyB0aGUgbWFudWFsbHktYWRkZWQgZXZlbnQgbGlzdGVuZXJzIGZyb20gdGhlIHJvb3QgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfcmVtb3ZlUm9vdEVsZW1lbnRMaXN0ZW5lcnMoZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX3BvaW50ZXJEb3duLCBhY3RpdmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5fcG9pbnRlckRvd24sIHBhc3NpdmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdkcmFnc3RhcnQnLCB0aGlzLl9uYXRpdmVEcmFnU3RhcnQsIGFjdGl2ZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBsaWVzIGEgYHRyYW5zZm9ybWAgdG8gdGhlIHJvb3QgZWxlbWVudCwgdGFraW5nIGludG8gYWNjb3VudCBhbnkgZXhpc3RpbmcgdHJhbnNmb3JtcyBvbiBpdC5cbiAgICogQHBhcmFtIHggTmV3IHRyYW5zZm9ybSB2YWx1ZSBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0geSBOZXcgdHJhbnNmb3JtIHZhbHVlIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqL1xuICBwcml2YXRlIF9hcHBseVJvb3RFbGVtZW50VHJhbnNmb3JtKHg6IG51bWJlciwgeTogbnVtYmVyKSB7XG4gICAgY29uc3QgdHJhbnNmb3JtID0gZ2V0VHJhbnNmb3JtKHgsIHkpO1xuICAgIGNvbnN0IHN0eWxlcyA9IHRoaXMuX3Jvb3RFbGVtZW50LnN0eWxlO1xuXG4gICAgLy8gQ2FjaGUgdGhlIHByZXZpb3VzIHRyYW5zZm9ybSBhbW91bnQgb25seSBhZnRlciB0aGUgZmlyc3QgZHJhZyBzZXF1ZW5jZSwgYmVjYXVzZVxuICAgIC8vIHdlIGRvbid0IHdhbnQgb3VyIG93biB0cmFuc2Zvcm1zIHRvIHN0YWNrIG9uIHRvcCBvZiBlYWNoIG90aGVyLlxuICAgIC8vIFNob3VsZCBiZSBleGNsdWRlZCBub25lIGJlY2F1c2Ugbm9uZSArIHRyYW5zbGF0ZTNkKHgsIHksIHgpIGlzIGludmFsaWQgY3NzXG4gICAgaWYgKHRoaXMuX2luaXRpYWxUcmFuc2Zvcm0gPT0gbnVsbCkge1xuICAgICAgdGhpcy5faW5pdGlhbFRyYW5zZm9ybSA9XG4gICAgICAgIHN0eWxlcy50cmFuc2Zvcm0gJiYgc3R5bGVzLnRyYW5zZm9ybSAhPSAnbm9uZScgPyBzdHlsZXMudHJhbnNmb3JtIDogJyc7XG4gICAgfVxuXG4gICAgLy8gUHJlc2VydmUgdGhlIHByZXZpb3VzIGB0cmFuc2Zvcm1gIHZhbHVlLCBpZiB0aGVyZSB3YXMgb25lLiBOb3RlIHRoYXQgd2UgYXBwbHkgb3VyIG93blxuICAgIC8vIHRyYW5zZm9ybSBiZWZvcmUgdGhlIHVzZXIncywgYmVjYXVzZSB0aGluZ3MgbGlrZSByb3RhdGlvbiBjYW4gYWZmZWN0IHdoaWNoIGRpcmVjdGlvblxuICAgIC8vIHRoZSBlbGVtZW50IHdpbGwgYmUgdHJhbnNsYXRlZCB0b3dhcmRzLlxuICAgIHN0eWxlcy50cmFuc2Zvcm0gPSBjb21iaW5lVHJhbnNmb3Jtcyh0cmFuc2Zvcm0sIHRoaXMuX2luaXRpYWxUcmFuc2Zvcm0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgYSBgdHJhbnNmb3JtYCB0byB0aGUgcHJldmlldywgdGFraW5nIGludG8gYWNjb3VudCBhbnkgZXhpc3RpbmcgdHJhbnNmb3JtcyBvbiBpdC5cbiAgICogQHBhcmFtIHggTmV3IHRyYW5zZm9ybSB2YWx1ZSBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0geSBOZXcgdHJhbnNmb3JtIHZhbHVlIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqL1xuICBwcml2YXRlIF9hcHBseVByZXZpZXdUcmFuc2Zvcm0oeDogbnVtYmVyLCB5OiBudW1iZXIpIHtcbiAgICAvLyBPbmx5IGFwcGx5IHRoZSBpbml0aWFsIHRyYW5zZm9ybSBpZiB0aGUgcHJldmlldyBpcyBhIGNsb25lIG9mIHRoZSBvcmlnaW5hbCBlbGVtZW50LCBvdGhlcndpc2VcbiAgICAvLyBpdCBjb3VsZCBiZSBjb21wbGV0ZWx5IGRpZmZlcmVudCBhbmQgdGhlIHRyYW5zZm9ybSBtaWdodCBub3QgbWFrZSBzZW5zZSBhbnltb3JlLlxuICAgIGNvbnN0IGluaXRpYWxUcmFuc2Zvcm0gPSB0aGlzLl9wcmV2aWV3VGVtcGxhdGU/LnRlbXBsYXRlID8gdW5kZWZpbmVkIDogdGhpcy5faW5pdGlhbFRyYW5zZm9ybTtcbiAgICBjb25zdCB0cmFuc2Zvcm0gPSBnZXRUcmFuc2Zvcm0oeCwgeSk7XG4gICAgdGhpcy5fcHJldmlldy5zdHlsZS50cmFuc2Zvcm0gPSBjb21iaW5lVHJhbnNmb3Jtcyh0cmFuc2Zvcm0sIGluaXRpYWxUcmFuc2Zvcm0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGRpc3RhbmNlIHRoYXQgdGhlIHVzZXIgaGFzIGRyYWdnZWQgZHVyaW5nIHRoZSBjdXJyZW50IGRyYWcgc2VxdWVuY2UuXG4gICAqIEBwYXJhbSBjdXJyZW50UG9zaXRpb24gQ3VycmVudCBwb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIuXG4gICAqL1xuICBwcml2YXRlIF9nZXREcmFnRGlzdGFuY2UoY3VycmVudFBvc2l0aW9uOiBQb2ludCk6IFBvaW50IHtcbiAgICBjb25zdCBwaWNrdXBQb3NpdGlvbiA9IHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlO1xuXG4gICAgaWYgKHBpY2t1cFBvc2l0aW9uKSB7XG4gICAgICByZXR1cm4ge3g6IGN1cnJlbnRQb3NpdGlvbi54IC0gcGlja3VwUG9zaXRpb24ueCwgeTogY3VycmVudFBvc2l0aW9uLnkgLSBwaWNrdXBQb3NpdGlvbi55fTtcbiAgICB9XG5cbiAgICByZXR1cm4ge3g6IDAsIHk6IDB9O1xuICB9XG5cbiAgLyoqIENsZWFucyB1cCBhbnkgY2FjaGVkIGVsZW1lbnQgZGltZW5zaW9ucyB0aGF0IHdlIGRvbid0IG5lZWQgYWZ0ZXIgZHJhZ2dpbmcgaGFzIHN0b3BwZWQuICovXG4gIHByaXZhdGUgX2NsZWFudXBDYWNoZWREaW1lbnNpb25zKCkge1xuICAgIHRoaXMuX2JvdW5kYXJ5UmVjdCA9IHRoaXMuX3ByZXZpZXdSZWN0ID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3BhcmVudFBvc2l0aW9ucy5jbGVhcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSBlbGVtZW50IGlzIHN0aWxsIGluc2lkZSBpdHMgYm91bmRhcnkgYWZ0ZXIgdGhlIHZpZXdwb3J0IGhhcyBiZWVuIHJlc2l6ZWQuXG4gICAqIElmIG5vdCwgdGhlIHBvc2l0aW9uIGlzIGFkanVzdGVkIHNvIHRoYXQgdGhlIGVsZW1lbnQgZml0cyBhZ2Fpbi5cbiAgICovXG4gIHByaXZhdGUgX2NvbnRhaW5JbnNpZGVCb3VuZGFyeU9uUmVzaXplKCkge1xuICAgIGxldCB7eCwgeX0gPSB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtO1xuXG4gICAgaWYgKCh4ID09PSAwICYmIHkgPT09IDApIHx8IHRoaXMuaXNEcmFnZ2luZygpIHx8ICF0aGlzLl9ib3VuZGFyeUVsZW1lbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBOb3RlOiBkb24ndCB1c2UgYF9jbGllbnRSZWN0QXRTdGFydGAgaGVyZSwgYmVjYXVzZSB3ZSB3YW50IHRoZSBsYXRlc3QgcG9zaXRpb24uXG4gICAgY29uc3QgZWxlbWVudFJlY3QgPSB0aGlzLl9yb290RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCBib3VuZGFyeVJlY3QgPSB0aGlzLl9ib3VuZGFyeUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAvLyBJdCdzIHBvc3NpYmxlIHRoYXQgdGhlIGVsZW1lbnQgZ290IGhpZGRlbiBhd2F5IGFmdGVyIGRyYWdnaW5nIChlLmcuIGJ5IHN3aXRjaGluZyB0byBhXG4gICAgLy8gZGlmZmVyZW50IHRhYikuIERvbid0IGRvIGFueXRoaW5nIGluIHRoaXMgY2FzZSBzbyB3ZSBkb24ndCBjbGVhciB0aGUgdXNlcidzIHBvc2l0aW9uLlxuICAgIGlmIChcbiAgICAgIChib3VuZGFyeVJlY3Qud2lkdGggPT09IDAgJiYgYm91bmRhcnlSZWN0LmhlaWdodCA9PT0gMCkgfHxcbiAgICAgIChlbGVtZW50UmVjdC53aWR0aCA9PT0gMCAmJiBlbGVtZW50UmVjdC5oZWlnaHQgPT09IDApXG4gICAgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbGVmdE92ZXJmbG93ID0gYm91bmRhcnlSZWN0LmxlZnQgLSBlbGVtZW50UmVjdC5sZWZ0O1xuICAgIGNvbnN0IHJpZ2h0T3ZlcmZsb3cgPSBlbGVtZW50UmVjdC5yaWdodCAtIGJvdW5kYXJ5UmVjdC5yaWdodDtcbiAgICBjb25zdCB0b3BPdmVyZmxvdyA9IGJvdW5kYXJ5UmVjdC50b3AgLSBlbGVtZW50UmVjdC50b3A7XG4gICAgY29uc3QgYm90dG9tT3ZlcmZsb3cgPSBlbGVtZW50UmVjdC5ib3R0b20gLSBib3VuZGFyeVJlY3QuYm90dG9tO1xuXG4gICAgLy8gSWYgdGhlIGVsZW1lbnQgaGFzIGJlY29tZSB3aWRlciB0aGFuIHRoZSBib3VuZGFyeSwgd2UgY2FuJ3RcbiAgICAvLyBkbyBtdWNoIHRvIG1ha2UgaXQgZml0IHNvIHdlIGp1c3QgYW5jaG9yIGl0IHRvIHRoZSBsZWZ0LlxuICAgIGlmIChib3VuZGFyeVJlY3Qud2lkdGggPiBlbGVtZW50UmVjdC53aWR0aCkge1xuICAgICAgaWYgKGxlZnRPdmVyZmxvdyA+IDApIHtcbiAgICAgICAgeCArPSBsZWZ0T3ZlcmZsb3c7XG4gICAgICB9XG5cbiAgICAgIGlmIChyaWdodE92ZXJmbG93ID4gMCkge1xuICAgICAgICB4IC09IHJpZ2h0T3ZlcmZsb3c7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHggPSAwO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBlbGVtZW50IGhhcyBiZWNvbWUgdGFsbGVyIHRoYW4gdGhlIGJvdW5kYXJ5LCB3ZSBjYW4ndFxuICAgIC8vIGRvIG11Y2ggdG8gbWFrZSBpdCBmaXQgc28gd2UganVzdCBhbmNob3IgaXQgdG8gdGhlIHRvcC5cbiAgICBpZiAoYm91bmRhcnlSZWN0LmhlaWdodCA+IGVsZW1lbnRSZWN0LmhlaWdodCkge1xuICAgICAgaWYgKHRvcE92ZXJmbG93ID4gMCkge1xuICAgICAgICB5ICs9IHRvcE92ZXJmbG93O1xuICAgICAgfVxuXG4gICAgICBpZiAoYm90dG9tT3ZlcmZsb3cgPiAwKSB7XG4gICAgICAgIHkgLT0gYm90dG9tT3ZlcmZsb3c7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHkgPSAwO1xuICAgIH1cblxuICAgIGlmICh4ICE9PSB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtLnggfHwgeSAhPT0gdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybS55KSB7XG4gICAgICB0aGlzLnNldEZyZWVEcmFnUG9zaXRpb24oe3ksIHh9KTtcbiAgICB9XG4gIH1cblxuICAvKiogR2V0cyB0aGUgZHJhZyBzdGFydCBkZWxheSwgYmFzZWQgb24gdGhlIGV2ZW50IHR5cGUuICovXG4gIHByaXZhdGUgX2dldERyYWdTdGFydERlbGF5KGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCk6IG51bWJlciB7XG4gICAgY29uc3QgdmFsdWUgPSB0aGlzLmRyYWdTdGFydERlbGF5O1xuXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9IGVsc2UgaWYgKGlzVG91Y2hFdmVudChldmVudCkpIHtcbiAgICAgIHJldHVybiB2YWx1ZS50b3VjaDtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWUgPyB2YWx1ZS5tb3VzZSA6IDA7XG4gIH1cblxuICAvKiogVXBkYXRlcyB0aGUgaW50ZXJuYWwgc3RhdGUgb2YgdGhlIGRyYWdnYWJsZSBlbGVtZW50IHdoZW4gc2Nyb2xsaW5nIGhhcyBvY2N1cnJlZC4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlT25TY3JvbGwoZXZlbnQ6IEV2ZW50KSB7XG4gICAgY29uc3Qgc2Nyb2xsRGlmZmVyZW5jZSA9IHRoaXMuX3BhcmVudFBvc2l0aW9ucy5oYW5kbGVTY3JvbGwoZXZlbnQpO1xuXG4gICAgaWYgKHNjcm9sbERpZmZlcmVuY2UpIHtcbiAgICAgIGNvbnN0IHRhcmdldCA9IF9nZXRFdmVudFRhcmdldDxIVE1MRWxlbWVudCB8IERvY3VtZW50PihldmVudCkhO1xuXG4gICAgICAvLyBET01SZWN0IGRpbWVuc2lvbnMgYXJlIGJhc2VkIG9uIHRoZSBzY3JvbGwgcG9zaXRpb24gb2YgdGhlIHBhZ2UgYW5kIGl0cyBwYXJlbnRcbiAgICAgIC8vIG5vZGUgc28gd2UgaGF2ZSB0byB1cGRhdGUgdGhlIGNhY2hlZCBib3VuZGFyeSBET01SZWN0IGlmIHRoZSB1c2VyIGhhcyBzY3JvbGxlZC5cbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5fYm91bmRhcnlSZWN0ICYmXG4gICAgICAgIHRhcmdldCAhPT0gdGhpcy5fYm91bmRhcnlFbGVtZW50ICYmXG4gICAgICAgIHRhcmdldC5jb250YWlucyh0aGlzLl9ib3VuZGFyeUVsZW1lbnQpXG4gICAgICApIHtcbiAgICAgICAgYWRqdXN0RG9tUmVjdCh0aGlzLl9ib3VuZGFyeVJlY3QsIHNjcm9sbERpZmZlcmVuY2UudG9wLCBzY3JvbGxEaWZmZXJlbmNlLmxlZnQpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZS54ICs9IHNjcm9sbERpZmZlcmVuY2UubGVmdDtcbiAgICAgIHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLnkgKz0gc2Nyb2xsRGlmZmVyZW5jZS50b3A7XG5cbiAgICAgIC8vIElmIHdlJ3JlIGluIGZyZWUgZHJhZyBtb2RlLCB3ZSBoYXZlIHRvIHVwZGF0ZSB0aGUgYWN0aXZlIHRyYW5zZm9ybSwgYmVjYXVzZVxuICAgICAgLy8gaXQgaXNuJ3QgcmVsYXRpdmUgdG8gdGhlIHZpZXdwb3J0IGxpa2UgdGhlIHByZXZpZXcgaW5zaWRlIGEgZHJvcCBsaXN0LlxuICAgICAgaWYgKCF0aGlzLl9kcm9wQ29udGFpbmVyKSB7XG4gICAgICAgIHRoaXMuX2FjdGl2ZVRyYW5zZm9ybS54IC09IHNjcm9sbERpZmZlcmVuY2UubGVmdDtcbiAgICAgICAgdGhpcy5fYWN0aXZlVHJhbnNmb3JtLnkgLT0gc2Nyb2xsRGlmZmVyZW5jZS50b3A7XG4gICAgICAgIHRoaXMuX2FwcGx5Um9vdEVsZW1lbnRUcmFuc2Zvcm0odGhpcy5fYWN0aXZlVHJhbnNmb3JtLngsIHRoaXMuX2FjdGl2ZVRyYW5zZm9ybS55KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogR2V0cyB0aGUgc2Nyb2xsIHBvc2l0aW9uIG9mIHRoZSB2aWV3cG9ydC4gKi9cbiAgcHJpdmF0ZSBfZ2V0Vmlld3BvcnRTY3JvbGxQb3NpdGlvbigpIHtcbiAgICByZXR1cm4gKFxuICAgICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLnBvc2l0aW9ucy5nZXQodGhpcy5fZG9jdW1lbnQpPy5zY3JvbGxQb3NpdGlvbiB8fFxuICAgICAgdGhpcy5fcGFyZW50UG9zaXRpb25zLmdldFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24oKVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogTGF6aWx5IHJlc29sdmVzIGFuZCByZXR1cm5zIHRoZSBzaGFkb3cgcm9vdCBvZiB0aGUgZWxlbWVudC4gV2UgZG8gdGhpcyBpbiBhIGZ1bmN0aW9uLCByYXRoZXJcbiAgICogdGhhbiBzYXZpbmcgaXQgaW4gcHJvcGVydHkgZGlyZWN0bHkgb24gaW5pdCwgYmVjYXVzZSB3ZSB3YW50IHRvIHJlc29sdmUgaXQgYXMgbGF0ZSBhcyBwb3NzaWJsZVxuICAgKiBpbiBvcmRlciB0byBlbnN1cmUgdGhhdCB0aGUgZWxlbWVudCBoYXMgYmVlbiBtb3ZlZCBpbnRvIHRoZSBzaGFkb3cgRE9NLiBEb2luZyBpdCBpbnNpZGUgdGhlXG4gICAqIGNvbnN0cnVjdG9yIG1pZ2h0IGJlIHRvbyBlYXJseSBpZiB0aGUgZWxlbWVudCBpcyBpbnNpZGUgb2Ygc29tZXRoaW5nIGxpa2UgYG5nRm9yYCBvciBgbmdJZmAuXG4gICAqL1xuICBwcml2YXRlIF9nZXRTaGFkb3dSb290KCk6IFNoYWRvd1Jvb3QgfCBudWxsIHtcbiAgICBpZiAodGhpcy5fY2FjaGVkU2hhZG93Um9vdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLl9jYWNoZWRTaGFkb3dSb290ID0gX2dldFNoYWRvd1Jvb3QodGhpcy5fcm9vdEVsZW1lbnQpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9jYWNoZWRTaGFkb3dSb290O1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIGVsZW1lbnQgaW50byB3aGljaCB0aGUgZHJhZyBwcmV2aWV3IHNob3VsZCBiZSBpbnNlcnRlZC4gKi9cbiAgcHJpdmF0ZSBfZ2V0UHJldmlld0luc2VydGlvblBvaW50KFxuICAgIGluaXRpYWxQYXJlbnQ6IEhUTUxFbGVtZW50LFxuICAgIHNoYWRvd1Jvb3Q6IFNoYWRvd1Jvb3QgfCBudWxsLFxuICApOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3QgcHJldmlld0NvbnRhaW5lciA9IHRoaXMuX3ByZXZpZXdDb250YWluZXIgfHwgJ2dsb2JhbCc7XG5cbiAgICBpZiAocHJldmlld0NvbnRhaW5lciA9PT0gJ3BhcmVudCcpIHtcbiAgICAgIHJldHVybiBpbml0aWFsUGFyZW50O1xuICAgIH1cblxuICAgIGlmIChwcmV2aWV3Q29udGFpbmVyID09PSAnZ2xvYmFsJykge1xuICAgICAgY29uc3QgZG9jdW1lbnRSZWYgPSB0aGlzLl9kb2N1bWVudDtcblxuICAgICAgLy8gV2UgY2FuJ3QgdXNlIHRoZSBib2R5IGlmIHRoZSB1c2VyIGlzIGluIGZ1bGxzY3JlZW4gbW9kZSxcbiAgICAgIC8vIGJlY2F1c2UgdGhlIHByZXZpZXcgd2lsbCByZW5kZXIgdW5kZXIgdGhlIGZ1bGxzY3JlZW4gZWxlbWVudC5cbiAgICAgIC8vIFRPRE8oY3Jpc2JldG8pOiBkZWR1cGUgdGhpcyB3aXRoIHRoZSBgRnVsbHNjcmVlbk92ZXJsYXlDb250YWluZXJgIGV2ZW50dWFsbHkuXG4gICAgICByZXR1cm4gKFxuICAgICAgICBzaGFkb3dSb290IHx8XG4gICAgICAgIGRvY3VtZW50UmVmLmZ1bGxzY3JlZW5FbGVtZW50IHx8XG4gICAgICAgIChkb2N1bWVudFJlZiBhcyBhbnkpLndlYmtpdEZ1bGxzY3JlZW5FbGVtZW50IHx8XG4gICAgICAgIChkb2N1bWVudFJlZiBhcyBhbnkpLm1vekZ1bGxTY3JlZW5FbGVtZW50IHx8XG4gICAgICAgIChkb2N1bWVudFJlZiBhcyBhbnkpLm1zRnVsbHNjcmVlbkVsZW1lbnQgfHxcbiAgICAgICAgZG9jdW1lbnRSZWYuYm9keVxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY29lcmNlRWxlbWVudChwcmV2aWV3Q29udGFpbmVyKTtcbiAgfVxuXG4gIC8qKiBMYXppbHkgcmVzb2x2ZXMgYW5kIHJldHVybnMgdGhlIGRpbWVuc2lvbnMgb2YgdGhlIHByZXZpZXcuICovXG4gIHByaXZhdGUgX2dldFByZXZpZXdSZWN0KCk6IERPTVJlY3Qge1xuICAgIC8vIENhY2hlIHRoZSBwcmV2aWV3IGVsZW1lbnQgcmVjdCBpZiB3ZSBoYXZlbid0IGNhY2hlZCBpdCBhbHJlYWR5IG9yIGlmXG4gICAgLy8gd2UgY2FjaGVkIGl0IHRvbyBlYXJseSBiZWZvcmUgdGhlIGVsZW1lbnQgZGltZW5zaW9ucyB3ZXJlIGNvbXB1dGVkLlxuICAgIGlmICghdGhpcy5fcHJldmlld1JlY3QgfHwgKCF0aGlzLl9wcmV2aWV3UmVjdC53aWR0aCAmJiAhdGhpcy5fcHJldmlld1JlY3QuaGVpZ2h0KSkge1xuICAgICAgdGhpcy5fcHJldmlld1JlY3QgPSB0aGlzLl9wcmV2aWV3XG4gICAgICAgID8gdGhpcy5fcHJldmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICA6IHRoaXMuX2luaXRpYWxEb21SZWN0ITtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fcHJldmlld1JlY3Q7XG4gIH1cblxuICAvKiogSGFuZGxlcyBhIG5hdGl2ZSBgZHJhZ3N0YXJ0YCBldmVudC4gKi9cbiAgcHJpdmF0ZSBfbmF0aXZlRHJhZ1N0YXJ0ID0gKGV2ZW50OiBEcmFnRXZlbnQpID0+IHtcbiAgICBpZiAodGhpcy5faGFuZGxlcy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHRhcmdldEhhbmRsZSA9IHRoaXMuX2dldFRhcmdldEhhbmRsZShldmVudCk7XG5cbiAgICAgIGlmICh0YXJnZXRIYW5kbGUgJiYgIXRoaXMuX2Rpc2FibGVkSGFuZGxlcy5oYXModGFyZ2V0SGFuZGxlKSAmJiAhdGhpcy5kaXNhYmxlZCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIXRoaXMuZGlzYWJsZWQpIHtcbiAgICAgIC8vIFVzdWFsbHkgdGhpcyBpc24ndCBuZWNlc3Nhcnkgc2luY2UgdGhlIHdlIHByZXZlbnQgdGhlIGRlZmF1bHQgYWN0aW9uIGluIGBwb2ludGVyRG93bmAsXG4gICAgICAvLyBidXQgc29tZSBjYXNlcyBsaWtlIGRyYWdnaW5nIG9mIGxpbmtzIGNhbiBzbGlwIHRocm91Z2ggKHNlZSAjMjQ0MDMpLlxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqIEdldHMgYSBoYW5kbGUgdGhhdCBpcyB0aGUgdGFyZ2V0IG9mIGFuIGV2ZW50LiAqL1xuICBwcml2YXRlIF9nZXRUYXJnZXRIYW5kbGUoZXZlbnQ6IEV2ZW50KTogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9oYW5kbGVzLmZpbmQoaGFuZGxlID0+IHtcbiAgICAgIHJldHVybiBldmVudC50YXJnZXQgJiYgKGV2ZW50LnRhcmdldCA9PT0gaGFuZGxlIHx8IGhhbmRsZS5jb250YWlucyhldmVudC50YXJnZXQgYXMgTm9kZSkpO1xuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogR2V0cyBhIDNkIGB0cmFuc2Zvcm1gIHRoYXQgY2FuIGJlIGFwcGxpZWQgdG8gYW4gZWxlbWVudC5cbiAqIEBwYXJhbSB4IERlc2lyZWQgcG9zaXRpb24gb2YgdGhlIGVsZW1lbnQgYWxvbmcgdGhlIFggYXhpcy5cbiAqIEBwYXJhbSB5IERlc2lyZWQgcG9zaXRpb24gb2YgdGhlIGVsZW1lbnQgYWxvbmcgdGhlIFkgYXhpcy5cbiAqL1xuZnVuY3Rpb24gZ2V0VHJhbnNmb3JtKHg6IG51bWJlciwgeTogbnVtYmVyKTogc3RyaW5nIHtcbiAgLy8gUm91bmQgdGhlIHRyYW5zZm9ybXMgc2luY2Ugc29tZSBicm93c2VycyB3aWxsXG4gIC8vIGJsdXIgdGhlIGVsZW1lbnRzIGZvciBzdWItcGl4ZWwgdHJhbnNmb3Jtcy5cbiAgcmV0dXJuIGB0cmFuc2xhdGUzZCgke01hdGgucm91bmQoeCl9cHgsICR7TWF0aC5yb3VuZCh5KX1weCwgMClgO1xufVxuXG4vKiogQ2xhbXBzIGEgdmFsdWUgYmV0d2VlbiBhIG1pbmltdW0gYW5kIGEgbWF4aW11bS4gKi9cbmZ1bmN0aW9uIGNsYW1wKHZhbHVlOiBudW1iZXIsIG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcikge1xuICByZXR1cm4gTWF0aC5tYXgobWluLCBNYXRoLm1pbihtYXgsIHZhbHVlKSk7XG59XG5cbi8qKiBEZXRlcm1pbmVzIHdoZXRoZXIgYW4gZXZlbnQgaXMgYSB0b3VjaCBldmVudC4gKi9cbmZ1bmN0aW9uIGlzVG91Y2hFdmVudChldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpOiBldmVudCBpcyBUb3VjaEV2ZW50IHtcbiAgLy8gVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgZm9yIGV2ZXJ5IHBpeGVsIHRoYXQgdGhlIHVzZXIgaGFzIGRyYWdnZWQgc28gd2UgbmVlZCBpdCB0byBiZVxuICAvLyBhcyBmYXN0IGFzIHBvc3NpYmxlLiBTaW5jZSB3ZSBvbmx5IGJpbmQgbW91c2UgZXZlbnRzIGFuZCB0b3VjaCBldmVudHMsIHdlIGNhbiBhc3N1bWVcbiAgLy8gdGhhdCBpZiB0aGUgZXZlbnQncyBuYW1lIHN0YXJ0cyB3aXRoIGB0YCwgaXQncyBhIHRvdWNoIGV2ZW50LlxuICByZXR1cm4gZXZlbnQudHlwZVswXSA9PT0gJ3QnO1xufVxuXG4vKipcbiAqIEdldHMgdGhlIHJvb3QgSFRNTCBlbGVtZW50IG9mIGFuIGVtYmVkZGVkIHZpZXcuXG4gKiBJZiB0aGUgcm9vdCBpcyBub3QgYW4gSFRNTCBlbGVtZW50IGl0IGdldHMgd3JhcHBlZCBpbiBvbmUuXG4gKi9cbmZ1bmN0aW9uIGdldFJvb3ROb2RlKHZpZXdSZWY6IEVtYmVkZGVkVmlld1JlZjxhbnk+LCBfZG9jdW1lbnQ6IERvY3VtZW50KTogSFRNTEVsZW1lbnQge1xuICBjb25zdCByb290Tm9kZXM6IE5vZGVbXSA9IHZpZXdSZWYucm9vdE5vZGVzO1xuXG4gIGlmIChyb290Tm9kZXMubGVuZ3RoID09PSAxICYmIHJvb3ROb2Rlc1swXS5ub2RlVHlwZSA9PT0gX2RvY3VtZW50LkVMRU1FTlRfTk9ERSkge1xuICAgIHJldHVybiByb290Tm9kZXNbMF0gYXMgSFRNTEVsZW1lbnQ7XG4gIH1cblxuICBjb25zdCB3cmFwcGVyID0gX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICByb290Tm9kZXMuZm9yRWFjaChub2RlID0+IHdyYXBwZXIuYXBwZW5kQ2hpbGQobm9kZSkpO1xuICByZXR1cm4gd3JhcHBlcjtcbn1cblxuLyoqXG4gKiBNYXRjaGVzIHRoZSB0YXJnZXQgZWxlbWVudCdzIHNpemUgdG8gdGhlIHNvdXJjZSdzIHNpemUuXG4gKiBAcGFyYW0gdGFyZ2V0IEVsZW1lbnQgdGhhdCBuZWVkcyB0byBiZSByZXNpemVkLlxuICogQHBhcmFtIHNvdXJjZVJlY3QgRGltZW5zaW9ucyBvZiB0aGUgc291cmNlIGVsZW1lbnQuXG4gKi9cbmZ1bmN0aW9uIG1hdGNoRWxlbWVudFNpemUodGFyZ2V0OiBIVE1MRWxlbWVudCwgc291cmNlUmVjdDogRE9NUmVjdCk6IHZvaWQge1xuICB0YXJnZXQuc3R5bGUud2lkdGggPSBgJHtzb3VyY2VSZWN0LndpZHRofXB4YDtcbiAgdGFyZ2V0LnN0eWxlLmhlaWdodCA9IGAke3NvdXJjZVJlY3QuaGVpZ2h0fXB4YDtcbiAgdGFyZ2V0LnN0eWxlLnRyYW5zZm9ybSA9IGdldFRyYW5zZm9ybShzb3VyY2VSZWN0LmxlZnQsIHNvdXJjZVJlY3QudG9wKTtcbn1cbiJdfQ==