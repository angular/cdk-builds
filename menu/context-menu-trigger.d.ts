/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector, OnDestroy, ViewContainerRef } from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { Overlay } from '@angular/cdk/overlay';
import { BooleanInput } from '@angular/cdk/coercion';
import { MenuStack } from './menu-stack';
import { CdkMenuTriggerBase } from './menu-trigger-base';
import * as i0 from "@angular/core";
/** Tracks the last open context menu trigger across the entire application. */
export declare class ContextMenuTracker {
    /** The last open context menu trigger. */
    private static _openContextMenuTrigger?;
    /**
     * Close the previous open context menu and set the given one as being open.
     * @param trigger The trigger for the currently open Context Menu.
     */
    update(trigger: CdkContextMenuTrigger): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<ContextMenuTracker, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<ContextMenuTracker>;
}
/** The coordinates where the context menu should open. */
export declare type ContextMenuCoordinates = {
    x: number;
    y: number;
};
/**
 * A directive that opens a menu when a user right-clicks within its host element.
 * It is aware of nested context menus and will trigger only the lowest level non-disabled context menu.
 */
export declare class CdkContextMenuTrigger extends CdkMenuTriggerBase implements OnDestroy {
    /** The CDK overlay service */
    private readonly _overlay;
    /** The app's context menu tracking registry */
    private readonly _contextMenuTracker;
    /** The directionality of the current page */
    private readonly _directionality?;
    /** Whether the context menu is disabled. */
    get disabled(): boolean;
    set disabled(value: BooleanInput);
    private _disabled;
    constructor(
    /** The DI injector for this component */
    injector: Injector, 
    /** The view container ref for this component */
    viewContainerRef: ViewContainerRef, 
    /** The CDK overlay service */
    _overlay: Overlay, 
    /** The app's context menu tracking registry */
    _contextMenuTracker: ContextMenuTracker, 
    /** The menu stack this menu is part of. */
    menuStack: MenuStack, 
    /** The directionality of the current page */
    _directionality?: Directionality | undefined);
    /**
     * Open the attached menu at the specified location.
     * @param coordinates where to open the context menu
     */
    open(coordinates: ContextMenuCoordinates): void;
    /** Close the currently opened context menu. */
    close(): void;
    /**
     * Open the context menu and closes any previously open menus.
     * @param event the mouse event which opens the context menu.
     */
    _openOnContextMenu(event: MouseEvent): void;
    /**
     * Get the configuration object used to create the overlay.
     * @param coordinates the location to place the opened menu
     */
    private _getOverlayConfig;
    /**
     * Get the position strategy for the overlay which specifies where to place the menu.
     * @param coordinates the location to place the opened menu
     */
    private _getOverlayPositionStrategy;
    /** Subscribe to the menu stack close events and close this menu when requested. */
    private _setMenuStackCloseListener;
    /**
     * Subscribe to the overlays outside pointer events stream and handle closing out the stack if a
     * click occurs outside the menus.
     * @param ignoreFirstAuxClick Whether to ignore the first auxclick event outside the menu.
     */
    private _subscribeToOutsideClicks;
    /**
     * Open the attached menu at the specified location.
     * @param coordinates where to open the context menu
     * @param ignoreFirstOutsideAuxClick Whether to ignore the first auxclick outside the menu after opening.
     */
    private _open;
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkContextMenuTrigger, [null, null, null, null, null, { optional: true; }]>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkContextMenuTrigger, "[cdkContextMenuTriggerFor]", ["cdkContextMenuTriggerFor"], { "menuTemplateRef": "cdkContextMenuTriggerFor"; "menuPosition": "cdkContextMenuPosition"; "disabled": "cdkContextMenuDisabled"; }, { "opened": "cdkContextMenuOpened"; "closed": "cdkContextMenuClosed"; }, never, never, false>;
}
