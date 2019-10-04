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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFybmVzcy1lbnZpcm9ubWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGVzdGluZy9oYXJuZXNzLWVudmlyb25tZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBS0wsZ0JBQWdCLEVBRWpCLE1BQU0scUJBQXFCLENBQUM7QUFHN0I7Ozs7O0dBS0c7QUFDSDtJQUlFLDRCQUFnQyxjQUFpQjtRQUFqQixtQkFBYyxHQUFkLGNBQWMsQ0FBRztRQUMvQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBRUQseURBQXlEO0lBQ3pELHVEQUEwQixHQUExQjtRQUNFLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDO0lBQ3hELENBQUM7SUFNRCx1Q0FBVSxHQUFWLFVBQ0ksR0FBa0U7UUFEdEUsaUJBU0M7UUFQQyxPQUFPOzs7Ozs2QkFDRCxDQUFBLE9BQU8sR0FBRyxLQUFLLFFBQVEsQ0FBQSxFQUF2Qix3QkFBdUI7d0JBQ2xCLEtBQUEsSUFBSSxDQUFDLGlCQUFpQixDQUFBO3dCQUFDLHFCQUFNLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsRUFBQTs0QkFBakUsc0JBQU8sU0FBQSxJQUFJLEdBQW1CLFNBQW1DLEVBQUMsRUFBQzs0QkFFbkUsc0JBQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxFQUFDOzs7YUFFeEMsQ0FBQztJQUNKLENBQUM7SUFNRCwrQ0FBa0IsR0FBbEIsVUFDSSxHQUFrRTtRQUR0RSxpQkFXQztRQVRDLE9BQU87Ozs7OzZCQUNELENBQUEsT0FBTyxHQUFHLEtBQUssUUFBUSxDQUFBLEVBQXZCLHdCQUF1Qjt3QkFDUixxQkFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLEVBQUE7O3dCQUE1QyxPQUFPLEdBQUcsQ0FBQyxTQUFpQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUN0RCxzQkFBTyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFDOzRCQUVyQyxxQkFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEVBQUE7O3dCQUE3QyxVQUFVLEdBQUcsU0FBZ0M7d0JBQ25ELHNCQUFPLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLEVBQUM7OzthQUVoQyxDQUFDO0lBQ0osQ0FBQztJQU1ELDBDQUFhLEdBQWIsVUFDSSxHQUFrRTtRQUR0RSxpQkFTQztRQVBDLE9BQU87Ozs7OzZCQUNELENBQUEsT0FBTyxHQUFHLEtBQUssUUFBUSxDQUFBLEVBQXZCLHdCQUF1Qjt3QkFDakIscUJBQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxFQUFBOzRCQUF6QyxzQkFBTyxDQUFDLFNBQWlDLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxLQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLEVBQXpCLENBQXlCLENBQUMsRUFBQzs0QkFFL0Usc0JBQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxFQUFDOzs7YUFFckMsQ0FBQztJQUNKLENBQUM7SUFFRCx3REFBd0Q7SUFDeEQsdUNBQVUsR0FBVixVQUNJLFdBQWlFO1FBQ25FLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDO0lBQ3hDLENBQUM7SUFFRCx3REFBd0Q7SUFDeEQsNENBQWUsR0FBZixVQUNJLFdBQWlFO1FBQ25FLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDO0lBQzNDLENBQUM7SUFFRCx3REFBd0Q7SUFDbEQsMkNBQWMsR0FBcEIsVUFBcUIsUUFBZ0I7Ozs7Ozt3QkFDNUIsS0FBQSxJQUFJLENBQUMsaUJBQWlCLENBQUE7d0JBQUMscUJBQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxFQUFBOzRCQUF0RSxzQkFBTyxTQUFBLElBQUksR0FBbUIsU0FBd0MsRUFBQyxFQUFDOzs7O0tBQ3pFO0lBRUQsd0RBQXdEO0lBQ2xELCtDQUFrQixHQUF4QixVQUF5QixRQUFnQjs7Ozs7NEJBQy9CLHFCQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsRUFBQTs0QkFBOUMsc0JBQU8sQ0FBQyxTQUFzQyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsS0FBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxFQUF6QixDQUF5QixDQUFDLEVBQUM7Ozs7S0FDckY7SUFFRCwrRkFBK0Y7SUFDckYsbURBQXNCLEdBQWhDLFVBQ0ksV0FBMkMsRUFBRSxPQUFVO1FBQ3pELE9BQU8sSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDMUQsQ0FBQztJQW1CYSw2Q0FBZ0IsR0FBOUIsVUFDSSxXQUFpRTs7Ozs7Ozt3QkFDN0QsZ0JBQWdCLEdBQUcsV0FBVyxZQUFZLGdCQUFnQixDQUFDLENBQUM7NEJBQzlELFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUM7d0JBQ3ZDLHFCQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFBOzt3QkFBdkUsUUFBUSxHQUFHLFNBQTREO3dCQUM3RSxzQkFBTyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FDdkMsVUFBQSxPQUFPLElBQUksT0FBQSxLQUFJLENBQUMsc0JBQXNCLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxFQUFsRSxDQUFrRSxDQUFDLENBQUMsRUFBQzs7OztLQUNyRjtJQUVhLGdEQUFtQixHQUFqQyxVQUFrQyxRQUFnQjs7Ozs7NEJBQy9CLHFCQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsRUFBQTs7d0JBQWpELE9BQU8sR0FBRyxDQUFDLFNBQXNDLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzNELElBQUksQ0FBQyxPQUFPLEVBQUU7NEJBQ1osTUFBTSxLQUFLLENBQUMsbURBQWdELFFBQVEsMkJBQXVCLENBQUMsQ0FBQzt5QkFDOUY7d0JBQ0Qsc0JBQU8sT0FBTyxFQUFDOzs7O0tBQ2hCO0lBRWEsZ0RBQW1CLEdBQWpDLFVBQ0ksV0FBaUU7Ozs7OzRCQUNsRCxxQkFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLEVBQUE7O3dCQUFuRCxPQUFPLEdBQUcsQ0FBQyxTQUF3QyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUM3RCxJQUFJLENBQUMsT0FBTyxFQUFFOzRCQUNaLE1BQU0sMEJBQTBCLENBQUMsV0FBVyxDQUFDLENBQUM7eUJBQy9DO3dCQUNELHNCQUFPLE9BQU8sRUFBQzs7OztLQUNoQjtJQUNILHlCQUFDO0FBQUQsQ0FBQyxBQWxJRCxJQWtJQzs7QUFFRCxTQUFTLDBCQUEwQixDQUMvQixXQUFpRTtJQUNuRSxJQUFNLGdCQUFnQixHQUNsQixXQUFXLFlBQVksZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDNUYsSUFBQSxpQ0FBbUQsRUFBbEQsY0FBSSxFQUFFLDhCQUE0QyxDQUFDO0lBQzFELElBQUksWUFBWSxHQUFHLGdCQUFnQixDQUFDLGNBQWMsRUFBRSxDQUFDO0lBQ3JELElBQUksT0FBTyxHQUFHLGtDQUFnQyxJQUFJLDhCQUF3QixZQUFZLE9BQUcsQ0FBQztJQUMxRixJQUFJLFlBQVksRUFBRTtRQUNoQixPQUFPLElBQUksMEJBQXdCLFlBQVksTUFBRyxDQUFDO0tBQ3BEO0lBQ0QsT0FBTyxJQUFJLHNCQUFzQixDQUFDO0lBQ2xDLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3hCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgQXN5bmNGYWN0b3J5Rm4sXG4gIENvbXBvbmVudEhhcm5lc3MsXG4gIENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcixcbiAgSGFybmVzc0xvYWRlcixcbiAgSGFybmVzc1ByZWRpY2F0ZSxcbiAgTG9jYXRvckZhY3Rvcnlcbn0gZnJvbSAnLi9jb21wb25lbnQtaGFybmVzcyc7XG5pbXBvcnQge1Rlc3RFbGVtZW50fSBmcm9tICcuL3Rlc3QtZWxlbWVudCc7XG5cbi8qKlxuICogQmFzZSBoYXJuZXNzIGVudmlyb25tZW50IGNsYXNzIHRoYXQgY2FuIGJlIGV4dGVuZGVkIHRvIGFsbG93IGBDb21wb25lbnRIYXJuZXNzYGVzIHRvIGJlIHVzZWQgaW5cbiAqIGRpZmZlcmVudCB0ZXN0IGVudmlyb25tZW50cyAoZS5nLiB0ZXN0YmVkLCBwcm90cmFjdG9yLCBldGMuKS4gVGhpcyBjbGFzcyBpbXBsZW1lbnRzIHRoZVxuICogZnVuY3Rpb25hbGl0eSBvZiBib3RoIGEgYEhhcm5lc3NMb2FkZXJgIGFuZCBgTG9jYXRvckZhY3RvcnlgLiBUaGlzIGNsYXNzIGlzIGdlbmVyaWMgb24gdGhlIHJhd1xuICogZWxlbWVudCB0eXBlLCBgRWAsIHVzZWQgYnkgdGhlIHBhcnRpY3VsYXIgdGVzdCBlbnZpcm9ubWVudC5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEhhcm5lc3NFbnZpcm9ubWVudDxFPiBpbXBsZW1lbnRzIEhhcm5lc3NMb2FkZXIsIExvY2F0b3JGYWN0b3J5IHtcbiAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiB0aGUgYExvY2F0b3JGYWN0b3J5YCBpbnRlcmZhY2UuXG4gIHJvb3RFbGVtZW50OiBUZXN0RWxlbWVudDtcblxuICBwcm90ZWN0ZWQgY29uc3RydWN0b3IocHJvdGVjdGVkIHJhd1Jvb3RFbGVtZW50OiBFKSB7XG4gICAgdGhpcy5yb290RWxlbWVudCA9IHRoaXMuY3JlYXRlVGVzdEVsZW1lbnQocmF3Um9vdEVsZW1lbnQpO1xuICB9XG5cbiAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiB0aGUgYExvY2F0b3JGYWN0b3J5YCBpbnRlcmZhY2UuXG4gIGRvY3VtZW50Um9vdExvY2F0b3JGYWN0b3J5KCk6IExvY2F0b3JGYWN0b3J5IHtcbiAgICByZXR1cm4gdGhpcy5jcmVhdGVFbnZpcm9ubWVudCh0aGlzLmdldERvY3VtZW50Um9vdCgpKTtcbiAgfVxuXG4gIC8vIEltcGxlbWVudGVkIGFzIHBhcnQgb2YgdGhlIGBMb2NhdG9yRmFjdG9yeWAgaW50ZXJmYWNlLlxuICBsb2NhdG9yRm9yKHNlbGVjdG9yOiBzdHJpbmcpOiBBc3luY0ZhY3RvcnlGbjxUZXN0RWxlbWVudD47XG4gIGxvY2F0b3JGb3I8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+KFxuICAgICAgaGFybmVzc1R5cGU6IENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcjxUPiB8IEhhcm5lc3NQcmVkaWNhdGU8VD4pOiBBc3luY0ZhY3RvcnlGbjxUPjtcbiAgbG9jYXRvckZvcjxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4oXG4gICAgICBhcmc6IHN0cmluZyB8IENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcjxUPiB8IEhhcm5lc3NQcmVkaWNhdGU8VD4pIHtcbiAgICByZXR1cm4gYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVRlc3RFbGVtZW50KGF3YWl0IHRoaXMuX2Fzc2VydEVsZW1lbnRGb3VuZChhcmcpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hc3NlcnRIYXJuZXNzRm91bmQoYXJnKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiB0aGUgYExvY2F0b3JGYWN0b3J5YCBpbnRlcmZhY2UuXG4gIGxvY2F0b3JGb3JPcHRpb25hbChzZWxlY3Rvcjogc3RyaW5nKTogQXN5bmNGYWN0b3J5Rm48VGVzdEVsZW1lbnQgfCBudWxsPjtcbiAgbG9jYXRvckZvck9wdGlvbmFsPFQgZXh0ZW5kcyBDb21wb25lbnRIYXJuZXNzPihcbiAgICAgIGhhcm5lc3NUeXBlOiBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8VD4gfCBIYXJuZXNzUHJlZGljYXRlPFQ+KTogQXN5bmNGYWN0b3J5Rm48VCB8IG51bGw+O1xuICBsb2NhdG9yRm9yT3B0aW9uYWw8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+KFxuICAgICAgYXJnOiBzdHJpbmcgfCBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8VD4gfCBIYXJuZXNzUHJlZGljYXRlPFQ+KSB7XG4gICAgcmV0dXJuIGFzeW5jICgpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gKGF3YWl0IHRoaXMuZ2V0QWxsUmF3RWxlbWVudHMoYXJnKSlbMF07XG4gICAgICAgIHJldHVybiBlbGVtZW50ID8gdGhpcy5jcmVhdGVUZXN0RWxlbWVudChlbGVtZW50KSA6IG51bGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBjYW5kaWRhdGVzID0gYXdhaXQgdGhpcy5fZ2V0QWxsSGFybmVzc2VzKGFyZyk7XG4gICAgICAgIHJldHVybiBjYW5kaWRhdGVzWzBdIHx8IG51bGw7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8vIEltcGxlbWVudGVkIGFzIHBhcnQgb2YgdGhlIGBMb2NhdG9yRmFjdG9yeWAgaW50ZXJmYWNlLlxuICBsb2NhdG9yRm9yQWxsKHNlbGVjdG9yOiBzdHJpbmcpOiBBc3luY0ZhY3RvcnlGbjxUZXN0RWxlbWVudFtdPjtcbiAgbG9jYXRvckZvckFsbDxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4oXG4gICAgICBoYXJuZXNzVHlwZTogQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPFQ+IHwgSGFybmVzc1ByZWRpY2F0ZTxUPik6IEFzeW5jRmFjdG9yeUZuPFRbXT47XG4gIGxvY2F0b3JGb3JBbGw8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+KFxuICAgICAgYXJnOiBzdHJpbmcgfCBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8VD4gfCBIYXJuZXNzUHJlZGljYXRlPFQ+KSB7XG4gICAgcmV0dXJuIGFzeW5jICgpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0QWxsUmF3RWxlbWVudHMoYXJnKSkubWFwKGUgPT4gdGhpcy5jcmVhdGVUZXN0RWxlbWVudChlKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0QWxsSGFybmVzc2VzKGFyZyk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8vIEltcGxlbWVudGVkIGFzIHBhcnQgb2YgdGhlIGBIYXJuZXNzTG9hZGVyYCBpbnRlcmZhY2UuXG4gIGdldEhhcm5lc3M8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+KFxuICAgICAgaGFybmVzc1R5cGU6IENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcjxUPiB8IEhhcm5lc3NQcmVkaWNhdGU8VD4pOiBQcm9taXNlPFQ+IHtcbiAgICByZXR1cm4gdGhpcy5sb2NhdG9yRm9yKGhhcm5lc3NUeXBlKSgpO1xuICB9XG5cbiAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiB0aGUgYEhhcm5lc3NMb2FkZXJgIGludGVyZmFjZS5cbiAgZ2V0QWxsSGFybmVzc2VzPFQgZXh0ZW5kcyBDb21wb25lbnRIYXJuZXNzPihcbiAgICAgIGhhcm5lc3NUeXBlOiBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8VD4gfCBIYXJuZXNzUHJlZGljYXRlPFQ+KTogUHJvbWlzZTxUW10+IHtcbiAgICByZXR1cm4gdGhpcy5sb2NhdG9yRm9yQWxsKGhhcm5lc3NUeXBlKSgpO1xuICB9XG5cbiAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiB0aGUgYEhhcm5lc3NMb2FkZXJgIGludGVyZmFjZS5cbiAgYXN5bmMgZ2V0Q2hpbGRMb2FkZXIoc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8SGFybmVzc0xvYWRlcj4ge1xuICAgIHJldHVybiB0aGlzLmNyZWF0ZUVudmlyb25tZW50KGF3YWl0IHRoaXMuX2Fzc2VydEVsZW1lbnRGb3VuZChzZWxlY3RvcikpO1xuICB9XG5cbiAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiB0aGUgYEhhcm5lc3NMb2FkZXJgIGludGVyZmFjZS5cbiAgYXN5bmMgZ2V0QWxsQ2hpbGRMb2FkZXJzKHNlbGVjdG9yOiBzdHJpbmcpOiBQcm9taXNlPEhhcm5lc3NMb2FkZXJbXT4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRBbGxSYXdFbGVtZW50cyhzZWxlY3RvcikpLm1hcChlID0+IHRoaXMuY3JlYXRlRW52aXJvbm1lbnQoZSkpO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBgQ29tcG9uZW50SGFybmVzc2AgZm9yIHRoZSBnaXZlbiBoYXJuZXNzIHR5cGUgd2l0aCB0aGUgZ2l2ZW4gcmF3IGhvc3QgZWxlbWVudC4gKi9cbiAgcHJvdGVjdGVkIGNyZWF0ZUNvbXBvbmVudEhhcm5lc3M8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+KFxuICAgICAgaGFybmVzc1R5cGU6IENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcjxUPiwgZWxlbWVudDogRSk6IFQge1xuICAgIHJldHVybiBuZXcgaGFybmVzc1R5cGUodGhpcy5jcmVhdGVFbnZpcm9ubWVudChlbGVtZW50KSk7XG4gIH1cblxuICAvLyBQYXJ0IG9mIExvY2F0b3JGYWN0b3J5IGludGVyZmFjZSwgc3ViY2xhc3NlcyB3aWxsIGltcGxlbWVudC5cbiAgYWJzdHJhY3QgZm9yY2VTdGFiaWxpemUoKTogUHJvbWlzZTx2b2lkPjtcblxuICAvKiogR2V0cyB0aGUgcm9vdCBlbGVtZW50IGZvciB0aGUgZG9jdW1lbnQuICovXG4gIHByb3RlY3RlZCBhYnN0cmFjdCBnZXREb2N1bWVudFJvb3QoKTogRTtcblxuICAvKiogQ3JlYXRlcyBhIGBUZXN0RWxlbWVudGAgZnJvbSBhIHJhdyBlbGVtZW50LiAqL1xuICBwcm90ZWN0ZWQgYWJzdHJhY3QgY3JlYXRlVGVzdEVsZW1lbnQoZWxlbWVudDogRSk6IFRlc3RFbGVtZW50O1xuXG4gIC8qKiBDcmVhdGVzIGEgYEhhcm5lc3NMb2FkZXJgIHJvb3RlZCBhdCB0aGUgZ2l2ZW4gcmF3IGVsZW1lbnQuICovXG4gIHByb3RlY3RlZCBhYnN0cmFjdCBjcmVhdGVFbnZpcm9ubWVudChlbGVtZW50OiBFKTogSGFybmVzc0Vudmlyb25tZW50PEU+O1xuXG4gIC8qKlxuICAgKiBHZXRzIGEgbGlzdCBvZiBhbGwgZWxlbWVudHMgbWF0Y2hpbmcgdGhlIGdpdmVuIHNlbGVjdG9yIHVuZGVyIHRoaXMgZW52aXJvbm1lbnQncyByb290IGVsZW1lbnQuXG4gICAqL1xuICBwcm90ZWN0ZWQgYWJzdHJhY3QgZ2V0QWxsUmF3RWxlbWVudHMoc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8RVtdPjtcblxuICBwcml2YXRlIGFzeW5jIF9nZXRBbGxIYXJuZXNzZXM8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+KFxuICAgICAgaGFybmVzc1R5cGU6IENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcjxUPiB8IEhhcm5lc3NQcmVkaWNhdGU8VD4pOiBQcm9taXNlPFRbXT4ge1xuICAgIGNvbnN0IGhhcm5lc3NQcmVkaWNhdGUgPSBoYXJuZXNzVHlwZSBpbnN0YW5jZW9mIEhhcm5lc3NQcmVkaWNhdGUgP1xuICAgICAgICBoYXJuZXNzVHlwZSA6IG5ldyBIYXJuZXNzUHJlZGljYXRlKGhhcm5lc3NUeXBlLCB7fSk7XG4gICAgY29uc3QgZWxlbWVudHMgPSBhd2FpdCB0aGlzLmdldEFsbFJhd0VsZW1lbnRzKGhhcm5lc3NQcmVkaWNhdGUuZ2V0U2VsZWN0b3IoKSk7XG4gICAgcmV0dXJuIGhhcm5lc3NQcmVkaWNhdGUuZmlsdGVyKGVsZW1lbnRzLm1hcChcbiAgICAgICAgZWxlbWVudCA9PiB0aGlzLmNyZWF0ZUNvbXBvbmVudEhhcm5lc3MoaGFybmVzc1ByZWRpY2F0ZS5oYXJuZXNzVHlwZSwgZWxlbWVudCkpKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgX2Fzc2VydEVsZW1lbnRGb3VuZChzZWxlY3Rvcjogc3RyaW5nKTogUHJvbWlzZTxFPiB7XG4gICAgY29uc3QgZWxlbWVudCA9IChhd2FpdCB0aGlzLmdldEFsbFJhd0VsZW1lbnRzKHNlbGVjdG9yKSlbMF07XG4gICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICB0aHJvdyBFcnJvcihgRXhwZWN0ZWQgdG8gZmluZCBlbGVtZW50IG1hdGNoaW5nIHNlbGVjdG9yOiBcIiR7c2VsZWN0b3J9XCIsIGJ1dCBub25lIHdhcyBmb3VuZGApO1xuICAgIH1cbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgX2Fzc2VydEhhcm5lc3NGb3VuZDxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4oXG4gICAgICBoYXJuZXNzVHlwZTogQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPFQ+IHwgSGFybmVzc1ByZWRpY2F0ZTxUPik6IFByb21pc2U8VD4ge1xuICAgIGNvbnN0IGhhcm5lc3MgPSAoYXdhaXQgdGhpcy5fZ2V0QWxsSGFybmVzc2VzKGhhcm5lc3NUeXBlKSlbMF07XG4gICAgaWYgKCFoYXJuZXNzKSB7XG4gICAgICB0aHJvdyBfZ2V0RXJyb3JGb3JNaXNzaW5nSGFybmVzcyhoYXJuZXNzVHlwZSk7XG4gICAgfVxuICAgIHJldHVybiBoYXJuZXNzO1xuICB9XG59XG5cbmZ1bmN0aW9uIF9nZXRFcnJvckZvck1pc3NpbmdIYXJuZXNzPFQgZXh0ZW5kcyBDb21wb25lbnRIYXJuZXNzPihcbiAgICBoYXJuZXNzVHlwZTogQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPFQ+IHwgSGFybmVzc1ByZWRpY2F0ZTxUPik6IEVycm9yIHtcbiAgY29uc3QgaGFybmVzc1ByZWRpY2F0ZSA9XG4gICAgICBoYXJuZXNzVHlwZSBpbnN0YW5jZW9mIEhhcm5lc3NQcmVkaWNhdGUgPyBoYXJuZXNzVHlwZSA6IG5ldyBIYXJuZXNzUHJlZGljYXRlKGhhcm5lc3NUeXBlLCB7fSk7XG4gIGNvbnN0IHtuYW1lLCBob3N0U2VsZWN0b3J9ID0gaGFybmVzc1ByZWRpY2F0ZS5oYXJuZXNzVHlwZTtcbiAgbGV0IHJlc3RyaWN0aW9ucyA9IGhhcm5lc3NQcmVkaWNhdGUuZ2V0RGVzY3JpcHRpb24oKTtcbiAgbGV0IG1lc3NhZ2UgPSBgRXhwZWN0ZWQgdG8gZmluZCBlbGVtZW50IGZvciAke25hbWV9IG1hdGNoaW5nIHNlbGVjdG9yOiBcIiR7aG9zdFNlbGVjdG9yfVwiYDtcbiAgaWYgKHJlc3RyaWN0aW9ucykge1xuICAgIG1lc3NhZ2UgKz0gYCAod2l0aCByZXN0cmljdGlvbnM6ICR7cmVzdHJpY3Rpb25zfSlgO1xuICB9XG4gIG1lc3NhZ2UgKz0gJywgYnV0IG5vbmUgd2FzIGZvdW5kJztcbiAgcmV0dXJuIEVycm9yKG1lc3NhZ2UpO1xufVxuIl19