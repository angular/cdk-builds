(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('tslib'), require('@angular/cdk/testing'), require('protractor')) :
    typeof define === 'function' && define.amd ? define('@angular/cdk/testing/protractor', ['exports', 'tslib', '@angular/cdk/testing', 'protractor'], factory) :
    (global = global || self, factory((global.ng = global.ng || {}, global.ng.cdk = global.ng.cdk || {}, global.ng.cdk.testing = global.ng.cdk.testing || {}, global.ng.cdk.testing.protractor = {}), global.tslib, global.ng.cdk.testing, global.protractor));
}(this, (function (exports, tslib, testing, protractor) { 'use strict';

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var _a;
    /** Maps the `TestKey` constants to Protractor's `Key` constants. */
    var keyMap = (_a = {},
        _a[testing.TestKey.BACKSPACE] = protractor.Key.BACK_SPACE,
        _a[testing.TestKey.TAB] = protractor.Key.TAB,
        _a[testing.TestKey.ENTER] = protractor.Key.ENTER,
        _a[testing.TestKey.SHIFT] = protractor.Key.SHIFT,
        _a[testing.TestKey.CONTROL] = protractor.Key.CONTROL,
        _a[testing.TestKey.ALT] = protractor.Key.ALT,
        _a[testing.TestKey.ESCAPE] = protractor.Key.ESCAPE,
        _a[testing.TestKey.PAGE_UP] = protractor.Key.PAGE_UP,
        _a[testing.TestKey.PAGE_DOWN] = protractor.Key.PAGE_DOWN,
        _a[testing.TestKey.END] = protractor.Key.END,
        _a[testing.TestKey.HOME] = protractor.Key.HOME,
        _a[testing.TestKey.LEFT_ARROW] = protractor.Key.ARROW_LEFT,
        _a[testing.TestKey.UP_ARROW] = protractor.Key.ARROW_UP,
        _a[testing.TestKey.RIGHT_ARROW] = protractor.Key.ARROW_RIGHT,
        _a[testing.TestKey.DOWN_ARROW] = protractor.Key.ARROW_DOWN,
        _a[testing.TestKey.INSERT] = protractor.Key.INSERT,
        _a[testing.TestKey.DELETE] = protractor.Key.DELETE,
        _a[testing.TestKey.F1] = protractor.Key.F1,
        _a[testing.TestKey.F2] = protractor.Key.F2,
        _a[testing.TestKey.F3] = protractor.Key.F3,
        _a[testing.TestKey.F4] = protractor.Key.F4,
        _a[testing.TestKey.F5] = protractor.Key.F5,
        _a[testing.TestKey.F6] = protractor.Key.F6,
        _a[testing.TestKey.F7] = protractor.Key.F7,
        _a[testing.TestKey.F8] = protractor.Key.F8,
        _a[testing.TestKey.F9] = protractor.Key.F9,
        _a[testing.TestKey.F10] = protractor.Key.F10,
        _a[testing.TestKey.F11] = protractor.Key.F11,
        _a[testing.TestKey.F12] = protractor.Key.F12,
        _a[testing.TestKey.META] = protractor.Key.META,
        _a);
    /** Converts a `ModifierKeys` object to a list of Protractor `Key`s. */
    function toProtractorModifierKeys(modifiers) {
        var result = [];
        if (modifiers.control) {
            result.push(protractor.Key.CONTROL);
        }
        if (modifiers.alt) {
            result.push(protractor.Key.ALT);
        }
        if (modifiers.shift) {
            result.push(protractor.Key.SHIFT);
        }
        if (modifiers.meta) {
            result.push(protractor.Key.META);
        }
        return result;
    }
    /** A `TestElement` implementation for Protractor. */
    var ProtractorElement = /** @class */ (function () {
        function ProtractorElement(element) {
            this.element = element;
        }
        ProtractorElement.prototype.blur = function () {
            return tslib.__awaiter(this, void 0, void 0, function () {
                return tslib.__generator(this, function (_a) {
                    return [2 /*return*/, protractor.browser.executeScript('arguments[0].blur()', this.element)];
                });
            });
        };
        ProtractorElement.prototype.clear = function () {
            return tslib.__awaiter(this, void 0, void 0, function () {
                return tslib.__generator(this, function (_a) {
                    return [2 /*return*/, this.element.clear()];
                });
            });
        };
        ProtractorElement.prototype.click = function (relativeX, relativeY) {
            if (relativeX === void 0) { relativeX = 0; }
            if (relativeY === void 0) { relativeY = 0; }
            return tslib.__awaiter(this, void 0, void 0, function () {
                var _a, _b;
                return tslib.__generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _b = (_a = protractor.browser.actions()).mouseMove;
                            return [4 /*yield*/, this.element.getWebElement()];
                        case 1: return [4 /*yield*/, _b.apply(_a, [_c.sent(), { x: relativeX, y: relativeY }])
                                .click()
                                .perform()];
                        case 2:
                            _c.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        ProtractorElement.prototype.focus = function () {
            return tslib.__awaiter(this, void 0, void 0, function () {
                return tslib.__generator(this, function (_a) {
                    return [2 /*return*/, protractor.browser.executeScript('arguments[0].focus()', this.element)];
                });
            });
        };
        ProtractorElement.prototype.getCssValue = function (property) {
            return tslib.__awaiter(this, void 0, void 0, function () {
                return tslib.__generator(this, function (_a) {
                    return [2 /*return*/, this.element.getCssValue(property)];
                });
            });
        };
        ProtractorElement.prototype.hover = function () {
            return tslib.__awaiter(this, void 0, void 0, function () {
                var _a, _b;
                return tslib.__generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _b = (_a = protractor.browser.actions()).mouseMove;
                            return [4 /*yield*/, this.element.getWebElement()];
                        case 1: return [2 /*return*/, _b.apply(_a, [_c.sent()])
                                .perform()];
                    }
                });
            });
        };
        ProtractorElement.prototype.sendKeys = function () {
            var modifiersAndKeys = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                modifiersAndKeys[_i] = arguments[_i];
            }
            return tslib.__awaiter(this, void 0, void 0, function () {
                var first, modifiers, rest, modifierKeys, keys;
                var _a;
                return tslib.__generator(this, function (_b) {
                    first = modifiersAndKeys[0];
                    if (typeof first !== 'string' && typeof first !== 'number') {
                        modifiers = first;
                        rest = modifiersAndKeys.slice(1);
                    }
                    else {
                        modifiers = {};
                        rest = modifiersAndKeys;
                    }
                    modifierKeys = toProtractorModifierKeys(modifiers);
                    keys = rest.map(function (k) { return typeof k === 'string' ? k.split('') : [keyMap[k]]; })
                        .reduce(function (arr, k) { return arr.concat(k); }, [])
                        .map(function (k) { return protractor.Key.chord.apply(protractor.Key, tslib.__spread(modifierKeys, [k])); });
                    return [2 /*return*/, (_a = this.element).sendKeys.apply(_a, tslib.__spread(keys))];
                });
            });
        };
        ProtractorElement.prototype.text = function () {
            return tslib.__awaiter(this, void 0, void 0, function () {
                return tslib.__generator(this, function (_a) {
                    return [2 /*return*/, this.element.getText()];
                });
            });
        };
        ProtractorElement.prototype.getAttribute = function (name) {
            return tslib.__awaiter(this, void 0, void 0, function () {
                return tslib.__generator(this, function (_a) {
                    return [2 /*return*/, protractor.browser.executeScript("return arguments[0].getAttribute(arguments[1])", this.element, name)];
                });
            });
        };
        ProtractorElement.prototype.hasClass = function (name) {
            return tslib.__awaiter(this, void 0, void 0, function () {
                var classes;
                return tslib.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getAttribute('class')];
                        case 1:
                            classes = (_a.sent()) || '';
                            return [2 /*return*/, new Set(classes.split(/\s+/).filter(function (c) { return c; })).has(name)];
                    }
                });
            });
        };
        ProtractorElement.prototype.getDimensions = function () {
            return tslib.__awaiter(this, void 0, void 0, function () {
                var _a, width, height, _b, left, top;
                return tslib.__generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.element.getSize()];
                        case 1:
                            _a = _c.sent(), width = _a.width, height = _a.height;
                            return [4 /*yield*/, this.element.getLocation()];
                        case 2:
                            _b = _c.sent(), left = _b.x, top = _b.y;
                            return [2 /*return*/, { width: width, height: height, left: left, top: top }];
                    }
                });
            });
        };
        ProtractorElement.prototype.getProperty = function (name) {
            return tslib.__awaiter(this, void 0, void 0, function () {
                return tslib.__generator(this, function (_a) {
                    return [2 /*return*/, protractor.browser.executeScript("return arguments[0][arguments[1]]", this.element, name)];
                });
            });
        };
        ProtractorElement.prototype.matchesSelector = function (selector) {
            return tslib.__awaiter(this, void 0, void 0, function () {
                return tslib.__generator(this, function (_a) {
                    return [2 /*return*/, protractor.browser.executeScript("\n          return (Element.prototype.matches ||\n                  Element.prototype.msMatchesSelector).call(arguments[0], arguments[1])\n          ", this.element, selector)];
                });
            });
        };
        return ProtractorElement;
    }());

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /** A `HarnessEnvironment` implementation for Protractor. */
    var ProtractorHarnessEnvironment = /** @class */ (function (_super) {
        tslib.__extends(ProtractorHarnessEnvironment, _super);
        function ProtractorHarnessEnvironment(rawRootElement) {
            return _super.call(this, rawRootElement) || this;
        }
        /** Creates a `HarnessLoader` rooted at the document root. */
        ProtractorHarnessEnvironment.loader = function () {
            return new ProtractorHarnessEnvironment(protractor.element(protractor.by.css('body')));
        };
        ProtractorHarnessEnvironment.prototype.forceStabilize = function () {
            return tslib.__awaiter(this, void 0, void 0, function () { return tslib.__generator(this, function (_a) {
                return [2 /*return*/];
            }); });
        };
        ProtractorHarnessEnvironment.prototype.waitForTasksOutsideAngular = function () {
            return tslib.__awaiter(this, void 0, void 0, function () {
                return tslib.__generator(this, function (_a) {
                    return [2 /*return*/];
                });
            });
        };
        ProtractorHarnessEnvironment.prototype.getDocumentRoot = function () {
            return protractor.element(protractor.by.css('body'));
        };
        ProtractorHarnessEnvironment.prototype.createTestElement = function (element) {
            return new ProtractorElement(element);
        };
        ProtractorHarnessEnvironment.prototype.createEnvironment = function (element) {
            return new ProtractorHarnessEnvironment(element);
        };
        ProtractorHarnessEnvironment.prototype.getAllRawElements = function (selector) {
            return tslib.__awaiter(this, void 0, void 0, function () {
                var elementFinderArray, length, elements, i;
                return tslib.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            elementFinderArray = this.rawRootElement.all(protractor.by.css(selector));
                            return [4 /*yield*/, elementFinderArray.count()];
                        case 1:
                            length = _a.sent();
                            elements = [];
                            for (i = 0; i < length; i++) {
                                elements.push(elementFinderArray.get(i));
                            }
                            return [2 /*return*/, elements];
                    }
                });
            });
        };
        return ProtractorHarnessEnvironment;
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

    exports.ProtractorElement = ProtractorElement;
    exports.ProtractorHarnessEnvironment = ProtractorHarnessEnvironment;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=cdk-testing-protractor.umd.js.map
