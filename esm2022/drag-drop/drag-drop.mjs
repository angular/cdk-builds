/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable, Inject, NgZone, Component, ViewEncapsulation, ChangeDetectionStrategy, ApplicationRef, inject, createComponent, EnvironmentInjector, } from '@angular/core';
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
    pointerDirectionChangeThreshold: 5,
};
/** Keeps track of the apps currently containing badges. */
const activeApps = new Set();
/**
 * Component used to load the drag&drop reset styles.
 * @docs-private
 */
export class _ResetsLoader {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.2.0", ngImport: i0, type: _ResetsLoader, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "17.2.0", type: _ResetsLoader, isStandalone: true, selector: "ng-component", host: { attributes: { "cdk-drag-resets-container": "" } }, ngImport: i0, template: '', isInline: true, styles: ["@layer cdk-resets{.cdk-drag-preview{background:none;border:none;padding:0;color:inherit}}"], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.2.0", ngImport: i0, type: _ResetsLoader, decorators: [{
            type: Component,
            args: [{ standalone: true, encapsulation: ViewEncapsulation.None, template: '', changeDetection: ChangeDetectionStrategy.OnPush, host: { 'cdk-drag-resets-container': '' }, styles: ["@layer cdk-resets{.cdk-drag-preview{background:none;border:none;padding:0;color:inherit}}"] }]
        }] });
/**
 * Service that allows for drag-and-drop functionality to be attached to DOM elements.
 */
export class DragDrop {
    constructor(_document, _ngZone, _viewportRuler, _dragDropRegistry) {
        this._document = _document;
        this._ngZone = _ngZone;
        this._viewportRuler = _viewportRuler;
        this._dragDropRegistry = _dragDropRegistry;
        this._appRef = inject(ApplicationRef);
        this._environmentInjector = inject(EnvironmentInjector);
    }
    /**
     * Turns an element into a draggable item.
     * @param element Element to which to attach the dragging functionality.
     * @param config Object used to configure the dragging behavior.
     */
    createDrag(element, config = DEFAULT_CONFIG) {
        this._loadResets();
        return new DragRef(element, config, this._document, this._ngZone, this._viewportRuler, this._dragDropRegistry);
    }
    /**
     * Turns an element into a drop list.
     * @param element Element to which to attach the drop list functionality.
     */
    createDropList(element) {
        return new DropListRef(element, this._dragDropRegistry, this._document, this._ngZone, this._viewportRuler);
    }
    // TODO(crisbeto): abstract this away into something reusable.
    /** Loads the CSS resets needed for the module to work correctly. */
    _loadResets() {
        if (!activeApps.has(this._appRef)) {
            activeApps.add(this._appRef);
            const componentRef = createComponent(_ResetsLoader, {
                environmentInjector: this._environmentInjector,
            });
            this._appRef.onDestroy(() => {
                activeApps.delete(this._appRef);
                if (activeApps.size === 0) {
                    componentRef.destroy();
                }
            });
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.2.0", ngImport: i0, type: DragDrop, deps: [{ token: DOCUMENT }, { token: i0.NgZone }, { token: i1.ViewportRuler }, { token: i2.DragDropRegistry }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "17.2.0", ngImport: i0, type: DragDrop, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.2.0", ngImport: i0, type: DragDrop, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: () => [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: i0.NgZone }, { type: i1.ViewportRuler }, { type: i2.DragDropRegistry }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1kcm9wLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZHJhZy1kcm9wLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFDTCxVQUFVLEVBQ1YsTUFBTSxFQUNOLE1BQU0sRUFFTixTQUFTLEVBQ1QsaUJBQWlCLEVBQ2pCLHVCQUF1QixFQUN2QixjQUFjLEVBQ2QsTUFBTSxFQUNOLGVBQWUsRUFDZixtQkFBbUIsR0FDcEIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNyRCxPQUFPLEVBQUMsT0FBTyxFQUFnQixNQUFNLFlBQVksQ0FBQztBQUNsRCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDNUMsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7Ozs7QUFFdEQsa0VBQWtFO0FBQ2xFLE1BQU0sY0FBYyxHQUFHO0lBQ3JCLGtCQUFrQixFQUFFLENBQUM7SUFDckIsK0JBQStCLEVBQUUsQ0FBQztDQUNuQyxDQUFDO0FBRUYsMkRBQTJEO0FBQzNELE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO0FBRTdDOzs7R0FHRztBQVNILE1BQU0sT0FBTyxhQUFhOzhHQUFiLGFBQWE7a0dBQWIsYUFBYSxtSUFKZCxFQUFFOzsyRkFJRCxhQUFhO2tCQVJ6QixTQUFTO2lDQUNJLElBQUksaUJBRUQsaUJBQWlCLENBQUMsSUFBSSxZQUMzQixFQUFFLG1CQUNLLHVCQUF1QixDQUFDLE1BQU0sUUFDekMsRUFBQywyQkFBMkIsRUFBRSxFQUFFLEVBQUM7O0FBSXpDOztHQUVHO0FBRUgsTUFBTSxPQUFPLFFBQVE7SUFJbkIsWUFDNEIsU0FBYyxFQUNoQyxPQUFlLEVBQ2YsY0FBNkIsRUFDN0IsaUJBQXlEO1FBSHZDLGNBQVMsR0FBVCxTQUFTLENBQUs7UUFDaEMsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQUNmLG1CQUFjLEdBQWQsY0FBYyxDQUFlO1FBQzdCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBd0M7UUFQM0QsWUFBTyxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNqQyx5QkFBb0IsR0FBRyxNQUFNLENBQUMsbUJBQW1CLENBQUMsQ0FBQztJQU94RCxDQUFDO0lBRUo7Ozs7T0FJRztJQUNILFVBQVUsQ0FDUixPQUE4QyxFQUM5QyxTQUF3QixjQUFjO1FBRXRDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNuQixPQUFPLElBQUksT0FBTyxDQUNoQixPQUFPLEVBQ1AsTUFBTSxFQUNOLElBQUksQ0FBQyxTQUFTLEVBQ2QsSUFBSSxDQUFDLE9BQU8sRUFDWixJQUFJLENBQUMsY0FBYyxFQUNuQixJQUFJLENBQUMsaUJBQWlCLENBQ3ZCLENBQUM7SUFDSixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsY0FBYyxDQUFVLE9BQThDO1FBQ3BFLE9BQU8sSUFBSSxXQUFXLENBQ3BCLE9BQU8sRUFDUCxJQUFJLENBQUMsaUJBQWlCLEVBQ3RCLElBQUksQ0FBQyxTQUFTLEVBQ2QsSUFBSSxDQUFDLE9BQU8sRUFDWixJQUFJLENBQUMsY0FBYyxDQUNwQixDQUFDO0lBQ0osQ0FBQztJQUVELDhEQUE4RDtJQUM5RCxvRUFBb0U7SUFDNUQsV0FBVztRQUNqQixJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNsQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUU3QixNQUFNLFlBQVksR0FBRyxlQUFlLENBQUMsYUFBYSxFQUFFO2dCQUNsRCxtQkFBbUIsRUFBRSxJQUFJLENBQUMsb0JBQW9CO2FBQy9DLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRTtnQkFDMUIsVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ2hDLElBQUksVUFBVSxDQUFDLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDMUIsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUN6QixDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO0lBQ0gsQ0FBQzs4R0E5RFUsUUFBUSxrQkFLVCxRQUFRO2tIQUxQLFFBQVEsY0FESSxNQUFNOzsyRkFDbEIsUUFBUTtrQkFEcEIsVUFBVTttQkFBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7OzBCQU0zQixNQUFNOzJCQUFDLFFBQVEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgSW5qZWN0YWJsZSxcbiAgSW5qZWN0LFxuICBOZ1pvbmUsXG4gIEVsZW1lbnRSZWYsXG4gIENvbXBvbmVudCxcbiAgVmlld0VuY2Fwc3VsYXRpb24sXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBBcHBsaWNhdGlvblJlZixcbiAgaW5qZWN0LFxuICBjcmVhdGVDb21wb25lbnQsXG4gIEVudmlyb25tZW50SW5qZWN0b3IsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7Vmlld3BvcnRSdWxlcn0gZnJvbSAnQGFuZ3VsYXIvY2RrL3Njcm9sbGluZyc7XG5pbXBvcnQge0RyYWdSZWYsIERyYWdSZWZDb25maWd9IGZyb20gJy4vZHJhZy1yZWYnO1xuaW1wb3J0IHtEcm9wTGlzdFJlZn0gZnJvbSAnLi9kcm9wLWxpc3QtcmVmJztcbmltcG9ydCB7RHJhZ0Ryb3BSZWdpc3RyeX0gZnJvbSAnLi9kcmFnLWRyb3AtcmVnaXN0cnknO1xuXG4vKiogRGVmYXVsdCBjb25maWd1cmF0aW9uIHRvIGJlIHVzZWQgd2hlbiBjcmVhdGluZyBhIGBEcmFnUmVmYC4gKi9cbmNvbnN0IERFRkFVTFRfQ09ORklHID0ge1xuICBkcmFnU3RhcnRUaHJlc2hvbGQ6IDUsXG4gIHBvaW50ZXJEaXJlY3Rpb25DaGFuZ2VUaHJlc2hvbGQ6IDUsXG59O1xuXG4vKiogS2VlcHMgdHJhY2sgb2YgdGhlIGFwcHMgY3VycmVudGx5IGNvbnRhaW5pbmcgYmFkZ2VzLiAqL1xuY29uc3QgYWN0aXZlQXBwcyA9IG5ldyBTZXQ8QXBwbGljYXRpb25SZWY+KCk7XG5cbi8qKlxuICogQ29tcG9uZW50IHVzZWQgdG8gbG9hZCB0aGUgZHJhZyZkcm9wIHJlc2V0IHN0eWxlcy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuQENvbXBvbmVudCh7XG4gIHN0YW5kYWxvbmU6IHRydWUsXG4gIHN0eWxlVXJsOiAncmVzZXRzLmNzcycsXG4gIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsXG4gIHRlbXBsYXRlOiAnJyxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG4gIGhvc3Q6IHsnY2RrLWRyYWctcmVzZXRzLWNvbnRhaW5lcic6ICcnfSxcbn0pXG5leHBvcnQgY2xhc3MgX1Jlc2V0c0xvYWRlciB7fVxuXG4vKipcbiAqIFNlcnZpY2UgdGhhdCBhbGxvd3MgZm9yIGRyYWctYW5kLWRyb3AgZnVuY3Rpb25hbGl0eSB0byBiZSBhdHRhY2hlZCB0byBET00gZWxlbWVudHMuXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIERyYWdEcm9wIHtcbiAgcHJpdmF0ZSBfYXBwUmVmID0gaW5qZWN0KEFwcGxpY2F0aW9uUmVmKTtcbiAgcHJpdmF0ZSBfZW52aXJvbm1lbnRJbmplY3RvciA9IGluamVjdChFbnZpcm9ubWVudEluamVjdG9yKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBASW5qZWN0KERPQ1VNRU5UKSBwcml2YXRlIF9kb2N1bWVudDogYW55LFxuICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgIHByaXZhdGUgX3ZpZXdwb3J0UnVsZXI6IFZpZXdwb3J0UnVsZXIsXG4gICAgcHJpdmF0ZSBfZHJhZ0Ryb3BSZWdpc3RyeTogRHJhZ0Ryb3BSZWdpc3RyeTxEcmFnUmVmLCBEcm9wTGlzdFJlZj4sXG4gICkge31cblxuICAvKipcbiAgICogVHVybnMgYW4gZWxlbWVudCBpbnRvIGEgZHJhZ2dhYmxlIGl0ZW0uXG4gICAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgdG8gd2hpY2ggdG8gYXR0YWNoIHRoZSBkcmFnZ2luZyBmdW5jdGlvbmFsaXR5LlxuICAgKiBAcGFyYW0gY29uZmlnIE9iamVjdCB1c2VkIHRvIGNvbmZpZ3VyZSB0aGUgZHJhZ2dpbmcgYmVoYXZpb3IuXG4gICAqL1xuICBjcmVhdGVEcmFnPFQgPSBhbnk+KFxuICAgIGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+IHwgSFRNTEVsZW1lbnQsXG4gICAgY29uZmlnOiBEcmFnUmVmQ29uZmlnID0gREVGQVVMVF9DT05GSUcsXG4gICk6IERyYWdSZWY8VD4ge1xuICAgIHRoaXMuX2xvYWRSZXNldHMoKTtcbiAgICByZXR1cm4gbmV3IERyYWdSZWY8VD4oXG4gICAgICBlbGVtZW50LFxuICAgICAgY29uZmlnLFxuICAgICAgdGhpcy5fZG9jdW1lbnQsXG4gICAgICB0aGlzLl9uZ1pvbmUsXG4gICAgICB0aGlzLl92aWV3cG9ydFJ1bGVyLFxuICAgICAgdGhpcy5fZHJhZ0Ryb3BSZWdpc3RyeSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFR1cm5zIGFuIGVsZW1lbnQgaW50byBhIGRyb3AgbGlzdC5cbiAgICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCB0byB3aGljaCB0byBhdHRhY2ggdGhlIGRyb3AgbGlzdCBmdW5jdGlvbmFsaXR5LlxuICAgKi9cbiAgY3JlYXRlRHJvcExpc3Q8VCA9IGFueT4oZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBIVE1MRWxlbWVudCk6IERyb3BMaXN0UmVmPFQ+IHtcbiAgICByZXR1cm4gbmV3IERyb3BMaXN0UmVmPFQ+KFxuICAgICAgZWxlbWVudCxcbiAgICAgIHRoaXMuX2RyYWdEcm9wUmVnaXN0cnksXG4gICAgICB0aGlzLl9kb2N1bWVudCxcbiAgICAgIHRoaXMuX25nWm9uZSxcbiAgICAgIHRoaXMuX3ZpZXdwb3J0UnVsZXIsXG4gICAgKTtcbiAgfVxuXG4gIC8vIFRPRE8oY3Jpc2JldG8pOiBhYnN0cmFjdCB0aGlzIGF3YXkgaW50byBzb21ldGhpbmcgcmV1c2FibGUuXG4gIC8qKiBMb2FkcyB0aGUgQ1NTIHJlc2V0cyBuZWVkZWQgZm9yIHRoZSBtb2R1bGUgdG8gd29yayBjb3JyZWN0bHkuICovXG4gIHByaXZhdGUgX2xvYWRSZXNldHMoKSB7XG4gICAgaWYgKCFhY3RpdmVBcHBzLmhhcyh0aGlzLl9hcHBSZWYpKSB7XG4gICAgICBhY3RpdmVBcHBzLmFkZCh0aGlzLl9hcHBSZWYpO1xuXG4gICAgICBjb25zdCBjb21wb25lbnRSZWYgPSBjcmVhdGVDb21wb25lbnQoX1Jlc2V0c0xvYWRlciwge1xuICAgICAgICBlbnZpcm9ubWVudEluamVjdG9yOiB0aGlzLl9lbnZpcm9ubWVudEluamVjdG9yLFxuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuX2FwcFJlZi5vbkRlc3Ryb3koKCkgPT4ge1xuICAgICAgICBhY3RpdmVBcHBzLmRlbGV0ZSh0aGlzLl9hcHBSZWYpO1xuICAgICAgICBpZiAoYWN0aXZlQXBwcy5zaXplID09PSAwKSB7XG4gICAgICAgICAgY29tcG9uZW50UmVmLmRlc3Ryb3koKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG4iXX0=