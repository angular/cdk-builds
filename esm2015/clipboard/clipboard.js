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
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
/**
 * A service for copying text to the clipboard.
 *
 * Example usage:
 *
 * clipboard.copy("copy this text");
 */
export class Clipboard {
    /**
     * @param {?} document
     */
    constructor(document) {
        this._document = document;
    }
    /**
     * Copies the provided text into the user's clipboard.
     *
     * @param {?} text The string to copy.
     * @return {?} Whether the operation was successful.
     */
    copy(text) {
        /** @type {?} */
        const pendingCopy = this.beginCopy(text);
        /** @type {?} */
        const successful = pendingCopy.copy();
        pendingCopy.destroy();
        return successful;
    }
    /**
     * Prepares a string to be copied later. This is useful for large strings
     * which take too long to successfully render and be copied in the same tick.
     *
     * The caller must call `destroy` on the returned `PendingCopy`.
     *
     * @param {?} text The string to copy.
     * @return {?} the pending copy operation.
     */
    beginCopy(text) {
        return new PendingCopy(text, this._document);
    }
}
Clipboard.decorators = [
    { type: Injectable, args: [{ providedIn: 'root' },] }
];
/** @nocollapse */
Clipboard.ctorParameters = () => [
    { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] }
];
/** @nocollapse */ Clipboard.ngInjectableDef = i0.ɵɵdefineInjectable({ factory: function Clipboard_Factory() { return new Clipboard(i0.ɵɵinject(i1.DOCUMENT)); }, token: Clipboard, providedIn: "root" });
if (false) {
    /**
     * @type {?}
     * @private
     */
    Clipboard.prototype._document;
}
/**
 * A pending copy-to-clipboard operation.
 *
 * The implementation of copying text to the clipboard modifies the DOM and
 * forces a relayout. This relayout can take too long if the string is large,
 * causing the execCommand('copy') to happen too long after the user clicked.
 * This results in the browser refusing to copy. This object lets the
 * relayout happen in a separate tick from copying by providing a copy function
 * that can be called later.
 *
 * Destroy must be called when no longer in use, regardless of whether `copy` is
 * called.
 */
export class PendingCopy {
    /**
     * @param {?} text
     * @param {?} _document
     */
    constructor(text, _document) {
        this._document = _document;
        /** @type {?} */
        const textarea = this._textarea = this._document.createElement('textarea');
        /** @type {?} */
        const styles = textarea.style;
        // Hide the element for display and accessibility. Set an
        // absolute position so the page layout isn't affected.
        styles.opacity = '0';
        styles.position = 'absolute';
        styles.left = styles.top = '-999em';
        textarea.setAttribute('aria-hidden', 'true');
        textarea.value = text;
        this._document.body.appendChild(textarea);
    }
    /**
     * Finishes copying the text.
     * @return {?}
     */
    copy() {
        /** @type {?} */
        const textarea = this._textarea;
        /** @type {?} */
        let successful = false;
        try { // Older browsers could throw if copy is not supported.
            if (textarea) {
                /** @type {?} */
                const currentFocus = this._document.activeElement;
                textarea.select();
                textarea.setSelectionRange(0, textarea.value.length);
                successful = this._document.execCommand('copy');
                if (currentFocus && currentFocus instanceof HTMLElement) {
                    currentFocus.focus();
                }
            }
        }
        catch (_a) {
            // Discard error.
            // Initial setting of {@code successful} will represent failure here.
        }
        return successful;
    }
    /**
     * Cleans up DOM changes used to perform the copy operation.
     * @return {?}
     */
    destroy() {
        /** @type {?} */
        const textarea = this._textarea;
        if (textarea) {
            if (textarea.parentNode) {
                textarea.parentNode.removeChild(textarea);
            }
            this._textarea = undefined;
        }
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    PendingCopy.prototype._textarea;
    /**
     * @type {?}
     * @private
     */
    PendingCopy.prototype._document;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpcGJvYXJkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9jbGlwYm9hcmQvY2xpcGJvYXJkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDOzs7Ozs7Ozs7O0FBVWpELE1BQU0sT0FBTyxTQUFTOzs7O0lBR3BCLFlBQThCLFFBQWE7UUFDekMsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7SUFDNUIsQ0FBQzs7Ozs7OztJQVFELElBQUksQ0FBQyxJQUFZOztjQUNULFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQzs7Y0FDbEMsVUFBVSxHQUFHLFdBQVcsQ0FBQyxJQUFJLEVBQUU7UUFDckMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRXRCLE9BQU8sVUFBVSxDQUFDO0lBQ3BCLENBQUM7Ozs7Ozs7Ozs7SUFXRCxTQUFTLENBQUMsSUFBWTtRQUNwQixPQUFPLElBQUksV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDL0MsQ0FBQzs7O1lBakNGLFVBQVUsU0FBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7Ozs7NENBSWpCLE1BQU0sU0FBQyxRQUFROzs7Ozs7OztJQUY1Qiw4QkFBNEI7Ozs7Ozs7Ozs7Ozs7OztBQStDOUIsTUFBTSxPQUFPLFdBQVc7Ozs7O0lBR3RCLFlBQVksSUFBWSxFQUFtQixTQUFtQjtRQUFuQixjQUFTLEdBQVQsU0FBUyxDQUFVOztjQUN0RCxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUM7O2NBQ3BFLE1BQU0sR0FBRyxRQUFRLENBQUMsS0FBSztRQUU3Qix5REFBeUQ7UUFDekQsdURBQXVEO1FBQ3ZELE1BQU0sQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDO1FBQ3JCLE1BQU0sQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDO1FBQzdCLE1BQU0sQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLEdBQUcsR0FBRyxRQUFRLENBQUM7UUFDcEMsUUFBUSxDQUFDLFlBQVksQ0FBQyxhQUFhLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDN0MsUUFBUSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFDdEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzVDLENBQUM7Ozs7O0lBR0QsSUFBSTs7Y0FDSSxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVM7O1lBQzNCLFVBQVUsR0FBRyxLQUFLO1FBRXRCLElBQUksRUFBRyx1REFBdUQ7WUFDNUQsSUFBSSxRQUFRLEVBQUU7O3NCQUNOLFlBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWE7Z0JBRWpELFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDbEIsUUFBUSxDQUFDLGlCQUFpQixDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNyRCxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRWhELElBQUksWUFBWSxJQUFJLFlBQVksWUFBWSxXQUFXLEVBQUU7b0JBQ3ZELFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQztpQkFDdEI7YUFDRjtTQUNGO1FBQUMsV0FBTTtZQUNOLGlCQUFpQjtZQUNqQixxRUFBcUU7U0FDdEU7UUFFRCxPQUFPLFVBQVUsQ0FBQztJQUNwQixDQUFDOzs7OztJQUdELE9BQU87O2NBQ0MsUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTO1FBRS9CLElBQUksUUFBUSxFQUFFO1lBQ1osSUFBSSxRQUFRLENBQUMsVUFBVSxFQUFFO2dCQUN2QixRQUFRLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUMzQztZQUVELElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1NBQzVCO0lBQ0gsQ0FBQztDQUNGOzs7Ozs7SUFyREMsZ0NBQWlEOzs7OztJQUV2QixnQ0FBb0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7SW5qZWN0LCBJbmplY3RhYmxlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuLyoqXG4gKiBBIHNlcnZpY2UgZm9yIGNvcHlpbmcgdGV4dCB0byB0aGUgY2xpcGJvYXJkLlxuICpcbiAqIEV4YW1wbGUgdXNhZ2U6XG4gKlxuICogY2xpcGJvYXJkLmNvcHkoXCJjb3B5IHRoaXMgdGV4dFwiKTtcbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgQ2xpcGJvYXJkIHtcbiAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50O1xuXG4gIGNvbnN0cnVjdG9yKEBJbmplY3QoRE9DVU1FTlQpIGRvY3VtZW50OiBhbnkpIHtcbiAgICB0aGlzLl9kb2N1bWVudCA9IGRvY3VtZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIENvcGllcyB0aGUgcHJvdmlkZWQgdGV4dCBpbnRvIHRoZSB1c2VyJ3MgY2xpcGJvYXJkLlxuICAgKlxuICAgKiBAcGFyYW0gdGV4dCBUaGUgc3RyaW5nIHRvIGNvcHkuXG4gICAqIEByZXR1cm5zIFdoZXRoZXIgdGhlIG9wZXJhdGlvbiB3YXMgc3VjY2Vzc2Z1bC5cbiAgICovXG4gIGNvcHkodGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgcGVuZGluZ0NvcHkgPSB0aGlzLmJlZ2luQ29weSh0ZXh0KTtcbiAgICBjb25zdCBzdWNjZXNzZnVsID0gcGVuZGluZ0NvcHkuY29weSgpO1xuICAgIHBlbmRpbmdDb3B5LmRlc3Ryb3koKTtcblxuICAgIHJldHVybiBzdWNjZXNzZnVsO1xuICB9XG5cbiAgLyoqXG4gICAqIFByZXBhcmVzIGEgc3RyaW5nIHRvIGJlIGNvcGllZCBsYXRlci4gVGhpcyBpcyB1c2VmdWwgZm9yIGxhcmdlIHN0cmluZ3NcbiAgICogd2hpY2ggdGFrZSB0b28gbG9uZyB0byBzdWNjZXNzZnVsbHkgcmVuZGVyIGFuZCBiZSBjb3BpZWQgaW4gdGhlIHNhbWUgdGljay5cbiAgICpcbiAgICogVGhlIGNhbGxlciBtdXN0IGNhbGwgYGRlc3Ryb3lgIG9uIHRoZSByZXR1cm5lZCBgUGVuZGluZ0NvcHlgLlxuICAgKlxuICAgKiBAcGFyYW0gdGV4dCBUaGUgc3RyaW5nIHRvIGNvcHkuXG4gICAqIEByZXR1cm5zIHRoZSBwZW5kaW5nIGNvcHkgb3BlcmF0aW9uLlxuICAgKi9cbiAgYmVnaW5Db3B5KHRleHQ6IHN0cmluZyk6IFBlbmRpbmdDb3B5IHtcbiAgICByZXR1cm4gbmV3IFBlbmRpbmdDb3B5KHRleHQsIHRoaXMuX2RvY3VtZW50KTtcbiAgfVxufVxuXG4vKipcbiAqIEEgcGVuZGluZyBjb3B5LXRvLWNsaXBib2FyZCBvcGVyYXRpb24uXG4gKlxuICogVGhlIGltcGxlbWVudGF0aW9uIG9mIGNvcHlpbmcgdGV4dCB0byB0aGUgY2xpcGJvYXJkIG1vZGlmaWVzIHRoZSBET00gYW5kXG4gKiBmb3JjZXMgYSByZWxheW91dC4gVGhpcyByZWxheW91dCBjYW4gdGFrZSB0b28gbG9uZyBpZiB0aGUgc3RyaW5nIGlzIGxhcmdlLFxuICogY2F1c2luZyB0aGUgZXhlY0NvbW1hbmQoJ2NvcHknKSB0byBoYXBwZW4gdG9vIGxvbmcgYWZ0ZXIgdGhlIHVzZXIgY2xpY2tlZC5cbiAqIFRoaXMgcmVzdWx0cyBpbiB0aGUgYnJvd3NlciByZWZ1c2luZyB0byBjb3B5LiBUaGlzIG9iamVjdCBsZXRzIHRoZVxuICogcmVsYXlvdXQgaGFwcGVuIGluIGEgc2VwYXJhdGUgdGljayBmcm9tIGNvcHlpbmcgYnkgcHJvdmlkaW5nIGEgY29weSBmdW5jdGlvblxuICogdGhhdCBjYW4gYmUgY2FsbGVkIGxhdGVyLlxuICpcbiAqIERlc3Ryb3kgbXVzdCBiZSBjYWxsZWQgd2hlbiBubyBsb25nZXIgaW4gdXNlLCByZWdhcmRsZXNzIG9mIHdoZXRoZXIgYGNvcHlgIGlzXG4gKiBjYWxsZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBQZW5kaW5nQ29weSB7XG4gIHByaXZhdGUgX3RleHRhcmVhOiBIVE1MVGV4dEFyZWFFbGVtZW50fHVuZGVmaW5lZDtcblxuICBjb25zdHJ1Y3Rvcih0ZXh0OiBzdHJpbmcsIHByaXZhdGUgcmVhZG9ubHkgX2RvY3VtZW50OiBEb2N1bWVudCkge1xuICAgIGNvbnN0IHRleHRhcmVhID0gdGhpcy5fdGV4dGFyZWEgPSB0aGlzLl9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScpO1xuICAgIGNvbnN0IHN0eWxlcyA9IHRleHRhcmVhLnN0eWxlO1xuXG4gICAgLy8gSGlkZSB0aGUgZWxlbWVudCBmb3IgZGlzcGxheSBhbmQgYWNjZXNzaWJpbGl0eS4gU2V0IGFuXG4gICAgLy8gYWJzb2x1dGUgcG9zaXRpb24gc28gdGhlIHBhZ2UgbGF5b3V0IGlzbid0IGFmZmVjdGVkLlxuICAgIHN0eWxlcy5vcGFjaXR5ID0gJzAnO1xuICAgIHN0eWxlcy5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgc3R5bGVzLmxlZnQgPSBzdHlsZXMudG9wID0gJy05OTllbSc7XG4gICAgdGV4dGFyZWEuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgdGV4dGFyZWEudmFsdWUgPSB0ZXh0O1xuICAgIHRoaXMuX2RvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGV4dGFyZWEpO1xuICB9XG5cbiAgLyoqIEZpbmlzaGVzIGNvcHlpbmcgdGhlIHRleHQuICovXG4gIGNvcHkoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgdGV4dGFyZWEgPSB0aGlzLl90ZXh0YXJlYTtcbiAgICBsZXQgc3VjY2Vzc2Z1bCA9IGZhbHNlO1xuXG4gICAgdHJ5IHsgIC8vIE9sZGVyIGJyb3dzZXJzIGNvdWxkIHRocm93IGlmIGNvcHkgaXMgbm90IHN1cHBvcnRlZC5cbiAgICAgIGlmICh0ZXh0YXJlYSkge1xuICAgICAgICBjb25zdCBjdXJyZW50Rm9jdXMgPSB0aGlzLl9kb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuXG4gICAgICAgIHRleHRhcmVhLnNlbGVjdCgpO1xuICAgICAgICB0ZXh0YXJlYS5zZXRTZWxlY3Rpb25SYW5nZSgwLCB0ZXh0YXJlYS52YWx1ZS5sZW5ndGgpO1xuICAgICAgICBzdWNjZXNzZnVsID0gdGhpcy5fZG9jdW1lbnQuZXhlY0NvbW1hbmQoJ2NvcHknKTtcblxuICAgICAgICBpZiAoY3VycmVudEZvY3VzICYmIGN1cnJlbnRGb2N1cyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG4gICAgICAgICAgY3VycmVudEZvY3VzLmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIERpc2NhcmQgZXJyb3IuXG4gICAgICAvLyBJbml0aWFsIHNldHRpbmcgb2Yge0Bjb2RlIHN1Y2Nlc3NmdWx9IHdpbGwgcmVwcmVzZW50IGZhaWx1cmUgaGVyZS5cbiAgICB9XG5cbiAgICByZXR1cm4gc3VjY2Vzc2Z1bDtcbiAgfVxuXG4gIC8qKiBDbGVhbnMgdXAgRE9NIGNoYW5nZXMgdXNlZCB0byBwZXJmb3JtIHRoZSBjb3B5IG9wZXJhdGlvbi4gKi9cbiAgZGVzdHJveSgpIHtcbiAgICBjb25zdCB0ZXh0YXJlYSA9IHRoaXMuX3RleHRhcmVhO1xuXG4gICAgaWYgKHRleHRhcmVhKSB7XG4gICAgICBpZiAodGV4dGFyZWEucGFyZW50Tm9kZSkge1xuICAgICAgICB0ZXh0YXJlYS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRleHRhcmVhKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fdGV4dGFyZWEgPSB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG59XG4iXX0=