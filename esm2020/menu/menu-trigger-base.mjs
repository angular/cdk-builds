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
CdkMenuTriggerBase.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.0.0-rc.1", ngImport: i0, type: CdkMenuTriggerBase, deps: [], target: i0.ɵɵFactoryTarget.Directive });
CdkMenuTriggerBase.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "14.0.0-rc.1", type: CdkMenuTriggerBase, host: { properties: { "attr.aria-controls": "childMenu?.id", "attr.data-cdk-menu-stack-id": "menuStack.id" } }, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.0.0-rc.1", ngImport: i0, type: CdkMenuTriggerBase, decorators: [{
            type: Directive,
            args: [{
                    host: {
                        '[attr.aria-controls]': 'childMenu?.id',
                        '[attr.data-cdk-menu-stack-id]': 'menuStack.id',
                    },
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS10cmlnZ2VyLWJhc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL21lbnUvbWVudS10cmlnZ2VyLWJhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUNMLFNBQVMsRUFDVCxZQUFZLEVBQ1osTUFBTSxFQUNOLGNBQWMsRUFDZCxRQUFRLEVBR1IsZ0JBQWdCLEdBQ2pCLE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBQyxVQUFVLEVBQVksTUFBTSxjQUFjLENBQUM7QUFFbkQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ25ELE9BQU8sRUFBQyxLQUFLLEVBQUUsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDOztBQUVwQywrREFBK0Q7QUFDL0QsTUFBTSxDQUFDLE1BQU0sWUFBWSxHQUFHLElBQUksY0FBYyxDQUFxQixrQkFBa0IsQ0FBQyxDQUFDO0FBRXZGOzs7R0FHRztBQU9ILE1BQU0sT0FBZ0Isa0JBQWtCO0lBTnhDO1FBT0UsMENBQTBDO1FBQ2pDLGFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFckMsZ0RBQWdEO1FBQzdCLHFCQUFnQixHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBRS9ELGlEQUFpRDtRQUM5QixjQUFTLEdBQWMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBUTdELHdEQUF3RDtRQUMvQyxXQUFNLEdBQXVCLElBQUksWUFBWSxFQUFFLENBQUM7UUFFekQseURBQXlEO1FBQ2hELFdBQU0sR0FBdUIsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUt6RCxrRUFBa0U7UUFDeEQsZUFBVSxHQUFzQixJQUFJLENBQUM7UUFFL0MsNENBQTRDO1FBQ3pCLGNBQVMsR0FBa0IsSUFBSSxPQUFPLEVBQUUsQ0FBQztRQUU1RCx1RkFBdUY7UUFDcEUsOEJBQXlCLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0tBaUZuRjtJQXRFQyxXQUFXO1FBQ1QsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBRXZCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDdEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBRUQseUNBQXlDO0lBQ3pDLE1BQU07UUFDSixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxDQUFDO0lBQzFDLENBQUM7SUFFRCxvRUFBb0U7SUFDcEUsaUJBQWlCLENBQUMsS0FBVztRQUMzQixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztJQUN6QixDQUFDO0lBRUQ7OztPQUdHO0lBQ08sb0JBQW9CO1FBQzVCLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDLGVBQWUsS0FBSyxJQUFJLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQztRQUNyRixJQUFJLElBQUksQ0FBQyxlQUFlLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLElBQUkscUJBQXFCLENBQUMsRUFBRTtZQUN4RSxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksY0FBYyxDQUNuQyxJQUFJLENBQUMsZUFBZSxFQUNwQixJQUFJLENBQUMsZ0JBQWdCLEVBQ3JCLFNBQVMsRUFDVCxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FDN0IsQ0FBQztTQUNIO1FBRUQsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO0lBQzFCLENBQUM7SUFFRDs7OztPQUlHO0lBQ08sd0JBQXdCLENBQUMsT0FBZ0I7UUFDakQsS0FBSyxJQUFJLEVBQUUsR0FBbUIsT0FBTyxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLGFBQWEsSUFBSSxJQUFJLEVBQUU7WUFDekUsSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDLHdCQUF3QixDQUFDLEtBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ25FLE9BQU8sSUFBSSxDQUFDO2FBQ2I7U0FDRjtRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVELDJEQUEyRDtJQUNuRCxlQUFlO1FBQ3JCLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNuQixJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzFCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1NBQ3hCO0lBQ0gsQ0FBQztJQUVELDJEQUEyRDtJQUNuRCxxQkFBcUI7UUFDM0IsSUFBSSxDQUFDLGtCQUFrQjtZQUNyQixJQUFJLENBQUMsa0JBQWtCO2dCQUN2QixRQUFRLENBQUMsTUFBTSxDQUFDO29CQUNkLFNBQVMsRUFBRTt3QkFDVCxFQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBQzt3QkFDdkMsRUFBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFDO3FCQUNoRDtvQkFDRCxNQUFNLEVBQUUsSUFBSSxDQUFDLFFBQVE7aUJBQ3RCLENBQUMsQ0FBQztRQUNMLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDO0lBQ2pDLENBQUM7O29IQWhIbUIsa0JBQWtCO3dHQUFsQixrQkFBa0I7Z0dBQWxCLGtCQUFrQjtrQkFOdkMsU0FBUzttQkFBQztvQkFDVCxJQUFJLEVBQUU7d0JBQ0osc0JBQXNCLEVBQUUsZUFBZTt3QkFDdkMsK0JBQStCLEVBQUUsY0FBYztxQkFDaEQ7aUJBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgRGlyZWN0aXZlLFxuICBFdmVudEVtaXR0ZXIsXG4gIGluamVjdCxcbiAgSW5qZWN0aW9uVG9rZW4sXG4gIEluamVjdG9yLFxuICBPbkRlc3Ryb3ksXG4gIFRlbXBsYXRlUmVmLFxuICBWaWV3Q29udGFpbmVyUmVmLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7TWVudX0gZnJvbSAnLi9tZW51LWludGVyZmFjZSc7XG5pbXBvcnQge01FTlVfU1RBQ0ssIE1lbnVTdGFja30gZnJvbSAnLi9tZW51LXN0YWNrJztcbmltcG9ydCB7Q29ubmVjdGVkUG9zaXRpb24sIE92ZXJsYXlSZWZ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9vdmVybGF5JztcbmltcG9ydCB7VGVtcGxhdGVQb3J0YWx9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wb3J0YWwnO1xuaW1wb3J0IHttZXJnZSwgU3ViamVjdH0gZnJvbSAncnhqcyc7XG5cbi8qKiBJbmplY3Rpb24gdG9rZW4gdXNlZCBmb3IgYW4gaW1wbGVtZW50YXRpb24gb2YgTWVudVN0YWNrLiAqL1xuZXhwb3J0IGNvbnN0IE1FTlVfVFJJR0dFUiA9IG5ldyBJbmplY3Rpb25Ub2tlbjxDZGtNZW51VHJpZ2dlckJhc2U+KCdjZGstbWVudS10cmlnZ2VyJyk7XG5cbi8qKlxuICogQWJzdHJhY3QgZGlyZWN0aXZlIHRoYXQgaW1wbGVtZW50cyBzaGFyZWQgbG9naWMgY29tbW9uIHRvIGFsbCBtZW51IHRyaWdnZXJzLlxuICogVGhpcyBjbGFzcyBjYW4gYmUgZXh0ZW5kZWQgdG8gY3JlYXRlIGN1c3RvbSBtZW51IHRyaWdnZXIgdHlwZXMuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBob3N0OiB7XG4gICAgJ1thdHRyLmFyaWEtY29udHJvbHNdJzogJ2NoaWxkTWVudT8uaWQnLFxuICAgICdbYXR0ci5kYXRhLWNkay1tZW51LXN0YWNrLWlkXSc6ICdtZW51U3RhY2suaWQnLFxuICB9LFxufSlcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBDZGtNZW51VHJpZ2dlckJhc2UgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogVGhlIERJIGluamVjdG9yIGZvciB0aGlzIGNvbXBvbmVudC4gKi9cbiAgcmVhZG9ubHkgaW5qZWN0b3IgPSBpbmplY3QoSW5qZWN0b3IpO1xuXG4gIC8qKiBUaGUgdmlldyBjb250YWluZXIgcmVmIGZvciB0aGlzIGNvbXBvbmVudCAqL1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgdmlld0NvbnRhaW5lclJlZiA9IGluamVjdChWaWV3Q29udGFpbmVyUmVmKTtcblxuICAvKiogVGhlIG1lbnUgc3RhY2sgaW4gd2hpY2ggdGhpcyBtZW51IHJlc2lkZXMuICovXG4gIHByb3RlY3RlZCByZWFkb25seSBtZW51U3RhY2s6IE1lbnVTdGFjayA9IGluamVjdChNRU5VX1NUQUNLKTtcblxuICAvKipcbiAgICogQSBsaXN0IG9mIHByZWZlcnJlZCBtZW51IHBvc2l0aW9ucyB0byBiZSB1c2VkIHdoZW4gY29uc3RydWN0aW5nIHRoZVxuICAgKiBgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5YCBmb3IgdGhpcyB0cmlnZ2VyJ3MgbWVudS5cbiAgICovXG4gIG1lbnVQb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb25bXTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgYXR0YWNoZWQgbWVudSBpcyByZXF1ZXN0ZWQgdG8gb3BlbiAqL1xuICByZWFkb25seSBvcGVuZWQ6IEV2ZW50RW1pdHRlcjx2b2lkPiA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgYXR0YWNoZWQgbWVudSBpcyByZXF1ZXN0ZWQgdG8gY2xvc2UgKi9cbiAgcmVhZG9ubHkgY2xvc2VkOiBFdmVudEVtaXR0ZXI8dm9pZD4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbiAgLyoqIFRlbXBsYXRlIHJlZmVyZW5jZSB2YXJpYWJsZSB0byB0aGUgbWVudSB0aGlzIHRyaWdnZXIgb3BlbnMgKi9cbiAgbWVudVRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjx1bmtub3duPjtcblxuICAvKiogQSByZWZlcmVuY2UgdG8gdGhlIG92ZXJsYXkgd2hpY2ggbWFuYWdlcyB0aGUgdHJpZ2dlcmVkIG1lbnUgKi9cbiAgcHJvdGVjdGVkIG92ZXJsYXlSZWY6IE92ZXJsYXlSZWYgfCBudWxsID0gbnVsbDtcblxuICAvKiogRW1pdHMgd2hlbiB0aGlzIHRyaWdnZXIgaXMgZGVzdHJveWVkLiAqL1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgZGVzdHJveWVkOiBTdWJqZWN0PHZvaWQ+ID0gbmV3IFN1YmplY3QoKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgb3V0c2lkZSBwb2ludGVyIGV2ZW50cyBsaXN0ZW5lciBvbiB0aGUgb3ZlcmxheSBzaG91bGQgYmUgc3RvcHBlZC4gKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IHN0b3BPdXRzaWRlQ2xpY2tzTGlzdGVuZXIgPSBtZXJnZSh0aGlzLmNsb3NlZCwgdGhpcy5kZXN0cm95ZWQpO1xuXG4gIC8qKiBUaGUgY2hpbGQgbWVudSBvcGVuZWQgYnkgdGhpcyB0cmlnZ2VyLiAqL1xuICBwcm90ZWN0ZWQgY2hpbGRNZW51PzogTWVudTtcblxuICAvKiogVGhlIGNvbnRlbnQgb2YgdGhlIG1lbnUgcGFuZWwgb3BlbmVkIGJ5IHRoaXMgdHJpZ2dlci4gKi9cbiAgcHJpdmF0ZSBfbWVudVBvcnRhbDogVGVtcGxhdGVQb3J0YWw7XG5cbiAgLyoqIFRoZSBpbmplY3RvciB0byB1c2UgZm9yIHRoZSBjaGlsZCBtZW51IG9wZW5lZCBieSB0aGlzIHRyaWdnZXIuICovXG4gIHByaXZhdGUgX2NoaWxkTWVudUluamVjdG9yPzogSW5qZWN0b3I7XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fZGVzdHJveU92ZXJsYXkoKTtcblxuICAgIHRoaXMuZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLmRlc3Ryb3llZC5jb21wbGV0ZSgpO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGF0dGFjaGVkIG1lbnUgaXMgb3Blbi4gKi9cbiAgaXNPcGVuKCkge1xuICAgIHJldHVybiAhIXRoaXMub3ZlcmxheVJlZj8uaGFzQXR0YWNoZWQoKTtcbiAgfVxuXG4gIC8qKiBSZWdpc3RlcnMgYSBjaGlsZCBtZW51IGFzIGhhdmluZyBiZWVuIG9wZW5lZCBieSB0aGlzIHRyaWdnZXIuICovXG4gIHJlZ2lzdGVyQ2hpbGRNZW51KGNoaWxkOiBNZW51KSB7XG4gICAgdGhpcy5jaGlsZE1lbnUgPSBjaGlsZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHBvcnRhbCB0byBiZSBhdHRhY2hlZCB0byB0aGUgb3ZlcmxheSB3aGljaCBjb250YWlucyB0aGUgbWVudS4gQWxsb3dzIGZvciB0aGUgbWVudVxuICAgKiBjb250ZW50IHRvIGNoYW5nZSBkeW5hbWljYWxseSBhbmQgYmUgcmVmbGVjdGVkIGluIHRoZSBhcHBsaWNhdGlvbi5cbiAgICovXG4gIHByb3RlY3RlZCBnZXRNZW51Q29udGVudFBvcnRhbCgpIHtcbiAgICBjb25zdCBoYXNNZW51Q29udGVudENoYW5nZWQgPSB0aGlzLm1lbnVUZW1wbGF0ZVJlZiAhPT0gdGhpcy5fbWVudVBvcnRhbD8udGVtcGxhdGVSZWY7XG4gICAgaWYgKHRoaXMubWVudVRlbXBsYXRlUmVmICYmICghdGhpcy5fbWVudVBvcnRhbCB8fCBoYXNNZW51Q29udGVudENoYW5nZWQpKSB7XG4gICAgICB0aGlzLl9tZW51UG9ydGFsID0gbmV3IFRlbXBsYXRlUG9ydGFsKFxuICAgICAgICB0aGlzLm1lbnVUZW1wbGF0ZVJlZixcbiAgICAgICAgdGhpcy52aWV3Q29udGFpbmVyUmVmLFxuICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgIHRoaXMuX2dldENoaWxkTWVudUluamVjdG9yKCksXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9tZW51UG9ydGFsO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGdpdmVuIGVsZW1lbnQgaXMgaW5zaWRlIHRoZSBzY29wZSBvZiB0aGlzIHRyaWdnZXIncyBtZW51IHN0YWNrLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBjaGVjay5cbiAgICogQHJldHVybiBXaGV0aGVyIHRoZSBlbGVtZW50IGlzIGluc2lkZSB0aGUgc2NvcGUgb2YgdGhpcyB0cmlnZ2VyJ3MgbWVudSBzdGFjay5cbiAgICovXG4gIHByb3RlY3RlZCBpc0VsZW1lbnRJbnNpZGVNZW51U3RhY2soZWxlbWVudDogRWxlbWVudCkge1xuICAgIGZvciAobGV0IGVsOiBFbGVtZW50IHwgbnVsbCA9IGVsZW1lbnQ7IGVsOyBlbCA9IGVsPy5wYXJlbnRFbGVtZW50ID8/IG51bGwpIHtcbiAgICAgIGlmIChlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY2RrLW1lbnUtc3RhY2staWQnKSA9PT0gdGhpcy5tZW51U3RhY2suaWQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKiBEZXN0cm95IGFuZCB1bnNldCB0aGUgb3ZlcmxheSByZWZlcmVuY2UgaXQgaWYgZXhpc3RzICovXG4gIHByaXZhdGUgX2Rlc3Ryb3lPdmVybGF5KCkge1xuICAgIGlmICh0aGlzLm92ZXJsYXlSZWYpIHtcbiAgICAgIHRoaXMub3ZlcmxheVJlZi5kaXNwb3NlKCk7XG4gICAgICB0aGlzLm92ZXJsYXlSZWYgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBpbmplY3RvciB0byB1c2Ugd2hlbiBjcmVhdGluZyBhIGNoaWxkIG1lbnUuICovXG4gIHByaXZhdGUgX2dldENoaWxkTWVudUluamVjdG9yKCkge1xuICAgIHRoaXMuX2NoaWxkTWVudUluamVjdG9yID1cbiAgICAgIHRoaXMuX2NoaWxkTWVudUluamVjdG9yIHx8XG4gICAgICBJbmplY3Rvci5jcmVhdGUoe1xuICAgICAgICBwcm92aWRlcnM6IFtcbiAgICAgICAgICB7cHJvdmlkZTogTUVOVV9UUklHR0VSLCB1c2VWYWx1ZTogdGhpc30sXG4gICAgICAgICAge3Byb3ZpZGU6IE1FTlVfU1RBQ0ssIHVzZVZhbHVlOiB0aGlzLm1lbnVTdGFja30sXG4gICAgICAgIF0sXG4gICAgICAgIHBhcmVudDogdGhpcy5pbmplY3RvcixcbiAgICAgIH0pO1xuICAgIHJldHVybiB0aGlzLl9jaGlsZE1lbnVJbmplY3RvcjtcbiAgfVxufVxuIl19