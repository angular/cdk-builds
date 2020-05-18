/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/overlay/overlay.ts
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
let Overlay = /** @class */ (() => {
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
    class Overlay {
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
    return Overlay;
})();
export { Overlay };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvb3ZlcmxheS9vdmVybGF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUNuRCxPQUFPLEVBQ0wsY0FBYyxFQUNkLHdCQUF3QixFQUN4QixNQUFNLEVBQ04sVUFBVSxFQUNWLFFBQVEsRUFDUixNQUFNLEVBQ04sUUFBUSxHQUNULE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLHdDQUF3QyxDQUFDO0FBQ2pGLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUMvQyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3pDLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLHFDQUFxQyxDQUFDO0FBQzNFLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDOzs7OztJQUlqRCxZQUFZLEdBQUcsQ0FBQzs7Ozs7Ozs7Ozs7QUFhcEI7Ozs7Ozs7Ozs7O0lBQUEsTUFDYSxPQUFPOzs7Ozs7Ozs7Ozs7O1FBR2xCLFlBRW1CLGdCQUF1QyxFQUN0QyxpQkFBbUMsRUFDbkMseUJBQW1ELEVBQ25ELGdCQUF3QyxFQUN4QyxtQkFBOEMsRUFDOUMsU0FBbUIsRUFDbkIsT0FBZSxFQUNHLFNBQWMsRUFDaEMsZUFBK0IsRUFFbkIsU0FBb0I7WUFWakMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUF1QjtZQUN0QyxzQkFBaUIs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RCxzQ0FBc0Q7Ozs7O0lBQ3RELDRCQUEyQjs7Ozs7SUFDM0IsMEJBQXVCOzs7OztJQUN2Qiw0QkFBd0M7Ozs7O0lBQ3hDLGtDQUF1Qzs7Ozs7SUFFdkMsNEJBQXdDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7RG9tUG9ydGFsT3V0bGV0fSBmcm9tICdAYW5ndWxhci9jZGsvcG9ydGFsJztcbmltcG9ydCB7RE9DVU1FTlQsIExvY2F0aW9ufSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtcbiAgQXBwbGljYXRpb25SZWYsXG4gIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcixcbiAgSW5qZWN0LFxuICBJbmplY3RhYmxlLFxuICBJbmplY3RvcixcbiAgTmdab25lLFxuICBPcHRpb25hbCxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge092ZXJsYXlLZXlib2FyZERpc3BhdGNoZXJ9IGZyb20gJy4va2V5Ym9hcmQvb3ZlcmxheS1rZXlib2FyZC1kaXNwYXRjaGVyJztcbmltcG9ydCB7T3ZlcmxheUNvbmZpZ30gZnJvbSAnLi9vdmVybGF5LWNvbmZpZyc7XG5pbXBvcnQge092ZXJsYXlDb250YWluZXJ9IGZyb20gJy4vb3ZlcmxheS1jb250YWluZXInO1xuaW1wb3J0IHtPdmVybGF5UmVmfSBmcm9tICcuL292ZXJsYXktcmVmJztcbmltcG9ydCB7T3ZlcmxheVBvc2l0aW9uQnVpbGRlcn0gZnJvbSAnLi9wb3NpdGlvbi9vdmVybGF5LXBvc2l0aW9uLWJ1aWxkZXInO1xuaW1wb3J0IHtTY3JvbGxTdHJhdGVneU9wdGlvbnN9IGZyb20gJy4vc2Nyb2xsL2luZGV4JztcblxuXG4vKiogTmV4dCBvdmVybGF5IHVuaXF1ZSBJRC4gKi9cbmxldCBuZXh0VW5pcXVlSWQgPSAwO1xuXG4vLyBOb3RlIHRoYXQgT3ZlcmxheSBpcyAqbm90KiBzY29wZWQgdG8gdGhlIGFwcCByb290IGJlY2F1c2Ugb2YgdGhlIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlclxuLy8gd2hpY2ggbmVlZHMgdG8gYmUgZGlmZmVyZW50IGRlcGVuZGluZyBvbiB3aGVyZSBPdmVybGF5TW9kdWxlIGlzIGltcG9ydGVkLlxuXG4vKipcbiAqIFNlcnZpY2UgdG8gY3JlYXRlIE92ZXJsYXlzLiBPdmVybGF5cyBhcmUgZHluYW1pY2FsbHkgYWRkZWQgcGllY2VzIG9mIGZsb2F0aW5nIFVJLCBtZWFudCB0byBiZVxuICogdXNlZCBhcyBhIGxvdy1sZXZlbCBidWlsZGluZyBibG9jayBmb3Igb3RoZXIgY29tcG9uZW50cy4gRGlhbG9ncywgdG9vbHRpcHMsIG1lbnVzLFxuICogc2VsZWN0cywgZXRjLiBjYW4gYWxsIGJlIGJ1aWx0IHVzaW5nIG92ZXJsYXlzLiBUaGUgc2VydmljZSBzaG91bGQgcHJpbWFyaWx5IGJlIHVzZWQgYnkgYXV0aG9yc1xuICogb2YgcmUtdXNhYmxlIGNvbXBvbmVudHMgcmF0aGVyIHRoYW4gZGV2ZWxvcGVycyBidWlsZGluZyBlbmQtdXNlciBhcHBsaWNhdGlvbnMuXG4gKlxuICogQW4gb3ZlcmxheSAqaXMqIGEgUG9ydGFsT3V0bGV0LCBzbyBhbnkga2luZCBvZiBQb3J0YWwgY2FuIGJlIGxvYWRlZCBpbnRvIG9uZS5cbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIE92ZXJsYXkge1xuICBwcml2YXRlIF9hcHBSZWY6IEFwcGxpY2F0aW9uUmVmO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgICAgICAgICAvKiogU2Nyb2xsaW5nIHN0cmF0ZWdpZXMgdGhhdCBjYW4gYmUgdXNlZCB3aGVuIGNyZWF0aW5nIGFuIG92ZXJsYXkuICovXG4gICAgICAgICAgICAgIHB1YmxpYyBzY3JvbGxTdHJhdGVnaWVzOiBTY3JvbGxTdHJhdGVneU9wdGlvbnMsXG4gICAgICAgICAgICAgIHByaXZhdGUgX292ZXJsYXlDb250YWluZXI6IE92ZXJsYXlDb250YWluZXIsXG4gICAgICAgICAgICAgIHByaXZhdGUgX2NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjogQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLFxuICAgICAgICAgICAgICBwcml2YXRlIF9wb3NpdGlvbkJ1aWxkZXI6IE92ZXJsYXlQb3NpdGlvbkJ1aWxkZXIsXG4gICAgICAgICAgICAgIHByaXZhdGUgX2tleWJvYXJkRGlzcGF0Y2hlcjogT3ZlcmxheUtleWJvYXJkRGlzcGF0Y2hlcixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfaW5qZWN0b3I6IEluamVjdG9yLFxuICAgICAgICAgICAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICAgICAgICAgICAgQEluamVjdChET0NVTUVOVCkgcHJpdmF0ZSBfZG9jdW1lbnQ6IGFueSxcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfZGlyZWN0aW9uYWxpdHk6IERpcmVjdGlvbmFsaXR5LFxuICAgICAgICAgICAgICAvLyBAYnJlYWtpbmctY2hhbmdlIDguMC4wIGBfbG9jYXRpb25gIHBhcmFtZXRlciB0byBiZSBtYWRlIHJlcXVpcmVkLlxuICAgICAgICAgICAgICBAT3B0aW9uYWwoKSBwcml2YXRlIF9sb2NhdGlvbj86IExvY2F0aW9uKSB7IH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBvdmVybGF5LlxuICAgKiBAcGFyYW0gY29uZmlnIENvbmZpZ3VyYXRpb24gYXBwbGllZCB0byB0aGUgb3ZlcmxheS5cbiAgICogQHJldHVybnMgUmVmZXJlbmNlIHRvIHRoZSBjcmVhdGVkIG92ZXJsYXkuXG4gICAqL1xuICBjcmVhdGUoY29uZmlnPzogT3ZlcmxheUNvbmZpZyk6IE92ZXJsYXlSZWYge1xuICAgIGNvbnN0IGhvc3QgPSB0aGlzLl9jcmVhdGVIb3N0RWxlbWVudCgpO1xuICAgIGNvbnN0IHBhbmUgPSB0aGlzLl9jcmVhdGVQYW5lRWxlbWVudChob3N0KTtcbiAgICBjb25zdCBwb3J0YWxPdXRsZXQgPSB0aGlzLl9jcmVhdGVQb3J0YWxPdXRsZXQocGFuZSk7XG4gICAgY29uc3Qgb3ZlcmxheUNvbmZpZyA9IG5ldyBPdmVybGF5Q29uZmlnKGNvbmZpZyk7XG5cbiAgICBvdmVybGF5Q29uZmlnLmRpcmVjdGlvbiA9IG92ZXJsYXlDb25maWcuZGlyZWN0aW9uIHx8IHRoaXMuX2RpcmVjdGlvbmFsaXR5LnZhbHVlO1xuXG4gICAgcmV0dXJuIG5ldyBPdmVybGF5UmVmKHBvcnRhbE91dGxldCwgaG9zdCwgcGFuZSwgb3ZlcmxheUNvbmZpZywgdGhpcy5fbmdab25lLFxuICAgICAgdGhpcy5fa2V5Ym9hcmREaXNwYXRjaGVyLCB0aGlzLl9kb2N1bWVudCwgdGhpcy5fbG9jYXRpb24pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSBwb3NpdGlvbiBidWlsZGVyIHRoYXQgY2FuIGJlIHVzZWQsIHZpYSBmbHVlbnQgQVBJLFxuICAgKiB0byBjb25zdHJ1Y3QgYW5kIGNvbmZpZ3VyZSBhIHBvc2l0aW9uIHN0cmF0ZWd5LlxuICAgKiBAcmV0dXJucyBBbiBvdmVybGF5IHBvc2l0aW9uIGJ1aWxkZXIuXG4gICAqL1xuICBwb3NpdGlvbigpOiBPdmVybGF5UG9zaXRpb25CdWlsZGVyIHtcbiAgICByZXR1cm4gdGhpcy5fcG9zaXRpb25CdWlsZGVyO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgdGhlIERPTSBlbGVtZW50IGZvciBhbiBvdmVybGF5IGFuZCBhcHBlbmRzIGl0IHRvIHRoZSBvdmVybGF5IGNvbnRhaW5lci5cbiAgICogQHJldHVybnMgTmV3bHktY3JlYXRlZCBwYW5lIGVsZW1lbnRcbiAgICovXG4gIHByaXZhdGUgX2NyZWF0ZVBhbmVFbGVtZW50KGhvc3Q6IEhUTUxFbGVtZW50KTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IHBhbmUgPSB0aGlzLl9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgIHBhbmUuaWQgPSBgY2RrLW92ZXJsYXktJHtuZXh0VW5pcXVlSWQrK31gO1xuICAgIHBhbmUuY2xhc3NMaXN0LmFkZCgnY2RrLW92ZXJsYXktcGFuZScpO1xuICAgIGhvc3QuYXBwZW5kQ2hpbGQocGFuZSk7XG5cbiAgICByZXR1cm4gcGFuZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIHRoZSBob3N0IGVsZW1lbnQgdGhhdCB3cmFwcyBhcm91bmQgYW4gb3ZlcmxheVxuICAgKiBhbmQgY2FuIGJlIHVzZWQgZm9yIGFkdmFuY2VkIHBvc2l0aW9uaW5nLlxuICAgKiBAcmV0dXJucyBOZXdseS1jcmVhdGUgaG9zdCBlbGVtZW50LlxuICAgKi9cbiAgcHJpdmF0ZSBfY3JlYXRlSG9zdEVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IGhvc3QgPSB0aGlzLl9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLl9vdmVybGF5Q29udGFpbmVyLmdldENvbnRhaW5lckVsZW1lbnQoKS5hcHBlbmRDaGlsZChob3N0KTtcbiAgICByZXR1cm4gaG9zdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBEb21Qb3J0YWxPdXRsZXQgaW50byB3aGljaCB0aGUgb3ZlcmxheSBjb250ZW50IGNhbiBiZSBsb2FkZWQuXG4gICAqIEBwYXJhbSBwYW5lIFRoZSBET00gZWxlbWVudCB0byB0dXJuIGludG8gYSBwb3J0YWwgb3V0bGV0LlxuICAgKiBAcmV0dXJucyBBIHBvcnRhbCBvdXRsZXQgZm9yIHRoZSBnaXZlbiBET00gZWxlbWVudC5cbiAgICovXG4gIHByaXZhdGUgX2NyZWF0ZVBvcnRhbE91dGxldChwYW5lOiBIVE1MRWxlbWVudCk6IERvbVBvcnRhbE91dGxldCB7XG4gICAgLy8gV2UgaGF2ZSB0byByZXNvbHZlIHRoZSBBcHBsaWNhdGlvblJlZiBsYXRlciBpbiBvcmRlciB0byBhbGxvdyBwZW9wbGVcbiAgICAvLyB0byB1c2Ugb3ZlcmxheS1iYXNlZCBwcm92aWRlcnMgZHVyaW5nIGFwcCBpbml0aWFsaXphdGlvbi5cbiAgICBpZiAoIXRoaXMuX2FwcFJlZikge1xuICAgICAgdGhpcy5fYXBwUmVmID0gdGhpcy5faW5qZWN0b3IuZ2V0PEFwcGxpY2F0aW9uUmVmPihBcHBsaWNhdGlvblJlZik7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBEb21Qb3J0YWxPdXRsZXQocGFuZSwgdGhpcy5fY29tcG9uZW50RmFjdG9yeVJlc29sdmVyLCB0aGlzLl9hcHBSZWYsIHRoaXMuX2luamVjdG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2RvY3VtZW50KTtcbiAgfVxufVxuIl19