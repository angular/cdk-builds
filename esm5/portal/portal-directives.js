/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { ComponentFactoryResolver, Directive, EventEmitter, NgModule, Output, TemplateRef, ViewContainerRef, } from '@angular/core';
import { BasePortalOutlet, TemplatePortal } from './portal';
/**
 * Directive version of a `TemplatePortal`. Because the directive *is* a TemplatePortal,
 * the directive instance itself can be attached to a host, enabling declarative use of portals.
 */
var CdkPortal = /** @class */ (function (_super) {
    tslib_1.__extends(CdkPortal, _super);
    function CdkPortal(templateRef, viewContainerRef) {
        return _super.call(this, templateRef, viewContainerRef) || this;
    }
    CdkPortal.decorators = [
        { type: Directive, args: [{
                    selector: '[cdkPortal]',
                    exportAs: 'cdkPortal',
                },] }
    ];
    /** @nocollapse */
    CdkPortal.ctorParameters = function () { return [
        { type: TemplateRef },
        { type: ViewContainerRef }
    ]; };
    return CdkPortal;
}(TemplatePortal));
export { CdkPortal };
/**
 * @deprecated Use `CdkPortal` instead.
 * @breaking-change 9.0.0
 */
var TemplatePortalDirective = /** @class */ (function (_super) {
    tslib_1.__extends(TemplatePortalDirective, _super);
    function TemplatePortalDirective() {
        return _super !== null && _super.apply(this, arguments) || this;
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
    return TemplatePortalDirective;
}(CdkPortal));
export { TemplatePortalDirective };
/**
 * Directive version of a PortalOutlet. Because the directive *is* a PortalOutlet, portals can be
 * directly attached to it, enabling declarative use.
 *
 * Usage:
 * `<ng-template [cdkPortalOutlet]="greeting"></ng-template>`
 */
var CdkPortalOutlet = /** @class */ (function (_super) {
    tslib_1.__extends(CdkPortalOutlet, _super);
    function CdkPortalOutlet(_componentFactoryResolver, _viewContainerRef) {
        var _this = _super.call(this) || this;
        _this._componentFactoryResolver = _componentFactoryResolver;
        _this._viewContainerRef = _viewContainerRef;
        /** Whether the portal component is initialized. */
        _this._isInitialized = false;
        /** Emits when a portal is attached to the outlet. */
        _this.attached = new EventEmitter();
        return _this;
    }
    Object.defineProperty(CdkPortalOutlet.prototype, "portal", {
        /** Portal associated with the Portal outlet. */
        get: function () {
            return this._attachedPortal;
        },
        set: function (portal) {
            // Ignore the cases where the `portal` is set to a falsy value before the lifecycle hooks have
            // run. This handles the cases where the user might do something like `<div cdkPortalOutlet>`
            // and attach a portal programmatically in the parent component. When Angular does the first CD
            // round, it will fire the setter with empty string, causing the user's content to be cleared.
            if (this.hasAttached() && !portal && !this._isInitialized) {
                return;
            }
            if (this.hasAttached()) {
                _super.prototype.detach.call(this);
            }
            if (portal) {
                _super.prototype.attach.call(this, portal);
            }
            this._attachedPortal = portal;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CdkPortalOutlet.prototype, "attachedRef", {
        /** Component or view reference that is attached to the portal. */
        get: function () {
            return this._attachedRef;
        },
        enumerable: true,
        configurable: true
    });
    CdkPortalOutlet.prototype.ngOnInit = function () {
        this._isInitialized = true;
    };
    CdkPortalOutlet.prototype.ngOnDestroy = function () {
        _super.prototype.dispose.call(this);
        this._attachedPortal = null;
        this._attachedRef = null;
    };
    /**
     * Attach the given ComponentPortal to this PortalOutlet using the ComponentFactoryResolver.
     *
     * @param portal Portal to be attached to the portal outlet.
     * @returns Reference to the created component.
     */
    CdkPortalOutlet.prototype.attachComponentPortal = function (portal) {
        portal.setAttachedHost(this);
        // If the portal specifies an origin, use that as the logical location of the component
        // in the application tree. Otherwise use the location of this PortalOutlet.
        var viewContainerRef = portal.viewContainerRef != null ?
            portal.viewContainerRef :
            this._viewContainerRef;
        var resolver = portal.componentFactoryResolver || this._componentFactoryResolver;
        var componentFactory = resolver.resolveComponentFactory(portal.component);
        var ref = viewContainerRef.createComponent(componentFactory, viewContainerRef.length, portal.injector || viewContainerRef.injector);
        _super.prototype.setDisposeFn.call(this, function () { return ref.destroy(); });
        this._attachedPortal = portal;
        this._attachedRef = ref;
        this.attached.emit(ref);
        return ref;
    };
    /**
     * Attach the given TemplatePortal to this PortlHost as an embedded View.
     * @param portal Portal to be attached.
     * @returns Reference to the created embedded view.
     */
    CdkPortalOutlet.prototype.attachTemplatePortal = function (portal) {
        var _this = this;
        portal.setAttachedHost(this);
        var viewRef = this._viewContainerRef.createEmbeddedView(portal.templateRef, portal.context);
        _super.prototype.setDisposeFn.call(this, function () { return _this._viewContainerRef.clear(); });
        this._attachedPortal = portal;
        this._attachedRef = viewRef;
        this.attached.emit(viewRef);
        return viewRef;
    };
    CdkPortalOutlet.decorators = [
        { type: Directive, args: [{
                    selector: '[cdkPortalOutlet]',
                    exportAs: 'cdkPortalOutlet',
                    inputs: ['portal: cdkPortalOutlet']
                },] }
    ];
    /** @nocollapse */
    CdkPortalOutlet.ctorParameters = function () { return [
        { type: ComponentFactoryResolver },
        { type: ViewContainerRef }
    ]; };
    CdkPortalOutlet.propDecorators = {
        attached: [{ type: Output }]
    };
    return CdkPortalOutlet;
}(BasePortalOutlet));
export { CdkPortalOutlet };
/**
 * @deprecated Use `CdkPortalOutlet` instead.
 * @breaking-change 9.0.0
 */
var PortalHostDirective = /** @class */ (function (_super) {
    tslib_1.__extends(PortalHostDirective, _super);
    function PortalHostDirective() {
        return _super !== null && _super.apply(this, arguments) || this;
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
    return PortalHostDirective;
}(CdkPortalOutlet));
export { PortalHostDirective };
var PortalModule = /** @class */ (function () {
    function PortalModule() {
    }
    PortalModule.decorators = [
        { type: NgModule, args: [{
                    exports: [CdkPortal, CdkPortalOutlet, TemplatePortalDirective, PortalHostDirective],
                    declarations: [CdkPortal, CdkPortalOutlet, TemplatePortalDirective, PortalHostDirective],
                },] }
    ];
    return PortalModule;
}());
export { PortalModule };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9ydGFsLWRpcmVjdGl2ZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3BvcnRhbC9wb3J0YWwtZGlyZWN0aXZlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUNMLHdCQUF3QixFQUV4QixTQUFTLEVBRVQsWUFBWSxFQUNaLFFBQVEsRUFHUixNQUFNLEVBQ04sV0FBVyxFQUNYLGdCQUFnQixHQUNqQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsZ0JBQWdCLEVBQTJCLGNBQWMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUduRjs7O0dBR0c7QUFDSDtJQUkrQixxQ0FBYztJQUMzQyxtQkFBWSxXQUE2QixFQUFFLGdCQUFrQztlQUMzRSxrQkFBTSxXQUFXLEVBQUUsZ0JBQWdCLENBQUM7SUFDdEMsQ0FBQzs7Z0JBUEYsU0FBUyxTQUFDO29CQUNULFFBQVEsRUFBRSxhQUFhO29CQUN2QixRQUFRLEVBQUUsV0FBVztpQkFDdEI7Ozs7Z0JBYkMsV0FBVztnQkFDWCxnQkFBZ0I7O0lBaUJsQixnQkFBQztDQUFBLEFBUkQsQ0FJK0IsY0FBYyxHQUk1QztTQUpZLFNBQVM7QUFNdEI7OztHQUdHO0FBQ0g7SUFRNkMsbURBQVM7SUFSdEQ7O0lBUXdELENBQUM7O2dCQVJ4RCxTQUFTLFNBQUM7b0JBQ1QsUUFBUSxFQUFFLHdCQUF3QjtvQkFDbEMsUUFBUSxFQUFFLFdBQVc7b0JBQ3JCLFNBQVMsRUFBRSxDQUFDOzRCQUNWLE9BQU8sRUFBRSxTQUFTOzRCQUNsQixXQUFXLEVBQUUsdUJBQXVCO3lCQUNyQyxDQUFDO2lCQUNIOztJQUN1RCw4QkFBQztDQUFBLEFBUnpELENBUTZDLFNBQVMsR0FBRztTQUE1Qyx1QkFBdUI7QUFRcEM7Ozs7OztHQU1HO0FBQ0g7SUFLcUMsMkNBQWdCO0lBT25ELHlCQUNZLHlCQUFtRCxFQUNuRCxpQkFBbUM7UUFGL0MsWUFHRSxpQkFBTyxTQUNSO1FBSFcsK0JBQXlCLEdBQXpCLHlCQUF5QixDQUEwQjtRQUNuRCx1QkFBaUIsR0FBakIsaUJBQWlCLENBQWtCO1FBUi9DLG1EQUFtRDtRQUMzQyxvQkFBYyxHQUFHLEtBQUssQ0FBQztRQW9DL0IscURBQXFEO1FBQzNDLGNBQVEsR0FDZCxJQUFJLFlBQVksRUFBOEIsQ0FBQzs7SUE3Qm5ELENBQUM7SUFHRCxzQkFBSSxtQ0FBTTtRQURWLGdEQUFnRDthQUNoRDtZQUNFLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQztRQUM5QixDQUFDO2FBRUQsVUFBVyxNQUEwQjtZQUNuQyw4RkFBOEY7WUFDOUYsNkZBQTZGO1lBQzdGLCtGQUErRjtZQUMvRiw4RkFBOEY7WUFDOUYsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFO2dCQUN6RCxPQUFPO2FBQ1I7WUFFRCxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRTtnQkFDdEIsaUJBQU0sTUFBTSxXQUFFLENBQUM7YUFDaEI7WUFFRCxJQUFJLE1BQU0sRUFBRTtnQkFDVixpQkFBTSxNQUFNLFlBQUMsTUFBTSxDQUFDLENBQUM7YUFDdEI7WUFFRCxJQUFJLENBQUMsZUFBZSxHQUFHLE1BQU0sQ0FBQztRQUNoQyxDQUFDOzs7T0FwQkE7SUEyQkQsc0JBQUksd0NBQVc7UUFEZixrRUFBa0U7YUFDbEU7WUFDRSxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDM0IsQ0FBQzs7O09BQUE7SUFFRCxrQ0FBUSxHQUFSO1FBQ0UsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7SUFDN0IsQ0FBQztJQUVELHFDQUFXLEdBQVg7UUFDRSxpQkFBTSxPQUFPLFdBQUUsQ0FBQztRQUNoQixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztRQUM1QixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztJQUMzQixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCwrQ0FBcUIsR0FBckIsVUFBeUIsTUFBMEI7UUFDakQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUU3Qix1RkFBdUY7UUFDdkYsNEVBQTRFO1FBQzVFLElBQU0sZ0JBQWdCLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixJQUFJLElBQUksQ0FBQyxDQUFDO1lBQ3RELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ3pCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztRQUUzQixJQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsd0JBQXdCLElBQUksSUFBSSxDQUFDLHlCQUF5QixDQUFDO1FBQ25GLElBQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM1RSxJQUFNLEdBQUcsR0FBRyxnQkFBZ0IsQ0FBQyxlQUFlLENBQ3hDLGdCQUFnQixFQUFFLGdCQUFnQixDQUFDLE1BQU0sRUFDekMsTUFBTSxDQUFDLFFBQVEsSUFBSSxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVsRCxpQkFBTSxZQUFZLFlBQUMsY0FBTSxPQUFBLEdBQUcsQ0FBQyxPQUFPLEVBQUUsRUFBYixDQUFhLENBQUMsQ0FBQztRQUN4QyxJQUFJLENBQUMsZUFBZSxHQUFHLE1BQU0sQ0FBQztRQUM5QixJQUFJLENBQUMsWUFBWSxHQUFHLEdBQUcsQ0FBQztRQUN4QixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUV4QixPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsOENBQW9CLEdBQXBCLFVBQXdCLE1BQXlCO1FBQWpELGlCQVVDO1FBVEMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM3QixJQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDOUYsaUJBQU0sWUFBWSxZQUFDLGNBQU0sT0FBQSxLQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLEVBQTlCLENBQThCLENBQUMsQ0FBQztRQUV6RCxJQUFJLENBQUMsZUFBZSxHQUFHLE1BQU0sQ0FBQztRQUM5QixJQUFJLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQztRQUM1QixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUU1QixPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDOztnQkExR0YsU0FBUyxTQUFDO29CQUNULFFBQVEsRUFBRSxtQkFBbUI7b0JBQzdCLFFBQVEsRUFBRSxpQkFBaUI7b0JBQzNCLE1BQU0sRUFBRSxDQUFDLHlCQUF5QixDQUFDO2lCQUNwQzs7OztnQkE1REMsd0JBQXdCO2dCQVV4QixnQkFBZ0I7OzsyQkEwRmYsTUFBTTs7SUErRFQsc0JBQUM7Q0FBQSxBQTNHRCxDQUtxQyxnQkFBZ0IsR0FzR3BEO1NBdEdZLGVBQWU7QUF3RzVCOzs7R0FHRztBQUNIO0lBU3lDLCtDQUFlO0lBVHhEOztJQVMwRCxDQUFDOztnQkFUMUQsU0FBUyxTQUFDO29CQUNULFFBQVEsRUFBRSwrQkFBK0I7b0JBQ3pDLFFBQVEsRUFBRSxlQUFlO29CQUN6QixNQUFNLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQztvQkFDakMsU0FBUyxFQUFFLENBQUM7NEJBQ1YsT0FBTyxFQUFFLGVBQWU7NEJBQ3hCLFdBQVcsRUFBRSxtQkFBbUI7eUJBQ2pDLENBQUM7aUJBQ0g7O0lBQ3lELDBCQUFDO0NBQUEsQUFUM0QsQ0FTeUMsZUFBZSxHQUFHO1NBQTlDLG1CQUFtQjtBQUdoQztJQUFBO0lBSTJCLENBQUM7O2dCQUozQixRQUFRLFNBQUM7b0JBQ1IsT0FBTyxFQUFFLENBQUMsU0FBUyxFQUFFLGVBQWUsRUFBRSx1QkFBdUIsRUFBRSxtQkFBbUIsQ0FBQztvQkFDbkYsWUFBWSxFQUFFLENBQUMsU0FBUyxFQUFFLGVBQWUsRUFBRSx1QkFBdUIsRUFBRSxtQkFBbUIsQ0FBQztpQkFDekY7O0lBQzBCLG1CQUFDO0NBQUEsQUFKNUIsSUFJNEI7U0FBZixZQUFZIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcixcbiAgQ29tcG9uZW50UmVmLFxuICBEaXJlY3RpdmUsXG4gIEVtYmVkZGVkVmlld1JlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBOZ01vZHVsZSxcbiAgT25EZXN0cm95LFxuICBPbkluaXQsXG4gIE91dHB1dCxcbiAgVGVtcGxhdGVSZWYsXG4gIFZpZXdDb250YWluZXJSZWYsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtCYXNlUG9ydGFsT3V0bGV0LCBDb21wb25lbnRQb3J0YWwsIFBvcnRhbCwgVGVtcGxhdGVQb3J0YWx9IGZyb20gJy4vcG9ydGFsJztcblxuXG4vKipcbiAqIERpcmVjdGl2ZSB2ZXJzaW9uIG9mIGEgYFRlbXBsYXRlUG9ydGFsYC4gQmVjYXVzZSB0aGUgZGlyZWN0aXZlICppcyogYSBUZW1wbGF0ZVBvcnRhbCxcbiAqIHRoZSBkaXJlY3RpdmUgaW5zdGFuY2UgaXRzZWxmIGNhbiBiZSBhdHRhY2hlZCB0byBhIGhvc3QsIGVuYWJsaW5nIGRlY2xhcmF0aXZlIHVzZSBvZiBwb3J0YWxzLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrUG9ydGFsXScsXG4gIGV4cG9ydEFzOiAnY2RrUG9ydGFsJyxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrUG9ydGFsIGV4dGVuZHMgVGVtcGxhdGVQb3J0YWwge1xuICBjb25zdHJ1Y3Rvcih0ZW1wbGF0ZVJlZjogVGVtcGxhdGVSZWY8YW55Piwgdmlld0NvbnRhaW5lclJlZjogVmlld0NvbnRhaW5lclJlZikge1xuICAgIHN1cGVyKHRlbXBsYXRlUmVmLCB2aWV3Q29udGFpbmVyUmVmKTtcbiAgfVxufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkIFVzZSBgQ2RrUG9ydGFsYCBpbnN0ZWFkLlxuICogQGJyZWFraW5nLWNoYW5nZSA5LjAuMFxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrLXBvcnRhbF0sIFtwb3J0YWxdJyxcbiAgZXhwb3J0QXM6ICdjZGtQb3J0YWwnLFxuICBwcm92aWRlcnM6IFt7XG4gICAgcHJvdmlkZTogQ2RrUG9ydGFsLFxuICAgIHVzZUV4aXN0aW5nOiBUZW1wbGF0ZVBvcnRhbERpcmVjdGl2ZVxuICB9XVxufSlcbmV4cG9ydCBjbGFzcyBUZW1wbGF0ZVBvcnRhbERpcmVjdGl2ZSBleHRlbmRzIENka1BvcnRhbCB7fVxuXG4vKipcbiAqIFBvc3NpYmxlIGF0dGFjaGVkIHJlZmVyZW5jZXMgdG8gdGhlIENka1BvcnRhbE91dGxldC5cbiAqL1xuZXhwb3J0IHR5cGUgQ2RrUG9ydGFsT3V0bGV0QXR0YWNoZWRSZWYgPSBDb21wb25lbnRSZWY8YW55PiB8IEVtYmVkZGVkVmlld1JlZjxhbnk+IHwgbnVsbDtcblxuXG4vKipcbiAqIERpcmVjdGl2ZSB2ZXJzaW9uIG9mIGEgUG9ydGFsT3V0bGV0LiBCZWNhdXNlIHRoZSBkaXJlY3RpdmUgKmlzKiBhIFBvcnRhbE91dGxldCwgcG9ydGFscyBjYW4gYmVcbiAqIGRpcmVjdGx5IGF0dGFjaGVkIHRvIGl0LCBlbmFibGluZyBkZWNsYXJhdGl2ZSB1c2UuXG4gKlxuICogVXNhZ2U6XG4gKiBgPG5nLXRlbXBsYXRlIFtjZGtQb3J0YWxPdXRsZXRdPVwiZ3JlZXRpbmdcIj48L25nLXRlbXBsYXRlPmBcbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka1BvcnRhbE91dGxldF0nLFxuICBleHBvcnRBczogJ2Nka1BvcnRhbE91dGxldCcsXG4gIGlucHV0czogWydwb3J0YWw6IGNka1BvcnRhbE91dGxldCddXG59KVxuZXhwb3J0IGNsYXNzIENka1BvcnRhbE91dGxldCBleHRlbmRzIEJhc2VQb3J0YWxPdXRsZXQgaW1wbGVtZW50cyBPbkluaXQsIE9uRGVzdHJveSB7XG4gIC8qKiBXaGV0aGVyIHRoZSBwb3J0YWwgY29tcG9uZW50IGlzIGluaXRpYWxpemVkLiAqL1xuICBwcml2YXRlIF9pc0luaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgY3VycmVudGx5LWF0dGFjaGVkIGNvbXBvbmVudC92aWV3IHJlZi4gKi9cbiAgcHJpdmF0ZSBfYXR0YWNoZWRSZWY6IENka1BvcnRhbE91dGxldEF0dGFjaGVkUmVmO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBfY29tcG9uZW50RmFjdG9yeVJlc29sdmVyOiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsXG4gICAgICBwcml2YXRlIF92aWV3Q29udGFpbmVyUmVmOiBWaWV3Q29udGFpbmVyUmVmKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIC8qKiBQb3J0YWwgYXNzb2NpYXRlZCB3aXRoIHRoZSBQb3J0YWwgb3V0bGV0LiAqL1xuICBnZXQgcG9ydGFsKCk6IFBvcnRhbDxhbnk+IHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX2F0dGFjaGVkUG9ydGFsO1xuICB9XG5cbiAgc2V0IHBvcnRhbChwb3J0YWw6IFBvcnRhbDxhbnk+IHwgbnVsbCkge1xuICAgIC8vIElnbm9yZSB0aGUgY2FzZXMgd2hlcmUgdGhlIGBwb3J0YWxgIGlzIHNldCB0byBhIGZhbHN5IHZhbHVlIGJlZm9yZSB0aGUgbGlmZWN5Y2xlIGhvb2tzIGhhdmVcbiAgICAvLyBydW4uIFRoaXMgaGFuZGxlcyB0aGUgY2FzZXMgd2hlcmUgdGhlIHVzZXIgbWlnaHQgZG8gc29tZXRoaW5nIGxpa2UgYDxkaXYgY2RrUG9ydGFsT3V0bGV0PmBcbiAgICAvLyBhbmQgYXR0YWNoIGEgcG9ydGFsIHByb2dyYW1tYXRpY2FsbHkgaW4gdGhlIHBhcmVudCBjb21wb25lbnQuIFdoZW4gQW5ndWxhciBkb2VzIHRoZSBmaXJzdCBDRFxuICAgIC8vIHJvdW5kLCBpdCB3aWxsIGZpcmUgdGhlIHNldHRlciB3aXRoIGVtcHR5IHN0cmluZywgY2F1c2luZyB0aGUgdXNlcidzIGNvbnRlbnQgdG8gYmUgY2xlYXJlZC5cbiAgICBpZiAodGhpcy5oYXNBdHRhY2hlZCgpICYmICFwb3J0YWwgJiYgIXRoaXMuX2lzSW5pdGlhbGl6ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oYXNBdHRhY2hlZCgpKSB7XG4gICAgICBzdXBlci5kZXRhY2goKTtcbiAgICB9XG5cbiAgICBpZiAocG9ydGFsKSB7XG4gICAgICBzdXBlci5hdHRhY2gocG9ydGFsKTtcbiAgICB9XG5cbiAgICB0aGlzLl9hdHRhY2hlZFBvcnRhbCA9IHBvcnRhbDtcbiAgfVxuXG4gIC8qKiBFbWl0cyB3aGVuIGEgcG9ydGFsIGlzIGF0dGFjaGVkIHRvIHRoZSBvdXRsZXQuICovXG4gIEBPdXRwdXQoKSBhdHRhY2hlZDogRXZlbnRFbWl0dGVyPENka1BvcnRhbE91dGxldEF0dGFjaGVkUmVmPiA9XG4gICAgICBuZXcgRXZlbnRFbWl0dGVyPENka1BvcnRhbE91dGxldEF0dGFjaGVkUmVmPigpO1xuXG4gIC8qKiBDb21wb25lbnQgb3IgdmlldyByZWZlcmVuY2UgdGhhdCBpcyBhdHRhY2hlZCB0byB0aGUgcG9ydGFsLiAqL1xuICBnZXQgYXR0YWNoZWRSZWYoKTogQ2RrUG9ydGFsT3V0bGV0QXR0YWNoZWRSZWYge1xuICAgIHJldHVybiB0aGlzLl9hdHRhY2hlZFJlZjtcbiAgfVxuXG4gIG5nT25Jbml0KCkge1xuICAgIHRoaXMuX2lzSW5pdGlhbGl6ZWQgPSB0cnVlO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgc3VwZXIuZGlzcG9zZSgpO1xuICAgIHRoaXMuX2F0dGFjaGVkUG9ydGFsID0gbnVsbDtcbiAgICB0aGlzLl9hdHRhY2hlZFJlZiA9IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogQXR0YWNoIHRoZSBnaXZlbiBDb21wb25lbnRQb3J0YWwgdG8gdGhpcyBQb3J0YWxPdXRsZXQgdXNpbmcgdGhlIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlci5cbiAgICpcbiAgICogQHBhcmFtIHBvcnRhbCBQb3J0YWwgdG8gYmUgYXR0YWNoZWQgdG8gdGhlIHBvcnRhbCBvdXRsZXQuXG4gICAqIEByZXR1cm5zIFJlZmVyZW5jZSB0byB0aGUgY3JlYXRlZCBjb21wb25lbnQuXG4gICAqL1xuICBhdHRhY2hDb21wb25lbnRQb3J0YWw8VD4ocG9ydGFsOiBDb21wb25lbnRQb3J0YWw8VD4pOiBDb21wb25lbnRSZWY8VD4ge1xuICAgIHBvcnRhbC5zZXRBdHRhY2hlZEhvc3QodGhpcyk7XG5cbiAgICAvLyBJZiB0aGUgcG9ydGFsIHNwZWNpZmllcyBhbiBvcmlnaW4sIHVzZSB0aGF0IGFzIHRoZSBsb2dpY2FsIGxvY2F0aW9uIG9mIHRoZSBjb21wb25lbnRcbiAgICAvLyBpbiB0aGUgYXBwbGljYXRpb24gdHJlZS4gT3RoZXJ3aXNlIHVzZSB0aGUgbG9jYXRpb24gb2YgdGhpcyBQb3J0YWxPdXRsZXQuXG4gICAgY29uc3Qgdmlld0NvbnRhaW5lclJlZiA9IHBvcnRhbC52aWV3Q29udGFpbmVyUmVmICE9IG51bGwgP1xuICAgICAgICBwb3J0YWwudmlld0NvbnRhaW5lclJlZiA6XG4gICAgICAgIHRoaXMuX3ZpZXdDb250YWluZXJSZWY7XG5cbiAgICBjb25zdCByZXNvbHZlciA9IHBvcnRhbC5jb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgfHwgdGhpcy5fY29tcG9uZW50RmFjdG9yeVJlc29sdmVyO1xuICAgIGNvbnN0IGNvbXBvbmVudEZhY3RvcnkgPSByZXNvbHZlci5yZXNvbHZlQ29tcG9uZW50RmFjdG9yeShwb3J0YWwuY29tcG9uZW50KTtcbiAgICBjb25zdCByZWYgPSB2aWV3Q29udGFpbmVyUmVmLmNyZWF0ZUNvbXBvbmVudChcbiAgICAgICAgY29tcG9uZW50RmFjdG9yeSwgdmlld0NvbnRhaW5lclJlZi5sZW5ndGgsXG4gICAgICAgIHBvcnRhbC5pbmplY3RvciB8fCB2aWV3Q29udGFpbmVyUmVmLmluamVjdG9yKTtcblxuICAgIHN1cGVyLnNldERpc3Bvc2VGbigoKSA9PiByZWYuZGVzdHJveSgpKTtcbiAgICB0aGlzLl9hdHRhY2hlZFBvcnRhbCA9IHBvcnRhbDtcbiAgICB0aGlzLl9hdHRhY2hlZFJlZiA9IHJlZjtcbiAgICB0aGlzLmF0dGFjaGVkLmVtaXQocmVmKTtcblxuICAgIHJldHVybiByZWY7XG4gIH1cblxuICAvKipcbiAgICogQXR0YWNoIHRoZSBnaXZlbiBUZW1wbGF0ZVBvcnRhbCB0byB0aGlzIFBvcnRsSG9zdCBhcyBhbiBlbWJlZGRlZCBWaWV3LlxuICAgKiBAcGFyYW0gcG9ydGFsIFBvcnRhbCB0byBiZSBhdHRhY2hlZC5cbiAgICogQHJldHVybnMgUmVmZXJlbmNlIHRvIHRoZSBjcmVhdGVkIGVtYmVkZGVkIHZpZXcuXG4gICAqL1xuICBhdHRhY2hUZW1wbGF0ZVBvcnRhbDxDPihwb3J0YWw6IFRlbXBsYXRlUG9ydGFsPEM+KTogRW1iZWRkZWRWaWV3UmVmPEM+IHtcbiAgICBwb3J0YWwuc2V0QXR0YWNoZWRIb3N0KHRoaXMpO1xuICAgIGNvbnN0IHZpZXdSZWYgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmNyZWF0ZUVtYmVkZGVkVmlldyhwb3J0YWwudGVtcGxhdGVSZWYsIHBvcnRhbC5jb250ZXh0KTtcbiAgICBzdXBlci5zZXREaXNwb3NlRm4oKCkgPT4gdGhpcy5fdmlld0NvbnRhaW5lclJlZi5jbGVhcigpKTtcblxuICAgIHRoaXMuX2F0dGFjaGVkUG9ydGFsID0gcG9ydGFsO1xuICAgIHRoaXMuX2F0dGFjaGVkUmVmID0gdmlld1JlZjtcbiAgICB0aGlzLmF0dGFjaGVkLmVtaXQodmlld1JlZik7XG5cbiAgICByZXR1cm4gdmlld1JlZjtcbiAgfVxufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkIFVzZSBgQ2RrUG9ydGFsT3V0bGV0YCBpbnN0ZWFkLlxuICogQGJyZWFraW5nLWNoYW5nZSA5LjAuMFxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrUG9ydGFsSG9zdF0sIFtwb3J0YWxIb3N0XScsXG4gIGV4cG9ydEFzOiAnY2RrUG9ydGFsSG9zdCcsXG4gIGlucHV0czogWydwb3J0YWw6IGNka1BvcnRhbEhvc3QnXSxcbiAgcHJvdmlkZXJzOiBbe1xuICAgIHByb3ZpZGU6IENka1BvcnRhbE91dGxldCxcbiAgICB1c2VFeGlzdGluZzogUG9ydGFsSG9zdERpcmVjdGl2ZVxuICB9XVxufSlcbmV4cG9ydCBjbGFzcyBQb3J0YWxIb3N0RGlyZWN0aXZlIGV4dGVuZHMgQ2RrUG9ydGFsT3V0bGV0IHt9XG5cblxuQE5nTW9kdWxlKHtcbiAgZXhwb3J0czogW0Nka1BvcnRhbCwgQ2RrUG9ydGFsT3V0bGV0LCBUZW1wbGF0ZVBvcnRhbERpcmVjdGl2ZSwgUG9ydGFsSG9zdERpcmVjdGl2ZV0sXG4gIGRlY2xhcmF0aW9uczogW0Nka1BvcnRhbCwgQ2RrUG9ydGFsT3V0bGV0LCBUZW1wbGF0ZVBvcnRhbERpcmVjdGl2ZSwgUG9ydGFsSG9zdERpcmVjdGl2ZV0sXG59KVxuZXhwb3J0IGNsYXNzIFBvcnRhbE1vZHVsZSB7fVxuIl19