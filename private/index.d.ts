import * as i0 from '@angular/core';
import { Type } from '@angular/core';

/**
 * Service that loads structural styles dynamically
 * and ensures that they're only loaded once per app.
 */
export declare class _CdkPrivateStyleLoader {
    private _appRef;
    private _injector;
    private _environmentInjector;
    /**
     * Loads a set of styles.
     * @param loader Component which will be instantiated to load the styles.
     */
    load(loader: Type<unknown>): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<_CdkPrivateStyleLoader, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<_CdkPrivateStyleLoader>;
}

/**
 * Component used to load the .cdk-visually-hidden styles.
 * @docs-private
 */
export declare class _VisuallyHiddenLoader {
    static ɵfac: i0.ɵɵFactoryDeclaration<_VisuallyHiddenLoader, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<_VisuallyHiddenLoader, "ng-component", ["cdkVisuallyHidden"], {}, {}, never, never, true, never>;
}

export { }
