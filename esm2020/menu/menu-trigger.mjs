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
        const keyCode = event.keyCode;
        switch (keyCode) {
            case SPACE:
            case ENTER:
                if (!hasModifierKey(event)) {
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
                        keyCode === DOWN_ARROW
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
        // Closes any sibling menu items and opens the menu associated with this trigger.
        const toggleMenus = () => this._ngZone.run(() => {
            this._closeSiblingTriggers();
            this.open();
        });
        this._ngZone.runOutsideAngular(() => {
            fromEvent(this._elementRef.nativeElement, 'mouseenter')
                .pipe(filter(() => !this.menuStack.isEmpty() && !this.isOpen()), takeUntil(this.destroyed))
                .subscribe(() => {
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
                .pipe(filter(e => e.target != this._elementRef.nativeElement &&
                !this._elementRef.nativeElement.contains(e.target)), takeUntil(this.stopOutsideClicksListener))
                .subscribe(event => {
                if (!this.isElementInsideMenuStack(event.target)) {
                    this.menuStack.closeAll();
                }
                else {
                    this._closeSiblingTriggers();
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
CdkMenuTrigger.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.0.0-rc.1", ngImport: i0, type: CdkMenuTrigger, deps: [], target: i0.ɵɵFactoryTarget.Directive });
CdkMenuTrigger.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "15.0.0-rc.1", type: CdkMenuTrigger, isStandalone: true, selector: "[cdkMenuTriggerFor]", inputs: { menuTemplateRef: ["cdkMenuTriggerFor", "menuTemplateRef"], menuPosition: ["cdkMenuPosition", "menuPosition"], menuData: ["cdkMenuTriggerData", "menuData"] }, outputs: { opened: "cdkMenuOpened", closed: "cdkMenuClosed" }, host: { listeners: { "focusin": "_setHasFocus(true)", "focusout": "_setHasFocus(false)", "keydown": "_toggleOnKeydown($event)", "click": "toggle()" }, properties: { "attr.aria-haspopup": "menuTemplateRef ? \"menu\" : null", "attr.aria-expanded": "menuTemplateRef == null ? null : isOpen()" }, classAttribute: "cdk-menu-trigger" }, providers: [
        { provide: MENU_TRIGGER, useExisting: CdkMenuTrigger },
        PARENT_OR_NEW_MENU_STACK_PROVIDER,
    ], exportAs: ["cdkMenuTriggerFor"], usesInheritance: true, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.0.0-rc.1", ngImport: i0, type: CdkMenuTrigger, decorators: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS10cmlnZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9tZW51L21lbnUtdHJpZ2dlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFZLE1BQU0sZUFBZSxDQUFDO0FBQy9FLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBR0wsT0FBTyxFQUNQLGFBQWEsRUFDYixvQ0FBb0MsRUFDcEMsaUNBQWlDLEdBQ2xDLE1BQU0sc0JBQXNCLENBQUM7QUFDOUIsT0FBTyxFQUNMLFVBQVUsRUFDVixLQUFLLEVBQ0wsY0FBYyxFQUNkLFVBQVUsRUFDVixXQUFXLEVBQ1gsS0FBSyxFQUNMLFFBQVEsR0FDVCxNQUFNLHVCQUF1QixDQUFDO0FBQy9CLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDL0IsT0FBTyxFQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNqRCxPQUFPLEVBQUMsUUFBUSxFQUFPLE1BQU0sa0JBQWtCLENBQUM7QUFDaEQsT0FBTyxFQUFDLGlDQUFpQyxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQy9ELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDcEMsT0FBTyxFQUFDLGtCQUFrQixFQUFFLFlBQVksRUFBQyxNQUFNLHFCQUFxQixDQUFDOztBQUVyRTs7Ozs7O0dBTUc7QUF5QkgsTUFBTSxPQUFPLGNBQWUsU0FBUSxrQkFBa0I7SUFtQnBEO1FBQ0UsS0FBSyxFQUFFLENBQUM7UUFuQlYsd0JBQXdCO1FBQ1AsZ0JBQVcsR0FBNEIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRTNFLCtCQUErQjtRQUNkLGFBQVEsR0FBRyxNQUFNLENBQUMsT0FBTyxD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QkFDaEIsSUFBSSxFQUFFO3dCQUNKLE9BQU8sRUFBRSxrQkFBa0I7d0JBQzNCLHNCQUFzQixFQUFFLGlDQUFpQzt3QkFDekQsc0JBQXNCLEVBQUUsMkNBQTJDO3dCQUNuRSxXQUFXLEVBQUUsb0JBQW9CO3dCQUNqQyxZQUFZLEVBQUUscUJBQXFCO3dCQUNuQyxXQUFXLEVBQUUsMEJBQTBCO3dCQUN2QyxTQUFTLEVBQUUsVUFBVTtxQkFDdEI7b0JBQ0QsTUFBTSxFQUFFO3dCQUNOLG9DQUFvQzt3QkFDcEMsK0JBQStCO3dCQUMvQiw4QkFBOEI7cUJBQy9CO29CQUNELE9BQU8sRUFBRSxDQUFDLHVCQUF1QixFQUFFLHVCQUF1QixDQUFDO29CQUMzRCxTQUFTLEVBQUU7d0JBQ1QsRUFBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLFdBQVcsZ0JBQWdCLEVBQUM7d0JBQ3BELGlDQUFpQztxQkFDbEM7aUJBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3RpdmUsIEVsZW1lbnRSZWYsIGluamVjdCwgTmdab25lLCBPbkRlc3Ryb3l9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtcbiAgQ29ubmVjdGVkUG9zaXRpb24sXG4gIEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneSxcbiAgT3ZlcmxheSxcbiAgT3ZlcmxheUNvbmZpZyxcbiAgU1RBTkRBUkRfRFJPUERPV05fQURKQUNFTlRfUE9TSVRJT05TLFxuICBTVEFOREFSRF9EUk9QRE9XTl9CRUxPV19QT1NJVElPTlMsXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9vdmVybGF5JztcbmltcG9ydCB7XG4gIERPV05fQVJST1csXG4gIEVOVEVSLFxuICBoYXNNb2RpZmllcktleSxcbiAgTEVGVF9BUlJPVyxcbiAgUklHSFRfQVJST1csXG4gIFNQQUNFLFxuICBVUF9BUlJPVyxcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2tleWNvZGVzJztcbmltcG9ydCB7ZnJvbUV2ZW50fSBmcm9tICdyeGpzJztcbmltcG9ydCB7ZmlsdGVyLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7Q0RLX01FTlUsIE1lbnV9IGZyb20gJy4vbWVudS1pbnRlcmZhY2UnO1xuaW1wb3J0IHtQQVJFTlRfT1JfTkVXX01FTlVfU1RBQ0tfUFJPVklERVJ9IGZyb20gJy4vbWVudS1zdGFjayc7XG5pbXBvcnQge01FTlVfQUlNfSBmcm9tICcuL21lbnUtYWltJztcbmltcG9ydCB7Q2RrTWVudVRyaWdnZXJCYXNlLCBNRU5VX1RSSUdHRVJ9IGZyb20gJy4vbWVudS10cmlnZ2VyLWJhc2UnO1xuXG4vKipcbiAqIEEgZGlyZWN0aXZlIHRoYXQgdHVybnMgaXRzIGhvc3QgZWxlbWVudCBpbnRvIGEgdHJpZ2dlciBmb3IgYSBwb3B1cCBtZW51LlxuICogSXQgY2FuIGJlIGNvbWJpbmVkIHdpdGggY2RrTWVudUl0ZW0gdG8gY3JlYXRlIHN1Yi1tZW51cy4gSWYgdGhlIGVsZW1lbnQgaXMgaW4gYSB0b3AgbGV2ZWxcbiAqIE1lbnVCYXIgaXQgd2lsbCBvcGVuIHRoZSBtZW51IG9uIGNsaWNrLCBvciBpZiBhIHNpYmxpbmcgaXMgYWxyZWFkeSBvcGVuZWQgaXQgd2lsbCBvcGVuIG9uIGhvdmVyLlxuICogSWYgaXQgaXMgaW5zaWRlIG9mIGEgTWVudSBpdCB3aWxsIG9wZW4gdGhlIGF0dGFjaGVkIFN1Ym1lbnUgb24gaG92ZXIgcmVnYXJkbGVzcyBvZiBpdHMgc2libGluZ1xuICogc3RhdGUuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtNZW51VHJpZ2dlckZvcl0nLFxuICBleHBvcnRBczogJ2Nka01lbnVUcmlnZ2VyRm9yJyxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstbWVudS10cmlnZ2VyJyxcbiAgICAnW2F0dHIuYXJpYS1oYXNwb3B1cF0nOiAnbWVudVRlbXBsYXRlUmVmID8gXCJtZW51XCIgOiBudWxsJyxcbiAgICAnW2F0dHIuYXJpYS1leHBhbmRlZF0nOiAnbWVudVRlbXBsYXRlUmVmID09IG51bGwgPyBudWxsIDogaXNPcGVuKCknLFxuICAgICcoZm9jdXNpbiknOiAnX3NldEhhc0ZvY3VzKHRydWUpJyxcbiAgICAnKGZvY3Vzb3V0KSc6ICdfc2V0SGFzRm9jdXMoZmFsc2UpJyxcbiAgICAnKGtleWRvd24pJzogJ190b2dnbGVPbktleWRvd24oJGV2ZW50KScsXG4gICAgJyhjbGljayknOiAndG9nZ2xlKCknLFxuICB9LFxuICBpbnB1dHM6IFtcbiAgICAnbWVudVRlbXBsYXRlUmVmOiBjZGtNZW51VHJpZ2dlckZvcicsXG4gICAgJ21lbnVQb3NpdGlvbjogY2RrTWVudVBvc2l0aW9uJyxcbiAgICAnbWVudURhdGE6IGNka01lbnVUcmlnZ2VyRGF0YScsXG4gIF0sXG4gIG91dHB1dHM6IFsnb3BlbmVkOiBjZGtNZW51T3BlbmVkJywgJ2Nsb3NlZDogY2RrTWVudUNsb3NlZCddLFxuICBwcm92aWRlcnM6IFtcbiAgICB7cHJvdmlkZTogTUVOVV9UUklHR0VSLCB1c2VFeGlzdGluZzogQ2RrTWVudVRyaWdnZXJ9LFxuICAgIFBBUkVOVF9PUl9ORVdfTUVOVV9TVEFDS19QUk9WSURFUixcbiAgXSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrTWVudVRyaWdnZXIgZXh0ZW5kcyBDZGtNZW51VHJpZ2dlckJhc2UgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogVGhlIGhvc3QgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gPSBpbmplY3QoRWxlbWVudFJlZik7XG5cbiAgLyoqIFRoZSBDREsgb3ZlcmxheSBzZXJ2aWNlLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9vdmVybGF5ID0gaW5qZWN0KE92ZXJsYXkpO1xuXG4gIC8qKiBUaGUgQW5ndWxhciB6b25lLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9uZ1pvbmUgPSBpbmplY3QoTmdab25lKTtcblxuICAvKiogVGhlIHBhcmVudCBtZW51IHRoaXMgdHJpZ2dlciBiZWxvbmdzIHRvLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9wYXJlbnRNZW51ID0gaW5qZWN0KENES19NRU5VLCB7b3B0aW9uYWw6IHRydWV9KTtcblxuICAvKiogVGhlIG1lbnUgYWltIHNlcnZpY2UgdXNlZCBieSB0aGlzIG1lbnUuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX21lbnVBaW0gPSBpbmplY3QoTUVOVV9BSU0sIHtvcHRpb25hbDogdHJ1ZX0pO1xuXG4gIC8qKiBUaGUgZGlyZWN0aW9uYWxpdHkgb2YgdGhlIHBhZ2UuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX2RpcmVjdGlvbmFsaXR5ID0gaW5qZWN0KERpcmVjdGlvbmFsaXR5LCB7b3B0aW9uYWw6IHRydWV9KTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX3NldFJvbGUoKTtcbiAgICB0aGlzLl9yZWdpc3RlckNsb3NlSGFuZGxlcigpO1xuICAgIHRoaXMuX3N1YnNjcmliZVRvTWVudVN0YWNrQ2xvc2VkKCk7XG4gICAgdGhpcy5fc3Vic2NyaWJlVG9Nb3VzZUVudGVyKCk7XG4gICAgdGhpcy5fc3Vic2NyaWJlVG9NZW51U3RhY2tIYXNGb2N1cygpO1xuICAgIHRoaXMuX3NldFR5cGUoKTtcbiAgfVxuXG4gIC8qKiBUb2dnbGUgdGhlIGF0dGFjaGVkIG1lbnUuICovXG4gIHRvZ2dsZSgpIHtcbiAgICB0aGlzLmlzT3BlbigpID8gdGhpcy5jbG9zZSgpIDogdGhpcy5vcGVuKCk7XG4gIH1cblxuICAvKiogT3BlbiB0aGUgYXR0YWNoZWQgbWVudS4gKi9cbiAgb3BlbigpIHtcbiAgICBpZiAoIXRoaXMuaXNPcGVuKCkgJiYgdGhpcy5tZW51VGVtcGxhdGVSZWYgIT0gbnVsbCkge1xuICAgICAgdGhpcy5vcGVuZWQubmV4dCgpO1xuXG4gICAgICB0aGlzLm92ZXJsYXlSZWYgPSB0aGlzLm92ZXJsYXlSZWYgfHwgdGhpcy5fb3ZlcmxheS5jcmVhdGUodGhpcy5fZ2V0T3ZlcmxheUNvbmZpZygpKTtcbiAgICAgIHRoaXMub3ZlcmxheVJlZi5hdHRhY2godGhpcy5nZXRNZW51Q29udGVudFBvcnRhbCgpKTtcbiAgICAgIHRoaXMuX3N1YnNjcmliZVRvT3V0c2lkZUNsaWNrcygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDbG9zZSB0aGUgb3BlbmVkIG1lbnUuICovXG4gIGNsb3NlKCkge1xuICAgIGlmICh0aGlzLmlzT3BlbigpKSB7XG4gICAgICB0aGlzLmNsb3NlZC5uZXh0KCk7XG5cbiAgICAgIHRoaXMub3ZlcmxheVJlZiEuZGV0YWNoKCk7XG4gICAgfVxuICAgIHRoaXMuX2Nsb3NlU2libGluZ1RyaWdnZXJzKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcmVmZXJlbmNlIHRvIHRoZSByZW5kZXJlZCBNZW51IGlmIHRoZSBNZW51IGlzIG9wZW4gYW5kIHJlbmRlcmVkIGluIHRoZSBET00uXG4gICAqL1xuICBnZXRNZW51KCk6IE1lbnUgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmNoaWxkTWVudTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIGtleWJvYXJkIGV2ZW50cyBmb3IgdGhlIG1lbnUgaXRlbS5cbiAgICogQHBhcmFtIGV2ZW50IFRoZSBrZXlib2FyZCBldmVudCB0byBoYW5kbGVcbiAgICovXG4gIF90b2dnbGVPbktleWRvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcbiAgICBjb25zdCBpc1BhcmVudFZlcnRpY2FsID0gdGhpcy5fcGFyZW50TWVudT8ub3JpZW50YXRpb24gPT09ICd2ZXJ0aWNhbCc7XG4gICAgY29uc3Qga2V5Q29kZSA9IGV2ZW50LmtleUNvZGU7XG4gICAgc3dpdGNoIChrZXlDb2RlKSB7XG4gICAgICBjYXNlIFNQQUNFOlxuICAgICAgY2FzZSBFTlRFUjpcbiAgICAgICAgaWYgKCFoYXNNb2RpZmllcktleShldmVudCkpIHtcbiAgICAgICAgICB0aGlzLnRvZ2dsZSgpO1xuICAgICAgICAgIHRoaXMuY2hpbGRNZW51Py5mb2N1c0ZpcnN0SXRlbSgna2V5Ym9hcmQnKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBSSUdIVF9BUlJPVzpcbiAgICAgICAgaWYgKCFoYXNNb2RpZmllcktleShldmVudCkpIHtcbiAgICAgICAgICBpZiAodGhpcy5fcGFyZW50TWVudSAmJiBpc1BhcmVudFZlcnRpY2FsICYmIHRoaXMuX2RpcmVjdGlvbmFsaXR5Py52YWx1ZSAhPT0gJ3J0bCcpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLm9wZW4oKTtcbiAgICAgICAgICAgIHRoaXMuY2hpbGRNZW51Py5mb2N1c0ZpcnN0SXRlbSgna2V5Ym9hcmQnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgTEVGVF9BUlJPVzpcbiAgICAgICAgaWYgKCFoYXNNb2RpZmllcktleShldmVudCkpIHtcbiAgICAgICAgICBpZiAodGhpcy5fcGFyZW50TWVudSAmJiBpc1BhcmVudFZlcnRpY2FsICYmIHRoaXMuX2RpcmVjdGlvbmFsaXR5Py52YWx1ZSA9PT0gJ3J0bCcpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLm9wZW4oKTtcbiAgICAgICAgICAgIHRoaXMuY2hpbGRNZW51Py5mb2N1c0ZpcnN0SXRlbSgna2V5Ym9hcmQnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgRE9XTl9BUlJPVzpcbiAgICAgIGNhc2UgVVBfQVJST1c6XG4gICAgICAgIGlmICghaGFzTW9kaWZpZXJLZXkoZXZlbnQpKSB7XG4gICAgICAgICAgaWYgKCFpc1BhcmVudFZlcnRpY2FsKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdGhpcy5vcGVuKCk7XG4gICAgICAgICAgICBrZXlDb2RlID09PSBET1dOX0FSUk9XXG4gICAgICAgICAgICAgID8gdGhpcy5jaGlsZE1lbnU/LmZvY3VzRmlyc3RJdGVtKCdrZXlib2FyZCcpXG4gICAgICAgICAgICAgIDogdGhpcy5jaGlsZE1lbnU/LmZvY3VzTGFzdEl0ZW0oJ2tleWJvYXJkJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHdoZXRoZXIgdGhlIHRyaWdnZXIncyBtZW51IHN0YWNrIGhhcyBmb2N1cy5cbiAgICogQHBhcmFtIGhhc0ZvY3VzIFdoZXRoZXIgdGhlIG1lbnUgc3RhY2sgaGFzIGZvY3VzLlxuICAgKi9cbiAgX3NldEhhc0ZvY3VzKGhhc0ZvY3VzOiBib29sZWFuKSB7XG4gICAgaWYgKCF0aGlzLl9wYXJlbnRNZW51KSB7XG4gICAgICB0aGlzLm1lbnVTdGFjay5zZXRIYXNGb2N1cyhoYXNGb2N1cyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFN1YnNjcmliZSB0byB0aGUgbW91c2VlbnRlciBldmVudHMgYW5kIGNsb3NlIGFueSBzaWJsaW5nIG1lbnUgaXRlbXMgaWYgdGhpcyBlbGVtZW50IGlzIG1vdXNlZFxuICAgKiBpbnRvLlxuICAgKi9cbiAgcHJpdmF0ZSBfc3Vic2NyaWJlVG9Nb3VzZUVudGVyKCkge1xuICAgIC8vIENsb3NlcyBhbnkgc2libGluZyBtZW51IGl0ZW1zIGFuZCBvcGVucyB0aGUgbWVudSBhc3NvY2lhdGVkIHdpdGggdGhpcyB0cmlnZ2VyLlxuICAgIGNvbnN0IHRvZ2dsZU1lbnVzID0gKCkgPT5cbiAgICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICB0aGlzLl9jbG9zZVNpYmxpbmdUcmlnZ2VycygpO1xuICAgICAgICB0aGlzLm9wZW4oKTtcbiAgICAgIH0pO1xuXG4gICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIGZyb21FdmVudCh0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsICdtb3VzZWVudGVyJylcbiAgICAgICAgLnBpcGUoXG4gICAgICAgICAgZmlsdGVyKCgpID0+ICF0aGlzLm1lbnVTdGFjay5pc0VtcHR5KCkgJiYgIXRoaXMuaXNPcGVuKCkpLFxuICAgICAgICAgIHRha2VVbnRpbCh0aGlzLmRlc3Ryb3llZCksXG4gICAgICAgIClcbiAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMuX21lbnVBaW0pIHtcbiAgICAgICAgICAgIHRoaXMuX21lbnVBaW0udG9nZ2xlKHRvZ2dsZU1lbnVzKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdG9nZ2xlTWVudXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIENsb3NlIG91dCBhbnkgc2libGluZyBtZW51IHRyaWdnZXIgbWVudXMuICovXG4gIHByaXZhdGUgX2Nsb3NlU2libGluZ1RyaWdnZXJzKCkge1xuICAgIGlmICh0aGlzLl9wYXJlbnRNZW51KSB7XG4gICAgICAvLyBJZiBub3RoaW5nIHdhcyByZW1vdmVkIGZyb20gdGhlIHN0YWNrIGFuZCB0aGUgbGFzdCBlbGVtZW50IGlzIG5vdCB0aGUgcGFyZW50IGl0ZW1cbiAgICAgIC8vIHRoYXQgbWVhbnMgdGhhdCB0aGUgcGFyZW50IG1lbnUgaXMgYSBtZW51IGJhciBzaW5jZSB3ZSBkb24ndCBwdXQgdGhlIG1lbnUgYmFyIG9uIHRoZVxuICAgICAgLy8gc3RhY2tcbiAgICAgIGNvbnN0IGlzUGFyZW50TWVudUJhciA9XG4gICAgICAgICF0aGlzLm1lbnVTdGFjay5jbG9zZVN1Yk1lbnVPZih0aGlzLl9wYXJlbnRNZW51KSAmJlxuICAgICAgICB0aGlzLm1lbnVTdGFjay5wZWVrKCkgIT09IHRoaXMuX3BhcmVudE1lbnU7XG5cbiAgICAgIGlmIChpc1BhcmVudE1lbnVCYXIpIHtcbiAgICAgICAgdGhpcy5tZW51U3RhY2suY2xvc2VBbGwoKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5tZW51U3RhY2suY2xvc2VBbGwoKTtcbiAgICB9XG4gIH1cblxuICAvKiogR2V0IHRoZSBjb25maWd1cmF0aW9uIG9iamVjdCB1c2VkIHRvIGNyZWF0ZSB0aGUgb3ZlcmxheS4gKi9cbiAgcHJpdmF0ZSBfZ2V0T3ZlcmxheUNvbmZpZygpIHtcbiAgICByZXR1cm4gbmV3IE92ZXJsYXlDb25maWcoe1xuICAgICAgcG9zaXRpb25TdHJhdGVneTogdGhpcy5fZ2V0T3ZlcmxheVBvc2l0aW9uU3RyYXRlZ3koKSxcbiAgICAgIHNjcm9sbFN0cmF0ZWd5OiB0aGlzLl9vdmVybGF5LnNjcm9sbFN0cmF0ZWdpZXMucmVwb3NpdGlvbigpLFxuICAgICAgZGlyZWN0aW9uOiB0aGlzLl9kaXJlY3Rpb25hbGl0eSB8fCB1bmRlZmluZWQsXG4gICAgfSk7XG4gIH1cblxuICAvKiogQnVpbGQgdGhlIHBvc2l0aW9uIHN0cmF0ZWd5IGZvciB0aGUgb3ZlcmxheSB3aGljaCBzcGVjaWZpZXMgd2hlcmUgdG8gcGxhY2UgdGhlIG1lbnUuICovXG4gIHByaXZhdGUgX2dldE92ZXJsYXlQb3NpdGlvblN0cmF0ZWd5KCk6IEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneSB7XG4gICAgcmV0dXJuIHRoaXMuX292ZXJsYXlcbiAgICAgIC5wb3NpdGlvbigpXG4gICAgICAuZmxleGlibGVDb25uZWN0ZWRUbyh0aGlzLl9lbGVtZW50UmVmKVxuICAgICAgLndpdGhMb2NrZWRQb3NpdGlvbigpXG4gICAgICAud2l0aEdyb3dBZnRlck9wZW4oKVxuICAgICAgLndpdGhQb3NpdGlvbnModGhpcy5fZ2V0T3ZlcmxheVBvc2l0aW9ucygpKTtcbiAgfVxuXG4gIC8qKiBHZXQgdGhlIHByZWZlcnJlZCBwb3NpdGlvbnMgZm9yIHRoZSBvcGVuZWQgbWVudSByZWxhdGl2ZSB0byB0aGUgbWVudSBpdGVtLiAqL1xuICBwcml2YXRlIF9nZXRPdmVybGF5UG9zaXRpb25zKCk6IENvbm5lY3RlZFBvc2l0aW9uW10ge1xuICAgIHJldHVybiAoXG4gICAgICB0aGlzLm1lbnVQb3NpdGlvbiA/P1xuICAgICAgKCF0aGlzLl9wYXJlbnRNZW51IHx8IHRoaXMuX3BhcmVudE1lbnUub3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJ1xuICAgICAgICA/IFNUQU5EQVJEX0RST1BET1dOX0JFTE9XX1BPU0lUSU9OU1xuICAgICAgICA6IFNUQU5EQVJEX0RST1BET1dOX0FESkFDRU5UX1BPU0lUSU9OUylcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFN1YnNjcmliZSB0byB0aGUgTWVudVN0YWNrIGNsb3NlIGV2ZW50cyBpZiB0aGlzIGlzIGEgc3RhbmRhbG9uZSB0cmlnZ2VyIGFuZCBjbG9zZSBvdXQgdGhlIG1lbnVcbiAgICogdGhpcyB0cmlnZ2VycyB3aGVuIHJlcXVlc3RlZC5cbiAgICovXG4gIHByaXZhdGUgX3JlZ2lzdGVyQ2xvc2VIYW5kbGVyKCkge1xuICAgIGlmICghdGhpcy5fcGFyZW50TWVudSkge1xuICAgICAgdGhpcy5tZW51U3RhY2suY2xvc2VkLnBpcGUodGFrZVVudGlsKHRoaXMuZGVzdHJveWVkKSkuc3Vic2NyaWJlKCh7aXRlbX0pID0+IHtcbiAgICAgICAgaWYgKGl0ZW0gPT09IHRoaXMuY2hpbGRNZW51KSB7XG4gICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU3Vic2NyaWJlIHRvIHRoZSBvdmVybGF5cyBvdXRzaWRlIHBvaW50ZXIgZXZlbnRzIHN0cmVhbSBhbmQgaGFuZGxlIGNsb3Npbmcgb3V0IHRoZSBzdGFjayBpZiBhXG4gICAqIGNsaWNrIG9jY3VycyBvdXRzaWRlIHRoZSBtZW51cy5cbiAgICovXG4gIHByaXZhdGUgX3N1YnNjcmliZVRvT3V0c2lkZUNsaWNrcygpIHtcbiAgICBpZiAodGhpcy5vdmVybGF5UmVmKSB7XG4gICAgICB0aGlzLm92ZXJsYXlSZWZcbiAgICAgICAgLm91dHNpZGVQb2ludGVyRXZlbnRzKClcbiAgICAgICAgLnBpcGUoXG4gICAgICAgICAgZmlsdGVyKFxuICAgICAgICAgICAgZSA9PlxuICAgICAgICAgICAgICBlLnRhcmdldCAhPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQgJiZcbiAgICAgICAgICAgICAgIXRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5jb250YWlucyhlLnRhcmdldCBhcyBFbGVtZW50KSxcbiAgICAgICAgICApLFxuICAgICAgICAgIHRha2VVbnRpbCh0aGlzLnN0b3BPdXRzaWRlQ2xpY2tzTGlzdGVuZXIpLFxuICAgICAgICApXG4gICAgICAgIC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgICAgIGlmICghdGhpcy5pc0VsZW1lbnRJbnNpZGVNZW51U3RhY2soZXZlbnQudGFyZ2V0IGFzIEVsZW1lbnQpKSB7XG4gICAgICAgICAgICB0aGlzLm1lbnVTdGFjay5jbG9zZUFsbCgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9jbG9zZVNpYmxpbmdUcmlnZ2VycygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFN1YnNjcmliZSB0byB0aGUgTWVudVN0YWNrIGhhc0ZvY3VzIGV2ZW50cy4gKi9cbiAgcHJpdmF0ZSBfc3Vic2NyaWJlVG9NZW51U3RhY2tIYXNGb2N1cygpIHtcbiAgICBpZiAoIXRoaXMuX3BhcmVudE1lbnUpIHtcbiAgICAgIHRoaXMubWVudVN0YWNrLmhhc0ZvY3VzLnBpcGUodGFrZVVudGlsKHRoaXMuZGVzdHJveWVkKSkuc3Vic2NyaWJlKGhhc0ZvY3VzID0+IHtcbiAgICAgICAgaWYgKCFoYXNGb2N1cykge1xuICAgICAgICAgIHRoaXMubWVudVN0YWNrLmNsb3NlQWxsKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTdWJzY3JpYmUgdG8gdGhlIE1lbnVTdGFjayBjbG9zZWQgZXZlbnRzLiAqL1xuICBwcml2YXRlIF9zdWJzY3JpYmVUb01lbnVTdGFja0Nsb3NlZCgpIHtcbiAgICBpZiAoIXRoaXMuX3BhcmVudE1lbnUpIHtcbiAgICAgIHRoaXMubWVudVN0YWNrLmNsb3NlZC5zdWJzY3JpYmUoKHtmb2N1c1BhcmVudFRyaWdnZXJ9KSA9PiB7XG4gICAgICAgIGlmIChmb2N1c1BhcmVudFRyaWdnZXIgJiYgIXRoaXMubWVudVN0YWNrLmxlbmd0aCgpKSB7XG4gICAgICAgICAgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSByb2xlIGF0dHJpYnV0ZSBmb3IgdGhpcyB0cmlnZ2VyIGlmIG5lZWRlZC4gKi9cbiAgcHJpdmF0ZSBfc2V0Um9sZSgpIHtcbiAgICAvLyBJZiB0aGlzIHRyaWdnZXIgaXMgcGFydCBvZiBhbm90aGVyIG1lbnUsIHRoZSBjZGtNZW51SXRlbSBkaXJlY3RpdmUgd2lsbCBoYW5kbGUgc2V0dGluZyB0aGVcbiAgICAvLyByb2xlLCBvdGhlcndpc2UgdGhpcyBpcyBhIHN0YW5kYWxvbmUgdHJpZ2dlciwgYW5kIHdlIHNob3VsZCBlbnN1cmUgaXQgaGFzIHJvbGU9XCJidXR0b25cIi5cbiAgICBpZiAoIXRoaXMuX3BhcmVudE1lbnUpIHtcbiAgICAgIHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAnYnV0dG9uJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFNldHMgdGh0ZSBgdHlwZWAgYXR0cmlidXRlIG9mIHRoZSB0cmlnZ2VyLiAqL1xuICBwcml2YXRlIF9zZXRUeXBlKCkge1xuICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG5cbiAgICBpZiAoZWxlbWVudC5ub2RlTmFtZSA9PT0gJ0JVVFRPTicgJiYgIWVsZW1lbnQuZ2V0QXR0cmlidXRlKCd0eXBlJykpIHtcbiAgICAgIC8vIFByZXZlbnRzIGZvcm0gc3VibWlzc2lvbnMuXG4gICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgndHlwZScsICdidXR0b24nKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==