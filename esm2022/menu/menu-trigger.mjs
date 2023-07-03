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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS10cmlnZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9tZW51L21lbnUtdHJpZ2dlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFZLE1BQU0sZUFBZSxDQUFDO0FBQy9FLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBR0wsT0FBTyxFQUNQLGFBQWEsRUFDYixvQ0FBb0MsRUFDcEMsaUNBQWlDLEdBQ2xDLE1BQU0sc0JBQXNCLENBQUM7QUFDOUIsT0FBTyxFQUNMLFVBQVUsRUFDVixLQUFLLEVBQ0wsY0FBYyxFQUNkLFVBQVUsRUFDVixXQUFXLEVBQ1gsS0FBSyxFQUNMLFFBQVEsR0FDVCxNQUFNLHVCQUF1QixDQUFDO0FBQy9CLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQy9CLE9BQU8sRUFBQyxNQUFNLEVBQUUsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDakQsT0FBTyxFQUFDLFFBQVEsRUFBTyxNQUFNLGtCQUFrQixDQUFDO0FBQ2hELE9BQU8sRUFBQyxpQ0FBaUMsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUMvRCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNyRSxPQUFPLEVBQUMsMEJBQTBCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQzs7QUFFN0Q7Ozs7OztHQU1HO0FBeUJILE1BQU0sT0FBTyxjQUFlLFNBQVEsa0JBQWtCO0lBWXBEO1FBQ0UsS0FBSyxFQUFFLENBQUM7UUFaTyxnQkFBVyxH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QUNILENBQUM7OEdBbFJVLGNBQWM7a0dBQWQsY0FBYywwbkJBTGQ7WUFDVCxFQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBQztZQUNwRCxpQ0FBaUM7U0FDbEM7OzJGQUVVLGNBQWM7a0JBeEIxQixTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSxxQkFBcUI7b0JBQy9CLFFBQVEsRUFBRSxtQkFBbUI7b0JBQzdCLFVBQVUsRUFBRSxJQUFJO29CQUNoQixJQUFJLEVBQUU7d0JBQ0osT0FBTyxFQUFFLGtCQUFrQjt3QkFDM0Isc0JBQXNCLEVBQUUsaUNBQWlDO3dCQUN6RCxzQkFBc0IsRUFBRSwyQ0FBMkM7d0JBQ25FLFdBQVcsRUFBRSxvQkFBb0I7d0JBQ2pDLFlBQVksRUFBRSxxQkFBcUI7d0JBQ25DLFdBQVcsRUFBRSwwQkFBMEI7d0JBQ3ZDLFNBQVMsRUFBRSxnQkFBZ0I7cUJBQzVCO29CQUNELE1BQU0sRUFBRTt3QkFDTixvQ0FBb0M7d0JBQ3BDLCtCQUErQjt3QkFDL0IsOEJBQThCO3FCQUMvQjtvQkFDRCxPQUFPLEVBQUUsQ0FBQyx1QkFBdUIsRUFBRSx1QkFBdUIsQ0FBQztvQkFDM0QsU0FBUyxFQUFFO3dCQUNULEVBQUMsT0FBTyxFQUFFLFlBQVksRUFBRSxXQUFXLGdCQUFnQixFQUFDO3dCQUNwRCxpQ0FBaUM7cUJBQ2xDO2lCQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aXZlLCBFbGVtZW50UmVmLCBpbmplY3QsIE5nWm9uZSwgT25EZXN0cm95fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7XG4gIENvbm5lY3RlZFBvc2l0aW9uLFxuICBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3ksXG4gIE92ZXJsYXksXG4gIE92ZXJsYXlDb25maWcsXG4gIFNUQU5EQVJEX0RST1BET1dOX0FESkFDRU5UX1BPU0lUSU9OUyxcbiAgU1RBTkRBUkRfRFJPUERPV05fQkVMT1dfUE9TSVRJT05TLFxufSBmcm9tICdAYW5ndWxhci9jZGsvb3ZlcmxheSc7XG5pbXBvcnQge1xuICBET1dOX0FSUk9XLFxuICBFTlRFUixcbiAgaGFzTW9kaWZpZXJLZXksXG4gIExFRlRfQVJST1csXG4gIFJJR0hUX0FSUk9XLFxuICBTUEFDRSxcbiAgVVBfQVJST1csXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9rZXljb2Rlcyc7XG5pbXBvcnQge19nZXRFdmVudFRhcmdldH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7ZnJvbUV2ZW50fSBmcm9tICdyeGpzJztcbmltcG9ydCB7ZmlsdGVyLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7Q0RLX01FTlUsIE1lbnV9IGZyb20gJy4vbWVudS1pbnRlcmZhY2UnO1xuaW1wb3J0IHtQQVJFTlRfT1JfTkVXX01FTlVfU1RBQ0tfUFJPVklERVJ9IGZyb20gJy4vbWVudS1zdGFjayc7XG5pbXBvcnQge01FTlVfQUlNfSBmcm9tICcuL21lbnUtYWltJztcbmltcG9ydCB7Q2RrTWVudVRyaWdnZXJCYXNlLCBNRU5VX1RSSUdHRVJ9IGZyb20gJy4vbWVudS10cmlnZ2VyLWJhc2UnO1xuaW1wb3J0IHtldmVudERpc3BhdGNoZXNOYXRpdmVDbGlja30gZnJvbSAnLi9ldmVudC1kZXRlY3Rpb24nO1xuXG4vKipcbiAqIEEgZGlyZWN0aXZlIHRoYXQgdHVybnMgaXRzIGhvc3QgZWxlbWVudCBpbnRvIGEgdHJpZ2dlciBmb3IgYSBwb3B1cCBtZW51LlxuICogSXQgY2FuIGJlIGNvbWJpbmVkIHdpdGggY2RrTWVudUl0ZW0gdG8gY3JlYXRlIHN1Yi1tZW51cy4gSWYgdGhlIGVsZW1lbnQgaXMgaW4gYSB0b3AgbGV2ZWxcbiAqIE1lbnVCYXIgaXQgd2lsbCBvcGVuIHRoZSBtZW51IG9uIGNsaWNrLCBvciBpZiBhIHNpYmxpbmcgaXMgYWxyZWFkeSBvcGVuZWQgaXQgd2lsbCBvcGVuIG9uIGhvdmVyLlxuICogSWYgaXQgaXMgaW5zaWRlIG9mIGEgTWVudSBpdCB3aWxsIG9wZW4gdGhlIGF0dGFjaGVkIFN1Ym1lbnUgb24gaG92ZXIgcmVnYXJkbGVzcyBvZiBpdHMgc2libGluZ1xuICogc3RhdGUuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtNZW51VHJpZ2dlckZvcl0nLFxuICBleHBvcnRBczogJ2Nka01lbnVUcmlnZ2VyRm9yJyxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstbWVudS10cmlnZ2VyJyxcbiAgICAnW2F0dHIuYXJpYS1oYXNwb3B1cF0nOiAnbWVudVRlbXBsYXRlUmVmID8gXCJtZW51XCIgOiBudWxsJyxcbiAgICAnW2F0dHIuYXJpYS1leHBhbmRlZF0nOiAnbWVudVRlbXBsYXRlUmVmID09IG51bGwgPyBudWxsIDogaXNPcGVuKCknLFxuICAgICcoZm9jdXNpbiknOiAnX3NldEhhc0ZvY3VzKHRydWUpJyxcbiAgICAnKGZvY3Vzb3V0KSc6ICdfc2V0SGFzRm9jdXMoZmFsc2UpJyxcbiAgICAnKGtleWRvd24pJzogJ190b2dnbGVPbktleWRvd24oJGV2ZW50KScsXG4gICAgJyhjbGljayknOiAnX2hhbmRsZUNsaWNrKCknLFxuICB9LFxuICBpbnB1dHM6IFtcbiAgICAnbWVudVRlbXBsYXRlUmVmOiBjZGtNZW51VHJpZ2dlckZvcicsXG4gICAgJ21lbnVQb3NpdGlvbjogY2RrTWVudVBvc2l0aW9uJyxcbiAgICAnbWVudURhdGE6IGNka01lbnVUcmlnZ2VyRGF0YScsXG4gIF0sXG4gIG91dHB1dHM6IFsnb3BlbmVkOiBjZGtNZW51T3BlbmVkJywgJ2Nsb3NlZDogY2RrTWVudUNsb3NlZCddLFxuICBwcm92aWRlcnM6IFtcbiAgICB7cHJvdmlkZTogTUVOVV9UUklHR0VSLCB1c2VFeGlzdGluZzogQ2RrTWVudVRyaWdnZXJ9LFxuICAgIFBBUkVOVF9PUl9ORVdfTUVOVV9TVEFDS19QUk9WSURFUixcbiAgXSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrTWVudVRyaWdnZXIgZXh0ZW5kcyBDZGtNZW51VHJpZ2dlckJhc2UgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBwcml2YXRlIHJlYWRvbmx5IF9lbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiA9IGluamVjdChFbGVtZW50UmVmKTtcbiAgcHJpdmF0ZSByZWFkb25seSBfb3ZlcmxheSA9IGluamVjdChPdmVybGF5KTtcbiAgcHJpdmF0ZSByZWFkb25seSBfbmdab25lID0gaW5qZWN0KE5nWm9uZSk7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2RpcmVjdGlvbmFsaXR5ID0gaW5qZWN0KERpcmVjdGlvbmFsaXR5LCB7b3B0aW9uYWw6IHRydWV9KTtcblxuICAvKiogVGhlIHBhcmVudCBtZW51IHRoaXMgdHJpZ2dlciBiZWxvbmdzIHRvLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9wYXJlbnRNZW51ID0gaW5qZWN0KENES19NRU5VLCB7b3B0aW9uYWw6IHRydWV9KTtcblxuICAvKiogVGhlIG1lbnUgYWltIHNlcnZpY2UgdXNlZCBieSB0aGlzIG1lbnUuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX21lbnVBaW0gPSBpbmplY3QoTUVOVV9BSU0sIHtvcHRpb25hbDogdHJ1ZX0pO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fc2V0Um9sZSgpO1xuICAgIHRoaXMuX3JlZ2lzdGVyQ2xvc2VIYW5kbGVyKCk7XG4gICAgdGhpcy5fc3Vic2NyaWJlVG9NZW51U3RhY2tDbG9zZWQoKTtcbiAgICB0aGlzLl9zdWJzY3JpYmVUb01vdXNlRW50ZXIoKTtcbiAgICB0aGlzLl9zdWJzY3JpYmVUb01lbnVTdGFja0hhc0ZvY3VzKCk7XG4gICAgdGhpcy5fc2V0VHlwZSgpO1xuICB9XG5cbiAgLyoqIFRvZ2dsZSB0aGUgYXR0YWNoZWQgbWVudS4gKi9cbiAgdG9nZ2xlKCkge1xuICAgIHRoaXMuaXNPcGVuKCkgPyB0aGlzLmNsb3NlKCkgOiB0aGlzLm9wZW4oKTtcbiAgfVxuXG4gIC8qKiBPcGVuIHRoZSBhdHRhY2hlZCBtZW51LiAqL1xuICBvcGVuKCkge1xuICAgIGlmICghdGhpcy5pc09wZW4oKSAmJiB0aGlzLm1lbnVUZW1wbGF0ZVJlZiAhPSBudWxsKSB7XG4gICAgICB0aGlzLm9wZW5lZC5uZXh0KCk7XG5cbiAgICAgIHRoaXMub3ZlcmxheVJlZiA9IHRoaXMub3ZlcmxheVJlZiB8fCB0aGlzLl9vdmVybGF5LmNyZWF0ZSh0aGlzLl9nZXRPdmVybGF5Q29uZmlnKCkpO1xuICAgICAgdGhpcy5vdmVybGF5UmVmLmF0dGFjaCh0aGlzLmdldE1lbnVDb250ZW50UG9ydGFsKCkpO1xuICAgICAgdGhpcy5fc3Vic2NyaWJlVG9PdXRzaWRlQ2xpY2tzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENsb3NlIHRoZSBvcGVuZWQgbWVudS4gKi9cbiAgY2xvc2UoKSB7XG4gICAgaWYgKHRoaXMuaXNPcGVuKCkpIHtcbiAgICAgIHRoaXMuY2xvc2VkLm5leHQoKTtcblxuICAgICAgdGhpcy5vdmVybGF5UmVmIS5kZXRhY2goKTtcbiAgICB9XG4gICAgdGhpcy5fY2xvc2VTaWJsaW5nVHJpZ2dlcnMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSByZWZlcmVuY2UgdG8gdGhlIHJlbmRlcmVkIE1lbnUgaWYgdGhlIE1lbnUgaXMgb3BlbiBhbmQgcmVuZGVyZWQgaW4gdGhlIERPTS5cbiAgICovXG4gIGdldE1lbnUoKTogTWVudSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuY2hpbGRNZW51O1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMga2V5Ym9hcmQgZXZlbnRzIGZvciB0aGUgbWVudSBpdGVtLlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIGtleWJvYXJkIGV2ZW50IHRvIGhhbmRsZVxuICAgKi9cbiAgX3RvZ2dsZU9uS2V5ZG93bihldmVudDogS2V5Ym9hcmRFdmVudCkge1xuICAgIGNvbnN0IGlzUGFyZW50VmVydGljYWwgPSB0aGlzLl9wYXJlbnRNZW51Py5vcmllbnRhdGlvbiA9PT0gJ3ZlcnRpY2FsJztcbiAgICBzd2l0Y2ggKGV2ZW50LmtleUNvZGUpIHtcbiAgICAgIGNhc2UgU1BBQ0U6XG4gICAgICBjYXNlIEVOVEVSOlxuICAgICAgICAvLyBTa2lwIGV2ZW50cyB0aGF0IHdpbGwgdHJpZ2dlciBjbGlja3Mgc28gdGhlIGhhbmRsZXIgZG9lc24ndCBnZXQgdHJpZ2dlcmVkIHR3aWNlLlxuICAgICAgICBpZiAoIWhhc01vZGlmaWVyS2V5KGV2ZW50KSAmJiAhZXZlbnREaXNwYXRjaGVzTmF0aXZlQ2xpY2sodGhpcy5fZWxlbWVudFJlZiwgZXZlbnQpKSB7XG4gICAgICAgICAgdGhpcy50b2dnbGUoKTtcbiAgICAgICAgICB0aGlzLmNoaWxkTWVudT8uZm9jdXNGaXJzdEl0ZW0oJ2tleWJvYXJkJyk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgUklHSFRfQVJST1c6XG4gICAgICAgIGlmICghaGFzTW9kaWZpZXJLZXkoZXZlbnQpKSB7XG4gICAgICAgICAgaWYgKHRoaXMuX3BhcmVudE1lbnUgJiYgaXNQYXJlbnRWZXJ0aWNhbCAmJiB0aGlzLl9kaXJlY3Rpb25hbGl0eT8udmFsdWUgIT09ICdydGwnKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdGhpcy5vcGVuKCk7XG4gICAgICAgICAgICB0aGlzLmNoaWxkTWVudT8uZm9jdXNGaXJzdEl0ZW0oJ2tleWJvYXJkJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIExFRlRfQVJST1c6XG4gICAgICAgIGlmICghaGFzTW9kaWZpZXJLZXkoZXZlbnQpKSB7XG4gICAgICAgICAgaWYgKHRoaXMuX3BhcmVudE1lbnUgJiYgaXNQYXJlbnRWZXJ0aWNhbCAmJiB0aGlzLl9kaXJlY3Rpb25hbGl0eT8udmFsdWUgPT09ICdydGwnKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdGhpcy5vcGVuKCk7XG4gICAgICAgICAgICB0aGlzLmNoaWxkTWVudT8uZm9jdXNGaXJzdEl0ZW0oJ2tleWJvYXJkJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIERPV05fQVJST1c6XG4gICAgICBjYXNlIFVQX0FSUk9XOlxuICAgICAgICBpZiAoIWhhc01vZGlmaWVyS2V5KGV2ZW50KSkge1xuICAgICAgICAgIGlmICghaXNQYXJlbnRWZXJ0aWNhbCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMub3BlbigpO1xuICAgICAgICAgICAgZXZlbnQua2V5Q29kZSA9PT0gRE9XTl9BUlJPV1xuICAgICAgICAgICAgICA/IHRoaXMuY2hpbGRNZW51Py5mb2N1c0ZpcnN0SXRlbSgna2V5Ym9hcmQnKVxuICAgICAgICAgICAgICA6IHRoaXMuY2hpbGRNZW51Py5mb2N1c0xhc3RJdGVtKCdrZXlib2FyZCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICAvKiogSGFuZGxlcyBjbGlja3Mgb24gdGhlIG1lbnUgdHJpZ2dlci4gKi9cbiAgX2hhbmRsZUNsaWNrKCkge1xuICAgIHRoaXMudG9nZ2xlKCk7XG4gICAgdGhpcy5jaGlsZE1lbnU/LmZvY3VzRmlyc3RJdGVtKCdtb3VzZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgd2hldGhlciB0aGUgdHJpZ2dlcidzIG1lbnUgc3RhY2sgaGFzIGZvY3VzLlxuICAgKiBAcGFyYW0gaGFzRm9jdXMgV2hldGhlciB0aGUgbWVudSBzdGFjayBoYXMgZm9jdXMuXG4gICAqL1xuICBfc2V0SGFzRm9jdXMoaGFzRm9jdXM6IGJvb2xlYW4pIHtcbiAgICBpZiAoIXRoaXMuX3BhcmVudE1lbnUpIHtcbiAgICAgIHRoaXMubWVudVN0YWNrLnNldEhhc0ZvY3VzKGhhc0ZvY3VzKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU3Vic2NyaWJlIHRvIHRoZSBtb3VzZWVudGVyIGV2ZW50cyBhbmQgY2xvc2UgYW55IHNpYmxpbmcgbWVudSBpdGVtcyBpZiB0aGlzIGVsZW1lbnQgaXMgbW91c2VkXG4gICAqIGludG8uXG4gICAqL1xuICBwcml2YXRlIF9zdWJzY3JpYmVUb01vdXNlRW50ZXIoKSB7XG4gICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIGZyb21FdmVudCh0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsICdtb3VzZWVudGVyJylcbiAgICAgICAgLnBpcGUoXG4gICAgICAgICAgZmlsdGVyKCgpID0+ICF0aGlzLm1lbnVTdGFjay5pc0VtcHR5KCkgJiYgIXRoaXMuaXNPcGVuKCkpLFxuICAgICAgICAgIHRha2VVbnRpbCh0aGlzLmRlc3Ryb3llZCksXG4gICAgICAgIClcbiAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgLy8gQ2xvc2VzIGFueSBzaWJsaW5nIG1lbnUgaXRlbXMgYW5kIG9wZW5zIHRoZSBtZW51IGFzc29jaWF0ZWQgd2l0aCB0aGlzIHRyaWdnZXIuXG4gICAgICAgICAgY29uc3QgdG9nZ2xlTWVudXMgPSAoKSA9PlxuICAgICAgICAgICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMuX2Nsb3NlU2libGluZ1RyaWdnZXJzKCk7XG4gICAgICAgICAgICAgIHRoaXMub3BlbigpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICBpZiAodGhpcy5fbWVudUFpbSkge1xuICAgICAgICAgICAgdGhpcy5fbWVudUFpbS50b2dnbGUodG9nZ2xlTWVudXMpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0b2dnbGVNZW51cygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogQ2xvc2Ugb3V0IGFueSBzaWJsaW5nIG1lbnUgdHJpZ2dlciBtZW51cy4gKi9cbiAgcHJpdmF0ZSBfY2xvc2VTaWJsaW5nVHJpZ2dlcnMoKSB7XG4gICAgaWYgKHRoaXMuX3BhcmVudE1lbnUpIHtcbiAgICAgIC8vIElmIG5vdGhpbmcgd2FzIHJlbW92ZWQgZnJvbSB0aGUgc3RhY2sgYW5kIHRoZSBsYXN0IGVsZW1lbnQgaXMgbm90IHRoZSBwYXJlbnQgaXRlbVxuICAgICAgLy8gdGhhdCBtZWFucyB0aGF0IHRoZSBwYXJlbnQgbWVudSBpcyBhIG1lbnUgYmFyIHNpbmNlIHdlIGRvbid0IHB1dCB0aGUgbWVudSBiYXIgb24gdGhlXG4gICAgICAvLyBzdGFja1xuICAgICAgY29uc3QgaXNQYXJlbnRNZW51QmFyID1cbiAgICAgICAgIXRoaXMubWVudVN0YWNrLmNsb3NlU3ViTWVudU9mKHRoaXMuX3BhcmVudE1lbnUpICYmXG4gICAgICAgIHRoaXMubWVudVN0YWNrLnBlZWsoKSAhPT0gdGhpcy5fcGFyZW50TWVudTtcblxuICAgICAgaWYgKGlzUGFyZW50TWVudUJhcikge1xuICAgICAgICB0aGlzLm1lbnVTdGFjay5jbG9zZUFsbCgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm1lbnVTdGFjay5jbG9zZUFsbCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBHZXQgdGhlIGNvbmZpZ3VyYXRpb24gb2JqZWN0IHVzZWQgdG8gY3JlYXRlIHRoZSBvdmVybGF5LiAqL1xuICBwcml2YXRlIF9nZXRPdmVybGF5Q29uZmlnKCkge1xuICAgIHJldHVybiBuZXcgT3ZlcmxheUNvbmZpZyh7XG4gICAgICBwb3NpdGlvblN0cmF0ZWd5OiB0aGlzLl9nZXRPdmVybGF5UG9zaXRpb25TdHJhdGVneSgpLFxuICAgICAgc2Nyb2xsU3RyYXRlZ3k6IHRoaXMuX292ZXJsYXkuc2Nyb2xsU3RyYXRlZ2llcy5yZXBvc2l0aW9uKCksXG4gICAgICBkaXJlY3Rpb246IHRoaXMuX2RpcmVjdGlvbmFsaXR5IHx8IHVuZGVmaW5lZCxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBCdWlsZCB0aGUgcG9zaXRpb24gc3RyYXRlZ3kgZm9yIHRoZSBvdmVybGF5IHdoaWNoIHNwZWNpZmllcyB3aGVyZSB0byBwbGFjZSB0aGUgbWVudS4gKi9cbiAgcHJpdmF0ZSBfZ2V0T3ZlcmxheVBvc2l0aW9uU3RyYXRlZ3koKTogRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5IHtcbiAgICByZXR1cm4gdGhpcy5fb3ZlcmxheVxuICAgICAgLnBvc2l0aW9uKClcbiAgICAgIC5mbGV4aWJsZUNvbm5lY3RlZFRvKHRoaXMuX2VsZW1lbnRSZWYpXG4gICAgICAud2l0aExvY2tlZFBvc2l0aW9uKClcbiAgICAgIC53aXRoR3Jvd0FmdGVyT3BlbigpXG4gICAgICAud2l0aFBvc2l0aW9ucyh0aGlzLl9nZXRPdmVybGF5UG9zaXRpb25zKCkpO1xuICB9XG5cbiAgLyoqIEdldCB0aGUgcHJlZmVycmVkIHBvc2l0aW9ucyBmb3IgdGhlIG9wZW5lZCBtZW51IHJlbGF0aXZlIHRvIHRoZSBtZW51IGl0ZW0uICovXG4gIHByaXZhdGUgX2dldE92ZXJsYXlQb3NpdGlvbnMoKTogQ29ubmVjdGVkUG9zaXRpb25bXSB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMubWVudVBvc2l0aW9uID8/XG4gICAgICAoIXRoaXMuX3BhcmVudE1lbnUgfHwgdGhpcy5fcGFyZW50TWVudS5vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnXG4gICAgICAgID8gU1RBTkRBUkRfRFJPUERPV05fQkVMT1dfUE9TSVRJT05TXG4gICAgICAgIDogU1RBTkRBUkRfRFJPUERPV05fQURKQUNFTlRfUE9TSVRJT05TKVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogU3Vic2NyaWJlIHRvIHRoZSBNZW51U3RhY2sgY2xvc2UgZXZlbnRzIGlmIHRoaXMgaXMgYSBzdGFuZGFsb25lIHRyaWdnZXIgYW5kIGNsb3NlIG91dCB0aGUgbWVudVxuICAgKiB0aGlzIHRyaWdnZXJzIHdoZW4gcmVxdWVzdGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVnaXN0ZXJDbG9zZUhhbmRsZXIoKSB7XG4gICAgaWYgKCF0aGlzLl9wYXJlbnRNZW51KSB7XG4gICAgICB0aGlzLm1lbnVTdGFjay5jbG9zZWQucGlwZSh0YWtlVW50aWwodGhpcy5kZXN0cm95ZWQpKS5zdWJzY3JpYmUoKHtpdGVtfSkgPT4ge1xuICAgICAgICBpZiAoaXRlbSA9PT0gdGhpcy5jaGlsZE1lbnUpIHtcbiAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJzY3JpYmUgdG8gdGhlIG92ZXJsYXlzIG91dHNpZGUgcG9pbnRlciBldmVudHMgc3RyZWFtIGFuZCBoYW5kbGUgY2xvc2luZyBvdXQgdGhlIHN0YWNrIGlmIGFcbiAgICogY2xpY2sgb2NjdXJzIG91dHNpZGUgdGhlIG1lbnVzLlxuICAgKi9cbiAgcHJpdmF0ZSBfc3Vic2NyaWJlVG9PdXRzaWRlQ2xpY2tzKCkge1xuICAgIGlmICh0aGlzLm92ZXJsYXlSZWYpIHtcbiAgICAgIHRoaXMub3ZlcmxheVJlZlxuICAgICAgICAub3V0c2lkZVBvaW50ZXJFdmVudHMoKVxuICAgICAgICAucGlwZSh0YWtlVW50aWwodGhpcy5zdG9wT3V0c2lkZUNsaWNrc0xpc3RlbmVyKSlcbiAgICAgICAgLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICAgICAgY29uc3QgdGFyZ2V0ID0gX2dldEV2ZW50VGFyZ2V0KGV2ZW50KSBhcyBFbGVtZW50O1xuICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG5cbiAgICAgICAgICBpZiAodGFyZ2V0ICE9PSBlbGVtZW50ICYmICFlbGVtZW50LmNvbnRhaW5zKHRhcmdldCkpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc0VsZW1lbnRJbnNpZGVNZW51U3RhY2sodGFyZ2V0KSkge1xuICAgICAgICAgICAgICB0aGlzLm1lbnVTdGFjay5jbG9zZUFsbCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5fY2xvc2VTaWJsaW5nVHJpZ2dlcnMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTdWJzY3JpYmUgdG8gdGhlIE1lbnVTdGFjayBoYXNGb2N1cyBldmVudHMuICovXG4gIHByaXZhdGUgX3N1YnNjcmliZVRvTWVudVN0YWNrSGFzRm9jdXMoKSB7XG4gICAgaWYgKCF0aGlzLl9wYXJlbnRNZW51KSB7XG4gICAgICB0aGlzLm1lbnVTdGFjay5oYXNGb2N1cy5waXBlKHRha2VVbnRpbCh0aGlzLmRlc3Ryb3llZCkpLnN1YnNjcmliZShoYXNGb2N1cyA9PiB7XG4gICAgICAgIGlmICghaGFzRm9jdXMpIHtcbiAgICAgICAgICB0aGlzLm1lbnVTdGFjay5jbG9zZUFsbCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKiogU3Vic2NyaWJlIHRvIHRoZSBNZW51U3RhY2sgY2xvc2VkIGV2ZW50cy4gKi9cbiAgcHJpdmF0ZSBfc3Vic2NyaWJlVG9NZW51U3RhY2tDbG9zZWQoKSB7XG4gICAgaWYgKCF0aGlzLl9wYXJlbnRNZW51KSB7XG4gICAgICB0aGlzLm1lbnVTdGFjay5jbG9zZWQuc3Vic2NyaWJlKCh7Zm9jdXNQYXJlbnRUcmlnZ2VyfSkgPT4ge1xuICAgICAgICBpZiAoZm9jdXNQYXJlbnRUcmlnZ2VyICYmICF0aGlzLm1lbnVTdGFjay5sZW5ndGgoKSkge1xuICAgICAgICAgIHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5mb2N1cygpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKiogU2V0cyB0aGUgcm9sZSBhdHRyaWJ1dGUgZm9yIHRoaXMgdHJpZ2dlciBpZiBuZWVkZWQuICovXG4gIHByaXZhdGUgX3NldFJvbGUoKSB7XG4gICAgLy8gSWYgdGhpcyB0cmlnZ2VyIGlzIHBhcnQgb2YgYW5vdGhlciBtZW51LCB0aGUgY2RrTWVudUl0ZW0gZGlyZWN0aXZlIHdpbGwgaGFuZGxlIHNldHRpbmcgdGhlXG4gICAgLy8gcm9sZSwgb3RoZXJ3aXNlIHRoaXMgaXMgYSBzdGFuZGFsb25lIHRyaWdnZXIsIGFuZCB3ZSBzaG91bGQgZW5zdXJlIGl0IGhhcyByb2xlPVwiYnV0dG9uXCIuXG4gICAgaWYgKCF0aGlzLl9wYXJlbnRNZW51KSB7XG4gICAgICB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuc2V0QXR0cmlidXRlKCdyb2xlJywgJ2J1dHRvbicpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTZXRzIHRodGUgYHR5cGVgIGF0dHJpYnV0ZSBvZiB0aGUgdHJpZ2dlci4gKi9cbiAgcHJpdmF0ZSBfc2V0VHlwZSgpIHtcbiAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50O1xuXG4gICAgaWYgKGVsZW1lbnQubm9kZU5hbWUgPT09ICdCVVRUT04nICYmICFlbGVtZW50LmdldEF0dHJpYnV0ZSgndHlwZScpKSB7XG4gICAgICAvLyBQcmV2ZW50cyBmb3JtIHN1Ym1pc3Npb25zLlxuICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAnYnV0dG9uJyk7XG4gICAgfVxuICB9XG59XG4iXX0=