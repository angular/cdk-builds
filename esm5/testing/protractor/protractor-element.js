/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var _a;
import * as tslib_1 from "tslib";
import { browser, Key } from 'protractor';
import { TestKey } from '../test-element';
/** Maps the `TestKey` constants to Protractor's `Key` constants. */
var keyMap = (_a = {},
    _a[TestKey.BACKSPACE] = Key.BACK_SPACE,
    _a[TestKey.TAB] = Key.TAB,
    _a[TestKey.ENTER] = Key.ENTER,
    _a[TestKey.SHIFT] = Key.SHIFT,
    _a[TestKey.CONTROL] = Key.CONTROL,
    _a[TestKey.ALT] = Key.ALT,
    _a[TestKey.ESCAPE] = Key.ESCAPE,
    _a[TestKey.PAGE_UP] = Key.PAGE_UP,
    _a[TestKey.PAGE_DOWN] = Key.PAGE_DOWN,
    _a[TestKey.END] = Key.END,
    _a[TestKey.HOME] = Key.HOME,
    _a[TestKey.LEFT_ARROW] = Key.ARROW_LEFT,
    _a[TestKey.UP_ARROW] = Key.ARROW_UP,
    _a[TestKey.RIGHT_ARROW] = Key.ARROW_RIGHT,
    _a[TestKey.DOWN_ARROW] = Key.ARROW_DOWN,
    _a[TestKey.INSERT] = Key.INSERT,
    _a[TestKey.DELETE] = Key.DELETE,
    _a[TestKey.F1] = Key.F1,
    _a[TestKey.F2] = Key.F2,
    _a[TestKey.F3] = Key.F3,
    _a[TestKey.F4] = Key.F4,
    _a[TestKey.F5] = Key.F5,
    _a[TestKey.F6] = Key.F6,
    _a[TestKey.F7] = Key.F7,
    _a[TestKey.F8] = Key.F8,
    _a[TestKey.F9] = Key.F9,
    _a[TestKey.F10] = Key.F10,
    _a[TestKey.F11] = Key.F11,
    _a[TestKey.F12] = Key.F12,
    _a[TestKey.META] = Key.META,
    _a);
/** Converts a `ModifierKeys` object to a list of Protractor `Key`s. */
function toProtractorModifierKeys(modifiers) {
    var result = [];
    if (modifiers.control) {
        result.push(Key.CONTROL);
    }
    if (modifiers.alt) {
        result.push(Key.ALT);
    }
    if (modifiers.shift) {
        result.push(Key.SHIFT);
    }
    if (modifiers.meta) {
        result.push(Key.META);
    }
    return result;
}
/** A `TestElement` implementation for Protractor. */
var ProtractorElement = /** @class */ (function () {
    function ProtractorElement(element) {
        this.element = element;
    }
    ProtractorElement.prototype.blur = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, browser.executeScript('arguments[0].blur()', this.element)];
            });
        });
    };
    ProtractorElement.prototype.clear = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, this.element.clear()];
            });
        });
    };
    ProtractorElement.prototype.click = function (relativeX, relativeY) {
        if (relativeX === void 0) { relativeX = 0; }
        if (relativeY === void 0) { relativeY = 0; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _b = (_a = browser.actions()).mouseMove;
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
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, browser.executeScript('arguments[0].focus()', this.element)];
            });
        });
    };
    ProtractorElement.prototype.getCssValue = function (property) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, this.element.getCssValue(property)];
            });
        });
    };
    ProtractorElement.prototype.hover = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _b = (_a = browser.actions()).mouseMove;
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
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var first, modifiers, rest, modifierKeys, keys;
            var _a;
            return tslib_1.__generator(this, function (_b) {
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
                    .map(function (k) { return Key.chord.apply(Key, tslib_1.__spread(modifierKeys, [k])); });
                return [2 /*return*/, (_a = this.element).sendKeys.apply(_a, tslib_1.__spread(keys))];
            });
        });
    };
    ProtractorElement.prototype.text = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, this.element.getText()];
            });
        });
    };
    ProtractorElement.prototype.getAttribute = function (name) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, browser.executeScript("return arguments[0].getAttribute(arguments[1])", this.element, name)];
            });
        });
    };
    ProtractorElement.prototype.hasClass = function (name) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var classes;
            return tslib_1.__generator(this, function (_a) {
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
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, width, height, _b, left, top;
            return tslib_1.__generator(this, function (_c) {
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
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, browser.executeScript("return arguments[0][arguments[1]]", this.element, name)];
            });
        });
    };
    ProtractorElement.prototype.matchesSelector = function (selector) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, browser.executeScript("\n          return (Element.prototype.matches ||\n                  Element.prototype.msMatchesSelector).call(arguments[0], arguments[1])\n          ", this.element, selector)];
            });
        });
    };
    return ProtractorElement;
}());
export { ProtractorElement };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdHJhY3Rvci1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Byb3RyYWN0b3IvcHJvdHJhY3Rvci1lbGVtZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7O0FBR0gsT0FBTyxFQUFDLE9BQU8sRUFBaUIsR0FBRyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBRXZELE9BQU8sRUFBYyxPQUFPLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUVyRCxvRUFBb0U7QUFDcEUsSUFBTSxNQUFNO0lBQ1YsR0FBQyxPQUFPLENBQUMsU0FBUyxJQUFHLEdBQUcsQ0FBQyxVQUFVO0lBQ25DLEdBQUMsT0FBTyxDQUFDLEdBQUcsSUFBRyxHQUFHLENBQUMsR0FBRztJQUN0QixHQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUcsR0FBRyxDQUFDLEtBQUs7SUFDMUIsR0FBQyxPQUFPLENBQUMsS0FBSyxJQUFHLEdBQUcsQ0FBQyxLQUFLO0lBQzFCLEdBQUMsT0FBTyxDQUFDLE9BQU8sSUFBRyxHQUFHLENBQUMsT0FBTztJQUM5QixHQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUcsR0FBRyxDQUFDLEdBQUc7SUFDdEIsR0FBQyxPQUFPLENBQUMsTUFBTSxJQUFHLEdBQUcsQ0FBQyxNQUFNO0lBQzVCLEdBQUMsT0FBTyxDQUFDLE9BQU8sSUFBRyxHQUFHLENBQUMsT0FBTztJQUM5QixHQUFDLE9BQU8sQ0FBQyxTQUFTLElBQUcsR0FBRyxDQUFDLFNBQVM7SUFDbEMsR0FBQyxPQUFPLENBQUMsR0FBRyxJQUFHLEdBQUcsQ0FBQyxHQUFHO0lBQ3RCLEdBQUMsT0FBTyxDQUFDLElBQUksSUFBRyxHQUFHLENBQUMsSUFBSTtJQUN4QixHQUFDLE9BQU8sQ0FBQyxVQUFVLElBQUcsR0FBRyxDQUFDLFVBQVU7SUFDcEMsR0FBQyxPQUFPLENBQUMsUUFBUSxJQUFHLEdBQUcsQ0FBQyxRQUFRO0lBQ2hDLEdBQUMsT0FBTyxDQUFDLFdBQVcsSUFBRyxHQUFHLENBQUMsV0FBVztJQUN0QyxHQUFDLE9BQU8sQ0FBQyxVQUFVLElBQUcsR0FBRyxDQUFDLFVBQVU7SUFDcEMsR0FBQyxPQUFPLENBQUMsTUFBTSxJQUFHLEdBQUcsQ0FBQyxNQUFNO0lBQzVCLEdBQUMsT0FBTyxDQUFDLE1BQU0sSUFBRyxHQUFHLENBQUMsTUFBTTtJQUM1QixHQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUcsR0FBRyxDQUFDLEVBQUU7SUFDcEIsR0FBQyxPQUFPLENBQUMsRUFBRSxJQUFHLEdBQUcsQ0FBQyxFQUFFO0lBQ3BCLEdBQUMsT0FBTyxDQUFDLEVBQUUsSUFBRyxHQUFHLENBQUMsRUFBRTtJQUNwQixHQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUcsR0FBRyxDQUFDLEVBQUU7SUFDcEIsR0FBQyxPQUFPLENBQUMsRUFBRSxJQUFHLEdBQUcsQ0FBQyxFQUFFO0lBQ3BCLEdBQUMsT0FBTyxDQUFDLEVBQUUsSUFBRyxHQUFHLENBQUMsRUFBRTtJQUNwQixHQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUcsR0FBRyxDQUFDLEVBQUU7SUFDcEIsR0FBQyxPQUFPLENBQUMsRUFBRSxJQUFHLEdBQUcsQ0FBQyxFQUFFO0lBQ3BCLEdBQUMsT0FBTyxDQUFDLEVBQUUsSUFBRyxHQUFHLENBQUMsRUFBRTtJQUNwQixHQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUcsR0FBRyxDQUFDLEdBQUc7SUFDdEIsR0FBQyxPQUFPLENBQUMsR0FBRyxJQUFHLEdBQUcsQ0FBQyxHQUFHO0lBQ3RCLEdBQUMsT0FBTyxDQUFDLEdBQUcsSUFBRyxHQUFHLENBQUMsR0FBRztJQUN0QixHQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUcsR0FBRyxDQUFDLElBQUk7T0FDekIsQ0FBQztBQUVGLHVFQUF1RTtBQUN2RSxTQUFTLHdCQUF3QixDQUFDLFNBQXVCO0lBQ3ZELElBQU0sTUFBTSxHQUFhLEVBQUUsQ0FBQztJQUM1QixJQUFJLFNBQVMsQ0FBQyxPQUFPLEVBQUU7UUFDckIsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDMUI7SUFDRCxJQUFJLFNBQVMsQ0FBQyxHQUFHLEVBQUU7UUFDakIsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDdEI7SUFDRCxJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQUU7UUFDbkIsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDeEI7SUFDRCxJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQUU7UUFDbEIsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDdkI7SUFDRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBRUQscURBQXFEO0FBQ3JEO0lBQ0UsMkJBQXFCLE9BQXNCO1FBQXRCLFlBQU8sR0FBUCxPQUFPLENBQWU7SUFBRyxDQUFDO0lBRXpDLGdDQUFJLEdBQVY7OztnQkFDRSxzQkFBTyxPQUFPLENBQUMsYUFBYSxDQUFDLHFCQUFxQixFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBQzs7O0tBQ25FO0lBRUssaUNBQUssR0FBWDs7O2dCQUNFLHNCQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUM7OztLQUM3QjtJQUVLLGlDQUFLLEdBQVgsVUFBWSxTQUFhLEVBQUUsU0FBYTtRQUE1QiwwQkFBQSxFQUFBLGFBQWE7UUFBRSwwQkFBQSxFQUFBLGFBQWE7Ozs7Ozt3QkFDaEMsS0FBQSxDQUFBLEtBQUEsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFBLENBQ3BCLFNBQVMsQ0FBQTt3QkFBQyxxQkFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxFQUFBOzRCQUQvQyxxQkFBTSxjQUNPLFNBQWtDLEVBQUUsRUFBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUMsRUFBQzs2QkFDM0UsS0FBSyxFQUFFOzZCQUNQLE9BQU8sRUFBRSxFQUFBOzt3QkFIWixTQUdZLENBQUM7Ozs7O0tBQ2Q7SUFFSyxpQ0FBSyxHQUFYOzs7Z0JBQ0Usc0JBQU8sT0FBTyxDQUFDLGFBQWEsQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUM7OztLQUNwRTtJQUVLLHVDQUFXLEdBQWpCLFVBQWtCLFFBQWdCOzs7Z0JBQ2hDLHNCQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxFQUFDOzs7S0FDM0M7SUFFSyxpQ0FBSyxHQUFYOzs7Ozs7d0JBQ1MsS0FBQSxDQUFBLEtBQUEsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFBLENBQ25CLFNBQVMsQ0FBQTt3QkFBQyxxQkFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxFQUFBOzRCQURqRCxzQkFBTyxjQUNRLFNBQWtDLEVBQUM7NkJBQzdDLE9BQU8sRUFBRSxFQUFDOzs7O0tBQ2hCO0lBSUssb0NBQVEsR0FBZDtRQUFlLDBCQUEwQjthQUExQixVQUEwQixFQUExQixxQkFBMEIsRUFBMUIsSUFBMEI7WUFBMUIscUNBQTBCOzs7Ozs7Z0JBQ2pDLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFHbEMsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO29CQUMxRCxTQUFTLEdBQUcsS0FBSyxDQUFDO29CQUNsQixJQUFJLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUNsQztxQkFBTTtvQkFDTCxTQUFTLEdBQUcsRUFBRSxDQUFDO29CQUNmLElBQUksR0FBRyxnQkFBZ0IsQ0FBQztpQkFDekI7Z0JBRUssWUFBWSxHQUFHLHdCQUF3QixDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNuRCxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLE9BQU8sQ0FBQyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBakQsQ0FBaUQsQ0FBQztxQkFDeEUsTUFBTSxDQUFDLFVBQUMsR0FBRyxFQUFFLENBQUMsSUFBSyxPQUFBLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQWIsQ0FBYSxFQUFFLEVBQUUsQ0FBQztxQkFDckMsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsR0FBRyxDQUFDLEtBQUssT0FBVCxHQUFHLG1CQUFVLFlBQVksR0FBRSxDQUFDLEtBQTVCLENBQTZCLENBQUMsQ0FBQztnQkFFN0Msc0JBQU8sQ0FBQSxLQUFBLElBQUksQ0FBQyxPQUFPLENBQUEsQ0FBQyxRQUFRLDRCQUFJLElBQUksSUFBRTs7O0tBQ3ZDO0lBRUssZ0NBQUksR0FBVjs7O2dCQUNFLHNCQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLEVBQUM7OztLQUMvQjtJQUVLLHdDQUFZLEdBQWxCLFVBQW1CLElBQVk7OztnQkFDN0Isc0JBQU8sT0FBTyxDQUFDLGFBQWEsQ0FDeEIsZ0RBQWdELEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsRUFBQzs7O0tBQzNFO0lBRUssb0NBQVEsR0FBZCxVQUFlLElBQVk7Ozs7OzRCQUNSLHFCQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUE7O3dCQUEzQyxPQUFPLEdBQUcsQ0FBQyxTQUFnQyxDQUFDLElBQUksRUFBRTt3QkFDeEQsc0JBQU8sSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLEVBQUQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUM7Ozs7S0FDL0Q7SUFFSyx5Q0FBYSxHQUFuQjs7Ozs7NEJBQzBCLHFCQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLEVBQUE7O3dCQUE5QyxLQUFrQixTQUE0QixFQUE3QyxLQUFLLFdBQUEsRUFBRSxNQUFNLFlBQUE7d0JBQ00scUJBQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsRUFBQTs7d0JBQXBELEtBQW9CLFNBQWdDLEVBQWhELElBQUksT0FBQSxFQUFLLEdBQUcsT0FBQTt3QkFDdEIsc0JBQU8sRUFBQyxLQUFLLE9BQUEsRUFBRSxNQUFNLFFBQUEsRUFBRSxJQUFJLE1BQUEsRUFBRSxHQUFHLEtBQUEsRUFBQyxFQUFDOzs7O0tBQ25DO0lBRUssdUNBQVcsR0FBakIsVUFBa0IsSUFBWTs7O2dCQUM1QixzQkFBTyxPQUFPLENBQUMsYUFBYSxDQUFDLG1DQUFtQyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLEVBQUM7OztLQUN2RjtJQUVLLDJDQUFlLEdBQXJCLFVBQXNCLFFBQWdCOzs7Z0JBQ2xDLHNCQUFPLE9BQU8sQ0FBQyxhQUFhLENBQUMsdUpBR3hCLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsRUFBQzs7O0tBQ2xDO0lBQ0gsd0JBQUM7QUFBRCxDQUFDLEFBcEZELElBb0ZDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7TW9kaWZpZXJLZXlzfSBmcm9tICdAYW5ndWxhci9jZGsvdGVzdGluZyc7XG5pbXBvcnQge2Jyb3dzZXIsIEVsZW1lbnRGaW5kZXIsIEtleX0gZnJvbSAncHJvdHJhY3Rvcic7XG5pbXBvcnQge0VsZW1lbnREaW1lbnNpb25zfSBmcm9tICcuLi9lbGVtZW50LWRpbWVuc2lvbnMnO1xuaW1wb3J0IHtUZXN0RWxlbWVudCwgVGVzdEtleX0gZnJvbSAnLi4vdGVzdC1lbGVtZW50JztcblxuLyoqIE1hcHMgdGhlIGBUZXN0S2V5YCBjb25zdGFudHMgdG8gUHJvdHJhY3RvcidzIGBLZXlgIGNvbnN0YW50cy4gKi9cbmNvbnN0IGtleU1hcCA9IHtcbiAgW1Rlc3RLZXkuQkFDS1NQQUNFXTogS2V5LkJBQ0tfU1BBQ0UsXG4gIFtUZXN0S2V5LlRBQl06IEtleS5UQUIsXG4gIFtUZXN0S2V5LkVOVEVSXTogS2V5LkVOVEVSLFxuICBbVGVzdEtleS5TSElGVF06IEtleS5TSElGVCxcbiAgW1Rlc3RLZXkuQ09OVFJPTF06IEtleS5DT05UUk9MLFxuICBbVGVzdEtleS5BTFRdOiBLZXkuQUxULFxuICBbVGVzdEtleS5FU0NBUEVdOiBLZXkuRVNDQVBFLFxuICBbVGVzdEtleS5QQUdFX1VQXTogS2V5LlBBR0VfVVAsXG4gIFtUZXN0S2V5LlBBR0VfRE9XTl06IEtleS5QQUdFX0RPV04sXG4gIFtUZXN0S2V5LkVORF06IEtleS5FTkQsXG4gIFtUZXN0S2V5LkhPTUVdOiBLZXkuSE9NRSxcbiAgW1Rlc3RLZXkuTEVGVF9BUlJPV106IEtleS5BUlJPV19MRUZULFxuICBbVGVzdEtleS5VUF9BUlJPV106IEtleS5BUlJPV19VUCxcbiAgW1Rlc3RLZXkuUklHSFRfQVJST1ddOiBLZXkuQVJST1dfUklHSFQsXG4gIFtUZXN0S2V5LkRPV05fQVJST1ddOiBLZXkuQVJST1dfRE9XTixcbiAgW1Rlc3RLZXkuSU5TRVJUXTogS2V5LklOU0VSVCxcbiAgW1Rlc3RLZXkuREVMRVRFXTogS2V5LkRFTEVURSxcbiAgW1Rlc3RLZXkuRjFdOiBLZXkuRjEsXG4gIFtUZXN0S2V5LkYyXTogS2V5LkYyLFxuICBbVGVzdEtleS5GM106IEtleS5GMyxcbiAgW1Rlc3RLZXkuRjRdOiBLZXkuRjQsXG4gIFtUZXN0S2V5LkY1XTogS2V5LkY1LFxuICBbVGVzdEtleS5GNl06IEtleS5GNixcbiAgW1Rlc3RLZXkuRjddOiBLZXkuRjcsXG4gIFtUZXN0S2V5LkY4XTogS2V5LkY4LFxuICBbVGVzdEtleS5GOV06IEtleS5GOSxcbiAgW1Rlc3RLZXkuRjEwXTogS2V5LkYxMCxcbiAgW1Rlc3RLZXkuRjExXTogS2V5LkYxMSxcbiAgW1Rlc3RLZXkuRjEyXTogS2V5LkYxMixcbiAgW1Rlc3RLZXkuTUVUQV06IEtleS5NRVRBXG59O1xuXG4vKiogQ29udmVydHMgYSBgTW9kaWZpZXJLZXlzYCBvYmplY3QgdG8gYSBsaXN0IG9mIFByb3RyYWN0b3IgYEtleWBzLiAqL1xuZnVuY3Rpb24gdG9Qcm90cmFjdG9yTW9kaWZpZXJLZXlzKG1vZGlmaWVyczogTW9kaWZpZXJLZXlzKTogc3RyaW5nW10ge1xuICBjb25zdCByZXN1bHQ6IHN0cmluZ1tdID0gW107XG4gIGlmIChtb2RpZmllcnMuY29udHJvbCkge1xuICAgIHJlc3VsdC5wdXNoKEtleS5DT05UUk9MKTtcbiAgfVxuICBpZiAobW9kaWZpZXJzLmFsdCkge1xuICAgIHJlc3VsdC5wdXNoKEtleS5BTFQpO1xuICB9XG4gIGlmIChtb2RpZmllcnMuc2hpZnQpIHtcbiAgICByZXN1bHQucHVzaChLZXkuU0hJRlQpO1xuICB9XG4gIGlmIChtb2RpZmllcnMubWV0YSkge1xuICAgIHJlc3VsdC5wdXNoKEtleS5NRVRBKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKiogQSBgVGVzdEVsZW1lbnRgIGltcGxlbWVudGF0aW9uIGZvciBQcm90cmFjdG9yLiAqL1xuZXhwb3J0IGNsYXNzIFByb3RyYWN0b3JFbGVtZW50IGltcGxlbWVudHMgVGVzdEVsZW1lbnQge1xuICBjb25zdHJ1Y3RvcihyZWFkb25seSBlbGVtZW50OiBFbGVtZW50RmluZGVyKSB7fVxuXG4gIGFzeW5jIGJsdXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIGJyb3dzZXIuZXhlY3V0ZVNjcmlwdCgnYXJndW1lbnRzWzBdLmJsdXIoKScsIHRoaXMuZWxlbWVudCk7XG4gIH1cblxuICBhc3luYyBjbGVhcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50LmNsZWFyKCk7XG4gIH1cblxuICBhc3luYyBjbGljayhyZWxhdGl2ZVggPSAwLCByZWxhdGl2ZVkgPSAwKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgYnJvd3Nlci5hY3Rpb25zKClcbiAgICAgIC5tb3VzZU1vdmUoYXdhaXQgdGhpcy5lbGVtZW50LmdldFdlYkVsZW1lbnQoKSwge3g6IHJlbGF0aXZlWCwgeTogcmVsYXRpdmVZfSlcbiAgICAgIC5jbGljaygpXG4gICAgICAucGVyZm9ybSgpO1xuICB9XG5cbiAgYXN5bmMgZm9jdXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIGJyb3dzZXIuZXhlY3V0ZVNjcmlwdCgnYXJndW1lbnRzWzBdLmZvY3VzKCknLCB0aGlzLmVsZW1lbnQpO1xuICB9XG5cbiAgYXN5bmMgZ2V0Q3NzVmFsdWUocHJvcGVydHk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudC5nZXRDc3NWYWx1ZShwcm9wZXJ0eSk7XG4gIH1cblxuICBhc3luYyBob3ZlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gYnJvd3Nlci5hY3Rpb25zKClcbiAgICAgICAgLm1vdXNlTW92ZShhd2FpdCB0aGlzLmVsZW1lbnQuZ2V0V2ViRWxlbWVudCgpKVxuICAgICAgICAucGVyZm9ybSgpO1xuICB9XG5cbiAgYXN5bmMgc2VuZEtleXMoLi4ua2V5czogKHN0cmluZyB8IFRlc3RLZXkpW10pOiBQcm9taXNlPHZvaWQ+O1xuICBhc3luYyBzZW5kS2V5cyhtb2RpZmllcnM6IE1vZGlmaWVyS2V5cywgLi4ua2V5czogKHN0cmluZyB8IFRlc3RLZXkpW10pOiBQcm9taXNlPHZvaWQ+O1xuICBhc3luYyBzZW5kS2V5cyguLi5tb2RpZmllcnNBbmRLZXlzOiBhbnlbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZpcnN0ID0gbW9kaWZpZXJzQW5kS2V5c1swXTtcbiAgICBsZXQgbW9kaWZpZXJzOiBNb2RpZmllcktleXM7XG4gICAgbGV0IHJlc3Q6IChzdHJpbmcgfCBUZXN0S2V5KVtdO1xuICAgIGlmICh0eXBlb2YgZmlyc3QgIT09ICdzdHJpbmcnICYmIHR5cGVvZiBmaXJzdCAhPT0gJ251bWJlcicpIHtcbiAgICAgIG1vZGlmaWVycyA9IGZpcnN0O1xuICAgICAgcmVzdCA9IG1vZGlmaWVyc0FuZEtleXMuc2xpY2UoMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1vZGlmaWVycyA9IHt9O1xuICAgICAgcmVzdCA9IG1vZGlmaWVyc0FuZEtleXM7XG4gICAgfVxuXG4gICAgY29uc3QgbW9kaWZpZXJLZXlzID0gdG9Qcm90cmFjdG9yTW9kaWZpZXJLZXlzKG1vZGlmaWVycyk7XG4gICAgY29uc3Qga2V5cyA9IHJlc3QubWFwKGsgPT4gdHlwZW9mIGsgPT09ICdzdHJpbmcnID8gay5zcGxpdCgnJykgOiBba2V5TWFwW2tdXSlcbiAgICAgICAgLnJlZHVjZSgoYXJyLCBrKSA9PiBhcnIuY29uY2F0KGspLCBbXSlcbiAgICAgICAgLm1hcChrID0+IEtleS5jaG9yZCguLi5tb2RpZmllcktleXMsIGspKTtcblxuICAgIHJldHVybiB0aGlzLmVsZW1lbnQuc2VuZEtleXMoLi4ua2V5cyk7XG4gIH1cblxuICBhc3luYyB0ZXh0KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudC5nZXRUZXh0KCk7XG4gIH1cblxuICBhc3luYyBnZXRBdHRyaWJ1dGUobmFtZTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmd8bnVsbD4ge1xuICAgIHJldHVybiBicm93c2VyLmV4ZWN1dGVTY3JpcHQoXG4gICAgICAgIGByZXR1cm4gYXJndW1lbnRzWzBdLmdldEF0dHJpYnV0ZShhcmd1bWVudHNbMV0pYCwgdGhpcy5lbGVtZW50LCBuYW1lKTtcbiAgfVxuXG4gIGFzeW5jIGhhc0NsYXNzKG5hbWU6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGNsYXNzZXMgPSAoYXdhaXQgdGhpcy5nZXRBdHRyaWJ1dGUoJ2NsYXNzJykpIHx8ICcnO1xuICAgIHJldHVybiBuZXcgU2V0KGNsYXNzZXMuc3BsaXQoL1xccysvKS5maWx0ZXIoYyA9PiBjKSkuaGFzKG5hbWUpO1xuICB9XG5cbiAgYXN5bmMgZ2V0RGltZW5zaW9ucygpOiBQcm9taXNlPEVsZW1lbnREaW1lbnNpb25zPiB7XG4gICAgY29uc3Qge3dpZHRoLCBoZWlnaHR9ID0gYXdhaXQgdGhpcy5lbGVtZW50LmdldFNpemUoKTtcbiAgICBjb25zdCB7eDogbGVmdCwgeTogdG9wfSA9IGF3YWl0IHRoaXMuZWxlbWVudC5nZXRMb2NhdGlvbigpO1xuICAgIHJldHVybiB7d2lkdGgsIGhlaWdodCwgbGVmdCwgdG9wfTtcbiAgfVxuXG4gIGFzeW5jIGdldFByb3BlcnR5KG5hbWU6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIGJyb3dzZXIuZXhlY3V0ZVNjcmlwdChgcmV0dXJuIGFyZ3VtZW50c1swXVthcmd1bWVudHNbMV1dYCwgdGhpcy5lbGVtZW50LCBuYW1lKTtcbiAgfVxuXG4gIGFzeW5jIG1hdGNoZXNTZWxlY3RvcihzZWxlY3Rvcjogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICByZXR1cm4gYnJvd3Nlci5leGVjdXRlU2NyaXB0KGBcbiAgICAgICAgICByZXR1cm4gKEVsZW1lbnQucHJvdG90eXBlLm1hdGNoZXMgfHxcbiAgICAgICAgICAgICAgICAgIEVsZW1lbnQucHJvdG90eXBlLm1zTWF0Y2hlc1NlbGVjdG9yKS5jYWxsKGFyZ3VtZW50c1swXSwgYXJndW1lbnRzWzFdKVxuICAgICAgICAgIGAsIHRoaXMuZWxlbWVudCwgc2VsZWN0b3IpO1xuICB9XG59XG4iXX0=