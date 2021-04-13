/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __awaiter } from "tslib";
import { BehaviorSubject } from 'rxjs';
/** Subject used to dispatch and listen for changes to the auto change detection status . */
const autoChangeDetectionSubject = new BehaviorSubject({
    isDisabled: false
});
/** The current subscription to `autoChangeDetectionSubject`. */
let autoChangeDetectionSubscription;
/**
 * The default handler for auto change detection status changes. This handler will be used if the
 * specific environment does not install its own.
 * @param status The new auto change detection status.
 */
function defaultAutoChangeDetectionHandler(status) {
    var _a;
    (_a = status.onDetectChangesNow) === null || _a === void 0 ? void 0 : _a.call(status);
}
/**
 * Allows a test `HarnessEnvironment` to install its own handler for auto change detection status
 * changes.
 * @param handler The handler for the auto change detection status.
 */
export function handleAutoChangeDetectionStatus(handler) {
    stopHandlingAutoChangeDetectionStatus();
    autoChangeDetectionSubscription = autoChangeDetectionSubject.subscribe(handler);
}
/** Allows a `HarnessEnvironment` to stop handling auto change detection status changes. */
export function stopHandlingAutoChangeDetectionStatus() {
    autoChangeDetectionSubscription === null || autoChangeDetectionSubscription === void 0 ? void 0 : autoChangeDetectionSubscription.unsubscribe();
    autoChangeDetectionSubscription = null;
}
/**
 * Batches together triggering of change detection over the duration of the given function.
 * @param fn The function to call with batched change detection.
 * @param triggerBeforeAndAfter Optionally trigger change detection once before and after the batch
 *   operation. If false, change detection will not be triggered.
 * @return The result of the given function.
 */
function batchChangeDetection(fn, triggerBeforeAndAfter) {
    return __awaiter(this, void 0, void 0, function* () {
        // If change detection batching is already in progress, just run the function.
        if (autoChangeDetectionSubject.getValue().isDisabled) {
            return yield fn();
        }
        // If nothing is handling change detection batching, install the default handler.
        if (!autoChangeDetectionSubscription) {
            handleAutoChangeDetectionStatus(defaultAutoChangeDetectionHandler);
        }
        if (triggerBeforeAndAfter) {
            yield new Promise(resolve => autoChangeDetectionSubject.next({
                isDisabled: true,
                onDetectChangesNow: resolve,
            }));
            // The function passed in may throw (e.g. if the user wants to make an expectation of an error
            // being thrown. If this happens, we need to make sure we still re-enable change detection, so
            // we wrap it in a `finally` block.
            try {
                return yield fn();
            }
            finally {
                yield new Promise(resolve => autoChangeDetectionSubject.next({
                    isDisabled: false,
                    onDetectChangesNow: resolve,
                }));
            }
        }
        else {
            autoChangeDetectionSubject.next({ isDisabled: true });
            // The function passed in may throw (e.g. if the user wants to make an expectation of an error
            // being thrown. If this happens, we need to make sure we still re-enable change detection, so
            // we wrap it in a `finally` block.
            try {
                return yield fn();
            }
            finally {
                autoChangeDetectionSubject.next({ isDisabled: false });
            }
        }
    });
}
/**
 * Disables the harness system's auto change detection for the duration of the given function.
 * @param fn The function to disable auto change detection for.
 * @return The result of the given function.
 */
export function manualChangeDetection(fn) {
    return __awaiter(this, void 0, void 0, function* () {
        return batchChangeDetection(fn, false);
    });
}
export function parallel(values) {
    return __awaiter(this, void 0, void 0, function* () {
        return batchChangeDetection(() => Promise.all(values()), true);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbmdlLWRldGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGVzdGluZy9jaGFuZ2UtZGV0ZWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsZUFBZSxFQUFlLE1BQU0sTUFBTSxDQUFDO0FBY25ELDRGQUE0RjtBQUM1RixNQUFNLDBCQUEwQixHQUFHLElBQUksZUFBZSxDQUE0QjtJQUNoRixVQUFVLEVBQUUsS0FBSztDQUNsQixDQUFDLENBQUM7QUFFSCxnRUFBZ0U7QUFDaEUsSUFBSSwrQkFBb0QsQ0FBQztBQUV6RDs7OztHQUlHO0FBQ0gsU0FBUyxpQ0FBaUMsQ0FBQyxNQUFpQzs7SUFDMUUsTUFBQSxNQUFNLENBQUMsa0JBQWtCLCtDQUF6QixNQUFNLEVBQXdCO0FBQ2hDLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLCtCQUErQixDQUMzQyxPQUFvRDtJQUN0RCxxQ0FBcUMsRUFBRSxDQUFDO0lBQ3hDLCtCQUErQixHQUFHLDBCQUEwQixDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNsRixDQUFDO0FBRUQsMkZBQTJGO0FBQzNGLE1BQU0sVUFBVSxxQ0FBcUM7SUFDbkQsK0JBQStCLGFBQS9CLCtCQUErQix1QkFBL0IsK0JBQStCLENBQUUsV0FBVyxHQUFHO0lBQy9DLCtCQUErQixHQUFHLElBQUksQ0FBQztBQUN6QyxDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsU0FBZSxvQkFBb0IsQ0FBSSxFQUFvQixFQUFFLHFCQUE4Qjs7UUFDekYsOEVBQThFO1FBQzlFLElBQUksMEJBQTBCLENBQUMsUUFBUSxFQUFFLENBQUMsVUFBVSxFQUFFO1lBQ3BELE9BQU8sTUFBTSxFQUFFLEVBQUUsQ0FBQztTQUNuQjtRQUVELGlGQUFpRjtRQUNqRixJQUFJLENBQUMsK0JBQStCLEVBQUU7WUFDcEMsK0JBQStCLENBQUMsaUNBQWlDLENBQUMsQ0FBQztTQUNwRTtRQUVELElBQUkscUJBQXFCLEVBQUU7WUFDekIsTUFBTSxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQztnQkFDM0QsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLGtCQUFrQixFQUFFLE9BQXFCO2FBQzFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osOEZBQThGO1lBQzlGLDhGQUE4RjtZQUM5RixtQ0FBbUM7WUFDbkMsSUFBSTtnQkFDRixPQUFPLE1BQU0sRUFBRSxFQUFFLENBQUM7YUFDbkI7b0JBQVM7Z0JBQ1IsTUFBTSxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQztvQkFDM0QsVUFBVSxFQUFFLEtBQUs7b0JBQ2pCLGtCQUFrQixFQUFFLE9BQXFCO2lCQUMxQyxDQUFDLENBQUMsQ0FBQzthQUNMO1NBQ0Y7YUFBTTtZQUNMLDBCQUEwQixDQUFDLElBQUksQ0FBQyxFQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO1lBQ3BELDhGQUE4RjtZQUM5Riw4RkFBOEY7WUFDOUYsbUNBQW1DO1lBQ25DLElBQUk7Z0JBQ0YsT0FBTyxNQUFNLEVBQUUsRUFBRSxDQUFDO2FBQ25CO29CQUFTO2dCQUNSLDBCQUEwQixDQUFDLElBQUksQ0FBQyxFQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDO2FBQ3REO1NBQ0Y7SUFDSCxDQUFDO0NBQUE7QUFFRDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFnQixxQkFBcUIsQ0FBSSxFQUFvQjs7UUFDakUsT0FBTyxvQkFBb0IsQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDekMsQ0FBQztDQUFBO0FBMkRELE1BQU0sVUFBZ0IsUUFBUSxDQUFJLE1BQTBDOztRQUMxRSxPQUFPLG9CQUFvQixDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNqRSxDQUFDO0NBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtCZWhhdmlvclN1YmplY3QsIFN1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5cbi8qKiBSZXByZXNlbnRzIHRoZSBzdGF0dXMgb2YgYXV0byBjaGFuZ2UgZGV0ZWN0aW9uLiAqL1xuZXhwb3J0IGludGVyZmFjZSBBdXRvQ2hhbmdlRGV0ZWN0aW9uU3RhdHVzIHtcbiAgLyoqIFdoZXRoZXIgYXV0byBjaGFuZ2UgZGV0ZWN0aW9uIGlzIGRpc2FibGVkLiAqL1xuICBpc0Rpc2FibGVkOiBib29sZWFuO1xuICAvKipcbiAgICogQW4gb3B0aW9uYWwgY2FsbGJhY2ssIGlmIHByZXNlbnQgaXQgaW5kaWNhdGVzIHRoYXQgY2hhbmdlIGRldGVjdGlvbiBzaG91bGQgYmUgcnVuIGltbWVkaWF0ZWx5LFxuICAgKiB3aGlsZSBoYW5kbGluZyB0aGUgc3RhdHVzIGNoYW5nZS4gVGhlIGNhbGxiYWNrIHNob3VsZCB0aGVuIGJlIGNhbGxlZCBhcyBzb29uIGFzIGNoYW5nZVxuICAgKiBkZXRlY3Rpb24gaXMgZG9uZS5cbiAgICovXG4gIG9uRGV0ZWN0Q2hhbmdlc05vdz86ICgpID0+IHZvaWQ7XG59XG5cbi8qKiBTdWJqZWN0IHVzZWQgdG8gZGlzcGF0Y2ggYW5kIGxpc3RlbiBmb3IgY2hhbmdlcyB0byB0aGUgYXV0byBjaGFuZ2UgZGV0ZWN0aW9uIHN0YXR1cyAuICovXG5jb25zdCBhdXRvQ2hhbmdlRGV0ZWN0aW9uU3ViamVjdCA9IG5ldyBCZWhhdmlvclN1YmplY3Q8QXV0b0NoYW5nZURldGVjdGlvblN0YXR1cz4oe1xuICBpc0Rpc2FibGVkOiBmYWxzZVxufSk7XG5cbi8qKiBUaGUgY3VycmVudCBzdWJzY3JpcHRpb24gdG8gYGF1dG9DaGFuZ2VEZXRlY3Rpb25TdWJqZWN0YC4gKi9cbmxldCBhdXRvQ2hhbmdlRGV0ZWN0aW9uU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb24gfCBudWxsO1xuXG4vKipcbiAqIFRoZSBkZWZhdWx0IGhhbmRsZXIgZm9yIGF1dG8gY2hhbmdlIGRldGVjdGlvbiBzdGF0dXMgY2hhbmdlcy4gVGhpcyBoYW5kbGVyIHdpbGwgYmUgdXNlZCBpZiB0aGVcbiAqIHNwZWNpZmljIGVudmlyb25tZW50IGRvZXMgbm90IGluc3RhbGwgaXRzIG93bi5cbiAqIEBwYXJhbSBzdGF0dXMgVGhlIG5ldyBhdXRvIGNoYW5nZSBkZXRlY3Rpb24gc3RhdHVzLlxuICovXG5mdW5jdGlvbiBkZWZhdWx0QXV0b0NoYW5nZURldGVjdGlvbkhhbmRsZXIoc3RhdHVzOiBBdXRvQ2hhbmdlRGV0ZWN0aW9uU3RhdHVzKSB7XG4gIHN0YXR1cy5vbkRldGVjdENoYW5nZXNOb3c/LigpO1xufVxuXG4vKipcbiAqIEFsbG93cyBhIHRlc3QgYEhhcm5lc3NFbnZpcm9ubWVudGAgdG8gaW5zdGFsbCBpdHMgb3duIGhhbmRsZXIgZm9yIGF1dG8gY2hhbmdlIGRldGVjdGlvbiBzdGF0dXNcbiAqIGNoYW5nZXMuXG4gKiBAcGFyYW0gaGFuZGxlciBUaGUgaGFuZGxlciBmb3IgdGhlIGF1dG8gY2hhbmdlIGRldGVjdGlvbiBzdGF0dXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVBdXRvQ2hhbmdlRGV0ZWN0aW9uU3RhdHVzKFxuICAgIGhhbmRsZXI6IChzdGF0dXM6IEF1dG9DaGFuZ2VEZXRlY3Rpb25TdGF0dXMpID0+IHZvaWQpIHtcbiAgc3RvcEhhbmRsaW5nQXV0b0NoYW5nZURldGVjdGlvblN0YXR1cygpO1xuICBhdXRvQ2hhbmdlRGV0ZWN0aW9uU3Vic2NyaXB0aW9uID0gYXV0b0NoYW5nZURldGVjdGlvblN1YmplY3Quc3Vic2NyaWJlKGhhbmRsZXIpO1xufVxuXG4vKiogQWxsb3dzIGEgYEhhcm5lc3NFbnZpcm9ubWVudGAgdG8gc3RvcCBoYW5kbGluZyBhdXRvIGNoYW5nZSBkZXRlY3Rpb24gc3RhdHVzIGNoYW5nZXMuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcEhhbmRsaW5nQXV0b0NoYW5nZURldGVjdGlvblN0YXR1cygpIHtcbiAgYXV0b0NoYW5nZURldGVjdGlvblN1YnNjcmlwdGlvbj8udW5zdWJzY3JpYmUoKTtcbiAgYXV0b0NoYW5nZURldGVjdGlvblN1YnNjcmlwdGlvbiA9IG51bGw7XG59XG5cbi8qKlxuICogQmF0Y2hlcyB0b2dldGhlciB0cmlnZ2VyaW5nIG9mIGNoYW5nZSBkZXRlY3Rpb24gb3ZlciB0aGUgZHVyYXRpb24gb2YgdGhlIGdpdmVuIGZ1bmN0aW9uLlxuICogQHBhcmFtIGZuIFRoZSBmdW5jdGlvbiB0byBjYWxsIHdpdGggYmF0Y2hlZCBjaGFuZ2UgZGV0ZWN0aW9uLlxuICogQHBhcmFtIHRyaWdnZXJCZWZvcmVBbmRBZnRlciBPcHRpb25hbGx5IHRyaWdnZXIgY2hhbmdlIGRldGVjdGlvbiBvbmNlIGJlZm9yZSBhbmQgYWZ0ZXIgdGhlIGJhdGNoXG4gKiAgIG9wZXJhdGlvbi4gSWYgZmFsc2UsIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBub3QgYmUgdHJpZ2dlcmVkLlxuICogQHJldHVybiBUaGUgcmVzdWx0IG9mIHRoZSBnaXZlbiBmdW5jdGlvbi5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gYmF0Y2hDaGFuZ2VEZXRlY3Rpb248VD4oZm46ICgpID0+IFByb21pc2U8VD4sIHRyaWdnZXJCZWZvcmVBbmRBZnRlcjogYm9vbGVhbikge1xuICAvLyBJZiBjaGFuZ2UgZGV0ZWN0aW9uIGJhdGNoaW5nIGlzIGFscmVhZHkgaW4gcHJvZ3Jlc3MsIGp1c3QgcnVuIHRoZSBmdW5jdGlvbi5cbiAgaWYgKGF1dG9DaGFuZ2VEZXRlY3Rpb25TdWJqZWN0LmdldFZhbHVlKCkuaXNEaXNhYmxlZCkge1xuICAgIHJldHVybiBhd2FpdCBmbigpO1xuICB9XG5cbiAgLy8gSWYgbm90aGluZyBpcyBoYW5kbGluZyBjaGFuZ2UgZGV0ZWN0aW9uIGJhdGNoaW5nLCBpbnN0YWxsIHRoZSBkZWZhdWx0IGhhbmRsZXIuXG4gIGlmICghYXV0b0NoYW5nZURldGVjdGlvblN1YnNjcmlwdGlvbikge1xuICAgIGhhbmRsZUF1dG9DaGFuZ2VEZXRlY3Rpb25TdGF0dXMoZGVmYXVsdEF1dG9DaGFuZ2VEZXRlY3Rpb25IYW5kbGVyKTtcbiAgfVxuXG4gIGlmICh0cmlnZ2VyQmVmb3JlQW5kQWZ0ZXIpIHtcbiAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IGF1dG9DaGFuZ2VEZXRlY3Rpb25TdWJqZWN0Lm5leHQoe1xuICAgICAgaXNEaXNhYmxlZDogdHJ1ZSxcbiAgICAgIG9uRGV0ZWN0Q2hhbmdlc05vdzogcmVzb2x2ZSBhcyAoKSA9PiB2b2lkLFxuICAgIH0pKTtcbiAgICAvLyBUaGUgZnVuY3Rpb24gcGFzc2VkIGluIG1heSB0aHJvdyAoZS5nLiBpZiB0aGUgdXNlciB3YW50cyB0byBtYWtlIGFuIGV4cGVjdGF0aW9uIG9mIGFuIGVycm9yXG4gICAgLy8gYmVpbmcgdGhyb3duLiBJZiB0aGlzIGhhcHBlbnMsIHdlIG5lZWQgdG8gbWFrZSBzdXJlIHdlIHN0aWxsIHJlLWVuYWJsZSBjaGFuZ2UgZGV0ZWN0aW9uLCBzb1xuICAgIC8vIHdlIHdyYXAgaXQgaW4gYSBgZmluYWxseWAgYmxvY2suXG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCBmbigpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IGF1dG9DaGFuZ2VEZXRlY3Rpb25TdWJqZWN0Lm5leHQoe1xuICAgICAgICBpc0Rpc2FibGVkOiBmYWxzZSxcbiAgICAgICAgb25EZXRlY3RDaGFuZ2VzTm93OiByZXNvbHZlIGFzICgpID0+IHZvaWQsXG4gICAgICB9KSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGF1dG9DaGFuZ2VEZXRlY3Rpb25TdWJqZWN0Lm5leHQoe2lzRGlzYWJsZWQ6IHRydWV9KTtcbiAgICAvLyBUaGUgZnVuY3Rpb24gcGFzc2VkIGluIG1heSB0aHJvdyAoZS5nLiBpZiB0aGUgdXNlciB3YW50cyB0byBtYWtlIGFuIGV4cGVjdGF0aW9uIG9mIGFuIGVycm9yXG4gICAgLy8gYmVpbmcgdGhyb3duLiBJZiB0aGlzIGhhcHBlbnMsIHdlIG5lZWQgdG8gbWFrZSBzdXJlIHdlIHN0aWxsIHJlLWVuYWJsZSBjaGFuZ2UgZGV0ZWN0aW9uLCBzb1xuICAgIC8vIHdlIHdyYXAgaXQgaW4gYSBgZmluYWxseWAgYmxvY2suXG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCBmbigpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBhdXRvQ2hhbmdlRGV0ZWN0aW9uU3ViamVjdC5uZXh0KHtpc0Rpc2FibGVkOiBmYWxzZX0pO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIERpc2FibGVzIHRoZSBoYXJuZXNzIHN5c3RlbSdzIGF1dG8gY2hhbmdlIGRldGVjdGlvbiBmb3IgdGhlIGR1cmF0aW9uIG9mIHRoZSBnaXZlbiBmdW5jdGlvbi5cbiAqIEBwYXJhbSBmbiBUaGUgZnVuY3Rpb24gdG8gZGlzYWJsZSBhdXRvIGNoYW5nZSBkZXRlY3Rpb24gZm9yLlxuICogQHJldHVybiBUaGUgcmVzdWx0IG9mIHRoZSBnaXZlbiBmdW5jdGlvbi5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1hbnVhbENoYW5nZURldGVjdGlvbjxUPihmbjogKCkgPT4gUHJvbWlzZTxUPikge1xuICByZXR1cm4gYmF0Y2hDaGFuZ2VEZXRlY3Rpb24oZm4sIGZhbHNlKTtcbn1cblxuXG5cbi8qKlxuICogUmVzb2x2ZXMgdGhlIGdpdmVuIGxpc3Qgb2YgYXN5bmMgdmFsdWVzIGluIHBhcmFsbGVsIChpLmUuIHZpYSBQcm9taXNlLmFsbCkgd2hpbGUgYmF0Y2hpbmcgY2hhbmdlXG4gKiBkZXRlY3Rpb24gb3ZlciB0aGUgZW50aXJlIG9wZXJhdGlvbiBzdWNoIHRoYXQgY2hhbmdlIGRldGVjdGlvbiBvY2N1cnMgZXhhY3RseSBvbmNlIGJlZm9yZVxuICogcmVzb2x2aW5nIHRoZSB2YWx1ZXMgYW5kIG9uY2UgYWZ0ZXIuXG4gKiBAcGFyYW0gdmFsdWVzIEEgZ2V0dGVyIGZvciB0aGUgYXN5bmMgdmFsdWVzIHRvIHJlc29sdmUgaW4gcGFyYWxsZWwgd2l0aCBiYXRjaGVkIGNoYW5nZSBkZXRlY3Rpb24uXG4gKiBAcmV0dXJuIFRoZSByZXNvbHZlZCB2YWx1ZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJhbGxlbDxUMSwgVDIsIFQzLCBUNCwgVDU+KFxuICB2YWx1ZXM6ICgpID0+XG4gICAgICBbVDEgfCBQcm9taXNlTGlrZTxUMT4sIFQyIHwgUHJvbWlzZUxpa2U8VDI+LCBUMyB8IFByb21pc2VMaWtlPFQzPiwgVDQgfCBQcm9taXNlTGlrZTxUND4sXG4gICAgICAgVDUgfCBQcm9taXNlTGlrZTxUNT5cbiAgICAgIF0pOiBQcm9taXNlPFtUMSwgVDIsIFQzLCBUNCwgVDVdPjtcblxuLyoqXG4gKiBSZXNvbHZlcyB0aGUgZ2l2ZW4gbGlzdCBvZiBhc3luYyB2YWx1ZXMgaW4gcGFyYWxsZWwgKGkuZS4gdmlhIFByb21pc2UuYWxsKSB3aGlsZSBiYXRjaGluZyBjaGFuZ2VcbiAqIGRldGVjdGlvbiBvdmVyIHRoZSBlbnRpcmUgb3BlcmF0aW9uIHN1Y2ggdGhhdCBjaGFuZ2UgZGV0ZWN0aW9uIG9jY3VycyBleGFjdGx5IG9uY2UgYmVmb3JlXG4gKiByZXNvbHZpbmcgdGhlIHZhbHVlcyBhbmQgb25jZSBhZnRlci5cbiAqIEBwYXJhbSB2YWx1ZXMgQSBnZXR0ZXIgZm9yIHRoZSBhc3luYyB2YWx1ZXMgdG8gcmVzb2x2ZSBpbiBwYXJhbGxlbCB3aXRoIGJhdGNoZWQgY2hhbmdlIGRldGVjdGlvbi5cbiAqIEByZXR1cm4gVGhlIHJlc29sdmVkIHZhbHVlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcmFsbGVsPFQxLCBUMiwgVDMsIFQ0PihcbiAgdmFsdWVzOiAoKSA9PlxuICAgICAgW1QxIHwgUHJvbWlzZUxpa2U8VDE+LCBUMiB8IFByb21pc2VMaWtlPFQyPiwgVDMgfCBQcm9taXNlTGlrZTxUMz4sIFQ0IHwgUHJvbWlzZUxpa2U8VDQ+XSk6XG4gIFByb21pc2U8W1QxLCBUMiwgVDMsIFQ0XT47XG5cbi8qKlxuICogUmVzb2x2ZXMgdGhlIGdpdmVuIGxpc3Qgb2YgYXN5bmMgdmFsdWVzIGluIHBhcmFsbGVsIChpLmUuIHZpYSBQcm9taXNlLmFsbCkgd2hpbGUgYmF0Y2hpbmcgY2hhbmdlXG4gKiBkZXRlY3Rpb24gb3ZlciB0aGUgZW50aXJlIG9wZXJhdGlvbiBzdWNoIHRoYXQgY2hhbmdlIGRldGVjdGlvbiBvY2N1cnMgZXhhY3RseSBvbmNlIGJlZm9yZVxuICogcmVzb2x2aW5nIHRoZSB2YWx1ZXMgYW5kIG9uY2UgYWZ0ZXIuXG4gKiBAcGFyYW0gdmFsdWVzIEEgZ2V0dGVyIGZvciB0aGUgYXN5bmMgdmFsdWVzIHRvIHJlc29sdmUgaW4gcGFyYWxsZWwgd2l0aCBiYXRjaGVkIGNoYW5nZSBkZXRlY3Rpb24uXG4gKiBAcmV0dXJuIFRoZSByZXNvbHZlZCB2YWx1ZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJhbGxlbDxUMSwgVDIsIFQzPihcbiAgdmFsdWVzOiAoKSA9PiBbVDEgfCBQcm9taXNlTGlrZTxUMT4sIFQyIHwgUHJvbWlzZUxpa2U8VDI+LCBUMyB8IFByb21pc2VMaWtlPFQzPl0pOlxuICBQcm9taXNlPFtUMSwgVDIsIFQzXT47XG5cbi8qKlxuICogUmVzb2x2ZXMgdGhlIGdpdmVuIGxpc3Qgb2YgYXN5bmMgdmFsdWVzIGluIHBhcmFsbGVsIChpLmUuIHZpYSBQcm9taXNlLmFsbCkgd2hpbGUgYmF0Y2hpbmcgY2hhbmdlXG4gKiBkZXRlY3Rpb24gb3ZlciB0aGUgZW50aXJlIG9wZXJhdGlvbiBzdWNoIHRoYXQgY2hhbmdlIGRldGVjdGlvbiBvY2N1cnMgZXhhY3RseSBvbmNlIGJlZm9yZVxuICogcmVzb2x2aW5nIHRoZSB2YWx1ZXMgYW5kIG9uY2UgYWZ0ZXIuXG4gKiBAcGFyYW0gdmFsdWVzIEEgZ2V0dGVyIGZvciB0aGUgYXN5bmMgdmFsdWVzIHRvIHJlc29sdmUgaW4gcGFyYWxsZWwgd2l0aCBiYXRjaGVkIGNoYW5nZSBkZXRlY3Rpb24uXG4gKiBAcmV0dXJuIFRoZSByZXNvbHZlZCB2YWx1ZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJhbGxlbDxUMSwgVDI+KHZhbHVlczogKCkgPT4gW1QxIHwgUHJvbWlzZUxpa2U8VDE+LCBUMiB8IFByb21pc2VMaWtlPFQyPl0pOlxuICBQcm9taXNlPFtUMSwgVDJdPjtcblxuLyoqXG4gKiBSZXNvbHZlcyB0aGUgZ2l2ZW4gbGlzdCBvZiBhc3luYyB2YWx1ZXMgaW4gcGFyYWxsZWwgKGkuZS4gdmlhIFByb21pc2UuYWxsKSB3aGlsZSBiYXRjaGluZyBjaGFuZ2VcbiAqIGRldGVjdGlvbiBvdmVyIHRoZSBlbnRpcmUgb3BlcmF0aW9uIHN1Y2ggdGhhdCBjaGFuZ2UgZGV0ZWN0aW9uIG9jY3VycyBleGFjdGx5IG9uY2UgYmVmb3JlXG4gKiByZXNvbHZpbmcgdGhlIHZhbHVlcyBhbmQgb25jZSBhZnRlci5cbiAqIEBwYXJhbSB2YWx1ZXMgQSBnZXR0ZXIgZm9yIHRoZSBhc3luYyB2YWx1ZXMgdG8gcmVzb2x2ZSBpbiBwYXJhbGxlbCB3aXRoIGJhdGNoZWQgY2hhbmdlIGRldGVjdGlvbi5cbiAqIEByZXR1cm4gVGhlIHJlc29sdmVkIHZhbHVlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcmFsbGVsPFQ+KHZhbHVlczogKCkgPT4gKFQgfCBQcm9taXNlTGlrZTxUPilbXSk6IFByb21pc2U8VFtdPjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcmFsbGVsPFQ+KHZhbHVlczogKCkgPT4gSXRlcmFibGU8VCB8IFByb21pc2VMaWtlPFQ+Pik6IFByb21pc2U8VFtdPiB7XG4gIHJldHVybiBiYXRjaENoYW5nZURldGVjdGlvbigoKSA9PiBQcm9taXNlLmFsbCh2YWx1ZXMoKSksIHRydWUpO1xufVxuIl19