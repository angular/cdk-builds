/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/drag-drop/directives/drop-list.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { coerceArray, coerceBooleanProperty } from '@angular/cdk/coercion';
import { ContentChildren, ElementRef, EventEmitter, Input, Output, QueryList, Optional, Directive, ChangeDetectorRef, SkipSelf, } from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { CdkDrag, CDK_DROP_LIST } from './drag';
import { CdkDropListGroup } from './drop-list-group';
import { DragDrop } from '../drag-drop';
import { Subject } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';
/**
 * Counter used to generate unique ids for drop zones.
 * @type {?}
 */
let _uniqueIdCounter = 0;
/**
 * Internal compile-time-only representation of a `CdkDropList`.
 * Used to avoid circular import issues between the `CdkDropList` and the `CdkDrag`.
 * \@docs-private
 * @record
 */
export function CdkDropListInternal() { }
const ɵ0 = undefined;
/**
 * Container that wraps a set of draggable items.
 * @template T
 */
export class CdkDropList {
    /**
     * @param {?} element
     * @param {?} dragDrop
     * @param {?} _changeDetectorRef
     * @param {?=} _dir
     * @param {?=} _group
     */
    constructor(element, dragDrop, _changeDetectorRef, _dir, _group) {
        this.element = element;
        this._changeDetectorRef = _changeDetectorRef;
        this._dir = _dir;
        this._group = _group;
        /**
         * Emits when the list has been destroyed.
         */
        this._destroyed = new Subject();
        /**
         * Other draggable containers that this container is connected to and into which the
         * container's items can be transferred. Can either be references to other drop containers,
         * or their unique IDs.
         */
        this.connectedTo = [];
        /**
         * Direction in which the list is oriented.
         */
        this.orientation = 'vertical';
        /**
         * Unique ID for the drop zone. Can be used as a reference
         * in the `connectedTo` of another `CdkDropList`.
         */
        this.id = `cdk-drop-list-${_uniqueIdCounter++}`;
        this._disabled = false;
        /**
         * Whether sorting within this drop list is disabled.
         */
        this.sortingDisabled = false;
        /**
         * Function that is used to determine whether an item
         * is allowed to be moved into a drop container.
         */
        this.enterPredicate = (/**
         * @return {?}
         */
        () => true);
        /**
         * Whether to auto-scroll the view when the user moves their pointer close to the edges.
         */
        this.autoScrollDisabled = false;
        /**
         * Emits when the user drops an item inside the container.
         */
        this.dropped = new EventEmitter();
        /**
         * Emits when the user has moved a new drag item into this container.
         */
        this.entered = new EventEmitter();
        /**
         * Emits when the user removes an item from the container
         * by dragging it into another container.
         */
        this.exited = new EventEmitter();
        /**
         * Emits as the user is swapping items while actively dragging.
         */
        this.sorted = new EventEmitter();
        this._dropListRef = dragDrop.createDropList(element);
        this._dropListRef.data = this;
        this._dropListRef.enterPredicate = (/**
         * @param {?} drag
         * @param {?} drop
         * @return {?}
         */
        (drag, drop) => {
            return this.enterPredicate(drag.data, drop.data);
        });
        this._setupInputSyncSubscription(this._dropListRef);
        this._handleEvents(this._dropListRef);
        CdkDropList._dropLists.push(this);
        if (_group) {
            _group._items.add(this);
        }
    }
    /**
     * Whether starting a dragging sequence from this container is disabled.
     * @return {?}
     */
    get disabled() {
        return this._disabled || (!!this._group && this._group.disabled);
    }
    /**
     * @param {?} value
     * @return {?}
     */
    set disabled(value) {
        // Usually we sync the directive and ref state right before dragging starts, in order to have
        // a single point of failure and to avoid having to use setters for everything. `disabled` is
        // a special case, because it can prevent the `beforeStarted` event from firing, which can lock
        // the user in a disabled state, so we also need to sync it as it's being set.
        this._dropListRef.disabled = this._disabled = coerceBooleanProperty(value);
    }
    /**
     * @return {?}
     */
    ngAfterContentInit() {
        this._draggables.changes
            .pipe(startWith(this._draggables), takeUntil(this._destroyed))
            .subscribe((/**
         * @param {?} items
         * @return {?}
         */
        (items) => {
            this._dropListRef.withItems(items.reduce((/**
             * @param {?} filteredItems
             * @param {?} drag
             * @return {?}
             */
            (filteredItems, drag) => {
                if (drag.dropContainer === this) {
                    filteredItems.push(drag._dragRef);
                }
                return filteredItems;
            }), (/** @type {?} */ ([]))));
        }));
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        /** @type {?} */
        const index = CdkDropList._dropLists.indexOf(this);
        if (index > -1) {
            CdkDropList._dropLists.splice(index, 1);
        }
        if (this._group) {
            this._group._items.delete(this);
        }
        this._dropListRef.dispose();
        this._destroyed.next();
        this._destroyed.complete();
    }
    /**
     * Starts dragging an item.
     * @deprecated No longer being used. To be removed.
     * \@breaking-change 10.0.0
     * @return {?}
     */
    start() {
        this._dropListRef.start();
    }
    /**
     * Drops an item into this container.
     * @deprecated No longer being used. To be removed.
     * \@breaking-change 10.0.0
     * @param {?} item Item being dropped into the container.
     * @param {?} currentIndex Index at which the item should be inserted.
     * @param {?} previousContainer Container from which the item got dragged in.
     * @param {?} isPointerOverContainer Whether the user's pointer was over the
     *    container when the item was dropped.
     *
     * @return {?}
     */
    drop(item, currentIndex, previousContainer, isPointerOverContainer) {
        this._dropListRef.drop(item._dragRef, currentIndex, previousContainer._dropListRef, isPointerOverContainer, { x: 0, y: 0 });
    }
    /**
     * Emits an event to indicate that the user moved an item into the container.
     * @deprecated No longer being used. To be removed.
     * \@breaking-change 10.0.0
     * @param {?} item Item that was moved into the container.
     * @param {?} pointerX Position of the item along the X axis.
     * @param {?} pointerY Position of the item along the Y axis.
     * @return {?}
     */
    enter(item, pointerX, pointerY) {
        this._dropListRef.enter(item._dragRef, pointerX, pointerY);
    }
    /**
     * Removes an item from the container after it was dragged into another container by the user.
     * @deprecated No longer being used. To be removed.
     * \@breaking-change 10.0.0
     * @param {?} item Item that was dragged out.
     * @return {?}
     */
    exit(item) {
        this._dropListRef.exit(item._dragRef);
    }
    /**
     * Figures out the index of an item in the container.
     * @deprecated No longer being used. To be removed.
     * \@breaking-change 10.0.0
     * @param {?} item Item whose index should be determined.
     * @return {?}
     */
    getItemIndex(item) {
        return this._dropListRef.getItemIndex(item._dragRef);
    }
    /**
     * Syncs the inputs of the CdkDropList with the options of the underlying DropListRef.
     * @private
     * @param {?} ref
     * @return {?}
     */
    _setupInputSyncSubscription(ref) {
        if (this._dir) {
            this._dir.change
                .pipe(startWith(this._dir.value), takeUntil(this._destroyed))
                .subscribe((/**
             * @param {?} value
             * @return {?}
             */
            value => ref.withDirection(value)));
        }
        ref.beforeStarted.subscribe((/**
         * @return {?}
         */
        () => {
            /** @type {?} */
            const siblings = coerceArray(this.connectedTo).map((/**
             * @param {?} drop
             * @return {?}
             */
            drop => {
                return typeof drop === 'string' ?
                    (/** @type {?} */ (CdkDropList._dropLists.find((/**
                     * @param {?} list
                     * @return {?}
                     */
                    list => list.id === drop)))) : drop;
            }));
            if (this._group) {
                this._group._items.forEach((/**
                 * @param {?} drop
                 * @return {?}
                 */
                drop => {
                    if (siblings.indexOf(drop) === -1) {
                        siblings.push(drop);
                    }
                }));
            }
            ref.disabled = this.disabled;
            ref.lockAxis = this.lockAxis;
            ref.sortingDisabled = coerceBooleanProperty(this.sortingDisabled);
            ref.autoScrollDisabled = coerceBooleanProperty(this.autoScrollDisabled);
            ref
                .connectedTo(siblings.filter((/**
             * @param {?} drop
             * @return {?}
             */
            drop => drop && drop !== this)).map((/**
             * @param {?} list
             * @return {?}
             */
            list => list._dropListRef)))
                .withOrientation(this.orientation);
        }));
    }
    /**
     * Handles events from the underlying DropListRef.
     * @private
     * @param {?} ref
     * @return {?}
     */
    _handleEvents(ref) {
        ref.beforeStarted.subscribe((/**
         * @return {?}
         */
        () => {
            this._changeDetectorRef.markForCheck();
        }));
        ref.entered.subscribe((/**
         * @param {?} event
         * @return {?}
         */
        event => {
            this.entered.emit({
                container: this,
                item: event.item.data,
                currentIndex: event.currentIndex
            });
        }));
        ref.exited.subscribe((/**
         * @param {?} event
         * @return {?}
         */
        event => {
            this.exited.emit({
                container: this,
                item: event.item.data
            });
            this._changeDetectorRef.markForCheck();
        }));
        ref.sorted.subscribe((/**
         * @param {?} event
         * @return {?}
         */
        event => {
            this.sorted.emit({
                previousIndex: event.previousIndex,
                currentIndex: event.currentIndex,
                container: this,
                item: event.item.data
            });
        }));
        ref.dropped.subscribe((/**
         * @param {?} event
         * @return {?}
         */
        event => {
            this.dropped.emit({
                previousIndex: event.previousIndex,
                currentIndex: event.currentIndex,
                previousContainer: event.previousContainer.data,
                container: event.container.data,
                item: event.item.data,
                isPointerOverContainer: event.isPointerOverContainer,
                distance: event.distance
            });
            // Mark for check since all of these events run outside of change
            // detection and we're not guaranteed for something else to have triggered it.
            this._changeDetectorRef.markForCheck();
        }));
    }
}
/**
 * Keeps track of the drop lists that are currently on the page.
 */
CdkDropList._dropLists = [];
CdkDropList.decorators = [
    { type: Directive, args: [{
                selector: '[cdkDropList], cdk-drop-list',
                exportAs: 'cdkDropList',
                providers: [
                    // Prevent child drop lists from picking up the same group as their parent.
                    { provide: CdkDropListGroup, useValue: ɵ0 },
                    { provide: CDK_DROP_LIST, useExisting: CdkDropList },
                ],
                host: {
                    'class': 'cdk-drop-list',
                    '[id]': 'id',
                    '[class.cdk-drop-list-disabled]': 'disabled',
                    '[class.cdk-drop-list-dragging]': '_dropListRef.isDragging()',
                    '[class.cdk-drop-list-receiving]': '_dropListRef.isReceiving()',
                }
            },] }
];
/** @nocollapse */
CdkDropList.ctorParameters = () => [
    { type: ElementRef },
    { type: DragDrop },
    { type: ChangeDetectorRef },
    { type: Directionality, decorators: [{ type: Optional }] },
    { type: CdkDropListGroup, decorators: [{ type: Optional }, { type: SkipSelf }] }
];
CdkDropList.propDecorators = {
    _draggables: [{ type: ContentChildren, args: [CdkDrag, { descendants: true },] }],
    connectedTo: [{ type: Input, args: ['cdkDropListConnectedTo',] }],
    data: [{ type: Input, args: ['cdkDropListData',] }],
    orientation: [{ type: Input, args: ['cdkDropListOrientation',] }],
    id: [{ type: Input }],
    lockAxis: [{ type: Input, args: ['cdkDropListLockAxis',] }],
    disabled: [{ type: Input, args: ['cdkDropListDisabled',] }],
    sortingDisabled: [{ type: Input, args: ['cdkDropListSortingDisabled',] }],
    enterPredicate: [{ type: Input, args: ['cdkDropListEnterPredicate',] }],
    autoScrollDisabled: [{ type: Input, args: ['cdkDropListAutoScrollDisabled',] }],
    dropped: [{ type: Output, args: ['cdkDropListDropped',] }],
    entered: [{ type: Output, args: ['cdkDropListEntered',] }],
    exited: [{ type: Output, args: ['cdkDropListExited',] }],
    sorted: [{ type: Output, args: ['cdkDropListSorted',] }]
};
if (false) {
    /**
     * Keeps track of the drop lists that are currently on the page.
     * @type {?}
     * @private
     */
    CdkDropList._dropLists;
    /** @type {?} */
    CdkDropList.ngAcceptInputType_disabled;
    /** @type {?} */
    CdkDropList.ngAcceptInputType_sortingDisabled;
    /** @type {?} */
    CdkDropList.ngAcceptInputType_autoScrollDisabled;
    /**
     * Emits when the list has been destroyed.
     * @type {?}
     * @private
     */
    CdkDropList.prototype._destroyed;
    /**
     * Reference to the underlying drop list instance.
     * @type {?}
     */
    CdkDropList.prototype._dropListRef;
    /**
     * Draggable items in the container.
     * @type {?}
     */
    CdkDropList.prototype._draggables;
    /**
     * Other draggable containers that this container is connected to and into which the
     * container's items can be transferred. Can either be references to other drop containers,
     * or their unique IDs.
     * @type {?}
     */
    CdkDropList.prototype.connectedTo;
    /**
     * Arbitrary data to attach to this container.
     * @type {?}
     */
    CdkDropList.prototype.data;
    /**
     * Direction in which the list is oriented.
     * @type {?}
     */
    CdkDropList.prototype.orientation;
    /**
     * Unique ID for the drop zone. Can be used as a reference
     * in the `connectedTo` of another `CdkDropList`.
     * @type {?}
     */
    CdkDropList.prototype.id;
    /**
     * Locks the position of the draggable elements inside the container along the specified axis.
     * @type {?}
     */
    CdkDropList.prototype.lockAxis;
    /**
     * @type {?}
     * @private
     */
    CdkDropList.prototype._disabled;
    /**
     * Whether sorting within this drop list is disabled.
     * @type {?}
     */
    CdkDropList.prototype.sortingDisabled;
    /**
     * Function that is used to determine whether an item
     * is allowed to be moved into a drop container.
     * @type {?}
     */
    CdkDropList.prototype.enterPredicate;
    /**
     * Whether to auto-scroll the view when the user moves their pointer close to the edges.
     * @type {?}
     */
    CdkDropList.prototype.autoScrollDisabled;
    /**
     * Emits when the user drops an item inside the container.
     * @type {?}
     */
    CdkDropList.prototype.dropped;
    /**
     * Emits when the user has moved a new drag item into this container.
     * @type {?}
     */
    CdkDropList.prototype.entered;
    /**
     * Emits when the user removes an item from the container
     * by dragging it into another container.
     * @type {?}
     */
    CdkDropList.prototype.exited;
    /**
     * Emits as the user is swapping items while actively dragging.
     * @type {?}
     */
    CdkDropList.prototype.sorted;
    /**
     * Element that the drop list is attached to.
     * @type {?}
     */
    CdkDropList.prototype.element;
    /**
     * @type {?}
     * @private
     */
    CdkDropList.prototype._changeDetectorRef;
    /**
     * @type {?}
     * @private
     */
    CdkDropList.prototype._dir;
    /**
     * @type {?}
     * @private
     */
    CdkDropList.prototype._group;
}
export { ɵ0 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZGlyZWN0aXZlcy9kcm9wLWxpc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFlLFdBQVcsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3ZGLE9BQU8sRUFDTCxlQUFlLEVBQ2YsVUFBVSxFQUNWLFlBQVksRUFDWixLQUFLLEVBRUwsTUFBTSxFQUNOLFNBQVMsRUFDVCxRQUFRLEVBQ1IsU0FBUyxFQUNULGlCQUFpQixFQUNqQixRQUFRLEdBRVQsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxPQUFPLEVBQUUsYUFBYSxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBRTlDLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBR25ELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDdEMsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUM3QixPQUFPLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDOzs7OztJQUdoRCxnQkFBZ0IsR0FBRyxDQUFDOzs7Ozs7O0FBT3hCLHlDQUEyRDtXQVFqQixTQUFTOzs7OztBQVduRCxNQUFNLE9BQU8sV0FBVzs7Ozs7Ozs7SUFzRnRCLFlBRVcsT0FBZ0MsRUFBRSxRQUFrQixFQUNuRCxrQkFBcUMsRUFBc0IsSUFBcUIsRUFDeEQsTUFBc0M7UUFGL0QsWUFBTyxHQUFQLE9BQU8sQ0FBeUI7UUFDL0IsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFtQjtRQUFzQixTQUFJLEdBQUosSUFBSSxDQUFpQjtRQUN4RCxXQUFNLEdBQU4sTUFBTSxDQUFnQzs7OztRQXhG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MUMsa0NBQStFOzs7Ozs7O0lBTy9FLGtDQUNrRTs7Ozs7SUFHbEUsMkJBQWtDOzs7OztJQUdsQyxrQ0FBcUY7Ozs7OztJQU1yRix5QkFBNEQ7Ozs7O0lBRzVELCtCQUFrRDs7Ozs7SUFjbEQsZ0NBQTBCOzs7OztJQUcxQixzQ0FDaUM7Ozs7OztJQU1qQyxxQ0FDMEU7Ozs7O0lBRzFFLHlDQUNvQzs7Ozs7SUFHcEMsOEJBQ3FGOzs7OztJQUtyRiw4QkFDNkU7Ozs7OztJQU03RSw2QkFDMEU7Ozs7O0lBRzFFLDZCQUNvRjs7Ozs7SUFJaEYsOEJBQXVDOzs7OztJQUN2Qyx5Q0FBNkM7Ozs7O0lBQUUsMkJBQXlDOzs7OztJQUN4Riw2QkFBc0UiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtCb29sZWFuSW5wdXQsIGNvZXJjZUFycmF5LCBjb2VyY2VCb29sZWFuUHJvcGVydHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge1xuICBDb250ZW50Q2hpbGRyZW4sXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5wdXQsXG4gIE9uRGVzdHJveSxcbiAgT3V0cHV0LFxuICBRdWVyeUxpc3QsXG4gIE9wdGlvbmFsLFxuICBEaXJlY3RpdmUsXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBTa2lwU2VsZixcbiAgQWZ0ZXJDb250ZW50SW5pdCxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0RpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge0Nka0RyYWcsIENES19EUk9QX0xJU1R9IGZyb20gJy4vZHJhZyc7XG5pbXBvcnQge0Nka0RyYWdEcm9wLCBDZGtEcmFnRW50ZXIsIENka0RyYWdFeGl0LCBDZGtEcmFnU29ydEV2ZW50fSBmcm9tICcuLi9kcmFnLWV2ZW50cyc7XG5pbXBvcnQge0Nka0Ryb3BMaXN0R3JvdXB9IGZyb20gJy4vZHJvcC1saXN0LWdyb3VwJztcbmltcG9ydCB7RHJvcExpc3RSZWZ9IGZyb20gJy4uL2Ryb3AtbGlzdC1yZWYnO1xuaW1wb3J0IHtEcmFnUmVmfSBmcm9tICcuLi9kcmFnLXJlZic7XG5pbXBvcnQge0RyYWdEcm9wfSBmcm9tICcuLi9kcmFnLWRyb3AnO1xuaW1wb3J0IHtTdWJqZWN0fSBmcm9tICdyeGpzJztcbmltcG9ydCB7c3RhcnRXaXRoLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuLyoqIENvdW50ZXIgdXNlZCB0byBnZW5lcmF0ZSB1bmlxdWUgaWRzIGZvciBkcm9wIHpvbmVzLiAqL1xubGV0IF91bmlxdWVJZENvdW50ZXIgPSAwO1xuXG4vKipcbiAqIEludGVybmFsIGNvbXBpbGUtdGltZS1vbmx5IHJlcHJlc2VudGF0aW9uIG9mIGEgYENka0Ryb3BMaXN0YC5cbiAqIFVzZWQgdG8gYXZvaWQgY2lyY3VsYXIgaW1wb3J0IGlzc3VlcyBiZXR3ZWVuIHRoZSBgQ2RrRHJvcExpc3RgIGFuZCB0aGUgYENka0RyYWdgLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIENka0Ryb3BMaXN0SW50ZXJuYWwgZXh0ZW5kcyBDZGtEcm9wTGlzdCB7fVxuXG4vKiogQ29udGFpbmVyIHRoYXQgd3JhcHMgYSBzZXQgb2YgZHJhZ2dhYmxlIGl0ZW1zLiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka0Ryb3BMaXN0XSwgY2RrLWRyb3AtbGlzdCcsXG4gIGV4cG9ydEFzOiAnY2RrRHJvcExpc3QnLFxuICBwcm92aWRlcnM6IFtcbiAgICAvLyBQcmV2ZW50IGNoaWxkIGRyb3AgbGlzdHMgZnJvbSBwaWNraW5nIHVwIHRoZSBzYW1lIGdyb3VwIGFzIHRoZWlyIHBhcmVudC5cbiAgICB7cHJvdmlkZTogQ2RrRHJvcExpc3RHcm91cCwgdXNlVmFsdWU6IHVuZGVmaW5lZH0sXG4gICAge3Byb3ZpZGU6IENES19EUk9QX0xJU1QsIHVzZUV4aXN0aW5nOiBDZGtEcm9wTGlzdH0sXG4gIF0sXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLWRyb3AtbGlzdCcsXG4gICAgJ1tpZF0nOiAnaWQnLFxuICAgICdbY2xhc3MuY2RrLWRyb3AtbGlzdC1kaXNhYmxlZF0nOiAnZGlzYWJsZWQnLFxuICAgICdbY2xhc3MuY2RrLWRyb3AtbGlzdC1kcmFnZ2luZ10nOiAnX2Ryb3BMaXN0UmVmLmlzRHJhZ2dpbmcoKScsXG4gICAgJ1tjbGFzcy5jZGstZHJvcC1saXN0LXJlY2VpdmluZ10nOiAnX2Ryb3BMaXN0UmVmLmlzUmVjZWl2aW5nKCknLFxuICB9XG59KVxuZXhwb3J0IGNsYXNzIENka0Ryb3BMaXN0PFQgPSBhbnk+IGltcGxlbWVudHMgQWZ0ZXJDb250ZW50SW5pdCwgT25EZXN0cm95IHtcbiAgLyoqIEVtaXRzIHdoZW4gdGhlIGxpc3QgaGFzIGJlZW4gZGVzdHJveWVkLiAqL1xuICBwcml2YXRlIF9kZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBLZWVwcyB0cmFjayBvZiB0aGUgZHJvcCBsaXN0cyB0aGF0IGFyZSBjdXJyZW50bHkgb24gdGhlIHBhZ2UuICovXG4gIHByaXZhdGUgc3RhdGljIF9kcm9wTGlzdHM6IENka0Ryb3BMaXN0W10gPSBbXTtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSB1bmRlcmx5aW5nIGRyb3AgbGlzdCBpbnN0YW5jZS4gKi9cbiAgX2Ryb3BMaXN0UmVmOiBEcm9wTGlzdFJlZjxDZGtEcm9wTGlzdDxUPj47XG5cbiAgLyoqIERyYWdnYWJsZSBpdGVtcyBpbiB0aGUgY29udGFpbmVyLiAqL1xuICBAQ29udGVudENoaWxkcmVuKENka0RyYWcsIHtkZXNjZW5kYW50czogdHJ1ZX0pIF9kcmFnZ2FibGVzOiBRdWVyeUxpc3Q8Q2RrRHJhZz47XG5cbiAgLyoqXG4gICAqIE90aGVyIGRyYWdnYWJsZSBjb250YWluZXJzIHRoYXQgdGhpcyBjb250YWluZXIgaXMgY29ubmVjdGVkIHRvIGFuZCBpbnRvIHdoaWNoIHRoZVxuICAgKiBjb250YWluZXIncyBpdGVtcyBjYW4gYmUgdHJhbnNmZXJyZWQuIENhbiBlaXRoZXIgYmUgcmVmZXJlbmNlcyB0byBvdGhlciBkcm9wIGNvbnRhaW5lcnMsXG4gICAqIG9yIHRoZWlyIHVuaXF1ZSBJRHMuXG4gICAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0Q29ubmVjdGVkVG8nKVxuICBjb25uZWN0ZWRUbzogKENka0Ryb3BMaXN0IHwgc3RyaW5nKVtdIHwgQ2RrRHJvcExpc3QgfCBzdHJpbmcgPSBbXTtcblxuICAvKiogQXJiaXRyYXJ5IGRhdGEgdG8gYXR0YWNoIHRvIHRoaXMgY29udGFpbmVyLiAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0RGF0YScpIGRhdGE6IFQ7XG5cbiAgLyoqIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgbGlzdCBpcyBvcmllbnRlZC4gKi9cbiAgQElucHV0KCdjZGtEcm9wTGlzdE9yaWVudGF0aW9uJykgb3JpZW50YXRpb246ICdob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCcgPSAndmVydGljYWwnO1xuXG4gIC8qKlxuICAgKiBVbmlxdWUgSUQgZm9yIHRoZSBkcm9wIHpvbmUuIENhbiBiZSB1c2VkIGFzIGEgcmVmZXJlbmNlXG4gICAqIGluIHRoZSBgY29ubmVjdGVkVG9gIG9mIGFub3RoZXIgYENka0Ryb3BMaXN0YC5cbiAgICovXG4gIEBJbnB1dCgpIGlkOiBzdHJpbmcgPSBgY2RrLWRyb3AtbGlzdC0ke191bmlxdWVJZENvdW50ZXIrK31gO1xuXG4gIC8qKiBMb2NrcyB0aGUgcG9zaXRpb24gb2YgdGhlIGRyYWdnYWJsZSBlbGVtZW50cyBpbnNpZGUgdGhlIGNvbnRhaW5lciBhbG9uZyB0aGUgc3BlY2lmaWVkIGF4aXMuICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3RMb2NrQXhpcycpIGxvY2tBeGlzOiAneCcgfCAneSc7XG5cbiAgLyoqIFdoZXRoZXIgc3RhcnRpbmcgYSBkcmFnZ2luZyBzZXF1ZW5jZSBmcm9tIHRoaXMgY29udGFpbmVyIGlzIGRpc2FibGVkLiAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0RGlzYWJsZWQnKVxuICBnZXQgZGlzYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2Rpc2FibGVkIHx8ICghIXRoaXMuX2dyb3VwICYmIHRoaXMuX2dyb3VwLmRpc2FibGVkKTtcbiAgfVxuICBzZXQgZGlzYWJsZWQodmFsdWU6IGJvb2xlYW4pIHtcbiAgICAvLyBVc3VhbGx5IHdlIHN5bmMgdGhlIGRpcmVjdGl2ZSBhbmQgcmVmIHN0YXRlIHJpZ2h0IGJlZm9yZSBkcmFnZ2luZyBzdGFydHMsIGluIG9yZGVyIHRvIGhhdmVcbiAgICAvLyBhIHNpbmdsZSBwb2ludCBvZiBmYWlsdXJlIGFuZCB0byBhdm9pZCBoYXZpbmcgdG8gdXNlIHNldHRlcnMgZm9yIGV2ZXJ5dGhpbmcuIGBkaXNhYmxlZGAgaXNcbiAgICAvLyBhIHNwZWNpYWwgY2FzZSwgYmVjYXVzZSBpdCBjYW4gcHJldmVudCB0aGUgYGJlZm9yZVN0YXJ0ZWRgIGV2ZW50IGZyb20gZmlyaW5nLCB3aGljaCBjYW4gbG9ja1xuICAgIC8vIHRoZSB1c2VyIGluIGEgZGlzYWJsZWQgc3RhdGUsIHNvIHdlIGFsc28gbmVlZCB0byBzeW5jIGl0IGFzIGl0J3MgYmVpbmcgc2V0LlxuICAgIHRoaXMuX2Ryb3BMaXN0UmVmLmRpc2FibGVkID0gdGhpcy5fZGlzYWJsZWQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG4gIHByaXZhdGUgX2Rpc2FibGVkID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgc29ydGluZyB3aXRoaW4gdGhpcyBkcm9wIGxpc3QgaXMgZGlzYWJsZWQuICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3RTb3J0aW5nRGlzYWJsZWQnKVxuICBzb3J0aW5nRGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKipcbiAgICogRnVuY3Rpb24gdGhhdCBpcyB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIGFuIGl0ZW1cbiAgICogaXMgYWxsb3dlZCB0byBiZSBtb3ZlZCBpbnRvIGEgZHJvcCBjb250YWluZXIuXG4gICAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0RW50ZXJQcmVkaWNhdGUnKVxuICBlbnRlclByZWRpY2F0ZTogKGRyYWc6IENka0RyYWcsIGRyb3A6IENka0Ryb3BMaXN0KSA9PiBib29sZWFuID0gKCkgPT4gdHJ1ZVxuXG4gIC8qKiBXaGV0aGVyIHRvIGF1dG8tc2Nyb2xsIHRoZSB2aWV3IHdoZW4gdGhlIHVzZXIgbW92ZXMgdGhlaXIgcG9pbnRlciBjbG9zZSB0byB0aGUgZWRnZXMuICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3RBdXRvU2Nyb2xsRGlzYWJsZWQnKVxuICBhdXRvU2Nyb2xsRGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBkcm9wcyBhbiBpdGVtIGluc2lkZSB0aGUgY29udGFpbmVyLiAqL1xuICBAT3V0cHV0KCdjZGtEcm9wTGlzdERyb3BwZWQnKVxuICBkcm9wcGVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0Ryb3A8VCwgYW55Pj4gPSBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdEcm9wPFQsIGFueT4+KCk7XG5cbiAgLyoqXG4gICAqIEVtaXRzIHdoZW4gdGhlIHVzZXIgaGFzIG1vdmVkIGEgbmV3IGRyYWcgaXRlbSBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKi9cbiAgQE91dHB1dCgnY2RrRHJvcExpc3RFbnRlcmVkJylcbiAgZW50ZXJlZDogRXZlbnRFbWl0dGVyPENka0RyYWdFbnRlcjxUPj4gPSBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdFbnRlcjxUPj4oKTtcblxuICAvKipcbiAgICogRW1pdHMgd2hlbiB0aGUgdXNlciByZW1vdmVzIGFuIGl0ZW0gZnJvbSB0aGUgY29udGFpbmVyXG4gICAqIGJ5IGRyYWdnaW5nIGl0IGludG8gYW5vdGhlciBjb250YWluZXIuXG4gICAqL1xuICBAT3V0cHV0KCdjZGtEcm9wTGlzdEV4aXRlZCcpXG4gIGV4aXRlZDogRXZlbnRFbWl0dGVyPENka0RyYWdFeGl0PFQ+PiA9IG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0V4aXQ8VD4+KCk7XG5cbiAgLyoqIEVtaXRzIGFzIHRoZSB1c2VyIGlzIHN3YXBwaW5nIGl0ZW1zIHdoaWxlIGFjdGl2ZWx5IGRyYWdnaW5nLiAqL1xuICBAT3V0cHV0KCdjZGtEcm9wTGlzdFNvcnRlZCcpXG4gIHNvcnRlZDogRXZlbnRFbWl0dGVyPENka0RyYWdTb3J0RXZlbnQ8VD4+ID0gbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnU29ydEV2ZW50PFQ+PigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgLyoqIEVsZW1lbnQgdGhhdCB0aGUgZHJvcCBsaXN0IGlzIGF0dGFjaGVkIHRvLiAqL1xuICAgICAgcHVibGljIGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LCBkcmFnRHJvcDogRHJhZ0Ryb3AsXG4gICAgICBwcml2YXRlIF9jaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsIEBPcHRpb25hbCgpIHByaXZhdGUgX2Rpcj86IERpcmVjdGlvbmFsaXR5LFxuICAgICAgQE9wdGlvbmFsKCkgQFNraXBTZWxmKCkgcHJpdmF0ZSBfZ3JvdXA/OiBDZGtEcm9wTGlzdEdyb3VwPENka0Ryb3BMaXN0Pikge1xuICAgIHRoaXMuX2Ryb3BMaXN0UmVmID0gZHJhZ0Ryb3AuY3JlYXRlRHJvcExpc3QoZWxlbWVudCk7XG4gICAgdGhpcy5fZHJvcExpc3RSZWYuZGF0YSA9IHRoaXM7XG4gICAgdGhpcy5fZHJvcExpc3RSZWYuZW50ZXJQcmVkaWNhdGUgPSAoZHJhZzogRHJhZ1JlZjxDZGtEcmFnPiwgZHJvcDogRHJvcExpc3RSZWY8Q2RrRHJvcExpc3Q+KSA9PiB7XG4gICAgICByZXR1cm4gdGhpcy5lbnRlclByZWRpY2F0ZShkcmFnLmRhdGEsIGRyb3AuZGF0YSk7XG4gICAgfTtcblxuICAgIHRoaXMuX3NldHVwSW5wdXRTeW5jU3Vic2NyaXB0aW9uKHRoaXMuX2Ryb3BMaXN0UmVmKTtcbiAgICB0aGlzLl9oYW5kbGVFdmVudHModGhpcy5fZHJvcExpc3RSZWYpO1xuICAgIENka0Ryb3BMaXN0Ll9kcm9wTGlzdHMucHVzaCh0aGlzKTtcblxuICAgIGlmIChfZ3JvdXApIHtcbiAgICAgIF9ncm91cC5faXRlbXMuYWRkKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIG5nQWZ0ZXJDb250ZW50SW5pdCgpIHtcbiAgICB0aGlzLl9kcmFnZ2FibGVzLmNoYW5nZXNcbiAgICAgIC5waXBlKHN0YXJ0V2l0aCh0aGlzLl9kcmFnZ2FibGVzKSwgdGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpXG4gICAgICAuc3Vic2NyaWJlKChpdGVtczogUXVlcnlMaXN0PENka0RyYWc+KSA9PiB7XG4gICAgICAgIHRoaXMuX2Ryb3BMaXN0UmVmLndpdGhJdGVtcyhpdGVtcy5yZWR1Y2UoKGZpbHRlcmVkSXRlbXMsIGRyYWcpID0+IHtcbiAgICAgICAgICBpZiAoZHJhZy5kcm9wQ29udGFpbmVyID09PSB0aGlzKSB7XG4gICAgICAgICAgICBmaWx0ZXJlZEl0ZW1zLnB1c2goZHJhZy5fZHJhZ1JlZik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGZpbHRlcmVkSXRlbXM7XG4gICAgICAgIH0sIFtdIGFzIERyYWdSZWZbXSkpO1xuICAgICAgfSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBjb25zdCBpbmRleCA9IENka0Ryb3BMaXN0Ll9kcm9wTGlzdHMuaW5kZXhPZih0aGlzKTtcblxuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICBDZGtEcm9wTGlzdC5fZHJvcExpc3RzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2dyb3VwKSB7XG4gICAgICB0aGlzLl9ncm91cC5faXRlbXMuZGVsZXRlKHRoaXMpO1xuICAgIH1cblxuICAgIHRoaXMuX2Ryb3BMaXN0UmVmLmRpc3Bvc2UoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQubmV4dCgpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5jb21wbGV0ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0YXJ0cyBkcmFnZ2luZyBhbiBpdGVtLlxuICAgKiBAZGVwcmVjYXRlZCBObyBsb25nZXIgYmVpbmcgdXNlZC4gVG8gYmUgcmVtb3ZlZC5cbiAgICogQGJyZWFraW5nLWNoYW5nZSAxMC4wLjBcbiAgICovXG4gIHN0YXJ0KCk6IHZvaWQge1xuICAgIHRoaXMuX2Ryb3BMaXN0UmVmLnN0YXJ0KCk7XG4gIH1cblxuICAvKipcbiAgICogRHJvcHMgYW4gaXRlbSBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIGJlaW5nIGRyb3BwZWQgaW50byB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gY3VycmVudEluZGV4IEluZGV4IGF0IHdoaWNoIHRoZSBpdGVtIHNob3VsZCBiZSBpbnNlcnRlZC5cbiAgICogQHBhcmFtIHByZXZpb3VzQ29udGFpbmVyIENvbnRhaW5lciBmcm9tIHdoaWNoIHRoZSBpdGVtIGdvdCBkcmFnZ2VkIGluLlxuICAgKiBAcGFyYW0gaXNQb2ludGVyT3ZlckNvbnRhaW5lciBXaGV0aGVyIHRoZSB1c2VyJ3MgcG9pbnRlciB3YXMgb3ZlciB0aGVcbiAgICogICAgY29udGFpbmVyIHdoZW4gdGhlIGl0ZW0gd2FzIGRyb3BwZWQuXG4gICAqXG4gICAqIEBkZXByZWNhdGVkIE5vIGxvbmdlciBiZWluZyB1c2VkLiBUbyBiZSByZW1vdmVkLlxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDEwLjAuMFxuICAgKi9cbiAgZHJvcChpdGVtOiBDZGtEcmFnLCBjdXJyZW50SW5kZXg6IG51bWJlciwgcHJldmlvdXNDb250YWluZXI6IENka0Ryb3BMaXN0LFxuICAgIGlzUG9pbnRlck92ZXJDb250YWluZXI6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICB0aGlzLl9kcm9wTGlzdFJlZi5kcm9wKGl0ZW0uX2RyYWdSZWYsIGN1cnJlbnRJbmRleCwgcHJldmlvdXNDb250YWluZXIuX2Ryb3BMaXN0UmVmLFxuICAgICAgICBpc1BvaW50ZXJPdmVyQ29udGFpbmVyLCB7eDogMCwgeTogMH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEVtaXRzIGFuIGV2ZW50IHRvIGluZGljYXRlIHRoYXQgdGhlIHVzZXIgbW92ZWQgYW4gaXRlbSBpbnRvIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdGhhdCB3YXMgbW92ZWQgaW50byB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gcG9pbnRlclggUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFggYXhpcy5cbiAgICogQHBhcmFtIHBvaW50ZXJZIFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBZIGF4aXMuXG4gICAqIEBkZXByZWNhdGVkIE5vIGxvbmdlciBiZWluZyB1c2VkLiBUbyBiZSByZW1vdmVkLlxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDEwLjAuMFxuICAgKi9cbiAgZW50ZXIoaXRlbTogQ2RrRHJhZywgcG9pbnRlclg6IG51bWJlciwgcG9pbnRlclk6IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMuX2Ryb3BMaXN0UmVmLmVudGVyKGl0ZW0uX2RyYWdSZWYsIHBvaW50ZXJYLCBwb2ludGVyWSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhbiBpdGVtIGZyb20gdGhlIGNvbnRhaW5lciBhZnRlciBpdCB3YXMgZHJhZ2dlZCBpbnRvIGFub3RoZXIgY29udGFpbmVyIGJ5IHRoZSB1c2VyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRoYXQgd2FzIGRyYWdnZWQgb3V0LlxuICAgKiBAZGVwcmVjYXRlZCBObyBsb25nZXIgYmVpbmcgdXNlZC4gVG8gYmUgcmVtb3ZlZC5cbiAgICogQGJyZWFraW5nLWNoYW5nZSAxMC4wLjBcbiAgICovXG4gIGV4aXQoaXRlbTogQ2RrRHJhZyk6IHZvaWQge1xuICAgIHRoaXMuX2Ryb3BMaXN0UmVmLmV4aXQoaXRlbS5fZHJhZ1JlZik7XG4gIH1cblxuICAvKipcbiAgICogRmlndXJlcyBvdXQgdGhlIGluZGV4IG9mIGFuIGl0ZW0gaW4gdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB3aG9zZSBpbmRleCBzaG91bGQgYmUgZGV0ZXJtaW5lZC5cbiAgICogQGRlcHJlY2F0ZWQgTm8gbG9uZ2VyIGJlaW5nIHVzZWQuIFRvIGJlIHJlbW92ZWQuXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMTAuMC4wXG4gICAqL1xuICBnZXRJdGVtSW5kZXgoaXRlbTogQ2RrRHJhZyk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX2Ryb3BMaXN0UmVmLmdldEl0ZW1JbmRleChpdGVtLl9kcmFnUmVmKTtcbiAgfVxuXG4gIC8qKiBTeW5jcyB0aGUgaW5wdXRzIG9mIHRoZSBDZGtEcm9wTGlzdCB3aXRoIHRoZSBvcHRpb25zIG9mIHRoZSB1bmRlcmx5aW5nIERyb3BMaXN0UmVmLiAqL1xuICBwcml2YXRlIF9zZXR1cElucHV0U3luY1N1YnNjcmlwdGlvbihyZWY6IERyb3BMaXN0UmVmPENka0Ryb3BMaXN0Pikge1xuICAgIGlmICh0aGlzLl9kaXIpIHtcbiAgICAgIHRoaXMuX2Rpci5jaGFuZ2VcbiAgICAgICAgLnBpcGUoc3RhcnRXaXRoKHRoaXMuX2Rpci52YWx1ZSksIHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpKVxuICAgICAgICAuc3Vic2NyaWJlKHZhbHVlID0+IHJlZi53aXRoRGlyZWN0aW9uKHZhbHVlKSk7XG4gICAgfVxuXG4gICAgcmVmLmJlZm9yZVN0YXJ0ZWQuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIGNvbnN0IHNpYmxpbmdzID0gY29lcmNlQXJyYXkodGhpcy5jb25uZWN0ZWRUbykubWFwKGRyb3AgPT4ge1xuICAgICAgICByZXR1cm4gdHlwZW9mIGRyb3AgPT09ICdzdHJpbmcnID9cbiAgICAgICAgICAgIENka0Ryb3BMaXN0Ll9kcm9wTGlzdHMuZmluZChsaXN0ID0+IGxpc3QuaWQgPT09IGRyb3ApISA6IGRyb3A7XG4gICAgICB9KTtcblxuICAgICAgaWYgKHRoaXMuX2dyb3VwKSB7XG4gICAgICAgIHRoaXMuX2dyb3VwLl9pdGVtcy5mb3JFYWNoKGRyb3AgPT4ge1xuICAgICAgICAgIGlmIChzaWJsaW5ncy5pbmRleE9mKGRyb3ApID09PSAtMSkge1xuICAgICAgICAgICAgc2libGluZ3MucHVzaChkcm9wKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZWYuZGlzYWJsZWQgPSB0aGlzLmRpc2FibGVkO1xuICAgICAgcmVmLmxvY2tBeGlzID0gdGhpcy5sb2NrQXhpcztcbiAgICAgIHJlZi5zb3J0aW5nRGlzYWJsZWQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodGhpcy5zb3J0aW5nRGlzYWJsZWQpO1xuICAgICAgcmVmLmF1dG9TY3JvbGxEaXNhYmxlZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh0aGlzLmF1dG9TY3JvbGxEaXNhYmxlZCk7XG4gICAgICByZWZcbiAgICAgICAgLmNvbm5lY3RlZFRvKHNpYmxpbmdzLmZpbHRlcihkcm9wID0+IGRyb3AgJiYgZHJvcCAhPT0gdGhpcykubWFwKGxpc3QgPT4gbGlzdC5fZHJvcExpc3RSZWYpKVxuICAgICAgICAud2l0aE9yaWVudGF0aW9uKHRoaXMub3JpZW50YXRpb24pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIEhhbmRsZXMgZXZlbnRzIGZyb20gdGhlIHVuZGVybHlpbmcgRHJvcExpc3RSZWYuICovXG4gIHByaXZhdGUgX2hhbmRsZUV2ZW50cyhyZWY6IERyb3BMaXN0UmVmPENka0Ryb3BMaXN0Pikge1xuICAgIHJlZi5iZWZvcmVTdGFydGVkLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgICB9KTtcblxuICAgIHJlZi5lbnRlcmVkLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICB0aGlzLmVudGVyZWQuZW1pdCh7XG4gICAgICAgIGNvbnRhaW5lcjogdGhpcyxcbiAgICAgICAgaXRlbTogZXZlbnQuaXRlbS5kYXRhLFxuICAgICAgICBjdXJyZW50SW5kZXg6IGV2ZW50LmN1cnJlbnRJbmRleFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZWYuZXhpdGVkLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICB0aGlzLmV4aXRlZC5lbWl0KHtcbiAgICAgICAgY29udGFpbmVyOiB0aGlzLFxuICAgICAgICBpdGVtOiBldmVudC5pdGVtLmRhdGFcbiAgICAgIH0pO1xuICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgfSk7XG5cbiAgICByZWYuc29ydGVkLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICB0aGlzLnNvcnRlZC5lbWl0KHtcbiAgICAgICAgcHJldmlvdXNJbmRleDogZXZlbnQucHJldmlvdXNJbmRleCxcbiAgICAgICAgY3VycmVudEluZGV4OiBldmVudC5jdXJyZW50SW5kZXgsXG4gICAgICAgIGNvbnRhaW5lcjogdGhpcyxcbiAgICAgICAgaXRlbTogZXZlbnQuaXRlbS5kYXRhXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJlZi5kcm9wcGVkLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICB0aGlzLmRyb3BwZWQuZW1pdCh7XG4gICAgICAgIHByZXZpb3VzSW5kZXg6IGV2ZW50LnByZXZpb3VzSW5kZXgsXG4gICAgICAgIGN1cnJlbnRJbmRleDogZXZlbnQuY3VycmVudEluZGV4LFxuICAgICAgICBwcmV2aW91c0NvbnRhaW5lcjogZXZlbnQucHJldmlvdXNDb250YWluZXIuZGF0YSxcbiAgICAgICAgY29udGFpbmVyOiBldmVudC5jb250YWluZXIuZGF0YSxcbiAgICAgICAgaXRlbTogZXZlbnQuaXRlbS5kYXRhLFxuICAgICAgICBpc1BvaW50ZXJPdmVyQ29udGFpbmVyOiBldmVudC5pc1BvaW50ZXJPdmVyQ29udGFpbmVyLFxuICAgICAgICBkaXN0YW5jZTogZXZlbnQuZGlzdGFuY2VcbiAgICAgIH0pO1xuXG4gICAgICAvLyBNYXJrIGZvciBjaGVjayBzaW5jZSBhbGwgb2YgdGhlc2UgZXZlbnRzIHJ1biBvdXRzaWRlIG9mIGNoYW5nZVxuICAgICAgLy8gZGV0ZWN0aW9uIGFuZCB3ZSdyZSBub3QgZ3VhcmFudGVlZCBmb3Igc29tZXRoaW5nIGVsc2UgdG8gaGF2ZSB0cmlnZ2VyZWQgaXQuXG4gICAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9kaXNhYmxlZDogQm9vbGVhbklucHV0O1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfc29ydGluZ0Rpc2FibGVkOiBCb29sZWFuSW5wdXQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9hdXRvU2Nyb2xsRGlzYWJsZWQ6IEJvb2xlYW5JbnB1dDtcbn1cbiJdfQ==