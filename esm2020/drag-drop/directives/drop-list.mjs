/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { coerceArray, coerceNumberProperty, coerceBooleanProperty, } from '@angular/cdk/coercion';
import { ElementRef, EventEmitter, Input, Output, Optional, Directive, ChangeDetectorRef, SkipSelf, Inject, InjectionToken, } from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { ScrollDispatcher } from '@angular/cdk/scrolling';
import { CDK_DROP_LIST_GROUP, CdkDropListGroup } from './drop-list-group';
import { DragDrop } from '../drag-drop';
import { CDK_DRAG_CONFIG } from './config';
import { merge, Subject } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';
import { assertElementNode } from './assertions';
import * as i0 from "@angular/core";
import * as i1 from "../drag-drop";
import * as i2 from "@angular/cdk/scrolling";
import * as i3 from "@angular/cdk/bidi";
import * as i4 from "./drop-list-group";
/** Counter used to generate unique ids for drop zones. */
let _uniqueIdCounter = 0;
/**
 * Injection token that can be used to reference instances of `CdkDropList`. It serves as
 * alternative token to the actual `CdkDropList` class which could cause unnecessary
 * retention of the class and its directive metadata.
 */
export const CDK_DROP_LIST = new InjectionToken('CdkDropList');
/** Container that wraps a set of draggable items. */
export class CdkDropList {
    constructor(
    /** Element that the drop list is attached to. */
    element, dragDrop, _changeDetectorRef, _scrollDispatcher, _dir, _group, config) {
        this.element = element;
        this._changeDetectorRef = _changeDetectorRef;
        this._scrollDispatcher = _scrollDispatcher;
        this._dir = _dir;
        this._group = _group;
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
        /** Functions that is used to determine whether an item can be sorted into a particular index. */
        this.sortPredicate = () => true;
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
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            assertElementNode(element.nativeElement, 'cdkDropList');
        }
        this._dropListRef = dragDrop.createDropList(element);
        this._dropListRef.data = this;
        if (config) {
            this._assignDefaults(config);
        }
        this._dropListRef.enterPredicate = (drag, drop) => {
            return this.enterPredicate(drag.data, drop.data);
        };
        this._dropListRef.sortPredicate = (index, drag, drop) => {
            return this.sortPredicate(index, drag.data, drop.data);
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
            const documentPosition = a._dragRef
                .getVisibleElement()
                .compareDocumentPosition(b._dragRef.getVisibleElement());
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
                if (typeof drop === 'string') {
                    const correspondingDropList = CdkDropList._dropLists.find(list => list.id === drop);
                    if (!correspondingDropList && (typeof ngDevMode === 'undefined' || ngDevMode)) {
                        console.warn(`CdkDropList could not find connected drop list with id "${drop}"`);
                    }
                    return correspondingDropList;
                }
                return drop;
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
            if (!this._scrollableParentsResolved) {
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
            ref.autoScrollStep = coerceNumberProperty(this.autoScrollStep, 2);
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
                currentIndex: event.currentIndex,
            });
        });
        ref.exited.subscribe(event => {
            this.exited.emit({
                container: this,
                item: event.item.data,
            });
            this._changeDetectorRef.markForCheck();
        });
        ref.sorted.subscribe(event => {
            this.sorted.emit({
                previousIndex: event.previousIndex,
                currentIndex: event.currentIndex,
                container: this,
                item: event.item.data,
            });
        });
        ref.dropped.subscribe(dropEvent => {
            this.dropped.emit({
                previousIndex: dropEvent.previousIndex,
                currentIndex: dropEvent.currentIndex,
                previousContainer: dropEvent.previousContainer.data,
                container: dropEvent.container.data,
                item: dropEvent.item.data,
                isPointerOverContainer: dropEvent.isPointerOverContainer,
                distance: dropEvent.distance,
                dropPoint: dropEvent.dropPoint,
                event: dropEvent.event,
            });
            // Mark for check since all of these events run outside of change
            // detection and we're not guaranteed for something else to have triggered it.
            this._changeDetectorRef.markForCheck();
        });
        merge(ref.receivingStarted, ref.receivingStopped).subscribe(() => this._changeDetectorRef.markForCheck());
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
CdkDropList.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.0.0", ngImport: i0, type: CdkDropList, deps: [{ token: i0.ElementRef }, { token: i1.DragDrop }, { token: i0.ChangeDetectorRef }, { token: i2.ScrollDispatcher }, { token: i3.Directionality, optional: true }, { token: CDK_DROP_LIST_GROUP, optional: true, skipSelf: true }, { token: CDK_DRAG_CONFIG, optional: true }], target: i0.ɵɵFactoryTarget.Directive });
CdkDropList.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "15.0.0", type: CdkDropList, isStandalone: true, selector: "[cdkDropList], cdk-drop-list", inputs: { connectedTo: ["cdkDropListConnectedTo", "connectedTo"], data: ["cdkDropListData", "data"], orientation: ["cdkDropListOrientation", "orientation"], id: "id", lockAxis: ["cdkDropListLockAxis", "lockAxis"], disabled: ["cdkDropListDisabled", "disabled"], sortingDisabled: ["cdkDropListSortingDisabled", "sortingDisabled"], enterPredicate: ["cdkDropListEnterPredicate", "enterPredicate"], sortPredicate: ["cdkDropListSortPredicate", "sortPredicate"], autoScrollDisabled: ["cdkDropListAutoScrollDisabled", "autoScrollDisabled"], autoScrollStep: ["cdkDropListAutoScrollStep", "autoScrollStep"] }, outputs: { dropped: "cdkDropListDropped", entered: "cdkDropListEntered", exited: "cdkDropListExited", sorted: "cdkDropListSorted" }, host: { properties: { "attr.id": "id", "class.cdk-drop-list-disabled": "disabled", "class.cdk-drop-list-dragging": "_dropListRef.isDragging()", "class.cdk-drop-list-receiving": "_dropListRef.isReceiving()" }, classAttribute: "cdk-drop-list" }, providers: [
        // Prevent child drop lists from picking up the same group as their parent.
        { provide: CDK_DROP_LIST_GROUP, useValue: undefined },
        { provide: CDK_DROP_LIST, useExisting: CdkDropList },
    ], exportAs: ["cdkDropList"], ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.0.0", ngImport: i0, type: CdkDropList, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkDropList], cdk-drop-list',
                    exportAs: 'cdkDropList',
                    standalone: true,
                    providers: [
                        // Prevent child drop lists from picking up the same group as their parent.
                        { provide: CDK_DROP_LIST_GROUP, useValue: undefined },
                        { provide: CDK_DROP_LIST, useExisting: CdkDropList },
                    ],
                    host: {
                        'class': 'cdk-drop-list',
                        '[attr.id]': 'id',
                        '[class.cdk-drop-list-disabled]': 'disabled',
                        '[class.cdk-drop-list-dragging]': '_dropListRef.isDragging()',
                        '[class.cdk-drop-list-receiving]': '_dropListRef.isReceiving()',
                    },
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i1.DragDrop }, { type: i0.ChangeDetectorRef }, { type: i2.ScrollDispatcher }, { type: i3.Directionality, decorators: [{
                    type: Optional
                }] }, { type: i4.CdkDropListGroup, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [CDK_DROP_LIST_GROUP]
                }, {
                    type: SkipSelf
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [CDK_DRAG_CONFIG]
                }] }]; }, propDecorators: { connectedTo: [{
                type: Input,
                args: ['cdkDropListConnectedTo']
            }], data: [{
                type: Input,
                args: ['cdkDropListData']
            }], orientation: [{
                type: Input,
                args: ['cdkDropListOrientation']
            }], id: [{
                type: Input
            }], lockAxis: [{
                type: Input,
                args: ['cdkDropListLockAxis']
            }], disabled: [{
                type: Input,
                args: ['cdkDropListDisabled']
            }], sortingDisabled: [{
                type: Input,
                args: ['cdkDropListSortingDisabled']
            }], enterPredicate: [{
                type: Input,
                args: ['cdkDropListEnterPredicate']
            }], sortPredicate: [{
                type: Input,
                args: ['cdkDropListSortPredicate']
            }], autoScrollDisabled: [{
                type: Input,
                args: ['cdkDropListAutoScrollDisabled']
            }], autoScrollStep: [{
                type: Input,
                args: ['cdkDropListAutoScrollStep']
            }], dropped: [{
                type: Output,
                args: ['cdkDropListDropped']
            }], entered: [{
                type: Output,
                args: ['cdkDropListEntered']
            }], exited: [{
                type: Output,
                args: ['cdkDropListExited']
            }], sorted: [{
                type: Output,
                args: ['cdkDropListSorted']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZGlyZWN0aXZlcy9kcm9wLWxpc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUVMLFdBQVcsRUFDWCxvQkFBb0IsRUFDcEIscUJBQXFCLEdBRXRCLE1BQU0sdUJBQXVCLENBQUM7QUFDL0IsT0FBTyxFQUNMLFVBQVUsRUFDVixZQUFZLEVBQ1osS0FBSyxFQUVMLE1BQU0sRUFDTixRQUFRLEVBQ1IsU0FBUyxFQUNULGlCQUFpQixFQUNqQixRQUFRLEVBQ1IsTUFBTSxFQUNOLGNBQWMsR0FDZixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFHeEQsT0FBTyxFQUFDLG1CQUFtQixFQUFFLGdCQUFnQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFHeEUsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUN0QyxPQUFPLEVBQWdELGVBQWUsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN4RixPQUFPLEVBQUMsS0FBSyxFQUFFLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUNwQyxPQUFPLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGNBQWMsQ0FBQzs7Ozs7O0FBRS9DLDBEQUEwRDtBQUMxRCxJQUFJLGdCQUFnQixHQUFHLENBQUMsQ0FBQztBQVN6Qjs7OztHQUlHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sYUFBYSxHQUFHLElBQUksY0FBYyxDQUFjLGFBQWEsQ0FBQyxDQUFDO0FBRTVFLHFEQUFxRDtBQWtCckQsTUFBTSxPQUFPLFdB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ZTtzQkFEZCxLQUFLO3VCQUFDLDRCQUE0QjtnQkFRbkMsY0FBYztzQkFEYixLQUFLO3VCQUFDLDJCQUEyQjtnQkFLbEMsYUFBYTtzQkFEWixLQUFLO3VCQUFDLDBCQUEwQjtnQkFLakMsa0JBQWtCO3NCQURqQixLQUFLO3VCQUFDLCtCQUErQjtnQkFLdEMsY0FBYztzQkFEYixLQUFLO3VCQUFDLDJCQUEyQjtnQkFLekIsT0FBTztzQkFEZixNQUFNO3VCQUFDLG9CQUFvQjtnQkFPbkIsT0FBTztzQkFEZixNQUFNO3VCQUFDLG9CQUFvQjtnQkFRbkIsTUFBTTtzQkFEZCxNQUFNO3VCQUFDLG1CQUFtQjtnQkFLbEIsTUFBTTtzQkFEZCxNQUFNO3VCQUFDLG1CQUFtQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBCb29sZWFuSW5wdXQsXG4gIGNvZXJjZUFycmF5LFxuICBjb2VyY2VOdW1iZXJQcm9wZXJ0eSxcbiAgY29lcmNlQm9vbGVhblByb3BlcnR5LFxuICBOdW1iZXJJbnB1dCxcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7XG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5wdXQsXG4gIE9uRGVzdHJveSxcbiAgT3V0cHV0LFxuICBPcHRpb25hbCxcbiAgRGlyZWN0aXZlLFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgU2tpcFNlbGYsXG4gIEluamVjdCxcbiAgSW5qZWN0aW9uVG9rZW4sXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtTY3JvbGxEaXNwYXRjaGVyfSBmcm9tICdAYW5ndWxhci9jZGsvc2Nyb2xsaW5nJztcbmltcG9ydCB7Q2RrRHJhZ30gZnJvbSAnLi9kcmFnJztcbmltcG9ydCB7Q2RrRHJhZ0Ryb3AsIENka0RyYWdFbnRlciwgQ2RrRHJhZ0V4aXQsIENka0RyYWdTb3J0RXZlbnR9IGZyb20gJy4uL2RyYWctZXZlbnRzJztcbmltcG9ydCB7Q0RLX0RST1BfTElTVF9HUk9VUCwgQ2RrRHJvcExpc3RHcm91cH0gZnJvbSAnLi9kcm9wLWxpc3QtZ3JvdXAnO1xuaW1wb3J0IHtEcm9wTGlzdFJlZn0gZnJvbSAnLi4vZHJvcC1saXN0LXJlZic7XG5pbXBvcnQge0RyYWdSZWZ9IGZyb20gJy4uL2RyYWctcmVmJztcbmltcG9ydCB7RHJhZ0Ryb3B9IGZyb20gJy4uL2RyYWctZHJvcCc7XG5pbXBvcnQge0Ryb3BMaXN0T3JpZW50YXRpb24sIERyYWdBeGlzLCBEcmFnRHJvcENvbmZpZywgQ0RLX0RSQUdfQ09ORklHfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQge21lcmdlLCBTdWJqZWN0fSBmcm9tICdyeGpzJztcbmltcG9ydCB7c3RhcnRXaXRoLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7YXNzZXJ0RWxlbWVudE5vZGV9IGZyb20gJy4vYXNzZXJ0aW9ucyc7XG5cbi8qKiBDb3VudGVyIHVzZWQgdG8gZ2VuZXJhdGUgdW5pcXVlIGlkcyBmb3IgZHJvcCB6b25lcy4gKi9cbmxldCBfdW5pcXVlSWRDb3VudGVyID0gMDtcblxuLyoqXG4gKiBJbnRlcm5hbCBjb21waWxlLXRpbWUtb25seSByZXByZXNlbnRhdGlvbiBvZiBhIGBDZGtEcm9wTGlzdGAuXG4gKiBVc2VkIHRvIGF2b2lkIGNpcmN1bGFyIGltcG9ydCBpc3N1ZXMgYmV0d2VlbiB0aGUgYENka0Ryb3BMaXN0YCBhbmQgdGhlIGBDZGtEcmFnYC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDZGtEcm9wTGlzdEludGVybmFsIGV4dGVuZHMgQ2RrRHJvcExpc3Qge31cblxuLyoqXG4gKiBJbmplY3Rpb24gdG9rZW4gdGhhdCBjYW4gYmUgdXNlZCB0byByZWZlcmVuY2UgaW5zdGFuY2VzIG9mIGBDZGtEcm9wTGlzdGAuIEl0IHNlcnZlcyBhc1xuICogYWx0ZXJuYXRpdmUgdG9rZW4gdG8gdGhlIGFjdHVhbCBgQ2RrRHJvcExpc3RgIGNsYXNzIHdoaWNoIGNvdWxkIGNhdXNlIHVubmVjZXNzYXJ5XG4gKiByZXRlbnRpb24gb2YgdGhlIGNsYXNzIGFuZCBpdHMgZGlyZWN0aXZlIG1ldGFkYXRhLlxuICovXG5leHBvcnQgY29uc3QgQ0RLX0RST1BfTElTVCA9IG5ldyBJbmplY3Rpb25Ub2tlbjxDZGtEcm9wTGlzdD4oJ0Nka0Ryb3BMaXN0Jyk7XG5cbi8qKiBDb250YWluZXIgdGhhdCB3cmFwcyBhIHNldCBvZiBkcmFnZ2FibGUgaXRlbXMuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrRHJvcExpc3RdLCBjZGstZHJvcC1saXN0JyxcbiAgZXhwb3J0QXM6ICdjZGtEcm9wTGlzdCcsXG4gIHN0YW5kYWxvbmU6IHRydWUsXG4gIHByb3ZpZGVyczogW1xuICAgIC8vIFByZXZlbnQgY2hpbGQgZHJvcCBsaXN0cyBmcm9tIHBpY2tpbmcgdXAgdGhlIHNhbWUgZ3JvdXAgYXMgdGhlaXIgcGFyZW50LlxuICAgIHtwcm92aWRlOiBDREtfRFJPUF9MSVNUX0dST1VQLCB1c2VWYWx1ZTogdW5kZWZpbmVkfSxcbiAgICB7cHJvdmlkZTogQ0RLX0RST1BfTElTVCwgdXNlRXhpc3Rpbmc6IENka0Ryb3BMaXN0fSxcbiAgXSxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstZHJvcC1saXN0JyxcbiAgICAnW2F0dHIuaWRdJzogJ2lkJyxcbiAgICAnW2NsYXNzLmNkay1kcm9wLWxpc3QtZGlzYWJsZWRdJzogJ2Rpc2FibGVkJyxcbiAgICAnW2NsYXNzLmNkay1kcm9wLWxpc3QtZHJhZ2dpbmddJzogJ19kcm9wTGlzdFJlZi5pc0RyYWdnaW5nKCknLFxuICAgICdbY2xhc3MuY2RrLWRyb3AtbGlzdC1yZWNlaXZpbmddJzogJ19kcm9wTGlzdFJlZi5pc1JlY2VpdmluZygpJyxcbiAgfSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrRHJvcExpc3Q8VCA9IGFueT4gaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogRW1pdHMgd2hlbiB0aGUgbGlzdCBoYXMgYmVlbiBkZXN0cm95ZWQuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX2Rlc3Ryb3llZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGVsZW1lbnQncyBzY3JvbGxhYmxlIHBhcmVudHMgaGF2ZSBiZWVuIHJlc29sdmVkLiAqL1xuICBwcml2YXRlIF9zY3JvbGxhYmxlUGFyZW50c1Jlc29sdmVkOiBib29sZWFuO1xuXG4gIC8qKiBLZWVwcyB0cmFjayBvZiB0aGUgZHJvcCBsaXN0cyB0aGF0IGFyZSBjdXJyZW50bHkgb24gdGhlIHBhZ2UuICovXG4gIHByaXZhdGUgc3RhdGljIF9kcm9wTGlzdHM6IENka0Ryb3BMaXN0W10gPSBbXTtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSB1bmRlcmx5aW5nIGRyb3AgbGlzdCBpbnN0YW5jZS4gKi9cbiAgX2Ryb3BMaXN0UmVmOiBEcm9wTGlzdFJlZjxDZGtEcm9wTGlzdDxUPj47XG5cbiAgLyoqXG4gICAqIE90aGVyIGRyYWdnYWJsZSBjb250YWluZXJzIHRoYXQgdGhpcyBjb250YWluZXIgaXMgY29ubmVjdGVkIHRvIGFuZCBpbnRvIHdoaWNoIHRoZVxuICAgKiBjb250YWluZXIncyBpdGVtcyBjYW4gYmUgdHJhbnNmZXJyZWQuIENhbiBlaXRoZXIgYmUgcmVmZXJlbmNlcyB0byBvdGhlciBkcm9wIGNvbnRhaW5lcnMsXG4gICAqIG9yIHRoZWlyIHVuaXF1ZSBJRHMuXG4gICAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0Q29ubmVjdGVkVG8nKVxuICBjb25uZWN0ZWRUbzogKENka0Ryb3BMaXN0IHwgc3RyaW5nKVtdIHwgQ2RrRHJvcExpc3QgfCBzdHJpbmcgPSBbXTtcblxuICAvKiogQXJiaXRyYXJ5IGRhdGEgdG8gYXR0YWNoIHRvIHRoaXMgY29udGFpbmVyLiAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0RGF0YScpIGRhdGE6IFQ7XG5cbiAgLyoqIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgbGlzdCBpcyBvcmllbnRlZC4gKi9cbiAgQElucHV0KCdjZGtEcm9wTGlzdE9yaWVudGF0aW9uJykgb3JpZW50YXRpb246IERyb3BMaXN0T3JpZW50YXRpb247XG5cbiAgLyoqXG4gICAqIFVuaXF1ZSBJRCBmb3IgdGhlIGRyb3Agem9uZS4gQ2FuIGJlIHVzZWQgYXMgYSByZWZlcmVuY2VcbiAgICogaW4gdGhlIGBjb25uZWN0ZWRUb2Agb2YgYW5vdGhlciBgQ2RrRHJvcExpc3RgLlxuICAgKi9cbiAgQElucHV0KCkgaWQ6IHN0cmluZyA9IGBjZGstZHJvcC1saXN0LSR7X3VuaXF1ZUlkQ291bnRlcisrfWA7XG5cbiAgLyoqIExvY2tzIHRoZSBwb3NpdGlvbiBvZiB0aGUgZHJhZ2dhYmxlIGVsZW1lbnRzIGluc2lkZSB0aGUgY29udGFpbmVyIGFsb25nIHRoZSBzcGVjaWZpZWQgYXhpcy4gKi9cbiAgQElucHV0KCdjZGtEcm9wTGlzdExvY2tBeGlzJykgbG9ja0F4aXM6IERyYWdBeGlzO1xuXG4gIC8qKiBXaGV0aGVyIHN0YXJ0aW5nIGEgZHJhZ2dpbmcgc2VxdWVuY2UgZnJvbSB0aGlzIGNvbnRhaW5lciBpcyBkaXNhYmxlZC4gKi9cbiAgQElucHV0KCdjZGtEcm9wTGlzdERpc2FibGVkJylcbiAgZ2V0IGRpc2FibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9kaXNhYmxlZCB8fCAoISF0aGlzLl9ncm91cCAmJiB0aGlzLl9ncm91cC5kaXNhYmxlZCk7XG4gIH1cbiAgc2V0IGRpc2FibGVkKHZhbHVlOiBCb29sZWFuSW5wdXQpIHtcbiAgICAvLyBVc3VhbGx5IHdlIHN5bmMgdGhlIGRpcmVjdGl2ZSBhbmQgcmVmIHN0YXRlIHJpZ2h0IGJlZm9yZSBkcmFnZ2luZyBzdGFydHMsIGluIG9yZGVyIHRvIGhhdmVcbiAgICAvLyBhIHNpbmdsZSBwb2ludCBvZiBmYWlsdXJlIGFuZCB0byBhdm9pZCBoYXZpbmcgdG8gdXNlIHNldHRlcnMgZm9yIGV2ZXJ5dGhpbmcuIGBkaXNhYmxlZGAgaXNcbiAgICAvLyBhIHNwZWNpYWwgY2FzZSwgYmVjYXVzZSBpdCBjYW4gcHJldmVudCB0aGUgYGJlZm9yZVN0YXJ0ZWRgIGV2ZW50IGZyb20gZmlyaW5nLCB3aGljaCBjYW4gbG9ja1xuICAgIC8vIHRoZSB1c2VyIGluIGEgZGlzYWJsZWQgc3RhdGUsIHNvIHdlIGFsc28gbmVlZCB0byBzeW5jIGl0IGFzIGl0J3MgYmVpbmcgc2V0LlxuICAgIHRoaXMuX2Ryb3BMaXN0UmVmLmRpc2FibGVkID0gdGhpcy5fZGlzYWJsZWQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG4gIHByaXZhdGUgX2Rpc2FibGVkOiBib29sZWFuO1xuXG4gIC8qKiBXaGV0aGVyIHNvcnRpbmcgd2l0aGluIHRoaXMgZHJvcCBsaXN0IGlzIGRpc2FibGVkLiAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0U29ydGluZ0Rpc2FibGVkJylcbiAgc29ydGluZ0Rpc2FibGVkOiBCb29sZWFuSW5wdXQ7XG5cbiAgLyoqXG4gICAqIEZ1bmN0aW9uIHRoYXQgaXMgdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBhbiBpdGVtXG4gICAqIGlzIGFsbG93ZWQgdG8gYmUgbW92ZWQgaW50byBhIGRyb3AgY29udGFpbmVyLlxuICAgKi9cbiAgQElucHV0KCdjZGtEcm9wTGlzdEVudGVyUHJlZGljYXRlJylcbiAgZW50ZXJQcmVkaWNhdGU6IChkcmFnOiBDZGtEcmFnLCBkcm9wOiBDZGtEcm9wTGlzdCkgPT4gYm9vbGVhbiA9ICgpID0+IHRydWU7XG5cbiAgLyoqIEZ1bmN0aW9ucyB0aGF0IGlzIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYW4gaXRlbSBjYW4gYmUgc29ydGVkIGludG8gYSBwYXJ0aWN1bGFyIGluZGV4LiAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0U29ydFByZWRpY2F0ZScpXG4gIHNvcnRQcmVkaWNhdGU6IChpbmRleDogbnVtYmVyLCBkcmFnOiBDZGtEcmFnLCBkcm9wOiBDZGtEcm9wTGlzdCkgPT4gYm9vbGVhbiA9ICgpID0+IHRydWU7XG5cbiAgLyoqIFdoZXRoZXIgdG8gYXV0by1zY3JvbGwgdGhlIHZpZXcgd2hlbiB0aGUgdXNlciBtb3ZlcyB0aGVpciBwb2ludGVyIGNsb3NlIHRvIHRoZSBlZGdlcy4gKi9cbiAgQElucHV0KCdjZGtEcm9wTGlzdEF1dG9TY3JvbGxEaXNhYmxlZCcpXG4gIGF1dG9TY3JvbGxEaXNhYmxlZDogQm9vbGVhbklucHV0O1xuXG4gIC8qKiBOdW1iZXIgb2YgcGl4ZWxzIHRvIHNjcm9sbCBmb3IgZWFjaCBmcmFtZSB3aGVuIGF1dG8tc2Nyb2xsaW5nIGFuIGVsZW1lbnQuICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3RBdXRvU2Nyb2xsU3RlcCcpXG4gIGF1dG9TY3JvbGxTdGVwOiBOdW1iZXJJbnB1dDtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBkcm9wcyBhbiBpdGVtIGluc2lkZSB0aGUgY29udGFpbmVyLiAqL1xuICBAT3V0cHV0KCdjZGtEcm9wTGlzdERyb3BwZWQnKVxuICByZWFkb25seSBkcm9wcGVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0Ryb3A8VCwgYW55Pj4gPSBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdEcm9wPFQsIGFueT4+KCk7XG5cbiAgLyoqXG4gICAqIEVtaXRzIHdoZW4gdGhlIHVzZXIgaGFzIG1vdmVkIGEgbmV3IGRyYWcgaXRlbSBpbnRvIHRoaXMgY29udGFpbmVyLlxuICAgKi9cbiAgQE91dHB1dCgnY2RrRHJvcExpc3RFbnRlcmVkJylcbiAgcmVhZG9ubHkgZW50ZXJlZDogRXZlbnRFbWl0dGVyPENka0RyYWdFbnRlcjxUPj4gPSBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdFbnRlcjxUPj4oKTtcblxuICAvKipcbiAgICogRW1pdHMgd2hlbiB0aGUgdXNlciByZW1vdmVzIGFuIGl0ZW0gZnJvbSB0aGUgY29udGFpbmVyXG4gICAqIGJ5IGRyYWdnaW5nIGl0IGludG8gYW5vdGhlciBjb250YWluZXIuXG4gICAqL1xuICBAT3V0cHV0KCdjZGtEcm9wTGlzdEV4aXRlZCcpXG4gIHJlYWRvbmx5IGV4aXRlZDogRXZlbnRFbWl0dGVyPENka0RyYWdFeGl0PFQ+PiA9IG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0V4aXQ8VD4+KCk7XG5cbiAgLyoqIEVtaXRzIGFzIHRoZSB1c2VyIGlzIHN3YXBwaW5nIGl0ZW1zIHdoaWxlIGFjdGl2ZWx5IGRyYWdnaW5nLiAqL1xuICBAT3V0cHV0KCdjZGtEcm9wTGlzdFNvcnRlZCcpXG4gIHJlYWRvbmx5IHNvcnRlZDogRXZlbnRFbWl0dGVyPENka0RyYWdTb3J0RXZlbnQ8VD4+ID0gbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnU29ydEV2ZW50PFQ+PigpO1xuXG4gIC8qKlxuICAgKiBLZWVwcyB0cmFjayBvZiB0aGUgaXRlbXMgdGhhdCBhcmUgcmVnaXN0ZXJlZCB3aXRoIHRoaXMgY29udGFpbmVyLiBIaXN0b3JpY2FsbHkgd2UgdXNlZCB0b1xuICAgKiBkbyB0aGlzIHdpdGggYSBgQ29udGVudENoaWxkcmVuYCBxdWVyeSwgaG93ZXZlciBxdWVyaWVzIGRvbid0IGhhbmRsZSB0cmFuc3BsYW50ZWQgdmlld3MgdmVyeVxuICAgKiB3ZWxsIHdoaWNoIG1lYW5zIHRoYXQgd2UgY2FuJ3QgaGFuZGxlIGNhc2VzIGxpa2UgZHJhZ2dpbmcgdGhlIGhlYWRlcnMgb2YgYSBgbWF0LXRhYmxlYFxuICAgKiBjb3JyZWN0bHkuIFdoYXQgd2UgZG8gaW5zdGVhZCBpcyB0byBoYXZlIHRoZSBpdGVtcyByZWdpc3RlciB0aGVtc2VsdmVzIHdpdGggdGhlIGNvbnRhaW5lclxuICAgKiBhbmQgdGhlbiB3ZSBzb3J0IHRoZW0gYmFzZWQgb24gdGhlaXIgcG9zaXRpb24gaW4gdGhlIERPTS5cbiAgICovXG4gIHByaXZhdGUgX3Vuc29ydGVkSXRlbXMgPSBuZXcgU2V0PENka0RyYWc+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgLyoqIEVsZW1lbnQgdGhhdCB0aGUgZHJvcCBsaXN0IGlzIGF0dGFjaGVkIHRvLiAqL1xuICAgIHB1YmxpYyBlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICBkcmFnRHJvcDogRHJhZ0Ryb3AsXG4gICAgcHJpdmF0ZSBfY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmLFxuICAgIHByaXZhdGUgX3Njcm9sbERpc3BhdGNoZXI6IFNjcm9sbERpc3BhdGNoZXIsXG4gICAgQE9wdGlvbmFsKCkgcHJpdmF0ZSBfZGlyPzogRGlyZWN0aW9uYWxpdHksXG4gICAgQE9wdGlvbmFsKClcbiAgICBASW5qZWN0KENES19EUk9QX0xJU1RfR1JPVVApXG4gICAgQFNraXBTZWxmKClcbiAgICBwcml2YXRlIF9ncm91cD86IENka0Ryb3BMaXN0R3JvdXA8Q2RrRHJvcExpc3Q+LFxuICAgIEBPcHRpb25hbCgpIEBJbmplY3QoQ0RLX0RSQUdfQ09ORklHKSBjb25maWc/OiBEcmFnRHJvcENvbmZpZyxcbiAgKSB7XG4gICAgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkge1xuICAgICAgYXNzZXJ0RWxlbWVudE5vZGUoZWxlbWVudC5uYXRpdmVFbGVtZW50LCAnY2RrRHJvcExpc3QnKTtcbiAgICB9XG5cbiAgICB0aGlzLl9kcm9wTGlzdFJlZiA9IGRyYWdEcm9wLmNyZWF0ZURyb3BMaXN0KGVsZW1lbnQpO1xuICAgIHRoaXMuX2Ryb3BMaXN0UmVmLmRhdGEgPSB0aGlzO1xuXG4gICAgaWYgKGNvbmZpZykge1xuICAgICAgdGhpcy5fYXNzaWduRGVmYXVsdHMoY29uZmlnKTtcbiAgICB9XG5cbiAgICB0aGlzLl9kcm9wTGlzdFJlZi5lbnRlclByZWRpY2F0ZSA9IChkcmFnOiBEcmFnUmVmPENka0RyYWc+LCBkcm9wOiBEcm9wTGlzdFJlZjxDZGtEcm9wTGlzdD4pID0+IHtcbiAgICAgIHJldHVybiB0aGlzLmVudGVyUHJlZGljYXRlKGRyYWcuZGF0YSwgZHJvcC5kYXRhKTtcbiAgICB9O1xuXG4gICAgdGhpcy5fZHJvcExpc3RSZWYuc29ydFByZWRpY2F0ZSA9IChcbiAgICAgIGluZGV4OiBudW1iZXIsXG4gICAgICBkcmFnOiBEcmFnUmVmPENka0RyYWc+LFxuICAgICAgZHJvcDogRHJvcExpc3RSZWY8Q2RrRHJvcExpc3Q+LFxuICAgICkgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMuc29ydFByZWRpY2F0ZShpbmRleCwgZHJhZy5kYXRhLCBkcm9wLmRhdGEpO1xuICAgIH07XG5cbiAgICB0aGlzLl9zZXR1cElucHV0U3luY1N1YnNjcmlwdGlvbih0aGlzLl9kcm9wTGlzdFJlZik7XG4gICAgdGhpcy5faGFuZGxlRXZlbnRzKHRoaXMuX2Ryb3BMaXN0UmVmKTtcbiAgICBDZGtEcm9wTGlzdC5fZHJvcExpc3RzLnB1c2godGhpcyk7XG5cbiAgICBpZiAoX2dyb3VwKSB7XG4gICAgICBfZ3JvdXAuX2l0ZW1zLmFkZCh0aGlzKTtcbiAgICB9XG4gIH1cblxuICAvKiogUmVnaXN0ZXJzIGFuIGl0ZW1zIHdpdGggdGhlIGRyb3AgbGlzdC4gKi9cbiAgYWRkSXRlbShpdGVtOiBDZGtEcmFnKTogdm9pZCB7XG4gICAgdGhpcy5fdW5zb3J0ZWRJdGVtcy5hZGQoaXRlbSk7XG5cbiAgICBpZiAodGhpcy5fZHJvcExpc3RSZWYuaXNEcmFnZ2luZygpKSB7XG4gICAgICB0aGlzLl9zeW5jSXRlbXNXaXRoUmVmKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFJlbW92ZXMgYW4gaXRlbSBmcm9tIHRoZSBkcm9wIGxpc3QuICovXG4gIHJlbW92ZUl0ZW0oaXRlbTogQ2RrRHJhZyk6IHZvaWQge1xuICAgIHRoaXMuX3Vuc29ydGVkSXRlbXMuZGVsZXRlKGl0ZW0pO1xuXG4gICAgaWYgKHRoaXMuX2Ryb3BMaXN0UmVmLmlzRHJhZ2dpbmcoKSkge1xuICAgICAgdGhpcy5fc3luY0l0ZW1zV2l0aFJlZigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSByZWdpc3RlcmVkIGl0ZW1zIGluIHRoZSBsaXN0LCBzb3J0ZWQgYnkgdGhlaXIgcG9zaXRpb24gaW4gdGhlIERPTS4gKi9cbiAgZ2V0U29ydGVkSXRlbXMoKTogQ2RrRHJhZ1tdIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLl91bnNvcnRlZEl0ZW1zKS5zb3J0KChhOiBDZGtEcmFnLCBiOiBDZGtEcmFnKSA9PiB7XG4gICAgICBjb25zdCBkb2N1bWVudFBvc2l0aW9uID0gYS5fZHJhZ1JlZlxuICAgICAgICAuZ2V0VmlzaWJsZUVsZW1lbnQoKVxuICAgICAgICAuY29tcGFyZURvY3VtZW50UG9zaXRpb24oYi5fZHJhZ1JlZi5nZXRWaXNpYmxlRWxlbWVudCgpKTtcblxuICAgICAgLy8gYGNvbXBhcmVEb2N1bWVudFBvc2l0aW9uYCByZXR1cm5zIGEgYml0bWFzayBzbyB3ZSBoYXZlIHRvIHVzZSBhIGJpdHdpc2Ugb3BlcmF0b3IuXG4gICAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvTm9kZS9jb21wYXJlRG9jdW1lbnRQb3NpdGlvblxuICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWJpdHdpc2VcbiAgICAgIHJldHVybiBkb2N1bWVudFBvc2l0aW9uICYgTm9kZS5ET0NVTUVOVF9QT1NJVElPTl9GT0xMT1dJTkcgPyAtMSA6IDE7XG4gICAgfSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBjb25zdCBpbmRleCA9IENka0Ryb3BMaXN0Ll9kcm9wTGlzdHMuaW5kZXhPZih0aGlzKTtcblxuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICBDZGtEcm9wTGlzdC5fZHJvcExpc3RzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2dyb3VwKSB7XG4gICAgICB0aGlzLl9ncm91cC5faXRlbXMuZGVsZXRlKHRoaXMpO1xuICAgIH1cblxuICAgIHRoaXMuX3Vuc29ydGVkSXRlbXMuY2xlYXIoKTtcbiAgICB0aGlzLl9kcm9wTGlzdFJlZi5kaXNwb3NlKCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKiBTeW5jcyB0aGUgaW5wdXRzIG9mIHRoZSBDZGtEcm9wTGlzdCB3aXRoIHRoZSBvcHRpb25zIG9mIHRoZSB1bmRlcmx5aW5nIERyb3BMaXN0UmVmLiAqL1xuICBwcml2YXRlIF9zZXR1cElucHV0U3luY1N1YnNjcmlwdGlvbihyZWY6IERyb3BMaXN0UmVmPENka0Ryb3BMaXN0Pikge1xuICAgIGlmICh0aGlzLl9kaXIpIHtcbiAgICAgIHRoaXMuX2Rpci5jaGFuZ2VcbiAgICAgICAgLnBpcGUoc3RhcnRXaXRoKHRoaXMuX2Rpci52YWx1ZSksIHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpKVxuICAgICAgICAuc3Vic2NyaWJlKHZhbHVlID0+IHJlZi53aXRoRGlyZWN0aW9uKHZhbHVlKSk7XG4gICAgfVxuXG4gICAgcmVmLmJlZm9yZVN0YXJ0ZWQuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIGNvbnN0IHNpYmxpbmdzID0gY29lcmNlQXJyYXkodGhpcy5jb25uZWN0ZWRUbykubWFwKGRyb3AgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIGRyb3AgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgY29uc3QgY29ycmVzcG9uZGluZ0Ryb3BMaXN0ID0gQ2RrRHJvcExpc3QuX2Ryb3BMaXN0cy5maW5kKGxpc3QgPT4gbGlzdC5pZCA9PT0gZHJvcCk7XG5cbiAgICAgICAgICBpZiAoIWNvcnJlc3BvbmRpbmdEcm9wTGlzdCAmJiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBDZGtEcm9wTGlzdCBjb3VsZCBub3QgZmluZCBjb25uZWN0ZWQgZHJvcCBsaXN0IHdpdGggaWQgXCIke2Ryb3B9XCJgKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gY29ycmVzcG9uZGluZ0Ryb3BMaXN0ITtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkcm9wO1xuICAgICAgfSk7XG5cbiAgICAgIGlmICh0aGlzLl9ncm91cCkge1xuICAgICAgICB0aGlzLl9ncm91cC5faXRlbXMuZm9yRWFjaChkcm9wID0+IHtcbiAgICAgICAgICBpZiAoc2libGluZ3MuaW5kZXhPZihkcm9wKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHNpYmxpbmdzLnB1c2goZHJvcCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gTm90ZSB0aGF0IHdlIHJlc29sdmUgdGhlIHNjcm9sbGFibGUgcGFyZW50cyBoZXJlIHNvIHRoYXQgd2UgZGVsYXkgdGhlIHJlc29sdXRpb25cbiAgICAgIC8vIGFzIGxvbmcgYXMgcG9zc2libGUsIGVuc3VyaW5nIHRoYXQgdGhlIGVsZW1lbnQgaXMgaW4gaXRzIGZpbmFsIHBsYWNlIGluIHRoZSBET00uXG4gICAgICBpZiAoIXRoaXMuX3Njcm9sbGFibGVQYXJlbnRzUmVzb2x2ZWQpIHtcbiAgICAgICAgY29uc3Qgc2Nyb2xsYWJsZVBhcmVudHMgPSB0aGlzLl9zY3JvbGxEaXNwYXRjaGVyXG4gICAgICAgICAgLmdldEFuY2VzdG9yU2Nyb2xsQ29udGFpbmVycyh0aGlzLmVsZW1lbnQpXG4gICAgICAgICAgLm1hcChzY3JvbGxhYmxlID0+IHNjcm9sbGFibGUuZ2V0RWxlbWVudFJlZigpLm5hdGl2ZUVsZW1lbnQpO1xuICAgICAgICB0aGlzLl9kcm9wTGlzdFJlZi53aXRoU2Nyb2xsYWJsZVBhcmVudHMoc2Nyb2xsYWJsZVBhcmVudHMpO1xuXG4gICAgICAgIC8vIE9ubHkgZG8gdGhpcyBvbmNlIHNpbmNlIGl0IGludm9sdmVzIHRyYXZlcnNpbmcgdGhlIERPTSBhbmQgdGhlIHBhcmVudHNcbiAgICAgICAgLy8gc2hvdWxkbid0IGJlIGFibGUgdG8gY2hhbmdlIHdpdGhvdXQgdGhlIGRyb3AgbGlzdCBiZWluZyBkZXN0cm95ZWQuXG4gICAgICAgIHRoaXMuX3Njcm9sbGFibGVQYXJlbnRzUmVzb2x2ZWQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICByZWYuZGlzYWJsZWQgPSB0aGlzLmRpc2FibGVkO1xuICAgICAgcmVmLmxvY2tBeGlzID0gdGhpcy5sb2NrQXhpcztcbiAgICAgIHJlZi5zb3J0aW5nRGlzYWJsZWQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodGhpcy5zb3J0aW5nRGlzYWJsZWQpO1xuICAgICAgcmVmLmF1dG9TY3JvbGxEaXNhYmxlZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh0aGlzLmF1dG9TY3JvbGxEaXNhYmxlZCk7XG4gICAgICByZWYuYXV0b1Njcm9sbFN0ZXAgPSBjb2VyY2VOdW1iZXJQcm9wZXJ0eSh0aGlzLmF1dG9TY3JvbGxTdGVwLCAyKTtcbiAgICAgIHJlZlxuICAgICAgICAuY29ubmVjdGVkVG8oc2libGluZ3MuZmlsdGVyKGRyb3AgPT4gZHJvcCAmJiBkcm9wICE9PSB0aGlzKS5tYXAobGlzdCA9PiBsaXN0Ll9kcm9wTGlzdFJlZikpXG4gICAgICAgIC53aXRoT3JpZW50YXRpb24odGhpcy5vcmllbnRhdGlvbik7XG4gICAgfSk7XG4gIH1cblxuICAvKiogSGFuZGxlcyBldmVudHMgZnJvbSB0aGUgdW5kZXJseWluZyBEcm9wTGlzdFJlZi4gKi9cbiAgcHJpdmF0ZSBfaGFuZGxlRXZlbnRzKHJlZjogRHJvcExpc3RSZWY8Q2RrRHJvcExpc3Q+KSB7XG4gICAgcmVmLmJlZm9yZVN0YXJ0ZWQuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIHRoaXMuX3N5bmNJdGVtc1dpdGhSZWYoKTtcbiAgICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICAgIH0pO1xuXG4gICAgcmVmLmVudGVyZWQuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgIHRoaXMuZW50ZXJlZC5lbWl0KHtcbiAgICAgICAgY29udGFpbmVyOiB0aGlzLFxuICAgICAgICBpdGVtOiBldmVudC5pdGVtLmRhdGEsXG4gICAgICAgIGN1cnJlbnRJbmRleDogZXZlbnQuY3VycmVudEluZGV4LFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZWYuZXhpdGVkLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICB0aGlzLmV4aXRlZC5lbWl0KHtcbiAgICAgICAgY29udGFpbmVyOiB0aGlzLFxuICAgICAgICBpdGVtOiBldmVudC5pdGVtLmRhdGEsXG4gICAgICB9KTtcbiAgICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICAgIH0pO1xuXG4gICAgcmVmLnNvcnRlZC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgdGhpcy5zb3J0ZWQuZW1pdCh7XG4gICAgICAgIHByZXZpb3VzSW5kZXg6IGV2ZW50LnByZXZpb3VzSW5kZXgsXG4gICAgICAgIGN1cnJlbnRJbmRleDogZXZlbnQuY3VycmVudEluZGV4LFxuICAgICAgICBjb250YWluZXI6IHRoaXMsXG4gICAgICAgIGl0ZW06IGV2ZW50Lml0ZW0uZGF0YSxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmVmLmRyb3BwZWQuc3Vic2NyaWJlKGRyb3BFdmVudCA9PiB7XG4gICAgICB0aGlzLmRyb3BwZWQuZW1pdCh7XG4gICAgICAgIHByZXZpb3VzSW5kZXg6IGRyb3BFdmVudC5wcmV2aW91c0luZGV4LFxuICAgICAgICBjdXJyZW50SW5kZXg6IGRyb3BFdmVudC5jdXJyZW50SW5kZXgsXG4gICAgICAgIHByZXZpb3VzQ29udGFpbmVyOiBkcm9wRXZlbnQucHJldmlvdXNDb250YWluZXIuZGF0YSxcbiAgICAgICAgY29udGFpbmVyOiBkcm9wRXZlbnQuY29udGFpbmVyLmRhdGEsXG4gICAgICAgIGl0ZW06IGRyb3BFdmVudC5pdGVtLmRhdGEsXG4gICAgICAgIGlzUG9pbnRlck92ZXJDb250YWluZXI6IGRyb3BFdmVudC5pc1BvaW50ZXJPdmVyQ29udGFpbmVyLFxuICAgICAgICBkaXN0YW5jZTogZHJvcEV2ZW50LmRpc3RhbmNlLFxuICAgICAgICBkcm9wUG9pbnQ6IGRyb3BFdmVudC5kcm9wUG9pbnQsXG4gICAgICAgIGV2ZW50OiBkcm9wRXZlbnQuZXZlbnQsXG4gICAgICB9KTtcblxuICAgICAgLy8gTWFyayBmb3IgY2hlY2sgc2luY2UgYWxsIG9mIHRoZXNlIGV2ZW50cyBydW4gb3V0c2lkZSBvZiBjaGFuZ2VcbiAgICAgIC8vIGRldGVjdGlvbiBhbmQgd2UncmUgbm90IGd1YXJhbnRlZWQgZm9yIHNvbWV0aGluZyBlbHNlIHRvIGhhdmUgdHJpZ2dlcmVkIGl0LlxuICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgfSk7XG5cbiAgICBtZXJnZShyZWYucmVjZWl2aW5nU3RhcnRlZCwgcmVmLnJlY2VpdmluZ1N0b3BwZWQpLnN1YnNjcmliZSgoKSA9PlxuICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCksXG4gICAgKTtcbiAgfVxuXG4gIC8qKiBBc3NpZ25zIHRoZSBkZWZhdWx0IGlucHV0IHZhbHVlcyBiYXNlZCBvbiBhIHByb3ZpZGVkIGNvbmZpZyBvYmplY3QuICovXG4gIHByaXZhdGUgX2Fzc2lnbkRlZmF1bHRzKGNvbmZpZzogRHJhZ0Ryb3BDb25maWcpIHtcbiAgICBjb25zdCB7bG9ja0F4aXMsIGRyYWdnaW5nRGlzYWJsZWQsIHNvcnRpbmdEaXNhYmxlZCwgbGlzdEF1dG9TY3JvbGxEaXNhYmxlZCwgbGlzdE9yaWVudGF0aW9ufSA9XG4gICAgICBjb25maWc7XG5cbiAgICB0aGlzLmRpc2FibGVkID0gZHJhZ2dpbmdEaXNhYmxlZCA9PSBudWxsID8gZmFsc2UgOiBkcmFnZ2luZ0Rpc2FibGVkO1xuICAgIHRoaXMuc29ydGluZ0Rpc2FibGVkID0gc29ydGluZ0Rpc2FibGVkID09IG51bGwgPyBmYWxzZSA6IHNvcnRpbmdEaXNhYmxlZDtcbiAgICB0aGlzLmF1dG9TY3JvbGxEaXNhYmxlZCA9IGxpc3RBdXRvU2Nyb2xsRGlzYWJsZWQgPT0gbnVsbCA/IGZhbHNlIDogbGlzdEF1dG9TY3JvbGxEaXNhYmxlZDtcbiAgICB0aGlzLm9yaWVudGF0aW9uID0gbGlzdE9yaWVudGF0aW9uIHx8ICd2ZXJ0aWNhbCc7XG5cbiAgICBpZiAobG9ja0F4aXMpIHtcbiAgICAgIHRoaXMubG9ja0F4aXMgPSBsb2NrQXhpcztcbiAgICB9XG4gIH1cblxuICAvKiogU3luY3MgdXAgdGhlIHJlZ2lzdGVyZWQgZHJhZyBpdGVtcyB3aXRoIHVuZGVybHlpbmcgZHJvcCBsaXN0IHJlZi4gKi9cbiAgcHJpdmF0ZSBfc3luY0l0ZW1zV2l0aFJlZigpIHtcbiAgICB0aGlzLl9kcm9wTGlzdFJlZi53aXRoSXRlbXModGhpcy5nZXRTb3J0ZWRJdGVtcygpLm1hcChpdGVtID0+IGl0ZW0uX2RyYWdSZWYpKTtcbiAgfVxufVxuIl19