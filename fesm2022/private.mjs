import * as i0 from '@angular/core';
import { inject, Injector, EnvironmentInjector, ApplicationRef, createComponent, Injectable, Component, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';

/** Apps in which we've loaded styles. */
const appsWithLoaders = new WeakMap();
/**
 * Service that loads structural styles dynamically
 * and ensures that they're only loaded once per app.
 */
class _CdkPrivateStyleLoader {
    _appRef;
    _injector = inject(Injector);
    _environmentInjector = inject(EnvironmentInjector);
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.0.0", ngImport: i0, type: _CdkPrivateStyleLoader, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.0.0", ngImport: i0, type: _CdkPrivateStyleLoader, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.0.0", ngImport: i0, type: _CdkPrivateStyleLoader, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }] });

/**
 * Component used to load the .cdk-visually-hidden styles.
 * @docs-private
 */
class _VisuallyHiddenLoader {
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.0.0", ngImport: i0, type: _VisuallyHiddenLoader, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "19.0.0", type: _VisuallyHiddenLoader, isStandalone: true, selector: "ng-component", exportAs: ["cdkVisuallyHidden"], ngImport: i0, template: '', isInline: true, styles: [".cdk-visually-hidden{border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px;white-space:nowrap;outline:0;-webkit-appearance:none;-moz-appearance:none;left:0}[dir=rtl] .cdk-visually-hidden{left:auto;right:0}"], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.0.0", ngImport: i0, type: _VisuallyHiddenLoader, decorators: [{
            type: Component,
            args: [{ exportAs: 'cdkVisuallyHidden', encapsulation: ViewEncapsulation.None, template: '', changeDetection: ChangeDetectionStrategy.OnPush, styles: [".cdk-visually-hidden{border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px;white-space:nowrap;outline:0;-webkit-appearance:none;-moz-appearance:none;left:0}[dir=rtl] .cdk-visually-hidden{left:auto;right:0}"] }]
        }] });

/**
 * Generated bundle index. Do not edit.
 */

export { _CdkPrivateStyleLoader, _VisuallyHiddenLoader };
//# sourceMappingURL=private.mjs.map
