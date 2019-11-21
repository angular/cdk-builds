/**
 * @fileoverview added by tsickle
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
import * as i3 from "angular_material/src/cdk/drag-drop/drag-drop-registry";
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
export class DragDrop {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1kcm9wLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZHJhZy1kcm9wLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFhLE1BQU0sZUFBZSxDQUFDO0FBQ3JFLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDckQsT0FBTyxFQUFDLE9BQU8sRUFBZ0IsTUFBTSxZQUFZLENBQUM7QUFDbEQsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQzVDLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHNCQUFzQixDQUFDOzs7Ozs7Ozs7TUFHaEQsY0FBYyxHQUFHO0lBQ3JCLGtCQUFrQixFQUFFLENBQUM7SUFDckIsK0JBQStCLEVBQUUsQ0FBQztDQUNuQzs7OztBQU1ELE1BQU0sT0FBTyxRQUFROzs7Ozs7O0lBQ25CLFlBQzRCLFNBQWMsRUFDaEMsT0FBZSxFQUNmLGNBQTZCLEVBQzdCLGlCQUF5RDtRQUh2QyxjQUFTLEdBQVQsU0FBUyxDQUFLO1FBQ2hDLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFDZixtQkFBYyxHQUFkLGNBQWMsQ0FBZTtRQUM3QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQXdDO0lBQUcsQ0FBQzs7Ozs7Ozs7SUFPdkUsVUFBVSxDQUFVLE9BQThDLEVBQ3BELFNBQXdCLGNBQWM7UUFFbEQsT0FBTyxJQUFJLE9BQU8sQ0FBSSxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsY0FBYyxFQUNwRixJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUM5QixDQUFDOzs7Ozs7O0lBTUQsY0FBYyxDQUFVLE9BQThDO1FBQ3BFLE9BQU8sSUFBSSxXQUFXLENBQUksT0FBTyxFQUFFLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQ25GLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUMzQixDQUFDOzs7WUEzQkYsVUFBVSxTQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQzs7Ozs0Q0FHM0IsTUFBTSxTQUFDLFFBQVE7WUFuQlEsTUFBTTtZQUUxQixhQUFhO1lBR2IsZ0JBQWdCOzs7Ozs7OztJQWNwQiw2QkFBd0M7Ozs7O0lBQ3hDLDJCQUF1Qjs7Ozs7SUFDdkIsa0NBQXFDOzs7OztJQUNyQyxxQ0FBaUUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RhYmxlLCBJbmplY3QsIE5nWm9uZSwgRWxlbWVudFJlZn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtWaWV3cG9ydFJ1bGVyfSBmcm9tICdAYW5ndWxhci9jZGsvc2Nyb2xsaW5nJztcbmltcG9ydCB7RHJhZ1JlZiwgRHJhZ1JlZkNvbmZpZ30gZnJvbSAnLi9kcmFnLXJlZic7XG5pbXBvcnQge0Ryb3BMaXN0UmVmfSBmcm9tICcuL2Ryb3AtbGlzdC1yZWYnO1xuaW1wb3J0IHtEcmFnRHJvcFJlZ2lzdHJ5fSBmcm9tICcuL2RyYWctZHJvcC1yZWdpc3RyeSc7XG5cbi8qKiBEZWZhdWx0IGNvbmZpZ3VyYXRpb24gdG8gYmUgdXNlZCB3aGVuIGNyZWF0aW5nIGEgYERyYWdSZWZgLiAqL1xuY29uc3QgREVGQVVMVF9DT05GSUcgPSB7XG4gIGRyYWdTdGFydFRocmVzaG9sZDogNSxcbiAgcG9pbnRlckRpcmVjdGlvbkNoYW5nZVRocmVzaG9sZDogNVxufTtcblxuLyoqXG4gKiBTZXJ2aWNlIHRoYXQgYWxsb3dzIGZvciBkcmFnLWFuZC1kcm9wIGZ1bmN0aW9uYWxpdHkgdG8gYmUgYXR0YWNoZWQgdG8gRE9NIGVsZW1lbnRzLlxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBEcmFnRHJvcCB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIEBJbmplY3QoRE9DVU1FTlQpIHByaXZhdGUgX2RvY3VtZW50OiBhbnksXG4gICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgcHJpdmF0ZSBfdmlld3BvcnRSdWxlcjogVmlld3BvcnRSdWxlcixcbiAgICBwcml2YXRlIF9kcmFnRHJvcFJlZ2lzdHJ5OiBEcmFnRHJvcFJlZ2lzdHJ5PERyYWdSZWYsIERyb3BMaXN0UmVmPikge31cblxuICAvKipcbiAgICogVHVybnMgYW4gZWxlbWVudCBpbnRvIGEgZHJhZ2dhYmxlIGl0ZW0uXG4gICAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgdG8gd2hpY2ggdG8gYXR0YWNoIHRoZSBkcmFnZ2luZyBmdW5jdGlvbmFsaXR5LlxuICAgKiBAcGFyYW0gY29uZmlnIE9iamVjdCB1c2VkIHRvIGNvbmZpZ3VyZSB0aGUgZHJhZ2dpbmcgYmVoYXZpb3IuXG4gICAqL1xuICBjcmVhdGVEcmFnPFQgPSBhbnk+KGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+IHwgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgY29uZmlnOiBEcmFnUmVmQ29uZmlnID0gREVGQVVMVF9DT05GSUcpOiBEcmFnUmVmPFQ+IHtcblxuICAgIHJldHVybiBuZXcgRHJhZ1JlZjxUPihlbGVtZW50LCBjb25maWcsIHRoaXMuX2RvY3VtZW50LCB0aGlzLl9uZ1pvbmUsIHRoaXMuX3ZpZXdwb3J0UnVsZXIsXG4gICAgICAgIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFR1cm5zIGFuIGVsZW1lbnQgaW50byBhIGRyb3AgbGlzdC5cbiAgICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCB0byB3aGljaCB0byBhdHRhY2ggdGhlIGRyb3AgbGlzdCBmdW5jdGlvbmFsaXR5LlxuICAgKi9cbiAgY3JlYXRlRHJvcExpc3Q8VCA9IGFueT4oZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBIVE1MRWxlbWVudCk6IERyb3BMaXN0UmVmPFQ+IHtcbiAgICByZXR1cm4gbmV3IERyb3BMaXN0UmVmPFQ+KGVsZW1lbnQsIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnksIHRoaXMuX2RvY3VtZW50LCB0aGlzLl9uZ1pvbmUsXG4gICAgICAgIHRoaXMuX3ZpZXdwb3J0UnVsZXIpO1xuICB9XG59XG4iXX0=