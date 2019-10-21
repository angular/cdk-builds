(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('tslib'), require('@angular/cdk/testing'), require('@angular/core/testing'), require('rxjs/operators'), require('rxjs'), require('@angular/cdk/keycodes')) :
    typeof define === 'function' && define.amd ? define('@angular/cdk/testing/testbed', ['exports', 'tslib', '@angular/cdk/testing', '@angular/core/testing', 'rxjs/operators', 'rxjs', '@angular/cdk/keycodes'], factory) :
    (global = global || self, factory((global.ng = global.ng || {}, global.ng.cdk = global.ng.cdk || {}, global.ng.cdk.testing = global.ng.cdk.testing || {}, global.ng.cdk.testing.testbed = {}), global.tslib, global.ng.cdk.testing, global.ng.core.testing, global.rxjs.operators, global.rxjs, global.ng.cdk.keycodes));
}(this, function (exports, tslib_1, testing, testing$1, operators, rxjs, keyCodes) { 'use strict';

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /** Unique symbol that is used to patch a property to a proxy zone. */
    var stateObservableSymbol = Symbol('ProxyZone_PATCHED#stateObservable');
    /**
     * Interceptor that can be set up in a `ProxyZone` instance. The interceptor
     * will keep track of the task state and emit whenever the state changes.
     *
     * This serves as a workaround for https://github.com/angular/angular/issues/32896.
     */
    var TaskStateZoneInterceptor = /** @class */ (function () {
        function TaskStateZoneInterceptor(_lastState) {
            this._lastState = _lastState;
            /** Subject that can be used to emit a new state change. */
            this._stateSubject = new rxjs.BehaviorSubject(this._lastState ? this._getTaskStateFromInternalZoneState(this._lastState) : { stable: true });
            /** Public observable that emits whenever the task state changes. */
            this.state = this._stateSubject.asObservable();
        }
        /** This will be called whenever the task state changes in the intercepted zone. */
        TaskStateZoneInterceptor.prototype.onHasTask = function (delegate, current, target, hasTaskState) {
            if (current === target) {
                this._stateSubject.next(this._getTaskStateFromInternalZoneState(hasTaskState));
            }
        };
        /** Gets the task state from the internal ZoneJS task state. */
        TaskStateZoneInterceptor.prototype._getTaskStateFromInternalZoneState = function (state) {
            return { stable: !state.macroTask && !state.microTask };
        };
        /**
         * Sets up the custom task state Zone interceptor in the  `ProxyZone`. Throws if
         * no `ProxyZone` could be found.
         * @returns an observable that emits whenever the task state changes.
         */
        TaskStateZoneInterceptor.setup = function () {
            if (Zone === undefined) {
                throw Error('Could not find ZoneJS. For test harnesses running in TestBed, ' +
                    'ZoneJS needs to be installed.');
            }
            // tslint:disable-next-line:variable-name
            var ProxyZoneSpec = Zone['ProxyZoneSpec'];
            // If there is no "ProxyZoneSpec" installed, we throw an error and recommend
            // setting up the proxy zone by pulling in the testing bundle.
            if (!ProxyZoneSpec) {
                throw Error('ProxyZoneSpec is needed for the test harnesses but could not be found. ' +
                    'Please make sure that your environment includes zone.js/dist/zone-testing.js');
            }
            // Ensure that there is a proxy zone instance set up, and get
            // a reference to the instance if present.
            var zoneSpec = ProxyZoneSpec.assertPresent();
            // If there already is a delegate registered in the proxy zone, and it
            // is type of the custom task state interceptor, we just use that state
            // observable. This allows us to only intercept Zone once per test
            // (similar to how `fakeAsync` or `async` work).
            if (zoneSpec[stateObservableSymbol]) {
                return zoneSpec[stateObservableSymbol];
            }
            // Since we intercept on environment creation and the fixture has been
            // created before, we might have missed tasks scheduled before. Fortunately
            // the proxy zone keeps track of the previous task state, so we can just pass
            // this as initial state to the task zone interceptor.
            var interceptor = new TaskStateZoneInterceptor(zoneSpec.lastTaskState);
            var zoneSpecOnHasTask = zoneSpec.onHasTask;
            // We setup the task state interceptor in the `ProxyZone`. Note that we cannot register
            // the interceptor as a new proxy zone delegate because it would mean that other zone
            // delegates (e.g. `FakeAsyncTestZone` or `AsyncTestZone`) can accidentally overwrite/disable
            // our interceptor. Since we just intend to monitor the task state of the proxy zone, it is
            // sufficient to just patch the proxy zone. This also avoids that we interfere with the task
            // queue scheduling logic.
            zoneSpec.onHasTask = function () {
                zoneSpecOnHasTask.apply(zoneSpec, arguments);
                interceptor.onHasTask.apply(interceptor, arguments);
            };
            return zoneSpec[stateObservableSymbol] = interceptor.state;
        };
        return TaskStateZoneInterceptor;
    }());

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /** An enum of non-text keys that can be used with the `sendKeys` method. */
    // NOTE: This is a separate enum from `@angular/cdk/keycodes` because we don't necessarily want to
    // support every possible keyCode. We also can't rely on Protractor's `Key` because we don't want a
    // dependency on any particular testing framework here. Instead we'll just maintain this supported
    // list of keys and let individual concrete `HarnessEnvironment` classes map them to whatever key
    // representation is used in its respective testing framework.
    var TestKey;
    (function (TestKey) {
        TestKey[TestKey["BACKSPACE"] = 0] = "BACKSPACE";
        TestKey[TestKey["TAB"] = 1] = "TAB";
        TestKey[TestKey["ENTER"] = 2] = "ENTER";
        TestKey[TestKey["SHIFT"] = 3] = "SHIFT";
        TestKey[TestKey["CONTROL"] = 4] = "CONTROL";
        TestKey[TestKey["ALT"] = 5] = "ALT";
        TestKey[TestKey["ESCAPE"] = 6] = "ESCAPE";
        TestKey[TestKey["PAGE_UP"] = 7] = "PAGE_UP";
        TestKey[TestKey["PAGE_DOWN"] = 8] = "PAGE_DOWN";
        TestKey[TestKey["END"] = 9] = "END";
        TestKey[TestKey["HOME"] = 10] = "HOME";
        TestKey[TestKey["LEFT_ARROW"] = 11] = "LEFT_ARROW";
        TestKey[TestKey["UP_ARROW"] = 12] = "UP_ARROW";
        TestKey[TestKey["RIGHT_ARROW"] = 13] = "RIGHT_ARROW";
        TestKey[TestKey["DOWN_ARROW"] = 14] = "DOWN_ARROW";
        TestKey[TestKey["INSERT"] = 15] = "INSERT";
        TestKey[TestKey["DELETE"] = 16] = "DELETE";
        TestKey[TestKey["F1"] = 17] = "F1";
        TestKey[TestKey["F2"] = 18] = "F2";
        TestKey[TestKey["F3"] = 19] = "F3";
        TestKey[TestKey["F4"] = 20] = "F4";
        TestKey[TestKey["F5"] = 21] = "F5";
        TestKey[TestKey["F6"] = 22] = "F6";
        TestKey[TestKey["F7"] = 23] = "F7";
        TestKey[TestKey["F8"] = 24] = "F8";
        TestKey[TestKey["F9"] = 25] = "F9";
        TestKey[TestKey["F10"] = 26] = "F10";
        TestKey[TestKey["F11"] = 27] = "F11";
        TestKey[TestKey["F12"] = 28] = "F12";
        TestKey[TestKey["META"] = 29] = "META";
    })(TestKey || (TestKey = {}));

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var _a;
    /** Maps `TestKey` constants to the `keyCode` and `key` values used by native browser events. */
    var keyMap = (_a = {},
        _a[TestKey.BACKSPACE] = { keyCode: keyCodes.BACKSPACE, key: 'Backspace' },
        _a[TestKey.TAB] = { keyCode: keyCodes.TAB, key: 'Tab' },
        _a[TestKey.ENTER] = { keyCode: keyCodes.ENTER, key: 'Enter' },
        _a[TestKey.SHIFT] = { keyCode: keyCodes.SHIFT, key: 'Shift' },
        _a[TestKey.CONTROL] = { keyCode: keyCodes.CONTROL, key: 'Control' },
        _a[TestKey.ALT] = { keyCode: keyCodes.ALT, key: 'Alt' },
        _a[TestKey.ESCAPE] = { keyCode: keyCodes.ESCAPE, key: 'Escape' },
        _a[TestKey.PAGE_UP] = { keyCode: keyCodes.PAGE_UP, key: 'PageUp' },
        _a[TestKey.PAGE_DOWN] = { keyCode: keyCodes.PAGE_DOWN, key: 'PageDown' },
        _a[TestKey.END] = { keyCode: keyCodes.END, key: 'End' },
        _a[TestKey.HOME] = { keyCode: keyCodes.HOME, key: 'Home' },
        _a[TestKey.LEFT_ARROW] = { keyCode: keyCodes.LEFT_ARROW, key: 'ArrowLeft' },
        _a[TestKey.UP_ARROW] = { keyCode: keyCodes.UP_ARROW, key: 'ArrowUp' },
        _a[TestKey.RIGHT_ARROW] = { keyCode: keyCodes.RIGHT_ARROW, key: 'ArrowRight' },
        _a[TestKey.DOWN_ARROW] = { keyCode: keyCodes.DOWN_ARROW, key: 'ArrowDown' },
        _a[TestKey.INSERT] = { keyCode: keyCodes.INSERT, key: 'Insert' },
        _a[TestKey.DELETE] = { keyCode: keyCodes.DELETE, key: 'Delete' },
        _a[TestKey.F1] = { keyCode: keyCodes.F1, key: 'F1' },
        _a[TestKey.F2] = { keyCode: keyCodes.F2, key: 'F2' },
        _a[TestKey.F3] = { keyCode: keyCodes.F3, key: 'F3' },
        _a[TestKey.F4] = { keyCode: keyCodes.F4, key: 'F4' },
        _a[TestKey.F5] = { keyCode: keyCodes.F5, key: 'F5' },
        _a[TestKey.F6] = { keyCode: keyCodes.F6, key: 'F6' },
        _a[TestKey.F7] = { keyCode: keyCodes.F7, key: 'F7' },
        _a[TestKey.F8] = { keyCode: keyCodes.F8, key: 'F8' },
        _a[TestKey.F9] = { keyCode: keyCodes.F9, key: 'F9' },
        _a[TestKey.F10] = { keyCode: keyCodes.F10, key: 'F10' },
        _a[TestKey.F11] = { keyCode: keyCodes.F11, key: 'F11' },
        _a[TestKey.F12] = { keyCode: keyCodes.F12, key: 'F12' },
        _a[TestKey.META] = { keyCode: keyCodes.META, key: 'Meta' },
        _a);
    /** A `TestElement` implementation for unit tests. */
    var UnitTestElement = /** @class */ (function () {
        function UnitTestElement(element, _stabilize) {
            this.element = element;
            this._stabilize = _stabilize;
        }
        UnitTestElement.prototype.blur = function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this._stabilize()];
                        case 1:
                            _a.sent();
                            testing.triggerBlur(this.element);
                            return [4 /*yield*/, this._stabilize()];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        UnitTestElement.prototype.clear = function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this._stabilize()];
                        case 1:
                            _a.sent();
                            if (!testing.isTextInput(this.element)) {
                                throw Error('Attempting to clear an invalid element');
                            }
                            testing.clearElement(this.element);
                            return [4 /*yield*/, this._stabilize()];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        UnitTestElement.prototype.click = function (relativeX, relativeY) {
            if (relativeX === void 0) { relativeX = 0; }
            if (relativeY === void 0) { relativeY = 0; }
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var _a, left, top, clientX, clientY;
                return tslib_1.__generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this._stabilize()];
                        case 1:
                            _b.sent();
                            _a = this.element.getBoundingClientRect(), left = _a.left, top = _a.top;
                            clientX = Math.round(left + relativeX);
                            clientY = Math.round(top + relativeY);
                            testing.dispatchMouseEvent(this.element, 'mousedown', clientX, clientY);
                            testing.dispatchMouseEvent(this.element, 'mouseup', clientX, clientY);
                            testing.dispatchMouseEvent(this.element, 'click', clientX, clientY);
                            return [4 /*yield*/, this._stabilize()];
                        case 2:
                            _b.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        UnitTestElement.prototype.focus = function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this._stabilize()];
                        case 1:
                            _a.sent();
                            testing.triggerFocus(this.element);
                            return [4 /*yield*/, this._stabilize()];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        UnitTestElement.prototype.getCssValue = function (property) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this._stabilize()];
                        case 1:
                            _a.sent();
                            // TODO(mmalerba): Consider adding value normalization if we run into common cases where its
                            //  needed.
                            return [2 /*return*/, getComputedStyle(this.element).getPropertyValue(property)];
                    }
                });
            });
        };
        UnitTestElement.prototype.hover = function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this._stabilize()];
                        case 1:
                            _a.sent();
                            testing.dispatchMouseEvent(this.element, 'mouseenter');
                            return [4 /*yield*/, this._stabilize()];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        UnitTestElement.prototype.sendKeys = function () {
            var modifiersAndKeys = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                modifiersAndKeys[_i] = arguments[_i];
            }
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var args;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this._stabilize()];
                        case 1:
                            _a.sent();
                            args = modifiersAndKeys.map(function (k) { return typeof k === 'number' ? keyMap[k] : k; });
                            testing.typeInElement.apply(void 0, tslib_1.__spread([this.element], args));
                            return [4 /*yield*/, this._stabilize()];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        UnitTestElement.prototype.text = function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this._stabilize()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, (this.element.textContent || '').trim()];
                    }
                });
            });
        };
        UnitTestElement.prototype.getAttribute = function (name) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this._stabilize()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, this.element.getAttribute(name)];
                    }
                });
            });
        };
        UnitTestElement.prototype.hasClass = function (name) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this._stabilize()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, this.element.classList.contains(name)];
                    }
                });
            });
        };
        UnitTestElement.prototype.getDimensions = function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this._stabilize()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, this.element.getBoundingClientRect()];
                    }
                });
            });
        };
        UnitTestElement.prototype.getProperty = function (name) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this._stabilize()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, this.element[name]];
                    }
                });
            });
        };
        UnitTestElement.prototype.matchesSelector = function (selector) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var elementPrototype;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this._stabilize()];
                        case 1:
                            _a.sent();
                            elementPrototype = Element.prototype;
                            return [2 /*return*/, (elementPrototype['matches'] || elementPrototype['msMatchesSelector'])
                                    .call(this.element, selector)];
                    }
                });
            });
        };
        return UnitTestElement;
    }());

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /** A `HarnessEnvironment` implementation for Angular's Testbed. */
    var TestbedHarnessEnvironment = /** @class */ (function (_super) {
        tslib_1.__extends(TestbedHarnessEnvironment, _super);
        function TestbedHarnessEnvironment(rawRootElement, _fixture) {
            var _this = _super.call(this, rawRootElement) || this;
            _this._fixture = _fixture;
            _this._destroyed = false;
            _this._taskState = TaskStateZoneInterceptor.setup();
            _fixture.componentRef.onDestroy(function () { return _this._destroyed = true; });
            return _this;
        }
        /** Creates a `HarnessLoader` rooted at the given fixture's root element. */
        TestbedHarnessEnvironment.loader = function (fixture) {
            return new TestbedHarnessEnvironment(fixture.nativeElement, fixture);
        };
        /**
         * Creates a `HarnessLoader` at the document root. This can be used if harnesses are
         * located outside of a fixture (e.g. overlays appended to the document body).
         */
        TestbedHarnessEnvironment.documentRootLoader = function (fixture) {
            return new TestbedHarnessEnvironment(document.body, fixture);
        };
        /**
         * Creates an instance of the given harness type, using the fixture's root element as the
         * harness's host element. This method should be used when creating a harness for the root element
         * of a fixture, as components do not have the correct selector when they are created as the root
         * of the fixture.
         */
        TestbedHarnessEnvironment.harnessForFixture = function (fixture, harnessType) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var environment;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            environment = new TestbedHarnessEnvironment(fixture.nativeElement, fixture);
                            return [4 /*yield*/, environment.forceStabilize()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, environment.createComponentHarness(harnessType, fixture.nativeElement)];
                    }
                });
            });
        };
        TestbedHarnessEnvironment.prototype.forceStabilize = function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (this._destroyed) {
                                throw Error('Harness is attempting to use a fixture that has already been destroyed.');
                            }
                            this._fixture.detectChanges();
                            return [4 /*yield*/, this._fixture.whenStable()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        TestbedHarnessEnvironment.prototype.waitForTasksOutsideAngular = function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            // If we run in the fake async zone, we run "flush" to run any scheduled tasks. This
                            // ensures that the harnesses behave inside of the FakeAsyncTestZone similar to the
                            // "AsyncTestZone" and the root zone (i.e. neither fakeAsync or async). Note that we
                            // cannot just rely on the task state observable to become stable because the state will
                            // never change. This is because the task queue will be only drained if the fake async
                            // zone is being flushed.
                            if (Zone.current.get('FakeAsyncTestZoneSpec')) {
                                testing$1.flush();
                            }
                            // Wait until the task queue has been drained and the zone is stable. Note that
                            // we cannot rely on "fixture.whenStable" since it does not catch tasks scheduled
                            // outside of the Angular zone. For test harnesses, we want to ensure that the
                            // app is fully stabilized and therefore need to use our own zone interceptor.
                            return [4 /*yield*/, this._taskState.pipe(operators.takeWhile(function (state) { return !state.stable; })).toPromise()];
                        case 1:
                            // Wait until the task queue has been drained and the zone is stable. Note that
                            // we cannot rely on "fixture.whenStable" since it does not catch tasks scheduled
                            // outside of the Angular zone. For test harnesses, we want to ensure that the
                            // app is fully stabilized and therefore need to use our own zone interceptor.
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        TestbedHarnessEnvironment.prototype.getDocumentRoot = function () {
            return document.body;
        };
        TestbedHarnessEnvironment.prototype.createTestElement = function (element) {
            var _this = this;
            return new UnitTestElement(element, function () { return _this.forceStabilize(); });
        };
        TestbedHarnessEnvironment.prototype.createEnvironment = function (element) {
            return new TestbedHarnessEnvironment(element, this._fixture);
        };
        TestbedHarnessEnvironment.prototype.getAllRawElements = function (selector) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.forceStabilize()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, Array.from(this.rawRootElement.querySelectorAll(selector))];
                    }
                });
            });
        };
        return TestbedHarnessEnvironment;
    }(testing.HarnessEnvironment));

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */

    exports.TestbedHarnessEnvironment = TestbedHarnessEnvironment;
    exports.UnitTestElement = UnitTestElement;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=cdk-testing-testbed.umd.js.map
