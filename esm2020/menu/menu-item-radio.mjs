/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { UniqueSelectionDispatcher } from '@angular/cdk/collections';
import { Directive, ElementRef, Inject, NgZone, Optional, Self } from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { CdkMenuItemSelectable } from './menu-item-selectable';
import { CdkMenuItem } from './menu-item';
import { CdkMenuTrigger } from './menu-trigger';
import { CDK_MENU } from './menu-interface';
import { MENU_AIM } from './menu-aim';
import { MENU_STACK, MenuStack } from './menu-stack';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/collections";
import * as i2 from "@angular/cdk/bidi";
import * as i3 from "./menu-trigger";
import * as i4 from "./menu-stack";
/** Counter used to set a unique id and name for a selectable item */
let nextId = 0;
/**
 * A directive providing behavior for the "menuitemradio" ARIA role, which behaves similarly to
 * a conventional radio-button. Any sibling `CdkMenuItemRadio` instances within the same `CdkMenu`
 * or `CdkMenuGroup` comprise a radio group with unique selection enforced.
 */
export class CdkMenuItemRadio extends CdkMenuItemSelectable {
    constructor(
    /** The host element for this radio item. */
    element, 
    /** The Angular zone. */
    ngZone, 
    /** The unique selection dispatcher for this radio's `CdkMenuGroup`. */
    _selectionDispatcher, 
    /** The menu stack this item belongs to. */
    menuStack, 
    /** The parent menu for this item. */
    parentMenu, 
    /** The menu aim used for this item. */
    menuAim, 
    /** The directionality of the page. */
    dir, 
    /** Reference to the CdkMenuItemTrigger directive if one is added to the same element */
    // tslint:disable-next-line: lightweight-tokens
    menuTrigger) {
        super(element, ngZone, menuStack, parentMenu, menuAim, dir, menuTrigger);
        this._selectionDispatcher = _selectionDispatcher;
        /** An ID to identify this radio item to the `UniqueSelectionDisptcher`. */
        this._id = `${nextId++}`;
        this._registerDispatcherListener();
    }
    ngOnDestroy() {
        super.ngOnDestroy();
        this._removeDispatcherListener();
    }
    /**
     * Toggles the checked state of the radio-button.
     * @param options Options the configure how the item is triggered
     *   - keepOpen: specifies that the menu should be kept open after triggering the item.
     */
    trigger(options) {
        super.trigger(options);
        if (!this.disabled) {
            this._selectionDispatcher.notify(this._id, '');
        }
    }
    /** Configure the unique selection dispatcher listener in order to toggle the checked state  */
    _registerDispatcherListener() {
        this._removeDispatcherListener = this._selectionDispatcher.listen((id) => {
            this.checked = this._id === id;
        });
    }
}
CdkMenuItemRadio.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.0.0-rc.0", ngImport: i0, type: CdkMenuItemRadio, deps: [{ token: i0.ElementRef }, { token: i0.NgZone }, { token: i1.UniqueSelectionDispatcher }, { token: MENU_STACK }, { token: CDK_MENU, optional: true }, { token: MENU_AIM, optional: true }, { token: i2.Directionality, optional: true }, { token: i3.CdkMenuTrigger, optional: true, self: true }], target: i0.ɵɵFactoryTarget.Directive });
CdkMenuItemRadio.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "14.0.0-rc.0", type: CdkMenuItemRadio, selector: "[cdkMenuItemRadio]", host: { attributes: { "role": "menuitemradio" }, properties: { "class.cdk-menu-item-radio": "true" } }, providers: [
        { provide: CdkMenuItemSelectable, useExisting: CdkMenuItemRadio },
        { provide: CdkMenuItem, useExisting: CdkMenuItemSelectable },
    ], exportAs: ["cdkMenuItemRadio"], usesInheritance: true, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.0.0-rc.0", ngImport: i0, type: CdkMenuItemRadio, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkMenuItemRadio]',
                    exportAs: 'cdkMenuItemRadio',
                    host: {
                        'role': 'menuitemradio',
                        '[class.cdk-menu-item-radio]': 'true',
                    },
                    providers: [
                        { provide: CdkMenuItemSelectable, useExisting: CdkMenuItemRadio },
                        { provide: CdkMenuItem, useExisting: CdkMenuItemSelectable },
                    ],
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i0.NgZone }, { type: i1.UniqueSelectionDispatcher }, { type: i4.MenuStack, decorators: [{
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
                }] }, { type: i2.Directionality, decorators: [{
                    type: Optional
                }] }, { type: i3.CdkMenuTrigger, decorators: [{
                    type: Self
                }, {
                    type: Optional
                }] }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS1pdGVtLXJhZGlvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9tZW51L21lbnUtaXRlbS1yYWRpby50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUNuRSxPQUFPLEVBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFhLFFBQVEsRUFBRSxJQUFJLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDL0YsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzdELE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDeEMsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxRQUFRLEVBQU8sTUFBTSxrQkFBa0IsQ0FBQztBQUNoRCxPQUFPLEVBQUMsUUFBUSxFQUFVLE1BQU0sWUFBWSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFDLE1BQU0sY0FBYyxDQUFDOzs7Ozs7QUFFbkQscUVBQXFFO0FBQ3JFLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztBQUVmOzs7O0dBSUc7QUFhSCxNQUFNLE9BQU8sZ0JBQWlCLFNBQVEscUJBQXFCO0lBT3pEO0lBQ0UsNENBQTRDO0lBQzVDLE9BQWdDO0lBQ2hDLHdCQUF3QjtJQUN4QixNQUFjO0lBQ2QsdUVBQXVFO0lBQ3RELG9CQUErQztJQUNoRSwyQ0FBMkM7SUFDdkIsU0FBb0I7SUFDeEMscUNBQXFDO0lBQ1AsVUFBaUI7SUFDL0MsdUNBQXVDO0lBQ1QsT0FBaUI7SUFDL0Msc0NBQXNDO0lBQzFCLEdBQW9CO0lBQ2hDLHdGQUF3RjtJQUN4RiwrQ0FBK0M7SUFDM0IsV0FBNEI7UUFFaEQsS0FBSyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBYnhELHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBMkI7UUFabEUsMkVBQTJFO1FBQ25FLFFBQUcsR0FBRyxHQUFHLE1BQU0sRUFBRSxFQUFFLENBQUM7UUEwQjFCLElBQUksQ0FBQywyQkFBMkIsRUFBRSxDQUFDO0lBQ3JDLENBQUM7SUFFUSxXQUFXO1FBQ2xCLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUVwQixJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztJQUNuQyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNNLE9BQU8sQ0FBQyxPQUE2QjtRQUM1QyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRXZCLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2xCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztTQUNoRDtJQUNILENBQUM7SUFFRCwrRkFBK0Y7SUFDdkYsMkJBQTJCO1FBQ2pDLElBQUksQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBVSxFQUFFLEVBQUU7WUFDL0UsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQztRQUNqQyxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7O2tIQXZEVSxnQkFBZ0IsMkdBZWpCLFVBQVUsYUFFRSxRQUFRLDZCQUVSLFFBQVE7c0dBbkJuQixnQkFBZ0IscUpBTGhCO1FBQ1QsRUFBQyxPQUFPLEVBQUUscUJBQXFCLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixFQUFDO1FBQy9ELEVBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUscUJBQXFCLEVBQUM7S0FDM0Q7Z0dBRVUsZ0JBQWdCO2tCQVo1QixTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSxvQkFBb0I7b0JBQzlCLFFBQVEsRUFBRSxrQkFBa0I7b0JBQzVCLElBQUksRUFBRTt3QkFDSixNQUFNLEVBQUUsZUFBZTt3QkFDdkIsNkJBQTZCLEVBQUUsTUFBTTtxQkFDdEM7b0JBQ0QsU0FBUyxFQUFFO3dCQUNULEVBQUMsT0FBTyxFQUFFLHFCQUFxQixFQUFFLFdBQVcsa0JBQWtCLEVBQUM7d0JBQy9ELEVBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUscUJBQXFCLEVBQUM7cUJBQzNEO2lCQUNGOzswQkFnQkksTUFBTTsyQkFBQyxVQUFVOzswQkFFakIsUUFBUTs7MEJBQUksTUFBTTsyQkFBQyxRQUFROzswQkFFM0IsUUFBUTs7MEJBQUksTUFBTTsyQkFBQyxRQUFROzswQkFFM0IsUUFBUTs7MEJBR1IsSUFBSTs7MEJBQUksUUFBUSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1VuaXF1ZVNlbGVjdGlvbkRpc3BhdGNoZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2xsZWN0aW9ucyc7XG5pbXBvcnQge0RpcmVjdGl2ZSwgRWxlbWVudFJlZiwgSW5qZWN0LCBOZ1pvbmUsIE9uRGVzdHJveSwgT3B0aW9uYWwsIFNlbGZ9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtDZGtNZW51SXRlbVNlbGVjdGFibGV9IGZyb20gJy4vbWVudS1pdGVtLXNlbGVjdGFibGUnO1xuaW1wb3J0IHtDZGtNZW51SXRlbX0gZnJvbSAnLi9tZW51LWl0ZW0nO1xuaW1wb3J0IHtDZGtNZW51VHJpZ2dlcn0gZnJvbSAnLi9tZW51LXRyaWdnZXInO1xuaW1wb3J0IHtDREtfTUVOVSwgTWVudX0gZnJvbSAnLi9tZW51LWludGVyZmFjZSc7XG5pbXBvcnQge01FTlVfQUlNLCBNZW51QWltfSBmcm9tICcuL21lbnUtYWltJztcbmltcG9ydCB7TUVOVV9TVEFDSywgTWVudVN0YWNrfSBmcm9tICcuL21lbnUtc3RhY2snO1xuXG4vKiogQ291bnRlciB1c2VkIHRvIHNldCBhIHVuaXF1ZSBpZCBhbmQgbmFtZSBmb3IgYSBzZWxlY3RhYmxlIGl0ZW0gKi9cbmxldCBuZXh0SWQgPSAwO1xuXG4vKipcbiAqIEEgZGlyZWN0aXZlIHByb3ZpZGluZyBiZWhhdmlvciBmb3IgdGhlIFwibWVudWl0ZW1yYWRpb1wiIEFSSUEgcm9sZSwgd2hpY2ggYmVoYXZlcyBzaW1pbGFybHkgdG9cbiAqIGEgY29udmVudGlvbmFsIHJhZGlvLWJ1dHRvbi4gQW55IHNpYmxpbmcgYENka01lbnVJdGVtUmFkaW9gIGluc3RhbmNlcyB3aXRoaW4gdGhlIHNhbWUgYENka01lbnVgXG4gKiBvciBgQ2RrTWVudUdyb3VwYCBjb21wcmlzZSBhIHJhZGlvIGdyb3VwIHdpdGggdW5pcXVlIHNlbGVjdGlvbiBlbmZvcmNlZC5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka01lbnVJdGVtUmFkaW9dJyxcbiAgZXhwb3J0QXM6ICdjZGtNZW51SXRlbVJhZGlvJyxcbiAgaG9zdDoge1xuICAgICdyb2xlJzogJ21lbnVpdGVtcmFkaW8nLFxuICAgICdbY2xhc3MuY2RrLW1lbnUtaXRlbS1yYWRpb10nOiAndHJ1ZScsXG4gIH0sXG4gIHByb3ZpZGVyczogW1xuICAgIHtwcm92aWRlOiBDZGtNZW51SXRlbVNlbGVjdGFibGUsIHVzZUV4aXN0aW5nOiBDZGtNZW51SXRlbVJhZGlvfSxcbiAgICB7cHJvdmlkZTogQ2RrTWVudUl0ZW0sIHVzZUV4aXN0aW5nOiBDZGtNZW51SXRlbVNlbGVjdGFibGV9LFxuICBdLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtNZW51SXRlbVJhZGlvIGV4dGVuZHMgQ2RrTWVudUl0ZW1TZWxlY3RhYmxlIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIEFuIElEIHRvIGlkZW50aWZ5IHRoaXMgcmFkaW8gaXRlbSB0byB0aGUgYFVuaXF1ZVNlbGVjdGlvbkRpc3B0Y2hlcmAuICovXG4gIHByaXZhdGUgX2lkID0gYCR7bmV4dElkKyt9YDtcblxuICAvKiogRnVuY3Rpb24gdG8gdW5yZWdpc3RlciB0aGUgc2VsZWN0aW9uIGRpc3BhdGNoZXIgKi9cbiAgcHJpdmF0ZSBfcmVtb3ZlRGlzcGF0Y2hlckxpc3RlbmVyOiAoKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIC8qKiBUaGUgaG9zdCBlbGVtZW50IGZvciB0aGlzIHJhZGlvIGl0ZW0uICovXG4gICAgZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgLyoqIFRoZSBBbmd1bGFyIHpvbmUuICovXG4gICAgbmdab25lOiBOZ1pvbmUsXG4gICAgLyoqIFRoZSB1bmlxdWUgc2VsZWN0aW9uIGRpc3BhdGNoZXIgZm9yIHRoaXMgcmFkaW8ncyBgQ2RrTWVudUdyb3VwYC4gKi9cbiAgICBwcml2YXRlIHJlYWRvbmx5IF9zZWxlY3Rpb25EaXNwYXRjaGVyOiBVbmlxdWVTZWxlY3Rpb25EaXNwYXRjaGVyLFxuICAgIC8qKiBUaGUgbWVudSBzdGFjayB0aGlzIGl0ZW0gYmVsb25ncyB0by4gKi9cbiAgICBASW5qZWN0KE1FTlVfU1RBQ0spIG1lbnVTdGFjazogTWVudVN0YWNrLFxuICAgIC8qKiBUaGUgcGFyZW50IG1lbnUgZm9yIHRoaXMgaXRlbS4gKi9cbiAgICBAT3B0aW9uYWwoKSBASW5qZWN0KENES19NRU5VKSBwYXJlbnRNZW51PzogTWVudSxcbiAgICAvKiogVGhlIG1lbnUgYWltIHVzZWQgZm9yIHRoaXMgaXRlbS4gKi9cbiAgICBAT3B0aW9uYWwoKSBASW5qZWN0KE1FTlVfQUlNKSBtZW51QWltPzogTWVudUFpbSxcbiAgICAvKiogVGhlIGRpcmVjdGlvbmFsaXR5IG9mIHRoZSBwYWdlLiAqL1xuICAgIEBPcHRpb25hbCgpIGRpcj86IERpcmVjdGlvbmFsaXR5LFxuICAgIC8qKiBSZWZlcmVuY2UgdG8gdGhlIENka01lbnVJdGVtVHJpZ2dlciBkaXJlY3RpdmUgaWYgb25lIGlzIGFkZGVkIHRvIHRoZSBzYW1lIGVsZW1lbnQgKi9cbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IGxpZ2h0d2VpZ2h0LXRva2Vuc1xuICAgIEBTZWxmKCkgQE9wdGlvbmFsKCkgbWVudVRyaWdnZXI/OiBDZGtNZW51VHJpZ2dlcixcbiAgKSB7XG4gICAgc3VwZXIoZWxlbWVudCwgbmdab25lLCBtZW51U3RhY2ssIHBhcmVudE1lbnUsIG1lbnVBaW0sIGRpciwgbWVudVRyaWdnZXIpO1xuXG4gICAgdGhpcy5fcmVnaXN0ZXJEaXNwYXRjaGVyTGlzdGVuZXIoKTtcbiAgfVxuXG4gIG92ZXJyaWRlIG5nT25EZXN0cm95KCkge1xuICAgIHN1cGVyLm5nT25EZXN0cm95KCk7XG5cbiAgICB0aGlzLl9yZW1vdmVEaXNwYXRjaGVyTGlzdGVuZXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGVzIHRoZSBjaGVja2VkIHN0YXRlIG9mIHRoZSByYWRpby1idXR0b24uXG4gICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgdGhlIGNvbmZpZ3VyZSBob3cgdGhlIGl0ZW0gaXMgdHJpZ2dlcmVkXG4gICAqICAgLSBrZWVwT3Blbjogc3BlY2lmaWVzIHRoYXQgdGhlIG1lbnUgc2hvdWxkIGJlIGtlcHQgb3BlbiBhZnRlciB0cmlnZ2VyaW5nIHRoZSBpdGVtLlxuICAgKi9cbiAgb3ZlcnJpZGUgdHJpZ2dlcihvcHRpb25zPzoge2tlZXBPcGVuOiBib29sZWFufSkge1xuICAgIHN1cGVyLnRyaWdnZXIob3B0aW9ucyk7XG5cbiAgICBpZiAoIXRoaXMuZGlzYWJsZWQpIHtcbiAgICAgIHRoaXMuX3NlbGVjdGlvbkRpc3BhdGNoZXIubm90aWZ5KHRoaXMuX2lkLCAnJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENvbmZpZ3VyZSB0aGUgdW5pcXVlIHNlbGVjdGlvbiBkaXNwYXRjaGVyIGxpc3RlbmVyIGluIG9yZGVyIHRvIHRvZ2dsZSB0aGUgY2hlY2tlZCBzdGF0ZSAgKi9cbiAgcHJpdmF0ZSBfcmVnaXN0ZXJEaXNwYXRjaGVyTGlzdGVuZXIoKSB7XG4gICAgdGhpcy5fcmVtb3ZlRGlzcGF0Y2hlckxpc3RlbmVyID0gdGhpcy5fc2VsZWN0aW9uRGlzcGF0Y2hlci5saXN0ZW4oKGlkOiBzdHJpbmcpID0+IHtcbiAgICAgIHRoaXMuY2hlY2tlZCA9IHRoaXMuX2lkID09PSBpZDtcbiAgICB9KTtcbiAgfVxufVxuIl19