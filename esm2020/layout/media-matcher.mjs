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
class MediaMatcher {
    constructor(_platform) {
        this._platform = _platform;
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
            createEmptyStyleRule(query);
        }
        return this._matchMedia(query);
    }
}
MediaMatcher.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0-next.5", ngImport: i0, type: MediaMatcher, deps: [{ token: i1.Platform }], target: i0.ɵɵFactoryTarget.Injectable });
MediaMatcher.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.0.0-next.5", ngImport: i0, type: MediaMatcher, providedIn: 'root' });
export { MediaMatcher };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0-next.5", ngImport: i0, type: MediaMatcher, decorators: [{
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
        removeListener: () => { },
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVkaWEtbWF0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvbGF5b3V0L21lZGlhLW1hdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBQ0gsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN6QyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7OztBQUUvQywyRUFBMkU7QUFDM0UsTUFBTSxrQ0FBa0MsR0FBZ0IsSUFBSSxHQUFHLEVBQVUsQ0FBQztBQUUxRSx5RUFBeUU7QUFDekUsSUFBSSxtQkFBaUQsQ0FBQztBQUV0RCxnREFBZ0Q7QUFDaEQsTUFDYSxZQUFZO0lBSXZCLFlBQW9CLFNBQW1CO1FBQW5CLGNBQVMsR0FBVCxTQUFTLENBQVU7UUFDckMsSUFBSSxDQUFDLFdBQVc7WUFDZCxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsSUFBSSxNQUFNLENBQUMsVUFBVTtnQkFDM0MsQ0FBQyxDQUFDLDBGQUEwRjtvQkFDMUYsa0NBQWtDO29CQUNsQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQ2hDLENBQUMsQ0FBQyxjQUFjLENBQUM7SUFDdkIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsVUFBVSxDQUFDLEtBQWE7UUFDdEIsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRTtZQUNqRCxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUM3QjtRQUNELE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNqQyxDQUFDOztnSEF4QlUsWUFBWTtvSEFBWixZQUFZLGNBREEsTUFBTTtTQUNsQixZQUFZO2tHQUFaLFlBQVk7a0JBRHhCLFVBQVU7bUJBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOztBQTRCaEM7Ozs7Ozs7O0dBUUc7QUFDSCxTQUFTLG9CQUFvQixDQUFDLEtBQWE7SUFDekMsSUFBSSxrQ0FBa0MsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDakQsT0FBTztLQUNSO0lBRUQsSUFBSTtRQUNGLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtZQUN4QixtQkFBbUIsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3RELG1CQUFtQixDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDckQsUUFBUSxDQUFDLElBQUssQ0FBQyxXQUFXLENBQUMsbUJBQW1CLENBQUMsQ0FBQztTQUNqRDtRQUVELElBQUksbUJBQW1CLENBQUMsS0FBSyxFQUFFO1lBQzdCLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsVUFBVSxLQUFLLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyRSxrQ0FBa0MsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDL0M7S0FDRjtJQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ1YsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNsQjtBQUNILENBQUM7QUFFRCw4REFBOEQ7QUFDOUQsU0FBUyxjQUFjLENBQUMsS0FBYTtJQUNuQyx3RUFBd0U7SUFDeEUsb0JBQW9CO0lBQ3BCLE9BQU87UUFDTCxPQUFPLEVBQUUsS0FBSyxLQUFLLEtBQUssSUFBSSxLQUFLLEtBQUssRUFBRTtRQUN4QyxLQUFLLEVBQUUsS0FBSztRQUNaLFdBQVcsRUFBRSxHQUFHLEVBQUUsR0FBRSxDQUFDO1FBQ3JCLGNBQWMsRUFBRSxHQUFHLEVBQUUsR0FBRSxDQUFDO0tBQ2xCLENBQUM7QUFDWCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtQbGF0Zm9ybX0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcblxuLyoqIEdsb2JhbCByZWdpc3RyeSBmb3IgYWxsIGR5bmFtaWNhbGx5LWNyZWF0ZWQsIGluamVjdGVkIG1lZGlhIHF1ZXJpZXMuICovXG5jb25zdCBtZWRpYVF1ZXJpZXNGb3JXZWJraXRDb21wYXRpYmlsaXR5OiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4vKiogU3R5bGUgdGFnIHRoYXQgaG9sZHMgYWxsIG9mIHRoZSBkeW5hbWljYWxseS1jcmVhdGVkIG1lZGlhIHF1ZXJpZXMuICovXG5sZXQgbWVkaWFRdWVyeVN0eWxlTm9kZTogSFRNTFN0eWxlRWxlbWVudCB8IHVuZGVmaW5lZDtcblxuLyoqIEEgdXRpbGl0eSBmb3IgY2FsbGluZyBtYXRjaE1lZGlhIHF1ZXJpZXMuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBNZWRpYU1hdGNoZXIge1xuICAvKiogVGhlIGludGVybmFsIG1hdGNoTWVkaWEgbWV0aG9kIHRvIHJldHVybiBiYWNrIGEgTWVkaWFRdWVyeUxpc3QgbGlrZSBvYmplY3QuICovXG4gIHByaXZhdGUgX21hdGNoTWVkaWE6IChxdWVyeTogc3RyaW5nKSA9PiBNZWRpYVF1ZXJ5TGlzdDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9wbGF0Zm9ybTogUGxhdGZvcm0pIHtcbiAgICB0aGlzLl9tYXRjaE1lZGlhID1cbiAgICAgIHRoaXMuX3BsYXRmb3JtLmlzQnJvd3NlciAmJiB3aW5kb3cubWF0Y2hNZWRpYVxuICAgICAgICA/IC8vIG1hdGNoTWVkaWEgaXMgYm91bmQgdG8gdGhlIHdpbmRvdyBzY29wZSBpbnRlbnRpb25hbGx5IGFzIGl0IGlzIGFuIGlsbGVnYWwgaW52b2NhdGlvbiB0b1xuICAgICAgICAgIC8vIGNhbGwgaXQgZnJvbSBhIGRpZmZlcmVudCBzY29wZS5cbiAgICAgICAgICB3aW5kb3cubWF0Y2hNZWRpYS5iaW5kKHdpbmRvdylcbiAgICAgICAgOiBub29wTWF0Y2hNZWRpYTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFdmFsdWF0ZXMgdGhlIGdpdmVuIG1lZGlhIHF1ZXJ5IGFuZCByZXR1cm5zIHRoZSBuYXRpdmUgTWVkaWFRdWVyeUxpc3QgZnJvbSB3aGljaCByZXN1bHRzXG4gICAqIGNhbiBiZSByZXRyaWV2ZWQuXG4gICAqIENvbmZpcm1zIHRoZSBsYXlvdXQgZW5naW5lIHdpbGwgdHJpZ2dlciBmb3IgdGhlIHNlbGVjdG9yIHF1ZXJ5IHByb3ZpZGVkIGFuZCByZXR1cm5zIHRoZVxuICAgKiBNZWRpYVF1ZXJ5TGlzdCBmb3IgdGhlIHF1ZXJ5IHByb3ZpZGVkLlxuICAgKi9cbiAgbWF0Y2hNZWRpYShxdWVyeTogc3RyaW5nKTogTWVkaWFRdWVyeUxpc3Qge1xuICAgIGlmICh0aGlzLl9wbGF0Zm9ybS5XRUJLSVQgfHwgdGhpcy5fcGxhdGZvcm0uQkxJTkspIHtcbiAgICAgIGNyZWF0ZUVtcHR5U3R5bGVSdWxlKHF1ZXJ5KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX21hdGNoTWVkaWEocXVlcnkpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlbXB0eSBzdHlsZXNoZWV0IHRoYXQgaXMgdXNlZCB0byB3b3JrIGFyb3VuZCBicm93c2VyIGluY29uc2lzdGVuY2llcyByZWxhdGVkIHRvXG4gKiBgbWF0Y2hNZWRpYWAuIEF0IHRoZSB0aW1lIG9mIHdyaXRpbmcsIGl0IGhhbmRsZXMgdGhlIGZvbGxvd2luZyBjYXNlczpcbiAqIDEuIE9uIFdlYktpdCBicm93c2VycywgYSBtZWRpYSBxdWVyeSBoYXMgdG8gaGF2ZSBhdCBsZWFzdCBvbmUgcnVsZSBpbiBvcmRlciBmb3IgYG1hdGNoTWVkaWFgXG4gKiB0byBmaXJlLiBXZSB3b3JrIGFyb3VuZCBpdCBieSBkZWNsYXJpbmcgYSBkdW1teSBzdHlsZXNoZWV0IHdpdGggYSBgQG1lZGlhYCBkZWNsYXJhdGlvbi5cbiAqIDIuIEluIHNvbWUgY2FzZXMgQmxpbmsgYnJvd3NlcnMgd2lsbCBzdG9wIGZpcmluZyB0aGUgYG1hdGNoTWVkaWFgIGxpc3RlbmVyIGlmIG5vbmUgb2YgdGhlIHJ1bGVzXG4gKiBpbnNpZGUgdGhlIGBAbWVkaWFgIG1hdGNoIGV4aXN0aW5nIGVsZW1lbnRzIG9uIHRoZSBwYWdlLiBXZSB3b3JrIGFyb3VuZCBpdCBieSBoYXZpbmcgb25lIHJ1bGVcbiAqIHRhcmdldGluZyB0aGUgYGJvZHlgLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvY29tcG9uZW50cy9pc3N1ZXMvMjM1NDYuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUVtcHR5U3R5bGVSdWxlKHF1ZXJ5OiBzdHJpbmcpIHtcbiAgaWYgKG1lZGlhUXVlcmllc0ZvcldlYmtpdENvbXBhdGliaWxpdHkuaGFzKHF1ZXJ5KSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRyeSB7XG4gICAgaWYgKCFtZWRpYVF1ZXJ5U3R5bGVOb2RlKSB7XG4gICAgICBtZWRpYVF1ZXJ5U3R5bGVOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICAgIG1lZGlhUXVlcnlTdHlsZU5vZGUuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQvY3NzJyk7XG4gICAgICBkb2N1bWVudC5oZWFkIS5hcHBlbmRDaGlsZChtZWRpYVF1ZXJ5U3R5bGVOb2RlKTtcbiAgICB9XG5cbiAgICBpZiAobWVkaWFRdWVyeVN0eWxlTm9kZS5zaGVldCkge1xuICAgICAgbWVkaWFRdWVyeVN0eWxlTm9kZS5zaGVldC5pbnNlcnRSdWxlKGBAbWVkaWEgJHtxdWVyeX0ge2JvZHl7IH19YCwgMCk7XG4gICAgICBtZWRpYVF1ZXJpZXNGb3JXZWJraXRDb21wYXRpYmlsaXR5LmFkZChxdWVyeSk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5lcnJvcihlKTtcbiAgfVxufVxuXG4vKiogTm8tb3AgbWF0Y2hNZWRpYSByZXBsYWNlbWVudCBmb3Igbm9uLWJyb3dzZXIgcGxhdGZvcm1zLiAqL1xuZnVuY3Rpb24gbm9vcE1hdGNoTWVkaWEocXVlcnk6IHN0cmluZyk6IE1lZGlhUXVlcnlMaXN0IHtcbiAgLy8gVXNlIGBhcyBhbnlgIGhlcmUgdG8gYXZvaWQgYWRkaW5nIGFkZGl0aW9uYWwgbmVjZXNzYXJ5IHByb3BlcnRpZXMgZm9yXG4gIC8vIHRoZSBub29wIG1hdGNoZXIuXG4gIHJldHVybiB7XG4gICAgbWF0Y2hlczogcXVlcnkgPT09ICdhbGwnIHx8IHF1ZXJ5ID09PSAnJyxcbiAgICBtZWRpYTogcXVlcnksXG4gICAgYWRkTGlzdGVuZXI6ICgpID0+IHt9LFxuICAgIHJlbW92ZUxpc3RlbmVyOiAoKSA9PiB7fSxcbiAgfSBhcyBhbnk7XG59XG4iXX0=