import { OverlayContainer } from './overlay-module-DVlnSjmr.mjs';
export { BlockScrollStrategy, CdkConnectedOverlay, CdkOverlayOrigin, CloseScrollStrategy, ConnectedOverlayPositionChange, ConnectionPositionPair, FlexibleConnectedPositionStrategy, GlobalPositionStrategy, NoopScrollStrategy, Overlay, OverlayConfig, OverlayKeyboardDispatcher, OverlayModule, OverlayOutsideClickDispatcher, OverlayPositionBuilder, OverlayRef, RepositionScrollStrategy, STANDARD_DROPDOWN_ADJACENT_POSITIONS, STANDARD_DROPDOWN_BELOW_POSITIONS, ScrollStrategyOptions, ScrollingVisibility, validateHorizontalPosition, validateVerticalPosition } from './overlay-module-DVlnSjmr.mjs';
import * as i0 from '@angular/core';
import { inject, RendererFactory2, Injectable } from '@angular/core';
export { CdkScrollable, ScrollDispatcher, ViewportRuler, CdkFixedSizeVirtualScroll as ɵɵCdkFixedSizeVirtualScroll, CdkScrollableModule as ɵɵCdkScrollableModule, CdkVirtualForOf as ɵɵCdkVirtualForOf, CdkVirtualScrollViewport as ɵɵCdkVirtualScrollViewport, CdkVirtualScrollableElement as ɵɵCdkVirtualScrollableElement, CdkVirtualScrollableWindow as ɵɵCdkVirtualScrollableWindow } from './scrolling.mjs';
export { Dir as ɵɵDir } from './bidi.mjs';
import '@angular/common';
import './platform-Do3uqmxu.mjs';
import './backwards-compatibility-DYuVCOXM.mjs';
import './shadow-dom-DFvX9W95.mjs';
import './test-environment-BgaaXvCA.mjs';
import './style-loader-WcmCyO2o.mjs';
import 'rxjs';
import 'rxjs/operators';
import './css-pixel-value-C1yoKJ7R.mjs';
import './array-Hg8isvLj.mjs';
import './scrolling-BXVcIfjZ.mjs';
import './portal-directives-CtfZjx5e.mjs';
import './directionality-DPQw3n2b.mjs';
import './id-generator-tlPCNuwi.mjs';
import './keycodes-DPWmI2Ix.mjs';
import './keycodes.mjs';
import './element-CpqV8p-X.mjs';
import './recycle-view-repeater-strategy-Ce0p4WhD.mjs';
import './data-source-CL6Fasig.mjs';

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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.6", ngImport: i0, type: FullscreenOverlayContainer, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.6", ngImport: i0, type: FullscreenOverlayContainer, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.6", ngImport: i0, type: FullscreenOverlayContainer, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: () => [] });

export { FullscreenOverlayContainer, OverlayContainer };
//# sourceMappingURL=overlay.mjs.map
