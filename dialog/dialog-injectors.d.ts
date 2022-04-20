/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from '@angular/core';
import { Overlay, ScrollStrategy } from '@angular/cdk/overlay';
import { DialogConfig } from './dialog-config';
/** Injection token for the Dialog's ScrollStrategy. */
export declare const DIALOG_SCROLL_STRATEGY: InjectionToken<() => ScrollStrategy>;
/** Injection token for the Dialog's Data. */
export declare const DIALOG_DATA: InjectionToken<any>;
/** Injection token that can be used to provide default options for the dialog module. */
export declare const DEFAULT_DIALOG_CONFIG: InjectionToken<DialogConfig<unknown, unknown, import("@angular/cdk/portal").BasePortalOutlet>>;
/** @docs-private */
export declare function DIALOG_SCROLL_STRATEGY_PROVIDER_FACTORY(overlay: Overlay): () => ScrollStrategy;
/** @docs-private */
export declare const DIALOG_SCROLL_STRATEGY_PROVIDER: {
    provide: InjectionToken<() => ScrollStrategy>;
    deps: (typeof Overlay)[];
    useFactory: typeof DIALOG_SCROLL_STRATEGY_PROVIDER_FACTORY;
};
