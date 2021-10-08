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
import * as i1 from "@angular/cdk/platform";
/** Global registry for all dynamically-created, injected media queries. */
const mediaQueriesForWebkitCompatibility = new Set();
/** Style tag that holds all of the dynamically-created media queries. */
let mediaQueryStyleNode;
/** A utility for calling matchMedia queries. */
export class MediaMatcher {
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
     */
    matchMedia(query) {
        if (this._platform.WEBKIT || this._platform.BLINK) {
            createEmptyStyleRule(query);
        }
        return this._matchMedia(query);
    }
}
MediaMatcher.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: MediaMatcher, deps: [{ token: i1.Platform }], target: i0.ɵɵFactoryTarget.Injectable });
MediaMatcher.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: MediaMatcher, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: MediaMatcher, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: i1.Platform }]; } });
/**
 * Creates an empty stylesheet that is used to work around browser inconsistencies related to
 * `matchMedia`. At the time of writing, it handles the following cases:
 * 1. On WebKit browsers, a media query has to have at least one rule in order for `matchMedia`
 * to fire. We work around it by declaring a dummy stylesheet with a `@media` declaration.
 * 2. In some cases Blink browsers will stop firing the `matchMedia` listener if none of the rules
 * inside the `@media` match existing elements on the page. We work around it by having one rule
 * targeting the `body`. See https://github.com/angular/components/issues/23546.
 */
function createEmptyStyleRule(query) {
    if (mediaQueriesForWebkitCompatibility.has(query)) {
        return;
    }
    try {
        if (!mediaQueryStyleNode) {
            mediaQueryStyleNode = document.createElement('style');
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
        removeListener: () => { }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVkaWEtbWF0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvbGF5b3V0L21lZGlhLW1hdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBQ0gsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN6QyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7OztBQUUvQywyRUFBMkU7QUFDM0UsTUFBTSxrQ0FBa0MsR0FBZ0IsSUFBSSxHQUFHLEVBQVUsQ0FBQztBQUUxRSx5RUFBeUU7QUFDekUsSUFBSSxtQkFBaUQsQ0FBQztBQUV0RCxnREFBZ0Q7QUFFaEQsTUFBTSxPQUFPLFlBQVk7SUFJdkIsWUFBb0IsU0FBbUI7UUFBbkIsY0FBUyxHQUFULFNBQVMsQ0FBVTtRQUNyQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxJQUFJLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNoRSwwRkFBMEY7WUFDMUYsa0NBQWtDO1lBQ2xDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDaEMsY0FBYyxDQUFDO0lBQ25CLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFVBQVUsQ0FBQyxLQUFhO1FBQ3RCLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUU7WUFDakQsb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDN0I7UUFDRCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDakMsQ0FBQzs7aUhBdkJVLFlBQVk7cUhBQVosWUFBWSxjQURBLE1BQU07bUdBQ2xCLFlBQVk7a0JBRHhCLFVBQVU7bUJBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOztBQTJCaEM7Ozs7Ozs7O0dBUUc7QUFDSCxTQUFTLG9CQUFvQixDQUFDLEtBQWE7SUFDekMsSUFBSSxrQ0FBa0MsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDakQsT0FBTztLQUNSO0lBRUQsSUFBSTtRQUNGLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtZQUN4QixtQkFBbUIsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3RELG1CQUFtQixDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDckQsUUFBUSxDQUFDLElBQUssQ0FBQyxXQUFXLENBQUMsbUJBQW1CLENBQUMsQ0FBQztTQUNqRDtRQUVELElBQUksbUJBQW1CLENBQUMsS0FBSyxFQUFFO1lBQzdCLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsVUFBVSxLQUFLLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyRSxrQ0FBa0MsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDL0M7S0FDRjtJQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ1YsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNsQjtBQUNILENBQUM7QUFFRCw4REFBOEQ7QUFDOUQsU0FBUyxjQUFjLENBQUMsS0FBYTtJQUNuQyx3RUFBd0U7SUFDeEUsb0JBQW9CO0lBQ3BCLE9BQU87UUFDTCxPQUFPLEVBQUUsS0FBSyxLQUFLLEtBQUssSUFBSSxLQUFLLEtBQUssRUFBRTtRQUN4QyxLQUFLLEVBQUUsS0FBSztRQUNaLFdBQVcsRUFBRSxHQUFHLEVBQUUsR0FBRSxDQUFDO1FBQ3JCLGNBQWMsRUFBRSxHQUFHLEVBQUUsR0FBRSxDQUFDO0tBQ2xCLENBQUM7QUFDWCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtQbGF0Zm9ybX0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcblxuLyoqIEdsb2JhbCByZWdpc3RyeSBmb3IgYWxsIGR5bmFtaWNhbGx5LWNyZWF0ZWQsIGluamVjdGVkIG1lZGlhIHF1ZXJpZXMuICovXG5jb25zdCBtZWRpYVF1ZXJpZXNGb3JXZWJraXRDb21wYXRpYmlsaXR5OiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4vKiogU3R5bGUgdGFnIHRoYXQgaG9sZHMgYWxsIG9mIHRoZSBkeW5hbWljYWxseS1jcmVhdGVkIG1lZGlhIHF1ZXJpZXMuICovXG5sZXQgbWVkaWFRdWVyeVN0eWxlTm9kZTogSFRNTFN0eWxlRWxlbWVudCB8IHVuZGVmaW5lZDtcblxuLyoqIEEgdXRpbGl0eSBmb3IgY2FsbGluZyBtYXRjaE1lZGlhIHF1ZXJpZXMuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBNZWRpYU1hdGNoZXIge1xuICAvKiogVGhlIGludGVybmFsIG1hdGNoTWVkaWEgbWV0aG9kIHRvIHJldHVybiBiYWNrIGEgTWVkaWFRdWVyeUxpc3QgbGlrZSBvYmplY3QuICovXG4gIHByaXZhdGUgX21hdGNoTWVkaWE6IChxdWVyeTogc3RyaW5nKSA9PiBNZWRpYVF1ZXJ5TGlzdDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9wbGF0Zm9ybTogUGxhdGZvcm0pIHtcbiAgICB0aGlzLl9tYXRjaE1lZGlhID0gdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyICYmIHdpbmRvdy5tYXRjaE1lZGlhID9cbiAgICAgIC8vIG1hdGNoTWVkaWEgaXMgYm91bmQgdG8gdGhlIHdpbmRvdyBzY29wZSBpbnRlbnRpb25hbGx5IGFzIGl0IGlzIGFuIGlsbGVnYWwgaW52b2NhdGlvbiB0b1xuICAgICAgLy8gY2FsbCBpdCBmcm9tIGEgZGlmZmVyZW50IHNjb3BlLlxuICAgICAgd2luZG93Lm1hdGNoTWVkaWEuYmluZCh3aW5kb3cpIDpcbiAgICAgIG5vb3BNYXRjaE1lZGlhO1xuICB9XG5cbiAgLyoqXG4gICAqIEV2YWx1YXRlcyB0aGUgZ2l2ZW4gbWVkaWEgcXVlcnkgYW5kIHJldHVybnMgdGhlIG5hdGl2ZSBNZWRpYVF1ZXJ5TGlzdCBmcm9tIHdoaWNoIHJlc3VsdHNcbiAgICogY2FuIGJlIHJldHJpZXZlZC5cbiAgICogQ29uZmlybXMgdGhlIGxheW91dCBlbmdpbmUgd2lsbCB0cmlnZ2VyIGZvciB0aGUgc2VsZWN0b3IgcXVlcnkgcHJvdmlkZWQgYW5kIHJldHVybnMgdGhlXG4gICAqIE1lZGlhUXVlcnlMaXN0IGZvciB0aGUgcXVlcnkgcHJvdmlkZWQuXG4gICAqL1xuICBtYXRjaE1lZGlhKHF1ZXJ5OiBzdHJpbmcpOiBNZWRpYVF1ZXJ5TGlzdCB7XG4gICAgaWYgKHRoaXMuX3BsYXRmb3JtLldFQktJVCB8fCB0aGlzLl9wbGF0Zm9ybS5CTElOSykge1xuICAgICAgY3JlYXRlRW1wdHlTdHlsZVJ1bGUocXVlcnkpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fbWF0Y2hNZWRpYShxdWVyeSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGVtcHR5IHN0eWxlc2hlZXQgdGhhdCBpcyB1c2VkIHRvIHdvcmsgYXJvdW5kIGJyb3dzZXIgaW5jb25zaXN0ZW5jaWVzIHJlbGF0ZWQgdG9cbiAqIGBtYXRjaE1lZGlhYC4gQXQgdGhlIHRpbWUgb2Ygd3JpdGluZywgaXQgaGFuZGxlcyB0aGUgZm9sbG93aW5nIGNhc2VzOlxuICogMS4gT24gV2ViS2l0IGJyb3dzZXJzLCBhIG1lZGlhIHF1ZXJ5IGhhcyB0byBoYXZlIGF0IGxlYXN0IG9uZSBydWxlIGluIG9yZGVyIGZvciBgbWF0Y2hNZWRpYWBcbiAqIHRvIGZpcmUuIFdlIHdvcmsgYXJvdW5kIGl0IGJ5IGRlY2xhcmluZyBhIGR1bW15IHN0eWxlc2hlZXQgd2l0aCBhIGBAbWVkaWFgIGRlY2xhcmF0aW9uLlxuICogMi4gSW4gc29tZSBjYXNlcyBCbGluayBicm93c2VycyB3aWxsIHN0b3AgZmlyaW5nIHRoZSBgbWF0Y2hNZWRpYWAgbGlzdGVuZXIgaWYgbm9uZSBvZiB0aGUgcnVsZXNcbiAqIGluc2lkZSB0aGUgYEBtZWRpYWAgbWF0Y2ggZXhpc3RpbmcgZWxlbWVudHMgb24gdGhlIHBhZ2UuIFdlIHdvcmsgYXJvdW5kIGl0IGJ5IGhhdmluZyBvbmUgcnVsZVxuICogdGFyZ2V0aW5nIHRoZSBgYm9keWAuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9jb21wb25lbnRzL2lzc3Vlcy8yMzU0Ni5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlRW1wdHlTdHlsZVJ1bGUocXVlcnk6IHN0cmluZykge1xuICBpZiAobWVkaWFRdWVyaWVzRm9yV2Via2l0Q29tcGF0aWJpbGl0eS5oYXMocXVlcnkpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBpZiAoIW1lZGlhUXVlcnlTdHlsZU5vZGUpIHtcbiAgICAgIG1lZGlhUXVlcnlTdHlsZU5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgICAgbWVkaWFRdWVyeVN0eWxlTm9kZS5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAndGV4dC9jc3MnKTtcbiAgICAgIGRvY3VtZW50LmhlYWQhLmFwcGVuZENoaWxkKG1lZGlhUXVlcnlTdHlsZU5vZGUpO1xuICAgIH1cblxuICAgIGlmIChtZWRpYVF1ZXJ5U3R5bGVOb2RlLnNoZWV0KSB7XG4gICAgICBtZWRpYVF1ZXJ5U3R5bGVOb2RlLnNoZWV0Lmluc2VydFJ1bGUoYEBtZWRpYSAke3F1ZXJ5fSB7Ym9keXsgfX1gLCAwKTtcbiAgICAgIG1lZGlhUXVlcmllc0ZvcldlYmtpdENvbXBhdGliaWxpdHkuYWRkKHF1ZXJ5KTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLmVycm9yKGUpO1xuICB9XG59XG5cbi8qKiBOby1vcCBtYXRjaE1lZGlhIHJlcGxhY2VtZW50IGZvciBub24tYnJvd3NlciBwbGF0Zm9ybXMuICovXG5mdW5jdGlvbiBub29wTWF0Y2hNZWRpYShxdWVyeTogc3RyaW5nKTogTWVkaWFRdWVyeUxpc3Qge1xuICAvLyBVc2UgYGFzIGFueWAgaGVyZSB0byBhdm9pZCBhZGRpbmcgYWRkaXRpb25hbCBuZWNlc3NhcnkgcHJvcGVydGllcyBmb3JcbiAgLy8gdGhlIG5vb3AgbWF0Y2hlci5cbiAgcmV0dXJuIHtcbiAgICBtYXRjaGVzOiBxdWVyeSA9PT0gJ2FsbCcgfHwgcXVlcnkgPT09ICcnLFxuICAgIG1lZGlhOiBxdWVyeSxcbiAgICBhZGRMaXN0ZW5lcjogKCkgPT4ge30sXG4gICAgcmVtb3ZlTGlzdGVuZXI6ICgpID0+IHt9XG4gIH0gYXMgYW55O1xufVxuIl19