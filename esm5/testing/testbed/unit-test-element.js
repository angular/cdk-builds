/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var _a;
import { __awaiter, __generator, __read, __spread } from "tslib";
import * as keyCodes from '@angular/cdk/keycodes';
import { TestKey } from '@angular/cdk/testing';
import { clearElement, dispatchMouseEvent, dispatchPointerEvent, isTextInput, triggerBlur, triggerFocus, typeInElement, } from './fake-events';
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
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._stabilize()];
                    case 1:
                        _a.sent();
                        triggerBlur(this.element);
                        return [4 /*yield*/, this._stabilize()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    UnitTestElement.prototype.clear = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._stabilize()];
                    case 1:
                        _a.sent();
                        if (!isTextInput(this.element)) {
                            throw Error('Attempting to clear an invalid element');
                        }
                        clearElement(this.element);
                        return [4 /*yield*/, this._stabilize()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    UnitTestElement.prototype.click = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a, left, top, width, height, relativeX, relativeY, clientX, clientY, emitPointerEvents;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getDimensions()];
                    case 1:
                        _a = _b.sent(), left = _a.left, top = _a.top, width = _a.width, height = _a.height;
                        relativeX = args.length ? args[0] : width / 2;
                        relativeY = args.length ? args[1] : height / 2;
                        clientX = Math.round(left + relativeX);
                        clientY = Math.round(top + relativeY);
                        emitPointerEvents = window.PointerEvent !== undefined;
                        if (emitPointerEvents) {
                            dispatchPointerEvent(this.element, 'pointerdown', clientX, clientY);
                        }
                        dispatchMouseEvent(this.element, 'mousedown', clientX, clientY);
                        if (emitPointerEvents) {
                            dispatchMouseEvent(this.element, 'pointerup', clientX, clientY);
                        }
                        dispatchMouseEvent(this.element, 'mouseup', clientX, clientY);
                        dispatchMouseEvent(this.element, 'click', clientX, clientY);
                        return [4 /*yield*/, this._stabilize()];
                    case 2:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    UnitTestElement.prototype.focus = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._stabilize()];
                    case 1:
                        _a.sent();
                        triggerFocus(this.element);
                        return [4 /*yield*/, this._stabilize()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    UnitTestElement.prototype.getCssValue = function (property) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
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
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._stabilize()];
                    case 1:
                        _a.sent();
                        dispatchMouseEvent(this.element, 'mouseenter');
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
        return __awaiter(this, void 0, void 0, function () {
            var args;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._stabilize()];
                    case 1:
                        _a.sent();
                        args = modifiersAndKeys.map(function (k) { return typeof k === 'number' ? keyMap[k] : k; });
                        typeInElement.apply(void 0, __spread([this.element], args));
                        return [4 /*yield*/, this._stabilize()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    UnitTestElement.prototype.text = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
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
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
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
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
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
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
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
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._stabilize()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.element[name]];
                }
            });
        });
    };
    UnitTestElement.prototype.setInputValue = function (value) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._stabilize()];
                    case 1:
                        _a.sent();
                        this.element.value = value;
                        return [2 /*return*/];
                }
            });
        });
    };
    UnitTestElement.prototype.matchesSelector = function (selector) {
        return __awaiter(this, void 0, void 0, function () {
            var elementPrototype;
            return __generator(this, function (_a) {
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
    UnitTestElement.prototype.isFocused = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._stabilize()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, document.activeElement === this.element];
                }
            });
        });
    };
    return UnitTestElement;
}());
export { UnitTestElement };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5pdC10ZXN0LWVsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Rlc3RpbmcvdGVzdGJlZC91bml0LXRlc3QtZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7OztBQUVILE9BQU8sS0FBSyxRQUFRLE1BQU0sdUJBQXVCLENBQUM7QUFDbEQsT0FBTyxFQUErQyxPQUFPLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUMzRixPQUFPLEVBQ0wsWUFBWSxFQUNaLGtCQUFrQixFQUNsQixvQkFBb0IsRUFDcEIsV0FBVyxFQUNYLFdBQVcsRUFDWCxZQUFZLEVBQ1osYUFBYSxHQUNkLE1BQU0sZUFBZSxDQUFDO0FBRXZCLGdHQUFnRztBQUNoRyxJQUFNLE1BQU07SUFDVixHQUFDLE9BQU8sQ0FBQyxTQUFTLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFDO0lBQ3BFLEdBQUMsT0FBTyxDQUFDLEdBQUcsSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUM7SUFDbEQsR0FBQyxPQUFPLENBQUMsS0FBSyxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBQztJQUN4RCxHQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFDO0lBQ3hELEdBQUMsT0FBTyxDQUFDLE9BQU8sSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUM7SUFDOUQsR0FBQyxPQUFPLENBQUMsR0FBRyxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBQztJQUNsRCxHQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFDO0lBQzNELEdBQUMsT0FBTyxDQUFDLE9BQU8sSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUM7SUFDN0QsR0FBQyxPQUFPLENBQUMsU0FBUyxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBQztJQUNuRSxHQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFDO0lBQ2xELEdBQUMsT0FBTyxDQUFDLElBQUksSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUM7SUFDckQsR0FBQyxPQUFPLENBQUMsVUFBVSxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBQztJQUN0RSxHQUFDLE9BQU8sQ0FBQyxRQUFRLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFDO0lBQ2hFLEdBQUMsT0FBTyxDQUFDLFdBQVcsSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRSxZQUFZLEVBQUM7SUFDekUsR0FBQyxPQUFPLENBQUMsVUFBVSxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBQztJQUN0RSxHQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFDO0lBQzNELEdBQUMsT0FBTyxDQUFDLE1BQU0sSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUM7SUFDM0QsR0FBQyxPQUFPLENBQUMsRUFBRSxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBQztJQUMvQyxHQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO0lBQy9DLEdBQUMsT0FBTyxDQUFDLEVBQUUsSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUM7SUFDL0MsR0FBQyxPQUFPLENBQUMsRUFBRSxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBQztJQUMvQyxHQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO0lBQy9DLEdBQUMsT0FBTyxDQUFDLEVBQUUsSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUM7SUFDL0MsR0FBQyxPQUFPLENBQUMsRUFBRSxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBQztJQUMvQyxHQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO0lBQy9DLEdBQUMsT0FBTyxDQUFDLEVBQUUsSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUM7SUFDL0MsR0FBQyxPQUFPLENBQUMsR0FBRyxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FB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QU0sSUFBSSxDQUFDLFVBQVUsRUFBRSxFQUFBOzt3QkFBdkIsU0FBdUIsQ0FBQzt3QkFDeEIsc0JBQVEsSUFBSSxDQUFDLE9BQWUsQ0FBQyxJQUFJLENBQUMsRUFBQzs7OztLQUNwQztJQUVLLHVDQUFhLEdBQW5CLFVBQW9CLEtBQWE7Ozs7NEJBQy9CLHFCQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBQTs7d0JBQXZCLFNBQXVCLENBQUM7d0JBQ3ZCLElBQUksQ0FBQyxPQUFlLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQzs7Ozs7S0FDckM7SUFFSyx5Q0FBZSxHQUFyQixVQUFzQixRQUFnQjs7Ozs7NEJBQ3BDLHFCQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBQTs7d0JBQXZCLFNBQXVCLENBQUM7d0JBQ2xCLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxTQUFnQixDQUFDO3dCQUNsRCxzQkFBTyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxJQUFJLGdCQUFnQixDQUFDLG1CQUFtQixDQUFDLENBQUM7aUNBQ3hFLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFDOzs7O0tBQ25DO0lBRUssbUNBQVMsR0FBZjs7Ozs0QkFDRSxxQkFBTSxJQUFJLENBQUMsVUFBVSxFQUFFLEVBQUE7O3dCQUF2QixTQUF1QixDQUFDO3dCQUN4QixzQkFBTyxRQUFRLENBQUMsYUFBYSxLQUFLLElBQUksQ0FBQyxPQUFPLEVBQUM7Ozs7S0FDaEQ7SUFDSCxzQkFBQztBQUFELENBQUMsQUFwSEQsSUFvSEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMga2V5Q29kZXMgZnJvbSAnQGFuZ3VsYXIvY2RrL2tleWNvZGVzJztcbmltcG9ydCB7RWxlbWVudERpbWVuc2lvbnMsIE1vZGlmaWVyS2V5cywgVGVzdEVsZW1lbnQsIFRlc3RLZXl9IGZyb20gJ0Bhbmd1bGFyL2Nkay90ZXN0aW5nJztcbmltcG9ydCB7XG4gIGNsZWFyRWxlbWVudCxcbiAgZGlzcGF0Y2hNb3VzZUV2ZW50LFxuICBkaXNwYXRjaFBvaW50ZXJFdmVudCxcbiAgaXNUZXh0SW5wdXQsXG4gIHRyaWdnZXJCbHVyLFxuICB0cmlnZ2VyRm9jdXMsXG4gIHR5cGVJbkVsZW1lbnQsXG59IGZyb20gJy4vZmFrZS1ldmVudHMnO1xuXG4vKiogTWFwcyBgVGVzdEtleWAgY29uc3RhbnRzIHRvIHRoZSBga2V5Q29kZWAgYW5kIGBrZXlgIHZhbHVlcyB1c2VkIGJ5IG5hdGl2ZSBicm93c2VyIGV2ZW50cy4gKi9cbmNvbnN0IGtleU1hcCA9IHtcbiAgW1Rlc3RLZXkuQkFDS1NQQUNFXToge2tleUNvZGU6IGtleUNvZGVzLkJBQ0tTUEFDRSwga2V5OiAnQmFja3NwYWNlJ30sXG4gIFtUZXN0S2V5LlRBQl06IHtrZXlDb2RlOiBrZXlDb2Rlcy5UQUIsIGtleTogJ1RhYid9LFxuICBbVGVzdEtleS5FTlRFUl06IHtrZXlDb2RlOiBrZXlDb2Rlcy5FTlRFUiwga2V5OiAnRW50ZXInfSxcbiAgW1Rlc3RLZXkuU0hJRlRdOiB7a2V5Q29kZToga2V5Q29kZXMuU0hJRlQsIGtleTogJ1NoaWZ0J30sXG4gIFtUZXN0S2V5LkNPTlRST0xdOiB7a2V5Q29kZToga2V5Q29kZXMuQ09OVFJPTCwga2V5OiAnQ29udHJvbCd9LFxuICBbVGVzdEtleS5BTFRdOiB7a2V5Q29kZToga2V5Q29kZXMuQUxULCBrZXk6ICdBbHQnfSxcbiAgW1Rlc3RLZXkuRVNDQVBFXToge2tleUNvZGU6IGtleUNvZGVzLkVTQ0FQRSwga2V5OiAnRXNjYXBlJ30sXG4gIFtUZXN0S2V5LlBBR0VfVVBdOiB7a2V5Q29kZToga2V5Q29kZXMuUEFHRV9VUCwga2V5OiAnUGFnZVVwJ30sXG4gIFtUZXN0S2V5LlBBR0VfRE9XTl06IHtrZXlDb2RlOiBrZXlDb2Rlcy5QQUdFX0RPV04sIGtleTogJ1BhZ2VEb3duJ30sXG4gIFtUZXN0S2V5LkVORF06IHtrZXlDb2RlOiBrZXlDb2Rlcy5FTkQsIGtleTogJ0VuZCd9LFxuICBbVGVzdEtleS5IT01FXToge2tleUNvZGU6IGtleUNvZGVzLkhPTUUsIGtleTogJ0hvbWUnfSxcbiAgW1Rlc3RLZXkuTEVGVF9BUlJPV106IHtrZXlDb2RlOiBrZXlDb2Rlcy5MRUZUX0FSUk9XLCBrZXk6ICdBcnJvd0xlZnQnfSxcbiAgW1Rlc3RLZXkuVVBfQVJST1ddOiB7a2V5Q29kZToga2V5Q29kZXMuVVBfQVJST1csIGtleTogJ0Fycm93VXAnfSxcbiAgW1Rlc3RLZXkuUklHSFRfQVJST1ddOiB7a2V5Q29kZToga2V5Q29kZXMuUklHSFRfQVJST1csIGtleTogJ0Fycm93UmlnaHQnfSxcbiAgW1Rlc3RLZXkuRE9XTl9BUlJPV106IHtrZXlDb2RlOiBrZXlDb2Rlcy5ET1dOX0FSUk9XLCBrZXk6ICdBcnJvd0Rvd24nfSxcbiAgW1Rlc3RLZXkuSU5TRVJUXToge2tleUNvZGU6IGtleUNvZGVzLklOU0VSVCwga2V5OiAnSW5zZXJ0J30sXG4gIFtUZXN0S2V5LkRFTEVURV06IHtrZXlDb2RlOiBrZXlDb2Rlcy5ERUxFVEUsIGtleTogJ0RlbGV0ZSd9LFxuICBbVGVzdEtleS5GMV06IHtrZXlDb2RlOiBrZXlDb2Rlcy5GMSwga2V5OiAnRjEnfSxcbiAgW1Rlc3RLZXkuRjJdOiB7a2V5Q29kZToga2V5Q29kZXMuRjIsIGtleTogJ0YyJ30sXG4gIFtUZXN0S2V5LkYzXToge2tleUNvZGU6IGtleUNvZGVzLkYzLCBrZXk6ICdGMyd9LFxuICBbVGVzdEtleS5GNF06IHtrZXlDb2RlOiBrZXlDb2Rlcy5GNCwga2V5OiAnRjQnfSxcbiAgW1Rlc3RLZXkuRjVdOiB7a2V5Q29kZToga2V5Q29kZXMuRjUsIGtleTogJ0Y1J30sXG4gIFtUZXN0S2V5LkY2XToge2tleUNvZGU6IGtleUNvZGVzLkY2LCBrZXk6ICdGNid9LFxuICBbVGVzdEtleS5GN106IHtrZXlDb2RlOiBrZXlDb2Rlcy5GNywga2V5OiAnRjcnfSxcbiAgW1Rlc3RLZXkuRjhdOiB7a2V5Q29kZToga2V5Q29kZXMuRjgsIGtleTogJ0Y4J30sXG4gIFtUZXN0S2V5LkY5XToge2tleUNvZGU6IGtleUNvZGVzLkY5LCBrZXk6ICdGOSd9LFxuICBbVGVzdEtleS5GMTBdOiB7a2V5Q29kZToga2V5Q29kZXMuRjEwLCBrZXk6ICdGMTAnfSxcbiAgW1Rlc3RLZXkuRjExXToge2tleUNvZGU6IGtleUNvZGVzLkYxMSwga2V5OiAnRjExJ30sXG4gIFtUZXN0S2V5LkYxMl06IHtrZXlDb2RlOiBrZXlDb2Rlcy5GMTIsIGtleTogJ0YxMid9LFxuICBbVGVzdEtleS5NRVRBXToge2tleUNvZGU6IGtleUNvZGVzLk1FVEEsIGtleTogJ01ldGEnfVxufTtcblxuLyoqIEEgYFRlc3RFbGVtZW50YCBpbXBsZW1lbnRhdGlvbiBmb3IgdW5pdCB0ZXN0cy4gKi9cbmV4cG9ydCBjbGFzcyBVbml0VGVzdEVsZW1lbnQgaW1wbGVtZW50cyBUZXN0RWxlbWVudCB7XG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IGVsZW1lbnQ6IEVsZW1lbnQsIHByaXZhdGUgX3N0YWJpbGl6ZTogKCkgPT4gUHJvbWlzZTx2b2lkPikge31cblxuICBhc3luYyBibHVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIHRyaWdnZXJCbHVyKHRoaXMuZWxlbWVudCBhcyBIVE1MRWxlbWVudCk7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gIH1cblxuICBhc3luYyBjbGVhcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICBpZiAoIWlzVGV4dElucHV0KHRoaXMuZWxlbWVudCkpIHtcbiAgICAgIHRocm93IEVycm9yKCdBdHRlbXB0aW5nIHRvIGNsZWFyIGFuIGludmFsaWQgZWxlbWVudCcpO1xuICAgIH1cbiAgICBjbGVhckVsZW1lbnQodGhpcy5lbGVtZW50KTtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgfVxuXG4gIGFzeW5jIGNsaWNrKC4uLmFyZ3M6IG51bWJlcltdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qge2xlZnQsIHRvcCwgd2lkdGgsIGhlaWdodH0gPSBhd2FpdCB0aGlzLmdldERpbWVuc2lvbnMoKTtcbiAgICBjb25zdCByZWxhdGl2ZVggPSBhcmdzLmxlbmd0aCA/IGFyZ3NbMF0gOiB3aWR0aCAvIDI7XG4gICAgY29uc3QgcmVsYXRpdmVZID0gYXJncy5sZW5ndGggPyBhcmdzWzFdIDogaGVpZ2h0IC8gMjtcblxuICAgIC8vIFJvdW5kIHRoZSBjb21wdXRlZCBjbGljayBwb3NpdGlvbiBhcyBkZWNpbWFsIHBpeGVscyBhcmUgbm90XG4gICAgLy8gc3VwcG9ydGVkIGJ5IG1vdXNlIGV2ZW50cyBhbmQgY291bGQgbGVhZCB0byB1bmV4cGVjdGVkIHJlc3VsdHMuXG4gICAgY29uc3QgY2xpZW50WCA9IE1hdGgucm91bmQobGVmdCArIHJlbGF0aXZlWCk7XG4gICAgY29uc3QgY2xpZW50WSA9IE1hdGgucm91bmQodG9wICsgcmVsYXRpdmVZKTtcblxuICAgIC8vIFRoZSBsYXRlc3QgdmVyc2lvbnMgb2YgYWxsIGJyb3dzZXJzIHdlIHN1cHBvcnQgaGF2ZSB0aGUgbmV3IGBQb2ludGVyRXZlbnRgIEFQSS5cbiAgICAvLyBUaG91Z2ggc2luY2Ugd2UgY2FwdHVyZSB0aGUgdHdvIG1vc3QgcmVjZW50IHZlcnNpb25zIG9mIHRoZXNlIGJyb3dzZXJzLCB3ZSBhbHNvXG4gICAgLy8gbmVlZCB0byBzdXBwb3J0IFNhZmFyaSAxMiBhdCB0aW1lIG9mIHdyaXRpbmcuIFNhZmFyaSAxMiBkb2VzIG5vdCBoYXZlIHN1cHBvcnQgZm9yIHRoaXMsXG4gICAgLy8gc28gd2UgbmVlZCB0byBjb25kaXRpb25hbGx5IGNyZWF0ZSBhbmQgZGlzcGF0Y2ggdGhlc2UgZXZlbnRzIGJhc2VkIG9uIGZlYXR1cmUgZGV0ZWN0aW9uLlxuICAgIGNvbnN0IGVtaXRQb2ludGVyRXZlbnRzID0gd2luZG93LlBvaW50ZXJFdmVudCAhPT0gdW5kZWZpbmVkO1xuXG4gICAgaWYgKGVtaXRQb2ludGVyRXZlbnRzKSB7XG4gICAgICBkaXNwYXRjaFBvaW50ZXJFdmVudCh0aGlzLmVsZW1lbnQsICdwb2ludGVyZG93bicsIGNsaWVudFgsIGNsaWVudFkpO1xuICAgIH1cbiAgICBkaXNwYXRjaE1vdXNlRXZlbnQodGhpcy5lbGVtZW50LCAnbW91c2Vkb3duJywgY2xpZW50WCwgY2xpZW50WSk7XG4gICAgaWYgKGVtaXRQb2ludGVyRXZlbnRzKSB7XG4gICAgICBkaXNwYXRjaE1vdXNlRXZlbnQodGhpcy5lbGVtZW50LCAncG9pbnRlcnVwJywgY2xpZW50WCwgY2xpZW50WSk7XG4gICAgfVxuICAgIGRpc3BhdGNoTW91c2VFdmVudCh0aGlzLmVsZW1lbnQsICdtb3VzZXVwJywgY2xpZW50WCwgY2xpZW50WSk7XG4gICAgZGlzcGF0Y2hNb3VzZUV2ZW50KHRoaXMuZWxlbWVudCwgJ2NsaWNrJywgY2xpZW50WCwgY2xpZW50WSk7XG5cbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgfVxuXG4gIGFzeW5jIGZvY3VzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIHRyaWdnZXJGb2N1cyh0aGlzLmVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpO1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG5cbiAgYXN5bmMgZ2V0Q3NzVmFsdWUocHJvcGVydHk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgLy8gVE9ETyhtbWFsZXJiYSk6IENvbnNpZGVyIGFkZGluZyB2YWx1ZSBub3JtYWxpemF0aW9uIGlmIHdlIHJ1biBpbnRvIGNvbW1vbiBjYXNlcyB3aGVyZSBpdHNcbiAgICAvLyAgbmVlZGVkLlxuICAgIHJldHVybiBnZXRDb21wdXRlZFN0eWxlKHRoaXMuZWxlbWVudCkuZ2V0UHJvcGVydHlWYWx1ZShwcm9wZXJ0eSk7XG4gIH1cblxuICBhc3luYyBob3ZlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICBkaXNwYXRjaE1vdXNlRXZlbnQodGhpcy5lbGVtZW50LCAnbW91c2VlbnRlcicpO1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG5cbiAgYXN5bmMgc2VuZEtleXMoLi4ua2V5czogKHN0cmluZyB8IFRlc3RLZXkpW10pOiBQcm9taXNlPHZvaWQ+O1xuICBhc3luYyBzZW5kS2V5cyhtb2RpZmllcnM6IE1vZGlmaWVyS2V5cywgLi4ua2V5czogKHN0cmluZyB8IFRlc3RLZXkpW10pOiBQcm9taXNlPHZvaWQ+O1xuICBhc3luYyBzZW5kS2V5cyguLi5tb2RpZmllcnNBbmRLZXlzOiBhbnlbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIGNvbnN0IGFyZ3MgPSBtb2RpZmllcnNBbmRLZXlzLm1hcChrID0+IHR5cGVvZiBrID09PSAnbnVtYmVyJyA/IGtleU1hcFtrIGFzIFRlc3RLZXldIDogayk7XG4gICAgdHlwZUluRWxlbWVudCh0aGlzLmVsZW1lbnQgYXMgSFRNTEVsZW1lbnQsIC4uLmFyZ3MpO1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG5cbiAgYXN5bmMgdGV4dCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIHJldHVybiAodGhpcy5lbGVtZW50LnRleHRDb250ZW50IHx8ICcnKS50cmltKCk7XG4gIH1cblxuICBhc3luYyBnZXRBdHRyaWJ1dGUobmFtZTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmd8bnVsbD4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICB9XG5cbiAgYXN5bmMgaGFzQ2xhc3MobmFtZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMobmFtZSk7XG4gIH1cblxuICBhc3luYyBnZXREaW1lbnNpb25zKCk6IFByb21pc2U8RWxlbWVudERpbWVuc2lvbnM+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICB9XG5cbiAgYXN5bmMgZ2V0UHJvcGVydHkobmFtZTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICByZXR1cm4gKHRoaXMuZWxlbWVudCBhcyBhbnkpW25hbWVdO1xuICB9XG5cbiAgYXN5bmMgc2V0SW5wdXRWYWx1ZSh2YWx1ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgKHRoaXMuZWxlbWVudCBhcyBhbnkpLnZhbHVlID0gdmFsdWU7XG4gIH1cblxuICBhc3luYyBtYXRjaGVzU2VsZWN0b3Ioc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIGNvbnN0IGVsZW1lbnRQcm90b3R5cGUgPSBFbGVtZW50LnByb3RvdHlwZSBhcyBhbnk7XG4gICAgcmV0dXJuIChlbGVtZW50UHJvdG90eXBlWydtYXRjaGVzJ10gfHwgZWxlbWVudFByb3RvdHlwZVsnbXNNYXRjaGVzU2VsZWN0b3InXSlcbiAgICAgICAgLmNhbGwodGhpcy5lbGVtZW50LCBzZWxlY3Rvcik7XG4gIH1cblxuICBhc3luYyBpc0ZvY3VzZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgcmV0dXJuIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT09IHRoaXMuZWxlbWVudDtcbiAgfVxufVxuIl19