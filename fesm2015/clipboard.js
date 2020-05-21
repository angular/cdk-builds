import { __decorate, __param, __metadata } from 'tslib';
import { DOCUMENT } from '@angular/common';
import { ɵɵdefineInjectable, ɵɵinject, Injectable, Inject, InjectionToken, EventEmitter, Input, Output, Directive, Optional, NgZone, NgModule } from '@angular/core';

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
class PendingCopy {
    constructor(text, _document) {
        this._document = _document;
        const textarea = this._textarea = this._document.createElement('textarea');
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
    /** Finishes copying the text. */
    copy() {
        const textarea = this._textarea;
        let successful = false;
        try { // Older browsers could throw if copy is not supported.
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
        catch (_a) {
            // Discard error.
            // Initial setting of {@code successful} will represent failure here.
        }
        return successful;
    }
    /** Cleans up DOM changes used to perform the copy operation. */
    destroy() {
        const textarea = this._textarea;
        if (textarea) {
            if (textarea.parentNode) {
                textarea.parentNode.removeChild(textarea);
            }
            this._textarea = undefined;
        }
    }
}

/**
 * A service for copying text to the clipboard.
 */
let Clipboard = /** @class */ (() => {
    let Clipboard = class Clipboard {
        constructor(document) {
            this._document = document;
        }
        /**
         * Copies the provided text into the user's clipboard.
         *
         * @param text The string to copy.
         * @returns Whether the operation was successful.
         */
        copy(text) {
            const pendingCopy = this.beginCopy(text);
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
         * @param text The string to copy.
         * @returns the pending copy operation.
         */
        beginCopy(text) {
            return new PendingCopy(text, this._document);
        }
    };
    Clipboard.ɵprov = ɵɵdefineInjectable({ factory: function Clipboard_Factory() { return new Clipboard(ɵɵinject(DOCUMENT)); }, token: Clipboard, providedIn: "root" });
    Clipboard = __decorate([
        Injectable({ providedIn: 'root' }),
        __param(0, Inject(DOCUMENT)),
        __metadata("design:paramtypes", [Object])
    ], Clipboard);
    return Clipboard;
})();

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** Injection token that can be used to provide the default options to `CdkCopyToClipboard`. */
const CKD_COPY_TO_CLIPBOARD_CONFIG = new InjectionToken('CKD_COPY_TO_CLIPBOARD_CONFIG');
/**
 * Provides behavior for a button that when clicked copies content into user's
 * clipboard.
 */
let CdkCopyToClipboard = /** @class */ (() => {
    let CdkCopyToClipboard = class CdkCopyToClipboard {
        constructor(_clipboard, _ngZone, config) {
            this._clipboard = _clipboard;
            this._ngZone = _ngZone;
            /** Content to be copied. */
            this.text = '';
            /**
             * How many times to attempt to copy the text. This may be necessary for longer text, because
             * the browser needs time to fill an intermediate textarea element and copy the content.
             */
            this.attempts = 1;
            /**
             * Emits when some text is copied to the clipboard. The
             * emitted value indicates whether copying was successful.
             */
            this.copied = new EventEmitter();
            /** Copies that are currently being attempted. */
            this._pending = new Set();
            if (config && config.attempts != null) {
                this.attempts = config.attempts;
            }
        }
        /** Copies the current text to the clipboard. */
        copy(attempts = this.attempts) {
            if (attempts > 1) {
                let remainingAttempts = attempts;
                const pending = this._clipboard.beginCopy(this.text);
                this._pending.add(pending);
                const attempt = () => {
                    const successful = pending.copy();
                    if (!successful && --remainingAttempts && !this._destroyed) {
                        // We use 1 for the timeout since it's more predictable when flushing in unit tests.
                        this._currentTimeout = this._ngZone.runOutsideAngular(() => setTimeout(attempt, 1));
                    }
                    else {
                        this._currentTimeout = null;
                        this._pending.delete(pending);
                        pending.destroy();
                        this.copied.emit(successful);
                    }
                };
                attempt();
            }
            else {
                this.copied.emit(this._clipboard.copy(this.text));
            }
        }
        ngOnDestroy() {
            if (this._currentTimeout) {
                clearTimeout(this._currentTimeout);
            }
            this._pending.forEach(copy => copy.destroy());
            this._pending.clear();
            this._destroyed = true;
        }
    };
    __decorate([
        Input('cdkCopyToClipboard'),
        __metadata("design:type", String)
    ], CdkCopyToClipboard.prototype, "text", void 0);
    __decorate([
        Input('cdkCopyToClipboardAttempts'),
        __metadata("design:type", Number)
    ], CdkCopyToClipboard.prototype, "attempts", void 0);
    __decorate([
        Output('cdkCopyToClipboardCopied'),
        __metadata("design:type", Object)
    ], CdkCopyToClipboard.prototype, "copied", void 0);
    CdkCopyToClipboard = __decorate([
        Directive({
            selector: '[cdkCopyToClipboard]',
            host: {
                '(click)': 'copy()',
            }
        }),
        __param(2, Optional()), __param(2, Inject(CKD_COPY_TO_CLIPBOARD_CONFIG)),
        __metadata("design:paramtypes", [Clipboard,
            NgZone, Object])
    ], CdkCopyToClipboard);
    return CdkCopyToClipboard;
})();

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
let ClipboardModule = /** @class */ (() => {
    let ClipboardModule = class ClipboardModule {
    };
    ClipboardModule = __decorate([
        NgModule({
            declarations: [CdkCopyToClipboard],
            exports: [CdkCopyToClipboard],
        })
    ], ClipboardModule);
    return ClipboardModule;
})();

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

export { CKD_COPY_TO_CLIPBOARD_CONFIG, CdkCopyToClipboard, Clipboard, ClipboardModule, PendingCopy };
//# sourceMappingURL=clipboard.js.map
