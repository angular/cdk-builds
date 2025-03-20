import { B as BasePortalOutlet, a as ComponentPortal, T as TemplatePortal, D as DomPortal } from '../portal-directives.d-fefec9d6.js';
export { B as BasePortalOutlet, c as CdkPortal, C as CdkPortalOutlet, h as CdkPortalOutletAttachedRef, a as ComponentPortal, b as ComponentType, D as DomPortal, g as Portal, e as PortalHostDirective, P as PortalModule, f as PortalOutlet, T as TemplatePortal, d as TemplatePortalDirective } from '../portal-directives.d-fefec9d6.js';
import { ApplicationRef, Injector, ComponentRef, EmbeddedViewRef } from '@angular/core';

/**
 * A PortalOutlet for attaching portals to an arbitrary DOM element outside of the Angular
 * application context.
 */
declare class DomPortalOutlet extends BasePortalOutlet {
    /** Element into which the content is projected. */
    outletElement: Element;
    private _appRef?;
    private _defaultInjector?;
    /**
     * @param outletElement Element into which the content is projected.
     * @param _appRef Reference to the application. Only used in component portals when there
     *   is no `ViewContainerRef` available.
     * @param _defaultInjector Injector to use as a fallback when the portal being attached doesn't
     *   have one. Only used for component portals.
     */
    constructor(
    /** Element into which the content is projected. */
    outletElement: Element, _appRef?: ApplicationRef | undefined, _defaultInjector?: Injector | undefined);
    /**
     * Attach the given ComponentPortal to DOM element.
     * @param portal Portal to be attached
     * @returns Reference to the created component.
     */
    attachComponentPortal<T>(portal: ComponentPortal<T>): ComponentRef<T>;
    /**
     * Attaches a template portal to the DOM as an embedded view.
     * @param portal Portal to be attached.
     * @returns Reference to the created embedded view.
     */
    attachTemplatePortal<C>(portal: TemplatePortal<C>): EmbeddedViewRef<C>;
    /**
     * Attaches a DOM portal by transferring its content into the outlet.
     * @param portal Portal to be attached.
     * @deprecated To be turned into a method.
     * @breaking-change 10.0.0
     */
    attachDomPortal: (portal: DomPortal) => void;
    /**
     * Clears out a portal from the DOM.
     */
    dispose(): void;
    /** Gets the root HTMLElement for an instantiated component. */
    private _getComponentRootNode;
}

export { DomPortalOutlet };
