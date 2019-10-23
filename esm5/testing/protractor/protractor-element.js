/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var _a;
import { __awaiter, __generator, __read, __spread } from "tslib";
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
                    .map(function (k) { return Key.chord.apply(Key, __spread(modifierKeys, [k])); });
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
    return ProtractorElement;
}());
export { ProtractorElement };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdHJhY3Rvci1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Byb3RyYWN0b3IvcHJvdHJhY3Rvci1lbGVtZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsT0FBTyxFQUFDLE9BQU8sRUFBaUIsR0FBRyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBRXZELE9BQU8sRUFBYyxPQUFPLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUdyRCxvRUFBb0U7QUFDcEUsSUFBTSxNQUFNO0lBQ1YsR0FBQyxPQUFPLENBQUMsU0FBUyxJQUFHLEdBQUcsQ0FBQyxVQUFVO0lBQ25DLEdBQUMsT0FBTyxDQUFDLEdBQUcsSUFBRyxHQUFHLENBQUMsR0FBRztJQUN0QixHQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUcsR0FBRyxDQUFDLEtBQUs7SUFDMUIsR0FBQyxPQUFPLENBQUMsS0FBSyxJQUFHLEdBQUcsQ0FBQyxLQUFLO0lBQzFCLEdBQUMsT0FBTyxDQUFDLE9BQU8sSUFBRyxHQUFHLENBQUMsT0FBTztJQUM5QixHQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUcsR0FBRyxDQUFDLEdBQUc7SUFDdEIsR0FBQyxPQUFPLENBQUMsTUFBTSxJQUFHLEdBQUcsQ0FBQyxNQUFNO0lBQzVCLEdBQUMsT0FBTyxDQUFDLE9BQU8sSUFBRyxHQUFHLENBQUMsT0FBTztJQUM5QixHQUFDLE9BQU8sQ0FBQyxTQUFTLElBQUcsR0FBRyxDQUFDLFNBQVM7SUFDbEMsR0FBQyxPQUFPLENBQUMsR0FBRyxJQUFHLEdBQUcsQ0FBQyxHQUFHO0lBQ3RCLEdBQUMsT0FBTyxDQUFDLElBQUksSUFBRyxHQUFHLENBQUMsSUFBSTtJQUN4QixHQUFDLE9BQU8sQ0FBQyxVQUFVLElBQUcsR0FBRyxDQUFDLFVBQVU7SUFDcEMsR0FBQyxPQUFPLENBQUMsUUFBUSxJ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QyxPQUFPLEVBQUUsRUFBQTs7d0JBQTlDLEtBQWtCLFNBQTRCLEVBQTdDLEtBQUssV0FBQSxFQUFFLE1BQU0sWUFBQTt3QkFDTSxxQkFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxFQUFBOzt3QkFBcEQsS0FBb0IsU0FBZ0MsRUFBaEQsSUFBSSxPQUFBLEVBQUssR0FBRyxPQUFBO3dCQUN0QixzQkFBTyxFQUFDLEtBQUssT0FBQSxFQUFFLE1BQU0sUUFBQSxFQUFFLElBQUksTUFBQSxFQUFFLEdBQUcsS0FBQSxFQUFDLEVBQUM7Ozs7S0FDbkM7SUFFSyx1Q0FBVyxHQUFqQixVQUFrQixJQUFZOzs7Z0JBQzVCLHNCQUFPLE9BQU8sQ0FBQyxhQUFhLENBQUMsbUNBQW1DLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsRUFBQzs7O0tBQ3ZGO0lBRUssMkNBQWUsR0FBckIsVUFBc0IsUUFBZ0I7OztnQkFDbEMsc0JBQU8sT0FBTyxDQUFDLGFBQWEsQ0FBQyx1SkFHeEIsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFDOzs7S0FDbEM7SUFDSCx3QkFBQztBQUFELENBQUMsQUFwRkQsSUFvRkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHticm93c2VyLCBFbGVtZW50RmluZGVyLCBLZXl9IGZyb20gJ3Byb3RyYWN0b3InO1xuaW1wb3J0IHtFbGVtZW50RGltZW5zaW9uc30gZnJvbSAnLi4vZWxlbWVudC1kaW1lbnNpb25zJztcbmltcG9ydCB7VGVzdEVsZW1lbnQsIFRlc3RLZXl9IGZyb20gJy4uL3Rlc3QtZWxlbWVudCc7XG5pbXBvcnQge01vZGlmaWVyS2V5c30gZnJvbSAnLi4vZmFrZS1ldmVudHMnO1xuXG4vKiogTWFwcyB0aGUgYFRlc3RLZXlgIGNvbnN0YW50cyB0byBQcm90cmFjdG9yJ3MgYEtleWAgY29uc3RhbnRzLiAqL1xuY29uc3Qga2V5TWFwID0ge1xuICBbVGVzdEtleS5CQUNLU1BBQ0VdOiBLZXkuQkFDS19TUEFDRSxcbiAgW1Rlc3RLZXkuVEFCXTogS2V5LlRBQixcbiAgW1Rlc3RLZXkuRU5URVJdOiBLZXkuRU5URVIsXG4gIFtUZXN0S2V5LlNISUZUXTogS2V5LlNISUZULFxuICBbVGVzdEtleS5DT05UUk9MXTogS2V5LkNPTlRST0wsXG4gIFtUZXN0S2V5LkFMVF06IEtleS5BTFQsXG4gIFtUZXN0S2V5LkVTQ0FQRV06IEtleS5FU0NBUEUsXG4gIFtUZXN0S2V5LlBBR0VfVVBdOiBLZXkuUEFHRV9VUCxcbiAgW1Rlc3RLZXkuUEFHRV9ET1dOXTogS2V5LlBBR0VfRE9XTixcbiAgW1Rlc3RLZXkuRU5EXTogS2V5LkVORCxcbiAgW1Rlc3RLZXkuSE9NRV06IEtleS5IT01FLFxuICBbVGVzdEtleS5MRUZUX0FSUk9XXTogS2V5LkFSUk9XX0xFRlQsXG4gIFtUZXN0S2V5LlVQX0FSUk9XXTogS2V5LkFSUk9XX1VQLFxuICBbVGVzdEtleS5SSUdIVF9BUlJPV106IEtleS5BUlJPV19SSUdIVCxcbiAgW1Rlc3RLZXkuRE9XTl9BUlJPV106IEtleS5BUlJPV19ET1dOLFxuICBbVGVzdEtleS5JTlNFUlRdOiBLZXkuSU5TRVJULFxuICBbVGVzdEtleS5ERUxFVEVdOiBLZXkuREVMRVRFLFxuICBbVGVzdEtleS5GMV06IEtleS5GMSxcbiAgW1Rlc3RLZXkuRjJdOiBLZXkuRjIsXG4gIFtUZXN0S2V5LkYzXTogS2V5LkYzLFxuICBbVGVzdEtleS5GNF06IEtleS5GNCxcbiAgW1Rlc3RLZXkuRjVdOiBLZXkuRjUsXG4gIFtUZXN0S2V5LkY2XTogS2V5LkY2LFxuICBbVGVzdEtleS5GN106IEtleS5GNyxcbiAgW1Rlc3RLZXkuRjhdOiBLZXkuRjgsXG4gIFtUZXN0S2V5LkY5XTogS2V5LkY5LFxuICBbVGVzdEtleS5GMTBdOiBLZXkuRjEwLFxuICBbVGVzdEtleS5GMTFdOiBLZXkuRjExLFxuICBbVGVzdEtleS5GMTJdOiBLZXkuRjEyLFxuICBbVGVzdEtleS5NRVRBXTogS2V5Lk1FVEFcbn07XG5cbi8qKiBDb252ZXJ0cyBhIGBNb2RpZmllcktleXNgIG9iamVjdCB0byBhIGxpc3Qgb2YgUHJvdHJhY3RvciBgS2V5YHMuICovXG5mdW5jdGlvbiB0b1Byb3RyYWN0b3JNb2RpZmllcktleXMobW9kaWZpZXJzOiBNb2RpZmllcktleXMpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IHJlc3VsdDogc3RyaW5nW10gPSBbXTtcbiAgaWYgKG1vZGlmaWVycy5jb250cm9sKSB7XG4gICAgcmVzdWx0LnB1c2goS2V5LkNPTlRST0wpO1xuICB9XG4gIGlmIChtb2RpZmllcnMuYWx0KSB7XG4gICAgcmVzdWx0LnB1c2goS2V5LkFMVCk7XG4gIH1cbiAgaWYgKG1vZGlmaWVycy5zaGlmdCkge1xuICAgIHJlc3VsdC5wdXNoKEtleS5TSElGVCk7XG4gIH1cbiAgaWYgKG1vZGlmaWVycy5tZXRhKSB7XG4gICAgcmVzdWx0LnB1c2goS2V5Lk1FVEEpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKiBBIGBUZXN0RWxlbWVudGAgaW1wbGVtZW50YXRpb24gZm9yIFByb3RyYWN0b3IuICovXG5leHBvcnQgY2xhc3MgUHJvdHJhY3RvckVsZW1lbnQgaW1wbGVtZW50cyBUZXN0RWxlbWVudCB7XG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IGVsZW1lbnQ6IEVsZW1lbnRGaW5kZXIpIHt9XG5cbiAgYXN5bmMgYmx1cigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gYnJvd3Nlci5leGVjdXRlU2NyaXB0KCdhcmd1bWVudHNbMF0uYmx1cigpJywgdGhpcy5lbGVtZW50KTtcbiAgfVxuXG4gIGFzeW5jIGNsZWFyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnQuY2xlYXIoKTtcbiAgfVxuXG4gIGFzeW5jIGNsaWNrKHJlbGF0aXZlWCA9IDAsIHJlbGF0aXZlWSA9IDApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBicm93c2VyLmFjdGlvbnMoKVxuICAgICAgLm1vdXNlTW92ZShhd2FpdCB0aGlzLmVsZW1lbnQuZ2V0V2ViRWxlbWVudCgpLCB7eDogcmVsYXRpdmVYLCB5OiByZWxhdGl2ZVl9KVxuICAgICAgLmNsaWNrKClcbiAgICAgIC5wZXJmb3JtKCk7XG4gIH1cblxuICBhc3luYyBmb2N1cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gYnJvd3Nlci5leGVjdXRlU2NyaXB0KCdhcmd1bWVudHNbMF0uZm9jdXMoKScsIHRoaXMuZWxlbWVudCk7XG4gIH1cblxuICBhc3luYyBnZXRDc3NWYWx1ZShwcm9wZXJ0eTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50LmdldENzc1ZhbHVlKHByb3BlcnR5KTtcbiAgfVxuXG4gIGFzeW5jIGhvdmVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBicm93c2VyLmFjdGlvbnMoKVxuICAgICAgICAubW91c2VNb3ZlKGF3YWl0IHRoaXMuZWxlbWVudC5nZXRXZWJFbGVtZW50KCkpXG4gICAgICAgIC5wZXJmb3JtKCk7XG4gIH1cblxuICBhc3luYyBzZW5kS2V5cyguLi5rZXlzOiAoc3RyaW5nIHwgVGVzdEtleSlbXSk6IFByb21pc2U8dm9pZD47XG4gIGFzeW5jIHNlbmRLZXlzKG1vZGlmaWVyczogTW9kaWZpZXJLZXlzLCAuLi5rZXlzOiAoc3RyaW5nIHwgVGVzdEtleSlbXSk6IFByb21pc2U8dm9pZD47XG4gIGFzeW5jIHNlbmRLZXlzKC4uLm1vZGlmaWVyc0FuZEtleXM6IGFueVtdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlyc3QgPSBtb2RpZmllcnNBbmRLZXlzWzBdO1xuICAgIGxldCBtb2RpZmllcnM6IE1vZGlmaWVyS2V5cztcbiAgICBsZXQgcmVzdDogKHN0cmluZyB8IFRlc3RLZXkpW107XG4gICAgaWYgKHR5cGVvZiBmaXJzdCAhPT0gJ3N0cmluZycgJiYgdHlwZW9mIGZpcnN0ICE9PSAnbnVtYmVyJykge1xuICAgICAgbW9kaWZpZXJzID0gZmlyc3Q7XG4gICAgICByZXN0ID0gbW9kaWZpZXJzQW5kS2V5cy5zbGljZSgxKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbW9kaWZpZXJzID0ge307XG4gICAgICByZXN0ID0gbW9kaWZpZXJzQW5kS2V5cztcbiAgICB9XG5cbiAgICBjb25zdCBtb2RpZmllcktleXMgPSB0b1Byb3RyYWN0b3JNb2RpZmllcktleXMobW9kaWZpZXJzKTtcbiAgICBjb25zdCBrZXlzID0gcmVzdC5tYXAoayA9PiB0eXBlb2YgayA9PT0gJ3N0cmluZycgPyBrLnNwbGl0KCcnKSA6IFtrZXlNYXBba11dKVxuICAgICAgICAucmVkdWNlKChhcnIsIGspID0+IGFyci5jb25jYXQoayksIFtdKVxuICAgICAgICAubWFwKGsgPT4gS2V5LmNob3JkKC4uLm1vZGlmaWVyS2V5cywgaykpO1xuXG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudC5zZW5kS2V5cyguLi5rZXlzKTtcbiAgfVxuXG4gIGFzeW5jIHRleHQoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50LmdldFRleHQoKTtcbiAgfVxuXG4gIGFzeW5jIGdldEF0dHJpYnV0ZShuYW1lOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ3xudWxsPiB7XG4gICAgcmV0dXJuIGJyb3dzZXIuZXhlY3V0ZVNjcmlwdChcbiAgICAgICAgYHJldHVybiBhcmd1bWVudHNbMF0uZ2V0QXR0cmlidXRlKGFyZ3VtZW50c1sxXSlgLCB0aGlzLmVsZW1lbnQsIG5hbWUpO1xuICB9XG5cbiAgYXN5bmMgaGFzQ2xhc3MobmFtZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgY2xhc3NlcyA9IChhd2FpdCB0aGlzLmdldEF0dHJpYnV0ZSgnY2xhc3MnKSkgfHwgJyc7XG4gICAgcmV0dXJuIG5ldyBTZXQoY2xhc3Nlcy5zcGxpdCgvXFxzKy8pLmZpbHRlcihjID0+IGMpKS5oYXMobmFtZSk7XG4gIH1cblxuICBhc3luYyBnZXREaW1lbnNpb25zKCk6IFByb21pc2U8RWxlbWVudERpbWVuc2lvbnM+IHtcbiAgICBjb25zdCB7d2lkdGgsIGhlaWdodH0gPSBhd2FpdCB0aGlzLmVsZW1lbnQuZ2V0U2l6ZSgpO1xuICAgIGNvbnN0IHt4OiBsZWZ0LCB5OiB0b3B9ID0gYXdhaXQgdGhpcy5lbGVtZW50LmdldExvY2F0aW9uKCk7XG4gICAgcmV0dXJuIHt3aWR0aCwgaGVpZ2h0LCBsZWZ0LCB0b3B9O1xuICB9XG5cbiAgYXN5bmMgZ2V0UHJvcGVydHkobmFtZTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gYnJvd3Nlci5leGVjdXRlU2NyaXB0KGByZXR1cm4gYXJndW1lbnRzWzBdW2FyZ3VtZW50c1sxXV1gLCB0aGlzLmVsZW1lbnQsIG5hbWUpO1xuICB9XG5cbiAgYXN5bmMgbWF0Y2hlc1NlbGVjdG9yKHNlbGVjdG9yOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgIHJldHVybiBicm93c2VyLmV4ZWN1dGVTY3JpcHQoYFxuICAgICAgICAgIHJldHVybiAoRWxlbWVudC5wcm90b3R5cGUubWF0Y2hlcyB8fFxuICAgICAgICAgICAgICAgICAgRWxlbWVudC5wcm90b3R5cGUubXNNYXRjaGVzU2VsZWN0b3IpLmNhbGwoYXJndW1lbnRzWzBdLCBhcmd1bWVudHNbMV0pXG4gICAgICAgICAgYCwgdGhpcy5lbGVtZW50LCBzZWxlY3Rvcik7XG4gIH1cbn1cbiJdfQ==