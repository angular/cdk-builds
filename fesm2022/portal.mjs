export { g as BasePortalHost, B as BasePortalOutlet, b as CdkPortal, C as CdkPortalOutlet, a as ComponentPortal, f as DomPortal, h as DomPortalHost, D as DomPortalOutlet, e as Portal, d as PortalHostDirective, P as PortalModule, T as TemplatePortal, c as TemplatePortalDirective } from './portal-directives-6dd242f4.mjs';
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
