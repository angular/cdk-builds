/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { HarnessEnvironment } from '@angular/cdk/testing';
import { flush } from '@angular/core/testing';
import { takeWhile } from 'rxjs/operators';
import { TaskStateZoneInterceptor } from './task-state-zone-interceptor';
import { UnitTestElement } from './unit-test-element';
/** A `HarnessEnvironment` implementation for Angular's Testbed. */
var TestbedHarnessEnvironment = /** @class */ (function (_super) {
    tslib_1.__extends(TestbedHarnessEnvironment, _super);
    function TestbedHarnessEnvironment(rawRootElement, _fixture) {
        var _this = _super.call(this, rawRootElement) || this;
        _this._fixture = _fixture;
        _this._destroyed = false;
        _this._taskState = TaskStateZoneInterceptor.setup();
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
    TestbedHarnessEnvironment.prototype.waitForTasksOutsideAngular = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // If we run in the fake async zone, we run "flush" to run any scheduled tasks. This
                        // ensures that the harnesses behave inside of the FakeAsyncTestZone similar to the
                        // "AsyncTestZone" and the root zone (i.e. neither fakeAsync or async). Note that we
                        // cannot just rely on the task state observable to become stable because the state will
                        // never change. This is because the task queue will be only drained if the fake async
                        // zone is being flushed.
                        if (Zone.current.get('FakeAsyncTestZoneSpec')) {
                            flush();
                        }
                        // Wait until the task queue has been drained and the zone is stable. Note that
                        // we cannot rely on "fixture.whenStable" since it does not catch tasks scheduled
                        // outside of the Angular zone. For test harnesses, we want to ensure that the
                        // app is fully stabilized and therefore need to use our own zone interceptor.
                        return [4 /*yield*/, this._taskState.pipe(takeWhile(function (state) { return !state.stable; })).toPromise()];
                    case 1:
                        // Wait until the task queue has been drained and the zone is stable. Note that
                        // we cannot rely on "fixture.whenStable" since it does not catch tasks scheduled
                        // outside of the Angular zone. For test harnesses, we want to ensure that the
                        // app is fully stabilized and therefore need to use our own zone interceptor.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGJlZC1oYXJuZXNzLWVudmlyb25tZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Rlc3RiZWQvdGVzdGJlZC1oYXJuZXNzLWVudmlyb25tZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUN4RCxPQUFPLEVBQW1CLEtBQUssRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRTlELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUd6QyxPQUFPLEVBQVksd0JBQXdCLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUNsRixPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFHcEQsbUVBQW1FO0FBQ25FO0lBQStDLHFEQUEyQjtJQU14RSxtQ0FBc0IsY0FBdUIsRUFBVSxRQUFtQztRQUExRixZQUNFLGtCQUFNLGNBQWMsQ0FBQyxTQUd0QjtRQUpzRCxjQUFRLEdBQVIsUUFBUSxDQUEyQjtRQUxsRixnQkFBVSxHQUFHLEtBQUssQ0FBQztRQU96QixLQUFJLENBQUMsVUFBVSxHQUFHLHdCQUF3QixDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ25ELFFBQVEsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLGNBQU0sT0FBQSxLQUFJLENBQUMsVUFBVSxHQUFHLElBQUksRUFBdEIsQ0FBc0IsQ0FBQyxDQUFDOztJQUNoRSxDQUFDO0lBRUQsNEVBQTRFO0lBQ3JFLGdDQUFNLEdBQWIsVUFBYyxPQUFrQztRQUM5QyxPQUFPLElBQUkseUJBQXlCLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUN2RSxDQUFDO0lBRUQ7OztPQUdHO0lBQ0ksNENBQWtCLEdBQXpCLFVBQTBCLE9BQWtDO1FBQzFELE9BQU8sSUFBSSx5QkFBeUIsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFFRDs7Ozs7T0FLRztJQUNVLDJDQUFpQixHQUE5QixVQUNJLE9BQWtDLEVBQUUsV0FBMkM7Ozs7Ozt3QkFDM0UsV0FBVyxHQUFHLElBQUkseUJBQXlCLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsQ0FBQzt3QkFDbEYscUJBQU0sV0FBVyxDQUFDLGNBQWMsRUFBRSxFQUFBOzt3QkFBbEMsU0FBa0MsQ0FBQzt3QkFDbkMsc0JBQU8sV0FBVyxDQUFDLHNCQUFzQixDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLEVBQUM7Ozs7S0FDL0U7SUFFSyxrREFBYyxHQUFwQjs7Ozs7d0JBQ0UsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFOzRCQUNuQixNQUFNLEtBQUssQ0FBQyx5RUFBeUUsQ0FBQyxDQUFDO3lCQUN4Rjt3QkFFRCxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFBRSxDQUFDO3dCQUM5QixxQkFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxFQUFBOzt3QkFBaEMsU0FBZ0MsQ0FBQzs7Ozs7S0FDbEM7SUFFSyw4REFBMEIsR0FBaEM7Ozs7O3dCQUNFLG9GQUFvRjt3QkFDcEYsbUZBQW1GO3dCQUNuRixvRkFBb0Y7d0JBQ3BGLHdGQUF3Rjt3QkFDeEYsc0ZBQXNGO3dCQUN0Rix5QkFBeUI7d0JBQ3pCLElBQUksSUFBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUMsRUFBRTs0QkFDOUMsS0FBSyxFQUFFLENBQUM7eUJBQ1Q7d0JBRUQsK0VBQStFO3dCQUMvRSxpRkFBaUY7d0JBQ2pGLDhFQUE4RTt3QkFDOUUsOEVBQThFO3dCQUM5RSxxQkFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBQSxLQUFLLElBQUksT0FBQSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQWIsQ0FBYSxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsRUFBQTs7d0JBSnpFLCtFQUErRTt3QkFDL0UsaUZBQWlGO3dCQUNqRiw4RUFBOEU7d0JBQzlFLDhFQUE4RTt3QkFDOUUsU0FBeUUsQ0FBQzs7Ozs7S0FDM0U7SUFFUyxtREFBZSxHQUF6QjtRQUNFLE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQztJQUN2QixDQUFDO0lBRVMscURBQWlCLEdBQTNCLFVBQTRCLE9BQWdCO1FBQTVDLGlCQUVDO1FBREMsT0FBTyxJQUFJLGVBQWUsQ0FBQyxPQUFPLEVBQUUsY0FBTSxPQUFBLEtBQUksQ0FBQyxjQUFjLEVBQUUsRUFBckIsQ0FBcUIsQ0FBQyxDQUFDO0lBQ25FLENBQUM7SUFFUyxxREFBaUIsR0FBM0IsVUFBNEIsT0FBZ0I7UUFDMUMsT0FBTyxJQUFJLHlCQUF5QixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDL0QsQ0FBQztJQUVlLHFEQUFpQixHQUFqQyxVQUFrQyxRQUFnQjs7Ozs0QkFDaEQscUJBQU0sSUFBSSxDQUFDLGNBQWMsRUFBRSxFQUFBOzt3QkFBM0IsU0FBMkIsQ0FBQzt3QkFDNUIsc0JBQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUM7Ozs7S0FDbkU7SUFDSCxnQ0FBQztBQUFELENBQUMsQUFqRkQsQ0FBK0Msa0JBQWtCLEdBaUZoRSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0hhcm5lc3NFbnZpcm9ubWVudH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3Rlc3RpbmcnO1xuaW1wb3J0IHtDb21wb25lbnRGaXh0dXJlLCBmbHVzaH0gZnJvbSAnQGFuZ3VsYXIvY29yZS90ZXN0aW5nJztcbmltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3Rha2VXaGlsZX0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtDb21wb25lbnRIYXJuZXNzLCBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3IsIEhhcm5lc3NMb2FkZXJ9IGZyb20gJy4uL2NvbXBvbmVudC1oYXJuZXNzJztcbmltcG9ydCB7VGVzdEVsZW1lbnR9IGZyb20gJy4uL3Rlc3QtZWxlbWVudCc7XG5pbXBvcnQge1Rhc2tTdGF0ZSwgVGFza1N0YXRlWm9uZUludGVyY2VwdG9yfSBmcm9tICcuL3Rhc2stc3RhdGUtem9uZS1pbnRlcmNlcHRvcic7XG5pbXBvcnQge1VuaXRUZXN0RWxlbWVudH0gZnJvbSAnLi91bml0LXRlc3QtZWxlbWVudCc7XG5cblxuLyoqIEEgYEhhcm5lc3NFbnZpcm9ubWVudGAgaW1wbGVtZW50YXRpb24gZm9yIEFuZ3VsYXIncyBUZXN0YmVkLiAqL1xuZXhwb3J0IGNsYXNzIFRlc3RiZWRIYXJuZXNzRW52aXJvbm1lbnQgZXh0ZW5kcyBIYXJuZXNzRW52aXJvbm1lbnQ8RWxlbWVudD4ge1xuICBwcml2YXRlIF9kZXN0cm95ZWQgPSBmYWxzZTtcblxuICAvKiogT2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHdoZW5ldmVyIHRoZSB0ZXN0IHRhc2sgc3RhdGUgY2hhbmdlcy4gKi9cbiAgcHJpdmF0ZSBfdGFza1N0YXRlOiBPYnNlcnZhYmxlPFRhc2tTdGF0ZT47XG5cbiAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKHJhd1Jvb3RFbGVtZW50OiBFbGVtZW50LCBwcml2YXRlIF9maXh0dXJlOiBDb21wb25lbnRGaXh0dXJlPHVua25vd24+KSB7XG4gICAgc3VwZXIocmF3Um9vdEVsZW1lbnQpO1xuICAgIHRoaXMuX3Rhc2tTdGF0ZSA9IFRhc2tTdGF0ZVpvbmVJbnRlcmNlcHRvci5zZXR1cCgpO1xuICAgIF9maXh0dXJlLmNvbXBvbmVudFJlZi5vbkRlc3Ryb3koKCkgPT4gdGhpcy5fZGVzdHJveWVkID0gdHJ1ZSk7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIGBIYXJuZXNzTG9hZGVyYCByb290ZWQgYXQgdGhlIGdpdmVuIGZpeHR1cmUncyByb290IGVsZW1lbnQuICovXG4gIHN0YXRpYyBsb2FkZXIoZml4dHVyZTogQ29tcG9uZW50Rml4dHVyZTx1bmtub3duPik6IEhhcm5lc3NMb2FkZXIge1xuICAgIHJldHVybiBuZXcgVGVzdGJlZEhhcm5lc3NFbnZpcm9ubWVudChmaXh0dXJlLm5hdGl2ZUVsZW1lbnQsIGZpeHR1cmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBgSGFybmVzc0xvYWRlcmAgYXQgdGhlIGRvY3VtZW50IHJvb3QuIFRoaXMgY2FuIGJlIHVzZWQgaWYgaGFybmVzc2VzIGFyZVxuICAgKiBsb2NhdGVkIG91dHNpZGUgb2YgYSBmaXh0dXJlIChlLmcuIG92ZXJsYXlzIGFwcGVuZGVkIHRvIHRoZSBkb2N1bWVudCBib2R5KS5cbiAgICovXG4gIHN0YXRpYyBkb2N1bWVudFJvb3RMb2FkZXIoZml4dHVyZTogQ29tcG9uZW50Rml4dHVyZTx1bmtub3duPik6IEhhcm5lc3NMb2FkZXIge1xuICAgIHJldHVybiBuZXcgVGVzdGJlZEhhcm5lc3NFbnZpcm9ubWVudChkb2N1bWVudC5ib2R5LCBmaXh0dXJlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIHRoZSBnaXZlbiBoYXJuZXNzIHR5cGUsIHVzaW5nIHRoZSBmaXh0dXJlJ3Mgcm9vdCBlbGVtZW50IGFzIHRoZVxuICAgKiBoYXJuZXNzJ3MgaG9zdCBlbGVtZW50LiBUaGlzIG1ldGhvZCBzaG91bGQgYmUgdXNlZCB3aGVuIGNyZWF0aW5nIGEgaGFybmVzcyBmb3IgdGhlIHJvb3QgZWxlbWVudFxuICAgKiBvZiBhIGZpeHR1cmUsIGFzIGNvbXBvbmVudHMgZG8gbm90IGhhdmUgdGhlIGNvcnJlY3Qgc2VsZWN0b3Igd2hlbiB0aGV5IGFyZSBjcmVhdGVkIGFzIHRoZSByb290XG4gICAqIG9mIHRoZSBmaXh0dXJlLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGhhcm5lc3NGb3JGaXh0dXJlPFQgZXh0ZW5kcyBDb21wb25lbnRIYXJuZXNzPihcbiAgICAgIGZpeHR1cmU6IENvbXBvbmVudEZpeHR1cmU8dW5rbm93bj4sIGhhcm5lc3NUeXBlOiBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8VD4pOiBQcm9taXNlPFQ+IHtcbiAgICBjb25zdCBlbnZpcm9ubWVudCA9IG5ldyBUZXN0YmVkSGFybmVzc0Vudmlyb25tZW50KGZpeHR1cmUubmF0aXZlRWxlbWVudCwgZml4dHVyZSk7XG4gICAgYXdhaXQgZW52aXJvbm1lbnQuZm9yY2VTdGFiaWxpemUoKTtcbiAgICByZXR1cm4gZW52aXJvbm1lbnQuY3JlYXRlQ29tcG9uZW50SGFybmVzcyhoYXJuZXNzVHlwZSwgZml4dHVyZS5uYXRpdmVFbGVtZW50KTtcbiAgfVxuXG4gIGFzeW5jIGZvcmNlU3RhYmlsaXplKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLl9kZXN0cm95ZWQpIHtcbiAgICAgIHRocm93IEVycm9yKCdIYXJuZXNzIGlzIGF0dGVtcHRpbmcgdG8gdXNlIGEgZml4dHVyZSB0aGF0IGhhcyBhbHJlYWR5IGJlZW4gZGVzdHJveWVkLicpO1xuICAgIH1cblxuICAgIHRoaXMuX2ZpeHR1cmUuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIGF3YWl0IHRoaXMuX2ZpeHR1cmUud2hlblN0YWJsZSgpO1xuICB9XG5cbiAgYXN5bmMgd2FpdEZvclRhc2tzT3V0c2lkZUFuZ3VsYXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gSWYgd2UgcnVuIGluIHRoZSBmYWtlIGFzeW5jIHpvbmUsIHdlIHJ1biBcImZsdXNoXCIgdG8gcnVuIGFueSBzY2hlZHVsZWQgdGFza3MuIFRoaXNcbiAgICAvLyBlbnN1cmVzIHRoYXQgdGhlIGhhcm5lc3NlcyBiZWhhdmUgaW5zaWRlIG9mIHRoZSBGYWtlQXN5bmNUZXN0Wm9uZSBzaW1pbGFyIHRvIHRoZVxuICAgIC8vIFwiQXN5bmNUZXN0Wm9uZVwiIGFuZCB0aGUgcm9vdCB6b25lIChpLmUuIG5laXRoZXIgZmFrZUFzeW5jIG9yIGFzeW5jKS4gTm90ZSB0aGF0IHdlXG4gICAgLy8gY2Fubm90IGp1c3QgcmVseSBvbiB0aGUgdGFzayBzdGF0ZSBvYnNlcnZhYmxlIHRvIGJlY29tZSBzdGFibGUgYmVjYXVzZSB0aGUgc3RhdGUgd2lsbFxuICAgIC8vIG5ldmVyIGNoYW5nZS4gVGhpcyBpcyBiZWNhdXNlIHRoZSB0YXNrIHF1ZXVlIHdpbGwgYmUgb25seSBkcmFpbmVkIGlmIHRoZSBmYWtlIGFzeW5jXG4gICAgLy8gem9uZSBpcyBiZWluZyBmbHVzaGVkLlxuICAgIGlmIChab25lIS5jdXJyZW50LmdldCgnRmFrZUFzeW5jVGVzdFpvbmVTcGVjJykpIHtcbiAgICAgIGZsdXNoKCk7XG4gICAgfVxuXG4gICAgLy8gV2FpdCB1bnRpbCB0aGUgdGFzayBxdWV1ZSBoYXMgYmVlbiBkcmFpbmVkIGFuZCB0aGUgem9uZSBpcyBzdGFibGUuIE5vdGUgdGhhdFxuICAgIC8vIHdlIGNhbm5vdCByZWx5IG9uIFwiZml4dHVyZS53aGVuU3RhYmxlXCIgc2luY2UgaXQgZG9lcyBub3QgY2F0Y2ggdGFza3Mgc2NoZWR1bGVkXG4gICAgLy8gb3V0c2lkZSBvZiB0aGUgQW5ndWxhciB6b25lLiBGb3IgdGVzdCBoYXJuZXNzZXMsIHdlIHdhbnQgdG8gZW5zdXJlIHRoYXQgdGhlXG4gICAgLy8gYXBwIGlzIGZ1bGx5IHN0YWJpbGl6ZWQgYW5kIHRoZXJlZm9yZSBuZWVkIHRvIHVzZSBvdXIgb3duIHpvbmUgaW50ZXJjZXB0b3IuXG4gICAgYXdhaXQgdGhpcy5fdGFza1N0YXRlLnBpcGUodGFrZVdoaWxlKHN0YXRlID0+ICFzdGF0ZS5zdGFibGUpKS50b1Byb21pc2UoKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBnZXREb2N1bWVudFJvb3QoKTogRWxlbWVudCB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmJvZHk7XG4gIH1cblxuICBwcm90ZWN0ZWQgY3JlYXRlVGVzdEVsZW1lbnQoZWxlbWVudDogRWxlbWVudCk6IFRlc3RFbGVtZW50IHtcbiAgICByZXR1cm4gbmV3IFVuaXRUZXN0RWxlbWVudChlbGVtZW50LCAoKSA9PiB0aGlzLmZvcmNlU3RhYmlsaXplKCkpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGNyZWF0ZUVudmlyb25tZW50KGVsZW1lbnQ6IEVsZW1lbnQpOiBIYXJuZXNzRW52aXJvbm1lbnQ8RWxlbWVudD4ge1xuICAgIHJldHVybiBuZXcgVGVzdGJlZEhhcm5lc3NFbnZpcm9ubWVudChlbGVtZW50LCB0aGlzLl9maXh0dXJlKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBnZXRBbGxSYXdFbGVtZW50cyhzZWxlY3Rvcjogc3RyaW5nKTogUHJvbWlzZTxFbGVtZW50W10+IHtcbiAgICBhd2FpdCB0aGlzLmZvcmNlU3RhYmlsaXplKCk7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5yYXdSb290RWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSk7XG4gIH1cbn1cbiJdfQ==