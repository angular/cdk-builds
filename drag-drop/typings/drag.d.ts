/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directionality } from '@angular/cdk/bidi';
import { ViewportRuler } from '@angular/cdk/scrolling';
import { AfterViewInit, ElementRef, EventEmitter, InjectionToken, NgZone, OnDestroy, QueryList, ViewContainerRef } from '@angular/core';
import { Observable } from 'rxjs';
import { DragDropRegistry } from './drag-drop-registry';
import { CdkDragDrop, CdkDragEnd, CdkDragEnter, CdkDragExit, CdkDragMove, CdkDragStart } from './drag-events';
import { CdkDragHandle } from './drag-handle';
import { CdkDragPlaceholder } from './drag-placeholder';
import { CdkDragPreview } from './drag-preview';
import { CdkDropListContainer } from './drop-list-container';
/** Object that can be used to configure the behavior of CdkDrag. */
export interface CdkDragConfig {
    /**
     * Minimum amount of pixels that the user should
     * drag, before the CDK initiates a drag sequence.
     */
    dragStartThreshold: number;
    /**
     * Amount the pixels the user should drag before the CDK
     * considers them to have changed the drag direction.
     */
    pointerDirectionChangeThreshold: number;
}
/** Injection token that can be used to configure the behavior of `CdkDrag`. */
export declare const CDK_DRAG_CONFIG: InjectionToken<CdkDragConfig>;
/** @docs-private */
export declare function CDK_DRAG_CONFIG_FACTORY(): CdkDragConfig;
/** Element that can be moved inside a CdkDropList container. */
export declare class CdkDrag<T = any> implements AfterViewInit, OnDestroy {
    /** Element that the draggable is attached to. */
    element: ElementRef<HTMLElement>;
    /** Droppable container that the draggable is a part of. */
    dropContainer: CdkDropListContainer;
    private _ngZone;
    private _viewContainerRef;
    private _viewportRuler;
    private _dragDropRegistry;
    private _config;
    private _dir;
    private _document;
    /** Element displayed next to the user's pointer while the element is dragged. */
    private _preview;
    /** Reference to the view of the preview element. */
    private _previewRef;
    /** Reference to the view of the placeholder element. */
    private _placeholderRef;
    /** Element that is rendered instead of the draggable item while it is being sorted. */
    private _placeholder;
    /** Coordinates within the element at which the user picked up the element. */
    private _pickupPositionInElement;
    /** Coordinates on the page at which the user picked up the element. */
    private _pickupPositionOnPage;
    /**
     * Reference to the element that comes after the draggable in the DOM, at the time
     * it was picked up. Used for restoring its initial position when it's dropped.
     */
    private _nextSibling;
    /**
     * CSS `transform` applied to the element when it isn't being dragged. We need a
     * passive transform in order for the dragged element to retain its new position
     * after the user has stopped dragging and because we need to know the relative
     * position in case they start dragging again. This corresponds to `element.style.transform`.
     */
    private _passiveTransform;
    /** CSS `transform` that is applied to the element while it's being dragged. */
    private _activeTransform;
    /**
     * Whether the dragging sequence has been started. Doesn't
     * necessarily mean that the element has been moved.
     */
    _hasStartedDragging: boolean;
    /** Whether the element has moved since the user started dragging it. */
    private _hasMoved;
    /** Drop container in which the CdkDrag resided when dragging began. */
    private _initialContainer;
    /** Cached scroll position on the page when the element was picked up. */
    private _scrollPosition;
    /** Emits when the item is being moved. */
    private _moveEvents;
    /**
     * Amount of subscriptions to the move event. Used to avoid
     * hitting the zone if the consumer didn't subscribe to it.
     */
    private _moveEventSubscriptions;
    /** Keeps track of the direction in which the user is dragging along each axis. */
    private _pointerDirectionDelta;
    /** Pointer position at which the last change in the delta occurred. */
    private _pointerPositionAtLastDirectionChange;
    /** Root element that will be dragged by the user. */
    private _rootElement;
    /** Subscription to pointer movement events. */
    private _pointerMoveSubscription;
    /** Subscription to the event that is dispatched when the user lifts their pointer. */
    private _pointerUpSubscription;
    /** Elements that can be used to drag the draggable item. */
    _handles: QueryList<CdkDragHandle>;
    /** Element that will be used as a template to create the draggable item's preview. */
    _previewTemplate: CdkDragPreview;
    /** Template for placeholder element rendered to show where a draggable would be dropped. */
    _placeholderTemplate: CdkDragPlaceholder;
    /** Arbitrary data to attach to this drag instance. */
    data: T;
    /** Locks the position of the dragged element along the specified axis. */
    lockAxis: 'x' | 'y';
    /**
     * Selector that will be used to determine the root draggable element, starting from
     * the `cdkDrag` element and going up the DOM. Passing an alternate root element is useful
     * when trying to enable dragging on an element that you might not have access to.
     */
    rootElementSelector: string;
    /** Emits when the user starts dragging the item. */
    started: EventEmitter<CdkDragStart>;
    /** Emits when the user stops dragging an item in the container. */
    ended: EventEmitter<CdkDragEnd>;
    /** Emits when the user has moved the item into a new container. */
    entered: EventEmitter<CdkDragEnter<any>>;
    /** Emits when the user removes the item its container by dragging it into another container. */
    exited: EventEmitter<CdkDragExit<any>>;
    /** Emits when the user drops the item inside a container. */
    dropped: EventEmitter<CdkDragDrop<any>>;
    /**
     * Emits as the user is dragging the item. Use with caution,
     * because this event will fire for every pixel that the user has dragged.
     */
    moved: Observable<CdkDragMove<T>>;
    constructor(
    /** Element that the draggable is attached to. */
    element: ElementRef<HTMLElement>, 
    /** Droppable container that the draggable is a part of. */
    dropContainer: CdkDropListContainer, document: any, _ngZone: NgZone, _viewContainerRef: ViewContainerRef, _viewportRuler: ViewportRuler, _dragDropRegistry: DragDropRegistry<CdkDrag<T>, CdkDropListContainer>, _config: CdkDragConfig, _dir: Directionality);
    /**
     * Returns the element that is being used as a placeholder
     * while the current element is being dragged.
     */
    getPlaceholderElement(): HTMLElement;
    /** Returns the root draggable element. */
    getRootElement(): HTMLElement;
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
    /** Checks whether the element is currently being dragged. */
    _isDragging(): boolean;
    /** Handler for the `mousedown`/`touchstart` events. */
    _pointerDown: (event: TouchEvent | MouseEvent) => void;
    /**
     * Sets up the different variables and subscriptions
     * that will be necessary for the dragging sequence.
     * @param referenceElement Element that started the drag sequence.
     * @param event Browser event object that started the sequence.
     */
    private _initializeDragSequence;
    /** Starts the dragging sequence. */
    private _startDragSequence;
    /** Handler that is invoked when the user moves their pointer after they've initiated a drag. */
    private _pointerMove;
    /** Handler that is invoked when the user lifts their pointer up, after initiating a drag. */
    private _pointerUp;
    /** Cleans up the DOM artifacts that were added to facilitate the element being dragged. */
    private _cleanupDragArtifacts;
    /**
     * Updates the item's position in its drop container, or moves it
     * into a new one, depending on its current drag position.
     */
    private _updateActiveDropContainer;
    /**
     * Creates the element that will be rendered next to the user's pointer
     * and will be used as a preview of the element that is being dragged.
     */
    private _createPreviewElement;
    /** Creates an element that will be shown instead of the current element while dragging. */
    private _createPlaceholderElement;
    /**
     * Figures out the coordinates at which an element was picked up.
     * @param referenceElement Element that initiated the dragging.
     * @param event Event that initiated the dragging.
     */
    private _getPointerPositionInElement;
    /**
     * Animates the preview element from its current position to the location of the drop placeholder.
     * @returns Promise that resolves when the animation completes.
     */
    private _animatePreviewToPlaceholder;
    /**
     * Sets the `transform` style on an element.
     * @param element Element on which to set the transform.
     * @param x Desired position of the element along the X axis.
     * @param y Desired position of the element along the Y axis.
     */
    private _setTransform;
    /**
     * Helper to remove an element from the DOM and to do all the necessary null checks.
     * @param element Element to be removed.
     */
    private _removeElement;
    /** Determines the point of the page that was touched by the user. */
    private _getPointerPositionOnPage;
    /** Gets the pointer position on the page, accounting for any position constraints. */
    private _getConstrainedPointerPosition;
    /** Determines whether an event is a touch event. */
    private _isTouchEvent;
    /** Destroys the preview element and its ViewRef. */
    private _destroyPreview;
    /** Destroys the placeholder element and its ViewRef. */
    private _destroyPlaceholder;
    /** Updates the current drag delta, based on the user's current pointer position on the page. */
    private _updatePointerDirectionDelta;
    /** Gets the root draggable element, based on the `rootElementSelector`. */
    private _getRootElement;
    /** Unsubscribes from the global subscriptions. */
    private _removeSubscriptions;
}
