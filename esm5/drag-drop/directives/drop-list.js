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
import { ScrollDispatcher } from '@angular/cdk/scrolling';
import { CdkDrag, CDK_DROP_LIST } from './drag';
import { CdkDropListGroup } from './drop-list-group';
import { DragDrop } from '../drag-drop';
import { Subject } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';
/** Counter used to generate unique ids for drop zones. */
var _uniqueIdCounter = 0;
var ɵ0 = undefined;
/** Container that wraps a set of draggable items. */
var CdkDropList = /** @class */ (function () {
    function CdkDropList(
    /** Element that the drop list is attached to. */
    element, dragDrop, _changeDetectorRef, _dir, _group, 
    /**
     * @deprecated _scrollDispatcher parameter to become required.
     * @breaking-change 11.0.0
     */
    _scrollDispatcher) {
        var _this = this;
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
        /** Direction in which the list is oriented. */
        this.orientation = 'vertical';
        /**
         * Unique ID for the drop zone. Can be used as a reference
         * in the `connectedTo` of another `CdkDropList`.
         */
        this.id = "cdk-drop-list-" + _uniqueIdCounter++;
        this._disabled = false;
        /** Whether sorting within this drop list is disabled. */
        this.sortingDisabled = false;
        /**
         * Function that is used to determine whether an item
         * is allowed to be moved into a drop container.
         */
        this.enterPredicate = function () { return true; };
        /** Whether to auto-scroll the view when the user moves their pointer close to the edges. */
        this.autoScrollDisabled = false;
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
        this._dropListRef = dragDrop.createDropList(element);
        this._dropListRef.data = this;
        this._dropListRef.enterPredicate = function (drag, drop) {
            return _this.enterPredicate(drag.data, drop.data);
        };
        this._setupInputSyncSubscription(this._dropListRef);
        this._handleEvents(this._dropListRef);
        CdkDropList._dropLists.push(this);
        if (_group) {
            _group._items.add(this);
        }
    }
    Object.defineProperty(CdkDropList.prototype, "disabled", {
        /** Whether starting a dragging sequence from this container is disabled. */
        get: function () {
            return this._disabled || (!!this._group && this._group.disabled);
        },
        set: function (value) {
            // Usually we sync the directive and ref state right before dragging starts, in order to have
            // a single point of failure and to avoid having to use setters for everything. `disabled` is
            // a special case, because it can prevent the `beforeStarted` event from firing, which can lock
            // the user in a disabled state, so we also need to sync it as it's being set.
            this._dropListRef.disabled = this._disabled = coerceBooleanProperty(value);
        },
        enumerable: true,
        configurable: true
    });
    CdkDropList.prototype.ngAfterContentInit = function () {
        var _this = this;
        // @breaking-change 11.0.0 Remove null check for _scrollDispatcher once it's required.
        if (this._scrollDispatcher) {
            var scrollableParents = this._scrollDispatcher
                .getAncestorScrollContainers(this.element)
                .map(function (scrollable) { return scrollable.getElementRef().nativeElement; });
            this._dropListRef.withScrollableParents(scrollableParents);
        }
        this._draggables.changes
            .pipe(startWith(this._draggables), takeUntil(this._destroyed))
            .subscribe(function (items) {
            _this._dropListRef.withItems(items.reduce(function (filteredItems, drag) {
                if (drag.dropContainer === _this) {
                    filteredItems.push(drag._dragRef);
                }
                return filteredItems;
            }, []));
        });
    };
    CdkDropList.prototype.ngOnDestroy = function () {
        var index = CdkDropList._dropLists.indexOf(this);
        if (index > -1) {
            CdkDropList._dropLists.splice(index, 1);
        }
        if (this._group) {
            this._group._items.delete(this);
        }
        this._dropListRef.dispose();
        this._destroyed.next();
        this._destroyed.complete();
    };
    /**
     * Starts dragging an item.
     * @deprecated No longer being used. To be removed.
     * @breaking-change 10.0.0
     */
    CdkDropList.prototype.start = function () {
        this._dropListRef.start();
    };
    /**
     * Drops an item into this container.
     * @param item Item being dropped into the container.
     * @param currentIndex Index at which the item should be inserted.
     * @param previousContainer Container from which the item got dragged in.
     * @param isPointerOverContainer Whether the user's pointer was over the
     *    container when the item was dropped.
     *
     * @deprecated No longer being used. To be removed.
     * @breaking-change 10.0.0
     */
    CdkDropList.prototype.drop = function (item, currentIndex, previousContainer, isPointerOverContainer) {
        this._dropListRef.drop(item._dragRef, currentIndex, previousContainer._dropListRef, isPointerOverContainer, { x: 0, y: 0 });
    };
    /**
     * Emits an event to indicate that the user moved an item into the container.
     * @param item Item that was moved into the container.
     * @param pointerX Position of the item along the X axis.
     * @param pointerY Position of the item along the Y axis.
     * @deprecated No longer being used. To be removed.
     * @breaking-change 10.0.0
     */
    CdkDropList.prototype.enter = function (item, pointerX, pointerY) {
        this._dropListRef.enter(item._dragRef, pointerX, pointerY);
    };
    /**
     * Removes an item from the container after it was dragged into another container by the user.
     * @param item Item that was dragged out.
     * @deprecated No longer being used. To be removed.
     * @breaking-change 10.0.0
     */
    CdkDropList.prototype.exit = function (item) {
        this._dropListRef.exit(item._dragRef);
    };
    /**
     * Figures out the index of an item in the container.
     * @param item Item whose index should be determined.
     * @deprecated No longer being used. To be removed.
     * @breaking-change 10.0.0
     */
    CdkDropList.prototype.getItemIndex = function (item) {
        return this._dropListRef.getItemIndex(item._dragRef);
    };
    /** Syncs the inputs of the CdkDropList with the options of the underlying DropListRef. */
    CdkDropList.prototype._setupInputSyncSubscription = function (ref) {
        var _this = this;
        if (this._dir) {
            this._dir.change
                .pipe(startWith(this._dir.value), takeUntil(this._destroyed))
                .subscribe(function (value) { return ref.withDirection(value); });
        }
        ref.beforeStarted.subscribe(function () {
            var siblings = coerceArray(_this.connectedTo).map(function (drop) {
                return typeof drop === 'string' ?
                    CdkDropList._dropLists.find(function (list) { return list.id === drop; }) : drop;
            });
            if (_this._group) {
                _this._group._items.forEach(function (drop) {
                    if (siblings.indexOf(drop) === -1) {
                        siblings.push(drop);
                    }
                });
            }
            ref.disabled = _this.disabled;
            ref.lockAxis = _this.lockAxis;
            ref.sortingDisabled = coerceBooleanProperty(_this.sortingDisabled);
            ref.autoScrollDisabled = coerceBooleanProperty(_this.autoScrollDisabled);
            ref
                .connectedTo(siblings.filter(function (drop) { return drop && drop !== _this; }).map(function (list) { return list._dropListRef; }))
                .withOrientation(_this.orientation);
        });
    };
    /** Handles events from the underlying DropListRef. */
    CdkDropList.prototype._handleEvents = function (ref) {
        var _this = this;
        ref.beforeStarted.subscribe(function () {
            _this._changeDetectorRef.markForCheck();
        });
        ref.entered.subscribe(function (event) {
            _this.entered.emit({
                container: _this,
                item: event.item.data,
                currentIndex: event.currentIndex
            });
        });
        ref.exited.subscribe(function (event) {
            _this.exited.emit({
                container: _this,
                item: event.item.data
            });
            _this._changeDetectorRef.markForCheck();
        });
        ref.sorted.subscribe(function (event) {
            _this.sorted.emit({
                previousIndex: event.previousIndex,
                currentIndex: event.currentIndex,
                container: _this,
                item: event.item.data
            });
        });
        ref.dropped.subscribe(function (event) {
            _this.dropped.emit({
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
            _this._changeDetectorRef.markForCheck();
        });
    };
    /** Keeps track of the drop lists that are currently on the page. */
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
    CdkDropList.ctorParameters = function () { return [
        { type: ElementRef },
        { type: DragDrop },
        { type: ChangeDetectorRef },
        { type: Directionality, decorators: [{ type: Optional }] },
        { type: CdkDropListGroup, decorators: [{ type: Optional }, { type: SkipSelf }] },
        { type: ScrollDispatcher }
    ]; };
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
    return CdkDropList;
}());
export { CdkDropList };
export { ɵ0 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZGlyZWN0aXZlcy9kcm9wLWxpc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFlLFdBQVcsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3ZGLE9BQU8sRUFDTCxlQUFlLEVBQ2YsVUFBVSxFQUNWLFlBQVksRUFDWixLQUFLLEVBRUwsTUFBTSxFQUNOLFNBQVMsRUFDVCxRQUFRLEVBQ1IsU0FBUyxFQUNULGlCQUFpQixFQUNqQixRQUFRLEdBRVQsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3hELE9BQU8sRUFBQyxPQUFPLEVBQUUsYUFBYSxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBRTlDLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBR25ELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDdEMsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUM3QixPQUFPLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXBELDBEQUEwRDtBQUMxRCxJQUFJLGdCQUFnQixHQUFHLENBQUMsQ0FBQztTQWVpQixTQUFTO0FBTm5ELHFEQUFxRDtBQUNyRDtJQXNHRTtJQUNJLGlEQUFpRDtJQUMxQyxPQUFnQyxFQUFFLFFBQWtCLEVBQ25ELGtCQUFxQyxFQUFzQixJQUFxQixFQUN4RCxNQUFzQztJQUV0RTs7O09BR0c7SUFDSyxpQkFBb0M7UUFWaEQsaUJBd0JDO1FBdEJVLFlBQU8sR0FBUCxPQUFPLENB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Q2hFO2lCQUNGOzs7O2dCQWpEQyxVQUFVO2dCQW1CSixRQUFRO2dCQVhkLGlCQUFpQjtnQkFJWCxjQUFjLHVCQStIZ0MsUUFBUTtnQkEzSHRELGdCQUFnQix1QkE0SGpCLFFBQVEsWUFBSSxRQUFRO2dCQS9IbkIsZ0JBQWdCOzs7OEJBZ0RyQixlQUFlLFNBQUMsT0FBTyxFQUFFLEVBQUMsV0FBVyxFQUFFLElBQUksRUFBQzs4QkFPNUMsS0FBSyxTQUFDLHdCQUF3Qjt1QkFJOUIsS0FBSyxTQUFDLGlCQUFpQjs4QkFHdkIsS0FBSyxTQUFDLHdCQUF3QjtxQkFNOUIsS0FBSzsyQkFHTCxLQUFLLFNBQUMscUJBQXFCOzJCQUczQixLQUFLLFNBQUMscUJBQXFCO2tDQWMzQixLQUFLLFNBQUMsNEJBQTRCO2lDQU9sQyxLQUFLLFNBQUMsMkJBQTJCO3FDQUlqQyxLQUFLLFNBQUMsK0JBQStCOzBCQUlyQyxNQUFNLFNBQUMsb0JBQW9COzBCQU0zQixNQUFNLFNBQUMsb0JBQW9CO3lCQU8zQixNQUFNLFNBQUMsbUJBQW1CO3lCQUkxQixNQUFNLFNBQUMsbUJBQW1COztJQWdON0Isa0JBQUM7Q0FBQSxBQW5URCxJQW1UQztTQW5TWSxXQUFXIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Qm9vbGVhbklucHV0LCBjb2VyY2VBcnJheSwgY29lcmNlQm9vbGVhblByb3BlcnR5fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtcbiAgQ29udGVudENoaWxkcmVuLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIElucHV0LFxuICBPbkRlc3Ryb3ksXG4gIE91dHB1dCxcbiAgUXVlcnlMaXN0LFxuICBPcHRpb25hbCxcbiAgRGlyZWN0aXZlLFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgU2tpcFNlbGYsXG4gIEFmdGVyQ29udGVudEluaXQsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtTY3JvbGxEaXNwYXRjaGVyfSBmcm9tICdAYW5ndWxhci9jZGsvc2Nyb2xsaW5nJztcbmltcG9ydCB7Q2RrRHJhZywgQ0RLX0RST1BfTElTVH0gZnJvbSAnLi9kcmFnJztcbmltcG9ydCB7Q2RrRHJhZ0Ryb3AsIENka0RyYWdFbnRlciwgQ2RrRHJhZ0V4aXQsIENka0RyYWdTb3J0RXZlbnR9IGZyb20gJy4uL2RyYWctZXZlbnRzJztcbmltcG9ydCB7Q2RrRHJvcExpc3RHcm91cH0gZnJvbSAnLi9kcm9wLWxpc3QtZ3JvdXAnO1xuaW1wb3J0IHtEcm9wTGlzdFJlZn0gZnJvbSAnLi4vZHJvcC1saXN0LXJlZic7XG5pbXBvcnQge0RyYWdSZWZ9IGZyb20gJy4uL2RyYWctcmVmJztcbmltcG9ydCB7RHJhZ0Ryb3B9IGZyb20gJy4uL2RyYWctZHJvcCc7XG5pbXBvcnQge1N1YmplY3R9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtzdGFydFdpdGgsIHRha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG4vKiogQ291bnRlciB1c2VkIHRvIGdlbmVyYXRlIHVuaXF1ZSBpZHMgZm9yIGRyb3Agem9uZXMuICovXG5sZXQgX3VuaXF1ZUlkQ291bnRlciA9IDA7XG5cbi8qKlxuICogSW50ZXJuYWwgY29tcGlsZS10aW1lLW9ubHkgcmVwcmVzZW50YXRpb24gb2YgYSBgQ2RrRHJvcExpc3RgLlxuICogVXNlZCB0byBhdm9pZCBjaXJjdWxhciBpbXBvcnQgaXNzdWVzIGJldHdlZW4gdGhlIGBDZGtEcm9wTGlzdGAgYW5kIHRoZSBgQ2RrRHJhZ2AuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2RrRHJvcExpc3RJbnRlcm5hbCBleHRlbmRzIENka0Ryb3BMaXN0IHt9XG5cbi8qKiBDb250YWluZXIgdGhhdCB3cmFwcyBhIHNldCBvZiBkcmFnZ2FibGUgaXRlbXMuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrRHJvcExpc3RdLCBjZGstZHJvcC1saXN0JyxcbiAgZXhwb3J0QXM6ICdjZGtEcm9wTGlzdCcsXG4gIHByb3ZpZGVyczogW1xuICAgIC8vIFByZXZlbnQgY2hpbGQgZHJvcCBsaXN0cyBmcm9tIHBpY2tpbmcgdXAgdGhlIHNhbWUgZ3JvdXAgYXMgdGhlaXIgcGFyZW50LlxuICAgIHtwcm92aWRlOiBDZGtEcm9wTGlzdEdyb3VwLCB1c2VWYWx1ZTogdW5kZWZpbmVkfSxcbiAgICB7cHJvdmlkZTogQ0RLX0RST1BfTElTVCwgdXNlRXhpc3Rpbmc6IENka0Ryb3BMaXN0fSxcbiAgXSxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstZHJvcC1saXN0JyxcbiAgICAnW2lkXSc6ICdpZCcsXG4gICAgJ1tjbGFzcy5jZGstZHJvcC1saXN0LWRpc2FibGVkXSc6ICdkaXNhYmxlZCcsXG4gICAgJ1tjbGFzcy5jZGstZHJvcC1saXN0LWRyYWdnaW5nXSc6ICdfZHJvcExpc3RSZWYuaXNEcmFnZ2luZygpJyxcbiAgICAnW2NsYXNzLmNkay1kcm9wLWxpc3QtcmVjZWl2aW5nXSc6ICdfZHJvcExpc3RSZWYuaXNSZWNlaXZpbmcoKScsXG4gIH1cbn0pXG5leHBvcnQgY2xhc3MgQ2RrRHJvcExpc3Q8VCA9IGFueT4gaW1wbGVtZW50cyBBZnRlckNvbnRlbnRJbml0LCBPbkRlc3Ryb3kge1xuICAvKiogRW1pdHMgd2hlbiB0aGUgbGlzdCBoYXMgYmVlbiBkZXN0cm95ZWQuICovXG4gIHByaXZhdGUgX2Rlc3Ryb3llZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBkcm9wIGxpc3RzIHRoYXQgYXJlIGN1cnJlbnRseSBvbiB0aGUgcGFnZS4gKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX2Ryb3BMaXN0czogQ2RrRHJvcExpc3RbXSA9IFtdO1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIHVuZGVybHlpbmcgZHJvcCBsaXN0IGluc3RhbmNlLiAqL1xuICBfZHJvcExpc3RSZWY6IERyb3BMaXN0UmVmPENka0Ryb3BMaXN0PFQ+PjtcblxuICAvKiogRHJhZ2dhYmxlIGl0ZW1zIGluIHRoZSBjb250YWluZXIuICovXG4gIEBDb250ZW50Q2hpbGRyZW4oQ2RrRHJhZywge2Rlc2NlbmRhbnRzOiB0cnVlfSkgX2RyYWdnYWJsZXM6IFF1ZXJ5TGlzdDxDZGtEcmFnPjtcblxuICAvKipcbiAgICogT3RoZXIgZHJhZ2dhYmxlIGNvbnRhaW5lcnMgdGhhdCB0aGlzIGNvbnRhaW5lciBpcyBjb25uZWN0ZWQgdG8gYW5kIGludG8gd2hpY2ggdGhlXG4gICAqIGNvbnRhaW5lcidzIGl0ZW1zIGNhbiBiZSB0cmFuc2ZlcnJlZC4gQ2FuIGVpdGhlciBiZSByZWZlcmVuY2VzIHRvIG90aGVyIGRyb3AgY29udGFpbmVycyxcbiAgICogb3IgdGhlaXIgdW5pcXVlIElEcy5cbiAgICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3RDb25uZWN0ZWRUbycpXG4gIGNvbm5lY3RlZFRvOiAoQ2RrRHJvcExpc3QgfCBzdHJpbmcpW10gfCBDZGtEcm9wTGlzdCB8IHN0cmluZyA9IFtdO1xuXG4gIC8qKiBBcmJpdHJhcnkgZGF0YSB0byBhdHRhY2ggdG8gdGhpcyBjb250YWluZXIuICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3REYXRhJykgZGF0YTogVDtcblxuICAvKiogRGlyZWN0aW9uIGluIHdoaWNoIHRoZSBsaXN0IGlzIG9yaWVudGVkLiAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0T3JpZW50YXRpb24nKSBvcmllbnRhdGlvbjogJ2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJyA9ICd2ZXJ0aWNhbCc7XG5cbiAgLyoqXG4gICAqIFVuaXF1ZSBJRCBmb3IgdGhlIGRyb3Agem9uZS4gQ2FuIGJlIHVzZWQgYXMgYSByZWZlcmVuY2VcbiAgICogaW4gdGhlIGBjb25uZWN0ZWRUb2Agb2YgYW5vdGhlciBgQ2RrRHJvcExpc3RgLlxuICAgKi9cbiAgQElucHV0KCkgaWQ6IHN0cmluZyA9IGBjZGstZHJvcC1saXN0LSR7X3VuaXF1ZUlkQ291bnRlcisrfWA7XG5cbiAgLyoqIExvY2tzIHRoZSBwb3NpdGlvbiBvZiB0aGUgZHJhZ2dhYmxlIGVsZW1lbnRzIGluc2lkZSB0aGUgY29udGFpbmVyIGFsb25nIHRoZSBzcGVjaWZpZWQgYXhpcy4gKi9cbiAgQElucHV0KCdjZGtEcm9wTGlzdExvY2tBeGlzJykgbG9ja0F4aXM6ICd4JyB8ICd5JztcblxuICAvKiogV2hldGhlciBzdGFydGluZyBhIGRyYWdnaW5nIHNlcXVlbmNlIGZyb20gdGhpcyBjb250YWluZXIgaXMgZGlzYWJsZWQuICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3REaXNhYmxlZCcpXG4gIGdldCBkaXNhYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fZGlzYWJsZWQgfHwgKCEhdGhpcy5fZ3JvdXAgJiYgdGhpcy5fZ3JvdXAuZGlzYWJsZWQpO1xuICB9XG4gIHNldCBkaXNhYmxlZCh2YWx1ZTogYm9vbGVhbikge1xuICAgIC8vIFVzdWFsbHkgd2Ugc3luYyB0aGUgZGlyZWN0aXZlIGFuZCByZWYgc3RhdGUgcmlnaHQgYmVmb3JlIGRyYWdnaW5nIHN0YXJ0cywgaW4gb3JkZXIgdG8gaGF2ZVxuICAgIC8vIGEgc2luZ2xlIHBvaW50IG9mIGZhaWx1cmUgYW5kIHRvIGF2b2lkIGhhdmluZyB0byB1c2Ugc2V0dGVycyBmb3IgZXZlcnl0aGluZy4gYGRpc2FibGVkYCBpc1xuICAgIC8vIGEgc3BlY2lhbCBjYXNlLCBiZWNhdXNlIGl0IGNhbiBwcmV2ZW50IHRoZSBgYmVmb3JlU3RhcnRlZGAgZXZlbnQgZnJvbSBmaXJpbmcsIHdoaWNoIGNhbiBsb2NrXG4gICAgLy8gdGhlIHVzZXIgaW4gYSBkaXNhYmxlZCBzdGF0ZSwgc28gd2UgYWxzbyBuZWVkIHRvIHN5bmMgaXQgYXMgaXQncyBiZWluZyBzZXQuXG4gICAgdGhpcy5fZHJvcExpc3RSZWYuZGlzYWJsZWQgPSB0aGlzLl9kaXNhYmxlZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gIH1cbiAgcHJpdmF0ZSBfZGlzYWJsZWQgPSBmYWxzZTtcblxuICAvKiogV2hldGhlciBzb3J0aW5nIHdpdGhpbiB0aGlzIGRyb3AgbGlzdCBpcyBkaXNhYmxlZC4gKi9cbiAgQElucHV0KCdjZGtEcm9wTGlzdFNvcnRpbmdEaXNhYmxlZCcpXG4gIHNvcnRpbmdEaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBGdW5jdGlvbiB0aGF0IGlzIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYW4gaXRlbVxuICAgKiBpcyBhbGxvd2VkIHRvIGJlIG1vdmVkIGludG8gYSBkcm9wIGNvbnRhaW5lci5cbiAgICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3RFbnRlclByZWRpY2F0ZScpXG4gIGVudGVyUHJlZGljYXRlOiAoZHJhZzogQ2RrRHJhZywgZHJvcDogQ2RrRHJvcExpc3QpID0+IGJvb2xlYW4gPSAoKSA9PiB0cnVlXG5cbiAgLyoqIFdoZXRoZXIgdG8gYXV0by1zY3JvbGwgdGhlIHZpZXcgd2hlbiB0aGUgdXNlciBtb3ZlcyB0aGVpciBwb2ludGVyIGNsb3NlIHRvIHRoZSBlZGdlcy4gKi9cbiAgQElucHV0KCdjZGtEcm9wTGlzdEF1dG9TY3JvbGxEaXNhYmxlZCcpXG4gIGF1dG9TY3JvbGxEaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGRyb3BzIGFuIGl0ZW0gaW5zaWRlIHRoZSBjb250YWluZXIuICovXG4gIEBPdXRwdXQoJ2Nka0Ryb3BMaXN0RHJvcHBlZCcpXG4gIGRyb3BwZWQ6IEV2ZW50RW1pdHRlcjxDZGtEcmFnRHJvcDxULCBhbnk+PiA9IG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0Ryb3A8VCwgYW55Pj4oKTtcblxuICAvKipcbiAgICogRW1pdHMgd2hlbiB0aGUgdXNlciBoYXMgbW92ZWQgYSBuZXcgZHJhZyBpdGVtIGludG8gdGhpcyBjb250YWluZXIuXG4gICAqL1xuICBAT3V0cHV0KCdjZGtEcm9wTGlzdEVudGVyZWQnKVxuICBlbnRlcmVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0VudGVyPFQ+PiA9IG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0VudGVyPFQ+PigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHJlbW92ZXMgYW4gaXRlbSBmcm9tIHRoZSBjb250YWluZXJcbiAgICogYnkgZHJhZ2dpbmcgaXQgaW50byBhbm90aGVyIGNvbnRhaW5lci5cbiAgICovXG4gIEBPdXRwdXQoJ2Nka0Ryb3BMaXN0RXhpdGVkJylcbiAgZXhpdGVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0V4aXQ8VD4+ID0gbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnRXhpdDxUPj4oKTtcblxuICAvKiogRW1pdHMgYXMgdGhlIHVzZXIgaXMgc3dhcHBpbmcgaXRlbXMgd2hpbGUgYWN0aXZlbHkgZHJhZ2dpbmcuICovXG4gIEBPdXRwdXQoJ2Nka0Ryb3BMaXN0U29ydGVkJylcbiAgc29ydGVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ1NvcnRFdmVudDxUPj4gPSBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdTb3J0RXZlbnQ8VD4+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICAvKiogRWxlbWVudCB0aGF0IHRoZSBkcm9wIGxpc3QgaXMgYXR0YWNoZWQgdG8uICovXG4gICAgICBwdWJsaWMgZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sIGRyYWdEcm9wOiBEcmFnRHJvcCxcbiAgICAgIHByaXZhdGUgX2NoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZiwgQE9wdGlvbmFsKCkgcHJpdmF0ZSBfZGlyPzogRGlyZWN0aW9uYWxpdHksXG4gICAgICBAT3B0aW9uYWwoKSBAU2tpcFNlbGYoKSBwcml2YXRlIF9ncm91cD86IENka0Ryb3BMaXN0R3JvdXA8Q2RrRHJvcExpc3Q+LFxuXG4gICAgICAvKipcbiAgICAgICAqIEBkZXByZWNhdGVkIF9zY3JvbGxEaXNwYXRjaGVyIHBhcmFtZXRlciB0byBiZWNvbWUgcmVxdWlyZWQuXG4gICAgICAgKiBAYnJlYWtpbmctY2hhbmdlIDExLjAuMFxuICAgICAgICovXG4gICAgICBwcml2YXRlIF9zY3JvbGxEaXNwYXRjaGVyPzogU2Nyb2xsRGlzcGF0Y2hlcikge1xuICAgIHRoaXMuX2Ryb3BMaXN0UmVmID0gZHJhZ0Ryb3AuY3JlYXRlRHJvcExpc3QoZWxlbWVudCk7XG4gICAgdGhpcy5fZHJvcExpc3RSZWYuZGF0YSA9IHRoaXM7XG4gICAgdGhpcy5fZHJvcExpc3RSZWYuZW50ZXJQcmVkaWNhdGUgPSAoZHJhZzogRHJhZ1JlZjxDZGtEcmFnPiwgZHJvcDogRHJvcExpc3RSZWY8Q2RrRHJvcExpc3Q+KSA9PiB7XG4gICAgICByZXR1cm4gdGhpcy5lbnRlclByZWRpY2F0ZShkcmFnLmRhdGEsIGRyb3AuZGF0YSk7XG4gICAgfTtcblxuICAgIHRoaXMuX3NldHVwSW5wdXRTeW5jU3Vic2NyaXB0aW9uKHRoaXMuX2Ryb3BMaXN0UmVmKTtcbiAgICB0aGlzLl9oYW5kbGVFdmVudHModGhpcy5fZHJvcExpc3RSZWYpO1xuICAgIENka0Ryb3BMaXN0Ll9kcm9wTGlzdHMucHVzaCh0aGlzKTtcblxuICAgIGlmIChfZ3JvdXApIHtcbiAgICAgIF9ncm91cC5faXRlbXMuYWRkKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIG5nQWZ0ZXJDb250ZW50SW5pdCgpIHtcbiAgICAvLyBAYnJlYWtpbmctY2hhbmdlIDExLjAuMCBSZW1vdmUgbnVsbCBjaGVjayBmb3IgX3Njcm9sbERpc3BhdGNoZXIgb25jZSBpdCdzIHJlcXVpcmVkLlxuICAgIGlmICh0aGlzLl9zY3JvbGxEaXNwYXRjaGVyKSB7XG4gICAgICBjb25zdCBzY3JvbGxhYmxlUGFyZW50cyA9IHRoaXMuX3Njcm9sbERpc3BhdGNoZXJcbiAgICAgICAgLmdldEFuY2VzdG9yU2Nyb2xsQ29udGFpbmVycyh0aGlzLmVsZW1lbnQpXG4gICAgICAgIC5tYXAoc2Nyb2xsYWJsZSA9PiBzY3JvbGxhYmxlLmdldEVsZW1lbnRSZWYoKS5uYXRpdmVFbGVtZW50KTtcbiAgICAgIHRoaXMuX2Ryb3BMaXN0UmVmLndpdGhTY3JvbGxhYmxlUGFyZW50cyhzY3JvbGxhYmxlUGFyZW50cyk7XG4gICAgfVxuXG4gICAgdGhpcy5fZHJhZ2dhYmxlcy5jaGFuZ2VzXG4gICAgICAucGlwZShzdGFydFdpdGgodGhpcy5fZHJhZ2dhYmxlcyksIHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpKVxuICAgICAgLnN1YnNjcmliZSgoaXRlbXM6IFF1ZXJ5TGlzdDxDZGtEcmFnPikgPT4ge1xuICAgICAgICB0aGlzLl9kcm9wTGlzdFJlZi53aXRoSXRlbXMoaXRlbXMucmVkdWNlKChmaWx0ZXJlZEl0ZW1zLCBkcmFnKSA9PiB7XG4gICAgICAgICAgaWYgKGRyYWcuZHJvcENvbnRhaW5lciA9PT0gdGhpcykge1xuICAgICAgICAgICAgZmlsdGVyZWRJdGVtcy5wdXNoKGRyYWcuX2RyYWdSZWYpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBmaWx0ZXJlZEl0ZW1zO1xuICAgICAgICB9LCBbXSBhcyBEcmFnUmVmW10pKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgY29uc3QgaW5kZXggPSBDZGtEcm9wTGlzdC5fZHJvcExpc3RzLmluZGV4T2YodGhpcyk7XG5cbiAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgQ2RrRHJvcExpc3QuX2Ryb3BMaXN0cy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ncm91cCkge1xuICAgICAgdGhpcy5fZ3JvdXAuX2l0ZW1zLmRlbGV0ZSh0aGlzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9kcm9wTGlzdFJlZi5kaXNwb3NlKCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydHMgZHJhZ2dpbmcgYW4gaXRlbS5cbiAgICogQGRlcHJlY2F0ZWQgTm8gbG9uZ2VyIGJlaW5nIHVzZWQuIFRvIGJlIHJlbW92ZWQuXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMTAuMC4wXG4gICAqL1xuICBzdGFydCgpOiB2b2lkIHtcbiAgICB0aGlzLl9kcm9wTGlzdFJlZi5zdGFydCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIERyb3BzIGFuIGl0ZW0gaW50byB0aGlzIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSBiZWluZyBkcm9wcGVkIGludG8gdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGN1cnJlbnRJbmRleCBJbmRleCBhdCB3aGljaCB0aGUgaXRlbSBzaG91bGQgYmUgaW5zZXJ0ZWQuXG4gICAqIEBwYXJhbSBwcmV2aW91c0NvbnRhaW5lciBDb250YWluZXIgZnJvbSB3aGljaCB0aGUgaXRlbSBnb3QgZHJhZ2dlZCBpbi5cbiAgICogQHBhcmFtIGlzUG9pbnRlck92ZXJDb250YWluZXIgV2hldGhlciB0aGUgdXNlcidzIHBvaW50ZXIgd2FzIG92ZXIgdGhlXG4gICAqICAgIGNvbnRhaW5lciB3aGVuIHRoZSBpdGVtIHdhcyBkcm9wcGVkLlxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBObyBsb25nZXIgYmVpbmcgdXNlZC4gVG8gYmUgcmVtb3ZlZC5cbiAgICogQGJyZWFraW5nLWNoYW5nZSAxMC4wLjBcbiAgICovXG4gIGRyb3AoaXRlbTogQ2RrRHJhZywgY3VycmVudEluZGV4OiBudW1iZXIsIHByZXZpb3VzQ29udGFpbmVyOiBDZGtEcm9wTGlzdCxcbiAgICBpc1BvaW50ZXJPdmVyQ29udGFpbmVyOiBib29sZWFuKTogdm9pZCB7XG4gICAgdGhpcy5fZHJvcExpc3RSZWYuZHJvcChpdGVtLl9kcmFnUmVmLCBjdXJyZW50SW5kZXgsIHByZXZpb3VzQ29udGFpbmVyLl9kcm9wTGlzdFJlZixcbiAgICAgICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lciwge3g6IDAsIHk6IDB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbWl0cyBhbiBldmVudCB0byBpbmRpY2F0ZSB0aGF0IHRoZSB1c2VyIG1vdmVkIGFuIGl0ZW0gaW50byB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRoYXQgd2FzIG1vdmVkIGludG8gdGhlIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHBvaW50ZXJYIFBvc2l0aW9uIG9mIHRoZSBpdGVtIGFsb25nIHRoZSBYIGF4aXMuXG4gICAqIEBwYXJhbSBwb2ludGVyWSBQb3NpdGlvbiBvZiB0aGUgaXRlbSBhbG9uZyB0aGUgWSBheGlzLlxuICAgKiBAZGVwcmVjYXRlZCBObyBsb25nZXIgYmVpbmcgdXNlZC4gVG8gYmUgcmVtb3ZlZC5cbiAgICogQGJyZWFraW5nLWNoYW5nZSAxMC4wLjBcbiAgICovXG4gIGVudGVyKGl0ZW06IENka0RyYWcsIHBvaW50ZXJYOiBudW1iZXIsIHBvaW50ZXJZOiBudW1iZXIpOiB2b2lkIHtcbiAgICB0aGlzLl9kcm9wTGlzdFJlZi5lbnRlcihpdGVtLl9kcmFnUmVmLCBwb2ludGVyWCwgcG9pbnRlclkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYW4gaXRlbSBmcm9tIHRoZSBjb250YWluZXIgYWZ0ZXIgaXQgd2FzIGRyYWdnZWQgaW50byBhbm90aGVyIGNvbnRhaW5lciBieSB0aGUgdXNlci5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB0aGF0IHdhcyBkcmFnZ2VkIG91dC5cbiAgICogQGRlcHJlY2F0ZWQgTm8gbG9uZ2VyIGJlaW5nIHVzZWQuIFRvIGJlIHJlbW92ZWQuXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMTAuMC4wXG4gICAqL1xuICBleGl0KGl0ZW06IENka0RyYWcpOiB2b2lkIHtcbiAgICB0aGlzLl9kcm9wTGlzdFJlZi5leGl0KGl0ZW0uX2RyYWdSZWYpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpZ3VyZXMgb3V0IHRoZSBpbmRleCBvZiBhbiBpdGVtIGluIHRoZSBjb250YWluZXIuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gd2hvc2UgaW5kZXggc2hvdWxkIGJlIGRldGVybWluZWQuXG4gICAqIEBkZXByZWNhdGVkIE5vIGxvbmdlciBiZWluZyB1c2VkLiBUbyBiZSByZW1vdmVkLlxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDEwLjAuMFxuICAgKi9cbiAgZ2V0SXRlbUluZGV4KGl0ZW06IENka0RyYWcpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9kcm9wTGlzdFJlZi5nZXRJdGVtSW5kZXgoaXRlbS5fZHJhZ1JlZik7XG4gIH1cblxuICAvKiogU3luY3MgdGhlIGlucHV0cyBvZiB0aGUgQ2RrRHJvcExpc3Qgd2l0aCB0aGUgb3B0aW9ucyBvZiB0aGUgdW5kZXJseWluZyBEcm9wTGlzdFJlZi4gKi9cbiAgcHJpdmF0ZSBfc2V0dXBJbnB1dFN5bmNTdWJzY3JpcHRpb24ocmVmOiBEcm9wTGlzdFJlZjxDZGtEcm9wTGlzdD4pIHtcbiAgICBpZiAodGhpcy5fZGlyKSB7XG4gICAgICB0aGlzLl9kaXIuY2hhbmdlXG4gICAgICAgIC5waXBlKHN0YXJ0V2l0aCh0aGlzLl9kaXIudmFsdWUpLCB0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSlcbiAgICAgICAgLnN1YnNjcmliZSh2YWx1ZSA9PiByZWYud2l0aERpcmVjdGlvbih2YWx1ZSkpO1xuICAgIH1cblxuICAgIHJlZi5iZWZvcmVTdGFydGVkLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICBjb25zdCBzaWJsaW5ncyA9IGNvZXJjZUFycmF5KHRoaXMuY29ubmVjdGVkVG8pLm1hcChkcm9wID0+IHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBkcm9wID09PSAnc3RyaW5nJyA/XG4gICAgICAgICAgICBDZGtEcm9wTGlzdC5fZHJvcExpc3RzLmZpbmQobGlzdCA9PiBsaXN0LmlkID09PSBkcm9wKSEgOiBkcm9wO1xuICAgICAgfSk7XG5cbiAgICAgIGlmICh0aGlzLl9ncm91cCkge1xuICAgICAgICB0aGlzLl9ncm91cC5faXRlbXMuZm9yRWFjaChkcm9wID0+IHtcbiAgICAgICAgICBpZiAoc2libGluZ3MuaW5kZXhPZihkcm9wKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHNpYmxpbmdzLnB1c2goZHJvcCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmVmLmRpc2FibGVkID0gdGhpcy5kaXNhYmxlZDtcbiAgICAgIHJlZi5sb2NrQXhpcyA9IHRoaXMubG9ja0F4aXM7XG4gICAgICByZWYuc29ydGluZ0Rpc2FibGVkID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHRoaXMuc29ydGluZ0Rpc2FibGVkKTtcbiAgICAgIHJlZi5hdXRvU2Nyb2xsRGlzYWJsZWQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodGhpcy5hdXRvU2Nyb2xsRGlzYWJsZWQpO1xuICAgICAgcmVmXG4gICAgICAgIC5jb25uZWN0ZWRUbyhzaWJsaW5ncy5maWx0ZXIoZHJvcCA9PiBkcm9wICYmIGRyb3AgIT09IHRoaXMpLm1hcChsaXN0ID0+IGxpc3QuX2Ryb3BMaXN0UmVmKSlcbiAgICAgICAgLndpdGhPcmllbnRhdGlvbih0aGlzLm9yaWVudGF0aW9uKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBIYW5kbGVzIGV2ZW50cyBmcm9tIHRoZSB1bmRlcmx5aW5nIERyb3BMaXN0UmVmLiAqL1xuICBwcml2YXRlIF9oYW5kbGVFdmVudHMocmVmOiBEcm9wTGlzdFJlZjxDZGtEcm9wTGlzdD4pIHtcbiAgICByZWYuYmVmb3JlU3RhcnRlZC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgfSk7XG5cbiAgICByZWYuZW50ZXJlZC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgdGhpcy5lbnRlcmVkLmVtaXQoe1xuICAgICAgICBjb250YWluZXI6IHRoaXMsXG4gICAgICAgIGl0ZW06IGV2ZW50Lml0ZW0uZGF0YSxcbiAgICAgICAgY3VycmVudEluZGV4OiBldmVudC5jdXJyZW50SW5kZXhcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmVmLmV4aXRlZC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgdGhpcy5leGl0ZWQuZW1pdCh7XG4gICAgICAgIGNvbnRhaW5lcjogdGhpcyxcbiAgICAgICAgaXRlbTogZXZlbnQuaXRlbS5kYXRhXG4gICAgICB9KTtcbiAgICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICAgIH0pO1xuXG4gICAgcmVmLnNvcnRlZC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgdGhpcy5zb3J0ZWQuZW1pdCh7XG4gICAgICAgIHByZXZpb3VzSW5kZXg6IGV2ZW50LnByZXZpb3VzSW5kZXgsXG4gICAgICAgIGN1cnJlbnRJbmRleDogZXZlbnQuY3VycmVudEluZGV4LFxuICAgICAgICBjb250YWluZXI6IHRoaXMsXG4gICAgICAgIGl0ZW06IGV2ZW50Lml0ZW0uZGF0YVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZWYuZHJvcHBlZC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgdGhpcy5kcm9wcGVkLmVtaXQoe1xuICAgICAgICBwcmV2aW91c0luZGV4OiBldmVudC5wcmV2aW91c0luZGV4LFxuICAgICAgICBjdXJyZW50SW5kZXg6IGV2ZW50LmN1cnJlbnRJbmRleCxcbiAgICAgICAgcHJldmlvdXNDb250YWluZXI6IGV2ZW50LnByZXZpb3VzQ29udGFpbmVyLmRhdGEsXG4gICAgICAgIGNvbnRhaW5lcjogZXZlbnQuY29udGFpbmVyLmRhdGEsXG4gICAgICAgIGl0ZW06IGV2ZW50Lml0ZW0uZGF0YSxcbiAgICAgICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcjogZXZlbnQuaXNQb2ludGVyT3ZlckNvbnRhaW5lcixcbiAgICAgICAgZGlzdGFuY2U6IGV2ZW50LmRpc3RhbmNlXG4gICAgICB9KTtcblxuICAgICAgLy8gTWFyayBmb3IgY2hlY2sgc2luY2UgYWxsIG9mIHRoZXNlIGV2ZW50cyBydW4gb3V0c2lkZSBvZiBjaGFuZ2VcbiAgICAgIC8vIGRldGVjdGlvbiBhbmQgd2UncmUgbm90IGd1YXJhbnRlZWQgZm9yIHNvbWV0aGluZyBlbHNlIHRvIGhhdmUgdHJpZ2dlcmVkIGl0LlxuICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfZGlzYWJsZWQ6IEJvb2xlYW5JbnB1dDtcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX3NvcnRpbmdEaXNhYmxlZDogQm9vbGVhbklucHV0O1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfYXV0b1Njcm9sbERpc2FibGVkOiBCb29sZWFuSW5wdXQ7XG59XG4iXX0=