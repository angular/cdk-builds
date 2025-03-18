import { b as OverlayContainer } from './overlay-module-7f527d71.mjs';
export { B as BlockScrollStrategy, f as CdkConnectedOverlay, C as CdkOverlayOrigin, m as CloseScrollStrategy, j as ConnectedOverlayPositionChange, h as ConnectionPositionPair, F as FlexibleConnectedPositionStrategy, G as GlobalPositionStrategy, N as NoopScrollStrategy, a as Overlay, c as OverlayConfig, b as OverlayContainer, o as OverlayKeyboardDispatcher, d as OverlayModule, n as OverlayOutsideClickDispatcher, g as OverlayPositionBuilder, O as OverlayRef, R as RepositionScrollStrategy, e as STANDARD_DROPDOWN_ADJACENT_POSITIONS, S as STANDARD_DROPDOWN_BELOW_POSITIONS, l as ScrollStrategyOptions, i as ScrollingVisibility, k as validateHorizontalPosition, v as validateVerticalPosition } from './overlay-module-7f527d71.mjs';
import * as i0 from '@angular/core';
import { inject, RendererFactory2, Injectable } from '@angular/core';
export { b as CdkScrollable, S as ScrollDispatcher, V as ViewportRuler } from './scrolling-module-dbd83632.mjs';
import '@angular/common';
import './platform-610a08ae.mjs';
import './backwards-compatibility-bcbe473e.mjs';
import './shadow-dom-9f403d00.mjs';
import './test-environment-34eef1ee.mjs';
import './style-loader-51b80670.mjs';
import 'rxjs';
import 'rxjs/operators';
import './css-pixel-value-286c9a60.mjs';
import './array-ee3b4bab.mjs';
import './scrolling-61955dd1.mjs';
import './portal-directives-06c9f3e0.mjs';
import './directionality-0a678adc.mjs';
import './id-generator-1959b006.mjs';
import './keycodes-107cd3e4.mjs';
import './modifiers-33a5859e.mjs';
import './bidi-module-56dd006c.mjs';
import './element-705567fe.mjs';
import './recycle-view-repeater-strategy-c1712813.mjs';
import './data-source-5320b6fd.mjs';

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
