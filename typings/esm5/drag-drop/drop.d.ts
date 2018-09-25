/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef, EventEmitter, OnDestroy, OnInit, QueryList } from '@angular/core';
import { CdkDrag } from './drag';
import { DragDropRegistry } from './drag-drop-registry';
import { CdkDragDrop, CdkDragEnter, CdkDragExit } from './drag-events';
/** Container that wraps a set of draggable items. */
export declare class CdkDrop<T = any> implements OnInit, OnDestroy {
    element: ElementRef<HTMLElement>;
    private _dragDropRegistry;
    /** Draggable items in the container. */
    _draggables: QueryList<CdkDrag>;
    /**
     * Other draggable containers that this container is connected to and into which the
     * container's items can be transferred. Can either be references to other drop containers,
     * or their unique IDs.
     */
    connectedTo: (CdkDrop | string)[] | CdkDrop | string;
    /** Arbitrary data to attach to this container. */
    data: T;
    /** Direction in which the list is oriented. */
    orientation: 'horizontal' | 'vertical';
    /**
     * Unique ID for the drop zone. Can be used as a reference
     * in the `connectedTo` of another `CdkDrop`.
     */
    id: string;
    /** Locks the position of the draggable elements inside the container along the specified axis. */
    lockAxis: 'x' | 'y';
    /**
     * Function that is used to determine whether an item
     * is allowed to be moved into a drop container.
     */
    enterPredicate: (drag?: CdkDrag, drop?: CdkDrop) => boolean;
    /** Emits when the user drops an item inside the container. */
    dropped: EventEmitter<CdkDragDrop<T, any>>;
    /**
     * Emits when the user has moved a new drag item into this container.
     */
    entered: EventEmitter<CdkDragEnter<T>>;
    /**
     * Emits when the user removes an item from the container
     * by dragging it into another container.
     */
    exited: EventEmitter<CdkDragExit<T>>;
    constructor(element: ElementRef<HTMLElement>, _dragDropRegistry: DragDropRegistry<CdkDrag, CdkDrop<T>>);
    ngOnInit(): void;
    ngOnDestroy(): void;
    /** Whether an item in the container is being dragged. */
    _dragging: boolean;
    /** Cache of the dimensions of all the items and the sibling containers. */
    private _positionCache;
    /**
     * Draggable items that are currently active inside the container. Includes the items
     * from `_draggables`, as well as any items that have been dragged in, but haven't
     * been dropped yet.
     */
    private _activeDraggables;
    /**
     * Keeps track of the item that was last swapped with the dragged item, as
     * well as what direction the pointer was moving in when the swap occured.
     */
    private _previousSwap;
    /** Starts dragging an item. */
    start(): void;
    /**
     * Drops an item into this container.
     * @param item Item being dropped into the container.
     * @param currentIndex Index at which the item should be inserted.
     * @param previousContainer Container from which the item got dragged in.
     */
    drop(item: CdkDrag, currentIndex: number, previousContainer: CdkDrop): void;
    /**
     * Emits an event to indicate that the user moved an item into the container.
     * @param item Item that was moved into the container.
     * @param pointerX Position of the item along the X axis.
     * @param pointerY Position of the item along the Y axis.
     */
    enter(item: CdkDrag, pointerX: number, pointerY: number): void;
    /**
     * Removes an item from the container after it was dragged into another container by the user.
     * @param item Item that was dragged out.
     */
    exit(item: CdkDrag): void;
    /**
     * Figures out the index of an item in the container.
     * @param item Item whose index should be determined.
     */
    getItemIndex(item: CdkDrag): number;
    /**
     * Sorts an item inside the container based on its position.
     * @param item Item to be sorted.
     * @param pointerX Position of the item along the X axis.
     * @param pointerY Position of the item along the Y axis.
     * @param pointerDeta Direction in which the pointer is moving along each axis.
     */
    _sortItem(item: CdkDrag, pointerX: number, pointerY: number, pointerDelta: {
        x: number;
        y: number;
    }): void;
    /**
     * Figures out whether an item should be moved into a sibling
     * drop container, based on its current position.
     * @param item Drag item that is being moved.
     * @param x Position of the item along the X axis.
     * @param y Position of the item along the Y axis.
     */
    _getSiblingContainerFromPosition(item: CdkDrag, x: number, y: number): CdkDrop | null;
    /**
     * Checks whether an item that started in this container can be returned to it,
     * after it was moved out into another container.
     * @param item Item that is being checked.
     * @param x Position of the item along the X axis.
     * @param y Position of the item along the Y axis.
     */
    _canReturnItem(item: CdkDrag, x: number, y: number): boolean;
    /** Refreshes the position cache of the items and sibling containers. */
    private _cachePositions;
    /** Resets the container to its initial state. */
    private _reset;
    /**
     * Updates the top/left positions of a `ClientRect`, as well as their bottom/right counterparts.
     * @param clientRect `ClientRect` that should be updated.
     * @param top Amount to add to the `top` position.
     * @param left Amount to add to the `left` position.
     */
    private _adjustClientRect;
    /**
     * Gets the index of an item in the drop container, based on the position of the user's pointer.
     * @param item Item that is being sorted.
     * @param pointerX Position of the user's pointer along the X axis.
     * @param pointerY Position of the user's pointer along the Y axis.
     * @param delta Direction in which the user is moving their pointer.
     */
    private _getItemIndexFromPointerPosition;
    /**
     * Checks whether the pointer coordinates are close to the drop container.
     * @param pointerX Coordinates along the X axis.
     * @param pointerY Coordinates along the Y axis.
     */
    private _isPointerNearDropContainer;
}
