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
        return UnitTestElement;
    }());
    exports.UnitTestElement = UnitTestElement;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5pdC10ZXN0LWVsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Rlc3RpbmcvdGVzdGJlZC91bml0LXRlc3QtZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7O0lBRUgsZ0RBQWtEO0lBQ2xELGdEQVE4QjtJQUM5QixrRUFBcUQ7SUFHckQsZ0dBQWdHO0lBQ2hHLElBQU0sTUFBTTtRQUNWLEdBQUMsc0JBQU8sQ0FBQyxTQUFTLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFDO1FBQ3BFLEdBQUMsc0JBQU8sQ0FBQyxHQUFHLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFDO1FBQ2xELEdBQUMsc0JBQU8sQ0FBQyxLQUFLLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFDO1FBQ3hELEdBQUMsc0JBQU8sQ0FBQyxLQUFLLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFDO1FBQ3hELEdBQUMsc0JBQU8sQ0FBQyxPQUFPLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFDO1FBQzlELEdBQUMsc0JBQU8sQ0FBQyxHQUFHLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFDO1FBQ2xELEdBQUMsc0JBQU8sQ0FBQyxNQUFNLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFDO1FBQzNELEdBQUMsc0JBQU8sQ0FBQyxPQUFPLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFDO1FBQzdELEdBQUMsc0JBQU8sQ0FBQyxTQUFTLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFDO1FBQ25FLEdBQUMsc0JBQU8sQ0FBQyxHQUFHLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFDO1FBQ2xELEdBQUMsc0JBQU8sQ0FBQyxJQUFJLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFDO1FBQ3JELEdBQUMsc0JBQU8sQ0FBQyxVQUFVLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFDO1FBQ3RFLEdBQUMsc0JBQU8sQ0FBQyxRQUFRLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFDO1FBQ2hFLEdBQUMsc0JBQU8sQ0FBQyxXQUFXLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFdBQVcsRUFBRSxHQUFHLEVBQUUsWUFBWSxFQUFDO1FBQ3pFLEdBQUMsc0JBQU8sQ0FBQyxVQUFVLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFDO1FBQ3RFLEdBQUMsc0JBQU8sQ0FBQyxNQUFNLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFDO1FBQzNELEdBQUMsc0JBQU8sQ0FBQyxNQUFNLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFDO1FBQzNELEdBQUMsc0JBQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO1FBQy9DLEdBQUMsc0JBQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO1FBQy9DLEdBQUMsc0JBQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO1FBQy9DLEdBQUMsc0JBQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO1FBQy9DLEdBQUMsc0JBQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO1FBQy9DLEdBQUMsc0JBQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO1FBQy9DLEdBQUMsc0JBQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO1FBQy9DLEdBQUMsc0JBQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO1FBQy9DLEdBQUMsc0JBQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO1FBQy9DLEdBQUMsc0JBQU8sQ0FBQyxHQUFHLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFDO1FBQ2xELEdBQUMsc0JBQU8sQ0FBQyxHQUFHLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFDO1FBQ2xELEdB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Q3hDO1FBRUssa0NBQVEsR0FBZCxVQUFlLElBQVk7Ozs7Z0NBQ3pCLHFCQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBQTs7NEJBQXZCLFNBQXVCLENBQUM7NEJBQ3hCLHNCQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBQzs7OztTQUM5QztRQUVLLHVDQUFhLEdBQW5COzs7O2dDQUNFLHFCQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBQTs7NEJBQXZCLFNBQXVCLENBQUM7NEJBQ3hCLHNCQUFPLElBQUksQ0FBQyxPQUFPLENBQUMscUJBQXFCLEVBQUUsRUFBQzs7OztTQUM3QztRQUVLLHFDQUFXLEdBQWpCLFVBQWtCLElBQVk7Ozs7Z0NBQzVCLHFCQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBQTs7NEJBQXZCLFNBQXVCLENBQUM7NEJBQ3hCLHNCQUFRLElBQUksQ0FBQyxPQUFlLENBQUMsSUFBSSxDQUFDLEVBQUM7Ozs7U0FDcEM7UUFFSyx5Q0FBZSxHQUFyQixVQUFzQixRQUFnQjs7Ozs7Z0NBQ3BDLHFCQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBQTs7NEJBQXZCLFNBQXVCLENBQUM7NEJBQ2xCLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxTQUFnQixDQUFDOzRCQUNsRCxzQkFBTyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxJQUFJLGdCQUFnQixDQUFDLG1CQUFtQixDQUFDLENBQUM7cUNBQ3hFLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFDOzs7O1NBQ25DO1FBQ0gsc0JBQUM7SUFBRCxDQUFDLEFBMUZELElBMEZDO0lBMUZZLDBDQUFlIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIGtleUNvZGVzIGZyb20gJ0Bhbmd1bGFyL2Nkay9rZXljb2Rlcyc7XG5pbXBvcnQge1xuICBjbGVhckVsZW1lbnQsXG4gIGRpc3BhdGNoTW91c2VFdmVudCxcbiAgaXNUZXh0SW5wdXQsXG4gIE1vZGlmaWVyS2V5cyxcbiAgdHJpZ2dlckJsdXIsXG4gIHRyaWdnZXJGb2N1cyxcbiAgdHlwZUluRWxlbWVudFxufSBmcm9tICdAYW5ndWxhci9jZGsvdGVzdGluZyc7XG5pbXBvcnQge1Rlc3RFbGVtZW50LCBUZXN0S2V5fSBmcm9tICcuLi90ZXN0LWVsZW1lbnQnO1xuaW1wb3J0IHtFbGVtZW50RGltZW5zaW9uc30gZnJvbSAnLi4vZWxlbWVudC1kaW1lbnNpb25zJztcblxuLyoqIE1hcHMgYFRlc3RLZXlgIGNvbnN0YW50cyB0byB0aGUgYGtleUNvZGVgIGFuZCBga2V5YCB2YWx1ZXMgdXNlZCBieSBuYXRpdmUgYnJvd3NlciBldmVudHMuICovXG5jb25zdCBrZXlNYXAgPSB7XG4gIFtUZXN0S2V5LkJBQ0tTUEFDRV06IHtrZXlDb2RlOiBrZXlDb2Rlcy5CQUNLU1BBQ0UsIGtleTogJ0JhY2tzcGFjZSd9LFxuICBbVGVzdEtleS5UQUJdOiB7a2V5Q29kZToga2V5Q29kZXMuVEFCLCBrZXk6ICdUYWInfSxcbiAgW1Rlc3RLZXkuRU5URVJdOiB7a2V5Q29kZToga2V5Q29kZXMuRU5URVIsIGtleTogJ0VudGVyJ30sXG4gIFtUZXN0S2V5LlNISUZUXToge2tleUNvZGU6IGtleUNvZGVzLlNISUZULCBrZXk6ICdTaGlmdCd9LFxuICBbVGVzdEtleS5DT05UUk9MXToge2tleUNvZGU6IGtleUNvZGVzLkNPTlRST0wsIGtleTogJ0NvbnRyb2wnfSxcbiAgW1Rlc3RLZXkuQUxUXToge2tleUNvZGU6IGtleUNvZGVzLkFMVCwga2V5OiAnQWx0J30sXG4gIFtUZXN0S2V5LkVTQ0FQRV06IHtrZXlDb2RlOiBrZXlDb2Rlcy5FU0NBUEUsIGtleTogJ0VzY2FwZSd9LFxuICBbVGVzdEtleS5QQUdFX1VQXToge2tleUNvZGU6IGtleUNvZGVzLlBBR0VfVVAsIGtleTogJ1BhZ2VVcCd9LFxuICBbVGVzdEtleS5QQUdFX0RPV05dOiB7a2V5Q29kZToga2V5Q29kZXMuUEFHRV9ET1dOLCBrZXk6ICdQYWdlRG93bid9LFxuICBbVGVzdEtleS5FTkRdOiB7a2V5Q29kZToga2V5Q29kZXMuRU5ELCBrZXk6ICdFbmQnfSxcbiAgW1Rlc3RLZXkuSE9NRV06IHtrZXlDb2RlOiBrZXlDb2Rlcy5IT01FLCBrZXk6ICdIb21lJ30sXG4gIFtUZXN0S2V5LkxFRlRfQVJST1ddOiB7a2V5Q29kZToga2V5Q29kZXMuTEVGVF9BUlJPVywga2V5OiAnQXJyb3dMZWZ0J30sXG4gIFtUZXN0S2V5LlVQX0FSUk9XXToge2tleUNvZGU6IGtleUNvZGVzLlVQX0FSUk9XLCBrZXk6ICdBcnJvd1VwJ30sXG4gIFtUZXN0S2V5LlJJR0hUX0FSUk9XXToge2tleUNvZGU6IGtleUNvZGVzLlJJR0hUX0FSUk9XLCBrZXk6ICdBcnJvd1JpZ2h0J30sXG4gIFtUZXN0S2V5LkRPV05fQVJST1ddOiB7a2V5Q29kZToga2V5Q29kZXMuRE9XTl9BUlJPVywga2V5OiAnQXJyb3dEb3duJ30sXG4gIFtUZXN0S2V5LklOU0VSVF06IHtrZXlDb2RlOiBrZXlDb2Rlcy5JTlNFUlQsIGtleTogJ0luc2VydCd9LFxuICBbVGVzdEtleS5ERUxFVEVdOiB7a2V5Q29kZToga2V5Q29kZXMuREVMRVRFLCBrZXk6ICdEZWxldGUnfSxcbiAgW1Rlc3RLZXkuRjFdOiB7a2V5Q29kZToga2V5Q29kZXMuRjEsIGtleTogJ0YxJ30sXG4gIFtUZXN0S2V5LkYyXToge2tleUNvZGU6IGtleUNvZGVzLkYyLCBrZXk6ICdGMid9LFxuICBbVGVzdEtleS5GM106IHtrZXlDb2RlOiBrZXlDb2Rlcy5GMywga2V5OiAnRjMnfSxcbiAgW1Rlc3RLZXkuRjRdOiB7a2V5Q29kZToga2V5Q29kZXMuRjQsIGtleTogJ0Y0J30sXG4gIFtUZXN0S2V5LkY1XToge2tleUNvZGU6IGtleUNvZGVzLkY1LCBrZXk6ICdGNSd9LFxuICBbVGVzdEtleS5GNl06IHtrZXlDb2RlOiBrZXlDb2Rlcy5GNiwga2V5OiAnRjYnfSxcbiAgW1Rlc3RLZXkuRjddOiB7a2V5Q29kZToga2V5Q29kZXMuRjcsIGtleTogJ0Y3J30sXG4gIFtUZXN0S2V5LkY4XToge2tleUNvZGU6IGtleUNvZGVzLkY4LCBrZXk6ICdGOCd9LFxuICBbVGVzdEtleS5GOV06IHtrZXlDb2RlOiBrZXlDb2Rlcy5GOSwga2V5OiAnRjknfSxcbiAgW1Rlc3RLZXkuRjEwXToge2tleUNvZGU6IGtleUNvZGVzLkYxMCwga2V5OiAnRjEwJ30sXG4gIFtUZXN0S2V5LkYxMV06IHtrZXlDb2RlOiBrZXlDb2Rlcy5GMTEsIGtleTogJ0YxMSd9LFxuICBbVGVzdEtleS5GMTJdOiB7a2V5Q29kZToga2V5Q29kZXMuRjEyLCBrZXk6ICdGMTInfSxcbiAgW1Rlc3RLZXkuTUVUQV06IHtrZXlDb2RlOiBrZXlDb2Rlcy5NRVRBLCBrZXk6ICdNZXRhJ31cbn07XG5cbi8qKiBBIGBUZXN0RWxlbWVudGAgaW1wbGVtZW50YXRpb24gZm9yIHVuaXQgdGVzdHMuICovXG5leHBvcnQgY2xhc3MgVW5pdFRlc3RFbGVtZW50IGltcGxlbWVudHMgVGVzdEVsZW1lbnQge1xuICBjb25zdHJ1Y3RvcihyZWFkb25seSBlbGVtZW50OiBFbGVtZW50LCBwcml2YXRlIF9zdGFiaWxpemU6ICgpID0+IFByb21pc2U8dm9pZD4pIHt9XG5cbiAgYXN5bmMgYmx1cigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICB0cmlnZ2VyQmx1cih0aGlzLmVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpO1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG5cbiAgYXN5bmMgY2xlYXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgaWYgKCFpc1RleHRJbnB1dCh0aGlzLmVsZW1lbnQpKSB7XG4gICAgICB0aHJvdyBFcnJvcignQXR0ZW1wdGluZyB0byBjbGVhciBhbiBpbnZhbGlkIGVsZW1lbnQnKTtcbiAgICB9XG4gICAgY2xlYXJFbGVtZW50KHRoaXMuZWxlbWVudCk7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gIH1cblxuICBhc3luYyBjbGljayhyZWxhdGl2ZVggPSAwLCByZWxhdGl2ZVkgPSAwKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgY29uc3Qge2xlZnQsIHRvcH0gPSB0aGlzLmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgLy8gUm91bmQgdGhlIGNvbXB1dGVkIGNsaWNrIHBvc2l0aW9uIGFzIGRlY2ltYWwgcGl4ZWxzIGFyZSBub3RcbiAgICAvLyBzdXBwb3J0ZWQgYnkgbW91c2UgZXZlbnRzIGFuZCBjb3VsZCBsZWFkIHRvIHVuZXhwZWN0ZWQgcmVzdWx0cy5cbiAgICBjb25zdCBjbGllbnRYID0gTWF0aC5yb3VuZChsZWZ0ICsgcmVsYXRpdmVYKTtcbiAgICBjb25zdCBjbGllbnRZID0gTWF0aC5yb3VuZCh0b3AgKyByZWxhdGl2ZVkpO1xuICAgIGRpc3BhdGNoTW91c2VFdmVudCh0aGlzLmVsZW1lbnQsICdtb3VzZWRvd24nLCBjbGllbnRYLCBjbGllbnRZKTtcbiAgICBkaXNwYXRjaE1vdXNlRXZlbnQodGhpcy5lbGVtZW50LCAnbW91c2V1cCcsIGNsaWVudFgsIGNsaWVudFkpO1xuICAgIGRpc3BhdGNoTW91c2VFdmVudCh0aGlzLmVsZW1lbnQsICdjbGljaycsIGNsaWVudFgsIGNsaWVudFkpO1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG5cbiAgYXN5bmMgZm9jdXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgdHJpZ2dlckZvY3VzKHRoaXMuZWxlbWVudCBhcyBIVE1MRWxlbWVudCk7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gIH1cblxuICBhc3luYyBnZXRDc3NWYWx1ZShwcm9wZXJ0eTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICAvLyBUT0RPKG1tYWxlcmJhKTogQ29uc2lkZXIgYWRkaW5nIHZhbHVlIG5vcm1hbGl6YXRpb24gaWYgd2UgcnVuIGludG8gY29tbW9uIGNhc2VzIHdoZXJlIGl0c1xuICAgIC8vICBuZWVkZWQuXG4gICAgcmV0dXJuIGdldENvbXB1dGVkU3R5bGUodGhpcy5lbGVtZW50KS5nZXRQcm9wZXJ0eVZhbHVlKHByb3BlcnR5KTtcbiAgfVxuXG4gIGFzeW5jIGhvdmVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIGRpc3BhdGNoTW91c2VFdmVudCh0aGlzLmVsZW1lbnQsICdtb3VzZWVudGVyJyk7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gIH1cblxuICBhc3luYyBzZW5kS2V5cyguLi5rZXlzOiAoc3RyaW5nIHwgVGVzdEtleSlbXSk6IFByb21pc2U8dm9pZD47XG4gIGFzeW5jIHNlbmRLZXlzKG1vZGlmaWVyczogTW9kaWZpZXJLZXlzLCAuLi5rZXlzOiAoc3RyaW5nIHwgVGVzdEtleSlbXSk6IFByb21pc2U8dm9pZD47XG4gIGFzeW5jIHNlbmRLZXlzKC4uLm1vZGlmaWVyc0FuZEtleXM6IGFueVtdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgY29uc3QgYXJncyA9IG1vZGlmaWVyc0FuZEtleXMubWFwKGsgPT4gdHlwZW9mIGsgPT09ICdudW1iZXInID8ga2V5TWFwW2sgYXMgVGVzdEtleV0gOiBrKTtcbiAgICB0eXBlSW5FbGVtZW50KHRoaXMuZWxlbWVudCBhcyBIVE1MRWxlbWVudCwgLi4uYXJncyk7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gIH1cblxuICBhc3luYyB0ZXh0KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgcmV0dXJuICh0aGlzLmVsZW1lbnQudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKTtcbiAgfVxuXG4gIGFzeW5jIGdldEF0dHJpYnV0ZShuYW1lOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ3xudWxsPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudC5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gIH1cblxuICBhc3luYyBoYXNDbGFzcyhuYW1lOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhuYW1lKTtcbiAgfVxuXG4gIGFzeW5jIGdldERpbWVuc2lvbnMoKTogUHJvbWlzZTxFbGVtZW50RGltZW5zaW9ucz4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIH1cblxuICBhc3luYyBnZXRQcm9wZXJ0eShuYW1lOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIHJldHVybiAodGhpcy5lbGVtZW50IGFzIGFueSlbbmFtZV07XG4gIH1cblxuICBhc3luYyBtYXRjaGVzU2VsZWN0b3Ioc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIGNvbnN0IGVsZW1lbnRQcm90b3R5cGUgPSBFbGVtZW50LnByb3RvdHlwZSBhcyBhbnk7XG4gICAgcmV0dXJuIChlbGVtZW50UHJvdG90eXBlWydtYXRjaGVzJ10gfHwgZWxlbWVudFByb3RvdHlwZVsnbXNNYXRjaGVzU2VsZWN0b3InXSlcbiAgICAgICAgLmNhbGwodGhpcy5lbGVtZW50LCBzZWxlY3Rvcik7XG4gIH1cbn1cbiJdfQ==