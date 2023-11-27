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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVuZGluZy1jb3B5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9jbGlwYm9hcmQvcGVuZGluZy1jb3B5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVIOzs7Ozs7Ozs7Ozs7R0FZRztBQUNILE1BQU0sT0FBTyxXQUFXO0lBR3RCLFlBQ0UsSUFBWSxFQUNLLFNBQW1CO1FBQW5CLGNBQVMsR0FBVCxTQUFTLENBQVU7UUFFcEMsTUFBTSxRQUFRLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDN0UsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQztRQUU5QiwwRkFBMEY7UUFDMUYseUZBQXlGO1FBQ3pGLGdHQUFnRztRQUNoRyxNQUFNLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztRQUMxQixNQUFNLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDO1FBQ2xDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDO1FBQ3ZCLFFBQVEsQ0FBQyxZQUFZLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzdDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ3RCLDhGQUE4RjtRQUM5RixRQUFRLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztRQUN6Qiw4RUFBOEU7UUFDOUUsK0VBQStFO1FBQy9FLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNsRixDQUFDO0lBRUQsaUNBQWlDO0lBQ2pDLElBQUk7UUFDRixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ2hDLElBQUksVUFBVSxHQUFHLEtBQUssQ0FBQztRQUV2QixJQUFJO1lBQ0YsdURBQXVEO1lBQ3ZELElBQUksUUFBUSxFQUFFO2dCQUNaLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBd0MsQ0FBQztnQkFFN0UsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNsQixRQUFRLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3JELFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFFaEQsSUFBSSxZQUFZLEVBQUU7b0JBQ2hCLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQztpQkFDdEI7YUFDRjtTQUNGO1FBQUMsTUFBTTtZQUNOLGlCQUFpQjtZQUNqQixxRUFBcUU7U0FDdEU7UUFFRCxPQUFPLFVBQVUsQ0FBQztJQUNwQixDQUFDO0lBRUQsZ0VBQWdFO0lBQ2hFLE9BQU87UUFDTCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBRWhDLElBQUksUUFBUSxFQUFFO1lBQ1osUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1NBQzVCO0lBQ0gsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogQSBwZW5kaW5nIGNvcHktdG8tY2xpcGJvYXJkIG9wZXJhdGlvbi5cbiAqXG4gKiBUaGUgaW1wbGVtZW50YXRpb24gb2YgY29weWluZyB0ZXh0IHRvIHRoZSBjbGlwYm9hcmQgbW9kaWZpZXMgdGhlIERPTSBhbmRcbiAqIGZvcmNlcyBhIHJlLWxheW91dC4gVGhpcyByZS1sYXlvdXQgY2FuIHRha2UgdG9vIGxvbmcgaWYgdGhlIHN0cmluZyBpcyBsYXJnZSxcbiAqIGNhdXNpbmcgdGhlIGV4ZWNDb21tYW5kKCdjb3B5JykgdG8gaGFwcGVuIHRvbyBsb25nIGFmdGVyIHRoZSB1c2VyIGNsaWNrZWQuXG4gKiBUaGlzIHJlc3VsdHMgaW4gdGhlIGJyb3dzZXIgcmVmdXNpbmcgdG8gY29weS4gVGhpcyBvYmplY3QgbGV0cyB0aGVcbiAqIHJlLWxheW91dCBoYXBwZW4gaW4gYSBzZXBhcmF0ZSB0aWNrIGZyb20gY29weWluZyBieSBwcm92aWRpbmcgYSBjb3B5IGZ1bmN0aW9uXG4gKiB0aGF0IGNhbiBiZSBjYWxsZWQgbGF0ZXIuXG4gKlxuICogRGVzdHJveSBtdXN0IGJlIGNhbGxlZCB3aGVuIG5vIGxvbmdlciBpbiB1c2UsIHJlZ2FyZGxlc3Mgb2Ygd2hldGhlciBgY29weWAgaXNcbiAqIGNhbGxlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIFBlbmRpbmdDb3B5IHtcbiAgcHJpdmF0ZSBfdGV4dGFyZWE6IEhUTUxUZXh0QXJlYUVsZW1lbnQgfCB1bmRlZmluZWQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgdGV4dDogc3RyaW5nLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgX2RvY3VtZW50OiBEb2N1bWVudCxcbiAgKSB7XG4gICAgY29uc3QgdGV4dGFyZWEgPSAodGhpcy5fdGV4dGFyZWEgPSB0aGlzLl9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScpKTtcbiAgICBjb25zdCBzdHlsZXMgPSB0ZXh0YXJlYS5zdHlsZTtcblxuICAgIC8vIEhpZGUgdGhlIGVsZW1lbnQgZm9yIGRpc3BsYXkgYW5kIGFjY2Vzc2liaWxpdHkuIFNldCBhIGZpeGVkIHBvc2l0aW9uIHNvIHRoZSBwYWdlIGxheW91dFxuICAgIC8vIGlzbid0IGFmZmVjdGVkLiBXZSB1c2UgYGZpeGVkYCB3aXRoIGB0b3A6IDBgLCBiZWNhdXNlIGZvY3VzIGlzIG1vdmVkIGludG8gdGhlIHRleHRhcmVhXG4gICAgLy8gZm9yIGEgc3BsaXQgc2Vjb25kIGFuZCBpZiBpdCdzIG9mZi1zY3JlZW4sIHNvbWUgYnJvd3NlcnMgd2lsbCBhdHRlbXB0IHRvIHNjcm9sbCBpdCBpbnRvIHZpZXcuXG4gICAgc3R5bGVzLnBvc2l0aW9uID0gJ2ZpeGVkJztcbiAgICBzdHlsZXMudG9wID0gc3R5bGVzLm9wYWNpdHkgPSAnMCc7XG4gICAgc3R5bGVzLmxlZnQgPSAnLTk5OWVtJztcbiAgICB0ZXh0YXJlYS5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICB0ZXh0YXJlYS52YWx1ZSA9IHRleHQ7XG4gICAgLy8gTWFraW5nIHRoZSB0ZXh0YXJlYSBgcmVhZG9ubHlgIHByZXZlbnRzIHRoZSBzY3JlZW4gZnJvbSBqdW1waW5nIG9uIGlPUyBTYWZhcmkgKHNlZSAjMjUxNjkpLlxuICAgIHRleHRhcmVhLnJlYWRPbmx5ID0gdHJ1ZTtcbiAgICAvLyBUaGUgZWxlbWVudCBuZWVkcyB0byBiZSBpbnNlcnRlZCBpbnRvIHRoZSBmdWxsc2NyZWVuIGNvbnRhaW5lciwgaWYgdGhlIHBhZ2VcbiAgICAvLyBpcyBpbiBmdWxsc2NyZWVuIG1vZGUsIG90aGVyd2lzZSB0aGUgYnJvd3NlciB3b24ndCBleGVjdXRlIHRoZSBjb3B5IGNvbW1hbmQuXG4gICAgKHRoaXMuX2RvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50IHx8IHRoaXMuX2RvY3VtZW50LmJvZHkpLmFwcGVuZENoaWxkKHRleHRhcmVhKTtcbiAgfVxuXG4gIC8qKiBGaW5pc2hlcyBjb3B5aW5nIHRoZSB0ZXh0LiAqL1xuICBjb3B5KCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHRleHRhcmVhID0gdGhpcy5fdGV4dGFyZWE7XG4gICAgbGV0IHN1Y2Nlc3NmdWwgPSBmYWxzZTtcblxuICAgIHRyeSB7XG4gICAgICAvLyBPbGRlciBicm93c2VycyBjb3VsZCB0aHJvdyBpZiBjb3B5IGlzIG5vdCBzdXBwb3J0ZWQuXG4gICAgICBpZiAodGV4dGFyZWEpIHtcbiAgICAgICAgY29uc3QgY3VycmVudEZvY3VzID0gdGhpcy5fZG9jdW1lbnQuYWN0aXZlRWxlbWVudCBhcyBIVE1MT3JTVkdFbGVtZW50IHwgbnVsbDtcblxuICAgICAgICB0ZXh0YXJlYS5zZWxlY3QoKTtcbiAgICAgICAgdGV4dGFyZWEuc2V0U2VsZWN0aW9uUmFuZ2UoMCwgdGV4dGFyZWEudmFsdWUubGVuZ3RoKTtcbiAgICAgICAgc3VjY2Vzc2Z1bCA9IHRoaXMuX2RvY3VtZW50LmV4ZWNDb21tYW5kKCdjb3B5Jyk7XG5cbiAgICAgICAgaWYgKGN1cnJlbnRGb2N1cykge1xuICAgICAgICAgIGN1cnJlbnRGb2N1cy5mb2N1cygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBEaXNjYXJkIGVycm9yLlxuICAgICAgLy8gSW5pdGlhbCBzZXR0aW5nIG9mIHtAY29kZSBzdWNjZXNzZnVsfSB3aWxsIHJlcHJlc2VudCBmYWlsdXJlIGhlcmUuXG4gICAgfVxuXG4gICAgcmV0dXJuIHN1Y2Nlc3NmdWw7XG4gIH1cblxuICAvKiogQ2xlYW5zIHVwIERPTSBjaGFuZ2VzIHVzZWQgdG8gcGVyZm9ybSB0aGUgY29weSBvcGVyYXRpb24uICovXG4gIGRlc3Ryb3koKSB7XG4gICAgY29uc3QgdGV4dGFyZWEgPSB0aGlzLl90ZXh0YXJlYTtcblxuICAgIGlmICh0ZXh0YXJlYSkge1xuICAgICAgdGV4dGFyZWEucmVtb3ZlKCk7XG4gICAgICB0aGlzLl90ZXh0YXJlYSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cbn1cbiJdfQ==