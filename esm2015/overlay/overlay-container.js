import { __decorate, __metadata, __param } from "tslib";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, Optional, SkipSelf, } from '@angular/core';
import { Platform } from '@angular/cdk/platform';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
import * as i2 from "@angular/cdk/platform";
/**
 * Whether we're in a testing environment.
 * TODO(crisbeto): remove this once we have an overlay testing module.
 */
const isTestEnvironment = typeof window !== 'undefined' && !!window &&
    !!(window.__karma__ || window.jasmine);
/** Container inside which all overlays will render. */
let OverlayContainer = /** @class */ (() => {
    let OverlayContainer = class OverlayContainer {
        constructor(document, 
        /**
         * @deprecated `platform` parameter to become required.
         * @breaking-change 10.0.0
         */
        _platform) {
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
            // @breaking-change 10.0.0 Remove null check for `_platform`.
            const isBrowser = this._platform ? this._platform.isBrowser : typeof window !== 'undefined';
            const containerClass = 'cdk-overlay-container';
            if (isBrowser || isTestEnvironment) {
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
            else if (!isBrowser) {
                container.setAttribute('platform', 'server');
            }
            this._document.body.appendChild(container);
            this._containerElement = container;
        }
    };
    OverlayContainer.ɵprov = i0.ɵɵdefineInjectable({ factory: function OverlayContainer_Factory() { return new OverlayContainer(i0.ɵɵinject(i1.DOCUMENT), i0.ɵɵinject(i2.Platform)); }, token: OverlayContainer, providedIn: "root" });
    OverlayContainer = __decorate([
        Injectable({ providedIn: 'root' }),
        __param(0, Inject(DOCUMENT)),
        __metadata("design:paramtypes", [Object, Platform])
    ], OverlayContainer);
    return OverlayContainer;
})();
export { OverlayContainer };
/** @docs-private @deprecated @breaking-change 8.0.0 */
export function OVERLAY_CONTAINER_PROVIDER_FACTORY(parentContainer, _document) {
    return parentContainer || new OverlayContainer(_document);
}
/** @docs-private @deprecated @breaking-change 8.0.0 */
export const OVERLAY_CONTAINER_PROVIDER = {
    // If there is already an OverlayContainer available, use that. Otherwise, provide a new one.
    provide: OverlayContainer,
    deps: [
        [new Optional(), new SkipSelf(), OverlayContainer],
        DOCUMENT // We need to use the InjectionToken somewhere to keep TS happy
    ],
    useFactory: OVERLAY_CONTAINER_PROVIDER_FACTORY
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1jb250YWluZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvb3ZlcmxheS1jb250YWluZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQ0wsTUFBTSxFQUNOLFVBQVUsRUFHVixRQUFRLEVBQ1IsUUFBUSxHQUNULE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQzs7OztBQUUvQzs7O0dBR0c7QUFDSCxNQUFNLGlCQUFpQixHQUFZLE9BQU8sTUFBTSxLQUFLLFdBQVcsSUFBSSxDQUFDLENBQUMsTUFBTTtJQUMxRSxDQUFDLENBQUMsQ0FBRSxNQUFjLENBQUMsU0FBUyxJQUFLLE1BQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUUzRCx1REFBdUQ7QUFFdkQ7SUFBQSxJQUFhLGdCQUFnQixHQUE3QixNQUFhLGdCQUFnQjtRQUkzQixZQUNvQixRQUFhO1FBQy9COzs7V0FHRztRQUNPLFNBQW9CO1lBQXBCLGNBQVMsR0FBVCxTQUFTLENBQVc7WUFDOUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7UUFDNUIsQ0FBQztRQUVELFdBQVc7WUFDVCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUM7WUFFekMsSUFBSSxTQUFTLElBQUksU0FBUyxDQUFDLFVBQVUsRUFBRTtnQkFDckMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7YUFDN0M7UUFDSCxDQUFDO1FBRUQ7Ozs7O1dBS0c7UUFDSCxtQkFBbUI7WUFDakIsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtnQkFDM0IsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7YUFDekI7WUFFRCxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztRQUNoQyxDQUFDO1FBRUQ7OztXQUdHO1FBQ08sZ0JBQWdCO1lBQ3hCLDZEQUE2RDtZQUM3RCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxNQUFNLEtBQUssV0FBVyxDQUFDO1lBQzVGLE1BQU0sY0FBYyxHQUFHLHVCQUF1QixDQUFDO1lBRS9DLElBQUksU0FBUyxJQUFJLGlCQUFpQixFQUFFO2dCQUNsQyxNQUFNLDBCQUEwQixHQUM1QixJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLElBQUksY0FBYyx1QkFBdUI7b0JBQ3pDLElBQUksY0FBYyxtQkFBbUIsQ0FBQyxDQUFDO2dCQUUzRSx3REFBd0Q7Z0JBQ3hELG9FQUFvRTtnQkFDcEUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLDBCQUEwQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDMUQsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVyxDQUFDLFdBQVcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUN0RjthQUNGO1lBRUQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdEQsU0FBUyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7WUFFeEMsNkZBQTZGO1lBQzdGLDRGQUE0RjtZQUM1Riw2RkFBNkY7WUFDN0YsMkZBQTJGO1lBQzNGLDBGQUEwRjtZQUMxRiw2RkFBNkY7WUFDN0YsMEZBQTBGO1lBQzFGLDBDQUEwQztZQUMxQyw0RkFBNEY7WUFDNUYsSUFBSSxpQkFBaUIsRUFBRTtnQkFDckIsU0FBUyxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7YUFDNUM7aUJBQU0sSUFBSSxDQUFDLFNBQVMsRUFBRTtnQkFDckIsU0FBUyxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7YUFDOUM7WUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFNBQVMsQ0FBQztRQUNyQyxDQUFDO0tBQ0YsQ0FBQTs7SUE5RVksZ0JBQWdCO1FBRDVCLFVBQVUsQ0FBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUMsQ0FBQztRQU01QixXQUFBLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQTtpREFLSyxRQUFRO09BVnJCLGdCQUFnQixDQThFNUI7MkJBMUdEO0tBMEdDO1NBOUVZLGdCQUFnQjtBQWlGN0IsdURBQXVEO0FBQ3ZELE1BQU0sVUFBVSxrQ0FBa0MsQ0FBQyxlQUFpQyxFQUNsRixTQUFjO0lBQ2QsT0FBTyxlQUFlLElBQUksSUFBSSxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUM1RCxDQUFDO0FBRUQsdURBQXVEO0FBQ3ZELE1BQU0sQ0FBQyxNQUFNLDBCQUEwQixHQUFHO0lBQ3hDLDZGQUE2RjtJQUM3RixPQUFPLEVBQUUsZ0JBQWdCO0lBQ3pCLElBQUksRUFBRTtRQUNKLENBQUMsSUFBSSxRQUFRLEVBQUUsRUFBRSxJQUFJLFFBQVEsRUFBRSxFQUFFLGdCQUFnQixDQUFDO1FBQ2xELFFBQStCLENBQUMsK0RBQStEO0tBQ2hHO0lBQ0QsVUFBVSxFQUFFLGtDQUFrQztDQUMvQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge1xuICBJbmplY3QsXG4gIEluamVjdGFibGUsXG4gIEluamVjdGlvblRva2VuLFxuICBPbkRlc3Ryb3ksXG4gIE9wdGlvbmFsLFxuICBTa2lwU2VsZixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1BsYXRmb3JtfSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuXG4vKipcbiAqIFdoZXRoZXIgd2UncmUgaW4gYSB0ZXN0aW5nIGVudmlyb25tZW50LlxuICogVE9ETyhjcmlzYmV0byk6IHJlbW92ZSB0aGlzIG9uY2Ugd2UgaGF2ZSBhbiBvdmVybGF5IHRlc3RpbmcgbW9kdWxlLlxuICovXG5jb25zdCBpc1Rlc3RFbnZpcm9ubWVudDogYm9vbGVhbiA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmICEhd2luZG93ICYmXG4gICEhKCh3aW5kb3cgYXMgYW55KS5fX2thcm1hX18gfHwgKHdpbmRvdyBhcyBhbnkpLmphc21pbmUpO1xuXG4vKiogQ29udGFpbmVyIGluc2lkZSB3aGljaCBhbGwgb3ZlcmxheXMgd2lsbCByZW5kZXIuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBPdmVybGF5Q29udGFpbmVyIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgcHJvdGVjdGVkIF9jb250YWluZXJFbGVtZW50OiBIVE1MRWxlbWVudDtcbiAgcHJvdGVjdGVkIF9kb2N1bWVudDogRG9jdW1lbnQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgQEluamVjdChET0NVTUVOVCkgZG9jdW1lbnQ6IGFueSxcbiAgICAvKipcbiAgICAgKiBAZGVwcmVjYXRlZCBgcGxhdGZvcm1gIHBhcmFtZXRlciB0byBiZWNvbWUgcmVxdWlyZWQuXG4gICAgICogQGJyZWFraW5nLWNoYW5nZSAxMC4wLjBcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgX3BsYXRmb3JtPzogUGxhdGZvcm0pIHtcbiAgICB0aGlzLl9kb2N1bWVudCA9IGRvY3VtZW50O1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5fY29udGFpbmVyRWxlbWVudDtcblxuICAgIGlmIChjb250YWluZXIgJiYgY29udGFpbmVyLnBhcmVudE5vZGUpIHtcbiAgICAgIGNvbnRhaW5lci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGNvbnRhaW5lcik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIHJldHVybnMgdGhlIG92ZXJsYXkgY29udGFpbmVyIGVsZW1lbnQuIEl0IHdpbGwgbGF6aWx5XG4gICAqIGNyZWF0ZSB0aGUgZWxlbWVudCB0aGUgZmlyc3QgdGltZSAgaXQgaXMgY2FsbGVkIHRvIGZhY2lsaXRhdGUgdXNpbmdcbiAgICogdGhlIGNvbnRhaW5lciBpbiBub24tYnJvd3NlciBlbnZpcm9ubWVudHMuXG4gICAqIEByZXR1cm5zIHRoZSBjb250YWluZXIgZWxlbWVudFxuICAgKi9cbiAgZ2V0Q29udGFpbmVyRWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgaWYgKCF0aGlzLl9jb250YWluZXJFbGVtZW50KSB7XG4gICAgICB0aGlzLl9jcmVhdGVDb250YWluZXIoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fY29udGFpbmVyRWxlbWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgdGhlIG92ZXJsYXkgY29udGFpbmVyIGVsZW1lbnQsIHdoaWNoIGlzIHNpbXBseSBhIGRpdlxuICAgKiB3aXRoIHRoZSAnY2RrLW92ZXJsYXktY29udGFpbmVyJyBjbGFzcyBvbiB0aGUgZG9jdW1lbnQgYm9keS5cbiAgICovXG4gIHByb3RlY3RlZCBfY3JlYXRlQ29udGFpbmVyKCk6IHZvaWQge1xuICAgIC8vIEBicmVha2luZy1jaGFuZ2UgMTAuMC4wIFJlbW92ZSBudWxsIGNoZWNrIGZvciBgX3BsYXRmb3JtYC5cbiAgICBjb25zdCBpc0Jyb3dzZXIgPSB0aGlzLl9wbGF0Zm9ybSA/IHRoaXMuX3BsYXRmb3JtLmlzQnJvd3NlciA6IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnO1xuICAgIGNvbnN0IGNvbnRhaW5lckNsYXNzID0gJ2Nkay1vdmVybGF5LWNvbnRhaW5lcic7XG5cbiAgICBpZiAoaXNCcm93c2VyIHx8IGlzVGVzdEVudmlyb25tZW50KSB7XG4gICAgICBjb25zdCBvcHBvc2l0ZVBsYXRmb3JtQ29udGFpbmVycyA9XG4gICAgICAgICAgdGhpcy5fZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgLiR7Y29udGFpbmVyQ2xhc3N9W3BsYXRmb3JtPVwic2VydmVyXCJdLCBgICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGAuJHtjb250YWluZXJDbGFzc31bcGxhdGZvcm09XCJ0ZXN0XCJdYCk7XG5cbiAgICAgIC8vIFJlbW92ZSBhbnkgb2xkIGNvbnRhaW5lcnMgZnJvbSB0aGUgb3Bwb3NpdGUgcGxhdGZvcm0uXG4gICAgICAvLyBUaGlzIGNhbiBoYXBwZW4gd2hlbiB0cmFuc2l0aW9uaW5nIGZyb20gdGhlIHNlcnZlciB0byB0aGUgY2xpZW50LlxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvcHBvc2l0ZVBsYXRmb3JtQ29udGFpbmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBvcHBvc2l0ZVBsYXRmb3JtQ29udGFpbmVyc1tpXS5wYXJlbnROb2RlIS5yZW1vdmVDaGlsZChvcHBvc2l0ZVBsYXRmb3JtQ29udGFpbmVyc1tpXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5fZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoY29udGFpbmVyQ2xhc3MpO1xuXG4gICAgLy8gQSBsb25nIHRpbWUgYWdvIHdlIGtlcHQgYWRkaW5nIG5ldyBvdmVybGF5IGNvbnRhaW5lcnMgd2hlbmV2ZXIgYSBuZXcgYXBwIHdhcyBpbnN0YW50aWF0ZWQsXG4gICAgLy8gYnV0IGF0IHNvbWUgcG9pbnQgd2UgYWRkZWQgbG9naWMgd2hpY2ggY2xlYXJzIHRoZSBkdXBsaWNhdGUgb25lcyBpbiBvcmRlciB0byBhdm9pZCBsZWFrcy5cbiAgICAvLyBUaGUgbmV3IGxvZ2ljIHdhcyBhIGxpdHRsZSB0b28gYWdncmVzc2l2ZSBzaW5jZSBpdCB3YXMgYnJlYWtpbmcgc29tZSBsZWdpdGltYXRlIHVzZSBjYXNlcy5cbiAgICAvLyBUbyBtaXRpZ2F0ZSB0aGUgcHJvYmxlbSB3ZSBtYWRlIGl0IHNvIHRoYXQgb25seSBjb250YWluZXJzIGZyb20gYSBkaWZmZXJlbnQgcGxhdGZvcm0gYXJlXG4gICAgLy8gY2xlYXJlZCwgYnV0IHRoZSBzaWRlLWVmZmVjdCB3YXMgdGhhdCBwZW9wbGUgc3RhcnRlZCBkZXBlbmRpbmcgb24gdGhlIG92ZXJseS1hZ2dyZXNzaXZlXG4gICAgLy8gbG9naWMgdG8gY2xlYW4gdXAgdGhlaXIgdGVzdHMgZm9yIHRoZW0uIFVudGlsIHdlIGNhbiBpbnRyb2R1Y2UgYW4gb3ZlcmxheS1zcGVjaWZpYyB0ZXN0aW5nXG4gICAgLy8gbW9kdWxlIHdoaWNoIGRvZXMgdGhlIGNsZWFudXAsIHdlIHRyeSB0byBkZXRlY3QgdGhhdCB3ZSdyZSBpbiBhIHRlc3QgZW52aXJvbm1lbnQgYW5kIHdlXG4gICAgLy8gYWx3YXlzIGNsZWFyIHRoZSBjb250YWluZXIuIFNlZSAjMTcwMDYuXG4gICAgLy8gVE9ETyhjcmlzYmV0byk6IHJlbW92ZSB0aGUgdGVzdCBlbnZpcm9ubWVudCBjaGVjayBvbmNlIHdlIGhhdmUgYW4gb3ZlcmxheSB0ZXN0aW5nIG1vZHVsZS5cbiAgICBpZiAoaXNUZXN0RW52aXJvbm1lbnQpIHtcbiAgICAgIGNvbnRhaW5lci5zZXRBdHRyaWJ1dGUoJ3BsYXRmb3JtJywgJ3Rlc3QnKTtcbiAgICB9IGVsc2UgaWYgKCFpc0Jyb3dzZXIpIHtcbiAgICAgIGNvbnRhaW5lci5zZXRBdHRyaWJ1dGUoJ3BsYXRmb3JtJywgJ3NlcnZlcicpO1xuICAgIH1cblxuICAgIHRoaXMuX2RvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgICB0aGlzLl9jb250YWluZXJFbGVtZW50ID0gY29udGFpbmVyO1xuICB9XG59XG5cblxuLyoqIEBkb2NzLXByaXZhdGUgQGRlcHJlY2F0ZWQgQGJyZWFraW5nLWNoYW5nZSA4LjAuMCAqL1xuZXhwb3J0IGZ1bmN0aW9uIE9WRVJMQVlfQ09OVEFJTkVSX1BST1ZJREVSX0ZBQ1RPUlkocGFyZW50Q29udGFpbmVyOiBPdmVybGF5Q29udGFpbmVyLFxuICBfZG9jdW1lbnQ6IGFueSkge1xuICByZXR1cm4gcGFyZW50Q29udGFpbmVyIHx8IG5ldyBPdmVybGF5Q29udGFpbmVyKF9kb2N1bWVudCk7XG59XG5cbi8qKiBAZG9jcy1wcml2YXRlIEBkZXByZWNhdGVkIEBicmVha2luZy1jaGFuZ2UgOC4wLjAgKi9cbmV4cG9ydCBjb25zdCBPVkVSTEFZX0NPTlRBSU5FUl9QUk9WSURFUiA9IHtcbiAgLy8gSWYgdGhlcmUgaXMgYWxyZWFkeSBhbiBPdmVybGF5Q29udGFpbmVyIGF2YWlsYWJsZSwgdXNlIHRoYXQuIE90aGVyd2lzZSwgcHJvdmlkZSBhIG5ldyBvbmUuXG4gIHByb3ZpZGU6IE92ZXJsYXlDb250YWluZXIsXG4gIGRlcHM6IFtcbiAgICBbbmV3IE9wdGlvbmFsKCksIG5ldyBTa2lwU2VsZigpLCBPdmVybGF5Q29udGFpbmVyXSxcbiAgICBET0NVTUVOVCBhcyBJbmplY3Rpb25Ub2tlbjxhbnk+IC8vIFdlIG5lZWQgdG8gdXNlIHRoZSBJbmplY3Rpb25Ub2tlbiBzb21ld2hlcmUgdG8ga2VlcCBUUyBoYXBweVxuICBdLFxuICB1c2VGYWN0b3J5OiBPVkVSTEFZX0NPTlRBSU5FUl9QUk9WSURFUl9GQUNUT1JZXG59O1xuIl19