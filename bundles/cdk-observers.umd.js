(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/cdk/coercion'), require('@angular/core'), require('rxjs'), require('rxjs/operators')) :
    typeof define === 'function' && define.amd ? define('@angular/cdk/observers', ['exports', '@angular/cdk/coercion', '@angular/core', 'rxjs', 'rxjs/operators'], factory) :
    (global = global || self, factory((global.ng = global.ng || {}, global.ng.cdk = global.ng.cdk || {}, global.ng.cdk.observers = {}), global.ng.cdk.coercion, global.ng.core, global.rxjs, global.rxjs.operators));
}(this, (function (exports, coercion, i0, rxjs, operators) { 'use strict';

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
     * Factory that creates a new MutationObserver and allows us to stub it out in unit tests.
     * @docs-private
     */
    var MutationObserverFactory = /** @class */ (function () {
        function MutationObserverFactory() {
        }
        MutationObserverFactory.prototype.create = function (callback) {
            return typeof MutationObserver === 'undefined' ? null : new MutationObserver(callback);
        };
        MutationObserverFactory.ɵprov = i0.ɵɵdefineInjectable({ factory: function MutationObserverFactory_Factory() { return new MutationObserverFactory(); }, token: MutationObserverFactory, providedIn: "root" });
        MutationObserverFactory = __decorate([
            i0.Injectable({ providedIn: 'root' })
        ], MutationObserverFactory);
        return MutationObserverFactory;
    }());
    /** An injectable service that allows watching elements for changes to their content. */
    var ContentObserver = /** @class */ (function () {
        function ContentObserver(_mutationObserverFactory) {
            this._mutationObserverFactory = _mutationObserverFactory;
            /** Keeps track of the existing MutationObservers so they can be reused. */
            this._observedElements = new Map();
        }
        ContentObserver.prototype.ngOnDestroy = function () {
            var _this = this;
            this._observedElements.forEach(function (_, element) { return _this._cleanupObserver(element); });
        };
        ContentObserver.prototype.observe = function (elementOrRef) {
            var _this = this;
            var element = coercion.coerceElement(elementOrRef);
            return new rxjs.Observable(function (observer) {
                var stream = _this._observeElement(element);
                var subscription = stream.subscribe(observer);
                return function () {
                    subscription.unsubscribe();
                    _this._unobserveElement(element);
                };
            });
        };
        /**
         * Observes the given element by using the existing MutationObserver if available, or creating a
         * new one if not.
         */
        ContentObserver.prototype._observeElement = function (element) {
            if (!this._observedElements.has(element)) {
                var stream_1 = new rxjs.Subject();
                var observer = this._mutationObserverFactory.create(function (mutations) { return stream_1.next(mutations); });
                if (observer) {
                    observer.observe(element, {
                        characterData: true,
                        childList: true,
                        subtree: true
                    });
                }
                this._observedElements.set(element, { observer: observer, stream: stream_1, count: 1 });
            }
            else {
                this._observedElements.get(element).count++;
            }
            return this._observedElements.get(element).stream;
        };
        /**
         * Un-observes the given element and cleans up the underlying MutationObserver if nobody else is
         * observing this element.
         */
        ContentObserver.prototype._unobserveElement = function (element) {
            if (this._observedElements.has(element)) {
                this._observedElements.get(element).count--;
                if (!this._observedElements.get(element).count) {
                    this._cleanupObserver(element);
                }
            }
        };
        /** Clean up the underlying MutationObserver for the specified element. */
        ContentObserver.prototype._cleanupObserver = function (element) {
            if (this._observedElements.has(element)) {
                var _a = this._observedElements.get(element), observer = _a.observer, stream = _a.stream;
                if (observer) {
                    observer.disconnect();
                }
                stream.complete();
                this._observedElements.delete(element);
            }
        };
        ContentObserver.ɵprov = i0.ɵɵdefineInjectable({ factory: function ContentObserver_Factory() { return new ContentObserver(i0.ɵɵinject(MutationObserverFactory)); }, token: ContentObserver, providedIn: "root" });
        ContentObserver = __decorate([
            i0.Injectable({ providedIn: 'root' }),
            __metadata("design:paramtypes", [MutationObserverFactory])
        ], ContentObserver);
        return ContentObserver;
    }());
    /**
     * Directive that triggers a callback whenever the content of
     * its associated element has changed.
     */
    var CdkObserveContent = /** @class */ (function () {
        function CdkObserveContent(_contentObserver, _elementRef, _ngZone) {
            this._contentObserver = _contentObserver;
            this._elementRef = _elementRef;
            this._ngZone = _ngZone;
            /** Event emitted for each change in the element's content. */
            this.event = new i0.EventEmitter();
            this._disabled = false;
            this._currentSubscription = null;
        }
        Object.defineProperty(CdkObserveContent.prototype, "disabled", {
            /**
             * Whether observing content is disabled. This option can be used
             * to disconnect the underlying MutationObserver until it is needed.
             */
            get: function () { return this._disabled; },
            set: function (value) {
                this._disabled = coercion.coerceBooleanProperty(value);
                this._disabled ? this._unsubscribe() : this._subscribe();
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(CdkObserveContent.prototype, "debounce", {
            /** Debounce interval for emitting the changes. */
            get: function () { return this._debounce; },
            set: function (value) {
                this._debounce = coercion.coerceNumberProperty(value);
                this._subscribe();
            },
            enumerable: false,
            configurable: true
        });
        CdkObserveContent.prototype.ngAfterContentInit = function () {
            if (!this._currentSubscription && !this.disabled) {
                this._subscribe();
            }
        };
        CdkObserveContent.prototype.ngOnDestroy = function () {
            this._unsubscribe();
        };
        CdkObserveContent.prototype._subscribe = function () {
            var _this = this;
            this._unsubscribe();
            var stream = this._contentObserver.observe(this._elementRef);
            // TODO(mmalerba): We shouldn't be emitting on this @Output() outside the zone.
            // Consider brining it back inside the zone next time we're making breaking changes.
            // Bringing it back inside can cause things like infinite change detection loops and changed
            // after checked errors if people's code isn't handling it properly.
            this._ngZone.runOutsideAngular(function () {
                _this._currentSubscription =
                    (_this.debounce ? stream.pipe(operators.debounceTime(_this.debounce)) : stream).subscribe(_this.event);
            });
        };
        CdkObserveContent.prototype._unsubscribe = function () {
            if (this._currentSubscription) {
                this._currentSubscription.unsubscribe();
            }
        };
        __decorate([
            i0.Output('cdkObserveContent'),
            __metadata("design:type", Object)
        ], CdkObserveContent.prototype, "event", void 0);
        __decorate([
            i0.Input('cdkObserveContentDisabled'),
            __metadata("design:type", Object),
            __metadata("design:paramtypes", [Object])
        ], CdkObserveContent.prototype, "disabled", null);
        __decorate([
            i0.Input(),
            __metadata("design:type", Number),
            __metadata("design:paramtypes", [Number])
        ], CdkObserveContent.prototype, "debounce", null);
        CdkObserveContent = __decorate([
            i0.Directive({
                selector: '[cdkObserveContent]',
                exportAs: 'cdkObserveContent',
            }),
            __metadata("design:paramtypes", [ContentObserver,
                i0.ElementRef,
                i0.NgZone])
        ], CdkObserveContent);
        return CdkObserveContent;
    }());
    var ObserversModule = /** @class */ (function () {
        function ObserversModule() {
        }
        ObserversModule = __decorate([
            i0.NgModule({
                exports: [CdkObserveContent],
                declarations: [CdkObserveContent],
                providers: [MutationObserverFactory]
            })
        ], ObserversModule);
        return ObserversModule;
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

    exports.CdkObserveContent = CdkObserveContent;
    exports.ContentObserver = ContentObserver;
    exports.MutationObserverFactory = MutationObserverFactory;
    exports.ObserversModule = ObserversModule;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=cdk-observers.umd.js.map
