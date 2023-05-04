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
class CdkDropList {
    /** Keeps track of the drop lists that are currently on the page. */
    static { this._dropLists = []; }
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkDropList, deps: [{ token: i0.ElementRef }, { token: i1.DragDrop }, { token: i0.ChangeDetectorRef }, { token: i2.ScrollDispatcher }, { token: i3.Directionality, optional: true }, { token: CDK_DROP_LIST_GROUP, optional: true, skipSelf: true }, { token: CDK_DRAG_CONFIG, optional: true }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.0", type: CdkDropList, isStandalone: true, selector: "[cdkDropList], cdk-drop-list", inputs: { connectedTo: ["cdkDropListConnectedTo", "connectedTo"], data: ["cdkDropListData", "data"], orientation: ["cdkDropListOrientation", "orientation"], id: "id", lockAxis: ["cdkDropListLockAxis", "lockAxis"], disabled: ["cdkDropListDisabled", "disabled"], sortingDisabled: ["cdkDropListSortingDisabled", "sortingDisabled"], enterPredicate: ["cdkDropListEnterPredicate", "enterPredicate"], sortPredicate: ["cdkDropListSortPredicate", "sortPredicate"], autoScrollDisabled: ["cdkDropListAutoScrollDisabled", "autoScrollDisabled"], autoScrollStep: ["cdkDropListAutoScrollStep", "autoScrollStep"] }, outputs: { dropped: "cdkDropListDropped", entered: "cdkDropListEntered", exited: "cdkDropListExited", sorted: "cdkDropListSorted" }, host: { properties: { "attr.id": "id", "class.cdk-drop-list-disabled": "disabled", "class.cdk-drop-list-dragging": "_dropListRef.isDragging()", "class.cdk-drop-list-receiving": "_dropListRef.isReceiving()" }, classAttribute: "cdk-drop-list" }, providers: [
            // Prevent child drop lists from picking up the same group as their parent.
            { provide: CDK_DROP_LIST_GROUP, useValue: undefined },
            { provide: CDK_DROP_LIST, useExisting: CdkDropList },
        ], exportAs: ["cdkDropList"], ngImport: i0 }); }
}
export { CdkDropList };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkDropList, decorators: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZGlyZWN0aXZlcy9kcm9wLWxpc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUVMLFdBQVcsRUFDWCxvQkFBb0IsRUFDcEIscUJBQXFCLEdBRXRCLE1BQU0sdUJBQXVCLENBQUM7QUFDL0IsT0FBTyxFQUNMLFVBQVUsRUFDVixZQUFZLEVBQ1osS0FBSyxFQUVMLE1BQU0sRUFDTixRQUFRLEVBQ1IsU0FBUyxFQUNULGlCQUFpQixFQUNqQixRQUFRLEVBQ1IsTUFBTSxFQUNOLGNBQWMsR0FDZixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFHeEQsT0FBTyxFQUFDLG1CQUFtQixFQUFFLGdCQUFnQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFHeEUsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUN0QyxPQUFPLEVBQWdELGVBQWUsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN4RixPQUFPLEVBQUMsS0FBSyxFQUFFLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUNwQyxPQUFPLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGNBQWMsQ0FBQzs7Ozs7O0FBRS9DLDBEQUEwRDtBQUMxRCxJQUFJLGdCQUFnQixHQUFHLENBQUMsQ0FBQztBQVN6Qjs7OztHQUlHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sYUFBYSxHQUFHLElBQUksY0FBYyxDQUFjLGFBQWEsQ0FBQyxDQUFDO0FBRTVFLHFEQUFxRDtBQUNyRCxNQWlCYSxXQUFXO0lB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Z0JBZTVCLGVBQWU7c0JBRGQsS0FBSzt1QkFBQyw0QkFBNEI7Z0JBUW5DLGNBQWM7c0JBRGIsS0FBSzt1QkFBQywyQkFBMkI7Z0JBS2xDLGFBQWE7c0JBRFosS0FBSzt1QkFBQywwQkFBMEI7Z0JBS2pDLGtCQUFrQjtzQkFEakIsS0FBSzt1QkFBQywrQkFBK0I7Z0JBS3RDLGNBQWM7c0JBRGIsS0FBSzt1QkFBQywyQkFBMkI7Z0JBS3pCLE9BQU87c0JBRGYsTUFBTTt1QkFBQyxvQkFBb0I7Z0JBT25CLE9BQU87c0JBRGYsTUFBTTt1QkFBQyxvQkFBb0I7Z0JBUW5CLE1BQU07c0JBRGQsTUFBTTt1QkFBQyxtQkFBbUI7Z0JBS2xCLE1BQU07c0JBRGQsTUFBTTt1QkFBQyxtQkFBbUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgQm9vbGVhbklucHV0LFxuICBjb2VyY2VBcnJheSxcbiAgY29lcmNlTnVtYmVyUHJvcGVydHksXG4gIGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSxcbiAgTnVtYmVySW5wdXQsXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge1xuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIElucHV0LFxuICBPbkRlc3Ryb3ksXG4gIE91dHB1dCxcbiAgT3B0aW9uYWwsXG4gIERpcmVjdGl2ZSxcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIFNraXBTZWxmLFxuICBJbmplY3QsXG4gIEluamVjdGlvblRva2VuLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7U2Nyb2xsRGlzcGF0Y2hlcn0gZnJvbSAnQGFuZ3VsYXIvY2RrL3Njcm9sbGluZyc7XG5pbXBvcnQge0Nka0RyYWd9IGZyb20gJy4vZHJhZyc7XG5pbXBvcnQge0Nka0RyYWdEcm9wLCBDZGtEcmFnRW50ZXIsIENka0RyYWdFeGl0LCBDZGtEcmFnU29ydEV2ZW50fSBmcm9tICcuLi9kcmFnLWV2ZW50cyc7XG5pbXBvcnQge0NES19EUk9QX0xJU1RfR1JPVVAsIENka0Ryb3BMaXN0R3JvdXB9IGZyb20gJy4vZHJvcC1saXN0LWdyb3VwJztcbmltcG9ydCB7RHJvcExpc3RSZWZ9IGZyb20gJy4uL2Ryb3AtbGlzdC1yZWYnO1xuaW1wb3J0IHtEcmFnUmVmfSBmcm9tICcuLi9kcmFnLXJlZic7XG5pbXBvcnQge0RyYWdEcm9wfSBmcm9tICcuLi9kcmFnLWRyb3AnO1xuaW1wb3J0IHtEcm9wTGlzdE9yaWVudGF0aW9uLCBEcmFnQXhpcywgRHJhZ0Ryb3BDb25maWcsIENES19EUkFHX0NPTkZJR30gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IHttZXJnZSwgU3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3N0YXJ0V2l0aCwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge2Fzc2VydEVsZW1lbnROb2RlfSBmcm9tICcuL2Fzc2VydGlvbnMnO1xuXG4vKiogQ291bnRlciB1c2VkIHRvIGdlbmVyYXRlIHVuaXF1ZSBpZHMgZm9yIGRyb3Agem9uZXMuICovXG5sZXQgX3VuaXF1ZUlkQ291bnRlciA9IDA7XG5cbi8qKlxuICogSW50ZXJuYWwgY29tcGlsZS10aW1lLW9ubHkgcmVwcmVzZW50YXRpb24gb2YgYSBgQ2RrRHJvcExpc3RgLlxuICogVXNlZCB0byBhdm9pZCBjaXJjdWxhciBpbXBvcnQgaXNzdWVzIGJldHdlZW4gdGhlIGBDZGtEcm9wTGlzdGAgYW5kIHRoZSBgQ2RrRHJhZ2AuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2RrRHJvcExpc3RJbnRlcm5hbCBleHRlbmRzIENka0Ryb3BMaXN0IHt9XG5cbi8qKlxuICogSW5qZWN0aW9uIHRva2VuIHRoYXQgY2FuIGJlIHVzZWQgdG8gcmVmZXJlbmNlIGluc3RhbmNlcyBvZiBgQ2RrRHJvcExpc3RgLiBJdCBzZXJ2ZXMgYXNcbiAqIGFsdGVybmF0aXZlIHRva2VuIHRvIHRoZSBhY3R1YWwgYENka0Ryb3BMaXN0YCBjbGFzcyB3aGljaCBjb3VsZCBjYXVzZSB1bm5lY2Vzc2FyeVxuICogcmV0ZW50aW9uIG9mIHRoZSBjbGFzcyBhbmQgaXRzIGRpcmVjdGl2ZSBtZXRhZGF0YS5cbiAqL1xuZXhwb3J0IGNvbnN0IENES19EUk9QX0xJU1QgPSBuZXcgSW5qZWN0aW9uVG9rZW48Q2RrRHJvcExpc3Q+KCdDZGtEcm9wTGlzdCcpO1xuXG4vKiogQ29udGFpbmVyIHRoYXQgd3JhcHMgYSBzZXQgb2YgZHJhZ2dhYmxlIGl0ZW1zLiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka0Ryb3BMaXN0XSwgY2RrLWRyb3AtbGlzdCcsXG4gIGV4cG9ydEFzOiAnY2RrRHJvcExpc3QnLFxuICBzdGFuZGFsb25lOiB0cnVlLFxuICBwcm92aWRlcnM6IFtcbiAgICAvLyBQcmV2ZW50IGNoaWxkIGRyb3AgbGlzdHMgZnJvbSBwaWNraW5nIHVwIHRoZSBzYW1lIGdyb3VwIGFzIHRoZWlyIHBhcmVudC5cbiAgICB7cHJvdmlkZTogQ0RLX0RST1BfTElTVF9HUk9VUCwgdXNlVmFsdWU6IHVuZGVmaW5lZH0sXG4gICAge3Byb3ZpZGU6IENES19EUk9QX0xJU1QsIHVzZUV4aXN0aW5nOiBDZGtEcm9wTGlzdH0sXG4gIF0sXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLWRyb3AtbGlzdCcsXG4gICAgJ1thdHRyLmlkXSc6ICdpZCcsXG4gICAgJ1tjbGFzcy5jZGstZHJvcC1saXN0LWRpc2FibGVkXSc6ICdkaXNhYmxlZCcsXG4gICAgJ1tjbGFzcy5jZGstZHJvcC1saXN0LWRyYWdnaW5nXSc6ICdfZHJvcExpc3RSZWYuaXNEcmFnZ2luZygpJyxcbiAgICAnW2NsYXNzLmNkay1kcm9wLWxpc3QtcmVjZWl2aW5nXSc6ICdfZHJvcExpc3RSZWYuaXNSZWNlaXZpbmcoKScsXG4gIH0sXG59KVxuZXhwb3J0IGNsYXNzIENka0Ryb3BMaXN0PFQgPSBhbnk+IGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIEVtaXRzIHdoZW4gdGhlIGxpc3QgaGFzIGJlZW4gZGVzdHJveWVkLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9kZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBlbGVtZW50J3Mgc2Nyb2xsYWJsZSBwYXJlbnRzIGhhdmUgYmVlbiByZXNvbHZlZC4gKi9cbiAgcHJpdmF0ZSBfc2Nyb2xsYWJsZVBhcmVudHNSZXNvbHZlZDogYm9vbGVhbjtcblxuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIGRyb3AgbGlzdHMgdGhhdCBhcmUgY3VycmVudGx5IG9uIHRoZSBwYWdlLiAqL1xuICBwcml2YXRlIHN0YXRpYyBfZHJvcExpc3RzOiBDZGtEcm9wTGlzdFtdID0gW107XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgdW5kZXJseWluZyBkcm9wIGxpc3QgaW5zdGFuY2UuICovXG4gIF9kcm9wTGlzdFJlZjogRHJvcExpc3RSZWY8Q2RrRHJvcExpc3Q8VD4+O1xuXG4gIC8qKlxuICAgKiBPdGhlciBkcmFnZ2FibGUgY29udGFpbmVycyB0aGF0IHRoaXMgY29udGFpbmVyIGlzIGNvbm5lY3RlZCB0byBhbmQgaW50byB3aGljaCB0aGVcbiAgICogY29udGFpbmVyJ3MgaXRlbXMgY2FuIGJlIHRyYW5zZmVycmVkLiBDYW4gZWl0aGVyIGJlIHJlZmVyZW5jZXMgdG8gb3RoZXIgZHJvcCBjb250YWluZXJzLFxuICAgKiBvciB0aGVpciB1bmlxdWUgSURzLlxuICAgKi9cbiAgQElucHV0KCdjZGtEcm9wTGlzdENvbm5lY3RlZFRvJylcbiAgY29ubmVjdGVkVG86IChDZGtEcm9wTGlzdCB8IHN0cmluZylbXSB8IENka0Ryb3BMaXN0IHwgc3RyaW5nID0gW107XG5cbiAgLyoqIEFyYml0cmFyeSBkYXRhIHRvIGF0dGFjaCB0byB0aGlzIGNvbnRhaW5lci4gKi9cbiAgQElucHV0KCdjZGtEcm9wTGlzdERhdGEnKSBkYXRhOiBUO1xuXG4gIC8qKiBEaXJlY3Rpb24gaW4gd2hpY2ggdGhlIGxpc3QgaXMgb3JpZW50ZWQuICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3RPcmllbnRhdGlvbicpIG9yaWVudGF0aW9uOiBEcm9wTGlzdE9yaWVudGF0aW9uO1xuXG4gIC8qKlxuICAgKiBVbmlxdWUgSUQgZm9yIHRoZSBkcm9wIHpvbmUuIENhbiBiZSB1c2VkIGFzIGEgcmVmZXJlbmNlXG4gICAqIGluIHRoZSBgY29ubmVjdGVkVG9gIG9mIGFub3RoZXIgYENka0Ryb3BMaXN0YC5cbiAgICovXG4gIEBJbnB1dCgpIGlkOiBzdHJpbmcgPSBgY2RrLWRyb3AtbGlzdC0ke191bmlxdWVJZENvdW50ZXIrK31gO1xuXG4gIC8qKiBMb2NrcyB0aGUgcG9zaXRpb24gb2YgdGhlIGRyYWdnYWJsZSBlbGVtZW50cyBpbnNpZGUgdGhlIGNvbnRhaW5lciBhbG9uZyB0aGUgc3BlY2lmaWVkIGF4aXMuICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3RMb2NrQXhpcycpIGxvY2tBeGlzOiBEcmFnQXhpcztcblxuICAvKiogV2hldGhlciBzdGFydGluZyBhIGRyYWdnaW5nIHNlcXVlbmNlIGZyb20gdGhpcyBjb250YWluZXIgaXMgZGlzYWJsZWQuICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3REaXNhYmxlZCcpXG4gIGdldCBkaXNhYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fZGlzYWJsZWQgfHwgKCEhdGhpcy5fZ3JvdXAgJiYgdGhpcy5fZ3JvdXAuZGlzYWJsZWQpO1xuICB9XG4gIHNldCBkaXNhYmxlZCh2YWx1ZTogQm9vbGVhbklucHV0KSB7XG4gICAgLy8gVXN1YWxseSB3ZSBzeW5jIHRoZSBkaXJlY3RpdmUgYW5kIHJlZiBzdGF0ZSByaWdodCBiZWZvcmUgZHJhZ2dpbmcgc3RhcnRzLCBpbiBvcmRlciB0byBoYXZlXG4gICAgLy8gYSBzaW5nbGUgcG9pbnQgb2YgZmFpbHVyZSBhbmQgdG8gYXZvaWQgaGF2aW5nIHRvIHVzZSBzZXR0ZXJzIGZvciBldmVyeXRoaW5nLiBgZGlzYWJsZWRgIGlzXG4gICAgLy8gYSBzcGVjaWFsIGNhc2UsIGJlY2F1c2UgaXQgY2FuIHByZXZlbnQgdGhlIGBiZWZvcmVTdGFydGVkYCBldmVudCBmcm9tIGZpcmluZywgd2hpY2ggY2FuIGxvY2tcbiAgICAvLyB0aGUgdXNlciBpbiBhIGRpc2FibGVkIHN0YXRlLCBzbyB3ZSBhbHNvIG5lZWQgdG8gc3luYyBpdCBhcyBpdCdzIGJlaW5nIHNldC5cbiAgICB0aGlzLl9kcm9wTGlzdFJlZi5kaXNhYmxlZCA9IHRoaXMuX2Rpc2FibGVkID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgfVxuICBwcml2YXRlIF9kaXNhYmxlZDogYm9vbGVhbjtcblxuICAvKiogV2hldGhlciBzb3J0aW5nIHdpdGhpbiB0aGlzIGRyb3AgbGlzdCBpcyBkaXNhYmxlZC4gKi9cbiAgQElucHV0KCdjZGtEcm9wTGlzdFNvcnRpbmdEaXNhYmxlZCcpXG4gIHNvcnRpbmdEaXNhYmxlZDogQm9vbGVhbklucHV0O1xuXG4gIC8qKlxuICAgKiBGdW5jdGlvbiB0aGF0IGlzIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYW4gaXRlbVxuICAgKiBpcyBhbGxvd2VkIHRvIGJlIG1vdmVkIGludG8gYSBkcm9wIGNvbnRhaW5lci5cbiAgICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3RFbnRlclByZWRpY2F0ZScpXG4gIGVudGVyUHJlZGljYXRlOiAoZHJhZzogQ2RrRHJhZywgZHJvcDogQ2RrRHJvcExpc3QpID0+IGJvb2xlYW4gPSAoKSA9PiB0cnVlO1xuXG4gIC8qKiBGdW5jdGlvbnMgdGhhdCBpcyB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIGFuIGl0ZW0gY2FuIGJlIHNvcnRlZCBpbnRvIGEgcGFydGljdWxhciBpbmRleC4gKi9cbiAgQElucHV0KCdjZGtEcm9wTGlzdFNvcnRQcmVkaWNhdGUnKVxuICBzb3J0UHJlZGljYXRlOiAoaW5kZXg6IG51bWJlciwgZHJhZzogQ2RrRHJhZywgZHJvcDogQ2RrRHJvcExpc3QpID0+IGJvb2xlYW4gPSAoKSA9PiB0cnVlO1xuXG4gIC8qKiBXaGV0aGVyIHRvIGF1dG8tc2Nyb2xsIHRoZSB2aWV3IHdoZW4gdGhlIHVzZXIgbW92ZXMgdGhlaXIgcG9pbnRlciBjbG9zZSB0byB0aGUgZWRnZXMuICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3RBdXRvU2Nyb2xsRGlzYWJsZWQnKVxuICBhdXRvU2Nyb2xsRGlzYWJsZWQ6IEJvb2xlYW5JbnB1dDtcblxuICAvKiogTnVtYmVyIG9mIHBpeGVscyB0byBzY3JvbGwgZm9yIGVhY2ggZnJhbWUgd2hlbiBhdXRvLXNjcm9sbGluZyBhbiBlbGVtZW50LiAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0QXV0b1Njcm9sbFN0ZXAnKVxuICBhdXRvU2Nyb2xsU3RlcDogTnVtYmVySW5wdXQ7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgZHJvcHMgYW4gaXRlbSBpbnNpZGUgdGhlIGNvbnRhaW5lci4gKi9cbiAgQE91dHB1dCgnY2RrRHJvcExpc3REcm9wcGVkJylcbiAgcmVhZG9ubHkgZHJvcHBlZDogRXZlbnRFbWl0dGVyPENka0RyYWdEcm9wPFQsIGFueT4+ID0gbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnRHJvcDxULCBhbnk+PigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGhhcyBtb3ZlZCBhIG5ldyBkcmFnIGl0ZW0gaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICovXG4gIEBPdXRwdXQoJ2Nka0Ryb3BMaXN0RW50ZXJlZCcpXG4gIHJlYWRvbmx5IGVudGVyZWQ6IEV2ZW50RW1pdHRlcjxDZGtEcmFnRW50ZXI8VD4+ID0gbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnRW50ZXI8VD4+KCk7XG5cbiAgLyoqXG4gICAqIEVtaXRzIHdoZW4gdGhlIHVzZXIgcmVtb3ZlcyBhbiBpdGVtIGZyb20gdGhlIGNvbnRhaW5lclxuICAgKiBieSBkcmFnZ2luZyBpdCBpbnRvIGFub3RoZXIgY29udGFpbmVyLlxuICAgKi9cbiAgQE91dHB1dCgnY2RrRHJvcExpc3RFeGl0ZWQnKVxuICByZWFkb25seSBleGl0ZWQ6IEV2ZW50RW1pdHRlcjxDZGtEcmFnRXhpdDxUPj4gPSBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdFeGl0PFQ+PigpO1xuXG4gIC8qKiBFbWl0cyBhcyB0aGUgdXNlciBpcyBzd2FwcGluZyBpdGVtcyB3aGlsZSBhY3RpdmVseSBkcmFnZ2luZy4gKi9cbiAgQE91dHB1dCgnY2RrRHJvcExpc3RTb3J0ZWQnKVxuICByZWFkb25seSBzb3J0ZWQ6IEV2ZW50RW1pdHRlcjxDZGtEcmFnU29ydEV2ZW50PFQ+PiA9IG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ1NvcnRFdmVudDxUPj4oKTtcblxuICAvKipcbiAgICogS2VlcHMgdHJhY2sgb2YgdGhlIGl0ZW1zIHRoYXQgYXJlIHJlZ2lzdGVyZWQgd2l0aCB0aGlzIGNvbnRhaW5lci4gSGlzdG9yaWNhbGx5IHdlIHVzZWQgdG9cbiAgICogZG8gdGhpcyB3aXRoIGEgYENvbnRlbnRDaGlsZHJlbmAgcXVlcnksIGhvd2V2ZXIgcXVlcmllcyBkb24ndCBoYW5kbGUgdHJhbnNwbGFudGVkIHZpZXdzIHZlcnlcbiAgICogd2VsbCB3aGljaCBtZWFucyB0aGF0IHdlIGNhbid0IGhhbmRsZSBjYXNlcyBsaWtlIGRyYWdnaW5nIHRoZSBoZWFkZXJzIG9mIGEgYG1hdC10YWJsZWBcbiAgICogY29ycmVjdGx5LiBXaGF0IHdlIGRvIGluc3RlYWQgaXMgdG8gaGF2ZSB0aGUgaXRlbXMgcmVnaXN0ZXIgdGhlbXNlbHZlcyB3aXRoIHRoZSBjb250YWluZXJcbiAgICogYW5kIHRoZW4gd2Ugc29ydCB0aGVtIGJhc2VkIG9uIHRoZWlyIHBvc2l0aW9uIGluIHRoZSBET00uXG4gICAqL1xuICBwcml2YXRlIF91bnNvcnRlZEl0ZW1zID0gbmV3IFNldDxDZGtEcmFnPigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIC8qKiBFbGVtZW50IHRoYXQgdGhlIGRyb3AgbGlzdCBpcyBhdHRhY2hlZCB0by4gKi9cbiAgICBwdWJsaWMgZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgZHJhZ0Ryb3A6IERyYWdEcm9wLFxuICAgIHByaXZhdGUgX2NoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBwcml2YXRlIF9zY3JvbGxEaXNwYXRjaGVyOiBTY3JvbGxEaXNwYXRjaGVyLFxuICAgIEBPcHRpb25hbCgpIHByaXZhdGUgX2Rpcj86IERpcmVjdGlvbmFsaXR5LFxuICAgIEBPcHRpb25hbCgpXG4gICAgQEluamVjdChDREtfRFJPUF9MSVNUX0dST1VQKVxuICAgIEBTa2lwU2VsZigpXG4gICAgcHJpdmF0ZSBfZ3JvdXA/OiBDZGtEcm9wTGlzdEdyb3VwPENka0Ryb3BMaXN0PixcbiAgICBAT3B0aW9uYWwoKSBASW5qZWN0KENES19EUkFHX0NPTkZJRykgY29uZmlnPzogRHJhZ0Ryb3BDb25maWcsXG4gICkge1xuICAgIGlmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpIHtcbiAgICAgIGFzc2VydEVsZW1lbnROb2RlKGVsZW1lbnQubmF0aXZlRWxlbWVudCwgJ2Nka0Ryb3BMaXN0Jyk7XG4gICAgfVxuXG4gICAgdGhpcy5fZHJvcExpc3RSZWYgPSBkcmFnRHJvcC5jcmVhdGVEcm9wTGlzdChlbGVtZW50KTtcbiAgICB0aGlzLl9kcm9wTGlzdFJlZi5kYXRhID0gdGhpcztcblxuICAgIGlmIChjb25maWcpIHtcbiAgICAgIHRoaXMuX2Fzc2lnbkRlZmF1bHRzKGNvbmZpZyk7XG4gICAgfVxuXG4gICAgdGhpcy5fZHJvcExpc3RSZWYuZW50ZXJQcmVkaWNhdGUgPSAoZHJhZzogRHJhZ1JlZjxDZGtEcmFnPiwgZHJvcDogRHJvcExpc3RSZWY8Q2RrRHJvcExpc3Q+KSA9PiB7XG4gICAgICByZXR1cm4gdGhpcy5lbnRlclByZWRpY2F0ZShkcmFnLmRhdGEsIGRyb3AuZGF0YSk7XG4gICAgfTtcblxuICAgIHRoaXMuX2Ryb3BMaXN0UmVmLnNvcnRQcmVkaWNhdGUgPSAoXG4gICAgICBpbmRleDogbnVtYmVyLFxuICAgICAgZHJhZzogRHJhZ1JlZjxDZGtEcmFnPixcbiAgICAgIGRyb3A6IERyb3BMaXN0UmVmPENka0Ryb3BMaXN0PixcbiAgICApID0+IHtcbiAgICAgIHJldHVybiB0aGlzLnNvcnRQcmVkaWNhdGUoaW5kZXgsIGRyYWcuZGF0YSwgZHJvcC5kYXRhKTtcbiAgICB9O1xuXG4gICAgdGhpcy5fc2V0dXBJbnB1dFN5bmNTdWJzY3JpcHRpb24odGhpcy5fZHJvcExpc3RSZWYpO1xuICAgIHRoaXMuX2hhbmRsZUV2ZW50cyh0aGlzLl9kcm9wTGlzdFJlZik7XG4gICAgQ2RrRHJvcExpc3QuX2Ryb3BMaXN0cy5wdXNoKHRoaXMpO1xuXG4gICAgaWYgKF9ncm91cCkge1xuICAgICAgX2dyb3VwLl9pdGVtcy5hZGQodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFJlZ2lzdGVycyBhbiBpdGVtcyB3aXRoIHRoZSBkcm9wIGxpc3QuICovXG4gIGFkZEl0ZW0oaXRlbTogQ2RrRHJhZyk6IHZvaWQge1xuICAgIHRoaXMuX3Vuc29ydGVkSXRlbXMuYWRkKGl0ZW0pO1xuXG4gICAgaWYgKHRoaXMuX2Ryb3BMaXN0UmVmLmlzRHJhZ2dpbmcoKSkge1xuICAgICAgdGhpcy5fc3luY0l0ZW1zV2l0aFJlZigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSZW1vdmVzIGFuIGl0ZW0gZnJvbSB0aGUgZHJvcCBsaXN0LiAqL1xuICByZW1vdmVJdGVtKGl0ZW06IENka0RyYWcpOiB2b2lkIHtcbiAgICB0aGlzLl91bnNvcnRlZEl0ZW1zLmRlbGV0ZShpdGVtKTtcblxuICAgIGlmICh0aGlzLl9kcm9wTGlzdFJlZi5pc0RyYWdnaW5nKCkpIHtcbiAgICAgIHRoaXMuX3N5bmNJdGVtc1dpdGhSZWYoKTtcbiAgICB9XG4gIH1cblxuICAvKiogR2V0cyB0aGUgcmVnaXN0ZXJlZCBpdGVtcyBpbiB0aGUgbGlzdCwgc29ydGVkIGJ5IHRoZWlyIHBvc2l0aW9uIGluIHRoZSBET00uICovXG4gIGdldFNvcnRlZEl0ZW1zKCk6IENka0RyYWdbXSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5fdW5zb3J0ZWRJdGVtcykuc29ydCgoYTogQ2RrRHJhZywgYjogQ2RrRHJhZykgPT4ge1xuICAgICAgY29uc3QgZG9jdW1lbnRQb3NpdGlvbiA9IGEuX2RyYWdSZWZcbiAgICAgICAgLmdldFZpc2libGVFbGVtZW50KClcbiAgICAgICAgLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKGIuX2RyYWdSZWYuZ2V0VmlzaWJsZUVsZW1lbnQoKSk7XG5cbiAgICAgIC8vIGBjb21wYXJlRG9jdW1lbnRQb3NpdGlvbmAgcmV0dXJucyBhIGJpdG1hc2sgc28gd2UgaGF2ZSB0byB1c2UgYSBiaXR3aXNlIG9wZXJhdG9yLlxuICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL05vZGUvY29tcGFyZURvY3VtZW50UG9zaXRpb25cbiAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1iaXR3aXNlXG4gICAgICByZXR1cm4gZG9jdW1lbnRQb3NpdGlvbiAmIE5vZGUuRE9DVU1FTlRfUE9TSVRJT05fRk9MTE9XSU5HID8gLTEgOiAxO1xuICAgIH0pO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgY29uc3QgaW5kZXggPSBDZGtEcm9wTGlzdC5fZHJvcExpc3RzLmluZGV4T2YodGhpcyk7XG5cbiAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgQ2RrRHJvcExpc3QuX2Ryb3BMaXN0cy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ncm91cCkge1xuICAgICAgdGhpcy5fZ3JvdXAuX2l0ZW1zLmRlbGV0ZSh0aGlzKTtcbiAgICB9XG5cbiAgICB0aGlzLl91bnNvcnRlZEl0ZW1zLmNsZWFyKCk7XG4gICAgdGhpcy5fZHJvcExpc3RSZWYuZGlzcG9zZSgpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5uZXh0KCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gIH1cblxuICAvKiogU3luY3MgdGhlIGlucHV0cyBvZiB0aGUgQ2RrRHJvcExpc3Qgd2l0aCB0aGUgb3B0aW9ucyBvZiB0aGUgdW5kZXJseWluZyBEcm9wTGlzdFJlZi4gKi9cbiAgcHJpdmF0ZSBfc2V0dXBJbnB1dFN5bmNTdWJzY3JpcHRpb24ocmVmOiBEcm9wTGlzdFJlZjxDZGtEcm9wTGlzdD4pIHtcbiAgICBpZiAodGhpcy5fZGlyKSB7XG4gICAgICB0aGlzLl9kaXIuY2hhbmdlXG4gICAgICAgIC5waXBlKHN0YXJ0V2l0aCh0aGlzLl9kaXIudmFsdWUpLCB0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSlcbiAgICAgICAgLnN1YnNjcmliZSh2YWx1ZSA9PiByZWYud2l0aERpcmVjdGlvbih2YWx1ZSkpO1xuICAgIH1cblxuICAgIHJlZi5iZWZvcmVTdGFydGVkLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICBjb25zdCBzaWJsaW5ncyA9IGNvZXJjZUFycmF5KHRoaXMuY29ubmVjdGVkVG8pLm1hcChkcm9wID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBkcm9wID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIGNvbnN0IGNvcnJlc3BvbmRpbmdEcm9wTGlzdCA9IENka0Ryb3BMaXN0Ll9kcm9wTGlzdHMuZmluZChsaXN0ID0+IGxpc3QuaWQgPT09IGRyb3ApO1xuXG4gICAgICAgICAgaWYgKCFjb3JyZXNwb25kaW5nRHJvcExpc3QgJiYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgQ2RrRHJvcExpc3QgY291bGQgbm90IGZpbmQgY29ubmVjdGVkIGRyb3AgbGlzdCB3aXRoIGlkIFwiJHtkcm9wfVwiYCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGNvcnJlc3BvbmRpbmdEcm9wTGlzdCE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZHJvcDtcbiAgICAgIH0pO1xuXG4gICAgICBpZiAodGhpcy5fZ3JvdXApIHtcbiAgICAgICAgdGhpcy5fZ3JvdXAuX2l0ZW1zLmZvckVhY2goZHJvcCA9PiB7XG4gICAgICAgICAgaWYgKHNpYmxpbmdzLmluZGV4T2YoZHJvcCkgPT09IC0xKSB7XG4gICAgICAgICAgICBzaWJsaW5ncy5wdXNoKGRyb3ApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIE5vdGUgdGhhdCB3ZSByZXNvbHZlIHRoZSBzY3JvbGxhYmxlIHBhcmVudHMgaGVyZSBzbyB0aGF0IHdlIGRlbGF5IHRoZSByZXNvbHV0aW9uXG4gICAgICAvLyBhcyBsb25nIGFzIHBvc3NpYmxlLCBlbnN1cmluZyB0aGF0IHRoZSBlbGVtZW50IGlzIGluIGl0cyBmaW5hbCBwbGFjZSBpbiB0aGUgRE9NLlxuICAgICAgaWYgKCF0aGlzLl9zY3JvbGxhYmxlUGFyZW50c1Jlc29sdmVkKSB7XG4gICAgICAgIGNvbnN0IHNjcm9sbGFibGVQYXJlbnRzID0gdGhpcy5fc2Nyb2xsRGlzcGF0Y2hlclxuICAgICAgICAgIC5nZXRBbmNlc3RvclNjcm9sbENvbnRhaW5lcnModGhpcy5lbGVtZW50KVxuICAgICAgICAgIC5tYXAoc2Nyb2xsYWJsZSA9PiBzY3JvbGxhYmxlLmdldEVsZW1lbnRSZWYoKS5uYXRpdmVFbGVtZW50KTtcbiAgICAgICAgdGhpcy5fZHJvcExpc3RSZWYud2l0aFNjcm9sbGFibGVQYXJlbnRzKHNjcm9sbGFibGVQYXJlbnRzKTtcblxuICAgICAgICAvLyBPbmx5IGRvIHRoaXMgb25jZSBzaW5jZSBpdCBpbnZvbHZlcyB0cmF2ZXJzaW5nIHRoZSBET00gYW5kIHRoZSBwYXJlbnRzXG4gICAgICAgIC8vIHNob3VsZG4ndCBiZSBhYmxlIHRvIGNoYW5nZSB3aXRob3V0IHRoZSBkcm9wIGxpc3QgYmVpbmcgZGVzdHJveWVkLlxuICAgICAgICB0aGlzLl9zY3JvbGxhYmxlUGFyZW50c1Jlc29sdmVkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgcmVmLmRpc2FibGVkID0gdGhpcy5kaXNhYmxlZDtcbiAgICAgIHJlZi5sb2NrQXhpcyA9IHRoaXMubG9ja0F4aXM7XG4gICAgICByZWYuc29ydGluZ0Rpc2FibGVkID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHRoaXMuc29ydGluZ0Rpc2FibGVkKTtcbiAgICAgIHJlZi5hdXRvU2Nyb2xsRGlzYWJsZWQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodGhpcy5hdXRvU2Nyb2xsRGlzYWJsZWQpO1xuICAgICAgcmVmLmF1dG9TY3JvbGxTdGVwID0gY29lcmNlTnVtYmVyUHJvcGVydHkodGhpcy5hdXRvU2Nyb2xsU3RlcCwgMik7XG4gICAgICByZWZcbiAgICAgICAgLmNvbm5lY3RlZFRvKHNpYmxpbmdzLmZpbHRlcihkcm9wID0+IGRyb3AgJiYgZHJvcCAhPT0gdGhpcykubWFwKGxpc3QgPT4gbGlzdC5fZHJvcExpc3RSZWYpKVxuICAgICAgICAud2l0aE9yaWVudGF0aW9uKHRoaXMub3JpZW50YXRpb24pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIEhhbmRsZXMgZXZlbnRzIGZyb20gdGhlIHVuZGVybHlpbmcgRHJvcExpc3RSZWYuICovXG4gIHByaXZhdGUgX2hhbmRsZUV2ZW50cyhyZWY6IERyb3BMaXN0UmVmPENka0Ryb3BMaXN0Pikge1xuICAgIHJlZi5iZWZvcmVTdGFydGVkLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICB0aGlzLl9zeW5jSXRlbXNXaXRoUmVmKCk7XG4gICAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgICB9KTtcblxuICAgIHJlZi5lbnRlcmVkLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICB0aGlzLmVudGVyZWQuZW1pdCh7XG4gICAgICAgIGNvbnRhaW5lcjogdGhpcyxcbiAgICAgICAgaXRlbTogZXZlbnQuaXRlbS5kYXRhLFxuICAgICAgICBjdXJyZW50SW5kZXg6IGV2ZW50LmN1cnJlbnRJbmRleCxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmVmLmV4aXRlZC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgdGhpcy5leGl0ZWQuZW1pdCh7XG4gICAgICAgIGNvbnRhaW5lcjogdGhpcyxcbiAgICAgICAgaXRlbTogZXZlbnQuaXRlbS5kYXRhLFxuICAgICAgfSk7XG4gICAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgICB9KTtcblxuICAgIHJlZi5zb3J0ZWQuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgIHRoaXMuc29ydGVkLmVtaXQoe1xuICAgICAgICBwcmV2aW91c0luZGV4OiBldmVudC5wcmV2aW91c0luZGV4LFxuICAgICAgICBjdXJyZW50SW5kZXg6IGV2ZW50LmN1cnJlbnRJbmRleCxcbiAgICAgICAgY29udGFpbmVyOiB0aGlzLFxuICAgICAgICBpdGVtOiBldmVudC5pdGVtLmRhdGEsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJlZi5kcm9wcGVkLnN1YnNjcmliZShkcm9wRXZlbnQgPT4ge1xuICAgICAgdGhpcy5kcm9wcGVkLmVtaXQoe1xuICAgICAgICBwcmV2aW91c0luZGV4OiBkcm9wRXZlbnQucHJldmlvdXNJbmRleCxcbiAgICAgICAgY3VycmVudEluZGV4OiBkcm9wRXZlbnQuY3VycmVudEluZGV4LFxuICAgICAgICBwcmV2aW91c0NvbnRhaW5lcjogZHJvcEV2ZW50LnByZXZpb3VzQ29udGFpbmVyLmRhdGEsXG4gICAgICAgIGNvbnRhaW5lcjogZHJvcEV2ZW50LmNvbnRhaW5lci5kYXRhLFxuICAgICAgICBpdGVtOiBkcm9wRXZlbnQuaXRlbS5kYXRhLFxuICAgICAgICBpc1BvaW50ZXJPdmVyQ29udGFpbmVyOiBkcm9wRXZlbnQuaXNQb2ludGVyT3ZlckNvbnRhaW5lcixcbiAgICAgICAgZGlzdGFuY2U6IGRyb3BFdmVudC5kaXN0YW5jZSxcbiAgICAgICAgZHJvcFBvaW50OiBkcm9wRXZlbnQuZHJvcFBvaW50LFxuICAgICAgICBldmVudDogZHJvcEV2ZW50LmV2ZW50LFxuICAgICAgfSk7XG5cbiAgICAgIC8vIE1hcmsgZm9yIGNoZWNrIHNpbmNlIGFsbCBvZiB0aGVzZSBldmVudHMgcnVuIG91dHNpZGUgb2YgY2hhbmdlXG4gICAgICAvLyBkZXRlY3Rpb24gYW5kIHdlJ3JlIG5vdCBndWFyYW50ZWVkIGZvciBzb21ldGhpbmcgZWxzZSB0byBoYXZlIHRyaWdnZXJlZCBpdC5cbiAgICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICAgIH0pO1xuXG4gICAgbWVyZ2UocmVmLnJlY2VpdmluZ1N0YXJ0ZWQsIHJlZi5yZWNlaXZpbmdTdG9wcGVkKS5zdWJzY3JpYmUoKCkgPT5cbiAgICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpLFxuICAgICk7XG4gIH1cblxuICAvKiogQXNzaWducyB0aGUgZGVmYXVsdCBpbnB1dCB2YWx1ZXMgYmFzZWQgb24gYSBwcm92aWRlZCBjb25maWcgb2JqZWN0LiAqL1xuICBwcml2YXRlIF9hc3NpZ25EZWZhdWx0cyhjb25maWc6IERyYWdEcm9wQ29uZmlnKSB7XG4gICAgY29uc3Qge2xvY2tBeGlzLCBkcmFnZ2luZ0Rpc2FibGVkLCBzb3J0aW5nRGlzYWJsZWQsIGxpc3RBdXRvU2Nyb2xsRGlzYWJsZWQsIGxpc3RPcmllbnRhdGlvbn0gPVxuICAgICAgY29uZmlnO1xuXG4gICAgdGhpcy5kaXNhYmxlZCA9IGRyYWdnaW5nRGlzYWJsZWQgPT0gbnVsbCA/IGZhbHNlIDogZHJhZ2dpbmdEaXNhYmxlZDtcbiAgICB0aGlzLnNvcnRpbmdEaXNhYmxlZCA9IHNvcnRpbmdEaXNhYmxlZCA9PSBudWxsID8gZmFsc2UgOiBzb3J0aW5nRGlzYWJsZWQ7XG4gICAgdGhpcy5hdXRvU2Nyb2xsRGlzYWJsZWQgPSBsaXN0QXV0b1Njcm9sbERpc2FibGVkID09IG51bGwgPyBmYWxzZSA6IGxpc3RBdXRvU2Nyb2xsRGlzYWJsZWQ7XG4gICAgdGhpcy5vcmllbnRhdGlvbiA9IGxpc3RPcmllbnRhdGlvbiB8fCAndmVydGljYWwnO1xuXG4gICAgaWYgKGxvY2tBeGlzKSB7XG4gICAgICB0aGlzLmxvY2tBeGlzID0gbG9ja0F4aXM7XG4gICAgfVxuICB9XG5cbiAgLyoqIFN5bmNzIHVwIHRoZSByZWdpc3RlcmVkIGRyYWcgaXRlbXMgd2l0aCB1bmRlcmx5aW5nIGRyb3AgbGlzdCByZWYuICovXG4gIHByaXZhdGUgX3N5bmNJdGVtc1dpdGhSZWYoKSB7XG4gICAgdGhpcy5fZHJvcExpc3RSZWYud2l0aEl0ZW1zKHRoaXMuZ2V0U29ydGVkSXRlbXMoKS5tYXAoaXRlbSA9PiBpdGVtLl9kcmFnUmVmKSk7XG4gIH1cbn1cbiJdfQ==