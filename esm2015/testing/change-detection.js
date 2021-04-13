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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbmdlLWRldGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGVzdGluZy9jaGFuZ2UtZGV0ZWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsZUFBZSxFQUFlLE1BQU0sTUFBTSxDQUFDO0FBY25ELDRGQUE0RjtBQUM1RixNQUFNLDBCQUEwQixHQUFHLElBQUksZUFBZSxDQUE0QjtJQUNoRixVQUFVLEVBQUUsS0FBSztDQUNsQixDQUFDLENBQUM7QUFFSCxnRUFBZ0U7QUFDaEUsSUFBSSwrQkFBb0QsQ0FBQztBQUV6RDs7OztHQUlHO0FBQ0gsU0FBUyxpQ0FBaUMsQ0FBQyxNQUFpQzs7SUFDMUUsTUFBQSxNQUFNLENBQUMsa0JBQWtCLCtDQUF6QixNQUFNLENBQXVCLENBQUM7QUFDaEMsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsK0JBQStCLENBQzNDLE9BQW9EO0lBQ3RELHFDQUFxQyxFQUFFLENBQUM7SUFDeEMsK0JBQStCLEdBQUcsMEJBQTBCLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2xGLENBQUM7QUFFRCwyRkFBMkY7QUFDM0YsTUFBTSxVQUFVLHFDQUFxQztJQUNuRCwrQkFBK0IsYUFBL0IsK0JBQStCLHVCQUEvQiwrQkFBK0IsQ0FBRSxXQUFXLEVBQUUsQ0FBQztJQUMvQywrQkFBK0IsR0FBRyxJQUFJLENBQUM7QUFDekMsQ0FBQztBQUVEOzs7Ozs7R0FNRztBQUNILFNBQWUsb0JBQW9CLENBQUksRUFBb0IsRUFBRSxxQkFBOEI7O1FBQ3pGLDhFQUE4RTtRQUM5RSxJQUFJLDBCQUEwQixDQUFDLFFBQVEsRUFBRSxDQUFDLFVBQVUsRUFBRTtZQUNwRCxPQUFPLE1BQU0sRUFBRSxFQUFFLENBQUM7U0FDbkI7UUFFRCxpRkFBaUY7UUFDakYsSUFBSSxDQUFDLCtCQUErQixFQUFFO1lBQ3BDLCtCQUErQixDQUFDLGlDQUFpQyxDQUFDLENBQUM7U0FDcEU7UUFFRCxJQUFJLHFCQUFxQixFQUFFO1lBQ3pCLE1BQU0sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLENBQUM7Z0JBQzNELFVBQVUsRUFBRSxJQUFJO2dCQUNoQixrQkFBa0IsRUFBRSxPQUFxQjthQUMxQyxDQUFDLENBQUMsQ0FBQztZQUNKLDhGQUE4RjtZQUM5Riw4RkFBOEY7WUFDOUYsbUNBQW1DO1lBQ25DLElBQUk7Z0JBQ0YsT0FBTyxNQUFNLEVBQUUsRUFBRSxDQUFDO2FBQ25CO29CQUFTO2dCQUNSLE1BQU0sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLENBQUM7b0JBQzNELFVBQVUsRUFBRSxLQUFLO29CQUNqQixrQkFBa0IsRUFBRSxPQUFxQjtpQkFDMUMsQ0FBQyxDQUFDLENBQUM7YUFDTDtTQUNGO2FBQU07WUFDTCwwQkFBMEIsQ0FBQyxJQUFJLENBQUMsRUFBQyxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztZQUNwRCw4RkFBOEY7WUFDOUYsOEZBQThGO1lBQzlGLG1DQUFtQztZQUNuQyxJQUFJO2dCQUNGLE9BQU8sTUFBTSxFQUFFLEVBQUUsQ0FBQzthQUNuQjtvQkFBUztnQkFDUiwwQkFBMEIsQ0FBQyxJQUFJLENBQUMsRUFBQyxVQUFVLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQzthQUN0RDtTQUNGO0lBQ0gsQ0FBQztDQUFBO0FBRUQ7Ozs7R0FJRztBQUNILE1BQU0sVUFBZ0IscUJBQXFCLENBQUksRUFBb0I7O1FBQ2pFLE9BQU8sb0JBQW9CLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3pDLENBQUM7Q0FBQTtBQTJERCxNQUFNLFVBQWdCLFFBQVEsQ0FBSSxNQUEwQzs7UUFDMUUsT0FBTyxvQkFBb0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDakUsQ0FBQztDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QmVoYXZpb3JTdWJqZWN0LCBTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuXG4vKiogUmVwcmVzZW50cyB0aGUgc3RhdHVzIG9mIGF1dG8gY2hhbmdlIGRldGVjdGlvbi4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQXV0b0NoYW5nZURldGVjdGlvblN0YXR1cyB7XG4gIC8qKiBXaGV0aGVyIGF1dG8gY2hhbmdlIGRldGVjdGlvbiBpcyBkaXNhYmxlZC4gKi9cbiAgaXNEaXNhYmxlZDogYm9vbGVhbjtcbiAgLyoqXG4gICAqIEFuIG9wdGlvbmFsIGNhbGxiYWNrLCBpZiBwcmVzZW50IGl0IGluZGljYXRlcyB0aGF0IGNoYW5nZSBkZXRlY3Rpb24gc2hvdWxkIGJlIHJ1biBpbW1lZGlhdGVseSxcbiAgICogd2hpbGUgaGFuZGxpbmcgdGhlIHN0YXR1cyBjaGFuZ2UuIFRoZSBjYWxsYmFjayBzaG91bGQgdGhlbiBiZSBjYWxsZWQgYXMgc29vbiBhcyBjaGFuZ2VcbiAgICogZGV0ZWN0aW9uIGlzIGRvbmUuXG4gICAqL1xuICBvbkRldGVjdENoYW5nZXNOb3c/OiAoKSA9PiB2b2lkO1xufVxuXG4vKiogU3ViamVjdCB1c2VkIHRvIGRpc3BhdGNoIGFuZCBsaXN0ZW4gZm9yIGNoYW5nZXMgdG8gdGhlIGF1dG8gY2hhbmdlIGRldGVjdGlvbiBzdGF0dXMgLiAqL1xuY29uc3QgYXV0b0NoYW5nZURldGVjdGlvblN1YmplY3QgPSBuZXcgQmVoYXZpb3JTdWJqZWN0PEF1dG9DaGFuZ2VEZXRlY3Rpb25TdGF0dXM+KHtcbiAgaXNEaXNhYmxlZDogZmFsc2Vcbn0pO1xuXG4vKiogVGhlIGN1cnJlbnQgc3Vic2NyaXB0aW9uIHRvIGBhdXRvQ2hhbmdlRGV0ZWN0aW9uU3ViamVjdGAuICovXG5sZXQgYXV0b0NoYW5nZURldGVjdGlvblN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uIHwgbnVsbDtcblxuLyoqXG4gKiBUaGUgZGVmYXVsdCBoYW5kbGVyIGZvciBhdXRvIGNoYW5nZSBkZXRlY3Rpb24gc3RhdHVzIGNoYW5nZXMuIFRoaXMgaGFuZGxlciB3aWxsIGJlIHVzZWQgaWYgdGhlXG4gKiBzcGVjaWZpYyBlbnZpcm9ubWVudCBkb2VzIG5vdCBpbnN0YWxsIGl0cyBvd24uXG4gKiBAcGFyYW0gc3RhdHVzIFRoZSBuZXcgYXV0byBjaGFuZ2UgZGV0ZWN0aW9uIHN0YXR1cy5cbiAqL1xuZnVuY3Rpb24gZGVmYXVsdEF1dG9DaGFuZ2VEZXRlY3Rpb25IYW5kbGVyKHN0YXR1czogQXV0b0NoYW5nZURldGVjdGlvblN0YXR1cykge1xuICBzdGF0dXMub25EZXRlY3RDaGFuZ2VzTm93Py4oKTtcbn1cblxuLyoqXG4gKiBBbGxvd3MgYSB0ZXN0IGBIYXJuZXNzRW52aXJvbm1lbnRgIHRvIGluc3RhbGwgaXRzIG93biBoYW5kbGVyIGZvciBhdXRvIGNoYW5nZSBkZXRlY3Rpb24gc3RhdHVzXG4gKiBjaGFuZ2VzLlxuICogQHBhcmFtIGhhbmRsZXIgVGhlIGhhbmRsZXIgZm9yIHRoZSBhdXRvIGNoYW5nZSBkZXRlY3Rpb24gc3RhdHVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFuZGxlQXV0b0NoYW5nZURldGVjdGlvblN0YXR1cyhcbiAgICBoYW5kbGVyOiAoc3RhdHVzOiBBdXRvQ2hhbmdlRGV0ZWN0aW9uU3RhdHVzKSA9PiB2b2lkKSB7XG4gIHN0b3BIYW5kbGluZ0F1dG9DaGFuZ2VEZXRlY3Rpb25TdGF0dXMoKTtcbiAgYXV0b0NoYW5nZURldGVjdGlvblN1YnNjcmlwdGlvbiA9IGF1dG9DaGFuZ2VEZXRlY3Rpb25TdWJqZWN0LnN1YnNjcmliZShoYW5kbGVyKTtcbn1cblxuLyoqIEFsbG93cyBhIGBIYXJuZXNzRW52aXJvbm1lbnRgIHRvIHN0b3AgaGFuZGxpbmcgYXV0byBjaGFuZ2UgZGV0ZWN0aW9uIHN0YXR1cyBjaGFuZ2VzLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3BIYW5kbGluZ0F1dG9DaGFuZ2VEZXRlY3Rpb25TdGF0dXMoKSB7XG4gIGF1dG9DaGFuZ2VEZXRlY3Rpb25TdWJzY3JpcHRpb24/LnVuc3Vic2NyaWJlKCk7XG4gIGF1dG9DaGFuZ2VEZXRlY3Rpb25TdWJzY3JpcHRpb24gPSBudWxsO1xufVxuXG4vKipcbiAqIEJhdGNoZXMgdG9nZXRoZXIgdHJpZ2dlcmluZyBvZiBjaGFuZ2UgZGV0ZWN0aW9uIG92ZXIgdGhlIGR1cmF0aW9uIG9mIHRoZSBnaXZlbiBmdW5jdGlvbi5cbiAqIEBwYXJhbSBmbiBUaGUgZnVuY3Rpb24gdG8gY2FsbCB3aXRoIGJhdGNoZWQgY2hhbmdlIGRldGVjdGlvbi5cbiAqIEBwYXJhbSB0cmlnZ2VyQmVmb3JlQW5kQWZ0ZXIgT3B0aW9uYWxseSB0cmlnZ2VyIGNoYW5nZSBkZXRlY3Rpb24gb25jZSBiZWZvcmUgYW5kIGFmdGVyIHRoZSBiYXRjaFxuICogICBvcGVyYXRpb24uIElmIGZhbHNlLCBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgbm90IGJlIHRyaWdnZXJlZC5cbiAqIEByZXR1cm4gVGhlIHJlc3VsdCBvZiB0aGUgZ2l2ZW4gZnVuY3Rpb24uXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGJhdGNoQ2hhbmdlRGV0ZWN0aW9uPFQ+KGZuOiAoKSA9PiBQcm9taXNlPFQ+LCB0cmlnZ2VyQmVmb3JlQW5kQWZ0ZXI6IGJvb2xlYW4pIHtcbiAgLy8gSWYgY2hhbmdlIGRldGVjdGlvbiBiYXRjaGluZyBpcyBhbHJlYWR5IGluIHByb2dyZXNzLCBqdXN0IHJ1biB0aGUgZnVuY3Rpb24uXG4gIGlmIChhdXRvQ2hhbmdlRGV0ZWN0aW9uU3ViamVjdC5nZXRWYWx1ZSgpLmlzRGlzYWJsZWQpIHtcbiAgICByZXR1cm4gYXdhaXQgZm4oKTtcbiAgfVxuXG4gIC8vIElmIG5vdGhpbmcgaXMgaGFuZGxpbmcgY2hhbmdlIGRldGVjdGlvbiBiYXRjaGluZywgaW5zdGFsbCB0aGUgZGVmYXVsdCBoYW5kbGVyLlxuICBpZiAoIWF1dG9DaGFuZ2VEZXRlY3Rpb25TdWJzY3JpcHRpb24pIHtcbiAgICBoYW5kbGVBdXRvQ2hhbmdlRGV0ZWN0aW9uU3RhdHVzKGRlZmF1bHRBdXRvQ2hhbmdlRGV0ZWN0aW9uSGFuZGxlcik7XG4gIH1cblxuICBpZiAodHJpZ2dlckJlZm9yZUFuZEFmdGVyKSB7XG4gICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBhdXRvQ2hhbmdlRGV0ZWN0aW9uU3ViamVjdC5uZXh0KHtcbiAgICAgIGlzRGlzYWJsZWQ6IHRydWUsXG4gICAgICBvbkRldGVjdENoYW5nZXNOb3c6IHJlc29sdmUgYXMgKCkgPT4gdm9pZCxcbiAgICB9KSk7XG4gICAgLy8gVGhlIGZ1bmN0aW9uIHBhc3NlZCBpbiBtYXkgdGhyb3cgKGUuZy4gaWYgdGhlIHVzZXIgd2FudHMgdG8gbWFrZSBhbiBleHBlY3RhdGlvbiBvZiBhbiBlcnJvclxuICAgIC8vIGJlaW5nIHRocm93bi4gSWYgdGhpcyBoYXBwZW5zLCB3ZSBuZWVkIHRvIG1ha2Ugc3VyZSB3ZSBzdGlsbCByZS1lbmFibGUgY2hhbmdlIGRldGVjdGlvbiwgc29cbiAgICAvLyB3ZSB3cmFwIGl0IGluIGEgYGZpbmFsbHlgIGJsb2NrLlxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgZm4oKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBhdXRvQ2hhbmdlRGV0ZWN0aW9uU3ViamVjdC5uZXh0KHtcbiAgICAgICAgaXNEaXNhYmxlZDogZmFsc2UsXG4gICAgICAgIG9uRGV0ZWN0Q2hhbmdlc05vdzogcmVzb2x2ZSBhcyAoKSA9PiB2b2lkLFxuICAgICAgfSkpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBhdXRvQ2hhbmdlRGV0ZWN0aW9uU3ViamVjdC5uZXh0KHtpc0Rpc2FibGVkOiB0cnVlfSk7XG4gICAgLy8gVGhlIGZ1bmN0aW9uIHBhc3NlZCBpbiBtYXkgdGhyb3cgKGUuZy4gaWYgdGhlIHVzZXIgd2FudHMgdG8gbWFrZSBhbiBleHBlY3RhdGlvbiBvZiBhbiBlcnJvclxuICAgIC8vIGJlaW5nIHRocm93bi4gSWYgdGhpcyBoYXBwZW5zLCB3ZSBuZWVkIHRvIG1ha2Ugc3VyZSB3ZSBzdGlsbCByZS1lbmFibGUgY2hhbmdlIGRldGVjdGlvbiwgc29cbiAgICAvLyB3ZSB3cmFwIGl0IGluIGEgYGZpbmFsbHlgIGJsb2NrLlxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgZm4oKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgYXV0b0NoYW5nZURldGVjdGlvblN1YmplY3QubmV4dCh7aXNEaXNhYmxlZDogZmFsc2V9KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBEaXNhYmxlcyB0aGUgaGFybmVzcyBzeXN0ZW0ncyBhdXRvIGNoYW5nZSBkZXRlY3Rpb24gZm9yIHRoZSBkdXJhdGlvbiBvZiB0aGUgZ2l2ZW4gZnVuY3Rpb24uXG4gKiBAcGFyYW0gZm4gVGhlIGZ1bmN0aW9uIHRvIGRpc2FibGUgYXV0byBjaGFuZ2UgZGV0ZWN0aW9uIGZvci5cbiAqIEByZXR1cm4gVGhlIHJlc3VsdCBvZiB0aGUgZ2l2ZW4gZnVuY3Rpb24uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtYW51YWxDaGFuZ2VEZXRlY3Rpb248VD4oZm46ICgpID0+IFByb21pc2U8VD4pIHtcbiAgcmV0dXJuIGJhdGNoQ2hhbmdlRGV0ZWN0aW9uKGZuLCBmYWxzZSk7XG59XG5cblxuXG4vKipcbiAqIFJlc29sdmVzIHRoZSBnaXZlbiBsaXN0IG9mIGFzeW5jIHZhbHVlcyBpbiBwYXJhbGxlbCAoaS5lLiB2aWEgUHJvbWlzZS5hbGwpIHdoaWxlIGJhdGNoaW5nIGNoYW5nZVxuICogZGV0ZWN0aW9uIG92ZXIgdGhlIGVudGlyZSBvcGVyYXRpb24gc3VjaCB0aGF0IGNoYW5nZSBkZXRlY3Rpb24gb2NjdXJzIGV4YWN0bHkgb25jZSBiZWZvcmVcbiAqIHJlc29sdmluZyB0aGUgdmFsdWVzIGFuZCBvbmNlIGFmdGVyLlxuICogQHBhcmFtIHZhbHVlcyBBIGdldHRlciBmb3IgdGhlIGFzeW5jIHZhbHVlcyB0byByZXNvbHZlIGluIHBhcmFsbGVsIHdpdGggYmF0Y2hlZCBjaGFuZ2UgZGV0ZWN0aW9uLlxuICogQHJldHVybiBUaGUgcmVzb2x2ZWQgdmFsdWVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyYWxsZWw8VDEsIFQyLCBUMywgVDQsIFQ1PihcbiAgdmFsdWVzOiAoKSA9PlxuICAgICAgW1QxIHwgUHJvbWlzZUxpa2U8VDE+LCBUMiB8IFByb21pc2VMaWtlPFQyPiwgVDMgfCBQcm9taXNlTGlrZTxUMz4sIFQ0IHwgUHJvbWlzZUxpa2U8VDQ+LFxuICAgICAgIFQ1IHwgUHJvbWlzZUxpa2U8VDU+XG4gICAgICBdKTogUHJvbWlzZTxbVDEsIFQyLCBUMywgVDQsIFQ1XT47XG5cbi8qKlxuICogUmVzb2x2ZXMgdGhlIGdpdmVuIGxpc3Qgb2YgYXN5bmMgdmFsdWVzIGluIHBhcmFsbGVsIChpLmUuIHZpYSBQcm9taXNlLmFsbCkgd2hpbGUgYmF0Y2hpbmcgY2hhbmdlXG4gKiBkZXRlY3Rpb24gb3ZlciB0aGUgZW50aXJlIG9wZXJhdGlvbiBzdWNoIHRoYXQgY2hhbmdlIGRldGVjdGlvbiBvY2N1cnMgZXhhY3RseSBvbmNlIGJlZm9yZVxuICogcmVzb2x2aW5nIHRoZSB2YWx1ZXMgYW5kIG9uY2UgYWZ0ZXIuXG4gKiBAcGFyYW0gdmFsdWVzIEEgZ2V0dGVyIGZvciB0aGUgYXN5bmMgdmFsdWVzIHRvIHJlc29sdmUgaW4gcGFyYWxsZWwgd2l0aCBiYXRjaGVkIGNoYW5nZSBkZXRlY3Rpb24uXG4gKiBAcmV0dXJuIFRoZSByZXNvbHZlZCB2YWx1ZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJhbGxlbDxUMSwgVDIsIFQzLCBUND4oXG4gIHZhbHVlczogKCkgPT5cbiAgICAgIFtUMSB8IFByb21pc2VMaWtlPFQxPiwgVDIgfCBQcm9taXNlTGlrZTxUMj4sIFQzIHwgUHJvbWlzZUxpa2U8VDM+LCBUNCB8IFByb21pc2VMaWtlPFQ0Pl0pOlxuICBQcm9taXNlPFtUMSwgVDIsIFQzLCBUNF0+O1xuXG4vKipcbiAqIFJlc29sdmVzIHRoZSBnaXZlbiBsaXN0IG9mIGFzeW5jIHZhbHVlcyBpbiBwYXJhbGxlbCAoaS5lLiB2aWEgUHJvbWlzZS5hbGwpIHdoaWxlIGJhdGNoaW5nIGNoYW5nZVxuICogZGV0ZWN0aW9uIG92ZXIgdGhlIGVudGlyZSBvcGVyYXRpb24gc3VjaCB0aGF0IGNoYW5nZSBkZXRlY3Rpb24gb2NjdXJzIGV4YWN0bHkgb25jZSBiZWZvcmVcbiAqIHJlc29sdmluZyB0aGUgdmFsdWVzIGFuZCBvbmNlIGFmdGVyLlxuICogQHBhcmFtIHZhbHVlcyBBIGdldHRlciBmb3IgdGhlIGFzeW5jIHZhbHVlcyB0byByZXNvbHZlIGluIHBhcmFsbGVsIHdpdGggYmF0Y2hlZCBjaGFuZ2UgZGV0ZWN0aW9uLlxuICogQHJldHVybiBUaGUgcmVzb2x2ZWQgdmFsdWVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyYWxsZWw8VDEsIFQyLCBUMz4oXG4gIHZhbHVlczogKCkgPT4gW1QxIHwgUHJvbWlzZUxpa2U8VDE+LCBUMiB8IFByb21pc2VMaWtlPFQyPiwgVDMgfCBQcm9taXNlTGlrZTxUMz5dKTpcbiAgUHJvbWlzZTxbVDEsIFQyLCBUM10+O1xuXG4vKipcbiAqIFJlc29sdmVzIHRoZSBnaXZlbiBsaXN0IG9mIGFzeW5jIHZhbHVlcyBpbiBwYXJhbGxlbCAoaS5lLiB2aWEgUHJvbWlzZS5hbGwpIHdoaWxlIGJhdGNoaW5nIGNoYW5nZVxuICogZGV0ZWN0aW9uIG92ZXIgdGhlIGVudGlyZSBvcGVyYXRpb24gc3VjaCB0aGF0IGNoYW5nZSBkZXRlY3Rpb24gb2NjdXJzIGV4YWN0bHkgb25jZSBiZWZvcmVcbiAqIHJlc29sdmluZyB0aGUgdmFsdWVzIGFuZCBvbmNlIGFmdGVyLlxuICogQHBhcmFtIHZhbHVlcyBBIGdldHRlciBmb3IgdGhlIGFzeW5jIHZhbHVlcyB0byByZXNvbHZlIGluIHBhcmFsbGVsIHdpdGggYmF0Y2hlZCBjaGFuZ2UgZGV0ZWN0aW9uLlxuICogQHJldHVybiBUaGUgcmVzb2x2ZWQgdmFsdWVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyYWxsZWw8VDEsIFQyPih2YWx1ZXM6ICgpID0+IFtUMSB8IFByb21pc2VMaWtlPFQxPiwgVDIgfCBQcm9taXNlTGlrZTxUMj5dKTpcbiAgUHJvbWlzZTxbVDEsIFQyXT47XG5cbi8qKlxuICogUmVzb2x2ZXMgdGhlIGdpdmVuIGxpc3Qgb2YgYXN5bmMgdmFsdWVzIGluIHBhcmFsbGVsIChpLmUuIHZpYSBQcm9taXNlLmFsbCkgd2hpbGUgYmF0Y2hpbmcgY2hhbmdlXG4gKiBkZXRlY3Rpb24gb3ZlciB0aGUgZW50aXJlIG9wZXJhdGlvbiBzdWNoIHRoYXQgY2hhbmdlIGRldGVjdGlvbiBvY2N1cnMgZXhhY3RseSBvbmNlIGJlZm9yZVxuICogcmVzb2x2aW5nIHRoZSB2YWx1ZXMgYW5kIG9uY2UgYWZ0ZXIuXG4gKiBAcGFyYW0gdmFsdWVzIEEgZ2V0dGVyIGZvciB0aGUgYXN5bmMgdmFsdWVzIHRvIHJlc29sdmUgaW4gcGFyYWxsZWwgd2l0aCBiYXRjaGVkIGNoYW5nZSBkZXRlY3Rpb24uXG4gKiBAcmV0dXJuIFRoZSByZXNvbHZlZCB2YWx1ZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJhbGxlbDxUPih2YWx1ZXM6ICgpID0+IChUIHwgUHJvbWlzZUxpa2U8VD4pW10pOiBQcm9taXNlPFRbXT47XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJhbGxlbDxUPih2YWx1ZXM6ICgpID0+IEl0ZXJhYmxlPFQgfCBQcm9taXNlTGlrZTxUPj4pOiBQcm9taXNlPFRbXT4ge1xuICByZXR1cm4gYmF0Y2hDaGFuZ2VEZXRlY3Rpb24oKCkgPT4gUHJvbWlzZS5hbGwodmFsdWVzKCkpLCB0cnVlKTtcbn1cbiJdfQ==