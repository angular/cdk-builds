/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var _a;
import { __awaiter, __generator, __read, __spread } from "tslib";
import { TestKey } from '@angular/cdk/testing';
import { browser, Key } from 'protractor';
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
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, browser.executeScript('arguments[0].blur()', this.element)];
            });
        });
    };
    ProtractorElement.prototype.clear = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.element.clear()];
            });
        });
    };
    ProtractorElement.prototype.click = function (relativeX, relativeY) {
        if (relativeX === void 0) { relativeX = 0; }
        if (relativeY === void 0) { relativeY = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
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
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, browser.executeScript('arguments[0].focus()', this.element)];
            });
        });
    };
    ProtractorElement.prototype.getCssValue = function (property) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.element.getCssValue(property)];
            });
        });
    };
    ProtractorElement.prototype.hover = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
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
        return __awaiter(this, void 0, void 0, function () {
            var first, modifiers, rest, modifierKeys, keys;
            var _a;
            return __generator(this, function (_b) {
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
                    // Key.chord doesn't work well with geckodriver (mozilla/geckodriver#1502),
                    // so avoid it if no modifier keys are required.
                    .map(function (k) { return modifierKeys.length > 0 ? Key.chord.apply(Key, __spread(modifierKeys, [k])) : k; });
                return [2 /*return*/, (_a = this.element).sendKeys.apply(_a, __spread(keys))];
            });
        });
    };
    ProtractorElement.prototype.text = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.element.getText()];
            });
        });
    };
    ProtractorElement.prototype.getAttribute = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, browser.executeScript("return arguments[0].getAttribute(arguments[1])", this.element, name)];
            });
        });
    };
    ProtractorElement.prototype.hasClass = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var classes;
            return __generator(this, function (_a) {
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
        return __awaiter(this, void 0, void 0, function () {
            var _a, width, height, _b, left, top;
            return __generator(this, function (_c) {
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
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, browser.executeScript("return arguments[0][arguments[1]]", this.element, name)];
            });
        });
    };
    ProtractorElement.prototype.matchesSelector = function (selector) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, browser.executeScript("\n          return (Element.prototype.matches ||\n                  Element.prototype.msMatchesSelector).call(arguments[0], arguments[1])\n          ", this.element, selector)];
            });
        });
    };
    ProtractorElement.prototype.isFocused = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.element.equals(browser.driver.switchTo().activeElement())];
            });
        });
    };
    return ProtractorElement;
}());
export { ProtractorElement };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdHJhY3Rvci1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Byb3RyYWN0b3IvcHJvdHJhY3Rvci1lbGVtZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsT0FBTyxFQUErQyxPQUFPLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUMzRixPQUFPLEVBQUMsT0FBTyxFQUFpQixHQUFHLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFdkQsb0VBQW9FO0FBQ3BFLElBQU0sTUFBTTtJQUNWLEdBQUMsT0FBTyxDQUFDLFNBQVMsSUFBRyxHQUFHLENBQUMsVUFBVTtJQUNuQyxHQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUcsR0FBRyxDQUFDLEdBQUc7SUFDdEIsR0FBQyxPQUFPLENBQUMsS0FBSyxJQUFHLEdBQUcsQ0FBQyxLQUFLO0lBQzFCLEdBQUMsT0FBTyxDQUFDLEtBQUssSUFBRyxHQUFHLENBQUMsS0FBSztJQUMxQixHQUFDLE9BQU8sQ0FBQyxPQUFPLElBQUcsR0FBRyxDQUFDLE9BQU87SUFDOUIsR0FBQyxPQUFPLENBQUMsR0FBRyxJQUFHLEdBQUcsQ0FBQyxHQUFHO0lBQ3RCLEdBQUMsT0FBTyxDQUFDLE1BQU0sSUFBRyxHQUFHLENBQUMsTUFBTTtJQUM1QixHQUFDLE9BQU8sQ0FBQyxPQUFPLElBQUcsR0FBRyxDQUFDLE9BQU87SUFDOUIsR0FBQyxPQUFPLENBQUMsU0FBUyxJQUFHLEdBQUcsQ0FBQyxTQUFTO0lBQ2xDLEdBQUMsT0FBTyxDQUFDLEdBQUcsSUFBRyxHQUFHLENBQUMsR0FBRztJQUN0QixHQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUcsR0FBRyxDQUFDLElBQUk7SUFDeEIsR0FBQyxPQUFPLENBQUMsVUFBVSxJQUFHLEdBQUcsQ0FBQyxVQUFVO0lBQ3BDLEdBQUMsT0FBTyxDQUFDLFFBQVEs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QUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFDOzs7O0tBQy9EO0lBRUsseUNBQWEsR0FBbkI7Ozs7OzRCQUMwQixxQkFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUFBOzt3QkFBOUMsS0FBa0IsU0FBNEIsRUFBN0MsS0FBSyxXQUFBLEVBQUUsTUFBTSxZQUFBO3dCQUNNLHFCQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLEVBQUE7O3dCQUFwRCxLQUFvQixTQUFnQyxFQUFoRCxJQUFJLE9BQUEsRUFBSyxHQUFHLE9BQUE7d0JBQ3RCLHNCQUFPLEVBQUMsS0FBSyxPQUFBLEVBQUUsTUFBTSxRQUFBLEVBQUUsSUFBSSxNQUFBLEVBQUUsR0FBRyxLQUFBLEVBQUMsRUFBQzs7OztLQUNuQztJQUVLLHVDQUFXLEdBQWpCLFVBQWtCLElBQVk7OztnQkFDNUIsc0JBQU8sT0FBTyxDQUFDLGFBQWEsQ0FBQyxtQ0FBbUMsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxFQUFDOzs7S0FDdkY7SUFFSywyQ0FBZSxHQUFyQixVQUFzQixRQUFnQjs7O2dCQUNsQyxzQkFBTyxPQUFPLENBQUMsYUFBYSxDQUFDLHVKQUd4QixFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUM7OztLQUNsQztJQUVLLHFDQUFTLEdBQWY7OztnQkFDRSxzQkFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLGFBQWEsRUFBRSxDQUFDLEVBQUM7OztLQUN2RTtJQUNILHdCQUFDO0FBQUQsQ0FBQyxBQTFGRCxJQTBGQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0VsZW1lbnREaW1lbnNpb25zLCBNb2RpZmllcktleXMsIFRlc3RFbGVtZW50LCBUZXN0S2V5fSBmcm9tICdAYW5ndWxhci9jZGsvdGVzdGluZyc7XG5pbXBvcnQge2Jyb3dzZXIsIEVsZW1lbnRGaW5kZXIsIEtleX0gZnJvbSAncHJvdHJhY3Rvcic7XG5cbi8qKiBNYXBzIHRoZSBgVGVzdEtleWAgY29uc3RhbnRzIHRvIFByb3RyYWN0b3IncyBgS2V5YCBjb25zdGFudHMuICovXG5jb25zdCBrZXlNYXAgPSB7XG4gIFtUZXN0S2V5LkJBQ0tTUEFDRV06IEtleS5CQUNLX1NQQUNFLFxuICBbVGVzdEtleS5UQUJdOiBLZXkuVEFCLFxuICBbVGVzdEtleS5FTlRFUl06IEtleS5FTlRFUixcbiAgW1Rlc3RLZXkuU0hJRlRdOiBLZXkuU0hJRlQsXG4gIFtUZXN0S2V5LkNPTlRST0xdOiBLZXkuQ09OVFJPTCxcbiAgW1Rlc3RLZXkuQUxUXTogS2V5LkFMVCxcbiAgW1Rlc3RLZXkuRVNDQVBFXTogS2V5LkVTQ0FQRSxcbiAgW1Rlc3RLZXkuUEFHRV9VUF06IEtleS5QQUdFX1VQLFxuICBbVGVzdEtleS5QQUdFX0RPV05dOiBLZXkuUEFHRV9ET1dOLFxuICBbVGVzdEtleS5FTkRdOiBLZXkuRU5ELFxuICBbVGVzdEtleS5IT01FXTogS2V5LkhPTUUsXG4gIFtUZXN0S2V5LkxFRlRfQVJST1ddOiBLZXkuQVJST1dfTEVGVCxcbiAgW1Rlc3RLZXkuVVBfQVJST1ddOiBLZXkuQVJST1dfVVAsXG4gIFtUZXN0S2V5LlJJR0hUX0FSUk9XXTogS2V5LkFSUk9XX1JJR0hULFxuICBbVGVzdEtleS5ET1dOX0FSUk9XXTogS2V5LkFSUk9XX0RPV04sXG4gIFtUZXN0S2V5LklOU0VSVF06IEtleS5JTlNFUlQsXG4gIFtUZXN0S2V5LkRFTEVURV06IEtleS5ERUxFVEUsXG4gIFtUZXN0S2V5LkYxXTogS2V5LkYxLFxuICBbVGVzdEtleS5GMl06IEtleS5GMixcbiAgW1Rlc3RLZXkuRjNdOiBLZXkuRjMsXG4gIFtUZXN0S2V5LkY0XTogS2V5LkY0LFxuICBbVGVzdEtleS5GNV06IEtleS5GNSxcbiAgW1Rlc3RLZXkuRjZdOiBLZXkuRjYsXG4gIFtUZXN0S2V5LkY3XTogS2V5LkY3LFxuICBbVGVzdEtleS5GOF06IEtleS5GOCxcbiAgW1Rlc3RLZXkuRjldOiBLZXkuRjksXG4gIFtUZXN0S2V5LkYxMF06IEtleS5GMTAsXG4gIFtUZXN0S2V5LkYxMV06IEtleS5GMTEsXG4gIFtUZXN0S2V5LkYxMl06IEtleS5GMTIsXG4gIFtUZXN0S2V5Lk1FVEFdOiBLZXkuTUVUQVxufTtcblxuLyoqIENvbnZlcnRzIGEgYE1vZGlmaWVyS2V5c2Agb2JqZWN0IHRvIGEgbGlzdCBvZiBQcm90cmFjdG9yIGBLZXlgcy4gKi9cbmZ1bmN0aW9uIHRvUHJvdHJhY3Rvck1vZGlmaWVyS2V5cyhtb2RpZmllcnM6IE1vZGlmaWVyS2V5cyk6IHN0cmluZ1tdIHtcbiAgY29uc3QgcmVzdWx0OiBzdHJpbmdbXSA9IFtdO1xuICBpZiAobW9kaWZpZXJzLmNvbnRyb2wpIHtcbiAgICByZXN1bHQucHVzaChLZXkuQ09OVFJPTCk7XG4gIH1cbiAgaWYgKG1vZGlmaWVycy5hbHQpIHtcbiAgICByZXN1bHQucHVzaChLZXkuQUxUKTtcbiAgfVxuICBpZiAobW9kaWZpZXJzLnNoaWZ0KSB7XG4gICAgcmVzdWx0LnB1c2goS2V5LlNISUZUKTtcbiAgfVxuICBpZiAobW9kaWZpZXJzLm1ldGEpIHtcbiAgICByZXN1bHQucHVzaChLZXkuTUVUQSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqIEEgYFRlc3RFbGVtZW50YCBpbXBsZW1lbnRhdGlvbiBmb3IgUHJvdHJhY3Rvci4gKi9cbmV4cG9ydCBjbGFzcyBQcm90cmFjdG9yRWxlbWVudCBpbXBsZW1lbnRzIFRlc3RFbGVtZW50IHtcbiAgY29uc3RydWN0b3IocmVhZG9ubHkgZWxlbWVudDogRWxlbWVudEZpbmRlcikge31cblxuICBhc3luYyBibHVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBicm93c2VyLmV4ZWN1dGVTY3JpcHQoJ2FyZ3VtZW50c1swXS5ibHVyKCknLCB0aGlzLmVsZW1lbnQpO1xuICB9XG5cbiAgYXN5bmMgY2xlYXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudC5jbGVhcigpO1xuICB9XG5cbiAgYXN5bmMgY2xpY2socmVsYXRpdmVYID0gMCwgcmVsYXRpdmVZID0gMCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IGJyb3dzZXIuYWN0aW9ucygpXG4gICAgICAubW91c2VNb3ZlKGF3YWl0IHRoaXMuZWxlbWVudC5nZXRXZWJFbGVtZW50KCksIHt4OiByZWxhdGl2ZVgsIHk6IHJlbGF0aXZlWX0pXG4gICAgICAuY2xpY2soKVxuICAgICAgLnBlcmZvcm0oKTtcbiAgfVxuXG4gIGFzeW5jIGZvY3VzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBicm93c2VyLmV4ZWN1dGVTY3JpcHQoJ2FyZ3VtZW50c1swXS5mb2N1cygpJywgdGhpcy5lbGVtZW50KTtcbiAgfVxuXG4gIGFzeW5jIGdldENzc1ZhbHVlKHByb3BlcnR5OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZ2V0Q3NzVmFsdWUocHJvcGVydHkpO1xuICB9XG5cbiAgYXN5bmMgaG92ZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIGJyb3dzZXIuYWN0aW9ucygpXG4gICAgICAgIC5tb3VzZU1vdmUoYXdhaXQgdGhpcy5lbGVtZW50LmdldFdlYkVsZW1lbnQoKSlcbiAgICAgICAgLnBlcmZvcm0oKTtcbiAgfVxuXG4gIGFzeW5jIHNlbmRLZXlzKC4uLmtleXM6IChzdHJpbmcgfCBUZXN0S2V5KVtdKTogUHJvbWlzZTx2b2lkPjtcbiAgYXN5bmMgc2VuZEtleXMobW9kaWZpZXJzOiBNb2RpZmllcktleXMsIC4uLmtleXM6IChzdHJpbmcgfCBUZXN0S2V5KVtdKTogUHJvbWlzZTx2b2lkPjtcbiAgYXN5bmMgc2VuZEtleXMoLi4ubW9kaWZpZXJzQW5kS2V5czogYW55W10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaXJzdCA9IG1vZGlmaWVyc0FuZEtleXNbMF07XG4gICAgbGV0IG1vZGlmaWVyczogTW9kaWZpZXJLZXlzO1xuICAgIGxldCByZXN0OiAoc3RyaW5nIHwgVGVzdEtleSlbXTtcbiAgICBpZiAodHlwZW9mIGZpcnN0ICE9PSAnc3RyaW5nJyAmJiB0eXBlb2YgZmlyc3QgIT09ICdudW1iZXInKSB7XG4gICAgICBtb2RpZmllcnMgPSBmaXJzdDtcbiAgICAgIHJlc3QgPSBtb2RpZmllcnNBbmRLZXlzLnNsaWNlKDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBtb2RpZmllcnMgPSB7fTtcbiAgICAgIHJlc3QgPSBtb2RpZmllcnNBbmRLZXlzO1xuICAgIH1cblxuICAgIGNvbnN0IG1vZGlmaWVyS2V5cyA9IHRvUHJvdHJhY3Rvck1vZGlmaWVyS2V5cyhtb2RpZmllcnMpO1xuICAgIGNvbnN0IGtleXMgPSByZXN0Lm1hcChrID0+IHR5cGVvZiBrID09PSAnc3RyaW5nJyA/IGsuc3BsaXQoJycpIDogW2tleU1hcFtrXV0pXG4gICAgICAgIC5yZWR1Y2UoKGFyciwgaykgPT4gYXJyLmNvbmNhdChrKSwgW10pXG4gICAgICAgIC8vIEtleS5jaG9yZCBkb2Vzbid0IHdvcmsgd2VsbCB3aXRoIGdlY2tvZHJpdmVyIChtb3ppbGxhL2dlY2tvZHJpdmVyIzE1MDIpLFxuICAgICAgICAvLyBzbyBhdm9pZCBpdCBpZiBubyBtb2RpZmllciBrZXlzIGFyZSByZXF1aXJlZC5cbiAgICAgICAgLm1hcChrID0+IG1vZGlmaWVyS2V5cy5sZW5ndGggPiAwID8gS2V5LmNob3JkKC4uLm1vZGlmaWVyS2V5cywgaykgOiBrKTtcblxuICAgIHJldHVybiB0aGlzLmVsZW1lbnQuc2VuZEtleXMoLi4ua2V5cyk7XG4gIH1cblxuICBhc3luYyB0ZXh0KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudC5nZXRUZXh0KCk7XG4gIH1cblxuICBhc3luYyBnZXRBdHRyaWJ1dGUobmFtZTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmd8bnVsbD4ge1xuICAgIHJldHVybiBicm93c2VyLmV4ZWN1dGVTY3JpcHQoXG4gICAgICAgIGByZXR1cm4gYXJndW1lbnRzWzBdLmdldEF0dHJpYnV0ZShhcmd1bWVudHNbMV0pYCwgdGhpcy5lbGVtZW50LCBuYW1lKTtcbiAgfVxuXG4gIGFzeW5jIGhhc0NsYXNzKG5hbWU6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGNsYXNzZXMgPSAoYXdhaXQgdGhpcy5nZXRBdHRyaWJ1dGUoJ2NsYXNzJykpIHx8ICcnO1xuICAgIHJldHVybiBuZXcgU2V0KGNsYXNzZXMuc3BsaXQoL1xccysvKS5maWx0ZXIoYyA9PiBjKSkuaGFzKG5hbWUpO1xuICB9XG5cbiAgYXN5bmMgZ2V0RGltZW5zaW9ucygpOiBQcm9taXNlPEVsZW1lbnREaW1lbnNpb25zPiB7XG4gICAgY29uc3Qge3dpZHRoLCBoZWlnaHR9ID0gYXdhaXQgdGhpcy5lbGVtZW50LmdldFNpemUoKTtcbiAgICBjb25zdCB7eDogbGVmdCwgeTogdG9wfSA9IGF3YWl0IHRoaXMuZWxlbWVudC5nZXRMb2NhdGlvbigpO1xuICAgIHJldHVybiB7d2lkdGgsIGhlaWdodCwgbGVmdCwgdG9wfTtcbiAgfVxuXG4gIGFzeW5jIGdldFByb3BlcnR5KG5hbWU6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIGJyb3dzZXIuZXhlY3V0ZVNjcmlwdChgcmV0dXJuIGFyZ3VtZW50c1swXVthcmd1bWVudHNbMV1dYCwgdGhpcy5lbGVtZW50LCBuYW1lKTtcbiAgfVxuXG4gIGFzeW5jIG1hdGNoZXNTZWxlY3RvcihzZWxlY3Rvcjogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICByZXR1cm4gYnJvd3Nlci5leGVjdXRlU2NyaXB0KGBcbiAgICAgICAgICByZXR1cm4gKEVsZW1lbnQucHJvdG90eXBlLm1hdGNoZXMgfHxcbiAgICAgICAgICAgICAgICAgIEVsZW1lbnQucHJvdG90eXBlLm1zTWF0Y2hlc1NlbGVjdG9yKS5jYWxsKGFyZ3VtZW50c1swXSwgYXJndW1lbnRzWzFdKVxuICAgICAgICAgIGAsIHRoaXMuZWxlbWVudCwgc2VsZWN0b3IpO1xuICB9XG5cbiAgYXN5bmMgaXNGb2N1c2VkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZXF1YWxzKGJyb3dzZXIuZHJpdmVyLnN3aXRjaFRvKCkuYWN0aXZlRWxlbWVudCgpKTtcbiAgfVxufVxuIl19