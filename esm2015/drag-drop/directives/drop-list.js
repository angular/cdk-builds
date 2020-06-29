/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { coerceArray, coerceBooleanProperty } from '@angular/cdk/coercion';
import { ElementRef, EventEmitter, Input, Output, Optional, Directive, ChangeDetectorRef, SkipSelf, Inject, InjectionToken, } from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { ScrollDispatcher } from '@angular/cdk/scrolling';
import { CDK_DROP_LIST_GROUP, CdkDropListGroup } from './drop-list-group';
import { DragDrop } from '../drag-drop';
import { CDK_DRAG_CONFIG } from './config';
import { Subject } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';
/** Counter used to generate unique ids for drop zones. */
let _uniqueIdCounter = 0;
/**
 * Injection token that can be used to reference instances of `CdkDropList`. It serves as
 * alternative token to the actual `CdkDropList` class which could cause unnecessary
 * retention of the class and its directive metadata.
 */
export const CDK_DROP_LIST = new InjectionToken('CdkDropList');
const ɵ0 = undefined;
/** Container that wraps a set of draggable items. */
let CdkDropList = /** @class */ (() => {
    class CdkDropList {
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
            CdkDropList._dropLists.push(this);
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
            const index = CdkDropList._dropLists.indexOf(this);
            if (index > -1) {
                CdkDropList._dropLists.splice(index, 1);
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
                        CdkDropList._dropLists.find(list => list.id === drop) : drop;
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
    }
    /** Keeps track of the drop lists that are currently on the page. */
    CdkDropList._dropLists = [];
    CdkDropList.decorators = [
        { type: Directive, args: [{
                    selector: '[cdkDropList], cdk-drop-list',
                    exportAs: 'cdkDropList',
                    providers: [
                        // Prevent child drop lists from picking up the same group as their parent.
                        { provide: CDK_DROP_LIST_GROUP, useValue: ɵ0 },
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
    CdkDropList.ctorParameters = () => [
        { type: ElementRef },
        { type: DragDrop },
        { type: ChangeDetectorRef },
        { type: Directionality, decorators: [{ type: Optional }] },
        { type: CdkDropListGroup, decorators: [{ type: Optional }, { type: Inject, args: [CDK_DROP_LIST_GROUP,] }, { type: SkipSelf }] },
        { type: ScrollDispatcher },
        { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [CDK_DRAG_CONFIG,] }] }
    ];
    CdkDropList.propDecorators = {
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
    return CdkDropList;
})();
export { CdkDropList };
export { ɵ0 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZGlyZWN0aXZlcy9kcm9wLWxpc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFlLFdBQVcsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3ZGLE9BQU8sRUFDTCxVQUFVLEVBQ1YsWUFBWSxFQUNaLEtBQUssRUFFTCxNQUFNLEVBQ04sUUFBUSxFQUNSLFNBQVMsRUFDVCxpQkFBaUIsRUFDakIsUUFBUSxFQUNSLE1BQU0sRUFDTixjQUFjLEdBQ2YsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBR3hELE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBR3hFLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDdEMsT0FBTyxFQUFnRCxlQUFlLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDeEYsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUM3QixPQUFPLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXBELDBEQUEwRDtBQUMxRCxJQUFJLGdCQUFnQixHQUFHLENBQUMsQ0FBQztBQVN6Qjs7OztHQUlHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sYUFBYSxHQUFHLElBQUksY0FBYyxDQUFjLGFBQWEsQ0FBQyxDQUFDO1dBUS9CLFNBQVM7QUFOdEQscURBQXFEO0FBQ3JEO0lBQUEsTUFnQmEsV0FBVztRQStGdEI7UUFDSSxpREFBaUQ7UUFDMUMsT0FBZ0MsRUFBRSxRQUFrQixFQUNuRCxrQkFBcUMsRUFB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QUFDLG9CQUFvQjswQkFNM0IsTUFBTSxTQUFDLG9CQUFvQjt5QkFPM0IsTUFBTSxTQUFDLG1CQUFtQjt5QkFJMUIsTUFBTSxTQUFDLG1CQUFtQjs7SUFvTjdCLGtCQUFDO0tBQUE7U0F2U1ksV0FBVyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0Jvb2xlYW5JbnB1dCwgY29lcmNlQXJyYXksIGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7XG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5wdXQsXG4gIE9uRGVzdHJveSxcbiAgT3V0cHV0LFxuICBPcHRpb25hbCxcbiAgRGlyZWN0aXZlLFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgU2tpcFNlbGYsXG4gIEluamVjdCxcbiAgSW5qZWN0aW9uVG9rZW4sXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtTY3JvbGxEaXNwYXRjaGVyfSBmcm9tICdAYW5ndWxhci9jZGsvc2Nyb2xsaW5nJztcbmltcG9ydCB7Q2RrRHJhZ30gZnJvbSAnLi9kcmFnJztcbmltcG9ydCB7Q2RrRHJhZ0Ryb3AsIENka0RyYWdFbnRlciwgQ2RrRHJhZ0V4aXQsIENka0RyYWdTb3J0RXZlbnR9IGZyb20gJy4uL2RyYWctZXZlbnRzJztcbmltcG9ydCB7Q0RLX0RST1BfTElTVF9HUk9VUCwgQ2RrRHJvcExpc3RHcm91cH0gZnJvbSAnLi9kcm9wLWxpc3QtZ3JvdXAnO1xuaW1wb3J0IHtEcm9wTGlzdFJlZn0gZnJvbSAnLi4vZHJvcC1saXN0LXJlZic7XG5pbXBvcnQge0RyYWdSZWZ9IGZyb20gJy4uL2RyYWctcmVmJztcbmltcG9ydCB7RHJhZ0Ryb3B9IGZyb20gJy4uL2RyYWctZHJvcCc7XG5pbXBvcnQge0Ryb3BMaXN0T3JpZW50YXRpb24sIERyYWdBeGlzLCBEcmFnRHJvcENvbmZpZywgQ0RLX0RSQUdfQ09ORklHfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQge1N1YmplY3R9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtzdGFydFdpdGgsIHRha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG4vKiogQ291bnRlciB1c2VkIHRvIGdlbmVyYXRlIHVuaXF1ZSBpZHMgZm9yIGRyb3Agem9uZXMuICovXG5sZXQgX3VuaXF1ZUlkQ291bnRlciA9IDA7XG5cbi8qKlxuICogSW50ZXJuYWwgY29tcGlsZS10aW1lLW9ubHkgcmVwcmVzZW50YXRpb24gb2YgYSBgQ2RrRHJvcExpc3RgLlxuICogVXNlZCB0byBhdm9pZCBjaXJjdWxhciBpbXBvcnQgaXNzdWVzIGJldHdlZW4gdGhlIGBDZGtEcm9wTGlzdGAgYW5kIHRoZSBgQ2RrRHJhZ2AuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2RrRHJvcExpc3RJbnRlcm5hbCBleHRlbmRzIENka0Ryb3BMaXN0IHt9XG5cbi8qKlxuICogSW5qZWN0aW9uIHRva2VuIHRoYXQgY2FuIGJlIHVzZWQgdG8gcmVmZXJlbmNlIGluc3RhbmNlcyBvZiBgQ2RrRHJvcExpc3RgLiBJdCBzZXJ2ZXMgYXNcbiAqIGFsdGVybmF0aXZlIHRva2VuIHRvIHRoZSBhY3R1YWwgYENka0Ryb3BMaXN0YCBjbGFzcyB3aGljaCBjb3VsZCBjYXVzZSB1bm5lY2Vzc2FyeVxuICogcmV0ZW50aW9uIG9mIHRoZSBjbGFzcyBhbmQgaXRzIGRpcmVjdGl2ZSBtZXRhZGF0YS5cbiAqL1xuZXhwb3J0IGNvbnN0IENES19EUk9QX0xJU1QgPSBuZXcgSW5qZWN0aW9uVG9rZW48Q2RrRHJvcExpc3Q+KCdDZGtEcm9wTGlzdCcpO1xuXG4vKiogQ29udGFpbmVyIHRoYXQgd3JhcHMgYSBzZXQgb2YgZHJhZ2dhYmxlIGl0ZW1zLiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka0Ryb3BMaXN0XSwgY2RrLWRyb3AtbGlzdCcsXG4gIGV4cG9ydEFzOiAnY2RrRHJvcExpc3QnLFxuICBwcm92aWRlcnM6IFtcbiAgICAvLyBQcmV2ZW50IGNoaWxkIGRyb3AgbGlzdHMgZnJvbSBwaWNraW5nIHVwIHRoZSBzYW1lIGdyb3VwIGFzIHRoZWlyIHBhcmVudC5cbiAgICB7cHJvdmlkZTogQ0RLX0RST1BfTElTVF9HUk9VUCwgdXNlVmFsdWU6IHVuZGVmaW5lZH0sXG4gICAge3Byb3ZpZGU6IENES19EUk9QX0xJU1QsIHVzZUV4aXN0aW5nOiBDZGtEcm9wTGlzdH0sXG4gIF0sXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLWRyb3AtbGlzdCcsXG4gICAgJ1tpZF0nOiAnaWQnLFxuICAgICdbY2xhc3MuY2RrLWRyb3AtbGlzdC1kaXNhYmxlZF0nOiAnZGlzYWJsZWQnLFxuICAgICdbY2xhc3MuY2RrLWRyb3AtbGlzdC1kcmFnZ2luZ10nOiAnX2Ryb3BMaXN0UmVmLmlzRHJhZ2dpbmcoKScsXG4gICAgJ1tjbGFzcy5jZGstZHJvcC1saXN0LXJlY2VpdmluZ10nOiAnX2Ryb3BMaXN0UmVmLmlzUmVjZWl2aW5nKCknLFxuICB9XG59KVxuZXhwb3J0IGNsYXNzIENka0Ryb3BMaXN0PFQgPSBhbnk+IGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIEVtaXRzIHdoZW4gdGhlIGxpc3QgaGFzIGJlZW4gZGVzdHJveWVkLiAqL1xuICBwcml2YXRlIF9kZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBlbGVtZW50J3Mgc2Nyb2xsYWJsZSBwYXJlbnRzIGhhdmUgYmVlbiByZXNvbHZlZC4gKi9cbiAgcHJpdmF0ZSBfc2Nyb2xsYWJsZVBhcmVudHNSZXNvbHZlZDogYm9vbGVhbjtcblxuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIGRyb3AgbGlzdHMgdGhhdCBhcmUgY3VycmVudGx5IG9uIHRoZSBwYWdlLiAqL1xuICBwcml2YXRlIHN0YXRpYyBfZHJvcExpc3RzOiBDZGtEcm9wTGlzdFtdID0gW107XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgdW5kZXJseWluZyBkcm9wIGxpc3QgaW5zdGFuY2UuICovXG4gIF9kcm9wTGlzdFJlZjogRHJvcExpc3RSZWY8Q2RrRHJvcExpc3Q8VD4+O1xuXG4gIC8qKlxuICAgKiBPdGhlciBkcmFnZ2FibGUgY29udGFpbmVycyB0aGF0IHRoaXMgY29udGFpbmVyIGlzIGNvbm5lY3RlZCB0byBhbmQgaW50byB3aGljaCB0aGVcbiAgICogY29udGFpbmVyJ3MgaXRlbXMgY2FuIGJlIHRyYW5zZmVycmVkLiBDYW4gZWl0aGVyIGJlIHJlZmVyZW5jZXMgdG8gb3RoZXIgZHJvcCBjb250YWluZXJzLFxuICAgKiBvciB0aGVpciB1bmlxdWUgSURzLlxuICAgKi9cbiAgQElucHV0KCdjZGtEcm9wTGlzdENvbm5lY3RlZFRvJylcbiAgY29ubmVjdGVkVG86IChDZGtEcm9wTGlzdCB8IHN0cmluZylbXSB8IENka0Ryb3BMaXN0IHwgc3RyaW5nID0gW107XG5cbiAgLyoqIEFyYml0cmFyeSBkYXRhIHRvIGF0dGFjaCB0byB0aGlzIGNvbnRhaW5lci4gKi9cbiAgQElucHV0KCdjZGtEcm9wTGlzdERhdGEnKSBkYXRhOiBUO1xuXG4gIC8qKiBEaXJlY3Rpb24gaW4gd2hpY2ggdGhlIGxpc3QgaXMgb3JpZW50ZWQuICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3RPcmllbnRhdGlvbicpIG9yaWVudGF0aW9uOiBEcm9wTGlzdE9yaWVudGF0aW9uO1xuXG4gIC8qKlxuICAgKiBVbmlxdWUgSUQgZm9yIHRoZSBkcm9wIHpvbmUuIENhbiBiZSB1c2VkIGFzIGEgcmVmZXJlbmNlXG4gICAqIGluIHRoZSBgY29ubmVjdGVkVG9gIG9mIGFub3RoZXIgYENka0Ryb3BMaXN0YC5cbiAgICovXG4gIEBJbnB1dCgpIGlkOiBzdHJpbmcgPSBgY2RrLWRyb3AtbGlzdC0ke191bmlxdWVJZENvdW50ZXIrK31gO1xuXG4gIC8qKiBMb2NrcyB0aGUgcG9zaXRpb24gb2YgdGhlIGRyYWdnYWJsZSBlbGVtZW50cyBpbnNpZGUgdGhlIGNvbnRhaW5lciBhbG9uZyB0aGUgc3BlY2lmaWVkIGF4aXMuICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3RMb2NrQXhpcycpIGxvY2tBeGlzOiBEcmFnQXhpcztcblxuICAvKiogV2hldGhlciBzdGFydGluZyBhIGRyYWdnaW5nIHNlcXVlbmNlIGZyb20gdGhpcyBjb250YWluZXIgaXMgZGlzYWJsZWQuICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3REaXNhYmxlZCcpXG4gIGdldCBkaXNhYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fZGlzYWJsZWQgfHwgKCEhdGhpcy5fZ3JvdXAgJiYgdGhpcy5fZ3JvdXAuZGlzYWJsZWQpO1xuICB9XG4gIHNldCBkaXNhYmxlZCh2YWx1ZTogYm9vbGVhbikge1xuICAgIC8vIFVzdWFsbHkgd2Ugc3luYyB0aGUgZGlyZWN0aXZlIGFuZCByZWYgc3RhdGUgcmlnaHQgYmVmb3JlIGRyYWdnaW5nIHN0YXJ0cywgaW4gb3JkZXIgdG8gaGF2ZVxuICAgIC8vIGEgc2luZ2xlIHBvaW50IG9mIGZhaWx1cmUgYW5kIHRvIGF2b2lkIGhhdmluZyB0byB1c2Ugc2V0dGVycyBmb3IgZXZlcnl0aGluZy4gYGRpc2FibGVkYCBpc1xuICAgIC8vIGEgc3BlY2lhbCBjYXNlLCBiZWNhdXNlIGl0IGNhbiBwcmV2ZW50IHRoZSBgYmVmb3JlU3RhcnRlZGAgZXZlbnQgZnJvbSBmaXJpbmcsIHdoaWNoIGNhbiBsb2NrXG4gICAgLy8gdGhlIHVzZXIgaW4gYSBkaXNhYmxlZCBzdGF0ZSwgc28gd2UgYWxzbyBuZWVkIHRvIHN5bmMgaXQgYXMgaXQncyBiZWluZyBzZXQuXG4gICAgdGhpcy5fZHJvcExpc3RSZWYuZGlzYWJsZWQgPSB0aGlzLl9kaXNhYmxlZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gIH1cbiAgcHJpdmF0ZSBfZGlzYWJsZWQ6IGJvb2xlYW47XG5cbiAgLyoqIFdoZXRoZXIgc29ydGluZyB3aXRoaW4gdGhpcyBkcm9wIGxpc3QgaXMgZGlzYWJsZWQuICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3RTb3J0aW5nRGlzYWJsZWQnKVxuICBzb3J0aW5nRGlzYWJsZWQ6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEZ1bmN0aW9uIHRoYXQgaXMgdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBhbiBpdGVtXG4gICAqIGlzIGFsbG93ZWQgdG8gYmUgbW92ZWQgaW50byBhIGRyb3AgY29udGFpbmVyLlxuICAgKi9cbiAgQElucHV0KCdjZGtEcm9wTGlzdEVudGVyUHJlZGljYXRlJylcbiAgZW50ZXJQcmVkaWNhdGU6IChkcmFnOiBDZGtEcmFnLCBkcm9wOiBDZGtEcm9wTGlzdCkgPT4gYm9vbGVhbiA9ICgpID0+IHRydWVcblxuICAvKiogV2hldGhlciB0byBhdXRvLXNjcm9sbCB0aGUgdmlldyB3aGVuIHRoZSB1c2VyIG1vdmVzIHRoZWlyIHBvaW50ZXIgY2xvc2UgdG8gdGhlIGVkZ2VzLiAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0QXV0b1Njcm9sbERpc2FibGVkJylcbiAgYXV0b1Njcm9sbERpc2FibGVkOiBib29sZWFuO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGRyb3BzIGFuIGl0ZW0gaW5zaWRlIHRoZSBjb250YWluZXIuICovXG4gIEBPdXRwdXQoJ2Nka0Ryb3BMaXN0RHJvcHBlZCcpXG4gIGRyb3BwZWQ6IEV2ZW50RW1pdHRlcjxDZGtEcmFnRHJvcDxULCBhbnk+PiA9IG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0Ryb3A8VCwgYW55Pj4oKTtcblxuICAvKipcbiAgICogRW1pdHMgd2hlbiB0aGUgdXNlciBoYXMgbW92ZWQgYSBuZXcgZHJhZyBpdGVtIGludG8gdGhpcyBjb250YWluZXIuXG4gICAqL1xuICBAT3V0cHV0KCdjZGtEcm9wTGlzdEVudGVyZWQnKVxuICBlbnRlcmVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0VudGVyPFQ+PiA9IG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0VudGVyPFQ+PigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHJlbW92ZXMgYW4gaXRlbSBmcm9tIHRoZSBjb250YWluZXJcbiAgICogYnkgZHJhZ2dpbmcgaXQgaW50byBhbm90aGVyIGNvbnRhaW5lci5cbiAgICovXG4gIEBPdXRwdXQoJ2Nka0Ryb3BMaXN0RXhpdGVkJylcbiAgZXhpdGVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0V4aXQ8VD4+ID0gbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnRXhpdDxUPj4oKTtcblxuICAvKiogRW1pdHMgYXMgdGhlIHVzZXIgaXMgc3dhcHBpbmcgaXRlbXMgd2hpbGUgYWN0aXZlbHkgZHJhZ2dpbmcuICovXG4gIEBPdXRwdXQoJ2Nka0Ryb3BMaXN0U29ydGVkJylcbiAgc29ydGVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ1NvcnRFdmVudDxUPj4gPSBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdTb3J0RXZlbnQ8VD4+KCk7XG5cbiAgLyoqXG4gICAqIEtlZXBzIHRyYWNrIG9mIHRoZSBpdGVtcyB0aGF0IGFyZSByZWdpc3RlcmVkIHdpdGggdGhpcyBjb250YWluZXIuIEhpc3RvcmljYWxseSB3ZSB1c2VkIHRvXG4gICAqIGRvIHRoaXMgd2l0aCBhIGBDb250ZW50Q2hpbGRyZW5gIHF1ZXJ5LCBob3dldmVyIHF1ZXJpZXMgZG9uJ3QgaGFuZGxlIHRyYW5zcGxhbnRlZCB2aWV3cyB2ZXJ5XG4gICAqIHdlbGwgd2hpY2ggbWVhbnMgdGhhdCB3ZSBjYW4ndCBoYW5kbGUgY2FzZXMgbGlrZSBkcmFnZ2luZyB0aGUgaGVhZGVycyBvZiBhIGBtYXQtdGFibGVgXG4gICAqIGNvcnJlY3RseS4gV2hhdCB3ZSBkbyBpbnN0ZWFkIGlzIHRvIGhhdmUgdGhlIGl0ZW1zIHJlZ2lzdGVyIHRoZW1zZWx2ZXMgd2l0aCB0aGUgY29udGFpbmVyXG4gICAqIGFuZCB0aGVuIHdlIHNvcnQgdGhlbSBiYXNlZCBvbiB0aGVpciBwb3NpdGlvbiBpbiB0aGUgRE9NLlxuICAgKi9cbiAgcHJpdmF0ZSBfdW5zb3J0ZWRJdGVtcyA9IG5ldyBTZXQ8Q2RrRHJhZz4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKiBFbGVtZW50IHRoYXQgdGhlIGRyb3AgbGlzdCBpcyBhdHRhY2hlZCB0by4gKi9cbiAgICAgIHB1YmxpYyBlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiwgZHJhZ0Ryb3A6IERyYWdEcm9wLFxuICAgICAgcHJpdmF0ZSBfY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmLCBAT3B0aW9uYWwoKSBwcml2YXRlIF9kaXI/OiBEaXJlY3Rpb25hbGl0eSxcbiAgICAgIEBPcHRpb25hbCgpIEBJbmplY3QoQ0RLX0RST1BfTElTVF9HUk9VUCkgQFNraXBTZWxmKClcbiAgICAgIHByaXZhdGUgX2dyb3VwPzogQ2RrRHJvcExpc3RHcm91cDxDZGtEcm9wTGlzdD4sXG5cbiAgICAgIC8qKlxuICAgICAgICogQGRlcHJlY2F0ZWQgX3Njcm9sbERpc3BhdGNoZXIgcGFyYW1ldGVyIHRvIGJlY29tZSByZXF1aXJlZC5cbiAgICAgICAqIEBicmVha2luZy1jaGFuZ2UgMTEuMC4wXG4gICAgICAgKi9cbiAgICAgIHByaXZhdGUgX3Njcm9sbERpc3BhdGNoZXI/OiBTY3JvbGxEaXNwYXRjaGVyLFxuICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChDREtfRFJBR19DT05GSUcpIGNvbmZpZz86IERyYWdEcm9wQ29uZmlnKSB7XG4gICAgdGhpcy5fZHJvcExpc3RSZWYgPSBkcmFnRHJvcC5jcmVhdGVEcm9wTGlzdChlbGVtZW50KTtcbiAgICB0aGlzLl9kcm9wTGlzdFJlZi5kYXRhID0gdGhpcztcblxuICAgIGlmIChjb25maWcpIHtcbiAgICAgIHRoaXMuX2Fzc2lnbkRlZmF1bHRzKGNvbmZpZyk7XG4gICAgfVxuXG4gICAgdGhpcy5fZHJvcExpc3RSZWYuZW50ZXJQcmVkaWNhdGUgPSAoZHJhZzogRHJhZ1JlZjxDZGtEcmFnPiwgZHJvcDogRHJvcExpc3RSZWY8Q2RrRHJvcExpc3Q+KSA9PiB7XG4gICAgICByZXR1cm4gdGhpcy5lbnRlclByZWRpY2F0ZShkcmFnLmRhdGEsIGRyb3AuZGF0YSk7XG4gICAgfTtcblxuICAgIHRoaXMuX3NldHVwSW5wdXRTeW5jU3Vic2NyaXB0aW9uKHRoaXMuX2Ryb3BMaXN0UmVmKTtcbiAgICB0aGlzLl9oYW5kbGVFdmVudHModGhpcy5fZHJvcExpc3RSZWYpO1xuICAgIENka0Ryb3BMaXN0Ll9kcm9wTGlzdHMucHVzaCh0aGlzKTtcblxuICAgIGlmIChfZ3JvdXApIHtcbiAgICAgIF9ncm91cC5faXRlbXMuYWRkKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSZWdpc3RlcnMgYW4gaXRlbXMgd2l0aCB0aGUgZHJvcCBsaXN0LiAqL1xuICBhZGRJdGVtKGl0ZW06IENka0RyYWcpOiB2b2lkIHtcbiAgICB0aGlzLl91bnNvcnRlZEl0ZW1zLmFkZChpdGVtKTtcblxuICAgIGlmICh0aGlzLl9kcm9wTGlzdFJlZi5pc0RyYWdnaW5nKCkpIHtcbiAgICAgIHRoaXMuX3N5bmNJdGVtc1dpdGhSZWYoKTtcbiAgICB9XG4gIH1cblxuICAvKiogUmVtb3ZlcyBhbiBpdGVtIGZyb20gdGhlIGRyb3AgbGlzdC4gKi9cbiAgcmVtb3ZlSXRlbShpdGVtOiBDZGtEcmFnKTogdm9pZCB7XG4gICAgdGhpcy5fdW5zb3J0ZWRJdGVtcy5kZWxldGUoaXRlbSk7XG5cbiAgICBpZiAodGhpcy5fZHJvcExpc3RSZWYuaXNEcmFnZ2luZygpKSB7XG4gICAgICB0aGlzLl9zeW5jSXRlbXNXaXRoUmVmKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEdldHMgdGhlIHJlZ2lzdGVyZWQgaXRlbXMgaW4gdGhlIGxpc3QsIHNvcnRlZCBieSB0aGVpciBwb3NpdGlvbiBpbiB0aGUgRE9NLiAqL1xuICBnZXRTb3J0ZWRJdGVtcygpOiBDZGtEcmFnW10ge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuX3Vuc29ydGVkSXRlbXMpLnNvcnQoKGE6IENka0RyYWcsIGI6IENka0RyYWcpID0+IHtcbiAgICAgIGNvbnN0IGRvY3VtZW50UG9zaXRpb24gPVxuICAgICAgICAgIGEuX2RyYWdSZWYuZ2V0VmlzaWJsZUVsZW1lbnQoKS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbihiLl9kcmFnUmVmLmdldFZpc2libGVFbGVtZW50KCkpO1xuXG4gICAgICAvLyBgY29tcGFyZURvY3VtZW50UG9zaXRpb25gIHJldHVybnMgYSBiaXRtYXNrIHNvIHdlIGhhdmUgdG8gdXNlIGEgYml0d2lzZSBvcGVyYXRvci5cbiAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9Ob2RlL2NvbXBhcmVEb2N1bWVudFBvc2l0aW9uXG4gICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYml0d2lzZVxuICAgICAgcmV0dXJuIGRvY3VtZW50UG9zaXRpb24gJiBOb2RlLkRPQ1VNRU5UX1BPU0lUSU9OX0ZPTExPV0lORyA/IC0xIDogMTtcbiAgICB9KTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIGNvbnN0IGluZGV4ID0gQ2RrRHJvcExpc3QuX2Ryb3BMaXN0cy5pbmRleE9mKHRoaXMpO1xuXG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIENka0Ryb3BMaXN0Ll9kcm9wTGlzdHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZ3JvdXApIHtcbiAgICAgIHRoaXMuX2dyb3VwLl9pdGVtcy5kZWxldGUodGhpcyk7XG4gICAgfVxuXG4gICAgdGhpcy5fdW5zb3J0ZWRJdGVtcy5jbGVhcigpO1xuICAgIHRoaXMuX2Ryb3BMaXN0UmVmLmRpc3Bvc2UoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQubmV4dCgpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5jb21wbGV0ZSgpO1xuICB9XG5cbiAgLyoqIFN5bmNzIHRoZSBpbnB1dHMgb2YgdGhlIENka0Ryb3BMaXN0IHdpdGggdGhlIG9wdGlvbnMgb2YgdGhlIHVuZGVybHlpbmcgRHJvcExpc3RSZWYuICovXG4gIHByaXZhdGUgX3NldHVwSW5wdXRTeW5jU3Vic2NyaXB0aW9uKHJlZjogRHJvcExpc3RSZWY8Q2RrRHJvcExpc3Q+KSB7XG4gICAgaWYgKHRoaXMuX2Rpcikge1xuICAgICAgdGhpcy5fZGlyLmNoYW5nZVxuICAgICAgICAucGlwZShzdGFydFdpdGgodGhpcy5fZGlyLnZhbHVlKSwgdGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpXG4gICAgICAgIC5zdWJzY3JpYmUodmFsdWUgPT4gcmVmLndpdGhEaXJlY3Rpb24odmFsdWUpKTtcbiAgICB9XG5cbiAgICByZWYuYmVmb3JlU3RhcnRlZC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgY29uc3Qgc2libGluZ3MgPSBjb2VyY2VBcnJheSh0aGlzLmNvbm5lY3RlZFRvKS5tYXAoZHJvcCA9PiB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgZHJvcCA9PT0gJ3N0cmluZycgP1xuICAgICAgICAgICAgQ2RrRHJvcExpc3QuX2Ryb3BMaXN0cy5maW5kKGxpc3QgPT4gbGlzdC5pZCA9PT0gZHJvcCkhIDogZHJvcDtcbiAgICAgIH0pO1xuXG4gICAgICBpZiAodGhpcy5fZ3JvdXApIHtcbiAgICAgICAgdGhpcy5fZ3JvdXAuX2l0ZW1zLmZvckVhY2goZHJvcCA9PiB7XG4gICAgICAgICAgaWYgKHNpYmxpbmdzLmluZGV4T2YoZHJvcCkgPT09IC0xKSB7XG4gICAgICAgICAgICBzaWJsaW5ncy5wdXNoKGRyb3ApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIE5vdGUgdGhhdCB3ZSByZXNvbHZlIHRoZSBzY3JvbGxhYmxlIHBhcmVudHMgaGVyZSBzbyB0aGF0IHdlIGRlbGF5IHRoZSByZXNvbHV0aW9uXG4gICAgICAvLyBhcyBsb25nIGFzIHBvc3NpYmxlLCBlbnN1cmluZyB0aGF0IHRoZSBlbGVtZW50IGlzIGluIGl0cyBmaW5hbCBwbGFjZSBpbiB0aGUgRE9NLlxuICAgICAgLy8gQGJyZWFraW5nLWNoYW5nZSAxMS4wLjAgUmVtb3ZlIG51bGwgY2hlY2sgZm9yIF9zY3JvbGxEaXNwYXRjaGVyIG9uY2UgaXQncyByZXF1aXJlZC5cbiAgICAgIGlmICghdGhpcy5fc2Nyb2xsYWJsZVBhcmVudHNSZXNvbHZlZCAmJiB0aGlzLl9zY3JvbGxEaXNwYXRjaGVyKSB7XG4gICAgICAgIGNvbnN0IHNjcm9sbGFibGVQYXJlbnRzID0gdGhpcy5fc2Nyb2xsRGlzcGF0Y2hlclxuICAgICAgICAgIC5nZXRBbmNlc3RvclNjcm9sbENvbnRhaW5lcnModGhpcy5lbGVtZW50KVxuICAgICAgICAgIC5tYXAoc2Nyb2xsYWJsZSA9PiBzY3JvbGxhYmxlLmdldEVsZW1lbnRSZWYoKS5uYXRpdmVFbGVtZW50KTtcbiAgICAgICAgdGhpcy5fZHJvcExpc3RSZWYud2l0aFNjcm9sbGFibGVQYXJlbnRzKHNjcm9sbGFibGVQYXJlbnRzKTtcblxuICAgICAgICAvLyBPbmx5IGRvIHRoaXMgb25jZSBzaW5jZSBpdCBpbnZvbHZlcyB0cmF2ZXJzaW5nIHRoZSBET00gYW5kIHRoZSBwYXJlbnRzXG4gICAgICAgIC8vIHNob3VsZG4ndCBiZSBhYmxlIHRvIGNoYW5nZSB3aXRob3V0IHRoZSBkcm9wIGxpc3QgYmVpbmcgZGVzdHJveWVkLlxuICAgICAgICB0aGlzLl9zY3JvbGxhYmxlUGFyZW50c1Jlc29sdmVkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgcmVmLmRpc2FibGVkID0gdGhpcy5kaXNhYmxlZDtcbiAgICAgIHJlZi5sb2NrQXhpcyA9IHRoaXMubG9ja0F4aXM7XG4gICAgICByZWYuc29ydGluZ0Rpc2FibGVkID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHRoaXMuc29ydGluZ0Rpc2FibGVkKTtcbiAgICAgIHJlZi5hdXRvU2Nyb2xsRGlzYWJsZWQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodGhpcy5hdXRvU2Nyb2xsRGlzYWJsZWQpO1xuICAgICAgcmVmXG4gICAgICAgIC5jb25uZWN0ZWRUbyhzaWJsaW5ncy5maWx0ZXIoZHJvcCA9PiBkcm9wICYmIGRyb3AgIT09IHRoaXMpLm1hcChsaXN0ID0+IGxpc3QuX2Ryb3BMaXN0UmVmKSlcbiAgICAgICAgLndpdGhPcmllbnRhdGlvbih0aGlzLm9yaWVudGF0aW9uKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBIYW5kbGVzIGV2ZW50cyBmcm9tIHRoZSB1bmRlcmx5aW5nIERyb3BMaXN0UmVmLiAqL1xuICBwcml2YXRlIF9oYW5kbGVFdmVudHMocmVmOiBEcm9wTGlzdFJlZjxDZGtEcm9wTGlzdD4pIHtcbiAgICByZWYuYmVmb3JlU3RhcnRlZC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgdGhpcy5fc3luY0l0ZW1zV2l0aFJlZigpO1xuICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgfSk7XG5cbiAgICByZWYuZW50ZXJlZC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgdGhpcy5lbnRlcmVkLmVtaXQoe1xuICAgICAgICBjb250YWluZXI6IHRoaXMsXG4gICAgICAgIGl0ZW06IGV2ZW50Lml0ZW0uZGF0YSxcbiAgICAgICAgY3VycmVudEluZGV4OiBldmVudC5jdXJyZW50SW5kZXhcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmVmLmV4aXRlZC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgdGhpcy5leGl0ZWQuZW1pdCh7XG4gICAgICAgIGNvbnRhaW5lcjogdGhpcyxcbiAgICAgICAgaXRlbTogZXZlbnQuaXRlbS5kYXRhXG4gICAgICB9KTtcbiAgICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICAgIH0pO1xuXG4gICAgcmVmLnNvcnRlZC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgdGhpcy5zb3J0ZWQuZW1pdCh7XG4gICAgICAgIHByZXZpb3VzSW5kZXg6IGV2ZW50LnByZXZpb3VzSW5kZXgsXG4gICAgICAgIGN1cnJlbnRJbmRleDogZXZlbnQuY3VycmVudEluZGV4LFxuICAgICAgICBjb250YWluZXI6IHRoaXMsXG4gICAgICAgIGl0ZW06IGV2ZW50Lml0ZW0uZGF0YVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZWYuZHJvcHBlZC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgdGhpcy5kcm9wcGVkLmVtaXQoe1xuICAgICAgICBwcmV2aW91c0luZGV4OiBldmVudC5wcmV2aW91c0luZGV4LFxuICAgICAgICBjdXJyZW50SW5kZXg6IGV2ZW50LmN1cnJlbnRJbmRleCxcbiAgICAgICAgcHJldmlvdXNDb250YWluZXI6IGV2ZW50LnByZXZpb3VzQ29udGFpbmVyLmRhdGEsXG4gICAgICAgIGNvbnRhaW5lcjogZXZlbnQuY29udGFpbmVyLmRhdGEsXG4gICAgICAgIGl0ZW06IGV2ZW50Lml0ZW0uZGF0YSxcbiAgICAgICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcjogZXZlbnQuaXNQb2ludGVyT3ZlckNvbnRhaW5lcixcbiAgICAgICAgZGlzdGFuY2U6IGV2ZW50LmRpc3RhbmNlXG4gICAgICB9KTtcblxuICAgICAgLy8gTWFyayBmb3IgY2hlY2sgc2luY2UgYWxsIG9mIHRoZXNlIGV2ZW50cyBydW4gb3V0c2lkZSBvZiBjaGFuZ2VcbiAgICAgIC8vIGRldGVjdGlvbiBhbmQgd2UncmUgbm90IGd1YXJhbnRlZWQgZm9yIHNvbWV0aGluZyBlbHNlIHRvIGhhdmUgdHJpZ2dlcmVkIGl0LlxuICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogQXNzaWducyB0aGUgZGVmYXVsdCBpbnB1dCB2YWx1ZXMgYmFzZWQgb24gYSBwcm92aWRlZCBjb25maWcgb2JqZWN0LiAqL1xuICBwcml2YXRlIF9hc3NpZ25EZWZhdWx0cyhjb25maWc6IERyYWdEcm9wQ29uZmlnKSB7XG4gICAgY29uc3Qge1xuICAgICAgbG9ja0F4aXMsIGRyYWdnaW5nRGlzYWJsZWQsIHNvcnRpbmdEaXNhYmxlZCwgbGlzdEF1dG9TY3JvbGxEaXNhYmxlZCwgbGlzdE9yaWVudGF0aW9uXG4gICAgfSA9IGNvbmZpZztcblxuICAgIHRoaXMuZGlzYWJsZWQgPSBkcmFnZ2luZ0Rpc2FibGVkID09IG51bGwgPyBmYWxzZSA6IGRyYWdnaW5nRGlzYWJsZWQ7XG4gICAgdGhpcy5zb3J0aW5nRGlzYWJsZWQgPSBzb3J0aW5nRGlzYWJsZWQgPT0gbnVsbCA/IGZhbHNlIDogc29ydGluZ0Rpc2FibGVkO1xuICAgIHRoaXMuYXV0b1Njcm9sbERpc2FibGVkID0gbGlzdEF1dG9TY3JvbGxEaXNhYmxlZCA9PSBudWxsID8gZmFsc2UgOiBsaXN0QXV0b1Njcm9sbERpc2FibGVkO1xuICAgIHRoaXMub3JpZW50YXRpb24gPSBsaXN0T3JpZW50YXRpb24gfHwgJ3ZlcnRpY2FsJztcblxuICAgIGlmIChsb2NrQXhpcykge1xuICAgICAgdGhpcy5sb2NrQXhpcyA9IGxvY2tBeGlzO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTeW5jcyB1cCB0aGUgcmVnaXN0ZXJlZCBkcmFnIGl0ZW1zIHdpdGggdW5kZXJseWluZyBkcm9wIGxpc3QgcmVmLiAqL1xuICBwcml2YXRlIF9zeW5jSXRlbXNXaXRoUmVmKCkge1xuICAgIHRoaXMuX2Ryb3BMaXN0UmVmLndpdGhJdGVtcyh0aGlzLmdldFNvcnRlZEl0ZW1zKCkubWFwKGl0ZW0gPT4gaXRlbS5fZHJhZ1JlZikpO1xuICB9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2Rpc2FibGVkOiBCb29sZWFuSW5wdXQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9zb3J0aW5nRGlzYWJsZWQ6IEJvb2xlYW5JbnB1dDtcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2F1dG9TY3JvbGxEaXNhYmxlZDogQm9vbGVhbklucHV0O1xufVxuIl19