/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AfterContentInit, ElementRef, NgZone } from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { MenuStack } from './menu-stack';
import { MenuAim } from './menu-aim';
import { CdkMenuBase } from './menu-base';
import * as i0 from "@angular/core";
/**
 * Directive applied to an element which configures it as a MenuBar by setting the appropriate
 * role, aria attributes, and accessible keyboard and mouse handling logic. The component that
 * this directive is applied to should contain components marked with CdkMenuItem.
 *
 */
export declare class CdkMenuBar extends CdkMenuBase implements AfterContentInit {
    /** The direction items in the menu flow. */
    readonly orientation = "horizontal";
    /** Whether the menu is displayed inline (i.e. always present vs a conditional popup that the user triggers with a trigger element). */
    readonly isInline = true;
    constructor(
    /** The host element. */
    elementRef: ElementRef<HTMLElement>, 
    /** The Angular zone. */
    ngZone: NgZone, 
    /** The menu stack this menu is part of. */
    menuStack: MenuStack, 
    /** The menu aim service used by this menu. */
    menuAim?: MenuAim, 
    /** The directionality of the page. */
    dir?: Directionality);
    ngAfterContentInit(): void;
    /**
     * Handle keyboard events for the Menu.
     * @param event The keyboard event to be handled.
     */
    _handleKeyEvent(event: KeyboardEvent): void;
    /**
     * Set focus to either the current, previous or next item based on the FocusNext event, then
     * open the previous or next item.
     * @param focusNext The element to focus.
     */
    private _toggleOpenMenu;
    /** Subscribe to the MenuStack emptied events. */
    private _subscribeToMenuStackEmptied;
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkMenuBar, [null, null, null, { optional: true; self: true; }, { optional: true; }]>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkMenuBar, "[cdkMenuBar]", ["cdkMenuBar"], {}, {}, never, never, false>;
}
