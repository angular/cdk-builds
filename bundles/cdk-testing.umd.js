(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('tslib')) :
    typeof define === 'function' && define.amd ? define('@angular/cdk/testing', ['exports', 'tslib'], factory) :
    (global = global || self, factory((global.ng = global.ng || {}, global.ng.cdk = global.ng.cdk || {}, global.ng.cdk.testing = {}), global.tslib));
}(this, function (exports, tslib_1) { 'use strict';

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Base class for component harnesses that all component harness authors should extend. This base
     * component harness provides the basic ability to locate element and sub-component harness. It
     * should be inherited when defining user's own harness.
     */
    var ComponentHarness = /** @class */ (function () {
        function ComponentHarness(locatorFactory) {
            this.locatorFactory = locatorFactory;
        }
        /** Gets a `Promise` for the `TestElement` representing the host element of the component. */
        ComponentHarness.prototype.host = function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    return [2 /*return*/, this.locatorFactory.rootElement];
                });
            });
        };
        /**
         * Gets a `LocatorFactory` for the document root element. This factory can be used to create
         * locators for elements that a component creates outside of its own root element. (e.g. by
         * appending to document.body).
         */
        ComponentHarness.prototype.documentRootLocatorFactory = function () {
            return this.locatorFactory.documentRootLocatorFactory();
        };
        ComponentHarness.prototype.locatorFor = function (arg) {
            return this.locatorFactory.locatorFor(arg);
        };
        ComponentHarness.prototype.locatorForOptional = function (arg) {
            return this.locatorFactory.locatorForOptional(arg);
        };
        ComponentHarness.prototype.locatorForAll = function (arg) {
            return this.locatorFactory.locatorForAll(arg);
        };
        /**
         * Flushes change detection and async tasks in the Angular zone.
         * In most cases it should not be necessary to call this manually. However, there may be some edge
         * cases where it is needed to fully flush animation events.
         */
        ComponentHarness.prototype.forceStabilize = function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    return [2 /*return*/, this.locatorFactory.forceStabilize()];
                });
            });
        };
        /**
         * Waits for all scheduled or running async tasks to complete. This allows harness
         * authors to wait for async tasks outside of the Angular zone.
         */
        ComponentHarness.prototype.waitForTasksOutsideAngular = function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    return [2 /*return*/, this.locatorFactory.waitForTasksOutsideAngular()];
                });
            });
        };
        return ComponentHarness;
    }());
    /**
     * A class used to associate a ComponentHarness class with predicates functions that can be used to
     * filter instances of the class.
     */
    var HarnessPredicate = /** @class */ (function () {
        function HarnessPredicate(harnessType, options) {
            this.harnessType = harnessType;
            this._predicates = [];
            this._descriptions = [];
            this._addBaseOptions(options);
        }
        /**
         * Checks if a string matches the given pattern.
         * @param s The string to check, or a Promise for the string to check.
         * @param pattern The pattern the string is expected to match. If `pattern` is a string, `s` is
         *   expected to match exactly. If `pattern` is a regex, a partial match is allowed.
         * @return A Promise that resolves to whether the string matches the pattern.
         */
        HarnessPredicate.stringMatches = function (s, pattern) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, s];
                        case 1:
                            s = _a.sent();
                            return [2 /*return*/, typeof pattern === 'string' ? s === pattern : pattern.test(s)];
                    }
                });
            });
        };
        /**
         * Adds a predicate function to be run against candidate harnesses.
         * @param description A description of this predicate that may be used in error messages.
         * @param predicate An async predicate function.
         * @return this (for method chaining).
         */
        HarnessPredicate.prototype.add = function (description, predicate) {
            this._descriptions.push(description);
            this._predicates.push(predicate);
            return this;
        };
        /**
         * Adds a predicate function that depends on an option value to be run against candidate
         * harnesses. If the option value is undefined, the predicate will be ignored.
         * @param name The name of the option (may be used in error messages).
         * @param option The option value.
         * @param predicate The predicate function to run if the option value is not undefined.
         * @return this (for method chaining).
         */
        HarnessPredicate.prototype.addOption = function (name, option, predicate) {
            // Add quotes around strings to differentiate them from other values
            var value = typeof option === 'string' ? "\"" + option + "\"" : "" + option;
            if (option !== undefined) {
                this.add(name + " = " + value, function (item) { return predicate(item, option); });
            }
            return this;
        };
        /**
         * Filters a list of harnesses on this predicate.
         * @param harnesses The list of harnesses to filter.
         * @return A list of harnesses that satisfy this predicate.
         */
        HarnessPredicate.prototype.filter = function (harnesses) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var results;
                var _this = this;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, Promise.all(harnesses.map(function (h) { return _this.evaluate(h); }))];
                        case 1:
                            results = _a.sent();
                            return [2 /*return*/, harnesses.filter(function (_, i) { return results[i]; })];
                    }
                });
            });
        };
        /**
         * Evaluates whether the given harness satisfies this predicate.
         * @param harness The harness to check
         * @return A promise that resolves to true if the harness satisfies this predicate,
         *   and resolves to false otherwise.
         */
        HarnessPredicate.prototype.evaluate = function (harness) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var results;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, Promise.all(this._predicates.map(function (p) { return p(harness); }))];
                        case 1:
                            results = _a.sent();
                            return [2 /*return*/, results.reduce(function (combined, current) { return combined && current; }, true)];
                    }
                });
            });
        };
        /** Gets a description of this predicate for use in error messages. */
        HarnessPredicate.prototype.getDescription = function () {
            return this._descriptions.join(', ');
        };
        /** Gets the selector used to find candidate elements. */
        HarnessPredicate.prototype.getSelector = function () {
            var _this = this;
            return this._ancestor.split(',')
                .map(function (part) { return (part.trim() + " " + _this.harnessType.hostSelector).trim(); })
                .join(',');
        };
        /** Adds base options common to all harness types. */
        HarnessPredicate.prototype._addBaseOptions = function (options) {
            var _this = this;
            this._ancestor = options.ancestor || '';
            if (this._ancestor) {
                this._descriptions.push("has ancestor matching selector \"" + this._ancestor + "\"");
            }
            var selector = options.selector;
            if (selector !== undefined) {
                this.add("host matches selector \"" + selector + "\"", function (item) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    return tslib_1.__generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, item.host()];
                            case 1: return [2 /*return*/, (_a.sent()).matchesSelector(selector)];
                        }
                    });
                }); });
            }
        };
        return HarnessPredicate;
    }());

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Base harness environment class that can be extended to allow `ComponentHarness`es to be used in
     * different test environments (e.g. testbed, protractor, etc.). This class implements the
     * functionality of both a `HarnessLoader` and `LocatorFactory`. This class is generic on the raw
     * element type, `E`, used by the particular test environment.
     */
    var HarnessEnvironment = /** @class */ (function () {
        function HarnessEnvironment(rawRootElement) {
            this.rawRootElement = rawRootElement;
            this.rootElement = this.createTestElement(rawRootElement);
        }
        // Implemented as part of the `LocatorFactory` interface.
        HarnessEnvironment.prototype.documentRootLocatorFactory = function () {
            return this.createEnvironment(this.getDocumentRoot());
        };
        HarnessEnvironment.prototype.locatorFor = function (arg) {
            var _this = this;
            return function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var _a;
                return tslib_1.__generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!(typeof arg === 'string')) return [3 /*break*/, 2];
                            _a = this.createTestElement;
                            return [4 /*yield*/, this._assertElementFound(arg)];
                        case 1: return [2 /*return*/, _a.apply(this, [_b.sent()])];
                        case 2: return [2 /*return*/, this._assertHarnessFound(arg)];
                    }
                });
            }); };
        };
        HarnessEnvironment.prototype.locatorForOptional = function (arg) {
            var _this = this;
            return function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var element, candidates;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(typeof arg === 'string')) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.getAllRawElements(arg)];
                        case 1:
                            element = (_a.sent())[0];
                            return [2 /*return*/, element ? this.createTestElement(element) : null];
                        case 2: return [4 /*yield*/, this._getAllHarnesses(arg)];
                        case 3:
                            candidates = _a.sent();
                            return [2 /*return*/, candidates[0] || null];
                    }
                });
            }); };
        };
        HarnessEnvironment.prototype.locatorForAll = function (arg) {
            var _this = this;
            return function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var _this = this;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(typeof arg === 'string')) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.getAllRawElements(arg)];
                        case 1: return [2 /*return*/, (_a.sent()).map(function (e) { return _this.createTestElement(e); })];
                        case 2: return [2 /*return*/, this._getAllHarnesses(arg)];
                    }
                });
            }); };
        };
        // Implemented as part of the `LocatorFactory` interface.
        HarnessEnvironment.prototype.harnessLoaderFor = function (selector) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var _a;
                return tslib_1.__generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = this.createEnvironment;
                            return [4 /*yield*/, this._assertElementFound(selector)];
                        case 1: return [2 /*return*/, _a.apply(this, [_b.sent()])];
                    }
                });
            });
        };
        // Implemented as part of the `LocatorFactory` interface.
        HarnessEnvironment.prototype.harnessLoaderForOptional = function (selector) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var elements;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getAllRawElements(selector)];
                        case 1:
                            elements = _a.sent();
                            return [2 /*return*/, elements[0] ? this.createEnvironment(elements[0]) : null];
                    }
                });
            });
        };
        // Implemented as part of the `LocatorFactory` interface.
        HarnessEnvironment.prototype.harnessLoaderForAll = function (selector) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var elements;
                var _this = this;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getAllRawElements(selector)];
                        case 1:
                            elements = _a.sent();
                            return [2 /*return*/, elements.map(function (element) { return _this.createEnvironment(element); })];
                    }
                });
            });
        };
        // Implemented as part of the `HarnessLoader` interface.
        HarnessEnvironment.prototype.getHarness = function (harnessType) {
            return this.locatorFor(harnessType)();
        };
        // Implemented as part of the `HarnessLoader` interface.
        HarnessEnvironment.prototype.getAllHarnesses = function (harnessType) {
            return this.locatorForAll(harnessType)();
        };
        // Implemented as part of the `HarnessLoader` interface.
        HarnessEnvironment.prototype.getChildLoader = function (selector) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var _a;
                return tslib_1.__generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = this.createEnvironment;
                            return [4 /*yield*/, this._assertElementFound(selector)];
                        case 1: return [2 /*return*/, _a.apply(this, [_b.sent()])];
                    }
                });
            });
        };
        // Implemented as part of the `HarnessLoader` interface.
        HarnessEnvironment.prototype.getAllChildLoaders = function (selector) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var _this = this;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getAllRawElements(selector)];
                        case 1: return [2 /*return*/, (_a.sent()).map(function (e) { return _this.createEnvironment(e); })];
                    }
                });
            });
        };
        /** Creates a `ComponentHarness` for the given harness type with the given raw host element. */
        HarnessEnvironment.prototype.createComponentHarness = function (harnessType, element) {
            return new harnessType(this.createEnvironment(element));
        };
        HarnessEnvironment.prototype._getAllHarnesses = function (harnessType) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var harnessPredicate, elements;
                var _this = this;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            harnessPredicate = harnessType instanceof HarnessPredicate ?
                                harnessType : new HarnessPredicate(harnessType, {});
                            return [4 /*yield*/, this.getAllRawElements(harnessPredicate.getSelector())];
                        case 1:
                            elements = _a.sent();
                            return [2 /*return*/, harnessPredicate.filter(elements.map(function (element) { return _this.createComponentHarness(harnessPredicate.harnessType, element); }))];
                    }
                });
            });
        };
        HarnessEnvironment.prototype._assertElementFound = function (selector) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var element;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getAllRawElements(selector)];
                        case 1:
                            element = (_a.sent())[0];
                            if (!element) {
                                throw Error("Expected to find element matching selector: \"" + selector + "\", but none was found");
                            }
                            return [2 /*return*/, element];
                    }
                });
            });
        };
        HarnessEnvironment.prototype._assertHarnessFound = function (harnessType) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var harness;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this._getAllHarnesses(harnessType)];
                        case 1:
                            harness = (_a.sent())[0];
                            if (!harness) {
                                throw _getErrorForMissingHarness(harnessType);
                            }
                            return [2 /*return*/, harness];
                    }
                });
            });
        };
        return HarnessEnvironment;
    }());
    function _getErrorForMissingHarness(harnessType) {
        var harnessPredicate = harnessType instanceof HarnessPredicate ? harnessType : new HarnessPredicate(harnessType, {});
        var _a = harnessPredicate.harnessType, name = _a.name, hostSelector = _a.hostSelector;
        var restrictions = harnessPredicate.getDescription();
        var message = "Expected to find element for " + name + " matching selector: \"" + hostSelector + "\"";
        if (restrictions) {
            message += " (with restrictions: " + restrictions + ")";
        }
        message += ', but none was found';
        return Error(message);
    }

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
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
    })(exports.TestKey || (exports.TestKey = {}));

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

    exports.ComponentHarness = ComponentHarness;
    exports.HarnessPredicate = HarnessPredicate;
    exports.HarnessEnvironment = HarnessEnvironment;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=cdk-testing.umd.js.map
