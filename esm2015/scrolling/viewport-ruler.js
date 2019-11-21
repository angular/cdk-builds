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
import { Platform } from '@angular/cdk/platform';
import { Injectable, NgZone } from '@angular/core';
import { merge, of as observableOf, fromEvent } from 'rxjs';
import { auditTime } from 'rxjs/operators';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
/**
 * Time in ms to throttle the resize events by default.
 * @type {?}
 */
export const DEFAULT_RESIZE_TIME = 20;
/**
 * Object that holds the scroll position of the viewport in each direction.
 * @record
 */
export function ViewportScrollPosition() { }
if (false) {
    /** @type {?} */
    ViewportScrollPosition.prototype.top;
    /** @type {?} */
    ViewportScrollPosition.prototype.left;
}
/**
 * Simple utility for getting the bounds of the browser viewport.
 * \@docs-private
 */
export class ViewportRuler {
    /**
     * @param {?} _platform
     * @param {?} ngZone
     */
    constructor(_platform, ngZone) {
        this._platform = _platform;
        ngZone.runOutsideAngular((/**
         * @return {?}
         */
        () => {
            this._change = _platform.isBrowser ?
                merge(fromEvent(window, 'resize'), fromEvent(window, 'orientationchange')) :
                observableOf();
            // Note that we need to do the subscription inside `runOutsideAngular`
            // since subscribing is what causes the event listener to be added.
            this._invalidateCache = this.change().subscribe((/**
             * @return {?}
             */
            () => this._updateViewportSize()));
        }));
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        this._invalidateCache.unsubscribe();
    }
    /**
     * Returns the viewport's width and height.
     * @return {?}
     */
    getViewportSize() {
        if (!this._viewportSize) {
            this._updateViewportSize();
        }
        /** @type {?} */
        const output = { width: this._viewportSize.width, height: this._viewportSize.height };
        // If we're not on a browser, don't cache the size since it'll be mocked out anyway.
        if (!this._platform.isBrowser) {
            this._viewportSize = (/** @type {?} */ (null));
        }
        return output;
    }
    /**
     * Gets a ClientRect for the viewport's bounds.
     * @return {?}
     */
    getViewportRect() {
        // Use the document element's bounding rect rather than the window scroll properties
        // (e.g. pageYOffset, scrollY) due to in issue in Chrome and IE where window scroll
        // properties and client coordinates (boundingClientRect, clientX/Y, etc.) are in different
        // conceptual viewports. Under most circumstances these viewports are equivalent, but they
        // can disagree when the page is pinch-zoomed (on devices that support touch).
        // See https://bugs.chromium.org/p/chromium/issues/detail?id=489206#c4
        // We use the documentElement instead of the body because, by default (without a css reset)
        // browsers typically give the document body an 8px margin, which is not included in
        // getBoundingClientRect().
        /** @type {?} */
        const scrollPosition = this.getViewportScrollPosition();
        const { width, height } = this.getViewportSize();
        return {
            top: scrollPosition.top,
            left: scrollPosition.left,
            bottom: scrollPosition.top + height,
            right: scrollPosition.left + width,
            height,
            width,
        };
    }
    /**
     * Gets the (top, left) scroll position of the viewport.
     * @return {?}
     */
    getViewportScrollPosition() {
        // While we can get a reference to the fake document
        // during SSR, it doesn't have getBoundingClientRect.
        if (!this._platform.isBrowser) {
            return { top: 0, left: 0 };
        }
        // The top-left-corner of the viewport is determined by the scroll position of the document
        // body, normally just (scrollLeft, scrollTop). However, Chrome and Firefox disagree about
        // whether `document.body` or `document.documentElement` is the scrolled element, so reading
        // `scrollTop` and `scrollLeft` is inconsistent. However, using the bounding rect of
        // `document.documentElement` works consistently, where the `top` and `left` values will
        // equal negative the scroll position.
        /** @type {?} */
        const documentElement = (/** @type {?} */ (document.documentElement));
        /** @type {?} */
        const documentRect = documentElement.getBoundingClientRect();
        /** @type {?} */
        const top = -documentRect.top || document.body.scrollTop || window.scrollY ||
            documentElement.scrollTop || 0;
        /** @type {?} */
        const left = -documentRect.left || document.body.scrollLeft || window.scrollX ||
            documentElement.scrollLeft || 0;
        return { top, left };
    }
    /**
     * Returns a stream that emits whenever the size of the viewport changes.
     * @param {?=} throttleTime Time in milliseconds to throttle the stream.
     * @return {?}
     */
    change(throttleTime = DEFAULT_RESIZE_TIME) {
        return throttleTime > 0 ? this._change.pipe(auditTime(throttleTime)) : this._change;
    }
    /**
     * Updates the cached viewport size.
     * @private
     * @return {?}
     */
    _updateViewportSize() {
        this._viewportSize = this._platform.isBrowser ?
            { width: window.innerWidth, height: window.innerHeight } :
            { width: 0, height: 0 };
    }
}
ViewportRuler.decorators = [
    { type: Injectable, args: [{ providedIn: 'root' },] }
];
/** @nocollapse */
ViewportRuler.ctorParameters = () => [
    { type: Platform },
    { type: NgZone }
];
/** @nocollapse */ ViewportRuler.ɵprov = i0.ɵɵdefineInjectable({ factory: function ViewportRuler_Factory() { return new ViewportRuler(i0.ɵɵinject(i1.Platform), i0.ɵɵinject(i0.NgZone)); }, token: ViewportRuler, providedIn: "root" });
if (false) {
    /**
     * Cached viewport dimensions.
     * @type {?}
     * @private
     */
    ViewportRuler.prototype._viewportSize;
    /**
     * Stream of viewport change events.
     * @type {?}
     * @private
     */
    ViewportRuler.prototype._change;
    /**
     * Subscription to streams that invalidate the cached viewport dimensions.
     * @type {?}
     * @private
     */
    ViewportRuler.prototype._invalidateCache;
    /**
     * @type {?}
     * @private
     */
    ViewportRuler.prototype._platform;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld3BvcnQtcnVsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy92aWV3cG9ydC1ydWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQyxPQUFPLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBWSxNQUFNLGVBQWUsQ0FBQztBQUM1RCxPQUFPLEVBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxZQUFZLEVBQUUsU0FBUyxFQUEyQixNQUFNLE1BQU0sQ0FBQztBQUNwRixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7Ozs7Ozs7QUFHekMsTUFBTSxPQUFPLG1CQUFtQixHQUFHLEVBQUU7Ozs7O0FBR3JDLDRDQUdDOzs7SUFGQyxxQ0FBWTs7SUFDWixzQ0FBYTs7Ozs7O0FBUWYsTUFBTSxPQUFPLGFBQWE7Ozs7O0lBVXhCLFlBQW9CLFNBQW1CLEVBQUUsTUFBYztRQUFuQyxjQUFTLEdBQVQsU0FBUyxDQUFVO1FBQ3JDLE1BQU0sQ0FBQyxpQkFBaUI7OztRQUFDLEdBQUcsRUFBRTtZQUM1QixJQUFJLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDaEMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLEVBQUUsU0FBUyxDQUFDLE1BQU0sRUFBRSxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDNUUsWUFBWSxFQUFFLENBQUM7WUFFbkIsc0VBQXNFO1lBQ3RFLG1FQUFtRTtZQUNuRSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLFNBQVM7OztZQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxFQUFDLENBQUM7UUFDcEYsQ0FBQyxFQUFDLENBQUM7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Y2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtQbGF0Zm9ybX0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7SW5qZWN0YWJsZSwgTmdab25lLCBPbkRlc3Ryb3l9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHttZXJnZSwgb2YgYXMgb2JzZXJ2YWJsZU9mLCBmcm9tRXZlbnQsIE9ic2VydmFibGUsIFN1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2F1ZGl0VGltZX0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG4vKiogVGltZSBpbiBtcyB0byB0aHJvdHRsZSB0aGUgcmVzaXplIGV2ZW50cyBieSBkZWZhdWx0LiAqL1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfUkVTSVpFX1RJTUUgPSAyMDtcblxuLyoqIE9iamVjdCB0aGF0IGhvbGRzIHRoZSBzY3JvbGwgcG9zaXRpb24gb2YgdGhlIHZpZXdwb3J0IGluIGVhY2ggZGlyZWN0aW9uLiAqL1xuZXhwb3J0IGludGVyZmFjZSBWaWV3cG9ydFNjcm9sbFBvc2l0aW9uIHtcbiAgdG9wOiBudW1iZXI7XG4gIGxlZnQ6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBTaW1wbGUgdXRpbGl0eSBmb3IgZ2V0dGluZyB0aGUgYm91bmRzIG9mIHRoZSBicm93c2VyIHZpZXdwb3J0LlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBWaWV3cG9ydFJ1bGVyIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIENhY2hlZCB2aWV3cG9ydCBkaW1lbnNpb25zLiAqL1xuICBwcml2YXRlIF92aWV3cG9ydFNpemU6IHt3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlcn07XG5cbiAgLyoqIFN0cmVhbSBvZiB2aWV3cG9ydCBjaGFuZ2UgZXZlbnRzLiAqL1xuICBwcml2YXRlIF9jaGFuZ2U6IE9ic2VydmFibGU8RXZlbnQ+O1xuXG4gIC8qKiBTdWJzY3JpcHRpb24gdG8gc3RyZWFtcyB0aGF0IGludmFsaWRhdGUgdGhlIGNhY2hlZCB2aWV3cG9ydCBkaW1lbnNpb25zLiAqL1xuICBwcml2YXRlIF9pbnZhbGlkYXRlQ2FjaGU6IFN1YnNjcmlwdGlvbjtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9wbGF0Zm9ybTogUGxhdGZvcm0sIG5nWm9uZTogTmdab25lKSB7XG4gICAgbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHRoaXMuX2NoYW5nZSA9IF9wbGF0Zm9ybS5pc0Jyb3dzZXIgP1xuICAgICAgICAgIG1lcmdlKGZyb21FdmVudCh3aW5kb3csICdyZXNpemUnKSwgZnJvbUV2ZW50KHdpbmRvdywgJ29yaWVudGF0aW9uY2hhbmdlJykpIDpcbiAgICAgICAgICBvYnNlcnZhYmxlT2YoKTtcblxuICAgICAgLy8gTm90ZSB0aGF0IHdlIG5lZWQgdG8gZG8gdGhlIHN1YnNjcmlwdGlvbiBpbnNpZGUgYHJ1bk91dHNpZGVBbmd1bGFyYFxuICAgICAgLy8gc2luY2Ugc3Vic2NyaWJpbmcgaXMgd2hhdCBjYXVzZXMgdGhlIGV2ZW50IGxpc3RlbmVyIHRvIGJlIGFkZGVkLlxuICAgICAgdGhpcy5faW52YWxpZGF0ZUNhY2hlID0gdGhpcy5jaGFuZ2UoKS5zdWJzY3JpYmUoKCkgPT4gdGhpcy5fdXBkYXRlVmlld3BvcnRTaXplKCkpO1xuICAgIH0pO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5faW52YWxpZGF0ZUNhY2hlLnVuc3Vic2NyaWJlKCk7XG4gIH1cblxuICAvKiogUmV0dXJucyB0aGUgdmlld3BvcnQncyB3aWR0aCBhbmQgaGVpZ2h0LiAqL1xuICBnZXRWaWV3cG9ydFNpemUoKTogUmVhZG9ubHk8e3dpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyfT4ge1xuICAgIGlmICghdGhpcy5fdmlld3BvcnRTaXplKSB7XG4gICAgICB0aGlzLl91cGRhdGVWaWV3cG9ydFNpemUoKTtcbiAgICB9XG5cbiAgICBjb25zdCBvdXRwdXQgPSB7d2lkdGg6IHRoaXMuX3ZpZXdwb3J0U2l6ZS53aWR0aCwgaGVpZ2h0OiB0aGlzLl92aWV3cG9ydFNpemUuaGVpZ2h0fTtcblxuICAgIC8vIElmIHdlJ3JlIG5vdCBvbiBhIGJyb3dzZXIsIGRvbid0IGNhY2hlIHRoZSBzaXplIHNpbmNlIGl0J2xsIGJlIG1vY2tlZCBvdXQgYW55d2F5LlxuICAgIGlmICghdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICB0aGlzLl92aWV3cG9ydFNpemUgPSBudWxsITtcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0cHV0O1xuICB9XG5cbiAgLyoqIEdldHMgYSBDbGllbnRSZWN0IGZvciB0aGUgdmlld3BvcnQncyBib3VuZHMuICovXG4gIGdldFZpZXdwb3J0UmVjdCgpOiBDbGllbnRSZWN0IHtcbiAgICAvLyBVc2UgdGhlIGRvY3VtZW50IGVsZW1lbnQncyBib3VuZGluZyByZWN0IHJhdGhlciB0aGFuIHRoZSB3aW5kb3cgc2Nyb2xsIHByb3BlcnRpZXNcbiAgICAvLyAoZS5nLiBwYWdlWU9mZnNldCwgc2Nyb2xsWSkgZHVlIHRvIGluIGlzc3VlIGluIENocm9tZSBhbmQgSUUgd2hlcmUgd2luZG93IHNjcm9sbFxuICAgIC8vIHByb3BlcnRpZXMgYW5kIGNsaWVudCBjb29yZGluYXRlcyAoYm91bmRpbmdDbGllbnRSZWN0LCBjbGllbnRYL1ksIGV0Yy4pIGFyZSBpbiBkaWZmZXJlbnRcbiAgICAvLyBjb25jZXB0dWFsIHZpZXdwb3J0cy4gVW5kZXIgbW9zdCBjaXJjdW1zdGFuY2VzIHRoZXNlIHZpZXdwb3J0cyBhcmUgZXF1aXZhbGVudCwgYnV0IHRoZXlcbiAgICAvLyBjYW4gZGlzYWdyZWUgd2hlbiB0aGUgcGFnZSBpcyBwaW5jaC16b29tZWQgKG9uIGRldmljZXMgdGhhdCBzdXBwb3J0IHRvdWNoKS5cbiAgICAvLyBTZWUgaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL2Nocm9taXVtL2lzc3Vlcy9kZXRhaWw/aWQ9NDg5MjA2I2M0XG4gICAgLy8gV2UgdXNlIHRoZSBkb2N1bWVudEVsZW1lbnQgaW5zdGVhZCBvZiB0aGUgYm9keSBiZWNhdXNlLCBieSBkZWZhdWx0ICh3aXRob3V0IGEgY3NzIHJlc2V0KVxuICAgIC8vIGJyb3dzZXJzIHR5cGljYWxseSBnaXZlIHRoZSBkb2N1bWVudCBib2R5IGFuIDhweCBtYXJnaW4sIHdoaWNoIGlzIG5vdCBpbmNsdWRlZCBpblxuICAgIC8vIGdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLlxuICAgIGNvbnN0IHNjcm9sbFBvc2l0aW9uID0gdGhpcy5nZXRWaWV3cG9ydFNjcm9sbFBvc2l0aW9uKCk7XG4gICAgY29uc3Qge3dpZHRoLCBoZWlnaHR9ID0gdGhpcy5nZXRWaWV3cG9ydFNpemUoKTtcblxuICAgIHJldHVybiB7XG4gICAgICB0b3A6IHNjcm9sbFBvc2l0aW9uLnRvcCxcbiAgICAgIGxlZnQ6IHNjcm9sbFBvc2l0aW9uLmxlZnQsXG4gICAgICBib3R0b206IHNjcm9sbFBvc2l0aW9uLnRvcCArIGhlaWdodCxcbiAgICAgIHJpZ2h0OiBzY3JvbGxQb3NpdGlvbi5sZWZ0ICsgd2lkdGgsXG4gICAgICBoZWlnaHQsXG4gICAgICB3aWR0aCxcbiAgICB9O1xuICB9XG5cbiAgLyoqIEdldHMgdGhlICh0b3AsIGxlZnQpIHNjcm9sbCBwb3NpdGlvbiBvZiB0aGUgdmlld3BvcnQuICovXG4gIGdldFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24oKTogVmlld3BvcnRTY3JvbGxQb3NpdGlvbiB7XG4gICAgLy8gV2hpbGUgd2UgY2FuIGdldCBhIHJlZmVyZW5jZSB0byB0aGUgZmFrZSBkb2N1bWVudFxuICAgIC8vIGR1cmluZyBTU1IsIGl0IGRvZXNuJ3QgaGF2ZSBnZXRCb3VuZGluZ0NsaWVudFJlY3QuXG4gICAgaWYgKCF0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIpIHtcbiAgICAgIHJldHVybiB7dG9wOiAwLCBsZWZ0OiAwfTtcbiAgICB9XG5cbiAgICAvLyBUaGUgdG9wLWxlZnQtY29ybmVyIG9mIHRoZSB2aWV3cG9ydCBpcyBkZXRlcm1pbmVkIGJ5IHRoZSBzY3JvbGwgcG9zaXRpb24gb2YgdGhlIGRvY3VtZW50XG4gICAgLy8gYm9keSwgbm9ybWFsbHkganVzdCAoc2Nyb2xsTGVmdCwgc2Nyb2xsVG9wKS4gSG93ZXZlciwgQ2hyb21lIGFuZCBGaXJlZm94IGRpc2FncmVlIGFib3V0XG4gICAgLy8gd2hldGhlciBgZG9jdW1lbnQuYm9keWAgb3IgYGRvY3VtZW50LmRvY3VtZW50RWxlbWVudGAgaXMgdGhlIHNjcm9sbGVkIGVsZW1lbnQsIHNvIHJlYWRpbmdcbiAgICAvLyBgc2Nyb2xsVG9wYCBhbmQgYHNjcm9sbExlZnRgIGlzIGluY29uc2lzdGVudC4gSG93ZXZlciwgdXNpbmcgdGhlIGJvdW5kaW5nIHJlY3Qgb2ZcbiAgICAvLyBgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50YCB3b3JrcyBjb25zaXN0ZW50bHksIHdoZXJlIHRoZSBgdG9wYCBhbmQgYGxlZnRgIHZhbHVlcyB3aWxsXG4gICAgLy8gZXF1YWwgbmVnYXRpdmUgdGhlIHNjcm9sbCBwb3NpdGlvbi5cbiAgICBjb25zdCBkb2N1bWVudEVsZW1lbnQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQhO1xuICAgIGNvbnN0IGRvY3VtZW50UmVjdCA9IGRvY3VtZW50RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgIGNvbnN0IHRvcCA9IC1kb2N1bWVudFJlY3QudG9wIHx8IGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wIHx8IHdpbmRvdy5zY3JvbGxZIHx8XG4gICAgICAgICAgICAgICAgIGRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3AgfHwgMDtcblxuICAgIGNvbnN0IGxlZnQgPSAtZG9jdW1lbnRSZWN0LmxlZnQgfHwgZG9jdW1lbnQuYm9keS5zY3JvbGxMZWZ0IHx8IHdpbmRvdy5zY3JvbGxYIHx8XG4gICAgICAgICAgICAgICAgICBkb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdCB8fCAwO1xuXG4gICAgcmV0dXJuIHt0b3AsIGxlZnR9O1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBzdHJlYW0gdGhhdCBlbWl0cyB3aGVuZXZlciB0aGUgc2l6ZSBvZiB0aGUgdmlld3BvcnQgY2hhbmdlcy5cbiAgICogQHBhcmFtIHRocm90dGxlVGltZSBUaW1lIGluIG1pbGxpc2Vjb25kcyB0byB0aHJvdHRsZSB0aGUgc3RyZWFtLlxuICAgKi9cbiAgY2hhbmdlKHRocm90dGxlVGltZTogbnVtYmVyID0gREVGQVVMVF9SRVNJWkVfVElNRSk6IE9ic2VydmFibGU8RXZlbnQ+IHtcbiAgICByZXR1cm4gdGhyb3R0bGVUaW1lID4gMCA/IHRoaXMuX2NoYW5nZS5waXBlKGF1ZGl0VGltZSh0aHJvdHRsZVRpbWUpKSA6IHRoaXMuX2NoYW5nZTtcbiAgfVxuXG4gIC8qKiBVcGRhdGVzIHRoZSBjYWNoZWQgdmlld3BvcnQgc2l6ZS4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlVmlld3BvcnRTaXplKCkge1xuICAgIHRoaXMuX3ZpZXdwb3J0U2l6ZSA9IHRoaXMuX3BsYXRmb3JtLmlzQnJvd3NlciA/XG4gICAgICAgIHt3aWR0aDogd2luZG93LmlubmVyV2lkdGgsIGhlaWdodDogd2luZG93LmlubmVySGVpZ2h0fSA6XG4gICAgICAgIHt3aWR0aDogMCwgaGVpZ2h0OiAwfTtcbiAgfVxufVxuIl19