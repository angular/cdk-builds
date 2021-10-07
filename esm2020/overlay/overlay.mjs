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
import { ApplicationRef, ComponentFactoryResolver, Inject, Injectable, Injector, NgZone, } from '@angular/core';
import { OverlayKeyboardDispatcher } from './dispatchers/overlay-keyboard-dispatcher';
import { OverlayOutsideClickDispatcher } from './dispatchers/overlay-outside-click-dispatcher';
import { OverlayConfig } from './overlay-config';
import { OverlayContainer } from './overlay-container';
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
    scrollStrategies, _overlayContainer, _componentFactoryResolver, _positionBuilder, _keyboardDispatcher, _injector, _ngZone, _document, _directionality, _location, _outsideClickDispatcher) {
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
    }
    /**
     * Creates an overlay.
     * @param config Configuration applied to the overlay.
     * @returns Reference to the created overlay.
     */
    create(config) {
        const host = this._createHostElement();
        const pane = this._createPaneElement(host);
        const portalOutlet = this._createPortalOutlet(pane);
        const overlayConfig = new OverlayConfig(config);
        overlayConfig.direction = overlayConfig.direction || this._directionality.value;
        return new OverlayRef(portalOutlet, host, pane, overlayConfig, this._ngZone, this._keyboardDispatcher, this._document, this._location, this._outsideClickDispatcher);
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
}
Overlay.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: Overlay, deps: [{ token: i1.ScrollStrategyOptions }, { token: i2.OverlayContainer }, { token: i0.ComponentFactoryResolver }, { token: i3.OverlayPositionBuilder }, { token: i4.OverlayKeyboardDispatcher }, { token: i0.Injector }, { token: i0.NgZone }, { token: DOCUMENT }, { token: i5.Directionality }, { token: i6.Location }, { token: i7.OverlayOutsideClickDispatcher }], target: i0.ɵɵFactoryTarget.Injectable });
Overlay.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: Overlay });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: Overlay, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return [{ type: i1.ScrollStrategyOptions }, { type: i2.OverlayContainer }, { type: i0.ComponentFactoryResolver }, { type: i3.OverlayPositionBuilder }, { type: i4.OverlayKeyboardDispatcher }, { type: i0.Injector }, { type: i0.NgZone }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: i5.Directionality }, { type: i6.Location }, { type: i7.OverlayOutsideClickDispatcher }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvb3ZlcmxheS9vdmVybGF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUNuRCxPQUFPLEVBQ0wsY0FBYyxFQUNkLHdCQUF3QixFQUN4QixNQUFNLEVBQ04sVUFBVSxFQUNWLFFBQVEsRUFDUixNQUFNLEdBQ1AsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sMkNBQTJDLENBQUM7QUFDcEYsT0FBTyxFQUFDLDZCQUE2QixFQUFDLE1BQU0sZ0RBQWdELENBQUM7QUFDN0YsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDekMsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0scUNBQXFDLENBQUM7QUFDM0UsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7Ozs7Ozs7OztBQUdyRCw4QkFBOEI7QUFDOUIsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDO0FBRXJCLDRGQUE0RjtBQUM1Riw0RUFBNEU7QUFFNUU7Ozs7Ozs7R0FPRztBQUVILE1BQU0sT0FBTyxPQUFPO0lBR2xCO0lBQ1ksc0VBQXNFO0lBQy9ELGdCQUF1QyxFQUN0QyxpQkFBbUMsRUFDbkMseUJBQW1ELEVBQ25ELGdCQUF3QyxFQUN4QyxtQkFBOEMsRUFDOUMsU0FBbUIsRUFD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VUFBVTs7MEJBYUksTUFBTTsyQkFBQyxRQUFRIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7RG9tUG9ydGFsT3V0bGV0fSBmcm9tICdAYW5ndWxhci9jZGsvcG9ydGFsJztcbmltcG9ydCB7RE9DVU1FTlQsIExvY2F0aW9ufSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtcbiAgQXBwbGljYXRpb25SZWYsXG4gIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcixcbiAgSW5qZWN0LFxuICBJbmplY3RhYmxlLFxuICBJbmplY3RvcixcbiAgTmdab25lLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T3ZlcmxheUtleWJvYXJkRGlzcGF0Y2hlcn0gZnJvbSAnLi9kaXNwYXRjaGVycy9vdmVybGF5LWtleWJvYXJkLWRpc3BhdGNoZXInO1xuaW1wb3J0IHtPdmVybGF5T3V0c2lkZUNsaWNrRGlzcGF0Y2hlcn0gZnJvbSAnLi9kaXNwYXRjaGVycy9vdmVybGF5LW91dHNpZGUtY2xpY2stZGlzcGF0Y2hlcic7XG5pbXBvcnQge092ZXJsYXlDb25maWd9IGZyb20gJy4vb3ZlcmxheS1jb25maWcnO1xuaW1wb3J0IHtPdmVybGF5Q29udGFpbmVyfSBmcm9tICcuL292ZXJsYXktY29udGFpbmVyJztcbmltcG9ydCB7T3ZlcmxheVJlZn0gZnJvbSAnLi9vdmVybGF5LXJlZic7XG5pbXBvcnQge092ZXJsYXlQb3NpdGlvbkJ1aWxkZXJ9IGZyb20gJy4vcG9zaXRpb24vb3ZlcmxheS1wb3NpdGlvbi1idWlsZGVyJztcbmltcG9ydCB7U2Nyb2xsU3RyYXRlZ3lPcHRpb25zfSBmcm9tICcuL3Njcm9sbC9pbmRleCc7XG5cblxuLyoqIE5leHQgb3ZlcmxheSB1bmlxdWUgSUQuICovXG5sZXQgbmV4dFVuaXF1ZUlkID0gMDtcblxuLy8gTm90ZSB0aGF0IE92ZXJsYXkgaXMgKm5vdCogc2NvcGVkIHRvIHRoZSBhcHAgcm9vdCBiZWNhdXNlIG9mIHRoZSBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXJcbi8vIHdoaWNoIG5lZWRzIHRvIGJlIGRpZmZlcmVudCBkZXBlbmRpbmcgb24gd2hlcmUgT3ZlcmxheU1vZHVsZSBpcyBpbXBvcnRlZC5cblxuLyoqXG4gKiBTZXJ2aWNlIHRvIGNyZWF0ZSBPdmVybGF5cy4gT3ZlcmxheXMgYXJlIGR5bmFtaWNhbGx5IGFkZGVkIHBpZWNlcyBvZiBmbG9hdGluZyBVSSwgbWVhbnQgdG8gYmVcbiAqIHVzZWQgYXMgYSBsb3ctbGV2ZWwgYnVpbGRpbmcgYmxvY2sgZm9yIG90aGVyIGNvbXBvbmVudHMuIERpYWxvZ3MsIHRvb2x0aXBzLCBtZW51cyxcbiAqIHNlbGVjdHMsIGV0Yy4gY2FuIGFsbCBiZSBidWlsdCB1c2luZyBvdmVybGF5cy4gVGhlIHNlcnZpY2Ugc2hvdWxkIHByaW1hcmlseSBiZSB1c2VkIGJ5IGF1dGhvcnNcbiAqIG9mIHJlLXVzYWJsZSBjb21wb25lbnRzIHJhdGhlciB0aGFuIGRldmVsb3BlcnMgYnVpbGRpbmcgZW5kLXVzZXIgYXBwbGljYXRpb25zLlxuICpcbiAqIEFuIG92ZXJsYXkgKmlzKiBhIFBvcnRhbE91dGxldCwgc28gYW55IGtpbmQgb2YgUG9ydGFsIGNhbiBiZSBsb2FkZWQgaW50byBvbmUuXG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBPdmVybGF5IHtcbiAgcHJpdmF0ZSBfYXBwUmVmOiBBcHBsaWNhdGlvblJlZjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgICAgICAgICAgLyoqIFNjcm9sbGluZyBzdHJhdGVnaWVzIHRoYXQgY2FuIGJlIHVzZWQgd2hlbiBjcmVhdGluZyBhbiBvdmVybGF5LiAqL1xuICAgICAgICAgICAgICBwdWJsaWMgc2Nyb2xsU3RyYXRlZ2llczogU2Nyb2xsU3RyYXRlZ3lPcHRpb25zLFxuICAgICAgICAgICAgICBwcml2YXRlIF9vdmVybGF5Q29udGFpbmVyOiBPdmVybGF5Q29udGFpbmVyLFxuICAgICAgICAgICAgICBwcml2YXRlIF9jb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI6IENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfcG9zaXRpb25CdWlsZGVyOiBPdmVybGF5UG9zaXRpb25CdWlsZGVyLFxuICAgICAgICAgICAgICBwcml2YXRlIF9rZXlib2FyZERpc3BhdGNoZXI6IE92ZXJsYXlLZXlib2FyZERpc3BhdGNoZXIsXG4gICAgICAgICAgICAgIHByaXZhdGUgX2luamVjdG9yOiBJbmplY3RvcixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgICAgICAgICAgIEBJbmplY3QoRE9DVU1FTlQpIHByaXZhdGUgX2RvY3VtZW50OiBhbnksXG4gICAgICAgICAgICAgIHByaXZhdGUgX2RpcmVjdGlvbmFsaXR5OiBEaXJlY3Rpb25hbGl0eSxcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfbG9jYXRpb246IExvY2F0aW9uLFxuICAgICAgICAgICAgICBwcml2YXRlIF9vdXRzaWRlQ2xpY2tEaXNwYXRjaGVyOiBPdmVybGF5T3V0c2lkZUNsaWNrRGlzcGF0Y2hlcikgeyB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gb3ZlcmxheS5cbiAgICogQHBhcmFtIGNvbmZpZyBDb25maWd1cmF0aW9uIGFwcGxpZWQgdG8gdGhlIG92ZXJsYXkuXG4gICAqIEByZXR1cm5zIFJlZmVyZW5jZSB0byB0aGUgY3JlYXRlZCBvdmVybGF5LlxuICAgKi9cbiAgY3JlYXRlKGNvbmZpZz86IE92ZXJsYXlDb25maWcpOiBPdmVybGF5UmVmIHtcbiAgICBjb25zdCBob3N0ID0gdGhpcy5fY3JlYXRlSG9zdEVsZW1lbnQoKTtcbiAgICBjb25zdCBwYW5lID0gdGhpcy5fY3JlYXRlUGFuZUVsZW1lbnQoaG9zdCk7XG4gICAgY29uc3QgcG9ydGFsT3V0bGV0ID0gdGhpcy5fY3JlYXRlUG9ydGFsT3V0bGV0KHBhbmUpO1xuICAgIGNvbnN0IG92ZXJsYXlDb25maWcgPSBuZXcgT3ZlcmxheUNvbmZpZyhjb25maWcpO1xuXG4gICAgb3ZlcmxheUNvbmZpZy5kaXJlY3Rpb24gPSBvdmVybGF5Q29uZmlnLmRpcmVjdGlvbiB8fCB0aGlzLl9kaXJlY3Rpb25hbGl0eS52YWx1ZTtcblxuICAgIHJldHVybiBuZXcgT3ZlcmxheVJlZihwb3J0YWxPdXRsZXQsIGhvc3QsIHBhbmUsIG92ZXJsYXlDb25maWcsIHRoaXMuX25nWm9uZSxcbiAgICAgIHRoaXMuX2tleWJvYXJkRGlzcGF0Y2hlciwgdGhpcy5fZG9jdW1lbnQsIHRoaXMuX2xvY2F0aW9uLCB0aGlzLl9vdXRzaWRlQ2xpY2tEaXNwYXRjaGVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgcG9zaXRpb24gYnVpbGRlciB0aGF0IGNhbiBiZSB1c2VkLCB2aWEgZmx1ZW50IEFQSSxcbiAgICogdG8gY29uc3RydWN0IGFuZCBjb25maWd1cmUgYSBwb3NpdGlvbiBzdHJhdGVneS5cbiAgICogQHJldHVybnMgQW4gb3ZlcmxheSBwb3NpdGlvbiBidWlsZGVyLlxuICAgKi9cbiAgcG9zaXRpb24oKTogT3ZlcmxheVBvc2l0aW9uQnVpbGRlciB7XG4gICAgcmV0dXJuIHRoaXMuX3Bvc2l0aW9uQnVpbGRlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIHRoZSBET00gZWxlbWVudCBmb3IgYW4gb3ZlcmxheSBhbmQgYXBwZW5kcyBpdCB0byB0aGUgb3ZlcmxheSBjb250YWluZXIuXG4gICAqIEByZXR1cm5zIE5ld2x5LWNyZWF0ZWQgcGFuZSBlbGVtZW50XG4gICAqL1xuICBwcml2YXRlIF9jcmVhdGVQYW5lRWxlbWVudChob3N0OiBIVE1MRWxlbWVudCk6IEhUTUxFbGVtZW50IHtcbiAgICBjb25zdCBwYW5lID0gdGhpcy5fZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgICBwYW5lLmlkID0gYGNkay1vdmVybGF5LSR7bmV4dFVuaXF1ZUlkKyt9YDtcbiAgICBwYW5lLmNsYXNzTGlzdC5hZGQoJ2Nkay1vdmVybGF5LXBhbmUnKTtcbiAgICBob3N0LmFwcGVuZENoaWxkKHBhbmUpO1xuXG4gICAgcmV0dXJuIHBhbmU7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyB0aGUgaG9zdCBlbGVtZW50IHRoYXQgd3JhcHMgYXJvdW5kIGFuIG92ZXJsYXlcbiAgICogYW5kIGNhbiBiZSB1c2VkIGZvciBhZHZhbmNlZCBwb3NpdGlvbmluZy5cbiAgICogQHJldHVybnMgTmV3bHktY3JlYXRlIGhvc3QgZWxlbWVudC5cbiAgICovXG4gIHByaXZhdGUgX2NyZWF0ZUhvc3RFbGVtZW50KCk6IEhUTUxFbGVtZW50IHtcbiAgICBjb25zdCBob3N0ID0gdGhpcy5fZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5fb3ZlcmxheUNvbnRhaW5lci5nZXRDb250YWluZXJFbGVtZW50KCkuYXBwZW5kQ2hpbGQoaG9zdCk7XG4gICAgcmV0dXJuIGhvc3Q7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgRG9tUG9ydGFsT3V0bGV0IGludG8gd2hpY2ggdGhlIG92ZXJsYXkgY29udGVudCBjYW4gYmUgbG9hZGVkLlxuICAgKiBAcGFyYW0gcGFuZSBUaGUgRE9NIGVsZW1lbnQgdG8gdHVybiBpbnRvIGEgcG9ydGFsIG91dGxldC5cbiAgICogQHJldHVybnMgQSBwb3J0YWwgb3V0bGV0IGZvciB0aGUgZ2l2ZW4gRE9NIGVsZW1lbnQuXG4gICAqL1xuICBwcml2YXRlIF9jcmVhdGVQb3J0YWxPdXRsZXQocGFuZTogSFRNTEVsZW1lbnQpOiBEb21Qb3J0YWxPdXRsZXQge1xuICAgIC8vIFdlIGhhdmUgdG8gcmVzb2x2ZSB0aGUgQXBwbGljYXRpb25SZWYgbGF0ZXIgaW4gb3JkZXIgdG8gYWxsb3cgcGVvcGxlXG4gICAgLy8gdG8gdXNlIG92ZXJsYXktYmFzZWQgcHJvdmlkZXJzIGR1cmluZyBhcHAgaW5pdGlhbGl6YXRpb24uXG4gICAgaWYgKCF0aGlzLl9hcHBSZWYpIHtcbiAgICAgIHRoaXMuX2FwcFJlZiA9IHRoaXMuX2luamVjdG9yLmdldDxBcHBsaWNhdGlvblJlZj4oQXBwbGljYXRpb25SZWYpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgRG9tUG9ydGFsT3V0bGV0KHBhbmUsIHRoaXMuX2NvbXBvbmVudEZhY3RvcnlSZXNvbHZlciwgdGhpcy5fYXBwUmVmLCB0aGlzLl9pbmplY3RvcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudCk7XG4gIH1cbn1cbiJdfQ==