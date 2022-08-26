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
import { Subject } from 'rxjs';
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
CdkDropList.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: CdkDropList, deps: [{ token: i0.ElementRef }, { token: i1.DragDrop }, { token: i0.ChangeDetectorRef }, { token: i2.ScrollDispatcher }, { token: i3.Directionality, optional: true }, { token: CDK_DROP_LIST_GROUP, optional: true, skipSelf: true }, { token: CDK_DRAG_CONFIG, optional: true }], target: i0.ɵɵFactoryTarget.Directive });
CdkDropList.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "14.2.0", type: CdkDropList, selector: "[cdkDropList], cdk-drop-list", inputs: { connectedTo: ["cdkDropListConnectedTo", "connectedTo"], data: ["cdkDropListData", "data"], orientation: ["cdkDropListOrientation", "orientation"], id: "id", lockAxis: ["cdkDropListLockAxis", "lockAxis"], disabled: ["cdkDropListDisabled", "disabled"], sortingDisabled: ["cdkDropListSortingDisabled", "sortingDisabled"], enterPredicate: ["cdkDropListEnterPredicate", "enterPredicate"], sortPredicate: ["cdkDropListSortPredicate", "sortPredicate"], autoScrollDisabled: ["cdkDropListAutoScrollDisabled", "autoScrollDisabled"], autoScrollStep: ["cdkDropListAutoScrollStep", "autoScrollStep"] }, outputs: { dropped: "cdkDropListDropped", entered: "cdkDropListEntered", exited: "cdkDropListExited", sorted: "cdkDropListSorted" }, host: { properties: { "attr.id": "id", "class.cdk-drop-list-disabled": "disabled", "class.cdk-drop-list-dragging": "_dropListRef.isDragging()", "class.cdk-drop-list-receiving": "_dropListRef.isReceiving()" }, classAttribute: "cdk-drop-list" }, providers: [
        // Prevent child drop lists from picking up the same group as their parent.
        { provide: CDK_DROP_LIST_GROUP, useValue: undefined },
        { provide: CDK_DROP_LIST, useExisting: CdkDropList },
    ], exportAs: ["cdkDropList"], ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: CdkDropList, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkDropList], cdk-drop-list',
                    exportAs: 'cdkDropList',
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZGlyZWN0aXZlcy9kcm9wLWxpc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUVMLFdBQVcsRUFDWCxvQkFBb0IsRUFDcEIscUJBQXFCLEdBRXRCLE1BQU0sdUJBQXVCLENBQUM7QUFDL0IsT0FBTyxFQUNMLFVBQVUsRUFDVixZQUFZLEVBQ1osS0FBSyxFQUVMLE1BQU0sRUFDTixRQUFRLEVBQ1IsU0FBUyxFQUNULGlCQUFpQixFQUNqQixRQUFRLEVBQ1IsTUFBTSxFQUNOLGNBQWMsR0FDZixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFHeEQsT0FBTyxFQUFDLG1CQUFtQixFQUFFLGdCQUFnQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFHeEUsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUN0QyxPQUFPLEVBQWdELGVBQWUsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN4RixPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQzdCLE9BQU8sRUFBQyxTQUFTLEVBQUUsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDcEQsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sY0FBYyxDQUFDOzs7Ozs7QUFFL0MsMERBQTBEO0FBQzFELElBQUksZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDO0FBU3pCOzs7O0dBSUc7QUFDSCxNQUFNLENBQUMsTUFBTSxhQUFhLEdBQUcsSUFBSSxjQUFjLENBQWMsYUFBYSxDQUFDLENBQUM7QUFFNUUscURBQXFEO0FBaUJyRCxNQUFNLE9BQU8sV0FBVztJQXVHdEI7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LDJCQUEyQjtnQkFLekIsT0FBTztzQkFEZixNQUFNO3VCQUFDLG9CQUFvQjtnQkFPbkIsT0FBTztzQkFEZixNQUFNO3VCQUFDLG9CQUFvQjtnQkFRbkIsTUFBTTtzQkFEZCxNQUFNO3VCQUFDLG1CQUFtQjtnQkFLbEIsTUFBTTtzQkFEZCxNQUFNO3VCQUFDLG1CQUFtQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBCb29sZWFuSW5wdXQsXG4gIGNvZXJjZUFycmF5LFxuICBjb2VyY2VOdW1iZXJQcm9wZXJ0eSxcbiAgY29lcmNlQm9vbGVhblByb3BlcnR5LFxuICBOdW1iZXJJbnB1dCxcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7XG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5wdXQsXG4gIE9uRGVzdHJveSxcbiAgT3V0cHV0LFxuICBPcHRpb25hbCxcbiAgRGlyZWN0aXZlLFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgU2tpcFNlbGYsXG4gIEluamVjdCxcbiAgSW5qZWN0aW9uVG9rZW4sXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtTY3JvbGxEaXNwYXRjaGVyfSBmcm9tICdAYW5ndWxhci9jZGsvc2Nyb2xsaW5nJztcbmltcG9ydCB7Q2RrRHJhZ30gZnJvbSAnLi9kcmFnJztcbmltcG9ydCB7Q2RrRHJhZ0Ryb3AsIENka0RyYWdFbnRlciwgQ2RrRHJhZ0V4aXQsIENka0RyYWdTb3J0RXZlbnR9IGZyb20gJy4uL2RyYWctZXZlbnRzJztcbmltcG9ydCB7Q0RLX0RST1BfTElTVF9HUk9VUCwgQ2RrRHJvcExpc3RHcm91cH0gZnJvbSAnLi9kcm9wLWxpc3QtZ3JvdXAnO1xuaW1wb3J0IHtEcm9wTGlzdFJlZn0gZnJvbSAnLi4vZHJvcC1saXN0LXJlZic7XG5pbXBvcnQge0RyYWdSZWZ9IGZyb20gJy4uL2RyYWctcmVmJztcbmltcG9ydCB7RHJhZ0Ryb3B9IGZyb20gJy4uL2RyYWctZHJvcCc7XG5pbXBvcnQge0Ryb3BMaXN0T3JpZW50YXRpb24sIERyYWdBeGlzLCBEcmFnRHJvcENvbmZpZywgQ0RLX0RSQUdfQ09ORklHfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQge1N1YmplY3R9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtzdGFydFdpdGgsIHRha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHthc3NlcnRFbGVtZW50Tm9kZX0gZnJvbSAnLi9hc3NlcnRpb25zJztcblxuLyoqIENvdW50ZXIgdXNlZCB0byBnZW5lcmF0ZSB1bmlxdWUgaWRzIGZvciBkcm9wIHpvbmVzLiAqL1xubGV0IF91bmlxdWVJZENvdW50ZXIgPSAwO1xuXG4vKipcbiAqIEludGVybmFsIGNvbXBpbGUtdGltZS1vbmx5IHJlcHJlc2VudGF0aW9uIG9mIGEgYENka0Ryb3BMaXN0YC5cbiAqIFVzZWQgdG8gYXZvaWQgY2lyY3VsYXIgaW1wb3J0IGlzc3VlcyBiZXR3ZWVuIHRoZSBgQ2RrRHJvcExpc3RgIGFuZCB0aGUgYENka0RyYWdgLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIENka0Ryb3BMaXN0SW50ZXJuYWwgZXh0ZW5kcyBDZGtEcm9wTGlzdCB7fVxuXG4vKipcbiAqIEluamVjdGlvbiB0b2tlbiB0aGF0IGNhbiBiZSB1c2VkIHRvIHJlZmVyZW5jZSBpbnN0YW5jZXMgb2YgYENka0Ryb3BMaXN0YC4gSXQgc2VydmVzIGFzXG4gKiBhbHRlcm5hdGl2ZSB0b2tlbiB0byB0aGUgYWN0dWFsIGBDZGtEcm9wTGlzdGAgY2xhc3Mgd2hpY2ggY291bGQgY2F1c2UgdW5uZWNlc3NhcnlcbiAqIHJldGVudGlvbiBvZiB0aGUgY2xhc3MgYW5kIGl0cyBkaXJlY3RpdmUgbWV0YWRhdGEuXG4gKi9cbmV4cG9ydCBjb25zdCBDREtfRFJPUF9MSVNUID0gbmV3IEluamVjdGlvblRva2VuPENka0Ryb3BMaXN0PignQ2RrRHJvcExpc3QnKTtcblxuLyoqIENvbnRhaW5lciB0aGF0IHdyYXBzIGEgc2V0IG9mIGRyYWdnYWJsZSBpdGVtcy4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtEcm9wTGlzdF0sIGNkay1kcm9wLWxpc3QnLFxuICBleHBvcnRBczogJ2Nka0Ryb3BMaXN0JyxcbiAgcHJvdmlkZXJzOiBbXG4gICAgLy8gUHJldmVudCBjaGlsZCBkcm9wIGxpc3RzIGZyb20gcGlja2luZyB1cCB0aGUgc2FtZSBncm91cCBhcyB0aGVpciBwYXJlbnQuXG4gICAge3Byb3ZpZGU6IENES19EUk9QX0xJU1RfR1JPVVAsIHVzZVZhbHVlOiB1bmRlZmluZWR9LFxuICAgIHtwcm92aWRlOiBDREtfRFJPUF9MSVNULCB1c2VFeGlzdGluZzogQ2RrRHJvcExpc3R9LFxuICBdLFxuICBob3N0OiB7XG4gICAgJ2NsYXNzJzogJ2Nkay1kcm9wLWxpc3QnLFxuICAgICdbYXR0ci5pZF0nOiAnaWQnLFxuICAgICdbY2xhc3MuY2RrLWRyb3AtbGlzdC1kaXNhYmxlZF0nOiAnZGlzYWJsZWQnLFxuICAgICdbY2xhc3MuY2RrLWRyb3AtbGlzdC1kcmFnZ2luZ10nOiAnX2Ryb3BMaXN0UmVmLmlzRHJhZ2dpbmcoKScsXG4gICAgJ1tjbGFzcy5jZGstZHJvcC1saXN0LXJlY2VpdmluZ10nOiAnX2Ryb3BMaXN0UmVmLmlzUmVjZWl2aW5nKCknLFxuICB9LFxufSlcbmV4cG9ydCBjbGFzcyBDZGtEcm9wTGlzdDxUID0gYW55PiBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBsaXN0IGhhcyBiZWVuIGRlc3Ryb3llZC4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfZGVzdHJveWVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogV2hldGhlciB0aGUgZWxlbWVudCdzIHNjcm9sbGFibGUgcGFyZW50cyBoYXZlIGJlZW4gcmVzb2x2ZWQuICovXG4gIHByaXZhdGUgX3Njcm9sbGFibGVQYXJlbnRzUmVzb2x2ZWQ6IGJvb2xlYW47XG5cbiAgLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBkcm9wIGxpc3RzIHRoYXQgYXJlIGN1cnJlbnRseSBvbiB0aGUgcGFnZS4gKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX2Ryb3BMaXN0czogQ2RrRHJvcExpc3RbXSA9IFtdO1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIHVuZGVybHlpbmcgZHJvcCBsaXN0IGluc3RhbmNlLiAqL1xuICBfZHJvcExpc3RSZWY6IERyb3BMaXN0UmVmPENka0Ryb3BMaXN0PFQ+PjtcblxuICAvKipcbiAgICogT3RoZXIgZHJhZ2dhYmxlIGNvbnRhaW5lcnMgdGhhdCB0aGlzIGNvbnRhaW5lciBpcyBjb25uZWN0ZWQgdG8gYW5kIGludG8gd2hpY2ggdGhlXG4gICAqIGNvbnRhaW5lcidzIGl0ZW1zIGNhbiBiZSB0cmFuc2ZlcnJlZC4gQ2FuIGVpdGhlciBiZSByZWZlcmVuY2VzIHRvIG90aGVyIGRyb3AgY29udGFpbmVycyxcbiAgICogb3IgdGhlaXIgdW5pcXVlIElEcy5cbiAgICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3RDb25uZWN0ZWRUbycpXG4gIGNvbm5lY3RlZFRvOiAoQ2RrRHJvcExpc3QgfCBzdHJpbmcpW10gfCBDZGtEcm9wTGlzdCB8IHN0cmluZyA9IFtdO1xuXG4gIC8qKiBBcmJpdHJhcnkgZGF0YSB0byBhdHRhY2ggdG8gdGhpcyBjb250YWluZXIuICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3REYXRhJykgZGF0YTogVDtcblxuICAvKiogRGlyZWN0aW9uIGluIHdoaWNoIHRoZSBsaXN0IGlzIG9yaWVudGVkLiAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0T3JpZW50YXRpb24nKSBvcmllbnRhdGlvbjogRHJvcExpc3RPcmllbnRhdGlvbjtcblxuICAvKipcbiAgICogVW5pcXVlIElEIGZvciB0aGUgZHJvcCB6b25lLiBDYW4gYmUgdXNlZCBhcyBhIHJlZmVyZW5jZVxuICAgKiBpbiB0aGUgYGNvbm5lY3RlZFRvYCBvZiBhbm90aGVyIGBDZGtEcm9wTGlzdGAuXG4gICAqL1xuICBASW5wdXQoKSBpZDogc3RyaW5nID0gYGNkay1kcm9wLWxpc3QtJHtfdW5pcXVlSWRDb3VudGVyKyt9YDtcblxuICAvKiogTG9ja3MgdGhlIHBvc2l0aW9uIG9mIHRoZSBkcmFnZ2FibGUgZWxlbWVudHMgaW5zaWRlIHRoZSBjb250YWluZXIgYWxvbmcgdGhlIHNwZWNpZmllZCBheGlzLiAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0TG9ja0F4aXMnKSBsb2NrQXhpczogRHJhZ0F4aXM7XG5cbiAgLyoqIFdoZXRoZXIgc3RhcnRpbmcgYSBkcmFnZ2luZyBzZXF1ZW5jZSBmcm9tIHRoaXMgY29udGFpbmVyIGlzIGRpc2FibGVkLiAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0RGlzYWJsZWQnKVxuICBnZXQgZGlzYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2Rpc2FibGVkIHx8ICghIXRoaXMuX2dyb3VwICYmIHRoaXMuX2dyb3VwLmRpc2FibGVkKTtcbiAgfVxuICBzZXQgZGlzYWJsZWQodmFsdWU6IEJvb2xlYW5JbnB1dCkge1xuICAgIC8vIFVzdWFsbHkgd2Ugc3luYyB0aGUgZGlyZWN0aXZlIGFuZCByZWYgc3RhdGUgcmlnaHQgYmVmb3JlIGRyYWdnaW5nIHN0YXJ0cywgaW4gb3JkZXIgdG8gaGF2ZVxuICAgIC8vIGEgc2luZ2xlIHBvaW50IG9mIGZhaWx1cmUgYW5kIHRvIGF2b2lkIGhhdmluZyB0byB1c2Ugc2V0dGVycyBmb3IgZXZlcnl0aGluZy4gYGRpc2FibGVkYCBpc1xuICAgIC8vIGEgc3BlY2lhbCBjYXNlLCBiZWNhdXNlIGl0IGNhbiBwcmV2ZW50IHRoZSBgYmVmb3JlU3RhcnRlZGAgZXZlbnQgZnJvbSBmaXJpbmcsIHdoaWNoIGNhbiBsb2NrXG4gICAgLy8gdGhlIHVzZXIgaW4gYSBkaXNhYmxlZCBzdGF0ZSwgc28gd2UgYWxzbyBuZWVkIHRvIHN5bmMgaXQgYXMgaXQncyBiZWluZyBzZXQuXG4gICAgdGhpcy5fZHJvcExpc3RSZWYuZGlzYWJsZWQgPSB0aGlzLl9kaXNhYmxlZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gIH1cbiAgcHJpdmF0ZSBfZGlzYWJsZWQ6IGJvb2xlYW47XG5cbiAgLyoqIFdoZXRoZXIgc29ydGluZyB3aXRoaW4gdGhpcyBkcm9wIGxpc3QgaXMgZGlzYWJsZWQuICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3RTb3J0aW5nRGlzYWJsZWQnKVxuICBzb3J0aW5nRGlzYWJsZWQ6IEJvb2xlYW5JbnB1dDtcblxuICAvKipcbiAgICogRnVuY3Rpb24gdGhhdCBpcyB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIGFuIGl0ZW1cbiAgICogaXMgYWxsb3dlZCB0byBiZSBtb3ZlZCBpbnRvIGEgZHJvcCBjb250YWluZXIuXG4gICAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0RW50ZXJQcmVkaWNhdGUnKVxuICBlbnRlclByZWRpY2F0ZTogKGRyYWc6IENka0RyYWcsIGRyb3A6IENka0Ryb3BMaXN0KSA9PiBib29sZWFuID0gKCkgPT4gdHJ1ZTtcblxuICAvKiogRnVuY3Rpb25zIHRoYXQgaXMgdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBhbiBpdGVtIGNhbiBiZSBzb3J0ZWQgaW50byBhIHBhcnRpY3VsYXIgaW5kZXguICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3RTb3J0UHJlZGljYXRlJylcbiAgc29ydFByZWRpY2F0ZTogKGluZGV4OiBudW1iZXIsIGRyYWc6IENka0RyYWcsIGRyb3A6IENka0Ryb3BMaXN0KSA9PiBib29sZWFuID0gKCkgPT4gdHJ1ZTtcblxuICAvKiogV2hldGhlciB0byBhdXRvLXNjcm9sbCB0aGUgdmlldyB3aGVuIHRoZSB1c2VyIG1vdmVzIHRoZWlyIHBvaW50ZXIgY2xvc2UgdG8gdGhlIGVkZ2VzLiAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0QXV0b1Njcm9sbERpc2FibGVkJylcbiAgYXV0b1Njcm9sbERpc2FibGVkOiBCb29sZWFuSW5wdXQ7XG5cbiAgLyoqIE51bWJlciBvZiBwaXhlbHMgdG8gc2Nyb2xsIGZvciBlYWNoIGZyYW1lIHdoZW4gYXV0by1zY3JvbGxpbmcgYW4gZWxlbWVudC4gKi9cbiAgQElucHV0KCdjZGtEcm9wTGlzdEF1dG9TY3JvbGxTdGVwJylcbiAgYXV0b1Njcm9sbFN0ZXA6IE51bWJlcklucHV0O1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGRyb3BzIGFuIGl0ZW0gaW5zaWRlIHRoZSBjb250YWluZXIuICovXG4gIEBPdXRwdXQoJ2Nka0Ryb3BMaXN0RHJvcHBlZCcpXG4gIHJlYWRvbmx5IGRyb3BwZWQ6IEV2ZW50RW1pdHRlcjxDZGtEcmFnRHJvcDxULCBhbnk+PiA9IG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0Ryb3A8VCwgYW55Pj4oKTtcblxuICAvKipcbiAgICogRW1pdHMgd2hlbiB0aGUgdXNlciBoYXMgbW92ZWQgYSBuZXcgZHJhZyBpdGVtIGludG8gdGhpcyBjb250YWluZXIuXG4gICAqL1xuICBAT3V0cHV0KCdjZGtEcm9wTGlzdEVudGVyZWQnKVxuICByZWFkb25seSBlbnRlcmVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0VudGVyPFQ+PiA9IG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0VudGVyPFQ+PigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHJlbW92ZXMgYW4gaXRlbSBmcm9tIHRoZSBjb250YWluZXJcbiAgICogYnkgZHJhZ2dpbmcgaXQgaW50byBhbm90aGVyIGNvbnRhaW5lci5cbiAgICovXG4gIEBPdXRwdXQoJ2Nka0Ryb3BMaXN0RXhpdGVkJylcbiAgcmVhZG9ubHkgZXhpdGVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0V4aXQ8VD4+ID0gbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnRXhpdDxUPj4oKTtcblxuICAvKiogRW1pdHMgYXMgdGhlIHVzZXIgaXMgc3dhcHBpbmcgaXRlbXMgd2hpbGUgYWN0aXZlbHkgZHJhZ2dpbmcuICovXG4gIEBPdXRwdXQoJ2Nka0Ryb3BMaXN0U29ydGVkJylcbiAgcmVhZG9ubHkgc29ydGVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ1NvcnRFdmVudDxUPj4gPSBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdTb3J0RXZlbnQ8VD4+KCk7XG5cbiAgLyoqXG4gICAqIEtlZXBzIHRyYWNrIG9mIHRoZSBpdGVtcyB0aGF0IGFyZSByZWdpc3RlcmVkIHdpdGggdGhpcyBjb250YWluZXIuIEhpc3RvcmljYWxseSB3ZSB1c2VkIHRvXG4gICAqIGRvIHRoaXMgd2l0aCBhIGBDb250ZW50Q2hpbGRyZW5gIHF1ZXJ5LCBob3dldmVyIHF1ZXJpZXMgZG9uJ3QgaGFuZGxlIHRyYW5zcGxhbnRlZCB2aWV3cyB2ZXJ5XG4gICAqIHdlbGwgd2hpY2ggbWVhbnMgdGhhdCB3ZSBjYW4ndCBoYW5kbGUgY2FzZXMgbGlrZSBkcmFnZ2luZyB0aGUgaGVhZGVycyBvZiBhIGBtYXQtdGFibGVgXG4gICAqIGNvcnJlY3RseS4gV2hhdCB3ZSBkbyBpbnN0ZWFkIGlzIHRvIGhhdmUgdGhlIGl0ZW1zIHJlZ2lzdGVyIHRoZW1zZWx2ZXMgd2l0aCB0aGUgY29udGFpbmVyXG4gICAqIGFuZCB0aGVuIHdlIHNvcnQgdGhlbSBiYXNlZCBvbiB0aGVpciBwb3NpdGlvbiBpbiB0aGUgRE9NLlxuICAgKi9cbiAgcHJpdmF0ZSBfdW5zb3J0ZWRJdGVtcyA9IG5ldyBTZXQ8Q2RrRHJhZz4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAvKiogRWxlbWVudCB0aGF0IHRoZSBkcm9wIGxpc3QgaXMgYXR0YWNoZWQgdG8uICovXG4gICAgcHVibGljIGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgIGRyYWdEcm9wOiBEcmFnRHJvcCxcbiAgICBwcml2YXRlIF9jaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgcHJpdmF0ZSBfc2Nyb2xsRGlzcGF0Y2hlcjogU2Nyb2xsRGlzcGF0Y2hlcixcbiAgICBAT3B0aW9uYWwoKSBwcml2YXRlIF9kaXI/OiBEaXJlY3Rpb25hbGl0eSxcbiAgICBAT3B0aW9uYWwoKVxuICAgIEBJbmplY3QoQ0RLX0RST1BfTElTVF9HUk9VUClcbiAgICBAU2tpcFNlbGYoKVxuICAgIHByaXZhdGUgX2dyb3VwPzogQ2RrRHJvcExpc3RHcm91cDxDZGtEcm9wTGlzdD4sXG4gICAgQE9wdGlvbmFsKCkgQEluamVjdChDREtfRFJBR19DT05GSUcpIGNvbmZpZz86IERyYWdEcm9wQ29uZmlnLFxuICApIHtcbiAgICBpZiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSB7XG4gICAgICBhc3NlcnRFbGVtZW50Tm9kZShlbGVtZW50Lm5hdGl2ZUVsZW1lbnQsICdjZGtEcm9wTGlzdCcpO1xuICAgIH1cblxuICAgIHRoaXMuX2Ryb3BMaXN0UmVmID0gZHJhZ0Ryb3AuY3JlYXRlRHJvcExpc3QoZWxlbWVudCk7XG4gICAgdGhpcy5fZHJvcExpc3RSZWYuZGF0YSA9IHRoaXM7XG5cbiAgICBpZiAoY29uZmlnKSB7XG4gICAgICB0aGlzLl9hc3NpZ25EZWZhdWx0cyhjb25maWcpO1xuICAgIH1cblxuICAgIHRoaXMuX2Ryb3BMaXN0UmVmLmVudGVyUHJlZGljYXRlID0gKGRyYWc6IERyYWdSZWY8Q2RrRHJhZz4sIGRyb3A6IERyb3BMaXN0UmVmPENka0Ryb3BMaXN0PikgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMuZW50ZXJQcmVkaWNhdGUoZHJhZy5kYXRhLCBkcm9wLmRhdGEpO1xuICAgIH07XG5cbiAgICB0aGlzLl9kcm9wTGlzdFJlZi5zb3J0UHJlZGljYXRlID0gKFxuICAgICAgaW5kZXg6IG51bWJlcixcbiAgICAgIGRyYWc6IERyYWdSZWY8Q2RrRHJhZz4sXG4gICAgICBkcm9wOiBEcm9wTGlzdFJlZjxDZGtEcm9wTGlzdD4sXG4gICAgKSA9PiB7XG4gICAgICByZXR1cm4gdGhpcy5zb3J0UHJlZGljYXRlKGluZGV4LCBkcmFnLmRhdGEsIGRyb3AuZGF0YSk7XG4gICAgfTtcblxuICAgIHRoaXMuX3NldHVwSW5wdXRTeW5jU3Vic2NyaXB0aW9uKHRoaXMuX2Ryb3BMaXN0UmVmKTtcbiAgICB0aGlzLl9oYW5kbGVFdmVudHModGhpcy5fZHJvcExpc3RSZWYpO1xuICAgIENka0Ryb3BMaXN0Ll9kcm9wTGlzdHMucHVzaCh0aGlzKTtcblxuICAgIGlmIChfZ3JvdXApIHtcbiAgICAgIF9ncm91cC5faXRlbXMuYWRkKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSZWdpc3RlcnMgYW4gaXRlbXMgd2l0aCB0aGUgZHJvcCBsaXN0LiAqL1xuICBhZGRJdGVtKGl0ZW06IENka0RyYWcpOiB2b2lkIHtcbiAgICB0aGlzLl91bnNvcnRlZEl0ZW1zLmFkZChpdGVtKTtcblxuICAgIGlmICh0aGlzLl9kcm9wTGlzdFJlZi5pc0RyYWdnaW5nKCkpIHtcbiAgICAgIHRoaXMuX3N5bmNJdGVtc1dpdGhSZWYoKTtcbiAgICB9XG4gIH1cblxuICAvKiogUmVtb3ZlcyBhbiBpdGVtIGZyb20gdGhlIGRyb3AgbGlzdC4gKi9cbiAgcmVtb3ZlSXRlbShpdGVtOiBDZGtEcmFnKTogdm9pZCB7XG4gICAgdGhpcy5fdW5zb3J0ZWRJdGVtcy5kZWxldGUoaXRlbSk7XG5cbiAgICBpZiAodGhpcy5fZHJvcExpc3RSZWYuaXNEcmFnZ2luZygpKSB7XG4gICAgICB0aGlzLl9zeW5jSXRlbXNXaXRoUmVmKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEdldHMgdGhlIHJlZ2lzdGVyZWQgaXRlbXMgaW4gdGhlIGxpc3QsIHNvcnRlZCBieSB0aGVpciBwb3NpdGlvbiBpbiB0aGUgRE9NLiAqL1xuICBnZXRTb3J0ZWRJdGVtcygpOiBDZGtEcmFnW10ge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuX3Vuc29ydGVkSXRlbXMpLnNvcnQoKGE6IENka0RyYWcsIGI6IENka0RyYWcpID0+IHtcbiAgICAgIGNvbnN0IGRvY3VtZW50UG9zaXRpb24gPSBhLl9kcmFnUmVmXG4gICAgICAgIC5nZXRWaXNpYmxlRWxlbWVudCgpXG4gICAgICAgIC5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbihiLl9kcmFnUmVmLmdldFZpc2libGVFbGVtZW50KCkpO1xuXG4gICAgICAvLyBgY29tcGFyZURvY3VtZW50UG9zaXRpb25gIHJldHVybnMgYSBiaXRtYXNrIHNvIHdlIGhhdmUgdG8gdXNlIGEgYml0d2lzZSBvcGVyYXRvci5cbiAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9Ob2RlL2NvbXBhcmVEb2N1bWVudFBvc2l0aW9uXG4gICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYml0d2lzZVxuICAgICAgcmV0dXJuIGRvY3VtZW50UG9zaXRpb24gJiBOb2RlLkRPQ1VNRU5UX1BPU0lUSU9OX0ZPTExPV0lORyA/IC0xIDogMTtcbiAgICB9KTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIGNvbnN0IGluZGV4ID0gQ2RrRHJvcExpc3QuX2Ryb3BMaXN0cy5pbmRleE9mKHRoaXMpO1xuXG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIENka0Ryb3BMaXN0Ll9kcm9wTGlzdHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZ3JvdXApIHtcbiAgICAgIHRoaXMuX2dyb3VwLl9pdGVtcy5kZWxldGUodGhpcyk7XG4gICAgfVxuXG4gICAgdGhpcy5fdW5zb3J0ZWRJdGVtcy5jbGVhcigpO1xuICAgIHRoaXMuX2Ryb3BMaXN0UmVmLmRpc3Bvc2UoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQubmV4dCgpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5jb21wbGV0ZSgpO1xuICB9XG5cbiAgLyoqIFN5bmNzIHRoZSBpbnB1dHMgb2YgdGhlIENka0Ryb3BMaXN0IHdpdGggdGhlIG9wdGlvbnMgb2YgdGhlIHVuZGVybHlpbmcgRHJvcExpc3RSZWYuICovXG4gIHByaXZhdGUgX3NldHVwSW5wdXRTeW5jU3Vic2NyaXB0aW9uKHJlZjogRHJvcExpc3RSZWY8Q2RrRHJvcExpc3Q+KSB7XG4gICAgaWYgKHRoaXMuX2Rpcikge1xuICAgICAgdGhpcy5fZGlyLmNoYW5nZVxuICAgICAgICAucGlwZShzdGFydFdpdGgodGhpcy5fZGlyLnZhbHVlKSwgdGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpXG4gICAgICAgIC5zdWJzY3JpYmUodmFsdWUgPT4gcmVmLndpdGhEaXJlY3Rpb24odmFsdWUpKTtcbiAgICB9XG5cbiAgICByZWYuYmVmb3JlU3RhcnRlZC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgY29uc3Qgc2libGluZ3MgPSBjb2VyY2VBcnJheSh0aGlzLmNvbm5lY3RlZFRvKS5tYXAoZHJvcCA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgZHJvcCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICBjb25zdCBjb3JyZXNwb25kaW5nRHJvcExpc3QgPSBDZGtEcm9wTGlzdC5fZHJvcExpc3RzLmZpbmQobGlzdCA9PiBsaXN0LmlkID09PSBkcm9wKTtcblxuICAgICAgICAgIGlmICghY29ycmVzcG9uZGluZ0Ryb3BMaXN0ICYmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYENka0Ryb3BMaXN0IGNvdWxkIG5vdCBmaW5kIGNvbm5lY3RlZCBkcm9wIGxpc3Qgd2l0aCBpZCBcIiR7ZHJvcH1cImApO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBjb3JyZXNwb25kaW5nRHJvcExpc3QhO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRyb3A7XG4gICAgICB9KTtcblxuICAgICAgaWYgKHRoaXMuX2dyb3VwKSB7XG4gICAgICAgIHRoaXMuX2dyb3VwLl9pdGVtcy5mb3JFYWNoKGRyb3AgPT4ge1xuICAgICAgICAgIGlmIChzaWJsaW5ncy5pbmRleE9mKGRyb3ApID09PSAtMSkge1xuICAgICAgICAgICAgc2libGluZ3MucHVzaChkcm9wKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBOb3RlIHRoYXQgd2UgcmVzb2x2ZSB0aGUgc2Nyb2xsYWJsZSBwYXJlbnRzIGhlcmUgc28gdGhhdCB3ZSBkZWxheSB0aGUgcmVzb2x1dGlvblxuICAgICAgLy8gYXMgbG9uZyBhcyBwb3NzaWJsZSwgZW5zdXJpbmcgdGhhdCB0aGUgZWxlbWVudCBpcyBpbiBpdHMgZmluYWwgcGxhY2UgaW4gdGhlIERPTS5cbiAgICAgIGlmICghdGhpcy5fc2Nyb2xsYWJsZVBhcmVudHNSZXNvbHZlZCkge1xuICAgICAgICBjb25zdCBzY3JvbGxhYmxlUGFyZW50cyA9IHRoaXMuX3Njcm9sbERpc3BhdGNoZXJcbiAgICAgICAgICAuZ2V0QW5jZXN0b3JTY3JvbGxDb250YWluZXJzKHRoaXMuZWxlbWVudClcbiAgICAgICAgICAubWFwKHNjcm9sbGFibGUgPT4gc2Nyb2xsYWJsZS5nZXRFbGVtZW50UmVmKCkubmF0aXZlRWxlbWVudCk7XG4gICAgICAgIHRoaXMuX2Ryb3BMaXN0UmVmLndpdGhTY3JvbGxhYmxlUGFyZW50cyhzY3JvbGxhYmxlUGFyZW50cyk7XG5cbiAgICAgICAgLy8gT25seSBkbyB0aGlzIG9uY2Ugc2luY2UgaXQgaW52b2x2ZXMgdHJhdmVyc2luZyB0aGUgRE9NIGFuZCB0aGUgcGFyZW50c1xuICAgICAgICAvLyBzaG91bGRuJ3QgYmUgYWJsZSB0byBjaGFuZ2Ugd2l0aG91dCB0aGUgZHJvcCBsaXN0IGJlaW5nIGRlc3Ryb3llZC5cbiAgICAgICAgdGhpcy5fc2Nyb2xsYWJsZVBhcmVudHNSZXNvbHZlZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHJlZi5kaXNhYmxlZCA9IHRoaXMuZGlzYWJsZWQ7XG4gICAgICByZWYubG9ja0F4aXMgPSB0aGlzLmxvY2tBeGlzO1xuICAgICAgcmVmLnNvcnRpbmdEaXNhYmxlZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh0aGlzLnNvcnRpbmdEaXNhYmxlZCk7XG4gICAgICByZWYuYXV0b1Njcm9sbERpc2FibGVkID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHRoaXMuYXV0b1Njcm9sbERpc2FibGVkKTtcbiAgICAgIHJlZi5hdXRvU2Nyb2xsU3RlcCA9IGNvZXJjZU51bWJlclByb3BlcnR5KHRoaXMuYXV0b1Njcm9sbFN0ZXAsIDIpO1xuICAgICAgcmVmXG4gICAgICAgIC5jb25uZWN0ZWRUbyhzaWJsaW5ncy5maWx0ZXIoZHJvcCA9PiBkcm9wICYmIGRyb3AgIT09IHRoaXMpLm1hcChsaXN0ID0+IGxpc3QuX2Ryb3BMaXN0UmVmKSlcbiAgICAgICAgLndpdGhPcmllbnRhdGlvbih0aGlzLm9yaWVudGF0aW9uKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBIYW5kbGVzIGV2ZW50cyBmcm9tIHRoZSB1bmRlcmx5aW5nIERyb3BMaXN0UmVmLiAqL1xuICBwcml2YXRlIF9oYW5kbGVFdmVudHMocmVmOiBEcm9wTGlzdFJlZjxDZGtEcm9wTGlzdD4pIHtcbiAgICByZWYuYmVmb3JlU3RhcnRlZC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgdGhpcy5fc3luY0l0ZW1zV2l0aFJlZigpO1xuICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgfSk7XG5cbiAgICByZWYuZW50ZXJlZC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgdGhpcy5lbnRlcmVkLmVtaXQoe1xuICAgICAgICBjb250YWluZXI6IHRoaXMsXG4gICAgICAgIGl0ZW06IGV2ZW50Lml0ZW0uZGF0YSxcbiAgICAgICAgY3VycmVudEluZGV4OiBldmVudC5jdXJyZW50SW5kZXgsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJlZi5leGl0ZWQuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgIHRoaXMuZXhpdGVkLmVtaXQoe1xuICAgICAgICBjb250YWluZXI6IHRoaXMsXG4gICAgICAgIGl0ZW06IGV2ZW50Lml0ZW0uZGF0YSxcbiAgICAgIH0pO1xuICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgfSk7XG5cbiAgICByZWYuc29ydGVkLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICB0aGlzLnNvcnRlZC5lbWl0KHtcbiAgICAgICAgcHJldmlvdXNJbmRleDogZXZlbnQucHJldmlvdXNJbmRleCxcbiAgICAgICAgY3VycmVudEluZGV4OiBldmVudC5jdXJyZW50SW5kZXgsXG4gICAgICAgIGNvbnRhaW5lcjogdGhpcyxcbiAgICAgICAgaXRlbTogZXZlbnQuaXRlbS5kYXRhLFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZWYuZHJvcHBlZC5zdWJzY3JpYmUoZHJvcEV2ZW50ID0+IHtcbiAgICAgIHRoaXMuZHJvcHBlZC5lbWl0KHtcbiAgICAgICAgcHJldmlvdXNJbmRleDogZHJvcEV2ZW50LnByZXZpb3VzSW5kZXgsXG4gICAgICAgIGN1cnJlbnRJbmRleDogZHJvcEV2ZW50LmN1cnJlbnRJbmRleCxcbiAgICAgICAgcHJldmlvdXNDb250YWluZXI6IGRyb3BFdmVudC5wcmV2aW91c0NvbnRhaW5lci5kYXRhLFxuICAgICAgICBjb250YWluZXI6IGRyb3BFdmVudC5jb250YWluZXIuZGF0YSxcbiAgICAgICAgaXRlbTogZHJvcEV2ZW50Lml0ZW0uZGF0YSxcbiAgICAgICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcjogZHJvcEV2ZW50LmlzUG9pbnRlck92ZXJDb250YWluZXIsXG4gICAgICAgIGRpc3RhbmNlOiBkcm9wRXZlbnQuZGlzdGFuY2UsXG4gICAgICAgIGRyb3BQb2ludDogZHJvcEV2ZW50LmRyb3BQb2ludCxcbiAgICAgICAgZXZlbnQ6IGRyb3BFdmVudC5ldmVudCxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBNYXJrIGZvciBjaGVjayBzaW5jZSBhbGwgb2YgdGhlc2UgZXZlbnRzIHJ1biBvdXRzaWRlIG9mIGNoYW5nZVxuICAgICAgLy8gZGV0ZWN0aW9uIGFuZCB3ZSdyZSBub3QgZ3VhcmFudGVlZCBmb3Igc29tZXRoaW5nIGVsc2UgdG8gaGF2ZSB0cmlnZ2VyZWQgaXQuXG4gICAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBBc3NpZ25zIHRoZSBkZWZhdWx0IGlucHV0IHZhbHVlcyBiYXNlZCBvbiBhIHByb3ZpZGVkIGNvbmZpZyBvYmplY3QuICovXG4gIHByaXZhdGUgX2Fzc2lnbkRlZmF1bHRzKGNvbmZpZzogRHJhZ0Ryb3BDb25maWcpIHtcbiAgICBjb25zdCB7bG9ja0F4aXMsIGRyYWdnaW5nRGlzYWJsZWQsIHNvcnRpbmdEaXNhYmxlZCwgbGlzdEF1dG9TY3JvbGxEaXNhYmxlZCwgbGlzdE9yaWVudGF0aW9ufSA9XG4gICAgICBjb25maWc7XG5cbiAgICB0aGlzLmRpc2FibGVkID0gZHJhZ2dpbmdEaXNhYmxlZCA9PSBudWxsID8gZmFsc2UgOiBkcmFnZ2luZ0Rpc2FibGVkO1xuICAgIHRoaXMuc29ydGluZ0Rpc2FibGVkID0gc29ydGluZ0Rpc2FibGVkID09IG51bGwgPyBmYWxzZSA6IHNvcnRpbmdEaXNhYmxlZDtcbiAgICB0aGlzLmF1dG9TY3JvbGxEaXNhYmxlZCA9IGxpc3RBdXRvU2Nyb2xsRGlzYWJsZWQgPT0gbnVsbCA/IGZhbHNlIDogbGlzdEF1dG9TY3JvbGxEaXNhYmxlZDtcbiAgICB0aGlzLm9yaWVudGF0aW9uID0gbGlzdE9yaWVudGF0aW9uIHx8ICd2ZXJ0aWNhbCc7XG5cbiAgICBpZiAobG9ja0F4aXMpIHtcbiAgICAgIHRoaXMubG9ja0F4aXMgPSBsb2NrQXhpcztcbiAgICB9XG4gIH1cblxuICAvKiogU3luY3MgdXAgdGhlIHJlZ2lzdGVyZWQgZHJhZyBpdGVtcyB3aXRoIHVuZGVybHlpbmcgZHJvcCBsaXN0IHJlZi4gKi9cbiAgcHJpdmF0ZSBfc3luY0l0ZW1zV2l0aFJlZigpIHtcbiAgICB0aGlzLl9kcm9wTGlzdFJlZi53aXRoSXRlbXModGhpcy5nZXRTb3J0ZWRJdGVtcygpLm1hcChpdGVtID0+IGl0ZW0uX2RyYWdSZWYpKTtcbiAgfVxufVxuIl19