/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { HarnessPredicate } from './component-harness';
/**
 * Base harness environment class that can be extended to allow `ComponentHarness`es to be used in
 * different test environments (e.g. testbed, protractor, etc.). This class implements the
 * functionality of both a `HarnessLoader` and `LocatorFactory`. This class is generic on the raw
 * element type, `E`, used by the particular test environment.
 */
var HarnessEnvironment = /** @class */ (function () {
    function HarnessEnvironment(rawRootElement) {
        this.rawRootElement = rawRootElement;
        this.rootElement = this.createTestElement(rawRootElement);
    }
    // Implemented as part of the `LocatorFactory` interface.
    HarnessEnvironment.prototype.documentRootLocatorFactory = function () {
        return this.createEnvironment(this.getDocumentRoot());
    };
    HarnessEnvironment.prototype.locatorFor = function (arg) {
        var _this = this;
        return function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(typeof arg === 'string')) return [3 /*break*/, 2];
                        _a = this.createTestElement;
                        return [4 /*yield*/, this._assertElementFound(arg)];
                    case 1: return [2 /*return*/, _a.apply(this, [_b.sent()])];
                    case 2: return [2 /*return*/, this._assertHarnessFound(arg)];
                }
            });
        }); };
    };
    HarnessEnvironment.prototype.locatorForOptional = function (arg) {
        var _this = this;
        return function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var element, candidates;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(typeof arg === 'string')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getAllRawElements(arg)];
                    case 1:
                        element = (_a.sent())[0];
                        return [2 /*return*/, element ? this.createTestElement(element) : null];
                    case 2: return [4 /*yield*/, this._getAllHarnesses(arg)];
                    case 3:
                        candidates = _a.sent();
                        return [2 /*return*/, candidates[0] || null];
                }
            });
        }); };
    };
    HarnessEnvironment.prototype.locatorForAll = function (arg) {
        var _this = this;
        return function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(typeof arg === 'string')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getAllRawElements(arg)];
                    case 1: return [2 /*return*/, (_a.sent()).map(function (e) { return _this.createTestElement(e); })];
                    case 2: return [2 /*return*/, this._getAllHarnesses(arg)];
                }
            });
        }); };
    };
    // Implemented as part of the `LocatorFactory` interface.
    HarnessEnvironment.prototype.harnessLoaderFor = function (selector) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.createEnvironment;
                        return [4 /*yield*/, this._assertElementFound(selector)];
                    case 1: return [2 /*return*/, _a.apply(this, [_b.sent()])];
                }
            });
        });
    };
    // Implemented as part of the `LocatorFactory` interface.
    HarnessEnvironment.prototype.harnessLoaderForOptional = function (selector) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var elements;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getAllRawElements(selector)];
                    case 1:
                        elements = _a.sent();
                        return [2 /*return*/, elements[0] ? this.createEnvironment(elements[0]) : null];
                }
            });
        });
    };
    // Implemented as part of the `LocatorFactory` interface.
    HarnessEnvironment.prototype.harnessLoaderForAll = function (selector) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var elements;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getAllRawElements(selector)];
                    case 1:
                        elements = _a.sent();
                        return [2 /*return*/, elements.map(function (element) { return _this.createEnvironment(element); })];
                }
            });
        });
    };
    // Implemented as part of the `HarnessLoader` interface.
    HarnessEnvironment.prototype.getHarness = function (harnessType) {
        return this.locatorFor(harnessType)();
    };
    // Implemented as part of the `HarnessLoader` interface.
    HarnessEnvironment.prototype.getAllHarnesses = function (harnessType) {
        return this.locatorForAll(harnessType)();
    };
    // Implemented as part of the `HarnessLoader` interface.
    HarnessEnvironment.prototype.getChildLoader = function (selector) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.createEnvironment;
                        return [4 /*yield*/, this._assertElementFound(selector)];
                    case 1: return [2 /*return*/, _a.apply(this, [_b.sent()])];
                }
            });
        });
    };
    // Implemented as part of the `HarnessLoader` interface.
    HarnessEnvironment.prototype.getAllChildLoaders = function (selector) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getAllRawElements(selector)];
                    case 1: return [2 /*return*/, (_a.sent()).map(function (e) { return _this.createEnvironment(e); })];
                }
            });
        });
    };
    /** Creates a `ComponentHarness` for the given harness type with the given raw host element. */
    HarnessEnvironment.prototype.createComponentHarness = function (harnessType, element) {
        return new harnessType(this.createEnvironment(element));
    };
    HarnessEnvironment.prototype._getAllHarnesses = function (harnessType) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var harnessPredicate, elements;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        harnessPredicate = harnessType instanceof HarnessPredicate ?
                            harnessType : new HarnessPredicate(harnessType, {});
                        return [4 /*yield*/, this.getAllRawElements(harnessPredicate.getSelector())];
                    case 1:
                        elements = _a.sent();
                        return [2 /*return*/, harnessPredicate.filter(elements.map(function (element) { return _this.createComponentHarness(harnessPredicate.harnessType, element); }))];
                }
            });
        });
    };
    HarnessEnvironment.prototype._assertElementFound = function (selector) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var element;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getAllRawElements(selector)];
                    case 1:
                        element = (_a.sent())[0];
                        if (!element) {
                            throw Error("Expected to find element matching selector: \"" + selector + "\", but none was found");
                        }
                        return [2 /*return*/, element];
                }
            });
        });
    };
    HarnessEnvironment.prototype._assertHarnessFound = function (harnessType) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var harness;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._getAllHarnesses(harnessType)];
                    case 1:
                        harness = (_a.sent())[0];
                        if (!harness) {
                            throw _getErrorForMissingHarness(harnessType);
                        }
                        return [2 /*return*/, harness];
                }
            });
        });
    };
    return HarnessEnvironment;
}());
export { HarnessEnvironment };
function _getErrorForMissingHarness(harnessType) {
    var harnessPredicate = harnessType instanceof HarnessPredicate ? harnessType : new HarnessPredicate(harnessType, {});
    var _a = harnessPredicate.harnessType, name = _a.name, hostSelector = _a.hostSelector;
    var restrictions = harnessPredicate.getDescription();
    var message = "Expected to find element for " + name + " matching selector: \"" + hostSelector + "\"";
    if (restrictions) {
        message += " (with restrictions: " + restrictions + ")";
    }
    message += ', but none was found';
    return Error(message);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFybmVzcy1lbnZpcm9ubWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGVzdGluZy9oYXJuZXNzLWVudmlyb25tZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBS0wsZ0JBQWdCLEVBRWpCLE1BQU0scUJBQXFCLENBQUM7QUFHN0I7Ozs7O0dBS0c7QUFDSDtJQUlFLDRCQUFnQyxjQUFpQjtRQUFqQixtQkFBYyxHQUFkLGNBQWMsQ0FBRztRQUMvQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBRUQseURBQXlEO0lBQ3pELHVEQUEwQixHQUExQjtRQUNFLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDO0lBQ3hELENBQUM7SUFNRCx1Q0FBVSxHQUFWLFVBQ0ksR0FBa0U7UUFEdEUsaUJBU0M7UUFQQyxPQUFPOzs7Ozs2QkFDRCxDQUFBLE9BQU8sR0FBRyxLQUFLLFFBQVEsQ0FBQSxFQUF2Qix3QkFBdUI7d0JBQ2xCLEtBQUEsSUFBSSxDQUFDLGlCQUFpQixDQUFBO3dCQUFDLHFCQUFNLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsRUFBQTs0QkFBakUsc0JBQU8sU0FBQSxJQUFJLEdBQW1CLFNBQW1DLEVBQUMsRUFBQzs0QkFFbkUsc0JBQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxFQUFDOzs7YUFFeEMsQ0FBQztJQUNKLENBQUM7SUFNRCwrQ0FBa0IsR0FBbEIsVUFDSSxHQUFrRTtRQUR0RSxpQkFXQztRQVRDLE9BQU87Ozs7OzZCQUNELENBQUEsT0FBTyxHQUFHLEtBQUssUUFBUSxDQUFBLEVBQXZCLHdCQUF1Qjt3QkFDUixxQkFBTSxJQUFJLENBQUMs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LHNCQUFPLE9BQU8sRUFBQzs7OztLQUNoQjtJQUVhLGdEQUFtQixHQUFqQyxVQUNJLFdBQWlFOzs7Ozs0QkFDbEQscUJBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxFQUFBOzt3QkFBbkQsT0FBTyxHQUFHLENBQUMsU0FBd0MsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDN0QsSUFBSSxDQUFDLE9BQU8sRUFBRTs0QkFDWixNQUFNLDBCQUEwQixDQUFDLFdBQVcsQ0FBQyxDQUFDO3lCQUMvQzt3QkFDRCxzQkFBTyxPQUFPLEVBQUM7Ozs7S0FDaEI7SUFDSCx5QkFBQztBQUFELENBQUMsQUFuSkQsSUFtSkM7O0FBRUQsU0FBUywwQkFBMEIsQ0FDL0IsV0FBaUU7SUFDbkUsSUFBTSxnQkFBZ0IsR0FDbEIsV0FBVyxZQUFZLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksZ0JBQWdCLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzVGLElBQUEsaUNBQW1ELEVBQWxELGNBQUksRUFBRSw4QkFBNEMsQ0FBQztJQUMxRCxJQUFJLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQyxjQUFjLEVBQUUsQ0FBQztJQUNyRCxJQUFJLE9BQU8sR0FBRyxrQ0FBZ0MsSUFBSSw4QkFBd0IsWUFBWSxPQUFHLENBQUM7SUFDMUYsSUFBSSxZQUFZLEVBQUU7UUFDaEIsT0FBTyxJQUFJLDBCQUF3QixZQUFZLE1BQUcsQ0FBQztLQUNwRDtJQUNELE9BQU8sSUFBSSxzQkFBc0IsQ0FBQztJQUNsQyxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUN4QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIEFzeW5jRmFjdG9yeUZuLFxuICBDb21wb25lbnRIYXJuZXNzLFxuICBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3IsXG4gIEhhcm5lc3NMb2FkZXIsXG4gIEhhcm5lc3NQcmVkaWNhdGUsXG4gIExvY2F0b3JGYWN0b3J5XG59IGZyb20gJy4vY29tcG9uZW50LWhhcm5lc3MnO1xuaW1wb3J0IHtUZXN0RWxlbWVudH0gZnJvbSAnLi90ZXN0LWVsZW1lbnQnO1xuXG4vKipcbiAqIEJhc2UgaGFybmVzcyBlbnZpcm9ubWVudCBjbGFzcyB0aGF0IGNhbiBiZSBleHRlbmRlZCB0byBhbGxvdyBgQ29tcG9uZW50SGFybmVzc2BlcyB0byBiZSB1c2VkIGluXG4gKiBkaWZmZXJlbnQgdGVzdCBlbnZpcm9ubWVudHMgKGUuZy4gdGVzdGJlZCwgcHJvdHJhY3RvciwgZXRjLikuIFRoaXMgY2xhc3MgaW1wbGVtZW50cyB0aGVcbiAqIGZ1bmN0aW9uYWxpdHkgb2YgYm90aCBhIGBIYXJuZXNzTG9hZGVyYCBhbmQgYExvY2F0b3JGYWN0b3J5YC4gVGhpcyBjbGFzcyBpcyBnZW5lcmljIG9uIHRoZSByYXdcbiAqIGVsZW1lbnQgdHlwZSwgYEVgLCB1c2VkIGJ5IHRoZSBwYXJ0aWN1bGFyIHRlc3QgZW52aXJvbm1lbnQuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBIYXJuZXNzRW52aXJvbm1lbnQ8RT4gaW1wbGVtZW50cyBIYXJuZXNzTG9hZGVyLCBMb2NhdG9yRmFjdG9yeSB7XG4gIC8vIEltcGxlbWVudGVkIGFzIHBhcnQgb2YgdGhlIGBMb2NhdG9yRmFjdG9yeWAgaW50ZXJmYWNlLlxuICByb290RWxlbWVudDogVGVzdEVsZW1lbnQ7XG5cbiAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKHByb3RlY3RlZCByYXdSb290RWxlbWVudDogRSkge1xuICAgIHRoaXMucm9vdEVsZW1lbnQgPSB0aGlzLmNyZWF0ZVRlc3RFbGVtZW50KHJhd1Jvb3RFbGVtZW50KTtcbiAgfVxuXG4gIC8vIEltcGxlbWVudGVkIGFzIHBhcnQgb2YgdGhlIGBMb2NhdG9yRmFjdG9yeWAgaW50ZXJmYWNlLlxuICBkb2N1bWVudFJvb3RMb2NhdG9yRmFjdG9yeSgpOiBMb2NhdG9yRmFjdG9yeSB7XG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlRW52aXJvbm1lbnQodGhpcy5nZXREb2N1bWVudFJvb3QoKSk7XG4gIH1cblxuICAvLyBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIHRoZSBgTG9jYXRvckZhY3RvcnlgIGludGVyZmFjZS5cbiAgbG9jYXRvckZvcihzZWxlY3Rvcjogc3RyaW5nKTogQXN5bmNGYWN0b3J5Rm48VGVzdEVsZW1lbnQ+O1xuICBsb2NhdG9yRm9yPFQgZXh0ZW5kcyBDb21wb25lbnRIYXJuZXNzPihcbiAgICAgIGhhcm5lc3NUeXBlOiBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8VD4gfCBIYXJuZXNzUHJlZGljYXRlPFQ+KTogQXN5bmNGYWN0b3J5Rm48VD47XG4gIGxvY2F0b3JGb3I8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+KFxuICAgICAgYXJnOiBzdHJpbmcgfCBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8VD4gfCBIYXJuZXNzUHJlZGljYXRlPFQ+KSB7XG4gICAgcmV0dXJuIGFzeW5jICgpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVUZXN0RWxlbWVudChhd2FpdCB0aGlzLl9hc3NlcnRFbGVtZW50Rm91bmQoYXJnKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5fYXNzZXJ0SGFybmVzc0ZvdW5kKGFyZyk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8vIEltcGxlbWVudGVkIGFzIHBhcnQgb2YgdGhlIGBMb2NhdG9yRmFjdG9yeWAgaW50ZXJmYWNlLlxuICBsb2NhdG9yRm9yT3B0aW9uYWwoc2VsZWN0b3I6IHN0cmluZyk6IEFzeW5jRmFjdG9yeUZuPFRlc3RFbGVtZW50IHwgbnVsbD47XG4gIGxvY2F0b3JGb3JPcHRpb25hbDxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4oXG4gICAgICBoYXJuZXNzVHlwZTogQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPFQ+IHwgSGFybmVzc1ByZWRpY2F0ZTxUPik6IEFzeW5jRmFjdG9yeUZuPFQgfCBudWxsPjtcbiAgbG9jYXRvckZvck9wdGlvbmFsPFQgZXh0ZW5kcyBDb21wb25lbnRIYXJuZXNzPihcbiAgICAgIGFyZzogc3RyaW5nIHwgQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPFQ+IHwgSGFybmVzc1ByZWRpY2F0ZTxUPikge1xuICAgIHJldHVybiBhc3luYyAoKSA9PiB7XG4gICAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IChhd2FpdCB0aGlzLmdldEFsbFJhd0VsZW1lbnRzKGFyZykpWzBdO1xuICAgICAgICByZXR1cm4gZWxlbWVudCA/IHRoaXMuY3JlYXRlVGVzdEVsZW1lbnQoZWxlbWVudCkgOiBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgY2FuZGlkYXRlcyA9IGF3YWl0IHRoaXMuX2dldEFsbEhhcm5lc3NlcyhhcmcpO1xuICAgICAgICByZXR1cm4gY2FuZGlkYXRlc1swXSB8fCBudWxsO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIHRoZSBgTG9jYXRvckZhY3RvcnlgIGludGVyZmFjZS5cbiAgbG9jYXRvckZvckFsbChzZWxlY3Rvcjogc3RyaW5nKTogQXN5bmNGYWN0b3J5Rm48VGVzdEVsZW1lbnRbXT47XG4gIGxvY2F0b3JGb3JBbGw8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+KFxuICAgICAgaGFybmVzc1R5cGU6IENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcjxUPiB8IEhhcm5lc3NQcmVkaWNhdGU8VD4pOiBBc3luY0ZhY3RvcnlGbjxUW10+O1xuICBsb2NhdG9yRm9yQWxsPFQgZXh0ZW5kcyBDb21wb25lbnRIYXJuZXNzPihcbiAgICAgIGFyZzogc3RyaW5nIHwgQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPFQ+IHwgSGFybmVzc1ByZWRpY2F0ZTxUPikge1xuICAgIHJldHVybiBhc3luYyAoKSA9PiB7XG4gICAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldEFsbFJhd0VsZW1lbnRzKGFyZykpLm1hcChlID0+IHRoaXMuY3JlYXRlVGVzdEVsZW1lbnQoZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dldEFsbEhhcm5lc3NlcyhhcmcpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIHRoZSBgTG9jYXRvckZhY3RvcnlgIGludGVyZmFjZS5cbiAgYXN5bmMgaGFybmVzc0xvYWRlckZvcihzZWxlY3Rvcjogc3RyaW5nKTogUHJvbWlzZTxIYXJuZXNzTG9hZGVyPiB7XG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlRW52aXJvbm1lbnQoYXdhaXQgdGhpcy5fYXNzZXJ0RWxlbWVudEZvdW5kKHNlbGVjdG9yKSk7XG4gIH1cblxuICAvLyBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIHRoZSBgTG9jYXRvckZhY3RvcnlgIGludGVyZmFjZS5cbiAgYXN5bmMgaGFybmVzc0xvYWRlckZvck9wdGlvbmFsKHNlbGVjdG9yOiBzdHJpbmcpOiBQcm9taXNlPEhhcm5lc3NMb2FkZXIgfCBudWxsPiB7XG4gICAgY29uc3QgZWxlbWVudHMgPSBhd2FpdCB0aGlzLmdldEFsbFJhd0VsZW1lbnRzKHNlbGVjdG9yKTtcbiAgICByZXR1cm4gZWxlbWVudHNbMF0gPyB0aGlzLmNyZWF0ZUVudmlyb25tZW50KGVsZW1lbnRzWzBdKSA6IG51bGw7XG4gIH1cblxuICAvLyBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIHRoZSBgTG9jYXRvckZhY3RvcnlgIGludGVyZmFjZS5cbiAgYXN5bmMgaGFybmVzc0xvYWRlckZvckFsbChzZWxlY3Rvcjogc3RyaW5nKTogUHJvbWlzZTxIYXJuZXNzTG9hZGVyW10+IHtcbiAgICBjb25zdCBlbGVtZW50cyA9IGF3YWl0IHRoaXMuZ2V0QWxsUmF3RWxlbWVudHMoc2VsZWN0b3IpO1xuICAgIHJldHVybiBlbGVtZW50cy5tYXAoZWxlbWVudCA9PiB0aGlzLmNyZWF0ZUVudmlyb25tZW50KGVsZW1lbnQpKTtcbiAgfVxuXG4gIC8vIEltcGxlbWVudGVkIGFzIHBhcnQgb2YgdGhlIGBIYXJuZXNzTG9hZGVyYCBpbnRlcmZhY2UuXG4gIGdldEhhcm5lc3M8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+KFxuICAgICAgaGFybmVzc1R5cGU6IENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcjxUPiB8IEhhcm5lc3NQcmVkaWNhdGU8VD4pOiBQcm9taXNlPFQ+IHtcbiAgICByZXR1cm4gdGhpcy5sb2NhdG9yRm9yKGhhcm5lc3NUeXBlKSgpO1xuICB9XG5cbiAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiB0aGUgYEhhcm5lc3NMb2FkZXJgIGludGVyZmFjZS5cbiAgZ2V0QWxsSGFybmVzc2VzPFQgZXh0ZW5kcyBDb21wb25lbnRIYXJuZXNzPihcbiAgICAgIGhhcm5lc3NUeXBlOiBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8VD4gfCBIYXJuZXNzUHJlZGljYXRlPFQ+KTogUHJvbWlzZTxUW10+IHtcbiAgICByZXR1cm4gdGhpcy5sb2NhdG9yRm9yQWxsKGhhcm5lc3NUeXBlKSgpO1xuICB9XG5cbiAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiB0aGUgYEhhcm5lc3NMb2FkZXJgIGludGVyZmFjZS5cbiAgYXN5bmMgZ2V0Q2hpbGRMb2FkZXIoc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8SGFybmVzc0xvYWRlcj4ge1xuICAgIHJldHVybiB0aGlzLmNyZWF0ZUVudmlyb25tZW50KGF3YWl0IHRoaXMuX2Fzc2VydEVsZW1lbnRGb3VuZChzZWxlY3RvcikpO1xuICB9XG5cbiAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiB0aGUgYEhhcm5lc3NMb2FkZXJgIGludGVyZmFjZS5cbiAgYXN5bmMgZ2V0QWxsQ2hpbGRMb2FkZXJzKHNlbGVjdG9yOiBzdHJpbmcpOiBQcm9taXNlPEhhcm5lc3NMb2FkZXJbXT4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRBbGxSYXdFbGVtZW50cyhzZWxlY3RvcikpLm1hcChlID0+IHRoaXMuY3JlYXRlRW52aXJvbm1lbnQoZSkpO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBgQ29tcG9uZW50SGFybmVzc2AgZm9yIHRoZSBnaXZlbiBoYXJuZXNzIHR5cGUgd2l0aCB0aGUgZ2l2ZW4gcmF3IGhvc3QgZWxlbWVudC4gKi9cbiAgcHJvdGVjdGVkIGNyZWF0ZUNvbXBvbmVudEhhcm5lc3M8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+KFxuICAgICAgaGFybmVzc1R5cGU6IENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcjxUPiwgZWxlbWVudDogRSk6IFQge1xuICAgIHJldHVybiBuZXcgaGFybmVzc1R5cGUodGhpcy5jcmVhdGVFbnZpcm9ubWVudChlbGVtZW50KSk7XG4gIH1cblxuICAvLyBQYXJ0IG9mIExvY2F0b3JGYWN0b3J5IGludGVyZmFjZSwgc3ViY2xhc3NlcyB3aWxsIGltcGxlbWVudC5cbiAgYWJzdHJhY3QgZm9yY2VTdGFiaWxpemUoKTogUHJvbWlzZTx2b2lkPjtcblxuICAvKiogR2V0cyB0aGUgcm9vdCBlbGVtZW50IGZvciB0aGUgZG9jdW1lbnQuICovXG4gIHByb3RlY3RlZCBhYnN0cmFjdCBnZXREb2N1bWVudFJvb3QoKTogRTtcblxuICAvKiogQ3JlYXRlcyBhIGBUZXN0RWxlbWVudGAgZnJvbSBhIHJhdyBlbGVtZW50LiAqL1xuICBwcm90ZWN0ZWQgYWJzdHJhY3QgY3JlYXRlVGVzdEVsZW1lbnQoZWxlbWVudDogRSk6IFRlc3RFbGVtZW50O1xuXG4gIC8qKiBDcmVhdGVzIGEgYEhhcm5lc3NMb2FkZXJgIHJvb3RlZCBhdCB0aGUgZ2l2ZW4gcmF3IGVsZW1lbnQuICovXG4gIHByb3RlY3RlZCBhYnN0cmFjdCBjcmVhdGVFbnZpcm9ubWVudChlbGVtZW50OiBFKTogSGFybmVzc0Vudmlyb25tZW50PEU+O1xuXG4gIC8qKlxuICAgKiBHZXRzIGEgbGlzdCBvZiBhbGwgZWxlbWVudHMgbWF0Y2hpbmcgdGhlIGdpdmVuIHNlbGVjdG9yIHVuZGVyIHRoaXMgZW52aXJvbm1lbnQncyByb290IGVsZW1lbnQuXG4gICAqL1xuICBwcm90ZWN0ZWQgYWJzdHJhY3QgZ2V0QWxsUmF3RWxlbWVudHMoc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8RVtdPjtcblxuICBwcml2YXRlIGFzeW5jIF9nZXRBbGxIYXJuZXNzZXM8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+KFxuICAgICAgaGFybmVzc1R5cGU6IENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcjxUPiB8IEhhcm5lc3NQcmVkaWNhdGU8VD4pOiBQcm9taXNlPFRbXT4ge1xuICAgIGNvbnN0IGhhcm5lc3NQcmVkaWNhdGUgPSBoYXJuZXNzVHlwZSBpbnN0YW5jZW9mIEhhcm5lc3NQcmVkaWNhdGUgP1xuICAgICAgICBoYXJuZXNzVHlwZSA6IG5ldyBIYXJuZXNzUHJlZGljYXRlKGhhcm5lc3NUeXBlLCB7fSk7XG4gICAgY29uc3QgZWxlbWVudHMgPSBhd2FpdCB0aGlzLmdldEFsbFJhd0VsZW1lbnRzKGhhcm5lc3NQcmVkaWNhdGUuZ2V0U2VsZWN0b3IoKSk7XG4gICAgcmV0dXJuIGhhcm5lc3NQcmVkaWNhdGUuZmlsdGVyKGVsZW1lbnRzLm1hcChcbiAgICAgICAgZWxlbWVudCA9PiB0aGlzLmNyZWF0ZUNvbXBvbmVudEhhcm5lc3MoaGFybmVzc1ByZWRpY2F0ZS5oYXJuZXNzVHlwZSwgZWxlbWVudCkpKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgX2Fzc2VydEVsZW1lbnRGb3VuZChzZWxlY3Rvcjogc3RyaW5nKTogUHJvbWlzZTxFPiB7XG4gICAgY29uc3QgZWxlbWVudCA9IChhd2FpdCB0aGlzLmdldEFsbFJhd0VsZW1lbnRzKHNlbGVjdG9yKSlbMF07XG4gICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICB0aHJvdyBFcnJvcihgRXhwZWN0ZWQgdG8gZmluZCBlbGVtZW50IG1hdGNoaW5nIHNlbGVjdG9yOiBcIiR7c2VsZWN0b3J9XCIsIGJ1dCBub25lIHdhcyBmb3VuZGApO1xuICAgIH1cbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgX2Fzc2VydEhhcm5lc3NGb3VuZDxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4oXG4gICAgICBoYXJuZXNzVHlwZTogQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPFQ+IHwgSGFybmVzc1ByZWRpY2F0ZTxUPik6IFByb21pc2U8VD4ge1xuICAgIGNvbnN0IGhhcm5lc3MgPSAoYXdhaXQgdGhpcy5fZ2V0QWxsSGFybmVzc2VzKGhhcm5lc3NUeXBlKSlbMF07XG4gICAgaWYgKCFoYXJuZXNzKSB7XG4gICAgICB0aHJvdyBfZ2V0RXJyb3JGb3JNaXNzaW5nSGFybmVzcyhoYXJuZXNzVHlwZSk7XG4gICAgfVxuICAgIHJldHVybiBoYXJuZXNzO1xuICB9XG59XG5cbmZ1bmN0aW9uIF9nZXRFcnJvckZvck1pc3NpbmdIYXJuZXNzPFQgZXh0ZW5kcyBDb21wb25lbnRIYXJuZXNzPihcbiAgICBoYXJuZXNzVHlwZTogQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPFQ+IHwgSGFybmVzc1ByZWRpY2F0ZTxUPik6IEVycm9yIHtcbiAgY29uc3QgaGFybmVzc1ByZWRpY2F0ZSA9XG4gICAgICBoYXJuZXNzVHlwZSBpbnN0YW5jZW9mIEhhcm5lc3NQcmVkaWNhdGUgPyBoYXJuZXNzVHlwZSA6IG5ldyBIYXJuZXNzUHJlZGljYXRlKGhhcm5lc3NUeXBlLCB7fSk7XG4gIGNvbnN0IHtuYW1lLCBob3N0U2VsZWN0b3J9ID0gaGFybmVzc1ByZWRpY2F0ZS5oYXJuZXNzVHlwZTtcbiAgbGV0IHJlc3RyaWN0aW9ucyA9IGhhcm5lc3NQcmVkaWNhdGUuZ2V0RGVzY3JpcHRpb24oKTtcbiAgbGV0IG1lc3NhZ2UgPSBgRXhwZWN0ZWQgdG8gZmluZCBlbGVtZW50IGZvciAke25hbWV9IG1hdGNoaW5nIHNlbGVjdG9yOiBcIiR7aG9zdFNlbGVjdG9yfVwiYDtcbiAgaWYgKHJlc3RyaWN0aW9ucykge1xuICAgIG1lc3NhZ2UgKz0gYCAod2l0aCByZXN0cmljdGlvbnM6ICR7cmVzdHJpY3Rpb25zfSlgO1xuICB9XG4gIG1lc3NhZ2UgKz0gJywgYnV0IG5vbmUgd2FzIGZvdW5kJztcbiAgcmV0dXJuIEVycm9yKG1lc3NhZ2UpO1xufVxuIl19