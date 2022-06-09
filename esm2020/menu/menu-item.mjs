/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, ElementRef, EventEmitter, inject, InjectFlags, Input, NgZone, Output, } from '@angular/core';
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
        this._dir = inject(Directionality, InjectFlags.Optional);
        /** The menu's native DOM host element. */
        this._elementRef = inject(ElementRef);
        /** The Angular zone. */
        this._ngZone = inject(NgZone);
        /** The menu aim service used by this menu. */
        this._menuAim = inject(MENU_AIM, InjectFlags.Optional);
        /** The stack of menus this menu belongs to. */
        this._menuStack = inject(MENU_STACK);
        /** The parent menu in which this menuitem resides. */
        this._parentMenu = inject(CDK_MENU, InjectFlags.Optional);
        /** Reference to the CdkMenuItemTrigger directive if one is added to the same element */
        this._menuTrigger = inject(CdkMenuTrigger, InjectFlags.Optional | InjectFlags.Self);
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
}
CdkMenuItem.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.0.1", ngImport: i0, type: CdkMenuItem, deps: [], target: i0.ɵɵFactoryTarget.Directive });
CdkMenuItem.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "14.0.1", type: CdkMenuItem, selector: "[cdkMenuItem]", inputs: { disabled: ["cdkMenuItemDisabled", "disabled"], typeaheadLabel: ["cdkMenuitemTypeaheadLabel", "typeaheadLabel"] }, outputs: { triggered: "cdkMenuItemTriggered" }, host: { attributes: { "role": "menuitem" }, listeners: { "blur": "_resetTabIndex()", "focus": "_setTabIndex()", "click": "trigger()", "keydown": "_onKeydown($event)" }, properties: { "tabindex": "_tabindex", "attr.aria-disabled": "disabled || null" }, classAttribute: "cdk-menu-item" }, exportAs: ["cdkMenuItem"], ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.0.1", ngImport: i0, type: CdkMenuItem, decorators: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS1pdGVtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9tZW51L21lbnUtaXRlbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osTUFBTSxFQUNOLFdBQVcsRUFDWCxLQUFLLEVBQ0wsTUFBTSxFQUVOLE1BQU0sR0FDUCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQWUscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUUxRSxPQUFPLEVBQUMsS0FBSyxFQUFFLGNBQWMsRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzVGLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsU0FBUyxFQUFFLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUN4QyxPQUFPLEVBQUMsTUFBTSxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUM5QyxPQUFPLEVBQUMsUUFBUSxFQUFPLE1BQU0sa0JBQWtCLENBQUM7QUFDaEQsT0FBTyxFQUFZLFVBQVUsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUVuRCxPQUFPLEVBQUMsUUFBUSxFQUFVLE1BQU0sWUFBWSxDQUFDOztBQUU3Qzs7OztHQUlHO0FBZUgsTUFBTSxPQUFPLFdBQVc7SUEyRHRCO1FBMURBLCtEQUErRDtRQUM1QyxTQUFJLEdBQUcsTUFBTSxDQUFDLGNBQWMsRUFBRSxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFdkUsMENBQTBDO1FBQ2pDLGdCQUFXLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRTFDLHdCQUF3QjtRQUNkLFlBQU8sR0FBRyxN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VCxRQUFRLEVBQUUsZUFBZTtvQkFDekIsUUFBUSxFQUFFLGFBQWE7b0JBQ3ZCLElBQUksRUFBRTt3QkFDSixNQUFNLEVBQUUsVUFBVTt3QkFDbEIsT0FBTyxFQUFFLGVBQWU7d0JBQ3hCLFlBQVksRUFBRSxXQUFXO3dCQUN6QixzQkFBc0IsRUFBRSxrQkFBa0I7d0JBQzFDLFFBQVEsRUFBRSxrQkFBa0I7d0JBQzVCLFNBQVMsRUFBRSxnQkFBZ0I7d0JBQzNCLFNBQVMsRUFBRSxXQUFXO3dCQUN0QixXQUFXLEVBQUUsb0JBQW9CO3FCQUNsQztpQkFDRjswRUF5QkssUUFBUTtzQkFEWCxLQUFLO3VCQUFDLHFCQUFxQjtnQkFhUSxjQUFjO3NCQUFqRCxLQUFLO3VCQUFDLDJCQUEyQjtnQkFNTyxTQUFTO3NCQUFqRCxNQUFNO3VCQUFDLHNCQUFzQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgaW5qZWN0LFxuICBJbmplY3RGbGFncyxcbiAgSW5wdXQsXG4gIE5nWm9uZSxcbiAgT25EZXN0cm95LFxuICBPdXRwdXQsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtCb29sZWFuSW5wdXQsIGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7Rm9jdXNhYmxlT3B0aW9ufSBmcm9tICdAYW5ndWxhci9jZGsvYTExeSc7XG5pbXBvcnQge0VOVEVSLCBoYXNNb2RpZmllcktleSwgTEVGVF9BUlJPVywgUklHSFRfQVJST1csIFNQQUNFfSBmcm9tICdAYW5ndWxhci9jZGsva2V5Y29kZXMnO1xuaW1wb3J0IHtEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtmcm9tRXZlbnQsIFN1YmplY3R9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtmaWx0ZXIsIHRha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtDZGtNZW51VHJpZ2dlcn0gZnJvbSAnLi9tZW51LXRyaWdnZXInO1xuaW1wb3J0IHtDREtfTUVOVSwgTWVudX0gZnJvbSAnLi9tZW51LWludGVyZmFjZSc7XG5pbXBvcnQge0ZvY3VzTmV4dCwgTUVOVV9TVEFDS30gZnJvbSAnLi9tZW51LXN0YWNrJztcbmltcG9ydCB7Rm9jdXNhYmxlRWxlbWVudH0gZnJvbSAnLi9wb2ludGVyLWZvY3VzLXRyYWNrZXInO1xuaW1wb3J0IHtNRU5VX0FJTSwgVG9nZ2xlcn0gZnJvbSAnLi9tZW51LWFpbSc7XG5cbi8qKlxuICogRGlyZWN0aXZlIHdoaWNoIHByb3ZpZGVzIHRoZSBhYmlsaXR5IGZvciBhbiBlbGVtZW50IHRvIGJlIGZvY3VzZWQgYW5kIG5hdmlnYXRlZCB0byB1c2luZyB0aGVcbiAqIGtleWJvYXJkIHdoZW4gcmVzaWRpbmcgaW4gYSBDZGtNZW51LCBDZGtNZW51QmFyLCBvciBDZGtNZW51R3JvdXAuIEl0IHBlcmZvcm1zIHVzZXIgZGVmaW5lZFxuICogYmVoYXZpb3Igd2hlbiBjbGlja2VkLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrTWVudUl0ZW1dJyxcbiAgZXhwb3J0QXM6ICdjZGtNZW51SXRlbScsXG4gIGhvc3Q6IHtcbiAgICAncm9sZSc6ICdtZW51aXRlbScsXG4gICAgJ2NsYXNzJzogJ2Nkay1tZW51LWl0ZW0nLFxuICAgICdbdGFiaW5kZXhdJzogJ190YWJpbmRleCcsXG4gICAgJ1thdHRyLmFyaWEtZGlzYWJsZWRdJzogJ2Rpc2FibGVkIHx8IG51bGwnLFxuICAgICcoYmx1ciknOiAnX3Jlc2V0VGFiSW5kZXgoKScsXG4gICAgJyhmb2N1cyknOiAnX3NldFRhYkluZGV4KCknLFxuICAgICcoY2xpY2spJzogJ3RyaWdnZXIoKScsXG4gICAgJyhrZXlkb3duKSc6ICdfb25LZXlkb3duKCRldmVudCknLFxuICB9LFxufSlcbmV4cG9ydCBjbGFzcyBDZGtNZW51SXRlbSBpbXBsZW1lbnRzIEZvY3VzYWJsZU9wdGlvbiwgRm9jdXNhYmxlRWxlbWVudCwgVG9nZ2xlciwgT25EZXN0cm95IHtcbiAgLyoqIFRoZSBkaXJlY3Rpb25hbGl0eSAodGV4dCBkaXJlY3Rpb24pIG9mIHRoZSBjdXJyZW50IHBhZ2UuICovXG4gIHByb3RlY3RlZCByZWFkb25seSBfZGlyID0gaW5qZWN0KERpcmVjdGlvbmFsaXR5LCBJbmplY3RGbGFncy5PcHRpb25hbCk7XG5cbiAgLyoqIFRoZSBtZW51J3MgbmF0aXZlIERPTSBob3N0IGVsZW1lbnQuICovXG4gIHJlYWRvbmx5IF9lbGVtZW50UmVmID0gaW5qZWN0KEVsZW1lbnRSZWYpO1xuXG4gIC8qKiBUaGUgQW5ndWxhciB6b25lLiAqL1xuICBwcm90ZWN0ZWQgX25nWm9uZSA9IGluamVjdChOZ1pvbmUpO1xuXG4gIC8qKiBUaGUgbWVudSBhaW0gc2VydmljZSB1c2VkIGJ5IHRoaXMgbWVudS4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfbWVudUFpbSA9IGluamVjdChNRU5VX0FJTSwgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpO1xuXG4gIC8qKiBUaGUgc3RhY2sgb2YgbWVudXMgdGhpcyBtZW51IGJlbG9uZ3MgdG8uICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX21lbnVTdGFjayA9IGluamVjdChNRU5VX1NUQUNLKTtcblxuICAvKiogVGhlIHBhcmVudCBtZW51IGluIHdoaWNoIHRoaXMgbWVudWl0ZW0gcmVzaWRlcy4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfcGFyZW50TWVudSA9IGluamVjdChDREtfTUVOVSwgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpO1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIENka01lbnVJdGVtVHJpZ2dlciBkaXJlY3RpdmUgaWYgb25lIGlzIGFkZGVkIHRvIHRoZSBzYW1lIGVsZW1lbnQgKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfbWVudVRyaWdnZXIgPSBpbmplY3QoQ2RrTWVudVRyaWdnZXIsIEluamVjdEZsYWdzLk9wdGlvbmFsIHwgSW5qZWN0RmxhZ3MuU2VsZik7XG5cbiAgLyoqICBXaGV0aGVyIHRoZSBDZGtNZW51SXRlbSBpcyBkaXNhYmxlZCAtIGRlZmF1bHRzIHRvIGZhbHNlICovXG4gIEBJbnB1dCgnY2RrTWVudUl0ZW1EaXNhYmxlZCcpXG4gIGdldCBkaXNhYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fZGlzYWJsZWQ7XG4gIH1cbiAgc2V0IGRpc2FibGVkKHZhbHVlOiBCb29sZWFuSW5wdXQpIHtcbiAgICB0aGlzLl9kaXNhYmxlZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gIH1cbiAgcHJpdmF0ZSBfZGlzYWJsZWQgPSBmYWxzZTtcblxuICAvKipcbiAgICogVGhlIHRleHQgdXNlZCB0byBsb2NhdGUgdGhpcyBpdGVtIGR1cmluZyBtZW51IHR5cGVhaGVhZC4gSWYgbm90IHNwZWNpZmllZCxcbiAgICogdGhlIGB0ZXh0Q29udGVudGAgb2YgdGhlIGl0ZW0gd2lsbCBiZSB1c2VkLlxuICAgKi9cbiAgQElucHV0KCdjZGtNZW51aXRlbVR5cGVhaGVhZExhYmVsJykgdHlwZWFoZWFkTGFiZWw6IHN0cmluZyB8IG51bGw7XG5cbiAgLyoqXG4gICAqIElmIHRoaXMgTWVudUl0ZW0gaXMgYSByZWd1bGFyIE1lbnVJdGVtLCBvdXRwdXRzIHdoZW4gaXQgaXMgdHJpZ2dlcmVkIGJ5IGEga2V5Ym9hcmQgb3IgbW91c2VcbiAgICogZXZlbnQuXG4gICAqL1xuICBAT3V0cHV0KCdjZGtNZW51SXRlbVRyaWdnZXJlZCcpIHJlYWRvbmx5IHRyaWdnZXJlZDogRXZlbnRFbWl0dGVyPHZvaWQ+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBtZW51IGl0ZW0gb3BlbnMgYSBtZW51LiAqL1xuICByZWFkb25seSBoYXNNZW51ID0gISF0aGlzLl9tZW51VHJpZ2dlcjtcblxuICAvKipcbiAgICogVGhlIHRhYmluZGV4IGZvciB0aGlzIG1lbnUgaXRlbSBtYW5hZ2VkIGludGVybmFsbHkgYW5kIHVzZWQgZm9yIGltcGxlbWVudGluZyByb3ZpbmcgYVxuICAgKiB0YWIgaW5kZXguXG4gICAqL1xuICBfdGFiaW5kZXg6IDAgfCAtMSA9IC0xO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBpdGVtIHNob3VsZCBjbG9zZSB0aGUgbWVudSBpZiB0cmlnZ2VyZWQgYnkgdGhlIHNwYWNlYmFyLiAqL1xuICBwcm90ZWN0ZWQgY2xvc2VPblNwYWNlYmFyVHJpZ2dlciA9IHRydWU7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIG1lbnUgaXRlbSBpcyBkZXN0cm95ZWQuICovXG4gIHByb3RlY3RlZCByZWFkb25seSBkZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX3NldHVwTW91c2VFbnRlcigpO1xuXG4gICAgaWYgKHRoaXMuX2lzU3RhbmRhbG9uZUl0ZW0oKSkge1xuICAgICAgdGhpcy5fdGFiaW5kZXggPSAwO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLmRlc3Ryb3llZC5jb21wbGV0ZSgpO1xuICB9XG5cbiAgLyoqIFBsYWNlIGZvY3VzIG9uIHRoZSBlbGVtZW50LiAqL1xuICBmb2N1cygpIHtcbiAgICB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuZm9jdXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJZiB0aGUgbWVudSBpdGVtIGlzIG5vdCBkaXNhYmxlZCBhbmQgdGhlIGVsZW1lbnQgZG9lcyBub3QgaGF2ZSBhIG1lbnUgdHJpZ2dlciBhdHRhY2hlZCwgZW1pdFxuICAgKiBvbiB0aGUgY2RrTWVudUl0ZW1UcmlnZ2VyZWQgZW1pdHRlciBhbmQgY2xvc2UgYWxsIG9wZW4gbWVudXMuXG4gICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgdGhlIGNvbmZpZ3VyZSBob3cgdGhlIGl0ZW0gaXMgdHJpZ2dlcmVkXG4gICAqICAgLSBrZWVwT3Blbjogc3BlY2lmaWVzIHRoYXQgdGhlIG1lbnUgc2hvdWxkIGJlIGtlcHQgb3BlbiBhZnRlciB0cmlnZ2VyaW5nIHRoZSBpdGVtLlxuICAgKi9cbiAgdHJpZ2dlcihvcHRpb25zPzoge2tlZXBPcGVuOiBib29sZWFufSkge1xuICAgIGNvbnN0IHtrZWVwT3Blbn0gPSB7Li4ub3B0aW9uc307XG4gICAgaWYgKCF0aGlzLmRpc2FibGVkICYmICF0aGlzLmhhc01lbnUpIHtcbiAgICAgIHRoaXMudHJpZ2dlcmVkLm5leHQoKTtcbiAgICAgIGlmICgha2VlcE9wZW4pIHtcbiAgICAgICAgdGhpcy5fbWVudVN0YWNrLmNsb3NlQWxsKHtmb2N1c1BhcmVudFRyaWdnZXI6IHRydWV9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogUmV0dXJuIHRydWUgaWYgdGhpcyBNZW51SXRlbSBoYXMgYW4gYXR0YWNoZWQgbWVudSBhbmQgaXQgaXMgb3Blbi4gKi9cbiAgaXNNZW51T3BlbigpIHtcbiAgICByZXR1cm4gISF0aGlzLl9tZW51VHJpZ2dlcj8uaXNPcGVuKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcmVmZXJlbmNlIHRvIHRoZSByZW5kZXJlZCBNZW51IGlmIHRoZSBNZW51IGlzIG9wZW4gYW5kIGl0IGlzIHZpc2libGUgaW4gdGhlIERPTS5cbiAgICogQHJldHVybiB0aGUgbWVudSBpZiBpdCBpcyBvcGVuLCBvdGhlcndpc2UgdW5kZWZpbmVkLlxuICAgKi9cbiAgZ2V0TWVudSgpOiBNZW51IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fbWVudVRyaWdnZXI/LmdldE1lbnUoKTtcbiAgfVxuXG4gIC8qKiBHZXQgdGhlIENka01lbnVUcmlnZ2VyIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGVsZW1lbnQuICovXG4gIGdldE1lbnVUcmlnZ2VyKCk6IENka01lbnVUcmlnZ2VyIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX21lbnVUcmlnZ2VyO1xuICB9XG5cbiAgLyoqIEdldCB0aGUgbGFiZWwgZm9yIHRoaXMgZWxlbWVudCB3aGljaCBpcyByZXF1aXJlZCBieSB0aGUgRm9jdXNhYmxlT3B0aW9uIGludGVyZmFjZS4gKi9cbiAgZ2V0TGFiZWwoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy50eXBlYWhlYWRMYWJlbCB8fCB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQudGV4dENvbnRlbnQ/LnRyaW0oKSB8fCAnJztcbiAgfVxuXG4gIC8qKiBSZXNldCB0aGUgdGFiaW5kZXggdG8gLTEuICovXG4gIF9yZXNldFRhYkluZGV4KCkge1xuICAgIGlmICghdGhpcy5faXNTdGFuZGFsb25lSXRlbSgpKSB7XG4gICAgICB0aGlzLl90YWJpbmRleCA9IC0xO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIHRhYiBpbmRleCB0byAwIGlmIG5vdCBkaXNhYmxlZCBhbmQgaXQncyBhIGZvY3VzIGV2ZW50LCBvciBhIG1vdXNlIGVudGVyIGlmIHRoaXMgZWxlbWVudFxuICAgKiBpcyBub3QgaW4gYSBtZW51IGJhci5cbiAgICovXG4gIF9zZXRUYWJJbmRleChldmVudD86IE1vdXNlRXZlbnQpIHtcbiAgICBpZiAodGhpcy5kaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGRvbid0IHNldCB0aGUgdGFiaW5kZXggaWYgdGhlcmUgYXJlIG5vIG9wZW4gc2libGluZyBvciBwYXJlbnQgbWVudXNcbiAgICBpZiAoIWV2ZW50IHx8ICF0aGlzLl9tZW51U3RhY2suaXNFbXB0eSgpKSB7XG4gICAgICB0aGlzLl90YWJpbmRleCA9IDA7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMga2V5Ym9hcmQgZXZlbnRzIGZvciB0aGUgbWVudSBpdGVtLCBzcGVjaWZpY2FsbHkgZWl0aGVyIHRyaWdnZXJpbmcgdGhlIHVzZXIgZGVmaW5lZFxuICAgKiBjYWxsYmFjayBvciBvcGVuaW5nL2Nsb3NpbmcgdGhlIGN1cnJlbnQgbWVudSBiYXNlZCBvbiB3aGV0aGVyIHRoZSBsZWZ0IG9yIHJpZ2h0IGFycm93IGtleSB3YXNcbiAgICogcHJlc3NlZC5cbiAgICogQHBhcmFtIGV2ZW50IHRoZSBrZXlib2FyZCBldmVudCB0byBoYW5kbGVcbiAgICovXG4gIF9vbktleWRvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcbiAgICBzd2l0Y2ggKGV2ZW50LmtleUNvZGUpIHtcbiAgICAgIGNhc2UgU1BBQ0U6XG4gICAgICBjYXNlIEVOVEVSOlxuICAgICAgICBpZiAoIWhhc01vZGlmaWVyS2V5KGV2ZW50KSkge1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdGhpcy50cmlnZ2VyKHtrZWVwT3BlbjogZXZlbnQua2V5Q29kZSA9PT0gU1BBQ0UgJiYgIXRoaXMuY2xvc2VPblNwYWNlYmFyVHJpZ2dlcn0pO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIFJJR0hUX0FSUk9XOlxuICAgICAgICBpZiAoIWhhc01vZGlmaWVyS2V5KGV2ZW50KSkge1xuICAgICAgICAgIGlmICh0aGlzLl9wYXJlbnRNZW51ICYmIHRoaXMuX2lzUGFyZW50VmVydGljYWwoKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2Rpcj8udmFsdWUgIT09ICdydGwnKSB7XG4gICAgICAgICAgICAgIHRoaXMuX2ZvcndhcmRBcnJvd1ByZXNzZWQoZXZlbnQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5fYmFja0Fycm93UHJlc3NlZChldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIExFRlRfQVJST1c6XG4gICAgICAgIGlmICghaGFzTW9kaWZpZXJLZXkoZXZlbnQpKSB7XG4gICAgICAgICAgaWYgKHRoaXMuX3BhcmVudE1lbnUgJiYgdGhpcy5faXNQYXJlbnRWZXJ0aWNhbCgpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fZGlyPy52YWx1ZSAhPT0gJ3J0bCcpIHtcbiAgICAgICAgICAgICAgdGhpcy5fYmFja0Fycm93UHJlc3NlZChldmVudCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aGlzLl9mb3J3YXJkQXJyb3dQcmVzc2VkKGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhpcyBtZW51IGl0ZW0gaXMgc3RhbmRhbG9uZSBvciB3aXRoaW4gYSBtZW51IG9yIG1lbnUgYmFyLiAqL1xuICBwcml2YXRlIF9pc1N0YW5kYWxvbmVJdGVtKCkge1xuICAgIHJldHVybiAhdGhpcy5fcGFyZW50TWVudTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIHRoZSB1c2VyIHByZXNzaW5nIHRoZSBiYWNrIGFycm93IGtleS5cbiAgICogQHBhcmFtIGV2ZW50IFRoZSBrZXlib2FyZCBldmVudC5cbiAgICovXG4gIHByaXZhdGUgX2JhY2tBcnJvd1ByZXNzZWQoZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcbiAgICBjb25zdCBwYXJlbnRNZW51ID0gdGhpcy5fcGFyZW50TWVudSE7XG4gICAgaWYgKHRoaXMuX21lbnVTdGFjay5oYXNJbmxpbmVNZW51KCkgfHwgdGhpcy5fbWVudVN0YWNrLmxlbmd0aCgpID4gMSkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMuX21lbnVTdGFjay5jbG9zZShwYXJlbnRNZW51LCB7XG4gICAgICAgIGZvY3VzTmV4dE9uRW1wdHk6XG4gICAgICAgICAgdGhpcy5fbWVudVN0YWNrLmlubGluZU1lbnVPcmllbnRhdGlvbigpID09PSAnaG9yaXpvbnRhbCdcbiAgICAgICAgICAgID8gRm9jdXNOZXh0LnByZXZpb3VzSXRlbVxuICAgICAgICAgICAgOiBGb2N1c05leHQuY3VycmVudEl0ZW0sXG4gICAgICAgIGZvY3VzUGFyZW50VHJpZ2dlcjogdHJ1ZSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIHRoZSB1c2VyIHByZXNzaW5nIHRoZSBmb3J3YXJkIGFycm93IGtleS5cbiAgICogQHBhcmFtIGV2ZW50IFRoZSBrZXlib2FyZCBldmVudC5cbiAgICovXG4gIHByaXZhdGUgX2ZvcndhcmRBcnJvd1ByZXNzZWQoZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcbiAgICBpZiAoIXRoaXMuaGFzTWVudSAmJiB0aGlzLl9tZW51U3RhY2suaW5saW5lTWVudU9yaWVudGF0aW9uKCkgPT09ICdob3Jpem9udGFsJykge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMuX21lbnVTdGFjay5jbG9zZUFsbCh7XG4gICAgICAgIGZvY3VzTmV4dE9uRW1wdHk6IEZvY3VzTmV4dC5uZXh0SXRlbSxcbiAgICAgICAgZm9jdXNQYXJlbnRUcmlnZ2VyOiB0cnVlLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFN1YnNjcmliZSB0byB0aGUgbW91c2VlbnRlciBldmVudHMgYW5kIGNsb3NlIGFueSBzaWJsaW5nIG1lbnUgaXRlbXMgaWYgdGhpcyBlbGVtZW50IGlzIG1vdXNlZFxuICAgKiBpbnRvLlxuICAgKi9cbiAgcHJpdmF0ZSBfc2V0dXBNb3VzZUVudGVyKCkge1xuICAgIGlmICghdGhpcy5faXNTdGFuZGFsb25lSXRlbSgpKSB7XG4gICAgICBjb25zdCBjbG9zZU9wZW5TaWJsaW5ncyA9ICgpID0+XG4gICAgICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4gdGhpcy5fbWVudVN0YWNrLmNsb3NlU3ViTWVudU9mKHRoaXMuX3BhcmVudE1lbnUhKSk7XG5cbiAgICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PlxuICAgICAgICBmcm9tRXZlbnQodGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LCAnbW91c2VlbnRlcicpXG4gICAgICAgICAgLnBpcGUoXG4gICAgICAgICAgICBmaWx0ZXIoKCkgPT4gIXRoaXMuX21lbnVTdGFjay5pc0VtcHR5KCkgJiYgIXRoaXMuaGFzTWVudSksXG4gICAgICAgICAgICB0YWtlVW50aWwodGhpcy5kZXN0cm95ZWQpLFxuICAgICAgICAgIClcbiAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9tZW51QWltKSB7XG4gICAgICAgICAgICAgIHRoaXMuX21lbnVBaW0udG9nZ2xlKGNsb3NlT3BlblNpYmxpbmdzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNsb3NlT3BlblNpYmxpbmdzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSksXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgZW5jbG9zaW5nIHBhcmVudCBtZW51IGlzIGNvbmZpZ3VyZWQgaW4gYSBob3Jpem9udGFsIG9yaWVudGF0aW9uLCBmYWxzZVxuICAgKiBvdGhlcndpc2Ugb3IgaWYgbm8gcGFyZW50LlxuICAgKi9cbiAgcHJpdmF0ZSBfaXNQYXJlbnRWZXJ0aWNhbCgpIHtcbiAgICByZXR1cm4gdGhpcy5fcGFyZW50TWVudT8ub3JpZW50YXRpb24gPT09ICd2ZXJ0aWNhbCc7XG4gIH1cbn1cbiJdfQ==