/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, ElementRef, Inject, NgZone, Optional, Self, } from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { DOWN_ARROW, ESCAPE, hasModifierKey, LEFT_ARROW, RIGHT_ARROW, TAB, UP_ARROW, } from '@angular/cdk/keycodes';
import { takeUntil } from 'rxjs/operators';
import { CdkMenuGroup } from './menu-group';
import { CDK_MENU } from './menu-interface';
import { MENU_STACK, MenuStack } from './menu-stack';
import { MENU_AIM } from './menu-aim';
import { CdkMenuBase } from './menu-base';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/bidi";
import * as i2 from "./menu-stack";
/**
 * Directive applied to an element which configures it as a MenuBar by setting the appropriate
 * role, aria attributes, and accessible keyboard and mouse handling logic. The component that
 * this directive is applied to should contain components marked with CdkMenuItem.
 *
 */
export class CdkMenuBar extends CdkMenuBase {
    constructor(
    /** The host element. */
    elementRef, 
    /** The Angular zone. */
    ngZone, 
    /** The menu stack this menu is part of. */
    menuStack, 
    /** The menu aim service used by this menu. */
    menuAim, 
    /** The directionality of the page. */
    dir) {
        super(elementRef, ngZone, menuStack, menuAim, dir);
        /** The direction items in the menu flow. */
        this.orientation = 'horizontal';
        /** Whether the menu is displayed inline (i.e. always present vs a conditional popup that the user triggers with a trigger element). */
        this.isInline = true;
    }
    ngAfterContentInit() {
        super.ngAfterContentInit();
        this._subscribeToMenuStackEmptied();
    }
    /**
     * Handle keyboard events for the Menu.
     * @param event The keyboard event to be handled.
     */
    _handleKeyEvent(event) {
        const keyManager = this.keyManager;
        switch (event.keyCode) {
            case UP_ARROW:
            case DOWN_ARROW:
            case LEFT_ARROW:
            case RIGHT_ARROW:
                if (!hasModifierKey(event)) {
                    const horizontalArrows = event.keyCode === LEFT_ARROW || event.keyCode === RIGHT_ARROW;
                    // For a horizontal menu if the left/right keys were clicked, or a vertical menu if the
                    // up/down keys were clicked: if the current menu is open, close it then focus and open the
                    // next  menu.
                    if (horizontalArrows) {
                        event.preventDefault();
                        const prevIsOpen = keyManager.activeItem?.isMenuOpen();
                        keyManager.activeItem?.getMenuTrigger()?.close();
                        keyManager.setFocusOrigin('keyboard');
                        keyManager.onKeydown(event);
                        if (prevIsOpen) {
                            keyManager.activeItem?.getMenuTrigger()?.open();
                        }
                    }
                }
                break;
            case ESCAPE:
                if (!hasModifierKey(event)) {
                    event.preventDefault();
                    keyManager.activeItem?.getMenuTrigger()?.close();
                }
                break;
            case TAB:
                if (!hasModifierKey(event, 'altKey', 'metaKey', 'ctrlKey')) {
                    keyManager.activeItem?.getMenuTrigger()?.close();
                }
                break;
            default:
                keyManager.onKeydown(event);
        }
    }
    /**
     * Set focus to either the current, previous or next item based on the FocusNext event, then
     * open the previous or next item.
     * @param focusNext The element to focus.
     */
    _toggleOpenMenu(focusNext) {
        const keyManager = this.keyManager;
        switch (focusNext) {
            case 0 /* FocusNext.nextItem */:
                keyManager.setFocusOrigin('keyboard');
                keyManager.setNextItemActive();
                keyManager.activeItem?.getMenuTrigger()?.open();
                break;
            case 1 /* FocusNext.previousItem */:
                keyManager.setFocusOrigin('keyboard');
                keyManager.setPreviousItemActive();
                keyManager.activeItem?.getMenuTrigger()?.open();
                break;
            case 2 /* FocusNext.currentItem */:
                if (keyManager.activeItem) {
                    keyManager.setFocusOrigin('keyboard');
                    keyManager.setActiveItem(keyManager.activeItem);
                }
                break;
        }
    }
    /** Subscribe to the MenuStack emptied events. */
    _subscribeToMenuStackEmptied() {
        this.menuStack?.emptied
            .pipe(takeUntil(this.destroyed))
            .subscribe(event => this._toggleOpenMenu(event));
    }
}
CdkMenuBar.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.0.0-next.16", ngImport: i0, type: CdkMenuBar, deps: [{ token: i0.ElementRef }, { token: i0.NgZone }, { token: MENU_STACK }, { token: MENU_AIM, optional: true, self: true }, { token: i1.Directionality, optional: true }], target: i0.ɵɵFactoryTarget.Directive });
CdkMenuBar.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "14.0.0-next.16", type: CdkMenuBar, selector: "[cdkMenuBar]", host: { attributes: { "role": "menubar" }, listeners: { "keydown": "_handleKeyEvent($event)" }, classAttribute: "cdk-menu-bar" }, providers: [
        { provide: CdkMenuGroup, useExisting: CdkMenuBar },
        { provide: CDK_MENU, useExisting: CdkMenuBar },
        { provide: MENU_STACK, useFactory: () => MenuStack.inline('horizontal') },
    ], exportAs: ["cdkMenuBar"], usesInheritance: true, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.0.0-next.16", ngImport: i0, type: CdkMenuBar, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkMenuBar]',
                    exportAs: 'cdkMenuBar',
                    host: {
                        'role': 'menubar',
                        'class': 'cdk-menu-bar',
                        '(keydown)': '_handleKeyEvent($event)',
                    },
                    providers: [
                        { provide: CdkMenuGroup, useExisting: CdkMenuBar },
                        { provide: CDK_MENU, useExisting: CdkMenuBar },
                        { provide: MENU_STACK, useFactory: () => MenuStack.inline('horizontal') },
                    ],
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i0.NgZone }, { type: i2.MenuStack, decorators: [{
                    type: Inject,
                    args: [MENU_STACK]
                }] }, { type: undefined, decorators: [{
                    type: Self
                }, {
                    type: Optional
                }, {
                    type: Inject,
                    args: [MENU_AIM]
                }] }, { type: i1.Directionality, decorators: [{
                    type: Optional
                }] }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS1iYXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL21lbnUvbWVudS1iYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUVMLFNBQVMsRUFDVCxVQUFVLEVBQ1YsTUFBTSxFQUNOLE1BQU0sRUFDTixRQUFRLEVBQ1IsSUFBSSxHQUNMLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQ0wsVUFBVSxFQUNWLE1BQU0sRUFDTixjQUFjLEVBQ2QsVUFBVSxFQUNWLFdBQVcsRUFDWCxHQUFHLEVBQ0gsUUFBUSxHQUNULE1BQU0sdUJBQXVCLENBQUM7QUFDL0IsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDMUMsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQzFDLE9BQU8sRUFBWSxVQUFVLEVBQUUsU0FBUyxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQzlELE9BQU8sRUFBQyxRQUFRLEVBQVUsTUFBTSxZQUFZLENBQUM7QUFDN0MsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLGFBQWEsQ0FBQzs7OztBQUV4Qzs7Ozs7R0FLRztBQWVILE1BQU0sT0FBTyxVQUFXLFNBQVEsV0FBVztJQU96QztJQUNFLHdCQUF3QjtJQUN4QixVQUFtQztJQUNuQyx3QkFBd0I7SUFDeEIsTUFBYztJQUNkLDJDQUEyQztJQUN2QixTQUFvQjtJQUN4Qyw4Q0FBOEM7SUFDUixPQUFpQjtJQUN2RCxzQ0FBc0M7SUFDMUIsR0FBb0I7UUFFaEMsS0FBSyxDQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztRQWxCckQsNENBQTRD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OzJCQUFDLFFBQVE7OzBCQUVuQyxRQUFRIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIEFmdGVyQ29udGVudEluaXQsXG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgSW5qZWN0LFxuICBOZ1pvbmUsXG4gIE9wdGlvbmFsLFxuICBTZWxmLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7XG4gIERPV05fQVJST1csXG4gIEVTQ0FQRSxcbiAgaGFzTW9kaWZpZXJLZXksXG4gIExFRlRfQVJST1csXG4gIFJJR0hUX0FSUk9XLFxuICBUQUIsXG4gIFVQX0FSUk9XLFxufSBmcm9tICdAYW5ndWxhci9jZGsva2V5Y29kZXMnO1xuaW1wb3J0IHt0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7Q2RrTWVudUdyb3VwfSBmcm9tICcuL21lbnUtZ3JvdXAnO1xuaW1wb3J0IHtDREtfTUVOVX0gZnJvbSAnLi9tZW51LWludGVyZmFjZSc7XG5pbXBvcnQge0ZvY3VzTmV4dCwgTUVOVV9TVEFDSywgTWVudVN0YWNrfSBmcm9tICcuL21lbnUtc3RhY2snO1xuaW1wb3J0IHtNRU5VX0FJTSwgTWVudUFpbX0gZnJvbSAnLi9tZW51LWFpbSc7XG5pbXBvcnQge0Nka01lbnVCYXNlfSBmcm9tICcuL21lbnUtYmFzZSc7XG5cbi8qKlxuICogRGlyZWN0aXZlIGFwcGxpZWQgdG8gYW4gZWxlbWVudCB3aGljaCBjb25maWd1cmVzIGl0IGFzIGEgTWVudUJhciBieSBzZXR0aW5nIHRoZSBhcHByb3ByaWF0ZVxuICogcm9sZSwgYXJpYSBhdHRyaWJ1dGVzLCBhbmQgYWNjZXNzaWJsZSBrZXlib2FyZCBhbmQgbW91c2UgaGFuZGxpbmcgbG9naWMuIFRoZSBjb21wb25lbnQgdGhhdFxuICogdGhpcyBkaXJlY3RpdmUgaXMgYXBwbGllZCB0byBzaG91bGQgY29udGFpbiBjb21wb25lbnRzIG1hcmtlZCB3aXRoIENka01lbnVJdGVtLlxuICpcbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka01lbnVCYXJdJyxcbiAgZXhwb3J0QXM6ICdjZGtNZW51QmFyJyxcbiAgaG9zdDoge1xuICAgICdyb2xlJzogJ21lbnViYXInLFxuICAgICdjbGFzcyc6ICdjZGstbWVudS1iYXInLFxuICAgICcoa2V5ZG93biknOiAnX2hhbmRsZUtleUV2ZW50KCRldmVudCknLFxuICB9LFxuICBwcm92aWRlcnM6IFtcbiAgICB7cHJvdmlkZTogQ2RrTWVudUdyb3VwLCB1c2VFeGlzdGluZzogQ2RrTWVudUJhcn0sXG4gICAge3Byb3ZpZGU6IENES19NRU5VLCB1c2VFeGlzdGluZzogQ2RrTWVudUJhcn0sXG4gICAge3Byb3ZpZGU6IE1FTlVfU1RBQ0ssIHVzZUZhY3Rvcnk6ICgpID0+IE1lbnVTdGFjay5pbmxpbmUoJ2hvcml6b250YWwnKX0sXG4gIF0sXG59KVxuZXhwb3J0IGNsYXNzIENka01lbnVCYXIgZXh0ZW5kcyBDZGtNZW51QmFzZSBpbXBsZW1lbnRzIEFmdGVyQ29udGVudEluaXQge1xuICAvKiogVGhlIGRpcmVjdGlvbiBpdGVtcyBpbiB0aGUgbWVudSBmbG93LiAqL1xuICBvdmVycmlkZSByZWFkb25seSBvcmllbnRhdGlvbiA9ICdob3Jpem9udGFsJztcblxuICAvKiogV2hldGhlciB0aGUgbWVudSBpcyBkaXNwbGF5ZWQgaW5saW5lIChpLmUuIGFsd2F5cyBwcmVzZW50IHZzIGEgY29uZGl0aW9uYWwgcG9wdXAgdGhhdCB0aGUgdXNlciB0cmlnZ2VycyB3aXRoIGEgdHJpZ2dlciBlbGVtZW50KS4gKi9cbiAgb3ZlcnJpZGUgcmVhZG9ubHkgaXNJbmxpbmUgPSB0cnVlO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIC8qKiBUaGUgaG9zdCBlbGVtZW50LiAqL1xuICAgIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgIC8qKiBUaGUgQW5ndWxhciB6b25lLiAqL1xuICAgIG5nWm9uZTogTmdab25lLFxuICAgIC8qKiBUaGUgbWVudSBzdGFjayB0aGlzIG1lbnUgaXMgcGFydCBvZi4gKi9cbiAgICBASW5qZWN0KE1FTlVfU1RBQ0spIG1lbnVTdGFjazogTWVudVN0YWNrLFxuICAgIC8qKiBUaGUgbWVudSBhaW0gc2VydmljZSB1c2VkIGJ5IHRoaXMgbWVudS4gKi9cbiAgICBAU2VsZigpIEBPcHRpb25hbCgpIEBJbmplY3QoTUVOVV9BSU0pIG1lbnVBaW0/OiBNZW51QWltLFxuICAgIC8qKiBUaGUgZGlyZWN0aW9uYWxpdHkgb2YgdGhlIHBhZ2UuICovXG4gICAgQE9wdGlvbmFsKCkgZGlyPzogRGlyZWN0aW9uYWxpdHksXG4gICkge1xuICAgIHN1cGVyKGVsZW1lbnRSZWYsIG5nWm9uZSwgbWVudVN0YWNrLCBtZW51QWltLCBkaXIpO1xuICB9XG5cbiAgb3ZlcnJpZGUgbmdBZnRlckNvbnRlbnRJbml0KCkge1xuICAgIHN1cGVyLm5nQWZ0ZXJDb250ZW50SW5pdCgpO1xuICAgIHRoaXMuX3N1YnNjcmliZVRvTWVudVN0YWNrRW1wdGllZCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZSBrZXlib2FyZCBldmVudHMgZm9yIHRoZSBNZW51LlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIGtleWJvYXJkIGV2ZW50IHRvIGJlIGhhbmRsZWQuXG4gICAqL1xuICBfaGFuZGxlS2V5RXZlbnQoZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcbiAgICBjb25zdCBrZXlNYW5hZ2VyID0gdGhpcy5rZXlNYW5hZ2VyO1xuICAgIHN3aXRjaCAoZXZlbnQua2V5Q29kZSkge1xuICAgICAgY2FzZSBVUF9BUlJPVzpcbiAgICAgIGNhc2UgRE9XTl9BUlJPVzpcbiAgICAgIGNhc2UgTEVGVF9BUlJPVzpcbiAgICAgIGNhc2UgUklHSFRfQVJST1c6XG4gICAgICAgIGlmICghaGFzTW9kaWZpZXJLZXkoZXZlbnQpKSB7XG4gICAgICAgICAgY29uc3QgaG9yaXpvbnRhbEFycm93cyA9IGV2ZW50LmtleUNvZGUgPT09IExFRlRfQVJST1cgfHwgZXZlbnQua2V5Q29kZSA9PT0gUklHSFRfQVJST1c7XG4gICAgICAgICAgLy8gRm9yIGEgaG9yaXpvbnRhbCBtZW51IGlmIHRoZSBsZWZ0L3JpZ2h0IGtleXMgd2VyZSBjbGlja2VkLCBvciBhIHZlcnRpY2FsIG1lbnUgaWYgdGhlXG4gICAgICAgICAgLy8gdXAvZG93biBrZXlzIHdlcmUgY2xpY2tlZDogaWYgdGhlIGN1cnJlbnQgbWVudSBpcyBvcGVuLCBjbG9zZSBpdCB0aGVuIGZvY3VzIGFuZCBvcGVuIHRoZVxuICAgICAgICAgIC8vIG5leHQgIG1lbnUuXG4gICAgICAgICAgaWYgKGhvcml6b250YWxBcnJvd3MpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIGNvbnN0IHByZXZJc09wZW4gPSBrZXlNYW5hZ2VyLmFjdGl2ZUl0ZW0/LmlzTWVudU9wZW4oKTtcbiAgICAgICAgICAgIGtleU1hbmFnZXIuYWN0aXZlSXRlbT8uZ2V0TWVudVRyaWdnZXIoKT8uY2xvc2UoKTtcblxuICAgICAgICAgICAga2V5TWFuYWdlci5zZXRGb2N1c09yaWdpbigna2V5Ym9hcmQnKTtcbiAgICAgICAgICAgIGtleU1hbmFnZXIub25LZXlkb3duKGV2ZW50KTtcbiAgICAgICAgICAgIGlmIChwcmV2SXNPcGVuKSB7XG4gICAgICAgICAgICAgIGtleU1hbmFnZXIuYWN0aXZlSXRlbT8uZ2V0TWVudVRyaWdnZXIoKT8ub3BlbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBFU0NBUEU6XG4gICAgICAgIGlmICghaGFzTW9kaWZpZXJLZXkoZXZlbnQpKSB7XG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBrZXlNYW5hZ2VyLmFjdGl2ZUl0ZW0/LmdldE1lbnVUcmlnZ2VyKCk/LmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgVEFCOlxuICAgICAgICBpZiAoIWhhc01vZGlmaWVyS2V5KGV2ZW50LCAnYWx0S2V5JywgJ21ldGFLZXknLCAnY3RybEtleScpKSB7XG4gICAgICAgICAga2V5TWFuYWdlci5hY3RpdmVJdGVtPy5nZXRNZW51VHJpZ2dlcigpPy5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBrZXlNYW5hZ2VyLm9uS2V5ZG93bihldmVudCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldCBmb2N1cyB0byBlaXRoZXIgdGhlIGN1cnJlbnQsIHByZXZpb3VzIG9yIG5leHQgaXRlbSBiYXNlZCBvbiB0aGUgRm9jdXNOZXh0IGV2ZW50LCB0aGVuXG4gICAqIG9wZW4gdGhlIHByZXZpb3VzIG9yIG5leHQgaXRlbS5cbiAgICogQHBhcmFtIGZvY3VzTmV4dCBUaGUgZWxlbWVudCB0byBmb2N1cy5cbiAgICovXG4gIHByaXZhdGUgX3RvZ2dsZU9wZW5NZW51KGZvY3VzTmV4dDogRm9jdXNOZXh0IHwgdW5kZWZpbmVkKSB7XG4gICAgY29uc3Qga2V5TWFuYWdlciA9IHRoaXMua2V5TWFuYWdlcjtcbiAgICBzd2l0Y2ggKGZvY3VzTmV4dCkge1xuICAgICAgY2FzZSBGb2N1c05leHQubmV4dEl0ZW06XG4gICAgICAgIGtleU1hbmFnZXIuc2V0Rm9jdXNPcmlnaW4oJ2tleWJvYXJkJyk7XG4gICAgICAgIGtleU1hbmFnZXIuc2V0TmV4dEl0ZW1BY3RpdmUoKTtcbiAgICAgICAga2V5TWFuYWdlci5hY3RpdmVJdGVtPy5nZXRNZW51VHJpZ2dlcigpPy5vcGVuKCk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIEZvY3VzTmV4dC5wcmV2aW91c0l0ZW06XG4gICAgICAgIGtleU1hbmFnZXIuc2V0Rm9jdXNPcmlnaW4oJ2tleWJvYXJkJyk7XG4gICAgICAgIGtleU1hbmFnZXIuc2V0UHJldmlvdXNJdGVtQWN0aXZlKCk7XG4gICAgICAgIGtleU1hbmFnZXIuYWN0aXZlSXRlbT8uZ2V0TWVudVRyaWdnZXIoKT8ub3BlbigpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBGb2N1c05leHQuY3VycmVudEl0ZW06XG4gICAgICAgIGlmIChrZXlNYW5hZ2VyLmFjdGl2ZUl0ZW0pIHtcbiAgICAgICAgICBrZXlNYW5hZ2VyLnNldEZvY3VzT3JpZ2luKCdrZXlib2FyZCcpO1xuICAgICAgICAgIGtleU1hbmFnZXIuc2V0QWN0aXZlSXRlbShrZXlNYW5hZ2VyLmFjdGl2ZUl0ZW0pO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTdWJzY3JpYmUgdG8gdGhlIE1lbnVTdGFjayBlbXB0aWVkIGV2ZW50cy4gKi9cbiAgcHJpdmF0ZSBfc3Vic2NyaWJlVG9NZW51U3RhY2tFbXB0aWVkKCkge1xuICAgIHRoaXMubWVudVN0YWNrPy5lbXB0aWVkXG4gICAgICAucGlwZSh0YWtlVW50aWwodGhpcy5kZXN0cm95ZWQpKVxuICAgICAgLnN1YnNjcmliZShldmVudCA9PiB0aGlzLl90b2dnbGVPcGVuTWVudShldmVudCkpO1xuICB9XG59XG4iXX0=