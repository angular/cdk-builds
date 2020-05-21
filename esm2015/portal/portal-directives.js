/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __decorate, __metadata, __param } from "tslib";
import { ComponentFactoryResolver, Directive, EventEmitter, NgModule, Output, TemplateRef, ViewContainerRef, Inject, } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BasePortalOutlet, TemplatePortal } from './portal';
/**
 * Directive version of a `TemplatePortal`. Because the directive *is* a TemplatePortal,
 * the directive instance itself can be attached to a host, enabling declarative use of portals.
 */
let CdkPortal = /** @class */ (() => {
    let CdkPortal = class CdkPortal extends TemplatePortal {
        constructor(templateRef, viewContainerRef) {
            super(templateRef, viewContainerRef);
        }
    };
    CdkPortal = __decorate([
        Directive({
            selector: '[cdkPortal]',
            exportAs: 'cdkPortal',
        }),
        __metadata("design:paramtypes", [TemplateRef, ViewContainerRef])
    ], CdkPortal);
    return CdkPortal;
})();
export { CdkPortal };
/**
 * @deprecated Use `CdkPortal` instead.
 * @breaking-change 9.0.0
 */
let TemplatePortalDirective = /** @class */ (() => {
    var TemplatePortalDirective_1;
    let TemplatePortalDirective = TemplatePortalDirective_1 = class TemplatePortalDirective extends CdkPortal {
    };
    TemplatePortalDirective = TemplatePortalDirective_1 = __decorate([
        Directive({
            selector: '[cdk-portal], [portal]',
            exportAs: 'cdkPortal',
            providers: [{
                    provide: CdkPortal,
                    useExisting: TemplatePortalDirective_1
                }]
        })
    ], TemplatePortalDirective);
    return TemplatePortalDirective;
})();
export { TemplatePortalDirective };
/**
 * Directive version of a PortalOutlet. Because the directive *is* a PortalOutlet, portals can be
 * directly attached to it, enabling declarative use.
 *
 * Usage:
 * `<ng-template [cdkPortalOutlet]="greeting"></ng-template>`
 */
let CdkPortalOutlet = /** @class */ (() => {
    let CdkPortalOutlet = class CdkPortalOutlet extends BasePortalOutlet {
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
                if (!this._document) {
                    throw Error('Cannot attach DOM portal without _document constructor parameter');
                }
                const element = portal.element;
                if (!element.parentNode) {
                    throw Error('DOM portal content must be attached to a parent node.');
                }
                // Anchor used to save the element's previous position so
                // that we can restore it when the portal is detached.
                const anchorNode = this._document.createComment('dom-portal');
                portal.setAttachedHost(this);
                element.parentNode.insertBefore(anchorNode, element);
                this._getRootNode().appendChild(element);
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
            this._attachedPortal = portal;
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
            this._attachedPortal = null;
            this._attachedRef = null;
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
            const viewContainerRef = portal.viewContainerRef != null ?
                portal.viewContainerRef :
                this._viewContainerRef;
            const resolver = portal.componentFactoryResolver || this._componentFactoryResolver;
            const componentFactory = resolver.resolveComponentFactory(portal.component);
            const ref = viewContainerRef.createComponent(componentFactory, viewContainerRef.length, portal.injector || viewContainerRef.injector);
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
            const viewRef = this._viewContainerRef.createEmbeddedView(portal.templateRef, portal.context);
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
            return (nativeElement.nodeType === nativeElement.ELEMENT_NODE ?
                nativeElement : nativeElement.parentNode);
        }
    };
    __decorate([
        Output(),
        __metadata("design:type", EventEmitter)
    ], CdkPortalOutlet.prototype, "attached", void 0);
    CdkPortalOutlet = __decorate([
        Directive({
            selector: '[cdkPortalOutlet]',
            exportAs: 'cdkPortalOutlet',
            inputs: ['portal: cdkPortalOutlet']
        }),
        __param(2, Inject(DOCUMENT)),
        __metadata("design:paramtypes", [ComponentFactoryResolver,
            ViewContainerRef, Object])
    ], CdkPortalOutlet);
    return CdkPortalOutlet;
})();
export { CdkPortalOutlet };
/**
 * @deprecated Use `CdkPortalOutlet` instead.
 * @breaking-change 9.0.0
 */
let PortalHostDirective = /** @class */ (() => {
    var PortalHostDirective_1;
    let PortalHostDirective = PortalHostDirective_1 = class PortalHostDirective extends CdkPortalOutlet {
    };
    PortalHostDirective = PortalHostDirective_1 = __decorate([
        Directive({
            selector: '[cdkPortalHost], [portalHost]',
            exportAs: 'cdkPortalHost',
            inputs: ['portal: cdkPortalHost'],
            providers: [{
                    provide: CdkPortalOutlet,
                    useExisting: PortalHostDirective_1
                }]
        })
    ], PortalHostDirective);
    return PortalHostDirective;
})();
export { PortalHostDirective };
let PortalModule = /** @class */ (() => {
    let PortalModule = class PortalModule {
    };
    PortalModule = __decorate([
        NgModule({
            exports: [CdkPortal, CdkPortalOutlet, TemplatePortalDirective, PortalHostDirective],
            declarations: [CdkPortal, CdkPortalOutlet, TemplatePortalDirective, PortalHostDirective],
        })
    ], PortalModule);
    return PortalModule;
})();
export { PortalModule };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9ydGFsLWRpcmVjdGl2ZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3BvcnRhbC9wb3J0YWwtZGlyZWN0aXZlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUNMLHdCQUF3QixFQUV4QixTQUFTLEVBRVQsWUFBWSxFQUNaLFFBQVEsRUFHUixNQUFNLEVBQ04sV0FBVyxFQUNYLGdCQUFnQixFQUNoQixNQUFNLEdBQ1AsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxnQkFBZ0IsRUFBMkIsY0FBYyxFQUFZLE1BQU0sVUFBVSxDQUFDO0FBRzlGOzs7R0FHRztBQUtIO0lBQUEsSUFBYSxTQUFTLEdBQXRCLE1BQWEsU0FBVSxTQUFRLGNBQWM7UUFDM0MsWUFBWSxXQUE2QixFQUFFLGdCQUFrQztZQUMzRSxLQUFLLENBQUMsV0FBVyxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDdkMsQ0FBQztLQUNGLENBQUE7SUFKWSxTQUFTO1FBSnJCLFNBQVMsQ0FBQztZQUNULFFBQVEsRUFBRSxhQUFhO1lBQ3ZCLFFBQVEsRUFBRSxXQUFXO1NBQ3RCLENBQUM7eUNBRXlCLFdBQVcsRUFBeUIsZ0JBQWdCO09BRGxFLFNBQVMsQ0FJckI7SUFBRCxnQkFBQztLQUFBO1NBSlksU0FBUztBQU10Qjs7O0dBR0c7QUFTSDs7SUFBQSxJQUFhLHVCQUF1QiwrQkFBcEMsTUFBYSx1QkFBd0IsU0FBUSxTQUFTO0tBQUcsQ0FBQTtJQUE1Qyx1QkFBdUI7UUFSbkMsU0FBUyxDQUFDO1lBQ1QsUUFBUSxFQUFFLHdCQUF3QjtZQUNsQyxRQUFRLEVBQUUsV0FBVztZQUNyQixTQUFTLEVBQUUsQ0FBQztvQkFDVixPQUFPLEVBQUUsU0FBUztvQkFDbEIsV0FBVyxFQUFFLHlCQUF1QjtpQkFDckMsQ0FB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QTtTQW5LWSxlQUFlO0FBcUs1Qjs7O0dBR0c7QUFVSDs7SUFBQSxJQUFhLG1CQUFtQiwyQkFBaEMsTUFBYSxtQkFBb0IsU0FBUSxlQUFlO0tBQUcsQ0FBQTtJQUE5QyxtQkFBbUI7UUFUL0IsU0FBUyxDQUFDO1lBQ1QsUUFBUSxFQUFFLCtCQUErQjtZQUN6QyxRQUFRLEVBQUUsZUFBZTtZQUN6QixNQUFNLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQztZQUNqQyxTQUFTLEVBQUUsQ0FBQztvQkFDVixPQUFPLEVBQUUsZUFBZTtvQkFDeEIsV0FBVyxFQUFFLHFCQUFtQjtpQkFDakMsQ0FBQztTQUNILENBQUM7T0FDVyxtQkFBbUIsQ0FBMkI7SUFBRCwwQkFBQztLQUFBO1NBQTlDLG1CQUFtQjtBQU9oQztJQUFBLElBQWEsWUFBWSxHQUF6QixNQUFhLFlBQVk7S0FBRyxDQUFBO0lBQWYsWUFBWTtRQUp4QixRQUFRLENBQUM7WUFDUixPQUFPLEVBQUUsQ0FBQyxTQUFTLEVBQUUsZUFBZSxFQUFFLHVCQUF1QixFQUFFLG1CQUFtQixDQUFDO1lBQ25GLFlBQVksRUFBRSxDQUFDLFNBQVMsRUFBRSxlQUFlLEVBQUUsdUJBQXVCLEVBQUUsbUJBQW1CLENBQUM7U0FDekYsQ0FBQztPQUNXLFlBQVksQ0FBRztJQUFELG1CQUFDO0tBQUE7U0FBZixZQUFZIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcixcbiAgQ29tcG9uZW50UmVmLFxuICBEaXJlY3RpdmUsXG4gIEVtYmVkZGVkVmlld1JlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBOZ01vZHVsZSxcbiAgT25EZXN0cm95LFxuICBPbkluaXQsXG4gIE91dHB1dCxcbiAgVGVtcGxhdGVSZWYsXG4gIFZpZXdDb250YWluZXJSZWYsXG4gIEluamVjdCxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtCYXNlUG9ydGFsT3V0bGV0LCBDb21wb25lbnRQb3J0YWwsIFBvcnRhbCwgVGVtcGxhdGVQb3J0YWwsIERvbVBvcnRhbH0gZnJvbSAnLi9wb3J0YWwnO1xuXG5cbi8qKlxuICogRGlyZWN0aXZlIHZlcnNpb24gb2YgYSBgVGVtcGxhdGVQb3J0YWxgLiBCZWNhdXNlIHRoZSBkaXJlY3RpdmUgKmlzKiBhIFRlbXBsYXRlUG9ydGFsLFxuICogdGhlIGRpcmVjdGl2ZSBpbnN0YW5jZSBpdHNlbGYgY2FuIGJlIGF0dGFjaGVkIHRvIGEgaG9zdCwgZW5hYmxpbmcgZGVjbGFyYXRpdmUgdXNlIG9mIHBvcnRhbHMuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtQb3J0YWxdJyxcbiAgZXhwb3J0QXM6ICdjZGtQb3J0YWwnLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtQb3J0YWwgZXh0ZW5kcyBUZW1wbGF0ZVBvcnRhbCB7XG4gIGNvbnN0cnVjdG9yKHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxhbnk+LCB2aWV3Q29udGFpbmVyUmVmOiBWaWV3Q29udGFpbmVyUmVmKSB7XG4gICAgc3VwZXIodGVtcGxhdGVSZWYsIHZpZXdDb250YWluZXJSZWYpO1xuICB9XG59XG5cbi8qKlxuICogQGRlcHJlY2F0ZWQgVXNlIGBDZGtQb3J0YWxgIGluc3RlYWQuXG4gKiBAYnJlYWtpbmctY2hhbmdlIDkuMC4wXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGstcG9ydGFsXSwgW3BvcnRhbF0nLFxuICBleHBvcnRBczogJ2Nka1BvcnRhbCcsXG4gIHByb3ZpZGVyczogW3tcbiAgICBwcm92aWRlOiBDZGtQb3J0YWwsXG4gICAgdXNlRXhpc3Rpbmc6IFRlbXBsYXRlUG9ydGFsRGlyZWN0aXZlXG4gIH1dXG59KVxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlUG9ydGFsRGlyZWN0aXZlIGV4dGVuZHMgQ2RrUG9ydGFsIHt9XG5cbi8qKlxuICogUG9zc2libGUgYXR0YWNoZWQgcmVmZXJlbmNlcyB0byB0aGUgQ2RrUG9ydGFsT3V0bGV0LlxuICovXG5leHBvcnQgdHlwZSBDZGtQb3J0YWxPdXRsZXRBdHRhY2hlZFJlZiA9IENvbXBvbmVudFJlZjxhbnk+IHwgRW1iZWRkZWRWaWV3UmVmPGFueT4gfCBudWxsO1xuXG5cbi8qKlxuICogRGlyZWN0aXZlIHZlcnNpb24gb2YgYSBQb3J0YWxPdXRsZXQuIEJlY2F1c2UgdGhlIGRpcmVjdGl2ZSAqaXMqIGEgUG9ydGFsT3V0bGV0LCBwb3J0YWxzIGNhbiBiZVxuICogZGlyZWN0bHkgYXR0YWNoZWQgdG8gaXQsIGVuYWJsaW5nIGRlY2xhcmF0aXZlIHVzZS5cbiAqXG4gKiBVc2FnZTpcbiAqIGA8bmctdGVtcGxhdGUgW2Nka1BvcnRhbE91dGxldF09XCJncmVldGluZ1wiPjwvbmctdGVtcGxhdGU+YFxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrUG9ydGFsT3V0bGV0XScsXG4gIGV4cG9ydEFzOiAnY2RrUG9ydGFsT3V0bGV0JyxcbiAgaW5wdXRzOiBbJ3BvcnRhbDogY2RrUG9ydGFsT3V0bGV0J11cbn0pXG5leHBvcnQgY2xhc3MgQ2RrUG9ydGFsT3V0bGV0IGV4dGVuZHMgQmFzZVBvcnRhbE91dGxldCBpbXBsZW1lbnRzIE9uSW5pdCwgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50O1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBwb3J0YWwgY29tcG9uZW50IGlzIGluaXRpYWxpemVkLiAqL1xuICBwcml2YXRlIF9pc0luaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgY3VycmVudGx5LWF0dGFjaGVkIGNvbXBvbmVudC92aWV3IHJlZi4gKi9cbiAgcHJpdmF0ZSBfYXR0YWNoZWRSZWY6IENka1BvcnRhbE91dGxldEF0dGFjaGVkUmVmO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBfY29tcG9uZW50RmFjdG9yeVJlc29sdmVyOiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsXG4gICAgICBwcml2YXRlIF92aWV3Q29udGFpbmVyUmVmOiBWaWV3Q29udGFpbmVyUmVmLFxuXG4gICAgICAvKipcbiAgICAgICAqIEBkZXByZWNhdGVkIGBfZG9jdW1lbnRgIHBhcmFtZXRlciB0byBiZSBtYWRlIHJlcXVpcmVkLlxuICAgICAgICogQGJyZWFraW5nLWNoYW5nZSA5LjAuMFxuICAgICAgICovXG4gICAgICBASW5qZWN0KERPQ1VNRU5UKSBfZG9jdW1lbnQ/OiBhbnkpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX2RvY3VtZW50ID0gX2RvY3VtZW50O1xuICB9XG5cbiAgLyoqIFBvcnRhbCBhc3NvY2lhdGVkIHdpdGggdGhlIFBvcnRhbCBvdXRsZXQuICovXG4gIGdldCBwb3J0YWwoKTogUG9ydGFsPGFueT4gfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fYXR0YWNoZWRQb3J0YWw7XG4gIH1cblxuICBzZXQgcG9ydGFsKHBvcnRhbDogUG9ydGFsPGFueT4gfCBudWxsKSB7XG4gICAgLy8gSWdub3JlIHRoZSBjYXNlcyB3aGVyZSB0aGUgYHBvcnRhbGAgaXMgc2V0IHRvIGEgZmFsc3kgdmFsdWUgYmVmb3JlIHRoZSBsaWZlY3ljbGUgaG9va3MgaGF2ZVxuICAgIC8vIHJ1bi4gVGhpcyBoYW5kbGVzIHRoZSBjYXNlcyB3aGVyZSB0aGUgdXNlciBtaWdodCBkbyBzb21ldGhpbmcgbGlrZSBgPGRpdiBjZGtQb3J0YWxPdXRsZXQ+YFxuICAgIC8vIGFuZCBhdHRhY2ggYSBwb3J0YWwgcHJvZ3JhbW1hdGljYWxseSBpbiB0aGUgcGFyZW50IGNvbXBvbmVudC4gV2hlbiBBbmd1bGFyIGRvZXMgdGhlIGZpcnN0IENEXG4gICAgLy8gcm91bmQsIGl0IHdpbGwgZmlyZSB0aGUgc2V0dGVyIHdpdGggZW1wdHkgc3RyaW5nLCBjYXVzaW5nIHRoZSB1c2VyJ3MgY29udGVudCB0byBiZSBjbGVhcmVkLlxuICAgIGlmICh0aGlzLmhhc0F0dGFjaGVkKCkgJiYgIXBvcnRhbCAmJiAhdGhpcy5faXNJbml0aWFsaXplZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhc0F0dGFjaGVkKCkpIHtcbiAgICAgIHN1cGVyLmRldGFjaCgpO1xuICAgIH1cblxuICAgIGlmIChwb3J0YWwpIHtcbiAgICAgIHN1cGVyLmF0dGFjaChwb3J0YWwpO1xuICAgIH1cblxuICAgIHRoaXMuX2F0dGFjaGVkUG9ydGFsID0gcG9ydGFsO1xuICB9XG5cbiAgLyoqIEVtaXRzIHdoZW4gYSBwb3J0YWwgaXMgYXR0YWNoZWQgdG8gdGhlIG91dGxldC4gKi9cbiAgQE91dHB1dCgpIGF0dGFjaGVkOiBFdmVudEVtaXR0ZXI8Q2RrUG9ydGFsT3V0bGV0QXR0YWNoZWRSZWY+ID1cbiAgICAgIG5ldyBFdmVudEVtaXR0ZXI8Q2RrUG9ydGFsT3V0bGV0QXR0YWNoZWRSZWY+KCk7XG5cbiAgLyoqIENvbXBvbmVudCBvciB2aWV3IHJlZmVyZW5jZSB0aGF0IGlzIGF0dGFjaGVkIHRvIHRoZSBwb3J0YWwuICovXG4gIGdldCBhdHRhY2hlZFJlZigpOiBDZGtQb3J0YWxPdXRsZXRBdHRhY2hlZFJlZiB7XG4gICAgcmV0dXJuIHRoaXMuX2F0dGFjaGVkUmVmO1xuICB9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgdGhpcy5faXNJbml0aWFsaXplZCA9IHRydWU7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBzdXBlci5kaXNwb3NlKCk7XG4gICAgdGhpcy5fYXR0YWNoZWRQb3J0YWwgPSBudWxsO1xuICAgIHRoaXMuX2F0dGFjaGVkUmVmID0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRhY2ggdGhlIGdpdmVuIENvbXBvbmVudFBvcnRhbCB0byB0aGlzIFBvcnRhbE91dGxldCB1c2luZyB0aGUgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLlxuICAgKlxuICAgKiBAcGFyYW0gcG9ydGFsIFBvcnRhbCB0byBiZSBhdHRhY2hlZCB0byB0aGUgcG9ydGFsIG91dGxldC5cbiAgICogQHJldHVybnMgUmVmZXJlbmNlIHRvIHRoZSBjcmVhdGVkIGNvbXBvbmVudC5cbiAgICovXG4gIGF0dGFjaENvbXBvbmVudFBvcnRhbDxUPihwb3J0YWw6IENvbXBvbmVudFBvcnRhbDxUPik6IENvbXBvbmVudFJlZjxUPiB7XG4gICAgcG9ydGFsLnNldEF0dGFjaGVkSG9zdCh0aGlzKTtcblxuICAgIC8vIElmIHRoZSBwb3J0YWwgc3BlY2lmaWVzIGFuIG9yaWdpbiwgdXNlIHRoYXQgYXMgdGhlIGxvZ2ljYWwgbG9jYXRpb24gb2YgdGhlIGNvbXBvbmVudFxuICAgIC8vIGluIHRoZSBhcHBsaWNhdGlvbiB0cmVlLiBPdGhlcndpc2UgdXNlIHRoZSBsb2NhdGlvbiBvZiB0aGlzIFBvcnRhbE91dGxldC5cbiAgICBjb25zdCB2aWV3Q29udGFpbmVyUmVmID0gcG9ydGFsLnZpZXdDb250YWluZXJSZWYgIT0gbnVsbCA/XG4gICAgICAgIHBvcnRhbC52aWV3Q29udGFpbmVyUmVmIDpcbiAgICAgICAgdGhpcy5fdmlld0NvbnRhaW5lclJlZjtcblxuICAgIGNvbnN0IHJlc29sdmVyID0gcG9ydGFsLmNvbXBvbmVudEZhY3RvcnlSZXNvbHZlciB8fCB0aGlzLl9jb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI7XG4gICAgY29uc3QgY29tcG9uZW50RmFjdG9yeSA9IHJlc29sdmVyLnJlc29sdmVDb21wb25lbnRGYWN0b3J5KHBvcnRhbC5jb21wb25lbnQpO1xuICAgIGNvbnN0IHJlZiA9IHZpZXdDb250YWluZXJSZWYuY3JlYXRlQ29tcG9uZW50KFxuICAgICAgICBjb21wb25lbnRGYWN0b3J5LCB2aWV3Q29udGFpbmVyUmVmLmxlbmd0aCxcbiAgICAgICAgcG9ydGFsLmluamVjdG9yIHx8IHZpZXdDb250YWluZXJSZWYuaW5qZWN0b3IpO1xuXG4gICAgLy8gSWYgd2UncmUgdXNpbmcgYSB2aWV3IGNvbnRhaW5lciB0aGF0J3MgZGlmZmVyZW50IGZyb20gdGhlIGluamVjdGVkIG9uZSAoZS5nLiB3aGVuIHRoZSBwb3J0YWxcbiAgICAvLyBzcGVjaWZpZXMgaXRzIG93bikgd2UgbmVlZCB0byBtb3ZlIHRoZSBjb21wb25lbnQgaW50byB0aGUgb3V0bGV0LCBvdGhlcndpc2UgaXQnbGwgYmUgcmVuZGVyZWRcbiAgICAvLyBpbnNpZGUgb2YgdGhlIGFsdGVybmF0ZSB2aWV3IGNvbnRhaW5lci5cbiAgICBpZiAodmlld0NvbnRhaW5lclJlZiAhPT0gdGhpcy5fdmlld0NvbnRhaW5lclJlZikge1xuICAgICAgdGhpcy5fZ2V0Um9vdE5vZGUoKS5hcHBlbmRDaGlsZCgocmVmLmhvc3RWaWV3IGFzIEVtYmVkZGVkVmlld1JlZjxhbnk+KS5yb290Tm9kZXNbMF0pO1xuICAgIH1cblxuICAgIHN1cGVyLnNldERpc3Bvc2VGbigoKSA9PiByZWYuZGVzdHJveSgpKTtcbiAgICB0aGlzLl9hdHRhY2hlZFBvcnRhbCA9IHBvcnRhbDtcbiAgICB0aGlzLl9hdHRhY2hlZFJlZiA9IHJlZjtcbiAgICB0aGlzLmF0dGFjaGVkLmVtaXQocmVmKTtcblxuICAgIHJldHVybiByZWY7XG4gIH1cblxuICAvKipcbiAgICogQXR0YWNoIHRoZSBnaXZlbiBUZW1wbGF0ZVBvcnRhbCB0byB0aGlzIFBvcnRhbEhvc3QgYXMgYW4gZW1iZWRkZWQgVmlldy5cbiAgICogQHBhcmFtIHBvcnRhbCBQb3J0YWwgdG8gYmUgYXR0YWNoZWQuXG4gICAqIEByZXR1cm5zIFJlZmVyZW5jZSB0byB0aGUgY3JlYXRlZCBlbWJlZGRlZCB2aWV3LlxuICAgKi9cbiAgYXR0YWNoVGVtcGxhdGVQb3J0YWw8Qz4ocG9ydGFsOiBUZW1wbGF0ZVBvcnRhbDxDPik6IEVtYmVkZGVkVmlld1JlZjxDPiB7XG4gICAgcG9ydGFsLnNldEF0dGFjaGVkSG9zdCh0aGlzKTtcbiAgICBjb25zdCB2aWV3UmVmID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5jcmVhdGVFbWJlZGRlZFZpZXcocG9ydGFsLnRlbXBsYXRlUmVmLCBwb3J0YWwuY29udGV4dCk7XG4gICAgc3VwZXIuc2V0RGlzcG9zZUZuKCgpID0+IHRoaXMuX3ZpZXdDb250YWluZXJSZWYuY2xlYXIoKSk7XG5cbiAgICB0aGlzLl9hdHRhY2hlZFBvcnRhbCA9IHBvcnRhbDtcbiAgICB0aGlzLl9hdHRhY2hlZFJlZiA9IHZpZXdSZWY7XG4gICAgdGhpcy5hdHRhY2hlZC5lbWl0KHZpZXdSZWYpO1xuXG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cblxuICAvKipcbiAgICogQXR0YWNoZXMgdGhlIGdpdmVuIERvbVBvcnRhbCB0byB0aGlzIFBvcnRhbEhvc3QgYnkgbW92aW5nIGFsbCBvZiB0aGUgcG9ydGFsIGNvbnRlbnQgaW50byBpdC5cbiAgICogQHBhcmFtIHBvcnRhbCBQb3J0YWwgdG8gYmUgYXR0YWNoZWQuXG4gICAqIEBkZXByZWNhdGVkIFRvIGJlIHR1cm5lZCBpbnRvIGEgbWV0aG9kLlxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDEwLjAuMFxuICAgKi9cbiAgYXR0YWNoRG9tUG9ydGFsID0gKHBvcnRhbDogRG9tUG9ydGFsKSA9PiB7XG4gICAgLy8gQGJyZWFraW5nLWNoYW5nZSA5LjAuMCBSZW1vdmUgY2hlY2sgYW5kIGVycm9yIG9uY2UgdGhlXG4gICAgLy8gYF9kb2N1bWVudGAgY29uc3RydWN0b3IgcGFyYW1ldGVyIGlzIHJlcXVpcmVkLlxuICAgIGlmICghdGhpcy5fZG9jdW1lbnQpIHtcbiAgICAgIHRocm93IEVycm9yKCdDYW5ub3QgYXR0YWNoIERPTSBwb3J0YWwgd2l0aG91dCBfZG9jdW1lbnQgY29uc3RydWN0b3IgcGFyYW1ldGVyJyk7XG4gICAgfVxuXG4gICAgY29uc3QgZWxlbWVudCA9IHBvcnRhbC5lbGVtZW50O1xuICAgIGlmICghZWxlbWVudC5wYXJlbnROb2RlKSB7XG4gICAgICB0aHJvdyBFcnJvcignRE9NIHBvcnRhbCBjb250ZW50IG11c3QgYmUgYXR0YWNoZWQgdG8gYSBwYXJlbnQgbm9kZS4nKTtcbiAgICB9XG5cbiAgICAvLyBBbmNob3IgdXNlZCB0byBzYXZlIHRoZSBlbGVtZW50J3MgcHJldmlvdXMgcG9zaXRpb24gc29cbiAgICAvLyB0aGF0IHdlIGNhbiByZXN0b3JlIGl0IHdoZW4gdGhlIHBvcnRhbCBpcyBkZXRhY2hlZC5cbiAgICBjb25zdCBhbmNob3JOb2RlID0gdGhpcy5fZG9jdW1lbnQuY3JlYXRlQ29tbWVudCgnZG9tLXBvcnRhbCcpO1xuXG4gICAgcG9ydGFsLnNldEF0dGFjaGVkSG9zdCh0aGlzKTtcbiAgICBlbGVtZW50LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGFuY2hvck5vZGUsIGVsZW1lbnQpO1xuICAgIHRoaXMuX2dldFJvb3ROb2RlKCkuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG5cbiAgICBzdXBlci5zZXREaXNwb3NlRm4oKCkgPT4ge1xuICAgICAgaWYgKGFuY2hvck5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgICBhbmNob3JOb2RlLnBhcmVudE5vZGUhLnJlcGxhY2VDaGlsZChlbGVtZW50LCBhbmNob3JOb2RlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSByb290IG5vZGUgb2YgdGhlIHBvcnRhbCBvdXRsZXQuICovXG4gIHByaXZhdGUgX2dldFJvb3ROb2RlKCk6IEhUTUxFbGVtZW50IHtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50OiBOb2RlID0gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQ7XG5cbiAgICAvLyBUaGUgZGlyZWN0aXZlIGNvdWxkIGJlIHNldCBvbiBhIHRlbXBsYXRlIHdoaWNoIHdpbGwgcmVzdWx0IGluIGEgY29tbWVudFxuICAgIC8vIG5vZGUgYmVpbmcgdGhlIHJvb3QuIFVzZSB0aGUgY29tbWVudCdzIHBhcmVudCBub2RlIGlmIHRoYXQgaXMgdGhlIGNhc2UuXG4gICAgcmV0dXJuIChuYXRpdmVFbGVtZW50Lm5vZGVUeXBlID09PSBuYXRpdmVFbGVtZW50LkVMRU1FTlRfTk9ERSA/XG4gICAgICAgICAgIG5hdGl2ZUVsZW1lbnQgOiBuYXRpdmVFbGVtZW50LnBhcmVudE5vZGUhKSBhcyBIVE1MRWxlbWVudDtcbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9wb3J0YWw6IFBvcnRhbDxhbnk+IHwgbnVsbCB8IHVuZGVmaW5lZCB8ICcnO1xufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkIFVzZSBgQ2RrUG9ydGFsT3V0bGV0YCBpbnN0ZWFkLlxuICogQGJyZWFraW5nLWNoYW5nZSA5LjAuMFxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrUG9ydGFsSG9zdF0sIFtwb3J0YWxIb3N0XScsXG4gIGV4cG9ydEFzOiAnY2RrUG9ydGFsSG9zdCcsXG4gIGlucHV0czogWydwb3J0YWw6IGNka1BvcnRhbEhvc3QnXSxcbiAgcHJvdmlkZXJzOiBbe1xuICAgIHByb3ZpZGU6IENka1BvcnRhbE91dGxldCxcbiAgICB1c2VFeGlzdGluZzogUG9ydGFsSG9zdERpcmVjdGl2ZVxuICB9XVxufSlcbmV4cG9ydCBjbGFzcyBQb3J0YWxIb3N0RGlyZWN0aXZlIGV4dGVuZHMgQ2RrUG9ydGFsT3V0bGV0IHt9XG5cblxuQE5nTW9kdWxlKHtcbiAgZXhwb3J0czogW0Nka1BvcnRhbCwgQ2RrUG9ydGFsT3V0bGV0LCBUZW1wbGF0ZVBvcnRhbERpcmVjdGl2ZSwgUG9ydGFsSG9zdERpcmVjdGl2ZV0sXG4gIGRlY2xhcmF0aW9uczogW0Nka1BvcnRhbCwgQ2RrUG9ydGFsT3V0bGV0LCBUZW1wbGF0ZVBvcnRhbERpcmVjdGl2ZSwgUG9ydGFsSG9zdERpcmVjdGl2ZV0sXG59KVxuZXhwb3J0IGNsYXNzIFBvcnRhbE1vZHVsZSB7fVxuIl19