/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
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
export const CDK_DROP_LIST = new InjectionToken('CDK_DROP_LIST');
/** Element that can be moved inside a CdkDropList container. */
let CdkDrag = /** @class */ (() => {
    class CdkDrag {
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
         * @deprecated No longer being used to be removed.
         * @breaking-change 11.0.0
         */
        getPlaceholderElement() {
            return this._dragRef.getPlaceholderElement();
        }
        /**
         * Returns the root draggable element.
         * @deprecated No longer being used to be removed.
         * @breaking-change 11.0.0
         */
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
})();
export { CdkDrag };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2RpcmVjdGl2ZXMvZHJhZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFFTCxZQUFZLEVBQ1osZUFBZSxFQUNmLFNBQVMsRUFDVCxVQUFVLEVBQ1YsWUFBWSxFQUNaLE1BQU0sRUFDTixjQUFjLEVBQ2QsS0FBSyxFQUNMLE1BQU0sRUFFTixRQUFRLEVBQ1IsTUFBTSxFQUNOLFNBQVMsRUFDVCxRQUFRLEVBQ1IsZ0JBQWdCLEVBR2hCLGlCQUFpQixFQUNqQixTQUFTLEdBQ1YsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUNMLHFCQUFxQixFQUNyQixvQkFBb0IsRUFDcEIsYUFBYSxFQUVkLE1BQU0sdUJBQXVCLENBQUM7QUFDL0IsT0FBTyxFQUFDLFVBQVUsRUFBWSxPQUFPLEVBQUUsS0FBSyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQzFELE9BQU8sRUFBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBVS9FLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDNUMsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDdEQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUcvQyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQ3RDLE9BQU8sRUFBQyxlQUFlLEVBQTJD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LENBQUMsYUFBYSxDQUFDO0tBQy9DO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge1xuICBBZnRlclZpZXdJbml0LFxuICBDb250ZW50Q2hpbGQsXG4gIENvbnRlbnRDaGlsZHJlbixcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIEluamVjdCxcbiAgSW5qZWN0aW9uVG9rZW4sXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgT3B0aW9uYWwsXG4gIE91dHB1dCxcbiAgUXVlcnlMaXN0LFxuICBTa2lwU2VsZixcbiAgVmlld0NvbnRhaW5lclJlZixcbiAgT25DaGFuZ2VzLFxuICBTaW1wbGVDaGFuZ2VzLFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgaXNEZXZNb2RlLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7XG4gIGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSxcbiAgY29lcmNlTnVtYmVyUHJvcGVydHksXG4gIGNvZXJjZUVsZW1lbnQsXG4gIEJvb2xlYW5JbnB1dFxufSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBPYnNlcnZlciwgU3ViamVjdCwgbWVyZ2V9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtzdGFydFdpdGgsIHRha2UsIG1hcCwgdGFrZVVudGlsLCBzd2l0Y2hNYXAsIHRhcH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtcbiAgQ2RrRHJhZ0Ryb3AsXG4gIENka0RyYWdFbmQsXG4gIENka0RyYWdFbnRlcixcbiAgQ2RrRHJhZ0V4aXQsXG4gIENka0RyYWdNb3ZlLFxuICBDZGtEcmFnU3RhcnQsXG4gIENka0RyYWdSZWxlYXNlLFxufSBmcm9tICcuLi9kcmFnLWV2ZW50cyc7XG5pbXBvcnQge0Nka0RyYWdIYW5kbGV9IGZyb20gJy4vZHJhZy1oYW5kbGUnO1xuaW1wb3J0IHtDZGtEcmFnUGxhY2Vob2xkZXJ9IGZyb20gJy4vZHJhZy1wbGFjZWhvbGRlcic7XG5pbXBvcnQge0Nka0RyYWdQcmV2aWV3fSBmcm9tICcuL2RyYWctcHJldmlldyc7XG5pbXBvcnQge0NES19EUkFHX1BBUkVOVH0gZnJvbSAnLi4vZHJhZy1wYXJlbnQnO1xuaW1wb3J0IHtEcmFnUmVmLCBQb2ludH0gZnJvbSAnLi4vZHJhZy1yZWYnO1xuaW1wb3J0IHtDZGtEcm9wTGlzdEludGVybmFsIGFzIENka0Ryb3BMaXN0fSBmcm9tICcuL2Ryb3AtbGlzdCc7XG5pbXBvcnQge0RyYWdEcm9wfSBmcm9tICcuLi9kcmFnLWRyb3AnO1xuaW1wb3J0IHtDREtfRFJBR19DT05GSUcsIERyYWdEcm9wQ29uZmlnLCBEcmFnU3RhcnREZWxheSwgRHJhZ0F4aXN9IGZyb20gJy4vY29uZmlnJztcblxuLyoqXG4gKiBJbmplY3Rpb24gdG9rZW4gdGhhdCBpcyB1c2VkIHRvIHByb3ZpZGUgYSBDZGtEcm9wTGlzdCBpbnN0YW5jZSB0byBDZGtEcmFnLlxuICogVXNlZCBmb3IgYXZvaWRpbmcgY2lyY3VsYXIgaW1wb3J0cy5cbiAqL1xuZXhwb3J0IGNvbnN0IENES19EUk9QX0xJU1QgPSBuZXcgSW5qZWN0aW9uVG9rZW48Q2RrRHJvcExpc3Q+KCdDREtfRFJPUF9MSVNUJyk7XG5cbi8qKiBFbGVtZW50IHRoYXQgY2FuIGJlIG1vdmVkIGluc2lkZSBhIENka0Ryb3BMaXN0IGNvbnRhaW5lci4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtEcmFnXScsXG4gIGV4cG9ydEFzOiAnY2RrRHJhZycsXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLWRyYWcnLFxuICAgICdbY2xhc3MuY2RrLWRyYWctZGlzYWJsZWRdJzogJ2Rpc2FibGVkJyxcbiAgICAnW2NsYXNzLmNkay1kcmFnLWRyYWdnaW5nXSc6ICdfZHJhZ1JlZi5pc0RyYWdnaW5nKCknLFxuICB9LFxuICBwcm92aWRlcnM6IFt7cHJvdmlkZTogQ0RLX0RSQUdfUEFSRU5ULCB1c2VFeGlzdGluZzogQ2RrRHJhZ31dXG59KVxuZXhwb3J0IGNsYXNzIENka0RyYWc8VCA9IGFueT4gaW1wbGVtZW50cyBBZnRlclZpZXdJbml0LCBPbkNoYW5nZXMsIE9uRGVzdHJveSB7XG4gIHByaXZhdGUgX2Rlc3Ryb3llZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgdW5kZXJseWluZyBkcmFnIGluc3RhbmNlLiAqL1xuICBfZHJhZ1JlZjogRHJhZ1JlZjxDZGtEcmFnPFQ+PjtcblxuICAvKiogRWxlbWVudHMgdGhhdCBjYW4gYmUgdXNlZCB0byBkcmFnIHRoZSBkcmFnZ2FibGUgaXRlbS4gKi9cbiAgQENvbnRlbnRDaGlsZHJlbihDZGtEcmFnSGFuZGxlLCB7ZGVzY2VuZGFudHM6IHRydWV9KSBfaGFuZGxlczogUXVlcnlMaXN0PENka0RyYWdIYW5kbGU+O1xuXG4gIC8qKiBFbGVtZW50IHRoYXQgd2lsbCBiZSB1c2VkIGFzIGEgdGVtcGxhdGUgdG8gY3JlYXRlIHRoZSBkcmFnZ2FibGUgaXRlbSdzIHByZXZpZXcuICovXG4gIEBDb250ZW50Q2hpbGQoQ2RrRHJhZ1ByZXZpZXcpIF9wcmV2aWV3VGVtcGxhdGU6IENka0RyYWdQcmV2aWV3O1xuXG4gIC8qKiBUZW1wbGF0ZSBmb3IgcGxhY2Vob2xkZXIgZWxlbWVudCByZW5kZXJlZCB0byBzaG93IHdoZXJlIGEgZHJhZ2dhYmxlIHdvdWxkIGJlIGRyb3BwZWQuICovXG4gIEBDb250ZW50Q2hpbGQoQ2RrRHJhZ1BsYWNlaG9sZGVyKSBfcGxhY2Vob2xkZXJUZW1wbGF0ZTogQ2RrRHJhZ1BsYWNlaG9sZGVyO1xuXG4gIC8qKiBBcmJpdHJhcnkgZGF0YSB0byBhdHRhY2ggdG8gdGhpcyBkcmFnIGluc3RhbmNlLiAqL1xuICBASW5wdXQoJ2Nka0RyYWdEYXRhJykgZGF0YTogVDtcblxuICAvKiogTG9ja3MgdGhlIHBvc2l0aW9uIG9mIHRoZSBkcmFnZ2VkIGVsZW1lbnQgYWxvbmcgdGhlIHNwZWNpZmllZCBheGlzLiAqL1xuICBASW5wdXQoJ2Nka0RyYWdMb2NrQXhpcycpIGxvY2tBeGlzOiBEcmFnQXhpcztcblxuICAvKipcbiAgICogU2VsZWN0b3IgdGhhdCB3aWxsIGJlIHVzZWQgdG8gZGV0ZXJtaW5lIHRoZSByb290IGRyYWdnYWJsZSBlbGVtZW50LCBzdGFydGluZyBmcm9tXG4gICAqIHRoZSBgY2RrRHJhZ2AgZWxlbWVudCBhbmQgZ29pbmcgdXAgdGhlIERPTS4gUGFzc2luZyBhbiBhbHRlcm5hdGUgcm9vdCBlbGVtZW50IGlzIHVzZWZ1bFxuICAgKiB3aGVuIHRyeWluZyB0byBlbmFibGUgZHJhZ2dpbmcgb24gYW4gZWxlbWVudCB0aGF0IHlvdSBtaWdodCBub3QgaGF2ZSBhY2Nlc3MgdG8uXG4gICAqL1xuICBASW5wdXQoJ2Nka0RyYWdSb290RWxlbWVudCcpIHJvb3RFbGVtZW50U2VsZWN0b3I6IHN0cmluZztcblxuICAvKipcbiAgICogTm9kZSBvciBzZWxlY3RvciB0aGF0IHdpbGwgYmUgdXNlZCB0byBkZXRlcm1pbmUgdGhlIGVsZW1lbnQgdG8gd2hpY2ggdGhlIGRyYWdnYWJsZSdzXG4gICAqIHBvc2l0aW9uIHdpbGwgYmUgY29uc3RyYWluZWQuIElmIGEgc3RyaW5nIGlzIHBhc3NlZCBpbiwgaXQnbGwgYmUgdXNlZCBhcyBhIHNlbGVjdG9yIHRoYXRcbiAgICogd2lsbCBiZSBtYXRjaGVkIHN0YXJ0aW5nIGZyb20gdGhlIGVsZW1lbnQncyBwYXJlbnQgYW5kIGdvaW5nIHVwIHRoZSBET00gdW50aWwgYSBtYXRjaFxuICAgKiBoYXMgYmVlbiBmb3VuZC5cbiAgICovXG4gIEBJbnB1dCgnY2RrRHJhZ0JvdW5kYXJ5JykgYm91bmRhcnlFbGVtZW50OiBzdHJpbmcgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiB8IEhUTUxFbGVtZW50O1xuXG4gIC8qKlxuICAgKiBBbW91bnQgb2YgbWlsbGlzZWNvbmRzIHRvIHdhaXQgYWZ0ZXIgdGhlIHVzZXIgaGFzIHB1dCB0aGVpclxuICAgKiBwb2ludGVyIGRvd24gYmVmb3JlIHN0YXJ0aW5nIHRvIGRyYWcgdGhlIGVsZW1lbnQuXG4gICAqL1xuICBASW5wdXQoJ2Nka0RyYWdTdGFydERlbGF5JykgZHJhZ1N0YXJ0RGVsYXk6IERyYWdTdGFydERlbGF5O1xuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBwb3NpdGlvbiBvZiBhIGBDZGtEcmFnYCB0aGF0IGlzIG91dHNpZGUgb2YgYSBkcm9wIGNvbnRhaW5lci5cbiAgICogQ2FuIGJlIHVzZWQgdG8gcmVzdG9yZSB0aGUgZWxlbWVudCdzIHBvc2l0aW9uIGZvciBhIHJldHVybmluZyB1c2VyLlxuICAgKi9cbiAgQElucHV0KCdjZGtEcmFnRnJlZURyYWdQb3NpdGlvbicpIGZyZWVEcmFnUG9zaXRpb246IHt4OiBudW1iZXIsIHk6IG51bWJlcn07XG5cbiAgLyoqIFdoZXRoZXIgc3RhcnRpbmcgdG8gZHJhZyB0aGlzIGVsZW1lbnQgaXMgZGlzYWJsZWQuICovXG4gIEBJbnB1dCgnY2RrRHJhZ0Rpc2FibGVkJylcbiAgZ2V0IGRpc2FibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9kaXNhYmxlZCB8fCAodGhpcy5kcm9wQ29udGFpbmVyICYmIHRoaXMuZHJvcENvbnRhaW5lci5kaXNhYmxlZCk7XG4gIH1cbiAgc2V0IGRpc2FibGVkKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5fZGlzYWJsZWQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICAgIHRoaXMuX2RyYWdSZWYuZGlzYWJsZWQgPSB0aGlzLl9kaXNhYmxlZDtcbiAgfVxuICBwcml2YXRlIF9kaXNhYmxlZDogYm9vbGVhbjtcblxuICAvKipcbiAgICogRnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB0byBjdXN0b21pemUgdGhlIGxvZ2ljIG9mIGhvdyB0aGUgcG9zaXRpb24gb2YgdGhlIGRyYWcgaXRlbVxuICAgKiBpcyBsaW1pdGVkIHdoaWxlIGl0J3MgYmVpbmcgZHJhZ2dlZC4gR2V0cyBjYWxsZWQgd2l0aCBhIHBvaW50IGNvbnRhaW5pbmcgdGhlIGN1cnJlbnQgcG9zaXRpb25cbiAgICogb2YgdGhlIHVzZXIncyBwb2ludGVyIG9uIHRoZSBwYWdlIGFuZCBzaG91bGQgcmV0dXJuIGEgcG9pbnQgZGVzY3JpYmluZyB3aGVyZSB0aGUgaXRlbSBzaG91bGRcbiAgICogYmUgcmVuZGVyZWQuXG4gICAqL1xuICBASW5wdXQoJ2Nka0RyYWdDb25zdHJhaW5Qb3NpdGlvbicpIGNvbnN0cmFpblBvc2l0aW9uPzogKHBvaW50OiBQb2ludCwgZHJhZ1JlZjogRHJhZ1JlZikgPT4gUG9pbnQ7XG5cbiAgLyoqIENsYXNzIHRvIGJlIGFkZGVkIHRvIHRoZSBwcmV2aWV3IGVsZW1lbnQuICovXG4gIEBJbnB1dCgnY2RrRHJhZ1ByZXZpZXdDbGFzcycpIHByZXZpZXdDbGFzczogc3RyaW5nIHwgc3RyaW5nW107XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgc3RhcnRzIGRyYWdnaW5nIHRoZSBpdGVtLiAqL1xuICBAT3V0cHV0KCdjZGtEcmFnU3RhcnRlZCcpIHN0YXJ0ZWQ6IEV2ZW50RW1pdHRlcjxDZGtEcmFnU3RhcnQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnU3RhcnQ+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgaGFzIHJlbGVhc2VkIGEgZHJhZyBpdGVtLCBiZWZvcmUgYW55IGFuaW1hdGlvbnMgaGF2ZSBzdGFydGVkLiAqL1xuICBAT3V0cHV0KCdjZGtEcmFnUmVsZWFzZWQnKSByZWxlYXNlZDogRXZlbnRFbWl0dGVyPENka0RyYWdSZWxlYXNlPiA9XG4gICAgICBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdSZWxlYXNlPigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHN0b3BzIGRyYWdnaW5nIGFuIGl0ZW0gaW4gdGhlIGNvbnRhaW5lci4gKi9cbiAgQE91dHB1dCgnY2RrRHJhZ0VuZGVkJykgZW5kZWQ6IEV2ZW50RW1pdHRlcjxDZGtEcmFnRW5kPiA9IG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0VuZD4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBoYXMgbW92ZWQgdGhlIGl0ZW0gaW50byBhIG5ldyBjb250YWluZXIuICovXG4gIEBPdXRwdXQoJ2Nka0RyYWdFbnRlcmVkJykgZW50ZXJlZDogRXZlbnRFbWl0dGVyPENka0RyYWdFbnRlcjxhbnk+PiA9XG4gICAgICBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdFbnRlcjxhbnk+PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHJlbW92ZXMgdGhlIGl0ZW0gaXRzIGNvbnRhaW5lciBieSBkcmFnZ2luZyBpdCBpbnRvIGFub3RoZXIgY29udGFpbmVyLiAqL1xuICBAT3V0cHV0KCdjZGtEcmFnRXhpdGVkJykgZXhpdGVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0V4aXQ8YW55Pj4gPVxuICAgICAgbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnRXhpdDxhbnk+PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGRyb3BzIHRoZSBpdGVtIGluc2lkZSBhIGNvbnRhaW5lci4gKi9cbiAgQE91dHB1dCgnY2RrRHJhZ0Ryb3BwZWQnKSBkcm9wcGVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0Ryb3A8YW55Pj4gPVxuICAgICAgbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnRHJvcDxhbnk+PigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyBhcyB0aGUgdXNlciBpcyBkcmFnZ2luZyB0aGUgaXRlbS4gVXNlIHdpdGggY2F1dGlvbixcbiAgICogYmVjYXVzZSB0aGlzIGV2ZW50IHdpbGwgZmlyZSBmb3IgZXZlcnkgcGl4ZWwgdGhhdCB0aGUgdXNlciBoYXMgZHJhZ2dlZC5cbiAgICovXG4gIEBPdXRwdXQoJ2Nka0RyYWdNb3ZlZCcpIG1vdmVkOiBPYnNlcnZhYmxlPENka0RyYWdNb3ZlPFQ+PiA9XG4gICAgICBuZXcgT2JzZXJ2YWJsZSgob2JzZXJ2ZXI6IE9ic2VydmVyPENka0RyYWdNb3ZlPFQ+PikgPT4ge1xuICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSB0aGlzLl9kcmFnUmVmLm1vdmVkLnBpcGUobWFwKG1vdmVkRXZlbnQgPT4gKHtcbiAgICAgICAgICBzb3VyY2U6IHRoaXMsXG4gICAgICAgICAgcG9pbnRlclBvc2l0aW9uOiBtb3ZlZEV2ZW50LnBvaW50ZXJQb3NpdGlvbixcbiAgICAgICAgICBldmVudDogbW92ZWRFdmVudC5ldmVudCxcbiAgICAgICAgICBkZWx0YTogbW92ZWRFdmVudC5kZWx0YSxcbiAgICAgICAgICBkaXN0YW5jZTogbW92ZWRFdmVudC5kaXN0YW5jZVxuICAgICAgICB9KSkpLnN1YnNjcmliZShvYnNlcnZlcik7XG5cbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgLyoqIEVsZW1lbnQgdGhhdCB0aGUgZHJhZ2dhYmxlIGlzIGF0dGFjaGVkIHRvLiAqL1xuICAgICAgcHVibGljIGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgICAgLyoqIERyb3BwYWJsZSBjb250YWluZXIgdGhhdCB0aGUgZHJhZ2dhYmxlIGlzIGEgcGFydCBvZi4gKi9cbiAgICAgIEBJbmplY3QoQ0RLX0RST1BfTElTVCkgQE9wdGlvbmFsKCkgQFNraXBTZWxmKCkgcHVibGljIGRyb3BDb250YWluZXI6IENka0Ryb3BMaXN0LFxuICAgICAgQEluamVjdChET0NVTUVOVCkgcHJpdmF0ZSBfZG9jdW1lbnQ6IGFueSwgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgICBwcml2YXRlIF92aWV3Q29udGFpbmVyUmVmOiBWaWV3Q29udGFpbmVyUmVmLFxuICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChDREtfRFJBR19DT05GSUcpIGNvbmZpZzogRHJhZ0Ryb3BDb25maWcsXG4gICAgICBAT3B0aW9uYWwoKSBwcml2YXRlIF9kaXI6IERpcmVjdGlvbmFsaXR5LCBkcmFnRHJvcDogRHJhZ0Ryb3AsXG4gICAgICBwcml2YXRlIF9jaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYpIHtcbiAgICB0aGlzLl9kcmFnUmVmID0gZHJhZ0Ryb3AuY3JlYXRlRHJhZyhlbGVtZW50LCB7XG4gICAgICBkcmFnU3RhcnRUaHJlc2hvbGQ6IGNvbmZpZyAmJiBjb25maWcuZHJhZ1N0YXJ0VGhyZXNob2xkICE9IG51bGwgP1xuICAgICAgICAgIGNvbmZpZy5kcmFnU3RhcnRUaHJlc2hvbGQgOiA1LFxuICAgICAgcG9pbnRlckRpcmVjdGlvbkNoYW5nZVRocmVzaG9sZDogY29uZmlnICYmIGNvbmZpZy5wb2ludGVyRGlyZWN0aW9uQ2hhbmdlVGhyZXNob2xkICE9IG51bGwgP1xuICAgICAgICAgIGNvbmZpZy5wb2ludGVyRGlyZWN0aW9uQ2hhbmdlVGhyZXNob2xkIDogNSxcbiAgICAgIHpJbmRleDogY29uZmlnPy56SW5kZXhcbiAgICB9KTtcbiAgICB0aGlzLl9kcmFnUmVmLmRhdGEgPSB0aGlzO1xuXG4gICAgaWYgKGNvbmZpZykge1xuICAgICAgdGhpcy5fYXNzaWduRGVmYXVsdHMoY29uZmlnKTtcbiAgICB9XG5cbiAgICAvLyBOb3RlIHRoYXQgdXN1YWxseSB0aGUgY29udGFpbmVyIGlzIGFzc2lnbmVkIHdoZW4gdGhlIGRyb3AgbGlzdCBpcyBwaWNrcyB1cCB0aGUgaXRlbSwgYnV0IGluXG4gICAgLy8gc29tZSBjYXNlcyAobWFpbmx5IHRyYW5zcGxhbnRlZCB2aWV3cyB3aXRoIE9uUHVzaCwgc2VlICMxODM0MSkgd2UgbWF5IGVuZCB1cCBpbiBhIHNpdHVhdGlvblxuICAgIC8vIHdoZXJlIHRoZXJlIGFyZSBubyBpdGVtcyBvbiB0aGUgZmlyc3QgY2hhbmdlIGRldGVjdGlvbiBwYXNzLCBidXQgdGhlIGl0ZW1zIGdldCBwaWNrZWQgdXAgYXNcbiAgICAvLyBzb29uIGFzIHRoZSB1c2VyIHRyaWdnZXJzIGFub3RoZXIgcGFzcyBieSBkcmFnZ2luZy4gVGhpcyBpcyBhIHByb2JsZW0sIGJlY2F1c2UgdGhlIGl0ZW0gd291bGRcbiAgICAvLyBoYXZlIHRvIHN3aXRjaCBmcm9tIHN0YW5kYWxvbmUgbW9kZSB0byBkcmFnIG1vZGUgaW4gdGhlIG1pZGRsZSBvZiB0aGUgZHJhZ2dpbmcgc2VxdWVuY2Ugd2hpY2hcbiAgICAvLyBpcyB0b28gbGF0ZSBzaW5jZSB0aGUgdHdvIG1vZGVzIHNhdmUgZGlmZmVyZW50IGtpbmRzIG9mIGluZm9ybWF0aW9uLiBXZSB3b3JrIGFyb3VuZCBpdCBieVxuICAgIC8vIGFzc2lnbmluZyB0aGUgZHJvcCBjb250YWluZXIgYm90aCBmcm9tIGhlcmUgYW5kIHRoZSBsaXN0LlxuICAgIGlmIChkcm9wQ29udGFpbmVyKSB7XG4gICAgICB0aGlzLl9kcmFnUmVmLl93aXRoRHJvcENvbnRhaW5lcihkcm9wQ29udGFpbmVyLl9kcm9wTGlzdFJlZik7XG4gICAgICBkcm9wQ29udGFpbmVyLmFkZEl0ZW0odGhpcyk7XG4gICAgfVxuXG4gICAgdGhpcy5fc3luY0lucHV0cyh0aGlzLl9kcmFnUmVmKTtcbiAgICB0aGlzLl9oYW5kbGVFdmVudHModGhpcy5fZHJhZ1JlZik7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZWxlbWVudCB0aGF0IGlzIGJlaW5nIHVzZWQgYXMgYSBwbGFjZWhvbGRlclxuICAgKiB3aGlsZSB0aGUgY3VycmVudCBlbGVtZW50IGlzIGJlaW5nIGRyYWdnZWQuXG4gICAqIEBkZXByZWNhdGVkIE5vIGxvbmdlciBiZWluZyB1c2VkIHRvIGJlIHJlbW92ZWQuXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMTEuMC4wXG4gICAqL1xuICBnZXRQbGFjZWhvbGRlckVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLl9kcmFnUmVmLmdldFBsYWNlaG9sZGVyRWxlbWVudCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHJvb3QgZHJhZ2dhYmxlIGVsZW1lbnQuXG4gICAqIEBkZXByZWNhdGVkIE5vIGxvbmdlciBiZWluZyB1c2VkIHRvIGJlIHJlbW92ZWQuXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMTEuMC4wXG4gICAqL1xuICBnZXRSb290RWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX2RyYWdSZWYuZ2V0Um9vdEVsZW1lbnQoKTtcbiAgfVxuXG4gIC8qKiBSZXNldHMgYSBzdGFuZGFsb25lIGRyYWcgaXRlbSB0byBpdHMgaW5pdGlhbCBwb3NpdGlvbi4gKi9cbiAgcmVzZXQoKTogdm9pZCB7XG4gICAgdGhpcy5fZHJhZ1JlZi5yZXNldCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHBpeGVsIGNvb3JkaW5hdGVzIG9mIHRoZSBkcmFnZ2FibGUgb3V0c2lkZSBvZiBhIGRyb3AgY29udGFpbmVyLlxuICAgKi9cbiAgZ2V0RnJlZURyYWdQb3NpdGlvbigpOiB7cmVhZG9ubHkgeDogbnVtYmVyLCByZWFkb25seSB5OiBudW1iZXJ9IHtcbiAgICByZXR1cm4gdGhpcy5fZHJhZ1JlZi5nZXRGcmVlRHJhZ1Bvc2l0aW9uKCk7XG4gIH1cblxuICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgLy8gV2UgbmVlZCB0byB3YWl0IGZvciB0aGUgem9uZSB0byBzdGFiaWxpemUsIGluIG9yZGVyIGZvciB0aGUgcmVmZXJlbmNlXG4gICAgLy8gZWxlbWVudCB0byBiZSBpbiB0aGUgcHJvcGVyIHBsYWNlIGluIHRoZSBET00uIFRoaXMgaXMgbW9zdGx5IHJlbGV2YW50XG4gICAgLy8gZm9yIGRyYWdnYWJsZSBlbGVtZW50cyBpbnNpZGUgcG9ydGFscyBzaW5jZSB0aGV5IGdldCBzdGFtcGVkIG91dCBpblxuICAgIC8vIHRoZWlyIG9yaWdpbmFsIERPTSBwb3NpdGlvbiBhbmQgdGhlbiB0aGV5IGdldCB0cmFuc2ZlcnJlZCB0byB0aGUgcG9ydGFsLlxuICAgIHRoaXMuX25nWm9uZS5vblN0YWJsZS5hc09ic2VydmFibGUoKVxuICAgICAgLnBpcGUodGFrZSgxKSwgdGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpXG4gICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgdGhpcy5fdXBkYXRlUm9vdEVsZW1lbnQoKTtcblxuICAgICAgICAvLyBMaXN0ZW4gZm9yIGFueSBuZXdseS1hZGRlZCBoYW5kbGVzLlxuICAgICAgICB0aGlzLl9oYW5kbGVzLmNoYW5nZXMucGlwZShcbiAgICAgICAgICBzdGFydFdpdGgodGhpcy5faGFuZGxlcyksXG4gICAgICAgICAgLy8gU3luYyB0aGUgbmV3IGhhbmRsZXMgd2l0aCB0aGUgRHJhZ1JlZi5cbiAgICAgICAgICB0YXAoKGhhbmRsZXM6IFF1ZXJ5TGlzdDxDZGtEcmFnSGFuZGxlPikgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2hpbGRIYW5kbGVFbGVtZW50cyA9IGhhbmRsZXNcbiAgICAgICAgICAgICAgLmZpbHRlcihoYW5kbGUgPT4gaGFuZGxlLl9wYXJlbnREcmFnID09PSB0aGlzKVxuICAgICAgICAgICAgICAubWFwKGhhbmRsZSA9PiBoYW5kbGUuZWxlbWVudCk7XG4gICAgICAgICAgICB0aGlzLl9kcmFnUmVmLndpdGhIYW5kbGVzKGNoaWxkSGFuZGxlRWxlbWVudHMpO1xuICAgICAgICAgIH0pLFxuICAgICAgICAgIC8vIExpc3RlbiBpZiB0aGUgc3RhdGUgb2YgYW55IG9mIHRoZSBoYW5kbGVzIGNoYW5nZXMuXG4gICAgICAgICAgc3dpdGNoTWFwKChoYW5kbGVzOiBRdWVyeUxpc3Q8Q2RrRHJhZ0hhbmRsZT4pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBtZXJnZSguLi5oYW5kbGVzLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0uX3N0YXRlQ2hhbmdlcy5waXBlKHN0YXJ0V2l0aChpdGVtKSk7XG4gICAgICAgICAgICB9KSkgYXMgT2JzZXJ2YWJsZTxDZGtEcmFnSGFuZGxlPjtcbiAgICAgICAgICB9KSxcbiAgICAgICAgICB0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKVxuICAgICAgICApLnN1YnNjcmliZShoYW5kbGVJbnN0YW5jZSA9PiB7XG4gICAgICAgICAgLy8gRW5hYmxlZC9kaXNhYmxlIHRoZSBoYW5kbGUgdGhhdCBjaGFuZ2VkIGluIHRoZSBEcmFnUmVmLlxuICAgICAgICAgIGNvbnN0IGRyYWdSZWYgPSB0aGlzLl9kcmFnUmVmO1xuICAgICAgICAgIGNvbnN0IGhhbmRsZSA9IGhhbmRsZUluc3RhbmNlLmVsZW1lbnQubmF0aXZlRWxlbWVudDtcbiAgICAgICAgICBoYW5kbGVJbnN0YW5jZS5kaXNhYmxlZCA/IGRyYWdSZWYuZGlzYWJsZUhhbmRsZShoYW5kbGUpIDogZHJhZ1JlZi5lbmFibGVIYW5kbGUoaGFuZGxlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHRoaXMuZnJlZURyYWdQb3NpdGlvbikge1xuICAgICAgICAgIHRoaXMuX2RyYWdSZWYuc2V0RnJlZURyYWdQb3NpdGlvbih0aGlzLmZyZWVEcmFnUG9zaXRpb24pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpIHtcbiAgICBjb25zdCByb290U2VsZWN0b3JDaGFuZ2UgPSBjaGFuZ2VzWydyb290RWxlbWVudFNlbGVjdG9yJ107XG4gICAgY29uc3QgcG9zaXRpb25DaGFuZ2UgPSBjaGFuZ2VzWydmcmVlRHJhZ1Bvc2l0aW9uJ107XG5cbiAgICAvLyBXZSBkb24ndCBoYXZlIHRvIHJlYWN0IHRvIHRoZSBmaXJzdCBjaGFuZ2Ugc2luY2UgaXQncyBiZWluZ1xuICAgIC8vIGhhbmRsZWQgaW4gYG5nQWZ0ZXJWaWV3SW5pdGAgd2hlcmUgaXQgbmVlZHMgdG8gYmUgZGVmZXJyZWQuXG4gICAgaWYgKHJvb3RTZWxlY3RvckNoYW5nZSAmJiAhcm9vdFNlbGVjdG9yQ2hhbmdlLmZpcnN0Q2hhbmdlKSB7XG4gICAgICB0aGlzLl91cGRhdGVSb290RWxlbWVudCgpO1xuICAgIH1cblxuICAgIC8vIFNraXAgdGhlIGZpcnN0IGNoYW5nZSBzaW5jZSBpdCdzIGJlaW5nIGhhbmRsZWQgaW4gYG5nQWZ0ZXJWaWV3SW5pdGAuXG4gICAgaWYgKHBvc2l0aW9uQ2hhbmdlICYmICFwb3NpdGlvbkNoYW5nZS5maXJzdENoYW5nZSAmJiB0aGlzLmZyZWVEcmFnUG9zaXRpb24pIHtcbiAgICAgIHRoaXMuX2RyYWdSZWYuc2V0RnJlZURyYWdQb3NpdGlvbih0aGlzLmZyZWVEcmFnUG9zaXRpb24pO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIGlmICh0aGlzLmRyb3BDb250YWluZXIpIHtcbiAgICAgIHRoaXMuZHJvcENvbnRhaW5lci5yZW1vdmVJdGVtKHRoaXMpO1xuICAgIH1cblxuICAgIHRoaXMuX2Rlc3Ryb3llZC5uZXh0KCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fZHJhZ1JlZi5kaXNwb3NlKCk7XG4gIH1cblxuICAvKiogU3luY3MgdGhlIHJvb3QgZWxlbWVudCB3aXRoIHRoZSBgRHJhZ1JlZmAuICovXG4gIHByaXZhdGUgX3VwZGF0ZVJvb3RFbGVtZW50KCkge1xuICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudDtcbiAgICBjb25zdCByb290RWxlbWVudCA9IHRoaXMucm9vdEVsZW1lbnRTZWxlY3RvciA/XG4gICAgICAgIGdldENsb3Nlc3RNYXRjaGluZ0FuY2VzdG9yKGVsZW1lbnQsIHRoaXMucm9vdEVsZW1lbnRTZWxlY3RvcikgOiBlbGVtZW50O1xuXG4gICAgaWYgKHJvb3RFbGVtZW50ICYmIHJvb3RFbGVtZW50Lm5vZGVUeXBlICE9PSB0aGlzLl9kb2N1bWVudC5FTEVNRU5UX05PREUpIHtcbiAgICAgIHRocm93IEVycm9yKGBjZGtEcmFnIG11c3QgYmUgYXR0YWNoZWQgdG8gYW4gZWxlbWVudCBub2RlLiBgICtcbiAgICAgICAgICAgICAgICAgIGBDdXJyZW50bHkgYXR0YWNoZWQgdG8gXCIke3Jvb3RFbGVtZW50Lm5vZGVOYW1lfVwiLmApO1xuICAgIH1cblxuICAgIHRoaXMuX2RyYWdSZWYud2l0aFJvb3RFbGVtZW50KHJvb3RFbGVtZW50IHx8IGVsZW1lbnQpO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIGJvdW5kYXJ5IGVsZW1lbnQsIGJhc2VkIG9uIHRoZSBgYm91bmRhcnlFbGVtZW50YCB2YWx1ZS4gKi9cbiAgcHJpdmF0ZSBfZ2V0Qm91bmRhcnlFbGVtZW50KCkge1xuICAgIGNvbnN0IGJvdW5kYXJ5ID0gdGhpcy5ib3VuZGFyeUVsZW1lbnQ7XG5cbiAgICBpZiAoIWJvdW5kYXJ5KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGJvdW5kYXJ5ID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIGdldENsb3Nlc3RNYXRjaGluZ0FuY2VzdG9yKHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50LCBib3VuZGFyeSk7XG4gICAgfVxuXG4gICAgY29uc3QgZWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoYm91bmRhcnkpO1xuXG4gICAgaWYgKGlzRGV2TW9kZSgpICYmICFlbGVtZW50LmNvbnRhaW5zKHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50KSkge1xuICAgICAgdGhyb3cgRXJyb3IoJ0RyYWdnYWJsZSBlbGVtZW50IGlzIG5vdCBpbnNpZGUgb2YgdGhlIG5vZGUgcGFzc2VkIGludG8gY2RrRHJhZ0JvdW5kYXJ5LicpO1xuICAgIH1cblxuICAgIHJldHVybiBlbGVtZW50O1xuICB9XG5cbiAgLyoqIFN5bmNzIHRoZSBpbnB1dHMgb2YgdGhlIENka0RyYWcgd2l0aCB0aGUgb3B0aW9ucyBvZiB0aGUgdW5kZXJseWluZyBEcmFnUmVmLiAqL1xuICBwcml2YXRlIF9zeW5jSW5wdXRzKHJlZjogRHJhZ1JlZjxDZGtEcmFnPFQ+Pikge1xuICAgIHJlZi5iZWZvcmVTdGFydGVkLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICBpZiAoIXJlZi5pc0RyYWdnaW5nKCkpIHtcbiAgICAgICAgY29uc3QgZGlyID0gdGhpcy5fZGlyO1xuICAgICAgICBjb25zdCBkcmFnU3RhcnREZWxheSA9IHRoaXMuZHJhZ1N0YXJ0RGVsYXk7XG4gICAgICAgIGNvbnN0IHBsYWNlaG9sZGVyID0gdGhpcy5fcGxhY2Vob2xkZXJUZW1wbGF0ZSA/IHtcbiAgICAgICAgICB0ZW1wbGF0ZTogdGhpcy5fcGxhY2Vob2xkZXJUZW1wbGF0ZS50ZW1wbGF0ZVJlZixcbiAgICAgICAgICBjb250ZXh0OiB0aGlzLl9wbGFjZWhvbGRlclRlbXBsYXRlLmRhdGEsXG4gICAgICAgICAgdmlld0NvbnRhaW5lcjogdGhpcy5fdmlld0NvbnRhaW5lclJlZlxuICAgICAgICB9IDogbnVsbDtcbiAgICAgICAgY29uc3QgcHJldmlldyA9IHRoaXMuX3ByZXZpZXdUZW1wbGF0ZSA/IHtcbiAgICAgICAgICB0ZW1wbGF0ZTogdGhpcy5fcHJldmlld1RlbXBsYXRlLnRlbXBsYXRlUmVmLFxuICAgICAgICAgIGNvbnRleHQ6IHRoaXMuX3ByZXZpZXdUZW1wbGF0ZS5kYXRhLFxuICAgICAgICAgIG1hdGNoU2l6ZTogdGhpcy5fcHJldmlld1RlbXBsYXRlLm1hdGNoU2l6ZSxcbiAgICAgICAgICB2aWV3Q29udGFpbmVyOiB0aGlzLl92aWV3Q29udGFpbmVyUmVmXG4gICAgICAgIH0gOiBudWxsO1xuXG4gICAgICAgIHJlZi5kaXNhYmxlZCA9IHRoaXMuZGlzYWJsZWQ7XG4gICAgICAgIHJlZi5sb2NrQXhpcyA9IHRoaXMubG9ja0F4aXM7XG4gICAgICAgIHJlZi5kcmFnU3RhcnREZWxheSA9ICh0eXBlb2YgZHJhZ1N0YXJ0RGVsYXkgPT09ICdvYmplY3QnICYmIGRyYWdTdGFydERlbGF5KSA/XG4gICAgICAgICAgICBkcmFnU3RhcnREZWxheSA6IGNvZXJjZU51bWJlclByb3BlcnR5KGRyYWdTdGFydERlbGF5KTtcbiAgICAgICAgcmVmLmNvbnN0cmFpblBvc2l0aW9uID0gdGhpcy5jb25zdHJhaW5Qb3NpdGlvbjtcbiAgICAgICAgcmVmLnByZXZpZXdDbGFzcyA9IHRoaXMucHJldmlld0NsYXNzO1xuICAgICAgICByZWZcbiAgICAgICAgICAud2l0aEJvdW5kYXJ5RWxlbWVudCh0aGlzLl9nZXRCb3VuZGFyeUVsZW1lbnQoKSlcbiAgICAgICAgICAud2l0aFBsYWNlaG9sZGVyVGVtcGxhdGUocGxhY2Vob2xkZXIpXG4gICAgICAgICAgLndpdGhQcmV2aWV3VGVtcGxhdGUocHJldmlldyk7XG5cbiAgICAgICAgaWYgKGRpcikge1xuICAgICAgICAgIHJlZi53aXRoRGlyZWN0aW9uKGRpci52YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBIYW5kbGVzIHRoZSBldmVudHMgZnJvbSB0aGUgdW5kZXJseWluZyBgRHJhZ1JlZmAuICovXG4gIHByaXZhdGUgX2hhbmRsZUV2ZW50cyhyZWY6IERyYWdSZWY8Q2RrRHJhZzxUPj4pIHtcbiAgICByZWYuc3RhcnRlZC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgdGhpcy5zdGFydGVkLmVtaXQoe3NvdXJjZTogdGhpc30pO1xuXG4gICAgICAvLyBTaW5jZSBhbGwgb2YgdGhlc2UgZXZlbnRzIHJ1biBvdXRzaWRlIG9mIGNoYW5nZSBkZXRlY3Rpb24sXG4gICAgICAvLyB3ZSBuZWVkIHRvIGVuc3VyZSB0aGF0IGV2ZXJ5dGhpbmcgaXMgbWFya2VkIGNvcnJlY3RseS5cbiAgICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICAgIH0pO1xuXG4gICAgcmVmLnJlbGVhc2VkLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICB0aGlzLnJlbGVhc2VkLmVtaXQoe3NvdXJjZTogdGhpc30pO1xuICAgIH0pO1xuXG4gICAgcmVmLmVuZGVkLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICB0aGlzLmVuZGVkLmVtaXQoe3NvdXJjZTogdGhpcywgZGlzdGFuY2U6IGV2ZW50LmRpc3RhbmNlfSk7XG5cbiAgICAgIC8vIFNpbmNlIGFsbCBvZiB0aGVzZSBldmVudHMgcnVuIG91dHNpZGUgb2YgY2hhbmdlIGRldGVjdGlvbixcbiAgICAgIC8vIHdlIG5lZWQgdG8gZW5zdXJlIHRoYXQgZXZlcnl0aGluZyBpcyBtYXJrZWQgY29ycmVjdGx5LlxuICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgfSk7XG5cbiAgICByZWYuZW50ZXJlZC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgdGhpcy5lbnRlcmVkLmVtaXQoe1xuICAgICAgICBjb250YWluZXI6IGV2ZW50LmNvbnRhaW5lci5kYXRhLFxuICAgICAgICBpdGVtOiB0aGlzLFxuICAgICAgICBjdXJyZW50SW5kZXg6IGV2ZW50LmN1cnJlbnRJbmRleFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZWYuZXhpdGVkLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICB0aGlzLmV4aXRlZC5lbWl0KHtcbiAgICAgICAgY29udGFpbmVyOiBldmVudC5jb250YWluZXIuZGF0YSxcbiAgICAgICAgaXRlbTogdGhpc1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZWYuZHJvcHBlZC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgdGhpcy5kcm9wcGVkLmVtaXQoe1xuICAgICAgICBwcmV2aW91c0luZGV4OiBldmVudC5wcmV2aW91c0luZGV4LFxuICAgICAgICBjdXJyZW50SW5kZXg6IGV2ZW50LmN1cnJlbnRJbmRleCxcbiAgICAgICAgcHJldmlvdXNDb250YWluZXI6IGV2ZW50LnByZXZpb3VzQ29udGFpbmVyLmRhdGEsXG4gICAgICAgIGNvbnRhaW5lcjogZXZlbnQuY29udGFpbmVyLmRhdGEsXG4gICAgICAgIGlzUG9pbnRlck92ZXJDb250YWluZXI6IGV2ZW50LmlzUG9pbnRlck92ZXJDb250YWluZXIsXG4gICAgICAgIGl0ZW06IHRoaXMsXG4gICAgICAgIGRpc3RhbmNlOiBldmVudC5kaXN0YW5jZVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogQXNzaWducyB0aGUgZGVmYXVsdCBpbnB1dCB2YWx1ZXMgYmFzZWQgb24gYSBwcm92aWRlZCBjb25maWcgb2JqZWN0LiAqL1xuICBwcml2YXRlIF9hc3NpZ25EZWZhdWx0cyhjb25maWc6IERyYWdEcm9wQ29uZmlnKSB7XG4gICAgY29uc3Qge1xuICAgICAgbG9ja0F4aXMsIGRyYWdTdGFydERlbGF5LCBjb25zdHJhaW5Qb3NpdGlvbiwgcHJldmlld0NsYXNzLFxuICAgICAgYm91bmRhcnlFbGVtZW50LCBkcmFnZ2luZ0Rpc2FibGVkLCByb290RWxlbWVudFNlbGVjdG9yXG4gICAgfSA9IGNvbmZpZztcblxuICAgIHRoaXMuZGlzYWJsZWQgPSBkcmFnZ2luZ0Rpc2FibGVkID09IG51bGwgPyBmYWxzZSA6IGRyYWdnaW5nRGlzYWJsZWQ7XG4gICAgdGhpcy5kcmFnU3RhcnREZWxheSA9IGRyYWdTdGFydERlbGF5IHx8IDA7XG5cbiAgICBpZiAobG9ja0F4aXMpIHtcbiAgICAgIHRoaXMubG9ja0F4aXMgPSBsb2NrQXhpcztcbiAgICB9XG5cbiAgICBpZiAoY29uc3RyYWluUG9zaXRpb24pIHtcbiAgICAgIHRoaXMuY29uc3RyYWluUG9zaXRpb24gPSBjb25zdHJhaW5Qb3NpdGlvbjtcbiAgICB9XG5cbiAgICBpZiAocHJldmlld0NsYXNzKSB7XG4gICAgICB0aGlzLnByZXZpZXdDbGFzcyA9IHByZXZpZXdDbGFzcztcbiAgICB9XG5cbiAgICBpZiAoYm91bmRhcnlFbGVtZW50KSB7XG4gICAgICB0aGlzLmJvdW5kYXJ5RWxlbWVudCA9IGJvdW5kYXJ5RWxlbWVudDtcbiAgICB9XG5cbiAgICBpZiAocm9vdEVsZW1lbnRTZWxlY3Rvcikge1xuICAgICAgdGhpcy5yb290RWxlbWVudFNlbGVjdG9yID0gcm9vdEVsZW1lbnRTZWxlY3RvcjtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfZGlzYWJsZWQ6IEJvb2xlYW5JbnB1dDtcbn1cblxuLyoqIEdldHMgdGhlIGNsb3Nlc3QgYW5jZXN0b3Igb2YgYW4gZWxlbWVudCB0aGF0IG1hdGNoZXMgYSBzZWxlY3Rvci4gKi9cbmZ1bmN0aW9uIGdldENsb3Nlc3RNYXRjaGluZ0FuY2VzdG9yKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBzZWxlY3Rvcjogc3RyaW5nKSB7XG4gIGxldCBjdXJyZW50RWxlbWVudCA9IGVsZW1lbnQucGFyZW50RWxlbWVudCBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG5cbiAgd2hpbGUgKGN1cnJlbnRFbGVtZW50KSB7XG4gICAgLy8gSUUgZG9lc24ndCBzdXBwb3J0IGBtYXRjaGVzYCBzbyB3ZSBoYXZlIHRvIGZhbGwgYmFjayB0byBgbXNNYXRjaGVzU2VsZWN0b3JgLlxuICAgIGlmIChjdXJyZW50RWxlbWVudC5tYXRjaGVzID8gY3VycmVudEVsZW1lbnQubWF0Y2hlcyhzZWxlY3RvcikgOlxuICAgICAgICAoY3VycmVudEVsZW1lbnQgYXMgYW55KS5tc01hdGNoZXNTZWxlY3RvcihzZWxlY3RvcikpIHtcbiAgICAgIHJldHVybiBjdXJyZW50RWxlbWVudDtcbiAgICB9XG5cbiAgICBjdXJyZW50RWxlbWVudCA9IGN1cnJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQ7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuIl19