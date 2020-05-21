(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/cdk/a11y'), require('@angular/cdk/bidi'), require('@angular/cdk/coercion'), require('@angular/cdk/keycodes'), require('@angular/common'), require('@angular/core'), require('rxjs'), require('rxjs/operators')) :
    typeof define === 'function' && define.amd ? define('@angular/cdk/stepper', ['exports', '@angular/cdk/a11y', '@angular/cdk/bidi', '@angular/cdk/coercion', '@angular/cdk/keycodes', '@angular/common', '@angular/core', 'rxjs', 'rxjs/operators'], factory) :
    (global = global || self, factory((global.ng = global.ng || {}, global.ng.cdk = global.ng.cdk || {}, global.ng.cdk.stepper = {}), global.ng.cdk.a11y, global.ng.cdk.bidi, global.ng.cdk.coercion, global.ng.cdk.keycodes, global.ng.common, global.ng.core, global.rxjs, global.rxjs.operators));
}(this, (function (exports, a11y, bidi, coercion, keycodes, common, core, rxjs, operators) { 'use strict';

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
    var CdkStepHeader = /** @class */ (function () {
        function CdkStepHeader(_elementRef) {
            this._elementRef = _elementRef;
        }
        /** Focuses the step header. */
        CdkStepHeader.prototype.focus = function () {
            this._elementRef.nativeElement.focus();
        };
        CdkStepHeader = __decorate([
            core.Directive({
                selector: '[cdkStepHeader]',
                host: {
                    'role': 'tab',
                },
            }),
            __metadata("design:paramtypes", [core.ElementRef])
        ], CdkStepHeader);
        return CdkStepHeader;
    }());

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var CdkStepLabel = /** @class */ (function () {
        function CdkStepLabel(/** @docs-private */ template) {
            this.template = template;
        }
        CdkStepLabel = __decorate([
            core.Directive({
                selector: '[cdkStepLabel]',
            }),
            __metadata("design:paramtypes", [core.TemplateRef])
        ], CdkStepLabel);
        return CdkStepLabel;
    }());

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /** Used to generate unique ID for each stepper component. */
    var nextId = 0;
    /** Change event emitted on selection changes. */
    var StepperSelectionEvent = /** @class */ (function () {
        function StepperSelectionEvent() {
        }
        return StepperSelectionEvent;
    }());
    /** Enum to represent the different states of the steps. */
    var STEP_STATE = {
        NUMBER: 'number',
        EDIT: 'edit',
        DONE: 'done',
        ERROR: 'error'
    };
    /** InjectionToken that can be used to specify the global stepper options. */
    var STEPPER_GLOBAL_OPTIONS = new core.InjectionToken('STEPPER_GLOBAL_OPTIONS');
    /**
     * InjectionToken that can be used to specify the global stepper options.
     * @deprecated Use `STEPPER_GLOBAL_OPTIONS` instead.
     * @breaking-change 8.0.0.
     */
    var MAT_STEPPER_GLOBAL_OPTIONS = STEPPER_GLOBAL_OPTIONS;
    var CdkStep = /** @class */ (function () {
        /** @breaking-change 8.0.0 remove the `?` after `stepperOptions` */
        function CdkStep(_stepper, stepperOptions) {
            this._stepper = _stepper;
            /** Whether user has seen the expanded step content or not. */
            this.interacted = false;
            this._editable = true;
            this._optional = false;
            this._completedOverride = null;
            this._customError = null;
            this._stepperOptions = stepperOptions ? stepperOptions : {};
            this._displayDefaultIndicatorType = this._stepperOptions.displayDefaultIndicatorType !== false;
            this._showError = !!this._stepperOptions.showError;
        }
        Object.defineProperty(CdkStep.prototype, "editable", {
            /** Whether the user can return to this step once it has been marked as completed. */
            get: function () {
                return this._editable;
            },
            set: function (value) {
                this._editable = coercion.coerceBooleanProperty(value);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(CdkStep.prototype, "optional", {
            /** Whether the completion of step is optional. */
            get: function () {
                return this._optional;
            },
            set: function (value) {
                this._optional = coercion.coerceBooleanProperty(value);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(CdkStep.prototype, "completed", {
            /** Whether step is marked as completed. */
            get: function () {
                return this._completedOverride == null ? this._getDefaultCompleted() : this._completedOverride;
            },
            set: function (value) {
                this._completedOverride = coercion.coerceBooleanProperty(value);
            },
            enumerable: false,
            configurable: true
        });
        CdkStep.prototype._getDefaultCompleted = function () {
            return this.stepControl ? this.stepControl.valid && this.interacted : this.interacted;
        };
        Object.defineProperty(CdkStep.prototype, "hasError", {
            /** Whether step has an error. */
            get: function () {
                return this._customError == null ? this._getDefaultError() : this._customError;
            },
            set: function (value) {
                this._customError = coercion.coerceBooleanProperty(value);
            },
            enumerable: false,
            configurable: true
        });
        CdkStep.prototype._getDefaultError = function () {
            return this.stepControl && this.stepControl.invalid && this.interacted;
        };
        /** Selects this step component. */
        CdkStep.prototype.select = function () {
            this._stepper.selected = this;
        };
        /** Resets the step to its initial state. Note that this includes resetting form data. */
        CdkStep.prototype.reset = function () {
            this.interacted = false;
            if (this._completedOverride != null) {
                this._completedOverride = false;
            }
            if (this._customError != null) {
                this._customError = false;
            }
            if (this.stepControl) {
                this.stepControl.reset();
            }
        };
        CdkStep.prototype.ngOnChanges = function () {
            // Since basically all inputs of the MatStep get proxied through the view down to the
            // underlying MatStepHeader, we have to make sure that change detection runs correctly.
            this._stepper._stateChanged();
        };
        __decorate([
            core.ContentChild(CdkStepLabel),
            __metadata("design:type", CdkStepLabel)
        ], CdkStep.prototype, "stepLabel", void 0);
        __decorate([
            core.ViewChild(core.TemplateRef, { static: true }),
            __metadata("design:type", core.TemplateRef)
        ], CdkStep.prototype, "content", void 0);
        __decorate([
            core.Input(),
            __metadata("design:type", Object)
        ], CdkStep.prototype, "stepControl", void 0);
        __decorate([
            core.Input(),
            __metadata("design:type", String)
        ], CdkStep.prototype, "label", void 0);
        __decorate([
            core.Input(),
            __metadata("design:type", String)
        ], CdkStep.prototype, "errorMessage", void 0);
        __decorate([
            core.Input('aria-label'),
            __metadata("design:type", String)
        ], CdkStep.prototype, "ariaLabel", void 0);
        __decorate([
            core.Input('aria-labelledby'),
            __metadata("design:type", String)
        ], CdkStep.prototype, "ariaLabelledby", void 0);
        __decorate([
            core.Input(),
            __metadata("design:type", String)
        ], CdkStep.prototype, "state", void 0);
        __decorate([
            core.Input(),
            __metadata("design:type", Boolean),
            __metadata("design:paramtypes", [Boolean])
        ], CdkStep.prototype, "editable", null);
        __decorate([
            core.Input(),
            __metadata("design:type", Boolean),
            __metadata("design:paramtypes", [Boolean])
        ], CdkStep.prototype, "optional", null);
        __decorate([
            core.Input(),
            __metadata("design:type", Boolean),
            __metadata("design:paramtypes", [Boolean])
        ], CdkStep.prototype, "completed", null);
        __decorate([
            core.Input(),
            __metadata("design:type", Boolean),
            __metadata("design:paramtypes", [Boolean])
        ], CdkStep.prototype, "hasError", null);
        CdkStep = __decorate([
            core.Component({
                selector: 'cdk-step',
                exportAs: 'cdkStep',
                template: '<ng-template><ng-content></ng-content></ng-template>',
                encapsulation: core.ViewEncapsulation.None,
                changeDetection: core.ChangeDetectionStrategy.OnPush
            }),
            __param(0, core.Inject(core.forwardRef(function () { return CdkStepper; }))),
            __param(1, core.Optional()), __param(1, core.Inject(STEPPER_GLOBAL_OPTIONS)),
            __metadata("design:paramtypes", [CdkStepper, Object])
        ], CdkStep);
        return CdkStep;
    }());
    var CdkStepper = /** @class */ (function () {
        function CdkStepper(_dir, _changeDetectorRef, 
        // @breaking-change 8.0.0 `_elementRef` and `_document` parameters to become required.
        _elementRef, _document) {
            this._dir = _dir;
            this._changeDetectorRef = _changeDetectorRef;
            this._elementRef = _elementRef;
            /** Emits when the component is destroyed. */
            this._destroyed = new rxjs.Subject();
            this._linear = false;
            this._selectedIndex = 0;
            /** Event emitted when the selected step has changed. */
            this.selectionChange = new core.EventEmitter();
            this._orientation = 'horizontal';
            this._groupId = nextId++;
            this._document = _document;
        }
        Object.defineProperty(CdkStepper.prototype, "steps", {
            /** The list of step components that the stepper is holding. */
            get: function () {
                return this._steps;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(CdkStepper.prototype, "linear", {
            /** Whether the validity of previous steps should be checked or not. */
            get: function () {
                return this._linear;
            },
            set: function (value) {
                this._linear = coercion.coerceBooleanProperty(value);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(CdkStepper.prototype, "selectedIndex", {
            /** The index of the selected step. */
            get: function () {
                return this._selectedIndex;
            },
            set: function (index) {
                var newIndex = coercion.coerceNumberProperty(index);
                if (this.steps) {
                    // Ensure that the index can't be out of bounds.
                    if (newIndex < 0 || newIndex > this.steps.length - 1) {
                        throw Error('cdkStepper: Cannot assign out-of-bounds value to `selectedIndex`.');
                    }
                    if (this._selectedIndex != newIndex && !this._anyControlsInvalidOrPending(newIndex) &&
                        (newIndex >= this._selectedIndex || this.steps.toArray()[newIndex].editable)) {
                        this._updateSelectedItemIndex(index);
                    }
                }
                else {
                    this._selectedIndex = newIndex;
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(CdkStepper.prototype, "selected", {
            /** The step that is selected. */
            get: function () {
                // @breaking-change 8.0.0 Change return type to `CdkStep | undefined`.
                return this.steps ? this.steps.toArray()[this.selectedIndex] : undefined;
            },
            set: function (step) {
                this.selectedIndex = this.steps ? this.steps.toArray().indexOf(step) : -1;
            },
            enumerable: false,
            configurable: true
        });
        CdkStepper.prototype.ngAfterViewInit = function () {
            var _this = this;
            // Note that while the step headers are content children by default, any components that
            // extend this one might have them as view children. We initialize the keyboard handling in
            // AfterViewInit so we're guaranteed for both view and content children to be defined.
            this._keyManager = new a11y.FocusKeyManager(this._stepHeader)
                .withWrap()
                .withVerticalOrientation(this._orientation === 'vertical');
            (this._dir ? this._dir.change : rxjs.of())
                .pipe(operators.startWith(this._layoutDirection()), operators.takeUntil(this._destroyed))
                .subscribe(function (direction) { return _this._keyManager.withHorizontalOrientation(direction); });
            this._keyManager.updateActiveItem(this._selectedIndex);
            this.steps.changes.pipe(operators.takeUntil(this._destroyed)).subscribe(function () {
                if (!_this.selected) {
                    _this._selectedIndex = Math.max(_this._selectedIndex - 1, 0);
                }
            });
        };
        CdkStepper.prototype.ngOnDestroy = function () {
            this._destroyed.next();
            this._destroyed.complete();
        };
        /** Selects and focuses the next step in list. */
        CdkStepper.prototype.next = function () {
            this.selectedIndex = Math.min(this._selectedIndex + 1, this.steps.length - 1);
        };
        /** Selects and focuses the previous step in list. */
        CdkStepper.prototype.previous = function () {
            this.selectedIndex = Math.max(this._selectedIndex - 1, 0);
        };
        /** Resets the stepper to its initial state. Note that this includes clearing form data. */
        CdkStepper.prototype.reset = function () {
            this._updateSelectedItemIndex(0);
            this.steps.forEach(function (step) { return step.reset(); });
            this._stateChanged();
        };
        /** Returns a unique id for each step label element. */
        CdkStepper.prototype._getStepLabelId = function (i) {
            return "cdk-step-label-" + this._groupId + "-" + i;
        };
        /** Returns unique id for each step content element. */
        CdkStepper.prototype._getStepContentId = function (i) {
            return "cdk-step-content-" + this._groupId + "-" + i;
        };
        /** Marks the component to be change detected. */
        CdkStepper.prototype._stateChanged = function () {
            this._changeDetectorRef.markForCheck();
        };
        /** Returns position state of the step with the given index. */
        CdkStepper.prototype._getAnimationDirection = function (index) {
            var position = index - this._selectedIndex;
            if (position < 0) {
                return this._layoutDirection() === 'rtl' ? 'next' : 'previous';
            }
            else if (position > 0) {
                return this._layoutDirection() === 'rtl' ? 'previous' : 'next';
            }
            return 'current';
        };
        /** Returns the type of icon to be displayed. */
        CdkStepper.prototype._getIndicatorType = function (index, state) {
            if (state === void 0) { state = STEP_STATE.NUMBER; }
            var step = this.steps.toArray()[index];
            var isCurrentStep = this._isCurrentStep(index);
            return step._displayDefaultIndicatorType ? this._getDefaultIndicatorLogic(step, isCurrentStep) :
                this._getGuidelineLogic(step, isCurrentStep, state);
        };
        CdkStepper.prototype._getDefaultIndicatorLogic = function (step, isCurrentStep) {
            if (step._showError && step.hasError && !isCurrentStep) {
                return STEP_STATE.ERROR;
            }
            else if (!step.completed || isCurrentStep) {
                return STEP_STATE.NUMBER;
            }
            else {
                return step.editable ? STEP_STATE.EDIT : STEP_STATE.DONE;
            }
        };
        CdkStepper.prototype._getGuidelineLogic = function (step, isCurrentStep, state) {
            if (state === void 0) { state = STEP_STATE.NUMBER; }
            if (step._showError && step.hasError && !isCurrentStep) {
                return STEP_STATE.ERROR;
            }
            else if (step.completed && !isCurrentStep) {
                return STEP_STATE.DONE;
            }
            else if (step.completed && isCurrentStep) {
                return state;
            }
            else if (step.editable && isCurrentStep) {
                return STEP_STATE.EDIT;
            }
            else {
                return state;
            }
        };
        CdkStepper.prototype._isCurrentStep = function (index) {
            return this._selectedIndex === index;
        };
        /** Returns the index of the currently-focused step header. */
        CdkStepper.prototype._getFocusIndex = function () {
            return this._keyManager ? this._keyManager.activeItemIndex : this._selectedIndex;
        };
        CdkStepper.prototype._updateSelectedItemIndex = function (newIndex) {
            var stepsArray = this.steps.toArray();
            this.selectionChange.emit({
                selectedIndex: newIndex,
                previouslySelectedIndex: this._selectedIndex,
                selectedStep: stepsArray[newIndex],
                previouslySelectedStep: stepsArray[this._selectedIndex],
            });
            // If focus is inside the stepper, move it to the next header, otherwise it may become
            // lost when the active step content is hidden. We can't be more granular with the check
            // (e.g. checking whether focus is inside the active step), because we don't have a
            // reference to the elements that are rendering out the content.
            this._containsFocus() ? this._keyManager.setActiveItem(newIndex) :
                this._keyManager.updateActiveItem(newIndex);
            this._selectedIndex = newIndex;
            this._stateChanged();
        };
        CdkStepper.prototype._onKeydown = function (event) {
            var hasModifier = keycodes.hasModifierKey(event);
            var keyCode = event.keyCode;
            var manager = this._keyManager;
            if (manager.activeItemIndex != null && !hasModifier &&
                (keyCode === keycodes.SPACE || keyCode === keycodes.ENTER)) {
                this.selectedIndex = manager.activeItemIndex;
                event.preventDefault();
            }
            else if (keyCode === keycodes.HOME) {
                manager.setFirstItemActive();
                event.preventDefault();
            }
            else if (keyCode === keycodes.END) {
                manager.setLastItemActive();
                event.preventDefault();
            }
            else {
                manager.onKeydown(event);
            }
        };
        CdkStepper.prototype._anyControlsInvalidOrPending = function (index) {
            var steps = this.steps.toArray();
            steps[this._selectedIndex].interacted = true;
            if (this._linear && index >= 0) {
                return steps.slice(0, index).some(function (step) {
                    var control = step.stepControl;
                    var isIncomplete = control ? (control.invalid || control.pending || !step.interacted) : !step.completed;
                    return isIncomplete && !step.optional && !step._completedOverride;
                });
            }
            return false;
        };
        CdkStepper.prototype._layoutDirection = function () {
            return this._dir && this._dir.value === 'rtl' ? 'rtl' : 'ltr';
        };
        /** Checks whether the stepper contains the focused element. */
        CdkStepper.prototype._containsFocus = function () {
            if (!this._document || !this._elementRef) {
                return false;
            }
            var stepperElement = this._elementRef.nativeElement;
            var focusedElement = this._document.activeElement;
            return stepperElement === focusedElement || stepperElement.contains(focusedElement);
        };
        __decorate([
            core.ContentChildren(CdkStep, { descendants: true }),
            __metadata("design:type", core.QueryList)
        ], CdkStepper.prototype, "_steps", void 0);
        __decorate([
            core.ContentChildren(CdkStepHeader, { descendants: true }),
            __metadata("design:type", core.QueryList)
        ], CdkStepper.prototype, "_stepHeader", void 0);
        __decorate([
            core.Input(),
            __metadata("design:type", Boolean),
            __metadata("design:paramtypes", [Boolean])
        ], CdkStepper.prototype, "linear", null);
        __decorate([
            core.Input(),
            __metadata("design:type", Number),
            __metadata("design:paramtypes", [Number])
        ], CdkStepper.prototype, "selectedIndex", null);
        __decorate([
            core.Input(),
            __metadata("design:type", CdkStep),
            __metadata("design:paramtypes", [CdkStep])
        ], CdkStepper.prototype, "selected", null);
        __decorate([
            core.Output(),
            __metadata("design:type", core.EventEmitter)
        ], CdkStepper.prototype, "selectionChange", void 0);
        CdkStepper = __decorate([
            core.Directive({
                selector: '[cdkStepper]',
                exportAs: 'cdkStepper',
            }),
            __param(0, core.Optional()),
            __param(3, core.Inject(common.DOCUMENT)),
            __metadata("design:paramtypes", [bidi.Directionality, core.ChangeDetectorRef,
                core.ElementRef, Object])
        ], CdkStepper);
        return CdkStepper;
    }());

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /** Button that moves to the next step in a stepper workflow. */
    var CdkStepperNext = /** @class */ (function () {
        function CdkStepperNext(_stepper) {
            this._stepper = _stepper;
            /** Type of the next button. Defaults to "submit" if not specified. */
            this.type = 'submit';
        }
        // We have to use a `HostListener` here in order to support both Ivy and ViewEngine.
        // In Ivy the `host` bindings will be merged when this class is extended, whereas in
        // ViewEngine they're overwritten.
        // TODO(crisbeto): we move this back into `host` once Ivy is turned on by default.
        // tslint:disable-next-line:no-host-decorator-in-concrete
        CdkStepperNext.prototype._handleClick = function () {
            this._stepper.next();
        };
        __decorate([
            core.Input(),
            __metadata("design:type", String)
        ], CdkStepperNext.prototype, "type", void 0);
        __decorate([
            core.HostListener('click'),
            __metadata("design:type", Function),
            __metadata("design:paramtypes", []),
            __metadata("design:returntype", void 0)
        ], CdkStepperNext.prototype, "_handleClick", null);
        CdkStepperNext = __decorate([
            core.Directive({
                selector: 'button[cdkStepperNext]',
                host: {
                    '[type]': 'type',
                }
            }),
            __metadata("design:paramtypes", [CdkStepper])
        ], CdkStepperNext);
        return CdkStepperNext;
    }());
    /** Button that moves to the previous step in a stepper workflow. */
    var CdkStepperPrevious = /** @class */ (function () {
        function CdkStepperPrevious(_stepper) {
            this._stepper = _stepper;
            /** Type of the previous button. Defaults to "button" if not specified. */
            this.type = 'button';
        }
        // We have to use a `HostListener` here in order to support both Ivy and ViewEngine.
        // In Ivy the `host` bindings will be merged when this class is extended, whereas in
        // ViewEngine they're overwritten.
        // TODO(crisbeto): we move this back into `host` once Ivy is turned on by default.
        // tslint:disable-next-line:no-host-decorator-in-concrete
        CdkStepperPrevious.prototype._handleClick = function () {
            this._stepper.previous();
        };
        __decorate([
            core.Input(),
            __metadata("design:type", String)
        ], CdkStepperPrevious.prototype, "type", void 0);
        __decorate([
            core.HostListener('click'),
            __metadata("design:type", Function),
            __metadata("design:paramtypes", []),
            __metadata("design:returntype", void 0)
        ], CdkStepperPrevious.prototype, "_handleClick", null);
        CdkStepperPrevious = __decorate([
            core.Directive({
                selector: 'button[cdkStepperPrevious]',
                host: {
                    '[type]': 'type',
                }
            }),
            __metadata("design:paramtypes", [CdkStepper])
        ], CdkStepperPrevious);
        return CdkStepperPrevious;
    }());

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var CdkStepperModule = /** @class */ (function () {
        function CdkStepperModule() {
        }
        CdkStepperModule = __decorate([
            core.NgModule({
                imports: [bidi.BidiModule],
                exports: [
                    CdkStep,
                    CdkStepper,
                    CdkStepHeader,
                    CdkStepLabel,
                    CdkStepperNext,
                    CdkStepperPrevious,
                ],
                declarations: [
                    CdkStep,
                    CdkStepper,
                    CdkStepHeader,
                    CdkStepLabel,
                    CdkStepperNext,
                    CdkStepperPrevious,
                ]
            })
        ], CdkStepperModule);
        return CdkStepperModule;
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

    exports.CdkStep = CdkStep;
    exports.CdkStepHeader = CdkStepHeader;
    exports.CdkStepLabel = CdkStepLabel;
    exports.CdkStepper = CdkStepper;
    exports.CdkStepperModule = CdkStepperModule;
    exports.CdkStepperNext = CdkStepperNext;
    exports.CdkStepperPrevious = CdkStepperPrevious;
    exports.MAT_STEPPER_GLOBAL_OPTIONS = MAT_STEPPER_GLOBAL_OPTIONS;
    exports.STEPPER_GLOBAL_OPTIONS = STEPPER_GLOBAL_OPTIONS;
    exports.STEP_STATE = STEP_STATE;
    exports.StepperSelectionEvent = StepperSelectionEvent;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=cdk-stepper.umd.js.map
