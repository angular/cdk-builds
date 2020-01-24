/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/drag-drop/drag-ref.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
import { startWith } from 'rxjs/operators';
import { extendStyles, toggleNativeDragInteractions } from './drag-styling';
import { getTransformTransitionDurationInMs } from './transition-duration';
/**
 * Object that can be used to configure the behavior of DragRef.
 * @record
 */
export function DragRefConfig() { }
if (false) {
    /**
     * Minimum amount of pixels that the user should
     * drag, before the CDK initiates a drag sequence.
     * @type {?}
     */
    DragRefConfig.prototype.dragStartThreshold;
    /**
     * Amount the pixels the user should drag before the CDK
     * considers them to have changed the drag direction.
     * @type {?}
     */
    DragRefConfig.prototype.pointerDirectionChangeThreshold;
}
/**
 * Options that can be used to bind a passive event listener.
 * @type {?}
 */
const passiveEventListenerOptions = normalizePassiveListenerOptions({ passive: true });
/**
 * Options that can be used to bind an active event listener.
 * @type {?}
 */
const activeEventListenerOptions = normalizePassiveListenerOptions({ passive: false });
/**
 * Time in milliseconds for which to ignore mouse events, after
 * receiving a touch event. Used to avoid doing double work for
 * touch devices where the browser fires fake mouse events, in
 * addition to touch events.
 * @type {?}
 */
const MOUSE_EVENT_IGNORE_TIME = 800;
/**
 * Internal compile-time-only representation of a `DragRef`.
 * Used to avoid circular import issues between the `DragRef` and the `DropListRef`.
 * \@docs-private
 * @record
 */
export function DragRefInternal() { }
/**
 * Template that can be used to create a drag helper element (e.g. a preview or a placeholder).
 * @record
 * @template T
 */
function DragHelperTemplate() { }
if (false) {
    /** @type {?} */
    DragHelperTemplate.prototype.template;
    /** @type {?} */
    DragHelperTemplate.prototype.viewContainer;
    /** @type {?} */
    DragHelperTemplate.prototype.context;
}
/**
 * Reference to a draggable item. Used to manipulate or dispose of the item.
 * @template T
 */
export class DragRef {
    /**
     * @param {?} element
     * @param {?} _config
     * @param {?} _document
     * @param {?} _ngZone
     * @param {?} _viewportRuler
     * @param {?} _dragDropRegistry
     */
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
        /**
         * CSS `transform` that is applied to the element while it's being dragged.
         */
        this._activeTransform = { x: 0, y: 0 };
        /**
         * Emits when the item is being moved.
         */
        this._moveEvents = new Subject();
        /**
         * Subscription to pointer movement events.
         */
        this._pointerMoveSubscription = Subscription.EMPTY;
        /**
         * Subscription to the event that is dispatched when the user lifts their pointer.
         */
        this._pointerUpSubscription = Subscription.EMPTY;
        /**
         * Subscription to the viewport being scrolled.
         */
        this._scrollSubscription = Subscription.EMPTY;
        /**
         * Subscription to the viewport being resized.
         */
        this._resizeSubscription = Subscription.EMPTY;
        /**
         * Cached reference to the boundary element.
         */
        this._boundaryElement = null;
        /**
         * Whether the native dragging interactions have been enabled on the root element.
         */
        this._nativeInteractionsEnabled = true;
        /**
         * Elements that can be used to drag the draggable item.
         */
        this._handles = [];
        /**
         * Registered handles that are currently disabled.
         */
        this._disabledHandles = new Set();
        /**
         * Layout direction of the item.
         */
        this._direction = 'ltr';
        /**
         * Amount of milliseconds to wait after the user has put their
         * pointer down before starting to drag the element.
         */
        this.dragStartDelay = 0;
        this._disabled = false;
        /**
         * Emits as the drag sequence is being prepared.
         */
        this.beforeStarted = new Subject();
        /**
         * Emits when the user starts dragging the item.
         */
        this.started = new Subject();
        /**
         * Emits when the user has released a drag item, before any animations have started.
         */
        this.released = new Subject();
        /**
         * Emits when the user stops dragging an item in the container.
         */
        this.ended = new Subject();
        /**
         * Emits when the user has moved the item into a new container.
         */
        this.entered = new Subject();
        /**
         * Emits when the user removes the item its container by dragging it into another container.
         */
        this.exited = new Subject();
        /**
         * Emits when the user drops the item inside a container.
         */
        this.dropped = new Subject();
        /**
         * Emits as the user is dragging the item. Use with caution,
         * because this event will fire for every pixel that the user has dragged.
         */
        this.moved = this._moveEvents.asObservable();
        /**
         * Handler for the `mousedown`/`touchstart` events.
         */
        this._pointerDown = (/**
         * @param {?} event
         * @return {?}
         */
        (event) => {
            this.beforeStarted.next();
            // Delegate the event based on whether it started from a handle or the element itself.
            if (this._handles.length) {
                /** @type {?} */
                const targetHandle = this._handles.find((/**
                 * @param {?} handle
                 * @return {?}
                 */
                handle => {
                    /** @type {?} */
                    const target = event.target;
                    return !!target && (target === handle || handle.contains((/** @type {?} */ (target))));
                }));
                if (targetHandle && !this._disabledHandles.has(targetHandle) && !this.disabled) {
                    this._initializeDragSequence(targetHandle, event);
                }
            }
            else if (!this.disabled) {
                this._initializeDragSequence(this._rootElement, event);
            }
        });
        /**
         * Handler that is invoked when the user moves their pointer after they've initiated a drag.
         */
        this._pointerMove = (/**
         * @param {?} event
         * @return {?}
         */
        (event) => {
            // Prevent the default action as early as possible in order to block
            // native actions like dragging the selected text or images with the mouse.
            event.preventDefault();
            if (!this._hasStartedDragging) {
                /** @type {?} */
                const pointerPosition = this._getPointerPositionOnPage(event);
                /** @type {?} */
                const distanceX = Math.abs(pointerPosition.x - this._pickupPositionOnPage.x);
                /** @type {?} */
                const distanceY = Math.abs(pointerPosition.y - this._pickupPositionOnPage.y);
                /** @type {?} */
                const isOverThreshold = distanceX + distanceY >= this._config.dragStartThreshold;
                // Only start dragging after the user has moved more than the minimum distance in either
                // direction. Note that this is preferrable over doing something like `skip(minimumDistance)`
                // in the `pointerMove` subscription, because we're not guaranteed to have one move event
                // per pixel of movement (e.g. if the user moves their pointer quickly).
                if (isOverThreshold) {
                    /** @type {?} */
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
                        this._ngZone.run((/**
                         * @return {?}
                         */
                        () => this._startDragSequence(event)));
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
            /** @type {?} */
            const constrainedPointerPosition = this._getConstrainedPointerPosition(event);
            this._hasMoved = true;
            this._updatePointerDirectionDelta(constrainedPointerPosition);
            if (this._dropContainer) {
                this._updateActiveDropContainer(constrainedPointerPosition);
            }
            else {
                /** @type {?} */
                const activeTransform = this._activeTransform;
                activeTransform.x =
                    constrainedPointerPosition.x - this._pickupPositionOnPage.x + this._passiveTransform.x;
                activeTransform.y =
                    constrainedPointerPosition.y - this._pickupPositionOnPage.y + this._passiveTransform.y;
                this._applyRootElementTransform(activeTransform.x, activeTransform.y);
                // Apply transform as attribute if dragging and svg element to work for IE
                if (typeof SVGElement !== 'undefined' && this._rootElement instanceof SVGElement) {
                    /** @type {?} */
                    const appliedTransform = `translate(${activeTransform.x} ${activeTransform.y})`;
                    this._rootElement.setAttribute('transform', appliedTransform);
                }
            }
            // Since this event gets fired for every pixel while dragging, we only
            // want to fire it if the consumer opted into it. Also we have to
            // re-enter the zone because we run all of the events on the outside.
            if (this._moveEvents.observers.length) {
                this._ngZone.run((/**
                 * @return {?}
                 */
                () => {
                    this._moveEvents.next({
                        source: this,
                        pointerPosition: constrainedPointerPosition,
                        event,
                        distance: this._getDragDistance(constrainedPointerPosition),
                        delta: this._pointerDirectionDelta
                    });
                }));
            }
        });
        /**
         * Handler that is invoked when the user lifts their pointer up, after initiating a drag.
         */
        this._pointerUp = (/**
         * @param {?} event
         * @return {?}
         */
        (event) => {
            this._endDragSequence(event);
        });
        this.withRootElement(element);
        _dragDropRegistry.registerDragItem(this);
    }
    /**
     * Whether starting to drag this element is disabled.
     * @return {?}
     */
    get disabled() {
        return this._disabled || !!(this._dropContainer && this._dropContainer.disabled);
    }
    /**
     * @param {?} value
     * @return {?}
     */
    set disabled(value) {
        /** @type {?} */
        const newValue = coerceBooleanProperty(value);
        if (newValue !== this._disabled) {
            this._disabled = newValue;
            this._toggleNativeDragInteractions();
        }
    }
    /**
     * Returns the element that is being used as a placeholder
     * while the current element is being dragged.
     * @return {?}
     */
    getPlaceholderElement() {
        return this._placeholder;
    }
    /**
     * Returns the root draggable element.
     * @return {?}
     */
    getRootElement() {
        return this._rootElement;
    }
    /**
     * Registers the handles that can be used to drag the element.
     * @template THIS
     * @this {THIS}
     * @param {?} handles
     * @return {THIS}
     */
    withHandles(handles) {
        (/** @type {?} */ (this))._handles = handles.map((/**
         * @param {?} handle
         * @return {?}
         */
        handle => coerceElement(handle)));
        (/** @type {?} */ (this))._handles.forEach((/**
         * @param {?} handle
         * @return {?}
         */
        handle => toggleNativeDragInteractions(handle, false)));
        (/** @type {?} */ (this))._toggleNativeDragInteractions();
        return (/** @type {?} */ (this));
    }
    /**
     * Registers the template that should be used for the drag preview.
     * @template THIS
     * @this {THIS}
     * @param {?} template Template that from which to stamp out the preview.
     * @return {THIS}
     */
    withPreviewTemplate(template) {
        (/** @type {?} */ (this))._previewTemplate = template;
        return (/** @type {?} */ (this));
    }
    /**
     * Registers the template that should be used for the drag placeholder.
     * @template THIS
     * @this {THIS}
     * @param {?} template Template that from which to stamp out the placeholder.
     * @return {THIS}
     */
    withPlaceholderTemplate(template) {
        (/** @type {?} */ (this))._placeholderTemplate = template;
        return (/** @type {?} */ (this));
    }
    /**
     * Sets an alternate drag root element. The root element is the element that will be moved as
     * the user is dragging. Passing an alternate root element is useful when trying to enable
     * dragging on an element that you might not have access to.
     * @template THIS
     * @this {THIS}
     * @param {?} rootElement
     * @return {THIS}
     */
    withRootElement(rootElement) {
        /** @type {?} */
        const element = coerceElement(rootElement);
        if (element !== (/** @type {?} */ (this))._rootElement) {
            if ((/** @type {?} */ (this))._rootElement) {
                (/** @type {?} */ (this))._removeRootElementListeners((/** @type {?} */ (this))._rootElement);
            }
            element.addEventListener('mousedown', (/** @type {?} */ (this))._pointerDown, activeEventListenerOptions);
            element.addEventListener('touchstart', (/** @type {?} */ (this))._pointerDown, passiveEventListenerOptions);
            (/** @type {?} */ (this))._initialTransform = undefined;
            (/** @type {?} */ (this))._rootElement = element;
        }
        return (/** @type {?} */ (this));
    }
    /**
     * Element to which the draggable's position will be constrained.
     * @template THIS
     * @this {THIS}
     * @param {?} boundaryElement
     * @return {THIS}
     */
    withBoundaryElement(boundaryElement) {
        (/** @type {?} */ (this))._boundaryElement = boundaryElement ? coerceElement(boundaryElement) : null;
        (/** @type {?} */ (this))._resizeSubscription.unsubscribe();
        if (boundaryElement) {
            (/** @type {?} */ (this))._resizeSubscription = (/** @type {?} */ (this))._viewportRuler
                .change(10)
                .subscribe((/**
             * @return {?}
             */
            () => (/** @type {?} */ (this))._containInsideBoundaryOnResize()));
        }
        return (/** @type {?} */ (this));
    }
    /**
     * Removes the dragging functionality from the DOM element.
     * @return {?}
     */
    dispose() {
        this._removeRootElementListeners(this._rootElement);
        // Do this check before removing from the registry since it'll
        // stop being considered as dragged once it is removed.
        if (this.isDragging()) {
            // Since we move out the element to the end of the body while it's being
            // dragged, we have to make sure that it's removed if it gets destroyed.
            removeElement(this._rootElement);
        }
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
        this._boundaryElement = this._rootElement = this._placeholderTemplate =
            this._previewTemplate = this._nextSibling = (/** @type {?} */ (null));
    }
    /**
     * Checks whether the element is currently being dragged.
     * @return {?}
     */
    isDragging() {
        return this._hasStartedDragging && this._dragDropRegistry.isDragging(this);
    }
    /**
     * Resets a standalone drag item to its initial position.
     * @return {?}
     */
    reset() {
        this._rootElement.style.transform = this._initialTransform || '';
        this._activeTransform = { x: 0, y: 0 };
        this._passiveTransform = { x: 0, y: 0 };
    }
    /**
     * Sets a handle as disabled. While a handle is disabled, it'll capture and interrupt dragging.
     * @param {?} handle Handle element that should be disabled.
     * @return {?}
     */
    disableHandle(handle) {
        if (this._handles.indexOf(handle) > -1) {
            this._disabledHandles.add(handle);
        }
    }
    /**
     * Enables a handle, if it has been disabled.
     * @param {?} handle Handle element to be enabled.
     * @return {?}
     */
    enableHandle(handle) {
        this._disabledHandles.delete(handle);
    }
    /**
     * Sets the layout direction of the draggable item.
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
     * Sets the container that the item is part of.
     * @param {?} container
     * @return {?}
     */
    _withDropContainer(container) {
        this._dropContainer = container;
    }
    /**
     * Gets the current position in pixels the draggable outside of a drop container.
     * @return {?}
     */
    getFreeDragPosition() {
        /** @type {?} */
        const position = this.isDragging() ? this._activeTransform : this._passiveTransform;
        return { x: position.x, y: position.y };
    }
    /**
     * Sets the current position in pixels the draggable outside of a drop container.
     * @template THIS
     * @this {THIS}
     * @param {?} value New position to be set.
     * @return {THIS}
     */
    setFreeDragPosition(value) {
        (/** @type {?} */ (this))._activeTransform = { x: 0, y: 0 };
        (/** @type {?} */ (this))._passiveTransform.x = value.x;
        (/** @type {?} */ (this))._passiveTransform.y = value.y;
        if (!(/** @type {?} */ (this))._dropContainer) {
            (/** @type {?} */ (this))._applyRootElementTransform(value.x, value.y);
        }
        return (/** @type {?} */ (this));
    }
    /**
     * Updates the item's sort order based on the last-known pointer position.
     * @return {?}
     */
    _sortFromLastPointerPosition() {
        /** @type {?} */
        const position = this._pointerPositionAtLastDirectionChange;
        if (position && this._dropContainer) {
            this._updateActiveDropContainer(position);
        }
    }
    /**
     * Unsubscribes from the global subscriptions.
     * @private
     * @return {?}
     */
    _removeSubscriptions() {
        this._pointerMoveSubscription.unsubscribe();
        this._pointerUpSubscription.unsubscribe();
        this._scrollSubscription.unsubscribe();
    }
    /**
     * Destroys the preview element and its ViewRef.
     * @private
     * @return {?}
     */
    _destroyPreview() {
        if (this._preview) {
            removeElement(this._preview);
        }
        if (this._previewRef) {
            this._previewRef.destroy();
        }
        this._preview = this._previewRef = (/** @type {?} */ (null));
    }
    /**
     * Destroys the placeholder element and its ViewRef.
     * @private
     * @return {?}
     */
    _destroyPlaceholder() {
        if (this._placeholder) {
            removeElement(this._placeholder);
        }
        if (this._placeholderRef) {
            this._placeholderRef.destroy();
        }
        this._placeholder = this._placeholderRef = (/** @type {?} */ (null));
    }
    /**
     * Clears subscriptions and stops the dragging sequence.
     * @private
     * @param {?} event Browser event object that ended the sequence.
     * @return {?}
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
            this._animatePreviewToPlaceholder().then((/**
             * @return {?}
             */
            () => {
                this._cleanupDragArtifacts(event);
                this._cleanupCachedDimensions();
                this._dragDropRegistry.stopDragging(this);
            }));
        }
        else {
            // Convert the active transform into a passive one. This means that next time
            // the user starts dragging the item, its position will be calculated relatively
            // to the new passive transform.
            this._passiveTransform.x = this._activeTransform.x;
            this._passiveTransform.y = this._activeTransform.y;
            this._ngZone.run((/**
             * @return {?}
             */
            () => {
                this.ended.next({
                    source: this,
                    distance: this._getDragDistance(this._getPointerPositionOnPage(event))
                });
            }));
            this._cleanupCachedDimensions();
            this._dragDropRegistry.stopDragging(this);
        }
    }
    /**
     * Starts the dragging sequence.
     * @private
     * @param {?} event
     * @return {?}
     */
    _startDragSequence(event) {
        // Emit the event on the item before the one on the container.
        this.started.next({ source: this });
        if (isTouchEvent(event)) {
            this._lastTouchEventTime = Date.now();
        }
        this._toggleNativeDragInteractions();
        if (this._dropContainer) {
            /** @type {?} */
            const element = this._rootElement;
            // Grab the `nextSibling` before the preview and placeholder
            // have been created so we don't get the preview by accident.
            this._nextSibling = element.nextSibling;
            /** @type {?} */
            const preview = this._preview = this._createPreviewElement();
            /** @type {?} */
            const placeholder = this._placeholder = this._createPlaceholderElement();
            // We move the element out at the end of the body and we make it hidden, because keeping it in
            // place will throw off the consumer's `:last-child` selectors. We can't remove the element
            // from the DOM completely, because iOS will stop firing all subsequent events in the chain.
            element.style.display = 'none';
            this._document.body.appendChild((/** @type {?} */ (element.parentNode)).replaceChild(placeholder, element));
            getPreviewInsertionPoint(this._document).appendChild(preview);
            this._dropContainer.start();
        }
    }
    /**
     * Sets up the different variables and subscriptions
     * that will be necessary for the dragging sequence.
     * @private
     * @param {?} referenceElement Element that started the drag sequence.
     * @param {?} event Browser event object that started the sequence.
     * @return {?}
     */
    _initializeDragSequence(referenceElement, event) {
        // Always stop propagation for the event that initializes
        // the dragging sequence, in order to prevent it from potentially
        // starting another sequence for a draggable parent somewhere up the DOM tree.
        event.stopPropagation();
        /** @type {?} */
        const isDragging = this.isDragging();
        /** @type {?} */
        const isTouchSequence = isTouchEvent(event);
        /** @type {?} */
        const isAuxiliaryMouseButton = !isTouchSequence && ((/** @type {?} */ (event))).button !== 0;
        /** @type {?} */
        const rootElement = this._rootElement;
        /** @type {?} */
        const isSyntheticEvent = !isTouchSequence && this._lastTouchEventTime &&
            this._lastTouchEventTime + MOUSE_EVENT_IGNORE_TIME > Date.now();
        // If the event started from an element with the native HTML drag&drop, it'll interfere
        // with our own dragging (e.g. `img` tags do it by default). Prevent the default action
        // to stop it from happening. Note that preventing on `dragstart` also seems to work, but
        // it's flaky and it fails if the user drags it away quickly. Also note that we only want
        // to do this for `mousedown` since doing the same for `touchstart` will stop any `click`
        // events from firing on touch devices.
        if (event.target && ((/** @type {?} */ (event.target))).draggable && event.type === 'mousedown') {
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
            this._rootElementTapHighlight = rootElement.style.webkitTapHighlightColor;
            rootElement.style.webkitTapHighlightColor = 'transparent';
        }
        this._hasStartedDragging = this._hasMoved = false;
        this._initialContainer = (/** @type {?} */ (this._dropContainer));
        // Avoid multiple subscriptions and memory leaks when multi touch
        // (isDragging check above isn't enough because of possible temporal and/or dimensional delays)
        this._removeSubscriptions();
        this._pointerMoveSubscription = this._dragDropRegistry.pointerMove.subscribe(this._pointerMove);
        this._pointerUpSubscription = this._dragDropRegistry.pointerUp.subscribe(this._pointerUp);
        this._scrollSubscription = this._dragDropRegistry.scroll.pipe(startWith(null)).subscribe((/**
         * @return {?}
         */
        () => {
            this._scrollPosition = this._viewportRuler.getViewportScrollPosition();
        }));
        if (this._boundaryElement) {
            this._boundaryRect = this._boundaryElement.getBoundingClientRect();
        }
        // If we have a custom preview template, the element won't be visible anyway so we avoid the
        // extra `getBoundingClientRect` calls and just move the preview next to the cursor.
        this._pickupPositionInElement = this._previewTemplate && this._previewTemplate.template ?
            { x: 0, y: 0 } :
            this._getPointerPositionInElement(referenceElement, event);
        /** @type {?} */
        const pointerPosition = this._pickupPositionOnPage = this._getPointerPositionOnPage(event);
        this._pointerDirectionDelta = { x: 0, y: 0 };
        this._pointerPositionAtLastDirectionChange = { x: pointerPosition.x, y: pointerPosition.y };
        this._dragStartTime = Date.now();
        this._dragDropRegistry.startDragging(this, event);
    }
    /**
     * Cleans up the DOM artifacts that were added to facilitate the element being dragged.
     * @private
     * @param {?} event
     * @return {?}
     */
    _cleanupDragArtifacts(event) {
        // Restore the element's visibility and insert it at its old position in the DOM.
        // It's important that we maintain the position, because moving the element around in the DOM
        // can throw off `NgFor` which does smart diffing and re-creates elements only when necessary,
        // while moving the existing elements in all other cases.
        this._rootElement.style.display = '';
        if (this._nextSibling) {
            (/** @type {?} */ (this._nextSibling.parentNode)).insertBefore(this._rootElement, this._nextSibling);
        }
        else {
            coerceElement(this._initialContainer.element).appendChild(this._rootElement);
        }
        this._destroyPreview();
        this._destroyPlaceholder();
        this._boundaryRect = this._previewRect = undefined;
        // Re-enter the NgZone since we bound `document` events on the outside.
        this._ngZone.run((/**
         * @return {?}
         */
        () => {
            /** @type {?} */
            const container = (/** @type {?} */ (this._dropContainer));
            /** @type {?} */
            const currentIndex = container.getItemIndex(this);
            /** @type {?} */
            const pointerPosition = this._getPointerPositionOnPage(event);
            /** @type {?} */
            const distance = this._getDragDistance(this._getPointerPositionOnPage(event));
            /** @type {?} */
            const isPointerOverContainer = container._isOverContainer(pointerPosition.x, pointerPosition.y);
            this.ended.next({ source: this, distance });
            this.dropped.next({
                item: this,
                currentIndex,
                previousIndex: this._initialContainer.getItemIndex(this),
                container: container,
                previousContainer: this._initialContainer,
                isPointerOverContainer,
                distance
            });
            container.drop(this, currentIndex, this._initialContainer, isPointerOverContainer, distance);
            this._dropContainer = this._initialContainer;
        }));
    }
    /**
     * Updates the item's position in its drop container, or moves it
     * into a new one, depending on its current drag position.
     * @private
     * @param {?} __0
     * @return {?}
     */
    _updateActiveDropContainer({ x, y }) {
        // Drop container that draggable has been moved into.
        /** @type {?} */
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
            this._ngZone.run((/**
             * @return {?}
             */
            () => {
                // Notify the old container that the item has left.
                this.exited.next({ item: this, container: (/** @type {?} */ (this._dropContainer)) });
                (/** @type {?} */ (this._dropContainer)).exit(this);
                // Notify the new container that the item has entered.
                this._dropContainer = (/** @type {?} */ (newContainer));
                this._dropContainer.enter(this, x, y);
                this.entered.next({
                    item: this,
                    container: (/** @type {?} */ (newContainer)),
                    currentIndex: (/** @type {?} */ (newContainer)).getItemIndex(this)
                });
            }));
        }
        (/** @type {?} */ (this._dropContainer))._startScrollingIfNecessary(x, y);
        (/** @type {?} */ (this._dropContainer))._sortItem(this, x, y, this._pointerDirectionDelta);
        this._preview.style.transform =
            getTransform(x - this._pickupPositionInElement.x, y - this._pickupPositionInElement.y);
    }
    /**
     * Creates the element that will be rendered next to the user's pointer
     * and will be used as a preview of the element that is being dragged.
     * @private
     * @return {?}
     */
    _createPreviewElement() {
        /** @type {?} */
        const previewConfig = this._previewTemplate;
        /** @type {?} */
        const previewClass = this.previewClass;
        /** @type {?} */
        const previewTemplate = previewConfig ? previewConfig.template : null;
        /** @type {?} */
        let preview;
        if (previewTemplate) {
            /** @type {?} */
            const viewRef = (/** @type {?} */ (previewConfig)).viewContainer.createEmbeddedView(previewTemplate, (/** @type {?} */ (previewConfig)).context);
            preview = getRootNode(viewRef, this._document);
            this._previewRef = viewRef;
            preview.style.transform =
                getTransform(this._pickupPositionOnPage.x, this._pickupPositionOnPage.y);
        }
        else {
            /** @type {?} */
            const element = this._rootElement;
            /** @type {?} */
            const elementRect = element.getBoundingClientRect();
            preview = deepCloneNode(element);
            preview.style.width = `${elementRect.width}px`;
            preview.style.height = `${elementRect.height}px`;
            preview.style.transform = getTransform(elementRect.left, elementRect.top);
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
            zIndex: '1000'
        });
        toggleNativeDragInteractions(preview, false);
        preview.classList.add('cdk-drag-preview');
        preview.setAttribute('dir', this._direction);
        if (previewClass) {
            if (Array.isArray(previewClass)) {
                previewClass.forEach((/**
                 * @param {?} className
                 * @return {?}
                 */
                className => preview.classList.add(className)));
            }
            else {
                preview.classList.add(previewClass);
            }
        }
        return preview;
    }
    /**
     * Animates the preview element from its current position to the location of the drop placeholder.
     * @private
     * @return {?} Promise that resolves when the animation completes.
     */
    _animatePreviewToPlaceholder() {
        // If the user hasn't moved yet, the transitionend event won't fire.
        if (!this._hasMoved) {
            return Promise.resolve();
        }
        /** @type {?} */
        const placeholderRect = this._placeholder.getBoundingClientRect();
        // Apply the class that adds a transition to the preview.
        this._preview.classList.add('cdk-drag-animating');
        // Move the preview to the placeholder position.
        this._preview.style.transform = getTransform(placeholderRect.left, placeholderRect.top);
        // If the element doesn't have a `transition`, the `transitionend` event won't fire. Since
        // we need to trigger a style recalculation in order for the `cdk-drag-animating` class to
        // apply its style, we take advantage of the available info to figure out whether we need to
        // bind the event in the first place.
        /** @type {?} */
        const duration = getTransformTransitionDurationInMs(this._preview);
        if (duration === 0) {
            return Promise.resolve();
        }
        return this._ngZone.runOutsideAngular((/**
         * @return {?}
         */
        () => {
            return new Promise((/**
             * @param {?} resolve
             * @return {?}
             */
            resolve => {
                /** @type {?} */
                const handler = (/** @type {?} */ (((/**
                 * @param {?} event
                 * @return {?}
                 */
                (event) => {
                    if (!event || (event.target === this._preview && event.propertyName === 'transform')) {
                        this._preview.removeEventListener('transitionend', handler);
                        resolve();
                        clearTimeout(timeout);
                    }
                }))));
                // If a transition is short enough, the browser might not fire the `transitionend` event.
                // Since we know how long it's supposed to take, add a timeout with a 50% buffer that'll
                // fire if the transition hasn't completed when it was supposed to.
                /** @type {?} */
                const timeout = setTimeout((/** @type {?} */ (handler)), duration * 1.5);
                this._preview.addEventListener('transitionend', handler);
            }));
        }));
    }
    /**
     * Creates an element that will be shown instead of the current element while dragging.
     * @private
     * @return {?}
     */
    _createPlaceholderElement() {
        /** @type {?} */
        const placeholderConfig = this._placeholderTemplate;
        /** @type {?} */
        const placeholderTemplate = placeholderConfig ? placeholderConfig.template : null;
        /** @type {?} */
        let placeholder;
        if (placeholderTemplate) {
            this._placeholderRef = (/** @type {?} */ (placeholderConfig)).viewContainer.createEmbeddedView(placeholderTemplate, (/** @type {?} */ (placeholderConfig)).context);
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
     * @private
     * @param {?} referenceElement Element that initiated the dragging.
     * @param {?} event Event that initiated the dragging.
     * @return {?}
     */
    _getPointerPositionInElement(referenceElement, event) {
        /** @type {?} */
        const elementRect = this._rootElement.getBoundingClientRect();
        /** @type {?} */
        const handleElement = referenceElement === this._rootElement ? null : referenceElement;
        /** @type {?} */
        const referenceRect = handleElement ? handleElement.getBoundingClientRect() : elementRect;
        /** @type {?} */
        const point = isTouchEvent(event) ? event.targetTouches[0] : event;
        /** @type {?} */
        const x = point.pageX - referenceRect.left - this._scrollPosition.left;
        /** @type {?} */
        const y = point.pageY - referenceRect.top - this._scrollPosition.top;
        return {
            x: referenceRect.left - elementRect.left + x,
            y: referenceRect.top - elementRect.top + y
        };
    }
    /**
     * Determines the point of the page that was touched by the user.
     * @private
     * @param {?} event
     * @return {?}
     */
    _getPointerPositionOnPage(event) {
        // `touches` will be empty for start/end events so we have to fall back to `changedTouches`.
        /** @type {?} */
        const point = isTouchEvent(event) ? (event.touches[0] || event.changedTouches[0]) : event;
        return {
            x: point.pageX - this._scrollPosition.left,
            y: point.pageY - this._scrollPosition.top
        };
    }
    /**
     * Gets the pointer position on the page, accounting for any position constraints.
     * @private
     * @param {?} event
     * @return {?}
     */
    _getConstrainedPointerPosition(event) {
        /** @type {?} */
        const point = this._getPointerPositionOnPage(event);
        /** @type {?} */
        const constrainedPoint = this.constrainPosition ? this.constrainPosition(point, this) : point;
        /** @type {?} */
        const dropContainerLock = this._dropContainer ? this._dropContainer.lockAxis : null;
        if (this.lockAxis === 'x' || dropContainerLock === 'x') {
            constrainedPoint.y = this._pickupPositionOnPage.y;
        }
        else if (this.lockAxis === 'y' || dropContainerLock === 'y') {
            constrainedPoint.x = this._pickupPositionOnPage.x;
        }
        if (this._boundaryRect) {
            const { x: pickupX, y: pickupY } = this._pickupPositionInElement;
            /** @type {?} */
            const boundaryRect = this._boundaryRect;
            /** @type {?} */
            const previewRect = (/** @type {?} */ (this._previewRect));
            /** @type {?} */
            const minY = boundaryRect.top + pickupY;
            /** @type {?} */
            const maxY = boundaryRect.bottom - (previewRect.height - pickupY);
            /** @type {?} */
            const minX = boundaryRect.left + pickupX;
            /** @type {?} */
            const maxX = boundaryRect.right - (previewRect.width - pickupX);
            constrainedPoint.x = clamp(constrainedPoint.x, minX, maxX);
            constrainedPoint.y = clamp(constrainedPoint.y, minY, maxY);
        }
        return constrainedPoint;
    }
    /**
     * Updates the current drag delta, based on the user's current pointer position on the page.
     * @private
     * @param {?} pointerPositionOnPage
     * @return {?}
     */
    _updatePointerDirectionDelta(pointerPositionOnPage) {
        const { x, y } = pointerPositionOnPage;
        /** @type {?} */
        const delta = this._pointerDirectionDelta;
        /** @type {?} */
        const positionSinceLastChange = this._pointerPositionAtLastDirectionChange;
        // Amount of pixels the user has dragged since the last time the direction changed.
        /** @type {?} */
        const changeX = Math.abs(x - positionSinceLastChange.x);
        /** @type {?} */
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
    /**
     * Toggles the native drag interactions, based on how many handles are registered.
     * @private
     * @return {?}
     */
    _toggleNativeDragInteractions() {
        if (!this._rootElement || !this._handles) {
            return;
        }
        /** @type {?} */
        const shouldEnable = this._handles.length > 0 || !this.isDragging();
        if (shouldEnable !== this._nativeInteractionsEnabled) {
            this._nativeInteractionsEnabled = shouldEnable;
            toggleNativeDragInteractions(this._rootElement, shouldEnable);
        }
    }
    /**
     * Removes the manually-added event listeners from the root element.
     * @private
     * @param {?} element
     * @return {?}
     */
    _removeRootElementListeners(element) {
        element.removeEventListener('mousedown', this._pointerDown, activeEventListenerOptions);
        element.removeEventListener('touchstart', this._pointerDown, passiveEventListenerOptions);
    }
    /**
     * Applies a `transform` to the root element, taking into account any existing transforms on it.
     * @private
     * @param {?} x New transform value along the X axis.
     * @param {?} y New transform value along the Y axis.
     * @return {?}
     */
    _applyRootElementTransform(x, y) {
        /** @type {?} */
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
     * @private
     * @param {?} currentPosition Current position of the user's pointer.
     * @return {?}
     */
    _getDragDistance(currentPosition) {
        /** @type {?} */
        const pickupPosition = this._pickupPositionOnPage;
        if (pickupPosition) {
            return { x: currentPosition.x - pickupPosition.x, y: currentPosition.y - pickupPosition.y };
        }
        return { x: 0, y: 0 };
    }
    /**
     * Cleans up any cached element dimensions that we don't need after dragging has stopped.
     * @private
     * @return {?}
     */
    _cleanupCachedDimensions() {
        this._boundaryRect = this._previewRect = undefined;
    }
    /**
     * Checks whether the element is still inside its boundary after the viewport has been resized.
     * If not, the position is adjusted so that the element fits again.
     * @private
     * @return {?}
     */
    _containInsideBoundaryOnResize() {
        let { x, y } = this._passiveTransform;
        if ((x === 0 && y === 0) || this.isDragging() || !this._boundaryElement) {
            return;
        }
        /** @type {?} */
        const boundaryRect = this._boundaryElement.getBoundingClientRect();
        /** @type {?} */
        const elementRect = this._rootElement.getBoundingClientRect();
        // It's possible that the element got hidden away after dragging (e.g. by switching to a
        // different tab). Don't do anything in this case so we don't clear the user's position.
        if ((boundaryRect.width === 0 && boundaryRect.height === 0) ||
            (elementRect.width === 0 && elementRect.height === 0)) {
            return;
        }
        /** @type {?} */
        const leftOverflow = boundaryRect.left - elementRect.left;
        /** @type {?} */
        const rightOverflow = elementRect.right - boundaryRect.right;
        /** @type {?} */
        const topOverflow = boundaryRect.top - elementRect.top;
        /** @type {?} */
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
    /**
     * Gets the drag start delay, based on the event type.
     * @private
     * @param {?} event
     * @return {?}
     */
    _getDragStartDelay(event) {
        /** @type {?} */
        const value = this.dragStartDelay;
        if (typeof value === 'number') {
            return value;
        }
        else if (isTouchEvent(event)) {
            return value.touch;
        }
        return value ? value.mouse : 0;
    }
}
if (false) {
    /**
     * Element displayed next to the user's pointer while the element is dragged.
     * @type {?}
     * @private
     */
    DragRef.prototype._preview;
    /**
     * Reference to the view of the preview element.
     * @type {?}
     * @private
     */
    DragRef.prototype._previewRef;
    /**
     * Reference to the view of the placeholder element.
     * @type {?}
     * @private
     */
    DragRef.prototype._placeholderRef;
    /**
     * Element that is rendered instead of the draggable item while it is being sorted.
     * @type {?}
     * @private
     */
    DragRef.prototype._placeholder;
    /**
     * Coordinates within the element at which the user picked up the element.
     * @type {?}
     * @private
     */
    DragRef.prototype._pickupPositionInElement;
    /**
     * Coordinates on the page at which the user picked up the element.
     * @type {?}
     * @private
     */
    DragRef.prototype._pickupPositionOnPage;
    /**
     * Reference to the element that comes after the draggable in the DOM, at the time
     * it was picked up. Used for restoring its initial position when it's dropped.
     * @type {?}
     * @private
     */
    DragRef.prototype._nextSibling;
    /**
     * CSS `transform` applied to the element when it isn't being dragged. We need a
     * passive transform in order for the dragged element to retain its new position
     * after the user has stopped dragging and because we need to know the relative
     * position in case they start dragging again. This corresponds to `element.style.transform`.
     * @type {?}
     * @private
     */
    DragRef.prototype._passiveTransform;
    /**
     * CSS `transform` that is applied to the element while it's being dragged.
     * @type {?}
     * @private
     */
    DragRef.prototype._activeTransform;
    /**
     * Inline `transform` value that the element had before the first dragging sequence.
     * @type {?}
     * @private
     */
    DragRef.prototype._initialTransform;
    /**
     * Whether the dragging sequence has been started. Doesn't
     * necessarily mean that the element has been moved.
     * @type {?}
     * @private
     */
    DragRef.prototype._hasStartedDragging;
    /**
     * Whether the element has moved since the user started dragging it.
     * @type {?}
     * @private
     */
    DragRef.prototype._hasMoved;
    /**
     * Drop container in which the DragRef resided when dragging began.
     * @type {?}
     * @private
     */
    DragRef.prototype._initialContainer;
    /**
     * Cached scroll position on the page when the element was picked up.
     * @type {?}
     * @private
     */
    DragRef.prototype._scrollPosition;
    /**
     * Emits when the item is being moved.
     * @type {?}
     * @private
     */
    DragRef.prototype._moveEvents;
    /**
     * Keeps track of the direction in which the user is dragging along each axis.
     * @type {?}
     * @private
     */
    DragRef.prototype._pointerDirectionDelta;
    /**
     * Pointer position at which the last change in the delta occurred.
     * @type {?}
     * @private
     */
    DragRef.prototype._pointerPositionAtLastDirectionChange;
    /**
     * Root DOM node of the drag instance. This is the element that will
     * be moved around as the user is dragging.
     * @type {?}
     * @private
     */
    DragRef.prototype._rootElement;
    /**
     * Inline style value of `-webkit-tap-highlight-color` at the time the
     * dragging was started. Used to restore the value once we're done dragging.
     * @type {?}
     * @private
     */
    DragRef.prototype._rootElementTapHighlight;
    /**
     * Subscription to pointer movement events.
     * @type {?}
     * @private
     */
    DragRef.prototype._pointerMoveSubscription;
    /**
     * Subscription to the event that is dispatched when the user lifts their pointer.
     * @type {?}
     * @private
     */
    DragRef.prototype._pointerUpSubscription;
    /**
     * Subscription to the viewport being scrolled.
     * @type {?}
     * @private
     */
    DragRef.prototype._scrollSubscription;
    /**
     * Subscription to the viewport being resized.
     * @type {?}
     * @private
     */
    DragRef.prototype._resizeSubscription;
    /**
     * Time at which the last touch event occurred. Used to avoid firing the same
     * events multiple times on touch devices where the browser will fire a fake
     * mouse event for each touch event, after a certain time.
     * @type {?}
     * @private
     */
    DragRef.prototype._lastTouchEventTime;
    /**
     * Time at which the last dragging sequence was started.
     * @type {?}
     * @private
     */
    DragRef.prototype._dragStartTime;
    /**
     * Cached reference to the boundary element.
     * @type {?}
     * @private
     */
    DragRef.prototype._boundaryElement;
    /**
     * Whether the native dragging interactions have been enabled on the root element.
     * @type {?}
     * @private
     */
    DragRef.prototype._nativeInteractionsEnabled;
    /**
     * Cached dimensions of the preview element.
     * @type {?}
     * @private
     */
    DragRef.prototype._previewRect;
    /**
     * Cached dimensions of the boundary element.
     * @type {?}
     * @private
     */
    DragRef.prototype._boundaryRect;
    /**
     * Element that will be used as a template to create the draggable item's preview.
     * @type {?}
     * @private
     */
    DragRef.prototype._previewTemplate;
    /**
     * Template for placeholder element rendered to show where a draggable would be dropped.
     * @type {?}
     * @private
     */
    DragRef.prototype._placeholderTemplate;
    /**
     * Elements that can be used to drag the draggable item.
     * @type {?}
     * @private
     */
    DragRef.prototype._handles;
    /**
     * Registered handles that are currently disabled.
     * @type {?}
     * @private
     */
    DragRef.prototype._disabledHandles;
    /**
     * Droppable container that the draggable is a part of.
     * @type {?}
     * @private
     */
    DragRef.prototype._dropContainer;
    /**
     * Layout direction of the item.
     * @type {?}
     * @private
     */
    DragRef.prototype._direction;
    /**
     * Axis along which dragging is locked.
     * @type {?}
     */
    DragRef.prototype.lockAxis;
    /**
     * Amount of milliseconds to wait after the user has put their
     * pointer down before starting to drag the element.
     * @type {?}
     */
    DragRef.prototype.dragStartDelay;
    /**
     * Class to be added to the preview element.
     * @type {?}
     */
    DragRef.prototype.previewClass;
    /**
     * @type {?}
     * @private
     */
    DragRef.prototype._disabled;
    /**
     * Emits as the drag sequence is being prepared.
     * @type {?}
     */
    DragRef.prototype.beforeStarted;
    /**
     * Emits when the user starts dragging the item.
     * @type {?}
     */
    DragRef.prototype.started;
    /**
     * Emits when the user has released a drag item, before any animations have started.
     * @type {?}
     */
    DragRef.prototype.released;
    /**
     * Emits when the user stops dragging an item in the container.
     * @type {?}
     */
    DragRef.prototype.ended;
    /**
     * Emits when the user has moved the item into a new container.
     * @type {?}
     */
    DragRef.prototype.entered;
    /**
     * Emits when the user removes the item its container by dragging it into another container.
     * @type {?}
     */
    DragRef.prototype.exited;
    /**
     * Emits when the user drops the item inside a container.
     * @type {?}
     */
    DragRef.prototype.dropped;
    /**
     * Emits as the user is dragging the item. Use with caution,
     * because this event will fire for every pixel that the user has dragged.
     * @type {?}
     */
    DragRef.prototype.moved;
    /**
     * Arbitrary data that can be attached to the drag item.
     * @type {?}
     */
    DragRef.prototype.data;
    /**
     * Function that can be used to customize the logic of how the position of the drag item
     * is limited while it's being dragged. Gets called with a point containing the current position
     * of the user's pointer on the page and should return a point describing where the item should
     * be rendered.
     * @type {?}
     */
    DragRef.prototype.constrainPosition;
    /**
     * Handler for the `mousedown`/`touchstart` events.
     * @type {?}
     * @private
     */
    DragRef.prototype._pointerDown;
    /**
     * Handler that is invoked when the user moves their pointer after they've initiated a drag.
     * @type {?}
     * @private
     */
    DragRef.prototype._pointerMove;
    /**
     * Handler that is invoked when the user lifts their pointer up, after initiating a drag.
     * @type {?}
     * @private
     */
    DragRef.prototype._pointerUp;
    /**
     * @type {?}
     * @private
     */
    DragRef.prototype._config;
    /**
     * @type {?}
     * @private
     */
    DragRef.prototype._document;
    /**
     * @type {?}
     * @private
     */
    DragRef.prototype._ngZone;
    /**
     * @type {?}
     * @private
     */
    DragRef.prototype._viewportRuler;
    /**
     * @type {?}
     * @private
     */
    DragRef.prototype._dragDropRegistry;
}
/**
 * Point on the page or within an element.
 * @record
 */
export function Point() { }
if (false) {
    /** @type {?} */
    Point.prototype.x;
    /** @type {?} */
    Point.prototype.y;
}
/**
 * Gets a 3d `transform` that can be applied to an element.
 * @param {?} x Desired position of the element along the X axis.
 * @param {?} y Desired position of the element along the Y axis.
 * @return {?}
 */
function getTransform(x, y) {
    // Round the transforms since some browsers will
    // blur the elements for sub-pixel transforms.
    return `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
}
/**
 * Creates a deep clone of an element.
 * @param {?} node
 * @return {?}
 */
function deepCloneNode(node) {
    /** @type {?} */
    const clone = (/** @type {?} */ (node.cloneNode(true)));
    /** @type {?} */
    const descendantsWithId = clone.querySelectorAll('[id]');
    /** @type {?} */
    const descendantCanvases = node.querySelectorAll('canvas');
    // Remove the `id` to avoid having multiple elements with the same id on the page.
    clone.removeAttribute('id');
    for (let i = 0; i < descendantsWithId.length; i++) {
        descendantsWithId[i].removeAttribute('id');
    }
    // `cloneNode` won't transfer the content of `canvas` elements so we have to do it ourselves.
    // We match up the cloned canvas to their sources using their index in the DOM.
    if (descendantCanvases.length) {
        /** @type {?} */
        const cloneCanvases = clone.querySelectorAll('canvas');
        for (let i = 0; i < descendantCanvases.length; i++) {
            /** @type {?} */
            const correspondingCloneContext = cloneCanvases[i].getContext('2d');
            if (correspondingCloneContext) {
                correspondingCloneContext.drawImage(descendantCanvases[i], 0, 0);
            }
        }
    }
    return clone;
}
/**
 * Clamps a value between a minimum and a maximum.
 * @param {?} value
 * @param {?} min
 * @param {?} max
 * @return {?}
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
/**
 * Helper to remove an element from the DOM and to do all the necessary null checks.
 * @param {?} element Element to be removed.
 * @return {?}
 */
function removeElement(element) {
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
}
/**
 * Determines whether an event is a touch event.
 * @param {?} event
 * @return {?}
 */
function isTouchEvent(event) {
    // This function is called for every pixel that the user has dragged so we need it to be
    // as fast as possible. Since we only bind mouse events and touch events, we can assume
    // that if the event's name starts with `t`, it's a touch event.
    return event.type[0] === 't';
}
/**
 * Gets the element into which the drag preview should be inserted.
 * @param {?} documentRef
 * @return {?}
 */
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
 * @param {?} viewRef
 * @param {?} _document
 * @return {?}
 */
function getRootNode(viewRef, _document) {
    /** @type {?} */
    const rootNode = viewRef.rootNodes[0];
    if (rootNode.nodeType !== _document.ELEMENT_NODE) {
        /** @type {?} */
        const wrapper = _document.createElement('div');
        wrapper.appendChild(rootNode);
        return wrapper;
    }
    return (/** @type {?} */ (rootNode));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2RyYWctZHJvcC9kcmFnLXJlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFXQSxPQUFPLEVBQUMsK0JBQStCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN0RSxPQUFPLEVBQUMscUJBQXFCLEVBQUUsYUFBYSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDM0UsT0FBTyxFQUFDLFlBQVksRUFBRSxPQUFPLEVBQWEsTUFBTSxNQUFNLENBQUM7QUFDdkQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBR3pDLE9BQU8sRUFBQyxZQUFZLEVBQUUsNEJBQTRCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUMxRSxPQUFPLEVBQUMsa0NBQWtDLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQzs7Ozs7QUFHekUsbUNBWUM7Ozs7Ozs7SUFQQywyQ0FBMkI7Ozs7OztJQU0zQix3REFBd0M7Ozs7OztNQUlwQywyQkFBMkIsR0FBRywrQkFBK0IsQ0FBQyxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUMsQ0FBQzs7Ozs7TUFHOUUsMEJBQTBCLEdBQUcsK0JBQStCLENBQUMsRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFDLENBQUM7Ozs7Ozs7O01BUTlFLHVCQUF1QixHQUFHLEdBQUc7Ozs7Ozs7QUFVbkMscUNBQW1EOzs7Ozs7QUFHbkQsaUNBSUM7OztJQUhDLHNDQUFnQzs7SUFDaEMsMkNBQWdDOztJQUNoQyxxQ0FBVzs7Ozs7O0FBTWIsTUFBTSxPQUFPLE9BQU87Ozs7Ozs7OztJQW1ObEIsWUFDRSxPQUE4QyxFQUN0QyxPQUFzQixFQUN0QixTQUFtQixFQUNuQixPQUFlLEVBQ2YsY0FBNkIsRUFDN0IsaUJBQXlEO1FBSnpELFlBQU8sR0FBUCxPQUFPLENBQWU7UUFDdEIsY0FBUyxHQUFULFNBQVMsQ0FBVTtRQUNuQixZQUFP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QUFXLENBQUMsaUJBQWlCO1FBQzdCLFdBQVcsQ0FBQyx1QkFBdUI7UUFDbkMsV0FBVyxDQUFDLG9CQUFvQjtRQUNoQyxXQUFXLENBQUMsbUJBQW1CO1FBQy9CLFdBQVcsQ0FBQyxJQUFJLENBQUM7QUFDMUIsQ0FBQzs7Ozs7Ozs7QUFNRCxTQUFTLFdBQVcsQ0FBQyxPQUE2QixFQUFFLFNBQW1COztVQUMvRCxRQUFRLEdBQVMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFFM0MsSUFBSSxRQUFRLENBQUMsUUFBUSxLQUFLLFNBQVMsQ0FBQyxZQUFZLEVBQUU7O2NBQzFDLE9BQU8sR0FBRyxTQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztRQUM5QyxPQUFPLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlCLE9BQU8sT0FBTyxDQUFDO0tBQ2hCO0lBRUQsT0FBTyxtQkFBQSxRQUFRLEVBQWUsQ0FBQztBQUNqQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RW1iZWRkZWRWaWV3UmVmLCBFbGVtZW50UmVmLCBOZ1pvbmUsIFZpZXdDb250YWluZXJSZWYsIFRlbXBsYXRlUmVmfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Vmlld3BvcnRSdWxlcn0gZnJvbSAnQGFuZ3VsYXIvY2RrL3Njcm9sbGluZyc7XG5pbXBvcnQge0RpcmVjdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtub3JtYWxpemVQYXNzaXZlTGlzdGVuZXJPcHRpb25zfSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtjb2VyY2VCb29sZWFuUHJvcGVydHksIGNvZXJjZUVsZW1lbnR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge1N1YnNjcmlwdGlvbiwgU3ViamVjdCwgT2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3N0YXJ0V2l0aH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtEcm9wTGlzdFJlZkludGVybmFsIGFzIERyb3BMaXN0UmVmfSBmcm9tICcuL2Ryb3AtbGlzdC1yZWYnO1xuaW1wb3J0IHtEcmFnRHJvcFJlZ2lzdHJ5fSBmcm9tICcuL2RyYWctZHJvcC1yZWdpc3RyeSc7XG5pbXBvcnQge2V4dGVuZFN0eWxlcywgdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9uc30gZnJvbSAnLi9kcmFnLXN0eWxpbmcnO1xuaW1wb3J0IHtnZXRUcmFuc2Zvcm1UcmFuc2l0aW9uRHVyYXRpb25Jbk1zfSBmcm9tICcuL3RyYW5zaXRpb24tZHVyYXRpb24nO1xuXG4vKiogT2JqZWN0IHRoYXQgY2FuIGJlIHVzZWQgdG8gY29uZmlndXJlIHRoZSBiZWhhdmlvciBvZiBEcmFnUmVmLiAqL1xuZXhwb3J0IGludGVyZmFjZSBEcmFnUmVmQ29uZmlnIHtcbiAgLyoqXG4gICAqIE1pbmltdW0gYW1vdW50IG9mIHBpeGVscyB0aGF0IHRoZSB1c2VyIHNob3VsZFxuICAgKiBkcmFnLCBiZWZvcmUgdGhlIENESyBpbml0aWF0ZXMgYSBkcmFnIHNlcXVlbmNlLlxuICAgKi9cbiAgZHJhZ1N0YXJ0VGhyZXNob2xkOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEFtb3VudCB0aGUgcGl4ZWxzIHRoZSB1c2VyIHNob3VsZCBkcmFnIGJlZm9yZSB0aGUgQ0RLXG4gICAqIGNvbnNpZGVycyB0aGVtIHRvIGhhdmUgY2hhbmdlZCB0aGUgZHJhZyBkaXJlY3Rpb24uXG4gICAqL1xuICBwb2ludGVyRGlyZWN0aW9uQ2hhbmdlVGhyZXNob2xkOiBudW1iZXI7XG59XG5cbi8qKiBPcHRpb25zIHRoYXQgY2FuIGJlIHVzZWQgdG8gYmluZCBhIHBhc3NpdmUgZXZlbnQgbGlzdGVuZXIuICovXG5jb25zdCBwYXNzaXZlRXZlbnRMaXN0ZW5lck9wdGlvbnMgPSBub3JtYWxpemVQYXNzaXZlTGlzdGVuZXJPcHRpb25zKHtwYXNzaXZlOiB0cnVlfSk7XG5cbi8qKiBPcHRpb25zIHRoYXQgY2FuIGJlIHVzZWQgdG8gYmluZCBhbiBhY3RpdmUgZXZlbnQgbGlzdGVuZXIuICovXG5jb25zdCBhY3RpdmVFdmVudExpc3RlbmVyT3B0aW9ucyA9IG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMoe3Bhc3NpdmU6IGZhbHNlfSk7XG5cbi8qKlxuICogVGltZSBpbiBtaWxsaXNlY29uZHMgZm9yIHdoaWNoIHRvIGlnbm9yZSBtb3VzZSBldmVudHMsIGFmdGVyXG4gKiByZWNlaXZpbmcgYSB0b3VjaCBldmVudC4gVXNlZCB0byBhdm9pZCBkb2luZyBkb3VibGUgd29yayBmb3JcbiAqIHRvdWNoIGRldmljZXMgd2hlcmUgdGhlIGJyb3dzZXIgZmlyZXMgZmFrZSBtb3VzZSBldmVudHMsIGluXG4gKiBhZGRpdGlvbiB0byB0b3VjaCBldmVudHMuXG4gKi9cbmNvbnN0IE1PVVNFX0VWRU5UX0lHTk9SRV9USU1FID0gODAwO1xuXG4vLyBUT0RPKGNyaXNiZXRvKTogYWRkIGFuIEFQSSBmb3IgbW92aW5nIGEgZHJhZ2dhYmxlIHVwL2Rvd24gdGhlXG4vLyBsaXN0IHByb2dyYW1tYXRpY2FsbHkuIFVzZWZ1bCBmb3Iga2V5Ym9hcmQgY29udHJvbHMuXG5cbi8qKlxuICogSW50ZXJuYWwgY29tcGlsZS10aW1lLW9ubHkgcmVwcmVzZW50YXRpb24gb2YgYSBgRHJhZ1JlZmAuXG4gKiBVc2VkIHRvIGF2b2lkIGNpcmN1bGFyIGltcG9ydCBpc3N1ZXMgYmV0d2VlbiB0aGUgYERyYWdSZWZgIGFuZCB0aGUgYERyb3BMaXN0UmVmYC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEcmFnUmVmSW50ZXJuYWwgZXh0ZW5kcyBEcmFnUmVmIHt9XG5cbi8qKiBUZW1wbGF0ZSB0aGF0IGNhbiBiZSB1c2VkIHRvIGNyZWF0ZSBhIGRyYWcgaGVscGVyIGVsZW1lbnQgKGUuZy4gYSBwcmV2aWV3IG9yIGEgcGxhY2Vob2xkZXIpLiAqL1xuaW50ZXJmYWNlIERyYWdIZWxwZXJUZW1wbGF0ZTxUID0gYW55PiB7XG4gIHRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxUPiB8IG51bGw7XG4gIHZpZXdDb250YWluZXI6IFZpZXdDb250YWluZXJSZWY7XG4gIGNvbnRleHQ6IFQ7XG59XG5cbi8qKlxuICogUmVmZXJlbmNlIHRvIGEgZHJhZ2dhYmxlIGl0ZW0uIFVzZWQgdG8gbWFuaXB1bGF0ZSBvciBkaXNwb3NlIG9mIHRoZSBpdGVtLlxuICovXG5leHBvcnQgY2xhc3MgRHJhZ1JlZjxUID0gYW55PiB7XG4gIC8qKiBFbGVtZW50IGRpc3BsYXllZCBuZXh0IHRvIHRoZSB1c2VyJ3MgcG9pbnRlciB3aGlsZSB0aGUgZWxlbWVudCBpcyBkcmFnZ2VkLiAqL1xuICBwcml2YXRlIF9wcmV2aWV3OiBIVE1MRWxlbWVudDtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSB2aWV3IG9mIHRoZSBwcmV2aWV3IGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3ByZXZpZXdSZWY6IEVtYmVkZGVkVmlld1JlZjxhbnk+IHwgbnVsbDtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSB2aWV3IG9mIHRoZSBwbGFjZWhvbGRlciBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9wbGFjZWhvbGRlclJlZjogRW1iZWRkZWRWaWV3UmVmPGFueT4gfCBudWxsO1xuXG4gIC8qKiBFbGVtZW50IHRoYXQgaXMgcmVuZGVyZWQgaW5zdGVhZCBvZiB0aGUgZHJhZ2dhYmxlIGl0ZW0gd2hpbGUgaXQgaXMgYmVpbmcgc29ydGVkLiAqL1xuICBwcml2YXRlIF9wbGFjZWhvbGRlcjogSFRNTEVsZW1lbnQ7XG5cbiAgLyoqIENvb3JkaW5hdGVzIHdpdGhpbiB0aGUgZWxlbWVudCBhdCB3aGljaCB0aGUgdXNlciBwaWNrZWQgdXAgdGhlIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3BpY2t1cFBvc2l0aW9uSW5FbGVtZW50OiBQb2ludDtcblxuICAvKiogQ29vcmRpbmF0ZXMgb24gdGhlIHBhZ2UgYXQgd2hpY2ggdGhlIHVzZXIgcGlja2VkIHVwIHRoZSBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9waWNrdXBQb3NpdGlvbk9uUGFnZTogUG9pbnQ7XG5cbiAgLyoqXG4gICAqIFJlZmVyZW5jZSB0byB0aGUgZWxlbWVudCB0aGF0IGNvbWVzIGFmdGVyIHRoZSBkcmFnZ2FibGUgaW4gdGhlIERPTSwgYXQgdGhlIHRpbWVcbiAgICogaXQgd2FzIHBpY2tlZCB1cC4gVXNlZCBmb3IgcmVzdG9yaW5nIGl0cyBpbml0aWFsIHBvc2l0aW9uIHdoZW4gaXQncyBkcm9wcGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfbmV4dFNpYmxpbmc6IE5vZGUgfCBudWxsO1xuXG4gIC8qKlxuICAgKiBDU1MgYHRyYW5zZm9ybWAgYXBwbGllZCB0byB0aGUgZWxlbWVudCB3aGVuIGl0IGlzbid0IGJlaW5nIGRyYWdnZWQuIFdlIG5lZWQgYVxuICAgKiBwYXNzaXZlIHRyYW5zZm9ybSBpbiBvcmRlciBmb3IgdGhlIGRyYWdnZWQgZWxlbWVudCB0byByZXRhaW4gaXRzIG5ldyBwb3NpdGlvblxuICAgKiBhZnRlciB0aGUgdXNlciBoYXMgc3RvcHBlZCBkcmFnZ2luZyBhbmQgYmVjYXVzZSB3ZSBuZWVkIHRvIGtub3cgdGhlIHJlbGF0aXZlXG4gICAqIHBvc2l0aW9uIGluIGNhc2UgdGhleSBzdGFydCBkcmFnZ2luZyBhZ2Fpbi4gVGhpcyBjb3JyZXNwb25kcyB0byBgZWxlbWVudC5zdHlsZS50cmFuc2Zvcm1gLlxuICAgKi9cbiAgcHJpdmF0ZSBfcGFzc2l2ZVRyYW5zZm9ybTogUG9pbnQgPSB7eDogMCwgeTogMH07XG5cbiAgLyoqIENTUyBgdHJhbnNmb3JtYCB0aGF0IGlzIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgd2hpbGUgaXQncyBiZWluZyBkcmFnZ2VkLiAqL1xuICBwcml2YXRlIF9hY3RpdmVUcmFuc2Zvcm06IFBvaW50ID0ge3g6IDAsIHk6IDB9O1xuXG4gIC8qKiBJbmxpbmUgYHRyYW5zZm9ybWAgdmFsdWUgdGhhdCB0aGUgZWxlbWVudCBoYWQgYmVmb3JlIHRoZSBmaXJzdCBkcmFnZ2luZyBzZXF1ZW5jZS4gKi9cbiAgcHJpdmF0ZSBfaW5pdGlhbFRyYW5zZm9ybT86IHN0cmluZztcblxuICAvKipcbiAgICogV2hldGhlciB0aGUgZHJhZ2dpbmcgc2VxdWVuY2UgaGFzIGJlZW4gc3RhcnRlZC4gRG9lc24ndFxuICAgKiBuZWNlc3NhcmlseSBtZWFuIHRoYXQgdGhlIGVsZW1lbnQgaGFzIGJlZW4gbW92ZWQuXG4gICAqL1xuICBwcml2YXRlIF9oYXNTdGFydGVkRHJhZ2dpbmc6IGJvb2xlYW47XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGVsZW1lbnQgaGFzIG1vdmVkIHNpbmNlIHRoZSB1c2VyIHN0YXJ0ZWQgZHJhZ2dpbmcgaXQuICovXG4gIHByaXZhdGUgX2hhc01vdmVkOiBib29sZWFuO1xuXG4gIC8qKiBEcm9wIGNvbnRhaW5lciBpbiB3aGljaCB0aGUgRHJhZ1JlZiByZXNpZGVkIHdoZW4gZHJhZ2dpbmcgYmVnYW4uICovXG4gIHByaXZhdGUgX2luaXRpYWxDb250YWluZXI6IERyb3BMaXN0UmVmO1xuXG4gIC8qKiBDYWNoZWQgc2Nyb2xsIHBvc2l0aW9uIG9uIHRoZSBwYWdlIHdoZW4gdGhlIGVsZW1lbnQgd2FzIHBpY2tlZCB1cC4gKi9cbiAgcHJpdmF0ZSBfc2Nyb2xsUG9zaXRpb246IHt0b3A6IG51bWJlciwgbGVmdDogbnVtYmVyfTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgaXRlbSBpcyBiZWluZyBtb3ZlZC4gKi9cbiAgcHJpdmF0ZSBfbW92ZUV2ZW50cyA9IG5ldyBTdWJqZWN0PHtcbiAgICBzb3VyY2U6IERyYWdSZWY7XG4gICAgcG9pbnRlclBvc2l0aW9uOiB7eDogbnVtYmVyLCB5OiBudW1iZXJ9O1xuICAgIGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudDtcbiAgICBkaXN0YW5jZTogUG9pbnQ7XG4gICAgZGVsdGE6IHt4OiAtMSB8IDAgfCAxLCB5OiAtMSB8IDAgfCAxfTtcbiAgfT4oKTtcblxuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgdXNlciBpcyBkcmFnZ2luZyBhbG9uZyBlYWNoIGF4aXMuICovXG4gIHByaXZhdGUgX3BvaW50ZXJEaXJlY3Rpb25EZWx0YToge3g6IC0xIHwgMCB8IDEsIHk6IC0xIHwgMCB8IDF9O1xuXG4gIC8qKiBQb2ludGVyIHBvc2l0aW9uIGF0IHdoaWNoIHRoZSBsYXN0IGNoYW5nZSBpbiB0aGUgZGVsdGEgb2NjdXJyZWQuICovXG4gIHByaXZhdGUgX3BvaW50ZXJQb3NpdGlvbkF0TGFzdERpcmVjdGlvbkNoYW5nZTogUG9pbnQ7XG5cbiAgLyoqXG4gICAqIFJvb3QgRE9NIG5vZGUgb2YgdGhlIGRyYWcgaW5zdGFuY2UuIFRoaXMgaXMgdGhlIGVsZW1lbnQgdGhhdCB3aWxsXG4gICAqIGJlIG1vdmVkIGFyb3VuZCBhcyB0aGUgdXNlciBpcyBkcmFnZ2luZy5cbiAgICovXG4gIHByaXZhdGUgX3Jvb3RFbGVtZW50OiBIVE1MRWxlbWVudDtcblxuICAvKipcbiAgICogSW5saW5lIHN0eWxlIHZhbHVlIG9mIGAtd2Via2l0LXRhcC1oaWdobGlnaHQtY29sb3JgIGF0IHRoZSB0aW1lIHRoZVxuICAgKiBkcmFnZ2luZyB3YXMgc3RhcnRlZC4gVXNlZCB0byByZXN0b3JlIHRoZSB2YWx1ZSBvbmNlIHdlJ3JlIGRvbmUgZHJhZ2dpbmcuXG4gICAqL1xuICBwcml2YXRlIF9yb290RWxlbWVudFRhcEhpZ2hsaWdodDogc3RyaW5nIHwgbnVsbDtcblxuICAvKiogU3Vic2NyaXB0aW9uIHRvIHBvaW50ZXIgbW92ZW1lbnQgZXZlbnRzLiAqL1xuICBwcml2YXRlIF9wb2ludGVyTW92ZVN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcblxuICAvKiogU3Vic2NyaXB0aW9uIHRvIHRoZSBldmVudCB0aGF0IGlzIGRpc3BhdGNoZWQgd2hlbiB0aGUgdXNlciBsaWZ0cyB0aGVpciBwb2ludGVyLiAqL1xuICBwcml2YXRlIF9wb2ludGVyVXBTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG5cbiAgLyoqIFN1YnNjcmlwdGlvbiB0byB0aGUgdmlld3BvcnQgYmVpbmcgc2Nyb2xsZWQuICovXG4gIHByaXZhdGUgX3Njcm9sbFN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcblxuICAvKiogU3Vic2NyaXB0aW9uIHRvIHRoZSB2aWV3cG9ydCBiZWluZyByZXNpemVkLiAqL1xuICBwcml2YXRlIF9yZXNpemVTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG5cbiAgLyoqXG4gICAqIFRpbWUgYXQgd2hpY2ggdGhlIGxhc3QgdG91Y2ggZXZlbnQgb2NjdXJyZWQuIFVzZWQgdG8gYXZvaWQgZmlyaW5nIHRoZSBzYW1lXG4gICAqIGV2ZW50cyBtdWx0aXBsZSB0aW1lcyBvbiB0b3VjaCBkZXZpY2VzIHdoZXJlIHRoZSBicm93c2VyIHdpbGwgZmlyZSBhIGZha2VcbiAgICogbW91c2UgZXZlbnQgZm9yIGVhY2ggdG91Y2ggZXZlbnQsIGFmdGVyIGEgY2VydGFpbiB0aW1lLlxuICAgKi9cbiAgcHJpdmF0ZSBfbGFzdFRvdWNoRXZlbnRUaW1lOiBudW1iZXI7XG5cbiAgLyoqIFRpbWUgYXQgd2hpY2ggdGhlIGxhc3QgZHJhZ2dpbmcgc2VxdWVuY2Ugd2FzIHN0YXJ0ZWQuICovXG4gIHByaXZhdGUgX2RyYWdTdGFydFRpbWU6IG51bWJlcjtcblxuICAvKiogQ2FjaGVkIHJlZmVyZW5jZSB0byB0aGUgYm91bmRhcnkgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfYm91bmRhcnlFbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBuYXRpdmUgZHJhZ2dpbmcgaW50ZXJhY3Rpb25zIGhhdmUgYmVlbiBlbmFibGVkIG9uIHRoZSByb290IGVsZW1lbnQuICovXG4gIHByaXZhdGUgX25hdGl2ZUludGVyYWN0aW9uc0VuYWJsZWQgPSB0cnVlO1xuXG4gIC8qKiBDYWNoZWQgZGltZW5zaW9ucyBvZiB0aGUgcHJldmlldyBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9wcmV2aWV3UmVjdD86IENsaWVudFJlY3Q7XG5cbiAgLyoqIENhY2hlZCBkaW1lbnNpb25zIG9mIHRoZSBib3VuZGFyeSBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9ib3VuZGFyeVJlY3Q/OiBDbGllbnRSZWN0O1xuXG4gIC8qKiBFbGVtZW50IHRoYXQgd2lsbCBiZSB1c2VkIGFzIGEgdGVtcGxhdGUgdG8gY3JlYXRlIHRoZSBkcmFnZ2FibGUgaXRlbSdzIHByZXZpZXcuICovXG4gIHByaXZhdGUgX3ByZXZpZXdUZW1wbGF0ZT86IERyYWdIZWxwZXJUZW1wbGF0ZSB8IG51bGw7XG5cbiAgLyoqIFRlbXBsYXRlIGZvciBwbGFjZWhvbGRlciBlbGVtZW50IHJlbmRlcmVkIHRvIHNob3cgd2hlcmUgYSBkcmFnZ2FibGUgd291bGQgYmUgZHJvcHBlZC4gKi9cbiAgcHJpdmF0ZSBfcGxhY2Vob2xkZXJUZW1wbGF0ZT86IERyYWdIZWxwZXJUZW1wbGF0ZSB8IG51bGw7XG5cbiAgLyoqIEVsZW1lbnRzIHRoYXQgY2FuIGJlIHVzZWQgdG8gZHJhZyB0aGUgZHJhZ2dhYmxlIGl0ZW0uICovXG4gIHByaXZhdGUgX2hhbmRsZXM6IEhUTUxFbGVtZW50W10gPSBbXTtcblxuICAvKiogUmVnaXN0ZXJlZCBoYW5kbGVzIHRoYXQgYXJlIGN1cnJlbnRseSBkaXNhYmxlZC4gKi9cbiAgcHJpdmF0ZSBfZGlzYWJsZWRIYW5kbGVzID0gbmV3IFNldDxIVE1MRWxlbWVudD4oKTtcblxuICAvKiogRHJvcHBhYmxlIGNvbnRhaW5lciB0aGF0IHRoZSBkcmFnZ2FibGUgaXMgYSBwYXJ0IG9mLiAqL1xuICBwcml2YXRlIF9kcm9wQ29udGFpbmVyPzogRHJvcExpc3RSZWY7XG5cbiAgLyoqIExheW91dCBkaXJlY3Rpb24gb2YgdGhlIGl0ZW0uICovXG4gIHByaXZhdGUgX2RpcmVjdGlvbjogRGlyZWN0aW9uID0gJ2x0cic7XG5cbiAgLyoqIEF4aXMgYWxvbmcgd2hpY2ggZHJhZ2dpbmcgaXMgbG9ja2VkLiAqL1xuICBsb2NrQXhpczogJ3gnIHwgJ3knO1xuXG4gIC8qKlxuICAgKiBBbW91bnQgb2YgbWlsbGlzZWNvbmRzIHRvIHdhaXQgYWZ0ZXIgdGhlIHVzZXIgaGFzIHB1dCB0aGVpclxuICAgKiBwb2ludGVyIGRvd24gYmVmb3JlIHN0YXJ0aW5nIHRvIGRyYWcgdGhlIGVsZW1lbnQuXG4gICAqL1xuICBkcmFnU3RhcnREZWxheTogbnVtYmVyIHwge3RvdWNoOiBudW1iZXIsIG1vdXNlOiBudW1iZXJ9ID0gMDtcblxuICAvKiogQ2xhc3MgdG8gYmUgYWRkZWQgdG8gdGhlIHByZXZpZXcgZWxlbWVudC4gKi9cbiAgcHJldmlld0NsYXNzOiBzdHJpbmd8c3RyaW5nW118dW5kZWZpbmVkO1xuXG4gIC8qKiBXaGV0aGVyIHN0YXJ0aW5nIHRvIGRyYWcgdGhpcyBlbGVtZW50IGlzIGRpc2FibGVkLiAqL1xuICBnZXQgZGlzYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2Rpc2FibGVkIHx8ICEhKHRoaXMuX2Ryb3BDb250YWluZXIgJiYgdGhpcy5fZHJvcENvbnRhaW5lci5kaXNhYmxlZCk7XG4gIH1cbiAgc2V0IGRpc2FibGVkKHZhbHVlOiBib29sZWFuKSB7XG4gICAgY29uc3QgbmV3VmFsdWUgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuXG4gICAgaWYgKG5ld1ZhbHVlICE9PSB0aGlzLl9kaXNhYmxlZCkge1xuICAgICAgdGhpcy5fZGlzYWJsZWQgPSBuZXdWYWx1ZTtcbiAgICAgIHRoaXMuX3RvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMoKTtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBfZGlzYWJsZWQgPSBmYWxzZTtcblxuICAvKiogRW1pdHMgYXMgdGhlIGRyYWcgc2VxdWVuY2UgaXMgYmVpbmcgcHJlcGFyZWQuICovXG4gIGJlZm9yZVN0YXJ0ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHN0YXJ0cyBkcmFnZ2luZyB0aGUgaXRlbS4gKi9cbiAgc3RhcnRlZCA9IG5ldyBTdWJqZWN0PHtzb3VyY2U6IERyYWdSZWZ9PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGhhcyByZWxlYXNlZCBhIGRyYWcgaXRlbSwgYmVmb3JlIGFueSBhbmltYXRpb25zIGhhdmUgc3RhcnRlZC4gKi9cbiAgcmVsZWFzZWQgPSBuZXcgU3ViamVjdDx7c291cmNlOiBEcmFnUmVmfT4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBzdG9wcyBkcmFnZ2luZyBhbiBpdGVtIGluIHRoZSBjb250YWluZXIuICovXG4gIGVuZGVkID0gbmV3IFN1YmplY3Q8e3NvdXJjZTogRHJhZ1JlZiwgZGlzdGFuY2U6IFBvaW50fT4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBoYXMgbW92ZWQgdGhlIGl0ZW0gaW50byBhIG5ldyBjb250YWluZXIuICovXG4gIGVudGVyZWQgPSBuZXcgU3ViamVjdDx7Y29udGFpbmVyOiBEcm9wTGlzdFJlZiwgaXRlbTogRHJhZ1JlZiwgY3VycmVudEluZGV4OiBudW1iZXJ9PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHJlbW92ZXMgdGhlIGl0ZW0gaXRzIGNvbnRhaW5lciBieSBkcmFnZ2luZyBpdCBpbnRvIGFub3RoZXIgY29udGFpbmVyLiAqL1xuICBleGl0ZWQgPSBuZXcgU3ViamVjdDx7Y29udGFpbmVyOiBEcm9wTGlzdFJlZiwgaXRlbTogRHJhZ1JlZn0+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgZHJvcHMgdGhlIGl0ZW0gaW5zaWRlIGEgY29udGFpbmVyLiAqL1xuICBkcm9wcGVkID0gbmV3IFN1YmplY3Q8e1xuICAgIHByZXZpb3VzSW5kZXg6IG51bWJlcjtcbiAgICBjdXJyZW50SW5kZXg6IG51bWJlcjtcbiAgICBpdGVtOiBEcmFnUmVmO1xuICAgIGNvbnRhaW5lcjogRHJvcExpc3RSZWY7XG4gICAgcHJldmlvdXNDb250YWluZXI6IERyb3BMaXN0UmVmO1xuICAgIGRpc3RhbmNlOiBQb2ludDtcbiAgICBpc1BvaW50ZXJPdmVyQ29udGFpbmVyOiBib29sZWFuO1xuICB9PigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyBhcyB0aGUgdXNlciBpcyBkcmFnZ2luZyB0aGUgaXRlbS4gVXNlIHdpdGggY2F1dGlvbixcbiAgICogYmVjYXVzZSB0aGlzIGV2ZW50IHdpbGwgZmlyZSBmb3IgZXZlcnkgcGl4ZWwgdGhhdCB0aGUgdXNlciBoYXMgZHJhZ2dlZC5cbiAgICovXG4gIG1vdmVkOiBPYnNlcnZhYmxlPHtcbiAgICBzb3VyY2U6IERyYWdSZWY7XG4gICAgcG9pbnRlclBvc2l0aW9uOiB7eDogbnVtYmVyLCB5OiBudW1iZXJ9O1xuICAgIGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudDtcbiAgICBkaXN0YW5jZTogUG9pbnQ7XG4gICAgZGVsdGE6IHt4OiAtMSB8IDAgfCAxLCB5OiAtMSB8IDAgfCAxfTtcbiAgfT4gPSB0aGlzLl9tb3ZlRXZlbnRzLmFzT2JzZXJ2YWJsZSgpO1xuXG4gIC8qKiBBcmJpdHJhcnkgZGF0YSB0aGF0IGNhbiBiZSBhdHRhY2hlZCB0byB0aGUgZHJhZyBpdGVtLiAqL1xuICBkYXRhOiBUO1xuXG4gIC8qKlxuICAgKiBGdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHRvIGN1c3RvbWl6ZSB0aGUgbG9naWMgb2YgaG93IHRoZSBwb3NpdGlvbiBvZiB0aGUgZHJhZyBpdGVtXG4gICAqIGlzIGxpbWl0ZWQgd2hpbGUgaXQncyBiZWluZyBkcmFnZ2VkLiBHZXRzIGNhbGxlZCB3aXRoIGEgcG9pbnQgY29udGFpbmluZyB0aGUgY3VycmVudCBwb3NpdGlvblxuICAgKiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgb24gdGhlIHBhZ2UgYW5kIHNob3VsZCByZXR1cm4gYSBwb2ludCBkZXNjcmliaW5nIHdoZXJlIHRoZSBpdGVtIHNob3VsZFxuICAgKiBiZSByZW5kZXJlZC5cbiAgICovXG4gIGNvbnN0cmFpblBvc2l0aW9uPzogKHBvaW50OiBQb2ludCwgZHJhZ1JlZjogRHJhZ1JlZikgPT4gUG9pbnQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBIVE1MRWxlbWVudCxcbiAgICBwcml2YXRlIF9jb25maWc6IERyYWdSZWZDb25maWcsXG4gICAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50LFxuICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgIHByaXZhdGUgX3ZpZXdwb3J0UnVsZXI6IFZpZXdwb3J0UnVsZXIsXG4gICAgcHJpdmF0ZSBfZHJhZ0Ryb3BSZWdpc3RyeTogRHJhZ0Ryb3BSZWdpc3RyeTxEcmFnUmVmLCBEcm9wTGlzdFJlZj4pIHtcblxuICAgIHRoaXMud2l0aFJvb3RFbGVtZW50KGVsZW1lbnQpO1xuICAgIF9kcmFnRHJvcFJlZ2lzdHJ5LnJlZ2lzdGVyRHJhZ0l0ZW0odGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZWxlbWVudCB0aGF0IGlzIGJlaW5nIHVzZWQgYXMgYSBwbGFjZWhvbGRlclxuICAgKiB3aGlsZSB0aGUgY3VycmVudCBlbGVtZW50IGlzIGJlaW5nIGRyYWdnZWQuXG4gICAqL1xuICBnZXRQbGFjZWhvbGRlckVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLl9wbGFjZWhvbGRlcjtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHRoZSByb290IGRyYWdnYWJsZSBlbGVtZW50LiAqL1xuICBnZXRSb290RWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX3Jvb3RFbGVtZW50O1xuICB9XG5cbiAgLyoqIFJlZ2lzdGVycyB0aGUgaGFuZGxlcyB0aGF0IGNhbiBiZSB1c2VkIHRvIGRyYWcgdGhlIGVsZW1lbnQuICovXG4gIHdpdGhIYW5kbGVzKGhhbmRsZXM6IChIVE1MRWxlbWVudCB8IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+KVtdKTogdGhpcyB7XG4gICAgdGhpcy5faGFuZGxlcyA9IGhhbmRsZXMubWFwKGhhbmRsZSA9PiBjb2VyY2VFbGVtZW50KGhhbmRsZSkpO1xuICAgIHRoaXMuX2hhbmRsZXMuZm9yRWFjaChoYW5kbGUgPT4gdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucyhoYW5kbGUsIGZhbHNlKSk7XG4gICAgdGhpcy5fdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucygpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyB0aGUgdGVtcGxhdGUgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgdGhlIGRyYWcgcHJldmlldy5cbiAgICogQHBhcmFtIHRlbXBsYXRlIFRlbXBsYXRlIHRoYXQgZnJvbSB3aGljaCB0byBzdGFtcCBvdXQgdGhlIHByZXZpZXcuXG4gICAqL1xuICB3aXRoUHJldmlld1RlbXBsYXRlKHRlbXBsYXRlOiBEcmFnSGVscGVyVGVtcGxhdGUgfCBudWxsKTogdGhpcyB7XG4gICAgdGhpcy5fcHJldmlld1RlbXBsYXRlID0gdGVtcGxhdGU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIHRoZSB0ZW1wbGF0ZSB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciB0aGUgZHJhZyBwbGFjZWhvbGRlci5cbiAgICogQHBhcmFtIHRlbXBsYXRlIFRlbXBsYXRlIHRoYXQgZnJvbSB3aGljaCB0byBzdGFtcCBvdXQgdGhlIHBsYWNlaG9sZGVyLlxuICAgKi9cbiAgd2l0aFBsYWNlaG9sZGVyVGVtcGxhdGUodGVtcGxhdGU6IERyYWdIZWxwZXJUZW1wbGF0ZSB8IG51bGwpOiB0aGlzIHtcbiAgICB0aGlzLl9wbGFjZWhvbGRlclRlbXBsYXRlID0gdGVtcGxhdGU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhbiBhbHRlcm5hdGUgZHJhZyByb290IGVsZW1lbnQuIFRoZSByb290IGVsZW1lbnQgaXMgdGhlIGVsZW1lbnQgdGhhdCB3aWxsIGJlIG1vdmVkIGFzXG4gICAqIHRoZSB1c2VyIGlzIGRyYWdnaW5nLiBQYXNzaW5nIGFuIGFsdGVybmF0ZSByb290IGVsZW1lbnQgaXMgdXNlZnVsIHdoZW4gdHJ5aW5nIHRvIGVuYWJsZVxuICAgKiBkcmFnZ2luZyBvbiBhbiBlbGVtZW50IHRoYXQgeW91IG1pZ2h0IG5vdCBoYXZlIGFjY2VzcyB0by5cbiAgICovXG4gIHdpdGhSb290RWxlbWVudChyb290RWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBIVE1MRWxlbWVudCk6IHRoaXMge1xuICAgIGNvbnN0IGVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KHJvb3RFbGVtZW50KTtcblxuICAgIGlmIChlbGVtZW50ICE9PSB0aGlzLl9yb290RWxlbWVudCkge1xuICAgICAgaWYgKHRoaXMuX3Jvb3RFbGVtZW50KSB7XG4gICAgICAgIHRoaXMuX3JlbW92ZVJvb3RFbGVtZW50TGlzdGVuZXJzKHRoaXMuX3Jvb3RFbGVtZW50KTtcbiAgICAgIH1cblxuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9wb2ludGVyRG93biwgYWN0aXZlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5fcG9pbnRlckRvd24sIHBhc3NpdmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICB0aGlzLl9pbml0aWFsVHJhbnNmb3JtID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fcm9vdEVsZW1lbnQgPSBlbGVtZW50O1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEVsZW1lbnQgdG8gd2hpY2ggdGhlIGRyYWdnYWJsZSdzIHBvc2l0aW9uIHdpbGwgYmUgY29uc3RyYWluZWQuXG4gICAqL1xuICB3aXRoQm91bmRhcnlFbGVtZW50KGJvdW5kYXJ5RWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBIVE1MRWxlbWVudCB8IG51bGwpOiB0aGlzIHtcbiAgICB0aGlzLl9ib3VuZGFyeUVsZW1lbnQgPSBib3VuZGFyeUVsZW1lbnQgPyBjb2VyY2VFbGVtZW50KGJvdW5kYXJ5RWxlbWVudCkgOiBudWxsO1xuICAgIHRoaXMuX3Jlc2l6ZVN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIGlmIChib3VuZGFyeUVsZW1lbnQpIHtcbiAgICAgIHRoaXMuX3Jlc2l6ZVN1YnNjcmlwdGlvbiA9IHRoaXMuX3ZpZXdwb3J0UnVsZXJcbiAgICAgICAgLmNoYW5nZSgxMClcbiAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9jb250YWluSW5zaWRlQm91bmRhcnlPblJlc2l6ZSgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogUmVtb3ZlcyB0aGUgZHJhZ2dpbmcgZnVuY3Rpb25hbGl0eSBmcm9tIHRoZSBET00gZWxlbWVudC4gKi9cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLl9yZW1vdmVSb290RWxlbWVudExpc3RlbmVycyh0aGlzLl9yb290RWxlbWVudCk7XG5cbiAgICAvLyBEbyB0aGlzIGNoZWNrIGJlZm9yZSByZW1vdmluZyBmcm9tIHRoZSByZWdpc3RyeSBzaW5jZSBpdCdsbFxuICAgIC8vIHN0b3AgYmVpbmcgY29uc2lkZXJlZCBhcyBkcmFnZ2VkIG9uY2UgaXQgaXMgcmVtb3ZlZC5cbiAgICBpZiAodGhpcy5pc0RyYWdnaW5nKCkpIHtcbiAgICAgIC8vIFNpbmNlIHdlIG1vdmUgb3V0IHRoZSBlbGVtZW50IHRvIHRoZSBlbmQgb2YgdGhlIGJvZHkgd2hpbGUgaXQncyBiZWluZ1xuICAgICAgLy8gZHJhZ2dlZCwgd2UgaGF2ZSB0byBtYWtlIHN1cmUgdGhhdCBpdCdzIHJlbW92ZWQgaWYgaXQgZ2V0cyBkZXN0cm95ZWQuXG4gICAgICByZW1vdmVFbGVtZW50KHRoaXMuX3Jvb3RFbGVtZW50KTtcbiAgICB9XG5cbiAgICB0aGlzLl9kZXN0cm95UHJldmlldygpO1xuICAgIHRoaXMuX2Rlc3Ryb3lQbGFjZWhvbGRlcigpO1xuICAgIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkucmVtb3ZlRHJhZ0l0ZW0odGhpcyk7XG4gICAgdGhpcy5fcmVtb3ZlU3Vic2NyaXB0aW9ucygpO1xuICAgIHRoaXMuYmVmb3JlU3RhcnRlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuc3RhcnRlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMucmVsZWFzZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmVuZGVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5lbnRlcmVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5leGl0ZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmRyb3BwZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLl9tb3ZlRXZlbnRzLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5faGFuZGxlcyA9IFtdO1xuICAgIHRoaXMuX2Rpc2FibGVkSGFuZGxlcy5jbGVhcigpO1xuICAgIHRoaXMuX2Ryb3BDb250YWluZXIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fcmVzaXplU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fYm91bmRhcnlFbGVtZW50ID0gdGhpcy5fcm9vdEVsZW1lbnQgPSB0aGlzLl9wbGFjZWhvbGRlclRlbXBsYXRlID1cbiAgICAgICAgdGhpcy5fcHJldmlld1RlbXBsYXRlID0gdGhpcy5fbmV4dFNpYmxpbmcgPSBudWxsITtcbiAgfVxuXG4gIC8qKiBDaGVja3Mgd2hldGhlciB0aGUgZWxlbWVudCBpcyBjdXJyZW50bHkgYmVpbmcgZHJhZ2dlZC4gKi9cbiAgaXNEcmFnZ2luZygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5faGFzU3RhcnRlZERyYWdnaW5nICYmIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuaXNEcmFnZ2luZyh0aGlzKTtcbiAgfVxuXG4gIC8qKiBSZXNldHMgYSBzdGFuZGFsb25lIGRyYWcgaXRlbSB0byBpdHMgaW5pdGlhbCBwb3NpdGlvbi4gKi9cbiAgcmVzZXQoKTogdm9pZCB7XG4gICAgdGhpcy5fcm9vdEVsZW1lbnQuc3R5bGUudHJhbnNmb3JtID0gdGhpcy5faW5pdGlhbFRyYW5zZm9ybSB8fCAnJztcbiAgICB0aGlzLl9hY3RpdmVUcmFuc2Zvcm0gPSB7eDogMCwgeTogMH07XG4gICAgdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybSA9IHt4OiAwLCB5OiAwfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGEgaGFuZGxlIGFzIGRpc2FibGVkLiBXaGlsZSBhIGhhbmRsZSBpcyBkaXNhYmxlZCwgaXQnbGwgY2FwdHVyZSBhbmQgaW50ZXJydXB0IGRyYWdnaW5nLlxuICAgKiBAcGFyYW0gaGFuZGxlIEhhbmRsZSBlbGVtZW50IHRoYXQgc2hvdWxkIGJlIGRpc2FibGVkLlxuICAgKi9cbiAgZGlzYWJsZUhhbmRsZShoYW5kbGU6IEhUTUxFbGVtZW50KSB7XG4gICAgaWYgKHRoaXMuX2hhbmRsZXMuaW5kZXhPZihoYW5kbGUpID4gLTEpIHtcbiAgICAgIHRoaXMuX2Rpc2FibGVkSGFuZGxlcy5hZGQoaGFuZGxlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlcyBhIGhhbmRsZSwgaWYgaXQgaGFzIGJlZW4gZGlzYWJsZWQuXG4gICAqIEBwYXJhbSBoYW5kbGUgSGFuZGxlIGVsZW1lbnQgdG8gYmUgZW5hYmxlZC5cbiAgICovXG4gIGVuYWJsZUhhbmRsZShoYW5kbGU6IEhUTUxFbGVtZW50KSB7XG4gICAgdGhpcy5fZGlzYWJsZWRIYW5kbGVzLmRlbGV0ZShoYW5kbGUpO1xuICB9XG5cbiAgLyoqIFNldHMgdGhlIGxheW91dCBkaXJlY3Rpb24gb2YgdGhlIGRyYWdnYWJsZSBpdGVtLiAqL1xuICB3aXRoRGlyZWN0aW9uKGRpcmVjdGlvbjogRGlyZWN0aW9uKTogdGhpcyB7XG4gICAgdGhpcy5fZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFNldHMgdGhlIGNvbnRhaW5lciB0aGF0IHRoZSBpdGVtIGlzIHBhcnQgb2YuICovXG4gIF93aXRoRHJvcENvbnRhaW5lcihjb250YWluZXI6IERyb3BMaXN0UmVmKSB7XG4gICAgdGhpcy5fZHJvcENvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IHBvc2l0aW9uIGluIHBpeGVscyB0aGUgZHJhZ2dhYmxlIG91dHNpZGUgb2YgYSBkcm9wIGNvbnRhaW5lci5cbiAgICovXG4gIGdldEZyZWVEcmFnUG9zaXRpb24oKTogUmVhZG9ubHk8UG9pbnQ+IHtcbiAgICBjb25zdCBwb3NpdGlvbiA9IHRoaXMuaXNEcmFnZ2luZygpID8gdGhpcy5fYWN0aXZlVHJhbnNmb3JtIDogdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybTtcbiAgICByZXR1cm4ge3g6IHBvc2l0aW9uLngsIHk6IHBvc2l0aW9uLnl9O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGN1cnJlbnQgcG9zaXRpb24gaW4gcGl4ZWxzIHRoZSBkcmFnZ2FibGUgb3V0c2lkZSBvZiBhIGRyb3AgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gdmFsdWUgTmV3IHBvc2l0aW9uIHRvIGJlIHNldC5cbiAgICovXG4gIHNldEZyZWVEcmFnUG9zaXRpb24odmFsdWU6IFBvaW50KTogdGhpcyB7XG4gICAgdGhpcy5fYWN0aXZlVHJhbnNmb3JtID0ge3g6IDAsIHk6IDB9O1xuICAgIHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm0ueCA9IHZhbHVlLng7XG4gICAgdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybS55ID0gdmFsdWUueTtcblxuICAgIGlmICghdGhpcy5fZHJvcENvbnRhaW5lcikge1xuICAgICAgdGhpcy5fYXBwbHlSb290RWxlbWVudFRyYW5zZm9ybSh2YWx1ZS54LCB2YWx1ZS55KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBVcGRhdGVzIHRoZSBpdGVtJ3Mgc29ydCBvcmRlciBiYXNlZCBvbiB0aGUgbGFzdC1rbm93biBwb2ludGVyIHBvc2l0aW9uLiAqL1xuICBfc29ydEZyb21MYXN0UG9pbnRlclBvc2l0aW9uKCkge1xuICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5fcG9pbnRlclBvc2l0aW9uQXRMYXN0RGlyZWN0aW9uQ2hhbmdlO1xuXG4gICAgaWYgKHBvc2l0aW9uICYmIHRoaXMuX2Ryb3BDb250YWluZXIpIHtcbiAgICAgIHRoaXMuX3VwZGF0ZUFjdGl2ZURyb3BDb250YWluZXIocG9zaXRpb24pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBVbnN1YnNjcmliZXMgZnJvbSB0aGUgZ2xvYmFsIHN1YnNjcmlwdGlvbnMuICovXG4gIHByaXZhdGUgX3JlbW92ZVN1YnNjcmlwdGlvbnMoKSB7XG4gICAgdGhpcy5fcG9pbnRlck1vdmVTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9wb2ludGVyVXBTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9zY3JvbGxTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIC8qKiBEZXN0cm95cyB0aGUgcHJldmlldyBlbGVtZW50IGFuZCBpdHMgVmlld1JlZi4gKi9cbiAgcHJpdmF0ZSBfZGVzdHJveVByZXZpZXcoKSB7XG4gICAgaWYgKHRoaXMuX3ByZXZpZXcpIHtcbiAgICAgIHJlbW92ZUVsZW1lbnQodGhpcy5fcHJldmlldyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3ByZXZpZXdSZWYpIHtcbiAgICAgIHRoaXMuX3ByZXZpZXdSZWYuZGVzdHJveSgpO1xuICAgIH1cblxuICAgIHRoaXMuX3ByZXZpZXcgPSB0aGlzLl9wcmV2aWV3UmVmID0gbnVsbCE7XG4gIH1cblxuICAvKiogRGVzdHJveXMgdGhlIHBsYWNlaG9sZGVyIGVsZW1lbnQgYW5kIGl0cyBWaWV3UmVmLiAqL1xuICBwcml2YXRlIF9kZXN0cm95UGxhY2Vob2xkZXIoKSB7XG4gICAgaWYgKHRoaXMuX3BsYWNlaG9sZGVyKSB7XG4gICAgICByZW1vdmVFbGVtZW50KHRoaXMuX3BsYWNlaG9sZGVyKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fcGxhY2Vob2xkZXJSZWYpIHtcbiAgICAgIHRoaXMuX3BsYWNlaG9sZGVyUmVmLmRlc3Ryb3koKTtcbiAgICB9XG5cbiAgICB0aGlzLl9wbGFjZWhvbGRlciA9IHRoaXMuX3BsYWNlaG9sZGVyUmVmID0gbnVsbCE7XG4gIH1cblxuICAvKiogSGFuZGxlciBmb3IgdGhlIGBtb3VzZWRvd25gL2B0b3VjaHN0YXJ0YCBldmVudHMuICovXG4gIHByaXZhdGUgX3BvaW50ZXJEb3duID0gKGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCkgPT4ge1xuICAgIHRoaXMuYmVmb3JlU3RhcnRlZC5uZXh0KCk7XG5cbiAgICAvLyBEZWxlZ2F0ZSB0aGUgZXZlbnQgYmFzZWQgb24gd2hldGhlciBpdCBzdGFydGVkIGZyb20gYSBoYW5kbGUgb3IgdGhlIGVsZW1lbnQgaXRzZWxmLlxuICAgIGlmICh0aGlzLl9oYW5kbGVzLmxlbmd0aCkge1xuICAgICAgY29uc3QgdGFyZ2V0SGFuZGxlID0gdGhpcy5faGFuZGxlcy5maW5kKGhhbmRsZSA9PiB7XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldDtcbiAgICAgICAgcmV0dXJuICEhdGFyZ2V0ICYmICh0YXJnZXQgPT09IGhhbmRsZSB8fCBoYW5kbGUuY29udGFpbnModGFyZ2V0IGFzIEhUTUxFbGVtZW50KSk7XG4gICAgICB9KTtcblxuICAgICAgaWYgKHRhcmdldEhhbmRsZSAmJiAhdGhpcy5fZGlzYWJsZWRIYW5kbGVzLmhhcyh0YXJnZXRIYW5kbGUpICYmICF0aGlzLmRpc2FibGVkKSB7XG4gICAgICAgIHRoaXMuX2luaXRpYWxpemVEcmFnU2VxdWVuY2UodGFyZ2V0SGFuZGxlLCBldmVudCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICghdGhpcy5kaXNhYmxlZCkge1xuICAgICAgdGhpcy5faW5pdGlhbGl6ZURyYWdTZXF1ZW5jZSh0aGlzLl9yb290RWxlbWVudCwgZXZlbnQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBIYW5kbGVyIHRoYXQgaXMgaW52b2tlZCB3aGVuIHRoZSB1c2VyIG1vdmVzIHRoZWlyIHBvaW50ZXIgYWZ0ZXIgdGhleSd2ZSBpbml0aWF0ZWQgYSBkcmFnLiAqL1xuICBwcml2YXRlIF9wb2ludGVyTW92ZSA9IChldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpID0+IHtcbiAgICAvLyBQcmV2ZW50IHRoZSBkZWZhdWx0IGFjdGlvbiBhcyBlYXJseSBhcyBwb3NzaWJsZSBpbiBvcmRlciB0byBibG9ja1xuICAgIC8vIG5hdGl2ZSBhY3Rpb25zIGxpa2UgZHJhZ2dpbmcgdGhlIHNlbGVjdGVkIHRleHQgb3IgaW1hZ2VzIHdpdGggdGhlIG1vdXNlLlxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICBpZiAoIXRoaXMuX2hhc1N0YXJ0ZWREcmFnZ2luZykge1xuICAgICAgY29uc3QgcG9pbnRlclBvc2l0aW9uID0gdGhpcy5fZ2V0UG9pbnRlclBvc2l0aW9uT25QYWdlKGV2ZW50KTtcbiAgICAgIGNvbnN0IGRpc3RhbmNlWCA9IE1hdGguYWJzKHBvaW50ZXJQb3NpdGlvbi54IC0gdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UueCk7XG4gICAgICBjb25zdCBkaXN0YW5jZVkgPSBNYXRoLmFicyhwb2ludGVyUG9zaXRpb24ueSAtIHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLnkpO1xuICAgICAgY29uc3QgaXNPdmVyVGhyZXNob2xkID0gZGlzdGFuY2VYICsgZGlzdGFuY2VZID49IHRoaXMuX2NvbmZpZy5kcmFnU3RhcnRUaHJlc2hvbGQ7XG5cbiAgICAgIC8vIE9ubHkgc3RhcnQgZHJhZ2dpbmcgYWZ0ZXIgdGhlIHVzZXIgaGFzIG1vdmVkIG1vcmUgdGhhbiB0aGUgbWluaW11bSBkaXN0YW5jZSBpbiBlaXRoZXJcbiAgICAgIC8vIGRpcmVjdGlvbi4gTm90ZSB0aGF0IHRoaXMgaXMgcHJlZmVycmFibGUgb3ZlciBkb2luZyBzb21ldGhpbmcgbGlrZSBgc2tpcChtaW5pbXVtRGlzdGFuY2UpYFxuICAgICAgLy8gaW4gdGhlIGBwb2ludGVyTW92ZWAgc3Vic2NyaXB0aW9uLCBiZWNhdXNlIHdlJ3JlIG5vdCBndWFyYW50ZWVkIHRvIGhhdmUgb25lIG1vdmUgZXZlbnRcbiAgICAgIC8vIHBlciBwaXhlbCBvZiBtb3ZlbWVudCAoZS5nLiBpZiB0aGUgdXNlciBtb3ZlcyB0aGVpciBwb2ludGVyIHF1aWNrbHkpLlxuICAgICAgaWYgKGlzT3ZlclRocmVzaG9sZCkge1xuICAgICAgICBjb25zdCBpc0RlbGF5RWxhcHNlZCA9IERhdGUubm93KCkgPj0gdGhpcy5fZHJhZ1N0YXJ0VGltZSArIHRoaXMuX2dldERyYWdTdGFydERlbGF5KGV2ZW50KTtcbiAgICAgICAgaWYgKCFpc0RlbGF5RWxhcHNlZCkge1xuICAgICAgICAgIHRoaXMuX2VuZERyYWdTZXF1ZW5jZShldmVudCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHJldmVudCBvdGhlciBkcmFnIHNlcXVlbmNlcyBmcm9tIHN0YXJ0aW5nIHdoaWxlIHNvbWV0aGluZyBpbiB0aGUgY29udGFpbmVyIGlzIHN0aWxsXG4gICAgICAgIC8vIGJlaW5nIGRyYWdnZWQuIFRoaXMgY2FuIGhhcHBlbiB3aGlsZSB3ZSdyZSB3YWl0aW5nIGZvciB0aGUgZHJvcCBhbmltYXRpb24gdG8gZmluaXNoXG4gICAgICAgIC8vIGFuZCBjYW4gY2F1c2UgZXJyb3JzLCBiZWNhdXNlIHNvbWUgZWxlbWVudHMgbWlnaHQgc3RpbGwgYmUgbW92aW5nIGFyb3VuZC5cbiAgICAgICAgaWYgKCF0aGlzLl9kcm9wQ29udGFpbmVyIHx8ICF0aGlzLl9kcm9wQ29udGFpbmVyLmlzRHJhZ2dpbmcoKSkge1xuICAgICAgICAgIHRoaXMuX2hhc1N0YXJ0ZWREcmFnZ2luZyA9IHRydWU7XG4gICAgICAgICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiB0aGlzLl9zdGFydERyYWdTZXF1ZW5jZShldmVudCkpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBXZSBvbmx5IG5lZWQgdGhlIHByZXZpZXcgZGltZW5zaW9ucyBpZiB3ZSBoYXZlIGEgYm91bmRhcnkgZWxlbWVudC5cbiAgICBpZiAodGhpcy5fYm91bmRhcnlFbGVtZW50KSB7XG4gICAgICAvLyBDYWNoZSB0aGUgcHJldmlldyBlbGVtZW50IHJlY3QgaWYgd2UgaGF2ZW4ndCBjYWNoZWQgaXQgYWxyZWFkeSBvciBpZlxuICAgICAgLy8gd2UgY2FjaGVkIGl0IHRvbyBlYXJseSBiZWZvcmUgdGhlIGVsZW1lbnQgZGltZW5zaW9ucyB3ZXJlIGNvbXB1dGVkLlxuICAgICAgaWYgKCF0aGlzLl9wcmV2aWV3UmVjdCB8fCAoIXRoaXMuX3ByZXZpZXdSZWN0LndpZHRoICYmICF0aGlzLl9wcmV2aWV3UmVjdC5oZWlnaHQpKSB7XG4gICAgICAgIHRoaXMuX3ByZXZpZXdSZWN0ID0gKHRoaXMuX3ByZXZpZXcgfHwgdGhpcy5fcm9vdEVsZW1lbnQpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGNvbnN0cmFpbmVkUG9pbnRlclBvc2l0aW9uID0gdGhpcy5fZ2V0Q29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24oZXZlbnQpO1xuICAgIHRoaXMuX2hhc01vdmVkID0gdHJ1ZTtcbiAgICB0aGlzLl91cGRhdGVQb2ludGVyRGlyZWN0aW9uRGVsdGEoY29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24pO1xuXG4gICAgaWYgKHRoaXMuX2Ryb3BDb250YWluZXIpIHtcbiAgICAgIHRoaXMuX3VwZGF0ZUFjdGl2ZURyb3BDb250YWluZXIoY29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBhY3RpdmVUcmFuc2Zvcm0gPSB0aGlzLl9hY3RpdmVUcmFuc2Zvcm07XG4gICAgICBhY3RpdmVUcmFuc2Zvcm0ueCA9XG4gICAgICAgICAgY29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24ueCAtIHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLnggKyB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtLng7XG4gICAgICBhY3RpdmVUcmFuc2Zvcm0ueSA9XG4gICAgICAgICAgY29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24ueSAtIHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLnkgKyB0aGlzLl9wYXNzaXZlVHJhbnNmb3JtLnk7XG5cbiAgICAgIHRoaXMuX2FwcGx5Um9vdEVsZW1lbnRUcmFuc2Zvcm0oYWN0aXZlVHJhbnNmb3JtLngsIGFjdGl2ZVRyYW5zZm9ybS55KTtcblxuICAgICAgLy8gQXBwbHkgdHJhbnNmb3JtIGFzIGF0dHJpYnV0ZSBpZiBkcmFnZ2luZyBhbmQgc3ZnIGVsZW1lbnQgdG8gd29yayBmb3IgSUVcbiAgICAgIGlmICh0eXBlb2YgU1ZHRWxlbWVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5fcm9vdEVsZW1lbnQgaW5zdGFuY2VvZiBTVkdFbGVtZW50KSB7XG4gICAgICAgIGNvbnN0IGFwcGxpZWRUcmFuc2Zvcm0gPSBgdHJhbnNsYXRlKCR7YWN0aXZlVHJhbnNmb3JtLnh9ICR7YWN0aXZlVHJhbnNmb3JtLnl9KWA7XG4gICAgICAgIHRoaXMuX3Jvb3RFbGVtZW50LnNldEF0dHJpYnV0ZSgndHJhbnNmb3JtJywgYXBwbGllZFRyYW5zZm9ybSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gU2luY2UgdGhpcyBldmVudCBnZXRzIGZpcmVkIGZvciBldmVyeSBwaXhlbCB3aGlsZSBkcmFnZ2luZywgd2Ugb25seVxuICAgIC8vIHdhbnQgdG8gZmlyZSBpdCBpZiB0aGUgY29uc3VtZXIgb3B0ZWQgaW50byBpdC4gQWxzbyB3ZSBoYXZlIHRvXG4gICAgLy8gcmUtZW50ZXIgdGhlIHpvbmUgYmVjYXVzZSB3ZSBydW4gYWxsIG9mIHRoZSBldmVudHMgb24gdGhlIG91dHNpZGUuXG4gICAgaWYgKHRoaXMuX21vdmVFdmVudHMub2JzZXJ2ZXJzLmxlbmd0aCkge1xuICAgICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiB7XG4gICAgICAgIHRoaXMuX21vdmVFdmVudHMubmV4dCh7XG4gICAgICAgICAgc291cmNlOiB0aGlzLFxuICAgICAgICAgIHBvaW50ZXJQb3NpdGlvbjogY29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24sXG4gICAgICAgICAgZXZlbnQsXG4gICAgICAgICAgZGlzdGFuY2U6IHRoaXMuX2dldERyYWdEaXN0YW5jZShjb25zdHJhaW5lZFBvaW50ZXJQb3NpdGlvbiksXG4gICAgICAgICAgZGVsdGE6IHRoaXMuX3BvaW50ZXJEaXJlY3Rpb25EZWx0YVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBIYW5kbGVyIHRoYXQgaXMgaW52b2tlZCB3aGVuIHRoZSB1c2VyIGxpZnRzIHRoZWlyIHBvaW50ZXIgdXAsIGFmdGVyIGluaXRpYXRpbmcgYSBkcmFnLiAqL1xuICBwcml2YXRlIF9wb2ludGVyVXAgPSAoZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KSA9PiB7XG4gICAgdGhpcy5fZW5kRHJhZ1NlcXVlbmNlKGV2ZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgc3Vic2NyaXB0aW9ucyBhbmQgc3RvcHMgdGhlIGRyYWdnaW5nIHNlcXVlbmNlLlxuICAgKiBAcGFyYW0gZXZlbnQgQnJvd3NlciBldmVudCBvYmplY3QgdGhhdCBlbmRlZCB0aGUgc2VxdWVuY2UuXG4gICAqL1xuICBwcml2YXRlIF9lbmREcmFnU2VxdWVuY2UoZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KSB7XG4gICAgLy8gTm90ZSB0aGF0IGhlcmUgd2UgdXNlIGBpc0RyYWdnaW5nYCBmcm9tIHRoZSBzZXJ2aWNlLCByYXRoZXIgdGhhbiBmcm9tIGB0aGlzYC5cbiAgICAvLyBUaGUgZGlmZmVyZW5jZSBpcyB0aGF0IHRoZSBvbmUgZnJvbSB0aGUgc2VydmljZSByZWZsZWN0cyB3aGV0aGVyIGEgZHJhZ2dpbmcgc2VxdWVuY2VcbiAgICAvLyBoYXMgYmVlbiBpbml0aWF0ZWQsIHdoZXJlYXMgdGhlIG9uZSBvbiBgdGhpc2AgaW5jbHVkZXMgd2hldGhlciB0aGUgdXNlciBoYXMgcGFzc2VkXG4gICAgLy8gdGhlIG1pbmltdW0gZHJhZ2dpbmcgdGhyZXNob2xkLlxuICAgIGlmICghdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeS5pc0RyYWdnaW5nKHRoaXMpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fcmVtb3ZlU3Vic2NyaXB0aW9ucygpO1xuICAgIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuc3RvcERyYWdnaW5nKHRoaXMpO1xuICAgIHRoaXMuX3RvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMoKTtcblxuICAgIGlmICh0aGlzLl9oYW5kbGVzKSB7XG4gICAgICB0aGlzLl9yb290RWxlbWVudC5zdHlsZS53ZWJraXRUYXBIaWdobGlnaHRDb2xvciA9IHRoaXMuX3Jvb3RFbGVtZW50VGFwSGlnaGxpZ2h0O1xuICAgIH1cblxuICAgIGlmICghdGhpcy5faGFzU3RhcnRlZERyYWdnaW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5yZWxlYXNlZC5uZXh0KHtzb3VyY2U6IHRoaXN9KTtcblxuICAgIGlmICh0aGlzLl9kcm9wQ29udGFpbmVyKSB7XG4gICAgICAvLyBTdG9wIHNjcm9sbGluZyBpbW1lZGlhdGVseSwgaW5zdGVhZCBvZiB3YWl0aW5nIGZvciB0aGUgYW5pbWF0aW9uIHRvIGZpbmlzaC5cbiAgICAgIHRoaXMuX2Ryb3BDb250YWluZXIuX3N0b3BTY3JvbGxpbmcoKTtcbiAgICAgIHRoaXMuX2FuaW1hdGVQcmV2aWV3VG9QbGFjZWhvbGRlcigpLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLl9jbGVhbnVwRHJhZ0FydGlmYWN0cyhldmVudCk7XG4gICAgICAgIHRoaXMuX2NsZWFudXBDYWNoZWREaW1lbnNpb25zKCk7XG4gICAgICAgIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuc3RvcERyYWdnaW5nKHRoaXMpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIENvbnZlcnQgdGhlIGFjdGl2ZSB0cmFuc2Zvcm0gaW50byBhIHBhc3NpdmUgb25lLiBUaGlzIG1lYW5zIHRoYXQgbmV4dCB0aW1lXG4gICAgICAvLyB0aGUgdXNlciBzdGFydHMgZHJhZ2dpbmcgdGhlIGl0ZW0sIGl0cyBwb3NpdGlvbiB3aWxsIGJlIGNhbGN1bGF0ZWQgcmVsYXRpdmVseVxuICAgICAgLy8gdG8gdGhlIG5ldyBwYXNzaXZlIHRyYW5zZm9ybS5cbiAgICAgIHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm0ueCA9IHRoaXMuX2FjdGl2ZVRyYW5zZm9ybS54O1xuICAgICAgdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybS55ID0gdGhpcy5fYWN0aXZlVHJhbnNmb3JtLnk7XG4gICAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5lbmRlZC5uZXh0KHtcbiAgICAgICAgICBzb3VyY2U6IHRoaXMsXG4gICAgICAgICAgZGlzdGFuY2U6IHRoaXMuX2dldERyYWdEaXN0YW5jZSh0aGlzLl9nZXRQb2ludGVyUG9zaXRpb25PblBhZ2UoZXZlbnQpKVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5fY2xlYW51cENhY2hlZERpbWVuc2lvbnMoKTtcbiAgICAgIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkuc3RvcERyYWdnaW5nKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTdGFydHMgdGhlIGRyYWdnaW5nIHNlcXVlbmNlLiAqL1xuICBwcml2YXRlIF9zdGFydERyYWdTZXF1ZW5jZShldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpIHtcbiAgICAvLyBFbWl0IHRoZSBldmVudCBvbiB0aGUgaXRlbSBiZWZvcmUgdGhlIG9uZSBvbiB0aGUgY29udGFpbmVyLlxuICAgIHRoaXMuc3RhcnRlZC5uZXh0KHtzb3VyY2U6IHRoaXN9KTtcblxuICAgIGlmIChpc1RvdWNoRXZlbnQoZXZlbnQpKSB7XG4gICAgICB0aGlzLl9sYXN0VG91Y2hFdmVudFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIH1cblxuICAgIHRoaXMuX3RvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMoKTtcblxuICAgIGlmICh0aGlzLl9kcm9wQ29udGFpbmVyKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fcm9vdEVsZW1lbnQ7XG5cbiAgICAgIC8vIEdyYWIgdGhlIGBuZXh0U2libGluZ2AgYmVmb3JlIHRoZSBwcmV2aWV3IGFuZCBwbGFjZWhvbGRlclxuICAgICAgLy8gaGF2ZSBiZWVuIGNyZWF0ZWQgc28gd2UgZG9uJ3QgZ2V0IHRoZSBwcmV2aWV3IGJ5IGFjY2lkZW50LlxuICAgICAgdGhpcy5fbmV4dFNpYmxpbmcgPSBlbGVtZW50Lm5leHRTaWJsaW5nO1xuXG4gICAgICBjb25zdCBwcmV2aWV3ID0gdGhpcy5fcHJldmlldyA9IHRoaXMuX2NyZWF0ZVByZXZpZXdFbGVtZW50KCk7XG4gICAgICBjb25zdCBwbGFjZWhvbGRlciA9IHRoaXMuX3BsYWNlaG9sZGVyID0gdGhpcy5fY3JlYXRlUGxhY2Vob2xkZXJFbGVtZW50KCk7XG5cbiAgICAgIC8vIFdlIG1vdmUgdGhlIGVsZW1lbnQgb3V0IGF0IHRoZSBlbmQgb2YgdGhlIGJvZHkgYW5kIHdlIG1ha2UgaXQgaGlkZGVuLCBiZWNhdXNlIGtlZXBpbmcgaXQgaW5cbiAgICAgIC8vIHBsYWNlIHdpbGwgdGhyb3cgb2ZmIHRoZSBjb25zdW1lcidzIGA6bGFzdC1jaGlsZGAgc2VsZWN0b3JzLiBXZSBjYW4ndCByZW1vdmUgdGhlIGVsZW1lbnRcbiAgICAgIC8vIGZyb20gdGhlIERPTSBjb21wbGV0ZWx5LCBiZWNhdXNlIGlPUyB3aWxsIHN0b3AgZmlyaW5nIGFsbCBzdWJzZXF1ZW50IGV2ZW50cyBpbiB0aGUgY2hhaW4uXG4gICAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICB0aGlzLl9kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGVsZW1lbnQucGFyZW50Tm9kZSEucmVwbGFjZUNoaWxkKHBsYWNlaG9sZGVyLCBlbGVtZW50KSk7XG4gICAgICBnZXRQcmV2aWV3SW5zZXJ0aW9uUG9pbnQodGhpcy5fZG9jdW1lbnQpLmFwcGVuZENoaWxkKHByZXZpZXcpO1xuICAgICAgdGhpcy5fZHJvcENvbnRhaW5lci5zdGFydCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIHRoZSBkaWZmZXJlbnQgdmFyaWFibGVzIGFuZCBzdWJzY3JpcHRpb25zXG4gICAqIHRoYXQgd2lsbCBiZSBuZWNlc3NhcnkgZm9yIHRoZSBkcmFnZ2luZyBzZXF1ZW5jZS5cbiAgICogQHBhcmFtIHJlZmVyZW5jZUVsZW1lbnQgRWxlbWVudCB0aGF0IHN0YXJ0ZWQgdGhlIGRyYWcgc2VxdWVuY2UuXG4gICAqIEBwYXJhbSBldmVudCBCcm93c2VyIGV2ZW50IG9iamVjdCB0aGF0IHN0YXJ0ZWQgdGhlIHNlcXVlbmNlLlxuICAgKi9cbiAgcHJpdmF0ZSBfaW5pdGlhbGl6ZURyYWdTZXF1ZW5jZShyZWZlcmVuY2VFbGVtZW50OiBIVE1MRWxlbWVudCwgZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KSB7XG4gICAgLy8gQWx3YXlzIHN0b3AgcHJvcGFnYXRpb24gZm9yIHRoZSBldmVudCB0aGF0IGluaXRpYWxpemVzXG4gICAgLy8gdGhlIGRyYWdnaW5nIHNlcXVlbmNlLCBpbiBvcmRlciB0byBwcmV2ZW50IGl0IGZyb20gcG90ZW50aWFsbHlcbiAgICAvLyBzdGFydGluZyBhbm90aGVyIHNlcXVlbmNlIGZvciBhIGRyYWdnYWJsZSBwYXJlbnQgc29tZXdoZXJlIHVwIHRoZSBET00gdHJlZS5cbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgIGNvbnN0IGlzRHJhZ2dpbmcgPSB0aGlzLmlzRHJhZ2dpbmcoKTtcbiAgICBjb25zdCBpc1RvdWNoU2VxdWVuY2UgPSBpc1RvdWNoRXZlbnQoZXZlbnQpO1xuICAgIGNvbnN0IGlzQXV4aWxpYXJ5TW91c2VCdXR0b24gPSAhaXNUb3VjaFNlcXVlbmNlICYmIChldmVudCBhcyBNb3VzZUV2ZW50KS5idXR0b24gIT09IDA7XG4gICAgY29uc3Qgcm9vdEVsZW1lbnQgPSB0aGlzLl9yb290RWxlbWVudDtcbiAgICBjb25zdCBpc1N5bnRoZXRpY0V2ZW50ID0gIWlzVG91Y2hTZXF1ZW5jZSAmJiB0aGlzLl9sYXN0VG91Y2hFdmVudFRpbWUgJiZcbiAgICAgIHRoaXMuX2xhc3RUb3VjaEV2ZW50VGltZSArIE1PVVNFX0VWRU5UX0lHTk9SRV9USU1FID4gRGF0ZS5ub3coKTtcblxuICAgIC8vIElmIHRoZSBldmVudCBzdGFydGVkIGZyb20gYW4gZWxlbWVudCB3aXRoIHRoZSBuYXRpdmUgSFRNTCBkcmFnJmRyb3AsIGl0J2xsIGludGVyZmVyZVxuICAgIC8vIHdpdGggb3VyIG93biBkcmFnZ2luZyAoZS5nLiBgaW1nYCB0YWdzIGRvIGl0IGJ5IGRlZmF1bHQpLiBQcmV2ZW50IHRoZSBkZWZhdWx0IGFjdGlvblxuICAgIC8vIHRvIHN0b3AgaXQgZnJvbSBoYXBwZW5pbmcuIE5vdGUgdGhhdCBwcmV2ZW50aW5nIG9uIGBkcmFnc3RhcnRgIGFsc28gc2VlbXMgdG8gd29yaywgYnV0XG4gICAgLy8gaXQncyBmbGFreSBhbmQgaXQgZmFpbHMgaWYgdGhlIHVzZXIgZHJhZ3MgaXQgYXdheSBxdWlja2x5LiBBbHNvIG5vdGUgdGhhdCB3ZSBvbmx5IHdhbnRcbiAgICAvLyB0byBkbyB0aGlzIGZvciBgbW91c2Vkb3duYCBzaW5jZSBkb2luZyB0aGUgc2FtZSBmb3IgYHRvdWNoc3RhcnRgIHdpbGwgc3RvcCBhbnkgYGNsaWNrYFxuICAgIC8vIGV2ZW50cyBmcm9tIGZpcmluZyBvbiB0b3VjaCBkZXZpY2VzLlxuICAgIGlmIChldmVudC50YXJnZXQgJiYgKGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudCkuZHJhZ2dhYmxlICYmIGV2ZW50LnR5cGUgPT09ICdtb3VzZWRvd24nKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cblxuICAgIC8vIEFib3J0IGlmIHRoZSB1c2VyIGlzIGFscmVhZHkgZHJhZ2dpbmcgb3IgaXMgdXNpbmcgYSBtb3VzZSBidXR0b24gb3RoZXIgdGhhbiB0aGUgcHJpbWFyeSBvbmUuXG4gICAgaWYgKGlzRHJhZ2dpbmcgfHwgaXNBdXhpbGlhcnlNb3VzZUJ1dHRvbiB8fCBpc1N5bnRoZXRpY0V2ZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSWYgd2UndmUgZ290IGhhbmRsZXMsIHdlIG5lZWQgdG8gZGlzYWJsZSB0aGUgdGFwIGhpZ2hsaWdodCBvbiB0aGUgZW50aXJlIHJvb3QgZWxlbWVudCxcbiAgICAvLyBvdGhlcndpc2UgaU9TIHdpbGwgc3RpbGwgYWRkIGl0LCBldmVuIHRob3VnaCBhbGwgdGhlIGRyYWcgaW50ZXJhY3Rpb25zIG9uIHRoZSBoYW5kbGVcbiAgICAvLyBhcmUgZGlzYWJsZWQuXG4gICAgaWYgKHRoaXMuX2hhbmRsZXMubGVuZ3RoKSB7XG4gICAgICB0aGlzLl9yb290RWxlbWVudFRhcEhpZ2hsaWdodCA9IHJvb3RFbGVtZW50LnN0eWxlLndlYmtpdFRhcEhpZ2hsaWdodENvbG9yO1xuICAgICAgcm9vdEVsZW1lbnQuc3R5bGUud2Via2l0VGFwSGlnaGxpZ2h0Q29sb3IgPSAndHJhbnNwYXJlbnQnO1xuICAgIH1cblxuICAgIHRoaXMuX2hhc1N0YXJ0ZWREcmFnZ2luZyA9IHRoaXMuX2hhc01vdmVkID0gZmFsc2U7XG4gICAgdGhpcy5faW5pdGlhbENvbnRhaW5lciA9IHRoaXMuX2Ryb3BDb250YWluZXIhO1xuXG4gICAgLy8gQXZvaWQgbXVsdGlwbGUgc3Vic2NyaXB0aW9ucyBhbmQgbWVtb3J5IGxlYWtzIHdoZW4gbXVsdGkgdG91Y2hcbiAgICAvLyAoaXNEcmFnZ2luZyBjaGVjayBhYm92ZSBpc24ndCBlbm91Z2ggYmVjYXVzZSBvZiBwb3NzaWJsZSB0ZW1wb3JhbCBhbmQvb3IgZGltZW5zaW9uYWwgZGVsYXlzKVxuICAgIHRoaXMuX3JlbW92ZVN1YnNjcmlwdGlvbnMoKTtcbiAgICB0aGlzLl9wb2ludGVyTW92ZVN1YnNjcmlwdGlvbiA9IHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkucG9pbnRlck1vdmUuc3Vic2NyaWJlKHRoaXMuX3BvaW50ZXJNb3ZlKTtcbiAgICB0aGlzLl9wb2ludGVyVXBTdWJzY3JpcHRpb24gPSB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnBvaW50ZXJVcC5zdWJzY3JpYmUodGhpcy5fcG9pbnRlclVwKTtcbiAgICB0aGlzLl9zY3JvbGxTdWJzY3JpcHRpb24gPSB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnNjcm9sbC5waXBlKHN0YXJ0V2l0aChudWxsKSkuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIHRoaXMuX3Njcm9sbFBvc2l0aW9uID0gdGhpcy5fdmlld3BvcnRSdWxlci5nZXRWaWV3cG9ydFNjcm9sbFBvc2l0aW9uKCk7XG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy5fYm91bmRhcnlFbGVtZW50KSB7XG4gICAgICB0aGlzLl9ib3VuZGFyeVJlY3QgPSB0aGlzLl9ib3VuZGFyeUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgaGF2ZSBhIGN1c3RvbSBwcmV2aWV3IHRlbXBsYXRlLCB0aGUgZWxlbWVudCB3b24ndCBiZSB2aXNpYmxlIGFueXdheSBzbyB3ZSBhdm9pZCB0aGVcbiAgICAvLyBleHRyYSBgZ2V0Qm91bmRpbmdDbGllbnRSZWN0YCBjYWxscyBhbmQganVzdCBtb3ZlIHRoZSBwcmV2aWV3IG5leHQgdG8gdGhlIGN1cnNvci5cbiAgICB0aGlzLl9waWNrdXBQb3NpdGlvbkluRWxlbWVudCA9IHRoaXMuX3ByZXZpZXdUZW1wbGF0ZSAmJiB0aGlzLl9wcmV2aWV3VGVtcGxhdGUudGVtcGxhdGUgP1xuICAgICAge3g6IDAsIHk6IDB9IDpcbiAgICAgIHRoaXMuX2dldFBvaW50ZXJQb3NpdGlvbkluRWxlbWVudChyZWZlcmVuY2VFbGVtZW50LCBldmVudCk7XG4gICAgY29uc3QgcG9pbnRlclBvc2l0aW9uID0gdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UgPSB0aGlzLl9nZXRQb2ludGVyUG9zaXRpb25PblBhZ2UoZXZlbnQpO1xuICAgIHRoaXMuX3BvaW50ZXJEaXJlY3Rpb25EZWx0YSA9IHt4OiAwLCB5OiAwfTtcbiAgICB0aGlzLl9wb2ludGVyUG9zaXRpb25BdExhc3REaXJlY3Rpb25DaGFuZ2UgPSB7eDogcG9pbnRlclBvc2l0aW9uLngsIHk6IHBvaW50ZXJQb3NpdGlvbi55fTtcbiAgICB0aGlzLl9kcmFnU3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICB0aGlzLl9kcmFnRHJvcFJlZ2lzdHJ5LnN0YXJ0RHJhZ2dpbmcodGhpcywgZXZlbnQpO1xuICB9XG5cbiAgLyoqIENsZWFucyB1cCB0aGUgRE9NIGFydGlmYWN0cyB0aGF0IHdlcmUgYWRkZWQgdG8gZmFjaWxpdGF0ZSB0aGUgZWxlbWVudCBiZWluZyBkcmFnZ2VkLiAqL1xuICBwcml2YXRlIF9jbGVhbnVwRHJhZ0FydGlmYWN0cyhldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpIHtcbiAgICAvLyBSZXN0b3JlIHRoZSBlbGVtZW50J3MgdmlzaWJpbGl0eSBhbmQgaW5zZXJ0IGl0IGF0IGl0cyBvbGQgcG9zaXRpb24gaW4gdGhlIERPTS5cbiAgICAvLyBJdCdzIGltcG9ydGFudCB0aGF0IHdlIG1haW50YWluIHRoZSBwb3NpdGlvbiwgYmVjYXVzZSBtb3ZpbmcgdGhlIGVsZW1lbnQgYXJvdW5kIGluIHRoZSBET01cbiAgICAvLyBjYW4gdGhyb3cgb2ZmIGBOZ0ZvcmAgd2hpY2ggZG9lcyBzbWFydCBkaWZmaW5nIGFuZCByZS1jcmVhdGVzIGVsZW1lbnRzIG9ubHkgd2hlbiBuZWNlc3NhcnksXG4gICAgLy8gd2hpbGUgbW92aW5nIHRoZSBleGlzdGluZyBlbGVtZW50cyBpbiBhbGwgb3RoZXIgY2FzZXMuXG4gICAgdGhpcy5fcm9vdEVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICcnO1xuXG4gICAgaWYgKHRoaXMuX25leHRTaWJsaW5nKSB7XG4gICAgICB0aGlzLl9uZXh0U2libGluZy5wYXJlbnROb2RlIS5pbnNlcnRCZWZvcmUodGhpcy5fcm9vdEVsZW1lbnQsIHRoaXMuX25leHRTaWJsaW5nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29lcmNlRWxlbWVudCh0aGlzLl9pbml0aWFsQ29udGFpbmVyLmVsZW1lbnQpLmFwcGVuZENoaWxkKHRoaXMuX3Jvb3RFbGVtZW50KTtcbiAgICB9XG5cbiAgICB0aGlzLl9kZXN0cm95UHJldmlldygpO1xuICAgIHRoaXMuX2Rlc3Ryb3lQbGFjZWhvbGRlcigpO1xuICAgIHRoaXMuX2JvdW5kYXJ5UmVjdCA9IHRoaXMuX3ByZXZpZXdSZWN0ID0gdW5kZWZpbmVkO1xuXG4gICAgLy8gUmUtZW50ZXIgdGhlIE5nWm9uZSBzaW5jZSB3ZSBib3VuZCBgZG9jdW1lbnRgIGV2ZW50cyBvbiB0aGUgb3V0c2lkZS5cbiAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuX2Ryb3BDb250YWluZXIhO1xuICAgICAgY29uc3QgY3VycmVudEluZGV4ID0gY29udGFpbmVyLmdldEl0ZW1JbmRleCh0aGlzKTtcbiAgICAgIGNvbnN0IHBvaW50ZXJQb3NpdGlvbiA9IHRoaXMuX2dldFBvaW50ZXJQb3NpdGlvbk9uUGFnZShldmVudCk7XG4gICAgICBjb25zdCBkaXN0YW5jZSA9IHRoaXMuX2dldERyYWdEaXN0YW5jZSh0aGlzLl9nZXRQb2ludGVyUG9zaXRpb25PblBhZ2UoZXZlbnQpKTtcbiAgICAgIGNvbnN0IGlzUG9pbnRlck92ZXJDb250YWluZXIgPSBjb250YWluZXIuX2lzT3ZlckNvbnRhaW5lcihcbiAgICAgICAgcG9pbnRlclBvc2l0aW9uLngsIHBvaW50ZXJQb3NpdGlvbi55KTtcblxuICAgICAgdGhpcy5lbmRlZC5uZXh0KHtzb3VyY2U6IHRoaXMsIGRpc3RhbmNlfSk7XG4gICAgICB0aGlzLmRyb3BwZWQubmV4dCh7XG4gICAgICAgIGl0ZW06IHRoaXMsXG4gICAgICAgIGN1cnJlbnRJbmRleCxcbiAgICAgICAgcHJldmlvdXNJbmRleDogdGhpcy5faW5pdGlhbENvbnRhaW5lci5nZXRJdGVtSW5kZXgodGhpcyksXG4gICAgICAgIGNvbnRhaW5lcjogY29udGFpbmVyLFxuICAgICAgICBwcmV2aW91c0NvbnRhaW5lcjogdGhpcy5faW5pdGlhbENvbnRhaW5lcixcbiAgICAgICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcixcbiAgICAgICAgZGlzdGFuY2VcbiAgICAgIH0pO1xuICAgICAgY29udGFpbmVyLmRyb3AodGhpcywgY3VycmVudEluZGV4LCB0aGlzLl9pbml0aWFsQ29udGFpbmVyLCBpc1BvaW50ZXJPdmVyQ29udGFpbmVyLCBkaXN0YW5jZSk7XG4gICAgICB0aGlzLl9kcm9wQ29udGFpbmVyID0gdGhpcy5faW5pdGlhbENvbnRhaW5lcjtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBpdGVtJ3MgcG9zaXRpb24gaW4gaXRzIGRyb3AgY29udGFpbmVyLCBvciBtb3ZlcyBpdFxuICAgKiBpbnRvIGEgbmV3IG9uZSwgZGVwZW5kaW5nIG9uIGl0cyBjdXJyZW50IGRyYWcgcG9zaXRpb24uXG4gICAqL1xuICBwcml2YXRlIF91cGRhdGVBY3RpdmVEcm9wQ29udGFpbmVyKHt4LCB5fTogUG9pbnQpIHtcbiAgICAvLyBEcm9wIGNvbnRhaW5lciB0aGF0IGRyYWdnYWJsZSBoYXMgYmVlbiBtb3ZlZCBpbnRvLlxuICAgIGxldCBuZXdDb250YWluZXIgPSB0aGlzLl9pbml0aWFsQ29udGFpbmVyLl9nZXRTaWJsaW5nQ29udGFpbmVyRnJvbVBvc2l0aW9uKHRoaXMsIHgsIHkpO1xuXG4gICAgLy8gSWYgd2UgY291bGRuJ3QgZmluZCBhIG5ldyBjb250YWluZXIgdG8gbW92ZSB0aGUgaXRlbSBpbnRvLCBhbmQgdGhlIGl0ZW0gaGFzIGxlZnQgaXRzXG4gICAgLy8gaW5pdGlhbCBjb250YWluZXIsIGNoZWNrIHdoZXRoZXIgdGhlIGl0J3Mgb3ZlciB0aGUgaW5pdGlhbCBjb250YWluZXIuIFRoaXMgaGFuZGxlcyB0aGVcbiAgICAvLyBjYXNlIHdoZXJlIHR3byBjb250YWluZXJzIGFyZSBjb25uZWN0ZWQgb25lIHdheSBhbmQgdGhlIHVzZXIgdHJpZXMgdG8gdW5kbyBkcmFnZ2luZyBhblxuICAgIC8vIGl0ZW0gaW50byBhIG5ldyBjb250YWluZXIuXG4gICAgaWYgKCFuZXdDb250YWluZXIgJiYgdGhpcy5fZHJvcENvbnRhaW5lciAhPT0gdGhpcy5faW5pdGlhbENvbnRhaW5lciAmJlxuICAgICAgICB0aGlzLl9pbml0aWFsQ29udGFpbmVyLl9pc092ZXJDb250YWluZXIoeCwgeSkpIHtcbiAgICAgIG5ld0NvbnRhaW5lciA9IHRoaXMuX2luaXRpYWxDb250YWluZXI7XG4gICAgfVxuXG4gICAgaWYgKG5ld0NvbnRhaW5lciAmJiBuZXdDb250YWluZXIgIT09IHRoaXMuX2Ryb3BDb250YWluZXIpIHtcbiAgICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAvLyBOb3RpZnkgdGhlIG9sZCBjb250YWluZXIgdGhhdCB0aGUgaXRlbSBoYXMgbGVmdC5cbiAgICAgICAgdGhpcy5leGl0ZWQubmV4dCh7aXRlbTogdGhpcywgY29udGFpbmVyOiB0aGlzLl9kcm9wQ29udGFpbmVyIX0pO1xuICAgICAgICB0aGlzLl9kcm9wQ29udGFpbmVyIS5leGl0KHRoaXMpO1xuICAgICAgICAvLyBOb3RpZnkgdGhlIG5ldyBjb250YWluZXIgdGhhdCB0aGUgaXRlbSBoYXMgZW50ZXJlZC5cbiAgICAgICAgdGhpcy5fZHJvcENvbnRhaW5lciA9IG5ld0NvbnRhaW5lciE7XG4gICAgICAgIHRoaXMuX2Ryb3BDb250YWluZXIuZW50ZXIodGhpcywgeCwgeSk7XG4gICAgICAgIHRoaXMuZW50ZXJlZC5uZXh0KHtcbiAgICAgICAgICBpdGVtOiB0aGlzLFxuICAgICAgICAgIGNvbnRhaW5lcjogbmV3Q29udGFpbmVyISxcbiAgICAgICAgICBjdXJyZW50SW5kZXg6IG5ld0NvbnRhaW5lciEuZ2V0SXRlbUluZGV4KHRoaXMpXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGhpcy5fZHJvcENvbnRhaW5lciEuX3N0YXJ0U2Nyb2xsaW5nSWZOZWNlc3NhcnkoeCwgeSk7XG4gICAgdGhpcy5fZHJvcENvbnRhaW5lciEuX3NvcnRJdGVtKHRoaXMsIHgsIHksIHRoaXMuX3BvaW50ZXJEaXJlY3Rpb25EZWx0YSk7XG4gICAgdGhpcy5fcHJldmlldy5zdHlsZS50cmFuc2Zvcm0gPVxuICAgICAgICBnZXRUcmFuc2Zvcm0oeCAtIHRoaXMuX3BpY2t1cFBvc2l0aW9uSW5FbGVtZW50LngsIHkgLSB0aGlzLl9waWNrdXBQb3NpdGlvbkluRWxlbWVudC55KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIHRoZSBlbGVtZW50IHRoYXQgd2lsbCBiZSByZW5kZXJlZCBuZXh0IHRvIHRoZSB1c2VyJ3MgcG9pbnRlclxuICAgKiBhbmQgd2lsbCBiZSB1c2VkIGFzIGEgcHJldmlldyBvZiB0aGUgZWxlbWVudCB0aGF0IGlzIGJlaW5nIGRyYWdnZWQuXG4gICAqL1xuICBwcml2YXRlIF9jcmVhdGVQcmV2aWV3RWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3QgcHJldmlld0NvbmZpZyA9IHRoaXMuX3ByZXZpZXdUZW1wbGF0ZTtcbiAgICBjb25zdCBwcmV2aWV3Q2xhc3MgPSB0aGlzLnByZXZpZXdDbGFzcztcbiAgICBjb25zdCBwcmV2aWV3VGVtcGxhdGUgPSBwcmV2aWV3Q29uZmlnID8gcHJldmlld0NvbmZpZy50ZW1wbGF0ZSA6IG51bGw7XG4gICAgbGV0IHByZXZpZXc6IEhUTUxFbGVtZW50O1xuXG4gICAgaWYgKHByZXZpZXdUZW1wbGF0ZSkge1xuICAgICAgY29uc3Qgdmlld1JlZiA9IHByZXZpZXdDb25maWchLnZpZXdDb250YWluZXIuY3JlYXRlRW1iZWRkZWRWaWV3KHByZXZpZXdUZW1wbGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmV2aWV3Q29uZmlnIS5jb250ZXh0KTtcbiAgICAgIHByZXZpZXcgPSBnZXRSb290Tm9kZSh2aWV3UmVmLCB0aGlzLl9kb2N1bWVudCk7XG4gICAgICB0aGlzLl9wcmV2aWV3UmVmID0gdmlld1JlZjtcbiAgICAgIHByZXZpZXcuc3R5bGUudHJhbnNmb3JtID1cbiAgICAgICAgICBnZXRUcmFuc2Zvcm0odGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UueCwgdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UueSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9yb290RWxlbWVudDtcbiAgICAgIGNvbnN0IGVsZW1lbnRSZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgICAgcHJldmlldyA9IGRlZXBDbG9uZU5vZGUoZWxlbWVudCk7XG4gICAgICBwcmV2aWV3LnN0eWxlLndpZHRoID0gYCR7ZWxlbWVudFJlY3Qud2lkdGh9cHhgO1xuICAgICAgcHJldmlldy5zdHlsZS5oZWlnaHQgPSBgJHtlbGVtZW50UmVjdC5oZWlnaHR9cHhgO1xuICAgICAgcHJldmlldy5zdHlsZS50cmFuc2Zvcm0gPSBnZXRUcmFuc2Zvcm0oZWxlbWVudFJlY3QubGVmdCwgZWxlbWVudFJlY3QudG9wKTtcbiAgICB9XG5cbiAgICBleHRlbmRTdHlsZXMocHJldmlldy5zdHlsZSwge1xuICAgICAgLy8gSXQncyBpbXBvcnRhbnQgdGhhdCB3ZSBkaXNhYmxlIHRoZSBwb2ludGVyIGV2ZW50cyBvbiB0aGUgcHJldmlldywgYmVjYXVzZVxuICAgICAgLy8gaXQgY2FuIHRocm93IG9mZiB0aGUgYGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnRgIGNhbGxzIGluIHRoZSBgQ2RrRHJvcExpc3RgLlxuICAgICAgcG9pbnRlckV2ZW50czogJ25vbmUnLFxuICAgICAgLy8gV2UgaGF2ZSB0byByZXNldCB0aGUgbWFyZ2luLCBiZWNhdXNlIGl0IGNhbiB0aHJvdyBvZmYgcG9zaXRpb25pbmcgcmVsYXRpdmUgdG8gdGhlIHZpZXdwb3J0LlxuICAgICAgbWFyZ2luOiAnMCcsXG4gICAgICBwb3NpdGlvbjogJ2ZpeGVkJyxcbiAgICAgIHRvcDogJzAnLFxuICAgICAgbGVmdDogJzAnLFxuICAgICAgekluZGV4OiAnMTAwMCdcbiAgICB9KTtcblxuICAgIHRvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMocHJldmlldywgZmFsc2UpO1xuICAgIHByZXZpZXcuY2xhc3NMaXN0LmFkZCgnY2RrLWRyYWctcHJldmlldycpO1xuICAgIHByZXZpZXcuc2V0QXR0cmlidXRlKCdkaXInLCB0aGlzLl9kaXJlY3Rpb24pO1xuXG4gICAgaWYgKHByZXZpZXdDbGFzcykge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkocHJldmlld0NsYXNzKSkge1xuICAgICAgICBwcmV2aWV3Q2xhc3MuZm9yRWFjaChjbGFzc05hbWUgPT4gcHJldmlldy5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJldmlldy5jbGFzc0xpc3QuYWRkKHByZXZpZXdDbGFzcyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHByZXZpZXc7XG4gIH1cblxuICAvKipcbiAgICogQW5pbWF0ZXMgdGhlIHByZXZpZXcgZWxlbWVudCBmcm9tIGl0cyBjdXJyZW50IHBvc2l0aW9uIHRvIHRoZSBsb2NhdGlvbiBvZiB0aGUgZHJvcCBwbGFjZWhvbGRlci5cbiAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIGFuaW1hdGlvbiBjb21wbGV0ZXMuXG4gICAqL1xuICBwcml2YXRlIF9hbmltYXRlUHJldmlld1RvUGxhY2Vob2xkZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gSWYgdGhlIHVzZXIgaGFzbid0IG1vdmVkIHlldCwgdGhlIHRyYW5zaXRpb25lbmQgZXZlbnQgd29uJ3QgZmlyZS5cbiAgICBpZiAoIXRoaXMuX2hhc01vdmVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgY29uc3QgcGxhY2Vob2xkZXJSZWN0ID0gdGhpcy5fcGxhY2Vob2xkZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAvLyBBcHBseSB0aGUgY2xhc3MgdGhhdCBhZGRzIGEgdHJhbnNpdGlvbiB0byB0aGUgcHJldmlldy5cbiAgICB0aGlzLl9wcmV2aWV3LmNsYXNzTGlzdC5hZGQoJ2Nkay1kcmFnLWFuaW1hdGluZycpO1xuXG4gICAgLy8gTW92ZSB0aGUgcHJldmlldyB0byB0aGUgcGxhY2Vob2xkZXIgcG9zaXRpb24uXG4gICAgdGhpcy5fcHJldmlldy5zdHlsZS50cmFuc2Zvcm0gPSBnZXRUcmFuc2Zvcm0ocGxhY2Vob2xkZXJSZWN0LmxlZnQsIHBsYWNlaG9sZGVyUmVjdC50b3ApO1xuXG4gICAgLy8gSWYgdGhlIGVsZW1lbnQgZG9lc24ndCBoYXZlIGEgYHRyYW5zaXRpb25gLCB0aGUgYHRyYW5zaXRpb25lbmRgIGV2ZW50IHdvbid0IGZpcmUuIFNpbmNlXG4gICAgLy8gd2UgbmVlZCB0byB0cmlnZ2VyIGEgc3R5bGUgcmVjYWxjdWxhdGlvbiBpbiBvcmRlciBmb3IgdGhlIGBjZGstZHJhZy1hbmltYXRpbmdgIGNsYXNzIHRvXG4gICAgLy8gYXBwbHkgaXRzIHN0eWxlLCB3ZSB0YWtlIGFkdmFudGFnZSBvZiB0aGUgYXZhaWxhYmxlIGluZm8gdG8gZmlndXJlIG91dCB3aGV0aGVyIHdlIG5lZWQgdG9cbiAgICAvLyBiaW5kIHRoZSBldmVudCBpbiB0aGUgZmlyc3QgcGxhY2UuXG4gICAgY29uc3QgZHVyYXRpb24gPSBnZXRUcmFuc2Zvcm1UcmFuc2l0aW9uRHVyYXRpb25Jbk1zKHRoaXMuX3ByZXZpZXcpO1xuXG4gICAgaWYgKGR1cmF0aW9uID09PSAwKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIGNvbnN0IGhhbmRsZXIgPSAoKGV2ZW50OiBUcmFuc2l0aW9uRXZlbnQpID0+IHtcbiAgICAgICAgICBpZiAoIWV2ZW50IHx8IChldmVudC50YXJnZXQgPT09IHRoaXMuX3ByZXZpZXcgJiYgZXZlbnQucHJvcGVydHlOYW1lID09PSAndHJhbnNmb3JtJykpIHtcbiAgICAgICAgICAgIHRoaXMuX3ByZXZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIGhhbmRsZXIpO1xuICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkgYXMgRXZlbnRMaXN0ZW5lck9yRXZlbnRMaXN0ZW5lck9iamVjdDtcblxuICAgICAgICAvLyBJZiBhIHRyYW5zaXRpb24gaXMgc2hvcnQgZW5vdWdoLCB0aGUgYnJvd3NlciBtaWdodCBub3QgZmlyZSB0aGUgYHRyYW5zaXRpb25lbmRgIGV2ZW50LlxuICAgICAgICAvLyBTaW5jZSB3ZSBrbm93IGhvdyBsb25nIGl0J3Mgc3VwcG9zZWQgdG8gdGFrZSwgYWRkIGEgdGltZW91dCB3aXRoIGEgNTAlIGJ1ZmZlciB0aGF0J2xsXG4gICAgICAgIC8vIGZpcmUgaWYgdGhlIHRyYW5zaXRpb24gaGFzbid0IGNvbXBsZXRlZCB3aGVuIGl0IHdhcyBzdXBwb3NlZCB0by5cbiAgICAgICAgY29uc3QgdGltZW91dCA9IHNldFRpbWVvdXQoaGFuZGxlciBhcyBGdW5jdGlvbiwgZHVyYXRpb24gKiAxLjUpO1xuICAgICAgICB0aGlzLl9wcmV2aWV3LmFkZEV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBoYW5kbGVyKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYW4gZWxlbWVudCB0aGF0IHdpbGwgYmUgc2hvd24gaW5zdGVhZCBvZiB0aGUgY3VycmVudCBlbGVtZW50IHdoaWxlIGRyYWdnaW5nLiAqL1xuICBwcml2YXRlIF9jcmVhdGVQbGFjZWhvbGRlckVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IHBsYWNlaG9sZGVyQ29uZmlnID0gdGhpcy5fcGxhY2Vob2xkZXJUZW1wbGF0ZTtcbiAgICBjb25zdCBwbGFjZWhvbGRlclRlbXBsYXRlID0gcGxhY2Vob2xkZXJDb25maWcgPyBwbGFjZWhvbGRlckNvbmZpZy50ZW1wbGF0ZSA6IG51bGw7XG4gICAgbGV0IHBsYWNlaG9sZGVyOiBIVE1MRWxlbWVudDtcblxuICAgIGlmIChwbGFjZWhvbGRlclRlbXBsYXRlKSB7XG4gICAgICB0aGlzLl9wbGFjZWhvbGRlclJlZiA9IHBsYWNlaG9sZGVyQ29uZmlnIS52aWV3Q29udGFpbmVyLmNyZWF0ZUVtYmVkZGVkVmlldyhcbiAgICAgICAgcGxhY2Vob2xkZXJUZW1wbGF0ZSxcbiAgICAgICAgcGxhY2Vob2xkZXJDb25maWchLmNvbnRleHRcbiAgICAgICk7XG4gICAgICBwbGFjZWhvbGRlciA9IGdldFJvb3ROb2RlKHRoaXMuX3BsYWNlaG9sZGVyUmVmLCB0aGlzLl9kb2N1bWVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBsYWNlaG9sZGVyID0gZGVlcENsb25lTm9kZSh0aGlzLl9yb290RWxlbWVudCk7XG4gICAgfVxuXG4gICAgcGxhY2Vob2xkZXIuY2xhc3NMaXN0LmFkZCgnY2RrLWRyYWctcGxhY2Vob2xkZXInKTtcbiAgICByZXR1cm4gcGxhY2Vob2xkZXI7XG4gIH1cblxuICAvKipcbiAgICogRmlndXJlcyBvdXQgdGhlIGNvb3JkaW5hdGVzIGF0IHdoaWNoIGFuIGVsZW1lbnQgd2FzIHBpY2tlZCB1cC5cbiAgICogQHBhcmFtIHJlZmVyZW5jZUVsZW1lbnQgRWxlbWVudCB0aGF0IGluaXRpYXRlZCB0aGUgZHJhZ2dpbmcuXG4gICAqIEBwYXJhbSBldmVudCBFdmVudCB0aGF0IGluaXRpYXRlZCB0aGUgZHJhZ2dpbmcuXG4gICAqL1xuICBwcml2YXRlIF9nZXRQb2ludGVyUG9zaXRpb25JbkVsZW1lbnQocmVmZXJlbmNlRWxlbWVudDogSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpOiBQb2ludCB7XG4gICAgY29uc3QgZWxlbWVudFJlY3QgPSB0aGlzLl9yb290RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCBoYW5kbGVFbGVtZW50ID0gcmVmZXJlbmNlRWxlbWVudCA9PT0gdGhpcy5fcm9vdEVsZW1lbnQgPyBudWxsIDogcmVmZXJlbmNlRWxlbWVudDtcbiAgICBjb25zdCByZWZlcmVuY2VSZWN0ID0gaGFuZGxlRWxlbWVudCA/IGhhbmRsZUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkgOiBlbGVtZW50UmVjdDtcbiAgICBjb25zdCBwb2ludCA9IGlzVG91Y2hFdmVudChldmVudCkgPyBldmVudC50YXJnZXRUb3VjaGVzWzBdIDogZXZlbnQ7XG4gICAgY29uc3QgeCA9IHBvaW50LnBhZ2VYIC0gcmVmZXJlbmNlUmVjdC5sZWZ0IC0gdGhpcy5fc2Nyb2xsUG9zaXRpb24ubGVmdDtcbiAgICBjb25zdCB5ID0gcG9pbnQucGFnZVkgLSByZWZlcmVuY2VSZWN0LnRvcCAtIHRoaXMuX3Njcm9sbFBvc2l0aW9uLnRvcDtcblxuICAgIHJldHVybiB7XG4gICAgICB4OiByZWZlcmVuY2VSZWN0LmxlZnQgLSBlbGVtZW50UmVjdC5sZWZ0ICsgeCxcbiAgICAgIHk6IHJlZmVyZW5jZVJlY3QudG9wIC0gZWxlbWVudFJlY3QudG9wICsgeVxuICAgIH07XG4gIH1cblxuICAvKiogRGV0ZXJtaW5lcyB0aGUgcG9pbnQgb2YgdGhlIHBhZ2UgdGhhdCB3YXMgdG91Y2hlZCBieSB0aGUgdXNlci4gKi9cbiAgcHJpdmF0ZSBfZ2V0UG9pbnRlclBvc2l0aW9uT25QYWdlKGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCk6IFBvaW50IHtcbiAgICAvLyBgdG91Y2hlc2Agd2lsbCBiZSBlbXB0eSBmb3Igc3RhcnQvZW5kIGV2ZW50cyBzbyB3ZSBoYXZlIHRvIGZhbGwgYmFjayB0byBgY2hhbmdlZFRvdWNoZXNgLlxuICAgIGNvbnN0IHBvaW50ID0gaXNUb3VjaEV2ZW50KGV2ZW50KSA/IChldmVudC50b3VjaGVzWzBdIHx8IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdKSA6IGV2ZW50O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IHBvaW50LnBhZ2VYIC0gdGhpcy5fc2Nyb2xsUG9zaXRpb24ubGVmdCxcbiAgICAgIHk6IHBvaW50LnBhZ2VZIC0gdGhpcy5fc2Nyb2xsUG9zaXRpb24udG9wXG4gICAgfTtcbiAgfVxuXG5cbiAgLyoqIEdldHMgdGhlIHBvaW50ZXIgcG9zaXRpb24gb24gdGhlIHBhZ2UsIGFjY291bnRpbmcgZm9yIGFueSBwb3NpdGlvbiBjb25zdHJhaW50cy4gKi9cbiAgcHJpdmF0ZSBfZ2V0Q29uc3RyYWluZWRQb2ludGVyUG9zaXRpb24oZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KTogUG9pbnQge1xuICAgIGNvbnN0IHBvaW50ID0gdGhpcy5fZ2V0UG9pbnRlclBvc2l0aW9uT25QYWdlKGV2ZW50KTtcbiAgICBjb25zdCBjb25zdHJhaW5lZFBvaW50ID0gdGhpcy5jb25zdHJhaW5Qb3NpdGlvbiA/IHRoaXMuY29uc3RyYWluUG9zaXRpb24ocG9pbnQsIHRoaXMpIDogcG9pbnQ7XG4gICAgY29uc3QgZHJvcENvbnRhaW5lckxvY2sgPSB0aGlzLl9kcm9wQ29udGFpbmVyID8gdGhpcy5fZHJvcENvbnRhaW5lci5sb2NrQXhpcyA6IG51bGw7XG5cbiAgICBpZiAodGhpcy5sb2NrQXhpcyA9PT0gJ3gnIHx8IGRyb3BDb250YWluZXJMb2NrID09PSAneCcpIHtcbiAgICAgIGNvbnN0cmFpbmVkUG9pbnQueSA9IHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLnk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmxvY2tBeGlzID09PSAneScgfHwgZHJvcENvbnRhaW5lckxvY2sgPT09ICd5Jykge1xuICAgICAgY29uc3RyYWluZWRQb2ludC54ID0gdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UueDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fYm91bmRhcnlSZWN0KSB7XG4gICAgICBjb25zdCB7eDogcGlja3VwWCwgeTogcGlja3VwWX0gPSB0aGlzLl9waWNrdXBQb3NpdGlvbkluRWxlbWVudDtcbiAgICAgIGNvbnN0IGJvdW5kYXJ5UmVjdCA9IHRoaXMuX2JvdW5kYXJ5UmVjdDtcbiAgICAgIGNvbnN0IHByZXZpZXdSZWN0ID0gdGhpcy5fcHJldmlld1JlY3QhO1xuICAgICAgY29uc3QgbWluWSA9IGJvdW5kYXJ5UmVjdC50b3AgKyBwaWNrdXBZO1xuICAgICAgY29uc3QgbWF4WSA9IGJvdW5kYXJ5UmVjdC5ib3R0b20gLSAocHJldmlld1JlY3QuaGVpZ2h0IC0gcGlja3VwWSk7XG4gICAgICBjb25zdCBtaW5YID0gYm91bmRhcnlSZWN0LmxlZnQgKyBwaWNrdXBYO1xuICAgICAgY29uc3QgbWF4WCA9IGJvdW5kYXJ5UmVjdC5yaWdodCAtIChwcmV2aWV3UmVjdC53aWR0aCAtIHBpY2t1cFgpO1xuXG4gICAgICBjb25zdHJhaW5lZFBvaW50LnggPSBjbGFtcChjb25zdHJhaW5lZFBvaW50LngsIG1pblgsIG1heFgpO1xuICAgICAgY29uc3RyYWluZWRQb2ludC55ID0gY2xhbXAoY29uc3RyYWluZWRQb2ludC55LCBtaW5ZLCBtYXhZKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY29uc3RyYWluZWRQb2ludDtcbiAgfVxuXG5cbiAgLyoqIFVwZGF0ZXMgdGhlIGN1cnJlbnQgZHJhZyBkZWx0YSwgYmFzZWQgb24gdGhlIHVzZXIncyBjdXJyZW50IHBvaW50ZXIgcG9zaXRpb24gb24gdGhlIHBhZ2UuICovXG4gIHByaXZhdGUgX3VwZGF0ZVBvaW50ZXJEaXJlY3Rpb25EZWx0YShwb2ludGVyUG9zaXRpb25PblBhZ2U6IFBvaW50KSB7XG4gICAgY29uc3Qge3gsIHl9ID0gcG9pbnRlclBvc2l0aW9uT25QYWdlO1xuICAgIGNvbnN0IGRlbHRhID0gdGhpcy5fcG9pbnRlckRpcmVjdGlvbkRlbHRhO1xuICAgIGNvbnN0IHBvc2l0aW9uU2luY2VMYXN0Q2hhbmdlID0gdGhpcy5fcG9pbnRlclBvc2l0aW9uQXRMYXN0RGlyZWN0aW9uQ2hhbmdlO1xuXG4gICAgLy8gQW1vdW50IG9mIHBpeGVscyB0aGUgdXNlciBoYXMgZHJhZ2dlZCBzaW5jZSB0aGUgbGFzdCB0aW1lIHRoZSBkaXJlY3Rpb24gY2hhbmdlZC5cbiAgICBjb25zdCBjaGFuZ2VYID0gTWF0aC5hYnMoeCAtIHBvc2l0aW9uU2luY2VMYXN0Q2hhbmdlLngpO1xuICAgIGNvbnN0IGNoYW5nZVkgPSBNYXRoLmFicyh5IC0gcG9zaXRpb25TaW5jZUxhc3RDaGFuZ2UueSk7XG5cbiAgICAvLyBCZWNhdXNlIHdlIGhhbmRsZSBwb2ludGVyIGV2ZW50cyBvbiBhIHBlci1waXhlbCBiYXNpcywgd2UgZG9uJ3Qgd2FudCB0aGUgZGVsdGFcbiAgICAvLyB0byBjaGFuZ2UgZm9yIGV2ZXJ5IHBpeGVsLCBvdGhlcndpc2UgYW55dGhpbmcgdGhhdCBkZXBlbmRzIG9uIGl0IGNhbiBsb29rIGVycmF0aWMuXG4gICAgLy8gVG8gbWFrZSB0aGUgZGVsdGEgbW9yZSBjb25zaXN0ZW50LCB3ZSB0cmFjayBob3cgbXVjaCB0aGUgdXNlciBoYXMgbW92ZWQgc2luY2UgdGhlIGxhc3RcbiAgICAvLyBkZWx0YSBjaGFuZ2UgYW5kIHdlIG9ubHkgdXBkYXRlIGl0IGFmdGVyIGl0IGhhcyByZWFjaGVkIGEgY2VydGFpbiB0aHJlc2hvbGQuXG4gICAgaWYgKGNoYW5nZVggPiB0aGlzLl9jb25maWcucG9pbnRlckRpcmVjdGlvbkNoYW5nZVRocmVzaG9sZCkge1xuICAgICAgZGVsdGEueCA9IHggPiBwb3NpdGlvblNpbmNlTGFzdENoYW5nZS54ID8gMSA6IC0xO1xuICAgICAgcG9zaXRpb25TaW5jZUxhc3RDaGFuZ2UueCA9IHg7XG4gICAgfVxuXG4gICAgaWYgKGNoYW5nZVkgPiB0aGlzLl9jb25maWcucG9pbnRlckRpcmVjdGlvbkNoYW5nZVRocmVzaG9sZCkge1xuICAgICAgZGVsdGEueSA9IHkgPiBwb3NpdGlvblNpbmNlTGFzdENoYW5nZS55ID8gMSA6IC0xO1xuICAgICAgcG9zaXRpb25TaW5jZUxhc3RDaGFuZ2UueSA9IHk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlbHRhO1xuICB9XG5cbiAgLyoqIFRvZ2dsZXMgdGhlIG5hdGl2ZSBkcmFnIGludGVyYWN0aW9ucywgYmFzZWQgb24gaG93IG1hbnkgaGFuZGxlcyBhcmUgcmVnaXN0ZXJlZC4gKi9cbiAgcHJpdmF0ZSBfdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucygpIHtcbiAgICBpZiAoIXRoaXMuX3Jvb3RFbGVtZW50IHx8ICF0aGlzLl9oYW5kbGVzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc2hvdWxkRW5hYmxlID0gdGhpcy5faGFuZGxlcy5sZW5ndGggPiAwIHx8ICF0aGlzLmlzRHJhZ2dpbmcoKTtcblxuICAgIGlmIChzaG91bGRFbmFibGUgIT09IHRoaXMuX25hdGl2ZUludGVyYWN0aW9uc0VuYWJsZWQpIHtcbiAgICAgIHRoaXMuX25hdGl2ZUludGVyYWN0aW9uc0VuYWJsZWQgPSBzaG91bGRFbmFibGU7XG4gICAgICB0b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKHRoaXMuX3Jvb3RFbGVtZW50LCBzaG91bGRFbmFibGUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSZW1vdmVzIHRoZSBtYW51YWxseS1hZGRlZCBldmVudCBsaXN0ZW5lcnMgZnJvbSB0aGUgcm9vdCBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9yZW1vdmVSb290RWxlbWVudExpc3RlbmVycyhlbGVtZW50OiBIVE1MRWxlbWVudCkge1xuICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fcG9pbnRlckRvd24sIGFjdGl2ZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9wb2ludGVyRG93biwgcGFzc2l2ZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBsaWVzIGEgYHRyYW5zZm9ybWAgdG8gdGhlIHJvb3QgZWxlbWVudCwgdGFraW5nIGludG8gYWNjb3VudCBhbnkgZXhpc3RpbmcgdHJhbnNmb3JtcyBvbiBpdC5cbiAgICogQHBhcmFtIHggTmV3IHRyYW5zZm9ybSB2YWx1ZSBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0geSBOZXcgdHJhbnNmb3JtIHZhbHVlIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqL1xuICBwcml2YXRlIF9hcHBseVJvb3RFbGVtZW50VHJhbnNmb3JtKHg6IG51bWJlciwgeTogbnVtYmVyKSB7XG4gICAgY29uc3QgdHJhbnNmb3JtID0gZ2V0VHJhbnNmb3JtKHgsIHkpO1xuXG4gICAgLy8gQ2FjaGUgdGhlIHByZXZpb3VzIHRyYW5zZm9ybSBhbW91bnQgb25seSBhZnRlciB0aGUgZmlyc3QgZHJhZyBzZXF1ZW5jZSwgYmVjYXVzZVxuICAgIC8vIHdlIGRvbid0IHdhbnQgb3VyIG93biB0cmFuc2Zvcm1zIHRvIHN0YWNrIG9uIHRvcCBvZiBlYWNoIG90aGVyLlxuICAgIGlmICh0aGlzLl9pbml0aWFsVHJhbnNmb3JtID09IG51bGwpIHtcbiAgICAgIHRoaXMuX2luaXRpYWxUcmFuc2Zvcm0gPSB0aGlzLl9yb290RWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gfHwgJyc7XG4gICAgfVxuXG4gICAgLy8gUHJlc2VydmUgdGhlIHByZXZpb3VzIGB0cmFuc2Zvcm1gIHZhbHVlLCBpZiB0aGVyZSB3YXMgb25lLiBOb3RlIHRoYXQgd2UgYXBwbHkgb3VyIG93blxuICAgIC8vIHRyYW5zZm9ybSBiZWZvcmUgdGhlIHVzZXIncywgYmVjYXVzZSB0aGluZ3MgbGlrZSByb3RhdGlvbiBjYW4gYWZmZWN0IHdoaWNoIGRpcmVjdGlvblxuICAgIC8vIHRoZSBlbGVtZW50IHdpbGwgYmUgdHJhbnNsYXRlZCB0b3dhcmRzLlxuICAgIHRoaXMuX3Jvb3RFbGVtZW50LnN0eWxlLnRyYW5zZm9ybSA9IHRoaXMuX2luaXRpYWxUcmFuc2Zvcm0gP1xuICAgICAgdHJhbnNmb3JtICsgJyAnICsgdGhpcy5faW5pdGlhbFRyYW5zZm9ybSAgOiB0cmFuc2Zvcm07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZGlzdGFuY2UgdGhhdCB0aGUgdXNlciBoYXMgZHJhZ2dlZCBkdXJpbmcgdGhlIGN1cnJlbnQgZHJhZyBzZXF1ZW5jZS5cbiAgICogQHBhcmFtIGN1cnJlbnRQb3NpdGlvbiBDdXJyZW50IHBvc2l0aW9uIG9mIHRoZSB1c2VyJ3MgcG9pbnRlci5cbiAgICovXG4gIHByaXZhdGUgX2dldERyYWdEaXN0YW5jZShjdXJyZW50UG9zaXRpb246IFBvaW50KTogUG9pbnQge1xuICAgIGNvbnN0IHBpY2t1cFBvc2l0aW9uID0gdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2U7XG5cbiAgICBpZiAocGlja3VwUG9zaXRpb24pIHtcbiAgICAgIHJldHVybiB7eDogY3VycmVudFBvc2l0aW9uLnggLSBwaWNrdXBQb3NpdGlvbi54LCB5OiBjdXJyZW50UG9zaXRpb24ueSAtIHBpY2t1cFBvc2l0aW9uLnl9O1xuICAgIH1cblxuICAgIHJldHVybiB7eDogMCwgeTogMH07XG4gIH1cblxuICAvKiogQ2xlYW5zIHVwIGFueSBjYWNoZWQgZWxlbWVudCBkaW1lbnNpb25zIHRoYXQgd2UgZG9uJ3QgbmVlZCBhZnRlciBkcmFnZ2luZyBoYXMgc3RvcHBlZC4gKi9cbiAgcHJpdmF0ZSBfY2xlYW51cENhY2hlZERpbWVuc2lvbnMoKSB7XG4gICAgdGhpcy5fYm91bmRhcnlSZWN0ID0gdGhpcy5fcHJldmlld1JlY3QgPSB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGVsZW1lbnQgaXMgc3RpbGwgaW5zaWRlIGl0cyBib3VuZGFyeSBhZnRlciB0aGUgdmlld3BvcnQgaGFzIGJlZW4gcmVzaXplZC5cbiAgICogSWYgbm90LCB0aGUgcG9zaXRpb24gaXMgYWRqdXN0ZWQgc28gdGhhdCB0aGUgZWxlbWVudCBmaXRzIGFnYWluLlxuICAgKi9cbiAgcHJpdmF0ZSBfY29udGFpbkluc2lkZUJvdW5kYXJ5T25SZXNpemUoKSB7XG4gICAgbGV0IHt4LCB5fSA9IHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm07XG5cbiAgICBpZiAoKHggPT09IDAgJiYgeSA9PT0gMCkgfHwgdGhpcy5pc0RyYWdnaW5nKCkgfHwgIXRoaXMuX2JvdW5kYXJ5RWxlbWVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGJvdW5kYXJ5UmVjdCA9IHRoaXMuX2JvdW5kYXJ5RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCBlbGVtZW50UmVjdCA9IHRoaXMuX3Jvb3RFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgLy8gSXQncyBwb3NzaWJsZSB0aGF0IHRoZSBlbGVtZW50IGdvdCBoaWRkZW4gYXdheSBhZnRlciBkcmFnZ2luZyAoZS5nLiBieSBzd2l0Y2hpbmcgdG8gYVxuICAgIC8vIGRpZmZlcmVudCB0YWIpLiBEb24ndCBkbyBhbnl0aGluZyBpbiB0aGlzIGNhc2Ugc28gd2UgZG9uJ3QgY2xlYXIgdGhlIHVzZXIncyBwb3NpdGlvbi5cbiAgICBpZiAoKGJvdW5kYXJ5UmVjdC53aWR0aCA9PT0gMCAmJiBib3VuZGFyeVJlY3QuaGVpZ2h0ID09PSAwKSB8fFxuICAgICAgICAoZWxlbWVudFJlY3Qud2lkdGggPT09IDAgJiYgZWxlbWVudFJlY3QuaGVpZ2h0ID09PSAwKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGxlZnRPdmVyZmxvdyA9IGJvdW5kYXJ5UmVjdC5sZWZ0IC0gZWxlbWVudFJlY3QubGVmdDtcbiAgICBjb25zdCByaWdodE92ZXJmbG93ID0gZWxlbWVudFJlY3QucmlnaHQgLSBib3VuZGFyeVJlY3QucmlnaHQ7XG4gICAgY29uc3QgdG9wT3ZlcmZsb3cgPSBib3VuZGFyeVJlY3QudG9wIC0gZWxlbWVudFJlY3QudG9wO1xuICAgIGNvbnN0IGJvdHRvbU92ZXJmbG93ID0gZWxlbWVudFJlY3QuYm90dG9tIC0gYm91bmRhcnlSZWN0LmJvdHRvbTtcblxuICAgIC8vIElmIHRoZSBlbGVtZW50IGhhcyBiZWNvbWUgd2lkZXIgdGhhbiB0aGUgYm91bmRhcnksIHdlIGNhbid0XG4gICAgLy8gZG8gbXVjaCB0byBtYWtlIGl0IGZpdCBzbyB3ZSBqdXN0IGFuY2hvciBpdCB0byB0aGUgbGVmdC5cbiAgICBpZiAoYm91bmRhcnlSZWN0LndpZHRoID4gZWxlbWVudFJlY3Qud2lkdGgpIHtcbiAgICAgIGlmIChsZWZ0T3ZlcmZsb3cgPiAwKSB7XG4gICAgICAgIHggKz0gbGVmdE92ZXJmbG93O1xuICAgICAgfVxuXG4gICAgICBpZiAocmlnaHRPdmVyZmxvdyA+IDApIHtcbiAgICAgICAgeCAtPSByaWdodE92ZXJmbG93O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB4ID0gMDtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgZWxlbWVudCBoYXMgYmVjb21lIHRhbGxlciB0aGFuIHRoZSBib3VuZGFyeSwgd2UgY2FuJ3RcbiAgICAvLyBkbyBtdWNoIHRvIG1ha2UgaXQgZml0IHNvIHdlIGp1c3QgYW5jaG9yIGl0IHRvIHRoZSB0b3AuXG4gICAgaWYgKGJvdW5kYXJ5UmVjdC5oZWlnaHQgPiBlbGVtZW50UmVjdC5oZWlnaHQpIHtcbiAgICAgIGlmICh0b3BPdmVyZmxvdyA+IDApIHtcbiAgICAgICAgeSArPSB0b3BPdmVyZmxvdztcbiAgICAgIH1cblxuICAgICAgaWYgKGJvdHRvbU92ZXJmbG93ID4gMCkge1xuICAgICAgICB5IC09IGJvdHRvbU92ZXJmbG93O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB5ID0gMDtcbiAgICB9XG5cbiAgICBpZiAoeCAhPT0gdGhpcy5fcGFzc2l2ZVRyYW5zZm9ybS54IHx8IHkgIT09IHRoaXMuX3Bhc3NpdmVUcmFuc2Zvcm0ueSkge1xuICAgICAgdGhpcy5zZXRGcmVlRHJhZ1Bvc2l0aW9uKHt5LCB4fSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEdldHMgdGhlIGRyYWcgc3RhcnQgZGVsYXksIGJhc2VkIG9uIHRoZSBldmVudCB0eXBlLiAqL1xuICBwcml2YXRlIF9nZXREcmFnU3RhcnREZWxheShldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpOiBudW1iZXIge1xuICAgIGNvbnN0IHZhbHVlID0gdGhpcy5kcmFnU3RhcnREZWxheTtcblxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSBlbHNlIGlmIChpc1RvdWNoRXZlbnQoZXZlbnQpKSB7XG4gICAgICByZXR1cm4gdmFsdWUudG91Y2g7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlID8gdmFsdWUubW91c2UgOiAwO1xuICB9XG59XG5cbi8qKiBQb2ludCBvbiB0aGUgcGFnZSBvciB3aXRoaW4gYW4gZWxlbWVudC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUG9pbnQge1xuICB4OiBudW1iZXI7XG4gIHk6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBHZXRzIGEgM2QgYHRyYW5zZm9ybWAgdGhhdCBjYW4gYmUgYXBwbGllZCB0byBhbiBlbGVtZW50LlxuICogQHBhcmFtIHggRGVzaXJlZCBwb3NpdGlvbiBvZiB0aGUgZWxlbWVudCBhbG9uZyB0aGUgWCBheGlzLlxuICogQHBhcmFtIHkgRGVzaXJlZCBwb3NpdGlvbiBvZiB0aGUgZWxlbWVudCBhbG9uZyB0aGUgWSBheGlzLlxuICovXG5mdW5jdGlvbiBnZXRUcmFuc2Zvcm0oeDogbnVtYmVyLCB5OiBudW1iZXIpOiBzdHJpbmcge1xuICAvLyBSb3VuZCB0aGUgdHJhbnNmb3JtcyBzaW5jZSBzb21lIGJyb3dzZXJzIHdpbGxcbiAgLy8gYmx1ciB0aGUgZWxlbWVudHMgZm9yIHN1Yi1waXhlbCB0cmFuc2Zvcm1zLlxuICByZXR1cm4gYHRyYW5zbGF0ZTNkKCR7TWF0aC5yb3VuZCh4KX1weCwgJHtNYXRoLnJvdW5kKHkpfXB4LCAwKWA7XG59XG5cbi8qKiBDcmVhdGVzIGEgZGVlcCBjbG9uZSBvZiBhbiBlbGVtZW50LiAqL1xuZnVuY3Rpb24gZGVlcENsb25lTm9kZShub2RlOiBIVE1MRWxlbWVudCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgY2xvbmUgPSBub2RlLmNsb25lTm9kZSh0cnVlKSBhcyBIVE1MRWxlbWVudDtcbiAgY29uc3QgZGVzY2VuZGFudHNXaXRoSWQgPSBjbG9uZS5xdWVyeVNlbGVjdG9yQWxsKCdbaWRdJyk7XG4gIGNvbnN0IGRlc2NlbmRhbnRDYW52YXNlcyA9IG5vZGUucXVlcnlTZWxlY3RvckFsbCgnY2FudmFzJyk7XG5cbiAgLy8gUmVtb3ZlIHRoZSBgaWRgIHRvIGF2b2lkIGhhdmluZyBtdWx0aXBsZSBlbGVtZW50cyB3aXRoIHRoZSBzYW1lIGlkIG9uIHRoZSBwYWdlLlxuICBjbG9uZS5yZW1vdmVBdHRyaWJ1dGUoJ2lkJyk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZXNjZW5kYW50c1dpdGhJZC5sZW5ndGg7IGkrKykge1xuICAgIGRlc2NlbmRhbnRzV2l0aElkW2ldLnJlbW92ZUF0dHJpYnV0ZSgnaWQnKTtcbiAgfVxuXG4gIC8vIGBjbG9uZU5vZGVgIHdvbid0IHRyYW5zZmVyIHRoZSBjb250ZW50IG9mIGBjYW52YXNgIGVsZW1lbnRzIHNvIHdlIGhhdmUgdG8gZG8gaXQgb3Vyc2VsdmVzLlxuICAvLyBXZSBtYXRjaCB1cCB0aGUgY2xvbmVkIGNhbnZhcyB0byB0aGVpciBzb3VyY2VzIHVzaW5nIHRoZWlyIGluZGV4IGluIHRoZSBET00uXG4gIGlmIChkZXNjZW5kYW50Q2FudmFzZXMubGVuZ3RoKSB7XG4gICAgY29uc3QgY2xvbmVDYW52YXNlcyA9IGNsb25lLnF1ZXJ5U2VsZWN0b3JBbGwoJ2NhbnZhcycpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZXNjZW5kYW50Q2FudmFzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGNvcnJlc3BvbmRpbmdDbG9uZUNvbnRleHQgPSBjbG9uZUNhbnZhc2VzW2ldLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICAgIGlmIChjb3JyZXNwb25kaW5nQ2xvbmVDb250ZXh0KSB7XG4gICAgICAgIGNvcnJlc3BvbmRpbmdDbG9uZUNvbnRleHQuZHJhd0ltYWdlKGRlc2NlbmRhbnRDYW52YXNlc1tpXSwgMCwgMCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNsb25lO1xufVxuXG4vKiogQ2xhbXBzIGEgdmFsdWUgYmV0d2VlbiBhIG1pbmltdW0gYW5kIGEgbWF4aW11bS4gKi9cbmZ1bmN0aW9uIGNsYW1wKHZhbHVlOiBudW1iZXIsIG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcikge1xuICByZXR1cm4gTWF0aC5tYXgobWluLCBNYXRoLm1pbihtYXgsIHZhbHVlKSk7XG59XG5cbi8qKlxuICogSGVscGVyIHRvIHJlbW92ZSBhbiBlbGVtZW50IGZyb20gdGhlIERPTSBhbmQgdG8gZG8gYWxsIHRoZSBuZWNlc3NhcnkgbnVsbCBjaGVja3MuXG4gKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IHRvIGJlIHJlbW92ZWQuXG4gKi9cbmZ1bmN0aW9uIHJlbW92ZUVsZW1lbnQoZWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsKSB7XG4gIGlmIChlbGVtZW50ICYmIGVsZW1lbnQucGFyZW50Tm9kZSkge1xuICAgIGVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChlbGVtZW50KTtcbiAgfVxufVxuXG4vKiogRGV0ZXJtaW5lcyB3aGV0aGVyIGFuIGV2ZW50IGlzIGEgdG91Y2ggZXZlbnQuICovXG5mdW5jdGlvbiBpc1RvdWNoRXZlbnQoZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KTogZXZlbnQgaXMgVG91Y2hFdmVudCB7XG4gIC8vIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGZvciBldmVyeSBwaXhlbCB0aGF0IHRoZSB1c2VyIGhhcyBkcmFnZ2VkIHNvIHdlIG5lZWQgaXQgdG8gYmVcbiAgLy8gYXMgZmFzdCBhcyBwb3NzaWJsZS4gU2luY2Ugd2Ugb25seSBiaW5kIG1vdXNlIGV2ZW50cyBhbmQgdG91Y2ggZXZlbnRzLCB3ZSBjYW4gYXNzdW1lXG4gIC8vIHRoYXQgaWYgdGhlIGV2ZW50J3MgbmFtZSBzdGFydHMgd2l0aCBgdGAsIGl0J3MgYSB0b3VjaCBldmVudC5cbiAgcmV0dXJuIGV2ZW50LnR5cGVbMF0gPT09ICd0Jztcbn1cblxuLyoqIEdldHMgdGhlIGVsZW1lbnQgaW50byB3aGljaCB0aGUgZHJhZyBwcmV2aWV3IHNob3VsZCBiZSBpbnNlcnRlZC4gKi9cbmZ1bmN0aW9uIGdldFByZXZpZXdJbnNlcnRpb25Qb2ludChkb2N1bWVudFJlZjogYW55KTogSFRNTEVsZW1lbnQge1xuICAvLyBXZSBjYW4ndCB1c2UgdGhlIGJvZHkgaWYgdGhlIHVzZXIgaXMgaW4gZnVsbHNjcmVlbiBtb2RlLFxuICAvLyBiZWNhdXNlIHRoZSBwcmV2aWV3IHdpbGwgcmVuZGVyIHVuZGVyIHRoZSBmdWxsc2NyZWVuIGVsZW1lbnQuXG4gIC8vIFRPRE8oY3Jpc2JldG8pOiBkZWR1cGUgdGhpcyB3aXRoIHRoZSBgRnVsbHNjcmVlbk92ZXJsYXlDb250YWluZXJgIGV2ZW50dWFsbHkuXG4gIHJldHVybiBkb2N1bWVudFJlZi5mdWxsc2NyZWVuRWxlbWVudCB8fFxuICAgICAgICAgZG9jdW1lbnRSZWYud2Via2l0RnVsbHNjcmVlbkVsZW1lbnQgfHxcbiAgICAgICAgIGRvY3VtZW50UmVmLm1vekZ1bGxTY3JlZW5FbGVtZW50IHx8XG4gICAgICAgICBkb2N1bWVudFJlZi5tc0Z1bGxzY3JlZW5FbGVtZW50IHx8XG4gICAgICAgICBkb2N1bWVudFJlZi5ib2R5O1xufVxuXG4vKipcbiAqIEdldHMgdGhlIHJvb3QgSFRNTCBlbGVtZW50IG9mIGFuIGVtYmVkZGVkIHZpZXcuXG4gKiBJZiB0aGUgcm9vdCBpcyBub3QgYW4gSFRNTCBlbGVtZW50IGl0IGdldHMgd3JhcHBlZCBpbiBvbmUuXG4gKi9cbmZ1bmN0aW9uIGdldFJvb3ROb2RlKHZpZXdSZWY6IEVtYmVkZGVkVmlld1JlZjxhbnk+LCBfZG9jdW1lbnQ6IERvY3VtZW50KTogSFRNTEVsZW1lbnQge1xuICBjb25zdCByb290Tm9kZTogTm9kZSA9IHZpZXdSZWYucm9vdE5vZGVzWzBdO1xuXG4gIGlmIChyb290Tm9kZS5ub2RlVHlwZSAhPT0gX2RvY3VtZW50LkVMRU1FTlRfTk9ERSkge1xuICAgIGNvbnN0IHdyYXBwZXIgPSBfZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgd3JhcHBlci5hcHBlbmRDaGlsZChyb290Tm9kZSk7XG4gICAgcmV0dXJuIHdyYXBwZXI7XG4gIH1cblxuICByZXR1cm4gcm9vdE5vZGUgYXMgSFRNTEVsZW1lbnQ7XG59XG4iXX0=