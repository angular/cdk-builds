/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectionStrategy, Component, Inject, Injectable, NgZone, ViewEncapsulation, inject, signal, } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { normalizePassiveListenerOptions } from '@angular/cdk/platform';
import { _CdkPrivateStyleLoader } from '@angular/cdk/private';
import { Observable, Subject, merge } from 'rxjs';
import * as i0 from "@angular/core";
/** Event options that can be used to bind an active, capturing event. */
const activeCapturingEventOptions = normalizePassiveListenerOptions({
    passive: false,
    capture: true,
});
/**
 * Component used to load the drag&drop reset styles.
 * @docs-private
 */
export class _ResetsLoader {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: _ResetsLoader, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "18.2.0-next.2", type: _ResetsLoader, isStandalone: true, selector: "ng-component", host: { attributes: { "cdk-drag-resets-container": "" } }, ngImport: i0, template: '', isInline: true, styles: ["@layer cdk-resets{.cdk-drag-preview{background:none;border:none;padding:0;color:inherit}}.cdk-drag-placeholder *,.cdk-drag-preview *{pointer-events:none !important}"], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: _ResetsLoader, decorators: [{
            type: Component,
            args: [{ standalone: true, encapsulation: ViewEncapsulation.None, template: '', changeDetection: ChangeDetectionStrategy.OnPush, host: { 'cdk-drag-resets-container': '' }, styles: ["@layer cdk-resets{.cdk-drag-preview{background:none;border:none;padding:0;color:inherit}}.cdk-drag-placeholder *,.cdk-drag-preview *{pointer-events:none !important}"] }]
        }] });
// TODO(crisbeto): remove generics when making breaking changes.
/**
 * Service that keeps track of all the drag item and drop container
 * instances, and manages global event listeners on the `document`.
 * @docs-private
 */
export class DragDropRegistry {
    constructor(_ngZone, _document) {
        this._ngZone = _ngZone;
        this._styleLoader = inject(_CdkPrivateStyleLoader);
        /** Registered drop container instances. */
        this._dropInstances = new Set();
        /** Registered drag item instances. */
        this._dragInstances = new Set();
        /** Drag item instances that are currently being dragged. */
        this._activeDragInstances = signal([]);
        /** Keeps track of the event listeners that we've bound to the `document`. */
        this._globalListeners = new Map();
        /**
         * Predicate function to check if an item is being dragged.  Moved out into a property,
         * because it'll be called a lot and we don't want to create a new function every time.
         */
        this._draggingPredicate = (item) => item.isDragging();
        /**
         * Emits the `touchmove` or `mousemove` events that are dispatched
         * while the user is dragging a drag item instance.
         */
        this.pointerMove = new Subject();
        /**
         * Emits the `touchend` or `mouseup` events that are dispatched
         * while the user is dragging a drag item instance.
         */
        this.pointerUp = new Subject();
        /**
         * Emits when the viewport has been scrolled while the user is dragging an item.
         * @deprecated To be turned into a private member. Use the `scrolled` method instead.
         * @breaking-change 13.0.0
         */
        this.scroll = new Subject();
        /**
         * Event listener that will prevent the default browser action while the user is dragging.
         * @param event Event whose default action should be prevented.
         */
        this._preventDefaultWhileDragging = (event) => {
            if (this._activeDragInstances().length > 0) {
                event.preventDefault();
            }
        };
        /** Event listener for `touchmove` that is bound even if no dragging is happening. */
        this._persistentTouchmoveListener = (event) => {
            if (this._activeDragInstances().length > 0) {
                // Note that we only want to prevent the default action after dragging has actually started.
                // Usually this is the same time at which the item is added to the `_activeDragInstances`,
                // but it could be pushed back if the user has set up a drag delay or threshold.
                if (this._activeDragInstances().some(this._draggingPredicate)) {
                    event.preventDefault();
                }
                this.pointerMove.next(event);
            }
        };
        this._document = _document;
    }
    /** Adds a drop container to the registry. */
    registerDropContainer(drop) {
        if (!this._dropInstances.has(drop)) {
            this._dropInstances.add(drop);
        }
    }
    /** Adds a drag item instance to the registry. */
    registerDragItem(drag) {
        this._dragInstances.add(drag);
        // The `touchmove` event gets bound once, ahead of time, because WebKit
        // won't preventDefault on a dynamically-added `touchmove` listener.
        // See https://bugs.webkit.org/show_bug.cgi?id=184250.
        if (this._dragInstances.size === 1) {
            this._ngZone.runOutsideAngular(() => {
                // The event handler has to be explicitly active,
                // because newer browsers make it passive by default.
                this._document.addEventListener('touchmove', this._persistentTouchmoveListener, activeCapturingEventOptions);
            });
        }
    }
    /** Removes a drop container from the registry. */
    removeDropContainer(drop) {
        this._dropInstances.delete(drop);
    }
    /** Removes a drag item instance from the registry. */
    removeDragItem(drag) {
        this._dragInstances.delete(drag);
        this.stopDragging(drag);
        if (this._dragInstances.size === 0) {
            this._document.removeEventListener('touchmove', this._persistentTouchmoveListener, activeCapturingEventOptions);
        }
    }
    /**
     * Starts the dragging sequence for a drag instance.
     * @param drag Drag instance which is being dragged.
     * @param event Event that initiated the dragging.
     */
    startDragging(drag, event) {
        // Do not process the same drag twice to avoid memory leaks and redundant listeners
        if (this._activeDragInstances().indexOf(drag) > -1) {
            return;
        }
        this._styleLoader.load(_ResetsLoader);
        this._activeDragInstances.update(instances => [...instances, drag]);
        if (this._activeDragInstances().length === 1) {
            const isTouchEvent = event.type.startsWith('touch');
            // We explicitly bind __active__ listeners here, because newer browsers will default to
            // passive ones for `mousemove` and `touchmove`. The events need to be active, because we
            // use `preventDefault` to prevent the page from scrolling while the user is dragging.
            this._globalListeners
                .set(isTouchEvent ? 'touchend' : 'mouseup', {
                handler: (e) => this.pointerUp.next(e),
                options: true,
            })
                .set('scroll', {
                handler: (e) => this.scroll.next(e),
                // Use capturing so that we pick up scroll changes in any scrollable nodes that aren't
                // the document. See https://github.com/angular/components/issues/17144.
                options: true,
            })
                // Preventing the default action on `mousemove` isn't enough to disable text selection
                // on Safari so we need to prevent the selection event as well. Alternatively this can
                // be done by setting `user-select: none` on the `body`, however it has causes a style
                // recalculation which can be expensive on pages with a lot of elements.
                .set('selectstart', {
                handler: this._preventDefaultWhileDragging,
                options: activeCapturingEventOptions,
            });
            // We don't have to bind a move event for touch drag sequences, because
            // we already have a persistent global one bound from `registerDragItem`.
            if (!isTouchEvent) {
                this._globalListeners.set('mousemove', {
                    handler: (e) => this.pointerMove.next(e),
                    options: activeCapturingEventOptions,
                });
            }
            this._ngZone.runOutsideAngular(() => {
                this._globalListeners.forEach((config, name) => {
                    this._document.addEventListener(name, config.handler, config.options);
                });
            });
        }
    }
    /** Stops dragging a drag item instance. */
    stopDragging(drag) {
        this._activeDragInstances.update(instances => {
            const index = instances.indexOf(drag);
            if (index > -1) {
                instances.splice(index, 1);
                return [...instances];
            }
            return instances;
        });
        if (this._activeDragInstances().length === 0) {
            this._clearGlobalListeners();
        }
    }
    /** Gets whether a drag item instance is currently being dragged. */
    isDragging(drag) {
        return this._activeDragInstances().indexOf(drag) > -1;
    }
    /**
     * Gets a stream that will emit when any element on the page is scrolled while an item is being
     * dragged.
     * @param shadowRoot Optional shadow root that the current dragging sequence started from.
     *   Top-level listeners won't pick up events coming from the shadow DOM so this parameter can
     *   be used to include an additional top-level listener at the shadow root level.
     */
    scrolled(shadowRoot) {
        const streams = [this.scroll];
        if (shadowRoot && shadowRoot !== this._document) {
            // Note that this is basically the same as `fromEvent` from rxjs, but we do it ourselves,
            // because we want to guarantee that the event is bound outside of the `NgZone`. With
            // `fromEvent` it'll only happen if the subscription is outside the `NgZone`.
            streams.push(new Observable((observer) => {
                return this._ngZone.runOutsideAngular(() => {
                    const eventOptions = true;
                    const callback = (event) => {
                        if (this._activeDragInstances().length) {
                            observer.next(event);
                        }
                    };
                    shadowRoot.addEventListener('scroll', callback, eventOptions);
                    return () => {
                        shadowRoot.removeEventListener('scroll', callback, eventOptions);
                    };
                });
            }));
        }
        return merge(...streams);
    }
    ngOnDestroy() {
        this._dragInstances.forEach(instance => this.removeDragItem(instance));
        this._dropInstances.forEach(instance => this.removeDropContainer(instance));
        this._clearGlobalListeners();
        this.pointerMove.complete();
        this.pointerUp.complete();
    }
    /** Clears out the global event listeners from the `document`. */
    _clearGlobalListeners() {
        this._globalListeners.forEach((config, name) => {
            this._document.removeEventListener(name, config.handler, config.options);
        });
        this._globalListeners.clear();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: DragDropRegistry, deps: [{ token: i0.NgZone }, { token: DOCUMENT }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: DragDropRegistry, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: DragDropRegistry, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: () => [{ type: i0.NgZone }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1kcm9wLXJlZ2lzdHJ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZHJhZy1kcm9wLXJlZ2lzdHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFDTCx1QkFBdUIsRUFDdkIsU0FBUyxFQUNULE1BQU0sRUFDTixVQUFVLEVBQ1YsTUFBTSxFQUVOLGlCQUFpQixFQUVqQixNQUFNLEVBQ04sTUFBTSxHQUNQLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQUMsK0JBQStCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN0RSxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUM1RCxPQUFPLEVBQUMsVUFBVSxFQUFZLE9BQU8sRUFBRSxLQUFLLEVBQUMsTUFBTSxNQUFNLENBQUM7O0FBSTFELHlFQUF5RTtBQUN6RSxNQUFNLDJCQUEyQixHQUFHLCtCQUErQixDQUFDO0lBQ2xFLE9BQU8sRUFBRSxLQUFLO0lBQ2QsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDLENBQUM7QUFFSDs7O0dBR0c7QUFTSCxNQUFNLE9BQU8sYUFBYTtxSEFBYixhQUFhO3lHQUFiLGFBQWEsbUlBSmQsRUFBRTs7a0dBSUQsYUFBYTtrQkFSekIsU0FBUztpQ0FDSSxJQUFJLGlCQUVELGlCQUFpQixDQUFDLElBQUksWUFDM0IsRUFBRSxtQkFDSyx1QkFBdUIsQ0FBQyxNQUFNLFFBQ3pDLEVBQUMsMkJBQTJCLEVBQUUsRUFBRSxFQUFDOztBQUl6QyxnRUFBZ0U7QUFDaEU7Ozs7R0FJRztBQUVILE1BQU0sT0FBTyxnQkFBZ0I7SUErQzNCLFlBQ1UsT0FBZSxFQUNMLFNBQWM7UUFEeEIsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQTlDakIsaUJBQVksR0FBRyxNQUFN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LEtBQUssRUFBRSxDQUFDO0lBQ2hDLENBQUM7cUhBOVBVLGdCQUFnQix3Q0FpRGpCLFFBQVE7eUhBakRQLGdCQUFnQixjQURKLE1BQU07O2tHQUNsQixnQkFBZ0I7a0JBRDVCLFVBQVU7bUJBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzswQkFrRDNCLE1BQU07MkJBQUMsUUFBUSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgQ29tcG9uZW50LFxuICBJbmplY3QsXG4gIEluamVjdGFibGUsXG4gIE5nWm9uZSxcbiAgT25EZXN0cm95LFxuICBWaWV3RW5jYXBzdWxhdGlvbixcbiAgV3JpdGFibGVTaWduYWwsXG4gIGluamVjdCxcbiAgc2lnbmFsLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge25vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnN9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge19DZGtQcml2YXRlU3R5bGVMb2FkZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wcml2YXRlJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgT2JzZXJ2ZXIsIFN1YmplY3QsIG1lcmdlfSBmcm9tICdyeGpzJztcbmltcG9ydCB0eXBlIHtEcm9wTGlzdFJlZn0gZnJvbSAnLi9kcm9wLWxpc3QtcmVmJztcbmltcG9ydCB0eXBlIHtEcmFnUmVmfSBmcm9tICcuL2RyYWctcmVmJztcblxuLyoqIEV2ZW50IG9wdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCB0byBiaW5kIGFuIGFjdGl2ZSwgY2FwdHVyaW5nIGV2ZW50LiAqL1xuY29uc3QgYWN0aXZlQ2FwdHVyaW5nRXZlbnRPcHRpb25zID0gbm9ybWFsaXplUGFzc2l2ZUxpc3RlbmVyT3B0aW9ucyh7XG4gIHBhc3NpdmU6IGZhbHNlLFxuICBjYXB0dXJlOiB0cnVlLFxufSk7XG5cbi8qKlxuICogQ29tcG9uZW50IHVzZWQgdG8gbG9hZCB0aGUgZHJhZyZkcm9wIHJlc2V0IHN0eWxlcy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuQENvbXBvbmVudCh7XG4gIHN0YW5kYWxvbmU6IHRydWUsXG4gIHN0eWxlVXJsOiAncmVzZXRzLmNzcycsXG4gIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsXG4gIHRlbXBsYXRlOiAnJyxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG4gIGhvc3Q6IHsnY2RrLWRyYWctcmVzZXRzLWNvbnRhaW5lcic6ICcnfSxcbn0pXG5leHBvcnQgY2xhc3MgX1Jlc2V0c0xvYWRlciB7fVxuXG4vLyBUT0RPKGNyaXNiZXRvKTogcmVtb3ZlIGdlbmVyaWNzIHdoZW4gbWFraW5nIGJyZWFraW5nIGNoYW5nZXMuXG4vKipcbiAqIFNlcnZpY2UgdGhhdCBrZWVwcyB0cmFjayBvZiBhbGwgdGhlIGRyYWcgaXRlbSBhbmQgZHJvcCBjb250YWluZXJcbiAqIGluc3RhbmNlcywgYW5kIG1hbmFnZXMgZ2xvYmFsIGV2ZW50IGxpc3RlbmVycyBvbiB0aGUgYGRvY3VtZW50YC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgRHJhZ0Ryb3BSZWdpc3RyeTxfID0gdW5rbm93biwgX18gPSB1bmtub3duPiBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIHByaXZhdGUgX2RvY3VtZW50OiBEb2N1bWVudDtcbiAgcHJpdmF0ZSBfc3R5bGVMb2FkZXIgPSBpbmplY3QoX0Nka1ByaXZhdGVTdHlsZUxvYWRlcik7XG5cbiAgLyoqIFJlZ2lzdGVyZWQgZHJvcCBjb250YWluZXIgaW5zdGFuY2VzLiAqL1xuICBwcml2YXRlIF9kcm9wSW5zdGFuY2VzID0gbmV3IFNldDxEcm9wTGlzdFJlZj4oKTtcblxuICAvKiogUmVnaXN0ZXJlZCBkcmFnIGl0ZW0gaW5zdGFuY2VzLiAqL1xuICBwcml2YXRlIF9kcmFnSW5zdGFuY2VzID0gbmV3IFNldDxEcmFnUmVmPigpO1xuXG4gIC8qKiBEcmFnIGl0ZW0gaW5zdGFuY2VzIHRoYXQgYXJlIGN1cnJlbnRseSBiZWluZyBkcmFnZ2VkLiAqL1xuICBwcml2YXRlIF9hY3RpdmVEcmFnSW5zdGFuY2VzOiBXcml0YWJsZVNpZ25hbDxEcmFnUmVmW10+ID0gc2lnbmFsKFtdKTtcblxuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIGV2ZW50IGxpc3RlbmVycyB0aGF0IHdlJ3ZlIGJvdW5kIHRvIHRoZSBgZG9jdW1lbnRgLiAqL1xuICBwcml2YXRlIF9nbG9iYWxMaXN0ZW5lcnMgPSBuZXcgTWFwPFxuICAgIHN0cmluZyxcbiAgICB7XG4gICAgICBoYW5kbGVyOiAoZXZlbnQ6IEV2ZW50KSA9PiB2b2lkO1xuICAgICAgb3B0aW9ucz86IEFkZEV2ZW50TGlzdGVuZXJPcHRpb25zIHwgYm9vbGVhbjtcbiAgICB9XG4gID4oKTtcblxuICAvKipcbiAgICogUHJlZGljYXRlIGZ1bmN0aW9uIHRvIGNoZWNrIGlmIGFuIGl0ZW0gaXMgYmVpbmcgZHJhZ2dlZC4gIE1vdmVkIG91dCBpbnRvIGEgcHJvcGVydHksXG4gICAqIGJlY2F1c2UgaXQnbGwgYmUgY2FsbGVkIGEgbG90IGFuZCB3ZSBkb24ndCB3YW50IHRvIGNyZWF0ZSBhIG5ldyBmdW5jdGlvbiBldmVyeSB0aW1lLlxuICAgKi9cbiAgcHJpdmF0ZSBfZHJhZ2dpbmdQcmVkaWNhdGUgPSAoaXRlbTogRHJhZ1JlZikgPT4gaXRlbS5pc0RyYWdnaW5nKCk7XG5cbiAgLyoqXG4gICAqIEVtaXRzIHRoZSBgdG91Y2htb3ZlYCBvciBgbW91c2Vtb3ZlYCBldmVudHMgdGhhdCBhcmUgZGlzcGF0Y2hlZFxuICAgKiB3aGlsZSB0aGUgdXNlciBpcyBkcmFnZ2luZyBhIGRyYWcgaXRlbSBpbnN0YW5jZS5cbiAgICovXG4gIHJlYWRvbmx5IHBvaW50ZXJNb3ZlOiBTdWJqZWN0PFRvdWNoRXZlbnQgfCBNb3VzZUV2ZW50PiA9IG5ldyBTdWJqZWN0PFRvdWNoRXZlbnQgfCBNb3VzZUV2ZW50PigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB0aGUgYHRvdWNoZW5kYCBvciBgbW91c2V1cGAgZXZlbnRzIHRoYXQgYXJlIGRpc3BhdGNoZWRcbiAgICogd2hpbGUgdGhlIHVzZXIgaXMgZHJhZ2dpbmcgYSBkcmFnIGl0ZW0gaW5zdGFuY2UuXG4gICAqL1xuICByZWFkb25seSBwb2ludGVyVXA6IFN1YmplY3Q8VG91Y2hFdmVudCB8IE1vdXNlRXZlbnQ+ID0gbmV3IFN1YmplY3Q8VG91Y2hFdmVudCB8IE1vdXNlRXZlbnQ+KCk7XG5cbiAgLyoqXG4gICAqIEVtaXRzIHdoZW4gdGhlIHZpZXdwb3J0IGhhcyBiZWVuIHNjcm9sbGVkIHdoaWxlIHRoZSB1c2VyIGlzIGRyYWdnaW5nIGFuIGl0ZW0uXG4gICAqIEBkZXByZWNhdGVkIFRvIGJlIHR1cm5lZCBpbnRvIGEgcHJpdmF0ZSBtZW1iZXIuIFVzZSB0aGUgYHNjcm9sbGVkYCBtZXRob2QgaW5zdGVhZC5cbiAgICogQGJyZWFraW5nLWNoYW5nZSAxMy4wLjBcbiAgICovXG4gIHJlYWRvbmx5IHNjcm9sbDogU3ViamVjdDxFdmVudD4gPSBuZXcgU3ViamVjdDxFdmVudD4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICBASW5qZWN0KERPQ1VNRU5UKSBfZG9jdW1lbnQ6IGFueSxcbiAgKSB7XG4gICAgdGhpcy5fZG9jdW1lbnQgPSBfZG9jdW1lbnQ7XG4gIH1cblxuICAvKiogQWRkcyBhIGRyb3AgY29udGFpbmVyIHRvIHRoZSByZWdpc3RyeS4gKi9cbiAgcmVnaXN0ZXJEcm9wQ29udGFpbmVyKGRyb3A6IERyb3BMaXN0UmVmKSB7XG4gICAgaWYgKCF0aGlzLl9kcm9wSW5zdGFuY2VzLmhhcyhkcm9wKSkge1xuICAgICAgdGhpcy5fZHJvcEluc3RhbmNlcy5hZGQoZHJvcCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEFkZHMgYSBkcmFnIGl0ZW0gaW5zdGFuY2UgdG8gdGhlIHJlZ2lzdHJ5LiAqL1xuICByZWdpc3RlckRyYWdJdGVtKGRyYWc6IERyYWdSZWYpIHtcbiAgICB0aGlzLl9kcmFnSW5zdGFuY2VzLmFkZChkcmFnKTtcblxuICAgIC8vIFRoZSBgdG91Y2htb3ZlYCBldmVudCBnZXRzIGJvdW5kIG9uY2UsIGFoZWFkIG9mIHRpbWUsIGJlY2F1c2UgV2ViS2l0XG4gICAgLy8gd29uJ3QgcHJldmVudERlZmF1bHQgb24gYSBkeW5hbWljYWxseS1hZGRlZCBgdG91Y2htb3ZlYCBsaXN0ZW5lci5cbiAgICAvLyBTZWUgaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTE4NDI1MC5cbiAgICBpZiAodGhpcy5fZHJhZ0luc3RhbmNlcy5zaXplID09PSAxKSB7XG4gICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICAvLyBUaGUgZXZlbnQgaGFuZGxlciBoYXMgdG8gYmUgZXhwbGljaXRseSBhY3RpdmUsXG4gICAgICAgIC8vIGJlY2F1c2UgbmV3ZXIgYnJvd3NlcnMgbWFrZSBpdCBwYXNzaXZlIGJ5IGRlZmF1bHQuXG4gICAgICAgIHRoaXMuX2RvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgJ3RvdWNobW92ZScsXG4gICAgICAgICAgdGhpcy5fcGVyc2lzdGVudFRvdWNobW92ZUxpc3RlbmVyLFxuICAgICAgICAgIGFjdGl2ZUNhcHR1cmluZ0V2ZW50T3B0aW9ucyxcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSZW1vdmVzIGEgZHJvcCBjb250YWluZXIgZnJvbSB0aGUgcmVnaXN0cnkuICovXG4gIHJlbW92ZURyb3BDb250YWluZXIoZHJvcDogRHJvcExpc3RSZWYpIHtcbiAgICB0aGlzLl9kcm9wSW5zdGFuY2VzLmRlbGV0ZShkcm9wKTtcbiAgfVxuXG4gIC8qKiBSZW1vdmVzIGEgZHJhZyBpdGVtIGluc3RhbmNlIGZyb20gdGhlIHJlZ2lzdHJ5LiAqL1xuICByZW1vdmVEcmFnSXRlbShkcmFnOiBEcmFnUmVmKSB7XG4gICAgdGhpcy5fZHJhZ0luc3RhbmNlcy5kZWxldGUoZHJhZyk7XG4gICAgdGhpcy5zdG9wRHJhZ2dpbmcoZHJhZyk7XG5cbiAgICBpZiAodGhpcy5fZHJhZ0luc3RhbmNlcy5zaXplID09PSAwKSB7XG4gICAgICB0aGlzLl9kb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFxuICAgICAgICAndG91Y2htb3ZlJyxcbiAgICAgICAgdGhpcy5fcGVyc2lzdGVudFRvdWNobW92ZUxpc3RlbmVyLFxuICAgICAgICBhY3RpdmVDYXB0dXJpbmdFdmVudE9wdGlvbnMsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydHMgdGhlIGRyYWdnaW5nIHNlcXVlbmNlIGZvciBhIGRyYWcgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSBkcmFnIERyYWcgaW5zdGFuY2Ugd2hpY2ggaXMgYmVpbmcgZHJhZ2dlZC5cbiAgICogQHBhcmFtIGV2ZW50IEV2ZW50IHRoYXQgaW5pdGlhdGVkIHRoZSBkcmFnZ2luZy5cbiAgICovXG4gIHN0YXJ0RHJhZ2dpbmcoZHJhZzogRHJhZ1JlZiwgZXZlbnQ6IFRvdWNoRXZlbnQgfCBNb3VzZUV2ZW50KSB7XG4gICAgLy8gRG8gbm90IHByb2Nlc3MgdGhlIHNhbWUgZHJhZyB0d2ljZSB0byBhdm9pZCBtZW1vcnkgbGVha3MgYW5kIHJlZHVuZGFudCBsaXN0ZW5lcnNcbiAgICBpZiAodGhpcy5fYWN0aXZlRHJhZ0luc3RhbmNlcygpLmluZGV4T2YoZHJhZykgPiAtMSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3N0eWxlTG9hZGVyLmxvYWQoX1Jlc2V0c0xvYWRlcik7XG4gICAgdGhpcy5fYWN0aXZlRHJhZ0luc3RhbmNlcy51cGRhdGUoaW5zdGFuY2VzID0+IFsuLi5pbnN0YW5jZXMsIGRyYWddKTtcblxuICAgIGlmICh0aGlzLl9hY3RpdmVEcmFnSW5zdGFuY2VzKCkubGVuZ3RoID09PSAxKSB7XG4gICAgICBjb25zdCBpc1RvdWNoRXZlbnQgPSBldmVudC50eXBlLnN0YXJ0c1dpdGgoJ3RvdWNoJyk7XG5cbiAgICAgIC8vIFdlIGV4cGxpY2l0bHkgYmluZCBfX2FjdGl2ZV9fIGxpc3RlbmVycyBoZXJlLCBiZWNhdXNlIG5ld2VyIGJyb3dzZXJzIHdpbGwgZGVmYXVsdCB0b1xuICAgICAgLy8gcGFzc2l2ZSBvbmVzIGZvciBgbW91c2Vtb3ZlYCBhbmQgYHRvdWNobW92ZWAuIFRoZSBldmVudHMgbmVlZCB0byBiZSBhY3RpdmUsIGJlY2F1c2Ugd2VcbiAgICAgIC8vIHVzZSBgcHJldmVudERlZmF1bHRgIHRvIHByZXZlbnQgdGhlIHBhZ2UgZnJvbSBzY3JvbGxpbmcgd2hpbGUgdGhlIHVzZXIgaXMgZHJhZ2dpbmcuXG4gICAgICB0aGlzLl9nbG9iYWxMaXN0ZW5lcnNcbiAgICAgICAgLnNldChpc1RvdWNoRXZlbnQgPyAndG91Y2hlbmQnIDogJ21vdXNldXAnLCB7XG4gICAgICAgICAgaGFuZGxlcjogKGU6IEV2ZW50KSA9PiB0aGlzLnBvaW50ZXJVcC5uZXh0KGUgYXMgVG91Y2hFdmVudCB8IE1vdXNlRXZlbnQpLFxuICAgICAgICAgIG9wdGlvbnM6IHRydWUsXG4gICAgICAgIH0pXG4gICAgICAgIC5zZXQoJ3Njcm9sbCcsIHtcbiAgICAgICAgICBoYW5kbGVyOiAoZTogRXZlbnQpID0+IHRoaXMuc2Nyb2xsLm5leHQoZSksXG4gICAgICAgICAgLy8gVXNlIGNhcHR1cmluZyBzbyB0aGF0IHdlIHBpY2sgdXAgc2Nyb2xsIGNoYW5nZXMgaW4gYW55IHNjcm9sbGFibGUgbm9kZXMgdGhhdCBhcmVuJ3RcbiAgICAgICAgICAvLyB0aGUgZG9jdW1lbnQuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9jb21wb25lbnRzL2lzc3Vlcy8xNzE0NC5cbiAgICAgICAgICBvcHRpb25zOiB0cnVlLFxuICAgICAgICB9KVxuICAgICAgICAvLyBQcmV2ZW50aW5nIHRoZSBkZWZhdWx0IGFjdGlvbiBvbiBgbW91c2Vtb3ZlYCBpc24ndCBlbm91Z2ggdG8gZGlzYWJsZSB0ZXh0IHNlbGVjdGlvblxuICAgICAgICAvLyBvbiBTYWZhcmkgc28gd2UgbmVlZCB0byBwcmV2ZW50IHRoZSBzZWxlY3Rpb24gZXZlbnQgYXMgd2VsbC4gQWx0ZXJuYXRpdmVseSB0aGlzIGNhblxuICAgICAgICAvLyBiZSBkb25lIGJ5IHNldHRpbmcgYHVzZXItc2VsZWN0OiBub25lYCBvbiB0aGUgYGJvZHlgLCBob3dldmVyIGl0IGhhcyBjYXVzZXMgYSBzdHlsZVxuICAgICAgICAvLyByZWNhbGN1bGF0aW9uIHdoaWNoIGNhbiBiZSBleHBlbnNpdmUgb24gcGFnZXMgd2l0aCBhIGxvdCBvZiBlbGVtZW50cy5cbiAgICAgICAgLnNldCgnc2VsZWN0c3RhcnQnLCB7XG4gICAgICAgICAgaGFuZGxlcjogdGhpcy5fcHJldmVudERlZmF1bHRXaGlsZURyYWdnaW5nLFxuICAgICAgICAgIG9wdGlvbnM6IGFjdGl2ZUNhcHR1cmluZ0V2ZW50T3B0aW9ucyxcbiAgICAgICAgfSk7XG5cbiAgICAgIC8vIFdlIGRvbid0IGhhdmUgdG8gYmluZCBhIG1vdmUgZXZlbnQgZm9yIHRvdWNoIGRyYWcgc2VxdWVuY2VzLCBiZWNhdXNlXG4gICAgICAvLyB3ZSBhbHJlYWR5IGhhdmUgYSBwZXJzaXN0ZW50IGdsb2JhbCBvbmUgYm91bmQgZnJvbSBgcmVnaXN0ZXJEcmFnSXRlbWAuXG4gICAgICBpZiAoIWlzVG91Y2hFdmVudCkge1xuICAgICAgICB0aGlzLl9nbG9iYWxMaXN0ZW5lcnMuc2V0KCdtb3VzZW1vdmUnLCB7XG4gICAgICAgICAgaGFuZGxlcjogKGU6IEV2ZW50KSA9PiB0aGlzLnBvaW50ZXJNb3ZlLm5leHQoZSBhcyBNb3VzZUV2ZW50KSxcbiAgICAgICAgICBvcHRpb25zOiBhY3RpdmVDYXB0dXJpbmdFdmVudE9wdGlvbnMsXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICB0aGlzLl9nbG9iYWxMaXN0ZW5lcnMuZm9yRWFjaCgoY29uZmlnLCBuYW1lKSA9PiB7XG4gICAgICAgICAgdGhpcy5fZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBjb25maWcuaGFuZGxlciwgY29uZmlnLm9wdGlvbnMpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTdG9wcyBkcmFnZ2luZyBhIGRyYWcgaXRlbSBpbnN0YW5jZS4gKi9cbiAgc3RvcERyYWdnaW5nKGRyYWc6IERyYWdSZWYpIHtcbiAgICB0aGlzLl9hY3RpdmVEcmFnSW5zdGFuY2VzLnVwZGF0ZShpbnN0YW5jZXMgPT4ge1xuICAgICAgY29uc3QgaW5kZXggPSBpbnN0YW5jZXMuaW5kZXhPZihkcmFnKTtcbiAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgIGluc3RhbmNlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICByZXR1cm4gWy4uLmluc3RhbmNlc107XG4gICAgICB9XG4gICAgICByZXR1cm4gaW5zdGFuY2VzO1xuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMuX2FjdGl2ZURyYWdJbnN0YW5jZXMoKS5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMuX2NsZWFyR2xvYmFsTGlzdGVuZXJzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEdldHMgd2hldGhlciBhIGRyYWcgaXRlbSBpbnN0YW5jZSBpcyBjdXJyZW50bHkgYmVpbmcgZHJhZ2dlZC4gKi9cbiAgaXNEcmFnZ2luZyhkcmFnOiBEcmFnUmVmKSB7XG4gICAgcmV0dXJuIHRoaXMuX2FjdGl2ZURyYWdJbnN0YW5jZXMoKS5pbmRleE9mKGRyYWcpID4gLTE7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIHN0cmVhbSB0aGF0IHdpbGwgZW1pdCB3aGVuIGFueSBlbGVtZW50IG9uIHRoZSBwYWdlIGlzIHNjcm9sbGVkIHdoaWxlIGFuIGl0ZW0gaXMgYmVpbmdcbiAgICogZHJhZ2dlZC5cbiAgICogQHBhcmFtIHNoYWRvd1Jvb3QgT3B0aW9uYWwgc2hhZG93IHJvb3QgdGhhdCB0aGUgY3VycmVudCBkcmFnZ2luZyBzZXF1ZW5jZSBzdGFydGVkIGZyb20uXG4gICAqICAgVG9wLWxldmVsIGxpc3RlbmVycyB3b24ndCBwaWNrIHVwIGV2ZW50cyBjb21pbmcgZnJvbSB0aGUgc2hhZG93IERPTSBzbyB0aGlzIHBhcmFtZXRlciBjYW5cbiAgICogICBiZSB1c2VkIHRvIGluY2x1ZGUgYW4gYWRkaXRpb25hbCB0b3AtbGV2ZWwgbGlzdGVuZXIgYXQgdGhlIHNoYWRvdyByb290IGxldmVsLlxuICAgKi9cbiAgc2Nyb2xsZWQoc2hhZG93Um9vdD86IERvY3VtZW50T3JTaGFkb3dSb290IHwgbnVsbCk6IE9ic2VydmFibGU8RXZlbnQ+IHtcbiAgICBjb25zdCBzdHJlYW1zOiBPYnNlcnZhYmxlPEV2ZW50PltdID0gW3RoaXMuc2Nyb2xsXTtcblxuICAgIGlmIChzaGFkb3dSb290ICYmIHNoYWRvd1Jvb3QgIT09IHRoaXMuX2RvY3VtZW50KSB7XG4gICAgICAvLyBOb3RlIHRoYXQgdGhpcyBpcyBiYXNpY2FsbHkgdGhlIHNhbWUgYXMgYGZyb21FdmVudGAgZnJvbSByeGpzLCBidXQgd2UgZG8gaXQgb3Vyc2VsdmVzLFxuICAgICAgLy8gYmVjYXVzZSB3ZSB3YW50IHRvIGd1YXJhbnRlZSB0aGF0IHRoZSBldmVudCBpcyBib3VuZCBvdXRzaWRlIG9mIHRoZSBgTmdab25lYC4gV2l0aFxuICAgICAgLy8gYGZyb21FdmVudGAgaXQnbGwgb25seSBoYXBwZW4gaWYgdGhlIHN1YnNjcmlwdGlvbiBpcyBvdXRzaWRlIHRoZSBgTmdab25lYC5cbiAgICAgIHN0cmVhbXMucHVzaChcbiAgICAgICAgbmV3IE9ic2VydmFibGUoKG9ic2VydmVyOiBPYnNlcnZlcjxFdmVudD4pID0+IHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50T3B0aW9ucyA9IHRydWU7XG4gICAgICAgICAgICBjb25zdCBjYWxsYmFjayA9IChldmVudDogRXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMuX2FjdGl2ZURyYWdJbnN0YW5jZXMoKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBvYnNlcnZlci5uZXh0KGV2ZW50KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgKHNoYWRvd1Jvb3QgYXMgU2hhZG93Um9vdCkuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgY2FsbGJhY2ssIGV2ZW50T3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICAgIChzaGFkb3dSb290IGFzIFNoYWRvd1Jvb3QpLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIGNhbGxiYWNrLCBldmVudE9wdGlvbnMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBtZXJnZSguLi5zdHJlYW1zKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2RyYWdJbnN0YW5jZXMuZm9yRWFjaChpbnN0YW5jZSA9PiB0aGlzLnJlbW92ZURyYWdJdGVtKGluc3RhbmNlKSk7XG4gICAgdGhpcy5fZHJvcEluc3RhbmNlcy5mb3JFYWNoKGluc3RhbmNlID0+IHRoaXMucmVtb3ZlRHJvcENvbnRhaW5lcihpbnN0YW5jZSkpO1xuICAgIHRoaXMuX2NsZWFyR2xvYmFsTGlzdGVuZXJzKCk7XG4gICAgdGhpcy5wb2ludGVyTW92ZS5jb21wbGV0ZSgpO1xuICAgIHRoaXMucG9pbnRlclVwLmNvbXBsZXRlKCk7XG4gIH1cblxuICAvKipcbiAgICogRXZlbnQgbGlzdGVuZXIgdGhhdCB3aWxsIHByZXZlbnQgdGhlIGRlZmF1bHQgYnJvd3NlciBhY3Rpb24gd2hpbGUgdGhlIHVzZXIgaXMgZHJhZ2dpbmcuXG4gICAqIEBwYXJhbSBldmVudCBFdmVudCB3aG9zZSBkZWZhdWx0IGFjdGlvbiBzaG91bGQgYmUgcHJldmVudGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfcHJldmVudERlZmF1bHRXaGlsZURyYWdnaW5nID0gKGV2ZW50OiBFdmVudCkgPT4ge1xuICAgIGlmICh0aGlzLl9hY3RpdmVEcmFnSW5zdGFuY2VzKCkubGVuZ3RoID4gMCkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqIEV2ZW50IGxpc3RlbmVyIGZvciBgdG91Y2htb3ZlYCB0aGF0IGlzIGJvdW5kIGV2ZW4gaWYgbm8gZHJhZ2dpbmcgaXMgaGFwcGVuaW5nLiAqL1xuICBwcml2YXRlIF9wZXJzaXN0ZW50VG91Y2htb3ZlTGlzdGVuZXIgPSAoZXZlbnQ6IFRvdWNoRXZlbnQpID0+IHtcbiAgICBpZiAodGhpcy5fYWN0aXZlRHJhZ0luc3RhbmNlcygpLmxlbmd0aCA+IDApIHtcbiAgICAgIC8vIE5vdGUgdGhhdCB3ZSBvbmx5IHdhbnQgdG8gcHJldmVudCB0aGUgZGVmYXVsdCBhY3Rpb24gYWZ0ZXIgZHJhZ2dpbmcgaGFzIGFjdHVhbGx5IHN0YXJ0ZWQuXG4gICAgICAvLyBVc3VhbGx5IHRoaXMgaXMgdGhlIHNhbWUgdGltZSBhdCB3aGljaCB0aGUgaXRlbSBpcyBhZGRlZCB0byB0aGUgYF9hY3RpdmVEcmFnSW5zdGFuY2VzYCxcbiAgICAgIC8vIGJ1dCBpdCBjb3VsZCBiZSBwdXNoZWQgYmFjayBpZiB0aGUgdXNlciBoYXMgc2V0IHVwIGEgZHJhZyBkZWxheSBvciB0aHJlc2hvbGQuXG4gICAgICBpZiAodGhpcy5fYWN0aXZlRHJhZ0luc3RhbmNlcygpLnNvbWUodGhpcy5fZHJhZ2dpbmdQcmVkaWNhdGUpKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMucG9pbnRlck1vdmUubmV4dChldmVudCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKiBDbGVhcnMgb3V0IHRoZSBnbG9iYWwgZXZlbnQgbGlzdGVuZXJzIGZyb20gdGhlIGBkb2N1bWVudGAuICovXG4gIHByaXZhdGUgX2NsZWFyR2xvYmFsTGlzdGVuZXJzKCkge1xuICAgIHRoaXMuX2dsb2JhbExpc3RlbmVycy5mb3JFYWNoKChjb25maWcsIG5hbWUpID0+IHtcbiAgICAgIHRoaXMuX2RvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIobmFtZSwgY29uZmlnLmhhbmRsZXIsIGNvbmZpZy5vcHRpb25zKTtcbiAgICB9KTtcblxuICAgIHRoaXMuX2dsb2JhbExpc3RlbmVycy5jbGVhcigpO1xuICB9XG59XG4iXX0=