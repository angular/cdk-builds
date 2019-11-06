(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/common'), require('@angular/core')) :
    typeof define === 'function' && define.amd ? define('@angular/cdk/clipboard', ['exports', '@angular/common', '@angular/core'], factory) :
    (global = global || self, factory((global.ng = global.ng || {}, global.ng.cdk = global.ng.cdk || {}, global.ng.cdk.clipboard = {}), global.ng.common, global.ng.core));
}(this, function (exports, i1, i0) { 'use strict';

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

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * A service for copying text to the clipboard.
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
            { type: i0.Injectable, args: [{ providedIn: 'root' },] }
        ];
        /** @nocollapse */
        Clipboard.ctorParameters = function () { return [
            { type: undefined, decorators: [{ type: i0.Inject, args: [i1.DOCUMENT,] }] }
        ]; };
        Clipboard.ɵprov = i0.ɵɵdefineInjectable({ factory: function Clipboard_Factory() { return new Clipboard(i0.ɵɵinject(i1.DOCUMENT)); }, token: Clipboard, providedIn: "root" });
        return Clipboard;
    }());

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Provides behavior for a button that when clicked copies content into user's
     * clipboard.
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
            this.copied = new i0.EventEmitter();
        }
        /** Copies the current text to the clipboard. */
        CdkCopyToClipboard.prototype.copy = function () {
            this.copied.emit(this._clipboard.copy(this.text));
        };
        CdkCopyToClipboard.decorators = [
            { type: i0.Directive, args: [{
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
            text: [{ type: i0.Input, args: ['cdkCopyToClipboard',] }],
            copied: [{ type: i0.Output }]
        };
        return CdkCopyToClipboard;
    }());

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var ClipboardModule = /** @class */ (function () {
        function ClipboardModule() {
        }
        ClipboardModule.decorators = [
            { type: i0.NgModule, args: [{
                        declarations: [CdkCopyToClipboard],
                        imports: [i1.CommonModule],
                        exports: [CdkCopyToClipboard],
                    },] }
        ];
        return ClipboardModule;
    }());

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */

    /**
     * Generated bundle index. Do not edit.
     */

    exports.Clipboard = Clipboard;
    exports.ClipboardModule = ClipboardModule;
    exports.CdkCopyToClipboard = CdkCopyToClipboard;
    exports.PendingCopy = PendingCopy;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=cdk-clipboard.umd.js.map
