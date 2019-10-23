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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVuZGluZy1jb3B5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9jbGlwYm9hcmQvcGVuZGluZy1jb3B5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXFCQSxNQUFNLE9BQU8sV0FBVzs7Ozs7SUFHdEIsWUFBWSxJQUFZLEVBQW1CLFNBQW1CO1FBQW5CLGNBQVMsR0FBVCxTQUFTLENBQVU7O2NBQ3RELFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQzs7Y0FDcEUsTUFBTSxHQUFHLFFBQVEsQ0FBQyxLQUFLO1FBRTdCLHlEQUF5RDtRQUN6RCx1REFBdUQ7UUFDdkQsTUFBTSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUM7UUFDckIsTUFBTSxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUM7UUFDN0IsTUFBTSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsR0FBRyxHQUFHLFFBQVEsQ0FBQztRQUNwQyxRQUFRLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUM3QyxRQUFRLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUN0QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDNUMsQ0FBQzs7Ozs7SUFHRCxJQUFJOztjQUNJLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUzs7WUFDM0IsVUFBVSxHQUFHLEtBQUs7UUFFdEIsSUFBSSxFQUFHLHVEQUF1RDtZQUM1RCxJQUFJLFFBQVEsRUFBRTs7c0JBQ04sWUFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYTtnQkFFakQsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNsQixRQUFRLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3JELFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFFaEQsSUFBSSxZQUFZLElBQUksWUFBWSxZQUFZLFdBQVcsRUFBRTtvQkFDdkQsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO2lCQUN0QjthQUNGO1NBQ0Y7UUFBQyxXQUFNO1lBQ04saUJBQWlCO1lBQ2pCLHFFQUFxRTtTQUN0RTtRQUVELE9BQU8sVUFBVSxDQUFDO0lBQ3BCLENBQUM7Ozs7O0lBR0QsT0FBTzs7Y0FDQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVM7UUFFL0IsSUFBSSxRQUFRLEVBQUU7WUFDWixJQUFJLFFBQVEsQ0FBQyxVQUFVLEVBQUU7Z0JBQ3ZCLFFBQVEsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQzNDO1lBRUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7U0FDNUI7SUFDSCxDQUFDO0NBQ0Y7Ozs7OztJQXJEQyxnQ0FBaUQ7Ozs7O0lBRXZCLGdDQUFvQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIEEgcGVuZGluZyBjb3B5LXRvLWNsaXBib2FyZCBvcGVyYXRpb24uXG4gKlxuICogVGhlIGltcGxlbWVudGF0aW9uIG9mIGNvcHlpbmcgdGV4dCB0byB0aGUgY2xpcGJvYXJkIG1vZGlmaWVzIHRoZSBET00gYW5kXG4gKiBmb3JjZXMgYSByZWxheW91dC4gVGhpcyByZWxheW91dCBjYW4gdGFrZSB0b28gbG9uZyBpZiB0aGUgc3RyaW5nIGlzIGxhcmdlLFxuICogY2F1c2luZyB0aGUgZXhlY0NvbW1hbmQoJ2NvcHknKSB0byBoYXBwZW4gdG9vIGxvbmcgYWZ0ZXIgdGhlIHVzZXIgY2xpY2tlZC5cbiAqIFRoaXMgcmVzdWx0cyBpbiB0aGUgYnJvd3NlciByZWZ1c2luZyB0byBjb3B5LiBUaGlzIG9iamVjdCBsZXRzIHRoZVxuICogcmVsYXlvdXQgaGFwcGVuIGluIGEgc2VwYXJhdGUgdGljayBmcm9tIGNvcHlpbmcgYnkgcHJvdmlkaW5nIGEgY29weSBmdW5jdGlvblxuICogdGhhdCBjYW4gYmUgY2FsbGVkIGxhdGVyLlxuICpcbiAqIERlc3Ryb3kgbXVzdCBiZSBjYWxsZWQgd2hlbiBubyBsb25nZXIgaW4gdXNlLCByZWdhcmRsZXNzIG9mIHdoZXRoZXIgYGNvcHlgIGlzXG4gKiBjYWxsZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBQZW5kaW5nQ29weSB7XG4gIHByaXZhdGUgX3RleHRhcmVhOiBIVE1MVGV4dEFyZWFFbGVtZW50fHVuZGVmaW5lZDtcblxuICBjb25zdHJ1Y3Rvcih0ZXh0OiBzdHJpbmcsIHByaXZhdGUgcmVhZG9ubHkgX2RvY3VtZW50OiBEb2N1bWVudCkge1xuICAgIGNvbnN0IHRleHRhcmVhID0gdGhpcy5fdGV4dGFyZWEgPSB0aGlzLl9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScpO1xuICAgIGNvbnN0IHN0eWxlcyA9IHRleHRhcmVhLnN0eWxlO1xuXG4gICAgLy8gSGlkZSB0aGUgZWxlbWVudCBmb3IgZGlzcGxheSBhbmQgYWNjZXNzaWJpbGl0eS4gU2V0IGFuXG4gICAgLy8gYWJzb2x1dGUgcG9zaXRpb24gc28gdGhlIHBhZ2UgbGF5b3V0IGlzbid0IGFmZmVjdGVkLlxuICAgIHN0eWxlcy5vcGFjaXR5ID0gJzAnO1xuICAgIHN0eWxlcy5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgc3R5bGVzLmxlZnQgPSBzdHlsZXMudG9wID0gJy05OTllbSc7XG4gICAgdGV4dGFyZWEuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgdGV4dGFyZWEudmFsdWUgPSB0ZXh0O1xuICAgIHRoaXMuX2RvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGV4dGFyZWEpO1xuICB9XG5cbiAgLyoqIEZpbmlzaGVzIGNvcHlpbmcgdGhlIHRleHQuICovXG4gIGNvcHkoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgdGV4dGFyZWEgPSB0aGlzLl90ZXh0YXJlYTtcbiAgICBsZXQgc3VjY2Vzc2Z1bCA9IGZhbHNlO1xuXG4gICAgdHJ5IHsgIC8vIE9sZGVyIGJyb3dzZXJzIGNvdWxkIHRocm93IGlmIGNvcHkgaXMgbm90IHN1cHBvcnRlZC5cbiAgICAgIGlmICh0ZXh0YXJlYSkge1xuICAgICAgICBjb25zdCBjdXJyZW50Rm9jdXMgPSB0aGlzLl9kb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuXG4gICAgICAgIHRleHRhcmVhLnNlbGVjdCgpO1xuICAgICAgICB0ZXh0YXJlYS5zZXRTZWxlY3Rpb25SYW5nZSgwLCB0ZXh0YXJlYS52YWx1ZS5sZW5ndGgpO1xuICAgICAgICBzdWNjZXNzZnVsID0gdGhpcy5fZG9jdW1lbnQuZXhlY0NvbW1hbmQoJ2NvcHknKTtcblxuICAgICAgICBpZiAoY3VycmVudEZvY3VzICYmIGN1cnJlbnRGb2N1cyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG4gICAgICAgICAgY3VycmVudEZvY3VzLmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIERpc2NhcmQgZXJyb3IuXG4gICAgICAvLyBJbml0aWFsIHNldHRpbmcgb2Yge0Bjb2RlIHN1Y2Nlc3NmdWx9IHdpbGwgcmVwcmVzZW50IGZhaWx1cmUgaGVyZS5cbiAgICB9XG5cbiAgICByZXR1cm4gc3VjY2Vzc2Z1bDtcbiAgfVxuXG4gIC8qKiBDbGVhbnMgdXAgRE9NIGNoYW5nZXMgdXNlZCB0byBwZXJmb3JtIHRoZSBjb3B5IG9wZXJhdGlvbi4gKi9cbiAgZGVzdHJveSgpIHtcbiAgICBjb25zdCB0ZXh0YXJlYSA9IHRoaXMuX3RleHRhcmVhO1xuXG4gICAgaWYgKHRleHRhcmVhKSB7XG4gICAgICBpZiAodGV4dGFyZWEucGFyZW50Tm9kZSkge1xuICAgICAgICB0ZXh0YXJlYS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRleHRhcmVhKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fdGV4dGFyZWEgPSB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG59XG4iXX0=