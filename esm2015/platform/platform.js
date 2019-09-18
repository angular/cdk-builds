/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Inject, Injectable, Optional, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as i0 from "@angular/core";
// Whether the current platform supports the V8 Break Iterator. The V8 check
// is necessary to detect all Blink based browsers.
/** @type {?} */
let hasV8BreakIterator;
// We need a try/catch around the reference to `Intl`, because accessing it in some cases can
// cause IE to throw. These cases are tied to particular versions of Windows and can happen if
// the consumer is providing a polyfilled `Map`. See:
// https://github.com/Microsoft/ChakraCore/issues/3189
// https://github.com/angular/components/issues/15687
try {
    hasV8BreakIterator = (typeof Intl !== 'undefined' && ((/** @type {?} */ (Intl))).v8BreakIterator);
}
catch (_a) {
    hasV8BreakIterator = false;
}
/**
 * Service to detect the current platform by comparing the userAgent strings and
 * checking browser-specific global properties.
 */
export class Platform {
    /**
     * \@breaking-change 8.0.0 remove optional decorator
     * @param {?=} _platformId
     */
    constructor(_platformId) {
        this._platformId = _platformId;
        /**
         * Whether the Angular application is being rendered in the browser.
         * We want to use the Angular platform check because if the Document is shimmed
         * without the navigator, the following checks will fail. This is preferred because
         * sometimes the Document may be shimmed without the user's knowledge or intention
         */
        this.isBrowser = this._platformId ?
            isPlatformBrowser(this._platformId) : typeof document === 'object' && !!document;
        /**
         * Whether the current browser is Microsoft Edge.
         */
        this.EDGE = this.isBrowser && /(edge)/i.test(navigator.userAgent);
        /**
         * Whether the current rendering engine is Microsoft Trident.
         */
        this.TRIDENT = this.isBrowser && /(msie|trident)/i.test(navigator.userAgent);
        /**
         * Whether the current rendering engine is Blink.
         */
        // EdgeHTML and Trident mock Blink specific things and need to be excluded from this check.
        this.BLINK = this.isBrowser && (!!(((/** @type {?} */ (window))).chrome || hasV8BreakIterator) &&
            typeof CSS !== 'undefined' && !this.EDGE && !this.TRIDENT);
        /**
         * Whether the current rendering engine is WebKit.
         */
        // Webkit is part of the userAgent in EdgeHTML, Blink and Trident. Therefore we need to
        // ensure that Webkit runs standalone and is not used as another engine's base.
        this.WEBKIT = this.isBrowser &&
            /AppleWebKit/i.test(navigator.userAgent) && !this.BLINK && !this.EDGE && !this.TRIDENT;
        /**
         * Whether the current platform is Apple iOS.
         */
        this.IOS = this.isBrowser && /iPad|iPhone|iPod/.test(navigator.userAgent) &&
            !('MSStream' in window);
        /**
         * Whether the current browser is Firefox.
         */
        // It's difficult to detect the plain Gecko engine, because most of the browsers identify
        // them self as Gecko-like browsers and modify the userAgent's according to that.
        // Since we only cover one explicit Firefox case, we can simply check for Firefox
        // instead of having an unstable check for Gecko.
        this.FIREFOX = this.isBrowser && /(firefox|minefield)/i.test(navigator.userAgent);
        /**
         * Whether the current platform is Android.
         */
        // Trident on mobile adds the android platform to the userAgent to trick detections.
        this.ANDROID = this.isBrowser && /android/i.test(navigator.userAgent) && !this.TRIDENT;
        /**
         * Whether the current browser is Safari.
         */
        // Safari browsers will include the Safari keyword in their userAgent. Some browsers may fake
        // this and just place the Safari keyword in the userAgent. To be more safe about Safari every
        // Safari browser should also use Webkit as its layout engine.
        this.SAFARI = this.isBrowser && /safari/i.test(navigator.userAgent) && this.WEBKIT;
    }
}
Platform.decorators = [
    { type: Injectable, args: [{ providedIn: 'root' },] }
];
/** @nocollapse */
Platform.ctorParameters = () => [
    { type: Object, decorators: [{ type: Optional }, { type: Inject, args: [PLATFORM_ID,] }] }
];
/** @nocollapse */ Platform.ngInjectableDef = i0.ɵɵdefineInjectable({ factory: function Platform_Factory() { return new Platform(i0.ɵɵinject(i0.PLATFORM_ID, 8)); }, token: Platform, providedIn: "root" });
if (false) {
    /**
     * Whether the Angular application is being rendered in the browser.
     * We want to use the Angular platform check because if the Document is shimmed
     * without the navigator, the following checks will fail. This is preferred because
     * sometimes the Document may be shimmed without the user's knowledge or intention
     * @type {?}
     */
    Platform.prototype.isBrowser;
    /**
     * Whether the current browser is Microsoft Edge.
     * @type {?}
     */
    Platform.prototype.EDGE;
    /**
     * Whether the current rendering engine is Microsoft Trident.
     * @type {?}
     */
    Platform.prototype.TRIDENT;
    /**
     * Whether the current rendering engine is Blink.
     * @type {?}
     */
    Platform.prototype.BLINK;
    /**
     * Whether the current rendering engine is WebKit.
     * @type {?}
     */
    Platform.prototype.WEBKIT;
    /**
     * Whether the current platform is Apple iOS.
     * @type {?}
     */
    Platform.prototype.IOS;
    /**
     * Whether the current browser is Firefox.
     * @type {?}
     */
    Platform.prototype.FIREFOX;
    /**
     * Whether the current platform is Android.
     * @type {?}
     */
    Platform.prototype.ANDROID;
    /**
     * Whether the current browser is Safari.
     * @type {?}
     */
    Platform.prototype.SAFARI;
    /**
     * @type {?}
     * @private
     */
    Platform.prototype._platformId;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxhdGZvcm0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3BsYXRmb3JtL3BsYXRmb3JtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN4RSxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQzs7Ozs7SUFJOUMsa0JBQTJCOzs7Ozs7QUFPL0IsSUFBSTtJQUNGLGtCQUFrQixHQUFHLENBQUMsT0FBTyxJQUFJLEtBQUssV0FBVyxJQUFJLENBQUMsbUJBQUEsSUFBSSxFQUFPLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQztDQUNyRjtBQUFDLFdBQU07SUFDTixrQkFBa0IsR0FBRyxLQUFLLENBQUM7Q0FDNUI7Ozs7O0FBT0QsTUFBTSxPQUFPLFFBQVE7Ozs7O0lBbURuQixZQUFxRCxXQUFvQjtRQUFwQixnQkFBVyxHQUFYLFdBQVcsQ0FBUzs7Ozs7OztRQTVDekUsY0FBUyxHQUFZLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNuQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sUUFBUSxLQUFLLFFBQVEsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDOzs7O1FBR3JGLFNBQUksR0FBWSxJQUFJLENBQUMsU0FBUyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDOzs7O1FBR3RFLFlBQU8sR0FBWSxJQUFJLENBQUMsU0FBUyxJQUFJLGlCQUFpQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7Ozs7O1FBSWpGLFVBQUssR0FBWSxJQUFJLENBQUMsU0FBUyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxtQkFBQSxNQUFNLEVBQU8sQ0FBQyxDQUFDLE1BQU0sSUFBSSxrQkFBa0IsQ0FBQztZQUNoRixPQUFPLEdBQUcsS0FBSyxXQUFXLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDOzs7Ozs7UUFLL0QsV0FBTSxHQUFZLElBQUksQ0FBQyxTQUFTO1lBQzVCLGNBQWMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDOzs7O1FBRzNGLFFBQUcsR0FBWSxJQUFJLENBQUMsU0FBUyxJQUFJLGtCQUFrQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDO1lBQ3pFLENBQUMsQ0FBQyxVQUFVLElBQUksTUFBTSxDQUFDLENBQUM7Ozs7Ozs7O1FBTzVCLFlBQU8sR0FBWSxJQUFJLENBQUMsU0FBUyxJQUFJLHNCQUFzQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7Ozs7O1FBSXRGLFlBQU8sR0FBWSxJQUFJLENBQUMsU0FBUyxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQzs7Ozs7OztRQU0zRixXQUFNLEdBQVksSUFBSSxDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDO0lBTXpGLENBQUM7OztZQXJEQSxVQUFVLFNBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzs7O1lBb0RxQyxNQUFNLHVCQUE1RCxRQUFRLFlBQUksTUFBTSxTQUFDLFdBQVc7Ozs7Ozs7Ozs7O0lBNUMzQyw2QkFDcUY7Ozs7O0lBR3JGLHdCQUFzRTs7Ozs7SUFHdEUsMkJBQWlGOzs7OztJQUlqRix5QkFDK0Q7Ozs7O0lBSy9ELDBCQUMyRjs7Ozs7SUFHM0YsdUJBQzRCOzs7OztJQU81QiwyQkFBc0Y7Ozs7O0lBSXRGLDJCQUEyRjs7Ozs7SUFNM0YsMEJBQXVGOzs7OztJQUszRSwrQkFBNkQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3QsIEluamVjdGFibGUsIE9wdGlvbmFsLCBQTEFURk9STV9JRH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge2lzUGxhdGZvcm1Ccm93c2VyfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuXG4vLyBXaGV0aGVyIHRoZSBjdXJyZW50IHBsYXRmb3JtIHN1cHBvcnRzIHRoZSBWOCBCcmVhayBJdGVyYXRvci4gVGhlIFY4IGNoZWNrXG4vLyBpcyBuZWNlc3NhcnkgdG8gZGV0ZWN0IGFsbCBCbGluayBiYXNlZCBicm93c2Vycy5cbmxldCBoYXNWOEJyZWFrSXRlcmF0b3I6IGJvb2xlYW47XG5cbi8vIFdlIG5lZWQgYSB0cnkvY2F0Y2ggYXJvdW5kIHRoZSByZWZlcmVuY2UgdG8gYEludGxgLCBiZWNhdXNlIGFjY2Vzc2luZyBpdCBpbiBzb21lIGNhc2VzIGNhblxuLy8gY2F1c2UgSUUgdG8gdGhyb3cuIFRoZXNlIGNhc2VzIGFyZSB0aWVkIHRvIHBhcnRpY3VsYXIgdmVyc2lvbnMgb2YgV2luZG93cyBhbmQgY2FuIGhhcHBlbiBpZlxuLy8gdGhlIGNvbnN1bWVyIGlzIHByb3ZpZGluZyBhIHBvbHlmaWxsZWQgYE1hcGAuIFNlZTpcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9NaWNyb3NvZnQvQ2hha3JhQ29yZS9pc3N1ZXMvMzE4OVxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvY29tcG9uZW50cy9pc3N1ZXMvMTU2ODdcbnRyeSB7XG4gIGhhc1Y4QnJlYWtJdGVyYXRvciA9ICh0eXBlb2YgSW50bCAhPT0gJ3VuZGVmaW5lZCcgJiYgKEludGwgYXMgYW55KS52OEJyZWFrSXRlcmF0b3IpO1xufSBjYXRjaCB7XG4gIGhhc1Y4QnJlYWtJdGVyYXRvciA9IGZhbHNlO1xufVxuXG4vKipcbiAqIFNlcnZpY2UgdG8gZGV0ZWN0IHRoZSBjdXJyZW50IHBsYXRmb3JtIGJ5IGNvbXBhcmluZyB0aGUgdXNlckFnZW50IHN0cmluZ3MgYW5kXG4gKiBjaGVja2luZyBicm93c2VyLXNwZWNpZmljIGdsb2JhbCBwcm9wZXJ0aWVzLlxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBQbGF0Zm9ybSB7XG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBBbmd1bGFyIGFwcGxpY2F0aW9uIGlzIGJlaW5nIHJlbmRlcmVkIGluIHRoZSBicm93c2VyLlxuICAgKiBXZSB3YW50IHRvIHVzZSB0aGUgQW5ndWxhciBwbGF0Zm9ybSBjaGVjayBiZWNhdXNlIGlmIHRoZSBEb2N1bWVudCBpcyBzaGltbWVkXG4gICAqIHdpdGhvdXQgdGhlIG5hdmlnYXRvciwgdGhlIGZvbGxvd2luZyBjaGVja3Mgd2lsbCBmYWlsLiBUaGlzIGlzIHByZWZlcnJlZCBiZWNhdXNlXG4gICAqIHNvbWV0aW1lcyB0aGUgRG9jdW1lbnQgbWF5IGJlIHNoaW1tZWQgd2l0aG91dCB0aGUgdXNlcidzIGtub3dsZWRnZSBvciBpbnRlbnRpb25cbiAgICovXG4gIGlzQnJvd3NlcjogYm9vbGVhbiA9IHRoaXMuX3BsYXRmb3JtSWQgP1xuICAgICAgaXNQbGF0Zm9ybUJyb3dzZXIodGhpcy5fcGxhdGZvcm1JZCkgOiB0eXBlb2YgZG9jdW1lbnQgPT09ICdvYmplY3QnICYmICEhZG9jdW1lbnQ7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGN1cnJlbnQgYnJvd3NlciBpcyBNaWNyb3NvZnQgRWRnZS4gKi9cbiAgRURHRTogYm9vbGVhbiA9IHRoaXMuaXNCcm93c2VyICYmIC8oZWRnZSkvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBjdXJyZW50IHJlbmRlcmluZyBlbmdpbmUgaXMgTWljcm9zb2Z0IFRyaWRlbnQuICovXG4gIFRSSURFTlQ6IGJvb2xlYW4gPSB0aGlzLmlzQnJvd3NlciAmJiAvKG1zaWV8dHJpZGVudCkvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBjdXJyZW50IHJlbmRlcmluZyBlbmdpbmUgaXMgQmxpbmsuICovXG4gIC8vIEVkZ2VIVE1MIGFuZCBUcmlkZW50IG1vY2sgQmxpbmsgc3BlY2lmaWMgdGhpbmdzIGFuZCBuZWVkIHRvIGJlIGV4Y2x1ZGVkIGZyb20gdGhpcyBjaGVjay5cbiAgQkxJTks6IGJvb2xlYW4gPSB0aGlzLmlzQnJvd3NlciAmJiAoISEoKHdpbmRvdyBhcyBhbnkpLmNocm9tZSB8fCBoYXNWOEJyZWFrSXRlcmF0b3IpICYmXG4gICAgICB0eXBlb2YgQ1NTICE9PSAndW5kZWZpbmVkJyAmJiAhdGhpcy5FREdFICYmICF0aGlzLlRSSURFTlQpO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBjdXJyZW50IHJlbmRlcmluZyBlbmdpbmUgaXMgV2ViS2l0LiAqL1xuICAvLyBXZWJraXQgaXMgcGFydCBvZiB0aGUgdXNlckFnZW50IGluIEVkZ2VIVE1MLCBCbGluayBhbmQgVHJpZGVudC4gVGhlcmVmb3JlIHdlIG5lZWQgdG9cbiAgLy8gZW5zdXJlIHRoYXQgV2Via2l0IHJ1bnMgc3RhbmRhbG9uZSBhbmQgaXMgbm90IHVzZWQgYXMgYW5vdGhlciBlbmdpbmUncyBiYXNlLlxuICBXRUJLSVQ6IGJvb2xlYW4gPSB0aGlzLmlzQnJvd3NlciAmJlxuICAgICAgL0FwcGxlV2ViS2l0L2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSAmJiAhdGhpcy5CTElOSyAmJiAhdGhpcy5FREdFICYmICF0aGlzLlRSSURFTlQ7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGN1cnJlbnQgcGxhdGZvcm0gaXMgQXBwbGUgaU9TLiAqL1xuICBJT1M6IGJvb2xlYW4gPSB0aGlzLmlzQnJvd3NlciAmJiAvaVBhZHxpUGhvbmV8aVBvZC8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSAmJlxuICAgICAgISgnTVNTdHJlYW0nIGluIHdpbmRvdyk7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGN1cnJlbnQgYnJvd3NlciBpcyBGaXJlZm94LiAqL1xuICAvLyBJdCdzIGRpZmZpY3VsdCB0byBkZXRlY3QgdGhlIHBsYWluIEdlY2tvIGVuZ2luZSwgYmVjYXVzZSBtb3N0IG9mIHRoZSBicm93c2VycyBpZGVudGlmeVxuICAvLyB0aGVtIHNlbGYgYXMgR2Vja28tbGlrZSBicm93c2VycyBhbmQgbW9kaWZ5IHRoZSB1c2VyQWdlbnQncyBhY2NvcmRpbmcgdG8gdGhhdC5cbiAgLy8gU2luY2Ugd2Ugb25seSBjb3ZlciBvbmUgZXhwbGljaXQgRmlyZWZveCBjYXNlLCB3ZSBjYW4gc2ltcGx5IGNoZWNrIGZvciBGaXJlZm94XG4gIC8vIGluc3RlYWQgb2YgaGF2aW5nIGFuIHVuc3RhYmxlIGNoZWNrIGZvciBHZWNrby5cbiAgRklSRUZPWDogYm9vbGVhbiA9IHRoaXMuaXNCcm93c2VyICYmIC8oZmlyZWZveHxtaW5lZmllbGQpL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcblxuICAvKiogV2hldGhlciB0aGUgY3VycmVudCBwbGF0Zm9ybSBpcyBBbmRyb2lkLiAqL1xuICAvLyBUcmlkZW50IG9uIG1vYmlsZSBhZGRzIHRoZSBhbmRyb2lkIHBsYXRmb3JtIHRvIHRoZSB1c2VyQWdlbnQgdG8gdHJpY2sgZGV0ZWN0aW9ucy5cbiAgQU5EUk9JRDogYm9vbGVhbiA9IHRoaXMuaXNCcm93c2VyICYmIC9hbmRyb2lkL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSAmJiAhdGhpcy5UUklERU5UO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBjdXJyZW50IGJyb3dzZXIgaXMgU2FmYXJpLiAqL1xuICAvLyBTYWZhcmkgYnJvd3NlcnMgd2lsbCBpbmNsdWRlIHRoZSBTYWZhcmkga2V5d29yZCBpbiB0aGVpciB1c2VyQWdlbnQuIFNvbWUgYnJvd3NlcnMgbWF5IGZha2VcbiAgLy8gdGhpcyBhbmQganVzdCBwbGFjZSB0aGUgU2FmYXJpIGtleXdvcmQgaW4gdGhlIHVzZXJBZ2VudC4gVG8gYmUgbW9yZSBzYWZlIGFib3V0IFNhZmFyaSBldmVyeVxuICAvLyBTYWZhcmkgYnJvd3NlciBzaG91bGQgYWxzbyB1c2UgV2Via2l0IGFzIGl0cyBsYXlvdXQgZW5naW5lLlxuICBTQUZBUkk6IGJvb2xlYW4gPSB0aGlzLmlzQnJvd3NlciAmJiAvc2FmYXJpL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSAmJiB0aGlzLldFQktJVDtcblxuICAvKipcbiAgICogQGJyZWFraW5nLWNoYW5nZSA4LjAuMCByZW1vdmUgb3B0aW9uYWwgZGVjb3JhdG9yXG4gICAqL1xuICBjb25zdHJ1Y3RvcihAT3B0aW9uYWwoKSBASW5qZWN0KFBMQVRGT1JNX0lEKSBwcml2YXRlIF9wbGF0Zm9ybUlkPzogT2JqZWN0KSB7XG59XG59XG5cbiJdfQ==