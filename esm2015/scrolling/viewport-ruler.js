/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/scrolling/viewport-ruler.ts
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
import { Injectable, NgZone, Optional, Inject } from '@angular/core';
import { merge, of as observableOf, fromEvent } from 'rxjs';
import { auditTime } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
import * as i2 from "@angular/common";
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
let ViewportRuler = /** @class */ (() => {
    /**
     * Simple utility for getting the bounds of the browser viewport.
     * \@docs-private
     */
    class ViewportRuler {
        /**
         * @param {?} _platform
         * @param {?} ngZone
         * @param {?=} document
         */
        constructor(_platform, ngZone, 
        /** @breaking-change 11.0.0 make document required */
        document) {
            this._platform = _platform;
            this._document = document;
            ngZone.runOutsideAngular((/**
             * @return {?}
             */
            () => {
                /** @type {?} */
                const window = this._getWindow();
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
            const document = this._getDocument();
            /** @type {?} */
            const window = this._getWindow();
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
         * Access injected document if available or fallback to global document reference
         * @private
         * @return {?}
         */
        _getDocument() {
            return this._document || document;
        }
        /**
         * Use defaultView of injected document if available or fallback to global window reference
         * @private
         * @return {?}
         */
        _getWindow() {
            /** @type {?} */
            const doc = this._getDocument();
            return doc.defaultView || window;
        }
        /**
         * Updates the cached viewport size.
         * @private
         * @return {?}
         */
        _updateViewportSize() {
            /** @type {?} */
            const window = this._getWindow();
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
        { type: NgZone },
        { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [DOCUMENT,] }] }
    ];
    /** @nocollapse */ ViewportRuler.ɵprov = i0.ɵɵdefineInjectable({ factory: function ViewportRuler_Factory() { return new ViewportRuler(i0.ɵɵinject(i1.Platform), i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i2.DOCUMENT, 8)); }, token: ViewportRuler, providedIn: "root" });
    return ViewportRuler;
})();
export { ViewportRuler };
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
     * Used to reference correct document/window
     * @type {?}
     * @protected
     */
    ViewportRuler.prototype._document;
    /**
     * @type {?}
     * @private
     */
    ViewportRuler.prototype._platform;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld3BvcnQtcnVsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy92aWV3cG9ydC1ydWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDL0MsT0FBTyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQWEsUUFBUSxFQUFFLE1BQU0sRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM5RSxPQUFPLEVBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxZQUFZLEVBQUUsU0FBUyxFQUEyQixNQUFNLE1BQU0sQ0FBQztBQUNwRixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDekMsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDOzs7Ozs7OztBQUd6QyxNQUFNLE9BQU8sbUJBQW1CLEdBQUcsRUFBRTs7Ozs7QUFHckMsNENBR0M7OztJQUZDLHFDQUFZOztJQUNaLHNDQUFhOzs7Ozs7QUFPZjs7Ozs7SUFBQSxNQUNhLGFBQWE7Ozs7OztRQWF4QixZQUFvQixTQUFtQixFQUMzQixNQUFjO1FBQ2QscURBQXFEO1FBQ3ZCLFFBQWM7WUFIcEMsY0FBUyxHQUFULFNBQVMsQ0FBVTtZQUlyQyxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztZQUUxQixNQUFNLENBQUMsaUJBQWlCOzs7WUFBQyxHQUFHLEVBQUU7O3NCQUN0QixNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRTtnQkFFaEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ2hDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxNQUFNLEVBQUUsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzVFLFlBQVksRUFBRSxDQUFDO2dCQUVuQixzRUFBc0U7Z0JBQ3RFLG1FQUFtRTtnQkFDbkUsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxTQUFTOzs7Z0JBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLEVBQUMsQ0FBQztZQUNwRixDQUFDLEVBQUMsQ0FBQztRQUNMLENBQUM7Ozs7UUFFRCxXQUFXO1lBQ1QsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3RDLENBQUM7Ozs7O1FBR0QsZUFBZTtZQUNiLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFO2dCQUN2QixJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQzthQUM1Qjs7a0JBRUssTUFBTSxHQUFHLEVBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBQztZQUVuRixvRkFBb0Y7WUFDcEYsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFO2dCQUM3QixJQUFJLENBQUMsYUFBYSxHQUFHLG1CQUFBLElBQUksRUFBQyxDQUFDO2FBQzVCO1lBRUQsT0FBTyxNQUFNLENBQUM7UUFDaEIsQ0FBQzs7Ozs7UUFHRCxlQUFlOzs7Ozs7Ozs7OztrQkFVUCxjQUFjLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixFQUFFO2tCQUNqRCxFQUFDLEtBQUssRUFBRSxNQUFNLEVBQUMsR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFO1lBRTlDLE9BQU87Z0JBQ0wsR0FBRyxFQUFFLGNBQWMsQ0FBQyxHQUFHO2dCQUN2QixJQUFJLEVBQUUsY0FBYyxDQUFDLElBQUk7Z0JBQ3pCLE1BQU0sRUFBRSxjQUFjLENBQUMsR0FBRyxHQUFHLE1BQU07Z0JBQ25DLEtBQUssRUFBRSxjQUFjLENBQUMsSUFBSSxHQUFHLEtBQUs7Z0JBQ2xDLE1BQU07Z0JBQ04sS0FBSzthQUNOLENBQUM7UUFDSixDQUFDOzs7OztRQUdELHlCQUF5QjtZQUN2QixvREFBb0Q7WUFDcEQscURBQXFEO1lBQ3JELElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRTtnQkFDN0IsT0FBTyxFQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBQyxDQUFDO2FBQzFCOzs7Ozs7OztrQkFRSyxRQUFRLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRTs7a0JBQzlCLE1BQU0sR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFOztrQkFDMUIsZUFBZSxHQUFHLG1CQUFBLFFBQVEsQ0FBQyxlQUFlLEVBQUM7O2tCQUMzQyxZQUFZLEdBQUcsZUFBZSxDQUFDLHFCQUFxQixFQUFFOztrQkFFdEQsR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDLEdBQUcsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxNQUFNLENBQUMsT0FBTztnQkFDN0QsZUFBZSxDQUFDLFNBQVMsSUFBSSxDQUFDOztrQkFFckMsSUFBSSxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxNQUFNLENBQUMsT0FBTztnQkFDL0QsZUFBZSxDQUFDLFVBQVUsSUFBSSxDQUFDO1lBRTdDLE9BQU8sRUFBQyxHQUFHLEVBQUUsSUFBSSxFQUFDLENBQUM7UUFDckIsQ0FBQzs7Ozs7O1FBTUQsTUFBTSxDQUFDLGVBQXVCLG1CQUFtQjtZQUMvQyxPQUFPLFlBQVksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ3RGLENBQUM7Ozs7OztRQUdPLFlBQVk7WUFDbEIsT0FBTyxJQUFJLENBQUMsU0FBUyxJQUFJLFFBQVEsQ0FBQztRQUNwQyxDQUFDOzs7Ozs7UUFHTyxVQUFVOztrQkFDVixHQUFHLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRTtZQUMvQixPQUFPLEdBQUcsQ0FBQyxXQUFXLElBQUksTUFBTSxDQUFDO1FBQ25DLENBQUM7Ozs7OztRQUdPLG1CQUFtQjs7a0JBQ25CLE1BQU0sR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ2hDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDM0MsRUFBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLFdBQVcsRUFBQyxDQUFDLENBQUM7Z0JBQ3hELEVBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFDLENBQUM7UUFDNUIsQ0FBQzs7O2dCQWxJRixVQUFVLFNBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzs7O2dCQW5CeEIsUUFBUTtnQkFDSSxNQUFNO2dEQW1DWCxRQUFRLFlBQUksTUFBTSxTQUFDLFFBQVE7Ozt3QkE1QzFDO0tBOEpDO1NBbElZLGFBQWE7Ozs7Ozs7SUFFeEIsc0NBQXVEOzs7Ozs7SUFHdkQsZ0NBQW1DOzs7Ozs7SUFHbkMseUNBQXVDOzs7Ozs7SUFHdkMsa0NBQStCOzs7OztJQUVuQixrQ0FBMkIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtQbGF0Zm9ybX0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7SW5qZWN0YWJsZSwgTmdab25lLCBPbkRlc3Ryb3ksIE9wdGlvbmFsLCBJbmplY3R9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHttZXJnZSwgb2YgYXMgb2JzZXJ2YWJsZU9mLCBmcm9tRXZlbnQsIE9ic2VydmFibGUsIFN1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2F1ZGl0VGltZX0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcblxuLyoqIFRpbWUgaW4gbXMgdG8gdGhyb3R0bGUgdGhlIHJlc2l6ZSBldmVudHMgYnkgZGVmYXVsdC4gKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX1JFU0laRV9USU1FID0gMjA7XG5cbi8qKiBPYmplY3QgdGhhdCBob2xkcyB0aGUgc2Nyb2xsIHBvc2l0aW9uIG9mIHRoZSB2aWV3cG9ydCBpbiBlYWNoIGRpcmVjdGlvbi4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVmlld3BvcnRTY3JvbGxQb3NpdGlvbiB7XG4gIHRvcDogbnVtYmVyO1xuICBsZWZ0OiBudW1iZXI7XG59XG5cbi8qKlxuICogU2ltcGxlIHV0aWxpdHkgZm9yIGdldHRpbmcgdGhlIGJvdW5kcyBvZiB0aGUgYnJvd3NlciB2aWV3cG9ydC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgVmlld3BvcnRSdWxlciBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qKiBDYWNoZWQgdmlld3BvcnQgZGltZW5zaW9ucy4gKi9cbiAgcHJpdmF0ZSBfdmlld3BvcnRTaXplOiB7d2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXJ9O1xuXG4gIC8qKiBTdHJlYW0gb2Ygdmlld3BvcnQgY2hhbmdlIGV2ZW50cy4gKi9cbiAgcHJpdmF0ZSBfY2hhbmdlOiBPYnNlcnZhYmxlPEV2ZW50PjtcblxuICAvKiogU3Vic2NyaXB0aW9uIHRvIHN0cmVhbXMgdGhhdCBpbnZhbGlkYXRlIHRoZSBjYWNoZWQgdmlld3BvcnQgZGltZW5zaW9ucy4gKi9cbiAgcHJpdmF0ZSBfaW52YWxpZGF0ZUNhY2hlOiBTdWJzY3JpcHRpb247XG5cbiAgLyoqIFVzZWQgdG8gcmVmZXJlbmNlIGNvcnJlY3QgZG9jdW1lbnQvd2luZG93ICovXG4gIHByb3RlY3RlZCBfZG9jdW1lbnQ/OiBEb2N1bWVudDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9wbGF0Zm9ybTogUGxhdGZvcm0sXG4gICAgICAgICAgICAgIG5nWm9uZTogTmdab25lLFxuICAgICAgICAgICAgICAvKiogQGJyZWFraW5nLWNoYW5nZSAxMS4wLjAgbWFrZSBkb2N1bWVudCByZXF1aXJlZCAqL1xuICAgICAgICAgICAgICBAT3B0aW9uYWwoKSBASW5qZWN0KERPQ1VNRU5UKSBkb2N1bWVudD86IGFueSkge1xuICAgIHRoaXMuX2RvY3VtZW50ID0gZG9jdW1lbnQ7XG5cbiAgICBuZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgY29uc3Qgd2luZG93ID0gdGhpcy5fZ2V0V2luZG93KCk7XG5cbiAgICAgIHRoaXMuX2NoYW5nZSA9IF9wbGF0Zm9ybS5pc0Jyb3dzZXIgP1xuICAgICAgICAgIG1lcmdlKGZyb21FdmVudCh3aW5kb3csICdyZXNpemUnKSwgZnJvbUV2ZW50KHdpbmRvdywgJ29yaWVudGF0aW9uY2hhbmdlJykpIDpcbiAgICAgICAgICBvYnNlcnZhYmxlT2YoKTtcblxuICAgICAgLy8gTm90ZSB0aGF0IHdlIG5lZWQgdG8gZG8gdGhlIHN1YnNjcmlwdGlvbiBpbnNpZGUgYHJ1bk91dHNpZGVBbmd1bGFyYFxuICAgICAgLy8gc2luY2Ugc3Vic2NyaWJpbmcgaXMgd2hhdCBjYXVzZXMgdGhlIGV2ZW50IGxpc3RlbmVyIHRvIGJlIGFkZGVkLlxuICAgICAgdGhpcy5faW52YWxpZGF0ZUNhY2hlID0gdGhpcy5jaGFuZ2UoKS5zdWJzY3JpYmUoKCkgPT4gdGhpcy5fdXBkYXRlVmlld3BvcnRTaXplKCkpO1xuICAgIH0pO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5faW52YWxpZGF0ZUNhY2hlLnVuc3Vic2NyaWJlKCk7XG4gIH1cblxuICAvKiogUmV0dXJucyB0aGUgdmlld3BvcnQncyB3aWR0aCBhbmQgaGVpZ2h0LiAqL1xuICBnZXRWaWV3cG9ydFNpemUoKTogUmVhZG9ubHk8e3dpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyfT4ge1xuICAgIGlmICghdGhpcy5fdmlld3BvcnRTaXplKSB7XG4gICAgICB0aGlzLl91cGRhdGVWaWV3cG9ydFNpemUoKTtcbiAgICB9XG5cbiAgICBjb25zdCBvdXRwdXQgPSB7d2lkdGg6IHRoaXMuX3ZpZXdwb3J0U2l6ZS53aWR0aCwgaGVpZ2h0OiB0aGlzLl92aWV3cG9ydFNpemUuaGVpZ2h0fTtcblxuICAgIC8vIElmIHdlJ3JlIG5vdCBvbiBhIGJyb3dzZXIsIGRvbid0IGNhY2hlIHRoZSBzaXplIHNpbmNlIGl0J2xsIGJlIG1vY2tlZCBvdXQgYW55d2F5LlxuICAgIGlmICghdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICB0aGlzLl92aWV3cG9ydFNpemUgPSBudWxsITtcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0cHV0O1xuICB9XG5cbiAgLyoqIEdldHMgYSBDbGllbnRSZWN0IGZvciB0aGUgdmlld3BvcnQncyBib3VuZHMuICovXG4gIGdldFZpZXdwb3J0UmVjdCgpOiBDbGllbnRSZWN0IHtcbiAgICAvLyBVc2UgdGhlIGRvY3VtZW50IGVsZW1lbnQncyBib3VuZGluZyByZWN0IHJhdGhlciB0aGFuIHRoZSB3aW5kb3cgc2Nyb2xsIHByb3BlcnRpZXNcbiAgICAvLyAoZS5nLiBwYWdlWU9mZnNldCwgc2Nyb2xsWSkgZHVlIHRvIGluIGlzc3VlIGluIENocm9tZSBhbmQgSUUgd2hlcmUgd2luZG93IHNjcm9sbFxuICAgIC8vIHByb3BlcnRpZXMgYW5kIGNsaWVudCBjb29yZGluYXRlcyAoYm91bmRpbmdDbGllbnRSZWN0LCBjbGllbnRYL1ksIGV0Yy4pIGFyZSBpbiBkaWZmZXJlbnRcbiAgICAvLyBjb25jZXB0dWFsIHZpZXdwb3J0cy4gVW5kZXIgbW9zdCBjaXJjdW1zdGFuY2VzIHRoZXNlIHZpZXdwb3J0cyBhcmUgZXF1aXZhbGVudCwgYnV0IHRoZXlcbiAgICAvLyBjYW4gZGlzYWdyZWUgd2hlbiB0aGUgcGFnZSBpcyBwaW5jaC16b29tZWQgKG9uIGRldmljZXMgdGhhdCBzdXBwb3J0IHRvdWNoKS5cbiAgICAvLyBTZWUgaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL2Nocm9taXVtL2lzc3Vlcy9kZXRhaWw/aWQ9NDg5MjA2I2M0XG4gICAgLy8gV2UgdXNlIHRoZSBkb2N1bWVudEVsZW1lbnQgaW5zdGVhZCBvZiB0aGUgYm9keSBiZWNhdXNlLCBieSBkZWZhdWx0ICh3aXRob3V0IGEgY3NzIHJlc2V0KVxuICAgIC8vIGJyb3dzZXJzIHR5cGljYWxseSBnaXZlIHRoZSBkb2N1bWVudCBib2R5IGFuIDhweCBtYXJnaW4sIHdoaWNoIGlzIG5vdCBpbmNsdWRlZCBpblxuICAgIC8vIGdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLlxuICAgIGNvbnN0IHNjcm9sbFBvc2l0aW9uID0gdGhpcy5nZXRWaWV3cG9ydFNjcm9sbFBvc2l0aW9uKCk7XG4gICAgY29uc3Qge3dpZHRoLCBoZWlnaHR9ID0gdGhpcy5nZXRWaWV3cG9ydFNpemUoKTtcblxuICAgIHJldHVybiB7XG4gICAgICB0b3A6IHNjcm9sbFBvc2l0aW9uLnRvcCxcbiAgICAgIGxlZnQ6IHNjcm9sbFBvc2l0aW9uLmxlZnQsXG4gICAgICBib3R0b206IHNjcm9sbFBvc2l0aW9uLnRvcCArIGhlaWdodCxcbiAgICAgIHJpZ2h0OiBzY3JvbGxQb3NpdGlvbi5sZWZ0ICsgd2lkdGgsXG4gICAgICBoZWlnaHQsXG4gICAgICB3aWR0aCxcbiAgICB9O1xuICB9XG5cbiAgLyoqIEdldHMgdGhlICh0b3AsIGxlZnQpIHNjcm9sbCBwb3NpdGlvbiBvZiB0aGUgdmlld3BvcnQuICovXG4gIGdldFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24oKTogVmlld3BvcnRTY3JvbGxQb3NpdGlvbiB7XG4gICAgLy8gV2hpbGUgd2UgY2FuIGdldCBhIHJlZmVyZW5jZSB0byB0aGUgZmFrZSBkb2N1bWVudFxuICAgIC8vIGR1cmluZyBTU1IsIGl0IGRvZXNuJ3QgaGF2ZSBnZXRCb3VuZGluZ0NsaWVudFJlY3QuXG4gICAgaWYgKCF0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIpIHtcbiAgICAgIHJldHVybiB7dG9wOiAwLCBsZWZ0OiAwfTtcbiAgICB9XG5cbiAgICAvLyBUaGUgdG9wLWxlZnQtY29ybmVyIG9mIHRoZSB2aWV3cG9ydCBpcyBkZXRlcm1pbmVkIGJ5IHRoZSBzY3JvbGwgcG9zaXRpb24gb2YgdGhlIGRvY3VtZW50XG4gICAgLy8gYm9keSwgbm9ybWFsbHkganVzdCAoc2Nyb2xsTGVmdCwgc2Nyb2xsVG9wKS4gSG93ZXZlciwgQ2hyb21lIGFuZCBGaXJlZm94IGRpc2FncmVlIGFib3V0XG4gICAgLy8gd2hldGhlciBgZG9jdW1lbnQuYm9keWAgb3IgYGRvY3VtZW50LmRvY3VtZW50RWxlbWVudGAgaXMgdGhlIHNjcm9sbGVkIGVsZW1lbnQsIHNvIHJlYWRpbmdcbiAgICAvLyBgc2Nyb2xsVG9wYCBhbmQgYHNjcm9sbExlZnRgIGlzIGluY29uc2lzdGVudC4gSG93ZXZlciwgdXNpbmcgdGhlIGJvdW5kaW5nIHJlY3Qgb2ZcbiAgICAvLyBgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50YCB3b3JrcyBjb25zaXN0ZW50bHksIHdoZXJlIHRoZSBgdG9wYCBhbmQgYGxlZnRgIHZhbHVlcyB3aWxsXG4gICAgLy8gZXF1YWwgbmVnYXRpdmUgdGhlIHNjcm9sbCBwb3NpdGlvbi5cbiAgICBjb25zdCBkb2N1bWVudCA9IHRoaXMuX2dldERvY3VtZW50KCk7XG4gICAgY29uc3Qgd2luZG93ID0gdGhpcy5fZ2V0V2luZG93KCk7XG4gICAgY29uc3QgZG9jdW1lbnRFbGVtZW50ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ITtcbiAgICBjb25zdCBkb2N1bWVudFJlY3QgPSBkb2N1bWVudEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICBjb25zdCB0b3AgPSAtZG9jdW1lbnRSZWN0LnRvcCB8fCBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCB8fCB3aW5kb3cuc2Nyb2xsWSB8fFxuICAgICAgICAgICAgICAgICBkb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wIHx8IDA7XG5cbiAgICBjb25zdCBsZWZ0ID0gLWRvY3VtZW50UmVjdC5sZWZ0IHx8IGRvY3VtZW50LmJvZHkuc2Nyb2xsTGVmdCB8fCB3aW5kb3cuc2Nyb2xsWCB8fFxuICAgICAgICAgICAgICAgICAgZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnQgfHwgMDtcblxuICAgIHJldHVybiB7dG9wLCBsZWZ0fTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgc3RyZWFtIHRoYXQgZW1pdHMgd2hlbmV2ZXIgdGhlIHNpemUgb2YgdGhlIHZpZXdwb3J0IGNoYW5nZXMuXG4gICAqIEBwYXJhbSB0aHJvdHRsZVRpbWUgVGltZSBpbiBtaWxsaXNlY29uZHMgdG8gdGhyb3R0bGUgdGhlIHN0cmVhbS5cbiAgICovXG4gIGNoYW5nZSh0aHJvdHRsZVRpbWU6IG51bWJlciA9IERFRkFVTFRfUkVTSVpFX1RJTUUpOiBPYnNlcnZhYmxlPEV2ZW50PiB7XG4gICAgcmV0dXJuIHRocm90dGxlVGltZSA+IDAgPyB0aGlzLl9jaGFuZ2UucGlwZShhdWRpdFRpbWUodGhyb3R0bGVUaW1lKSkgOiB0aGlzLl9jaGFuZ2U7XG4gIH1cblxuICAvKiogQWNjZXNzIGluamVjdGVkIGRvY3VtZW50IGlmIGF2YWlsYWJsZSBvciBmYWxsYmFjayB0byBnbG9iYWwgZG9jdW1lbnQgcmVmZXJlbmNlICovXG4gIHByaXZhdGUgX2dldERvY3VtZW50KCk6IERvY3VtZW50IHtcbiAgICByZXR1cm4gdGhpcy5fZG9jdW1lbnQgfHwgZG9jdW1lbnQ7XG4gIH1cblxuICAvKiogVXNlIGRlZmF1bHRWaWV3IG9mIGluamVjdGVkIGRvY3VtZW50IGlmIGF2YWlsYWJsZSBvciBmYWxsYmFjayB0byBnbG9iYWwgd2luZG93IHJlZmVyZW5jZSAqL1xuICBwcml2YXRlIF9nZXRXaW5kb3coKTogV2luZG93IHtcbiAgICBjb25zdCBkb2MgPSB0aGlzLl9nZXREb2N1bWVudCgpO1xuICAgIHJldHVybiBkb2MuZGVmYXVsdFZpZXcgfHwgd2luZG93O1xuICB9XG5cbiAgLyoqIFVwZGF0ZXMgdGhlIGNhY2hlZCB2aWV3cG9ydCBzaXplLiAqL1xuICBwcml2YXRlIF91cGRhdGVWaWV3cG9ydFNpemUoKSB7XG4gICAgY29uc3Qgd2luZG93ID0gdGhpcy5fZ2V0V2luZG93KCk7XG4gICAgdGhpcy5fdmlld3BvcnRTaXplID0gdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyID9cbiAgICAgICAge3dpZHRoOiB3aW5kb3cuaW5uZXJXaWR0aCwgaGVpZ2h0OiB3aW5kb3cuaW5uZXJIZWlnaHR9IDpcbiAgICAgICAge3dpZHRoOiAwLCBoZWlnaHQ6IDB9O1xuICB9XG59XG4iXX0=