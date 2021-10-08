/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Platform, _isTestEnvironment } from '@angular/cdk/platform';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
/** Container inside which all overlays will render. */
export class OverlayContainer {
    constructor(document, _platform) {
        this._platform = _platform;
        this._document = document;
    }
    ngOnDestroy() {
        this._containerElement?.remove();
    }
    /**
     * This method returns the overlay container element. It will lazily
     * create the element the first time it is called to facilitate using
     * the container in non-browser environments.
     * @returns the container element
     */
    getContainerElement() {
        if (!this._containerElement) {
            this._createContainer();
        }
        return this._containerElement;
    }
    /**
     * Create the overlay container element, which is simply a div
     * with the 'cdk-overlay-container' class on the document body.
     */
    _createContainer() {
        const containerClass = 'cdk-overlay-container';
        // TODO(crisbeto): remove the testing check once we have an overlay testing
        // module or Angular starts tearing down the testing `NgModule`. See:
        // https://github.com/angular/angular/issues/18831
        if (this._platform.isBrowser || _isTestEnvironment()) {
            const oppositePlatformContainers = this._document.querySelectorAll(`.${containerClass}[platform="server"], ` +
                `.${containerClass}[platform="test"]`);
            // Remove any old containers from the opposite platform.
            // This can happen when transitioning from the server to the client.
            for (let i = 0; i < oppositePlatformContainers.length; i++) {
                oppositePlatformContainers[i].remove();
            }
        }
        const container = this._document.createElement('div');
        container.classList.add(containerClass);
        // A long time ago we kept adding new overlay containers whenever a new app was instantiated,
        // but at some point we added logic which clears the duplicate ones in order to avoid leaks.
        // The new logic was a little too aggressive since it was breaking some legitimate use cases.
        // To mitigate the problem we made it so that only containers from a different platform are
        // cleared, but the side-effect was that people started depending on the overly-aggressive
        // logic to clean up their tests for them. Until we can introduce an overlay-specific testing
        // module which does the cleanup, we try to detect that we're in a test environment and we
        // always clear the container. See #17006.
        // TODO(crisbeto): remove the test environment check once we have an overlay testing module.
        if (_isTestEnvironment()) {
            container.setAttribute('platform', 'test');
        }
        else if (!this._platform.isBrowser) {
            container.setAttribute('platform', 'server');
        }
        this._document.body.appendChild(container);
        this._containerElement = container;
    }
}
OverlayContainer.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: OverlayContainer, deps: [{ token: DOCUMENT }, { token: i1.Platform }], target: i0.ɵɵFactoryTarget.Injectable });
OverlayContainer.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: OverlayContainer, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: OverlayContainer, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: i1.Platform }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1jb250YWluZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvb3ZlcmxheS1jb250YWluZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFZLE1BQU0sZUFBZSxDQUFDO0FBQzVELE9BQU8sRUFBQyxRQUFRLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQzs7O0FBRW5FLHVEQUF1RDtBQUV2RCxNQUFNLE9BQU8sZ0JBQWdCO0lBSTNCLFlBQThCLFFBQWEsRUFBWSxTQUFtQjtRQUFuQixjQUFTLEdBQVQsU0FBUyxDQUFVO1FBQ3hFLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO0lBQzVCLENBQUM7SUFFRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLGlCQUFpQixFQUFFLE1BQU0sRUFBRSxDQUFDO0lBQ25DLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILG1CQUFtQjtRQUNqQixJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFO1lBQzNCLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1NBQ3pCO1FBRUQsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUM7SUFDaEMsQ0FBQztJQUVEOzs7T0FHRztJQUNPLGdCQUFnQjtRQUN4QixNQUFNLGNBQWMsR0FBRyx1QkFBdUIsQ0FBQztRQUUvQywyRUFBMkU7UUFDM0UscUVBQXFFO1FBQ3JFLGtEQUFrRDtRQUNsRCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxJQUFJLGtCQUFrQixFQUFFLEVBQUU7WUFDcEQsTUFBTSwwQkFBMEIsR0FDNUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLGNBQWMsdUJBQXVCO2dCQUN6QyxJQUFJLGNBQWMsbUJBQW1CLENBQUMsQ0FBQztZQUUzRSx3REFBd0Q7WUFDeEQsb0VBQW9FO1lBQ3BFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRywwQkFBMEIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzFELDBCQUEwQixDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO2FBQ3hDO1NBQ0Y7UUFFRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0RCxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUV4Qyw2RkFBNkY7UUFDN0YsNEZBQTRGO1FBQzVGLDZGQUE2RjtRQUM3RiwyRkFBMkY7UUFDM0YsMEZBQTBGO1FBQzFGLDZGQUE2RjtRQUM3RiwwRkFBMEY7UUFDMUYsMENBQTBDO1FBQzFDLDRGQUE0RjtRQUM1RixJQUFJLGtCQUFrQixFQUFFLEVBQUU7WUFDeEIsU0FBUyxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7U0FDNUM7YUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUU7WUFDcEMsU0FBUyxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7U0FDOUM7UUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDM0MsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFNBQVMsQ0FBQztJQUNyQyxDQUFDOztxSEFwRVUsZ0JBQWdCLGtCQUlQLFFBQVE7eUhBSmpCLGdCQUFnQixjQURKLE1BQU07bUdBQ2xCLGdCQUFnQjtrQkFENUIsVUFBVTttQkFBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7OzBCQUtqQixNQUFNOzJCQUFDLFFBQVEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7SW5qZWN0LCBJbmplY3RhYmxlLCBPbkRlc3Ryb3l9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtQbGF0Zm9ybSwgX2lzVGVzdEVudmlyb25tZW50fSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuXG4vKiogQ29udGFpbmVyIGluc2lkZSB3aGljaCBhbGwgb3ZlcmxheXMgd2lsbCByZW5kZXIuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBPdmVybGF5Q29udGFpbmVyIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgcHJvdGVjdGVkIF9jb250YWluZXJFbGVtZW50OiBIVE1MRWxlbWVudDtcbiAgcHJvdGVjdGVkIF9kb2N1bWVudDogRG9jdW1lbnQ7XG5cbiAgY29uc3RydWN0b3IoQEluamVjdChET0NVTUVOVCkgZG9jdW1lbnQ6IGFueSwgcHJvdGVjdGVkIF9wbGF0Zm9ybTogUGxhdGZvcm0pIHtcbiAgICB0aGlzLl9kb2N1bWVudCA9IGRvY3VtZW50O1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fY29udGFpbmVyRWxlbWVudD8ucmVtb3ZlKCk7XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBtZXRob2QgcmV0dXJucyB0aGUgb3ZlcmxheSBjb250YWluZXIgZWxlbWVudC4gSXQgd2lsbCBsYXppbHlcbiAgICogY3JlYXRlIHRoZSBlbGVtZW50IHRoZSBmaXJzdCB0aW1lIGl0IGlzIGNhbGxlZCB0byBmYWNpbGl0YXRlIHVzaW5nXG4gICAqIHRoZSBjb250YWluZXIgaW4gbm9uLWJyb3dzZXIgZW52aXJvbm1lbnRzLlxuICAgKiBAcmV0dXJucyB0aGUgY29udGFpbmVyIGVsZW1lbnRcbiAgICovXG4gIGdldENvbnRhaW5lckVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIGlmICghdGhpcy5fY29udGFpbmVyRWxlbWVudCkge1xuICAgICAgdGhpcy5fY3JlYXRlQ29udGFpbmVyKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX2NvbnRhaW5lckVsZW1lbnQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIHRoZSBvdmVybGF5IGNvbnRhaW5lciBlbGVtZW50LCB3aGljaCBpcyBzaW1wbHkgYSBkaXZcbiAgICogd2l0aCB0aGUgJ2Nkay1vdmVybGF5LWNvbnRhaW5lcicgY2xhc3Mgb24gdGhlIGRvY3VtZW50IGJvZHkuXG4gICAqL1xuICBwcm90ZWN0ZWQgX2NyZWF0ZUNvbnRhaW5lcigpOiB2b2lkIHtcbiAgICBjb25zdCBjb250YWluZXJDbGFzcyA9ICdjZGstb3ZlcmxheS1jb250YWluZXInO1xuXG4gICAgLy8gVE9ETyhjcmlzYmV0byk6IHJlbW92ZSB0aGUgdGVzdGluZyBjaGVjayBvbmNlIHdlIGhhdmUgYW4gb3ZlcmxheSB0ZXN0aW5nXG4gICAgLy8gbW9kdWxlIG9yIEFuZ3VsYXIgc3RhcnRzIHRlYXJpbmcgZG93biB0aGUgdGVzdGluZyBgTmdNb2R1bGVgLiBTZWU6XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9pc3N1ZXMvMTg4MzFcbiAgICBpZiAodGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyIHx8IF9pc1Rlc3RFbnZpcm9ubWVudCgpKSB7XG4gICAgICBjb25zdCBvcHBvc2l0ZVBsYXRmb3JtQ29udGFpbmVycyA9XG4gICAgICAgICAgdGhpcy5fZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgLiR7Y29udGFpbmVyQ2xhc3N9W3BsYXRmb3JtPVwic2VydmVyXCJdLCBgICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGAuJHtjb250YWluZXJDbGFzc31bcGxhdGZvcm09XCJ0ZXN0XCJdYCk7XG5cbiAgICAgIC8vIFJlbW92ZSBhbnkgb2xkIGNvbnRhaW5lcnMgZnJvbSB0aGUgb3Bwb3NpdGUgcGxhdGZvcm0uXG4gICAgICAvLyBUaGlzIGNhbiBoYXBwZW4gd2hlbiB0cmFuc2l0aW9uaW5nIGZyb20gdGhlIHNlcnZlciB0byB0aGUgY2xpZW50LlxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvcHBvc2l0ZVBsYXRmb3JtQ29udGFpbmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBvcHBvc2l0ZVBsYXRmb3JtQ29udGFpbmVyc1tpXS5yZW1vdmUoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLl9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjb250YWluZXIuY2xhc3NMaXN0LmFkZChjb250YWluZXJDbGFzcyk7XG5cbiAgICAvLyBBIGxvbmcgdGltZSBhZ28gd2Uga2VwdCBhZGRpbmcgbmV3IG92ZXJsYXkgY29udGFpbmVycyB3aGVuZXZlciBhIG5ldyBhcHAgd2FzIGluc3RhbnRpYXRlZCxcbiAgICAvLyBidXQgYXQgc29tZSBwb2ludCB3ZSBhZGRlZCBsb2dpYyB3aGljaCBjbGVhcnMgdGhlIGR1cGxpY2F0ZSBvbmVzIGluIG9yZGVyIHRvIGF2b2lkIGxlYWtzLlxuICAgIC8vIFRoZSBuZXcgbG9naWMgd2FzIGEgbGl0dGxlIHRvbyBhZ2dyZXNzaXZlIHNpbmNlIGl0IHdhcyBicmVha2luZyBzb21lIGxlZ2l0aW1hdGUgdXNlIGNhc2VzLlxuICAgIC8vIFRvIG1pdGlnYXRlIHRoZSBwcm9ibGVtIHdlIG1hZGUgaXQgc28gdGhhdCBvbmx5IGNvbnRhaW5lcnMgZnJvbSBhIGRpZmZlcmVudCBwbGF0Zm9ybSBhcmVcbiAgICAvLyBjbGVhcmVkLCBidXQgdGhlIHNpZGUtZWZmZWN0IHdhcyB0aGF0IHBlb3BsZSBzdGFydGVkIGRlcGVuZGluZyBvbiB0aGUgb3Zlcmx5LWFnZ3Jlc3NpdmVcbiAgICAvLyBsb2dpYyB0byBjbGVhbiB1cCB0aGVpciB0ZXN0cyBmb3IgdGhlbS4gVW50aWwgd2UgY2FuIGludHJvZHVjZSBhbiBvdmVybGF5LXNwZWNpZmljIHRlc3RpbmdcbiAgICAvLyBtb2R1bGUgd2hpY2ggZG9lcyB0aGUgY2xlYW51cCwgd2UgdHJ5IHRvIGRldGVjdCB0aGF0IHdlJ3JlIGluIGEgdGVzdCBlbnZpcm9ubWVudCBhbmQgd2VcbiAgICAvLyBhbHdheXMgY2xlYXIgdGhlIGNvbnRhaW5lci4gU2VlICMxNzAwNi5cbiAgICAvLyBUT0RPKGNyaXNiZXRvKTogcmVtb3ZlIHRoZSB0ZXN0IGVudmlyb25tZW50IGNoZWNrIG9uY2Ugd2UgaGF2ZSBhbiBvdmVybGF5IHRlc3RpbmcgbW9kdWxlLlxuICAgIGlmIChfaXNUZXN0RW52aXJvbm1lbnQoKSkge1xuICAgICAgY29udGFpbmVyLnNldEF0dHJpYnV0ZSgncGxhdGZvcm0nLCAndGVzdCcpO1xuICAgIH0gZWxzZSBpZiAoIXRoaXMuX3BsYXRmb3JtLmlzQnJvd3Nlcikge1xuICAgICAgY29udGFpbmVyLnNldEF0dHJpYnV0ZSgncGxhdGZvcm0nLCAnc2VydmVyJyk7XG4gICAgfVxuXG4gICAgdGhpcy5fZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuICAgIHRoaXMuX2NvbnRhaW5lckVsZW1lbnQgPSBjb250YWluZXI7XG4gIH1cbn1cbiJdfQ==