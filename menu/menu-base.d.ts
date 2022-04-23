/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { CdkMenuGroup } from './menu-group';
import { AfterContentInit, ElementRef, NgZone, OnDestroy, QueryList } from '@angular/core';
import { FocusKeyManager, FocusOrigin } from '@angular/cdk/a11y';
import { CdkMenuItem } from './menu-item';
import { Subject } from 'rxjs';
import { Directionality } from '@angular/cdk/bidi';
import { MenuStack, MenuStackItem } from './menu-stack';
import { Menu } from './menu-interface';
import { PointerFocusTracker } from './pointer-focus-tracker';
import { MenuAim } from './menu-aim';
import * as i0 from "@angular/core";
/**
 * Abstract directive that implements shared logic common to all menus.
 * This class can be extended to create custom menu types.
 */
export declare abstract class CdkMenuBase extends CdkMenuGroup implements Menu, AfterContentInit, OnDestroy {
    /** The Angular zone. */
    protected ngZone: NgZone;
    /** The stack of menus this menu belongs to. */
    readonly menuStack: MenuStack;
    /** The menu aim service used by this menu. */
    protected readonly menuAim?: MenuAim | undefined;
    /** The directionality of the current page. */
    protected readonly dir?: Directionality | undefined;
    /** The id of the menu's host element. */
    id: string;
    /** All child MenuItem elements nested in this Menu. */
    readonly items: QueryList<CdkMenuItem>;
    /** The direction items in the menu flow. */
    orientation: 'horizontal' | 'vertical';
    /** Whether the menu is displayed inline (i.e. always present vs a conditional popup that the user triggers with a trigger element). */
    isInline: boolean;
    /** The menu's native DOM host element. */
    readonly nativeElement: HTMLElement;
    /** Handles keyboard events for the menu. */
    protected keyManager: FocusKeyManager<CdkMenuItem>;
    /** Emits when the MenuBar is destroyed. */
    protected readonly destroyed: Subject<void>;
    /** The Menu Item which triggered the open submenu. */
    protected triggerItem?: CdkMenuItem;
    /** Tracks the users mouse movements over the menu. */
    protected pointerTracker?: PointerFocusTracker<CdkMenuItem>;
    /** Whether this menu's menu stack has focus. */
    private _menuStackHasFocus;
    protected constructor(
    /** The host element. */
    elementRef: ElementRef<HTMLElement>, 
    /** The Angular zone. */
    ngZone: NgZone, 
    /** The stack of menus this menu belongs to. */
    menuStack: MenuStack, 
    /** The menu aim service used by this menu. */
    menuAim?: MenuAim | undefined, 
    /** The directionality of the current page. */
    dir?: Directionality | undefined);
    ngAfterContentInit(): void;
    ngOnDestroy(): void;
    /**
     * Place focus on the first MenuItem in the menu and set the focus origin.
     * @param focusOrigin The origin input mode of the focus event.
     */
    focusFirstItem(focusOrigin?: FocusOrigin): void;
    /**
     * Place focus on the last MenuItem in the menu and set the focus origin.
     * @param focusOrigin The origin input mode of the focus event.
     */
    focusLastItem(focusOrigin?: FocusOrigin): void;
    /** Gets the tabindex for this menu. */
    _getTabIndex(): 0 | -1 | null;
    /**
     * Close the open menu if the current active item opened the requested MenuStackItem.
     * @param menu The menu requested to be closed.
     * @param options Options to configure the behavior on close.
     *   - `focusParentTrigger` Whether to focus the parent trigger after closing the menu.
     */
    protected closeOpenMenu(menu: MenuStackItem, options?: {
        focusParentTrigger?: boolean;
    }): void;
    /** Setup the FocusKeyManager with the correct orientation for the menu. */
    private _setKeyManager;
    /**
     * Subscribe to the menu trigger's open events in order to track the trigger which opened the menu
     * and stop tracking it when the menu is closed.
     */
    private _subscribeToMenuOpen;
    /** Subscribe to the MenuStack close events. */
    private _subscribeToMenuStackClosed;
    /** Subscribe to the MenuStack hasFocus events. */
    private _subscribeToMenuStackHasFocus;
    /**
     * Set the PointerFocusTracker and ensure that when mouse focus changes the key manager is updated
     * with the latest menu item under mouse focus.
     */
    private _setUpPointerTracker;
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkMenuBase, [null, null, null, { optional: true; self: true; }, { optional: true; }]>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkMenuBase, never, never, { "id": "id"; }, {}, ["items"], never, false>;
}
