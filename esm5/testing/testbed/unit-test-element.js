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
import { TestKey } from '../test-element';
import { dispatchMouseEvent, triggerBlur, triggerFocus, isTextInput, clearElement, typeInElement, } from '../fake-events';
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
    UnitTestElement.prototype.click = function (relativeX, relativeY) {
        if (relativeX === void 0) { relativeX = 0; }
        if (relativeY === void 0) { relativeY = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, left, top, clientX, clientY;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this._stabilize()];
                    case 1:
                        _b.sent();
                        _a = this.element.getBoundingClientRect(), left = _a.left, top = _a.top;
                        clientX = Math.round(left + relativeX);
                        clientY = Math.round(top + relativeY);
                        dispatchMouseEvent(this.element, 'mousedown', clientX, clientY);
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
    return UnitTestElement;
}());
export { UnitTestElement };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5pdC10ZXN0LWVsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Rlc3RpbmcvdGVzdGJlZC91bml0LXRlc3QtZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7OztBQUVILE9BQU8sS0FBSyxRQUFRLE1BQU0sdUJBQXVCLENBQUM7QUFDbEQsT0FBTyxFQUFjLE9BQU8sRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBRXJELE9BQU8sRUFFTCxrQkFBa0IsRUFDbEIsV0FBVyxFQUNYLFlBQVksRUFDWixXQUFXLEVBQ1gsWUFBWSxFQUNaLGFBQWEsR0FDZCxNQUFNLGdCQUFnQixDQUFDO0FBRXhCLGdHQUFnRztBQUNoRyxJQUFNLE1BQU07SUFDVixHQUFDLE9BQU8sQ0FBQyxTQUFTLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFDO0lBQ3BFLEdBQUMsT0FBTyxDQUFDLEdBQUcsSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUM7SUFDbEQsR0FBQyxPQUFPLENBQUMsS0FBSyxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBQztJQUN4RCxHQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFDO0lBQ3hELEdBQUMsT0FBTyxDQUFDLE9BQU8sSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUM7SUFDOUQsR0FBQyxPQUFPLENBQUMsR0FBRyxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBQztJQUNsRCxHQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFDO0lBQzNELEdBQUMsT0FBTyxDQUFDLE9BQU8sSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUM7SUFDN0QsR0FBQyxPQUFPLENBQUMsU0FBUyxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBQztJQUNuRSxHQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFDO0lBQ2xELEdBQUMsT0FBTyxDQUFDLElBQUksSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUM7SUFDckQsR0FBQyxPQUFPLENBQUMsVUFBVSxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBQztJQUN0RSxHQUFDLE9BQU8sQ0FBQyxRQUFRLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFDO0lBQ2hFLEdBQUMsT0FBTyxDQUFDLFdBQVcsSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRSxZQUFZLEVBQUM7SUFDekUsR0FBQyxPQUFPLENBQUMsVUFBVSxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBQztJQUN0RSxHQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFDO0lBQzNELEdBQUMsT0FBTyxDQUFDLE1BQU0sSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUM7SUFDM0QsR0FBQyxPQUFPLENBQUMsRUFBRSxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBQztJQUMvQyxHQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO0lBQy9DLEdBQUMsT0FBTyxDQUFDLEVBQUUsSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUM7SUFDL0MsR0FBQyxPQUFPLENBQUMsRUFBRSxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBQztJQUMvQyxHQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO0lBQy9DLEdBQUMsT0FBTyxDQUFDLEVBQUUsSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUM7SUFDL0MsR0FBQyxPQUFPLENBQUMsRUFBRSxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBQztJQUMvQyxHQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO0lBQy9DLEdBQUMsT0FBTyxDQUFDLEVBQUUsSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUM7SUFDL0MsR0FBQyxPQUFPLENBQUMsR0FBRyxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxHQUFHLEVBQUUs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IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIGtleUNvZGVzIGZyb20gJ0Bhbmd1bGFyL2Nkay9rZXljb2Rlcyc7XG5pbXBvcnQge1Rlc3RFbGVtZW50LCBUZXN0S2V5fSBmcm9tICcuLi90ZXN0LWVsZW1lbnQnO1xuaW1wb3J0IHtFbGVtZW50RGltZW5zaW9uc30gZnJvbSAnLi4vZWxlbWVudC1kaW1lbnNpb25zJztcbmltcG9ydCB7XG4gIE1vZGlmaWVyS2V5cyxcbiAgZGlzcGF0Y2hNb3VzZUV2ZW50LFxuICB0cmlnZ2VyQmx1cixcbiAgdHJpZ2dlckZvY3VzLFxuICBpc1RleHRJbnB1dCxcbiAgY2xlYXJFbGVtZW50LFxuICB0eXBlSW5FbGVtZW50LFxufSBmcm9tICcuLi9mYWtlLWV2ZW50cyc7XG5cbi8qKiBNYXBzIGBUZXN0S2V5YCBjb25zdGFudHMgdG8gdGhlIGBrZXlDb2RlYCBhbmQgYGtleWAgdmFsdWVzIHVzZWQgYnkgbmF0aXZlIGJyb3dzZXIgZXZlbnRzLiAqL1xuY29uc3Qga2V5TWFwID0ge1xuICBbVGVzdEtleS5CQUNLU1BBQ0VdOiB7a2V5Q29kZToga2V5Q29kZXMuQkFDS1NQQUNFLCBrZXk6ICdCYWNrc3BhY2UnfSxcbiAgW1Rlc3RLZXkuVEFCXToge2tleUNvZGU6IGtleUNvZGVzLlRBQiwga2V5OiAnVGFiJ30sXG4gIFtUZXN0S2V5LkVOVEVSXToge2tleUNvZGU6IGtleUNvZGVzLkVOVEVSLCBrZXk6ICdFbnRlcid9LFxuICBbVGVzdEtleS5TSElGVF06IHtrZXlDb2RlOiBrZXlDb2Rlcy5TSElGVCwga2V5OiAnU2hpZnQnfSxcbiAgW1Rlc3RLZXkuQ09OVFJPTF06IHtrZXlDb2RlOiBrZXlDb2Rlcy5DT05UUk9MLCBrZXk6ICdDb250cm9sJ30sXG4gIFtUZXN0S2V5LkFMVF06IHtrZXlDb2RlOiBrZXlDb2Rlcy5BTFQsIGtleTogJ0FsdCd9LFxuICBbVGVzdEtleS5FU0NBUEVdOiB7a2V5Q29kZToga2V5Q29kZXMuRVNDQVBFLCBrZXk6ICdFc2NhcGUnfSxcbiAgW1Rlc3RLZXkuUEFHRV9VUF06IHtrZXlDb2RlOiBrZXlDb2Rlcy5QQUdFX1VQLCBrZXk6ICdQYWdlVXAnfSxcbiAgW1Rlc3RLZXkuUEFHRV9ET1dOXToge2tleUNvZGU6IGtleUNvZGVzLlBBR0VfRE9XTiwga2V5OiAnUGFnZURvd24nfSxcbiAgW1Rlc3RLZXkuRU5EXToge2tleUNvZGU6IGtleUNvZGVzLkVORCwga2V5OiAnRW5kJ30sXG4gIFtUZXN0S2V5LkhPTUVdOiB7a2V5Q29kZToga2V5Q29kZXMuSE9NRSwga2V5OiAnSG9tZSd9LFxuICBbVGVzdEtleS5MRUZUX0FSUk9XXToge2tleUNvZGU6IGtleUNvZGVzLkxFRlRfQVJST1csIGtleTogJ0Fycm93TGVmdCd9LFxuICBbVGVzdEtleS5VUF9BUlJPV106IHtrZXlDb2RlOiBrZXlDb2Rlcy5VUF9BUlJPVywga2V5OiAnQXJyb3dVcCd9LFxuICBbVGVzdEtleS5SSUdIVF9BUlJPV106IHtrZXlDb2RlOiBrZXlDb2Rlcy5SSUdIVF9BUlJPVywga2V5OiAnQXJyb3dSaWdodCd9LFxuICBbVGVzdEtleS5ET1dOX0FSUk9XXToge2tleUNvZGU6IGtleUNvZGVzLkRPV05fQVJST1csIGtleTogJ0Fycm93RG93bid9LFxuICBbVGVzdEtleS5JTlNFUlRdOiB7a2V5Q29kZToga2V5Q29kZXMuSU5TRVJULCBrZXk6ICdJbnNlcnQnfSxcbiAgW1Rlc3RLZXkuREVMRVRFXToge2tleUNvZGU6IGtleUNvZGVzLkRFTEVURSwga2V5OiAnRGVsZXRlJ30sXG4gIFtUZXN0S2V5LkYxXToge2tleUNvZGU6IGtleUNvZGVzLkYxLCBrZXk6ICdGMSd9LFxuICBbVGVzdEtleS5GMl06IHtrZXlDb2RlOiBrZXlDb2Rlcy5GMiwga2V5OiAnRjInfSxcbiAgW1Rlc3RLZXkuRjNdOiB7a2V5Q29kZToga2V5Q29kZXMuRjMsIGtleTogJ0YzJ30sXG4gIFtUZXN0S2V5LkY0XToge2tleUNvZGU6IGtleUNvZGVzLkY0LCBrZXk6ICdGNCd9LFxuICBbVGVzdEtleS5GNV06IHtrZXlDb2RlOiBrZXlDb2Rlcy5GNSwga2V5OiAnRjUnfSxcbiAgW1Rlc3RLZXkuRjZdOiB7a2V5Q29kZToga2V5Q29kZXMuRjYsIGtleTogJ0Y2J30sXG4gIFtUZXN0S2V5LkY3XToge2tleUNvZGU6IGtleUNvZGVzLkY3LCBrZXk6ICdGNyd9LFxuICBbVGVzdEtleS5GOF06IHtrZXlDb2RlOiBrZXlDb2Rlcy5GOCwga2V5OiAnRjgnfSxcbiAgW1Rlc3RLZXkuRjldOiB7a2V5Q29kZToga2V5Q29kZXMuRjksIGtleTogJ0Y5J30sXG4gIFtUZXN0S2V5LkYxMF06IHtrZXlDb2RlOiBrZXlDb2Rlcy5GMTAsIGtleTogJ0YxMCd9LFxuICBbVGVzdEtleS5GMTFdOiB7a2V5Q29kZToga2V5Q29kZXMuRjExLCBrZXk6ICdGMTEnfSxcbiAgW1Rlc3RLZXkuRjEyXToge2tleUNvZGU6IGtleUNvZGVzLkYxMiwga2V5OiAnRjEyJ30sXG4gIFtUZXN0S2V5Lk1FVEFdOiB7a2V5Q29kZToga2V5Q29kZXMuTUVUQSwga2V5OiAnTWV0YSd9XG59O1xuXG4vKiogQSBgVGVzdEVsZW1lbnRgIGltcGxlbWVudGF0aW9uIGZvciB1bml0IHRlc3RzLiAqL1xuZXhwb3J0IGNsYXNzIFVuaXRUZXN0RWxlbWVudCBpbXBsZW1lbnRzIFRlc3RFbGVtZW50IHtcbiAgY29uc3RydWN0b3IocmVhZG9ubHkgZWxlbWVudDogRWxlbWVudCwgcHJpdmF0ZSBfc3RhYmlsaXplOiAoKSA9PiBQcm9taXNlPHZvaWQ+KSB7fVxuXG4gIGFzeW5jIGJsdXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgdHJpZ2dlckJsdXIodGhpcy5lbGVtZW50IGFzIEhUTUxFbGVtZW50KTtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgfVxuXG4gIGFzeW5jIGNsZWFyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIGlmICghaXNUZXh0SW5wdXQodGhpcy5lbGVtZW50KSkge1xuICAgICAgdGhyb3cgRXJyb3IoJ0F0dGVtcHRpbmcgdG8gY2xlYXIgYW4gaW52YWxpZCBlbGVtZW50Jyk7XG4gICAgfVxuICAgIGNsZWFyRWxlbWVudCh0aGlzLmVsZW1lbnQpO1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG5cbiAgYXN5bmMgY2xpY2socmVsYXRpdmVYID0gMCwgcmVsYXRpdmVZID0gMCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIGNvbnN0IHtsZWZ0LCB0b3B9ID0gdGhpcy5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIC8vIFJvdW5kIHRoZSBjb21wdXRlZCBjbGljayBwb3NpdGlvbiBhcyBkZWNpbWFsIHBpeGVscyBhcmUgbm90XG4gICAgLy8gc3VwcG9ydGVkIGJ5IG1vdXNlIGV2ZW50cyBhbmQgY291bGQgbGVhZCB0byB1bmV4cGVjdGVkIHJlc3VsdHMuXG4gICAgY29uc3QgY2xpZW50WCA9IE1hdGgucm91bmQobGVmdCArIHJlbGF0aXZlWCk7XG4gICAgY29uc3QgY2xpZW50WSA9IE1hdGgucm91bmQodG9wICsgcmVsYXRpdmVZKTtcbiAgICBkaXNwYXRjaE1vdXNlRXZlbnQodGhpcy5lbGVtZW50LCAnbW91c2Vkb3duJywgY2xpZW50WCwgY2xpZW50WSk7XG4gICAgZGlzcGF0Y2hNb3VzZUV2ZW50KHRoaXMuZWxlbWVudCwgJ21vdXNldXAnLCBjbGllbnRYLCBjbGllbnRZKTtcbiAgICBkaXNwYXRjaE1vdXNlRXZlbnQodGhpcy5lbGVtZW50LCAnY2xpY2snLCBjbGllbnRYLCBjbGllbnRZKTtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgfVxuXG4gIGFzeW5jIGZvY3VzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIHRyaWdnZXJGb2N1cyh0aGlzLmVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpO1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG5cbiAgYXN5bmMgZ2V0Q3NzVmFsdWUocHJvcGVydHk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgLy8gVE9ETyhtbWFsZXJiYSk6IENvbnNpZGVyIGFkZGluZyB2YWx1ZSBub3JtYWxpemF0aW9uIGlmIHdlIHJ1biBpbnRvIGNvbW1vbiBjYXNlcyB3aGVyZSBpdHNcbiAgICAvLyAgbmVlZGVkLlxuICAgIHJldHVybiBnZXRDb21wdXRlZFN0eWxlKHRoaXMuZWxlbWVudCkuZ2V0UHJvcGVydHlWYWx1ZShwcm9wZXJ0eSk7XG4gIH1cblxuICBhc3luYyBob3ZlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICBkaXNwYXRjaE1vdXNlRXZlbnQodGhpcy5lbGVtZW50LCAnbW91c2VlbnRlcicpO1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG5cbiAgYXN5bmMgc2VuZEtleXMoLi4ua2V5czogKHN0cmluZyB8IFRlc3RLZXkpW10pOiBQcm9taXNlPHZvaWQ+O1xuICBhc3luYyBzZW5kS2V5cyhtb2RpZmllcnM6IE1vZGlmaWVyS2V5cywgLi4ua2V5czogKHN0cmluZyB8IFRlc3RLZXkpW10pOiBQcm9taXNlPHZvaWQ+O1xuICBhc3luYyBzZW5kS2V5cyguLi5tb2RpZmllcnNBbmRLZXlzOiBhbnlbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIGNvbnN0IGFyZ3MgPSBtb2RpZmllcnNBbmRLZXlzLm1hcChrID0+IHR5cGVvZiBrID09PSAnbnVtYmVyJyA/IGtleU1hcFtrIGFzIFRlc3RLZXldIDogayk7XG4gICAgdHlwZUluRWxlbWVudCh0aGlzLmVsZW1lbnQgYXMgSFRNTEVsZW1lbnQsIC4uLmFyZ3MpO1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG5cbiAgYXN5bmMgdGV4dCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIHJldHVybiAodGhpcy5lbGVtZW50LnRleHRDb250ZW50IHx8ICcnKS50cmltKCk7XG4gIH1cblxuICBhc3luYyBnZXRBdHRyaWJ1dGUobmFtZTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmd8bnVsbD4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICB9XG5cbiAgYXN5bmMgaGFzQ2xhc3MobmFtZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMobmFtZSk7XG4gIH1cblxuICBhc3luYyBnZXREaW1lbnNpb25zKCk6IFByb21pc2U8RWxlbWVudERpbWVuc2lvbnM+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICB9XG5cbiAgYXN5bmMgZ2V0UHJvcGVydHkobmFtZTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICByZXR1cm4gKHRoaXMuZWxlbWVudCBhcyBhbnkpW25hbWVdO1xuICB9XG5cbiAgYXN5bmMgbWF0Y2hlc1NlbGVjdG9yKHNlbGVjdG9yOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICBjb25zdCBlbGVtZW50UHJvdG90eXBlID0gRWxlbWVudC5wcm90b3R5cGUgYXMgYW55O1xuICAgIHJldHVybiAoZWxlbWVudFByb3RvdHlwZVsnbWF0Y2hlcyddIHx8IGVsZW1lbnRQcm90b3R5cGVbJ21zTWF0Y2hlc1NlbGVjdG9yJ10pXG4gICAgICAgIC5jYWxsKHRoaXMuZWxlbWVudCwgc2VsZWN0b3IpO1xuICB9XG59XG4iXX0=