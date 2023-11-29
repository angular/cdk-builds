/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectorRef, Directive, ElementRef, inject, NgZone } from '@angular/core';
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
        this._changeDetectorRef = inject(ChangeDetectorRef);
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
            this._changeDetectorRef.markForCheck();
            this._subscribeToOutsideClicks();
        }
    }
    /** Close the opened menu. */
    close() {
        if (this.isOpen()) {
            this.closed.next();
            this.overlayRef.detach();
            this._changeDetectorRef.markForCheck();
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: CdkMenuTrigger, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.0.4", type: CdkMenuTrigger, isStandalone: true, selector: "[cdkMenuTriggerFor]", inputs: { menuTemplateRef: ["cdkMenuTriggerFor", "menuTemplateRef"], menuPosition: ["cdkMenuPosition", "menuPosition"], menuData: ["cdkMenuTriggerData", "menuData"] }, outputs: { opened: "cdkMenuOpened", closed: "cdkMenuClosed" }, host: { listeners: { "focusin": "_setHasFocus(true)", "focusout": "_setHasFocus(false)", "keydown": "_toggleOnKeydown($event)", "click": "_handleClick()" }, properties: { "attr.aria-haspopup": "menuTemplateRef ? \"menu\" : null", "attr.aria-expanded": "menuTemplateRef == null ? null : isOpen()" }, classAttribute: "cdk-menu-trigger" }, providers: [
            { provide: MENU_TRIGGER, useExisting: CdkMenuTrigger },
            PARENT_OR_NEW_MENU_STACK_PROVIDER,
        ], exportAs: ["cdkMenuTriggerFor"], usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: CdkMenuTrigger, decorators: [{
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
        }], ctorParameters: () => [] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS10cmlnZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9tZW51L21lbnUtdHJpZ2dlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFZLE1BQU0sZUFBZSxDQUFDO0FBQ2xHLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3hELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBR0wsT0FBTyxFQUNQLGFBQWEsRUFDYixvQ0FBb0MsRUFDcEMsaUNBQWlDLEdBQ2xDLE1BQU0sc0JBQXNCLENBQUM7QUFDOUIsT0FBTyxFQUNMLFVBQVUsRUFDVixLQUFLLEVBQ0wsY0FBYyxFQUNkLFVBQVUsRUFDVixXQUFXLEVBQ1gsS0FBSyxFQUNMLFFBQVEsR0FDVCxNQUFNLHVCQUF1QixDQUFDO0FBQy9CLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQy9CLE9BQU8sRUFBQyxNQUFNLEVBQUUsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDakQsT0FBTyxFQUFDLFFBQVEsRUFBTyxNQUFNLGtCQUFrQixDQUFDO0FBQ2hELE9BQU8sRUFBQyxpQ0FBaUMsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUMvRCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNyRSxPQUFPLEVBQUMsMEJBQTBCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQzs7QUFFN0Q7Ozs7OztHQU1HO0FBeUJILE1BQU0sT0FB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QUM7d0JBQ3BELGlDQUFpQztxQkFDbEM7aUJBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZiwgRGlyZWN0aXZlLCBFbGVtZW50UmVmLCBpbmplY3QsIE5nWm9uZSwgT25EZXN0cm95fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7SW5wdXRNb2RhbGl0eURldGVjdG9yfSBmcm9tICdAYW5ndWxhci9jZGsvYTExeSc7XG5pbXBvcnQge0RpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge1xuICBDb25uZWN0ZWRQb3NpdGlvbixcbiAgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5LFxuICBPdmVybGF5LFxuICBPdmVybGF5Q29uZmlnLFxuICBTVEFOREFSRF9EUk9QRE9XTl9BREpBQ0VOVF9QT1NJVElPTlMsXG4gIFNUQU5EQVJEX0RST1BET1dOX0JFTE9XX1BPU0lUSU9OUyxcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL292ZXJsYXknO1xuaW1wb3J0IHtcbiAgRE9XTl9BUlJPVyxcbiAgRU5URVIsXG4gIGhhc01vZGlmaWVyS2V5LFxuICBMRUZUX0FSUk9XLFxuICBSSUdIVF9BUlJPVyxcbiAgU1BBQ0UsXG4gIFVQX0FSUk9XLFxufSBmcm9tICdAYW5ndWxhci9jZGsva2V5Y29kZXMnO1xuaW1wb3J0IHtfZ2V0RXZlbnRUYXJnZXR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge2Zyb21FdmVudH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2ZpbHRlciwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge0NES19NRU5VLCBNZW51fSBmcm9tICcuL21lbnUtaW50ZXJmYWNlJztcbmltcG9ydCB7UEFSRU5UX09SX05FV19NRU5VX1NUQUNLX1BST1ZJREVSfSBmcm9tICcuL21lbnUtc3RhY2snO1xuaW1wb3J0IHtNRU5VX0FJTX0gZnJvbSAnLi9tZW51LWFpbSc7XG5pbXBvcnQge0Nka01lbnVUcmlnZ2VyQmFzZSwgTUVOVV9UUklHR0VSfSBmcm9tICcuL21lbnUtdHJpZ2dlci1iYXNlJztcbmltcG9ydCB7ZXZlbnREaXNwYXRjaGVzTmF0aXZlQ2xpY2t9IGZyb20gJy4vZXZlbnQtZGV0ZWN0aW9uJztcblxuLyoqXG4gKiBBIGRpcmVjdGl2ZSB0aGF0IHR1cm5zIGl0cyBob3N0IGVsZW1lbnQgaW50byBhIHRyaWdnZXIgZm9yIGEgcG9wdXAgbWVudS5cbiAqIEl0IGNhbiBiZSBjb21iaW5lZCB3aXRoIGNka01lbnVJdGVtIHRvIGNyZWF0ZSBzdWItbWVudXMuIElmIHRoZSBlbGVtZW50IGlzIGluIGEgdG9wIGxldmVsXG4gKiBNZW51QmFyIGl0IHdpbGwgb3BlbiB0aGUgbWVudSBvbiBjbGljaywgb3IgaWYgYSBzaWJsaW5nIGlzIGFscmVhZHkgb3BlbmVkIGl0IHdpbGwgb3BlbiBvbiBob3Zlci5cbiAqIElmIGl0IGlzIGluc2lkZSBvZiBhIE1lbnUgaXQgd2lsbCBvcGVuIHRoZSBhdHRhY2hlZCBTdWJtZW51IG9uIGhvdmVyIHJlZ2FyZGxlc3Mgb2YgaXRzIHNpYmxpbmdcbiAqIHN0YXRlLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrTWVudVRyaWdnZXJGb3JdJyxcbiAgZXhwb3J0QXM6ICdjZGtNZW51VHJpZ2dlckZvcicsXG4gIHN0YW5kYWxvbmU6IHRydWUsXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLW1lbnUtdHJpZ2dlcicsXG4gICAgJ1thdHRyLmFyaWEtaGFzcG9wdXBdJzogJ21lbnVUZW1wbGF0ZVJlZiA/IFwibWVudVwiIDogbnVsbCcsXG4gICAgJ1thdHRyLmFyaWEtZXhwYW5kZWRdJzogJ21lbnVUZW1wbGF0ZVJlZiA9PSBudWxsID8gbnVsbCA6IGlzT3BlbigpJyxcbiAgICAnKGZvY3VzaW4pJzogJ19zZXRIYXNGb2N1cyh0cnVlKScsXG4gICAgJyhmb2N1c291dCknOiAnX3NldEhhc0ZvY3VzKGZhbHNlKScsXG4gICAgJyhrZXlkb3duKSc6ICdfdG9nZ2xlT25LZXlkb3duKCRldmVudCknLFxuICAgICcoY2xpY2spJzogJ19oYW5kbGVDbGljaygpJyxcbiAgfSxcbiAgaW5wdXRzOiBbXG4gICAgJ21lbnVUZW1wbGF0ZVJlZjogY2RrTWVudVRyaWdnZXJGb3InLFxuICAgICdtZW51UG9zaXRpb246IGNka01lbnVQb3NpdGlvbicsXG4gICAgJ21lbnVEYXRhOiBjZGtNZW51VHJpZ2dlckRhdGEnLFxuICBdLFxuICBvdXRwdXRzOiBbJ29wZW5lZDogY2RrTWVudU9wZW5lZCcsICdjbG9zZWQ6IGNka01lbnVDbG9zZWQnXSxcbiAgcHJvdmlkZXJzOiBbXG4gICAge3Byb3ZpZGU6IE1FTlVfVFJJR0dFUiwgdXNlRXhpc3Rpbmc6IENka01lbnVUcmlnZ2VyfSxcbiAgICBQQVJFTlRfT1JfTkVXX01FTlVfU1RBQ0tfUFJPVklERVIsXG4gIF0sXG59KVxuZXhwb3J0IGNsYXNzIENka01lbnVUcmlnZ2VyIGV4dGVuZHMgQ2RrTWVudVRyaWdnZXJCYXNlIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSByZWFkb25seSBfZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gPSBpbmplY3QoRWxlbWVudFJlZik7XG4gIHByaXZhdGUgcmVhZG9ubHkgX292ZXJsYXkgPSBpbmplY3QoT3ZlcmxheSk7XG4gIHByaXZhdGUgcmVhZG9ubHkgX25nWm9uZSA9IGluamVjdChOZ1pvbmUpO1xuICBwcml2YXRlIHJlYWRvbmx5IF9jaGFuZ2VEZXRlY3RvclJlZiA9IGluamVjdChDaGFuZ2VEZXRlY3RvclJlZik7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2lucHV0TW9kYWxpdHlEZXRlY3RvciA9IGluamVjdChJbnB1dE1vZGFsaXR5RGV0ZWN0b3IpO1xuICBwcml2YXRlIHJlYWRvbmx5IF9kaXJlY3Rpb25hbGl0eSA9IGluamVjdChEaXJlY3Rpb25hbGl0eSwge29wdGlvbmFsOiB0cnVlfSk7XG5cbiAgLyoqIFRoZSBwYXJlbnQgbWVudSB0aGlzIHRyaWdnZXIgYmVsb25ncyB0by4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfcGFyZW50TWVudSA9IGluamVjdChDREtfTUVOVSwge29wdGlvbmFsOiB0cnVlfSk7XG5cbiAgLyoqIFRoZSBtZW51IGFpbSBzZXJ2aWNlIHVzZWQgYnkgdGhpcyBtZW51LiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9tZW51QWltID0gaW5qZWN0KE1FTlVfQUlNLCB7b3B0aW9uYWw6IHRydWV9KTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX3NldFJvbGUoKTtcbiAgICB0aGlzLl9yZWdpc3RlckNsb3NlSGFuZGxlcigpO1xuICAgIHRoaXMuX3N1YnNjcmliZVRvTWVudVN0YWNrQ2xvc2VkKCk7XG4gICAgdGhpcy5fc3Vic2NyaWJlVG9Nb3VzZUVudGVyKCk7XG4gICAgdGhpcy5fc3Vic2NyaWJlVG9NZW51U3RhY2tIYXNGb2N1cygpO1xuICAgIHRoaXMuX3NldFR5cGUoKTtcbiAgfVxuXG4gIC8qKiBUb2dnbGUgdGhlIGF0dGFjaGVkIG1lbnUuICovXG4gIHRvZ2dsZSgpIHtcbiAgICB0aGlzLmlzT3BlbigpID8gdGhpcy5jbG9zZSgpIDogdGhpcy5vcGVuKCk7XG4gIH1cblxuICAvKiogT3BlbiB0aGUgYXR0YWNoZWQgbWVudS4gKi9cbiAgb3BlbigpIHtcbiAgICBpZiAoIXRoaXMuaXNPcGVuKCkgJiYgdGhpcy5tZW51VGVtcGxhdGVSZWYgIT0gbnVsbCkge1xuICAgICAgdGhpcy5vcGVuZWQubmV4dCgpO1xuXG4gICAgICB0aGlzLm92ZXJsYXlSZWYgPSB0aGlzLm92ZXJsYXlSZWYgfHwgdGhpcy5fb3ZlcmxheS5jcmVhdGUodGhpcy5fZ2V0T3ZlcmxheUNvbmZpZygpKTtcbiAgICAgIHRoaXMub3ZlcmxheVJlZi5hdHRhY2godGhpcy5nZXRNZW51Q29udGVudFBvcnRhbCgpKTtcbiAgICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICAgICAgdGhpcy5fc3Vic2NyaWJlVG9PdXRzaWRlQ2xpY2tzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENsb3NlIHRoZSBvcGVuZWQgbWVudS4gKi9cbiAgY2xvc2UoKSB7XG4gICAgaWYgKHRoaXMuaXNPcGVuKCkpIHtcbiAgICAgIHRoaXMuY2xvc2VkLm5leHQoKTtcblxuICAgICAgdGhpcy5vdmVybGF5UmVmIS5kZXRhY2goKTtcbiAgICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICAgIH1cbiAgICB0aGlzLl9jbG9zZVNpYmxpbmdUcmlnZ2VycygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHJlZmVyZW5jZSB0byB0aGUgcmVuZGVyZWQgTWVudSBpZiB0aGUgTWVudSBpcyBvcGVuIGFuZCByZW5kZXJlZCBpbiB0aGUgRE9NLlxuICAgKi9cbiAgZ2V0TWVudSgpOiBNZW51IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5jaGlsZE1lbnU7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBrZXlib2FyZCBldmVudHMgZm9yIHRoZSBtZW51IGl0ZW0uXG4gICAqIEBwYXJhbSBldmVudCBUaGUga2V5Ym9hcmQgZXZlbnQgdG8gaGFuZGxlXG4gICAqL1xuICBfdG9nZ2xlT25LZXlkb3duKGV2ZW50OiBLZXlib2FyZEV2ZW50KSB7XG4gICAgY29uc3QgaXNQYXJlbnRWZXJ0aWNhbCA9IHRoaXMuX3BhcmVudE1lbnU/Lm9yaWVudGF0aW9uID09PSAndmVydGljYWwnO1xuICAgIHN3aXRjaCAoZXZlbnQua2V5Q29kZSkge1xuICAgICAgY2FzZSBTUEFDRTpcbiAgICAgIGNhc2UgRU5URVI6XG4gICAgICAgIC8vIFNraXAgZXZlbnRzIHRoYXQgd2lsbCB0cmlnZ2VyIGNsaWNrcyBzbyB0aGUgaGFuZGxlciBkb2Vzbid0IGdldCB0cmlnZ2VyZWQgdHdpY2UuXG4gICAgICAgIGlmICghaGFzTW9kaWZpZXJLZXkoZXZlbnQpICYmICFldmVudERpc3BhdGNoZXNOYXRpdmVDbGljayh0aGlzLl9lbGVtZW50UmVmLCBldmVudCkpIHtcbiAgICAgICAgICB0aGlzLnRvZ2dsZSgpO1xuICAgICAgICAgIHRoaXMuY2hpbGRNZW51Py5mb2N1c0ZpcnN0SXRlbSgna2V5Ym9hcmQnKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBSSUdIVF9BUlJPVzpcbiAgICAgICAgaWYgKCFoYXNNb2RpZmllcktleShldmVudCkpIHtcbiAgICAgICAgICBpZiAodGhpcy5fcGFyZW50TWVudSAmJiBpc1BhcmVudFZlcnRpY2FsICYmIHRoaXMuX2RpcmVjdGlvbmFsaXR5Py52YWx1ZSAhPT0gJ3J0bCcpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLm9wZW4oKTtcbiAgICAgICAgICAgIHRoaXMuY2hpbGRNZW51Py5mb2N1c0ZpcnN0SXRlbSgna2V5Ym9hcmQnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgTEVGVF9BUlJPVzpcbiAgICAgICAgaWYgKCFoYXNNb2RpZmllcktleShldmVudCkpIHtcbiAgICAgICAgICBpZiAodGhpcy5fcGFyZW50TWVudSAmJiBpc1BhcmVudFZlcnRpY2FsICYmIHRoaXMuX2RpcmVjdGlvbmFsaXR5Py52YWx1ZSA9PT0gJ3J0bCcpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLm9wZW4oKTtcbiAgICAgICAgICAgIHRoaXMuY2hpbGRNZW51Py5mb2N1c0ZpcnN0SXRlbSgna2V5Ym9hcmQnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgRE9XTl9BUlJPVzpcbiAgICAgIGNhc2UgVVBfQVJST1c6XG4gICAgICAgIGlmICghaGFzTW9kaWZpZXJLZXkoZXZlbnQpKSB7XG4gICAgICAgICAgaWYgKCFpc1BhcmVudFZlcnRpY2FsKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdGhpcy5vcGVuKCk7XG4gICAgICAgICAgICBldmVudC5rZXlDb2RlID09PSBET1dOX0FSUk9XXG4gICAgICAgICAgICAgID8gdGhpcy5jaGlsZE1lbnU/LmZvY3VzRmlyc3RJdGVtKCdrZXlib2FyZCcpXG4gICAgICAgICAgICAgIDogdGhpcy5jaGlsZE1lbnU/LmZvY3VzTGFzdEl0ZW0oJ2tleWJvYXJkJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBIYW5kbGVzIGNsaWNrcyBvbiB0aGUgbWVudSB0cmlnZ2VyLiAqL1xuICBfaGFuZGxlQ2xpY2soKSB7XG4gICAgdGhpcy50b2dnbGUoKTtcbiAgICB0aGlzLmNoaWxkTWVudT8uZm9jdXNGaXJzdEl0ZW0oJ21vdXNlJyk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB3aGV0aGVyIHRoZSB0cmlnZ2VyJ3MgbWVudSBzdGFjayBoYXMgZm9jdXMuXG4gICAqIEBwYXJhbSBoYXNGb2N1cyBXaGV0aGVyIHRoZSBtZW51IHN0YWNrIGhhcyBmb2N1cy5cbiAgICovXG4gIF9zZXRIYXNGb2N1cyhoYXNGb2N1czogYm9vbGVhbikge1xuICAgIGlmICghdGhpcy5fcGFyZW50TWVudSkge1xuICAgICAgdGhpcy5tZW51U3RhY2suc2V0SGFzRm9jdXMoaGFzRm9jdXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJzY3JpYmUgdG8gdGhlIG1vdXNlZW50ZXIgZXZlbnRzIGFuZCBjbG9zZSBhbnkgc2libGluZyBtZW51IGl0ZW1zIGlmIHRoaXMgZWxlbWVudCBpcyBtb3VzZWRcbiAgICogaW50by5cbiAgICovXG4gIHByaXZhdGUgX3N1YnNjcmliZVRvTW91c2VFbnRlcigpIHtcbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgZnJvbUV2ZW50KHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudCwgJ21vdXNlZW50ZXInKVxuICAgICAgICAucGlwZShcbiAgICAgICAgICBmaWx0ZXIoKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgLy8gU2tpcCBmYWtlIGBtb3VzZWVudGVyYCBldmVudHMgZGlzcGF0Y2hlZCBieSB0b3VjaCBkZXZpY2VzLlxuICAgICAgICAgICAgICB0aGlzLl9pbnB1dE1vZGFsaXR5RGV0ZWN0b3IubW9zdFJlY2VudE1vZGFsaXR5ICE9PSAndG91Y2gnICYmXG4gICAgICAgICAgICAgICF0aGlzLm1lbnVTdGFjay5pc0VtcHR5KCkgJiZcbiAgICAgICAgICAgICAgIXRoaXMuaXNPcGVuKClcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSksXG4gICAgICAgICAgdGFrZVVudGlsKHRoaXMuZGVzdHJveWVkKSxcbiAgICAgICAgKVxuICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAvLyBDbG9zZXMgYW55IHNpYmxpbmcgbWVudSBpdGVtcyBhbmQgb3BlbnMgdGhlIG1lbnUgYXNzb2NpYXRlZCB3aXRoIHRoaXMgdHJpZ2dlci5cbiAgICAgICAgICBjb25zdCB0b2dnbGVNZW51cyA9ICgpID0+XG4gICAgICAgICAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5fY2xvc2VTaWJsaW5nVHJpZ2dlcnMoKTtcbiAgICAgICAgICAgICAgdGhpcy5vcGVuKCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgIGlmICh0aGlzLl9tZW51QWltKSB7XG4gICAgICAgICAgICB0aGlzLl9tZW51QWltLnRvZ2dsZSh0b2dnbGVNZW51cyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRvZ2dsZU1lbnVzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBDbG9zZSBvdXQgYW55IHNpYmxpbmcgbWVudSB0cmlnZ2VyIG1lbnVzLiAqL1xuICBwcml2YXRlIF9jbG9zZVNpYmxpbmdUcmlnZ2VycygpIHtcbiAgICBpZiAodGhpcy5fcGFyZW50TWVudSkge1xuICAgICAgLy8gSWYgbm90aGluZyB3YXMgcmVtb3ZlZCBmcm9tIHRoZSBzdGFjayBhbmQgdGhlIGxhc3QgZWxlbWVudCBpcyBub3QgdGhlIHBhcmVudCBpdGVtXG4gICAgICAvLyB0aGF0IG1lYW5zIHRoYXQgdGhlIHBhcmVudCBtZW51IGlzIGEgbWVudSBiYXIgc2luY2Ugd2UgZG9uJ3QgcHV0IHRoZSBtZW51IGJhciBvbiB0aGVcbiAgICAgIC8vIHN0YWNrXG4gICAgICBjb25zdCBpc1BhcmVudE1lbnVCYXIgPVxuICAgICAgICAhdGhpcy5tZW51U3RhY2suY2xvc2VTdWJNZW51T2YodGhpcy5fcGFyZW50TWVudSkgJiZcbiAgICAgICAgdGhpcy5tZW51U3RhY2sucGVlaygpICE9PSB0aGlzLl9wYXJlbnRNZW51O1xuXG4gICAgICBpZiAoaXNQYXJlbnRNZW51QmFyKSB7XG4gICAgICAgIHRoaXMubWVudVN0YWNrLmNsb3NlQWxsKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubWVudVN0YWNrLmNsb3NlQWxsKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEdldCB0aGUgY29uZmlndXJhdGlvbiBvYmplY3QgdXNlZCB0byBjcmVhdGUgdGhlIG92ZXJsYXkuICovXG4gIHByaXZhdGUgX2dldE92ZXJsYXlDb25maWcoKSB7XG4gICAgcmV0dXJuIG5ldyBPdmVybGF5Q29uZmlnKHtcbiAgICAgIHBvc2l0aW9uU3RyYXRlZ3k6IHRoaXMuX2dldE92ZXJsYXlQb3NpdGlvblN0cmF0ZWd5KCksXG4gICAgICBzY3JvbGxTdHJhdGVneTogdGhpcy5fb3ZlcmxheS5zY3JvbGxTdHJhdGVnaWVzLnJlcG9zaXRpb24oKSxcbiAgICAgIGRpcmVjdGlvbjogdGhpcy5fZGlyZWN0aW9uYWxpdHkgfHwgdW5kZWZpbmVkLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqIEJ1aWxkIHRoZSBwb3NpdGlvbiBzdHJhdGVneSBmb3IgdGhlIG92ZXJsYXkgd2hpY2ggc3BlY2lmaWVzIHdoZXJlIHRvIHBsYWNlIHRoZSBtZW51LiAqL1xuICBwcml2YXRlIF9nZXRPdmVybGF5UG9zaXRpb25TdHJhdGVneSgpOiBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3kge1xuICAgIHJldHVybiB0aGlzLl9vdmVybGF5XG4gICAgICAucG9zaXRpb24oKVxuICAgICAgLmZsZXhpYmxlQ29ubmVjdGVkVG8odGhpcy5fZWxlbWVudFJlZilcbiAgICAgIC53aXRoTG9ja2VkUG9zaXRpb24oKVxuICAgICAgLndpdGhHcm93QWZ0ZXJPcGVuKClcbiAgICAgIC53aXRoUG9zaXRpb25zKHRoaXMuX2dldE92ZXJsYXlQb3NpdGlvbnMoKSk7XG4gIH1cblxuICAvKiogR2V0IHRoZSBwcmVmZXJyZWQgcG9zaXRpb25zIGZvciB0aGUgb3BlbmVkIG1lbnUgcmVsYXRpdmUgdG8gdGhlIG1lbnUgaXRlbS4gKi9cbiAgcHJpdmF0ZSBfZ2V0T3ZlcmxheVBvc2l0aW9ucygpOiBDb25uZWN0ZWRQb3NpdGlvbltdIHtcbiAgICByZXR1cm4gKFxuICAgICAgdGhpcy5tZW51UG9zaXRpb24gPz9cbiAgICAgICghdGhpcy5fcGFyZW50TWVudSB8fCB0aGlzLl9wYXJlbnRNZW51Lm9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCdcbiAgICAgICAgPyBTVEFOREFSRF9EUk9QRE9XTl9CRUxPV19QT1NJVElPTlNcbiAgICAgICAgOiBTVEFOREFSRF9EUk9QRE9XTl9BREpBQ0VOVF9QT1NJVElPTlMpXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJzY3JpYmUgdG8gdGhlIE1lbnVTdGFjayBjbG9zZSBldmVudHMgaWYgdGhpcyBpcyBhIHN0YW5kYWxvbmUgdHJpZ2dlciBhbmQgY2xvc2Ugb3V0IHRoZSBtZW51XG4gICAqIHRoaXMgdHJpZ2dlcnMgd2hlbiByZXF1ZXN0ZWQuXG4gICAqL1xuICBwcml2YXRlIF9yZWdpc3RlckNsb3NlSGFuZGxlcigpIHtcbiAgICBpZiAoIXRoaXMuX3BhcmVudE1lbnUpIHtcbiAgICAgIHRoaXMubWVudVN0YWNrLmNsb3NlZC5waXBlKHRha2VVbnRpbCh0aGlzLmRlc3Ryb3llZCkpLnN1YnNjcmliZSgoe2l0ZW19KSA9PiB7XG4gICAgICAgIGlmIChpdGVtID09PSB0aGlzLmNoaWxkTWVudSkge1xuICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFN1YnNjcmliZSB0byB0aGUgb3ZlcmxheXMgb3V0c2lkZSBwb2ludGVyIGV2ZW50cyBzdHJlYW0gYW5kIGhhbmRsZSBjbG9zaW5nIG91dCB0aGUgc3RhY2sgaWYgYVxuICAgKiBjbGljayBvY2N1cnMgb3V0c2lkZSB0aGUgbWVudXMuXG4gICAqL1xuICBwcml2YXRlIF9zdWJzY3JpYmVUb091dHNpZGVDbGlja3MoKSB7XG4gICAgaWYgKHRoaXMub3ZlcmxheVJlZikge1xuICAgICAgdGhpcy5vdmVybGF5UmVmXG4gICAgICAgIC5vdXRzaWRlUG9pbnRlckV2ZW50cygpXG4gICAgICAgIC5waXBlKHRha2VVbnRpbCh0aGlzLnN0b3BPdXRzaWRlQ2xpY2tzTGlzdGVuZXIpKVxuICAgICAgICAuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgICAgICBjb25zdCB0YXJnZXQgPSBfZ2V0RXZlbnRUYXJnZXQoZXZlbnQpIGFzIEVsZW1lbnQ7XG4gICAgICAgICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcblxuICAgICAgICAgIGlmICh0YXJnZXQgIT09IGVsZW1lbnQgJiYgIWVsZW1lbnQuY29udGFpbnModGFyZ2V0KSkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmlzRWxlbWVudEluc2lkZU1lbnVTdGFjayh0YXJnZXQpKSB7XG4gICAgICAgICAgICAgIHRoaXMubWVudVN0YWNrLmNsb3NlQWxsKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aGlzLl9jbG9zZVNpYmxpbmdUcmlnZ2VycygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFN1YnNjcmliZSB0byB0aGUgTWVudVN0YWNrIGhhc0ZvY3VzIGV2ZW50cy4gKi9cbiAgcHJpdmF0ZSBfc3Vic2NyaWJlVG9NZW51U3RhY2tIYXNGb2N1cygpIHtcbiAgICBpZiAoIXRoaXMuX3BhcmVudE1lbnUpIHtcbiAgICAgIHRoaXMubWVudVN0YWNrLmhhc0ZvY3VzLnBpcGUodGFrZVVudGlsKHRoaXMuZGVzdHJveWVkKSkuc3Vic2NyaWJlKGhhc0ZvY3VzID0+IHtcbiAgICAgICAgaWYgKCFoYXNGb2N1cykge1xuICAgICAgICAgIHRoaXMubWVudVN0YWNrLmNsb3NlQWxsKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTdWJzY3JpYmUgdG8gdGhlIE1lbnVTdGFjayBjbG9zZWQgZXZlbnRzLiAqL1xuICBwcml2YXRlIF9zdWJzY3JpYmVUb01lbnVTdGFja0Nsb3NlZCgpIHtcbiAgICBpZiAoIXRoaXMuX3BhcmVudE1lbnUpIHtcbiAgICAgIHRoaXMubWVudVN0YWNrLmNsb3NlZC5zdWJzY3JpYmUoKHtmb2N1c1BhcmVudFRyaWdnZXJ9KSA9PiB7XG4gICAgICAgIGlmIChmb2N1c1BhcmVudFRyaWdnZXIgJiYgIXRoaXMubWVudVN0YWNrLmxlbmd0aCgpKSB7XG4gICAgICAgICAgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSByb2xlIGF0dHJpYnV0ZSBmb3IgdGhpcyB0cmlnZ2VyIGlmIG5lZWRlZC4gKi9cbiAgcHJpdmF0ZSBfc2V0Um9sZSgpIHtcbiAgICAvLyBJZiB0aGlzIHRyaWdnZXIgaXMgcGFydCBvZiBhbm90aGVyIG1lbnUsIHRoZSBjZGtNZW51SXRlbSBkaXJlY3RpdmUgd2lsbCBoYW5kbGUgc2V0dGluZyB0aGVcbiAgICAvLyByb2xlLCBvdGhlcndpc2UgdGhpcyBpcyBhIHN0YW5kYWxvbmUgdHJpZ2dlciwgYW5kIHdlIHNob3VsZCBlbnN1cmUgaXQgaGFzIHJvbGU9XCJidXR0b25cIi5cbiAgICBpZiAoIXRoaXMuX3BhcmVudE1lbnUpIHtcbiAgICAgIHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAnYnV0dG9uJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFNldHMgdGh0ZSBgdHlwZWAgYXR0cmlidXRlIG9mIHRoZSB0cmlnZ2VyLiAqL1xuICBwcml2YXRlIF9zZXRUeXBlKCkge1xuICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG5cbiAgICBpZiAoZWxlbWVudC5ub2RlTmFtZSA9PT0gJ0JVVFRPTicgJiYgIWVsZW1lbnQuZ2V0QXR0cmlidXRlKCd0eXBlJykpIHtcbiAgICAgIC8vIFByZXZlbnRzIGZvcm0gc3VibWlzc2lvbnMuXG4gICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgndHlwZScsICdidXR0b24nKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==