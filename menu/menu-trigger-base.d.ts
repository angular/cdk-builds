/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EventEmitter, InjectionToken, Injector, OnDestroy, TemplateRef, ViewContainerRef } from '@angular/core';
import { Menu } from './menu-interface';
import { MenuStack } from './menu-stack';
import { ConnectedPosition, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Subject } from 'rxjs';
import * as i0 from "@angular/core";
/** Injection token used for an implementation of MenuStack. */
export declare const MENU_TRIGGER: InjectionToken<CdkMenuTriggerBase>;
/**
 * Abstract directive that implements shared logic common to all menu triggers.
 * This class can be extended to create custom menu trigger types.
 */
export declare abstract class CdkMenuTriggerBase implements OnDestroy {
    /** The DI injector for this component */
    protected readonly injector: Injector;
    /** The view container ref for this component */
    protected readonly viewContainerRef: ViewContainerRef;
    /** The menu stack this menu is part of. */
    protected readonly menuStack: MenuStack;
    /** A list of preferred menu positions to be used when constructing the `FlexibleConnectedPositionStrategy` for this trigger's menu. */
    menuPosition: ConnectedPosition[];
    /** Emits when the attached menu is requested to open */
    readonly opened: EventEmitter<void>;
    /** Emits when the attached menu is requested to close */
    readonly closed: EventEmitter<void>;
    /** Template reference variable to the menu this trigger opens */
    menuTemplateRef: TemplateRef<unknown>;
    /** A reference to the overlay which manages the triggered menu */
    protected overlayRef: OverlayRef | null;
    /** Emits when this trigger is destroyed. */
    protected readonly destroyed: Subject<void>;
    /** Emits when the outside pointer events listener on the overlay should be stopped. */
    protected readonly stopOutsideClicksListener: import("rxjs").Observable<void>;
    /** The child menu opened by this trigger. */
    protected childMenu?: Menu;
    /** The content of the menu panel opened by this trigger. */
    private _menuPortal;
    /** The injector to use for the child menu opened by this trigger. */
    private _childMenuInjector?;
    protected constructor(
    /** The DI injector for this component */
    injector: Injector, 
    /** The view container ref for this component */
    viewContainerRef: ViewContainerRef, 
    /** The menu stack this menu is part of. */
    menuStack: MenuStack);
    ngOnDestroy(): void;
    /** Whether the attached menu is open. */
    isOpen(): boolean;
    /** Registers a child menu as having been opened by this trigger. */
    registerChildMenu(child: Menu): void;
    /**
     * Get the portal to be attached to the overlay which contains the menu. Allows for the menu
     * content to change dynamically and be reflected in the application.
     */
    protected getMenuContentPortal(): TemplatePortal<any>;
    /**
     * Whether the given element is inside the scope of this trigger's menu stack.
     * @param element The element to check.
     * @return Whether the element is inside the scope of this trigger's menu stack.
     */
    protected isElementInsideMenuStack(element: Element): boolean;
    /** Destroy and unset the overlay reference it if exists */
    private _destroyOverlay;
    /** Gets the injector to use when creating a child menu. */
    private _getChildMenuInjector;
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkMenuTriggerBase, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkMenuTriggerBase, never, never, {}, {}, never, never, false>;
}
