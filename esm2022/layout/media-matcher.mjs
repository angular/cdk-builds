/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable, CSP_NONCE, Optional, Inject } from '@angular/core';
import { Platform } from '@angular/cdk/platform';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
/** Global registry for all dynamically-created, injected media queries. */
const mediaQueriesForWebkitCompatibility = new Set();
/** Style tag that holds all of the dynamically-created media queries. */
let mediaQueryStyleNode;
/** A utility for calling matchMedia queries. */
export class MediaMatcher {
    constructor(_platform, _nonce) {
        this._platform = _platform;
        this._nonce = _nonce;
        this._matchMedia =
            this._platform.isBrowser && window.matchMedia
                ? // matchMedia is bound to the window scope intentionally as it is an illegal invocation to
                    // call it from a different scope.
                    window.matchMedia.bind(window)
                : noopMatchMedia;
    }
    /**
     * Evaluates the given media query and returns the native MediaQueryList from which results
     * can be retrieved.
     * Confirms the layout engine will trigger for the selector query provided and returns the
     * MediaQueryList for the query provided.
     */
    matchMedia(query) {
        if (this._platform.WEBKIT || this._platform.BLINK) {
            createEmptyStyleRule(query, this._nonce);
        }
        return this._matchMedia(query);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: MediaMatcher, deps: [{ token: i1.Platform }, { token: CSP_NONCE, optional: true }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: MediaMatcher, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: MediaMatcher, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: i1.Platform }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [CSP_NONCE]
                }] }]; } });
/**
 * Creates an empty stylesheet that is used to work around browser inconsistencies related to
 * `matchMedia`. At the time of writing, it handles the following cases:
 * 1. On WebKit browsers, a media query has to have at least one rule in order for `matchMedia`
 * to fire. We work around it by declaring a dummy stylesheet with a `@media` declaration.
 * 2. In some cases Blink browsers will stop firing the `matchMedia` listener if none of the rules
 * inside the `@media` match existing elements on the page. We work around it by having one rule
 * targeting the `body`. See https://github.com/angular/components/issues/23546.
 */
function createEmptyStyleRule(query, nonce) {
    if (mediaQueriesForWebkitCompatibility.has(query)) {
        return;
    }
    try {
        if (!mediaQueryStyleNode) {
            mediaQueryStyleNode = document.createElement('style');
            if (nonce) {
                mediaQueryStyleNode.nonce = nonce;
            }
            mediaQueryStyleNode.setAttribute('type', 'text/css');
            document.head.appendChild(mediaQueryStyleNode);
        }
        if (mediaQueryStyleNode.sheet) {
            mediaQueryStyleNode.sheet.insertRule(`@media ${query} {body{ }}`, 0);
            mediaQueriesForWebkitCompatibility.add(query);
        }
    }
    catch (e) {
        console.error(e);
    }
}
/** No-op matchMedia replacement for non-browser platforms. */
function noopMatchMedia(query) {
    // Use `as any` here to avoid adding additional necessary properties for
    // the noop matcher.
    return {
        matches: query === 'all' || query === '',
        media: query,
        addListener: () => { },
        removeListener: () => { },
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVkaWEtbWF0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvbGF5b3V0L21lZGlhLW1hdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBQ0gsT0FBTyxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN0RSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7OztBQUUvQywyRUFBMkU7QUFDM0UsTUFBTSxrQ0FBa0MsR0FBZ0IsSUFBSSxHQUFHLEVBQVUsQ0FBQztBQUUxRSx5RUFBeUU7QUFDekUsSUFBSSxtQkFBaUQsQ0FBQztBQUV0RCxnREFBZ0Q7QUFFaEQsTUFBTSxPQUFPLFlBQVk7SUFJdkIsWUFDVSxTQUFtQixFQUNZLE1BQXNCO1FBRHJELGNBQVMsR0FBVCxTQUFTLENBQVU7UUFDWSxXQUFNLEdBQU4sTUFBTSxDQUFnQjtRQUU3RCxJQUFJLENBQUMsV0FBVztZQUNkLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxJQUFJLE1BQU0sQ0FBQyxVQUFVO2dCQUMzQyxDQUFDLENBQUMsMEZBQTBGO29CQUMxRixrQ0FBa0M7b0JBQ2xDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztnQkFDaEMsQ0FBQyxDQUFDLGNBQWMsQ0FBQztJQUN2QixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxVQUFVLENBQUMsS0FBYTtRQUN0QixJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFO1lBQ2pELG9CQUFvQixDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDMUM7UUFDRCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDakMsQ0FBQzs4R0EzQlUsWUFBWSwwQ0FNRCxTQUFTO2tIQU5wQixZQUFZLGNBREEsTUFBTTs7MkZBQ2xCLFlBQVk7a0JBRHhCLFVBQVU7bUJBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzswQkFPM0IsUUFBUTs7MEJBQUksTUFBTTsyQkFBQyxTQUFTOztBQXdCakM7Ozs7Ozs7O0dBUUc7QUFDSCxTQUFTLG9CQUFvQixDQUFDLEtBQWEsRUFBRSxLQUFnQztJQUMzRSxJQUFJLGtDQUFrQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUNqRCxPQUFPO0tBQ1I7SUFFRCxJQUFJO1FBQ0YsSUFBSSxDQUFDLG1CQUFtQixFQUFFO1lBQ3hCLG1CQUFtQixHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFdEQsSUFBSSxLQUFLLEVBQUU7Z0JBQ1QsbUJBQW1CLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQzthQUNuQztZQUVELG1CQUFtQixDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDckQsUUFBUSxDQUFDLElBQUssQ0FBQyxXQUFXLENBQUMsbUJBQW1CLENBQUMsQ0FBQztTQUNqRDtRQUVELElBQUksbUJBQW1CLENBQUMsS0FBSyxFQUFFO1lBQzdCLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsVUFBVSxLQUFLLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyRSxrQ0FBa0MsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDL0M7S0FDRjtJQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ1YsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNsQjtBQUNILENBQUM7QUFFRCw4REFBOEQ7QUFDOUQsU0FBUyxjQUFjLENBQUMsS0FBYTtJQUNuQyx3RUFBd0U7SUFDeEUsb0JBQW9CO0lBQ3BCLE9BQU87UUFDTCxPQUFPLEVBQUUsS0FBSyxLQUFLLEtBQUssSUFBSSxLQUFLLEtBQUssRUFBRTtRQUN4QyxLQUFLLEVBQUUsS0FBSztRQUNaLFdBQVcsRUFBRSxHQUFHLEVBQUUsR0FBRSxDQUFDO1FBQ3JCLGNBQWMsRUFBRSxHQUFHLEVBQUUsR0FBRSxDQUFDO0tBQ2xCLENBQUM7QUFDWCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge0luamVjdGFibGUsIENTUF9OT05DRSwgT3B0aW9uYWwsIEluamVjdH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1BsYXRmb3JtfSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuXG4vKiogR2xvYmFsIHJlZ2lzdHJ5IGZvciBhbGwgZHluYW1pY2FsbHktY3JlYXRlZCwgaW5qZWN0ZWQgbWVkaWEgcXVlcmllcy4gKi9cbmNvbnN0IG1lZGlhUXVlcmllc0ZvcldlYmtpdENvbXBhdGliaWxpdHk6IFNldDxzdHJpbmc+ID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbi8qKiBTdHlsZSB0YWcgdGhhdCBob2xkcyBhbGwgb2YgdGhlIGR5bmFtaWNhbGx5LWNyZWF0ZWQgbWVkaWEgcXVlcmllcy4gKi9cbmxldCBtZWRpYVF1ZXJ5U3R5bGVOb2RlOiBIVE1MU3R5bGVFbGVtZW50IHwgdW5kZWZpbmVkO1xuXG4vKiogQSB1dGlsaXR5IGZvciBjYWxsaW5nIG1hdGNoTWVkaWEgcXVlcmllcy4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIE1lZGlhTWF0Y2hlciB7XG4gIC8qKiBUaGUgaW50ZXJuYWwgbWF0Y2hNZWRpYSBtZXRob2QgdG8gcmV0dXJuIGJhY2sgYSBNZWRpYVF1ZXJ5TGlzdCBsaWtlIG9iamVjdC4gKi9cbiAgcHJpdmF0ZSBfbWF0Y2hNZWRpYTogKHF1ZXJ5OiBzdHJpbmcpID0+IE1lZGlhUXVlcnlMaXN0O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgX3BsYXRmb3JtOiBQbGF0Zm9ybSxcbiAgICBAT3B0aW9uYWwoKSBASW5qZWN0KENTUF9OT05DRSkgcHJpdmF0ZSBfbm9uY2U/OiBzdHJpbmcgfCBudWxsLFxuICApIHtcbiAgICB0aGlzLl9tYXRjaE1lZGlhID1cbiAgICAgIHRoaXMuX3BsYXRmb3JtLmlzQnJvd3NlciAmJiB3aW5kb3cubWF0Y2hNZWRpYVxuICAgICAgICA/IC8vIG1hdGNoTWVkaWEgaXMgYm91bmQgdG8gdGhlIHdpbmRvdyBzY29wZSBpbnRlbnRpb25hbGx5IGFzIGl0IGlzIGFuIGlsbGVnYWwgaW52b2NhdGlvbiB0b1xuICAgICAgICAgIC8vIGNhbGwgaXQgZnJvbSBhIGRpZmZlcmVudCBzY29wZS5cbiAgICAgICAgICB3aW5kb3cubWF0Y2hNZWRpYS5iaW5kKHdpbmRvdylcbiAgICAgICAgOiBub29wTWF0Y2hNZWRpYTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFdmFsdWF0ZXMgdGhlIGdpdmVuIG1lZGlhIHF1ZXJ5IGFuZCByZXR1cm5zIHRoZSBuYXRpdmUgTWVkaWFRdWVyeUxpc3QgZnJvbSB3aGljaCByZXN1bHRzXG4gICAqIGNhbiBiZSByZXRyaWV2ZWQuXG4gICAqIENvbmZpcm1zIHRoZSBsYXlvdXQgZW5naW5lIHdpbGwgdHJpZ2dlciBmb3IgdGhlIHNlbGVjdG9yIHF1ZXJ5IHByb3ZpZGVkIGFuZCByZXR1cm5zIHRoZVxuICAgKiBNZWRpYVF1ZXJ5TGlzdCBmb3IgdGhlIHF1ZXJ5IHByb3ZpZGVkLlxuICAgKi9cbiAgbWF0Y2hNZWRpYShxdWVyeTogc3RyaW5nKTogTWVkaWFRdWVyeUxpc3Qge1xuICAgIGlmICh0aGlzLl9wbGF0Zm9ybS5XRUJLSVQgfHwgdGhpcy5fcGxhdGZvcm0uQkxJTkspIHtcbiAgICAgIGNyZWF0ZUVtcHR5U3R5bGVSdWxlKHF1ZXJ5LCB0aGlzLl9ub25jZSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9tYXRjaE1lZGlhKHF1ZXJ5KTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gZW1wdHkgc3R5bGVzaGVldCB0aGF0IGlzIHVzZWQgdG8gd29yayBhcm91bmQgYnJvd3NlciBpbmNvbnNpc3RlbmNpZXMgcmVsYXRlZCB0b1xuICogYG1hdGNoTWVkaWFgLiBBdCB0aGUgdGltZSBvZiB3cml0aW5nLCBpdCBoYW5kbGVzIHRoZSBmb2xsb3dpbmcgY2FzZXM6XG4gKiAxLiBPbiBXZWJLaXQgYnJvd3NlcnMsIGEgbWVkaWEgcXVlcnkgaGFzIHRvIGhhdmUgYXQgbGVhc3Qgb25lIHJ1bGUgaW4gb3JkZXIgZm9yIGBtYXRjaE1lZGlhYFxuICogdG8gZmlyZS4gV2Ugd29yayBhcm91bmQgaXQgYnkgZGVjbGFyaW5nIGEgZHVtbXkgc3R5bGVzaGVldCB3aXRoIGEgYEBtZWRpYWAgZGVjbGFyYXRpb24uXG4gKiAyLiBJbiBzb21lIGNhc2VzIEJsaW5rIGJyb3dzZXJzIHdpbGwgc3RvcCBmaXJpbmcgdGhlIGBtYXRjaE1lZGlhYCBsaXN0ZW5lciBpZiBub25lIG9mIHRoZSBydWxlc1xuICogaW5zaWRlIHRoZSBgQG1lZGlhYCBtYXRjaCBleGlzdGluZyBlbGVtZW50cyBvbiB0aGUgcGFnZS4gV2Ugd29yayBhcm91bmQgaXQgYnkgaGF2aW5nIG9uZSBydWxlXG4gKiB0YXJnZXRpbmcgdGhlIGBib2R5YC4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2NvbXBvbmVudHMvaXNzdWVzLzIzNTQ2LlxuICovXG5mdW5jdGlvbiBjcmVhdGVFbXB0eVN0eWxlUnVsZShxdWVyeTogc3RyaW5nLCBub25jZTogc3RyaW5nIHwgdW5kZWZpbmVkIHwgbnVsbCkge1xuICBpZiAobWVkaWFRdWVyaWVzRm9yV2Via2l0Q29tcGF0aWJpbGl0eS5oYXMocXVlcnkpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBpZiAoIW1lZGlhUXVlcnlTdHlsZU5vZGUpIHtcbiAgICAgIG1lZGlhUXVlcnlTdHlsZU5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuXG4gICAgICBpZiAobm9uY2UpIHtcbiAgICAgICAgbWVkaWFRdWVyeVN0eWxlTm9kZS5ub25jZSA9IG5vbmNlO1xuICAgICAgfVxuXG4gICAgICBtZWRpYVF1ZXJ5U3R5bGVOb2RlLnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2NzcycpO1xuICAgICAgZG9jdW1lbnQuaGVhZCEuYXBwZW5kQ2hpbGQobWVkaWFRdWVyeVN0eWxlTm9kZSk7XG4gICAgfVxuXG4gICAgaWYgKG1lZGlhUXVlcnlTdHlsZU5vZGUuc2hlZXQpIHtcbiAgICAgIG1lZGlhUXVlcnlTdHlsZU5vZGUuc2hlZXQuaW5zZXJ0UnVsZShgQG1lZGlhICR7cXVlcnl9IHtib2R5eyB9fWAsIDApO1xuICAgICAgbWVkaWFRdWVyaWVzRm9yV2Via2l0Q29tcGF0aWJpbGl0eS5hZGQocXVlcnkpO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gIH1cbn1cblxuLyoqIE5vLW9wIG1hdGNoTWVkaWEgcmVwbGFjZW1lbnQgZm9yIG5vbi1icm93c2VyIHBsYXRmb3Jtcy4gKi9cbmZ1bmN0aW9uIG5vb3BNYXRjaE1lZGlhKHF1ZXJ5OiBzdHJpbmcpOiBNZWRpYVF1ZXJ5TGlzdCB7XG4gIC8vIFVzZSBgYXMgYW55YCBoZXJlIHRvIGF2b2lkIGFkZGluZyBhZGRpdGlvbmFsIG5lY2Vzc2FyeSBwcm9wZXJ0aWVzIGZvclxuICAvLyB0aGUgbm9vcCBtYXRjaGVyLlxuICByZXR1cm4ge1xuICAgIG1hdGNoZXM6IHF1ZXJ5ID09PSAnYWxsJyB8fCBxdWVyeSA9PT0gJycsXG4gICAgbWVkaWE6IHF1ZXJ5LFxuICAgIGFkZExpc3RlbmVyOiAoKSA9PiB7fSxcbiAgICByZW1vdmVMaXN0ZW5lcjogKCkgPT4ge30sXG4gIH0gYXMgYW55O1xufVxuIl19