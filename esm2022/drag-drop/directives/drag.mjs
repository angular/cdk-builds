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
class CdkDrag {
    static { this._dragInstances = []; }
    /** Whether starting to drag this element is disabled. */
    get disabled() {
        return this._disabled || (this.dropContainer && this.dropContainer.disabled);
    }
    set disabled(value) {
        this._disabled = coerceBooleanProperty(value);
        this._dragRef.disabled = this._disabled;
    }
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
    /**
     * Sets the current position in pixels the draggable outside of a drop container.
     * @param value New position to be set.
     */
    setFreeDragPosition(value) {
        this._dragRef.setFreeDragPosition(value);
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0-rc.2", ngImport: i0, type: CdkDrag, deps: [{ token: i0.ElementRef }, { token: CDK_DROP_LIST, optional: true, skipSelf: true }, { token: DOCUMENT }, { token: i0.NgZone }, { token: i0.ViewContainerRef }, { token: CDK_DRAG_CONFIG, optional: true }, { token: i1.Directionality, optional: true }, { token: i2.DragDrop }, { token: i0.ChangeDetectorRef }, { token: CDK_DRAG_HANDLE, optional: true, self: true }, { token: CDK_DRAG_PARENT, optional: true, skipSelf: true }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.0-rc.2", type: CdkDrag, isStandalone: true, selector: "[cdkDrag]", inputs: { data: ["cdkDragData", "data"], lockAxis: ["cdkDragLockAxis", "lockAxis"], rootElementSelector: ["cdkDragRootElement", "rootElementSelector"], boundaryElement: ["cdkDragBoundary", "boundaryElement"], dragStartDelay: ["cdkDragStartDelay", "dragStartDelay"], freeDragPosition: ["cdkDragFreeDragPosition", "freeDragPosition"], disabled: ["cdkDragDisabled", "disabled"], constrainPosition: ["cdkDragConstrainPosition", "constrainPosition"], previewClass: ["cdkDragPreviewClass", "previewClass"], previewContainer: ["cdkDragPreviewContainer", "previewContainer"] }, outputs: { started: "cdkDragStarted", released: "cdkDragReleased", ended: "cdkDragEnded", entered: "cdkDragEntered", exited: "cdkDragExited", dropped: "cdkDragDropped", moved: "cdkDragMoved" }, host: { properties: { "class.cdk-drag-disabled": "disabled", "class.cdk-drag-dragging": "_dragRef.isDragging()" }, classAttribute: "cdk-drag" }, providers: [{ provide: CDK_DRAG_PARENT, useExisting: CdkDrag }], queries: [{ propertyName: "_previewTemplate", first: true, predicate: CDK_DRAG_PREVIEW, descendants: true }, { propertyName: "_placeholderTemplate", first: true, predicate: CDK_DRAG_PLACEHOLDER, descendants: true }, { propertyName: "_handles", predicate: CDK_DRAG_HANDLE, descendants: true }], exportAs: ["cdkDrag"], usesOnChanges: true, ngImport: i0 }); }
}
export { CdkDrag };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0-rc.2", ngImport: i0, type: CdkDrag, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkDrag]',
                    exportAs: 'cdkDrag',
                    standalone: true,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2RpcmVjdGl2ZXMvZHJhZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFFTCxZQUFZLEVBQ1osZUFBZSxFQUNmLFNBQVMsRUFDVCxVQUFVLEVBQ1YsWUFBWSxFQUNaLE1BQU0sRUFDTixLQUFLLEVBQ0wsTUFBTSxFQUVOLFFBQVEsRUFDUixNQUFNLEVBQ04sU0FBUyxFQUNULFFBQVEsRUFDUixnQkFBZ0IsRUFHaEIsaUJBQWlCLEVBQ2pCLElBQUksR0FDTCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQ0wscUJBQXFCLEVBQ3JCLG9CQUFvQixFQUNwQixhQUFhLEdBRWQsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQUMsVUFBVSxFQUFZLE9BQU8sRUFBRSxLQUFLLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDMUQsT0FBTyxFQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFVL0UsT0FBTyxFQUFDLGVBQWUsRUFBRSxhQUFhLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDN0QsT0FBTyxFQUFDLG9CQUFvQixFQUFFLGtCQUFrQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDNUUsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGNBQWMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ2hFLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUUvQyxPQUFPLEVBQUMsYUFBYSxFQUFxQyxNQUFNLGFBQWEsQ0FBQztB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LE1BQU07dUJBQUMsZ0JBQWdCO2dCQUtVLE1BQU07c0JBQXZDLE1BQU07dUJBQUMsZUFBZTtnQkFLWSxPQUFPO3NCQUF6QyxNQUFNO3VCQUFDLGdCQUFnQjtnQkFTZixLQUFLO3NCQURiLE1BQU07dUJBQUMsY0FBYyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtcbiAgQWZ0ZXJWaWV3SW5pdCxcbiAgQ29udGVudENoaWxkLFxuICBDb250ZW50Q2hpbGRyZW4sXG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBJbmplY3QsXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgT3B0aW9uYWwsXG4gIE91dHB1dCxcbiAgUXVlcnlMaXN0LFxuICBTa2lwU2VsZixcbiAgVmlld0NvbnRhaW5lclJlZixcbiAgT25DaGFuZ2VzLFxuICBTaW1wbGVDaGFuZ2VzLFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgU2VsZixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1xuICBjb2VyY2VCb29sZWFuUHJvcGVydHksXG4gIGNvZXJjZU51bWJlclByb3BlcnR5LFxuICBjb2VyY2VFbGVtZW50LFxuICBCb29sZWFuSW5wdXQsXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge09ic2VydmFibGUsIE9ic2VydmVyLCBTdWJqZWN0LCBtZXJnZX0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3N0YXJ0V2l0aCwgdGFrZSwgbWFwLCB0YWtlVW50aWwsIHN3aXRjaE1hcCwgdGFwfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge1xuICBDZGtEcmFnRHJvcCxcbiAgQ2RrRHJhZ0VuZCxcbiAgQ2RrRHJhZ0VudGVyLFxuICBDZGtEcmFnRXhpdCxcbiAgQ2RrRHJhZ01vdmUsXG4gIENka0RyYWdTdGFydCxcbiAgQ2RrRHJhZ1JlbGVhc2UsXG59IGZyb20gJy4uL2RyYWctZXZlbnRzJztcbmltcG9ydCB7Q0RLX0RSQUdfSEFORExFLCBDZGtEcmFnSGFuZGxlfSBmcm9tICcuL2RyYWctaGFuZGxlJztcbmltcG9ydCB7Q0RLX0RSQUdfUExBQ0VIT0xERVIsIENka0RyYWdQbGFjZWhvbGRlcn0gZnJvbSAnLi9kcmFnLXBsYWNlaG9sZGVyJztcbmltcG9ydCB7Q0RLX0RSQUdfUFJFVklFVywgQ2RrRHJhZ1ByZXZpZXd9IGZyb20gJy4vZHJhZy1wcmV2aWV3JztcbmltcG9ydCB7Q0RLX0RSQUdfUEFSRU5UfSBmcm9tICcuLi9kcmFnLXBhcmVudCc7XG5pbXBvcnQge0RyYWdSZWYsIFBvaW50LCBQcmV2aWV3Q29udGFpbmVyfSBmcm9tICcuLi9kcmFnLXJlZic7XG5pbXBvcnQge0NES19EUk9QX0xJU1QsIENka0Ryb3BMaXN0SW50ZXJuYWwgYXMgQ2RrRHJvcExpc3R9IGZyb20gJy4vZHJvcC1saXN0JztcbmltcG9ydCB7RHJhZ0Ryb3B9IGZyb20gJy4uL2RyYWctZHJvcCc7XG5pbXBvcnQge0NES19EUkFHX0NPTkZJRywgRHJhZ0Ryb3BDb25maWcsIERyYWdTdGFydERlbGF5LCBEcmFnQXhpc30gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IHthc3NlcnRFbGVtZW50Tm9kZX0gZnJvbSAnLi9hc3NlcnRpb25zJztcblxuY29uc3QgRFJBR19IT1NUX0NMQVNTID0gJ2Nkay1kcmFnJztcblxuLyoqIEVsZW1lbnQgdGhhdCBjYW4gYmUgbW92ZWQgaW5zaWRlIGEgQ2RrRHJvcExpc3QgY29udGFpbmVyLiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka0RyYWddJyxcbiAgZXhwb3J0QXM6ICdjZGtEcmFnJyxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6IERSQUdfSE9TVF9DTEFTUyxcbiAgICAnW2NsYXNzLmNkay1kcmFnLWRpc2FibGVkXSc6ICdkaXNhYmxlZCcsXG4gICAgJ1tjbGFzcy5jZGstZHJhZy1kcmFnZ2luZ10nOiAnX2RyYWdSZWYuaXNEcmFnZ2luZygpJyxcbiAgfSxcbiAgcHJvdmlkZXJzOiBbe3Byb3ZpZGU6IENES19EUkFHX1BBUkVOVCwgdXNlRXhpc3Rpbmc6IENka0RyYWd9XSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrRHJhZzxUID0gYW55PiBpbXBsZW1lbnRzIEFmdGVyVmlld0luaXQsIE9uQ2hhbmdlcywgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSByZWFkb25seSBfZGVzdHJveWVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX2RyYWdJbnN0YW5jZXM6IENka0RyYWdbXSA9IFtdO1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIHVuZGVybHlpbmcgZHJhZyBpbnN0YW5jZS4gKi9cbiAgX2RyYWdSZWY6IERyYWdSZWY8Q2RrRHJhZzxUPj47XG5cbiAgLyoqIEVsZW1lbnRzIHRoYXQgY2FuIGJlIHVzZWQgdG8gZHJhZyB0aGUgZHJhZ2dhYmxlIGl0ZW0uICovXG4gIEBDb250ZW50Q2hpbGRyZW4oQ0RLX0RSQUdfSEFORExFLCB7ZGVzY2VuZGFudHM6IHRydWV9KSBfaGFuZGxlczogUXVlcnlMaXN0PENka0RyYWdIYW5kbGU+O1xuXG4gIC8qKiBFbGVtZW50IHRoYXQgd2lsbCBiZSB1c2VkIGFzIGEgdGVtcGxhdGUgdG8gY3JlYXRlIHRoZSBkcmFnZ2FibGUgaXRlbSdzIHByZXZpZXcuICovXG4gIEBDb250ZW50Q2hpbGQoQ0RLX0RSQUdfUFJFVklFVykgX3ByZXZpZXdUZW1wbGF0ZTogQ2RrRHJhZ1ByZXZpZXc7XG5cbiAgLyoqIFRlbXBsYXRlIGZvciBwbGFjZWhvbGRlciBlbGVtZW50IHJlbmRlcmVkIHRvIHNob3cgd2hlcmUgYSBkcmFnZ2FibGUgd291bGQgYmUgZHJvcHBlZC4gKi9cbiAgQENvbnRlbnRDaGlsZChDREtfRFJBR19QTEFDRUhPTERFUikgX3BsYWNlaG9sZGVyVGVtcGxhdGU6IENka0RyYWdQbGFjZWhvbGRlcjtcblxuICAvKiogQXJiaXRyYXJ5IGRhdGEgdG8gYXR0YWNoIHRvIHRoaXMgZHJhZyBpbnN0YW5jZS4gKi9cbiAgQElucHV0KCdjZGtEcmFnRGF0YScpIGRhdGE6IFQ7XG5cbiAgLyoqIExvY2tzIHRoZSBwb3NpdGlvbiBvZiB0aGUgZHJhZ2dlZCBlbGVtZW50IGFsb25nIHRoZSBzcGVjaWZpZWQgYXhpcy4gKi9cbiAgQElucHV0KCdjZGtEcmFnTG9ja0F4aXMnKSBsb2NrQXhpczogRHJhZ0F4aXM7XG5cbiAgLyoqXG4gICAqIFNlbGVjdG9yIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGRldGVybWluZSB0aGUgcm9vdCBkcmFnZ2FibGUgZWxlbWVudCwgc3RhcnRpbmcgZnJvbVxuICAgKiB0aGUgYGNka0RyYWdgIGVsZW1lbnQgYW5kIGdvaW5nIHVwIHRoZSBET00uIFBhc3NpbmcgYW4gYWx0ZXJuYXRlIHJvb3QgZWxlbWVudCBpcyB1c2VmdWxcbiAgICogd2hlbiB0cnlpbmcgdG8gZW5hYmxlIGRyYWdnaW5nIG9uIGFuIGVsZW1lbnQgdGhhdCB5b3UgbWlnaHQgbm90IGhhdmUgYWNjZXNzIHRvLlxuICAgKi9cbiAgQElucHV0KCdjZGtEcmFnUm9vdEVsZW1lbnQnKSByb290RWxlbWVudFNlbGVjdG9yOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIE5vZGUgb3Igc2VsZWN0b3IgdGhhdCB3aWxsIGJlIHVzZWQgdG8gZGV0ZXJtaW5lIHRoZSBlbGVtZW50IHRvIHdoaWNoIHRoZSBkcmFnZ2FibGUnc1xuICAgKiBwb3NpdGlvbiB3aWxsIGJlIGNvbnN0cmFpbmVkLiBJZiBhIHN0cmluZyBpcyBwYXNzZWQgaW4sIGl0J2xsIGJlIHVzZWQgYXMgYSBzZWxlY3RvciB0aGF0XG4gICAqIHdpbGwgYmUgbWF0Y2hlZCBzdGFydGluZyBmcm9tIHRoZSBlbGVtZW50J3MgcGFyZW50IGFuZCBnb2luZyB1cCB0aGUgRE9NIHVudGlsIGEgbWF0Y2hcbiAgICogaGFzIGJlZW4gZm91bmQuXG4gICAqL1xuICBASW5wdXQoJ2Nka0RyYWdCb3VuZGFyeScpIGJvdW5kYXJ5RWxlbWVudDogc3RyaW5nIHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBIVE1MRWxlbWVudDtcblxuICAvKipcbiAgICogQW1vdW50IG9mIG1pbGxpc2Vjb25kcyB0byB3YWl0IGFmdGVyIHRoZSB1c2VyIGhhcyBwdXQgdGhlaXJcbiAgICogcG9pbnRlciBkb3duIGJlZm9yZSBzdGFydGluZyB0byBkcmFnIHRoZSBlbGVtZW50LlxuICAgKi9cbiAgQElucHV0KCdjZGtEcmFnU3RhcnREZWxheScpIGRyYWdTdGFydERlbGF5OiBEcmFnU3RhcnREZWxheTtcblxuICAvKipcbiAgICogU2V0cyB0aGUgcG9zaXRpb24gb2YgYSBgQ2RrRHJhZ2AgdGhhdCBpcyBvdXRzaWRlIG9mIGEgZHJvcCBjb250YWluZXIuXG4gICAqIENhbiBiZSB1c2VkIHRvIHJlc3RvcmUgdGhlIGVsZW1lbnQncyBwb3NpdGlvbiBmb3IgYSByZXR1cm5pbmcgdXNlci5cbiAgICovXG4gIEBJbnB1dCgnY2RrRHJhZ0ZyZWVEcmFnUG9zaXRpb24nKSBmcmVlRHJhZ1Bvc2l0aW9uOiBQb2ludDtcblxuICAvKiogV2hldGhlciBzdGFydGluZyB0byBkcmFnIHRoaXMgZWxlbWVudCBpcyBkaXNhYmxlZC4gKi9cbiAgQElucHV0KCdjZGtEcmFnRGlzYWJsZWQnKVxuICBnZXQgZGlzYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2Rpc2FibGVkIHx8ICh0aGlzLmRyb3BDb250YWluZXIgJiYgdGhpcy5kcm9wQ29udGFpbmVyLmRpc2FibGVkKTtcbiAgfVxuICBzZXQgZGlzYWJsZWQodmFsdWU6IEJvb2xlYW5JbnB1dCkge1xuICAgIHRoaXMuX2Rpc2FibGVkID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgICB0aGlzLl9kcmFnUmVmLmRpc2FibGVkID0gdGhpcy5fZGlzYWJsZWQ7XG4gIH1cbiAgcHJpdmF0ZSBfZGlzYWJsZWQ6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gY3VzdG9taXplIHRoZSBsb2dpYyBvZiBob3cgdGhlIHBvc2l0aW9uIG9mIHRoZSBkcmFnIGl0ZW1cbiAgICogaXMgbGltaXRlZCB3aGlsZSBpdCdzIGJlaW5nIGRyYWdnZWQuIEdldHMgY2FsbGVkIHdpdGggYSBwb2ludCBjb250YWluaW5nIHRoZSBjdXJyZW50IHBvc2l0aW9uXG4gICAqIG9mIHRoZSB1c2VyJ3MgcG9pbnRlciBvbiB0aGUgcGFnZSwgYSByZWZlcmVuY2UgdG8gdGhlIGl0ZW0gYmVpbmcgZHJhZ2dlZCBhbmQgaXRzIGRpbWVuc2lvbnMuXG4gICAqIFNob3VsZCByZXR1cm4gYSBwb2ludCBkZXNjcmliaW5nIHdoZXJlIHRoZSBpdGVtIHNob3VsZCBiZSByZW5kZXJlZC5cbiAgICovXG4gIEBJbnB1dCgnY2RrRHJhZ0NvbnN0cmFpblBvc2l0aW9uJykgY29uc3RyYWluUG9zaXRpb24/OiAoXG4gICAgdXNlclBvaW50ZXJQb3NpdGlvbjogUG9pbnQsXG4gICAgZHJhZ1JlZjogRHJhZ1JlZixcbiAgICBkaW1lbnNpb25zOiBDbGllbnRSZWN0LFxuICAgIHBpY2t1cFBvc2l0aW9uSW5FbGVtZW50OiBQb2ludCxcbiAgKSA9PiBQb2ludDtcblxuICAvKiogQ2xhc3MgdG8gYmUgYWRkZWQgdG8gdGhlIHByZXZpZXcgZWxlbWVudC4gKi9cbiAgQElucHV0KCdjZGtEcmFnUHJldmlld0NsYXNzJykgcHJldmlld0NsYXNzOiBzdHJpbmcgfCBzdHJpbmdbXTtcblxuICAvKipcbiAgICogQ29uZmlndXJlcyB0aGUgcGxhY2UgaW50byB3aGljaCB0aGUgcHJldmlldyBvZiB0aGUgaXRlbSB3aWxsIGJlIGluc2VydGVkLiBDYW4gYmUgY29uZmlndXJlZFxuICAgKiBnbG9iYWxseSB0aHJvdWdoIGBDREtfRFJPUF9MSVNUYC4gUG9zc2libGUgdmFsdWVzOlxuICAgKiAtIGBnbG9iYWxgIC0gUHJldmlldyB3aWxsIGJlIGluc2VydGVkIGF0IHRoZSBib3R0b20gb2YgdGhlIGA8Ym9keT5gLiBUaGUgYWR2YW50YWdlIGlzIHRoYXRcbiAgICogeW91IGRvbid0IGhhdmUgdG8gd29ycnkgYWJvdXQgYG92ZXJmbG93OiBoaWRkZW5gIG9yIGB6LWluZGV4YCwgYnV0IHRoZSBpdGVtIHdvbid0IHJldGFpblxuICAgKiBpdHMgaW5oZXJpdGVkIHN0eWxlcy5cbiAgICogLSBgcGFyZW50YCAtIFByZXZpZXcgd2lsbCBiZSBpbnNlcnRlZCBpbnRvIHRoZSBwYXJlbnQgb2YgdGhlIGRyYWcgaXRlbS4gVGhlIGFkdmFudGFnZSBpcyB0aGF0XG4gICAqIGluaGVyaXRlZCBzdHlsZXMgd2lsbCBiZSBwcmVzZXJ2ZWQsIGJ1dCBpdCBtYXkgYmUgY2xpcHBlZCBieSBgb3ZlcmZsb3c6IGhpZGRlbmAgb3Igbm90IGJlXG4gICAqIHZpc2libGUgZHVlIHRvIGB6LWluZGV4YC4gRnVydGhlcm1vcmUsIHRoZSBwcmV2aWV3IGlzIGdvaW5nIHRvIGhhdmUgYW4gZWZmZWN0IG92ZXIgc2VsZWN0b3JzXG4gICAqIGxpa2UgYDpudGgtY2hpbGRgIGFuZCBzb21lIGZsZXhib3ggY29uZmlndXJhdGlvbnMuXG4gICAqIC0gYEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+IHwgSFRNTEVsZW1lbnRgIC0gUHJldmlldyB3aWxsIGJlIGluc2VydGVkIGludG8gYSBzcGVjaWZpYyBlbGVtZW50LlxuICAgKiBTYW1lIGFkdmFudGFnZXMgYW5kIGRpc2FkdmFudGFnZXMgYXMgYHBhcmVudGAuXG4gICAqL1xuICBASW5wdXQoJ2Nka0RyYWdQcmV2aWV3Q29udGFpbmVyJykgcHJldmlld0NvbnRhaW5lcjogUHJldmlld0NvbnRhaW5lcjtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBzdGFydHMgZHJhZ2dpbmcgdGhlIGl0ZW0uICovXG4gIEBPdXRwdXQoJ2Nka0RyYWdTdGFydGVkJykgcmVhZG9ubHkgc3RhcnRlZDogRXZlbnRFbWl0dGVyPENka0RyYWdTdGFydD4gPVxuICAgIG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ1N0YXJ0PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGhhcyByZWxlYXNlZCBhIGRyYWcgaXRlbSwgYmVmb3JlIGFueSBhbmltYXRpb25zIGhhdmUgc3RhcnRlZC4gKi9cbiAgQE91dHB1dCgnY2RrRHJhZ1JlbGVhc2VkJykgcmVhZG9ubHkgcmVsZWFzZWQ6IEV2ZW50RW1pdHRlcjxDZGtEcmFnUmVsZWFzZT4gPVxuICAgIG5ldyBFdmVudEVtaXR0ZXI8Q2RrRHJhZ1JlbGVhc2U+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgc3RvcHMgZHJhZ2dpbmcgYW4gaXRlbSBpbiB0aGUgY29udGFpbmVyLiAqL1xuICBAT3V0cHV0KCdjZGtEcmFnRW5kZWQnKSByZWFkb25seSBlbmRlZDogRXZlbnRFbWl0dGVyPENka0RyYWdFbmQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxDZGtEcmFnRW5kPigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB1c2VyIGhhcyBtb3ZlZCB0aGUgaXRlbSBpbnRvIGEgbmV3IGNvbnRhaW5lci4gKi9cbiAgQE91dHB1dCgnY2RrRHJhZ0VudGVyZWQnKSByZWFkb25seSBlbnRlcmVkOiBFdmVudEVtaXR0ZXI8Q2RrRHJhZ0VudGVyPGFueT4+ID0gbmV3IEV2ZW50RW1pdHRlcjxcbiAgICBDZGtEcmFnRW50ZXI8YW55PlxuICA+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgcmVtb3ZlcyB0aGUgaXRlbSBpdHMgY29udGFpbmVyIGJ5IGRyYWdnaW5nIGl0IGludG8gYW5vdGhlciBjb250YWluZXIuICovXG4gIEBPdXRwdXQoJ2Nka0RyYWdFeGl0ZWQnKSByZWFkb25seSBleGl0ZWQ6IEV2ZW50RW1pdHRlcjxDZGtEcmFnRXhpdDxhbnk+PiA9IG5ldyBFdmVudEVtaXR0ZXI8XG4gICAgQ2RrRHJhZ0V4aXQ8YW55PlxuICA+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHVzZXIgZHJvcHMgdGhlIGl0ZW0gaW5zaWRlIGEgY29udGFpbmVyLiAqL1xuICBAT3V0cHV0KCdjZGtEcmFnRHJvcHBlZCcpIHJlYWRvbmx5IGRyb3BwZWQ6IEV2ZW50RW1pdHRlcjxDZGtEcmFnRHJvcDxhbnk+PiA9IG5ldyBFdmVudEVtaXR0ZXI8XG4gICAgQ2RrRHJhZ0Ryb3A8YW55PlxuICA+KCk7XG5cbiAgLyoqXG4gICAqIEVtaXRzIGFzIHRoZSB1c2VyIGlzIGRyYWdnaW5nIHRoZSBpdGVtLiBVc2Ugd2l0aCBjYXV0aW9uLFxuICAgKiBiZWNhdXNlIHRoaXMgZXZlbnQgd2lsbCBmaXJlIGZvciBldmVyeSBwaXhlbCB0aGF0IHRoZSB1c2VyIGhhcyBkcmFnZ2VkLlxuICAgKi9cbiAgQE91dHB1dCgnY2RrRHJhZ01vdmVkJylcbiAgcmVhZG9ubHkgbW92ZWQ6IE9ic2VydmFibGU8Q2RrRHJhZ01vdmU8VD4+ID0gbmV3IE9ic2VydmFibGUoXG4gICAgKG9ic2VydmVyOiBPYnNlcnZlcjxDZGtEcmFnTW92ZTxUPj4pID0+IHtcbiAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IHRoaXMuX2RyYWdSZWYubW92ZWRcbiAgICAgICAgLnBpcGUoXG4gICAgICAgICAgbWFwKG1vdmVkRXZlbnQgPT4gKHtcbiAgICAgICAgICAgIHNvdXJjZTogdGhpcyxcbiAgICAgICAgICAgIHBvaW50ZXJQb3NpdGlvbjogbW92ZWRFdmVudC5wb2ludGVyUG9zaXRpb24sXG4gICAgICAgICAgICBldmVudDogbW92ZWRFdmVudC5ldmVudCxcbiAgICAgICAgICAgIGRlbHRhOiBtb3ZlZEV2ZW50LmRlbHRhLFxuICAgICAgICAgICAgZGlzdGFuY2U6IG1vdmVkRXZlbnQuZGlzdGFuY2UsXG4gICAgICAgICAgfSkpLFxuICAgICAgICApXG4gICAgICAgIC5zdWJzY3JpYmUob2JzZXJ2ZXIpO1xuXG4gICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgIH07XG4gICAgfSxcbiAgKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAvKiogRWxlbWVudCB0aGF0IHRoZSBkcmFnZ2FibGUgaXMgYXR0YWNoZWQgdG8uICovXG4gICAgcHVibGljIGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgIC8qKiBEcm9wcGFibGUgY29udGFpbmVyIHRoYXQgdGhlIGRyYWdnYWJsZSBpcyBhIHBhcnQgb2YuICovXG4gICAgQEluamVjdChDREtfRFJPUF9MSVNUKSBAT3B0aW9uYWwoKSBAU2tpcFNlbGYoKSBwdWJsaWMgZHJvcENvbnRhaW5lcjogQ2RrRHJvcExpc3QsXG4gICAgLyoqXG4gICAgICogQGRlcHJlY2F0ZWQgYF9kb2N1bWVudGAgcGFyYW1ldGVyIG5vIGxvbmdlciBiZWluZyB1c2VkIGFuZCB3aWxsIGJlIHJlbW92ZWQuXG4gICAgICogQGJyZWFraW5nLWNoYW5nZSAxMi4wLjBcbiAgICAgKi9cbiAgICBASW5qZWN0KERPQ1VNRU5UKSBfZG9jdW1lbnQ6IGFueSxcbiAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICBwcml2YXRlIF92aWV3Q29udGFpbmVyUmVmOiBWaWV3Q29udGFpbmVyUmVmLFxuICAgIEBPcHRpb25hbCgpIEBJbmplY3QoQ0RLX0RSQUdfQ09ORklHKSBjb25maWc6IERyYWdEcm9wQ29uZmlnLFxuICAgIEBPcHRpb25hbCgpIHByaXZhdGUgX2RpcjogRGlyZWN0aW9uYWxpdHksXG4gICAgZHJhZ0Ryb3A6IERyYWdEcm9wLFxuICAgIHByaXZhdGUgX2NoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBAT3B0aW9uYWwoKSBAU2VsZigpIEBJbmplY3QoQ0RLX0RSQUdfSEFORExFKSBwcml2YXRlIF9zZWxmSGFuZGxlPzogQ2RrRHJhZ0hhbmRsZSxcbiAgICBAT3B0aW9uYWwoKSBAU2tpcFNlbGYoKSBASW5qZWN0KENES19EUkFHX1BBUkVOVCkgcHJpdmF0ZSBfcGFyZW50RHJhZz86IENka0RyYWcsXG4gICkge1xuICAgIHRoaXMuX2RyYWdSZWYgPSBkcmFnRHJvcC5jcmVhdGVEcmFnKGVsZW1lbnQsIHtcbiAgICAgIGRyYWdTdGFydFRocmVzaG9sZDpcbiAgICAgICAgY29uZmlnICYmIGNvbmZpZy5kcmFnU3RhcnRUaHJlc2hvbGQgIT0gbnVsbCA/IGNvbmZpZy5kcmFnU3RhcnRUaHJlc2hvbGQgOiA1LFxuICAgICAgcG9pbnRlckRpcmVjdGlvbkNoYW5nZVRocmVzaG9sZDpcbiAgICAgICAgY29uZmlnICYmIGNvbmZpZy5wb2ludGVyRGlyZWN0aW9uQ2hhbmdlVGhyZXNob2xkICE9IG51bGxcbiAgICAgICAgICA/IGNvbmZpZy5wb2ludGVyRGlyZWN0aW9uQ2hhbmdlVGhyZXNob2xkXG4gICAgICAgICAgOiA1LFxuICAgICAgekluZGV4OiBjb25maWc/LnpJbmRleCxcbiAgICB9KTtcbiAgICB0aGlzLl9kcmFnUmVmLmRhdGEgPSB0aGlzO1xuXG4gICAgLy8gV2UgaGF2ZSB0byBrZWVwIHRyYWNrIG9mIHRoZSBkcmFnIGluc3RhbmNlcyBpbiBvcmRlciB0byBiZSBhYmxlIHRvIG1hdGNoIGFuIGVsZW1lbnQgdG9cbiAgICAvLyBhIGRyYWcgaW5zdGFuY2UuIFdlIGNhbid0IGdvIHRocm91Z2ggdGhlIGdsb2JhbCByZWdpc3RyeSBvZiBgRHJhZ1JlZmAsIGJlY2F1c2UgdGhlIHJvb3RcbiAgICAvLyBlbGVtZW50IGNvdWxkIGJlIGRpZmZlcmVudC5cbiAgICBDZGtEcmFnLl9kcmFnSW5zdGFuY2VzLnB1c2godGhpcyk7XG5cbiAgICBpZiAoY29uZmlnKSB7XG4gICAgICB0aGlzLl9hc3NpZ25EZWZhdWx0cyhjb25maWcpO1xuICAgIH1cblxuICAgIC8vIE5vdGUgdGhhdCB1c3VhbGx5IHRoZSBjb250YWluZXIgaXMgYXNzaWduZWQgd2hlbiB0aGUgZHJvcCBsaXN0IGlzIHBpY2tzIHVwIHRoZSBpdGVtLCBidXQgaW5cbiAgICAvLyBzb21lIGNhc2VzIChtYWlubHkgdHJhbnNwbGFudGVkIHZpZXdzIHdpdGggT25QdXNoLCBzZWUgIzE4MzQxKSB3ZSBtYXkgZW5kIHVwIGluIGEgc2l0dWF0aW9uXG4gICAgLy8gd2hlcmUgdGhlcmUgYXJlIG5vIGl0ZW1zIG9uIHRoZSBmaXJzdCBjaGFuZ2UgZGV0ZWN0aW9uIHBhc3MsIGJ1dCB0aGUgaXRlbXMgZ2V0IHBpY2tlZCB1cCBhc1xuICAgIC8vIHNvb24gYXMgdGhlIHVzZXIgdHJpZ2dlcnMgYW5vdGhlciBwYXNzIGJ5IGRyYWdnaW5nLiBUaGlzIGlzIGEgcHJvYmxlbSwgYmVjYXVzZSB0aGUgaXRlbSB3b3VsZFxuICAgIC8vIGhhdmUgdG8gc3dpdGNoIGZyb20gc3RhbmRhbG9uZSBtb2RlIHRvIGRyYWcgbW9kZSBpbiB0aGUgbWlkZGxlIG9mIHRoZSBkcmFnZ2luZyBzZXF1ZW5jZSB3aGljaFxuICAgIC8vIGlzIHRvbyBsYXRlIHNpbmNlIHRoZSB0d28gbW9kZXMgc2F2ZSBkaWZmZXJlbnQga2luZHMgb2YgaW5mb3JtYXRpb24uIFdlIHdvcmsgYXJvdW5kIGl0IGJ5XG4gICAgLy8gYXNzaWduaW5nIHRoZSBkcm9wIGNvbnRhaW5lciBib3RoIGZyb20gaGVyZSBhbmQgdGhlIGxpc3QuXG4gICAgaWYgKGRyb3BDb250YWluZXIpIHtcbiAgICAgIHRoaXMuX2RyYWdSZWYuX3dpdGhEcm9wQ29udGFpbmVyKGRyb3BDb250YWluZXIuX2Ryb3BMaXN0UmVmKTtcbiAgICAgIGRyb3BDb250YWluZXIuYWRkSXRlbSh0aGlzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9zeW5jSW5wdXRzKHRoaXMuX2RyYWdSZWYpO1xuICAgIHRoaXMuX2hhbmRsZUV2ZW50cyh0aGlzLl9kcmFnUmVmKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBlbGVtZW50IHRoYXQgaXMgYmVpbmcgdXNlZCBhcyBhIHBsYWNlaG9sZGVyXG4gICAqIHdoaWxlIHRoZSBjdXJyZW50IGVsZW1lbnQgaXMgYmVpbmcgZHJhZ2dlZC5cbiAgICovXG4gIGdldFBsYWNlaG9sZGVyRWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX2RyYWdSZWYuZ2V0UGxhY2Vob2xkZXJFbGVtZW50KCk7XG4gIH1cblxuICAvKiogUmV0dXJucyB0aGUgcm9vdCBkcmFnZ2FibGUgZWxlbWVudC4gKi9cbiAgZ2V0Um9vdEVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLl9kcmFnUmVmLmdldFJvb3RFbGVtZW50KCk7XG4gIH1cblxuICAvKiogUmVzZXRzIGEgc3RhbmRhbG9uZSBkcmFnIGl0ZW0gdG8gaXRzIGluaXRpYWwgcG9zaXRpb24uICovXG4gIHJlc2V0KCk6IHZvaWQge1xuICAgIHRoaXMuX2RyYWdSZWYucmVzZXQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBwaXhlbCBjb29yZGluYXRlcyBvZiB0aGUgZHJhZ2dhYmxlIG91dHNpZGUgb2YgYSBkcm9wIGNvbnRhaW5lci5cbiAgICovXG4gIGdldEZyZWVEcmFnUG9zaXRpb24oKTogUmVhZG9ubHk8UG9pbnQ+IHtcbiAgICByZXR1cm4gdGhpcy5fZHJhZ1JlZi5nZXRGcmVlRHJhZ1Bvc2l0aW9uKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY3VycmVudCBwb3NpdGlvbiBpbiBwaXhlbHMgdGhlIGRyYWdnYWJsZSBvdXRzaWRlIG9mIGEgZHJvcCBjb250YWluZXIuXG4gICAqIEBwYXJhbSB2YWx1ZSBOZXcgcG9zaXRpb24gdG8gYmUgc2V0LlxuICAgKi9cbiAgc2V0RnJlZURyYWdQb3NpdGlvbih2YWx1ZTogUG9pbnQpOiB2b2lkIHtcbiAgICB0aGlzLl9kcmFnUmVmLnNldEZyZWVEcmFnUG9zaXRpb24odmFsdWUpO1xuICB9XG5cbiAgbmdBZnRlclZpZXdJbml0KCkge1xuICAgIC8vIE5vcm1hbGx5IHRoaXMgaXNuJ3QgaW4gdGhlIHpvbmUsIGJ1dCBpdCBjYW4gY2F1c2UgbWFqb3IgcGVyZm9ybWFuY2UgcmVncmVzc2lvbnMgZm9yIGFwcHNcbiAgICAvLyB1c2luZyBgem9uZS1wYXRjaC1yeGpzYCBiZWNhdXNlIGl0J2xsIHRyaWdnZXIgYSBjaGFuZ2UgZGV0ZWN0aW9uIHdoZW4gaXQgdW5zdWJzY3JpYmVzLlxuICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAvLyBXZSBuZWVkIHRvIHdhaXQgZm9yIHRoZSB6b25lIHRvIHN0YWJpbGl6ZSwgaW4gb3JkZXIgZm9yIHRoZSByZWZlcmVuY2VcbiAgICAgIC8vIGVsZW1lbnQgdG8gYmUgaW4gdGhlIHByb3BlciBwbGFjZSBpbiB0aGUgRE9NLiBUaGlzIGlzIG1vc3RseSByZWxldmFudFxuICAgICAgLy8gZm9yIGRyYWdnYWJsZSBlbGVtZW50cyBpbnNpZGUgcG9ydGFscyBzaW5jZSB0aGV5IGdldCBzdGFtcGVkIG91dCBpblxuICAgICAgLy8gdGhlaXIgb3JpZ2luYWwgRE9NIHBvc2l0aW9uIGFuZCB0aGVuIHRoZXkgZ2V0IHRyYW5zZmVycmVkIHRvIHRoZSBwb3J0YWwuXG4gICAgICB0aGlzLl9uZ1pvbmUub25TdGFibGUucGlwZSh0YWtlKDEpLCB0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSkuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgdGhpcy5fdXBkYXRlUm9vdEVsZW1lbnQoKTtcbiAgICAgICAgdGhpcy5fc2V0dXBIYW5kbGVzTGlzdGVuZXIoKTtcblxuICAgICAgICBpZiAodGhpcy5mcmVlRHJhZ1Bvc2l0aW9uKSB7XG4gICAgICAgICAgdGhpcy5fZHJhZ1JlZi5zZXRGcmVlRHJhZ1Bvc2l0aW9uKHRoaXMuZnJlZURyYWdQb3NpdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcykge1xuICAgIGNvbnN0IHJvb3RTZWxlY3RvckNoYW5nZSA9IGNoYW5nZXNbJ3Jvb3RFbGVtZW50U2VsZWN0b3InXTtcbiAgICBjb25zdCBwb3NpdGlvbkNoYW5nZSA9IGNoYW5nZXNbJ2ZyZWVEcmFnUG9zaXRpb24nXTtcblxuICAgIC8vIFdlIGRvbid0IGhhdmUgdG8gcmVhY3QgdG8gdGhlIGZpcnN0IGNoYW5nZSBzaW5jZSBpdCdzIGJlaW5nXG4gICAgLy8gaGFuZGxlZCBpbiBgbmdBZnRlclZpZXdJbml0YCB3aGVyZSBpdCBuZWVkcyB0byBiZSBkZWZlcnJlZC5cbiAgICBpZiAocm9vdFNlbGVjdG9yQ2hhbmdlICYmICFyb290U2VsZWN0b3JDaGFuZ2UuZmlyc3RDaGFuZ2UpIHtcbiAgICAgIHRoaXMuX3VwZGF0ZVJvb3RFbGVtZW50KCk7XG4gICAgfVxuXG4gICAgLy8gU2tpcCB0aGUgZmlyc3QgY2hhbmdlIHNpbmNlIGl0J3MgYmVpbmcgaGFuZGxlZCBpbiBgbmdBZnRlclZpZXdJbml0YC5cbiAgICBpZiAocG9zaXRpb25DaGFuZ2UgJiYgIXBvc2l0aW9uQ2hhbmdlLmZpcnN0Q2hhbmdlICYmIHRoaXMuZnJlZURyYWdQb3NpdGlvbikge1xuICAgICAgdGhpcy5fZHJhZ1JlZi5zZXRGcmVlRHJhZ1Bvc2l0aW9uKHRoaXMuZnJlZURyYWdQb3NpdGlvbik7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuZHJvcENvbnRhaW5lcikge1xuICAgICAgdGhpcy5kcm9wQ29udGFpbmVyLnJlbW92ZUl0ZW0odGhpcyk7XG4gICAgfVxuXG4gICAgY29uc3QgaW5kZXggPSBDZGtEcmFnLl9kcmFnSW5zdGFuY2VzLmluZGV4T2YodGhpcyk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIENka0RyYWcuX2RyYWdJbnN0YW5jZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG5cbiAgICAvLyBVbm5lY2Vzc2FyeSBpbiBtb3N0IGNhc2VzLCBidXQgdXNlZCB0byBhdm9pZCBleHRyYSBjaGFuZ2UgZGV0ZWN0aW9ucyB3aXRoIGB6b25lLXBhdGhzLXJ4anNgLlxuICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICB0aGlzLl9kZXN0cm95ZWQubmV4dCgpO1xuICAgICAgdGhpcy5fZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gICAgICB0aGlzLl9kcmFnUmVmLmRpc3Bvc2UoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBTeW5jcyB0aGUgcm9vdCBlbGVtZW50IHdpdGggdGhlIGBEcmFnUmVmYC4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlUm9vdEVsZW1lbnQoKSB7XG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50O1xuICAgIGxldCByb290RWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgaWYgKHRoaXMucm9vdEVsZW1lbnRTZWxlY3Rvcikge1xuICAgICAgcm9vdEVsZW1lbnQgPVxuICAgICAgICBlbGVtZW50LmNsb3Nlc3QgIT09IHVuZGVmaW5lZFxuICAgICAgICAgID8gKGVsZW1lbnQuY2xvc2VzdCh0aGlzLnJvb3RFbGVtZW50U2VsZWN0b3IpIGFzIEhUTUxFbGVtZW50KVxuICAgICAgICAgIDogLy8gQ29tbWVudCB0YWcgZG9lc24ndCBoYXZlIGNsb3Nlc3QgbWV0aG9kLCBzbyB1c2UgcGFyZW50J3Mgb25lLlxuICAgICAgICAgICAgKGVsZW1lbnQucGFyZW50RWxlbWVudD8uY2xvc2VzdCh0aGlzLnJvb3RFbGVtZW50U2VsZWN0b3IpIGFzIEhUTUxFbGVtZW50KTtcbiAgICB9XG5cbiAgICBpZiAocm9vdEVsZW1lbnQgJiYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgIGFzc2VydEVsZW1lbnROb2RlKHJvb3RFbGVtZW50LCAnY2RrRHJhZycpO1xuICAgIH1cblxuICAgIHRoaXMuX2RyYWdSZWYud2l0aFJvb3RFbGVtZW50KHJvb3RFbGVtZW50IHx8IGVsZW1lbnQpO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIGJvdW5kYXJ5IGVsZW1lbnQsIGJhc2VkIG9uIHRoZSBgYm91bmRhcnlFbGVtZW50YCB2YWx1ZS4gKi9cbiAgcHJpdmF0ZSBfZ2V0Qm91bmRhcnlFbGVtZW50KCkge1xuICAgIGNvbnN0IGJvdW5kYXJ5ID0gdGhpcy5ib3VuZGFyeUVsZW1lbnQ7XG5cbiAgICBpZiAoIWJvdW5kYXJ5KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGJvdW5kYXJ5ID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50LmNsb3Nlc3Q8SFRNTEVsZW1lbnQ+KGJvdW5kYXJ5KTtcbiAgICB9XG5cbiAgICByZXR1cm4gY29lcmNlRWxlbWVudChib3VuZGFyeSk7XG4gIH1cblxuICAvKiogU3luY3MgdGhlIGlucHV0cyBvZiB0aGUgQ2RrRHJhZyB3aXRoIHRoZSBvcHRpb25zIG9mIHRoZSB1bmRlcmx5aW5nIERyYWdSZWYuICovXG4gIHByaXZhdGUgX3N5bmNJbnB1dHMocmVmOiBEcmFnUmVmPENka0RyYWc8VD4+KSB7XG4gICAgcmVmLmJlZm9yZVN0YXJ0ZWQuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIGlmICghcmVmLmlzRHJhZ2dpbmcoKSkge1xuICAgICAgICBjb25zdCBkaXIgPSB0aGlzLl9kaXI7XG4gICAgICAgIGNvbnN0IGRyYWdTdGFydERlbGF5ID0gdGhpcy5kcmFnU3RhcnREZWxheTtcbiAgICAgICAgY29uc3QgcGxhY2Vob2xkZXIgPSB0aGlzLl9wbGFjZWhvbGRlclRlbXBsYXRlXG4gICAgICAgICAgPyB7XG4gICAgICAgICAgICAgIHRlbXBsYXRlOiB0aGlzLl9wbGFjZWhvbGRlclRlbXBsYXRlLnRlbXBsYXRlUmVmLFxuICAgICAgICAgICAgICBjb250ZXh0OiB0aGlzLl9wbGFjZWhvbGRlclRlbXBsYXRlLmRhdGEsXG4gICAgICAgICAgICAgIHZpZXdDb250YWluZXI6IHRoaXMuX3ZpZXdDb250YWluZXJSZWYsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgOiBudWxsO1xuICAgICAgICBjb25zdCBwcmV2aWV3ID0gdGhpcy5fcHJldmlld1RlbXBsYXRlXG4gICAgICAgICAgPyB7XG4gICAgICAgICAgICAgIHRlbXBsYXRlOiB0aGlzLl9wcmV2aWV3VGVtcGxhdGUudGVtcGxhdGVSZWYsXG4gICAgICAgICAgICAgIGNvbnRleHQ6IHRoaXMuX3ByZXZpZXdUZW1wbGF0ZS5kYXRhLFxuICAgICAgICAgICAgICBtYXRjaFNpemU6IHRoaXMuX3ByZXZpZXdUZW1wbGF0ZS5tYXRjaFNpemUsXG4gICAgICAgICAgICAgIHZpZXdDb250YWluZXI6IHRoaXMuX3ZpZXdDb250YWluZXJSZWYsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgOiBudWxsO1xuXG4gICAgICAgIHJlZi5kaXNhYmxlZCA9IHRoaXMuZGlzYWJsZWQ7XG4gICAgICAgIHJlZi5sb2NrQXhpcyA9IHRoaXMubG9ja0F4aXM7XG4gICAgICAgIHJlZi5kcmFnU3RhcnREZWxheSA9XG4gICAgICAgICAgdHlwZW9mIGRyYWdTdGFydERlbGF5ID09PSAnb2JqZWN0JyAmJiBkcmFnU3RhcnREZWxheVxuICAgICAgICAgICAgPyBkcmFnU3RhcnREZWxheVxuICAgICAgICAgICAgOiBjb2VyY2VOdW1iZXJQcm9wZXJ0eShkcmFnU3RhcnREZWxheSk7XG4gICAgICAgIHJlZi5jb25zdHJhaW5Qb3NpdGlvbiA9IHRoaXMuY29uc3RyYWluUG9zaXRpb247XG4gICAgICAgIHJlZi5wcmV2aWV3Q2xhc3MgPSB0aGlzLnByZXZpZXdDbGFzcztcbiAgICAgICAgcmVmXG4gICAgICAgICAgLndpdGhCb3VuZGFyeUVsZW1lbnQodGhpcy5fZ2V0Qm91bmRhcnlFbGVtZW50KCkpXG4gICAgICAgICAgLndpdGhQbGFjZWhvbGRlclRlbXBsYXRlKHBsYWNlaG9sZGVyKVxuICAgICAgICAgIC53aXRoUHJldmlld1RlbXBsYXRlKHByZXZpZXcpXG4gICAgICAgICAgLndpdGhQcmV2aWV3Q29udGFpbmVyKHRoaXMucHJldmlld0NvbnRhaW5lciB8fCAnZ2xvYmFsJyk7XG5cbiAgICAgICAgaWYgKGRpcikge1xuICAgICAgICAgIHJlZi53aXRoRGlyZWN0aW9uKGRpci52YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFRoaXMgb25seSBuZWVkcyB0byBiZSByZXNvbHZlZCBvbmNlLlxuICAgIHJlZi5iZWZvcmVTdGFydGVkLnBpcGUodGFrZSgxKSkuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIC8vIElmIHdlIG1hbmFnZWQgdG8gcmVzb2x2ZSBhIHBhcmVudCB0aHJvdWdoIERJLCB1c2UgaXQuXG4gICAgICBpZiAodGhpcy5fcGFyZW50RHJhZykge1xuICAgICAgICByZWYud2l0aFBhcmVudCh0aGlzLl9wYXJlbnREcmFnLl9kcmFnUmVmKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBPdGhlcndpc2UgZmFsbCBiYWNrIHRvIHJlc29sdmluZyB0aGUgcGFyZW50IGJ5IGxvb2tpbmcgdXAgdGhlIERPTS4gVGhpcyBjYW4gaGFwcGVuIGlmXG4gICAgICAvLyB0aGUgaXRlbSB3YXMgcHJvamVjdGVkIGludG8gYW5vdGhlciBpdGVtIGJ5IHNvbWV0aGluZyBsaWtlIGBuZ1RlbXBsYXRlT3V0bGV0YC5cbiAgICAgIGxldCBwYXJlbnQgPSB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudC5wYXJlbnRFbGVtZW50O1xuICAgICAgd2hpbGUgKHBhcmVudCkge1xuICAgICAgICBpZiAocGFyZW50LmNsYXNzTGlzdC5jb250YWlucyhEUkFHX0hPU1RfQ0xBU1MpKSB7XG4gICAgICAgICAgcmVmLndpdGhQYXJlbnQoXG4gICAgICAgICAgICBDZGtEcmFnLl9kcmFnSW5zdGFuY2VzLmZpbmQoZHJhZyA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiBkcmFnLmVsZW1lbnQubmF0aXZlRWxlbWVudCA9PT0gcGFyZW50O1xuICAgICAgICAgICAgfSk/Ll9kcmFnUmVmIHx8IG51bGwsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50RWxlbWVudDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBIYW5kbGVzIHRoZSBldmVudHMgZnJvbSB0aGUgdW5kZXJseWluZyBgRHJhZ1JlZmAuICovXG4gIHByaXZhdGUgX2hhbmRsZUV2ZW50cyhyZWY6IERyYWdSZWY8Q2RrRHJhZzxUPj4pIHtcbiAgICByZWYuc3RhcnRlZC5zdWJzY3JpYmUoc3RhcnRFdmVudCA9PiB7XG4gICAgICB0aGlzLnN0YXJ0ZWQuZW1pdCh7c291cmNlOiB0aGlzLCBldmVudDogc3RhcnRFdmVudC5ldmVudH0pO1xuXG4gICAgICAvLyBTaW5jZSBhbGwgb2YgdGhlc2UgZXZlbnRzIHJ1biBvdXRzaWRlIG9mIGNoYW5nZSBkZXRlY3Rpb24sXG4gICAgICAvLyB3ZSBuZWVkIHRvIGVuc3VyZSB0aGF0IGV2ZXJ5dGhpbmcgaXMgbWFya2VkIGNvcnJlY3RseS5cbiAgICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICAgIH0pO1xuXG4gICAgcmVmLnJlbGVhc2VkLnN1YnNjcmliZShyZWxlYXNlRXZlbnQgPT4ge1xuICAgICAgdGhpcy5yZWxlYXNlZC5lbWl0KHtzb3VyY2U6IHRoaXMsIGV2ZW50OiByZWxlYXNlRXZlbnQuZXZlbnR9KTtcbiAgICB9KTtcblxuICAgIHJlZi5lbmRlZC5zdWJzY3JpYmUoZW5kRXZlbnQgPT4ge1xuICAgICAgdGhpcy5lbmRlZC5lbWl0KHtcbiAgICAgICAgc291cmNlOiB0aGlzLFxuICAgICAgICBkaXN0YW5jZTogZW5kRXZlbnQuZGlzdGFuY2UsXG4gICAgICAgIGRyb3BQb2ludDogZW5kRXZlbnQuZHJvcFBvaW50LFxuICAgICAgICBldmVudDogZW5kRXZlbnQuZXZlbnQsXG4gICAgICB9KTtcblxuICAgICAgLy8gU2luY2UgYWxsIG9mIHRoZXNlIGV2ZW50cyBydW4gb3V0c2lkZSBvZiBjaGFuZ2UgZGV0ZWN0aW9uLFxuICAgICAgLy8gd2UgbmVlZCB0byBlbnN1cmUgdGhhdCBldmVyeXRoaW5nIGlzIG1hcmtlZCBjb3JyZWN0bHkuXG4gICAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgICB9KTtcblxuICAgIHJlZi5lbnRlcmVkLnN1YnNjcmliZShlbnRlckV2ZW50ID0+IHtcbiAgICAgIHRoaXMuZW50ZXJlZC5lbWl0KHtcbiAgICAgICAgY29udGFpbmVyOiBlbnRlckV2ZW50LmNvbnRhaW5lci5kYXRhLFxuICAgICAgICBpdGVtOiB0aGlzLFxuICAgICAgICBjdXJyZW50SW5kZXg6IGVudGVyRXZlbnQuY3VycmVudEluZGV4LFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZWYuZXhpdGVkLnN1YnNjcmliZShleGl0RXZlbnQgPT4ge1xuICAgICAgdGhpcy5leGl0ZWQuZW1pdCh7XG4gICAgICAgIGNvbnRhaW5lcjogZXhpdEV2ZW50LmNvbnRhaW5lci5kYXRhLFxuICAgICAgICBpdGVtOiB0aGlzLFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZWYuZHJvcHBlZC5zdWJzY3JpYmUoZHJvcEV2ZW50ID0+IHtcbiAgICAgIHRoaXMuZHJvcHBlZC5lbWl0KHtcbiAgICAgICAgcHJldmlvdXNJbmRleDogZHJvcEV2ZW50LnByZXZpb3VzSW5kZXgsXG4gICAgICAgIGN1cnJlbnRJbmRleDogZHJvcEV2ZW50LmN1cnJlbnRJbmRleCxcbiAgICAgICAgcHJldmlvdXNDb250YWluZXI6IGRyb3BFdmVudC5wcmV2aW91c0NvbnRhaW5lci5kYXRhLFxuICAgICAgICBjb250YWluZXI6IGRyb3BFdmVudC5jb250YWluZXIuZGF0YSxcbiAgICAgICAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcjogZHJvcEV2ZW50LmlzUG9pbnRlck92ZXJDb250YWluZXIsXG4gICAgICAgIGl0ZW06IHRoaXMsXG4gICAgICAgIGRpc3RhbmNlOiBkcm9wRXZlbnQuZGlzdGFuY2UsXG4gICAgICAgIGRyb3BQb2ludDogZHJvcEV2ZW50LmRyb3BQb2ludCxcbiAgICAgICAgZXZlbnQ6IGRyb3BFdmVudC5ldmVudCxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIEFzc2lnbnMgdGhlIGRlZmF1bHQgaW5wdXQgdmFsdWVzIGJhc2VkIG9uIGEgcHJvdmlkZWQgY29uZmlnIG9iamVjdC4gKi9cbiAgcHJpdmF0ZSBfYXNzaWduRGVmYXVsdHMoY29uZmlnOiBEcmFnRHJvcENvbmZpZykge1xuICAgIGNvbnN0IHtcbiAgICAgIGxvY2tBeGlzLFxuICAgICAgZHJhZ1N0YXJ0RGVsYXksXG4gICAgICBjb25zdHJhaW5Qb3NpdGlvbixcbiAgICAgIHByZXZpZXdDbGFzcyxcbiAgICAgIGJvdW5kYXJ5RWxlbWVudCxcbiAgICAgIGRyYWdnaW5nRGlzYWJsZWQsXG4gICAgICByb290RWxlbWVudFNlbGVjdG9yLFxuICAgICAgcHJldmlld0NvbnRhaW5lcixcbiAgICB9ID0gY29uZmlnO1xuXG4gICAgdGhpcy5kaXNhYmxlZCA9IGRyYWdnaW5nRGlzYWJsZWQgPT0gbnVsbCA/IGZhbHNlIDogZHJhZ2dpbmdEaXNhYmxlZDtcbiAgICB0aGlzLmRyYWdTdGFydERlbGF5ID0gZHJhZ1N0YXJ0RGVsYXkgfHwgMDtcblxuICAgIGlmIChsb2NrQXhpcykge1xuICAgICAgdGhpcy5sb2NrQXhpcyA9IGxvY2tBeGlzO1xuICAgIH1cblxuICAgIGlmIChjb25zdHJhaW5Qb3NpdGlvbikge1xuICAgICAgdGhpcy5jb25zdHJhaW5Qb3NpdGlvbiA9IGNvbnN0cmFpblBvc2l0aW9uO1xuICAgIH1cblxuICAgIGlmIChwcmV2aWV3Q2xhc3MpIHtcbiAgICAgIHRoaXMucHJldmlld0NsYXNzID0gcHJldmlld0NsYXNzO1xuICAgIH1cblxuICAgIGlmIChib3VuZGFyeUVsZW1lbnQpIHtcbiAgICAgIHRoaXMuYm91bmRhcnlFbGVtZW50ID0gYm91bmRhcnlFbGVtZW50O1xuICAgIH1cblxuICAgIGlmIChyb290RWxlbWVudFNlbGVjdG9yKSB7XG4gICAgICB0aGlzLnJvb3RFbGVtZW50U2VsZWN0b3IgPSByb290RWxlbWVudFNlbGVjdG9yO1xuICAgIH1cblxuICAgIGlmIChwcmV2aWV3Q29udGFpbmVyKSB7XG4gICAgICB0aGlzLnByZXZpZXdDb250YWluZXIgPSBwcmV2aWV3Q29udGFpbmVyO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTZXRzIHVwIHRoZSBsaXN0ZW5lciB0aGF0IHN5bmNzIHRoZSBoYW5kbGVzIHdpdGggdGhlIGRyYWcgcmVmLiAqL1xuICBwcml2YXRlIF9zZXR1cEhhbmRsZXNMaXN0ZW5lcigpIHtcbiAgICAvLyBMaXN0ZW4gZm9yIGFueSBuZXdseS1hZGRlZCBoYW5kbGVzLlxuICAgIHRoaXMuX2hhbmRsZXMuY2hhbmdlc1xuICAgICAgLnBpcGUoXG4gICAgICAgIHN0YXJ0V2l0aCh0aGlzLl9oYW5kbGVzKSxcbiAgICAgICAgLy8gU3luYyB0aGUgbmV3IGhhbmRsZXMgd2l0aCB0aGUgRHJhZ1JlZi5cbiAgICAgICAgdGFwKChoYW5kbGVzOiBRdWVyeUxpc3Q8Q2RrRHJhZ0hhbmRsZT4pID0+IHtcbiAgICAgICAgICBjb25zdCBjaGlsZEhhbmRsZUVsZW1lbnRzID0gaGFuZGxlc1xuICAgICAgICAgICAgLmZpbHRlcihoYW5kbGUgPT4gaGFuZGxlLl9wYXJlbnREcmFnID09PSB0aGlzKVxuICAgICAgICAgICAgLm1hcChoYW5kbGUgPT4gaGFuZGxlLmVsZW1lbnQpO1xuXG4gICAgICAgICAgLy8gVXN1YWxseSBoYW5kbGVzIGFyZSBvbmx5IGFsbG93ZWQgdG8gYmUgYSBkZXNjZW5kYW50IG9mIHRoZSBkcmFnIGVsZW1lbnQsIGJ1dCBpZlxuICAgICAgICAgIC8vIHRoZSBjb25zdW1lciBkZWZpbmVkIGEgZGlmZmVyZW50IGRyYWcgcm9vdCwgd2Ugc2hvdWxkIGFsbG93IHRoZSBkcmFnIGVsZW1lbnRcbiAgICAgICAgICAvLyBpdHNlbGYgdG8gYmUgYSBoYW5kbGUgdG9vLlxuICAgICAgICAgIGlmICh0aGlzLl9zZWxmSGFuZGxlICYmIHRoaXMucm9vdEVsZW1lbnRTZWxlY3Rvcikge1xuICAgICAgICAgICAgY2hpbGRIYW5kbGVFbGVtZW50cy5wdXNoKHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5fZHJhZ1JlZi53aXRoSGFuZGxlcyhjaGlsZEhhbmRsZUVsZW1lbnRzKTtcbiAgICAgICAgfSksXG4gICAgICAgIC8vIExpc3RlbiBpZiB0aGUgc3RhdGUgb2YgYW55IG9mIHRoZSBoYW5kbGVzIGNoYW5nZXMuXG4gICAgICAgIHN3aXRjaE1hcCgoaGFuZGxlczogUXVlcnlMaXN0PENka0RyYWdIYW5kbGU+KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIG1lcmdlKFxuICAgICAgICAgICAgLi4uaGFuZGxlcy5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiBpdGVtLl9zdGF0ZUNoYW5nZXMucGlwZShzdGFydFdpdGgoaXRlbSkpO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgKSBhcyBPYnNlcnZhYmxlPENka0RyYWdIYW5kbGU+O1xuICAgICAgICB9KSxcbiAgICAgICAgdGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCksXG4gICAgICApXG4gICAgICAuc3Vic2NyaWJlKGhhbmRsZUluc3RhbmNlID0+IHtcbiAgICAgICAgLy8gRW5hYmxlZC9kaXNhYmxlIHRoZSBoYW5kbGUgdGhhdCBjaGFuZ2VkIGluIHRoZSBEcmFnUmVmLlxuICAgICAgICBjb25zdCBkcmFnUmVmID0gdGhpcy5fZHJhZ1JlZjtcbiAgICAgICAgY29uc3QgaGFuZGxlID0gaGFuZGxlSW5zdGFuY2UuZWxlbWVudC5uYXRpdmVFbGVtZW50O1xuICAgICAgICBoYW5kbGVJbnN0YW5jZS5kaXNhYmxlZCA/IGRyYWdSZWYuZGlzYWJsZUhhbmRsZShoYW5kbGUpIDogZHJhZ1JlZi5lbmFibGVIYW5kbGUoaGFuZGxlKTtcbiAgICAgIH0pO1xuICB9XG59XG4iXX0=