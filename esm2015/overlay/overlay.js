/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __decorate, __metadata, __param } from "tslib";
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
let Overlay = /** @class */ (() => {
    let Overlay = class Overlay {
        constructor(
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
        create(config) {
            const host = this._createHostElement();
            const pane = this._createPaneElement(host);
            const portalOutlet = this._createPortalOutlet(pane);
            const overlayConfig = new OverlayConfig(config);
            overlayConfig.direction = overlayConfig.direction || this._directionality.value;
            return new OverlayRef(portalOutlet, host, pane, overlayConfig, this._ngZone, this._keyboardDispatcher, this._document, this._location);
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
    };
    Overlay = __decorate([
        Injectable(),
        __param(7, Inject(DOCUMENT)),
        __param(9, Optional()),
        __metadata("design:paramtypes", [ScrollStrategyOptions,
            OverlayContainer,
            ComponentFactoryResolver,
            OverlayPositionBuilder,
            OverlayKeyboardDispatcher,
            Injector,
            NgZone, Object, Directionality,
            Location])
    ], Overlay);
    return Overlay;
})();
export { Overlay };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvb3ZlcmxheS9vdmVybGF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxRQUFRLEVBQUUsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDbkQsT0FBTyxFQUNMLGNBQWMsRUFDZCx3QkFBd0IsRUFDeEIsTUFBTSxFQUNOLFVBQVUsRUFDVixRQUFRLEVBQ1IsTUFBTSxFQUNOLFFBQVEsR0FDVCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSx3Q0FBd0MsQ0FBQztBQUNqRixPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDL0MsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDckQsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN6QyxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxxQ0FBcUMsQ0FBQztBQUMzRSxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUdyRCw4QkFBOEI7QUFDOUIsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDO0FBRXJCLDRGQUE0RjtBQUM1Riw0RUFBNEU7QUFFNUU7Ozs7Ozs7R0FPRztBQUVIO0lBQUEsSUFBYSxPQUFPLEdBQXBCLE1BQWEsT0FBTztRQUdsQjtRQUNZLHNFQUFzRTtRQUMvRCxnQkFBdUMsRUFDdEMsaUJBQW1DLEVBQ25DLHlCQUFtRCxFQUNuRCxnQkFBd0MsRUFDeEMsbUJBQThDLEVBQzlDLFNBQW1CLEVBQ25CLE9BQWUsRUFDRyxTQUFjLEVBQ2hDLGVB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d0I7WUFDakMsc0JBQXNCO1lBQ25CLHlCQUF5QjtZQUNuQyxRQUFRO1lBQ1YsTUFBTSxVQUVFLGNBQWM7WUFFUCxRQUFRO09BZnpDLE9BQU8sQ0FtRm5CO0lBQUQsY0FBQztLQUFBO1NBbkZZLE9BQU8iLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtEb21Qb3J0YWxPdXRsZXR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wb3J0YWwnO1xuaW1wb3J0IHtET0NVTUVOVCwgTG9jYXRpb259IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge1xuICBBcHBsaWNhdGlvblJlZixcbiAgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLFxuICBJbmplY3QsXG4gIEluamVjdGFibGUsXG4gIEluamVjdG9yLFxuICBOZ1pvbmUsXG4gIE9wdGlvbmFsLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T3ZlcmxheUtleWJvYXJkRGlzcGF0Y2hlcn0gZnJvbSAnLi9rZXlib2FyZC9vdmVybGF5LWtleWJvYXJkLWRpc3BhdGNoZXInO1xuaW1wb3J0IHtPdmVybGF5Q29uZmlnfSBmcm9tICcuL292ZXJsYXktY29uZmlnJztcbmltcG9ydCB7T3ZlcmxheUNvbnRhaW5lcn0gZnJvbSAnLi9vdmVybGF5LWNvbnRhaW5lcic7XG5pbXBvcnQge092ZXJsYXlSZWZ9IGZyb20gJy4vb3ZlcmxheS1yZWYnO1xuaW1wb3J0IHtPdmVybGF5UG9zaXRpb25CdWlsZGVyfSBmcm9tICcuL3Bvc2l0aW9uL292ZXJsYXktcG9zaXRpb24tYnVpbGRlcic7XG5pbXBvcnQge1Njcm9sbFN0cmF0ZWd5T3B0aW9uc30gZnJvbSAnLi9zY3JvbGwvaW5kZXgnO1xuXG5cbi8qKiBOZXh0IG92ZXJsYXkgdW5pcXVlIElELiAqL1xubGV0IG5leHRVbmlxdWVJZCA9IDA7XG5cbi8vIE5vdGUgdGhhdCBPdmVybGF5IGlzICpub3QqIHNjb3BlZCB0byB0aGUgYXBwIHJvb3QgYmVjYXVzZSBvZiB0aGUgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyXG4vLyB3aGljaCBuZWVkcyB0byBiZSBkaWZmZXJlbnQgZGVwZW5kaW5nIG9uIHdoZXJlIE92ZXJsYXlNb2R1bGUgaXMgaW1wb3J0ZWQuXG5cbi8qKlxuICogU2VydmljZSB0byBjcmVhdGUgT3ZlcmxheXMuIE92ZXJsYXlzIGFyZSBkeW5hbWljYWxseSBhZGRlZCBwaWVjZXMgb2YgZmxvYXRpbmcgVUksIG1lYW50IHRvIGJlXG4gKiB1c2VkIGFzIGEgbG93LWxldmVsIGJ1aWxkaW5nIGJsb2NrIGZvciBvdGhlciBjb21wb25lbnRzLiBEaWFsb2dzLCB0b29sdGlwcywgbWVudXMsXG4gKiBzZWxlY3RzLCBldGMuIGNhbiBhbGwgYmUgYnVpbHQgdXNpbmcgb3ZlcmxheXMuIFRoZSBzZXJ2aWNlIHNob3VsZCBwcmltYXJpbHkgYmUgdXNlZCBieSBhdXRob3JzXG4gKiBvZiByZS11c2FibGUgY29tcG9uZW50cyByYXRoZXIgdGhhbiBkZXZlbG9wZXJzIGJ1aWxkaW5nIGVuZC11c2VyIGFwcGxpY2F0aW9ucy5cbiAqXG4gKiBBbiBvdmVybGF5ICppcyogYSBQb3J0YWxPdXRsZXQsIHNvIGFueSBraW5kIG9mIFBvcnRhbCBjYW4gYmUgbG9hZGVkIGludG8gb25lLlxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgT3ZlcmxheSB7XG4gIHByaXZhdGUgX2FwcFJlZjogQXBwbGljYXRpb25SZWY7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICAgICAgICAgIC8qKiBTY3JvbGxpbmcgc3RyYXRlZ2llcyB0aGF0IGNhbiBiZSB1c2VkIHdoZW4gY3JlYXRpbmcgYW4gb3ZlcmxheS4gKi9cbiAgICAgICAgICAgICAgcHVibGljIHNjcm9sbFN0cmF0ZWdpZXM6IFNjcm9sbFN0cmF0ZWd5T3B0aW9ucyxcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfb3ZlcmxheUNvbnRhaW5lcjogT3ZlcmxheUNvbnRhaW5lcixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfY29tcG9uZW50RmFjdG9yeVJlc29sdmVyOiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsXG4gICAgICAgICAgICAgIHByaXZhdGUgX3Bvc2l0aW9uQnVpbGRlcjogT3ZlcmxheVBvc2l0aW9uQnVpbGRlcixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfa2V5Ym9hcmREaXNwYXRjaGVyOiBPdmVybGF5S2V5Ym9hcmREaXNwYXRjaGVyLFxuICAgICAgICAgICAgICBwcml2YXRlIF9pbmplY3RvcjogSW5qZWN0b3IsXG4gICAgICAgICAgICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgICAgICAgICAgICBASW5qZWN0KERPQ1VNRU5UKSBwcml2YXRlIF9kb2N1bWVudDogYW55LFxuICAgICAgICAgICAgICBwcml2YXRlIF9kaXJlY3Rpb25hbGl0eTogRGlyZWN0aW9uYWxpdHksXG4gICAgICAgICAgICAgIC8vIEBicmVha2luZy1jaGFuZ2UgOC4wLjAgYF9sb2NhdGlvbmAgcGFyYW1ldGVyIHRvIGJlIG1hZGUgcmVxdWlyZWQuXG4gICAgICAgICAgICAgIEBPcHRpb25hbCgpIHByaXZhdGUgX2xvY2F0aW9uPzogTG9jYXRpb24pIHsgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIG92ZXJsYXkuXG4gICAqIEBwYXJhbSBjb25maWcgQ29uZmlndXJhdGlvbiBhcHBsaWVkIHRvIHRoZSBvdmVybGF5LlxuICAgKiBAcmV0dXJucyBSZWZlcmVuY2UgdG8gdGhlIGNyZWF0ZWQgb3ZlcmxheS5cbiAgICovXG4gIGNyZWF0ZShjb25maWc/OiBPdmVybGF5Q29uZmlnKTogT3ZlcmxheVJlZiB7XG4gICAgY29uc3QgaG9zdCA9IHRoaXMuX2NyZWF0ZUhvc3RFbGVtZW50KCk7XG4gICAgY29uc3QgcGFuZSA9IHRoaXMuX2NyZWF0ZVBhbmVFbGVtZW50KGhvc3QpO1xuICAgIGNvbnN0IHBvcnRhbE91dGxldCA9IHRoaXMuX2NyZWF0ZVBvcnRhbE91dGxldChwYW5lKTtcbiAgICBjb25zdCBvdmVybGF5Q29uZmlnID0gbmV3IE92ZXJsYXlDb25maWcoY29uZmlnKTtcblxuICAgIG92ZXJsYXlDb25maWcuZGlyZWN0aW9uID0gb3ZlcmxheUNvbmZpZy5kaXJlY3Rpb24gfHwgdGhpcy5fZGlyZWN0aW9uYWxpdHkudmFsdWU7XG5cbiAgICByZXR1cm4gbmV3IE92ZXJsYXlSZWYocG9ydGFsT3V0bGV0LCBob3N0LCBwYW5lLCBvdmVybGF5Q29uZmlnLCB0aGlzLl9uZ1pvbmUsXG4gICAgICB0aGlzLl9rZXlib2FyZERpc3BhdGNoZXIsIHRoaXMuX2RvY3VtZW50LCB0aGlzLl9sb2NhdGlvbik7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIHBvc2l0aW9uIGJ1aWxkZXIgdGhhdCBjYW4gYmUgdXNlZCwgdmlhIGZsdWVudCBBUEksXG4gICAqIHRvIGNvbnN0cnVjdCBhbmQgY29uZmlndXJlIGEgcG9zaXRpb24gc3RyYXRlZ3kuXG4gICAqIEByZXR1cm5zIEFuIG92ZXJsYXkgcG9zaXRpb24gYnVpbGRlci5cbiAgICovXG4gIHBvc2l0aW9uKCk6IE92ZXJsYXlQb3NpdGlvbkJ1aWxkZXIge1xuICAgIHJldHVybiB0aGlzLl9wb3NpdGlvbkJ1aWxkZXI7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyB0aGUgRE9NIGVsZW1lbnQgZm9yIGFuIG92ZXJsYXkgYW5kIGFwcGVuZHMgaXQgdG8gdGhlIG92ZXJsYXkgY29udGFpbmVyLlxuICAgKiBAcmV0dXJucyBOZXdseS1jcmVhdGVkIHBhbmUgZWxlbWVudFxuICAgKi9cbiAgcHJpdmF0ZSBfY3JlYXRlUGFuZUVsZW1lbnQoaG9zdDogSFRNTEVsZW1lbnQpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3QgcGFuZSA9IHRoaXMuX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gICAgcGFuZS5pZCA9IGBjZGstb3ZlcmxheS0ke25leHRVbmlxdWVJZCsrfWA7XG4gICAgcGFuZS5jbGFzc0xpc3QuYWRkKCdjZGstb3ZlcmxheS1wYW5lJyk7XG4gICAgaG9zdC5hcHBlbmRDaGlsZChwYW5lKTtcblxuICAgIHJldHVybiBwYW5lO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgdGhlIGhvc3QgZWxlbWVudCB0aGF0IHdyYXBzIGFyb3VuZCBhbiBvdmVybGF5XG4gICAqIGFuZCBjYW4gYmUgdXNlZCBmb3IgYWR2YW5jZWQgcG9zaXRpb25pbmcuXG4gICAqIEByZXR1cm5zIE5ld2x5LWNyZWF0ZSBob3N0IGVsZW1lbnQuXG4gICAqL1xuICBwcml2YXRlIF9jcmVhdGVIb3N0RWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3QgaG9zdCA9IHRoaXMuX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuX292ZXJsYXlDb250YWluZXIuZ2V0Q29udGFpbmVyRWxlbWVudCgpLmFwcGVuZENoaWxkKGhvc3QpO1xuICAgIHJldHVybiBob3N0O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIERvbVBvcnRhbE91dGxldCBpbnRvIHdoaWNoIHRoZSBvdmVybGF5IGNvbnRlbnQgY2FuIGJlIGxvYWRlZC5cbiAgICogQHBhcmFtIHBhbmUgVGhlIERPTSBlbGVtZW50IHRvIHR1cm4gaW50byBhIHBvcnRhbCBvdXRsZXQuXG4gICAqIEByZXR1cm5zIEEgcG9ydGFsIG91dGxldCBmb3IgdGhlIGdpdmVuIERPTSBlbGVtZW50LlxuICAgKi9cbiAgcHJpdmF0ZSBfY3JlYXRlUG9ydGFsT3V0bGV0KHBhbmU6IEhUTUxFbGVtZW50KTogRG9tUG9ydGFsT3V0bGV0IHtcbiAgICAvLyBXZSBoYXZlIHRvIHJlc29sdmUgdGhlIEFwcGxpY2F0aW9uUmVmIGxhdGVyIGluIG9yZGVyIHRvIGFsbG93IHBlb3BsZVxuICAgIC8vIHRvIHVzZSBvdmVybGF5LWJhc2VkIHByb3ZpZGVycyBkdXJpbmcgYXBwIGluaXRpYWxpemF0aW9uLlxuICAgIGlmICghdGhpcy5fYXBwUmVmKSB7XG4gICAgICB0aGlzLl9hcHBSZWYgPSB0aGlzLl9pbmplY3Rvci5nZXQ8QXBwbGljYXRpb25SZWY+KEFwcGxpY2F0aW9uUmVmKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IERvbVBvcnRhbE91dGxldChwYW5lLCB0aGlzLl9jb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsIHRoaXMuX2FwcFJlZiwgdGhpcy5faW5qZWN0b3IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnQpO1xuICB9XG59XG4iXX0=