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
var CdkCopyToClipboard = /** @class */ (function () {
    function CdkCopyToClipboard(_clipboard) {
        this._clipboard = _clipboard;
        /** Content to be copied. */
        this.text = '';
        /**
         * Emits when some text is copied to the clipboard. The
         * emitted value indicates whether copying was successful.
         */
        this.copied = new EventEmitter();
    }
    /** Copies the current text to the clipboard. */
    CdkCopyToClipboard.prototype.copy = function () {
        this.copied.emit(this._clipboard.copy(this.text));
    };
    CdkCopyToClipboard.decorators = [
        { type: Directive, args: [{
                    selector: '[cdkCopyToClipboard]',
                    host: {
                        '(click)': 'copy()',
                    }
                },] }
    ];
    /** @nocollapse */
    CdkCopyToClipboard.ctorParameters = function () { return [
        { type: Clipboard }
    ]; };
    CdkCopyToClipboard.propDecorators = {
        text: [{ type: Input, args: ['cdkCopyToClipboard',] }],
        copied: [{ type: Output }]
    };
    return CdkCopyToClipboard;
}());
export { CdkCopyToClipboard };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29weS10by1jbGlwYm9hcmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2NsaXBib2FyZC9jb3B5LXRvLWNsaXBib2FyZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRXJFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFFdEM7Ozs7Ozs7R0FPRztBQUNIO0lBZ0JFLDRCQUE2QixVQUFxQjtRQUFyQixlQUFVLEdBQVYsVUFBVSxDQUFXO1FBVGxELDRCQUE0QjtRQUNDLFNBQUksR0FBVyxFQUFFLENBQUM7UUFFL0M7OztXQUdHO1FBQ08sV0FBTSxHQUFHLElBQUksWUFBWSxFQUFXLENBQUM7SUFFTSxDQUFDO0lBRXRELGdEQUFnRDtJQUNoRCxpQ0FBSSxHQUFKO1FBQ0UsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDcEQsQ0FBQzs7Z0JBckJGLFNBQVMsU0FBQztvQkFDVCxRQUFRLEVBQUUsc0JBQXNCO29CQUNoQyxJQUFJLEVBQUU7d0JBQ0osU0FBUyxFQUFFLFFBQVE7cUJBQ3BCO2lCQUNGOzs7O2dCQWZPLFNBQVM7Ozt1QkFrQmQsS0FBSyxTQUFDLG9CQUFvQjt5QkFNMUIsTUFBTTs7SUFRVCx5QkFBQztDQUFBLEFBdEJELElBc0JDO1NBaEJZLGtCQUFrQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGl2ZSwgRXZlbnRFbWl0dGVyLCBJbnB1dCwgT3V0cHV0fSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHtDbGlwYm9hcmR9IGZyb20gJy4vY2xpcGJvYXJkJztcblxuLyoqXG4gKiBQcm92aWRlcyBiZWhhdmlvciBmb3IgYSBidXR0b24gdGhhdCB3aGVuIGNsaWNrZWQgY29waWVzIGNvbnRlbnQgaW50byB1c2VyJ3NcbiAqIGNsaXBib2FyZC5cbiAqXG4gKiBFeGFtcGxlIHVzYWdlOlxuICpcbiAqIGA8YnV0dG9uIGNvcHlUb0NsaXBib2FyZD1cIkNvbnRlbnQgdG8gYmUgY29waWVkXCI+Q29weSBtZSE8L2J1dHRvbj5gXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtDb3B5VG9DbGlwYm9hcmRdJyxcbiAgaG9zdDoge1xuICAgICcoY2xpY2spJzogJ2NvcHkoKScsXG4gIH1cbn0pXG5leHBvcnQgY2xhc3MgQ2RrQ29weVRvQ2xpcGJvYXJkIHtcbiAgLyoqIENvbnRlbnQgdG8gYmUgY29waWVkLiAqL1xuICBASW5wdXQoJ2Nka0NvcHlUb0NsaXBib2FyZCcpIHRleHQ6IHN0cmluZyA9ICcnO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB3aGVuIHNvbWUgdGV4dCBpcyBjb3BpZWQgdG8gdGhlIGNsaXBib2FyZC4gVGhlXG4gICAqIGVtaXR0ZWQgdmFsdWUgaW5kaWNhdGVzIHdoZXRoZXIgY29weWluZyB3YXMgc3VjY2Vzc2Z1bC5cbiAgICovXG4gIEBPdXRwdXQoKSBjb3BpZWQgPSBuZXcgRXZlbnRFbWl0dGVyPGJvb2xlYW4+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBfY2xpcGJvYXJkOiBDbGlwYm9hcmQpIHt9XG5cbiAgLyoqIENvcGllcyB0aGUgY3VycmVudCB0ZXh0IHRvIHRoZSBjbGlwYm9hcmQuICovXG4gIGNvcHkoKSB7XG4gICAgdGhpcy5jb3BpZWQuZW1pdCh0aGlzLl9jbGlwYm9hcmQuY29weSh0aGlzLnRleHQpKTtcbiAgfVxufVxuIl19