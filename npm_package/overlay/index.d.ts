import { O as OverlayContainer } from '../overlay-module.d-B3qEQtts.js';
export { a as CdkConnectedOverlay, C as CdkOverlayOrigin, l as ConnectedOverlayPositionChange, d as ConnectedPosition, j as ConnectionPositionPair, F as FlexibleConnectedPositionStrategy, e as FlexibleConnectedPositionStrategyOrigin, H as HorizontalConnectionPos, h as OriginConnectionPosition, g as OverlayConfig, i as OverlayConnectionPosition, q as OverlayKeyboardDispatcher, o as OverlayModule, p as OverlayOutsideClickDispatcher, b as OverlayRef, c as OverlaySizeConfig, P as PositionStrategy, S as STANDARD_DROPDOWN_ADJACENT_POSITIONS, f as STANDARD_DROPDOWN_BELOW_POSITIONS, n as ScrollStrategy, k as ScrollingVisibility, V as VerticalConnectionPos, m as validateHorizontalPosition, v as validateVerticalPosition } from '../overlay-module.d-B3qEQtts.js';
export { C as CdkScrollable, S as ScrollDispatcher, b as ɵɵCdkFixedSizeVirtualScroll, a as ɵɵCdkScrollableModule, c as ɵɵCdkVirtualForOf, d as ɵɵCdkVirtualScrollViewport, f as ɵɵCdkVirtualScrollableElement, e as ɵɵCdkVirtualScrollableWindow } from '../scrolling-module.d-ud2XrbF8.js';
export { ViewportRuler } from '../scrolling/index.js';
export { B as BlockScrollStrategy, C as CloseScrollStrategy, G as GlobalPositionStrategy, N as NoopScrollStrategy, O as Overlay, a as OverlayPositionBuilder, R as RepositionScrollStrategy, b as RepositionScrollStrategyConfig, S as ScrollStrategyOptions } from '../overlay.d-BdoMy0hX.js';
import * as i0 from '@angular/core';
import { OnDestroy } from '@angular/core';
export { C as ComponentType } from '../portal-directives.d-BoG39gYN.js';
export { b as ɵɵDir } from '../bidi-module.d-D-fEBKdS.js';
import '@angular/common';
import 'rxjs';
import '../platform.d-B3vREl3q.js';
import '../style-loader.d-BXZfQZTF.js';
import '../data-source.d-Bblv7Zvh.js';
import '../number-property.d-CJVxXUcb.js';

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

export { FullscreenOverlayContainer, OverlayContainer };
