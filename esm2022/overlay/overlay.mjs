/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directionality } from '@angular/cdk/bidi';
import { DomPortalOutlet } from '@angular/cdk/portal';
import { DOCUMENT, Location } from '@angular/common';
import { ApplicationRef, ComponentFactoryResolver, Inject, Injectable, Injector, NgZone, ANIMATION_MODULE_TYPE, Optional, EnvironmentInjector, inject, } from '@angular/core';
import { _CdkPrivateStyleLoader } from '@angular/cdk/private';
import { OverlayKeyboardDispatcher } from './dispatchers/overlay-keyboard-dispatcher';
import { OverlayOutsideClickDispatcher } from './dispatchers/overlay-outside-click-dispatcher';
import { OverlayConfig } from './overlay-config';
import { _CdkOverlayStyleLoader, OverlayContainer } from './overlay-container';
import { OverlayRef } from './overlay-ref';
import { OverlayPositionBuilder } from './position/overlay-position-builder';
import { ScrollStrategyOptions } from './scroll/index';
import * as i0 from "@angular/core";
import * as i1 from "./scroll/index";
import * as i2 from "./overlay-container";
import * as i3 from "./position/overlay-position-builder";
import * as i4 from "./dispatchers/overlay-keyboard-dispatcher";
import * as i5 from "@angular/cdk/bidi";
import * as i6 from "@angular/common";
import * as i7 from "./dispatchers/overlay-outside-click-dispatcher";
/** Next overlay unique ID. */
let nextUniqueId = 0;
// Note that Overlay is *not* scoped to the app root because of the ComponentFactoryResolver
// which needs to be different depending on where OverlayModule is imported.
/**
 * Service to create Overlays. Overlays are dynamically added pieces of floating UI, meant to be
 * used as a low-level building block for other components. Dialogs, tooltips, menus,
 * selects, etc. can all be built using overlays. The service should primarily be used by authors
 * of re-usable components rather than developers building end-user applications.
 *
 * An overlay *is* a PortalOutlet, so any kind of Portal can be loaded into one.
 */
export class Overlay {
    constructor(
    /** Scrolling strategies that can be used when creating an overlay. */
    scrollStrategies, _overlayContainer, _componentFactoryResolver, _positionBuilder, _keyboardDispatcher, _injector, _ngZone, _document, _directionality, _location, _outsideClickDispatcher, _animationsModuleType) {
        this.scrollStrategies = scrollStrategies;
        this._overlayContainer = _overlayContainer;
        this._componentFactoryResolver = _componentFactoryResolver;
        this._positionBuilder = _positionBuilder;
        this._keyboardDispatcher = _keyboardDispatcher;
        this._injector = _injector;
        this._ngZone = _ngZone;
        this._document = _document;
        this._directionality = _directionality;
        this._location = _location;
        this._outsideClickDispatcher = _outsideClickDispatcher;
        this._animationsModuleType = _animationsModuleType;
        this._styleLoader = inject(_CdkPrivateStyleLoader);
    }
    /**
     * Creates an overlay.
     * @param config Configuration applied to the overlay.
     * @returns Reference to the created overlay.
     */
    create(config) {
        // This is done in the overlay container as well, but we have it here
        // since it's common to mock out the overlay container in tests.
        this._styleLoader.load(_CdkOverlayStyleLoader);
        const host = this._createHostElement();
        const pane = this._createPaneElement(host);
        const portalOutlet = this._createPortalOutlet(pane);
        const overlayConfig = new OverlayConfig(config);
        overlayConfig.direction = overlayConfig.direction || this._directionality.value;
        return new OverlayRef(portalOutlet, host, pane, overlayConfig, this._ngZone, this._keyboardDispatcher, this._document, this._location, this._outsideClickDispatcher, this._animationsModuleType === 'NoopAnimations', this._injector.get(EnvironmentInjector));
    }
    /**
     * Gets a position builder that can be used, via fluent API,
     * to construct and configure a position strategy.
     * @returns An overlay position builder.
     */
    position() {
        return this._positionBuilder;
    }
    /**
     * Creates the DOM element for an overlay and appends it to the overlay container.
     * @returns Newly-created pane element
     */
    _createPaneElement(host) {
        const pane = this._document.createElement('div');
        pane.id = `cdk-overlay-${nextUniqueId++}`;
        pane.classList.add('cdk-overlay-pane');
        host.appendChild(pane);
        return pane;
    }
    /**
     * Creates the host element that wraps around an overlay
     * and can be used for advanced positioning.
     * @returns Newly-create host element.
     */
    _createHostElement() {
        const host = this._document.createElement('div');
        this._overlayContainer.getContainerElement().appendChild(host);
        return host;
    }
    /**
     * Create a DomPortalOutlet into which the overlay content can be loaded.
     * @param pane The DOM element to turn into a portal outlet.
     * @returns A portal outlet for the given DOM element.
     */
    _createPortalOutlet(pane) {
        // We have to resolve the ApplicationRef later in order to allow people
        // to use overlay-based providers during app initialization.
        if (!this._appRef) {
            this._appRef = this._injector.get(ApplicationRef);
        }
        return new DomPortalOutlet(pane, this._componentFactoryResolver, this._appRef, this._injector, this._document);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: Overlay, deps: [{ token: i1.ScrollStrategyOptions }, { token: i2.OverlayContainer }, { token: i0.ComponentFactoryResolver }, { token: i3.OverlayPositionBuilder }, { token: i4.OverlayKeyboardDispatcher }, { token: i0.Injector }, { token: i0.NgZone }, { token: DOCUMENT }, { token: i5.Directionality }, { token: i6.Location }, { token: i7.OverlayOutsideClickDispatcher }, { token: ANIMATION_MODULE_TYPE, optional: true }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: Overlay, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: Overlay, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: () => [{ type: i1.ScrollStrategyOptions }, { type: i2.OverlayContainer }, { type: i0.ComponentFactoryResolver }, { type: i3.OverlayPositionBuilder }, { type: i4.OverlayKeyboardDispatcher }, { type: i0.Injector }, { type: i0.NgZone }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: i5.Directionality }, { type: i6.Location }, { type: i7.OverlayOutsideClickDispatcher }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [ANIMATION_MODULE_TYPE]
                }, {
                    type: Optional
                }] }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvb3ZlcmxheS9vdmVybGF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUNuRCxPQUFPLEVBQ0wsY0FBYyxFQUNkLHdCQUF3QixFQUN4QixNQUFNLEVBQ04sVUFBVSxFQUNWLFFBQVEsRUFDUixNQUFNLEVBQ04scUJBQXFCLEVBQ3JCLFFBQVEsRUFDUixtQkFBbUIsRUFDbkIsTUFBTSxHQUNQLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQzVELE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLDJDQUEyQyxDQUFDO0FBQ3BGLE9BQU8sRUFBQyw2QkFBNkIsRUFBQyxNQUFNLGdEQUFnRCxDQUFDO0FBQzdGLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUMvQyxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUM3RSxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3pDLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLHFDQUFxQyxDQUFDO0FBQzNFLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDOzs7Ozs7Ozs7QUFFckQsOEJBQThCO0FBQzlCLElBQUksWUFBWSxHQUFHLENBQUMsQ0FBQztBQUVyQiw0RkFBNEY7QUFDNUYsNEVBQTRFO0FBRTVFOzs7Ozs7O0dBT0c7QUFFSCxNQUFNLE9BQU8s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RztJQUNLLG1CQUFtQixDQUFDLElBQWlCO1FBQzNDLHVFQUF1RTtRQUN2RSw0REFBNEQ7UUFDNUQsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNsQixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFpQixjQUFjLENBQUMsQ0FBQztRQUNwRSxDQUFDO1FBRUQsT0FBTyxJQUFJLGVBQWUsQ0FDeEIsSUFBSSxFQUNKLElBQUksQ0FBQyx5QkFBeUIsRUFDOUIsSUFBSSxDQUFDLE9BQU8sRUFDWixJQUFJLENBQUMsU0FBUyxFQUNkLElBQUksQ0FBQyxTQUFTLENBQ2YsQ0FBQztJQUNKLENBQUM7cUhBekdVLE9BQU8sNFBBYVIsUUFBUSxnSEFJUixxQkFBcUI7eUhBakJwQixPQUFPLGNBREssTUFBTTs7a0dBQ2xCLE9BQU87a0JBRG5CLFVBQVU7bUJBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzswQkFjM0IsTUFBTTsyQkFBQyxRQUFROzswQkFJZixNQUFNOzJCQUFDLHFCQUFxQjs7MEJBQUcsUUFBUSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge0RvbVBvcnRhbE91dGxldH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BvcnRhbCc7XG5pbXBvcnQge0RPQ1VNRU5ULCBMb2NhdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7XG4gIEFwcGxpY2F0aW9uUmVmLFxuICBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsXG4gIEluamVjdCxcbiAgSW5qZWN0YWJsZSxcbiAgSW5qZWN0b3IsXG4gIE5nWm9uZSxcbiAgQU5JTUFUSU9OX01PRFVMRV9UWVBFLFxuICBPcHRpb25hbCxcbiAgRW52aXJvbm1lbnRJbmplY3RvcixcbiAgaW5qZWN0LFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7X0Nka1ByaXZhdGVTdHlsZUxvYWRlcn0gZnJvbSAnQGFuZ3VsYXIvY2RrL3ByaXZhdGUnO1xuaW1wb3J0IHtPdmVybGF5S2V5Ym9hcmREaXNwYXRjaGVyfSBmcm9tICcuL2Rpc3BhdGNoZXJzL292ZXJsYXkta2V5Ym9hcmQtZGlzcGF0Y2hlcic7XG5pbXBvcnQge092ZXJsYXlPdXRzaWRlQ2xpY2tEaXNwYXRjaGVyfSBmcm9tICcuL2Rpc3BhdGNoZXJzL292ZXJsYXktb3V0c2lkZS1jbGljay1kaXNwYXRjaGVyJztcbmltcG9ydCB7T3ZlcmxheUNvbmZpZ30gZnJvbSAnLi9vdmVybGF5LWNvbmZpZyc7XG5pbXBvcnQge19DZGtPdmVybGF5U3R5bGVMb2FkZXIsIE92ZXJsYXlDb250YWluZXJ9IGZyb20gJy4vb3ZlcmxheS1jb250YWluZXInO1xuaW1wb3J0IHtPdmVybGF5UmVmfSBmcm9tICcuL292ZXJsYXktcmVmJztcbmltcG9ydCB7T3ZlcmxheVBvc2l0aW9uQnVpbGRlcn0gZnJvbSAnLi9wb3NpdGlvbi9vdmVybGF5LXBvc2l0aW9uLWJ1aWxkZXInO1xuaW1wb3J0IHtTY3JvbGxTdHJhdGVneU9wdGlvbnN9IGZyb20gJy4vc2Nyb2xsL2luZGV4JztcblxuLyoqIE5leHQgb3ZlcmxheSB1bmlxdWUgSUQuICovXG5sZXQgbmV4dFVuaXF1ZUlkID0gMDtcblxuLy8gTm90ZSB0aGF0IE92ZXJsYXkgaXMgKm5vdCogc2NvcGVkIHRvIHRoZSBhcHAgcm9vdCBiZWNhdXNlIG9mIHRoZSBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXJcbi8vIHdoaWNoIG5lZWRzIHRvIGJlIGRpZmZlcmVudCBkZXBlbmRpbmcgb24gd2hlcmUgT3ZlcmxheU1vZHVsZSBpcyBpbXBvcnRlZC5cblxuLyoqXG4gKiBTZXJ2aWNlIHRvIGNyZWF0ZSBPdmVybGF5cy4gT3ZlcmxheXMgYXJlIGR5bmFtaWNhbGx5IGFkZGVkIHBpZWNlcyBvZiBmbG9hdGluZyBVSSwgbWVhbnQgdG8gYmVcbiAqIHVzZWQgYXMgYSBsb3ctbGV2ZWwgYnVpbGRpbmcgYmxvY2sgZm9yIG90aGVyIGNvbXBvbmVudHMuIERpYWxvZ3MsIHRvb2x0aXBzLCBtZW51cyxcbiAqIHNlbGVjdHMsIGV0Yy4gY2FuIGFsbCBiZSBidWlsdCB1c2luZyBvdmVybGF5cy4gVGhlIHNlcnZpY2Ugc2hvdWxkIHByaW1hcmlseSBiZSB1c2VkIGJ5IGF1dGhvcnNcbiAqIG9mIHJlLXVzYWJsZSBjb21wb25lbnRzIHJhdGhlciB0aGFuIGRldmVsb3BlcnMgYnVpbGRpbmcgZW5kLXVzZXIgYXBwbGljYXRpb25zLlxuICpcbiAqIEFuIG92ZXJsYXkgKmlzKiBhIFBvcnRhbE91dGxldCwgc28gYW55IGtpbmQgb2YgUG9ydGFsIGNhbiBiZSBsb2FkZWQgaW50byBvbmUuXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIE92ZXJsYXkge1xuICBwcml2YXRlIF9hcHBSZWY6IEFwcGxpY2F0aW9uUmVmO1xuICBwcml2YXRlIF9zdHlsZUxvYWRlciA9IGluamVjdChfQ2RrUHJpdmF0ZVN0eWxlTG9hZGVyKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAvKiogU2Nyb2xsaW5nIHN0cmF0ZWdpZXMgdGhhdCBjYW4gYmUgdXNlZCB3aGVuIGNyZWF0aW5nIGFuIG92ZXJsYXkuICovXG4gICAgcHVibGljIHNjcm9sbFN0cmF0ZWdpZXM6IFNjcm9sbFN0cmF0ZWd5T3B0aW9ucyxcbiAgICBwcml2YXRlIF9vdmVybGF5Q29udGFpbmVyOiBPdmVybGF5Q29udGFpbmVyLFxuICAgIHByaXZhdGUgX2NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjogQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLFxuICAgIHByaXZhdGUgX3Bvc2l0aW9uQnVpbGRlcjogT3ZlcmxheVBvc2l0aW9uQnVpbGRlcixcbiAgICBwcml2YXRlIF9rZXlib2FyZERpc3BhdGNoZXI6IE92ZXJsYXlLZXlib2FyZERpc3BhdGNoZXIsXG4gICAgcHJpdmF0ZSBfaW5qZWN0b3I6IEluamVjdG9yLFxuICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgIEBJbmplY3QoRE9DVU1FTlQpIHByaXZhdGUgX2RvY3VtZW50OiBhbnksXG4gICAgcHJpdmF0ZSBfZGlyZWN0aW9uYWxpdHk6IERpcmVjdGlvbmFsaXR5LFxuICAgIHByaXZhdGUgX2xvY2F0aW9uOiBMb2NhdGlvbixcbiAgICBwcml2YXRlIF9vdXRzaWRlQ2xpY2tEaXNwYXRjaGVyOiBPdmVybGF5T3V0c2lkZUNsaWNrRGlzcGF0Y2hlcixcbiAgICBASW5qZWN0KEFOSU1BVElPTl9NT0RVTEVfVFlQRSkgQE9wdGlvbmFsKCkgcHJpdmF0ZSBfYW5pbWF0aW9uc01vZHVsZVR5cGU/OiBzdHJpbmcsXG4gICkge31cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBvdmVybGF5LlxuICAgKiBAcGFyYW0gY29uZmlnIENvbmZpZ3VyYXRpb24gYXBwbGllZCB0byB0aGUgb3ZlcmxheS5cbiAgICogQHJldHVybnMgUmVmZXJlbmNlIHRvIHRoZSBjcmVhdGVkIG92ZXJsYXkuXG4gICAqL1xuICBjcmVhdGUoY29uZmlnPzogT3ZlcmxheUNvbmZpZyk6IE92ZXJsYXlSZWYge1xuICAgIC8vIFRoaXMgaXMgZG9uZSBpbiB0aGUgb3ZlcmxheSBjb250YWluZXIgYXMgd2VsbCwgYnV0IHdlIGhhdmUgaXQgaGVyZVxuICAgIC8vIHNpbmNlIGl0J3MgY29tbW9uIHRvIG1vY2sgb3V0IHRoZSBvdmVybGF5IGNvbnRhaW5lciBpbiB0ZXN0cy5cbiAgICB0aGlzLl9zdHlsZUxvYWRlci5sb2FkKF9DZGtPdmVybGF5U3R5bGVMb2FkZXIpO1xuXG4gICAgY29uc3QgaG9zdCA9IHRoaXMuX2NyZWF0ZUhvc3RFbGVtZW50KCk7XG4gICAgY29uc3QgcGFuZSA9IHRoaXMuX2NyZWF0ZVBhbmVFbGVtZW50KGhvc3QpO1xuICAgIGNvbnN0IHBvcnRhbE91dGxldCA9IHRoaXMuX2NyZWF0ZVBvcnRhbE91dGxldChwYW5lKTtcbiAgICBjb25zdCBvdmVybGF5Q29uZmlnID0gbmV3IE92ZXJsYXlDb25maWcoY29uZmlnKTtcblxuICAgIG92ZXJsYXlDb25maWcuZGlyZWN0aW9uID0gb3ZlcmxheUNvbmZpZy5kaXJlY3Rpb24gfHwgdGhpcy5fZGlyZWN0aW9uYWxpdHkudmFsdWU7XG5cbiAgICByZXR1cm4gbmV3IE92ZXJsYXlSZWYoXG4gICAgICBwb3J0YWxPdXRsZXQsXG4gICAgICBob3N0LFxuICAgICAgcGFuZSxcbiAgICAgIG92ZXJsYXlDb25maWcsXG4gICAgICB0aGlzLl9uZ1pvbmUsXG4gICAgICB0aGlzLl9rZXlib2FyZERpc3BhdGNoZXIsXG4gICAgICB0aGlzLl9kb2N1bWVudCxcbiAgICAgIHRoaXMuX2xvY2F0aW9uLFxuICAgICAgdGhpcy5fb3V0c2lkZUNsaWNrRGlzcGF0Y2hlcixcbiAgICAgIHRoaXMuX2FuaW1hdGlvbnNNb2R1bGVUeXBlID09PSAnTm9vcEFuaW1hdGlvbnMnLFxuICAgICAgdGhpcy5faW5qZWN0b3IuZ2V0KEVudmlyb25tZW50SW5qZWN0b3IpLFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIHBvc2l0aW9uIGJ1aWxkZXIgdGhhdCBjYW4gYmUgdXNlZCwgdmlhIGZsdWVudCBBUEksXG4gICAqIHRvIGNvbnN0cnVjdCBhbmQgY29uZmlndXJlIGEgcG9zaXRpb24gc3RyYXRlZ3kuXG4gICAqIEByZXR1cm5zIEFuIG92ZXJsYXkgcG9zaXRpb24gYnVpbGRlci5cbiAgICovXG4gIHBvc2l0aW9uKCk6IE92ZXJsYXlQb3NpdGlvbkJ1aWxkZXIge1xuICAgIHJldHVybiB0aGlzLl9wb3NpdGlvbkJ1aWxkZXI7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyB0aGUgRE9NIGVsZW1lbnQgZm9yIGFuIG92ZXJsYXkgYW5kIGFwcGVuZHMgaXQgdG8gdGhlIG92ZXJsYXkgY29udGFpbmVyLlxuICAgKiBAcmV0dXJucyBOZXdseS1jcmVhdGVkIHBhbmUgZWxlbWVudFxuICAgKi9cbiAgcHJpdmF0ZSBfY3JlYXRlUGFuZUVsZW1lbnQoaG9zdDogSFRNTEVsZW1lbnQpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3QgcGFuZSA9IHRoaXMuX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gICAgcGFuZS5pZCA9IGBjZGstb3ZlcmxheS0ke25leHRVbmlxdWVJZCsrfWA7XG4gICAgcGFuZS5jbGFzc0xpc3QuYWRkKCdjZGstb3ZlcmxheS1wYW5lJyk7XG4gICAgaG9zdC5hcHBlbmRDaGlsZChwYW5lKTtcblxuICAgIHJldHVybiBwYW5lO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgdGhlIGhvc3QgZWxlbWVudCB0aGF0IHdyYXBzIGFyb3VuZCBhbiBvdmVybGF5XG4gICAqIGFuZCBjYW4gYmUgdXNlZCBmb3IgYWR2YW5jZWQgcG9zaXRpb25pbmcuXG4gICAqIEByZXR1cm5zIE5ld2x5LWNyZWF0ZSBob3N0IGVsZW1lbnQuXG4gICAqL1xuICBwcml2YXRlIF9jcmVhdGVIb3N0RWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3QgaG9zdCA9IHRoaXMuX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuX292ZXJsYXlDb250YWluZXIuZ2V0Q29udGFpbmVyRWxlbWVudCgpLmFwcGVuZENoaWxkKGhvc3QpO1xuICAgIHJldHVybiBob3N0O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIERvbVBvcnRhbE91dGxldCBpbnRvIHdoaWNoIHRoZSBvdmVybGF5IGNvbnRlbnQgY2FuIGJlIGxvYWRlZC5cbiAgICogQHBhcmFtIHBhbmUgVGhlIERPTSBlbGVtZW50IHRvIHR1cm4gaW50byBhIHBvcnRhbCBvdXRsZXQuXG4gICAqIEByZXR1cm5zIEEgcG9ydGFsIG91dGxldCBmb3IgdGhlIGdpdmVuIERPTSBlbGVtZW50LlxuICAgKi9cbiAgcHJpdmF0ZSBfY3JlYXRlUG9ydGFsT3V0bGV0KHBhbmU6IEhUTUxFbGVtZW50KTogRG9tUG9ydGFsT3V0bGV0IHtcbiAgICAvLyBXZSBoYXZlIHRvIHJlc29sdmUgdGhlIEFwcGxpY2F0aW9uUmVmIGxhdGVyIGluIG9yZGVyIHRvIGFsbG93IHBlb3BsZVxuICAgIC8vIHRvIHVzZSBvdmVybGF5LWJhc2VkIHByb3ZpZGVycyBkdXJpbmcgYXBwIGluaXRpYWxpemF0aW9uLlxuICAgIGlmICghdGhpcy5fYXBwUmVmKSB7XG4gICAgICB0aGlzLl9hcHBSZWYgPSB0aGlzLl9pbmplY3Rvci5nZXQ8QXBwbGljYXRpb25SZWY+KEFwcGxpY2F0aW9uUmVmKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IERvbVBvcnRhbE91dGxldChcbiAgICAgIHBhbmUsXG4gICAgICB0aGlzLl9jb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsXG4gICAgICB0aGlzLl9hcHBSZWYsXG4gICAgICB0aGlzLl9pbmplY3RvcixcbiAgICAgIHRoaXMuX2RvY3VtZW50LFxuICAgICk7XG4gIH1cbn1cbiJdfQ==