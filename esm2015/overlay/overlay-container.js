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
import * as i1 from "@angular/common";
import * as i2 from "@angular/cdk/platform";
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
OverlayContainer.ɵprov = i0.ɵɵdefineInjectable({ factory: function OverlayContainer_Factory() { return new OverlayContainer(i0.ɵɵinject(i1.DOCUMENT), i0.ɵɵinject(i2.Platform)); }, token: OverlayContainer, providedIn: "root" });
OverlayContainer.decorators = [
    { type: Injectable, args: [{ providedIn: 'root' },] }
];
OverlayContainer.ctorParameters = () => [
    { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] },
    { type: Platform }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1jb250YWluZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvb3ZlcmxheS1jb250YWluZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFZLE1BQU0sZUFBZSxDQUFDO0FBQzVELE9BQU8sRUFBQyxRQUFRLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQzs7OztBQUVuRSx1REFBdUQ7QUFFdkQsTUFBTSxPQUFPLGdCQUFnQjtJQUkzQixZQUE4QixRQUFhLEVBQVksU0FBbUI7UUFBbkIsY0FBUyxHQUFULFNBQVMsQ0FBVTtRQUN4RSxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztJQUM1QixDQUFDO0lBRUQsV0FBVztRQUNULE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztRQUV6QyxJQUFJLFNBQVMsSUFBSSxTQUFTLENBQUMsVUFBVSxFQUFFO1lBQ3JDLFNBQVMsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQzdDO0lBQ0gsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsbUJBQW1CO1FBQ2pCLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUU7WUFDM0IsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7U0FDekI7UUFFRCxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztJQUNoQyxDQUFDO0lBRUQ7OztPQUdHO0lBQ08sZ0JBQWdCO1FBQ3hCLE1BQU0sY0FBYyxHQUFHLHVCQUF1QixDQUFDO1FBRS9DLDJFQUEyRTtRQUMzRSxxRUFBcUU7UUFDckUsa0RBQWtEO1FBQ2xELElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLElBQUksa0JBQWtCLEVBQUUsRUFBRTtZQUNwRCxNQUFNLDBCQUEwQixHQUM1QixJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLElBQUksY0FBYyx1QkFBdUI7Z0JBQ3pDLElBQUksY0FBYyxtQkFBbUIsQ0FBQyxDQUFDO1lBRTNFLHdEQUF3RDtZQUN4RCxvRUFBb0U7WUFDcEUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLDBCQUEwQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDMUQsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVyxDQUFDLFdBQVcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3RGO1NBQ0Y7UUFFRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0RCxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUV4Qyw2RkFBNkY7UUFDN0YsNEZBQTRGO1FBQzVGLDZGQUE2RjtRQUM3RiwyRkFBMkY7UUFDM0YsMEZBQTBGO1FBQzFGLDZGQUE2RjtRQUM3RiwwRkFBMEY7UUFDMUYsMENBQTBDO1FBQzFDLDRGQUE0RjtRQUM1RixJQUFJLGtCQUFrQixFQUFFLEVBQUU7WUFDeEIsU0FBUyxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7U0FDNUM7YUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUU7WUFDcEMsU0FBUyxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7U0FDOUM7UUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDM0MsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFNBQVMsQ0FBQztJQUNyQyxDQUFDOzs7O1lBekVGLFVBQVUsU0FBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7Ozs0Q0FLakIsTUFBTSxTQUFDLFFBQVE7WUFSdEIsUUFBUSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtJbmplY3QsIEluamVjdGFibGUsIE9uRGVzdHJveX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1BsYXRmb3JtLCBfaXNUZXN0RW52aXJvbm1lbnR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5cbi8qKiBDb250YWluZXIgaW5zaWRlIHdoaWNoIGFsbCBvdmVybGF5cyB3aWxsIHJlbmRlci4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIE92ZXJsYXlDb250YWluZXIgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBwcm90ZWN0ZWQgX2NvbnRhaW5lckVsZW1lbnQ6IEhUTUxFbGVtZW50O1xuICBwcm90ZWN0ZWQgX2RvY3VtZW50OiBEb2N1bWVudDtcblxuICBjb25zdHJ1Y3RvcihASW5qZWN0KERPQ1VNRU5UKSBkb2N1bWVudDogYW55LCBwcm90ZWN0ZWQgX3BsYXRmb3JtOiBQbGF0Zm9ybSkge1xuICAgIHRoaXMuX2RvY3VtZW50ID0gZG9jdW1lbnQ7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLl9jb250YWluZXJFbGVtZW50O1xuXG4gICAgaWYgKGNvbnRhaW5lciAmJiBjb250YWluZXIucGFyZW50Tm9kZSkge1xuICAgICAgY29udGFpbmVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoY29udGFpbmVyKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBtZXRob2QgcmV0dXJucyB0aGUgb3ZlcmxheSBjb250YWluZXIgZWxlbWVudC4gSXQgd2lsbCBsYXppbHlcbiAgICogY3JlYXRlIHRoZSBlbGVtZW50IHRoZSBmaXJzdCB0aW1lIGl0IGlzIGNhbGxlZCB0byBmYWNpbGl0YXRlIHVzaW5nXG4gICAqIHRoZSBjb250YWluZXIgaW4gbm9uLWJyb3dzZXIgZW52aXJvbm1lbnRzLlxuICAgKiBAcmV0dXJucyB0aGUgY29udGFpbmVyIGVsZW1lbnRcbiAgICovXG4gIGdldENvbnRhaW5lckVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIGlmICghdGhpcy5fY29udGFpbmVyRWxlbWVudCkge1xuICAgICAgdGhpcy5fY3JlYXRlQ29udGFpbmVyKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX2NvbnRhaW5lckVsZW1lbnQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIHRoZSBvdmVybGF5IGNvbnRhaW5lciBlbGVtZW50LCB3aGljaCBpcyBzaW1wbHkgYSBkaXZcbiAgICogd2l0aCB0aGUgJ2Nkay1vdmVybGF5LWNvbnRhaW5lcicgY2xhc3Mgb24gdGhlIGRvY3VtZW50IGJvZHkuXG4gICAqL1xuICBwcm90ZWN0ZWQgX2NyZWF0ZUNvbnRhaW5lcigpOiB2b2lkIHtcbiAgICBjb25zdCBjb250YWluZXJDbGFzcyA9ICdjZGstb3ZlcmxheS1jb250YWluZXInO1xuXG4gICAgLy8gVE9ETyhjcmlzYmV0byk6IHJlbW92ZSB0aGUgdGVzdGluZyBjaGVjayBvbmNlIHdlIGhhdmUgYW4gb3ZlcmxheSB0ZXN0aW5nXG4gICAgLy8gbW9kdWxlIG9yIEFuZ3VsYXIgc3RhcnRzIHRlYXJpbmcgZG93biB0aGUgdGVzdGluZyBgTmdNb2R1bGVgLiBTZWU6XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9pc3N1ZXMvMTg4MzFcbiAgICBpZiAodGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyIHx8IF9pc1Rlc3RFbnZpcm9ubWVudCgpKSB7XG4gICAgICBjb25zdCBvcHBvc2l0ZVBsYXRmb3JtQ29udGFpbmVycyA9XG4gICAgICAgICAgdGhpcy5fZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgLiR7Y29udGFpbmVyQ2xhc3N9W3BsYXRmb3JtPVwic2VydmVyXCJdLCBgICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGAuJHtjb250YWluZXJDbGFzc31bcGxhdGZvcm09XCJ0ZXN0XCJdYCk7XG5cbiAgICAgIC8vIFJlbW92ZSBhbnkgb2xkIGNvbnRhaW5lcnMgZnJvbSB0aGUgb3Bwb3NpdGUgcGxhdGZvcm0uXG4gICAgICAvLyBUaGlzIGNhbiBoYXBwZW4gd2hlbiB0cmFuc2l0aW9uaW5nIGZyb20gdGhlIHNlcnZlciB0byB0aGUgY2xpZW50LlxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvcHBvc2l0ZVBsYXRmb3JtQ29udGFpbmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBvcHBvc2l0ZVBsYXRmb3JtQ29udGFpbmVyc1tpXS5wYXJlbnROb2RlIS5yZW1vdmVDaGlsZChvcHBvc2l0ZVBsYXRmb3JtQ29udGFpbmVyc1tpXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5fZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoY29udGFpbmVyQ2xhc3MpO1xuXG4gICAgLy8gQSBsb25nIHRpbWUgYWdvIHdlIGtlcHQgYWRkaW5nIG5ldyBvdmVybGF5IGNvbnRhaW5lcnMgd2hlbmV2ZXIgYSBuZXcgYXBwIHdhcyBpbnN0YW50aWF0ZWQsXG4gICAgLy8gYnV0IGF0IHNvbWUgcG9pbnQgd2UgYWRkZWQgbG9naWMgd2hpY2ggY2xlYXJzIHRoZSBkdXBsaWNhdGUgb25lcyBpbiBvcmRlciB0byBhdm9pZCBsZWFrcy5cbiAgICAvLyBUaGUgbmV3IGxvZ2ljIHdhcyBhIGxpdHRsZSB0b28gYWdncmVzc2l2ZSBzaW5jZSBpdCB3YXMgYnJlYWtpbmcgc29tZSBsZWdpdGltYXRlIHVzZSBjYXNlcy5cbiAgICAvLyBUbyBtaXRpZ2F0ZSB0aGUgcHJvYmxlbSB3ZSBtYWRlIGl0IHNvIHRoYXQgb25seSBjb250YWluZXJzIGZyb20gYSBkaWZmZXJlbnQgcGxhdGZvcm0gYXJlXG4gICAgLy8gY2xlYXJlZCwgYnV0IHRoZSBzaWRlLWVmZmVjdCB3YXMgdGhhdCBwZW9wbGUgc3RhcnRlZCBkZXBlbmRpbmcgb24gdGhlIG92ZXJseS1hZ2dyZXNzaXZlXG4gICAgLy8gbG9naWMgdG8gY2xlYW4gdXAgdGhlaXIgdGVzdHMgZm9yIHRoZW0uIFVudGlsIHdlIGNhbiBpbnRyb2R1Y2UgYW4gb3ZlcmxheS1zcGVjaWZpYyB0ZXN0aW5nXG4gICAgLy8gbW9kdWxlIHdoaWNoIGRvZXMgdGhlIGNsZWFudXAsIHdlIHRyeSB0byBkZXRlY3QgdGhhdCB3ZSdyZSBpbiBhIHRlc3QgZW52aXJvbm1lbnQgYW5kIHdlXG4gICAgLy8gYWx3YXlzIGNsZWFyIHRoZSBjb250YWluZXIuIFNlZSAjMTcwMDYuXG4gICAgLy8gVE9ETyhjcmlzYmV0byk6IHJlbW92ZSB0aGUgdGVzdCBlbnZpcm9ubWVudCBjaGVjayBvbmNlIHdlIGhhdmUgYW4gb3ZlcmxheSB0ZXN0aW5nIG1vZHVsZS5cbiAgICBpZiAoX2lzVGVzdEVudmlyb25tZW50KCkpIHtcbiAgICAgIGNvbnRhaW5lci5zZXRBdHRyaWJ1dGUoJ3BsYXRmb3JtJywgJ3Rlc3QnKTtcbiAgICB9IGVsc2UgaWYgKCF0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIpIHtcbiAgICAgIGNvbnRhaW5lci5zZXRBdHRyaWJ1dGUoJ3BsYXRmb3JtJywgJ3NlcnZlcicpO1xuICAgIH1cblxuICAgIHRoaXMuX2RvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgICB0aGlzLl9jb250YWluZXJFbGVtZW50ID0gY29udGFpbmVyO1xuICB9XG59XG4iXX0=