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
        define("@angular/cdk/testing/harness-environment", ["require", "exports", "tslib", "@angular/cdk/testing/component-harness"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var component_harness_1 = require("@angular/cdk/testing/component-harness");
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
                            harnessPredicate = harnessType instanceof component_harness_1.HarnessPredicate ?
                                harnessType : new component_harness_1.HarnessPredicate(harnessType, {});
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
    exports.HarnessEnvironment = HarnessEnvironment;
    function _getErrorForMissingHarness(harnessType) {
        var harnessPredicate = harnessType instanceof component_harness_1.HarnessPredicate ? harnessType : new component_harness_1.HarnessPredicate(harnessType, {});
        var _a = harnessPredicate.harnessType, name = _a.name, hostSelector = _a.hostSelector;
        var restrictions = harnessPredicate.getDescription();
        var message = "Expected to find element for " + name + " matching selector: \"" + hostSelector + "\"";
        if (restrictions) {
            message += " (with restrictions: " + restrictions + ")";
        }
        message += ', but none was found';
        return Error(message);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFybmVzcy1lbnZpcm9ubWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGVzdGluZy9oYXJuZXNzLWVudmlyb25tZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILDRFQU82QjtJQUc3Qjs7Ozs7T0FLRztJQUNIO1FBSUUsNEJBQWdDLGNBQWlCO1lBQWpCLG1CQUFjLEdBQWQsY0FBYyxDQUFHO1lBQy9DLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQzVELENBQUM7UUFFRCx5REFBeUQ7UUFDekQsdURBQTBCLEdBQTFCO1lBQ0UsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUM7UUFDeEQsQ0FBQztRQU1ELHVDQUFVLEdBQVYsVUFDSSxHQUFrRTtZQUR0RSxpQkFTQztZQVBDLE9BQU87Ozs7O2lDQUNELENBQUEsT0FBTyxHQUFHLEtBQUssUUFBUSxDQUFBLEVBQXZCLHdCQUF1Qjs0QkFDbEIsS0FBQSxJQUFJLENBQUMsaUJBQWlCLENBQUE7NEJBQUMscUJBQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxFQUFBO2dDQUFqRSxzQkFBTyxTQUFBLElBQUksR0FBbUIsU0FBbUMsRUFBQyxFQUFDO2dDQUVuRSxzQkFBTyxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLEVBQUM7OztpQkFFeEMsQ0FBQztRQUNKLENBQUM7UUFNRCwrQ0FBa0IsR0FBbEIsVUFDSSxHQUFrRTtZQUR0RSxpQkFXQztZQVRDLE9BQU87Ozs7O2lDQUNELENBQUEsT0FBTyxHQUFHLEtBQUssUUFBUSxDQUFBLEVBQXZCLHdCQUF1Qjs0QkFDUixxQkFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLEVBQUE7OzRCQUE1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T0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDeEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBBc3luY0ZhY3RvcnlGbixcbiAgQ29tcG9uZW50SGFybmVzcyxcbiAgQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yLFxuICBIYXJuZXNzTG9hZGVyLFxuICBIYXJuZXNzUHJlZGljYXRlLFxuICBMb2NhdG9yRmFjdG9yeVxufSBmcm9tICcuL2NvbXBvbmVudC1oYXJuZXNzJztcbmltcG9ydCB7VGVzdEVsZW1lbnR9IGZyb20gJy4vdGVzdC1lbGVtZW50JztcblxuLyoqXG4gKiBCYXNlIGhhcm5lc3MgZW52aXJvbm1lbnQgY2xhc3MgdGhhdCBjYW4gYmUgZXh0ZW5kZWQgdG8gYWxsb3cgYENvbXBvbmVudEhhcm5lc3NgZXMgdG8gYmUgdXNlZCBpblxuICogZGlmZmVyZW50IHRlc3QgZW52aXJvbm1lbnRzIChlLmcuIHRlc3RiZWQsIHByb3RyYWN0b3IsIGV0Yy4pLiBUaGlzIGNsYXNzIGltcGxlbWVudHMgdGhlXG4gKiBmdW5jdGlvbmFsaXR5IG9mIGJvdGggYSBgSGFybmVzc0xvYWRlcmAgYW5kIGBMb2NhdG9yRmFjdG9yeWAuIFRoaXMgY2xhc3MgaXMgZ2VuZXJpYyBvbiB0aGUgcmF3XG4gKiBlbGVtZW50IHR5cGUsIGBFYCwgdXNlZCBieSB0aGUgcGFydGljdWxhciB0ZXN0IGVudmlyb25tZW50LlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgSGFybmVzc0Vudmlyb25tZW50PEU+IGltcGxlbWVudHMgSGFybmVzc0xvYWRlciwgTG9jYXRvckZhY3Rvcnkge1xuICAvLyBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIHRoZSBgTG9jYXRvckZhY3RvcnlgIGludGVyZmFjZS5cbiAgcm9vdEVsZW1lbnQ6IFRlc3RFbGVtZW50O1xuXG4gIHByb3RlY3RlZCBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgcmF3Um9vdEVsZW1lbnQ6IEUpIHtcbiAgICB0aGlzLnJvb3RFbGVtZW50ID0gdGhpcy5jcmVhdGVUZXN0RWxlbWVudChyYXdSb290RWxlbWVudCk7XG4gIH1cblxuICAvLyBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIHRoZSBgTG9jYXRvckZhY3RvcnlgIGludGVyZmFjZS5cbiAgZG9jdW1lbnRSb290TG9jYXRvckZhY3RvcnkoKTogTG9jYXRvckZhY3Rvcnkge1xuICAgIHJldHVybiB0aGlzLmNyZWF0ZUVudmlyb25tZW50KHRoaXMuZ2V0RG9jdW1lbnRSb290KCkpO1xuICB9XG5cbiAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiB0aGUgYExvY2F0b3JGYWN0b3J5YCBpbnRlcmZhY2UuXG4gIGxvY2F0b3JGb3Ioc2VsZWN0b3I6IHN0cmluZyk6IEFzeW5jRmFjdG9yeUZuPFRlc3RFbGVtZW50PjtcbiAgbG9jYXRvckZvcjxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4oXG4gICAgICBoYXJuZXNzVHlwZTogQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPFQ+IHwgSGFybmVzc1ByZWRpY2F0ZTxUPik6IEFzeW5jRmFjdG9yeUZuPFQ+O1xuICBsb2NhdG9yRm9yPFQgZXh0ZW5kcyBDb21wb25lbnRIYXJuZXNzPihcbiAgICAgIGFyZzogc3RyaW5nIHwgQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPFQ+IHwgSGFybmVzc1ByZWRpY2F0ZTxUPikge1xuICAgIHJldHVybiBhc3luYyAoKSA9PiB7XG4gICAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlVGVzdEVsZW1lbnQoYXdhaXQgdGhpcy5fYXNzZXJ0RWxlbWVudEZvdW5kKGFyZykpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Fzc2VydEhhcm5lc3NGb3VuZChhcmcpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIHRoZSBgTG9jYXRvckZhY3RvcnlgIGludGVyZmFjZS5cbiAgbG9jYXRvckZvck9wdGlvbmFsKHNlbGVjdG9yOiBzdHJpbmcpOiBBc3luY0ZhY3RvcnlGbjxUZXN0RWxlbWVudCB8IG51bGw+O1xuICBsb2NhdG9yRm9yT3B0aW9uYWw8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+KFxuICAgICAgaGFybmVzc1R5cGU6IENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcjxUPiB8IEhhcm5lc3NQcmVkaWNhdGU8VD4pOiBBc3luY0ZhY3RvcnlGbjxUIHwgbnVsbD47XG4gIGxvY2F0b3JGb3JPcHRpb25hbDxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4oXG4gICAgICBhcmc6IHN0cmluZyB8IENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcjxUPiB8IEhhcm5lc3NQcmVkaWNhdGU8VD4pIHtcbiAgICByZXR1cm4gYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSAoYXdhaXQgdGhpcy5nZXRBbGxSYXdFbGVtZW50cyhhcmcpKVswXTtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQgPyB0aGlzLmNyZWF0ZVRlc3RFbGVtZW50KGVsZW1lbnQpIDogbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGNhbmRpZGF0ZXMgPSBhd2FpdCB0aGlzLl9nZXRBbGxIYXJuZXNzZXMoYXJnKTtcbiAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZXNbMF0gfHwgbnVsbDtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiB0aGUgYExvY2F0b3JGYWN0b3J5YCBpbnRlcmZhY2UuXG4gIGxvY2F0b3JGb3JBbGwoc2VsZWN0b3I6IHN0cmluZyk6IEFzeW5jRmFjdG9yeUZuPFRlc3RFbGVtZW50W10+O1xuICBsb2NhdG9yRm9yQWxsPFQgZXh0ZW5kcyBDb21wb25lbnRIYXJuZXNzPihcbiAgICAgIGhhcm5lc3NUeXBlOiBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8VD4gfCBIYXJuZXNzUHJlZGljYXRlPFQ+KTogQXN5bmNGYWN0b3J5Rm48VFtdPjtcbiAgbG9jYXRvckZvckFsbDxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4oXG4gICAgICBhcmc6IHN0cmluZyB8IENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcjxUPiB8IEhhcm5lc3NQcmVkaWNhdGU8VD4pIHtcbiAgICByZXR1cm4gYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRBbGxSYXdFbGVtZW50cyhhcmcpKS5tYXAoZSA9PiB0aGlzLmNyZWF0ZVRlc3RFbGVtZW50KGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXRBbGxIYXJuZXNzZXMoYXJnKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiB0aGUgYEhhcm5lc3NMb2FkZXJgIGludGVyZmFjZS5cbiAgZ2V0SGFybmVzczxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4oXG4gICAgICBoYXJuZXNzVHlwZTogQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPFQ+IHwgSGFybmVzc1ByZWRpY2F0ZTxUPik6IFByb21pc2U8VD4ge1xuICAgIHJldHVybiB0aGlzLmxvY2F0b3JGb3IoaGFybmVzc1R5cGUpKCk7XG4gIH1cblxuICAvLyBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIHRoZSBgSGFybmVzc0xvYWRlcmAgaW50ZXJmYWNlLlxuICBnZXRBbGxIYXJuZXNzZXM8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+KFxuICAgICAgaGFybmVzc1R5cGU6IENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcjxUPiB8IEhhcm5lc3NQcmVkaWNhdGU8VD4pOiBQcm9taXNlPFRbXT4ge1xuICAgIHJldHVybiB0aGlzLmxvY2F0b3JGb3JBbGwoaGFybmVzc1R5cGUpKCk7XG4gIH1cblxuICAvLyBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIHRoZSBgSGFybmVzc0xvYWRlcmAgaW50ZXJmYWNlLlxuICBhc3luYyBnZXRDaGlsZExvYWRlcihzZWxlY3Rvcjogc3RyaW5nKTogUHJvbWlzZTxIYXJuZXNzTG9hZGVyPiB7XG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlRW52aXJvbm1lbnQoYXdhaXQgdGhpcy5fYXNzZXJ0RWxlbWVudEZvdW5kKHNlbGVjdG9yKSk7XG4gIH1cblxuICAvLyBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIHRoZSBgSGFybmVzc0xvYWRlcmAgaW50ZXJmYWNlLlxuICBhc3luYyBnZXRBbGxDaGlsZExvYWRlcnMoc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8SGFybmVzc0xvYWRlcltdPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldEFsbFJhd0VsZW1lbnRzKHNlbGVjdG9yKSkubWFwKGUgPT4gdGhpcy5jcmVhdGVFbnZpcm9ubWVudChlKSk7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIGBDb21wb25lbnRIYXJuZXNzYCBmb3IgdGhlIGdpdmVuIGhhcm5lc3MgdHlwZSB3aXRoIHRoZSBnaXZlbiByYXcgaG9zdCBlbGVtZW50LiAqL1xuICBwcm90ZWN0ZWQgY3JlYXRlQ29tcG9uZW50SGFybmVzczxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4oXG4gICAgICBoYXJuZXNzVHlwZTogQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPFQ+LCBlbGVtZW50OiBFKTogVCB7XG4gICAgcmV0dXJuIG5ldyBoYXJuZXNzVHlwZSh0aGlzLmNyZWF0ZUVudmlyb25tZW50KGVsZW1lbnQpKTtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSByb290IGVsZW1lbnQgZm9yIHRoZSBkb2N1bWVudC4gKi9cbiAgcHJvdGVjdGVkIGFic3RyYWN0IGdldERvY3VtZW50Um9vdCgpOiBFO1xuXG4gIC8qKiBDcmVhdGVzIGEgYFRlc3RFbGVtZW50YCBmcm9tIGEgcmF3IGVsZW1lbnQuICovXG4gIHByb3RlY3RlZCBhYnN0cmFjdCBjcmVhdGVUZXN0RWxlbWVudChlbGVtZW50OiBFKTogVGVzdEVsZW1lbnQ7XG5cbiAgLyoqIENyZWF0ZXMgYSBgSGFybmVzc0xvYWRlcmAgcm9vdGVkIGF0IHRoZSBnaXZlbiByYXcgZWxlbWVudC4gKi9cbiAgcHJvdGVjdGVkIGFic3RyYWN0IGNyZWF0ZUVudmlyb25tZW50KGVsZW1lbnQ6IEUpOiBIYXJuZXNzRW52aXJvbm1lbnQ8RT47XG5cbiAgLyoqXG4gICAqIEdldHMgYSBsaXN0IG9mIGFsbCBlbGVtZW50cyBtYXRjaGluZyB0aGUgZ2l2ZW4gc2VsZWN0b3IgdW5kZXIgdGhpcyBlbnZpcm9ubWVudCdzIHJvb3QgZWxlbWVudC5cbiAgICovXG4gIHByb3RlY3RlZCBhYnN0cmFjdCBnZXRBbGxSYXdFbGVtZW50cyhzZWxlY3Rvcjogc3RyaW5nKTogUHJvbWlzZTxFW10+O1xuXG4gIHByaXZhdGUgYXN5bmMgX2dldEFsbEhhcm5lc3NlczxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4oXG4gICAgICBoYXJuZXNzVHlwZTogQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPFQ+IHwgSGFybmVzc1ByZWRpY2F0ZTxUPik6IFByb21pc2U8VFtdPiB7XG4gICAgY29uc3QgaGFybmVzc1ByZWRpY2F0ZSA9IGhhcm5lc3NUeXBlIGluc3RhbmNlb2YgSGFybmVzc1ByZWRpY2F0ZSA/XG4gICAgICAgIGhhcm5lc3NUeXBlIDogbmV3IEhhcm5lc3NQcmVkaWNhdGUoaGFybmVzc1R5cGUsIHt9KTtcbiAgICBjb25zdCBlbGVtZW50cyA9IGF3YWl0IHRoaXMuZ2V0QWxsUmF3RWxlbWVudHMoaGFybmVzc1ByZWRpY2F0ZS5nZXRTZWxlY3RvcigpKTtcbiAgICByZXR1cm4gaGFybmVzc1ByZWRpY2F0ZS5maWx0ZXIoZWxlbWVudHMubWFwKFxuICAgICAgICBlbGVtZW50ID0+IHRoaXMuY3JlYXRlQ29tcG9uZW50SGFybmVzcyhoYXJuZXNzUHJlZGljYXRlLmhhcm5lc3NUeXBlLCBlbGVtZW50KSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBfYXNzZXJ0RWxlbWVudEZvdW5kKHNlbGVjdG9yOiBzdHJpbmcpOiBQcm9taXNlPEU+IHtcbiAgICBjb25zdCBlbGVtZW50ID0gKGF3YWl0IHRoaXMuZ2V0QWxsUmF3RWxlbWVudHMoc2VsZWN0b3IpKVswXTtcbiAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgIHRocm93IEVycm9yKGBFeHBlY3RlZCB0byBmaW5kIGVsZW1lbnQgbWF0Y2hpbmcgc2VsZWN0b3I6IFwiJHtzZWxlY3Rvcn1cIiwgYnV0IG5vbmUgd2FzIGZvdW5kYCk7XG4gICAgfVxuICAgIHJldHVybiBlbGVtZW50O1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBfYXNzZXJ0SGFybmVzc0ZvdW5kPFQgZXh0ZW5kcyBDb21wb25lbnRIYXJuZXNzPihcbiAgICAgIGhhcm5lc3NUeXBlOiBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8VD4gfCBIYXJuZXNzUHJlZGljYXRlPFQ+KTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgaGFybmVzcyA9IChhd2FpdCB0aGlzLl9nZXRBbGxIYXJuZXNzZXMoaGFybmVzc1R5cGUpKVswXTtcbiAgICBpZiAoIWhhcm5lc3MpIHtcbiAgICAgIHRocm93IF9nZXRFcnJvckZvck1pc3NpbmdIYXJuZXNzKGhhcm5lc3NUeXBlKTtcbiAgICB9XG4gICAgcmV0dXJuIGhhcm5lc3M7XG4gIH1cbn1cblxuZnVuY3Rpb24gX2dldEVycm9yRm9yTWlzc2luZ0hhcm5lc3M8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+KFxuICAgIGhhcm5lc3NUeXBlOiBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8VD4gfCBIYXJuZXNzUHJlZGljYXRlPFQ+KTogRXJyb3Ige1xuICBjb25zdCBoYXJuZXNzUHJlZGljYXRlID1cbiAgICAgIGhhcm5lc3NUeXBlIGluc3RhbmNlb2YgSGFybmVzc1ByZWRpY2F0ZSA/IGhhcm5lc3NUeXBlIDogbmV3IEhhcm5lc3NQcmVkaWNhdGUoaGFybmVzc1R5cGUsIHt9KTtcbiAgY29uc3Qge25hbWUsIGhvc3RTZWxlY3Rvcn0gPSBoYXJuZXNzUHJlZGljYXRlLmhhcm5lc3NUeXBlO1xuICBsZXQgcmVzdHJpY3Rpb25zID0gaGFybmVzc1ByZWRpY2F0ZS5nZXREZXNjcmlwdGlvbigpO1xuICBsZXQgbWVzc2FnZSA9IGBFeHBlY3RlZCB0byBmaW5kIGVsZW1lbnQgZm9yICR7bmFtZX0gbWF0Y2hpbmcgc2VsZWN0b3I6IFwiJHtob3N0U2VsZWN0b3J9XCJgO1xuICBpZiAocmVzdHJpY3Rpb25zKSB7XG4gICAgbWVzc2FnZSArPSBgICh3aXRoIHJlc3RyaWN0aW9uczogJHtyZXN0cmljdGlvbnN9KWA7XG4gIH1cbiAgbWVzc2FnZSArPSAnLCBidXQgbm9uZSB3YXMgZm91bmQnO1xuICByZXR1cm4gRXJyb3IobWVzc2FnZSk7XG59XG4iXX0=