import { d as OverlayContainer } from '../overlay-module.d-0970e3e8.js';
export { f as CdkConnectedOverlay, e as CdkOverlayOrigin, n as ConnectedOverlayPositionChange, C as ConnectedPosition, l as ConnectionPositionPair, b as FlexibleConnectedPositionStrategy, F as FlexibleConnectedPositionStrategyOrigin, H as HorizontalConnectionPos, j as OriginConnectionPosition, c as OverlayConfig, k as OverlayConnectionPosition, d as OverlayContainer, q as OverlayKeyboardDispatcher, a as OverlayModule, p as OverlayOutsideClickDispatcher, O as OverlayRef, g as OverlaySizeConfig, P as PositionStrategy, h as STANDARD_DROPDOWN_ADJACENT_POSITIONS, i as STANDARD_DROPDOWN_BELOW_POSITIONS, S as ScrollStrategy, m as ScrollingVisibility, V as VerticalConnectionPos, o as validateHorizontalPosition, v as validateVerticalPosition } from '../overlay-module.d-0970e3e8.js';
export { C as CdkScrollable, a as ScrollDispatcher, c as ɵɵCdkFixedSizeVirtualScroll, b as ɵɵCdkScrollableModule, d as ɵɵCdkVirtualForOf, e as ɵɵCdkVirtualScrollViewport, g as ɵɵCdkVirtualScrollableElement, f as ɵɵCdkVirtualScrollableWindow } from '../scrolling-module.d-519cb9bf.js';
export { V as ViewportRuler } from '../viewport-ruler.d-17d129ea.js';
export { B as BlockScrollStrategy, C as CloseScrollStrategy, G as GlobalPositionStrategy, N as NoopScrollStrategy, O as Overlay, a as OverlayPositionBuilder, R as RepositionScrollStrategy, b as RepositionScrollStrategyConfig, S as ScrollStrategyOptions } from '../overlay.d-a80c40ed.js';
import * as i0 from '@angular/core';
import { OnDestroy } from '@angular/core';
export { b as ComponentType } from '../portal-directives.d-d581f5ee.js';
export { b as ɵɵDir } from '../bidi-module.d-879a73c7.js';
import '@angular/common';
import 'rxjs';
import '../platform.d-4dc3e073.js';
import '../style-loader.d-972eab2d.js';
import '../data-source.d-cd31f292.js';
import '../number-property.d-5998850c.js';

/**
 * Alternative to OverlayContainer that supports correct displaying of overlay elements in
 * Fullscreen mode
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullScreen
 *
 * Should be provided in the root component.
 */
declare class FullscreenOverlayContainer extends OverlayContainer implements OnDestroy {
    private _renderer;
    private _fullScreenEventName;
    private _cleanupFullScreenListener;
    constructor(...args: unknown[]);
    ngOnDestroy(): void;
    protected _createContainer(): void;
    private _adjustParentForFullscreenChange;
    private _getEventName;
    /**
     * When the page is put into fullscreen mode, a specific element is specified.
     * Only that element and its children are visible when in fullscreen mode.
     */
    getFullscreenElement(): Element;
    static ɵfac: i0.ɵɵFactoryDeclaration<FullscreenOverlayContainer, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<FullscreenOverlayContainer>;
}

export { FullscreenOverlayContainer };
