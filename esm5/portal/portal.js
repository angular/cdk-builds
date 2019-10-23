/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __extends } from "tslib";
import { throwNullPortalOutletError, throwPortalAlreadyAttachedError, throwNoPortalAttachedError, throwNullPortalError, throwPortalOutletAlreadyDisposedError, throwUnknownPortalTypeError } from './portal-errors';
/**
 * A `Portal` is something that you want to render somewhere else.
 * It can be attach to / detached from a `PortalOutlet`.
 */
var Portal = /** @class */ (function () {
    function Portal() {
    }
    /** Attach this portal to a host. */
    Portal.prototype.attach = function (host) {
        if (host == null) {
            throwNullPortalOutletError();
        }
        if (host.hasAttached()) {
            throwPortalAlreadyAttachedError();
        }
        this._attachedHost = host;
        return host.attach(this);
    };
    /** Detach this portal from its host */
    Portal.prototype.detach = function () {
        var host = this._attachedHost;
        if (host == null) {
            throwNoPortalAttachedError();
        }
        else {
            this._attachedHost = null;
            host.detach();
        }
    };
    Object.defineProperty(Portal.prototype, "isAttached", {
        /** Whether this portal is attached to a host. */
        get: function () {
            return this._attachedHost != null;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Sets the PortalOutlet reference without performing `attach()`. This is used directly by
     * the PortalOutlet when it is performing an `attach()` or `detach()`.
     */
    Portal.prototype.setAttachedHost = function (host) {
        this._attachedHost = host;
    };
    return Portal;
}());
export { Portal };
/**
 * A `ComponentPortal` is a portal that instantiates some Component upon attachment.
 */
var ComponentPortal = /** @class */ (function (_super) {
    __extends(ComponentPortal, _super);
    function ComponentPortal(component, viewContainerRef, injector, componentFactoryResolver) {
        var _this = _super.call(this) || this;
        _this.component = component;
        _this.viewContainerRef = viewContainerRef;
        _this.injector = injector;
        _this.componentFactoryResolver = componentFactoryResolver;
        return _this;
    }
    return ComponentPortal;
}(Portal));
export { ComponentPortal };
/**
 * A `TemplatePortal` is a portal that represents some embedded template (TemplateRef).
 */
var TemplatePortal = /** @class */ (function (_super) {
    __extends(TemplatePortal, _super);
    function TemplatePortal(template, viewContainerRef, context) {
        var _this = _super.call(this) || this;
        _this.templateRef = template;
        _this.viewContainerRef = viewContainerRef;
        _this.context = context;
        return _this;
    }
    Object.defineProperty(TemplatePortal.prototype, "origin", {
        get: function () {
            return this.templateRef.elementRef;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Attach the portal to the provided `PortalOutlet`.
     * When a context is provided it will override the `context` property of the `TemplatePortal`
     * instance.
     */
    TemplatePortal.prototype.attach = function (host, context) {
        if (context === void 0) { context = this.context; }
        this.context = context;
        return _super.prototype.attach.call(this, host);
    };
    TemplatePortal.prototype.detach = function () {
        this.context = undefined;
        return _super.prototype.detach.call(this);
    };
    return TemplatePortal;
}(Portal));
export { TemplatePortal };
/**
 * Partial implementation of PortalOutlet that handles attaching
 * ComponentPortal and TemplatePortal.
 */
var BasePortalOutlet = /** @class */ (function () {
    function BasePortalOutlet() {
        /** Whether this host has already been permanently disposed. */
        this._isDisposed = false;
    }
    /** Whether this host has an attached portal. */
    BasePortalOutlet.prototype.hasAttached = function () {
        return !!this._attachedPortal;
    };
    /** Attaches a portal. */
    BasePortalOutlet.prototype.attach = function (portal) {
        if (!portal) {
            throwNullPortalError();
        }
        if (this.hasAttached()) {
            throwPortalAlreadyAttachedError();
        }
        if (this._isDisposed) {
            throwPortalOutletAlreadyDisposedError();
        }
        if (portal instanceof ComponentPortal) {
            this._attachedPortal = portal;
            return this.attachComponentPortal(portal);
        }
        else if (portal instanceof TemplatePortal) {
            this._attachedPortal = portal;
            return this.attachTemplatePortal(portal);
        }
        throwUnknownPortalTypeError();
    };
    /** Detaches a previously attached portal. */
    BasePortalOutlet.prototype.detach = function () {
        if (this._attachedPortal) {
            this._attachedPortal.setAttachedHost(null);
            this._attachedPortal = null;
        }
        this._invokeDisposeFn();
    };
    /** Permanently dispose of this portal host. */
    BasePortalOutlet.prototype.dispose = function () {
        if (this.hasAttached()) {
            this.detach();
        }
        this._invokeDisposeFn();
        this._isDisposed = true;
    };
    /** @docs-private */
    BasePortalOutlet.prototype.setDisposeFn = function (fn) {
        this._disposeFn = fn;
    };
    BasePortalOutlet.prototype._invokeDisposeFn = function () {
        if (this._disposeFn) {
            this._disposeFn();
            this._disposeFn = null;
        }
    };
    return BasePortalOutlet;
}());
export { BasePortalOutlet };
/**
 * @deprecated Use `BasePortalOutlet` instead.
 * @breaking-change 9.0.0
 */
var BasePortalHost = /** @class */ (function (_super) {
    __extends(BasePortalHost, _super);
    function BasePortalHost() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return BasePortalHost;
}(BasePortalOutlet));
export { BasePortalHost };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9ydGFsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9wb3J0YWwvcG9ydGFsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFXSCxPQUFPLEVBQ0gsMEJBQTBCLEVBQzFCLCtCQUErQixFQUMvQiwwQkFBMEIsRUFDMUIsb0JBQW9CLEVBQ3BCLHFDQUFxQyxFQUNyQywyQkFBMkIsRUFDOUIsTUFBTSxpQkFBaUIsQ0FBQztBQU96Qjs7O0dBR0c7QUFDSDtJQUFBO0lBeUNBLENBQUM7SUF0Q0Msb0NBQW9DO0lBQ3BDLHVCQUFNLEdBQU4sVUFBTyxJQUFrQjtRQUN2QixJQUFJLElBQUksSUFBSSxJQUFJLEVBQUU7WUFDaEIsMEJBQTBCLEVBQUUsQ0FBQztTQUM5QjtRQUVELElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFO1lBQ3RCLCtCQUErQixFQUFFLENBQUM7U0FDbkM7UUFFRCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztRQUMxQixPQUFXLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVELHVDQUF1QztJQUN2Qyx1QkFBTSxHQUFOO1FBQ0UsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUU5QixJQUFJLElBQUksSUFBSSxJQUFJLEVBQUU7WUFDaEIsMEJBQTBCLEVBQUUsQ0FBQztTQUM5QjthQUFNO1lBQ0wsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7WUFDMUIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQ2Y7SUFDSCxDQUFDO0lBR0Qsc0JBQUksOEJBQVU7UUFEZCxpREFBaUQ7YUFDakQ7WUFDRSxPQUFPLElBQUksQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDO1FBQ3BDLENBQUM7OztPQUFBO0lBRUQ7OztPQUdHO0lBQ0gsZ0NBQWUsR0FBZixVQUFnQixJ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Q0FBQztTQUM3QjtRQUVELElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQzFCLENBQUM7SUFFRCwrQ0FBK0M7SUFDL0Msa0NBQU8sR0FBUDtRQUNFLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFO1lBQ3RCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUNmO1FBRUQsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7SUFDMUIsQ0FBQztJQUVELG9CQUFvQjtJQUNwQix1Q0FBWSxHQUFaLFVBQWEsRUFBYztRQUN6QixJQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQztJQUN2QixDQUFDO0lBRU8sMkNBQWdCLEdBQXhCO1FBQ0UsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ25CLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNsQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztTQUN4QjtJQUNILENBQUM7SUFDSCx1QkFBQztBQUFELENBQUMsQUEvRUQsSUErRUM7O0FBRUQ7OztHQUdHO0FBQ0g7SUFBNkMsa0NBQWdCO0lBQTdEOztJQUErRCxDQUFDO0lBQUQscUJBQUM7QUFBRCxDQUFDLEFBQWhFLENBQTZDLGdCQUFnQixHQUFHIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gICAgVGVtcGxhdGVSZWYsXG4gICAgVmlld0NvbnRhaW5lclJlZixcbiAgICBFbGVtZW50UmVmLFxuICAgIENvbXBvbmVudFJlZixcbiAgICBFbWJlZGRlZFZpZXdSZWYsXG4gICAgSW5qZWN0b3IsXG4gICAgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7XG4gICAgdGhyb3dOdWxsUG9ydGFsT3V0bGV0RXJyb3IsXG4gICAgdGhyb3dQb3J0YWxBbHJlYWR5QXR0YWNoZWRFcnJvcixcbiAgICB0aHJvd05vUG9ydGFsQXR0YWNoZWRFcnJvcixcbiAgICB0aHJvd051bGxQb3J0YWxFcnJvcixcbiAgICB0aHJvd1BvcnRhbE91dGxldEFscmVhZHlEaXNwb3NlZEVycm9yLFxuICAgIHRocm93VW5rbm93blBvcnRhbFR5cGVFcnJvclxufSBmcm9tICcuL3BvcnRhbC1lcnJvcnMnO1xuXG4vKiogSW50ZXJmYWNlIHRoYXQgY2FuIGJlIHVzZWQgdG8gZ2VuZXJpY2FsbHkgdHlwZSBhIGNsYXNzLiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb21wb25lbnRUeXBlPFQ+IHtcbiAgbmV3ICguLi5hcmdzOiBhbnlbXSk6IFQ7XG59XG5cbi8qKlxuICogQSBgUG9ydGFsYCBpcyBzb21ldGhpbmcgdGhhdCB5b3Ugd2FudCB0byByZW5kZXIgc29tZXdoZXJlIGVsc2UuXG4gKiBJdCBjYW4gYmUgYXR0YWNoIHRvIC8gZGV0YWNoZWQgZnJvbSBhIGBQb3J0YWxPdXRsZXRgLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgUG9ydGFsPFQ+IHtcbiAgcHJpdmF0ZSBfYXR0YWNoZWRIb3N0OiBQb3J0YWxPdXRsZXQgfCBudWxsO1xuXG4gIC8qKiBBdHRhY2ggdGhpcyBwb3J0YWwgdG8gYSBob3N0LiAqL1xuICBhdHRhY2goaG9zdDogUG9ydGFsT3V0bGV0KTogVCB7XG4gICAgaWYgKGhvc3QgPT0gbnVsbCkge1xuICAgICAgdGhyb3dOdWxsUG9ydGFsT3V0bGV0RXJyb3IoKTtcbiAgICB9XG5cbiAgICBpZiAoaG9zdC5oYXNBdHRhY2hlZCgpKSB7XG4gICAgICB0aHJvd1BvcnRhbEFscmVhZHlBdHRhY2hlZEVycm9yKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fYXR0YWNoZWRIb3N0ID0gaG9zdDtcbiAgICByZXR1cm4gPFQ+IGhvc3QuYXR0YWNoKHRoaXMpO1xuICB9XG5cbiAgLyoqIERldGFjaCB0aGlzIHBvcnRhbCBmcm9tIGl0cyBob3N0ICovXG4gIGRldGFjaCgpOiB2b2lkIHtcbiAgICBsZXQgaG9zdCA9IHRoaXMuX2F0dGFjaGVkSG9zdDtcblxuICAgIGlmIChob3N0ID09IG51bGwpIHtcbiAgICAgIHRocm93Tm9Qb3J0YWxBdHRhY2hlZEVycm9yKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2F0dGFjaGVkSG9zdCA9IG51bGw7XG4gICAgICBob3N0LmRldGFjaCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBXaGV0aGVyIHRoaXMgcG9ydGFsIGlzIGF0dGFjaGVkIHRvIGEgaG9zdC4gKi9cbiAgZ2V0IGlzQXR0YWNoZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2F0dGFjaGVkSG9zdCAhPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIFBvcnRhbE91dGxldCByZWZlcmVuY2Ugd2l0aG91dCBwZXJmb3JtaW5nIGBhdHRhY2goKWAuIFRoaXMgaXMgdXNlZCBkaXJlY3RseSBieVxuICAgKiB0aGUgUG9ydGFsT3V0bGV0IHdoZW4gaXQgaXMgcGVyZm9ybWluZyBhbiBgYXR0YWNoKClgIG9yIGBkZXRhY2goKWAuXG4gICAqL1xuICBzZXRBdHRhY2hlZEhvc3QoaG9zdDogUG9ydGFsT3V0bGV0IHwgbnVsbCkge1xuICAgIHRoaXMuX2F0dGFjaGVkSG9zdCA9IGhvc3Q7XG4gIH1cbn1cblxuXG4vKipcbiAqIEEgYENvbXBvbmVudFBvcnRhbGAgaXMgYSBwb3J0YWwgdGhhdCBpbnN0YW50aWF0ZXMgc29tZSBDb21wb25lbnQgdXBvbiBhdHRhY2htZW50LlxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50UG9ydGFsPFQ+IGV4dGVuZHMgUG9ydGFsPENvbXBvbmVudFJlZjxUPj4ge1xuICAvKiogVGhlIHR5cGUgb2YgdGhlIGNvbXBvbmVudCB0aGF0IHdpbGwgYmUgaW5zdGFudGlhdGVkIGZvciBhdHRhY2htZW50LiAqL1xuICBjb21wb25lbnQ6IENvbXBvbmVudFR5cGU8VD47XG5cbiAgLyoqXG4gICAqIFtPcHRpb25hbF0gV2hlcmUgdGhlIGF0dGFjaGVkIGNvbXBvbmVudCBzaG91bGQgbGl2ZSBpbiBBbmd1bGFyJ3MgKmxvZ2ljYWwqIGNvbXBvbmVudCB0cmVlLlxuICAgKiBUaGlzIGlzIGRpZmZlcmVudCBmcm9tIHdoZXJlIHRoZSBjb21wb25lbnQgKnJlbmRlcnMqLCB3aGljaCBpcyBkZXRlcm1pbmVkIGJ5IHRoZSBQb3J0YWxPdXRsZXQuXG4gICAqIFRoZSBvcmlnaW4gaXMgbmVjZXNzYXJ5IHdoZW4gdGhlIGhvc3QgaXMgb3V0c2lkZSBvZiB0aGUgQW5ndWxhciBhcHBsaWNhdGlvbiBjb250ZXh0LlxuICAgKi9cbiAgdmlld0NvbnRhaW5lclJlZj86IFZpZXdDb250YWluZXJSZWYgfCBudWxsO1xuXG4gIC8qKiBbT3B0aW9uYWxdIEluamVjdG9yIHVzZWQgZm9yIHRoZSBpbnN0YW50aWF0aW9uIG9mIHRoZSBjb21wb25lbnQuICovXG4gIGluamVjdG9yPzogSW5qZWN0b3IgfCBudWxsO1xuXG4gIC8qKlxuICAgKiBBbHRlcm5hdGUgYENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcmAgdG8gdXNlIHdoZW4gcmVzb2x2aW5nIHRoZSBhc3NvY2lhdGVkIGNvbXBvbmVudC5cbiAgICogRGVmYXVsdHMgdG8gdXNpbmcgdGhlIHJlc29sdmVyIGZyb20gdGhlIG91dGxldCB0aGF0IHRoZSBwb3J0YWwgaXMgYXR0YWNoZWQgdG8uXG4gICAqL1xuICBjb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI/OiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgfCBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgY29tcG9uZW50OiBDb21wb25lbnRUeXBlPFQ+LFxuICAgICAgdmlld0NvbnRhaW5lclJlZj86IFZpZXdDb250YWluZXJSZWYgfCBudWxsLFxuICAgICAgaW5qZWN0b3I/OiBJbmplY3RvciB8IG51bGwsXG4gICAgICBjb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI/OiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgfCBudWxsKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNvbXBvbmVudCA9IGNvbXBvbmVudDtcbiAgICB0aGlzLnZpZXdDb250YWluZXJSZWYgPSB2aWV3Q29udGFpbmVyUmVmO1xuICAgIHRoaXMuaW5qZWN0b3IgPSBpbmplY3RvcjtcbiAgICB0aGlzLmNvbXBvbmVudEZhY3RvcnlSZXNvbHZlciA9IGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjtcbiAgfVxufVxuXG4vKipcbiAqIEEgYFRlbXBsYXRlUG9ydGFsYCBpcyBhIHBvcnRhbCB0aGF0IHJlcHJlc2VudHMgc29tZSBlbWJlZGRlZCB0ZW1wbGF0ZSAoVGVtcGxhdGVSZWYpLlxuICovXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVQb3J0YWw8QyA9IGFueT4gZXh0ZW5kcyBQb3J0YWw8RW1iZWRkZWRWaWV3UmVmPEM+PiB7XG4gIC8qKiBUaGUgZW1iZWRkZWQgdGVtcGxhdGUgdGhhdCB3aWxsIGJlIHVzZWQgdG8gaW5zdGFudGlhdGUgYW4gZW1iZWRkZWQgVmlldyBpbiB0aGUgaG9zdC4gKi9cbiAgdGVtcGxhdGVSZWY6IFRlbXBsYXRlUmVmPEM+O1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIFZpZXdDb250YWluZXIgaW50byB3aGljaCB0aGUgdGVtcGxhdGUgd2lsbCBiZSBzdGFtcGVkIG91dC4gKi9cbiAgdmlld0NvbnRhaW5lclJlZjogVmlld0NvbnRhaW5lclJlZjtcblxuICAvKiogQ29udGV4dHVhbCBkYXRhIHRvIGJlIHBhc3NlZCBpbiB0byB0aGUgZW1iZWRkZWQgdmlldy4gKi9cbiAgY29udGV4dDogQyB8IHVuZGVmaW5lZDtcblxuICBjb25zdHJ1Y3Rvcih0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8Qz4sIHZpZXdDb250YWluZXJSZWY6IFZpZXdDb250YWluZXJSZWYsIGNvbnRleHQ/OiBDKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnRlbXBsYXRlUmVmID0gdGVtcGxhdGU7XG4gICAgdGhpcy52aWV3Q29udGFpbmVyUmVmID0gdmlld0NvbnRhaW5lclJlZjtcbiAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICB9XG5cbiAgZ2V0IG9yaWdpbigpOiBFbGVtZW50UmVmIHtcbiAgICByZXR1cm4gdGhpcy50ZW1wbGF0ZVJlZi5lbGVtZW50UmVmO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGFjaCB0aGUgcG9ydGFsIHRvIHRoZSBwcm92aWRlZCBgUG9ydGFsT3V0bGV0YC5cbiAgICogV2hlbiBhIGNvbnRleHQgaXMgcHJvdmlkZWQgaXQgd2lsbCBvdmVycmlkZSB0aGUgYGNvbnRleHRgIHByb3BlcnR5IG9mIHRoZSBgVGVtcGxhdGVQb3J0YWxgXG4gICAqIGluc3RhbmNlLlxuICAgKi9cbiAgYXR0YWNoKGhvc3Q6IFBvcnRhbE91dGxldCwgY29udGV4dDogQyB8IHVuZGVmaW5lZCA9IHRoaXMuY29udGV4dCk6IEVtYmVkZGVkVmlld1JlZjxDPiB7XG4gICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICByZXR1cm4gc3VwZXIuYXR0YWNoKGhvc3QpO1xuICB9XG5cbiAgZGV0YWNoKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGV4dCA9IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gc3VwZXIuZGV0YWNoKCk7XG4gIH1cbn1cblxuXG4vKiogQSBgUG9ydGFsT3V0bGV0YCBpcyBhbiBzcGFjZSB0aGF0IGNhbiBjb250YWluIGEgc2luZ2xlIGBQb3J0YWxgLiAqL1xuZXhwb3J0IGludGVyZmFjZSBQb3J0YWxPdXRsZXQge1xuICAvKiogQXR0YWNoZXMgYSBwb3J0YWwgdG8gdGhpcyBvdXRsZXQuICovXG4gIGF0dGFjaChwb3J0YWw6IFBvcnRhbDxhbnk+KTogYW55O1xuXG4gIC8qKiBEZXRhY2hlcyB0aGUgY3VycmVudGx5IGF0dGFjaGVkIHBvcnRhbCBmcm9tIHRoaXMgb3V0bGV0LiAqL1xuICBkZXRhY2goKTogYW55O1xuXG4gIC8qKiBQZXJmb3JtcyBjbGVhbnVwIGJlZm9yZSB0aGUgb3V0bGV0IGlzIGRlc3Ryb3llZC4gKi9cbiAgZGlzcG9zZSgpOiB2b2lkO1xuXG4gIC8qKiBXaGV0aGVyIHRoZXJlIGlzIGN1cnJlbnRseSBhIHBvcnRhbCBhdHRhY2hlZCB0byB0aGlzIG91dGxldC4gKi9cbiAgaGFzQXR0YWNoZWQoKTogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBAZGVwcmVjYXRlZCBVc2UgYFBvcnRhbE91dGxldGAgaW5zdGVhZC5cbiAqIEBicmVha2luZy1jaGFuZ2UgOS4wLjBcbiAqL1xuZXhwb3J0IHR5cGUgUG9ydGFsSG9zdCA9IFBvcnRhbE91dGxldDtcblxuLyoqXG4gKiBQYXJ0aWFsIGltcGxlbWVudGF0aW9uIG9mIFBvcnRhbE91dGxldCB0aGF0IGhhbmRsZXMgYXR0YWNoaW5nXG4gKiBDb21wb25lbnRQb3J0YWwgYW5kIFRlbXBsYXRlUG9ydGFsLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQmFzZVBvcnRhbE91dGxldCBpbXBsZW1lbnRzIFBvcnRhbE91dGxldCB7XG4gIC8qKiBUaGUgcG9ydGFsIGN1cnJlbnRseSBhdHRhY2hlZCB0byB0aGUgaG9zdC4gKi9cbiAgcHJvdGVjdGVkIF9hdHRhY2hlZFBvcnRhbDogUG9ydGFsPGFueT4gfCBudWxsO1xuXG4gIC8qKiBBIGZ1bmN0aW9uIHRoYXQgd2lsbCBwZXJtYW5lbnRseSBkaXNwb3NlIHRoaXMgaG9zdC4gKi9cbiAgcHJpdmF0ZSBfZGlzcG9zZUZuOiAoKCkgPT4gdm9pZCkgfCBudWxsO1xuXG4gIC8qKiBXaGV0aGVyIHRoaXMgaG9zdCBoYXMgYWxyZWFkeSBiZWVuIHBlcm1hbmVudGx5IGRpc3Bvc2VkLiAqL1xuICBwcml2YXRlIF9pc0Rpc3Bvc2VkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgdGhpcyBob3N0IGhhcyBhbiBhdHRhY2hlZCBwb3J0YWwuICovXG4gIGhhc0F0dGFjaGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMuX2F0dGFjaGVkUG9ydGFsO1xuICB9XG5cbiAgYXR0YWNoPFQ+KHBvcnRhbDogQ29tcG9uZW50UG9ydGFsPFQ+KTogQ29tcG9uZW50UmVmPFQ+O1xuICBhdHRhY2g8VD4ocG9ydGFsOiBUZW1wbGF0ZVBvcnRhbDxUPik6IEVtYmVkZGVkVmlld1JlZjxUPjtcbiAgYXR0YWNoKHBvcnRhbDogYW55KTogYW55O1xuXG4gIC8qKiBBdHRhY2hlcyBhIHBvcnRhbC4gKi9cbiAgYXR0YWNoKHBvcnRhbDogUG9ydGFsPGFueT4pOiBhbnkge1xuICAgIGlmICghcG9ydGFsKSB7XG4gICAgICB0aHJvd051bGxQb3J0YWxFcnJvcigpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhc0F0dGFjaGVkKCkpIHtcbiAgICAgIHRocm93UG9ydGFsQWxyZWFkeUF0dGFjaGVkRXJyb3IoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5faXNEaXNwb3NlZCkge1xuICAgICAgdGhyb3dQb3J0YWxPdXRsZXRBbHJlYWR5RGlzcG9zZWRFcnJvcigpO1xuICAgIH1cblxuICAgIGlmIChwb3J0YWwgaW5zdGFuY2VvZiBDb21wb25lbnRQb3J0YWwpIHtcbiAgICAgIHRoaXMuX2F0dGFjaGVkUG9ydGFsID0gcG9ydGFsO1xuICAgICAgcmV0dXJuIHRoaXMuYXR0YWNoQ29tcG9uZW50UG9ydGFsKHBvcnRhbCk7XG4gICAgfSBlbHNlIGlmIChwb3J0YWwgaW5zdGFuY2VvZiBUZW1wbGF0ZVBvcnRhbCkge1xuICAgICAgdGhpcy5fYXR0YWNoZWRQb3J0YWwgPSBwb3J0YWw7XG4gICAgICByZXR1cm4gdGhpcy5hdHRhY2hUZW1wbGF0ZVBvcnRhbChwb3J0YWwpO1xuICAgIH1cblxuICAgIHRocm93VW5rbm93blBvcnRhbFR5cGVFcnJvcigpO1xuICB9XG5cbiAgYWJzdHJhY3QgYXR0YWNoQ29tcG9uZW50UG9ydGFsPFQ+KHBvcnRhbDogQ29tcG9uZW50UG9ydGFsPFQ+KTogQ29tcG9uZW50UmVmPFQ+O1xuXG4gIGFic3RyYWN0IGF0dGFjaFRlbXBsYXRlUG9ydGFsPEM+KHBvcnRhbDogVGVtcGxhdGVQb3J0YWw8Qz4pOiBFbWJlZGRlZFZpZXdSZWY8Qz47XG5cbiAgLyoqIERldGFjaGVzIGEgcHJldmlvdXNseSBhdHRhY2hlZCBwb3J0YWwuICovXG4gIGRldGFjaCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fYXR0YWNoZWRQb3J0YWwpIHtcbiAgICAgIHRoaXMuX2F0dGFjaGVkUG9ydGFsLnNldEF0dGFjaGVkSG9zdChudWxsKTtcbiAgICAgIHRoaXMuX2F0dGFjaGVkUG9ydGFsID0gbnVsbDtcbiAgICB9XG5cbiAgICB0aGlzLl9pbnZva2VEaXNwb3NlRm4oKTtcbiAgfVxuXG4gIC8qKiBQZXJtYW5lbnRseSBkaXNwb3NlIG9mIHRoaXMgcG9ydGFsIGhvc3QuICovXG4gIGRpc3Bvc2UoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaGFzQXR0YWNoZWQoKSkge1xuICAgICAgdGhpcy5kZXRhY2goKTtcbiAgICB9XG5cbiAgICB0aGlzLl9pbnZva2VEaXNwb3NlRm4oKTtcbiAgICB0aGlzLl9pc0Rpc3Bvc2VkID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKiBAZG9jcy1wcml2YXRlICovXG4gIHNldERpc3Bvc2VGbihmbjogKCkgPT4gdm9pZCkge1xuICAgIHRoaXMuX2Rpc3Bvc2VGbiA9IGZuO1xuICB9XG5cbiAgcHJpdmF0ZSBfaW52b2tlRGlzcG9zZUZuKCkge1xuICAgIGlmICh0aGlzLl9kaXNwb3NlRm4pIHtcbiAgICAgIHRoaXMuX2Rpc3Bvc2VGbigpO1xuICAgICAgdGhpcy5fZGlzcG9zZUZuID0gbnVsbDtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBAZGVwcmVjYXRlZCBVc2UgYEJhc2VQb3J0YWxPdXRsZXRgIGluc3RlYWQuXG4gKiBAYnJlYWtpbmctY2hhbmdlIDkuMC4wXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBCYXNlUG9ydGFsSG9zdCBleHRlbmRzIEJhc2VQb3J0YWxPdXRsZXQge31cbiJdfQ==