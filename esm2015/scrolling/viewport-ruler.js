/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Platform } from '@angular/cdk/platform';
import { Injectable, NgZone, Optional, Inject } from '@angular/core';
import { Subject } from 'rxjs';
import { auditTime } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
import * as i2 from "@angular/common";
/** Time in ms to throttle the resize events by default. */
export const DEFAULT_RESIZE_TIME = 20;
/**
 * Simple utility for getting the bounds of the browser viewport.
 * @docs-private
 */
export class ViewportRuler {
    constructor(_platform, ngZone, document) {
        this._platform = _platform;
        /** Stream of viewport change events. */
        this._change = new Subject();
        /** Event listener that will be used to handle the viewport change events. */
        this._changeListener = (event) => {
            this._change.next(event);
        };
        this._document = document;
        ngZone.runOutsideAngular(() => {
            if (_platform.isBrowser) {
                const window = this._getWindow();
                // Note that bind the events ourselves, rather than going through something like RxJS's
                // `fromEvent` so that we can ensure that they're bound outside of the NgZone.
                window.addEventListener('resize', this._changeListener);
                window.addEventListener('orientationchange', this._changeListener);
            }
            // We don't need to keep track of the subscription,
            // because we complete the `change` stream on destroy.
            this.change().subscribe(() => this._updateViewportSize());
        });
    }
    ngOnDestroy() {
        if (this._platform.isBrowser) {
            const window = this._getWindow();
            window.removeEventListener('resize', this._changeListener);
            window.removeEventListener('orientationchange', this._changeListener);
        }
        this._change.complete();
    }
    /** Returns the viewport's width and height. */
    getViewportSize() {
        if (!this._viewportSize) {
            this._updateViewportSize();
        }
        const output = { width: this._viewportSize.width, height: this._viewportSize.height };
        // If we're not on a browser, don't cache the size since it'll be mocked out anyway.
        if (!this._platform.isBrowser) {
            this._viewportSize = null;
        }
        return output;
    }
    /** Gets a ClientRect for the viewport's bounds. */
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
    /** Gets the (top, left) scroll position of the viewport. */
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
        const document = this._document;
        const window = this._getWindow();
        const documentElement = document.documentElement;
        const documentRect = documentElement.getBoundingClientRect();
        const top = -documentRect.top || document.body.scrollTop || window.scrollY ||
            documentElement.scrollTop || 0;
        const left = -documentRect.left || document.body.scrollLeft || window.scrollX ||
            documentElement.scrollLeft || 0;
        return { top, left };
    }
    /**
     * Returns a stream that emits whenever the size of the viewport changes.
     * This stream emits outside of the Angular zone.
     * @param throttleTime Time in milliseconds to throttle the stream.
     */
    change(throttleTime = DEFAULT_RESIZE_TIME) {
        return throttleTime > 0 ? this._change.pipe(auditTime(throttleTime)) : this._change;
    }
    /** Use defaultView of injected document if available or fallback to global window reference */
    _getWindow() {
        return this._document.defaultView || window;
    }
    /** Updates the cached viewport size. */
    _updateViewportSize() {
        const window = this._getWindow();
        this._viewportSize = this._platform.isBrowser ?
            { width: window.innerWidth, height: window.innerHeight } :
            { width: 0, height: 0 };
    }
}
ViewportRuler.ɵprov = i0.ɵɵdefineInjectable({ factory: function ViewportRuler_Factory() { return new ViewportRuler(i0.ɵɵinject(i1.Platform), i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i2.DOCUMENT, 8)); }, token: ViewportRuler, providedIn: "root" });
ViewportRuler.decorators = [
    { type: Injectable, args: [{ providedIn: 'root' },] }
];
ViewportRuler.ctorParameters = () => [
    { type: Platform },
    { type: NgZone },
    { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [DOCUMENT,] }] }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld3BvcnQtcnVsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy92aWV3cG9ydC1ydWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDL0MsT0FBTyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQWEsUUFBUSxFQUFFLE1BQU0sRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM5RSxPQUFPLEVBQWEsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3pDLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6QyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7Ozs7QUFFekMsMkRBQTJEO0FBQzNELE1BQU0sQ0FBQyxNQUFNLG1CQUFtQixHQUFHLEVBQUUsQ0FBQztBQVF0Qzs7O0dBR0c7QUFFSCxNQUFNLE9BQU8sYUFBYTtJQWV4QixZQUFvQixTQUFtQixFQUMzQixNQUFjLEVBQ2dCLFFBQWE7UUFGbkMsY0FBUyxHQUFULFNBQVMsQ0FBVTtRQVh2Qyx3Q0FBd0M7UUFDdkIsWUFBTyxHQUFHLElBQUksT0FBTyxFQUFTLENBQUM7UUFFaEQsNkVBQTZFO1FBQ3JFLG9CQUFlLEdBQUcsQ0FBQyxLQUFZLEVBQUUsRUFBRTtZQUN6QyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzQixDQUFDLENBQUE7UUFRQyxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztRQUUxQixNQUFNLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFO1lBQzVCLElBQUksU0FBUyxDQUFDLFNBQVMsRUFBRTtnQkFDdkIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUVqQyx1RkFBdUY7Z0JBQ3ZGLDhF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UUFBUSxZQUFJLE1BQU0sU0FBQyxRQUFRIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UGxhdGZvcm19IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge0luamVjdGFibGUsIE5nWm9uZSwgT25EZXN0cm95LCBPcHRpb25hbCwgSW5qZWN0fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2F1ZGl0VGltZX0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcblxuLyoqIFRpbWUgaW4gbXMgdG8gdGhyb3R0bGUgdGhlIHJlc2l6ZSBldmVudHMgYnkgZGVmYXVsdC4gKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX1JFU0laRV9USU1FID0gMjA7XG5cbi8qKiBPYmplY3QgdGhhdCBob2xkcyB0aGUgc2Nyb2xsIHBvc2l0aW9uIG9mIHRoZSB2aWV3cG9ydCBpbiBlYWNoIGRpcmVjdGlvbi4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVmlld3BvcnRTY3JvbGxQb3NpdGlvbiB7XG4gIHRvcDogbnVtYmVyO1xuICBsZWZ0OiBudW1iZXI7XG59XG5cbi8qKlxuICogU2ltcGxlIHV0aWxpdHkgZm9yIGdldHRpbmcgdGhlIGJvdW5kcyBvZiB0aGUgYnJvd3NlciB2aWV3cG9ydC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgVmlld3BvcnRSdWxlciBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qKiBDYWNoZWQgdmlld3BvcnQgZGltZW5zaW9ucy4gKi9cbiAgcHJpdmF0ZSBfdmlld3BvcnRTaXplOiB7d2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXJ9O1xuXG4gIC8qKiBTdHJlYW0gb2Ygdmlld3BvcnQgY2hhbmdlIGV2ZW50cy4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfY2hhbmdlID0gbmV3IFN1YmplY3Q8RXZlbnQ+KCk7XG5cbiAgLyoqIEV2ZW50IGxpc3RlbmVyIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGhhbmRsZSB0aGUgdmlld3BvcnQgY2hhbmdlIGV2ZW50cy4gKi9cbiAgcHJpdmF0ZSBfY2hhbmdlTGlzdGVuZXIgPSAoZXZlbnQ6IEV2ZW50KSA9PiB7XG4gICAgdGhpcy5fY2hhbmdlLm5leHQoZXZlbnQpO1xuICB9XG5cbiAgLyoqIFVzZWQgdG8gcmVmZXJlbmNlIGNvcnJlY3QgZG9jdW1lbnQvd2luZG93ICovXG4gIHByb3RlY3RlZCBfZG9jdW1lbnQ6IERvY3VtZW50O1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX3BsYXRmb3JtOiBQbGF0Zm9ybSxcbiAgICAgICAgICAgICAgbmdab25lOiBOZ1pvbmUsXG4gICAgICAgICAgICAgIEBPcHRpb25hbCgpIEBJbmplY3QoRE9DVU1FTlQpIGRvY3VtZW50OiBhbnkpIHtcbiAgICB0aGlzLl9kb2N1bWVudCA9IGRvY3VtZW50O1xuXG4gICAgbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIGlmIChfcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICAgIGNvbnN0IHdpbmRvdyA9IHRoaXMuX2dldFdpbmRvdygpO1xuXG4gICAgICAgIC8vIE5vdGUgdGhhdCBiaW5kIHRoZSBldmVudHMgb3Vyc2VsdmVzLCByYXRoZXIgdGhhbiBnb2luZyB0aHJvdWdoIHNvbWV0aGluZyBsaWtlIFJ4SlMnc1xuICAgICAgICAvLyBgZnJvbUV2ZW50YCBzbyB0aGF0IHdlIGNhbiBlbnN1cmUgdGhhdCB0aGV5J3JlIGJvdW5kIG91dHNpZGUgb2YgdGhlIE5nWm9uZS5cbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMuX2NoYW5nZUxpc3RlbmVyKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29yaWVudGF0aW9uY2hhbmdlJywgdGhpcy5fY2hhbmdlTGlzdGVuZXIpO1xuICAgICAgfVxuXG4gICAgICAvLyBXZSBkb24ndCBuZWVkIHRvIGtlZXAgdHJhY2sgb2YgdGhlIHN1YnNjcmlwdGlvbixcbiAgICAgIC8vIGJlY2F1c2Ugd2UgY29tcGxldGUgdGhlIGBjaGFuZ2VgIHN0cmVhbSBvbiBkZXN0cm95LlxuICAgICAgdGhpcy5jaGFuZ2UoKS5zdWJzY3JpYmUoKCkgPT4gdGhpcy5fdXBkYXRlVmlld3BvcnRTaXplKCkpO1xuICAgIH0pO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuX3BsYXRmb3JtLmlzQnJvd3Nlcikge1xuICAgICAgY29uc3Qgd2luZG93ID0gdGhpcy5fZ2V0V2luZG93KCk7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5fY2hhbmdlTGlzdGVuZXIpO1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ29yaWVudGF0aW9uY2hhbmdlJywgdGhpcy5fY2hhbmdlTGlzdGVuZXIpO1xuICAgIH1cblxuICAgIHRoaXMuX2NoYW5nZS5jb21wbGV0ZSgpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIHZpZXdwb3J0J3Mgd2lkdGggYW5kIGhlaWdodC4gKi9cbiAgZ2V0Vmlld3BvcnRTaXplKCk6IFJlYWRvbmx5PHt3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcn0+IHtcbiAgICBpZiAoIXRoaXMuX3ZpZXdwb3J0U2l6ZSkge1xuICAgICAgdGhpcy5fdXBkYXRlVmlld3BvcnRTaXplKCk7XG4gICAgfVxuXG4gICAgY29uc3Qgb3V0cHV0ID0ge3dpZHRoOiB0aGlzLl92aWV3cG9ydFNpemUud2lkdGgsIGhlaWdodDogdGhpcy5fdmlld3BvcnRTaXplLmhlaWdodH07XG5cbiAgICAvLyBJZiB3ZSdyZSBub3Qgb24gYSBicm93c2VyLCBkb24ndCBjYWNoZSB0aGUgc2l6ZSBzaW5jZSBpdCdsbCBiZSBtb2NrZWQgb3V0IGFueXdheS5cbiAgICBpZiAoIXRoaXMuX3BsYXRmb3JtLmlzQnJvd3Nlcikge1xuICAgICAgdGhpcy5fdmlld3BvcnRTaXplID0gbnVsbCE7XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfVxuXG4gIC8qKiBHZXRzIGEgQ2xpZW50UmVjdCBmb3IgdGhlIHZpZXdwb3J0J3MgYm91bmRzLiAqL1xuICBnZXRWaWV3cG9ydFJlY3QoKTogQ2xpZW50UmVjdCB7XG4gICAgLy8gVXNlIHRoZSBkb2N1bWVudCBlbGVtZW50J3MgYm91bmRpbmcgcmVjdCByYXRoZXIgdGhhbiB0aGUgd2luZG93IHNjcm9sbCBwcm9wZXJ0aWVzXG4gICAgLy8gKGUuZy4gcGFnZVlPZmZzZXQsIHNjcm9sbFkpIGR1ZSB0byBpbiBpc3N1ZSBpbiBDaHJvbWUgYW5kIElFIHdoZXJlIHdpbmRvdyBzY3JvbGxcbiAgICAvLyBwcm9wZXJ0aWVzIGFuZCBjbGllbnQgY29vcmRpbmF0ZXMgKGJvdW5kaW5nQ2xpZW50UmVjdCwgY2xpZW50WC9ZLCBldGMuKSBhcmUgaW4gZGlmZmVyZW50XG4gICAgLy8gY29uY2VwdHVhbCB2aWV3cG9ydHMuIFVuZGVyIG1vc3QgY2lyY3Vtc3RhbmNlcyB0aGVzZSB2aWV3cG9ydHMgYXJlIGVxdWl2YWxlbnQsIGJ1dCB0aGV5XG4gICAgLy8gY2FuIGRpc2FncmVlIHdoZW4gdGhlIHBhZ2UgaXMgcGluY2gtem9vbWVkIChvbiBkZXZpY2VzIHRoYXQgc3VwcG9ydCB0b3VjaCkuXG4gICAgLy8gU2VlIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTQ4OTIwNiNjNFxuICAgIC8vIFdlIHVzZSB0aGUgZG9jdW1lbnRFbGVtZW50IGluc3RlYWQgb2YgdGhlIGJvZHkgYmVjYXVzZSwgYnkgZGVmYXVsdCAod2l0aG91dCBhIGNzcyByZXNldClcbiAgICAvLyBicm93c2VycyB0eXBpY2FsbHkgZ2l2ZSB0aGUgZG9jdW1lbnQgYm9keSBhbiA4cHggbWFyZ2luLCB3aGljaCBpcyBub3QgaW5jbHVkZWQgaW5cbiAgICAvLyBnZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5cbiAgICBjb25zdCBzY3JvbGxQb3NpdGlvbiA9IHRoaXMuZ2V0Vmlld3BvcnRTY3JvbGxQb3NpdGlvbigpO1xuICAgIGNvbnN0IHt3aWR0aCwgaGVpZ2h0fSA9IHRoaXMuZ2V0Vmlld3BvcnRTaXplKCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdG9wOiBzY3JvbGxQb3NpdGlvbi50b3AsXG4gICAgICBsZWZ0OiBzY3JvbGxQb3NpdGlvbi5sZWZ0LFxuICAgICAgYm90dG9tOiBzY3JvbGxQb3NpdGlvbi50b3AgKyBoZWlnaHQsXG4gICAgICByaWdodDogc2Nyb2xsUG9zaXRpb24ubGVmdCArIHdpZHRoLFxuICAgICAgaGVpZ2h0LFxuICAgICAgd2lkdGgsXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSAodG9wLCBsZWZ0KSBzY3JvbGwgcG9zaXRpb24gb2YgdGhlIHZpZXdwb3J0LiAqL1xuICBnZXRWaWV3cG9ydFNjcm9sbFBvc2l0aW9uKCk6IFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24ge1xuICAgIC8vIFdoaWxlIHdlIGNhbiBnZXQgYSByZWZlcmVuY2UgdG8gdGhlIGZha2UgZG9jdW1lbnRcbiAgICAvLyBkdXJpbmcgU1NSLCBpdCBkb2Vzbid0IGhhdmUgZ2V0Qm91bmRpbmdDbGllbnRSZWN0LlxuICAgIGlmICghdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICByZXR1cm4ge3RvcDogMCwgbGVmdDogMH07XG4gICAgfVxuXG4gICAgLy8gVGhlIHRvcC1sZWZ0LWNvcm5lciBvZiB0aGUgdmlld3BvcnQgaXMgZGV0ZXJtaW5lZCBieSB0aGUgc2Nyb2xsIHBvc2l0aW9uIG9mIHRoZSBkb2N1bWVudFxuICAgIC8vIGJvZHksIG5vcm1hbGx5IGp1c3QgKHNjcm9sbExlZnQsIHNjcm9sbFRvcCkuIEhvd2V2ZXIsIENocm9tZSBhbmQgRmlyZWZveCBkaXNhZ3JlZSBhYm91dFxuICAgIC8vIHdoZXRoZXIgYGRvY3VtZW50LmJvZHlgIG9yIGBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnRgIGlzIHRoZSBzY3JvbGxlZCBlbGVtZW50LCBzbyByZWFkaW5nXG4gICAgLy8gYHNjcm9sbFRvcGAgYW5kIGBzY3JvbGxMZWZ0YCBpcyBpbmNvbnNpc3RlbnQuIEhvd2V2ZXIsIHVzaW5nIHRoZSBib3VuZGluZyByZWN0IG9mXG4gICAgLy8gYGRvY3VtZW50LmRvY3VtZW50RWxlbWVudGAgd29ya3MgY29uc2lzdGVudGx5LCB3aGVyZSB0aGUgYHRvcGAgYW5kIGBsZWZ0YCB2YWx1ZXMgd2lsbFxuICAgIC8vIGVxdWFsIG5lZ2F0aXZlIHRoZSBzY3JvbGwgcG9zaXRpb24uXG4gICAgY29uc3QgZG9jdW1lbnQgPSB0aGlzLl9kb2N1bWVudDtcbiAgICBjb25zdCB3aW5kb3cgPSB0aGlzLl9nZXRXaW5kb3coKTtcbiAgICBjb25zdCBkb2N1bWVudEVsZW1lbnQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQhO1xuICAgIGNvbnN0IGRvY3VtZW50UmVjdCA9IGRvY3VtZW50RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgIGNvbnN0IHRvcCA9IC1kb2N1bWVudFJlY3QudG9wIHx8IGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wIHx8IHdpbmRvdy5zY3JvbGxZIHx8XG4gICAgICAgICAgICAgICAgIGRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3AgfHwgMDtcblxuICAgIGNvbnN0IGxlZnQgPSAtZG9jdW1lbnRSZWN0LmxlZnQgfHwgZG9jdW1lbnQuYm9keS5zY3JvbGxMZWZ0IHx8IHdpbmRvdy5zY3JvbGxYIHx8XG4gICAgICAgICAgICAgICAgICBkb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdCB8fCAwO1xuXG4gICAgcmV0dXJuIHt0b3AsIGxlZnR9O1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBzdHJlYW0gdGhhdCBlbWl0cyB3aGVuZXZlciB0aGUgc2l6ZSBvZiB0aGUgdmlld3BvcnQgY2hhbmdlcy5cbiAgICogVGhpcyBzdHJlYW0gZW1pdHMgb3V0c2lkZSBvZiB0aGUgQW5ndWxhciB6b25lLlxuICAgKiBAcGFyYW0gdGhyb3R0bGVUaW1lIFRpbWUgaW4gbWlsbGlzZWNvbmRzIHRvIHRocm90dGxlIHRoZSBzdHJlYW0uXG4gICAqL1xuICBjaGFuZ2UodGhyb3R0bGVUaW1lOiBudW1iZXIgPSBERUZBVUxUX1JFU0laRV9USU1FKTogT2JzZXJ2YWJsZTxFdmVudD4ge1xuICAgIHJldHVybiB0aHJvdHRsZVRpbWUgPiAwID8gdGhpcy5fY2hhbmdlLnBpcGUoYXVkaXRUaW1lKHRocm90dGxlVGltZSkpIDogdGhpcy5fY2hhbmdlO1xuICB9XG5cbiAgLyoqIFVzZSBkZWZhdWx0VmlldyBvZiBpbmplY3RlZCBkb2N1bWVudCBpZiBhdmFpbGFibGUgb3IgZmFsbGJhY2sgdG8gZ2xvYmFsIHdpbmRvdyByZWZlcmVuY2UgKi9cbiAgcHJpdmF0ZSBfZ2V0V2luZG93KCk6IFdpbmRvdyB7XG4gICAgcmV0dXJuIHRoaXMuX2RvY3VtZW50LmRlZmF1bHRWaWV3IHx8IHdpbmRvdztcbiAgfVxuXG4gIC8qKiBVcGRhdGVzIHRoZSBjYWNoZWQgdmlld3BvcnQgc2l6ZS4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlVmlld3BvcnRTaXplKCkge1xuICAgIGNvbnN0IHdpbmRvdyA9IHRoaXMuX2dldFdpbmRvdygpO1xuICAgIHRoaXMuX3ZpZXdwb3J0U2l6ZSA9IHRoaXMuX3BsYXRmb3JtLmlzQnJvd3NlciA/XG4gICAgICAgIHt3aWR0aDogd2luZG93LmlubmVyV2lkdGgsIGhlaWdodDogd2luZG93LmlubmVySGVpZ2h0fSA6XG4gICAgICAgIHt3aWR0aDogMCwgaGVpZ2h0OiAwfTtcbiAgfVxufVxuIl19