/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef, EventEmitter, NgZone, OnDestroy } from '@angular/core';
import { BooleanInput } from '@angular/cdk/coercion';
import { FocusableOption } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { Subject } from 'rxjs';
import { CdkMenuTrigger } from './menu-trigger';
import { Menu } from './menu-interface';
import { MenuStack } from './menu-stack';
import { FocusableElement } from './pointer-focus-tracker';
import { MenuAim, Toggler } from './menu-aim';
import * as i0 from "@angular/core";
/**
 * Directive which provides the ability for an element to be focused and navigated to using the
 * keyboard when residing in a CdkMenu, CdkMenuBar, or CdkMenuGroup. It performs user defined
 * behavior when clicked.
 */
export declare class CdkMenuItem implements FocusableOption, FocusableElement, Toggler, OnDestroy {
    /** The host element for this item. */
    readonly _elementRef: ElementRef<HTMLElement>;
    /** The Angular zone. */
    private readonly _ngZone;
    /** The menu stack this item belongs to. */
    private readonly _menuStack;
    /** The parent menu this item belongs to. */
    private readonly _parentMenu?;
    /** The menu aim service used for this item. */
    private readonly _menuAim?;
    /** The directionality of the page. */
    private readonly _dir?;
    /** Reference to the CdkMenuItemTrigger directive if one is added to the same element */
    private readonly _menuTrigger?;
    /**  Whether the CdkMenuItem is disabled - defaults to false */
    get disabled(): boolean;
    set disabled(value: BooleanInput);
    private _disabled;
    /**
     * The text used to locate this item during menu typeahead. If not specified,
     * the `textContent` of the item will be used.
     */
    typeaheadLabel: string | null;
    /**
     * If this MenuItem is a regular MenuItem, outputs when it is triggered by a keyboard or mouse
     * event.
     */
    readonly triggered: EventEmitter<void>;
    /** Whether the menu item opens a menu. */
    readonly hasMenu: boolean;
    /**
     * The tabindex for this menu item managed internally and used for implementing roving a
     * tab index.
     */
    _tabindex: 0 | -1;
    /** Whether the item should close the menu if triggered by the spacebar. */
    protected closeOnSpacebarTrigger: boolean;
    /** Emits when the menu item is destroyed. */
    protected readonly destroyed: Subject<void>;
    constructor(
    /** The host element for this item. */
    _elementRef: ElementRef<HTMLElement>, 
    /** The Angular zone. */
    _ngZone: NgZone, 
    /** The menu stack this item belongs to. */
    _menuStack: MenuStack, 
    /** The parent menu this item belongs to. */
    _parentMenu?: Menu | undefined, 
    /** The menu aim service used for this item. */
    _menuAim?: MenuAim | undefined, 
    /** The directionality of the page. */
    _dir?: Directionality | undefined, 
    /** Reference to the CdkMenuItemTrigger directive if one is added to the same element */
    _menuTrigger?: CdkMenuTrigger | undefined);
    ngOnDestroy(): void;
    /** Place focus on the element. */
    focus(): void;
    /**
     * If the menu item is not disabled and the element does not have a menu trigger attached, emit
     * on the cdkMenuItemTriggered emitter and close all open menus.
     * @param options Options the configure how the item is triggered
     *   - keepOpen: specifies that the menu should be kept open after triggering the item.
     */
    trigger(options?: {
        keepOpen: boolean;
    }): void;
    /** Return true if this MenuItem has an attached menu and it is open. */
    isMenuOpen(): boolean;
    /**
     * Get a reference to the rendered Menu if the Menu is open and it is visible in the DOM.
     * @return the menu if it is open, otherwise undefined.
     */
    getMenu(): Menu | undefined;
    /** Get the CdkMenuTrigger associated with this element. */
    getMenuTrigger(): CdkMenuTrigger | undefined;
    /** Get the label for this element which is required by the FocusableOption interface. */
    getLabel(): string;
    /** Reset the tabindex to -1. */
    _resetTabIndex(): void;
    /**
     * Set the tab index to 0 if not disabled and it's a focus event, or a mouse enter if this element
     * is not in a menu bar.
     */
    _setTabIndex(event?: MouseEvent): void;
    /**
     * Handles keyboard events for the menu item, specifically either triggering the user defined
     * callback or opening/closing the current menu based on whether the left or right arrow key was
     * pressed.
     * @param event the keyboard event to handle
     */
    _onKeydown(event: KeyboardEvent): void;
    /** Whether this menu item is standalone or within a menu or menu bar. */
    private _isStandaloneItem;
    /**
     * Handles the user pressing the back arrow key.
     * @param event The keyboard event.
     */
    private _backArrowPressed;
    /**
     * Handles the user pressing the forward arrow key.
     * @param event The keyboard event.
     */
    private _forwardArrowPressed;
    /**
     * Subscribe to the mouseenter events and close any sibling menu items if this element is moused
     * into.
     */
    private _setupMouseEnter;
    /**
     * Return true if the enclosing parent menu is configured in a horizontal orientation, false
     * otherwise or if no parent.
     */
    private _isParentVertical;
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkMenuItem, [null, null, null, { optional: true; }, { optional: true; }, { optional: true; }, { optional: true; self: true; }]>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkMenuItem, "[cdkMenuItem]", ["cdkMenuItem"], { "disabled": "cdkMenuItemDisabled"; "typeaheadLabel": "cdkMenuitemTypeaheadLabel"; }, { "triggered": "cdkMenuItemTriggered"; }, never, never, false>;
}
