/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
/**
 * Next overlay unique ID.
 * @type {?}
 */
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
    /**
     * @param {?} scrollStrategies
     * @param {?} _overlayContainer
     * @param {?} _componentFactoryResolver
     * @param {?} _positionBuilder
     * @param {?} _keyboardDispatcher
     * @param {?} _injector
     * @param {?} _ngZone
     * @param {?} _document
     * @param {?} _directionality
     * @param {?=} _location
     */
    constructor(scrollStrategies, _overlayContainer, _componentFactoryResolver, _positionBuilder, _keyboardDispatcher, _injector, _ngZone, _document, _directionality, _location) {
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
     * @param {?=} config Configuration applied to the overlay.
     * @return {?} Reference to the created overlay.
     */
    create(config) {
        /** @type {?} */
        const host = this._createHostElement();
        /** @type {?} */
        const pane = this._createPaneElement(host);
        /** @type {?} */
        const portalOutlet = this._createPortalOutlet(pane);
        /** @type {?} */
        const overlayConfig = new OverlayConfig(config);
        overlayConfig.direction = overlayConfig.direction || this._directionality.value;
        return new OverlayRef(portalOutlet, host, pane, overlayConfig, this._ngZone, this._keyboardDispatcher, this._document, this._location);
    }
    /**
     * Gets a position builder that can be used, via fluent API,
     * to construct and configure a position strategy.
     * @return {?} An overlay position builder.
     */
    position() {
        return this._positionBuilder;
    }
    /**
     * Creates the DOM element for an overlay and appends it to the overlay container.
     * @private
     * @param {?} host
     * @return {?} Newly-created pane element
     */
    _createPaneElement(host) {
        /** @type {?} */
        const pane = this._document.createElement('div');
        pane.id = `cdk-overlay-${nextUniqueId++}`;
        pane.classList.add('cdk-overlay-pane');
        host.appendChild(pane);
        return pane;
    }
    /**
     * Creates the host element that wraps around an overlay
     * and can be used for advanced positioning.
     * @private
     * @return {?} Newly-create host element.
     */
    _createHostElement() {
        /** @type {?} */
        const host = this._document.createElement('div');
        this._overlayContainer.getContainerElement().appendChild(host);
        return host;
    }
    /**
     * Create a DomPortalOutlet into which the overlay content can be loaded.
     * @private
     * @param {?} pane The DOM element to turn into a portal outlet.
     * @return {?} A portal outlet for the given DOM element.
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
Overlay.decorators = [
    { type: Injectable }
];
/** @nocollapse */
Overlay.ctorParameters = () => [
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
];
if (false) {
    /**
     * @type {?}
     * @private
     */
    Overlay.prototype._appRef;
    /**
     * Scrolling strategies that can be used when creating an overlay.
     * @type {?}
     */
    Overlay.prototype.scrollStrategies;
    /**
     * @type {?}
     * @private
     */
    Overlay.prototype._overlayContainer;
    /**
     * @type {?}
     * @private
     */
    Overlay.prototype._componentFactoryResolver;
    /**
     * @type {?}
     * @private
     */
    Overlay.prototype._positionBuilder;
    /**
     * @type {?}
     * @private
     */
    Overlay.prototype._keyboardDispatcher;
    /**
     * @type {?}
     * @private
     */
    Overlay.prototype._injector;
    /**
     * @type {?}
     * @private
     */
    Overlay.prototype._ngZone;
    /**
     * @type {?}
     * @private
     */
    Overlay.prototype._document;
    /**
     * @type {?}
     * @private
     */
    Overlay.prototype._directionality;
    /**
     * @type {?}
     * @private
     */
    Overlay.prototype._location;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvb3ZlcmxheS9vdmVybGF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsUUFBUSxFQUFFLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ25ELE9BQU8sRUFDTCxjQUFjLEVBQ2Qsd0JBQXdCLEVBQ3hCLE1BQU0sRUFDTixVQUFVLEVBQ1YsUUFBUSxFQUNSLE1BQU0sRUFDTixRQUFRLEdBQ1QsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sd0NBQXdDLENBQUM7QUFDakYsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDekMsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0scUNBQXFDLENBQUM7QUFDM0UsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7Ozs7O0lBSWpELFlBQVksR0FBRyxDQUFDOzs7Ozs7Ozs7OztBQWNwQixNQUFNLE9BQU8sT0FBTzs7Ozs7Ozs7Ozs7OztJQUdsQixZQUVtQixnQkFBdUMsRUFDdEMsaUJBQW1DLEVBQ25DLHlCQUFtRCxFQUNuRCxnQkFBd0MsRUFDeEMsbUJBQThDLEVBQzlDLFNBQW1CLEVBQ25CLE9BQWUsRUFDRyxTQUFjLEVBQ2hDLGVBQStCLEVBRW5CLFNBQW9CO1FBVmpDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBdUI7UUFDdEMsc0JBQWlCLEdBQWpCLGlCQUFp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QXdDOzs7OztJQUN4QyxrQ0FBdUM7Ozs7O0lBRXZDLDRCQUF3QyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge0RvbVBvcnRhbE91dGxldH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BvcnRhbCc7XG5pbXBvcnQge0RPQ1VNRU5ULCBMb2NhdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7XG4gIEFwcGxpY2F0aW9uUmVmLFxuICBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsXG4gIEluamVjdCxcbiAgSW5qZWN0YWJsZSxcbiAgSW5qZWN0b3IsXG4gIE5nWm9uZSxcbiAgT3B0aW9uYWwsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtPdmVybGF5S2V5Ym9hcmREaXNwYXRjaGVyfSBmcm9tICcuL2tleWJvYXJkL292ZXJsYXkta2V5Ym9hcmQtZGlzcGF0Y2hlcic7XG5pbXBvcnQge092ZXJsYXlDb25maWd9IGZyb20gJy4vb3ZlcmxheS1jb25maWcnO1xuaW1wb3J0IHtPdmVybGF5Q29udGFpbmVyfSBmcm9tICcuL292ZXJsYXktY29udGFpbmVyJztcbmltcG9ydCB7T3ZlcmxheVJlZn0gZnJvbSAnLi9vdmVybGF5LXJlZic7XG5pbXBvcnQge092ZXJsYXlQb3NpdGlvbkJ1aWxkZXJ9IGZyb20gJy4vcG9zaXRpb24vb3ZlcmxheS1wb3NpdGlvbi1idWlsZGVyJztcbmltcG9ydCB7U2Nyb2xsU3RyYXRlZ3lPcHRpb25zfSBmcm9tICcuL3Njcm9sbC9pbmRleCc7XG5cblxuLyoqIE5leHQgb3ZlcmxheSB1bmlxdWUgSUQuICovXG5sZXQgbmV4dFVuaXF1ZUlkID0gMDtcblxuLy8gTm90ZSB0aGF0IE92ZXJsYXkgaXMgKm5vdCogc2NvcGVkIHRvIHRoZSBhcHAgcm9vdCBiZWNhdXNlIG9mIHRoZSBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXJcbi8vIHdoaWNoIG5lZWRzIHRvIGJlIGRpZmZlcmVudCBkZXBlbmRpbmcgb24gd2hlcmUgT3ZlcmxheU1vZHVsZSBpcyBpbXBvcnRlZC5cblxuLyoqXG4gKiBTZXJ2aWNlIHRvIGNyZWF0ZSBPdmVybGF5cy4gT3ZlcmxheXMgYXJlIGR5bmFtaWNhbGx5IGFkZGVkIHBpZWNlcyBvZiBmbG9hdGluZyBVSSwgbWVhbnQgdG8gYmVcbiAqIHVzZWQgYXMgYSBsb3ctbGV2ZWwgYnVpbGRpbmcgYmxvY2sgZm9yIG90aGVyIGNvbXBvbmVudHMuIERpYWxvZ3MsIHRvb2x0aXBzLCBtZW51cyxcbiAqIHNlbGVjdHMsIGV0Yy4gY2FuIGFsbCBiZSBidWlsdCB1c2luZyBvdmVybGF5cy4gVGhlIHNlcnZpY2Ugc2hvdWxkIHByaW1hcmlseSBiZSB1c2VkIGJ5IGF1dGhvcnNcbiAqIG9mIHJlLXVzYWJsZSBjb21wb25lbnRzIHJhdGhlciB0aGFuIGRldmVsb3BlcnMgYnVpbGRpbmcgZW5kLXVzZXIgYXBwbGljYXRpb25zLlxuICpcbiAqIEFuIG92ZXJsYXkgKmlzKiBhIFBvcnRhbE91dGxldCwgc28gYW55IGtpbmQgb2YgUG9ydGFsIGNhbiBiZSBsb2FkZWQgaW50byBvbmUuXG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBPdmVybGF5IHtcbiAgcHJpdmF0ZSBfYXBwUmVmOiBBcHBsaWNhdGlvblJlZjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgICAgICAgICAgLyoqIFNjcm9sbGluZyBzdHJhdGVnaWVzIHRoYXQgY2FuIGJlIHVzZWQgd2hlbiBjcmVhdGluZyBhbiBvdmVybGF5LiAqL1xuICAgICAgICAgICAgICBwdWJsaWMgc2Nyb2xsU3RyYXRlZ2llczogU2Nyb2xsU3RyYXRlZ3lPcHRpb25zLFxuICAgICAgICAgICAgICBwcml2YXRlIF9vdmVybGF5Q29udGFpbmVyOiBPdmVybGF5Q29udGFpbmVyLFxuICAgICAgICAgICAgICBwcml2YXRlIF9jb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI6IENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfcG9zaXRpb25CdWlsZGVyOiBPdmVybGF5UG9zaXRpb25CdWlsZGVyLFxuICAgICAgICAgICAgICBwcml2YXRlIF9rZXlib2FyZERpc3BhdGNoZXI6IE92ZXJsYXlLZXlib2FyZERpc3BhdGNoZXIsXG4gICAgICAgICAgICAgIHByaXZhdGUgX2luamVjdG9yOiBJbmplY3RvcixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgICAgICAgICAgIEBJbmplY3QoRE9DVU1FTlQpIHByaXZhdGUgX2RvY3VtZW50OiBhbnksXG4gICAgICAgICAgICAgIHByaXZhdGUgX2RpcmVjdGlvbmFsaXR5OiBEaXJlY3Rpb25hbGl0eSxcbiAgICAgICAgICAgICAgLy8gQGJyZWFraW5nLWNoYW5nZSA4LjAuMCBgX2xvY2F0aW9uYCBwYXJhbWV0ZXIgdG8gYmUgbWFkZSByZXF1aXJlZC5cbiAgICAgICAgICAgICAgQE9wdGlvbmFsKCkgcHJpdmF0ZSBfbG9jYXRpb24/OiBMb2NhdGlvbikgeyB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gb3ZlcmxheS5cbiAgICogQHBhcmFtIGNvbmZpZyBDb25maWd1cmF0aW9uIGFwcGxpZWQgdG8gdGhlIG92ZXJsYXkuXG4gICAqIEByZXR1cm5zIFJlZmVyZW5jZSB0byB0aGUgY3JlYXRlZCBvdmVybGF5LlxuICAgKi9cbiAgY3JlYXRlKGNvbmZpZz86IE92ZXJsYXlDb25maWcpOiBPdmVybGF5UmVmIHtcbiAgICBjb25zdCBob3N0ID0gdGhpcy5fY3JlYXRlSG9zdEVsZW1lbnQoKTtcbiAgICBjb25zdCBwYW5lID0gdGhpcy5fY3JlYXRlUGFuZUVsZW1lbnQoaG9zdCk7XG4gICAgY29uc3QgcG9ydGFsT3V0bGV0ID0gdGhpcy5fY3JlYXRlUG9ydGFsT3V0bGV0KHBhbmUpO1xuICAgIGNvbnN0IG92ZXJsYXlDb25maWcgPSBuZXcgT3ZlcmxheUNvbmZpZyhjb25maWcpO1xuXG4gICAgb3ZlcmxheUNvbmZpZy5kaXJlY3Rpb24gPSBvdmVybGF5Q29uZmlnLmRpcmVjdGlvbiB8fCB0aGlzLl9kaXJlY3Rpb25hbGl0eS52YWx1ZTtcblxuICAgIHJldHVybiBuZXcgT3ZlcmxheVJlZihwb3J0YWxPdXRsZXQsIGhvc3QsIHBhbmUsIG92ZXJsYXlDb25maWcsIHRoaXMuX25nWm9uZSxcbiAgICAgIHRoaXMuX2tleWJvYXJkRGlzcGF0Y2hlciwgdGhpcy5fZG9jdW1lbnQsIHRoaXMuX2xvY2F0aW9uKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgcG9zaXRpb24gYnVpbGRlciB0aGF0IGNhbiBiZSB1c2VkLCB2aWEgZmx1ZW50IEFQSSxcbiAgICogdG8gY29uc3RydWN0IGFuZCBjb25maWd1cmUgYSBwb3NpdGlvbiBzdHJhdGVneS5cbiAgICogQHJldHVybnMgQW4gb3ZlcmxheSBwb3NpdGlvbiBidWlsZGVyLlxuICAgKi9cbiAgcG9zaXRpb24oKTogT3ZlcmxheVBvc2l0aW9uQnVpbGRlciB7XG4gICAgcmV0dXJuIHRoaXMuX3Bvc2l0aW9uQnVpbGRlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIHRoZSBET00gZWxlbWVudCBmb3IgYW4gb3ZlcmxheSBhbmQgYXBwZW5kcyBpdCB0byB0aGUgb3ZlcmxheSBjb250YWluZXIuXG4gICAqIEByZXR1cm5zIE5ld2x5LWNyZWF0ZWQgcGFuZSBlbGVtZW50XG4gICAqL1xuICBwcml2YXRlIF9jcmVhdGVQYW5lRWxlbWVudChob3N0OiBIVE1MRWxlbWVudCk6IEhUTUxFbGVtZW50IHtcbiAgICBjb25zdCBwYW5lID0gdGhpcy5fZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgICBwYW5lLmlkID0gYGNkay1vdmVybGF5LSR7bmV4dFVuaXF1ZUlkKyt9YDtcbiAgICBwYW5lLmNsYXNzTGlzdC5hZGQoJ2Nkay1vdmVybGF5LXBhbmUnKTtcbiAgICBob3N0LmFwcGVuZENoaWxkKHBhbmUpO1xuXG4gICAgcmV0dXJuIHBhbmU7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyB0aGUgaG9zdCBlbGVtZW50IHRoYXQgd3JhcHMgYXJvdW5kIGFuIG92ZXJsYXlcbiAgICogYW5kIGNhbiBiZSB1c2VkIGZvciBhZHZhbmNlZCBwb3NpdGlvbmluZy5cbiAgICogQHJldHVybnMgTmV3bHktY3JlYXRlIGhvc3QgZWxlbWVudC5cbiAgICovXG4gIHByaXZhdGUgX2NyZWF0ZUhvc3RFbGVtZW50KCk6IEhUTUxFbGVtZW50IHtcbiAgICBjb25zdCBob3N0ID0gdGhpcy5fZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5fb3ZlcmxheUNvbnRhaW5lci5nZXRDb250YWluZXJFbGVtZW50KCkuYXBwZW5kQ2hpbGQoaG9zdCk7XG4gICAgcmV0dXJuIGhvc3Q7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgRG9tUG9ydGFsT3V0bGV0IGludG8gd2hpY2ggdGhlIG92ZXJsYXkgY29udGVudCBjYW4gYmUgbG9hZGVkLlxuICAgKiBAcGFyYW0gcGFuZSBUaGUgRE9NIGVsZW1lbnQgdG8gdHVybiBpbnRvIGEgcG9ydGFsIG91dGxldC5cbiAgICogQHJldHVybnMgQSBwb3J0YWwgb3V0bGV0IGZvciB0aGUgZ2l2ZW4gRE9NIGVsZW1lbnQuXG4gICAqL1xuICBwcml2YXRlIF9jcmVhdGVQb3J0YWxPdXRsZXQocGFuZTogSFRNTEVsZW1lbnQpOiBEb21Qb3J0YWxPdXRsZXQge1xuICAgIC8vIFdlIGhhdmUgdG8gcmVzb2x2ZSB0aGUgQXBwbGljYXRpb25SZWYgbGF0ZXIgaW4gb3JkZXIgdG8gYWxsb3cgcGVvcGxlXG4gICAgLy8gdG8gdXNlIG92ZXJsYXktYmFzZWQgcHJvdmlkZXJzIGR1cmluZyBhcHAgaW5pdGlhbGl6YXRpb24uXG4gICAgaWYgKCF0aGlzLl9hcHBSZWYpIHtcbiAgICAgIHRoaXMuX2FwcFJlZiA9IHRoaXMuX2luamVjdG9yLmdldDxBcHBsaWNhdGlvblJlZj4oQXBwbGljYXRpb25SZWYpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgRG9tUG9ydGFsT3V0bGV0KHBhbmUsIHRoaXMuX2NvbXBvbmVudEZhY3RvcnlSZXNvbHZlciwgdGhpcy5fYXBwUmVmLCB0aGlzLl9pbmplY3RvcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudCk7XG4gIH1cbn1cbiJdfQ==