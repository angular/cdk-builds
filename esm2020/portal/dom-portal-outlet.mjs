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
        const resolver = portal.componentFactoryResolver || this._componentFactoryResolver;
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
            componentRef = componentFactory.create(portal.injector || this._defaultInjector);
            this._appRef.attachView(componentRef.hostView);
            this.setDisposeFn(() => {
                this._appRef.detachView(componentRef.hostView);
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
        let viewRef = viewContainer.createEmbeddedView(portal.templateRef, portal.context);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLXBvcnRhbC1vdXRsZXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3BvcnRhbC9kb20tcG9ydGFsLW91dGxldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFTSCxPQUFPLEVBQUMsZ0JBQWdCLEVBQTZDLE1BQU0sVUFBVSxDQUFDO0FBRXRGOzs7R0FHRztBQUNILE1BQU0sT0FBTyxlQUFnQixTQUFRLGdCQUFnQjtJQUduRDtJQUNFLG1EQUFtRDtJQUM1QyxhQUFzQixFQUNyQix5QkFBbUQsRUFDbkQsT0FBdUIsRUFDdkIsZ0JBQTBCO0lBRWxDOzs7T0FHRztJQUNILFNBQWU7UUFFZixLQUFLLEVBQUUsQ0FBQztRQVhELGtCQUFhLEdBQWIsYUFBYSxDQUFTO1FBQ3JCLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBMEI7UUFDbkQsWUFBTyxHQUFQLE9BQU8sQ0FBZ0I7UUFDdkIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFVO1FBbUZwQzs7Ozs7V0FLRztRQUNNLG9CQUFlLEdBQUcsQ0FBQyxNQUFpQixFQUFFLEVBQUU7WUFDL0MsMERBQTBEO1lBQzFELGlEQUFpRDtZQUNqRCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLENBQUMsRUFBRTtnQkFDdEUsTUFBTSxLQUFLLENBQUMsa0VBQWtFLENBQUMsQ0FBQzthQUNqRjtZQUVELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUM7WUFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLElBQUksQ0FBQyxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxDQUFDLEVBQUU7Z0JBQzFFLE1BQU0sS0FBSyxDQUFDLHVEQUF1RCxDQUFDLENBQUM7YUFDdEU7WUFFRCx5REFBeUQ7WUFDekQsc0RBQXNEO1lBQ3RELE1BQU0sVUFBVSxHQUFHLElB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QUM7UUFFeEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUU7WUFDckIsSUFBSSxLQUFLLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMzQyxJQUFJLEtBQUssS0FBSyxDQUFDLENBQUMsRUFBRTtnQkFDaEIsYUFBYSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUM3QjtRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGVBQWUsR0FBRyxNQUFNLENBQUM7UUFFOUIsMkNBQTJDO1FBQzNDLE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFvQ0Q7O09BRUc7SUFDTSxPQUFPO1FBQ2QsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2hCLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDOUIsQ0FBQztJQUVELCtEQUErRDtJQUN2RCxxQkFBcUIsQ0FBQyxZQUErQjtRQUMzRCxPQUFRLFlBQVksQ0FBQyxRQUFpQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQWdCLENBQUM7SUFDckYsQ0FBQztDQUNGO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxPQUFPLGFBQWMsU0FBUSxlQUFlO0NBQUciLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLFxuICBDb21wb25lbnRSZWYsXG4gIEVtYmVkZGVkVmlld1JlZixcbiAgQXBwbGljYXRpb25SZWYsXG4gIEluamVjdG9yLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7QmFzZVBvcnRhbE91dGxldCwgQ29tcG9uZW50UG9ydGFsLCBUZW1wbGF0ZVBvcnRhbCwgRG9tUG9ydGFsfSBmcm9tICcuL3BvcnRhbCc7XG5cbi8qKlxuICogQSBQb3J0YWxPdXRsZXQgZm9yIGF0dGFjaGluZyBwb3J0YWxzIHRvIGFuIGFyYml0cmFyeSBET00gZWxlbWVudCBvdXRzaWRlIG9mIHRoZSBBbmd1bGFyXG4gKiBhcHBsaWNhdGlvbiBjb250ZXh0LlxuICovXG5leHBvcnQgY2xhc3MgRG9tUG9ydGFsT3V0bGV0IGV4dGVuZHMgQmFzZVBvcnRhbE91dGxldCB7XG4gIHByaXZhdGUgX2RvY3VtZW50OiBEb2N1bWVudDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAvKiogRWxlbWVudCBpbnRvIHdoaWNoIHRoZSBjb250ZW50IGlzIHByb2plY3RlZC4gKi9cbiAgICBwdWJsaWMgb3V0bGV0RWxlbWVudDogRWxlbWVudCxcbiAgICBwcml2YXRlIF9jb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI6IENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcixcbiAgICBwcml2YXRlIF9hcHBSZWY6IEFwcGxpY2F0aW9uUmVmLFxuICAgIHByaXZhdGUgX2RlZmF1bHRJbmplY3RvcjogSW5qZWN0b3IsXG5cbiAgICAvKipcbiAgICAgKiBAZGVwcmVjYXRlZCBgX2RvY3VtZW50YCBQYXJhbWV0ZXIgdG8gYmUgbWFkZSByZXF1aXJlZC5cbiAgICAgKiBAYnJlYWtpbmctY2hhbmdlIDEwLjAuMFxuICAgICAqL1xuICAgIF9kb2N1bWVudD86IGFueSxcbiAgKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9kb2N1bWVudCA9IF9kb2N1bWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRhY2ggdGhlIGdpdmVuIENvbXBvbmVudFBvcnRhbCB0byBET00gZWxlbWVudCB1c2luZyB0aGUgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLlxuICAgKiBAcGFyYW0gcG9ydGFsIFBvcnRhbCB0byBiZSBhdHRhY2hlZFxuICAgKiBAcmV0dXJucyBSZWZlcmVuY2UgdG8gdGhlIGNyZWF0ZWQgY29tcG9uZW50LlxuICAgKi9cbiAgYXR0YWNoQ29tcG9uZW50UG9ydGFsPFQ+KHBvcnRhbDogQ29tcG9uZW50UG9ydGFsPFQ+KTogQ29tcG9uZW50UmVmPFQ+IHtcbiAgICBjb25zdCByZXNvbHZlciA9IHBvcnRhbC5jb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgfHwgdGhpcy5fY29tcG9uZW50RmFjdG9yeVJlc29sdmVyO1xuICAgIGNvbnN0IGNvbXBvbmVudEZhY3RvcnkgPSByZXNvbHZlci5yZXNvbHZlQ29tcG9uZW50RmFjdG9yeShwb3J0YWwuY29tcG9uZW50KTtcbiAgICBsZXQgY29tcG9uZW50UmVmOiBDb21wb25lbnRSZWY8VD47XG5cbiAgICAvLyBJZiB0aGUgcG9ydGFsIHNwZWNpZmllcyBhIFZpZXdDb250YWluZXJSZWYsIHdlIHdpbGwgdXNlIHRoYXQgYXMgdGhlIGF0dGFjaG1lbnQgcG9pbnRcbiAgICAvLyBmb3IgdGhlIGNvbXBvbmVudCAoaW4gdGVybXMgb2YgQW5ndWxhcidzIGNvbXBvbmVudCB0cmVlLCBub3QgcmVuZGVyaW5nKS5cbiAgICAvLyBXaGVuIHRoZSBWaWV3Q29udGFpbmVyUmVmIGlzIG1pc3NpbmcsIHdlIHVzZSB0aGUgZmFjdG9yeSB0byBjcmVhdGUgdGhlIGNvbXBvbmVudCBkaXJlY3RseVxuICAgIC8vIGFuZCB0aGVuIG1hbnVhbGx5IGF0dGFjaCB0aGUgdmlldyB0byB0aGUgYXBwbGljYXRpb24uXG4gICAgaWYgKHBvcnRhbC52aWV3Q29udGFpbmVyUmVmKSB7XG4gICAgICBjb21wb25lbnRSZWYgPSBwb3J0YWwudmlld0NvbnRhaW5lclJlZi5jcmVhdGVDb21wb25lbnQoXG4gICAgICAgIGNvbXBvbmVudEZhY3RvcnksXG4gICAgICAgIHBvcnRhbC52aWV3Q29udGFpbmVyUmVmLmxlbmd0aCxcbiAgICAgICAgcG9ydGFsLmluamVjdG9yIHx8IHBvcnRhbC52aWV3Q29udGFpbmVyUmVmLmluamVjdG9yLFxuICAgICAgKTtcblxuICAgICAgdGhpcy5zZXREaXNwb3NlRm4oKCkgPT4gY29tcG9uZW50UmVmLmRlc3Ryb3koKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbXBvbmVudFJlZiA9IGNvbXBvbmVudEZhY3RvcnkuY3JlYXRlKHBvcnRhbC5pbmplY3RvciB8fCB0aGlzLl9kZWZhdWx0SW5qZWN0b3IpO1xuICAgICAgdGhpcy5fYXBwUmVmLmF0dGFjaFZpZXcoY29tcG9uZW50UmVmLmhvc3RWaWV3KTtcbiAgICAgIHRoaXMuc2V0RGlzcG9zZUZuKCgpID0+IHtcbiAgICAgICAgdGhpcy5fYXBwUmVmLmRldGFjaFZpZXcoY29tcG9uZW50UmVmLmhvc3RWaWV3KTtcbiAgICAgICAgY29tcG9uZW50UmVmLmRlc3Ryb3koKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICAvLyBBdCB0aGlzIHBvaW50IHRoZSBjb21wb25lbnQgaGFzIGJlZW4gaW5zdGFudGlhdGVkLCBzbyB3ZSBtb3ZlIGl0IHRvIHRoZSBsb2NhdGlvbiBpbiB0aGUgRE9NXG4gICAgLy8gd2hlcmUgd2Ugd2FudCBpdCB0byBiZSByZW5kZXJlZC5cbiAgICB0aGlzLm91dGxldEVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fZ2V0Q29tcG9uZW50Um9vdE5vZGUoY29tcG9uZW50UmVmKSk7XG4gICAgdGhpcy5fYXR0YWNoZWRQb3J0YWwgPSBwb3J0YWw7XG5cbiAgICByZXR1cm4gY29tcG9uZW50UmVmO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGFjaGVzIGEgdGVtcGxhdGUgcG9ydGFsIHRvIHRoZSBET00gYXMgYW4gZW1iZWRkZWQgdmlldy5cbiAgICogQHBhcmFtIHBvcnRhbCBQb3J0YWwgdG8gYmUgYXR0YWNoZWQuXG4gICAqIEByZXR1cm5zIFJlZmVyZW5jZSB0byB0aGUgY3JlYXRlZCBlbWJlZGRlZCB2aWV3LlxuICAgKi9cbiAgYXR0YWNoVGVtcGxhdGVQb3J0YWw8Qz4ocG9ydGFsOiBUZW1wbGF0ZVBvcnRhbDxDPik6IEVtYmVkZGVkVmlld1JlZjxDPiB7XG4gICAgbGV0IHZpZXdDb250YWluZXIgPSBwb3J0YWwudmlld0NvbnRhaW5lclJlZjtcbiAgICBsZXQgdmlld1JlZiA9IHZpZXdDb250YWluZXIuY3JlYXRlRW1iZWRkZWRWaWV3KHBvcnRhbC50ZW1wbGF0ZVJlZiwgcG9ydGFsLmNvbnRleHQpO1xuXG4gICAgLy8gVGhlIG1ldGhvZCBgY3JlYXRlRW1iZWRkZWRWaWV3YCB3aWxsIGFkZCB0aGUgdmlldyBhcyBhIGNoaWxkIG9mIHRoZSB2aWV3Q29udGFpbmVyLlxuICAgIC8vIEJ1dCBmb3IgdGhlIERvbVBvcnRhbE91dGxldCB0aGUgdmlldyBjYW4gYmUgYWRkZWQgZXZlcnl3aGVyZSBpbiB0aGUgRE9NXG4gICAgLy8gKGUuZyBPdmVybGF5IENvbnRhaW5lcikgVG8gbW92ZSB0aGUgdmlldyB0byB0aGUgc3BlY2lmaWVkIGhvc3QgZWxlbWVudC4gV2UganVzdFxuICAgIC8vIHJlLWFwcGVuZCB0aGUgZXhpc3Rpbmcgcm9vdCBub2Rlcy5cbiAgICB2aWV3UmVmLnJvb3ROb2Rlcy5mb3JFYWNoKHJvb3ROb2RlID0+IHRoaXMub3V0bGV0RWxlbWVudC5hcHBlbmRDaGlsZChyb290Tm9kZSkpO1xuXG4gICAgLy8gTm90ZSB0aGF0IHdlIHdhbnQgdG8gZGV0ZWN0IGNoYW5nZXMgYWZ0ZXIgdGhlIG5vZGVzIGhhdmUgYmVlbiBtb3ZlZCBzbyB0aGF0XG4gICAgLy8gYW55IGRpcmVjdGl2ZXMgaW5zaWRlIHRoZSBwb3J0YWwgdGhhdCBhcmUgbG9va2luZyBhdCB0aGUgRE9NIGluc2lkZSBhIGxpZmVjeWNsZVxuICAgIC8vIGhvb2sgd29uJ3QgYmUgaW52b2tlZCB0b28gZWFybHkuXG4gICAgdmlld1JlZi5kZXRlY3RDaGFuZ2VzKCk7XG5cbiAgICB0aGlzLnNldERpc3Bvc2VGbigoKSA9PiB7XG4gICAgICBsZXQgaW5kZXggPSB2aWV3Q29udGFpbmVyLmluZGV4T2Yodmlld1JlZik7XG4gICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgIHZpZXdDb250YWluZXIucmVtb3ZlKGluZGV4KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuX2F0dGFjaGVkUG9ydGFsID0gcG9ydGFsO1xuXG4gICAgLy8gVE9ETyhqZWxib3Vybik6IFJldHVybiBsb2NhbHMgZnJvbSB2aWV3LlxuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGFjaGVzIGEgRE9NIHBvcnRhbCBieSB0cmFuc2ZlcnJpbmcgaXRzIGNvbnRlbnQgaW50byB0aGUgb3V0bGV0LlxuICAgKiBAcGFyYW0gcG9ydGFsIFBvcnRhbCB0byBiZSBhdHRhY2hlZC5cbiAgICogQGRlcHJlY2F0ZWQgVG8gYmUgdHVybmVkIGludG8gYSBtZXRob2QuXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMTAuMC4wXG4gICAqL1xuICBvdmVycmlkZSBhdHRhY2hEb21Qb3J0YWwgPSAocG9ydGFsOiBEb21Qb3J0YWwpID0+IHtcbiAgICAvLyBAYnJlYWtpbmctY2hhbmdlIDEwLjAuMCBSZW1vdmUgY2hlY2sgYW5kIGVycm9yIG9uY2UgdGhlXG4gICAgLy8gYF9kb2N1bWVudGAgY29uc3RydWN0b3IgcGFyYW1ldGVyIGlzIHJlcXVpcmVkLlxuICAgIGlmICghdGhpcy5fZG9jdW1lbnQgJiYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgIHRocm93IEVycm9yKCdDYW5ub3QgYXR0YWNoIERPTSBwb3J0YWwgd2l0aG91dCBfZG9jdW1lbnQgY29uc3RydWN0b3IgcGFyYW1ldGVyJyk7XG4gICAgfVxuXG4gICAgY29uc3QgZWxlbWVudCA9IHBvcnRhbC5lbGVtZW50O1xuICAgIGlmICghZWxlbWVudC5wYXJlbnROb2RlICYmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpKSB7XG4gICAgICB0aHJvdyBFcnJvcignRE9NIHBvcnRhbCBjb250ZW50IG11c3QgYmUgYXR0YWNoZWQgdG8gYSBwYXJlbnQgbm9kZS4nKTtcbiAgICB9XG5cbiAgICAvLyBBbmNob3IgdXNlZCB0byBzYXZlIHRoZSBlbGVtZW50J3MgcHJldmlvdXMgcG9zaXRpb24gc29cbiAgICAvLyB0aGF0IHdlIGNhbiByZXN0b3JlIGl0IHdoZW4gdGhlIHBvcnRhbCBpcyBkZXRhY2hlZC5cbiAgICBjb25zdCBhbmNob3JOb2RlID0gdGhpcy5fZG9jdW1lbnQuY3JlYXRlQ29tbWVudCgnZG9tLXBvcnRhbCcpO1xuXG4gICAgZWxlbWVudC5wYXJlbnROb2RlIS5pbnNlcnRCZWZvcmUoYW5jaG9yTm9kZSwgZWxlbWVudCk7XG4gICAgdGhpcy5vdXRsZXRFbGVtZW50LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgIHRoaXMuX2F0dGFjaGVkUG9ydGFsID0gcG9ydGFsO1xuXG4gICAgc3VwZXIuc2V0RGlzcG9zZUZuKCgpID0+IHtcbiAgICAgIC8vIFdlIGNhbid0IHVzZSBgcmVwbGFjZVdpdGhgIGhlcmUgYmVjYXVzZSBJRSBkb2Vzbid0IHN1cHBvcnQgaXQuXG4gICAgICBpZiAoYW5jaG9yTm9kZS5wYXJlbnROb2RlKSB7XG4gICAgICAgIGFuY2hvck5vZGUucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoZWxlbWVudCwgYW5jaG9yTm9kZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENsZWFycyBvdXQgYSBwb3J0YWwgZnJvbSB0aGUgRE9NLlxuICAgKi9cbiAgb3ZlcnJpZGUgZGlzcG9zZSgpOiB2b2lkIHtcbiAgICBzdXBlci5kaXNwb3NlKCk7XG4gICAgdGhpcy5vdXRsZXRFbGVtZW50LnJlbW92ZSgpO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIHJvb3QgSFRNTEVsZW1lbnQgZm9yIGFuIGluc3RhbnRpYXRlZCBjb21wb25lbnQuICovXG4gIHByaXZhdGUgX2dldENvbXBvbmVudFJvb3ROb2RlKGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmPGFueT4pOiBIVE1MRWxlbWVudCB7XG4gICAgcmV0dXJuIChjb21wb25lbnRSZWYuaG9zdFZpZXcgYXMgRW1iZWRkZWRWaWV3UmVmPGFueT4pLnJvb3ROb2Rlc1swXSBhcyBIVE1MRWxlbWVudDtcbiAgfVxufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkIFVzZSBgRG9tUG9ydGFsT3V0bGV0YCBpbnN0ZWFkLlxuICogQGJyZWFraW5nLWNoYW5nZSA5LjAuMFxuICovXG5leHBvcnQgY2xhc3MgRG9tUG9ydGFsSG9zdCBleHRlbmRzIERvbVBvcnRhbE91dGxldCB7fVxuIl19