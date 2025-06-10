import { O as OverlayContainer } from './overlay-module-Bd2UplUU.mjs';
export { B as BlockScrollStrategy, b as CdkConnectedOverlay, C as CdkOverlayOrigin, p as CloseScrollStrategy, l as ConnectedOverlayPositionChange, j as ConnectionPositionPair, F as FlexibleConnectedPositionStrategy, G as GlobalPositionStrategy, N as NoopScrollStrategy, a as Overlay, i as OverlayConfig, w as OverlayKeyboardDispatcher, t as OverlayModule, u as OverlayOutsideClickDispatcher, e as OverlayPositionBuilder, d as OverlayRef, R as RepositionScrollStrategy, S as STANDARD_DROPDOWN_ADJACENT_POSITIONS, g as STANDARD_DROPDOWN_BELOW_POSITIONS, n as ScrollStrategyOptions, k as ScrollingVisibility, s as createBlockScrollStrategy, q as createCloseScrollStrategy, h as createFlexibleConnectedPositionStrategy, f as createGlobalPositionStrategy, r as createNoopScrollStrategy, c as createOverlayRef, o as createRepositionScrollStrategy, m as validateHorizontalPosition, v as validateVerticalPosition } from './overlay-module-Bd2UplUU.mjs';
import * as i0 from '@angular/core';
import { inject, RendererFactory2, Injectable } from '@angular/core';
export { CdkScrollable, ScrollDispatcher, ViewportRuler, CdkFixedSizeVirtualScroll as ɵɵCdkFixedSizeVirtualScroll, CdkScrollableModule as ɵɵCdkScrollableModule, CdkVirtualForOf as ɵɵCdkVirtualForOf, CdkVirtualScrollViewport as ɵɵCdkVirtualScrollViewport, CdkVirtualScrollableElement as ɵɵCdkVirtualScrollableElement, CdkVirtualScrollableWindow as ɵɵCdkVirtualScrollableWindow } from './scrolling.mjs';
export { Dir as ɵɵDir } from './bidi.mjs';
import '@angular/common';
import './platform-DNDzkVcI.mjs';
import './shadow-dom-B0oHn41l.mjs';
import './test-environment-CT0XxPyp.mjs';
import './style-loader-B2sGQXxD.mjs';
import 'rxjs';
import './css-pixel-value-C_HEqLhI.mjs';
import './array-I1yfCXUO.mjs';
import './portal.mjs';
import './scrolling-BkvA05C8.mjs';
import 'rxjs/operators';
import './id-generator-LuoRZSid.mjs';
import './directionality-CChdj3az.mjs';
import './keycodes-CpHkExLC.mjs';
import './keycodes.mjs';
import './element-x4z00URv.mjs';
import './recycle-view-repeater-strategy-SfuyU210.mjs';
import './data-source-D34wiQZj.mjs';

/**
 * Alternative to OverlayContainer that supports correct displaying of overlay elements in
 * Fullscreen mode
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullScreen
 *
 * Should be provided in the root component.
 */
class FullscreenOverlayContainer extends OverlayContainer {
    _renderer = inject(RendererFactory2).createRenderer(null, null);
    _fullScreenEventName;
    _cleanupFullScreenListener;
    constructor() {
        super();
    }
    ngOnDestroy() {
        super.ngOnDestroy();
        this._cleanupFullScreenListener?.();
    }
    _createContainer() {
        const eventName = this._getEventName();
        super._createContainer();
        this._adjustParentForFullscreenChange();
        if (eventName) {
            this._cleanupFullScreenListener?.();
            this._cleanupFullScreenListener = this._renderer.listen('document', eventName, () => {
                this._adjustParentForFullscreenChange();
            });
        }
    }
    _adjustParentForFullscreenChange() {
        if (this._containerElement) {
            const fullscreenElement = this.getFullscreenElement();
            const parent = fullscreenElement || this._document.body;
            parent.appendChild(this._containerElement);
        }
    }
    _getEventName() {
        if (!this._fullScreenEventName) {
            const _document = this._document;
            if (_document.fullscreenEnabled) {
                this._fullScreenEventName = 'fullscreenchange';
            }
            else if (_document.webkitFullscreenEnabled) {
                this._fullScreenEventName = 'webkitfullscreenchange';
            }
            else if (_document.mozFullScreenEnabled) {
                this._fullScreenEventName = 'mozfullscreenchange';
            }
            else if (_document.msFullscreenEnabled) {
                this._fullScreenEventName = 'MSFullscreenChange';
            }
        }
        return this._fullScreenEventName;
    }
    /**
     * When the page is put into fullscreen mode, a specific element is specified.
     * Only that element and its children are visible when in fullscreen mode.
     */
    getFullscreenElement() {
        const _document = this._document;
        return (_document.fullscreenElement ||
            _document.webkitFullscreenElement ||
            _document.mozFullScreenElement ||
            _document.msFullscreenElement ||
            null);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.0.0", ngImport: i0, type: FullscreenOverlayContainer, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "20.0.0", ngImport: i0, type: FullscreenOverlayContainer, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.0.0", ngImport: i0, type: FullscreenOverlayContainer, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: () => [] });

export { FullscreenOverlayContainer, OverlayContainer };
//# sourceMappingURL=overlay.mjs.map
