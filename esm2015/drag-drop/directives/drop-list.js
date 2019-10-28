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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZGlyZWN0aXZlcy9kcm9wLWxpc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsV0FBVyxFQUFFLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDekUsT0FBTyxFQUNMLGVBQWUsRUFDZixVQUFVLEVBQ1YsWUFBWSxFQUNaLEtBQUssRUFFTCxNQUFNLEVBQ04sU0FBUyxFQUNULFFBQVEsRUFDUixTQUFTLEVBQ1QsaUJBQWlCLEVBQ2pCLFFBQVEsR0FFVCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFOUMsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFHbkQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUN0QyxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQzdCLE9BQU8sRUFBQyxTQUFTLEVBQUUsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7Ozs7O0lBR2hELGdCQUFnQixHQUFHLENBQUM7Ozs7Ozs7QUFPeEIseUNBQTJEO1dBUWpCLFNBQVM7Ozs7O0FBV25ELE1BQU0sT0FBTyxXQUFXOzs7Ozs7OztJQWtGdEIsWUFFVyxPQUFnQyxFQUFFLFFBQWtCLEVBQ25ELGtCQUFxQyxFQUFzQixJQUFxQixFQUN4RCxNQUFzQztRQUYvRCxZQUFPLEdBQVAsT0FBTyxDQUF5QjtRQUMvQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW1CO1FBQXNCLFNBQUksR0FBSixJQUFJLENBQWlCO1FBQ3hELFdBQU0sR0FBTixNQUFNLENBQWdDOzs7O1FBcEZs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Ozs7OztJQU1qQyxxQ0FDMEU7Ozs7O0lBRzFFLHlDQUNvQzs7Ozs7SUFHcEMsOEJBQ3FGOzs7OztJQUtyRiw4QkFDNkU7Ozs7OztJQU03RSw2QkFDMEU7Ozs7O0lBRzFFLDZCQUNvRjs7Ozs7SUFJaEYsOEJBQXVDOzs7OztJQUN2Qyx5Q0FBNkM7Ozs7O0lBQUUsMkJBQXlDOzs7OztJQUN4Riw2QkFBc0UiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtjb2VyY2VBcnJheSwgY29lcmNlQm9vbGVhblByb3BlcnR5fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtcbiAgQ29udGVudENoaWxkcmVuLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIElucHV0LFxuICBPbkRlc3Ryb3ksXG4gIE91dHB1dCxcbiAgUXVlcnlMaXN0LFxuICBPcHRpb25hbCxcbiAgRGlyZWN0aXZlLFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgU2tpcFNlbGYsXG4gIEFmdGVyQ29udGVudEluaXQsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtDZGtEcmFnLCBDREtfRFJPUF9MSVNUfSBmcm9tICcuL2RyYWcnO1xuaW1wb3J0IHtDZGtEcmFnRHJvcCwgQ2RrRHJhZ0VudGVyLCBDZGtEcmFnRXhpdCwgQ2RrRHJhZ1NvcnRFdmVudH0gZnJvbSAnLi4vZHJhZy1ldmVudHMnO1xuaW1wb3J0IHtDZGtEcm9wTGlzdEdyb3VwfSBmcm9tICcuL2Ryb3AtbGlzdC1ncm91cCc7XG5pbXBvcnQge0Ryb3BMaXN0UmVmfSBmcm9tICcuLi9kcm9wLWxpc3QtcmVmJztcbmltcG9ydCB7RHJhZ1JlZn0gZnJvbSAnLi4vZHJhZy1yZWYnO1xuaW1wb3J0IHtEcmFnRHJvcH0gZnJvbSAnLi4vZHJhZy1kcm9wJztcbmltcG9ydCB7U3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3N0YXJ0V2l0aCwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbi8qKiBDb3VudGVyIHVzZWQgdG8gZ2VuZXJhdGUgdW5pcXVlIGlkcyBmb3IgZHJvcCB6b25lcy4gKi9cbmxldCBfdW5pcXVlSWRDb3VudGVyID0gMDtcblxuLyoqXG4gKiBJbnRlcm5hbCBjb21waWxlLXRpbWUtb25seSByZXByZXNlbnRhdGlvbiBvZiBhIGBDZGtEcm9wTGlzdGAuXG4gKiBVc2VkIHRvIGF2b2lkIGNpcmN1bGFyIGltcG9ydCBpc3N1ZXMgYmV0d2VlbiB0aGUgYENka0Ryb3BMaXN0YCBhbmQgdGhlIGBDZGtEcmFnYC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDZGtEcm9wTGlzdEludGVybmFsIGV4dGVuZHMgQ2RrRHJvcExpc3Qge31cblxuLyoqIENvbnRhaW5lciB0aGF0IHdyYXBzIGEgc2V0IG9mIGRyYWdnYWJsZSBpdGVtcy4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtEcm9wTGlzdF0sIGNkay1kcm9wLWxpc3QnLFxuICBleHBvcnRBczogJ2Nka0Ryb3BMaXN0JyxcbiAgcHJvdmlkZXJzOiBbXG4gICAgLy8gUHJldmVudCBjaGlsZCBkcm9wIGxpc3RzIGZyb20gcGlja2luZyB1cCB0aGUgc2FtZSBncm91cCBhcyB0aGVpciBwYXJlbnQuXG4gICAge3Byb3ZpZGU6IENka0Ryb3BMaXN0R3JvdXAsIHVzZVZhbHVlOiB1bmRlZmluZWR9LFxuICAgIHtwcm92aWRlOiBDREtfRFJPUF9MSVNULCB1c2VFeGlzdGluZzogQ2RrRHJvcExpc3R9LFxuICBdLFxuICBob3N0OiB7XG4gICAgJ2NsYXNzJzogJ2Nkay1kcm9wLWxpc3QnLFxuICAgICdbaWRdJzogJ2lkJyxcbiAgICAnW2NsYXNzLmNkay1kcm9wLWxpc3QtZGlzYWJsZWRdJzogJ2Rpc2FibGVkJyxcbiAgICAnW2NsYXNzLmNkay1kcm9wLWxpc3QtZHJhZ2dpbmddJzogJ19kcm9wTGlzdFJlZi5pc0RyYWdnaW5nKCknLFxuICAgICdbY2xhc3MuY2RrLWRyb3AtbGlzdC1yZWNlaXZpbmddJzogJ19kcm9wTGlzdFJlZi5pc1JlY2VpdmluZygpJyxcbiAgfVxufSlcbmV4cG9ydCBjbGFzcyBDZGtEcm9wTGlzdDxUID0gYW55PiBpbXBsZW1lbnRzIEFmdGVyQ29udGVudEluaXQsIE9uRGVzdHJveSB7XG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBsaXN0IGhhcyBiZWVuIGRlc3Ryb3llZC4gKi9cbiAgcHJpdmF0ZSBfZGVzdHJveWVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIGRyb3AgbGlzdHMgdGhhdCBhcmUgY3VycmVudGx5IG9uIHRoZSBwYWdlLiAqL1xuICBwcml2YXRlIHN0YXRpYyBfZHJvcExpc3RzOiBDZGtEcm9wTGlzdFtdID0gW107XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgdW5kZXJseWluZyBkcm9wIGxpc3QgaW5zdGFuY2UuICovXG4gIF9kcm9wTGlzdFJlZjogRHJvcExpc3RSZWY8Q2RrRHJvcExpc3Q8VD4+O1xuXG4gIC8qKiBEcmFnZ2FibGUgaXRlbXMgaW4gdGhlIGNvbnRhaW5lci4gKi9cbiAgQENvbnRlbnRDaGlsZHJlbihDZGtEcmFnLCB7ZGVzY2VuZGFudHM6IHRydWV9KSBfZHJhZ2dhYmxlczogUXVlcnlMaXN0PENka0RyYWc+O1xuXG4gIC8qKlxuICAgKiBPdGhlciBkcmFnZ2FibGUgY29udGFpbmVycyB0aGF0IHRoaXMgY29udGFpbmVyIGlzIGNvbm5lY3RlZCB0byBhbmQgaW50byB3aGljaCB0aGVcbiAgICogY29udGFpbmVyJ3MgaXRlbXMgY2FuIGJlIHRyYW5zZmVycmVkLiBDYW4gZWl0aGVyIGJlIHJlZmVyZW5jZXMgdG8gb3RoZXIgZHJvcCBjb250YWluZXJzLFxuICAgKiBvciB0aGVpciB1bmlxdWUgSURzLlxuICAgKi9cbiAgQElucHV0KCdjZGtEcm9wTGlzdENvbm5lY3RlZFRvJylcbiAgY29ubmVjdGVkVG86IChDZGtEcm9wTGlzdCB8IHN0cmluZylbXSB8IENka0Ryb3BMaXN0IHwgc3RyaW5nID0gW107XG5cbiAgLyoqIEFyYml0cmFyeSBkYXRhIHRvIGF0dGFjaCB0byB0aGlzIGNvbnRhaW5lci4gKi9cbiAgQElucHV0KCdjZGtEcm9wTGlzdERhdGEnKSBkYXRhOiBUO1xuXG4gIC8qKiBEaXJlY3Rpb24gaW4gd2hpY2ggdGhlIGxpc3QgaXMgb3JpZW50ZWQuICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3RPcmllbnRhdGlvbicpIG9yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcgfCAndmVydGljYWwnID0gJ3ZlcnRpY2FsJztcblxuICAvKipcbiAgICogVW5pcXVlIElEIGZvciB0aGUgZHJvcCB6b25lLiBDYW4gYmUgdXNlZCBhcyBhIHJlZmVyZW5jZVxuICAgKiBpbiB0aGUgYGNvbm5lY3RlZFRvYCBvZiBhbm90aGVyIGBDZGtEcm9wTGlzdGAuXG4gICAqL1xuICBASW5wdXQoKSBpZDogc3RyaW5nID0gYGNkay1kcm9wLWxpc3QtJHtfdW5pcXVlSWRDb3VudGVyKyt9YDtcblxuICAvKiogTG9ja3MgdGhlIHBvc2l0aW9uIG9mIHRoZSBkcmFnZ2FibGUgZWxlbWVudHMgaW5zaWRlIHRoZSBjb250YWluZXIgYWxvbmcgdGhlIHNwZWNpZmllZCBheGlzLiAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0TG9ja0F4aXMnKSBsb2NrQXhpczogJ3gnIHwgJ3knO1xuXG4gIC8qKiBXaGV0aGVyIHN0YXJ0aW5nIGEgZHJhZ2dpbmcgc2VxdWVuY2UgZnJvbSB0aGlzIGNvbnRhaW5lciBpcyBkaXNhYmxlZC4gKi9cbiAgQElucHV0KCdjZGtEcm9wTGlzdERpc2FibGVkJylcbiAgZ2V0IGRpc2FibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9kaXNhYmxlZCB8fCAoISF0aGlzLl9ncm91cCAmJiB0aGlzLl9ncm91cC5kaXNhYmxlZCk7XG4gIH1cbiAgc2V0IGRpc2FibGVkKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5fZGlzYWJsZWQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG4gIHByaXZhdGUgX2Rpc2FibGVkID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgc29ydGluZyB3aXRoaW4gdGhpcyBkcm9wIGxpc3QgaXMgZGlzYWJsZWQuICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3RTb3J0aW5nRGlzYWJsZWQnKVxuICBzb3J0aW5nRGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKipcbiAgICogRnVuY3Rpb24gdGhhdCBpcyB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIGFuIGl0ZW1cbiAgICogaXMgYWxsb3dlZCB0byBiZSBtb3ZlZCBpbnRvIGEgZHJvcCBjb250YWluZXIuXG4gICAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0RW50ZXJQcmVkaWNhdGUnKVxuICBlbnRlclByZWRpY2F0ZTogKGRyYWc6IENka0RyYWcsIGRyb3A6IENka0Ryb3BMaXN0KSA9PiBib29sZWFuID0gKCkgPT4gdHJ1ZVxuXG4gIC8qKiBXaGV0aGVyIHRvIGF1dG8tc2Nyb2xsIHRoZSB2aWV3IHdoZW4gdGhlIHVzZXIgbW92ZXMgdGhlaXIgcG9pbnRlciBjbG9zZSB0byB0aGUgZWRnZXMuICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3RBdXRvU2Nyb2xsRGlzYWJsZWQnKVxuICBhdXRvU2Nyb2xsRGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBkcm9wcyBhbiBpdGVtIGluc2lkZSB0aGUgY29udGFpbmVyLiAqL1xuICBAT3V0cHV0KCdjZGtEcm9wTGlzdERyb3BwZWQnKVxuICBkcm9wcGVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0Ryb3A8VCwgYW55Pj4gPSBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdEcm9wPFQsIGFueT4+KCk7XG5cbiAgLyoqXG4gICAqIEVtaXRzIHdoZW4gdGhlIHVzZXIgaGFzIG1vdmVkIGEgbmV3IGRyYWcgaXRlbSBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKi9cbiAgQE91dHB1dCgnY2RrRHJvcExpc3RFbnRlcmVkJylcbiAgZW50ZXJlZDogRXZlbnRFbWl0dGVyPENka0RyYWdFbnRlcjxUPj4gPSBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdFbnRlcjxUPj4oKTtcblxuICAvKipcbiAgICogRW1pdHMgd2hlbiB0aGUgdXNlciByZW1vdmVzIGFuIGl0ZW0gZnJvbSB0aGUgY29udGFpbmVyXG4gICAqIGJ5IGRyYWdnaW5nIGl0IGludG8gYW5vdGhlciBjb250YWluZXIuXG4gICAqL1xuICBAT3V0cHV0KCdjZGtEcm9wTGlzdEV4aXRlZCcpXG4gIGV4aXRlZDogRXZlbnRFbWl0dGVyPENka0RyYWdFeGl0PFQ+PiA9IG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0V4aXQ8VD4+KCk7XG5cbiAgLyoqIEVtaXRzIGFzIHRoZSB1c2VyIGlzIHN3YXBwaW5nIGl0ZW1zIHdoaWxlIGFjdGl2ZWx5IGRyYWdnaW5nLiAqL1xuICBAT3V0cHV0KCdjZGtEcm9wTGlzdFNvcnRlZCcpXG4gIHNvcnRlZDogRXZlbnRFbWl0dGVyPENka0RyYWdTb3J0RXZlbnQ8VD4+ID0gbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnU29ydEV2ZW50PFQ+PigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgLyoqIEVsZW1lbnQgdGhhdCB0aGUgZHJvcCBsaXN0IGlzIGF0dGFjaGVkIHRvLiAqL1xuICAgICAgcHVibGljIGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LCBkcmFnRHJvcDogRHJhZ0Ryb3AsXG4gICAgICBwcml2YXRlIF9jaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsIEBPcHRpb25hbCgpIHByaXZhdGUgX2Rpcj86IERpcmVjdGlvbmFsaXR5LFxuICAgICAgQE9wdGlvbmFsKCkgQFNraXBTZWxmKCkgcHJpdmF0ZSBfZ3JvdXA/OiBDZGtEcm9wTGlzdEdyb3VwPENka0Ryb3BMaXN0Pikge1xuICAgIHRoaXMuX2Ryb3BMaXN0UmVmID0gZHJhZ0Ryb3AuY3JlYXRlRHJvcExpc3QoZWxlbWVudCk7XG4gICAgdGhpcy5fZHJvcExpc3RSZWYuZGF0YSA9IHRoaXM7XG4gICAgdGhpcy5fZHJvcExpc3RSZWYuZW50ZXJQcmVkaWNhdGUgPSAoZHJhZzogRHJhZ1JlZjxDZGtEcmFnPiwgZHJvcDogRHJvcExpc3RSZWY8Q2RrRHJvcExpc3Q+KSA9PiB7XG4gICAgICByZXR1cm4gdGhpcy5lbnRlclByZWRpY2F0ZShkcmFnLmRhdGEsIGRyb3AuZGF0YSk7XG4gICAgfTtcblxuICAgIHRoaXMuX3N5bmNJbnB1dHModGhpcy5fZHJvcExpc3RSZWYpO1xuICAgIHRoaXMuX2hhbmRsZUV2ZW50cyh0aGlzLl9kcm9wTGlzdFJlZik7XG4gICAgQ2RrRHJvcExpc3QuX2Ryb3BMaXN0cy5wdXNoKHRoaXMpO1xuXG4gICAgaWYgKF9ncm91cCkge1xuICAgICAgX2dyb3VwLl9pdGVtcy5hZGQodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgbmdBZnRlckNvbnRlbnRJbml0KCkge1xuICAgIHRoaXMuX2RyYWdnYWJsZXMuY2hhbmdlc1xuICAgICAgLnBpcGUoc3RhcnRXaXRoKHRoaXMuX2RyYWdnYWJsZXMpLCB0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSlcbiAgICAgIC5zdWJzY3JpYmUoKGl0ZW1zOiBRdWVyeUxpc3Q8Q2RrRHJhZz4pID0+IHtcbiAgICAgICAgdGhpcy5fZHJvcExpc3RSZWYud2l0aEl0ZW1zKGl0ZW1zLnJlZHVjZSgoZmlsdGVyZWRJdGVtcywgZHJhZykgPT4ge1xuICAgICAgICAgIGlmIChkcmFnLmRyb3BDb250YWluZXIgPT09IHRoaXMpIHtcbiAgICAgICAgICAgIGZpbHRlcmVkSXRlbXMucHVzaChkcmFnLl9kcmFnUmVmKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gZmlsdGVyZWRJdGVtcztcbiAgICAgICAgfSwgW10gYXMgRHJhZ1JlZltdKSk7XG4gICAgICB9KTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIGNvbnN0IGluZGV4ID0gQ2RrRHJvcExpc3QuX2Ryb3BMaXN0cy5pbmRleE9mKHRoaXMpO1xuXG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIENka0Ryb3BMaXN0Ll9kcm9wTGlzdHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZ3JvdXApIHtcbiAgICAgIHRoaXMuX2dyb3VwLl9pdGVtcy5kZWxldGUodGhpcyk7XG4gICAgfVxuXG4gICAgdGhpcy5fZHJvcExpc3RSZWYuZGlzcG9zZSgpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5uZXh0KCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gIH1cblxuICAvKipcbiAgICogU3RhcnRzIGRyYWdnaW5nIGFuIGl0ZW0uXG4gICAqIEBkZXByZWNhdGVkIE5vIGxvbmdlciBiZWluZyB1c2VkLiBUbyBiZSByZW1vdmVkLlxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDEwLjAuMFxuICAgKi9cbiAgc3RhcnQoKTogdm9pZCB7XG4gICAgdGhpcy5fZHJvcExpc3RSZWYuc3RhcnQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEcm9wcyBhbiBpdGVtIGludG8gdGhpcyBjb250YWluZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gYmVpbmcgZHJvcHBlZCBpbnRvIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSBjdXJyZW50SW5kZXggSW5kZXggYXQgd2hpY2ggdGhlIGl0ZW0gc2hvdWxkIGJlIGluc2VydGVkLlxuICAgKiBAcGFyYW0gcHJldmlvdXNDb250YWluZXIgQ29udGFpbmVyIGZyb20gd2hpY2ggdGhlIGl0ZW0gZ290IGRyYWdnZWQgaW4uXG4gICAqIEBwYXJhbSBpc1BvaW50ZXJPdmVyQ29udGFpbmVyIFdoZXRoZXIgdGhlIHVzZXIncyBwb2ludGVyIHdhcyBvdmVyIHRoZVxuICAgKiAgICBjb250YWluZXIgd2hlbiB0aGUgaXRlbSB3YXMgZHJvcHBlZC5cbiAgICpcbiAgICogQGRlcHJlY2F0ZWQgTm8gbG9uZ2VyIGJlaW5nIHVzZWQuIFRvIGJlIHJlbW92ZWQuXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMTAuMC4wXG4gICAqL1xuICBkcm9wKGl0ZW06IENka0RyYWcsIGN1cnJlbnRJbmRleDogbnVtYmVyLCBwcmV2aW91c0NvbnRhaW5lcjogQ2RrRHJvcExpc3QsXG4gICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcjogYm9vbGVhbik6IHZvaWQge1xuICAgIHRoaXMuX2Ryb3BMaXN0UmVmLmRyb3AoaXRlbS5fZHJhZ1JlZiwgY3VycmVudEluZGV4LCBwcmV2aW91c0NvbnRhaW5lci5fZHJvcExpc3RSZWYsXG4gICAgICAgIGlzUG9pbnRlck92ZXJDb250YWluZXIsIHt4OiAwLCB5OiAwfSk7XG4gIH1cblxuICAvKipcbiAgICogRW1pdHMgYW4gZXZlbnQgdG8gaW5kaWNhdGUgdGhhdCB0aGUgdXNlciBtb3ZlZCBhbiBpdGVtIGludG8gdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB0aGF0IHdhcyBtb3ZlZCBpbnRvIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSBwb2ludGVyWCBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWCBheGlzLlxuICAgKiBAcGFyYW0gcG9pbnRlclkgUG9zaXRpb24gb2YgdGhlIGl0ZW0gYWxvbmcgdGhlIFkgYXhpcy5cbiAgICogQGRlcHJlY2F0ZWQgTm8gbG9uZ2VyIGJlaW5nIHVzZWQuIFRvIGJlIHJlbW92ZWQuXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMTAuMC4wXG4gICAqL1xuICBlbnRlcihpdGVtOiBDZGtEcmFnLCBwb2ludGVyWDogbnVtYmVyLCBwb2ludGVyWTogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy5fZHJvcExpc3RSZWYuZW50ZXIoaXRlbS5fZHJhZ1JlZiwgcG9pbnRlclgsIHBvaW50ZXJZKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGFuIGl0ZW0gZnJvbSB0aGUgY29udGFpbmVyIGFmdGVyIGl0IHdhcyBkcmFnZ2VkIGludG8gYW5vdGhlciBjb250YWluZXIgYnkgdGhlIHVzZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdGhhdCB3YXMgZHJhZ2dlZCBvdXQuXG4gICAqIEBkZXByZWNhdGVkIE5vIGxvbmdlciBiZWluZyB1c2VkLiBUbyBiZSByZW1vdmVkLlxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDEwLjAuMFxuICAgKi9cbiAgZXhpdChpdGVtOiBDZGtEcmFnKTogdm9pZCB7XG4gICAgdGhpcy5fZHJvcExpc3RSZWYuZXhpdChpdGVtLl9kcmFnUmVmKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaWd1cmVzIG91dCB0aGUgaW5kZXggb2YgYW4gaXRlbSBpbiB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHdob3NlIGluZGV4IHNob3VsZCBiZSBkZXRlcm1pbmVkLlxuICAgKiBAZGVwcmVjYXRlZCBObyBsb25nZXIgYmVpbmcgdXNlZC4gVG8gYmUgcmVtb3ZlZC5cbiAgICogQGJyZWFraW5nLWNoYW5nZSAxMC4wLjBcbiAgICovXG4gIGdldEl0ZW1JbmRleChpdGVtOiBDZGtEcmFnKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fZHJvcExpc3RSZWYuZ2V0SXRlbUluZGV4KGl0ZW0uX2RyYWdSZWYpO1xuICB9XG5cbiAgLyoqIFN5bmNzIHRoZSBpbnB1dHMgb2YgdGhlIENka0Ryb3BMaXN0IHdpdGggdGhlIG9wdGlvbnMgb2YgdGhlIHVuZGVybHlpbmcgRHJvcExpc3RSZWYuICovXG4gIHByaXZhdGUgX3N5bmNJbnB1dHMocmVmOiBEcm9wTGlzdFJlZjxDZGtEcm9wTGlzdD4pIHtcbiAgICBpZiAodGhpcy5fZGlyKSB7XG4gICAgICB0aGlzLl9kaXIuY2hhbmdlXG4gICAgICAgIC5waXBlKHN0YXJ0V2l0aCh0aGlzLl9kaXIudmFsdWUpLCB0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSlcbiAgICAgICAgLnN1YnNjcmliZSh2YWx1ZSA9PiByZWYud2l0aERpcmVjdGlvbih2YWx1ZSkpO1xuICAgIH1cblxuICAgIHJlZi5iZWZvcmVTdGFydGVkLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICBjb25zdCBzaWJsaW5ncyA9IGNvZXJjZUFycmF5KHRoaXMuY29ubmVjdGVkVG8pLm1hcChkcm9wID0+IHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBkcm9wID09PSAnc3RyaW5nJyA/XG4gICAgICAgICAgICBDZGtEcm9wTGlzdC5fZHJvcExpc3RzLmZpbmQobGlzdCA9PiBsaXN0LmlkID09PSBkcm9wKSEgOiBkcm9wO1xuICAgICAgfSk7XG5cbiAgICAgIGlmICh0aGlzLl9ncm91cCkge1xuICAgICAgICB0aGlzLl9ncm91cC5faXRlbXMuZm9yRWFjaChkcm9wID0+IHtcbiAgICAgICAgICBpZiAoc2libGluZ3MuaW5kZXhPZihkcm9wKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHNpYmxpbmdzLnB1c2goZHJvcCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmVmLmRpc2FibGVkID0gdGhpcy5kaXNhYmxlZDtcbiAgICAgIHJlZi5sb2NrQXhpcyA9IHRoaXMubG9ja0F4aXM7XG4gICAgICByZWYuc29ydGluZ0Rpc2FibGVkID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHRoaXMuc29ydGluZ0Rpc2FibGVkKTtcbiAgICAgIHJlZi5hdXRvU2Nyb2xsRGlzYWJsZWQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodGhpcy5hdXRvU2Nyb2xsRGlzYWJsZWQpO1xuICAgICAgcmVmXG4gICAgICAgIC5jb25uZWN0ZWRUbyhzaWJsaW5ncy5maWx0ZXIoZHJvcCA9PiBkcm9wICYmIGRyb3AgIT09IHRoaXMpLm1hcChsaXN0ID0+IGxpc3QuX2Ryb3BMaXN0UmVmKSlcbiAgICAgICAgLndpdGhPcmllbnRhdGlvbih0aGlzLm9yaWVudGF0aW9uKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBIYW5kbGVzIGV2ZW50cyBmcm9tIHRoZSB1bmRlcmx5aW5nIERyb3BMaXN0UmVmLiAqL1xuICBwcml2YXRlIF9oYW5kbGVFdmVudHMocmVmOiBEcm9wTGlzdFJlZjxDZGtEcm9wTGlzdD4pIHtcbiAgICByZWYuYmVmb3JlU3RhcnRlZC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgfSk7XG5cbiAgICByZWYuZW50ZXJlZC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgdGhpcy5lbnRlcmVkLmVtaXQoe1xuICAgICAgICBjb250YWluZXI6IHRoaXMsXG4gICAgICAgIGl0ZW06IGV2ZW50Lml0ZW0uZGF0YSxcbiAgICAgICAgY3VycmVudEluZGV4OiBldmVudC5jdXJyZW50SW5kZXhcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmVmLmV4aXRlZC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgdGhpcy5leGl0ZWQuZW1pdCh7XG4gICAgICAgIGNvbnRhaW5lcjogdGhpcyxcbiAgICAgICAgaXRlbTogZXZlbnQuaXRlbS5kYXRhXG4gICAgICB9KTtcbiAgICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICAgIH0pO1xuXG4gICAgcmVmLnNvcnRlZC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgdGhpcy5zb3J0ZWQuZW1pdCh7XG4gICAgICAgIHByZXZpb3VzSW5kZXg6IGV2ZW50LnByZXZpb3VzSW5kZXgsXG4gICAgICAgIGN1cnJlbnRJbmRleDogZXZlbnQuY3VycmVudEluZGV4LFxuICAgICAgICBjb250YWluZXI6IHRoaXMsXG4gICAgICAgIGl0ZW06IGV2ZW50Lml0ZW0uZGF0YVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZWYuZHJvcHBlZC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgdGhpcy5kcm9wcGVkLmVtaXQoe1xuICAgICAgICBwcmV2aW91c0luZGV4OiBldmVudC5wcmV2aW91c0luZGV4LFxuICAgICAgICBjdXJyZW50SW5kZXg6IGV2ZW50LmN1cnJlbnRJbmRleCxcbiAgICAgICAgcHJldmlvdXNDb250YWluZXI6IGV2ZW50LnByZXZpb3VzQ29udGFpbmVyLmRhdGEsXG4gICAgICAgIGNvbnRhaW5lcjogZXZlbnQuY29udGFpbmVyLmRhdGEsXG4gICAgICAgIGl0ZW06IGV2ZW50Lml0ZW0uZGF0YSxcbiAgICAgICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcjogZXZlbnQuaXNQb2ludGVyT3ZlckNvbnRhaW5lcixcbiAgICAgICAgZGlzdGFuY2U6IGV2ZW50LmRpc3RhbmNlXG4gICAgICB9KTtcblxuICAgICAgLy8gTWFyayBmb3IgY2hlY2sgc2luY2UgYWxsIG9mIHRoZXNlIGV2ZW50cyBydW4gb3V0c2lkZSBvZiBjaGFuZ2VcbiAgICAgIC8vIGRldGVjdGlvbiBhbmQgd2UncmUgbm90IGd1YXJhbnRlZWQgZm9yIHNvbWV0aGluZyBlbHNlIHRvIGhhdmUgdHJpZ2dlcmVkIGl0LlxuICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgfSk7XG4gIH1cblxufVxuIl19