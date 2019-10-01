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
        define("@angular/cdk/testing/event-objects", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Creates a browser MouseEvent with the specified options.
     * @docs-private
     */
    function createMouseEvent(type, x, y, button) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        if (button === void 0) { button = 0; }
        var event = document.createEvent('MouseEvent');
        var originalPreventDefault = event.preventDefault;
        event.initMouseEvent(type, true, /* canBubble */ true, /* cancelable */ window, /* view */ 0, /* detail */ x, /* screenX */ y, /* screenY */ x, /* clientX */ y, /* clientY */ false, /* ctrlKey */ false, /* altKey */ false, /* shiftKey */ false, /* metaKey */ button, /* button */ null /* relatedTarget */);
        // `initMouseEvent` doesn't allow us to pass the `buttons` and
        // defaults it to 0 which looks like a fake event.
        Object.defineProperty(event, 'buttons', { get: function () { return 1; } });
        // IE won't set `defaultPrevented` on synthetic events so we need to do it manually.
        event.preventDefault = function () {
            Object.defineProperty(event, 'defaultPrevented', { get: function () { return true; } });
            return originalPreventDefault.apply(this, arguments);
        };
        return event;
    }
    exports.createMouseEvent = createMouseEvent;
    /**
     * Creates a browser TouchEvent with the specified pointer coordinates.
     * @docs-private
     */
    function createTouchEvent(type, pageX, pageY) {
        if (pageX === void 0) { pageX = 0; }
        if (pageY === void 0) { pageY = 0; }
        // In favor of creating events that work for most of the browsers, the event is created
        // as a basic UI Event. The necessary details for the event will be set manually.
        var event = document.createEvent('UIEvent');
        var touchDetails = { pageX: pageX, pageY: pageY };
        // TS3.6 removes the initUIEvent method and suggests porting to "new UIEvent()".
        event.initUIEvent(type, true, true, window, 0);
        // Most of the browsers don't have a "initTouchEvent" method that can be used to define
        // the touch details.
        Object.defineProperties(event, {
            touches: { value: [touchDetails] },
            targetTouches: { value: [touchDetails] },
            changedTouches: { value: [touchDetails] }
        });
        return event;
    }
    exports.createTouchEvent = createTouchEvent;
    /**
     * Dispatches a keydown event from an element.
     * @docs-private
     */
    function createKeyboardEvent(type, keyCode, key, target, modifiers) {
        if (keyCode === void 0) { keyCode = 0; }
        if (key === void 0) { key = ''; }
        if (modifiers === void 0) { modifiers = {}; }
        var event = document.createEvent('KeyboardEvent');
        var originalPreventDefault = event.preventDefault;
        // Firefox does not support `initKeyboardEvent`, but supports `initKeyEvent`.
        if (event.initKeyEvent) {
            event.initKeyEvent(type, true, true, window, modifiers.control, modifiers.alt, modifiers.shift, modifiers.meta, keyCode);
        }
        else {
            // `initKeyboardEvent` expects to receive modifiers as a whitespace-delimited string
            // See https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/initKeyboardEvent
            var modifiersStr = (modifiers.control ? 'Control ' : '' + modifiers.alt ? 'Alt ' : '' +
                modifiers.shift ? 'Shift ' : '' + modifiers.meta ? 'Meta' : '').trim();
            event.initKeyboardEvent(type, true, /* canBubble */ true, /* cancelable */ window, /* view */ 0, /* char */ key, /* key */ 0, /* location */ modifiersStr, /* modifiersList */ false /* repeat */);
        }
        // Webkit Browsers don't set the keyCode when calling the init function.
        // See related bug https://bugs.webkit.org/show_bug.cgi?id=16735
        Object.defineProperties(event, {
            keyCode: { get: function () { return keyCode; } },
            key: { get: function () { return key; } },
            target: { get: function () { return target; } },
            ctrlKey: { get: function () { return !!modifiers.control; } },
            altKey: { get: function () { return !!modifiers.alt; } },
            shiftKey: { get: function () { return !!modifiers.shift; } },
            metaKey: { get: function () { return !!modifiers.meta; } }
        });
        // IE won't set `defaultPrevented` on synthetic events so we need to do it manually.
        event.preventDefault = function () {
            Object.defineProperty(event, 'defaultPrevented', { get: function () { return true; } });
            return originalPreventDefault.apply(this, arguments);
        };
        return event;
    }
    exports.createKeyboardEvent = createKeyboardEvent;
    /**
     * Creates a fake event object with any desired event type.
     * @docs-private
     */
    function createFakeEvent(type, canBubble, cancelable) {
        if (canBubble === void 0) { canBubble = false; }
        if (cancelable === void 0) { cancelable = true; }
        var event = document.createEvent('Event');
        event.initEvent(type, canBubble, cancelable);
        return event;
    }
    exports.createFakeEvent = createFakeEvent;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnQtb2JqZWN0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGVzdGluZy9ldmVudC1vYmplY3RzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBVUg7OztPQUdHO0lBQ0gsU0FBZ0IsZ0JBQWdCLENBQUMsSUFBWSxFQUFFLENBQUssRUFBRSxDQUFLLEVBQUUsTUFBVTtRQUF4QixrQkFBQSxFQUFBLEtBQUs7UUFBRSxrQkFBQSxFQUFBLEtBQUs7UUFBRSx1QkFBQSxFQUFBLFVBQVU7UUFDckUsSUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNqRCxJQUFNLHNCQUFzQixHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUM7UUFFcEQsS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQ3ZCLElBQUksRUFBRSxlQUFlLENBQ3JCLElBQUksRUFBRSxnQkFBZ0IsQ0FDdEIsTUFBTSxFQUFFLFVBQVUsQ0FDbEIsQ0FBQyxFQUFFLFlBQVksQ0FDZixDQUFDLEVBQUUsYUFBYSxDQUNoQixDQUFDLEVBQUUsYUFBYSxDQUNoQixDQUFDLEVBQUUsYUFBYSxDQUNoQixDQUFDLEVBQUUsYUFBYSxDQUNoQixLQUFLLEVBQUUsYUFBYSxDQUNwQixLQUFLLEVBQUUsWUFBWSxDQUNuQixLQUFLLEVBQUUsY0FBYyxDQUNyQixLQUFLLEVBQUUsYUFBYSxDQUNwQixNQUFNLEVBQUUsWUFBWSxDQUNwQixJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUU1Qiw4REFBOEQ7UUFDOUQsa0RBQWtEO1FBQ2xELE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFDLEdBQUcsRUFBRSxjQUFNLE9BQUEsQ0FBQyxFQUFELENBQUMsRUFBQyxDQUFDLENBQUM7UUFFeEQsb0ZBQW9GO1FBQ3BGLEtBQUssQ0FBQyxjQUFj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T0FHRztJQUNILFNBQWdCLGVBQWUsQ0FBQyxJQUFZLEVBQUUsU0FBaUIsRUFBRSxVQUFpQjtRQUFwQywwQkFBQSxFQUFBLGlCQUFpQjtRQUFFLDJCQUFBLEVBQUEsaUJBQWlCO1FBQ2hGLElBQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDNUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzdDLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUpELDBDQUlDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKiBNb2RpZmllciBrZXlzIHRoYXQgbWF5IGJlIGhlbGQgd2hpbGUgdHlwaW5nLiAqL1xuZXhwb3J0IGludGVyZmFjZSBNb2RpZmllcktleXMge1xuICBjb250cm9sPzogYm9vbGVhbjtcbiAgYWx0PzogYm9vbGVhbjtcbiAgc2hpZnQ/OiBib29sZWFuO1xuICBtZXRhPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgYnJvd3NlciBNb3VzZUV2ZW50IHdpdGggdGhlIHNwZWNpZmllZCBvcHRpb25zLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTW91c2VFdmVudCh0eXBlOiBzdHJpbmcsIHggPSAwLCB5ID0gMCwgYnV0dG9uID0gMCkge1xuICBjb25zdCBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdNb3VzZUV2ZW50Jyk7XG4gIGNvbnN0IG9yaWdpbmFsUHJldmVudERlZmF1bHQgPSBldmVudC5wcmV2ZW50RGVmYXVsdDtcblxuICBldmVudC5pbml0TW91c2VFdmVudCh0eXBlLFxuICAgIHRydWUsIC8qIGNhbkJ1YmJsZSAqL1xuICAgIHRydWUsIC8qIGNhbmNlbGFibGUgKi9cbiAgICB3aW5kb3csIC8qIHZpZXcgKi9cbiAgICAwLCAvKiBkZXRhaWwgKi9cbiAgICB4LCAvKiBzY3JlZW5YICovXG4gICAgeSwgLyogc2NyZWVuWSAqL1xuICAgIHgsIC8qIGNsaWVudFggKi9cbiAgICB5LCAvKiBjbGllbnRZICovXG4gICAgZmFsc2UsIC8qIGN0cmxLZXkgKi9cbiAgICBmYWxzZSwgLyogYWx0S2V5ICovXG4gICAgZmFsc2UsIC8qIHNoaWZ0S2V5ICovXG4gICAgZmFsc2UsIC8qIG1ldGFLZXkgKi9cbiAgICBidXR0b24sIC8qIGJ1dHRvbiAqL1xuICAgIG51bGwgLyogcmVsYXRlZFRhcmdldCAqLyk7XG5cbiAgLy8gYGluaXRNb3VzZUV2ZW50YCBkb2Vzbid0IGFsbG93IHVzIHRvIHBhc3MgdGhlIGBidXR0b25zYCBhbmRcbiAgLy8gZGVmYXVsdHMgaXQgdG8gMCB3aGljaCBsb29rcyBsaWtlIGEgZmFrZSBldmVudC5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV2ZW50LCAnYnV0dG9ucycsIHtnZXQ6ICgpID0+IDF9KTtcblxuICAvLyBJRSB3b24ndCBzZXQgYGRlZmF1bHRQcmV2ZW50ZWRgIG9uIHN5bnRoZXRpYyBldmVudHMgc28gd2UgbmVlZCB0byBkbyBpdCBtYW51YWxseS5cbiAgZXZlbnQucHJldmVudERlZmF1bHQgPSBmdW5jdGlvbigpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXZlbnQsICdkZWZhdWx0UHJldmVudGVkJywgeyBnZXQ6ICgpID0+IHRydWUgfSk7XG4gICAgcmV0dXJuIG9yaWdpbmFsUHJldmVudERlZmF1bHQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfTtcblxuICByZXR1cm4gZXZlbnQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGJyb3dzZXIgVG91Y2hFdmVudCB3aXRoIHRoZSBzcGVjaWZpZWQgcG9pbnRlciBjb29yZGluYXRlcy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRvdWNoRXZlbnQodHlwZTogc3RyaW5nLCBwYWdlWCA9IDAsIHBhZ2VZID0gMCkge1xuICAvLyBJbiBmYXZvciBvZiBjcmVhdGluZyBldmVudHMgdGhhdCB3b3JrIGZvciBtb3N0IG9mIHRoZSBicm93c2VycywgdGhlIGV2ZW50IGlzIGNyZWF0ZWRcbiAgLy8gYXMgYSBiYXNpYyBVSSBFdmVudC4gVGhlIG5lY2Vzc2FyeSBkZXRhaWxzIGZvciB0aGUgZXZlbnQgd2lsbCBiZSBzZXQgbWFudWFsbHkuXG4gIGNvbnN0IGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ1VJRXZlbnQnKTtcbiAgY29uc3QgdG91Y2hEZXRhaWxzID0ge3BhZ2VYLCBwYWdlWX07XG5cbiAgLy8gVFMzLjYgcmVtb3ZlcyB0aGUgaW5pdFVJRXZlbnQgbWV0aG9kIGFuZCBzdWdnZXN0cyBwb3J0aW5nIHRvIFwibmV3IFVJRXZlbnQoKVwiLlxuICAoZXZlbnQgYXMgYW55KS5pbml0VUlFdmVudCh0eXBlLCB0cnVlLCB0cnVlLCB3aW5kb3csIDApO1xuXG4gIC8vIE1vc3Qgb2YgdGhlIGJyb3dzZXJzIGRvbid0IGhhdmUgYSBcImluaXRUb3VjaEV2ZW50XCIgbWV0aG9kIHRoYXQgY2FuIGJlIHVzZWQgdG8gZGVmaW5lXG4gIC8vIHRoZSB0b3VjaCBkZXRhaWxzLlxuICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhldmVudCwge1xuICAgIHRvdWNoZXM6IHt2YWx1ZTogW3RvdWNoRGV0YWlsc119LFxuICAgIHRhcmdldFRvdWNoZXM6IHt2YWx1ZTogW3RvdWNoRGV0YWlsc119LFxuICAgIGNoYW5nZWRUb3VjaGVzOiB7dmFsdWU6IFt0b3VjaERldGFpbHNdfVxuICB9KTtcblxuICByZXR1cm4gZXZlbnQ7XG59XG5cbi8qKlxuICogRGlzcGF0Y2hlcyBhIGtleWRvd24gZXZlbnQgZnJvbSBhbiBlbGVtZW50LlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlS2V5Ym9hcmRFdmVudCh0eXBlOiBzdHJpbmcsIGtleUNvZGU6IG51bWJlciA9IDAsIGtleTogc3RyaW5nID0gJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQ/OiBFbGVtZW50LCBtb2RpZmllcnM6IE1vZGlmaWVyS2V5cyA9IHt9KSB7XG4gIGNvbnN0IGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0tleWJvYXJkRXZlbnQnKSBhcyBhbnk7XG4gIGNvbnN0IG9yaWdpbmFsUHJldmVudERlZmF1bHQgPSBldmVudC5wcmV2ZW50RGVmYXVsdDtcblxuICAvLyBGaXJlZm94IGRvZXMgbm90IHN1cHBvcnQgYGluaXRLZXlib2FyZEV2ZW50YCwgYnV0IHN1cHBvcnRzIGBpbml0S2V5RXZlbnRgLlxuICBpZiAoZXZlbnQuaW5pdEtleUV2ZW50KSB7XG4gICAgZXZlbnQuaW5pdEtleUV2ZW50KHR5cGUsIHRydWUsIHRydWUsIHdpbmRvdywgbW9kaWZpZXJzLmNvbnRyb2wsIG1vZGlmaWVycy5hbHQsIG1vZGlmaWVycy5zaGlmdCxcbiAgICAgICAgbW9kaWZpZXJzLm1ldGEsIGtleUNvZGUpO1xuICB9IGVsc2Uge1xuICAgIC8vIGBpbml0S2V5Ym9hcmRFdmVudGAgZXhwZWN0cyB0byByZWNlaXZlIG1vZGlmaWVycyBhcyBhIHdoaXRlc3BhY2UtZGVsaW1pdGVkIHN0cmluZ1xuICAgIC8vIFNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvS2V5Ym9hcmRFdmVudC9pbml0S2V5Ym9hcmRFdmVudFxuICAgIGNvbnN0IG1vZGlmaWVyc1N0ciA9IChtb2RpZmllcnMuY29udHJvbCA/ICdDb250cm9sICcgOiAnJyArIG1vZGlmaWVycy5hbHQgPyAnQWx0ICcgOiAnJyArXG4gICAgICAgIG1vZGlmaWVycy5zaGlmdCA/ICdTaGlmdCAnIDogJycgKyBtb2RpZmllcnMubWV0YSA/ICdNZXRhJyA6ICcnKS50cmltKCk7XG4gICAgZXZlbnQuaW5pdEtleWJvYXJkRXZlbnQodHlwZSxcbiAgICAgICAgdHJ1ZSwgLyogY2FuQnViYmxlICovXG4gICAgICAgIHRydWUsIC8qIGNhbmNlbGFibGUgKi9cbiAgICAgICAgd2luZG93LCAvKiB2aWV3ICovXG4gICAgICAgIDAsIC8qIGNoYXIgKi9cbiAgICAgICAga2V5LCAvKiBrZXkgKi9cbiAgICAgICAgMCwgLyogbG9jYXRpb24gKi9cbiAgICAgICAgbW9kaWZpZXJzU3RyLCAvKiBtb2RpZmllcnNMaXN0ICovXG4gICAgICAgIGZhbHNlIC8qIHJlcGVhdCAqLyk7XG4gIH1cblxuICAvLyBXZWJraXQgQnJvd3NlcnMgZG9uJ3Qgc2V0IHRoZSBrZXlDb2RlIHdoZW4gY2FsbGluZyB0aGUgaW5pdCBmdW5jdGlvbi5cbiAgLy8gU2VlIHJlbGF0ZWQgYnVnIGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD0xNjczNVxuICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhldmVudCwge1xuICAgIGtleUNvZGU6IHsgZ2V0OiAoKSA9PiBrZXlDb2RlIH0sXG4gICAga2V5OiB7IGdldDogKCkgPT4ga2V5IH0sXG4gICAgdGFyZ2V0OiB7IGdldDogKCkgPT4gdGFyZ2V0IH0sXG4gICAgY3RybEtleTogeyBnZXQ6ICgpID0+ICEhbW9kaWZpZXJzLmNvbnRyb2wgfSxcbiAgICBhbHRLZXk6IHsgZ2V0OiAoKSA9PiAhIW1vZGlmaWVycy5hbHQgfSxcbiAgICBzaGlmdEtleTogeyBnZXQ6ICgpID0+ICEhbW9kaWZpZXJzLnNoaWZ0IH0sXG4gICAgbWV0YUtleTogeyBnZXQ6ICgpID0+ICEhbW9kaWZpZXJzLm1ldGEgfVxuICB9KTtcblxuICAvLyBJRSB3b24ndCBzZXQgYGRlZmF1bHRQcmV2ZW50ZWRgIG9uIHN5bnRoZXRpYyBldmVudHMgc28gd2UgbmVlZCB0byBkbyBpdCBtYW51YWxseS5cbiAgZXZlbnQucHJldmVudERlZmF1bHQgPSBmdW5jdGlvbigpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXZlbnQsICdkZWZhdWx0UHJldmVudGVkJywgeyBnZXQ6ICgpID0+IHRydWUgfSk7XG4gICAgcmV0dXJuIG9yaWdpbmFsUHJldmVudERlZmF1bHQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfTtcblxuICByZXR1cm4gZXZlbnQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZha2UgZXZlbnQgb2JqZWN0IHdpdGggYW55IGRlc2lyZWQgZXZlbnQgdHlwZS5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZha2VFdmVudCh0eXBlOiBzdHJpbmcsIGNhbkJ1YmJsZSA9IGZhbHNlLCBjYW5jZWxhYmxlID0gdHJ1ZSkge1xuICBjb25zdCBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuICBldmVudC5pbml0RXZlbnQodHlwZSwgY2FuQnViYmxlLCBjYW5jZWxhYmxlKTtcbiAgcmV0dXJuIGV2ZW50O1xufVxuIl19