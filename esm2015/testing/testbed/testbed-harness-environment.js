/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __awaiter } from "tslib";
import { handleAutoChangeDetectionStatus, HarnessEnvironment, stopHandlingAutoChangeDetectionStatus } from '@angular/cdk/testing';
import { flush } from '@angular/core/testing';
import { takeWhile } from 'rxjs/operators';
import { TaskStateZoneInterceptor } from './task-state-zone-interceptor';
import { UnitTestElement } from './unit-test-element';
/** The default environment options. */
const defaultEnvironmentOptions = {
    queryFn: (selector, root) => root.querySelectorAll(selector)
};
/** Whether auto change detection is currently disabled. */
let disableAutoChangeDetection = false;
/**
 * The set of non-destroyed fixtures currently being used by `TestbedHarnessEnvironment` instances.
 */
const activeFixtures = new Set();
/**
 * Installs a handler for change detection batching status changes for a specific fixture.
 * @param fixture The fixture to handle change detection batching for.
 */
function installAutoChangeDetectionStatusHandler(fixture) {
    if (!activeFixtures.size) {
        handleAutoChangeDetectionStatus(({ isDisabled, onDetectChangesNow }) => {
            disableAutoChangeDetection = isDisabled;
            if (onDetectChangesNow) {
                Promise.all(Array.from(activeFixtures).map(detectChanges)).then(onDetectChangesNow);
            }
        });
    }
    activeFixtures.add(fixture);
}
/**
 * Uninstalls a handler for change detection batching status changes for a specific fixture.
 * @param fixture The fixture to stop handling change detection batching for.
 */
function uninstallAutoChangeDetectionStatusHandler(fixture) {
    activeFixtures.delete(fixture);
    if (!activeFixtures.size) {
        stopHandlingAutoChangeDetectionStatus();
    }
}
/**
 * Triggers change detection for a specific fixture.
 * @param fixture The fixture to trigger change detection for.
 */
function detectChanges(fixture) {
    return __awaiter(this, void 0, void 0, function* () {
        fixture.detectChanges();
        yield fixture.whenStable();
    });
}
/** A `HarnessEnvironment` implementation for Angular's Testbed. */
export class TestbedHarnessEnvironment extends HarnessEnvironment {
    constructor(rawRootElement, _fixture, options) {
        super(rawRootElement);
        this._fixture = _fixture;
        /** Whether the environment has been destroyed. */
        this._destroyed = false;
        this._options = Object.assign(Object.assign({}, defaultEnvironmentOptions), options);
        this._taskState = TaskStateZoneInterceptor.setup();
        installAutoChangeDetectionStatusHandler(_fixture);
        _fixture.componentRef.onDestroy(() => {
            uninstallAutoChangeDetectionStatusHandler(_fixture);
            this._destroyed = true;
        });
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
            if (!disableAutoChangeDetection) {
                if (this._destroyed) {
                    throw Error('Harness is attempting to use a fixture that has already been destroyed.');
                }
                yield detectChanges(this._fixture);
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGJlZC1oYXJuZXNzLWVudmlyb25tZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Rlc3RiZWQvdGVzdGJlZC1oYXJuZXNzLWVudmlyb25tZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBR0wsK0JBQStCLEVBQy9CLGtCQUFrQixFQUVsQixxQ0FBcUMsRUFFdEMsTUFBTSxzQkFBc0IsQ0FBQztBQUM5QixPQUFPLEVBQW1CLEtBQUssRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRTlELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6QyxPQUFPLEVBQVksd0JBQXdCLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUNsRixPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFRcEQsdUNBQXVDO0FBQ3ZDLE1BQU0seUJBQXlCLEdBQXFDO0lBQ2xFLE9BQU8sRUFBRSxDQUFDLFFBQWdCLEVBQUUsSUFBYSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDO0NBQzlFLENBQUM7QUFFRiwyREFBMkQ7QUFDM0QsSUFBSSwwQkFBMEIsR0FBRyxLQUFLLENBQUM7QUFFdkM7O0dBRUc7QUFDSCxNQUFNLGNBQWMsR0FBRyxJQUFJLEdBQUcsRUFBNkIsQ0FBQztBQUU1RDs7O0dBR0c7QUFDSCxTQUFTLHVDQUF1QyxDQUFDLE9BQWtDO0lBQ2pGLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFO1FBQ3hCLCtCQUErQixDQUFDLENBQUMsRUFBQyxVQUFVLEVBQUUsa0JBQWtCLEVBQUMsRUFBRSxFQUFFO1lBQ25FLDBCQUEwQixHQUFHLFVBQVUsQ0FBQztZQUN4QyxJQUFJLGtCQUFrQixFQUFFO2dCQUN0QixPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJ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TExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBDb21wb25lbnRIYXJuZXNzLFxuICBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3IsXG4gIGhhbmRsZUF1dG9DaGFuZ2VEZXRlY3Rpb25TdGF0dXMsXG4gIEhhcm5lc3NFbnZpcm9ubWVudCxcbiAgSGFybmVzc0xvYWRlcixcbiAgc3RvcEhhbmRsaW5nQXV0b0NoYW5nZURldGVjdGlvblN0YXR1cyxcbiAgVGVzdEVsZW1lbnRcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL3Rlc3RpbmcnO1xuaW1wb3J0IHtDb21wb25lbnRGaXh0dXJlLCBmbHVzaH0gZnJvbSAnQGFuZ3VsYXIvY29yZS90ZXN0aW5nJztcbmltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3Rha2VXaGlsZX0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtUYXNrU3RhdGUsIFRhc2tTdGF0ZVpvbmVJbnRlcmNlcHRvcn0gZnJvbSAnLi90YXNrLXN0YXRlLXpvbmUtaW50ZXJjZXB0b3InO1xuaW1wb3J0IHtVbml0VGVzdEVsZW1lbnR9IGZyb20gJy4vdW5pdC10ZXN0LWVsZW1lbnQnO1xuXG4vKiogT3B0aW9ucyB0byBjb25maWd1cmUgdGhlIGVudmlyb25tZW50LiAqL1xuZXhwb3J0IGludGVyZmFjZSBUZXN0YmVkSGFybmVzc0Vudmlyb25tZW50T3B0aW9ucyB7XG4gIC8qKiBUaGUgcXVlcnkgZnVuY3Rpb24gdXNlZCB0byBmaW5kIERPTSBlbGVtZW50cy4gKi9cbiAgcXVlcnlGbjogKHNlbGVjdG9yOiBzdHJpbmcsIHJvb3Q6IEVsZW1lbnQpID0+IEl0ZXJhYmxlPEVsZW1lbnQ+IHwgQXJyYXlMaWtlPEVsZW1lbnQ+O1xufVxuXG4vKiogVGhlIGRlZmF1bHQgZW52aXJvbm1lbnQgb3B0aW9ucy4gKi9cbmNvbnN0IGRlZmF1bHRFbnZpcm9ubWVudE9wdGlvbnM6IFRlc3RiZWRIYXJuZXNzRW52aXJvbm1lbnRPcHRpb25zID0ge1xuICBxdWVyeUZuOiAoc2VsZWN0b3I6IHN0cmluZywgcm9vdDogRWxlbWVudCkgPT4gcm9vdC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKVxufTtcblxuLyoqIFdoZXRoZXIgYXV0byBjaGFuZ2UgZGV0ZWN0aW9uIGlzIGN1cnJlbnRseSBkaXNhYmxlZC4gKi9cbmxldCBkaXNhYmxlQXV0b0NoYW5nZURldGVjdGlvbiA9IGZhbHNlO1xuXG4vKipcbiAqIFRoZSBzZXQgb2Ygbm9uLWRlc3Ryb3llZCBmaXh0dXJlcyBjdXJyZW50bHkgYmVpbmcgdXNlZCBieSBgVGVzdGJlZEhhcm5lc3NFbnZpcm9ubWVudGAgaW5zdGFuY2VzLlxuICovXG5jb25zdCBhY3RpdmVGaXh0dXJlcyA9IG5ldyBTZXQ8Q29tcG9uZW50Rml4dHVyZTx1bmtub3duPj4oKTtcblxuLyoqXG4gKiBJbnN0YWxscyBhIGhhbmRsZXIgZm9yIGNoYW5nZSBkZXRlY3Rpb24gYmF0Y2hpbmcgc3RhdHVzIGNoYW5nZXMgZm9yIGEgc3BlY2lmaWMgZml4dHVyZS5cbiAqIEBwYXJhbSBmaXh0dXJlIFRoZSBmaXh0dXJlIHRvIGhhbmRsZSBjaGFuZ2UgZGV0ZWN0aW9uIGJhdGNoaW5nIGZvci5cbiAqL1xuZnVuY3Rpb24gaW5zdGFsbEF1dG9DaGFuZ2VEZXRlY3Rpb25TdGF0dXNIYW5kbGVyKGZpeHR1cmU6IENvbXBvbmVudEZpeHR1cmU8dW5rbm93bj4pIHtcbiAgaWYgKCFhY3RpdmVGaXh0dXJlcy5zaXplKSB7XG4gICAgaGFuZGxlQXV0b0NoYW5nZURldGVjdGlvblN0YXR1cygoe2lzRGlzYWJsZWQsIG9uRGV0ZWN0Q2hhbmdlc05vd30pID0+IHtcbiAgICAgIGRpc2FibGVBdXRvQ2hhbmdlRGV0ZWN0aW9uID0gaXNEaXNhYmxlZDtcbiAgICAgIGlmIChvbkRldGVjdENoYW5nZXNOb3cpIHtcbiAgICAgICAgUHJvbWlzZS5hbGwoQXJyYXkuZnJvbShhY3RpdmVGaXh0dXJlcykubWFwKGRldGVjdENoYW5nZXMpKS50aGVuKG9uRGV0ZWN0Q2hhbmdlc05vdyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgYWN0aXZlRml4dHVyZXMuYWRkKGZpeHR1cmUpO1xufVxuXG4vKipcbiAqIFVuaW5zdGFsbHMgYSBoYW5kbGVyIGZvciBjaGFuZ2UgZGV0ZWN0aW9uIGJhdGNoaW5nIHN0YXR1cyBjaGFuZ2VzIGZvciBhIHNwZWNpZmljIGZpeHR1cmUuXG4gKiBAcGFyYW0gZml4dHVyZSBUaGUgZml4dHVyZSB0byBzdG9wIGhhbmRsaW5nIGNoYW5nZSBkZXRlY3Rpb24gYmF0Y2hpbmcgZm9yLlxuICovXG5mdW5jdGlvbiB1bmluc3RhbGxBdXRvQ2hhbmdlRGV0ZWN0aW9uU3RhdHVzSGFuZGxlcihmaXh0dXJlOiBDb21wb25lbnRGaXh0dXJlPHVua25vd24+KSB7XG4gIGFjdGl2ZUZpeHR1cmVzLmRlbGV0ZShmaXh0dXJlKTtcbiAgaWYgKCFhY3RpdmVGaXh0dXJlcy5zaXplKSB7XG4gICAgc3RvcEhhbmRsaW5nQXV0b0NoYW5nZURldGVjdGlvblN0YXR1cygpO1xuICB9XG59XG5cbi8qKlxuICogVHJpZ2dlcnMgY2hhbmdlIGRldGVjdGlvbiBmb3IgYSBzcGVjaWZpYyBmaXh0dXJlLlxuICogQHBhcmFtIGZpeHR1cmUgVGhlIGZpeHR1cmUgdG8gdHJpZ2dlciBjaGFuZ2UgZGV0ZWN0aW9uIGZvci5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlcyhmaXh0dXJlOiBDb21wb25lbnRGaXh0dXJlPHVua25vd24+KSB7XG4gIGZpeHR1cmUuZGV0ZWN0Q2hhbmdlcygpO1xuICBhd2FpdCBmaXh0dXJlLndoZW5TdGFibGUoKTtcbn1cblxuLyoqIEEgYEhhcm5lc3NFbnZpcm9ubWVudGAgaW1wbGVtZW50YXRpb24gZm9yIEFuZ3VsYXIncyBUZXN0YmVkLiAqL1xuZXhwb3J0IGNsYXNzIFRlc3RiZWRIYXJuZXNzRW52aXJvbm1lbnQgZXh0ZW5kcyBIYXJuZXNzRW52aXJvbm1lbnQ8RWxlbWVudD4ge1xuICAvKiogV2hldGhlciB0aGUgZW52aXJvbm1lbnQgaGFzIGJlZW4gZGVzdHJveWVkLiAqL1xuICBwcml2YXRlIF9kZXN0cm95ZWQgPSBmYWxzZTtcblxuICAvKiogT2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHdoZW5ldmVyIHRoZSB0ZXN0IHRhc2sgc3RhdGUgY2hhbmdlcy4gKi9cbiAgcHJpdmF0ZSBfdGFza1N0YXRlOiBPYnNlcnZhYmxlPFRhc2tTdGF0ZT47XG5cbiAgLyoqIFRoZSBvcHRpb25zIGZvciB0aGlzIGVudmlyb25tZW50LiAqL1xuICBwcml2YXRlIF9vcHRpb25zOiBUZXN0YmVkSGFybmVzc0Vudmlyb25tZW50T3B0aW9ucztcblxuICBwcm90ZWN0ZWQgY29uc3RydWN0b3IocmF3Um9vdEVsZW1lbnQ6IEVsZW1lbnQsIHByaXZhdGUgX2ZpeHR1cmU6IENvbXBvbmVudEZpeHR1cmU8dW5rbm93bj4sXG4gICAgICBvcHRpb25zPzogVGVzdGJlZEhhcm5lc3NFbnZpcm9ubWVudE9wdGlvbnMpIHtcbiAgICBzdXBlcihyYXdSb290RWxlbWVudCk7XG4gICAgdGhpcy5fb3B0aW9ucyA9IHsuLi5kZWZhdWx0RW52aXJvbm1lbnRPcHRpb25zLCAuLi5vcHRpb25zfTtcbiAgICB0aGlzLl90YXNrU3RhdGUgPSBUYXNrU3RhdGVab25lSW50ZXJjZXB0b3Iuc2V0dXAoKTtcbiAgICBpbnN0YWxsQXV0b0NoYW5nZURldGVjdGlvblN0YXR1c0hhbmRsZXIoX2ZpeHR1cmUpO1xuICAgIF9maXh0dXJlLmNvbXBvbmVudFJlZi5vbkRlc3Ryb3koKCkgPT4ge1xuICAgICAgdW5pbnN0YWxsQXV0b0NoYW5nZURldGVjdGlvblN0YXR1c0hhbmRsZXIoX2ZpeHR1cmUpO1xuICAgICAgdGhpcy5fZGVzdHJveWVkID0gdHJ1ZTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgYEhhcm5lc3NMb2FkZXJgIHJvb3RlZCBhdCB0aGUgZ2l2ZW4gZml4dHVyZSdzIHJvb3QgZWxlbWVudC4gKi9cbiAgc3RhdGljIGxvYWRlcihmaXh0dXJlOiBDb21wb25lbnRGaXh0dXJlPHVua25vd24+LCBvcHRpb25zPzogVGVzdGJlZEhhcm5lc3NFbnZpcm9ubWVudE9wdGlvbnMpOlxuICAgICAgSGFybmVzc0xvYWRlciB7XG4gICAgcmV0dXJuIG5ldyBUZXN0YmVkSGFybmVzc0Vudmlyb25tZW50KGZpeHR1cmUubmF0aXZlRWxlbWVudCwgZml4dHVyZSwgb3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGBIYXJuZXNzTG9hZGVyYCBhdCB0aGUgZG9jdW1lbnQgcm9vdC4gVGhpcyBjYW4gYmUgdXNlZCBpZiBoYXJuZXNzZXMgYXJlXG4gICAqIGxvY2F0ZWQgb3V0c2lkZSBvZiBhIGZpeHR1cmUgKGUuZy4gb3ZlcmxheXMgYXBwZW5kZWQgdG8gdGhlIGRvY3VtZW50IGJvZHkpLlxuICAgKi9cbiAgc3RhdGljIGRvY3VtZW50Um9vdExvYWRlcihmaXh0dXJlOiBDb21wb25lbnRGaXh0dXJlPHVua25vd24+LFxuICAgICAgb3B0aW9ucz86IFRlc3RiZWRIYXJuZXNzRW52aXJvbm1lbnRPcHRpb25zKTogSGFybmVzc0xvYWRlciB7XG4gICAgcmV0dXJuIG5ldyBUZXN0YmVkSGFybmVzc0Vudmlyb25tZW50KGRvY3VtZW50LmJvZHksIGZpeHR1cmUsIG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIG5hdGl2ZSBET00gZWxlbWVudCBjb3JyZXNwb25kaW5nIHRvIHRoZSBnaXZlbiBUZXN0RWxlbWVudC4gKi9cbiAgc3RhdGljIGdldE5hdGl2ZUVsZW1lbnQoZWw6IFRlc3RFbGVtZW50KTogRWxlbWVudCB7XG4gICAgaWYgKGVsIGluc3RhbmNlb2YgVW5pdFRlc3RFbGVtZW50KSB7XG4gICAgICByZXR1cm4gZWwuZWxlbWVudDtcbiAgICB9XG4gICAgdGhyb3cgRXJyb3IoJ1RoaXMgVGVzdEVsZW1lbnQgd2FzIG5vdCBjcmVhdGVkIGJ5IHRoZSBUZXN0YmVkSGFybmVzc0Vudmlyb25tZW50Jyk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiB0aGUgZ2l2ZW4gaGFybmVzcyB0eXBlLCB1c2luZyB0aGUgZml4dHVyZSdzIHJvb3QgZWxlbWVudCBhcyB0aGVcbiAgICogaGFybmVzcydzIGhvc3QgZWxlbWVudC4gVGhpcyBtZXRob2Qgc2hvdWxkIGJlIHVzZWQgd2hlbiBjcmVhdGluZyBhIGhhcm5lc3MgZm9yIHRoZSByb290IGVsZW1lbnRcbiAgICogb2YgYSBmaXh0dXJlLCBhcyBjb21wb25lbnRzIGRvIG5vdCBoYXZlIHRoZSBjb3JyZWN0IHNlbGVjdG9yIHdoZW4gdGhleSBhcmUgY3JlYXRlZCBhcyB0aGUgcm9vdFxuICAgKiBvZiB0aGUgZml4dHVyZS5cbiAgICovXG4gIHN0YXRpYyBhc3luYyBoYXJuZXNzRm9yRml4dHVyZTxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4oXG4gICAgICBmaXh0dXJlOiBDb21wb25lbnRGaXh0dXJlPHVua25vd24+LCBoYXJuZXNzVHlwZTogQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPFQ+LFxuICAgICAgb3B0aW9ucz86IFRlc3RiZWRIYXJuZXNzRW52aXJvbm1lbnRPcHRpb25zKTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgZW52aXJvbm1lbnQgPSBuZXcgVGVzdGJlZEhhcm5lc3NFbnZpcm9ubWVudChmaXh0dXJlLm5hdGl2ZUVsZW1lbnQsIGZpeHR1cmUsIG9wdGlvbnMpO1xuICAgIGF3YWl0IGVudmlyb25tZW50LmZvcmNlU3RhYmlsaXplKCk7XG4gICAgcmV0dXJuIGVudmlyb25tZW50LmNyZWF0ZUNvbXBvbmVudEhhcm5lc3MoaGFybmVzc1R5cGUsIGZpeHR1cmUubmF0aXZlRWxlbWVudCk7XG4gIH1cblxuICBhc3luYyBmb3JjZVN0YWJpbGl6ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIWRpc2FibGVBdXRvQ2hhbmdlRGV0ZWN0aW9uKSB7XG4gICAgICBpZiAodGhpcy5fZGVzdHJveWVkKSB7XG4gICAgICAgIHRocm93IEVycm9yKCdIYXJuZXNzIGlzIGF0dGVtcHRpbmcgdG8gdXNlIGEgZml4dHVyZSB0aGF0IGhhcyBhbHJlYWR5IGJlZW4gZGVzdHJveWVkLicpO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCBkZXRlY3RDaGFuZ2VzKHRoaXMuX2ZpeHR1cmUpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHdhaXRGb3JUYXNrc091dHNpZGVBbmd1bGFyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIElmIHdlIHJ1biBpbiB0aGUgZmFrZSBhc3luYyB6b25lLCB3ZSBydW4gXCJmbHVzaFwiIHRvIHJ1biBhbnkgc2NoZWR1bGVkIHRhc2tzLiBUaGlzXG4gICAgLy8gZW5zdXJlcyB0aGF0IHRoZSBoYXJuZXNzZXMgYmVoYXZlIGluc2lkZSBvZiB0aGUgRmFrZUFzeW5jVGVzdFpvbmUgc2ltaWxhciB0byB0aGVcbiAgICAvLyBcIkFzeW5jVGVzdFpvbmVcIiBhbmQgdGhlIHJvb3Qgem9uZSAoaS5lLiBuZWl0aGVyIGZha2VBc3luYyBvciBhc3luYykuIE5vdGUgdGhhdCB3ZVxuICAgIC8vIGNhbm5vdCBqdXN0IHJlbHkgb24gdGhlIHRhc2sgc3RhdGUgb2JzZXJ2YWJsZSB0byBiZWNvbWUgc3RhYmxlIGJlY2F1c2UgdGhlIHN0YXRlIHdpbGxcbiAgICAvLyBuZXZlciBjaGFuZ2UuIFRoaXMgaXMgYmVjYXVzZSB0aGUgdGFzayBxdWV1ZSB3aWxsIGJlIG9ubHkgZHJhaW5lZCBpZiB0aGUgZmFrZSBhc3luY1xuICAgIC8vIHpvbmUgaXMgYmVpbmcgZmx1c2hlZC5cbiAgICBpZiAoWm9uZSEuY3VycmVudC5nZXQoJ0Zha2VBc3luY1Rlc3Rab25lU3BlYycpKSB7XG4gICAgICBmbHVzaCgpO1xuICAgIH1cblxuICAgIC8vIFdhaXQgdW50aWwgdGhlIHRhc2sgcXVldWUgaGFzIGJlZW4gZHJhaW5lZCBhbmQgdGhlIHpvbmUgaXMgc3RhYmxlLiBOb3RlIHRoYXRcbiAgICAvLyB3ZSBjYW5ub3QgcmVseSBvbiBcImZpeHR1cmUud2hlblN0YWJsZVwiIHNpbmNlIGl0IGRvZXMgbm90IGNhdGNoIHRhc2tzIHNjaGVkdWxlZFxuICAgIC8vIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgem9uZS4gRm9yIHRlc3QgaGFybmVzc2VzLCB3ZSB3YW50IHRvIGVuc3VyZSB0aGF0IHRoZVxuICAgIC8vIGFwcCBpcyBmdWxseSBzdGFiaWxpemVkIGFuZCB0aGVyZWZvcmUgbmVlZCB0byB1c2Ugb3VyIG93biB6b25lIGludGVyY2VwdG9yLlxuICAgIGF3YWl0IHRoaXMuX3Rhc2tTdGF0ZS5waXBlKHRha2VXaGlsZShzdGF0ZSA9PiAhc3RhdGUuc3RhYmxlKSkudG9Qcm9taXNlKCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0RG9jdW1lbnRSb290KCk6IEVsZW1lbnQge1xuICAgIHJldHVybiBkb2N1bWVudC5ib2R5O1xuICB9XG5cbiAgcHJvdGVjdGVkIGNyZWF0ZVRlc3RFbGVtZW50KGVsZW1lbnQ6IEVsZW1lbnQpOiBUZXN0RWxlbWVudCB7XG4gICAgcmV0dXJuIG5ldyBVbml0VGVzdEVsZW1lbnQoZWxlbWVudCwgKCkgPT4gdGhpcy5mb3JjZVN0YWJpbGl6ZSgpKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBjcmVhdGVFbnZpcm9ubWVudChlbGVtZW50OiBFbGVtZW50KTogSGFybmVzc0Vudmlyb25tZW50PEVsZW1lbnQ+IHtcbiAgICByZXR1cm4gbmV3IFRlc3RiZWRIYXJuZXNzRW52aXJvbm1lbnQoZWxlbWVudCwgdGhpcy5fZml4dHVyZSwgdGhpcy5fb3B0aW9ucyk7XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0QWxsUmF3RWxlbWVudHMoc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8RWxlbWVudFtdPiB7XG4gICAgYXdhaXQgdGhpcy5mb3JjZVN0YWJpbGl6ZSgpO1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuX29wdGlvbnMucXVlcnlGbihzZWxlY3RvciwgdGhpcy5yYXdSb290RWxlbWVudCkpO1xuICB9XG59XG4iXX0=