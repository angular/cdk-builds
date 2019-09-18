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
        return TestbedHarnessEnvironment;
    }(harness_environment_1.HarnessEnvironment));
    exports.TestbedHarnessEnvironment = TestbedHarnessEnvironment;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGJlZC1oYXJuZXNzLWVudmlyb25tZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Rlc3RiZWQvdGVzdGJlZC1oYXJuZXNzLWVudmlyb25tZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUlILGdGQUEwRDtJQUUxRCxvRkFBb0Q7SUFFcEQsbUVBQW1FO0lBQ25FO1FBQStDLHFEQUEyQjtRQUd4RSxtQ0FBc0IsY0FBdUIsRUFBVSxRQUFtQztZQUExRixZQUNFLGtCQUFNLGNBQWMsQ0FBQyxTQUV0QjtZQUhzRCxjQUFRLEdBQVIsUUFBUSxDQUEyQjtZQUZsRixnQkFBVSxHQUFHLEtBQUssQ0FBQztZQUl6QixRQUFRLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxjQUFNLE9BQUEsS0FBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLEVBQXRCLENBQXNCLENBQUMsQ0FBQzs7UUFDaEUsQ0FBQztRQUVELDRFQUE0RTtRQUNyRSxnQ0FBTSxHQUFiLFVBQWMsT0FBa0M7WUFDOUMsT0FBTyxJQUFJLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDdkUsQ0FBQztRQUVEOzs7V0FHRztRQUNJLDRDQUFrQixHQUF6QixVQUEwQixPQUFrQztZQUMxRCxPQUFPLElBQUkseUJBQXlCLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBRUQ7Ozs7O1dBS0c7UUFDVSwyQ0FBaUIsR0FBOUIsVUFDSSxPQUFrQyxFQUFFLFdBQTJDOzs7Ozs7NEJBQzNFLFdBQVcsR0FBRyxJQUFJLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUM7NEJBQ2xGLHFCQUFNLFdBQVcsQ0FBQyxVQUFVLEVBQUUsRUFBQTs7NEJBQTlCLFNBQThCLENBQUM7NEJBQy9CLHNCQUFPLFdBQVcsQ0FBQyxzQkFBc0IsQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFDOzs7O1NBQy9FO1FBRVMsbURBQWUsR0FBekI7WUFDRSxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUM7UUFDdkIsQ0FBQztRQUVTLHFEQUFpQixHQUEzQixVQUE0QixPQUFnQjtZQUMxQyxPQUFPLElBQUksbUNBQWUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNsRSxDQUFDO1FBRVMscURBQWlCLEdBQTNCLFVBQTRCLE9BQWdCO1lBQzFDLE9BQU8sSUFBSSx5QkFBeUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9ELENBQUM7UUFFZSxxREFBaUIsR0FBakMsVUFBa0MsUUFBZ0I7Ozs7Z0NBQ2hELHFCQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBQTs7NEJBQXZCLFNBQXVCLENBQUM7NEJBQ3hCLHNCQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFDOzs7O1NBQ25FO1FBRWEsOENBQVUsR0FBeEI7Ozs7OzRCQUNFLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtnQ0FDbkIsTUFBTSxLQUFLLENBQUMseUVBQXlFLENBQUMsQ0FBQzs2QkFDeEY7NEJBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUUsQ0FBQzs0QkFDOUIscUJBQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsRUFBQTs7NEJBQWhDLFNBQWdDLENBQUM7Ozs7O1NBQ2xDO1FBQ0gsZ0NBQUM7SUFBRCxDQUFDLEFBM0RELENBQStDLHdDQUFrQixHQTJEaEU7SUEzRFksOERBQXlCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q29tcG9uZW50Rml4dHVyZX0gZnJvbSAnQGFuZ3VsYXIvY29yZS90ZXN0aW5nJztcbmltcG9ydCB7Q29tcG9uZW50SGFybmVzcywgQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yLCBIYXJuZXNzTG9hZGVyfSBmcm9tICcuLi9jb21wb25lbnQtaGFybmVzcyc7XG5pbXBvcnQge0hhcm5lc3NFbnZpcm9ubWVudH0gZnJvbSAnLi4vaGFybmVzcy1lbnZpcm9ubWVudCc7XG5pbXBvcnQge1Rlc3RFbGVtZW50fSBmcm9tICcuLi90ZXN0LWVsZW1lbnQnO1xuaW1wb3J0IHtVbml0VGVzdEVsZW1lbnR9IGZyb20gJy4vdW5pdC10ZXN0LWVsZW1lbnQnO1xuXG4vKiogQSBgSGFybmVzc0Vudmlyb25tZW50YCBpbXBsZW1lbnRhdGlvbiBmb3IgQW5ndWxhcidzIFRlc3RiZWQuICovXG5leHBvcnQgY2xhc3MgVGVzdGJlZEhhcm5lc3NFbnZpcm9ubWVudCBleHRlbmRzIEhhcm5lc3NFbnZpcm9ubWVudDxFbGVtZW50PiB7XG4gIHByaXZhdGUgX2Rlc3Ryb3llZCA9IGZhbHNlO1xuXG4gIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihyYXdSb290RWxlbWVudDogRWxlbWVudCwgcHJpdmF0ZSBfZml4dHVyZTogQ29tcG9uZW50Rml4dHVyZTx1bmtub3duPikge1xuICAgIHN1cGVyKHJhd1Jvb3RFbGVtZW50KTtcbiAgICBfZml4dHVyZS5jb21wb25lbnRSZWYub25EZXN0cm95KCgpID0+IHRoaXMuX2Rlc3Ryb3llZCA9IHRydWUpO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBgSGFybmVzc0xvYWRlcmAgcm9vdGVkIGF0IHRoZSBnaXZlbiBmaXh0dXJlJ3Mgcm9vdCBlbGVtZW50LiAqL1xuICBzdGF0aWMgbG9hZGVyKGZpeHR1cmU6IENvbXBvbmVudEZpeHR1cmU8dW5rbm93bj4pOiBIYXJuZXNzTG9hZGVyIHtcbiAgICByZXR1cm4gbmV3IFRlc3RiZWRIYXJuZXNzRW52aXJvbm1lbnQoZml4dHVyZS5uYXRpdmVFbGVtZW50LCBmaXh0dXJlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgYEhhcm5lc3NMb2FkZXJgIGF0IHRoZSBkb2N1bWVudCByb290LiBUaGlzIGNhbiBiZSB1c2VkIGlmIGhhcm5lc3NlcyBhcmVcbiAgICogbG9jYXRlZCBvdXRzaWRlIG9mIGEgZml4dHVyZSAoZS5nLiBvdmVybGF5cyBhcHBlbmRlZCB0byB0aGUgZG9jdW1lbnQgYm9keSkuXG4gICAqL1xuICBzdGF0aWMgZG9jdW1lbnRSb290TG9hZGVyKGZpeHR1cmU6IENvbXBvbmVudEZpeHR1cmU8dW5rbm93bj4pOiBIYXJuZXNzTG9hZGVyIHtcbiAgICByZXR1cm4gbmV3IFRlc3RiZWRIYXJuZXNzRW52aXJvbm1lbnQoZG9jdW1lbnQuYm9keSwgZml4dHVyZSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiB0aGUgZ2l2ZW4gaGFybmVzcyB0eXBlLCB1c2luZyB0aGUgZml4dHVyZSdzIHJvb3QgZWxlbWVudCBhcyB0aGVcbiAgICogaGFybmVzcydzIGhvc3QgZWxlbWVudC4gVGhpcyBtZXRob2Qgc2hvdWxkIGJlIHVzZWQgd2hlbiBjcmVhdGluZyBhIGhhcm5lc3MgZm9yIHRoZSByb290IGVsZW1lbnRcbiAgICogb2YgYSBmaXh0dXJlLCBhcyBjb21wb25lbnRzIGRvIG5vdCBoYXZlIHRoZSBjb3JyZWN0IHNlbGVjdG9yIHdoZW4gdGhleSBhcmUgY3JlYXRlZCBhcyB0aGUgcm9vdFxuICAgKiBvZiB0aGUgZml4dHVyZS5cbiAgICovXG4gIHN0YXRpYyBhc3luYyBoYXJuZXNzRm9yRml4dHVyZTxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4oXG4gICAgICBmaXh0dXJlOiBDb21wb25lbnRGaXh0dXJlPHVua25vd24+LCBoYXJuZXNzVHlwZTogQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPFQ+KTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgZW52aXJvbm1lbnQgPSBuZXcgVGVzdGJlZEhhcm5lc3NFbnZpcm9ubWVudChmaXh0dXJlLm5hdGl2ZUVsZW1lbnQsIGZpeHR1cmUpO1xuICAgIGF3YWl0IGVudmlyb25tZW50Ll9zdGFiaWxpemUoKTtcbiAgICByZXR1cm4gZW52aXJvbm1lbnQuY3JlYXRlQ29tcG9uZW50SGFybmVzcyhoYXJuZXNzVHlwZSwgZml4dHVyZS5uYXRpdmVFbGVtZW50KTtcbiAgfVxuXG4gIHByb3RlY3RlZCBnZXREb2N1bWVudFJvb3QoKTogRWxlbWVudCB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmJvZHk7XG4gIH1cblxuICBwcm90ZWN0ZWQgY3JlYXRlVGVzdEVsZW1lbnQoZWxlbWVudDogRWxlbWVudCk6IFRlc3RFbGVtZW50IHtcbiAgICByZXR1cm4gbmV3IFVuaXRUZXN0RWxlbWVudChlbGVtZW50LCB0aGlzLl9zdGFiaWxpemUuYmluZCh0aGlzKSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgY3JlYXRlRW52aXJvbm1lbnQoZWxlbWVudDogRWxlbWVudCk6IEhhcm5lc3NFbnZpcm9ubWVudDxFbGVtZW50PiB7XG4gICAgcmV0dXJuIG5ldyBUZXN0YmVkSGFybmVzc0Vudmlyb25tZW50KGVsZW1lbnQsIHRoaXMuX2ZpeHR1cmUpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIGdldEFsbFJhd0VsZW1lbnRzKHNlbGVjdG9yOiBzdHJpbmcpOiBQcm9taXNlPEVsZW1lbnRbXT4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMucmF3Um9vdEVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBfc3RhYmlsaXplKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLl9kZXN0cm95ZWQpIHtcbiAgICAgIHRocm93IEVycm9yKCdIYXJuZXNzIGlzIGF0dGVtcHRpbmcgdG8gdXNlIGEgZml4dHVyZSB0aGF0IGhhcyBhbHJlYWR5IGJlZW4gZGVzdHJveWVkLicpO1xuICAgIH1cblxuICAgIHRoaXMuX2ZpeHR1cmUuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIGF3YWl0IHRoaXMuX2ZpeHR1cmUud2hlblN0YWJsZSgpO1xuICB9XG59XG4iXX0=