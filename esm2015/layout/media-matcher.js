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
MediaMatcher.ɵprov = i0.ɵɵdefineInjectable({ factory: function MediaMatcher_Factory() { return new MediaMatcher(i0.ɵɵinject(i1.Platform)); }, token: MediaMatcher, providedIn: "root" });
MediaMatcher.decorators = [
    { type: Injectable, args: [{ providedIn: 'root' },] }
];
MediaMatcher.ctorParameters = () => [
    { type: Platform }
];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVkaWEtbWF0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvbGF5b3V0L21lZGlhLW1hdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBQ0gsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN6QyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7OztBQUUvQywyRUFBMkU7QUFDM0UsTUFBTSxrQ0FBa0MsR0FBZ0IsSUFBSSxHQUFHLEVBQVUsQ0FBQztBQUUxRSx5RUFBeUU7QUFDekUsSUFBSSxtQkFBaUQsQ0FBQztBQUV0RCxnREFBZ0Q7QUFFaEQsTUFBTSxPQUFPLFlBQVk7SUFJdkIsWUFBb0IsU0FBbUI7UUFBbkIsY0FBUyxHQUFULFNBQVMsQ0FBVTtRQUNyQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxJQUFJLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNoRSwwRkFBMEY7WUFDMUYsa0NBQWtDO1lBQ2xDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDaEMsY0FBYyxDQUFDO0lBQ25CLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFVBQVUsQ0FBQyxLQUFhO1FBQ3RCLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUU7WUFDakQsb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDN0I7UUFDRCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDakMsQ0FBQzs7OztZQXhCRixVQUFVLFNBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzs7WUFUeEIsUUFBUTs7QUFvQ2hCOzs7Ozs7OztHQVFHO0FBQ0gsU0FBUyxvQkFBb0IsQ0FBQyxLQUFhO0lBQ3pDLElBQUksa0NBQWtDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ2pELE9BQU87S0FDUjtJQUVELElBQUk7UUFDRixJQUFJLENBQUMsbUJBQW1CLEVBQUU7WUFDeEIsbUJBQW1CLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN0RCxtQkFBbUIsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ3JELFFBQVEsQ0FBQyxJQUFLLENBQUMsV0FBVyxDQUFDLG1CQUFtQixDQUFDLENBQUM7U0FDakQ7UUFFRCxJQUFJLG1CQUFtQixDQUFDLEtBQUssRUFBRTtZQUM3QixtQkFBbUIsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFVBQVUsS0FBSyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckUsa0NBQWtDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQy9DO0tBQ0Y7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDbEI7QUFDSCxDQUFDO0FBRUQsOERBQThEO0FBQzlELFNBQVMsY0FBYyxDQUFDLEtBQWE7SUFDbkMsd0VBQXdFO0lBQ3hFLG9CQUFvQjtJQUNwQixPQUFPO1FBQ0wsT0FBTyxFQUFFLEtBQUssS0FBSyxLQUFLLElBQUksS0FBSyxLQUFLLEVBQUU7UUFDeEMsS0FBSyxFQUFFLEtBQUs7UUFDWixXQUFXLEVBQUUsR0FBRyxFQUFFLEdBQUUsQ0FBQztRQUNyQixjQUFjLEVBQUUsR0FBRyxFQUFFLEdBQUUsQ0FBQztLQUNsQixDQUFDO0FBQ1gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtJbmplY3RhYmxlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7UGxhdGZvcm19IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5cbi8qKiBHbG9iYWwgcmVnaXN0cnkgZm9yIGFsbCBkeW5hbWljYWxseS1jcmVhdGVkLCBpbmplY3RlZCBtZWRpYSBxdWVyaWVzLiAqL1xuY29uc3QgbWVkaWFRdWVyaWVzRm9yV2Via2l0Q29tcGF0aWJpbGl0eTogU2V0PHN0cmluZz4gPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuLyoqIFN0eWxlIHRhZyB0aGF0IGhvbGRzIGFsbCBvZiB0aGUgZHluYW1pY2FsbHktY3JlYXRlZCBtZWRpYSBxdWVyaWVzLiAqL1xubGV0IG1lZGlhUXVlcnlTdHlsZU5vZGU6IEhUTUxTdHlsZUVsZW1lbnQgfCB1bmRlZmluZWQ7XG5cbi8qKiBBIHV0aWxpdHkgZm9yIGNhbGxpbmcgbWF0Y2hNZWRpYSBxdWVyaWVzLiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgTWVkaWFNYXRjaGVyIHtcbiAgLyoqIFRoZSBpbnRlcm5hbCBtYXRjaE1lZGlhIG1ldGhvZCB0byByZXR1cm4gYmFjayBhIE1lZGlhUXVlcnlMaXN0IGxpa2Ugb2JqZWN0LiAqL1xuICBwcml2YXRlIF9tYXRjaE1lZGlhOiAocXVlcnk6IHN0cmluZykgPT4gTWVkaWFRdWVyeUxpc3Q7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfcGxhdGZvcm06IFBsYXRmb3JtKSB7XG4gICAgdGhpcy5fbWF0Y2hNZWRpYSA9IHRoaXMuX3BsYXRmb3JtLmlzQnJvd3NlciAmJiB3aW5kb3cubWF0Y2hNZWRpYSA/XG4gICAgICAvLyBtYXRjaE1lZGlhIGlzIGJvdW5kIHRvIHRoZSB3aW5kb3cgc2NvcGUgaW50ZW50aW9uYWxseSBhcyBpdCBpcyBhbiBpbGxlZ2FsIGludm9jYXRpb24gdG9cbiAgICAgIC8vIGNhbGwgaXQgZnJvbSBhIGRpZmZlcmVudCBzY29wZS5cbiAgICAgIHdpbmRvdy5tYXRjaE1lZGlhLmJpbmQod2luZG93KSA6XG4gICAgICBub29wTWF0Y2hNZWRpYTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFdmFsdWF0ZXMgdGhlIGdpdmVuIG1lZGlhIHF1ZXJ5IGFuZCByZXR1cm5zIHRoZSBuYXRpdmUgTWVkaWFRdWVyeUxpc3QgZnJvbSB3aGljaCByZXN1bHRzXG4gICAqIGNhbiBiZSByZXRyaWV2ZWQuXG4gICAqIENvbmZpcm1zIHRoZSBsYXlvdXQgZW5naW5lIHdpbGwgdHJpZ2dlciBmb3IgdGhlIHNlbGVjdG9yIHF1ZXJ5IHByb3ZpZGVkIGFuZCByZXR1cm5zIHRoZVxuICAgKiBNZWRpYVF1ZXJ5TGlzdCBmb3IgdGhlIHF1ZXJ5IHByb3ZpZGVkLlxuICAgKi9cbiAgbWF0Y2hNZWRpYShxdWVyeTogc3RyaW5nKTogTWVkaWFRdWVyeUxpc3Qge1xuICAgIGlmICh0aGlzLl9wbGF0Zm9ybS5XRUJLSVQgfHwgdGhpcy5fcGxhdGZvcm0uQkxJTkspIHtcbiAgICAgIGNyZWF0ZUVtcHR5U3R5bGVSdWxlKHF1ZXJ5KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX21hdGNoTWVkaWEocXVlcnkpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlbXB0eSBzdHlsZXNoZWV0IHRoYXQgaXMgdXNlZCB0byB3b3JrIGFyb3VuZCBicm93c2VyIGluY29uc2lzdGVuY2llcyByZWxhdGVkIHRvXG4gKiBgbWF0Y2hNZWRpYWAuIEF0IHRoZSB0aW1lIG9mIHdyaXRpbmcsIGl0IGhhbmRsZXMgdGhlIGZvbGxvd2luZyBjYXNlczpcbiAqIDEuIE9uIFdlYktpdCBicm93c2VycywgYSBtZWRpYSBxdWVyeSBoYXMgdG8gaGF2ZSBhdCBsZWFzdCBvbmUgcnVsZSBpbiBvcmRlciBmb3IgYG1hdGNoTWVkaWFgXG4gKiB0byBmaXJlLiBXZSB3b3JrIGFyb3VuZCBpdCBieSBkZWNsYXJpbmcgYSBkdW1teSBzdHlsZXNoZWV0IHdpdGggYSBgQG1lZGlhYCBkZWNsYXJhdGlvbi5cbiAqIDIuIEluIHNvbWUgY2FzZXMgQmxpbmsgYnJvd3NlcnMgd2lsbCBzdG9wIGZpcmluZyB0aGUgYG1hdGNoTWVkaWFgIGxpc3RlbmVyIGlmIG5vbmUgb2YgdGhlIHJ1bGVzXG4gKiBpbnNpZGUgdGhlIGBAbWVkaWFgIG1hdGNoIGV4aXN0aW5nIGVsZW1lbnRzIG9uIHRoZSBwYWdlLiBXZSB3b3JrIGFyb3VuZCBpdCBieSBoYXZpbmcgb25lIHJ1bGVcbiAqIHRhcmdldGluZyB0aGUgYGJvZHlgLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvY29tcG9uZW50cy9pc3N1ZXMvMjM1NDYuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUVtcHR5U3R5bGVSdWxlKHF1ZXJ5OiBzdHJpbmcpIHtcbiAgaWYgKG1lZGlhUXVlcmllc0ZvcldlYmtpdENvbXBhdGliaWxpdHkuaGFzKHF1ZXJ5KSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRyeSB7XG4gICAgaWYgKCFtZWRpYVF1ZXJ5U3R5bGVOb2RlKSB7XG4gICAgICBtZWRpYVF1ZXJ5U3R5bGVOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICAgIG1lZGlhUXVlcnlTdHlsZU5vZGUuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQvY3NzJyk7XG4gICAgICBkb2N1bWVudC5oZWFkIS5hcHBlbmRDaGlsZChtZWRpYVF1ZXJ5U3R5bGVOb2RlKTtcbiAgICB9XG5cbiAgICBpZiAobWVkaWFRdWVyeVN0eWxlTm9kZS5zaGVldCkge1xuICAgICAgbWVkaWFRdWVyeVN0eWxlTm9kZS5zaGVldC5pbnNlcnRSdWxlKGBAbWVkaWEgJHtxdWVyeX0ge2JvZHl7IH19YCwgMCk7XG4gICAgICBtZWRpYVF1ZXJpZXNGb3JXZWJraXRDb21wYXRpYmlsaXR5LmFkZChxdWVyeSk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5lcnJvcihlKTtcbiAgfVxufVxuXG4vKiogTm8tb3AgbWF0Y2hNZWRpYSByZXBsYWNlbWVudCBmb3Igbm9uLWJyb3dzZXIgcGxhdGZvcm1zLiAqL1xuZnVuY3Rpb24gbm9vcE1hdGNoTWVkaWEocXVlcnk6IHN0cmluZyk6IE1lZGlhUXVlcnlMaXN0IHtcbiAgLy8gVXNlIGBhcyBhbnlgIGhlcmUgdG8gYXZvaWQgYWRkaW5nIGFkZGl0aW9uYWwgbmVjZXNzYXJ5IHByb3BlcnRpZXMgZm9yXG4gIC8vIHRoZSBub29wIG1hdGNoZXIuXG4gIHJldHVybiB7XG4gICAgbWF0Y2hlczogcXVlcnkgPT09ICdhbGwnIHx8IHF1ZXJ5ID09PSAnJyxcbiAgICBtZWRpYTogcXVlcnksXG4gICAgYWRkTGlzdGVuZXI6ICgpID0+IHt9LFxuICAgIHJlbW92ZUxpc3RlbmVyOiAoKSA9PiB7fVxuICB9IGFzIGFueTtcbn1cbiJdfQ==