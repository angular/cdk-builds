/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directionality } from '@angular/cdk/bidi';
import { DOCUMENT } from '@angular/common';
import { ContentChild, ContentChildren, Directive, ElementRef, EventEmitter, Inject, Input, NgZone, Optional, Output, QueryList, SkipSelf, ViewContainerRef, ChangeDetectorRef, Self, } from '@angular/core';
import { coerceBooleanProperty, coerceNumberProperty, coerceElement } from '@angular/cdk/coercion';
import { Observable, Subject, merge } from 'rxjs';
import { startWith, take, map, takeUntil, switchMap, tap } from 'rxjs/operators';
import { CDK_DRAG_HANDLE, CdkDragHandle } from './drag-handle';
import { CDK_DRAG_PLACEHOLDER, CdkDragPlaceholder } from './drag-placeholder';
import { CDK_DRAG_PREVIEW, CdkDragPreview } from './drag-preview';
import { CDK_DRAG_PARENT } from '../drag-parent';
import { CDK_DROP_LIST } from './drop-list';
import { DragDrop } from '../drag-drop';
import { CDK_DRAG_CONFIG } from './config';
import { assertElementNode } from './assertions';
/** Element that can be moved inside a CdkDropList container. */
export class CdkDrag {
    constructor(
    /** Element that the draggable is attached to. */
    element, 
    /** Droppable container that the draggable is a part of. */
    dropContainer, 
    /**
     * @deprecated `_document` parameter no longer being used and will be removed.
     * @breaking-change 12.0.0
     */
    _document, _ngZone, _viewContainerRef, config, _dir, dragDrop, _changeDetectorRef, _selfHandle) {
        this.element = element;
        this.dropContainer = dropContainer;
        this._ngZone = _ngZone;
        this._viewContainerRef = _viewContainerRef;
        this._dir = _dir;
        this._changeDetectorRef = _changeDetectorRef;
        this._selfHandle = _selfHandle;
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
        this.moved = new Observable((observer) => {
            const subscription = this._dragRef.moved.pipe(map(movedEvent => ({
                source: this,
                pointerPosition: movedEvent.pointerPosition,
                event: movedEvent.event,
                delta: movedEvent.delta,
                distance: movedEvent.distance
            }))).subscribe(observer);
            return () => {
                subscription.unsubscribe();
            };
        });
        this._dragRef = dragDrop.createDrag(element, {
            dragStartThreshold: config && config.dragStartThreshold != null ?
                config.dragStartThreshold : 5,
            pointerDirectionChangeThreshold: config && config.pointerDirectionChangeThreshold != null ?
                config.pointerDirectionChangeThreshold : 5,
            zIndex: config === null || config === void 0 ? void 0 : config.zIndex
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
    /** Whether starting to drag this element is disabled. */
    get disabled() {
        return this._disabled || (this.dropContainer && this.dropContainer.disabled);
    }
    set disabled(value) {
        this._disabled = coerceBooleanProperty(value);
        this._dragRef.disabled = this._disabled;
    }
    /**
     * Returns the element that is being used as a placeholder
     * while the current element is being dragged.
     */
    getPlaceholderElement() {
        return this._dragRef.getPlaceholderElement();
    }
    /** Returns the root draggable element. */
    getRootElement() {
        return this._dragRef.getRootElement();
    }
    /** Resets a standalone drag item to its initial position. */
    reset() {
        this._dragRef.reset();
    }
    /**
     * Gets the pixel coordinates of the draggable outside of a drop container.
     */
    getFreeDragPosition() {
        return this._dragRef.getFreeDragPosition();
    }
    ngAfterViewInit() {
        // We need to wait for the zone to stabilize, in order for the reference
        // element to be in the proper place in the DOM. This is mostly relevant
        // for draggable elements inside portals since they get stamped out in
        // their original DOM position and then they get transferred to the portal.
        this._ngZone.onStable
            .pipe(take(1), takeUntil(this._destroyed))
            .subscribe(() => {
            this._updateRootElement();
            // Listen for any newly-added handles.
            this._handles.changes.pipe(startWith(this._handles), 
            // Sync the new handles with the DragRef.
            tap((handles) => {
                const childHandleElements = handles
                    .filter(handle => handle._parentDrag === this)
                    .map(handle => handle.element);
                // Usually handles are only allowed to be a descendant of the drag element, but if
                // the consumer defined a different drag root, we should allow the drag element
                // itself to be a handle too.
                if (this._selfHandle && this.rootElementSelector) {
                    childHandleElements.push(this.element);
                }
                this._dragRef.withHandles(childHandleElements);
            }), 
            // Listen if the state of any of the handles changes.
            switchMap((handles) => {
                return merge(...handles.map(item => {
                    return item._stateChanges.pipe(startWith(item));
                }));
            }), takeUntil(this._destroyed)).subscribe(handleInstance => {
                // Enabled/disable the handle that changed in the DragRef.
                const dragRef = this._dragRef;
                const handle = handleInstance.element.nativeElement;
                handleInstance.disabled ? dragRef.disableHandle(handle) : dragRef.enableHandle(handle);
            });
            if (this.freeDragPosition) {
                this._dragRef.setFreeDragPosition(this.freeDragPosition);
            }
        });
    }
    ngOnChanges(changes) {
        const rootSelectorChange = changes['rootElementSelector'];
        const positionChange = changes['freeDragPosition'];
        // We don't have to react to the first change since it's being
        // handled in `ngAfterViewInit` where it needs to be deferred.
        if (rootSelectorChange && !rootSelectorChange.firstChange) {
            this._updateRootElement();
        }
        // Skip the first change since it's being handled in `ngAfterViewInit`.
        if (positionChange && !positionChange.firstChange && this.freeDragPosition) {
            this._dragRef.setFreeDragPosition(this.freeDragPosition);
        }
    }
    ngOnDestroy() {
        if (this.dropContainer) {
            this.dropContainer.removeItem(this);
        }
        this._destroyed.next();
        this._destroyed.complete();
        this._dragRef.dispose();
    }
    /** Syncs the root element with the `DragRef`. */
    _updateRootElement() {
        const element = this.element.nativeElement;
        const rootElement = this.rootElementSelector ?
            getClosestMatchingAncestor(element, this.rootElementSelector) : element;
        if (rootElement && (typeof ngDevMode === 'undefined' || ngDevMode)) {
            assertElementNode(rootElement, 'cdkDrag');
        }
        this._dragRef.withRootElement(rootElement || element);
    }
    /** Gets the boundary element, based on the `boundaryElement` value. */
    _getBoundaryElement() {
        const boundary = this.boundaryElement;
        if (!boundary) {
            return null;
        }
        if (typeof boundary === 'string') {
            return getClosestMatchingAncestor(this.element.nativeElement, boundary);
        }
        const element = coerceElement(boundary);
        if ((typeof ngDevMode === 'undefined' || ngDevMode) &&
            !element.contains(this.element.nativeElement)) {
            throw Error('Draggable element is not inside of the node passed into cdkDragBoundary.');
        }
        return element;
    }
    /** Syncs the inputs of the CdkDrag with the options of the underlying DragRef. */
    _syncInputs(ref) {
        ref.beforeStarted.subscribe(() => {
            if (!ref.isDragging()) {
                const dir = this._dir;
                const dragStartDelay = this.dragStartDelay;
                const placeholder = this._placeholderTemplate ? {
                    template: this._placeholderTemplate.templateRef,
                    context: this._placeholderTemplate.data,
                    viewContainer: this._viewContainerRef
                } : null;
                const preview = this._previewTemplate ? {
                    template: this._previewTemplate.templateRef,
                    context: this._previewTemplate.data,
                    matchSize: this._previewTemplate.matchSize,
                    viewContainer: this._viewContainerRef
                } : null;
                ref.disabled = this.disabled;
                ref.lockAxis = this.lockAxis;
                ref.dragStartDelay = (typeof dragStartDelay === 'object' && dragStartDelay) ?
                    dragStartDelay : coerceNumberProperty(dragStartDelay);
                ref.constrainPosition = this.constrainPosition;
                ref.previewClass = this.previewClass;
                ref
                    .withBoundaryElement(this._getBoundaryElement())
                    .withPlaceholderTemplate(placeholder)
                    .withPreviewTemplate(preview);
                if (dir) {
                    ref.withDirection(dir.value);
                }
            }
        });
    }
    /** Handles the events from the underlying `DragRef`. */
    _handleEvents(ref) {
        ref.started.subscribe(() => {
            this.started.emit({ source: this });
            // Since all of these events run outside of change detection,
            // we need to ensure that everything is marked correctly.
            this._changeDetectorRef.markForCheck();
        });
        ref.released.subscribe(() => {
            this.released.emit({ source: this });
        });
        ref.ended.subscribe(event => {
            this.ended.emit({ source: this, distance: event.distance });
            // Since all of these events run outside of change detection,
            // we need to ensure that everything is marked correctly.
            this._changeDetectorRef.markForCheck();
        });
        ref.entered.subscribe(event => {
            this.entered.emit({
                container: event.container.data,
                item: this,
                currentIndex: event.currentIndex
            });
        });
        ref.exited.subscribe(event => {
            this.exited.emit({
                container: event.container.data,
                item: this
            });
        });
        ref.dropped.subscribe(event => {
            this.dropped.emit({
                previousIndex: event.previousIndex,
                currentIndex: event.currentIndex,
                previousContainer: event.previousContainer.data,
                container: event.container.data,
                isPointerOverContainer: event.isPointerOverContainer,
                item: this,
                distance: event.distance
            });
        });
    }
    /** Assigns the default input values based on a provided config object. */
    _assignDefaults(config) {
        const { lockAxis, dragStartDelay, constrainPosition, previewClass, boundaryElement, draggingDisabled, rootElementSelector } = config;
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
    }
}
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
CdkDrag.ctorParameters = () => [
    { type: ElementRef },
    { type: undefined, decorators: [{ type: Inject, args: [CDK_DROP_LIST,] }, { type: Optional }, { type: SkipSelf }] },
    { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] },
    { type: NgZone },
    { type: ViewContainerRef },
    { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [CDK_DRAG_CONFIG,] }] },
    { type: Directionality, decorators: [{ type: Optional }] },
    { type: DragDrop },
    { type: ChangeDetectorRef },
    { type: CdkDragHandle, decorators: [{ type: Optional }, { type: Self }, { type: Inject, args: [CDK_DRAG_HANDLE,] }] }
];
CdkDrag.propDecorators = {
    _handles: [{ type: ContentChildren, args: [CDK_DRAG_HANDLE, { descendants: true },] }],
    _previewTemplate: [{ type: ContentChild, args: [CDK_DRAG_PREVIEW,] }],
    _placeholderTemplate: [{ type: ContentChild, args: [CDK_DRAG_PLACEHOLDER,] }],
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
/** Gets the closest ancestor of an element that matches a selector. */
function getClosestMatchingAncestor(element, selector) {
    let currentElement = element.parentElement;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2RpcmVjdGl2ZXMvZHJhZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFFTCxZQUFZLEVBQ1osZUFBZSxFQUNmLFNBQVMsRUFDVCxVQUFVLEVBQ1YsWUFBWSxFQUNaLE1BQU0sRUFDTixLQUFLLEVBQ0wsTUFBTSxFQUVOLFFBQVEsRUFDUixNQUFNLEVBQ04sU0FBUyxFQUNULFFBQVEsRUFDUixnQkFBZ0IsRUFHaEIsaUJBQWlCLEVBQ2pCLElBQUksR0FDTCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQ0wscUJBQXFCLEVBQ3JCLG9CQUFvQixFQUNwQixhQUFhLEVBRWQsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQUMsVUFBVSxFQUFZLE9BQU8sRUFBRSxLQUFLLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDMUQsT0FBTyxFQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFVL0UsT0FBTyxFQUFDLGVBQWUsRUFBRSxhQUFhLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDN0QsT0FBTyxFQUFDLG9CQUFvQixFQUFFLGtCQUFrQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDNUUsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGNBQWMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ2hFLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUUvQyxPQUFPLEVBQUMsYUFBYSxFQUFxQyxNQUFNLGFBQWEsQ0FBQztB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QUFJLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUMxRCxjQUFzQixDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ3ZELE9BQU8sY0FBYyxDQUFDO1NBQ3ZCO1FBRUQsY0FBYyxHQUFHLGNBQWMsQ0FBQyxhQUFhLENBQUM7S0FDL0M7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7XG4gIEFmdGVyVmlld0luaXQsXG4gIENvbnRlbnRDaGlsZCxcbiAgQ29udGVudENoaWxkcmVuLFxuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5qZWN0LFxuICBJbnB1dCxcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIE9wdGlvbmFsLFxuICBPdXRwdXQsXG4gIFF1ZXJ5TGlzdCxcbiAgU2tpcFNlbGYsXG4gIFZpZXdDb250YWluZXJSZWYsXG4gIE9uQ2hhbmdlcyxcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIFNlbGYsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtcbiAgY29lcmNlQm9vbGVhblByb3BlcnR5LFxuICBjb2VyY2VOdW1iZXJQcm9wZXJ0eSxcbiAgY29lcmNlRWxlbWVudCxcbiAgQm9vbGVhbklucHV0XG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge09ic2VydmFibGUsIE9ic2VydmVyLCBTdWJqZWN0LCBtZXJnZX0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3N0YXJ0V2l0aCwgdGFrZSwgbWFwLCB0YWtlVW50aWwsIHN3aXRjaE1hcCwgdGFwfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge1xuICBDZGtEcmFnRHJvcCxcbiAgQ2RrRHJhZ0VuZCxcbiAgQ2RrRHJhZ0VudGVyLFxuICBDZGtEcmFnRXhpdCxcbiAgQ2RrRHJhZ01vdmUsXG4gIENka0RyYWdTdGFydCxcbiAgQ2RrRHJhZ1JlbGVhc2UsXG59IGZyb20gJy4uL2RyYWctZXZlbnRzJztcbmltcG9ydCB7Q0RLX0RSQUdfSEFORExFLCBDZGtEcmFnSGFuZGxlfSBmcm9tICcuL2RyYWctaGFuZGxlJztcbmltcG9ydCB7Q0RLX0RSQUdfUExBQ0VIT0xERVIsIENka0RyYWdQbGFjZWhvbGRlcn0gZnJvbSAnLi9kcmFnLXBsYWNlaG9sZGVyJztcbmltcG9ydCB7Q0RLX0RSQUdfUFJFVklFVywgQ2RrRHJhZ1ByZXZpZXd9IGZyb20gJy4vZHJhZy1wcmV2aWV3JztcbmltcG9ydCB7Q0RLX0RSQUdfUEFSRU5UfSBmcm9tICcuLi9kcmFnLXBhcmVudCc7XG5pbXBvcnQge0RyYWdSZWYsIFBvaW50fSBmcm9tICcuLi9kcmFnLXJlZic7XG5pbXBvcnQge0NES19EUk9QX0xJU1QsIENka0Ryb3BMaXN0SW50ZXJuYWwgYXMgQ2RrRHJvcExpc3R9IGZyb20gJy4vZHJvcC1saXN0JztcbmltcG9ydCB7RHJhZ0Ryb3B9IGZyb20gJy4uL2RyYWctZHJvcCc7XG5pbXBvcnQge0NES19EUkFHX0NPTkZJRywgRHJhZ0Ryb3BDb25maWcsIERyYWdTdGFydERlbGF5LCBEcmFnQXhpc30gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IHthc3NlcnRFbGVtZW50Tm9kZX0gZnJvbSAnLi9hc3NlcnRpb25zJztcblxuLyoqIEVsZW1lbnQgdGhhdCBjYW4gYmUgbW92ZWQgaW5zaWRlIGEgQ2RrRHJvcExpc3QgY29udGFpbmVyLiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka0RyYWddJyxcbiAgZXhwb3J0QXM6ICdjZGtEcmFnJyxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstZHJhZycsXG4gICAgJ1tjbGFzcy5jZGstZHJhZy1kaXNhYmxlZF0nOiAnZGlzYWJsZWQnLFxuICAgICdbY2xhc3MuY2RrLWRyYWctZHJhZ2dpbmddJzogJ19kcmFnUmVmLmlzRHJhZ2dpbmcoKScsXG4gIH0sXG4gIHByb3ZpZGVyczogW3twcm92aWRlOiBDREtfRFJBR19QQVJFTlQsIHVzZUV4aXN0aW5nOiBDZGtEcmFnfV1cbn0pXG5leHBvcnQgY2xhc3MgQ2RrRHJhZzxUID0gYW55PiBpbXBsZW1lbnRzIEFmdGVyVmlld0luaXQsIE9uQ2hhbmdlcywgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSBfZGVzdHJveWVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSB1bmRlcmx5aW5nIGRyYWcgaW5zdGFuY2UuICovXG4gIF9kcmFnUmVmOiBEcmFnUmVmPENka0RyYWc8VD4+O1xuXG4gIC8qKiBFbGVtZW50cyB0aGF0IGNhbiBiZSB1c2VkIHRvIGRyYWcgdGhlIGRyYWdnYWJsZSBpdGVtLiAqL1xuICBAQ29udGVudENoaWxkcmVuKENES19EUkFHX0hBTkRMRSwge2Rlc2NlbmRhbnRzOiB0cnVlfSkgX2hhbmRsZXM6IFF1ZXJ5TGlzdDxDZGtEcmFnSGFuZGxlPjtcblxuICAvKiogRWxlbWVudCB0aGF0IHdpbGwgYmUgdXNlZCBhcyBhIHRlbXBsYXRlIHRvIGNyZWF0ZSB0aGUgZHJhZ2dhYmxlIGl0ZW0ncyBwcmV2aWV3LiAqL1xuICBAQ29udGVudENoaWxkKENES19EUkFHX1BSRVZJRVcpIF9wcmV2aWV3VGVtcGxhdGU6IENka0RyYWdQcmV2aWV3O1xuXG4gIC8qKiBUZW1wbGF0ZSBmb3IgcGxhY2Vob2xkZXIgZWxlbWVudCByZW5kZXJlZCB0byBzaG93IHdoZXJlIGEgZHJhZ2dhYmxlIHdvdWxkIGJlIGRyb3BwZWQuICovXG4gIEBDb250ZW50Q2hpbGQoQ0RLX0RSQUdfUExBQ0VIT0xERVIpIF9wbGFjZWhvbGRlclRlbXBsYXRlOiBDZGtEcmFnUGxhY2Vob2xkZXI7XG5cbiAgLyoqIEFyYml0cmFyeSBkYXRhIHRvIGF0dGFjaCB0byB0aGlzIGRyYWcgaW5zdGFuY2UuICovXG4gIEBJbnB1dCgnY2RrRHJhZ0RhdGEnKSBkYXRhOiBUO1xuXG4gIC8qKiBMb2NrcyB0aGUgcG9zaXRpb24gb2YgdGhlIGRyYWdnZWQgZWxlbWVudCBhbG9uZyB0aGUgc3BlY2lmaWVkIGF4aXMuICovXG4gIEBJbnB1dCgnY2RrRHJhZ0xvY2tBeGlzJykgbG9ja0F4aXM6IERyYWdBeGlzO1xuXG4gIC8qKlxuICAgKiBTZWxlY3RvciB0aGF0IHdpbGwgYmUgdXNlZCB0byBkZXRlcm1pbmUgdGhlIHJvb3QgZHJhZ2dhYmxlIGVsZW1lbnQsIHN0YXJ0aW5nIGZyb21cbiAgICogdGhlIGBjZGtEcmFnYCBlbGVtZW50IGFuZCBnb2luZyB1cCB0aGUgRE9NLiBQYXNzaW5nIGFuIGFsdGVybmF0ZSByb290IGVsZW1lbnQgaXMgdXNlZnVsXG4gICAqIHdoZW4gdHJ5aW5nIHRvIGVuYWJsZSBkcmFnZ2luZyBvbiBhbiBlbGVtZW50IHRoYXQgeW91IG1pZ2h0IG5vdCBoYXZlIGFjY2VzcyB0by5cbiAgICovXG4gIEBJbnB1dCgnY2RrRHJhZ1Jvb3RFbGVtZW50Jykgcm9vdEVsZW1lbnRTZWxlY3Rvcjogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBOb2RlIG9yIHNlbGVjdG9yIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGRldGVybWluZSB0aGUgZWxlbWVudCB0byB3aGljaCB0aGUgZHJhZ2dhYmxlJ3NcbiAgICogcG9zaXRpb24gd2lsbCBiZSBjb25zdHJhaW5lZC4gSWYgYSBzdHJpbmcgaXMgcGFzc2VkIGluLCBpdCdsbCBiZSB1c2VkIGFzIGEgc2VsZWN0b3IgdGhhdFxuICAgKiB3aWxsIGJlIG1hdGNoZWQgc3RhcnRpbmcgZnJvbSB0aGUgZWxlbWVudCdzIHBhcmVudCBhbmQgZ29pbmcgdXAgdGhlIERPTSB1bnRpbCBhIG1hdGNoXG4gICAqIGhhcyBiZWVuIGZvdW5kLlxuICAgKi9cbiAgQElucHV0KCdjZGtEcmFnQm91bmRhcnknKSBib3VuZGFyeUVsZW1lbnQ6IHN0cmluZyB8IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+IHwgSFRNTEVsZW1lbnQ7XG5cbiAgLyoqXG4gICAqIEFtb3VudCBvZiBtaWxsaXNlY29uZHMgdG8gd2FpdCBhZnRlciB0aGUgdXNlciBoYXMgcHV0IHRoZWlyXG4gICAqIHBvaW50ZXIgZG93biBiZWZvcmUgc3RhcnRpbmcgdG8gZHJhZyB0aGUgZWxlbWVudC5cbiAgICovXG4gIEBJbnB1dCgnY2RrRHJhZ1N0YXJ0RGVsYXknKSBkcmFnU3RhcnREZWxheTogRHJhZ1N0YXJ0RGVsYXk7XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHBvc2l0aW9uIG9mIGEgYENka0RyYWdgIHRoYXQgaXMgb3V0c2lkZSBvZiBhIGRyb3AgY29udGFpbmVyLlxuICAgKiBDYW4gYmUgdXNlZCB0byByZXN0b3JlIHRoZSBlbGVtZW50J3MgcG9zaXRpb24gZm9yIGEgcmV0dXJuaW5nIHVzZXIuXG4gICAqL1xuICBASW5wdXQoJ2Nka0RyYWdGcmVlRHJhZ1Bvc2l0aW9uJykgZnJlZURyYWdQb3NpdGlvbjoge3g6IG51bWJlciwgeTogbnVtYmVyfTtcblxuICAvKiogV2hldGhlciBzdGFydGluZyB0byBkcmFnIHRoaXMgZWxlbWVudCBpcyBkaXNhYmxlZC4gKi9cbiAgQElucHV0KCdjZGtEcmFnRGlzYWJsZWQnKVxuICBnZXQgZGlzYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2Rpc2FibGVkIHx8ICh0aGlzLmRyb3BDb250YWluZXIgJiYgdGhpcy5kcm9wQ29udGFpbmVyLmRpc2FibGVkKTtcbiAgfVxuICBzZXQgZGlzYWJsZWQodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9kaXNhYmxlZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gICAgdGhpcy5fZHJhZ1JlZi5kaXNhYmxlZCA9IHRoaXMuX2Rpc2FibGVkO1xuICB9XG4gIHByaXZhdGUgX2Rpc2FibGVkOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBGdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHRvIGN1c3RvbWl6ZSB0aGUgbG9naWMgb2YgaG93IHRoZSBwb3NpdGlvbiBvZiB0aGUgZHJhZyBpdGVtXG4gICAqIGlzIGxpbWl0ZWQgd2hpbGUgaXQncyBiZWluZyBkcmFnZ2VkLiBHZXRzIGNhbGxlZCB3aXRoIGEgcG9pbnQgY29udGFpbmluZyB0aGUgY3VycmVudCBwb3NpdGlvblxuICAgKiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgb24gdGhlIHBhZ2UgYW5kIHNob3VsZCByZXR1cm4gYSBwb2ludCBkZXNjcmliaW5nIHdoZXJlIHRoZSBpdGVtIHNob3VsZFxuICAgKiBiZSByZW5kZXJlZC5cbiAgICovXG4gIEBJbnB1dCgnY2RrRHJhZ0NvbnN0cmFpblBvc2l0aW9uJykgY29uc3RyYWluUG9zaXRpb24/OiAocG9pbnQ6IFBvaW50LCBkcmFnUmVmOiBEcmFnUmVmKSA9PiBQb2ludDtcblxuICAvKiogQ2xhc3MgdG8gYmUgYWRkZWQgdG8gdGhlIHByZXZpZXcgZWxlbWVudC4gKi9cbiAgQElucHV0KCdjZGtEcmFnUHJldmlld0NsYXNzJykgcHJldmlld0NsYXNzOiBzdHJpbmcgfCBzdHJpbmdbXTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBzdGFydHMgZHJhZ2dpbmcgdGhlIGl0ZW0uICovXG4gIEBPdXRwdXQoJ2Nka0RyYWdTdGFydGVkJykgc3RhcnRlZDogRXZlbnRFbWl0dGVyPENka0RyYWdTdGFydD4gPSBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdTdGFydD4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBoYXMgcmVsZWFzZWQgYSBkcmFnIGl0ZW0sIGJlZm9yZSBhbnkgYW5pbWF0aW9ucyBoYXZlIHN0YXJ0ZWQuICovXG4gIEBPdXRwdXQoJ2Nka0RyYWdSZWxlYXNlZCcpIHJlbGVhc2VkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ1JlbGVhc2U+ID1cbiAgICAgIG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ1JlbGVhc2U+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgc3RvcHMgZHJhZ2dpbmcgYW4gaXRlbSBpbiB0aGUgY29udGFpbmVyLiAqL1xuICBAT3V0cHV0KCdjZGtEcmFnRW5kZWQnKSBlbmRlZDogRXZlbnRFbWl0dGVyPENka0RyYWdFbmQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnRW5kPigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGhhcyBtb3ZlZCB0aGUgaXRlbSBpbnRvIGEgbmV3IGNvbnRhaW5lci4gKi9cbiAgQE91dHB1dCgnY2RrRHJhZ0VudGVyZWQnKSBlbnRlcmVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0VudGVyPGFueT4+ID1cbiAgICAgIG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0VudGVyPGFueT4+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgcmVtb3ZlcyB0aGUgaXRlbSBpdHMgY29udGFpbmVyIGJ5IGRyYWdnaW5nIGl0IGludG8gYW5vdGhlciBjb250YWluZXIuICovXG4gIEBPdXRwdXQoJ2Nka0RyYWdFeGl0ZWQnKSBleGl0ZWQ6IEV2ZW50RW1pdHRlcjxDZGtEcmFnRXhpdDxhbnk+PiA9XG4gICAgICBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdFeGl0PGFueT4+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgZHJvcHMgdGhlIGl0ZW0gaW5zaWRlIGEgY29udGFpbmVyLiAqL1xuICBAT3V0cHV0KCdjZGtEcmFnRHJvcHBlZCcpIGRyb3BwZWQ6IEV2ZW50RW1pdHRlcjxDZGtEcmFnRHJvcDxhbnk+PiA9XG4gICAgICBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdEcm9wPGFueT4+KCk7XG5cbiAgLyoqXG4gICAqIEVtaXRzIGFzIHRoZSB1c2VyIGlzIGRyYWdnaW5nIHRoZSBpdGVtLiBVc2Ugd2l0aCBjYXV0aW9uLFxuICAgKiBiZWNhdXNlIHRoaXMgZXZlbnQgd2lsbCBmaXJlIGZvciBldmVyeSBwaXhlbCB0aGF0IHRoZSB1c2VyIGhhcyBkcmFnZ2VkLlxuICAgKi9cbiAgQE91dHB1dCgnY2RrRHJhZ01vdmVkJykgbW92ZWQ6IE9ic2VydmFibGU8Q2RrRHJhZ01vdmU8VD4+ID1cbiAgICAgIG5ldyBPYnNlcnZhYmxlKChvYnNlcnZlcjogT2JzZXJ2ZXI8Q2RrRHJhZ01vdmU8VD4+KSA9PiB7XG4gICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IHRoaXMuX2RyYWdSZWYubW92ZWQucGlwZShtYXAobW92ZWRFdmVudCA9PiAoe1xuICAgICAgICAgIHNvdXJjZTogdGhpcyxcbiAgICAgICAgICBwb2ludGVyUG9zaXRpb246IG1vdmVkRXZlbnQucG9pbnRlclBvc2l0aW9uLFxuICAgICAgICAgIGV2ZW50OiBtb3ZlZEV2ZW50LmV2ZW50LFxuICAgICAgICAgIGRlbHRhOiBtb3ZlZEV2ZW50LmRlbHRhLFxuICAgICAgICAgIGRpc3RhbmNlOiBtb3ZlZEV2ZW50LmRpc3RhbmNlXG4gICAgICAgIH0pKSkuc3Vic2NyaWJlKG9ic2VydmVyKTtcblxuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB9O1xuICAgICAgfSk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICAvKiogRWxlbWVudCB0aGF0IHRoZSBkcmFnZ2FibGUgaXMgYXR0YWNoZWQgdG8uICovXG4gICAgICBwdWJsaWMgZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgICAvKiogRHJvcHBhYmxlIGNvbnRhaW5lciB0aGF0IHRoZSBkcmFnZ2FibGUgaXMgYSBwYXJ0IG9mLiAqL1xuICAgICAgQEluamVjdChDREtfRFJPUF9MSVNUKSBAT3B0aW9uYWwoKSBAU2tpcFNlbGYoKSBwdWJsaWMgZHJvcENvbnRhaW5lcjogQ2RrRHJvcExpc3QsXG4gICAgICAvKipcbiAgICAgICAqIEBkZXByZWNhdGVkIGBfZG9jdW1lbnRgIHBhcmFtZXRlciBubyBsb25nZXIgYmVpbmcgdXNlZCBhbmQgd2lsbCBiZSByZW1vdmVkLlxuICAgICAgICogQGJyZWFraW5nLWNoYW5nZSAxMi4wLjBcbiAgICAgICAqL1xuICAgICAgQEluamVjdChET0NVTUVOVCkgX2RvY3VtZW50OiBhbnksIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgICAgcHJpdmF0ZSBfdmlld0NvbnRhaW5lclJlZjogVmlld0NvbnRhaW5lclJlZixcbiAgICAgIEBPcHRpb25hbCgpIEBJbmplY3QoQ0RLX0RSQUdfQ09ORklHKSBjb25maWc6IERyYWdEcm9wQ29uZmlnLFxuICAgICAgQE9wdGlvbmFsKCkgcHJpdmF0ZSBfZGlyOiBEaXJlY3Rpb25hbGl0eSwgZHJhZ0Ryb3A6IERyYWdEcm9wLFxuICAgICAgcHJpdmF0ZSBfY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmLFxuICAgICAgQE9wdGlvbmFsKCkgQFNlbGYoKSBASW5qZWN0KENES19EUkFHX0hBTkRMRSkgcHJpdmF0ZSBfc2VsZkhhbmRsZT86IENka0RyYWdIYW5kbGUpIHtcbiAgICB0aGlzLl9kcmFnUmVmID0gZHJhZ0Ryb3AuY3JlYXRlRHJhZyhlbGVtZW50LCB7XG4gICAgICBkcmFnU3RhcnRUaHJlc2hvbGQ6IGNvbmZpZyAmJiBjb25maWcuZHJhZ1N0YXJ0VGhyZXNob2xkICE9IG51bGwgP1xuICAgICAgICAgIGNvbmZpZy5kcmFnU3RhcnRUaHJlc2hvbGQgOiA1LFxuICAgICAgcG9pbnRlckRpcmVjdGlvbkNoYW5nZVRocmVzaG9sZDogY29uZmlnICYmIGNvbmZpZy5wb2ludGVyRGlyZWN0aW9uQ2hhbmdlVGhyZXNob2xkICE9IG51bGwgP1xuICAgICAgICAgIGNvbmZpZy5wb2ludGVyRGlyZWN0aW9uQ2hhbmdlVGhyZXNob2xkIDogNSxcbiAgICAgIHpJbmRleDogY29uZmlnPy56SW5kZXhcbiAgICB9KTtcbiAgICB0aGlzLl9kcmFnUmVmLmRhdGEgPSB0aGlzO1xuXG4gICAgaWYgKGNvbmZpZykge1xuICAgICAgdGhpcy5fYXNzaWduRGVmYXVsdHMoY29uZmlnKTtcbiAgICB9XG5cbiAgICAvLyBOb3RlIHRoYXQgdXN1YWxseSB0aGUgY29udGFpbmVyIGlzIGFzc2lnbmVkIHdoZW4gdGhlIGRyb3AgbGlzdCBpcyBwaWNrcyB1cCB0aGUgaXRlbSwgYnV0IGluXG4gICAgLy8gc29tZSBjYXNlcyAobWFpbmx5IHRyYW5zcGxhbnRlZCB2aWV3cyB3aXRoIE9uUHVzaCwgc2VlICMxODM0MSkgd2UgbWF5IGVuZCB1cCBpbiBhIHNpdHVhdGlvblxuICAgIC8vIHdoZXJlIHRoZXJlIGFyZSBubyBpdGVtcyBvbiB0aGUgZmlyc3QgY2hhbmdlIGRldGVjdGlvbiBwYXNzLCBidXQgdGhlIGl0ZW1zIGdldCBwaWNrZWQgdXAgYXNcbiAgICAvLyBzb29uIGFzIHRoZSB1c2VyIHRyaWdnZXJzIGFub3RoZXIgcGFzcyBieSBkcmFnZ2luZy4gVGhpcyBpcyBhIHByb2JsZW0sIGJlY2F1c2UgdGhlIGl0ZW0gd291bGRcbiAgICAvLyBoYXZlIHRvIHN3aXRjaCBmcm9tIHN0YW5kYWxvbmUgbW9kZSB0byBkcmFnIG1vZGUgaW4gdGhlIG1pZGRsZSBvZiB0aGUgZHJhZ2dpbmcgc2VxdWVuY2Ugd2hpY2hcbiAgICAvLyBpcyB0b28gbGF0ZSBzaW5jZSB0aGUgdHdvIG1vZGVzIHNhdmUgZGlmZmVyZW50IGtpbmRzIG9mIGluZm9ybWF0aW9uLiBXZSB3b3JrIGFyb3VuZCBpdCBieVxuICAgIC8vIGFzc2lnbmluZyB0aGUgZHJvcCBjb250YWluZXIgYm90aCBmcm9tIGhlcmUgYW5kIHRoZSBsaXN0LlxuICAgIGlmIChkcm9wQ29udGFpbmVyKSB7XG4gICAgICB0aGlzLl9kcmFnUmVmLl93aXRoRHJvcENvbnRhaW5lcihkcm9wQ29udGFpbmVyLl9kcm9wTGlzdFJlZik7XG4gICAgICBkcm9wQ29udGFpbmVyLmFkZEl0ZW0odGhpcyk7XG4gICAgfVxuXG4gICAgdGhpcy5fc3luY0lucHV0cyh0aGlzLl9kcmFnUmVmKTtcbiAgICB0aGlzLl9oYW5kbGVFdmVudHModGhpcy5fZHJhZ1JlZik7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZWxlbWVudCB0aGF0IGlzIGJlaW5nIHVzZWQgYXMgYSBwbGFjZWhvbGRlclxuICAgKiB3aGlsZSB0aGUgY3VycmVudCBlbGVtZW50IGlzIGJlaW5nIGRyYWdnZWQuXG4gICAqL1xuICBnZXRQbGFjZWhvbGRlckVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLl9kcmFnUmVmLmdldFBsYWNlaG9sZGVyRWxlbWVudCgpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIHJvb3QgZHJhZ2dhYmxlIGVsZW1lbnQuICovXG4gIGdldFJvb3RFbGVtZW50KCk6IEhUTUxFbGVtZW50IHtcbiAgICByZXR1cm4gdGhpcy5fZHJhZ1JlZi5nZXRSb290RWxlbWVudCgpO1xuICB9XG5cbiAgLyoqIFJlc2V0cyBhIHN0YW5kYWxvbmUgZHJhZyBpdGVtIHRvIGl0cyBpbml0aWFsIHBvc2l0aW9uLiAqL1xuICByZXNldCgpOiB2b2lkIHtcbiAgICB0aGlzLl9kcmFnUmVmLnJlc2V0KCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcGl4ZWwgY29vcmRpbmF0ZXMgb2YgdGhlIGRyYWdnYWJsZSBvdXRzaWRlIG9mIGEgZHJvcCBjb250YWluZXIuXG4gICAqL1xuICBnZXRGcmVlRHJhZ1Bvc2l0aW9uKCk6IHtyZWFkb25seSB4OiBudW1iZXIsIHJlYWRvbmx5IHk6IG51bWJlcn0ge1xuICAgIHJldHVybiB0aGlzLl9kcmFnUmVmLmdldEZyZWVEcmFnUG9zaXRpb24oKTtcbiAgfVxuXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcbiAgICAvLyBXZSBuZWVkIHRvIHdhaXQgZm9yIHRoZSB6b25lIHRvIHN0YWJpbGl6ZSwgaW4gb3JkZXIgZm9yIHRoZSByZWZlcmVuY2VcbiAgICAvLyBlbGVtZW50IHRvIGJlIGluIHRoZSBwcm9wZXIgcGxhY2UgaW4gdGhlIERPTS4gVGhpcyBpcyBtb3N0bHkgcmVsZXZhbnRcbiAgICAvLyBmb3IgZHJhZ2dhYmxlIGVsZW1lbnRzIGluc2lkZSBwb3J0YWxzIHNpbmNlIHRoZXkgZ2V0IHN0YW1wZWQgb3V0IGluXG4gICAgLy8gdGhlaXIgb3JpZ2luYWwgRE9NIHBvc2l0aW9uIGFuZCB0aGVuIHRoZXkgZ2V0IHRyYW5zZmVycmVkIHRvIHRoZSBwb3J0YWwuXG4gICAgdGhpcy5fbmdab25lLm9uU3RhYmxlXG4gICAgICAucGlwZSh0YWtlKDEpLCB0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSlcbiAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICB0aGlzLl91cGRhdGVSb290RWxlbWVudCgpO1xuXG4gICAgICAgIC8vIExpc3RlbiBmb3IgYW55IG5ld2x5LWFkZGVkIGhhbmRsZXMuXG4gICAgICAgIHRoaXMuX2hhbmRsZXMuY2hhbmdlcy5waXBlKFxuICAgICAgICAgIHN0YXJ0V2l0aCh0aGlzLl9oYW5kbGVzKSxcbiAgICAgICAgICAvLyBTeW5jIHRoZSBuZXcgaGFuZGxlcyB3aXRoIHRoZSBEcmFnUmVmLlxuICAgICAgICAgIHRhcCgoaGFuZGxlczogUXVlcnlMaXN0PENka0RyYWdIYW5kbGU+KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjaGlsZEhhbmRsZUVsZW1lbnRzID0gaGFuZGxlc1xuICAgICAgICAgICAgICAuZmlsdGVyKGhhbmRsZSA9PiBoYW5kbGUuX3BhcmVudERyYWcgPT09IHRoaXMpXG4gICAgICAgICAgICAgIC5tYXAoaGFuZGxlID0+IGhhbmRsZS5lbGVtZW50KTtcblxuICAgICAgICAgICAgLy8gVXN1YWxseSBoYW5kbGVzIGFyZSBvbmx5IGFsbG93ZWQgdG8gYmUgYSBkZXNjZW5kYW50IG9mIHRoZSBkcmFnIGVsZW1lbnQsIGJ1dCBpZlxuICAgICAgICAgICAgLy8gdGhlIGNvbnN1bWVyIGRlZmluZWQgYSBkaWZmZXJlbnQgZHJhZyByb290LCB3ZSBzaG91bGQgYWxsb3cgdGhlIGRyYWcgZWxlbWVudFxuICAgICAgICAgICAgLy8gaXRzZWxmIHRvIGJlIGEgaGFuZGxlIHRvby5cbiAgICAgICAgICAgIGlmICh0aGlzLl9zZWxmSGFuZGxlICYmIHRoaXMucm9vdEVsZW1lbnRTZWxlY3Rvcikge1xuICAgICAgICAgICAgICBjaGlsZEhhbmRsZUVsZW1lbnRzLnB1c2godGhpcy5lbGVtZW50KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5fZHJhZ1JlZi53aXRoSGFuZGxlcyhjaGlsZEhhbmRsZUVsZW1lbnRzKTtcbiAgICAgICAgICB9KSxcbiAgICAgICAgICAvLyBMaXN0ZW4gaWYgdGhlIHN0YXRlIG9mIGFueSBvZiB0aGUgaGFuZGxlcyBjaGFuZ2VzLlxuICAgICAgICAgIHN3aXRjaE1hcCgoaGFuZGxlczogUXVlcnlMaXN0PENka0RyYWdIYW5kbGU+KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbWVyZ2UoLi4uaGFuZGxlcy5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiBpdGVtLl9zdGF0ZUNoYW5nZXMucGlwZShzdGFydFdpdGgoaXRlbSkpO1xuICAgICAgICAgICAgfSkpIGFzIE9ic2VydmFibGU8Q2RrRHJhZ0hhbmRsZT47XG4gICAgICAgICAgfSksXG4gICAgICAgICAgdGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZClcbiAgICAgICAgKS5zdWJzY3JpYmUoaGFuZGxlSW5zdGFuY2UgPT4ge1xuICAgICAgICAgIC8vIEVuYWJsZWQvZGlzYWJsZSB0aGUgaGFuZGxlIHRoYXQgY2hhbmdlZCBpbiB0aGUgRHJhZ1JlZi5cbiAgICAgICAgICBjb25zdCBkcmFnUmVmID0gdGhpcy5fZHJhZ1JlZjtcbiAgICAgICAgICBjb25zdCBoYW5kbGUgPSBoYW5kbGVJbnN0YW5jZS5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQ7XG4gICAgICAgICAgaGFuZGxlSW5zdGFuY2UuZGlzYWJsZWQgPyBkcmFnUmVmLmRpc2FibGVIYW5kbGUoaGFuZGxlKSA6IGRyYWdSZWYuZW5hYmxlSGFuZGxlKGhhbmRsZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICh0aGlzLmZyZWVEcmFnUG9zaXRpb24pIHtcbiAgICAgICAgICB0aGlzLl9kcmFnUmVmLnNldEZyZWVEcmFnUG9zaXRpb24odGhpcy5mcmVlRHJhZ1Bvc2l0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKSB7XG4gICAgY29uc3Qgcm9vdFNlbGVjdG9yQ2hhbmdlID0gY2hhbmdlc1sncm9vdEVsZW1lbnRTZWxlY3RvciddO1xuICAgIGNvbnN0IHBvc2l0aW9uQ2hhbmdlID0gY2hhbmdlc1snZnJlZURyYWdQb3NpdGlvbiddO1xuXG4gICAgLy8gV2UgZG9uJ3QgaGF2ZSB0byByZWFjdCB0byB0aGUgZmlyc3QgY2hhbmdlIHNpbmNlIGl0J3MgYmVpbmdcbiAgICAvLyBoYW5kbGVkIGluIGBuZ0FmdGVyVmlld0luaXRgIHdoZXJlIGl0IG5lZWRzIHRvIGJlIGRlZmVycmVkLlxuICAgIGlmIChyb290U2VsZWN0b3JDaGFuZ2UgJiYgIXJvb3RTZWxlY3RvckNoYW5nZS5maXJzdENoYW5nZSkge1xuICAgICAgdGhpcy5fdXBkYXRlUm9vdEVsZW1lbnQoKTtcbiAgICB9XG5cbiAgICAvLyBTa2lwIHRoZSBmaXJzdCBjaGFuZ2Ugc2luY2UgaXQncyBiZWluZyBoYW5kbGVkIGluIGBuZ0FmdGVyVmlld0luaXRgLlxuICAgIGlmIChwb3NpdGlvbkNoYW5nZSAmJiAhcG9zaXRpb25DaGFuZ2UuZmlyc3RDaGFuZ2UgJiYgdGhpcy5mcmVlRHJhZ1Bvc2l0aW9uKSB7XG4gICAgICB0aGlzLl9kcmFnUmVmLnNldEZyZWVEcmFnUG9zaXRpb24odGhpcy5mcmVlRHJhZ1Bvc2l0aW9uKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5kcm9wQ29udGFpbmVyKSB7XG4gICAgICB0aGlzLmRyb3BDb250YWluZXIucmVtb3ZlSXRlbSh0aGlzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9kZXN0cm95ZWQubmV4dCgpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX2RyYWdSZWYuZGlzcG9zZSgpO1xuICB9XG5cbiAgLyoqIFN5bmNzIHRoZSByb290IGVsZW1lbnQgd2l0aCB0aGUgYERyYWdSZWZgLiAqL1xuICBwcml2YXRlIF91cGRhdGVSb290RWxlbWVudCgpIHtcbiAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQ7XG4gICAgY29uc3Qgcm9vdEVsZW1lbnQgPSB0aGlzLnJvb3RFbGVtZW50U2VsZWN0b3IgP1xuICAgICAgICBnZXRDbG9zZXN0TWF0Y2hpbmdBbmNlc3RvcihlbGVtZW50LCB0aGlzLnJvb3RFbGVtZW50U2VsZWN0b3IpIDogZWxlbWVudDtcblxuICAgIGlmIChyb290RWxlbWVudCAmJiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgYXNzZXJ0RWxlbWVudE5vZGUocm9vdEVsZW1lbnQsICdjZGtEcmFnJyk7XG4gICAgfVxuXG4gICAgdGhpcy5fZHJhZ1JlZi53aXRoUm9vdEVsZW1lbnQocm9vdEVsZW1lbnQgfHwgZWxlbWVudCk7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgYm91bmRhcnkgZWxlbWVudCwgYmFzZWQgb24gdGhlIGBib3VuZGFyeUVsZW1lbnRgIHZhbHVlLiAqL1xuICBwcml2YXRlIF9nZXRCb3VuZGFyeUVsZW1lbnQoKSB7XG4gICAgY29uc3QgYm91bmRhcnkgPSB0aGlzLmJvdW5kYXJ5RWxlbWVudDtcblxuICAgIGlmICghYm91bmRhcnkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgYm91bmRhcnkgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gZ2V0Q2xvc2VzdE1hdGNoaW5nQW5jZXN0b3IodGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQsIGJvdW5kYXJ5KTtcbiAgICB9XG5cbiAgICBjb25zdCBlbGVtZW50ID0gY29lcmNlRWxlbWVudChib3VuZGFyeSk7XG5cbiAgICBpZiAoKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiZcbiAgICAgICFlbGVtZW50LmNvbnRhaW5zKHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50KSkge1xuICAgICAgdGhyb3cgRXJyb3IoJ0RyYWdnYWJsZSBlbGVtZW50IGlzIG5vdCBpbnNpZGUgb2YgdGhlIG5vZGUgcGFzc2VkIGludG8gY2RrRHJhZ0JvdW5kYXJ5LicpO1xuICAgIH1cblxuICAgIHJldHVybiBlbGVtZW50O1xuICB9XG5cbiAgLyoqIFN5bmNzIHRoZSBpbnB1dHMgb2YgdGhlIENka0RyYWcgd2l0aCB0aGUgb3B0aW9ucyBvZiB0aGUgdW5kZXJseWluZyBEcmFnUmVmLiAqL1xuICBwcml2YXRlIF9zeW5jSW5wdXRzKHJlZjogRHJhZ1JlZjxDZGtEcmFnPFQ+Pikge1xuICAgIHJlZi5iZWZvcmVTdGFydGVkLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICBpZiAoIXJlZi5pc0RyYWdnaW5nKCkpIHtcbiAgICAgICAgY29uc3QgZGlyID0gdGhpcy5fZGlyO1xuICAgICAgICBjb25zdCBkcmFnU3RhcnREZWxheSA9IHRoaXMuZHJhZ1N0YXJ0RGVsYXk7XG4gICAgICAgIGNvbnN0IHBsYWNlaG9sZGVyID0gdGhpcy5fcGxhY2Vob2xkZXJUZW1wbGF0ZSA/IHtcbiAgICAgICAgICB0ZW1wbGF0ZTogdGhpcy5fcGxhY2Vob2xkZXJUZW1wbGF0ZS50ZW1wbGF0ZVJlZixcbiAgICAgICAgICBjb250ZXh0OiB0aGlzLl9wbGFjZWhvbGRlclRlbXBsYXRlLmRhdGEsXG4gICAgICAgICAgdmlld0NvbnRhaW5lcjogdGhpcy5fdmlld0NvbnRhaW5lclJlZlxuICAgICAgICB9IDogbnVsbDtcbiAgICAgICAgY29uc3QgcHJldmlldyA9IHRoaXMuX3ByZXZpZXdUZW1wbGF0ZSA/IHtcbiAgICAgICAgICB0ZW1wbGF0ZTogdGhpcy5fcHJldmlld1RlbXBsYXRlLnRlbXBsYXRlUmVmLFxuICAgICAgICAgIGNvbnRleHQ6IHRoaXMuX3ByZXZpZXdUZW1wbGF0ZS5kYXRhLFxuICAgICAgICAgIG1hdGNoU2l6ZTogdGhpcy5fcHJldmlld1RlbXBsYXRlLm1hdGNoU2l6ZSxcbiAgICAgICAgICB2aWV3Q29udGFpbmVyOiB0aGlzLl92aWV3Q29udGFpbmVyUmVmXG4gICAgICAgIH0gOiBudWxsO1xuXG4gICAgICAgIHJlZi5kaXNhYmxlZCA9IHRoaXMuZGlzYWJsZWQ7XG4gICAgICAgIHJlZi5sb2NrQXhpcyA9IHRoaXMubG9ja0F4aXM7XG4gICAgICAgIHJlZi5kcmFnU3RhcnREZWxheSA9ICh0eXBlb2YgZHJhZ1N0YXJ0RGVsYXkgPT09ICdvYmplY3QnICYmIGRyYWdTdGFydERlbGF5KSA/XG4gICAgICAgICAgICBkcmFnU3RhcnREZWxheSA6IGNvZXJjZU51bWJlclByb3BlcnR5KGRyYWdTdGFydERlbGF5KTtcbiAgICAgICAgcmVmLmNvbnN0cmFpblBvc2l0aW9uID0gdGhpcy5jb25zdHJhaW5Qb3NpdGlvbjtcbiAgICAgICAgcmVmLnByZXZpZXdDbGFzcyA9IHRoaXMucHJldmlld0NsYXNzO1xuICAgICAgICByZWZcbiAgICAgICAgICAud2l0aEJvdW5kYXJ5RWxlbWVudCh0aGlzLl9nZXRCb3VuZGFyeUVsZW1lbnQoKSlcbiAgICAgICAgICAud2l0aFBsYWNlaG9sZGVyVGVtcGxhdGUocGxhY2Vob2xkZXIpXG4gICAgICAgICAgLndpdGhQcmV2aWV3VGVtcGxhdGUocHJldmlldyk7XG5cbiAgICAgICAgaWYgKGRpcikge1xuICAgICAgICAgIHJlZi53aXRoRGlyZWN0aW9uKGRpci52YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBIYW5kbGVzIHRoZSBldmVudHMgZnJvbSB0aGUgdW5kZXJseWluZyBgRHJhZ1JlZmAuICovXG4gIHByaXZhdGUgX2hhbmRsZUV2ZW50cyhyZWY6IERyYWdSZWY8Q2RrRHJhZzxUPj4pIHtcbiAgICByZWYuc3RhcnRlZC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgdGhpcy5zdGFydGVkLmVtaXQoe3NvdXJjZTogdGhpc30pO1xuXG4gICAgICAvLyBTaW5jZSBhbGwgb2YgdGhlc2UgZXZlbnRzIHJ1biBvdXRzaWRlIG9mIGNoYW5nZSBkZXRlY3Rpb24sXG4gICAgICAvLyB3ZSBuZWVkIHRvIGVuc3VyZSB0aGF0IGV2ZXJ5dGhpbmcgaXMgbWFya2VkIGNvcnJlY3RseS5cbiAgICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICAgIH0pO1xuXG4gICAgcmVmLnJlbGVhc2VkLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICB0aGlzLnJlbGVhc2VkLmVtaXQoe3NvdXJjZTogdGhpc30pO1xuICAgIH0pO1xuXG4gICAgcmVmLmVuZGVkLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICB0aGlzLmVuZGVkLmVtaXQoe3NvdXJjZTogdGhpcywgZGlzdGFuY2U6IGV2ZW50LmRpc3RhbmNlfSk7XG5cbiAgICAgIC8vIFNpbmNlIGFsbCBvZiB0aGVzZSBldmVudHMgcnVuIG91dHNpZGUgb2YgY2hhbmdlIGRldGVjdGlvbixcbiAgICAgIC8vIHdlIG5lZWQgdG8gZW5zdXJlIHRoYXQgZXZlcnl0aGluZyBpcyBtYXJrZWQgY29ycmVjdGx5LlxuICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgfSk7XG5cbiAgICByZWYuZW50ZXJlZC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgdGhpcy5lbnRlcmVkLmVtaXQoe1xuICAgICAgICBjb250YWluZXI6IGV2ZW50LmNvbnRhaW5lci5kYXRhLFxuICAgICAgICBpdGVtOiB0aGlzLFxuICAgICAgICBjdXJyZW50SW5kZXg6IGV2ZW50LmN1cnJlbnRJbmRleFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZWYuZXhpdGVkLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICB0aGlzLmV4aXRlZC5lbWl0KHtcbiAgICAgICAgY29udGFpbmVyOiBldmVudC5jb250YWluZXIuZGF0YSxcbiAgICAgICAgaXRlbTogdGhpc1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZWYuZHJvcHBlZC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgdGhpcy5kcm9wcGVkLmVtaXQoe1xuICAgICAgICBwcmV2aW91c0luZGV4OiBldmVudC5wcmV2aW91c0luZGV4LFxuICAgICAgICBjdXJyZW50SW5kZXg6IGV2ZW50LmN1cnJlbnRJbmRleCxcbiAgICAgICAgcHJldmlvdXNDb250YWluZXI6IGV2ZW50LnByZXZpb3VzQ29udGFpbmVyLmRhdGEsXG4gICAgICAgIGNvbnRhaW5lcjogZXZlbnQuY29udGFpbmVyLmRhdGEsXG4gICAgICAgIGlzUG9pbnRlck92ZXJDb250YWluZXI6IGV2ZW50LmlzUG9pbnRlck92ZXJDb250YWluZXIsXG4gICAgICAgIGl0ZW06IHRoaXMsXG4gICAgICAgIGRpc3RhbmNlOiBldmVudC5kaXN0YW5jZVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogQXNzaWducyB0aGUgZGVmYXVsdCBpbnB1dCB2YWx1ZXMgYmFzZWQgb24gYSBwcm92aWRlZCBjb25maWcgb2JqZWN0LiAqL1xuICBwcml2YXRlIF9hc3NpZ25EZWZhdWx0cyhjb25maWc6IERyYWdEcm9wQ29uZmlnKSB7XG4gICAgY29uc3Qge1xuICAgICAgbG9ja0F4aXMsIGRyYWdTdGFydERlbGF5LCBjb25zdHJhaW5Qb3NpdGlvbiwgcHJldmlld0NsYXNzLFxuICAgICAgYm91bmRhcnlFbGVtZW50LCBkcmFnZ2luZ0Rpc2FibGVkLCByb290RWxlbWVudFNlbGVjdG9yXG4gICAgfSA9IGNvbmZpZztcblxuICAgIHRoaXMuZGlzYWJsZWQgPSBkcmFnZ2luZ0Rpc2FibGVkID09IG51bGwgPyBmYWxzZSA6IGRyYWdnaW5nRGlzYWJsZWQ7XG4gICAgdGhpcy5kcmFnU3RhcnREZWxheSA9IGRyYWdTdGFydERlbGF5IHx8IDA7XG5cbiAgICBpZiAobG9ja0F4aXMpIHtcbiAgICAgIHRoaXMubG9ja0F4aXMgPSBsb2NrQXhpcztcbiAgICB9XG5cbiAgICBpZiAoY29uc3RyYWluUG9zaXRpb24pIHtcbiAgICAgIHRoaXMuY29uc3RyYWluUG9zaXRpb24gPSBjb25zdHJhaW5Qb3NpdGlvbjtcbiAgICB9XG5cbiAgICBpZiAocHJldmlld0NsYXNzKSB7XG4gICAgICB0aGlzLnByZXZpZXdDbGFzcyA9IHByZXZpZXdDbGFzcztcbiAgICB9XG5cbiAgICBpZiAoYm91bmRhcnlFbGVtZW50KSB7XG4gICAgICB0aGlzLmJvdW5kYXJ5RWxlbWVudCA9IGJvdW5kYXJ5RWxlbWVudDtcbiAgICB9XG5cbiAgICBpZiAocm9vdEVsZW1lbnRTZWxlY3Rvcikge1xuICAgICAgdGhpcy5yb290RWxlbWVudFNlbGVjdG9yID0gcm9vdEVsZW1lbnRTZWxlY3RvcjtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfZGlzYWJsZWQ6IEJvb2xlYW5JbnB1dDtcbn1cblxuLyoqIEdldHMgdGhlIGNsb3Nlc3QgYW5jZXN0b3Igb2YgYW4gZWxlbWVudCB0aGF0IG1hdGNoZXMgYSBzZWxlY3Rvci4gKi9cbmZ1bmN0aW9uIGdldENsb3Nlc3RNYXRjaGluZ0FuY2VzdG9yKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBzZWxlY3Rvcjogc3RyaW5nKSB7XG4gIGxldCBjdXJyZW50RWxlbWVudCA9IGVsZW1lbnQucGFyZW50RWxlbWVudCBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG5cbiAgd2hpbGUgKGN1cnJlbnRFbGVtZW50KSB7XG4gICAgLy8gSUUgZG9lc24ndCBzdXBwb3J0IGBtYXRjaGVzYCBzbyB3ZSBoYXZlIHRvIGZhbGwgYmFjayB0byBgbXNNYXRjaGVzU2VsZWN0b3JgLlxuICAgIGlmIChjdXJyZW50RWxlbWVudC5tYXRjaGVzID8gY3VycmVudEVsZW1lbnQubWF0Y2hlcyhzZWxlY3RvcikgOlxuICAgICAgICAoY3VycmVudEVsZW1lbnQgYXMgYW55KS5tc01hdGNoZXNTZWxlY3RvcihzZWxlY3RvcikpIHtcbiAgICAgIHJldHVybiBjdXJyZW50RWxlbWVudDtcbiAgICB9XG5cbiAgICBjdXJyZW50RWxlbWVudCA9IGN1cnJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQ7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuIl19