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
import * as i1 from "@angular/cdk/scrolling";
import * as i2 from "./drag-drop-registry";
/** Default configuration to be used when creating a `DragRef`. */
const DEFAULT_CONFIG = {
    dragStartThreshold: 5,
    pointerDirectionChangeThreshold: 5
};
/**
 * Service that allows for drag-and-drop functionality to be attached to DOM elements.
 */
export class DragDrop {
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
}
DragDrop.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: DragDrop, deps: [{ token: DOCUMENT }, { token: i0.NgZone }, { token: i1.ViewportRuler }, { token: i2.DragDropRegistry }], target: i0.ɵɵFactoryTarget.Injectable });
DragDrop.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: DragDrop, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: DragDrop, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: i0.NgZone }, { type: i1.ViewportRuler }, { type: i2.DragDropRegistry }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1kcm9wLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZHJhZy1kcm9wLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBYSxNQUFNLGVBQWUsQ0FBQztBQUNyRSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3JELE9BQU8sRUFBQyxPQUFPLEVBQWdCLE1BQU0sWUFBWSxDQUFDO0FBQ2xELE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUM1QyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQzs7OztBQUV0RCxrRUFBa0U7QUFDbEUsTUFBTSxjQUFjLEdBQUc7SUFDckIsa0JBQWtCLEVBQUUsQ0FBQztJQUNyQiwrQkFBK0IsRUFBRSxDQUFDO0NBQ25DLENBQUM7QUFFRjs7R0FFRztBQUVILE1BQU0sT0FBTyxRQUFRO0lBQ25CLFlBQzRCLFNBQWMsRUFDaEMsT0FBZSxFQUNmLGNBQTZCLEVBQzdCLGlCQUF5RDtRQUh2QyxjQUFTLEdBQVQsU0FBUyxDQUFLO1FBQ2hDLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFDZixtQkFBYyxHQUFkLGNBQWMsQ0FBZTtRQUM3QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQXdDO0lBQUcsQ0FBQztJQUV2RTs7OztPQUlHO0lBQ0gsVUFBVSxDQUFVLE9BQThDLEVBQ3BELFNBQXdCLGNBQWM7UUFFbEQsT0FBTyxJQUFJLE9BQU8sQ0FBSSxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsY0FBYyxFQUNwRixJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsY0FBYyxDQUFVLE9BQThDO1FBQ3BFLE9BQU8sSUFBSSxXQUFXLENBQUksT0FBTyxFQUFFLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQ25GLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUMzQixDQUFDOzs2R0ExQlUsUUFBUSxrQkFFVCxRQUFRO2lIQUZQLFFBQVEsY0FESSxNQUFNO21HQUNsQixRQUFRO2tCQURwQixVQUFVO21CQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQzs7MEJBRzNCLE1BQU07MkJBQUMsUUFBUSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGFibGUsIEluamVjdCwgTmdab25lLCBFbGVtZW50UmVmfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge1ZpZXdwb3J0UnVsZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9zY3JvbGxpbmcnO1xuaW1wb3J0IHtEcmFnUmVmLCBEcmFnUmVmQ29uZmlnfSBmcm9tICcuL2RyYWctcmVmJztcbmltcG9ydCB7RHJvcExpc3RSZWZ9IGZyb20gJy4vZHJvcC1saXN0LXJlZic7XG5pbXBvcnQge0RyYWdEcm9wUmVnaXN0cnl9IGZyb20gJy4vZHJhZy1kcm9wLXJlZ2lzdHJ5JztcblxuLyoqIERlZmF1bHQgY29uZmlndXJhdGlvbiB0byBiZSB1c2VkIHdoZW4gY3JlYXRpbmcgYSBgRHJhZ1JlZmAuICovXG5jb25zdCBERUZBVUxUX0NPTkZJRyA9IHtcbiAgZHJhZ1N0YXJ0VGhyZXNob2xkOiA1LFxuICBwb2ludGVyRGlyZWN0aW9uQ2hhbmdlVGhyZXNob2xkOiA1XG59O1xuXG4vKipcbiAqIFNlcnZpY2UgdGhhdCBhbGxvd3MgZm9yIGRyYWctYW5kLWRyb3AgZnVuY3Rpb25hbGl0eSB0byBiZSBhdHRhY2hlZCB0byBET00gZWxlbWVudHMuXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIERyYWdEcm9wIHtcbiAgY29uc3RydWN0b3IoXG4gICAgQEluamVjdChET0NVTUVOVCkgcHJpdmF0ZSBfZG9jdW1lbnQ6IGFueSxcbiAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICBwcml2YXRlIF92aWV3cG9ydFJ1bGVyOiBWaWV3cG9ydFJ1bGVyLFxuICAgIHByaXZhdGUgX2RyYWdEcm9wUmVnaXN0cnk6IERyYWdEcm9wUmVnaXN0cnk8RHJhZ1JlZiwgRHJvcExpc3RSZWY+KSB7fVxuXG4gIC8qKlxuICAgKiBUdXJucyBhbiBlbGVtZW50IGludG8gYSBkcmFnZ2FibGUgaXRlbS5cbiAgICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCB0byB3aGljaCB0byBhdHRhY2ggdGhlIGRyYWdnaW5nIGZ1bmN0aW9uYWxpdHkuXG4gICAqIEBwYXJhbSBjb25maWcgT2JqZWN0IHVzZWQgdG8gY29uZmlndXJlIHRoZSBkcmFnZ2luZyBiZWhhdmlvci5cbiAgICovXG4gIGNyZWF0ZURyYWc8VCA9IGFueT4oZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgICAgICBjb25maWc6IERyYWdSZWZDb25maWcgPSBERUZBVUxUX0NPTkZJRyk6IERyYWdSZWY8VD4ge1xuXG4gICAgcmV0dXJuIG5ldyBEcmFnUmVmPFQ+KGVsZW1lbnQsIGNvbmZpZywgdGhpcy5fZG9jdW1lbnQsIHRoaXMuX25nWm9uZSwgdGhpcy5fdmlld3BvcnRSdWxlcixcbiAgICAgICAgdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeSk7XG4gIH1cblxuICAvKipcbiAgICogVHVybnMgYW4gZWxlbWVudCBpbnRvIGEgZHJvcCBsaXN0LlxuICAgKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IHRvIHdoaWNoIHRvIGF0dGFjaCB0aGUgZHJvcCBsaXN0IGZ1bmN0aW9uYWxpdHkuXG4gICAqL1xuICBjcmVhdGVEcm9wTGlzdDxUID0gYW55PihlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiB8IEhUTUxFbGVtZW50KTogRHJvcExpc3RSZWY8VD4ge1xuICAgIHJldHVybiBuZXcgRHJvcExpc3RSZWY8VD4oZWxlbWVudCwgdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeSwgdGhpcy5fZG9jdW1lbnQsIHRoaXMuX25nWm9uZSxcbiAgICAgICAgdGhpcy5fdmlld3BvcnRSdWxlcik7XG4gIH1cbn1cbiJdfQ==