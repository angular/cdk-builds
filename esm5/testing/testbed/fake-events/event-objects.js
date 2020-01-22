/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Creates a browser MouseEvent with the specified options.
 * @docs-private
 */
export function createMouseEvent(type, x, y, button) {
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
/**
 * Creates a browser TouchEvent with the specified pointer coordinates.
 * @docs-private
 */
export function createTouchEvent(type, pageX, pageY) {
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
/**
 * Dispatches a keydown event from an element.
 * @docs-private
 */
export function createKeyboardEvent(type, keyCode, key, target, modifiers) {
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
        var modifiersList = '';
        if (modifiers.control) {
            modifiersList += 'Control ';
        }
        if (modifiers.alt) {
            modifiersList += 'Alt ';
        }
        if (modifiers.shift) {
            modifiersList += 'Shift ';
        }
        if (modifiers.meta) {
            modifiersList += 'Meta ';
        }
        event.initKeyboardEvent(type, true, /* canBubble */ true, /* cancelable */ window, /* view */ 0, /* char */ key, /* key */ 0, /* location */ modifiersList.trim(), /* modifiersList */ false /* repeat */);
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
/**
 * Creates a fake event object with any desired event type.
 * @docs-private
 */
export function createFakeEvent(type, canBubble, cancelable) {
    if (canBubble === void 0) { canBubble = false; }
    if (cancelable === void 0) { cancelable = true; }
    var event = document.createEvent('Event');
    event.initEvent(type, canBubble, cancelable);
    return event;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnQtb2JqZWN0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGVzdGluZy90ZXN0YmVkL2Zha2UtZXZlbnRzL2V2ZW50LW9iamVjdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBSUg7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLGdCQUFnQixDQUFDLElBQVksRUFBRSxDQUFLLEVBQUUsQ0FBSyxFQUFFLE1BQVU7SUFBeEIsa0JBQUEsRUFBQSxLQUFLO0lBQUUsa0JBQUEsRUFBQSxLQUFLO0lBQUUsdUJBQUEsRUFBQSxVQUFVO0lBQ3JFLElBQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDakQsSUFBTSxzQkFBc0IsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDO0lBRXBELEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUN2QixJQUFJLEVBQUUsZUFBZSxDQUNyQixJQUFJLEVBQUUsZ0JBQWdCLENBQ3RCLE1BQU0sRUFBRSxVQUFVLENBQ2xCLENBQUMsRUFBRSxZQUFZLENBQ2YsQ0FBQyxFQUFFLGFBQWEsQ0FDaEIsQ0FBQyxFQUFFLGFBQWEsQ0FDaEIsQ0FBQyxFQUFFLGFBQWEsQ0FDaEIsQ0FBQyxFQUFFLGFBQWEsQ0FDaEIsS0FBSyxFQUFFLGFBQWEsQ0FDcEIsS0FBSyxFQUFFLFlBQVksQ0FDbkIsS0FBSyxFQUFFLGNBQWMsQ0FDckIsS0FBSyxFQUFFLGFBQWEsQ0FDcEIsTUFBTSxFQUFFLFlBQVksQ0FDcEIsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUM7SUFFNUIsOERBQThEO0lBQzlELGtEQUFrRDtJQUNsRCxNQUFNLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBQyxHQUFHLEVBQUUsY0FBTSxPQUFBLENBQUMsRUFBRCxDQUFDLEVBQUMsQ0FBQyxDQUFD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QztBQUVEOzs7R0FHRztBQUNILE1BQU0sVUFBVSxlQUFlLENBQUMsSUFBWSxFQUFFLFNBQWlCLEVBQUUsVUFBaUI7SUFBcEMsMEJBQUEsRUFBQSxpQkFBaUI7SUFBRSwyQkFBQSxFQUFBLGlCQUFpQjtJQUNoRixJQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzVDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUM3QyxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtNb2RpZmllcktleXN9IGZyb20gJ0Bhbmd1bGFyL2Nkay90ZXN0aW5nJztcblxuLyoqXG4gKiBDcmVhdGVzIGEgYnJvd3NlciBNb3VzZUV2ZW50IHdpdGggdGhlIHNwZWNpZmllZCBvcHRpb25zLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTW91c2VFdmVudCh0eXBlOiBzdHJpbmcsIHggPSAwLCB5ID0gMCwgYnV0dG9uID0gMCkge1xuICBjb25zdCBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdNb3VzZUV2ZW50Jyk7XG4gIGNvbnN0IG9yaWdpbmFsUHJldmVudERlZmF1bHQgPSBldmVudC5wcmV2ZW50RGVmYXVsdDtcblxuICBldmVudC5pbml0TW91c2VFdmVudCh0eXBlLFxuICAgIHRydWUsIC8qIGNhbkJ1YmJsZSAqL1xuICAgIHRydWUsIC8qIGNhbmNlbGFibGUgKi9cbiAgICB3aW5kb3csIC8qIHZpZXcgKi9cbiAgICAwLCAvKiBkZXRhaWwgKi9cbiAgICB4LCAvKiBzY3JlZW5YICovXG4gICAgeSwgLyogc2NyZWVuWSAqL1xuICAgIHgsIC8qIGNsaWVudFggKi9cbiAgICB5LCAvKiBjbGllbnRZICovXG4gICAgZmFsc2UsIC8qIGN0cmxLZXkgKi9cbiAgICBmYWxzZSwgLyogYWx0S2V5ICovXG4gICAgZmFsc2UsIC8qIHNoaWZ0S2V5ICovXG4gICAgZmFsc2UsIC8qIG1ldGFLZXkgKi9cbiAgICBidXR0b24sIC8qIGJ1dHRvbiAqL1xuICAgIG51bGwgLyogcmVsYXRlZFRhcmdldCAqLyk7XG5cbiAgLy8gYGluaXRNb3VzZUV2ZW50YCBkb2Vzbid0IGFsbG93IHVzIHRvIHBhc3MgdGhlIGBidXR0b25zYCBhbmRcbiAgLy8gZGVmYXVsdHMgaXQgdG8gMCB3aGljaCBsb29rcyBsaWtlIGEgZmFrZSBldmVudC5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV2ZW50LCAnYnV0dG9ucycsIHtnZXQ6ICgpID0+IDF9KTtcblxuICAvLyBJRSB3b24ndCBzZXQgYGRlZmF1bHRQcmV2ZW50ZWRgIG9uIHN5bnRoZXRpYyBldmVudHMgc28gd2UgbmVlZCB0byBkbyBpdCBtYW51YWxseS5cbiAgZXZlbnQucHJldmVudERlZmF1bHQgPSBmdW5jdGlvbigpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXZlbnQsICdkZWZhdWx0UHJldmVudGVkJywgeyBnZXQ6ICgpID0+IHRydWUgfSk7XG4gICAgcmV0dXJuIG9yaWdpbmFsUHJldmVudERlZmF1bHQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfTtcblxuICByZXR1cm4gZXZlbnQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGJyb3dzZXIgVG91Y2hFdmVudCB3aXRoIHRoZSBzcGVjaWZpZWQgcG9pbnRlciBjb29yZGluYXRlcy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRvdWNoRXZlbnQodHlwZTogc3RyaW5nLCBwYWdlWCA9IDAsIHBhZ2VZID0gMCkge1xuICAvLyBJbiBmYXZvciBvZiBjcmVhdGluZyBldmVudHMgdGhhdCB3b3JrIGZvciBtb3N0IG9mIHRoZSBicm93c2VycywgdGhlIGV2ZW50IGlzIGNyZWF0ZWRcbiAgLy8gYXMgYSBiYXNpYyBVSSBFdmVudC4gVGhlIG5lY2Vzc2FyeSBkZXRhaWxzIGZvciB0aGUgZXZlbnQgd2lsbCBiZSBzZXQgbWFudWFsbHkuXG4gIGNvbnN0IGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ1VJRXZlbnQnKTtcbiAgY29uc3QgdG91Y2hEZXRhaWxzID0ge3BhZ2VYLCBwYWdlWX07XG5cbiAgLy8gVFMzLjYgcmVtb3ZlcyB0aGUgaW5pdFVJRXZlbnQgbWV0aG9kIGFuZCBzdWdnZXN0cyBwb3J0aW5nIHRvIFwibmV3IFVJRXZlbnQoKVwiLlxuICAoZXZlbnQgYXMgYW55KS5pbml0VUlFdmVudCh0eXBlLCB0cnVlLCB0cnVlLCB3aW5kb3csIDApO1xuXG4gIC8vIE1vc3Qgb2YgdGhlIGJyb3dzZXJzIGRvbid0IGhhdmUgYSBcImluaXRUb3VjaEV2ZW50XCIgbWV0aG9kIHRoYXQgY2FuIGJlIHVzZWQgdG8gZGVmaW5lXG4gIC8vIHRoZSB0b3VjaCBkZXRhaWxzLlxuICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhldmVudCwge1xuICAgIHRvdWNoZXM6IHt2YWx1ZTogW3RvdWNoRGV0YWlsc119LFxuICAgIHRhcmdldFRvdWNoZXM6IHt2YWx1ZTogW3RvdWNoRGV0YWlsc119LFxuICAgIGNoYW5nZWRUb3VjaGVzOiB7dmFsdWU6IFt0b3VjaERldGFpbHNdfVxuICB9KTtcblxuICByZXR1cm4gZXZlbnQ7XG59XG5cbi8qKlxuICogRGlzcGF0Y2hlcyBhIGtleWRvd24gZXZlbnQgZnJvbSBhbiBlbGVtZW50LlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlS2V5Ym9hcmRFdmVudCh0eXBlOiBzdHJpbmcsIGtleUNvZGU6IG51bWJlciA9IDAsIGtleTogc3RyaW5nID0gJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQ/OiBFbGVtZW50LCBtb2RpZmllcnM6IE1vZGlmaWVyS2V5cyA9IHt9KSB7XG4gIGNvbnN0IGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0tleWJvYXJkRXZlbnQnKSBhcyBhbnk7XG4gIGNvbnN0IG9yaWdpbmFsUHJldmVudERlZmF1bHQgPSBldmVudC5wcmV2ZW50RGVmYXVsdDtcblxuICAvLyBGaXJlZm94IGRvZXMgbm90IHN1cHBvcnQgYGluaXRLZXlib2FyZEV2ZW50YCwgYnV0IHN1cHBvcnRzIGBpbml0S2V5RXZlbnRgLlxuICBpZiAoZXZlbnQuaW5pdEtleUV2ZW50KSB7XG4gICAgZXZlbnQuaW5pdEtleUV2ZW50KHR5cGUsIHRydWUsIHRydWUsIHdpbmRvdywgbW9kaWZpZXJzLmNvbnRyb2wsIG1vZGlmaWVycy5hbHQsIG1vZGlmaWVycy5zaGlmdCxcbiAgICAgICAgbW9kaWZpZXJzLm1ldGEsIGtleUNvZGUpO1xuICB9IGVsc2Uge1xuICAgIC8vIGBpbml0S2V5Ym9hcmRFdmVudGAgZXhwZWN0cyB0byByZWNlaXZlIG1vZGlmaWVycyBhcyBhIHdoaXRlc3BhY2UtZGVsaW1pdGVkIHN0cmluZ1xuICAgIC8vIFNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvS2V5Ym9hcmRFdmVudC9pbml0S2V5Ym9hcmRFdmVudFxuICAgIGxldCBtb2RpZmllcnNMaXN0ID0gJyc7XG5cbiAgICBpZiAobW9kaWZpZXJzLmNvbnRyb2wpIHtcbiAgICAgIG1vZGlmaWVyc0xpc3QgKz0gJ0NvbnRyb2wgJztcbiAgICB9XG5cbiAgICBpZiAobW9kaWZpZXJzLmFsdCkge1xuICAgICAgbW9kaWZpZXJzTGlzdCArPSAnQWx0ICc7XG4gICAgfVxuXG4gICAgaWYgKG1vZGlmaWVycy5zaGlmdCkge1xuICAgICAgbW9kaWZpZXJzTGlzdCArPSAnU2hpZnQgJztcbiAgICB9XG5cbiAgICBpZiAobW9kaWZpZXJzLm1ldGEpIHtcbiAgICAgIG1vZGlmaWVyc0xpc3QgKz0gJ01ldGEgJztcbiAgICB9XG5cbiAgICBldmVudC5pbml0S2V5Ym9hcmRFdmVudCh0eXBlLFxuICAgICAgICB0cnVlLCAvKiBjYW5CdWJibGUgKi9cbiAgICAgICAgdHJ1ZSwgLyogY2FuY2VsYWJsZSAqL1xuICAgICAgICB3aW5kb3csIC8qIHZpZXcgKi9cbiAgICAgICAgMCwgLyogY2hhciAqL1xuICAgICAgICBrZXksIC8qIGtleSAqL1xuICAgICAgICAwLCAvKiBsb2NhdGlvbiAqL1xuICAgICAgICBtb2RpZmllcnNMaXN0LnRyaW0oKSwgLyogbW9kaWZpZXJzTGlzdCAqL1xuICAgICAgICBmYWxzZSAvKiByZXBlYXQgKi8pO1xuICB9XG5cbiAgLy8gV2Via2l0IEJyb3dzZXJzIGRvbid0IHNldCB0aGUga2V5Q29kZSB3aGVuIGNhbGxpbmcgdGhlIGluaXQgZnVuY3Rpb24uXG4gIC8vIFNlZSByZWxhdGVkIGJ1ZyBodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTY3MzVcbiAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoZXZlbnQsIHtcbiAgICBrZXlDb2RlOiB7IGdldDogKCkgPT4ga2V5Q29kZSB9LFxuICAgIGtleTogeyBnZXQ6ICgpID0+IGtleSB9LFxuICAgIHRhcmdldDogeyBnZXQ6ICgpID0+IHRhcmdldCB9LFxuICAgIGN0cmxLZXk6IHsgZ2V0OiAoKSA9PiAhIW1vZGlmaWVycy5jb250cm9sIH0sXG4gICAgYWx0S2V5OiB7IGdldDogKCkgPT4gISFtb2RpZmllcnMuYWx0IH0sXG4gICAgc2hpZnRLZXk6IHsgZ2V0OiAoKSA9PiAhIW1vZGlmaWVycy5zaGlmdCB9LFxuICAgIG1ldGFLZXk6IHsgZ2V0OiAoKSA9PiAhIW1vZGlmaWVycy5tZXRhIH1cbiAgfSk7XG5cbiAgLy8gSUUgd29uJ3Qgc2V0IGBkZWZhdWx0UHJldmVudGVkYCBvbiBzeW50aGV0aWMgZXZlbnRzIHNvIHdlIG5lZWQgdG8gZG8gaXQgbWFudWFsbHkuXG4gIGV2ZW50LnByZXZlbnREZWZhdWx0ID0gZnVuY3Rpb24oKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV2ZW50LCAnZGVmYXVsdFByZXZlbnRlZCcsIHsgZ2V0OiAoKSA9PiB0cnVlIH0pO1xuICAgIHJldHVybiBvcmlnaW5hbFByZXZlbnREZWZhdWx0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH07XG5cbiAgcmV0dXJuIGV2ZW50O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBmYWtlIGV2ZW50IG9iamVjdCB3aXRoIGFueSBkZXNpcmVkIGV2ZW50IHR5cGUuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVGYWtlRXZlbnQodHlwZTogc3RyaW5nLCBjYW5CdWJibGUgPSBmYWxzZSwgY2FuY2VsYWJsZSA9IHRydWUpIHtcbiAgY29uc3QgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnRXZlbnQnKTtcbiAgZXZlbnQuaW5pdEV2ZW50KHR5cGUsIGNhbkJ1YmJsZSwgY2FuY2VsYWJsZSk7XG4gIHJldHVybiBldmVudDtcbn1cbiJdfQ==