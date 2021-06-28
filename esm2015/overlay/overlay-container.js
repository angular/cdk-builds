/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Platform } from '@angular/cdk/platform';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
import * as i2 from "@angular/cdk/platform";
const globalsForTest = (typeof window !== 'undefined' ? window : {});
/**
 * Whether we're in a testing environment.
 * TODO(crisbeto): remove this once we have an overlay testing module or Angular starts tearing
 * down the testing `NgModule` (see https://github.com/angular/angular/issues/18831).
 */
const isTestEnvironment = (typeof globalsForTest.__karma__ !== 'undefined' && !!globalsForTest.__karma__) ||
    (typeof globalsForTest.jasmine !== 'undefined' && !!globalsForTest.jasmine) ||
    (typeof globalsForTest.jest !== 'undefined' && !!globalsForTest.jest) ||
    (typeof globalsForTest.Mocha !== 'undefined' && !!globalsForTest.Mocha);
/** Container inside which all overlays will render. */
export class OverlayContainer {
    constructor(document, _platform) {
        this._platform = _platform;
        this._document = document;
    }
    ngOnDestroy() {
        const container = this._containerElement;
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    }
    /**
     * This method returns the overlay container element. It will lazily
     * create the element the first time  it is called to facilitate using
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
        if (this._platform.isBrowser || isTestEnvironment) {
            const oppositePlatformContainers = this._document.querySelectorAll(`.${containerClass}[platform="server"], ` +
                `.${containerClass}[platform="test"]`);
            // Remove any old containers from the opposite platform.
            // This can happen when transitioning from the server to the client.
            for (let i = 0; i < oppositePlatformContainers.length; i++) {
                oppositePlatformContainers[i].parentNode.removeChild(oppositePlatformContainers[i]);
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
        if (isTestEnvironment) {
            container.setAttribute('platform', 'test');
        }
        else if (!this._platform.isBrowser) {
            container.setAttribute('platform', 'server');
        }
        this._document.body.appendChild(container);
        this._containerElement = container;
    }
}
OverlayContainer.ɵprov = i0.ɵɵdefineInjectable({ factory: function OverlayContainer_Factory() { return new OverlayContainer(i0.ɵɵinject(i1.DOCUMENT), i0.ɵɵinject(i2.Platform)); }, token: OverlayContainer, providedIn: "root" });
OverlayContainer.decorators = [
    { type: Injectable, args: [{ providedIn: 'root' },] }
];
OverlayContainer.ctorParameters = () => [
    { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] },
    { type: Platform }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1jb250YWluZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvb3ZlcmxheS1jb250YWluZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFZLE1BQU0sZUFBZSxDQUFDO0FBQzVELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQzs7OztBQWEvQyxNQUFNLGNBQWMsR0FBRyxDQUFDLE9BQU8sTUFBTSxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQXNCLENBQUM7QUFFMUY7Ozs7R0FJRztBQUNILE1BQU0saUJBQWlCLEdBQ25CLENBQUMsT0FBTyxjQUFjLENBQUMsU0FBUyxLQUFLLFdBQVcsSUFBSSxDQUFDLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQztJQUMvRSxDQUFDLE9BQU8sY0FBYyxDQUFDLE9BQU8sS0FBSyxXQUFXLElBQUksQ0FBQyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUM7SUFDM0UsQ0FBQyxPQUFPLGNBQWMsQ0FBQyxJQUFJLEtBQUssV0FBVyxJQUFJLENBQUMsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDO0lBQ3JFLENBQUMsT0FBTyxjQUFjLENBQUMsS0FBSyxLQUFLLFdBQVcsSUFBSSxDQUFDLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBRTVFLHVEQUF1RDtBQUV2RCxNQUFNLE9BQU8sZ0JBQWdCO0lBSTNCLFlBQThCLFFBQWEsRUFBWSxTQUFtQjtRQUFuQixjQUFTLEdBQVQsU0FBUyxDQUFVO1FBQ3hFLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO0lBQzVCLENBQUM7SUFFRCxXQUFXO1FBQ1QsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDO1FBRXpDLElBQUksU0FBUyxJQUFJLFNBQVMsQ0FBQyxVQUFVLEVBQUU7WUFDckMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDN0M7SUFDSCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxtQkFBbUI7UUFDakIsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtZQUMzQixJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztTQUN6QjtRQUVELE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDO0lBQ2hDLENBQUM7SUFFRDs7O09BR0c7SUFDTyxnQkFBZ0I7UUFDeEIsTUFBTSxjQUFjLEdBQUcsdUJBQXVCLENBQUM7UUFFL0MsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsSUFBSSxpQkFBaUIsRUFBRTtZQUNqRCxNQUFNLDBCQUEwQixHQUM1QixJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLElBQUksY0FBYyx1QkFBdUI7Z0JBQ3pDLElBQUksY0FBYyxtQkFBbUIsQ0FBQyxDQUFDO1lBRTNFLHdEQUF3RDtZQUN4RCxvRUFBb0U7WUFDcEUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLDBCQUEwQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDMUQsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVyxDQUFDLFdBQVcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3RGO1NBQ0Y7UUFFRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0RCxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUV4Qyw2RkFBNkY7UUFDN0YsNEZBQTRGO1FBQzVGLDZGQUE2RjtRQUM3RiwyRkFBMkY7UUFDM0YsMEZBQTBGO1FBQzFGLDZGQUE2RjtRQUM3RiwwRkFBMEY7UUFDMUYsMENBQTBDO1FBQzFDLDRGQUE0RjtRQUM1RixJQUFJLGlCQUFpQixFQUFFO1lBQ3JCLFNBQVMsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQzVDO2FBQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFO1lBQ3BDLFNBQVMsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQzlDO1FBRUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzNDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxTQUFTLENBQUM7SUFDckMsQ0FBQzs7OztZQXRFRixVQUFVLFNBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzs7NENBS2pCLE1BQU0sU0FBQyxRQUFRO1lBaEN0QixRQUFRIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge0luamVjdCwgSW5qZWN0YWJsZSwgT25EZXN0cm95fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7UGxhdGZvcm19IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5cbi8vIEF2b2lkIHVzaW5nIGBkZWNsYXJlIGNvbnN0YCBiZWNhdXNlIGl0IGNhdXNlZCBjb25mbGljdHMgaW5zaWRlIEdvb2dsZVxuLy8gd2l0aCB0aGUgcmVhbCB0eXBpbmdzIGZvciB0aGVzZSBzeW1ib2xzLiBXZSB1c2UgYGRlY2xhcmUgaW50ZXJmYWNlYCBpbnN0ZWFkXG4vLyBvZiBqdXN0IGBpbnRlcmZhY2VgIGZvciBpbnRlcm9wIHdpdGggQ2xvc3VyZSBDb21waWxlciAocHJldmVudHMgcHJvcGVydHkgcmVuYW1pbmcpOlxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvdHNpY2tsZS9ibG9iL21hc3Rlci9SRUFETUUubWQjZGlmZmVyZW5jZXMtZnJvbS10eXBlc2NyaXB0XG5kZWNsYXJlIGludGVyZmFjZSBUZXN0R2xvYmFscyB7XG4gIGphc21pbmU6IHVua25vd247XG4gIF9fa2FybWFfXzogdW5rbm93bjtcbiAgamVzdDogdW5rbm93bjtcbiAgTW9jaGE6IHVua25vd247XG59XG5cbmNvbnN0IGdsb2JhbHNGb3JUZXN0ID0gKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDoge30pIGFzIHt9IGFzIFRlc3RHbG9iYWxzO1xuXG4vKipcbiAqIFdoZXRoZXIgd2UncmUgaW4gYSB0ZXN0aW5nIGVudmlyb25tZW50LlxuICogVE9ETyhjcmlzYmV0byk6IHJlbW92ZSB0aGlzIG9uY2Ugd2UgaGF2ZSBhbiBvdmVybGF5IHRlc3RpbmcgbW9kdWxlIG9yIEFuZ3VsYXIgc3RhcnRzIHRlYXJpbmdcbiAqIGRvd24gdGhlIHRlc3RpbmcgYE5nTW9kdWxlYCAoc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvaXNzdWVzLzE4ODMxKS5cbiAqL1xuY29uc3QgaXNUZXN0RW52aXJvbm1lbnQgPVxuICAgICh0eXBlb2YgZ2xvYmFsc0ZvclRlc3QuX19rYXJtYV9fICE9PSAndW5kZWZpbmVkJyAmJiAhIWdsb2JhbHNGb3JUZXN0Ll9fa2FybWFfXykgfHxcbiAgICAodHlwZW9mIGdsb2JhbHNGb3JUZXN0Lmphc21pbmUgIT09ICd1bmRlZmluZWQnICYmICEhZ2xvYmFsc0ZvclRlc3QuamFzbWluZSkgfHxcbiAgICAodHlwZW9mIGdsb2JhbHNGb3JUZXN0Lmplc3QgIT09ICd1bmRlZmluZWQnICYmICEhZ2xvYmFsc0ZvclRlc3QuamVzdCkgfHxcbiAgICAodHlwZW9mIGdsb2JhbHNGb3JUZXN0Lk1vY2hhICE9PSAndW5kZWZpbmVkJyAmJiAhIWdsb2JhbHNGb3JUZXN0Lk1vY2hhKTtcblxuLyoqIENvbnRhaW5lciBpbnNpZGUgd2hpY2ggYWxsIG92ZXJsYXlzIHdpbGwgcmVuZGVyLiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgT3ZlcmxheUNvbnRhaW5lciBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIHByb3RlY3RlZCBfY29udGFpbmVyRWxlbWVudDogSFRNTEVsZW1lbnQ7XG4gIHByb3RlY3RlZCBfZG9jdW1lbnQ6IERvY3VtZW50O1xuXG4gIGNvbnN0cnVjdG9yKEBJbmplY3QoRE9DVU1FTlQpIGRvY3VtZW50OiBhbnksIHByb3RlY3RlZCBfcGxhdGZvcm06IFBsYXRmb3JtKSB7XG4gICAgdGhpcy5fZG9jdW1lbnQgPSBkb2N1bWVudDtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuX2NvbnRhaW5lckVsZW1lbnQ7XG5cbiAgICBpZiAoY29udGFpbmVyICYmIGNvbnRhaW5lci5wYXJlbnROb2RlKSB7XG4gICAgICBjb250YWluZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChjb250YWluZXIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIG1ldGhvZCByZXR1cm5zIHRoZSBvdmVybGF5IGNvbnRhaW5lciBlbGVtZW50LiBJdCB3aWxsIGxhemlseVxuICAgKiBjcmVhdGUgdGhlIGVsZW1lbnQgdGhlIGZpcnN0IHRpbWUgIGl0IGlzIGNhbGxlZCB0byBmYWNpbGl0YXRlIHVzaW5nXG4gICAqIHRoZSBjb250YWluZXIgaW4gbm9uLWJyb3dzZXIgZW52aXJvbm1lbnRzLlxuICAgKiBAcmV0dXJucyB0aGUgY29udGFpbmVyIGVsZW1lbnRcbiAgICovXG4gIGdldENvbnRhaW5lckVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIGlmICghdGhpcy5fY29udGFpbmVyRWxlbWVudCkge1xuICAgICAgdGhpcy5fY3JlYXRlQ29udGFpbmVyKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX2NvbnRhaW5lckVsZW1lbnQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIHRoZSBvdmVybGF5IGNvbnRhaW5lciBlbGVtZW50LCB3aGljaCBpcyBzaW1wbHkgYSBkaXZcbiAgICogd2l0aCB0aGUgJ2Nkay1vdmVybGF5LWNvbnRhaW5lcicgY2xhc3Mgb24gdGhlIGRvY3VtZW50IGJvZHkuXG4gICAqL1xuICBwcm90ZWN0ZWQgX2NyZWF0ZUNvbnRhaW5lcigpOiB2b2lkIHtcbiAgICBjb25zdCBjb250YWluZXJDbGFzcyA9ICdjZGstb3ZlcmxheS1jb250YWluZXInO1xuXG4gICAgaWYgKHRoaXMuX3BsYXRmb3JtLmlzQnJvd3NlciB8fCBpc1Rlc3RFbnZpcm9ubWVudCkge1xuICAgICAgY29uc3Qgb3Bwb3NpdGVQbGF0Zm9ybUNvbnRhaW5lcnMgPVxuICAgICAgICAgIHRoaXMuX2RvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYC4ke2NvbnRhaW5lckNsYXNzfVtwbGF0Zm9ybT1cInNlcnZlclwiXSwgYCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgLiR7Y29udGFpbmVyQ2xhc3N9W3BsYXRmb3JtPVwidGVzdFwiXWApO1xuXG4gICAgICAvLyBSZW1vdmUgYW55IG9sZCBjb250YWluZXJzIGZyb20gdGhlIG9wcG9zaXRlIHBsYXRmb3JtLlxuICAgICAgLy8gVGhpcyBjYW4gaGFwcGVuIHdoZW4gdHJhbnNpdGlvbmluZyBmcm9tIHRoZSBzZXJ2ZXIgdG8gdGhlIGNsaWVudC5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb3Bwb3NpdGVQbGF0Zm9ybUNvbnRhaW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgb3Bwb3NpdGVQbGF0Zm9ybUNvbnRhaW5lcnNbaV0ucGFyZW50Tm9kZSEucmVtb3ZlQ2hpbGQob3Bwb3NpdGVQbGF0Zm9ybUNvbnRhaW5lcnNbaV0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKGNvbnRhaW5lckNsYXNzKTtcblxuICAgIC8vIEEgbG9uZyB0aW1lIGFnbyB3ZSBrZXB0IGFkZGluZyBuZXcgb3ZlcmxheSBjb250YWluZXJzIHdoZW5ldmVyIGEgbmV3IGFwcCB3YXMgaW5zdGFudGlhdGVkLFxuICAgIC8vIGJ1dCBhdCBzb21lIHBvaW50IHdlIGFkZGVkIGxvZ2ljIHdoaWNoIGNsZWFycyB0aGUgZHVwbGljYXRlIG9uZXMgaW4gb3JkZXIgdG8gYXZvaWQgbGVha3MuXG4gICAgLy8gVGhlIG5ldyBsb2dpYyB3YXMgYSBsaXR0bGUgdG9vIGFnZ3Jlc3NpdmUgc2luY2UgaXQgd2FzIGJyZWFraW5nIHNvbWUgbGVnaXRpbWF0ZSB1c2UgY2FzZXMuXG4gICAgLy8gVG8gbWl0aWdhdGUgdGhlIHByb2JsZW0gd2UgbWFkZSBpdCBzbyB0aGF0IG9ubHkgY29udGFpbmVycyBmcm9tIGEgZGlmZmVyZW50IHBsYXRmb3JtIGFyZVxuICAgIC8vIGNsZWFyZWQsIGJ1dCB0aGUgc2lkZS1lZmZlY3Qgd2FzIHRoYXQgcGVvcGxlIHN0YXJ0ZWQgZGVwZW5kaW5nIG9uIHRoZSBvdmVybHktYWdncmVzc2l2ZVxuICAgIC8vIGxvZ2ljIHRvIGNsZWFuIHVwIHRoZWlyIHRlc3RzIGZvciB0aGVtLiBVbnRpbCB3ZSBjYW4gaW50cm9kdWNlIGFuIG92ZXJsYXktc3BlY2lmaWMgdGVzdGluZ1xuICAgIC8vIG1vZHVsZSB3aGljaCBkb2VzIHRoZSBjbGVhbnVwLCB3ZSB0cnkgdG8gZGV0ZWN0IHRoYXQgd2UncmUgaW4gYSB0ZXN0IGVudmlyb25tZW50IGFuZCB3ZVxuICAgIC8vIGFsd2F5cyBjbGVhciB0aGUgY29udGFpbmVyLiBTZWUgIzE3MDA2LlxuICAgIC8vIFRPRE8oY3Jpc2JldG8pOiByZW1vdmUgdGhlIHRlc3QgZW52aXJvbm1lbnQgY2hlY2sgb25jZSB3ZSBoYXZlIGFuIG92ZXJsYXkgdGVzdGluZyBtb2R1bGUuXG4gICAgaWYgKGlzVGVzdEVudmlyb25tZW50KSB7XG4gICAgICBjb250YWluZXIuc2V0QXR0cmlidXRlKCdwbGF0Zm9ybScsICd0ZXN0Jyk7XG4gICAgfSBlbHNlIGlmICghdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICBjb250YWluZXIuc2V0QXR0cmlidXRlKCdwbGF0Zm9ybScsICdzZXJ2ZXInKTtcbiAgICB9XG5cbiAgICB0aGlzLl9kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XG4gICAgdGhpcy5fY29udGFpbmVyRWxlbWVudCA9IGNvbnRhaW5lcjtcbiAgfVxufVxuIl19