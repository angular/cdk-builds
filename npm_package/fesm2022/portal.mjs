export { a as BasePortalHost, B as BasePortalOutlet, d as CdkPortal, f as CdkPortalOutlet, C as ComponentPortal, D as DomPortal, c as DomPortalHost, b as DomPortalOutlet, P as Portal, g as PortalHostDirective, h as PortalModule, T as TemplatePortal, e as TemplatePortalDirective } from './portal-directives-Bw5woq8I.mjs';
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
