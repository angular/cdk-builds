/**
 * @fileoverview added by tsickle
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
        this._syncInputs(this._dropListRef);
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
        this._disabled = coerceBooleanProperty(value);
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
    _syncInputs(ref) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZGlyZWN0aXZlcy9kcm9wLWxpc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsV0FBVyxFQUFFLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDekUsT0FBTyxFQUNMLGVBQWUsRUFDZixVQUFVLEVBQ1YsWUFBWSxFQUNaLEtBQUssRUFFTCxNQUFNLEVBQ04sU0FBUyxFQUNULFFBQVEsRUFDUixTQUFTLEVBQ1QsaUJBQWlCLEVBQ2pCLFFBQVEsR0FFVCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFOUMsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFHbkQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUN0QyxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQzdCLE9BQU8sRUFBQyxTQUFTLEVBQUUsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7Ozs7O0lBR2hELGdCQUFnQixHQUFHLENBQUM7Ozs7Ozs7QUFPeEIseUNBQTJEO1dBUWpCLFNBQVM7Ozs7O0FBV25ELE1BQU0sT0FBTyxXQUFXOzs7Ozs7OztJQWtGdEIsWUFFVyxPQUFnQyxFQUFFLFFBQWtCLEVBQ25ELGtCQUFxQyxFQUFzQixJQUFxQixFQUN4RCxNQUFzQztRQUYvRCxZQUFPLEdBQVAsT0FBTyxDQUF5QjtRQUMvQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW1CO1FBQXNCLFNBQUksR0FBSixJQUFJLENBQWlCO1FBQ3hELFdBQU0sR0FBTixNQUFNLENBQWdDOzs7O1FBcEZs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NUQsK0JBQWtEOzs7OztJQVVsRCxnQ0FBMEI7Ozs7O0lBRzFCLHNDQUNpQzs7Ozs7O0lBTWpDLHFDQUMwRTs7Ozs7SUFHMUUseUNBQ29DOzs7OztJQUdwQyw4QkFDcUY7Ozs7O0lBS3JGLDhCQUM2RTs7Ozs7O0lBTTdFLDZCQUMwRTs7Ozs7SUFHMUUsNkJBQ29GOzs7OztJQUloRiw4QkFBdUM7Ozs7O0lBQ3ZDLHlDQUE2Qzs7Ozs7SUFBRSwyQkFBeUM7Ozs7O0lBQ3hGLDZCQUFzRSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2NvZXJjZUFycmF5LCBjb2VyY2VCb29sZWFuUHJvcGVydHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge1xuICBDb250ZW50Q2hpbGRyZW4sXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5wdXQsXG4gIE9uRGVzdHJveSxcbiAgT3V0cHV0LFxuICBRdWVyeUxpc3QsXG4gIE9wdGlvbmFsLFxuICBEaXJlY3RpdmUsXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBTa2lwU2VsZixcbiAgQWZ0ZXJDb250ZW50SW5pdCxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0RpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge0Nka0RyYWcsIENES19EUk9QX0xJU1R9IGZyb20gJy4vZHJhZyc7XG5pbXBvcnQge0Nka0RyYWdEcm9wLCBDZGtEcmFnRW50ZXIsIENka0RyYWdFeGl0LCBDZGtEcmFnU29ydEV2ZW50fSBmcm9tICcuLi9kcmFnLWV2ZW50cyc7XG5pbXBvcnQge0Nka0Ryb3BMaXN0R3JvdXB9IGZyb20gJy4vZHJvcC1saXN0LWdyb3VwJztcbmltcG9ydCB7RHJvcExpc3RSZWZ9IGZyb20gJy4uL2Ryb3AtbGlzdC1yZWYnO1xuaW1wb3J0IHtEcmFnUmVmfSBmcm9tICcuLi9kcmFnLXJlZic7XG5pbXBvcnQge0RyYWdEcm9wfSBmcm9tICcuLi9kcmFnLWRyb3AnO1xuaW1wb3J0IHtTdWJqZWN0fSBmcm9tICdyeGpzJztcbmltcG9ydCB7c3RhcnRXaXRoLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuLyoqIENvdW50ZXIgdXNlZCB0byBnZW5lcmF0ZSB1bmlxdWUgaWRzIGZvciBkcm9wIHpvbmVzLiAqL1xubGV0IF91bmlxdWVJZENvdW50ZXIgPSAwO1xuXG4vKipcbiAqIEludGVybmFsIGNvbXBpbGUtdGltZS1vbmx5IHJlcHJlc2VudGF0aW9uIG9mIGEgYENka0Ryb3BMaXN0YC5cbiAqIFVzZWQgdG8gYXZvaWQgY2lyY3VsYXIgaW1wb3J0IGlzc3VlcyBiZXR3ZWVuIHRoZSBgQ2RrRHJvcExpc3RgIGFuZCB0aGUgYENka0RyYWdgLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIENka0Ryb3BMaXN0SW50ZXJuYWwgZXh0ZW5kcyBDZGtEcm9wTGlzdCB7fVxuXG4vKiogQ29udGFpbmVyIHRoYXQgd3JhcHMgYSBzZXQgb2YgZHJhZ2dhYmxlIGl0ZW1zLiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka0Ryb3BMaXN0XSwgY2RrLWRyb3AtbGlzdCcsXG4gIGV4cG9ydEFzOiAnY2RrRHJvcExpc3QnLFxuICBwcm92aWRlcnM6IFtcbiAgICAvLyBQcmV2ZW50IGNoaWxkIGRyb3AgbGlzdHMgZnJvbSBwaWNraW5nIHVwIHRoZSBzYW1lIGdyb3VwIGFzIHRoZWlyIHBhcmVudC5cbiAgICB7cHJvdmlkZTogQ2RrRHJvcExpc3RHcm91cCwgdXNlVmFsdWU6IHVuZGVmaW5lZH0sXG4gICAge3Byb3ZpZGU6IENES19EUk9QX0xJU1QsIHVzZUV4aXN0aW5nOiBDZGtEcm9wTGlzdH0sXG4gIF0sXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLWRyb3AtbGlzdCcsXG4gICAgJ1tpZF0nOiAnaWQnLFxuICAgICdbY2xhc3MuY2RrLWRyb3AtbGlzdC1kaXNhYmxlZF0nOiAnZGlzYWJsZWQnLFxuICAgICdbY2xhc3MuY2RrLWRyb3AtbGlzdC1kcmFnZ2luZ10nOiAnX2Ryb3BMaXN0UmVmLmlzRHJhZ2dpbmcoKScsXG4gICAgJ1tjbGFzcy5jZGstZHJvcC1saXN0LXJlY2VpdmluZ10nOiAnX2Ryb3BMaXN0UmVmLmlzUmVjZWl2aW5nKCknLFxuICB9XG59KVxuZXhwb3J0IGNsYXNzIENka0Ryb3BMaXN0PFQgPSBhbnk+IGltcGxlbWVudHMgQWZ0ZXJDb250ZW50SW5pdCwgT25EZXN0cm95IHtcbiAgLyoqIEVtaXRzIHdoZW4gdGhlIGxpc3QgaGFzIGJlZW4gZGVzdHJveWVkLiAqL1xuICBwcml2YXRlIF9kZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBLZWVwcyB0cmFjayBvZiB0aGUgZHJvcCBsaXN0cyB0aGF0IGFyZSBjdXJyZW50bHkgb24gdGhlIHBhZ2UuICovXG4gIHByaXZhdGUgc3RhdGljIF9kcm9wTGlzdHM6IENka0Ryb3BMaXN0W10gPSBbXTtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSB1bmRlcmx5aW5nIGRyb3AgbGlzdCBpbnN0YW5jZS4gKi9cbiAgX2Ryb3BMaXN0UmVmOiBEcm9wTGlzdFJlZjxDZGtEcm9wTGlzdDxUPj47XG5cbiAgLyoqIERyYWdnYWJsZSBpdGVtcyBpbiB0aGUgY29udGFpbmVyLiAqL1xuICBAQ29udGVudENoaWxkcmVuKENka0RyYWcsIHtkZXNjZW5kYW50czogdHJ1ZX0pIF9kcmFnZ2FibGVzOiBRdWVyeUxpc3Q8Q2RrRHJhZz47XG5cbiAgLyoqXG4gICAqIE90aGVyIGRyYWdnYWJsZSBjb250YWluZXJzIHRoYXQgdGhpcyBjb250YWluZXIgaXMgY29ubmVjdGVkIHRvIGFuZCBpbnRvIHdoaWNoIHRoZVxuICAgKiBjb250YWluZXIncyBpdGVtcyBjYW4gYmUgdHJhbnNmZXJyZWQuIENhbiBlaXRoZXIgYmUgcmVmZXJlbmNlcyB0byBvdGhlciBkcm9wIGNvbnRhaW5lcnMsXG4gICAqIG9yIHRoZWlyIHVuaXF1ZSBJRHMuXG4gICAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0Q29ubmVjdGVkVG8nKVxuICBjb25uZWN0ZWRUbzogKENka0Ryb3BMaXN0IHwgc3RyaW5nKVtdIHwgQ2RrRHJvcExpc3QgfCBzdHJpbmcgPSBbXTtcblxuICAvKiogQXJiaXRyYXJ5IGRhdGEgdG8gYXR0YWNoIHRvIHRoaXMgY29udGFpbmVyLiAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0RGF0YScpIGRhdGE6IFQ7XG5cbiAgLyoqIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgbGlzdCBpcyBvcmllbnRlZC4gKi9cbiAgQElucHV0KCdjZGtEcm9wTGlzdE9yaWVudGF0aW9uJykgb3JpZW50YXRpb246ICdob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCcgPSAndmVydGljYWwnO1xuXG4gIC8qKlxuICAgKiBVbmlxdWUgSUQgZm9yIHRoZSBkcm9wIHpvbmUuIENhbiBiZSB1c2VkIGFzIGEgcmVmZXJlbmNlXG4gICAqIGluIHRoZSBgY29ubmVjdGVkVG9gIG9mIGFub3RoZXIgYENka0Ryb3BMaXN0YC5cbiAgICovXG4gIEBJbnB1dCgpIGlkOiBzdHJpbmcgPSBgY2RrLWRyb3AtbGlzdC0ke191bmlxdWVJZENvdW50ZXIrK31gO1xuXG4gIC8qKiBMb2NrcyB0aGUgcG9zaXRpb24gb2YgdGhlIGRyYWdnYWJsZSBlbGVtZW50cyBpbnNpZGUgdGhlIGNvbnRhaW5lciBhbG9uZyB0aGUgc3BlY2lmaWVkIGF4aXMuICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3RMb2NrQXhpcycpIGxvY2tBeGlzOiAneCcgfCAneSc7XG5cbiAgLyoqIFdoZXRoZXIgc3RhcnRpbmcgYSBkcmFnZ2luZyBzZXF1ZW5jZSBmcm9tIHRoaXMgY29udGFpbmVyIGlzIGRpc2FibGVkLiAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0RGlzYWJsZWQnKVxuICBnZXQgZGlzYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2Rpc2FibGVkIHx8ICghIXRoaXMuX2dyb3VwICYmIHRoaXMuX2dyb3VwLmRpc2FibGVkKTtcbiAgfVxuICBzZXQgZGlzYWJsZWQodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9kaXNhYmxlZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gIH1cbiAgcHJpdmF0ZSBfZGlzYWJsZWQgPSBmYWxzZTtcblxuICAvKiogV2hldGhlciBzb3J0aW5nIHdpdGhpbiB0aGlzIGRyb3AgbGlzdCBpcyBkaXNhYmxlZC4gKi9cbiAgQElucHV0KCdjZGtEcm9wTGlzdFNvcnRpbmdEaXNhYmxlZCcpXG4gIHNvcnRpbmdEaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBGdW5jdGlvbiB0aGF0IGlzIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYW4gaXRlbVxuICAgKiBpcyBhbGxvd2VkIHRvIGJlIG1vdmVkIGludG8gYSBkcm9wIGNvbnRhaW5lci5cbiAgICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3RFbnRlclByZWRpY2F0ZScpXG4gIGVudGVyUHJlZGljYXRlOiAoZHJhZzogQ2RrRHJhZywgZHJvcDogQ2RrRHJvcExpc3QpID0+IGJvb2xlYW4gPSAoKSA9PiB0cnVlXG5cbiAgLyoqIFdoZXRoZXIgdG8gYXV0by1zY3JvbGwgdGhlIHZpZXcgd2hlbiB0aGUgdXNlciBtb3ZlcyB0aGVpciBwb2ludGVyIGNsb3NlIHRvIHRoZSBlZGdlcy4gKi9cbiAgQElucHV0KCdjZGtEcm9wTGlzdEF1dG9TY3JvbGxEaXNhYmxlZCcpXG4gIGF1dG9TY3JvbGxEaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGRyb3BzIGFuIGl0ZW0gaW5zaWRlIHRoZSBjb250YWluZXIuICovXG4gIEBPdXRwdXQoJ2Nka0Ryb3BMaXN0RHJvcHBlZCcpXG4gIGRyb3BwZWQ6IEV2ZW50RW1pdHRlcjxDZGtEcmFnRHJvcDxULCBhbnk+PiA9IG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0Ryb3A8VCwgYW55Pj4oKTtcblxuICAvKipcbiAgICogRW1pdHMgd2hlbiB0aGUgdXNlciBoYXMgbW92ZWQgYSBuZXcgZHJhZyBpdGVtIGludG8gdGhpcyBjb250YWluZXIuXG4gICAqL1xuICBAT3V0cHV0KCdjZGtEcm9wTGlzdEVudGVyZWQnKVxuICBlbnRlcmVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0VudGVyPFQ+PiA9IG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0VudGVyPFQ+PigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHJlbW92ZXMgYW4gaXRlbSBmcm9tIHRoZSBjb250YWluZXJcbiAgICogYnkgZHJhZ2dpbmcgaXQgaW50byBhbm90aGVyIGNvbnRhaW5lci5cbiAgICovXG4gIEBPdXRwdXQoJ2Nka0Ryb3BMaXN0RXhpdGVkJylcbiAgZXhpdGVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0V4aXQ8VD4+ID0gbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnRXhpdDxUPj4oKTtcblxuICAvKiogRW1pdHMgYXMgdGhlIHVzZXIgaXMgc3dhcHBpbmcgaXRlbXMgd2hpbGUgYWN0aXZlbHkgZHJhZ2dpbmcuICovXG4gIEBPdXRwdXQoJ2Nka0Ryb3BMaXN0U29ydGVkJylcbiAgc29ydGVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ1NvcnRFdmVudDxUPj4gPSBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdTb3J0RXZlbnQ8VD4+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICAvKiogRWxlbWVudCB0aGF0IHRoZSBkcm9wIGxpc3QgaXMgYXR0YWNoZWQgdG8uICovXG4gICAgICBwdWJsaWMgZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sIGRyYWdEcm9wOiBEcmFnRHJvcCxcbiAgICAgIHByaXZhdGUgX2NoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZiwgQE9wdGlvbmFsKCkgcHJpdmF0ZSBfZGlyPzogRGlyZWN0aW9uYWxpdHksXG4gICAgICBAT3B0aW9uYWwoKSBAU2tpcFNlbGYoKSBwcml2YXRlIF9ncm91cD86IENka0Ryb3BMaXN0R3JvdXA8Q2RrRHJvcExpc3Q+KSB7XG4gICAgdGhpcy5fZHJvcExpc3RSZWYgPSBkcmFnRHJvcC5jcmVhdGVEcm9wTGlzdChlbGVtZW50KTtcbiAgICB0aGlzLl9kcm9wTGlzdFJlZi5kYXRhID0gdGhpcztcbiAgICB0aGlzLl9kcm9wTGlzdFJlZi5lbnRlclByZWRpY2F0ZSA9IChkcmFnOiBEcmFnUmVmPENka0RyYWc+LCBkcm9wOiBEcm9wTGlzdFJlZjxDZGtEcm9wTGlzdD4pID0+IHtcbiAgICAgIHJldHVybiB0aGlzLmVudGVyUHJlZGljYXRlKGRyYWcuZGF0YSwgZHJvcC5kYXRhKTtcbiAgICB9O1xuXG4gICAgdGhpcy5fc3luY0lucHV0cyh0aGlzLl9kcm9wTGlzdFJlZik7XG4gICAgdGhpcy5faGFuZGxlRXZlbnRzKHRoaXMuX2Ryb3BMaXN0UmVmKTtcbiAgICBDZGtEcm9wTGlzdC5fZHJvcExpc3RzLnB1c2godGhpcyk7XG5cbiAgICBpZiAoX2dyb3VwKSB7XG4gICAgICBfZ3JvdXAuX2l0ZW1zLmFkZCh0aGlzKTtcbiAgICB9XG4gIH1cblxuICBuZ0FmdGVyQ29udGVudEluaXQoKSB7XG4gICAgdGhpcy5fZHJhZ2dhYmxlcy5jaGFuZ2VzXG4gICAgICAucGlwZShzdGFydFdpdGgodGhpcy5fZHJhZ2dhYmxlcyksIHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpKVxuICAgICAgLnN1YnNjcmliZSgoaXRlbXM6IFF1ZXJ5TGlzdDxDZGtEcmFnPikgPT4ge1xuICAgICAgICB0aGlzLl9kcm9wTGlzdFJlZi53aXRoSXRlbXMoaXRlbXMucmVkdWNlKChmaWx0ZXJlZEl0ZW1zLCBkcmFnKSA9PiB7XG4gICAgICAgICAgaWYgKGRyYWcuZHJvcENvbnRhaW5lciA9PT0gdGhpcykge1xuICAgICAgICAgICAgZmlsdGVyZWRJdGVtcy5wdXNoKGRyYWcuX2RyYWdSZWYpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBmaWx0ZXJlZEl0ZW1zO1xuICAgICAgICB9LCBbXSBhcyBEcmFnUmVmW10pKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgY29uc3QgaW5kZXggPSBDZGtEcm9wTGlzdC5fZHJvcExpc3RzLmluZGV4T2YodGhpcyk7XG5cbiAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgQ2RrRHJvcExpc3QuX2Ryb3BMaXN0cy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ncm91cCkge1xuICAgICAgdGhpcy5fZ3JvdXAuX2l0ZW1zLmRlbGV0ZSh0aGlzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9kcm9wTGlzdFJlZi5kaXNwb3NlKCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydHMgZHJhZ2dpbmcgYW4gaXRlbS5cbiAgICogQGRlcHJlY2F0ZWQgTm8gbG9uZ2VyIGJlaW5nIHVzZWQuIFRvIGJlIHJlbW92ZWQuXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMTAuMC4wXG4gICAqL1xuICBzdGFydCgpOiB2b2lkIHtcbiAgICB0aGlzLl9kcm9wTGlzdFJlZi5zdGFydCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIERyb3BzIGFuIGl0ZW0gaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSBiZWluZyBkcm9wcGVkIGludG8gdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGN1cnJlbnRJbmRleCBJbmRleCBhdCB3aGljaCB0aGUgaXRlbSBzaG91bGQgYmUgaW5zZXJ0ZWQuXG4gICAqIEBwYXJhbSBwcmV2aW91c0NvbnRhaW5lciBDb250YWluZXIgZnJvbSB3aGljaCB0aGUgaXRlbSBnb3QgZHJhZ2dlZCBpbi5cbiAgICogQHBhcmFtIGlzUG9pbnRlck92ZXJDb250YWluZXIgV2hldGhlciB0aGUgdXNlcidzIHBvaW50ZXIgd2FzIG92ZXIgdGhlXG4gICAqICAgIGNvbnRhaW5lciB3aGVuIHRoZSBpdGVtIHdhcyBkcm9wcGVkLlxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBObyBsb25nZXIgYmVpbmcgdXNlZC4gVG8gYmUgcmVtb3ZlZC5cbiAgICogQGJyZWFraW5nLWNoYW5nZSAxMC4wLjBcbiAgICovXG4gIGRyb3AoaXRlbTogQ2RrRHJhZywgY3VycmVudEluZGV4OiBudW1iZXIsIHByZXZpb3VzQ29udGFpbmVyOiBDZGtEcm9wTGlzdCxcbiAgICBpc1BvaW50ZXJPdmVyQ29udGFpbmVyOiBib29sZWFuKTogdm9pZCB7XG4gICAgdGhpcy5fZHJvcExpc3RSZWYuZHJvcChpdGVtLl9kcmFnUmVmLCBjdXJyZW50SW5kZXgsIHByZXZpb3VzQ29udGFpbmVyLl9kcm9wTGlzdFJlZixcbiAgICAgICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lciwge3g6IDAsIHk6IDB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbWl0cyBhbiBldmVudCB0byBpbmRpY2F0ZSB0aGF0IHRoZSB1c2VyIG1vdmVkIGFuIGl0ZW0gaW50byB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRoYXQgd2FzIG1vdmVkIGludG8gdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKiBAZGVwcmVjYXRlZCBObyBsb25nZXIgYmVpbmcgdXNlZC4gVG8gYmUgcmVtb3ZlZC5cbiAgICogQGJyZWFraW5nLWNoYW5nZSAxMC4wLjBcbiAgICovXG4gIGVudGVyKGl0ZW06IENka0RyYWcsIHBvaW50ZXJYOiBudW1iZXIsIHBvaW50ZXJZOiBudW1iZXIpOiB2b2lkIHtcbiAgICB0aGlzLl9kcm9wTGlzdFJlZi5lbnRlcihpdGVtLl9kcmFnUmVmLCBwb2ludGVyWCwgcG9pbnRlclkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYW4gaXRlbSBmcm9tIHRoZSBjb250YWluZXIgYWZ0ZXIgaXQgd2FzIGRyYWdnZWQgaW50byBhbm90aGVyIGNvbnRhaW5lciBieSB0aGUgdXNlci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB0aGF0IHdhcyBkcmFnZ2VkIG91dC5cbiAgICogQGRlcHJlY2F0ZWQgTm8gbG9uZ2VyIGJlaW5nIHVzZWQuIFRvIGJlIHJlbW92ZWQuXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMTAuMC4wXG4gICAqL1xuICBleGl0KGl0ZW06IENka0RyYWcpOiB2b2lkIHtcbiAgICB0aGlzLl9kcm9wTGlzdFJlZi5leGl0KGl0ZW0uX2RyYWdSZWYpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpZ3VyZXMgb3V0IHRoZSBpbmRleCBvZiBhbiBpdGVtIGluIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gd2hvc2UgaW5kZXggc2hvdWxkIGJlIGRldGVybWluZWQuXG4gICAqIEBkZXByZWNhdGVkIE5vIGxvbmdlciBiZWluZyB1c2VkLiBUbyBiZSByZW1vdmVkLlxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDEwLjAuMFxuICAgKi9cbiAgZ2V0SXRlbUluZGV4KGl0ZW06IENka0RyYWcpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9kcm9wTGlzdFJlZi5nZXRJdGVtSW5kZXgoaXRlbS5fZHJhZ1JlZik7XG4gIH1cblxuICAvKiogU3luY3MgdGhlIGlucHV0cyBvZiB0aGUgQ2RrRHJvcExpc3Qgd2l0aCB0aGUgb3B0aW9ucyBvZiB0aGUgdW5kZXJseWluZyBEcm9wTGlzdFJlZi4gKi9cbiAgcHJpdmF0ZSBfc3luY0lucHV0cyhyZWY6IERyb3BMaXN0UmVmPENka0Ryb3BMaXN0Pikge1xuICAgIGlmICh0aGlzLl9kaXIpIHtcbiAgICAgIHRoaXMuX2Rpci5jaGFuZ2VcbiAgICAgICAgLnBpcGUoc3RhcnRXaXRoKHRoaXMuX2Rpci52YWx1ZSksIHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpKVxuICAgICAgICAuc3Vic2NyaWJlKHZhbHVlID0+IHJlZi53aXRoRGlyZWN0aW9uKHZhbHVlKSk7XG4gICAgfVxuXG4gICAgcmVmLmJlZm9yZVN0YXJ0ZWQuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIGNvbnN0IHNpYmxpbmdzID0gY29lcmNlQXJyYXkodGhpcy5jb25uZWN0ZWRUbykubWFwKGRyb3AgPT4ge1xuICAgICAgICByZXR1cm4gdHlwZW9mIGRyb3AgPT09ICdzdHJpbmcnID9cbiAgICAgICAgICAgIENka0Ryb3BMaXN0Ll9kcm9wTGlzdHMuZmluZChsaXN0ID0+IGxpc3QuaWQgPT09IGRyb3ApISA6IGRyb3A7XG4gICAgICB9KTtcblxuICAgICAgaWYgKHRoaXMuX2dyb3VwKSB7XG4gICAgICAgIHRoaXMuX2dyb3VwLl9pdGVtcy5mb3JFYWNoKGRyb3AgPT4ge1xuICAgICAgICAgIGlmIChzaWJsaW5ncy5pbmRleE9mKGRyb3ApID09PSAtMSkge1xuICAgICAgICAgICAgc2libGluZ3MucHVzaChkcm9wKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZWYuZGlzYWJsZWQgPSB0aGlzLmRpc2FibGVkO1xuICAgICAgcmVmLmxvY2tBeGlzID0gdGhpcy5sb2NrQXhpcztcbiAgICAgIHJlZi5zb3J0aW5nRGlzYWJsZWQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodGhpcy5zb3J0aW5nRGlzYWJsZWQpO1xuICAgICAgcmVmLmF1dG9TY3JvbGxEaXNhYmxlZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh0aGlzLmF1dG9TY3JvbGxEaXNhYmxlZCk7XG4gICAgICByZWZcbiAgICAgICAgLmNvbm5lY3RlZFRvKHNpYmxpbmdzLmZpbHRlcihkcm9wID0+IGRyb3AgJiYgZHJvcCAhPT0gdGhpcykubWFwKGxpc3QgPT4gbGlzdC5fZHJvcExpc3RSZWYpKVxuICAgICAgICAud2l0aE9yaWVudGF0aW9uKHRoaXMub3JpZW50YXRpb24pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIEhhbmRsZXMgZXZlbnRzIGZyb20gdGhlIHVuZGVybHlpbmcgRHJvcExpc3RSZWYuICovXG4gIHByaXZhdGUgX2hhbmRsZUV2ZW50cyhyZWY6IERyb3BMaXN0UmVmPENka0Ryb3BMaXN0Pikge1xuICAgIHJlZi5iZWZvcmVTdGFydGVkLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgICB9KTtcblxuICAgIHJlZi5lbnRlcmVkLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICB0aGlzLmVudGVyZWQuZW1pdCh7XG4gICAgICAgIGNvbnRhaW5lcjogdGhpcyxcbiAgICAgICAgaXRlbTogZXZlbnQuaXRlbS5kYXRhLFxuICAgICAgICBjdXJyZW50SW5kZXg6IGV2ZW50LmN1cnJlbnRJbmRleFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZWYuZXhpdGVkLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICB0aGlzLmV4aXRlZC5lbWl0KHtcbiAgICAgICAgY29udGFpbmVyOiB0aGlzLFxuICAgICAgICBpdGVtOiBldmVudC5pdGVtLmRhdGFcbiAgICAgIH0pO1xuICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgfSk7XG5cbiAgICByZWYuc29ydGVkLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICB0aGlzLnNvcnRlZC5lbWl0KHtcbiAgICAgICAgcHJldmlvdXNJbmRleDogZXZlbnQucHJldmlvdXNJbmRleCxcbiAgICAgICAgY3VycmVudEluZGV4OiBldmVudC5jdXJyZW50SW5kZXgsXG4gICAgICAgIGNvbnRhaW5lcjogdGhpcyxcbiAgICAgICAgaXRlbTogZXZlbnQuaXRlbS5kYXRhXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJlZi5kcm9wcGVkLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICB0aGlzLmRyb3BwZWQuZW1pdCh7XG4gICAgICAgIHByZXZpb3VzSW5kZXg6IGV2ZW50LnByZXZpb3VzSW5kZXgsXG4gICAgICAgIGN1cnJlbnRJbmRleDogZXZlbnQuY3VycmVudEluZGV4LFxuICAgICAgICBwcmV2aW91c0NvbnRhaW5lcjogZXZlbnQucHJldmlvdXNDb250YWluZXIuZGF0YSxcbiAgICAgICAgY29udGFpbmVyOiBldmVudC5jb250YWluZXIuZGF0YSxcbiAgICAgICAgaXRlbTogZXZlbnQuaXRlbS5kYXRhLFxuICAgICAgICBpc1BvaW50ZXJPdmVyQ29udGFpbmVyOiBldmVudC5pc1BvaW50ZXJPdmVyQ29udGFpbmVyLFxuICAgICAgICBkaXN0YW5jZTogZXZlbnQuZGlzdGFuY2VcbiAgICAgIH0pO1xuXG4gICAgICAvLyBNYXJrIGZvciBjaGVjayBzaW5jZSBhbGwgb2YgdGhlc2UgZXZlbnRzIHJ1biBvdXRzaWRlIG9mIGNoYW5nZVxuICAgICAgLy8gZGV0ZWN0aW9uIGFuZCB3ZSdyZSBub3QgZ3VhcmFudGVlZCBmb3Igc29tZXRoaW5nIGVsc2UgdG8gaGF2ZSB0cmlnZ2VyZWQgaXQuXG4gICAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9kaXNhYmxlZDogYm9vbGVhbiB8IHN0cmluZztcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX3NvcnRpbmdEaXNhYmxlZDogYm9vbGVhbiB8IHN0cmluZztcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2F1dG9TY3JvbGxEaXNhYmxlZDogYm9vbGVhbiB8IHN0cmluZztcbn1cbiJdfQ==