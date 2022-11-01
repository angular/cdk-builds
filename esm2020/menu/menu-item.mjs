/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, ElementRef, EventEmitter, inject, Input, NgZone, Output, } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { ENTER, hasModifierKey, LEFT_ARROW, RIGHT_ARROW, SPACE } from '@angular/cdk/keycodes';
import { Directionality } from '@angular/cdk/bidi';
import { fromEvent, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { CdkMenuTrigger } from './menu-trigger';
import { CDK_MENU } from './menu-interface';
import { MENU_STACK } from './menu-stack';
import { MENU_AIM } from './menu-aim';
import * as i0 from "@angular/core";
/**
 * Directive which provides the ability for an element to be focused and navigated to using the
 * keyboard when residing in a CdkMenu, CdkMenuBar, or CdkMenuGroup. It performs user defined
 * behavior when clicked.
 */
export class CdkMenuItem {
    constructor() {
        /** The directionality (text direction) of the current page. */
        this._dir = inject(Directionality, { optional: true });
        /** The menu's native DOM host element. */
        this._elementRef = inject(ElementRef);
        /** The Angular zone. */
        this._ngZone = inject(NgZone);
        /** The menu aim service used by this menu. */
        this._menuAim = inject(MENU_AIM, { optional: true });
        /** The stack of menus this menu belongs to. */
        this._menuStack = inject(MENU_STACK);
        /** The parent menu in which this menuitem resides. */
        this._parentMenu = inject(CDK_MENU, { optional: true });
        /** Reference to the CdkMenuItemTrigger directive if one is added to the same element */
        this._menuTrigger = inject(CdkMenuTrigger, { optional: true, self: true });
        this._disabled = false;
        /**
         * If this MenuItem is a regular MenuItem, outputs when it is triggered by a keyboard or mouse
         * event.
         */
        this.triggered = new EventEmitter();
        /** Whether the menu item opens a menu. */
        this.hasMenu = !!this._menuTrigger;
        /**
         * The tabindex for this menu item managed internally and used for implementing roving a
         * tab index.
         */
        this._tabindex = -1;
        /** Whether the item should close the menu if triggered by the spacebar. */
        this.closeOnSpacebarTrigger = true;
        /** Emits when the menu item is destroyed. */
        this.destroyed = new Subject();
        this._setupMouseEnter();
        this._setType();
        if (this._isStandaloneItem()) {
            this._tabindex = 0;
        }
    }
    /**  Whether the CdkMenuItem is disabled - defaults to false */
    get disabled() {
        return this._disabled;
    }
    set disabled(value) {
        this._disabled = coerceBooleanProperty(value);
    }
    ngOnDestroy() {
        this.destroyed.next();
        this.destroyed.complete();
    }
    /** Place focus on the element. */
    focus() {
        this._elementRef.nativeElement.focus();
    }
    /**
     * If the menu item is not disabled and the element does not have a menu trigger attached, emit
     * on the cdkMenuItemTriggered emitter and close all open menus.
     * @param options Options the configure how the item is triggered
     *   - keepOpen: specifies that the menu should be kept open after triggering the item.
     */
    trigger(options) {
        const { keepOpen } = { ...options };
        if (!this.disabled && !this.hasMenu) {
            this.triggered.next();
            if (!keepOpen) {
                this._menuStack.closeAll({ focusParentTrigger: true });
            }
        }
    }
    /** Return true if this MenuItem has an attached menu and it is open. */
    isMenuOpen() {
        return !!this._menuTrigger?.isOpen();
    }
    /**
     * Get a reference to the rendered Menu if the Menu is open and it is visible in the DOM.
     * @return the menu if it is open, otherwise undefined.
     */
    getMenu() {
        return this._menuTrigger?.getMenu();
    }
    /** Get the CdkMenuTrigger associated with this element. */
    getMenuTrigger() {
        return this._menuTrigger;
    }
    /** Get the label for this element which is required by the FocusableOption interface. */
    getLabel() {
        return this.typeaheadLabel || this._elementRef.nativeElement.textContent?.trim() || '';
    }
    /** Reset the tabindex to -1. */
    _resetTabIndex() {
        if (!this._isStandaloneItem()) {
            this._tabindex = -1;
        }
    }
    /**
     * Set the tab index to 0 if not disabled and it's a focus event, or a mouse enter if this element
     * is not in a menu bar.
     */
    _setTabIndex(event) {
        if (this.disabled) {
            return;
        }
        // don't set the tabindex if there are no open sibling or parent menus
        if (!event || !this._menuStack.isEmpty()) {
            this._tabindex = 0;
        }
    }
    /**
     * Handles keyboard events for the menu item, specifically either triggering the user defined
     * callback or opening/closing the current menu based on whether the left or right arrow key was
     * pressed.
     * @param event the keyboard event to handle
     */
    _onKeydown(event) {
        switch (event.keyCode) {
            case SPACE:
            case ENTER:
                if (!hasModifierKey(event)) {
                    this.trigger({ keepOpen: event.keyCode === SPACE && !this.closeOnSpacebarTrigger });
                }
                break;
            case RIGHT_ARROW:
                if (!hasModifierKey(event)) {
                    if (this._parentMenu && this._isParentVertical()) {
                        if (this._dir?.value !== 'rtl') {
                            this._forwardArrowPressed(event);
                        }
                        else {
                            this._backArrowPressed(event);
                        }
                    }
                }
                break;
            case LEFT_ARROW:
                if (!hasModifierKey(event)) {
                    if (this._parentMenu && this._isParentVertical()) {
                        if (this._dir?.value !== 'rtl') {
                            this._backArrowPressed(event);
                        }
                        else {
                            this._forwardArrowPressed(event);
                        }
                    }
                }
                break;
        }
    }
    /** Whether this menu item is standalone or within a menu or menu bar. */
    _isStandaloneItem() {
        return !this._parentMenu;
    }
    /**
     * Handles the user pressing the back arrow key.
     * @param event The keyboard event.
     */
    _backArrowPressed(event) {
        const parentMenu = this._parentMenu;
        if (this._menuStack.hasInlineMenu() || this._menuStack.length() > 1) {
            event.preventDefault();
            this._menuStack.close(parentMenu, {
                focusNextOnEmpty: this._menuStack.inlineMenuOrientation() === 'horizontal'
                    ? 1 /* FocusNext.previousItem */
                    : 2 /* FocusNext.currentItem */,
                focusParentTrigger: true,
            });
        }
    }
    /**
     * Handles the user pressing the forward arrow key.
     * @param event The keyboard event.
     */
    _forwardArrowPressed(event) {
        if (!this.hasMenu && this._menuStack.inlineMenuOrientation() === 'horizontal') {
            event.preventDefault();
            this._menuStack.closeAll({
                focusNextOnEmpty: 0 /* FocusNext.nextItem */,
                focusParentTrigger: true,
            });
        }
    }
    /**
     * Subscribe to the mouseenter events and close any sibling menu items if this element is moused
     * into.
     */
    _setupMouseEnter() {
        if (!this._isStandaloneItem()) {
            const closeOpenSiblings = () => this._ngZone.run(() => this._menuStack.closeSubMenuOf(this._parentMenu));
            this._ngZone.runOutsideAngular(() => fromEvent(this._elementRef.nativeElement, 'mouseenter')
                .pipe(filter(() => !this._menuStack.isEmpty() && !this.hasMenu), takeUntil(this.destroyed))
                .subscribe(() => {
                if (this._menuAim) {
                    this._menuAim.toggle(closeOpenSiblings);
                }
                else {
                    closeOpenSiblings();
                }
            }));
        }
    }
    /**
     * Return true if the enclosing parent menu is configured in a horizontal orientation, false
     * otherwise or if no parent.
     */
    _isParentVertical() {
        return this._parentMenu?.orientation === 'vertical';
    }
    /** Sets the `type` attribute of the menu item. */
    _setType() {
        const element = this._elementRef.nativeElement;
        if (element.nodeName === 'BUTTON' && !element.getAttribute('type')) {
            // Prevent form submissions.
            element.setAttribute('type', 'button');
        }
    }
}
CdkMenuItem.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.0.0-rc.1", ngImport: i0, type: CdkMenuItem, deps: [], target: i0.ɵɵFactoryTarget.Directive });
CdkMenuItem.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "15.0.0-rc.1", type: CdkMenuItem, isStandalone: true, selector: "[cdkMenuItem]", inputs: { disabled: ["cdkMenuItemDisabled", "disabled"], typeaheadLabel: ["cdkMenuitemTypeaheadLabel", "typeaheadLabel"] }, outputs: { triggered: "cdkMenuItemTriggered" }, host: { attributes: { "role": "menuitem" }, listeners: { "blur": "_resetTabIndex()", "focus": "_setTabIndex()", "click": "trigger()", "keydown": "_onKeydown($event)" }, properties: { "tabindex": "_tabindex", "attr.aria-disabled": "disabled || null" }, classAttribute: "cdk-menu-item" }, exportAs: ["cdkMenuItem"], ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.0.0-rc.1", ngImport: i0, type: CdkMenuItem, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkMenuItem]',
                    exportAs: 'cdkMenuItem',
                    standalone: true,
                    host: {
                        'role': 'menuitem',
                        'class': 'cdk-menu-item',
                        '[tabindex]': '_tabindex',
                        '[attr.aria-disabled]': 'disabled || null',
                        '(blur)': '_resetTabIndex()',
                        '(focus)': '_setTabIndex()',
                        '(click)': 'trigger()',
                        '(keydown)': '_onKeydown($event)',
                    },
                }]
        }], ctorParameters: function () { return []; }, propDecorators: { disabled: [{
                type: Input,
                args: ['cdkMenuItemDisabled']
            }], typeaheadLabel: [{
                type: Input,
                args: ['cdkMenuitemTypeaheadLabel']
            }], triggered: [{
                type: Output,
                args: ['cdkMenuItemTriggered']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS1pdGVtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9tZW51L21lbnUtaXRlbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osTUFBTSxFQUNOLEtBQUssRUFDTCxNQUFNLEVBRU4sTUFBTSxHQUNQLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBZSxxQkFBcUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRTFFLE9BQU8sRUFBQyxLQUFLLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDNUYsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxTQUFTLEVBQUUsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3hDLE9BQU8sRUFBQyxNQUFNLEVBQUUsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDakQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxRQUFRLEVBQU8sTUFBTSxrQkFBa0IsQ0FBQztBQUNoRCxPQUFPLEVBQVksVUFBVSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBRW5ELE9BQU8sRUFBQyxRQUFRLEVBQVUsTUFBTSxZQUFZLENBQUM7O0FBRTdDOzs7O0dBSUc7QUFnQkgsTUFBTSxPQUFPLFdBQVc7SUEyRHRCO1FBMURBLCtEQUErRDtRQUM1QyxTQUFJLEdBQUcsTUFBTSxDQUFDLGNBQWMsRUFBRSxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO1FBRW5FLDBDQUEwQztRQUNqQyxnQkFBVyxHQUE0QixNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFbkUsd0JBQXdCO1FBQ2QsWUFBTyxHQUFH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ZCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQztRQUUvQyxJQUFJLE9BQU8sQ0FBQyxRQUFRLEtBQUssUUFBUSxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUNsRSw0QkFBNEI7WUFDNUIsT0FBTyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7U0FDeEM7SUFDSCxDQUFDOzs2R0FuUVUsV0FBVztpR0FBWCxXQUFXO2dHQUFYLFdBQVc7a0JBZnZCLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLGVBQWU7b0JBQ3pCLFFBQVEsRUFBRSxhQUFhO29CQUN2QixVQUFVLEVBQUUsSUFBSTtvQkFDaEIsSUFBSSxFQUFFO3dCQUNKLE1BQU0sRUFBRSxVQUFVO3dCQUNsQixPQUFPLEVBQUUsZUFBZTt3QkFDeEIsWUFBWSxFQUFFLFdBQVc7d0JBQ3pCLHNCQUFzQixFQUFFLGtCQUFrQjt3QkFDMUMsUUFBUSxFQUFFLGtCQUFrQjt3QkFDNUIsU0FBUyxFQUFFLGdCQUFnQjt3QkFDM0IsU0FBUyxFQUFFLFdBQVc7d0JBQ3RCLFdBQVcsRUFBRSxvQkFBb0I7cUJBQ2xDO2lCQUNGOzBFQXlCSyxRQUFRO3NCQURYLEtBQUs7dUJBQUMscUJBQXFCO2dCQWFRLGNBQWM7c0JBQWpELEtBQUs7dUJBQUMsMkJBQTJCO2dCQU1PLFNBQVM7c0JBQWpELE1BQU07dUJBQUMsc0JBQXNCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBpbmplY3QsXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgT3V0cHV0LFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Qm9vbGVhbklucHV0LCBjb2VyY2VCb29sZWFuUHJvcGVydHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge0ZvY3VzYWJsZU9wdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2ExMXknO1xuaW1wb3J0IHtFTlRFUiwgaGFzTW9kaWZpZXJLZXksIExFRlRfQVJST1csIFJJR0hUX0FSUk9XLCBTUEFDRX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2tleWNvZGVzJztcbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7ZnJvbUV2ZW50LCBTdWJqZWN0fSBmcm9tICdyeGpzJztcbmltcG9ydCB7ZmlsdGVyLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7Q2RrTWVudVRyaWdnZXJ9IGZyb20gJy4vbWVudS10cmlnZ2VyJztcbmltcG9ydCB7Q0RLX01FTlUsIE1lbnV9IGZyb20gJy4vbWVudS1pbnRlcmZhY2UnO1xuaW1wb3J0IHtGb2N1c05leHQsIE1FTlVfU1RBQ0t9IGZyb20gJy4vbWVudS1zdGFjayc7XG5pbXBvcnQge0ZvY3VzYWJsZUVsZW1lbnR9IGZyb20gJy4vcG9pbnRlci1mb2N1cy10cmFja2VyJztcbmltcG9ydCB7TUVOVV9BSU0sIFRvZ2dsZXJ9IGZyb20gJy4vbWVudS1haW0nO1xuXG4vKipcbiAqIERpcmVjdGl2ZSB3aGljaCBwcm92aWRlcyB0aGUgYWJpbGl0eSBmb3IgYW4gZWxlbWVudCB0byBiZSBmb2N1c2VkIGFuZCBuYXZpZ2F0ZWQgdG8gdXNpbmcgdGhlXG4gKiBrZXlib2FyZCB3aGVuIHJlc2lkaW5nIGluIGEgQ2RrTWVudSwgQ2RrTWVudUJhciwgb3IgQ2RrTWVudUdyb3VwLiBJdCBwZXJmb3JtcyB1c2VyIGRlZmluZWRcbiAqIGJlaGF2aW9yIHdoZW4gY2xpY2tlZC5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka01lbnVJdGVtXScsXG4gIGV4cG9ydEFzOiAnY2RrTWVudUl0ZW0nLFxuICBzdGFuZGFsb25lOiB0cnVlLFxuICBob3N0OiB7XG4gICAgJ3JvbGUnOiAnbWVudWl0ZW0nLFxuICAgICdjbGFzcyc6ICdjZGstbWVudS1pdGVtJyxcbiAgICAnW3RhYmluZGV4XSc6ICdfdGFiaW5kZXgnLFxuICAgICdbYXR0ci5hcmlhLWRpc2FibGVkXSc6ICdkaXNhYmxlZCB8fCBudWxsJyxcbiAgICAnKGJsdXIpJzogJ19yZXNldFRhYkluZGV4KCknLFxuICAgICcoZm9jdXMpJzogJ19zZXRUYWJJbmRleCgpJyxcbiAgICAnKGNsaWNrKSc6ICd0cmlnZ2VyKCknLFxuICAgICcoa2V5ZG93biknOiAnX29uS2V5ZG93bigkZXZlbnQpJyxcbiAgfSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrTWVudUl0ZW0gaW1wbGVtZW50cyBGb2N1c2FibGVPcHRpb24sIEZvY3VzYWJsZUVsZW1lbnQsIFRvZ2dsZXIsIE9uRGVzdHJveSB7XG4gIC8qKiBUaGUgZGlyZWN0aW9uYWxpdHkgKHRleHQgZGlyZWN0aW9uKSBvZiB0aGUgY3VycmVudCBwYWdlLiAqL1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgX2RpciA9IGluamVjdChEaXJlY3Rpb25hbGl0eSwge29wdGlvbmFsOiB0cnVlfSk7XG5cbiAgLyoqIFRoZSBtZW51J3MgbmF0aXZlIERPTSBob3N0IGVsZW1lbnQuICovXG4gIHJlYWRvbmx5IF9lbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiA9IGluamVjdChFbGVtZW50UmVmKTtcblxuICAvKiogVGhlIEFuZ3VsYXIgem9uZS4gKi9cbiAgcHJvdGVjdGVkIF9uZ1pvbmUgPSBpbmplY3QoTmdab25lKTtcblxuICAvKiogVGhlIG1lbnUgYWltIHNlcnZpY2UgdXNlZCBieSB0aGlzIG1lbnUuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX21lbnVBaW0gPSBpbmplY3QoTUVOVV9BSU0sIHtvcHRpb25hbDogdHJ1ZX0pO1xuXG4gIC8qKiBUaGUgc3RhY2sgb2YgbWVudXMgdGhpcyBtZW51IGJlbG9uZ3MgdG8uICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX21lbnVTdGFjayA9IGluamVjdChNRU5VX1NUQUNLKTtcblxuICAvKiogVGhlIHBhcmVudCBtZW51IGluIHdoaWNoIHRoaXMgbWVudWl0ZW0gcmVzaWRlcy4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfcGFyZW50TWVudSA9IGluamVjdChDREtfTUVOVSwge29wdGlvbmFsOiB0cnVlfSk7XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgQ2RrTWVudUl0ZW1UcmlnZ2VyIGRpcmVjdGl2ZSBpZiBvbmUgaXMgYWRkZWQgdG8gdGhlIHNhbWUgZWxlbWVudCAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9tZW51VHJpZ2dlciA9IGluamVjdChDZGtNZW51VHJpZ2dlciwge29wdGlvbmFsOiB0cnVlLCBzZWxmOiB0cnVlfSk7XG5cbiAgLyoqICBXaGV0aGVyIHRoZSBDZGtNZW51SXRlbSBpcyBkaXNhYmxlZCAtIGRlZmF1bHRzIHRvIGZhbHNlICovXG4gIEBJbnB1dCgnY2RrTWVudUl0ZW1EaXNhYmxlZCcpXG4gIGdldCBkaXNhYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fZGlzYWJsZWQ7XG4gIH1cbiAgc2V0IGRpc2FibGVkKHZhbHVlOiBCb29sZWFuSW5wdXQpIHtcbiAgICB0aGlzLl9kaXNhYmxlZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gIH1cbiAgcHJpdmF0ZSBfZGlzYWJsZWQgPSBmYWxzZTtcblxuICAvKipcbiAgICogVGhlIHRleHQgdXNlZCB0byBsb2NhdGUgdGhpcyBpdGVtIGR1cmluZyBtZW51IHR5cGVhaGVhZC4gSWYgbm90IHNwZWNpZmllZCxcbiAgICogdGhlIGB0ZXh0Q29udGVudGAgb2YgdGhlIGl0ZW0gd2lsbCBiZSB1c2VkLlxuICAgKi9cbiAgQElucHV0KCdjZGtNZW51aXRlbVR5cGVhaGVhZExhYmVsJykgdHlwZWFoZWFkTGFiZWw6IHN0cmluZyB8IG51bGw7XG5cbiAgLyoqXG4gICAqIElmIHRoaXMgTWVudUl0ZW0gaXMgYSByZWd1bGFyIE1lbnVJdGVtLCBvdXRwdXRzIHdoZW4gaXQgaXMgdHJpZ2dlcmVkIGJ5IGEga2V5Ym9hcmQgb3IgbW91c2VcbiAgICogZXZlbnQuXG4gICAqL1xuICBAT3V0cHV0KCdjZGtNZW51SXRlbVRyaWdnZXJlZCcpIHJlYWRvbmx5IHRyaWdnZXJlZDogRXZlbnRFbWl0dGVyPHZvaWQ+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBtZW51IGl0ZW0gb3BlbnMgYSBtZW51LiAqL1xuICByZWFkb25seSBoYXNNZW51ID0gISF0aGlzLl9tZW51VHJpZ2dlcjtcblxuICAvKipcbiAgICogVGhlIHRhYmluZGV4IGZvciB0aGlzIG1lbnUgaXRlbSBtYW5hZ2VkIGludGVybmFsbHkgYW5kIHVzZWQgZm9yIGltcGxlbWVudGluZyByb3ZpbmcgYVxuICAgKiB0YWIgaW5kZXguXG4gICAqL1xuICBfdGFiaW5kZXg6IDAgfCAtMSA9IC0xO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBpdGVtIHNob3VsZCBjbG9zZSB0aGUgbWVudSBpZiB0cmlnZ2VyZWQgYnkgdGhlIHNwYWNlYmFyLiAqL1xuICBwcm90ZWN0ZWQgY2xvc2VPblNwYWNlYmFyVHJpZ2dlciA9IHRydWU7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIG1lbnUgaXRlbSBpcyBkZXN0cm95ZWQuICovXG4gIHByb3RlY3RlZCByZWFkb25seSBkZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX3NldHVwTW91c2VFbnRlcigpO1xuICAgIHRoaXMuX3NldFR5cGUoKTtcblxuICAgIGlmICh0aGlzLl9pc1N0YW5kYWxvbmVJdGVtKCkpIHtcbiAgICAgIHRoaXMuX3RhYmluZGV4ID0gMDtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLmRlc3Ryb3llZC5uZXh0KCk7XG4gICAgdGhpcy5kZXN0cm95ZWQuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKiBQbGFjZSBmb2N1cyBvbiB0aGUgZWxlbWVudC4gKi9cbiAgZm9jdXMoKSB7XG4gICAgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmZvY3VzKCk7XG4gIH1cblxuICAvKipcbiAgICogSWYgdGhlIG1lbnUgaXRlbSBpcyBub3QgZGlzYWJsZWQgYW5kIHRoZSBlbGVtZW50IGRvZXMgbm90IGhhdmUgYSBtZW51IHRyaWdnZXIgYXR0YWNoZWQsIGVtaXRcbiAgICogb24gdGhlIGNka01lbnVJdGVtVHJpZ2dlcmVkIGVtaXR0ZXIgYW5kIGNsb3NlIGFsbCBvcGVuIG1lbnVzLlxuICAgKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIHRoZSBjb25maWd1cmUgaG93IHRoZSBpdGVtIGlzIHRyaWdnZXJlZFxuICAgKiAgIC0ga2VlcE9wZW46IHNwZWNpZmllcyB0aGF0IHRoZSBtZW51IHNob3VsZCBiZSBrZXB0IG9wZW4gYWZ0ZXIgdHJpZ2dlcmluZyB0aGUgaXRlbS5cbiAgICovXG4gIHRyaWdnZXIob3B0aW9ucz86IHtrZWVwT3BlbjogYm9vbGVhbn0pIHtcbiAgICBjb25zdCB7a2VlcE9wZW59ID0gey4uLm9wdGlvbnN9O1xuICAgIGlmICghdGhpcy5kaXNhYmxlZCAmJiAhdGhpcy5oYXNNZW51KSB7XG4gICAgICB0aGlzLnRyaWdnZXJlZC5uZXh0KCk7XG4gICAgICBpZiAoIWtlZXBPcGVuKSB7XG4gICAgICAgIHRoaXMuX21lbnVTdGFjay5jbG9zZUFsbCh7Zm9jdXNQYXJlbnRUcmlnZ2VyOiB0cnVlfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIFJldHVybiB0cnVlIGlmIHRoaXMgTWVudUl0ZW0gaGFzIGFuIGF0dGFjaGVkIG1lbnUgYW5kIGl0IGlzIG9wZW4uICovXG4gIGlzTWVudU9wZW4oKSB7XG4gICAgcmV0dXJuICEhdGhpcy5fbWVudVRyaWdnZXI/LmlzT3BlbigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHJlZmVyZW5jZSB0byB0aGUgcmVuZGVyZWQgTWVudSBpZiB0aGUgTWVudSBpcyBvcGVuIGFuZCBpdCBpcyB2aXNpYmxlIGluIHRoZSBET00uXG4gICAqIEByZXR1cm4gdGhlIG1lbnUgaWYgaXQgaXMgb3Blbiwgb3RoZXJ3aXNlIHVuZGVmaW5lZC5cbiAgICovXG4gIGdldE1lbnUoKTogTWVudSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX21lbnVUcmlnZ2VyPy5nZXRNZW51KCk7XG4gIH1cblxuICAvKiogR2V0IHRoZSBDZGtNZW51VHJpZ2dlciBhc3NvY2lhdGVkIHdpdGggdGhpcyBlbGVtZW50LiAqL1xuICBnZXRNZW51VHJpZ2dlcigpOiBDZGtNZW51VHJpZ2dlciB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLl9tZW51VHJpZ2dlcjtcbiAgfVxuXG4gIC8qKiBHZXQgdGhlIGxhYmVsIGZvciB0aGlzIGVsZW1lbnQgd2hpY2ggaXMgcmVxdWlyZWQgYnkgdGhlIEZvY3VzYWJsZU9wdGlvbiBpbnRlcmZhY2UuICovXG4gIGdldExhYmVsKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMudHlwZWFoZWFkTGFiZWwgfHwgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnRleHRDb250ZW50Py50cmltKCkgfHwgJyc7XG4gIH1cblxuICAvKiogUmVzZXQgdGhlIHRhYmluZGV4IHRvIC0xLiAqL1xuICBfcmVzZXRUYWJJbmRleCgpIHtcbiAgICBpZiAoIXRoaXMuX2lzU3RhbmRhbG9uZUl0ZW0oKSkge1xuICAgICAgdGhpcy5fdGFiaW5kZXggPSAtMTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSB0YWIgaW5kZXggdG8gMCBpZiBub3QgZGlzYWJsZWQgYW5kIGl0J3MgYSBmb2N1cyBldmVudCwgb3IgYSBtb3VzZSBlbnRlciBpZiB0aGlzIGVsZW1lbnRcbiAgICogaXMgbm90IGluIGEgbWVudSBiYXIuXG4gICAqL1xuICBfc2V0VGFiSW5kZXgoZXZlbnQ/OiBNb3VzZUV2ZW50KSB7XG4gICAgaWYgKHRoaXMuZGlzYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBkb24ndCBzZXQgdGhlIHRhYmluZGV4IGlmIHRoZXJlIGFyZSBubyBvcGVuIHNpYmxpbmcgb3IgcGFyZW50IG1lbnVzXG4gICAgaWYgKCFldmVudCB8fCAhdGhpcy5fbWVudVN0YWNrLmlzRW1wdHkoKSkge1xuICAgICAgdGhpcy5fdGFiaW5kZXggPSAwO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIGtleWJvYXJkIGV2ZW50cyBmb3IgdGhlIG1lbnUgaXRlbSwgc3BlY2lmaWNhbGx5IGVpdGhlciB0cmlnZ2VyaW5nIHRoZSB1c2VyIGRlZmluZWRcbiAgICogY2FsbGJhY2sgb3Igb3BlbmluZy9jbG9zaW5nIHRoZSBjdXJyZW50IG1lbnUgYmFzZWQgb24gd2hldGhlciB0aGUgbGVmdCBvciByaWdodCBhcnJvdyBrZXkgd2FzXG4gICAqIHByZXNzZWQuXG4gICAqIEBwYXJhbSBldmVudCB0aGUga2V5Ym9hcmQgZXZlbnQgdG8gaGFuZGxlXG4gICAqL1xuICBfb25LZXlkb3duKGV2ZW50OiBLZXlib2FyZEV2ZW50KSB7XG4gICAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG4gICAgICBjYXNlIFNQQUNFOlxuICAgICAgY2FzZSBFTlRFUjpcbiAgICAgICAgaWYgKCFoYXNNb2RpZmllcktleShldmVudCkpIHtcbiAgICAgICAgICB0aGlzLnRyaWdnZXIoe2tlZXBPcGVuOiBldmVudC5rZXlDb2RlID09PSBTUEFDRSAmJiAhdGhpcy5jbG9zZU9uU3BhY2ViYXJUcmlnZ2VyfSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgUklHSFRfQVJST1c6XG4gICAgICAgIGlmICghaGFzTW9kaWZpZXJLZXkoZXZlbnQpKSB7XG4gICAgICAgICAgaWYgKHRoaXMuX3BhcmVudE1lbnUgJiYgdGhpcy5faXNQYXJlbnRWZXJ0aWNhbCgpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fZGlyPy52YWx1ZSAhPT0gJ3J0bCcpIHtcbiAgICAgICAgICAgICAgdGhpcy5fZm9yd2FyZEFycm93UHJlc3NlZChldmVudCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aGlzLl9iYWNrQXJyb3dQcmVzc2VkKGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgTEVGVF9BUlJPVzpcbiAgICAgICAgaWYgKCFoYXNNb2RpZmllcktleShldmVudCkpIHtcbiAgICAgICAgICBpZiAodGhpcy5fcGFyZW50TWVudSAmJiB0aGlzLl9pc1BhcmVudFZlcnRpY2FsKCkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9kaXI/LnZhbHVlICE9PSAncnRsJykge1xuICAgICAgICAgICAgICB0aGlzLl9iYWNrQXJyb3dQcmVzc2VkKGV2ZW50KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMuX2ZvcndhcmRBcnJvd1ByZXNzZWQoZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICAvKiogV2hldGhlciB0aGlzIG1lbnUgaXRlbSBpcyBzdGFuZGFsb25lIG9yIHdpdGhpbiBhIG1lbnUgb3IgbWVudSBiYXIuICovXG4gIHByaXZhdGUgX2lzU3RhbmRhbG9uZUl0ZW0oKSB7XG4gICAgcmV0dXJuICF0aGlzLl9wYXJlbnRNZW51O1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgdGhlIHVzZXIgcHJlc3NpbmcgdGhlIGJhY2sgYXJyb3cga2V5LlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIGtleWJvYXJkIGV2ZW50LlxuICAgKi9cbiAgcHJpdmF0ZSBfYmFja0Fycm93UHJlc3NlZChldmVudDogS2V5Ym9hcmRFdmVudCkge1xuICAgIGNvbnN0IHBhcmVudE1lbnUgPSB0aGlzLl9wYXJlbnRNZW51ITtcbiAgICBpZiAodGhpcy5fbWVudVN0YWNrLmhhc0lubGluZU1lbnUoKSB8fCB0aGlzLl9tZW51U3RhY2subGVuZ3RoKCkgPiAxKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5fbWVudVN0YWNrLmNsb3NlKHBhcmVudE1lbnUsIHtcbiAgICAgICAgZm9jdXNOZXh0T25FbXB0eTpcbiAgICAgICAgICB0aGlzLl9tZW51U3RhY2suaW5saW5lTWVudU9yaWVudGF0aW9uKCkgPT09ICdob3Jpem9udGFsJ1xuICAgICAgICAgICAgPyBGb2N1c05leHQucHJldmlvdXNJdGVtXG4gICAgICAgICAgICA6IEZvY3VzTmV4dC5jdXJyZW50SXRlbSxcbiAgICAgICAgZm9jdXNQYXJlbnRUcmlnZ2VyOiB0cnVlLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgdGhlIHVzZXIgcHJlc3NpbmcgdGhlIGZvcndhcmQgYXJyb3cga2V5LlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIGtleWJvYXJkIGV2ZW50LlxuICAgKi9cbiAgcHJpdmF0ZSBfZm9yd2FyZEFycm93UHJlc3NlZChldmVudDogS2V5Ym9hcmRFdmVudCkge1xuICAgIGlmICghdGhpcy5oYXNNZW51ICYmIHRoaXMuX21lbnVTdGFjay5pbmxpbmVNZW51T3JpZW50YXRpb24oKSA9PT0gJ2hvcml6b250YWwnKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5fbWVudVN0YWNrLmNsb3NlQWxsKHtcbiAgICAgICAgZm9jdXNOZXh0T25FbXB0eTogRm9jdXNOZXh0Lm5leHRJdGVtLFxuICAgICAgICBmb2N1c1BhcmVudFRyaWdnZXI6IHRydWUsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU3Vic2NyaWJlIHRvIHRoZSBtb3VzZWVudGVyIGV2ZW50cyBhbmQgY2xvc2UgYW55IHNpYmxpbmcgbWVudSBpdGVtcyBpZiB0aGlzIGVsZW1lbnQgaXMgbW91c2VkXG4gICAqIGludG8uXG4gICAqL1xuICBwcml2YXRlIF9zZXR1cE1vdXNlRW50ZXIoKSB7XG4gICAgaWYgKCF0aGlzLl9pc1N0YW5kYWxvbmVJdGVtKCkpIHtcbiAgICAgIGNvbnN0IGNsb3NlT3BlblNpYmxpbmdzID0gKCkgPT5cbiAgICAgICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiB0aGlzLl9tZW51U3RhY2suY2xvc2VTdWJNZW51T2YodGhpcy5fcGFyZW50TWVudSEpKTtcblxuICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+XG4gICAgICAgIGZyb21FdmVudCh0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsICdtb3VzZWVudGVyJylcbiAgICAgICAgICAucGlwZShcbiAgICAgICAgICAgIGZpbHRlcigoKSA9PiAhdGhpcy5fbWVudVN0YWNrLmlzRW1wdHkoKSAmJiAhdGhpcy5oYXNNZW51KSxcbiAgICAgICAgICAgIHRha2VVbnRpbCh0aGlzLmRlc3Ryb3llZCksXG4gICAgICAgICAgKVxuICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuX21lbnVBaW0pIHtcbiAgICAgICAgICAgICAgdGhpcy5fbWVudUFpbS50b2dnbGUoY2xvc2VPcGVuU2libGluZ3MpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY2xvc2VPcGVuU2libGluZ3MoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KSxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB0cnVlIGlmIHRoZSBlbmNsb3NpbmcgcGFyZW50IG1lbnUgaXMgY29uZmlndXJlZCBpbiBhIGhvcml6b250YWwgb3JpZW50YXRpb24sIGZhbHNlXG4gICAqIG90aGVyd2lzZSBvciBpZiBubyBwYXJlbnQuXG4gICAqL1xuICBwcml2YXRlIF9pc1BhcmVudFZlcnRpY2FsKCkge1xuICAgIHJldHVybiB0aGlzLl9wYXJlbnRNZW51Py5vcmllbnRhdGlvbiA9PT0gJ3ZlcnRpY2FsJztcbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBgdHlwZWAgYXR0cmlidXRlIG9mIHRoZSBtZW51IGl0ZW0uICovXG4gIHByaXZhdGUgX3NldFR5cGUoKSB7XG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcblxuICAgIGlmIChlbGVtZW50Lm5vZGVOYW1lID09PSAnQlVUVE9OJyAmJiAhZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ3R5cGUnKSkge1xuICAgICAgLy8gUHJldmVudCBmb3JtIHN1Ym1pc3Npb25zLlxuICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAnYnV0dG9uJyk7XG4gICAgfVxuICB9XG59XG4iXX0=