/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, EventEmitter, Inject, InjectionToken, Injector, ViewContainerRef, } from '@angular/core';
import { MENU_STACK, MenuStack } from './menu-stack';
import { TemplatePortal } from '@angular/cdk/portal';
import { merge, Subject } from 'rxjs';
import * as i0 from "@angular/core";
import * as i1 from "./menu-stack";
/** Injection token used for an implementation of MenuStack. */
export const MENU_TRIGGER = new InjectionToken('cdk-menu-trigger');
/**
 * Abstract directive that implements shared logic common to all menu triggers.
 * This class can be extended to create custom menu trigger types.
 */
export class CdkMenuTriggerBase {
    constructor(
    /** The DI injector for this component */
    injector, 
    /** The view container ref for this component */
    viewContainerRef, 
    /** The menu stack this menu is part of. */
    menuStack) {
        this.injector = injector;
        this.viewContainerRef = viewContainerRef;
        this.menuStack = menuStack;
        /** Emits when the attached menu is requested to open */
        this.opened = new EventEmitter();
        /** Emits when the attached menu is requested to close */
        this.closed = new EventEmitter();
        /** A reference to the overlay which manages the triggered menu */
        this.overlayRef = null;
        /** Emits when this trigger is destroyed. */
        this.destroyed = new Subject();
        /** Emits when the outside pointer events listener on the overlay should be stopped. */
        this.stopOutsideClicksListener = merge(this.closed, this.destroyed);
    }
    ngOnDestroy() {
        this._destroyOverlay();
        this.destroyed.next();
        this.destroyed.complete();
    }
    /** Whether the attached menu is open. */
    isOpen() {
        return !!this.overlayRef?.hasAttached();
    }
    /** Registers a child menu as having been opened by this trigger. */
    registerChildMenu(child) {
        this.childMenu = child;
    }
    /**
     * Get the portal to be attached to the overlay which contains the menu. Allows for the menu
     * content to change dynamically and be reflected in the application.
     */
    getMenuContentPortal() {
        const hasMenuContentChanged = this.menuTemplateRef !== this._menuPortal?.templateRef;
        if (this.menuTemplateRef && (!this._menuPortal || hasMenuContentChanged)) {
            this._menuPortal = new TemplatePortal(this.menuTemplateRef, this.viewContainerRef, undefined, this._getChildMenuInjector());
        }
        return this._menuPortal;
    }
    /**
     * Whether the given element is inside the scope of this trigger's menu stack.
     * @param element The element to check.
     * @return Whether the element is inside the scope of this trigger's menu stack.
     */
    isElementInsideMenuStack(element) {
        for (let el = element; el; el = el?.parentElement ?? null) {
            if (el.getAttribute('data-cdk-menu-stack-id') === this.menuStack.id) {
                return true;
            }
        }
        return false;
    }
    /** Destroy and unset the overlay reference it if exists */
    _destroyOverlay() {
        if (this.overlayRef) {
            this.overlayRef.dispose();
            this.overlayRef = null;
        }
    }
    /** Gets the injector to use when creating a child menu. */
    _getChildMenuInjector() {
        this._childMenuInjector =
            this._childMenuInjector ||
                Injector.create({
                    providers: [
                        { provide: MENU_TRIGGER, useValue: this },
                        { provide: MENU_STACK, useValue: this.menuStack },
                    ],
                    parent: this.injector,
                });
        return this._childMenuInjector;
    }
}
CdkMenuTriggerBase.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.0.0-next.15", ngImport: i0, type: CdkMenuTriggerBase, deps: [{ token: i0.Injector }, { token: i0.ViewContainerRef }, { token: MENU_STACK }], target: i0.ɵɵFactoryTarget.Directive });
CdkMenuTriggerBase.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "14.0.0-next.15", type: CdkMenuTriggerBase, host: { properties: { "attr.aria-controls": "childMenu?.id", "attr.data-cdk-menu-stack-id": "menuStack.id" } }, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.0.0-next.15", ngImport: i0, type: CdkMenuTriggerBase, decorators: [{
            type: Directive,
            args: [{
                    host: {
                        '[attr.aria-controls]': 'childMenu?.id',
                        '[attr.data-cdk-menu-stack-id]': 'menuStack.id',
                    },
                }]
        }], ctorParameters: function () { return [{ type: i0.Injector }, { type: i0.ViewContainerRef }, { type: i1.MenuStack, decorators: [{
                    type: Inject,
                    args: [MENU_STACK]
                }] }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS10cmlnZ2VyLWJhc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL21lbnUvbWVudS10cmlnZ2VyLWJhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUNMLFNBQVMsRUFDVCxZQUFZLEVBQ1osTUFBTSxFQUNOLGNBQWMsRUFDZCxRQUFRLEVBR1IsZ0JBQWdCLEdBQ2pCLE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBRW5ELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNuRCxPQUFPLEVBQUMsS0FBSyxFQUFFLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQzs7O0FBRXBDLCtEQUErRDtBQUMvRCxNQUFNLENBQUMsTUFBTSxZQUFZLEdBQUcsSUFBSSxjQUFjLENBQXFCLGtCQUFrQixDQUFDLENBQUM7QUFFdkY7OztHQUdHO0FBT0gsTUFBTSxPQUFnQixrQkFBa0I7SUErQnRDO0lBQ0UseUNBQXlDO0lBQ3RCLFFBQWtCO0lBQ3JDLGdEQUFnRDtJQUM3QixnQkFBa0M7SUFDckQsMkNBQTJDO0lBQ0osU0FBb0I7UUFKeEMsYUFBUSxHQUFSLFFBQVEsQ0FBVTtRQUVsQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1FBRWQsY0FBUyxHQUFULFNBQVMsQ0FBVztRQWpDN0Qsd0RBQXdEO1FBQy9DLFdBQU0sR0FBdUIsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUV6RCx5REFBeUQ7UUFDaEQsV0FBTSxHQUF1QixJQUFJLFlBQVksRUFBRSxDQUFDO1FBS3pELGtFQUFrRTtRQUN4RCxlQUFVLEdBQXNCLElBQUksQ0FBQztRQUUvQyw0Q0FBNEM7UUFDekIsY0FBUyxHQUFrQixJQUFJLE9BQU8sRUFBRSxDQUFDO1FBRTVELHVGQUF1RjtRQUNwRSw4QkFBeUIsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7SUFrQi9FLENBQUM7SUFFSixXQUFXO1FBQ1QsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBRXZCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDdEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBRUQseUNBQXlDO0lBQ3pDLE1BQU07UUFDSixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxDQUFDO0lBQzFDLENBQUM7SUFFRCxvRUFBb0U7SUFDcEUsaUJBQWlCLENBQUMsS0FBVztRQUMzQixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztJQUN6QixDQUFDO0lBRUQ7OztPQUdHO0lBQ08sb0JBQW9CO1FBQzVCLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDLGVBQWUsS0FBSyxJQUFJLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQztRQUNyRixJQUFJLElBQUksQ0FBQyxlQUFlLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLElBQUkscUJBQXFCLENBQUMsRUFBRTtZQUN4RSxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksY0FBYyxDQUNuQyxJQUFJLENBQUMsZUFBZSxFQUNwQixJQUFJLENBQUMsZ0JBQWdCLEVBQ3JCLFNBQVMsRUFDVCxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FDN0IsQ0FBQztTQUNIO1FBRUQsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO0lBQzFCLENBQUM7SUFFRDs7OztPQUlHO0lBQ08sd0JBQXdCLENBQUMsT0FBZ0I7UUFDakQsS0FBSyxJQUFJLEVBQUUsR0FBbUIsT0FBTyxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLGFBQWEsSUFBSSxJQUFJLEVBQUU7WUFDekUsSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDLHdCQUF3QixDQUFDLEtBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ25FLE9BQU8sSUFBSSxDQUFDO2FBQ2I7U0FDRjtRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVELDJEQUEyRDtJQUNuRCxlQUFlO1FBQ3JCLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNuQixJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzFCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1NBQ3hCO0lBQ0gsQ0FBQztJQUVELDJEQUEyRDtJQUNuRCxxQkFBcUI7UUFDM0IsSUFBSSxDQUFDLGtCQUFrQjtZQUNyQixJQUFJLENBQUMsa0JBQWtCO2dCQUN2QixRQUFRLENBQUMsTUFBTSxDQUFDO29CQUNkLFNBQVMsRUFBRTt3QkFDVCxFQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBQzt3QkFDdkMsRUFBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFDO3FCQUNoRDtvQkFDRCxNQUFNLEVBQUUsSUFBSSxDQUFDLFFBQVE7aUJBQ3RCLENBQUMsQ0FBQztRQUNMLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDO0lBQ2pDLENBQUM7O3VIQTdHbUIsa0JBQWtCLDBFQXFDNUIsVUFBVTsyR0FyQ0Esa0JBQWtCO21HQUFsQixrQkFBa0I7a0JBTnZDLFNBQVM7bUJBQUM7b0JBQ1QsSUFBSSxFQUFFO3dCQUNKLHNCQUFzQixFQUFFLGVBQWU7d0JBQ3ZDLCtCQUErQixFQUFFLGNBQWM7cUJBQ2hEO2lCQUNGOzswQkFzQ0ksTUFBTTsyQkFBQyxVQUFVIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIERpcmVjdGl2ZSxcbiAgRXZlbnRFbWl0dGVyLFxuICBJbmplY3QsXG4gIEluamVjdGlvblRva2VuLFxuICBJbmplY3RvcixcbiAgT25EZXN0cm95LFxuICBUZW1wbGF0ZVJlZixcbiAgVmlld0NvbnRhaW5lclJlZixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge01lbnV9IGZyb20gJy4vbWVudS1pbnRlcmZhY2UnO1xuaW1wb3J0IHtNRU5VX1NUQUNLLCBNZW51U3RhY2t9IGZyb20gJy4vbWVudS1zdGFjayc7XG5pbXBvcnQge0Nvbm5lY3RlZFBvc2l0aW9uLCBPdmVybGF5UmVmfSBmcm9tICdAYW5ndWxhci9jZGsvb3ZlcmxheSc7XG5pbXBvcnQge1RlbXBsYXRlUG9ydGFsfSBmcm9tICdAYW5ndWxhci9jZGsvcG9ydGFsJztcbmltcG9ydCB7bWVyZ2UsIFN1YmplY3R9IGZyb20gJ3J4anMnO1xuXG4vKiogSW5qZWN0aW9uIHRva2VuIHVzZWQgZm9yIGFuIGltcGxlbWVudGF0aW9uIG9mIE1lbnVTdGFjay4gKi9cbmV4cG9ydCBjb25zdCBNRU5VX1RSSUdHRVIgPSBuZXcgSW5qZWN0aW9uVG9rZW48Q2RrTWVudVRyaWdnZXJCYXNlPignY2RrLW1lbnUtdHJpZ2dlcicpO1xuXG4vKipcbiAqIEFic3RyYWN0IGRpcmVjdGl2ZSB0aGF0IGltcGxlbWVudHMgc2hhcmVkIGxvZ2ljIGNvbW1vbiB0byBhbGwgbWVudSB0cmlnZ2Vycy5cbiAqIFRoaXMgY2xhc3MgY2FuIGJlIGV4dGVuZGVkIHRvIGNyZWF0ZSBjdXN0b20gbWVudSB0cmlnZ2VyIHR5cGVzLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgaG9zdDoge1xuICAgICdbYXR0ci5hcmlhLWNvbnRyb2xzXSc6ICdjaGlsZE1lbnU/LmlkJyxcbiAgICAnW2F0dHIuZGF0YS1jZGstbWVudS1zdGFjay1pZF0nOiAnbWVudVN0YWNrLmlkJyxcbiAgfSxcbn0pXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQ2RrTWVudVRyaWdnZXJCYXNlIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIEEgbGlzdCBvZiBwcmVmZXJyZWQgbWVudSBwb3NpdGlvbnMgdG8gYmUgdXNlZCB3aGVuIGNvbnN0cnVjdGluZyB0aGUgYEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneWAgZm9yIHRoaXMgdHJpZ2dlcidzIG1lbnUuICovXG4gIG1lbnVQb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb25bXTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgYXR0YWNoZWQgbWVudSBpcyByZXF1ZXN0ZWQgdG8gb3BlbiAqL1xuICByZWFkb25seSBvcGVuZWQ6IEV2ZW50RW1pdHRlcjx2b2lkPiA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgYXR0YWNoZWQgbWVudSBpcyByZXF1ZXN0ZWQgdG8gY2xvc2UgKi9cbiAgcmVhZG9ubHkgY2xvc2VkOiBFdmVudEVtaXR0ZXI8dm9pZD4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbiAgLyoqIFRlbXBsYXRlIHJlZmVyZW5jZSB2YXJpYWJsZSB0byB0aGUgbWVudSB0aGlzIHRyaWdnZXIgb3BlbnMgKi9cbiAgbWVudVRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjx1bmtub3duPjtcblxuICAvKiogQSByZWZlcmVuY2UgdG8gdGhlIG92ZXJsYXkgd2hpY2ggbWFuYWdlcyB0aGUgdHJpZ2dlcmVkIG1lbnUgKi9cbiAgcHJvdGVjdGVkIG92ZXJsYXlSZWY6IE92ZXJsYXlSZWYgfCBudWxsID0gbnVsbDtcblxuICAvKiogRW1pdHMgd2hlbiB0aGlzIHRyaWdnZXIgaXMgZGVzdHJveWVkLiAqL1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgZGVzdHJveWVkOiBTdWJqZWN0PHZvaWQ+ID0gbmV3IFN1YmplY3QoKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgb3V0c2lkZSBwb2ludGVyIGV2ZW50cyBsaXN0ZW5lciBvbiB0aGUgb3ZlcmxheSBzaG91bGQgYmUgc3RvcHBlZC4gKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IHN0b3BPdXRzaWRlQ2xpY2tzTGlzdGVuZXIgPSBtZXJnZSh0aGlzLmNsb3NlZCwgdGhpcy5kZXN0cm95ZWQpO1xuXG4gIC8qKiBUaGUgY2hpbGQgbWVudSBvcGVuZWQgYnkgdGhpcyB0cmlnZ2VyLiAqL1xuICBwcm90ZWN0ZWQgY2hpbGRNZW51PzogTWVudTtcblxuICAvKiogVGhlIGNvbnRlbnQgb2YgdGhlIG1lbnUgcGFuZWwgb3BlbmVkIGJ5IHRoaXMgdHJpZ2dlci4gKi9cbiAgcHJpdmF0ZSBfbWVudVBvcnRhbDogVGVtcGxhdGVQb3J0YWw7XG5cbiAgLyoqIFRoZSBpbmplY3RvciB0byB1c2UgZm9yIHRoZSBjaGlsZCBtZW51IG9wZW5lZCBieSB0aGlzIHRyaWdnZXIuICovXG4gIHByaXZhdGUgX2NoaWxkTWVudUluamVjdG9yPzogSW5qZWN0b3I7XG5cbiAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKFxuICAgIC8qKiBUaGUgREkgaW5qZWN0b3IgZm9yIHRoaXMgY29tcG9uZW50ICovXG4gICAgcHJvdGVjdGVkIHJlYWRvbmx5IGluamVjdG9yOiBJbmplY3RvcixcbiAgICAvKiogVGhlIHZpZXcgY29udGFpbmVyIHJlZiBmb3IgdGhpcyBjb21wb25lbnQgKi9cbiAgICBwcm90ZWN0ZWQgcmVhZG9ubHkgdmlld0NvbnRhaW5lclJlZjogVmlld0NvbnRhaW5lclJlZixcbiAgICAvKiogVGhlIG1lbnUgc3RhY2sgdGhpcyBtZW51IGlzIHBhcnQgb2YuICovXG4gICAgQEluamVjdChNRU5VX1NUQUNLKSBwcm90ZWN0ZWQgcmVhZG9ubHkgbWVudVN0YWNrOiBNZW51U3RhY2ssXG4gICkge31cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9kZXN0cm95T3ZlcmxheSgpO1xuXG4gICAgdGhpcy5kZXN0cm95ZWQubmV4dCgpO1xuICAgIHRoaXMuZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgYXR0YWNoZWQgbWVudSBpcyBvcGVuLiAqL1xuICBpc09wZW4oKSB7XG4gICAgcmV0dXJuICEhdGhpcy5vdmVybGF5UmVmPy5oYXNBdHRhY2hlZCgpO1xuICB9XG5cbiAgLyoqIFJlZ2lzdGVycyBhIGNoaWxkIG1lbnUgYXMgaGF2aW5nIGJlZW4gb3BlbmVkIGJ5IHRoaXMgdHJpZ2dlci4gKi9cbiAgcmVnaXN0ZXJDaGlsZE1lbnUoY2hpbGQ6IE1lbnUpIHtcbiAgICB0aGlzLmNoaWxkTWVudSA9IGNoaWxkO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgcG9ydGFsIHRvIGJlIGF0dGFjaGVkIHRvIHRoZSBvdmVybGF5IHdoaWNoIGNvbnRhaW5zIHRoZSBtZW51LiBBbGxvd3MgZm9yIHRoZSBtZW51XG4gICAqIGNvbnRlbnQgdG8gY2hhbmdlIGR5bmFtaWNhbGx5IGFuZCBiZSByZWZsZWN0ZWQgaW4gdGhlIGFwcGxpY2F0aW9uLlxuICAgKi9cbiAgcHJvdGVjdGVkIGdldE1lbnVDb250ZW50UG9ydGFsKCkge1xuICAgIGNvbnN0IGhhc01lbnVDb250ZW50Q2hhbmdlZCA9IHRoaXMubWVudVRlbXBsYXRlUmVmICE9PSB0aGlzLl9tZW51UG9ydGFsPy50ZW1wbGF0ZVJlZjtcbiAgICBpZiAodGhpcy5tZW51VGVtcGxhdGVSZWYgJiYgKCF0aGlzLl9tZW51UG9ydGFsIHx8IGhhc01lbnVDb250ZW50Q2hhbmdlZCkpIHtcbiAgICAgIHRoaXMuX21lbnVQb3J0YWwgPSBuZXcgVGVtcGxhdGVQb3J0YWwoXG4gICAgICAgIHRoaXMubWVudVRlbXBsYXRlUmVmLFxuICAgICAgICB0aGlzLnZpZXdDb250YWluZXJSZWYsXG4gICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgdGhpcy5fZ2V0Q2hpbGRNZW51SW5qZWN0b3IoKSxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX21lbnVQb3J0YWw7XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0aGUgZ2l2ZW4gZWxlbWVudCBpcyBpbnNpZGUgdGhlIHNjb3BlIG9mIHRoaXMgdHJpZ2dlcidzIG1lbnUgc3RhY2suXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIGNoZWNrLlxuICAgKiBAcmV0dXJuIFdoZXRoZXIgdGhlIGVsZW1lbnQgaXMgaW5zaWRlIHRoZSBzY29wZSBvZiB0aGlzIHRyaWdnZXIncyBtZW51IHN0YWNrLlxuICAgKi9cbiAgcHJvdGVjdGVkIGlzRWxlbWVudEluc2lkZU1lbnVTdGFjayhlbGVtZW50OiBFbGVtZW50KSB7XG4gICAgZm9yIChsZXQgZWw6IEVsZW1lbnQgfCBudWxsID0gZWxlbWVudDsgZWw7IGVsID0gZWw/LnBhcmVudEVsZW1lbnQgPz8gbnVsbCkge1xuICAgICAgaWYgKGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1jZGstbWVudS1zdGFjay1pZCcpID09PSB0aGlzLm1lbnVTdGFjay5pZCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqIERlc3Ryb3kgYW5kIHVuc2V0IHRoZSBvdmVybGF5IHJlZmVyZW5jZSBpdCBpZiBleGlzdHMgKi9cbiAgcHJpdmF0ZSBfZGVzdHJveU92ZXJsYXkoKSB7XG4gICAgaWYgKHRoaXMub3ZlcmxheVJlZikge1xuICAgICAgdGhpcy5vdmVybGF5UmVmLmRpc3Bvc2UoKTtcbiAgICAgIHRoaXMub3ZlcmxheVJlZiA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgLyoqIEdldHMgdGhlIGluamVjdG9yIHRvIHVzZSB3aGVuIGNyZWF0aW5nIGEgY2hpbGQgbWVudS4gKi9cbiAgcHJpdmF0ZSBfZ2V0Q2hpbGRNZW51SW5qZWN0b3IoKSB7XG4gICAgdGhpcy5fY2hpbGRNZW51SW5qZWN0b3IgPVxuICAgICAgdGhpcy5fY2hpbGRNZW51SW5qZWN0b3IgfHxcbiAgICAgIEluamVjdG9yLmNyZWF0ZSh7XG4gICAgICAgIHByb3ZpZGVyczogW1xuICAgICAgICAgIHtwcm92aWRlOiBNRU5VX1RSSUdHRVIsIHVzZVZhbHVlOiB0aGlzfSxcbiAgICAgICAgICB7cHJvdmlkZTogTUVOVV9TVEFDSywgdXNlVmFsdWU6IHRoaXMubWVudVN0YWNrfSxcbiAgICAgICAgXSxcbiAgICAgICAgcGFyZW50OiB0aGlzLmluamVjdG9yLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIHRoaXMuX2NoaWxkTWVudUluamVjdG9yO1xuICB9XG59XG4iXX0=