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
 * forces a re-layout. This re-layout can take too long if the string is large,
 * causing the execCommand('copy') to happen too long after the user clicked.
 * This results in the browser refusing to copy. This object lets the
 * re-layout happen in a separate tick from copying by providing a copy function
 * that can be called later.
 *
 * Destroy must be called when no longer in use, regardless of whether `copy` is
 * called.
 */
export class PendingCopy {
    constructor(text, _document) {
        this._document = _document;
        const textarea = (this._textarea = this._document.createElement('textarea'));
        const styles = textarea.style;
        // Hide the element for display and accessibility. Set a fixed position so the page layout
        // isn't affected. We use `fixed` with `top: 0`, because focus is moved into the textarea
        // for a split second and if it's off-screen, some browsers will attempt to scroll it into view.
        styles.position = 'fixed';
        styles.top = styles.opacity = '0';
        styles.left = '-999em';
        textarea.setAttribute('aria-hidden', 'true');
        textarea.value = text;
        // Making the textarea `readonly` prevents the screen from jumping on iOS Safari (see #25169).
        textarea.readOnly = true;
        // The element needs to be inserted into the fullscreen container, if the page
        // is in fullscreen mode, otherwise the browser won't execute the copy command.
        (this._document.fullscreenElement || this._document.body).appendChild(textarea);
    }
    /** Finishes copying the text. */
    copy() {
        const textarea = this._textarea;
        let successful = false;
        try {
            // Older browsers could throw if copy is not supported.
            if (textarea) {
                const currentFocus = this._document.activeElement;
                textarea.select();
                textarea.setSelectionRange(0, textarea.value.length);
                successful = this._document.execCommand('copy');
                if (currentFocus) {
                    currentFocus.focus();
                }
            }
        }
        catch {
            // Discard error.
            // Initial setting of {@code successful} will represent failure here.
        }
        return successful;
    }
    /** Cleans up DOM changes used to perform the copy operation. */
    destroy() {
        const textarea = this._textarea;
        if (textarea) {
            textarea.remove();
            this._textarea = undefined;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVuZGluZy1jb3B5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9jbGlwYm9hcmQvcGVuZGluZy1jb3B5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVIOzs7Ozs7Ozs7Ozs7R0FZRztBQUNILE1BQU0sT0FBTyxXQUFXO0lBR3RCLFlBQVksSUFBWSxFQUFtQixTQUFtQjtRQUFuQixjQUFTLEdBQVQsU0FBUyxDQUFVO1FBQzVELE1BQU0sUUFBUSxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQzdFLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7UUFFOUIsMEZBQTBGO1FBQzFGLHlGQUF5RjtRQUN6RixnR0FBZ0c7UUFDaEcsTUFBTSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7UUFDMUIsTUFBTSxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQztRQUNsQyxNQUFNLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQztRQUN2QixRQUFRLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUM3QyxRQUFRLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUN0Qiw4RkFBOEY7UUFDOUYsUUFBUSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7UUFDekIsOEVBQThFO1FBQzlFLCtFQUErRTtRQUMvRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsaUJBQWlCLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbEYsQ0FBQztJQUVELGlDQUFpQztJQUNqQyxJQUFJO1FBQ0YsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUNoQyxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7UUFFdkIsSUFBSTtZQUNGLHVEQUF1RDtZQUN2RCxJQUFJLFFBQVEsRUFBRTtnQkFDWixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQXdDLENBQUM7Z0JBRTdFLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDbEIsUUFBUSxDQUFDLGlCQUFpQixDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNyRCxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRWhELElBQUksWUFBWSxFQUFFO29CQUNoQixZQUFZLENBQUMsS0FBSyxFQUFFLENBQUM7aUJBQ3RCO2FBQ0Y7U0FDRjtRQUFDLE1BQU07WUFDTixpQkFBaUI7WUFDakIscUVBQXFFO1NBQ3RFO1FBRUQsT0FBTyxVQUFVLENBQUM7SUFDcEIsQ0FBQztJQUVELGdFQUFnRTtJQUNoRSxPQUFPO1FBQ0wsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUVoQyxJQUFJLFFBQVEsRUFBRTtZQUNaLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNsQixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztTQUM1QjtJQUNILENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIEEgcGVuZGluZyBjb3B5LXRvLWNsaXBib2FyZCBvcGVyYXRpb24uXG4gKlxuICogVGhlIGltcGxlbWVudGF0aW9uIG9mIGNvcHlpbmcgdGV4dCB0byB0aGUgY2xpcGJvYXJkIG1vZGlmaWVzIHRoZSBET00gYW5kXG4gKiBmb3JjZXMgYSByZS1sYXlvdXQuIFRoaXMgcmUtbGF5b3V0IGNhbiB0YWtlIHRvbyBsb25nIGlmIHRoZSBzdHJpbmcgaXMgbGFyZ2UsXG4gKiBjYXVzaW5nIHRoZSBleGVjQ29tbWFuZCgnY29weScpIHRvIGhhcHBlbiB0b28gbG9uZyBhZnRlciB0aGUgdXNlciBjbGlja2VkLlxuICogVGhpcyByZXN1bHRzIGluIHRoZSBicm93c2VyIHJlZnVzaW5nIHRvIGNvcHkuIFRoaXMgb2JqZWN0IGxldHMgdGhlXG4gKiByZS1sYXlvdXQgaGFwcGVuIGluIGEgc2VwYXJhdGUgdGljayBmcm9tIGNvcHlpbmcgYnkgcHJvdmlkaW5nIGEgY29weSBmdW5jdGlvblxuICogdGhhdCBjYW4gYmUgY2FsbGVkIGxhdGVyLlxuICpcbiAqIERlc3Ryb3kgbXVzdCBiZSBjYWxsZWQgd2hlbiBubyBsb25nZXIgaW4gdXNlLCByZWdhcmRsZXNzIG9mIHdoZXRoZXIgYGNvcHlgIGlzXG4gKiBjYWxsZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBQZW5kaW5nQ29weSB7XG4gIHByaXZhdGUgX3RleHRhcmVhOiBIVE1MVGV4dEFyZWFFbGVtZW50IHwgdW5kZWZpbmVkO1xuXG4gIGNvbnN0cnVjdG9yKHRleHQ6IHN0cmluZywgcHJpdmF0ZSByZWFkb25seSBfZG9jdW1lbnQ6IERvY3VtZW50KSB7XG4gICAgY29uc3QgdGV4dGFyZWEgPSAodGhpcy5fdGV4dGFyZWEgPSB0aGlzLl9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScpKTtcbiAgICBjb25zdCBzdHlsZXMgPSB0ZXh0YXJlYS5zdHlsZTtcblxuICAgIC8vIEhpZGUgdGhlIGVsZW1lbnQgZm9yIGRpc3BsYXkgYW5kIGFjY2Vzc2liaWxpdHkuIFNldCBhIGZpeGVkIHBvc2l0aW9uIHNvIHRoZSBwYWdlIGxheW91dFxuICAgIC8vIGlzbid0IGFmZmVjdGVkLiBXZSB1c2UgYGZpeGVkYCB3aXRoIGB0b3A6IDBgLCBiZWNhdXNlIGZvY3VzIGlzIG1vdmVkIGludG8gdGhlIHRleHRhcmVhXG4gICAgLy8gZm9yIGEgc3BsaXQgc2Vjb25kIGFuZCBpZiBpdCdzIG9mZi1zY3JlZW4sIHNvbWUgYnJvd3NlcnMgd2lsbCBhdHRlbXB0IHRvIHNjcm9sbCBpdCBpbnRvIHZpZXcuXG4gICAgc3R5bGVzLnBvc2l0aW9uID0gJ2ZpeGVkJztcbiAgICBzdHlsZXMudG9wID0gc3R5bGVzLm9wYWNpdHkgPSAnMCc7XG4gICAgc3R5bGVzLmxlZnQgPSAnLTk5OWVtJztcbiAgICB0ZXh0YXJlYS5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICB0ZXh0YXJlYS52YWx1ZSA9IHRleHQ7XG4gICAgLy8gTWFraW5nIHRoZSB0ZXh0YXJlYSBgcmVhZG9ubHlgIHByZXZlbnRzIHRoZSBzY3JlZW4gZnJvbSBqdW1waW5nIG9uIGlPUyBTYWZhcmkgKHNlZSAjMjUxNjkpLlxuICAgIHRleHRhcmVhLnJlYWRPbmx5ID0gdHJ1ZTtcbiAgICAvLyBUaGUgZWxlbWVudCBuZWVkcyB0byBiZSBpbnNlcnRlZCBpbnRvIHRoZSBmdWxsc2NyZWVuIGNvbnRhaW5lciwgaWYgdGhlIHBhZ2VcbiAgICAvLyBpcyBpbiBmdWxsc2NyZWVuIG1vZGUsIG90aGVyd2lzZSB0aGUgYnJvd3NlciB3b24ndCBleGVjdXRlIHRoZSBjb3B5IGNvbW1hbmQuXG4gICAgKHRoaXMuX2RvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50IHx8IHRoaXMuX2RvY3VtZW50LmJvZHkpLmFwcGVuZENoaWxkKHRleHRhcmVhKTtcbiAgfVxuXG4gIC8qKiBGaW5pc2hlcyBjb3B5aW5nIHRoZSB0ZXh0LiAqL1xuICBjb3B5KCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHRleHRhcmVhID0gdGhpcy5fdGV4dGFyZWE7XG4gICAgbGV0IHN1Y2Nlc3NmdWwgPSBmYWxzZTtcblxuICAgIHRyeSB7XG4gICAgICAvLyBPbGRlciBicm93c2VycyBjb3VsZCB0aHJvdyBpZiBjb3B5IGlzIG5vdCBzdXBwb3J0ZWQuXG4gICAgICBpZiAodGV4dGFyZWEpIHtcbiAgICAgICAgY29uc3QgY3VycmVudEZvY3VzID0gdGhpcy5fZG9jdW1lbnQuYWN0aXZlRWxlbWVudCBhcyBIVE1MT3JTVkdFbGVtZW50IHwgbnVsbDtcblxuICAgICAgICB0ZXh0YXJlYS5zZWxlY3QoKTtcbiAgICAgICAgdGV4dGFyZWEuc2V0U2VsZWN0aW9uUmFuZ2UoMCwgdGV4dGFyZWEudmFsdWUubGVuZ3RoKTtcbiAgICAgICAgc3VjY2Vzc2Z1bCA9IHRoaXMuX2RvY3VtZW50LmV4ZWNDb21tYW5kKCdjb3B5Jyk7XG5cbiAgICAgICAgaWYgKGN1cnJlbnRGb2N1cykge1xuICAgICAgICAgIGN1cnJlbnRGb2N1cy5mb2N1cygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBEaXNjYXJkIGVycm9yLlxuICAgICAgLy8gSW5pdGlhbCBzZXR0aW5nIG9mIHtAY29kZSBzdWNjZXNzZnVsfSB3aWxsIHJlcHJlc2VudCBmYWlsdXJlIGhlcmUuXG4gICAgfVxuXG4gICAgcmV0dXJuIHN1Y2Nlc3NmdWw7XG4gIH1cblxuICAvKiogQ2xlYW5zIHVwIERPTSBjaGFuZ2VzIHVzZWQgdG8gcGVyZm9ybSB0aGUgY29weSBvcGVyYXRpb24uICovXG4gIGRlc3Ryb3koKSB7XG4gICAgY29uc3QgdGV4dGFyZWEgPSB0aGlzLl90ZXh0YXJlYTtcblxuICAgIGlmICh0ZXh0YXJlYSkge1xuICAgICAgdGV4dGFyZWEucmVtb3ZlKCk7XG4gICAgICB0aGlzLl90ZXh0YXJlYSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cbn1cbiJdfQ==