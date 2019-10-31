/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ComponentFactoryResolver, Directive, EventEmitter, NgModule, Output, TemplateRef, ViewContainerRef, } from '@angular/core';
import { BasePortalOutlet, TemplatePortal } from './portal';
/**
 * Directive version of a `TemplatePortal`. Because the directive *is* a TemplatePortal,
 * the directive instance itself can be attached to a host, enabling declarative use of portals.
 */
export class CdkPortal extends TemplatePortal {
    /**
     * @param {?} templateRef
     * @param {?} viewContainerRef
     */
    constructor(templateRef, viewContainerRef) {
        super(templateRef, viewContainerRef);
    }
}
CdkPortal.decorators = [
    { type: Directive, args: [{
                selector: '[cdkPortal]',
                exportAs: 'cdkPortal',
            },] }
];
/** @nocollapse */
CdkPortal.ctorParameters = () => [
    { type: TemplateRef },
    { type: ViewContainerRef }
];
/**
 * @deprecated Use `CdkPortal` instead.
 * \@breaking-change 9.0.0
 */
export class TemplatePortalDirective extends CdkPortal {
}
TemplatePortalDirective.decorators = [
    { type: Directive, args: [{
                selector: '[cdk-portal], [portal]',
                exportAs: 'cdkPortal',
                providers: [{
                        provide: CdkPortal,
                        useExisting: TemplatePortalDirective
                    }]
            },] }
];
/**
 * Directive version of a PortalOutlet. Because the directive *is* a PortalOutlet, portals can be
 * directly attached to it, enabling declarative use.
 *
 * Usage:
 * `<ng-template [cdkPortalOutlet]="greeting"></ng-template>`
 */
export class CdkPortalOutlet extends BasePortalOutlet {
    /**
     * @param {?} _componentFactoryResolver
     * @param {?} _viewContainerRef
     */
    constructor(_componentFactoryResolver, _viewContainerRef) {
        super();
        this._componentFactoryResolver = _componentFactoryResolver;
        this._viewContainerRef = _viewContainerRef;
        /**
         * Whether the portal component is initialized.
         */
        this._isInitialized = false;
        /**
         * Emits when a portal is attached to the outlet.
         */
        this.attached = new EventEmitter();
    }
    /**
     * Portal associated with the Portal outlet.
     * @return {?}
     */
    get portal() {
        return this._attachedPortal;
    }
    /**
     * @param {?} portal
     * @return {?}
     */
    set portal(portal) {
        // Ignore the cases where the `portal` is set to a falsy value before the lifecycle hooks have
        // run. This handles the cases where the user might do something like `<div cdkPortalOutlet>`
        // and attach a portal programmatically in the parent component. When Angular does the first CD
        // round, it will fire the setter with empty string, causing the user's content to be cleared.
        if (this.hasAttached() && !portal && !this._isInitialized) {
            return;
        }
        if (this.hasAttached()) {
            super.detach();
        }
        if (portal) {
            super.attach(portal);
        }
        this._attachedPortal = portal;
    }
    /**
     * Component or view reference that is attached to the portal.
     * @return {?}
     */
    get attachedRef() {
        return this._attachedRef;
    }
    /**
     * @return {?}
     */
    ngOnInit() {
        this._isInitialized = true;
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        super.dispose();
        this._attachedPortal = null;
        this._attachedRef = null;
    }
    /**
     * Attach the given ComponentPortal to this PortalOutlet using the ComponentFactoryResolver.
     *
     * @template T
     * @param {?} portal Portal to be attached to the portal outlet.
     * @return {?} Reference to the created component.
     */
    attachComponentPortal(portal) {
        portal.setAttachedHost(this);
        // If the portal specifies an origin, use that as the logical location of the component
        // in the application tree. Otherwise use the location of this PortalOutlet.
        /** @type {?} */
        const viewContainerRef = portal.viewContainerRef != null ?
            portal.viewContainerRef :
            this._viewContainerRef;
        /** @type {?} */
        const resolver = portal.componentFactoryResolver || this._componentFactoryResolver;
        /** @type {?} */
        const componentFactory = resolver.resolveComponentFactory(portal.component);
        /** @type {?} */
        const ref = viewContainerRef.createComponent(componentFactory, viewContainerRef.length, portal.injector || viewContainerRef.injector);
        super.setDisposeFn((/**
         * @return {?}
         */
        () => ref.destroy()));
        this._attachedPortal = portal;
        this._attachedRef = ref;
        this.attached.emit(ref);
        return ref;
    }
    /**
     * Attach the given TemplatePortal to this PortlHost as an embedded View.
     * @template C
     * @param {?} portal Portal to be attached.
     * @return {?} Reference to the created embedded view.
     */
    attachTemplatePortal(portal) {
        portal.setAttachedHost(this);
        /** @type {?} */
        const viewRef = this._viewContainerRef.createEmbeddedView(portal.templateRef, portal.context);
        super.setDisposeFn((/**
         * @return {?}
         */
        () => this._viewContainerRef.clear()));
        this._attachedPortal = portal;
        this._attachedRef = viewRef;
        this.attached.emit(viewRef);
        return viewRef;
    }
}
CdkPortalOutlet.decorators = [
    { type: Directive, args: [{
                selector: '[cdkPortalOutlet]',
                exportAs: 'cdkPortalOutlet',
                inputs: ['portal: cdkPortalOutlet']
            },] }
];
/** @nocollapse */
CdkPortalOutlet.ctorParameters = () => [
    { type: ComponentFactoryResolver },
    { type: ViewContainerRef }
];
CdkPortalOutlet.propDecorators = {
    attached: [{ type: Output }]
};
if (false) {
    /** @type {?} */
    CdkPortalOutlet.ngAcceptInputType_portal;
    /**
     * Whether the portal component is initialized.
     * @type {?}
     * @private
     */
    CdkPortalOutlet.prototype._isInitialized;
    /**
     * Reference to the currently-attached component/view ref.
     * @type {?}
     * @private
     */
    CdkPortalOutlet.prototype._attachedRef;
    /**
     * Emits when a portal is attached to the outlet.
     * @type {?}
     */
    CdkPortalOutlet.prototype.attached;
    /**
     * @type {?}
     * @private
     */
    CdkPortalOutlet.prototype._componentFactoryResolver;
    /**
     * @type {?}
     * @private
     */
    CdkPortalOutlet.prototype._viewContainerRef;
}
/**
 * @deprecated Use `CdkPortalOutlet` instead.
 * \@breaking-change 9.0.0
 */
export class PortalHostDirective extends CdkPortalOutlet {
}
PortalHostDirective.decorators = [
    { type: Directive, args: [{
                selector: '[cdkPortalHost], [portalHost]',
                exportAs: 'cdkPortalHost',
                inputs: ['portal: cdkPortalHost'],
                providers: [{
                        provide: CdkPortalOutlet,
                        useExisting: PortalHostDirective
                    }]
            },] }
];
export class PortalModule {
}
PortalModule.decorators = [
    { type: NgModule, args: [{
                exports: [CdkPortal, CdkPortalOutlet, TemplatePortalDirective, PortalHostDirective],
                declarations: [CdkPortal, CdkPortalOutlet, TemplatePortalDirective, PortalHostDirective],
            },] }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9ydGFsLWRpcmVjdGl2ZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3BvcnRhbC9wb3J0YWwtZGlyZWN0aXZlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFDTCx3QkFBd0IsRUFFeEIsU0FBUyxFQUVULFlBQVksRUFDWixRQUFRLEVBR1IsTUFBTSxFQUNOLFdBQVcsRUFDWCxnQkFBZ0IsR0FDakIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLGdCQUFnQixFQUEyQixjQUFjLEVBQUMsTUFBTSxVQUFVLENBQUM7Ozs7O0FBV25GLE1BQU0sT0FBTyxTQUFVLFNBQVEsY0FBYzs7Ozs7SUFDM0MsWUFBWSxXQUE2QixFQUFFLGdCQUFrQztRQUMzRSxLQUFLLENBQUMsV0FBVyxFQUFFLGdCQUFnQixDQUFDLENBQUM7SUFDdkMsQ0FBQzs7O1lBUEYsU0FBUyxTQUFDO2dCQUNULFFBQVEsRUFBRSxhQUFhO2dCQUN2QixRQUFRLEVBQUUsV0FBVzthQUN0Qjs7OztZQWJDLFdBQVc7WUFDWCxnQkFBZ0I7Ozs7OztBQStCbEIsTUFBTSxPQUFPLHVCQUF3QixTQUFRLFNBQVM7OztZQVJyRCxTQUFTLFNBQUM7Z0JBQ1QsUUFBUSxFQUFFLHdCQUF3QjtnQkFDbEMsUUFBUSxFQUFFLFdBQVc7Z0JBQ3JCLFNBQVMsRUFBRSxDQUFDO3dCQUNWLE9BQU8sRUFBRSxTQUFTO3dCQUNsQixXQUFXLEVBQUUsdUJBQXVCO3FCQUNyQyxDQUFDO2FBQ0g7Ozs7Ozs7OztBQXFCRCxNQUFNLE9BQU8sZUFBZ0IsU0FBUSxnQkFBZ0I7Ozs7O0lBT25ELFlBQ1kseUJBQW1ELEVBQ25ELGlCQUFtQztRQUM3QyxLQUFLLEVBQUUsQ0FBQztRQUZFLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBMEI7UUFDbkQsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFrQjs7OztRQVB2QyxtQkFBYyxHQUFH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QVEsRUFBRSxtQkFBbUI7Z0JBQzdCLFFBQVEsRUFBRSxpQkFBaUI7Z0JBQzNCLE1BQU0sRUFBRSxDQUFDLHlCQUF5QixDQUFDO2FBQ3BDOzs7O1lBNURDLHdCQUF3QjtZQVV4QixnQkFBZ0I7Ozt1QkEwRmYsTUFBTTs7OztJQWdFUCx5Q0FBcUU7Ozs7OztJQXJHckUseUNBQStCOzs7Ozs7SUFHL0IsdUNBQWlEOzs7OztJQWtDakQsbUNBQ21EOzs7OztJQWhDL0Msb0RBQTJEOzs7OztJQUMzRCw0Q0FBMkM7Ozs7OztBQThHakQsTUFBTSxPQUFPLG1CQUFvQixTQUFRLGVBQWU7OztZQVR2RCxTQUFTLFNBQUM7Z0JBQ1QsUUFBUSxFQUFFLCtCQUErQjtnQkFDekMsUUFBUSxFQUFFLGVBQWU7Z0JBQ3pCLE1BQU0sRUFBRSxDQUFDLHVCQUF1QixDQUFDO2dCQUNqQyxTQUFTLEVBQUUsQ0FBQzt3QkFDVixPQUFPLEVBQUUsZUFBZTt3QkFDeEIsV0FBVyxFQUFFLG1CQUFtQjtxQkFDakMsQ0FBQzthQUNIOztBQVFELE1BQU0sT0FBTyxZQUFZOzs7WUFKeEIsUUFBUSxTQUFDO2dCQUNSLE9BQU8sRUFBRSxDQUFDLFNBQVMsRUFBRSxlQUFlLEVBQUUsdUJBQXVCLEVBQUUsbUJBQW1CLENBQUM7Z0JBQ25GLFlBQVksRUFBRSxDQUFDLFNBQVMsRUFBRSxlQUFlLEVBQUUsdUJBQXVCLEVBQUUsbUJBQW1CLENBQUM7YUFDekYiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLFxuICBDb21wb25lbnRSZWYsXG4gIERpcmVjdGl2ZSxcbiAgRW1iZWRkZWRWaWV3UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIE5nTW9kdWxlLFxuICBPbkRlc3Ryb3ksXG4gIE9uSW5pdCxcbiAgT3V0cHV0LFxuICBUZW1wbGF0ZVJlZixcbiAgVmlld0NvbnRhaW5lclJlZixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0Jhc2VQb3J0YWxPdXRsZXQsIENvbXBvbmVudFBvcnRhbCwgUG9ydGFsLCBUZW1wbGF0ZVBvcnRhbH0gZnJvbSAnLi9wb3J0YWwnO1xuXG5cbi8qKlxuICogRGlyZWN0aXZlIHZlcnNpb24gb2YgYSBgVGVtcGxhdGVQb3J0YWxgLiBCZWNhdXNlIHRoZSBkaXJlY3RpdmUgKmlzKiBhIFRlbXBsYXRlUG9ydGFsLFxuICogdGhlIGRpcmVjdGl2ZSBpbnN0YW5jZSBpdHNlbGYgY2FuIGJlIGF0dGFjaGVkIHRvIGEgaG9zdCwgZW5hYmxpbmcgZGVjbGFyYXRpdmUgdXNlIG9mIHBvcnRhbHMuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtQb3J0YWxdJyxcbiAgZXhwb3J0QXM6ICdjZGtQb3J0YWwnLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtQb3J0YWwgZXh0ZW5kcyBUZW1wbGF0ZVBvcnRhbCB7XG4gIGNvbnN0cnVjdG9yKHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxhbnk+LCB2aWV3Q29udGFpbmVyUmVmOiBWaWV3Q29udGFpbmVyUmVmKSB7XG4gICAgc3VwZXIodGVtcGxhdGVSZWYsIHZpZXdDb250YWluZXJSZWYpO1xuICB9XG59XG5cbi8qKlxuICogQGRlcHJlY2F0ZWQgVXNlIGBDZGtQb3J0YWxgIGluc3RlYWQuXG4gKiBAYnJlYWtpbmctY2hhbmdlIDkuMC4wXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGstcG9ydGFsXSwgW3BvcnRhbF0nLFxuICBleHBvcnRBczogJ2Nka1BvcnRhbCcsXG4gIHByb3ZpZGVyczogW3tcbiAgICBwcm92aWRlOiBDZGtQb3J0YWwsXG4gICAgdXNlRXhpc3Rpbmc6IFRlbXBsYXRlUG9ydGFsRGlyZWN0aXZlXG4gIH1dXG59KVxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlUG9ydGFsRGlyZWN0aXZlIGV4dGVuZHMgQ2RrUG9ydGFsIHt9XG5cbi8qKlxuICogUG9zc2libGUgYXR0YWNoZWQgcmVmZXJlbmNlcyB0byB0aGUgQ2RrUG9ydGFsT3V0bGV0LlxuICovXG5leHBvcnQgdHlwZSBDZGtQb3J0YWxPdXRsZXRBdHRhY2hlZFJlZiA9IENvbXBvbmVudFJlZjxhbnk+IHwgRW1iZWRkZWRWaWV3UmVmPGFueT4gfCBudWxsO1xuXG5cbi8qKlxuICogRGlyZWN0aXZlIHZlcnNpb24gb2YgYSBQb3J0YWxPdXRsZXQuIEJlY2F1c2UgdGhlIGRpcmVjdGl2ZSAqaXMqIGEgUG9ydGFsT3V0bGV0LCBwb3J0YWxzIGNhbiBiZVxuICogZGlyZWN0bHkgYXR0YWNoZWQgdG8gaXQsIGVuYWJsaW5nIGRlY2xhcmF0aXZlIHVzZS5cbiAqXG4gKiBVc2FnZTpcbiAqIGA8bmctdGVtcGxhdGUgW2Nka1BvcnRhbE91dGxldF09XCJncmVldGluZ1wiPjwvbmctdGVtcGxhdGU+YFxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrUG9ydGFsT3V0bGV0XScsXG4gIGV4cG9ydEFzOiAnY2RrUG9ydGFsT3V0bGV0JyxcbiAgaW5wdXRzOiBbJ3BvcnRhbDogY2RrUG9ydGFsT3V0bGV0J11cbn0pXG5leHBvcnQgY2xhc3MgQ2RrUG9ydGFsT3V0bGV0IGV4dGVuZHMgQmFzZVBvcnRhbE91dGxldCBpbXBsZW1lbnRzIE9uSW5pdCwgT25EZXN0cm95IHtcbiAgLyoqIFdoZXRoZXIgdGhlIHBvcnRhbCBjb21wb25lbnQgaXMgaW5pdGlhbGl6ZWQuICovXG4gIHByaXZhdGUgX2lzSW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50bHktYXR0YWNoZWQgY29tcG9uZW50L3ZpZXcgcmVmLiAqL1xuICBwcml2YXRlIF9hdHRhY2hlZFJlZjogQ2RrUG9ydGFsT3V0bGV0QXR0YWNoZWRSZWY7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF9jb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI6IENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcixcbiAgICAgIHByaXZhdGUgX3ZpZXdDb250YWluZXJSZWY6IFZpZXdDb250YWluZXJSZWYpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgLyoqIFBvcnRhbCBhc3NvY2lhdGVkIHdpdGggdGhlIFBvcnRhbCBvdXRsZXQuICovXG4gIGdldCBwb3J0YWwoKTogUG9ydGFsPGFueT4gfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fYXR0YWNoZWRQb3J0YWw7XG4gIH1cblxuICBzZXQgcG9ydGFsKHBvcnRhbDogUG9ydGFsPGFueT4gfCBudWxsKSB7XG4gICAgLy8gSWdub3JlIHRoZSBjYXNlcyB3aGVyZSB0aGUgYHBvcnRhbGAgaXMgc2V0IHRvIGEgZmFsc3kgdmFsdWUgYmVmb3JlIHRoZSBsaWZlY3ljbGUgaG9va3MgaGF2ZVxuICAgIC8vIHJ1bi4gVGhpcyBoYW5kbGVzIHRoZSBjYXNlcyB3aGVyZSB0aGUgdXNlciBtaWdodCBkbyBzb21ldGhpbmcgbGlrZSBgPGRpdiBjZGtQb3J0YWxPdXRsZXQ+YFxuICAgIC8vIGFuZCBhdHRhY2ggYSBwb3J0YWwgcHJvZ3JhbW1hdGljYWxseSBpbiB0aGUgcGFyZW50IGNvbXBvbmVudC4gV2hlbiBBbmd1bGFyIGRvZXMgdGhlIGZpcnN0IENEXG4gICAgLy8gcm91bmQsIGl0IHdpbGwgZmlyZSB0aGUgc2V0dGVyIHdpdGggZW1wdHkgc3RyaW5nLCBjYXVzaW5nIHRoZSB1c2VyJ3MgY29udGVudCB0byBiZSBjbGVhcmVkLlxuICAgIGlmICh0aGlzLmhhc0F0dGFjaGVkKCkgJiYgIXBvcnRhbCAmJiAhdGhpcy5faXNJbml0aWFsaXplZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhc0F0dGFjaGVkKCkpIHtcbiAgICAgIHN1cGVyLmRldGFjaCgpO1xuICAgIH1cblxuICAgIGlmIChwb3J0YWwpIHtcbiAgICAgIHN1cGVyLmF0dGFjaChwb3J0YWwpO1xuICAgIH1cblxuICAgIHRoaXMuX2F0dGFjaGVkUG9ydGFsID0gcG9ydGFsO1xuICB9XG5cbiAgLyoqIEVtaXRzIHdoZW4gYSBwb3J0YWwgaXMgYXR0YWNoZWQgdG8gdGhlIG91dGxldC4gKi9cbiAgQE91dHB1dCgpIGF0dGFjaGVkOiBFdmVudEVtaXR0ZXI8Q2RrUG9ydGFsT3V0bGV0QXR0YWNoZWRSZWY+ID1cbiAgICAgIG5ldyBFdmVudEVtaXR0ZXI8Q2RrUG9ydGFsT3V0bGV0QXR0YWNoZWRSZWY+KCk7XG5cbiAgLyoqIENvbXBvbmVudCBvciB2aWV3IHJlZmVyZW5jZSB0aGF0IGlzIGF0dGFjaGVkIHRvIHRoZSBwb3J0YWwuICovXG4gIGdldCBhdHRhY2hlZFJlZigpOiBDZGtQb3J0YWxPdXRsZXRBdHRhY2hlZFJlZiB7XG4gICAgcmV0dXJuIHRoaXMuX2F0dGFjaGVkUmVmO1xuICB9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgdGhpcy5faXNJbml0aWFsaXplZCA9IHRydWU7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBzdXBlci5kaXNwb3NlKCk7XG4gICAgdGhpcy5fYXR0YWNoZWRQb3J0YWwgPSBudWxsO1xuICAgIHRoaXMuX2F0dGFjaGVkUmVmID0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRhY2ggdGhlIGdpdmVuIENvbXBvbmVudFBvcnRhbCB0byB0aGlzIFBvcnRhbE91dGxldCB1c2luZyB0aGUgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLlxuICAgKlxuICAgKiBAcGFyYW0gcG9ydGFsIFBvcnRhbCB0byBiZSBhdHRhY2hlZCB0byB0aGUgcG9ydGFsIG91dGxldC5cbiAgICogQHJldHVybnMgUmVmZXJlbmNlIHRvIHRoZSBjcmVhdGVkIGNvbXBvbmVudC5cbiAgICovXG4gIGF0dGFjaENvbXBvbmVudFBvcnRhbDxUPihwb3J0YWw6IENvbXBvbmVudFBvcnRhbDxUPik6IENvbXBvbmVudFJlZjxUPiB7XG4gICAgcG9ydGFsLnNldEF0dGFjaGVkSG9zdCh0aGlzKTtcblxuICAgIC8vIElmIHRoZSBwb3J0YWwgc3BlY2lmaWVzIGFuIG9yaWdpbiwgdXNlIHRoYXQgYXMgdGhlIGxvZ2ljYWwgbG9jYXRpb24gb2YgdGhlIGNvbXBvbmVudFxuICAgIC8vIGluIHRoZSBhcHBsaWNhdGlvbiB0cmVlLiBPdGhlcndpc2UgdXNlIHRoZSBsb2NhdGlvbiBvZiB0aGlzIFBvcnRhbE91dGxldC5cbiAgICBjb25zdCB2aWV3Q29udGFpbmVyUmVmID0gcG9ydGFsLnZpZXdDb250YWluZXJSZWYgIT0gbnVsbCA/XG4gICAgICAgIHBvcnRhbC52aWV3Q29udGFpbmVyUmVmIDpcbiAgICAgICAgdGhpcy5fdmlld0NvbnRhaW5lclJlZjtcblxuICAgIGNvbnN0IHJlc29sdmVyID0gcG9ydGFsLmNvbXBvbmVudEZhY3RvcnlSZXNvbHZlciB8fCB0aGlzLl9jb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI7XG4gICAgY29uc3QgY29tcG9uZW50RmFjdG9yeSA9IHJlc29sdmVyLnJlc29sdmVDb21wb25lbnRGYWN0b3J5KHBvcnRhbC5jb21wb25lbnQpO1xuICAgIGNvbnN0IHJlZiA9IHZpZXdDb250YWluZXJSZWYuY3JlYXRlQ29tcG9uZW50KFxuICAgICAgICBjb21wb25lbnRGYWN0b3J5LCB2aWV3Q29udGFpbmVyUmVmLmxlbmd0aCxcbiAgICAgICAgcG9ydGFsLmluamVjdG9yIHx8IHZpZXdDb250YWluZXJSZWYuaW5qZWN0b3IpO1xuXG4gICAgc3VwZXIuc2V0RGlzcG9zZUZuKCgpID0+IHJlZi5kZXN0cm95KCkpO1xuICAgIHRoaXMuX2F0dGFjaGVkUG9ydGFsID0gcG9ydGFsO1xuICAgIHRoaXMuX2F0dGFjaGVkUmVmID0gcmVmO1xuICAgIHRoaXMuYXR0YWNoZWQuZW1pdChyZWYpO1xuXG4gICAgcmV0dXJuIHJlZjtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRhY2ggdGhlIGdpdmVuIFRlbXBsYXRlUG9ydGFsIHRvIHRoaXMgUG9ydGxIb3N0IGFzIGFuIGVtYmVkZGVkIFZpZXcuXG4gICAqIEBwYXJhbSBwb3J0YWwgUG9ydGFsIHRvIGJlIGF0dGFjaGVkLlxuICAgKiBAcmV0dXJucyBSZWZlcmVuY2UgdG8gdGhlIGNyZWF0ZWQgZW1iZWRkZWQgdmlldy5cbiAgICovXG4gIGF0dGFjaFRlbXBsYXRlUG9ydGFsPEM+KHBvcnRhbDogVGVtcGxhdGVQb3J0YWw8Qz4pOiBFbWJlZGRlZFZpZXdSZWY8Qz4ge1xuICAgIHBvcnRhbC5zZXRBdHRhY2hlZEhvc3QodGhpcyk7XG4gICAgY29uc3Qgdmlld1JlZiA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuY3JlYXRlRW1iZWRkZWRWaWV3KHBvcnRhbC50ZW1wbGF0ZVJlZiwgcG9ydGFsLmNvbnRleHQpO1xuICAgIHN1cGVyLnNldERpc3Bvc2VGbigoKSA9PiB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmNsZWFyKCkpO1xuXG4gICAgdGhpcy5fYXR0YWNoZWRQb3J0YWwgPSBwb3J0YWw7XG4gICAgdGhpcy5fYXR0YWNoZWRSZWYgPSB2aWV3UmVmO1xuICAgIHRoaXMuYXR0YWNoZWQuZW1pdCh2aWV3UmVmKTtcblxuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX3BvcnRhbDogUG9ydGFsPGFueT4gfCBudWxsIHwgdW5kZWZpbmVkIHwgJyc7XG59XG5cbi8qKlxuICogQGRlcHJlY2F0ZWQgVXNlIGBDZGtQb3J0YWxPdXRsZXRgIGluc3RlYWQuXG4gKiBAYnJlYWtpbmctY2hhbmdlIDkuMC4wXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtQb3J0YWxIb3N0XSwgW3BvcnRhbEhvc3RdJyxcbiAgZXhwb3J0QXM6ICdjZGtQb3J0YWxIb3N0JyxcbiAgaW5wdXRzOiBbJ3BvcnRhbDogY2RrUG9ydGFsSG9zdCddLFxuICBwcm92aWRlcnM6IFt7XG4gICAgcHJvdmlkZTogQ2RrUG9ydGFsT3V0bGV0LFxuICAgIHVzZUV4aXN0aW5nOiBQb3J0YWxIb3N0RGlyZWN0aXZlXG4gIH1dXG59KVxuZXhwb3J0IGNsYXNzIFBvcnRhbEhvc3REaXJlY3RpdmUgZXh0ZW5kcyBDZGtQb3J0YWxPdXRsZXQge31cblxuXG5ATmdNb2R1bGUoe1xuICBleHBvcnRzOiBbQ2RrUG9ydGFsLCBDZGtQb3J0YWxPdXRsZXQsIFRlbXBsYXRlUG9ydGFsRGlyZWN0aXZlLCBQb3J0YWxIb3N0RGlyZWN0aXZlXSxcbiAgZGVjbGFyYXRpb25zOiBbQ2RrUG9ydGFsLCBDZGtQb3J0YWxPdXRsZXQsIFRlbXBsYXRlUG9ydGFsRGlyZWN0aXZlLCBQb3J0YWxIb3N0RGlyZWN0aXZlXSxcbn0pXG5leHBvcnQgY2xhc3MgUG9ydGFsTW9kdWxlIHt9XG4iXX0=