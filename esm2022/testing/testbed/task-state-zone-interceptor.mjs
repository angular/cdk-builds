/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BehaviorSubject } from 'rxjs';
/** Unique symbol that is used to patch a property to a proxy zone. */
const stateObservableSymbol = Symbol('ProxyZone_PATCHED#stateObservable');
/**
 * Interceptor that can be set up in a `ProxyZone` instance. The interceptor
 * will keep track of the task state and emit whenever the state changes.
 *
 * This serves as a workaround for https://github.com/angular/angular/issues/32896.
 */
export class TaskStateZoneInterceptor {
    constructor(lastState) {
        this._lastState = null;
        /** Subject that can be used to emit a new state change. */
        this._stateSubject = new BehaviorSubject(this._lastState ? this._getTaskStateFromInternalZoneState(this._lastState) : { stable: true });
        /** Public observable that emits whenever the task state changes. */
        this.state = this._stateSubject;
        this._lastState = lastState;
    }
    /** This will be called whenever the task state changes in the intercepted zone. */
    onHasTask(delegate, current, target, hasTaskState) {
        if (current === target) {
            this._stateSubject.next(this._getTaskStateFromInternalZoneState(hasTaskState));
        }
    }
    /** Gets the task state from the internal ZoneJS task state. */
    _getTaskStateFromInternalZoneState(state) {
        return { stable: !state.macroTask && !state.microTask };
    }
    /**
     * Sets up the custom task state Zone interceptor in the  `ProxyZone`. Throws if
     * no `ProxyZone` could be found.
     * @returns an observable that emits whenever the task state changes.
     */
    static setup() {
        if (Zone === undefined) {
            throw Error('Could not find ZoneJS. For test harnesses running in TestBed, ' +
                'ZoneJS needs to be installed.');
        }
        // tslint:disable-next-line:variable-name
        const ProxyZoneSpec = Zone['ProxyZoneSpec'];
        // If there is no "ProxyZoneSpec" installed, we throw an error and recommend
        // setting up the proxy zone by pulling in the testing bundle.
        if (!ProxyZoneSpec) {
            throw Error('ProxyZoneSpec is needed for the test harnesses but could not be found. ' +
                'Please make sure that your environment includes zone.js/dist/zone-testing.js');
        }
        // Ensure that there is a proxy zone instance set up, and get
        // a reference to the instance if present.
        const zoneSpec = ProxyZoneSpec.assertPresent();
        // If there already is a delegate registered in the proxy zone, and it
        // is type of the custom task state interceptor, we just use that state
        // observable. This allows us to only intercept Zone once per test
        // (similar to how `fakeAsync` or `async` work).
        if (zoneSpec[stateObservableSymbol]) {
            return zoneSpec[stateObservableSymbol];
        }
        // Since we intercept on environment creation and the fixture has been
        // created before, we might have missed tasks scheduled before. Fortunately
        // the proxy zone keeps track of the previous task state, so we can just pass
        // this as initial state to the task zone interceptor.
        const interceptor = new TaskStateZoneInterceptor(zoneSpec.lastTaskState);
        const zoneSpecOnHasTask = zoneSpec.onHasTask.bind(zoneSpec);
        // We setup the task state interceptor in the `ProxyZone`. Note that we cannot register
        // the interceptor as a new proxy zone delegate because it would mean that other zone
        // delegates (e.g. `FakeAsyncTestZone` or `AsyncTestZone`) can accidentally overwrite/disable
        // our interceptor. Since we just intend to monitor the task state of the proxy zone, it is
        // sufficient to just patch the proxy zone. This also avoids that we interfere with the task
        // queue scheduling logic.
        zoneSpec.onHasTask = function (...args) {
            zoneSpecOnHasTask(...args);
            interceptor.onHasTask(...args);
        };
        return (zoneSpec[stateObservableSymbol] = interceptor.state);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFzay1zdGF0ZS16b25lLWludGVyY2VwdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Rlc3RiZWQvdGFzay1zdGF0ZS16b25lLWludGVyY2VwdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxlQUFlLEVBQWEsTUFBTSxNQUFNLENBQUM7QUFTakQsc0VBQXNFO0FBQ3RFLE1BQU0scUJBQXFCLEdBQUcsTUFBTSxDQUFDLG1DQUFtQyxDQUFDLENBQUM7QUFPMUU7Ozs7O0dBS0c7QUFDSCxNQUFNLE9BQU8sd0JBQXdCO0lBV25DLFlBQVksU0FBOEI7UUFWbEMsZUFBVSxHQUF3QixJQUFJLENBQUM7UUFFL0MsMkRBQTJEO1FBQzFDLGtCQUFhLEdBQUcsSUFBSSxlQUFlLENBQ2xELElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsTUFBTSxFQUFFLElBQUksRUFBQyxDQUM1RixDQUFDO1FBRUYsb0VBQW9FO1FBQzNELFVBQUssR0FBMEIsSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUd6RCxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztJQUM5QixDQUFDO0lBRUQsbUZBQW1GO0lBQ25GLFNBQVMsQ0FBQyxRQUFzQixFQUFFLE9BQWEsRUFBRSxNQUFZLEVBQUUsWUFBMEI7UUFDdkYsSUFBSSxPQUFPLEtBQUssTUFBTSxFQUFFLENBQUM7WUFDdkIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGtDQUFrQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDakYsQ0FBQztJQUNILENBQUM7SUFFRCwrREFBK0Q7SUFDdkQsa0NBQWtDLENBQUMsS0FBbUI7UUFDNUQsT0FBTyxFQUFDLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FBQyxTQUFTLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFDLENBQUM7SUFDeEQsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxNQUFNLENBQUMsS0FBSztRQUNWLElBQUksSUFBSSxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ3ZCLE1BQU0sS0FBSyxDQUNULGdFQUFnRTtnQkFDOUQsK0JBQStCLENBQ2xDLENBQUM7UUFDSixDQUFDO1FBRUQseUNBQXlDO1FBQ3pDLE1BQU0sYUFBYSxHQUFJLElBQVksQ0FBQyxlQUFlLENBQWdDLENBQUM7UUFFcEYsNEVBQTRFO1FBQzVFLDhEQUE4RDtRQUM5RCxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDbkIsTUFBTSxLQUFLLENBQ1QseUVBQXlFO2dCQUN2RSw4RUFBOEUsQ0FDakYsQ0FBQztRQUNKLENBQUM7UUFFRCw2REFBNkQ7UUFDN0QsMENBQTBDO1FBQzFDLE1BQU0sUUFBUSxHQUFHLGFBQWEsQ0FBQyxhQUFhLEVBQXNCLENBQUM7UUFFbkUsc0VBQXNFO1FBQ3RFLHVFQUF1RTtRQUN2RSxrRUFBa0U7UUFDbEUsZ0RBQWdEO1FBQ2hELElBQUksUUFBUSxDQUFDLHFCQUFxQixDQUFDLEVBQUUsQ0FBQztZQUNwQyxPQUFPLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSxDQUFDO1FBQzFDLENBQUM7UUFFRCxzRUFBc0U7UUFDdEUsMkVBQTJFO1FBQzNFLDZFQUE2RTtRQUM3RSxzREFBc0Q7UUFDdEQsTUFBTSxXQUFXLEdBQUcsSUFBSSx3QkFBd0IsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDekUsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUU1RCx1RkFBdUY7UUFDdkYscUZBQXFGO1FBQ3JGLDZGQUE2RjtRQUM3RiwyRkFBMkY7UUFDM0YsNEZBQTRGO1FBQzVGLDBCQUEwQjtRQUMxQixRQUFRLENBQUMsU0FBUyxHQUFHLFVBQVUsR0FBRyxJQUE4QztZQUM5RSxpQkFBaUIsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQzNCLFdBQVcsQ0FBQyxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUNqQyxDQUFDLENBQUM7UUFFRixPQUFPLENBQUMsUUFBUSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9ELENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0JlaGF2aW9yU3ViamVjdCwgT2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XG5pbXBvcnQge1Byb3h5Wm9uZSwgUHJveHlab25lU3RhdGljfSBmcm9tICcuL3Byb3h5LXpvbmUtdHlwZXMnO1xuXG4vKiogQ3VycmVudCBzdGF0ZSBvZiB0aGUgaW50ZXJjZXB0ZWQgem9uZS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVGFza1N0YXRlIHtcbiAgLyoqIFdoZXRoZXIgdGhlIHpvbmUgaXMgc3RhYmxlIChpLmUuIG5vIG1pY3JvdGFza3MgYW5kIG1hY3JvdGFza3MpLiAqL1xuICBzdGFibGU6IGJvb2xlYW47XG59XG5cbi8qKiBVbmlxdWUgc3ltYm9sIHRoYXQgaXMgdXNlZCB0byBwYXRjaCBhIHByb3BlcnR5IHRvIGEgcHJveHkgem9uZS4gKi9cbmNvbnN0IHN0YXRlT2JzZXJ2YWJsZVN5bWJvbCA9IFN5bWJvbCgnUHJveHlab25lX1BBVENIRUQjc3RhdGVPYnNlcnZhYmxlJyk7XG5cbi8qKiBUeXBlIHRoYXQgZGVzY3JpYmVzIGEgcG90ZW50aWFsbHkgcGF0Y2hlZCBwcm94eSB6b25lIGluc3RhbmNlLiAqL1xudHlwZSBQYXRjaGVkUHJveHlab25lID0gUHJveHlab25lICYge1xuICBbc3RhdGVPYnNlcnZhYmxlU3ltYm9sXTogdW5kZWZpbmVkIHwgT2JzZXJ2YWJsZTxUYXNrU3RhdGU+O1xufTtcblxuLyoqXG4gKiBJbnRlcmNlcHRvciB0aGF0IGNhbiBiZSBzZXQgdXAgaW4gYSBgUHJveHlab25lYCBpbnN0YW5jZS4gVGhlIGludGVyY2VwdG9yXG4gKiB3aWxsIGtlZXAgdHJhY2sgb2YgdGhlIHRhc2sgc3RhdGUgYW5kIGVtaXQgd2hlbmV2ZXIgdGhlIHN0YXRlIGNoYW5nZXMuXG4gKlxuICogVGhpcyBzZXJ2ZXMgYXMgYSB3b3JrYXJvdW5kIGZvciBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL2lzc3Vlcy8zMjg5Ni5cbiAqL1xuZXhwb3J0IGNsYXNzIFRhc2tTdGF0ZVpvbmVJbnRlcmNlcHRvciB7XG4gIHByaXZhdGUgX2xhc3RTdGF0ZTogSGFzVGFza1N0YXRlIHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIFN1YmplY3QgdGhhdCBjYW4gYmUgdXNlZCB0byBlbWl0IGEgbmV3IHN0YXRlIGNoYW5nZS4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfc3RhdGVTdWJqZWN0ID0gbmV3IEJlaGF2aW9yU3ViamVjdDxUYXNrU3RhdGU+KFxuICAgIHRoaXMuX2xhc3RTdGF0ZSA/IHRoaXMuX2dldFRhc2tTdGF0ZUZyb21JbnRlcm5hbFpvbmVTdGF0ZSh0aGlzLl9sYXN0U3RhdGUpIDoge3N0YWJsZTogdHJ1ZX0sXG4gICk7XG5cbiAgLyoqIFB1YmxpYyBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgd2hlbmV2ZXIgdGhlIHRhc2sgc3RhdGUgY2hhbmdlcy4gKi9cbiAgcmVhZG9ubHkgc3RhdGU6IE9ic2VydmFibGU8VGFza1N0YXRlPiA9IHRoaXMuX3N0YXRlU3ViamVjdDtcblxuICBjb25zdHJ1Y3RvcihsYXN0U3RhdGU6IEhhc1Rhc2tTdGF0ZSB8IG51bGwpIHtcbiAgICB0aGlzLl9sYXN0U3RhdGUgPSBsYXN0U3RhdGU7XG4gIH1cblxuICAvKiogVGhpcyB3aWxsIGJlIGNhbGxlZCB3aGVuZXZlciB0aGUgdGFzayBzdGF0ZSBjaGFuZ2VzIGluIHRoZSBpbnRlcmNlcHRlZCB6b25lLiAqL1xuICBvbkhhc1Rhc2soZGVsZWdhdGU6IFpvbmVEZWxlZ2F0ZSwgY3VycmVudDogWm9uZSwgdGFyZ2V0OiBab25lLCBoYXNUYXNrU3RhdGU6IEhhc1Rhc2tTdGF0ZSkge1xuICAgIGlmIChjdXJyZW50ID09PSB0YXJnZXQpIHtcbiAgICAgIHRoaXMuX3N0YXRlU3ViamVjdC5uZXh0KHRoaXMuX2dldFRhc2tTdGF0ZUZyb21JbnRlcm5hbFpvbmVTdGF0ZShoYXNUYXNrU3RhdGUpKTtcbiAgICB9XG4gIH1cblxuICAvKiogR2V0cyB0aGUgdGFzayBzdGF0ZSBmcm9tIHRoZSBpbnRlcm5hbCBab25lSlMgdGFzayBzdGF0ZS4gKi9cbiAgcHJpdmF0ZSBfZ2V0VGFza1N0YXRlRnJvbUludGVybmFsWm9uZVN0YXRlKHN0YXRlOiBIYXNUYXNrU3RhdGUpOiBUYXNrU3RhdGUge1xuICAgIHJldHVybiB7c3RhYmxlOiAhc3RhdGUubWFjcm9UYXNrICYmICFzdGF0ZS5taWNyb1Rhc2t9O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgdGhlIGN1c3RvbSB0YXNrIHN0YXRlIFpvbmUgaW50ZXJjZXB0b3IgaW4gdGhlICBgUHJveHlab25lYC4gVGhyb3dzIGlmXG4gICAqIG5vIGBQcm94eVpvbmVgIGNvdWxkIGJlIGZvdW5kLlxuICAgKiBAcmV0dXJucyBhbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgd2hlbmV2ZXIgdGhlIHRhc2sgc3RhdGUgY2hhbmdlcy5cbiAgICovXG4gIHN0YXRpYyBzZXR1cCgpOiBPYnNlcnZhYmxlPFRhc2tTdGF0ZT4ge1xuICAgIGlmIChab25lID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAnQ291bGQgbm90IGZpbmQgWm9uZUpTLiBGb3IgdGVzdCBoYXJuZXNzZXMgcnVubmluZyBpbiBUZXN0QmVkLCAnICtcbiAgICAgICAgICAnWm9uZUpTIG5lZWRzIHRvIGJlIGluc3RhbGxlZC4nLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6dmFyaWFibGUtbmFtZVxuICAgIGNvbnN0IFByb3h5Wm9uZVNwZWMgPSAoWm9uZSBhcyBhbnkpWydQcm94eVpvbmVTcGVjJ10gYXMgUHJveHlab25lU3RhdGljIHwgdW5kZWZpbmVkO1xuXG4gICAgLy8gSWYgdGhlcmUgaXMgbm8gXCJQcm94eVpvbmVTcGVjXCIgaW5zdGFsbGVkLCB3ZSB0aHJvdyBhbiBlcnJvciBhbmQgcmVjb21tZW5kXG4gICAgLy8gc2V0dGluZyB1cCB0aGUgcHJveHkgem9uZSBieSBwdWxsaW5nIGluIHRoZSB0ZXN0aW5nIGJ1bmRsZS5cbiAgICBpZiAoIVByb3h5Wm9uZVNwZWMpIHtcbiAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAnUHJveHlab25lU3BlYyBpcyBuZWVkZWQgZm9yIHRoZSB0ZXN0IGhhcm5lc3NlcyBidXQgY291bGQgbm90IGJlIGZvdW5kLiAnICtcbiAgICAgICAgICAnUGxlYXNlIG1ha2Ugc3VyZSB0aGF0IHlvdXIgZW52aXJvbm1lbnQgaW5jbHVkZXMgem9uZS5qcy9kaXN0L3pvbmUtdGVzdGluZy5qcycsXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIEVuc3VyZSB0aGF0IHRoZXJlIGlzIGEgcHJveHkgem9uZSBpbnN0YW5jZSBzZXQgdXAsIGFuZCBnZXRcbiAgICAvLyBhIHJlZmVyZW5jZSB0byB0aGUgaW5zdGFuY2UgaWYgcHJlc2VudC5cbiAgICBjb25zdCB6b25lU3BlYyA9IFByb3h5Wm9uZVNwZWMuYXNzZXJ0UHJlc2VudCgpIGFzIFBhdGNoZWRQcm94eVpvbmU7XG5cbiAgICAvLyBJZiB0aGVyZSBhbHJlYWR5IGlzIGEgZGVsZWdhdGUgcmVnaXN0ZXJlZCBpbiB0aGUgcHJveHkgem9uZSwgYW5kIGl0XG4gICAgLy8gaXMgdHlwZSBvZiB0aGUgY3VzdG9tIHRhc2sgc3RhdGUgaW50ZXJjZXB0b3IsIHdlIGp1c3QgdXNlIHRoYXQgc3RhdGVcbiAgICAvLyBvYnNlcnZhYmxlLiBUaGlzIGFsbG93cyB1cyB0byBvbmx5IGludGVyY2VwdCBab25lIG9uY2UgcGVyIHRlc3RcbiAgICAvLyAoc2ltaWxhciB0byBob3cgYGZha2VBc3luY2Agb3IgYGFzeW5jYCB3b3JrKS5cbiAgICBpZiAoem9uZVNwZWNbc3RhdGVPYnNlcnZhYmxlU3ltYm9sXSkge1xuICAgICAgcmV0dXJuIHpvbmVTcGVjW3N0YXRlT2JzZXJ2YWJsZVN5bWJvbF0hO1xuICAgIH1cblxuICAgIC8vIFNpbmNlIHdlIGludGVyY2VwdCBvbiBlbnZpcm9ubWVudCBjcmVhdGlvbiBhbmQgdGhlIGZpeHR1cmUgaGFzIGJlZW5cbiAgICAvLyBjcmVhdGVkIGJlZm9yZSwgd2UgbWlnaHQgaGF2ZSBtaXNzZWQgdGFza3Mgc2NoZWR1bGVkIGJlZm9yZS4gRm9ydHVuYXRlbHlcbiAgICAvLyB0aGUgcHJveHkgem9uZSBrZWVwcyB0cmFjayBvZiB0aGUgcHJldmlvdXMgdGFzayBzdGF0ZSwgc28gd2UgY2FuIGp1c3QgcGFzc1xuICAgIC8vIHRoaXMgYXMgaW5pdGlhbCBzdGF0ZSB0byB0aGUgdGFzayB6b25lIGludGVyY2VwdG9yLlxuICAgIGNvbnN0IGludGVyY2VwdG9yID0gbmV3IFRhc2tTdGF0ZVpvbmVJbnRlcmNlcHRvcih6b25lU3BlYy5sYXN0VGFza1N0YXRlKTtcbiAgICBjb25zdCB6b25lU3BlY09uSGFzVGFzayA9IHpvbmVTcGVjLm9uSGFzVGFzay5iaW5kKHpvbmVTcGVjKTtcblxuICAgIC8vIFdlIHNldHVwIHRoZSB0YXNrIHN0YXRlIGludGVyY2VwdG9yIGluIHRoZSBgUHJveHlab25lYC4gTm90ZSB0aGF0IHdlIGNhbm5vdCByZWdpc3RlclxuICAgIC8vIHRoZSBpbnRlcmNlcHRvciBhcyBhIG5ldyBwcm94eSB6b25lIGRlbGVnYXRlIGJlY2F1c2UgaXQgd291bGQgbWVhbiB0aGF0IG90aGVyIHpvbmVcbiAgICAvLyBkZWxlZ2F0ZXMgKGUuZy4gYEZha2VBc3luY1Rlc3Rab25lYCBvciBgQXN5bmNUZXN0Wm9uZWApIGNhbiBhY2NpZGVudGFsbHkgb3ZlcndyaXRlL2Rpc2FibGVcbiAgICAvLyBvdXIgaW50ZXJjZXB0b3IuIFNpbmNlIHdlIGp1c3QgaW50ZW5kIHRvIG1vbml0b3IgdGhlIHRhc2sgc3RhdGUgb2YgdGhlIHByb3h5IHpvbmUsIGl0IGlzXG4gICAgLy8gc3VmZmljaWVudCB0byBqdXN0IHBhdGNoIHRoZSBwcm94eSB6b25lLiBUaGlzIGFsc28gYXZvaWRzIHRoYXQgd2UgaW50ZXJmZXJlIHdpdGggdGhlIHRhc2tcbiAgICAvLyBxdWV1ZSBzY2hlZHVsaW5nIGxvZ2ljLlxuICAgIHpvbmVTcGVjLm9uSGFzVGFzayA9IGZ1bmN0aW9uICguLi5hcmdzOiBbWm9uZURlbGVnYXRlLCBab25lLCBab25lLCBIYXNUYXNrU3RhdGVdKSB7XG4gICAgICB6b25lU3BlY09uSGFzVGFzayguLi5hcmdzKTtcbiAgICAgIGludGVyY2VwdG9yLm9uSGFzVGFzayguLi5hcmdzKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuICh6b25lU3BlY1tzdGF0ZU9ic2VydmFibGVTeW1ib2xdID0gaW50ZXJjZXB0b3Iuc3RhdGUpO1xuICB9XG59XG4iXX0=