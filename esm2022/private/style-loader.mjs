/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ApplicationRef, createComponent, EnvironmentInjector, inject, Injectable, Injector, } from '@angular/core';
import * as i0 from "@angular/core";
/** Apps in which we've loaded styles. */
const appsWithLoaders = new WeakMap();
/**
 * Service that loads structural styles dynamically
 * and ensures that they're only loaded once per app.
 */
export class _CdkPrivateStyleLoader {
    constructor() {
        this._injector = inject(Injector);
        this._environmentInjector = inject(EnvironmentInjector);
    }
    /**
     * Loads a set of styles.
     * @param loader Component which will be instantiated to load the styles.
     */
    load(loader) {
        // Resolve the app ref lazily to avoid circular dependency errors if this is called too early.
        const appRef = (this._appRef = this._appRef || this._injector.get(ApplicationRef));
        let data = appsWithLoaders.get(appRef);
        // If we haven't loaded for this app before, we have to initialize it.
        if (!data) {
            data = { loaders: new Set(), refs: [] };
            appsWithLoaders.set(appRef, data);
            // When the app is destroyed, we need to clean up all the related loaders.
            appRef.onDestroy(() => {
                appsWithLoaders.get(appRef)?.refs.forEach(ref => ref.destroy());
                appsWithLoaders.delete(appRef);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGUtbG9hZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9wcml2YXRlL3N0eWxlLWxvYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsY0FBYyxFQUVkLGVBQWUsRUFDZixtQkFBbUIsRUFDbkIsTUFBTSxFQUNOLFVBQVUsRUFDVixRQUFRLEdBRVQsTUFBTSxlQUFlLENBQUM7O0FBRXZCLHlDQUF5QztBQUN6QyxNQUFNLGVBQWUsR0FBRyxJQUFJLE9BQU8sRUFTaEMsQ0FBQztBQUVKOzs7R0FHRztBQUVILE1BQU0sT0FBTyxzQkFBc0I7SUFEbkM7UUFHVSxjQUFTLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzdCLHlCQUFvQixHQUFHLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0tBNkI1RDtJQTNCQzs7O09BR0c7SUFDSCxJQUFJLENBQUMsTUFBcUI7UUFDeEIsOEZBQThGO1FBQzlGLE1BQU0sTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7UUFDbkYsSUFBSSxJQUFJLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUV2QyxzRUFBc0U7UUFDdEUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1YsSUFBSSxHQUFHLEVBQUMsT0FBTyxFQUFFLElBQUksR0FBRyxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBQyxDQUFDO1lBQ3RDLGVBQWUsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRWxDLDBFQUEwRTtZQUMxRSxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRTtnQkFDcEIsZUFBZSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7Z0JBQ2hFLGVBQWUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDakMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQscUVBQXFFO1FBQ3JFLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3pCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsRUFBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsb0JBQW9CLEVBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUYsQ0FBQztJQUNILENBQUM7cUhBL0JVLHNCQUFzQjt5SEFBdEIsc0JBQXNCLGNBRFYsTUFBTTs7a0dBQ2xCLHNCQUFzQjtrQkFEbEMsVUFBVTttQkFBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgQXBwbGljYXRpb25SZWYsXG4gIENvbXBvbmVudFJlZixcbiAgY3JlYXRlQ29tcG9uZW50LFxuICBFbnZpcm9ubWVudEluamVjdG9yLFxuICBpbmplY3QsXG4gIEluamVjdGFibGUsXG4gIEluamVjdG9yLFxuICBUeXBlLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuLyoqIEFwcHMgaW4gd2hpY2ggd2UndmUgbG9hZGVkIHN0eWxlcy4gKi9cbmNvbnN0IGFwcHNXaXRoTG9hZGVycyA9IG5ldyBXZWFrTWFwPFxuICBBcHBsaWNhdGlvblJlZixcbiAge1xuICAgIC8qKiBTdHlsZSBsb2FkZXJzIHRoYXQgaGF2ZSBiZWVuIGFkZGVkLiAqL1xuICAgIGxvYWRlcnM6IFNldDxUeXBlPHVua25vd24+PjtcblxuICAgIC8qKiBSZWZlcmVuY2VzIHRvIHRoZSBpbnN0YW50aWF0ZWQgbG9hZGVycy4gKi9cbiAgICByZWZzOiBDb21wb25lbnRSZWY8dW5rbm93bj5bXTtcbiAgfVxuPigpO1xuXG4vKipcbiAqIFNlcnZpY2UgdGhhdCBsb2FkcyBzdHJ1Y3R1cmFsIHN0eWxlcyBkeW5hbWljYWxseVxuICogYW5kIGVuc3VyZXMgdGhhdCB0aGV5J3JlIG9ubHkgbG9hZGVkIG9uY2UgcGVyIGFwcC5cbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgX0Nka1ByaXZhdGVTdHlsZUxvYWRlciB7XG4gIHByaXZhdGUgX2FwcFJlZjogQXBwbGljYXRpb25SZWYgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgX2luamVjdG9yID0gaW5qZWN0KEluamVjdG9yKTtcbiAgcHJpdmF0ZSBfZW52aXJvbm1lbnRJbmplY3RvciA9IGluamVjdChFbnZpcm9ubWVudEluamVjdG9yKTtcblxuICAvKipcbiAgICogTG9hZHMgYSBzZXQgb2Ygc3R5bGVzLlxuICAgKiBAcGFyYW0gbG9hZGVyIENvbXBvbmVudCB3aGljaCB3aWxsIGJlIGluc3RhbnRpYXRlZCB0byBsb2FkIHRoZSBzdHlsZXMuXG4gICAqL1xuICBsb2FkKGxvYWRlcjogVHlwZTx1bmtub3duPik6IHZvaWQge1xuICAgIC8vIFJlc29sdmUgdGhlIGFwcCByZWYgbGF6aWx5IHRvIGF2b2lkIGNpcmN1bGFyIGRlcGVuZGVuY3kgZXJyb3JzIGlmIHRoaXMgaXMgY2FsbGVkIHRvbyBlYXJseS5cbiAgICBjb25zdCBhcHBSZWYgPSAodGhpcy5fYXBwUmVmID0gdGhpcy5fYXBwUmVmIHx8IHRoaXMuX2luamVjdG9yLmdldChBcHBsaWNhdGlvblJlZikpO1xuICAgIGxldCBkYXRhID0gYXBwc1dpdGhMb2FkZXJzLmdldChhcHBSZWYpO1xuXG4gICAgLy8gSWYgd2UgaGF2ZW4ndCBsb2FkZWQgZm9yIHRoaXMgYXBwIGJlZm9yZSwgd2UgaGF2ZSB0byBpbml0aWFsaXplIGl0LlxuICAgIGlmICghZGF0YSkge1xuICAgICAgZGF0YSA9IHtsb2FkZXJzOiBuZXcgU2V0KCksIHJlZnM6IFtdfTtcbiAgICAgIGFwcHNXaXRoTG9hZGVycy5zZXQoYXBwUmVmLCBkYXRhKTtcblxuICAgICAgLy8gV2hlbiB0aGUgYXBwIGlzIGRlc3Ryb3llZCwgd2UgbmVlZCB0byBjbGVhbiB1cCBhbGwgdGhlIHJlbGF0ZWQgbG9hZGVycy5cbiAgICAgIGFwcFJlZi5vbkRlc3Ryb3koKCkgPT4ge1xuICAgICAgICBhcHBzV2l0aExvYWRlcnMuZ2V0KGFwcFJlZik/LnJlZnMuZm9yRWFjaChyZWYgPT4gcmVmLmRlc3Ryb3koKSk7XG4gICAgICAgIGFwcHNXaXRoTG9hZGVycy5kZWxldGUoYXBwUmVmKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBsb2FkZXIgaGFzbid0IGJlZW4gbG9hZGVkIGJlZm9yZSwgd2UgbmVlZCB0byBpbnN0YXRpYXRlIGl0LlxuICAgIGlmICghZGF0YS5sb2FkZXJzLmhhcyhsb2FkZXIpKSB7XG4gICAgICBkYXRhLmxvYWRlcnMuYWRkKGxvYWRlcik7XG4gICAgICBkYXRhLnJlZnMucHVzaChjcmVhdGVDb21wb25lbnQobG9hZGVyLCB7ZW52aXJvbm1lbnRJbmplY3RvcjogdGhpcy5fZW52aXJvbm1lbnRJbmplY3Rvcn0pKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==