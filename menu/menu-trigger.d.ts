/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef, Injector, NgZone, OnDestroy, ViewContainerRef } from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { Overlay } from '@angular/cdk/overlay';
import { Menu } from './menu-interface';
import { MenuStack } from './menu-stack';
import { MenuAim } from './menu-aim';
import { CdkMenuTriggerBase } from './menu-trigger-base';
import * as i0 from "@angular/core";
/**
 * A directive that turns its host element into a trigger for a popup menu.
 * It can be combined with cdkMenuItem to create sub-menus. If the element is in a top level
 * MenuBar it will open the menu on click, or if a sibling is already opened it will open on hover.
 * If it is inside of a Menu it will open the attached Submenu on hover regardless of its sibling
 * state.
 */
export declare class CdkMenuTrigger extends CdkMenuTriggerBase implements OnDestroy {
    /** The host element. */
    private readonly _elementRef;
    /** The CDK overlay service. */
    private readonly _overlay;
    /** The Angular zone. */
    private readonly _ngZone;
    /** The parent menu this trigger belongs to. */
    private readonly _parentMenu?;
    /** The menu aim service used by this menu. */
    private readonly _menuAim?;
    /** The directionality of the page. */
    private readonly _directionality?;
    constructor(
    /** The DI injector for this component. */
    injector: Injector, 
    /** The host element. */
    _elementRef: ElementRef<HTMLElement>, 
    /** The view container ref for this component. */
    viewContainerRef: ViewContainerRef, 
    /** The CDK overlay service. */
    _overlay: Overlay, 
    /** The Angular zone. */
    _ngZone: NgZone, 
    /** The menu stack this trigger belongs to. */
    menuStack: MenuStack, 
    /** The parent menu this trigger belongs to. */
    _parentMenu?: Menu | undefined, 
    /** The menu aim service used by this menu. */
    _menuAim?: MenuAim | undefined, 
    /** The directionality of the page. */
    _directionality?: Directionality | undefined);
    /** Toggle the attached menu. */
    toggle(): void;
    /** Open the attached menu. */
    open(): void;
    /** Close the opened menu. */
    close(): void;
    /**
     * Get a reference to the rendered Menu if the Menu is open and rendered in the DOM.
     */
    getMenu(): Menu | undefined;
    /**
     * Handles keyboard events for the menu item.
     * @param event The keyboard event to handle
     */
    _toggleOnKeydown(event: KeyboardEvent): void;
    /**
     * Sets whether the trigger's menu stack has focus.
     * @param hasFocus Whether the menu stack has focus.
     */
    _setHasFocus(hasFocus: boolean): void;
    /**
     * Subscribe to the mouseenter events and close any sibling menu items if this element is moused
     * into.
     */
    private _subscribeToMouseEnter;
    /** Close out any sibling menu trigger menus. */
    private _closeSiblingTriggers;
    /** Get the configuration object used to create the overlay. */
    private _getOverlayConfig;
    /** Build the position strategy for the overlay which specifies where to place the menu. */
    private _getOverlayPositionStrategy;
    /** Get the preferred positions for the opened menu relative to the menu item. */
    private _getOverlayPositions;
    /**
     * Subscribe to the MenuStack close events if this is a standalone trigger and close out the menu
     * this triggers when requested.
     */
    private _registerCloseHandler;
    /**
     * Subscribe to the overlays outside pointer events stream and handle closing out the stack if a
     * click occurs outside the menus.
     */
    private _subscribeToOutsideClicks;
    /** Subscribe to the MenuStack hasFocus events. */
    private _subscribeToMenuStackHasFocus;
    /** Subscribe to the MenuStack closed events. */
    private _subscribeToMenuStackClosed;
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkMenuTrigger, [null, null, null, null, null, null, { optional: true; }, { optional: true; }, { optional: true; }]>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkMenuTrigger, "[cdkMenuTriggerFor]", ["cdkMenuTriggerFor"], { "menuTemplateRef": "cdkMenuTriggerFor"; "menuPosition": "cdkMenuPosition"; }, { "opened": "cdkMenuOpened"; "closed": "cdkMenuClosed"; }, never, never, false>;
}
