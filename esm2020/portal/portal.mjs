/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef, } from '@angular/core';
import { throwNullPortalOutletError, throwPortalAlreadyAttachedError, throwNoPortalAttachedError, throwNullPortalError, throwPortalOutletAlreadyDisposedError, throwUnknownPortalTypeError, } from './portal-errors';
/**
 * A `Portal` is something that you want to render somewhere else.
 * It can be attach to / detached from a `PortalOutlet`.
 */
export class Portal {
    /** Attach this portal to a host. */
    attach(host) {
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            if (host == null) {
                throwNullPortalOutletError();
            }
            if (host.hasAttached()) {
                throwPortalAlreadyAttachedError();
            }
        }
        this._attachedHost = host;
        return host.attach(this);
    }
    /** Detach this portal from its host */
    detach() {
        let host = this._attachedHost;
        if (host != null) {
            this._attachedHost = null;
            host.detach();
        }
        else if (typeof ngDevMode === 'undefined' || ngDevMode) {
            throwNoPortalAttachedError();
        }
    }
    /** Whether this portal is attached to a host. */
    get isAttached() {
        return this._attachedHost != null;
    }
    /**
     * Sets the PortalOutlet reference without performing `attach()`. This is used directly by
     * the PortalOutlet when it is performing an `attach()` or `detach()`.
     */
    setAttachedHost(host) {
        this._attachedHost = host;
    }
}
/**
 * A `ComponentPortal` is a portal that instantiates some Component upon attachment.
 */
export class ComponentPortal extends Portal {
    constructor(component, viewContainerRef, injector, componentFactoryResolver) {
        super();
        this.component = component;
        this.viewContainerRef = viewContainerRef;
        this.injector = injector;
        this.componentFactoryResolver = componentFactoryResolver;
    }
}
/**
 * A `TemplatePortal` is a portal that represents some embedded template (TemplateRef).
 */
export class TemplatePortal extends Portal {
    constructor(
    /** The embedded template that will be used to instantiate an embedded View in the host. */
    templateRef, 
    /** Reference to the ViewContainer into which the template will be stamped out. */
    viewContainerRef, 
    /** Contextual data to be passed in to the embedded view. */
    context, 
    /** The injector to use for the embedded view. */
    injector) {
        super();
        this.templateRef = templateRef;
        this.viewContainerRef = viewContainerRef;
        this.context = context;
        this.injector = injector;
    }
    get origin() {
        return this.templateRef.elementRef;
    }
    /**
     * Attach the portal to the provided `PortalOutlet`.
     * When a context is provided it will override the `context` property of the `TemplatePortal`
     * instance.
     */
    attach(host, context = this.context) {
        this.context = context;
        return super.attach(host);
    }
    detach() {
        this.context = undefined;
        return super.detach();
    }
}
/**
 * A `DomPortal` is a portal whose DOM element will be taken from its current position
 * in the DOM and moved into a portal outlet, when it is attached. On detach, the content
 * will be restored to its original position.
 */
export class DomPortal extends Portal {
    constructor(element) {
        super();
        this.element = element instanceof ElementRef ? element.nativeElement : element;
    }
}
/**
 * Partial implementation of PortalOutlet that handles attaching
 * ComponentPortal and TemplatePortal.
 */
export class BasePortalOutlet {
    constructor() {
        /** Whether this host has already been permanently disposed. */
        this._isDisposed = false;
        // @breaking-change 10.0.0 `attachDomPortal` to become a required abstract method.
        this.attachDomPortal = null;
    }
    /** Whether this host has an attached portal. */
    hasAttached() {
        return !!this._attachedPortal;
    }
    /** Attaches a portal. */
    attach(portal) {
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            if (!portal) {
                throwNullPortalError();
            }
            if (this.hasAttached()) {
                throwPortalAlreadyAttachedError();
            }
            if (this._isDisposed) {
                throwPortalOutletAlreadyDisposedError();
            }
        }
        if (portal instanceof ComponentPortal) {
            this._attachedPortal = portal;
            return this.attachComponentPortal(portal);
        }
        else if (portal instanceof TemplatePortal) {
            this._attachedPortal = portal;
            return this.attachTemplatePortal(portal);
            // @breaking-change 10.0.0 remove null check for `this.attachDomPortal`.
        }
        else if (this.attachDomPortal && portal instanceof DomPortal) {
            this._attachedPortal = portal;
            return this.attachDomPortal(portal);
        }
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            throwUnknownPortalTypeError();
        }
    }
    /** Detaches a previously attached portal. */
    detach() {
        if (this._attachedPortal) {
            this._attachedPortal.setAttachedHost(null);
            this._attachedPortal = null;
        }
        this._invokeDisposeFn();
    }
    /** Permanently dispose of this portal host. */
    dispose() {
        if (this.hasAttached()) {
            this.detach();
        }
        this._invokeDisposeFn();
        this._isDisposed = true;
    }
    /** @docs-private */
    setDisposeFn(fn) {
        this._disposeFn = fn;
    }
    _invokeDisposeFn() {
        if (this._disposeFn) {
            this._disposeFn();
            this._disposeFn = null;
        }
    }
}
/**
 * @deprecated Use `BasePortalOutlet` instead.
 * @breaking-change 9.0.0
 */
export class BasePortalHost extends BasePortalOutlet {
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9ydGFsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9wb3J0YWwvcG9ydGFsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFHTCxVQUFVLEdBS1gsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUNMLDBCQUEwQixFQUMxQiwrQkFBK0IsRUFDL0IsMEJBQTBCLEVBQzFCLG9CQUFvQixFQUNwQixxQ0FBcUMsRUFDckMsMkJBQTJCLEdBQzVCLE1BQU0saUJBQWlCLENBQUM7QUFPekI7OztHQUdHO0FBQ0gsTUFBTSxPQUFnQixNQUFNO0lBRzFCLG9DQUFvQztJQUNwQyxNQUFNLENBQUMsSUFBa0I7UUFDdkIsSUFBSSxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxFQUFFO1lBQ2pELElBQUksSUFBSSxJQUFJLElBQUksRUFBRTtnQkFDaEIsMEJBQTBCLEVBQUUsQ0FBQzthQUM5QjtZQUVELElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFO2dCQUN0QiwrQkFBK0IsRUFBRSxDQUFDO2FBQ25DO1NBQ0Y7UUFFRCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztRQUMxQixPQUFVLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUVELHVDQUF1QztJQUN2QyxNQUFNO1FBQ0osSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUU5QixJQUFJLElBQUksSUFBSSxJQUFJLEVBQUU7WUFDaEIsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7WUFDMUIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQ2Y7YUFBTSxJQUFJLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLEVBQUU7WUFDeEQsMEJBQTBCLEVBQUUsQ0FBQztTQUM5QjtJQUNILENBQUM7SUFFRCxpREFBaUQ7SUFDakQs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Q2xCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1NBQ3hCO0lBQ0gsQ0FBQztDQUNGO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxPQUFnQixjQUFlLFNBQVEsZ0JBQWdCO0NBQUciLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgVGVtcGxhdGVSZWYsXG4gIFZpZXdDb250YWluZXJSZWYsXG4gIEVsZW1lbnRSZWYsXG4gIENvbXBvbmVudFJlZixcbiAgRW1iZWRkZWRWaWV3UmVmLFxuICBJbmplY3RvcixcbiAgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7XG4gIHRocm93TnVsbFBvcnRhbE91dGxldEVycm9yLFxuICB0aHJvd1BvcnRhbEFscmVhZHlBdHRhY2hlZEVycm9yLFxuICB0aHJvd05vUG9ydGFsQXR0YWNoZWRFcnJvcixcbiAgdGhyb3dOdWxsUG9ydGFsRXJyb3IsXG4gIHRocm93UG9ydGFsT3V0bGV0QWxyZWFkeURpc3Bvc2VkRXJyb3IsXG4gIHRocm93VW5rbm93blBvcnRhbFR5cGVFcnJvcixcbn0gZnJvbSAnLi9wb3J0YWwtZXJyb3JzJztcblxuLyoqIEludGVyZmFjZSB0aGF0IGNhbiBiZSB1c2VkIHRvIGdlbmVyaWNhbGx5IHR5cGUgYSBjbGFzcy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcG9uZW50VHlwZTxUPiB7XG4gIG5ldyAoLi4uYXJnczogYW55W10pOiBUO1xufVxuXG4vKipcbiAqIEEgYFBvcnRhbGAgaXMgc29tZXRoaW5nIHRoYXQgeW91IHdhbnQgdG8gcmVuZGVyIHNvbWV3aGVyZSBlbHNlLlxuICogSXQgY2FuIGJlIGF0dGFjaCB0byAvIGRldGFjaGVkIGZyb20gYSBgUG9ydGFsT3V0bGV0YC5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFBvcnRhbDxUPiB7XG4gIHByaXZhdGUgX2F0dGFjaGVkSG9zdDogUG9ydGFsT3V0bGV0IHwgbnVsbDtcblxuICAvKiogQXR0YWNoIHRoaXMgcG9ydGFsIHRvIGEgaG9zdC4gKi9cbiAgYXR0YWNoKGhvc3Q6IFBvcnRhbE91dGxldCk6IFQge1xuICAgIGlmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpIHtcbiAgICAgIGlmIChob3N0ID09IG51bGwpIHtcbiAgICAgICAgdGhyb3dOdWxsUG9ydGFsT3V0bGV0RXJyb3IoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGhvc3QuaGFzQXR0YWNoZWQoKSkge1xuICAgICAgICB0aHJvd1BvcnRhbEFscmVhZHlBdHRhY2hlZEVycm9yKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fYXR0YWNoZWRIb3N0ID0gaG9zdDtcbiAgICByZXR1cm4gPFQ+aG9zdC5hdHRhY2godGhpcyk7XG4gIH1cblxuICAvKiogRGV0YWNoIHRoaXMgcG9ydGFsIGZyb20gaXRzIGhvc3QgKi9cbiAgZGV0YWNoKCk6IHZvaWQge1xuICAgIGxldCBob3N0ID0gdGhpcy5fYXR0YWNoZWRIb3N0O1xuXG4gICAgaWYgKGhvc3QgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fYXR0YWNoZWRIb3N0ID0gbnVsbDtcbiAgICAgIGhvc3QuZGV0YWNoKCk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpIHtcbiAgICAgIHRocm93Tm9Qb3J0YWxBdHRhY2hlZEVycm9yKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhpcyBwb3J0YWwgaXMgYXR0YWNoZWQgdG8gYSBob3N0LiAqL1xuICBnZXQgaXNBdHRhY2hlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fYXR0YWNoZWRIb3N0ICE9IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgUG9ydGFsT3V0bGV0IHJlZmVyZW5jZSB3aXRob3V0IHBlcmZvcm1pbmcgYGF0dGFjaCgpYC4gVGhpcyBpcyB1c2VkIGRpcmVjdGx5IGJ5XG4gICAqIHRoZSBQb3J0YWxPdXRsZXQgd2hlbiBpdCBpcyBwZXJmb3JtaW5nIGFuIGBhdHRhY2goKWAgb3IgYGRldGFjaCgpYC5cbiAgICovXG4gIHNldEF0dGFjaGVkSG9zdChob3N0OiBQb3J0YWxPdXRsZXQgfCBudWxsKSB7XG4gICAgdGhpcy5fYXR0YWNoZWRIb3N0ID0gaG9zdDtcbiAgfVxufVxuXG4vKipcbiAqIEEgYENvbXBvbmVudFBvcnRhbGAgaXMgYSBwb3J0YWwgdGhhdCBpbnN0YW50aWF0ZXMgc29tZSBDb21wb25lbnQgdXBvbiBhdHRhY2htZW50LlxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50UG9ydGFsPFQ+IGV4dGVuZHMgUG9ydGFsPENvbXBvbmVudFJlZjxUPj4ge1xuICAvKiogVGhlIHR5cGUgb2YgdGhlIGNvbXBvbmVudCB0aGF0IHdpbGwgYmUgaW5zdGFudGlhdGVkIGZvciBhdHRhY2htZW50LiAqL1xuICBjb21wb25lbnQ6IENvbXBvbmVudFR5cGU8VD47XG5cbiAgLyoqXG4gICAqIFtPcHRpb25hbF0gV2hlcmUgdGhlIGF0dGFjaGVkIGNvbXBvbmVudCBzaG91bGQgbGl2ZSBpbiBBbmd1bGFyJ3MgKmxvZ2ljYWwqIGNvbXBvbmVudCB0cmVlLlxuICAgKiBUaGlzIGlzIGRpZmZlcmVudCBmcm9tIHdoZXJlIHRoZSBjb21wb25lbnQgKnJlbmRlcnMqLCB3aGljaCBpcyBkZXRlcm1pbmVkIGJ5IHRoZSBQb3J0YWxPdXRsZXQuXG4gICAqIFRoZSBvcmlnaW4gaXMgbmVjZXNzYXJ5IHdoZW4gdGhlIGhvc3QgaXMgb3V0c2lkZSBvZiB0aGUgQW5ndWxhciBhcHBsaWNhdGlvbiBjb250ZXh0LlxuICAgKi9cbiAgdmlld0NvbnRhaW5lclJlZj86IFZpZXdDb250YWluZXJSZWYgfCBudWxsO1xuXG4gIC8qKiBbT3B0aW9uYWxdIEluamVjdG9yIHVzZWQgZm9yIHRoZSBpbnN0YW50aWF0aW9uIG9mIHRoZSBjb21wb25lbnQuICovXG4gIGluamVjdG9yPzogSW5qZWN0b3IgfCBudWxsO1xuXG4gIC8qKlxuICAgKiBBbHRlcm5hdGUgYENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcmAgdG8gdXNlIHdoZW4gcmVzb2x2aW5nIHRoZSBhc3NvY2lhdGVkIGNvbXBvbmVudC5cbiAgICogRGVmYXVsdHMgdG8gdXNpbmcgdGhlIHJlc29sdmVyIGZyb20gdGhlIG91dGxldCB0aGF0IHRoZSBwb3J0YWwgaXMgYXR0YWNoZWQgdG8uXG4gICAqL1xuICBjb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI/OiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgfCBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGNvbXBvbmVudDogQ29tcG9uZW50VHlwZTxUPixcbiAgICB2aWV3Q29udGFpbmVyUmVmPzogVmlld0NvbnRhaW5lclJlZiB8IG51bGwsXG4gICAgaW5qZWN0b3I/OiBJbmplY3RvciB8IG51bGwsXG4gICAgY29tcG9uZW50RmFjdG9yeVJlc29sdmVyPzogQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHwgbnVsbCxcbiAgKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNvbXBvbmVudCA9IGNvbXBvbmVudDtcbiAgICB0aGlzLnZpZXdDb250YWluZXJSZWYgPSB2aWV3Q29udGFpbmVyUmVmO1xuICAgIHRoaXMuaW5qZWN0b3IgPSBpbmplY3RvcjtcbiAgICB0aGlzLmNvbXBvbmVudEZhY3RvcnlSZXNvbHZlciA9IGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjtcbiAgfVxufVxuXG4vKipcbiAqIEEgYFRlbXBsYXRlUG9ydGFsYCBpcyBhIHBvcnRhbCB0aGF0IHJlcHJlc2VudHMgc29tZSBlbWJlZGRlZCB0ZW1wbGF0ZSAoVGVtcGxhdGVSZWYpLlxuICovXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVQb3J0YWw8QyA9IGFueT4gZXh0ZW5kcyBQb3J0YWw8RW1iZWRkZWRWaWV3UmVmPEM+PiB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIC8qKiBUaGUgZW1iZWRkZWQgdGVtcGxhdGUgdGhhdCB3aWxsIGJlIHVzZWQgdG8gaW5zdGFudGlhdGUgYW4gZW1iZWRkZWQgVmlldyBpbiB0aGUgaG9zdC4gKi9cbiAgICBwdWJsaWMgdGVtcGxhdGVSZWY6IFRlbXBsYXRlUmVmPEM+LFxuICAgIC8qKiBSZWZlcmVuY2UgdG8gdGhlIFZpZXdDb250YWluZXIgaW50byB3aGljaCB0aGUgdGVtcGxhdGUgd2lsbCBiZSBzdGFtcGVkIG91dC4gKi9cbiAgICBwdWJsaWMgdmlld0NvbnRhaW5lclJlZjogVmlld0NvbnRhaW5lclJlZixcbiAgICAvKiogQ29udGV4dHVhbCBkYXRhIHRvIGJlIHBhc3NlZCBpbiB0byB0aGUgZW1iZWRkZWQgdmlldy4gKi9cbiAgICBwdWJsaWMgY29udGV4dD86IEMsXG4gICAgLyoqIFRoZSBpbmplY3RvciB0byB1c2UgZm9yIHRoZSBlbWJlZGRlZCB2aWV3LiAqL1xuICAgIHB1YmxpYyBpbmplY3Rvcj86IEluamVjdG9yLFxuICApIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgZ2V0IG9yaWdpbigpOiBFbGVtZW50UmVmIHtcbiAgICByZXR1cm4gdGhpcy50ZW1wbGF0ZVJlZi5lbGVtZW50UmVmO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGFjaCB0aGUgcG9ydGFsIHRvIHRoZSBwcm92aWRlZCBgUG9ydGFsT3V0bGV0YC5cbiAgICogV2hlbiBhIGNvbnRleHQgaXMgcHJvdmlkZWQgaXQgd2lsbCBvdmVycmlkZSB0aGUgYGNvbnRleHRgIHByb3BlcnR5IG9mIHRoZSBgVGVtcGxhdGVQb3J0YWxgXG4gICAqIGluc3RhbmNlLlxuICAgKi9cbiAgb3ZlcnJpZGUgYXR0YWNoKGhvc3Q6IFBvcnRhbE91dGxldCwgY29udGV4dDogQyB8IHVuZGVmaW5lZCA9IHRoaXMuY29udGV4dCk6IEVtYmVkZGVkVmlld1JlZjxDPiB7XG4gICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICByZXR1cm4gc3VwZXIuYXR0YWNoKGhvc3QpO1xuICB9XG5cbiAgb3ZlcnJpZGUgZGV0YWNoKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGV4dCA9IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gc3VwZXIuZGV0YWNoKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBIGBEb21Qb3J0YWxgIGlzIGEgcG9ydGFsIHdob3NlIERPTSBlbGVtZW50IHdpbGwgYmUgdGFrZW4gZnJvbSBpdHMgY3VycmVudCBwb3NpdGlvblxuICogaW4gdGhlIERPTSBhbmQgbW92ZWQgaW50byBhIHBvcnRhbCBvdXRsZXQsIHdoZW4gaXQgaXMgYXR0YWNoZWQuIE9uIGRldGFjaCwgdGhlIGNvbnRlbnRcbiAqIHdpbGwgYmUgcmVzdG9yZWQgdG8gaXRzIG9yaWdpbmFsIHBvc2l0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgRG9tUG9ydGFsPFQgPSBIVE1MRWxlbWVudD4gZXh0ZW5kcyBQb3J0YWw8VD4ge1xuICAvKiogRE9NIG5vZGUgaG9zdGluZyB0aGUgcG9ydGFsJ3MgY29udGVudC4gKi9cbiAgcmVhZG9ubHkgZWxlbWVudDogVDtcblxuICBjb25zdHJ1Y3RvcihlbGVtZW50OiBUIHwgRWxlbWVudFJlZjxUPikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudCBpbnN0YW5jZW9mIEVsZW1lbnRSZWYgPyBlbGVtZW50Lm5hdGl2ZUVsZW1lbnQgOiBlbGVtZW50O1xuICB9XG59XG5cbi8qKiBBIGBQb3J0YWxPdXRsZXRgIGlzIGFuIHNwYWNlIHRoYXQgY2FuIGNvbnRhaW4gYSBzaW5nbGUgYFBvcnRhbGAuICovXG5leHBvcnQgaW50ZXJmYWNlIFBvcnRhbE91dGxldCB7XG4gIC8qKiBBdHRhY2hlcyBhIHBvcnRhbCB0byB0aGlzIG91dGxldC4gKi9cbiAgYXR0YWNoKHBvcnRhbDogUG9ydGFsPGFueT4pOiBhbnk7XG5cbiAgLyoqIERldGFjaGVzIHRoZSBjdXJyZW50bHkgYXR0YWNoZWQgcG9ydGFsIGZyb20gdGhpcyBvdXRsZXQuICovXG4gIGRldGFjaCgpOiBhbnk7XG5cbiAgLyoqIFBlcmZvcm1zIGNsZWFudXAgYmVmb3JlIHRoZSBvdXRsZXQgaXMgZGVzdHJveWVkLiAqL1xuICBkaXNwb3NlKCk6IHZvaWQ7XG5cbiAgLyoqIFdoZXRoZXIgdGhlcmUgaXMgY3VycmVudGx5IGEgcG9ydGFsIGF0dGFjaGVkIHRvIHRoaXMgb3V0bGV0LiAqL1xuICBoYXNBdHRhY2hlZCgpOiBib29sZWFuO1xufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkIFVzZSBgUG9ydGFsT3V0bGV0YCBpbnN0ZWFkLlxuICogQGJyZWFraW5nLWNoYW5nZSA5LjAuMFxuICovXG5leHBvcnQgdHlwZSBQb3J0YWxIb3N0ID0gUG9ydGFsT3V0bGV0O1xuXG4vKipcbiAqIFBhcnRpYWwgaW1wbGVtZW50YXRpb24gb2YgUG9ydGFsT3V0bGV0IHRoYXQgaGFuZGxlcyBhdHRhY2hpbmdcbiAqIENvbXBvbmVudFBvcnRhbCBhbmQgVGVtcGxhdGVQb3J0YWwuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBCYXNlUG9ydGFsT3V0bGV0IGltcGxlbWVudHMgUG9ydGFsT3V0bGV0IHtcbiAgLyoqIFRoZSBwb3J0YWwgY3VycmVudGx5IGF0dGFjaGVkIHRvIHRoZSBob3N0LiAqL1xuICBwcm90ZWN0ZWQgX2F0dGFjaGVkUG9ydGFsOiBQb3J0YWw8YW55PiB8IG51bGw7XG5cbiAgLyoqIEEgZnVuY3Rpb24gdGhhdCB3aWxsIHBlcm1hbmVudGx5IGRpc3Bvc2UgdGhpcyBob3N0LiAqL1xuICBwcml2YXRlIF9kaXNwb3NlRm46ICgoKSA9PiB2b2lkKSB8IG51bGw7XG5cbiAgLyoqIFdoZXRoZXIgdGhpcyBob3N0IGhhcyBhbHJlYWR5IGJlZW4gcGVybWFuZW50bHkgZGlzcG9zZWQuICovXG4gIHByaXZhdGUgX2lzRGlzcG9zZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogV2hldGhlciB0aGlzIGhvc3QgaGFzIGFuIGF0dGFjaGVkIHBvcnRhbC4gKi9cbiAgaGFzQXR0YWNoZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhdGhpcy5fYXR0YWNoZWRQb3J0YWw7XG4gIH1cblxuICBhdHRhY2g8VD4ocG9ydGFsOiBDb21wb25lbnRQb3J0YWw8VD4pOiBDb21wb25lbnRSZWY8VD47XG4gIGF0dGFjaDxUPihwb3J0YWw6IFRlbXBsYXRlUG9ydGFsPFQ+KTogRW1iZWRkZWRWaWV3UmVmPFQ+O1xuICBhdHRhY2gocG9ydGFsOiBhbnkpOiBhbnk7XG5cbiAgLyoqIEF0dGFjaGVzIGEgcG9ydGFsLiAqL1xuICBhdHRhY2gocG9ydGFsOiBQb3J0YWw8YW55Pik6IGFueSB7XG4gICAgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkge1xuICAgICAgaWYgKCFwb3J0YWwpIHtcbiAgICAgICAgdGhyb3dOdWxsUG9ydGFsRXJyb3IoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuaGFzQXR0YWNoZWQoKSkge1xuICAgICAgICB0aHJvd1BvcnRhbEFscmVhZHlBdHRhY2hlZEVycm9yKCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9pc0Rpc3Bvc2VkKSB7XG4gICAgICAgIHRocm93UG9ydGFsT3V0bGV0QWxyZWFkeURpc3Bvc2VkRXJyb3IoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9ydGFsIGluc3RhbmNlb2YgQ29tcG9uZW50UG9ydGFsKSB7XG4gICAgICB0aGlzLl9hdHRhY2hlZFBvcnRhbCA9IHBvcnRhbDtcbiAgICAgIHJldHVybiB0aGlzLmF0dGFjaENvbXBvbmVudFBvcnRhbChwb3J0YWwpO1xuICAgIH0gZWxzZSBpZiAocG9ydGFsIGluc3RhbmNlb2YgVGVtcGxhdGVQb3J0YWwpIHtcbiAgICAgIHRoaXMuX2F0dGFjaGVkUG9ydGFsID0gcG9ydGFsO1xuICAgICAgcmV0dXJuIHRoaXMuYXR0YWNoVGVtcGxhdGVQb3J0YWwocG9ydGFsKTtcbiAgICAgIC8vIEBicmVha2luZy1jaGFuZ2UgMTAuMC4wIHJlbW92ZSBudWxsIGNoZWNrIGZvciBgdGhpcy5hdHRhY2hEb21Qb3J0YWxgLlxuICAgIH0gZWxzZSBpZiAodGhpcy5hdHRhY2hEb21Qb3J0YWwgJiYgcG9ydGFsIGluc3RhbmNlb2YgRG9tUG9ydGFsKSB7XG4gICAgICB0aGlzLl9hdHRhY2hlZFBvcnRhbCA9IHBvcnRhbDtcbiAgICAgIHJldHVybiB0aGlzLmF0dGFjaERvbVBvcnRhbChwb3J0YWwpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpIHtcbiAgICAgIHRocm93VW5rbm93blBvcnRhbFR5cGVFcnJvcigpO1xuICAgIH1cbiAgfVxuXG4gIGFic3RyYWN0IGF0dGFjaENvbXBvbmVudFBvcnRhbDxUPihwb3J0YWw6IENvbXBvbmVudFBvcnRhbDxUPik6IENvbXBvbmVudFJlZjxUPjtcblxuICBhYnN0cmFjdCBhdHRhY2hUZW1wbGF0ZVBvcnRhbDxDPihwb3J0YWw6IFRlbXBsYXRlUG9ydGFsPEM+KTogRW1iZWRkZWRWaWV3UmVmPEM+O1xuXG4gIC8vIEBicmVha2luZy1jaGFuZ2UgMTAuMC4wIGBhdHRhY2hEb21Qb3J0YWxgIHRvIGJlY29tZSBhIHJlcXVpcmVkIGFic3RyYWN0IG1ldGhvZC5cbiAgcmVhZG9ubHkgYXR0YWNoRG9tUG9ydGFsOiBudWxsIHwgKChwb3J0YWw6IERvbVBvcnRhbCkgPT4gYW55KSA9IG51bGw7XG5cbiAgLyoqIERldGFjaGVzIGEgcHJldmlvdXNseSBhdHRhY2hlZCBwb3J0YWwuICovXG4gIGRldGFjaCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fYXR0YWNoZWRQb3J0YWwpIHtcbiAgICAgIHRoaXMuX2F0dGFjaGVkUG9ydGFsLnNldEF0dGFjaGVkSG9zdChudWxsKTtcbiAgICAgIHRoaXMuX2F0dGFjaGVkUG9ydGFsID0gbnVsbDtcbiAgICB9XG5cbiAgICB0aGlzLl9pbnZva2VEaXNwb3NlRm4oKTtcbiAgfVxuXG4gIC8qKiBQZXJtYW5lbnRseSBkaXNwb3NlIG9mIHRoaXMgcG9ydGFsIGhvc3QuICovXG4gIGRpc3Bvc2UoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaGFzQXR0YWNoZWQoKSkge1xuICAgICAgdGhpcy5kZXRhY2goKTtcbiAgICB9XG5cbiAgICB0aGlzLl9pbnZva2VEaXNwb3NlRm4oKTtcbiAgICB0aGlzLl9pc0Rpc3Bvc2VkID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKiBAZG9jcy1wcml2YXRlICovXG4gIHNldERpc3Bvc2VGbihmbjogKCkgPT4gdm9pZCkge1xuICAgIHRoaXMuX2Rpc3Bvc2VGbiA9IGZuO1xuICB9XG5cbiAgcHJpdmF0ZSBfaW52b2tlRGlzcG9zZUZuKCkge1xuICAgIGlmICh0aGlzLl9kaXNwb3NlRm4pIHtcbiAgICAgIHRoaXMuX2Rpc3Bvc2VGbigpO1xuICAgICAgdGhpcy5fZGlzcG9zZUZuID0gbnVsbDtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBAZGVwcmVjYXRlZCBVc2UgYEJhc2VQb3J0YWxPdXRsZXRgIGluc3RlYWQuXG4gKiBAYnJlYWtpbmctY2hhbmdlIDkuMC4wXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBCYXNlUG9ydGFsSG9zdCBleHRlbmRzIEJhc2VQb3J0YWxPdXRsZXQge31cbiJdfQ==