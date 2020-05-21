/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __decorate, __metadata, __param } from "tslib";
import { coerceArray, coerceBooleanProperty } from '@angular/cdk/coercion';
import { ElementRef, EventEmitter, Input, Output, Optional, Directive, ChangeDetectorRef, SkipSelf, Inject, } from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { ScrollDispatcher } from '@angular/cdk/scrolling';
import { CDK_DROP_LIST } from './drag';
import { CdkDropListGroup } from './drop-list-group';
import { DragDrop } from '../drag-drop';
import { CDK_DRAG_CONFIG } from './config';
import { Subject } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';
/** Counter used to generate unique ids for drop zones. */
let _uniqueIdCounter = 0;
const ɵ0 = undefined;
/** Container that wraps a set of draggable items. */
let CdkDropList = /** @class */ (() => {
    var CdkDropList_1;
    let CdkDropList = CdkDropList_1 = class CdkDropList {
        constructor(
        /** Element that the drop list is attached to. */
        element, dragDrop, _changeDetectorRef, _dir, _group, 
        /**
         * @deprecated _scrollDispatcher parameter to become required.
         * @breaking-change 11.0.0
         */
        _scrollDispatcher, config) {
            this.element = element;
            this._changeDetectorRef = _changeDetectorRef;
            this._dir = _dir;
            this._group = _group;
            this._scrollDispatcher = _scrollDispatcher;
            /** Emits when the list has been destroyed. */
            this._destroyed = new Subject();
            /**
             * Other draggable containers that this container is connected to and into which the
             * container's items can be transferred. Can either be references to other drop containers,
             * or their unique IDs.
             */
            this.connectedTo = [];
            /**
             * Unique ID for the drop zone. Can be used as a reference
             * in the `connectedTo` of another `CdkDropList`.
             */
            this.id = `cdk-drop-list-${_uniqueIdCounter++}`;
            /**
             * Function that is used to determine whether an item
             * is allowed to be moved into a drop container.
             */
            this.enterPredicate = () => true;
            /** Emits when the user drops an item inside the container. */
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
            /** Emits as the user is swapping items while actively dragging. */
            this.sorted = new EventEmitter();
            /**
             * Keeps track of the items that are registered with this container. Historically we used to
             * do this with a `ContentChildren` query, however queries don't handle transplanted views very
             * well which means that we can't handle cases like dragging the headers of a `mat-table`
             * correctly. What we do instead is to have the items register themselves with the container
             * and then we sort them based on their position in the DOM.
             */
            this._unsortedItems = new Set();
            this._dropListRef = dragDrop.createDropList(element);
            this._dropListRef.data = this;
            if (config) {
                this._assignDefaults(config);
            }
            this._dropListRef.enterPredicate = (drag, drop) => {
                return this.enterPredicate(drag.data, drop.data);
            };
            this._setupInputSyncSubscription(this._dropListRef);
            this._handleEvents(this._dropListRef);
            CdkDropList_1._dropLists.push(this);
            if (_group) {
                _group._items.add(this);
            }
        }
        /** Whether starting a dragging sequence from this container is disabled. */
        get disabled() {
            return this._disabled || (!!this._group && this._group.disabled);
        }
        set disabled(value) {
            // Usually we sync the directive and ref state right before dragging starts, in order to have
            // a single point of failure and to avoid having to use setters for everything. `disabled` is
            // a special case, because it can prevent the `beforeStarted` event from firing, which can lock
            // the user in a disabled state, so we also need to sync it as it's being set.
            this._dropListRef.disabled = this._disabled = coerceBooleanProperty(value);
        }
        /** Registers an items with the drop list. */
        addItem(item) {
            this._unsortedItems.add(item);
            if (this._dropListRef.isDragging()) {
                this._syncItemsWithRef();
            }
        }
        /** Removes an item from the drop list. */
        removeItem(item) {
            this._unsortedItems.delete(item);
            if (this._dropListRef.isDragging()) {
                this._syncItemsWithRef();
            }
        }
        /** Gets the registered items in the list, sorted by their position in the DOM. */
        getSortedItems() {
            return Array.from(this._unsortedItems).sort((a, b) => {
                const documentPosition = a._dragRef.getVisibleElement().compareDocumentPosition(b._dragRef.getVisibleElement());
                // `compareDocumentPosition` returns a bitmask so we have to use a bitwise operator.
                // https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition
                // tslint:disable-next-line:no-bitwise
                return documentPosition & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
            });
        }
        ngOnDestroy() {
            const index = CdkDropList_1._dropLists.indexOf(this);
            if (index > -1) {
                CdkDropList_1._dropLists.splice(index, 1);
            }
            if (this._group) {
                this._group._items.delete(this);
            }
            this._unsortedItems.clear();
            this._dropListRef.dispose();
            this._destroyed.next();
            this._destroyed.complete();
        }
        /** Syncs the inputs of the CdkDropList with the options of the underlying DropListRef. */
        _setupInputSyncSubscription(ref) {
            if (this._dir) {
                this._dir.change
                    .pipe(startWith(this._dir.value), takeUntil(this._destroyed))
                    .subscribe(value => ref.withDirection(value));
            }
            ref.beforeStarted.subscribe(() => {
                const siblings = coerceArray(this.connectedTo).map(drop => {
                    return typeof drop === 'string' ?
                        CdkDropList_1._dropLists.find(list => list.id === drop) : drop;
                });
                if (this._group) {
                    this._group._items.forEach(drop => {
                        if (siblings.indexOf(drop) === -1) {
                            siblings.push(drop);
                        }
                    });
                }
                // Note that we resolve the scrollable parents here so that we delay the resolution
                // as long as possible, ensuring that the element is in its final place in the DOM.
                // @breaking-change 11.0.0 Remove null check for _scrollDispatcher once it's required.
                if (!this._scrollableParentsResolved && this._scrollDispatcher) {
                    const scrollableParents = this._scrollDispatcher
                        .getAncestorScrollContainers(this.element)
                        .map(scrollable => scrollable.getElementRef().nativeElement);
                    this._dropListRef.withScrollableParents(scrollableParents);
                    // Only do this once since it involves traversing the DOM and the parents
                    // shouldn't be able to change without the drop list being destroyed.
                    this._scrollableParentsResolved = true;
                }
                ref.disabled = this.disabled;
                ref.lockAxis = this.lockAxis;
                ref.sortingDisabled = coerceBooleanProperty(this.sortingDisabled);
                ref.autoScrollDisabled = coerceBooleanProperty(this.autoScrollDisabled);
                ref
                    .connectedTo(siblings.filter(drop => drop && drop !== this).map(list => list._dropListRef))
                    .withOrientation(this.orientation);
            });
        }
        /** Handles events from the underlying DropListRef. */
        _handleEvents(ref) {
            ref.beforeStarted.subscribe(() => {
                this._syncItemsWithRef();
                this._changeDetectorRef.markForCheck();
            });
            ref.entered.subscribe(event => {
                this.entered.emit({
                    container: this,
                    item: event.item.data,
                    currentIndex: event.currentIndex
                });
            });
            ref.exited.subscribe(event => {
                this.exited.emit({
                    container: this,
                    item: event.item.data
                });
                this._changeDetectorRef.markForCheck();
            });
            ref.sorted.subscribe(event => {
                this.sorted.emit({
                    previousIndex: event.previousIndex,
                    currentIndex: event.currentIndex,
                    container: this,
                    item: event.item.data
                });
            });
            ref.dropped.subscribe(event => {
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
            });
        }
        /** Assigns the default input values based on a provided config object. */
        _assignDefaults(config) {
            const { lockAxis, draggingDisabled, sortingDisabled, listAutoScrollDisabled, listOrientation } = config;
            this.disabled = draggingDisabled == null ? false : draggingDisabled;
            this.sortingDisabled = sortingDisabled == null ? false : sortingDisabled;
            this.autoScrollDisabled = listAutoScrollDisabled == null ? false : listAutoScrollDisabled;
            this.orientation = listOrientation || 'vertical';
            if (lockAxis) {
                this.lockAxis = lockAxis;
            }
        }
        /** Syncs up the registered drag items with underlying drop list ref. */
        _syncItemsWithRef() {
            this._dropListRef.withItems(this.getSortedItems().map(item => item._dragRef));
        }
    };
    /** Keeps track of the drop lists that are currently on the page. */
    CdkDropList._dropLists = [];
    __decorate([
        Input('cdkDropListConnectedTo'),
        __metadata("design:type", Object)
    ], CdkDropList.prototype, "connectedTo", void 0);
    __decorate([
        Input('cdkDropListData'),
        __metadata("design:type", Object)
    ], CdkDropList.prototype, "data", void 0);
    __decorate([
        Input('cdkDropListOrientation'),
        __metadata("design:type", String)
    ], CdkDropList.prototype, "orientation", void 0);
    __decorate([
        Input(),
        __metadata("design:type", String)
    ], CdkDropList.prototype, "id", void 0);
    __decorate([
        Input('cdkDropListLockAxis'),
        __metadata("design:type", String)
    ], CdkDropList.prototype, "lockAxis", void 0);
    __decorate([
        Input('cdkDropListDisabled'),
        __metadata("design:type", Boolean),
        __metadata("design:paramtypes", [Boolean])
    ], CdkDropList.prototype, "disabled", null);
    __decorate([
        Input('cdkDropListSortingDisabled'),
        __metadata("design:type", Boolean)
    ], CdkDropList.prototype, "sortingDisabled", void 0);
    __decorate([
        Input('cdkDropListEnterPredicate'),
        __metadata("design:type", Function)
    ], CdkDropList.prototype, "enterPredicate", void 0);
    __decorate([
        Input('cdkDropListAutoScrollDisabled'),
        __metadata("design:type", Boolean)
    ], CdkDropList.prototype, "autoScrollDisabled", void 0);
    __decorate([
        Output('cdkDropListDropped'),
        __metadata("design:type", EventEmitter)
    ], CdkDropList.prototype, "dropped", void 0);
    __decorate([
        Output('cdkDropListEntered'),
        __metadata("design:type", EventEmitter)
    ], CdkDropList.prototype, "entered", void 0);
    __decorate([
        Output('cdkDropListExited'),
        __metadata("design:type", EventEmitter)
    ], CdkDropList.prototype, "exited", void 0);
    __decorate([
        Output('cdkDropListSorted'),
        __metadata("design:type", EventEmitter)
    ], CdkDropList.prototype, "sorted", void 0);
    CdkDropList = CdkDropList_1 = __decorate([
        Directive({
            selector: '[cdkDropList], cdk-drop-list',
            exportAs: 'cdkDropList',
            providers: [
                // Prevent child drop lists from picking up the same group as their parent.
                { provide: CdkDropListGroup, useValue: ɵ0 },
                { provide: CDK_DROP_LIST, useExisting: CdkDropList_1 },
            ],
            host: {
                'class': 'cdk-drop-list',
                '[id]': 'id',
                '[class.cdk-drop-list-disabled]': 'disabled',
                '[class.cdk-drop-list-dragging]': '_dropListRef.isDragging()',
                '[class.cdk-drop-list-receiving]': '_dropListRef.isReceiving()',
            }
        }),
        __param(3, Optional()),
        __param(4, Optional()), __param(4, SkipSelf()),
        __param(6, Optional()), __param(6, Inject(CDK_DRAG_CONFIG)),
        __metadata("design:paramtypes", [ElementRef, DragDrop,
            ChangeDetectorRef, Directionality,
            CdkDropListGroup,
            ScrollDispatcher, Object])
    ], CdkDropList);
    return CdkDropList;
})();
export { CdkDropList };
export { ɵ0 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZGlyZWN0aXZlcy9kcm9wLWxpc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBZSxXQUFXLEVBQUUscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN2RixPQUFPLEVBQ0wsVUFBVSxFQUNWLFlBQVksRUFDWixLQUFLLEVBRUwsTUFBTSxFQUNOLFFBQVEsRUFDUixTQUFTLEVBQ1QsaUJBQWlCLEVBQ2pCLFFBQVEsRUFDUixNQUFNLEdBQ1AsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3hELE9BQU8sRUFBVSxhQUFhLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFOUMsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFHbkQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUN0QyxPQUFPLEVBQWdELGVBQWUsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN4RixPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQzdCLE9BQU8sRUFBQyxTQUFTLEVBQUUsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFcEQsMERBQTBEO0FBQzFELElBQUksZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDO1dBZWlCLFNBQVM7QUFObkQscURBQXFEO0FBaUJyRDs7SUFBQSxJQUFhLFdBQVcsbUJBQXhCLE1BQWEsV0FBVztRQStGdEI7UUFDSSxpREFBaUQ7UUFDMUMsT0FBZ0MsRUFBRSxRQUFrQixFQUNuRCxrQkFBcUMsRUFBc0IsSUFBcUIsRUFDeEQsTUFBc0M7UUFFdEU7OztXQUdHO1FB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YUFDbkQ7WUFDRCxJQUFJLEVBQUU7Z0JBQ0osT0FBTyxFQUFFLGVBQWU7Z0JBQ3hCLE1BQU0sRUFBRSxJQUFJO2dCQUNaLGdDQUFnQyxFQUFFLFVBQVU7Z0JBQzVDLGdDQUFnQyxFQUFFLDJCQUEyQjtnQkFDN0QsaUNBQWlDLEVBQUUsNEJBQTRCO2FBQ2hFO1NBQ0YsQ0FBQztRQW1Hb0QsV0FBQSxRQUFRLEVBQUUsQ0FBQTtRQUN6RCxXQUFBLFFBQVEsRUFBRSxDQUFBLEVBQUUsV0FBQSxRQUFRLEVBQUUsQ0FBQTtRQU90QixXQUFBLFFBQVEsRUFBRSxDQUFBLEVBQUUsV0FBQSxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUE7eUNBVHBCLFVBQVUsRUFBeUIsUUFBUTtZQUMvQixpQkFBaUIsRUFBNkIsY0FBYztZQUMvQyxnQkFBZ0I7WUFNN0IsZ0JBQWdCO09BekdyQyxXQUFXLENBc1N2QjtJQUFELGtCQUFDO0tBQUE7U0F0U1ksV0FBVyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0Jvb2xlYW5JbnB1dCwgY29lcmNlQXJyYXksIGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7XG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5wdXQsXG4gIE9uRGVzdHJveSxcbiAgT3V0cHV0LFxuICBPcHRpb25hbCxcbiAgRGlyZWN0aXZlLFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgU2tpcFNlbGYsXG4gIEluamVjdCxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0RpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge1Njcm9sbERpc3BhdGNoZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9zY3JvbGxpbmcnO1xuaW1wb3J0IHtDZGtEcmFnLCBDREtfRFJPUF9MSVNUfSBmcm9tICcuL2RyYWcnO1xuaW1wb3J0IHtDZGtEcmFnRHJvcCwgQ2RrRHJhZ0VudGVyLCBDZGtEcmFnRXhpdCwgQ2RrRHJhZ1NvcnRFdmVudH0gZnJvbSAnLi4vZHJhZy1ldmVudHMnO1xuaW1wb3J0IHtDZGtEcm9wTGlzdEdyb3VwfSBmcm9tICcuL2Ryb3AtbGlzdC1ncm91cCc7XG5pbXBvcnQge0Ryb3BMaXN0UmVmfSBmcm9tICcuLi9kcm9wLWxpc3QtcmVmJztcbmltcG9ydCB7RHJhZ1JlZn0gZnJvbSAnLi4vZHJhZy1yZWYnO1xuaW1wb3J0IHtEcmFnRHJvcH0gZnJvbSAnLi4vZHJhZy1kcm9wJztcbmltcG9ydCB7RHJvcExpc3RPcmllbnRhdGlvbiwgRHJhZ0F4aXMsIERyYWdEcm9wQ29uZmlnLCBDREtfRFJBR19DT05GSUd9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCB7U3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3N0YXJ0V2l0aCwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbi8qKiBDb3VudGVyIHVzZWQgdG8gZ2VuZXJhdGUgdW5pcXVlIGlkcyBmb3IgZHJvcCB6b25lcy4gKi9cbmxldCBfdW5pcXVlSWRDb3VudGVyID0gMDtcblxuLyoqXG4gKiBJbnRlcm5hbCBjb21waWxlLXRpbWUtb25seSByZXByZXNlbnRhdGlvbiBvZiBhIGBDZGtEcm9wTGlzdGAuXG4gKiBVc2VkIHRvIGF2b2lkIGNpcmN1bGFyIGltcG9ydCBpc3N1ZXMgYmV0d2VlbiB0aGUgYENka0Ryb3BMaXN0YCBhbmQgdGhlIGBDZGtEcmFnYC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDZGtEcm9wTGlzdEludGVybmFsIGV4dGVuZHMgQ2RrRHJvcExpc3Qge31cblxuLyoqIENvbnRhaW5lciB0aGF0IHdyYXBzIGEgc2V0IG9mIGRyYWdnYWJsZSBpdGVtcy4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtEcm9wTGlzdF0sIGNkay1kcm9wLWxpc3QnLFxuICBleHBvcnRBczogJ2Nka0Ryb3BMaXN0JyxcbiAgcHJvdmlkZXJzOiBbXG4gICAgLy8gUHJldmVudCBjaGlsZCBkcm9wIGxpc3RzIGZyb20gcGlja2luZyB1cCB0aGUgc2FtZSBncm91cCBhcyB0aGVpciBwYXJlbnQuXG4gICAge3Byb3ZpZGU6IENka0Ryb3BMaXN0R3JvdXAsIHVzZVZhbHVlOiB1bmRlZmluZWR9LFxuICAgIHtwcm92aWRlOiBDREtfRFJPUF9MSVNULCB1c2VFeGlzdGluZzogQ2RrRHJvcExpc3R9LFxuICBdLFxuICBob3N0OiB7XG4gICAgJ2NsYXNzJzogJ2Nkay1kcm9wLWxpc3QnLFxuICAgICdbaWRdJzogJ2lkJyxcbiAgICAnW2NsYXNzLmNkay1kcm9wLWxpc3QtZGlzYWJsZWRdJzogJ2Rpc2FibGVkJyxcbiAgICAnW2NsYXNzLmNkay1kcm9wLWxpc3QtZHJhZ2dpbmddJzogJ19kcm9wTGlzdFJlZi5pc0RyYWdnaW5nKCknLFxuICAgICdbY2xhc3MuY2RrLWRyb3AtbGlzdC1yZWNlaXZpbmddJzogJ19kcm9wTGlzdFJlZi5pc1JlY2VpdmluZygpJyxcbiAgfVxufSlcbmV4cG9ydCBjbGFzcyBDZGtEcm9wTGlzdDxUID0gYW55PiBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBsaXN0IGhhcyBiZWVuIGRlc3Ryb3llZC4gKi9cbiAgcHJpdmF0ZSBfZGVzdHJveWVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogV2hldGhlciB0aGUgZWxlbWVudCdzIHNjcm9sbGFibGUgcGFyZW50cyBoYXZlIGJlZW4gcmVzb2x2ZWQuICovXG4gIHByaXZhdGUgX3Njcm9sbGFibGVQYXJlbnRzUmVzb2x2ZWQ6IGJvb2xlYW47XG5cbiAgLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBkcm9wIGxpc3RzIHRoYXQgYXJlIGN1cnJlbnRseSBvbiB0aGUgcGFnZS4gKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX2Ryb3BMaXN0czogQ2RrRHJvcExpc3RbXSA9IFtdO1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIHVuZGVybHlpbmcgZHJvcCBsaXN0IGluc3RhbmNlLiAqL1xuICBfZHJvcExpc3RSZWY6IERyb3BMaXN0UmVmPENka0Ryb3BMaXN0PFQ+PjtcblxuICAvKipcbiAgICogT3RoZXIgZHJhZ2dhYmxlIGNvbnRhaW5lcnMgdGhhdCB0aGlzIGNvbnRhaW5lciBpcyBjb25uZWN0ZWQgdG8gYW5kIGludG8gd2hpY2ggdGhlXG4gICAqIGNvbnRhaW5lcidzIGl0ZW1zIGNhbiBiZSB0cmFuc2ZlcnJlZC4gQ2FuIGVpdGhlciBiZSByZWZlcmVuY2VzIHRvIG90aGVyIGRyb3AgY29udGFpbmVycyxcbiAgICogb3IgdGhlaXIgdW5pcXVlIElEcy5cbiAgICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3RDb25uZWN0ZWRUbycpXG4gIGNvbm5lY3RlZFRvOiAoQ2RrRHJvcExpc3QgfCBzdHJpbmcpW10gfCBDZGtEcm9wTGlzdCB8IHN0cmluZyA9IFtdO1xuXG4gIC8qKiBBcmJpdHJhcnkgZGF0YSB0byBhdHRhY2ggdG8gdGhpcyBjb250YWluZXIuICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3REYXRhJykgZGF0YTogVDtcblxuICAvKiogRGlyZWN0aW9uIGluIHdoaWNoIHRoZSBsaXN0IGlzIG9yaWVudGVkLiAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0T3JpZW50YXRpb24nKSBvcmllbnRhdGlvbjogRHJvcExpc3RPcmllbnRhdGlvbjtcblxuICAvKipcbiAgICogVW5pcXVlIElEIGZvciB0aGUgZHJvcCB6b25lLiBDYW4gYmUgdXNlZCBhcyBhIHJlZmVyZW5jZVxuICAgKiBpbiB0aGUgYGNvbm5lY3RlZFRvYCBvZiBhbm90aGVyIGBDZGtEcm9wTGlzdGAuXG4gICAqL1xuICBASW5wdXQoKSBpZDogc3RyaW5nID0gYGNkay1kcm9wLWxpc3QtJHtfdW5pcXVlSWRDb3VudGVyKyt9YDtcblxuICAvKiogTG9ja3MgdGhlIHBvc2l0aW9uIG9mIHRoZSBkcmFnZ2FibGUgZWxlbWVudHMgaW5zaWRlIHRoZSBjb250YWluZXIgYWxvbmcgdGhlIHNwZWNpZmllZCBheGlzLiAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0TG9ja0F4aXMnKSBsb2NrQXhpczogRHJhZ0F4aXM7XG5cbiAgLyoqIFdoZXRoZXIgc3RhcnRpbmcgYSBkcmFnZ2luZyBzZXF1ZW5jZSBmcm9tIHRoaXMgY29udGFpbmVyIGlzIGRpc2FibGVkLiAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0RGlzYWJsZWQnKVxuICBnZXQgZGlzYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2Rpc2FibGVkIHx8ICghIXRoaXMuX2dyb3VwICYmIHRoaXMuX2dyb3VwLmRpc2FibGVkKTtcbiAgfVxuICBzZXQgZGlzYWJsZWQodmFsdWU6IGJvb2xlYW4pIHtcbiAgICAvLyBVc3VhbGx5IHdlIHN5bmMgdGhlIGRpcmVjdGl2ZSBhbmQgcmVmIHN0YXRlIHJpZ2h0IGJlZm9yZSBkcmFnZ2luZyBzdGFydHMsIGluIG9yZGVyIHRvIGhhdmVcbiAgICAvLyBhIHNpbmdsZSBwb2ludCBvZiBmYWlsdXJlIGFuZCB0byBhdm9pZCBoYXZpbmcgdG8gdXNlIHNldHRlcnMgZm9yIGV2ZXJ5dGhpbmcuIGBkaXNhYmxlZGAgaXNcbiAgICAvLyBhIHNwZWNpYWwgY2FzZSwgYmVjYXVzZSBpdCBjYW4gcHJldmVudCB0aGUgYGJlZm9yZVN0YXJ0ZWRgIGV2ZW50IGZyb20gZmlyaW5nLCB3aGljaCBjYW4gbG9ja1xuICAgIC8vIHRoZSB1c2VyIGluIGEgZGlzYWJsZWQgc3RhdGUsIHNvIHdlIGFsc28gbmVlZCB0byBzeW5jIGl0IGFzIGl0J3MgYmVpbmcgc2V0LlxuICAgIHRoaXMuX2Ryb3BMaXN0UmVmLmRpc2FibGVkID0gdGhpcy5fZGlzYWJsZWQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG4gIHByaXZhdGUgX2Rpc2FibGVkOiBib29sZWFuO1xuXG4gIC8qKiBXaGV0aGVyIHNvcnRpbmcgd2l0aGluIHRoaXMgZHJvcCBsaXN0IGlzIGRpc2FibGVkLiAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0U29ydGluZ0Rpc2FibGVkJylcbiAgc29ydGluZ0Rpc2FibGVkOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBGdW5jdGlvbiB0aGF0IGlzIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYW4gaXRlbVxuICAgKiBpcyBhbGxvd2VkIHRvIGJlIG1vdmVkIGludG8gYSBkcm9wIGNvbnRhaW5lci5cbiAgICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3RFbnRlclByZWRpY2F0ZScpXG4gIGVudGVyUHJlZGljYXRlOiAoZHJhZzogQ2RrRHJhZywgZHJvcDogQ2RrRHJvcExpc3QpID0+IGJvb2xlYW4gPSAoKSA9PiB0cnVlXG5cbiAgLyoqIFdoZXRoZXIgdG8gYXV0by1zY3JvbGwgdGhlIHZpZXcgd2hlbiB0aGUgdXNlciBtb3ZlcyB0aGVpciBwb2ludGVyIGNsb3NlIHRvIHRoZSBlZGdlcy4gKi9cbiAgQElucHV0KCdjZGtEcm9wTGlzdEF1dG9TY3JvbGxEaXNhYmxlZCcpXG4gIGF1dG9TY3JvbGxEaXNhYmxlZDogYm9vbGVhbjtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBkcm9wcyBhbiBpdGVtIGluc2lkZSB0aGUgY29udGFpbmVyLiAqL1xuICBAT3V0cHV0KCdjZGtEcm9wTGlzdERyb3BwZWQnKVxuICBkcm9wcGVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0Ryb3A8VCwgYW55Pj4gPSBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdEcm9wPFQsIGFueT4+KCk7XG5cbiAgLyoqXG4gICAqIEVtaXRzIHdoZW4gdGhlIHVzZXIgaGFzIG1vdmVkIGEgbmV3IGRyYWcgaXRlbSBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKi9cbiAgQE91dHB1dCgnY2RrRHJvcExpc3RFbnRlcmVkJylcbiAgZW50ZXJlZDogRXZlbnRFbWl0dGVyPENka0RyYWdFbnRlcjxUPj4gPSBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdFbnRlcjxUPj4oKTtcblxuICAvKipcbiAgICogRW1pdHMgd2hlbiB0aGUgdXNlciByZW1vdmVzIGFuIGl0ZW0gZnJvbSB0aGUgY29udGFpbmVyXG4gICAqIGJ5IGRyYWdnaW5nIGl0IGludG8gYW5vdGhlciBjb250YWluZXIuXG4gICAqL1xuICBAT3V0cHV0KCdjZGtEcm9wTGlzdEV4aXRlZCcpXG4gIGV4aXRlZDogRXZlbnRFbWl0dGVyPENka0RyYWdFeGl0PFQ+PiA9IG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0V4aXQ8VD4+KCk7XG5cbiAgLyoqIEVtaXRzIGFzIHRoZSB1c2VyIGlzIHN3YXBwaW5nIGl0ZW1zIHdoaWxlIGFjdGl2ZWx5IGRyYWdnaW5nLiAqL1xuICBAT3V0cHV0KCdjZGtEcm9wTGlzdFNvcnRlZCcpXG4gIHNvcnRlZDogRXZlbnRFbWl0dGVyPENka0RyYWdTb3J0RXZlbnQ8VD4+ID0gbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnU29ydEV2ZW50PFQ+PigpO1xuXG4gIC8qKlxuICAgKiBLZWVwcyB0cmFjayBvZiB0aGUgaXRlbXMgdGhhdCBhcmUgcmVnaXN0ZXJlZCB3aXRoIHRoaXMgY29udGFpbmVyLiBIaXN0b3JpY2FsbHkgd2UgdXNlZCB0b1xuICAgKiBkbyB0aGlzIHdpdGggYSBgQ29udGVudENoaWxkcmVuYCBxdWVyeSwgaG93ZXZlciBxdWVyaWVzIGRvbid0IGhhbmRsZSB0cmFuc3BsYW50ZWQgdmlld3MgdmVyeVxuICAgKiB3ZWxsIHdoaWNoIG1lYW5zIHRoYXQgd2UgY2FuJ3QgaGFuZGxlIGNhc2VzIGxpa2UgZHJhZ2dpbmcgdGhlIGhlYWRlcnMgb2YgYSBgbWF0LXRhYmxlYFxuICAgKiBjb3JyZWN0bHkuIFdoYXQgd2UgZG8gaW5zdGVhZCBpcyB0byBoYXZlIHRoZSBpdGVtcyByZWdpc3RlciB0aGVtc2VsdmVzIHdpdGggdGhlIGNvbnRhaW5lclxuICAgKiBhbmQgdGhlbiB3ZSBzb3J0IHRoZW0gYmFzZWQgb24gdGhlaXIgcG9zaXRpb24gaW4gdGhlIERPTS5cbiAgICovXG4gIHByaXZhdGUgX3Vuc29ydGVkSXRlbXMgPSBuZXcgU2V0PENka0RyYWc+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICAvKiogRWxlbWVudCB0aGF0IHRoZSBkcm9wIGxpc3QgaXMgYXR0YWNoZWQgdG8uICovXG4gICAgICBwdWJsaWMgZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sIGRyYWdEcm9wOiBEcmFnRHJvcCxcbiAgICAgIHByaXZhdGUgX2NoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZiwgQE9wdGlvbmFsKCkgcHJpdmF0ZSBfZGlyPzogRGlyZWN0aW9uYWxpdHksXG4gICAgICBAT3B0aW9uYWwoKSBAU2tpcFNlbGYoKSBwcml2YXRlIF9ncm91cD86IENka0Ryb3BMaXN0R3JvdXA8Q2RrRHJvcExpc3Q+LFxuXG4gICAgICAvKipcbiAgICAgICAqIEBkZXByZWNhdGVkIF9zY3JvbGxEaXNwYXRjaGVyIHBhcmFtZXRlciB0byBiZWNvbWUgcmVxdWlyZWQuXG4gICAgICAgKiBAYnJlYWtpbmctY2hhbmdlIDExLjAuMFxuICAgICAgICovXG4gICAgICBwcml2YXRlIF9zY3JvbGxEaXNwYXRjaGVyPzogU2Nyb2xsRGlzcGF0Y2hlcixcbiAgICAgIEBPcHRpb25hbCgpIEBJbmplY3QoQ0RLX0RSQUdfQ09ORklHKSBjb25maWc/OiBEcmFnRHJvcENvbmZpZykge1xuICAgIHRoaXMuX2Ryb3BMaXN0UmVmID0gZHJhZ0Ryb3AuY3JlYXRlRHJvcExpc3QoZWxlbWVudCk7XG4gICAgdGhpcy5fZHJvcExpc3RSZWYuZGF0YSA9IHRoaXM7XG5cbiAgICBpZiAoY29uZmlnKSB7XG4gICAgICB0aGlzLl9hc3NpZ25EZWZhdWx0cyhjb25maWcpO1xuICAgIH1cblxuICAgIHRoaXMuX2Ryb3BMaXN0UmVmLmVudGVyUHJlZGljYXRlID0gKGRyYWc6IERyYWdSZWY8Q2RrRHJhZz4sIGRyb3A6IERyb3BMaXN0UmVmPENka0Ryb3BMaXN0PikgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMuZW50ZXJQcmVkaWNhdGUoZHJhZy5kYXRhLCBkcm9wLmRhdGEpO1xuICAgIH07XG5cbiAgICB0aGlzLl9zZXR1cElucHV0U3luY1N1YnNjcmlwdGlvbih0aGlzLl9kcm9wTGlzdFJlZik7XG4gICAgdGhpcy5faGFuZGxlRXZlbnRzKHRoaXMuX2Ryb3BMaXN0UmVmKTtcbiAgICBDZGtEcm9wTGlzdC5fZHJvcExpc3RzLnB1c2godGhpcyk7XG5cbiAgICBpZiAoX2dyb3VwKSB7XG4gICAgICBfZ3JvdXAuX2l0ZW1zLmFkZCh0aGlzKTtcbiAgICB9XG4gIH1cblxuICAvKiogUmVnaXN0ZXJzIGFuIGl0ZW1zIHdpdGggdGhlIGRyb3AgbGlzdC4gKi9cbiAgYWRkSXRlbShpdGVtOiBDZGtEcmFnKTogdm9pZCB7XG4gICAgdGhpcy5fdW5zb3J0ZWRJdGVtcy5hZGQoaXRlbSk7XG5cbiAgICBpZiAodGhpcy5fZHJvcExpc3RSZWYuaXNEcmFnZ2luZygpKSB7XG4gICAgICB0aGlzLl9zeW5jSXRlbXNXaXRoUmVmKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFJlbW92ZXMgYW4gaXRlbSBmcm9tIHRoZSBkcm9wIGxpc3QuICovXG4gIHJlbW92ZUl0ZW0oaXRlbTogQ2RrRHJhZyk6IHZvaWQge1xuICAgIHRoaXMuX3Vuc29ydGVkSXRlbXMuZGVsZXRlKGl0ZW0pO1xuXG4gICAgaWYgKHRoaXMuX2Ryb3BMaXN0UmVmLmlzRHJhZ2dpbmcoKSkge1xuICAgICAgdGhpcy5fc3luY0l0ZW1zV2l0aFJlZigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSByZWdpc3RlcmVkIGl0ZW1zIGluIHRoZSBsaXN0LCBzb3J0ZWQgYnkgdGhlaXIgcG9zaXRpb24gaW4gdGhlIERPTS4gKi9cbiAgZ2V0U29ydGVkSXRlbXMoKTogQ2RrRHJhZ1tdIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLl91bnNvcnRlZEl0ZW1zKS5zb3J0KChhOiBDZGtEcmFnLCBiOiBDZGtEcmFnKSA9PiB7XG4gICAgICBjb25zdCBkb2N1bWVudFBvc2l0aW9uID1cbiAgICAgICAgICBhLl9kcmFnUmVmLmdldFZpc2libGVFbGVtZW50KCkuY29tcGFyZURvY3VtZW50UG9zaXRpb24oYi5fZHJhZ1JlZi5nZXRWaXNpYmxlRWxlbWVudCgpKTtcblxuICAgICAgLy8gYGNvbXBhcmVEb2N1bWVudFBvc2l0aW9uYCByZXR1cm5zIGEgYml0bWFzayBzbyB3ZSBoYXZlIHRvIHVzZSBhIGJpdHdpc2Ugb3BlcmF0b3IuXG4gICAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvTm9kZS9jb21wYXJlRG9jdW1lbnRQb3NpdGlvblxuICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWJpdHdpc2VcbiAgICAgIHJldHVybiBkb2N1bWVudFBvc2l0aW9uICYgTm9kZS5ET0NVTUVOVF9QT1NJVElPTl9GT0xMT1dJTkcgPyAtMSA6IDE7XG4gICAgfSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBjb25zdCBpbmRleCA9IENka0Ryb3BMaXN0Ll9kcm9wTGlzdHMuaW5kZXhPZih0aGlzKTtcblxuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICBDZGtEcm9wTGlzdC5fZHJvcExpc3RzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2dyb3VwKSB7XG4gICAgICB0aGlzLl9ncm91cC5faXRlbXMuZGVsZXRlKHRoaXMpO1xuICAgIH1cblxuICAgIHRoaXMuX3Vuc29ydGVkSXRlbXMuY2xlYXIoKTtcbiAgICB0aGlzLl9kcm9wTGlzdFJlZi5kaXNwb3NlKCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKiBTeW5jcyB0aGUgaW5wdXRzIG9mIHRoZSBDZGtEcm9wTGlzdCB3aXRoIHRoZSBvcHRpb25zIG9mIHRoZSB1bmRlcmx5aW5nIERyb3BMaXN0UmVmLiAqL1xuICBwcml2YXRlIF9zZXR1cElucHV0U3luY1N1YnNjcmlwdGlvbihyZWY6IERyb3BMaXN0UmVmPENka0Ryb3BMaXN0Pikge1xuICAgIGlmICh0aGlzLl9kaXIpIHtcbiAgICAgIHRoaXMuX2Rpci5jaGFuZ2VcbiAgICAgICAgLnBpcGUoc3RhcnRXaXRoKHRoaXMuX2Rpci52YWx1ZSksIHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpKVxuICAgICAgICAuc3Vic2NyaWJlKHZhbHVlID0+IHJlZi53aXRoRGlyZWN0aW9uKHZhbHVlKSk7XG4gICAgfVxuXG4gICAgcmVmLmJlZm9yZVN0YXJ0ZWQuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIGNvbnN0IHNpYmxpbmdzID0gY29lcmNlQXJyYXkodGhpcy5jb25uZWN0ZWRUbykubWFwKGRyb3AgPT4ge1xuICAgICAgICByZXR1cm4gdHlwZW9mIGRyb3AgPT09ICdzdHJpbmcnID9cbiAgICAgICAgICAgIENka0Ryb3BMaXN0Ll9kcm9wTGlzdHMuZmluZChsaXN0ID0+IGxpc3QuaWQgPT09IGRyb3ApISA6IGRyb3A7XG4gICAgICB9KTtcblxuICAgICAgaWYgKHRoaXMuX2dyb3VwKSB7XG4gICAgICAgIHRoaXMuX2dyb3VwLl9pdGVtcy5mb3JFYWNoKGRyb3AgPT4ge1xuICAgICAgICAgIGlmIChzaWJsaW5ncy5pbmRleE9mKGRyb3ApID09PSAtMSkge1xuICAgICAgICAgICAgc2libGluZ3MucHVzaChkcm9wKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBOb3RlIHRoYXQgd2UgcmVzb2x2ZSB0aGUgc2Nyb2xsYWJsZSBwYXJlbnRzIGhlcmUgc28gdGhhdCB3ZSBkZWxheSB0aGUgcmVzb2x1dGlvblxuICAgICAgLy8gYXMgbG9uZyBhcyBwb3NzaWJsZSwgZW5zdXJpbmcgdGhhdCB0aGUgZWxlbWVudCBpcyBpbiBpdHMgZmluYWwgcGxhY2UgaW4gdGhlIERPTS5cbiAgICAgIC8vIEBicmVha2luZy1jaGFuZ2UgMTEuMC4wIFJlbW92ZSBudWxsIGNoZWNrIGZvciBfc2Nyb2xsRGlzcGF0Y2hlciBvbmNlIGl0J3MgcmVxdWlyZWQuXG4gICAgICBpZiAoIXRoaXMuX3Njcm9sbGFibGVQYXJlbnRzUmVzb2x2ZWQgJiYgdGhpcy5fc2Nyb2xsRGlzcGF0Y2hlcikge1xuICAgICAgICBjb25zdCBzY3JvbGxhYmxlUGFyZW50cyA9IHRoaXMuX3Njcm9sbERpc3BhdGNoZXJcbiAgICAgICAgICAuZ2V0QW5jZXN0b3JTY3JvbGxDb250YWluZXJzKHRoaXMuZWxlbWVudClcbiAgICAgICAgICAubWFwKHNjcm9sbGFibGUgPT4gc2Nyb2xsYWJsZS5nZXRFbGVtZW50UmVmKCkubmF0aXZlRWxlbWVudCk7XG4gICAgICAgIHRoaXMuX2Ryb3BMaXN0UmVmLndpdGhTY3JvbGxhYmxlUGFyZW50cyhzY3JvbGxhYmxlUGFyZW50cyk7XG5cbiAgICAgICAgLy8gT25seSBkbyB0aGlzIG9uY2Ugc2luY2UgaXQgaW52b2x2ZXMgdHJhdmVyc2luZyB0aGUgRE9NIGFuZCB0aGUgcGFyZW50c1xuICAgICAgICAvLyBzaG91bGRuJ3QgYmUgYWJsZSB0byBjaGFuZ2Ugd2l0aG91dCB0aGUgZHJvcCBsaXN0IGJlaW5nIGRlc3Ryb3llZC5cbiAgICAgICAgdGhpcy5fc2Nyb2xsYWJsZVBhcmVudHNSZXNvbHZlZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHJlZi5kaXNhYmxlZCA9IHRoaXMuZGlzYWJsZWQ7XG4gICAgICByZWYubG9ja0F4aXMgPSB0aGlzLmxvY2tBeGlzO1xuICAgICAgcmVmLnNvcnRpbmdEaXNhYmxlZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh0aGlzLnNvcnRpbmdEaXNhYmxlZCk7XG4gICAgICByZWYuYXV0b1Njcm9sbERpc2FibGVkID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHRoaXMuYXV0b1Njcm9sbERpc2FibGVkKTtcbiAgICAgIHJlZlxuICAgICAgICAuY29ubmVjdGVkVG8oc2libGluZ3MuZmlsdGVyKGRyb3AgPT4gZHJvcCAmJiBkcm9wICE9PSB0aGlzKS5tYXAobGlzdCA9PiBsaXN0Ll9kcm9wTGlzdFJlZikpXG4gICAgICAgIC53aXRoT3JpZW50YXRpb24odGhpcy5vcmllbnRhdGlvbik7XG4gICAgfSk7XG4gIH1cblxuICAvKiogSGFuZGxlcyBldmVudHMgZnJvbSB0aGUgdW5kZXJseWluZyBEcm9wTGlzdFJlZi4gKi9cbiAgcHJpdmF0ZSBfaGFuZGxlRXZlbnRzKHJlZjogRHJvcExpc3RSZWY8Q2RrRHJvcExpc3Q+KSB7XG4gICAgcmVmLmJlZm9yZVN0YXJ0ZWQuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIHRoaXMuX3N5bmNJdGVtc1dpdGhSZWYoKTtcbiAgICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICAgIH0pO1xuXG4gICAgcmVmLmVudGVyZWQuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgIHRoaXMuZW50ZXJlZC5lbWl0KHtcbiAgICAgICAgY29udGFpbmVyOiB0aGlzLFxuICAgICAgICBpdGVtOiBldmVudC5pdGVtLmRhdGEsXG4gICAgICAgIGN1cnJlbnRJbmRleDogZXZlbnQuY3VycmVudEluZGV4XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJlZi5leGl0ZWQuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgIHRoaXMuZXhpdGVkLmVtaXQoe1xuICAgICAgICBjb250YWluZXI6IHRoaXMsXG4gICAgICAgIGl0ZW06IGV2ZW50Lml0ZW0uZGF0YVxuICAgICAgfSk7XG4gICAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgICB9KTtcblxuICAgIHJlZi5zb3J0ZWQuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgIHRoaXMuc29ydGVkLmVtaXQoe1xuICAgICAgICBwcmV2aW91c0luZGV4OiBldmVudC5wcmV2aW91c0luZGV4LFxuICAgICAgICBjdXJyZW50SW5kZXg6IGV2ZW50LmN1cnJlbnRJbmRleCxcbiAgICAgICAgY29udGFpbmVyOiB0aGlzLFxuICAgICAgICBpdGVtOiBldmVudC5pdGVtLmRhdGFcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmVmLmRyb3BwZWQuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgIHRoaXMuZHJvcHBlZC5lbWl0KHtcbiAgICAgICAgcHJldmlvdXNJbmRleDogZXZlbnQucHJldmlvdXNJbmRleCxcbiAgICAgICAgY3VycmVudEluZGV4OiBldmVudC5jdXJyZW50SW5kZXgsXG4gICAgICAgIHByZXZpb3VzQ29udGFpbmVyOiBldmVudC5wcmV2aW91c0NvbnRhaW5lci5kYXRhLFxuICAgICAgICBjb250YWluZXI6IGV2ZW50LmNvbnRhaW5lci5kYXRhLFxuICAgICAgICBpdGVtOiBldmVudC5pdGVtLmRhdGEsXG4gICAgICAgIGlzUG9pbnRlck92ZXJDb250YWluZXI6IGV2ZW50LmlzUG9pbnRlck92ZXJDb250YWluZXIsXG4gICAgICAgIGRpc3RhbmNlOiBldmVudC5kaXN0YW5jZVxuICAgICAgfSk7XG5cbiAgICAgIC8vIE1hcmsgZm9yIGNoZWNrIHNpbmNlIGFsbCBvZiB0aGVzZSBldmVudHMgcnVuIG91dHNpZGUgb2YgY2hhbmdlXG4gICAgICAvLyBkZXRlY3Rpb24gYW5kIHdlJ3JlIG5vdCBndWFyYW50ZWVkIGZvciBzb21ldGhpbmcgZWxzZSB0byBoYXZlIHRyaWdnZXJlZCBpdC5cbiAgICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIEFzc2lnbnMgdGhlIGRlZmF1bHQgaW5wdXQgdmFsdWVzIGJhc2VkIG9uIGEgcHJvdmlkZWQgY29uZmlnIG9iamVjdC4gKi9cbiAgcHJpdmF0ZSBfYXNzaWduRGVmYXVsdHMoY29uZmlnOiBEcmFnRHJvcENvbmZpZykge1xuICAgIGNvbnN0IHtcbiAgICAgIGxvY2tBeGlzLCBkcmFnZ2luZ0Rpc2FibGVkLCBzb3J0aW5nRGlzYWJsZWQsIGxpc3RBdXRvU2Nyb2xsRGlzYWJsZWQsIGxpc3RPcmllbnRhdGlvblxuICAgIH0gPSBjb25maWc7XG5cbiAgICB0aGlzLmRpc2FibGVkID0gZHJhZ2dpbmdEaXNhYmxlZCA9PSBudWxsID8gZmFsc2UgOiBkcmFnZ2luZ0Rpc2FibGVkO1xuICAgIHRoaXMuc29ydGluZ0Rpc2FibGVkID0gc29ydGluZ0Rpc2FibGVkID09IG51bGwgPyBmYWxzZSA6IHNvcnRpbmdEaXNhYmxlZDtcbiAgICB0aGlzLmF1dG9TY3JvbGxEaXNhYmxlZCA9IGxpc3RBdXRvU2Nyb2xsRGlzYWJsZWQgPT0gbnVsbCA/IGZhbHNlIDogbGlzdEF1dG9TY3JvbGxEaXNhYmxlZDtcbiAgICB0aGlzLm9yaWVudGF0aW9uID0gbGlzdE9yaWVudGF0aW9uIHx8ICd2ZXJ0aWNhbCc7XG5cbiAgICBpZiAobG9ja0F4aXMpIHtcbiAgICAgIHRoaXMubG9ja0F4aXMgPSBsb2NrQXhpcztcbiAgICB9XG4gIH1cblxuICAvKiogU3luY3MgdXAgdGhlIHJlZ2lzdGVyZWQgZHJhZyBpdGVtcyB3aXRoIHVuZGVybHlpbmcgZHJvcCBsaXN0IHJlZi4gKi9cbiAgcHJpdmF0ZSBfc3luY0l0ZW1zV2l0aFJlZigpIHtcbiAgICB0aGlzLl9kcm9wTGlzdFJlZi53aXRoSXRlbXModGhpcy5nZXRTb3J0ZWRJdGVtcygpLm1hcChpdGVtID0+IGl0ZW0uX2RyYWdSZWYpKTtcbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9kaXNhYmxlZDogQm9vbGVhbklucHV0O1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfc29ydGluZ0Rpc2FibGVkOiBCb29sZWFuSW5wdXQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9hdXRvU2Nyb2xsRGlzYWJsZWQ6IEJvb2xlYW5JbnB1dDtcbn1cbiJdfQ==