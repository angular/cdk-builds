/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, EventEmitter, inject, InjectionToken, Injector, ViewContainerRef, } from '@angular/core';
import { MENU_STACK } from './menu-stack';
import { TemplatePortal } from '@angular/cdk/portal';
import { merge, Subject } from 'rxjs';
import * as i0 from "@angular/core";
/** Injection token used for an implementation of MenuStack. */
export const MENU_TRIGGER = new InjectionToken('cdk-menu-trigger');
/**
 * Abstract directive that implements shared logic common to all menu triggers.
 * This class can be extended to create custom menu trigger types.
 */
export class CdkMenuTriggerBase {
    constructor() {
        /** The DI injector for this component. */
        this.injector = inject(Injector);
        /** The view container ref for this component */
        this.viewContainerRef = inject(ViewContainerRef);
        /** The menu stack in which this menu resides. */
        this.menuStack = inject(MENU_STACK);
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
            this._menuPortal = new TemplatePortal(this.menuTemplateRef, this.viewContainerRef, this.menuData, this._getChildMenuInjector());
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: CdkMenuTriggerBase, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.0.4", type: CdkMenuTriggerBase, isStandalone: true, host: { properties: { "attr.aria-controls": "childMenu?.id", "attr.data-cdk-menu-stack-id": "menuStack.id" } }, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: CdkMenuTriggerBase, decorators: [{
            type: Directive,
            args: [{
                    host: {
                        '[attr.aria-controls]': 'childMenu?.id',
                        '[attr.data-cdk-menu-stack-id]': 'menuStack.id',
                    },
                    standalone: true,
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS10cmlnZ2VyLWJhc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL21lbnUvbWVudS10cmlnZ2VyLWJhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUNMLFNBQVMsRUFDVCxZQUFZLEVBQ1osTUFBTSxFQUNOLGNBQWMsRUFDZCxRQUFRLEVBR1IsZ0JBQWdCLEdBQ2pCLE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBQyxVQUFVLEVBQVksTUFBTSxjQUFjLENBQUM7QUFFbkQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ25ELE9BQU8sRUFBQyxLQUFLLEVBQUUsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDOztBQUVwQywrREFBK0Q7QUFDL0QsTUFBTSxDQUFDLE1BQU0sWUFBWSxHQUFHLElBQUksY0FBYyxDQUFxQixrQkFBa0IsQ0FBQyxDQUFDO0FBRXZGOzs7R0FHRztBQVFILE1BQU0sT0FBZ0Isa0JBQWtCO0lBUHhDO1FBUUUsMENBQTBDO1FBQ2pDLGFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFckMsZ0RBQWdEO1FBQzdCLHFCQUFnQixHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBRS9ELGlEQUFpRDtRQUM5QixjQUFTLEdBQWMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBUTdELHdEQUF3RDtRQUMvQyxXQUFNLEdBQXVCLElBQUksWUFBWSxFQUFFLENBQUM7UUFFekQseURBQXlEO1FBQ2hELFdBQU0sR0FBdUIsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQVF6RCxrRUFBa0U7UUFDeEQsZUFBVSxHQUFzQixJQUFJLENBQUM7UUFFL0MsNENBQTRDO1FBQ3pCLGNBQVMsR0FBa0IsSUFBSSxPQUFPLEVBQUUsQ0FBQztRQUU1RCx1RkFBdUY7UUFDcEUsOEJBQXlCLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0tBaUZuRjtJQXRFQyxXQUFXO1FBQ1QsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBRXZCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDdEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBRUQseUNBQXlDO0lBQ3pDLE1BQU07UUFDSixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxDQUFDO0lBQzFDLENBQUM7SUFFRCxvRUFBb0U7SUFDcEUsaUJBQWlCLENBQUMsS0FBVztRQUMzQixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztJQUN6QixDQUFDO0lBRUQ7OztPQUdHO0lBQ08sb0JBQW9CO1FBQzVCLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDLGVBQWUsS0FBSyxJQUFJLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQztRQUNyRixJQUFJLElBQUksQ0FBQyxlQUFlLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLElBQUkscUJBQXFCLENBQUMsRUFBRTtZQUN4RSxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksY0FBYyxDQUNuQyxJQUFJLENBQUMsZUFBZSxFQUNwQixJQUFJLENBQUMsZ0JBQWdCLEVBQ3JCLElBQUksQ0FBQyxRQUFRLEVBQ2IsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQzdCLENBQUM7U0FDSDtRQUVELE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztJQUMxQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNPLHdCQUF3QixDQUFDLE9BQWdCO1FBQ2pELEtBQUssSUFBSSxFQUFFLEdBQW1CLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxhQUFhLElBQUksSUFBSSxFQUFFO1lBQ3pFLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFO2dCQUNuRSxPQUFPLElBQUksQ0FBQzthQUNiO1NBQ0Y7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCwyREFBMkQ7SUFDbkQsZUFBZTtRQUNyQixJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDbkIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUMxQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztTQUN4QjtJQUNILENBQUM7SUFFRCwyREFBMkQ7SUFDbkQscUJBQXFCO1FBQzNCLElBQUksQ0FBQyxrQkFBa0I7WUFDckIsSUFBSSxDQUFDLGtCQUFrQjtnQkFDdkIsUUFBUSxDQUFDLE1BQU0sQ0FBQztvQkFDZCxTQUFTLEVBQUU7d0JBQ1QsRUFBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUM7d0JBQ3ZDLEVBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBQztxQkFDaEQ7b0JBQ0QsTUFBTSxFQUFFLElBQUksQ0FBQyxRQUFRO2lCQUN0QixDQUFDLENBQUM7UUFDTCxPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztJQUNqQyxDQUFDOzhHQW5IbUIsa0JBQWtCO2tHQUFsQixrQkFBa0I7OzJGQUFsQixrQkFBa0I7a0JBUHZDLFNBQVM7bUJBQUM7b0JBQ1QsSUFBSSxFQUFFO3dCQUNKLHNCQUFzQixFQUFFLGVBQWU7d0JBQ3ZDLCtCQUErQixFQUFFLGNBQWM7cUJBQ2hEO29CQUNELFVBQVUsRUFBRSxJQUFJO2lCQUNqQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIEV2ZW50RW1pdHRlcixcbiAgaW5qZWN0LFxuICBJbmplY3Rpb25Ub2tlbixcbiAgSW5qZWN0b3IsXG4gIE9uRGVzdHJveSxcbiAgVGVtcGxhdGVSZWYsXG4gIFZpZXdDb250YWluZXJSZWYsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtNZW51fSBmcm9tICcuL21lbnUtaW50ZXJmYWNlJztcbmltcG9ydCB7TUVOVV9TVEFDSywgTWVudVN0YWNrfSBmcm9tICcuL21lbnUtc3RhY2snO1xuaW1wb3J0IHtDb25uZWN0ZWRQb3NpdGlvbiwgT3ZlcmxheVJlZn0gZnJvbSAnQGFuZ3VsYXIvY2RrL292ZXJsYXknO1xuaW1wb3J0IHtUZW1wbGF0ZVBvcnRhbH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BvcnRhbCc7XG5pbXBvcnQge21lcmdlLCBTdWJqZWN0fSBmcm9tICdyeGpzJztcblxuLyoqIEluamVjdGlvbiB0b2tlbiB1c2VkIGZvciBhbiBpbXBsZW1lbnRhdGlvbiBvZiBNZW51U3RhY2suICovXG5leHBvcnQgY29uc3QgTUVOVV9UUklHR0VSID0gbmV3IEluamVjdGlvblRva2VuPENka01lbnVUcmlnZ2VyQmFzZT4oJ2Nkay1tZW51LXRyaWdnZXInKTtcblxuLyoqXG4gKiBBYnN0cmFjdCBkaXJlY3RpdmUgdGhhdCBpbXBsZW1lbnRzIHNoYXJlZCBsb2dpYyBjb21tb24gdG8gYWxsIG1lbnUgdHJpZ2dlcnMuXG4gKiBUaGlzIGNsYXNzIGNhbiBiZSBleHRlbmRlZCB0byBjcmVhdGUgY3VzdG9tIG1lbnUgdHJpZ2dlciB0eXBlcy5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIGhvc3Q6IHtcbiAgICAnW2F0dHIuYXJpYS1jb250cm9sc10nOiAnY2hpbGRNZW51Py5pZCcsXG4gICAgJ1thdHRyLmRhdGEtY2RrLW1lbnUtc3RhY2staWRdJzogJ21lbnVTdGFjay5pZCcsXG4gIH0sXG4gIHN0YW5kYWxvbmU6IHRydWUsXG59KVxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIENka01lbnVUcmlnZ2VyQmFzZSBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qKiBUaGUgREkgaW5qZWN0b3IgZm9yIHRoaXMgY29tcG9uZW50LiAqL1xuICByZWFkb25seSBpbmplY3RvciA9IGluamVjdChJbmplY3Rvcik7XG5cbiAgLyoqIFRoZSB2aWV3IGNvbnRhaW5lciByZWYgZm9yIHRoaXMgY29tcG9uZW50ICovXG4gIHByb3RlY3RlZCByZWFkb25seSB2aWV3Q29udGFpbmVyUmVmID0gaW5qZWN0KFZpZXdDb250YWluZXJSZWYpO1xuXG4gIC8qKiBUaGUgbWVudSBzdGFjayBpbiB3aGljaCB0aGlzIG1lbnUgcmVzaWRlcy4gKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IG1lbnVTdGFjazogTWVudVN0YWNrID0gaW5qZWN0KE1FTlVfU1RBQ0spO1xuXG4gIC8qKlxuICAgKiBBIGxpc3Qgb2YgcHJlZmVycmVkIG1lbnUgcG9zaXRpb25zIHRvIGJlIHVzZWQgd2hlbiBjb25zdHJ1Y3RpbmcgdGhlXG4gICAqIGBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3lgIGZvciB0aGlzIHRyaWdnZXIncyBtZW51LlxuICAgKi9cbiAgbWVudVBvc2l0aW9uOiBDb25uZWN0ZWRQb3NpdGlvbltdO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBhdHRhY2hlZCBtZW51IGlzIHJlcXVlc3RlZCB0byBvcGVuICovXG4gIHJlYWRvbmx5IG9wZW5lZDogRXZlbnRFbWl0dGVyPHZvaWQ+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBhdHRhY2hlZCBtZW51IGlzIHJlcXVlc3RlZCB0byBjbG9zZSAqL1xuICByZWFkb25seSBjbG9zZWQ6IEV2ZW50RW1pdHRlcjx2b2lkPiA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICAvKiogVGVtcGxhdGUgcmVmZXJlbmNlIHZhcmlhYmxlIHRvIHRoZSBtZW51IHRoaXMgdHJpZ2dlciBvcGVucyAqL1xuICBtZW51VGVtcGxhdGVSZWY6IFRlbXBsYXRlUmVmPHVua25vd24+IHwgbnVsbDtcblxuICAvKiogQ29udGV4dCBkYXRhIHRvIGJlIHBhc3NlZCBhbG9uZyB0byB0aGUgbWVudSB0ZW1wbGF0ZSAqL1xuICBtZW51RGF0YTogdW5rbm93bjtcblxuICAvKiogQSByZWZlcmVuY2UgdG8gdGhlIG92ZXJsYXkgd2hpY2ggbWFuYWdlcyB0aGUgdHJpZ2dlcmVkIG1lbnUgKi9cbiAgcHJvdGVjdGVkIG92ZXJsYXlSZWY6IE92ZXJsYXlSZWYgfCBudWxsID0gbnVsbDtcblxuICAvKiogRW1pdHMgd2hlbiB0aGlzIHRyaWdnZXIgaXMgZGVzdHJveWVkLiAqL1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgZGVzdHJveWVkOiBTdWJqZWN0PHZvaWQ+ID0gbmV3IFN1YmplY3QoKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgb3V0c2lkZSBwb2ludGVyIGV2ZW50cyBsaXN0ZW5lciBvbiB0aGUgb3ZlcmxheSBzaG91bGQgYmUgc3RvcHBlZC4gKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IHN0b3BPdXRzaWRlQ2xpY2tzTGlzdGVuZXIgPSBtZXJnZSh0aGlzLmNsb3NlZCwgdGhpcy5kZXN0cm95ZWQpO1xuXG4gIC8qKiBUaGUgY2hpbGQgbWVudSBvcGVuZWQgYnkgdGhpcyB0cmlnZ2VyLiAqL1xuICBwcm90ZWN0ZWQgY2hpbGRNZW51PzogTWVudTtcblxuICAvKiogVGhlIGNvbnRlbnQgb2YgdGhlIG1lbnUgcGFuZWwgb3BlbmVkIGJ5IHRoaXMgdHJpZ2dlci4gKi9cbiAgcHJpdmF0ZSBfbWVudVBvcnRhbDogVGVtcGxhdGVQb3J0YWw7XG5cbiAgLyoqIFRoZSBpbmplY3RvciB0byB1c2UgZm9yIHRoZSBjaGlsZCBtZW51IG9wZW5lZCBieSB0aGlzIHRyaWdnZXIuICovXG4gIHByaXZhdGUgX2NoaWxkTWVudUluamVjdG9yPzogSW5qZWN0b3I7XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fZGVzdHJveU92ZXJsYXkoKTtcblxuICAgIHRoaXMuZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLmRlc3Ryb3llZC5jb21wbGV0ZSgpO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGF0dGFjaGVkIG1lbnUgaXMgb3Blbi4gKi9cbiAgaXNPcGVuKCkge1xuICAgIHJldHVybiAhIXRoaXMub3ZlcmxheVJlZj8uaGFzQXR0YWNoZWQoKTtcbiAgfVxuXG4gIC8qKiBSZWdpc3RlcnMgYSBjaGlsZCBtZW51IGFzIGhhdmluZyBiZWVuIG9wZW5lZCBieSB0aGlzIHRyaWdnZXIuICovXG4gIHJlZ2lzdGVyQ2hpbGRNZW51KGNoaWxkOiBNZW51KSB7XG4gICAgdGhpcy5jaGlsZE1lbnUgPSBjaGlsZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHBvcnRhbCB0byBiZSBhdHRhY2hlZCB0byB0aGUgb3ZlcmxheSB3aGljaCBjb250YWlucyB0aGUgbWVudS4gQWxsb3dzIGZvciB0aGUgbWVudVxuICAgKiBjb250ZW50IHRvIGNoYW5nZSBkeW5hbWljYWxseSBhbmQgYmUgcmVmbGVjdGVkIGluIHRoZSBhcHBsaWNhdGlvbi5cbiAgICovXG4gIHByb3RlY3RlZCBnZXRNZW51Q29udGVudFBvcnRhbCgpIHtcbiAgICBjb25zdCBoYXNNZW51Q29udGVudENoYW5nZWQgPSB0aGlzLm1lbnVUZW1wbGF0ZVJlZiAhPT0gdGhpcy5fbWVudVBvcnRhbD8udGVtcGxhdGVSZWY7XG4gICAgaWYgKHRoaXMubWVudVRlbXBsYXRlUmVmICYmICghdGhpcy5fbWVudVBvcnRhbCB8fCBoYXNNZW51Q29udGVudENoYW5nZWQpKSB7XG4gICAgICB0aGlzLl9tZW51UG9ydGFsID0gbmV3IFRlbXBsYXRlUG9ydGFsKFxuICAgICAgICB0aGlzLm1lbnVUZW1wbGF0ZVJlZixcbiAgICAgICAgdGhpcy52aWV3Q29udGFpbmVyUmVmLFxuICAgICAgICB0aGlzLm1lbnVEYXRhLFxuICAgICAgICB0aGlzLl9nZXRDaGlsZE1lbnVJbmplY3RvcigpLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fbWVudVBvcnRhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBnaXZlbiBlbGVtZW50IGlzIGluc2lkZSB0aGUgc2NvcGUgb2YgdGhpcyB0cmlnZ2VyJ3MgbWVudSBzdGFjay5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gY2hlY2suXG4gICAqIEByZXR1cm4gV2hldGhlciB0aGUgZWxlbWVudCBpcyBpbnNpZGUgdGhlIHNjb3BlIG9mIHRoaXMgdHJpZ2dlcidzIG1lbnUgc3RhY2suXG4gICAqL1xuICBwcm90ZWN0ZWQgaXNFbGVtZW50SW5zaWRlTWVudVN0YWNrKGVsZW1lbnQ6IEVsZW1lbnQpIHtcbiAgICBmb3IgKGxldCBlbDogRWxlbWVudCB8IG51bGwgPSBlbGVtZW50OyBlbDsgZWwgPSBlbD8ucGFyZW50RWxlbWVudCA/PyBudWxsKSB7XG4gICAgICBpZiAoZWwuZ2V0QXR0cmlidXRlKCdkYXRhLWNkay1tZW51LXN0YWNrLWlkJykgPT09IHRoaXMubWVudVN0YWNrLmlkKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKiogRGVzdHJveSBhbmQgdW5zZXQgdGhlIG92ZXJsYXkgcmVmZXJlbmNlIGl0IGlmIGV4aXN0cyAqL1xuICBwcml2YXRlIF9kZXN0cm95T3ZlcmxheSgpIHtcbiAgICBpZiAodGhpcy5vdmVybGF5UmVmKSB7XG4gICAgICB0aGlzLm92ZXJsYXlSZWYuZGlzcG9zZSgpO1xuICAgICAgdGhpcy5vdmVybGF5UmVmID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvKiogR2V0cyB0aGUgaW5qZWN0b3IgdG8gdXNlIHdoZW4gY3JlYXRpbmcgYSBjaGlsZCBtZW51LiAqL1xuICBwcml2YXRlIF9nZXRDaGlsZE1lbnVJbmplY3RvcigpIHtcbiAgICB0aGlzLl9jaGlsZE1lbnVJbmplY3RvciA9XG4gICAgICB0aGlzLl9jaGlsZE1lbnVJbmplY3RvciB8fFxuICAgICAgSW5qZWN0b3IuY3JlYXRlKHtcbiAgICAgICAgcHJvdmlkZXJzOiBbXG4gICAgICAgICAge3Byb3ZpZGU6IE1FTlVfVFJJR0dFUiwgdXNlVmFsdWU6IHRoaXN9LFxuICAgICAgICAgIHtwcm92aWRlOiBNRU5VX1NUQUNLLCB1c2VWYWx1ZTogdGhpcy5tZW51U3RhY2t9LFxuICAgICAgICBdLFxuICAgICAgICBwYXJlbnQ6IHRoaXMuaW5qZWN0b3IsXG4gICAgICB9KTtcbiAgICByZXR1cm4gdGhpcy5fY2hpbGRNZW51SW5qZWN0b3I7XG4gIH1cbn1cbiJdfQ==