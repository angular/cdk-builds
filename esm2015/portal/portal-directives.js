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
import { ComponentFactoryResolver, Directive, EventEmitter, NgModule, Output, TemplateRef, ViewContainerRef, Inject, } from '@angular/core';
import { DOCUMENT } from '@angular/common';
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
     * @param {?=} _document
     */
    constructor(_componentFactoryResolver, _viewContainerRef, 
    /**
     * @deprecated `_document` parameter to be made required.
     * @breaking-change 9.0.0
     */
    _document) {
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
        /**
         * Attaches the given DomPortal to this PortalHost by moving all of the portal content into it.
         * @param portal Portal to be attached.
         * @deprecated To be turned into a method.
         * \@breaking-change 10.0.0
         */
        this.attachDomPortal = (/**
         * @param {?} portal
         * @return {?}
         */
        (portal) => {
            // @breaking-change 9.0.0 Remove check and error once the
            // `_document` constructor parameter is required.
            if (!this._document) {
                throw Error('Cannot attach DOM portal without _document constructor parameter');
            }
            // Anchor used to save the element's previous position so
            // that we can restore it when the portal is detached.
            /** @type {?} */
            const anchorNode = this._document.createComment('dom-portal');
            /** @type {?} */
            const element = portal.element;
            portal.setAttachedHost(this);
            (/** @type {?} */ (element.parentNode)).insertBefore(anchorNode, element);
            this._getRootNode().appendChild(element);
            super.setDisposeFn((/**
             * @return {?}
             */
            () => {
                (/** @type {?} */ (anchorNode.parentNode)).replaceChild(element, anchorNode);
            }));
        });
        this._document = _document;
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
        // If we're using a view container that's different from the injected one (e.g. when the portal
        // specifies its own) we need to move the component into the outlet, otherwise it'll be rendered
        // inside of the alternate view container.
        if (viewContainerRef !== this._viewContainerRef) {
            this._getRootNode().appendChild(((/** @type {?} */ (ref.hostView))).rootNodes[0]);
        }
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
     * Attach the given TemplatePortal to this PortalHost as an embedded View.
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
    /**
     * Gets the root node of the portal outlet.
     * @private
     * @return {?}
     */
    _getRootNode() {
        /** @type {?} */
        const nativeElement = this._viewContainerRef.element.nativeElement;
        // The directive could be set on a template which will result in a comment
        // node being the root. Use the comment's parent node if that is the case.
        return (/** @type {?} */ ((nativeElement.nodeType === nativeElement.ELEMENT_NODE ?
            nativeElement : (/** @type {?} */ (nativeElement.parentNode)))));
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
    { type: ViewContainerRef },
    { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] }
];
CdkPortalOutlet.propDecorators = {
    attached: [{ type: Output }]
};
if (false) {
    /** @type {?} */
    CdkPortalOutlet.ngAcceptInputType_portal;
    /**
     * @type {?}
     * @private
     */
    CdkPortalOutlet.prototype._document;
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
     * Attaches the given DomPortal to this PortalHost by moving all of the portal content into it.
     * \@param portal Portal to be attached.
     * @deprecated To be turned into a method.
     * \@breaking-change 10.0.0
     * @type {?}
     */
    CdkPortalOutlet.prototype.attachDomPortal;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9ydGFsLWRpcmVjdGl2ZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3BvcnRhbC9wb3J0YWwtZGlyZWN0aXZlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFDTCx3QkFBd0IsRUFFeEIsU0FBUyxFQUVULFlBQVksRUFDWixRQUFRLEVBR1IsTUFBTSxFQUNOLFdBQVcsRUFDWCxnQkFBZ0IsRUFDaEIsTUFBTSxHQUNQLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQUMsZ0JBQWdCLEVBQTJCLGNBQWMsRUFBWSxNQUFNLFVBQVUsQ0FBQzs7Ozs7QUFXOUYsTUFBTSxPQUFPLFNBQVUsU0FBUSxjQUFjOzs7OztJQUMzQyxZQUFZLFdBQTZCLEVBQUUsZ0JBQWtDO1FBQzNFLEtBQUssQ0FBQyxXQUFXLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztJQUN2QyxDQUFDOzs7WUFQRixTQUFTLFNBQUM7Z0JBQ1QsUUFBUSxFQUFFLGFBQWE7Z0JBQ3ZCLFFBQVEsRUFBRSxXQUFXO2FBQ3RCOzs7O1lBZkMsV0FBVztZQUNYLGdCQUFnQjs7Ozs7O0FBaUNsQixNQUFNLE9BQU8sdUJBQXdCLFNBQVEsU0FBUzs7O1lBUnJELFNBQVMsU0FBQztnQkFDVCxRQUFRLEVBQUUsd0JBQXdCO2dCQUNsQyxRQUFRLEVBQUUsV0FBVztnQkFDckIsU0FBUyxFQUFFLENBQUM7d0JBQ1YsT0FBTyxFQUFFLFNBQVM7d0JBQ2xCLFdBQVcsRUFBRSx1QkFBdUI7cUJBQ3JDLENBQUM7YUFDSDs7Ozs7Ozs7O0FBcUJELE1BQU0sT0FBTyxlQUFnQixTQUFRLGdCQUFnQjs7Ozs7O0lBU25ELFlBQ1kseUJBQW1ELEVBQ25ELGlCQUFtQztJQUUzQzs7O09BR0c7SUFDZSxTQUFlO1FBQ25DLEtBQUssRUFBRSxDQUFDO1FBUkUs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Iiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcixcbiAgQ29tcG9uZW50UmVmLFxuICBEaXJlY3RpdmUsXG4gIEVtYmVkZGVkVmlld1JlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBOZ01vZHVsZSxcbiAgT25EZXN0cm95LFxuICBPbkluaXQsXG4gIE91dHB1dCxcbiAgVGVtcGxhdGVSZWYsXG4gIFZpZXdDb250YWluZXJSZWYsXG4gIEluamVjdCxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtCYXNlUG9ydGFsT3V0bGV0LCBDb21wb25lbnRQb3J0YWwsIFBvcnRhbCwgVGVtcGxhdGVQb3J0YWwsIERvbVBvcnRhbH0gZnJvbSAnLi9wb3J0YWwnO1xuXG5cbi8qKlxuICogRGlyZWN0aXZlIHZlcnNpb24gb2YgYSBgVGVtcGxhdGVQb3J0YWxgLiBCZWNhdXNlIHRoZSBkaXJlY3RpdmUgKmlzKiBhIFRlbXBsYXRlUG9ydGFsLFxuICogdGhlIGRpcmVjdGl2ZSBpbnN0YW5jZSBpdHNlbGYgY2FuIGJlIGF0dGFjaGVkIHRvIGEgaG9zdCwgZW5hYmxpbmcgZGVjbGFyYXRpdmUgdXNlIG9mIHBvcnRhbHMuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtQb3J0YWxdJyxcbiAgZXhwb3J0QXM6ICdjZGtQb3J0YWwnLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtQb3J0YWwgZXh0ZW5kcyBUZW1wbGF0ZVBvcnRhbCB7XG4gIGNvbnN0cnVjdG9yKHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxhbnk+LCB2aWV3Q29udGFpbmVyUmVmOiBWaWV3Q29udGFpbmVyUmVmKSB7XG4gICAgc3VwZXIodGVtcGxhdGVSZWYsIHZpZXdDb250YWluZXJSZWYpO1xuICB9XG59XG5cbi8qKlxuICogQGRlcHJlY2F0ZWQgVXNlIGBDZGtQb3J0YWxgIGluc3RlYWQuXG4gKiBAYnJlYWtpbmctY2hhbmdlIDkuMC4wXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGstcG9ydGFsXSwgW3BvcnRhbF0nLFxuICBleHBvcnRBczogJ2Nka1BvcnRhbCcsXG4gIHByb3ZpZGVyczogW3tcbiAgICBwcm92aWRlOiBDZGtQb3J0YWwsXG4gICAgdXNlRXhpc3Rpbmc6IFRlbXBsYXRlUG9ydGFsRGlyZWN0aXZlXG4gIH1dXG59KVxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlUG9ydGFsRGlyZWN0aXZlIGV4dGVuZHMgQ2RrUG9ydGFsIHt9XG5cbi8qKlxuICogUG9zc2libGUgYXR0YWNoZWQgcmVmZXJlbmNlcyB0byB0aGUgQ2RrUG9ydGFsT3V0bGV0LlxuICovXG5leHBvcnQgdHlwZSBDZGtQb3J0YWxPdXRsZXRBdHRhY2hlZFJlZiA9IENvbXBvbmVudFJlZjxhbnk+IHwgRW1iZWRkZWRWaWV3UmVmPGFueT4gfCBudWxsO1xuXG5cbi8qKlxuICogRGlyZWN0aXZlIHZlcnNpb24gb2YgYSBQb3J0YWxPdXRsZXQuIEJlY2F1c2UgdGhlIGRpcmVjdGl2ZSAqaXMqIGEgUG9ydGFsT3V0bGV0LCBwb3J0YWxzIGNhbiBiZVxuICogZGlyZWN0bHkgYXR0YWNoZWQgdG8gaXQsIGVuYWJsaW5nIGRlY2xhcmF0aXZlIHVzZS5cbiAqXG4gKiBVc2FnZTpcbiAqIGA8bmctdGVtcGxhdGUgW2Nka1BvcnRhbE91dGxldF09XCJncmVldGluZ1wiPjwvbmctdGVtcGxhdGU+YFxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrUG9ydGFsT3V0bGV0XScsXG4gIGV4cG9ydEFzOiAnY2RrUG9ydGFsT3V0bGV0JyxcbiAgaW5wdXRzOiBbJ3BvcnRhbDogY2RrUG9ydGFsT3V0bGV0J11cbn0pXG5leHBvcnQgY2xhc3MgQ2RrUG9ydGFsT3V0bGV0IGV4dGVuZHMgQmFzZVBvcnRhbE91dGxldCBpbXBsZW1lbnRzIE9uSW5pdCwgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50O1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBwb3J0YWwgY29tcG9uZW50IGlzIGluaXRpYWxpemVkLiAqL1xuICBwcml2YXRlIF9pc0luaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgY3VycmVudGx5LWF0dGFjaGVkIGNvbXBvbmVudC92aWV3IHJlZi4gKi9cbiAgcHJpdmF0ZSBfYXR0YWNoZWRSZWY6IENka1BvcnRhbE91dGxldEF0dGFjaGVkUmVmO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBfY29tcG9uZW50RmFjdG9yeVJlc29sdmVyOiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsXG4gICAgICBwcml2YXRlIF92aWV3Q29udGFpbmVyUmVmOiBWaWV3Q29udGFpbmVyUmVmLFxuXG4gICAgICAvKipcbiAgICAgICAqIEBkZXByZWNhdGVkIGBfZG9jdW1lbnRgIHBhcmFtZXRlciB0byBiZSBtYWRlIHJlcXVpcmVkLlxuICAgICAgICogQGJyZWFraW5nLWNoYW5nZSA5LjAuMFxuICAgICAgICovXG4gICAgICBASW5qZWN0KERPQ1VNRU5UKSBfZG9jdW1lbnQ/OiBhbnkpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX2RvY3VtZW50ID0gX2RvY3VtZW50O1xuICB9XG5cbiAgLyoqIFBvcnRhbCBhc3NvY2lhdGVkIHdpdGggdGhlIFBvcnRhbCBvdXRsZXQuICovXG4gIGdldCBwb3J0YWwoKTogUG9ydGFsPGFueT4gfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fYXR0YWNoZWRQb3J0YWw7XG4gIH1cblxuICBzZXQgcG9ydGFsKHBvcnRhbDogUG9ydGFsPGFueT4gfCBudWxsKSB7XG4gICAgLy8gSWdub3JlIHRoZSBjYXNlcyB3aGVyZSB0aGUgYHBvcnRhbGAgaXMgc2V0IHRvIGEgZmFsc3kgdmFsdWUgYmVmb3JlIHRoZSBsaWZlY3ljbGUgaG9va3MgaGF2ZVxuICAgIC8vIHJ1bi4gVGhpcyBoYW5kbGVzIHRoZSBjYXNlcyB3aGVyZSB0aGUgdXNlciBtaWdodCBkbyBzb21ldGhpbmcgbGlrZSBgPGRpdiBjZGtQb3J0YWxPdXRsZXQ+YFxuICAgIC8vIGFuZCBhdHRhY2ggYSBwb3J0YWwgcHJvZ3JhbW1hdGljYWxseSBpbiB0aGUgcGFyZW50IGNvbXBvbmVudC4gV2hlbiBBbmd1bGFyIGRvZXMgdGhlIGZpcnN0IENEXG4gICAgLy8gcm91bmQsIGl0IHdpbGwgZmlyZSB0aGUgc2V0dGVyIHdpdGggZW1wdHkgc3RyaW5nLCBjYXVzaW5nIHRoZSB1c2VyJ3MgY29udGVudCB0byBiZSBjbGVhcmVkLlxuICAgIGlmICh0aGlzLmhhc0F0dGFjaGVkKCkgJiYgIXBvcnRhbCAmJiAhdGhpcy5faXNJbml0aWFsaXplZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhc0F0dGFjaGVkKCkpIHtcbiAgICAgIHN1cGVyLmRldGFjaCgpO1xuICAgIH1cblxuICAgIGlmIChwb3J0YWwpIHtcbiAgICAgIHN1cGVyLmF0dGFjaChwb3J0YWwpO1xuICAgIH1cblxuICAgIHRoaXMuX2F0dGFjaGVkUG9ydGFsID0gcG9ydGFsO1xuICB9XG5cbiAgLyoqIEVtaXRzIHdoZW4gYSBwb3J0YWwgaXMgYXR0YWNoZWQgdG8gdGhlIG91dGxldC4gKi9cbiAgQE91dHB1dCgpIGF0dGFjaGVkOiBFdmVudEVtaXR0ZXI8Q2RrUG9ydGFsT3V0bGV0QXR0YWNoZWRSZWY+ID1cbiAgICAgIG5ldyBFdmVudEVtaXR0ZXI8Q2RrUG9ydGFsT3V0bGV0QXR0YWNoZWRSZWY+KCk7XG5cbiAgLyoqIENvbXBvbmVudCBvciB2aWV3IHJlZmVyZW5jZSB0aGF0IGlzIGF0dGFjaGVkIHRvIHRoZSBwb3J0YWwuICovXG4gIGdldCBhdHRhY2hlZFJlZigpOiBDZGtQb3J0YWxPdXRsZXRBdHRhY2hlZFJlZiB7XG4gICAgcmV0dXJuIHRoaXMuX2F0dGFjaGVkUmVmO1xuICB9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgdGhpcy5faXNJbml0aWFsaXplZCA9IHRydWU7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBzdXBlci5kaXNwb3NlKCk7XG4gICAgdGhpcy5fYXR0YWNoZWRQb3J0YWwgPSBudWxsO1xuICAgIHRoaXMuX2F0dGFjaGVkUmVmID0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRhY2ggdGhlIGdpdmVuIENvbXBvbmVudFBvcnRhbCB0byB0aGlzIFBvcnRhbE91dGxldCB1c2luZyB0aGUgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLlxuICAgKlxuICAgKiBAcGFyYW0gcG9ydGFsIFBvcnRhbCB0byBiZSBhdHRhY2hlZCB0byB0aGUgcG9ydGFsIG91dGxldC5cbiAgICogQHJldHVybnMgUmVmZXJlbmNlIHRvIHRoZSBjcmVhdGVkIGNvbXBvbmVudC5cbiAgICovXG4gIGF0dGFjaENvbXBvbmVudFBvcnRhbDxUPihwb3J0YWw6IENvbXBvbmVudFBvcnRhbDxUPik6IENvbXBvbmVudFJlZjxUPiB7XG4gICAgcG9ydGFsLnNldEF0dGFjaGVkSG9zdCh0aGlzKTtcblxuICAgIC8vIElmIHRoZSBwb3J0YWwgc3BlY2lmaWVzIGFuIG9yaWdpbiwgdXNlIHRoYXQgYXMgdGhlIGxvZ2ljYWwgbG9jYXRpb24gb2YgdGhlIGNvbXBvbmVudFxuICAgIC8vIGluIHRoZSBhcHBsaWNhdGlvbiB0cmVlLiBPdGhlcndpc2UgdXNlIHRoZSBsb2NhdGlvbiBvZiB0aGlzIFBvcnRhbE91dGxldC5cbiAgICBjb25zdCB2aWV3Q29udGFpbmVyUmVmID0gcG9ydGFsLnZpZXdDb250YWluZXJSZWYgIT0gbnVsbCA/XG4gICAgICAgIHBvcnRhbC52aWV3Q29udGFpbmVyUmVmIDpcbiAgICAgICAgdGhpcy5fdmlld0NvbnRhaW5lclJlZjtcblxuICAgIGNvbnN0IHJlc29sdmVyID0gcG9ydGFsLmNvbXBvbmVudEZhY3RvcnlSZXNvbHZlciB8fCB0aGlzLl9jb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI7XG4gICAgY29uc3QgY29tcG9uZW50RmFjdG9yeSA9IHJlc29sdmVyLnJlc29sdmVDb21wb25lbnRGYWN0b3J5KHBvcnRhbC5jb21wb25lbnQpO1xuICAgIGNvbnN0IHJlZiA9IHZpZXdDb250YWluZXJSZWYuY3JlYXRlQ29tcG9uZW50KFxuICAgICAgICBjb21wb25lbnRGYWN0b3J5LCB2aWV3Q29udGFpbmVyUmVmLmxlbmd0aCxcbiAgICAgICAgcG9ydGFsLmluamVjdG9yIHx8IHZpZXdDb250YWluZXJSZWYuaW5qZWN0b3IpO1xuXG4gICAgLy8gSWYgd2UncmUgdXNpbmcgYSB2aWV3IGNvbnRhaW5lciB0aGF0J3MgZGlmZmVyZW50IGZyb20gdGhlIGluamVjdGVkIG9uZSAoZS5nLiB3aGVuIHRoZSBwb3J0YWxcbiAgICAvLyBzcGVjaWZpZXMgaXRzIG93bikgd2UgbmVlZCB0byBtb3ZlIHRoZSBjb21wb25lbnQgaW50byB0aGUgb3V0bGV0LCBvdGhlcndpc2UgaXQnbGwgYmUgcmVuZGVyZWRcbiAgICAvLyBpbnNpZGUgb2YgdGhlIGFsdGVybmF0ZSB2aWV3IGNvbnRhaW5lci5cbiAgICBpZiAodmlld0NvbnRhaW5lclJlZiAhPT0gdGhpcy5fdmlld0NvbnRhaW5lclJlZikge1xuICAgICAgdGhpcy5fZ2V0Um9vdE5vZGUoKS5hcHBlbmRDaGlsZCgocmVmLmhvc3RWaWV3IGFzIEVtYmVkZGVkVmlld1JlZjxhbnk+KS5yb290Tm9kZXNbMF0pO1xuICAgIH1cblxuICAgIHN1cGVyLnNldERpc3Bvc2VGbigoKSA9PiByZWYuZGVzdHJveSgpKTtcbiAgICB0aGlzLl9hdHRhY2hlZFBvcnRhbCA9IHBvcnRhbDtcbiAgICB0aGlzLl9hdHRhY2hlZFJlZiA9IHJlZjtcbiAgICB0aGlzLmF0dGFjaGVkLmVtaXQocmVmKTtcblxuICAgIHJldHVybiByZWY7XG4gIH1cblxuICAvKipcbiAgICogQXR0YWNoIHRoZSBnaXZlbiBUZW1wbGF0ZVBvcnRhbCB0byB0aGlzIFBvcnRhbEhvc3QgYXMgYW4gZW1iZWRkZWQgVmlldy5cbiAgICogQHBhcmFtIHBvcnRhbCBQb3J0YWwgdG8gYmUgYXR0YWNoZWQuXG4gICAqIEByZXR1cm5zIFJlZmVyZW5jZSB0byB0aGUgY3JlYXRlZCBlbWJlZGRlZCB2aWV3LlxuICAgKi9cbiAgYXR0YWNoVGVtcGxhdGVQb3J0YWw8Qz4ocG9ydGFsOiBUZW1wbGF0ZVBvcnRhbDxDPik6IEVtYmVkZGVkVmlld1JlZjxDPiB7XG4gICAgcG9ydGFsLnNldEF0dGFjaGVkSG9zdCh0aGlzKTtcbiAgICBjb25zdCB2aWV3UmVmID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5jcmVhdGVFbWJlZGRlZFZpZXcocG9ydGFsLnRlbXBsYXRlUmVmLCBwb3J0YWwuY29udGV4dCk7XG4gICAgc3VwZXIuc2V0RGlzcG9zZUZuKCgpID0+IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuY2xlYXIoKSk7XG5cbiAgICB0aGlzLl9hdHRhY2hlZFBvcnRhbCA9IHBvcnRhbDtcbiAgICB0aGlzLl9hdHRhY2hlZFJlZiA9IHZpZXdSZWY7XG4gICAgdGhpcy5hdHRhY2hlZC5lbWl0KHZpZXdSZWYpO1xuXG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cblxuICAvKipcbiAgICogQXR0YWNoZXMgdGhlIGdpdmVuIERvbVBvcnRhbCB0byB0aGlzIFBvcnRhbEhvc3QgYnkgbW92aW5nIGFsbCBvZiB0aGUgcG9ydGFsIGNvbnRlbnQgaW50byBpdC5cbiAgICogQHBhcmFtIHBvcnRhbCBQb3J0YWwgdG8gYmUgYXR0YWNoZWQuXG4gICAqIEBkZXByZWNhdGVkIFRvIGJlIHR1cm5lZCBpbnRvIGEgbWV0aG9kLlxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDEwLjAuMFxuICAgKi9cbiAgYXR0YWNoRG9tUG9ydGFsID0gKHBvcnRhbDogRG9tUG9ydGFsKSA9PiB7XG4gICAgLy8gQGJyZWFraW5nLWNoYW5nZSA5LjAuMCBSZW1vdmUgY2hlY2sgYW5kIGVycm9yIG9uY2UgdGhlXG4gICAgLy8gYF9kb2N1bWVudGAgY29uc3RydWN0b3IgcGFyYW1ldGVyIGlzIHJlcXVpcmVkLlxuICAgIGlmICghdGhpcy5fZG9jdW1lbnQpIHtcbiAgICAgIHRocm93IEVycm9yKCdDYW5ub3QgYXR0YWNoIERPTSBwb3J0YWwgd2l0aG91dCBfZG9jdW1lbnQgY29uc3RydWN0b3IgcGFyYW1ldGVyJyk7XG4gICAgfVxuXG4gICAgLy8gQW5jaG9yIHVzZWQgdG8gc2F2ZSB0aGUgZWxlbWVudCdzIHByZXZpb3VzIHBvc2l0aW9uIHNvXG4gICAgLy8gdGhhdCB3ZSBjYW4gcmVzdG9yZSBpdCB3aGVuIHRoZSBwb3J0YWwgaXMgZGV0YWNoZWQuXG4gICAgY29uc3QgYW5jaG9yTm9kZSA9IHRoaXMuX2RvY3VtZW50LmNyZWF0ZUNvbW1lbnQoJ2RvbS1wb3J0YWwnKTtcbiAgICBjb25zdCBlbGVtZW50ID0gcG9ydGFsLmVsZW1lbnQ7XG5cbiAgICBwb3J0YWwuc2V0QXR0YWNoZWRIb3N0KHRoaXMpO1xuICAgIGVsZW1lbnQucGFyZW50Tm9kZSEuaW5zZXJ0QmVmb3JlKGFuY2hvck5vZGUsIGVsZW1lbnQpO1xuICAgIHRoaXMuX2dldFJvb3ROb2RlKCkuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG5cbiAgICBzdXBlci5zZXREaXNwb3NlRm4oKCkgPT4ge1xuICAgICAgYW5jaG9yTm9kZS5wYXJlbnROb2RlIS5yZXBsYWNlQ2hpbGQoZWxlbWVudCwgYW5jaG9yTm9kZSk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgcm9vdCBub2RlIG9mIHRoZSBwb3J0YWwgb3V0bGV0LiAqL1xuICBwcml2YXRlIF9nZXRSb290Tm9kZSgpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3QgbmF0aXZlRWxlbWVudDogTm9kZSA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuZWxlbWVudC5uYXRpdmVFbGVtZW50O1xuXG4gICAgLy8gVGhlIGRpcmVjdGl2ZSBjb3VsZCBiZSBzZXQgb24gYSB0ZW1wbGF0ZSB3aGljaCB3aWxsIHJlc3VsdCBpbiBhIGNvbW1lbnRcbiAgICAvLyBub2RlIGJlaW5nIHRoZSByb290LiBVc2UgdGhlIGNvbW1lbnQncyBwYXJlbnQgbm9kZSBpZiB0aGF0IGlzIHRoZSBjYXNlLlxuICAgIHJldHVybiAobmF0aXZlRWxlbWVudC5ub2RlVHlwZSA9PT0gbmF0aXZlRWxlbWVudC5FTEVNRU5UX05PREUgP1xuICAgICAgICAgICBuYXRpdmVFbGVtZW50IDogbmF0aXZlRWxlbWVudC5wYXJlbnROb2RlISkgYXMgSFRNTEVsZW1lbnQ7XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfcG9ydGFsOiBQb3J0YWw8YW55PiB8IG51bGwgfCB1bmRlZmluZWQgfCAnJztcbn1cblxuLyoqXG4gKiBAZGVwcmVjYXRlZCBVc2UgYENka1BvcnRhbE91dGxldGAgaW5zdGVhZC5cbiAqIEBicmVha2luZy1jaGFuZ2UgOS4wLjBcbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka1BvcnRhbEhvc3RdLCBbcG9ydGFsSG9zdF0nLFxuICBleHBvcnRBczogJ2Nka1BvcnRhbEhvc3QnLFxuICBpbnB1dHM6IFsncG9ydGFsOiBjZGtQb3J0YWxIb3N0J10sXG4gIHByb3ZpZGVyczogW3tcbiAgICBwcm92aWRlOiBDZGtQb3J0YWxPdXRsZXQsXG4gICAgdXNlRXhpc3Rpbmc6IFBvcnRhbEhvc3REaXJlY3RpdmVcbiAgfV1cbn0pXG5leHBvcnQgY2xhc3MgUG9ydGFsSG9zdERpcmVjdGl2ZSBleHRlbmRzIENka1BvcnRhbE91dGxldCB7fVxuXG5cbkBOZ01vZHVsZSh7XG4gIGV4cG9ydHM6IFtDZGtQb3J0YWwsIENka1BvcnRhbE91dGxldCwgVGVtcGxhdGVQb3J0YWxEaXJlY3RpdmUsIFBvcnRhbEhvc3REaXJlY3RpdmVdLFxuICBkZWNsYXJhdGlvbnM6IFtDZGtQb3J0YWwsIENka1BvcnRhbE91dGxldCwgVGVtcGxhdGVQb3J0YWxEaXJlY3RpdmUsIFBvcnRhbEhvc3REaXJlY3RpdmVdLFxufSlcbmV4cG9ydCBjbGFzcyBQb3J0YWxNb2R1bGUge31cbiJdfQ==