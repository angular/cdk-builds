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
 *
 * Example usage:
 *
 * `<button copyToClipboard="Content to be copied">Copy me!</button>`
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
    copied: [{ type: Output }]
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
     * @type {?}
     * @private
     */
    CdkCopyToClipboard.prototype._clipboard;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29weS10by1jbGlwYm9hcmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2NsaXBib2FyZC9jb3B5LXRvLWNsaXBib2FyZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFckUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGFBQWEsQ0FBQzs7Ozs7Ozs7O0FBZ0J0QyxNQUFNLE9BQU8sa0JBQWtCOzs7O0lBVTdCLFlBQTZCLFVBQXFCO1FBQXJCLGVBQVUsR0FBVixVQUFVLENBQVc7Ozs7UUFSckIsU0FBSSxHQUFXLEVBQUUsQ0FBQzs7Ozs7UUFNckMsV0FBTSxHQUFHLElBQUksWUFBWSxFQUFXLENBQUM7SUFFTSxDQUFDOzs7OztJQUd0RCxJQUFJO1FBQ0YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDcEQsQ0FBQzs7O1lBckJGLFNBQVMsU0FBQztnQkFDVCxRQUFRLEVBQUUsc0JBQXNCO2dCQUNoQyxJQUFJLEVBQUU7b0JBQ0osU0FBUyxFQUFFLFFBQVE7aUJBQ3BCO2FBQ0Y7Ozs7WUFmTyxTQUFTOzs7bUJBa0JkLEtBQUssU0FBQyxvQkFBb0I7cUJBTTFCLE1BQU07Ozs7Ozs7SUFOUCxrQ0FBK0M7Ozs7OztJQU0vQyxvQ0FBK0M7Ozs7O0lBRW5DLHdDQUFzQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGl2ZSwgRXZlbnRFbWl0dGVyLCBJbnB1dCwgT3V0cHV0fSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHtDbGlwYm9hcmR9IGZyb20gJy4vY2xpcGJvYXJkJztcblxuLyoqXG4gKiBQcm92aWRlcyBiZWhhdmlvciBmb3IgYSBidXR0b24gdGhhdCB3aGVuIGNsaWNrZWQgY29waWVzIGNvbnRlbnQgaW50byB1c2VyJ3NcbiAqIGNsaXBib2FyZC5cbiAqXG4gKiBFeGFtcGxlIHVzYWdlOlxuICpcbiAqIGA8YnV0dG9uIGNvcHlUb0NsaXBib2FyZD1cIkNvbnRlbnQgdG8gYmUgY29waWVkXCI+Q29weSBtZSE8L2J1dHRvbj5gXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtDb3B5VG9DbGlwYm9hcmRdJyxcbiAgaG9zdDoge1xuICAgICcoY2xpY2spJzogJ2NvcHkoKScsXG4gIH1cbn0pXG5leHBvcnQgY2xhc3MgQ2RrQ29weVRvQ2xpcGJvYXJkIHtcbiAgLyoqIENvbnRlbnQgdG8gYmUgY29waWVkLiAqL1xuICBASW5wdXQoJ2Nka0NvcHlUb0NsaXBib2FyZCcpIHRleHQ6IHN0cmluZyA9ICcnO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB3aGVuIHNvbWUgdGV4dCBpcyBjb3BpZWQgdG8gdGhlIGNsaXBib2FyZC4gVGhlXG4gICAqIGVtaXR0ZWQgdmFsdWUgaW5kaWNhdGVzIHdoZXRoZXIgY29weWluZyB3YXMgc3VjY2Vzc2Z1bC5cbiAgICovXG4gIEBPdXRwdXQoKSBjb3BpZWQgPSBuZXcgRXZlbnRFbWl0dGVyPGJvb2xlYW4+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBfY2xpcGJvYXJkOiBDbGlwYm9hcmQpIHt9XG5cbiAgLyoqIENvcGllcyB0aGUgY3VycmVudCB0ZXh0IHRvIHRoZSBjbGlwYm9hcmQuICovXG4gIGNvcHkoKSB7XG4gICAgdGhpcy5jb3BpZWQuZW1pdCh0aGlzLl9jbGlwYm9hcmQuY29weSh0aGlzLnRleHQpKTtcbiAgfVxufVxuIl19