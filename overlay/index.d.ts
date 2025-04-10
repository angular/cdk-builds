import { S as ScrollStrategy, O as OverlayRef, P as PositionStrategy, F as FlexibleConnectedPositionStrategyOrigin, b as FlexibleConnectedPositionStrategy, c as OverlayConfig, d as OverlayContainer } from '../overlay-module.d-7674c06c.js';
export { f as CdkConnectedOverlay, e as CdkOverlayOrigin, n as ConnectedOverlayPositionChange, C as ConnectedPosition, l as ConnectionPositionPair, b as FlexibleConnectedPositionStrategy, F as FlexibleConnectedPositionStrategyOrigin, H as HorizontalConnectionPos, j as OriginConnectionPosition, c as OverlayConfig, k as OverlayConnectionPosition, d as OverlayContainer, q as OverlayKeyboardDispatcher, a as OverlayModule, p as OverlayOutsideClickDispatcher, O as OverlayRef, g as OverlaySizeConfig, P as PositionStrategy, h as STANDARD_DROPDOWN_ADJACENT_POSITIONS, i as STANDARD_DROPDOWN_BELOW_POSITIONS, S as ScrollStrategy, m as ScrollingVisibility, V as VerticalConnectionPos, o as validateHorizontalPosition, v as validateVerticalPosition } from '../overlay-module.d-7674c06c.js';
import { b as ScrollDispatcher } from '../scrolling-module.d-132f8fdb.js';
export { C as CdkScrollable, b as ScrollDispatcher, c as ɵɵCdkFixedSizeVirtualScroll, a as ɵɵCdkScrollableModule, d as ɵɵCdkVirtualForOf, e as ɵɵCdkVirtualScrollViewport, g as ɵɵCdkVirtualScrollableElement, f as ɵɵCdkVirtualScrollableWindow } from '../scrolling-module.d-132f8fdb.js';
import { V as ViewportRuler } from '../viewport-ruler.d-17d129ea.js';
export { V as ViewportRuler } from '../viewport-ruler.d-17d129ea.js';
import * as i0 from '@angular/core';
import { NgZone, OnDestroy } from '@angular/core';
export { b as ComponentType } from '../portal-directives.d-cac5eb8d.js';
export { b as ɵɵDir } from '../bidi-module.d-e045bff7.js';
import '@angular/common';
import 'rxjs';
import '../platform.d-4dc3e073.js';
import '../style-loader.d-972eab2d.js';
import '../data-source.d-cd31f292.js';
import '../number-property.d-5998850c.js';

/**
 * Strategy that will prevent the user from scrolling while the overlay is visible.
 */
declare class BlockScrollStrategy implements ScrollStrategy {
    private _viewportRuler;
    private _previousHTMLStyles;
    private _previousScrollPosition;
    private _isEnabled;
    private _document;
    constructor(_viewportRuler: ViewportRuler, document: any);
    /** Attaches this scroll strategy to an overlay. */
    attach(): void;
    /** Blocks page-level scroll while the attached overlay is open. */
    enable(): void;
    /** Unblocks page-level scroll while the attached overlay is open. */
    disable(): void;
    private _canBeEnabled;
}

/**
 * Config options for the CloseScrollStrategy.
 */
interface CloseScrollStrategyConfig {
    /** Amount of pixels the user has to scroll before the overlay is closed. */
    threshold?: number;
}
/**
 * Strategy that will close the overlay as soon as the user starts scrolling.
 */
declare class CloseScrollStrategy implements ScrollStrategy {
    private _scrollDispatcher;
    private _ngZone;
    private _viewportRuler;
    private _config?;
    private _scrollSubscription;
    private _overlayRef;
    private _initialScrollPosition;
    constructor(_scrollDispatcher: ScrollDispatcher, _ngZone: NgZone, _viewportRuler: ViewportRuler, _config?: CloseScrollStrategyConfig | undefined);
    /** Attaches this scroll strategy to an overlay. */
    attach(overlayRef: OverlayRef): void;
    /** Enables the closing of the attached overlay on scroll. */
    enable(): void;
    /** Disables the closing the attached overlay on scroll. */
    disable(): void;
    detach(): void;
    /** Detaches the overlay ref and disables the scroll strategy. */
    private _detach;
}

/** Scroll strategy that doesn't do anything. */
declare class NoopScrollStrategy implements ScrollStrategy {
    /** Does nothing, as this scroll strategy is a no-op. */
    enable(): void;
    /** Does nothing, as this scroll strategy is a no-op. */
    disable(): void;
    /** Does nothing, as this scroll strategy is a no-op. */
    attach(): void;
}

/**
 * Config options for the RepositionScrollStrategy.
 */
interface RepositionScrollStrategyConfig {
    /** Time in milliseconds to throttle the scroll events. */
    scrollThrottle?: number;
    /** Whether to close the overlay once the user has scrolled away completely. */
    autoClose?: boolean;
}
/**
 * Strategy that will update the element position as the user is scrolling.
 */
declare class RepositionScrollStrategy implements ScrollStrategy {
    private _scrollDispatcher;
    private _viewportRuler;
    private _ngZone;
    private _config?;
    private _scrollSubscription;
    private _overlayRef;
    constructor(_scrollDispatcher: ScrollDispatcher, _viewportRuler: ViewportRuler, _ngZone: NgZone, _config?: RepositionScrollStrategyConfig | undefined);
    /** Attaches this scroll strategy to an overlay. */
    attach(overlayRef: OverlayRef): void;
    /** Enables repositioning of the attached overlay on scroll. */
    enable(): void;
    /** Disables repositioning of the attached overlay on scroll. */
    disable(): void;
    detach(): void;
}

/**
 * Options for how an overlay will handle scrolling.
 *
 * Users can provide a custom value for `ScrollStrategyOptions` to replace the default
 * behaviors. This class primarily acts as a factory for ScrollStrategy instances.
 */
declare class ScrollStrategyOptions {
    private _scrollDispatcher;
    private _viewportRuler;
    private _ngZone;
    private _document;
    constructor(...args: unknown[]);
    /** Do nothing on scroll. */
    noop: () => NoopScrollStrategy;
    /**
     * Close the overlay as soon as the user scrolls.
     * @param config Configuration to be used inside the scroll strategy.
     */
    close: (config?: CloseScrollStrategyConfig) => CloseScrollStrategy;
    /** Block scrolling. */
    block: () => BlockScrollStrategy;
    /**
     * Update the overlay's position on scroll.
     * @param config Configuration to be used inside the scroll strategy.
     * Allows debouncing the reposition calls.
     */
    reposition: (config?: RepositionScrollStrategyConfig) => RepositionScrollStrategy;
    static ɵfac: i0.ɵɵFactoryDeclaration<ScrollStrategyOptions, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<ScrollStrategyOptions>;
}

/**
 * A strategy for positioning overlays. Using this strategy, an overlay is given an
 * explicit position relative to the browser's viewport. We use flexbox, instead of
 * transforms, in order to avoid issues with subpixel rendering which can cause the
 * element to become blurry.
 */
declare class GlobalPositionStrategy implements PositionStrategy {
    /** The overlay to which this strategy is attached. */
    private _overlayRef;
    private _cssPosition;
    private _topOffset;
    private _bottomOffset;
    private _alignItems;
    private _xPosition;
    private _xOffset;
    private _width;
    private _height;
    private _isDisposed;
    attach(overlayRef: OverlayRef): void;
    /**
     * Sets the top position of the overlay. Clears any previously set vertical position.
     * @param value New top offset.
     */
    top(value?: string): this;
    /**
     * Sets the left position of the overlay. Clears any previously set horizontal position.
     * @param value New left offset.
     */
    left(value?: string): this;
    /**
     * Sets the bottom position of the overlay. Clears any previously set vertical position.
     * @param value New bottom offset.
     */
    bottom(value?: string): this;
    /**
     * Sets the right position of the overlay. Clears any previously set horizontal position.
     * @param value New right offset.
     */
    right(value?: string): this;
    /**
     * Sets the overlay to the start of the viewport, depending on the overlay direction.
     * This will be to the left in LTR layouts and to the right in RTL.
     * @param offset Offset from the edge of the screen.
     */
    start(value?: string): this;
    /**
     * Sets the overlay to the end of the viewport, depending on the overlay direction.
     * This will be to the right in LTR layouts and to the left in RTL.
     * @param offset Offset from the edge of the screen.
     */
    end(value?: string): this;
    /**
     * Sets the overlay width and clears any previously set width.
     * @param value New width for the overlay
     * @deprecated Pass the `width` through the `OverlayConfig`.
     * @breaking-change 8.0.0
     */
    width(value?: string): this;
    /**
     * Sets the overlay height and clears any previously set height.
     * @param value New height for the overlay
     * @deprecated Pass the `height` through the `OverlayConfig`.
     * @breaking-change 8.0.0
     */
    height(value?: string): this;
    /**
     * Centers the overlay horizontally with an optional offset.
     * Clears any previously set horizontal position.
     *
     * @param offset Overlay offset from the horizontal center.
     */
    centerHorizontally(offset?: string): this;
    /**
     * Centers the overlay vertically with an optional offset.
     * Clears any previously set vertical position.
     *
     * @param offset Overlay offset from the vertical center.
     */
    centerVertically(offset?: string): this;
    /**
     * Apply the position to the element.
     * @docs-private
     */
    apply(): void;
    /**
     * Cleans up the DOM changes from the position strategy.
     * @docs-private
     */
    dispose(): void;
}

/** Builder for overlay position strategy. */
declare class OverlayPositionBuilder {
    private _viewportRuler;
    private _document;
    private _platform;
    private _overlayContainer;
    constructor(...args: unknown[]);
    /**
     * Creates a global position strategy.
     */
    global(): GlobalPositionStrategy;
    /**
     * Creates a flexible position strategy.
     * @param origin Origin relative to which to position the overlay.
     */
    flexibleConnectedTo(origin: FlexibleConnectedPositionStrategyOrigin): FlexibleConnectedPositionStrategy;
    static ɵfac: i0.ɵɵFactoryDeclaration<OverlayPositionBuilder, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<OverlayPositionBuilder>;
}

/**
 * Service to create Overlays. Overlays are dynamically added pieces of floating UI, meant to be
 * used as a low-level building block for other components. Dialogs, tooltips, menus,
 * selects, etc. can all be built using overlays. The service should primarily be used by authors
 * of re-usable components rather than developers building end-user applications.
 *
 * An overlay *is* a PortalOutlet, so any kind of Portal can be loaded into one.
 */
declare class Overlay {
    scrollStrategies: ScrollStrategyOptions;
    private _overlayContainer;
    private _positionBuilder;
    private _keyboardDispatcher;
    private _injector;
    private _ngZone;
    private _document;
    private _directionality;
    private _location;
    private _outsideClickDispatcher;
    private _animationsModuleType;
    private _idGenerator;
    private _renderer;
    private _appRef;
    private _styleLoader;
    constructor(...args: unknown[]);
    /**
     * Creates an overlay.
     * @param config Configuration applied to the overlay.
     * @returns Reference to the created overlay.
     */
    create(config?: OverlayConfig): OverlayRef;
    /**
     * Gets a position builder that can be used, via fluent API,
     * to construct and configure a position strategy.
     * @returns An overlay position builder.
     */
    position(): OverlayPositionBuilder;
    /**
     * Creates the DOM element for an overlay and appends it to the overlay container.
     * @returns Newly-created pane element
     */
    private _createPaneElement;
    /**
     * Creates the host element that wraps around an overlay
     * and can be used for advanced positioning.
     * @returns Newly-create host element.
     */
    private _createHostElement;
    /**
     * Create a DomPortalOutlet into which the overlay content can be loaded.
     * @param pane The DOM element to turn into a portal outlet.
     * @returns A portal outlet for the given DOM element.
     */
    private _createPortalOutlet;
    static ɵfac: i0.ɵɵFactoryDeclaration<Overlay, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<Overlay>;
}

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

export { BlockScrollStrategy, CloseScrollStrategy, FullscreenOverlayContainer, GlobalPositionStrategy, NoopScrollStrategy, Overlay, OverlayPositionBuilder, RepositionScrollStrategy, ScrollStrategyOptions };
export type { RepositionScrollStrategyConfig };
