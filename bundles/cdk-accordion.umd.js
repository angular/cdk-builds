(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core'), require('@angular/cdk/collections'), require('@angular/cdk/coercion'), require('rxjs')) :
    typeof define === 'function' && define.amd ? define('@angular/cdk/accordion', ['exports', '@angular/core', '@angular/cdk/collections', '@angular/cdk/coercion', 'rxjs'], factory) :
    (global = global || self, factory((global.ng = global.ng || {}, global.ng.cdk = global.ng.cdk || {}, global.ng.cdk.accordion = {}), global.ng.core, global.ng.cdk.collections, global.ng.cdk.coercion, global.rxjs));
}(this, (function (exports, core, collections, coercion, rxjs) { 'use strict';

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
    /** Used to generate unique ID for each accordion. */
    var nextId = 0;
    /**
     * Directive whose purpose is to manage the expanded state of CdkAccordionItem children.
     */
    var CdkAccordion = /** @class */ (function () {
        function CdkAccordion() {
            /** Emits when the state of the accordion changes */
            this._stateChanges = new rxjs.Subject();
            /** Stream that emits true/false when openAll/closeAll is triggered. */
            this._openCloseAllActions = new rxjs.Subject();
            /** A readonly id value to use for unique selection coordination. */
            this.id = "cdk-accordion-" + nextId++;
            this._multi = false;
        }
        Object.defineProperty(CdkAccordion.prototype, "multi", {
            /** Whether the accordion should allow multiple expanded accordion items simultaneously. */
            get: function () { return this._multi; },
            set: function (multi) { this._multi = coercion.coerceBooleanProperty(multi); },
            enumerable: false,
            configurable: true
        });
        /** Opens all enabled accordion items in an accordion where multi is enabled. */
        CdkAccordion.prototype.openAll = function () {
            this._openCloseAll(true);
        };
        /** Closes all enabled accordion items in an accordion where multi is enabled. */
        CdkAccordion.prototype.closeAll = function () {
            this._openCloseAll(false);
        };
        CdkAccordion.prototype.ngOnChanges = function (changes) {
            this._stateChanges.next(changes);
        };
        CdkAccordion.prototype.ngOnDestroy = function () {
            this._stateChanges.complete();
        };
        CdkAccordion.prototype._openCloseAll = function (expanded) {
            if (this.multi) {
                this._openCloseAllActions.next(expanded);
            }
        };
        __decorate([
            core.Input(),
            __metadata("design:type", Boolean),
            __metadata("design:paramtypes", [Boolean])
        ], CdkAccordion.prototype, "multi", null);
        CdkAccordion = __decorate([
            core.Directive({
                selector: 'cdk-accordion, [cdkAccordion]',
                exportAs: 'cdkAccordion',
            })
        ], CdkAccordion);
        return CdkAccordion;
    }());

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /** Used to generate unique ID for each accordion item. */
    var nextId$1 = 0;
    var ɵ0 = undefined;
    /**
     * An basic directive expected to be extended and decorated as a component.  Sets up all
     * events and attributes needed to be managed by a CdkAccordion parent.
     */
    var CdkAccordionItem = /** @class */ (function () {
        function CdkAccordionItem(accordion, _changeDetectorRef, _expansionDispatcher) {
            var _this = this;
            this.accordion = accordion;
            this._changeDetectorRef = _changeDetectorRef;
            this._expansionDispatcher = _expansionDispatcher;
            /** Subscription to openAll/closeAll events. */
            this._openCloseAllSubscription = rxjs.Subscription.EMPTY;
            /** Event emitted every time the AccordionItem is closed. */
            this.closed = new core.EventEmitter();
            /** Event emitted every time the AccordionItem is opened. */
            this.opened = new core.EventEmitter();
            /** Event emitted when the AccordionItem is destroyed. */
            this.destroyed = new core.EventEmitter();
            /**
             * Emits whenever the expanded state of the accordion changes.
             * Primarily used to facilitate two-way binding.
             * @docs-private
             */
            this.expandedChange = new core.EventEmitter();
            /** The unique AccordionItem id. */
            this.id = "cdk-accordion-child-" + nextId$1++;
            this._expanded = false;
            this._disabled = false;
            /** Unregister function for _expansionDispatcher. */
            this._removeUniqueSelectionListener = function () { };
            this._removeUniqueSelectionListener =
                _expansionDispatcher.listen(function (id, accordionId) {
                    if (_this.accordion && !_this.accordion.multi &&
                        _this.accordion.id === accordionId && _this.id !== id) {
                        _this.expanded = false;
                    }
                });
            // When an accordion item is hosted in an accordion, subscribe to open/close events.
            if (this.accordion) {
                this._openCloseAllSubscription = this._subscribeToOpenCloseAllActions();
            }
        }
        Object.defineProperty(CdkAccordionItem.prototype, "expanded", {
            /** Whether the AccordionItem is expanded. */
            get: function () { return this._expanded; },
            set: function (expanded) {
                expanded = coercion.coerceBooleanProperty(expanded);
                // Only emit events and update the internal value if the value changes.
                if (this._expanded !== expanded) {
                    this._expanded = expanded;
                    this.expandedChange.emit(expanded);
                    if (expanded) {
                        this.opened.emit();
                        /**
                         * In the unique selection dispatcher, the id parameter is the id of the CdkAccordionItem,
                         * the name value is the id of the accordion.
                         */
                        var accordionId = this.accordion ? this.accordion.id : this.id;
                        this._expansionDispatcher.notify(this.id, accordionId);
                    }
                    else {
                        this.closed.emit();
                    }
                    // Ensures that the animation will run when the value is set outside of an `@Input`.
                    // This includes cases like the open, close and toggle methods.
                    this._changeDetectorRef.markForCheck();
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(CdkAccordionItem.prototype, "disabled", {
            /** Whether the AccordionItem is disabled. */
            get: function () { return this._disabled; },
            set: function (disabled) { this._disabled = coercion.coerceBooleanProperty(disabled); },
            enumerable: false,
            configurable: true
        });
        /** Emits an event for the accordion item being destroyed. */
        CdkAccordionItem.prototype.ngOnDestroy = function () {
            this.opened.complete();
            this.closed.complete();
            this.destroyed.emit();
            this.destroyed.complete();
            this._removeUniqueSelectionListener();
            this._openCloseAllSubscription.unsubscribe();
        };
        /** Toggles the expanded state of the accordion item. */
        CdkAccordionItem.prototype.toggle = function () {
            if (!this.disabled) {
                this.expanded = !this.expanded;
            }
        };
        /** Sets the expanded state of the accordion item to false. */
        CdkAccordionItem.prototype.close = function () {
            if (!this.disabled) {
                this.expanded = false;
            }
        };
        /** Sets the expanded state of the accordion item to true. */
        CdkAccordionItem.prototype.open = function () {
            if (!this.disabled) {
                this.expanded = true;
            }
        };
        CdkAccordionItem.prototype._subscribeToOpenCloseAllActions = function () {
            var _this = this;
            return this.accordion._openCloseAllActions.subscribe(function (expanded) {
                // Only change expanded state if item is enabled
                if (!_this.disabled) {
                    _this.expanded = expanded;
                }
            });
        };
        __decorate([
            core.Output(),
            __metadata("design:type", core.EventEmitter)
        ], CdkAccordionItem.prototype, "closed", void 0);
        __decorate([
            core.Output(),
            __metadata("design:type", core.EventEmitter)
        ], CdkAccordionItem.prototype, "opened", void 0);
        __decorate([
            core.Output(),
            __metadata("design:type", core.EventEmitter)
        ], CdkAccordionItem.prototype, "destroyed", void 0);
        __decorate([
            core.Output(),
            __metadata("design:type", core.EventEmitter)
        ], CdkAccordionItem.prototype, "expandedChange", void 0);
        __decorate([
            core.Input(),
            __metadata("design:type", Object),
            __metadata("design:paramtypes", [Object])
        ], CdkAccordionItem.prototype, "expanded", null);
        __decorate([
            core.Input(),
            __metadata("design:type", Object),
            __metadata("design:paramtypes", [Object])
        ], CdkAccordionItem.prototype, "disabled", null);
        CdkAccordionItem = __decorate([
            core.Directive({
                selector: 'cdk-accordion-item, [cdkAccordionItem]',
                exportAs: 'cdkAccordionItem',
                providers: [
                    // Provide CdkAccordion as undefined to prevent nested accordion items from registering
                    // to the same accordion.
                    { provide: CdkAccordion, useValue: ɵ0 },
                ],
            }),
            __param(0, core.Optional()), __param(0, core.SkipSelf()),
            __metadata("design:paramtypes", [CdkAccordion,
                core.ChangeDetectorRef,
                collections.UniqueSelectionDispatcher])
        ], CdkAccordionItem);
        return CdkAccordionItem;
    }());

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var CdkAccordionModule = /** @class */ (function () {
        function CdkAccordionModule() {
        }
        CdkAccordionModule = __decorate([
            core.NgModule({
                exports: [CdkAccordion, CdkAccordionItem],
                declarations: [CdkAccordion, CdkAccordionItem],
            })
        ], CdkAccordionModule);
        return CdkAccordionModule;
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

    exports.CdkAccordion = CdkAccordion;
    exports.CdkAccordionItem = CdkAccordionItem;
    exports.CdkAccordionModule = CdkAccordionModule;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=cdk-accordion.umd.js.map
