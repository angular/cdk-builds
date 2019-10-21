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
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const environment = new TestbedHarnessEnvironment(fixture.nativeElement, fixture);
            yield environment.forceStabilize();
            return environment.createComponentHarness(harnessType, fixture.nativeElement);
        });
    }
    forceStabilize() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this._destroyed) {
                throw Error('Harness is attempting to use a fixture that has already been destroyed.');
            }
            this._fixture.detectChanges();
            yield this._fixture.whenStable();
        });
    }
    waitForTasksOutsideAngular() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.forceStabilize();
            return Array.from(this.rawRootElement.querySelectorAll(selector));
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGJlZC1oYXJuZXNzLWVudmlyb25tZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Rlc3RiZWQvdGVzdGJlZC1oYXJuZXNzLWVudmlyb25tZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUN4RCxPQUFPLEVBQW1CLEtBQUssRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRTlELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUd6QyxPQUFPLEVBQVksd0JBQXdCLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUNsRixPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFHcEQsbUVBQW1FO0FBQ25FLE1BQU0sT0FBTyx5QkFBMEIsU0FBUSxrQkFBMkI7SUFNeEUsWUFBc0IsY0FBdUIsRUFBVSxRQUFtQztRQUN4RixLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7UUFEK0IsYUFBUSxHQUFSLFFBQVEsQ0FBMkI7UUFMbEYsZUFBVSxHQUFHLEtBQUssQ0FBQztRQU96QixJQUFJLENBQUMsVUFBVSxHQUFHLHdCQUF3QixDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ25ELFFBQVEsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDaEUsQ0FBQztJQUVELDRFQUE0RTtJQUM1RSxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQWtDO1FBQzlDLE9BQU8sSUFBSSx5QkFBeUIsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7SUFFRDs7O09BR0c7SUFDSCxNQUFNLENBQUMsa0JBQWtCLENBQUMsT0FBa0M7UUFDMUQsT0FBTyxJQUFJLHlCQUF5QixDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDL0QsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsTUFBTSxDQUFPLGlCQUFpQixDQUMxQixPQUFrQyxFQUFFLFdBQTJDOztZQUNqRixNQUFNLFdBQVcsR0FBRyxJQUFJLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDbEYsTUFBTSxXQUFXLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDbkMsT0FBTyxXQUFXLENBQUMsc0JBQXNCLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNoRixDQUFDO0tBQUE7SUFFSyxjQUFjOztZQUNsQixJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7Z0JBQ25CLE1BQU0sS0FBSyxDQUFDLHlFQUF5RSxDQUFDLENBQUM7YUFDeEY7WUFFRCxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQzlCLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUNuQyxDQUFDO0tBQUE7SUFFSywwQkFBMEI7O1lBQzlCLG9GQUFvRjtZQUNwRixtRkFBbUY7WUFDbkYsb0ZBQW9GO1lBQ3BGLHdGQUF3RjtZQUN4RixzRkFBc0Y7WUFDdEYseUJBQXlCO1lBQ3pCLElBQUksSUFBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUMsRUFBRTtnQkFDOUMsS0FBSyxFQUFFLENBQUM7YUFDVDtZQUVELCtFQUErRTtZQUMvRSxpRkFBaUY7WUFDakYsOEVBQThFO1lBQzlFLDhFQUE4RTtZQUM5RSxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDNUUsQ0FBQztLQUFBO0lBRVMsZUFBZTtRQUN2QixPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUM7SUFDdkIsQ0FBQztJQUVTLGlCQUFpQixDQUFDLE9BQWdCO1FBQzFDLE9BQU8sSUFBSSxlQUFlLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDO0lBQ25FLENBQUM7SUFFUyxpQkFBaUIsQ0FBQyxPQUFnQjtRQUMxQyxPQUFPLElBQUkseUJBQXlCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBRWUsaUJBQWlCLENBQUMsUUFBZ0I7O1lBQ2hELE1BQU0sSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQzVCLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDcEUsQ0FBQztLQUFBO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtIYXJuZXNzRW52aXJvbm1lbnR9IGZyb20gJ0Bhbmd1bGFyL2Nkay90ZXN0aW5nJztcbmltcG9ydCB7Q29tcG9uZW50Rml4dHVyZSwgZmx1c2h9IGZyb20gJ0Bhbmd1bGFyL2NvcmUvdGVzdGluZyc7XG5pbXBvcnQge09ic2VydmFibGV9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHt0YWtlV2hpbGV9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7Q29tcG9uZW50SGFybmVzcywgQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yLCBIYXJuZXNzTG9hZGVyfSBmcm9tICcuLi9jb21wb25lbnQtaGFybmVzcyc7XG5pbXBvcnQge1Rlc3RFbGVtZW50fSBmcm9tICcuLi90ZXN0LWVsZW1lbnQnO1xuaW1wb3J0IHtUYXNrU3RhdGUsIFRhc2tTdGF0ZVpvbmVJbnRlcmNlcHRvcn0gZnJvbSAnLi90YXNrLXN0YXRlLXpvbmUtaW50ZXJjZXB0b3InO1xuaW1wb3J0IHtVbml0VGVzdEVsZW1lbnR9IGZyb20gJy4vdW5pdC10ZXN0LWVsZW1lbnQnO1xuXG5cbi8qKiBBIGBIYXJuZXNzRW52aXJvbm1lbnRgIGltcGxlbWVudGF0aW9uIGZvciBBbmd1bGFyJ3MgVGVzdGJlZC4gKi9cbmV4cG9ydCBjbGFzcyBUZXN0YmVkSGFybmVzc0Vudmlyb25tZW50IGV4dGVuZHMgSGFybmVzc0Vudmlyb25tZW50PEVsZW1lbnQ+IHtcbiAgcHJpdmF0ZSBfZGVzdHJveWVkID0gZmFsc2U7XG5cbiAgLyoqIE9ic2VydmFibGUgdGhhdCBlbWl0cyB3aGVuZXZlciB0aGUgdGVzdCB0YXNrIHN0YXRlIGNoYW5nZXMuICovXG4gIHByaXZhdGUgX3Rhc2tTdGF0ZTogT2JzZXJ2YWJsZTxUYXNrU3RhdGU+O1xuXG4gIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihyYXdSb290RWxlbWVudDogRWxlbWVudCwgcHJpdmF0ZSBfZml4dHVyZTogQ29tcG9uZW50Rml4dHVyZTx1bmtub3duPikge1xuICAgIHN1cGVyKHJhd1Jvb3RFbGVtZW50KTtcbiAgICB0aGlzLl90YXNrU3RhdGUgPSBUYXNrU3RhdGVab25lSW50ZXJjZXB0b3Iuc2V0dXAoKTtcbiAgICBfZml4dHVyZS5jb21wb25lbnRSZWYub25EZXN0cm95KCgpID0+IHRoaXMuX2Rlc3Ryb3llZCA9IHRydWUpO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBgSGFybmVzc0xvYWRlcmAgcm9vdGVkIGF0IHRoZSBnaXZlbiBmaXh0dXJlJ3Mgcm9vdCBlbGVtZW50LiAqL1xuICBzdGF0aWMgbG9hZGVyKGZpeHR1cmU6IENvbXBvbmVudEZpeHR1cmU8dW5rbm93bj4pOiBIYXJuZXNzTG9hZGVyIHtcbiAgICByZXR1cm4gbmV3IFRlc3RiZWRIYXJuZXNzRW52aXJvbm1lbnQoZml4dHVyZS5uYXRpdmVFbGVtZW50LCBmaXh0dXJlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgYEhhcm5lc3NMb2FkZXJgIGF0IHRoZSBkb2N1bWVudCByb290LiBUaGlzIGNhbiBiZSB1c2VkIGlmIGhhcm5lc3NlcyBhcmVcbiAgICogbG9jYXRlZCBvdXRzaWRlIG9mIGEgZml4dHVyZSAoZS5nLiBvdmVybGF5cyBhcHBlbmRlZCB0byB0aGUgZG9jdW1lbnQgYm9keSkuXG4gICAqL1xuICBzdGF0aWMgZG9jdW1lbnRSb290TG9hZGVyKGZpeHR1cmU6IENvbXBvbmVudEZpeHR1cmU8dW5rbm93bj4pOiBIYXJuZXNzTG9hZGVyIHtcbiAgICByZXR1cm4gbmV3IFRlc3RiZWRIYXJuZXNzRW52aXJvbm1lbnQoZG9jdW1lbnQuYm9keSwgZml4dHVyZSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiB0aGUgZ2l2ZW4gaGFybmVzcyB0eXBlLCB1c2luZyB0aGUgZml4dHVyZSdzIHJvb3QgZWxlbWVudCBhcyB0aGVcbiAgICogaGFybmVzcydzIGhvc3QgZWxlbWVudC4gVGhpcyBtZXRob2Qgc2hvdWxkIGJlIHVzZWQgd2hlbiBjcmVhdGluZyBhIGhhcm5lc3MgZm9yIHRoZSByb290IGVsZW1lbnRcbiAgICogb2YgYSBmaXh0dXJlLCBhcyBjb21wb25lbnRzIGRvIG5vdCBoYXZlIHRoZSBjb3JyZWN0IHNlbGVjdG9yIHdoZW4gdGhleSBhcmUgY3JlYXRlZCBhcyB0aGUgcm9vdFxuICAgKiBvZiB0aGUgZml4dHVyZS5cbiAgICovXG4gIHN0YXRpYyBhc3luYyBoYXJuZXNzRm9yRml4dHVyZTxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4oXG4gICAgICBmaXh0dXJlOiBDb21wb25lbnRGaXh0dXJlPHVua25vd24+LCBoYXJuZXNzVHlwZTogQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPFQ+KTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgZW52aXJvbm1lbnQgPSBuZXcgVGVzdGJlZEhhcm5lc3NFbnZpcm9ubWVudChmaXh0dXJlLm5hdGl2ZUVsZW1lbnQsIGZpeHR1cmUpO1xuICAgIGF3YWl0IGVudmlyb25tZW50LmZvcmNlU3RhYmlsaXplKCk7XG4gICAgcmV0dXJuIGVudmlyb25tZW50LmNyZWF0ZUNvbXBvbmVudEhhcm5lc3MoaGFybmVzc1R5cGUsIGZpeHR1cmUubmF0aXZlRWxlbWVudCk7XG4gIH1cblxuICBhc3luYyBmb3JjZVN0YWJpbGl6ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5fZGVzdHJveWVkKSB7XG4gICAgICB0aHJvdyBFcnJvcignSGFybmVzcyBpcyBhdHRlbXB0aW5nIHRvIHVzZSBhIGZpeHR1cmUgdGhhdCBoYXMgYWxyZWFkeSBiZWVuIGRlc3Ryb3llZC4nKTtcbiAgICB9XG5cbiAgICB0aGlzLl9maXh0dXJlLmRldGVjdENoYW5nZXMoKTtcbiAgICBhd2FpdCB0aGlzLl9maXh0dXJlLndoZW5TdGFibGUoKTtcbiAgfVxuXG4gIGFzeW5jIHdhaXRGb3JUYXNrc091dHNpZGVBbmd1bGFyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIElmIHdlIHJ1biBpbiB0aGUgZmFrZSBhc3luYyB6b25lLCB3ZSBydW4gXCJmbHVzaFwiIHRvIHJ1biBhbnkgc2NoZWR1bGVkIHRhc2tzLiBUaGlzXG4gICAgLy8gZW5zdXJlcyB0aGF0IHRoZSBoYXJuZXNzZXMgYmVoYXZlIGluc2lkZSBvZiB0aGUgRmFrZUFzeW5jVGVzdFpvbmUgc2ltaWxhciB0byB0aGVcbiAgICAvLyBcIkFzeW5jVGVzdFpvbmVcIiBhbmQgdGhlIHJvb3Qgem9uZSAoaS5lLiBuZWl0aGVyIGZha2VBc3luYyBvciBhc3luYykuIE5vdGUgdGhhdCB3ZVxuICAgIC8vIGNhbm5vdCBqdXN0IHJlbHkgb24gdGhlIHRhc2sgc3RhdGUgb2JzZXJ2YWJsZSB0byBiZWNvbWUgc3RhYmxlIGJlY2F1c2UgdGhlIHN0YXRlIHdpbGxcbiAgICAvLyBuZXZlciBjaGFuZ2UuIFRoaXMgaXMgYmVjYXVzZSB0aGUgdGFzayBxdWV1ZSB3aWxsIGJlIG9ubHkgZHJhaW5lZCBpZiB0aGUgZmFrZSBhc3luY1xuICAgIC8vIHpvbmUgaXMgYmVpbmcgZmx1c2hlZC5cbiAgICBpZiAoWm9uZSEuY3VycmVudC5nZXQoJ0Zha2VBc3luY1Rlc3Rab25lU3BlYycpKSB7XG4gICAgICBmbHVzaCgpO1xuICAgIH1cblxuICAgIC8vIFdhaXQgdW50aWwgdGhlIHRhc2sgcXVldWUgaGFzIGJlZW4gZHJhaW5lZCBhbmQgdGhlIHpvbmUgaXMgc3RhYmxlLiBOb3RlIHRoYXRcbiAgICAvLyB3ZSBjYW5ub3QgcmVseSBvbiBcImZpeHR1cmUud2hlblN0YWJsZVwiIHNpbmNlIGl0IGRvZXMgbm90IGNhdGNoIHRhc2tzIHNjaGVkdWxlZFxuICAgIC8vIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgem9uZS4gRm9yIHRlc3QgaGFybmVzc2VzLCB3ZSB3YW50IHRvIGVuc3VyZSB0aGF0IHRoZVxuICAgIC8vIGFwcCBpcyBmdWxseSBzdGFiaWxpemVkIGFuZCB0aGVyZWZvcmUgbmVlZCB0byB1c2Ugb3VyIG93biB6b25lIGludGVyY2VwdG9yLlxuICAgIGF3YWl0IHRoaXMuX3Rhc2tTdGF0ZS5waXBlKHRha2VXaGlsZShzdGF0ZSA9PiAhc3RhdGUuc3RhYmxlKSkudG9Qcm9taXNlKCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0RG9jdW1lbnRSb290KCk6IEVsZW1lbnQge1xuICAgIHJldHVybiBkb2N1bWVudC5ib2R5O1xuICB9XG5cbiAgcHJvdGVjdGVkIGNyZWF0ZVRlc3RFbGVtZW50KGVsZW1lbnQ6IEVsZW1lbnQpOiBUZXN0RWxlbWVudCB7XG4gICAgcmV0dXJuIG5ldyBVbml0VGVzdEVsZW1lbnQoZWxlbWVudCwgKCkgPT4gdGhpcy5mb3JjZVN0YWJpbGl6ZSgpKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBjcmVhdGVFbnZpcm9ubWVudChlbGVtZW50OiBFbGVtZW50KTogSGFybmVzc0Vudmlyb25tZW50PEVsZW1lbnQ+IHtcbiAgICByZXR1cm4gbmV3IFRlc3RiZWRIYXJuZXNzRW52aXJvbm1lbnQoZWxlbWVudCwgdGhpcy5fZml4dHVyZSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0QWxsUmF3RWxlbWVudHMoc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8RWxlbWVudFtdPiB7XG4gICAgYXdhaXQgdGhpcy5mb3JjZVN0YWJpbGl6ZSgpO1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMucmF3Um9vdEVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikpO1xuICB9XG59XG4iXX0=