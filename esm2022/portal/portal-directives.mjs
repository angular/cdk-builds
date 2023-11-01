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
import * as i0 from "@angular/core";
/**
 * Directive version of a `TemplatePortal`. Because the directive *is* a TemplatePortal,
 * the directive instance itself can be attached to a host, enabling declarative use of portals.
 */
export class CdkPortal extends TemplatePortal {
    constructor(templateRef, viewContainerRef) {
        super(templateRef, viewContainerRef);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: CdkPortal, deps: [{ token: i0.TemplateRef }, { token: i0.ViewContainerRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.1.1", type: CdkPortal, selector: "[cdkPortal]", exportAs: ["cdkPortal"], usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: CdkPortal, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkPortal]',
                    exportAs: 'cdkPortal',
                }]
        }], ctorParameters: function () { return [{ type: i0.TemplateRef }, { type: i0.ViewContainerRef }]; } });
/**
 * @deprecated Use `CdkPortal` instead.
 * @breaking-change 9.0.0
 */
export class TemplatePortalDirective extends CdkPortal {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: TemplatePortalDirective, deps: null, target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.1.1", type: TemplatePortalDirective, selector: "[cdk-portal], [portal]", providers: [
            {
                provide: CdkPortal,
                useExisting: TemplatePortalDirective,
            },
        ], exportAs: ["cdkPortal"], usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: TemplatePortalDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdk-portal], [portal]',
                    exportAs: 'cdkPortal',
                    providers: [
                        {
                            provide: CdkPortal,
                            useExisting: TemplatePortalDirective,
                        },
                    ],
                }]
        }] });
/**
 * Directive version of a PortalOutlet. Because the directive *is* a PortalOutlet, portals can be
 * directly attached to it, enabling declarative use.
 *
 * Usage:
 * `<ng-template [cdkPortalOutlet]="greeting"></ng-template>`
 */
export class CdkPortalOutlet extends BasePortalOutlet {
    constructor(_componentFactoryResolver, _viewContainerRef, 
    /**
     * @deprecated `_document` parameter to be made required.
     * @breaking-change 9.0.0
     */
    _document) {
        super();
        this._componentFactoryResolver = _componentFactoryResolver;
        this._viewContainerRef = _viewContainerRef;
        /** Whether the portal component is initialized. */
        this._isInitialized = false;
        /** Emits when a portal is attached to the outlet. */
        this.attached = new EventEmitter();
        /**
         * Attaches the given DomPortal to this PortalHost by moving all of the portal content into it.
         * @param portal Portal to be attached.
         * @deprecated To be turned into a method.
         * @breaking-change 10.0.0
         */
        this.attachDomPortal = (portal) => {
            // @breaking-change 9.0.0 Remove check and error once the
            // `_document` constructor parameter is required.
            if (!this._document && (typeof ngDevMode === 'undefined' || ngDevMode)) {
                throw Error('Cannot attach DOM portal without _document constructor parameter');
            }
            const element = portal.element;
            if (!element.parentNode && (typeof ngDevMode === 'undefined' || ngDevMode)) {
                throw Error('DOM portal content must be attached to a parent node.');
            }
            // Anchor used to save the element's previous position so
            // that we can restore it when the portal is detached.
            const anchorNode = this._document.createComment('dom-portal');
            portal.setAttachedHost(this);
            element.parentNode.insertBefore(anchorNode, element);
            this._getRootNode().appendChild(element);
            this._attachedPortal = portal;
            super.setDisposeFn(() => {
                if (anchorNode.parentNode) {
                    anchorNode.parentNode.replaceChild(element, anchorNode);
                }
            });
        };
        this._document = _document;
    }
    /** Portal associated with the Portal outlet. */
    get portal() {
        return this._attachedPortal;
    }
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
        this._attachedPortal = portal || null;
    }
    /** Component or view reference that is attached to the portal. */
    get attachedRef() {
        return this._attachedRef;
    }
    ngOnInit() {
        this._isInitialized = true;
    }
    ngOnDestroy() {
        super.dispose();
        this._attachedRef = this._attachedPortal = null;
    }
    /**
     * Attach the given ComponentPortal to this PortalOutlet using the ComponentFactoryResolver.
     *
     * @param portal Portal to be attached to the portal outlet.
     * @returns Reference to the created component.
     */
    attachComponentPortal(portal) {
        portal.setAttachedHost(this);
        // If the portal specifies an origin, use that as the logical location of the component
        // in the application tree. Otherwise use the location of this PortalOutlet.
        const viewContainerRef = portal.viewContainerRef != null ? portal.viewContainerRef : this._viewContainerRef;
        const resolver = portal.componentFactoryResolver || this._componentFactoryResolver;
        const componentFactory = resolver.resolveComponentFactory(portal.component);
        const ref = viewContainerRef.createComponent(componentFactory, viewContainerRef.length, portal.injector || viewContainerRef.injector, portal.projectableNodes || undefined);
        // If we're using a view container that's different from the injected one (e.g. when the portal
        // specifies its own) we need to move the component into the outlet, otherwise it'll be rendered
        // inside of the alternate view container.
        if (viewContainerRef !== this._viewContainerRef) {
            this._getRootNode().appendChild(ref.hostView.rootNodes[0]);
        }
        super.setDisposeFn(() => ref.destroy());
        this._attachedPortal = portal;
        this._attachedRef = ref;
        this.attached.emit(ref);
        return ref;
    }
    /**
     * Attach the given TemplatePortal to this PortalHost as an embedded View.
     * @param portal Portal to be attached.
     * @returns Reference to the created embedded view.
     */
    attachTemplatePortal(portal) {
        portal.setAttachedHost(this);
        const viewRef = this._viewContainerRef.createEmbeddedView(portal.templateRef, portal.context, {
            injector: portal.injector,
        });
        super.setDisposeFn(() => this._viewContainerRef.clear());
        this._attachedPortal = portal;
        this._attachedRef = viewRef;
        this.attached.emit(viewRef);
        return viewRef;
    }
    /** Gets the root node of the portal outlet. */
    _getRootNode() {
        const nativeElement = this._viewContainerRef.element.nativeElement;
        // The directive could be set on a template which will result in a comment
        // node being the root. Use the comment's parent node if that is the case.
        return (nativeElement.nodeType === nativeElement.ELEMENT_NODE
            ? nativeElement
            : nativeElement.parentNode);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: CdkPortalOutlet, deps: [{ token: i0.ComponentFactoryResolver }, { token: i0.ViewContainerRef }, { token: DOCUMENT }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.1.1", type: CdkPortalOutlet, selector: "[cdkPortalOutlet]", inputs: { portal: ["cdkPortalOutlet", "portal"] }, outputs: { attached: "attached" }, exportAs: ["cdkPortalOutlet"], usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: CdkPortalOutlet, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkPortalOutlet]',
                    exportAs: 'cdkPortalOutlet',
                    inputs: ['portal: cdkPortalOutlet'],
                }]
        }], ctorParameters: function () { return [{ type: i0.ComponentFactoryResolver }, { type: i0.ViewContainerRef }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }]; }, propDecorators: { attached: [{
                type: Output
            }] } });
/**
 * @deprecated Use `CdkPortalOutlet` instead.
 * @breaking-change 9.0.0
 */
export class PortalHostDirective extends CdkPortalOutlet {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: PortalHostDirective, deps: null, target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.1.1", type: PortalHostDirective, selector: "[cdkPortalHost], [portalHost]", inputs: { portal: ["cdkPortalHost", "portal"] }, providers: [
            {
                provide: CdkPortalOutlet,
                useExisting: PortalHostDirective,
            },
        ], exportAs: ["cdkPortalHost"], usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: PortalHostDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkPortalHost], [portalHost]',
                    exportAs: 'cdkPortalHost',
                    inputs: ['portal: cdkPortalHost'],
                    providers: [
                        {
                            provide: CdkPortalOutlet,
                            useExisting: PortalHostDirective,
                        },
                    ],
                }]
        }] });
export class PortalModule {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: PortalModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule }); }
    static { this.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "16.1.1", ngImport: i0, type: PortalModule, declarations: [CdkPortal, CdkPortalOutlet, TemplatePortalDirective, PortalHostDirective], exports: [CdkPortal, CdkPortalOutlet, TemplatePortalDirective, PortalHostDirective] }); }
    static { this.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: PortalModule }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: PortalModule, decorators: [{
            type: NgModule,
            args: [{
                    exports: [CdkPortal, CdkPortalOutlet, TemplatePortalDirective, PortalHostDirective],
                    declarations: [CdkPortal, CdkPortalOutlet, TemplatePortalDirective, PortalHostDirective],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9ydGFsLWRpcmVjdGl2ZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3BvcnRhbC9wb3J0YWwtZGlyZWN0aXZlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsd0JBQXdCLEVBRXhCLFNBQVMsRUFFVCxZQUFZLEVBQ1osUUFBUSxFQUdSLE1BQU0sRUFDTixXQUFXLEVBQ1gsZ0JBQWdCLEVBQ2hCLE1BQU0sR0FDUCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUFDLGdCQUFnQixFQUEyQixjQUFjLEVBQVksTUFBTSxVQUFVLENBQUM7O0FBRTlGOzs7R0FHRztBQUtILE1BQU0sT0FBTyxTQUFVLFNBQVEsY0FBYztJQUMzQyxZQUFZLFdBQTZCLEVBQUUsZ0JBQWtDO1FBQzNFLEtBQUssQ0FBQyxXQUFXLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztJQUN2QyxDQUFDOzhHQUhVLFNBQVM7a0dBQVQsU0FBUzs7MkZBQVQsU0FBUztrQkFKckIsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUsYUFBYTtvQkFDdkIsUUFBUSxFQUFFLFdBQVc7aUJBQ3RCOztBQU9EOzs7R0FHRztBQVdILE1BQU0sT0FBTyx1QkFBd0IsU0FBUSxTQUFTOzhHQUF6Qyx1QkFBdUI7a0dBQXZCLHVCQUF1QixpREFQdkI7WUFDVDtnQkFDRSxPQUFPLEVBQUUsU0FBUztnQkFDbEIsV0FBVyxFQUFFLHVCQUF1QjthQUNyQztTQUNGOzsyRkFFVSx1QkFBdUI7a0JBVm5DLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLHdCQUF3QjtvQkFDbEMsUUFBUSxFQUFFLFdBQVc7b0JBQ3JCLFNBQVMsRUFBRTt3QkFDVDs0QkFDRSxPQUFPLEVBQUUsU0FBUzs0QkFDbEIsV0FBVyx5QkFBeUI7eUJBQ3JDO3FCQUNGO2lCQUNGOztBQVFEOzs7Ozs7R0FNRztBQU1ILE1BQU0sT0FBTyxlQUFnQixTQUFRLGdCQUFnQjtJQVNuRCxZQUNVLHlCQUFtRCxFQUNuRCxpQkFBbUM7SUFFM0M7OztPQUdHO0lBQ2UsU0FBZTtRQUVqQyxLQUFLLEVBQUUsQ0FBQztRQVRBLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBMEI7UUFDbkQsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFrQjtRQVI3QyxtREFBbUQ7UUFDM0MsbUJBQWMsR0FBRyxLQUFLLENBQUM7UUE0Qy9CLHFEQUFxRDtRQUNsQyxhQUFRLEdBQ3pCLElBQUksWUFBWSxFQUE4QixDQUFDO1FBeUVqRDs7Ozs7V0FLRztRQUNNLG9CQUFlLEdBQUcsQ0FBQyxNQUFpQixFQUFFLEVBQUU7WUFDL0MseURBQXlEO1lBQ3pELGlEQUFpRDtZQUNqRCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLENBQUMsRUFBRTtnQkFDdEUsTUFBTSxLQUFLLENBQUMsa0VBQWtFLENBQUMsQ0FBQzthQUNqRjtZQUVELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUM7WUFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLElBQUksQ0FBQyxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxDQUFDLEVBQUU7Z0JBQzFFLE1BQU0sS0FBSyxDQUFDLHVEQUF1RCxDQUFDLENBQUM7YUFDdEU7WUFFRCx5REFBeUQ7WUFDekQsc0RBQXNEO1lBQ3RELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBRTlELE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDN0IsT0FBTyxDQUFDLFVBQVcsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3RELElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDekMsSUFBSSxDQUFDLGVBQWUsR0FBRyxNQUFNLENBQUM7WUFFOUIsS0FBSyxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUU7Z0JBQ3RCLElBQUksVUFBVSxDQUFDLFVBQVUsRUFBRTtvQkFDekIsVUFBVSxDQUFDLFVBQVcsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2lCQUMxRDtZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDO1FBdklBLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO0lBQzdCLENBQUM7SUFFRCxnREFBZ0Q7SUFDaEQsSUFBSSxNQUFNO1FBQ1IsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDO0lBQzlCLENBQUM7SUFFRCxJQUFJLE1BQU0sQ0FBQyxNQUEyQztRQUNwRCw4RkFBOEY7UUFDOUYsNkZBQTZGO1FBQzdGLCtGQUErRjtRQUMvRiw4RkFBOEY7UUFDOUYsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFO1lBQ3pELE9BQU87U0FDUjtRQUVELElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFO1lBQ3RCLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUNoQjtRQUVELElBQUksTUFBTSxFQUFFO1lBQ1YsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUN0QjtRQUVELElBQUksQ0FBQyxlQUFlLEdBQUcsTUFBTSxJQUFJLElBQUksQ0FBQztJQUN4QyxDQUFDO0lBTUQsa0VBQWtFO0lBQ2xFLElBQUksV0FBVztRQUNiLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztJQUMzQixDQUFDO0lBRUQsUUFBUTtRQUNOLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO0lBQzdCLENBQUM7SUFFRCxXQUFXO1FBQ1QsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2hCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7SUFDbEQsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gscUJBQXFCLENBQUksTUFBMEI7UUFDakQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUU3Qix1RkFBdUY7UUFDdkYsNEVBQTRFO1FBQzVFLE1BQU0sZ0JBQWdCLEdBQ3BCLE1BQU0sQ0FBQyxnQkFBZ0IsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDO1FBRXJGLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyx3QkFBd0IsSUFBSSxJQUFJLENBQUMseUJBQXlCLENBQUM7UUFDbkYsTUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsdUJBQXVCLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzVFLE1BQU0sR0FBRyxHQUFHLGdCQUFnQixDQUFDLGVBQWUsQ0FDMUMsZ0JBQWdCLEVBQ2hCLGdCQUFnQixDQUFDLE1BQU0sRUFDdkIsTUFBTSxDQUFDLFFBQVEsSUFBSSxnQkFBZ0IsQ0FBQyxRQUFRLEVBQzVDLE1BQU0sQ0FBQyxnQkFBZ0IsSUFBSSxTQUFTLENBQ3JDLENBQUM7UUFFRiwrRkFBK0Y7UUFDL0YsZ0dBQWdHO1FBQ2hHLDBDQUEwQztRQUMxQyxJQUFJLGdCQUFnQixLQUFLLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtZQUMvQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsV0FBVyxDQUFFLEdBQUcsQ0FBQyxRQUFpQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3RGO1FBRUQsS0FBSyxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUN4QyxJQUFJLENBQUMsZUFBZSxHQUFHLE1BQU0sQ0FBQztRQUM5QixJQUFJLENBQUMsWUFBWSxHQUFHLEdBQUcsQ0FBQztRQUN4QixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUV4QixPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsb0JBQW9CLENBQUksTUFBeUI7UUFDL0MsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM3QixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsT0FBTyxFQUFFO1lBQzVGLFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUTtTQUMxQixDQUFDLENBQUM7UUFDSCxLQUFLLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBRXpELElBQUksQ0FBQyxlQUFlLEdBQUcsTUFBTSxDQUFDO1FBQzlCLElBQUksQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDO1FBQzVCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRTVCLE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFvQ0QsK0NBQStDO0lBQ3ZDLFlBQVk7UUFDbEIsTUFBTSxhQUFhLEdBQVMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUM7UUFFekUsMEVBQTBFO1FBQzFFLDBFQUEwRTtRQUMxRSxPQUFPLENBQ0wsYUFBYSxDQUFDLFFBQVEsS0FBSyxhQUFhLENBQUMsWUFBWTtZQUNuRCxDQUFDLENBQUMsYUFBYTtZQUNmLENBQUMsQ0FBQyxhQUFhLENBQUMsVUFBVyxDQUNmLENBQUM7SUFDbkIsQ0FBQzs4R0F4S1UsZUFBZSwwRkFpQmhCLFFBQVE7a0dBakJQLGVBQWU7OzJGQUFmLGVBQWU7a0JBTDNCLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLG1CQUFtQjtvQkFDN0IsUUFBUSxFQUFFLGlCQUFpQjtvQkFDM0IsTUFBTSxFQUFFLENBQUMseUJBQXlCLENBQUM7aUJBQ3BDOzswQkFrQkksTUFBTTsyQkFBQyxRQUFROzRDQWdDQyxRQUFRO3NCQUExQixNQUFNOztBQTBIVDs7O0dBR0c7QUFZSCxNQUFNLE9BQU8sbUJBQW9CLFNBQVEsZUFBZTs4R0FBM0MsbUJBQW1CO2tHQUFuQixtQkFBbUIseUdBUG5CO1lBQ1Q7Z0JBQ0UsT0FBTyxFQUFFLGVBQWU7Z0JBQ3hCLFdBQVcsRUFBRSxtQkFBbUI7YUFDakM7U0FDRjs7MkZBRVUsbUJBQW1CO2tCQVgvQixTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSwrQkFBK0I7b0JBQ3pDLFFBQVEsRUFBRSxlQUFlO29CQUN6QixNQUFNLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQztvQkFDakMsU0FBUyxFQUFFO3dCQUNUOzRCQUNFLE9BQU8sRUFBRSxlQUFlOzRCQUN4QixXQUFXLHFCQUFxQjt5QkFDakM7cUJBQ0Y7aUJBQ0Y7O0FBT0QsTUFBTSxPQUFPLFlBQVk7OEdBQVosWUFBWTsrR0FBWixZQUFZLGlCQXZPWixTQUFTLEVBdUNULGVBQWUsRUFuQmYsdUJBQXVCLEVBNk12QixtQkFBbUIsYUFqT25CLFNBQVMsRUF1Q1QsZUFBZSxFQW5CZix1QkFBdUIsRUE2TXZCLG1CQUFtQjsrR0FNbkIsWUFBWTs7MkZBQVosWUFBWTtrQkFKeEIsUUFBUTttQkFBQztvQkFDUixPQUFPLEVBQUUsQ0FBQyxTQUFTLEVBQUUsZUFBZSxFQUFFLHVCQUF1QixFQUFFLG1CQUFtQixDQUFDO29CQUNuRixZQUFZLEVBQUUsQ0FBQyxTQUFTLEVBQUUsZUFBZSxFQUFFLHVCQUF1QixFQUFFLG1CQUFtQixDQUFDO2lCQUN6RiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsXG4gIENvbXBvbmVudFJlZixcbiAgRGlyZWN0aXZlLFxuICBFbWJlZGRlZFZpZXdSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgTmdNb2R1bGUsXG4gIE9uRGVzdHJveSxcbiAgT25Jbml0LFxuICBPdXRwdXQsXG4gIFRlbXBsYXRlUmVmLFxuICBWaWV3Q29udGFpbmVyUmVmLFxuICBJbmplY3QsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7QmFzZVBvcnRhbE91dGxldCwgQ29tcG9uZW50UG9ydGFsLCBQb3J0YWwsIFRlbXBsYXRlUG9ydGFsLCBEb21Qb3J0YWx9IGZyb20gJy4vcG9ydGFsJztcblxuLyoqXG4gKiBEaXJlY3RpdmUgdmVyc2lvbiBvZiBhIGBUZW1wbGF0ZVBvcnRhbGAuIEJlY2F1c2UgdGhlIGRpcmVjdGl2ZSAqaXMqIGEgVGVtcGxhdGVQb3J0YWwsXG4gKiB0aGUgZGlyZWN0aXZlIGluc3RhbmNlIGl0c2VsZiBjYW4gYmUgYXR0YWNoZWQgdG8gYSBob3N0LCBlbmFibGluZyBkZWNsYXJhdGl2ZSB1c2Ugb2YgcG9ydGFscy5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka1BvcnRhbF0nLFxuICBleHBvcnRBczogJ2Nka1BvcnRhbCcsXG59KVxuZXhwb3J0IGNsYXNzIENka1BvcnRhbCBleHRlbmRzIFRlbXBsYXRlUG9ydGFsIHtcbiAgY29uc3RydWN0b3IodGVtcGxhdGVSZWY6IFRlbXBsYXRlUmVmPGFueT4sIHZpZXdDb250YWluZXJSZWY6IFZpZXdDb250YWluZXJSZWYpIHtcbiAgICBzdXBlcih0ZW1wbGF0ZVJlZiwgdmlld0NvbnRhaW5lclJlZik7XG4gIH1cbn1cblxuLyoqXG4gKiBAZGVwcmVjYXRlZCBVc2UgYENka1BvcnRhbGAgaW5zdGVhZC5cbiAqIEBicmVha2luZy1jaGFuZ2UgOS4wLjBcbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nkay1wb3J0YWxdLCBbcG9ydGFsXScsXG4gIGV4cG9ydEFzOiAnY2RrUG9ydGFsJyxcbiAgcHJvdmlkZXJzOiBbXG4gICAge1xuICAgICAgcHJvdmlkZTogQ2RrUG9ydGFsLFxuICAgICAgdXNlRXhpc3Rpbmc6IFRlbXBsYXRlUG9ydGFsRGlyZWN0aXZlLFxuICAgIH0sXG4gIF0sXG59KVxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlUG9ydGFsRGlyZWN0aXZlIGV4dGVuZHMgQ2RrUG9ydGFsIHt9XG5cbi8qKlxuICogUG9zc2libGUgYXR0YWNoZWQgcmVmZXJlbmNlcyB0byB0aGUgQ2RrUG9ydGFsT3V0bGV0LlxuICovXG5leHBvcnQgdHlwZSBDZGtQb3J0YWxPdXRsZXRBdHRhY2hlZFJlZiA9IENvbXBvbmVudFJlZjxhbnk+IHwgRW1iZWRkZWRWaWV3UmVmPGFueT4gfCBudWxsO1xuXG4vKipcbiAqIERpcmVjdGl2ZSB2ZXJzaW9uIG9mIGEgUG9ydGFsT3V0bGV0LiBCZWNhdXNlIHRoZSBkaXJlY3RpdmUgKmlzKiBhIFBvcnRhbE91dGxldCwgcG9ydGFscyBjYW4gYmVcbiAqIGRpcmVjdGx5IGF0dGFjaGVkIHRvIGl0LCBlbmFibGluZyBkZWNsYXJhdGl2ZSB1c2UuXG4gKlxuICogVXNhZ2U6XG4gKiBgPG5nLXRlbXBsYXRlIFtjZGtQb3J0YWxPdXRsZXRdPVwiZ3JlZXRpbmdcIj48L25nLXRlbXBsYXRlPmBcbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka1BvcnRhbE91dGxldF0nLFxuICBleHBvcnRBczogJ2Nka1BvcnRhbE91dGxldCcsXG4gIGlucHV0czogWydwb3J0YWw6IGNka1BvcnRhbE91dGxldCddLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtQb3J0YWxPdXRsZXQgZXh0ZW5kcyBCYXNlUG9ydGFsT3V0bGV0IGltcGxlbWVudHMgT25Jbml0LCBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQ7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHBvcnRhbCBjb21wb25lbnQgaXMgaW5pdGlhbGl6ZWQuICovXG4gIHByaXZhdGUgX2lzSW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50bHktYXR0YWNoZWQgY29tcG9uZW50L3ZpZXcgcmVmLiAqL1xuICBwcml2YXRlIF9hdHRhY2hlZFJlZjogQ2RrUG9ydGFsT3V0bGV0QXR0YWNoZWRSZWY7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfY29tcG9uZW50RmFjdG9yeVJlc29sdmVyOiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsXG4gICAgcHJpdmF0ZSBfdmlld0NvbnRhaW5lclJlZjogVmlld0NvbnRhaW5lclJlZixcblxuICAgIC8qKlxuICAgICAqIEBkZXByZWNhdGVkIGBfZG9jdW1lbnRgIHBhcmFtZXRlciB0byBiZSBtYWRlIHJlcXVpcmVkLlxuICAgICAqIEBicmVha2luZy1jaGFuZ2UgOS4wLjBcbiAgICAgKi9cbiAgICBASW5qZWN0KERPQ1VNRU5UKSBfZG9jdW1lbnQ/OiBhbnksXG4gICkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fZG9jdW1lbnQgPSBfZG9jdW1lbnQ7XG4gIH1cblxuICAvKiogUG9ydGFsIGFzc29jaWF0ZWQgd2l0aCB0aGUgUG9ydGFsIG91dGxldC4gKi9cbiAgZ2V0IHBvcnRhbCgpOiBQb3J0YWw8YW55PiB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLl9hdHRhY2hlZFBvcnRhbDtcbiAgfVxuXG4gIHNldCBwb3J0YWwocG9ydGFsOiBQb3J0YWw8YW55PiB8IG51bGwgfCB1bmRlZmluZWQgfCAnJykge1xuICAgIC8vIElnbm9yZSB0aGUgY2FzZXMgd2hlcmUgdGhlIGBwb3J0YWxgIGlzIHNldCB0byBhIGZhbHN5IHZhbHVlIGJlZm9yZSB0aGUgbGlmZWN5Y2xlIGhvb2tzIGhhdmVcbiAgICAvLyBydW4uIFRoaXMgaGFuZGxlcyB0aGUgY2FzZXMgd2hlcmUgdGhlIHVzZXIgbWlnaHQgZG8gc29tZXRoaW5nIGxpa2UgYDxkaXYgY2RrUG9ydGFsT3V0bGV0PmBcbiAgICAvLyBhbmQgYXR0YWNoIGEgcG9ydGFsIHByb2dyYW1tYXRpY2FsbHkgaW4gdGhlIHBhcmVudCBjb21wb25lbnQuIFdoZW4gQW5ndWxhciBkb2VzIHRoZSBmaXJzdCBDRFxuICAgIC8vIHJvdW5kLCBpdCB3aWxsIGZpcmUgdGhlIHNldHRlciB3aXRoIGVtcHR5IHN0cmluZywgY2F1c2luZyB0aGUgdXNlcidzIGNvbnRlbnQgdG8gYmUgY2xlYXJlZC5cbiAgICBpZiAodGhpcy5oYXNBdHRhY2hlZCgpICYmICFwb3J0YWwgJiYgIXRoaXMuX2lzSW5pdGlhbGl6ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oYXNBdHRhY2hlZCgpKSB7XG4gICAgICBzdXBlci5kZXRhY2goKTtcbiAgICB9XG5cbiAgICBpZiAocG9ydGFsKSB7XG4gICAgICBzdXBlci5hdHRhY2gocG9ydGFsKTtcbiAgICB9XG5cbiAgICB0aGlzLl9hdHRhY2hlZFBvcnRhbCA9IHBvcnRhbCB8fCBudWxsO1xuICB9XG5cbiAgLyoqIEVtaXRzIHdoZW4gYSBwb3J0YWwgaXMgYXR0YWNoZWQgdG8gdGhlIG91dGxldC4gKi9cbiAgQE91dHB1dCgpIHJlYWRvbmx5IGF0dGFjaGVkOiBFdmVudEVtaXR0ZXI8Q2RrUG9ydGFsT3V0bGV0QXR0YWNoZWRSZWY+ID1cbiAgICBuZXcgRXZlbnRFbWl0dGVyPENka1BvcnRhbE91dGxldEF0dGFjaGVkUmVmPigpO1xuXG4gIC8qKiBDb21wb25lbnQgb3IgdmlldyByZWZlcmVuY2UgdGhhdCBpcyBhdHRhY2hlZCB0byB0aGUgcG9ydGFsLiAqL1xuICBnZXQgYXR0YWNoZWRSZWYoKTogQ2RrUG9ydGFsT3V0bGV0QXR0YWNoZWRSZWYge1xuICAgIHJldHVybiB0aGlzLl9hdHRhY2hlZFJlZjtcbiAgfVxuXG4gIG5nT25Jbml0KCkge1xuICAgIHRoaXMuX2lzSW5pdGlhbGl6ZWQgPSB0cnVlO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgc3VwZXIuZGlzcG9zZSgpO1xuICAgIHRoaXMuX2F0dGFjaGVkUmVmID0gdGhpcy5fYXR0YWNoZWRQb3J0YWwgPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGFjaCB0aGUgZ2l2ZW4gQ29tcG9uZW50UG9ydGFsIHRvIHRoaXMgUG9ydGFsT3V0bGV0IHVzaW5nIHRoZSBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIuXG4gICAqXG4gICAqIEBwYXJhbSBwb3J0YWwgUG9ydGFsIHRvIGJlIGF0dGFjaGVkIHRvIHRoZSBwb3J0YWwgb3V0bGV0LlxuICAgKiBAcmV0dXJucyBSZWZlcmVuY2UgdG8gdGhlIGNyZWF0ZWQgY29tcG9uZW50LlxuICAgKi9cbiAgYXR0YWNoQ29tcG9uZW50UG9ydGFsPFQ+KHBvcnRhbDogQ29tcG9uZW50UG9ydGFsPFQ+KTogQ29tcG9uZW50UmVmPFQ+IHtcbiAgICBwb3J0YWwuc2V0QXR0YWNoZWRIb3N0KHRoaXMpO1xuXG4gICAgLy8gSWYgdGhlIHBvcnRhbCBzcGVjaWZpZXMgYW4gb3JpZ2luLCB1c2UgdGhhdCBhcyB0aGUgbG9naWNhbCBsb2NhdGlvbiBvZiB0aGUgY29tcG9uZW50XG4gICAgLy8gaW4gdGhlIGFwcGxpY2F0aW9uIHRyZWUuIE90aGVyd2lzZSB1c2UgdGhlIGxvY2F0aW9uIG9mIHRoaXMgUG9ydGFsT3V0bGV0LlxuICAgIGNvbnN0IHZpZXdDb250YWluZXJSZWYgPVxuICAgICAgcG9ydGFsLnZpZXdDb250YWluZXJSZWYgIT0gbnVsbCA/IHBvcnRhbC52aWV3Q29udGFpbmVyUmVmIDogdGhpcy5fdmlld0NvbnRhaW5lclJlZjtcblxuICAgIGNvbnN0IHJlc29sdmVyID0gcG9ydGFsLmNvbXBvbmVudEZhY3RvcnlSZXNvbHZlciB8fCB0aGlzLl9jb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI7XG4gICAgY29uc3QgY29tcG9uZW50RmFjdG9yeSA9IHJlc29sdmVyLnJlc29sdmVDb21wb25lbnRGYWN0b3J5KHBvcnRhbC5jb21wb25lbnQpO1xuICAgIGNvbnN0IHJlZiA9IHZpZXdDb250YWluZXJSZWYuY3JlYXRlQ29tcG9uZW50KFxuICAgICAgY29tcG9uZW50RmFjdG9yeSxcbiAgICAgIHZpZXdDb250YWluZXJSZWYubGVuZ3RoLFxuICAgICAgcG9ydGFsLmluamVjdG9yIHx8IHZpZXdDb250YWluZXJSZWYuaW5qZWN0b3IsXG4gICAgICBwb3J0YWwucHJvamVjdGFibGVOb2RlcyB8fCB1bmRlZmluZWQsXG4gICAgKTtcblxuICAgIC8vIElmIHdlJ3JlIHVzaW5nIGEgdmlldyBjb250YWluZXIgdGhhdCdzIGRpZmZlcmVudCBmcm9tIHRoZSBpbmplY3RlZCBvbmUgKGUuZy4gd2hlbiB0aGUgcG9ydGFsXG4gICAgLy8gc3BlY2lmaWVzIGl0cyBvd24pIHdlIG5lZWQgdG8gbW92ZSB0aGUgY29tcG9uZW50IGludG8gdGhlIG91dGxldCwgb3RoZXJ3aXNlIGl0J2xsIGJlIHJlbmRlcmVkXG4gICAgLy8gaW5zaWRlIG9mIHRoZSBhbHRlcm5hdGUgdmlldyBjb250YWluZXIuXG4gICAgaWYgKHZpZXdDb250YWluZXJSZWYgIT09IHRoaXMuX3ZpZXdDb250YWluZXJSZWYpIHtcbiAgICAgIHRoaXMuX2dldFJvb3ROb2RlKCkuYXBwZW5kQ2hpbGQoKHJlZi5ob3N0VmlldyBhcyBFbWJlZGRlZFZpZXdSZWY8YW55Pikucm9vdE5vZGVzWzBdKTtcbiAgICB9XG5cbiAgICBzdXBlci5zZXREaXNwb3NlRm4oKCkgPT4gcmVmLmRlc3Ryb3koKSk7XG4gICAgdGhpcy5fYXR0YWNoZWRQb3J0YWwgPSBwb3J0YWw7XG4gICAgdGhpcy5fYXR0YWNoZWRSZWYgPSByZWY7XG4gICAgdGhpcy5hdHRhY2hlZC5lbWl0KHJlZik7XG5cbiAgICByZXR1cm4gcmVmO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGFjaCB0aGUgZ2l2ZW4gVGVtcGxhdGVQb3J0YWwgdG8gdGhpcyBQb3J0YWxIb3N0IGFzIGFuIGVtYmVkZGVkIFZpZXcuXG4gICAqIEBwYXJhbSBwb3J0YWwgUG9ydGFsIHRvIGJlIGF0dGFjaGVkLlxuICAgKiBAcmV0dXJucyBSZWZlcmVuY2UgdG8gdGhlIGNyZWF0ZWQgZW1iZWRkZWQgdmlldy5cbiAgICovXG4gIGF0dGFjaFRlbXBsYXRlUG9ydGFsPEM+KHBvcnRhbDogVGVtcGxhdGVQb3J0YWw8Qz4pOiBFbWJlZGRlZFZpZXdSZWY8Qz4ge1xuICAgIHBvcnRhbC5zZXRBdHRhY2hlZEhvc3QodGhpcyk7XG4gICAgY29uc3Qgdmlld1JlZiA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuY3JlYXRlRW1iZWRkZWRWaWV3KHBvcnRhbC50ZW1wbGF0ZVJlZiwgcG9ydGFsLmNvbnRleHQsIHtcbiAgICAgIGluamVjdG9yOiBwb3J0YWwuaW5qZWN0b3IsXG4gICAgfSk7XG4gICAgc3VwZXIuc2V0RGlzcG9zZUZuKCgpID0+IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuY2xlYXIoKSk7XG5cbiAgICB0aGlzLl9hdHRhY2hlZFBvcnRhbCA9IHBvcnRhbDtcbiAgICB0aGlzLl9hdHRhY2hlZFJlZiA9IHZpZXdSZWY7XG4gICAgdGhpcy5hdHRhY2hlZC5lbWl0KHZpZXdSZWYpO1xuXG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cblxuICAvKipcbiAgICogQXR0YWNoZXMgdGhlIGdpdmVuIERvbVBvcnRhbCB0byB0aGlzIFBvcnRhbEhvc3QgYnkgbW92aW5nIGFsbCBvZiB0aGUgcG9ydGFsIGNvbnRlbnQgaW50byBpdC5cbiAgICogQHBhcmFtIHBvcnRhbCBQb3J0YWwgdG8gYmUgYXR0YWNoZWQuXG4gICAqIEBkZXByZWNhdGVkIFRvIGJlIHR1cm5lZCBpbnRvIGEgbWV0aG9kLlxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDEwLjAuMFxuICAgKi9cbiAgb3ZlcnJpZGUgYXR0YWNoRG9tUG9ydGFsID0gKHBvcnRhbDogRG9tUG9ydGFsKSA9PiB7XG4gICAgLy8gQGJyZWFraW5nLWNoYW5nZSA5LjAuMCBSZW1vdmUgY2hlY2sgYW5kIGVycm9yIG9uY2UgdGhlXG4gICAgLy8gYF9kb2N1bWVudGAgY29uc3RydWN0b3IgcGFyYW1ldGVyIGlzIHJlcXVpcmVkLlxuICAgIGlmICghdGhpcy5fZG9jdW1lbnQgJiYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgIHRocm93IEVycm9yKCdDYW5ub3QgYXR0YWNoIERPTSBwb3J0YWwgd2l0aG91dCBfZG9jdW1lbnQgY29uc3RydWN0b3IgcGFyYW1ldGVyJyk7XG4gICAgfVxuXG4gICAgY29uc3QgZWxlbWVudCA9IHBvcnRhbC5lbGVtZW50O1xuICAgIGlmICghZWxlbWVudC5wYXJlbnROb2RlICYmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpKSB7XG4gICAgICB0aHJvdyBFcnJvcignRE9NIHBvcnRhbCBjb250ZW50IG11c3QgYmUgYXR0YWNoZWQgdG8gYSBwYXJlbnQgbm9kZS4nKTtcbiAgICB9XG5cbiAgICAvLyBBbmNob3IgdXNlZCB0byBzYXZlIHRoZSBlbGVtZW50J3MgcHJldmlvdXMgcG9zaXRpb24gc29cbiAgICAvLyB0aGF0IHdlIGNhbiByZXN0b3JlIGl0IHdoZW4gdGhlIHBvcnRhbCBpcyBkZXRhY2hlZC5cbiAgICBjb25zdCBhbmNob3JOb2RlID0gdGhpcy5fZG9jdW1lbnQuY3JlYXRlQ29tbWVudCgnZG9tLXBvcnRhbCcpO1xuXG4gICAgcG9ydGFsLnNldEF0dGFjaGVkSG9zdCh0aGlzKTtcbiAgICBlbGVtZW50LnBhcmVudE5vZGUhLmluc2VydEJlZm9yZShhbmNob3JOb2RlLCBlbGVtZW50KTtcbiAgICB0aGlzLl9nZXRSb290Tm9kZSgpLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgIHRoaXMuX2F0dGFjaGVkUG9ydGFsID0gcG9ydGFsO1xuXG4gICAgc3VwZXIuc2V0RGlzcG9zZUZuKCgpID0+IHtcbiAgICAgIGlmIChhbmNob3JOb2RlLnBhcmVudE5vZGUpIHtcbiAgICAgICAgYW5jaG9yTm9kZS5wYXJlbnROb2RlIS5yZXBsYWNlQ2hpbGQoZWxlbWVudCwgYW5jaG9yTm9kZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgLyoqIEdldHMgdGhlIHJvb3Qgbm9kZSBvZiB0aGUgcG9ydGFsIG91dGxldC4gKi9cbiAgcHJpdmF0ZSBfZ2V0Um9vdE5vZGUoKTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQ6IE5vZGUgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmVsZW1lbnQubmF0aXZlRWxlbWVudDtcblxuICAgIC8vIFRoZSBkaXJlY3RpdmUgY291bGQgYmUgc2V0IG9uIGEgdGVtcGxhdGUgd2hpY2ggd2lsbCByZXN1bHQgaW4gYSBjb21tZW50XG4gICAgLy8gbm9kZSBiZWluZyB0aGUgcm9vdC4gVXNlIHRoZSBjb21tZW50J3MgcGFyZW50IG5vZGUgaWYgdGhhdCBpcyB0aGUgY2FzZS5cbiAgICByZXR1cm4gKFxuICAgICAgbmF0aXZlRWxlbWVudC5ub2RlVHlwZSA9PT0gbmF0aXZlRWxlbWVudC5FTEVNRU5UX05PREVcbiAgICAgICAgPyBuYXRpdmVFbGVtZW50XG4gICAgICAgIDogbmF0aXZlRWxlbWVudC5wYXJlbnROb2RlIVxuICAgICkgYXMgSFRNTEVsZW1lbnQ7XG4gIH1cbn1cblxuLyoqXG4gKiBAZGVwcmVjYXRlZCBVc2UgYENka1BvcnRhbE91dGxldGAgaW5zdGVhZC5cbiAqIEBicmVha2luZy1jaGFuZ2UgOS4wLjBcbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka1BvcnRhbEhvc3RdLCBbcG9ydGFsSG9zdF0nLFxuICBleHBvcnRBczogJ2Nka1BvcnRhbEhvc3QnLFxuICBpbnB1dHM6IFsncG9ydGFsOiBjZGtQb3J0YWxIb3N0J10sXG4gIHByb3ZpZGVyczogW1xuICAgIHtcbiAgICAgIHByb3ZpZGU6IENka1BvcnRhbE91dGxldCxcbiAgICAgIHVzZUV4aXN0aW5nOiBQb3J0YWxIb3N0RGlyZWN0aXZlLFxuICAgIH0sXG4gIF0sXG59KVxuZXhwb3J0IGNsYXNzIFBvcnRhbEhvc3REaXJlY3RpdmUgZXh0ZW5kcyBDZGtQb3J0YWxPdXRsZXQge31cblxuQE5nTW9kdWxlKHtcbiAgZXhwb3J0czogW0Nka1BvcnRhbCwgQ2RrUG9ydGFsT3V0bGV0LCBUZW1wbGF0ZVBvcnRhbERpcmVjdGl2ZSwgUG9ydGFsSG9zdERpcmVjdGl2ZV0sXG4gIGRlY2xhcmF0aW9uczogW0Nka1BvcnRhbCwgQ2RrUG9ydGFsT3V0bGV0LCBUZW1wbGF0ZVBvcnRhbERpcmVjdGl2ZSwgUG9ydGFsSG9zdERpcmVjdGl2ZV0sXG59KVxuZXhwb3J0IGNsYXNzIFBvcnRhbE1vZHVsZSB7fVxuIl19