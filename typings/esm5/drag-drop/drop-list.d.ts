/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef, EventEmitter, OnDestroy, OnInit, QueryList, ChangeDetectorRef } from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { CdkDrag } from './drag';
import { DragDropRegistry } from './drag-drop-registry';
import { CdkDragDrop, CdkDragEnter, CdkDragExit, CdkDragSortEvent } from './drag-events';
import { CdkDropListGroup } from './drop-list-group';
/** Container that wraps a set of draggable items. */
export declare class CdkDropList<T = any> implements OnInit, OnDestroy {
    element: ElementRef<HTMLElement>;
    private _dragDropRegistry;
    private _changeDetectorRef;
    private _dir?;
    private _group?;
    private _document;
    /** Draggable items in the container. */
    _draggables: QueryList<CdkDrag>;
    /**
     * Other draggable containers that this container is connected to and into which the
     * container's items can be transferred. Can either be references to other drop containers,
     * or their unique IDs.
     */
    connectedTo: (CdkDropList | string)[] | CdkDropList | string;
    /** Arbitrary data to attach to this container. */
    data: T;
    /** Direction in which the list is oriented. */
    orientation: 'horizontal' | 'vertical';
    /**
     * Unique ID for the drop zone. Can be used as a reference
     * in the `connectedTo` of another `CdkDropList`.
     */
    id: string;
    /** Locks the position of the draggable elements inside the container along the specified axis. */
    lockAxis: 'x' | 'y';
    /** Whether starting a dragging sequence from this container is disabled. */
    disabled: boolean;
    private _disabled;
    /**
     * Function that is used to determine whether an item
     * is allowed to be moved into a drop container.
     */
    enterPredicate: (drag: CdkDrag, drop: CdkDropList) => boolean;
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
    /** Emits as the user is swapping items while actively dragging. */
    sorted: EventEmitter<CdkDragSortEvent<T>>;
    constructor(element: ElementRef<HTMLElement>, _dragDropRegistry: DragDropRegistry<CdkDrag, CdkDropList<T>>, _changeDetectorRef: ChangeDetectorRef, _dir?: Directionality | undefined, _group?: CdkDropListGroup<CdkDropList<any>> | undefined, _document?: any);
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
     * @param isPointerOverContainer Whether the user's pointer was over the
     *    container when the item was dropped.
     */
    drop(item: CdkDrag, currentIndex: number, previousContainer: CdkDropList, isPointerOverContainer: boolean): void;
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
    _getSiblingContainerFromPosition(item: CdkDrag, x: number, y: number): CdkDropList | null;
    /**
     * Checks whether the user's pointer is positioned over the container.
     * @param x Pointer position along the X axis.
     * @param y Pointer position along the Y axis.
     */
    _isOverContainer(x: number, y: number): boolean;
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
    /**
     * Gets the offset in pixels by which the item that is being dragged should be moved.
     * @param currentPosition Current position of the item.
     * @param newPosition Position of the item where the current item should be moved.
     * @param delta Direction in which the user is moving.
     */
    private _getItemOffsetPx;
    /**
     * Gets the offset in pixels by which the items that aren't being dragged should be moved.
     * @param currentIndex Index of the item currently being dragged.
     * @param siblings All of the items in the list.
     * @param delta Direction in which the user is moving.
     */
    private _getSiblingOffsetPx;
    /** Gets an array of unique drop lists that the current list is connected to. */
    private _getConnectedLists;
}
