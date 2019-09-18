/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable, NgZone, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { normalizePassiveListenerOptions } from '@angular/cdk/platform';
import { Subject } from 'rxjs';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
/**
 * Event options that can be used to bind an active, capturing event.
 * @type {?}
 */
const activeCapturingEventOptions = normalizePassiveListenerOptions({
    passive: false,
    capture: true
});
/**
 * Service that keeps track of all the drag item and drop container
 * instances, and manages global event listeners on the `document`.
 * \@docs-private
 * @template I, C
 */
// Note: this class is generic, rather than referencing CdkDrag and CdkDropList directly, in order
// to avoid circular imports. If we were to reference them here, importing the registry into the
// classes that are registering themselves will introduce a circular import.
export class DragDropRegistry {
    /**
     * @param {?} _ngZone
     * @param {?} _document
     */
    constructor(_ngZone, _document) {
        this._ngZone = _ngZone;
        /**
         * Registered drop container instances.
         */
        this._dropInstances = new Set();
        /**
         * Registered drag item instances.
         */
        this._dragInstances = new Set();
        /**
         * Drag item instances that are currently being dragged.
         */
        this._activeDragInstances = new Set();
        /**
         * Keeps track of the event listeners that we've bound to the `document`.
         */
        this._globalListeners = new Map();
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
         */
        this.scroll = new Subject();
        /**
         * Event listener that will prevent the default browser action while the user is dragging.
         * @param event Event whose default action should be prevented.
         */
        this._preventDefaultWhileDragging = (/**
         * @param {?} event
         * @return {?}
         */
        (event) => {
            if (this._activeDragInstances.size) {
                event.preventDefault();
            }
        });
        this._document = _document;
    }
    /**
     * Adds a drop container to the registry.
     * @param {?} drop
     * @return {?}
     */
    registerDropContainer(drop) {
        if (!this._dropInstances.has(drop)) {
            this._dropInstances.add(drop);
        }
    }
    /**
     * Adds a drag item instance to the registry.
     * @param {?} drag
     * @return {?}
     */
    registerDragItem(drag) {
        this._dragInstances.add(drag);
        // The `touchmove` event gets bound once, ahead of time, because WebKit
        // won't preventDefault on a dynamically-added `touchmove` listener.
        // See https://bugs.webkit.org/show_bug.cgi?id=18.2.0-d854e6fb2.
        if (this._dragInstances.size === 1) {
            this._ngZone.runOutsideAngular((/**
             * @return {?}
             */
            () => {
                // The event handler has to be explicitly active,
                // because newer browsers make it passive by default.
                this._document.addEventListener('touchmove', this._preventDefaultWhileDragging, activeCapturingEventOptions);
            }));
        }
    }
    /**
     * Removes a drop container from the registry.
     * @param {?} drop
     * @return {?}
     */
    removeDropContainer(drop) {
        this._dropInstances.delete(drop);
    }
    /**
     * Removes a drag item instance from the registry.
     * @param {?} drag
     * @return {?}
     */
    removeDragItem(drag) {
        this._dragInstances.delete(drag);
        this.stopDragging(drag);
        if (this._dragInstances.size === 0) {
            this._document.removeEventListener('touchmove', this._preventDefaultWhileDragging, activeCapturingEventOptions);
        }
    }
    /**
     * Starts the dragging sequence for a drag instance.
     * @param {?} drag Drag instance which is being dragged.
     * @param {?} event Event that initiated the dragging.
     * @return {?}
     */
    startDragging(drag, event) {
        // Do not process the same drag twice to avoid memory leaks and redundant listeners
        if (this._activeDragInstances.has(drag)) {
            return;
        }
        this._activeDragInstances.add(drag);
        if (this._activeDragInstances.size === 1) {
            /** @type {?} */
            const isTouchEvent = event.type.startsWith('touch');
            /** @type {?} */
            const moveEvent = isTouchEvent ? 'touchmove' : 'mousemove';
            /** @type {?} */
            const upEvent = isTouchEvent ? 'touchend' : 'mouseup';
            // We explicitly bind __active__ listeners here, because newer browsers will default to
            // passive ones for `mousemove` and `touchmove`. The events need to be active, because we
            // use `preventDefault` to prevent the page from scrolling while the user is dragging.
            this._globalListeners
                .set(moveEvent, {
                handler: (/**
                 * @param {?} e
                 * @return {?}
                 */
                (e) => this.pointerMove.next((/** @type {?} */ (e)))),
                options: activeCapturingEventOptions
            })
                .set(upEvent, {
                handler: (/**
                 * @param {?} e
                 * @return {?}
                 */
                (e) => this.pointerUp.next((/** @type {?} */ (e)))),
                options: true
            })
                .set('scroll', {
                handler: (/**
                 * @param {?} e
                 * @return {?}
                 */
                (e) => this.scroll.next(e))
            })
                // Preventing the default action on `mousemove` isn't enough to disable text selection
                // on Safari so we need to prevent the selection event as well. Alternatively this can
                // be done by setting `user-select: none` on the `body`, however it has causes a style
                // recalculation which can be expensive on pages with a lot of elements.
                .set('selectstart', {
                handler: this._preventDefaultWhileDragging,
                options: activeCapturingEventOptions
            });
            this._ngZone.runOutsideAngular((/**
             * @return {?}
             */
            () => {
                this._globalListeners.forEach((/**
                 * @param {?} config
                 * @param {?} name
                 * @return {?}
                 */
                (config, name) => {
                    this._document.addEventListener(name, config.handler, config.options);
                }));
            }));
        }
    }
    /**
     * Stops dragging a drag item instance.
     * @param {?} drag
     * @return {?}
     */
    stopDragging(drag) {
        this._activeDragInstances.delete(drag);
        if (this._activeDragInstances.size === 0) {
            this._clearGlobalListeners();
        }
    }
    /**
     * Gets whether a drag item instance is currently being dragged.
     * @param {?} drag
     * @return {?}
     */
    isDragging(drag) {
        return this._activeDragInstances.has(drag);
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        this._dragInstances.forEach((/**
         * @param {?} instance
         * @return {?}
         */
        instance => this.removeDragItem(instance)));
        this._dropInstances.forEach((/**
         * @param {?} instance
         * @return {?}
         */
        instance => this.removeDropContainer(instance)));
        this._clearGlobalListeners();
        this.pointerMove.complete();
        this.pointerUp.complete();
    }
    /**
     * Clears out the global event listeners from the `document`.
     * @private
     * @return {?}
     */
    _clearGlobalListeners() {
        this._globalListeners.forEach((/**
         * @param {?} config
         * @param {?} name
         * @return {?}
         */
        (config, name) => {
            this._document.removeEventListener(name, config.handler, config.options);
        }));
        this._globalListeners.clear();
    }
}
DragDropRegistry.decorators = [
    { type: Injectable, args: [{ providedIn: 'root' },] }
];
/** @nocollapse */
DragDropRegistry.ctorParameters = () => [
    { type: NgZone },
    { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] }
];
/** @nocollapse */ DragDropRegistry.ngInjectableDef = i0.ɵɵdefineInjectable({ factory: function DragDropRegistry_Factory() { return new DragDropRegistry(i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i1.DOCUMENT)); }, token: DragDropRegistry, providedIn: "root" });
if (false) {
    /**
     * @type {?}
     * @private
     */
    DragDropRegistry.prototype._document;
    /**
     * Registered drop container instances.
     * @type {?}
     * @private
     */
    DragDropRegistry.prototype._dropInstances;
    /**
     * Registered drag item instances.
     * @type {?}
     * @private
     */
    DragDropRegistry.prototype._dragInstances;
    /**
     * Drag item instances that are currently being dragged.
     * @type {?}
     * @private
     */
    DragDropRegistry.prototype._activeDragInstances;
    /**
     * Keeps track of the event listeners that we've bound to the `document`.
     * @type {?}
     * @private
     */
    DragDropRegistry.prototype._globalListeners;
    /**
     * Emits the `touchmove` or `mousemove` events that are dispatched
     * while the user is dragging a drag item instance.
     * @type {?}
     */
    DragDropRegistry.prototype.pointerMove;
    /**
     * Emits the `touchend` or `mouseup` events that are dispatched
     * while the user is dragging a drag item instance.
     * @type {?}
     */
    DragDropRegistry.prototype.pointerUp;
    /**
     * Emits when the viewport has been scrolled while the user is dragging an item.
     * @type {?}
     */
    DragDropRegistry.prototype.scroll;
    /**
     * Event listener that will prevent the default browser action while the user is dragging.
     * \@param event Event whose default action should be prevented.
     * @type {?}
     * @private
     */
    DragDropRegistry.prototype._preventDefaultWhileDragging;
    /**
     * @type {?}
     * @private
     */
    DragDropRegistry.prototype._ngZone;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1kcm9wLXJlZ2lzdHJ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZHJhZy1kcm9wLXJlZ2lzdHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQWEsTUFBTSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3BFLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQUMsK0JBQStCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN0RSxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDOzs7Ozs7O01BR3ZCLDJCQUEyQixHQUFHLCtCQUErQixDQUFDO0lBQ2xFLE9BQU8sRUFBRSxLQUFLO0lBQ2QsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDOzs7Ozs7Ozs7O0FBV0YsTUFBTSxPQUFPLGdCQUFnQjs7Ozs7SUFpQzNCLFlBQ1UsT0FBZSxFQUNMLFNBQWM7UUFEeEIsWUFBTyxHQUFQLE9BQU8sQ0FBUTs7OztRQTlCakIsbUJBQWMsR0FBRyxJQUFJLEdBQUcsRUFBSyxDQUFDOzs7O1FBRzlCLG1CQUFjLEdBQUcsSUFBSSxHQUFHLEVBQUssQ0FBQzs7OztRQUc5Qix5QkFBb0IsR0FBRyxJQUFJLEdBQUcsRUFBSyxDQUFDOzs7O1FBR3BDLHFCQUFnQixHQUFHLElBQUksR0FBRyxFQUc5QixDQUFDOzs7OztRQU1JLGdCQUFXLEdBQXFDLElBQUksT0FBTyxFQUEyQixDQUFDOzs7OztRQU12RixjQUFTLEdBQXFDLElBQUksT0FBTyxFQUEyQixDQUFDOzs7O1FBR3JGLFdBQU0sR0FBbUIsSUFBSSxPQUFPLEVBQVMsQ0FBQzs7Ozs7UUE0SC9DLGlDQUE0Qjs7OztRQUFHLENBQUMsS0FBWSxFQUFFLEVBQUU7WUFDdEQsSUFBSSxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFB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Q0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLEVBQUMsQ0FBQztRQUN2RSxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU87Ozs7UUFBQyxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsRUFBQyxDQUFDO1FBQzVFLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1FBQzdCLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDNUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM1QixDQUFDOzs7Ozs7SUFhTyxxQkFBcUI7UUFDM0IsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU87Ozs7O1FBQUMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUU7WUFDN0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDM0UsQ0FBQyxFQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDaEMsQ0FBQzs7O1lBektGLFVBQVUsU0FBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7Ozs7WUFuQlosTUFBTTs0Q0F1RHJCLE1BQU0sU0FBQyxRQUFROzs7Ozs7OztJQWxDbEIscUNBQTRCOzs7Ozs7SUFHNUIsMENBQXNDOzs7Ozs7SUFHdEMsMENBQXNDOzs7Ozs7SUFHdEMsZ0RBQTRDOzs7Ozs7SUFHNUMsNENBR0s7Ozs7OztJQU1MLHVDQUFnRzs7Ozs7O0lBTWhHLHFDQUE4Rjs7Ozs7SUFHOUYsa0NBQXVEOzs7Ozs7O0lBNEh2RCx3REFJQzs7Ozs7SUE3SEMsbUNBQXVCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0YWJsZSwgTmdab25lLCBPbkRlc3Ryb3ksIEluamVjdH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtub3JtYWxpemVQYXNzaXZlTGlzdGVuZXJPcHRpb25zfSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtTdWJqZWN0fSBmcm9tICdyeGpzJztcblxuLyoqIEV2ZW50IG9wdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCB0byBiaW5kIGFuIGFjdGl2ZSwgY2FwdHVyaW5nIGV2ZW50LiAqL1xuY29uc3QgYWN0aXZlQ2FwdHVyaW5nRXZlbnRPcHRpb25zID0gbm9ybWFsaXplUGFzc2l2ZUxpc3RlbmVyT3B0aW9ucyh7XG4gIHBhc3NpdmU6IGZhbHNlLFxuICBjYXB0dXJlOiB0cnVlXG59KTtcblxuLyoqXG4gKiBTZXJ2aWNlIHRoYXQga2VlcHMgdHJhY2sgb2YgYWxsIHRoZSBkcmFnIGl0ZW0gYW5kIGRyb3AgY29udGFpbmVyXG4gKiBpbnN0YW5jZXMsIGFuZCBtYW5hZ2VzIGdsb2JhbCBldmVudCBsaXN0ZW5lcnMgb24gdGhlIGBkb2N1bWVudGAuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbi8vIE5vdGU6IHRoaXMgY2xhc3MgaXMgZ2VuZXJpYywgcmF0aGVyIHRoYW4gcmVmZXJlbmNpbmcgQ2RrRHJhZyBhbmQgQ2RrRHJvcExpc3QgZGlyZWN0bHksIGluIG9yZGVyXG4vLyB0byBhdm9pZCBjaXJjdWxhciBpbXBvcnRzLiBJZiB3ZSB3ZXJlIHRvIHJlZmVyZW5jZSB0aGVtIGhlcmUsIGltcG9ydGluZyB0aGUgcmVnaXN0cnkgaW50byB0aGVcbi8vIGNsYXNzZXMgdGhhdCBhcmUgcmVnaXN0ZXJpbmcgdGhlbXNlbHZlcyB3aWxsIGludHJvZHVjZSBhIGNpcmN1bGFyIGltcG9ydC5cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIERyYWdEcm9wUmVnaXN0cnk8SSwgQz4gaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQ7XG5cbiAgLyoqIFJlZ2lzdGVyZWQgZHJvcCBjb250YWluZXIgaW5zdGFuY2VzLiAqL1xuICBwcml2YXRlIF9kcm9wSW5zdGFuY2VzID0gbmV3IFNldDxDPigpO1xuXG4gIC8qKiBSZWdpc3RlcmVkIGRyYWcgaXRlbSBpbnN0YW5jZXMuICovXG4gIHByaXZhdGUgX2RyYWdJbnN0YW5jZXMgPSBuZXcgU2V0PEk+KCk7XG5cbiAgLyoqIERyYWcgaXRlbSBpbnN0YW5jZXMgdGhhdCBhcmUgY3VycmVudGx5IGJlaW5nIGRyYWdnZWQuICovXG4gIHByaXZhdGUgX2FjdGl2ZURyYWdJbnN0YW5jZXMgPSBuZXcgU2V0PEk+KCk7XG5cbiAgLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBldmVudCBsaXN0ZW5lcnMgdGhhdCB3ZSd2ZSBib3VuZCB0byB0aGUgYGRvY3VtZW50YC4gKi9cbiAgcHJpdmF0ZSBfZ2xvYmFsTGlzdGVuZXJzID0gbmV3IE1hcDxzdHJpbmcsIHtcbiAgICBoYW5kbGVyOiAoZXZlbnQ6IEV2ZW50KSA9PiB2b2lkLFxuICAgIG9wdGlvbnM/OiBBZGRFdmVudExpc3RlbmVyT3B0aW9ucyB8IGJvb2xlYW5cbiAgfT4oKTtcblxuICAvKipcbiAgICogRW1pdHMgdGhlIGB0b3VjaG1vdmVgIG9yIGBtb3VzZW1vdmVgIGV2ZW50cyB0aGF0IGFyZSBkaXNwYXRjaGVkXG4gICAqIHdoaWxlIHRoZSB1c2VyIGlzIGRyYWdnaW5nIGEgZHJhZyBpdGVtIGluc3RhbmNlLlxuICAgKi9cbiAgcmVhZG9ubHkgcG9pbnRlck1vdmU6IFN1YmplY3Q8VG91Y2hFdmVudCB8IE1vdXNlRXZlbnQ+ID0gbmV3IFN1YmplY3Q8VG91Y2hFdmVudCB8IE1vdXNlRXZlbnQ+KCk7XG5cbiAgLyoqXG4gICAqIEVtaXRzIHRoZSBgdG91Y2hlbmRgIG9yIGBtb3VzZXVwYCBldmVudHMgdGhhdCBhcmUgZGlzcGF0Y2hlZFxuICAgKiB3aGlsZSB0aGUgdXNlciBpcyBkcmFnZ2luZyBhIGRyYWcgaXRlbSBpbnN0YW5jZS5cbiAgICovXG4gIHJlYWRvbmx5IHBvaW50ZXJVcDogU3ViamVjdDxUb3VjaEV2ZW50IHwgTW91c2VFdmVudD4gPSBuZXcgU3ViamVjdDxUb3VjaEV2ZW50IHwgTW91c2VFdmVudD4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdmlld3BvcnQgaGFzIGJlZW4gc2Nyb2xsZWQgd2hpbGUgdGhlIHVzZXIgaXMgZHJhZ2dpbmcgYW4gaXRlbS4gKi9cbiAgcmVhZG9ubHkgc2Nyb2xsOiBTdWJqZWN0PEV2ZW50PiA9IG5ldyBTdWJqZWN0PEV2ZW50PigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgIEBJbmplY3QoRE9DVU1FTlQpIF9kb2N1bWVudDogYW55KSB7XG4gICAgdGhpcy5fZG9jdW1lbnQgPSBfZG9jdW1lbnQ7XG4gIH1cblxuICAvKiogQWRkcyBhIGRyb3AgY29udGFpbmVyIHRvIHRoZSByZWdpc3RyeS4gKi9cbiAgcmVnaXN0ZXJEcm9wQ29udGFpbmVyKGRyb3A6IEMpIHtcbiAgICBpZiAoIXRoaXMuX2Ryb3BJbnN0YW5jZXMuaGFzKGRyb3ApKSB7XG4gICAgICB0aGlzLl9kcm9wSW5zdGFuY2VzLmFkZChkcm9wKTtcbiAgICB9XG4gIH1cblxuICAvKiogQWRkcyBhIGRyYWcgaXRlbSBpbnN0YW5jZSB0byB0aGUgcmVnaXN0cnkuICovXG4gIHJlZ2lzdGVyRHJhZ0l0ZW0oZHJhZzogSSkge1xuICAgIHRoaXMuX2RyYWdJbnN0YW5jZXMuYWRkKGRyYWcpO1xuXG4gICAgLy8gVGhlIGB0b3VjaG1vdmVgIGV2ZW50IGdldHMgYm91bmQgb25jZSwgYWhlYWQgb2YgdGltZSwgYmVjYXVzZSBXZWJLaXRcbiAgICAvLyB3b24ndCBwcmV2ZW50RGVmYXVsdCBvbiBhIGR5bmFtaWNhbGx5LWFkZGVkIGB0b3VjaG1vdmVgIGxpc3RlbmVyLlxuICAgIC8vIFNlZSBodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTg0MjUwLlxuICAgIGlmICh0aGlzLl9kcmFnSW5zdGFuY2VzLnNpemUgPT09IDEpIHtcbiAgICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIC8vIFRoZSBldmVudCBoYW5kbGVyIGhhcyB0byBiZSBleHBsaWNpdGx5IGFjdGl2ZSxcbiAgICAgICAgLy8gYmVjYXVzZSBuZXdlciBicm93c2VycyBtYWtlIGl0IHBhc3NpdmUgYnkgZGVmYXVsdC5cbiAgICAgICAgdGhpcy5fZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5fcHJldmVudERlZmF1bHRXaGlsZURyYWdnaW5nLFxuICAgICAgICAgICAgYWN0aXZlQ2FwdHVyaW5nRXZlbnRPcHRpb25zKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSZW1vdmVzIGEgZHJvcCBjb250YWluZXIgZnJvbSB0aGUgcmVnaXN0cnkuICovXG4gIHJlbW92ZURyb3BDb250YWluZXIoZHJvcDogQykge1xuICAgIHRoaXMuX2Ryb3BJbnN0YW5jZXMuZGVsZXRlKGRyb3ApO1xuICB9XG5cbiAgLyoqIFJlbW92ZXMgYSBkcmFnIGl0ZW0gaW5zdGFuY2UgZnJvbSB0aGUgcmVnaXN0cnkuICovXG4gIHJlbW92ZURyYWdJdGVtKGRyYWc6IEkpIHtcbiAgICB0aGlzLl9kcmFnSW5zdGFuY2VzLmRlbGV0ZShkcmFnKTtcbiAgICB0aGlzLnN0b3BEcmFnZ2luZyhkcmFnKTtcblxuICAgIGlmICh0aGlzLl9kcmFnSW5zdGFuY2VzLnNpemUgPT09IDApIHtcbiAgICAgIHRoaXMuX2RvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMuX3ByZXZlbnREZWZhdWx0V2hpbGVEcmFnZ2luZyxcbiAgICAgICAgICBhY3RpdmVDYXB0dXJpbmdFdmVudE9wdGlvbnMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydHMgdGhlIGRyYWdnaW5nIHNlcXVlbmNlIGZvciBhIGRyYWcgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSBkcmFnIERyYWcgaW5zdGFuY2Ugd2hpY2ggaXMgYmVpbmcgZHJhZ2dlZC5cbiAgICogQHBhcmFtIGV2ZW50IEV2ZW50IHRoYXQgaW5pdGlhdGVkIHRoZSBkcmFnZ2luZy5cbiAgICovXG4gIHN0YXJ0RHJhZ2dpbmcoZHJhZzogSSwgZXZlbnQ6IFRvdWNoRXZlbnQgfCBNb3VzZUV2ZW50KSB7XG4gICAgLy8gRG8gbm90IHByb2Nlc3MgdGhlIHNhbWUgZHJhZyB0d2ljZSB0byBhdm9pZCBtZW1vcnkgbGVha3MgYW5kIHJlZHVuZGFudCBsaXN0ZW5lcnNcbiAgICBpZiAodGhpcy5fYWN0aXZlRHJhZ0luc3RhbmNlcy5oYXMoZHJhZykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9hY3RpdmVEcmFnSW5zdGFuY2VzLmFkZChkcmFnKTtcblxuICAgIGlmICh0aGlzLl9hY3RpdmVEcmFnSW5zdGFuY2VzLnNpemUgPT09IDEpIHtcbiAgICAgIGNvbnN0IGlzVG91Y2hFdmVudCA9IGV2ZW50LnR5cGUuc3RhcnRzV2l0aCgndG91Y2gnKTtcbiAgICAgIGNvbnN0IG1vdmVFdmVudCA9IGlzVG91Y2hFdmVudCA/ICd0b3VjaG1vdmUnIDogJ21vdXNlbW92ZSc7XG4gICAgICBjb25zdCB1cEV2ZW50ID0gaXNUb3VjaEV2ZW50ID8gJ3RvdWNoZW5kJyA6ICdtb3VzZXVwJztcblxuICAgICAgLy8gV2UgZXhwbGljaXRseSBiaW5kIF9fYWN0aXZlX18gbGlzdGVuZXJzIGhlcmUsIGJlY2F1c2UgbmV3ZXIgYnJvd3NlcnMgd2lsbCBkZWZhdWx0IHRvXG4gICAgICAvLyBwYXNzaXZlIG9uZXMgZm9yIGBtb3VzZW1vdmVgIGFuZCBgdG91Y2htb3ZlYC4gVGhlIGV2ZW50cyBuZWVkIHRvIGJlIGFjdGl2ZSwgYmVjYXVzZSB3ZVxuICAgICAgLy8gdXNlIGBwcmV2ZW50RGVmYXVsdGAgdG8gcHJldmVudCB0aGUgcGFnZSBmcm9tIHNjcm9sbGluZyB3aGlsZSB0aGUgdXNlciBpcyBkcmFnZ2luZy5cbiAgICAgIHRoaXMuX2dsb2JhbExpc3RlbmVyc1xuICAgICAgICAuc2V0KG1vdmVFdmVudCwge1xuICAgICAgICAgIGhhbmRsZXI6IChlOiBFdmVudCkgPT4gdGhpcy5wb2ludGVyTW92ZS5uZXh0KGUgYXMgVG91Y2hFdmVudCB8IE1vdXNlRXZlbnQpLFxuICAgICAgICAgIG9wdGlvbnM6IGFjdGl2ZUNhcHR1cmluZ0V2ZW50T3B0aW9uc1xuICAgICAgICB9KVxuICAgICAgICAuc2V0KHVwRXZlbnQsIHtcbiAgICAgICAgICBoYW5kbGVyOiAoZTogRXZlbnQpID0+IHRoaXMucG9pbnRlclVwLm5leHQoZSBhcyBUb3VjaEV2ZW50IHwgTW91c2VFdmVudCksXG4gICAgICAgICAgb3B0aW9uczogdHJ1ZVxuICAgICAgICB9KVxuICAgICAgICAuc2V0KCdzY3JvbGwnLCB7XG4gICAgICAgICAgaGFuZGxlcjogKGU6IEV2ZW50KSA9PiB0aGlzLnNjcm9sbC5uZXh0KGUpXG4gICAgICAgIH0pXG4gICAgICAgIC8vIFByZXZlbnRpbmcgdGhlIGRlZmF1bHQgYWN0aW9uIG9uIGBtb3VzZW1vdmVgIGlzbid0IGVub3VnaCB0byBkaXNhYmxlIHRleHQgc2VsZWN0aW9uXG4gICAgICAgIC8vIG9uIFNhZmFyaSBzbyB3ZSBuZWVkIHRvIHByZXZlbnQgdGhlIHNlbGVjdGlvbiBldmVudCBhcyB3ZWxsLiBBbHRlcm5hdGl2ZWx5IHRoaXMgY2FuXG4gICAgICAgIC8vIGJlIGRvbmUgYnkgc2V0dGluZyBgdXNlci1zZWxlY3Q6IG5vbmVgIG9uIHRoZSBgYm9keWAsIGhvd2V2ZXIgaXQgaGFzIGNhdXNlcyBhIHN0eWxlXG4gICAgICAgIC8vIHJlY2FsY3VsYXRpb24gd2hpY2ggY2FuIGJlIGV4cGVuc2l2ZSBvbiBwYWdlcyB3aXRoIGEgbG90IG9mIGVsZW1lbnRzLlxuICAgICAgICAuc2V0KCdzZWxlY3RzdGFydCcsIHtcbiAgICAgICAgICBoYW5kbGVyOiB0aGlzLl9wcmV2ZW50RGVmYXVsdFdoaWxlRHJhZ2dpbmcsXG4gICAgICAgICAgb3B0aW9uczogYWN0aXZlQ2FwdHVyaW5nRXZlbnRPcHRpb25zXG4gICAgICAgIH0pO1xuXG4gICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICB0aGlzLl9nbG9iYWxMaXN0ZW5lcnMuZm9yRWFjaCgoY29uZmlnLCBuYW1lKSA9PiB7XG4gICAgICAgICAgdGhpcy5fZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBjb25maWcuaGFuZGxlciwgY29uZmlnLm9wdGlvbnMpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTdG9wcyBkcmFnZ2luZyBhIGRyYWcgaXRlbSBpbnN0YW5jZS4gKi9cbiAgc3RvcERyYWdnaW5nKGRyYWc6IEkpIHtcbiAgICB0aGlzLl9hY3RpdmVEcmFnSW5zdGFuY2VzLmRlbGV0ZShkcmFnKTtcblxuICAgIGlmICh0aGlzLl9hY3RpdmVEcmFnSW5zdGFuY2VzLnNpemUgPT09IDApIHtcbiAgICAgIHRoaXMuX2NsZWFyR2xvYmFsTGlzdGVuZXJzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEdldHMgd2hldGhlciBhIGRyYWcgaXRlbSBpbnN0YW5jZSBpcyBjdXJyZW50bHkgYmVpbmcgZHJhZ2dlZC4gKi9cbiAgaXNEcmFnZ2luZyhkcmFnOiBJKSB7XG4gICAgcmV0dXJuIHRoaXMuX2FjdGl2ZURyYWdJbnN0YW5jZXMuaGFzKGRyYWcpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fZHJhZ0luc3RhbmNlcy5mb3JFYWNoKGluc3RhbmNlID0+IHRoaXMucmVtb3ZlRHJhZ0l0ZW0oaW5zdGFuY2UpKTtcbiAgICB0aGlzLl9kcm9wSW5zdGFuY2VzLmZvckVhY2goaW5zdGFuY2UgPT4gdGhpcy5yZW1vdmVEcm9wQ29udGFpbmVyKGluc3RhbmNlKSk7XG4gICAgdGhpcy5fY2xlYXJHbG9iYWxMaXN0ZW5lcnMoKTtcbiAgICB0aGlzLnBvaW50ZXJNb3ZlLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5wb2ludGVyVXAuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFdmVudCBsaXN0ZW5lciB0aGF0IHdpbGwgcHJldmVudCB0aGUgZGVmYXVsdCBicm93c2VyIGFjdGlvbiB3aGlsZSB0aGUgdXNlciBpcyBkcmFnZ2luZy5cbiAgICogQHBhcmFtIGV2ZW50IEV2ZW50IHdob3NlIGRlZmF1bHQgYWN0aW9uIHNob3VsZCBiZSBwcmV2ZW50ZWQuXG4gICAqL1xuICBwcml2YXRlIF9wcmV2ZW50RGVmYXVsdFdoaWxlRHJhZ2dpbmcgPSAoZXZlbnQ6IEV2ZW50KSA9PiB7XG4gICAgaWYgKHRoaXMuX2FjdGl2ZURyYWdJbnN0YW5jZXMuc2l6ZSkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG4gIH1cblxuICAvKiogQ2xlYXJzIG91dCB0aGUgZ2xvYmFsIGV2ZW50IGxpc3RlbmVycyBmcm9tIHRoZSBgZG9jdW1lbnRgLiAqL1xuICBwcml2YXRlIF9jbGVhckdsb2JhbExpc3RlbmVycygpIHtcbiAgICB0aGlzLl9nbG9iYWxMaXN0ZW5lcnMuZm9yRWFjaCgoY29uZmlnLCBuYW1lKSA9PiB7XG4gICAgICB0aGlzLl9kb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKG5hbWUsIGNvbmZpZy5oYW5kbGVyLCBjb25maWcub3B0aW9ucyk7XG4gICAgfSk7XG5cbiAgICB0aGlzLl9nbG9iYWxMaXN0ZW5lcnMuY2xlYXIoKTtcbiAgfVxufVxuIl19