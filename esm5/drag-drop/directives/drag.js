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
                ref.previewClass = _this.previewClass;
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
        previewClass: [{ type: Input, args: ['cdkDragPreviewClass',] }],
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2RpcmVjdGl2ZXMvZHJhZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBRUwsWUFBWSxFQUNaLGVBQWUsRUFDZixTQUFTLEVBQ1QsVUFBVSxFQUNWLFlBQVksRUFDWixNQUFNLEVBQ04sY0FBYyxFQUNkLEtBQUssRUFDTCxNQUFNLEVBRU4sUUFBUSxFQUNSLE1BQU0sRUFDTixTQUFTLEVBQ1QsUUFBUSxFQUNSLGdCQUFnQixFQUdoQixpQkFBaUIsRUFDakIsU0FBUyxHQUNWLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxvQkFBb0IsRUFBRSxhQUFhLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNqRyxPQUFPLEVBQUMsVUFBVSxFQUFZLE9BQU8sRUFBRSxLQUFLLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDMUQsT0FBTyxFQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFVL0UsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM1QyxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN0RCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDOUMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRy9DLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFFdEM7OztHQUdHO0FB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QUFZLFNBQUMsa0JBQWtCLEVBQUUsRUFBQyxNQUFNLEVBQUUsS0FBSyxFQUFDO3VCQUdoRCxLQUFLLFNBQUMsYUFBYTsyQkFHbkIsS0FBSyxTQUFDLGlCQUFpQjtzQ0FPdkIsS0FBSyxTQUFDLG9CQUFvQjtrQ0FRMUIsS0FBSyxTQUFDLGlCQUFpQjtpQ0FNdkIsS0FBSyxTQUFDLG1CQUFtQjttQ0FNekIsS0FBSyxTQUFDLHlCQUF5QjsyQkFHL0IsS0FBSyxTQUFDLGlCQUFpQjtvQ0FnQnZCLEtBQUssU0FBQywwQkFBMEI7K0JBR2hDLEtBQUssU0FBQyxxQkFBcUI7MEJBRzNCLE1BQU0sU0FBQyxnQkFBZ0I7MkJBR3ZCLE1BQU0sU0FBQyxpQkFBaUI7d0JBSXhCLE1BQU0sU0FBQyxjQUFjOzBCQUdyQixNQUFNLFNBQUMsZ0JBQWdCO3lCQUl2QixNQUFNLFNBQUMsZUFBZTswQkFJdEIsTUFBTSxTQUFDLGdCQUFnQjt3QkFPdkIsTUFBTSxTQUFDLGNBQWM7O0lBME94QixjQUFDO0NBQUEsQUFwVkQsSUFvVkM7U0ExVVksT0FBTztBQTRVcEIsdUVBQXVFO0FBQ3ZFLFNBQVMsMEJBQTBCLENBQUMsT0FBb0IsRUFBRSxRQUFnQjtJQUN4RSxJQUFJLGNBQWMsR0FBRyxPQUFPLENBQUMsYUFBbUMsQ0FBQztJQUVqRSxPQUFPLGNBQWMsRUFBRTtRQUNyQiwrRUFBK0U7UUFDL0UsSUFBSSxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDMUQsY0FBc0IsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUN2RCxPQUFPLGNBQWMsQ0FBQztTQUN2QjtRQUVELGNBQWMsR0FBRyxjQUFjLENBQUMsYUFBYSxDQUFDO0tBQy9DO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge1xuICBBZnRlclZpZXdJbml0LFxuICBDb250ZW50Q2hpbGQsXG4gIENvbnRlbnRDaGlsZHJlbixcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIEluamVjdCxcbiAgSW5qZWN0aW9uVG9rZW4sXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgT3B0aW9uYWwsXG4gIE91dHB1dCxcbiAgUXVlcnlMaXN0LFxuICBTa2lwU2VsZixcbiAgVmlld0NvbnRhaW5lclJlZixcbiAgT25DaGFuZ2VzLFxuICBTaW1wbGVDaGFuZ2VzLFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgaXNEZXZNb2RlLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Y29lcmNlQm9vbGVhblByb3BlcnR5LCBjb2VyY2VOdW1iZXJQcm9wZXJ0eSwgY29lcmNlRWxlbWVudH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgT2JzZXJ2ZXIsIFN1YmplY3QsIG1lcmdlfSBmcm9tICdyeGpzJztcbmltcG9ydCB7c3RhcnRXaXRoLCB0YWtlLCBtYXAsIHRha2VVbnRpbCwgc3dpdGNoTWFwLCB0YXB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7XG4gIENka0RyYWdEcm9wLFxuICBDZGtEcmFnRW5kLFxuICBDZGtEcmFnRW50ZXIsXG4gIENka0RyYWdFeGl0LFxuICBDZGtEcmFnTW92ZSxcbiAgQ2RrRHJhZ1N0YXJ0LFxuICBDZGtEcmFnUmVsZWFzZSxcbn0gZnJvbSAnLi4vZHJhZy1ldmVudHMnO1xuaW1wb3J0IHtDZGtEcmFnSGFuZGxlfSBmcm9tICcuL2RyYWctaGFuZGxlJztcbmltcG9ydCB7Q2RrRHJhZ1BsYWNlaG9sZGVyfSBmcm9tICcuL2RyYWctcGxhY2Vob2xkZXInO1xuaW1wb3J0IHtDZGtEcmFnUHJldmlld30gZnJvbSAnLi9kcmFnLXByZXZpZXcnO1xuaW1wb3J0IHtDREtfRFJBR19QQVJFTlR9IGZyb20gJy4uL2RyYWctcGFyZW50JztcbmltcG9ydCB7RHJhZ1JlZiwgRHJhZ1JlZkNvbmZpZywgUG9pbnR9IGZyb20gJy4uL2RyYWctcmVmJztcbmltcG9ydCB7Q2RrRHJvcExpc3RJbnRlcm5hbCBhcyBDZGtEcm9wTGlzdH0gZnJvbSAnLi9kcm9wLWxpc3QnO1xuaW1wb3J0IHtEcmFnRHJvcH0gZnJvbSAnLi4vZHJhZy1kcm9wJztcblxuLyoqXG4gKiBJbmplY3Rpb24gdG9rZW4gdGhhdCBpcyB1c2VkIHRvIHByb3ZpZGUgYSBDZGtEcm9wTGlzdCBpbnN0YW5jZSB0byBDZGtEcmFnLlxuICogVXNlZCBmb3IgYXZvaWRpbmcgY2lyY3VsYXIgaW1wb3J0cy5cbiAqL1xuZXhwb3J0IGNvbnN0IENES19EUk9QX0xJU1QgPSBuZXcgSW5qZWN0aW9uVG9rZW48Q2RrRHJvcExpc3Q+KCdDREtfRFJPUF9MSVNUJyk7XG5cbi8qKiBJbmplY3Rpb24gdG9rZW4gdGhhdCBjYW4gYmUgdXNlZCB0byBjb25maWd1cmUgdGhlIGJlaGF2aW9yIG9mIGBDZGtEcmFnYC4gKi9cbmV4cG9ydCBjb25zdCBDREtfRFJBR19DT05GSUcgPSBuZXcgSW5qZWN0aW9uVG9rZW48RHJhZ1JlZkNvbmZpZz4oJ0NES19EUkFHX0NPTkZJRycsIHtcbiAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxuICBmYWN0b3J5OiBDREtfRFJBR19DT05GSUdfRkFDVE9SWVxufSk7XG5cbi8qKiBAZG9jcy1wcml2YXRlICovXG5leHBvcnQgZnVuY3Rpb24gQ0RLX0RSQUdfQ09ORklHX0ZBQ1RPUlkoKTogRHJhZ1JlZkNvbmZpZyB7XG4gIHJldHVybiB7ZHJhZ1N0YXJ0VGhyZXNob2xkOiA1LCBwb2ludGVyRGlyZWN0aW9uQ2hhbmdlVGhyZXNob2xkOiA1fTtcbn1cblxuLyoqIEVsZW1lbnQgdGhhdCBjYW4gYmUgbW92ZWQgaW5zaWRlIGEgQ2RrRHJvcExpc3QgY29udGFpbmVyLiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka0RyYWddJyxcbiAgZXhwb3J0QXM6ICdjZGtEcmFnJyxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstZHJhZycsXG4gICAgJ1tjbGFzcy5jZGstZHJhZy1kaXNhYmxlZF0nOiAnZGlzYWJsZWQnLFxuICAgICdbY2xhc3MuY2RrLWRyYWctZHJhZ2dpbmddJzogJ19kcmFnUmVmLmlzRHJhZ2dpbmcoKScsXG4gIH0sXG4gIHByb3ZpZGVyczogW3twcm92aWRlOiBDREtfRFJBR19QQVJFTlQsIHVzZUV4aXN0aW5nOiBDZGtEcmFnfV1cbn0pXG5leHBvcnQgY2xhc3MgQ2RrRHJhZzxUID0gYW55PiBpbXBsZW1lbnRzIEFmdGVyVmlld0luaXQsIE9uQ2hhbmdlcywgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSBfZGVzdHJveWVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSB1bmRlcmx5aW5nIGRyYWcgaW5zdGFuY2UuICovXG4gIF9kcmFnUmVmOiBEcmFnUmVmPENka0RyYWc8VD4+O1xuXG4gIC8qKiBFbGVtZW50cyB0aGF0IGNhbiBiZSB1c2VkIHRvIGRyYWcgdGhlIGRyYWdnYWJsZSBpdGVtLiAqL1xuICBAQ29udGVudENoaWxkcmVuKENka0RyYWdIYW5kbGUsIHtkZXNjZW5kYW50czogdHJ1ZX0pIF9oYW5kbGVzOiBRdWVyeUxpc3Q8Q2RrRHJhZ0hhbmRsZT47XG5cbiAgLyoqIEVsZW1lbnQgdGhhdCB3aWxsIGJlIHVzZWQgYXMgYSB0ZW1wbGF0ZSB0byBjcmVhdGUgdGhlIGRyYWdnYWJsZSBpdGVtJ3MgcHJldmlldy4gKi9cbiAgQENvbnRlbnRDaGlsZChDZGtEcmFnUHJldmlldywge3N0YXRpYzogZmFsc2V9KSBfcHJldmlld1RlbXBsYXRlOiBDZGtEcmFnUHJldmlldztcblxuICAvKiogVGVtcGxhdGUgZm9yIHBsYWNlaG9sZGVyIGVsZW1lbnQgcmVuZGVyZWQgdG8gc2hvdyB3aGVyZSBhIGRyYWdnYWJsZSB3b3VsZCBiZSBkcm9wcGVkLiAqL1xuICBAQ29udGVudENoaWxkKENka0RyYWdQbGFjZWhvbGRlciwge3N0YXRpYzogZmFsc2V9KSBfcGxhY2Vob2xkZXJUZW1wbGF0ZTogQ2RrRHJhZ1BsYWNlaG9sZGVyO1xuXG4gIC8qKiBBcmJpdHJhcnkgZGF0YSB0byBhdHRhY2ggdG8gdGhpcyBkcmFnIGluc3RhbmNlLiAqL1xuICBASW5wdXQoJ2Nka0RyYWdEYXRhJykgZGF0YTogVDtcblxuICAvKiogTG9ja3MgdGhlIHBvc2l0aW9uIG9mIHRoZSBkcmFnZ2VkIGVsZW1lbnQgYWxvbmcgdGhlIHNwZWNpZmllZCBheGlzLiAqL1xuICBASW5wdXQoJ2Nka0RyYWdMb2NrQXhpcycpIGxvY2tBeGlzOiAneCcgfCAneSc7XG5cbiAgLyoqXG4gICAqIFNlbGVjdG9yIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGRldGVybWluZSB0aGUgcm9vdCBkcmFnZ2FibGUgZWxlbWVudCwgc3RhcnRpbmcgZnJvbVxuICAgKiB0aGUgYGNka0RyYWdgIGVsZW1lbnQgYW5kIGdvaW5nIHVwIHRoZSBET00uIFBhc3NpbmcgYW4gYWx0ZXJuYXRlIHJvb3QgZWxlbWVudCBpcyB1c2VmdWxcbiAgICogd2hlbiB0cnlpbmcgdG8gZW5hYmxlIGRyYWdnaW5nIG9uIGFuIGVsZW1lbnQgdGhhdCB5b3UgbWlnaHQgbm90IGhhdmUgYWNjZXNzIHRvLlxuICAgKi9cbiAgQElucHV0KCdjZGtEcmFnUm9vdEVsZW1lbnQnKSByb290RWxlbWVudFNlbGVjdG9yOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIE5vZGUgb3Igc2VsZWN0b3IgdGhhdCB3aWxsIGJlIHVzZWQgdG8gZGV0ZXJtaW5lIHRoZSBlbGVtZW50IHRvIHdoaWNoIHRoZSBkcmFnZ2FibGUnc1xuICAgKiBwb3NpdGlvbiB3aWxsIGJlIGNvbnN0cmFpbmVkLiBJZiBhIHN0cmluZyBpcyBwYXNzZWQgaW4sIGl0J2xsIGJlIHVzZWQgYXMgYSBzZWxlY3RvciB0aGF0XG4gICAqIHdpbGwgYmUgbWF0Y2hlZCBzdGFydGluZyBmcm9tIHRoZSBlbGVtZW50J3MgcGFyZW50IGFuZCBnb2luZyB1cCB0aGUgRE9NIHVudGlsIGEgbWF0Y2hcbiAgICogaGFzIGJlZW4gZm91bmQuXG4gICAqL1xuICBASW5wdXQoJ2Nka0RyYWdCb3VuZGFyeScpIGJvdW5kYXJ5RWxlbWVudDogc3RyaW5nIHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBIVE1MRWxlbWVudDtcblxuICAvKipcbiAgICogQW1vdW50IG9mIG1pbGxpc2Vjb25kcyB0byB3YWl0IGFmdGVyIHRoZSB1c2VyIGhhcyBwdXQgdGhlaXJcbiAgICogcG9pbnRlciBkb3duIGJlZm9yZSBzdGFydGluZyB0byBkcmFnIHRoZSBlbGVtZW50LlxuICAgKi9cbiAgQElucHV0KCdjZGtEcmFnU3RhcnREZWxheScpIGRyYWdTdGFydERlbGF5OiBudW1iZXIgfCB7dG91Y2g6IG51bWJlciwgbW91c2U6IG51bWJlcn0gPSAwO1xuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBwb3NpdGlvbiBvZiBhIGBDZGtEcmFnYCB0aGF0IGlzIG91dHNpZGUgb2YgYSBkcm9wIGNvbnRhaW5lci5cbiAgICogQ2FuIGJlIHVzZWQgdG8gcmVzdG9yZSB0aGUgZWxlbWVudCdzIHBvc2l0aW9uIGZvciBhIHJldHVybmluZyB1c2VyLlxuICAgKi9cbiAgQElucHV0KCdjZGtEcmFnRnJlZURyYWdQb3NpdGlvbicpIGZyZWVEcmFnUG9zaXRpb246IHt4OiBudW1iZXIsIHk6IG51bWJlcn07XG5cbiAgLyoqIFdoZXRoZXIgc3RhcnRpbmcgdG8gZHJhZyB0aGlzIGVsZW1lbnQgaXMgZGlzYWJsZWQuICovXG4gIEBJbnB1dCgnY2RrRHJhZ0Rpc2FibGVkJylcbiAgZ2V0IGRpc2FibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9kaXNhYmxlZCB8fCAodGhpcy5kcm9wQ29udGFpbmVyICYmIHRoaXMuZHJvcENvbnRhaW5lci5kaXNhYmxlZCk7XG4gIH1cbiAgc2V0IGRpc2FibGVkKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5fZGlzYWJsZWQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICAgIHRoaXMuX2RyYWdSZWYuZGlzYWJsZWQgPSB0aGlzLl9kaXNhYmxlZDtcbiAgfVxuICBwcml2YXRlIF9kaXNhYmxlZCA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBGdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHRvIGN1c3RvbWl6ZSB0aGUgbG9naWMgb2YgaG93IHRoZSBwb3NpdGlvbiBvZiB0aGUgZHJhZyBpdGVtXG4gICAqIGlzIGxpbWl0ZWQgd2hpbGUgaXQncyBiZWluZyBkcmFnZ2VkLiBHZXRzIGNhbGxlZCB3aXRoIGEgcG9pbnQgY29udGFpbmluZyB0aGUgY3VycmVudCBwb3NpdGlvblxuICAgKiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgb24gdGhlIHBhZ2UgYW5kIHNob3VsZCByZXR1cm4gYSBwb2ludCBkZXNjcmliaW5nIHdoZXJlIHRoZSBpdGVtIHNob3VsZFxuICAgKiBiZSByZW5kZXJlZC5cbiAgICovXG4gIEBJbnB1dCgnY2RrRHJhZ0NvbnN0cmFpblBvc2l0aW9uJykgY29uc3RyYWluUG9zaXRpb24/OiAocG9pbnQ6IFBvaW50LCBkcmFnUmVmOiBEcmFnUmVmKSA9PiBQb2ludDtcblxuICAvKiogQ2xhc3MgdG8gYmUgYWRkZWQgdG8gdGhlIHByZXZpZXcgZWxlbWVudC4gKi9cbiAgQElucHV0KCdjZGtEcmFnUHJldmlld0NsYXNzJykgcHJldmlld0NsYXNzOiBzdHJpbmcgfCBzdHJpbmdbXTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBzdGFydHMgZHJhZ2dpbmcgdGhlIGl0ZW0uICovXG4gIEBPdXRwdXQoJ2Nka0RyYWdTdGFydGVkJykgc3RhcnRlZDogRXZlbnRFbWl0dGVyPENka0RyYWdTdGFydD4gPSBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdTdGFydD4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBoYXMgcmVsZWFzZWQgYSBkcmFnIGl0ZW0sIGJlZm9yZSBhbnkgYW5pbWF0aW9ucyBoYXZlIHN0YXJ0ZWQuICovXG4gIEBPdXRwdXQoJ2Nka0RyYWdSZWxlYXNlZCcpIHJlbGVhc2VkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ1JlbGVhc2U+ID1cbiAgICAgIG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ1JlbGVhc2U+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgc3RvcHMgZHJhZ2dpbmcgYW4gaXRlbSBpbiB0aGUgY29udGFpbmVyLiAqL1xuICBAT3V0cHV0KCdjZGtEcmFnRW5kZWQnKSBlbmRlZDogRXZlbnRFbWl0dGVyPENka0RyYWdFbmQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnRW5kPigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGhhcyBtb3ZlZCB0aGUgaXRlbSBpbnRvIGEgbmV3IGNvbnRhaW5lci4gKi9cbiAgQE91dHB1dCgnY2RrRHJhZ0VudGVyZWQnKSBlbnRlcmVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0VudGVyPGFueT4+ID1cbiAgICAgIG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0VudGVyPGFueT4+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgcmVtb3ZlcyB0aGUgaXRlbSBpdHMgY29udGFpbmVyIGJ5IGRyYWdnaW5nIGl0IGludG8gYW5vdGhlciBjb250YWluZXIuICovXG4gIEBPdXRwdXQoJ2Nka0RyYWdFeGl0ZWQnKSBleGl0ZWQ6IEV2ZW50RW1pdHRlcjxDZGtEcmFnRXhpdDxhbnk+PiA9XG4gICAgICBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdFeGl0PGFueT4+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgZHJvcHMgdGhlIGl0ZW0gaW5zaWRlIGEgY29udGFpbmVyLiAqL1xuICBAT3V0cHV0KCdjZGtEcmFnRHJvcHBlZCcpIGRyb3BwZWQ6IEV2ZW50RW1pdHRlcjxDZGtEcmFnRHJvcDxhbnk+PiA9XG4gICAgICBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdEcm9wPGFueT4+KCk7XG5cbiAgLyoqXG4gICAqIEVtaXRzIGFzIHRoZSB1c2VyIGlzIGRyYWdnaW5nIHRoZSBpdGVtLiBVc2Ugd2l0aCBjYXV0aW9uLFxuICAgKiBiZWNhdXNlIHRoaXMgZXZlbnQgd2lsbCBmaXJlIGZvciBldmVyeSBwaXhlbCB0aGF0IHRoZSB1c2VyIGhhcyBkcmFnZ2VkLlxuICAgKi9cbiAgQE91dHB1dCgnY2RrRHJhZ01vdmVkJykgbW92ZWQ6IE9ic2VydmFibGU8Q2RrRHJhZ01vdmU8VD4+ID1cbiAgICAgIG5ldyBPYnNlcnZhYmxlKChvYnNlcnZlcjogT2JzZXJ2ZXI8Q2RrRHJhZ01vdmU8VD4+KSA9PiB7XG4gICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IHRoaXMuX2RyYWdSZWYubW92ZWQucGlwZShtYXAobW92ZWRFdmVudCA9PiAoe1xuICAgICAgICAgIHNvdXJjZTogdGhpcyxcbiAgICAgICAgICBwb2ludGVyUG9zaXRpb246IG1vdmVkRXZlbnQucG9pbnRlclBvc2l0aW9uLFxuICAgICAgICAgIGV2ZW50OiBtb3ZlZEV2ZW50LmV2ZW50LFxuICAgICAgICAgIGRlbHRhOiBtb3ZlZEV2ZW50LmRlbHRhLFxuICAgICAgICAgIGRpc3RhbmNlOiBtb3ZlZEV2ZW50LmRpc3RhbmNlXG4gICAgICAgIH0pKSkuc3Vic2NyaWJlKG9ic2VydmVyKTtcblxuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB9O1xuICAgICAgfSk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICAvKiogRWxlbWVudCB0aGF0IHRoZSBkcmFnZ2FibGUgaXMgYXR0YWNoZWQgdG8uICovXG4gICAgICBwdWJsaWMgZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgICAvKiogRHJvcHBhYmxlIGNvbnRhaW5lciB0aGF0IHRoZSBkcmFnZ2FibGUgaXMgYSBwYXJ0IG9mLiAqL1xuICAgICAgQEluamVjdChDREtfRFJPUF9MSVNUKSBAT3B0aW9uYWwoKSBAU2tpcFNlbGYoKSBwdWJsaWMgZHJvcENvbnRhaW5lcjogQ2RrRHJvcExpc3QsXG4gICAgICBASW5qZWN0KERPQ1VNRU5UKSBwcml2YXRlIF9kb2N1bWVudDogYW55LCBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICAgIHByaXZhdGUgX3ZpZXdDb250YWluZXJSZWY6IFZpZXdDb250YWluZXJSZWYsIEBJbmplY3QoQ0RLX0RSQUdfQ09ORklHKSBjb25maWc6IERyYWdSZWZDb25maWcsXG4gICAgICBAT3B0aW9uYWwoKSBwcml2YXRlIF9kaXI6IERpcmVjdGlvbmFsaXR5LCBkcmFnRHJvcDogRHJhZ0Ryb3AsXG4gICAgICBwcml2YXRlIF9jaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYpIHtcbiAgICB0aGlzLl9kcmFnUmVmID0gZHJhZ0Ryb3AuY3JlYXRlRHJhZyhlbGVtZW50LCBjb25maWcpO1xuICAgIHRoaXMuX2RyYWdSZWYuZGF0YSA9IHRoaXM7XG4gICAgdGhpcy5fc3luY0lucHV0cyh0aGlzLl9kcmFnUmVmKTtcbiAgICB0aGlzLl9oYW5kbGVFdmVudHModGhpcy5fZHJhZ1JlZik7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZWxlbWVudCB0aGF0IGlzIGJlaW5nIHVzZWQgYXMgYSBwbGFjZWhvbGRlclxuICAgKiB3aGlsZSB0aGUgY3VycmVudCBlbGVtZW50IGlzIGJlaW5nIGRyYWdnZWQuXG4gICAqL1xuICBnZXRQbGFjZWhvbGRlckVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLl9kcmFnUmVmLmdldFBsYWNlaG9sZGVyRWxlbWVudCgpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIHJvb3QgZHJhZ2dhYmxlIGVsZW1lbnQuICovXG4gIGdldFJvb3RFbGVtZW50KCk6IEhUTUxFbGVtZW50IHtcbiAgICByZXR1cm4gdGhpcy5fZHJhZ1JlZi5nZXRSb290RWxlbWVudCgpO1xuICB9XG5cbiAgLyoqIFJlc2V0cyBhIHN0YW5kYWxvbmUgZHJhZyBpdGVtIHRvIGl0cyBpbml0aWFsIHBvc2l0aW9uLiAqL1xuICByZXNldCgpOiB2b2lkIHtcbiAgICB0aGlzLl9kcmFnUmVmLnJlc2V0KCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcGl4ZWwgY29vcmRpbmF0ZXMgb2YgdGhlIGRyYWdnYWJsZSBvdXRzaWRlIG9mIGEgZHJvcCBjb250YWluZXIuXG4gICAqL1xuICBnZXRGcmVlRHJhZ1Bvc2l0aW9uKCk6IHtyZWFkb25seSB4OiBudW1iZXIsIHJlYWRvbmx5IHk6IG51bWJlcn0ge1xuICAgIHJldHVybiB0aGlzLl9kcmFnUmVmLmdldEZyZWVEcmFnUG9zaXRpb24oKTtcbiAgfVxuXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcbiAgICAvLyBXZSBuZWVkIHRvIHdhaXQgZm9yIHRoZSB6b25lIHRvIHN0YWJpbGl6ZSwgaW4gb3JkZXIgZm9yIHRoZSByZWZlcmVuY2VcbiAgICAvLyBlbGVtZW50IHRvIGJlIGluIHRoZSBwcm9wZXIgcGxhY2UgaW4gdGhlIERPTS4gVGhpcyBpcyBtb3N0bHkgcmVsZXZhbnRcbiAgICAvLyBmb3IgZHJhZ2dhYmxlIGVsZW1lbnRzIGluc2lkZSBwb3J0YWxzIHNpbmNlIHRoZXkgZ2V0IHN0YW1wZWQgb3V0IGluXG4gICAgLy8gdGhlaXIgb3JpZ2luYWwgRE9NIHBvc2l0aW9uIGFuZCB0aGVuIHRoZXkgZ2V0IHRyYW5zZmVycmVkIHRvIHRoZSBwb3J0YWwuXG4gICAgdGhpcy5fbmdab25lLm9uU3RhYmxlLmFzT2JzZXJ2YWJsZSgpXG4gICAgICAucGlwZSh0YWtlKDEpLCB0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSlcbiAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICB0aGlzLl91cGRhdGVSb290RWxlbWVudCgpO1xuXG4gICAgICAgIC8vIExpc3RlbiBmb3IgYW55IG5ld2x5LWFkZGVkIGhhbmRsZXMuXG4gICAgICAgIHRoaXMuX2hhbmRsZXMuY2hhbmdlcy5waXBlKFxuICAgICAgICAgIHN0YXJ0V2l0aCh0aGlzLl9oYW5kbGVzKSxcbiAgICAgICAgICAvLyBTeW5jIHRoZSBuZXcgaGFuZGxlcyB3aXRoIHRoZSBEcmFnUmVmLlxuICAgICAgICAgIHRhcCgoaGFuZGxlczogUXVlcnlMaXN0PENka0RyYWdIYW5kbGU+KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjaGlsZEhhbmRsZUVsZW1lbnRzID0gaGFuZGxlc1xuICAgICAgICAgICAgICAuZmlsdGVyKGhhbmRsZSA9PiBoYW5kbGUuX3BhcmVudERyYWcgPT09IHRoaXMpXG4gICAgICAgICAgICAgIC5tYXAoaGFuZGxlID0+IGhhbmRsZS5lbGVtZW50KTtcbiAgICAgICAgICAgIHRoaXMuX2RyYWdSZWYud2l0aEhhbmRsZXMoY2hpbGRIYW5kbGVFbGVtZW50cyk7XG4gICAgICAgICAgfSksXG4gICAgICAgICAgLy8gTGlzdGVuIGlmIHRoZSBzdGF0ZSBvZiBhbnkgb2YgdGhlIGhhbmRsZXMgY2hhbmdlcy5cbiAgICAgICAgICBzd2l0Y2hNYXAoKGhhbmRsZXM6IFF1ZXJ5TGlzdDxDZGtEcmFnSGFuZGxlPikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG1lcmdlKC4uLmhhbmRsZXMubWFwKGl0ZW0gPT4gaXRlbS5fc3RhdGVDaGFuZ2VzKSk7XG4gICAgICAgICAgfSksXG4gICAgICAgICAgdGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZClcbiAgICAgICAgKS5zdWJzY3JpYmUoaGFuZGxlSW5zdGFuY2UgPT4ge1xuICAgICAgICAgIC8vIEVuYWJsZWQvZGlzYWJsZSB0aGUgaGFuZGxlIHRoYXQgY2hhbmdlZCBpbiB0aGUgRHJhZ1JlZi5cbiAgICAgICAgICBjb25zdCBkcmFnUmVmID0gdGhpcy5fZHJhZ1JlZjtcbiAgICAgICAgICBjb25zdCBoYW5kbGUgPSBoYW5kbGVJbnN0YW5jZS5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQ7XG4gICAgICAgICAgaGFuZGxlSW5zdGFuY2UuZGlzYWJsZWQgPyBkcmFnUmVmLmRpc2FibGVIYW5kbGUoaGFuZGxlKSA6IGRyYWdSZWYuZW5hYmxlSGFuZGxlKGhhbmRsZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICh0aGlzLmZyZWVEcmFnUG9zaXRpb24pIHtcbiAgICAgICAgICB0aGlzLl9kcmFnUmVmLnNldEZyZWVEcmFnUG9zaXRpb24odGhpcy5mcmVlRHJhZ1Bvc2l0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKSB7XG4gICAgY29uc3Qgcm9vdFNlbGVjdG9yQ2hhbmdlID0gY2hhbmdlc1sncm9vdEVsZW1lbnRTZWxlY3RvciddO1xuICAgIGNvbnN0IHBvc2l0aW9uQ2hhbmdlID0gY2hhbmdlc1snZnJlZURyYWdQb3NpdGlvbiddO1xuXG4gICAgLy8gV2UgZG9uJ3QgaGF2ZSB0byByZWFjdCB0byB0aGUgZmlyc3QgY2hhbmdlIHNpbmNlIGl0J3MgYmVpbmdcbiAgICAvLyBoYW5kbGVkIGluIGBuZ0FmdGVyVmlld0luaXRgIHdoZXJlIGl0IG5lZWRzIHRvIGJlIGRlZmVycmVkLlxuICAgIGlmIChyb290U2VsZWN0b3JDaGFuZ2UgJiYgIXJvb3RTZWxlY3RvckNoYW5nZS5maXJzdENoYW5nZSkge1xuICAgICAgdGhpcy5fdXBkYXRlUm9vdEVsZW1lbnQoKTtcbiAgICB9XG5cbiAgICAvLyBTa2lwIHRoZSBmaXJzdCBjaGFuZ2Ugc2luY2UgaXQncyBiZWluZyBoYW5kbGVkIGluIGBuZ0FmdGVyVmlld0luaXRgLlxuICAgIGlmIChwb3NpdGlvbkNoYW5nZSAmJiAhcG9zaXRpb25DaGFuZ2UuZmlyc3RDaGFuZ2UgJiYgdGhpcy5mcmVlRHJhZ1Bvc2l0aW9uKSB7XG4gICAgICB0aGlzLl9kcmFnUmVmLnNldEZyZWVEcmFnUG9zaXRpb24odGhpcy5mcmVlRHJhZ1Bvc2l0aW9uKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9kZXN0cm95ZWQubmV4dCgpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX2RyYWdSZWYuZGlzcG9zZSgpO1xuICB9XG5cbiAgLyoqIFN5bmNzIHRoZSByb290IGVsZW1lbnQgd2l0aCB0aGUgYERyYWdSZWZgLiAqL1xuICBwcml2YXRlIF91cGRhdGVSb290RWxlbWVudCgpIHtcbiAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQ7XG4gICAgY29uc3Qgcm9vdEVsZW1lbnQgPSB0aGlzLnJvb3RFbGVtZW50U2VsZWN0b3IgP1xuICAgICAgICBnZXRDbG9zZXN0TWF0Y2hpbmdBbmNlc3RvcihlbGVtZW50LCB0aGlzLnJvb3RFbGVtZW50U2VsZWN0b3IpIDogZWxlbWVudDtcblxuICAgIGlmIChyb290RWxlbWVudCAmJiByb290RWxlbWVudC5ub2RlVHlwZSAhPT0gdGhpcy5fZG9jdW1lbnQuRUxFTUVOVF9OT0RFKSB7XG4gICAgICB0aHJvdyBFcnJvcihgY2RrRHJhZyBtdXN0IGJlIGF0dGFjaGVkIHRvIGFuIGVsZW1lbnQgbm9kZS4gYCArXG4gICAgICAgICAgICAgICAgICBgQ3VycmVudGx5IGF0dGFjaGVkIHRvIFwiJHtyb290RWxlbWVudC5ub2RlTmFtZX1cIi5gKTtcbiAgICB9XG5cbiAgICB0aGlzLl9kcmFnUmVmLndpdGhSb290RWxlbWVudChyb290RWxlbWVudCB8fCBlbGVtZW50KTtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBib3VuZGFyeSBlbGVtZW50LCBiYXNlZCBvbiB0aGUgYGJvdW5kYXJ5RWxlbWVudGAgdmFsdWUuICovXG4gIHByaXZhdGUgX2dldEJvdW5kYXJ5RWxlbWVudCgpIHtcbiAgICBjb25zdCBib3VuZGFyeSA9IHRoaXMuYm91bmRhcnlFbGVtZW50O1xuXG4gICAgaWYgKCFib3VuZGFyeSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBib3VuZGFyeSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiBnZXRDbG9zZXN0TWF0Y2hpbmdBbmNlc3Rvcih0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudCwgYm91bmRhcnkpO1xuICAgIH1cblxuICAgIGNvbnN0IGVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGJvdW5kYXJ5KTtcblxuICAgIGlmIChpc0Rldk1vZGUoKSAmJiAhZWxlbWVudC5jb250YWlucyh0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudCkpIHtcbiAgICAgIHRocm93IEVycm9yKCdEcmFnZ2FibGUgZWxlbWVudCBpcyBub3QgaW5zaWRlIG9mIHRoZSBub2RlIHBhc3NlZCBpbnRvIGNka0RyYWdCb3VuZGFyeS4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxuXG4gIC8qKiBTeW5jcyB0aGUgaW5wdXRzIG9mIHRoZSBDZGtEcmFnIHdpdGggdGhlIG9wdGlvbnMgb2YgdGhlIHVuZGVybHlpbmcgRHJhZ1JlZi4gKi9cbiAgcHJpdmF0ZSBfc3luY0lucHV0cyhyZWY6IERyYWdSZWY8Q2RrRHJhZzxUPj4pIHtcbiAgICByZWYuYmVmb3JlU3RhcnRlZC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgaWYgKCFyZWYuaXNEcmFnZ2luZygpKSB7XG4gICAgICAgIGNvbnN0IGRpciA9IHRoaXMuX2RpcjtcbiAgICAgICAgY29uc3QgZHJhZ1N0YXJ0RGVsYXkgPSB0aGlzLmRyYWdTdGFydERlbGF5O1xuICAgICAgICBjb25zdCBwbGFjZWhvbGRlciA9IHRoaXMuX3BsYWNlaG9sZGVyVGVtcGxhdGUgPyB7XG4gICAgICAgICAgdGVtcGxhdGU6IHRoaXMuX3BsYWNlaG9sZGVyVGVtcGxhdGUudGVtcGxhdGVSZWYsXG4gICAgICAgICAgY29udGV4dDogdGhpcy5fcGxhY2Vob2xkZXJUZW1wbGF0ZS5kYXRhLFxuICAgICAgICAgIHZpZXdDb250YWluZXI6IHRoaXMuX3ZpZXdDb250YWluZXJSZWZcbiAgICAgICAgfSA6IG51bGw7XG4gICAgICAgIGNvbnN0IHByZXZpZXcgPSB0aGlzLl9wcmV2aWV3VGVtcGxhdGUgPyB7XG4gICAgICAgICAgdGVtcGxhdGU6IHRoaXMuX3ByZXZpZXdUZW1wbGF0ZS50ZW1wbGF0ZVJlZixcbiAgICAgICAgICBjb250ZXh0OiB0aGlzLl9wcmV2aWV3VGVtcGxhdGUuZGF0YSxcbiAgICAgICAgICB2aWV3Q29udGFpbmVyOiB0aGlzLl92aWV3Q29udGFpbmVyUmVmXG4gICAgICAgIH0gOiBudWxsO1xuXG4gICAgICAgIHJlZi5kaXNhYmxlZCA9IHRoaXMuZGlzYWJsZWQ7XG4gICAgICAgIHJlZi5sb2NrQXhpcyA9IHRoaXMubG9ja0F4aXM7XG4gICAgICAgIHJlZi5kcmFnU3RhcnREZWxheSA9ICh0eXBlb2YgZHJhZ1N0YXJ0RGVsYXkgPT09ICdvYmplY3QnICYmIGRyYWdTdGFydERlbGF5KSA/XG4gICAgICAgICAgICBkcmFnU3RhcnREZWxheSA6IGNvZXJjZU51bWJlclByb3BlcnR5KGRyYWdTdGFydERlbGF5KTtcbiAgICAgICAgcmVmLmNvbnN0cmFpblBvc2l0aW9uID0gdGhpcy5jb25zdHJhaW5Qb3NpdGlvbjtcbiAgICAgICAgcmVmLnByZXZpZXdDbGFzcyA9IHRoaXMucHJldmlld0NsYXNzO1xuICAgICAgICByZWZcbiAgICAgICAgICAud2l0aEJvdW5kYXJ5RWxlbWVudCh0aGlzLl9nZXRCb3VuZGFyeUVsZW1lbnQoKSlcbiAgICAgICAgICAud2l0aFBsYWNlaG9sZGVyVGVtcGxhdGUocGxhY2Vob2xkZXIpXG4gICAgICAgICAgLndpdGhQcmV2aWV3VGVtcGxhdGUocHJldmlldyk7XG5cbiAgICAgICAgaWYgKGRpcikge1xuICAgICAgICAgIHJlZi53aXRoRGlyZWN0aW9uKGRpci52YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBIYW5kbGVzIHRoZSBldmVudHMgZnJvbSB0aGUgdW5kZXJseWluZyBgRHJhZ1JlZmAuICovXG4gIHByaXZhdGUgX2hhbmRsZUV2ZW50cyhyZWY6IERyYWdSZWY8Q2RrRHJhZzxUPj4pIHtcbiAgICByZWYuc3RhcnRlZC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgdGhpcy5zdGFydGVkLmVtaXQoe3NvdXJjZTogdGhpc30pO1xuXG4gICAgICAvLyBTaW5jZSBhbGwgb2YgdGhlc2UgZXZlbnRzIHJ1biBvdXRzaWRlIG9mIGNoYW5nZSBkZXRlY3Rpb24sXG4gICAgICAvLyB3ZSBuZWVkIHRvIGVuc3VyZSB0aGF0IGV2ZXJ5dGhpbmcgaXMgbWFya2VkIGNvcnJlY3RseS5cbiAgICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICAgIH0pO1xuXG4gICAgcmVmLnJlbGVhc2VkLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICB0aGlzLnJlbGVhc2VkLmVtaXQoe3NvdXJjZTogdGhpc30pO1xuICAgIH0pO1xuXG4gICAgcmVmLmVuZGVkLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICB0aGlzLmVuZGVkLmVtaXQoe3NvdXJjZTogdGhpcywgZGlzdGFuY2U6IGV2ZW50LmRpc3RhbmNlfSk7XG5cbiAgICAgIC8vIFNpbmNlIGFsbCBvZiB0aGVzZSBldmVudHMgcnVuIG91dHNpZGUgb2YgY2hhbmdlIGRldGVjdGlvbixcbiAgICAgIC8vIHdlIG5lZWQgdG8gZW5zdXJlIHRoYXQgZXZlcnl0aGluZyBpcyBtYXJrZWQgY29ycmVjdGx5LlxuICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgfSk7XG5cbiAgICByZWYuZW50ZXJlZC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgdGhpcy5lbnRlcmVkLmVtaXQoe1xuICAgICAgICBjb250YWluZXI6IGV2ZW50LmNvbnRhaW5lci5kYXRhLFxuICAgICAgICBpdGVtOiB0aGlzLFxuICAgICAgICBjdXJyZW50SW5kZXg6IGV2ZW50LmN1cnJlbnRJbmRleFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZWYuZXhpdGVkLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICB0aGlzLmV4aXRlZC5lbWl0KHtcbiAgICAgICAgY29udGFpbmVyOiBldmVudC5jb250YWluZXIuZGF0YSxcbiAgICAgICAgaXRlbTogdGhpc1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZWYuZHJvcHBlZC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgdGhpcy5kcm9wcGVkLmVtaXQoe1xuICAgICAgICBwcmV2aW91c0luZGV4OiBldmVudC5wcmV2aW91c0luZGV4LFxuICAgICAgICBjdXJyZW50SW5kZXg6IGV2ZW50LmN1cnJlbnRJbmRleCxcbiAgICAgICAgcHJldmlvdXNDb250YWluZXI6IGV2ZW50LnByZXZpb3VzQ29udGFpbmVyLmRhdGEsXG4gICAgICAgIGNvbnRhaW5lcjogZXZlbnQuY29udGFpbmVyLmRhdGEsXG4gICAgICAgIGlzUG9pbnRlck92ZXJDb250YWluZXI6IGV2ZW50LmlzUG9pbnRlck92ZXJDb250YWluZXIsXG4gICAgICAgIGl0ZW06IHRoaXMsXG4gICAgICAgIGRpc3RhbmNlOiBldmVudC5kaXN0YW5jZVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqIEdldHMgdGhlIGNsb3Nlc3QgYW5jZXN0b3Igb2YgYW4gZWxlbWVudCB0aGF0IG1hdGNoZXMgYSBzZWxlY3Rvci4gKi9cbmZ1bmN0aW9uIGdldENsb3Nlc3RNYXRjaGluZ0FuY2VzdG9yKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBzZWxlY3Rvcjogc3RyaW5nKSB7XG4gIGxldCBjdXJyZW50RWxlbWVudCA9IGVsZW1lbnQucGFyZW50RWxlbWVudCBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG5cbiAgd2hpbGUgKGN1cnJlbnRFbGVtZW50KSB7XG4gICAgLy8gSUUgZG9lc24ndCBzdXBwb3J0IGBtYXRjaGVzYCBzbyB3ZSBoYXZlIHRvIGZhbGwgYmFjayB0byBgbXNNYXRjaGVzU2VsZWN0b3JgLlxuICAgIGlmIChjdXJyZW50RWxlbWVudC5tYXRjaGVzID8gY3VycmVudEVsZW1lbnQubWF0Y2hlcyhzZWxlY3RvcikgOlxuICAgICAgICAoY3VycmVudEVsZW1lbnQgYXMgYW55KS5tc01hdGNoZXNTZWxlY3RvcihzZWxlY3RvcikpIHtcbiAgICAgIHJldHVybiBjdXJyZW50RWxlbWVudDtcbiAgICB9XG5cbiAgICBjdXJyZW50RWxlbWVudCA9IGN1cnJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQ7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuIl19