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
import { merge, Observable, Subject } from 'rxjs';
import * as i0 from "@angular/core";
/** Event options that can be used to bind an active, capturing event. */
const activeCapturingEventOptions = normalizePassiveListenerOptions({
    passive: false,
    capture: true,
});
/**
 * Service that keeps track of all the drag item and drop container
 * instances, and manages global event listeners on the `document`.
 * @docs-private
 */
// Note: this class is generic, rather than referencing CdkDrag and CdkDropList directly, in order
// to avoid circular imports. If we were to reference them here, importing the registry into the
// classes that are registering themselves will introduce a circular import.
class DragDropRegistry {
    constructor(_ngZone, _document) {
        this._ngZone = _ngZone;
        /** Registered drop container instances. */
        this._dropInstances = new Set();
        /** Registered drag item instances. */
        this._dragInstances = new Set();
        /** Drag item instances that are currently being dragged. */
        this._activeDragInstances = [];
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
            if (this._activeDragInstances.length > 0) {
                event.preventDefault();
            }
        };
        /** Event listener for `touchmove` that is bound even if no dragging is happening. */
        this._persistentTouchmoveListener = (event) => {
            if (this._activeDragInstances.length > 0) {
                // Note that we only want to prevent the default action after dragging has actually started.
                // Usually this is the same time at which the item is added to the `_activeDragInstances`,
                // but it could be pushed back if the user has set up a drag delay or threshold.
                if (this._activeDragInstances.some(this._draggingPredicate)) {
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
        if (this._activeDragInstances.indexOf(drag) > -1) {
            return;
        }
        this._activeDragInstances.push(drag);
        if (this._activeDragInstances.length === 1) {
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
        const index = this._activeDragInstances.indexOf(drag);
        if (index > -1) {
            this._activeDragInstances.splice(index, 1);
            if (this._activeDragInstances.length === 0) {
                this._clearGlobalListeners();
            }
        }
    }
    /** Gets whether a drag item instance is currently being dragged. */
    isDragging(drag) {
        return this._activeDragInstances.indexOf(drag) > -1;
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
                        if (this._activeDragInstances.length) {
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: DragDropRegistry, deps: [{ token: i0.NgZone }, { token: DOCUMENT }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: DragDropRegistry, providedIn: 'root' }); }
}
export { DragDropRegistry };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: DragDropRegistry, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: i0.NgZone }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1kcm9wLXJlZ2lzdHJ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZHJhZy1kcm9wLXJlZ2lzdHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFhLE1BQU0sRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNwRSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUFDLCtCQUErQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdEUsT0FBTyxFQUFDLEtBQUssRUFBRSxVQUFVLEVBQVksT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDOztBQUUxRCx5RUFBeUU7QUFDekUsTUFBTSwyQkFBMkIsR0FBRywrQkFBK0IsQ0FBQztJQUNsRSxPQUFPLEVBQUUsS0FBSztJQUNkLE9BQU8sRUFBRSxJQUFJO0NBQ2QsQ0FBQyxDQUFDO0FBRUg7Ozs7R0FJRztBQUNILGtHQUFrRztBQUNsRyxnR0FBZ0c7QUFDaEcsNEVBQTRFO0FBQzVFLE1BQ2EsZ0JBQWdCO0lBOEMzQixZQUFvQixPQUFlLEVBQW9CLFNBQWM7UUFBakQsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQTNDbkMsMkNBQTJDO1FBQ25DLG1CQUFjLEdBQUcsSUFBSSxHQUFHLEVBQUssQ0FBQztRQUV0QyxzQ0FBc0M7UUFDOUIsbUJBQWMsR0FBRyxJQUFJLEdBQUcsRUFBSyxDQUFDO1FBRXRDLDREQUE0RDtRQUNwRCx5QkFBb0IsR0FBUSxFQUFFLENBQUM7UUFFdkMsNkVBQTZFO1FBQ3JFLHFCQUFnQixHQUFHLElBQUksR0FBRyxFQU0vQixDQUFDO1FBRUo7OztXQUdHO1FBQ0ssdUJBQWtCLEdBQUcsQ0FBQyxJQUFPLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUU1RDs7O1dBR0c7UUFDTSxn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QUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFO1lBQzdDLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQW1CLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzNFLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ2hDLENBQUM7OEdBdFBVLGdCQUFnQix3Q0E4Q2tCLFFBQVE7a0hBOUMxQyxnQkFBZ0IsY0FESixNQUFNOztTQUNsQixnQkFBZ0I7MkZBQWhCLGdCQUFnQjtrQkFENUIsVUFBVTttQkFBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7OzBCQStDUSxNQUFNOzJCQUFDLFFBQVEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RhYmxlLCBOZ1pvbmUsIE9uRGVzdHJveSwgSW5qZWN0fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge25vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnN9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge21lcmdlLCBPYnNlcnZhYmxlLCBPYnNlcnZlciwgU3ViamVjdH0gZnJvbSAncnhqcyc7XG5cbi8qKiBFdmVudCBvcHRpb25zIHRoYXQgY2FuIGJlIHVzZWQgdG8gYmluZCBhbiBhY3RpdmUsIGNhcHR1cmluZyBldmVudC4gKi9cbmNvbnN0IGFjdGl2ZUNhcHR1cmluZ0V2ZW50T3B0aW9ucyA9IG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMoe1xuICBwYXNzaXZlOiBmYWxzZSxcbiAgY2FwdHVyZTogdHJ1ZSxcbn0pO1xuXG4vKipcbiAqIFNlcnZpY2UgdGhhdCBrZWVwcyB0cmFjayBvZiBhbGwgdGhlIGRyYWcgaXRlbSBhbmQgZHJvcCBjb250YWluZXJcbiAqIGluc3RhbmNlcywgYW5kIG1hbmFnZXMgZ2xvYmFsIGV2ZW50IGxpc3RlbmVycyBvbiB0aGUgYGRvY3VtZW50YC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuLy8gTm90ZTogdGhpcyBjbGFzcyBpcyBnZW5lcmljLCByYXRoZXIgdGhhbiByZWZlcmVuY2luZyBDZGtEcmFnIGFuZCBDZGtEcm9wTGlzdCBkaXJlY3RseSwgaW4gb3JkZXJcbi8vIHRvIGF2b2lkIGNpcmN1bGFyIGltcG9ydHMuIElmIHdlIHdlcmUgdG8gcmVmZXJlbmNlIHRoZW0gaGVyZSwgaW1wb3J0aW5nIHRoZSByZWdpc3RyeSBpbnRvIHRoZVxuLy8gY2xhc3NlcyB0aGF0IGFyZSByZWdpc3RlcmluZyB0aGVtc2VsdmVzIHdpbGwgaW50cm9kdWNlIGEgY2lyY3VsYXIgaW1wb3J0LlxuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgRHJhZ0Ryb3BSZWdpc3RyeTxJIGV4dGVuZHMge2lzRHJhZ2dpbmcoKTogYm9vbGVhbn0sIEM+IGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50O1xuXG4gIC8qKiBSZWdpc3RlcmVkIGRyb3AgY29udGFpbmVyIGluc3RhbmNlcy4gKi9cbiAgcHJpdmF0ZSBfZHJvcEluc3RhbmNlcyA9IG5ldyBTZXQ8Qz4oKTtcblxuICAvKiogUmVnaXN0ZXJlZCBkcmFnIGl0ZW0gaW5zdGFuY2VzLiAqL1xuICBwcml2YXRlIF9kcmFnSW5zdGFuY2VzID0gbmV3IFNldDxJPigpO1xuXG4gIC8qKiBEcmFnIGl0ZW0gaW5zdGFuY2VzIHRoYXQgYXJlIGN1cnJlbnRseSBiZWluZyBkcmFnZ2VkLiAqL1xuICBwcml2YXRlIF9hY3RpdmVEcmFnSW5zdGFuY2VzOiBJW10gPSBbXTtcblxuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIGV2ZW50IGxpc3RlbmVycyB0aGF0IHdlJ3ZlIGJvdW5kIHRvIHRoZSBgZG9jdW1lbnRgLiAqL1xuICBwcml2YXRlIF9nbG9iYWxMaXN0ZW5lcnMgPSBuZXcgTWFwPFxuICAgIHN0cmluZyxcbiAgICB7XG4gICAgICBoYW5kbGVyOiAoZXZlbnQ6IEV2ZW50KSA9PiB2b2lkO1xuICAgICAgb3B0aW9ucz86IEFkZEV2ZW50TGlzdGVuZXJPcHRpb25zIHwgYm9vbGVhbjtcbiAgICB9XG4gID4oKTtcblxuICAvKipcbiAgICogUHJlZGljYXRlIGZ1bmN0aW9uIHRvIGNoZWNrIGlmIGFuIGl0ZW0gaXMgYmVpbmcgZHJhZ2dlZC4gIE1vdmVkIG91dCBpbnRvIGEgcHJvcGVydHksXG4gICAqIGJlY2F1c2UgaXQnbGwgYmUgY2FsbGVkIGEgbG90IGFuZCB3ZSBkb24ndCB3YW50IHRvIGNyZWF0ZSBhIG5ldyBmdW5jdGlvbiBldmVyeSB0aW1lLlxuICAgKi9cbiAgcHJpdmF0ZSBfZHJhZ2dpbmdQcmVkaWNhdGUgPSAoaXRlbTogSSkgPT4gaXRlbS5pc0RyYWdnaW5nKCk7XG5cbiAgLyoqXG4gICAqIEVtaXRzIHRoZSBgdG91Y2htb3ZlYCBvciBgbW91c2Vtb3ZlYCBldmVudHMgdGhhdCBhcmUgZGlzcGF0Y2hlZFxuICAgKiB3aGlsZSB0aGUgdXNlciBpcyBkcmFnZ2luZyBhIGRyYWcgaXRlbSBpbnN0YW5jZS5cbiAgICovXG4gIHJlYWRvbmx5IHBvaW50ZXJNb3ZlOiBTdWJqZWN0PFRvdWNoRXZlbnQgfCBNb3VzZUV2ZW50PiA9IG5ldyBTdWJqZWN0PFRvdWNoRXZlbnQgfCBNb3VzZUV2ZW50PigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB0aGUgYHRvdWNoZW5kYCBvciBgbW91c2V1cGAgZXZlbnRzIHRoYXQgYXJlIGRpc3BhdGNoZWRcbiAgICogd2hpbGUgdGhlIHVzZXIgaXMgZHJhZ2dpbmcgYSBkcmFnIGl0ZW0gaW5zdGFuY2UuXG4gICAqL1xuICByZWFkb25seSBwb2ludGVyVXA6IFN1YmplY3Q8VG91Y2hFdmVudCB8IE1vdXNlRXZlbnQ+ID0gbmV3IFN1YmplY3Q8VG91Y2hFdmVudCB8IE1vdXNlRXZlbnQ+KCk7XG5cbiAgLyoqXG4gICAqIEVtaXRzIHdoZW4gdGhlIHZpZXdwb3J0IGhhcyBiZWVuIHNjcm9sbGVkIHdoaWxlIHRoZSB1c2VyIGlzIGRyYWdnaW5nIGFuIGl0ZW0uXG4gICAqIEBkZXByZWNhdGVkIFRvIGJlIHR1cm5lZCBpbnRvIGEgcHJpdmF0ZSBtZW1iZXIuIFVzZSB0aGUgYHNjcm9sbGVkYCBtZXRob2QgaW5zdGVhZC5cbiAgICogQGJyZWFraW5nLWNoYW5nZSAxMy4wLjBcbiAgICovXG4gIHJlYWRvbmx5IHNjcm9sbDogU3ViamVjdDxFdmVudD4gPSBuZXcgU3ViamVjdDxFdmVudD4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSwgQEluamVjdChET0NVTUVOVCkgX2RvY3VtZW50OiBhbnkpIHtcbiAgICB0aGlzLl9kb2N1bWVudCA9IF9kb2N1bWVudDtcbiAgfVxuXG4gIC8qKiBBZGRzIGEgZHJvcCBjb250YWluZXIgdG8gdGhlIHJlZ2lzdHJ5LiAqL1xuICByZWdpc3RlckRyb3BDb250YWluZXIoZHJvcDogQykge1xuICAgIGlmICghdGhpcy5fZHJvcEluc3RhbmNlcy5oYXMoZHJvcCkpIHtcbiAgICAgIHRoaXMuX2Ryb3BJbnN0YW5jZXMuYWRkKGRyb3ApO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBBZGRzIGEgZHJhZyBpdGVtIGluc3RhbmNlIHRvIHRoZSByZWdpc3RyeS4gKi9cbiAgcmVnaXN0ZXJEcmFnSXRlbShkcmFnOiBJKSB7XG4gICAgdGhpcy5fZHJhZ0luc3RhbmNlcy5hZGQoZHJhZyk7XG5cbiAgICAvLyBUaGUgYHRvdWNobW92ZWAgZXZlbnQgZ2V0cyBib3VuZCBvbmNlLCBhaGVhZCBvZiB0aW1lLCBiZWNhdXNlIFdlYktpdFxuICAgIC8vIHdvbid0IHByZXZlbnREZWZhdWx0IG9uIGEgZHluYW1pY2FsbHktYWRkZWQgYHRvdWNobW92ZWAgbGlzdGVuZXIuXG4gICAgLy8gU2VlIGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD0xODQyNTAuXG4gICAgaWYgKHRoaXMuX2RyYWdJbnN0YW5jZXMuc2l6ZSA9PT0gMSkge1xuICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgLy8gVGhlIGV2ZW50IGhhbmRsZXIgaGFzIHRvIGJlIGV4cGxpY2l0bHkgYWN0aXZlLFxuICAgICAgICAvLyBiZWNhdXNlIG5ld2VyIGJyb3dzZXJzIG1ha2UgaXQgcGFzc2l2ZSBieSBkZWZhdWx0LlxuICAgICAgICB0aGlzLl9kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICAgICd0b3VjaG1vdmUnLFxuICAgICAgICAgIHRoaXMuX3BlcnNpc3RlbnRUb3VjaG1vdmVMaXN0ZW5lcixcbiAgICAgICAgICBhY3RpdmVDYXB0dXJpbmdFdmVudE9wdGlvbnMsXG4gICAgICAgICk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKiogUmVtb3ZlcyBhIGRyb3AgY29udGFpbmVyIGZyb20gdGhlIHJlZ2lzdHJ5LiAqL1xuICByZW1vdmVEcm9wQ29udGFpbmVyKGRyb3A6IEMpIHtcbiAgICB0aGlzLl9kcm9wSW5zdGFuY2VzLmRlbGV0ZShkcm9wKTtcbiAgfVxuXG4gIC8qKiBSZW1vdmVzIGEgZHJhZyBpdGVtIGluc3RhbmNlIGZyb20gdGhlIHJlZ2lzdHJ5LiAqL1xuICByZW1vdmVEcmFnSXRlbShkcmFnOiBJKSB7XG4gICAgdGhpcy5fZHJhZ0luc3RhbmNlcy5kZWxldGUoZHJhZyk7XG4gICAgdGhpcy5zdG9wRHJhZ2dpbmcoZHJhZyk7XG5cbiAgICBpZiAodGhpcy5fZHJhZ0luc3RhbmNlcy5zaXplID09PSAwKSB7XG4gICAgICB0aGlzLl9kb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFxuICAgICAgICAndG91Y2htb3ZlJyxcbiAgICAgICAgdGhpcy5fcGVyc2lzdGVudFRvdWNobW92ZUxpc3RlbmVyLFxuICAgICAgICBhY3RpdmVDYXB0dXJpbmdFdmVudE9wdGlvbnMsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydHMgdGhlIGRyYWdnaW5nIHNlcXVlbmNlIGZvciBhIGRyYWcgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSBkcmFnIERyYWcgaW5zdGFuY2Ugd2hpY2ggaXMgYmVpbmcgZHJhZ2dlZC5cbiAgICogQHBhcmFtIGV2ZW50IEV2ZW50IHRoYXQgaW5pdGlhdGVkIHRoZSBkcmFnZ2luZy5cbiAgICovXG4gIHN0YXJ0RHJhZ2dpbmcoZHJhZzogSSwgZXZlbnQ6IFRvdWNoRXZlbnQgfCBNb3VzZUV2ZW50KSB7XG4gICAgLy8gRG8gbm90IHByb2Nlc3MgdGhlIHNhbWUgZHJhZyB0d2ljZSB0byBhdm9pZCBtZW1vcnkgbGVha3MgYW5kIHJlZHVuZGFudCBsaXN0ZW5lcnNcbiAgICBpZiAodGhpcy5fYWN0aXZlRHJhZ0luc3RhbmNlcy5pbmRleE9mKGRyYWcpID4gLTEpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9hY3RpdmVEcmFnSW5zdGFuY2VzLnB1c2goZHJhZyk7XG5cbiAgICBpZiAodGhpcy5fYWN0aXZlRHJhZ0luc3RhbmNlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgIGNvbnN0IGlzVG91Y2hFdmVudCA9IGV2ZW50LnR5cGUuc3RhcnRzV2l0aCgndG91Y2gnKTtcblxuICAgICAgLy8gV2UgZXhwbGljaXRseSBiaW5kIF9fYWN0aXZlX18gbGlzdGVuZXJzIGhlcmUsIGJlY2F1c2UgbmV3ZXIgYnJvd3NlcnMgd2lsbCBkZWZhdWx0IHRvXG4gICAgICAvLyBwYXNzaXZlIG9uZXMgZm9yIGBtb3VzZW1vdmVgIGFuZCBgdG91Y2htb3ZlYC4gVGhlIGV2ZW50cyBuZWVkIHRvIGJlIGFjdGl2ZSwgYmVjYXVzZSB3ZVxuICAgICAgLy8gdXNlIGBwcmV2ZW50RGVmYXVsdGAgdG8gcHJldmVudCB0aGUgcGFnZSBmcm9tIHNjcm9sbGluZyB3aGlsZSB0aGUgdXNlciBpcyBkcmFnZ2luZy5cbiAgICAgIHRoaXMuX2dsb2JhbExpc3RlbmVyc1xuICAgICAgICAuc2V0KGlzVG91Y2hFdmVudCA/ICd0b3VjaGVuZCcgOiAnbW91c2V1cCcsIHtcbiAgICAgICAgICBoYW5kbGVyOiAoZTogRXZlbnQpID0+IHRoaXMucG9pbnRlclVwLm5leHQoZSBhcyBUb3VjaEV2ZW50IHwgTW91c2VFdmVudCksXG4gICAgICAgICAgb3B0aW9uczogdHJ1ZSxcbiAgICAgICAgfSlcbiAgICAgICAgLnNldCgnc2Nyb2xsJywge1xuICAgICAgICAgIGhhbmRsZXI6IChlOiBFdmVudCkgPT4gdGhpcy5zY3JvbGwubmV4dChlKSxcbiAgICAgICAgICAvLyBVc2UgY2FwdHVyaW5nIHNvIHRoYXQgd2UgcGljayB1cCBzY3JvbGwgY2hhbmdlcyBpbiBhbnkgc2Nyb2xsYWJsZSBub2RlcyB0aGF0IGFyZW4ndFxuICAgICAgICAgIC8vIHRoZSBkb2N1bWVudC4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2NvbXBvbmVudHMvaXNzdWVzLzE3MTQ0LlxuICAgICAgICAgIG9wdGlvbnM6IHRydWUsXG4gICAgICAgIH0pXG4gICAgICAgIC8vIFByZXZlbnRpbmcgdGhlIGRlZmF1bHQgYWN0aW9uIG9uIGBtb3VzZW1vdmVgIGlzbid0IGVub3VnaCB0byBkaXNhYmxlIHRleHQgc2VsZWN0aW9uXG4gICAgICAgIC8vIG9uIFNhZmFyaSBzbyB3ZSBuZWVkIHRvIHByZXZlbnQgdGhlIHNlbGVjdGlvbiBldmVudCBhcyB3ZWxsLiBBbHRlcm5hdGl2ZWx5IHRoaXMgY2FuXG4gICAgICAgIC8vIGJlIGRvbmUgYnkgc2V0dGluZyBgdXNlci1zZWxlY3Q6IG5vbmVgIG9uIHRoZSBgYm9keWAsIGhvd2V2ZXIgaXQgaGFzIGNhdXNlcyBhIHN0eWxlXG4gICAgICAgIC8vIHJlY2FsY3VsYXRpb24gd2hpY2ggY2FuIGJlIGV4cGVuc2l2ZSBvbiBwYWdlcyB3aXRoIGEgbG90IG9mIGVsZW1lbnRzLlxuICAgICAgICAuc2V0KCdzZWxlY3RzdGFydCcsIHtcbiAgICAgICAgICBoYW5kbGVyOiB0aGlzLl9wcmV2ZW50RGVmYXVsdFdoaWxlRHJhZ2dpbmcsXG4gICAgICAgICAgb3B0aW9uczogYWN0aXZlQ2FwdHVyaW5nRXZlbnRPcHRpb25zLFxuICAgICAgICB9KTtcblxuICAgICAgLy8gV2UgZG9uJ3QgaGF2ZSB0byBiaW5kIGEgbW92ZSBldmVudCBmb3IgdG91Y2ggZHJhZyBzZXF1ZW5jZXMsIGJlY2F1c2VcbiAgICAgIC8vIHdlIGFscmVhZHkgaGF2ZSBhIHBlcnNpc3RlbnQgZ2xvYmFsIG9uZSBib3VuZCBmcm9tIGByZWdpc3RlckRyYWdJdGVtYC5cbiAgICAgIGlmICghaXNUb3VjaEV2ZW50KSB7XG4gICAgICAgIHRoaXMuX2dsb2JhbExpc3RlbmVycy5zZXQoJ21vdXNlbW92ZScsIHtcbiAgICAgICAgICBoYW5kbGVyOiAoZTogRXZlbnQpID0+IHRoaXMucG9pbnRlck1vdmUubmV4dChlIGFzIE1vdXNlRXZlbnQpLFxuICAgICAgICAgIG9wdGlvbnM6IGFjdGl2ZUNhcHR1cmluZ0V2ZW50T3B0aW9ucyxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIHRoaXMuX2dsb2JhbExpc3RlbmVycy5mb3JFYWNoKChjb25maWcsIG5hbWUpID0+IHtcbiAgICAgICAgICB0aGlzLl9kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKG5hbWUsIGNvbmZpZy5oYW5kbGVyLCBjb25maWcub3B0aW9ucyk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFN0b3BzIGRyYWdnaW5nIGEgZHJhZyBpdGVtIGluc3RhbmNlLiAqL1xuICBzdG9wRHJhZ2dpbmcoZHJhZzogSSkge1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5fYWN0aXZlRHJhZ0luc3RhbmNlcy5pbmRleE9mKGRyYWcpO1xuXG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMuX2FjdGl2ZURyYWdJbnN0YW5jZXMuc3BsaWNlKGluZGV4LCAxKTtcblxuICAgICAgaWYgKHRoaXMuX2FjdGl2ZURyYWdJbnN0YW5jZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRoaXMuX2NsZWFyR2xvYmFsTGlzdGVuZXJzKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIEdldHMgd2hldGhlciBhIGRyYWcgaXRlbSBpbnN0YW5jZSBpcyBjdXJyZW50bHkgYmVpbmcgZHJhZ2dlZC4gKi9cbiAgaXNEcmFnZ2luZyhkcmFnOiBJKSB7XG4gICAgcmV0dXJuIHRoaXMuX2FjdGl2ZURyYWdJbnN0YW5jZXMuaW5kZXhPZihkcmFnKSA+IC0xO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSBzdHJlYW0gdGhhdCB3aWxsIGVtaXQgd2hlbiBhbnkgZWxlbWVudCBvbiB0aGUgcGFnZSBpcyBzY3JvbGxlZCB3aGlsZSBhbiBpdGVtIGlzIGJlaW5nXG4gICAqIGRyYWdnZWQuXG4gICAqIEBwYXJhbSBzaGFkb3dSb290IE9wdGlvbmFsIHNoYWRvdyByb290IHRoYXQgdGhlIGN1cnJlbnQgZHJhZ2dpbmcgc2VxdWVuY2Ugc3RhcnRlZCBmcm9tLlxuICAgKiAgIFRvcC1sZXZlbCBsaXN0ZW5lcnMgd29uJ3QgcGljayB1cCBldmVudHMgY29taW5nIGZyb20gdGhlIHNoYWRvdyBET00gc28gdGhpcyBwYXJhbWV0ZXIgY2FuXG4gICAqICAgYmUgdXNlZCB0byBpbmNsdWRlIGFuIGFkZGl0aW9uYWwgdG9wLWxldmVsIGxpc3RlbmVyIGF0IHRoZSBzaGFkb3cgcm9vdCBsZXZlbC5cbiAgICovXG4gIHNjcm9sbGVkKHNoYWRvd1Jvb3Q/OiBEb2N1bWVudE9yU2hhZG93Um9vdCB8IG51bGwpOiBPYnNlcnZhYmxlPEV2ZW50PiB7XG4gICAgY29uc3Qgc3RyZWFtczogT2JzZXJ2YWJsZTxFdmVudD5bXSA9IFt0aGlzLnNjcm9sbF07XG5cbiAgICBpZiAoc2hhZG93Um9vdCAmJiBzaGFkb3dSb290ICE9PSB0aGlzLl9kb2N1bWVudCkge1xuICAgICAgLy8gTm90ZSB0aGF0IHRoaXMgaXMgYmFzaWNhbGx5IHRoZSBzYW1lIGFzIGBmcm9tRXZlbnRgIGZyb20gcnhqcywgYnV0IHdlIGRvIGl0IG91cnNlbHZlcyxcbiAgICAgIC8vIGJlY2F1c2Ugd2Ugd2FudCB0byBndWFyYW50ZWUgdGhhdCB0aGUgZXZlbnQgaXMgYm91bmQgb3V0c2lkZSBvZiB0aGUgYE5nWm9uZWAuIFdpdGhcbiAgICAgIC8vIGBmcm9tRXZlbnRgIGl0J2xsIG9ubHkgaGFwcGVuIGlmIHRoZSBzdWJzY3JpcHRpb24gaXMgb3V0c2lkZSB0aGUgYE5nWm9uZWAuXG4gICAgICBzdHJlYW1zLnB1c2goXG4gICAgICAgIG5ldyBPYnNlcnZhYmxlKChvYnNlcnZlcjogT2JzZXJ2ZXI8RXZlbnQ+KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBldmVudE9wdGlvbnMgPSB0cnVlO1xuICAgICAgICAgICAgY29uc3QgY2FsbGJhY2sgPSAoZXZlbnQ6IEV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLl9hY3RpdmVEcmFnSW5zdGFuY2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIG9ic2VydmVyLm5leHQoZXZlbnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAoc2hhZG93Um9vdCBhcyBTaGFkb3dSb290KS5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBjYWxsYmFjaywgZXZlbnRPcHRpb25zKTtcblxuICAgICAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgICAgKHNoYWRvd1Jvb3QgYXMgU2hhZG93Um9vdCkucmVtb3ZlRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgY2FsbGJhY2ssIGV2ZW50T3B0aW9ucyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1lcmdlKC4uLnN0cmVhbXMpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fZHJhZ0luc3RhbmNlcy5mb3JFYWNoKGluc3RhbmNlID0+IHRoaXMucmVtb3ZlRHJhZ0l0ZW0oaW5zdGFuY2UpKTtcbiAgICB0aGlzLl9kcm9wSW5zdGFuY2VzLmZvckVhY2goaW5zdGFuY2UgPT4gdGhpcy5yZW1vdmVEcm9wQ29udGFpbmVyKGluc3RhbmNlKSk7XG4gICAgdGhpcy5fY2xlYXJHbG9iYWxMaXN0ZW5lcnMoKTtcbiAgICB0aGlzLnBvaW50ZXJNb3ZlLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5wb2ludGVyVXAuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFdmVudCBsaXN0ZW5lciB0aGF0IHdpbGwgcHJldmVudCB0aGUgZGVmYXVsdCBicm93c2VyIGFjdGlvbiB3aGlsZSB0aGUgdXNlciBpcyBkcmFnZ2luZy5cbiAgICogQHBhcmFtIGV2ZW50IEV2ZW50IHdob3NlIGRlZmF1bHQgYWN0aW9uIHNob3VsZCBiZSBwcmV2ZW50ZWQuXG4gICAqL1xuICBwcml2YXRlIF9wcmV2ZW50RGVmYXVsdFdoaWxlRHJhZ2dpbmcgPSAoZXZlbnQ6IEV2ZW50KSA9PiB7XG4gICAgaWYgKHRoaXMuX2FjdGl2ZURyYWdJbnN0YW5jZXMubGVuZ3RoID4gMCkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqIEV2ZW50IGxpc3RlbmVyIGZvciBgdG91Y2htb3ZlYCB0aGF0IGlzIGJvdW5kIGV2ZW4gaWYgbm8gZHJhZ2dpbmcgaXMgaGFwcGVuaW5nLiAqL1xuICBwcml2YXRlIF9wZXJzaXN0ZW50VG91Y2htb3ZlTGlzdGVuZXIgPSAoZXZlbnQ6IFRvdWNoRXZlbnQpID0+IHtcbiAgICBpZiAodGhpcy5fYWN0aXZlRHJhZ0luc3RhbmNlcy5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBOb3RlIHRoYXQgd2Ugb25seSB3YW50IHRvIHByZXZlbnQgdGhlIGRlZmF1bHQgYWN0aW9uIGFmdGVyIGRyYWdnaW5nIGhhcyBhY3R1YWxseSBzdGFydGVkLlxuICAgICAgLy8gVXN1YWxseSB0aGlzIGlzIHRoZSBzYW1lIHRpbWUgYXQgd2hpY2ggdGhlIGl0ZW0gaXMgYWRkZWQgdG8gdGhlIGBfYWN0aXZlRHJhZ0luc3RhbmNlc2AsXG4gICAgICAvLyBidXQgaXQgY291bGQgYmUgcHVzaGVkIGJhY2sgaWYgdGhlIHVzZXIgaGFzIHNldCB1cCBhIGRyYWcgZGVsYXkgb3IgdGhyZXNob2xkLlxuICAgICAgaWYgKHRoaXMuX2FjdGl2ZURyYWdJbnN0YW5jZXMuc29tZSh0aGlzLl9kcmFnZ2luZ1ByZWRpY2F0ZSkpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5wb2ludGVyTW92ZS5uZXh0KGV2ZW50KTtcbiAgICB9XG4gIH07XG5cbiAgLyoqIENsZWFycyBvdXQgdGhlIGdsb2JhbCBldmVudCBsaXN0ZW5lcnMgZnJvbSB0aGUgYGRvY3VtZW50YC4gKi9cbiAgcHJpdmF0ZSBfY2xlYXJHbG9iYWxMaXN0ZW5lcnMoKSB7XG4gICAgdGhpcy5fZ2xvYmFsTGlzdGVuZXJzLmZvckVhY2goKGNvbmZpZywgbmFtZSkgPT4ge1xuICAgICAgdGhpcy5fZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihuYW1lLCBjb25maWcuaGFuZGxlciwgY29uZmlnLm9wdGlvbnMpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5fZ2xvYmFsTGlzdGVuZXJzLmNsZWFyKCk7XG4gIH1cbn1cbiJdfQ==