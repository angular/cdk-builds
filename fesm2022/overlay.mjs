import { b as OverlayContainer } from './overlay-module-1d184db0.mjs';
export { B as BlockScrollStrategy, f as CdkConnectedOverlay, C as CdkOverlayOrigin, m as CloseScrollStrategy, j as ConnectedOverlayPositionChange, h as ConnectionPositionPair, F as FlexibleConnectedPositionStrategy, G as GlobalPositionStrategy, N as NoopScrollStrategy, a as Overlay, c as OverlayConfig, b as OverlayContainer, o as OverlayKeyboardDispatcher, d as OverlayModule, n as OverlayOutsideClickDispatcher, g as OverlayPositionBuilder, O as OverlayRef, R as RepositionScrollStrategy, e as STANDARD_DROPDOWN_ADJACENT_POSITIONS, S as STANDARD_DROPDOWN_BELOW_POSITIONS, l as ScrollStrategyOptions, i as ScrollingVisibility, k as validateHorizontalPosition, v as validateVerticalPosition } from './overlay-module-1d184db0.mjs';
import * as i0 from '@angular/core';
import { inject, RendererFactory2, Injectable } from '@angular/core';
export { b as CdkScrollable, S as ScrollDispatcher, V as ViewportRuler, c as ɵɵCdkFixedSizeVirtualScroll, C as ɵɵCdkScrollableModule, d as ɵɵCdkVirtualForOf, e as ɵɵCdkVirtualScrollViewport, g as ɵɵCdkVirtualScrollableElement, f as ɵɵCdkVirtualScrollableWindow } from './scrolling-module-722545e3.mjs';
export { D as ɵɵDir } from './bidi-module-04c03e58.mjs';
import '@angular/common';
import './platform-20fc4de8.mjs';
import './backwards-compatibility-08253a84.mjs';
import './shadow-dom-318658ae.mjs';
import './test-environment-f6f8bc13.mjs';
import './style-loader-09eecacc.mjs';
import 'rxjs';
import 'rxjs/operators';
import './css-pixel-value-5d0cae55.mjs';
import './array-6239d2f8.mjs';
import './scrolling-59340c46.mjs';
import './portal-directives-dced6d68.mjs';
import './directionality-9d44e426.mjs';
import './id-generator-0b91c6f7.mjs';
import './keycodes-0e4398c6.mjs';
import './modifiers-3e8908bb.mjs';
import './element-15999318.mjs';
import './recycle-view-repeater-strategy-0f32b0a8.mjs';
import './data-source-d79c6e09.mjs';

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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.0", ngImport: i0, type: FullscreenOverlayContainer, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.0", ngImport: i0, type: FullscreenOverlayContainer, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.0", ngImport: i0, type: FullscreenOverlayContainer, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: () => [] });

export { FullscreenOverlayContainer };
//# sourceMappingURL=overlay.mjs.map
