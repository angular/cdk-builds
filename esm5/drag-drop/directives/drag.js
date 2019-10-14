/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { Directionality } from '@angular/cdk/bidi';
import { DOCUMENT } from '@angular/common';
import { ContentChild, ContentChildren, Directive, ElementRef, EventEmitter, Inject, InjectionToken, Input, NgZone, Optional, Output, QueryList, SkipSelf, ViewContainerRef, ChangeDetectorRef, isDevMode, } from '@angular/core';
import { coerceBooleanProperty, coerceNumberProperty, coerceElement } from '@angular/cdk/coercion';
import { Observable, Subject, merge } from 'rxjs';
import { startWith, take, map, takeUntil, switchMap, tap } from 'rxjs/operators';
import { CdkDragHandle } from './drag-handle';
import { CdkDragPlaceholder } from './drag-placeholder';
import { CdkDragPreview } from './drag-preview';
import { CDK_DRAG_PARENT } from '../drag-parent';
import { DragDrop } from '../drag-drop';
/**
 * Injection token that is used to provide a CdkDropList instance to CdkDrag.
 * Used for avoiding circular imports.
 */
export var CDK_DROP_LIST = new InjectionToken('CDK_DROP_LIST');
/** Injection token that can be used to configure the behavior of `CdkDrag`. */
export var CDK_DRAG_CONFIG = new InjectionToken('CDK_DRAG_CONFIG', {
    providedIn: 'root',
    factory: CDK_DRAG_CONFIG_FACTORY
});
/** @docs-private */
export function CDK_DRAG_CONFIG_FACTORY() {
    return { dragStartThreshold: 5, pointerDirectionChangeThreshold: 5 };
}
/** Element that can be moved inside a CdkDropList container. */
var CdkDrag = /** @class */ (function () {
    function CdkDrag(
    /** Element that the draggable is attached to. */
    element, 
    /** Droppable container that the draggable is a part of. */
    dropContainer, _document, _ngZone, _viewContainerRef, config, _dir, dragDrop, _changeDetectorRef) {
        var _this = this;
        this.element = element;
        this.dropContainer = dropContainer;
        this._document = _document;
        this._ngZone = _ngZone;
        this._viewContainerRef = _viewContainerRef;
        this._dir = _dir;
        this._changeDetectorRef = _changeDetectorRef;
        this._destroyed = new Subject();
        /**
         * Amount of milliseconds to wait after the user has put their
         * pointer down before starting to drag the element.
         */
        this.dragStartDelay = 0;
        this._disabled = false;
        /** Emits when the user starts dragging the item. */
        this.started = new EventEmitter();
        /** Emits when the user has released a drag item, before any animations have started. */
        this.released = new EventEmitter();
        /** Emits when the user stops dragging an item in the container. */
        this.ended = new EventEmitter();
        /** Emits when the user has moved the item into a new container. */
        this.entered = new EventEmitter();
        /** Emits when the user removes the item its container by dragging it into another container. */
        this.exited = new EventEmitter();
        /** Emits when the user drops the item inside a container. */
        this.dropped = new EventEmitter();
        /**
         * Emits as the user is dragging the item. Use with caution,
         * because this event will fire for every pixel that the user has dragged.
         */
        this.moved = new Observable(function (observer) {
            var subscription = _this._dragRef.moved.pipe(map(function (movedEvent) { return ({
                source: _this,
                pointerPosition: movedEvent.pointerPosition,
                event: movedEvent.event,
                delta: movedEvent.delta,
                distance: movedEvent.distance
            }); })).subscribe(observer);
            return function () {
                subscription.unsubscribe();
            };
        });
        this._dragRef = dragDrop.createDrag(element, config);
        this._dragRef.data = this;
        this._syncInputs(this._dragRef);
        this._handleEvents(this._dragRef);
    }
    Object.defineProperty(CdkDrag.prototype, "disabled", {
        /** Whether starting to drag this element is disabled. */
        get: function () {
            return this._disabled || (this.dropContainer && this.dropContainer.disabled);
        },
        set: function (value) {
            this._disabled = coerceBooleanProperty(value);
            this._dragRef.disabled = this._disabled;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Returns the element that is being used as a placeholder
     * while the current element is being dragged.
     */
    CdkDrag.prototype.getPlaceholderElement = function () {
        return this._dragRef.getPlaceholderElement();
    };
    /** Returns the root draggable element. */
    CdkDrag.prototype.getRootElement = function () {
        return this._dragRef.getRootElement();
    };
    /** Resets a standalone drag item to its initial position. */
    CdkDrag.prototype.reset = function () {
        this._dragRef.reset();
    };
    /**
     * Gets the pixel coordinates of the draggable outside of a drop container.
     */
    CdkDrag.prototype.getFreeDragPosition = function () {
        return this._dragRef.getFreeDragPosition();
    };
    CdkDrag.prototype.ngAfterViewInit = function () {
        var _this = this;
        // We need to wait for the zone to stabilize, in order for the reference
        // element to be in the proper place in the DOM. This is mostly relevant
        // for draggable elements inside portals since they get stamped out in
        // their original DOM position and then they get transferred to the portal.
        this._ngZone.onStable.asObservable()
            .pipe(take(1), takeUntil(this._destroyed))
            .subscribe(function () {
            _this._updateRootElement();
            // Listen for any newly-added handles.
            _this._handles.changes.pipe(startWith(_this._handles), 
            // Sync the new handles with the DragRef.
            tap(function (handles) {
                var childHandleElements = handles
                    .filter(function (handle) { return handle._parentDrag === _this; })
                    .map(function (handle) { return handle.element; });
                _this._dragRef.withHandles(childHandleElements);
            }), 
            // Listen if the state of any of the handles changes.
            switchMap(function (handles) {
                return merge.apply(void 0, tslib_1.__spread(handles.map(function (item) { return item._stateChanges; })));
            }), takeUntil(_this._destroyed)).subscribe(function (handleInstance) {
                // Enabled/disable the handle that changed in the DragRef.
                var dragRef = _this._dragRef;
                var handle = handleInstance.element.nativeElement;
                handleInstance.disabled ? dragRef.disableHandle(handle) : dragRef.enableHandle(handle);
            });
            if (_this.freeDragPosition) {
                _this._dragRef.setFreeDragPosition(_this.freeDragPosition);
            }
        });
    };
    CdkDrag.prototype.ngOnChanges = function (changes) {
        var rootSelectorChange = changes['rootElementSelector'];
        var positionChange = changes['freeDragPosition'];
        // We don't have to react to the first change since it's being
        // handled in `ngAfterViewInit` where it needs to be deferred.
        if (rootSelectorChange && !rootSelectorChange.firstChange) {
            this._updateRootElement();
        }
        // Skip the first change since it's being handled in `ngAfterViewInit`.
        if (positionChange && !positionChange.firstChange && this.freeDragPosition) {
            this._dragRef.setFreeDragPosition(this.freeDragPosition);
        }
    };
    CdkDrag.prototype.ngOnDestroy = function () {
        this._destroyed.next();
        this._destroyed.complete();
        this._dragRef.dispose();
    };
    /** Syncs the root element with the `DragRef`. */
    CdkDrag.prototype._updateRootElement = function () {
        var element = this.element.nativeElement;
        var rootElement = this.rootElementSelector ?
            getClosestMatchingAncestor(element, this.rootElementSelector) : element;
        if (rootElement && rootElement.nodeType !== this._document.ELEMENT_NODE) {
            throw Error("cdkDrag must be attached to an element node. " +
                ("Currently attached to \"" + rootElement.nodeName + "\"."));
        }
        this._dragRef.withRootElement(rootElement || element);
    };
    /** Gets the boundary element, based on the `boundaryElement` value. */
    CdkDrag.prototype._getBoundaryElement = function () {
        var boundary = this.boundaryElement;
        if (!boundary) {
            return null;
        }
        if (typeof boundary === 'string') {
            return getClosestMatchingAncestor(this.element.nativeElement, boundary);
        }
        var element = coerceElement(boundary);
        if (isDevMode() && !element.contains(this.element.nativeElement)) {
            throw Error('Draggable element is not inside of the node passed into cdkDragBoundary.');
        }
        return element;
    };
    /** Syncs the inputs of the CdkDrag with the options of the underlying DragRef. */
    CdkDrag.prototype._syncInputs = function (ref) {
        var _this = this;
        ref.beforeStarted.subscribe(function () {
            if (!ref.isDragging()) {
                var dir = _this._dir;
                var dragStartDelay = _this.dragStartDelay;
                var placeholder = _this._placeholderTemplate ? {
                    template: _this._placeholderTemplate.templateRef,
                    context: _this._placeholderTemplate.data,
                    viewContainer: _this._viewContainerRef
                } : null;
                var preview = _this._previewTemplate ? {
                    template: _this._previewTemplate.templateRef,
                    context: _this._previewTemplate.data,
                    viewContainer: _this._viewContainerRef
                } : null;
                ref.disabled = _this.disabled;
                ref.lockAxis = _this.lockAxis;
                ref.dragStartDelay = (typeof dragStartDelay === 'object' && dragStartDelay) ?
                    dragStartDelay : coerceNumberProperty(dragStartDelay);
                ref.constrainPosition = _this.constrainPosition;
                ref
                    .withBoundaryElement(_this._getBoundaryElement())
                    .withPlaceholderTemplate(placeholder)
                    .withPreviewTemplate(preview);
                if (dir) {
                    ref.withDirection(dir.value);
                }
            }
        });
    };
    /** Handles the events from the underlying `DragRef`. */
    CdkDrag.prototype._handleEvents = function (ref) {
        var _this = this;
        ref.started.subscribe(function () {
            _this.started.emit({ source: _this });
            // Since all of these events run outside of change detection,
            // we need to ensure that everything is marked correctly.
            _this._changeDetectorRef.markForCheck();
        });
        ref.released.subscribe(function () {
            _this.released.emit({ source: _this });
        });
        ref.ended.subscribe(function (event) {
            _this.ended.emit({ source: _this, distance: event.distance });
            // Since all of these events run outside of change detection,
            // we need to ensure that everything is marked correctly.
            _this._changeDetectorRef.markForCheck();
        });
        ref.entered.subscribe(function (event) {
            _this.entered.emit({
                container: event.container.data,
                item: _this,
                currentIndex: event.currentIndex
            });
        });
        ref.exited.subscribe(function (event) {
            _this.exited.emit({
                container: event.container.data,
                item: _this
            });
        });
        ref.dropped.subscribe(function (event) {
            _this.dropped.emit({
                previousIndex: event.previousIndex,
                currentIndex: event.currentIndex,
                previousContainer: event.previousContainer.data,
                container: event.container.data,
                isPointerOverContainer: event.isPointerOverContainer,
                item: _this,
                distance: event.distance
            });
        });
    };
    CdkDrag.decorators = [
        { type: Directive, args: [{
                    selector: '[cdkDrag]',
                    exportAs: 'cdkDrag',
                    host: {
                        'class': 'cdk-drag',
                        '[class.cdk-drag-disabled]': 'disabled',
                        '[class.cdk-drag-dragging]': '_dragRef.isDragging()',
                    },
                    providers: [{ provide: CDK_DRAG_PARENT, useExisting: CdkDrag }]
                },] }
    ];
    /** @nocollapse */
    CdkDrag.ctorParameters = function () { return [
        { type: ElementRef },
        { type: undefined, decorators: [{ type: Inject, args: [CDK_DROP_LIST,] }, { type: Optional }, { type: SkipSelf }] },
        { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] },
        { type: NgZone },
        { type: ViewContainerRef },
        { type: undefined, decorators: [{ type: Inject, args: [CDK_DRAG_CONFIG,] }] },
        { type: Directionality, decorators: [{ type: Optional }] },
        { type: DragDrop },
        { type: ChangeDetectorRef }
    ]; };
    CdkDrag.propDecorators = {
        _handles: [{ type: ContentChildren, args: [CdkDragHandle, { descendants: true },] }],
        _previewTemplate: [{ type: ContentChild, args: [CdkDragPreview, { static: false },] }],
        _placeholderTemplate: [{ type: ContentChild, args: [CdkDragPlaceholder, { static: false },] }],
        data: [{ type: Input, args: ['cdkDragData',] }],
        lockAxis: [{ type: Input, args: ['cdkDragLockAxis',] }],
        rootElementSelector: [{ type: Input, args: ['cdkDragRootElement',] }],
        boundaryElement: [{ type: Input, args: ['cdkDragBoundary',] }],
        dragStartDelay: [{ type: Input, args: ['cdkDragStartDelay',] }],
        freeDragPosition: [{ type: Input, args: ['cdkDragFreeDragPosition',] }],
        disabled: [{ type: Input, args: ['cdkDragDisabled',] }],
        constrainPosition: [{ type: Input, args: ['cdkDragConstrainPosition',] }],
        started: [{ type: Output, args: ['cdkDragStarted',] }],
        released: [{ type: Output, args: ['cdkDragReleased',] }],
        ended: [{ type: Output, args: ['cdkDragEnded',] }],
        entered: [{ type: Output, args: ['cdkDragEntered',] }],
        exited: [{ type: Output, args: ['cdkDragExited',] }],
        dropped: [{ type: Output, args: ['cdkDragDropped',] }],
        moved: [{ type: Output, args: ['cdkDragMoved',] }]
    };
    return CdkDrag;
}());
export { CdkDrag };
/** Gets the closest ancestor of an element that matches a selector. */
function getClosestMatchingAncestor(element, selector) {
    var currentElement = element.parentElement;
    while (currentElement) {
        // IE doesn't support `matches` so we have to fall back to `msMatchesSelector`.
        if (currentElement.matches ? currentElement.matches(selector) :
            currentElement.msMatchesSelector(selector)) {
            return currentElement;
        }
        currentElement = currentElement.parentElement;
    }
    return null;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2RpcmVjdGl2ZXMvZHJhZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBRUwsWUFBWSxFQUNaLGVBQWUsRUFDZixTQUFTLEVBQ1QsVUFBVSxFQUNWLFlBQVksRUFDWixNQUFNLEVBQ04sY0FBYyxFQUNkLEtBQUssRUFDTCxNQUFNLEVBRU4sUUFBUSxFQUNSLE1BQU0sRUFDTixTQUFTLEVBQ1QsUUFBUSxFQUNSLGdCQUFnQixFQUdoQixpQkFBaUIsRUFDakIsU0FBUyxHQUNWLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxvQkFBb0IsRUFBRSxhQUFhLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNqRyxPQUFPLEVBQUMsVUFBVSxFQUFZLE9BQU8sRUFBRSxLQUFLLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDMUQsT0FBTyxFQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFVL0UsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM1QyxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN0RCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDOUMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRy9DLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFFdEM7OztHQUdHO0FB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QkFHaEQsS0FBSyxTQUFDLGFBQWE7MkJBR25CLEtBQUssU0FBQyxpQkFBaUI7c0NBT3ZCLEtBQUssU0FBQyxvQkFBb0I7a0NBUTFCLEtBQUssU0FBQyxpQkFBaUI7aUNBTXZCLEtBQUssU0FBQyxtQkFBbUI7bUNBTXpCLEtBQUssU0FBQyx5QkFBeUI7MkJBRy9CLEtBQUssU0FBQyxpQkFBaUI7b0NBZ0J2QixLQUFLLFNBQUMsMEJBQTBCOzBCQUdoQyxNQUFNLFNBQUMsZ0JBQWdCOzJCQUd2QixNQUFNLFNBQUMsaUJBQWlCO3dCQUl4QixNQUFNLFNBQUMsY0FBYzswQkFHckIsTUFBTSxTQUFDLGdCQUFnQjt5QkFJdkIsTUFBTSxTQUFDLGVBQWU7MEJBSXRCLE1BQU0sU0FBQyxnQkFBZ0I7d0JBT3ZCLE1BQU0sU0FBQyxjQUFjOztJQXlPeEIsY0FBQztDQUFBLEFBaFZELElBZ1ZDO1NBdFVZLE9BQU87QUF3VXBCLHVFQUF1RTtBQUN2RSxTQUFTLDBCQUEwQixDQUFDLE9BQW9CLEVBQUUsUUFBZ0I7SUFDeEUsSUFBSSxjQUFjLEdBQUcsT0FBTyxDQUFDLGFBQW1DLENBQUM7SUFFakUsT0FBTyxjQUFjLEVBQUU7UUFDckIsK0VBQStFO1FBQy9FLElBQUksY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzFELGNBQXNCLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDdkQsT0FBTyxjQUFjLENBQUM7U0FDdkI7UUFFRCxjQUFjLEdBQUcsY0FBYyxDQUFDLGFBQWEsQ0FBQztLQUMvQztJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtcbiAgQWZ0ZXJWaWV3SW5pdCxcbiAgQ29udGVudENoaWxkLFxuICBDb250ZW50Q2hpbGRyZW4sXG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBJbmplY3QsXG4gIEluamVjdGlvblRva2VuLFxuICBJbnB1dCxcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIE9wdGlvbmFsLFxuICBPdXRwdXQsXG4gIFF1ZXJ5TGlzdCxcbiAgU2tpcFNlbGYsXG4gIFZpZXdDb250YWluZXJSZWYsXG4gIE9uQ2hhbmdlcyxcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIGlzRGV2TW9kZSxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge2NvZXJjZUJvb2xlYW5Qcm9wZXJ0eSwgY29lcmNlTnVtYmVyUHJvcGVydHksIGNvZXJjZUVsZW1lbnR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge09ic2VydmFibGUsIE9ic2VydmVyLCBTdWJqZWN0LCBtZXJnZX0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3N0YXJ0V2l0aCwgdGFrZSwgbWFwLCB0YWtlVW50aWwsIHN3aXRjaE1hcCwgdGFwfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge1xuICBDZGtEcmFnRHJvcCxcbiAgQ2RrRHJhZ0VuZCxcbiAgQ2RrRHJhZ0VudGVyLFxuICBDZGtEcmFnRXhpdCxcbiAgQ2RrRHJhZ01vdmUsXG4gIENka0RyYWdTdGFydCxcbiAgQ2RrRHJhZ1JlbGVhc2UsXG59IGZyb20gJy4uL2RyYWctZXZlbnRzJztcbmltcG9ydCB7Q2RrRHJhZ0hhbmRsZX0gZnJvbSAnLi9kcmFnLWhhbmRsZSc7XG5pbXBvcnQge0Nka0RyYWdQbGFjZWhvbGRlcn0gZnJvbSAnLi9kcmFnLXBsYWNlaG9sZGVyJztcbmltcG9ydCB7Q2RrRHJhZ1ByZXZpZXd9IGZyb20gJy4vZHJhZy1wcmV2aWV3JztcbmltcG9ydCB7Q0RLX0RSQUdfUEFSRU5UfSBmcm9tICcuLi9kcmFnLXBhcmVudCc7XG5pbXBvcnQge0RyYWdSZWYsIERyYWdSZWZDb25maWcsIFBvaW50fSBmcm9tICcuLi9kcmFnLXJlZic7XG5pbXBvcnQge0Nka0Ryb3BMaXN0SW50ZXJuYWwgYXMgQ2RrRHJvcExpc3R9IGZyb20gJy4vZHJvcC1saXN0JztcbmltcG9ydCB7RHJhZ0Ryb3B9IGZyb20gJy4uL2RyYWctZHJvcCc7XG5cbi8qKlxuICogSW5qZWN0aW9uIHRva2VuIHRoYXQgaXMgdXNlZCB0byBwcm92aWRlIGEgQ2RrRHJvcExpc3QgaW5zdGFuY2UgdG8gQ2RrRHJhZy5cbiAqIFVzZWQgZm9yIGF2b2lkaW5nIGNpcmN1bGFyIGltcG9ydHMuXG4gKi9cbmV4cG9ydCBjb25zdCBDREtfRFJPUF9MSVNUID0gbmV3IEluamVjdGlvblRva2VuPENka0Ryb3BMaXN0PignQ0RLX0RST1BfTElTVCcpO1xuXG4vKiogSW5qZWN0aW9uIHRva2VuIHRoYXQgY2FuIGJlIHVzZWQgdG8gY29uZmlndXJlIHRoZSBiZWhhdmlvciBvZiBgQ2RrRHJhZ2AuICovXG5leHBvcnQgY29uc3QgQ0RLX0RSQUdfQ09ORklHID0gbmV3IEluamVjdGlvblRva2VuPERyYWdSZWZDb25maWc+KCdDREtfRFJBR19DT05GSUcnLCB7XG4gIHByb3ZpZGVkSW46ICdyb290JyxcbiAgZmFjdG9yeTogQ0RLX0RSQUdfQ09ORklHX0ZBQ1RPUllcbn0pO1xuXG4vKiogQGRvY3MtcHJpdmF0ZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIENES19EUkFHX0NPTkZJR19GQUNUT1JZKCk6IERyYWdSZWZDb25maWcge1xuICByZXR1cm4ge2RyYWdTdGFydFRocmVzaG9sZDogNSwgcG9pbnRlckRpcmVjdGlvbkNoYW5nZVRocmVzaG9sZDogNX07XG59XG5cbi8qKiBFbGVtZW50IHRoYXQgY2FuIGJlIG1vdmVkIGluc2lkZSBhIENka0Ryb3BMaXN0IGNvbnRhaW5lci4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtEcmFnXScsXG4gIGV4cG9ydEFzOiAnY2RrRHJhZycsXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLWRyYWcnLFxuICAgICdbY2xhc3MuY2RrLWRyYWctZGlzYWJsZWRdJzogJ2Rpc2FibGVkJyxcbiAgICAnW2NsYXNzLmNkay1kcmFnLWRyYWdnaW5nXSc6ICdfZHJhZ1JlZi5pc0RyYWdnaW5nKCknLFxuICB9LFxuICBwcm92aWRlcnM6IFt7cHJvdmlkZTogQ0RLX0RSQUdfUEFSRU5ULCB1c2VFeGlzdGluZzogQ2RrRHJhZ31dXG59KVxuZXhwb3J0IGNsYXNzIENka0RyYWc8VCA9IGFueT4gaW1wbGVtZW50cyBBZnRlclZpZXdJbml0LCBPbkNoYW5nZXMsIE9uRGVzdHJveSB7XG4gIHByaXZhdGUgX2Rlc3Ryb3llZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgdW5kZXJseWluZyBkcmFnIGluc3RhbmNlLiAqL1xuICBfZHJhZ1JlZjogRHJhZ1JlZjxDZGtEcmFnPFQ+PjtcblxuICAvKiogRWxlbWVudHMgdGhhdCBjYW4gYmUgdXNlZCB0byBkcmFnIHRoZSBkcmFnZ2FibGUgaXRlbS4gKi9cbiAgQENvbnRlbnRDaGlsZHJlbihDZGtEcmFnSGFuZGxlLCB7ZGVzY2VuZGFudHM6IHRydWV9KSBfaGFuZGxlczogUXVlcnlMaXN0PENka0RyYWdIYW5kbGU+O1xuXG4gIC8qKiBFbGVtZW50IHRoYXQgd2lsbCBiZSB1c2VkIGFzIGEgdGVtcGxhdGUgdG8gY3JlYXRlIHRoZSBkcmFnZ2FibGUgaXRlbSdzIHByZXZpZXcuICovXG4gIEBDb250ZW50Q2hpbGQoQ2RrRHJhZ1ByZXZpZXcsIHtzdGF0aWM6IGZhbHNlfSkgX3ByZXZpZXdUZW1wbGF0ZTogQ2RrRHJhZ1ByZXZpZXc7XG5cbiAgLyoqIFRlbXBsYXRlIGZvciBwbGFjZWhvbGRlciBlbGVtZW50IHJlbmRlcmVkIHRvIHNob3cgd2hlcmUgYSBkcmFnZ2FibGUgd291bGQgYmUgZHJvcHBlZC4gKi9cbiAgQENvbnRlbnRDaGlsZChDZGtEcmFnUGxhY2Vob2xkZXIsIHtzdGF0aWM6IGZhbHNlfSkgX3BsYWNlaG9sZGVyVGVtcGxhdGU6IENka0RyYWdQbGFjZWhvbGRlcjtcblxuICAvKiogQXJiaXRyYXJ5IGRhdGEgdG8gYXR0YWNoIHRvIHRoaXMgZHJhZyBpbnN0YW5jZS4gKi9cbiAgQElucHV0KCdjZGtEcmFnRGF0YScpIGRhdGE6IFQ7XG5cbiAgLyoqIExvY2tzIHRoZSBwb3NpdGlvbiBvZiB0aGUgZHJhZ2dlZCBlbGVtZW50IGFsb25nIHRoZSBzcGVjaWZpZWQgYXhpcy4gKi9cbiAgQElucHV0KCdjZGtEcmFnTG9ja0F4aXMnKSBsb2NrQXhpczogJ3gnIHwgJ3knO1xuXG4gIC8qKlxuICAgKiBTZWxlY3RvciB0aGF0IHdpbGwgYmUgdXNlZCB0byBkZXRlcm1pbmUgdGhlIHJvb3QgZHJhZ2dhYmxlIGVsZW1lbnQsIHN0YXJ0aW5nIGZyb21cbiAgICogdGhlIGBjZGtEcmFnYCBlbGVtZW50IGFuZCBnb2luZyB1cCB0aGUgRE9NLiBQYXNzaW5nIGFuIGFsdGVybmF0ZSByb290IGVsZW1lbnQgaXMgdXNlZnVsXG4gICAqIHdoZW4gdHJ5aW5nIHRvIGVuYWJsZSBkcmFnZ2luZyBvbiBhbiBlbGVtZW50IHRoYXQgeW91IG1pZ2h0IG5vdCBoYXZlIGFjY2VzcyB0by5cbiAgICovXG4gIEBJbnB1dCgnY2RrRHJhZ1Jvb3RFbGVtZW50Jykgcm9vdEVsZW1lbnRTZWxlY3Rvcjogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBOb2RlIG9yIHNlbGVjdG9yIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGRldGVybWluZSB0aGUgZWxlbWVudCB0byB3aGljaCB0aGUgZHJhZ2dhYmxlJ3NcbiAgICogcG9zaXRpb24gd2lsbCBiZSBjb25zdHJhaW5lZC4gSWYgYSBzdHJpbmcgaXMgcGFzc2VkIGluLCBpdCdsbCBiZSB1c2VkIGFzIGEgc2VsZWN0b3IgdGhhdFxuICAgKiB3aWxsIGJlIG1hdGNoZWQgc3RhcnRpbmcgZnJvbSB0aGUgZWxlbWVudCdzIHBhcmVudCBhbmQgZ29pbmcgdXAgdGhlIERPTSB1bnRpbCBhIG1hdGNoXG4gICAqIGhhcyBiZWVuIGZvdW5kLlxuICAgKi9cbiAgQElucHV0KCdjZGtEcmFnQm91bmRhcnknKSBib3VuZGFyeUVsZW1lbnQ6IHN0cmluZyB8IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+IHwgSFRNTEVsZW1lbnQ7XG5cbiAgLyoqXG4gICAqIEFtb3VudCBvZiBtaWxsaXNlY29uZHMgdG8gd2FpdCBhZnRlciB0aGUgdXNlciBoYXMgcHV0IHRoZWlyXG4gICAqIHBvaW50ZXIgZG93biBiZWZvcmUgc3RhcnRpbmcgdG8gZHJhZyB0aGUgZWxlbWVudC5cbiAgICovXG4gIEBJbnB1dCgnY2RrRHJhZ1N0YXJ0RGVsYXknKSBkcmFnU3RhcnREZWxheTogbnVtYmVyIHwge3RvdWNoOiBudW1iZXIsIG1vdXNlOiBudW1iZXJ9ID0gMDtcblxuICAvKipcbiAgICogU2V0cyB0aGUgcG9zaXRpb24gb2YgYSBgQ2RrRHJhZ2AgdGhhdCBpcyBvdXRzaWRlIG9mIGEgZHJvcCBjb250YWluZXIuXG4gICAqIENhbiBiZSB1c2VkIHRvIHJlc3RvcmUgdGhlIGVsZW1lbnQncyBwb3NpdGlvbiBmb3IgYSByZXR1cm5pbmcgdXNlci5cbiAgICovXG4gIEBJbnB1dCgnY2RrRHJhZ0ZyZWVEcmFnUG9zaXRpb24nKSBmcmVlRHJhZ1Bvc2l0aW9uOiB7eDogbnVtYmVyLCB5OiBudW1iZXJ9O1xuXG4gIC8qKiBXaGV0aGVyIHN0YXJ0aW5nIHRvIGRyYWcgdGhpcyBlbGVtZW50IGlzIGRpc2FibGVkLiAqL1xuICBASW5wdXQoJ2Nka0RyYWdEaXNhYmxlZCcpXG4gIGdldCBkaXNhYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fZGlzYWJsZWQgfHwgKHRoaXMuZHJvcENvbnRhaW5lciAmJiB0aGlzLmRyb3BDb250YWluZXIuZGlzYWJsZWQpO1xuICB9XG4gIHNldCBkaXNhYmxlZCh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX2Rpc2FibGVkID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgICB0aGlzLl9kcmFnUmVmLmRpc2FibGVkID0gdGhpcy5fZGlzYWJsZWQ7XG4gIH1cbiAgcHJpdmF0ZSBfZGlzYWJsZWQgPSBmYWxzZTtcblxuICAvKipcbiAgICogRnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB0byBjdXN0b21pemUgdGhlIGxvZ2ljIG9mIGhvdyB0aGUgcG9zaXRpb24gb2YgdGhlIGRyYWcgaXRlbVxuICAgKiBpcyBsaW1pdGVkIHdoaWxlIGl0J3MgYmVpbmcgZHJhZ2dlZC4gR2V0cyBjYWxsZWQgd2l0aCBhIHBvaW50IGNvbnRhaW5pbmcgdGhlIGN1cnJlbnQgcG9zaXRpb25cbiAgICogb2YgdGhlIHVzZXIncyBwb2ludGVyIG9uIHRoZSBwYWdlIGFuZCBzaG91bGQgcmV0dXJuIGEgcG9pbnQgZGVzY3JpYmluZyB3aGVyZSB0aGUgaXRlbSBzaG91bGRcbiAgICogYmUgcmVuZGVyZWQuXG4gICAqL1xuICBASW5wdXQoJ2Nka0RyYWdDb25zdHJhaW5Qb3NpdGlvbicpIGNvbnN0cmFpblBvc2l0aW9uPzogKHBvaW50OiBQb2ludCwgZHJhZ1JlZjogRHJhZ1JlZikgPT4gUG9pbnQ7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgc3RhcnRzIGRyYWdnaW5nIHRoZSBpdGVtLiAqL1xuICBAT3V0cHV0KCdjZGtEcmFnU3RhcnRlZCcpIHN0YXJ0ZWQ6IEV2ZW50RW1pdHRlcjxDZGtEcmFnU3RhcnQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnU3RhcnQ+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgaGFzIHJlbGVhc2VkIGEgZHJhZyBpdGVtLCBiZWZvcmUgYW55IGFuaW1hdGlvbnMgaGF2ZSBzdGFydGVkLiAqL1xuICBAT3V0cHV0KCdjZGtEcmFnUmVsZWFzZWQnKSByZWxlYXNlZDogRXZlbnRFbWl0dGVyPENka0RyYWdSZWxlYXNlPiA9XG4gICAgICBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdSZWxlYXNlPigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHN0b3BzIGRyYWdnaW5nIGFuIGl0ZW0gaW4gdGhlIGNvbnRhaW5lci4gKi9cbiAgQE91dHB1dCgnY2RrRHJhZ0VuZGVkJykgZW5kZWQ6IEV2ZW50RW1pdHRlcjxDZGtEcmFnRW5kPiA9IG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0VuZD4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBoYXMgbW92ZWQgdGhlIGl0ZW0gaW50byBhIG5ldyBjb250YWluZXIuICovXG4gIEBPdXRwdXQoJ2Nka0RyYWdFbnRlcmVkJykgZW50ZXJlZDogRXZlbnRFbWl0dGVyPENka0RyYWdFbnRlcjxhbnk+PiA9XG4gICAgICBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdFbnRlcjxhbnk+PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHJlbW92ZXMgdGhlIGl0ZW0gaXRzIGNvbnRhaW5lciBieSBkcmFnZ2luZyBpdCBpbnRvIGFub3RoZXIgY29udGFpbmVyLiAqL1xuICBAT3V0cHV0KCdjZGtEcmFnRXhpdGVkJykgZXhpdGVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0V4aXQ8YW55Pj4gPVxuICAgICAgbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnRXhpdDxhbnk+PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGRyb3BzIHRoZSBpdGVtIGluc2lkZSBhIGNvbnRhaW5lci4gKi9cbiAgQE91dHB1dCgnY2RrRHJhZ0Ryb3BwZWQnKSBkcm9wcGVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0Ryb3A8YW55Pj4gPVxuICAgICAgbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnRHJvcDxhbnk+PigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyBhcyB0aGUgdXNlciBpcyBkcmFnZ2luZyB0aGUgaXRlbS4gVXNlIHdpdGggY2F1dGlvbixcbiAgICogYmVjYXVzZSB0aGlzIGV2ZW50IHdpbGwgZmlyZSBmb3IgZXZlcnkgcGl4ZWwgdGhhdCB0aGUgdXNlciBoYXMgZHJhZ2dlZC5cbiAgICovXG4gIEBPdXRwdXQoJ2Nka0RyYWdNb3ZlZCcpIG1vdmVkOiBPYnNlcnZhYmxlPENka0RyYWdNb3ZlPFQ+PiA9XG4gICAgICBuZXcgT2JzZXJ2YWJsZSgob2JzZXJ2ZXI6IE9ic2VydmVyPENka0RyYWdNb3ZlPFQ+PikgPT4ge1xuICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSB0aGlzLl9kcmFnUmVmLm1vdmVkLnBpcGUobWFwKG1vdmVkRXZlbnQgPT4gKHtcbiAgICAgICAgICBzb3VyY2U6IHRoaXMsXG4gICAgICAgICAgcG9pbnRlclBvc2l0aW9uOiBtb3ZlZEV2ZW50LnBvaW50ZXJQb3NpdGlvbixcbiAgICAgICAgICBldmVudDogbW92ZWRFdmVudC5ldmVudCxcbiAgICAgICAgICBkZWx0YTogbW92ZWRFdmVudC5kZWx0YSxcbiAgICAgICAgICBkaXN0YW5jZTogbW92ZWRFdmVudC5kaXN0YW5jZVxuICAgICAgICB9KSkpLnN1YnNjcmliZShvYnNlcnZlcik7XG5cbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgLyoqIEVsZW1lbnQgdGhhdCB0aGUgZHJhZ2dhYmxlIGlzIGF0dGFjaGVkIHRvLiAqL1xuICAgICAgcHVibGljIGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgICAgLyoqIERyb3BwYWJsZSBjb250YWluZXIgdGhhdCB0aGUgZHJhZ2dhYmxlIGlzIGEgcGFydCBvZi4gKi9cbiAgICAgIEBJbmplY3QoQ0RLX0RST1BfTElTVCkgQE9wdGlvbmFsKCkgQFNraXBTZWxmKCkgcHVibGljIGRyb3BDb250YWluZXI6IENka0Ryb3BMaXN0LFxuICAgICAgQEluamVjdChET0NVTUVOVCkgcHJpdmF0ZSBfZG9jdW1lbnQ6IGFueSwgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgICBwcml2YXRlIF92aWV3Q29udGFpbmVyUmVmOiBWaWV3Q29udGFpbmVyUmVmLCBASW5qZWN0KENES19EUkFHX0NPTkZJRykgY29uZmlnOiBEcmFnUmVmQ29uZmlnLFxuICAgICAgQE9wdGlvbmFsKCkgcHJpdmF0ZSBfZGlyOiBEaXJlY3Rpb25hbGl0eSwgZHJhZ0Ryb3A6IERyYWdEcm9wLFxuICAgICAgcHJpdmF0ZSBfY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmKSB7XG4gICAgdGhpcy5fZHJhZ1JlZiA9IGRyYWdEcm9wLmNyZWF0ZURyYWcoZWxlbWVudCwgY29uZmlnKTtcbiAgICB0aGlzLl9kcmFnUmVmLmRhdGEgPSB0aGlzO1xuICAgIHRoaXMuX3N5bmNJbnB1dHModGhpcy5fZHJhZ1JlZik7XG4gICAgdGhpcy5faGFuZGxlRXZlbnRzKHRoaXMuX2RyYWdSZWYpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGVsZW1lbnQgdGhhdCBpcyBiZWluZyB1c2VkIGFzIGEgcGxhY2Vob2xkZXJcbiAgICogd2hpbGUgdGhlIGN1cnJlbnQgZWxlbWVudCBpcyBiZWluZyBkcmFnZ2VkLlxuICAgKi9cbiAgZ2V0UGxhY2Vob2xkZXJFbGVtZW50KCk6IEhUTUxFbGVtZW50IHtcbiAgICByZXR1cm4gdGhpcy5fZHJhZ1JlZi5nZXRQbGFjZWhvbGRlckVsZW1lbnQoKTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHRoZSByb290IGRyYWdnYWJsZSBlbGVtZW50LiAqL1xuICBnZXRSb290RWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX2RyYWdSZWYuZ2V0Um9vdEVsZW1lbnQoKTtcbiAgfVxuXG4gIC8qKiBSZXNldHMgYSBzdGFuZGFsb25lIGRyYWcgaXRlbSB0byBpdHMgaW5pdGlhbCBwb3NpdGlvbi4gKi9cbiAgcmVzZXQoKTogdm9pZCB7XG4gICAgdGhpcy5fZHJhZ1JlZi5yZXNldCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHBpeGVsIGNvb3JkaW5hdGVzIG9mIHRoZSBkcmFnZ2FibGUgb3V0c2lkZSBvZiBhIGRyb3AgY29udGFpbmVyLlxuICAgKi9cbiAgZ2V0RnJlZURyYWdQb3NpdGlvbigpOiB7cmVhZG9ubHkgeDogbnVtYmVyLCByZWFkb25seSB5OiBudW1iZXJ9IHtcbiAgICByZXR1cm4gdGhpcy5fZHJhZ1JlZi5nZXRGcmVlRHJhZ1Bvc2l0aW9uKCk7XG4gIH1cblxuICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgLy8gV2UgbmVlZCB0byB3YWl0IGZvciB0aGUgem9uZSB0byBzdGFiaWxpemUsIGluIG9yZGVyIGZvciB0aGUgcmVmZXJlbmNlXG4gICAgLy8gZWxlbWVudCB0byBiZSBpbiB0aGUgcHJvcGVyIHBsYWNlIGluIHRoZSBET00uIFRoaXMgaXMgbW9zdGx5IHJlbGV2YW50XG4gICAgLy8gZm9yIGRyYWdnYWJsZSBlbGVtZW50cyBpbnNpZGUgcG9ydGFscyBzaW5jZSB0aGV5IGdldCBzdGFtcGVkIG91dCBpblxuICAgIC8vIHRoZWlyIG9yaWdpbmFsIERPTSBwb3NpdGlvbiBhbmQgdGhlbiB0aGV5IGdldCB0cmFuc2ZlcnJlZCB0byB0aGUgcG9ydGFsLlxuICAgIHRoaXMuX25nWm9uZS5vblN0YWJsZS5hc09ic2VydmFibGUoKVxuICAgICAgLnBpcGUodGFrZSgxKSwgdGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpXG4gICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgdGhpcy5fdXBkYXRlUm9vdEVsZW1lbnQoKTtcblxuICAgICAgICAvLyBMaXN0ZW4gZm9yIGFueSBuZXdseS1hZGRlZCBoYW5kbGVzLlxuICAgICAgICB0aGlzLl9oYW5kbGVzLmNoYW5nZXMucGlwZShcbiAgICAgICAgICBzdGFydFdpdGgodGhpcy5faGFuZGxlcyksXG4gICAgICAgICAgLy8gU3luYyB0aGUgbmV3IGhhbmRsZXMgd2l0aCB0aGUgRHJhZ1JlZi5cbiAgICAgICAgICB0YXAoKGhhbmRsZXM6IFF1ZXJ5TGlzdDxDZGtEcmFnSGFuZGxlPikgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2hpbGRIYW5kbGVFbGVtZW50cyA9IGhhbmRsZXNcbiAgICAgICAgICAgICAgLmZpbHRlcihoYW5kbGUgPT4gaGFuZGxlLl9wYXJlbnREcmFnID09PSB0aGlzKVxuICAgICAgICAgICAgICAubWFwKGhhbmRsZSA9PiBoYW5kbGUuZWxlbWVudCk7XG4gICAgICAgICAgICB0aGlzLl9kcmFnUmVmLndpdGhIYW5kbGVzKGNoaWxkSGFuZGxlRWxlbWVudHMpO1xuICAgICAgICAgIH0pLFxuICAgICAgICAgIC8vIExpc3RlbiBpZiB0aGUgc3RhdGUgb2YgYW55IG9mIHRoZSBoYW5kbGVzIGNoYW5nZXMuXG4gICAgICAgICAgc3dpdGNoTWFwKChoYW5kbGVzOiBRdWVyeUxpc3Q8Q2RrRHJhZ0hhbmRsZT4pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBtZXJnZSguLi5oYW5kbGVzLm1hcChpdGVtID0+IGl0ZW0uX3N0YXRlQ2hhbmdlcykpO1xuICAgICAgICAgIH0pLFxuICAgICAgICAgIHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpXG4gICAgICAgICkuc3Vic2NyaWJlKGhhbmRsZUluc3RhbmNlID0+IHtcbiAgICAgICAgICAvLyBFbmFibGVkL2Rpc2FibGUgdGhlIGhhbmRsZSB0aGF0IGNoYW5nZWQgaW4gdGhlIERyYWdSZWYuXG4gICAgICAgICAgY29uc3QgZHJhZ1JlZiA9IHRoaXMuX2RyYWdSZWY7XG4gICAgICAgICAgY29uc3QgaGFuZGxlID0gaGFuZGxlSW5zdGFuY2UuZWxlbWVudC5uYXRpdmVFbGVtZW50O1xuICAgICAgICAgIGhhbmRsZUluc3RhbmNlLmRpc2FibGVkID8gZHJhZ1JlZi5kaXNhYmxlSGFuZGxlKGhhbmRsZSkgOiBkcmFnUmVmLmVuYWJsZUhhbmRsZShoYW5kbGUpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAodGhpcy5mcmVlRHJhZ1Bvc2l0aW9uKSB7XG4gICAgICAgICAgdGhpcy5fZHJhZ1JlZi5zZXRGcmVlRHJhZ1Bvc2l0aW9uKHRoaXMuZnJlZURyYWdQb3NpdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcykge1xuICAgIGNvbnN0IHJvb3RTZWxlY3RvckNoYW5nZSA9IGNoYW5nZXNbJ3Jvb3RFbGVtZW50U2VsZWN0b3InXTtcbiAgICBjb25zdCBwb3NpdGlvbkNoYW5nZSA9IGNoYW5nZXNbJ2ZyZWVEcmFnUG9zaXRpb24nXTtcblxuICAgIC8vIFdlIGRvbid0IGhhdmUgdG8gcmVhY3QgdG8gdGhlIGZpcnN0IGNoYW5nZSBzaW5jZSBpdCdzIGJlaW5nXG4gICAgLy8gaGFuZGxlZCBpbiBgbmdBZnRlclZpZXdJbml0YCB3aGVyZSBpdCBuZWVkcyB0byBiZSBkZWZlcnJlZC5cbiAgICBpZiAocm9vdFNlbGVjdG9yQ2hhbmdlICYmICFyb290U2VsZWN0b3JDaGFuZ2UuZmlyc3RDaGFuZ2UpIHtcbiAgICAgIHRoaXMuX3VwZGF0ZVJvb3RFbGVtZW50KCk7XG4gICAgfVxuXG4gICAgLy8gU2tpcCB0aGUgZmlyc3QgY2hhbmdlIHNpbmNlIGl0J3MgYmVpbmcgaGFuZGxlZCBpbiBgbmdBZnRlclZpZXdJbml0YC5cbiAgICBpZiAocG9zaXRpb25DaGFuZ2UgJiYgIXBvc2l0aW9uQ2hhbmdlLmZpcnN0Q2hhbmdlICYmIHRoaXMuZnJlZURyYWdQb3NpdGlvbikge1xuICAgICAgdGhpcy5fZHJhZ1JlZi5zZXRGcmVlRHJhZ1Bvc2l0aW9uKHRoaXMuZnJlZURyYWdQb3NpdGlvbik7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLl9kcmFnUmVmLmRpc3Bvc2UoKTtcbiAgfVxuXG4gIC8qKiBTeW5jcyB0aGUgcm9vdCBlbGVtZW50IHdpdGggdGhlIGBEcmFnUmVmYC4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlUm9vdEVsZW1lbnQoKSB7XG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50O1xuICAgIGNvbnN0IHJvb3RFbGVtZW50ID0gdGhpcy5yb290RWxlbWVudFNlbGVjdG9yID9cbiAgICAgICAgZ2V0Q2xvc2VzdE1hdGNoaW5nQW5jZXN0b3IoZWxlbWVudCwgdGhpcy5yb290RWxlbWVudFNlbGVjdG9yKSA6IGVsZW1lbnQ7XG5cbiAgICBpZiAocm9vdEVsZW1lbnQgJiYgcm9vdEVsZW1lbnQubm9kZVR5cGUgIT09IHRoaXMuX2RvY3VtZW50LkVMRU1FTlRfTk9ERSkge1xuICAgICAgdGhyb3cgRXJyb3IoYGNka0RyYWcgbXVzdCBiZSBhdHRhY2hlZCB0byBhbiBlbGVtZW50IG5vZGUuIGAgK1xuICAgICAgICAgICAgICAgICAgYEN1cnJlbnRseSBhdHRhY2hlZCB0byBcIiR7cm9vdEVsZW1lbnQubm9kZU5hbWV9XCIuYCk7XG4gICAgfVxuXG4gICAgdGhpcy5fZHJhZ1JlZi53aXRoUm9vdEVsZW1lbnQocm9vdEVsZW1lbnQgfHwgZWxlbWVudCk7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgYm91bmRhcnkgZWxlbWVudCwgYmFzZWQgb24gdGhlIGBib3VuZGFyeUVsZW1lbnRgIHZhbHVlLiAqL1xuICBwcml2YXRlIF9nZXRCb3VuZGFyeUVsZW1lbnQoKSB7XG4gICAgY29uc3QgYm91bmRhcnkgPSB0aGlzLmJvdW5kYXJ5RWxlbWVudDtcblxuICAgIGlmICghYm91bmRhcnkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgYm91bmRhcnkgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gZ2V0Q2xvc2VzdE1hdGNoaW5nQW5jZXN0b3IodGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQsIGJvdW5kYXJ5KTtcbiAgICB9XG5cbiAgICBjb25zdCBlbGVtZW50ID0gY29lcmNlRWxlbWVudChib3VuZGFyeSk7XG5cbiAgICBpZiAoaXNEZXZNb2RlKCkgJiYgIWVsZW1lbnQuY29udGFpbnModGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQpKSB7XG4gICAgICB0aHJvdyBFcnJvcignRHJhZ2dhYmxlIGVsZW1lbnQgaXMgbm90IGluc2lkZSBvZiB0aGUgbm9kZSBwYXNzZWQgaW50byBjZGtEcmFnQm91bmRhcnkuJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH1cblxuICAvKiogU3luY3MgdGhlIGlucHV0cyBvZiB0aGUgQ2RrRHJhZyB3aXRoIHRoZSBvcHRpb25zIG9mIHRoZSB1bmRlcmx5aW5nIERyYWdSZWYuICovXG4gIHByaXZhdGUgX3N5bmNJbnB1dHMocmVmOiBEcmFnUmVmPENka0RyYWc8VD4+KSB7XG4gICAgcmVmLmJlZm9yZVN0YXJ0ZWQuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIGlmICghcmVmLmlzRHJhZ2dpbmcoKSkge1xuICAgICAgICBjb25zdCBkaXIgPSB0aGlzLl9kaXI7XG4gICAgICAgIGNvbnN0IGRyYWdTdGFydERlbGF5ID0gdGhpcy5kcmFnU3RhcnREZWxheTtcbiAgICAgICAgY29uc3QgcGxhY2Vob2xkZXIgPSB0aGlzLl9wbGFjZWhvbGRlclRlbXBsYXRlID8ge1xuICAgICAgICAgIHRlbXBsYXRlOiB0aGlzLl9wbGFjZWhvbGRlclRlbXBsYXRlLnRlbXBsYXRlUmVmLFxuICAgICAgICAgIGNvbnRleHQ6IHRoaXMuX3BsYWNlaG9sZGVyVGVtcGxhdGUuZGF0YSxcbiAgICAgICAgICB2aWV3Q29udGFpbmVyOiB0aGlzLl92aWV3Q29udGFpbmVyUmVmXG4gICAgICAgIH0gOiBudWxsO1xuICAgICAgICBjb25zdCBwcmV2aWV3ID0gdGhpcy5fcHJldmlld1RlbXBsYXRlID8ge1xuICAgICAgICAgIHRlbXBsYXRlOiB0aGlzLl9wcmV2aWV3VGVtcGxhdGUudGVtcGxhdGVSZWYsXG4gICAgICAgICAgY29udGV4dDogdGhpcy5fcHJldmlld1RlbXBsYXRlLmRhdGEsXG4gICAgICAgICAgdmlld0NvbnRhaW5lcjogdGhpcy5fdmlld0NvbnRhaW5lclJlZlxuICAgICAgICB9IDogbnVsbDtcblxuICAgICAgICByZWYuZGlzYWJsZWQgPSB0aGlzLmRpc2FibGVkO1xuICAgICAgICByZWYubG9ja0F4aXMgPSB0aGlzLmxvY2tBeGlzO1xuICAgICAgICByZWYuZHJhZ1N0YXJ0RGVsYXkgPSAodHlwZW9mIGRyYWdTdGFydERlbGF5ID09PSAnb2JqZWN0JyAmJiBkcmFnU3RhcnREZWxheSkgP1xuICAgICAgICAgICAgZHJhZ1N0YXJ0RGVsYXkgOiBjb2VyY2VOdW1iZXJQcm9wZXJ0eShkcmFnU3RhcnREZWxheSk7XG4gICAgICAgIHJlZi5jb25zdHJhaW5Qb3NpdGlvbiA9IHRoaXMuY29uc3RyYWluUG9zaXRpb247XG4gICAgICAgIHJlZlxuICAgICAgICAgIC53aXRoQm91bmRhcnlFbGVtZW50KHRoaXMuX2dldEJvdW5kYXJ5RWxlbWVudCgpKVxuICAgICAgICAgIC53aXRoUGxhY2Vob2xkZXJUZW1wbGF0ZShwbGFjZWhvbGRlcilcbiAgICAgICAgICAud2l0aFByZXZpZXdUZW1wbGF0ZShwcmV2aWV3KTtcblxuICAgICAgICBpZiAoZGlyKSB7XG4gICAgICAgICAgcmVmLndpdGhEaXJlY3Rpb24oZGlyLnZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqIEhhbmRsZXMgdGhlIGV2ZW50cyBmcm9tIHRoZSB1bmRlcmx5aW5nIGBEcmFnUmVmYC4gKi9cbiAgcHJpdmF0ZSBfaGFuZGxlRXZlbnRzKHJlZjogRHJhZ1JlZjxDZGtEcmFnPFQ+Pikge1xuICAgIHJlZi5zdGFydGVkLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICB0aGlzLnN0YXJ0ZWQuZW1pdCh7c291cmNlOiB0aGlzfSk7XG5cbiAgICAgIC8vIFNpbmNlIGFsbCBvZiB0aGVzZSBldmVudHMgcnVuIG91dHNpZGUgb2YgY2hhbmdlIGRldGVjdGlvbixcbiAgICAgIC8vIHdlIG5lZWQgdG8gZW5zdXJlIHRoYXQgZXZlcnl0aGluZyBpcyBtYXJrZWQgY29ycmVjdGx5LlxuICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgfSk7XG5cbiAgICByZWYucmVsZWFzZWQuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIHRoaXMucmVsZWFzZWQuZW1pdCh7c291cmNlOiB0aGlzfSk7XG4gICAgfSk7XG5cbiAgICByZWYuZW5kZWQuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgIHRoaXMuZW5kZWQuZW1pdCh7c291cmNlOiB0aGlzLCBkaXN0YW5jZTogZXZlbnQuZGlzdGFuY2V9KTtcblxuICAgICAgLy8gU2luY2UgYWxsIG9mIHRoZXNlIGV2ZW50cyBydW4gb3V0c2lkZSBvZiBjaGFuZ2UgZGV0ZWN0aW9uLFxuICAgICAgLy8gd2UgbmVlZCB0byBlbnN1cmUgdGhhdCBldmVyeXRoaW5nIGlzIG1hcmtlZCBjb3JyZWN0bHkuXG4gICAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgICB9KTtcblxuICAgIHJlZi5lbnRlcmVkLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICB0aGlzLmVudGVyZWQuZW1pdCh7XG4gICAgICAgIGNvbnRhaW5lcjogZXZlbnQuY29udGFpbmVyLmRhdGEsXG4gICAgICAgIGl0ZW06IHRoaXMsXG4gICAgICAgIGN1cnJlbnRJbmRleDogZXZlbnQuY3VycmVudEluZGV4XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJlZi5leGl0ZWQuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgIHRoaXMuZXhpdGVkLmVtaXQoe1xuICAgICAgICBjb250YWluZXI6IGV2ZW50LmNvbnRhaW5lci5kYXRhLFxuICAgICAgICBpdGVtOiB0aGlzXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJlZi5kcm9wcGVkLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICB0aGlzLmRyb3BwZWQuZW1pdCh7XG4gICAgICAgIHByZXZpb3VzSW5kZXg6IGV2ZW50LnByZXZpb3VzSW5kZXgsXG4gICAgICAgIGN1cnJlbnRJbmRleDogZXZlbnQuY3VycmVudEluZGV4LFxuICAgICAgICBwcmV2aW91c0NvbnRhaW5lcjogZXZlbnQucHJldmlvdXNDb250YWluZXIuZGF0YSxcbiAgICAgICAgY29udGFpbmVyOiBldmVudC5jb250YWluZXIuZGF0YSxcbiAgICAgICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcjogZXZlbnQuaXNQb2ludGVyT3ZlckNvbnRhaW5lcixcbiAgICAgICAgaXRlbTogdGhpcyxcbiAgICAgICAgZGlzdGFuY2U6IGV2ZW50LmRpc3RhbmNlXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG4vKiogR2V0cyB0aGUgY2xvc2VzdCBhbmNlc3RvciBvZiBhbiBlbGVtZW50IHRoYXQgbWF0Y2hlcyBhIHNlbGVjdG9yLiAqL1xuZnVuY3Rpb24gZ2V0Q2xvc2VzdE1hdGNoaW5nQW5jZXN0b3IoZWxlbWVudDogSFRNTEVsZW1lbnQsIHNlbGVjdG9yOiBzdHJpbmcpIHtcbiAgbGV0IGN1cnJlbnRFbGVtZW50ID0gZWxlbWVudC5wYXJlbnRFbGVtZW50IGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcblxuICB3aGlsZSAoY3VycmVudEVsZW1lbnQpIHtcbiAgICAvLyBJRSBkb2Vzbid0IHN1cHBvcnQgYG1hdGNoZXNgIHNvIHdlIGhhdmUgdG8gZmFsbCBiYWNrIHRvIGBtc01hdGNoZXNTZWxlY3RvcmAuXG4gICAgaWYgKGN1cnJlbnRFbGVtZW50Lm1hdGNoZXMgPyBjdXJyZW50RWxlbWVudC5tYXRjaGVzKHNlbGVjdG9yKSA6XG4gICAgICAgIChjdXJyZW50RWxlbWVudCBhcyBhbnkpLm1zTWF0Y2hlc1NlbGVjdG9yKHNlbGVjdG9yKSkge1xuICAgICAgcmV0dXJuIGN1cnJlbnRFbGVtZW50O1xuICAgIH1cblxuICAgIGN1cnJlbnRFbGVtZW50ID0gY3VycmVudEVsZW1lbnQucGFyZW50RWxlbWVudDtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG4iXX0=