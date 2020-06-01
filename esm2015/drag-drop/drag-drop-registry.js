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
/** Event options that can be used to bind an active, capturing event. */
const activeCapturingEventOptions = normalizePassiveListenerOptions({
    passive: false,
    capture: true
});
/**
 * Service that keeps track of all the drag item and drop container
 * instances, and manages global event listeners on the `document`.
 * @docs-private
 */
// Note: this class is generic, rather than referencing CdkDrag and CdkDropList directly, in order
// to avoid circular imports. If we were to reference them here, importing the registry into the
// classes that are registering themselves will introduce a circular import.
let DragDropRegistry = /** @class */ (() => {
    class DragDropRegistry {
        constructor(_ngZone, _document) {
            this._ngZone = _ngZone;
            /** Registered drop container instances. */
            this._dropInstances = new Set();
            /** Registered drag item instances. */
            this._dragInstances = new Set();
            /** Drag item instances that are currently being dragged. */
            this._activeDragInstances = new Set();
            /** Keeps track of the event listeners that we've bound to the `document`. */
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
            /** Emits when the viewport has been scrolled while the user is dragging an item. */
            this.scroll = new Subject();
            /**
             * Event listener that will prevent the default browser action while the user is dragging.
             * @param event Event whose default action should be prevented.
             */
            this._preventDefaultWhileDragging = (event) => {
                if (this._activeDragInstances.size) {
                    event.preventDefault();
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
                    this._document.addEventListener('touchmove', this._preventDefaultWhileDragging, activeCapturingEventOptions);
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
                this._document.removeEventListener('touchmove', this._preventDefaultWhileDragging, activeCapturingEventOptions);
            }
        }
        /**
         * Starts the dragging sequence for a drag instance.
         * @param drag Drag instance which is being dragged.
         * @param event Event that initiated the dragging.
         */
        startDragging(drag, event) {
            // Do not process the same drag twice to avoid memory leaks and redundant listeners
            if (this._activeDragInstances.has(drag)) {
                return;
            }
            this._activeDragInstances.add(drag);
            if (this._activeDragInstances.size === 1) {
                const isTouchEvent = event.type.startsWith('touch');
                const moveEvent = isTouchEvent ? 'touchmove' : 'mousemove';
                const upEvent = isTouchEvent ? 'touchend' : 'mouseup';
                // We explicitly bind __active__ listeners here, because newer browsers will default to
                // passive ones for `mousemove` and `touchmove`. The events need to be active, because we
                // use `preventDefault` to prevent the page from scrolling while the user is dragging.
                this._globalListeners
                    .set(moveEvent, {
                    handler: (e) => this.pointerMove.next(e),
                    options: activeCapturingEventOptions
                })
                    .set(upEvent, {
                    handler: (e) => this.pointerUp.next(e),
                    options: true
                })
                    .set('scroll', {
                    handler: (e) => this.scroll.next(e),
                    // Use capturing so that we pick up scroll changes in any scrollable nodes that aren't
                    // the document. See https://github.com/angular/components/issues/17144.
                    options: true
                })
                    // Preventing the default action on `mousemove` isn't enough to disable text selection
                    // on Safari so we need to prevent the selection event as well. Alternatively this can
                    // be done by setting `user-select: none` on the `body`, however it has causes a style
                    // recalculation which can be expensive on pages with a lot of elements.
                    .set('selectstart', {
                    handler: this._preventDefaultWhileDragging,
                    options: activeCapturingEventOptions
                });
                this._ngZone.runOutsideAngular(() => {
                    this._globalListeners.forEach((config, name) => {
                        this._document.addEventListener(name, config.handler, config.options);
                    });
                });
            }
        }
        /** Stops dragging a drag item instance. */
        stopDragging(drag) {
            this._activeDragInstances.delete(drag);
            if (this._activeDragInstances.size === 0) {
                this._clearGlobalListeners();
            }
        }
        /** Gets whether a drag item instance is currently being dragged. */
        isDragging(drag) {
            return this._activeDragInstances.has(drag);
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
    }
    DragDropRegistry.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    /** @nocollapse */
    DragDropRegistry.ctorParameters = () => [
        { type: NgZone },
        { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] }
    ];
    DragDropRegistry.ɵprov = i0.ɵɵdefineInjectable({ factory: function DragDropRegistry_Factory() { return new DragDropRegistry(i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i1.DOCUMENT)); }, token: DragDropRegistry, providedIn: "root" });
    return DragDropRegistry;
})();
export { DragDropRegistry };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1kcm9wLXJlZ2lzdHJ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZHJhZy1kcm9wLXJlZ2lzdHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFhLE1BQU0sRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNwRSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUFDLCtCQUErQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdEUsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQzs7O0FBRTdCLHlFQUF5RTtBQUN6RSxNQUFNLDJCQUEyQixHQUFHLCtCQUErQixDQUFDO0lBQ2xFLE9BQU8sRUFBRSxLQUFLO0lBQ2QsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDLENBQUM7QUFFSDs7OztHQUlHO0FBQ0gsa0dBQWtHO0FBQ2xHLGdHQUFnRztBQUNoRyw0RUFBNEU7QUFDNUU7SUFBQSxNQUNhLGdCQUFnQjtRQWlDM0IsWUFDVSxPQUFlLEVBQ0wsU0FBYztZQUR4QixZQUFPLEdBQVAsT0FBTyxDQUFRO1lBL0J6QiwyQ0FBMkM7WUFDbkMsbUJBQWMsR0FBRyxJQUFJLEdBQUcsRUFBSyxDQUFDO1lBRXRDLHNDQUFzQztZQUM5QixtQkFBYyxHQUFHLElBQUksR0FBRyxFQUFLLENBQUM7WUFFdEMsNERBQTREO1lBQ3BELHlCQUFvQixHQUFHLElBQUksR0FBRyxFQUFLLENBQUM7WUFFNUMsNkVBQTZFO1lBQ3JFLHFCQUFnQixHQUFHLElBQUksR0FBRyxFQUc5QixDQUFDO1lBRUw7OztlQUdHO1lBQ00sZ0JBQVcsR0FBcUMsSUFBSSxPQUFPLEVBQTJCLENBQUM7WUFFaEc7OztlQUdHO1lBQ00sY0FBUyxHQUFxQyxJQUFJLE9BQU8sRUFBMkIsQ0FBQztZQUU5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R29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RhYmxlLCBOZ1pvbmUsIE9uRGVzdHJveSwgSW5qZWN0fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge25vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnN9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge1N1YmplY3R9IGZyb20gJ3J4anMnO1xuXG4vKiogRXZlbnQgb3B0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIHRvIGJpbmQgYW4gYWN0aXZlLCBjYXB0dXJpbmcgZXZlbnQuICovXG5jb25zdCBhY3RpdmVDYXB0dXJpbmdFdmVudE9wdGlvbnMgPSBub3JtYWxpemVQYXNzaXZlTGlzdGVuZXJPcHRpb25zKHtcbiAgcGFzc2l2ZTogZmFsc2UsXG4gIGNhcHR1cmU6IHRydWVcbn0pO1xuXG4vKipcbiAqIFNlcnZpY2UgdGhhdCBrZWVwcyB0cmFjayBvZiBhbGwgdGhlIGRyYWcgaXRlbSBhbmQgZHJvcCBjb250YWluZXJcbiAqIGluc3RhbmNlcywgYW5kIG1hbmFnZXMgZ2xvYmFsIGV2ZW50IGxpc3RlbmVycyBvbiB0aGUgYGRvY3VtZW50YC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuLy8gTm90ZTogdGhpcyBjbGFzcyBpcyBnZW5lcmljLCByYXRoZXIgdGhhbiByZWZlcmVuY2luZyBDZGtEcmFnIGFuZCBDZGtEcm9wTGlzdCBkaXJlY3RseSwgaW4gb3JkZXJcbi8vIHRvIGF2b2lkIGNpcmN1bGFyIGltcG9ydHMuIElmIHdlIHdlcmUgdG8gcmVmZXJlbmNlIHRoZW0gaGVyZSwgaW1wb3J0aW5nIHRoZSByZWdpc3RyeSBpbnRvIHRoZVxuLy8gY2xhc3NlcyB0aGF0IGFyZSByZWdpc3RlcmluZyB0aGVtc2VsdmVzIHdpbGwgaW50cm9kdWNlIGEgY2lyY3VsYXIgaW1wb3J0LlxuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgRHJhZ0Ryb3BSZWdpc3RyeTxJLCBDPiBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIHByaXZhdGUgX2RvY3VtZW50OiBEb2N1bWVudDtcblxuICAvKiogUmVnaXN0ZXJlZCBkcm9wIGNvbnRhaW5lciBpbnN0YW5jZXMuICovXG4gIHByaXZhdGUgX2Ryb3BJbnN0YW5jZXMgPSBuZXcgU2V0PEM+KCk7XG5cbiAgLyoqIFJlZ2lzdGVyZWQgZHJhZyBpdGVtIGluc3RhbmNlcy4gKi9cbiAgcHJpdmF0ZSBfZHJhZ0luc3RhbmNlcyA9IG5ldyBTZXQ8ST4oKTtcblxuICAvKiogRHJhZyBpdGVtIGluc3RhbmNlcyB0aGF0IGFyZSBjdXJyZW50bHkgYmVpbmcgZHJhZ2dlZC4gKi9cbiAgcHJpdmF0ZSBfYWN0aXZlRHJhZ0luc3RhbmNlcyA9IG5ldyBTZXQ8ST4oKTtcblxuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIGV2ZW50IGxpc3RlbmVycyB0aGF0IHdlJ3ZlIGJvdW5kIHRvIHRoZSBgZG9jdW1lbnRgLiAqL1xuICBwcml2YXRlIF9nbG9iYWxMaXN0ZW5lcnMgPSBuZXcgTWFwPHN0cmluZywge1xuICAgIGhhbmRsZXI6IChldmVudDogRXZlbnQpID0+IHZvaWQsXG4gICAgb3B0aW9ucz86IEFkZEV2ZW50TGlzdGVuZXJPcHRpb25zIHwgYm9vbGVhblxuICB9PigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB0aGUgYHRvdWNobW92ZWAgb3IgYG1vdXNlbW92ZWAgZXZlbnRzIHRoYXQgYXJlIGRpc3BhdGNoZWRcbiAgICogd2hpbGUgdGhlIHVzZXIgaXMgZHJhZ2dpbmcgYSBkcmFnIGl0ZW0gaW5zdGFuY2UuXG4gICAqL1xuICByZWFkb25seSBwb2ludGVyTW92ZTogU3ViamVjdDxUb3VjaEV2ZW50IHwgTW91c2VFdmVudD4gPSBuZXcgU3ViamVjdDxUb3VjaEV2ZW50IHwgTW91c2VFdmVudD4oKTtcblxuICAvKipcbiAgICogRW1pdHMgdGhlIGB0b3VjaGVuZGAgb3IgYG1vdXNldXBgIGV2ZW50cyB0aGF0IGFyZSBkaXNwYXRjaGVkXG4gICAqIHdoaWxlIHRoZSB1c2VyIGlzIGRyYWdnaW5nIGEgZHJhZyBpdGVtIGluc3RhbmNlLlxuICAgKi9cbiAgcmVhZG9ubHkgcG9pbnRlclVwOiBTdWJqZWN0PFRvdWNoRXZlbnQgfCBNb3VzZUV2ZW50PiA9IG5ldyBTdWJqZWN0PFRvdWNoRXZlbnQgfCBNb3VzZUV2ZW50PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSB2aWV3cG9ydCBoYXMgYmVlbiBzY3JvbGxlZCB3aGlsZSB0aGUgdXNlciBpcyBkcmFnZ2luZyBhbiBpdGVtLiAqL1xuICByZWFkb25seSBzY3JvbGw6IFN1YmplY3Q8RXZlbnQ+ID0gbmV3IFN1YmplY3Q8RXZlbnQ+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgQEluamVjdChET0NVTUVOVCkgX2RvY3VtZW50OiBhbnkpIHtcbiAgICB0aGlzLl9kb2N1bWVudCA9IF9kb2N1bWVudDtcbiAgfVxuXG4gIC8qKiBBZGRzIGEgZHJvcCBjb250YWluZXIgdG8gdGhlIHJlZ2lzdHJ5LiAqL1xuICByZWdpc3RlckRyb3BDb250YWluZXIoZHJvcDogQykge1xuICAgIGlmICghdGhpcy5fZHJvcEluc3RhbmNlcy5oYXMoZHJvcCkpIHtcbiAgICAgIHRoaXMuX2Ryb3BJbnN0YW5jZXMuYWRkKGRyb3ApO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBBZGRzIGEgZHJhZyBpdGVtIGluc3RhbmNlIHRvIHRoZSByZWdpc3RyeS4gKi9cbiAgcmVnaXN0ZXJEcmFnSXRlbShkcmFnOiBJKSB7XG4gICAgdGhpcy5fZHJhZ0luc3RhbmNlcy5hZGQoZHJhZyk7XG5cbiAgICAvLyBUaGUgYHRvdWNobW92ZWAgZXZlbnQgZ2V0cyBib3VuZCBvbmNlLCBhaGVhZCBvZiB0aW1lLCBiZWNhdXNlIFdlYktpdFxuICAgIC8vIHdvbid0IHByZXZlbnREZWZhdWx0IG9uIGEgZHluYW1pY2FsbHktYWRkZWQgYHRvdWNobW92ZWAgbGlzdGVuZXIuXG4gICAgLy8gU2VlIGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD0xODQyNTAuXG4gICAgaWYgKHRoaXMuX2RyYWdJbnN0YW5jZXMuc2l6ZSA9PT0gMSkge1xuICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgLy8gVGhlIGV2ZW50IGhhbmRsZXIgaGFzIHRvIGJlIGV4cGxpY2l0bHkgYWN0aXZlLFxuICAgICAgICAvLyBiZWNhdXNlIG5ld2VyIGJyb3dzZXJzIG1ha2UgaXQgcGFzc2l2ZSBieSBkZWZhdWx0LlxuICAgICAgICB0aGlzLl9kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLl9wcmV2ZW50RGVmYXVsdFdoaWxlRHJhZ2dpbmcsXG4gICAgICAgICAgICBhY3RpdmVDYXB0dXJpbmdFdmVudE9wdGlvbnMpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFJlbW92ZXMgYSBkcm9wIGNvbnRhaW5lciBmcm9tIHRoZSByZWdpc3RyeS4gKi9cbiAgcmVtb3ZlRHJvcENvbnRhaW5lcihkcm9wOiBDKSB7XG4gICAgdGhpcy5fZHJvcEluc3RhbmNlcy5kZWxldGUoZHJvcCk7XG4gIH1cblxuICAvKiogUmVtb3ZlcyBhIGRyYWcgaXRlbSBpbnN0YW5jZSBmcm9tIHRoZSByZWdpc3RyeS4gKi9cbiAgcmVtb3ZlRHJhZ0l0ZW0oZHJhZzogSSkge1xuICAgIHRoaXMuX2RyYWdJbnN0YW5jZXMuZGVsZXRlKGRyYWcpO1xuICAgIHRoaXMuc3RvcERyYWdnaW5nKGRyYWcpO1xuXG4gICAgaWYgKHRoaXMuX2RyYWdJbnN0YW5jZXMuc2l6ZSA9PT0gMCkge1xuICAgICAgdGhpcy5fZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5fcHJldmVudERlZmF1bHRXaGlsZURyYWdnaW5nLFxuICAgICAgICAgIGFjdGl2ZUNhcHR1cmluZ0V2ZW50T3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFN0YXJ0cyB0aGUgZHJhZ2dpbmcgc2VxdWVuY2UgZm9yIGEgZHJhZyBpbnN0YW5jZS5cbiAgICogQHBhcmFtIGRyYWcgRHJhZyBpbnN0YW5jZSB3aGljaCBpcyBiZWluZyBkcmFnZ2VkLlxuICAgKiBAcGFyYW0gZXZlbnQgRXZlbnQgdGhhdCBpbml0aWF0ZWQgdGhlIGRyYWdnaW5nLlxuICAgKi9cbiAgc3RhcnREcmFnZ2luZyhkcmFnOiBJLCBldmVudDogVG91Y2hFdmVudCB8IE1vdXNlRXZlbnQpIHtcbiAgICAvLyBEbyBub3QgcHJvY2VzcyB0aGUgc2FtZSBkcmFnIHR3aWNlIHRvIGF2b2lkIG1lbW9yeSBsZWFrcyBhbmQgcmVkdW5kYW50IGxpc3RlbmVyc1xuICAgIGlmICh0aGlzLl9hY3RpdmVEcmFnSW5zdGFuY2VzLmhhcyhkcmFnKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX2FjdGl2ZURyYWdJbnN0YW5jZXMuYWRkKGRyYWcpO1xuXG4gICAgaWYgKHRoaXMuX2FjdGl2ZURyYWdJbnN0YW5jZXMuc2l6ZSA9PT0gMSkge1xuICAgICAgY29uc3QgaXNUb3VjaEV2ZW50ID0gZXZlbnQudHlwZS5zdGFydHNXaXRoKCd0b3VjaCcpO1xuICAgICAgY29uc3QgbW92ZUV2ZW50ID0gaXNUb3VjaEV2ZW50ID8gJ3RvdWNobW92ZScgOiAnbW91c2Vtb3ZlJztcbiAgICAgIGNvbnN0IHVwRXZlbnQgPSBpc1RvdWNoRXZlbnQgPyAndG91Y2hlbmQnIDogJ21vdXNldXAnO1xuXG4gICAgICAvLyBXZSBleHBsaWNpdGx5IGJpbmQgX19hY3RpdmVfXyBsaXN0ZW5lcnMgaGVyZSwgYmVjYXVzZSBuZXdlciBicm93c2VycyB3aWxsIGRlZmF1bHQgdG9cbiAgICAgIC8vIHBhc3NpdmUgb25lcyBmb3IgYG1vdXNlbW92ZWAgYW5kIGB0b3VjaG1vdmVgLiBUaGUgZXZlbnRzIG5lZWQgdG8gYmUgYWN0aXZlLCBiZWNhdXNlIHdlXG4gICAgICAvLyB1c2UgYHByZXZlbnREZWZhdWx0YCB0byBwcmV2ZW50IHRoZSBwYWdlIGZyb20gc2Nyb2xsaW5nIHdoaWxlIHRoZSB1c2VyIGlzIGRyYWdnaW5nLlxuICAgICAgdGhpcy5fZ2xvYmFsTGlzdGVuZXJzXG4gICAgICAgIC5zZXQobW92ZUV2ZW50LCB7XG4gICAgICAgICAgaGFuZGxlcjogKGU6IEV2ZW50KSA9PiB0aGlzLnBvaW50ZXJNb3ZlLm5leHQoZSBhcyBUb3VjaEV2ZW50IHwgTW91c2VFdmVudCksXG4gICAgICAgICAgb3B0aW9uczogYWN0aXZlQ2FwdHVyaW5nRXZlbnRPcHRpb25zXG4gICAgICAgIH0pXG4gICAgICAgIC5zZXQodXBFdmVudCwge1xuICAgICAgICAgIGhhbmRsZXI6IChlOiBFdmVudCkgPT4gdGhpcy5wb2ludGVyVXAubmV4dChlIGFzIFRvdWNoRXZlbnQgfCBNb3VzZUV2ZW50KSxcbiAgICAgICAgICBvcHRpb25zOiB0cnVlXG4gICAgICAgIH0pXG4gICAgICAgIC5zZXQoJ3Njcm9sbCcsIHtcbiAgICAgICAgICBoYW5kbGVyOiAoZTogRXZlbnQpID0+IHRoaXMuc2Nyb2xsLm5leHQoZSksXG4gICAgICAgICAgLy8gVXNlIGNhcHR1cmluZyBzbyB0aGF0IHdlIHBpY2sgdXAgc2Nyb2xsIGNoYW5nZXMgaW4gYW55IHNjcm9sbGFibGUgbm9kZXMgdGhhdCBhcmVuJ3RcbiAgICAgICAgICAvLyB0aGUgZG9jdW1lbnQuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9jb21wb25lbnRzL2lzc3Vlcy8xNzE0NC5cbiAgICAgICAgICBvcHRpb25zOiB0cnVlXG4gICAgICAgIH0pXG4gICAgICAgIC8vIFByZXZlbnRpbmcgdGhlIGRlZmF1bHQgYWN0aW9uIG9uIGBtb3VzZW1vdmVgIGlzbid0IGVub3VnaCB0byBkaXNhYmxlIHRleHQgc2VsZWN0aW9uXG4gICAgICAgIC8vIG9uIFNhZmFyaSBzbyB3ZSBuZWVkIHRvIHByZXZlbnQgdGhlIHNlbGVjdGlvbiBldmVudCBhcyB3ZWxsLiBBbHRlcm5hdGl2ZWx5IHRoaXMgY2FuXG4gICAgICAgIC8vIGJlIGRvbmUgYnkgc2V0dGluZyBgdXNlci1zZWxlY3Q6IG5vbmVgIG9uIHRoZSBgYm9keWAsIGhvd2V2ZXIgaXQgaGFzIGNhdXNlcyBhIHN0eWxlXG4gICAgICAgIC8vIHJlY2FsY3VsYXRpb24gd2hpY2ggY2FuIGJlIGV4cGVuc2l2ZSBvbiBwYWdlcyB3aXRoIGEgbG90IG9mIGVsZW1lbnRzLlxuICAgICAgICAuc2V0KCdzZWxlY3RzdGFydCcsIHtcbiAgICAgICAgICBoYW5kbGVyOiB0aGlzLl9wcmV2ZW50RGVmYXVsdFdoaWxlRHJhZ2dpbmcsXG4gICAgICAgICAgb3B0aW9uczogYWN0aXZlQ2FwdHVyaW5nRXZlbnRPcHRpb25zXG4gICAgICAgIH0pO1xuXG4gICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICB0aGlzLl9nbG9iYWxMaXN0ZW5lcnMuZm9yRWFjaCgoY29uZmlnLCBuYW1lKSA9PiB7XG4gICAgICAgICAgdGhpcy5fZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBjb25maWcuaGFuZGxlciwgY29uZmlnLm9wdGlvbnMpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTdG9wcyBkcmFnZ2luZyBhIGRyYWcgaXRlbSBpbnN0YW5jZS4gKi9cbiAgc3RvcERyYWdnaW5nKGRyYWc6IEkpIHtcbiAgICB0aGlzLl9hY3RpdmVEcmFnSW5zdGFuY2VzLmRlbGV0ZShkcmFnKTtcblxuICAgIGlmICh0aGlzLl9hY3RpdmVEcmFnSW5zdGFuY2VzLnNpemUgPT09IDApIHtcbiAgICAgIHRoaXMuX2NsZWFyR2xvYmFsTGlzdGVuZXJzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEdldHMgd2hldGhlciBhIGRyYWcgaXRlbSBpbnN0YW5jZSBpcyBjdXJyZW50bHkgYmVpbmcgZHJhZ2dlZC4gKi9cbiAgaXNEcmFnZ2luZyhkcmFnOiBJKSB7XG4gICAgcmV0dXJuIHRoaXMuX2FjdGl2ZURyYWdJbnN0YW5jZXMuaGFzKGRyYWcpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fZHJhZ0luc3RhbmNlcy5mb3JFYWNoKGluc3RhbmNlID0+IHRoaXMucmVtb3ZlRHJhZ0l0ZW0oaW5zdGFuY2UpKTtcbiAgICB0aGlzLl9kcm9wSW5zdGFuY2VzLmZvckVhY2goaW5zdGFuY2UgPT4gdGhpcy5yZW1vdmVEcm9wQ29udGFpbmVyKGluc3RhbmNlKSk7XG4gICAgdGhpcy5fY2xlYXJHbG9iYWxMaXN0ZW5lcnMoKTtcbiAgICB0aGlzLnBvaW50ZXJNb3ZlLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5wb2ludGVyVXAuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFdmVudCBsaXN0ZW5lciB0aGF0IHdpbGwgcHJldmVudCB0aGUgZGVmYXVsdCBicm93c2VyIGFjdGlvbiB3aGlsZSB0aGUgdXNlciBpcyBkcmFnZ2luZy5cbiAgICogQHBhcmFtIGV2ZW50IEV2ZW50IHdob3NlIGRlZmF1bHQgYWN0aW9uIHNob3VsZCBiZSBwcmV2ZW50ZWQuXG4gICAqL1xuICBwcml2YXRlIF9wcmV2ZW50RGVmYXVsdFdoaWxlRHJhZ2dpbmcgPSAoZXZlbnQ6IEV2ZW50KSA9PiB7XG4gICAgaWYgKHRoaXMuX2FjdGl2ZURyYWdJbnN0YW5jZXMuc2l6ZSkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG4gIH1cblxuICAvKiogQ2xlYXJzIG91dCB0aGUgZ2xvYmFsIGV2ZW50IGxpc3RlbmVycyBmcm9tIHRoZSBgZG9jdW1lbnRgLiAqL1xuICBwcml2YXRlIF9jbGVhckdsb2JhbExpc3RlbmVycygpIHtcbiAgICB0aGlzLl9nbG9iYWxMaXN0ZW5lcnMuZm9yRWFjaCgoY29uZmlnLCBuYW1lKSA9PiB7XG4gICAgICB0aGlzLl9kb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKG5hbWUsIGNvbmZpZy5oYW5kbGVyLCBjb25maWcub3B0aW9ucyk7XG4gICAgfSk7XG5cbiAgICB0aGlzLl9nbG9iYWxMaXN0ZW5lcnMuY2xlYXIoKTtcbiAgfVxufVxuIl19