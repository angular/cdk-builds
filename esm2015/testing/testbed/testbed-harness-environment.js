/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __awaiter } from "tslib";
import { HarnessEnvironment } from '@angular/cdk/testing';
import { flush } from '@angular/core/testing';
import { takeWhile } from 'rxjs/operators';
import { TaskStateZoneInterceptor } from './task-state-zone-interceptor';
import { UnitTestElement } from './unit-test-element';
/** A `HarnessEnvironment` implementation for Angular's Testbed. */
export class TestbedHarnessEnvironment extends HarnessEnvironment {
    constructor(rawRootElement, _fixture) {
        super(rawRootElement);
        this._fixture = _fixture;
        this._destroyed = false;
        this._taskState = TaskStateZoneInterceptor.setup();
        _fixture.componentRef.onDestroy(() => this._destroyed = true);
    }
    /** Creates a `HarnessLoader` rooted at the given fixture's root element. */
    static loader(fixture) {
        return new TestbedHarnessEnvironment(fixture.nativeElement, fixture);
    }
    /**
     * Creates a `HarnessLoader` at the document root. This can be used if harnesses are
     * located outside of a fixture (e.g. overlays appended to the document body).
     */
    static documentRootLoader(fixture) {
        return new TestbedHarnessEnvironment(document.body, fixture);
    }
    /**
     * Creates an instance of the given harness type, using the fixture's root element as the
     * harness's host element. This method should be used when creating a harness for the root element
     * of a fixture, as components do not have the correct selector when they are created as the root
     * of the fixture.
     */
    static harnessForFixture(fixture, harnessType) {
        return __awaiter(this, void 0, void 0, function* () {
            const environment = new TestbedHarnessEnvironment(fixture.nativeElement, fixture);
            yield environment.forceStabilize();
            return environment.createComponentHarness(harnessType, fixture.nativeElement);
        });
    }
    forceStabilize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._destroyed) {
                throw Error('Harness is attempting to use a fixture that has already been destroyed.');
            }
            this._fixture.detectChanges();
            yield this._fixture.whenStable();
        });
    }
    waitForTasksOutsideAngular() {
        return __awaiter(this, void 0, void 0, function* () {
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
            yield this._taskState.pipe(takeWhile(state => !state.stable)).toPromise();
        });
    }
    getDocumentRoot() {
        return document.body;
    }
    createTestElement(element) {
        return new UnitTestElement(element, () => this.forceStabilize());
    }
    createEnvironment(element) {
        return new TestbedHarnessEnvironment(element, this._fixture);
    }
    getAllRawElements(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.forceStabilize();
            return Array.from(this.rawRootElement.querySelectorAll(selector));
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGJlZC1oYXJuZXNzLWVudmlyb25tZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Rlc3RiZWQvdGVzdGJlZC1oYXJuZXNzLWVudmlyb25tZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBR0wsa0JBQWtCLEVBR25CLE1BQU0sc0JBQXNCLENBQUM7QUFDOUIsT0FBTyxFQUFtQixLQUFLLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUU5RCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDekMsT0FBTyxFQUFZLHdCQUF3QixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDbEYsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBR3BELG1FQUFtRTtBQUNuRSxNQUFNLE9BQU8seUJBQTBCLFNBQVEsa0JBQTJCO0lBTXhFLFlBQXNCLGNBQXVCLEVBQVUsUUFBbUM7UUFDeEYsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBRCtCLGFBQVEsR0FBUixRQUFRLENBQTJCO1FBTGxGLGVBQVUsR0FBRyxLQUFLLENBQUM7UUFPekIsSUFBSSxDQUFDLFVBQVUsR0FBRyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNuRCxRQUFRLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxDQUFDO0lBQ2hFLENBQUM7SUFFRCw0RUFBNEU7SUFDNUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFrQztRQUM5QyxPQUFPLElBQUkseUJBQXlCLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUN2RSxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsTUFBTSxDQUFDLGtCQUFrQixDQUFDLE9BQWtDO1FBQzFELE9BQU8sSUFBSSx5QkFBeUIsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILE1BQU0sQ0FBTyxpQkFBaUIsQ0FDMUIsT0FBa0MsRUFBRSxXQUEyQzs7WUFDakYsTUFBTSxXQUFXLEdBQUcsSUFBSSx5QkFBeUIsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sV0FBVyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ25DLE9BQU8sV0FBVyxDQUFDLHNCQUFzQixDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDaEYsQ0FBQztLQUFBO0lBRUssY0FBYzs7WUFDbEIsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO2dCQUNuQixNQUFNLEtBQUssQ0FBQyx5RUFBeUUsQ0FBQyxDQUFDO2FBQ3hGO1lBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUM5QixNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDbkMsQ0FBQztLQUFBO0lBRUssMEJBQTBCOztZQUM5QixvRkFBb0Y7WUFDcEYsbUZBQW1GO1lBQ25GLG9GQUFvRjtZQUNwRix3RkFBd0Y7WUFDeEYsc0ZBQXNGO1lBQ3RGLHlCQUF5QjtZQUN6QixJQUFJLElBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLEVBQUU7Z0JBQzlDLEtBQUssRUFBRSxDQUFDO2FBQ1Q7WUFFRCwrRUFBK0U7WUFDL0UsaUZBQWlGO1lBQ2pGLDhFQUE4RTtZQUM5RSw4RUFBOEU7WUFDOUUsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQzVFLENBQUM7S0FBQTtJQUVTLGVBQWU7UUFDdkIsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDO0lBQ3ZCLENBQUM7SUFFUyxpQkFBaUIsQ0FBQyxPQUFnQjtRQUMxQyxPQUFPLElBQUksZUFBZSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQztJQUNuRSxDQUFDO0lBRVMsaUJBQWlCLENBQUMsT0FBZ0I7UUFDMUMsT0FBTyxJQUFJLHlCQUF5QixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDL0QsQ0FBQztJQUVlLGlCQUFpQixDQUFDLFFBQWdCOztZQUNoRCxNQUFNLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUM1QixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ3BFLENBQUM7S0FBQTtDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIENvbXBvbmVudEhhcm5lc3MsXG4gIENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcixcbiAgSGFybmVzc0Vudmlyb25tZW50LFxuICBIYXJuZXNzTG9hZGVyLFxuICBUZXN0RWxlbWVudFxufSBmcm9tICdAYW5ndWxhci9jZGsvdGVzdGluZyc7XG5pbXBvcnQge0NvbXBvbmVudEZpeHR1cmUsIGZsdXNofSBmcm9tICdAYW5ndWxhci9jb3JlL3Rlc3RpbmcnO1xuaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tICdyeGpzJztcbmltcG9ydCB7dGFrZVdoaWxlfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge1Rhc2tTdGF0ZSwgVGFza1N0YXRlWm9uZUludGVyY2VwdG9yfSBmcm9tICcuL3Rhc2stc3RhdGUtem9uZS1pbnRlcmNlcHRvcic7XG5pbXBvcnQge1VuaXRUZXN0RWxlbWVudH0gZnJvbSAnLi91bml0LXRlc3QtZWxlbWVudCc7XG5cblxuLyoqIEEgYEhhcm5lc3NFbnZpcm9ubWVudGAgaW1wbGVtZW50YXRpb24gZm9yIEFuZ3VsYXIncyBUZXN0YmVkLiAqL1xuZXhwb3J0IGNsYXNzIFRlc3RiZWRIYXJuZXNzRW52aXJvbm1lbnQgZXh0ZW5kcyBIYXJuZXNzRW52aXJvbm1lbnQ8RWxlbWVudD4ge1xuICBwcml2YXRlIF9kZXN0cm95ZWQgPSBmYWxzZTtcblxuICAvKiogT2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHdoZW5ldmVyIHRoZSB0ZXN0IHRhc2sgc3RhdGUgY2hhbmdlcy4gKi9cbiAgcHJpdmF0ZSBfdGFza1N0YXRlOiBPYnNlcnZhYmxlPFRhc2tTdGF0ZT47XG5cbiAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKHJhd1Jvb3RFbGVtZW50OiBFbGVtZW50LCBwcml2YXRlIF9maXh0dXJlOiBDb21wb25lbnRGaXh0dXJlPHVua25vd24+KSB7XG4gICAgc3VwZXIocmF3Um9vdEVsZW1lbnQpO1xuICAgIHRoaXMuX3Rhc2tTdGF0ZSA9IFRhc2tTdGF0ZVpvbmVJbnRlcmNlcHRvci5zZXR1cCgpO1xuICAgIF9maXh0dXJlLmNvbXBvbmVudFJlZi5vbkRlc3Ryb3koKCkgPT4gdGhpcy5fZGVzdHJveWVkID0gdHJ1ZSk7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIGBIYXJuZXNzTG9hZGVyYCByb290ZWQgYXQgdGhlIGdpdmVuIGZpeHR1cmUncyByb290IGVsZW1lbnQuICovXG4gIHN0YXRpYyBsb2FkZXIoZml4dHVyZTogQ29tcG9uZW50Rml4dHVyZTx1bmtub3duPik6IEhhcm5lc3NMb2FkZXIge1xuICAgIHJldHVybiBuZXcgVGVzdGJlZEhhcm5lc3NFbnZpcm9ubWVudChmaXh0dXJlLm5hdGl2ZUVsZW1lbnQsIGZpeHR1cmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBgSGFybmVzc0xvYWRlcmAgYXQgdGhlIGRvY3VtZW50IHJvb3QuIFRoaXMgY2FuIGJlIHVzZWQgaWYgaGFybmVzc2VzIGFyZVxuICAgKiBsb2NhdGVkIG91dHNpZGUgb2YgYSBmaXh0dXJlIChlLmcuIG92ZXJsYXlzIGFwcGVuZGVkIHRvIHRoZSBkb2N1bWVudCBib2R5KS5cbiAgICovXG4gIHN0YXRpYyBkb2N1bWVudFJvb3RMb2FkZXIoZml4dHVyZTogQ29tcG9uZW50Rml4dHVyZTx1bmtub3duPik6IEhhcm5lc3NMb2FkZXIge1xuICAgIHJldHVybiBuZXcgVGVzdGJlZEhhcm5lc3NFbnZpcm9ubWVudChkb2N1bWVudC5ib2R5LCBmaXh0dXJlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIHRoZSBnaXZlbiBoYXJuZXNzIHR5cGUsIHVzaW5nIHRoZSBmaXh0dXJlJ3Mgcm9vdCBlbGVtZW50IGFzIHRoZVxuICAgKiBoYXJuZXNzJ3MgaG9zdCBlbGVtZW50LiBUaGlzIG1ldGhvZCBzaG91bGQgYmUgdXNlZCB3aGVuIGNyZWF0aW5nIGEgaGFybmVzcyBmb3IgdGhlIHJvb3QgZWxlbWVudFxuICAgKiBvZiBhIGZpeHR1cmUsIGFzIGNvbXBvbmVudHMgZG8gbm90IGhhdmUgdGhlIGNvcnJlY3Qgc2VsZWN0b3Igd2hlbiB0aGV5IGFyZSBjcmVhdGVkIGFzIHRoZSByb290XG4gICAqIG9mIHRoZSBmaXh0dXJlLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGhhcm5lc3NGb3JGaXh0dXJlPFQgZXh0ZW5kcyBDb21wb25lbnRIYXJuZXNzPihcbiAgICAgIGZpeHR1cmU6IENvbXBvbmVudEZpeHR1cmU8dW5rbm93bj4sIGhhcm5lc3NUeXBlOiBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8VD4pOiBQcm9taXNlPFQ+IHtcbiAgICBjb25zdCBlbnZpcm9ubWVudCA9IG5ldyBUZXN0YmVkSGFybmVzc0Vudmlyb25tZW50KGZpeHR1cmUubmF0aXZlRWxlbWVudCwgZml4dHVyZSk7XG4gICAgYXdhaXQgZW52aXJvbm1lbnQuZm9yY2VTdGFiaWxpemUoKTtcbiAgICByZXR1cm4gZW52aXJvbm1lbnQuY3JlYXRlQ29tcG9uZW50SGFybmVzcyhoYXJuZXNzVHlwZSwgZml4dHVyZS5uYXRpdmVFbGVtZW50KTtcbiAgfVxuXG4gIGFzeW5jIGZvcmNlU3RhYmlsaXplKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLl9kZXN0cm95ZWQpIHtcbiAgICAgIHRocm93IEVycm9yKCdIYXJuZXNzIGlzIGF0dGVtcHRpbmcgdG8gdXNlIGEgZml4dHVyZSB0aGF0IGhhcyBhbHJlYWR5IGJlZW4gZGVzdHJveWVkLicpO1xuICAgIH1cblxuICAgIHRoaXMuX2ZpeHR1cmUuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIGF3YWl0IHRoaXMuX2ZpeHR1cmUud2hlblN0YWJsZSgpO1xuICB9XG5cbiAgYXN5bmMgd2FpdEZvclRhc2tzT3V0c2lkZUFuZ3VsYXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gSWYgd2UgcnVuIGluIHRoZSBmYWtlIGFzeW5jIHpvbmUsIHdlIHJ1biBcImZsdXNoXCIgdG8gcnVuIGFueSBzY2hlZHVsZWQgdGFza3MuIFRoaXNcbiAgICAvLyBlbnN1cmVzIHRoYXQgdGhlIGhhcm5lc3NlcyBiZWhhdmUgaW5zaWRlIG9mIHRoZSBGYWtlQXN5bmNUZXN0Wm9uZSBzaW1pbGFyIHRvIHRoZVxuICAgIC8vIFwiQXN5bmNUZXN0Wm9uZVwiIGFuZCB0aGUgcm9vdCB6b25lIChpLmUuIG5laXRoZXIgZmFrZUFzeW5jIG9yIGFzeW5jKS4gTm90ZSB0aGF0IHdlXG4gICAgLy8gY2Fubm90IGp1c3QgcmVseSBvbiB0aGUgdGFzayBzdGF0ZSBvYnNlcnZhYmxlIHRvIGJlY29tZSBzdGFibGUgYmVjYXVzZSB0aGUgc3RhdGUgd2lsbFxuICAgIC8vIG5ldmVyIGNoYW5nZS4gVGhpcyBpcyBiZWNhdXNlIHRoZSB0YXNrIHF1ZXVlIHdpbGwgYmUgb25seSBkcmFpbmVkIGlmIHRoZSBmYWtlIGFzeW5jXG4gICAgLy8gem9uZSBpcyBiZWluZyBmbHVzaGVkLlxuICAgIGlmIChab25lIS5jdXJyZW50LmdldCgnRmFrZUFzeW5jVGVzdFpvbmVTcGVjJykpIHtcbiAgICAgIGZsdXNoKCk7XG4gICAgfVxuXG4gICAgLy8gV2FpdCB1bnRpbCB0aGUgdGFzayBxdWV1ZSBoYXMgYmVlbiBkcmFpbmVkIGFuZCB0aGUgem9uZSBpcyBzdGFibGUuIE5vdGUgdGhhdFxuICAgIC8vIHdlIGNhbm5vdCByZWx5IG9uIFwiZml4dHVyZS53aGVuU3RhYmxlXCIgc2luY2UgaXQgZG9lcyBub3QgY2F0Y2ggdGFza3Mgc2NoZWR1bGVkXG4gICAgLy8gb3V0c2lkZSBvZiB0aGUgQW5ndWxhciB6b25lLiBGb3IgdGVzdCBoYXJuZXNzZXMsIHdlIHdhbnQgdG8gZW5zdXJlIHRoYXQgdGhlXG4gICAgLy8gYXBwIGlzIGZ1bGx5IHN0YWJpbGl6ZWQgYW5kIHRoZXJlZm9yZSBuZWVkIHRvIHVzZSBvdXIgb3duIHpvbmUgaW50ZXJjZXB0b3IuXG4gICAgYXdhaXQgdGhpcy5fdGFza1N0YXRlLnBpcGUodGFrZVdoaWxlKHN0YXRlID0+ICFzdGF0ZS5zdGFibGUpKS50b1Byb21pc2UoKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBnZXREb2N1bWVudFJvb3QoKTogRWxlbWVudCB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmJvZHk7XG4gIH1cblxuICBwcm90ZWN0ZWQgY3JlYXRlVGVzdEVsZW1lbnQoZWxlbWVudDogRWxlbWVudCk6IFRlc3RFbGVtZW50IHtcbiAgICByZXR1cm4gbmV3IFVuaXRUZXN0RWxlbWVudChlbGVtZW50LCAoKSA9PiB0aGlzLmZvcmNlU3RhYmlsaXplKCkpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGNyZWF0ZUVudmlyb25tZW50KGVsZW1lbnQ6IEVsZW1lbnQpOiBIYXJuZXNzRW52aXJvbm1lbnQ8RWxlbWVudD4ge1xuICAgIHJldHVybiBuZXcgVGVzdGJlZEhhcm5lc3NFbnZpcm9ubWVudChlbGVtZW50LCB0aGlzLl9maXh0dXJlKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBnZXRBbGxSYXdFbGVtZW50cyhzZWxlY3Rvcjogc3RyaW5nKTogUHJvbWlzZTxFbGVtZW50W10+IHtcbiAgICBhd2FpdCB0aGlzLmZvcmNlU3RhYmlsaXplKCk7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5yYXdSb290RWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSk7XG4gIH1cbn1cbiJdfQ==