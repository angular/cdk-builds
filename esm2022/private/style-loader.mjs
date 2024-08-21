/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ApplicationRef, createComponent, EnvironmentInjector, inject, Injectable, } from '@angular/core';
import * as i0 from "@angular/core";
/** Apps in which we've loaded styles. */
const appsWithLoaders = new WeakMap();
/**
 * Service that loads structural styles dynamically
 * and ensures that they're only loaded once per app.
 */
export class _CdkPrivateStyleLoader {
    constructor() {
        this._appRef = inject(ApplicationRef);
        this._environmentInjector = inject(EnvironmentInjector);
    }
    /**
     * Loads a set of styles.
     * @param loader Component which will be instantiated to load the styles.
     */
    load(loader) {
        let data = appsWithLoaders.get(this._appRef);
        // If we haven't loaded for this app before, we have to initialize it.
        if (!data) {
            data = { loaders: new Set(), refs: [] };
            appsWithLoaders.set(this._appRef, data);
            // When the app is destroyed, we need to clean up all the related loaders.
            this._appRef.onDestroy(() => {
                appsWithLoaders.get(this._appRef)?.refs.forEach(ref => ref.destroy());
                appsWithLoaders.delete(this._appRef);
            });
        }
        // If the loader hasn't been loaded before, we need to instatiate it.
        if (!data.loaders.has(loader)) {
            data.loaders.add(loader);
            data.refs.push(createComponent(loader, { environmentInjector: this._environmentInjector }));
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: _CdkPrivateStyleLoader, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: _CdkPrivateStyleLoader, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: _CdkPrivateStyleLoader, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGUtbG9hZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9wcml2YXRlL3N0eWxlLWxvYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsY0FBYyxFQUVkLGVBQWUsRUFDZixtQkFBbUIsRUFDbkIsTUFBTSxFQUNOLFVBQVUsR0FFWCxNQUFNLGVBQWUsQ0FBQzs7QUFFdkIseUNBQXlDO0FBQ3pDLE1BQU0sZUFBZSxHQUFHLElBQUksT0FBTyxFQVNoQyxDQUFDO0FBRUo7OztHQUdHO0FBRUgsTUFBTSxPQUFPLHNCQUFzQjtJQURuQztRQUVVLFlBQU8sR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDakMseUJBQW9CLEdBQUcsTUFBTSxDQUFDLG1CQUFtQixDQUFDLENBQUM7S0EyQjVEO0lBekJDOzs7T0FHRztJQUNILElBQUksQ0FBQyxNQUFxQjtRQUN4QixJQUFJLElBQUksR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUU3QyxzRUFBc0U7UUFDdEUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1YsSUFBSSxHQUFHLEVBQUMsT0FBTyxFQUFFLElBQUksR0FBRyxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBQyxDQUFDO1lBQ3RDLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUV4QywwRUFBMEU7WUFDMUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFO2dCQUMxQixlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7Z0JBQ3RFLGVBQWUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3ZDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELHFFQUFxRTtRQUNyRSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztZQUM5QixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN6QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLEVBQUMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixFQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVGLENBQUM7SUFDSCxDQUFDO3FIQTVCVSxzQkFBc0I7eUhBQXRCLHNCQUFzQixjQURWLE1BQU07O2tHQUNsQixzQkFBc0I7a0JBRGxDLFVBQVU7bUJBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIEFwcGxpY2F0aW9uUmVmLFxuICBDb21wb25lbnRSZWYsXG4gIGNyZWF0ZUNvbXBvbmVudCxcbiAgRW52aXJvbm1lbnRJbmplY3RvcixcbiAgaW5qZWN0LFxuICBJbmplY3RhYmxlLFxuICBUeXBlLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuLyoqIEFwcHMgaW4gd2hpY2ggd2UndmUgbG9hZGVkIHN0eWxlcy4gKi9cbmNvbnN0IGFwcHNXaXRoTG9hZGVycyA9IG5ldyBXZWFrTWFwPFxuICBBcHBsaWNhdGlvblJlZixcbiAge1xuICAgIC8qKiBTdHlsZSBsb2FkZXJzIHRoYXQgaGF2ZSBiZWVuIGFkZGVkLiAqL1xuICAgIGxvYWRlcnM6IFNldDxUeXBlPHVua25vd24+PjtcblxuICAgIC8qKiBSZWZlcmVuY2VzIHRvIHRoZSBpbnN0YW50aWF0ZWQgbG9hZGVycy4gKi9cbiAgICByZWZzOiBDb21wb25lbnRSZWY8dW5rbm93bj5bXTtcbiAgfVxuPigpO1xuXG4vKipcbiAqIFNlcnZpY2UgdGhhdCBsb2FkcyBzdHJ1Y3R1cmFsIHN0eWxlcyBkeW5hbWljYWxseVxuICogYW5kIGVuc3VyZXMgdGhhdCB0aGV5J3JlIG9ubHkgbG9hZGVkIG9uY2UgcGVyIGFwcC5cbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgX0Nka1ByaXZhdGVTdHlsZUxvYWRlciB7XG4gIHByaXZhdGUgX2FwcFJlZiA9IGluamVjdChBcHBsaWNhdGlvblJlZik7XG4gIHByaXZhdGUgX2Vudmlyb25tZW50SW5qZWN0b3IgPSBpbmplY3QoRW52aXJvbm1lbnRJbmplY3Rvcik7XG5cbiAgLyoqXG4gICAqIExvYWRzIGEgc2V0IG9mIHN0eWxlcy5cbiAgICogQHBhcmFtIGxvYWRlciBDb21wb25lbnQgd2hpY2ggd2lsbCBiZSBpbnN0YW50aWF0ZWQgdG8gbG9hZCB0aGUgc3R5bGVzLlxuICAgKi9cbiAgbG9hZChsb2FkZXI6IFR5cGU8dW5rbm93bj4pOiB2b2lkIHtcbiAgICBsZXQgZGF0YSA9IGFwcHNXaXRoTG9hZGVycy5nZXQodGhpcy5fYXBwUmVmKTtcblxuICAgIC8vIElmIHdlIGhhdmVuJ3QgbG9hZGVkIGZvciB0aGlzIGFwcCBiZWZvcmUsIHdlIGhhdmUgdG8gaW5pdGlhbGl6ZSBpdC5cbiAgICBpZiAoIWRhdGEpIHtcbiAgICAgIGRhdGEgPSB7bG9hZGVyczogbmV3IFNldCgpLCByZWZzOiBbXX07XG4gICAgICBhcHBzV2l0aExvYWRlcnMuc2V0KHRoaXMuX2FwcFJlZiwgZGF0YSk7XG5cbiAgICAgIC8vIFdoZW4gdGhlIGFwcCBpcyBkZXN0cm95ZWQsIHdlIG5lZWQgdG8gY2xlYW4gdXAgYWxsIHRoZSByZWxhdGVkIGxvYWRlcnMuXG4gICAgICB0aGlzLl9hcHBSZWYub25EZXN0cm95KCgpID0+IHtcbiAgICAgICAgYXBwc1dpdGhMb2FkZXJzLmdldCh0aGlzLl9hcHBSZWYpPy5yZWZzLmZvckVhY2gocmVmID0+IHJlZi5kZXN0cm95KCkpO1xuICAgICAgICBhcHBzV2l0aExvYWRlcnMuZGVsZXRlKHRoaXMuX2FwcFJlZik7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgbG9hZGVyIGhhc24ndCBiZWVuIGxvYWRlZCBiZWZvcmUsIHdlIG5lZWQgdG8gaW5zdGF0aWF0ZSBpdC5cbiAgICBpZiAoIWRhdGEubG9hZGVycy5oYXMobG9hZGVyKSkge1xuICAgICAgZGF0YS5sb2FkZXJzLmFkZChsb2FkZXIpO1xuICAgICAgZGF0YS5yZWZzLnB1c2goY3JlYXRlQ29tcG9uZW50KGxvYWRlciwge2Vudmlyb25tZW50SW5qZWN0b3I6IHRoaXMuX2Vudmlyb25tZW50SW5qZWN0b3J9KSk7XG4gICAgfVxuICB9XG59XG4iXX0=