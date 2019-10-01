/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/cdk/testing/testbed/unit-test-element", ["require", "exports", "tslib", "@angular/cdk/keycodes", "@angular/cdk/testing", "@angular/cdk/testing/test-element"], factory);
    }
})(function (require, exports) {
    "use strict";
    var _a;
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var keyCodes = require("@angular/cdk/keycodes");
    var testing_1 = require("@angular/cdk/testing");
    var test_element_1 = require("@angular/cdk/testing/test-element");
    /** Maps `TestKey` constants to the `keyCode` and `key` values used by native browser events. */
    var keyMap = (_a = {},
        _a[test_element_1.TestKey.BACKSPACE] = { keyCode: keyCodes.BACKSPACE, key: 'Backspace' },
        _a[test_element_1.TestKey.TAB] = { keyCode: keyCodes.TAB, key: 'Tab' },
        _a[test_element_1.TestKey.ENTER] = { keyCode: keyCodes.ENTER, key: 'Enter' },
        _a[test_element_1.TestKey.SHIFT] = { keyCode: keyCodes.SHIFT, key: 'Shift' },
        _a[test_element_1.TestKey.CONTROL] = { keyCode: keyCodes.CONTROL, key: 'Control' },
        _a[test_element_1.TestKey.ALT] = { keyCode: keyCodes.ALT, key: 'Alt' },
        _a[test_element_1.TestKey.ESCAPE] = { keyCode: keyCodes.ESCAPE, key: 'Escape' },
        _a[test_element_1.TestKey.PAGE_UP] = { keyCode: keyCodes.PAGE_UP, key: 'PageUp' },
        _a[test_element_1.TestKey.PAGE_DOWN] = { keyCode: keyCodes.PAGE_DOWN, key: 'PageDown' },
        _a[test_element_1.TestKey.END] = { keyCode: keyCodes.END, key: 'End' },
        _a[test_element_1.TestKey.HOME] = { keyCode: keyCodes.HOME, key: 'Home' },
        _a[test_element_1.TestKey.LEFT_ARROW] = { keyCode: keyCodes.LEFT_ARROW, key: 'ArrowLeft' },
        _a[test_element_1.TestKey.UP_ARROW] = { keyCode: keyCodes.UP_ARROW, key: 'ArrowUp' },
        _a[test_element_1.TestKey.RIGHT_ARROW] = { keyCode: keyCodes.RIGHT_ARROW, key: 'ArrowRight' },
        _a[test_element_1.TestKey.DOWN_ARROW] = { keyCode: keyCodes.DOWN_ARROW, key: 'ArrowDown' },
        _a[test_element_1.TestKey.INSERT] = { keyCode: keyCodes.INSERT, key: 'Insert' },
        _a[test_element_1.TestKey.DELETE] = { keyCode: keyCodes.DELETE, key: 'Delete' },
        _a[test_element_1.TestKey.F1] = { keyCode: keyCodes.F1, key: 'F1' },
        _a[test_element_1.TestKey.F2] = { keyCode: keyCodes.F2, key: 'F2' },
        _a[test_element_1.TestKey.F3] = { keyCode: keyCodes.F3, key: 'F3' },
        _a[test_element_1.TestKey.F4] = { keyCode: keyCodes.F4, key: 'F4' },
        _a[test_element_1.TestKey.F5] = { keyCode: keyCodes.F5, key: 'F5' },
        _a[test_element_1.TestKey.F6] = { keyCode: keyCodes.F6, key: 'F6' },
        _a[test_element_1.TestKey.F7] = { keyCode: keyCodes.F7, key: 'F7' },
        _a[test_element_1.TestKey.F8] = { keyCode: keyCodes.F8, key: 'F8' },
        _a[test_element_1.TestKey.F9] = { keyCode: keyCodes.F9, key: 'F9' },
        _a[test_element_1.TestKey.F10] = { keyCode: keyCodes.F10, key: 'F10' },
        _a[test_element_1.TestKey.F11] = { keyCode: keyCodes.F11, key: 'F11' },
        _a[test_element_1.TestKey.F12] = { keyCode: keyCodes.F12, key: 'F12' },
        _a[test_element_1.TestKey.META] = { keyCode: keyCodes.META, key: 'Meta' },
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
                            testing_1.triggerBlur(this.element);
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
                            if (!testing_1.isTextInput(this.element)) {
                                throw Error('Attempting to clear an invalid element');
                            }
                            testing_1.clearElement(this.element);
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
                            testing_1.dispatchMouseEvent(this.element, 'mousedown', clientX, clientY);
                            testing_1.dispatchMouseEvent(this.element, 'mouseup', clientX, clientY);
                            testing_1.dispatchMouseEvent(this.element, 'click', clientX, clientY);
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
                            testing_1.triggerFocus(this.element);
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
                            testing_1.dispatchMouseEvent(this.element, 'mouseenter');
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
                            testing_1.typeInElement.apply(void 0, tslib_1.__spread([this.element], args));
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
        UnitTestElement.prototype.forceStabilize = function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    return [2 /*return*/, this._stabilize()];
                });
            });
        };
        return UnitTestElement;
    }());
    exports.UnitTestElement = UnitTestElement;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5pdC10ZXN0LWVsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Rlc3RpbmcvdGVzdGJlZC91bml0LXRlc3QtZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7O0lBRUgsZ0RBQWtEO0lBQ2xELGdEQVE4QjtJQUM5QixrRUFBcUQ7SUFHckQsZ0dBQWdHO0lBQ2hHLElBQU0sTUFBTTtRQUNWLEdBQUMsc0JBQU8sQ0FBQyxTQUFTLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFDO1FBQ3BFLEdBQUMsc0JBQU8sQ0FBQyxHQUFHLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFDO1FBQ2xELEdBQUMsc0JBQU8sQ0FBQyxLQUFLLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFDO1FBQ3hELEdBQUMsc0JBQU8sQ0FBQyxLQUFLLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFDO1FBQ3hELEdBQUMsc0JBQU8sQ0FBQyxPQUFPLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFDO1FBQzlELEdBQUMsc0JBQU8sQ0FBQyxHQUFHLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFDO1FBQ2xELEdBQUMsc0JBQU8sQ0FBQyxNQUFNLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFDO1FBQzNELEdBQUMsc0JBQU8sQ0FBQyxPQUFPLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFDO1FBQzdELEdBQUMsc0JBQU8sQ0FBQyxTQUFTLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFDO1FBQ25FLEdBQUMsc0JBQU8sQ0FBQyxHQUFHLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFDO1FBQ2xELEdBQUMsc0JBQU8sQ0FBQyxJQUFJLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFDO1FBQ3JELEdBQUMsc0JBQU8sQ0FBQyxVQUFVLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFDO1FBQ3RFLEdBQUMsc0JBQU8sQ0FBQyxRQUFRLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFDO1FBQ2hFLEdBQUMsc0JBQU8sQ0FBQyxXQUFXLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFdBQVcsRUFBRSxHQUFHLEVBQUUsWUFBWSxFQUFDO1FBQ3pFLEdBQUMsc0JBQU8sQ0FBQyxVQUFVLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFDO1FBQ3RFLEdBQUMsc0JBQU8sQ0FBQyxNQUFNLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFDO1FBQzNELEdBQUMsc0JBQU8sQ0FBQyxNQUFNLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFDO1FBQzNELEdBQUMsc0JBQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO1FBQy9DLEdBQUMsc0JBQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO1FBQy9DLEdBQUMsc0JBQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO1FBQy9DLEdBQUMsc0JBQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO1FBQy9DLEdBQUMsc0JBQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO1FBQy9DLEdBQUMsc0JBQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO1FBQy9DLEdBQUMsc0JBQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO1FBQy9DLEdBQUMsc0JBQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO1FBQy9DLEdBQUMsc0JBQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO1FBQy9DLEdBQUMsc0JBQU8sQ0FBQyxHQUFHLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFDO1FBQ2xELEdBQUMsc0JBQU8sQ0FBQyxHQUFHLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFDO1FBQ2xELEdB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Q3hDO1FBRUssa0NBQVEsR0FBZCxVQUFlLElBQVk7Ozs7Z0NBQ3pCLHFCQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBQTs7NEJBQXZCLFNBQXVCLENBQUM7NEJBQ3hCLHNCQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBQzs7OztTQUM5QztRQUVLLHVDQUFhLEdBQW5COzs7O2dDQUNFLHFCQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBQTs7NEJBQXZCLFNBQXVCLENBQUM7NEJBQ3hCLHNCQUFPLElBQUksQ0FBQyxPQUFPLENBQUMscUJBQXFCLEVBQUUsRUFBQzs7OztTQUM3QztRQUVLLHFDQUFXLEdBQWpCLFVBQWtCLElBQVk7Ozs7Z0NBQzVCLHFCQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBQTs7NEJBQXZCLFNBQXVCLENBQUM7NEJBQ3hCLHNCQUFRLElBQUksQ0FBQyxPQUFlLENBQUMsSUFBSSxDQUFDLEVBQUM7Ozs7U0FDcEM7UUFFSyx5Q0FBZSxHQUFyQixVQUFzQixRQUFnQjs7Ozs7Z0NBQ3BDLHFCQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBQTs7NEJBQXZCLFNBQXVCLENBQUM7NEJBQ2xCLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxTQUFnQixDQUFDOzRCQUNsRCxzQkFBTyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxJQUFJLGdCQUFnQixDQUFDLG1CQUFtQixDQUFDLENBQUM7cUNBQ3hFLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFDOzs7O1NBQ25DO1FBRUssd0NBQWMsR0FBcEI7OztvQkFDRSxzQkFBTyxJQUFJLENBQUMsVUFBVSxFQUFFLEVBQUM7OztTQUMxQjtRQUNILHNCQUFDO0lBQUQsQ0FBQyxBQTlGRCxJQThGQztJQTlGWSwwQ0FBZSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyBrZXlDb2RlcyBmcm9tICdAYW5ndWxhci9jZGsva2V5Y29kZXMnO1xuaW1wb3J0IHtcbiAgY2xlYXJFbGVtZW50LFxuICBkaXNwYXRjaE1vdXNlRXZlbnQsXG4gIGlzVGV4dElucHV0LFxuICBNb2RpZmllcktleXMsXG4gIHRyaWdnZXJCbHVyLFxuICB0cmlnZ2VyRm9jdXMsXG4gIHR5cGVJbkVsZW1lbnRcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL3Rlc3RpbmcnO1xuaW1wb3J0IHtUZXN0RWxlbWVudCwgVGVzdEtleX0gZnJvbSAnLi4vdGVzdC1lbGVtZW50JztcbmltcG9ydCB7RWxlbWVudERpbWVuc2lvbnN9IGZyb20gJy4uL2VsZW1lbnQtZGltZW5zaW9ucyc7XG5cbi8qKiBNYXBzIGBUZXN0S2V5YCBjb25zdGFudHMgdG8gdGhlIGBrZXlDb2RlYCBhbmQgYGtleWAgdmFsdWVzIHVzZWQgYnkgbmF0aXZlIGJyb3dzZXIgZXZlbnRzLiAqL1xuY29uc3Qga2V5TWFwID0ge1xuICBbVGVzdEtleS5CQUNLU1BBQ0VdOiB7a2V5Q29kZToga2V5Q29kZXMuQkFDS1NQQUNFLCBrZXk6ICdCYWNrc3BhY2UnfSxcbiAgW1Rlc3RLZXkuVEFCXToge2tleUNvZGU6IGtleUNvZGVzLlRBQiwga2V5OiAnVGFiJ30sXG4gIFtUZXN0S2V5LkVOVEVSXToge2tleUNvZGU6IGtleUNvZGVzLkVOVEVSLCBrZXk6ICdFbnRlcid9LFxuICBbVGVzdEtleS5TSElGVF06IHtrZXlDb2RlOiBrZXlDb2Rlcy5TSElGVCwga2V5OiAnU2hpZnQnfSxcbiAgW1Rlc3RLZXkuQ09OVFJPTF06IHtrZXlDb2RlOiBrZXlDb2Rlcy5DT05UUk9MLCBrZXk6ICdDb250cm9sJ30sXG4gIFtUZXN0S2V5LkFMVF06IHtrZXlDb2RlOiBrZXlDb2Rlcy5BTFQsIGtleTogJ0FsdCd9LFxuICBbVGVzdEtleS5FU0NBUEVdOiB7a2V5Q29kZToga2V5Q29kZXMuRVNDQVBFLCBrZXk6ICdFc2NhcGUnfSxcbiAgW1Rlc3RLZXkuUEFHRV9VUF06IHtrZXlDb2RlOiBrZXlDb2Rlcy5QQUdFX1VQLCBrZXk6ICdQYWdlVXAnfSxcbiAgW1Rlc3RLZXkuUEFHRV9ET1dOXToge2tleUNvZGU6IGtleUNvZGVzLlBBR0VfRE9XTiwga2V5OiAnUGFnZURvd24nfSxcbiAgW1Rlc3RLZXkuRU5EXToge2tleUNvZGU6IGtleUNvZGVzLkVORCwga2V5OiAnRW5kJ30sXG4gIFtUZXN0S2V5LkhPTUVdOiB7a2V5Q29kZToga2V5Q29kZXMuSE9NRSwga2V5OiAnSG9tZSd9LFxuICBbVGVzdEtleS5MRUZUX0FSUk9XXToge2tleUNvZGU6IGtleUNvZGVzLkxFRlRfQVJST1csIGtleTogJ0Fycm93TGVmdCd9LFxuICBbVGVzdEtleS5VUF9BUlJPV106IHtrZXlDb2RlOiBrZXlDb2Rlcy5VUF9BUlJPVywga2V5OiAnQXJyb3dVcCd9LFxuICBbVGVzdEtleS5SSUdIVF9BUlJPV106IHtrZXlDb2RlOiBrZXlDb2Rlcy5SSUdIVF9BUlJPVywga2V5OiAnQXJyb3dSaWdodCd9LFxuICBbVGVzdEtleS5ET1dOX0FSUk9XXToge2tleUNvZGU6IGtleUNvZGVzLkRPV05fQVJST1csIGtleTogJ0Fycm93RG93bid9LFxuICBbVGVzdEtleS5JTlNFUlRdOiB7a2V5Q29kZToga2V5Q29kZXMuSU5TRVJULCBrZXk6ICdJbnNlcnQnfSxcbiAgW1Rlc3RLZXkuREVMRVRFXToge2tleUNvZGU6IGtleUNvZGVzLkRFTEVURSwga2V5OiAnRGVsZXRlJ30sXG4gIFtUZXN0S2V5LkYxXToge2tleUNvZGU6IGtleUNvZGVzLkYxLCBrZXk6ICdGMSd9LFxuICBbVGVzdEtleS5GMl06IHtrZXlDb2RlOiBrZXlDb2Rlcy5GMiwga2V5OiAnRjInfSxcbiAgW1Rlc3RLZXkuRjNdOiB7a2V5Q29kZToga2V5Q29kZXMuRjMsIGtleTogJ0YzJ30sXG4gIFtUZXN0S2V5LkY0XToge2tleUNvZGU6IGtleUNvZGVzLkY0LCBrZXk6ICdGNCd9LFxuICBbVGVzdEtleS5GNV06IHtrZXlDb2RlOiBrZXlDb2Rlcy5GNSwga2V5OiAnRjUnfSxcbiAgW1Rlc3RLZXkuRjZdOiB7a2V5Q29kZToga2V5Q29kZXMuRjYsIGtleTogJ0Y2J30sXG4gIFtUZXN0S2V5LkY3XToge2tleUNvZGU6IGtleUNvZGVzLkY3LCBrZXk6ICdGNyd9LFxuICBbVGVzdEtleS5GOF06IHtrZXlDb2RlOiBrZXlDb2Rlcy5GOCwga2V5OiAnRjgnfSxcbiAgW1Rlc3RLZXkuRjldOiB7a2V5Q29kZToga2V5Q29kZXMuRjksIGtleTogJ0Y5J30sXG4gIFtUZXN0S2V5LkYxMF06IHtrZXlDb2RlOiBrZXlDb2Rlcy5GMTAsIGtleTogJ0YxMCd9LFxuICBbVGVzdEtleS5GMTFdOiB7a2V5Q29kZToga2V5Q29kZXMuRjExLCBrZXk6ICdGMTEnfSxcbiAgW1Rlc3RLZXkuRjEyXToge2tleUNvZGU6IGtleUNvZGVzLkYxMiwga2V5OiAnRjEyJ30sXG4gIFtUZXN0S2V5Lk1FVEFdOiB7a2V5Q29kZToga2V5Q29kZXMuTUVUQSwga2V5OiAnTWV0YSd9XG59O1xuXG4vKiogQSBgVGVzdEVsZW1lbnRgIGltcGxlbWVudGF0aW9uIGZvciB1bml0IHRlc3RzLiAqL1xuZXhwb3J0IGNsYXNzIFVuaXRUZXN0RWxlbWVudCBpbXBsZW1lbnRzIFRlc3RFbGVtZW50IHtcbiAgY29uc3RydWN0b3IocmVhZG9ubHkgZWxlbWVudDogRWxlbWVudCwgcHJpdmF0ZSBfc3RhYmlsaXplOiAoKSA9PiBQcm9taXNlPHZvaWQ+KSB7fVxuXG4gIGFzeW5jIGJsdXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgdHJpZ2dlckJsdXIodGhpcy5lbGVtZW50IGFzIEhUTUxFbGVtZW50KTtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgfVxuXG4gIGFzeW5jIGNsZWFyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIGlmICghaXNUZXh0SW5wdXQodGhpcy5lbGVtZW50KSkge1xuICAgICAgdGhyb3cgRXJyb3IoJ0F0dGVtcHRpbmcgdG8gY2xlYXIgYW4gaW52YWxpZCBlbGVtZW50Jyk7XG4gICAgfVxuICAgIGNsZWFyRWxlbWVudCh0aGlzLmVsZW1lbnQpO1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG5cbiAgYXN5bmMgY2xpY2socmVsYXRpdmVYID0gMCwgcmVsYXRpdmVZID0gMCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIGNvbnN0IHtsZWZ0LCB0b3B9ID0gdGhpcy5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIC8vIFJvdW5kIHRoZSBjb21wdXRlZCBjbGljayBwb3NpdGlvbiBhcyBkZWNpbWFsIHBpeGVscyBhcmUgbm90XG4gICAgLy8gc3VwcG9ydGVkIGJ5IG1vdXNlIGV2ZW50cyBhbmQgY291bGQgbGVhZCB0byB1bmV4cGVjdGVkIHJlc3VsdHMuXG4gICAgY29uc3QgY2xpZW50WCA9IE1hdGgucm91bmQobGVmdCArIHJlbGF0aXZlWCk7XG4gICAgY29uc3QgY2xpZW50WSA9IE1hdGgucm91bmQodG9wICsgcmVsYXRpdmVZKTtcbiAgICBkaXNwYXRjaE1vdXNlRXZlbnQodGhpcy5lbGVtZW50LCAnbW91c2Vkb3duJywgY2xpZW50WCwgY2xpZW50WSk7XG4gICAgZGlzcGF0Y2hNb3VzZUV2ZW50KHRoaXMuZWxlbWVudCwgJ21vdXNldXAnLCBjbGllbnRYLCBjbGllbnRZKTtcbiAgICBkaXNwYXRjaE1vdXNlRXZlbnQodGhpcy5lbGVtZW50LCAnY2xpY2snLCBjbGllbnRYLCBjbGllbnRZKTtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgfVxuXG4gIGFzeW5jIGZvY3VzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIHRyaWdnZXJGb2N1cyh0aGlzLmVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpO1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG5cbiAgYXN5bmMgZ2V0Q3NzVmFsdWUocHJvcGVydHk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgLy8gVE9ETyhtbWFsZXJiYSk6IENvbnNpZGVyIGFkZGluZyB2YWx1ZSBub3JtYWxpemF0aW9uIGlmIHdlIHJ1biBpbnRvIGNvbW1vbiBjYXNlcyB3aGVyZSBpdHNcbiAgICAvLyAgbmVlZGVkLlxuICAgIHJldHVybiBnZXRDb21wdXRlZFN0eWxlKHRoaXMuZWxlbWVudCkuZ2V0UHJvcGVydHlWYWx1ZShwcm9wZXJ0eSk7XG4gIH1cblxuICBhc3luYyBob3ZlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICBkaXNwYXRjaE1vdXNlRXZlbnQodGhpcy5lbGVtZW50LCAnbW91c2VlbnRlcicpO1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG5cbiAgYXN5bmMgc2VuZEtleXMoLi4ua2V5czogKHN0cmluZyB8IFRlc3RLZXkpW10pOiBQcm9taXNlPHZvaWQ+O1xuICBhc3luYyBzZW5kS2V5cyhtb2RpZmllcnM6IE1vZGlmaWVyS2V5cywgLi4ua2V5czogKHN0cmluZyB8IFRlc3RLZXkpW10pOiBQcm9taXNlPHZvaWQ+O1xuICBhc3luYyBzZW5kS2V5cyguLi5tb2RpZmllcnNBbmRLZXlzOiBhbnlbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIGNvbnN0IGFyZ3MgPSBtb2RpZmllcnNBbmRLZXlzLm1hcChrID0+IHR5cGVvZiBrID09PSAnbnVtYmVyJyA/IGtleU1hcFtrIGFzIFRlc3RLZXldIDogayk7XG4gICAgdHlwZUluRWxlbWVudCh0aGlzLmVsZW1lbnQgYXMgSFRNTEVsZW1lbnQsIC4uLmFyZ3MpO1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG5cbiAgYXN5bmMgdGV4dCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIHJldHVybiAodGhpcy5lbGVtZW50LnRleHRDb250ZW50IHx8ICcnKS50cmltKCk7XG4gIH1cblxuICBhc3luYyBnZXRBdHRyaWJ1dGUobmFtZTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmd8bnVsbD4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICB9XG5cbiAgYXN5bmMgaGFzQ2xhc3MobmFtZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMobmFtZSk7XG4gIH1cblxuICBhc3luYyBnZXREaW1lbnNpb25zKCk6IFByb21pc2U8RWxlbWVudERpbWVuc2lvbnM+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICB9XG5cbiAgYXN5bmMgZ2V0UHJvcGVydHkobmFtZTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICByZXR1cm4gKHRoaXMuZWxlbWVudCBhcyBhbnkpW25hbWVdO1xuICB9XG5cbiAgYXN5bmMgbWF0Y2hlc1NlbGVjdG9yKHNlbGVjdG9yOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICBjb25zdCBlbGVtZW50UHJvdG90eXBlID0gRWxlbWVudC5wcm90b3R5cGUgYXMgYW55O1xuICAgIHJldHVybiAoZWxlbWVudFByb3RvdHlwZVsnbWF0Y2hlcyddIHx8IGVsZW1lbnRQcm90b3R5cGVbJ21zTWF0Y2hlc1NlbGVjdG9yJ10pXG4gICAgICAgIC5jYWxsKHRoaXMuZWxlbWVudCwgc2VsZWN0b3IpO1xuICB9XG5cbiAgYXN5bmMgZm9yY2VTdGFiaWxpemUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG59XG4iXX0=