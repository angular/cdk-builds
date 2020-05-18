/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/overlay/overlay-container.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
 * @type {?}
 */
const isTestEnvironment = typeof window !== 'undefined' && !!window &&
    !!(((/** @type {?} */ (window))).__karma__ || ((/** @type {?} */ (window))).jasmine);
/**
 * Container inside which all overlays will render.
 */
let OverlayContainer = /** @class */ (() => {
    /**
     * Container inside which all overlays will render.
     */
    class OverlayContainer {
        /**
         * @param {?} document
         * @param {?=} _platform
         */
        constructor(document, _platform) {
            this._platform = _platform;
            this._document = document;
        }
        /**
         * @return {?}
         */
        ngOnDestroy() {
            /** @type {?} */
            const container = this._containerElement;
            if (container && container.parentNode) {
                container.parentNode.removeChild(container);
            }
        }
        /**
         * This method returns the overlay container element. It will lazily
         * create the element the first time  it is called to facilitate using
         * the container in non-browser environments.
         * @return {?} the container element
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
         * @protected
         * @return {?}
         */
        _createContainer() {
            // @breaking-change 10.0.0 Remove null check for `_platform`.
            /** @type {?} */
            const isBrowser = this._platform ? this._platform.isBrowser : typeof window !== 'undefined';
            /** @type {?} */
            const containerClass = 'cdk-overlay-container';
            if (isBrowser || isTestEnvironment) {
                /** @type {?} */
                const oppositePlatformContainers = this._document.querySelectorAll(`.${containerClass}[platform="server"], ` +
                    `.${containerClass}[platform="test"]`);
                // Remove any old containers from the opposite platform.
                // This can happen when transitioning from the server to the client.
                for (let i = 0; i < oppositePlatformContainers.length; i++) {
                    (/** @type {?} */ (oppositePlatformContainers[i].parentNode)).removeChild(oppositePlatformContainers[i]);
                }
            }
            /** @type {?} */
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
    }
    OverlayContainer.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    /** @nocollapse */
    OverlayContainer.ctorParameters = () => [
        { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] },
        { type: Platform }
    ];
    /** @nocollapse */ OverlayContainer.ɵprov = i0.ɵɵdefineInjectable({ factory: function OverlayContainer_Factory() { return new OverlayContainer(i0.ɵɵinject(i1.DOCUMENT), i0.ɵɵinject(i2.Platform)); }, token: OverlayContainer, providedIn: "root" });
    return OverlayContainer;
})();
export { OverlayContainer };
if (false) {
    /**
     * @type {?}
     * @protected
     */
    OverlayContainer.prototype._containerElement;
    /**
     * @type {?}
     * @protected
     */
    OverlayContainer.prototype._document;
    /**
     * @deprecated `platform` parameter to become required.
     * \@breaking-change 10.0.0
     * @type {?}
     * @protected
     */
    OverlayContainer.prototype._platform;
}
/**
 * \@docs-private \@deprecated \@breaking-change 8.0.0
 * @param {?} parentContainer
 * @param {?} _document
 * @return {?}
 */
export function OVERLAY_CONTAINER_PROVIDER_FACTORY(parentContainer, _document) {
    return parentContainer || new OverlayContainer(_document);
}
/**
 * \@docs-private \@deprecated \@breaking-change 8.0.0
 * @type {?}
 */
export const OVERLAY_CONTAINER_PROVIDER = {
    // If there is already an OverlayContainer available, use that. Otherwise, provide a new one.
    provide: OverlayContainer,
    deps: [
        [new Optional(), new SkipSelf(), OverlayContainer],
        (/** @type {?} */ (DOCUMENT))
    ],
    useFactory: OVERLAY_CONTAINER_PROVIDER_FACTORY
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1jb250YWluZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvb3ZlcmxheS1jb250YWluZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFDTCxNQUFNLEVBQ04sVUFBVSxFQUdWLFFBQVEsRUFDUixRQUFRLEdBQ1QsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLHVCQUF1QixDQUFDOzs7Ozs7Ozs7TUFNekMsaUJBQWlCLEdBQVksT0FBTyxNQUFNLEtBQUssV0FBVyxJQUFJLENBQUMsQ0FBQyxNQUFNO0lBQzFFLENBQUMsQ0FBQyxDQUFDLENBQUMsbUJBQUEsTUFBTSxFQUFPLENBQUMsQ0FBQyxTQUFTLElBQUksQ0FBQyxtQkFBQSxNQUFNLEVBQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQzs7OztBQUcxRDs7OztJQUFBLE1BQ2EsZ0JBQWdCOzs7OztRQUkzQixZQUNvQixRQUFhLEVBS3JCLFNBQW9CO1lBQXBCLGNBQVMsR0FBVCxTQUFTLENBQVc7WUFDOUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7UUFDNUIsQ0FBQzs7OztRQUVELFdBQVc7O2tCQUNILFNBQVMsR0FBRyxJQUFJLENBQUMsaUJBQWlCO1lBRXhDLElBQUksU0FBUyxJQUFJLFNBQVMsQ0FBQyxVQUFVLEVBQUU7Z0JBQ3JDLFNBQVMsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQzdDO1FBQ0gsQ0FBQzs7Ozs7OztRQVFELG1CQUFtQjtZQUNqQixJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFO2dCQUMzQixJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQzthQUN6QjtZQUVELE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDO1FBQ2hDLENBQUM7Ozs7Ozs7UUFNUyxnQkFBZ0I7OztrQkFFbEIsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLE1BQU0sS0FBSyxXQUFXOztrQkFDckYsY0FBYyxHQUFHLHVCQUF1QjtZQUU5QyxJQUFJLFNBQVMsSUFBSSxpQkFBaUIsRUFBRTs7c0JBQzVCLDBCQUEwQixHQUM1QixJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLElBQUksY0FBYyx1QkFBdUI7b0JBQ3pDLElBQUksY0FBYyxtQkFBbUIsQ0FBQztnQkFFMUUsd0RBQXdEO2dCQUN4RCxvRUFBb0U7Z0JBQ3BFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRywwQkFBMEIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQzFELG1CQUFBLDBCQUEwQixDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBQyxDQUFDLFdBQVcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUN0RjthQUNGOztrQkFFSyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO1lBQ3JELFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBRXhDLDZGQUE2RjtZQUM3Riw0RkFBNEY7WUFDNUYsNkZBQTZGO1lBQzdGLDJGQUEyRjtZQUMzRiwwRkFBMEY7WUFDMUYsNkZBQTZGO1lBQzdGLDBGQUEwRjtZQUMxRiwwQ0FBMEM7WUFDMUMsNEZBQTRGO1lBQzVGLElBQUksaUJBQWlCLEVBQUU7Z0JBQ3JCLFNBQVMsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2FBQzVDO2lCQUFNLElBQUksQ0FBQyxTQUFTLEVBQUU7Z0JBQ3JCLFNBQVMsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2FBQzlDO1lBRUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzNDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxTQUFTLENBQUM7UUFDckMsQ0FBQzs7O2dCQTlFRixVQUFVLFNBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzs7O2dEQU0zQixNQUFNLFNBQUMsUUFBUTtnQkFoQlosUUFBUTs7OzJCQWpCaEI7S0EwR0M7U0E5RVksZ0JBQWdCOzs7Ozs7SUFDM0IsNkNBQXlDOzs7OztJQUN6QyxxQ0FBOEI7Ozs7Ozs7SUFRNUIscUNBQThCOzs7Ozs7OztBQXdFbEMsTUFBTSxVQUFVLGtDQUFrQyxDQUFDLGVBQWlDLEVBQ2xGLFNBQWM7SUFDZCxPQUFPLGVBQWUsSUFBSSxJQUFJLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzVELENBQUM7Ozs7O0FBR0QsTUFBTSxPQUFPLDBCQUEwQixHQUFHOztJQUV4QyxPQUFPLEVBQUUsZ0JBQWdCO0lBQ3pCLElBQUksRUFBRTtRQUNKLENBQUMsSUFBSSxRQUFRLEVBQUUsRUFBRSxJQUFJLFFBQVEsRUFBRSxFQUFFLGdCQUFnQixDQUFDO1FBQ2xELG1CQUFBLFFBQVEsRUFBdUI7S0FDaEM7SUFDRCxVQUFVLEVBQUUsa0NBQWtDO0NBQy9DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge1xuICBJbmplY3QsXG4gIEluamVjdGFibGUsXG4gIEluamVjdGlvblRva2VuLFxuICBPbkRlc3Ryb3ksXG4gIE9wdGlvbmFsLFxuICBTa2lwU2VsZixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1BsYXRmb3JtfSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuXG4vKipcbiAqIFdoZXRoZXIgd2UncmUgaW4gYSB0ZXN0aW5nIGVudmlyb25tZW50LlxuICogVE9ETyhjcmlzYmV0byk6IHJlbW92ZSB0aGlzIG9uY2Ugd2UgaGF2ZSBhbiBvdmVybGF5IHRlc3RpbmcgbW9kdWxlLlxuICovXG5jb25zdCBpc1Rlc3RFbnZpcm9ubWVudDogYm9vbGVhbiA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmICEhd2luZG93ICYmXG4gICEhKCh3aW5kb3cgYXMgYW55KS5fX2thcm1hX18gfHwgKHdpbmRvdyBhcyBhbnkpLmphc21pbmUpO1xuXG4vKiogQ29udGFpbmVyIGluc2lkZSB3aGljaCBhbGwgb3ZlcmxheXMgd2lsbCByZW5kZXIuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBPdmVybGF5Q29udGFpbmVyIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgcHJvdGVjdGVkIF9jb250YWluZXJFbGVtZW50OiBIVE1MRWxlbWVudDtcbiAgcHJvdGVjdGVkIF9kb2N1bWVudDogRG9jdW1lbnQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgQEluamVjdChET0NVTUVOVCkgZG9jdW1lbnQ6IGFueSxcbiAgICAvKipcbiAgICAgKiBAZGVwcmVjYXRlZCBgcGxhdGZvcm1gIHBhcmFtZXRlciB0byBiZWNvbWUgcmVxdWlyZWQuXG4gICAgICogQGJyZWFraW5nLWNoYW5nZSAxMC4wLjBcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgX3BsYXRmb3JtPzogUGxhdGZvcm0pIHtcbiAgICB0aGlzLl9kb2N1bWVudCA9IGRvY3VtZW50O1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5fY29udGFpbmVyRWxlbWVudDtcblxuICAgIGlmIChjb250YWluZXIgJiYgY29udGFpbmVyLnBhcmVudE5vZGUpIHtcbiAgICAgIGNvbnRhaW5lci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGNvbnRhaW5lcik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIHJldHVybnMgdGhlIG92ZXJsYXkgY29udGFpbmVyIGVsZW1lbnQuIEl0IHdpbGwgbGF6aWx5XG4gICAqIGNyZWF0ZSB0aGUgZWxlbWVudCB0aGUgZmlyc3QgdGltZSAgaXQgaXMgY2FsbGVkIHRvIGZhY2lsaXRhdGUgdXNpbmdcbiAgICogdGhlIGNvbnRhaW5lciBpbiBub24tYnJvd3NlciBlbnZpcm9ubWVudHMuXG4gICAqIEByZXR1cm5zIHRoZSBjb250YWluZXIgZWxlbWVudFxuICAgKi9cbiAgZ2V0Q29udGFpbmVyRWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgaWYgKCF0aGlzLl9jb250YWluZXJFbGVtZW50KSB7XG4gICAgICB0aGlzLl9jcmVhdGVDb250YWluZXIoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fY29udGFpbmVyRWxlbWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgdGhlIG92ZXJsYXkgY29udGFpbmVyIGVsZW1lbnQsIHdoaWNoIGlzIHNpbXBseSBhIGRpdlxuICAgKiB3aXRoIHRoZSAnY2RrLW92ZXJsYXktY29udGFpbmVyJyBjbGFzcyBvbiB0aGUgZG9jdW1lbnQgYm9keS5cbiAgICovXG4gIHByb3RlY3RlZCBfY3JlYXRlQ29udGFpbmVyKCk6IHZvaWQge1xuICAgIC8vIEBicmVha2luZy1jaGFuZ2UgMTAuMC4wIFJlbW92ZSBudWxsIGNoZWNrIGZvciBgX3BsYXRmb3JtYC5cbiAgICBjb25zdCBpc0Jyb3dzZXIgPSB0aGlzLl9wbGF0Zm9ybSA/IHRoaXMuX3BsYXRmb3JtLmlzQnJvd3NlciA6IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnO1xuICAgIGNvbnN0IGNvbnRhaW5lckNsYXNzID0gJ2Nkay1vdmVybGF5LWNvbnRhaW5lcic7XG5cbiAgICBpZiAoaXNCcm93c2VyIHx8IGlzVGVzdEVudmlyb25tZW50KSB7XG4gICAgICBjb25zdCBvcHBvc2l0ZVBsYXRmb3JtQ29udGFpbmVycyA9XG4gICAgICAgICAgdGhpcy5fZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgLiR7Y29udGFpbmVyQ2xhc3N9W3BsYXRmb3JtPVwic2VydmVyXCJdLCBgICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGAuJHtjb250YWluZXJDbGFzc31bcGxhdGZvcm09XCJ0ZXN0XCJdYCk7XG5cbiAgICAgIC8vIFJlbW92ZSBhbnkgb2xkIGNvbnRhaW5lcnMgZnJvbSB0aGUgb3Bwb3NpdGUgcGxhdGZvcm0uXG4gICAgICAvLyBUaGlzIGNhbiBoYXBwZW4gd2hlbiB0cmFuc2l0aW9uaW5nIGZyb20gdGhlIHNlcnZlciB0byB0aGUgY2xpZW50LlxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvcHBvc2l0ZVBsYXRmb3JtQ29udGFpbmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBvcHBvc2l0ZVBsYXRmb3JtQ29udGFpbmVyc1tpXS5wYXJlbnROb2RlIS5yZW1vdmVDaGlsZChvcHBvc2l0ZVBsYXRmb3JtQ29udGFpbmVyc1tpXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5fZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoY29udGFpbmVyQ2xhc3MpO1xuXG4gICAgLy8gQSBsb25nIHRpbWUgYWdvIHdlIGtlcHQgYWRkaW5nIG5ldyBvdmVybGF5IGNvbnRhaW5lcnMgd2hlbmV2ZXIgYSBuZXcgYXBwIHdhcyBpbnN0YW50aWF0ZWQsXG4gICAgLy8gYnV0IGF0IHNvbWUgcG9pbnQgd2UgYWRkZWQgbG9naWMgd2hpY2ggY2xlYXJzIHRoZSBkdXBsaWNhdGUgb25lcyBpbiBvcmRlciB0byBhdm9pZCBsZWFrcy5cbiAgICAvLyBUaGUgbmV3IGxvZ2ljIHdhcyBhIGxpdHRsZSB0b28gYWdncmVzc2l2ZSBzaW5jZSBpdCB3YXMgYnJlYWtpbmcgc29tZSBsZWdpdGltYXRlIHVzZSBjYXNlcy5cbiAgICAvLyBUbyBtaXRpZ2F0ZSB0aGUgcHJvYmxlbSB3ZSBtYWRlIGl0IHNvIHRoYXQgb25seSBjb250YWluZXJzIGZyb20gYSBkaWZmZXJlbnQgcGxhdGZvcm0gYXJlXG4gICAgLy8gY2xlYXJlZCwgYnV0IHRoZSBzaWRlLWVmZmVjdCB3YXMgdGhhdCBwZW9wbGUgc3RhcnRlZCBkZXBlbmRpbmcgb24gdGhlIG92ZXJseS1hZ2dyZXNzaXZlXG4gICAgLy8gbG9naWMgdG8gY2xlYW4gdXAgdGhlaXIgdGVzdHMgZm9yIHRoZW0uIFVudGlsIHdlIGNhbiBpbnRyb2R1Y2UgYW4gb3ZlcmxheS1zcGVjaWZpYyB0ZXN0aW5nXG4gICAgLy8gbW9kdWxlIHdoaWNoIGRvZXMgdGhlIGNsZWFudXAsIHdlIHRyeSB0byBkZXRlY3QgdGhhdCB3ZSdyZSBpbiBhIHRlc3QgZW52aXJvbm1lbnQgYW5kIHdlXG4gICAgLy8gYWx3YXlzIGNsZWFyIHRoZSBjb250YWluZXIuIFNlZSAjMTcwMDYuXG4gICAgLy8gVE9ETyhjcmlzYmV0byk6IHJlbW92ZSB0aGUgdGVzdCBlbnZpcm9ubWVudCBjaGVjayBvbmNlIHdlIGhhdmUgYW4gb3ZlcmxheSB0ZXN0aW5nIG1vZHVsZS5cbiAgICBpZiAoaXNUZXN0RW52aXJvbm1lbnQpIHtcbiAgICAgIGNvbnRhaW5lci5zZXRBdHRyaWJ1dGUoJ3BsYXRmb3JtJywgJ3Rlc3QnKTtcbiAgICB9IGVsc2UgaWYgKCFpc0Jyb3dzZXIpIHtcbiAgICAgIGNvbnRhaW5lci5zZXRBdHRyaWJ1dGUoJ3BsYXRmb3JtJywgJ3NlcnZlcicpO1xuICAgIH1cblxuICAgIHRoaXMuX2RvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgICB0aGlzLl9jb250YWluZXJFbGVtZW50ID0gY29udGFpbmVyO1xuICB9XG59XG5cblxuLyoqIEBkb2NzLXByaXZhdGUgQGRlcHJlY2F0ZWQgQGJyZWFraW5nLWNoYW5nZSA4LjAuMCAqL1xuZXhwb3J0IGZ1bmN0aW9uIE9WRVJMQVlfQ09OVEFJTkVSX1BST1ZJREVSX0ZBQ1RPUlkocGFyZW50Q29udGFpbmVyOiBPdmVybGF5Q29udGFpbmVyLFxuICBfZG9jdW1lbnQ6IGFueSkge1xuICByZXR1cm4gcGFyZW50Q29udGFpbmVyIHx8IG5ldyBPdmVybGF5Q29udGFpbmVyKF9kb2N1bWVudCk7XG59XG5cbi8qKiBAZG9jcy1wcml2YXRlIEBkZXByZWNhdGVkIEBicmVha2luZy1jaGFuZ2UgOC4wLjAgKi9cbmV4cG9ydCBjb25zdCBPVkVSTEFZX0NPTlRBSU5FUl9QUk9WSURFUiA9IHtcbiAgLy8gSWYgdGhlcmUgaXMgYWxyZWFkeSBhbiBPdmVybGF5Q29udGFpbmVyIGF2YWlsYWJsZSwgdXNlIHRoYXQuIE90aGVyd2lzZSwgcHJvdmlkZSBhIG5ldyBvbmUuXG4gIHByb3ZpZGU6IE92ZXJsYXlDb250YWluZXIsXG4gIGRlcHM6IFtcbiAgICBbbmV3IE9wdGlvbmFsKCksIG5ldyBTa2lwU2VsZigpLCBPdmVybGF5Q29udGFpbmVyXSxcbiAgICBET0NVTUVOVCBhcyBJbmplY3Rpb25Ub2tlbjxhbnk+IC8vIFdlIG5lZWQgdG8gdXNlIHRoZSBJbmplY3Rpb25Ub2tlbiBzb21ld2hlcmUgdG8ga2VlcCBUUyBoYXBweVxuICBdLFxuICB1c2VGYWN0b3J5OiBPVkVSTEFZX0NPTlRBSU5FUl9QUk9WSURFUl9GQUNUT1JZXG59O1xuIl19