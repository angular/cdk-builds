/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __extends } from "tslib";
import { BasePortalOutlet } from './portal';
/**
 * A PortalOutlet for attaching portals to an arbitrary DOM element outside of the Angular
 * application context.
 */
var DomPortalOutlet = /** @class */ (function (_super) {
    __extends(DomPortalOutlet, _super);
    function DomPortalOutlet(
    /** Element into which the content is projected. */
    outletElement, _componentFactoryResolver, _appRef, _defaultInjector) {
        var _this = _super.call(this) || this;
        _this.outletElement = outletElement;
        _this._componentFactoryResolver = _componentFactoryResolver;
        _this._appRef = _appRef;
        _this._defaultInjector = _defaultInjector;
        return _this;
    }
    /**
     * Attach the given ComponentPortal to DOM element using the ComponentFactoryResolver.
     * @param portal Portal to be attached
     * @returns Reference to the created component.
     */
    DomPortalOutlet.prototype.attachComponentPortal = function (portal) {
        var _this = this;
        var resolver = portal.componentFactoryResolver || this._componentFactoryResolver;
        var componentFactory = resolver.resolveComponentFactory(portal.component);
        var componentRef;
        // If the portal specifies a ViewContainerRef, we will use that as the attachment point
        // for the component (in terms of Angular's component tree, not rendering).
        // When the ViewContainerRef is missing, we use the factory to create the component directly
        // and then manually attach the view to the application.
        if (portal.viewContainerRef) {
            componentRef = portal.viewContainerRef.createComponent(componentFactory, portal.viewContainerRef.length, portal.injector || portal.viewContainerRef.injector);
            this.setDisposeFn(function () { return componentRef.destroy(); });
        }
        else {
            componentRef = componentFactory.create(portal.injector || this._defaultInjector);
            this._appRef.attachView(componentRef.hostView);
            this.setDisposeFn(function () {
                _this._appRef.detachView(componentRef.hostView);
                componentRef.destroy();
            });
        }
        // At this point the component has been instantiated, so we move it to the location in the DOM
        // where we want it to be rendered.
        this.outletElement.appendChild(this._getComponentRootNode(componentRef));
        return componentRef;
    };
    /**
     * Attaches a template portal to the DOM as an embedded view.
     * @param portal Portal to be attached.
     * @returns Reference to the created embedded view.
     */
    DomPortalOutlet.prototype.attachTemplatePortal = function (portal) {
        var _this = this;
        var viewContainer = portal.viewContainerRef;
        var viewRef = viewContainer.createEmbeddedView(portal.templateRef, portal.context);
        viewRef.detectChanges();
        // The method `createEmbeddedView` will add the view as a child of the viewContainer.
        // But for the DomPortalOutlet the view can be added everywhere in the DOM
        // (e.g Overlay Container) To move the view to the specified host element. We just
        // re-append the existing root nodes.
        viewRef.rootNodes.forEach(function (rootNode) { return _this.outletElement.appendChild(rootNode); });
        this.setDisposeFn((function () {
            var index = viewContainer.indexOf(viewRef);
            if (index !== -1) {
                viewContainer.remove(index);
            }
        }));
        // TODO(jelbourn): Return locals from view.
        return viewRef;
    };
    /**
     * Clears out a portal from the DOM.
     */
    DomPortalOutlet.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        if (this.outletElement.parentNode != null) {
            this.outletElement.parentNode.removeChild(this.outletElement);
        }
    };
    /** Gets the root HTMLElement for an instantiated component. */
    DomPortalOutlet.prototype._getComponentRootNode = function (componentRef) {
        return componentRef.hostView.rootNodes[0];
    };
    return DomPortalOutlet;
}(BasePortalOutlet));
export { DomPortalOutlet };
/**
 * @deprecated Use `DomPortalOutlet` instead.
 * @breaking-change 9.0.0
 */
var DomPortalHost = /** @class */ (function (_super) {
    __extends(DomPortalHost, _super);
    function DomPortalHost() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return DomPortalHost;
}(DomPortalOutlet));
export { DomPortalHost };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLXBvcnRhbC1vdXRsZXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3BvcnRhbC9kb20tcG9ydGFsLW91dGxldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBU0gsT0FBTyxFQUFDLGdCQUFnQixFQUFrQyxNQUFNLFVBQVUsQ0FBQztBQUczRTs7O0dBR0c7QUFDSDtJQUFxQyxtQ0FBZ0I7SUFDbkQ7SUFDSSxtREFBbUQ7SUFDNUMsYUFBc0IsRUFDckIseUJBQW1ELEVBQ25ELE9BQXVCLEVBQ3ZCLGdCQUEwQjtRQUx0QyxZQU1FLGlCQUFPLFNBQ1I7UUFMVSxtQkFBYSxHQUFiLGFBQWEsQ0FBUztRQUNyQiwrQkFBeUIsR0FBekIseUJBQXlCLENBQTBCO1FBQ25ELGFBQU8sR0FBUCxPQUFPLENBQWdCO1FBQ3ZCLHNCQUFnQixHQUFoQixnQkFBZ0IsQ0FBVTs7SUFFdEMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCwrQ0FBcUIsR0FBckIsVUFBeUIsTUFBMEI7UUFBbkQsaUJBNkJDO1FBNUJDLElBQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyx3QkFBd0IsSUFBSSxJQUFJLENBQUMseUJBQXlCLENBQUM7UUFDbkYsSUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsdUJBQXVCLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzVFLElBQUksWUFBNkIsQ0FBQztRQUVsQyx1RkFBdUY7UUFDdkYsMkVBQTJFO1FBQzNFLDRGQUE0RjtRQUM1Rix3REFBd0Q7UUFDeEQsSUFBSSxNQUFNLENBQUMsZ0JBQWdCLEVBQUU7WUFDM0IsWUFBWSxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLENBQ2xELGdCQUFnQixFQUNoQixNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUM5QixNQUFNLENBQUMsUUFBUSxJQUFJLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUV6RCxJQUFJLENBQUMsWUFBWSxDQUFDLGNBQU0sT0FBQSxZQUFZLENBQUMsT0FBTyxFQUFFLEVBQXRCLENBQXNCLENBQUMsQ0FBQztTQUNqRDthQUFNO1lBQ0wsWUFBWSxHQUFHLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ2pGLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMvQyxJQUFJLENBQUMsWUFBWSxDQUFDO2dCQUNoQixLQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQy9DLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN6QixDQUFDLENBQUMsQ0FBQztTQUNKO1FBQ0QsOEZBQThGO1FBQzlGLG1DQUFtQztRQUNuQyxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztRQUV6RSxPQUFPLFlBQVksQ0FBQztJQUN0QixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILDhDQUFvQixHQUFwQixVQUF3QixNQUF5QjtRQUFqRCxpQkFvQkM7UUFuQkMsSUFBSSxhQUFhLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDO1FBQzVDLElBQUksT0FBTyxHQUFHLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNuRixPQUFPLENBQUMsYUFBYSxFQUFFLENBQUM7UUFFeEIscUZBQXFGO1FBQ3JGLDBFQUEwRTtRQUMxRSxrRkFBa0Y7UUFDbEYscUNBQXFDO1FBQ3JDLE9BQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFVBQUEsUUFBUSxJQUFJLE9BQUEsS0FBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEVBQXhDLENBQXdDLENBQUMsQ0FBQztRQUVoRixJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDakIsSUFBSSxLQUFLLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMzQyxJQUFJLEtBQUssS0FBSyxDQUFDLENBQUMsRUFBRTtnQkFDaEIsYUFBYSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUM3QjtRQUNILENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFSiwyQ0FBMkM7UUFDM0MsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsaUNBQU8sR0FBUDtRQUNFLGlCQUFNLE9BQU8sV0FBRSxDQUFDO1FBQ2hCLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLElBQUksSUFBSSxFQUFFO1lBQ3pDLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7U0FDL0Q7SUFDSCxDQUFDO0lBRUQsK0RBQStEO0lBQ3ZELCtDQUFxQixHQUE3QixVQUE4QixZQUErQjtRQUMzRCxPQUFRLFlBQVksQ0FBQyxRQUFpQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQWdCLENBQUM7SUFDckYsQ0FBQztJQUNILHNCQUFDO0FBQUQsQ0FBQyxBQXZGRCxDQUFxQyxnQkFBZ0IsR0F1RnBEOztBQUVEOzs7R0FHRztBQUNIO0lBQW1DLGlDQUFlO0lBQWxEOztJQUFvRCxDQUFDO0lBQUQsb0JBQUM7QUFBRCxDQUFDLEFBQXJELENBQW1DLGVBQWUsR0FBRyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsXG4gIENvbXBvbmVudFJlZixcbiAgRW1iZWRkZWRWaWV3UmVmLFxuICBBcHBsaWNhdGlvblJlZixcbiAgSW5qZWN0b3IsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtCYXNlUG9ydGFsT3V0bGV0LCBDb21wb25lbnRQb3J0YWwsIFRlbXBsYXRlUG9ydGFsfSBmcm9tICcuL3BvcnRhbCc7XG5cblxuLyoqXG4gKiBBIFBvcnRhbE91dGxldCBmb3IgYXR0YWNoaW5nIHBvcnRhbHMgdG8gYW4gYXJiaXRyYXJ5IERPTSBlbGVtZW50IG91dHNpZGUgb2YgdGhlIEFuZ3VsYXJcbiAqIGFwcGxpY2F0aW9uIGNvbnRleHQuXG4gKi9cbmV4cG9ydCBjbGFzcyBEb21Qb3J0YWxPdXRsZXQgZXh0ZW5kcyBCYXNlUG9ydGFsT3V0bGV0IHtcbiAgY29uc3RydWN0b3IoXG4gICAgICAvKiogRWxlbWVudCBpbnRvIHdoaWNoIHRoZSBjb250ZW50IGlzIHByb2plY3RlZC4gKi9cbiAgICAgIHB1YmxpYyBvdXRsZXRFbGVtZW50OiBFbGVtZW50LFxuICAgICAgcHJpdmF0ZSBfY29tcG9uZW50RmFjdG9yeVJlc29sdmVyOiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsXG4gICAgICBwcml2YXRlIF9hcHBSZWY6IEFwcGxpY2F0aW9uUmVmLFxuICAgICAgcHJpdmF0ZSBfZGVmYXVsdEluamVjdG9yOiBJbmplY3Rvcikge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICAvKipcbiAgICogQXR0YWNoIHRoZSBnaXZlbiBDb21wb25lbnRQb3J0YWwgdG8gRE9NIGVsZW1lbnQgdXNpbmcgdGhlIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlci5cbiAgICogQHBhcmFtIHBvcnRhbCBQb3J0YWwgdG8gYmUgYXR0YWNoZWRcbiAgICogQHJldHVybnMgUmVmZXJlbmNlIHRvIHRoZSBjcmVhdGVkIGNvbXBvbmVudC5cbiAgICovXG4gIGF0dGFjaENvbXBvbmVudFBvcnRhbDxUPihwb3J0YWw6IENvbXBvbmVudFBvcnRhbDxUPik6IENvbXBvbmVudFJlZjxUPiB7XG4gICAgY29uc3QgcmVzb2x2ZXIgPSBwb3J0YWwuY29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHx8IHRoaXMuX2NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjtcbiAgICBjb25zdCBjb21wb25lbnRGYWN0b3J5ID0gcmVzb2x2ZXIucmVzb2x2ZUNvbXBvbmVudEZhY3RvcnkocG9ydGFsLmNvbXBvbmVudCk7XG4gICAgbGV0IGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmPFQ+O1xuXG4gICAgLy8gSWYgdGhlIHBvcnRhbCBzcGVjaWZpZXMgYSBWaWV3Q29udGFpbmVyUmVmLCB3ZSB3aWxsIHVzZSB0aGF0IGFzIHRoZSBhdHRhY2htZW50IHBvaW50XG4gICAgLy8gZm9yIHRoZSBjb21wb25lbnQgKGluIHRlcm1zIG9mIEFuZ3VsYXIncyBjb21wb25lbnQgdHJlZSwgbm90IHJlbmRlcmluZykuXG4gICAgLy8gV2hlbiB0aGUgVmlld0NvbnRhaW5lclJlZiBpcyBtaXNzaW5nLCB3ZSB1c2UgdGhlIGZhY3RvcnkgdG8gY3JlYXRlIHRoZSBjb21wb25lbnQgZGlyZWN0bHlcbiAgICAvLyBhbmQgdGhlbiBtYW51YWxseSBhdHRhY2ggdGhlIHZpZXcgdG8gdGhlIGFwcGxpY2F0aW9uLlxuICAgIGlmIChwb3J0YWwudmlld0NvbnRhaW5lclJlZikge1xuICAgICAgY29tcG9uZW50UmVmID0gcG9ydGFsLnZpZXdDb250YWluZXJSZWYuY3JlYXRlQ29tcG9uZW50KFxuICAgICAgICAgIGNvbXBvbmVudEZhY3RvcnksXG4gICAgICAgICAgcG9ydGFsLnZpZXdDb250YWluZXJSZWYubGVuZ3RoLFxuICAgICAgICAgIHBvcnRhbC5pbmplY3RvciB8fCBwb3J0YWwudmlld0NvbnRhaW5lclJlZi5pbmplY3Rvcik7XG5cbiAgICAgIHRoaXMuc2V0RGlzcG9zZUZuKCgpID0+IGNvbXBvbmVudFJlZi5kZXN0cm95KCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb21wb25lbnRSZWYgPSBjb21wb25lbnRGYWN0b3J5LmNyZWF0ZShwb3J0YWwuaW5qZWN0b3IgfHwgdGhpcy5fZGVmYXVsdEluamVjdG9yKTtcbiAgICAgIHRoaXMuX2FwcFJlZi5hdHRhY2hWaWV3KGNvbXBvbmVudFJlZi5ob3N0Vmlldyk7XG4gICAgICB0aGlzLnNldERpc3Bvc2VGbigoKSA9PiB7XG4gICAgICAgIHRoaXMuX2FwcFJlZi5kZXRhY2hWaWV3KGNvbXBvbmVudFJlZi5ob3N0Vmlldyk7XG4gICAgICAgIGNvbXBvbmVudFJlZi5kZXN0cm95KCk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgLy8gQXQgdGhpcyBwb2ludCB0aGUgY29tcG9uZW50IGhhcyBiZWVuIGluc3RhbnRpYXRlZCwgc28gd2UgbW92ZSBpdCB0byB0aGUgbG9jYXRpb24gaW4gdGhlIERPTVxuICAgIC8vIHdoZXJlIHdlIHdhbnQgaXQgdG8gYmUgcmVuZGVyZWQuXG4gICAgdGhpcy5vdXRsZXRFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX2dldENvbXBvbmVudFJvb3ROb2RlKGNvbXBvbmVudFJlZikpO1xuXG4gICAgcmV0dXJuIGNvbXBvbmVudFJlZjtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRhY2hlcyBhIHRlbXBsYXRlIHBvcnRhbCB0byB0aGUgRE9NIGFzIGFuIGVtYmVkZGVkIHZpZXcuXG4gICAqIEBwYXJhbSBwb3J0YWwgUG9ydGFsIHRvIGJlIGF0dGFjaGVkLlxuICAgKiBAcmV0dXJucyBSZWZlcmVuY2UgdG8gdGhlIGNyZWF0ZWQgZW1iZWRkZWQgdmlldy5cbiAgICovXG4gIGF0dGFjaFRlbXBsYXRlUG9ydGFsPEM+KHBvcnRhbDogVGVtcGxhdGVQb3J0YWw8Qz4pOiBFbWJlZGRlZFZpZXdSZWY8Qz4ge1xuICAgIGxldCB2aWV3Q29udGFpbmVyID0gcG9ydGFsLnZpZXdDb250YWluZXJSZWY7XG4gICAgbGV0IHZpZXdSZWYgPSB2aWV3Q29udGFpbmVyLmNyZWF0ZUVtYmVkZGVkVmlldyhwb3J0YWwudGVtcGxhdGVSZWYsIHBvcnRhbC5jb250ZXh0KTtcbiAgICB2aWV3UmVmLmRldGVjdENoYW5nZXMoKTtcblxuICAgIC8vIFRoZSBtZXRob2QgYGNyZWF0ZUVtYmVkZGVkVmlld2Agd2lsbCBhZGQgdGhlIHZpZXcgYXMgYSBjaGlsZCBvZiB0aGUgdmlld0NvbnRhaW5lci5cbiAgICAvLyBCdXQgZm9yIHRoZSBEb21Qb3J0YWxPdXRsZXQgdGhlIHZpZXcgY2FuIGJlIGFkZGVkIGV2ZXJ5d2hlcmUgaW4gdGhlIERPTVxuICAgIC8vIChlLmcgT3ZlcmxheSBDb250YWluZXIpIFRvIG1vdmUgdGhlIHZpZXcgdG8gdGhlIHNwZWNpZmllZCBob3N0IGVsZW1lbnQuIFdlIGp1c3RcbiAgICAvLyByZS1hcHBlbmQgdGhlIGV4aXN0aW5nIHJvb3Qgbm9kZXMuXG4gICAgdmlld1JlZi5yb290Tm9kZXMuZm9yRWFjaChyb290Tm9kZSA9PiB0aGlzLm91dGxldEVsZW1lbnQuYXBwZW5kQ2hpbGQocm9vdE5vZGUpKTtcblxuICAgIHRoaXMuc2V0RGlzcG9zZUZuKCgoKSA9PiB7XG4gICAgICBsZXQgaW5kZXggPSB2aWV3Q29udGFpbmVyLmluZGV4T2Yodmlld1JlZik7XG4gICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgIHZpZXdDb250YWluZXIucmVtb3ZlKGluZGV4KTtcbiAgICAgIH1cbiAgICB9KSk7XG5cbiAgICAvLyBUT0RPKGplbGJvdXJuKTogUmV0dXJuIGxvY2FscyBmcm9tIHZpZXcuXG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIG91dCBhIHBvcnRhbCBmcm9tIHRoZSBET00uXG4gICAqL1xuICBkaXNwb3NlKCk6IHZvaWQge1xuICAgIHN1cGVyLmRpc3Bvc2UoKTtcbiAgICBpZiAodGhpcy5vdXRsZXRFbGVtZW50LnBhcmVudE5vZGUgIT0gbnVsbCkge1xuICAgICAgdGhpcy5vdXRsZXRFbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5vdXRsZXRFbGVtZW50KTtcbiAgICB9XG4gIH1cblxuICAvKiogR2V0cyB0aGUgcm9vdCBIVE1MRWxlbWVudCBmb3IgYW4gaW5zdGFudGlhdGVkIGNvbXBvbmVudC4gKi9cbiAgcHJpdmF0ZSBfZ2V0Q29tcG9uZW50Um9vdE5vZGUoY29tcG9uZW50UmVmOiBDb21wb25lbnRSZWY8YW55Pik6IEhUTUxFbGVtZW50IHtcbiAgICByZXR1cm4gKGNvbXBvbmVudFJlZi5ob3N0VmlldyBhcyBFbWJlZGRlZFZpZXdSZWY8YW55Pikucm9vdE5vZGVzWzBdIGFzIEhUTUxFbGVtZW50O1xuICB9XG59XG5cbi8qKlxuICogQGRlcHJlY2F0ZWQgVXNlIGBEb21Qb3J0YWxPdXRsZXRgIGluc3RlYWQuXG4gKiBAYnJlYWtpbmctY2hhbmdlIDkuMC4wXG4gKi9cbmV4cG9ydCBjbGFzcyBEb21Qb3J0YWxIb3N0IGV4dGVuZHMgRG9tUG9ydGFsT3V0bGV0IHt9XG4iXX0=