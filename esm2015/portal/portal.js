/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9ydGFsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9wb3J0YWwvcG9ydGFsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBaUJBLE9BQU8sRUFDSCwwQkFBMEIsRUFDMUIsK0JBQStCLEVBQy9CLDBCQUEwQixFQUMxQixvQkFBb0IsRUFDcEIscUNBQXFDLEVBQ3JDLDJCQUEyQixFQUM5QixNQUFNLGlCQUFpQixDQUFDOzs7Ozs7QUFHekIsbUNBRUM7Ozs7Ozs7QUFNRCxNQUFNLE9BQWdCLE1BQU07Ozs7OztJQUkxQixNQUFNLENBQUMsSUFBa0I7UUFDdkIsSUFBSSxJQUFJLElBQUksSUFBSSxFQUFFO1lBQ2hCLDBCQUEwQixFQUFFLENBQUM7U0FDOUI7UUFFRCxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRTtZQUN0QiwrQkFBK0IsRUFBRSxDQUFDO1NBQ25DO1FBRUQsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7UUFDMUIsT0FBTyxtQkFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFBLENBQUM7SUFDL0IsQ0FBQzs7Ozs7SUFHRCxNQUFNOztZQUNBLElBQUksR0FBRyxJQUFJLENBQUMsYUFBYTtRQUU3QixJQUFJLElBQUksSUFBSSxJQUFJLEVBQUU7WUFDaEIsMEJBQTBCLEVBQUUsQ0FBQztTQUM5QjthQUFNO1lBQ0wsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7WUFDMUIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQ2Y7SUFDSCxDQUFDOzs7OztJQUdELElBQUksVUFBVTtRQUNaLE9BQU8sSUFBSSxDQUFDLGFBQWEsSUFBSSxJQUFJLENBQUM7SUFDcEMsQ0FBQzs7Ozs7OztJQU1ELGVBQWUsQ0FBQyxJQUF5QjtRQUN2QyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztJQUM1QixDQUFDO0NBQ0Y7Ozs7OztJQXhDQywr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N0I7UUFFRCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUMxQixDQUFDOzs7OztJQUdELE9BQU87UUFDTCxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRTtZQUN0QixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDZjtRQUVELElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO0lBQzFCLENBQUM7Ozs7OztJQUdELFlBQVksQ0FBQyxFQUFjO1FBQ3pCLElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO0lBQ3ZCLENBQUM7Ozs7O0lBRU8sZ0JBQWdCO1FBQ3RCLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNuQixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDbEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7U0FDeEI7SUFDSCxDQUFDO0NBQ0Y7Ozs7Ozs7SUE3RUMsMkNBQThDOzs7Ozs7SUFHOUMsc0NBQXdDOzs7Ozs7SUFHeEMsdUNBQXFDOzs7Ozs7O0lBb0NyQyx5RUFBK0U7Ozs7Ozs7SUFFL0Usd0VBQWdGOzs7Ozs7O0FBdUNsRixNQUFNLE9BQWdCLGNBQWUsU0FBUSxnQkFBZ0I7Q0FBRyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICAgIFRlbXBsYXRlUmVmLFxuICAgIFZpZXdDb250YWluZXJSZWYsXG4gICAgRWxlbWVudFJlZixcbiAgICBDb21wb25lbnRSZWYsXG4gICAgRW1iZWRkZWRWaWV3UmVmLFxuICAgIEluamVjdG9yLFxuICAgIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1xuICAgIHRocm93TnVsbFBvcnRhbE91dGxldEVycm9yLFxuICAgIHRocm93UG9ydGFsQWxyZWFkeUF0dGFjaGVkRXJyb3IsXG4gICAgdGhyb3dOb1BvcnRhbEF0dGFjaGVkRXJyb3IsXG4gICAgdGhyb3dOdWxsUG9ydGFsRXJyb3IsXG4gICAgdGhyb3dQb3J0YWxPdXRsZXRBbHJlYWR5RGlzcG9zZWRFcnJvcixcbiAgICB0aHJvd1Vua25vd25Qb3J0YWxUeXBlRXJyb3Jcbn0gZnJvbSAnLi9wb3J0YWwtZXJyb3JzJztcblxuLyoqIEludGVyZmFjZSB0aGF0IGNhbiBiZSB1c2VkIHRvIGdlbmVyaWNhbGx5IHR5cGUgYSBjbGFzcy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcG9uZW50VHlwZTxUPiB7XG4gIG5ldyAoLi4uYXJnczogYW55W10pOiBUO1xufVxuXG4vKipcbiAqIEEgYFBvcnRhbGAgaXMgc29tZXRoaW5nIHRoYXQgeW91IHdhbnQgdG8gcmVuZGVyIHNvbWV3aGVyZSBlbHNlLlxuICogSXQgY2FuIGJlIGF0dGFjaCB0byAvIGRldGFjaGVkIGZyb20gYSBgUG9ydGFsT3V0bGV0YC5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFBvcnRhbDxUPiB7XG4gIHByaXZhdGUgX2F0dGFjaGVkSG9zdDogUG9ydGFsT3V0bGV0IHwgbnVsbDtcblxuICAvKiogQXR0YWNoIHRoaXMgcG9ydGFsIHRvIGEgaG9zdC4gKi9cbiAgYXR0YWNoKGhvc3Q6IFBvcnRhbE91dGxldCk6IFQge1xuICAgIGlmIChob3N0ID09IG51bGwpIHtcbiAgICAgIHRocm93TnVsbFBvcnRhbE91dGxldEVycm9yKCk7XG4gICAgfVxuXG4gICAgaWYgKGhvc3QuaGFzQXR0YWNoZWQoKSkge1xuICAgICAgdGhyb3dQb3J0YWxBbHJlYWR5QXR0YWNoZWRFcnJvcigpO1xuICAgIH1cblxuICAgIHRoaXMuX2F0dGFjaGVkSG9zdCA9IGhvc3Q7XG4gICAgcmV0dXJuIDxUPiBob3N0LmF0dGFjaCh0aGlzKTtcbiAgfVxuXG4gIC8qKiBEZXRhY2ggdGhpcyBwb3J0YWwgZnJvbSBpdHMgaG9zdCAqL1xuICBkZXRhY2goKTogdm9pZCB7XG4gICAgbGV0IGhvc3QgPSB0aGlzLl9hdHRhY2hlZEhvc3Q7XG5cbiAgICBpZiAoaG9zdCA9PSBudWxsKSB7XG4gICAgICB0aHJvd05vUG9ydGFsQXR0YWNoZWRFcnJvcigpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9hdHRhY2hlZEhvc3QgPSBudWxsO1xuICAgICAgaG9zdC5kZXRhY2goKTtcbiAgICB9XG4gIH1cblxuICAvKiogV2hldGhlciB0aGlzIHBvcnRhbCBpcyBhdHRhY2hlZCB0byBhIGhvc3QuICovXG4gIGdldCBpc0F0dGFjaGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9hdHRhY2hlZEhvc3QgIT0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBQb3J0YWxPdXRsZXQgcmVmZXJlbmNlIHdpdGhvdXQgcGVyZm9ybWluZyBgYXR0YWNoKClgLiBUaGlzIGlzIHVzZWQgZGlyZWN0bHkgYnlcbiAgICogdGhlIFBvcnRhbE91dGxldCB3aGVuIGl0IGlzIHBlcmZvcm1pbmcgYW4gYGF0dGFjaCgpYCBvciBgZGV0YWNoKClgLlxuICAgKi9cbiAgc2V0QXR0YWNoZWRIb3N0KGhvc3Q6IFBvcnRhbE91dGxldCB8IG51bGwpIHtcbiAgICB0aGlzLl9hdHRhY2hlZEhvc3QgPSBob3N0O1xuICB9XG59XG5cblxuLyoqXG4gKiBBIGBDb21wb25lbnRQb3J0YWxgIGlzIGEgcG9ydGFsIHRoYXQgaW5zdGFudGlhdGVzIHNvbWUgQ29tcG9uZW50IHVwb24gYXR0YWNobWVudC5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudFBvcnRhbDxUPiBleHRlbmRzIFBvcnRhbDxDb21wb25lbnRSZWY8VD4+IHtcbiAgLyoqIFRoZSB0eXBlIG9mIHRoZSBjb21wb25lbnQgdGhhdCB3aWxsIGJlIGluc3RhbnRpYXRlZCBmb3IgYXR0YWNobWVudC4gKi9cbiAgY29tcG9uZW50OiBDb21wb25lbnRUeXBlPFQ+O1xuXG4gIC8qKlxuICAgKiBbT3B0aW9uYWxdIFdoZXJlIHRoZSBhdHRhY2hlZCBjb21wb25lbnQgc2hvdWxkIGxpdmUgaW4gQW5ndWxhcidzICpsb2dpY2FsKiBjb21wb25lbnQgdHJlZS5cbiAgICogVGhpcyBpcyBkaWZmZXJlbnQgZnJvbSB3aGVyZSB0aGUgY29tcG9uZW50ICpyZW5kZXJzKiwgd2hpY2ggaXMgZGV0ZXJtaW5lZCBieSB0aGUgUG9ydGFsT3V0bGV0LlxuICAgKiBUaGUgb3JpZ2luIGlzIG5lY2Vzc2FyeSB3aGVuIHRoZSBob3N0IGlzIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgYXBwbGljYXRpb24gY29udGV4dC5cbiAgICovXG4gIHZpZXdDb250YWluZXJSZWY/OiBWaWV3Q29udGFpbmVyUmVmIHwgbnVsbDtcblxuICAvKiogW09wdGlvbmFsXSBJbmplY3RvciB1c2VkIGZvciB0aGUgaW5zdGFudGlhdGlvbiBvZiB0aGUgY29tcG9uZW50LiAqL1xuICBpbmplY3Rvcj86IEluamVjdG9yIHwgbnVsbDtcblxuICAvKipcbiAgICogQWx0ZXJuYXRlIGBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXJgIHRvIHVzZSB3aGVuIHJlc29sdmluZyB0aGUgYXNzb2NpYXRlZCBjb21wb25lbnQuXG4gICAqIERlZmF1bHRzIHRvIHVzaW5nIHRoZSByZXNvbHZlciBmcm9tIHRoZSBvdXRsZXQgdGhhdCB0aGUgcG9ydGFsIGlzIGF0dGFjaGVkIHRvLlxuICAgKi9cbiAgY29tcG9uZW50RmFjdG9yeVJlc29sdmVyPzogQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHwgbnVsbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIGNvbXBvbmVudDogQ29tcG9uZW50VHlwZTxUPixcbiAgICAgIHZpZXdDb250YWluZXJSZWY/OiBWaWV3Q29udGFpbmVyUmVmIHwgbnVsbCxcbiAgICAgIGluamVjdG9yPzogSW5qZWN0b3IgfCBudWxsLFxuICAgICAgY29tcG9uZW50RmFjdG9yeVJlc29sdmVyPzogQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHwgbnVsbCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb21wb25lbnQgPSBjb21wb25lbnQ7XG4gICAgdGhpcy52aWV3Q29udGFpbmVyUmVmID0gdmlld0NvbnRhaW5lclJlZjtcbiAgICB0aGlzLmluamVjdG9yID0gaW5qZWN0b3I7XG4gICAgdGhpcy5jb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgPSBjb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI7XG4gIH1cbn1cblxuLyoqXG4gKiBBIGBUZW1wbGF0ZVBvcnRhbGAgaXMgYSBwb3J0YWwgdGhhdCByZXByZXNlbnRzIHNvbWUgZW1iZWRkZWQgdGVtcGxhdGUgKFRlbXBsYXRlUmVmKS5cbiAqL1xuZXhwb3J0IGNsYXNzIFRlbXBsYXRlUG9ydGFsPEMgPSBhbnk+IGV4dGVuZHMgUG9ydGFsPEVtYmVkZGVkVmlld1JlZjxDPj4ge1xuICAvKiogVGhlIGVtYmVkZGVkIHRlbXBsYXRlIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGluc3RhbnRpYXRlIGFuIGVtYmVkZGVkIFZpZXcgaW4gdGhlIGhvc3QuICovXG4gIHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxDPjtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSBWaWV3Q29udGFpbmVyIGludG8gd2hpY2ggdGhlIHRlbXBsYXRlIHdpbGwgYmUgc3RhbXBlZCBvdXQuICovXG4gIHZpZXdDb250YWluZXJSZWY6IFZpZXdDb250YWluZXJSZWY7XG5cbiAgLyoqIENvbnRleHR1YWwgZGF0YSB0byBiZSBwYXNzZWQgaW4gdG8gdGhlIGVtYmVkZGVkIHZpZXcuICovXG4gIGNvbnRleHQ6IEMgfCB1bmRlZmluZWQ7XG5cbiAgY29uc3RydWN0b3IodGVtcGxhdGU6IFRlbXBsYXRlUmVmPEM+LCB2aWV3Q29udGFpbmVyUmVmOiBWaWV3Q29udGFpbmVyUmVmLCBjb250ZXh0PzogQykge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy50ZW1wbGF0ZVJlZiA9IHRlbXBsYXRlO1xuICAgIHRoaXMudmlld0NvbnRhaW5lclJlZiA9IHZpZXdDb250YWluZXJSZWY7XG4gICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgfVxuXG4gIGdldCBvcmlnaW4oKTogRWxlbWVudFJlZiB7XG4gICAgcmV0dXJuIHRoaXMudGVtcGxhdGVSZWYuZWxlbWVudFJlZjtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRhY2ggdGhlIHBvcnRhbCB0byB0aGUgcHJvdmlkZWQgYFBvcnRhbE91dGxldGAuXG4gICAqIFdoZW4gYSBjb250ZXh0IGlzIHByb3ZpZGVkIGl0IHdpbGwgb3ZlcnJpZGUgdGhlIGBjb250ZXh0YCBwcm9wZXJ0eSBvZiB0aGUgYFRlbXBsYXRlUG9ydGFsYFxuICAgKiBpbnN0YW5jZS5cbiAgICovXG4gIGF0dGFjaChob3N0OiBQb3J0YWxPdXRsZXQsIGNvbnRleHQ6IEMgfCB1bmRlZmluZWQgPSB0aGlzLmNvbnRleHQpOiBFbWJlZGRlZFZpZXdSZWY8Qz4ge1xuICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgcmV0dXJuIHN1cGVyLmF0dGFjaChob3N0KTtcbiAgfVxuXG4gIGRldGFjaCgpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRleHQgPSB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHN1cGVyLmRldGFjaCgpO1xuICB9XG59XG5cblxuLyoqIEEgYFBvcnRhbE91dGxldGAgaXMgYW4gc3BhY2UgdGhhdCBjYW4gY29udGFpbiBhIHNpbmdsZSBgUG9ydGFsYC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUG9ydGFsT3V0bGV0IHtcbiAgLyoqIEF0dGFjaGVzIGEgcG9ydGFsIHRvIHRoaXMgb3V0bGV0LiAqL1xuICBhdHRhY2gocG9ydGFsOiBQb3J0YWw8YW55Pik6IGFueTtcblxuICAvKiogRGV0YWNoZXMgdGhlIGN1cnJlbnRseSBhdHRhY2hlZCBwb3J0YWwgZnJvbSB0aGlzIG91dGxldC4gKi9cbiAgZGV0YWNoKCk6IGFueTtcblxuICAvKiogUGVyZm9ybXMgY2xlYW51cCBiZWZvcmUgdGhlIG91dGxldCBpcyBkZXN0cm95ZWQuICovXG4gIGRpc3Bvc2UoKTogdm9pZDtcblxuICAvKiogV2hldGhlciB0aGVyZSBpcyBjdXJyZW50bHkgYSBwb3J0YWwgYXR0YWNoZWQgdG8gdGhpcyBvdXRsZXQuICovXG4gIGhhc0F0dGFjaGVkKCk6IGJvb2xlYW47XG59XG5cbi8qKlxuICogQGRlcHJlY2F0ZWQgVXNlIGBQb3J0YWxPdXRsZXRgIGluc3RlYWQuXG4gKiBAYnJlYWtpbmctY2hhbmdlIDkuMC4wXG4gKi9cbmV4cG9ydCB0eXBlIFBvcnRhbEhvc3QgPSBQb3J0YWxPdXRsZXQ7XG5cbi8qKlxuICogUGFydGlhbCBpbXBsZW1lbnRhdGlvbiBvZiBQb3J0YWxPdXRsZXQgdGhhdCBoYW5kbGVzIGF0dGFjaGluZ1xuICogQ29tcG9uZW50UG9ydGFsIGFuZCBUZW1wbGF0ZVBvcnRhbC5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEJhc2VQb3J0YWxPdXRsZXQgaW1wbGVtZW50cyBQb3J0YWxPdXRsZXQge1xuICAvKiogVGhlIHBvcnRhbCBjdXJyZW50bHkgYXR0YWNoZWQgdG8gdGhlIGhvc3QuICovXG4gIHByb3RlY3RlZCBfYXR0YWNoZWRQb3J0YWw6IFBvcnRhbDxhbnk+IHwgbnVsbDtcblxuICAvKiogQSBmdW5jdGlvbiB0aGF0IHdpbGwgcGVybWFuZW50bHkgZGlzcG9zZSB0aGlzIGhvc3QuICovXG4gIHByaXZhdGUgX2Rpc3Bvc2VGbjogKCgpID0+IHZvaWQpIHwgbnVsbDtcblxuICAvKiogV2hldGhlciB0aGlzIGhvc3QgaGFzIGFscmVhZHkgYmVlbiBwZXJtYW5lbnRseSBkaXNwb3NlZC4gKi9cbiAgcHJpdmF0ZSBfaXNEaXNwb3NlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIHRoaXMgaG9zdCBoYXMgYW4gYXR0YWNoZWQgcG9ydGFsLiAqL1xuICBoYXNBdHRhY2hlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLl9hdHRhY2hlZFBvcnRhbDtcbiAgfVxuXG4gIGF0dGFjaDxUPihwb3J0YWw6IENvbXBvbmVudFBvcnRhbDxUPik6IENvbXBvbmVudFJlZjxUPjtcbiAgYXR0YWNoPFQ+KHBvcnRhbDogVGVtcGxhdGVQb3J0YWw8VD4pOiBFbWJlZGRlZFZpZXdSZWY8VD47XG4gIGF0dGFjaChwb3J0YWw6IGFueSk6IGFueTtcblxuICAvKiogQXR0YWNoZXMgYSBwb3J0YWwuICovXG4gIGF0dGFjaChwb3J0YWw6IFBvcnRhbDxhbnk+KTogYW55IHtcbiAgICBpZiAoIXBvcnRhbCkge1xuICAgICAgdGhyb3dOdWxsUG9ydGFsRXJyb3IoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oYXNBdHRhY2hlZCgpKSB7XG4gICAgICB0aHJvd1BvcnRhbEFscmVhZHlBdHRhY2hlZEVycm9yKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2lzRGlzcG9zZWQpIHtcbiAgICAgIHRocm93UG9ydGFsT3V0bGV0QWxyZWFkeURpc3Bvc2VkRXJyb3IoKTtcbiAgICB9XG5cbiAgICBpZiAocG9ydGFsIGluc3RhbmNlb2YgQ29tcG9uZW50UG9ydGFsKSB7XG4gICAgICB0aGlzLl9hdHRhY2hlZFBvcnRhbCA9IHBvcnRhbDtcbiAgICAgIHJldHVybiB0aGlzLmF0dGFjaENvbXBvbmVudFBvcnRhbChwb3J0YWwpO1xuICAgIH0gZWxzZSBpZiAocG9ydGFsIGluc3RhbmNlb2YgVGVtcGxhdGVQb3J0YWwpIHtcbiAgICAgIHRoaXMuX2F0dGFjaGVkUG9ydGFsID0gcG9ydGFsO1xuICAgICAgcmV0dXJuIHRoaXMuYXR0YWNoVGVtcGxhdGVQb3J0YWwocG9ydGFsKTtcbiAgICB9XG5cbiAgICB0aHJvd1Vua25vd25Qb3J0YWxUeXBlRXJyb3IoKTtcbiAgfVxuXG4gIGFic3RyYWN0IGF0dGFjaENvbXBvbmVudFBvcnRhbDxUPihwb3J0YWw6IENvbXBvbmVudFBvcnRhbDxUPik6IENvbXBvbmVudFJlZjxUPjtcblxuICBhYnN0cmFjdCBhdHRhY2hUZW1wbGF0ZVBvcnRhbDxDPihwb3J0YWw6IFRlbXBsYXRlUG9ydGFsPEM+KTogRW1iZWRkZWRWaWV3UmVmPEM+O1xuXG4gIC8qKiBEZXRhY2hlcyBhIHByZXZpb3VzbHkgYXR0YWNoZWQgcG9ydGFsLiAqL1xuICBkZXRhY2goKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2F0dGFjaGVkUG9ydGFsKSB7XG4gICAgICB0aGlzLl9hdHRhY2hlZFBvcnRhbC5zZXRBdHRhY2hlZEhvc3QobnVsbCk7XG4gICAgICB0aGlzLl9hdHRhY2hlZFBvcnRhbCA9IG51bGw7XG4gICAgfVxuXG4gICAgdGhpcy5faW52b2tlRGlzcG9zZUZuKCk7XG4gIH1cblxuICAvKiogUGVybWFuZW50bHkgZGlzcG9zZSBvZiB0aGlzIHBvcnRhbCBob3N0LiAqL1xuICBkaXNwb3NlKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmhhc0F0dGFjaGVkKCkpIHtcbiAgICAgIHRoaXMuZGV0YWNoKCk7XG4gICAgfVxuXG4gICAgdGhpcy5faW52b2tlRGlzcG9zZUZuKCk7XG4gICAgdGhpcy5faXNEaXNwb3NlZCA9IHRydWU7XG4gIH1cblxuICAvKiogQGRvY3MtcHJpdmF0ZSAqL1xuICBzZXREaXNwb3NlRm4oZm46ICgpID0+IHZvaWQpIHtcbiAgICB0aGlzLl9kaXNwb3NlRm4gPSBmbjtcbiAgfVxuXG4gIHByaXZhdGUgX2ludm9rZURpc3Bvc2VGbigpIHtcbiAgICBpZiAodGhpcy5fZGlzcG9zZUZuKSB7XG4gICAgICB0aGlzLl9kaXNwb3NlRm4oKTtcbiAgICAgIHRoaXMuX2Rpc3Bvc2VGbiA9IG51bGw7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQGRlcHJlY2F0ZWQgVXNlIGBCYXNlUG9ydGFsT3V0bGV0YCBpbnN0ZWFkLlxuICogQGJyZWFraW5nLWNoYW5nZSA5LjAuMFxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQmFzZVBvcnRhbEhvc3QgZXh0ZW5kcyBCYXNlUG9ydGFsT3V0bGV0IHt9XG4iXX0=