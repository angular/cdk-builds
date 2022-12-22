/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, ElementRef, inject, NgZone } from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { Overlay, OverlayConfig, STANDARD_DROPDOWN_ADJACENT_POSITIONS, STANDARD_DROPDOWN_BELOW_POSITIONS, } from '@angular/cdk/overlay';
import { DOWN_ARROW, ENTER, hasModifierKey, LEFT_ARROW, RIGHT_ARROW, SPACE, UP_ARROW, } from '@angular/cdk/keycodes';
import { _getEventTarget } from '@angular/cdk/platform';
import { fromEvent } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { CDK_MENU } from './menu-interface';
import { PARENT_OR_NEW_MENU_STACK_PROVIDER } from './menu-stack';
import { MENU_AIM } from './menu-aim';
import { CdkMenuTriggerBase, MENU_TRIGGER } from './menu-trigger-base';
import * as i0 from "@angular/core";
/**
 * A directive that turns its host element into a trigger for a popup menu.
 * It can be combined with cdkMenuItem to create sub-menus. If the element is in a top level
 * MenuBar it will open the menu on click, or if a sibling is already opened it will open on hover.
 * If it is inside of a Menu it will open the attached Submenu on hover regardless of its sibling
 * state.
 */
export class CdkMenuTrigger extends CdkMenuTriggerBase {
    constructor() {
        super();
        /** The host element. */
        this._elementRef = inject(ElementRef);
        /** The CDK overlay service. */
        this._overlay = inject(Overlay);
        /** The Angular zone. */
        this._ngZone = inject(NgZone);
        /** The parent menu this trigger belongs to. */
        this._parentMenu = inject(CDK_MENU, { optional: true });
        /** The menu aim service used by this menu. */
        this._menuAim = inject(MENU_AIM, { optional: true });
        /** The directionality of the page. */
        this._directionality = inject(Directionality, { optional: true });
        this._setRole();
        this._registerCloseHandler();
        this._subscribeToMenuStackClosed();
        this._subscribeToMouseEnter();
        this._subscribeToMenuStackHasFocus();
        this._setType();
    }
    /** Toggle the attached menu. */
    toggle() {
        this.isOpen() ? this.close() : this.open();
    }
    /** Open the attached menu. */
    open() {
        if (!this.isOpen() && this.menuTemplateRef != null) {
            this.opened.next();
            this.overlayRef = this.overlayRef || this._overlay.create(this._getOverlayConfig());
            this.overlayRef.attach(this.getMenuContentPortal());
            this._subscribeToOutsideClicks();
        }
    }
    /** Close the opened menu. */
    close() {
        if (this.isOpen()) {
            this.closed.next();
            this.overlayRef.detach();
        }
        this._closeSiblingTriggers();
    }
    /**
     * Get a reference to the rendered Menu if the Menu is open and rendered in the DOM.
     */
    getMenu() {
        return this.childMenu;
    }
    /**
     * Handles keyboard events for the menu item.
     * @param event The keyboard event to handle
     */
    _toggleOnKeydown(event) {
        const isParentVertical = this._parentMenu?.orientation === 'vertical';
        switch (event.keyCode) {
            case SPACE:
            case ENTER:
                if (!hasModifierKey(event)) {
                    event.preventDefault();
                    this.toggle();
                    this.childMenu?.focusFirstItem('keyboard');
                }
                break;
            case RIGHT_ARROW:
                if (!hasModifierKey(event)) {
                    if (this._parentMenu && isParentVertical && this._directionality?.value !== 'rtl') {
                        event.preventDefault();
                        this.open();
                        this.childMenu?.focusFirstItem('keyboard');
                    }
                }
                break;
            case LEFT_ARROW:
                if (!hasModifierKey(event)) {
                    if (this._parentMenu && isParentVertical && this._directionality?.value === 'rtl') {
                        event.preventDefault();
                        this.open();
                        this.childMenu?.focusFirstItem('keyboard');
                    }
                }
                break;
            case DOWN_ARROW:
            case UP_ARROW:
                if (!hasModifierKey(event)) {
                    if (!isParentVertical) {
                        event.preventDefault();
                        this.open();
                        event.keyCode === DOWN_ARROW
                            ? this.childMenu?.focusFirstItem('keyboard')
                            : this.childMenu?.focusLastItem('keyboard');
                    }
                }
                break;
        }
    }
    /**
     * Sets whether the trigger's menu stack has focus.
     * @param hasFocus Whether the menu stack has focus.
     */
    _setHasFocus(hasFocus) {
        if (!this._parentMenu) {
            this.menuStack.setHasFocus(hasFocus);
        }
    }
    /**
     * Subscribe to the mouseenter events and close any sibling menu items if this element is moused
     * into.
     */
    _subscribeToMouseEnter() {
        this._ngZone.runOutsideAngular(() => {
            fromEvent(this._elementRef.nativeElement, 'mouseenter')
                .pipe(filter(() => !this.menuStack.isEmpty() && !this.isOpen()), takeUntil(this.destroyed))
                .subscribe(() => {
                // Closes any sibling menu items and opens the menu associated with this trigger.
                const toggleMenus = () => this._ngZone.run(() => {
                    this._closeSiblingTriggers();
                    this.open();
                });
                if (this._menuAim) {
                    this._menuAim.toggle(toggleMenus);
                }
                else {
                    toggleMenus();
                }
            });
        });
    }
    /** Close out any sibling menu trigger menus. */
    _closeSiblingTriggers() {
        if (this._parentMenu) {
            // If nothing was removed from the stack and the last element is not the parent item
            // that means that the parent menu is a menu bar since we don't put the menu bar on the
            // stack
            const isParentMenuBar = !this.menuStack.closeSubMenuOf(this._parentMenu) &&
                this.menuStack.peek() !== this._parentMenu;
            if (isParentMenuBar) {
                this.menuStack.closeAll();
            }
        }
        else {
            this.menuStack.closeAll();
        }
    }
    /** Get the configuration object used to create the overlay. */
    _getOverlayConfig() {
        return new OverlayConfig({
            positionStrategy: this._getOverlayPositionStrategy(),
            scrollStrategy: this._overlay.scrollStrategies.reposition(),
            direction: this._directionality || undefined,
        });
    }
    /** Build the position strategy for the overlay which specifies where to place the menu. */
    _getOverlayPositionStrategy() {
        return this._overlay
            .position()
            .flexibleConnectedTo(this._elementRef)
            .withLockedPosition()
            .withGrowAfterOpen()
            .withPositions(this._getOverlayPositions());
    }
    /** Get the preferred positions for the opened menu relative to the menu item. */
    _getOverlayPositions() {
        return (this.menuPosition ??
            (!this._parentMenu || this._parentMenu.orientation === 'horizontal'
                ? STANDARD_DROPDOWN_BELOW_POSITIONS
                : STANDARD_DROPDOWN_ADJACENT_POSITIONS));
    }
    /**
     * Subscribe to the MenuStack close events if this is a standalone trigger and close out the menu
     * this triggers when requested.
     */
    _registerCloseHandler() {
        if (!this._parentMenu) {
            this.menuStack.closed.pipe(takeUntil(this.destroyed)).subscribe(({ item }) => {
                if (item === this.childMenu) {
                    this.close();
                }
            });
        }
    }
    /**
     * Subscribe to the overlays outside pointer events stream and handle closing out the stack if a
     * click occurs outside the menus.
     */
    _subscribeToOutsideClicks() {
        if (this.overlayRef) {
            this.overlayRef
                .outsidePointerEvents()
                .pipe(takeUntil(this.stopOutsideClicksListener))
                .subscribe(event => {
                const target = _getEventTarget(event);
                const element = this._elementRef.nativeElement;
                if (target !== element && !element.contains(target)) {
                    if (!this.isElementInsideMenuStack(target)) {
                        this.menuStack.closeAll();
                    }
                    else {
                        this._closeSiblingTriggers();
                    }
                }
            });
        }
    }
    /** Subscribe to the MenuStack hasFocus events. */
    _subscribeToMenuStackHasFocus() {
        if (!this._parentMenu) {
            this.menuStack.hasFocus.pipe(takeUntil(this.destroyed)).subscribe(hasFocus => {
                if (!hasFocus) {
                    this.menuStack.closeAll();
                }
            });
        }
    }
    /** Subscribe to the MenuStack closed events. */
    _subscribeToMenuStackClosed() {
        if (!this._parentMenu) {
            this.menuStack.closed.subscribe(({ focusParentTrigger }) => {
                if (focusParentTrigger && !this.menuStack.length()) {
                    this._elementRef.nativeElement.focus();
                }
            });
        }
    }
    /** Sets the role attribute for this trigger if needed. */
    _setRole() {
        // If this trigger is part of another menu, the cdkMenuItem directive will handle setting the
        // role, otherwise this is a standalone trigger, and we should ensure it has role="button".
        if (!this._parentMenu) {
            this._elementRef.nativeElement.setAttribute('role', 'button');
        }
    }
    /** Sets thte `type` attribute of the trigger. */
    _setType() {
        const element = this._elementRef.nativeElement;
        if (element.nodeName === 'BUTTON' && !element.getAttribute('type')) {
            // Prevents form submissions.
            element.setAttribute('type', 'button');
        }
    }
}
CdkMenuTrigger.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.1.0-next.3", ngImport: i0, type: CdkMenuTrigger, deps: [], target: i0.ɵɵFactoryTarget.Directive });
CdkMenuTrigger.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "15.1.0-next.3", type: CdkMenuTrigger, isStandalone: true, selector: "[cdkMenuTriggerFor]", inputs: { menuTemplateRef: ["cdkMenuTriggerFor", "menuTemplateRef"], menuPosition: ["cdkMenuPosition", "menuPosition"], menuData: ["cdkMenuTriggerData", "menuData"] }, outputs: { opened: "cdkMenuOpened", closed: "cdkMenuClosed" }, host: { listeners: { "focusin": "_setHasFocus(true)", "focusout": "_setHasFocus(false)", "keydown": "_toggleOnKeydown($event)", "click": "toggle()" }, properties: { "attr.aria-haspopup": "menuTemplateRef ? \"menu\" : null", "attr.aria-expanded": "menuTemplateRef == null ? null : isOpen()" }, classAttribute: "cdk-menu-trigger" }, providers: [
        { provide: MENU_TRIGGER, useExisting: CdkMenuTrigger },
        PARENT_OR_NEW_MENU_STACK_PROVIDER,
    ], exportAs: ["cdkMenuTriggerFor"], usesInheritance: true, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.1.0-next.3", ngImport: i0, type: CdkMenuTrigger, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkMenuTriggerFor]',
                    exportAs: 'cdkMenuTriggerFor',
                    standalone: true,
                    host: {
                        'class': 'cdk-menu-trigger',
                        '[attr.aria-haspopup]': 'menuTemplateRef ? "menu" : null',
                        '[attr.aria-expanded]': 'menuTemplateRef == null ? null : isOpen()',
                        '(focusin)': '_setHasFocus(true)',
                        '(focusout)': '_setHasFocus(false)',
                        '(keydown)': '_toggleOnKeydown($event)',
                        '(click)': 'toggle()',
                    },
                    inputs: [
                        'menuTemplateRef: cdkMenuTriggerFor',
                        'menuPosition: cdkMenuPosition',
                        'menuData: cdkMenuTriggerData',
                    ],
                    outputs: ['opened: cdkMenuOpened', 'closed: cdkMenuClosed'],
                    providers: [
                        { provide: MENU_TRIGGER, useExisting: CdkMenuTrigger },
                        PARENT_OR_NEW_MENU_STACK_PROVIDER,
                    ],
                }]
        }], ctorParameters: function () { return []; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS10cmlnZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9tZW51L21lbnUtdHJpZ2dlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFZLE1BQU0sZUFBZSxDQUFDO0FBQy9FLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBR0wsT0FBTyxFQUNQLGFBQWEsRUFDYixvQ0FBb0MsRUFDcEMsaUNBQWlDLEdBQ2xDLE1BQU0sc0JBQXNCLENBQUM7QUFDOUIsT0FBTyxFQUNMLFVBQVUsRUFDVixLQUFLLEVBQ0wsY0FBYyxFQUNkLFVBQVUsRUFDVixXQUFXLEVBQ1gsS0FBSyxFQUNMLFFBQVEsR0FDVCxNQUFNLHVCQUF1QixDQUFDO0FBQy9CLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQy9CLE9BQU8sRUFBQyxNQUFNLEVBQUUsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDakQsT0FBTyxFQUFDLFFBQVEsRUFBTyxNQUFNLGtCQUFrQixDQUFDO0FBQ2hELE9BQU8sRUFBQyxpQ0FBaUMsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUMvRCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQzs7QUFFckU7Ozs7OztHQU1HO0FBeUJILE1BQU0sT0FBTyxjQUFlLFNBQVEsa0JBQWtCO0lBbUJwRDtRQUNFLEtBQUssRUFBRSxDQUFDO1FBbkJWLHdCQUF3QjtRQUNQLGdCQUFXLEdBQTRCLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUUzRSwrQkFBK0I7UUFDZCxhQUFRLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRTVDLHdCQUF3QjtRQUNQLFlBQU8sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFMUMsK0NBQStDO1FBQzlCLGdCQUFXLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO1FBRWxFLDhDQUE4QztRQUM3QixhQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO1FBRS9ELHNDQUFzQztRQUNyQixvQkFBZSxHQUFHLE1BQU0sQ0FBQyxjQUFjLEVBQUUsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztRQUkxRSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDaEIsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7UUFDN0IsSUFBSSxDQUFDLDJCQUEyQixFQUFFLENBQUM7UUFDbkMsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7UUFDOUIsSUFBSSxDQUFDLDZCQUE2QixFQUFFLENBQUM7UUFDckMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ2xCLENBQUM7SUFFRCxnQ0FBZ0M7SUFDaEMsTUFBTTtRQUNKLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDN0MsQ0FBQztJQUVELDhCQUE4QjtJQUM5QixJQUFJO1FBQ0YsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxJQUFJLENBQUMsZUFBZSxJQUFJLElBQUksRUFBRTtZQUNsRCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1lBRW5CLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDO1lBQ3BGLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUM7WUFDcEQsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7U0FDbEM7SUFDSCxDQUFDO0lBRUQsNkJBQTZCO0lBQzdCLEtBQUs7UUFDSCxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRTtZQUNqQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1lBRW5CLElBQUksQ0FBQyxVQUFXLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDM0I7UUFDRCxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxPQUFPO1FBQ0wsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQ3hCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxnQkFBZ0IsQ0FBQyxLQUFvQjtRQUNuQyxNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsV0FBVyxLQUFLLFVBQVUsQ0FBQztRQUN0RSxRQUFRLEtBQUssQ0FBQyxPQUFPLEVBQUU7WUFDckIsS0FBSyxLQUFLLENBQUM7WUFDWCxLQUFLLEtBQUs7Z0JBQ1IsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsRUFBRTtvQkFDMUIsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO29CQUN2QixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ2QsSUFBSSxDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7aUJBQzVDO2dCQUNELE1BQU07WUFFUixLQUFLLFdBQVc7Z0JBQ2QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsRUFBRTtvQkFDMUIsSUFBSSxJQUFJLENBQUMsV0FBVyxJQUFJLGdCQUFnQixJQUFJLElBQUksQ0FBQyxlQUFlLEVBQUUsS0FBSyxLQUFLLEtBQUssRUFBRTt3QkFDakYsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO3dCQUN2QixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBQ1osSUFBSSxDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7cUJBQzVDO2lCQUNGO2dCQUNELE1BQU07WUFFUixLQUFLLFVBQVU7Z0JBQ2IsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsRUFBRTtvQkFDMUIsSUFBSSxJQUFJLENBQUMsV0FBVyxJQUFJLGdCQUFnQixJQUFJLElBQUksQ0FBQyxlQUFlLEVBQUUsS0FBSyxLQUFLLEtBQUssRUFBRTt3QkFDakYsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO3dCQUN2QixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBQ1osSUFBSSxDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7cUJBQzVDO2lCQUNGO2dCQUNELE1BQU07WUFFUixLQUFLLFVBQVUsQ0FBQztZQUNoQixLQUFLLFFBQVE7Z0JBQ1gsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsRUFBRTtvQkFDMUIsSUFBSSxDQUFDLGdCQUFnQixFQUFFO3dCQUNyQixLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7d0JBQ3ZCLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQzt3QkFDWixLQUFLLENBQUMsT0FBTyxLQUFLLFVBQVU7NEJBQzFCLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQyxVQUFVLENBQUM7NEJBQzVDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztxQkFDL0M7aUJBQ0Y7Z0JBQ0QsTUFBTTtTQUNUO0lBQ0gsQ0FBQztJQUVEOzs7T0FHRztJQUNILFlBQVksQ0FBQyxRQUFpQjtRQUM1QixJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNyQixJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUN0QztJQUNILENBQUM7SUFFRDs7O09BR0c7SUFDSyxzQkFBc0I7UUFDNUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUU7WUFDbEMsU0FBUyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQztpQkFDcEQsSUFBSSxDQUNILE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFDekQsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FDMUI7aUJBQ0EsU0FBUyxDQUFDLEdBQUcsRUFBRTtnQkFDZCxpRkFBaUY7Z0JBQ2pGLE1BQU0sV0FBVyxHQUFHLEdBQUcsRUFBRSxDQUN2QixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUU7b0JBQ3BCLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO29CQUM3QixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLENBQUM7Z0JBRUwsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO29CQUNqQixJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztpQkFDbkM7cUJBQU07b0JBQ0wsV0FBVyxFQUFFLENBQUM7aUJBQ2Y7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELGdEQUFnRDtJQUN4QyxxQkFBcUI7UUFDM0IsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ3BCLG9GQUFvRjtZQUNwRix1RkFBdUY7WUFDdkYsUUFBUTtZQUNSLE1BQU0sZUFBZSxHQUNuQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7Z0JBQ2hELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLEtBQUssSUFBSSxDQUFDLFdBQVcsQ0FBQztZQUU3QyxJQUFJLGVBQWUsRUFBRTtnQkFDbkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQzthQUMzQjtTQUNGO2FBQU07WUFDTCxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDO1NBQzNCO0lBQ0gsQ0FBQztJQUVELCtEQUErRDtJQUN2RCxpQkFBaUI7UUFDdkIsT0FBTyxJQUFJLGFBQWEsQ0FBQztZQUN2QixnQkFBZ0IsRUFBRSxJQUFJLENBQUMsMkJBQTJCLEVBQUU7WUFDcEQsY0FBYyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFO1lBQzNELFNBQVMsRUFBRSxJQUFJLENBQUMsZUFBZSxJQUFJLFNBQVM7U0FDN0MsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELDJGQUEyRjtJQUNuRiwyQkFBMkI7UUFDakMsT0FBTyxJQUFJLENBQUMsUUFBUTthQUNqQixRQUFRLEVBQUU7YUFDVixtQkFBbUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO2FBQ3JDLGtCQUFrQixFQUFFO2FBQ3BCLGlCQUFpQixFQUFFO2FBQ25CLGFBQWEsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDO0lBQ2hELENBQUM7SUFFRCxpRkFBaUY7SUFDekUsb0JBQW9CO1FBQzFCLE9BQU8sQ0FDTCxJQUFJLENBQUMsWUFBWTtZQUNqQixDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsS0FBSyxZQUFZO2dCQUNqRSxDQUFDLENBQUMsaUNBQWlDO2dCQUNuQyxDQUFDLENBQUMsb0NBQW9DLENBQUMsQ0FDMUMsQ0FBQztJQUNKLENBQUM7SUFFRDs7O09BR0c7SUFDSyxxQkFBcUI7UUFDM0IsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDckIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFDLElBQUksRUFBQyxFQUFFLEVBQUU7Z0JBQ3pFLElBQUksSUFBSSxLQUFLLElBQUksQ0FBQyxTQUFTLEVBQUU7b0JBQzNCLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztpQkFDZDtZQUNILENBQUMsQ0FBQyxDQUFDO1NBQ0o7SUFDSCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0sseUJBQXlCO1FBQy9CLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNuQixJQUFJLENBQUMsVUFBVTtpQkFDWixvQkFBb0IsRUFBRTtpQkFDdEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsQ0FBQztpQkFDL0MsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNqQixNQUFNLE1BQU0sR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFZLENBQUM7Z0JBQ2pELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDO2dCQUUvQyxJQUFJLE1BQU0sS0FBSyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFO29CQUNuRCxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxFQUFFO3dCQUMxQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDO3FCQUMzQjt5QkFBTTt3QkFDTCxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztxQkFDOUI7aUJBQ0Y7WUFDSCxDQUFDLENBQUMsQ0FBQztTQUNOO0lBQ0gsQ0FBQztJQUVELGtEQUFrRDtJQUMxQyw2QkFBNkI7UUFDbkMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDckIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQzNFLElBQUksQ0FBQyxRQUFRLEVBQUU7b0JBQ2IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztpQkFDM0I7WUFDSCxDQUFDLENBQUMsQ0FBQztTQUNKO0lBQ0gsQ0FBQztJQUVELGdEQUFnRDtJQUN4QywyQkFBMkI7UUFDakMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDckIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBQyxrQkFBa0IsRUFBQyxFQUFFLEVBQUU7Z0JBQ3ZELElBQUksa0JBQWtCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxFQUFFO29CQUNsRCxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztpQkFDeEM7WUFDSCxDQUFDLENBQUMsQ0FBQztTQUNKO0lBQ0gsQ0FBQztJQUVELDBEQUEwRDtJQUNsRCxRQUFRO1FBQ2QsNkZBQTZGO1FBQzdGLDJGQUEyRjtRQUMzRixJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNyQixJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQy9EO0lBQ0gsQ0FBQztJQUVELGlEQUFpRDtJQUN6QyxRQUFRO1FBQ2QsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUM7UUFFL0MsSUFBSSxPQUFPLENBQUMsUUFBUSxLQUFLLFFBQVEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDbEUsNkJBQTZCO1lBQzdCLE9BQU8sQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ3hDO0lBQ0gsQ0FBQzs7a0hBblJVLGNBQWM7c0dBQWQsY0FBYyxvbkJBTGQ7UUFDVCxFQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBQztRQUNwRCxpQ0FBaUM7S0FDbEM7a0dBRVUsY0FBYztrQkF4QjFCLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLHFCQUFxQjtvQkFDL0IsUUFBUSxFQUFFLG1CQUFtQjtvQkFDN0IsVUFBVSxFQUFFLElBQUk7b0JBQ2hCLElBQUksRUFBRTt3QkFDSixPQUFPLEVBQUUsa0JBQWtCO3dCQUMzQixzQkFBc0IsRUFBRSxpQ0FBaUM7d0JBQ3pELHNCQUFzQixFQUFFLDJDQUEyQzt3QkFDbkUsV0FBVyxFQUFFLG9CQUFvQjt3QkFDakMsWUFBWSxFQUFFLHFCQUFxQjt3QkFDbkMsV0FBVyxFQUFFLDBCQUEwQjt3QkFDdkMsU0FBUyxFQUFFLFVBQVU7cUJBQ3RCO29CQUNELE1BQU0sRUFBRTt3QkFDTixvQ0FBb0M7d0JBQ3BDLCtCQUErQjt3QkFDL0IsOEJBQThCO3FCQUMvQjtvQkFDRCxPQUFPLEVBQUUsQ0FBQyx1QkFBdUIsRUFBRSx1QkFBdUIsQ0FBQztvQkFDM0QsU0FBUyxFQUFFO3dCQUNULEVBQUMsT0FBTyxFQUFFLFlBQVksRUFBRSxXQUFXLGdCQUFnQixFQUFDO3dCQUNwRCxpQ0FBaUM7cUJBQ2xDO2lCQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aXZlLCBFbGVtZW50UmVmLCBpbmplY3QsIE5nWm9uZSwgT25EZXN0cm95fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7XG4gIENvbm5lY3RlZFBvc2l0aW9uLFxuICBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3ksXG4gIE92ZXJsYXksXG4gIE92ZXJsYXlDb25maWcsXG4gIFNUQU5EQVJEX0RST1BET1dOX0FESkFDRU5UX1BPU0lUSU9OUyxcbiAgU1RBTkRBUkRfRFJPUERPV05fQkVMT1dfUE9TSVRJT05TLFxufSBmcm9tICdAYW5ndWxhci9jZGsvb3ZlcmxheSc7XG5pbXBvcnQge1xuICBET1dOX0FSUk9XLFxuICBFTlRFUixcbiAgaGFzTW9kaWZpZXJLZXksXG4gIExFRlRfQVJST1csXG4gIFJJR0hUX0FSUk9XLFxuICBTUEFDRSxcbiAgVVBfQVJST1csXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9rZXljb2Rlcyc7XG5pbXBvcnQge19nZXRFdmVudFRhcmdldH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7ZnJvbUV2ZW50fSBmcm9tICdyeGpzJztcbmltcG9ydCB7ZmlsdGVyLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7Q0RLX01FTlUsIE1lbnV9IGZyb20gJy4vbWVudS1pbnRlcmZhY2UnO1xuaW1wb3J0IHtQQVJFTlRfT1JfTkVXX01FTlVfU1RBQ0tfUFJPVklERVJ9IGZyb20gJy4vbWVudS1zdGFjayc7XG5pbXBvcnQge01FTlVfQUlNfSBmcm9tICcuL21lbnUtYWltJztcbmltcG9ydCB7Q2RrTWVudVRyaWdnZXJCYXNlLCBNRU5VX1RSSUdHRVJ9IGZyb20gJy4vbWVudS10cmlnZ2VyLWJhc2UnO1xuXG4vKipcbiAqIEEgZGlyZWN0aXZlIHRoYXQgdHVybnMgaXRzIGhvc3QgZWxlbWVudCBpbnRvIGEgdHJpZ2dlciBmb3IgYSBwb3B1cCBtZW51LlxuICogSXQgY2FuIGJlIGNvbWJpbmVkIHdpdGggY2RrTWVudUl0ZW0gdG8gY3JlYXRlIHN1Yi1tZW51cy4gSWYgdGhlIGVsZW1lbnQgaXMgaW4gYSB0b3AgbGV2ZWxcbiAqIE1lbnVCYXIgaXQgd2lsbCBvcGVuIHRoZSBtZW51IG9uIGNsaWNrLCBvciBpZiBhIHNpYmxpbmcgaXMgYWxyZWFkeSBvcGVuZWQgaXQgd2lsbCBvcGVuIG9uIGhvdmVyLlxuICogSWYgaXQgaXMgaW5zaWRlIG9mIGEgTWVudSBpdCB3aWxsIG9wZW4gdGhlIGF0dGFjaGVkIFN1Ym1lbnUgb24gaG92ZXIgcmVnYXJkbGVzcyBvZiBpdHMgc2libGluZ1xuICogc3RhdGUuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtNZW51VHJpZ2dlckZvcl0nLFxuICBleHBvcnRBczogJ2Nka01lbnVUcmlnZ2VyRm9yJyxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstbWVudS10cmlnZ2VyJyxcbiAgICAnW2F0dHIuYXJpYS1oYXNwb3B1cF0nOiAnbWVudVRlbXBsYXRlUmVmID8gXCJtZW51XCIgOiBudWxsJyxcbiAgICAnW2F0dHIuYXJpYS1leHBhbmRlZF0nOiAnbWVudVRlbXBsYXRlUmVmID09IG51bGwgPyBudWxsIDogaXNPcGVuKCknLFxuICAgICcoZm9jdXNpbiknOiAnX3NldEhhc0ZvY3VzKHRydWUpJyxcbiAgICAnKGZvY3Vzb3V0KSc6ICdfc2V0SGFzRm9jdXMoZmFsc2UpJyxcbiAgICAnKGtleWRvd24pJzogJ190b2dnbGVPbktleWRvd24oJGV2ZW50KScsXG4gICAgJyhjbGljayknOiAndG9nZ2xlKCknLFxuICB9LFxuICBpbnB1dHM6IFtcbiAgICAnbWVudVRlbXBsYXRlUmVmOiBjZGtNZW51VHJpZ2dlckZvcicsXG4gICAgJ21lbnVQb3NpdGlvbjogY2RrTWVudVBvc2l0aW9uJyxcbiAgICAnbWVudURhdGE6IGNka01lbnVUcmlnZ2VyRGF0YScsXG4gIF0sXG4gIG91dHB1dHM6IFsnb3BlbmVkOiBjZGtNZW51T3BlbmVkJywgJ2Nsb3NlZDogY2RrTWVudUNsb3NlZCddLFxuICBwcm92aWRlcnM6IFtcbiAgICB7cHJvdmlkZTogTUVOVV9UUklHR0VSLCB1c2VFeGlzdGluZzogQ2RrTWVudVRyaWdnZXJ9LFxuICAgIFBBUkVOVF9PUl9ORVdfTUVOVV9TVEFDS19QUk9WSURFUixcbiAgXSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrTWVudVRyaWdnZXIgZXh0ZW5kcyBDZGtNZW51VHJpZ2dlckJhc2UgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogVGhlIGhvc3QgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gPSBpbmplY3QoRWxlbWVudFJlZik7XG5cbiAgLyoqIFRoZSBDREsgb3ZlcmxheSBzZXJ2aWNlLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9vdmVybGF5ID0gaW5qZWN0KE92ZXJsYXkpO1xuXG4gIC8qKiBUaGUgQW5ndWxhciB6b25lLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9uZ1pvbmUgPSBpbmplY3QoTmdab25lKTtcblxuICAvKiogVGhlIHBhcmVudCBtZW51IHRoaXMgdHJpZ2dlciBiZWxvbmdzIHRvLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9wYXJlbnRNZW51ID0gaW5qZWN0KENES19NRU5VLCB7b3B0aW9uYWw6IHRydWV9KTtcblxuICAvKiogVGhlIG1lbnUgYWltIHNlcnZpY2UgdXNlZCBieSB0aGlzIG1lbnUuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX21lbnVBaW0gPSBpbmplY3QoTUVOVV9BSU0sIHtvcHRpb25hbDogdHJ1ZX0pO1xuXG4gIC8qKiBUaGUgZGlyZWN0aW9uYWxpdHkgb2YgdGhlIHBhZ2UuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX2RpcmVjdGlvbmFsaXR5ID0gaW5qZWN0KERpcmVjdGlvbmFsaXR5LCB7b3B0aW9uYWw6IHRydWV9KTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX3NldFJvbGUoKTtcbiAgICB0aGlzLl9yZWdpc3RlckNsb3NlSGFuZGxlcigpO1xuICAgIHRoaXMuX3N1YnNjcmliZVRvTWVudVN0YWNrQ2xvc2VkKCk7XG4gICAgdGhpcy5fc3Vic2NyaWJlVG9Nb3VzZUVudGVyKCk7XG4gICAgdGhpcy5fc3Vic2NyaWJlVG9NZW51U3RhY2tIYXNGb2N1cygpO1xuICAgIHRoaXMuX3NldFR5cGUoKTtcbiAgfVxuXG4gIC8qKiBUb2dnbGUgdGhlIGF0dGFjaGVkIG1lbnUuICovXG4gIHRvZ2dsZSgpIHtcbiAgICB0aGlzLmlzT3BlbigpID8gdGhpcy5jbG9zZSgpIDogdGhpcy5vcGVuKCk7XG4gIH1cblxuICAvKiogT3BlbiB0aGUgYXR0YWNoZWQgbWVudS4gKi9cbiAgb3BlbigpIHtcbiAgICBpZiAoIXRoaXMuaXNPcGVuKCkgJiYgdGhpcy5tZW51VGVtcGxhdGVSZWYgIT0gbnVsbCkge1xuICAgICAgdGhpcy5vcGVuZWQubmV4dCgpO1xuXG4gICAgICB0aGlzLm92ZXJsYXlSZWYgPSB0aGlzLm92ZXJsYXlSZWYgfHwgdGhpcy5fb3ZlcmxheS5jcmVhdGUodGhpcy5fZ2V0T3ZlcmxheUNvbmZpZygpKTtcbiAgICAgIHRoaXMub3ZlcmxheVJlZi5hdHRhY2godGhpcy5nZXRNZW51Q29udGVudFBvcnRhbCgpKTtcbiAgICAgIHRoaXMuX3N1YnNjcmliZVRvT3V0c2lkZUNsaWNrcygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDbG9zZSB0aGUgb3BlbmVkIG1lbnUuICovXG4gIGNsb3NlKCkge1xuICAgIGlmICh0aGlzLmlzT3BlbigpKSB7XG4gICAgICB0aGlzLmNsb3NlZC5uZXh0KCk7XG5cbiAgICAgIHRoaXMub3ZlcmxheVJlZiEuZGV0YWNoKCk7XG4gICAgfVxuICAgIHRoaXMuX2Nsb3NlU2libGluZ1RyaWdnZXJzKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcmVmZXJlbmNlIHRvIHRoZSByZW5kZXJlZCBNZW51IGlmIHRoZSBNZW51IGlzIG9wZW4gYW5kIHJlbmRlcmVkIGluIHRoZSBET00uXG4gICAqL1xuICBnZXRNZW51KCk6IE1lbnUgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmNoaWxkTWVudTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIGtleWJvYXJkIGV2ZW50cyBmb3IgdGhlIG1lbnUgaXRlbS5cbiAgICogQHBhcmFtIGV2ZW50IFRoZSBrZXlib2FyZCBldmVudCB0byBoYW5kbGVcbiAgICovXG4gIF90b2dnbGVPbktleWRvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcbiAgICBjb25zdCBpc1BhcmVudFZlcnRpY2FsID0gdGhpcy5fcGFyZW50TWVudT8ub3JpZW50YXRpb24gPT09ICd2ZXJ0aWNhbCc7XG4gICAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG4gICAgICBjYXNlIFNQQUNFOlxuICAgICAgY2FzZSBFTlRFUjpcbiAgICAgICAgaWYgKCFoYXNNb2RpZmllcktleShldmVudCkpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHRoaXMudG9nZ2xlKCk7XG4gICAgICAgICAgdGhpcy5jaGlsZE1lbnU/LmZvY3VzRmlyc3RJdGVtKCdrZXlib2FyZCcpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIFJJR0hUX0FSUk9XOlxuICAgICAgICBpZiAoIWhhc01vZGlmaWVyS2V5KGV2ZW50KSkge1xuICAgICAgICAgIGlmICh0aGlzLl9wYXJlbnRNZW51ICYmIGlzUGFyZW50VmVydGljYWwgJiYgdGhpcy5fZGlyZWN0aW9uYWxpdHk/LnZhbHVlICE9PSAncnRsJykge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMub3BlbigpO1xuICAgICAgICAgICAgdGhpcy5jaGlsZE1lbnU/LmZvY3VzRmlyc3RJdGVtKCdrZXlib2FyZCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBMRUZUX0FSUk9XOlxuICAgICAgICBpZiAoIWhhc01vZGlmaWVyS2V5KGV2ZW50KSkge1xuICAgICAgICAgIGlmICh0aGlzLl9wYXJlbnRNZW51ICYmIGlzUGFyZW50VmVydGljYWwgJiYgdGhpcy5fZGlyZWN0aW9uYWxpdHk/LnZhbHVlID09PSAncnRsJykge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMub3BlbigpO1xuICAgICAgICAgICAgdGhpcy5jaGlsZE1lbnU/LmZvY3VzRmlyc3RJdGVtKCdrZXlib2FyZCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBET1dOX0FSUk9XOlxuICAgICAgY2FzZSBVUF9BUlJPVzpcbiAgICAgICAgaWYgKCFoYXNNb2RpZmllcktleShldmVudCkpIHtcbiAgICAgICAgICBpZiAoIWlzUGFyZW50VmVydGljYWwpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLm9wZW4oKTtcbiAgICAgICAgICAgIGV2ZW50LmtleUNvZGUgPT09IERPV05fQVJST1dcbiAgICAgICAgICAgICAgPyB0aGlzLmNoaWxkTWVudT8uZm9jdXNGaXJzdEl0ZW0oJ2tleWJvYXJkJylcbiAgICAgICAgICAgICAgOiB0aGlzLmNoaWxkTWVudT8uZm9jdXNMYXN0SXRlbSgna2V5Ym9hcmQnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgd2hldGhlciB0aGUgdHJpZ2dlcidzIG1lbnUgc3RhY2sgaGFzIGZvY3VzLlxuICAgKiBAcGFyYW0gaGFzRm9jdXMgV2hldGhlciB0aGUgbWVudSBzdGFjayBoYXMgZm9jdXMuXG4gICAqL1xuICBfc2V0SGFzRm9jdXMoaGFzRm9jdXM6IGJvb2xlYW4pIHtcbiAgICBpZiAoIXRoaXMuX3BhcmVudE1lbnUpIHtcbiAgICAgIHRoaXMubWVudVN0YWNrLnNldEhhc0ZvY3VzKGhhc0ZvY3VzKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU3Vic2NyaWJlIHRvIHRoZSBtb3VzZWVudGVyIGV2ZW50cyBhbmQgY2xvc2UgYW55IHNpYmxpbmcgbWVudSBpdGVtcyBpZiB0aGlzIGVsZW1lbnQgaXMgbW91c2VkXG4gICAqIGludG8uXG4gICAqL1xuICBwcml2YXRlIF9zdWJzY3JpYmVUb01vdXNlRW50ZXIoKSB7XG4gICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIGZyb21FdmVudCh0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsICdtb3VzZWVudGVyJylcbiAgICAgICAgLnBpcGUoXG4gICAgICAgICAgZmlsdGVyKCgpID0+ICF0aGlzLm1lbnVTdGFjay5pc0VtcHR5KCkgJiYgIXRoaXMuaXNPcGVuKCkpLFxuICAgICAgICAgIHRha2VVbnRpbCh0aGlzLmRlc3Ryb3llZCksXG4gICAgICAgIClcbiAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgLy8gQ2xvc2VzIGFueSBzaWJsaW5nIG1lbnUgaXRlbXMgYW5kIG9wZW5zIHRoZSBtZW51IGFzc29jaWF0ZWQgd2l0aCB0aGlzIHRyaWdnZXIuXG4gICAgICAgICAgY29uc3QgdG9nZ2xlTWVudXMgPSAoKSA9PlxuICAgICAgICAgICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMuX2Nsb3NlU2libGluZ1RyaWdnZXJzKCk7XG4gICAgICAgICAgICAgIHRoaXMub3BlbigpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICBpZiAodGhpcy5fbWVudUFpbSkge1xuICAgICAgICAgICAgdGhpcy5fbWVudUFpbS50b2dnbGUodG9nZ2xlTWVudXMpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0b2dnbGVNZW51cygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogQ2xvc2Ugb3V0IGFueSBzaWJsaW5nIG1lbnUgdHJpZ2dlciBtZW51cy4gKi9cbiAgcHJpdmF0ZSBfY2xvc2VTaWJsaW5nVHJpZ2dlcnMoKSB7XG4gICAgaWYgKHRoaXMuX3BhcmVudE1lbnUpIHtcbiAgICAgIC8vIElmIG5vdGhpbmcgd2FzIHJlbW92ZWQgZnJvbSB0aGUgc3RhY2sgYW5kIHRoZSBsYXN0IGVsZW1lbnQgaXMgbm90IHRoZSBwYXJlbnQgaXRlbVxuICAgICAgLy8gdGhhdCBtZWFucyB0aGF0IHRoZSBwYXJlbnQgbWVudSBpcyBhIG1lbnUgYmFyIHNpbmNlIHdlIGRvbid0IHB1dCB0aGUgbWVudSBiYXIgb24gdGhlXG4gICAgICAvLyBzdGFja1xuICAgICAgY29uc3QgaXNQYXJlbnRNZW51QmFyID1cbiAgICAgICAgIXRoaXMubWVudVN0YWNrLmNsb3NlU3ViTWVudU9mKHRoaXMuX3BhcmVudE1lbnUpICYmXG4gICAgICAgIHRoaXMubWVudVN0YWNrLnBlZWsoKSAhPT0gdGhpcy5fcGFyZW50TWVudTtcblxuICAgICAgaWYgKGlzUGFyZW50TWVudUJhcikge1xuICAgICAgICB0aGlzLm1lbnVTdGFjay5jbG9zZUFsbCgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm1lbnVTdGFjay5jbG9zZUFsbCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBHZXQgdGhlIGNvbmZpZ3VyYXRpb24gb2JqZWN0IHVzZWQgdG8gY3JlYXRlIHRoZSBvdmVybGF5LiAqL1xuICBwcml2YXRlIF9nZXRPdmVybGF5Q29uZmlnKCkge1xuICAgIHJldHVybiBuZXcgT3ZlcmxheUNvbmZpZyh7XG4gICAgICBwb3NpdGlvblN0cmF0ZWd5OiB0aGlzLl9nZXRPdmVybGF5UG9zaXRpb25TdHJhdGVneSgpLFxuICAgICAgc2Nyb2xsU3RyYXRlZ3k6IHRoaXMuX292ZXJsYXkuc2Nyb2xsU3RyYXRlZ2llcy5yZXBvc2l0aW9uKCksXG4gICAgICBkaXJlY3Rpb246IHRoaXMuX2RpcmVjdGlvbmFsaXR5IHx8IHVuZGVmaW5lZCxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBCdWlsZCB0aGUgcG9zaXRpb24gc3RyYXRlZ3kgZm9yIHRoZSBvdmVybGF5IHdoaWNoIHNwZWNpZmllcyB3aGVyZSB0byBwbGFjZSB0aGUgbWVudS4gKi9cbiAgcHJpdmF0ZSBfZ2V0T3ZlcmxheVBvc2l0aW9uU3RyYXRlZ3koKTogRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5IHtcbiAgICByZXR1cm4gdGhpcy5fb3ZlcmxheVxuICAgICAgLnBvc2l0aW9uKClcbiAgICAgIC5mbGV4aWJsZUNvbm5lY3RlZFRvKHRoaXMuX2VsZW1lbnRSZWYpXG4gICAgICAud2l0aExvY2tlZFBvc2l0aW9uKClcbiAgICAgIC53aXRoR3Jvd0FmdGVyT3BlbigpXG4gICAgICAud2l0aFBvc2l0aW9ucyh0aGlzLl9nZXRPdmVybGF5UG9zaXRpb25zKCkpO1xuICB9XG5cbiAgLyoqIEdldCB0aGUgcHJlZmVycmVkIHBvc2l0aW9ucyBmb3IgdGhlIG9wZW5lZCBtZW51IHJlbGF0aXZlIHRvIHRoZSBtZW51IGl0ZW0uICovXG4gIHByaXZhdGUgX2dldE92ZXJsYXlQb3NpdGlvbnMoKTogQ29ubmVjdGVkUG9zaXRpb25bXSB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMubWVudVBvc2l0aW9uID8/XG4gICAgICAoIXRoaXMuX3BhcmVudE1lbnUgfHwgdGhpcy5fcGFyZW50TWVudS5vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnXG4gICAgICAgID8gU1RBTkRBUkRfRFJPUERPV05fQkVMT1dfUE9TSVRJT05TXG4gICAgICAgIDogU1RBTkRBUkRfRFJPUERPV05fQURKQUNFTlRfUE9TSVRJT05TKVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogU3Vic2NyaWJlIHRvIHRoZSBNZW51U3RhY2sgY2xvc2UgZXZlbnRzIGlmIHRoaXMgaXMgYSBzdGFuZGFsb25lIHRyaWdnZXIgYW5kIGNsb3NlIG91dCB0aGUgbWVudVxuICAgKiB0aGlzIHRyaWdnZXJzIHdoZW4gcmVxdWVzdGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVnaXN0ZXJDbG9zZUhhbmRsZXIoKSB7XG4gICAgaWYgKCF0aGlzLl9wYXJlbnRNZW51KSB7XG4gICAgICB0aGlzLm1lbnVTdGFjay5jbG9zZWQucGlwZSh0YWtlVW50aWwodGhpcy5kZXN0cm95ZWQpKS5zdWJzY3JpYmUoKHtpdGVtfSkgPT4ge1xuICAgICAgICBpZiAoaXRlbSA9PT0gdGhpcy5jaGlsZE1lbnUpIHtcbiAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJzY3JpYmUgdG8gdGhlIG92ZXJsYXlzIG91dHNpZGUgcG9pbnRlciBldmVudHMgc3RyZWFtIGFuZCBoYW5kbGUgY2xvc2luZyBvdXQgdGhlIHN0YWNrIGlmIGFcbiAgICogY2xpY2sgb2NjdXJzIG91dHNpZGUgdGhlIG1lbnVzLlxuICAgKi9cbiAgcHJpdmF0ZSBfc3Vic2NyaWJlVG9PdXRzaWRlQ2xpY2tzKCkge1xuICAgIGlmICh0aGlzLm92ZXJsYXlSZWYpIHtcbiAgICAgIHRoaXMub3ZlcmxheVJlZlxuICAgICAgICAub3V0c2lkZVBvaW50ZXJFdmVudHMoKVxuICAgICAgICAucGlwZSh0YWtlVW50aWwodGhpcy5zdG9wT3V0c2lkZUNsaWNrc0xpc3RlbmVyKSlcbiAgICAgICAgLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICAgICAgY29uc3QgdGFyZ2V0ID0gX2dldEV2ZW50VGFyZ2V0KGV2ZW50KSBhcyBFbGVtZW50O1xuICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG5cbiAgICAgICAgICBpZiAodGFyZ2V0ICE9PSBlbGVtZW50ICYmICFlbGVtZW50LmNvbnRhaW5zKHRhcmdldCkpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc0VsZW1lbnRJbnNpZGVNZW51U3RhY2sodGFyZ2V0KSkge1xuICAgICAgICAgICAgICB0aGlzLm1lbnVTdGFjay5jbG9zZUFsbCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5fY2xvc2VTaWJsaW5nVHJpZ2dlcnMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTdWJzY3JpYmUgdG8gdGhlIE1lbnVTdGFjayBoYXNGb2N1cyBldmVudHMuICovXG4gIHByaXZhdGUgX3N1YnNjcmliZVRvTWVudVN0YWNrSGFzRm9jdXMoKSB7XG4gICAgaWYgKCF0aGlzLl9wYXJlbnRNZW51KSB7XG4gICAgICB0aGlzLm1lbnVTdGFjay5oYXNGb2N1cy5waXBlKHRha2VVbnRpbCh0aGlzLmRlc3Ryb3llZCkpLnN1YnNjcmliZShoYXNGb2N1cyA9PiB7XG4gICAgICAgIGlmICghaGFzRm9jdXMpIHtcbiAgICAgICAgICB0aGlzLm1lbnVTdGFjay5jbG9zZUFsbCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKiogU3Vic2NyaWJlIHRvIHRoZSBNZW51U3RhY2sgY2xvc2VkIGV2ZW50cy4gKi9cbiAgcHJpdmF0ZSBfc3Vic2NyaWJlVG9NZW51U3RhY2tDbG9zZWQoKSB7XG4gICAgaWYgKCF0aGlzLl9wYXJlbnRNZW51KSB7XG4gICAgICB0aGlzLm1lbnVTdGFjay5jbG9zZWQuc3Vic2NyaWJlKCh7Zm9jdXNQYXJlbnRUcmlnZ2VyfSkgPT4ge1xuICAgICAgICBpZiAoZm9jdXNQYXJlbnRUcmlnZ2VyICYmICF0aGlzLm1lbnVTdGFjay5sZW5ndGgoKSkge1xuICAgICAgICAgIHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5mb2N1cygpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKiogU2V0cyB0aGUgcm9sZSBhdHRyaWJ1dGUgZm9yIHRoaXMgdHJpZ2dlciBpZiBuZWVkZWQuICovXG4gIHByaXZhdGUgX3NldFJvbGUoKSB7XG4gICAgLy8gSWYgdGhpcyB0cmlnZ2VyIGlzIHBhcnQgb2YgYW5vdGhlciBtZW51LCB0aGUgY2RrTWVudUl0ZW0gZGlyZWN0aXZlIHdpbGwgaGFuZGxlIHNldHRpbmcgdGhlXG4gICAgLy8gcm9sZSwgb3RoZXJ3aXNlIHRoaXMgaXMgYSBzdGFuZGFsb25lIHRyaWdnZXIsIGFuZCB3ZSBzaG91bGQgZW5zdXJlIGl0IGhhcyByb2xlPVwiYnV0dG9uXCIuXG4gICAgaWYgKCF0aGlzLl9wYXJlbnRNZW51KSB7XG4gICAgICB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuc2V0QXR0cmlidXRlKCdyb2xlJywgJ2J1dHRvbicpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTZXRzIHRodGUgYHR5cGVgIGF0dHJpYnV0ZSBvZiB0aGUgdHJpZ2dlci4gKi9cbiAgcHJpdmF0ZSBfc2V0VHlwZSgpIHtcbiAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50O1xuXG4gICAgaWYgKGVsZW1lbnQubm9kZU5hbWUgPT09ICdCVVRUT04nICYmICFlbGVtZW50LmdldEF0dHJpYnV0ZSgndHlwZScpKSB7XG4gICAgICAvLyBQcmV2ZW50cyBmb3JtIHN1Ym1pc3Npb25zLlxuICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAnYnV0dG9uJyk7XG4gICAgfVxuICB9XG59XG4iXX0=