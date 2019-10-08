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
import { ApplicationRef, ComponentFactoryResolver, Inject, Injectable, Injector, NgZone, Optional, } from '@angular/core';
import { OverlayKeyboardDispatcher } from './keyboard/overlay-keyboard-dispatcher';
import { OverlayConfig } from './overlay-config';
import { OverlayContainer } from './overlay-container';
import { OverlayRef } from './overlay-ref';
import { OverlayPositionBuilder } from './position/overlay-position-builder';
import { ScrollStrategyOptions } from './scroll/index';
/** Next overlay unique ID. */
var nextUniqueId = 0;
// Note that Overlay is *not* scoped to the app root because the of the ComponentFactoryResolver
// which needs to be different depending on where OverlayModule is imported.
/**
 * Service to create Overlays. Overlays are dynamically added pieces of floating UI, meant to be
 * used as a low-level building block for other components. Dialogs, tooltips, menus,
 * selects, etc. can all be built using overlays. The service should primarily be used by authors
 * of re-usable components rather than developers building end-user applications.
 *
 * An overlay *is* a PortalOutlet, so any kind of Portal can be loaded into one.
 */
var Overlay = /** @class */ (function () {
    function Overlay(
    /** Scrolling strategies that can be used when creating an overlay. */
    scrollStrategies, _overlayContainer, _componentFactoryResolver, _positionBuilder, _keyboardDispatcher, _injector, _ngZone, _document, _directionality, 
    // @breaking-change 8.0.0 `_location` parameter to be made required.
    _location) {
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
    }
    /**
     * Creates an overlay.
     * @param config Configuration applied to the overlay.
     * @returns Reference to the created overlay.
     */
    Overlay.prototype.create = function (config) {
        var host = this._createHostElement();
        var pane = this._createPaneElement(host);
        var portalOutlet = this._createPortalOutlet(pane);
        var overlayConfig = new OverlayConfig(config);
        overlayConfig.direction = overlayConfig.direction || this._directionality.value;
        return new OverlayRef(portalOutlet, host, pane, overlayConfig, this._ngZone, this._keyboardDispatcher, this._document, this._location);
    };
    /**
     * Gets a position builder that can be used, via fluent API,
     * to construct and configure a position strategy.
     * @returns An overlay position builder.
     */
    Overlay.prototype.position = function () {
        return this._positionBuilder;
    };
    /**
     * Creates the DOM element for an overlay and appends it to the overlay container.
     * @returns Newly-created pane element
     */
    Overlay.prototype._createPaneElement = function (host) {
        var pane = this._document.createElement('div');
        pane.id = "cdk-overlay-" + nextUniqueId++;
        pane.classList.add('cdk-overlay-pane');
        host.appendChild(pane);
        return pane;
    };
    /**
     * Creates the host element that wraps around an overlay
     * and can be used for advanced positioning.
     * @returns Newly-create host element.
     */
    Overlay.prototype._createHostElement = function () {
        var host = this._document.createElement('div');
        this._overlayContainer.getContainerElement().appendChild(host);
        return host;
    };
    /**
     * Create a DomPortalOutlet into which the overlay content can be loaded.
     * @param pane The DOM element to turn into a portal outlet.
     * @returns A portal outlet for the given DOM element.
     */
    Overlay.prototype._createPortalOutlet = function (pane) {
        // We have to resolve the ApplicationRef later in order to allow people
        // to use overlay-based providers during app initialization.
        if (!this._appRef) {
            this._appRef = this._injector.get(ApplicationRef);
        }
        return new DomPortalOutlet(pane, this._componentFactoryResolver, this._appRef, this._injector);
    };
    Overlay.decorators = [
        { type: Injectable }
    ];
    /** @nocollapse */
    Overlay.ctorParameters = function () { return [
        { type: ScrollStrategyOptions },
        { type: OverlayContainer },
        { type: ComponentFactoryResolver },
        { type: OverlayPositionBuilder },
        { type: OverlayKeyboardDispatcher },
        { type: Injector },
        { type: NgZone },
        { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] },
        { type: Directionality },
        { type: Location, decorators: [{ type: Optional }] }
    ]; };
    return Overlay;
}());
export { Overlay };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvb3ZlcmxheS9vdmVybGF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUNuRCxPQUFPLEVBQ0wsY0FBYyxFQUNkLHdCQUF3QixFQUN4QixNQUFNLEVBQ04sVUFBVSxFQUNWLFFBQVEsRUFDUixNQUFNLEVBQ04sUUFBUSxHQUNULE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLHdDQUF3QyxDQUFDO0FBQ2pGLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUMvQyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3pDLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLHFDQUFxQyxDQUFDO0FBQzNFLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBR3JELDhCQUE4QjtBQUM5QixJQUFJLFlBQVksR0FBRyxDQUFDLENBQUM7QUFFckIsZ0dBQWdHO0FBQ2hHLDRFQUE0RTtBQUU1RTs7Ozs7OztHQU9HO0FBQ0g7SUFJRTtJQUNZLHNFQUFzRTtJQUMvRCxnQkFBdUMsRUFDdEMsaUJBQW1DLEVBQ25DLHlCQUFtRCxFQUNuRCxnQkFBd0MsRUFDeEMsbUJBQThDLEVBQzlDLFNBQW1CLEVBQ25CLE9BQWUsRUFDRyxTQUFjLEVBQ2hDLGVBQStCO0lBQ3ZDLG9FQUFvRTtJQUNo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LFFBQVEsdUJBZ0RYLFFBQVE7O0lBbUV2QixjQUFDO0NBQUEsQUFuRkQsSUFtRkM7U0FsRlksT0FBTyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge0RvbVBvcnRhbE91dGxldH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BvcnRhbCc7XG5pbXBvcnQge0RPQ1VNRU5ULCBMb2NhdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7XG4gIEFwcGxpY2F0aW9uUmVmLFxuICBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsXG4gIEluamVjdCxcbiAgSW5qZWN0YWJsZSxcbiAgSW5qZWN0b3IsXG4gIE5nWm9uZSxcbiAgT3B0aW9uYWwsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtPdmVybGF5S2V5Ym9hcmREaXNwYXRjaGVyfSBmcm9tICcuL2tleWJvYXJkL292ZXJsYXkta2V5Ym9hcmQtZGlzcGF0Y2hlcic7XG5pbXBvcnQge092ZXJsYXlDb25maWd9IGZyb20gJy4vb3ZlcmxheS1jb25maWcnO1xuaW1wb3J0IHtPdmVybGF5Q29udGFpbmVyfSBmcm9tICcuL292ZXJsYXktY29udGFpbmVyJztcbmltcG9ydCB7T3ZlcmxheVJlZn0gZnJvbSAnLi9vdmVybGF5LXJlZic7XG5pbXBvcnQge092ZXJsYXlQb3NpdGlvbkJ1aWxkZXJ9IGZyb20gJy4vcG9zaXRpb24vb3ZlcmxheS1wb3NpdGlvbi1idWlsZGVyJztcbmltcG9ydCB7U2Nyb2xsU3RyYXRlZ3lPcHRpb25zfSBmcm9tICcuL3Njcm9sbC9pbmRleCc7XG5cblxuLyoqIE5leHQgb3ZlcmxheSB1bmlxdWUgSUQuICovXG5sZXQgbmV4dFVuaXF1ZUlkID0gMDtcblxuLy8gTm90ZSB0aGF0IE92ZXJsYXkgaXMgKm5vdCogc2NvcGVkIHRvIHRoZSBhcHAgcm9vdCBiZWNhdXNlIHRoZSBvZiB0aGUgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyXG4vLyB3aGljaCBuZWVkcyB0byBiZSBkaWZmZXJlbnQgZGVwZW5kaW5nIG9uIHdoZXJlIE92ZXJsYXlNb2R1bGUgaXMgaW1wb3J0ZWQuXG5cbi8qKlxuICogU2VydmljZSB0byBjcmVhdGUgT3ZlcmxheXMuIE92ZXJsYXlzIGFyZSBkeW5hbWljYWxseSBhZGRlZCBwaWVjZXMgb2YgZmxvYXRpbmcgVUksIG1lYW50IHRvIGJlXG4gKiB1c2VkIGFzIGEgbG93LWxldmVsIGJ1aWxkaW5nIGJsb2NrIGZvciBvdGhlciBjb21wb25lbnRzLiBEaWFsb2dzLCB0b29sdGlwcywgbWVudXMsXG4gKiBzZWxlY3RzLCBldGMuIGNhbiBhbGwgYmUgYnVpbHQgdXNpbmcgb3ZlcmxheXMuIFRoZSBzZXJ2aWNlIHNob3VsZCBwcmltYXJpbHkgYmUgdXNlZCBieSBhdXRob3JzXG4gKiBvZiByZS11c2FibGUgY29tcG9uZW50cyByYXRoZXIgdGhhbiBkZXZlbG9wZXJzIGJ1aWxkaW5nIGVuZC11c2VyIGFwcGxpY2F0aW9ucy5cbiAqXG4gKiBBbiBvdmVybGF5ICppcyogYSBQb3J0YWxPdXRsZXQsIHNvIGFueSBraW5kIG9mIFBvcnRhbCBjYW4gYmUgbG9hZGVkIGludG8gb25lLlxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgT3ZlcmxheSB7XG4gIHByaXZhdGUgX2FwcFJlZjogQXBwbGljYXRpb25SZWY7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICAgICAgICAgIC8qKiBTY3JvbGxpbmcgc3RyYXRlZ2llcyB0aGF0IGNhbiBiZSB1c2VkIHdoZW4gY3JlYXRpbmcgYW4gb3ZlcmxheS4gKi9cbiAgICAgICAgICAgICAgcHVibGljIHNjcm9sbFN0cmF0ZWdpZXM6IFNjcm9sbFN0cmF0ZWd5T3B0aW9ucyxcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfb3ZlcmxheUNvbnRhaW5lcjogT3ZlcmxheUNvbnRhaW5lcixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfY29tcG9uZW50RmFjdG9yeVJlc29sdmVyOiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsXG4gICAgICAgICAgICAgIHByaXZhdGUgX3Bvc2l0aW9uQnVpbGRlcjogT3ZlcmxheVBvc2l0aW9uQnVpbGRlcixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfa2V5Ym9hcmREaXNwYXRjaGVyOiBPdmVybGF5S2V5Ym9hcmREaXNwYXRjaGVyLFxuICAgICAgICAgICAgICBwcml2YXRlIF9pbmplY3RvcjogSW5qZWN0b3IsXG4gICAgICAgICAgICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgICAgICAgICAgICBASW5qZWN0KERPQ1VNRU5UKSBwcml2YXRlIF9kb2N1bWVudDogYW55LFxuICAgICAgICAgICAgICBwcml2YXRlIF9kaXJlY3Rpb25hbGl0eTogRGlyZWN0aW9uYWxpdHksXG4gICAgICAgICAgICAgIC8vIEBicmVha2luZy1jaGFuZ2UgOC4wLjAgYF9sb2NhdGlvbmAgcGFyYW1ldGVyIHRvIGJlIG1hZGUgcmVxdWlyZWQuXG4gICAgICAgICAgICAgIEBPcHRpb25hbCgpIHByaXZhdGUgX2xvY2F0aW9uPzogTG9jYXRpb24pIHsgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIG92ZXJsYXkuXG4gICAqIEBwYXJhbSBjb25maWcgQ29uZmlndXJhdGlvbiBhcHBsaWVkIHRvIHRoZSBvdmVybGF5LlxuICAgKiBAcmV0dXJucyBSZWZlcmVuY2UgdG8gdGhlIGNyZWF0ZWQgb3ZlcmxheS5cbiAgICovXG4gIGNyZWF0ZShjb25maWc/OiBPdmVybGF5Q29uZmlnKTogT3ZlcmxheVJlZiB7XG4gICAgY29uc3QgaG9zdCA9IHRoaXMuX2NyZWF0ZUhvc3RFbGVtZW50KCk7XG4gICAgY29uc3QgcGFuZSA9IHRoaXMuX2NyZWF0ZVBhbmVFbGVtZW50KGhvc3QpO1xuICAgIGNvbnN0IHBvcnRhbE91dGxldCA9IHRoaXMuX2NyZWF0ZVBvcnRhbE91dGxldChwYW5lKTtcbiAgICBjb25zdCBvdmVybGF5Q29uZmlnID0gbmV3IE92ZXJsYXlDb25maWcoY29uZmlnKTtcblxuICAgIG92ZXJsYXlDb25maWcuZGlyZWN0aW9uID0gb3ZlcmxheUNvbmZpZy5kaXJlY3Rpb24gfHwgdGhpcy5fZGlyZWN0aW9uYWxpdHkudmFsdWU7XG5cbiAgICByZXR1cm4gbmV3IE92ZXJsYXlSZWYocG9ydGFsT3V0bGV0LCBob3N0LCBwYW5lLCBvdmVybGF5Q29uZmlnLCB0aGlzLl9uZ1pvbmUsXG4gICAgICB0aGlzLl9rZXlib2FyZERpc3BhdGNoZXIsIHRoaXMuX2RvY3VtZW50LCB0aGlzLl9sb2NhdGlvbik7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIHBvc2l0aW9uIGJ1aWxkZXIgdGhhdCBjYW4gYmUgdXNlZCwgdmlhIGZsdWVudCBBUEksXG4gICAqIHRvIGNvbnN0cnVjdCBhbmQgY29uZmlndXJlIGEgcG9zaXRpb24gc3RyYXRlZ3kuXG4gICAqIEByZXR1cm5zIEFuIG92ZXJsYXkgcG9zaXRpb24gYnVpbGRlci5cbiAgICovXG4gIHBvc2l0aW9uKCk6IE92ZXJsYXlQb3NpdGlvbkJ1aWxkZXIge1xuICAgIHJldHVybiB0aGlzLl9wb3NpdGlvbkJ1aWxkZXI7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyB0aGUgRE9NIGVsZW1lbnQgZm9yIGFuIG92ZXJsYXkgYW5kIGFwcGVuZHMgaXQgdG8gdGhlIG92ZXJsYXkgY29udGFpbmVyLlxuICAgKiBAcmV0dXJucyBOZXdseS1jcmVhdGVkIHBhbmUgZWxlbWVudFxuICAgKi9cbiAgcHJpdmF0ZSBfY3JlYXRlUGFuZUVsZW1lbnQoaG9zdDogSFRNTEVsZW1lbnQpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3QgcGFuZSA9IHRoaXMuX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gICAgcGFuZS5pZCA9IGBjZGstb3ZlcmxheS0ke25leHRVbmlxdWVJZCsrfWA7XG4gICAgcGFuZS5jbGFzc0xpc3QuYWRkKCdjZGstb3ZlcmxheS1wYW5lJyk7XG4gICAgaG9zdC5hcHBlbmRDaGlsZChwYW5lKTtcblxuICAgIHJldHVybiBwYW5lO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgdGhlIGhvc3QgZWxlbWVudCB0aGF0IHdyYXBzIGFyb3VuZCBhbiBvdmVybGF5XG4gICAqIGFuZCBjYW4gYmUgdXNlZCBmb3IgYWR2YW5jZWQgcG9zaXRpb25pbmcuXG4gICAqIEByZXR1cm5zIE5ld2x5LWNyZWF0ZSBob3N0IGVsZW1lbnQuXG4gICAqL1xuICBwcml2YXRlIF9jcmVhdGVIb3N0RWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3QgaG9zdCA9IHRoaXMuX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuX292ZXJsYXlDb250YWluZXIuZ2V0Q29udGFpbmVyRWxlbWVudCgpLmFwcGVuZENoaWxkKGhvc3QpO1xuICAgIHJldHVybiBob3N0O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIERvbVBvcnRhbE91dGxldCBpbnRvIHdoaWNoIHRoZSBvdmVybGF5IGNvbnRlbnQgY2FuIGJlIGxvYWRlZC5cbiAgICogQHBhcmFtIHBhbmUgVGhlIERPTSBlbGVtZW50IHRvIHR1cm4gaW50byBhIHBvcnRhbCBvdXRsZXQuXG4gICAqIEByZXR1cm5zIEEgcG9ydGFsIG91dGxldCBmb3IgdGhlIGdpdmVuIERPTSBlbGVtZW50LlxuICAgKi9cbiAgcHJpdmF0ZSBfY3JlYXRlUG9ydGFsT3V0bGV0KHBhbmU6IEhUTUxFbGVtZW50KTogRG9tUG9ydGFsT3V0bGV0IHtcbiAgICAvLyBXZSBoYXZlIHRvIHJlc29sdmUgdGhlIEFwcGxpY2F0aW9uUmVmIGxhdGVyIGluIG9yZGVyIHRvIGFsbG93IHBlb3BsZVxuICAgIC8vIHRvIHVzZSBvdmVybGF5LWJhc2VkIHByb3ZpZGVycyBkdXJpbmcgYXBwIGluaXRpYWxpemF0aW9uLlxuICAgIGlmICghdGhpcy5fYXBwUmVmKSB7XG4gICAgICB0aGlzLl9hcHBSZWYgPSB0aGlzLl9pbmplY3Rvci5nZXQ8QXBwbGljYXRpb25SZWY+KEFwcGxpY2F0aW9uUmVmKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IERvbVBvcnRhbE91dGxldChwYW5lLCB0aGlzLl9jb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsIHRoaXMuX2FwcFJlZiwgdGhpcy5faW5qZWN0b3IpO1xuICB9XG59XG4iXX0=