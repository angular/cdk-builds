/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, ElementRef, EventEmitter, Inject, Input, NgZone, Optional, Output, Self, } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { ENTER, hasModifierKey, LEFT_ARROW, RIGHT_ARROW, SPACE } from '@angular/cdk/keycodes';
import { Directionality } from '@angular/cdk/bidi';
import { fromEvent, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { CdkMenuTrigger } from './menu-trigger';
import { CDK_MENU } from './menu-interface';
import { MENU_STACK, MenuStack } from './menu-stack';
import { MENU_AIM } from './menu-aim';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/bidi";
import * as i2 from "./menu-trigger";
import * as i3 from "./menu-stack";
/**
 * Directive which provides the ability for an element to be focused and navigated to using the
 * keyboard when residing in a CdkMenu, CdkMenuBar, or CdkMenuGroup. It performs user defined
 * behavior when clicked.
 */
export class CdkMenuItem {
    constructor(
    /** The host element for this item. */
    _elementRef, 
    /** The Angular zone. */
    _ngZone, 
    /** The menu stack this item belongs to. */
    _menuStack, 
    /** The parent menu this item belongs to. */
    _parentMenu, 
    /** The menu aim service used for this item. */
    _menuAim, 
    /** The directionality of the page. */
    _dir, 
    /** Reference to the CdkMenuItemTrigger directive if one is added to the same element */
    // tslint:disable-next-line: lightweight-tokens
    _menuTrigger) {
        this._elementRef = _elementRef;
        this._ngZone = _ngZone;
        this._menuStack = _menuStack;
        this._parentMenu = _parentMenu;
        this._menuAim = _menuAim;
        this._dir = _dir;
        this._menuTrigger = _menuTrigger;
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
                    event.preventDefault();
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
                    ? 1 /* previousItem */
                    : 2 /* currentItem */,
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
                focusNextOnEmpty: 0 /* nextItem */,
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
}
CdkMenuItem.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.0.0-next.15", ngImport: i0, type: CdkMenuItem, deps: [{ token: i0.ElementRef }, { token: i0.NgZone }, { token: MENU_STACK }, { token: CDK_MENU, optional: true }, { token: MENU_AIM, optional: true }, { token: i1.Directionality, optional: true }, { token: i2.CdkMenuTrigger, optional: true, self: true }], target: i0.ɵɵFactoryTarget.Directive });
CdkMenuItem.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "14.0.0-next.15", type: CdkMenuItem, selector: "[cdkMenuItem]", inputs: { disabled: ["cdkMenuItemDisabled", "disabled"], typeaheadLabel: ["cdkMenuitemTypeaheadLabel", "typeaheadLabel"] }, outputs: { triggered: "cdkMenuItemTriggered" }, host: { attributes: { "role": "menuitem" }, listeners: { "blur": "_resetTabIndex()", "focus": "_setTabIndex()", "click": "trigger()", "keydown": "_onKeydown($event)" }, properties: { "tabindex": "_tabindex", "attr.aria-disabled": "disabled || null" }, classAttribute: "cdk-menu-item" }, exportAs: ["cdkMenuItem"], ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.0.0-next.15", ngImport: i0, type: CdkMenuItem, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkMenuItem]',
                    exportAs: 'cdkMenuItem',
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
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i0.NgZone }, { type: i3.MenuStack, decorators: [{
                    type: Inject,
                    args: [MENU_STACK]
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [CDK_MENU]
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [MENU_AIM]
                }] }, { type: i1.Directionality, decorators: [{
                    type: Optional
                }] }, { type: i2.CdkMenuTrigger, decorators: [{
                    type: Self
                }, {
                    type: Optional
                }] }]; }, propDecorators: { disabled: [{
                type: Input,
                args: ['cdkMenuItemDisabled']
            }], typeaheadLabel: [{
                type: Input,
                args: ['cdkMenuitemTypeaheadLabel']
            }], triggered: [{
                type: Output,
                args: ['cdkMenuItemTriggered']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS1pdGVtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9tZW51L21lbnUtaXRlbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osTUFBTSxFQUNOLEtBQUssRUFDTCxNQUFNLEVBRU4sUUFBUSxFQUNSLE1BQU0sRUFDTixJQUFJLEdBQ0wsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFlLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFMUUsT0FBTyxFQUFDLEtBQUssRUFBRSxjQUFjLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUM1RixPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDeEMsT0FBTyxFQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNqRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDOUMsT0FBTyxFQUFDLFFBQVEsRUFBTyxNQUFNLGtCQUFrQixDQUFDO0FBQ2hELE9BQU8sRUFBWSxVQUFVLEVBQUUsU0FBUyxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBRTlELE9BQU8sRUFBQyxRQUFRLEVBQW1CLE1BQU0sWUFBWSxDQUFDOzs7OztBQUV0RDs7OztHQUlHO0FBZUgsTUFBTSxPQUFPLFdBQVc7SUFzQ3RCO0lBQ0Usc0NBQXNDO0lBQzdCLFdBQW9DO0lBQzdDLHdCQUF3QjtJQUNQLE9BQWU7SUFDaEMsMkNBQTJDO0lBQ04sVUFBcUI7SUFDMUQsNENBQTRDO0lBQ0csV0FBa0I7SUFDakUsK0NBQStDO0lBQ0EsUUFBa0I7SUFDakUsc0NBQXNDO0lB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RTt3QkFDSixNQUFNLEVBQUUsVUFBVTt3QkFDbEIsT0FBTyxFQUFFLGVBQWU7d0JBQ3hCLFlBQVksRUFBRSxXQUFXO3dCQUN6QixzQkFBc0IsRUFBRSxrQkFBa0I7d0JBQzFDLFFBQVEsRUFBRSxrQkFBa0I7d0JBQzVCLFNBQVMsRUFBRSxnQkFBZ0I7d0JBQzNCLFNBQVMsRUFBRSxXQUFXO3dCQUN0QixXQUFXLEVBQUUsb0JBQW9CO3FCQUNsQztpQkFDRjs7MEJBNkNJLE1BQU07MkJBQUMsVUFBVTs7MEJBRWpCLFFBQVE7OzBCQUFJLE1BQU07MkJBQUMsUUFBUTs7MEJBRTNCLFFBQVE7OzBCQUFJLE1BQU07MkJBQUMsUUFBUTs7MEJBRTNCLFFBQVE7OzBCQUdSLElBQUk7OzBCQUFJLFFBQVE7NENBbERmLFFBQVE7c0JBRFgsS0FBSzt1QkFBQyxxQkFBcUI7Z0JBYVEsY0FBYztzQkFBakQsS0FBSzt1QkFBQywyQkFBMkI7Z0JBTU8sU0FBUztzQkFBakQsTUFBTTt1QkFBQyxzQkFBc0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIEluamVjdCxcbiAgSW5wdXQsXG4gIE5nWm9uZSxcbiAgT25EZXN0cm95LFxuICBPcHRpb25hbCxcbiAgT3V0cHV0LFxuICBTZWxmLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Qm9vbGVhbklucHV0LCBjb2VyY2VCb29sZWFuUHJvcGVydHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge0ZvY3VzYWJsZU9wdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2ExMXknO1xuaW1wb3J0IHtFTlRFUiwgaGFzTW9kaWZpZXJLZXksIExFRlRfQVJST1csIFJJR0hUX0FSUk9XLCBTUEFDRX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2tleWNvZGVzJztcbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7ZnJvbUV2ZW50LCBTdWJqZWN0fSBmcm9tICdyeGpzJztcbmltcG9ydCB7ZmlsdGVyLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7Q2RrTWVudVRyaWdnZXJ9IGZyb20gJy4vbWVudS10cmlnZ2VyJztcbmltcG9ydCB7Q0RLX01FTlUsIE1lbnV9IGZyb20gJy4vbWVudS1pbnRlcmZhY2UnO1xuaW1wb3J0IHtGb2N1c05leHQsIE1FTlVfU1RBQ0ssIE1lbnVTdGFja30gZnJvbSAnLi9tZW51LXN0YWNrJztcbmltcG9ydCB7Rm9jdXNhYmxlRWxlbWVudH0gZnJvbSAnLi9wb2ludGVyLWZvY3VzLXRyYWNrZXInO1xuaW1wb3J0IHtNRU5VX0FJTSwgTWVudUFpbSwgVG9nZ2xlcn0gZnJvbSAnLi9tZW51LWFpbSc7XG5cbi8qKlxuICogRGlyZWN0aXZlIHdoaWNoIHByb3ZpZGVzIHRoZSBhYmlsaXR5IGZvciBhbiBlbGVtZW50IHRvIGJlIGZvY3VzZWQgYW5kIG5hdmlnYXRlZCB0byB1c2luZyB0aGVcbiAqIGtleWJvYXJkIHdoZW4gcmVzaWRpbmcgaW4gYSBDZGtNZW51LCBDZGtNZW51QmFyLCBvciBDZGtNZW51R3JvdXAuIEl0IHBlcmZvcm1zIHVzZXIgZGVmaW5lZFxuICogYmVoYXZpb3Igd2hlbiBjbGlja2VkLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrTWVudUl0ZW1dJyxcbiAgZXhwb3J0QXM6ICdjZGtNZW51SXRlbScsXG4gIGhvc3Q6IHtcbiAgICAncm9sZSc6ICdtZW51aXRlbScsXG4gICAgJ2NsYXNzJzogJ2Nkay1tZW51LWl0ZW0nLFxuICAgICdbdGFiaW5kZXhdJzogJ190YWJpbmRleCcsXG4gICAgJ1thdHRyLmFyaWEtZGlzYWJsZWRdJzogJ2Rpc2FibGVkIHx8IG51bGwnLFxuICAgICcoYmx1ciknOiAnX3Jlc2V0VGFiSW5kZXgoKScsXG4gICAgJyhmb2N1cyknOiAnX3NldFRhYkluZGV4KCknLFxuICAgICcoY2xpY2spJzogJ3RyaWdnZXIoKScsXG4gICAgJyhrZXlkb3duKSc6ICdfb25LZXlkb3duKCRldmVudCknLFxuICB9LFxufSlcbmV4cG9ydCBjbGFzcyBDZGtNZW51SXRlbSBpbXBsZW1lbnRzIEZvY3VzYWJsZU9wdGlvbiwgRm9jdXNhYmxlRWxlbWVudCwgVG9nZ2xlciwgT25EZXN0cm95IHtcbiAgLyoqICBXaGV0aGVyIHRoZSBDZGtNZW51SXRlbSBpcyBkaXNhYmxlZCAtIGRlZmF1bHRzIHRvIGZhbHNlICovXG4gIEBJbnB1dCgnY2RrTWVudUl0ZW1EaXNhYmxlZCcpXG4gIGdldCBkaXNhYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fZGlzYWJsZWQ7XG4gIH1cbiAgc2V0IGRpc2FibGVkKHZhbHVlOiBCb29sZWFuSW5wdXQpIHtcbiAgICB0aGlzLl9kaXNhYmxlZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gIH1cbiAgcHJpdmF0ZSBfZGlzYWJsZWQgPSBmYWxzZTtcblxuICAvKipcbiAgICogVGhlIHRleHQgdXNlZCB0byBsb2NhdGUgdGhpcyBpdGVtIGR1cmluZyBtZW51IHR5cGVhaGVhZC4gSWYgbm90IHNwZWNpZmllZCxcbiAgICogdGhlIGB0ZXh0Q29udGVudGAgb2YgdGhlIGl0ZW0gd2lsbCBiZSB1c2VkLlxuICAgKi9cbiAgQElucHV0KCdjZGtNZW51aXRlbVR5cGVhaGVhZExhYmVsJykgdHlwZWFoZWFkTGFiZWw6IHN0cmluZyB8IG51bGw7XG5cbiAgLyoqXG4gICAqIElmIHRoaXMgTWVudUl0ZW0gaXMgYSByZWd1bGFyIE1lbnVJdGVtLCBvdXRwdXRzIHdoZW4gaXQgaXMgdHJpZ2dlcmVkIGJ5IGEga2V5Ym9hcmQgb3IgbW91c2VcbiAgICogZXZlbnQuXG4gICAqL1xuICBAT3V0cHV0KCdjZGtNZW51SXRlbVRyaWdnZXJlZCcpIHJlYWRvbmx5IHRyaWdnZXJlZDogRXZlbnRFbWl0dGVyPHZvaWQ+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBtZW51IGl0ZW0gb3BlbnMgYSBtZW51LiAqL1xuICByZWFkb25seSBoYXNNZW51ID0gISF0aGlzLl9tZW51VHJpZ2dlcjtcblxuICAvKipcbiAgICogVGhlIHRhYmluZGV4IGZvciB0aGlzIG1lbnUgaXRlbSBtYW5hZ2VkIGludGVybmFsbHkgYW5kIHVzZWQgZm9yIGltcGxlbWVudGluZyByb3ZpbmcgYVxuICAgKiB0YWIgaW5kZXguXG4gICAqL1xuICBfdGFiaW5kZXg6IDAgfCAtMSA9IC0xO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBpdGVtIHNob3VsZCBjbG9zZSB0aGUgbWVudSBpZiB0cmlnZ2VyZWQgYnkgdGhlIHNwYWNlYmFyLiAqL1xuICBwcm90ZWN0ZWQgY2xvc2VPblNwYWNlYmFyVHJpZ2dlciA9IHRydWU7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIG1lbnUgaXRlbSBpcyBkZXN0cm95ZWQuICovXG4gIHByb3RlY3RlZCByZWFkb25seSBkZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIC8qKiBUaGUgaG9zdCBlbGVtZW50IGZvciB0aGlzIGl0ZW0uICovXG4gICAgcmVhZG9ubHkgX2VsZW1lbnRSZWY6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgIC8qKiBUaGUgQW5ndWxhciB6b25lLiAqL1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX25nWm9uZTogTmdab25lLFxuICAgIC8qKiBUaGUgbWVudSBzdGFjayB0aGlzIGl0ZW0gYmVsb25ncyB0by4gKi9cbiAgICBASW5qZWN0KE1FTlVfU1RBQ0spIHByaXZhdGUgcmVhZG9ubHkgX21lbnVTdGFjazogTWVudVN0YWNrLFxuICAgIC8qKiBUaGUgcGFyZW50IG1lbnUgdGhpcyBpdGVtIGJlbG9uZ3MgdG8uICovXG4gICAgQE9wdGlvbmFsKCkgQEluamVjdChDREtfTUVOVSkgcHJpdmF0ZSByZWFkb25seSBfcGFyZW50TWVudT86IE1lbnUsXG4gICAgLyoqIFRoZSBtZW51IGFpbSBzZXJ2aWNlIHVzZWQgZm9yIHRoaXMgaXRlbS4gKi9cbiAgICBAT3B0aW9uYWwoKSBASW5qZWN0KE1FTlVfQUlNKSBwcml2YXRlIHJlYWRvbmx5IF9tZW51QWltPzogTWVudUFpbSxcbiAgICAvKiogVGhlIGRpcmVjdGlvbmFsaXR5IG9mIHRoZSBwYWdlLiAqL1xuICAgIEBPcHRpb25hbCgpIHByaXZhdGUgcmVhZG9ubHkgX2Rpcj86IERpcmVjdGlvbmFsaXR5LFxuICAgIC8qKiBSZWZlcmVuY2UgdG8gdGhlIENka01lbnVJdGVtVHJpZ2dlciBkaXJlY3RpdmUgaWYgb25lIGlzIGFkZGVkIHRvIHRoZSBzYW1lIGVsZW1lbnQgKi9cbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IGxpZ2h0d2VpZ2h0LXRva2Vuc1xuICAgIEBTZWxmKCkgQE9wdGlvbmFsKCkgcHJpdmF0ZSByZWFkb25seSBfbWVudVRyaWdnZXI/OiBDZGtNZW51VHJpZ2dlcixcbiAgKSB7XG4gICAgdGhpcy5fc2V0dXBNb3VzZUVudGVyKCk7XG5cbiAgICBpZiAodGhpcy5faXNTdGFuZGFsb25lSXRlbSgpKSB7XG4gICAgICB0aGlzLl90YWJpbmRleCA9IDA7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5kZXN0cm95ZWQubmV4dCgpO1xuICAgIHRoaXMuZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gIH1cblxuICAvKiogUGxhY2UgZm9jdXMgb24gdGhlIGVsZW1lbnQuICovXG4gIGZvY3VzKCkge1xuICAgIHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5mb2N1cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIElmIHRoZSBtZW51IGl0ZW0gaXMgbm90IGRpc2FibGVkIGFuZCB0aGUgZWxlbWVudCBkb2VzIG5vdCBoYXZlIGEgbWVudSB0cmlnZ2VyIGF0dGFjaGVkLCBlbWl0XG4gICAqIG9uIHRoZSBjZGtNZW51SXRlbVRyaWdnZXJlZCBlbWl0dGVyIGFuZCBjbG9zZSBhbGwgb3BlbiBtZW51cy5cbiAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyB0aGUgY29uZmlndXJlIGhvdyB0aGUgaXRlbSBpcyB0cmlnZ2VyZWRcbiAgICogICAtIGtlZXBPcGVuOiBzcGVjaWZpZXMgdGhhdCB0aGUgbWVudSBzaG91bGQgYmUga2VwdCBvcGVuIGFmdGVyIHRyaWdnZXJpbmcgdGhlIGl0ZW0uXG4gICAqL1xuICB0cmlnZ2VyKG9wdGlvbnM/OiB7a2VlcE9wZW46IGJvb2xlYW59KSB7XG4gICAgY29uc3Qge2tlZXBPcGVufSA9IHsuLi5vcHRpb25zfTtcbiAgICBpZiAoIXRoaXMuZGlzYWJsZWQgJiYgIXRoaXMuaGFzTWVudSkge1xuICAgICAgdGhpcy50cmlnZ2VyZWQubmV4dCgpO1xuICAgICAgaWYgKCFrZWVwT3Blbikge1xuICAgICAgICB0aGlzLl9tZW51U3RhY2suY2xvc2VBbGwoe2ZvY3VzUGFyZW50VHJpZ2dlcjogdHJ1ZX0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBSZXR1cm4gdHJ1ZSBpZiB0aGlzIE1lbnVJdGVtIGhhcyBhbiBhdHRhY2hlZCBtZW51IGFuZCBpdCBpcyBvcGVuLiAqL1xuICBpc01lbnVPcGVuKCkge1xuICAgIHJldHVybiAhIXRoaXMuX21lbnVUcmlnZ2VyPy5pc09wZW4oKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSByZWZlcmVuY2UgdG8gdGhlIHJlbmRlcmVkIE1lbnUgaWYgdGhlIE1lbnUgaXMgb3BlbiBhbmQgaXQgaXMgdmlzaWJsZSBpbiB0aGUgRE9NLlxuICAgKiBAcmV0dXJuIHRoZSBtZW51IGlmIGl0IGlzIG9wZW4sIG90aGVyd2lzZSB1bmRlZmluZWQuXG4gICAqL1xuICBnZXRNZW51KCk6IE1lbnUgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9tZW51VHJpZ2dlcj8uZ2V0TWVudSgpO1xuICB9XG5cbiAgLyoqIEdldCB0aGUgQ2RrTWVudVRyaWdnZXIgYXNzb2NpYXRlZCB3aXRoIHRoaXMgZWxlbWVudC4gKi9cbiAgZ2V0TWVudVRyaWdnZXIoKTogQ2RrTWVudVRyaWdnZXIgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9tZW51VHJpZ2dlcjtcbiAgfVxuXG4gIC8qKiBHZXQgdGhlIGxhYmVsIGZvciB0aGlzIGVsZW1lbnQgd2hpY2ggaXMgcmVxdWlyZWQgYnkgdGhlIEZvY3VzYWJsZU9wdGlvbiBpbnRlcmZhY2UuICovXG4gIGdldExhYmVsKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMudHlwZWFoZWFkTGFiZWwgfHwgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnRleHRDb250ZW50Py50cmltKCkgfHwgJyc7XG4gIH1cblxuICAvKiogUmVzZXQgdGhlIHRhYmluZGV4IHRvIC0xLiAqL1xuICBfcmVzZXRUYWJJbmRleCgpIHtcbiAgICBpZiAoIXRoaXMuX2lzU3RhbmRhbG9uZUl0ZW0oKSkge1xuICAgICAgdGhpcy5fdGFiaW5kZXggPSAtMTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSB0YWIgaW5kZXggdG8gMCBpZiBub3QgZGlzYWJsZWQgYW5kIGl0J3MgYSBmb2N1cyBldmVudCwgb3IgYSBtb3VzZSBlbnRlciBpZiB0aGlzIGVsZW1lbnRcbiAgICogaXMgbm90IGluIGEgbWVudSBiYXIuXG4gICAqL1xuICBfc2V0VGFiSW5kZXgoZXZlbnQ/OiBNb3VzZUV2ZW50KSB7XG4gICAgaWYgKHRoaXMuZGlzYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBkb24ndCBzZXQgdGhlIHRhYmluZGV4IGlmIHRoZXJlIGFyZSBubyBvcGVuIHNpYmxpbmcgb3IgcGFyZW50IG1lbnVzXG4gICAgaWYgKCFldmVudCB8fCAhdGhpcy5fbWVudVN0YWNrLmlzRW1wdHkoKSkge1xuICAgICAgdGhpcy5fdGFiaW5kZXggPSAwO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIGtleWJvYXJkIGV2ZW50cyBmb3IgdGhlIG1lbnUgaXRlbSwgc3BlY2lmaWNhbGx5IGVpdGhlciB0cmlnZ2VyaW5nIHRoZSB1c2VyIGRlZmluZWRcbiAgICogY2FsbGJhY2sgb3Igb3BlbmluZy9jbG9zaW5nIHRoZSBjdXJyZW50IG1lbnUgYmFzZWQgb24gd2hldGhlciB0aGUgbGVmdCBvciByaWdodCBhcnJvdyBrZXkgd2FzXG4gICAqIHByZXNzZWQuXG4gICAqIEBwYXJhbSBldmVudCB0aGUga2V5Ym9hcmQgZXZlbnQgdG8gaGFuZGxlXG4gICAqL1xuICBfb25LZXlkb3duKGV2ZW50OiBLZXlib2FyZEV2ZW50KSB7XG4gICAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG4gICAgICBjYXNlIFNQQUNFOlxuICAgICAgY2FzZSBFTlRFUjpcbiAgICAgICAgaWYgKCFoYXNNb2RpZmllcktleShldmVudCkpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHRoaXMudHJpZ2dlcih7a2VlcE9wZW46IGV2ZW50LmtleUNvZGUgPT09IFNQQUNFICYmICF0aGlzLmNsb3NlT25TcGFjZWJhclRyaWdnZXJ9KTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBSSUdIVF9BUlJPVzpcbiAgICAgICAgaWYgKCFoYXNNb2RpZmllcktleShldmVudCkpIHtcbiAgICAgICAgICBpZiAodGhpcy5fcGFyZW50TWVudSAmJiB0aGlzLl9pc1BhcmVudFZlcnRpY2FsKCkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9kaXI/LnZhbHVlICE9PSAncnRsJykge1xuICAgICAgICAgICAgICB0aGlzLl9mb3J3YXJkQXJyb3dQcmVzc2VkKGV2ZW50KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMuX2JhY2tBcnJvd1ByZXNzZWQoZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBMRUZUX0FSUk9XOlxuICAgICAgICBpZiAoIWhhc01vZGlmaWVyS2V5KGV2ZW50KSkge1xuICAgICAgICAgIGlmICh0aGlzLl9wYXJlbnRNZW51ICYmIHRoaXMuX2lzUGFyZW50VmVydGljYWwoKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2Rpcj8udmFsdWUgIT09ICdydGwnKSB7XG4gICAgICAgICAgICAgIHRoaXMuX2JhY2tBcnJvd1ByZXNzZWQoZXZlbnQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5fZm9yd2FyZEFycm93UHJlc3NlZChldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBXaGV0aGVyIHRoaXMgbWVudSBpdGVtIGlzIHN0YW5kYWxvbmUgb3Igd2l0aGluIGEgbWVudSBvciBtZW51IGJhci4gKi9cbiAgcHJpdmF0ZSBfaXNTdGFuZGFsb25lSXRlbSgpIHtcbiAgICByZXR1cm4gIXRoaXMuX3BhcmVudE1lbnU7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyB0aGUgdXNlciBwcmVzc2luZyB0aGUgYmFjayBhcnJvdyBrZXkuXG4gICAqIEBwYXJhbSBldmVudCBUaGUga2V5Ym9hcmQgZXZlbnQuXG4gICAqL1xuICBwcml2YXRlIF9iYWNrQXJyb3dQcmVzc2VkKGV2ZW50OiBLZXlib2FyZEV2ZW50KSB7XG4gICAgY29uc3QgcGFyZW50TWVudSA9IHRoaXMuX3BhcmVudE1lbnUhO1xuICAgIGlmICh0aGlzLl9tZW51U3RhY2suaGFzSW5saW5lTWVudSgpIHx8IHRoaXMuX21lbnVTdGFjay5sZW5ndGgoKSA+IDEpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLl9tZW51U3RhY2suY2xvc2UocGFyZW50TWVudSwge1xuICAgICAgICBmb2N1c05leHRPbkVtcHR5OlxuICAgICAgICAgIHRoaXMuX21lbnVTdGFjay5pbmxpbmVNZW51T3JpZW50YXRpb24oKSA9PT0gJ2hvcml6b250YWwnXG4gICAgICAgICAgICA/IEZvY3VzTmV4dC5wcmV2aW91c0l0ZW1cbiAgICAgICAgICAgIDogRm9jdXNOZXh0LmN1cnJlbnRJdGVtLFxuICAgICAgICBmb2N1c1BhcmVudFRyaWdnZXI6IHRydWUsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyB0aGUgdXNlciBwcmVzc2luZyB0aGUgZm9yd2FyZCBhcnJvdyBrZXkuXG4gICAqIEBwYXJhbSBldmVudCBUaGUga2V5Ym9hcmQgZXZlbnQuXG4gICAqL1xuICBwcml2YXRlIF9mb3J3YXJkQXJyb3dQcmVzc2VkKGV2ZW50OiBLZXlib2FyZEV2ZW50KSB7XG4gICAgaWYgKCF0aGlzLmhhc01lbnUgJiYgdGhpcy5fbWVudVN0YWNrLmlubGluZU1lbnVPcmllbnRhdGlvbigpID09PSAnaG9yaXpvbnRhbCcpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLl9tZW51U3RhY2suY2xvc2VBbGwoe1xuICAgICAgICBmb2N1c05leHRPbkVtcHR5OiBGb2N1c05leHQubmV4dEl0ZW0sXG4gICAgICAgIGZvY3VzUGFyZW50VHJpZ2dlcjogdHJ1ZSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJzY3JpYmUgdG8gdGhlIG1vdXNlZW50ZXIgZXZlbnRzIGFuZCBjbG9zZSBhbnkgc2libGluZyBtZW51IGl0ZW1zIGlmIHRoaXMgZWxlbWVudCBpcyBtb3VzZWRcbiAgICogaW50by5cbiAgICovXG4gIHByaXZhdGUgX3NldHVwTW91c2VFbnRlcigpIHtcbiAgICBpZiAoIXRoaXMuX2lzU3RhbmRhbG9uZUl0ZW0oKSkge1xuICAgICAgY29uc3QgY2xvc2VPcGVuU2libGluZ3MgPSAoKSA9PlxuICAgICAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHRoaXMuX21lbnVTdGFjay5jbG9zZVN1Yk1lbnVPZih0aGlzLl9wYXJlbnRNZW51ISkpO1xuXG4gICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT5cbiAgICAgICAgZnJvbUV2ZW50KHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudCwgJ21vdXNlZW50ZXInKVxuICAgICAgICAgIC5waXBlKFxuICAgICAgICAgICAgZmlsdGVyKCgpID0+ICF0aGlzLl9tZW51U3RhY2suaXNFbXB0eSgpICYmICF0aGlzLmhhc01lbnUpLFxuICAgICAgICAgICAgdGFrZVVudGlsKHRoaXMuZGVzdHJveWVkKSxcbiAgICAgICAgICApXG4gICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5fbWVudUFpbSkge1xuICAgICAgICAgICAgICB0aGlzLl9tZW51QWltLnRvZ2dsZShjbG9zZU9wZW5TaWJsaW5ncyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjbG9zZU9wZW5TaWJsaW5ncygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIHRydWUgaWYgdGhlIGVuY2xvc2luZyBwYXJlbnQgbWVudSBpcyBjb25maWd1cmVkIGluIGEgaG9yaXpvbnRhbCBvcmllbnRhdGlvbiwgZmFsc2VcbiAgICogb3RoZXJ3aXNlIG9yIGlmIG5vIHBhcmVudC5cbiAgICovXG4gIHByaXZhdGUgX2lzUGFyZW50VmVydGljYWwoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmVudE1lbnU/Lm9yaWVudGF0aW9uID09PSAndmVydGljYWwnO1xuICB9XG59XG4iXX0=