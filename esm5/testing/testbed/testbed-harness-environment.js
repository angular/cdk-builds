/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __awaiter, __extends, __generator } from "tslib";
import { HarnessEnvironment } from '@angular/cdk/testing';
import { flush } from '@angular/core/testing';
import { takeWhile } from 'rxjs/operators';
import { TaskStateZoneInterceptor } from './task-state-zone-interceptor';
import { UnitTestElement } from './unit-test-element';
/** A `HarnessEnvironment` implementation for Angular's Testbed. */
var TestbedHarnessEnvironment = /** @class */ (function (_super) {
    __extends(TestbedHarnessEnvironment, _super);
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
        return __awaiter(this, void 0, void 0, function () {
            var environment;
            return __generator(this, function (_a) {
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
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
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
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
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
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGJlZC1oYXJuZXNzLWVudmlyb25tZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Rlc3RiZWQvdGVzdGJlZC1oYXJuZXNzLWVudmlyb25tZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBR0wsa0JBQWtCLEVBR25CLE1BQU0sc0JBQXNCLENBQUM7QUFDOUIsT0FBTyxFQUFtQixLQUFLLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUU5RCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDekMsT0FBTyxFQUFZLHdCQUF3QixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDbEYsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBR3BELG1FQUFtRTtBQUNuRTtJQUErQyw2Q0FBMkI7SUFNeEUsbUNBQXNCLGNBQXVCLEVBQVUsUUFBbUM7UUFBMUYsWUFDRSxrQkFBTSxjQUFjLENBQUMsU0FHdEI7UUFKc0QsY0FBUSxHQUFSLFFBQVEsQ0FBMkI7UUFMbEYsZ0JBQVUsR0FBRyxLQUFLLENBQUM7UUFPekIsS0FBSSxDQUFDLFVBQVUsR0FBRyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNuRCxRQUFRLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxjQUFNLE9BQUEsS0FBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLEVBQXRCLENBQXNCLENBQUMsQ0FBQzs7SUFDaEUsQ0FBQztJQUVELDRFQUE0RTtJQUNyRSxnQ0FBTSxHQUFiLFVBQWMsT0FBa0M7UUFDOUMsT0FBTyxJQUFJLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUVEOzs7T0FHRztJQUNJLDRDQUFrQixHQUF6QixVQUEwQixPQUFrQztRQUMxRCxPQUFPLElBQUkseUJBQXlCLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDVSwyQ0FBaUIsR0FBOUIsVUFDSSxPQUFrQyxFQUFFLFdBQTJDOzs7Ozs7d0JBQzNFLFdBQVcsR0FBRyxJQUFJLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUM7d0JBQ2xGLHFCQUFNLFdBQVcsQ0FBQyxjQUFjLEVBQUUsRUFBQTs7d0JBQWxDLFNBQWtDLENBQUM7d0JBQ25DLHNCQUFPLFdBQVcsQ0FBQyxzQkFBc0IsQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFDOzs7O0tBQy9FO0lBRUssa0RBQWMsR0FBcEI7Ozs7O3dCQUNFLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTs0QkFDbkIsTUFBTSxLQUFLLENBQUMseUVBQXlFLENBQUMsQ0FBQzt5QkFDeEY7d0JBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUUsQ0FBQzt3QkFDOUIscUJBQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsRUFBQTs7d0JBQWhDLFNBQWdDLENBQUM7Ozs7O0tBQ2xDO0lBRUssOERBQTBCLEdBQWhDOzs7Ozt3QkFDRSxvRkFBb0Y7d0JBQ3BGLG1GQUFtRjt3QkFDbkYsb0ZBQW9GO3dCQUNwRix3RkFBd0Y7d0JBQ3hGLHNGQUFzRjt3QkFDdEYseUJBQXlCO3dCQUN6QixJQUFJLElBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLEVBQUU7NEJBQzlDLEtBQUssRUFBRSxDQUFDO3lCQUNUO3dCQUVELCtFQUErRTt3QkFDL0UsaUZBQWlGO3dCQUNqRiw4RUFBOEU7d0JBQzlFLDhFQUE4RTt3QkFDOUUscUJBQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQUEsS0FBSyxJQUFJLE9BQUEsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFiLENBQWEsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLEVBQUE7O3dCQUp6RSwrRUFBK0U7d0JBQy9FLGlGQUFpRjt3QkFDakYsOEVBQThFO3dCQUM5RSw4RUFBOEU7d0JBQzlFLFNBQXlFLENBQUM7Ozs7O0tBQzNFO0lBRVMsbURBQWUsR0FBekI7UUFDRSxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUM7SUFDdkIsQ0FBQztJQUVTLHFEQUFpQixHQUEzQixVQUE0QixPQUFnQjtRQUE1QyxpQkFFQztRQURDLE9BQU8sSUFBSSxlQUFlLENBQUMsT0FBTyxFQUFFLGNBQU0sT0FBQSxLQUFJLENBQUMsY0FBYyxFQUFFLEVBQXJCLENBQXFCLENBQUMsQ0FBQztJQUNuRSxDQUFDO0lBRVMscURBQWlCLEdBQTNCLFVBQTRCLE9BQWdCO1FBQzFDLE9BQU8sSUFBSSx5QkFBeUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFFZSxxREFBaUIsR0FBakMsVUFBa0MsUUFBZ0I7Ozs7NEJBQ2hELHFCQUFNLElBQUksQ0FBQyxjQUFjLEVBQUUsRUFBQTs7d0JBQTNCLFNBQTJCLENBQUM7d0JBQzVCLHNCQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFDOzs7O0tBQ25FO0lBQ0gsZ0NBQUM7QUFBRCxDQUFDLEFBakZELENBQStDLGtCQUFrQixHQWlGaEUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgQ29tcG9uZW50SGFybmVzcyxcbiAgQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yLFxuICBIYXJuZXNzRW52aXJvbm1lbnQsXG4gIEhhcm5lc3NMb2FkZXIsXG4gIFRlc3RFbGVtZW50XG59IGZyb20gJ0Bhbmd1bGFyL2Nkay90ZXN0aW5nJztcbmltcG9ydCB7Q29tcG9uZW50Rml4dHVyZSwgZmx1c2h9IGZyb20gJ0Bhbmd1bGFyL2NvcmUvdGVzdGluZyc7XG5pbXBvcnQge09ic2VydmFibGV9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHt0YWtlV2hpbGV9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7VGFza1N0YXRlLCBUYXNrU3RhdGVab25lSW50ZXJjZXB0b3J9IGZyb20gJy4vdGFzay1zdGF0ZS16b25lLWludGVyY2VwdG9yJztcbmltcG9ydCB7VW5pdFRlc3RFbGVtZW50fSBmcm9tICcuL3VuaXQtdGVzdC1lbGVtZW50JztcblxuXG4vKiogQSBgSGFybmVzc0Vudmlyb25tZW50YCBpbXBsZW1lbnRhdGlvbiBmb3IgQW5ndWxhcidzIFRlc3RiZWQuICovXG5leHBvcnQgY2xhc3MgVGVzdGJlZEhhcm5lc3NFbnZpcm9ubWVudCBleHRlbmRzIEhhcm5lc3NFbnZpcm9ubWVudDxFbGVtZW50PiB7XG4gIHByaXZhdGUgX2Rlc3Ryb3llZCA9IGZhbHNlO1xuXG4gIC8qKiBPYnNlcnZhYmxlIHRoYXQgZW1pdHMgd2hlbmV2ZXIgdGhlIHRlc3QgdGFzayBzdGF0ZSBjaGFuZ2VzLiAqL1xuICBwcml2YXRlIF90YXNrU3RhdGU6IE9ic2VydmFibGU8VGFza1N0YXRlPjtcblxuICBwcm90ZWN0ZWQgY29uc3RydWN0b3IocmF3Um9vdEVsZW1lbnQ6IEVsZW1lbnQsIHByaXZhdGUgX2ZpeHR1cmU6IENvbXBvbmVudEZpeHR1cmU8dW5rbm93bj4pIHtcbiAgICBzdXBlcihyYXdSb290RWxlbWVudCk7XG4gICAgdGhpcy5fdGFza1N0YXRlID0gVGFza1N0YXRlWm9uZUludGVyY2VwdG9yLnNldHVwKCk7XG4gICAgX2ZpeHR1cmUuY29tcG9uZW50UmVmLm9uRGVzdHJveSgoKSA9PiB0aGlzLl9kZXN0cm95ZWQgPSB0cnVlKTtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgYEhhcm5lc3NMb2FkZXJgIHJvb3RlZCBhdCB0aGUgZ2l2ZW4gZml4dHVyZSdzIHJvb3QgZWxlbWVudC4gKi9cbiAgc3RhdGljIGxvYWRlcihmaXh0dXJlOiBDb21wb25lbnRGaXh0dXJlPHVua25vd24+KTogSGFybmVzc0xvYWRlciB7XG4gICAgcmV0dXJuIG5ldyBUZXN0YmVkSGFybmVzc0Vudmlyb25tZW50KGZpeHR1cmUubmF0aXZlRWxlbWVudCwgZml4dHVyZSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGBIYXJuZXNzTG9hZGVyYCBhdCB0aGUgZG9jdW1lbnQgcm9vdC4gVGhpcyBjYW4gYmUgdXNlZCBpZiBoYXJuZXNzZXMgYXJlXG4gICAqIGxvY2F0ZWQgb3V0c2lkZSBvZiBhIGZpeHR1cmUgKGUuZy4gb3ZlcmxheXMgYXBwZW5kZWQgdG8gdGhlIGRvY3VtZW50IGJvZHkpLlxuICAgKi9cbiAgc3RhdGljIGRvY3VtZW50Um9vdExvYWRlcihmaXh0dXJlOiBDb21wb25lbnRGaXh0dXJlPHVua25vd24+KTogSGFybmVzc0xvYWRlciB7XG4gICAgcmV0dXJuIG5ldyBUZXN0YmVkSGFybmVzc0Vudmlyb25tZW50KGRvY3VtZW50LmJvZHksIGZpeHR1cmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgdGhlIGdpdmVuIGhhcm5lc3MgdHlwZSwgdXNpbmcgdGhlIGZpeHR1cmUncyByb290IGVsZW1lbnQgYXMgdGhlXG4gICAqIGhhcm5lc3MncyBob3N0IGVsZW1lbnQuIFRoaXMgbWV0aG9kIHNob3VsZCBiZSB1c2VkIHdoZW4gY3JlYXRpbmcgYSBoYXJuZXNzIGZvciB0aGUgcm9vdCBlbGVtZW50XG4gICAqIG9mIGEgZml4dHVyZSwgYXMgY29tcG9uZW50cyBkbyBub3QgaGF2ZSB0aGUgY29ycmVjdCBzZWxlY3RvciB3aGVuIHRoZXkgYXJlIGNyZWF0ZWQgYXMgdGhlIHJvb3RcbiAgICogb2YgdGhlIGZpeHR1cmUuXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgaGFybmVzc0ZvckZpeHR1cmU8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+KFxuICAgICAgZml4dHVyZTogQ29tcG9uZW50Rml4dHVyZTx1bmtub3duPiwgaGFybmVzc1R5cGU6IENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcjxUPik6IFByb21pc2U8VD4ge1xuICAgIGNvbnN0IGVudmlyb25tZW50ID0gbmV3IFRlc3RiZWRIYXJuZXNzRW52aXJvbm1lbnQoZml4dHVyZS5uYXRpdmVFbGVtZW50LCBmaXh0dXJlKTtcbiAgICBhd2FpdCBlbnZpcm9ubWVudC5mb3JjZVN0YWJpbGl6ZSgpO1xuICAgIHJldHVybiBlbnZpcm9ubWVudC5jcmVhdGVDb21wb25lbnRIYXJuZXNzKGhhcm5lc3NUeXBlLCBmaXh0dXJlLm5hdGl2ZUVsZW1lbnQpO1xuICB9XG5cbiAgYXN5bmMgZm9yY2VTdGFiaWxpemUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuX2Rlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgRXJyb3IoJ0hhcm5lc3MgaXMgYXR0ZW1wdGluZyB0byB1c2UgYSBmaXh0dXJlIHRoYXQgaGFzIGFscmVhZHkgYmVlbiBkZXN0cm95ZWQuJyk7XG4gICAgfVxuXG4gICAgdGhpcy5fZml4dHVyZS5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgYXdhaXQgdGhpcy5fZml4dHVyZS53aGVuU3RhYmxlKCk7XG4gIH1cblxuICBhc3luYyB3YWl0Rm9yVGFza3NPdXRzaWRlQW5ndWxhcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyBJZiB3ZSBydW4gaW4gdGhlIGZha2UgYXN5bmMgem9uZSwgd2UgcnVuIFwiZmx1c2hcIiB0byBydW4gYW55IHNjaGVkdWxlZCB0YXNrcy4gVGhpc1xuICAgIC8vIGVuc3VyZXMgdGhhdCB0aGUgaGFybmVzc2VzIGJlaGF2ZSBpbnNpZGUgb2YgdGhlIEZha2VBc3luY1Rlc3Rab25lIHNpbWlsYXIgdG8gdGhlXG4gICAgLy8gXCJBc3luY1Rlc3Rab25lXCIgYW5kIHRoZSByb290IHpvbmUgKGkuZS4gbmVpdGhlciBmYWtlQXN5bmMgb3IgYXN5bmMpLiBOb3RlIHRoYXQgd2VcbiAgICAvLyBjYW5ub3QganVzdCByZWx5IG9uIHRoZSB0YXNrIHN0YXRlIG9ic2VydmFibGUgdG8gYmVjb21lIHN0YWJsZSBiZWNhdXNlIHRoZSBzdGF0ZSB3aWxsXG4gICAgLy8gbmV2ZXIgY2hhbmdlLiBUaGlzIGlzIGJlY2F1c2UgdGhlIHRhc2sgcXVldWUgd2lsbCBiZSBvbmx5IGRyYWluZWQgaWYgdGhlIGZha2UgYXN5bmNcbiAgICAvLyB6b25lIGlzIGJlaW5nIGZsdXNoZWQuXG4gICAgaWYgKFpvbmUhLmN1cnJlbnQuZ2V0KCdGYWtlQXN5bmNUZXN0Wm9uZVNwZWMnKSkge1xuICAgICAgZmx1c2goKTtcbiAgICB9XG5cbiAgICAvLyBXYWl0IHVudGlsIHRoZSB0YXNrIHF1ZXVlIGhhcyBiZWVuIGRyYWluZWQgYW5kIHRoZSB6b25lIGlzIHN0YWJsZS4gTm90ZSB0aGF0XG4gICAgLy8gd2UgY2Fubm90IHJlbHkgb24gXCJmaXh0dXJlLndoZW5TdGFibGVcIiBzaW5jZSBpdCBkb2VzIG5vdCBjYXRjaCB0YXNrcyBzY2hlZHVsZWRcbiAgICAvLyBvdXRzaWRlIG9mIHRoZSBBbmd1bGFyIHpvbmUuIEZvciB0ZXN0IGhhcm5lc3Nlcywgd2Ugd2FudCB0byBlbnN1cmUgdGhhdCB0aGVcbiAgICAvLyBhcHAgaXMgZnVsbHkgc3RhYmlsaXplZCBhbmQgdGhlcmVmb3JlIG5lZWQgdG8gdXNlIG91ciBvd24gem9uZSBpbnRlcmNlcHRvci5cbiAgICBhd2FpdCB0aGlzLl90YXNrU3RhdGUucGlwZSh0YWtlV2hpbGUoc3RhdGUgPT4gIXN0YXRlLnN0YWJsZSkpLnRvUHJvbWlzZSgpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGdldERvY3VtZW50Um9vdCgpOiBFbGVtZW50IHtcbiAgICByZXR1cm4gZG9jdW1lbnQuYm9keTtcbiAgfVxuXG4gIHByb3RlY3RlZCBjcmVhdGVUZXN0RWxlbWVudChlbGVtZW50OiBFbGVtZW50KTogVGVzdEVsZW1lbnQge1xuICAgIHJldHVybiBuZXcgVW5pdFRlc3RFbGVtZW50KGVsZW1lbnQsICgpID0+IHRoaXMuZm9yY2VTdGFiaWxpemUoKSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgY3JlYXRlRW52aXJvbm1lbnQoZWxlbWVudDogRWxlbWVudCk6IEhhcm5lc3NFbnZpcm9ubWVudDxFbGVtZW50PiB7XG4gICAgcmV0dXJuIG5ldyBUZXN0YmVkSGFybmVzc0Vudmlyb25tZW50KGVsZW1lbnQsIHRoaXMuX2ZpeHR1cmUpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIGdldEFsbFJhd0VsZW1lbnRzKHNlbGVjdG9yOiBzdHJpbmcpOiBQcm9taXNlPEVsZW1lbnRbXT4ge1xuICAgIGF3YWl0IHRoaXMuZm9yY2VTdGFiaWxpemUoKTtcbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLnJhd1Jvb3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKTtcbiAgfVxufVxuIl19