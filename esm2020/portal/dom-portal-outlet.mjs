/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector, } from '@angular/core';
import { BasePortalOutlet } from './portal';
/**
 * A PortalOutlet for attaching portals to an arbitrary DOM element outside of the Angular
 * application context.
 */
export class DomPortalOutlet extends BasePortalOutlet {
    /**
     * @param outletElement Element into which the content is projected.
     * @param _componentFactoryResolver Used to resolve the component factory.
     *   Only required when attaching component portals.
     * @param _appRef Reference to the application. Only used in component portals when there
     *   is no `ViewContainerRef` available.
     * @param _defaultInjector Injector to use as a fallback when the portal being attached doesn't
     *   have one. Only used for component portals.
     * @param _document Reference to the document. Used when attaching a DOM portal. Will eventually
     *   become a required parameter.
     */
    constructor(
    /** Element into which the content is projected. */
    outletElement, _componentFactoryResolver, _appRef, _defaultInjector, 
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
         * @breaking-change 10.0.0
         */
        this.attachDomPortal = (portal) => {
            // @breaking-change 10.0.0 Remove check and error once the
            // `_document` constructor parameter is required.
            if (!this._document && (typeof ngDevMode === 'undefined' || ngDevMode)) {
                throw Error('Cannot attach DOM portal without _document constructor parameter');
            }
            const element = portal.element;
            if (!element.parentNode && (typeof ngDevMode === 'undefined' || ngDevMode)) {
                throw Error('DOM portal content must be attached to a parent node.');
            }
            // Anchor used to save the element's previous position so
            // that we can restore it when the portal is detached.
            const anchorNode = this._document.createComment('dom-portal');
            element.parentNode.insertBefore(anchorNode, element);
            this.outletElement.appendChild(element);
            this._attachedPortal = portal;
            super.setDisposeFn(() => {
                // We can't use `replaceWith` here because IE doesn't support it.
                if (anchorNode.parentNode) {
                    anchorNode.parentNode.replaceChild(element, anchorNode);
                }
            });
        };
        this._document = _document;
    }
    /**
     * Attach the given ComponentPortal to DOM element using the ComponentFactoryResolver.
     * @param portal Portal to be attached
     * @returns Reference to the created component.
     */
    attachComponentPortal(portal) {
        const resolver = (portal.componentFactoryResolver || this._componentFactoryResolver);
        if ((typeof ngDevMode === 'undefined' || ngDevMode) && !resolver) {
            throw Error('Cannot attach component portal to outlet without a ComponentFactoryResolver.');
        }
        const componentFactory = resolver.resolveComponentFactory(portal.component);
        let componentRef;
        // If the portal specifies a ViewContainerRef, we will use that as the attachment point
        // for the component (in terms of Angular's component tree, not rendering).
        // When the ViewContainerRef is missing, we use the factory to create the component directly
        // and then manually attach the view to the application.
        if (portal.viewContainerRef) {
            componentRef = portal.viewContainerRef.createComponent(componentFactory, portal.viewContainerRef.length, portal.injector || portal.viewContainerRef.injector);
            this.setDisposeFn(() => componentRef.destroy());
        }
        else {
            if ((typeof ngDevMode === 'undefined' || ngDevMode) && !this._appRef) {
                throw Error('Cannot attach component portal to outlet without an ApplicationRef.');
            }
            componentRef = componentFactory.create(portal.injector || this._defaultInjector || Injector.NULL);
            this._appRef.attachView(componentRef.hostView);
            this.setDisposeFn(() => {
                // Verify that the ApplicationRef has registered views before trying to detach a host view.
                // This check also protects the `detachView` from being called on a destroyed ApplicationRef.
                if (this._appRef.viewCount > 0) {
                    this._appRef.detachView(componentRef.hostView);
                }
                componentRef.destroy();
            });
        }
        // At this point the component has been instantiated, so we move it to the location in the DOM
        // where we want it to be rendered.
        this.outletElement.appendChild(this._getComponentRootNode(componentRef));
        this._attachedPortal = portal;
        return componentRef;
    }
    /**
     * Attaches a template portal to the DOM as an embedded view.
     * @param portal Portal to be attached.
     * @returns Reference to the created embedded view.
     */
    attachTemplatePortal(portal) {
        let viewContainer = portal.viewContainerRef;
        let viewRef = viewContainer.createEmbeddedView(portal.templateRef, portal.context, {
            injector: portal.injector,
        });
        // The method `createEmbeddedView` will add the view as a child of the viewContainer.
        // But for the DomPortalOutlet the view can be added everywhere in the DOM
        // (e.g Overlay Container) To move the view to the specified host element. We just
        // re-append the existing root nodes.
        viewRef.rootNodes.forEach(rootNode => this.outletElement.appendChild(rootNode));
        // Note that we want to detect changes after the nodes have been moved so that
        // any directives inside the portal that are looking at the DOM inside a lifecycle
        // hook won't be invoked too early.
        viewRef.detectChanges();
        this.setDisposeFn(() => {
            let index = viewContainer.indexOf(viewRef);
            if (index !== -1) {
                viewContainer.remove(index);
            }
        });
        this._attachedPortal = portal;
        // TODO(jelbourn): Return locals from view.
        return viewRef;
    }
    /**
     * Clears out a portal from the DOM.
     */
    dispose() {
        super.dispose();
        this.outletElement.remove();
    }
    /** Gets the root HTMLElement for an instantiated component. */
    _getComponentRootNode(componentRef) {
        return componentRef.hostView.rootNodes[0];
    }
}
/**
 * @deprecated Use `DomPortalOutlet` instead.
 * @breaking-change 9.0.0
 */
export class DomPortalHost extends DomPortalOutlet {
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLXBvcnRhbC1vdXRsZXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3BvcnRhbC9kb20tcG9ydGFsLW91dGxldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBS0wsUUFBUSxHQUNULE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxnQkFBZ0IsRUFBNkMsTUFBTSxVQUFVLENBQUM7QUFFdEY7OztHQUdHO0FBQ0gsTUFBTSxPQUFPLGVBQWdCLFNBQVEsZ0JBQWdCO0lBR25EOzs7Ozs7Ozs7O09BVUc7SUFDSDtJQUNFLG1EQUFtRDtJQUM1QyxhQUFzQixFQUNyQix5QkFBb0QsRUFDcEQsT0FBd0IsRUFDeEIsZ0JBQTJCO0lBRW5DOzs7T0FHRztJQUNILFNBQWU7UUFFZixLQUFLLEVBQUUsQ0FBQztRQVhELGtCQUFhLEdBQWIsYUFBYSxDQUFTO1FBQ3JCLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBMkI7UUFDcEQsWUFBTyxHQUFQLE9BQU8sQ0FBaUI7UUFDeEIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFXO1FBb0dyQzs7Ozs7V0FLRztRQUNNLG9CQUFlLEdBQUcsQ0FBQyxNQUFpQixFQUFFLEVBQUU7WUFDL0MsMERBQTBEO1lBQzFELGlEQUFpRDtZQUNqRCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLENBQUMsRUFBRTtnQkFDdEUsTUFBTSxLQUFLLENBQUMsa0VBQWtFLENBQUMsQ0FBQzthQUNqRjtZQUVELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUM7WUFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLElBQUksQ0FBQyxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxDQUFDLEVBQUU7Z0JBQzFFLE1BQU0sS0FBSyxDQUFDLHVEQUF1RCxDQUFD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aUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFnQixDQUFDO0lBQ3JGLENBQUM7Q0FDRjtBQUVEOzs7R0FHRztBQUNILE1BQU0sT0FBTyxhQUFjLFNBQVEsZUFBZTtDQUFHIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIEFwcGxpY2F0aW9uUmVmLFxuICBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsXG4gIENvbXBvbmVudFJlZixcbiAgRW1iZWRkZWRWaWV3UmVmLFxuICBJbmplY3Rvcixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0Jhc2VQb3J0YWxPdXRsZXQsIENvbXBvbmVudFBvcnRhbCwgRG9tUG9ydGFsLCBUZW1wbGF0ZVBvcnRhbH0gZnJvbSAnLi9wb3J0YWwnO1xuXG4vKipcbiAqIEEgUG9ydGFsT3V0bGV0IGZvciBhdHRhY2hpbmcgcG9ydGFscyB0byBhbiBhcmJpdHJhcnkgRE9NIGVsZW1lbnQgb3V0c2lkZSBvZiB0aGUgQW5ndWxhclxuICogYXBwbGljYXRpb24gY29udGV4dC5cbiAqL1xuZXhwb3J0IGNsYXNzIERvbVBvcnRhbE91dGxldCBleHRlbmRzIEJhc2VQb3J0YWxPdXRsZXQge1xuICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQ7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBvdXRsZXRFbGVtZW50IEVsZW1lbnQgaW50byB3aGljaCB0aGUgY29udGVudCBpcyBwcm9qZWN0ZWQuXG4gICAqIEBwYXJhbSBfY29tcG9uZW50RmFjdG9yeVJlc29sdmVyIFVzZWQgdG8gcmVzb2x2ZSB0aGUgY29tcG9uZW50IGZhY3RvcnkuXG4gICAqICAgT25seSByZXF1aXJlZCB3aGVuIGF0dGFjaGluZyBjb21wb25lbnQgcG9ydGFscy5cbiAgICogQHBhcmFtIF9hcHBSZWYgUmVmZXJlbmNlIHRvIHRoZSBhcHBsaWNhdGlvbi4gT25seSB1c2VkIGluIGNvbXBvbmVudCBwb3J0YWxzIHdoZW4gdGhlcmVcbiAgICogICBpcyBubyBgVmlld0NvbnRhaW5lclJlZmAgYXZhaWxhYmxlLlxuICAgKiBAcGFyYW0gX2RlZmF1bHRJbmplY3RvciBJbmplY3RvciB0byB1c2UgYXMgYSBmYWxsYmFjayB3aGVuIHRoZSBwb3J0YWwgYmVpbmcgYXR0YWNoZWQgZG9lc24ndFxuICAgKiAgIGhhdmUgb25lLiBPbmx5IHVzZWQgZm9yIGNvbXBvbmVudCBwb3J0YWxzLlxuICAgKiBAcGFyYW0gX2RvY3VtZW50IFJlZmVyZW5jZSB0byB0aGUgZG9jdW1lbnQuIFVzZWQgd2hlbiBhdHRhY2hpbmcgYSBET00gcG9ydGFsLiBXaWxsIGV2ZW50dWFsbHlcbiAgICogICBiZWNvbWUgYSByZXF1aXJlZCBwYXJhbWV0ZXIuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICAvKiogRWxlbWVudCBpbnRvIHdoaWNoIHRoZSBjb250ZW50IGlzIHByb2plY3RlZC4gKi9cbiAgICBwdWJsaWMgb3V0bGV0RWxlbWVudDogRWxlbWVudCxcbiAgICBwcml2YXRlIF9jb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI/OiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsXG4gICAgcHJpdmF0ZSBfYXBwUmVmPzogQXBwbGljYXRpb25SZWYsXG4gICAgcHJpdmF0ZSBfZGVmYXVsdEluamVjdG9yPzogSW5qZWN0b3IsXG5cbiAgICAvKipcbiAgICAgKiBAZGVwcmVjYXRlZCBgX2RvY3VtZW50YCBQYXJhbWV0ZXIgdG8gYmUgbWFkZSByZXF1aXJlZC5cbiAgICAgKiBAYnJlYWtpbmctY2hhbmdlIDEwLjAuMFxuICAgICAqL1xuICAgIF9kb2N1bWVudD86IGFueSxcbiAgKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9kb2N1bWVudCA9IF9kb2N1bWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRhY2ggdGhlIGdpdmVuIENvbXBvbmVudFBvcnRhbCB0byBET00gZWxlbWVudCB1c2luZyB0aGUgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLlxuICAgKiBAcGFyYW0gcG9ydGFsIFBvcnRhbCB0byBiZSBhdHRhY2hlZFxuICAgKiBAcmV0dXJucyBSZWZlcmVuY2UgdG8gdGhlIGNyZWF0ZWQgY29tcG9uZW50LlxuICAgKi9cbiAgYXR0YWNoQ29tcG9uZW50UG9ydGFsPFQ+KHBvcnRhbDogQ29tcG9uZW50UG9ydGFsPFQ+KTogQ29tcG9uZW50UmVmPFQ+IHtcbiAgICBjb25zdCByZXNvbHZlciA9IChwb3J0YWwuY29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHx8IHRoaXMuX2NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcikhO1xuXG4gICAgaWYgKCh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmICFyZXNvbHZlcikge1xuICAgICAgdGhyb3cgRXJyb3IoJ0Nhbm5vdCBhdHRhY2ggY29tcG9uZW50IHBvcnRhbCB0byBvdXRsZXQgd2l0aG91dCBhIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlci4nKTtcbiAgICB9XG5cbiAgICBjb25zdCBjb21wb25lbnRGYWN0b3J5ID0gcmVzb2x2ZXIucmVzb2x2ZUNvbXBvbmVudEZhY3RvcnkocG9ydGFsLmNvbXBvbmVudCk7XG4gICAgbGV0IGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmPFQ+O1xuXG4gICAgLy8gSWYgdGhlIHBvcnRhbCBzcGVjaWZpZXMgYSBWaWV3Q29udGFpbmVyUmVmLCB3ZSB3aWxsIHVzZSB0aGF0IGFzIHRoZSBhdHRhY2htZW50IHBvaW50XG4gICAgLy8gZm9yIHRoZSBjb21wb25lbnQgKGluIHRlcm1zIG9mIEFuZ3VsYXIncyBjb21wb25lbnQgdHJlZSwgbm90IHJlbmRlcmluZykuXG4gICAgLy8gV2hlbiB0aGUgVmlld0NvbnRhaW5lclJlZiBpcyBtaXNzaW5nLCB3ZSB1c2UgdGhlIGZhY3RvcnkgdG8gY3JlYXRlIHRoZSBjb21wb25lbnQgZGlyZWN0bHlcbiAgICAvLyBhbmQgdGhlbiBtYW51YWxseSBhdHRhY2ggdGhlIHZpZXcgdG8gdGhlIGFwcGxpY2F0aW9uLlxuICAgIGlmIChwb3J0YWwudmlld0NvbnRhaW5lclJlZikge1xuICAgICAgY29tcG9uZW50UmVmID0gcG9ydGFsLnZpZXdDb250YWluZXJSZWYuY3JlYXRlQ29tcG9uZW50KFxuICAgICAgICBjb21wb25lbnRGYWN0b3J5LFxuICAgICAgICBwb3J0YWwudmlld0NvbnRhaW5lclJlZi5sZW5ndGgsXG4gICAgICAgIHBvcnRhbC5pbmplY3RvciB8fCBwb3J0YWwudmlld0NvbnRhaW5lclJlZi5pbmplY3RvcixcbiAgICAgICk7XG5cbiAgICAgIHRoaXMuc2V0RGlzcG9zZUZuKCgpID0+IGNvbXBvbmVudFJlZi5kZXN0cm95KCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgIXRoaXMuX2FwcFJlZikge1xuICAgICAgICB0aHJvdyBFcnJvcignQ2Fubm90IGF0dGFjaCBjb21wb25lbnQgcG9ydGFsIHRvIG91dGxldCB3aXRob3V0IGFuIEFwcGxpY2F0aW9uUmVmLicpO1xuICAgICAgfVxuXG4gICAgICBjb21wb25lbnRSZWYgPSBjb21wb25lbnRGYWN0b3J5LmNyZWF0ZShcbiAgICAgICAgcG9ydGFsLmluamVjdG9yIHx8IHRoaXMuX2RlZmF1bHRJbmplY3RvciB8fCBJbmplY3Rvci5OVUxMLFxuICAgICAgKTtcbiAgICAgIHRoaXMuX2FwcFJlZiEuYXR0YWNoVmlldyhjb21wb25lbnRSZWYuaG9zdFZpZXcpO1xuICAgICAgdGhpcy5zZXREaXNwb3NlRm4oKCkgPT4ge1xuICAgICAgICAvLyBWZXJpZnkgdGhhdCB0aGUgQXBwbGljYXRpb25SZWYgaGFzIHJlZ2lzdGVyZWQgdmlld3MgYmVmb3JlIHRyeWluZyB0byBkZXRhY2ggYSBob3N0IHZpZXcuXG4gICAgICAgIC8vIFRoaXMgY2hlY2sgYWxzbyBwcm90ZWN0cyB0aGUgYGRldGFjaFZpZXdgIGZyb20gYmVpbmcgY2FsbGVkIG9uIGEgZGVzdHJveWVkIEFwcGxpY2F0aW9uUmVmLlxuICAgICAgICBpZiAodGhpcy5fYXBwUmVmIS52aWV3Q291bnQgPiAwKSB7XG4gICAgICAgICAgdGhpcy5fYXBwUmVmIS5kZXRhY2hWaWV3KGNvbXBvbmVudFJlZi5ob3N0Vmlldyk7XG4gICAgICAgIH1cbiAgICAgICAgY29tcG9uZW50UmVmLmRlc3Ryb3koKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICAvLyBBdCB0aGlzIHBvaW50IHRoZSBjb21wb25lbnQgaGFzIGJlZW4gaW5zdGFudGlhdGVkLCBzbyB3ZSBtb3ZlIGl0IHRvIHRoZSBsb2NhdGlvbiBpbiB0aGUgRE9NXG4gICAgLy8gd2hlcmUgd2Ugd2FudCBpdCB0byBiZSByZW5kZXJlZC5cbiAgICB0aGlzLm91dGxldEVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fZ2V0Q29tcG9uZW50Um9vdE5vZGUoY29tcG9uZW50UmVmKSk7XG4gICAgdGhpcy5fYXR0YWNoZWRQb3J0YWwgPSBwb3J0YWw7XG5cbiAgICByZXR1cm4gY29tcG9uZW50UmVmO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGFjaGVzIGEgdGVtcGxhdGUgcG9ydGFsIHRvIHRoZSBET00gYXMgYW4gZW1iZWRkZWQgdmlldy5cbiAgICogQHBhcmFtIHBvcnRhbCBQb3J0YWwgdG8gYmUgYXR0YWNoZWQuXG4gICAqIEByZXR1cm5zIFJlZmVyZW5jZSB0byB0aGUgY3JlYXRlZCBlbWJlZGRlZCB2aWV3LlxuICAgKi9cbiAgYXR0YWNoVGVtcGxhdGVQb3J0YWw8Qz4ocG9ydGFsOiBUZW1wbGF0ZVBvcnRhbDxDPik6IEVtYmVkZGVkVmlld1JlZjxDPiB7XG4gICAgbGV0IHZpZXdDb250YWluZXIgPSBwb3J0YWwudmlld0NvbnRhaW5lclJlZjtcbiAgICBsZXQgdmlld1JlZiA9IHZpZXdDb250YWluZXIuY3JlYXRlRW1iZWRkZWRWaWV3KHBvcnRhbC50ZW1wbGF0ZVJlZiwgcG9ydGFsLmNvbnRleHQsIHtcbiAgICAgIGluamVjdG9yOiBwb3J0YWwuaW5qZWN0b3IsXG4gICAgfSk7XG5cbiAgICAvLyBUaGUgbWV0aG9kIGBjcmVhdGVFbWJlZGRlZFZpZXdgIHdpbGwgYWRkIHRoZSB2aWV3IGFzIGEgY2hpbGQgb2YgdGhlIHZpZXdDb250YWluZXIuXG4gICAgLy8gQnV0IGZvciB0aGUgRG9tUG9ydGFsT3V0bGV0IHRoZSB2aWV3IGNhbiBiZSBhZGRlZCBldmVyeXdoZXJlIGluIHRoZSBET01cbiAgICAvLyAoZS5nIE92ZXJsYXkgQ29udGFpbmVyKSBUbyBtb3ZlIHRoZSB2aWV3IHRvIHRoZSBzcGVjaWZpZWQgaG9zdCBlbGVtZW50LiBXZSBqdXN0XG4gICAgLy8gcmUtYXBwZW5kIHRoZSBleGlzdGluZyByb290IG5vZGVzLlxuICAgIHZpZXdSZWYucm9vdE5vZGVzLmZvckVhY2gocm9vdE5vZGUgPT4gdGhpcy5vdXRsZXRFbGVtZW50LmFwcGVuZENoaWxkKHJvb3ROb2RlKSk7XG5cbiAgICAvLyBOb3RlIHRoYXQgd2Ugd2FudCB0byBkZXRlY3QgY2hhbmdlcyBhZnRlciB0aGUgbm9kZXMgaGF2ZSBiZWVuIG1vdmVkIHNvIHRoYXRcbiAgICAvLyBhbnkgZGlyZWN0aXZlcyBpbnNpZGUgdGhlIHBvcnRhbCB0aGF0IGFyZSBsb29raW5nIGF0IHRoZSBET00gaW5zaWRlIGEgbGlmZWN5Y2xlXG4gICAgLy8gaG9vayB3b24ndCBiZSBpbnZva2VkIHRvbyBlYXJseS5cbiAgICB2aWV3UmVmLmRldGVjdENoYW5nZXMoKTtcblxuICAgIHRoaXMuc2V0RGlzcG9zZUZuKCgpID0+IHtcbiAgICAgIGxldCBpbmRleCA9IHZpZXdDb250YWluZXIuaW5kZXhPZih2aWV3UmVmKTtcbiAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgdmlld0NvbnRhaW5lci5yZW1vdmUoaW5kZXgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5fYXR0YWNoZWRQb3J0YWwgPSBwb3J0YWw7XG5cbiAgICAvLyBUT0RPKGplbGJvdXJuKTogUmV0dXJuIGxvY2FscyBmcm9tIHZpZXcuXG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cblxuICAvKipcbiAgICogQXR0YWNoZXMgYSBET00gcG9ydGFsIGJ5IHRyYW5zZmVycmluZyBpdHMgY29udGVudCBpbnRvIHRoZSBvdXRsZXQuXG4gICAqIEBwYXJhbSBwb3J0YWwgUG9ydGFsIHRvIGJlIGF0dGFjaGVkLlxuICAgKiBAZGVwcmVjYXRlZCBUbyBiZSB0dXJuZWQgaW50byBhIG1ldGhvZC5cbiAgICogQGJyZWFraW5nLWNoYW5nZSAxMC4wLjBcbiAgICovXG4gIG92ZXJyaWRlIGF0dGFjaERvbVBvcnRhbCA9IChwb3J0YWw6IERvbVBvcnRhbCkgPT4ge1xuICAgIC8vIEBicmVha2luZy1jaGFuZ2UgMTAuMC4wIFJlbW92ZSBjaGVjayBhbmQgZXJyb3Igb25jZSB0aGVcbiAgICAvLyBgX2RvY3VtZW50YCBjb25zdHJ1Y3RvciBwYXJhbWV0ZXIgaXMgcmVxdWlyZWQuXG4gICAgaWYgKCF0aGlzLl9kb2N1bWVudCAmJiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgdGhyb3cgRXJyb3IoJ0Nhbm5vdCBhdHRhY2ggRE9NIHBvcnRhbCB3aXRob3V0IF9kb2N1bWVudCBjb25zdHJ1Y3RvciBwYXJhbWV0ZXInKTtcbiAgICB9XG5cbiAgICBjb25zdCBlbGVtZW50ID0gcG9ydGFsLmVsZW1lbnQ7XG4gICAgaWYgKCFlbGVtZW50LnBhcmVudE5vZGUgJiYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgIHRocm93IEVycm9yKCdET00gcG9ydGFsIGNvbnRlbnQgbXVzdCBiZSBhdHRhY2hlZCB0byBhIHBhcmVudCBub2RlLicpO1xuICAgIH1cblxuICAgIC8vIEFuY2hvciB1c2VkIHRvIHNhdmUgdGhlIGVsZW1lbnQncyBwcmV2aW91cyBwb3NpdGlvbiBzb1xuICAgIC8vIHRoYXQgd2UgY2FuIHJlc3RvcmUgaXQgd2hlbiB0aGUgcG9ydGFsIGlzIGRldGFjaGVkLlxuICAgIGNvbnN0IGFuY2hvck5vZGUgPSB0aGlzLl9kb2N1bWVudC5jcmVhdGVDb21tZW50KCdkb20tcG9ydGFsJyk7XG5cbiAgICBlbGVtZW50LnBhcmVudE5vZGUhLmluc2VydEJlZm9yZShhbmNob3JOb2RlLCBlbGVtZW50KTtcbiAgICB0aGlzLm91dGxldEVsZW1lbnQuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgdGhpcy5fYXR0YWNoZWRQb3J0YWwgPSBwb3J0YWw7XG5cbiAgICBzdXBlci5zZXREaXNwb3NlRm4oKCkgPT4ge1xuICAgICAgLy8gV2UgY2FuJ3QgdXNlIGByZXBsYWNlV2l0aGAgaGVyZSBiZWNhdXNlIElFIGRvZXNuJ3Qgc3VwcG9ydCBpdC5cbiAgICAgIGlmIChhbmNob3JOb2RlLnBhcmVudE5vZGUpIHtcbiAgICAgICAgYW5jaG9yTm9kZS5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChlbGVtZW50LCBhbmNob3JOb2RlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogQ2xlYXJzIG91dCBhIHBvcnRhbCBmcm9tIHRoZSBET00uXG4gICAqL1xuICBvdmVycmlkZSBkaXNwb3NlKCk6IHZvaWQge1xuICAgIHN1cGVyLmRpc3Bvc2UoKTtcbiAgICB0aGlzLm91dGxldEVsZW1lbnQucmVtb3ZlKCk7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgcm9vdCBIVE1MRWxlbWVudCBmb3IgYW4gaW5zdGFudGlhdGVkIGNvbXBvbmVudC4gKi9cbiAgcHJpdmF0ZSBfZ2V0Q29tcG9uZW50Um9vdE5vZGUoY29tcG9uZW50UmVmOiBDb21wb25lbnRSZWY8YW55Pik6IEhUTUxFbGVtZW50IHtcbiAgICByZXR1cm4gKGNvbXBvbmVudFJlZi5ob3N0VmlldyBhcyBFbWJlZGRlZFZpZXdSZWY8YW55Pikucm9vdE5vZGVzWzBdIGFzIEhUTUxFbGVtZW50O1xuICB9XG59XG5cbi8qKlxuICogQGRlcHJlY2F0ZWQgVXNlIGBEb21Qb3J0YWxPdXRsZXRgIGluc3RlYWQuXG4gKiBAYnJlYWtpbmctY2hhbmdlIDkuMC4wXG4gKi9cbmV4cG9ydCBjbGFzcyBEb21Qb3J0YWxIb3N0IGV4dGVuZHMgRG9tUG9ydGFsT3V0bGV0IHt9XG4iXX0=