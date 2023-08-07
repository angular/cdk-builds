/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, ElementRef, inject, NgZone } from '@angular/core';
import { InputModalityDetector } from '@angular/cdk/a11y';
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
import { eventDispatchesNativeClick } from './event-detection';
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
        this._elementRef = inject(ElementRef);
        this._overlay = inject(Overlay);
        this._ngZone = inject(NgZone);
        this._inputModalityDetector = inject(InputModalityDetector);
        this._directionality = inject(Directionality, { optional: true });
        /** The parent menu this trigger belongs to. */
        this._parentMenu = inject(CDK_MENU, { optional: true });
        /** The menu aim service used by this menu. */
        this._menuAim = inject(MENU_AIM, { optional: true });
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
                // Skip events that will trigger clicks so the handler doesn't get triggered twice.
                if (!hasModifierKey(event) && !eventDispatchesNativeClick(this._elementRef, event)) {
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
    /** Handles clicks on the menu trigger. */
    _handleClick() {
        this.toggle();
        this.childMenu?.focusFirstItem('mouse');
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
                .pipe(filter(() => {
                return (
                // Skip fake `mouseenter` events dispatched by touch devices.
                this._inputModalityDetector.mostRecentModality !== 'touch' &&
                    !this.menuStack.isEmpty() &&
                    !this.isOpen());
            }), takeUntil(this.destroyed))
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: CdkMenuTrigger, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.1.1", type: CdkMenuTrigger, isStandalone: true, selector: "[cdkMenuTriggerFor]", inputs: { menuTemplateRef: ["cdkMenuTriggerFor", "menuTemplateRef"], menuPosition: ["cdkMenuPosition", "menuPosition"], menuData: ["cdkMenuTriggerData", "menuData"] }, outputs: { opened: "cdkMenuOpened", closed: "cdkMenuClosed" }, host: { listeners: { "focusin": "_setHasFocus(true)", "focusout": "_setHasFocus(false)", "keydown": "_toggleOnKeydown($event)", "click": "_handleClick()" }, properties: { "attr.aria-haspopup": "menuTemplateRef ? \"menu\" : null", "attr.aria-expanded": "menuTemplateRef == null ? null : isOpen()" }, classAttribute: "cdk-menu-trigger" }, providers: [
            { provide: MENU_TRIGGER, useExisting: CdkMenuTrigger },
            PARENT_OR_NEW_MENU_STACK_PROVIDER,
        ], exportAs: ["cdkMenuTriggerFor"], usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: CdkMenuTrigger, decorators: [{
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
                        '(click)': '_handleClick()',
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS10cmlnZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9tZW51L21lbnUtdHJpZ2dlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFZLE1BQU0sZUFBZSxDQUFDO0FBQy9FLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3hELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBR0wsT0FBTyxFQUNQLGFBQWEsRUFDYixvQ0FBb0MsRUFDcEMsaUNBQWlDLEdBQ2xDLE1BQU0sc0JBQXNCLENBQUM7QUFDOUIsT0FBTyxFQUNMLFVBQVUsRUFDVixLQUFLLEVBQ0wsY0FBYyxFQUNkLFVBQVUsRUFDVixXQUFXLEVBQ1gsS0FBSyxFQUNMLFFBQVEsR0FDVCxNQUFNLHVCQUF1QixDQUFDO0FBQy9CLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQy9CLE9BQU8sRUFBQyxNQUFNLEVBQUUsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDakQsT0FBTyxFQUFDLFFBQVEsRUFBTyxNQUFNLGtCQUFrQixDQUFDO0FBQ2hELE9BQU8sRUFBQyxpQ0FBaUMsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUMvRCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNyRSxPQUFPLEVBQUMsMEJBQTBCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQzs7QUFFN0Q7Ozs7OztHQU1HO0FBeUJILE1BQU0sT0FBTyxjQUFlLFNBQVEs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LElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDO1FBRS9DLElBQUksT0FBTyxDQUFDLFFBQVEsS0FBSyxRQUFRLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ2xFLDZCQUE2QjtZQUM3QixPQUFPLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztTQUN4QztJQUNILENBQUM7OEdBMVJVLGNBQWM7a0dBQWQsY0FBYywwbkJBTGQ7WUFDVCxFQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBQztZQUNwRCxpQ0FBaUM7U0FDbEM7OzJGQUVVLGNBQWM7a0JBeEIxQixTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSxxQkFBcUI7b0JBQy9CLFFBQVEsRUFBRSxtQkFBbUI7b0JBQzdCLFVBQVUsRUFBRSxJQUFJO29CQUNoQixJQUFJLEVBQUU7d0JBQ0osT0FBTyxFQUFFLGtCQUFrQjt3QkFDM0Isc0JBQXNCLEVBQUUsaUNBQWlDO3dCQUN6RCxzQkFBc0IsRUFBRSwyQ0FBMkM7d0JBQ25FLFdBQVcsRUFBRSxvQkFBb0I7d0JBQ2pDLFlBQVksRUFBRSxxQkFBcUI7d0JBQ25DLFdBQVcsRUFBRSwwQkFBMEI7d0JBQ3ZDLFNBQVMsRUFBRSxnQkFBZ0I7cUJBQzVCO29CQUNELE1BQU0sRUFBRTt3QkFDTixvQ0FBb0M7d0JBQ3BDLCtCQUErQjt3QkFDL0IsOEJBQThCO3FCQUMvQjtvQkFDRCxPQUFPLEVBQUUsQ0FBQyx1QkFBdUIsRUFBRSx1QkFBdUIsQ0FBQztvQkFDM0QsU0FBUyxFQUFFO3dCQUNULEVBQUMsT0FBTyxFQUFFLFlBQVksRUFBRSxXQUFXLGdCQUFnQixFQUFDO3dCQUNwRCxpQ0FBaUM7cUJBQ2xDO2lCQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aXZlLCBFbGVtZW50UmVmLCBpbmplY3QsIE5nWm9uZSwgT25EZXN0cm95fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7SW5wdXRNb2RhbGl0eURldGVjdG9yfSBmcm9tICdAYW5ndWxhci9jZGsvYTExeSc7XG5pbXBvcnQge0RpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge1xuICBDb25uZWN0ZWRQb3NpdGlvbixcbiAgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5LFxuICBPdmVybGF5LFxuICBPdmVybGF5Q29uZmlnLFxuICBTVEFOREFSRF9EUk9QRE9XTl9BREpBQ0VOVF9QT1NJVElPTlMsXG4gIFNUQU5EQVJEX0RST1BET1dOX0JFTE9XX1BPU0lUSU9OUyxcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL292ZXJsYXknO1xuaW1wb3J0IHtcbiAgRE9XTl9BUlJPVyxcbiAgRU5URVIsXG4gIGhhc01vZGlmaWVyS2V5LFxuICBMRUZUX0FSUk9XLFxuICBSSUdIVF9BUlJPVyxcbiAgU1BBQ0UsXG4gIFVQX0FSUk9XLFxufSBmcm9tICdAYW5ndWxhci9jZGsva2V5Y29kZXMnO1xuaW1wb3J0IHtfZ2V0RXZlbnRUYXJnZXR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge2Zyb21FdmVudH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2ZpbHRlciwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge0NES19NRU5VLCBNZW51fSBmcm9tICcuL21lbnUtaW50ZXJmYWNlJztcbmltcG9ydCB7UEFSRU5UX09SX05FV19NRU5VX1NUQUNLX1BST1ZJREVSfSBmcm9tICcuL21lbnUtc3RhY2snO1xuaW1wb3J0IHtNRU5VX0FJTX0gZnJvbSAnLi9tZW51LWFpbSc7XG5pbXBvcnQge0Nka01lbnVUcmlnZ2VyQmFzZSwgTUVOVV9UUklHR0VSfSBmcm9tICcuL21lbnUtdHJpZ2dlci1iYXNlJztcbmltcG9ydCB7ZXZlbnREaXNwYXRjaGVzTmF0aXZlQ2xpY2t9IGZyb20gJy4vZXZlbnQtZGV0ZWN0aW9uJztcblxuLyoqXG4gKiBBIGRpcmVjdGl2ZSB0aGF0IHR1cm5zIGl0cyBob3N0IGVsZW1lbnQgaW50byBhIHRyaWdnZXIgZm9yIGEgcG9wdXAgbWVudS5cbiAqIEl0IGNhbiBiZSBjb21iaW5lZCB3aXRoIGNka01lbnVJdGVtIHRvIGNyZWF0ZSBzdWItbWVudXMuIElmIHRoZSBlbGVtZW50IGlzIGluIGEgdG9wIGxldmVsXG4gKiBNZW51QmFyIGl0IHdpbGwgb3BlbiB0aGUgbWVudSBvbiBjbGljaywgb3IgaWYgYSBzaWJsaW5nIGlzIGFscmVhZHkgb3BlbmVkIGl0IHdpbGwgb3BlbiBvbiBob3Zlci5cbiAqIElmIGl0IGlzIGluc2lkZSBvZiBhIE1lbnUgaXQgd2lsbCBvcGVuIHRoZSBhdHRhY2hlZCBTdWJtZW51IG9uIGhvdmVyIHJlZ2FyZGxlc3Mgb2YgaXRzIHNpYmxpbmdcbiAqIHN0YXRlLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrTWVudVRyaWdnZXJGb3JdJyxcbiAgZXhwb3J0QXM6ICdjZGtNZW51VHJpZ2dlckZvcicsXG4gIHN0YW5kYWxvbmU6IHRydWUsXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLW1lbnUtdHJpZ2dlcicsXG4gICAgJ1thdHRyLmFyaWEtaGFzcG9wdXBdJzogJ21lbnVUZW1wbGF0ZVJlZiA/IFwibWVudVwiIDogbnVsbCcsXG4gICAgJ1thdHRyLmFyaWEtZXhwYW5kZWRdJzogJ21lbnVUZW1wbGF0ZVJlZiA9PSBudWxsID8gbnVsbCA6IGlzT3BlbigpJyxcbiAgICAnKGZvY3VzaW4pJzogJ19zZXRIYXNGb2N1cyh0cnVlKScsXG4gICAgJyhmb2N1c291dCknOiAnX3NldEhhc0ZvY3VzKGZhbHNlKScsXG4gICAgJyhrZXlkb3duKSc6ICdfdG9nZ2xlT25LZXlkb3duKCRldmVudCknLFxuICAgICcoY2xpY2spJzogJ19oYW5kbGVDbGljaygpJyxcbiAgfSxcbiAgaW5wdXRzOiBbXG4gICAgJ21lbnVUZW1wbGF0ZVJlZjogY2RrTWVudVRyaWdnZXJGb3InLFxuICAgICdtZW51UG9zaXRpb246IGNka01lbnVQb3NpdGlvbicsXG4gICAgJ21lbnVEYXRhOiBjZGtNZW51VHJpZ2dlckRhdGEnLFxuICBdLFxuICBvdXRwdXRzOiBbJ29wZW5lZDogY2RrTWVudU9wZW5lZCcsICdjbG9zZWQ6IGNka01lbnVDbG9zZWQnXSxcbiAgcHJvdmlkZXJzOiBbXG4gICAge3Byb3ZpZGU6IE1FTlVfVFJJR0dFUiwgdXNlRXhpc3Rpbmc6IENka01lbnVUcmlnZ2VyfSxcbiAgICBQQVJFTlRfT1JfTkVXX01FTlVfU1RBQ0tfUFJPVklERVIsXG4gIF0sXG59KVxuZXhwb3J0IGNsYXNzIENka01lbnVUcmlnZ2VyIGV4dGVuZHMgQ2RrTWVudVRyaWdnZXJCYXNlIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSByZWFkb25seSBfZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gPSBpbmplY3QoRWxlbWVudFJlZik7XG4gIHByaXZhdGUgcmVhZG9ubHkgX292ZXJsYXkgPSBpbmplY3QoT3ZlcmxheSk7XG4gIHByaXZhdGUgcmVhZG9ubHkgX25nWm9uZSA9IGluamVjdChOZ1pvbmUpO1xuICBwcml2YXRlIHJlYWRvbmx5IF9pbnB1dE1vZGFsaXR5RGV0ZWN0b3IgPSBpbmplY3QoSW5wdXRNb2RhbGl0eURldGVjdG9yKTtcbiAgcHJpdmF0ZSByZWFkb25seSBfZGlyZWN0aW9uYWxpdHkgPSBpbmplY3QoRGlyZWN0aW9uYWxpdHksIHtvcHRpb25hbDogdHJ1ZX0pO1xuXG4gIC8qKiBUaGUgcGFyZW50IG1lbnUgdGhpcyB0cmlnZ2VyIGJlbG9uZ3MgdG8uICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX3BhcmVudE1lbnUgPSBpbmplY3QoQ0RLX01FTlUsIHtvcHRpb25hbDogdHJ1ZX0pO1xuXG4gIC8qKiBUaGUgbWVudSBhaW0gc2VydmljZSB1c2VkIGJ5IHRoaXMgbWVudS4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfbWVudUFpbSA9IGluamVjdChNRU5VX0FJTSwge29wdGlvbmFsOiB0cnVlfSk7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9zZXRSb2xlKCk7XG4gICAgdGhpcy5fcmVnaXN0ZXJDbG9zZUhhbmRsZXIoKTtcbiAgICB0aGlzLl9zdWJzY3JpYmVUb01lbnVTdGFja0Nsb3NlZCgpO1xuICAgIHRoaXMuX3N1YnNjcmliZVRvTW91c2VFbnRlcigpO1xuICAgIHRoaXMuX3N1YnNjcmliZVRvTWVudVN0YWNrSGFzRm9jdXMoKTtcbiAgICB0aGlzLl9zZXRUeXBlKCk7XG4gIH1cblxuICAvKiogVG9nZ2xlIHRoZSBhdHRhY2hlZCBtZW51LiAqL1xuICB0b2dnbGUoKSB7XG4gICAgdGhpcy5pc09wZW4oKSA/IHRoaXMuY2xvc2UoKSA6IHRoaXMub3BlbigpO1xuICB9XG5cbiAgLyoqIE9wZW4gdGhlIGF0dGFjaGVkIG1lbnUuICovXG4gIG9wZW4oKSB7XG4gICAgaWYgKCF0aGlzLmlzT3BlbigpICYmIHRoaXMubWVudVRlbXBsYXRlUmVmICE9IG51bGwpIHtcbiAgICAgIHRoaXMub3BlbmVkLm5leHQoKTtcblxuICAgICAgdGhpcy5vdmVybGF5UmVmID0gdGhpcy5vdmVybGF5UmVmIHx8IHRoaXMuX292ZXJsYXkuY3JlYXRlKHRoaXMuX2dldE92ZXJsYXlDb25maWcoKSk7XG4gICAgICB0aGlzLm92ZXJsYXlSZWYuYXR0YWNoKHRoaXMuZ2V0TWVudUNvbnRlbnRQb3J0YWwoKSk7XG4gICAgICB0aGlzLl9zdWJzY3JpYmVUb091dHNpZGVDbGlja3MoKTtcbiAgICB9XG4gIH1cblxuICAvKiogQ2xvc2UgdGhlIG9wZW5lZCBtZW51LiAqL1xuICBjbG9zZSgpIHtcbiAgICBpZiAodGhpcy5pc09wZW4oKSkge1xuICAgICAgdGhpcy5jbG9zZWQubmV4dCgpO1xuXG4gICAgICB0aGlzLm92ZXJsYXlSZWYhLmRldGFjaCgpO1xuICAgIH1cbiAgICB0aGlzLl9jbG9zZVNpYmxpbmdUcmlnZ2VycygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHJlZmVyZW5jZSB0byB0aGUgcmVuZGVyZWQgTWVudSBpZiB0aGUgTWVudSBpcyBvcGVuIGFuZCByZW5kZXJlZCBpbiB0aGUgRE9NLlxuICAgKi9cbiAgZ2V0TWVudSgpOiBNZW51IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5jaGlsZE1lbnU7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBrZXlib2FyZCBldmVudHMgZm9yIHRoZSBtZW51IGl0ZW0uXG4gICAqIEBwYXJhbSBldmVudCBUaGUga2V5Ym9hcmQgZXZlbnQgdG8gaGFuZGxlXG4gICAqL1xuICBfdG9nZ2xlT25LZXlkb3duKGV2ZW50OiBLZXlib2FyZEV2ZW50KSB7XG4gICAgY29uc3QgaXNQYXJlbnRWZXJ0aWNhbCA9IHRoaXMuX3BhcmVudE1lbnU/Lm9yaWVudGF0aW9uID09PSAndmVydGljYWwnO1xuICAgIHN3aXRjaCAoZXZlbnQua2V5Q29kZSkge1xuICAgICAgY2FzZSBTUEFDRTpcbiAgICAgIGNhc2UgRU5URVI6XG4gICAgICAgIC8vIFNraXAgZXZlbnRzIHRoYXQgd2lsbCB0cmlnZ2VyIGNsaWNrcyBzbyB0aGUgaGFuZGxlciBkb2Vzbid0IGdldCB0cmlnZ2VyZWQgdHdpY2UuXG4gICAgICAgIGlmICghaGFzTW9kaWZpZXJLZXkoZXZlbnQpICYmICFldmVudERpc3BhdGNoZXNOYXRpdmVDbGljayh0aGlzLl9lbGVtZW50UmVmLCBldmVudCkpIHtcbiAgICAgICAgICB0aGlzLnRvZ2dsZSgpO1xuICAgICAgICAgIHRoaXMuY2hpbGRNZW51Py5mb2N1c0ZpcnN0SXRlbSgna2V5Ym9hcmQnKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBSSUdIVF9BUlJPVzpcbiAgICAgICAgaWYgKCFoYXNNb2RpZmllcktleShldmVudCkpIHtcbiAgICAgICAgICBpZiAodGhpcy5fcGFyZW50TWVudSAmJiBpc1BhcmVudFZlcnRpY2FsICYmIHRoaXMuX2RpcmVjdGlvbmFsaXR5Py52YWx1ZSAhPT0gJ3J0bCcpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLm9wZW4oKTtcbiAgICAgICAgICAgIHRoaXMuY2hpbGRNZW51Py5mb2N1c0ZpcnN0SXRlbSgna2V5Ym9hcmQnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgTEVGVF9BUlJPVzpcbiAgICAgICAgaWYgKCFoYXNNb2RpZmllcktleShldmVudCkpIHtcbiAgICAgICAgICBpZiAodGhpcy5fcGFyZW50TWVudSAmJiBpc1BhcmVudFZlcnRpY2FsICYmIHRoaXMuX2RpcmVjdGlvbmFsaXR5Py52YWx1ZSA9PT0gJ3J0bCcpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLm9wZW4oKTtcbiAgICAgICAgICAgIHRoaXMuY2hpbGRNZW51Py5mb2N1c0ZpcnN0SXRlbSgna2V5Ym9hcmQnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgRE9XTl9BUlJPVzpcbiAgICAgIGNhc2UgVVBfQVJST1c6XG4gICAgICAgIGlmICghaGFzTW9kaWZpZXJLZXkoZXZlbnQpKSB7XG4gICAgICAgICAgaWYgKCFpc1BhcmVudFZlcnRpY2FsKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdGhpcy5vcGVuKCk7XG4gICAgICAgICAgICBldmVudC5rZXlDb2RlID09PSBET1dOX0FSUk9XXG4gICAgICAgICAgICAgID8gdGhpcy5jaGlsZE1lbnU/LmZvY3VzRmlyc3RJdGVtKCdrZXlib2FyZCcpXG4gICAgICAgICAgICAgIDogdGhpcy5jaGlsZE1lbnU/LmZvY3VzTGFzdEl0ZW0oJ2tleWJvYXJkJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBIYW5kbGVzIGNsaWNrcyBvbiB0aGUgbWVudSB0cmlnZ2VyLiAqL1xuICBfaGFuZGxlQ2xpY2soKSB7XG4gICAgdGhpcy50b2dnbGUoKTtcbiAgICB0aGlzLmNoaWxkTWVudT8uZm9jdXNGaXJzdEl0ZW0oJ21vdXNlJyk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB3aGV0aGVyIHRoZSB0cmlnZ2VyJ3MgbWVudSBzdGFjayBoYXMgZm9jdXMuXG4gICAqIEBwYXJhbSBoYXNGb2N1cyBXaGV0aGVyIHRoZSBtZW51IHN0YWNrIGhhcyBmb2N1cy5cbiAgICovXG4gIF9zZXRIYXNGb2N1cyhoYXNGb2N1czogYm9vbGVhbikge1xuICAgIGlmICghdGhpcy5fcGFyZW50TWVudSkge1xuICAgICAgdGhpcy5tZW51U3RhY2suc2V0SGFzRm9jdXMoaGFzRm9jdXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJzY3JpYmUgdG8gdGhlIG1vdXNlZW50ZXIgZXZlbnRzIGFuZCBjbG9zZSBhbnkgc2libGluZyBtZW51IGl0ZW1zIGlmIHRoaXMgZWxlbWVudCBpcyBtb3VzZWRcbiAgICogaW50by5cbiAgICovXG4gIHByaXZhdGUgX3N1YnNjcmliZVRvTW91c2VFbnRlcigpIHtcbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgZnJvbUV2ZW50KHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudCwgJ21vdXNlZW50ZXInKVxuICAgICAgICAucGlwZShcbiAgICAgICAgICBmaWx0ZXIoKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgLy8gU2tpcCBmYWtlIGBtb3VzZWVudGVyYCBldmVudHMgZGlzcGF0Y2hlZCBieSB0b3VjaCBkZXZpY2VzLlxuICAgICAgICAgICAgICB0aGlzLl9pbnB1dE1vZGFsaXR5RGV0ZWN0b3IubW9zdFJlY2VudE1vZGFsaXR5ICE9PSAndG91Y2gnICYmXG4gICAgICAgICAgICAgICF0aGlzLm1lbnVTdGFjay5pc0VtcHR5KCkgJiZcbiAgICAgICAgICAgICAgIXRoaXMuaXNPcGVuKClcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSksXG4gICAgICAgICAgdGFrZVVudGlsKHRoaXMuZGVzdHJveWVkKSxcbiAgICAgICAgKVxuICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAvLyBDbG9zZXMgYW55IHNpYmxpbmcgbWVudSBpdGVtcyBhbmQgb3BlbnMgdGhlIG1lbnUgYXNzb2NpYXRlZCB3aXRoIHRoaXMgdHJpZ2dlci5cbiAgICAgICAgICBjb25zdCB0b2dnbGVNZW51cyA9ICgpID0+XG4gICAgICAgICAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5fY2xvc2VTaWJsaW5nVHJpZ2dlcnMoKTtcbiAgICAgICAgICAgICAgdGhpcy5vcGVuKCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgIGlmICh0aGlzLl9tZW51QWltKSB7XG4gICAgICAgICAgICB0aGlzLl9tZW51QWltLnRvZ2dsZSh0b2dnbGVNZW51cyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRvZ2dsZU1lbnVzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBDbG9zZSBvdXQgYW55IHNpYmxpbmcgbWVudSB0cmlnZ2VyIG1lbnVzLiAqL1xuICBwcml2YXRlIF9jbG9zZVNpYmxpbmdUcmlnZ2VycygpIHtcbiAgICBpZiAodGhpcy5fcGFyZW50TWVudSkge1xuICAgICAgLy8gSWYgbm90aGluZyB3YXMgcmVtb3ZlZCBmcm9tIHRoZSBzdGFjayBhbmQgdGhlIGxhc3QgZWxlbWVudCBpcyBub3QgdGhlIHBhcmVudCBpdGVtXG4gICAgICAvLyB0aGF0IG1lYW5zIHRoYXQgdGhlIHBhcmVudCBtZW51IGlzIGEgbWVudSBiYXIgc2luY2Ugd2UgZG9uJ3QgcHV0IHRoZSBtZW51IGJhciBvbiB0aGVcbiAgICAgIC8vIHN0YWNrXG4gICAgICBjb25zdCBpc1BhcmVudE1lbnVCYXIgPVxuICAgICAgICAhdGhpcy5tZW51U3RhY2suY2xvc2VTdWJNZW51T2YodGhpcy5fcGFyZW50TWVudSkgJiZcbiAgICAgICAgdGhpcy5tZW51U3RhY2sucGVlaygpICE9PSB0aGlzLl9wYXJlbnRNZW51O1xuXG4gICAgICBpZiAoaXNQYXJlbnRNZW51QmFyKSB7XG4gICAgICAgIHRoaXMubWVudVN0YWNrLmNsb3NlQWxsKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubWVudVN0YWNrLmNsb3NlQWxsKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEdldCB0aGUgY29uZmlndXJhdGlvbiBvYmplY3QgdXNlZCB0byBjcmVhdGUgdGhlIG92ZXJsYXkuICovXG4gIHByaXZhdGUgX2dldE92ZXJsYXlDb25maWcoKSB7XG4gICAgcmV0dXJuIG5ldyBPdmVybGF5Q29uZmlnKHtcbiAgICAgIHBvc2l0aW9uU3RyYXRlZ3k6IHRoaXMuX2dldE92ZXJsYXlQb3NpdGlvblN0cmF0ZWd5KCksXG4gICAgICBzY3JvbGxTdHJhdGVneTogdGhpcy5fb3ZlcmxheS5zY3JvbGxTdHJhdGVnaWVzLnJlcG9zaXRpb24oKSxcbiAgICAgIGRpcmVjdGlvbjogdGhpcy5fZGlyZWN0aW9uYWxpdHkgfHwgdW5kZWZpbmVkLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqIEJ1aWxkIHRoZSBwb3NpdGlvbiBzdHJhdGVneSBmb3IgdGhlIG92ZXJsYXkgd2hpY2ggc3BlY2lmaWVzIHdoZXJlIHRvIHBsYWNlIHRoZSBtZW51LiAqL1xuICBwcml2YXRlIF9nZXRPdmVybGF5UG9zaXRpb25TdHJhdGVneSgpOiBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3kge1xuICAgIHJldHVybiB0aGlzLl9vdmVybGF5XG4gICAgICAucG9zaXRpb24oKVxuICAgICAgLmZsZXhpYmxlQ29ubmVjdGVkVG8odGhpcy5fZWxlbWVudFJlZilcbiAgICAgIC53aXRoTG9ja2VkUG9zaXRpb24oKVxuICAgICAgLndpdGhHcm93QWZ0ZXJPcGVuKClcbiAgICAgIC53aXRoUG9zaXRpb25zKHRoaXMuX2dldE92ZXJsYXlQb3NpdGlvbnMoKSk7XG4gIH1cblxuICAvKiogR2V0IHRoZSBwcmVmZXJyZWQgcG9zaXRpb25zIGZvciB0aGUgb3BlbmVkIG1lbnUgcmVsYXRpdmUgdG8gdGhlIG1lbnUgaXRlbS4gKi9cbiAgcHJpdmF0ZSBfZ2V0T3ZlcmxheVBvc2l0aW9ucygpOiBDb25uZWN0ZWRQb3NpdGlvbltdIHtcbiAgICByZXR1cm4gKFxuICAgICAgdGhpcy5tZW51UG9zaXRpb24gPz9cbiAgICAgICghdGhpcy5fcGFyZW50TWVudSB8fCB0aGlzLl9wYXJlbnRNZW51Lm9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCdcbiAgICAgICAgPyBTVEFOREFSRF9EUk9QRE9XTl9CRUxPV19QT1NJVElPTlNcbiAgICAgICAgOiBTVEFOREFSRF9EUk9QRE9XTl9BREpBQ0VOVF9QT1NJVElPTlMpXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJzY3JpYmUgdG8gdGhlIE1lbnVTdGFjayBjbG9zZSBldmVudHMgaWYgdGhpcyBpcyBhIHN0YW5kYWxvbmUgdHJpZ2dlciBhbmQgY2xvc2Ugb3V0IHRoZSBtZW51XG4gICAqIHRoaXMgdHJpZ2dlcnMgd2hlbiByZXF1ZXN0ZWQuXG4gICAqL1xuICBwcml2YXRlIF9yZWdpc3RlckNsb3NlSGFuZGxlcigpIHtcbiAgICBpZiAoIXRoaXMuX3BhcmVudE1lbnUpIHtcbiAgICAgIHRoaXMubWVudVN0YWNrLmNsb3NlZC5waXBlKHRha2VVbnRpbCh0aGlzLmRlc3Ryb3llZCkpLnN1YnNjcmliZSgoe2l0ZW19KSA9PiB7XG4gICAgICAgIGlmIChpdGVtID09PSB0aGlzLmNoaWxkTWVudSkge1xuICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFN1YnNjcmliZSB0byB0aGUgb3ZlcmxheXMgb3V0c2lkZSBwb2ludGVyIGV2ZW50cyBzdHJlYW0gYW5kIGhhbmRsZSBjbG9zaW5nIG91dCB0aGUgc3RhY2sgaWYgYVxuICAgKiBjbGljayBvY2N1cnMgb3V0c2lkZSB0aGUgbWVudXMuXG4gICAqL1xuICBwcml2YXRlIF9zdWJzY3JpYmVUb091dHNpZGVDbGlja3MoKSB7XG4gICAgaWYgKHRoaXMub3ZlcmxheVJlZikge1xuICAgICAgdGhpcy5vdmVybGF5UmVmXG4gICAgICAgIC5vdXRzaWRlUG9pbnRlckV2ZW50cygpXG4gICAgICAgIC5waXBlKHRha2VVbnRpbCh0aGlzLnN0b3BPdXRzaWRlQ2xpY2tzTGlzdGVuZXIpKVxuICAgICAgICAuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgICAgICBjb25zdCB0YXJnZXQgPSBfZ2V0RXZlbnRUYXJnZXQoZXZlbnQpIGFzIEVsZW1lbnQ7XG4gICAgICAgICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcblxuICAgICAgICAgIGlmICh0YXJnZXQgIT09IGVsZW1lbnQgJiYgIWVsZW1lbnQuY29udGFpbnModGFyZ2V0KSkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmlzRWxlbWVudEluc2lkZU1lbnVTdGFjayh0YXJnZXQpKSB7XG4gICAgICAgICAgICAgIHRoaXMubWVudVN0YWNrLmNsb3NlQWxsKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aGlzLl9jbG9zZVNpYmxpbmdUcmlnZ2VycygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFN1YnNjcmliZSB0byB0aGUgTWVudVN0YWNrIGhhc0ZvY3VzIGV2ZW50cy4gKi9cbiAgcHJpdmF0ZSBfc3Vic2NyaWJlVG9NZW51U3RhY2tIYXNGb2N1cygpIHtcbiAgICBpZiAoIXRoaXMuX3BhcmVudE1lbnUpIHtcbiAgICAgIHRoaXMubWVudVN0YWNrLmhhc0ZvY3VzLnBpcGUodGFrZVVudGlsKHRoaXMuZGVzdHJveWVkKSkuc3Vic2NyaWJlKGhhc0ZvY3VzID0+IHtcbiAgICAgICAgaWYgKCFoYXNGb2N1cykge1xuICAgICAgICAgIHRoaXMubWVudVN0YWNrLmNsb3NlQWxsKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTdWJzY3JpYmUgdG8gdGhlIE1lbnVTdGFjayBjbG9zZWQgZXZlbnRzLiAqL1xuICBwcml2YXRlIF9zdWJzY3JpYmVUb01lbnVTdGFja0Nsb3NlZCgpIHtcbiAgICBpZiAoIXRoaXMuX3BhcmVudE1lbnUpIHtcbiAgICAgIHRoaXMubWVudVN0YWNrLmNsb3NlZC5zdWJzY3JpYmUoKHtmb2N1c1BhcmVudFRyaWdnZXJ9KSA9PiB7XG4gICAgICAgIGlmIChmb2N1c1BhcmVudFRyaWdnZXIgJiYgIXRoaXMubWVudVN0YWNrLmxlbmd0aCgpKSB7XG4gICAgICAgICAgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSByb2xlIGF0dHJpYnV0ZSBmb3IgdGhpcyB0cmlnZ2VyIGlmIG5lZWRlZC4gKi9cbiAgcHJpdmF0ZSBfc2V0Um9sZSgpIHtcbiAgICAvLyBJZiB0aGlzIHRyaWdnZXIgaXMgcGFydCBvZiBhbm90aGVyIG1lbnUsIHRoZSBjZGtNZW51SXRlbSBkaXJlY3RpdmUgd2lsbCBoYW5kbGUgc2V0dGluZyB0aGVcbiAgICAvLyByb2xlLCBvdGhlcndpc2UgdGhpcyBpcyBhIHN0YW5kYWxvbmUgdHJpZ2dlciwgYW5kIHdlIHNob3VsZCBlbnN1cmUgaXQgaGFzIHJvbGU9XCJidXR0b25cIi5cbiAgICBpZiAoIXRoaXMuX3BhcmVudE1lbnUpIHtcbiAgICAgIHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAnYnV0dG9uJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFNldHMgdGh0ZSBgdHlwZWAgYXR0cmlidXRlIG9mIHRoZSB0cmlnZ2VyLiAqL1xuICBwcml2YXRlIF9zZXRUeXBlKCkge1xuICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG5cbiAgICBpZiAoZWxlbWVudC5ub2RlTmFtZSA9PT0gJ0JVVFRPTicgJiYgIWVsZW1lbnQuZ2V0QXR0cmlidXRlKCd0eXBlJykpIHtcbiAgICAgIC8vIFByZXZlbnRzIGZvcm0gc3VibWlzc2lvbnMuXG4gICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgndHlwZScsICdidXR0b24nKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==