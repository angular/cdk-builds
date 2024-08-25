/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, Component, ChangeDetectionStrategy, ViewEncapsulation, inject, } from '@angular/core';
import { _CdkPrivateStyleLoader } from '@angular/cdk/private';
import { Platform, _isTestEnvironment } from '@angular/cdk/platform';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
export class _CdkOverlayStyleLoader {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: _CdkOverlayStyleLoader, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "18.2.0-next.2", type: _CdkOverlayStyleLoader, isStandalone: true, selector: "ng-component", host: { attributes: { "cdk-overlay-style-loader": "" } }, ngImport: i0, template: '', isInline: true, styles: [".cdk-overlay-container,.cdk-global-overlay-wrapper{pointer-events:none;top:0;left:0;height:100%;width:100%}.cdk-overlay-container{position:fixed;z-index:1000}.cdk-overlay-container:empty{display:none}.cdk-global-overlay-wrapper{display:flex;position:absolute;z-index:1000}.cdk-overlay-pane{position:absolute;pointer-events:auto;box-sizing:border-box;z-index:1000;display:flex;max-width:100%;max-height:100%}.cdk-overlay-backdrop{position:absolute;top:0;bottom:0;left:0;right:0;z-index:1000;pointer-events:auto;-webkit-tap-highlight-color:rgba(0,0,0,0);transition:opacity 400ms cubic-bezier(0.25, 0.8, 0.25, 1);opacity:0}.cdk-overlay-backdrop-showing{opacity:1}.cdk-high-contrast-active .cdk-overlay-backdrop-showing{opacity:.6}.cdk-overlay-dark-backdrop{background:var(--cdk-overlay-backdrop-dark-color, rgba(0, 0, 0, 0.32))}.cdk-overlay-transparent-backdrop{transition:visibility 1ms linear,opacity 1ms linear;visibility:hidden;opacity:1}.cdk-overlay-transparent-backdrop.cdk-overlay-backdrop-showing,.cdk-high-contrast-active .cdk-overlay-transparent-backdrop{opacity:0;visibility:visible}.cdk-overlay-backdrop-noop-animation{transition:none}.cdk-overlay-connected-position-bounding-box{position:absolute;z-index:1000;display:flex;flex-direction:column;min-width:1px;min-height:1px}.cdk-global-scrollblock{position:fixed;width:100%;overflow-y:scroll}"], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: _CdkOverlayStyleLoader, decorators: [{
            type: Component,
            args: [{ template: '', changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, standalone: true, host: { 'cdk-overlay-style-loader': '' }, styles: [".cdk-overlay-container,.cdk-global-overlay-wrapper{pointer-events:none;top:0;left:0;height:100%;width:100%}.cdk-overlay-container{position:fixed;z-index:1000}.cdk-overlay-container:empty{display:none}.cdk-global-overlay-wrapper{display:flex;position:absolute;z-index:1000}.cdk-overlay-pane{position:absolute;pointer-events:auto;box-sizing:border-box;z-index:1000;display:flex;max-width:100%;max-height:100%}.cdk-overlay-backdrop{position:absolute;top:0;bottom:0;left:0;right:0;z-index:1000;pointer-events:auto;-webkit-tap-highlight-color:rgba(0,0,0,0);transition:opacity 400ms cubic-bezier(0.25, 0.8, 0.25, 1);opacity:0}.cdk-overlay-backdrop-showing{opacity:1}.cdk-high-contrast-active .cdk-overlay-backdrop-showing{opacity:.6}.cdk-overlay-dark-backdrop{background:var(--cdk-overlay-backdrop-dark-color, rgba(0, 0, 0, 0.32))}.cdk-overlay-transparent-backdrop{transition:visibility 1ms linear,opacity 1ms linear;visibility:hidden;opacity:1}.cdk-overlay-transparent-backdrop.cdk-overlay-backdrop-showing,.cdk-high-contrast-active .cdk-overlay-transparent-backdrop{opacity:0;visibility:visible}.cdk-overlay-backdrop-noop-animation{transition:none}.cdk-overlay-connected-position-bounding-box{position:absolute;z-index:1000;display:flex;flex-direction:column;min-width:1px;min-height:1px}.cdk-global-scrollblock{position:fixed;width:100%;overflow-y:scroll}"] }]
        }] });
/** Container inside which all overlays will render. */
export class OverlayContainer {
    constructor(document, _platform) {
        this._platform = _platform;
        this._styleLoader = inject(_CdkPrivateStyleLoader);
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
        this._loadStyles();
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
    /** Loads the structural styles necessary for the overlay to work. */
    _loadStyles() {
        this._styleLoader.load(_CdkOverlayStyleLoader);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: OverlayContainer, deps: [{ token: DOCUMENT }, { token: i1.Platform }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: OverlayContainer, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: OverlayContainer, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: () => [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: i1.Platform }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1jb250YWluZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvb3ZlcmxheS1jb250YWluZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFDTCxNQUFNLEVBQ04sVUFBVSxFQUVWLFNBQVMsRUFDVCx1QkFBdUIsRUFDdkIsaUJBQWlCLEVBQ2pCLE1BQU0sR0FDUCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUM1RCxPQUFPLEVBQUMsUUFBUSxFQUFFLGtCQUFrQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7OztBQVVuRSxNQUFNLE9BQU8sc0JBQXNCO3FIQUF0QixzQkFBc0I7eUdBQXRCLHNCQUFzQixrSUFQdkIsRUFBRTs7a0dBT0Qsc0JBQXNCO2tCQVJsQyxTQUFTOytCQUNFLEVBQUUsbUJBQ0ssdUJBQXVCLENBQUMsTUFBTSxpQkFDaEMsaUJBQWlCLENBQUMsSUFBSSxjQUN6QixJQUFJLFFBRVYsRUFBQywwQkFBMEIsRUFBRSxFQUFFLEVBQUM7O0FBSXhDLHVEQUF1RDtBQUV2RCxNQUFNLE9BQU8sZ0JBQWdCO0lBSzNCLFlBQ29CLFFBQWEsRUFDckIsU0FBbUI7UUFBbkIsY0FBUyxHQUFULFNBQVMsQ0FBVTtRQUpyQixpQkFBWSxHQUFHLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBTXRELElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO0lBQzVCLENBQUM7SUFFRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLGlCQUFpQixFQUFFLE1BQU0sRUFBRSxDQUFDO0lBQ25DLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILG1CQUFtQjtRQUNqQixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFFbkIsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQzVCLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFRCxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztJQUNoQyxDQUFDO0lBRUQ7OztPQUdHO0lBQ08sZ0JBQWdCO1FBQ3hCLE1BQU0sY0FBYyxHQUFHLHVCQUF1QixDQUFDO1FBRS9DLDJFQUEyRTtRQUMzRSxxRUFBcUU7UUFDckUsa0RBQWtEO1FBQ2xELElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLElBQUksa0JBQWtCLEVBQUUsRUFBRSxDQUFDO1lBQ3JELE1BQU0sMEJBQTBCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FDaEUsSUFBSSxjQUFjLHVCQUF1QixHQUFHLElBQUksY0FBYyxtQkFBbUIsQ0FDbEYsQ0FBQztZQUVGLHdEQUF3RDtZQUN4RCxvRUFBb0U7WUFDcEUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLDBCQUEwQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUMzRCwwQkFBMEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUN6QyxDQUFDO1FBQ0gsQ0FBQztRQUVELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RELFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBRXhDLDZGQUE2RjtRQUM3Riw0RkFBNEY7UUFDNUYsNkZBQTZGO1FBQzdGLDJGQUEyRjtRQUMzRiwwRkFBMEY7UUFDMUYsNkZBQTZGO1FBQzdGLDBGQUEwRjtRQUMxRiwwQ0FBMEM7UUFDMUMsNEZBQTRGO1FBQzVGLElBQUksa0JBQWtCLEVBQUUsRUFBRSxDQUFDO1lBQ3pCLFNBQVMsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzdDLENBQUM7YUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNyQyxTQUFTLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBRUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzNDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxTQUFTLENBQUM7SUFDckMsQ0FBQztJQUVELHFFQUFxRTtJQUMzRCxXQUFXO1FBQ25CLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUM7SUFDakQsQ0FBQztxSEEvRVUsZ0JBQWdCLGtCQU1qQixRQUFRO3lIQU5QLGdCQUFnQixjQURKLE1BQU07O2tHQUNsQixnQkFBZ0I7a0JBRDVCLFVBQVU7bUJBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzswQkFPM0IsTUFBTTsyQkFBQyxRQUFRIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge1xuICBJbmplY3QsXG4gIEluamVjdGFibGUsXG4gIE9uRGVzdHJveSxcbiAgQ29tcG9uZW50LFxuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgVmlld0VuY2Fwc3VsYXRpb24sXG4gIGluamVjdCxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge19DZGtQcml2YXRlU3R5bGVMb2FkZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wcml2YXRlJztcbmltcG9ydCB7UGxhdGZvcm0sIF9pc1Rlc3RFbnZpcm9ubWVudH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcblxuQENvbXBvbmVudCh7XG4gIHRlbXBsYXRlOiAnJyxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG4gIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsXG4gIHN0YW5kYWxvbmU6IHRydWUsXG4gIHN0eWxlVXJsOiAnb3ZlcmxheS1wcmVidWlsdC5jc3MnLFxuICBob3N0OiB7J2Nkay1vdmVybGF5LXN0eWxlLWxvYWRlcic6ICcnfSxcbn0pXG5leHBvcnQgY2xhc3MgX0Nka092ZXJsYXlTdHlsZUxvYWRlciB7fVxuXG4vKiogQ29udGFpbmVyIGluc2lkZSB3aGljaCBhbGwgb3ZlcmxheXMgd2lsbCByZW5kZXIuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBPdmVybGF5Q29udGFpbmVyIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgcHJvdGVjdGVkIF9jb250YWluZXJFbGVtZW50OiBIVE1MRWxlbWVudDtcbiAgcHJvdGVjdGVkIF9kb2N1bWVudDogRG9jdW1lbnQ7XG4gIHByb3RlY3RlZCBfc3R5bGVMb2FkZXIgPSBpbmplY3QoX0Nka1ByaXZhdGVTdHlsZUxvYWRlcik7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgQEluamVjdChET0NVTUVOVCkgZG9jdW1lbnQ6IGFueSxcbiAgICBwcm90ZWN0ZWQgX3BsYXRmb3JtOiBQbGF0Zm9ybSxcbiAgKSB7XG4gICAgdGhpcy5fZG9jdW1lbnQgPSBkb2N1bWVudDtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2NvbnRhaW5lckVsZW1lbnQ/LnJlbW92ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIHJldHVybnMgdGhlIG92ZXJsYXkgY29udGFpbmVyIGVsZW1lbnQuIEl0IHdpbGwgbGF6aWx5XG4gICAqIGNyZWF0ZSB0aGUgZWxlbWVudCB0aGUgZmlyc3QgdGltZSBpdCBpcyBjYWxsZWQgdG8gZmFjaWxpdGF0ZSB1c2luZ1xuICAgKiB0aGUgY29udGFpbmVyIGluIG5vbi1icm93c2VyIGVudmlyb25tZW50cy5cbiAgICogQHJldHVybnMgdGhlIGNvbnRhaW5lciBlbGVtZW50XG4gICAqL1xuICBnZXRDb250YWluZXJFbGVtZW50KCk6IEhUTUxFbGVtZW50IHtcbiAgICB0aGlzLl9sb2FkU3R5bGVzKCk7XG5cbiAgICBpZiAoIXRoaXMuX2NvbnRhaW5lckVsZW1lbnQpIHtcbiAgICAgIHRoaXMuX2NyZWF0ZUNvbnRhaW5lcigpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9jb250YWluZXJFbGVtZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSB0aGUgb3ZlcmxheSBjb250YWluZXIgZWxlbWVudCwgd2hpY2ggaXMgc2ltcGx5IGEgZGl2XG4gICAqIHdpdGggdGhlICdjZGstb3ZlcmxheS1jb250YWluZXInIGNsYXNzIG9uIHRoZSBkb2N1bWVudCBib2R5LlxuICAgKi9cbiAgcHJvdGVjdGVkIF9jcmVhdGVDb250YWluZXIoKTogdm9pZCB7XG4gICAgY29uc3QgY29udGFpbmVyQ2xhc3MgPSAnY2RrLW92ZXJsYXktY29udGFpbmVyJztcblxuICAgIC8vIFRPRE8oY3Jpc2JldG8pOiByZW1vdmUgdGhlIHRlc3RpbmcgY2hlY2sgb25jZSB3ZSBoYXZlIGFuIG92ZXJsYXkgdGVzdGluZ1xuICAgIC8vIG1vZHVsZSBvciBBbmd1bGFyIHN0YXJ0cyB0ZWFyaW5nIGRvd24gdGhlIHRlc3RpbmcgYE5nTW9kdWxlYC4gU2VlOlxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvaXNzdWVzLzE4ODMxXG4gICAgaWYgKHRoaXMuX3BsYXRmb3JtLmlzQnJvd3NlciB8fCBfaXNUZXN0RW52aXJvbm1lbnQoKSkge1xuICAgICAgY29uc3Qgb3Bwb3NpdGVQbGF0Zm9ybUNvbnRhaW5lcnMgPSB0aGlzLl9kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFxuICAgICAgICBgLiR7Y29udGFpbmVyQ2xhc3N9W3BsYXRmb3JtPVwic2VydmVyXCJdLCBgICsgYC4ke2NvbnRhaW5lckNsYXNzfVtwbGF0Zm9ybT1cInRlc3RcIl1gLFxuICAgICAgKTtcblxuICAgICAgLy8gUmVtb3ZlIGFueSBvbGQgY29udGFpbmVycyBmcm9tIHRoZSBvcHBvc2l0ZSBwbGF0Zm9ybS5cbiAgICAgIC8vIFRoaXMgY2FuIGhhcHBlbiB3aGVuIHRyYW5zaXRpb25pbmcgZnJvbSB0aGUgc2VydmVyIHRvIHRoZSBjbGllbnQuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9wcG9zaXRlUGxhdGZvcm1Db250YWluZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG9wcG9zaXRlUGxhdGZvcm1Db250YWluZXJzW2ldLnJlbW92ZSgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKGNvbnRhaW5lckNsYXNzKTtcblxuICAgIC8vIEEgbG9uZyB0aW1lIGFnbyB3ZSBrZXB0IGFkZGluZyBuZXcgb3ZlcmxheSBjb250YWluZXJzIHdoZW5ldmVyIGEgbmV3IGFwcCB3YXMgaW5zdGFudGlhdGVkLFxuICAgIC8vIGJ1dCBhdCBzb21lIHBvaW50IHdlIGFkZGVkIGxvZ2ljIHdoaWNoIGNsZWFycyB0aGUgZHVwbGljYXRlIG9uZXMgaW4gb3JkZXIgdG8gYXZvaWQgbGVha3MuXG4gICAgLy8gVGhlIG5ldyBsb2dpYyB3YXMgYSBsaXR0bGUgdG9vIGFnZ3Jlc3NpdmUgc2luY2UgaXQgd2FzIGJyZWFraW5nIHNvbWUgbGVnaXRpbWF0ZSB1c2UgY2FzZXMuXG4gICAgLy8gVG8gbWl0aWdhdGUgdGhlIHByb2JsZW0gd2UgbWFkZSBpdCBzbyB0aGF0IG9ubHkgY29udGFpbmVycyBmcm9tIGEgZGlmZmVyZW50IHBsYXRmb3JtIGFyZVxuICAgIC8vIGNsZWFyZWQsIGJ1dCB0aGUgc2lkZS1lZmZlY3Qgd2FzIHRoYXQgcGVvcGxlIHN0YXJ0ZWQgZGVwZW5kaW5nIG9uIHRoZSBvdmVybHktYWdncmVzc2l2ZVxuICAgIC8vIGxvZ2ljIHRvIGNsZWFuIHVwIHRoZWlyIHRlc3RzIGZvciB0aGVtLiBVbnRpbCB3ZSBjYW4gaW50cm9kdWNlIGFuIG92ZXJsYXktc3BlY2lmaWMgdGVzdGluZ1xuICAgIC8vIG1vZHVsZSB3aGljaCBkb2VzIHRoZSBjbGVhbnVwLCB3ZSB0cnkgdG8gZGV0ZWN0IHRoYXQgd2UncmUgaW4gYSB0ZXN0IGVudmlyb25tZW50IGFuZCB3ZVxuICAgIC8vIGFsd2F5cyBjbGVhciB0aGUgY29udGFpbmVyLiBTZWUgIzE3MDA2LlxuICAgIC8vIFRPRE8oY3Jpc2JldG8pOiByZW1vdmUgdGhlIHRlc3QgZW52aXJvbm1lbnQgY2hlY2sgb25jZSB3ZSBoYXZlIGFuIG92ZXJsYXkgdGVzdGluZyBtb2R1bGUuXG4gICAgaWYgKF9pc1Rlc3RFbnZpcm9ubWVudCgpKSB7XG4gICAgICBjb250YWluZXIuc2V0QXR0cmlidXRlKCdwbGF0Zm9ybScsICd0ZXN0Jyk7XG4gICAgfSBlbHNlIGlmICghdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICBjb250YWluZXIuc2V0QXR0cmlidXRlKCdwbGF0Zm9ybScsICdzZXJ2ZXInKTtcbiAgICB9XG5cbiAgICB0aGlzLl9kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XG4gICAgdGhpcy5fY29udGFpbmVyRWxlbWVudCA9IGNvbnRhaW5lcjtcbiAgfVxuXG4gIC8qKiBMb2FkcyB0aGUgc3RydWN0dXJhbCBzdHlsZXMgbmVjZXNzYXJ5IGZvciB0aGUgb3ZlcmxheSB0byB3b3JrLiAqL1xuICBwcm90ZWN0ZWQgX2xvYWRTdHlsZXMoKTogdm9pZCB7XG4gICAgdGhpcy5fc3R5bGVMb2FkZXIubG9hZChfQ2RrT3ZlcmxheVN0eWxlTG9hZGVyKTtcbiAgfVxufVxuIl19