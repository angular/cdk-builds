/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __read, __spread } from "tslib";
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
        // Note that usually the container is assigned when the drop list is picks up the item, but in
        // some cases (mainly transplanted views with OnPush, see #18341) we may end up in a situation
        // where there are no items on the first change detection pass, but the items get picked up as
        // soon as the user triggers another pass by dragging. This is a problem, because the item would
        // have to switch from standalone mode to drag mode in the middle of the dragging sequence which
        // is too late since the two modes save different kinds of information. We work around it by
        // assigning the drop container both from here and the list.
        if (dropContainer) {
            this._dragRef._withDropContainer(dropContainer._dropListRef);
        }
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
                return merge.apply(void 0, __spread(handles.map(function (item) {
                    return item._stateChanges.pipe(startWith(item));
                })));
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
        _previewTemplate: [{ type: ContentChild, args: [CdkDragPreview,] }],
        _placeholderTemplate: [{ type: ContentChild, args: [CdkDragPlaceholder,] }],
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2RpcmVjdGl2ZXMvZHJhZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBRUwsWUFBWSxFQUNaLGVBQWUsRUFDZixTQUFTLEVBQ1QsVUFBVSxFQUNWLFlBQVksRUFDWixNQUFNLEVBQ04sY0FBYyxFQUNkLEtBQUssRUFDTCxNQUFNLEVBRU4sUUFBUSxFQUNSLE1BQU0sRUFDTixTQUFTLEVBQ1QsUUFBUSxFQUNSLGdCQUFnQixFQUdoQixpQkFBaUIsRUFDakIsU0FBUyxHQUNWLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFDTCxxQkFBcUIsRUFDckIsb0JBQW9CLEVBQ3BCLGFBQWEsRUFFZCxNQUFNLHVCQUF1QixDQUFDO0FBQy9CLE9BQU8sRUFBQyxVQUFVLEVBQVksT0FBTyxFQUFFLEtBQUssRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUMxRCxPQUFPLEVBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQVUvRSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzVDLE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3RELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUM5QyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFHL0MsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUV0Qzs7O0dBR0c7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RCxPQUFPLGNBQWMsQ0FBQztTQUN2QjtRQUVELGNBQWMsR0FBRyxjQUFjLENBQUMsYUFBYSxDQUFDO0tBQy9DO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge1xuICBBZnRlclZpZXdJbml0LFxuICBDb250ZW50Q2hpbGQsXG4gIENvbnRlbnRDaGlsZHJlbixcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIEluamVjdCxcbiAgSW5qZWN0aW9uVG9rZW4sXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgT3B0aW9uYWwsXG4gIE91dHB1dCxcbiAgUXVlcnlMaXN0LFxuICBTa2lwU2VsZixcbiAgVmlld0NvbnRhaW5lclJlZixcbiAgT25DaGFuZ2VzLFxuICBTaW1wbGVDaGFuZ2VzLFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgaXNEZXZNb2RlLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7XG4gIGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSxcbiAgY29lcmNlTnVtYmVyUHJvcGVydHksXG4gIGNvZXJjZUVsZW1lbnQsXG4gIEJvb2xlYW5JbnB1dFxufSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBPYnNlcnZlciwgU3ViamVjdCwgbWVyZ2V9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtzdGFydFdpdGgsIHRha2UsIG1hcCwgdGFrZVVudGlsLCBzd2l0Y2hNYXAsIHRhcH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtcbiAgQ2RrRHJhZ0Ryb3AsXG4gIENka0RyYWdFbmQsXG4gIENka0RyYWdFbnRlcixcbiAgQ2RrRHJhZ0V4aXQsXG4gIENka0RyYWdNb3ZlLFxuICBDZGtEcmFnU3RhcnQsXG4gIENka0RyYWdSZWxlYXNlLFxufSBmcm9tICcuLi9kcmFnLWV2ZW50cyc7XG5pbXBvcnQge0Nka0RyYWdIYW5kbGV9IGZyb20gJy4vZHJhZy1oYW5kbGUnO1xuaW1wb3J0IHtDZGtEcmFnUGxhY2Vob2xkZXJ9IGZyb20gJy4vZHJhZy1wbGFjZWhvbGRlcic7XG5pbXBvcnQge0Nka0RyYWdQcmV2aWV3fSBmcm9tICcuL2RyYWctcHJldmlldyc7XG5pbXBvcnQge0NES19EUkFHX1BBUkVOVH0gZnJvbSAnLi4vZHJhZy1wYXJlbnQnO1xuaW1wb3J0IHtEcmFnUmVmLCBEcmFnUmVmQ29uZmlnLCBQb2ludH0gZnJvbSAnLi4vZHJhZy1yZWYnO1xuaW1wb3J0IHtDZGtEcm9wTGlzdEludGVybmFsIGFzIENka0Ryb3BMaXN0fSBmcm9tICcuL2Ryb3AtbGlzdCc7XG5pbXBvcnQge0RyYWdEcm9wfSBmcm9tICcuLi9kcmFnLWRyb3AnO1xuXG4vKipcbiAqIEluamVjdGlvbiB0b2tlbiB0aGF0IGlzIHVzZWQgdG8gcHJvdmlkZSBhIENka0Ryb3BMaXN0IGluc3RhbmNlIHRvIENka0RyYWcuXG4gKiBVc2VkIGZvciBhdm9pZGluZyBjaXJjdWxhciBpbXBvcnRzLlxuICovXG5leHBvcnQgY29uc3QgQ0RLX0RST1BfTElTVCA9IG5ldyBJbmplY3Rpb25Ub2tlbjxDZGtEcm9wTGlzdD4oJ0NES19EUk9QX0xJU1QnKTtcblxuLyoqIEluamVjdGlvbiB0b2tlbiB0aGF0IGNhbiBiZSB1c2VkIHRvIGNvbmZpZ3VyZSB0aGUgYmVoYXZpb3Igb2YgYENka0RyYWdgLiAqL1xuZXhwb3J0IGNvbnN0IENES19EUkFHX0NPTkZJRyA9IG5ldyBJbmplY3Rpb25Ub2tlbjxEcmFnUmVmQ29uZmlnPignQ0RLX0RSQUdfQ09ORklHJywge1xuICBwcm92aWRlZEluOiAncm9vdCcsXG4gIGZhY3Rvcnk6IENES19EUkFHX0NPTkZJR19GQUNUT1JZXG59KTtcblxuLyoqIEBkb2NzLXByaXZhdGUgKi9cbmV4cG9ydCBmdW5jdGlvbiBDREtfRFJBR19DT05GSUdfRkFDVE9SWSgpOiBEcmFnUmVmQ29uZmlnIHtcbiAgcmV0dXJuIHtkcmFnU3RhcnRUaHJlc2hvbGQ6IDUsIHBvaW50ZXJEaXJlY3Rpb25DaGFuZ2VUaHJlc2hvbGQ6IDV9O1xufVxuXG4vKiogRWxlbWVudCB0aGF0IGNhbiBiZSBtb3ZlZCBpbnNpZGUgYSBDZGtEcm9wTGlzdCBjb250YWluZXIuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrRHJhZ10nLFxuICBleHBvcnRBczogJ2Nka0RyYWcnLFxuICBob3N0OiB7XG4gICAgJ2NsYXNzJzogJ2Nkay1kcmFnJyxcbiAgICAnW2NsYXNzLmNkay1kcmFnLWRpc2FibGVkXSc6ICdkaXNhYmxlZCcsXG4gICAgJ1tjbGFzcy5jZGstZHJhZy1kcmFnZ2luZ10nOiAnX2RyYWdSZWYuaXNEcmFnZ2luZygpJyxcbiAgfSxcbiAgcHJvdmlkZXJzOiBbe3Byb3ZpZGU6IENES19EUkFHX1BBUkVOVCwgdXNlRXhpc3Rpbmc6IENka0RyYWd9XVxufSlcbmV4cG9ydCBjbGFzcyBDZGtEcmFnPFQgPSBhbnk+IGltcGxlbWVudHMgQWZ0ZXJWaWV3SW5pdCwgT25DaGFuZ2VzLCBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9kZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIHVuZGVybHlpbmcgZHJhZyBpbnN0YW5jZS4gKi9cbiAgX2RyYWdSZWY6IERyYWdSZWY8Q2RrRHJhZzxUPj47XG5cbiAgLyoqIEVsZW1lbnRzIHRoYXQgY2FuIGJlIHVzZWQgdG8gZHJhZyB0aGUgZHJhZ2dhYmxlIGl0ZW0uICovXG4gIEBDb250ZW50Q2hpbGRyZW4oQ2RrRHJhZ0hhbmRsZSwge2Rlc2NlbmRhbnRzOiB0cnVlfSkgX2hhbmRsZXM6IFF1ZXJ5TGlzdDxDZGtEcmFnSGFuZGxlPjtcblxuICAvKiogRWxlbWVudCB0aGF0IHdpbGwgYmUgdXNlZCBhcyBhIHRlbXBsYXRlIHRvIGNyZWF0ZSB0aGUgZHJhZ2dhYmxlIGl0ZW0ncyBwcmV2aWV3LiAqL1xuICBAQ29udGVudENoaWxkKENka0RyYWdQcmV2aWV3KSBfcHJldmlld1RlbXBsYXRlOiBDZGtEcmFnUHJldmlldztcblxuICAvKiogVGVtcGxhdGUgZm9yIHBsYWNlaG9sZGVyIGVsZW1lbnQgcmVuZGVyZWQgdG8gc2hvdyB3aGVyZSBhIGRyYWdnYWJsZSB3b3VsZCBiZSBkcm9wcGVkLiAqL1xuICBAQ29udGVudENoaWxkKENka0RyYWdQbGFjZWhvbGRlcikgX3BsYWNlaG9sZGVyVGVtcGxhdGU6IENka0RyYWdQbGFjZWhvbGRlcjtcblxuICAvKiogQXJiaXRyYXJ5IGRhdGEgdG8gYXR0YWNoIHRvIHRoaXMgZHJhZyBpbnN0YW5jZS4gKi9cbiAgQElucHV0KCdjZGtEcmFnRGF0YScpIGRhdGE6IFQ7XG5cbiAgLyoqIExvY2tzIHRoZSBwb3NpdGlvbiBvZiB0aGUgZHJhZ2dlZCBlbGVtZW50IGFsb25nIHRoZSBzcGVjaWZpZWQgYXhpcy4gKi9cbiAgQElucHV0KCdjZGtEcmFnTG9ja0F4aXMnKSBsb2NrQXhpczogJ3gnIHwgJ3knO1xuXG4gIC8qKlxuICAgKiBTZWxlY3RvciB0aGF0IHdpbGwgYmUgdXNlZCB0byBkZXRlcm1pbmUgdGhlIHJvb3QgZHJhZ2dhYmxlIGVsZW1lbnQsIHN0YXJ0aW5nIGZyb21cbiAgICogdGhlIGBjZGtEcmFnYCBlbGVtZW50IGFuZCBnb2luZyB1cCB0aGUgRE9NLiBQYXNzaW5nIGFuIGFsdGVybmF0ZSByb290IGVsZW1lbnQgaXMgdXNlZnVsXG4gICAqIHdoZW4gdHJ5aW5nIHRvIGVuYWJsZSBkcmFnZ2luZyBvbiBhbiBlbGVtZW50IHRoYXQgeW91IG1pZ2h0IG5vdCBoYXZlIGFjY2VzcyB0by5cbiAgICovXG4gIEBJbnB1dCgnY2RrRHJhZ1Jvb3RFbGVtZW50Jykgcm9vdEVsZW1lbnRTZWxlY3Rvcjogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBOb2RlIG9yIHNlbGVjdG9yIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGRldGVybWluZSB0aGUgZWxlbWVudCB0byB3aGljaCB0aGUgZHJhZ2dhYmxlJ3NcbiAgICogcG9zaXRpb24gd2lsbCBiZSBjb25zdHJhaW5lZC4gSWYgYSBzdHJpbmcgaXMgcGFzc2VkIGluLCBpdCdsbCBiZSB1c2VkIGFzIGEgc2VsZWN0b3IgdGhhdFxuICAgKiB3aWxsIGJlIG1hdGNoZWQgc3RhcnRpbmcgZnJvbSB0aGUgZWxlbWVudCdzIHBhcmVudCBhbmQgZ29pbmcgdXAgdGhlIERPTSB1bnRpbCBhIG1hdGNoXG4gICAqIGhhcyBiZWVuIGZvdW5kLlxuICAgKi9cbiAgQElucHV0KCdjZGtEcmFnQm91bmRhcnknKSBib3VuZGFyeUVsZW1lbnQ6IHN0cmluZyB8IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+IHwgSFRNTEVsZW1lbnQ7XG5cbiAgLyoqXG4gICAqIEFtb3VudCBvZiBtaWxsaXNlY29uZHMgdG8gd2FpdCBhZnRlciB0aGUgdXNlciBoYXMgcHV0IHRoZWlyXG4gICAqIHBvaW50ZXIgZG93biBiZWZvcmUgc3RhcnRpbmcgdG8gZHJhZyB0aGUgZWxlbWVudC5cbiAgICovXG4gIEBJbnB1dCgnY2RrRHJhZ1N0YXJ0RGVsYXknKSBkcmFnU3RhcnREZWxheTogbnVtYmVyIHwge3RvdWNoOiBudW1iZXIsIG1vdXNlOiBudW1iZXJ9ID0gMDtcblxuICAvKipcbiAgICogU2V0cyB0aGUgcG9zaXRpb24gb2YgYSBgQ2RrRHJhZ2AgdGhhdCBpcyBvdXRzaWRlIG9mIGEgZHJvcCBjb250YWluZXIuXG4gICAqIENhbiBiZSB1c2VkIHRvIHJlc3RvcmUgdGhlIGVsZW1lbnQncyBwb3NpdGlvbiBmb3IgYSByZXR1cm5pbmcgdXNlci5cbiAgICovXG4gIEBJbnB1dCgnY2RrRHJhZ0ZyZWVEcmFnUG9zaXRpb24nKSBmcmVlRHJhZ1Bvc2l0aW9uOiB7eDogbnVtYmVyLCB5OiBudW1iZXJ9O1xuXG4gIC8qKiBXaGV0aGVyIHN0YXJ0aW5nIHRvIGRyYWcgdGhpcyBlbGVtZW50IGlzIGRpc2FibGVkLiAqL1xuICBASW5wdXQoJ2Nka0RyYWdEaXNhYmxlZCcpXG4gIGdldCBkaXNhYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fZGlzYWJsZWQgfHwgKHRoaXMuZHJvcENvbnRhaW5lciAmJiB0aGlzLmRyb3BDb250YWluZXIuZGlzYWJsZWQpO1xuICB9XG4gIHNldCBkaXNhYmxlZCh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX2Rpc2FibGVkID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgICB0aGlzLl9kcmFnUmVmLmRpc2FibGVkID0gdGhpcy5fZGlzYWJsZWQ7XG4gIH1cbiAgcHJpdmF0ZSBfZGlzYWJsZWQgPSBmYWxzZTtcblxuICAvKipcbiAgICogRnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB0byBjdXN0b21pemUgdGhlIGxvZ2ljIG9mIGhvdyB0aGUgcG9zaXRpb24gb2YgdGhlIGRyYWcgaXRlbVxuICAgKiBpcyBsaW1pdGVkIHdoaWxlIGl0J3MgYmVpbmcgZHJhZ2dlZC4gR2V0cyBjYWxsZWQgd2l0aCBhIHBvaW50IGNvbnRhaW5pbmcgdGhlIGN1cnJlbnQgcG9zaXRpb25cbiAgICogb2YgdGhlIHVzZXIncyBwb2ludGVyIG9uIHRoZSBwYWdlIGFuZCBzaG91bGQgcmV0dXJuIGEgcG9pbnQgZGVzY3JpYmluZyB3aGVyZSB0aGUgaXRlbSBzaG91bGRcbiAgICogYmUgcmVuZGVyZWQuXG4gICAqL1xuICBASW5wdXQoJ2Nka0RyYWdDb25zdHJhaW5Qb3NpdGlvbicpIGNvbnN0cmFpblBvc2l0aW9uPzogKHBvaW50OiBQb2ludCwgZHJhZ1JlZjogRHJhZ1JlZikgPT4gUG9pbnQ7XG5cbiAgLyoqIENsYXNzIHRvIGJlIGFkZGVkIHRvIHRoZSBwcmV2aWV3IGVsZW1lbnQuICovXG4gIEBJbnB1dCgnY2RrRHJhZ1ByZXZpZXdDbGFzcycpIHByZXZpZXdDbGFzczogc3RyaW5nIHwgc3RyaW5nW107XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgc3RhcnRzIGRyYWdnaW5nIHRoZSBpdGVtLiAqL1xuICBAT3V0cHV0KCdjZGtEcmFnU3RhcnRlZCcpIHN0YXJ0ZWQ6IEV2ZW50RW1pdHRlcjxDZGtEcmFnU3RhcnQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnU3RhcnQ+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgaGFzIHJlbGVhc2VkIGEgZHJhZyBpdGVtLCBiZWZvcmUgYW55IGFuaW1hdGlvbnMgaGF2ZSBzdGFydGVkLiAqL1xuICBAT3V0cHV0KCdjZGtEcmFnUmVsZWFzZWQnKSByZWxlYXNlZDogRXZlbnRFbWl0dGVyPENka0RyYWdSZWxlYXNlPiA9XG4gICAgICBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdSZWxlYXNlPigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHN0b3BzIGRyYWdnaW5nIGFuIGl0ZW0gaW4gdGhlIGNvbnRhaW5lci4gKi9cbiAgQE91dHB1dCgnY2RrRHJhZ0VuZGVkJykgZW5kZWQ6IEV2ZW50RW1pdHRlcjxDZGtEcmFnRW5kPiA9IG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0VuZD4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBoYXMgbW92ZWQgdGhlIGl0ZW0gaW50byBhIG5ldyBjb250YWluZXIuICovXG4gIEBPdXRwdXQoJ2Nka0RyYWdFbnRlcmVkJykgZW50ZXJlZDogRXZlbnRFbWl0dGVyPENka0RyYWdFbnRlcjxhbnk+PiA9XG4gICAgICBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdFbnRlcjxhbnk+PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHJlbW92ZXMgdGhlIGl0ZW0gaXRzIGNvbnRhaW5lciBieSBkcmFnZ2luZyBpdCBpbnRvIGFub3RoZXIgY29udGFpbmVyLiAqL1xuICBAT3V0cHV0KCdjZGtEcmFnRXhpdGVkJykgZXhpdGVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0V4aXQ8YW55Pj4gPVxuICAgICAgbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnRXhpdDxhbnk+PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGRyb3BzIHRoZSBpdGVtIGluc2lkZSBhIGNvbnRhaW5lci4gKi9cbiAgQE91dHB1dCgnY2RrRHJhZ0Ryb3BwZWQnKSBkcm9wcGVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0Ryb3A8YW55Pj4gPVxuICAgICAgbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnRHJvcDxhbnk+PigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyBhcyB0aGUgdXNlciBpcyBkcmFnZ2luZyB0aGUgaXRlbS4gVXNlIHdpdGggY2F1dGlvbixcbiAgICogYmVjYXVzZSB0aGlzIGV2ZW50IHdpbGwgZmlyZSBmb3IgZXZlcnkgcGl4ZWwgdGhhdCB0aGUgdXNlciBoYXMgZHJhZ2dlZC5cbiAgICovXG4gIEBPdXRwdXQoJ2Nka0RyYWdNb3ZlZCcpIG1vdmVkOiBPYnNlcnZhYmxlPENka0RyYWdNb3ZlPFQ+PiA9XG4gICAgICBuZXcgT2JzZXJ2YWJsZSgob2JzZXJ2ZXI6IE9ic2VydmVyPENka0RyYWdNb3ZlPFQ+PikgPT4ge1xuICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSB0aGlzLl9kcmFnUmVmLm1vdmVkLnBpcGUobWFwKG1vdmVkRXZlbnQgPT4gKHtcbiAgICAgICAgICBzb3VyY2U6IHRoaXMsXG4gICAgICAgICAgcG9pbnRlclBvc2l0aW9uOiBtb3ZlZEV2ZW50LnBvaW50ZXJQb3NpdGlvbixcbiAgICAgICAgICBldmVudDogbW92ZWRFdmVudC5ldmVudCxcbiAgICAgICAgICBkZWx0YTogbW92ZWRFdmVudC5kZWx0YSxcbiAgICAgICAgICBkaXN0YW5jZTogbW92ZWRFdmVudC5kaXN0YW5jZVxuICAgICAgICB9KSkpLnN1YnNjcmliZShvYnNlcnZlcik7XG5cbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgLyoqIEVsZW1lbnQgdGhhdCB0aGUgZHJhZ2dhYmxlIGlzIGF0dGFjaGVkIHRvLiAqL1xuICAgICAgcHVibGljIGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgICAgLyoqIERyb3BwYWJsZSBjb250YWluZXIgdGhhdCB0aGUgZHJhZ2dhYmxlIGlzIGEgcGFydCBvZi4gKi9cbiAgICAgIEBJbmplY3QoQ0RLX0RST1BfTElTVCkgQE9wdGlvbmFsKCkgQFNraXBTZWxmKCkgcHVibGljIGRyb3BDb250YWluZXI6IENka0Ryb3BMaXN0LFxuICAgICAgQEluamVjdChET0NVTUVOVCkgcHJpdmF0ZSBfZG9jdW1lbnQ6IGFueSwgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgICBwcml2YXRlIF92aWV3Q29udGFpbmVyUmVmOiBWaWV3Q29udGFpbmVyUmVmLCBASW5qZWN0KENES19EUkFHX0NPTkZJRykgY29uZmlnOiBEcmFnUmVmQ29uZmlnLFxuICAgICAgQE9wdGlvbmFsKCkgcHJpdmF0ZSBfZGlyOiBEaXJlY3Rpb25hbGl0eSwgZHJhZ0Ryb3A6IERyYWdEcm9wLFxuICAgICAgcHJpdmF0ZSBfY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmKSB7XG4gICAgdGhpcy5fZHJhZ1JlZiA9IGRyYWdEcm9wLmNyZWF0ZURyYWcoZWxlbWVudCwgY29uZmlnKTtcbiAgICB0aGlzLl9kcmFnUmVmLmRhdGEgPSB0aGlzO1xuXG4gICAgLy8gTm90ZSB0aGF0IHVzdWFsbHkgdGhlIGNvbnRhaW5lciBpcyBhc3NpZ25lZCB3aGVuIHRoZSBkcm9wIGxpc3QgaXMgcGlja3MgdXAgdGhlIGl0ZW0sIGJ1dCBpblxuICAgIC8vIHNvbWUgY2FzZXMgKG1haW5seSB0cmFuc3BsYW50ZWQgdmlld3Mgd2l0aCBPblB1c2gsIHNlZSAjMTgzNDEpIHdlIG1heSBlbmQgdXAgaW4gYSBzaXR1YXRpb25cbiAgICAvLyB3aGVyZSB0aGVyZSBhcmUgbm8gaXRlbXMgb24gdGhlIGZpcnN0IGNoYW5nZSBkZXRlY3Rpb24gcGFzcywgYnV0IHRoZSBpdGVtcyBnZXQgcGlja2VkIHVwIGFzXG4gICAgLy8gc29vbiBhcyB0aGUgdXNlciB0cmlnZ2VycyBhbm90aGVyIHBhc3MgYnkgZHJhZ2dpbmcuIFRoaXMgaXMgYSBwcm9ibGVtLCBiZWNhdXNlIHRoZSBpdGVtIHdvdWxkXG4gICAgLy8gaGF2ZSB0byBzd2l0Y2ggZnJvbSBzdGFuZGFsb25lIG1vZGUgdG8gZHJhZyBtb2RlIGluIHRoZSBtaWRkbGUgb2YgdGhlIGRyYWdnaW5nIHNlcXVlbmNlIHdoaWNoXG4gICAgLy8gaXMgdG9vIGxhdGUgc2luY2UgdGhlIHR3byBtb2RlcyBzYXZlIGRpZmZlcmVudCBraW5kcyBvZiBpbmZvcm1hdGlvbi4gV2Ugd29yayBhcm91bmQgaXQgYnlcbiAgICAvLyBhc3NpZ25pbmcgdGhlIGRyb3AgY29udGFpbmVyIGJvdGggZnJvbSBoZXJlIGFuZCB0aGUgbGlzdC5cbiAgICBpZiAoZHJvcENvbnRhaW5lcikge1xuICAgICAgdGhpcy5fZHJhZ1JlZi5fd2l0aERyb3BDb250YWluZXIoZHJvcENvbnRhaW5lci5fZHJvcExpc3RSZWYpO1xuICAgIH1cblxuICAgIHRoaXMuX3N5bmNJbnB1dHModGhpcy5fZHJhZ1JlZik7XG4gICAgdGhpcy5faGFuZGxlRXZlbnRzKHRoaXMuX2RyYWdSZWYpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGVsZW1lbnQgdGhhdCBpcyBiZWluZyB1c2VkIGFzIGEgcGxhY2Vob2xkZXJcbiAgICogd2hpbGUgdGhlIGN1cnJlbnQgZWxlbWVudCBpcyBiZWluZyBkcmFnZ2VkLlxuICAgKi9cbiAgZ2V0UGxhY2Vob2xkZXJFbGVtZW50KCk6IEhUTUxFbGVtZW50IHtcbiAgICByZXR1cm4gdGhpcy5fZHJhZ1JlZi5nZXRQbGFjZWhvbGRlckVsZW1lbnQoKTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHRoZSByb290IGRyYWdnYWJsZSBlbGVtZW50LiAqL1xuICBnZXRSb290RWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX2RyYWdSZWYuZ2V0Um9vdEVsZW1lbnQoKTtcbiAgfVxuXG4gIC8qKiBSZXNldHMgYSBzdGFuZGFsb25lIGRyYWcgaXRlbSB0byBpdHMgaW5pdGlhbCBwb3NpdGlvbi4gKi9cbiAgcmVzZXQoKTogdm9pZCB7XG4gICAgdGhpcy5fZHJhZ1JlZi5yZXNldCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHBpeGVsIGNvb3JkaW5hdGVzIG9mIHRoZSBkcmFnZ2FibGUgb3V0c2lkZSBvZiBhIGRyb3AgY29udGFpbmVyLlxuICAgKi9cbiAgZ2V0RnJlZURyYWdQb3NpdGlvbigpOiB7cmVhZG9ubHkgeDogbnVtYmVyLCByZWFkb25seSB5OiBudW1iZXJ9IHtcbiAgICByZXR1cm4gdGhpcy5fZHJhZ1JlZi5nZXRGcmVlRHJhZ1Bvc2l0aW9uKCk7XG4gIH1cblxuICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgLy8gV2UgbmVlZCB0byB3YWl0IGZvciB0aGUgem9uZSB0byBzdGFiaWxpemUsIGluIG9yZGVyIGZvciB0aGUgcmVmZXJlbmNlXG4gICAgLy8gZWxlbWVudCB0byBiZSBpbiB0aGUgcHJvcGVyIHBsYWNlIGluIHRoZSBET00uIFRoaXMgaXMgbW9zdGx5IHJlbGV2YW50XG4gICAgLy8gZm9yIGRyYWdnYWJsZSBlbGVtZW50cyBpbnNpZGUgcG9ydGFscyBzaW5jZSB0aGV5IGdldCBzdGFtcGVkIG91dCBpblxuICAgIC8vIHRoZWlyIG9yaWdpbmFsIERPTSBwb3NpdGlvbiBhbmQgdGhlbiB0aGV5IGdldCB0cmFuc2ZlcnJlZCB0byB0aGUgcG9ydGFsLlxuICAgIHRoaXMuX25nWm9uZS5vblN0YWJsZS5hc09ic2VydmFibGUoKVxuICAgICAgLnBpcGUodGFrZSgxKSwgdGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpXG4gICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgdGhpcy5fdXBkYXRlUm9vdEVsZW1lbnQoKTtcblxuICAgICAgICAvLyBMaXN0ZW4gZm9yIGFueSBuZXdseS1hZGRlZCBoYW5kbGVzLlxuICAgICAgICB0aGlzLl9oYW5kbGVzLmNoYW5nZXMucGlwZShcbiAgICAgICAgICBzdGFydFdpdGgodGhpcy5faGFuZGxlcyksXG4gICAgICAgICAgLy8gU3luYyB0aGUgbmV3IGhhbmRsZXMgd2l0aCB0aGUgRHJhZ1JlZi5cbiAgICAgICAgICB0YXAoKGhhbmRsZXM6IFF1ZXJ5TGlzdDxDZGtEcmFnSGFuZGxlPikgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2hpbGRIYW5kbGVFbGVtZW50cyA9IGhhbmRsZXNcbiAgICAgICAgICAgICAgLmZpbHRlcihoYW5kbGUgPT4gaGFuZGxlLl9wYXJlbnREcmFnID09PSB0aGlzKVxuICAgICAgICAgICAgICAubWFwKGhhbmRsZSA9PiBoYW5kbGUuZWxlbWVudCk7XG4gICAgICAgICAgICB0aGlzLl9kcmFnUmVmLndpdGhIYW5kbGVzKGNoaWxkSGFuZGxlRWxlbWVudHMpO1xuICAgICAgICAgIH0pLFxuICAgICAgICAgIC8vIExpc3RlbiBpZiB0aGUgc3RhdGUgb2YgYW55IG9mIHRoZSBoYW5kbGVzIGNoYW5nZXMuXG4gICAgICAgICAgc3dpdGNoTWFwKChoYW5kbGVzOiBRdWVyeUxpc3Q8Q2RrRHJhZ0hhbmRsZT4pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBtZXJnZSguLi5oYW5kbGVzLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0uX3N0YXRlQ2hhbmdlcy5waXBlKHN0YXJ0V2l0aChpdGVtKSk7XG4gICAgICAgICAgICB9KSkgYXMgT2JzZXJ2YWJsZTxDZGtEcmFnSGFuZGxlPjtcbiAgICAgICAgICB9KSxcbiAgICAgICAgICB0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKVxuICAgICAgICApLnN1YnNjcmliZShoYW5kbGVJbnN0YW5jZSA9PiB7XG4gICAgICAgICAgLy8gRW5hYmxlZC9kaXNhYmxlIHRoZSBoYW5kbGUgdGhhdCBjaGFuZ2VkIGluIHRoZSBEcmFnUmVmLlxuICAgICAgICAgIGNvbnN0IGRyYWdSZWYgPSB0aGlzLl9kcmFnUmVmO1xuICAgICAgICAgIGNvbnN0IGhhbmRsZSA9IGhhbmRsZUluc3RhbmNlLmVsZW1lbnQubmF0aXZlRWxlbWVudDtcbiAgICAgICAgICBoYW5kbGVJbnN0YW5jZS5kaXNhYmxlZCA/IGRyYWdSZWYuZGlzYWJsZUhhbmRsZShoYW5kbGUpIDogZHJhZ1JlZi5lbmFibGVIYW5kbGUoaGFuZGxlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHRoaXMuZnJlZURyYWdQb3NpdGlvbikge1xuICAgICAgICAgIHRoaXMuX2RyYWdSZWYuc2V0RnJlZURyYWdQb3NpdGlvbih0aGlzLmZyZWVEcmFnUG9zaXRpb24pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpIHtcbiAgICBjb25zdCByb290U2VsZWN0b3JDaGFuZ2UgPSBjaGFuZ2VzWydyb290RWxlbWVudFNlbGVjdG9yJ107XG4gICAgY29uc3QgcG9zaXRpb25DaGFuZ2UgPSBjaGFuZ2VzWydmcmVlRHJhZ1Bvc2l0aW9uJ107XG5cbiAgICAvLyBXZSBkb24ndCBoYXZlIHRvIHJlYWN0IHRvIHRoZSBmaXJzdCBjaGFuZ2Ugc2luY2UgaXQncyBiZWluZ1xuICAgIC8vIGhhbmRsZWQgaW4gYG5nQWZ0ZXJWaWV3SW5pdGAgd2hlcmUgaXQgbmVlZHMgdG8gYmUgZGVmZXJyZWQuXG4gICAgaWYgKHJvb3RTZWxlY3RvckNoYW5nZSAmJiAhcm9vdFNlbGVjdG9yQ2hhbmdlLmZpcnN0Q2hhbmdlKSB7XG4gICAgICB0aGlzLl91cGRhdGVSb290RWxlbWVudCgpO1xuICAgIH1cblxuICAgIC8vIFNraXAgdGhlIGZpcnN0IGNoYW5nZSBzaW5jZSBpdCdzIGJlaW5nIGhhbmRsZWQgaW4gYG5nQWZ0ZXJWaWV3SW5pdGAuXG4gICAgaWYgKHBvc2l0aW9uQ2hhbmdlICYmICFwb3NpdGlvbkNoYW5nZS5maXJzdENoYW5nZSAmJiB0aGlzLmZyZWVEcmFnUG9zaXRpb24pIHtcbiAgICAgIHRoaXMuX2RyYWdSZWYuc2V0RnJlZURyYWdQb3NpdGlvbih0aGlzLmZyZWVEcmFnUG9zaXRpb24pO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5uZXh0KCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fZHJhZ1JlZi5kaXNwb3NlKCk7XG4gIH1cblxuICAvKiogU3luY3MgdGhlIHJvb3QgZWxlbWVudCB3aXRoIHRoZSBgRHJhZ1JlZmAuICovXG4gIHByaXZhdGUgX3VwZGF0ZVJvb3RFbGVtZW50KCkge1xuICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudDtcbiAgICBjb25zdCByb290RWxlbWVudCA9IHRoaXMucm9vdEVsZW1lbnRTZWxlY3RvciA/XG4gICAgICAgIGdldENsb3Nlc3RNYXRjaGluZ0FuY2VzdG9yKGVsZW1lbnQsIHRoaXMucm9vdEVsZW1lbnRTZWxlY3RvcikgOiBlbGVtZW50O1xuXG4gICAgaWYgKHJvb3RFbGVtZW50ICYmIHJvb3RFbGVtZW50Lm5vZGVUeXBlICE9PSB0aGlzLl9kb2N1bWVudC5FTEVNRU5UX05PREUpIHtcbiAgICAgIHRocm93IEVycm9yKGBjZGtEcmFnIG11c3QgYmUgYXR0YWNoZWQgdG8gYW4gZWxlbWVudCBub2RlLiBgICtcbiAgICAgICAgICAgICAgICAgIGBDdXJyZW50bHkgYXR0YWNoZWQgdG8gXCIke3Jvb3RFbGVtZW50Lm5vZGVOYW1lfVwiLmApO1xuICAgIH1cblxuICAgIHRoaXMuX2RyYWdSZWYud2l0aFJvb3RFbGVtZW50KHJvb3RFbGVtZW50IHx8IGVsZW1lbnQpO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIGJvdW5kYXJ5IGVsZW1lbnQsIGJhc2VkIG9uIHRoZSBgYm91bmRhcnlFbGVtZW50YCB2YWx1ZS4gKi9cbiAgcHJpdmF0ZSBfZ2V0Qm91bmRhcnlFbGVtZW50KCkge1xuICAgIGNvbnN0IGJvdW5kYXJ5ID0gdGhpcy5ib3VuZGFyeUVsZW1lbnQ7XG5cbiAgICBpZiAoIWJvdW5kYXJ5KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGJvdW5kYXJ5ID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIGdldENsb3Nlc3RNYXRjaGluZ0FuY2VzdG9yKHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50LCBib3VuZGFyeSk7XG4gICAgfVxuXG4gICAgY29uc3QgZWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoYm91bmRhcnkpO1xuXG4gICAgaWYgKGlzRGV2TW9kZSgpICYmICFlbGVtZW50LmNvbnRhaW5zKHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50KSkge1xuICAgICAgdGhyb3cgRXJyb3IoJ0RyYWdnYWJsZSBlbGVtZW50IGlzIG5vdCBpbnNpZGUgb2YgdGhlIG5vZGUgcGFzc2VkIGludG8gY2RrRHJhZ0JvdW5kYXJ5LicpO1xuICAgIH1cblxuICAgIHJldHVybiBlbGVtZW50O1xuICB9XG5cbiAgLyoqIFN5bmNzIHRoZSBpbnB1dHMgb2YgdGhlIENka0RyYWcgd2l0aCB0aGUgb3B0aW9ucyBvZiB0aGUgdW5kZXJseWluZyBEcmFnUmVmLiAqL1xuICBwcml2YXRlIF9zeW5jSW5wdXRzKHJlZjogRHJhZ1JlZjxDZGtEcmFnPFQ+Pikge1xuICAgIHJlZi5iZWZvcmVTdGFydGVkLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICBpZiAoIXJlZi5pc0RyYWdnaW5nKCkpIHtcbiAgICAgICAgY29uc3QgZGlyID0gdGhpcy5fZGlyO1xuICAgICAgICBjb25zdCBkcmFnU3RhcnREZWxheSA9IHRoaXMuZHJhZ1N0YXJ0RGVsYXk7XG4gICAgICAgIGNvbnN0IHBsYWNlaG9sZGVyID0gdGhpcy5fcGxhY2Vob2xkZXJUZW1wbGF0ZSA/IHtcbiAgICAgICAgICB0ZW1wbGF0ZTogdGhpcy5fcGxhY2Vob2xkZXJUZW1wbGF0ZS50ZW1wbGF0ZVJlZixcbiAgICAgICAgICBjb250ZXh0OiB0aGlzLl9wbGFjZWhvbGRlclRlbXBsYXRlLmRhdGEsXG4gICAgICAgICAgdmlld0NvbnRhaW5lcjogdGhpcy5fdmlld0NvbnRhaW5lclJlZlxuICAgICAgICB9IDogbnVsbDtcbiAgICAgICAgY29uc3QgcHJldmlldyA9IHRoaXMuX3ByZXZpZXdUZW1wbGF0ZSA/IHtcbiAgICAgICAgICB0ZW1wbGF0ZTogdGhpcy5fcHJldmlld1RlbXBsYXRlLnRlbXBsYXRlUmVmLFxuICAgICAgICAgIGNvbnRleHQ6IHRoaXMuX3ByZXZpZXdUZW1wbGF0ZS5kYXRhLFxuICAgICAgICAgIHZpZXdDb250YWluZXI6IHRoaXMuX3ZpZXdDb250YWluZXJSZWZcbiAgICAgICAgfSA6IG51bGw7XG5cbiAgICAgICAgcmVmLmRpc2FibGVkID0gdGhpcy5kaXNhYmxlZDtcbiAgICAgICAgcmVmLmxvY2tBeGlzID0gdGhpcy5sb2NrQXhpcztcbiAgICAgICAgcmVmLmRyYWdTdGFydERlbGF5ID0gKHR5cGVvZiBkcmFnU3RhcnREZWxheSA9PT0gJ29iamVjdCcgJiYgZHJhZ1N0YXJ0RGVsYXkpID9cbiAgICAgICAgICAgIGRyYWdTdGFydERlbGF5IDogY29lcmNlTnVtYmVyUHJvcGVydHkoZHJhZ1N0YXJ0RGVsYXkpO1xuICAgICAgICByZWYuY29uc3RyYWluUG9zaXRpb24gPSB0aGlzLmNvbnN0cmFpblBvc2l0aW9uO1xuICAgICAgICByZWYucHJldmlld0NsYXNzID0gdGhpcy5wcmV2aWV3Q2xhc3M7XG4gICAgICAgIHJlZlxuICAgICAgICAgIC53aXRoQm91bmRhcnlFbGVtZW50KHRoaXMuX2dldEJvdW5kYXJ5RWxlbWVudCgpKVxuICAgICAgICAgIC53aXRoUGxhY2Vob2xkZXJUZW1wbGF0ZShwbGFjZWhvbGRlcilcbiAgICAgICAgICAud2l0aFByZXZpZXdUZW1wbGF0ZShwcmV2aWV3KTtcblxuICAgICAgICBpZiAoZGlyKSB7XG4gICAgICAgICAgcmVmLndpdGhEaXJlY3Rpb24oZGlyLnZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqIEhhbmRsZXMgdGhlIGV2ZW50cyBmcm9tIHRoZSB1bmRlcmx5aW5nIGBEcmFnUmVmYC4gKi9cbiAgcHJpdmF0ZSBfaGFuZGxlRXZlbnRzKHJlZjogRHJhZ1JlZjxDZGtEcmFnPFQ+Pikge1xuICAgIHJlZi5zdGFydGVkLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICB0aGlzLnN0YXJ0ZWQuZW1pdCh7c291cmNlOiB0aGlzfSk7XG5cbiAgICAgIC8vIFNpbmNlIGFsbCBvZiB0aGVzZSBldmVudHMgcnVuIG91dHNpZGUgb2YgY2hhbmdlIGRldGVjdGlvbixcbiAgICAgIC8vIHdlIG5lZWQgdG8gZW5zdXJlIHRoYXQgZXZlcnl0aGluZyBpcyBtYXJrZWQgY29ycmVjdGx5LlxuICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgfSk7XG5cbiAgICByZWYucmVsZWFzZWQuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIHRoaXMucmVsZWFzZWQuZW1pdCh7c291cmNlOiB0aGlzfSk7XG4gICAgfSk7XG5cbiAgICByZWYuZW5kZWQuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgIHRoaXMuZW5kZWQuZW1pdCh7c291cmNlOiB0aGlzLCBkaXN0YW5jZTogZXZlbnQuZGlzdGFuY2V9KTtcblxuICAgICAgLy8gU2luY2UgYWxsIG9mIHRoZXNlIGV2ZW50cyBydW4gb3V0c2lkZSBvZiBjaGFuZ2UgZGV0ZWN0aW9uLFxuICAgICAgLy8gd2UgbmVlZCB0byBlbnN1cmUgdGhhdCBldmVyeXRoaW5nIGlzIG1hcmtlZCBjb3JyZWN0bHkuXG4gICAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgICB9KTtcblxuICAgIHJlZi5lbnRlcmVkLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICB0aGlzLmVudGVyZWQuZW1pdCh7XG4gICAgICAgIGNvbnRhaW5lcjogZXZlbnQuY29udGFpbmVyLmRhdGEsXG4gICAgICAgIGl0ZW06IHRoaXMsXG4gICAgICAgIGN1cnJlbnRJbmRleDogZXZlbnQuY3VycmVudEluZGV4XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJlZi5leGl0ZWQuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgIHRoaXMuZXhpdGVkLmVtaXQoe1xuICAgICAgICBjb250YWluZXI6IGV2ZW50LmNvbnRhaW5lci5kYXRhLFxuICAgICAgICBpdGVtOiB0aGlzXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJlZi5kcm9wcGVkLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICB0aGlzLmRyb3BwZWQuZW1pdCh7XG4gICAgICAgIHByZXZpb3VzSW5kZXg6IGV2ZW50LnByZXZpb3VzSW5kZXgsXG4gICAgICAgIGN1cnJlbnRJbmRleDogZXZlbnQuY3VycmVudEluZGV4LFxuICAgICAgICBwcmV2aW91c0NvbnRhaW5lcjogZXZlbnQucHJldmlvdXNDb250YWluZXIuZGF0YSxcbiAgICAgICAgY29udGFpbmVyOiBldmVudC5jb250YWluZXIuZGF0YSxcbiAgICAgICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcjogZXZlbnQuaXNQb2ludGVyT3ZlckNvbnRhaW5lcixcbiAgICAgICAgaXRlbTogdGhpcyxcbiAgICAgICAgZGlzdGFuY2U6IGV2ZW50LmRpc3RhbmNlXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9kaXNhYmxlZDogQm9vbGVhbklucHV0O1xufVxuXG4vKiogR2V0cyB0aGUgY2xvc2VzdCBhbmNlc3RvciBvZiBhbiBlbGVtZW50IHRoYXQgbWF0Y2hlcyBhIHNlbGVjdG9yLiAqL1xuZnVuY3Rpb24gZ2V0Q2xvc2VzdE1hdGNoaW5nQW5jZXN0b3IoZWxlbWVudDogSFRNTEVsZW1lbnQsIHNlbGVjdG9yOiBzdHJpbmcpIHtcbiAgbGV0IGN1cnJlbnRFbGVtZW50ID0gZWxlbWVudC5wYXJlbnRFbGVtZW50IGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcblxuICB3aGlsZSAoY3VycmVudEVsZW1lbnQpIHtcbiAgICAvLyBJRSBkb2Vzbid0IHN1cHBvcnQgYG1hdGNoZXNgIHNvIHdlIGhhdmUgdG8gZmFsbCBiYWNrIHRvIGBtc01hdGNoZXNTZWxlY3RvcmAuXG4gICAgaWYgKGN1cnJlbnRFbGVtZW50Lm1hdGNoZXMgPyBjdXJyZW50RWxlbWVudC5tYXRjaGVzKHNlbGVjdG9yKSA6XG4gICAgICAgIChjdXJyZW50RWxlbWVudCBhcyBhbnkpLm1zTWF0Y2hlc1NlbGVjdG9yKHNlbGVjdG9yKSkge1xuICAgICAgcmV0dXJuIGN1cnJlbnRFbGVtZW50O1xuICAgIH1cblxuICAgIGN1cnJlbnRFbGVtZW50ID0gY3VycmVudEVsZW1lbnQucGFyZW50RWxlbWVudDtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG4iXX0=