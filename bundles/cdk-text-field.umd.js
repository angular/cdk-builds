(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/cdk/platform'), require('@angular/core'), require('@angular/cdk/coercion'), require('rxjs'), require('rxjs/operators'), require('@angular/common')) :
    typeof define === 'function' && define.amd ? define('@angular/cdk/text-field', ['exports', '@angular/cdk/platform', '@angular/core', '@angular/cdk/coercion', 'rxjs', 'rxjs/operators', '@angular/common'], factory) :
    (global = global || self, factory((global.ng = global.ng || {}, global.ng.cdk = global.ng.cdk || {}, global.ng.cdk.textField = {}), global.ng.cdk.platform, global.ng.core, global.ng.cdk.coercion, global.rxjs, global.rxjs.operators, global.ng.common));
}(this, (function (exports, i1, i0, coercion, rxjs, operators, common) { 'use strict';

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

    /** Options to pass to the animationstart listener. */
    var listenerOptions = i1.normalizePassiveListenerOptions({ passive: true });
    /**
     * An injectable service that can be used to monitor the autofill state of an input.
     * Based on the following blog post:
     * https://medium.com/@brunn/detecting-autofilled-fields-in-javascript-aed598d25da7
     */
    var AutofillMonitor = /** @class */ (function () {
        function AutofillMonitor(_platform, _ngZone) {
            this._platform = _platform;
            this._ngZone = _ngZone;
            this._monitoredElements = new Map();
        }
        AutofillMonitor.prototype.monitor = function (elementOrRef) {
            var _this = this;
            if (!this._platform.isBrowser) {
                return rxjs.EMPTY;
            }
            var element = coercion.coerceElement(elementOrRef);
            var info = this._monitoredElements.get(element);
            if (info) {
                return info.subject.asObservable();
            }
            var result = new rxjs.Subject();
            var cssClass = 'cdk-text-field-autofilled';
            var listener = (function (event) {
                // Animation events fire on initial element render, we check for the presence of the autofill
                // CSS class to make sure this is a real change in state, not just the initial render before
                // we fire off events.
                if (event.animationName === 'cdk-text-field-autofill-start' &&
                    !element.classList.contains(cssClass)) {
                    element.classList.add(cssClass);
                    _this._ngZone.run(function () { return result.next({ target: event.target, isAutofilled: true }); });
                }
                else if (event.animationName === 'cdk-text-field-autofill-end' &&
                    element.classList.contains(cssClass)) {
                    element.classList.remove(cssClass);
                    _this._ngZone.run(function () { return result.next({ target: event.target, isAutofilled: false }); });
                }
            });
            this._ngZone.runOutsideAngular(function () {
                element.addEventListener('animationstart', listener, listenerOptions);
                element.classList.add('cdk-text-field-autofill-monitored');
            });
            this._monitoredElements.set(element, {
                subject: result,
                unlisten: function () {
                    element.removeEventListener('animationstart', listener, listenerOptions);
                }
            });
            return result.asObservable();
        };
        AutofillMonitor.prototype.stopMonitoring = function (elementOrRef) {
            var element = coercion.coerceElement(elementOrRef);
            var info = this._monitoredElements.get(element);
            if (info) {
                info.unlisten();
                info.subject.complete();
                element.classList.remove('cdk-text-field-autofill-monitored');
                element.classList.remove('cdk-text-field-autofilled');
                this._monitoredElements.delete(element);
            }
        };
        AutofillMonitor.prototype.ngOnDestroy = function () {
            var _this = this;
            this._monitoredElements.forEach(function (_info, element) { return _this.stopMonitoring(element); });
        };
        AutofillMonitor.ɵprov = i0.ɵɵdefineInjectable({ factory: function AutofillMonitor_Factory() { return new AutofillMonitor(i0.ɵɵinject(i1.Platform), i0.ɵɵinject(i0.NgZone)); }, token: AutofillMonitor, providedIn: "root" });
        AutofillMonitor = __decorate([
            i0.Injectable({ providedIn: 'root' }),
            __metadata("design:paramtypes", [i1.Platform, i0.NgZone])
        ], AutofillMonitor);
        return AutofillMonitor;
    }());
    /** A directive that can be used to monitor the autofill state of an input. */
    var CdkAutofill = /** @class */ (function () {
        function CdkAutofill(_elementRef, _autofillMonitor) {
            this._elementRef = _elementRef;
            this._autofillMonitor = _autofillMonitor;
            /** Emits when the autofill state of the element changes. */
            this.cdkAutofill = new i0.EventEmitter();
        }
        CdkAutofill.prototype.ngOnInit = function () {
            var _this = this;
            this._autofillMonitor
                .monitor(this._elementRef)
                .subscribe(function (event) { return _this.cdkAutofill.emit(event); });
        };
        CdkAutofill.prototype.ngOnDestroy = function () {
            this._autofillMonitor.stopMonitoring(this._elementRef);
        };
        __decorate([
            i0.Output(),
            __metadata("design:type", i0.EventEmitter)
        ], CdkAutofill.prototype, "cdkAutofill", void 0);
        CdkAutofill = __decorate([
            i0.Directive({
                selector: '[cdkAutofill]',
            }),
            __metadata("design:paramtypes", [i0.ElementRef,
                AutofillMonitor])
        ], CdkAutofill);
        return CdkAutofill;
    }());

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /** Directive to automatically resize a textarea to fit its content. */
    var CdkTextareaAutosize = /** @class */ (function () {
        function CdkTextareaAutosize(_elementRef, _platform, _ngZone, 
        /** @breaking-change 11.0.0 make document required */
        document) {
            this._elementRef = _elementRef;
            this._platform = _platform;
            this._ngZone = _ngZone;
            this._destroyed = new rxjs.Subject();
            this._enabled = true;
            /**
             * Value of minRows as of last resize. If the minRows has decreased, the
             * height of the textarea needs to be recomputed to reflect the new minimum. The maxHeight
             * does not have the same problem because it does not affect the textarea's scrollHeight.
             */
            this._previousMinRows = -1;
            this._document = document;
            this._textareaElement = this._elementRef.nativeElement;
            this._measuringClass = _platform.FIREFOX ?
                'cdk-textarea-autosize-measuring-firefox' :
                'cdk-textarea-autosize-measuring';
        }
        Object.defineProperty(CdkTextareaAutosize.prototype, "minRows", {
            /** Minimum amount of rows in the textarea. */
            get: function () { return this._minRows; },
            set: function (value) {
                this._minRows = coercion.coerceNumberProperty(value);
                this._setMinHeight();
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(CdkTextareaAutosize.prototype, "maxRows", {
            /** Maximum amount of rows in the textarea. */
            get: function () { return this._maxRows; },
            set: function (value) {
                this._maxRows = coercion.coerceNumberProperty(value);
                this._setMaxHeight();
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(CdkTextareaAutosize.prototype, "enabled", {
            /** Whether autosizing is enabled or not */
            get: function () { return this._enabled; },
            set: function (value) {
                value = coercion.coerceBooleanProperty(value);
                // Only act if the actual value changed. This specifically helps to not run
                // resizeToFitContent too early (i.e. before ngAfterViewInit)
                if (this._enabled !== value) {
                    (this._enabled = value) ? this.resizeToFitContent(true) : this.reset();
                }
            },
            enumerable: false,
            configurable: true
        });
        /** Sets the minimum height of the textarea as determined by minRows. */
        CdkTextareaAutosize.prototype._setMinHeight = function () {
            var minHeight = this.minRows && this._cachedLineHeight ?
                this.minRows * this._cachedLineHeight + "px" : null;
            if (minHeight) {
                this._textareaElement.style.minHeight = minHeight;
            }
        };
        /** Sets the maximum height of the textarea as determined by maxRows. */
        CdkTextareaAutosize.prototype._setMaxHeight = function () {
            var maxHeight = this.maxRows && this._cachedLineHeight ?
                this.maxRows * this._cachedLineHeight + "px" : null;
            if (maxHeight) {
                this._textareaElement.style.maxHeight = maxHeight;
            }
        };
        CdkTextareaAutosize.prototype.ngAfterViewInit = function () {
            var _this = this;
            if (this._platform.isBrowser) {
                // Remember the height which we started with in case autosizing is disabled
                this._initialHeight = this._textareaElement.style.height;
                this.resizeToFitContent();
                this._ngZone.runOutsideAngular(function () {
                    var window = _this._getWindow();
                    rxjs.fromEvent(window, 'resize')
                        .pipe(operators.auditTime(16), operators.takeUntil(_this._destroyed))
                        .subscribe(function () { return _this.resizeToFitContent(true); });
                });
            }
        };
        CdkTextareaAutosize.prototype.ngOnDestroy = function () {
            this._destroyed.next();
            this._destroyed.complete();
        };
        /**
         * Cache the height of a single-row textarea if it has not already been cached.
         *
         * We need to know how large a single "row" of a textarea is in order to apply minRows and
         * maxRows. For the initial version, we will assume that the height of a single line in the
         * textarea does not ever change.
         */
        CdkTextareaAutosize.prototype._cacheTextareaLineHeight = function () {
            if (this._cachedLineHeight) {
                return;
            }
            // Use a clone element because we have to override some styles.
            var textareaClone = this._textareaElement.cloneNode(false);
            textareaClone.rows = 1;
            // Use `position: absolute` so that this doesn't cause a browser layout and use
            // `visibility: hidden` so that nothing is rendered. Clear any other styles that
            // would affect the height.
            textareaClone.style.position = 'absolute';
            textareaClone.style.visibility = 'hidden';
            textareaClone.style.border = 'none';
            textareaClone.style.padding = '0';
            textareaClone.style.height = '';
            textareaClone.style.minHeight = '';
            textareaClone.style.maxHeight = '';
            // In Firefox it happens that textarea elements are always bigger than the specified amount
            // of rows. This is because Firefox tries to add extra space for the horizontal scrollbar.
            // As a workaround that removes the extra space for the scrollbar, we can just set overflow
            // to hidden. This ensures that there is no invalid calculation of the line height.
            // See Firefox bug report: https://bugzilla.mozilla.org/show_bug.cgi?id=33654
            textareaClone.style.overflow = 'hidden';
            this._textareaElement.parentNode.appendChild(textareaClone);
            this._cachedLineHeight = textareaClone.clientHeight;
            this._textareaElement.parentNode.removeChild(textareaClone);
            // Min and max heights have to be re-calculated if the cached line height changes
            this._setMinHeight();
            this._setMaxHeight();
        };
        CdkTextareaAutosize.prototype.ngDoCheck = function () {
            if (this._platform.isBrowser) {
                this.resizeToFitContent();
            }
        };
        /**
         * Resize the textarea to fit its content.
         * @param force Whether to force a height recalculation. By default the height will be
         *    recalculated only if the value changed since the last call.
         */
        CdkTextareaAutosize.prototype.resizeToFitContent = function (force) {
            var _this = this;
            if (force === void 0) { force = false; }
            // If autosizing is disabled, just skip everything else
            if (!this._enabled) {
                return;
            }
            this._cacheTextareaLineHeight();
            // If we haven't determined the line-height yet, we know we're still hidden and there's no point
            // in checking the height of the textarea.
            if (!this._cachedLineHeight) {
                return;
            }
            var textarea = this._elementRef.nativeElement;
            var value = textarea.value;
            // Only resize if the value or minRows have changed since these calculations can be expensive.
            if (!force && this._minRows === this._previousMinRows && value === this._previousValue) {
                return;
            }
            var placeholderText = textarea.placeholder;
            // Reset the textarea height to auto in order to shrink back to its default size.
            // Also temporarily force overflow:hidden, so scroll bars do not interfere with calculations.
            // Long placeholders that are wider than the textarea width may lead to a bigger scrollHeight
            // value. To ensure that the scrollHeight is not bigger than the content, the placeholders
            // need to be removed temporarily.
            textarea.classList.add(this._measuringClass);
            textarea.placeholder = '';
            // The measuring class includes a 2px padding to workaround an issue with Chrome,
            // so we account for that extra space here by subtracting 4 (2px top + 2px bottom).
            var height = textarea.scrollHeight - 4;
            // Use the scrollHeight to know how large the textarea *would* be if fit its entire value.
            textarea.style.height = height + "px";
            textarea.classList.remove(this._measuringClass);
            textarea.placeholder = placeholderText;
            this._ngZone.runOutsideAngular(function () {
                if (typeof requestAnimationFrame !== 'undefined') {
                    requestAnimationFrame(function () { return _this._scrollToCaretPosition(textarea); });
                }
                else {
                    setTimeout(function () { return _this._scrollToCaretPosition(textarea); });
                }
            });
            this._previousValue = value;
            this._previousMinRows = this._minRows;
        };
        /**
         * Resets the textarea to its original size
         */
        CdkTextareaAutosize.prototype.reset = function () {
            // Do not try to change the textarea, if the initialHeight has not been determined yet
            // This might potentially remove styles when reset() is called before ngAfterViewInit
            if (this._initialHeight !== undefined) {
                this._textareaElement.style.height = this._initialHeight;
            }
        };
        // In Ivy the `host` metadata will be merged, whereas in ViewEngine it is overridden. In order
        // to avoid double event listeners, we need to use `HostListener`. Once Ivy is the default, we
        // can move this back into `host`.
        // tslint:disable:no-host-decorator-in-concrete
        CdkTextareaAutosize.prototype._noopInputHandler = function () {
            // no-op handler that ensures we're running change detection on input events.
        };
        /** Access injected document if available or fallback to global document reference */
        CdkTextareaAutosize.prototype._getDocument = function () {
            return this._document || document;
        };
        /** Use defaultView of injected document if available or fallback to global window reference */
        CdkTextareaAutosize.prototype._getWindow = function () {
            var doc = this._getDocument();
            return doc.defaultView || window;
        };
        /**
         * Scrolls a textarea to the caret position. On Firefox resizing the textarea will
         * prevent it from scrolling to the caret position. We need to re-set the selection
         * in order for it to scroll to the proper position.
         */
        CdkTextareaAutosize.prototype._scrollToCaretPosition = function (textarea) {
            var selectionStart = textarea.selectionStart, selectionEnd = textarea.selectionEnd;
            var document = this._getDocument();
            // IE will throw an "Unspecified error" if we try to set the selection range after the
            // element has been removed from the DOM. Assert that the directive hasn't been destroyed
            // between the time we requested the animation frame and when it was executed.
            // Also note that we have to assert that the textarea is focused before we set the
            // selection range. Setting the selection range on a non-focused textarea will cause
            // it to receive focus on IE and Edge.
            if (!this._destroyed.isStopped && document.activeElement === textarea) {
                textarea.setSelectionRange(selectionStart, selectionEnd);
            }
        };
        __decorate([
            i0.Input('cdkAutosizeMinRows'),
            __metadata("design:type", Number),
            __metadata("design:paramtypes", [Number])
        ], CdkTextareaAutosize.prototype, "minRows", null);
        __decorate([
            i0.Input('cdkAutosizeMaxRows'),
            __metadata("design:type", Number),
            __metadata("design:paramtypes", [Number])
        ], CdkTextareaAutosize.prototype, "maxRows", null);
        __decorate([
            i0.Input('cdkTextareaAutosize'),
            __metadata("design:type", Boolean),
            __metadata("design:paramtypes", [Boolean])
        ], CdkTextareaAutosize.prototype, "enabled", null);
        __decorate([
            i0.HostListener('input'),
            __metadata("design:type", Function),
            __metadata("design:paramtypes", []),
            __metadata("design:returntype", void 0)
        ], CdkTextareaAutosize.prototype, "_noopInputHandler", null);
        CdkTextareaAutosize = __decorate([
            i0.Directive({
                selector: 'textarea[cdkTextareaAutosize]',
                exportAs: 'cdkTextareaAutosize',
                host: {
                    'class': 'cdk-textarea-autosize',
                    // Textarea elements that have the directive applied should have a single row by default.
                    // Browsers normally show two rows by default and therefore this limits the minRows binding.
                    'rows': '1',
                },
            }),
            __param(3, i0.Optional()), __param(3, i0.Inject(common.DOCUMENT)),
            __metadata("design:paramtypes", [i0.ElementRef,
                i1.Platform,
                i0.NgZone, Object])
        ], CdkTextareaAutosize);
        return CdkTextareaAutosize;
    }());

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var TextFieldModule = /** @class */ (function () {
        function TextFieldModule() {
        }
        TextFieldModule = __decorate([
            i0.NgModule({
                declarations: [CdkAutofill, CdkTextareaAutosize],
                imports: [i1.PlatformModule],
                exports: [CdkAutofill, CdkTextareaAutosize],
            })
        ], TextFieldModule);
        return TextFieldModule;
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

    exports.AutofillMonitor = AutofillMonitor;
    exports.CdkAutofill = CdkAutofill;
    exports.CdkTextareaAutosize = CdkTextareaAutosize;
    exports.TextFieldModule = TextFieldModule;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=cdk-text-field.umd.js.map
