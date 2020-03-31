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
import { CDK_DRAG_CONFIG } from './config';
/**
 * Injection token that is used to provide a CdkDropList instance to CdkDrag.
 * Used for avoiding circular imports.
 */
export var CDK_DROP_LIST = new InjectionToken('CDK_DROP_LIST');
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
        this._dragRef = dragDrop.createDrag(element, {
            dragStartThreshold: config && config.dragStartThreshold != null ?
                config.dragStartThreshold : 5,
            pointerDirectionChangeThreshold: config && config.pointerDirectionChangeThreshold != null ?
                config.pointerDirectionChangeThreshold : 5
        });
        this._dragRef.data = this;
        if (config) {
            this._assignDefaults(config);
        }
        // Note that usually the container is assigned when the drop list is picks up the item, but in
        // some cases (mainly transplanted views with OnPush, see #18341) we may end up in a situation
        // where there are no items on the first change detection pass, but the items get picked up as
        // soon as the user triggers another pass by dragging. This is a problem, because the item would
        // have to switch from standalone mode to drag mode in the middle of the dragging sequence which
        // is too late since the two modes save different kinds of information. We work around it by
        // assigning the drop container both from here and the list.
        if (dropContainer) {
            this._dragRef._withDropContainer(dropContainer._dropListRef);
            dropContainer.addItem(this);
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
        if (this.dropContainer) {
            this.dropContainer.removeItem(this);
        }
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
                    matchSize: _this._previewTemplate.matchSize,
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
    /** Assigns the default input values based on a provided config object. */
    CdkDrag.prototype._assignDefaults = function (config) {
        var lockAxis = config.lockAxis, dragStartDelay = config.dragStartDelay, constrainPosition = config.constrainPosition, previewClass = config.previewClass, boundaryElement = config.boundaryElement, draggingDisabled = config.draggingDisabled, rootElementSelector = config.rootElementSelector;
        this.disabled = draggingDisabled == null ? false : draggingDisabled;
        this.dragStartDelay = dragStartDelay || 0;
        if (lockAxis) {
            this.lockAxis = lockAxis;
        }
        if (constrainPosition) {
            this.constrainPosition = constrainPosition;
        }
        if (previewClass) {
            this.previewClass = previewClass;
        }
        if (boundaryElement) {
            this.boundaryElement = boundaryElement;
        }
        if (rootElementSelector) {
            this.rootElementSelector = rootElementSelector;
        }
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
        { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [CDK_DRAG_CONFIG,] }] },
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2RpcmVjdGl2ZXMvZHJhZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBRUwsWUFBWSxFQUNaLGVBQWUsRUFDZixTQUFTLEVBQ1QsVUFBVSxFQUNWLFlBQVksRUFDWixNQUFNLEVBQ04sY0FBYyxFQUNkLEtBQUssRUFDTCxNQUFNLEVBRU4sUUFBUSxFQUNSLE1BQU0sRUFDTixTQUFTLEVBQ1QsUUFBUSxFQUNSLGdCQUFnQixFQUdoQixpQkFBaUIsRUFDakIsU0FBUyxHQUNWLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFDTCxxQkFBcUIsRUFDckIsb0JBQW9CLEVBQ3BCLGFBQWEsRUFFZCxNQUFNLHVCQUF1QixDQUFDO0FBQy9CLE9BQU8sRUFBQyxVQUFVLEVBQVksT0FBTyxFQUFFLEtBQUssRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUMxRCxPQUFPLEVBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQVUvRSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzVDLE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3RELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUM5QyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFHL0MsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUN0QyxPQUFPLEVB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c0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge1xuICBBZnRlclZpZXdJbml0LFxuICBDb250ZW50Q2hpbGQsXG4gIENvbnRlbnRDaGlsZHJlbixcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIEluamVjdCxcbiAgSW5qZWN0aW9uVG9rZW4sXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgT3B0aW9uYWwsXG4gIE91dHB1dCxcbiAgUXVlcnlMaXN0LFxuICBTa2lwU2VsZixcbiAgVmlld0NvbnRhaW5lclJlZixcbiAgT25DaGFuZ2VzLFxuICBTaW1wbGVDaGFuZ2VzLFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgaXNEZXZNb2RlLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7XG4gIGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSxcbiAgY29lcmNlTnVtYmVyUHJvcGVydHksXG4gIGNvZXJjZUVsZW1lbnQsXG4gIEJvb2xlYW5JbnB1dFxufSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBPYnNlcnZlciwgU3ViamVjdCwgbWVyZ2V9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtzdGFydFdpdGgsIHRha2UsIG1hcCwgdGFrZVVudGlsLCBzd2l0Y2hNYXAsIHRhcH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtcbiAgQ2RrRHJhZ0Ryb3AsXG4gIENka0RyYWdFbmQsXG4gIENka0RyYWdFbnRlcixcbiAgQ2RrRHJhZ0V4aXQsXG4gIENka0RyYWdNb3ZlLFxuICBDZGtEcmFnU3RhcnQsXG4gIENka0RyYWdSZWxlYXNlLFxufSBmcm9tICcuLi9kcmFnLWV2ZW50cyc7XG5pbXBvcnQge0Nka0RyYWdIYW5kbGV9IGZyb20gJy4vZHJhZy1oYW5kbGUnO1xuaW1wb3J0IHtDZGtEcmFnUGxhY2Vob2xkZXJ9IGZyb20gJy4vZHJhZy1wbGFjZWhvbGRlcic7XG5pbXBvcnQge0Nka0RyYWdQcmV2aWV3fSBmcm9tICcuL2RyYWctcHJldmlldyc7XG5pbXBvcnQge0NES19EUkFHX1BBUkVOVH0gZnJvbSAnLi4vZHJhZy1wYXJlbnQnO1xuaW1wb3J0IHtEcmFnUmVmLCBQb2ludH0gZnJvbSAnLi4vZHJhZy1yZWYnO1xuaW1wb3J0IHtDZGtEcm9wTGlzdEludGVybmFsIGFzIENka0Ryb3BMaXN0fSBmcm9tICcuL2Ryb3AtbGlzdCc7XG5pbXBvcnQge0RyYWdEcm9wfSBmcm9tICcuLi9kcmFnLWRyb3AnO1xuaW1wb3J0IHtDREtfRFJBR19DT05GSUcsIERyYWdEcm9wQ29uZmlnLCBEcmFnU3RhcnREZWxheSwgRHJhZ0F4aXN9IGZyb20gJy4vY29uZmlnJztcblxuLyoqXG4gKiBJbmplY3Rpb24gdG9rZW4gdGhhdCBpcyB1c2VkIHRvIHByb3ZpZGUgYSBDZGtEcm9wTGlzdCBpbnN0YW5jZSB0byBDZGtEcmFnLlxuICogVXNlZCBmb3IgYXZvaWRpbmcgY2lyY3VsYXIgaW1wb3J0cy5cbiAqL1xuZXhwb3J0IGNvbnN0IENES19EUk9QX0xJU1QgPSBuZXcgSW5qZWN0aW9uVG9rZW48Q2RrRHJvcExpc3Q+KCdDREtfRFJPUF9MSVNUJyk7XG5cbi8qKiBFbGVtZW50IHRoYXQgY2FuIGJlIG1vdmVkIGluc2lkZSBhIENka0Ryb3BMaXN0IGNvbnRhaW5lci4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtEcmFnXScsXG4gIGV4cG9ydEFzOiAnY2RrRHJhZycsXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLWRyYWcnLFxuICAgICdbY2xhc3MuY2RrLWRyYWctZGlzYWJsZWRdJzogJ2Rpc2FibGVkJyxcbiAgICAnW2NsYXNzLmNkay1kcmFnLWRyYWdnaW5nXSc6ICdfZHJhZ1JlZi5pc0RyYWdnaW5nKCknLFxuICB9LFxuICBwcm92aWRlcnM6IFt7cHJvdmlkZTogQ0RLX0RSQUdfUEFSRU5ULCB1c2VFeGlzdGluZzogQ2RrRHJhZ31dXG59KVxuZXhwb3J0IGNsYXNzIENka0RyYWc8VCA9IGFueT4gaW1wbGVtZW50cyBBZnRlclZpZXdJbml0LCBPbkNoYW5nZXMsIE9uRGVzdHJveSB7XG4gIHByaXZhdGUgX2Rlc3Ryb3llZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgdW5kZXJseWluZyBkcmFnIGluc3RhbmNlLiAqL1xuICBfZHJhZ1JlZjogRHJhZ1JlZjxDZGtEcmFnPFQ+PjtcblxuICAvKiogRWxlbWVudHMgdGhhdCBjYW4gYmUgdXNlZCB0byBkcmFnIHRoZSBkcmFnZ2FibGUgaXRlbS4gKi9cbiAgQENvbnRlbnRDaGlsZHJlbihDZGtEcmFnSGFuZGxlLCB7ZGVzY2VuZGFudHM6IHRydWV9KSBfaGFuZGxlczogUXVlcnlMaXN0PENka0RyYWdIYW5kbGU+O1xuXG4gIC8qKiBFbGVtZW50IHRoYXQgd2lsbCBiZSB1c2VkIGFzIGEgdGVtcGxhdGUgdG8gY3JlYXRlIHRoZSBkcmFnZ2FibGUgaXRlbSdzIHByZXZpZXcuICovXG4gIEBDb250ZW50Q2hpbGQoQ2RrRHJhZ1ByZXZpZXcpIF9wcmV2aWV3VGVtcGxhdGU6IENka0RyYWdQcmV2aWV3O1xuXG4gIC8qKiBUZW1wbGF0ZSBmb3IgcGxhY2Vob2xkZXIgZWxlbWVudCByZW5kZXJlZCB0byBzaG93IHdoZXJlIGEgZHJhZ2dhYmxlIHdvdWxkIGJlIGRyb3BwZWQuICovXG4gIEBDb250ZW50Q2hpbGQoQ2RrRHJhZ1BsYWNlaG9sZGVyKSBfcGxhY2Vob2xkZXJUZW1wbGF0ZTogQ2RrRHJhZ1BsYWNlaG9sZGVyO1xuXG4gIC8qKiBBcmJpdHJhcnkgZGF0YSB0byBhdHRhY2ggdG8gdGhpcyBkcmFnIGluc3RhbmNlLiAqL1xuICBASW5wdXQoJ2Nka0RyYWdEYXRhJykgZGF0YTogVDtcblxuICAvKiogTG9ja3MgdGhlIHBvc2l0aW9uIG9mIHRoZSBkcmFnZ2VkIGVsZW1lbnQgYWxvbmcgdGhlIHNwZWNpZmllZCBheGlzLiAqL1xuICBASW5wdXQoJ2Nka0RyYWdMb2NrQXhpcycpIGxvY2tBeGlzOiBEcmFnQXhpcztcblxuICAvKipcbiAgICogU2VsZWN0b3IgdGhhdCB3aWxsIGJlIHVzZWQgdG8gZGV0ZXJtaW5lIHRoZSByb290IGRyYWdnYWJsZSBlbGVtZW50LCBzdGFydGluZyBmcm9tXG4gICAqIHRoZSBgY2RrRHJhZ2AgZWxlbWVudCBhbmQgZ29pbmcgdXAgdGhlIERPTS4gUGFzc2luZyBhbiBhbHRlcm5hdGUgcm9vdCBlbGVtZW50IGlzIHVzZWZ1bFxuICAgKiB3aGVuIHRyeWluZyB0byBlbmFibGUgZHJhZ2dpbmcgb24gYW4gZWxlbWVudCB0aGF0IHlvdSBtaWdodCBub3QgaGF2ZSBhY2Nlc3MgdG8uXG4gICAqL1xuICBASW5wdXQoJ2Nka0RyYWdSb290RWxlbWVudCcpIHJvb3RFbGVtZW50U2VsZWN0b3I6IHN0cmluZztcblxuICAvKipcbiAgICogTm9kZSBvciBzZWxlY3RvciB0aGF0IHdpbGwgYmUgdXNlZCB0byBkZXRlcm1pbmUgdGhlIGVsZW1lbnQgdG8gd2hpY2ggdGhlIGRyYWdnYWJsZSdzXG4gICAqIHBvc2l0aW9uIHdpbGwgYmUgY29uc3RyYWluZWQuIElmIGEgc3RyaW5nIGlzIHBhc3NlZCBpbiwgaXQnbGwgYmUgdXNlZCBhcyBhIHNlbGVjdG9yIHRoYXRcbiAgICogd2lsbCBiZSBtYXRjaGVkIHN0YXJ0aW5nIGZyb20gdGhlIGVsZW1lbnQncyBwYXJlbnQgYW5kIGdvaW5nIHVwIHRoZSBET00gdW50aWwgYSBtYXRjaFxuICAgKiBoYXMgYmVlbiBmb3VuZC5cbiAgICovXG4gIEBJbnB1dCgnY2RrRHJhZ0JvdW5kYXJ5JykgYm91bmRhcnlFbGVtZW50OiBzdHJpbmcgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiB8IEhUTUxFbGVtZW50O1xuXG4gIC8qKlxuICAgKiBBbW91bnQgb2YgbWlsbGlzZWNvbmRzIHRvIHdhaXQgYWZ0ZXIgdGhlIHVzZXIgaGFzIHB1dCB0aGVpclxuICAgKiBwb2ludGVyIGRvd24gYmVmb3JlIHN0YXJ0aW5nIHRvIGRyYWcgdGhlIGVsZW1lbnQuXG4gICAqL1xuICBASW5wdXQoJ2Nka0RyYWdTdGFydERlbGF5JykgZHJhZ1N0YXJ0RGVsYXk6IERyYWdTdGFydERlbGF5O1xuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBwb3NpdGlvbiBvZiBhIGBDZGtEcmFnYCB0aGF0IGlzIG91dHNpZGUgb2YgYSBkcm9wIGNvbnRhaW5lci5cbiAgICogQ2FuIGJlIHVzZWQgdG8gcmVzdG9yZSB0aGUgZWxlbWVudCdzIHBvc2l0aW9uIGZvciBhIHJldHVybmluZyB1c2VyLlxuICAgKi9cbiAgQElucHV0KCdjZGtEcmFnRnJlZURyYWdQb3NpdGlvbicpIGZyZWVEcmFnUG9zaXRpb246IHt4OiBudW1iZXIsIHk6IG51bWJlcn07XG5cbiAgLyoqIFdoZXRoZXIgc3RhcnRpbmcgdG8gZHJhZyB0aGlzIGVsZW1lbnQgaXMgZGlzYWJsZWQuICovXG4gIEBJbnB1dCgnY2RrRHJhZ0Rpc2FibGVkJylcbiAgZ2V0IGRpc2FibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9kaXNhYmxlZCB8fCAodGhpcy5kcm9wQ29udGFpbmVyICYmIHRoaXMuZHJvcENvbnRhaW5lci5kaXNhYmxlZCk7XG4gIH1cbiAgc2V0IGRpc2FibGVkKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5fZGlzYWJsZWQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICAgIHRoaXMuX2RyYWdSZWYuZGlzYWJsZWQgPSB0aGlzLl9kaXNhYmxlZDtcbiAgfVxuICBwcml2YXRlIF9kaXNhYmxlZDogYm9vbGVhbjtcblxuICAvKipcbiAgICogRnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB0byBjdXN0b21pemUgdGhlIGxvZ2ljIG9mIGhvdyB0aGUgcG9zaXRpb24gb2YgdGhlIGRyYWcgaXRlbVxuICAgKiBpcyBsaW1pdGVkIHdoaWxlIGl0J3MgYmVpbmcgZHJhZ2dlZC4gR2V0cyBjYWxsZWQgd2l0aCBhIHBvaW50IGNvbnRhaW5pbmcgdGhlIGN1cnJlbnQgcG9zaXRpb25cbiAgICogb2YgdGhlIHVzZXIncyBwb2ludGVyIG9uIHRoZSBwYWdlIGFuZCBzaG91bGQgcmV0dXJuIGEgcG9pbnQgZGVzY3JpYmluZyB3aGVyZSB0aGUgaXRlbSBzaG91bGRcbiAgICogYmUgcmVuZGVyZWQuXG4gICAqL1xuICBASW5wdXQoJ2Nka0RyYWdDb25zdHJhaW5Qb3NpdGlvbicpIGNvbnN0cmFpblBvc2l0aW9uPzogKHBvaW50OiBQb2ludCwgZHJhZ1JlZjogRHJhZ1JlZikgPT4gUG9pbnQ7XG5cbiAgLyoqIENsYXNzIHRvIGJlIGFkZGVkIHRvIHRoZSBwcmV2aWV3IGVsZW1lbnQuICovXG4gIEBJbnB1dCgnY2RrRHJhZ1ByZXZpZXdDbGFzcycpIHByZXZpZXdDbGFzczogc3RyaW5nIHwgc3RyaW5nW107XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgc3RhcnRzIGRyYWdnaW5nIHRoZSBpdGVtLiAqL1xuICBAT3V0cHV0KCdjZGtEcmFnU3RhcnRlZCcpIHN0YXJ0ZWQ6IEV2ZW50RW1pdHRlcjxDZGtEcmFnU3RhcnQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnU3RhcnQ+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgaGFzIHJlbGVhc2VkIGEgZHJhZyBpdGVtLCBiZWZvcmUgYW55IGFuaW1hdGlvbnMgaGF2ZSBzdGFydGVkLiAqL1xuICBAT3V0cHV0KCdjZGtEcmFnUmVsZWFzZWQnKSByZWxlYXNlZDogRXZlbnRFbWl0dGVyPENka0RyYWdSZWxlYXNlPiA9XG4gICAgICBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdSZWxlYXNlPigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHN0b3BzIGRyYWdnaW5nIGFuIGl0ZW0gaW4gdGhlIGNvbnRhaW5lci4gKi9cbiAgQE91dHB1dCgnY2RrRHJhZ0VuZGVkJykgZW5kZWQ6IEV2ZW50RW1pdHRlcjxDZGtEcmFnRW5kPiA9IG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0VuZD4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBoYXMgbW92ZWQgdGhlIGl0ZW0gaW50byBhIG5ldyBjb250YWluZXIuICovXG4gIEBPdXRwdXQoJ2Nka0RyYWdFbnRlcmVkJykgZW50ZXJlZDogRXZlbnRFbWl0dGVyPENka0RyYWdFbnRlcjxhbnk+PiA9XG4gICAgICBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdFbnRlcjxhbnk+PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHJlbW92ZXMgdGhlIGl0ZW0gaXRzIGNvbnRhaW5lciBieSBkcmFnZ2luZyBpdCBpbnRvIGFub3RoZXIgY29udGFpbmVyLiAqL1xuICBAT3V0cHV0KCdjZGtEcmFnRXhpdGVkJykgZXhpdGVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0V4aXQ8YW55Pj4gPVxuICAgICAgbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnRXhpdDxhbnk+PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGRyb3BzIHRoZSBpdGVtIGluc2lkZSBhIGNvbnRhaW5lci4gKi9cbiAgQE91dHB1dCgnY2RrRHJhZ0Ryb3BwZWQnKSBkcm9wcGVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0Ryb3A8YW55Pj4gPVxuICAgICAgbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnRHJvcDxhbnk+PigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyBhcyB0aGUgdXNlciBpcyBkcmFnZ2luZyB0aGUgaXRlbS4gVXNlIHdpdGggY2F1dGlvbixcbiAgICogYmVjYXVzZSB0aGlzIGV2ZW50IHdpbGwgZmlyZSBmb3IgZXZlcnkgcGl4ZWwgdGhhdCB0aGUgdXNlciBoYXMgZHJhZ2dlZC5cbiAgICovXG4gIEBPdXRwdXQoJ2Nka0RyYWdNb3ZlZCcpIG1vdmVkOiBPYnNlcnZhYmxlPENka0RyYWdNb3ZlPFQ+PiA9XG4gICAgICBuZXcgT2JzZXJ2YWJsZSgob2JzZXJ2ZXI6IE9ic2VydmVyPENka0RyYWdNb3ZlPFQ+PikgPT4ge1xuICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSB0aGlzLl9kcmFnUmVmLm1vdmVkLnBpcGUobWFwKG1vdmVkRXZlbnQgPT4gKHtcbiAgICAgICAgICBzb3VyY2U6IHRoaXMsXG4gICAgICAgICAgcG9pbnRlclBvc2l0aW9uOiBtb3ZlZEV2ZW50LnBvaW50ZXJQb3NpdGlvbixcbiAgICAgICAgICBldmVudDogbW92ZWRFdmVudC5ldmVudCxcbiAgICAgICAgICBkZWx0YTogbW92ZWRFdmVudC5kZWx0YSxcbiAgICAgICAgICBkaXN0YW5jZTogbW92ZWRFdmVudC5kaXN0YW5jZVxuICAgICAgICB9KSkpLnN1YnNjcmliZShvYnNlcnZlcik7XG5cbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgLyoqIEVsZW1lbnQgdGhhdCB0aGUgZHJhZ2dhYmxlIGlzIGF0dGFjaGVkIHRvLiAqL1xuICAgICAgcHVibGljIGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgICAgLyoqIERyb3BwYWJsZSBjb250YWluZXIgdGhhdCB0aGUgZHJhZ2dhYmxlIGlzIGEgcGFydCBvZi4gKi9cbiAgICAgIEBJbmplY3QoQ0RLX0RST1BfTElTVCkgQE9wdGlvbmFsKCkgQFNraXBTZWxmKCkgcHVibGljIGRyb3BDb250YWluZXI6IENka0Ryb3BMaXN0LFxuICAgICAgQEluamVjdChET0NVTUVOVCkgcHJpdmF0ZSBfZG9jdW1lbnQ6IGFueSwgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgICBwcml2YXRlIF92aWV3Q29udGFpbmVyUmVmOiBWaWV3Q29udGFpbmVyUmVmLFxuICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChDREtfRFJBR19DT05GSUcpIGNvbmZpZzogRHJhZ0Ryb3BDb25maWcsXG4gICAgICBAT3B0aW9uYWwoKSBwcml2YXRlIF9kaXI6IERpcmVjdGlvbmFsaXR5LCBkcmFnRHJvcDogRHJhZ0Ryb3AsXG4gICAgICBwcml2YXRlIF9jaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYpIHtcbiAgICB0aGlzLl9kcmFnUmVmID0gZHJhZ0Ryb3AuY3JlYXRlRHJhZyhlbGVtZW50LCB7XG4gICAgICBkcmFnU3RhcnRUaHJlc2hvbGQ6IGNvbmZpZyAmJiBjb25maWcuZHJhZ1N0YXJ0VGhyZXNob2xkICE9IG51bGwgP1xuICAgICAgICAgIGNvbmZpZy5kcmFnU3RhcnRUaHJlc2hvbGQgOiA1LFxuICAgICAgcG9pbnRlckRpcmVjdGlvbkNoYW5nZVRocmVzaG9sZDogY29uZmlnICYmIGNvbmZpZy5wb2ludGVyRGlyZWN0aW9uQ2hhbmdlVGhyZXNob2xkICE9IG51bGwgP1xuICAgICAgICAgIGNvbmZpZy5wb2ludGVyRGlyZWN0aW9uQ2hhbmdlVGhyZXNob2xkIDogNVxuICAgIH0pO1xuICAgIHRoaXMuX2RyYWdSZWYuZGF0YSA9IHRoaXM7XG5cbiAgICBpZiAoY29uZmlnKSB7XG4gICAgICB0aGlzLl9hc3NpZ25EZWZhdWx0cyhjb25maWcpO1xuICAgIH1cblxuICAgIC8vIE5vdGUgdGhhdCB1c3VhbGx5IHRoZSBjb250YWluZXIgaXMgYXNzaWduZWQgd2hlbiB0aGUgZHJvcCBsaXN0IGlzIHBpY2tzIHVwIHRoZSBpdGVtLCBidXQgaW5cbiAgICAvLyBzb21lIGNhc2VzIChtYWlubHkgdHJhbnNwbGFudGVkIHZpZXdzIHdpdGggT25QdXNoLCBzZWUgIzE4MzQxKSB3ZSBtYXkgZW5kIHVwIGluIGEgc2l0dWF0aW9uXG4gICAgLy8gd2hlcmUgdGhlcmUgYXJlIG5vIGl0ZW1zIG9uIHRoZSBmaXJzdCBjaGFuZ2UgZGV0ZWN0aW9uIHBhc3MsIGJ1dCB0aGUgaXRlbXMgZ2V0IHBpY2tlZCB1cCBhc1xuICAgIC8vIHNvb24gYXMgdGhlIHVzZXIgdHJpZ2dlcnMgYW5vdGhlciBwYXNzIGJ5IGRyYWdnaW5nLiBUaGlzIGlzIGEgcHJvYmxlbSwgYmVjYXVzZSB0aGUgaXRlbSB3b3VsZFxuICAgIC8vIGhhdmUgdG8gc3dpdGNoIGZyb20gc3RhbmRhbG9uZSBtb2RlIHRvIGRyYWcgbW9kZSBpbiB0aGUgbWlkZGxlIG9mIHRoZSBkcmFnZ2luZyBzZXF1ZW5jZSB3aGljaFxuICAgIC8vIGlzIHRvbyBsYXRlIHNpbmNlIHRoZSB0d28gbW9kZXMgc2F2ZSBkaWZmZXJlbnQga2luZHMgb2YgaW5mb3JtYXRpb24uIFdlIHdvcmsgYXJvdW5kIGl0IGJ5XG4gICAgLy8gYXNzaWduaW5nIHRoZSBkcm9wIGNvbnRhaW5lciBib3RoIGZyb20gaGVyZSBhbmQgdGhlIGxpc3QuXG4gICAgaWYgKGRyb3BDb250YWluZXIpIHtcbiAgICAgIHRoaXMuX2RyYWdSZWYuX3dpdGhEcm9wQ29udGFpbmVyKGRyb3BDb250YWluZXIuX2Ryb3BMaXN0UmVmKTtcbiAgICAgIGRyb3BDb250YWluZXIuYWRkSXRlbSh0aGlzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9zeW5jSW5wdXRzKHRoaXMuX2RyYWdSZWYpO1xuICAgIHRoaXMuX2hhbmRsZUV2ZW50cyh0aGlzLl9kcmFnUmVmKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBlbGVtZW50IHRoYXQgaXMgYmVpbmcgdXNlZCBhcyBhIHBsYWNlaG9sZGVyXG4gICAqIHdoaWxlIHRoZSBjdXJyZW50IGVsZW1lbnQgaXMgYmVpbmcgZHJhZ2dlZC5cbiAgICovXG4gIGdldFBsYWNlaG9sZGVyRWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX2RyYWdSZWYuZ2V0UGxhY2Vob2xkZXJFbGVtZW50KCk7XG4gIH1cblxuICAvKiogUmV0dXJucyB0aGUgcm9vdCBkcmFnZ2FibGUgZWxlbWVudC4gKi9cbiAgZ2V0Um9vdEVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLl9kcmFnUmVmLmdldFJvb3RFbGVtZW50KCk7XG4gIH1cblxuICAvKiogUmVzZXRzIGEgc3RhbmRhbG9uZSBkcmFnIGl0ZW0gdG8gaXRzIGluaXRpYWwgcG9zaXRpb24uICovXG4gIHJlc2V0KCk6IHZvaWQge1xuICAgIHRoaXMuX2RyYWdSZWYucmVzZXQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBwaXhlbCBjb29yZGluYXRlcyBvZiB0aGUgZHJhZ2dhYmxlIG91dHNpZGUgb2YgYSBkcm9wIGNvbnRhaW5lci5cbiAgICovXG4gIGdldEZyZWVEcmFnUG9zaXRpb24oKToge3JlYWRvbmx5IHg6IG51bWJlciwgcmVhZG9ubHkgeTogbnVtYmVyfSB7XG4gICAgcmV0dXJuIHRoaXMuX2RyYWdSZWYuZ2V0RnJlZURyYWdQb3NpdGlvbigpO1xuICB9XG5cbiAgbmdBZnRlclZpZXdJbml0KCkge1xuICAgIC8vIFdlIG5lZWQgdG8gd2FpdCBmb3IgdGhlIHpvbmUgdG8gc3RhYmlsaXplLCBpbiBvcmRlciBmb3IgdGhlIHJlZmVyZW5jZVxuICAgIC8vIGVsZW1lbnQgdG8gYmUgaW4gdGhlIHByb3BlciBwbGFjZSBpbiB0aGUgRE9NLiBUaGlzIGlzIG1vc3RseSByZWxldmFudFxuICAgIC8vIGZvciBkcmFnZ2FibGUgZWxlbWVudHMgaW5zaWRlIHBvcnRhbHMgc2luY2UgdGhleSBnZXQgc3RhbXBlZCBvdXQgaW5cbiAgICAvLyB0aGVpciBvcmlnaW5hbCBET00gcG9zaXRpb24gYW5kIHRoZW4gdGhleSBnZXQgdHJhbnNmZXJyZWQgdG8gdGhlIHBvcnRhbC5cbiAgICB0aGlzLl9uZ1pvbmUub25TdGFibGUuYXNPYnNlcnZhYmxlKClcbiAgICAgIC5waXBlKHRha2UoMSksIHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpKVxuICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZVJvb3RFbGVtZW50KCk7XG5cbiAgICAgICAgLy8gTGlzdGVuIGZvciBhbnkgbmV3bHktYWRkZWQgaGFuZGxlcy5cbiAgICAgICAgdGhpcy5faGFuZGxlcy5jaGFuZ2VzLnBpcGUoXG4gICAgICAgICAgc3RhcnRXaXRoKHRoaXMuX2hhbmRsZXMpLFxuICAgICAgICAgIC8vIFN5bmMgdGhlIG5ldyBoYW5kbGVzIHdpdGggdGhlIERyYWdSZWYuXG4gICAgICAgICAgdGFwKChoYW5kbGVzOiBRdWVyeUxpc3Q8Q2RrRHJhZ0hhbmRsZT4pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNoaWxkSGFuZGxlRWxlbWVudHMgPSBoYW5kbGVzXG4gICAgICAgICAgICAgIC5maWx0ZXIoaGFuZGxlID0+IGhhbmRsZS5fcGFyZW50RHJhZyA9PT0gdGhpcylcbiAgICAgICAgICAgICAgLm1hcChoYW5kbGUgPT4gaGFuZGxlLmVsZW1lbnQpO1xuICAgICAgICAgICAgdGhpcy5fZHJhZ1JlZi53aXRoSGFuZGxlcyhjaGlsZEhhbmRsZUVsZW1lbnRzKTtcbiAgICAgICAgICB9KSxcbiAgICAgICAgICAvLyBMaXN0ZW4gaWYgdGhlIHN0YXRlIG9mIGFueSBvZiB0aGUgaGFuZGxlcyBjaGFuZ2VzLlxuICAgICAgICAgIHN3aXRjaE1hcCgoaGFuZGxlczogUXVlcnlMaXN0PENka0RyYWdIYW5kbGU+KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbWVyZ2UoLi4uaGFuZGxlcy5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiBpdGVtLl9zdGF0ZUNoYW5nZXMucGlwZShzdGFydFdpdGgoaXRlbSkpO1xuICAgICAgICAgICAgfSkpIGFzIE9ic2VydmFibGU8Q2RrRHJhZ0hhbmRsZT47XG4gICAgICAgICAgfSksXG4gICAgICAgICAgdGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZClcbiAgICAgICAgKS5zdWJzY3JpYmUoaGFuZGxlSW5zdGFuY2UgPT4ge1xuICAgICAgICAgIC8vIEVuYWJsZWQvZGlzYWJsZSB0aGUgaGFuZGxlIHRoYXQgY2hhbmdlZCBpbiB0aGUgRHJhZ1JlZi5cbiAgICAgICAgICBjb25zdCBkcmFnUmVmID0gdGhpcy5fZHJhZ1JlZjtcbiAgICAgICAgICBjb25zdCBoYW5kbGUgPSBoYW5kbGVJbnN0YW5jZS5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQ7XG4gICAgICAgICAgaGFuZGxlSW5zdGFuY2UuZGlzYWJsZWQgPyBkcmFnUmVmLmRpc2FibGVIYW5kbGUoaGFuZGxlKSA6IGRyYWdSZWYuZW5hYmxlSGFuZGxlKGhhbmRsZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICh0aGlzLmZyZWVEcmFnUG9zaXRpb24pIHtcbiAgICAgICAgICB0aGlzLl9kcmFnUmVmLnNldEZyZWVEcmFnUG9zaXRpb24odGhpcy5mcmVlRHJhZ1Bvc2l0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKSB7XG4gICAgY29uc3Qgcm9vdFNlbGVjdG9yQ2hhbmdlID0gY2hhbmdlc1sncm9vdEVsZW1lbnRTZWxlY3RvciddO1xuICAgIGNvbnN0IHBvc2l0aW9uQ2hhbmdlID0gY2hhbmdlc1snZnJlZURyYWdQb3NpdGlvbiddO1xuXG4gICAgLy8gV2UgZG9uJ3QgaGF2ZSB0byByZWFjdCB0byB0aGUgZmlyc3QgY2hhbmdlIHNpbmNlIGl0J3MgYmVpbmdcbiAgICAvLyBoYW5kbGVkIGluIGBuZ0FmdGVyVmlld0luaXRgIHdoZXJlIGl0IG5lZWRzIHRvIGJlIGRlZmVycmVkLlxuICAgIGlmIChyb290U2VsZWN0b3JDaGFuZ2UgJiYgIXJvb3RTZWxlY3RvckNoYW5nZS5maXJzdENoYW5nZSkge1xuICAgICAgdGhpcy5fdXBkYXRlUm9vdEVsZW1lbnQoKTtcbiAgICB9XG5cbiAgICAvLyBTa2lwIHRoZSBmaXJzdCBjaGFuZ2Ugc2luY2UgaXQncyBiZWluZyBoYW5kbGVkIGluIGBuZ0FmdGVyVmlld0luaXRgLlxuICAgIGlmIChwb3NpdGlvbkNoYW5nZSAmJiAhcG9zaXRpb25DaGFuZ2UuZmlyc3RDaGFuZ2UgJiYgdGhpcy5mcmVlRHJhZ1Bvc2l0aW9uKSB7XG4gICAgICB0aGlzLl9kcmFnUmVmLnNldEZyZWVEcmFnUG9zaXRpb24odGhpcy5mcmVlRHJhZ1Bvc2l0aW9uKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5kcm9wQ29udGFpbmVyKSB7XG4gICAgICB0aGlzLmRyb3BDb250YWluZXIucmVtb3ZlSXRlbSh0aGlzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9kZXN0cm95ZWQubmV4dCgpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX2RyYWdSZWYuZGlzcG9zZSgpO1xuICB9XG5cbiAgLyoqIFN5bmNzIHRoZSByb290IGVsZW1lbnQgd2l0aCB0aGUgYERyYWdSZWZgLiAqL1xuICBwcml2YXRlIF91cGRhdGVSb290RWxlbWVudCgpIHtcbiAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQ7XG4gICAgY29uc3Qgcm9vdEVsZW1lbnQgPSB0aGlzLnJvb3RFbGVtZW50U2VsZWN0b3IgP1xuICAgICAgICBnZXRDbG9zZXN0TWF0Y2hpbmdBbmNlc3RvcihlbGVtZW50LCB0aGlzLnJvb3RFbGVtZW50U2VsZWN0b3IpIDogZWxlbWVudDtcblxuICAgIGlmIChyb290RWxlbWVudCAmJiByb290RWxlbWVudC5ub2RlVHlwZSAhPT0gdGhpcy5fZG9jdW1lbnQuRUxFTUVOVF9OT0RFKSB7XG4gICAgICB0aHJvdyBFcnJvcihgY2RrRHJhZyBtdXN0IGJlIGF0dGFjaGVkIHRvIGFuIGVsZW1lbnQgbm9kZS4gYCArXG4gICAgICAgICAgICAgICAgICBgQ3VycmVudGx5IGF0dGFjaGVkIHRvIFwiJHtyb290RWxlbWVudC5ub2RlTmFtZX1cIi5gKTtcbiAgICB9XG5cbiAgICB0aGlzLl9kcmFnUmVmLndpdGhSb290RWxlbWVudChyb290RWxlbWVudCB8fCBlbGVtZW50KTtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBib3VuZGFyeSBlbGVtZW50LCBiYXNlZCBvbiB0aGUgYGJvdW5kYXJ5RWxlbWVudGAgdmFsdWUuICovXG4gIHByaXZhdGUgX2dldEJvdW5kYXJ5RWxlbWVudCgpIHtcbiAgICBjb25zdCBib3VuZGFyeSA9IHRoaXMuYm91bmRhcnlFbGVtZW50O1xuXG4gICAgaWYgKCFib3VuZGFyeSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBib3VuZGFyeSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiBnZXRDbG9zZXN0TWF0Y2hpbmdBbmNlc3Rvcih0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudCwgYm91bmRhcnkpO1xuICAgIH1cblxuICAgIGNvbnN0IGVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGJvdW5kYXJ5KTtcblxuICAgIGlmIChpc0Rldk1vZGUoKSAmJiAhZWxlbWVudC5jb250YWlucyh0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudCkpIHtcbiAgICAgIHRocm93IEVycm9yKCdEcmFnZ2FibGUgZWxlbWVudCBpcyBub3QgaW5zaWRlIG9mIHRoZSBub2RlIHBhc3NlZCBpbnRvIGNka0RyYWdCb3VuZGFyeS4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxuXG4gIC8qKiBTeW5jcyB0aGUgaW5wdXRzIG9mIHRoZSBDZGtEcmFnIHdpdGggdGhlIG9wdGlvbnMgb2YgdGhlIHVuZGVybHlpbmcgRHJhZ1JlZi4gKi9cbiAgcHJpdmF0ZSBfc3luY0lucHV0cyhyZWY6IERyYWdSZWY8Q2RrRHJhZzxUPj4pIHtcbiAgICByZWYuYmVmb3JlU3RhcnRlZC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgaWYgKCFyZWYuaXNEcmFnZ2luZygpKSB7XG4gICAgICAgIGNvbnN0IGRpciA9IHRoaXMuX2RpcjtcbiAgICAgICAgY29uc3QgZHJhZ1N0YXJ0RGVsYXkgPSB0aGlzLmRyYWdTdGFydERlbGF5O1xuICAgICAgICBjb25zdCBwbGFjZWhvbGRlciA9IHRoaXMuX3BsYWNlaG9sZGVyVGVtcGxhdGUgPyB7XG4gICAgICAgICAgdGVtcGxhdGU6IHRoaXMuX3BsYWNlaG9sZGVyVGVtcGxhdGUudGVtcGxhdGVSZWYsXG4gICAgICAgICAgY29udGV4dDogdGhpcy5fcGxhY2Vob2xkZXJUZW1wbGF0ZS5kYXRhLFxuICAgICAgICAgIHZpZXdDb250YWluZXI6IHRoaXMuX3ZpZXdDb250YWluZXJSZWZcbiAgICAgICAgfSA6IG51bGw7XG4gICAgICAgIGNvbnN0IHByZXZpZXcgPSB0aGlzLl9wcmV2aWV3VGVtcGxhdGUgPyB7XG4gICAgICAgICAgdGVtcGxhdGU6IHRoaXMuX3ByZXZpZXdUZW1wbGF0ZS50ZW1wbGF0ZVJlZixcbiAgICAgICAgICBjb250ZXh0OiB0aGlzLl9wcmV2aWV3VGVtcGxhdGUuZGF0YSxcbiAgICAgICAgICBtYXRjaFNpemU6IHRoaXMuX3ByZXZpZXdUZW1wbGF0ZS5tYXRjaFNpemUsXG4gICAgICAgICAgdmlld0NvbnRhaW5lcjogdGhpcy5fdmlld0NvbnRhaW5lclJlZlxuICAgICAgICB9IDogbnVsbDtcblxuICAgICAgICByZWYuZGlzYWJsZWQgPSB0aGlzLmRpc2FibGVkO1xuICAgICAgICByZWYubG9ja0F4aXMgPSB0aGlzLmxvY2tBeGlzO1xuICAgICAgICByZWYuZHJhZ1N0YXJ0RGVsYXkgPSAodHlwZW9mIGRyYWdTdGFydERlbGF5ID09PSAnb2JqZWN0JyAmJiBkcmFnU3RhcnREZWxheSkgP1xuICAgICAgICAgICAgZHJhZ1N0YXJ0RGVsYXkgOiBjb2VyY2VOdW1iZXJQcm9wZXJ0eShkcmFnU3RhcnREZWxheSk7XG4gICAgICAgIHJlZi5jb25zdHJhaW5Qb3NpdGlvbiA9IHRoaXMuY29uc3RyYWluUG9zaXRpb247XG4gICAgICAgIHJlZi5wcmV2aWV3Q2xhc3MgPSB0aGlzLnByZXZpZXdDbGFzcztcbiAgICAgICAgcmVmXG4gICAgICAgICAgLndpdGhCb3VuZGFyeUVsZW1lbnQodGhpcy5fZ2V0Qm91bmRhcnlFbGVtZW50KCkpXG4gICAgICAgICAgLndpdGhQbGFjZWhvbGRlclRlbXBsYXRlKHBsYWNlaG9sZGVyKVxuICAgICAgICAgIC53aXRoUHJldmlld1RlbXBsYXRlKHByZXZpZXcpO1xuXG4gICAgICAgIGlmIChkaXIpIHtcbiAgICAgICAgICByZWYud2l0aERpcmVjdGlvbihkaXIudmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKiogSGFuZGxlcyB0aGUgZXZlbnRzIGZyb20gdGhlIHVuZGVybHlpbmcgYERyYWdSZWZgLiAqL1xuICBwcml2YXRlIF9oYW5kbGVFdmVudHMocmVmOiBEcmFnUmVmPENka0RyYWc8VD4+KSB7XG4gICAgcmVmLnN0YXJ0ZWQuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIHRoaXMuc3RhcnRlZC5lbWl0KHtzb3VyY2U6IHRoaXN9KTtcblxuICAgICAgLy8gU2luY2UgYWxsIG9mIHRoZXNlIGV2ZW50cyBydW4gb3V0c2lkZSBvZiBjaGFuZ2UgZGV0ZWN0aW9uLFxuICAgICAgLy8gd2UgbmVlZCB0byBlbnN1cmUgdGhhdCBldmVyeXRoaW5nIGlzIG1hcmtlZCBjb3JyZWN0bHkuXG4gICAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgICB9KTtcblxuICAgIHJlZi5yZWxlYXNlZC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgdGhpcy5yZWxlYXNlZC5lbWl0KHtzb3VyY2U6IHRoaXN9KTtcbiAgICB9KTtcblxuICAgIHJlZi5lbmRlZC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgdGhpcy5lbmRlZC5lbWl0KHtzb3VyY2U6IHRoaXMsIGRpc3RhbmNlOiBldmVudC5kaXN0YW5jZX0pO1xuXG4gICAgICAvLyBTaW5jZSBhbGwgb2YgdGhlc2UgZXZlbnRzIHJ1biBvdXRzaWRlIG9mIGNoYW5nZSBkZXRlY3Rpb24sXG4gICAgICAvLyB3ZSBuZWVkIHRvIGVuc3VyZSB0aGF0IGV2ZXJ5dGhpbmcgaXMgbWFya2VkIGNvcnJlY3RseS5cbiAgICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICAgIH0pO1xuXG4gICAgcmVmLmVudGVyZWQuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgIHRoaXMuZW50ZXJlZC5lbWl0KHtcbiAgICAgICAgY29udGFpbmVyOiBldmVudC5jb250YWluZXIuZGF0YSxcbiAgICAgICAgaXRlbTogdGhpcyxcbiAgICAgICAgY3VycmVudEluZGV4OiBldmVudC5jdXJyZW50SW5kZXhcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmVmLmV4aXRlZC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgdGhpcy5leGl0ZWQuZW1pdCh7XG4gICAgICAgIGNvbnRhaW5lcjogZXZlbnQuY29udGFpbmVyLmRhdGEsXG4gICAgICAgIGl0ZW06IHRoaXNcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmVmLmRyb3BwZWQuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgIHRoaXMuZHJvcHBlZC5lbWl0KHtcbiAgICAgICAgcHJldmlvdXNJbmRleDogZXZlbnQucHJldmlvdXNJbmRleCxcbiAgICAgICAgY3VycmVudEluZGV4OiBldmVudC5jdXJyZW50SW5kZXgsXG4gICAgICAgIHByZXZpb3VzQ29udGFpbmVyOiBldmVudC5wcmV2aW91c0NvbnRhaW5lci5kYXRhLFxuICAgICAgICBjb250YWluZXI6IGV2ZW50LmNvbnRhaW5lci5kYXRhLFxuICAgICAgICBpc1BvaW50ZXJPdmVyQ29udGFpbmVyOiBldmVudC5pc1BvaW50ZXJPdmVyQ29udGFpbmVyLFxuICAgICAgICBpdGVtOiB0aGlzLFxuICAgICAgICBkaXN0YW5jZTogZXZlbnQuZGlzdGFuY2VcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIEFzc2lnbnMgdGhlIGRlZmF1bHQgaW5wdXQgdmFsdWVzIGJhc2VkIG9uIGEgcHJvdmlkZWQgY29uZmlnIG9iamVjdC4gKi9cbiAgcHJpdmF0ZSBfYXNzaWduRGVmYXVsdHMoY29uZmlnOiBEcmFnRHJvcENvbmZpZykge1xuICAgIGNvbnN0IHtcbiAgICAgIGxvY2tBeGlzLCBkcmFnU3RhcnREZWxheSwgY29uc3RyYWluUG9zaXRpb24sIHByZXZpZXdDbGFzcyxcbiAgICAgIGJvdW5kYXJ5RWxlbWVudCwgZHJhZ2dpbmdEaXNhYmxlZCwgcm9vdEVsZW1lbnRTZWxlY3RvclxuICAgIH0gPSBjb25maWc7XG5cbiAgICB0aGlzLmRpc2FibGVkID0gZHJhZ2dpbmdEaXNhYmxlZCA9PSBudWxsID8gZmFsc2UgOiBkcmFnZ2luZ0Rpc2FibGVkO1xuICAgIHRoaXMuZHJhZ1N0YXJ0RGVsYXkgPSBkcmFnU3RhcnREZWxheSB8fCAwO1xuXG4gICAgaWYgKGxvY2tBeGlzKSB7XG4gICAgICB0aGlzLmxvY2tBeGlzID0gbG9ja0F4aXM7XG4gICAgfVxuXG4gICAgaWYgKGNvbnN0cmFpblBvc2l0aW9uKSB7XG4gICAgICB0aGlzLmNvbnN0cmFpblBvc2l0aW9uID0gY29uc3RyYWluUG9zaXRpb247XG4gICAgfVxuXG4gICAgaWYgKHByZXZpZXdDbGFzcykge1xuICAgICAgdGhpcy5wcmV2aWV3Q2xhc3MgPSBwcmV2aWV3Q2xhc3M7XG4gICAgfVxuXG4gICAgaWYgKGJvdW5kYXJ5RWxlbWVudCkge1xuICAgICAgdGhpcy5ib3VuZGFyeUVsZW1lbnQgPSBib3VuZGFyeUVsZW1lbnQ7XG4gICAgfVxuXG4gICAgaWYgKHJvb3RFbGVtZW50U2VsZWN0b3IpIHtcbiAgICAgIHRoaXMucm9vdEVsZW1lbnRTZWxlY3RvciA9IHJvb3RFbGVtZW50U2VsZWN0b3I7XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2Rpc2FibGVkOiBCb29sZWFuSW5wdXQ7XG59XG5cbi8qKiBHZXRzIHRoZSBjbG9zZXN0IGFuY2VzdG9yIG9mIGFuIGVsZW1lbnQgdGhhdCBtYXRjaGVzIGEgc2VsZWN0b3IuICovXG5mdW5jdGlvbiBnZXRDbG9zZXN0TWF0Y2hpbmdBbmNlc3RvcihlbGVtZW50OiBIVE1MRWxlbWVudCwgc2VsZWN0b3I6IHN0cmluZykge1xuICBsZXQgY3VycmVudEVsZW1lbnQgPSBlbGVtZW50LnBhcmVudEVsZW1lbnQgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuXG4gIHdoaWxlIChjdXJyZW50RWxlbWVudCkge1xuICAgIC8vIElFIGRvZXNuJ3Qgc3VwcG9ydCBgbWF0Y2hlc2Agc28gd2UgaGF2ZSB0byBmYWxsIGJhY2sgdG8gYG1zTWF0Y2hlc1NlbGVjdG9yYC5cbiAgICBpZiAoY3VycmVudEVsZW1lbnQubWF0Y2hlcyA/IGN1cnJlbnRFbGVtZW50Lm1hdGNoZXMoc2VsZWN0b3IpIDpcbiAgICAgICAgKGN1cnJlbnRFbGVtZW50IGFzIGFueSkubXNNYXRjaGVzU2VsZWN0b3Ioc2VsZWN0b3IpKSB7XG4gICAgICByZXR1cm4gY3VycmVudEVsZW1lbnQ7XG4gICAgfVxuXG4gICAgY3VycmVudEVsZW1lbnQgPSBjdXJyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50O1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbiJdfQ==