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
        define("@angular/cdk/testing/testbed/testbed-harness-environment", ["require", "exports", "tslib", "@angular/cdk/testing/harness-environment", "@angular/cdk/testing/testbed/unit-test-element"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var harness_environment_1 = require("@angular/cdk/testing/harness-environment");
    var unit_test_element_1 = require("@angular/cdk/testing/testbed/unit-test-element");
    /** A `HarnessEnvironment` implementation for Angular's Testbed. */
    var TestbedHarnessEnvironment = /** @class */ (function (_super) {
        tslib_1.__extends(TestbedHarnessEnvironment, _super);
        function TestbedHarnessEnvironment(rawRootElement, _fixture) {
            var _this = _super.call(this, rawRootElement) || this;
            _this._fixture = _fixture;
            return _this;
        }
        /** Creates a `HarnessLoader` rooted at the given fixture's root element. */
        TestbedHarnessEnvironment.loader = function (fixture) {
            return new TestbedHarnessEnvironment(fixture.nativeElement, fixture);
        };
        /**
         * Creates a `HarnessLoader` at the document root. This can be used if harnesses are
         * located outside of a fixture (e.g. overlays appended to the document body).
         */
        TestbedHarnessEnvironment.documentRootLoader = function (fixture) {
            return new TestbedHarnessEnvironment(document.body, fixture);
        };
        /**
         * Creates an instance of the given harness type, using the fixture's root element as the
         * harness's host element. This method should be used when creating a harness for the root element
         * of a fixture, as components do not have the correct selector when they are created as the root
         * of the fixture.
         */
        TestbedHarnessEnvironment.harnessForFixture = function (fixture, harnessType) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var environment;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            environment = new TestbedHarnessEnvironment(fixture.nativeElement, fixture);
                            return [4 /*yield*/, environment._stabilize()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, environment.createComponentHarness(harnessType, fixture.nativeElement)];
                    }
                });
            });
        };
        TestbedHarnessEnvironment.prototype.getDocumentRoot = function () {
            return document.body;
        };
        TestbedHarnessEnvironment.prototype.createTestElement = function (element) {
            return new unit_test_element_1.UnitTestElement(element, this._stabilize.bind(this));
        };
        TestbedHarnessEnvironment.prototype.createEnvironment = function (element) {
            return new TestbedHarnessEnvironment(element, this._fixture);
        };
        TestbedHarnessEnvironment.prototype.getAllRawElements = function (selector) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this._stabilize()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, Array.from(this.rawRootElement.querySelectorAll(selector))];
                    }
                });
            });
        };
        TestbedHarnessEnvironment.prototype._stabilize = function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this._fixture.detectChanges();
                            return [4 /*yield*/, this._fixture.whenStable()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        return TestbedHarnessEnvironment;
    }(harness_environment_1.HarnessEnvironment));
    exports.TestbedHarnessEnvironment = TestbedHarnessEnvironment;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGJlZC1oYXJuZXNzLWVudmlyb25tZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Rlc3RiZWQvdGVzdGJlZC1oYXJuZXNzLWVudmlyb25tZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUlILGdGQUEwRDtJQUUxRCxvRkFBb0Q7SUFFcEQsbUVBQW1FO0lBQ25FO1FBQStDLHFEQUEyQjtRQUN4RSxtQ0FBc0IsY0FBdUIsRUFBVSxRQUFtQztZQUExRixZQUNFLGtCQUFNLGNBQWMsQ0FBQyxTQUN0QjtZQUZzRCxjQUFRLEdBQVIsUUFBUSxDQUEyQjs7UUFFMUYsQ0FBQztRQUVELDRFQUE0RTtRQUNyRSxnQ0FBTSxHQUFiLFVBQWMsT0FBa0M7WUFDOUMsT0FBTyxJQUFJLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDdkUsQ0FBQztRQUVEOzs7V0FHRztRQUNJLDRDQUFrQixHQUF6QixVQUEwQixPQUFrQztZQUMxRCxPQUFPLElBQUkseUJBQXlCLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBRUQ7Ozs7O1dBS0c7UUFDVSwyQ0FBaUIsR0FBOUIsVUFDSSxPQUFrQyxFQUFFLFdBQTJDOzs7Ozs7NEJBQzNFLFdBQVcsR0FBRyxJQUFJLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUM7NEJBQ2xGLHFCQUFNLFdBQVcsQ0FBQyxVQUFVLEVBQUUsRUFBQTs7NEJBQTlCLFNBQThCLENBQUM7NEJBQy9CLHNCQUFPLFdBQVcsQ0FBQyxzQkFBc0IsQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFDOzs7O1NBQy9FO1FBRVMsbURBQWUsR0FBekI7WUFDRSxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUM7UUFDdkIsQ0FBQztRQUVTLHFEQUFpQixHQUEzQixVQUE0QixPQUFnQjtZQUMxQyxPQUFPLElBQUksbUNBQWUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNsRSxDQUFDO1FBRVMscURBQWlCLEdBQTNCLFVBQTRCLE9BQWdCO1lBQzFDLE9BQU8sSUFBSSx5QkFBeUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9ELENBQUM7UUFFZSxxREFBaUIsR0FBakMsVUFBa0MsUUFBZ0I7Ozs7Z0NBQ2hELHFCQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBQTs7NEJBQXZCLFNBQXVCLENBQUM7NEJBQ3hCLHNCQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFDOzs7O1NBQ25FO1FBRWEsOENBQVUsR0FBeEI7Ozs7OzRCQUNFLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFFLENBQUM7NEJBQzlCLHFCQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLEVBQUE7OzRCQUFoQyxTQUFnQyxDQUFDOzs7OztTQUNsQztRQUNILGdDQUFDO0lBQUQsQ0FBQyxBQXBERCxDQUErQyx3Q0FBa0IsR0FvRGhFO0lBcERZLDhEQUF5QiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NvbXBvbmVudEZpeHR1cmV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUvdGVzdGluZyc7XG5pbXBvcnQge0NvbXBvbmVudEhhcm5lc3MsIENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvciwgSGFybmVzc0xvYWRlcn0gZnJvbSAnLi4vY29tcG9uZW50LWhhcm5lc3MnO1xuaW1wb3J0IHtIYXJuZXNzRW52aXJvbm1lbnR9IGZyb20gJy4uL2hhcm5lc3MtZW52aXJvbm1lbnQnO1xuaW1wb3J0IHtUZXN0RWxlbWVudH0gZnJvbSAnLi4vdGVzdC1lbGVtZW50JztcbmltcG9ydCB7VW5pdFRlc3RFbGVtZW50fSBmcm9tICcuL3VuaXQtdGVzdC1lbGVtZW50JztcblxuLyoqIEEgYEhhcm5lc3NFbnZpcm9ubWVudGAgaW1wbGVtZW50YXRpb24gZm9yIEFuZ3VsYXIncyBUZXN0YmVkLiAqL1xuZXhwb3J0IGNsYXNzIFRlc3RiZWRIYXJuZXNzRW52aXJvbm1lbnQgZXh0ZW5kcyBIYXJuZXNzRW52aXJvbm1lbnQ8RWxlbWVudD4ge1xuICBwcm90ZWN0ZWQgY29uc3RydWN0b3IocmF3Um9vdEVsZW1lbnQ6IEVsZW1lbnQsIHByaXZhdGUgX2ZpeHR1cmU6IENvbXBvbmVudEZpeHR1cmU8dW5rbm93bj4pIHtcbiAgICBzdXBlcihyYXdSb290RWxlbWVudCk7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIGBIYXJuZXNzTG9hZGVyYCByb290ZWQgYXQgdGhlIGdpdmVuIGZpeHR1cmUncyByb290IGVsZW1lbnQuICovXG4gIHN0YXRpYyBsb2FkZXIoZml4dHVyZTogQ29tcG9uZW50Rml4dHVyZTx1bmtub3duPik6IEhhcm5lc3NMb2FkZXIge1xuICAgIHJldHVybiBuZXcgVGVzdGJlZEhhcm5lc3NFbnZpcm9ubWVudChmaXh0dXJlLm5hdGl2ZUVsZW1lbnQsIGZpeHR1cmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBgSGFybmVzc0xvYWRlcmAgYXQgdGhlIGRvY3VtZW50IHJvb3QuIFRoaXMgY2FuIGJlIHVzZWQgaWYgaGFybmVzc2VzIGFyZVxuICAgKiBsb2NhdGVkIG91dHNpZGUgb2YgYSBmaXh0dXJlIChlLmcuIG92ZXJsYXlzIGFwcGVuZGVkIHRvIHRoZSBkb2N1bWVudCBib2R5KS5cbiAgICovXG4gIHN0YXRpYyBkb2N1bWVudFJvb3RMb2FkZXIoZml4dHVyZTogQ29tcG9uZW50Rml4dHVyZTx1bmtub3duPik6IEhhcm5lc3NMb2FkZXIge1xuICAgIHJldHVybiBuZXcgVGVzdGJlZEhhcm5lc3NFbnZpcm9ubWVudChkb2N1bWVudC5ib2R5LCBmaXh0dXJlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIHRoZSBnaXZlbiBoYXJuZXNzIHR5cGUsIHVzaW5nIHRoZSBmaXh0dXJlJ3Mgcm9vdCBlbGVtZW50IGFzIHRoZVxuICAgKiBoYXJuZXNzJ3MgaG9zdCBlbGVtZW50LiBUaGlzIG1ldGhvZCBzaG91bGQgYmUgdXNlZCB3aGVuIGNyZWF0aW5nIGEgaGFybmVzcyBmb3IgdGhlIHJvb3QgZWxlbWVudFxuICAgKiBvZiBhIGZpeHR1cmUsIGFzIGNvbXBvbmVudHMgZG8gbm90IGhhdmUgdGhlIGNvcnJlY3Qgc2VsZWN0b3Igd2hlbiB0aGV5IGFyZSBjcmVhdGVkIGFzIHRoZSByb290XG4gICAqIG9mIHRoZSBmaXh0dXJlLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGhhcm5lc3NGb3JGaXh0dXJlPFQgZXh0ZW5kcyBDb21wb25lbnRIYXJuZXNzPihcbiAgICAgIGZpeHR1cmU6IENvbXBvbmVudEZpeHR1cmU8dW5rbm93bj4sIGhhcm5lc3NUeXBlOiBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8VD4pOiBQcm9taXNlPFQ+IHtcbiAgICBjb25zdCBlbnZpcm9ubWVudCA9IG5ldyBUZXN0YmVkSGFybmVzc0Vudmlyb25tZW50KGZpeHR1cmUubmF0aXZlRWxlbWVudCwgZml4dHVyZSk7XG4gICAgYXdhaXQgZW52aXJvbm1lbnQuX3N0YWJpbGl6ZSgpO1xuICAgIHJldHVybiBlbnZpcm9ubWVudC5jcmVhdGVDb21wb25lbnRIYXJuZXNzKGhhcm5lc3NUeXBlLCBmaXh0dXJlLm5hdGl2ZUVsZW1lbnQpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGdldERvY3VtZW50Um9vdCgpOiBFbGVtZW50IHtcbiAgICByZXR1cm4gZG9jdW1lbnQuYm9keTtcbiAgfVxuXG4gIHByb3RlY3RlZCBjcmVhdGVUZXN0RWxlbWVudChlbGVtZW50OiBFbGVtZW50KTogVGVzdEVsZW1lbnQge1xuICAgIHJldHVybiBuZXcgVW5pdFRlc3RFbGVtZW50KGVsZW1lbnQsIHRoaXMuX3N0YWJpbGl6ZS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBjcmVhdGVFbnZpcm9ubWVudChlbGVtZW50OiBFbGVtZW50KTogSGFybmVzc0Vudmlyb25tZW50PEVsZW1lbnQ+IHtcbiAgICByZXR1cm4gbmV3IFRlc3RiZWRIYXJuZXNzRW52aXJvbm1lbnQoZWxlbWVudCwgdGhpcy5fZml4dHVyZSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0QWxsUmF3RWxlbWVudHMoc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8RWxlbWVudFtdPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5yYXdSb290RWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIF9zdGFiaWxpemUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5fZml4dHVyZS5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgYXdhaXQgdGhpcy5fZml4dHVyZS53aGVuU3RhYmxlKCk7XG4gIH1cbn1cbiJdfQ==