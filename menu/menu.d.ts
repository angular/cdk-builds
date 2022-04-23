/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AfterContentInit, ElementRef, EventEmitter, NgZone, OnDestroy } from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { MenuStack } from './menu-stack';
import { MenuAim } from './menu-aim';
import { CdkMenuTriggerBase } from './menu-trigger-base';
import { CdkMenuBase } from './menu-base';
import * as i0 from "@angular/core";
/**
 * Directive which configures the element as a Menu which should contain child elements marked as
 * CdkMenuItem or CdkMenuGroup. Sets the appropriate role and aria-attributes for a menu and
 * contains accessible keyboard and mouse handling logic.
 *
 * It also acts as a RadioGroup for elements marked with role `menuitemradio`.
 */
export declare class CdkMenu extends CdkMenuBase implements AfterContentInit, OnDestroy {
    /** The trigger that opened this menu. */
    private _parentTrigger?;
    /** Event emitted when the menu is closed. */
    readonly closed: EventEmitter<void>;
    /** The direction items in the menu flow. */
    readonly orientation = "vertical";
    /** Whether the menu is displayed inline (i.e. always present vs a conditional popup that the user triggers with a trigger element). */
    readonly isInline: boolean;
    constructor(
    /** The host element. */
    elementRef: ElementRef<HTMLElement>, 
    /** The Angular zone. */
    ngZone: NgZone, 
    /** The menu stack this menu is part of. */
    menuStack: MenuStack, 
    /** The trigger that opened this menu. */
    _parentTrigger?: CdkMenuTriggerBase | undefined, 
    /** The menu aim service used by this menu. */
    menuAim?: MenuAim, 
    /** The directionality of the page. */
    dir?: Directionality);
    ngAfterContentInit(): void;
    ngOnDestroy(): void;
    /**
     * Handle keyboard events for the Menu.
     * @param event The keyboard event to be handled.
     */
    _handleKeyEvent(event: KeyboardEvent): void;
    /**
     * Set focus the either the current, previous or next item based on the FocusNext event.
     * @param focusNext The element to focus.
     */
    private _toggleMenuFocus;
    /** Subscribe to the MenuStack emptied events. */
    private _subscribeToMenuStackEmptied;
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkMenu, [null, null, null, { optional: true; }, { optional: true; self: true; }, { optional: true; }]>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkMenu, "[cdkMenu]", ["cdkMenu"], {}, { "closed": "closed"; }, never, never, false>;
}
