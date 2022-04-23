/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { UniqueSelectionDispatcher } from '@angular/cdk/collections';
import { ElementRef, NgZone, OnDestroy } from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { CdkMenuItemSelectable } from './menu-item-selectable';
import { CdkMenuTrigger } from './menu-trigger';
import { Menu } from './menu-interface';
import { MenuAim } from './menu-aim';
import { MenuStack } from './menu-stack';
import * as i0 from "@angular/core";
/**
 * A directive providing behavior for the "menuitemradio" ARIA role, which behaves similarly to
 * a conventional radio-button. Any sibling `CdkMenuItemRadio` instances within the same `CdkMenu`
 * or `CdkMenuGroup` comprise a radio group with unique selection enforced.
 */
export declare class CdkMenuItemRadio extends CdkMenuItemSelectable implements OnDestroy {
    /** The unique selection dispatcher for this radio's `CdkMenuGroup`. */
    private readonly _selectionDispatcher;
    /** An ID to identify this radio item to the `UniqueSelectionDisptcher`. */
    private _id;
    /** Function to unregister the selection dispatcher */
    private _removeDispatcherListener;
    constructor(
    /** The host element for this radio item. */
    element: ElementRef<HTMLElement>, 
    /** The Angular zone. */
    ngZone: NgZone, 
    /** The unique selection dispatcher for this radio's `CdkMenuGroup`. */
    _selectionDispatcher: UniqueSelectionDispatcher, 
    /** The menu stack this item belongs to. */
    menuStack: MenuStack, 
    /** The parent menu for this item. */
    parentMenu?: Menu, 
    /** The menu aim used for this item. */
    menuAim?: MenuAim, 
    /** The directionality of the page. */
    dir?: Directionality, 
    /** Reference to the CdkMenuItemTrigger directive if one is added to the same element */
    menuTrigger?: CdkMenuTrigger);
    ngOnDestroy(): void;
    /**
     * Toggles the checked state of the radio-button.
     * @param options Options the configure how the item is triggered
     *   - keepOpen: specifies that the menu should be kept open after triggering the item.
     */
    trigger(options?: {
        keepOpen: boolean;
    }): void;
    /** Configure the unique selection dispatcher listener in order to toggle the checked state  */
    private _registerDispatcherListener;
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkMenuItemRadio, [null, null, null, null, { optional: true; }, { optional: true; }, { optional: true; }, { optional: true; self: true; }]>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkMenuItemRadio, "[cdkMenuItemRadio]", ["cdkMenuItemRadio"], {}, {}, never, never, false>;
}
