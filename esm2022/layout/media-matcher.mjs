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
class MediaMatcher {
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: MediaMatcher, deps: [{ token: i1.Platform }, { token: CSP_NONCE, optional: true }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: MediaMatcher, providedIn: 'root' }); }
}
export { MediaMatcher };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: MediaMatcher, decorators: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVkaWEtbWF0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvbGF5b3V0L21lZGlhLW1hdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBQ0gsT0FBTyxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN0RSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7OztBQUUvQywyRUFBMkU7QUFDM0UsTUFBTSxrQ0FBa0MsR0FBZ0IsSUFBSSxHQUFHLEVBQVUsQ0FBQztBQUUxRSx5RUFBeUU7QUFDekUsSUFBSSxtQkFBaUQsQ0FBQztBQUV0RCxnREFBZ0Q7QUFDaEQsTUFDYSxZQUFZO0lBSXZCLFlBQ1UsU0FBbUIsRUFDWSxNQUFzQjtRQURyRCxjQUFTLEdBQVQsU0FBUyxDQUFVO1FBQ1ksV0FBTSxHQUFOLE1BQU0sQ0FBZ0I7UUFFN0QsSUFBSSxDQUFDLFdBQVc7WUFDZCxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsSUFBSSxNQUFNLENBQUMsVUFBVTtnQkFDM0MsQ0FBQyxDQUFDLDBGQUEwRjtvQkFDMUYsa0NBQWtDO29CQUNsQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQ2hDLENBQUMsQ0FBQyxjQUFjLENBQUM7SUFDdkIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsVUFBVSxDQUFDLEtBQWE7UUFDdEIsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRTtZQUNqRCxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQzFDO1FBQ0QsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2pDLENBQUM7OEdBM0JVLFlBQVksMENBTUQsU0FBUztrSEFOcEIsWUFBWSxjQURBLE1BQU07O1NBQ2xCLFlBQVk7MkZBQVosWUFBWTtrQkFEeEIsVUFBVTttQkFBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7OzBCQU8zQixRQUFROzswQkFBSSxNQUFNOzJCQUFDLFNBQVM7O0FBd0JqQzs7Ozs7Ozs7R0FRRztBQUNILFNBQVMsb0JBQW9CLENBQUMsS0FBYSxFQUFFLEtBQWdDO0lBQzNFLElBQUksa0NBQWtDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ2pELE9BQU87S0FDUjtJQUVELElBQUk7UUFDRixJQUFJLENBQUMsbUJBQW1CLEVBQUU7WUFDeEIsbUJBQW1CLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUV0RCxJQUFJLEtBQUssRUFBRTtnQkFDVCxtQkFBbUIsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO2FBQ25DO1lBRUQsbUJBQW1CLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNyRCxRQUFRLENBQUMsSUFBSyxDQUFDLFdBQVcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1NBQ2pEO1FBRUQsSUFBSSxtQkFBbUIsQ0FBQyxLQUFLLEVBQUU7WUFDN0IsbUJBQW1CLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxVQUFVLEtBQUssWUFBWSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLGtDQUFrQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUMvQztLQUNGO0lBQUMsT0FBTyxDQUFDLEVBQUU7UUFDVixPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ2xCO0FBQ0gsQ0FBQztBQUVELDhEQUE4RDtBQUM5RCxTQUFTLGNBQWMsQ0FBQyxLQUFhO0lBQ25DLHdFQUF3RTtJQUN4RSxvQkFBb0I7SUFDcEIsT0FBTztRQUNMLE9BQU8sRUFBRSxLQUFLLEtBQUssS0FBSyxJQUFJLEtBQUssS0FBSyxFQUFFO1FBQ3hDLEtBQUssRUFBRSxLQUFLO1FBQ1osV0FBVyxFQUFFLEdBQUcsRUFBRSxHQUFFLENBQUM7UUFDckIsY0FBYyxFQUFFLEdBQUcsRUFBRSxHQUFFLENBQUM7S0FDbEIsQ0FBQztBQUNYLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7SW5qZWN0YWJsZSwgQ1NQX05PTkNFLCBPcHRpb25hbCwgSW5qZWN0fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7UGxhdGZvcm19IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5cbi8qKiBHbG9iYWwgcmVnaXN0cnkgZm9yIGFsbCBkeW5hbWljYWxseS1jcmVhdGVkLCBpbmplY3RlZCBtZWRpYSBxdWVyaWVzLiAqL1xuY29uc3QgbWVkaWFRdWVyaWVzRm9yV2Via2l0Q29tcGF0aWJpbGl0eTogU2V0PHN0cmluZz4gPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuLyoqIFN0eWxlIHRhZyB0aGF0IGhvbGRzIGFsbCBvZiB0aGUgZHluYW1pY2FsbHktY3JlYXRlZCBtZWRpYSBxdWVyaWVzLiAqL1xubGV0IG1lZGlhUXVlcnlTdHlsZU5vZGU6IEhUTUxTdHlsZUVsZW1lbnQgfCB1bmRlZmluZWQ7XG5cbi8qKiBBIHV0aWxpdHkgZm9yIGNhbGxpbmcgbWF0Y2hNZWRpYSBxdWVyaWVzLiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgTWVkaWFNYXRjaGVyIHtcbiAgLyoqIFRoZSBpbnRlcm5hbCBtYXRjaE1lZGlhIG1ldGhvZCB0byByZXR1cm4gYmFjayBhIE1lZGlhUXVlcnlMaXN0IGxpa2Ugb2JqZWN0LiAqL1xuICBwcml2YXRlIF9tYXRjaE1lZGlhOiAocXVlcnk6IHN0cmluZykgPT4gTWVkaWFRdWVyeUxpc3Q7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfcGxhdGZvcm06IFBsYXRmb3JtLFxuICAgIEBPcHRpb25hbCgpIEBJbmplY3QoQ1NQX05PTkNFKSBwcml2YXRlIF9ub25jZT86IHN0cmluZyB8IG51bGwsXG4gICkge1xuICAgIHRoaXMuX21hdGNoTWVkaWEgPVxuICAgICAgdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyICYmIHdpbmRvdy5tYXRjaE1lZGlhXG4gICAgICAgID8gLy8gbWF0Y2hNZWRpYSBpcyBib3VuZCB0byB0aGUgd2luZG93IHNjb3BlIGludGVudGlvbmFsbHkgYXMgaXQgaXMgYW4gaWxsZWdhbCBpbnZvY2F0aW9uIHRvXG4gICAgICAgICAgLy8gY2FsbCBpdCBmcm9tIGEgZGlmZmVyZW50IHNjb3BlLlxuICAgICAgICAgIHdpbmRvdy5tYXRjaE1lZGlhLmJpbmQod2luZG93KVxuICAgICAgICA6IG5vb3BNYXRjaE1lZGlhO1xuICB9XG5cbiAgLyoqXG4gICAqIEV2YWx1YXRlcyB0aGUgZ2l2ZW4gbWVkaWEgcXVlcnkgYW5kIHJldHVybnMgdGhlIG5hdGl2ZSBNZWRpYVF1ZXJ5TGlzdCBmcm9tIHdoaWNoIHJlc3VsdHNcbiAgICogY2FuIGJlIHJldHJpZXZlZC5cbiAgICogQ29uZmlybXMgdGhlIGxheW91dCBlbmdpbmUgd2lsbCB0cmlnZ2VyIGZvciB0aGUgc2VsZWN0b3IgcXVlcnkgcHJvdmlkZWQgYW5kIHJldHVybnMgdGhlXG4gICAqIE1lZGlhUXVlcnlMaXN0IGZvciB0aGUgcXVlcnkgcHJvdmlkZWQuXG4gICAqL1xuICBtYXRjaE1lZGlhKHF1ZXJ5OiBzdHJpbmcpOiBNZWRpYVF1ZXJ5TGlzdCB7XG4gICAgaWYgKHRoaXMuX3BsYXRmb3JtLldFQktJVCB8fCB0aGlzLl9wbGF0Zm9ybS5CTElOSykge1xuICAgICAgY3JlYXRlRW1wdHlTdHlsZVJ1bGUocXVlcnksIHRoaXMuX25vbmNlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX21hdGNoTWVkaWEocXVlcnkpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlbXB0eSBzdHlsZXNoZWV0IHRoYXQgaXMgdXNlZCB0byB3b3JrIGFyb3VuZCBicm93c2VyIGluY29uc2lzdGVuY2llcyByZWxhdGVkIHRvXG4gKiBgbWF0Y2hNZWRpYWAuIEF0IHRoZSB0aW1lIG9mIHdyaXRpbmcsIGl0IGhhbmRsZXMgdGhlIGZvbGxvd2luZyBjYXNlczpcbiAqIDEuIE9uIFdlYktpdCBicm93c2VycywgYSBtZWRpYSBxdWVyeSBoYXMgdG8gaGF2ZSBhdCBsZWFzdCBvbmUgcnVsZSBpbiBvcmRlciBmb3IgYG1hdGNoTWVkaWFgXG4gKiB0byBmaXJlLiBXZSB3b3JrIGFyb3VuZCBpdCBieSBkZWNsYXJpbmcgYSBkdW1teSBzdHlsZXNoZWV0IHdpdGggYSBgQG1lZGlhYCBkZWNsYXJhdGlvbi5cbiAqIDIuIEluIHNvbWUgY2FzZXMgQmxpbmsgYnJvd3NlcnMgd2lsbCBzdG9wIGZpcmluZyB0aGUgYG1hdGNoTWVkaWFgIGxpc3RlbmVyIGlmIG5vbmUgb2YgdGhlIHJ1bGVzXG4gKiBpbnNpZGUgdGhlIGBAbWVkaWFgIG1hdGNoIGV4aXN0aW5nIGVsZW1lbnRzIG9uIHRoZSBwYWdlLiBXZSB3b3JrIGFyb3VuZCBpdCBieSBoYXZpbmcgb25lIHJ1bGVcbiAqIHRhcmdldGluZyB0aGUgYGJvZHlgLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvY29tcG9uZW50cy9pc3N1ZXMvMjM1NDYuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUVtcHR5U3R5bGVSdWxlKHF1ZXJ5OiBzdHJpbmcsIG5vbmNlOiBzdHJpbmcgfCB1bmRlZmluZWQgfCBudWxsKSB7XG4gIGlmIChtZWRpYVF1ZXJpZXNGb3JXZWJraXRDb21wYXRpYmlsaXR5LmhhcyhxdWVyeSkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0cnkge1xuICAgIGlmICghbWVkaWFRdWVyeVN0eWxlTm9kZSkge1xuICAgICAgbWVkaWFRdWVyeVN0eWxlTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG5cbiAgICAgIGlmIChub25jZSkge1xuICAgICAgICBtZWRpYVF1ZXJ5U3R5bGVOb2RlLm5vbmNlID0gbm9uY2U7XG4gICAgICB9XG5cbiAgICAgIG1lZGlhUXVlcnlTdHlsZU5vZGUuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQvY3NzJyk7XG4gICAgICBkb2N1bWVudC5oZWFkIS5hcHBlbmRDaGlsZChtZWRpYVF1ZXJ5U3R5bGVOb2RlKTtcbiAgICB9XG5cbiAgICBpZiAobWVkaWFRdWVyeVN0eWxlTm9kZS5zaGVldCkge1xuICAgICAgbWVkaWFRdWVyeVN0eWxlTm9kZS5zaGVldC5pbnNlcnRSdWxlKGBAbWVkaWEgJHtxdWVyeX0ge2JvZHl7IH19YCwgMCk7XG4gICAgICBtZWRpYVF1ZXJpZXNGb3JXZWJraXRDb21wYXRpYmlsaXR5LmFkZChxdWVyeSk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5lcnJvcihlKTtcbiAgfVxufVxuXG4vKiogTm8tb3AgbWF0Y2hNZWRpYSByZXBsYWNlbWVudCBmb3Igbm9uLWJyb3dzZXIgcGxhdGZvcm1zLiAqL1xuZnVuY3Rpb24gbm9vcE1hdGNoTWVkaWEocXVlcnk6IHN0cmluZyk6IE1lZGlhUXVlcnlMaXN0IHtcbiAgLy8gVXNlIGBhcyBhbnlgIGhlcmUgdG8gYXZvaWQgYWRkaW5nIGFkZGl0aW9uYWwgbmVjZXNzYXJ5IHByb3BlcnRpZXMgZm9yXG4gIC8vIHRoZSBub29wIG1hdGNoZXIuXG4gIHJldHVybiB7XG4gICAgbWF0Y2hlczogcXVlcnkgPT09ICdhbGwnIHx8IHF1ZXJ5ID09PSAnJyxcbiAgICBtZWRpYTogcXVlcnksXG4gICAgYWRkTGlzdGVuZXI6ICgpID0+IHt9LFxuICAgIHJlbW92ZUxpc3RlbmVyOiAoKSA9PiB7fSxcbiAgfSBhcyBhbnk7XG59XG4iXX0=