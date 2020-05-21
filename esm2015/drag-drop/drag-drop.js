import { __decorate, __metadata, __param } from "tslib";
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
/** Default configuration to be used when creating a `DragRef`. */
const DEFAULT_CONFIG = {
    dragStartThreshold: 5,
    pointerDirectionChangeThreshold: 5
};
/**
 * Service that allows for drag-and-drop functionality to be attached to DOM elements.
 */
let DragDrop = /** @class */ (() => {
    let DragDrop = class DragDrop {
        constructor(_document, _ngZone, _viewportRuler, _dragDropRegistry) {
            this._document = _document;
            this._ngZone = _ngZone;
            this._viewportRuler = _viewportRuler;
            this._dragDropRegistry = _dragDropRegistry;
        }
        /**
         * Turns an element into a draggable item.
         * @param element Element to which to attach the dragging functionality.
         * @param config Object used to configure the dragging behavior.
         */
        createDrag(element, config = DEFAULT_CONFIG) {
            return new DragRef(element, config, this._document, this._ngZone, this._viewportRuler, this._dragDropRegistry);
        }
        /**
         * Turns an element into a drop list.
         * @param element Element to which to attach the drop list functionality.
         */
        createDropList(element) {
            return new DropListRef(element, this._dragDropRegistry, this._document, this._ngZone, this._viewportRuler);
        }
    };
    DragDrop.ɵprov = i0.ɵɵdefineInjectable({ factory: function DragDrop_Factory() { return new DragDrop(i0.ɵɵinject(i1.DOCUMENT), i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i2.ViewportRuler), i0.ɵɵinject(i3.DragDropRegistry)); }, token: DragDrop, providedIn: "root" });
    DragDrop = __decorate([
        Injectable({ providedIn: 'root' }),
        __param(0, Inject(DOCUMENT)),
        __metadata("design:paramtypes", [Object, NgZone,
            ViewportRuler,
            DragDropRegistry])
    ], DragDrop);
    return DragDrop;
})();
export { DragDrop };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1kcm9wLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZHJhZy1kcm9wLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQWEsTUFBTSxlQUFlLENBQUM7QUFDckUsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNyRCxPQUFPLEVBQUMsT0FBTyxFQUFnQixNQUFNLFlBQVksQ0FBQztBQUNsRCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDNUMsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7Ozs7O0FBRXRELGtFQUFrRTtBQUNsRSxNQUFNLGNBQWMsR0FBRztJQUNyQixrQkFBa0IsRUFBRSxDQUFDO0lBQ3JCLCtCQUErQixFQUFFLENBQUM7Q0FDbkMsQ0FBQztBQUVGOztHQUVHO0FBRUg7SUFBQSxJQUFhLFFBQVEsR0FBckIsTUFBYSxRQUFRO1FBQ25CLFlBQzRCLFNBQWMsRUFDaEMsT0FBZSxFQUNmLGNBQTZCLEVBQzdCLGlCQUF5RDtZQUh2QyxjQUFTLEdBQVQsU0FBUyxDQUFLO1lBQ2hDLFlBQU8sR0FBUCxPQUFPLENBQVE7WUFDZixtQkFBYyxHQUFkLGNBQWMsQ0FBZTtZQUM3QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQXdDO1FBQUcsQ0FBQztRQUV2RTs7OztXQUlHO1FBQ0gsVUFBVSxDQUFVLE9BQThDLEVBQ3BELFNBQXdCLGNBQWM7WUFFbEQsT0FBTyxJQUFJLE9BQU8sQ0FBSSxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsY0FBYyxFQUNwRixJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBRUQ7OztXQUdHO1FBQ0gsY0FBYyxDQUFVLE9BQThDO1lBQ3BFLE9BQU8sSUFBSSxXQUFXLENBQUksT0FBTyxFQUFFLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQ25GLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUMzQixDQUFDO0tBQ0YsQ0FBQTs7SUEzQlksUUFBUTtRQURwQixVQUFVLENBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDLENBQUM7UUFHNUIsV0FBQSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUE7aURBQ0EsTUFBTTtZQUNDLGFBQWE7WUFDVixnQkFBZ0I7T0FMbEMsUUFBUSxDQTJCcEI7bUJBcEREO0tBb0RDO1NBM0JZLFFBQVEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RhYmxlLCBJbmplY3QsIE5nWm9uZSwgRWxlbWVudFJlZn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtWaWV3cG9ydFJ1bGVyfSBmcm9tICdAYW5ndWxhci9jZGsvc2Nyb2xsaW5nJztcbmltcG9ydCB7RHJhZ1JlZiwgRHJhZ1JlZkNvbmZpZ30gZnJvbSAnLi9kcmFnLXJlZic7XG5pbXBvcnQge0Ryb3BMaXN0UmVmfSBmcm9tICcuL2Ryb3AtbGlzdC1yZWYnO1xuaW1wb3J0IHtEcmFnRHJvcFJlZ2lzdHJ5fSBmcm9tICcuL2RyYWctZHJvcC1yZWdpc3RyeSc7XG5cbi8qKiBEZWZhdWx0IGNvbmZpZ3VyYXRpb24gdG8gYmUgdXNlZCB3aGVuIGNyZWF0aW5nIGEgYERyYWdSZWZgLiAqL1xuY29uc3QgREVGQVVMVF9DT05GSUcgPSB7XG4gIGRyYWdTdGFydFRocmVzaG9sZDogNSxcbiAgcG9pbnRlckRpcmVjdGlvbkNoYW5nZVRocmVzaG9sZDogNVxufTtcblxuLyoqXG4gKiBTZXJ2aWNlIHRoYXQgYWxsb3dzIGZvciBkcmFnLWFuZC1kcm9wIGZ1bmN0aW9uYWxpdHkgdG8gYmUgYXR0YWNoZWQgdG8gRE9NIGVsZW1lbnRzLlxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBEcmFnRHJvcCB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIEBJbmplY3QoRE9DVU1FTlQpIHByaXZhdGUgX2RvY3VtZW50OiBhbnksXG4gICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgcHJpdmF0ZSBfdmlld3BvcnRSdWxlcjogVmlld3BvcnRSdWxlcixcbiAgICBwcml2YXRlIF9kcmFnRHJvcFJlZ2lzdHJ5OiBEcmFnRHJvcFJlZ2lzdHJ5PERyYWdSZWYsIERyb3BMaXN0UmVmPikge31cblxuICAvKipcbiAgICogVHVybnMgYW4gZWxlbWVudCBpbnRvIGEgZHJhZ2dhYmxlIGl0ZW0uXG4gICAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgdG8gd2hpY2ggdG8gYXR0YWNoIHRoZSBkcmFnZ2luZyBmdW5jdGlvbmFsaXR5LlxuICAgKiBAcGFyYW0gY29uZmlnIE9iamVjdCB1c2VkIHRvIGNvbmZpZ3VyZSB0aGUgZHJhZ2dpbmcgYmVoYXZpb3IuXG4gICAqL1xuICBjcmVhdGVEcmFnPFQgPSBhbnk+KGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+IHwgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgY29uZmlnOiBEcmFnUmVmQ29uZmlnID0gREVGQVVMVF9DT05GSUcpOiBEcmFnUmVmPFQ+IHtcblxuICAgIHJldHVybiBuZXcgRHJhZ1JlZjxUPihlbGVtZW50LCBjb25maWcsIHRoaXMuX2RvY3VtZW50LCB0aGlzLl9uZ1pvbmUsIHRoaXMuX3ZpZXdwb3J0UnVsZXIsXG4gICAgICAgIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFR1cm5zIGFuIGVsZW1lbnQgaW50byBhIGRyb3AgbGlzdC5cbiAgICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCB0byB3aGljaCB0byBhdHRhY2ggdGhlIGRyb3AgbGlzdCBmdW5jdGlvbmFsaXR5LlxuICAgKi9cbiAgY3JlYXRlRHJvcExpc3Q8VCA9IGFueT4oZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBIVE1MRWxlbWVudCk6IERyb3BMaXN0UmVmPFQ+IHtcbiAgICByZXR1cm4gbmV3IERyb3BMaXN0UmVmPFQ+KGVsZW1lbnQsIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnksIHRoaXMuX2RvY3VtZW50LCB0aGlzLl9uZ1pvbmUsXG4gICAgICAgIHRoaXMuX3ZpZXdwb3J0UnVsZXIpO1xuICB9XG59XG4iXX0=