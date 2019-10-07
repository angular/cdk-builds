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
var Clipboard = /** @class */ (function () {
    function Clipboard(document) {
        this._document = document;
    }
    /**
     * Copies the provided text into the user's clipboard.
     *
     * @param text The string to copy.
     * @returns Whether the operation was successful.
     */
    Clipboard.prototype.copy = function (text) {
        var pendingCopy = this.beginCopy(text);
        var successful = pendingCopy.copy();
        pendingCopy.destroy();
        return successful;
    };
    /**
     * Prepares a string to be copied later. This is useful for large strings
     * which take too long to successfully render and be copied in the same tick.
     *
     * The caller must call `destroy` on the returned `PendingCopy`.
     *
     * @param text The string to copy.
     * @returns the pending copy operation.
     */
    Clipboard.prototype.beginCopy = function (text) {
        return new PendingCopy(text, this._document);
    };
    Clipboard.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    /** @nocollapse */
    Clipboard.ctorParameters = function () { return [
        { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] }
    ]; };
    Clipboard.ngInjectableDef = i0.ɵɵdefineInjectable({ factory: function Clipboard_Factory() { return new Clipboard(i0.ɵɵinject(i1.DOCUMENT)); }, token: Clipboard, providedIn: "root" });
    return Clipboard;
}());
export { Clipboard };
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
var PendingCopy = /** @class */ (function () {
    function PendingCopy(text, _document) {
        this._document = _document;
        var textarea = this._textarea = this._document.createElement('textarea');
        var styles = textarea.style;
        // Hide the element for display and accessibility. Set an
        // absolute position so the page layout isn't affected.
        styles.opacity = '0';
        styles.position = 'absolute';
        styles.left = styles.top = '-999em';
        textarea.setAttribute('aria-hidden', 'true');
        textarea.value = text;
        this._document.body.appendChild(textarea);
    }
    /** Finishes copying the text. */
    PendingCopy.prototype.copy = function () {
        var textarea = this._textarea;
        var successful = false;
        try { // Older browsers could throw if copy is not supported.
            if (textarea) {
                var currentFocus = this._document.activeElement;
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
    };
    /** Cleans up DOM changes used to perform the copy operation. */
    PendingCopy.prototype.destroy = function () {
        var textarea = this._textarea;
        if (textarea) {
            if (textarea.parentNode) {
                textarea.parentNode.removeChild(textarea);
            }
            this._textarea = undefined;
        }
    };
    return PendingCopy;
}());
export { PendingCopy };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpcGJvYXJkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9jbGlwYm9hcmQvY2xpcGJvYXJkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQUMsTUFBTSxFQUFFLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQzs7O0FBRWpEOzs7Ozs7R0FNRztBQUNIO0lBSUUsbUJBQThCLFFBQWE7UUFDekMsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7SUFDNUIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsd0JBQUksR0FBSixVQUFLLElBQVk7UUFDZixJQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3pDLElBQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN0QyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFdEIsT0FBTyxVQUFVLENBQUM7SUFDcEIsQ0FBQztJQUVEOzs7Ozs7OztPQVFHO0lBQ0gsNkJBQVMsR0FBVCxVQUFVLElBQVk7UUFDcEIsT0FBTyxJQUFJLFdBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQy9DLENBQUM7O2dCQWpDRixVQUFVLFNBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzs7O2dEQUlqQixNQUFNLFNBQUMsUUFBUTs7O29CQXRCOUI7Q0FvREMsQUFsQ0QsSUFrQ0M7U0FqQ1ksU0FBUztBQW1DdEI7Ozs7Ozs7Ozs7OztHQVlHO0FBQ0g7SUFHRSxxQkFBWSxJQUFZLEVBQW1CLFNBQW1CO1FBQW5CLGNBQVMsR0FBVCxTQUFTLENBQVU7UUFDNUQsSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMzRSxJQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO1FBRTlCLHlEQUF5RDtRQUN6RCx1REFBdUQ7UUFDdkQsTUFBTSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUM7UUFDckIsTUFBTSxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUM7UUFDN0IsTUFBTSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsR0FBRyxHQUFHLFFBQVEsQ0FBQztRQUNwQyxRQUFRLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUM3QyxRQUFRLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUN0QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUVELGlDQUFpQztJQUNqQywwQkFBSSxHQUFKO1FBQ0UsSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUNoQyxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7UUFFdkIsSUFBSSxFQUFHLHVEQUF1RDtZQUM1RCxJQUFJLFFBQVEsRUFBRTtnQkFDWixJQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQztnQkFFbEQsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNsQixRQUFRLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3JELFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFFaEQsSUFBSSxZQUFZLElBQUksWUFBWSxZQUFZLFdBQVcsRUFBRTtvQkFDdkQsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO2lCQUN0QjthQUNGO1NBQ0Y7UUFBQyxXQUFNO1lBQ04saUJBQWlCO1lBQ2pCLHFFQUFxRTtTQUN0RTtRQUVELE9BQU8sVUFBVSxDQUFDO0lBQ3BCLENBQUM7SUFFRCxnRUFBZ0U7SUFDaEUsNkJBQU8sR0FBUDtRQUNFLElBQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7UUFFaEMsSUFBSSxRQUFRLEVBQUU7WUFDWixJQUFJLFFBQVEsQ0FBQyxVQUFVLEVBQUU7Z0JBQ3ZCLFFBQVEsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQzNDO1lBRUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7U0FDNUI7SUFDSCxDQUFDO0lBQ0gsa0JBQUM7QUFBRCxDQUFDLEFBdERELElBc0RDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge0luamVjdCwgSW5qZWN0YWJsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbi8qKlxuICogQSBzZXJ2aWNlIGZvciBjb3B5aW5nIHRleHQgdG8gdGhlIGNsaXBib2FyZC5cbiAqXG4gKiBFeGFtcGxlIHVzYWdlOlxuICpcbiAqIGNsaXBib2FyZC5jb3B5KFwiY29weSB0aGlzIHRleHRcIik7XG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIENsaXBib2FyZCB7XG4gIHByaXZhdGUgX2RvY3VtZW50OiBEb2N1bWVudDtcblxuICBjb25zdHJ1Y3RvcihASW5qZWN0KERPQ1VNRU5UKSBkb2N1bWVudDogYW55KSB7XG4gICAgdGhpcy5fZG9jdW1lbnQgPSBkb2N1bWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb3BpZXMgdGhlIHByb3ZpZGVkIHRleHQgaW50byB0aGUgdXNlcidzIGNsaXBib2FyZC5cbiAgICpcbiAgICogQHBhcmFtIHRleHQgVGhlIHN0cmluZyB0byBjb3B5LlxuICAgKiBAcmV0dXJucyBXaGV0aGVyIHRoZSBvcGVyYXRpb24gd2FzIHN1Y2Nlc3NmdWwuXG4gICAqL1xuICBjb3B5KHRleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHBlbmRpbmdDb3B5ID0gdGhpcy5iZWdpbkNvcHkodGV4dCk7XG4gICAgY29uc3Qgc3VjY2Vzc2Z1bCA9IHBlbmRpbmdDb3B5LmNvcHkoKTtcbiAgICBwZW5kaW5nQ29weS5kZXN0cm95KCk7XG5cbiAgICByZXR1cm4gc3VjY2Vzc2Z1bDtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVwYXJlcyBhIHN0cmluZyB0byBiZSBjb3BpZWQgbGF0ZXIuIFRoaXMgaXMgdXNlZnVsIGZvciBsYXJnZSBzdHJpbmdzXG4gICAqIHdoaWNoIHRha2UgdG9vIGxvbmcgdG8gc3VjY2Vzc2Z1bGx5IHJlbmRlciBhbmQgYmUgY29waWVkIGluIHRoZSBzYW1lIHRpY2suXG4gICAqXG4gICAqIFRoZSBjYWxsZXIgbXVzdCBjYWxsIGBkZXN0cm95YCBvbiB0aGUgcmV0dXJuZWQgYFBlbmRpbmdDb3B5YC5cbiAgICpcbiAgICogQHBhcmFtIHRleHQgVGhlIHN0cmluZyB0byBjb3B5LlxuICAgKiBAcmV0dXJucyB0aGUgcGVuZGluZyBjb3B5IG9wZXJhdGlvbi5cbiAgICovXG4gIGJlZ2luQ29weSh0ZXh0OiBzdHJpbmcpOiBQZW5kaW5nQ29weSB7XG4gICAgcmV0dXJuIG5ldyBQZW5kaW5nQ29weSh0ZXh0LCB0aGlzLl9kb2N1bWVudCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBIHBlbmRpbmcgY29weS10by1jbGlwYm9hcmQgb3BlcmF0aW9uLlxuICpcbiAqIFRoZSBpbXBsZW1lbnRhdGlvbiBvZiBjb3B5aW5nIHRleHQgdG8gdGhlIGNsaXBib2FyZCBtb2RpZmllcyB0aGUgRE9NIGFuZFxuICogZm9yY2VzIGEgcmVsYXlvdXQuIFRoaXMgcmVsYXlvdXQgY2FuIHRha2UgdG9vIGxvbmcgaWYgdGhlIHN0cmluZyBpcyBsYXJnZSxcbiAqIGNhdXNpbmcgdGhlIGV4ZWNDb21tYW5kKCdjb3B5JykgdG8gaGFwcGVuIHRvbyBsb25nIGFmdGVyIHRoZSB1c2VyIGNsaWNrZWQuXG4gKiBUaGlzIHJlc3VsdHMgaW4gdGhlIGJyb3dzZXIgcmVmdXNpbmcgdG8gY29weS4gVGhpcyBvYmplY3QgbGV0cyB0aGVcbiAqIHJlbGF5b3V0IGhhcHBlbiBpbiBhIHNlcGFyYXRlIHRpY2sgZnJvbSBjb3B5aW5nIGJ5IHByb3ZpZGluZyBhIGNvcHkgZnVuY3Rpb25cbiAqIHRoYXQgY2FuIGJlIGNhbGxlZCBsYXRlci5cbiAqXG4gKiBEZXN0cm95IG11c3QgYmUgY2FsbGVkIHdoZW4gbm8gbG9uZ2VyIGluIHVzZSwgcmVnYXJkbGVzcyBvZiB3aGV0aGVyIGBjb3B5YCBpc1xuICogY2FsbGVkLlxuICovXG5leHBvcnQgY2xhc3MgUGVuZGluZ0NvcHkge1xuICBwcml2YXRlIF90ZXh0YXJlYTogSFRNTFRleHRBcmVhRWxlbWVudHx1bmRlZmluZWQ7XG5cbiAgY29uc3RydWN0b3IodGV4dDogc3RyaW5nLCBwcml2YXRlIHJlYWRvbmx5IF9kb2N1bWVudDogRG9jdW1lbnQpIHtcbiAgICBjb25zdCB0ZXh0YXJlYSA9IHRoaXMuX3RleHRhcmVhID0gdGhpcy5fZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnKTtcbiAgICBjb25zdCBzdHlsZXMgPSB0ZXh0YXJlYS5zdHlsZTtcblxuICAgIC8vIEhpZGUgdGhlIGVsZW1lbnQgZm9yIGRpc3BsYXkgYW5kIGFjY2Vzc2liaWxpdHkuIFNldCBhblxuICAgIC8vIGFic29sdXRlIHBvc2l0aW9uIHNvIHRoZSBwYWdlIGxheW91dCBpc24ndCBhZmZlY3RlZC5cbiAgICBzdHlsZXMub3BhY2l0eSA9ICcwJztcbiAgICBzdHlsZXMucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIHN0eWxlcy5sZWZ0ID0gc3R5bGVzLnRvcCA9ICctOTk5ZW0nO1xuICAgIHRleHRhcmVhLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgIHRleHRhcmVhLnZhbHVlID0gdGV4dDtcbiAgICB0aGlzLl9kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRleHRhcmVhKTtcbiAgfVxuXG4gIC8qKiBGaW5pc2hlcyBjb3B5aW5nIHRoZSB0ZXh0LiAqL1xuICBjb3B5KCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHRleHRhcmVhID0gdGhpcy5fdGV4dGFyZWE7XG4gICAgbGV0IHN1Y2Nlc3NmdWwgPSBmYWxzZTtcblxuICAgIHRyeSB7ICAvLyBPbGRlciBicm93c2VycyBjb3VsZCB0aHJvdyBpZiBjb3B5IGlzIG5vdCBzdXBwb3J0ZWQuXG4gICAgICBpZiAodGV4dGFyZWEpIHtcbiAgICAgICAgY29uc3QgY3VycmVudEZvY3VzID0gdGhpcy5fZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcblxuICAgICAgICB0ZXh0YXJlYS5zZWxlY3QoKTtcbiAgICAgICAgdGV4dGFyZWEuc2V0U2VsZWN0aW9uUmFuZ2UoMCwgdGV4dGFyZWEudmFsdWUubGVuZ3RoKTtcbiAgICAgICAgc3VjY2Vzc2Z1bCA9IHRoaXMuX2RvY3VtZW50LmV4ZWNDb21tYW5kKCdjb3B5Jyk7XG5cbiAgICAgICAgaWYgKGN1cnJlbnRGb2N1cyAmJiBjdXJyZW50Rm9jdXMgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkge1xuICAgICAgICAgIGN1cnJlbnRGb2N1cy5mb2N1cygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBEaXNjYXJkIGVycm9yLlxuICAgICAgLy8gSW5pdGlhbCBzZXR0aW5nIG9mIHtAY29kZSBzdWNjZXNzZnVsfSB3aWxsIHJlcHJlc2VudCBmYWlsdXJlIGhlcmUuXG4gICAgfVxuXG4gICAgcmV0dXJuIHN1Y2Nlc3NmdWw7XG4gIH1cblxuICAvKiogQ2xlYW5zIHVwIERPTSBjaGFuZ2VzIHVzZWQgdG8gcGVyZm9ybSB0aGUgY29weSBvcGVyYXRpb24uICovXG4gIGRlc3Ryb3koKSB7XG4gICAgY29uc3QgdGV4dGFyZWEgPSB0aGlzLl90ZXh0YXJlYTtcblxuICAgIGlmICh0ZXh0YXJlYSkge1xuICAgICAgaWYgKHRleHRhcmVhLnBhcmVudE5vZGUpIHtcbiAgICAgICAgdGV4dGFyZWEucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0ZXh0YXJlYSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3RleHRhcmVhID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgfVxufVxuIl19