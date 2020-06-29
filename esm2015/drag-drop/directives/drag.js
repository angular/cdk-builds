/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directionality } from '@angular/cdk/bidi';
import { DOCUMENT } from '@angular/common';
import { ContentChild, ContentChildren, Directive, ElementRef, EventEmitter, Inject, Input, NgZone, Optional, Output, QueryList, SkipSelf, ViewContainerRef, ChangeDetectorRef, isDevMode, } from '@angular/core';
import { coerceBooleanProperty, coerceNumberProperty, coerceElement } from '@angular/cdk/coercion';
import { Observable, Subject, merge } from 'rxjs';
import { startWith, take, map, takeUntil, switchMap, tap } from 'rxjs/operators';
import { CDK_DRAG_HANDLE } from './drag-handle';
import { CDK_DRAG_PLACEHOLDER, CdkDragPlaceholder } from './drag-placeholder';
import { CDK_DRAG_PREVIEW, CdkDragPreview } from './drag-preview';
import { CDK_DRAG_PARENT } from '../drag-parent';
import { CDK_DROP_LIST } from './drop-list';
import { DragDrop } from '../drag-drop';
import { CDK_DRAG_CONFIG } from './config';
/** Element that can be moved inside a CdkDropList container. */
export class CdkDrag {
    constructor(
    /** Element that the draggable is attached to. */
    element, 
    /** Droppable container that the draggable is a part of. */
    dropContainer, _document, _ngZone, _viewContainerRef, config, _dir, dragDrop, _changeDetectorRef) {
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
        this._ngZone.onStable.asObservable()
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
        if (rootElement && rootElement.nodeType !== this._document.ELEMENT_NODE) {
            throw Error(`cdkDrag must be attached to an element node. ` +
                `Currently attached to "${rootElement.nodeName}".`);
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
        if (isDevMode() && !element.contains(this.element.nativeElement)) {
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
    { type: ChangeDetectorRef }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2RpcmVjdGl2ZXMvZHJhZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFFTCxZQUFZLEVBQ1osZUFBZSxFQUNmLFNBQVMsRUFDVCxVQUFVLEVBQ1YsWUFBWSxFQUNaLE1BQU0sRUFDTixLQUFLLEVBQ0wsTUFBTSxFQUVOLFFBQVEsRUFDUixNQUFNLEVBQ04sU0FBUyxFQUNULFFBQVEsRUFDUixnQkFBZ0IsRUFHaEIsaUJBQWlCLEVBQ2pCLFNBQVMsR0FDVixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQ0wscUJBQXFCLEVBQ3JCLG9CQUFvQixFQUNwQixhQUFhLEVBRWQsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQUMsVUFBVSxFQUFZLE9BQU8sRUFBRSxLQUFLLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDMUQsT0FBTyxFQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFVL0UsT0FBTyxFQUFDLGVBQWUsRUFBZ0IsTUFBTSxlQUFlLENBQUM7QUFDN0QsT0FBTyxFQUFDLG9CQUFvQixFQUFFLGtCQUFrQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDNUUsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGNBQWMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ2hFLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUUvQyxPQUFPLEVBQUMsYUFBYSxFQUFxQyxNQUFNLGFBQWEsQ0FBQztBQUM5RSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQ3RDLE9BQU8sRUFBQyxlQUFlLEVBQTJDLE1BQU0sVUFBVSxDQUFDO0FBRW5GLGdFQUFnRTtBQVdoRSxNQUFNLE9BQU8sT0FBTztJQWtIbEI7SUFDSSxpREFBaUQ7SUFDMUMsT0FBZ0M7SUFDdkMsMkRBQTJEO0lBQ0wsYUFBMEIsRUFDdEQsU0FBYyxFQUFVLE9BQWUsRUFDekQsaUJBQW1DLEVBQ04sTUFBc0IsRUFDdkMsSUFBb0IsRUFBRSxRQUFrQixFQUNwRCxrQkFBcUM7UUFQdEMsWUFBTyxHQUFQLE9BQU8sQ0FBeUI7UUFFZSxrQkFBYSxHQUFiLGFBQWEsQ0FBYTtRQUN0RCxjQUFTLEdBQVQsU0FBUyxDQUFLO1FBQVUsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQUN6RCxzQkFBaUIsR0FBakIsaUJBQWlCLENBQWtCO1FBRXZCLFNBQUksR0FBSixJQUFJLENBQWdCO1FBQ2hDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBbUI7UUExSHpDLGVBQVUsR0FBRyxJQUFJLE9BQU8sRUFBUSxDQUFDO1FBd0V6QyxvREFBb0Q7UUFDMUIsWUFBTyxHQUErQixJQUFJLFlBQVksRUFBZ0IsQ0FBQztRQUVqRyx3RkFBd0Y7UUFDN0QsYUFBUSxHQUMvQixJQUFJLFlBQVksRUFBa0IsQ0FBQztRQUV2QyxtRUFBbUU7UUFDM0MsVUFBSyxHQUE2QixJQUFJLFlBQVksRUFBYyxDQUFDO1FBRXpGLG1FQUFtRTtRQUN6QyxZQUFPLEdBQzdCLElBQUksWUFBWSxFQUFxQixDQUFDO1FBRTFDLGdHQUFnRztRQUN2RSxXQUFNLEdBQzNCLElBQUksWUFBWSxFQUFvQixDQUFDO1FBRXpDLDZEQUE2RDtRQUNuQyxZQUFPLEdBQzdCLElBQUksWUFBWSxFQUFvQixDQUFDO1FBRXpDOzs7V0FHRztRQUNxQixVQUFLLEdBQ3pCLElBQUksVUFBVSxDQUFDLENBQUMsUUFBa0MsRUFBRSxFQUFFO1lBQ3BELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUMvRCxNQUFNLEVBQUUsSUFBSTtnQkFDWixlQUFlLEVBQUUsVUFBVSxDQUFDLGVBQWU7Z0JBQzNDLEtBQUssRUFBRSxVQUFVLENBQUMsS0FBSztnQkFDdkIsS0FBSyxFQUFFLFVBQVUsQ0FBQyxLQUFLO2dCQUN2QixRQUFRLEVBQUUsVUFBVSxDQUFDLFFBQVE7YUFDOUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFekIsT0FBTyxHQUFHLEVBQUU7Z0JBQ1YsWUFBWSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzdCLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBWUwsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRTtZQUMzQyxrQkFBa0IsRUFBRSxNQUFNLElBQUksTUFBTSxDQUFDLGtCQUFrQixJQUFJLElBQUksQ0FBQyxDQUFDO2dCQUM3RCxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakMsK0JBQStCLEVBQUUsTUFBTSxJQUFJLE1BQU0sQ0FBQywrQkFBK0IsSUFBSSxJQUFJLENBQUMsQ0FBQztnQkFDdkYsTUFBTSxDQUFDLCtCQUErQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlDLE1BQU0sRUFBRSxNQUFNLGFBQU4sTUFBTSx1QkFBTixNQUFNLENBQUUsTUFBTTtTQUN2QixDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFFMUIsSUFBSSxNQUFNLEVBQUU7WUFDVixJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQzlCO1FBRUQsOEZBQThGO1FBQzlGLDhGQUE4RjtRQUM5Riw4RkFBOEY7UUFDOUYsZ0dBQWdHO1FBQ2hHLGdHQUFnRztRQUNoRyw0RkFBNEY7UUFDNUYsNERBQTREO1FBQzVELElBQUksYUFBYSxFQUFFO1lBQ2pCLElBQUksQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzdELGFBQWEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDN0I7UUFFRCxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBcEdELHlEQUF5RDtJQUN6RCxJQUNJLFFBQVE7UUFDVixPQUFPLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDL0UsQ0FBQztJQUNELElBQUksUUFBUSxDQUFDLEtBQWM7UUFDekIsSUFBSSxDQUFDLFNBQVMsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM5QyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQzFDLENBQUM7SUE4RkQ7OztPQUdHO0lBQ0gscUJBQXFCO1FBQ25CLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO0lBQy9DLENBQUM7SUFFRCwwQ0FBMEM7SUFDMUMsY0FBYztRQUNaLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjLEVBQUUsQ0FBQztJQUN4QyxDQUFDO0lBRUQsNkRBQTZEO0lBQzdELEtBQUs7UUFDSCxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3hCLENBQUM7SUFFRDs7T0FFRztJQUNILG1CQUFtQjtRQUNqQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztJQUM3QyxDQUFDO0lBRUQsZUFBZTtRQUNiLHdFQUF3RTtRQUN4RSx3RUFBd0U7UUFDeEUsc0VBQXNFO1FBQ3RFLDJFQUEyRTtRQUMzRSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUU7YUFDakMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2FBQ3pDLFNBQVMsQ0FBQyxHQUFHLEVBQUU7WUFDZCxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztZQUUxQixzQ0FBc0M7WUFDdEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUN4QixTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN4Qix5Q0FBeUM7WUFDekMsR0FBRyxDQUFDLENBQUMsT0FBaUMsRUFBRSxFQUFFO2dCQUN4QyxNQUFNLG1CQUFtQixHQUFHLE9BQU87cUJBQ2hDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEtBQUssSUFBSSxDQUFDO3FCQUM3QyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ2pDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDakQsQ0FBQyxDQUFDO1lBQ0YscURBQXFEO1lBQ3JELFNBQVMsQ0FBQyxDQUFDLE9BQWlDLEVBQUUsRUFBRTtnQkFDOUMsT0FBTyxLQUFLLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUNqQyxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNsRCxDQUFDLENBQUMsQ0FBOEIsQ0FBQztZQUNuQyxDQUFDLENBQUMsRUFDRixTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUMzQixDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsRUFBRTtnQkFDM0IsMERBQTBEO2dCQUMxRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO2dCQUM5QixNQUFNLE1BQU0sR0FBRyxjQUFjLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQztnQkFDcEQsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN6RixDQUFDLENBQUMsQ0FBQztZQUVILElBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFO2dCQUN6QixJQUFJLENBQUMsUUFBUSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO2FBQzFEO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsV0FBVyxDQUFDLE9BQXNCO1FBQ2hDLE1BQU0sa0JBQWtCLEdBQUcsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDMUQsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFFbkQsOERBQThEO1FBQzlELDhEQUE4RDtRQUM5RCxJQUFJLGtCQUFrQixJQUFJLENBQUMsa0JBQWtCLENBQUMsV0FBVyxFQUFFO1lBQ3pELElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1NBQzNCO1FBRUQsdUVBQXVFO1FBQ3ZFLElBQUksY0FBYyxJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7WUFDMUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztTQUMxRDtJQUNILENBQUM7SUFFRCxXQUFXO1FBQ1QsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFO1lBQ3RCLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3JDO1FBRUQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN2QixJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzNCLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDMUIsQ0FBQztJQUVELGlEQUFpRDtJQUN6QyxrQkFBa0I7UUFDeEIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUM7UUFDM0MsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDMUMsMEJBQTBCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFFNUUsSUFBSSxXQUFXLElBQUksV0FBVyxDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksRUFBRTtZQUN2RSxNQUFNLEtBQUssQ0FBQywrQ0FBK0M7Z0JBQy9DLDBCQUEwQixXQUFXLENBQUMsUUFBUSxJQUFJLENBQUMsQ0FBQztTQUNqRTtRQUVELElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLFdBQVcsSUFBSSxPQUFPLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRUQsdUVBQXVFO0lBQy9ELG1CQUFtQjtRQUN6QixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDO1FBRXRDLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDYixPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUU7WUFDaEMsT0FBTywwQkFBMEIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQztTQUN6RTtRQUVELE1BQU0sT0FBTyxHQUFHLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUV4QyxJQUFJLFNBQVMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFFO1lBQ2hFLE1BQU0sS0FBSyxDQUFDLDBFQUEwRSxDQUFDLENBQUM7U0FDekY7UUFFRCxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBRUQsa0ZBQWtGO0lBQzFFLFdBQVcsQ0FBQyxHQUF3QjtRQUMxQyxHQUFHLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUU7WUFDL0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsRUFBRTtnQkFDckIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztnQkFDdEIsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQztnQkFDM0MsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQztvQkFDOUMsUUFBUSxFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxXQUFXO29CQUMvQyxPQUFPLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUk7b0JBQ3ZDLGFBQWEsRUFBRSxJQUFJLENBQUMsaUJBQWlCO2lCQUN0QyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQ1QsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztvQkFDdEMsUUFBUSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXO29CQUMzQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUk7b0JBQ25DLFNBQVMsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUztvQkFDMUMsYUFBYSxFQUFFLElBQUksQ0FBQyxpQkFBaUI7aUJBQ3RDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFFVCxHQUFHLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7Z0JBQzdCLEdBQUcsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztnQkFDN0IsR0FBRyxDQUFDLGNBQWMsR0FBRyxDQUFDLE9BQU8sY0FBYyxLQUFLLFFBQVEsSUFBSSxjQUFjLENBQUMsQ0FBQyxDQUFDO29CQUN6RSxjQUFjLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUMxRCxHQUFHLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDO2dCQUMvQyxHQUFHLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7Z0JBQ3JDLEdBQUc7cUJBQ0EsbUJBQW1CLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7cUJBQy9DLHVCQUF1QixDQUFDLFdBQVcsQ0FBQztxQkFDcEMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBRWhDLElBQUksR0FBRyxFQUFFO29CQUNQLEdBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO2lCQUM5QjthQUNGO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsd0RBQXdEO0lBQ2hELGFBQWEsQ0FBQyxHQUF3QjtRQUM1QyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUU7WUFDekIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBQyxNQUFNLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztZQUVsQyw2REFBNkQ7WUFDN0QseURBQXlEO1lBQ3pELElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUN6QyxDQUFDLENBQUMsQ0FBQztRQUVILEdBQUcsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRTtZQUMxQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO1FBQ3JDLENBQUMsQ0FBQyxDQUFDO1FBRUgsR0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDMUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFDLENBQUMsQ0FBQztZQUUxRCw2REFBNkQ7WUFDN0QseURBQXlEO1lBQ3pELElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUN6QyxDQUFDLENBQUMsQ0FBQztRQUVILEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQzVCLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO2dCQUNoQixTQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJO2dCQUMvQixJQUFJLEVBQUUsSUFBSTtnQkFDVixZQUFZLEVBQUUsS0FBSyxDQUFDLFlBQVk7YUFDakMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUMzQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztnQkFDZixTQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJO2dCQUMvQixJQUFJLEVBQUUsSUFBSTthQUNYLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDNUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7Z0JBQ2hCLGFBQWEsRUFBRSxLQUFLLENBQUMsYUFBYTtnQkFDbEMsWUFBWSxFQUFFLEtBQUssQ0FBQyxZQUFZO2dCQUNoQyxpQkFBaUIsRUFBRSxLQUFLLENBQUMsaUJBQWlCLENBQUMsSUFBSTtnQkFDL0MsU0FBUyxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSTtnQkFDL0Isc0JBQXNCLEVBQUUsS0FBSyxDQUFDLHNCQUFzQjtnQkFDcEQsSUFBSSxFQUFFLElBQUk7Z0JBQ1YsUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRO2FBQ3pCLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELDBFQUEwRTtJQUNsRSxlQUFlLENBQUMsTUFBc0I7UUFDNUMsTUFBTSxFQUNKLFFBQVEsRUFBRSxjQUFjLEVBQUUsaUJBQWlCLEVBQUUsWUFBWSxFQUN6RCxlQUFlLEVBQUUsZ0JBQWdCLEVBQUUsbUJBQW1CLEVBQ3ZELEdBQUcsTUFBTSxDQUFDO1FBRVgsSUFBSSxDQUFDLFFBQVEsR0FBRyxnQkFBZ0IsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUM7UUFDcEUsSUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLElBQUksQ0FBQyxDQUFDO1FBRTFDLElBQUksUUFBUSxFQUFFO1lBQ1osSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7U0FDMUI7UUFFRCxJQUFJLGlCQUFpQixFQUFFO1lBQ3JCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxpQkFBaUIsQ0FBQztTQUM1QztRQUVELElBQUksWUFBWSxFQUFFO1lBQ2hCLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1NBQ2xDO1FBRUQsSUFBSSxlQUFlLEVBQUU7WUFDbkIsSUFBSSxDQUFDLGVBQWUsR0FBRyxlQUFlLENBQUM7U0FDeEM7UUFFRCxJQUFJLG1CQUFtQixFQUFFO1lBQ3ZCLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxtQkFBbUIsQ0FBQztTQUNoRDtJQUNILENBQUM7OztZQXBaRixTQUFTLFNBQUM7Z0JBQ1QsUUFBUSxFQUFFLFdBQVc7Z0JBQ3JCLFFBQVEsRUFBRSxTQUFTO2dCQUNuQixJQUFJLEVBQUU7b0JBQ0osT0FBTyxFQUFFLFVBQVU7b0JBQ25CLDJCQUEyQixFQUFFLFVBQVU7b0JBQ3ZDLDJCQUEyQixFQUFFLHVCQUF1QjtpQkFDckQ7Z0JBQ0QsU0FBUyxFQUFFLENBQUMsRUFBQyxPQUFPLEVBQUUsZUFBZSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUMsQ0FBQzthQUM5RDs7O1lBcERDLFVBQVU7NENBMktMLE1BQU0sU0FBQyxhQUFhLGNBQUcsUUFBUSxZQUFJLFFBQVE7NENBQzNDLE1BQU0sU0FBQyxRQUFRO1lBeEtwQixNQUFNO1lBTU4sZ0JBQWdCOzRDQW9LWCxRQUFRLFlBQUksTUFBTSxTQUFDLGVBQWU7WUFyTGpDLGNBQWMsdUJBc0xmLFFBQVE7WUF4SVAsUUFBUTtZQTFCZCxpQkFBaUI7Ozt1QkFnRGhCLGVBQWUsU0FBQyxlQUFzQixFQUFFLEVBQUMsV0FBVyxFQUFFLElBQUksRUFBQzsrQkFJM0QsWUFBWSxTQUFDLGdCQUF1QjttQ0FJcEMsWUFBWSxTQUFDLG9CQUEyQjttQkFHeEMsS0FBSyxTQUFDLGFBQWE7dUJBR25CLEtBQUssU0FBQyxpQkFBaUI7a0NBT3ZCLEtBQUssU0FBQyxvQkFBb0I7OEJBUTFCLEtBQUssU0FBQyxpQkFBaUI7NkJBTXZCLEtBQUssU0FBQyxtQkFBbUI7K0JBTXpCLEtBQUssU0FBQyx5QkFBeUI7dUJBRy9CLEtBQUssU0FBQyxpQkFBaUI7Z0NBZ0J2QixLQUFLLFNBQUMsMEJBQTBCOzJCQUdoQyxLQUFLLFNBQUMscUJBQXFCO3NCQUczQixNQUFNLFNBQUMsZ0JBQWdCO3VCQUd2QixNQUFNLFNBQUMsaUJBQWlCO29CQUl4QixNQUFNLFNBQUMsY0FBYztzQkFHckIsTUFBTSxTQUFDLGdCQUFnQjtxQkFJdkIsTUFBTSxTQUFDLGVBQWU7c0JBSXRCLE1BQU0sU0FBQyxnQkFBZ0I7b0JBT3ZCLE1BQU0sU0FBQyxjQUFjOztBQTRTeEIsdUVBQXVFO0FBQ3ZFLFNBQVMsMEJBQTBCLENBQUMsT0FBb0IsRUFBRSxRQUFnQjtJQUN4RSxJQUFJLGNBQWMsR0FBRyxPQUFPLENBQUMsYUFBbUMsQ0FBQztJQUVqRSxPQUFPLGNBQWMsRUFBRTtRQUNyQiwrRUFBK0U7UUFDL0UsSUFBSSxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDMUQsY0FBc0IsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUN2RCxPQUFPLGNBQWMsQ0FBQztTQUN2QjtRQUVELGNBQWMsR0FBRyxjQUFjLENBQUMsYUFBYSxDQUFDO0tBQy9DO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge1xuICBBZnRlclZpZXdJbml0LFxuICBDb250ZW50Q2hpbGQsXG4gIENvbnRlbnRDaGlsZHJlbixcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIEluamVjdCxcbiAgSW5wdXQsXG4gIE5nWm9uZSxcbiAgT25EZXN0cm95LFxuICBPcHRpb25hbCxcbiAgT3V0cHV0LFxuICBRdWVyeUxpc3QsXG4gIFNraXBTZWxmLFxuICBWaWV3Q29udGFpbmVyUmVmLFxuICBPbkNoYW5nZXMsXG4gIFNpbXBsZUNoYW5nZXMsXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBpc0Rldk1vZGUsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtcbiAgY29lcmNlQm9vbGVhblByb3BlcnR5LFxuICBjb2VyY2VOdW1iZXJQcm9wZXJ0eSxcbiAgY29lcmNlRWxlbWVudCxcbiAgQm9vbGVhbklucHV0XG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge09ic2VydmFibGUsIE9ic2VydmVyLCBTdWJqZWN0LCBtZXJnZX0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3N0YXJ0V2l0aCwgdGFrZSwgbWFwLCB0YWtlVW50aWwsIHN3aXRjaE1hcCwgdGFwfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge1xuICBDZGtEcmFnRHJvcCxcbiAgQ2RrRHJhZ0VuZCxcbiAgQ2RrRHJhZ0VudGVyLFxuICBDZGtEcmFnRXhpdCxcbiAgQ2RrRHJhZ01vdmUsXG4gIENka0RyYWdTdGFydCxcbiAgQ2RrRHJhZ1JlbGVhc2UsXG59IGZyb20gJy4uL2RyYWctZXZlbnRzJztcbmltcG9ydCB7Q0RLX0RSQUdfSEFORExFLCBDZGtEcmFnSGFuZGxlfSBmcm9tICcuL2RyYWctaGFuZGxlJztcbmltcG9ydCB7Q0RLX0RSQUdfUExBQ0VIT0xERVIsIENka0RyYWdQbGFjZWhvbGRlcn0gZnJvbSAnLi9kcmFnLXBsYWNlaG9sZGVyJztcbmltcG9ydCB7Q0RLX0RSQUdfUFJFVklFVywgQ2RrRHJhZ1ByZXZpZXd9IGZyb20gJy4vZHJhZy1wcmV2aWV3JztcbmltcG9ydCB7Q0RLX0RSQUdfUEFSRU5UfSBmcm9tICcuLi9kcmFnLXBhcmVudCc7XG5pbXBvcnQge0RyYWdSZWYsIFBvaW50fSBmcm9tICcuLi9kcmFnLXJlZic7XG5pbXBvcnQge0NES19EUk9QX0xJU1QsIENka0Ryb3BMaXN0SW50ZXJuYWwgYXMgQ2RrRHJvcExpc3R9IGZyb20gJy4vZHJvcC1saXN0JztcbmltcG9ydCB7RHJhZ0Ryb3B9IGZyb20gJy4uL2RyYWctZHJvcCc7XG5pbXBvcnQge0NES19EUkFHX0NPTkZJRywgRHJhZ0Ryb3BDb25maWcsIERyYWdTdGFydERlbGF5LCBEcmFnQXhpc30gZnJvbSAnLi9jb25maWcnO1xuXG4vKiogRWxlbWVudCB0aGF0IGNhbiBiZSBtb3ZlZCBpbnNpZGUgYSBDZGtEcm9wTGlzdCBjb250YWluZXIuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrRHJhZ10nLFxuICBleHBvcnRBczogJ2Nka0RyYWcnLFxuICBob3N0OiB7XG4gICAgJ2NsYXNzJzogJ2Nkay1kcmFnJyxcbiAgICAnW2NsYXNzLmNkay1kcmFnLWRpc2FibGVkXSc6ICdkaXNhYmxlZCcsXG4gICAgJ1tjbGFzcy5jZGstZHJhZy1kcmFnZ2luZ10nOiAnX2RyYWdSZWYuaXNEcmFnZ2luZygpJyxcbiAgfSxcbiAgcHJvdmlkZXJzOiBbe3Byb3ZpZGU6IENES19EUkFHX1BBUkVOVCwgdXNlRXhpc3Rpbmc6IENka0RyYWd9XVxufSlcbmV4cG9ydCBjbGFzcyBDZGtEcmFnPFQgPSBhbnk+IGltcGxlbWVudHMgQWZ0ZXJWaWV3SW5pdCwgT25DaGFuZ2VzLCBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9kZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIHVuZGVybHlpbmcgZHJhZyBpbnN0YW5jZS4gKi9cbiAgX2RyYWdSZWY6IERyYWdSZWY8Q2RrRHJhZzxUPj47XG5cbiAgLy8gVE9ETzogUmVtb3ZlIGNhc3Qgb25jZSBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL3B1bGwvMzc1MDYgaXMgYXZhaWxhYmxlLlxuICAvKiogRWxlbWVudHMgdGhhdCBjYW4gYmUgdXNlZCB0byBkcmFnIHRoZSBkcmFnZ2FibGUgaXRlbS4gKi9cbiAgQENvbnRlbnRDaGlsZHJlbihDREtfRFJBR19IQU5ETEUgYXMgYW55LCB7ZGVzY2VuZGFudHM6IHRydWV9KSBfaGFuZGxlczogUXVlcnlMaXN0PENka0RyYWdIYW5kbGU+O1xuXG4gIC8vIFRPRE86IFJlbW92ZSBjYXN0IG9uY2UgaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9wdWxsLzM3NTA2IGlzIGF2YWlsYWJsZS5cbiAgLyoqIEVsZW1lbnQgdGhhdCB3aWxsIGJlIHVzZWQgYXMgYSB0ZW1wbGF0ZSB0byBjcmVhdGUgdGhlIGRyYWdnYWJsZSBpdGVtJ3MgcHJldmlldy4gKi9cbiAgQENvbnRlbnRDaGlsZChDREtfRFJBR19QUkVWSUVXIGFzIGFueSkgX3ByZXZpZXdUZW1wbGF0ZTogQ2RrRHJhZ1ByZXZpZXc7XG5cbiAgLy8gVE9ETzogUmVtb3ZlIGNhc3Qgb25jZSBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL3B1bGwvMzc1MDYgaXMgYXZhaWxhYmxlLlxuICAvKiogVGVtcGxhdGUgZm9yIHBsYWNlaG9sZGVyIGVsZW1lbnQgcmVuZGVyZWQgdG8gc2hvdyB3aGVyZSBhIGRyYWdnYWJsZSB3b3VsZCBiZSBkcm9wcGVkLiAqL1xuICBAQ29udGVudENoaWxkKENES19EUkFHX1BMQUNFSE9MREVSIGFzIGFueSkgX3BsYWNlaG9sZGVyVGVtcGxhdGU6IENka0RyYWdQbGFjZWhvbGRlcjtcblxuICAvKiogQXJiaXRyYXJ5IGRhdGEgdG8gYXR0YWNoIHRvIHRoaXMgZHJhZyBpbnN0YW5jZS4gKi9cbiAgQElucHV0KCdjZGtEcmFnRGF0YScpIGRhdGE6IFQ7XG5cbiAgLyoqIExvY2tzIHRoZSBwb3NpdGlvbiBvZiB0aGUgZHJhZ2dlZCBlbGVtZW50IGFsb25nIHRoZSBzcGVjaWZpZWQgYXhpcy4gKi9cbiAgQElucHV0KCdjZGtEcmFnTG9ja0F4aXMnKSBsb2NrQXhpczogRHJhZ0F4aXM7XG5cbiAgLyoqXG4gICAqIFNlbGVjdG9yIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGRldGVybWluZSB0aGUgcm9vdCBkcmFnZ2FibGUgZWxlbWVudCwgc3RhcnRpbmcgZnJvbVxuICAgKiB0aGUgYGNka0RyYWdgIGVsZW1lbnQgYW5kIGdvaW5nIHVwIHRoZSBET00uIFBhc3NpbmcgYW4gYWx0ZXJuYXRlIHJvb3QgZWxlbWVudCBpcyB1c2VmdWxcbiAgICogd2hlbiB0cnlpbmcgdG8gZW5hYmxlIGRyYWdnaW5nIG9uIGFuIGVsZW1lbnQgdGhhdCB5b3UgbWlnaHQgbm90IGhhdmUgYWNjZXNzIHRvLlxuICAgKi9cbiAgQElucHV0KCdjZGtEcmFnUm9vdEVsZW1lbnQnKSByb290RWxlbWVudFNlbGVjdG9yOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIE5vZGUgb3Igc2VsZWN0b3IgdGhhdCB3aWxsIGJlIHVzZWQgdG8gZGV0ZXJtaW5lIHRoZSBlbGVtZW50IHRvIHdoaWNoIHRoZSBkcmFnZ2FibGUnc1xuICAgKiBwb3NpdGlvbiB3aWxsIGJlIGNvbnN0cmFpbmVkLiBJZiBhIHN0cmluZyBpcyBwYXNzZWQgaW4sIGl0J2xsIGJlIHVzZWQgYXMgYSBzZWxlY3RvciB0aGF0XG4gICAqIHdpbGwgYmUgbWF0Y2hlZCBzdGFydGluZyBmcm9tIHRoZSBlbGVtZW50J3MgcGFyZW50IGFuZCBnb2luZyB1cCB0aGUgRE9NIHVudGlsIGEgbWF0Y2hcbiAgICogaGFzIGJlZW4gZm91bmQuXG4gICAqL1xuICBASW5wdXQoJ2Nka0RyYWdCb3VuZGFyeScpIGJvdW5kYXJ5RWxlbWVudDogc3RyaW5nIHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBIVE1MRWxlbWVudDtcblxuICAvKipcbiAgICogQW1vdW50IG9mIG1pbGxpc2Vjb25kcyB0byB3YWl0IGFmdGVyIHRoZSB1c2VyIGhhcyBwdXQgdGhlaXJcbiAgICogcG9pbnRlciBkb3duIGJlZm9yZSBzdGFydGluZyB0byBkcmFnIHRoZSBlbGVtZW50LlxuICAgKi9cbiAgQElucHV0KCdjZGtEcmFnU3RhcnREZWxheScpIGRyYWdTdGFydERlbGF5OiBEcmFnU3RhcnREZWxheTtcblxuICAvKipcbiAgICogU2V0cyB0aGUgcG9zaXRpb24gb2YgYSBgQ2RrRHJhZ2AgdGhhdCBpcyBvdXRzaWRlIG9mIGEgZHJvcCBjb250YWluZXIuXG4gICAqIENhbiBiZSB1c2VkIHRvIHJlc3RvcmUgdGhlIGVsZW1lbnQncyBwb3NpdGlvbiBmb3IgYSByZXR1cm5pbmcgdXNlci5cbiAgICovXG4gIEBJbnB1dCgnY2RrRHJhZ0ZyZWVEcmFnUG9zaXRpb24nKSBmcmVlRHJhZ1Bvc2l0aW9uOiB7eDogbnVtYmVyLCB5OiBudW1iZXJ9O1xuXG4gIC8qKiBXaGV0aGVyIHN0YXJ0aW5nIHRvIGRyYWcgdGhpcyBlbGVtZW50IGlzIGRpc2FibGVkLiAqL1xuICBASW5wdXQoJ2Nka0RyYWdEaXNhYmxlZCcpXG4gIGdldCBkaXNhYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fZGlzYWJsZWQgfHwgKHRoaXMuZHJvcENvbnRhaW5lciAmJiB0aGlzLmRyb3BDb250YWluZXIuZGlzYWJsZWQpO1xuICB9XG4gIHNldCBkaXNhYmxlZCh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX2Rpc2FibGVkID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgICB0aGlzLl9kcmFnUmVmLmRpc2FibGVkID0gdGhpcy5fZGlzYWJsZWQ7XG4gIH1cbiAgcHJpdmF0ZSBfZGlzYWJsZWQ6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gY3VzdG9taXplIHRoZSBsb2dpYyBvZiBob3cgdGhlIHBvc2l0aW9uIG9mIHRoZSBkcmFnIGl0ZW1cbiAgICogaXMgbGltaXRlZCB3aGlsZSBpdCdzIGJlaW5nIGRyYWdnZWQuIEdldHMgY2FsbGVkIHdpdGggYSBwb2ludCBjb250YWluaW5nIHRoZSBjdXJyZW50IHBvc2l0aW9uXG4gICAqIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBvbiB0aGUgcGFnZSBhbmQgc2hvdWxkIHJldHVybiBhIHBvaW50IGRlc2NyaWJpbmcgd2hlcmUgdGhlIGl0ZW0gc2hvdWxkXG4gICAqIGJlIHJlbmRlcmVkLlxuICAgKi9cbiAgQElucHV0KCdjZGtEcmFnQ29uc3RyYWluUG9zaXRpb24nKSBjb25zdHJhaW5Qb3NpdGlvbj86IChwb2ludDogUG9pbnQsIGRyYWdSZWY6IERyYWdSZWYpID0+IFBvaW50O1xuXG4gIC8qKiBDbGFzcyB0byBiZSBhZGRlZCB0byB0aGUgcHJldmlldyBlbGVtZW50LiAqL1xuICBASW5wdXQoJ2Nka0RyYWdQcmV2aWV3Q2xhc3MnKSBwcmV2aWV3Q2xhc3M6IHN0cmluZyB8IHN0cmluZ1tdO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHN0YXJ0cyBkcmFnZ2luZyB0aGUgaXRlbS4gKi9cbiAgQE91dHB1dCgnY2RrRHJhZ1N0YXJ0ZWQnKSBzdGFydGVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ1N0YXJ0PiA9IG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ1N0YXJ0PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGhhcyByZWxlYXNlZCBhIGRyYWcgaXRlbSwgYmVmb3JlIGFueSBhbmltYXRpb25zIGhhdmUgc3RhcnRlZC4gKi9cbiAgQE91dHB1dCgnY2RrRHJhZ1JlbGVhc2VkJykgcmVsZWFzZWQ6IEV2ZW50RW1pdHRlcjxDZGtEcmFnUmVsZWFzZT4gPVxuICAgICAgbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnUmVsZWFzZT4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBzdG9wcyBkcmFnZ2luZyBhbiBpdGVtIGluIHRoZSBjb250YWluZXIuICovXG4gIEBPdXRwdXQoJ2Nka0RyYWdFbmRlZCcpIGVuZGVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0VuZD4gPSBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdFbmQ+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgaGFzIG1vdmVkIHRoZSBpdGVtIGludG8gYSBuZXcgY29udGFpbmVyLiAqL1xuICBAT3V0cHV0KCdjZGtEcmFnRW50ZXJlZCcpIGVudGVyZWQ6IEV2ZW50RW1pdHRlcjxDZGtEcmFnRW50ZXI8YW55Pj4gPVxuICAgICAgbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnRW50ZXI8YW55Pj4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciByZW1vdmVzIHRoZSBpdGVtIGl0cyBjb250YWluZXIgYnkgZHJhZ2dpbmcgaXQgaW50byBhbm90aGVyIGNvbnRhaW5lci4gKi9cbiAgQE91dHB1dCgnY2RrRHJhZ0V4aXRlZCcpIGV4aXRlZDogRXZlbnRFbWl0dGVyPENka0RyYWdFeGl0PGFueT4+ID1cbiAgICAgIG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0V4aXQ8YW55Pj4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBkcm9wcyB0aGUgaXRlbSBpbnNpZGUgYSBjb250YWluZXIuICovXG4gIEBPdXRwdXQoJ2Nka0RyYWdEcm9wcGVkJykgZHJvcHBlZDogRXZlbnRFbWl0dGVyPENka0RyYWdEcm9wPGFueT4+ID1cbiAgICAgIG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0Ryb3A8YW55Pj4oKTtcblxuICAvKipcbiAgICogRW1pdHMgYXMgdGhlIHVzZXIgaXMgZHJhZ2dpbmcgdGhlIGl0ZW0uIFVzZSB3aXRoIGNhdXRpb24sXG4gICAqIGJlY2F1c2UgdGhpcyBldmVudCB3aWxsIGZpcmUgZm9yIGV2ZXJ5IHBpeGVsIHRoYXQgdGhlIHVzZXIgaGFzIGRyYWdnZWQuXG4gICAqL1xuICBAT3V0cHV0KCdjZGtEcmFnTW92ZWQnKSBtb3ZlZDogT2JzZXJ2YWJsZTxDZGtEcmFnTW92ZTxUPj4gPVxuICAgICAgbmV3IE9ic2VydmFibGUoKG9ic2VydmVyOiBPYnNlcnZlcjxDZGtEcmFnTW92ZTxUPj4pID0+IHtcbiAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gdGhpcy5fZHJhZ1JlZi5tb3ZlZC5waXBlKG1hcChtb3ZlZEV2ZW50ID0+ICh7XG4gICAgICAgICAgc291cmNlOiB0aGlzLFxuICAgICAgICAgIHBvaW50ZXJQb3NpdGlvbjogbW92ZWRFdmVudC5wb2ludGVyUG9zaXRpb24sXG4gICAgICAgICAgZXZlbnQ6IG1vdmVkRXZlbnQuZXZlbnQsXG4gICAgICAgICAgZGVsdGE6IG1vdmVkRXZlbnQuZGVsdGEsXG4gICAgICAgICAgZGlzdGFuY2U6IG1vdmVkRXZlbnQuZGlzdGFuY2VcbiAgICAgICAgfSkpKS5zdWJzY3JpYmUob2JzZXJ2ZXIpO1xuXG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgIH07XG4gICAgICB9KTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKiBFbGVtZW50IHRoYXQgdGhlIGRyYWdnYWJsZSBpcyBhdHRhY2hlZCB0by4gKi9cbiAgICAgIHB1YmxpYyBlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICAgIC8qKiBEcm9wcGFibGUgY29udGFpbmVyIHRoYXQgdGhlIGRyYWdnYWJsZSBpcyBhIHBhcnQgb2YuICovXG4gICAgICBASW5qZWN0KENES19EUk9QX0xJU1QpIEBPcHRpb25hbCgpIEBTa2lwU2VsZigpIHB1YmxpYyBkcm9wQ29udGFpbmVyOiBDZGtEcm9wTGlzdCxcbiAgICAgIEBJbmplY3QoRE9DVU1FTlQpIHByaXZhdGUgX2RvY3VtZW50OiBhbnksIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgICAgcHJpdmF0ZSBfdmlld0NvbnRhaW5lclJlZjogVmlld0NvbnRhaW5lclJlZixcbiAgICAgIEBPcHRpb25hbCgpIEBJbmplY3QoQ0RLX0RSQUdfQ09ORklHKSBjb25maWc6IERyYWdEcm9wQ29uZmlnLFxuICAgICAgQE9wdGlvbmFsKCkgcHJpdmF0ZSBfZGlyOiBEaXJlY3Rpb25hbGl0eSwgZHJhZ0Ryb3A6IERyYWdEcm9wLFxuICAgICAgcHJpdmF0ZSBfY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmKSB7XG4gICAgdGhpcy5fZHJhZ1JlZiA9IGRyYWdEcm9wLmNyZWF0ZURyYWcoZWxlbWVudCwge1xuICAgICAgZHJhZ1N0YXJ0VGhyZXNob2xkOiBjb25maWcgJiYgY29uZmlnLmRyYWdTdGFydFRocmVzaG9sZCAhPSBudWxsID9cbiAgICAgICAgICBjb25maWcuZHJhZ1N0YXJ0VGhyZXNob2xkIDogNSxcbiAgICAgIHBvaW50ZXJEaXJlY3Rpb25DaGFuZ2VUaHJlc2hvbGQ6IGNvbmZpZyAmJiBjb25maWcucG9pbnRlckRpcmVjdGlvbkNoYW5nZVRocmVzaG9sZCAhPSBudWxsID9cbiAgICAgICAgICBjb25maWcucG9pbnRlckRpcmVjdGlvbkNoYW5nZVRocmVzaG9sZCA6IDUsXG4gICAgICB6SW5kZXg6IGNvbmZpZz8uekluZGV4XG4gICAgfSk7XG4gICAgdGhpcy5fZHJhZ1JlZi5kYXRhID0gdGhpcztcblxuICAgIGlmIChjb25maWcpIHtcbiAgICAgIHRoaXMuX2Fzc2lnbkRlZmF1bHRzKGNvbmZpZyk7XG4gICAgfVxuXG4gICAgLy8gTm90ZSB0aGF0IHVzdWFsbHkgdGhlIGNvbnRhaW5lciBpcyBhc3NpZ25lZCB3aGVuIHRoZSBkcm9wIGxpc3QgaXMgcGlja3MgdXAgdGhlIGl0ZW0sIGJ1dCBpblxuICAgIC8vIHNvbWUgY2FzZXMgKG1haW5seSB0cmFuc3BsYW50ZWQgdmlld3Mgd2l0aCBPblB1c2gsIHNlZSAjMTgzNDEpIHdlIG1heSBlbmQgdXAgaW4gYSBzaXR1YXRpb25cbiAgICAvLyB3aGVyZSB0aGVyZSBhcmUgbm8gaXRlbXMgb24gdGhlIGZpcnN0IGNoYW5nZSBkZXRlY3Rpb24gcGFzcywgYnV0IHRoZSBpdGVtcyBnZXQgcGlja2VkIHVwIGFzXG4gICAgLy8gc29vbiBhcyB0aGUgdXNlciB0cmlnZ2VycyBhbm90aGVyIHBhc3MgYnkgZHJhZ2dpbmcuIFRoaXMgaXMgYSBwcm9ibGVtLCBiZWNhdXNlIHRoZSBpdGVtIHdvdWxkXG4gICAgLy8gaGF2ZSB0byBzd2l0Y2ggZnJvbSBzdGFuZGFsb25lIG1vZGUgdG8gZHJhZyBtb2RlIGluIHRoZSBtaWRkbGUgb2YgdGhlIGRyYWdnaW5nIHNlcXVlbmNlIHdoaWNoXG4gICAgLy8gaXMgdG9vIGxhdGUgc2luY2UgdGhlIHR3byBtb2RlcyBzYXZlIGRpZmZlcmVudCBraW5kcyBvZiBpbmZvcm1hdGlvbi4gV2Ugd29yayBhcm91bmQgaXQgYnlcbiAgICAvLyBhc3NpZ25pbmcgdGhlIGRyb3AgY29udGFpbmVyIGJvdGggZnJvbSBoZXJlIGFuZCB0aGUgbGlzdC5cbiAgICBpZiAoZHJvcENvbnRhaW5lcikge1xuICAgICAgdGhpcy5fZHJhZ1JlZi5fd2l0aERyb3BDb250YWluZXIoZHJvcENvbnRhaW5lci5fZHJvcExpc3RSZWYpO1xuICAgICAgZHJvcENvbnRhaW5lci5hZGRJdGVtKHRoaXMpO1xuICAgIH1cblxuICAgIHRoaXMuX3N5bmNJbnB1dHModGhpcy5fZHJhZ1JlZik7XG4gICAgdGhpcy5faGFuZGxlRXZlbnRzKHRoaXMuX2RyYWdSZWYpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGVsZW1lbnQgdGhhdCBpcyBiZWluZyB1c2VkIGFzIGEgcGxhY2Vob2xkZXJcbiAgICogd2hpbGUgdGhlIGN1cnJlbnQgZWxlbWVudCBpcyBiZWluZyBkcmFnZ2VkLlxuICAgKi9cbiAgZ2V0UGxhY2Vob2xkZXJFbGVtZW50KCk6IEhUTUxFbGVtZW50IHtcbiAgICByZXR1cm4gdGhpcy5fZHJhZ1JlZi5nZXRQbGFjZWhvbGRlckVsZW1lbnQoKTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHRoZSByb290IGRyYWdnYWJsZSBlbGVtZW50LiAqL1xuICBnZXRSb290RWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX2RyYWdSZWYuZ2V0Um9vdEVsZW1lbnQoKTtcbiAgfVxuXG4gIC8qKiBSZXNldHMgYSBzdGFuZGFsb25lIGRyYWcgaXRlbSB0byBpdHMgaW5pdGlhbCBwb3NpdGlvbi4gKi9cbiAgcmVzZXQoKTogdm9pZCB7XG4gICAgdGhpcy5fZHJhZ1JlZi5yZXNldCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHBpeGVsIGNvb3JkaW5hdGVzIG9mIHRoZSBkcmFnZ2FibGUgb3V0c2lkZSBvZiBhIGRyb3AgY29udGFpbmVyLlxuICAgKi9cbiAgZ2V0RnJlZURyYWdQb3NpdGlvbigpOiB7cmVhZG9ubHkgeDogbnVtYmVyLCByZWFkb25seSB5OiBudW1iZXJ9IHtcbiAgICByZXR1cm4gdGhpcy5fZHJhZ1JlZi5nZXRGcmVlRHJhZ1Bvc2l0aW9uKCk7XG4gIH1cblxuICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgLy8gV2UgbmVlZCB0byB3YWl0IGZvciB0aGUgem9uZSB0byBzdGFiaWxpemUsIGluIG9yZGVyIGZvciB0aGUgcmVmZXJlbmNlXG4gICAgLy8gZWxlbWVudCB0byBiZSBpbiB0aGUgcHJvcGVyIHBsYWNlIGluIHRoZSBET00uIFRoaXMgaXMgbW9zdGx5IHJlbGV2YW50XG4gICAgLy8gZm9yIGRyYWdnYWJsZSBlbGVtZW50cyBpbnNpZGUgcG9ydGFscyBzaW5jZSB0aGV5IGdldCBzdGFtcGVkIG91dCBpblxuICAgIC8vIHRoZWlyIG9yaWdpbmFsIERPTSBwb3NpdGlvbiBhbmQgdGhlbiB0aGV5IGdldCB0cmFuc2ZlcnJlZCB0byB0aGUgcG9ydGFsLlxuICAgIHRoaXMuX25nWm9uZS5vblN0YWJsZS5hc09ic2VydmFibGUoKVxuICAgICAgLnBpcGUodGFrZSgxKSwgdGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpXG4gICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgdGhpcy5fdXBkYXRlUm9vdEVsZW1lbnQoKTtcblxuICAgICAgICAvLyBMaXN0ZW4gZm9yIGFueSBuZXdseS1hZGRlZCBoYW5kbGVzLlxuICAgICAgICB0aGlzLl9oYW5kbGVzLmNoYW5nZXMucGlwZShcbiAgICAgICAgICBzdGFydFdpdGgodGhpcy5faGFuZGxlcyksXG4gICAgICAgICAgLy8gU3luYyB0aGUgbmV3IGhhbmRsZXMgd2l0aCB0aGUgRHJhZ1JlZi5cbiAgICAgICAgICB0YXAoKGhhbmRsZXM6IFF1ZXJ5TGlzdDxDZGtEcmFnSGFuZGxlPikgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2hpbGRIYW5kbGVFbGVtZW50cyA9IGhhbmRsZXNcbiAgICAgICAgICAgICAgLmZpbHRlcihoYW5kbGUgPT4gaGFuZGxlLl9wYXJlbnREcmFnID09PSB0aGlzKVxuICAgICAgICAgICAgICAubWFwKGhhbmRsZSA9PiBoYW5kbGUuZWxlbWVudCk7XG4gICAgICAgICAgICB0aGlzLl9kcmFnUmVmLndpdGhIYW5kbGVzKGNoaWxkSGFuZGxlRWxlbWVudHMpO1xuICAgICAgICAgIH0pLFxuICAgICAgICAgIC8vIExpc3RlbiBpZiB0aGUgc3RhdGUgb2YgYW55IG9mIHRoZSBoYW5kbGVzIGNoYW5nZXMuXG4gICAgICAgICAgc3dpdGNoTWFwKChoYW5kbGVzOiBRdWVyeUxpc3Q8Q2RrRHJhZ0hhbmRsZT4pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBtZXJnZSguLi5oYW5kbGVzLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0uX3N0YXRlQ2hhbmdlcy5waXBlKHN0YXJ0V2l0aChpdGVtKSk7XG4gICAgICAgICAgICB9KSkgYXMgT2JzZXJ2YWJsZTxDZGtEcmFnSGFuZGxlPjtcbiAgICAgICAgICB9KSxcbiAgICAgICAgICB0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKVxuICAgICAgICApLnN1YnNjcmliZShoYW5kbGVJbnN0YW5jZSA9PiB7XG4gICAgICAgICAgLy8gRW5hYmxlZC9kaXNhYmxlIHRoZSBoYW5kbGUgdGhhdCBjaGFuZ2VkIGluIHRoZSBEcmFnUmVmLlxuICAgICAgICAgIGNvbnN0IGRyYWdSZWYgPSB0aGlzLl9kcmFnUmVmO1xuICAgICAgICAgIGNvbnN0IGhhbmRsZSA9IGhhbmRsZUluc3RhbmNlLmVsZW1lbnQubmF0aXZlRWxlbWVudDtcbiAgICAgICAgICBoYW5kbGVJbnN0YW5jZS5kaXNhYmxlZCA/IGRyYWdSZWYuZGlzYWJsZUhhbmRsZShoYW5kbGUpIDogZHJhZ1JlZi5lbmFibGVIYW5kbGUoaGFuZGxlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHRoaXMuZnJlZURyYWdQb3NpdGlvbikge1xuICAgICAgICAgIHRoaXMuX2RyYWdSZWYuc2V0RnJlZURyYWdQb3NpdGlvbih0aGlzLmZyZWVEcmFnUG9zaXRpb24pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpIHtcbiAgICBjb25zdCByb290U2VsZWN0b3JDaGFuZ2UgPSBjaGFuZ2VzWydyb290RWxlbWVudFNlbGVjdG9yJ107XG4gICAgY29uc3QgcG9zaXRpb25DaGFuZ2UgPSBjaGFuZ2VzWydmcmVlRHJhZ1Bvc2l0aW9uJ107XG5cbiAgICAvLyBXZSBkb24ndCBoYXZlIHRvIHJlYWN0IHRvIHRoZSBmaXJzdCBjaGFuZ2Ugc2luY2UgaXQncyBiZWluZ1xuICAgIC8vIGhhbmRsZWQgaW4gYG5nQWZ0ZXJWaWV3SW5pdGAgd2hlcmUgaXQgbmVlZHMgdG8gYmUgZGVmZXJyZWQuXG4gICAgaWYgKHJvb3RTZWxlY3RvckNoYW5nZSAmJiAhcm9vdFNlbGVjdG9yQ2hhbmdlLmZpcnN0Q2hhbmdlKSB7XG4gICAgICB0aGlzLl91cGRhdGVSb290RWxlbWVudCgpO1xuICAgIH1cblxuICAgIC8vIFNraXAgdGhlIGZpcnN0IGNoYW5nZSBzaW5jZSBpdCdzIGJlaW5nIGhhbmRsZWQgaW4gYG5nQWZ0ZXJWaWV3SW5pdGAuXG4gICAgaWYgKHBvc2l0aW9uQ2hhbmdlICYmICFwb3NpdGlvbkNoYW5nZS5maXJzdENoYW5nZSAmJiB0aGlzLmZyZWVEcmFnUG9zaXRpb24pIHtcbiAgICAgIHRoaXMuX2RyYWdSZWYuc2V0RnJlZURyYWdQb3NpdGlvbih0aGlzLmZyZWVEcmFnUG9zaXRpb24pO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIGlmICh0aGlzLmRyb3BDb250YWluZXIpIHtcbiAgICAgIHRoaXMuZHJvcENvbnRhaW5lci5yZW1vdmVJdGVtKHRoaXMpO1xuICAgIH1cblxuICAgIHRoaXMuX2Rlc3Ryb3llZC5uZXh0KCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fZHJhZ1JlZi5kaXNwb3NlKCk7XG4gIH1cblxuICAvKiogU3luY3MgdGhlIHJvb3QgZWxlbWVudCB3aXRoIHRoZSBgRHJhZ1JlZmAuICovXG4gIHByaXZhdGUgX3VwZGF0ZVJvb3RFbGVtZW50KCkge1xuICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudDtcbiAgICBjb25zdCByb290RWxlbWVudCA9IHRoaXMucm9vdEVsZW1lbnRTZWxlY3RvciA/XG4gICAgICAgIGdldENsb3Nlc3RNYXRjaGluZ0FuY2VzdG9yKGVsZW1lbnQsIHRoaXMucm9vdEVsZW1lbnRTZWxlY3RvcikgOiBlbGVtZW50O1xuXG4gICAgaWYgKHJvb3RFbGVtZW50ICYmIHJvb3RFbGVtZW50Lm5vZGVUeXBlICE9PSB0aGlzLl9kb2N1bWVudC5FTEVNRU5UX05PREUpIHtcbiAgICAgIHRocm93IEVycm9yKGBjZGtEcmFnIG11c3QgYmUgYXR0YWNoZWQgdG8gYW4gZWxlbWVudCBub2RlLiBgICtcbiAgICAgICAgICAgICAgICAgIGBDdXJyZW50bHkgYXR0YWNoZWQgdG8gXCIke3Jvb3RFbGVtZW50Lm5vZGVOYW1lfVwiLmApO1xuICAgIH1cblxuICAgIHRoaXMuX2RyYWdSZWYud2l0aFJvb3RFbGVtZW50KHJvb3RFbGVtZW50IHx8IGVsZW1lbnQpO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIGJvdW5kYXJ5IGVsZW1lbnQsIGJhc2VkIG9uIHRoZSBgYm91bmRhcnlFbGVtZW50YCB2YWx1ZS4gKi9cbiAgcHJpdmF0ZSBfZ2V0Qm91bmRhcnlFbGVtZW50KCkge1xuICAgIGNvbnN0IGJvdW5kYXJ5ID0gdGhpcy5ib3VuZGFyeUVsZW1lbnQ7XG5cbiAgICBpZiAoIWJvdW5kYXJ5KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGJvdW5kYXJ5ID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIGdldENsb3Nlc3RNYXRjaGluZ0FuY2VzdG9yKHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50LCBib3VuZGFyeSk7XG4gICAgfVxuXG4gICAgY29uc3QgZWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoYm91bmRhcnkpO1xuXG4gICAgaWYgKGlzRGV2TW9kZSgpICYmICFlbGVtZW50LmNvbnRhaW5zKHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50KSkge1xuICAgICAgdGhyb3cgRXJyb3IoJ0RyYWdnYWJsZSBlbGVtZW50IGlzIG5vdCBpbnNpZGUgb2YgdGhlIG5vZGUgcGFzc2VkIGludG8gY2RrRHJhZ0JvdW5kYXJ5LicpO1xuICAgIH1cblxuICAgIHJldHVybiBlbGVtZW50O1xuICB9XG5cbiAgLyoqIFN5bmNzIHRoZSBpbnB1dHMgb2YgdGhlIENka0RyYWcgd2l0aCB0aGUgb3B0aW9ucyBvZiB0aGUgdW5kZXJseWluZyBEcmFnUmVmLiAqL1xuICBwcml2YXRlIF9zeW5jSW5wdXRzKHJlZjogRHJhZ1JlZjxDZGtEcmFnPFQ+Pikge1xuICAgIHJlZi5iZWZvcmVTdGFydGVkLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICBpZiAoIXJlZi5pc0RyYWdnaW5nKCkpIHtcbiAgICAgICAgY29uc3QgZGlyID0gdGhpcy5fZGlyO1xuICAgICAgICBjb25zdCBkcmFnU3RhcnREZWxheSA9IHRoaXMuZHJhZ1N0YXJ0RGVsYXk7XG4gICAgICAgIGNvbnN0IHBsYWNlaG9sZGVyID0gdGhpcy5fcGxhY2Vob2xkZXJUZW1wbGF0ZSA/IHtcbiAgICAgICAgICB0ZW1wbGF0ZTogdGhpcy5fcGxhY2Vob2xkZXJUZW1wbGF0ZS50ZW1wbGF0ZVJlZixcbiAgICAgICAgICBjb250ZXh0OiB0aGlzLl9wbGFjZWhvbGRlclRlbXBsYXRlLmRhdGEsXG4gICAgICAgICAgdmlld0NvbnRhaW5lcjogdGhpcy5fdmlld0NvbnRhaW5lclJlZlxuICAgICAgICB9IDogbnVsbDtcbiAgICAgICAgY29uc3QgcHJldmlldyA9IHRoaXMuX3ByZXZpZXdUZW1wbGF0ZSA/IHtcbiAgICAgICAgICB0ZW1wbGF0ZTogdGhpcy5fcHJldmlld1RlbXBsYXRlLnRlbXBsYXRlUmVmLFxuICAgICAgICAgIGNvbnRleHQ6IHRoaXMuX3ByZXZpZXdUZW1wbGF0ZS5kYXRhLFxuICAgICAgICAgIG1hdGNoU2l6ZTogdGhpcy5fcHJldmlld1RlbXBsYXRlLm1hdGNoU2l6ZSxcbiAgICAgICAgICB2aWV3Q29udGFpbmVyOiB0aGlzLl92aWV3Q29udGFpbmVyUmVmXG4gICAgICAgIH0gOiBudWxsO1xuXG4gICAgICAgIHJlZi5kaXNhYmxlZCA9IHRoaXMuZGlzYWJsZWQ7XG4gICAgICAgIHJlZi5sb2NrQXhpcyA9IHRoaXMubG9ja0F4aXM7XG4gICAgICAgIHJlZi5kcmFnU3RhcnREZWxheSA9ICh0eXBlb2YgZHJhZ1N0YXJ0RGVsYXkgPT09ICdvYmplY3QnICYmIGRyYWdTdGFydERlbGF5KSA/XG4gICAgICAgICAgICBkcmFnU3RhcnREZWxheSA6IGNvZXJjZU51bWJlclByb3BlcnR5KGRyYWdTdGFydERlbGF5KTtcbiAgICAgICAgcmVmLmNvbnN0cmFpblBvc2l0aW9uID0gdGhpcy5jb25zdHJhaW5Qb3NpdGlvbjtcbiAgICAgICAgcmVmLnByZXZpZXdDbGFzcyA9IHRoaXMucHJldmlld0NsYXNzO1xuICAgICAgICByZWZcbiAgICAgICAgICAud2l0aEJvdW5kYXJ5RWxlbWVudCh0aGlzLl9nZXRCb3VuZGFyeUVsZW1lbnQoKSlcbiAgICAgICAgICAud2l0aFBsYWNlaG9sZGVyVGVtcGxhdGUocGxhY2Vob2xkZXIpXG4gICAgICAgICAgLndpdGhQcmV2aWV3VGVtcGxhdGUocHJldmlldyk7XG5cbiAgICAgICAgaWYgKGRpcikge1xuICAgICAgICAgIHJlZi53aXRoRGlyZWN0aW9uKGRpci52YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBIYW5kbGVzIHRoZSBldmVudHMgZnJvbSB0aGUgdW5kZXJseWluZyBgRHJhZ1JlZmAuICovXG4gIHByaXZhdGUgX2hhbmRsZUV2ZW50cyhyZWY6IERyYWdSZWY8Q2RrRHJhZzxUPj4pIHtcbiAgICByZWYuc3RhcnRlZC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgdGhpcy5zdGFydGVkLmVtaXQoe3NvdXJjZTogdGhpc30pO1xuXG4gICAgICAvLyBTaW5jZSBhbGwgb2YgdGhlc2UgZXZlbnRzIHJ1biBvdXRzaWRlIG9mIGNoYW5nZSBkZXRlY3Rpb24sXG4gICAgICAvLyB3ZSBuZWVkIHRvIGVuc3VyZSB0aGF0IGV2ZXJ5dGhpbmcgaXMgbWFya2VkIGNvcnJlY3RseS5cbiAgICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICAgIH0pO1xuXG4gICAgcmVmLnJlbGVhc2VkLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICB0aGlzLnJlbGVhc2VkLmVtaXQoe3NvdXJjZTogdGhpc30pO1xuICAgIH0pO1xuXG4gICAgcmVmLmVuZGVkLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICB0aGlzLmVuZGVkLmVtaXQoe3NvdXJjZTogdGhpcywgZGlzdGFuY2U6IGV2ZW50LmRpc3RhbmNlfSk7XG5cbiAgICAgIC8vIFNpbmNlIGFsbCBvZiB0aGVzZSBldmVudHMgcnVuIG91dHNpZGUgb2YgY2hhbmdlIGRldGVjdGlvbixcbiAgICAgIC8vIHdlIG5lZWQgdG8gZW5zdXJlIHRoYXQgZXZlcnl0aGluZyBpcyBtYXJrZWQgY29ycmVjdGx5LlxuICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgfSk7XG5cbiAgICByZWYuZW50ZXJlZC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgdGhpcy5lbnRlcmVkLmVtaXQoe1xuICAgICAgICBjb250YWluZXI6IGV2ZW50LmNvbnRhaW5lci5kYXRhLFxuICAgICAgICBpdGVtOiB0aGlzLFxuICAgICAgICBjdXJyZW50SW5kZXg6IGV2ZW50LmN1cnJlbnRJbmRleFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZWYuZXhpdGVkLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICB0aGlzLmV4aXRlZC5lbWl0KHtcbiAgICAgICAgY29udGFpbmVyOiBldmVudC5jb250YWluZXIuZGF0YSxcbiAgICAgICAgaXRlbTogdGhpc1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZWYuZHJvcHBlZC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgdGhpcy5kcm9wcGVkLmVtaXQoe1xuICAgICAgICBwcmV2aW91c0luZGV4OiBldmVudC5wcmV2aW91c0luZGV4LFxuICAgICAgICBjdXJyZW50SW5kZXg6IGV2ZW50LmN1cnJlbnRJbmRleCxcbiAgICAgICAgcHJldmlvdXNDb250YWluZXI6IGV2ZW50LnByZXZpb3VzQ29udGFpbmVyLmRhdGEsXG4gICAgICAgIGNvbnRhaW5lcjogZXZlbnQuY29udGFpbmVyLmRhdGEsXG4gICAgICAgIGlzUG9pbnRlck92ZXJDb250YWluZXI6IGV2ZW50LmlzUG9pbnRlck92ZXJDb250YWluZXIsXG4gICAgICAgIGl0ZW06IHRoaXMsXG4gICAgICAgIGRpc3RhbmNlOiBldmVudC5kaXN0YW5jZVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogQXNzaWducyB0aGUgZGVmYXVsdCBpbnB1dCB2YWx1ZXMgYmFzZWQgb24gYSBwcm92aWRlZCBjb25maWcgb2JqZWN0LiAqL1xuICBwcml2YXRlIF9hc3NpZ25EZWZhdWx0cyhjb25maWc6IERyYWdEcm9wQ29uZmlnKSB7XG4gICAgY29uc3Qge1xuICAgICAgbG9ja0F4aXMsIGRyYWdTdGFydERlbGF5LCBjb25zdHJhaW5Qb3NpdGlvbiwgcHJldmlld0NsYXNzLFxuICAgICAgYm91bmRhcnlFbGVtZW50LCBkcmFnZ2luZ0Rpc2FibGVkLCByb290RWxlbWVudFNlbGVjdG9yXG4gICAgfSA9IGNvbmZpZztcblxuICAgIHRoaXMuZGlzYWJsZWQgPSBkcmFnZ2luZ0Rpc2FibGVkID09IG51bGwgPyBmYWxzZSA6IGRyYWdnaW5nRGlzYWJsZWQ7XG4gICAgdGhpcy5kcmFnU3RhcnREZWxheSA9IGRyYWdTdGFydERlbGF5IHx8IDA7XG5cbiAgICBpZiAobG9ja0F4aXMpIHtcbiAgICAgIHRoaXMubG9ja0F4aXMgPSBsb2NrQXhpcztcbiAgICB9XG5cbiAgICBpZiAoY29uc3RyYWluUG9zaXRpb24pIHtcbiAgICAgIHRoaXMuY29uc3RyYWluUG9zaXRpb24gPSBjb25zdHJhaW5Qb3NpdGlvbjtcbiAgICB9XG5cbiAgICBpZiAocHJldmlld0NsYXNzKSB7XG4gICAgICB0aGlzLnByZXZpZXdDbGFzcyA9IHByZXZpZXdDbGFzcztcbiAgICB9XG5cbiAgICBpZiAoYm91bmRhcnlFbGVtZW50KSB7XG4gICAgICB0aGlzLmJvdW5kYXJ5RWxlbWVudCA9IGJvdW5kYXJ5RWxlbWVudDtcbiAgICB9XG5cbiAgICBpZiAocm9vdEVsZW1lbnRTZWxlY3Rvcikge1xuICAgICAgdGhpcy5yb290RWxlbWVudFNlbGVjdG9yID0gcm9vdEVsZW1lbnRTZWxlY3RvcjtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfZGlzYWJsZWQ6IEJvb2xlYW5JbnB1dDtcbn1cblxuLyoqIEdldHMgdGhlIGNsb3Nlc3QgYW5jZXN0b3Igb2YgYW4gZWxlbWVudCB0aGF0IG1hdGNoZXMgYSBzZWxlY3Rvci4gKi9cbmZ1bmN0aW9uIGdldENsb3Nlc3RNYXRjaGluZ0FuY2VzdG9yKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBzZWxlY3Rvcjogc3RyaW5nKSB7XG4gIGxldCBjdXJyZW50RWxlbWVudCA9IGVsZW1lbnQucGFyZW50RWxlbWVudCBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG5cbiAgd2hpbGUgKGN1cnJlbnRFbGVtZW50KSB7XG4gICAgLy8gSUUgZG9lc24ndCBzdXBwb3J0IGBtYXRjaGVzYCBzbyB3ZSBoYXZlIHRvIGZhbGwgYmFjayB0byBgbXNNYXRjaGVzU2VsZWN0b3JgLlxuICAgIGlmIChjdXJyZW50RWxlbWVudC5tYXRjaGVzID8gY3VycmVudEVsZW1lbnQubWF0Y2hlcyhzZWxlY3RvcikgOlxuICAgICAgICAoY3VycmVudEVsZW1lbnQgYXMgYW55KS5tc01hdGNoZXNTZWxlY3RvcihzZWxlY3RvcikpIHtcbiAgICAgIHJldHVybiBjdXJyZW50RWxlbWVudDtcbiAgICB9XG5cbiAgICBjdXJyZW50RWxlbWVudCA9IGN1cnJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQ7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuIl19