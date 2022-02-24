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
import { coerceBooleanProperty, coerceNumberProperty, coerceElement, } from '@angular/cdk/coercion';
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
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/bidi";
import * as i2 from "../drag-drop";
import * as i3 from "./drag-handle";
const DRAG_HOST_CLASS = 'cdk-drag';
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
    _document, _ngZone, _viewContainerRef, config, _dir, dragDrop, _changeDetectorRef, _selfHandle, _parentDrag) {
        this.element = element;
        this.dropContainer = dropContainer;
        this._ngZone = _ngZone;
        this._viewContainerRef = _viewContainerRef;
        this._dir = _dir;
        this._changeDetectorRef = _changeDetectorRef;
        this._selfHandle = _selfHandle;
        this._parentDrag = _parentDrag;
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
            const subscription = this._dragRef.moved
                .pipe(map(movedEvent => ({
                source: this,
                pointerPosition: movedEvent.pointerPosition,
                event: movedEvent.event,
                delta: movedEvent.delta,
                distance: movedEvent.distance,
            })))
                .subscribe(observer);
            return () => {
                subscription.unsubscribe();
            };
        });
        this._dragRef = dragDrop.createDrag(element, {
            dragStartThreshold: config && config.dragStartThreshold != null ? config.dragStartThreshold : 5,
            pointerDirectionChangeThreshold: config && config.pointerDirectionChangeThreshold != null
                ? config.pointerDirectionChangeThreshold
                : 5,
            zIndex: config?.zIndex,
        });
        this._dragRef.data = this;
        // We have to keep track of the drag instances in order to be able to match an element to
        // a drag instance. We can't go through the global registry of `DragRef`, because the root
        // element could be different.
        CdkDrag._dragInstances.push(this);
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
        // Normally this isn't in the zone, but it can cause major performance regressions for apps
        // using `zone-patch-rxjs` because it'll trigger a change detection when it unsubscribes.
        this._ngZone.runOutsideAngular(() => {
            // We need to wait for the zone to stabilize, in order for the reference
            // element to be in the proper place in the DOM. This is mostly relevant
            // for draggable elements inside portals since they get stamped out in
            // their original DOM position and then they get transferred to the portal.
            this._ngZone.onStable.pipe(take(1), takeUntil(this._destroyed)).subscribe(() => {
                this._updateRootElement();
                this._setupHandlesListener();
                if (this.freeDragPosition) {
                    this._dragRef.setFreeDragPosition(this.freeDragPosition);
                }
            });
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
        const index = CdkDrag._dragInstances.indexOf(this);
        if (index > -1) {
            CdkDrag._dragInstances.splice(index, 1);
        }
        // Unnecessary in most cases, but used to avoid extra change detections with `zone-paths-rxjs`.
        this._ngZone.runOutsideAngular(() => {
            this._destroyed.next();
            this._destroyed.complete();
            this._dragRef.dispose();
        });
    }
    /** Syncs the root element with the `DragRef`. */
    _updateRootElement() {
        const element = this.element.nativeElement;
        let rootElement = element;
        if (this.rootElementSelector) {
            rootElement =
                element.closest !== undefined
                    ? element.closest(this.rootElementSelector)
                    : // Comment tag doesn't have closest method, so use parent's one.
                        element.parentElement?.closest(this.rootElementSelector);
        }
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
            return this.element.nativeElement.closest(boundary);
        }
        return coerceElement(boundary);
    }
    /** Syncs the inputs of the CdkDrag with the options of the underlying DragRef. */
    _syncInputs(ref) {
        ref.beforeStarted.subscribe(() => {
            if (!ref.isDragging()) {
                const dir = this._dir;
                const dragStartDelay = this.dragStartDelay;
                const placeholder = this._placeholderTemplate
                    ? {
                        template: this._placeholderTemplate.templateRef,
                        context: this._placeholderTemplate.data,
                        viewContainer: this._viewContainerRef,
                    }
                    : null;
                const preview = this._previewTemplate
                    ? {
                        template: this._previewTemplate.templateRef,
                        context: this._previewTemplate.data,
                        matchSize: this._previewTemplate.matchSize,
                        viewContainer: this._viewContainerRef,
                    }
                    : null;
                ref.disabled = this.disabled;
                ref.lockAxis = this.lockAxis;
                ref.dragStartDelay =
                    typeof dragStartDelay === 'object' && dragStartDelay
                        ? dragStartDelay
                        : coerceNumberProperty(dragStartDelay);
                ref.constrainPosition = this.constrainPosition;
                ref.previewClass = this.previewClass;
                ref
                    .withBoundaryElement(this._getBoundaryElement())
                    .withPlaceholderTemplate(placeholder)
                    .withPreviewTemplate(preview)
                    .withPreviewContainer(this.previewContainer || 'global');
                if (dir) {
                    ref.withDirection(dir.value);
                }
            }
        });
        // This only needs to be resolved once.
        ref.beforeStarted.pipe(take(1)).subscribe(() => {
            // If we managed to resolve a parent through DI, use it.
            if (this._parentDrag) {
                ref.withParent(this._parentDrag._dragRef);
                return;
            }
            // Otherwise fall back to resolving the parent by looking up the DOM. This can happen if
            // the item was projected into another item by something like `ngTemplateOutlet`.
            let parent = this.element.nativeElement.parentElement;
            while (parent) {
                if (parent.classList.contains(DRAG_HOST_CLASS)) {
                    ref.withParent(CdkDrag._dragInstances.find(drag => {
                        return drag.element.nativeElement === parent;
                    })?._dragRef || null);
                    break;
                }
                parent = parent.parentElement;
            }
        });
    }
    /** Handles the events from the underlying `DragRef`. */
    _handleEvents(ref) {
        ref.started.subscribe(startEvent => {
            this.started.emit({ source: this, event: startEvent.event });
            // Since all of these events run outside of change detection,
            // we need to ensure that everything is marked correctly.
            this._changeDetectorRef.markForCheck();
        });
        ref.released.subscribe(releaseEvent => {
            this.released.emit({ source: this, event: releaseEvent.event });
        });
        ref.ended.subscribe(endEvent => {
            this.ended.emit({
                source: this,
                distance: endEvent.distance,
                dropPoint: endEvent.dropPoint,
                event: endEvent.event,
            });
            // Since all of these events run outside of change detection,
            // we need to ensure that everything is marked correctly.
            this._changeDetectorRef.markForCheck();
        });
        ref.entered.subscribe(enterEvent => {
            this.entered.emit({
                container: enterEvent.container.data,
                item: this,
                currentIndex: enterEvent.currentIndex,
            });
        });
        ref.exited.subscribe(exitEvent => {
            this.exited.emit({
                container: exitEvent.container.data,
                item: this,
            });
        });
        ref.dropped.subscribe(dropEvent => {
            this.dropped.emit({
                previousIndex: dropEvent.previousIndex,
                currentIndex: dropEvent.currentIndex,
                previousContainer: dropEvent.previousContainer.data,
                container: dropEvent.container.data,
                isPointerOverContainer: dropEvent.isPointerOverContainer,
                item: this,
                distance: dropEvent.distance,
                dropPoint: dropEvent.dropPoint,
                event: dropEvent.event,
            });
        });
    }
    /** Assigns the default input values based on a provided config object. */
    _assignDefaults(config) {
        const { lockAxis, dragStartDelay, constrainPosition, previewClass, boundaryElement, draggingDisabled, rootElementSelector, previewContainer, } = config;
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
        if (previewContainer) {
            this.previewContainer = previewContainer;
        }
    }
    /** Sets up the listener that syncs the handles with the drag ref. */
    _setupHandlesListener() {
        // Listen for any newly-added handles.
        this._handles.changes
            .pipe(startWith(this._handles), 
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
        }), takeUntil(this._destroyed))
            .subscribe(handleInstance => {
            // Enabled/disable the handle that changed in the DragRef.
            const dragRef = this._dragRef;
            const handle = handleInstance.element.nativeElement;
            handleInstance.disabled ? dragRef.disableHandle(handle) : dragRef.enableHandle(handle);
        });
    }
}
CdkDrag._dragInstances = [];
CdkDrag.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.2.0", ngImport: i0, type: CdkDrag, deps: [{ token: i0.ElementRef }, { token: CDK_DROP_LIST, optional: true, skipSelf: true }, { token: DOCUMENT }, { token: i0.NgZone }, { token: i0.ViewContainerRef }, { token: CDK_DRAG_CONFIG, optional: true }, { token: i1.Directionality, optional: true }, { token: i2.DragDrop }, { token: i0.ChangeDetectorRef }, { token: CDK_DRAG_HANDLE, optional: true, self: true }, { token: CDK_DRAG_PARENT, optional: true, skipSelf: true }], target: i0.ɵɵFactoryTarget.Directive });
CdkDrag.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.2.0", type: CdkDrag, selector: "[cdkDrag]", inputs: { data: ["cdkDragData", "data"], lockAxis: ["cdkDragLockAxis", "lockAxis"], rootElementSelector: ["cdkDragRootElement", "rootElementSelector"], boundaryElement: ["cdkDragBoundary", "boundaryElement"], dragStartDelay: ["cdkDragStartDelay", "dragStartDelay"], freeDragPosition: ["cdkDragFreeDragPosition", "freeDragPosition"], disabled: ["cdkDragDisabled", "disabled"], constrainPosition: ["cdkDragConstrainPosition", "constrainPosition"], previewClass: ["cdkDragPreviewClass", "previewClass"], previewContainer: ["cdkDragPreviewContainer", "previewContainer"] }, outputs: { started: "cdkDragStarted", released: "cdkDragReleased", ended: "cdkDragEnded", entered: "cdkDragEntered", exited: "cdkDragExited", dropped: "cdkDragDropped", moved: "cdkDragMoved" }, host: { properties: { "class.cdk-drag-disabled": "disabled", "class.cdk-drag-dragging": "_dragRef.isDragging()" }, classAttribute: "cdk-drag" }, providers: [{ provide: CDK_DRAG_PARENT, useExisting: CdkDrag }], queries: [{ propertyName: "_previewTemplate", first: true, predicate: CDK_DRAG_PREVIEW, descendants: true }, { propertyName: "_placeholderTemplate", first: true, predicate: CDK_DRAG_PLACEHOLDER, descendants: true }, { propertyName: "_handles", predicate: CDK_DRAG_HANDLE, descendants: true }], exportAs: ["cdkDrag"], usesOnChanges: true, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.2.0", ngImport: i0, type: CdkDrag, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkDrag]',
                    exportAs: 'cdkDrag',
                    host: {
                        'class': DRAG_HOST_CLASS,
                        '[class.cdk-drag-disabled]': 'disabled',
                        '[class.cdk-drag-dragging]': '_dragRef.isDragging()',
                    },
                    providers: [{ provide: CDK_DRAG_PARENT, useExisting: CdkDrag }],
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [CDK_DROP_LIST]
                }, {
                    type: Optional
                }, {
                    type: SkipSelf
                }] }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: i0.NgZone }, { type: i0.ViewContainerRef }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [CDK_DRAG_CONFIG]
                }] }, { type: i1.Directionality, decorators: [{
                    type: Optional
                }] }, { type: i2.DragDrop }, { type: i0.ChangeDetectorRef }, { type: i3.CdkDragHandle, decorators: [{
                    type: Optional
                }, {
                    type: Self
                }, {
                    type: Inject,
                    args: [CDK_DRAG_HANDLE]
                }] }, { type: CdkDrag, decorators: [{
                    type: Optional
                }, {
                    type: SkipSelf
                }, {
                    type: Inject,
                    args: [CDK_DRAG_PARENT]
                }] }]; }, propDecorators: { _handles: [{
                type: ContentChildren,
                args: [CDK_DRAG_HANDLE, { descendants: true }]
            }], _previewTemplate: [{
                type: ContentChild,
                args: [CDK_DRAG_PREVIEW]
            }], _placeholderTemplate: [{
                type: ContentChild,
                args: [CDK_DRAG_PLACEHOLDER]
            }], data: [{
                type: Input,
                args: ['cdkDragData']
            }], lockAxis: [{
                type: Input,
                args: ['cdkDragLockAxis']
            }], rootElementSelector: [{
                type: Input,
                args: ['cdkDragRootElement']
            }], boundaryElement: [{
                type: Input,
                args: ['cdkDragBoundary']
            }], dragStartDelay: [{
                type: Input,
                args: ['cdkDragStartDelay']
            }], freeDragPosition: [{
                type: Input,
                args: ['cdkDragFreeDragPosition']
            }], disabled: [{
                type: Input,
                args: ['cdkDragDisabled']
            }], constrainPosition: [{
                type: Input,
                args: ['cdkDragConstrainPosition']
            }], previewClass: [{
                type: Input,
                args: ['cdkDragPreviewClass']
            }], previewContainer: [{
                type: Input,
                args: ['cdkDragPreviewContainer']
            }], started: [{
                type: Output,
                args: ['cdkDragStarted']
            }], released: [{
                type: Output,
                args: ['cdkDragReleased']
            }], ended: [{
                type: Output,
                args: ['cdkDragEnded']
            }], entered: [{
                type: Output,
                args: ['cdkDragEntered']
            }], exited: [{
                type: Output,
                args: ['cdkDragExited']
            }], dropped: [{
                type: Output,
                args: ['cdkDragDropped']
            }], moved: [{
                type: Output,
                args: ['cdkDragMoved']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2RpcmVjdGl2ZXMvZHJhZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFFTCxZQUFZLEVBQ1osZUFBZSxFQUNmLFNBQVMsRUFDVCxVQUFVLEVBQ1YsWUFBWSxFQUNaLE1BQU0sRUFDTixLQUFLLEVBQ0wsTUFBTSxFQUVOLFFBQVEsRUFDUixNQUFNLEVBQ04sU0FBUyxFQUNULFFBQVEsRUFDUixnQkFBZ0IsRUFHaEIsaUJBQWlCLEVBQ2pCLElBQUksR0FDTCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQ0wscUJBQXFCLEVBQ3JCLG9CQUFvQixFQUNwQixhQUFhLEdBRWQsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQUMsVUFBVSxFQUFZLE9BQU8sRUFBRSxLQUFLLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDMUQsT0FBTyxFQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFVL0UsT0FBTyxFQUFDLGVBQWUsRUFBRSxhQUFhLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDN0QsT0FBTyxFQUFDLG9CQUFvQixFQUFFLGtCQUFrQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDNUUsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGNBQWMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ2hFLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUUvQyxPQUFPLEVBQUMsYUFBYSxFQUFxQyxNQUFNLGFBQWEsQ0FBQztB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YyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtcbiAgQWZ0ZXJWaWV3SW5pdCxcbiAgQ29udGVudENoaWxkLFxuICBDb250ZW50Q2hpbGRyZW4sXG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBJbmplY3QsXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgT3B0aW9uYWwsXG4gIE91dHB1dCxcbiAgUXVlcnlMaXN0LFxuICBTa2lwU2VsZixcbiAgVmlld0NvbnRhaW5lclJlZixcbiAgT25DaGFuZ2VzLFxuICBTaW1wbGVDaGFuZ2VzLFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgU2VsZixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1xuICBjb2VyY2VCb29sZWFuUHJvcGVydHksXG4gIGNvZXJjZU51bWJlclByb3BlcnR5LFxuICBjb2VyY2VFbGVtZW50LFxuICBCb29sZWFuSW5wdXQsXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge09ic2VydmFibGUsIE9ic2VydmVyLCBTdWJqZWN0LCBtZXJnZX0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3N0YXJ0V2l0aCwgdGFrZSwgbWFwLCB0YWtlVW50aWwsIHN3aXRjaE1hcCwgdGFwfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge1xuICBDZGtEcmFnRHJvcCxcbiAgQ2RrRHJhZ0VuZCxcbiAgQ2RrRHJhZ0VudGVyLFxuICBDZGtEcmFnRXhpdCxcbiAgQ2RrRHJhZ01vdmUsXG4gIENka0RyYWdTdGFydCxcbiAgQ2RrRHJhZ1JlbGVhc2UsXG59IGZyb20gJy4uL2RyYWctZXZlbnRzJztcbmltcG9ydCB7Q0RLX0RSQUdfSEFORExFLCBDZGtEcmFnSGFuZGxlfSBmcm9tICcuL2RyYWctaGFuZGxlJztcbmltcG9ydCB7Q0RLX0RSQUdfUExBQ0VIT0xERVIsIENka0RyYWdQbGFjZWhvbGRlcn0gZnJvbSAnLi9kcmFnLXBsYWNlaG9sZGVyJztcbmltcG9ydCB7Q0RLX0RSQUdfUFJFVklFVywgQ2RrRHJhZ1ByZXZpZXd9IGZyb20gJy4vZHJhZy1wcmV2aWV3JztcbmltcG9ydCB7Q0RLX0RSQUdfUEFSRU5UfSBmcm9tICcuLi9kcmFnLXBhcmVudCc7XG5pbXBvcnQge0RyYWdSZWYsIFBvaW50LCBQcmV2aWV3Q29udGFpbmVyfSBmcm9tICcuLi9kcmFnLXJlZic7XG5pbXBvcnQge0NES19EUk9QX0xJU1QsIENka0Ryb3BMaXN0SW50ZXJuYWwgYXMgQ2RrRHJvcExpc3R9IGZyb20gJy4vZHJvcC1saXN0JztcbmltcG9ydCB7RHJhZ0Ryb3B9IGZyb20gJy4uL2RyYWctZHJvcCc7XG5pbXBvcnQge0NES19EUkFHX0NPTkZJRywgRHJhZ0Ryb3BDb25maWcsIERyYWdTdGFydERlbGF5LCBEcmFnQXhpc30gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IHthc3NlcnRFbGVtZW50Tm9kZX0gZnJvbSAnLi9hc3NlcnRpb25zJztcblxuY29uc3QgRFJBR19IT1NUX0NMQVNTID0gJ2Nkay1kcmFnJztcblxuLyoqIEVsZW1lbnQgdGhhdCBjYW4gYmUgbW92ZWQgaW5zaWRlIGEgQ2RrRHJvcExpc3QgY29udGFpbmVyLiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka0RyYWddJyxcbiAgZXhwb3J0QXM6ICdjZGtEcmFnJyxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6IERSQUdfSE9TVF9DTEFTUyxcbiAgICAnW2NsYXNzLmNkay1kcmFnLWRpc2FibGVkXSc6ICdkaXNhYmxlZCcsXG4gICAgJ1tjbGFzcy5jZGstZHJhZy1kcmFnZ2luZ10nOiAnX2RyYWdSZWYuaXNEcmFnZ2luZygpJyxcbiAgfSxcbiAgcHJvdmlkZXJzOiBbe3Byb3ZpZGU6IENES19EUkFHX1BBUkVOVCwgdXNlRXhpc3Rpbmc6IENka0RyYWd9XSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrRHJhZzxUID0gYW55PiBpbXBsZW1lbnRzIEFmdGVyVmlld0luaXQsIE9uQ2hhbmdlcywgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSByZWFkb25seSBfZGVzdHJveWVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX2RyYWdJbnN0YW5jZXM6IENka0RyYWdbXSA9IFtdO1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIHVuZGVybHlpbmcgZHJhZyBpbnN0YW5jZS4gKi9cbiAgX2RyYWdSZWY6IERyYWdSZWY8Q2RrRHJhZzxUPj47XG5cbiAgLyoqIEVsZW1lbnRzIHRoYXQgY2FuIGJlIHVzZWQgdG8gZHJhZyB0aGUgZHJhZ2dhYmxlIGl0ZW0uICovXG4gIEBDb250ZW50Q2hpbGRyZW4oQ0RLX0RSQUdfSEFORExFLCB7ZGVzY2VuZGFudHM6IHRydWV9KSBfaGFuZGxlczogUXVlcnlMaXN0PENka0RyYWdIYW5kbGU+O1xuXG4gIC8qKiBFbGVtZW50IHRoYXQgd2lsbCBiZSB1c2VkIGFzIGEgdGVtcGxhdGUgdG8gY3JlYXRlIHRoZSBkcmFnZ2FibGUgaXRlbSdzIHByZXZpZXcuICovXG4gIEBDb250ZW50Q2hpbGQoQ0RLX0RSQUdfUFJFVklFVykgX3ByZXZpZXdUZW1wbGF0ZTogQ2RrRHJhZ1ByZXZpZXc7XG5cbiAgLyoqIFRlbXBsYXRlIGZvciBwbGFjZWhvbGRlciBlbGVtZW50IHJlbmRlcmVkIHRvIHNob3cgd2hlcmUgYSBkcmFnZ2FibGUgd291bGQgYmUgZHJvcHBlZC4gKi9cbiAgQENvbnRlbnRDaGlsZChDREtfRFJBR19QTEFDRUhPTERFUikgX3BsYWNlaG9sZGVyVGVtcGxhdGU6IENka0RyYWdQbGFjZWhvbGRlcjtcblxuICAvKiogQXJiaXRyYXJ5IGRhdGEgdG8gYXR0YWNoIHRvIHRoaXMgZHJhZyBpbnN0YW5jZS4gKi9cbiAgQElucHV0KCdjZGtEcmFnRGF0YScpIGRhdGE6IFQ7XG5cbiAgLyoqIExvY2tzIHRoZSBwb3NpdGlvbiBvZiB0aGUgZHJhZ2dlZCBlbGVtZW50IGFsb25nIHRoZSBzcGVjaWZpZWQgYXhpcy4gKi9cbiAgQElucHV0KCdjZGtEcmFnTG9ja0F4aXMnKSBsb2NrQXhpczogRHJhZ0F4aXM7XG5cbiAgLyoqXG4gICAqIFNlbGVjdG9yIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGRldGVybWluZSB0aGUgcm9vdCBkcmFnZ2FibGUgZWxlbWVudCwgc3RhcnRpbmcgZnJvbVxuICAgKiB0aGUgYGNka0RyYWdgIGVsZW1lbnQgYW5kIGdvaW5nIHVwIHRoZSBET00uIFBhc3NpbmcgYW4gYWx0ZXJuYXRlIHJvb3QgZWxlbWVudCBpcyB1c2VmdWxcbiAgICogd2hlbiB0cnlpbmcgdG8gZW5hYmxlIGRyYWdnaW5nIG9uIGFuIGVsZW1lbnQgdGhhdCB5b3UgbWlnaHQgbm90IGhhdmUgYWNjZXNzIHRvLlxuICAgKi9cbiAgQElucHV0KCdjZGtEcmFnUm9vdEVsZW1lbnQnKSByb290RWxlbWVudFNlbGVjdG9yOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIE5vZGUgb3Igc2VsZWN0b3IgdGhhdCB3aWxsIGJlIHVzZWQgdG8gZGV0ZXJtaW5lIHRoZSBlbGVtZW50IHRvIHdoaWNoIHRoZSBkcmFnZ2FibGUnc1xuICAgKiBwb3NpdGlvbiB3aWxsIGJlIGNvbnN0cmFpbmVkLiBJZiBhIHN0cmluZyBpcyBwYXNzZWQgaW4sIGl0J2xsIGJlIHVzZWQgYXMgYSBzZWxlY3RvciB0aGF0XG4gICAqIHdpbGwgYmUgbWF0Y2hlZCBzdGFydGluZyBmcm9tIHRoZSBlbGVtZW50J3MgcGFyZW50IGFuZCBnb2luZyB1cCB0aGUgRE9NIHVudGlsIGEgbWF0Y2hcbiAgICogaGFzIGJlZW4gZm91bmQuXG4gICAqL1xuICBASW5wdXQoJ2Nka0RyYWdCb3VuZGFyeScpIGJvdW5kYXJ5RWxlbWVudDogc3RyaW5nIHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBIVE1MRWxlbWVudDtcblxuICAvKipcbiAgICogQW1vdW50IG9mIG1pbGxpc2Vjb25kcyB0byB3YWl0IGFmdGVyIHRoZSB1c2VyIGhhcyBwdXQgdGhlaXJcbiAgICogcG9pbnRlciBkb3duIGJlZm9yZSBzdGFydGluZyB0byBkcmFnIHRoZSBlbGVtZW50LlxuICAgKi9cbiAgQElucHV0KCdjZGtEcmFnU3RhcnREZWxheScpIGRyYWdTdGFydERlbGF5OiBEcmFnU3RhcnREZWxheTtcblxuICAvKipcbiAgICogU2V0cyB0aGUgcG9zaXRpb24gb2YgYSBgQ2RrRHJhZ2AgdGhhdCBpcyBvdXRzaWRlIG9mIGEgZHJvcCBjb250YWluZXIuXG4gICAqIENhbiBiZSB1c2VkIHRvIHJlc3RvcmUgdGhlIGVsZW1lbnQncyBwb3NpdGlvbiBmb3IgYSByZXR1cm5pbmcgdXNlci5cbiAgICovXG4gIEBJbnB1dCgnY2RrRHJhZ0ZyZWVEcmFnUG9zaXRpb24nKSBmcmVlRHJhZ1Bvc2l0aW9uOiB7eDogbnVtYmVyOyB5OiBudW1iZXJ9O1xuXG4gIC8qKiBXaGV0aGVyIHN0YXJ0aW5nIHRvIGRyYWcgdGhpcyBlbGVtZW50IGlzIGRpc2FibGVkLiAqL1xuICBASW5wdXQoJ2Nka0RyYWdEaXNhYmxlZCcpXG4gIGdldCBkaXNhYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fZGlzYWJsZWQgfHwgKHRoaXMuZHJvcENvbnRhaW5lciAmJiB0aGlzLmRyb3BDb250YWluZXIuZGlzYWJsZWQpO1xuICB9XG4gIHNldCBkaXNhYmxlZCh2YWx1ZTogQm9vbGVhbklucHV0KSB7XG4gICAgdGhpcy5fZGlzYWJsZWQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICAgIHRoaXMuX2RyYWdSZWYuZGlzYWJsZWQgPSB0aGlzLl9kaXNhYmxlZDtcbiAgfVxuICBwcml2YXRlIF9kaXNhYmxlZDogYm9vbGVhbjtcblxuICAvKipcbiAgICogRnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB0byBjdXN0b21pemUgdGhlIGxvZ2ljIG9mIGhvdyB0aGUgcG9zaXRpb24gb2YgdGhlIGRyYWcgaXRlbVxuICAgKiBpcyBsaW1pdGVkIHdoaWxlIGl0J3MgYmVpbmcgZHJhZ2dlZC4gR2V0cyBjYWxsZWQgd2l0aCBhIHBvaW50IGNvbnRhaW5pbmcgdGhlIGN1cnJlbnQgcG9zaXRpb25cbiAgICogb2YgdGhlIHVzZXIncyBwb2ludGVyIG9uIHRoZSBwYWdlIGFuZCBzaG91bGQgcmV0dXJuIGEgcG9pbnQgZGVzY3JpYmluZyB3aGVyZSB0aGUgaXRlbSBzaG91bGRcbiAgICogYmUgcmVuZGVyZWQuXG4gICAqL1xuICBASW5wdXQoJ2Nka0RyYWdDb25zdHJhaW5Qb3NpdGlvbicpIGNvbnN0cmFpblBvc2l0aW9uPzogKHBvaW50OiBQb2ludCwgZHJhZ1JlZjogRHJhZ1JlZikgPT4gUG9pbnQ7XG5cbiAgLyoqIENsYXNzIHRvIGJlIGFkZGVkIHRvIHRoZSBwcmV2aWV3IGVsZW1lbnQuICovXG4gIEBJbnB1dCgnY2RrRHJhZ1ByZXZpZXdDbGFzcycpIHByZXZpZXdDbGFzczogc3RyaW5nIHwgc3RyaW5nW107XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZXMgdGhlIHBsYWNlIGludG8gd2hpY2ggdGhlIHByZXZpZXcgb2YgdGhlIGl0ZW0gd2lsbCBiZSBpbnNlcnRlZC4gQ2FuIGJlIGNvbmZpZ3VyZWRcbiAgICogZ2xvYmFsbHkgdGhyb3VnaCBgQ0RLX0RST1BfTElTVGAuIFBvc3NpYmxlIHZhbHVlczpcbiAgICogLSBgZ2xvYmFsYCAtIFByZXZpZXcgd2lsbCBiZSBpbnNlcnRlZCBhdCB0aGUgYm90dG9tIG9mIHRoZSBgPGJvZHk+YC4gVGhlIGFkdmFudGFnZSBpcyB0aGF0XG4gICAqIHlvdSBkb24ndCBoYXZlIHRvIHdvcnJ5IGFib3V0IGBvdmVyZmxvdzogaGlkZGVuYCBvciBgei1pbmRleGAsIGJ1dCB0aGUgaXRlbSB3b24ndCByZXRhaW5cbiAgICogaXRzIGluaGVyaXRlZCBzdHlsZXMuXG4gICAqIC0gYHBhcmVudGAgLSBQcmV2aWV3IHdpbGwgYmUgaW5zZXJ0ZWQgaW50byB0aGUgcGFyZW50IG9mIHRoZSBkcmFnIGl0ZW0uIFRoZSBhZHZhbnRhZ2UgaXMgdGhhdFxuICAgKiBpbmhlcml0ZWQgc3R5bGVzIHdpbGwgYmUgcHJlc2VydmVkLCBidXQgaXQgbWF5IGJlIGNsaXBwZWQgYnkgYG92ZXJmbG93OiBoaWRkZW5gIG9yIG5vdCBiZVxuICAgKiB2aXNpYmxlIGR1ZSB0byBgei1pbmRleGAuIEZ1cnRoZXJtb3JlLCB0aGUgcHJldmlldyBpcyBnb2luZyB0byBoYXZlIGFuIGVmZmVjdCBvdmVyIHNlbGVjdG9yc1xuICAgKiBsaWtlIGA6bnRoLWNoaWxkYCBhbmQgc29tZSBmbGV4Ym94IGNvbmZpZ3VyYXRpb25zLlxuICAgKiAtIGBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiB8IEhUTUxFbGVtZW50YCAtIFByZXZpZXcgd2lsbCBiZSBpbnNlcnRlZCBpbnRvIGEgc3BlY2lmaWMgZWxlbWVudC5cbiAgICogU2FtZSBhZHZhbnRhZ2VzIGFuZCBkaXNhZHZhbnRhZ2VzIGFzIGBwYXJlbnRgLlxuICAgKi9cbiAgQElucHV0KCdjZGtEcmFnUHJldmlld0NvbnRhaW5lcicpIHByZXZpZXdDb250YWluZXI6IFByZXZpZXdDb250YWluZXI7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgc3RhcnRzIGRyYWdnaW5nIHRoZSBpdGVtLiAqL1xuICBAT3V0cHV0KCdjZGtEcmFnU3RhcnRlZCcpIHJlYWRvbmx5IHN0YXJ0ZWQ6IEV2ZW50RW1pdHRlcjxDZGtEcmFnU3RhcnQ+ID1cbiAgICBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdTdGFydD4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBoYXMgcmVsZWFzZWQgYSBkcmFnIGl0ZW0sIGJlZm9yZSBhbnkgYW5pbWF0aW9ucyBoYXZlIHN0YXJ0ZWQuICovXG4gIEBPdXRwdXQoJ2Nka0RyYWdSZWxlYXNlZCcpIHJlYWRvbmx5IHJlbGVhc2VkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ1JlbGVhc2U+ID1cbiAgICBuZXcgRXZlbnRFbWl0dGVyPENka0RyYWdSZWxlYXNlPigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHN0b3BzIGRyYWdnaW5nIGFuIGl0ZW0gaW4gdGhlIGNvbnRhaW5lci4gKi9cbiAgQE91dHB1dCgnY2RrRHJhZ0VuZGVkJykgcmVhZG9ubHkgZW5kZWQ6IEV2ZW50RW1pdHRlcjxDZGtEcmFnRW5kPiA9IG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0VuZD4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBoYXMgbW92ZWQgdGhlIGl0ZW0gaW50byBhIG5ldyBjb250YWluZXIuICovXG4gIEBPdXRwdXQoJ2Nka0RyYWdFbnRlcmVkJykgcmVhZG9ubHkgZW50ZXJlZDogRXZlbnRFbWl0dGVyPENka0RyYWdFbnRlcjxhbnk+PiA9IG5ldyBFdmVudEVtaXR0ZXI8XG4gICAgQ2RrRHJhZ0VudGVyPGFueT5cbiAgPigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIHJlbW92ZXMgdGhlIGl0ZW0gaXRzIGNvbnRhaW5lciBieSBkcmFnZ2luZyBpdCBpbnRvIGFub3RoZXIgY29udGFpbmVyLiAqL1xuICBAT3V0cHV0KCdjZGtEcmFnRXhpdGVkJykgcmVhZG9ubHkgZXhpdGVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0V4aXQ8YW55Pj4gPSBuZXcgRXZlbnRFbWl0dGVyPFxuICAgIENka0RyYWdFeGl0PGFueT5cbiAgPigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGRyb3BzIHRoZSBpdGVtIGluc2lkZSBhIGNvbnRhaW5lci4gKi9cbiAgQE91dHB1dCgnY2RrRHJhZ0Ryb3BwZWQnKSByZWFkb25seSBkcm9wcGVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0Ryb3A8YW55Pj4gPSBuZXcgRXZlbnRFbWl0dGVyPFxuICAgIENka0RyYWdEcm9wPGFueT5cbiAgPigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyBhcyB0aGUgdXNlciBpcyBkcmFnZ2luZyB0aGUgaXRlbS4gVXNlIHdpdGggY2F1dGlvbixcbiAgICogYmVjYXVzZSB0aGlzIGV2ZW50IHdpbGwgZmlyZSBmb3IgZXZlcnkgcGl4ZWwgdGhhdCB0aGUgdXNlciBoYXMgZHJhZ2dlZC5cbiAgICovXG4gIEBPdXRwdXQoJ2Nka0RyYWdNb3ZlZCcpXG4gIHJlYWRvbmx5IG1vdmVkOiBPYnNlcnZhYmxlPENka0RyYWdNb3ZlPFQ+PiA9IG5ldyBPYnNlcnZhYmxlKFxuICAgIChvYnNlcnZlcjogT2JzZXJ2ZXI8Q2RrRHJhZ01vdmU8VD4+KSA9PiB7XG4gICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSB0aGlzLl9kcmFnUmVmLm1vdmVkXG4gICAgICAgIC5waXBlKFxuICAgICAgICAgIG1hcChtb3ZlZEV2ZW50ID0+ICh7XG4gICAgICAgICAgICBzb3VyY2U6IHRoaXMsXG4gICAgICAgICAgICBwb2ludGVyUG9zaXRpb246IG1vdmVkRXZlbnQucG9pbnRlclBvc2l0aW9uLFxuICAgICAgICAgICAgZXZlbnQ6IG1vdmVkRXZlbnQuZXZlbnQsXG4gICAgICAgICAgICBkZWx0YTogbW92ZWRFdmVudC5kZWx0YSxcbiAgICAgICAgICAgIGRpc3RhbmNlOiBtb3ZlZEV2ZW50LmRpc3RhbmNlLFxuICAgICAgICAgIH0pKSxcbiAgICAgICAgKVxuICAgICAgICAuc3Vic2NyaWJlKG9ic2VydmVyKTtcblxuICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICB9O1xuICAgIH0sXG4gICk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgLyoqIEVsZW1lbnQgdGhhdCB0aGUgZHJhZ2dhYmxlIGlzIGF0dGFjaGVkIHRvLiAqL1xuICAgIHB1YmxpYyBlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICAvKiogRHJvcHBhYmxlIGNvbnRhaW5lciB0aGF0IHRoZSBkcmFnZ2FibGUgaXMgYSBwYXJ0IG9mLiAqL1xuICAgIEBJbmplY3QoQ0RLX0RST1BfTElTVCkgQE9wdGlvbmFsKCkgQFNraXBTZWxmKCkgcHVibGljIGRyb3BDb250YWluZXI6IENka0Ryb3BMaXN0LFxuICAgIC8qKlxuICAgICAqIEBkZXByZWNhdGVkIGBfZG9jdW1lbnRgIHBhcmFtZXRlciBubyBsb25nZXIgYmVpbmcgdXNlZCBhbmQgd2lsbCBiZSByZW1vdmVkLlxuICAgICAqIEBicmVha2luZy1jaGFuZ2UgMTIuMC4wXG4gICAgICovXG4gICAgQEluamVjdChET0NVTUVOVCkgX2RvY3VtZW50OiBhbnksXG4gICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgcHJpdmF0ZSBfdmlld0NvbnRhaW5lclJlZjogVmlld0NvbnRhaW5lclJlZixcbiAgICBAT3B0aW9uYWwoKSBASW5qZWN0KENES19EUkFHX0NPTkZJRykgY29uZmlnOiBEcmFnRHJvcENvbmZpZyxcbiAgICBAT3B0aW9uYWwoKSBwcml2YXRlIF9kaXI6IERpcmVjdGlvbmFsaXR5LFxuICAgIGRyYWdEcm9wOiBEcmFnRHJvcCxcbiAgICBwcml2YXRlIF9jaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgQE9wdGlvbmFsKCkgQFNlbGYoKSBASW5qZWN0KENES19EUkFHX0hBTkRMRSkgcHJpdmF0ZSBfc2VsZkhhbmRsZT86IENka0RyYWdIYW5kbGUsXG4gICAgQE9wdGlvbmFsKCkgQFNraXBTZWxmKCkgQEluamVjdChDREtfRFJBR19QQVJFTlQpIHByaXZhdGUgX3BhcmVudERyYWc/OiBDZGtEcmFnLFxuICApIHtcbiAgICB0aGlzLl9kcmFnUmVmID0gZHJhZ0Ryb3AuY3JlYXRlRHJhZyhlbGVtZW50LCB7XG4gICAgICBkcmFnU3RhcnRUaHJlc2hvbGQ6XG4gICAgICAgIGNvbmZpZyAmJiBjb25maWcuZHJhZ1N0YXJ0VGhyZXNob2xkICE9IG51bGwgPyBjb25maWcuZHJhZ1N0YXJ0VGhyZXNob2xkIDogNSxcbiAgICAgIHBvaW50ZXJEaXJlY3Rpb25DaGFuZ2VUaHJlc2hvbGQ6XG4gICAgICAgIGNvbmZpZyAmJiBjb25maWcucG9pbnRlckRpcmVjdGlvbkNoYW5nZVRocmVzaG9sZCAhPSBudWxsXG4gICAgICAgICAgPyBjb25maWcucG9pbnRlckRpcmVjdGlvbkNoYW5nZVRocmVzaG9sZFxuICAgICAgICAgIDogNSxcbiAgICAgIHpJbmRleDogY29uZmlnPy56SW5kZXgsXG4gICAgfSk7XG4gICAgdGhpcy5fZHJhZ1JlZi5kYXRhID0gdGhpcztcblxuICAgIC8vIFdlIGhhdmUgdG8ga2VlcCB0cmFjayBvZiB0aGUgZHJhZyBpbnN0YW5jZXMgaW4gb3JkZXIgdG8gYmUgYWJsZSB0byBtYXRjaCBhbiBlbGVtZW50IHRvXG4gICAgLy8gYSBkcmFnIGluc3RhbmNlLiBXZSBjYW4ndCBnbyB0aHJvdWdoIHRoZSBnbG9iYWwgcmVnaXN0cnkgb2YgYERyYWdSZWZgLCBiZWNhdXNlIHRoZSByb290XG4gICAgLy8gZWxlbWVudCBjb3VsZCBiZSBkaWZmZXJlbnQuXG4gICAgQ2RrRHJhZy5fZHJhZ0luc3RhbmNlcy5wdXNoKHRoaXMpO1xuXG4gICAgaWYgKGNvbmZpZykge1xuICAgICAgdGhpcy5fYXNzaWduRGVmYXVsdHMoY29uZmlnKTtcbiAgICB9XG5cbiAgICAvLyBOb3RlIHRoYXQgdXN1YWxseSB0aGUgY29udGFpbmVyIGlzIGFzc2lnbmVkIHdoZW4gdGhlIGRyb3AgbGlzdCBpcyBwaWNrcyB1cCB0aGUgaXRlbSwgYnV0IGluXG4gICAgLy8gc29tZSBjYXNlcyAobWFpbmx5IHRyYW5zcGxhbnRlZCB2aWV3cyB3aXRoIE9uUHVzaCwgc2VlICMxODM0MSkgd2UgbWF5IGVuZCB1cCBpbiBhIHNpdHVhdGlvblxuICAgIC8vIHdoZXJlIHRoZXJlIGFyZSBubyBpdGVtcyBvbiB0aGUgZmlyc3QgY2hhbmdlIGRldGVjdGlvbiBwYXNzLCBidXQgdGhlIGl0ZW1zIGdldCBwaWNrZWQgdXAgYXNcbiAgICAvLyBzb29uIGFzIHRoZSB1c2VyIHRyaWdnZXJzIGFub3RoZXIgcGFzcyBieSBkcmFnZ2luZy4gVGhpcyBpcyBhIHByb2JsZW0sIGJlY2F1c2UgdGhlIGl0ZW0gd291bGRcbiAgICAvLyBoYXZlIHRvIHN3aXRjaCBmcm9tIHN0YW5kYWxvbmUgbW9kZSB0byBkcmFnIG1vZGUgaW4gdGhlIG1pZGRsZSBvZiB0aGUgZHJhZ2dpbmcgc2VxdWVuY2Ugd2hpY2hcbiAgICAvLyBpcyB0b28gbGF0ZSBzaW5jZSB0aGUgdHdvIG1vZGVzIHNhdmUgZGlmZmVyZW50IGtpbmRzIG9mIGluZm9ybWF0aW9uLiBXZSB3b3JrIGFyb3VuZCBpdCBieVxuICAgIC8vIGFzc2lnbmluZyB0aGUgZHJvcCBjb250YWluZXIgYm90aCBmcm9tIGhlcmUgYW5kIHRoZSBsaXN0LlxuICAgIGlmIChkcm9wQ29udGFpbmVyKSB7XG4gICAgICB0aGlzLl9kcmFnUmVmLl93aXRoRHJvcENvbnRhaW5lcihkcm9wQ29udGFpbmVyLl9kcm9wTGlzdFJlZik7XG4gICAgICBkcm9wQ29udGFpbmVyLmFkZEl0ZW0odGhpcyk7XG4gICAgfVxuXG4gICAgdGhpcy5fc3luY0lucHV0cyh0aGlzLl9kcmFnUmVmKTtcbiAgICB0aGlzLl9oYW5kbGVFdmVudHModGhpcy5fZHJhZ1JlZik7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZWxlbWVudCB0aGF0IGlzIGJlaW5nIHVzZWQgYXMgYSBwbGFjZWhvbGRlclxuICAgKiB3aGlsZSB0aGUgY3VycmVudCBlbGVtZW50IGlzIGJlaW5nIGRyYWdnZWQuXG4gICAqL1xuICBnZXRQbGFjZWhvbGRlckVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLl9kcmFnUmVmLmdldFBsYWNlaG9sZGVyRWxlbWVudCgpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIHJvb3QgZHJhZ2dhYmxlIGVsZW1lbnQuICovXG4gIGdldFJvb3RFbGVtZW50KCk6IEhUTUxFbGVtZW50IHtcbiAgICByZXR1cm4gdGhpcy5fZHJhZ1JlZi5nZXRSb290RWxlbWVudCgpO1xuICB9XG5cbiAgLyoqIFJlc2V0cyBhIHN0YW5kYWxvbmUgZHJhZyBpdGVtIHRvIGl0cyBpbml0aWFsIHBvc2l0aW9uLiAqL1xuICByZXNldCgpOiB2b2lkIHtcbiAgICB0aGlzLl9kcmFnUmVmLnJlc2V0KCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcGl4ZWwgY29vcmRpbmF0ZXMgb2YgdGhlIGRyYWdnYWJsZSBvdXRzaWRlIG9mIGEgZHJvcCBjb250YWluZXIuXG4gICAqL1xuICBnZXRGcmVlRHJhZ1Bvc2l0aW9uKCk6IHtyZWFkb25seSB4OiBudW1iZXI7IHJlYWRvbmx5IHk6IG51bWJlcn0ge1xuICAgIHJldHVybiB0aGlzLl9kcmFnUmVmLmdldEZyZWVEcmFnUG9zaXRpb24oKTtcbiAgfVxuXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcbiAgICAvLyBOb3JtYWxseSB0aGlzIGlzbid0IGluIHRoZSB6b25lLCBidXQgaXQgY2FuIGNhdXNlIG1ham9yIHBlcmZvcm1hbmNlIHJlZ3Jlc3Npb25zIGZvciBhcHBzXG4gICAgLy8gdXNpbmcgYHpvbmUtcGF0Y2gtcnhqc2AgYmVjYXVzZSBpdCdsbCB0cmlnZ2VyIGEgY2hhbmdlIGRldGVjdGlvbiB3aGVuIGl0IHVuc3Vic2NyaWJlcy5cbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgLy8gV2UgbmVlZCB0byB3YWl0IGZvciB0aGUgem9uZSB0byBzdGFiaWxpemUsIGluIG9yZGVyIGZvciB0aGUgcmVmZXJlbmNlXG4gICAgICAvLyBlbGVtZW50IHRvIGJlIGluIHRoZSBwcm9wZXIgcGxhY2UgaW4gdGhlIERPTS4gVGhpcyBpcyBtb3N0bHkgcmVsZXZhbnRcbiAgICAgIC8vIGZvciBkcmFnZ2FibGUgZWxlbWVudHMgaW5zaWRlIHBvcnRhbHMgc2luY2UgdGhleSBnZXQgc3RhbXBlZCBvdXQgaW5cbiAgICAgIC8vIHRoZWlyIG9yaWdpbmFsIERPTSBwb3NpdGlvbiBhbmQgdGhlbiB0aGV5IGdldCB0cmFuc2ZlcnJlZCB0byB0aGUgcG9ydGFsLlxuICAgICAgdGhpcy5fbmdab25lLm9uU3RhYmxlLnBpcGUodGFrZSgxKSwgdGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZVJvb3RFbGVtZW50KCk7XG4gICAgICAgIHRoaXMuX3NldHVwSGFuZGxlc0xpc3RlbmVyKCk7XG5cbiAgICAgICAgaWYgKHRoaXMuZnJlZURyYWdQb3NpdGlvbikge1xuICAgICAgICAgIHRoaXMuX2RyYWdSZWYuc2V0RnJlZURyYWdQb3NpdGlvbih0aGlzLmZyZWVEcmFnUG9zaXRpb24pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpIHtcbiAgICBjb25zdCByb290U2VsZWN0b3JDaGFuZ2UgPSBjaGFuZ2VzWydyb290RWxlbWVudFNlbGVjdG9yJ107XG4gICAgY29uc3QgcG9zaXRpb25DaGFuZ2UgPSBjaGFuZ2VzWydmcmVlRHJhZ1Bvc2l0aW9uJ107XG5cbiAgICAvLyBXZSBkb24ndCBoYXZlIHRvIHJlYWN0IHRvIHRoZSBmaXJzdCBjaGFuZ2Ugc2luY2UgaXQncyBiZWluZ1xuICAgIC8vIGhhbmRsZWQgaW4gYG5nQWZ0ZXJWaWV3SW5pdGAgd2hlcmUgaXQgbmVlZHMgdG8gYmUgZGVmZXJyZWQuXG4gICAgaWYgKHJvb3RTZWxlY3RvckNoYW5nZSAmJiAhcm9vdFNlbGVjdG9yQ2hhbmdlLmZpcnN0Q2hhbmdlKSB7XG4gICAgICB0aGlzLl91cGRhdGVSb290RWxlbWVudCgpO1xuICAgIH1cblxuICAgIC8vIFNraXAgdGhlIGZpcnN0IGNoYW5nZSBzaW5jZSBpdCdzIGJlaW5nIGhhbmRsZWQgaW4gYG5nQWZ0ZXJWaWV3SW5pdGAuXG4gICAgaWYgKHBvc2l0aW9uQ2hhbmdlICYmICFwb3NpdGlvbkNoYW5nZS5maXJzdENoYW5nZSAmJiB0aGlzLmZyZWVEcmFnUG9zaXRpb24pIHtcbiAgICAgIHRoaXMuX2RyYWdSZWYuc2V0RnJlZURyYWdQb3NpdGlvbih0aGlzLmZyZWVEcmFnUG9zaXRpb24pO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIGlmICh0aGlzLmRyb3BDb250YWluZXIpIHtcbiAgICAgIHRoaXMuZHJvcENvbnRhaW5lci5yZW1vdmVJdGVtKHRoaXMpO1xuICAgIH1cblxuICAgIGNvbnN0IGluZGV4ID0gQ2RrRHJhZy5fZHJhZ0luc3RhbmNlcy5pbmRleE9mKHRoaXMpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICBDZGtEcmFnLl9kcmFnSW5zdGFuY2VzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuXG4gICAgLy8gVW5uZWNlc3NhcnkgaW4gbW9zdCBjYXNlcywgYnV0IHVzZWQgdG8gYXZvaWQgZXh0cmEgY2hhbmdlIGRldGVjdGlvbnMgd2l0aCBgem9uZS1wYXRocy1yeGpzYC5cbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgdGhpcy5fZGVzdHJveWVkLm5leHQoKTtcbiAgICAgIHRoaXMuX2Rlc3Ryb3llZC5jb21wbGV0ZSgpO1xuICAgICAgdGhpcy5fZHJhZ1JlZi5kaXNwb3NlKCk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogU3luY3MgdGhlIHJvb3QgZWxlbWVudCB3aXRoIHRoZSBgRHJhZ1JlZmAuICovXG4gIHByaXZhdGUgX3VwZGF0ZVJvb3RFbGVtZW50KCkge1xuICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudCBhcyBIVE1MRWxlbWVudDtcbiAgICBsZXQgcm9vdEVsZW1lbnQgPSBlbGVtZW50O1xuICAgIGlmICh0aGlzLnJvb3RFbGVtZW50U2VsZWN0b3IpIHtcbiAgICAgIHJvb3RFbGVtZW50ID1cbiAgICAgICAgZWxlbWVudC5jbG9zZXN0ICE9PSB1bmRlZmluZWRcbiAgICAgICAgICA/IChlbGVtZW50LmNsb3Nlc3QodGhpcy5yb290RWxlbWVudFNlbGVjdG9yKSBhcyBIVE1MRWxlbWVudClcbiAgICAgICAgICA6IC8vIENvbW1lbnQgdGFnIGRvZXNuJ3QgaGF2ZSBjbG9zZXN0IG1ldGhvZCwgc28gdXNlIHBhcmVudCdzIG9uZS5cbiAgICAgICAgICAgIChlbGVtZW50LnBhcmVudEVsZW1lbnQ/LmNsb3Nlc3QodGhpcy5yb290RWxlbWVudFNlbGVjdG9yKSBhcyBIVE1MRWxlbWVudCk7XG4gICAgfVxuXG4gICAgaWYgKHJvb3RFbGVtZW50ICYmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpKSB7XG4gICAgICBhc3NlcnRFbGVtZW50Tm9kZShyb290RWxlbWVudCwgJ2Nka0RyYWcnKTtcbiAgICB9XG5cbiAgICB0aGlzLl9kcmFnUmVmLndpdGhSb290RWxlbWVudChyb290RWxlbWVudCB8fCBlbGVtZW50KTtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBib3VuZGFyeSBlbGVtZW50LCBiYXNlZCBvbiB0aGUgYGJvdW5kYXJ5RWxlbWVudGAgdmFsdWUuICovXG4gIHByaXZhdGUgX2dldEJvdW5kYXJ5RWxlbWVudCgpIHtcbiAgICBjb25zdCBib3VuZGFyeSA9IHRoaXMuYm91bmRhcnlFbGVtZW50O1xuXG4gICAgaWYgKCFib3VuZGFyeSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBib3VuZGFyeSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudC5jbG9zZXN0PEhUTUxFbGVtZW50Pihib3VuZGFyeSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvZXJjZUVsZW1lbnQoYm91bmRhcnkpO1xuICB9XG5cbiAgLyoqIFN5bmNzIHRoZSBpbnB1dHMgb2YgdGhlIENka0RyYWcgd2l0aCB0aGUgb3B0aW9ucyBvZiB0aGUgdW5kZXJseWluZyBEcmFnUmVmLiAqL1xuICBwcml2YXRlIF9zeW5jSW5wdXRzKHJlZjogRHJhZ1JlZjxDZGtEcmFnPFQ+Pikge1xuICAgIHJlZi5iZWZvcmVTdGFydGVkLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICBpZiAoIXJlZi5pc0RyYWdnaW5nKCkpIHtcbiAgICAgICAgY29uc3QgZGlyID0gdGhpcy5fZGlyO1xuICAgICAgICBjb25zdCBkcmFnU3RhcnREZWxheSA9IHRoaXMuZHJhZ1N0YXJ0RGVsYXk7XG4gICAgICAgIGNvbnN0IHBsYWNlaG9sZGVyID0gdGhpcy5fcGxhY2Vob2xkZXJUZW1wbGF0ZVxuICAgICAgICAgID8ge1xuICAgICAgICAgICAgICB0ZW1wbGF0ZTogdGhpcy5fcGxhY2Vob2xkZXJUZW1wbGF0ZS50ZW1wbGF0ZVJlZixcbiAgICAgICAgICAgICAgY29udGV4dDogdGhpcy5fcGxhY2Vob2xkZXJUZW1wbGF0ZS5kYXRhLFxuICAgICAgICAgICAgICB2aWV3Q29udGFpbmVyOiB0aGlzLl92aWV3Q29udGFpbmVyUmVmLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIDogbnVsbDtcbiAgICAgICAgY29uc3QgcHJldmlldyA9IHRoaXMuX3ByZXZpZXdUZW1wbGF0ZVxuICAgICAgICAgID8ge1xuICAgICAgICAgICAgICB0ZW1wbGF0ZTogdGhpcy5fcHJldmlld1RlbXBsYXRlLnRlbXBsYXRlUmVmLFxuICAgICAgICAgICAgICBjb250ZXh0OiB0aGlzLl9wcmV2aWV3VGVtcGxhdGUuZGF0YSxcbiAgICAgICAgICAgICAgbWF0Y2hTaXplOiB0aGlzLl9wcmV2aWV3VGVtcGxhdGUubWF0Y2hTaXplLFxuICAgICAgICAgICAgICB2aWV3Q29udGFpbmVyOiB0aGlzLl92aWV3Q29udGFpbmVyUmVmLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIDogbnVsbDtcblxuICAgICAgICByZWYuZGlzYWJsZWQgPSB0aGlzLmRpc2FibGVkO1xuICAgICAgICByZWYubG9ja0F4aXMgPSB0aGlzLmxvY2tBeGlzO1xuICAgICAgICByZWYuZHJhZ1N0YXJ0RGVsYXkgPVxuICAgICAgICAgIHR5cGVvZiBkcmFnU3RhcnREZWxheSA9PT0gJ29iamVjdCcgJiYgZHJhZ1N0YXJ0RGVsYXlcbiAgICAgICAgICAgID8gZHJhZ1N0YXJ0RGVsYXlcbiAgICAgICAgICAgIDogY29lcmNlTnVtYmVyUHJvcGVydHkoZHJhZ1N0YXJ0RGVsYXkpO1xuICAgICAgICByZWYuY29uc3RyYWluUG9zaXRpb24gPSB0aGlzLmNvbnN0cmFpblBvc2l0aW9uO1xuICAgICAgICByZWYucHJldmlld0NsYXNzID0gdGhpcy5wcmV2aWV3Q2xhc3M7XG4gICAgICAgIHJlZlxuICAgICAgICAgIC53aXRoQm91bmRhcnlFbGVtZW50KHRoaXMuX2dldEJvdW5kYXJ5RWxlbWVudCgpKVxuICAgICAgICAgIC53aXRoUGxhY2Vob2xkZXJUZW1wbGF0ZShwbGFjZWhvbGRlcilcbiAgICAgICAgICAud2l0aFByZXZpZXdUZW1wbGF0ZShwcmV2aWV3KVxuICAgICAgICAgIC53aXRoUHJldmlld0NvbnRhaW5lcih0aGlzLnByZXZpZXdDb250YWluZXIgfHwgJ2dsb2JhbCcpO1xuXG4gICAgICAgIGlmIChkaXIpIHtcbiAgICAgICAgICByZWYud2l0aERpcmVjdGlvbihkaXIudmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBUaGlzIG9ubHkgbmVlZHMgdG8gYmUgcmVzb2x2ZWQgb25jZS5cbiAgICByZWYuYmVmb3JlU3RhcnRlZC5waXBlKHRha2UoMSkpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAvLyBJZiB3ZSBtYW5hZ2VkIHRvIHJlc29sdmUgYSBwYXJlbnQgdGhyb3VnaCBESSwgdXNlIGl0LlxuICAgICAgaWYgKHRoaXMuX3BhcmVudERyYWcpIHtcbiAgICAgICAgcmVmLndpdGhQYXJlbnQodGhpcy5fcGFyZW50RHJhZy5fZHJhZ1JlZik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gT3RoZXJ3aXNlIGZhbGwgYmFjayB0byByZXNvbHZpbmcgdGhlIHBhcmVudCBieSBsb29raW5nIHVwIHRoZSBET00uIFRoaXMgY2FuIGhhcHBlbiBpZlxuICAgICAgLy8gdGhlIGl0ZW0gd2FzIHByb2plY3RlZCBpbnRvIGFub3RoZXIgaXRlbSBieSBzb21ldGhpbmcgbGlrZSBgbmdUZW1wbGF0ZU91dGxldGAuXG4gICAgICBsZXQgcGFyZW50ID0gdGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQucGFyZW50RWxlbWVudDtcbiAgICAgIHdoaWxlIChwYXJlbnQpIHtcbiAgICAgICAgaWYgKHBhcmVudC5jbGFzc0xpc3QuY29udGFpbnMoRFJBR19IT1NUX0NMQVNTKSkge1xuICAgICAgICAgIHJlZi53aXRoUGFyZW50KFxuICAgICAgICAgICAgQ2RrRHJhZy5fZHJhZ0luc3RhbmNlcy5maW5kKGRyYWcgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gZHJhZy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQgPT09IHBhcmVudDtcbiAgICAgICAgICAgIH0pPy5fZHJhZ1JlZiB8fCBudWxsLFxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcGFyZW50ID0gcGFyZW50LnBhcmVudEVsZW1lbnQ7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKiogSGFuZGxlcyB0aGUgZXZlbnRzIGZyb20gdGhlIHVuZGVybHlpbmcgYERyYWdSZWZgLiAqL1xuICBwcml2YXRlIF9oYW5kbGVFdmVudHMocmVmOiBEcmFnUmVmPENka0RyYWc8VD4+KSB7XG4gICAgcmVmLnN0YXJ0ZWQuc3Vic2NyaWJlKHN0YXJ0RXZlbnQgPT4ge1xuICAgICAgdGhpcy5zdGFydGVkLmVtaXQoe3NvdXJjZTogdGhpcywgZXZlbnQ6IHN0YXJ0RXZlbnQuZXZlbnR9KTtcblxuICAgICAgLy8gU2luY2UgYWxsIG9mIHRoZXNlIGV2ZW50cyBydW4gb3V0c2lkZSBvZiBjaGFuZ2UgZGV0ZWN0aW9uLFxuICAgICAgLy8gd2UgbmVlZCB0byBlbnN1cmUgdGhhdCBldmVyeXRoaW5nIGlzIG1hcmtlZCBjb3JyZWN0bHkuXG4gICAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgICB9KTtcblxuICAgIHJlZi5yZWxlYXNlZC5zdWJzY3JpYmUocmVsZWFzZUV2ZW50ID0+IHtcbiAgICAgIHRoaXMucmVsZWFzZWQuZW1pdCh7c291cmNlOiB0aGlzLCBldmVudDogcmVsZWFzZUV2ZW50LmV2ZW50fSk7XG4gICAgfSk7XG5cbiAgICByZWYuZW5kZWQuc3Vic2NyaWJlKGVuZEV2ZW50ID0+IHtcbiAgICAgIHRoaXMuZW5kZWQuZW1pdCh7XG4gICAgICAgIHNvdXJjZTogdGhpcyxcbiAgICAgICAgZGlzdGFuY2U6IGVuZEV2ZW50LmRpc3RhbmNlLFxuICAgICAgICBkcm9wUG9pbnQ6IGVuZEV2ZW50LmRyb3BQb2ludCxcbiAgICAgICAgZXZlbnQ6IGVuZEV2ZW50LmV2ZW50LFxuICAgICAgfSk7XG5cbiAgICAgIC8vIFNpbmNlIGFsbCBvZiB0aGVzZSBldmVudHMgcnVuIG91dHNpZGUgb2YgY2hhbmdlIGRldGVjdGlvbixcbiAgICAgIC8vIHdlIG5lZWQgdG8gZW5zdXJlIHRoYXQgZXZlcnl0aGluZyBpcyBtYXJrZWQgY29ycmVjdGx5LlxuICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgfSk7XG5cbiAgICByZWYuZW50ZXJlZC5zdWJzY3JpYmUoZW50ZXJFdmVudCA9PiB7XG4gICAgICB0aGlzLmVudGVyZWQuZW1pdCh7XG4gICAgICAgIGNvbnRhaW5lcjogZW50ZXJFdmVudC5jb250YWluZXIuZGF0YSxcbiAgICAgICAgaXRlbTogdGhpcyxcbiAgICAgICAgY3VycmVudEluZGV4OiBlbnRlckV2ZW50LmN1cnJlbnRJbmRleCxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmVmLmV4aXRlZC5zdWJzY3JpYmUoZXhpdEV2ZW50ID0+IHtcbiAgICAgIHRoaXMuZXhpdGVkLmVtaXQoe1xuICAgICAgICBjb250YWluZXI6IGV4aXRFdmVudC5jb250YWluZXIuZGF0YSxcbiAgICAgICAgaXRlbTogdGhpcyxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmVmLmRyb3BwZWQuc3Vic2NyaWJlKGRyb3BFdmVudCA9PiB7XG4gICAgICB0aGlzLmRyb3BwZWQuZW1pdCh7XG4gICAgICAgIHByZXZpb3VzSW5kZXg6IGRyb3BFdmVudC5wcmV2aW91c0luZGV4LFxuICAgICAgICBjdXJyZW50SW5kZXg6IGRyb3BFdmVudC5jdXJyZW50SW5kZXgsXG4gICAgICAgIHByZXZpb3VzQ29udGFpbmVyOiBkcm9wRXZlbnQucHJldmlvdXNDb250YWluZXIuZGF0YSxcbiAgICAgICAgY29udGFpbmVyOiBkcm9wRXZlbnQuY29udGFpbmVyLmRhdGEsXG4gICAgICAgIGlzUG9pbnRlck92ZXJDb250YWluZXI6IGRyb3BFdmVudC5pc1BvaW50ZXJPdmVyQ29udGFpbmVyLFxuICAgICAgICBpdGVtOiB0aGlzLFxuICAgICAgICBkaXN0YW5jZTogZHJvcEV2ZW50LmRpc3RhbmNlLFxuICAgICAgICBkcm9wUG9pbnQ6IGRyb3BFdmVudC5kcm9wUG9pbnQsXG4gICAgICAgIGV2ZW50OiBkcm9wRXZlbnQuZXZlbnQsXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBBc3NpZ25zIHRoZSBkZWZhdWx0IGlucHV0IHZhbHVlcyBiYXNlZCBvbiBhIHByb3ZpZGVkIGNvbmZpZyBvYmplY3QuICovXG4gIHByaXZhdGUgX2Fzc2lnbkRlZmF1bHRzKGNvbmZpZzogRHJhZ0Ryb3BDb25maWcpIHtcbiAgICBjb25zdCB7XG4gICAgICBsb2NrQXhpcyxcbiAgICAgIGRyYWdTdGFydERlbGF5LFxuICAgICAgY29uc3RyYWluUG9zaXRpb24sXG4gICAgICBwcmV2aWV3Q2xhc3MsXG4gICAgICBib3VuZGFyeUVsZW1lbnQsXG4gICAgICBkcmFnZ2luZ0Rpc2FibGVkLFxuICAgICAgcm9vdEVsZW1lbnRTZWxlY3RvcixcbiAgICAgIHByZXZpZXdDb250YWluZXIsXG4gICAgfSA9IGNvbmZpZztcblxuICAgIHRoaXMuZGlzYWJsZWQgPSBkcmFnZ2luZ0Rpc2FibGVkID09IG51bGwgPyBmYWxzZSA6IGRyYWdnaW5nRGlzYWJsZWQ7XG4gICAgdGhpcy5kcmFnU3RhcnREZWxheSA9IGRyYWdTdGFydERlbGF5IHx8IDA7XG5cbiAgICBpZiAobG9ja0F4aXMpIHtcbiAgICAgIHRoaXMubG9ja0F4aXMgPSBsb2NrQXhpcztcbiAgICB9XG5cbiAgICBpZiAoY29uc3RyYWluUG9zaXRpb24pIHtcbiAgICAgIHRoaXMuY29uc3RyYWluUG9zaXRpb24gPSBjb25zdHJhaW5Qb3NpdGlvbjtcbiAgICB9XG5cbiAgICBpZiAocHJldmlld0NsYXNzKSB7XG4gICAgICB0aGlzLnByZXZpZXdDbGFzcyA9IHByZXZpZXdDbGFzcztcbiAgICB9XG5cbiAgICBpZiAoYm91bmRhcnlFbGVtZW50KSB7XG4gICAgICB0aGlzLmJvdW5kYXJ5RWxlbWVudCA9IGJvdW5kYXJ5RWxlbWVudDtcbiAgICB9XG5cbiAgICBpZiAocm9vdEVsZW1lbnRTZWxlY3Rvcikge1xuICAgICAgdGhpcy5yb290RWxlbWVudFNlbGVjdG9yID0gcm9vdEVsZW1lbnRTZWxlY3RvcjtcbiAgICB9XG5cbiAgICBpZiAocHJldmlld0NvbnRhaW5lcikge1xuICAgICAgdGhpcy5wcmV2aWV3Q29udGFpbmVyID0gcHJldmlld0NvbnRhaW5lcjtcbiAgICB9XG4gIH1cblxuICAvKiogU2V0cyB1cCB0aGUgbGlzdGVuZXIgdGhhdCBzeW5jcyB0aGUgaGFuZGxlcyB3aXRoIHRoZSBkcmFnIHJlZi4gKi9cbiAgcHJpdmF0ZSBfc2V0dXBIYW5kbGVzTGlzdGVuZXIoKSB7XG4gICAgLy8gTGlzdGVuIGZvciBhbnkgbmV3bHktYWRkZWQgaGFuZGxlcy5cbiAgICB0aGlzLl9oYW5kbGVzLmNoYW5nZXNcbiAgICAgIC5waXBlKFxuICAgICAgICBzdGFydFdpdGgodGhpcy5faGFuZGxlcyksXG4gICAgICAgIC8vIFN5bmMgdGhlIG5ldyBoYW5kbGVzIHdpdGggdGhlIERyYWdSZWYuXG4gICAgICAgIHRhcCgoaGFuZGxlczogUXVlcnlMaXN0PENka0RyYWdIYW5kbGU+KSA9PiB7XG4gICAgICAgICAgY29uc3QgY2hpbGRIYW5kbGVFbGVtZW50cyA9IGhhbmRsZXNcbiAgICAgICAgICAgIC5maWx0ZXIoaGFuZGxlID0+IGhhbmRsZS5fcGFyZW50RHJhZyA9PT0gdGhpcylcbiAgICAgICAgICAgIC5tYXAoaGFuZGxlID0+IGhhbmRsZS5lbGVtZW50KTtcblxuICAgICAgICAgIC8vIFVzdWFsbHkgaGFuZGxlcyBhcmUgb25seSBhbGxvd2VkIHRvIGJlIGEgZGVzY2VuZGFudCBvZiB0aGUgZHJhZyBlbGVtZW50LCBidXQgaWZcbiAgICAgICAgICAvLyB0aGUgY29uc3VtZXIgZGVmaW5lZCBhIGRpZmZlcmVudCBkcmFnIHJvb3QsIHdlIHNob3VsZCBhbGxvdyB0aGUgZHJhZyBlbGVtZW50XG4gICAgICAgICAgLy8gaXRzZWxmIHRvIGJlIGEgaGFuZGxlIHRvby5cbiAgICAgICAgICBpZiAodGhpcy5fc2VsZkhhbmRsZSAmJiB0aGlzLnJvb3RFbGVtZW50U2VsZWN0b3IpIHtcbiAgICAgICAgICAgIGNoaWxkSGFuZGxlRWxlbWVudHMucHVzaCh0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuX2RyYWdSZWYud2l0aEhhbmRsZXMoY2hpbGRIYW5kbGVFbGVtZW50cyk7XG4gICAgICAgIH0pLFxuICAgICAgICAvLyBMaXN0ZW4gaWYgdGhlIHN0YXRlIG9mIGFueSBvZiB0aGUgaGFuZGxlcyBjaGFuZ2VzLlxuICAgICAgICBzd2l0Y2hNYXAoKGhhbmRsZXM6IFF1ZXJ5TGlzdDxDZGtEcmFnSGFuZGxlPikgPT4ge1xuICAgICAgICAgIHJldHVybiBtZXJnZShcbiAgICAgICAgICAgIC4uLmhhbmRsZXMubWFwKGl0ZW0gPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gaXRlbS5fc3RhdGVDaGFuZ2VzLnBpcGUoc3RhcnRXaXRoKGl0ZW0pKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICkgYXMgT2JzZXJ2YWJsZTxDZGtEcmFnSGFuZGxlPjtcbiAgICAgICAgfSksXG4gICAgICAgIHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpLFxuICAgICAgKVxuICAgICAgLnN1YnNjcmliZShoYW5kbGVJbnN0YW5jZSA9PiB7XG4gICAgICAgIC8vIEVuYWJsZWQvZGlzYWJsZSB0aGUgaGFuZGxlIHRoYXQgY2hhbmdlZCBpbiB0aGUgRHJhZ1JlZi5cbiAgICAgICAgY29uc3QgZHJhZ1JlZiA9IHRoaXMuX2RyYWdSZWY7XG4gICAgICAgIGNvbnN0IGhhbmRsZSA9IGhhbmRsZUluc3RhbmNlLmVsZW1lbnQubmF0aXZlRWxlbWVudDtcbiAgICAgICAgaGFuZGxlSW5zdGFuY2UuZGlzYWJsZWQgPyBkcmFnUmVmLmRpc2FibGVIYW5kbGUoaGFuZGxlKSA6IGRyYWdSZWYuZW5hYmxlSGFuZGxlKGhhbmRsZSk7XG4gICAgICB9KTtcbiAgfVxufVxuIl19