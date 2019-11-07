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
import { ElementRef, } from '@angular/core';
import { throwNullPortalOutletError, throwPortalAlreadyAttachedError, throwNoPortalAttachedError, throwNullPortalError, throwPortalOutletAlreadyDisposedError, throwUnknownPortalTypeError } from './portal-errors';
/**
 * Interface that can be used to generically type a class.
 * @record
 * @template T
 */
export function ComponentType() { }
/**
 * A `Portal` is something that you want to render somewhere else.
 * It can be attach to / detached from a `PortalOutlet`.
 * @abstract
 * @template T
 */
export class Portal {
    /**
     * Attach this portal to a host.
     * @param {?} host
     * @return {?}
     */
    attach(host) {
        if (host == null) {
            throwNullPortalOutletError();
        }
        if (host.hasAttached()) {
            throwPortalAlreadyAttachedError();
        }
        this._attachedHost = host;
        return (/** @type {?} */ (host.attach(this)));
    }
    /**
     * Detach this portal from its host
     * @return {?}
     */
    detach() {
        /** @type {?} */
        let host = this._attachedHost;
        if (host == null) {
            throwNoPortalAttachedError();
        }
        else {
            this._attachedHost = null;
            host.detach();
        }
    }
    /**
     * Whether this portal is attached to a host.
     * @return {?}
     */
    get isAttached() {
        return this._attachedHost != null;
    }
    /**
     * Sets the PortalOutlet reference without performing `attach()`. This is used directly by
     * the PortalOutlet when it is performing an `attach()` or `detach()`.
     * @param {?} host
     * @return {?}
     */
    setAttachedHost(host) {
        this._attachedHost = host;
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    Portal.prototype._attachedHost;
}
/**
 * A `ComponentPortal` is a portal that instantiates some Component upon attachment.
 * @template T
 */
export class ComponentPortal extends Portal {
    /**
     * @param {?} component
     * @param {?=} viewContainerRef
     * @param {?=} injector
     * @param {?=} componentFactoryResolver
     */
    constructor(component, viewContainerRef, injector, componentFactoryResolver) {
        super();
        this.component = component;
        this.viewContainerRef = viewContainerRef;
        this.injector = injector;
        this.componentFactoryResolver = componentFactoryResolver;
    }
}
if (false) {
    /**
     * The type of the component that will be instantiated for attachment.
     * @type {?}
     */
    ComponentPortal.prototype.component;
    /**
     * [Optional] Where the attached component should live in Angular's *logical* component tree.
     * This is different from where the component *renders*, which is determined by the PortalOutlet.
     * The origin is necessary when the host is outside of the Angular application context.
     * @type {?}
     */
    ComponentPortal.prototype.viewContainerRef;
    /**
     * [Optional] Injector used for the instantiation of the component.
     * @type {?}
     */
    ComponentPortal.prototype.injector;
    /**
     * Alternate `ComponentFactoryResolver` to use when resolving the associated component.
     * Defaults to using the resolver from the outlet that the portal is attached to.
     * @type {?}
     */
    ComponentPortal.prototype.componentFactoryResolver;
}
/**
 * A `TemplatePortal` is a portal that represents some embedded template (TemplateRef).
 * @template C
 */
export class TemplatePortal extends Portal {
    /**
     * @param {?} template
     * @param {?} viewContainerRef
     * @param {?=} context
     */
    constructor(template, viewContainerRef, context) {
        super();
        this.templateRef = template;
        this.viewContainerRef = viewContainerRef;
        this.context = context;
    }
    /**
     * @return {?}
     */
    get origin() {
        return this.templateRef.elementRef;
    }
    /**
     * Attach the portal to the provided `PortalOutlet`.
     * When a context is provided it will override the `context` property of the `TemplatePortal`
     * instance.
     * @param {?} host
     * @param {?=} context
     * @return {?}
     */
    attach(host, context = this.context) {
        this.context = context;
        return super.attach(host);
    }
    /**
     * @return {?}
     */
    detach() {
        this.context = undefined;
        return super.detach();
    }
}
if (false) {
    /**
     * The embedded template that will be used to instantiate an embedded View in the host.
     * @type {?}
     */
    TemplatePortal.prototype.templateRef;
    /**
     * Reference to the ViewContainer into which the template will be stamped out.
     * @type {?}
     */
    TemplatePortal.prototype.viewContainerRef;
    /**
     * Contextual data to be passed in to the embedded view.
     * @type {?}
     */
    TemplatePortal.prototype.context;
}
/**
 * A `DomPortal` is a portal whose DOM element will be taken from its current position
 * in the DOM and moved into a portal outlet, when it is attached. On detach, the content
 * will be restored to its original position.
 * @template T
 */
export class DomPortal extends Portal {
    /**
     * @param {?} element
     */
    constructor(element) {
        super();
        this.element = element instanceof ElementRef ? element.nativeElement : element;
    }
}
if (false) {
    /**
     * DOM node hosting the portal's content.
     * @type {?}
     */
    DomPortal.prototype.element;
}
/**
 * A `PortalOutlet` is an space that can contain a single `Portal`.
 * @record
 */
export function PortalOutlet() { }
if (false) {
    /**
     * Attaches a portal to this outlet.
     * @param {?} portal
     * @return {?}
     */
    PortalOutlet.prototype.attach = function (portal) { };
    /**
     * Detaches the currently attached portal from this outlet.
     * @return {?}
     */
    PortalOutlet.prototype.detach = function () { };
    /**
     * Performs cleanup before the outlet is destroyed.
     * @return {?}
     */
    PortalOutlet.prototype.dispose = function () { };
    /**
     * Whether there is currently a portal attached to this outlet.
     * @return {?}
     */
    PortalOutlet.prototype.hasAttached = function () { };
}
/**
 * Partial implementation of PortalOutlet that handles attaching
 * ComponentPortal and TemplatePortal.
 * @abstract
 */
export class BasePortalOutlet {
    constructor() {
        /**
         * Whether this host has already been permanently disposed.
         */
        this._isDisposed = false;
        // @breaking-change 10.0.0 `attachDomPortal` to become a required abstract method.
        this.attachDomPortal = null;
    }
    /**
     * Whether this host has an attached portal.
     * @return {?}
     */
    hasAttached() {
        return !!this._attachedPortal;
    }
    /**
     * Attaches a portal.
     * @param {?} portal
     * @return {?}
     */
    attach(portal) {
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
            // @breaking-change 10.0.0 remove null check for `this.attachDomPortal`.
        }
        else if (this.attachDomPortal && portal instanceof DomPortal) {
            this._attachedPortal = portal;
            return this.attachDomPortal(portal);
        }
        throwUnknownPortalTypeError();
    }
    /**
     * Detaches a previously attached portal.
     * @return {?}
     */
    detach() {
        if (this._attachedPortal) {
            this._attachedPortal.setAttachedHost(null);
            this._attachedPortal = null;
        }
        this._invokeDisposeFn();
    }
    /**
     * Permanently dispose of this portal host.
     * @return {?}
     */
    dispose() {
        if (this.hasAttached()) {
            this.detach();
        }
        this._invokeDisposeFn();
        this._isDisposed = true;
    }
    /**
     * \@docs-private
     * @param {?} fn
     * @return {?}
     */
    setDisposeFn(fn) {
        this._disposeFn = fn;
    }
    /**
     * @private
     * @return {?}
     */
    _invokeDisposeFn() {
        if (this._disposeFn) {
            this._disposeFn();
            this._disposeFn = null;
        }
    }
}
if (false) {
    /**
     * The portal currently attached to the host.
     * @type {?}
     * @protected
     */
    BasePortalOutlet.prototype._attachedPortal;
    /**
     * A function that will permanently dispose this host.
     * @type {?}
     * @private
     */
    BasePortalOutlet.prototype._disposeFn;
    /**
     * Whether this host has already been permanently disposed.
     * @type {?}
     * @private
     */
    BasePortalOutlet.prototype._isDisposed;
    /** @type {?} */
    BasePortalOutlet.prototype.attachDomPortal;
    /**
     * @abstract
     * @template T
     * @param {?} portal
     * @return {?}
     */
    BasePortalOutlet.prototype.attachComponentPortal = function (portal) { };
    /**
     * @abstract
     * @template C
     * @param {?} portal
     * @return {?}
     */
    BasePortalOutlet.prototype.attachTemplatePortal = function (portal) { };
}
/**
 * @deprecated Use `BasePortalOutlet` instead.
 * \@breaking-change 9.0.0
 * @abstract
 */
export class BasePortalHost extends BasePortalOutlet {
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9ydGFsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9wb3J0YWwvcG9ydGFsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUdILFVBQVUsR0FLYixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQ0gsMEJBQTBCLEVBQzFCLCtCQUErQixFQUMvQiwwQkFBMEIsRUFDMUIsb0JBQW9CLEVBQ3BCLHFDQUFxQyxFQUNyQywyQkFBMkIsRUFDOUIsTUFBTSxpQkFBaUIsQ0FBQzs7Ozs7O0FBR3pCLG1DQUVDOzs7Ozs7O0FBTUQsTUFBTSxPQUFnQixNQUFNOzs7Ozs7SUFJMUIsTUFBTSxDQUFDLElBQWtCO1FBQ3ZCLElBQUksSUFBSSxJQUFJLElBQUksRUFBRTtZQUNoQiwwQkFBMEIsRUFBRSxDQUFDO1NBQzlCO1FBRUQsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUU7WUFDdEIsK0JBQStCLEVBQUUsQ0FBQztTQUNuQztRQUVELElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO1FBQzFCLE9BQU8sbUJBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBQSxDQUFDO0lBQy9CLENBQUM7Ozs7O0lBR0QsTUFBTTs7WUFDQSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWE7UUFFN0IsSUFBSSxJQUFJLElBQUksSUFBSSxFQUFFO1lBQ2hCLDBCQUEwQixFQUFFLENBQUM7U0FDOUI7YUFBTTtZQUNMLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO1lBQzFCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUNmO0lBQ0gsQ0FBQzs7Ozs7SUFHRCxJQUFJLFVBQVU7UUFDWixPQUFPLElBQUksQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDO0lBQ3BDLENBQUM7Ozs7Ozs7SUFNRCxlQUFlLENBQUMsSUFBeUI7UUFDdkMsSUFBSSxDQUFDLGFBQWEsR0FB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OztJQTZDckMsMkNBQXFFOzs7Ozs7O0lBTHJFLHlFQUErRTs7Ozs7OztJQUUvRSx3RUFBZ0Y7Ozs7Ozs7QUEwQ2xGLE1BQU0sT0FBZ0IsY0FBZSxTQUFRLGdCQUFnQjtDQUFHIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gICAgVGVtcGxhdGVSZWYsXG4gICAgVmlld0NvbnRhaW5lclJlZixcbiAgICBFbGVtZW50UmVmLFxuICAgIENvbXBvbmVudFJlZixcbiAgICBFbWJlZGRlZFZpZXdSZWYsXG4gICAgSW5qZWN0b3IsXG4gICAgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7XG4gICAgdGhyb3dOdWxsUG9ydGFsT3V0bGV0RXJyb3IsXG4gICAgdGhyb3dQb3J0YWxBbHJlYWR5QXR0YWNoZWRFcnJvcixcbiAgICB0aHJvd05vUG9ydGFsQXR0YWNoZWRFcnJvcixcbiAgICB0aHJvd051bGxQb3J0YWxFcnJvcixcbiAgICB0aHJvd1BvcnRhbE91dGxldEFscmVhZHlEaXNwb3NlZEVycm9yLFxuICAgIHRocm93VW5rbm93blBvcnRhbFR5cGVFcnJvclxufSBmcm9tICcuL3BvcnRhbC1lcnJvcnMnO1xuXG4vKiogSW50ZXJmYWNlIHRoYXQgY2FuIGJlIHVzZWQgdG8gZ2VuZXJpY2FsbHkgdHlwZSBhIGNsYXNzLiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb21wb25lbnRUeXBlPFQ+IHtcbiAgbmV3ICguLi5hcmdzOiBhbnlbXSk6IFQ7XG59XG5cbi8qKlxuICogQSBgUG9ydGFsYCBpcyBzb21ldGhpbmcgdGhhdCB5b3Ugd2FudCB0byByZW5kZXIgc29tZXdoZXJlIGVsc2UuXG4gKiBJdCBjYW4gYmUgYXR0YWNoIHRvIC8gZGV0YWNoZWQgZnJvbSBhIGBQb3J0YWxPdXRsZXRgLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgUG9ydGFsPFQ+IHtcbiAgcHJpdmF0ZSBfYXR0YWNoZWRIb3N0OiBQb3J0YWxPdXRsZXQgfCBudWxsO1xuXG4gIC8qKiBBdHRhY2ggdGhpcyBwb3J0YWwgdG8gYSBob3N0LiAqL1xuICBhdHRhY2goaG9zdDogUG9ydGFsT3V0bGV0KTogVCB7XG4gICAgaWYgKGhvc3QgPT0gbnVsbCkge1xuICAgICAgdGhyb3dOdWxsUG9ydGFsT3V0bGV0RXJyb3IoKTtcbiAgICB9XG5cbiAgICBpZiAoaG9zdC5oYXNBdHRhY2hlZCgpKSB7XG4gICAgICB0aHJvd1BvcnRhbEFscmVhZHlBdHRhY2hlZEVycm9yKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fYXR0YWNoZWRIb3N0ID0gaG9zdDtcbiAgICByZXR1cm4gPFQ+IGhvc3QuYXR0YWNoKHRoaXMpO1xuICB9XG5cbiAgLyoqIERldGFjaCB0aGlzIHBvcnRhbCBmcm9tIGl0cyBob3N0ICovXG4gIGRldGFjaCgpOiB2b2lkIHtcbiAgICBsZXQgaG9zdCA9IHRoaXMuX2F0dGFjaGVkSG9zdDtcblxuICAgIGlmIChob3N0ID09IG51bGwpIHtcbiAgICAgIHRocm93Tm9Qb3J0YWxBdHRhY2hlZEVycm9yKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2F0dGFjaGVkSG9zdCA9IG51bGw7XG4gICAgICBob3N0LmRldGFjaCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBXaGV0aGVyIHRoaXMgcG9ydGFsIGlzIGF0dGFjaGVkIHRvIGEgaG9zdC4gKi9cbiAgZ2V0IGlzQXR0YWNoZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2F0dGFjaGVkSG9zdCAhPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIFBvcnRhbE91dGxldCByZWZlcmVuY2Ugd2l0aG91dCBwZXJmb3JtaW5nIGBhdHRhY2goKWAuIFRoaXMgaXMgdXNlZCBkaXJlY3RseSBieVxuICAgKiB0aGUgUG9ydGFsT3V0bGV0IHdoZW4gaXQgaXMgcGVyZm9ybWluZyBhbiBgYXR0YWNoKClgIG9yIGBkZXRhY2goKWAuXG4gICAqL1xuICBzZXRBdHRhY2hlZEhvc3QoaG9zdDogUG9ydGFsT3V0bGV0IHwgbnVsbCkge1xuICAgIHRoaXMuX2F0dGFjaGVkSG9zdCA9IGhvc3Q7XG4gIH1cbn1cblxuXG4vKipcbiAqIEEgYENvbXBvbmVudFBvcnRhbGAgaXMgYSBwb3J0YWwgdGhhdCBpbnN0YW50aWF0ZXMgc29tZSBDb21wb25lbnQgdXBvbiBhdHRhY2htZW50LlxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50UG9ydGFsPFQ+IGV4dGVuZHMgUG9ydGFsPENvbXBvbmVudFJlZjxUPj4ge1xuICAvKiogVGhlIHR5cGUgb2YgdGhlIGNvbXBvbmVudCB0aGF0IHdpbGwgYmUgaW5zdGFudGlhdGVkIGZvciBhdHRhY2htZW50LiAqL1xuICBjb21wb25lbnQ6IENvbXBvbmVudFR5cGU8VD47XG5cbiAgLyoqXG4gICAqIFtPcHRpb25hbF0gV2hlcmUgdGhlIGF0dGFjaGVkIGNvbXBvbmVudCBzaG91bGQgbGl2ZSBpbiBBbmd1bGFyJ3MgKmxvZ2ljYWwqIGNvbXBvbmVudCB0cmVlLlxuICAgKiBUaGlzIGlzIGRpZmZlcmVudCBmcm9tIHdoZXJlIHRoZSBjb21wb25lbnQgKnJlbmRlcnMqLCB3aGljaCBpcyBkZXRlcm1pbmVkIGJ5IHRoZSBQb3J0YWxPdXRsZXQuXG4gICAqIFRoZSBvcmlnaW4gaXMgbmVjZXNzYXJ5IHdoZW4gdGhlIGhvc3QgaXMgb3V0c2lkZSBvZiB0aGUgQW5ndWxhciBhcHBsaWNhdGlvbiBjb250ZXh0LlxuICAgKi9cbiAgdmlld0NvbnRhaW5lclJlZj86IFZpZXdDb250YWluZXJSZWYgfCBudWxsO1xuXG4gIC8qKiBbT3B0aW9uYWxdIEluamVjdG9yIHVzZWQgZm9yIHRoZSBpbnN0YW50aWF0aW9uIG9mIHRoZSBjb21wb25lbnQuICovXG4gIGluamVjdG9yPzogSW5qZWN0b3IgfCBudWxsO1xuXG4gIC8qKlxuICAgKiBBbHRlcm5hdGUgYENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcmAgdG8gdXNlIHdoZW4gcmVzb2x2aW5nIHRoZSBhc3NvY2lhdGVkIGNvbXBvbmVudC5cbiAgICogRGVmYXVsdHMgdG8gdXNpbmcgdGhlIHJlc29sdmVyIGZyb20gdGhlIG91dGxldCB0aGF0IHRoZSBwb3J0YWwgaXMgYXR0YWNoZWQgdG8uXG4gICAqL1xuICBjb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI/OiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgfCBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgY29tcG9uZW50OiBDb21wb25lbnRUeXBlPFQ+LFxuICAgICAgdmlld0NvbnRhaW5lclJlZj86IFZpZXdDb250YWluZXJSZWYgfCBudWxsLFxuICAgICAgaW5qZWN0b3I/OiBJbmplY3RvciB8IG51bGwsXG4gICAgICBjb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI/OiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgfCBudWxsKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNvbXBvbmVudCA9IGNvbXBvbmVudDtcbiAgICB0aGlzLnZpZXdDb250YWluZXJSZWYgPSB2aWV3Q29udGFpbmVyUmVmO1xuICAgIHRoaXMuaW5qZWN0b3IgPSBpbmplY3RvcjtcbiAgICB0aGlzLmNvbXBvbmVudEZhY3RvcnlSZXNvbHZlciA9IGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjtcbiAgfVxufVxuXG4vKipcbiAqIEEgYFRlbXBsYXRlUG9ydGFsYCBpcyBhIHBvcnRhbCB0aGF0IHJlcHJlc2VudHMgc29tZSBlbWJlZGRlZCB0ZW1wbGF0ZSAoVGVtcGxhdGVSZWYpLlxuICovXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVQb3J0YWw8QyA9IGFueT4gZXh0ZW5kcyBQb3J0YWw8RW1iZWRkZWRWaWV3UmVmPEM+PiB7XG4gIC8qKiBUaGUgZW1iZWRkZWQgdGVtcGxhdGUgdGhhdCB3aWxsIGJlIHVzZWQgdG8gaW5zdGFudGlhdGUgYW4gZW1iZWRkZWQgVmlldyBpbiB0aGUgaG9zdC4gKi9cbiAgdGVtcGxhdGVSZWY6IFRlbXBsYXRlUmVmPEM+O1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIFZpZXdDb250YWluZXIgaW50byB3aGljaCB0aGUgdGVtcGxhdGUgd2lsbCBiZSBzdGFtcGVkIG91dC4gKi9cbiAgdmlld0NvbnRhaW5lclJlZjogVmlld0NvbnRhaW5lclJlZjtcblxuICAvKiogQ29udGV4dHVhbCBkYXRhIHRvIGJlIHBhc3NlZCBpbiB0byB0aGUgZW1iZWRkZWQgdmlldy4gKi9cbiAgY29udGV4dDogQyB8IHVuZGVmaW5lZDtcblxuICBjb25zdHJ1Y3Rvcih0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8Qz4sIHZpZXdDb250YWluZXJSZWY6IFZpZXdDb250YWluZXJSZWYsIGNvbnRleHQ/OiBDKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnRlbXBsYXRlUmVmID0gdGVtcGxhdGU7XG4gICAgdGhpcy52aWV3Q29udGFpbmVyUmVmID0gdmlld0NvbnRhaW5lclJlZjtcbiAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICB9XG5cbiAgZ2V0IG9yaWdpbigpOiBFbGVtZW50UmVmIHtcbiAgICByZXR1cm4gdGhpcy50ZW1wbGF0ZVJlZi5lbGVtZW50UmVmO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGFjaCB0aGUgcG9ydGFsIHRvIHRoZSBwcm92aWRlZCBgUG9ydGFsT3V0bGV0YC5cbiAgICogV2hlbiBhIGNvbnRleHQgaXMgcHJvdmlkZWQgaXQgd2lsbCBvdmVycmlkZSB0aGUgYGNvbnRleHRgIHByb3BlcnR5IG9mIHRoZSBgVGVtcGxhdGVQb3J0YWxgXG4gICAqIGluc3RhbmNlLlxuICAgKi9cbiAgYXR0YWNoKGhvc3Q6IFBvcnRhbE91dGxldCwgY29udGV4dDogQyB8IHVuZGVmaW5lZCA9IHRoaXMuY29udGV4dCk6IEVtYmVkZGVkVmlld1JlZjxDPiB7XG4gICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICByZXR1cm4gc3VwZXIuYXR0YWNoKGhvc3QpO1xuICB9XG5cbiAgZGV0YWNoKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGV4dCA9IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gc3VwZXIuZGV0YWNoKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBIGBEb21Qb3J0YWxgIGlzIGEgcG9ydGFsIHdob3NlIERPTSBlbGVtZW50IHdpbGwgYmUgdGFrZW4gZnJvbSBpdHMgY3VycmVudCBwb3NpdGlvblxuICogaW4gdGhlIERPTSBhbmQgbW92ZWQgaW50byBhIHBvcnRhbCBvdXRsZXQsIHdoZW4gaXQgaXMgYXR0YWNoZWQuIE9uIGRldGFjaCwgdGhlIGNvbnRlbnRcbiAqIHdpbGwgYmUgcmVzdG9yZWQgdG8gaXRzIG9yaWdpbmFsIHBvc2l0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgRG9tUG9ydGFsPFQgPSBIVE1MRWxlbWVudD4gZXh0ZW5kcyBQb3J0YWw8VD4ge1xuICAvKiogRE9NIG5vZGUgaG9zdGluZyB0aGUgcG9ydGFsJ3MgY29udGVudC4gKi9cbiAgcmVhZG9ubHkgZWxlbWVudDogVDtcblxuICBjb25zdHJ1Y3RvcihlbGVtZW50OiBUIHwgRWxlbWVudFJlZjxUPikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudCBpbnN0YW5jZW9mIEVsZW1lbnRSZWYgPyBlbGVtZW50Lm5hdGl2ZUVsZW1lbnQgOiBlbGVtZW50O1xuICB9XG59XG5cblxuLyoqIEEgYFBvcnRhbE91dGxldGAgaXMgYW4gc3BhY2UgdGhhdCBjYW4gY29udGFpbiBhIHNpbmdsZSBgUG9ydGFsYC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUG9ydGFsT3V0bGV0IHtcbiAgLyoqIEF0dGFjaGVzIGEgcG9ydGFsIHRvIHRoaXMgb3V0bGV0LiAqL1xuICBhdHRhY2gocG9ydGFsOiBQb3J0YWw8YW55Pik6IGFueTtcblxuICAvKiogRGV0YWNoZXMgdGhlIGN1cnJlbnRseSBhdHRhY2hlZCBwb3J0YWwgZnJvbSB0aGlzIG91dGxldC4gKi9cbiAgZGV0YWNoKCk6IGFueTtcblxuICAvKiogUGVyZm9ybXMgY2xlYW51cCBiZWZvcmUgdGhlIG91dGxldCBpcyBkZXN0cm95ZWQuICovXG4gIGRpc3Bvc2UoKTogdm9pZDtcblxuICAvKiogV2hldGhlciB0aGVyZSBpcyBjdXJyZW50bHkgYSBwb3J0YWwgYXR0YWNoZWQgdG8gdGhpcyBvdXRsZXQuICovXG4gIGhhc0F0dGFjaGVkKCk6IGJvb2xlYW47XG59XG5cbi8qKlxuICogQGRlcHJlY2F0ZWQgVXNlIGBQb3J0YWxPdXRsZXRgIGluc3RlYWQuXG4gKiBAYnJlYWtpbmctY2hhbmdlIDkuMC4wXG4gKi9cbmV4cG9ydCB0eXBlIFBvcnRhbEhvc3QgPSBQb3J0YWxPdXRsZXQ7XG5cbi8qKlxuICogUGFydGlhbCBpbXBsZW1lbnRhdGlvbiBvZiBQb3J0YWxPdXRsZXQgdGhhdCBoYW5kbGVzIGF0dGFjaGluZ1xuICogQ29tcG9uZW50UG9ydGFsIGFuZCBUZW1wbGF0ZVBvcnRhbC5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEJhc2VQb3J0YWxPdXRsZXQgaW1wbGVtZW50cyBQb3J0YWxPdXRsZXQge1xuICAvKiogVGhlIHBvcnRhbCBjdXJyZW50bHkgYXR0YWNoZWQgdG8gdGhlIGhvc3QuICovXG4gIHByb3RlY3RlZCBfYXR0YWNoZWRQb3J0YWw6IFBvcnRhbDxhbnk+IHwgbnVsbDtcblxuICAvKiogQSBmdW5jdGlvbiB0aGF0IHdpbGwgcGVybWFuZW50bHkgZGlzcG9zZSB0aGlzIGhvc3QuICovXG4gIHByaXZhdGUgX2Rpc3Bvc2VGbjogKCgpID0+IHZvaWQpIHwgbnVsbDtcblxuICAvKiogV2hldGhlciB0aGlzIGhvc3QgaGFzIGFscmVhZHkgYmVlbiBwZXJtYW5lbnRseSBkaXNwb3NlZC4gKi9cbiAgcHJpdmF0ZSBfaXNEaXNwb3NlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIHRoaXMgaG9zdCBoYXMgYW4gYXR0YWNoZWQgcG9ydGFsLiAqL1xuICBoYXNBdHRhY2hlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLl9hdHRhY2hlZFBvcnRhbDtcbiAgfVxuXG4gIGF0dGFjaDxUPihwb3J0YWw6IENvbXBvbmVudFBvcnRhbDxUPik6IENvbXBvbmVudFJlZjxUPjtcbiAgYXR0YWNoPFQ+KHBvcnRhbDogVGVtcGxhdGVQb3J0YWw8VD4pOiBFbWJlZGRlZFZpZXdSZWY8VD47XG4gIGF0dGFjaChwb3J0YWw6IGFueSk6IGFueTtcblxuICAvKiogQXR0YWNoZXMgYSBwb3J0YWwuICovXG4gIGF0dGFjaChwb3J0YWw6IFBvcnRhbDxhbnk+KTogYW55IHtcbiAgICBpZiAoIXBvcnRhbCkge1xuICAgICAgdGhyb3dOdWxsUG9ydGFsRXJyb3IoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oYXNBdHRhY2hlZCgpKSB7XG4gICAgICB0aHJvd1BvcnRhbEFscmVhZHlBdHRhY2hlZEVycm9yKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2lzRGlzcG9zZWQpIHtcbiAgICAgIHRocm93UG9ydGFsT3V0bGV0QWxyZWFkeURpc3Bvc2VkRXJyb3IoKTtcbiAgICB9XG5cbiAgICBpZiAocG9ydGFsIGluc3RhbmNlb2YgQ29tcG9uZW50UG9ydGFsKSB7XG4gICAgICB0aGlzLl9hdHRhY2hlZFBvcnRhbCA9IHBvcnRhbDtcbiAgICAgIHJldHVybiB0aGlzLmF0dGFjaENvbXBvbmVudFBvcnRhbChwb3J0YWwpO1xuICAgIH0gZWxzZSBpZiAocG9ydGFsIGluc3RhbmNlb2YgVGVtcGxhdGVQb3J0YWwpIHtcbiAgICAgIHRoaXMuX2F0dGFjaGVkUG9ydGFsID0gcG9ydGFsO1xuICAgICAgcmV0dXJuIHRoaXMuYXR0YWNoVGVtcGxhdGVQb3J0YWwocG9ydGFsKTtcbiAgICAgIC8vIEBicmVha2luZy1jaGFuZ2UgMTAuMC4wIHJlbW92ZSBudWxsIGNoZWNrIGZvciBgdGhpcy5hdHRhY2hEb21Qb3J0YWxgLlxuICAgIH0gZWxzZSBpZiAodGhpcy5hdHRhY2hEb21Qb3J0YWwgJiYgcG9ydGFsIGluc3RhbmNlb2YgRG9tUG9ydGFsKSB7XG4gICAgICB0aGlzLl9hdHRhY2hlZFBvcnRhbCA9IHBvcnRhbDtcbiAgICAgIHJldHVybiB0aGlzLmF0dGFjaERvbVBvcnRhbChwb3J0YWwpO1xuICAgIH1cblxuICAgIHRocm93VW5rbm93blBvcnRhbFR5cGVFcnJvcigpO1xuICB9XG5cbiAgYWJzdHJhY3QgYXR0YWNoQ29tcG9uZW50UG9ydGFsPFQ+KHBvcnRhbDogQ29tcG9uZW50UG9ydGFsPFQ+KTogQ29tcG9uZW50UmVmPFQ+O1xuXG4gIGFic3RyYWN0IGF0dGFjaFRlbXBsYXRlUG9ydGFsPEM+KHBvcnRhbDogVGVtcGxhdGVQb3J0YWw8Qz4pOiBFbWJlZGRlZFZpZXdSZWY8Qz47XG5cbiAgLy8gQGJyZWFraW5nLWNoYW5nZSAxMC4wLjAgYGF0dGFjaERvbVBvcnRhbGAgdG8gYmVjb21lIGEgcmVxdWlyZWQgYWJzdHJhY3QgbWV0aG9kLlxuICByZWFkb25seSBhdHRhY2hEb21Qb3J0YWw6IG51bGwgfCAoKHBvcnRhbDogRG9tUG9ydGFsKSA9PiBhbnkpID0gbnVsbDtcblxuICAvKiogRGV0YWNoZXMgYSBwcmV2aW91c2x5IGF0dGFjaGVkIHBvcnRhbC4gKi9cbiAgZGV0YWNoKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9hdHRhY2hlZFBvcnRhbCkge1xuICAgICAgdGhpcy5fYXR0YWNoZWRQb3J0YWwuc2V0QXR0YWNoZWRIb3N0KG51bGwpO1xuICAgICAgdGhpcy5fYXR0YWNoZWRQb3J0YWwgPSBudWxsO1xuICAgIH1cblxuICAgIHRoaXMuX2ludm9rZURpc3Bvc2VGbigpO1xuICB9XG5cbiAgLyoqIFBlcm1hbmVudGx5IGRpc3Bvc2Ugb2YgdGhpcyBwb3J0YWwgaG9zdC4gKi9cbiAgZGlzcG9zZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5oYXNBdHRhY2hlZCgpKSB7XG4gICAgICB0aGlzLmRldGFjaCgpO1xuICAgIH1cblxuICAgIHRoaXMuX2ludm9rZURpc3Bvc2VGbigpO1xuICAgIHRoaXMuX2lzRGlzcG9zZWQgPSB0cnVlO1xuICB9XG5cbiAgLyoqIEBkb2NzLXByaXZhdGUgKi9cbiAgc2V0RGlzcG9zZUZuKGZuOiAoKSA9PiB2b2lkKSB7XG4gICAgdGhpcy5fZGlzcG9zZUZuID0gZm47XG4gIH1cblxuICBwcml2YXRlIF9pbnZva2VEaXNwb3NlRm4oKSB7XG4gICAgaWYgKHRoaXMuX2Rpc3Bvc2VGbikge1xuICAgICAgdGhpcy5fZGlzcG9zZUZuKCk7XG4gICAgICB0aGlzLl9kaXNwb3NlRm4gPSBudWxsO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkIFVzZSBgQmFzZVBvcnRhbE91dGxldGAgaW5zdGVhZC5cbiAqIEBicmVha2luZy1jaGFuZ2UgOS4wLjBcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEJhc2VQb3J0YWxIb3N0IGV4dGVuZHMgQmFzZVBvcnRhbE91dGxldCB7fVxuIl19