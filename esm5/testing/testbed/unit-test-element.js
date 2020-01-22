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
import { clearElement, dispatchMouseEvent, isTextInput, triggerBlur, triggerFocus, typeInElement, } from './fake-events';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5pdC10ZXN0LWVsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Rlc3RpbmcvdGVzdGJlZC91bml0LXRlc3QtZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7OztBQUVILE9BQU8sS0FBSyxRQUFRLE1BQU0sdUJBQXVCLENBQUM7QUFDbEQsT0FBTyxFQUErQyxPQUFPLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUMzRixPQUFPLEVBQ0wsWUFBWSxFQUNaLGtCQUFrQixFQUNsQixXQUFXLEVBQ1gsV0FBVyxFQUNYLFlBQVksRUFDWixhQUFhLEdBQ2QsTUFBTSxlQUFlLENBQUM7QUFFdkIsZ0dBQWdHO0FBQ2hHLElBQU0sTUFBTTtJQUNWLEdBQUMsT0FBTyxDQUFDLFNBQVMsSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUM7SUFDcEUsR0FBQyxPQUFPLENBQUMsR0FBRyxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBQztJQUNsRCxHQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFDO0lBQ3hELEdBQUMsT0FBTyxDQUFDLEtBQUssSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUM7SUFDeEQsR0FBQyxPQUFPLENBQUMsT0FBTyxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBQztJQUM5RCxHQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFDO0lBQ2xELEdBQUMsT0FBTyxDQUFDLE1BQU0sSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUM7SUFDM0QsR0FBQyxPQUFPLENBQUMsT0FBTyxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBQztJQUM3RCxHQUFDLE9BQU8sQ0FBQyxTQUFTLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFDO0lBQ25FLEdBQUMsT0FBTyxDQUFDLEdBQUcsSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUM7SUFDbEQsR0FBQyxPQUFPLENBQUMsSUFBSSxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBQztJQUNyRCxHQUFDLE9BQU8sQ0FBQyxVQUFVLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFDO0lBQ3RFLEdBQUMsT0FBTyxDQUFDLFFBQVEsSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUM7SUFDaEUsR0FBQyxPQUFPLENBQUMsV0FBVyxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFLFlBQVksRUFBQztJQUN6RSxHQUFDLE9BQU8sQ0FBQyxVQUFVLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFDO0lBQ3RFLEdBQUMsT0FBTyxDQUFDLE1BQU0sSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUM7SUFDM0QsR0FBQyxPQUFPLENBQUMsTUFBTSxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBQztJQUMzRCxHQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO0lBQy9DLEdBQUMsT0FBTyxDQUFDLEVBQUUsSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUM7SUFDL0MsR0FBQyxPQUFPLENBQUMsRUFBRSxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBQztJQUMvQyxHQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO0lBQy9DLEdBQUMsT0FBTyxDQUFDLEVBQUUsSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUM7SUFDL0MsR0FBQyxPQUFPLENBQUMsRUFBRSxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBQztJQUMvQyxHQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO0lBQy9DLEdBQUMsT0FBTyxDQUFDLEVBQUUsSUFBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUM7SUFDL0MsR0FBQyxPQUFPLENBQUMsRUFBRSxJQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBQztJQUMvQyxHQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEdBQUcsRUFBRSxH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QUFPLFFBQVEsQ0FBQyxhQUFhLEtBQUssSUFBSSxDQUFDLE9BQU8sRUFBQzs7OztLQUNoRDtJQUNILHNCQUFDO0FBQUQsQ0FBQyxBQS9GRCxJQStGQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyBrZXlDb2RlcyBmcm9tICdAYW5ndWxhci9jZGsva2V5Y29kZXMnO1xuaW1wb3J0IHtFbGVtZW50RGltZW5zaW9ucywgTW9kaWZpZXJLZXlzLCBUZXN0RWxlbWVudCwgVGVzdEtleX0gZnJvbSAnQGFuZ3VsYXIvY2RrL3Rlc3RpbmcnO1xuaW1wb3J0IHtcbiAgY2xlYXJFbGVtZW50LFxuICBkaXNwYXRjaE1vdXNlRXZlbnQsXG4gIGlzVGV4dElucHV0LFxuICB0cmlnZ2VyQmx1cixcbiAgdHJpZ2dlckZvY3VzLFxuICB0eXBlSW5FbGVtZW50LFxufSBmcm9tICcuL2Zha2UtZXZlbnRzJztcblxuLyoqIE1hcHMgYFRlc3RLZXlgIGNvbnN0YW50cyB0byB0aGUgYGtleUNvZGVgIGFuZCBga2V5YCB2YWx1ZXMgdXNlZCBieSBuYXRpdmUgYnJvd3NlciBldmVudHMuICovXG5jb25zdCBrZXlNYXAgPSB7XG4gIFtUZXN0S2V5LkJBQ0tTUEFDRV06IHtrZXlDb2RlOiBrZXlDb2Rlcy5CQUNLU1BBQ0UsIGtleTogJ0JhY2tzcGFjZSd9LFxuICBbVGVzdEtleS5UQUJdOiB7a2V5Q29kZToga2V5Q29kZXMuVEFCLCBrZXk6ICdUYWInfSxcbiAgW1Rlc3RLZXkuRU5URVJdOiB7a2V5Q29kZToga2V5Q29kZXMuRU5URVIsIGtleTogJ0VudGVyJ30sXG4gIFtUZXN0S2V5LlNISUZUXToge2tleUNvZGU6IGtleUNvZGVzLlNISUZULCBrZXk6ICdTaGlmdCd9LFxuICBbVGVzdEtleS5DT05UUk9MXToge2tleUNvZGU6IGtleUNvZGVzLkNPTlRST0wsIGtleTogJ0NvbnRyb2wnfSxcbiAgW1Rlc3RLZXkuQUxUXToge2tleUNvZGU6IGtleUNvZGVzLkFMVCwga2V5OiAnQWx0J30sXG4gIFtUZXN0S2V5LkVTQ0FQRV06IHtrZXlDb2RlOiBrZXlDb2Rlcy5FU0NBUEUsIGtleTogJ0VzY2FwZSd9LFxuICBbVGVzdEtleS5QQUdFX1VQXToge2tleUNvZGU6IGtleUNvZGVzLlBBR0VfVVAsIGtleTogJ1BhZ2VVcCd9LFxuICBbVGVzdEtleS5QQUdFX0RPV05dOiB7a2V5Q29kZToga2V5Q29kZXMuUEFHRV9ET1dOLCBrZXk6ICdQYWdlRG93bid9LFxuICBbVGVzdEtleS5FTkRdOiB7a2V5Q29kZToga2V5Q29kZXMuRU5ELCBrZXk6ICdFbmQnfSxcbiAgW1Rlc3RLZXkuSE9NRV06IHtrZXlDb2RlOiBrZXlDb2Rlcy5IT01FLCBrZXk6ICdIb21lJ30sXG4gIFtUZXN0S2V5LkxFRlRfQVJST1ddOiB7a2V5Q29kZToga2V5Q29kZXMuTEVGVF9BUlJPVywga2V5OiAnQXJyb3dMZWZ0J30sXG4gIFtUZXN0S2V5LlVQX0FSUk9XXToge2tleUNvZGU6IGtleUNvZGVzLlVQX0FSUk9XLCBrZXk6ICdBcnJvd1VwJ30sXG4gIFtUZXN0S2V5LlJJR0hUX0FSUk9XXToge2tleUNvZGU6IGtleUNvZGVzLlJJR0hUX0FSUk9XLCBrZXk6ICdBcnJvd1JpZ2h0J30sXG4gIFtUZXN0S2V5LkRPV05fQVJST1ddOiB7a2V5Q29kZToga2V5Q29kZXMuRE9XTl9BUlJPVywga2V5OiAnQXJyb3dEb3duJ30sXG4gIFtUZXN0S2V5LklOU0VSVF06IHtrZXlDb2RlOiBrZXlDb2Rlcy5JTlNFUlQsIGtleTogJ0luc2VydCd9LFxuICBbVGVzdEtleS5ERUxFVEVdOiB7a2V5Q29kZToga2V5Q29kZXMuREVMRVRFLCBrZXk6ICdEZWxldGUnfSxcbiAgW1Rlc3RLZXkuRjFdOiB7a2V5Q29kZToga2V5Q29kZXMuRjEsIGtleTogJ0YxJ30sXG4gIFtUZXN0S2V5LkYyXToge2tleUNvZGU6IGtleUNvZGVzLkYyLCBrZXk6ICdGMid9LFxuICBbVGVzdEtleS5GM106IHtrZXlDb2RlOiBrZXlDb2Rlcy5GMywga2V5OiAnRjMnfSxcbiAgW1Rlc3RLZXkuRjRdOiB7a2V5Q29kZToga2V5Q29kZXMuRjQsIGtleTogJ0Y0J30sXG4gIFtUZXN0S2V5LkY1XToge2tleUNvZGU6IGtleUNvZGVzLkY1LCBrZXk6ICdGNSd9LFxuICBbVGVzdEtleS5GNl06IHtrZXlDb2RlOiBrZXlDb2Rlcy5GNiwga2V5OiAnRjYnfSxcbiAgW1Rlc3RLZXkuRjddOiB7a2V5Q29kZToga2V5Q29kZXMuRjcsIGtleTogJ0Y3J30sXG4gIFtUZXN0S2V5LkY4XToge2tleUNvZGU6IGtleUNvZGVzLkY4LCBrZXk6ICdGOCd9LFxuICBbVGVzdEtleS5GOV06IHtrZXlDb2RlOiBrZXlDb2Rlcy5GOSwga2V5OiAnRjknfSxcbiAgW1Rlc3RLZXkuRjEwXToge2tleUNvZGU6IGtleUNvZGVzLkYxMCwga2V5OiAnRjEwJ30sXG4gIFtUZXN0S2V5LkYxMV06IHtrZXlDb2RlOiBrZXlDb2Rlcy5GMTEsIGtleTogJ0YxMSd9LFxuICBbVGVzdEtleS5GMTJdOiB7a2V5Q29kZToga2V5Q29kZXMuRjEyLCBrZXk6ICdGMTInfSxcbiAgW1Rlc3RLZXkuTUVUQV06IHtrZXlDb2RlOiBrZXlDb2Rlcy5NRVRBLCBrZXk6ICdNZXRhJ31cbn07XG5cbi8qKiBBIGBUZXN0RWxlbWVudGAgaW1wbGVtZW50YXRpb24gZm9yIHVuaXQgdGVzdHMuICovXG5leHBvcnQgY2xhc3MgVW5pdFRlc3RFbGVtZW50IGltcGxlbWVudHMgVGVzdEVsZW1lbnQge1xuICBjb25zdHJ1Y3RvcihyZWFkb25seSBlbGVtZW50OiBFbGVtZW50LCBwcml2YXRlIF9zdGFiaWxpemU6ICgpID0+IFByb21pc2U8dm9pZD4pIHt9XG5cbiAgYXN5bmMgYmx1cigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICB0cmlnZ2VyQmx1cih0aGlzLmVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpO1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG5cbiAgYXN5bmMgY2xlYXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgaWYgKCFpc1RleHRJbnB1dCh0aGlzLmVsZW1lbnQpKSB7XG4gICAgICB0aHJvdyBFcnJvcignQXR0ZW1wdGluZyB0byBjbGVhciBhbiBpbnZhbGlkIGVsZW1lbnQnKTtcbiAgICB9XG4gICAgY2xlYXJFbGVtZW50KHRoaXMuZWxlbWVudCk7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gIH1cblxuICBhc3luYyBjbGljayhyZWxhdGl2ZVggPSAwLCByZWxhdGl2ZVkgPSAwKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgY29uc3Qge2xlZnQsIHRvcH0gPSB0aGlzLmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgLy8gUm91bmQgdGhlIGNvbXB1dGVkIGNsaWNrIHBvc2l0aW9uIGFzIGRlY2ltYWwgcGl4ZWxzIGFyZSBub3RcbiAgICAvLyBzdXBwb3J0ZWQgYnkgbW91c2UgZXZlbnRzIGFuZCBjb3VsZCBsZWFkIHRvIHVuZXhwZWN0ZWQgcmVzdWx0cy5cbiAgICBjb25zdCBjbGllbnRYID0gTWF0aC5yb3VuZChsZWZ0ICsgcmVsYXRpdmVYKTtcbiAgICBjb25zdCBjbGllbnRZID0gTWF0aC5yb3VuZCh0b3AgKyByZWxhdGl2ZVkpO1xuICAgIGRpc3BhdGNoTW91c2VFdmVudCh0aGlzLmVsZW1lbnQsICdtb3VzZWRvd24nLCBjbGllbnRYLCBjbGllbnRZKTtcbiAgICBkaXNwYXRjaE1vdXNlRXZlbnQodGhpcy5lbGVtZW50LCAnbW91c2V1cCcsIGNsaWVudFgsIGNsaWVudFkpO1xuICAgIGRpc3BhdGNoTW91c2VFdmVudCh0aGlzLmVsZW1lbnQsICdjbGljaycsIGNsaWVudFgsIGNsaWVudFkpO1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG5cbiAgYXN5bmMgZm9jdXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgdHJpZ2dlckZvY3VzKHRoaXMuZWxlbWVudCBhcyBIVE1MRWxlbWVudCk7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gIH1cblxuICBhc3luYyBnZXRDc3NWYWx1ZShwcm9wZXJ0eTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICAvLyBUT0RPKG1tYWxlcmJhKTogQ29uc2lkZXIgYWRkaW5nIHZhbHVlIG5vcm1hbGl6YXRpb24gaWYgd2UgcnVuIGludG8gY29tbW9uIGNhc2VzIHdoZXJlIGl0c1xuICAgIC8vICBuZWVkZWQuXG4gICAgcmV0dXJuIGdldENvbXB1dGVkU3R5bGUodGhpcy5lbGVtZW50KS5nZXRQcm9wZXJ0eVZhbHVlKHByb3BlcnR5KTtcbiAgfVxuXG4gIGFzeW5jIGhvdmVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIGRpc3BhdGNoTW91c2VFdmVudCh0aGlzLmVsZW1lbnQsICdtb3VzZWVudGVyJyk7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gIH1cblxuICBhc3luYyBzZW5kS2V5cyguLi5rZXlzOiAoc3RyaW5nIHwgVGVzdEtleSlbXSk6IFByb21pc2U8dm9pZD47XG4gIGFzeW5jIHNlbmRLZXlzKG1vZGlmaWVyczogTW9kaWZpZXJLZXlzLCAuLi5rZXlzOiAoc3RyaW5nIHwgVGVzdEtleSlbXSk6IFByb21pc2U8dm9pZD47XG4gIGFzeW5jIHNlbmRLZXlzKC4uLm1vZGlmaWVyc0FuZEtleXM6IGFueVtdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgY29uc3QgYXJncyA9IG1vZGlmaWVyc0FuZEtleXMubWFwKGsgPT4gdHlwZW9mIGsgPT09ICdudW1iZXInID8ga2V5TWFwW2sgYXMgVGVzdEtleV0gOiBrKTtcbiAgICB0eXBlSW5FbGVtZW50KHRoaXMuZWxlbWVudCBhcyBIVE1MRWxlbWVudCwgLi4uYXJncyk7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gIH1cblxuICBhc3luYyB0ZXh0KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgcmV0dXJuICh0aGlzLmVsZW1lbnQudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKTtcbiAgfVxuXG4gIGFzeW5jIGdldEF0dHJpYnV0ZShuYW1lOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ3xudWxsPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudC5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gIH1cblxuICBhc3luYyBoYXNDbGFzcyhuYW1lOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhuYW1lKTtcbiAgfVxuXG4gIGFzeW5jIGdldERpbWVuc2lvbnMoKTogUHJvbWlzZTxFbGVtZW50RGltZW5zaW9ucz4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIH1cblxuICBhc3luYyBnZXRQcm9wZXJ0eShuYW1lOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIHJldHVybiAodGhpcy5lbGVtZW50IGFzIGFueSlbbmFtZV07XG4gIH1cblxuICBhc3luYyBtYXRjaGVzU2VsZWN0b3Ioc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIGNvbnN0IGVsZW1lbnRQcm90b3R5cGUgPSBFbGVtZW50LnByb3RvdHlwZSBhcyBhbnk7XG4gICAgcmV0dXJuIChlbGVtZW50UHJvdG90eXBlWydtYXRjaGVzJ10gfHwgZWxlbWVudFByb3RvdHlwZVsnbXNNYXRjaGVzU2VsZWN0b3InXSlcbiAgICAgICAgLmNhbGwodGhpcy5lbGVtZW50LCBzZWxlY3Rvcik7XG4gIH1cblxuICBhc3luYyBpc0ZvY3VzZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgcmV0dXJuIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT09IHRoaXMuZWxlbWVudDtcbiAgfVxufVxuIl19