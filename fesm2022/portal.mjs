export { d as BasePortalHost, B as BasePortalOutlet, f as CdkPortal, C as CdkPortalOutlet, a as ComponentPortal, c as DomPortal, e as DomPortalHost, D as DomPortalOutlet, b as Portal, h as PortalHostDirective, P as PortalModule, T as TemplatePortal, g as TemplatePortalDirective } from './portal-directives-06c9f3e0.mjs';
import '@angular/core';
import '@angular/common';

/**
 * Custom injector to be used when providing custom
 * injection tokens to components inside a portal.
 * @docs-private
 * @deprecated Use `Injector.create` instead.
 * @breaking-change 11.0.0
 */
class PortalInjector {
    _parentInjector;
    _customTokens;
    constructor(_parentInjector, _customTokens) {
        this._parentInjector = _parentInjector;
        this._customTokens = _customTokens;
    }
    get(token, notFoundValue) {
        const value = this._customTokens.get(token);
        if (typeof value !== 'undefined') {
            return value;
        }
        return this._parentInjector.get(token, notFoundValue);
    }
}

export { PortalInjector };
//# sourceMappingURL=portal.mjs.map
