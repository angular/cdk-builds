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
/** The default environment options. */
const defaultEnvironmentOptions = {
    queryFn: (selector, root) => root.querySelectorAll(selector)
};
/** A `HarnessEnvironment` implementation for Angular's Testbed. */
export class TestbedHarnessEnvironment extends HarnessEnvironment {
    constructor(rawRootElement, _fixture, options) {
        super(rawRootElement);
        this._fixture = _fixture;
        /** Whether the environment has been destroyed. */
        this._destroyed = false;
        this._options = Object.assign(Object.assign({}, defaultEnvironmentOptions), options);
        this._taskState = TaskStateZoneInterceptor.setup();
        _fixture.componentRef.onDestroy(() => this._destroyed = true);
    }
    /** Creates a `HarnessLoader` rooted at the given fixture's root element. */
    static loader(fixture, options) {
        return new TestbedHarnessEnvironment(fixture.nativeElement, fixture, options);
    }
    /**
     * Creates a `HarnessLoader` at the document root. This can be used if harnesses are
     * located outside of a fixture (e.g. overlays appended to the document body).
     */
    static documentRootLoader(fixture, options) {
        return new TestbedHarnessEnvironment(document.body, fixture, options);
    }
    /** Gets the native DOM element corresponding to the given TestElement. */
    static getNativeElement(el) {
        if (el instanceof UnitTestElement) {
            return el.element;
        }
        throw Error('This TestElement was not created by the TestbedHarnessEnvironment');
    }
    /**
     * Creates an instance of the given harness type, using the fixture's root element as the
     * harness's host element. This method should be used when creating a harness for the root element
     * of a fixture, as components do not have the correct selector when they are created as the root
     * of the fixture.
     */
    static harnessForFixture(fixture, harnessType, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const environment = new TestbedHarnessEnvironment(fixture.nativeElement, fixture, options);
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
        return new TestbedHarnessEnvironment(element, this._fixture, this._options);
    }
    getAllRawElements(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.forceStabilize();
            return Array.from(this._options.queryFn(selector, this.rawRootElement));
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGJlZC1oYXJuZXNzLWVudmlyb25tZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Rlc3RiZWQvdGVzdGJlZC1oYXJuZXNzLWVudmlyb25tZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBR0wsa0JBQWtCLEVBR25CLE1BQU0sc0JBQXNCLENBQUM7QUFDOUIsT0FBTyxFQUFtQixLQUFLLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUU5RCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDekMsT0FBTyxFQUFZLHdCQUF3QixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDbEYsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBUXBELHVDQUF1QztBQUN2QyxNQUFNLHlCQUF5QixHQUFxQztJQUNsRSxPQUFPLEVBQUUsQ0FBQyxRQUFnQixFQUFFLElBQWEsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQztDQUM5RSxDQUFDO0FBRUYsbUVBQW1FO0FBQ25FLE1BQU0sT0FBTyx5QkFBMEIsU0FBUSxrQkFBMkI7SUFVeEUsWUFBc0IsY0FBdUIsRUFBVSxRQUFtQyxFQUN0RixPQUEwQztRQUM1QyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7UUFGK0IsYUFBUSxHQUFSLFFBQVEsQ0FBMkI7UUFUMUYsa0RBQWtEO1FBQzFDLGVBQVUsR0FBRyxLQUFLLENBQUM7UUFXekIsSUFBSSxDQUFDLFFBQVEsbUNBQU8seUJBQXlCLEdBQUssT0FBTyxDQUFDLENBQUM7UUFDM0QsSUFBSSxDQUFDLFVBQVUsR0FBRyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNuRCxRQUFRLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENB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KiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIENvbXBvbmVudEhhcm5lc3MsXG4gIENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcixcbiAgSGFybmVzc0Vudmlyb25tZW50LFxuICBIYXJuZXNzTG9hZGVyLFxuICBUZXN0RWxlbWVudFxufSBmcm9tICdAYW5ndWxhci9jZGsvdGVzdGluZyc7XG5pbXBvcnQge0NvbXBvbmVudEZpeHR1cmUsIGZsdXNofSBmcm9tICdAYW5ndWxhci9jb3JlL3Rlc3RpbmcnO1xuaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tICdyeGpzJztcbmltcG9ydCB7dGFrZVdoaWxlfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge1Rhc2tTdGF0ZSwgVGFza1N0YXRlWm9uZUludGVyY2VwdG9yfSBmcm9tICcuL3Rhc2stc3RhdGUtem9uZS1pbnRlcmNlcHRvcic7XG5pbXBvcnQge1VuaXRUZXN0RWxlbWVudH0gZnJvbSAnLi91bml0LXRlc3QtZWxlbWVudCc7XG5cbi8qKiBPcHRpb25zIHRvIGNvbmZpZ3VyZSB0aGUgZW52aXJvbm1lbnQuICovXG5leHBvcnQgaW50ZXJmYWNlIFRlc3RiZWRIYXJuZXNzRW52aXJvbm1lbnRPcHRpb25zIHtcbiAgLyoqIFRoZSBxdWVyeSBmdW5jdGlvbiB1c2VkIHRvIGZpbmQgRE9NIGVsZW1lbnRzLiAqL1xuICBxdWVyeUZuOiAoc2VsZWN0b3I6IHN0cmluZywgcm9vdDogRWxlbWVudCkgPT4gSXRlcmFibGU8RWxlbWVudD4gfCBBcnJheUxpa2U8RWxlbWVudD47XG59XG5cbi8qKiBUaGUgZGVmYXVsdCBlbnZpcm9ubWVudCBvcHRpb25zLiAqL1xuY29uc3QgZGVmYXVsdEVudmlyb25tZW50T3B0aW9uczogVGVzdGJlZEhhcm5lc3NFbnZpcm9ubWVudE9wdGlvbnMgPSB7XG4gIHF1ZXJ5Rm46IChzZWxlY3Rvcjogc3RyaW5nLCByb290OiBFbGVtZW50KSA9PiByb290LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpXG59O1xuXG4vKiogQSBgSGFybmVzc0Vudmlyb25tZW50YCBpbXBsZW1lbnRhdGlvbiBmb3IgQW5ndWxhcidzIFRlc3RiZWQuICovXG5leHBvcnQgY2xhc3MgVGVzdGJlZEhhcm5lc3NFbnZpcm9ubWVudCBleHRlbmRzIEhhcm5lc3NFbnZpcm9ubWVudDxFbGVtZW50PiB7XG4gIC8qKiBXaGV0aGVyIHRoZSBlbnZpcm9ubWVudCBoYXMgYmVlbiBkZXN0cm95ZWQuICovXG4gIHByaXZhdGUgX2Rlc3Ryb3llZCA9IGZhbHNlO1xuXG4gIC8qKiBPYnNlcnZhYmxlIHRoYXQgZW1pdHMgd2hlbmV2ZXIgdGhlIHRlc3QgdGFzayBzdGF0ZSBjaGFuZ2VzLiAqL1xuICBwcml2YXRlIF90YXNrU3RhdGU6IE9ic2VydmFibGU8VGFza1N0YXRlPjtcblxuICAvKiogVGhlIG9wdGlvbnMgZm9yIHRoaXMgZW52aXJvbm1lbnQuICovXG4gIHByaXZhdGUgX29wdGlvbnM6IFRlc3RiZWRIYXJuZXNzRW52aXJvbm1lbnRPcHRpb25zO1xuXG4gIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihyYXdSb290RWxlbWVudDogRWxlbWVudCwgcHJpdmF0ZSBfZml4dHVyZTogQ29tcG9uZW50Rml4dHVyZTx1bmtub3duPixcbiAgICAgIG9wdGlvbnM/OiBUZXN0YmVkSGFybmVzc0Vudmlyb25tZW50T3B0aW9ucykge1xuICAgIHN1cGVyKHJhd1Jvb3RFbGVtZW50KTtcbiAgICB0aGlzLl9vcHRpb25zID0gey4uLmRlZmF1bHRFbnZpcm9ubWVudE9wdGlvbnMsIC4uLm9wdGlvbnN9O1xuICAgIHRoaXMuX3Rhc2tTdGF0ZSA9IFRhc2tTdGF0ZVpvbmVJbnRlcmNlcHRvci5zZXR1cCgpO1xuICAgIF9maXh0dXJlLmNvbXBvbmVudFJlZi5vbkRlc3Ryb3koKCkgPT4gdGhpcy5fZGVzdHJveWVkID0gdHJ1ZSk7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIGBIYXJuZXNzTG9hZGVyYCByb290ZWQgYXQgdGhlIGdpdmVuIGZpeHR1cmUncyByb290IGVsZW1lbnQuICovXG4gIHN0YXRpYyBsb2FkZXIoZml4dHVyZTogQ29tcG9uZW50Rml4dHVyZTx1bmtub3duPiwgb3B0aW9ucz86IFRlc3RiZWRIYXJuZXNzRW52aXJvbm1lbnRPcHRpb25zKTpcbiAgICAgIEhhcm5lc3NMb2FkZXIge1xuICAgIHJldHVybiBuZXcgVGVzdGJlZEhhcm5lc3NFbnZpcm9ubWVudChmaXh0dXJlLm5hdGl2ZUVsZW1lbnQsIGZpeHR1cmUsIG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBgSGFybmVzc0xvYWRlcmAgYXQgdGhlIGRvY3VtZW50IHJvb3QuIFRoaXMgY2FuIGJlIHVzZWQgaWYgaGFybmVzc2VzIGFyZVxuICAgKiBsb2NhdGVkIG91dHNpZGUgb2YgYSBmaXh0dXJlIChlLmcuIG92ZXJsYXlzIGFwcGVuZGVkIHRvIHRoZSBkb2N1bWVudCBib2R5KS5cbiAgICovXG4gIHN0YXRpYyBkb2N1bWVudFJvb3RMb2FkZXIoZml4dHVyZTogQ29tcG9uZW50Rml4dHVyZTx1bmtub3duPixcbiAgICAgIG9wdGlvbnM/OiBUZXN0YmVkSGFybmVzc0Vudmlyb25tZW50T3B0aW9ucyk6IEhhcm5lc3NMb2FkZXIge1xuICAgIHJldHVybiBuZXcgVGVzdGJlZEhhcm5lc3NFbnZpcm9ubWVudChkb2N1bWVudC5ib2R5LCBmaXh0dXJlLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBuYXRpdmUgRE9NIGVsZW1lbnQgY29ycmVzcG9uZGluZyB0byB0aGUgZ2l2ZW4gVGVzdEVsZW1lbnQuICovXG4gIHN0YXRpYyBnZXROYXRpdmVFbGVtZW50KGVsOiBUZXN0RWxlbWVudCk6IEVsZW1lbnQge1xuICAgIGlmIChlbCBpbnN0YW5jZW9mIFVuaXRUZXN0RWxlbWVudCkge1xuICAgICAgcmV0dXJuIGVsLmVsZW1lbnQ7XG4gICAgfVxuICAgIHRocm93IEVycm9yKCdUaGlzIFRlc3RFbGVtZW50IHdhcyBub3QgY3JlYXRlZCBieSB0aGUgVGVzdGJlZEhhcm5lc3NFbnZpcm9ubWVudCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgdGhlIGdpdmVuIGhhcm5lc3MgdHlwZSwgdXNpbmcgdGhlIGZpeHR1cmUncyByb290IGVsZW1lbnQgYXMgdGhlXG4gICAqIGhhcm5lc3MncyBob3N0IGVsZW1lbnQuIFRoaXMgbWV0aG9kIHNob3VsZCBiZSB1c2VkIHdoZW4gY3JlYXRpbmcgYSBoYXJuZXNzIGZvciB0aGUgcm9vdCBlbGVtZW50XG4gICAqIG9mIGEgZml4dHVyZSwgYXMgY29tcG9uZW50cyBkbyBub3QgaGF2ZSB0aGUgY29ycmVjdCBzZWxlY3RvciB3aGVuIHRoZXkgYXJlIGNyZWF0ZWQgYXMgdGhlIHJvb3RcbiAgICogb2YgdGhlIGZpeHR1cmUuXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgaGFybmVzc0ZvckZpeHR1cmU8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+KFxuICAgICAgZml4dHVyZTogQ29tcG9uZW50Rml4dHVyZTx1bmtub3duPiwgaGFybmVzc1R5cGU6IENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcjxUPixcbiAgICAgIG9wdGlvbnM/OiBUZXN0YmVkSGFybmVzc0Vudmlyb25tZW50T3B0aW9ucyk6IFByb21pc2U8VD4ge1xuICAgIGNvbnN0IGVudmlyb25tZW50ID0gbmV3IFRlc3RiZWRIYXJuZXNzRW52aXJvbm1lbnQoZml4dHVyZS5uYXRpdmVFbGVtZW50LCBmaXh0dXJlLCBvcHRpb25zKTtcbiAgICBhd2FpdCBlbnZpcm9ubWVudC5mb3JjZVN0YWJpbGl6ZSgpO1xuICAgIHJldHVybiBlbnZpcm9ubWVudC5jcmVhdGVDb21wb25lbnRIYXJuZXNzKGhhcm5lc3NUeXBlLCBmaXh0dXJlLm5hdGl2ZUVsZW1lbnQpO1xuICB9XG5cbiAgYXN5bmMgZm9yY2VTdGFiaWxpemUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuX2Rlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgRXJyb3IoJ0hhcm5lc3MgaXMgYXR0ZW1wdGluZyB0byB1c2UgYSBmaXh0dXJlIHRoYXQgaGFzIGFscmVhZHkgYmVlbiBkZXN0cm95ZWQuJyk7XG4gICAgfVxuXG4gICAgdGhpcy5fZml4dHVyZS5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgYXdhaXQgdGhpcy5fZml4dHVyZS53aGVuU3RhYmxlKCk7XG4gIH1cblxuICBhc3luYyB3YWl0Rm9yVGFza3NPdXRzaWRlQW5ndWxhcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyBJZiB3ZSBydW4gaW4gdGhlIGZha2UgYXN5bmMgem9uZSwgd2UgcnVuIFwiZmx1c2hcIiB0byBydW4gYW55IHNjaGVkdWxlZCB0YXNrcy4gVGhpc1xuICAgIC8vIGVuc3VyZXMgdGhhdCB0aGUgaGFybmVzc2VzIGJlaGF2ZSBpbnNpZGUgb2YgdGhlIEZha2VBc3luY1Rlc3Rab25lIHNpbWlsYXIgdG8gdGhlXG4gICAgLy8gXCJBc3luY1Rlc3Rab25lXCIgYW5kIHRoZSByb290IHpvbmUgKGkuZS4gbmVpdGhlciBmYWtlQXN5bmMgb3IgYXN5bmMpLiBOb3RlIHRoYXQgd2VcbiAgICAvLyBjYW5ub3QganVzdCByZWx5IG9uIHRoZSB0YXNrIHN0YXRlIG9ic2VydmFibGUgdG8gYmVjb21lIHN0YWJsZSBiZWNhdXNlIHRoZSBzdGF0ZSB3aWxsXG4gICAgLy8gbmV2ZXIgY2hhbmdlLiBUaGlzIGlzIGJlY2F1c2UgdGhlIHRhc2sgcXVldWUgd2lsbCBiZSBvbmx5IGRyYWluZWQgaWYgdGhlIGZha2UgYXN5bmNcbiAgICAvLyB6b25lIGlzIGJlaW5nIGZsdXNoZWQuXG4gICAgaWYgKFpvbmUhLmN1cnJlbnQuZ2V0KCdGYWtlQXN5bmNUZXN0Wm9uZVNwZWMnKSkge1xuICAgICAgZmx1c2goKTtcbiAgICB9XG5cbiAgICAvLyBXYWl0IHVudGlsIHRoZSB0YXNrIHF1ZXVlIGhhcyBiZWVuIGRyYWluZWQgYW5kIHRoZSB6b25lIGlzIHN0YWJsZS4gTm90ZSB0aGF0XG4gICAgLy8gd2UgY2Fubm90IHJlbHkgb24gXCJmaXh0dXJlLndoZW5TdGFibGVcIiBzaW5jZSBpdCBkb2VzIG5vdCBjYXRjaCB0YXNrcyBzY2hlZHVsZWRcbiAgICAvLyBvdXRzaWRlIG9mIHRoZSBBbmd1bGFyIHpvbmUuIEZvciB0ZXN0IGhhcm5lc3Nlcywgd2Ugd2FudCB0byBlbnN1cmUgdGhhdCB0aGVcbiAgICAvLyBhcHAgaXMgZnVsbHkgc3RhYmlsaXplZCBhbmQgdGhlcmVmb3JlIG5lZWQgdG8gdXNlIG91ciBvd24gem9uZSBpbnRlcmNlcHRvci5cbiAgICBhd2FpdCB0aGlzLl90YXNrU3RhdGUucGlwZSh0YWtlV2hpbGUoc3RhdGUgPT4gIXN0YXRlLnN0YWJsZSkpLnRvUHJvbWlzZSgpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGdldERvY3VtZW50Um9vdCgpOiBFbGVtZW50IHtcbiAgICByZXR1cm4gZG9jdW1lbnQuYm9keTtcbiAgfVxuXG4gIHByb3RlY3RlZCBjcmVhdGVUZXN0RWxlbWVudChlbGVtZW50OiBFbGVtZW50KTogVGVzdEVsZW1lbnQge1xuICAgIHJldHVybiBuZXcgVW5pdFRlc3RFbGVtZW50KGVsZW1lbnQsICgpID0+IHRoaXMuZm9yY2VTdGFiaWxpemUoKSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgY3JlYXRlRW52aXJvbm1lbnQoZWxlbWVudDogRWxlbWVudCk6IEhhcm5lc3NFbnZpcm9ubWVudDxFbGVtZW50PiB7XG4gICAgcmV0dXJuIG5ldyBUZXN0YmVkSGFybmVzc0Vudmlyb25tZW50KGVsZW1lbnQsIHRoaXMuX2ZpeHR1cmUsIHRoaXMuX29wdGlvbnMpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIGdldEFsbFJhd0VsZW1lbnRzKHNlbGVjdG9yOiBzdHJpbmcpOiBQcm9taXNlPEVsZW1lbnRbXT4ge1xuICAgIGF3YWl0IHRoaXMuZm9yY2VTdGFiaWxpemUoKTtcbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLl9vcHRpb25zLnF1ZXJ5Rm4oc2VsZWN0b3IsIHRoaXMucmF3Um9vdEVsZW1lbnQpKTtcbiAgfVxufVxuIl19