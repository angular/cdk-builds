export { b as CdkFixedSizeVirtualScroll, C as CdkScrollable, a as CdkScrollableModule, c as CdkVirtualForOf, r as CdkVirtualForOfContext, t as CdkVirtualScrollRepeater, d as CdkVirtualScrollViewport, v as CdkVirtualScrollable, f as CdkVirtualScrollableElement, e as CdkVirtualScrollableWindow, D as DEFAULT_SCROLL_TIME, E as ExtendedScrollToOptions, F as FixedSizeVirtualScrollStrategy, S as ScrollDispatcher, g as ScrollingModule, u as VIRTUAL_SCROLLABLE, V as VIRTUAL_SCROLL_STRATEGY, s as VirtualScrollStrategy, k as _Bottom, o as _End, l as _Left, m as _Right, n as _Start, j as _Top, h as _Without, p as _XAxis, i as _XOR, q as _YAxis, _ as _fixedSizeVirtualScrollStrategyFactory } from '../scrolling-module.d-ud2XrbF8.js';
import * as i0 from '@angular/core';
import { OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
export { b as ɵɵDir } from '../bidi-module.d-D-fEBKdS.js';
import '../data-source.d-Bblv7Zvh.js';
import '../number-property.d-CJVxXUcb.js';

/** Time in ms to throttle the resize events by default. */
declare const DEFAULT_RESIZE_TIME = 20;
/** Object that holds the scroll position of the viewport in each direction. */
interface ViewportScrollPosition {
    top: number;
    left: number;
}
/**
 * Simple utility for getting the bounds of the browser viewport.
 * @docs-private
 */
declare class ViewportRuler implements OnDestroy {
    private _platform;
    private _listeners;
    /** Cached viewport dimensions. */
    private _viewportSize;
    /** Stream of viewport change events. */
    private readonly _change;
    /** Used to reference correct document/window */
    protected _document: Document;
    constructor(...args: unknown[]);
    ngOnDestroy(): void;
    /** Returns the viewport's width and height. */
    getViewportSize(): Readonly<{
        width: number;
        height: number;
    }>;
    /** Gets a DOMRect for the viewport's bounds. */
    getViewportRect(): {
        top: number;
        left: number;
        bottom: number;
        right: number;
        height: number;
        width: number;
    };
    /** Gets the (top, left) scroll position of the viewport. */
    getViewportScrollPosition(): ViewportScrollPosition;
    /**
     * Returns a stream that emits whenever the size of the viewport changes.
     * This stream emits outside of the Angular zone.
     * @param throttleTime Time in milliseconds to throttle the stream.
     */
    change(throttleTime?: number): Observable<Event>;
    /** Use defaultView of injected document if available or fallback to global window reference */
    private _getWindow;
    /** Updates the cached viewport size. */
    private _updateViewportSize;
    static ɵfac: i0.ɵɵFactoryDeclaration<ViewportRuler, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<ViewportRuler>;
}

export { DEFAULT_RESIZE_TIME, ViewportRuler };
export type { ViewportScrollPosition };
