(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/common'), require('@angular/core')) :
    typeof define === 'function' && define.amd ? define('@angular/cdk/clipboard', ['exports', '@angular/common', '@angular/core'], factory) :
    (global = global || self, factory((global.ng = global.ng || {}, global.ng.cdk = global.ng.cdk || {}, global.ng.cdk.clipboard = {}), global.ng.common, global.ng.core));
}(this, (function (exports, i1, i0) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }

    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

    function __param(paramIndex, decorator) {
        return function (target, key) { decorator(target, key, paramIndex); }
    }

    function __metadata(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
    }

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    var __createBinding = Object.create ? (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
    }) : (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
    });

    function __exportStar(m, exports) {
        for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
    }

    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }

    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    };

    function __await(v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
    }

    function __asyncGenerator(thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
        function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
        function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
        function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
        function fulfill(value) { resume("next", value); }
        function reject(value) { resume("throw", value); }
        function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
    }

    function __asyncDelegator(o) {
        var i, p;
        return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
        function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
    }

    function __asyncValues(o) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
        function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
        function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
    }

    function __makeTemplateObject(cooked, raw) {
        if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
        return cooked;
    };

    var __setModuleDefault = Object.create ? (function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
        o["default"] = v;
    };

    function __importStar(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
        __setModuleDefault(result, mod);
        return result;
    }

    function __importDefault(mod) {
        return (mod && mod.__esModule) ? mod : { default: mod };
    }

    function __classPrivateFieldGet(receiver, privateMap) {
        if (!privateMap.has(receiver)) {
            throw new TypeError("attempted to get private field on non-instance");
        }
        return privateMap.get(receiver);
    }

    function __classPrivateFieldSet(receiver, privateMap, value) {
        if (!privateMap.has(receiver)) {
            throw new TypeError("attempted to set private field on non-instance");
        }
        privateMap.set(receiver, value);
        return value;
    }

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
        Clipboard.ɵprov = i0.ɵɵdefineInjectable({ factory: function Clipboard_Factory() { return new Clipboard(i0.ɵɵinject(i1.DOCUMENT)); }, token: Clipboard, providedIn: "root" });
        Clipboard = __decorate([
            i0.Injectable({ providedIn: 'root' }),
            __param(0, i0.Inject(i1.DOCUMENT)),
            __metadata("design:paramtypes", [Object])
        ], Clipboard);
        return Clipboard;
    }());

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /** Injection token that can be used to provide the default options to `CdkCopyToClipboard`. */
    var CKD_COPY_TO_CLIPBOARD_CONFIG = new i0.InjectionToken('CKD_COPY_TO_CLIPBOARD_CONFIG');
    /**
     * Provides behavior for a button that when clicked copies content into user's
     * clipboard.
     */
    var CdkCopyToClipboard = /** @class */ (function () {
        function CdkCopyToClipboard(_clipboard, 
        /**
         * @deprecated _ngZone parameter to become required.
         * @breaking-change 10.0.0
         */
        _ngZone, config) {
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
            this.copied = new i0.EventEmitter();
            /**
             * Emits when some text is copied to the clipboard. The
             * emitted value indicates whether copying was successful.
             * @deprecated Use `cdkCopyToClipboardCopied` instead.
             * @breaking-change 10.0.0
             */
            this._deprecatedCopied = this.copied;
            /** Copies that are currently being attempted. */
            this._pending = new Set();
            if (config && config.attempts != null) {
                this.attempts = config.attempts;
            }
        }
        /** Copies the current text to the clipboard. */
        CdkCopyToClipboard.prototype.copy = function (attempts) {
            var _this = this;
            if (attempts === void 0) { attempts = this.attempts; }
            if (attempts > 1) {
                var remainingAttempts_1 = attempts;
                var pending_1 = this._clipboard.beginCopy(this.text);
                this._pending.add(pending_1);
                var attempt_1 = function () {
                    var successful = pending_1.copy();
                    if (!successful && --remainingAttempts_1 && !_this._destroyed) {
                        // @breaking-change 10.0.0 Remove null check for `_ngZone`.
                        if (_this._ngZone) {
                            _this._currentTimeout = _this._ngZone.runOutsideAngular(function () { return setTimeout(attempt_1, 1); });
                        }
                        else {
                            // We use 1 for the timeout since it's more predictable when flushing in unit tests.
                            _this._currentTimeout = setTimeout(attempt_1, 1);
                        }
                    }
                    else {
                        _this._currentTimeout = null;
                        _this._pending.delete(pending_1);
                        pending_1.destroy();
                        _this.copied.emit(successful);
                    }
                };
                attempt_1();
            }
            else {
                this.copied.emit(this._clipboard.copy(this.text));
            }
        };
        CdkCopyToClipboard.prototype.ngOnDestroy = function () {
            if (this._currentTimeout) {
                clearTimeout(this._currentTimeout);
            }
            this._pending.forEach(function (copy) { return copy.destroy(); });
            this._pending.clear();
            this._destroyed = true;
        };
        __decorate([
            i0.Input('cdkCopyToClipboard'),
            __metadata("design:type", String)
        ], CdkCopyToClipboard.prototype, "text", void 0);
        __decorate([
            i0.Input('cdkCopyToClipboardAttempts'),
            __metadata("design:type", Number)
        ], CdkCopyToClipboard.prototype, "attempts", void 0);
        __decorate([
            i0.Output('cdkCopyToClipboardCopied'),
            __metadata("design:type", Object)
        ], CdkCopyToClipboard.prototype, "copied", void 0);
        __decorate([
            i0.Output('copied'),
            __metadata("design:type", Object)
        ], CdkCopyToClipboard.prototype, "_deprecatedCopied", void 0);
        CdkCopyToClipboard = __decorate([
            i0.Directive({
                selector: '[cdkCopyToClipboard]',
                host: {
                    '(click)': 'copy()',
                }
            }),
            __param(2, i0.Optional()), __param(2, i0.Inject(CKD_COPY_TO_CLIPBOARD_CONFIG)),
            __metadata("design:paramtypes", [Clipboard,
                i0.NgZone, Object])
        ], CdkCopyToClipboard);
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
        ClipboardModule = __decorate([
            i0.NgModule({
                declarations: [CdkCopyToClipboard],
                exports: [CdkCopyToClipboard],
            })
        ], ClipboardModule);
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

    exports.CKD_COPY_TO_CLIPBOARD_CONFIG = CKD_COPY_TO_CLIPBOARD_CONFIG;
    exports.CdkCopyToClipboard = CdkCopyToClipboard;
    exports.Clipboard = Clipboard;
    exports.ClipboardModule = ClipboardModule;
    exports.PendingCopy = PendingCopy;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=cdk-clipboard.umd.js.map
