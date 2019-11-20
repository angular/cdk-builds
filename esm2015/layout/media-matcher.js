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
import { Injectable } from '@angular/core';
import { Platform } from '@angular/cdk/platform';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform/platform";
/**
 * Global registry for all dynamically-created, injected media queries.
 * @type {?}
 */
const mediaQueriesForWebkitCompatibility = new Set();
/**
 * Style tag that holds all of the dynamically-created media queries.
 * @type {?}
 */
let mediaQueryStyleNode;
/**
 * A utility for calling matchMedia queries.
 */
export class MediaMatcher {
    /**
     * @param {?} _platform
     */
    constructor(_platform) {
        this._platform = _platform;
        this._matchMedia = this._platform.isBrowser && window.matchMedia ?
            // matchMedia is bound to the window scope intentionally as it is an illegal invocation to
            // call it from a different scope.
            window.matchMedia.bind(window) :
            noopMatchMedia;
    }
    /**
     * Evaluates the given media query and returns the native MediaQueryList from which results
     * can be retrieved.
     * Confirms the layout engine will trigger for the selector query provided and returns the
     * MediaQueryList for the query provided.
     * @param {?} query
     * @return {?}
     */
    matchMedia(query) {
        if (this._platform.WEBKIT) {
            createEmptyStyleRule(query);
        }
        return this._matchMedia(query);
    }
}
MediaMatcher.decorators = [
    { type: Injectable, args: [{ providedIn: 'root' },] }
];
/** @nocollapse */
MediaMatcher.ctorParameters = () => [
    { type: Platform }
];
/** @nocollapse */ MediaMatcher.ɵprov = i0.ɵɵdefineInjectable({ factory: function MediaMatcher_Factory() { return new MediaMatcher(i0.ɵɵinject(i1.Platform)); }, token: MediaMatcher, providedIn: "root" });
if (false) {
    /**
     * The internal matchMedia method to return back a MediaQueryList like object.
     * @type {?}
     * @private
     */
    MediaMatcher.prototype._matchMedia;
    /**
     * @type {?}
     * @private
     */
    MediaMatcher.prototype._platform;
}
/**
 * For Webkit engines that only trigger the MediaQueryListListener when
 * there is at least one CSS selector for the respective media query.
 * @param {?} query
 * @return {?}
 */
function createEmptyStyleRule(query) {
    if (mediaQueriesForWebkitCompatibility.has(query)) {
        return;
    }
    try {
        if (!mediaQueryStyleNode) {
            mediaQueryStyleNode = document.createElement('style');
            mediaQueryStyleNode.setAttribute('type', 'text/css');
            (/** @type {?} */ (document.head)).appendChild(mediaQueryStyleNode);
        }
        if (mediaQueryStyleNode.sheet) {
            ((/** @type {?} */ (mediaQueryStyleNode.sheet)))
                .insertRule(`@media ${query} {.fx-query-test{ }}`, 0);
            mediaQueriesForWebkitCompatibility.add(query);
        }
    }
    catch (e) {
        console.error(e);
    }
}
/**
 * No-op matchMedia replacement for non-browser platforms.
 * @param {?} query
 * @return {?}
 */
function noopMatchMedia(query) {
    // Use `as any` here to avoid adding additional necessary properties for
    // the noop matcher.
    return (/** @type {?} */ ({
        matches: query === 'all' || query === '',
        media: query,
        addListener: (/**
         * @return {?}
         */
        () => { }),
        removeListener: (/**
         * @return {?}
         */
        () => { })
    }));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVkaWEtbWF0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvbGF5b3V0L21lZGlhLW1hdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFPQSxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3pDLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQzs7Ozs7OztNQUd6QyxrQ0FBa0MsR0FBZ0IsSUFBSSxHQUFHLEVBQVU7Ozs7O0lBR3JFLG1CQUFpRDs7OztBQUlyRCxNQUFNLE9BQU8sWUFBWTs7OztJQUl2QixZQUFvQixTQUFtQjtRQUFuQixjQUFTLEdBQVQsU0FBUyxDQUFVO1FBQ3JDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLElBQUksTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2hFLDBGQUEwRjtZQUMxRixrQ0FBa0M7WUFDbEMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNoQyxjQUFjLENBQUM7SUFDbkIsQ0FBQzs7Ozs7Ozs7O0lBUUQsVUFBVSxDQUFDLEtBQWE7UUFDdEIsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRTtZQUN6QixvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUM3QjtRQUNELE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNqQyxDQUFDOzs7WUF4QkYsVUFBVSxTQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQzs7OztZQVR4QixRQUFROzs7Ozs7Ozs7SUFZZCxtQ0FBdUQ7Ozs7O0lBRTNDLGlDQUEyQjs7Ozs7Ozs7QUEwQnpDLFNBQVMsb0JBQW9CLENBQUMsS0FBYTtJQUN6QyxJQUFJLGtDQUFrQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUNqRCxPQUFPO0tBQ1I7SUFFRCxJQUFJO1FBQ0YsSUFBSSxDQUFDLG1CQUFtQixFQUFFO1lBQ3hCLG1CQUFtQixHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdEQsbUJBQW1CLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNyRCxtQkFBQSxRQUFRLENBQUMsSUFBSSxFQUFDLENBQUMsV0FBVyxDQUFDLG1CQUFtQixDQUFDLENBQUM7U0FDakQ7UUFFRCxJQUFJLG1CQUFtQixDQUFDLEtBQUssRUFBRTtZQUM3QixDQUFDLG1CQUFBLG1CQUFtQixDQUFDLEtBQUssRUFBaUIsQ0FBQztpQkFDdkMsVUFBVSxDQUFDLFVBQVUsS0FBSyxzQkFBc0IsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMxRCxrQ0FBa0MsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDL0M7S0FDRjtJQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ1YsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNsQjtBQUNILENBQUM7Ozs7OztBQUdELFNBQVMsY0FBYyxDQUFDLEtBQWE7SUFDbkMsd0VBQXdFO0lBQ3hFLG9CQUFvQjtJQUNwQixPQUFPLG1CQUFBO1FBQ0wsT0FBTyxFQUFFLEtBQUssS0FBSyxLQUFLLElBQUksS0FBSyxLQUFLLEVBQUU7UUFDeEMsS0FBSyxFQUFFLEtBQUs7UUFDWixXQUFXOzs7UUFBRSxHQUFHLEVBQUUsR0FBRSxDQUFDLENBQUE7UUFDckIsY0FBYzs7O1FBQUUsR0FBRyxFQUFFLEdBQUUsQ0FBQyxDQUFBO0tBQ3pCLEVBQU8sQ0FBQztBQUNYLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1BsYXRmb3JtfSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuXG4vKiogR2xvYmFsIHJlZ2lzdHJ5IGZvciBhbGwgZHluYW1pY2FsbHktY3JlYXRlZCwgaW5qZWN0ZWQgbWVkaWEgcXVlcmllcy4gKi9cbmNvbnN0IG1lZGlhUXVlcmllc0ZvcldlYmtpdENvbXBhdGliaWxpdHk6IFNldDxzdHJpbmc+ID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbi8qKiBTdHlsZSB0YWcgdGhhdCBob2xkcyBhbGwgb2YgdGhlIGR5bmFtaWNhbGx5LWNyZWF0ZWQgbWVkaWEgcXVlcmllcy4gKi9cbmxldCBtZWRpYVF1ZXJ5U3R5bGVOb2RlOiBIVE1MU3R5bGVFbGVtZW50IHwgdW5kZWZpbmVkO1xuXG4vKiogQSB1dGlsaXR5IGZvciBjYWxsaW5nIG1hdGNoTWVkaWEgcXVlcmllcy4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIE1lZGlhTWF0Y2hlciB7XG4gIC8qKiBUaGUgaW50ZXJuYWwgbWF0Y2hNZWRpYSBtZXRob2QgdG8gcmV0dXJuIGJhY2sgYSBNZWRpYVF1ZXJ5TGlzdCBsaWtlIG9iamVjdC4gKi9cbiAgcHJpdmF0ZSBfbWF0Y2hNZWRpYTogKHF1ZXJ5OiBzdHJpbmcpID0+IE1lZGlhUXVlcnlMaXN0O1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX3BsYXRmb3JtOiBQbGF0Zm9ybSkge1xuICAgIHRoaXMuX21hdGNoTWVkaWEgPSB0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIgJiYgd2luZG93Lm1hdGNoTWVkaWEgP1xuICAgICAgLy8gbWF0Y2hNZWRpYSBpcyBib3VuZCB0byB0aGUgd2luZG93IHNjb3BlIGludGVudGlvbmFsbHkgYXMgaXQgaXMgYW4gaWxsZWdhbCBpbnZvY2F0aW9uIHRvXG4gICAgICAvLyBjYWxsIGl0IGZyb20gYSBkaWZmZXJlbnQgc2NvcGUuXG4gICAgICB3aW5kb3cubWF0Y2hNZWRpYS5iaW5kKHdpbmRvdykgOlxuICAgICAgbm9vcE1hdGNoTWVkaWE7XG4gIH1cblxuICAvKipcbiAgICogRXZhbHVhdGVzIHRoZSBnaXZlbiBtZWRpYSBxdWVyeSBhbmQgcmV0dXJucyB0aGUgbmF0aXZlIE1lZGlhUXVlcnlMaXN0IGZyb20gd2hpY2ggcmVzdWx0c1xuICAgKiBjYW4gYmUgcmV0cmlldmVkLlxuICAgKiBDb25maXJtcyB0aGUgbGF5b3V0IGVuZ2luZSB3aWxsIHRyaWdnZXIgZm9yIHRoZSBzZWxlY3RvciBxdWVyeSBwcm92aWRlZCBhbmQgcmV0dXJucyB0aGVcbiAgICogTWVkaWFRdWVyeUxpc3QgZm9yIHRoZSBxdWVyeSBwcm92aWRlZC5cbiAgICovXG4gIG1hdGNoTWVkaWEocXVlcnk6IHN0cmluZyk6IE1lZGlhUXVlcnlMaXN0IHtcbiAgICBpZiAodGhpcy5fcGxhdGZvcm0uV0VCS0lUKSB7XG4gICAgICBjcmVhdGVFbXB0eVN0eWxlUnVsZShxdWVyeSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9tYXRjaE1lZGlhKHF1ZXJ5KTtcbiAgfVxufVxuXG4vKipcbiAqIEZvciBXZWJraXQgZW5naW5lcyB0aGF0IG9ubHkgdHJpZ2dlciB0aGUgTWVkaWFRdWVyeUxpc3RMaXN0ZW5lciB3aGVuXG4gKiB0aGVyZSBpcyBhdCBsZWFzdCBvbmUgQ1NTIHNlbGVjdG9yIGZvciB0aGUgcmVzcGVjdGl2ZSBtZWRpYSBxdWVyeS5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlRW1wdHlTdHlsZVJ1bGUocXVlcnk6IHN0cmluZykge1xuICBpZiAobWVkaWFRdWVyaWVzRm9yV2Via2l0Q29tcGF0aWJpbGl0eS5oYXMocXVlcnkpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBpZiAoIW1lZGlhUXVlcnlTdHlsZU5vZGUpIHtcbiAgICAgIG1lZGlhUXVlcnlTdHlsZU5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgICAgbWVkaWFRdWVyeVN0eWxlTm9kZS5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAndGV4dC9jc3MnKTtcbiAgICAgIGRvY3VtZW50LmhlYWQhLmFwcGVuZENoaWxkKG1lZGlhUXVlcnlTdHlsZU5vZGUpO1xuICAgIH1cblxuICAgIGlmIChtZWRpYVF1ZXJ5U3R5bGVOb2RlLnNoZWV0KSB7XG4gICAgICAobWVkaWFRdWVyeVN0eWxlTm9kZS5zaGVldCBhcyBDU1NTdHlsZVNoZWV0KVxuICAgICAgICAgIC5pbnNlcnRSdWxlKGBAbWVkaWEgJHtxdWVyeX0gey5meC1xdWVyeS10ZXN0eyB9fWAsIDApO1xuICAgICAgbWVkaWFRdWVyaWVzRm9yV2Via2l0Q29tcGF0aWJpbGl0eS5hZGQocXVlcnkpO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gIH1cbn1cblxuLyoqIE5vLW9wIG1hdGNoTWVkaWEgcmVwbGFjZW1lbnQgZm9yIG5vbi1icm93c2VyIHBsYXRmb3Jtcy4gKi9cbmZ1bmN0aW9uIG5vb3BNYXRjaE1lZGlhKHF1ZXJ5OiBzdHJpbmcpOiBNZWRpYVF1ZXJ5TGlzdCB7XG4gIC8vIFVzZSBgYXMgYW55YCBoZXJlIHRvIGF2b2lkIGFkZGluZyBhZGRpdGlvbmFsIG5lY2Vzc2FyeSBwcm9wZXJ0aWVzIGZvclxuICAvLyB0aGUgbm9vcCBtYXRjaGVyLlxuICByZXR1cm4ge1xuICAgIG1hdGNoZXM6IHF1ZXJ5ID09PSAnYWxsJyB8fCBxdWVyeSA9PT0gJycsXG4gICAgbWVkaWE6IHF1ZXJ5LFxuICAgIGFkZExpc3RlbmVyOiAoKSA9PiB7fSxcbiAgICByZW1vdmVMaXN0ZW5lcjogKCkgPT4ge31cbiAgfSBhcyBhbnk7XG59XG4iXX0=