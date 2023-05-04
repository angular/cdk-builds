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
class OverlayContainer {
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
            const oppositePlatformContainers = this._document.querySelectorAll(`.${containerClass}[platform="server"], ` + `.${containerClass}[platform="test"]`);
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: OverlayContainer, deps: [{ token: DOCUMENT }, { token: i1.Platform }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: OverlayContainer, providedIn: 'root' }); }
}
export { OverlayContainer };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: OverlayContainer, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: i1.Platform }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1jb250YWluZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvb3ZlcmxheS1jb250YWluZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFZLE1BQU0sZUFBZSxDQUFDO0FBQzVELE9BQU8sRUFBQyxRQUFRLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQzs7O0FBRW5FLHVEQUF1RDtBQUN2RCxNQUNhLGdCQUFnQjtJQUkzQixZQUE4QixRQUFhLEVBQVksU0FBbUI7UUFBbkIsY0FBUyxHQUFULFNBQVMsQ0FBVTtRQUN4RSxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztJQUM1QixDQUFDO0lBRUQsV0FBVztRQUNULElBQUksQ0FBQyxpQkFBaUIsRUFBRSxNQUFNLEVBQUUsQ0FBQztJQUNuQyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxtQkFBbUI7UUFDakIsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtZQUMzQixJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztTQUN6QjtRQUVELE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDO0lBQ2hDLENBQUM7SUFFRDs7O09BR0c7SUFDTyxnQkFBZ0I7UUFDeEIsTUFBTSxjQUFjLEdBQUcsdUJBQXVCLENBQUM7UUFFL0MsMkVBQTJFO1FBQzNFLHFFQUFxRTtRQUNyRSxrREFBa0Q7UUFDbEQsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsSUFBSSxrQkFBa0IsRUFBRSxFQUFFO1lBQ3BELE1BQU0sMEJBQTBCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FDaEUsSUFBSSxjQUFjLHVCQUF1QixHQUFHLElBQUksY0FBYyxtQkFBbUIsQ0FDbEYsQ0FBQztZQUVGLHdEQUF3RDtZQUN4RCxvRUFBb0U7WUFDcEUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLDBCQUEwQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDMUQsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7YUFDeEM7U0FDRjtRQUVELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RELFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBRXhDLDZGQUE2RjtRQUM3Riw0RkFBNEY7UUFDNUYsNkZBQTZGO1FBQzdGLDJGQUEyRjtRQUMzRiwwRkFBMEY7UUFDMUYsNkZBQTZGO1FBQzdGLDBGQUEwRjtRQUMxRiwwQ0FBMEM7UUFDMUMsNEZBQTRGO1FBQzVGLElBQUksa0JBQWtCLEVBQUUsRUFBRTtZQUN4QixTQUFTLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQztTQUM1QzthQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRTtZQUNwQyxTQUFTLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztTQUM5QztRQUVELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMzQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsU0FBUyxDQUFDO0lBQ3JDLENBQUM7OEdBcEVVLGdCQUFnQixrQkFJUCxRQUFRO2tIQUpqQixnQkFBZ0IsY0FESixNQUFNOztTQUNsQixnQkFBZ0I7MkZBQWhCLGdCQUFnQjtrQkFENUIsVUFBVTttQkFBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7OzBCQUtqQixNQUFNOzJCQUFDLFFBQVEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7SW5qZWN0LCBJbmplY3RhYmxlLCBPbkRlc3Ryb3l9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtQbGF0Zm9ybSwgX2lzVGVzdEVudmlyb25tZW50fSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuXG4vKiogQ29udGFpbmVyIGluc2lkZSB3aGljaCBhbGwgb3ZlcmxheXMgd2lsbCByZW5kZXIuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBPdmVybGF5Q29udGFpbmVyIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgcHJvdGVjdGVkIF9jb250YWluZXJFbGVtZW50OiBIVE1MRWxlbWVudDtcbiAgcHJvdGVjdGVkIF9kb2N1bWVudDogRG9jdW1lbnQ7XG5cbiAgY29uc3RydWN0b3IoQEluamVjdChET0NVTUVOVCkgZG9jdW1lbnQ6IGFueSwgcHJvdGVjdGVkIF9wbGF0Zm9ybTogUGxhdGZvcm0pIHtcbiAgICB0aGlzLl9kb2N1bWVudCA9IGRvY3VtZW50O1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fY29udGFpbmVyRWxlbWVudD8ucmVtb3ZlKCk7XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBtZXRob2QgcmV0dXJucyB0aGUgb3ZlcmxheSBjb250YWluZXIgZWxlbWVudC4gSXQgd2lsbCBsYXppbHlcbiAgICogY3JlYXRlIHRoZSBlbGVtZW50IHRoZSBmaXJzdCB0aW1lIGl0IGlzIGNhbGxlZCB0byBmYWNpbGl0YXRlIHVzaW5nXG4gICAqIHRoZSBjb250YWluZXIgaW4gbm9uLWJyb3dzZXIgZW52aXJvbm1lbnRzLlxuICAgKiBAcmV0dXJucyB0aGUgY29udGFpbmVyIGVsZW1lbnRcbiAgICovXG4gIGdldENvbnRhaW5lckVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIGlmICghdGhpcy5fY29udGFpbmVyRWxlbWVudCkge1xuICAgICAgdGhpcy5fY3JlYXRlQ29udGFpbmVyKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX2NvbnRhaW5lckVsZW1lbnQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIHRoZSBvdmVybGF5IGNvbnRhaW5lciBlbGVtZW50LCB3aGljaCBpcyBzaW1wbHkgYSBkaXZcbiAgICogd2l0aCB0aGUgJ2Nkay1vdmVybGF5LWNvbnRhaW5lcicgY2xhc3Mgb24gdGhlIGRvY3VtZW50IGJvZHkuXG4gICAqL1xuICBwcm90ZWN0ZWQgX2NyZWF0ZUNvbnRhaW5lcigpOiB2b2lkIHtcbiAgICBjb25zdCBjb250YWluZXJDbGFzcyA9ICdjZGstb3ZlcmxheS1jb250YWluZXInO1xuXG4gICAgLy8gVE9ETyhjcmlzYmV0byk6IHJlbW92ZSB0aGUgdGVzdGluZyBjaGVjayBvbmNlIHdlIGhhdmUgYW4gb3ZlcmxheSB0ZXN0aW5nXG4gICAgLy8gbW9kdWxlIG9yIEFuZ3VsYXIgc3RhcnRzIHRlYXJpbmcgZG93biB0aGUgdGVzdGluZyBgTmdNb2R1bGVgLiBTZWU6XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9pc3N1ZXMvMTg4MzFcbiAgICBpZiAodGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyIHx8IF9pc1Rlc3RFbnZpcm9ubWVudCgpKSB7XG4gICAgICBjb25zdCBvcHBvc2l0ZVBsYXRmb3JtQ29udGFpbmVycyA9IHRoaXMuX2RvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXG4gICAgICAgIGAuJHtjb250YWluZXJDbGFzc31bcGxhdGZvcm09XCJzZXJ2ZXJcIl0sIGAgKyBgLiR7Y29udGFpbmVyQ2xhc3N9W3BsYXRmb3JtPVwidGVzdFwiXWAsXG4gICAgICApO1xuXG4gICAgICAvLyBSZW1vdmUgYW55IG9sZCBjb250YWluZXJzIGZyb20gdGhlIG9wcG9zaXRlIHBsYXRmb3JtLlxuICAgICAgLy8gVGhpcyBjYW4gaGFwcGVuIHdoZW4gdHJhbnNpdGlvbmluZyBmcm9tIHRoZSBzZXJ2ZXIgdG8gdGhlIGNsaWVudC5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb3Bwb3NpdGVQbGF0Zm9ybUNvbnRhaW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgb3Bwb3NpdGVQbGF0Zm9ybUNvbnRhaW5lcnNbaV0ucmVtb3ZlKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5fZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoY29udGFpbmVyQ2xhc3MpO1xuXG4gICAgLy8gQSBsb25nIHRpbWUgYWdvIHdlIGtlcHQgYWRkaW5nIG5ldyBvdmVybGF5IGNvbnRhaW5lcnMgd2hlbmV2ZXIgYSBuZXcgYXBwIHdhcyBpbnN0YW50aWF0ZWQsXG4gICAgLy8gYnV0IGF0IHNvbWUgcG9pbnQgd2UgYWRkZWQgbG9naWMgd2hpY2ggY2xlYXJzIHRoZSBkdXBsaWNhdGUgb25lcyBpbiBvcmRlciB0byBhdm9pZCBsZWFrcy5cbiAgICAvLyBUaGUgbmV3IGxvZ2ljIHdhcyBhIGxpdHRsZSB0b28gYWdncmVzc2l2ZSBzaW5jZSBpdCB3YXMgYnJlYWtpbmcgc29tZSBsZWdpdGltYXRlIHVzZSBjYXNlcy5cbiAgICAvLyBUbyBtaXRpZ2F0ZSB0aGUgcHJvYmxlbSB3ZSBtYWRlIGl0IHNvIHRoYXQgb25seSBjb250YWluZXJzIGZyb20gYSBkaWZmZXJlbnQgcGxhdGZvcm0gYXJlXG4gICAgLy8gY2xlYXJlZCwgYnV0IHRoZSBzaWRlLWVmZmVjdCB3YXMgdGhhdCBwZW9wbGUgc3RhcnRlZCBkZXBlbmRpbmcgb24gdGhlIG92ZXJseS1hZ2dyZXNzaXZlXG4gICAgLy8gbG9naWMgdG8gY2xlYW4gdXAgdGhlaXIgdGVzdHMgZm9yIHRoZW0uIFVudGlsIHdlIGNhbiBpbnRyb2R1Y2UgYW4gb3ZlcmxheS1zcGVjaWZpYyB0ZXN0aW5nXG4gICAgLy8gbW9kdWxlIHdoaWNoIGRvZXMgdGhlIGNsZWFudXAsIHdlIHRyeSB0byBkZXRlY3QgdGhhdCB3ZSdyZSBpbiBhIHRlc3QgZW52aXJvbm1lbnQgYW5kIHdlXG4gICAgLy8gYWx3YXlzIGNsZWFyIHRoZSBjb250YWluZXIuIFNlZSAjMTcwMDYuXG4gICAgLy8gVE9ETyhjcmlzYmV0byk6IHJlbW92ZSB0aGUgdGVzdCBlbnZpcm9ubWVudCBjaGVjayBvbmNlIHdlIGhhdmUgYW4gb3ZlcmxheSB0ZXN0aW5nIG1vZHVsZS5cbiAgICBpZiAoX2lzVGVzdEVudmlyb25tZW50KCkpIHtcbiAgICAgIGNvbnRhaW5lci5zZXRBdHRyaWJ1dGUoJ3BsYXRmb3JtJywgJ3Rlc3QnKTtcbiAgICB9IGVsc2UgaWYgKCF0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIpIHtcbiAgICAgIGNvbnRhaW5lci5zZXRBdHRyaWJ1dGUoJ3BsYXRmb3JtJywgJ3NlcnZlcicpO1xuICAgIH1cblxuICAgIHRoaXMuX2RvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgICB0aGlzLl9jb250YWluZXJFbGVtZW50ID0gY29udGFpbmVyO1xuICB9XG59XG4iXX0=