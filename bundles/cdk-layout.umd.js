(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core'), require('@angular/cdk/platform'), require('rxjs'), require('rxjs/operators'), require('@angular/cdk/coercion')) :
    typeof define === 'function' && define.amd ? define('@angular/cdk/layout', ['exports', '@angular/core', '@angular/cdk/platform', 'rxjs', 'rxjs/operators', '@angular/cdk/coercion'], factory) :
    (global = global || self, factory((global.ng = global.ng || {}, global.ng.cdk = global.ng.cdk || {}, global.ng.cdk.layout = {}), global.ng.core, global.ng.cdk.platform, global.rxjs, global.rxjs.operators, global.ng.cdk.coercion));
}(this, (function (exports, i0, i1, rxjs, operators, coercion) { 'use strict';

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

    var LayoutModule = /** @class */ (function () {
        function LayoutModule() {
        }
        LayoutModule = __decorate([
            i0.NgModule({})
        ], LayoutModule);
        return LayoutModule;
    }());

    /** Global registry for all dynamically-created, injected media queries. */
    var mediaQueriesForWebkitCompatibility = new Set();
    /** Style tag that holds all of the dynamically-created media queries. */
    var mediaQueryStyleNode;
    /** A utility for calling matchMedia queries. */
    var MediaMatcher = /** @class */ (function () {
        function MediaMatcher(_platform) {
            this._platform = _platform;
            this._matchMedia = this._platform.isBrowser && window.matchMedia ?
                // matchMedia is bound to the window scope intentionally as it is an illegal invocation to
                // call it from a different scope.
                window.matchMedia.bind(window) :
                noopMatchMedia;
        }
        /**
         * Evaluates the given media query and returns the native MediaQueryList from which results
         * can be retrieved.
         * Confirms the layout engine will trigger for the selector query provided and returns the
         * MediaQueryList for the query provided.
         */
        MediaMatcher.prototype.matchMedia = function (query) {
            if (this._platform.WEBKIT) {
                createEmptyStyleRule(query);
            }
            return this._matchMedia(query);
        };
        MediaMatcher.ɵprov = i0.ɵɵdefineInjectable({ factory: function MediaMatcher_Factory() { return new MediaMatcher(i0.ɵɵinject(i1.Platform)); }, token: MediaMatcher, providedIn: "root" });
        MediaMatcher = __decorate([
            i0.Injectable({ providedIn: 'root' }),
            __metadata("design:paramtypes", [i1.Platform])
        ], MediaMatcher);
        return MediaMatcher;
    }());
    /**
     * For Webkit engines that only trigger the MediaQueryListListener when
     * there is at least one CSS selector for the respective media query.
     */
    function createEmptyStyleRule(query) {
        if (mediaQueriesForWebkitCompatibility.has(query)) {
            return;
        }
        try {
            if (!mediaQueryStyleNode) {
                mediaQueryStyleNode = document.createElement('style');
                mediaQueryStyleNode.setAttribute('type', 'text/css');
                document.head.appendChild(mediaQueryStyleNode);
            }
            if (mediaQueryStyleNode.sheet) {
                mediaQueryStyleNode.sheet
                    .insertRule("@media " + query + " {.fx-query-test{ }}", 0);
                mediaQueriesForWebkitCompatibility.add(query);
            }
        }
        catch (e) {
            console.error(e);
        }
    }
    /** No-op matchMedia replacement for non-browser platforms. */
    function noopMatchMedia(query) {
        // Use `as any` here to avoid adding additional necessary properties for
        // the noop matcher.
        return {
            matches: query === 'all' || query === '',
            media: query,
            addListener: function () { },
            removeListener: function () { }
        };
    }

    /** Utility for checking the matching state of @media queries. */
    var BreakpointObserver = /** @class */ (function () {
        function BreakpointObserver(_mediaMatcher, _zone) {
            this._mediaMatcher = _mediaMatcher;
            this._zone = _zone;
            /**  A map of all media queries currently being listened for. */
            this._queries = new Map();
            /** A subject for all other observables to takeUntil based on. */
            this._destroySubject = new rxjs.Subject();
        }
        /** Completes the active subject, signalling to all other observables to complete. */
        BreakpointObserver.prototype.ngOnDestroy = function () {
            this._destroySubject.next();
            this._destroySubject.complete();
        };
        /**
         * Whether one or more media queries match the current viewport size.
         * @param value One or more media queries to check.
         * @returns Whether any of the media queries match.
         */
        BreakpointObserver.prototype.isMatched = function (value) {
            var _this = this;
            var queries = splitQueries(coercion.coerceArray(value));
            return queries.some(function (mediaQuery) { return _this._registerQuery(mediaQuery).mql.matches; });
        };
        /**
         * Gets an observable of results for the given queries that will emit new results for any changes
         * in matching of the given queries.
         * @param value One or more media queries to check.
         * @returns A stream of matches for the given queries.
         */
        BreakpointObserver.prototype.observe = function (value) {
            var _this = this;
            var queries = splitQueries(coercion.coerceArray(value));
            var observables = queries.map(function (query) { return _this._registerQuery(query).observable; });
            var stateObservable = rxjs.combineLatest(observables);
            // Emit the first state immediately, and then debounce the subsequent emissions.
            stateObservable = rxjs.concat(stateObservable.pipe(operators.take(1)), stateObservable.pipe(operators.skip(1), operators.debounceTime(0)));
            return stateObservable.pipe(operators.map(function (breakpointStates) {
                var response = {
                    matches: false,
                    breakpoints: {},
                };
                breakpointStates.forEach(function (state) {
                    response.matches = response.matches || state.matches;
                    response.breakpoints[state.query] = state.matches;
                });
                return response;
            }));
        };
        /** Registers a specific query to be listened for. */
        BreakpointObserver.prototype._registerQuery = function (query) {
            var _this = this;
            // Only set up a new MediaQueryList if it is not already being listened for.
            if (this._queries.has(query)) {
                return this._queries.get(query);
            }
            var mql = this._mediaMatcher.matchMedia(query);
            // Create callback for match changes and add it is as a listener.
            var queryObservable = new rxjs.Observable(function (observer) {
                // Listener callback methods are wrapped to be placed back in ngZone. Callbacks must be placed
                // back into the zone because matchMedia is only included in Zone.js by loading the
                // webapis-media-query.js file alongside the zone.js file.  Additionally, some browsers do not
                // have MediaQueryList inherit from EventTarget, which causes inconsistencies in how Zone.js
                // patches it.
                var handler = function (e) { return _this._zone.run(function () { return observer.next(e); }); };
                mql.addListener(handler);
                return function () {
                    mql.removeListener(handler);
                };
            }).pipe(operators.startWith(mql), operators.map(function (nextMql) { return ({ query: query, matches: nextMql.matches }); }), operators.takeUntil(this._destroySubject));
            // Add the MediaQueryList to the set of queries.
            var output = { observable: queryObservable, mql: mql };
            this._queries.set(query, output);
            return output;
        };
        BreakpointObserver.ɵprov = i0.ɵɵdefineInjectable({ factory: function BreakpointObserver_Factory() { return new BreakpointObserver(i0.ɵɵinject(MediaMatcher), i0.ɵɵinject(i0.NgZone)); }, token: BreakpointObserver, providedIn: "root" });
        BreakpointObserver = __decorate([
            i0.Injectable({ providedIn: 'root' }),
            __metadata("design:paramtypes", [MediaMatcher, i0.NgZone])
        ], BreakpointObserver);
        return BreakpointObserver;
    }());
    /**
     * Split each query string into separate query strings if two queries are provided as comma
     * separated.
     */
    function splitQueries(queries) {
        return queries.map(function (query) { return query.split(','); })
            .reduce(function (a1, a2) { return a1.concat(a2); })
            .map(function (query) { return query.trim(); });
    }

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    // PascalCase is being used as Breakpoints is used like an enum.
    // tslint:disable-next-line:variable-name
    var Breakpoints = {
        XSmall: '(max-width: 599.99px)',
        Small: '(min-width: 600px) and (max-width: 959.99px)',
        Medium: '(min-width: 960px) and (max-width: 1279.99px)',
        Large: '(min-width: 1280px) and (max-width: 1919.99px)',
        XLarge: '(min-width: 1920px)',
        Handset: '(max-width: 599.99px) and (orientation: portrait), ' +
            '(max-width: 959.99px) and (orientation: landscape)',
        Tablet: '(min-width: 600px) and (max-width: 839.99px) and (orientation: portrait), ' +
            '(min-width: 960px) and (max-width: 1279.99px) and (orientation: landscape)',
        Web: '(min-width: 840px) and (orientation: portrait), ' +
            '(min-width: 1280px) and (orientation: landscape)',
        HandsetPortrait: '(max-width: 599.99px) and (orientation: portrait)',
        TabletPortrait: '(min-width: 600px) and (max-width: 839.99px) and (orientation: portrait)',
        WebPortrait: '(min-width: 840px) and (orientation: portrait)',
        HandsetLandscape: '(max-width: 959.99px) and (orientation: landscape)',
        TabletLandscape: '(min-width: 960px) and (max-width: 1279.99px) and (orientation: landscape)',
        WebLandscape: '(min-width: 1280px) and (orientation: landscape)',
    };

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

    exports.BreakpointObserver = BreakpointObserver;
    exports.Breakpoints = Breakpoints;
    exports.LayoutModule = LayoutModule;
    exports.MediaMatcher = MediaMatcher;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=cdk-layout.umd.js.map
