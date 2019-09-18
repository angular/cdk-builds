/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/cdk/testing/dispatch-events", ["require", "exports", "@angular/cdk/testing/event-objects"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var event_objects_1 = require("@angular/cdk/testing/event-objects");
    /**
     * Utility to dispatch any event on a Node.
     * @docs-private
     */
    function dispatchEvent(node, event) {
        node.dispatchEvent(event);
        return event;
    }
    exports.dispatchEvent = dispatchEvent;
    /**
     * Shorthand to dispatch a fake event on a specified node.
     * @docs-private
     */
    function dispatchFakeEvent(node, type, canBubble) {
        return dispatchEvent(node, event_objects_1.createFakeEvent(type, canBubble));
    }
    exports.dispatchFakeEvent = dispatchFakeEvent;
    /**
     * Shorthand to dispatch a keyboard event with a specified key code.
     * @docs-private
     */
    function dispatchKeyboardEvent(node, type, keyCode, key, target, modifiers) {
        return dispatchEvent(node, event_objects_1.createKeyboardEvent(type, keyCode, key, target, modifiers));
    }
    exports.dispatchKeyboardEvent = dispatchKeyboardEvent;
    /**
     * Shorthand to dispatch a mouse event on the specified coordinates.
     * @docs-private
     */
    function dispatchMouseEvent(node, type, x, y, event) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        if (event === void 0) { event = event_objects_1.createMouseEvent(type, x, y); }
        return dispatchEvent(node, event);
    }
    exports.dispatchMouseEvent = dispatchMouseEvent;
    /**
     * Shorthand to dispatch a touch event on the specified coordinates.
     * @docs-private
     */
    function dispatchTouchEvent(node, type, x, y) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        return dispatchEvent(node, event_objects_1.createTouchEvent(type, x, y));
    }
    exports.dispatchTouchEvent = dispatchTouchEvent;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlzcGF0Y2gtZXZlbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL2Rpc3BhdGNoLWV2ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILG9FQU15QjtJQUV6Qjs7O09BR0c7SUFDSCxTQUFnQixhQUFhLENBQUMsSUFBbUIsRUFBRSxLQUFZO1FBQzdELElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUIsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBSEQsc0NBR0M7SUFFRDs7O09BR0c7SUFDSCxTQUFnQixpQkFBaUIsQ0FBQyxJQUFtQixFQUFFLElBQVksRUFBRSxTQUFtQjtRQUN0RixPQUFPLGFBQWEsQ0FBQyxJQUFJLEVBQUUsK0JBQWUsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBRkQsOENBRUM7SUFFRDs7O09BR0c7SUFDSCxTQUFnQixxQkFBcUIsQ0FBQyxJQUFVLEVBQUUsSUFBWSxFQUFFLE9BQWdCLEVBQUUsR0FBWSxFQUN4RCxNQUFnQixFQUFFLFNBQXdCO1FBQzlFLE9BQU8sYUFBYSxDQUFDLElBQUksRUFDckIsbUNBQW1CLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFrQixDQUFDO0lBQ25GLENBQUM7SUFKRCxzREFJQztJQUVEOzs7T0FHRztJQUNILFNBQWdCLGtCQUFrQixDQUFDLElBQVUsRUFBRSxJQUFZLEVBQUUsQ0FBSyxFQUFFLENBQUssRUFDdkUsS0FBb0M7UUFEdUIsa0JBQUEsRUFBQSxLQUFLO1FBQUUsa0JBQUEsRUFBQSxLQUFLO1FBQ3ZFLHNCQUFBLEVBQUEsUUFBUSxnQ0FBZ0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNwQyxPQUFPLGFBQWEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFlLENBQUM7SUFDbEQsQ0FBQztJQUhELGdEQUdDO0lBRUQ7OztPQUdHO0lBQ0gsU0FBZ0Isa0JBQWtCLENBQUMsSUFBVSxFQUFFLElBQVksRUFBRSxDQUFLLEVBQUUsQ0FBSztRQUFaLGtCQUFBLEVBQUEsS0FBSztRQUFFLGtCQUFBLEVBQUEsS0FBSztRQUN2RSxPQUFPLGFBQWEsQ0FBQyxJQUFJLEVBQUUsZ0NBQWdCLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNELENBQUM7SUFGRCxnREFFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBjcmVhdGVGYWtlRXZlbnQsXG4gIGNyZWF0ZUtleWJvYXJkRXZlbnQsXG4gIGNyZWF0ZU1vdXNlRXZlbnQsXG4gIGNyZWF0ZVRvdWNoRXZlbnQsXG4gIE1vZGlmaWVyS2V5c1xufSBmcm9tICcuL2V2ZW50LW9iamVjdHMnO1xuXG4vKipcbiAqIFV0aWxpdHkgdG8gZGlzcGF0Y2ggYW55IGV2ZW50IG9uIGEgTm9kZS5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpc3BhdGNoRXZlbnQobm9kZTogTm9kZSB8IFdpbmRvdywgZXZlbnQ6IEV2ZW50KTogRXZlbnQge1xuICBub2RlLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICByZXR1cm4gZXZlbnQ7XG59XG5cbi8qKlxuICogU2hvcnRoYW5kIHRvIGRpc3BhdGNoIGEgZmFrZSBldmVudCBvbiBhIHNwZWNpZmllZCBub2RlLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlzcGF0Y2hGYWtlRXZlbnQobm9kZTogTm9kZSB8IFdpbmRvdywgdHlwZTogc3RyaW5nLCBjYW5CdWJibGU/OiBib29sZWFuKTogRXZlbnQge1xuICByZXR1cm4gZGlzcGF0Y2hFdmVudChub2RlLCBjcmVhdGVGYWtlRXZlbnQodHlwZSwgY2FuQnViYmxlKSk7XG59XG5cbi8qKlxuICogU2hvcnRoYW5kIHRvIGRpc3BhdGNoIGEga2V5Ym9hcmQgZXZlbnQgd2l0aCBhIHNwZWNpZmllZCBrZXkgY29kZS5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpc3BhdGNoS2V5Ym9hcmRFdmVudChub2RlOiBOb2RlLCB0eXBlOiBzdHJpbmcsIGtleUNvZGU/OiBudW1iZXIsIGtleT86IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0PzogRWxlbWVudCwgbW9kaWZpZXJzPzogTW9kaWZpZXJLZXlzKTogS2V5Ym9hcmRFdmVudCB7XG4gIHJldHVybiBkaXNwYXRjaEV2ZW50KG5vZGUsXG4gICAgICBjcmVhdGVLZXlib2FyZEV2ZW50KHR5cGUsIGtleUNvZGUsIGtleSwgdGFyZ2V0LCBtb2RpZmllcnMpKSBhcyBLZXlib2FyZEV2ZW50O1xufVxuXG4vKipcbiAqIFNob3J0aGFuZCB0byBkaXNwYXRjaCBhIG1vdXNlIGV2ZW50IG9uIHRoZSBzcGVjaWZpZWQgY29vcmRpbmF0ZXMuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXNwYXRjaE1vdXNlRXZlbnQobm9kZTogTm9kZSwgdHlwZTogc3RyaW5nLCB4ID0gMCwgeSA9IDAsXG4gIGV2ZW50ID0gY3JlYXRlTW91c2VFdmVudCh0eXBlLCB4LCB5KSk6IE1vdXNlRXZlbnQge1xuICByZXR1cm4gZGlzcGF0Y2hFdmVudChub2RlLCBldmVudCkgYXMgTW91c2VFdmVudDtcbn1cblxuLyoqXG4gKiBTaG9ydGhhbmQgdG8gZGlzcGF0Y2ggYSB0b3VjaCBldmVudCBvbiB0aGUgc3BlY2lmaWVkIGNvb3JkaW5hdGVzLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlzcGF0Y2hUb3VjaEV2ZW50KG5vZGU6IE5vZGUsIHR5cGU6IHN0cmluZywgeCA9IDAsIHkgPSAwKSB7XG4gIHJldHVybiBkaXNwYXRjaEV2ZW50KG5vZGUsIGNyZWF0ZVRvdWNoRXZlbnQodHlwZSwgeCwgeSkpO1xufVxuIl19