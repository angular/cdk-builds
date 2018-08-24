/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef, EventEmitter, NgZone, OnDestroy, QueryList, ViewContainerRef } from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { CdkDragHandle } from './drag-handle';
import { CdkDropContainer } from './drop-container';
import { CdkDragStart, CdkDragEnd, CdkDragExit, CdkDragEnter, CdkDragDrop, CdkDragMove } from './drag-events';
import { CdkDragPreview } from './drag-preview';
import { CdkDragPlaceholder } from './drag-placeholder';
import { ViewportRuler } from '@angular/cdk/overlay';
import { DragDropRegistry } from './drag-drop-registry';
import { Observable } from 'rxjs';
/** Element that can be moved inside a CdkDrop container. */
export declare class CdkDrag<T = any> implements OnDestroy {
    /** Element that the draggable is attached to. */
    element: ElementRef<HTMLElement>;
    /** Droppable container that the draggable is a part of. */
    dropContainer: CdkDropContainer;
    private _ngZone;
    private _viewContainerRef;
    private _viewportRuler;
    private _dragDropRegistry;
    private _dir;
    private _document;
    private _destroyed;
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
        dropContainer: CdkDropContainer, document: any, _ngZone: NgZone, _viewContainerRef: ViewContainerRef, _viewportRuler: ViewportRuler, _dragDropRegistry: DragDropRegistry<CdkDrag<T>, CdkDropContainer>, _dir: Directionality);
    /**
     * Returns the element that is being used as a placeholder
     * while the current element is being dragged.
     */
    getPlaceholderElement(): HTMLElement;
    ngOnDestroy(): void;
    /** Starts the dragging sequence. */
    _startDragging(event: MouseEvent | TouchEvent): void;
    /** Checks whether the element is currently being dragged. */
    _isDragging(): boolean;
    /** Handler for when the pointer is pressed down on the element or the handle. */
    private _pointerDown;
    /** Handler that is invoked when the user moves their pointer after they've initiated a drag. */
    private _pointerMove;
    /** Handler that is invoked when the user lifts their pointer up, after initiating a drag. */
    private _pointerUp;
    /** Cleans up the DOM artifacts that were added to facilitate the element being dragged. */
    private _cleanupDragArtifacts();
    /**
     * Updates the item's position in its drop container, or moves it
     * into a new one, depending on its current drag position.
     */
    private _updateActiveDropContainer({x, y});
    /**
     * Creates the element that will be rendered next to the user's pointer
     * and will be used as a preview of the element that is being dragged.
     */
    private _createPreviewElement();
    /** Creates an element that will be shown instead of the current element while dragging. */
    private _createPlaceholderElement();
    /**
     * Figures out the coordinates at which an element was picked up.
     * @param referenceElement Element that initiated the dragging.
     * @param event Event that initiated the dragging.
     */
    private _getPointerPositionInElement(referenceElement, event);
    /**
     * Animates the preview element from its current position to the location of the drop placeholder.
     * @returns Promise that resolves when the animation completes.
     */
    private _animatePreviewToPlaceholder();
    /**
     * Sets the `transform` style on an element.
     * @param element Element on which to set the transform.
     * @param x Desired position of the element along the X axis.
     * @param y Desired position of the element along the Y axis.
     */
    private _setTransform(element, x, y);
    /**
     * Helper to remove an element from the DOM and to do all the necessary null checks.
     * @param element Element to be removed.
     */
    private _removeElement(element);
    /** Determines the point of the page that was touched by the user. */
    private _getPointerPositionOnPage(event);
    /** Gets the pointer position on the page, accounting for any position constraints. */
    private _getConstrainedPointerPosition(event);
    /** Determines whether an event is a touch event. */
    private _isTouchEvent(event);
    /** Destroys the preview element and its ViewRef. */
    private _destroyPreview();
    /** Destroys the placeholder element and its ViewRef. */
    private _destroyPlaceholder();
}
