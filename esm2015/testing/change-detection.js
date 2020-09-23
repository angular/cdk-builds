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
            autoChangeDetectionSubject.subscribe(defaultAutoChangeDetectionHandler);
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
/**
 * Resolves the given list of async values in parallel (i.e. via Promise.all) while batching change
 * detection over the entire operation such that change detection occurs exactly once before
 * resolving the values and once after.
 * @param values A getter for the async values to resolve in parallel with batched change detection.
 * @return The resolved values.
 */
export function parallel(values) {
    return __awaiter(this, void 0, void 0, function* () {
        return batchChangeDetection(() => Promise.all(values()), true);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbmdlLWRldGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGVzdGluZy9jaGFuZ2UtZGV0ZWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsZUFBZSxFQUFlLE1BQU0sTUFBTSxDQUFDO0FBY25ELDRGQUE0RjtBQUM1RixNQUFNLDBCQUEwQixHQUFHLElBQUksZUFBZSxDQUE0QjtJQUNoRixVQUFVLEVBQUUsS0FBSztDQUNsQixDQUFDLENBQUM7QUFFSCxnRUFBZ0U7QUFDaEUsSUFBSSwrQkFBb0QsQ0FBQztBQUV6RDs7OztHQUlHO0FBQ0gsU0FBUyxpQ0FBaUMsQ0FBQyxNQUFpQzs7SUFDMUUsTUFBQSxNQUFNLENBQUMsa0JBQWtCLCtDQUF6QixNQUFNLEVBQXdCO0FBQ2hDLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLCtCQUErQixDQUMzQyxPQUFvRDtJQUN0RCxxQ0FBcUMsRUFBRSxDQUFDO0lBQ3hDLCtCQUErQixHQUFHLDBCQUEwQixDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNsRixDQUFDO0FBRUQsMkZBQTJGO0FBQzNGLE1BQU0sVUFBVSxxQ0FBcUM7SUFDbkQsK0JBQStCLGFBQS9CLCtCQUErQix1QkFBL0IsK0JBQStCLENBQUUsV0FBVyxHQUFHO0lBQy9DLCtCQUErQixHQUFHLElBQUksQ0FBQztBQUN6QyxDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsU0FBZSxvQkFBb0IsQ0FBSSxFQUFvQixFQUFFLHFCQUE4Qjs7UUFDekYsOEVBQThFO1FBQzlFLElBQUksMEJBQTBCLENBQUMsUUFBUSxFQUFFLENBQUMsVUFBVSxFQUFFO1lBQ3BELE9BQU8sTUFBTSxFQUFFLEVBQUUsQ0FBQztTQUNuQjtRQUVELGlGQUFpRjtRQUNqRixJQUFJLENBQUMsK0JBQStCLEVBQUU7WUFDcEMsMEJBQTBCLENBQUMsU0FBUyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7U0FDekU7UUFFRCxJQUFJLHFCQUFxQixFQUFFO1lBQ3pCLE1BQU0sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLENBQUM7Z0JBQzNELFVBQVUsRUFBRSxJQUFJO2dCQUNoQixrQkFBa0IsRUFBRSxPQUFPO2FBQzVCLENBQUMsQ0FBQyxDQUFDO1lBQ0osOEZBQThGO1lBQzlGLDhGQUE4RjtZQUM5RixtQ0FBbUM7WUFDbkMsSUFBSTtnQkFDRixPQUFPLE1BQU0sRUFBRSxFQUFFLENBQUM7YUFDbkI7b0JBQVM7Z0JBQ1IsTUFBTSxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQztvQkFDM0QsVUFBVSxFQUFFLEtBQUs7b0JBQ2pCLGtCQUFrQixFQUFFLE9BQU87aUJBQzVCLENBQUMsQ0FBQyxDQUFDO2FBQ0w7U0FDRjthQUFNO1lBQ0wsMEJBQTBCLENBQUMsSUFBSSxDQUFDLEVBQUMsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7WUFDcEQsOEZBQThGO1lBQzlGLDhGQUE4RjtZQUM5RixtQ0FBbUM7WUFDbkMsSUFBSTtnQkFDRixPQUFPLE1BQU0sRUFBRSxFQUFFLENBQUM7YUFDbkI7b0JBQVM7Z0JBQ1IsMEJBQTBCLENBQUMsSUFBSSxDQUFDLEVBQUMsVUFBVSxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUM7YUFDdEQ7U0FDRjtJQUNILENBQUM7Q0FBQTtBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLFVBQWdCLHFCQUFxQixDQUFJLEVBQW9COztRQUNqRSxPQUFPLG9CQUFvQixDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN6QyxDQUFDO0NBQUE7QUFFRDs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQWdCLFFBQVEsQ0FBSSxNQUEwQzs7UUFDMUUsT0FBTyxvQkFBb0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDakUsQ0FBQztDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QmVoYXZpb3JTdWJqZWN0LCBTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuXG4vKiogUmVwcmVzZW50cyB0aGUgc3RhdHVzIG9mIGF1dG8gY2hhbmdlIGRldGVjdGlvbi4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQXV0b0NoYW5nZURldGVjdGlvblN0YXR1cyB7XG4gIC8qKiBXaGV0aGVyIGF1dG8gY2hhbmdlIGRldGVjdGlvbiBpcyBkaXNhYmxlZC4gKi9cbiAgaXNEaXNhYmxlZDogYm9vbGVhbjtcbiAgLyoqXG4gICAqIEFuIG9wdGlvbmFsIGNhbGxiYWNrLCBpZiBwcmVzZW50IGl0IGluZGljYXRlcyB0aGF0IGNoYW5nZSBkZXRlY3Rpb24gc2hvdWxkIGJlIHJ1biBpbW1lZGlhdGVseSxcbiAgICogd2hpbGUgaGFuZGxpbmcgdGhlIHN0YXR1cyBjaGFuZ2UuIFRoZSBjYWxsYmFjayBzaG91bGQgdGhlbiBiZSBjYWxsZWQgYXMgc29vbiBhcyBjaGFuZ2VcbiAgICogZGV0ZWN0aW9uIGlzIGRvbmUuXG4gICAqL1xuICBvbkRldGVjdENoYW5nZXNOb3c/OiAoKSA9PiB2b2lkO1xufVxuXG4vKiogU3ViamVjdCB1c2VkIHRvIGRpc3BhdGNoIGFuZCBsaXN0ZW4gZm9yIGNoYW5nZXMgdG8gdGhlIGF1dG8gY2hhbmdlIGRldGVjdGlvbiBzdGF0dXMgLiAqL1xuY29uc3QgYXV0b0NoYW5nZURldGVjdGlvblN1YmplY3QgPSBuZXcgQmVoYXZpb3JTdWJqZWN0PEF1dG9DaGFuZ2VEZXRlY3Rpb25TdGF0dXM+KHtcbiAgaXNEaXNhYmxlZDogZmFsc2Vcbn0pO1xuXG4vKiogVGhlIGN1cnJlbnQgc3Vic2NyaXB0aW9uIHRvIGBhdXRvQ2hhbmdlRGV0ZWN0aW9uU3ViamVjdGAuICovXG5sZXQgYXV0b0NoYW5nZURldGVjdGlvblN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uIHwgbnVsbDtcblxuLyoqXG4gKiBUaGUgZGVmYXVsdCBoYW5kbGVyIGZvciBhdXRvIGNoYW5nZSBkZXRlY3Rpb24gc3RhdHVzIGNoYW5nZXMuIFRoaXMgaGFuZGxlciB3aWxsIGJlIHVzZWQgaWYgdGhlXG4gKiBzcGVjaWZpYyBlbnZpcm9ubWVudCBkb2VzIG5vdCBpbnN0YWxsIGl0cyBvd24uXG4gKiBAcGFyYW0gc3RhdHVzIFRoZSBuZXcgYXV0byBjaGFuZ2UgZGV0ZWN0aW9uIHN0YXR1cy5cbiAqL1xuZnVuY3Rpb24gZGVmYXVsdEF1dG9DaGFuZ2VEZXRlY3Rpb25IYW5kbGVyKHN0YXR1czogQXV0b0NoYW5nZURldGVjdGlvblN0YXR1cykge1xuICBzdGF0dXMub25EZXRlY3RDaGFuZ2VzTm93Py4oKTtcbn1cblxuLyoqXG4gKiBBbGxvd3MgYSB0ZXN0IGBIYXJuZXNzRW52aXJvbm1lbnRgIHRvIGluc3RhbGwgaXRzIG93biBoYW5kbGVyIGZvciBhdXRvIGNoYW5nZSBkZXRlY3Rpb24gc3RhdHVzXG4gKiBjaGFuZ2VzLlxuICogQHBhcmFtIGhhbmRsZXIgVGhlIGhhbmRsZXIgZm9yIHRoZSBhdXRvIGNoYW5nZSBkZXRlY3Rpb24gc3RhdHVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFuZGxlQXV0b0NoYW5nZURldGVjdGlvblN0YXR1cyhcbiAgICBoYW5kbGVyOiAoc3RhdHVzOiBBdXRvQ2hhbmdlRGV0ZWN0aW9uU3RhdHVzKSA9PiB2b2lkKSB7XG4gIHN0b3BIYW5kbGluZ0F1dG9DaGFuZ2VEZXRlY3Rpb25TdGF0dXMoKTtcbiAgYXV0b0NoYW5nZURldGVjdGlvblN1YnNjcmlwdGlvbiA9IGF1dG9DaGFuZ2VEZXRlY3Rpb25TdWJqZWN0LnN1YnNjcmliZShoYW5kbGVyKTtcbn1cblxuLyoqIEFsbG93cyBhIGBIYXJuZXNzRW52aXJvbm1lbnRgIHRvIHN0b3AgaGFuZGxpbmcgYXV0byBjaGFuZ2UgZGV0ZWN0aW9uIHN0YXR1cyBjaGFuZ2VzLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3BIYW5kbGluZ0F1dG9DaGFuZ2VEZXRlY3Rpb25TdGF0dXMoKSB7XG4gIGF1dG9DaGFuZ2VEZXRlY3Rpb25TdWJzY3JpcHRpb24/LnVuc3Vic2NyaWJlKCk7XG4gIGF1dG9DaGFuZ2VEZXRlY3Rpb25TdWJzY3JpcHRpb24gPSBudWxsO1xufVxuXG4vKipcbiAqIEJhdGNoZXMgdG9nZXRoZXIgdHJpZ2dlcmluZyBvZiBjaGFuZ2UgZGV0ZWN0aW9uIG92ZXIgdGhlIGR1cmF0aW9uIG9mIHRoZSBnaXZlbiBmdW5jdGlvbi5cbiAqIEBwYXJhbSBmbiBUaGUgZnVuY3Rpb24gdG8gY2FsbCB3aXRoIGJhdGNoZWQgY2hhbmdlIGRldGVjdGlvbi5cbiAqIEBwYXJhbSB0cmlnZ2VyQmVmb3JlQW5kQWZ0ZXIgT3B0aW9uYWxseSB0cmlnZ2VyIGNoYW5nZSBkZXRlY3Rpb24gb25jZSBiZWZvcmUgYW5kIGFmdGVyIHRoZSBiYXRjaFxuICogICBvcGVyYXRpb24uIElmIGZhbHNlLCBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgbm90IGJlIHRyaWdnZXJlZC5cbiAqIEByZXR1cm4gVGhlIHJlc3VsdCBvZiB0aGUgZ2l2ZW4gZnVuY3Rpb24uXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGJhdGNoQ2hhbmdlRGV0ZWN0aW9uPFQ+KGZuOiAoKSA9PiBQcm9taXNlPFQ+LCB0cmlnZ2VyQmVmb3JlQW5kQWZ0ZXI6IGJvb2xlYW4pIHtcbiAgLy8gSWYgY2hhbmdlIGRldGVjdGlvbiBiYXRjaGluZyBpcyBhbHJlYWR5IGluIHByb2dyZXNzLCBqdXN0IHJ1biB0aGUgZnVuY3Rpb24uXG4gIGlmIChhdXRvQ2hhbmdlRGV0ZWN0aW9uU3ViamVjdC5nZXRWYWx1ZSgpLmlzRGlzYWJsZWQpIHtcbiAgICByZXR1cm4gYXdhaXQgZm4oKTtcbiAgfVxuXG4gIC8vIElmIG5vdGhpbmcgaXMgaGFuZGxpbmcgY2hhbmdlIGRldGVjdGlvbiBiYXRjaGluZywgaW5zdGFsbCB0aGUgZGVmYXVsdCBoYW5kbGVyLlxuICBpZiAoIWF1dG9DaGFuZ2VEZXRlY3Rpb25TdWJzY3JpcHRpb24pIHtcbiAgICBhdXRvQ2hhbmdlRGV0ZWN0aW9uU3ViamVjdC5zdWJzY3JpYmUoZGVmYXVsdEF1dG9DaGFuZ2VEZXRlY3Rpb25IYW5kbGVyKTtcbiAgfVxuXG4gIGlmICh0cmlnZ2VyQmVmb3JlQW5kQWZ0ZXIpIHtcbiAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IGF1dG9DaGFuZ2VEZXRlY3Rpb25TdWJqZWN0Lm5leHQoe1xuICAgICAgaXNEaXNhYmxlZDogdHJ1ZSxcbiAgICAgIG9uRGV0ZWN0Q2hhbmdlc05vdzogcmVzb2x2ZSxcbiAgICB9KSk7XG4gICAgLy8gVGhlIGZ1bmN0aW9uIHBhc3NlZCBpbiBtYXkgdGhyb3cgKGUuZy4gaWYgdGhlIHVzZXIgd2FudHMgdG8gbWFrZSBhbiBleHBlY3RhdGlvbiBvZiBhbiBlcnJvclxuICAgIC8vIGJlaW5nIHRocm93bi4gSWYgdGhpcyBoYXBwZW5zLCB3ZSBuZWVkIHRvIG1ha2Ugc3VyZSB3ZSBzdGlsbCByZS1lbmFibGUgY2hhbmdlIGRldGVjdGlvbiwgc29cbiAgICAvLyB3ZSB3cmFwIGl0IGluIGEgYGZpbmFsbHlgIGJsb2NrLlxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgZm4oKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBhdXRvQ2hhbmdlRGV0ZWN0aW9uU3ViamVjdC5uZXh0KHtcbiAgICAgICAgaXNEaXNhYmxlZDogZmFsc2UsXG4gICAgICAgIG9uRGV0ZWN0Q2hhbmdlc05vdzogcmVzb2x2ZSxcbiAgICAgIH0pKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgYXV0b0NoYW5nZURldGVjdGlvblN1YmplY3QubmV4dCh7aXNEaXNhYmxlZDogdHJ1ZX0pO1xuICAgIC8vIFRoZSBmdW5jdGlvbiBwYXNzZWQgaW4gbWF5IHRocm93IChlLmcuIGlmIHRoZSB1c2VyIHdhbnRzIHRvIG1ha2UgYW4gZXhwZWN0YXRpb24gb2YgYW4gZXJyb3JcbiAgICAvLyBiZWluZyB0aHJvd24uIElmIHRoaXMgaGFwcGVucywgd2UgbmVlZCB0byBtYWtlIHN1cmUgd2Ugc3RpbGwgcmUtZW5hYmxlIGNoYW5nZSBkZXRlY3Rpb24sIHNvXG4gICAgLy8gd2Ugd3JhcCBpdCBpbiBhIGBmaW5hbGx5YCBibG9jay5cbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IGZuKCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGF1dG9DaGFuZ2VEZXRlY3Rpb25TdWJqZWN0Lm5leHQoe2lzRGlzYWJsZWQ6IGZhbHNlfSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRGlzYWJsZXMgdGhlIGhhcm5lc3Mgc3lzdGVtJ3MgYXV0byBjaGFuZ2UgZGV0ZWN0aW9uIGZvciB0aGUgZHVyYXRpb24gb2YgdGhlIGdpdmVuIGZ1bmN0aW9uLlxuICogQHBhcmFtIGZuIFRoZSBmdW5jdGlvbiB0byBkaXNhYmxlIGF1dG8gY2hhbmdlIGRldGVjdGlvbiBmb3IuXG4gKiBAcmV0dXJuIFRoZSByZXN1bHQgb2YgdGhlIGdpdmVuIGZ1bmN0aW9uLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWFudWFsQ2hhbmdlRGV0ZWN0aW9uPFQ+KGZuOiAoKSA9PiBQcm9taXNlPFQ+KSB7XG4gIHJldHVybiBiYXRjaENoYW5nZURldGVjdGlvbihmbiwgZmFsc2UpO1xufVxuXG4vKipcbiAqIFJlc29sdmVzIHRoZSBnaXZlbiBsaXN0IG9mIGFzeW5jIHZhbHVlcyBpbiBwYXJhbGxlbCAoaS5lLiB2aWEgUHJvbWlzZS5hbGwpIHdoaWxlIGJhdGNoaW5nIGNoYW5nZVxuICogZGV0ZWN0aW9uIG92ZXIgdGhlIGVudGlyZSBvcGVyYXRpb24gc3VjaCB0aGF0IGNoYW5nZSBkZXRlY3Rpb24gb2NjdXJzIGV4YWN0bHkgb25jZSBiZWZvcmVcbiAqIHJlc29sdmluZyB0aGUgdmFsdWVzIGFuZCBvbmNlIGFmdGVyLlxuICogQHBhcmFtIHZhbHVlcyBBIGdldHRlciBmb3IgdGhlIGFzeW5jIHZhbHVlcyB0byByZXNvbHZlIGluIHBhcmFsbGVsIHdpdGggYmF0Y2hlZCBjaGFuZ2UgZGV0ZWN0aW9uLlxuICogQHJldHVybiBUaGUgcmVzb2x2ZWQgdmFsdWVzLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyYWxsZWw8VD4odmFsdWVzOiAoKSA9PiBJdGVyYWJsZTxUIHwgUHJvbWlzZUxpa2U8VD4+KSB7XG4gIHJldHVybiBiYXRjaENoYW5nZURldGVjdGlvbigoKSA9PiBQcm9taXNlLmFsbCh2YWx1ZXMoKSksIHRydWUpO1xufVxuIl19