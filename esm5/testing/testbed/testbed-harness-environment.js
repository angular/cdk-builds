/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { HarnessEnvironment } from '@angular/cdk/testing';
import { UnitTestElement } from './unit-test-element';
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
        return new UnitTestElement(element, function () { return _this.forceStabilize(); });
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
}(HarnessEnvironment));
export { TestbedHarnessEnvironment };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGJlZC1oYXJuZXNzLWVudmlyb25tZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Rlc3RiZWQvdGVzdGJlZC1oYXJuZXNzLWVudmlyb25tZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUl4RCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFFcEQsbUVBQW1FO0FBQ25FO0lBQStDLHFEQUEyQjtJQUd4RSxtQ0FBc0IsY0FBdUIsRUFBVSxRQUFtQztRQUExRixZQUNFLGtCQUFNLGNBQWMsQ0FBQyxTQUV0QjtRQUhzRCxjQUFRLEdBQVIsUUFBUSxDQUEyQjtRQUZsRixnQkFBVSxHQUFHLEtBQUssQ0FBQztRQUl6QixRQUFRLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxjQUFNLE9BQUEsS0FBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLEVBQXRCLENBQXNCLENBQUMsQ0FBQzs7SUFDaEUsQ0FBQztJQUVELDRFQUE0RTtJQUNyRSxnQ0FBTSxHQUFiLFVBQWMsT0FBa0M7UUFDOUMsT0FBTyxJQUFJLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUVEOzs7T0FHRztJQUNJLDRDQUFrQixHQUF6QixVQUEwQixPQUFrQztRQUMxRCxPQUFPLElBQUkseUJBQXlCLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDVSwyQ0FBaUIsR0FBOUIsVUFDSSxPQUFrQyxFQUFFLFdBQTJDOzs7Ozs7d0JBQzNFLFdBQVcsR0FBRyxJQUFJLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUM7d0JBQ2xGLHFCQUFNLFdBQVcsQ0FBQyxjQUFjLEVBQUUsRUFBQTs7d0JBQWxDLFNBQWtDLENBQUM7d0JBQ25DLHNCQUFPLFdBQVcsQ0FBQyxzQkFBc0IsQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFDOzs7O0tBQy9FO0lBRUssa0RBQWMsR0FBcEI7Ozs7O3dCQUNFLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTs0QkFDbkIsTUFBTSxLQUFLLENBQUMseUVBQXlFLENBQUMsQ0FBQzt5QkFDeEY7d0JBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUUsQ0FBQzt3QkFDOUIscUJBQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsRUFBQTs7d0JBQWhDLFNBQWdDLENBQUM7Ozs7O0tBQ2xDO0lBRVMsbURBQWUsR0FBekI7UUFDRSxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUM7SUFDdkIsQ0FBQztJQUVTLHFEQUFpQixHQUEzQixVQUE0QixPQUFnQjtRQUE1QyxpQkFFQztRQURDLE9BQU8sSUFBSSxlQUFlLENBQUMsT0FBTyxFQUFFLGNBQU0sT0FBQSxLQUFJLENBQUMsY0FBYyxFQUFFLEVBQXJCLENBQXFCLENBQUMsQ0FBQztJQUNuRSxDQUFDO0lBRVMscURBQWlCLEdBQTNCLFVBQTRCLE9BQWdCO1FBQzFDLE9BQU8sSUFBSSx5QkFBeUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFFZSxxREFBaUIsR0FBakMsVUFBa0MsUUFBZ0I7Ozs7NEJBQ2hELHFCQUFNLElBQUksQ0FBQyxjQUFjLEVBQUUsRUFBQTs7d0JBQTNCLFNBQTJCLENBQUM7d0JBQzVCLHNCQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFDOzs7O0tBQ25FO0lBQ0gsZ0NBQUM7QUFBRCxDQUFDLEFBM0RELENBQStDLGtCQUFrQixHQTJEaEUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtIYXJuZXNzRW52aXJvbm1lbnR9IGZyb20gJ0Bhbmd1bGFyL2Nkay90ZXN0aW5nJztcbmltcG9ydCB7Q29tcG9uZW50Rml4dHVyZX0gZnJvbSAnQGFuZ3VsYXIvY29yZS90ZXN0aW5nJztcbmltcG9ydCB7Q29tcG9uZW50SGFybmVzcywgQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yLCBIYXJuZXNzTG9hZGVyfSBmcm9tICcuLi9jb21wb25lbnQtaGFybmVzcyc7XG5pbXBvcnQge1Rlc3RFbGVtZW50fSBmcm9tICcuLi90ZXN0LWVsZW1lbnQnO1xuaW1wb3J0IHtVbml0VGVzdEVsZW1lbnR9IGZyb20gJy4vdW5pdC10ZXN0LWVsZW1lbnQnO1xuXG4vKiogQSBgSGFybmVzc0Vudmlyb25tZW50YCBpbXBsZW1lbnRhdGlvbiBmb3IgQW5ndWxhcidzIFRlc3RiZWQuICovXG5leHBvcnQgY2xhc3MgVGVzdGJlZEhhcm5lc3NFbnZpcm9ubWVudCBleHRlbmRzIEhhcm5lc3NFbnZpcm9ubWVudDxFbGVtZW50PiB7XG4gIHByaXZhdGUgX2Rlc3Ryb3llZCA9IGZhbHNlO1xuXG4gIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihyYXdSb290RWxlbWVudDogRWxlbWVudCwgcHJpdmF0ZSBfZml4dHVyZTogQ29tcG9uZW50Rml4dHVyZTx1bmtub3duPikge1xuICAgIHN1cGVyKHJhd1Jvb3RFbGVtZW50KTtcbiAgICBfZml4dHVyZS5jb21wb25lbnRSZWYub25EZXN0cm95KCgpID0+IHRoaXMuX2Rlc3Ryb3llZCA9IHRydWUpO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBgSGFybmVzc0xvYWRlcmAgcm9vdGVkIGF0IHRoZSBnaXZlbiBmaXh0dXJlJ3Mgcm9vdCBlbGVtZW50LiAqL1xuICBzdGF0aWMgbG9hZGVyKGZpeHR1cmU6IENvbXBvbmVudEZpeHR1cmU8dW5rbm93bj4pOiBIYXJuZXNzTG9hZGVyIHtcbiAgICByZXR1cm4gbmV3IFRlc3RiZWRIYXJuZXNzRW52aXJvbm1lbnQoZml4dHVyZS5uYXRpdmVFbGVtZW50LCBmaXh0dXJlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgYEhhcm5lc3NMb2FkZXJgIGF0IHRoZSBkb2N1bWVudCByb290LiBUaGlzIGNhbiBiZSB1c2VkIGlmIGhhcm5lc3NlcyBhcmVcbiAgICogbG9jYXRlZCBvdXRzaWRlIG9mIGEgZml4dHVyZSAoZS5nLiBvdmVybGF5cyBhcHBlbmRlZCB0byB0aGUgZG9jdW1lbnQgYm9keSkuXG4gICAqL1xuICBzdGF0aWMgZG9jdW1lbnRSb290TG9hZGVyKGZpeHR1cmU6IENvbXBvbmVudEZpeHR1cmU8dW5rbm93bj4pOiBIYXJuZXNzTG9hZGVyIHtcbiAgICByZXR1cm4gbmV3IFRlc3RiZWRIYXJuZXNzRW52aXJvbm1lbnQoZG9jdW1lbnQuYm9keSwgZml4dHVyZSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiB0aGUgZ2l2ZW4gaGFybmVzcyB0eXBlLCB1c2luZyB0aGUgZml4dHVyZSdzIHJvb3QgZWxlbWVudCBhcyB0aGVcbiAgICogaGFybmVzcydzIGhvc3QgZWxlbWVudC4gVGhpcyBtZXRob2Qgc2hvdWxkIGJlIHVzZWQgd2hlbiBjcmVhdGluZyBhIGhhcm5lc3MgZm9yIHRoZSByb290IGVsZW1lbnRcbiAgICogb2YgYSBmaXh0dXJlLCBhcyBjb21wb25lbnRzIGRvIG5vdCBoYXZlIHRoZSBjb3JyZWN0IHNlbGVjdG9yIHdoZW4gdGhleSBhcmUgY3JlYXRlZCBhcyB0aGUgcm9vdFxuICAgKiBvZiB0aGUgZml4dHVyZS5cbiAgICovXG4gIHN0YXRpYyBhc3luYyBoYXJuZXNzRm9yRml4dHVyZTxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4oXG4gICAgICBmaXh0dXJlOiBDb21wb25lbnRGaXh0dXJlPHVua25vd24+LCBoYXJuZXNzVHlwZTogQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPFQ+KTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgZW52aXJvbm1lbnQgPSBuZXcgVGVzdGJlZEhhcm5lc3NFbnZpcm9ubWVudChmaXh0dXJlLm5hdGl2ZUVsZW1lbnQsIGZpeHR1cmUpO1xuICAgIGF3YWl0IGVudmlyb25tZW50LmZvcmNlU3RhYmlsaXplKCk7XG4gICAgcmV0dXJuIGVudmlyb25tZW50LmNyZWF0ZUNvbXBvbmVudEhhcm5lc3MoaGFybmVzc1R5cGUsIGZpeHR1cmUubmF0aXZlRWxlbWVudCk7XG4gIH1cblxuICBhc3luYyBmb3JjZVN0YWJpbGl6ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5fZGVzdHJveWVkKSB7XG4gICAgICB0aHJvdyBFcnJvcignSGFybmVzcyBpcyBhdHRlbXB0aW5nIHRvIHVzZSBhIGZpeHR1cmUgdGhhdCBoYXMgYWxyZWFkeSBiZWVuIGRlc3Ryb3llZC4nKTtcbiAgICB9XG5cbiAgICB0aGlzLl9maXh0dXJlLmRldGVjdENoYW5nZXMoKTtcbiAgICBhd2FpdCB0aGlzLl9maXh0dXJlLndoZW5TdGFibGUoKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBnZXREb2N1bWVudFJvb3QoKTogRWxlbWVudCB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmJvZHk7XG4gIH1cblxuICBwcm90ZWN0ZWQgY3JlYXRlVGVzdEVsZW1lbnQoZWxlbWVudDogRWxlbWVudCk6IFRlc3RFbGVtZW50IHtcbiAgICByZXR1cm4gbmV3IFVuaXRUZXN0RWxlbWVudChlbGVtZW50LCAoKSA9PiB0aGlzLmZvcmNlU3RhYmlsaXplKCkpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGNyZWF0ZUVudmlyb25tZW50KGVsZW1lbnQ6IEVsZW1lbnQpOiBIYXJuZXNzRW52aXJvbm1lbnQ8RWxlbWVudD4ge1xuICAgIHJldHVybiBuZXcgVGVzdGJlZEhhcm5lc3NFbnZpcm9ubWVudChlbGVtZW50LCB0aGlzLl9maXh0dXJlKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBnZXRBbGxSYXdFbGVtZW50cyhzZWxlY3Rvcjogc3RyaW5nKTogUHJvbWlzZTxFbGVtZW50W10+IHtcbiAgICBhd2FpdCB0aGlzLmZvcmNlU3RhYmlsaXplKCk7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5yYXdSb290RWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSk7XG4gIH1cbn1cbiJdfQ==