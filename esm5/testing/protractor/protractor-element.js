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
    ProtractorElement.prototype.click = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var offsetArgs, _a, _b, _c;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        offsetArgs = args.length ? [{ x: args[0], y: args[1] }] : [];
                        _b = (_a = (_d = browser.actions()).mouseMove).apply;
                        _c = [_d];
                        return [4 /*yield*/, this.element.getWebElement()];
                    case 1: return [4 /*yield*/, _b.apply(_a, _c.concat([__spread.apply(void 0, [[_e.sent()], offsetArgs])])).click()
                            .perform()];
                    case 2:
                        _e.sent();
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
    ProtractorElement.prototype.setInputValue = function (value) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, browser.executeScript("arguments[0].value = arguments[1]", this.element, value)];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdHJhY3Rvci1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Byb3RyYWN0b3IvcHJvdHJhY3Rvci1lbGVtZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsT0FBTyxFQUErQyxPQUFPLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUMzRixPQUFPLEVBQUMsT0FBTyxFQUFpQixHQUFHLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFdkQsb0VBQW9FO0FBQ3BFLElBQU0sTUFBTTtJQUNWLEdBQUMsT0FBTyxDQUFDLFNBQVMsSUFBRyxHQUFHLENBQUMsVUFBVTtJQUNuQyxHQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUcsR0FBRyxDQUFDLEdBQUc7SUFDdEIsR0FBQyxPQUFPLENBQUMsS0FBSyxJQUFHLEdBQUcsQ0FBQyxLQUFLO0lBQzFCLEdBQUMsT0FBTyxDQUFDLEtBQUssSUFBRyxHQUFHLENBQUMsS0FBSztJQUMxQixHQUFDLE9BQU8sQ0FBQyxPQUFPLElBQUcsR0FBRyxDQUFDLE9BQU87SUFDOUIsR0FBQyxPQUFPLENBQUMsR0FBRyxJQUFHLEdBQUcsQ0FBQyxHQUFHO0lBQ3RCLEdBQUMsT0FBTyxDQUFDLE1BQU0sSUFBRyxHQUFHLENBQUMsTUFBTTtJQUM1QixHQUFDLE9BQU8sQ0FBQyxPQUFPLElBQUcsR0FBRyxDQUFDLE9BQU87SUFDOUIsR0FBQyxPQUFPLENBQUMsU0FBUyxJQUFHLEdBQUcsQ0FBQyxTQUFTO0lBQ2xDLEdBQUMsT0FBTyxDQUFDLEdBQUcsSUFBRyxHQUFHLENBQUMsR0FBRztJQUN0QixHQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUcsR0FBRyxDQUFDLElBQUk7SUFDeEIsR0FBQyxPQUFPLENBQUMsVUFBVSxJQUFHLEdBQUcsQ0FBQyxVQUFVO0lBQ3BDLEdBQUMsT0FBTyxDQUFDLFFBQVEs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UUFBUSxFQUFFLENBQUMsYUFBYSxFQUFFLENBQUMsRUFBQzs7O0tBQ3ZFO0lBQ0gsd0JBQUM7QUFBRCxDQUFDLEFBbkdELElBbUdDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RWxlbWVudERpbWVuc2lvbnMsIE1vZGlmaWVyS2V5cywgVGVzdEVsZW1lbnQsIFRlc3RLZXl9IGZyb20gJ0Bhbmd1bGFyL2Nkay90ZXN0aW5nJztcbmltcG9ydCB7YnJvd3NlciwgRWxlbWVudEZpbmRlciwgS2V5fSBmcm9tICdwcm90cmFjdG9yJztcblxuLyoqIE1hcHMgdGhlIGBUZXN0S2V5YCBjb25zdGFudHMgdG8gUHJvdHJhY3RvcidzIGBLZXlgIGNvbnN0YW50cy4gKi9cbmNvbnN0IGtleU1hcCA9IHtcbiAgW1Rlc3RLZXkuQkFDS1NQQUNFXTogS2V5LkJBQ0tfU1BBQ0UsXG4gIFtUZXN0S2V5LlRBQl06IEtleS5UQUIsXG4gIFtUZXN0S2V5LkVOVEVSXTogS2V5LkVOVEVSLFxuICBbVGVzdEtleS5TSElGVF06IEtleS5TSElGVCxcbiAgW1Rlc3RLZXkuQ09OVFJPTF06IEtleS5DT05UUk9MLFxuICBbVGVzdEtleS5BTFRdOiBLZXkuQUxULFxuICBbVGVzdEtleS5FU0NBUEVdOiBLZXkuRVNDQVBFLFxuICBbVGVzdEtleS5QQUdFX1VQXTogS2V5LlBBR0VfVVAsXG4gIFtUZXN0S2V5LlBBR0VfRE9XTl06IEtleS5QQUdFX0RPV04sXG4gIFtUZXN0S2V5LkVORF06IEtleS5FTkQsXG4gIFtUZXN0S2V5LkhPTUVdOiBLZXkuSE9NRSxcbiAgW1Rlc3RLZXkuTEVGVF9BUlJPV106IEtleS5BUlJPV19MRUZULFxuICBbVGVzdEtleS5VUF9BUlJPV106IEtleS5BUlJPV19VUCxcbiAgW1Rlc3RLZXkuUklHSFRfQVJST1ddOiBLZXkuQVJST1dfUklHSFQsXG4gIFtUZXN0S2V5LkRPV05fQVJST1ddOiBLZXkuQVJST1dfRE9XTixcbiAgW1Rlc3RLZXkuSU5TRVJUXTogS2V5LklOU0VSVCxcbiAgW1Rlc3RLZXkuREVMRVRFXTogS2V5LkRFTEVURSxcbiAgW1Rlc3RLZXkuRjFdOiBLZXkuRjEsXG4gIFtUZXN0S2V5LkYyXTogS2V5LkYyLFxuICBbVGVzdEtleS5GM106IEtleS5GMyxcbiAgW1Rlc3RLZXkuRjRdOiBLZXkuRjQsXG4gIFtUZXN0S2V5LkY1XTogS2V5LkY1LFxuICBbVGVzdEtleS5GNl06IEtleS5GNixcbiAgW1Rlc3RLZXkuRjddOiBLZXkuRjcsXG4gIFtUZXN0S2V5LkY4XTogS2V5LkY4LFxuICBbVGVzdEtleS5GOV06IEtleS5GOSxcbiAgW1Rlc3RLZXkuRjEwXTogS2V5LkYxMCxcbiAgW1Rlc3RLZXkuRjExXTogS2V5LkYxMSxcbiAgW1Rlc3RLZXkuRjEyXTogS2V5LkYxMixcbiAgW1Rlc3RLZXkuTUVUQV06IEtleS5NRVRBXG59O1xuXG4vKiogQ29udmVydHMgYSBgTW9kaWZpZXJLZXlzYCBvYmplY3QgdG8gYSBsaXN0IG9mIFByb3RyYWN0b3IgYEtleWBzLiAqL1xuZnVuY3Rpb24gdG9Qcm90cmFjdG9yTW9kaWZpZXJLZXlzKG1vZGlmaWVyczogTW9kaWZpZXJLZXlzKTogc3RyaW5nW10ge1xuICBjb25zdCByZXN1bHQ6IHN0cmluZ1tdID0gW107XG4gIGlmIChtb2RpZmllcnMuY29udHJvbCkge1xuICAgIHJlc3VsdC5wdXNoKEtleS5DT05UUk9MKTtcbiAgfVxuICBpZiAobW9kaWZpZXJzLmFsdCkge1xuICAgIHJlc3VsdC5wdXNoKEtleS5BTFQpO1xuICB9XG4gIGlmIChtb2RpZmllcnMuc2hpZnQpIHtcbiAgICByZXN1bHQucHVzaChLZXkuU0hJRlQpO1xuICB9XG4gIGlmIChtb2RpZmllcnMubWV0YSkge1xuICAgIHJlc3VsdC5wdXNoKEtleS5NRVRBKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKiogQSBgVGVzdEVsZW1lbnRgIGltcGxlbWVudGF0aW9uIGZvciBQcm90cmFjdG9yLiAqL1xuZXhwb3J0IGNsYXNzIFByb3RyYWN0b3JFbGVtZW50IGltcGxlbWVudHMgVGVzdEVsZW1lbnQge1xuICBjb25zdHJ1Y3RvcihyZWFkb25seSBlbGVtZW50OiBFbGVtZW50RmluZGVyKSB7fVxuXG4gIGFzeW5jIGJsdXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIGJyb3dzZXIuZXhlY3V0ZVNjcmlwdCgnYXJndW1lbnRzWzBdLmJsdXIoKScsIHRoaXMuZWxlbWVudCk7XG4gIH1cblxuICBhc3luYyBjbGVhcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50LmNsZWFyKCk7XG4gIH1cblxuICBhc3luYyBjbGljayguLi5hcmdzOiBudW1iZXJbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIE9taXR0aW5nIHRoZSBvZmZzZXQgYXJndW1lbnQgdG8gbW91c2VNb3ZlIHJlc3VsdHMgaW4gY2xpY2tpbmcgdGhlIGNlbnRlci5cbiAgICAvLyBUaGlzIGlzIHRoZSBkZWZhdWx0IGJlaGF2aW9yIHdlIHdhbnQsIHNvIHdlIHVzZSBhbiBlbXB0eSBhcnJheSBvZiBvZmZzZXRBcmdzIGlmIG5vIGFyZ3MgYXJlXG4gICAgLy8gcGFzc2VkIHRvIHRoaXMgbWV0aG9kLlxuICAgIGNvbnN0IG9mZnNldEFyZ3MgPSBhcmdzLmxlbmd0aCA/IFt7eDogYXJnc1swXSwgeTogYXJnc1sxXX1dIDogW107XG5cbiAgICBhd2FpdCBicm93c2VyLmFjdGlvbnMoKVxuICAgICAgLm1vdXNlTW92ZShhd2FpdCB0aGlzLmVsZW1lbnQuZ2V0V2ViRWxlbWVudCgpLCAuLi5vZmZzZXRBcmdzKVxuICAgICAgLmNsaWNrKClcbiAgICAgIC5wZXJmb3JtKCk7XG4gIH1cblxuICBhc3luYyBmb2N1cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gYnJvd3Nlci5leGVjdXRlU2NyaXB0KCdhcmd1bWVudHNbMF0uZm9jdXMoKScsIHRoaXMuZWxlbWVudCk7XG4gIH1cblxuICBhc3luYyBnZXRDc3NWYWx1ZShwcm9wZXJ0eTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50LmdldENzc1ZhbHVlKHByb3BlcnR5KTtcbiAgfVxuXG4gIGFzeW5jIGhvdmVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBicm93c2VyLmFjdGlvbnMoKVxuICAgICAgICAubW91c2VNb3ZlKGF3YWl0IHRoaXMuZWxlbWVudC5nZXRXZWJFbGVtZW50KCkpXG4gICAgICAgIC5wZXJmb3JtKCk7XG4gIH1cblxuICBhc3luYyBzZW5kS2V5cyguLi5rZXlzOiAoc3RyaW5nIHwgVGVzdEtleSlbXSk6IFByb21pc2U8dm9pZD47XG4gIGFzeW5jIHNlbmRLZXlzKG1vZGlmaWVyczogTW9kaWZpZXJLZXlzLCAuLi5rZXlzOiAoc3RyaW5nIHwgVGVzdEtleSlbXSk6IFByb21pc2U8dm9pZD47XG4gIGFzeW5jIHNlbmRLZXlzKC4uLm1vZGlmaWVyc0FuZEtleXM6IGFueVtdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlyc3QgPSBtb2RpZmllcnNBbmRLZXlzWzBdO1xuICAgIGxldCBtb2RpZmllcnM6IE1vZGlmaWVyS2V5cztcbiAgICBsZXQgcmVzdDogKHN0cmluZyB8IFRlc3RLZXkpW107XG4gICAgaWYgKHR5cGVvZiBmaXJzdCAhPT0gJ3N0cmluZycgJiYgdHlwZW9mIGZpcnN0ICE9PSAnbnVtYmVyJykge1xuICAgICAgbW9kaWZpZXJzID0gZmlyc3Q7XG4gICAgICByZXN0ID0gbW9kaWZpZXJzQW5kS2V5cy5zbGljZSgxKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbW9kaWZpZXJzID0ge307XG4gICAgICByZXN0ID0gbW9kaWZpZXJzQW5kS2V5cztcbiAgICB9XG5cbiAgICBjb25zdCBtb2RpZmllcktleXMgPSB0b1Byb3RyYWN0b3JNb2RpZmllcktleXMobW9kaWZpZXJzKTtcbiAgICBjb25zdCBrZXlzID0gcmVzdC5tYXAoayA9PiB0eXBlb2YgayA9PT0gJ3N0cmluZycgPyBrLnNwbGl0KCcnKSA6IFtrZXlNYXBba11dKVxuICAgICAgICAucmVkdWNlKChhcnIsIGspID0+IGFyci5jb25jYXQoayksIFtdKVxuICAgICAgICAvLyBLZXkuY2hvcmQgZG9lc24ndCB3b3JrIHdlbGwgd2l0aCBnZWNrb2RyaXZlciAobW96aWxsYS9nZWNrb2RyaXZlciMxNTAyKSxcbiAgICAgICAgLy8gc28gYXZvaWQgaXQgaWYgbm8gbW9kaWZpZXIga2V5cyBhcmUgcmVxdWlyZWQuXG4gICAgICAgIC5tYXAoayA9PiBtb2RpZmllcktleXMubGVuZ3RoID4gMCA/IEtleS5jaG9yZCguLi5tb2RpZmllcktleXMsIGspIDogayk7XG5cbiAgICByZXR1cm4gdGhpcy5lbGVtZW50LnNlbmRLZXlzKC4uLmtleXMpO1xuICB9XG5cbiAgYXN5bmMgdGV4dCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZ2V0VGV4dCgpO1xuICB9XG5cbiAgYXN5bmMgZ2V0QXR0cmlidXRlKG5hbWU6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nfG51bGw+IHtcbiAgICByZXR1cm4gYnJvd3Nlci5leGVjdXRlU2NyaXB0KFxuICAgICAgICBgcmV0dXJuIGFyZ3VtZW50c1swXS5nZXRBdHRyaWJ1dGUoYXJndW1lbnRzWzFdKWAsIHRoaXMuZWxlbWVudCwgbmFtZSk7XG4gIH1cblxuICBhc3luYyBoYXNDbGFzcyhuYW1lOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBjbGFzc2VzID0gKGF3YWl0IHRoaXMuZ2V0QXR0cmlidXRlKCdjbGFzcycpKSB8fCAnJztcbiAgICByZXR1cm4gbmV3IFNldChjbGFzc2VzLnNwbGl0KC9cXHMrLykuZmlsdGVyKGMgPT4gYykpLmhhcyhuYW1lKTtcbiAgfVxuXG4gIGFzeW5jIGdldERpbWVuc2lvbnMoKTogUHJvbWlzZTxFbGVtZW50RGltZW5zaW9ucz4ge1xuICAgIGNvbnN0IHt3aWR0aCwgaGVpZ2h0fSA9IGF3YWl0IHRoaXMuZWxlbWVudC5nZXRTaXplKCk7XG4gICAgY29uc3Qge3g6IGxlZnQsIHk6IHRvcH0gPSBhd2FpdCB0aGlzLmVsZW1lbnQuZ2V0TG9jYXRpb24oKTtcbiAgICByZXR1cm4ge3dpZHRoLCBoZWlnaHQsIGxlZnQsIHRvcH07XG4gIH1cblxuICBhc3luYyBnZXRQcm9wZXJ0eShuYW1lOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiBicm93c2VyLmV4ZWN1dGVTY3JpcHQoYHJldHVybiBhcmd1bWVudHNbMF1bYXJndW1lbnRzWzFdXWAsIHRoaXMuZWxlbWVudCwgbmFtZSk7XG4gIH1cblxuICBhc3luYyBzZXRJbnB1dFZhbHVlKHZhbHVlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gYnJvd3Nlci5leGVjdXRlU2NyaXB0KGBhcmd1bWVudHNbMF0udmFsdWUgPSBhcmd1bWVudHNbMV1gLCB0aGlzLmVsZW1lbnQsIHZhbHVlKTtcbiAgfVxuXG4gIGFzeW5jIG1hdGNoZXNTZWxlY3RvcihzZWxlY3Rvcjogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICByZXR1cm4gYnJvd3Nlci5leGVjdXRlU2NyaXB0KGBcbiAgICAgICAgICByZXR1cm4gKEVsZW1lbnQucHJvdG90eXBlLm1hdGNoZXMgfHxcbiAgICAgICAgICAgICAgICAgIEVsZW1lbnQucHJvdG90eXBlLm1zTWF0Y2hlc1NlbGVjdG9yKS5jYWxsKGFyZ3VtZW50c1swXSwgYXJndW1lbnRzWzFdKVxuICAgICAgICAgIGAsIHRoaXMuZWxlbWVudCwgc2VsZWN0b3IpO1xuICB9XG5cbiAgYXN5bmMgaXNGb2N1c2VkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZXF1YWxzKGJyb3dzZXIuZHJpdmVyLnN3aXRjaFRvKCkuYWN0aXZlRWxlbWVudCgpKTtcbiAgfVxufVxuIl19