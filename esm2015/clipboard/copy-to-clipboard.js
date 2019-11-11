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
import { Directive, EventEmitter, Input, Output } from '@angular/core';
import { Clipboard } from './clipboard';
/**
 * Provides behavior for a button that when clicked copies content into user's
 * clipboard.
 */
export class CdkCopyToClipboard {
    /**
     * @param {?} _clipboard
     */
    constructor(_clipboard) {
        this._clipboard = _clipboard;
        /**
         * Content to be copied.
         */
        this.text = '';
        /**
         * Emits when some text is copied to the clipboard. The
         * emitted value indicates whether copying was successful.
         */
        this.copied = new EventEmitter();
        /**
         * Emits when some text is copied to the clipboard. The
         * emitted value indicates whether copying was successful.
         * @deprecated Use `cdkCopyToClipboardCopied` instead.
         * \@breaking-change 10.0.0
         */
        this._deprecatedCopied = this.copied;
    }
    /**
     * Copies the current text to the clipboard.
     * @return {?}
     */
    copy() {
        this.copied.emit(this._clipboard.copy(this.text));
    }
}
CdkCopyToClipboard.decorators = [
    { type: Directive, args: [{
                selector: '[cdkCopyToClipboard]',
                host: {
                    '(click)': 'copy()',
                }
            },] }
];
/** @nocollapse */
CdkCopyToClipboard.ctorParameters = () => [
    { type: Clipboard }
];
CdkCopyToClipboard.propDecorators = {
    text: [{ type: Input, args: ['cdkCopyToClipboard',] }],
    copied: [{ type: Output, args: ['cdkCopyToClipboardCopied',] }],
    _deprecatedCopied: [{ type: Output, args: ['copied',] }]
};
if (false) {
    /**
     * Content to be copied.
     * @type {?}
     */
    CdkCopyToClipboard.prototype.text;
    /**
     * Emits when some text is copied to the clipboard. The
     * emitted value indicates whether copying was successful.
     * @type {?}
     */
    CdkCopyToClipboard.prototype.copied;
    /**
     * Emits when some text is copied to the clipboard. The
     * emitted value indicates whether copying was successful.
     * @deprecated Use `cdkCopyToClipboardCopied` instead.
     * \@breaking-change 10.0.0
     * @type {?}
     */
    CdkCopyToClipboard.prototype._deprecatedCopied;
    /**
     * @type {?}
     * @private
     */
    CdkCopyToClipboard.prototype._clipboard;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29weS10by1jbGlwYm9hcmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2NsaXBib2FyZC9jb3B5LXRvLWNsaXBib2FyZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFckUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGFBQWEsQ0FBQzs7Ozs7QUFZdEMsTUFBTSxPQUFPLGtCQUFrQjs7OztJQWtCN0IsWUFBNkIsVUFBcUI7UUFBckIsZUFBVSxHQUFWLFVBQVUsQ0FBVzs7OztRQWhCckIsU0FBSSxHQUFXLEVBQUUsQ0FBQzs7Ozs7UUFNWCxXQUFNLEdBQUcsSUFBSSxZQUFZLEVBQVcsQ0FBQzs7Ozs7OztRQVF2RCxzQkFBaUIsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBRUcsQ0FBQzs7Ozs7SUFHdEQsSUFBSTtRQUNGLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3BELENBQUM7OztZQTdCRixTQUFTLFNBQUM7Z0JBQ1QsUUFBUSxFQUFFLHNCQUFzQjtnQkFDaEMsSUFBSSxFQUFFO29CQUNKLFNBQVMsRUFBRSxRQUFRO2lCQUNwQjthQUNGOzs7O1lBWE8sU0FBUzs7O21CQWNkLEtBQUssU0FBQyxvQkFBb0I7cUJBTTFCLE1BQU0sU0FBQywwQkFBMEI7Z0NBUWpDLE1BQU0sU0FBQyxRQUFROzs7Ozs7O0lBZGhCLGtDQUErQzs7Ozs7O0lBTS9DLG9DQUF5RTs7Ozs7Ozs7SUFRekUsK0NBQWtEOzs7OztJQUV0Qyx3Q0FBc0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3RpdmUsIEV2ZW50RW1pdHRlciwgSW5wdXQsIE91dHB1dH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7Q2xpcGJvYXJkfSBmcm9tICcuL2NsaXBib2FyZCc7XG5cbi8qKlxuICogUHJvdmlkZXMgYmVoYXZpb3IgZm9yIGEgYnV0dG9uIHRoYXQgd2hlbiBjbGlja2VkIGNvcGllcyBjb250ZW50IGludG8gdXNlcidzXG4gKiBjbGlwYm9hcmQuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtDb3B5VG9DbGlwYm9hcmRdJyxcbiAgaG9zdDoge1xuICAgICcoY2xpY2spJzogJ2NvcHkoKScsXG4gIH1cbn0pXG5leHBvcnQgY2xhc3MgQ2RrQ29weVRvQ2xpcGJvYXJkIHtcbiAgLyoqIENvbnRlbnQgdG8gYmUgY29waWVkLiAqL1xuICBASW5wdXQoJ2Nka0NvcHlUb0NsaXBib2FyZCcpIHRleHQ6IHN0cmluZyA9ICcnO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB3aGVuIHNvbWUgdGV4dCBpcyBjb3BpZWQgdG8gdGhlIGNsaXBib2FyZC4gVGhlXG4gICAqIGVtaXR0ZWQgdmFsdWUgaW5kaWNhdGVzIHdoZXRoZXIgY29weWluZyB3YXMgc3VjY2Vzc2Z1bC5cbiAgICovXG4gIEBPdXRwdXQoJ2Nka0NvcHlUb0NsaXBib2FyZENvcGllZCcpIGNvcGllZCA9IG5ldyBFdmVudEVtaXR0ZXI8Ym9vbGVhbj4oKTtcblxuICAvKipcbiAgICogRW1pdHMgd2hlbiBzb21lIHRleHQgaXMgY29waWVkIHRvIHRoZSBjbGlwYm9hcmQuIFRoZVxuICAgKiBlbWl0dGVkIHZhbHVlIGluZGljYXRlcyB3aGV0aGVyIGNvcHlpbmcgd2FzIHN1Y2Nlc3NmdWwuXG4gICAqIEBkZXByZWNhdGVkIFVzZSBgY2RrQ29weVRvQ2xpcGJvYXJkQ29waWVkYCBpbnN0ZWFkLlxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDEwLjAuMFxuICAgKi9cbiAgQE91dHB1dCgnY29waWVkJykgX2RlcHJlY2F0ZWRDb3BpZWQgPSB0aGlzLmNvcGllZDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IF9jbGlwYm9hcmQ6IENsaXBib2FyZCkge31cblxuICAvKiogQ29waWVzIHRoZSBjdXJyZW50IHRleHQgdG8gdGhlIGNsaXBib2FyZC4gKi9cbiAgY29weSgpIHtcbiAgICB0aGlzLmNvcGllZC5lbWl0KHRoaXMuX2NsaXBib2FyZC5jb3B5KHRoaXMudGV4dCkpO1xuICB9XG59XG4iXX0=