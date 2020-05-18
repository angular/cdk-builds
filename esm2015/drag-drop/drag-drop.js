/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/drag-drop/drag-drop.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable, Inject, NgZone } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ViewportRuler } from '@angular/cdk/scrolling';
import { DragRef } from './drag-ref';
import { DropListRef } from './drop-list-ref';
import { DragDropRegistry } from './drag-drop-registry';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
import * as i2 from "@angular/cdk/scrolling";
import * as i3 from "./drag-drop-registry";
/**
 * Default configuration to be used when creating a `DragRef`.
 * @type {?}
 */
const DEFAULT_CONFIG = {
    dragStartThreshold: 5,
    pointerDirectionChangeThreshold: 5
};
/**
 * Service that allows for drag-and-drop functionality to be attached to DOM elements.
 */
let DragDrop = /** @class */ (() => {
    /**
     * Service that allows for drag-and-drop functionality to be attached to DOM elements.
     */
    class DragDrop {
        /**
         * @param {?} _document
         * @param {?} _ngZone
         * @param {?} _viewportRuler
         * @param {?} _dragDropRegistry
         */
        constructor(_document, _ngZone, _viewportRuler, _dragDropRegistry) {
            this._document = _document;
            this._ngZone = _ngZone;
            this._viewportRuler = _viewportRuler;
            this._dragDropRegistry = _dragDropRegistry;
        }
        /**
         * Turns an element into a draggable item.
         * @template T
         * @param {?} element Element to which to attach the dragging functionality.
         * @param {?=} config Object used to configure the dragging behavior.
         * @return {?}
         */
        createDrag(element, config = DEFAULT_CONFIG) {
            return new DragRef(element, config, this._document, this._ngZone, this._viewportRuler, this._dragDropRegistry);
        }
        /**
         * Turns an element into a drop list.
         * @template T
         * @param {?} element Element to which to attach the drop list functionality.
         * @return {?}
         */
        createDropList(element) {
            return new DropListRef(element, this._dragDropRegistry, this._document, this._ngZone, this._viewportRuler);
        }
    }
    DragDrop.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    /** @nocollapse */
    DragDrop.ctorParameters = () => [
        { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] },
        { type: NgZone },
        { type: ViewportRuler },
        { type: DragDropRegistry }
    ];
    /** @nocollapse */ DragDrop.ɵprov = i0.ɵɵdefineInjectable({ factory: function DragDrop_Factory() { return new DragDrop(i0.ɵɵinject(i1.DOCUMENT), i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i2.ViewportRuler), i0.ɵɵinject(i3.DragDropRegistry)); }, token: DragDrop, providedIn: "root" });
    return DragDrop;
})();
export { DragDrop };
if (false) {
    /**
     * @type {?}
     * @private
     */
    DragDrop.prototype._document;
    /**
     * @type {?}
     * @private
     */
    DragDrop.prototype._ngZone;
    /**
     * @type {?}
     * @private
     */
    DragDrop.prototype._viewportRuler;
    /**
     * @type {?}
     * @private
     */
    DragDrop.prototype._dragDropRegistry;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1kcm9wLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZHJhZy1kcm9wLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBYSxNQUFNLGVBQWUsQ0FBQztBQUNyRSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3JELE9BQU8sRUFBQyxPQUFPLEVBQWdCLE1BQU0sWUFBWSxDQUFDO0FBQ2xELE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUM1QyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQzs7Ozs7Ozs7O01BR2hELGNBQWMsR0FBRztJQUNyQixrQkFBa0IsRUFBRSxDQUFDO0lBQ3JCLCtCQUErQixFQUFFLENBQUM7Q0FDbkM7Ozs7QUFLRDs7OztJQUFBLE1BQ2EsUUFBUTs7Ozs7OztRQUNuQixZQUM0QixTQUFjLEVBQ2hDLE9BQWUsRUFDZixjQUE2QixFQUM3QixpQkFBeUQ7WUFIdkMsY0FBUyxHQUFULFNBQVMsQ0FBSztZQUNoQyxZQUFPLEdBQVAsT0FBTyxDQUFRO1lBQ2YsbUJBQWMsR0FBZCxjQUFjLENBQWU7WUFDN0Isc0JBQWlCLEdBQWpCLGlCQUFpQixDQUF3QztRQUFHLENBQUM7Ozs7Ozs7O1FBT3ZFLFVBQVUsQ0FBVSxPQUE4QyxFQUNwRCxTQUF3QixjQUFjO1lBRWxELE9BQU8sSUFBSSxPQUFPLENBQUksT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFDcEYsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDOUIsQ0FBQzs7Ozs7OztRQU1ELGNBQWMsQ0FBVSxPQUE4QztZQUNwRSxPQUFPLElBQUksV0FBVyxDQUFJLE9BQU8sRUFBRSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUNuRixJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDM0IsQ0FBQzs7O2dCQTNCRixVQUFVLFNBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzs7O2dEQUczQixNQUFNLFNBQUMsUUFBUTtnQkFuQlEsTUFBTTtnQkFFMUIsYUFBYTtnQkFHYixnQkFBZ0I7OzttQkFieEI7S0FvREM7U0EzQlksUUFBUTs7Ozs7O0lBRWpCLDZCQUF3Qzs7Ozs7SUFDeEMsMkJBQXVCOzs7OztJQUN2QixrQ0FBcUM7Ozs7O0lBQ3JDLHFDQUFpRSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGFibGUsIEluamVjdCwgTmdab25lLCBFbGVtZW50UmVmfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge1ZpZXdwb3J0UnVsZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9zY3JvbGxpbmcnO1xuaW1wb3J0IHtEcmFnUmVmLCBEcmFnUmVmQ29uZmlnfSBmcm9tICcuL2RyYWctcmVmJztcbmltcG9ydCB7RHJvcExpc3RSZWZ9IGZyb20gJy4vZHJvcC1saXN0LXJlZic7XG5pbXBvcnQge0RyYWdEcm9wUmVnaXN0cnl9IGZyb20gJy4vZHJhZy1kcm9wLXJlZ2lzdHJ5JztcblxuLyoqIERlZmF1bHQgY29uZmlndXJhdGlvbiB0byBiZSB1c2VkIHdoZW4gY3JlYXRpbmcgYSBgRHJhZ1JlZmAuICovXG5jb25zdCBERUZBVUxUX0NPTkZJRyA9IHtcbiAgZHJhZ1N0YXJ0VGhyZXNob2xkOiA1LFxuICBwb2ludGVyRGlyZWN0aW9uQ2hhbmdlVGhyZXNob2xkOiA1XG59O1xuXG4vKipcbiAqIFNlcnZpY2UgdGhhdCBhbGxvd3MgZm9yIGRyYWctYW5kLWRyb3AgZnVuY3Rpb25hbGl0eSB0byBiZSBhdHRhY2hlZCB0byBET00gZWxlbWVudHMuXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIERyYWdEcm9wIHtcbiAgY29uc3RydWN0b3IoXG4gICAgQEluamVjdChET0NVTUVOVCkgcHJpdmF0ZSBfZG9jdW1lbnQ6IGFueSxcbiAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICBwcml2YXRlIF92aWV3cG9ydFJ1bGVyOiBWaWV3cG9ydFJ1bGVyLFxuICAgIHByaXZhdGUgX2RyYWdEcm9wUmVnaXN0cnk6IERyYWdEcm9wUmVnaXN0cnk8RHJhZ1JlZiwgRHJvcExpc3RSZWY+KSB7fVxuXG4gIC8qKlxuICAgKiBUdXJucyBhbiBlbGVtZW50IGludG8gYSBkcmFnZ2FibGUgaXRlbS5cbiAgICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCB0byB3aGljaCB0byBhdHRhY2ggdGhlIGRyYWdnaW5nIGZ1bmN0aW9uYWxpdHkuXG4gICAqIEBwYXJhbSBjb25maWcgT2JqZWN0IHVzZWQgdG8gY29uZmlndXJlIHRoZSBkcmFnZ2luZyBiZWhhdmlvci5cbiAgICovXG4gIGNyZWF0ZURyYWc8VCA9IGFueT4oZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgICAgICBjb25maWc6IERyYWdSZWZDb25maWcgPSBERUZBVUxUX0NPTkZJRyk6IERyYWdSZWY8VD4ge1xuXG4gICAgcmV0dXJuIG5ldyBEcmFnUmVmPFQ+KGVsZW1lbnQsIGNvbmZpZywgdGhpcy5fZG9jdW1lbnQsIHRoaXMuX25nWm9uZSwgdGhpcy5fdmlld3BvcnRSdWxlcixcbiAgICAgICAgdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeSk7XG4gIH1cblxuICAvKipcbiAgICogVHVybnMgYW4gZWxlbWVudCBpbnRvIGEgZHJvcCBsaXN0LlxuICAgKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IHRvIHdoaWNoIHRvIGF0dGFjaCB0aGUgZHJvcCBsaXN0IGZ1bmN0aW9uYWxpdHkuXG4gICAqL1xuICBjcmVhdGVEcm9wTGlzdDxUID0gYW55PihlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiB8IEhUTUxFbGVtZW50KTogRHJvcExpc3RSZWY8VD4ge1xuICAgIHJldHVybiBuZXcgRHJvcExpc3RSZWY8VD4oZWxlbWVudCwgdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeSwgdGhpcy5fZG9jdW1lbnQsIHRoaXMuX25nWm9uZSxcbiAgICAgICAgdGhpcy5fdmlld3BvcnRSdWxlcik7XG4gIH1cbn1cbiJdfQ==