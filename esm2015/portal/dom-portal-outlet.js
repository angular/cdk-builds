/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/portal/dom-portal-outlet.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BasePortalOutlet } from './portal';
/**
 * A PortalOutlet for attaching portals to an arbitrary DOM element outside of the Angular
 * application context.
 */
export class DomPortalOutlet extends BasePortalOutlet {
    /**
     * @param {?} outletElement
     * @param {?} _componentFactoryResolver
     * @param {?} _appRef
     * @param {?} _defaultInjector
     * @param {?=} _document
     */
    constructor(outletElement, _componentFactoryResolver, _appRef, _defaultInjector, 
    /**
     * @deprecated `_document` Parameter to be made required.
     * @breaking-change 10.0.0
     */
    _document) {
        super();
        this.outletElement = outletElement;
        this._componentFactoryResolver = _componentFactoryResolver;
        this._appRef = _appRef;
        this._defaultInjector = _defaultInjector;
        /**
         * Attaches a DOM portal by transferring its content into the outlet.
         * @param portal Portal to be attached.
         * @deprecated To be turned into a method.
         * \@breaking-change 10.0.0
         */
        this.attachDomPortal = (/**
         * @param {?} portal
         * @return {?}
         */
        (portal) => {
            // @breaking-change 10.0.0 Remove check and error once the
            // `_document` constructor parameter is required.
            if (!this._document) {
                throw Error('Cannot attach DOM portal without _document constructor parameter');
            }
            // Anchor used to save the element's previous position so
            // that we can restore it when the portal is detached.
            /** @type {?} */
            let anchorNode = this._document.createComment('dom-portal');
            /** @type {?} */
            let element = portal.element;
            (/** @type {?} */ (element.parentNode)).insertBefore(anchorNode, element);
            this.outletElement.appendChild(element);
            super.setDisposeFn((/**
             * @return {?}
             */
            () => {
                // We can't use `replaceWith` here because IE doesn't support it.
                (/** @type {?} */ (anchorNode.parentNode)).replaceChild(element, anchorNode);
            }));
        });
        this._document = _document;
    }
    /**
     * Attach the given ComponentPortal to DOM element using the ComponentFactoryResolver.
     * @template T
     * @param {?} portal Portal to be attached
     * @return {?} Reference to the created component.
     */
    attachComponentPortal(portal) {
        /** @type {?} */
        const resolver = portal.componentFactoryResolver || this._componentFactoryResolver;
        /** @type {?} */
        const componentFactory = resolver.resolveComponentFactory(portal.component);
        /** @type {?} */
        let componentRef;
        // If the portal specifies a ViewContainerRef, we will use that as the attachment point
        // for the component (in terms of Angular's component tree, not rendering).
        // When the ViewContainerRef is missing, we use the factory to create the component directly
        // and then manually attach the view to the application.
        if (portal.viewContainerRef) {
            componentRef = portal.viewContainerRef.createComponent(componentFactory, portal.viewContainerRef.length, portal.injector || portal.viewContainerRef.injector);
            this.setDisposeFn((/**
             * @return {?}
             */
            () => componentRef.destroy()));
        }
        else {
            componentRef = componentFactory.create(portal.injector || this._defaultInjector);
            this._appRef.attachView(componentRef.hostView);
            this.setDisposeFn((/**
             * @return {?}
             */
            () => {
                this._appRef.detachView(componentRef.hostView);
                componentRef.destroy();
            }));
        }
        // At this point the component has been instantiated, so we move it to the location in the DOM
        // where we want it to be rendered.
        this.outletElement.appendChild(this._getComponentRootNode(componentRef));
        return componentRef;
    }
    /**
     * Attaches a template portal to the DOM as an embedded view.
     * @template C
     * @param {?} portal Portal to be attached.
     * @return {?} Reference to the created embedded view.
     */
    attachTemplatePortal(portal) {
        /** @type {?} */
        let viewContainer = portal.viewContainerRef;
        /** @type {?} */
        let viewRef = viewContainer.createEmbeddedView(portal.templateRef, portal.context);
        viewRef.detectChanges();
        // The method `createEmbeddedView` will add the view as a child of the viewContainer.
        // But for the DomPortalOutlet the view can be added everywhere in the DOM
        // (e.g Overlay Container) To move the view to the specified host element. We just
        // re-append the existing root nodes.
        viewRef.rootNodes.forEach((/**
         * @param {?} rootNode
         * @return {?}
         */
        rootNode => this.outletElement.appendChild(rootNode)));
        this.setDisposeFn(((/**
         * @return {?}
         */
        () => {
            /** @type {?} */
            let index = viewContainer.indexOf(viewRef);
            if (index !== -1) {
                viewContainer.remove(index);
            }
        })));
        // TODO(jelbourn): Return locals from view.
        return viewRef;
    }
    /**
     * Clears out a portal from the DOM.
     * @return {?}
     */
    dispose() {
        super.dispose();
        if (this.outletElement.parentNode != null) {
            this.outletElement.parentNode.removeChild(this.outletElement);
        }
    }
    /**
     * Gets the root HTMLElement for an instantiated component.
     * @private
     * @param {?} componentRef
     * @return {?}
     */
    _getComponentRootNode(componentRef) {
        return (/** @type {?} */ (((/** @type {?} */ (componentRef.hostView))).rootNodes[0]));
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    DomPortalOutlet.prototype._document;
    /**
     * Attaches a DOM portal by transferring its content into the outlet.
     * \@param portal Portal to be attached.
     * @deprecated To be turned into a method.
     * \@breaking-change 10.0.0
     * @type {?}
     */
    DomPortalOutlet.prototype.attachDomPortal;
    /**
     * Element into which the content is projected.
     * @type {?}
     */
    DomPortalOutlet.prototype.outletElement;
    /**
     * @type {?}
     * @private
     */
    DomPortalOutlet.prototype._componentFactoryResolver;
    /**
     * @type {?}
     * @private
     */
    DomPortalOutlet.prototype._appRef;
    /**
     * @type {?}
     * @private
     */
    DomPortalOutlet.prototype._defaultInjector;
}
/**
 * @deprecated Use `DomPortalOutlet` instead.
 * \@breaking-change 9.0.0
 */
export class DomPortalHost extends DomPortalOutlet {
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLXBvcnRhbC1vdXRsZXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3BvcnRhbC9kb20tcG9ydGFsLW91dGxldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFlQSxPQUFPLEVBQUMsZ0JBQWdCLEVBQTZDLE1BQU0sVUFBVSxDQUFDOzs7OztBQU90RixNQUFNLE9BQU8sZUFBZ0IsU0FBUSxnQkFBZ0I7Ozs7Ozs7O0lBR25ELFlBRVcsYUFBc0IsRUFDckIseUJBQW1ELEVBQ25ELE9BQXVCLEVBQ3ZCLGdCQUEwQjtJQUVsQzs7O09BR0c7SUFDSCxTQUFlO1FBQ2pCLEtBQUssRUFBRSxDQUFDO1FBVkMsa0JBQWEsR0FBYixhQUFhLENBQVM7UUFDckIsOEJBQXlCLEdBQXpCLHlCQUF5QixDQUEwQjtRQUNuRCxZQUFPLEdBQVAsT0FBTyxDQUFnQjtRQUN2QixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQVU7Ozs7Ozs7UUFnRnRDLG9CQUFlOzs7O1FBQUcsQ0FBQyxNQUFpQixFQUFFLEVBQUU7WUFDdEMsMERBQTBEO1lBQzFELGlEQUFpRDtZQUNqRCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRTtnQkFDbkIsTUFBTSxLQUFLLENBQUMsa0VBQWtFLENBQUMsQ0FBQzthQUNqRjs7OztnQkFJRyxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDOztnQkFDdkQsT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPO1lBRTVCLG1CQUFBLE9BQU8sQ0FBQyxVQUFVLEVBQUMsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3RELElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXhDLEtBQUssQ0FBQyxZQUFZOzs7WUFBQyxHQUFHLEVBQUU7Z0JBQ3RCLGlFQUFpRTtnQkFDakUsbUJBQUEs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LENBQUM7U0FDL0Q7SUFDSCxDQUFDOzs7Ozs7O0lBR08scUJBQXFCLENBQUMsWUFBK0I7UUFDM0QsT0FBTyxtQkFBQSxDQUFDLG1CQUFBLFlBQVksQ0FBQyxRQUFRLEVBQXdCLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQWUsQ0FBQztJQUNyRixDQUFDO0NBQ0Y7Ozs7OztJQTFIQyxvQ0FBNEI7Ozs7Ozs7O0lBdUY1QiwwQ0FtQkM7Ozs7O0lBdEdHLHdDQUE2Qjs7Ozs7SUFDN0Isb0RBQTJEOzs7OztJQUMzRCxrQ0FBK0I7Ozs7O0lBQy9CLDJDQUFrQzs7Ozs7O0FBeUh4QyxNQUFNLE9BQU8sYUFBYyxTQUFRLGVBQWU7Q0FBRyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsXG4gIENvbXBvbmVudFJlZixcbiAgRW1iZWRkZWRWaWV3UmVmLFxuICBBcHBsaWNhdGlvblJlZixcbiAgSW5qZWN0b3IsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtCYXNlUG9ydGFsT3V0bGV0LCBDb21wb25lbnRQb3J0YWwsIFRlbXBsYXRlUG9ydGFsLCBEb21Qb3J0YWx9IGZyb20gJy4vcG9ydGFsJztcblxuXG4vKipcbiAqIEEgUG9ydGFsT3V0bGV0IGZvciBhdHRhY2hpbmcgcG9ydGFscyB0byBhbiBhcmJpdHJhcnkgRE9NIGVsZW1lbnQgb3V0c2lkZSBvZiB0aGUgQW5ndWxhclxuICogYXBwbGljYXRpb24gY29udGV4dC5cbiAqL1xuZXhwb3J0IGNsYXNzIERvbVBvcnRhbE91dGxldCBleHRlbmRzIEJhc2VQb3J0YWxPdXRsZXQge1xuICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICAvKiogRWxlbWVudCBpbnRvIHdoaWNoIHRoZSBjb250ZW50IGlzIHByb2plY3RlZC4gKi9cbiAgICAgIHB1YmxpYyBvdXRsZXRFbGVtZW50OiBFbGVtZW50LFxuICAgICAgcHJpdmF0ZSBfY29tcG9uZW50RmFjdG9yeVJlc29sdmVyOiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsXG4gICAgICBwcml2YXRlIF9hcHBSZWY6IEFwcGxpY2F0aW9uUmVmLFxuICAgICAgcHJpdmF0ZSBfZGVmYXVsdEluamVjdG9yOiBJbmplY3RvcixcblxuICAgICAgLyoqXG4gICAgICAgKiBAZGVwcmVjYXRlZCBgX2RvY3VtZW50YCBQYXJhbWV0ZXIgdG8gYmUgbWFkZSByZXF1aXJlZC5cbiAgICAgICAqIEBicmVha2luZy1jaGFuZ2UgMTAuMC4wXG4gICAgICAgKi9cbiAgICAgIF9kb2N1bWVudD86IGFueSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fZG9jdW1lbnQgPSBfZG9jdW1lbnQ7XG4gIH1cblxuICAvKipcbiAgICogQXR0YWNoIHRoZSBnaXZlbiBDb21wb25lbnRQb3J0YWwgdG8gRE9NIGVsZW1lbnQgdXNpbmcgdGhlIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlci5cbiAgICogQHBhcmFtIHBvcnRhbCBQb3J0YWwgdG8gYmUgYXR0YWNoZWRcbiAgICogQHJldHVybnMgUmVmZXJlbmNlIHRvIHRoZSBjcmVhdGVkIGNvbXBvbmVudC5cbiAgICovXG4gIGF0dGFjaENvbXBvbmVudFBvcnRhbDxUPihwb3J0YWw6IENvbXBvbmVudFBvcnRhbDxUPik6IENvbXBvbmVudFJlZjxUPiB7XG4gICAgY29uc3QgcmVzb2x2ZXIgPSBwb3J0YWwuY29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHx8IHRoaXMuX2NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjtcbiAgICBjb25zdCBjb21wb25lbnRGYWN0b3J5ID0gcmVzb2x2ZXIucmVzb2x2ZUNvbXBvbmVudEZhY3RvcnkocG9ydGFsLmNvbXBvbmVudCk7XG4gICAgbGV0IGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmPFQ+O1xuXG4gICAgLy8gSWYgdGhlIHBvcnRhbCBzcGVjaWZpZXMgYSBWaWV3Q29udGFpbmVyUmVmLCB3ZSB3aWxsIHVzZSB0aGF0IGFzIHRoZSBhdHRhY2htZW50IHBvaW50XG4gICAgLy8gZm9yIHRoZSBjb21wb25lbnQgKGluIHRlcm1zIG9mIEFuZ3VsYXIncyBjb21wb25lbnQgdHJlZSwgbm90IHJlbmRlcmluZykuXG4gICAgLy8gV2hlbiB0aGUgVmlld0NvbnRhaW5lclJlZiBpcyBtaXNzaW5nLCB3ZSB1c2UgdGhlIGZhY3RvcnkgdG8gY3JlYXRlIHRoZSBjb21wb25lbnQgZGlyZWN0bHlcbiAgICAvLyBhbmQgdGhlbiBtYW51YWxseSBhdHRhY2ggdGhlIHZpZXcgdG8gdGhlIGFwcGxpY2F0aW9uLlxuICAgIGlmIChwb3J0YWwudmlld0NvbnRhaW5lclJlZikge1xuICAgICAgY29tcG9uZW50UmVmID0gcG9ydGFsLnZpZXdDb250YWluZXJSZWYuY3JlYXRlQ29tcG9uZW50KFxuICAgICAgICAgIGNvbXBvbmVudEZhY3RvcnksXG4gICAgICAgICAgcG9ydGFsLnZpZXdDb250YWluZXJSZWYubGVuZ3RoLFxuICAgICAgICAgIHBvcnRhbC5pbmplY3RvciB8fCBwb3J0YWwudmlld0NvbnRhaW5lclJlZi5pbmplY3Rvcik7XG5cbiAgICAgIHRoaXMuc2V0RGlzcG9zZUZuKCgpID0+IGNvbXBvbmVudFJlZi5kZXN0cm95KCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb21wb25lbnRSZWYgPSBjb21wb25lbnRGYWN0b3J5LmNyZWF0ZShwb3J0YWwuaW5qZWN0b3IgfHwgdGhpcy5fZGVmYXVsdEluamVjdG9yKTtcbiAgICAgIHRoaXMuX2FwcFJlZi5hdHRhY2hWaWV3KGNvbXBvbmVudFJlZi5ob3N0Vmlldyk7XG4gICAgICB0aGlzLnNldERpc3Bvc2VGbigoKSA9PiB7XG4gICAgICAgIHRoaXMuX2FwcFJlZi5kZXRhY2hWaWV3KGNvbXBvbmVudFJlZi5ob3N0Vmlldyk7XG4gICAgICAgIGNvbXBvbmVudFJlZi5kZXN0cm95KCk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgLy8gQXQgdGhpcyBwb2ludCB0aGUgY29tcG9uZW50IGhhcyBiZWVuIGluc3RhbnRpYXRlZCwgc28gd2UgbW92ZSBpdCB0byB0aGUgbG9jYXRpb24gaW4gdGhlIERPTVxuICAgIC8vIHdoZXJlIHdlIHdhbnQgaXQgdG8gYmUgcmVuZGVyZWQuXG4gICAgdGhpcy5vdXRsZXRFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX2dldENvbXBvbmVudFJvb3ROb2RlKGNvbXBvbmVudFJlZikpO1xuXG4gICAgcmV0dXJuIGNvbXBvbmVudFJlZjtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRhY2hlcyBhIHRlbXBsYXRlIHBvcnRhbCB0byB0aGUgRE9NIGFzIGFuIGVtYmVkZGVkIHZpZXcuXG4gICAqIEBwYXJhbSBwb3J0YWwgUG9ydGFsIHRvIGJlIGF0dGFjaGVkLlxuICAgKiBAcmV0dXJucyBSZWZlcmVuY2UgdG8gdGhlIGNyZWF0ZWQgZW1iZWRkZWQgdmlldy5cbiAgICovXG4gIGF0dGFjaFRlbXBsYXRlUG9ydGFsPEM+KHBvcnRhbDogVGVtcGxhdGVQb3J0YWw8Qz4pOiBFbWJlZGRlZFZpZXdSZWY8Qz4ge1xuICAgIGxldCB2aWV3Q29udGFpbmVyID0gcG9ydGFsLnZpZXdDb250YWluZXJSZWY7XG4gICAgbGV0IHZpZXdSZWYgPSB2aWV3Q29udGFpbmVyLmNyZWF0ZUVtYmVkZGVkVmlldyhwb3J0YWwudGVtcGxhdGVSZWYsIHBvcnRhbC5jb250ZXh0KTtcbiAgICB2aWV3UmVmLmRldGVjdENoYW5nZXMoKTtcblxuICAgIC8vIFRoZSBtZXRob2QgYGNyZWF0ZUVtYmVkZGVkVmlld2Agd2lsbCBhZGQgdGhlIHZpZXcgYXMgYSBjaGlsZCBvZiB0aGUgdmlld0NvbnRhaW5lci5cbiAgICAvLyBCdXQgZm9yIHRoZSBEb21Qb3J0YWxPdXRsZXQgdGhlIHZpZXcgY2FuIGJlIGFkZGVkIGV2ZXJ5d2hlcmUgaW4gdGhlIERPTVxuICAgIC8vIChlLmcgT3ZlcmxheSBDb250YWluZXIpIFRvIG1vdmUgdGhlIHZpZXcgdG8gdGhlIHNwZWNpZmllZCBob3N0IGVsZW1lbnQuIFdlIGp1c3RcbiAgICAvLyByZS1hcHBlbmQgdGhlIGV4aXN0aW5nIHJvb3Qgbm9kZXMuXG4gICAgdmlld1JlZi5yb290Tm9kZXMuZm9yRWFjaChyb290Tm9kZSA9PiB0aGlzLm91dGxldEVsZW1lbnQuYXBwZW5kQ2hpbGQocm9vdE5vZGUpKTtcblxuICAgIHRoaXMuc2V0RGlzcG9zZUZuKCgoKSA9PiB7XG4gICAgICBsZXQgaW5kZXggPSB2aWV3Q29udGFpbmVyLmluZGV4T2Yodmlld1JlZik7XG4gICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgIHZpZXdDb250YWluZXIucmVtb3ZlKGluZGV4KTtcbiAgICAgIH1cbiAgICB9KSk7XG5cbiAgICAvLyBUT0RPKGplbGJvdXJuKTogUmV0dXJuIGxvY2FscyBmcm9tIHZpZXcuXG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cblxuICAvKipcbiAgICogQXR0YWNoZXMgYSBET00gcG9ydGFsIGJ5IHRyYW5zZmVycmluZyBpdHMgY29udGVudCBpbnRvIHRoZSBvdXRsZXQuXG4gICAqIEBwYXJhbSBwb3J0YWwgUG9ydGFsIHRvIGJlIGF0dGFjaGVkLlxuICAgKiBAZGVwcmVjYXRlZCBUbyBiZSB0dXJuZWQgaW50byBhIG1ldGhvZC5cbiAgICogQGJyZWFraW5nLWNoYW5nZSAxMC4wLjBcbiAgICovXG4gIGF0dGFjaERvbVBvcnRhbCA9IChwb3J0YWw6IERvbVBvcnRhbCkgPT4ge1xuICAgIC8vIEBicmVha2luZy1jaGFuZ2UgMTAuMC4wIFJlbW92ZSBjaGVjayBhbmQgZXJyb3Igb25jZSB0aGVcbiAgICAvLyBgX2RvY3VtZW50YCBjb25zdHJ1Y3RvciBwYXJhbWV0ZXIgaXMgcmVxdWlyZWQuXG4gICAgaWYgKCF0aGlzLl9kb2N1bWVudCkge1xuICAgICAgdGhyb3cgRXJyb3IoJ0Nhbm5vdCBhdHRhY2ggRE9NIHBvcnRhbCB3aXRob3V0IF9kb2N1bWVudCBjb25zdHJ1Y3RvciBwYXJhbWV0ZXInKTtcbiAgICB9XG5cbiAgICAvLyBBbmNob3IgdXNlZCB0byBzYXZlIHRoZSBlbGVtZW50J3MgcHJldmlvdXMgcG9zaXRpb24gc29cbiAgICAvLyB0aGF0IHdlIGNhbiByZXN0b3JlIGl0IHdoZW4gdGhlIHBvcnRhbCBpcyBkZXRhY2hlZC5cbiAgICBsZXQgYW5jaG9yTm9kZSA9IHRoaXMuX2RvY3VtZW50LmNyZWF0ZUNvbW1lbnQoJ2RvbS1wb3J0YWwnKTtcbiAgICBsZXQgZWxlbWVudCA9IHBvcnRhbC5lbGVtZW50O1xuXG4gICAgZWxlbWVudC5wYXJlbnROb2RlIS5pbnNlcnRCZWZvcmUoYW5jaG9yTm9kZSwgZWxlbWVudCk7XG4gICAgdGhpcy5vdXRsZXRFbGVtZW50LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuXG4gICAgc3VwZXIuc2V0RGlzcG9zZUZuKCgpID0+IHtcbiAgICAgIC8vIFdlIGNhbid0IHVzZSBgcmVwbGFjZVdpdGhgIGhlcmUgYmVjYXVzZSBJRSBkb2Vzbid0IHN1cHBvcnQgaXQuXG4gICAgICBhbmNob3JOb2RlLnBhcmVudE5vZGUhLnJlcGxhY2VDaGlsZChlbGVtZW50LCBhbmNob3JOb2RlKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgb3V0IGEgcG9ydGFsIGZyb20gdGhlIERPTS5cbiAgICovXG4gIGRpc3Bvc2UoKTogdm9pZCB7XG4gICAgc3VwZXIuZGlzcG9zZSgpO1xuICAgIGlmICh0aGlzLm91dGxldEVsZW1lbnQucGFyZW50Tm9kZSAhPSBudWxsKSB7XG4gICAgICB0aGlzLm91dGxldEVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLm91dGxldEVsZW1lbnQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSByb290IEhUTUxFbGVtZW50IGZvciBhbiBpbnN0YW50aWF0ZWQgY29tcG9uZW50LiAqL1xuICBwcml2YXRlIF9nZXRDb21wb25lbnRSb290Tm9kZShjb21wb25lbnRSZWY6IENvbXBvbmVudFJlZjxhbnk+KTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiAoY29tcG9uZW50UmVmLmhvc3RWaWV3IGFzIEVtYmVkZGVkVmlld1JlZjxhbnk+KS5yb290Tm9kZXNbMF0gYXMgSFRNTEVsZW1lbnQ7XG4gIH1cbn1cblxuLyoqXG4gKiBAZGVwcmVjYXRlZCBVc2UgYERvbVBvcnRhbE91dGxldGAgaW5zdGVhZC5cbiAqIEBicmVha2luZy1jaGFuZ2UgOS4wLjBcbiAqL1xuZXhwb3J0IGNsYXNzIERvbVBvcnRhbEhvc3QgZXh0ZW5kcyBEb21Qb3J0YWxPdXRsZXQge31cbiJdfQ==