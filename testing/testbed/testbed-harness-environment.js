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
        define("@angular/cdk/testing/testbed/testbed-harness-environment", ["require", "exports", "tslib", "@angular/cdk/testing", "@angular/cdk/testing/testbed/unit-test-element"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var testing_1 = require("@angular/cdk/testing");
    var unit_test_element_1 = require("@angular/cdk/testing/testbed/unit-test-element");
    /** A `HarnessEnvironment` implementation for Angular's Testbed. */
    var TestbedHarnessEnvironment = /** @class */ (function (_super) {
        tslib_1.__extends(TestbedHarnessEnvironment, _super);
        function TestbedHarnessEnvironment(rawRootElement, _fixture) {
            var _this = _super.call(this, rawRootElement) || this;
            _this._fixture = _fixture;
            _this._destroyed = false;
            _fixture.componentRef.onDestroy(function () { return _this._destroyed = true; });
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
                            return [4 /*yield*/, environment.forceStabilize()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, environment.createComponentHarness(harnessType, fixture.nativeElement)];
                    }
                });
            });
        };
        TestbedHarnessEnvironment.prototype.forceStabilize = function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (this._destroyed) {
                                throw Error('Harness is attempting to use a fixture that has already been destroyed.');
                            }
                            this._fixture.detectChanges();
                            return [4 /*yield*/, this._fixture.whenStable()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        TestbedHarnessEnvironment.prototype.getDocumentRoot = function () {
            return document.body;
        };
        TestbedHarnessEnvironment.prototype.createTestElement = function (element) {
            var _this = this;
            return new unit_test_element_1.UnitTestElement(element, function () { return _this.forceStabilize(); });
        };
        TestbedHarnessEnvironment.prototype.createEnvironment = function (element) {
            return new TestbedHarnessEnvironment(element, this._fixture);
        };
        TestbedHarnessEnvironment.prototype.getAllRawElements = function (selector) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.forceStabilize()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, Array.from(this.rawRootElement.querySelectorAll(selector))];
                    }
                });
            });
        };
        return TestbedHarnessEnvironment;
    }(testing_1.HarnessEnvironment));
    exports.TestbedHarnessEnvironment = TestbedHarnessEnvironment;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGJlZC1oYXJuZXNzLWVudmlyb25tZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Rlc3RiZWQvdGVzdGJlZC1oYXJuZXNzLWVudmlyb25tZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILGdEQUF3RDtJQUl4RCxvRkFBb0Q7SUFFcEQsbUVBQW1FO0lBQ25FO1FBQStDLHFEQUEyQjtRQUd4RSxtQ0FBc0IsY0FBdUIsRUFBVSxRQUFtQztZQUExRixZQUNFLGtCQUFNLGNBQWMsQ0FBQyxTQUV0QjtZQUhzRCxjQUFRLEdBQVIsUUFBUSxDQUEyQjtZQUZsRixnQkFBVSxHQUFHLEtBQUssQ0FBQztZQUl6QixRQUFRLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxjQUFNLE9BQUEsS0FBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLEVBQXRCLENBQXNCLENBQUMsQ0FBQzs7UUFDaEUsQ0FBQztRQUVELDRFQUE0RTtRQUNyRSxnQ0FBTSxHQUFiLFVBQWMsT0FBa0M7WUFDOUMsT0FBTyxJQUFJLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDdkUsQ0FBQztRQUVEOzs7V0FHRztRQUNJLDRDQUFrQixHQUF6QixVQUEwQixPQUFrQztZQUMxRCxPQUFPLElBQUkseUJBQXlCLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBRUQ7Ozs7O1dBS0c7UUFDVSwyQ0FBaUIsR0FBOUIsVUFDSSxPQUFrQyxFQUFFLFdBQTJDOzs7Ozs7NEJBQzNFLFdBQVcsR0FBRyxJQUFJLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUM7NEJBQ2xGLHFCQUFNLFdBQVcsQ0FBQyxjQUFjLEVBQUUsRUFBQTs7NEJBQWxDLFNBQWtDLENBQUM7NEJBQ25DLHNCQUFPLFdBQVcsQ0FBQyxzQkFBc0IsQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFDOzs7O1NBQy9FO1FBRUssa0RBQWMsR0FBcEI7Ozs7OzRCQUNFLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtnQ0FDbkIsTUFBTSxLQUFLLENBQUMseUVBQXlFLENBQUMsQ0FBQzs2QkFDeEY7NEJBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUUsQ0FBQzs0QkFDOUIscUJBQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsRUFBQTs7NEJBQWhDLFNBQWdDLENBQUM7Ozs7O1NBQ2xDO1FBRVMsbURBQWUsR0FBekI7WUFDRSxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUM7UUFDdkIsQ0FBQztRQUVTLHFEQUFpQixHQUEzQixVQUE0QixPQUFnQjtZQUE1QyxpQkFFQztZQURDLE9BQU8sSUFBSSxtQ0FBZSxDQUFDLE9BQU8sRUFBRSxjQUFNLE9BQUEsS0FBSSxDQUFDLGNBQWMsRUFBRSxFQUFyQixDQUFxQixDQUFDLENBQUM7UUFDbkUsQ0FBQztRQUVTLHFEQUFpQixHQUEzQixVQUE0QixPQUFnQjtZQUMxQyxPQUFPLElBQUkseUJBQXlCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBRWUscURBQWlCLEdBQWpDLFVBQWtDLFFBQWdCOzs7O2dDQUNoRCxxQkFBTSxJQUFJLENBQUMsY0FBYyxFQUFFLEVBQUE7OzRCQUEzQixTQUEyQixDQUFDOzRCQUM1QixzQkFBTyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBQzs7OztTQUNuRTtRQUNILGdDQUFDO0lBQUQsQ0FBQyxBQTNERCxDQUErQyw0QkFBa0IsR0EyRGhFO0lBM0RZLDhEQUF5QiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0hhcm5lc3NFbnZpcm9ubWVudH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3Rlc3RpbmcnO1xuaW1wb3J0IHtDb21wb25lbnRGaXh0dXJlfSBmcm9tICdAYW5ndWxhci9jb3JlL3Rlc3RpbmcnO1xuaW1wb3J0IHtDb21wb25lbnRIYXJuZXNzLCBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3IsIEhhcm5lc3NMb2FkZXJ9IGZyb20gJy4uL2NvbXBvbmVudC1oYXJuZXNzJztcbmltcG9ydCB7VGVzdEVsZW1lbnR9IGZyb20gJy4uL3Rlc3QtZWxlbWVudCc7XG5pbXBvcnQge1VuaXRUZXN0RWxlbWVudH0gZnJvbSAnLi91bml0LXRlc3QtZWxlbWVudCc7XG5cbi8qKiBBIGBIYXJuZXNzRW52aXJvbm1lbnRgIGltcGxlbWVudGF0aW9uIGZvciBBbmd1bGFyJ3MgVGVzdGJlZC4gKi9cbmV4cG9ydCBjbGFzcyBUZXN0YmVkSGFybmVzc0Vudmlyb25tZW50IGV4dGVuZHMgSGFybmVzc0Vudmlyb25tZW50PEVsZW1lbnQ+IHtcbiAgcHJpdmF0ZSBfZGVzdHJveWVkID0gZmFsc2U7XG5cbiAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKHJhd1Jvb3RFbGVtZW50OiBFbGVtZW50LCBwcml2YXRlIF9maXh0dXJlOiBDb21wb25lbnRGaXh0dXJlPHVua25vd24+KSB7XG4gICAgc3VwZXIocmF3Um9vdEVsZW1lbnQpO1xuICAgIF9maXh0dXJlLmNvbXBvbmVudFJlZi5vbkRlc3Ryb3koKCkgPT4gdGhpcy5fZGVzdHJveWVkID0gdHJ1ZSk7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIGBIYXJuZXNzTG9hZGVyYCByb290ZWQgYXQgdGhlIGdpdmVuIGZpeHR1cmUncyByb290IGVsZW1lbnQuICovXG4gIHN0YXRpYyBsb2FkZXIoZml4dHVyZTogQ29tcG9uZW50Rml4dHVyZTx1bmtub3duPik6IEhhcm5lc3NMb2FkZXIge1xuICAgIHJldHVybiBuZXcgVGVzdGJlZEhhcm5lc3NFbnZpcm9ubWVudChmaXh0dXJlLm5hdGl2ZUVsZW1lbnQsIGZpeHR1cmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBgSGFybmVzc0xvYWRlcmAgYXQgdGhlIGRvY3VtZW50IHJvb3QuIFRoaXMgY2FuIGJlIHVzZWQgaWYgaGFybmVzc2VzIGFyZVxuICAgKiBsb2NhdGVkIG91dHNpZGUgb2YgYSBmaXh0dXJlIChlLmcuIG92ZXJsYXlzIGFwcGVuZGVkIHRvIHRoZSBkb2N1bWVudCBib2R5KS5cbiAgICovXG4gIHN0YXRpYyBkb2N1bWVudFJvb3RMb2FkZXIoZml4dHVyZTogQ29tcG9uZW50Rml4dHVyZTx1bmtub3duPik6IEhhcm5lc3NMb2FkZXIge1xuICAgIHJldHVybiBuZXcgVGVzdGJlZEhhcm5lc3NFbnZpcm9ubWVudChkb2N1bWVudC5ib2R5LCBmaXh0dXJlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIHRoZSBnaXZlbiBoYXJuZXNzIHR5cGUsIHVzaW5nIHRoZSBmaXh0dXJlJ3Mgcm9vdCBlbGVtZW50IGFzIHRoZVxuICAgKiBoYXJuZXNzJ3MgaG9zdCBlbGVtZW50LiBUaGlzIG1ldGhvZCBzaG91bGQgYmUgdXNlZCB3aGVuIGNyZWF0aW5nIGEgaGFybmVzcyBmb3IgdGhlIHJvb3QgZWxlbWVudFxuICAgKiBvZiBhIGZpeHR1cmUsIGFzIGNvbXBvbmVudHMgZG8gbm90IGhhdmUgdGhlIGNvcnJlY3Qgc2VsZWN0b3Igd2hlbiB0aGV5IGFyZSBjcmVhdGVkIGFzIHRoZSByb290XG4gICAqIG9mIHRoZSBmaXh0dXJlLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGhhcm5lc3NGb3JGaXh0dXJlPFQgZXh0ZW5kcyBDb21wb25lbnRIYXJuZXNzPihcbiAgICAgIGZpeHR1cmU6IENvbXBvbmVudEZpeHR1cmU8dW5rbm93bj4sIGhhcm5lc3NUeXBlOiBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8VD4pOiBQcm9taXNlPFQ+IHtcbiAgICBjb25zdCBlbnZpcm9ubWVudCA9IG5ldyBUZXN0YmVkSGFybmVzc0Vudmlyb25tZW50KGZpeHR1cmUubmF0aXZlRWxlbWVudCwgZml4dHVyZSk7XG4gICAgYXdhaXQgZW52aXJvbm1lbnQuZm9yY2VTdGFiaWxpemUoKTtcbiAgICByZXR1cm4gZW52aXJvbm1lbnQuY3JlYXRlQ29tcG9uZW50SGFybmVzcyhoYXJuZXNzVHlwZSwgZml4dHVyZS5uYXRpdmVFbGVtZW50KTtcbiAgfVxuXG4gIGFzeW5jIGZvcmNlU3RhYmlsaXplKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLl9kZXN0cm95ZWQpIHtcbiAgICAgIHRocm93IEVycm9yKCdIYXJuZXNzIGlzIGF0dGVtcHRpbmcgdG8gdXNlIGEgZml4dHVyZSB0aGF0IGhhcyBhbHJlYWR5IGJlZW4gZGVzdHJveWVkLicpO1xuICAgIH1cblxuICAgIHRoaXMuX2ZpeHR1cmUuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIGF3YWl0IHRoaXMuX2ZpeHR1cmUud2hlblN0YWJsZSgpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGdldERvY3VtZW50Um9vdCgpOiBFbGVtZW50IHtcbiAgICByZXR1cm4gZG9jdW1lbnQuYm9keTtcbiAgfVxuXG4gIHByb3RlY3RlZCBjcmVhdGVUZXN0RWxlbWVudChlbGVtZW50OiBFbGVtZW50KTogVGVzdEVsZW1lbnQge1xuICAgIHJldHVybiBuZXcgVW5pdFRlc3RFbGVtZW50KGVsZW1lbnQsICgpID0+IHRoaXMuZm9yY2VTdGFiaWxpemUoKSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgY3JlYXRlRW52aXJvbm1lbnQoZWxlbWVudDogRWxlbWVudCk6IEhhcm5lc3NFbnZpcm9ubWVudDxFbGVtZW50PiB7XG4gICAgcmV0dXJuIG5ldyBUZXN0YmVkSGFybmVzc0Vudmlyb25tZW50KGVsZW1lbnQsIHRoaXMuX2ZpeHR1cmUpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIGdldEFsbFJhd0VsZW1lbnRzKHNlbGVjdG9yOiBzdHJpbmcpOiBQcm9taXNlPEVsZW1lbnRbXT4ge1xuICAgIGF3YWl0IHRoaXMuZm9yY2VTdGFiaWxpemUoKTtcbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLnJhd1Jvb3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKTtcbiAgfVxufVxuIl19