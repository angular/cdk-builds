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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnQtb2JqZWN0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGVzdGluZy9ldmVudC1vYmplY3RzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQVVIOzs7R0FHRztBQUNILE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxJQUFZLEVBQUUsQ0FBSyxFQUFFLENBQUssRUFBRSxNQUFVO0lBQXhCLGtCQUFBLEVBQUEsS0FBSztJQUFFLGtCQUFBLEVBQUEsS0FBSztJQUFFLHVCQUFBLEVBQUEsVUFBVTtJQUNyRSxJQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ2pELElBQU0sc0JBQXNCLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQztJQUVwRCxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUksRUFDdkIsSUFBSSxFQUFFLGVBQWUsQ0FDckIsSUFBSSxFQUFFLGdCQUFnQixDQUN0QixNQUFNLEVBQUUsVUFBVSxDQUNsQixDQUFDLEVBQUUsWUFBWSxDQUNmLENBQUMsRUFBRSxhQUFhLENBQ2hCLENBQUMsRUFBRSxhQUFhLENBQ2hCLENBQUMsRUFBRSxhQUFhLENBQ2hCLENBQUMsRUFBRSxhQUFhLENBQ2hCLEtBQUssRUFBRSxhQUFhLENBQ3BCLEtBQUssRUFBRSxZQUFZLENBQ25CLEtBQUssRUFBRSxjQUFjLENBQ3JCLEtBQUssRUFBRSxhQUFhLENBQ3BCLE1BQU0sRUFBRSxZQUFZLENBQ3BCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0lBRTVCLDhEQUE4RDtJQUM5RCxrREFBa0Q7SUFDbEQsTUFBTSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUMsR0FBRyxFQUFFLGNBQU0sT0FBQSxDQUFDLEVBQUQsQ0FBQyxFQUFDLENBQUMsQ0FBQztJQUV4RCxvRkFBb0Y7SUFDcEYsS0FBSyxDQUFD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QUMsSUFBWSxFQUFFLFNBQWlCLEVBQUUsVUFBaUI7SUFBcEMsMEJBQUEsRUFBQSxpQkFBaUI7SUFBRSwyQkFBQSxFQUFBLGlCQUFpQjtJQUNoRixJQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzVDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUM3QyxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqIE1vZGlmaWVyIGtleXMgdGhhdCBtYXkgYmUgaGVsZCB3aGlsZSB0eXBpbmcuICovXG5leHBvcnQgaW50ZXJmYWNlIE1vZGlmaWVyS2V5cyB7XG4gIGNvbnRyb2w/OiBib29sZWFuO1xuICBhbHQ/OiBib29sZWFuO1xuICBzaGlmdD86IGJvb2xlYW47XG4gIG1ldGE/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBicm93c2VyIE1vdXNlRXZlbnQgd2l0aCB0aGUgc3BlY2lmaWVkIG9wdGlvbnMuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVNb3VzZUV2ZW50KHR5cGU6IHN0cmluZywgeCA9IDAsIHkgPSAwLCBidXR0b24gPSAwKSB7XG4gIGNvbnN0IGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ01vdXNlRXZlbnQnKTtcbiAgY29uc3Qgb3JpZ2luYWxQcmV2ZW50RGVmYXVsdCA9IGV2ZW50LnByZXZlbnREZWZhdWx0O1xuXG4gIGV2ZW50LmluaXRNb3VzZUV2ZW50KHR5cGUsXG4gICAgdHJ1ZSwgLyogY2FuQnViYmxlICovXG4gICAgdHJ1ZSwgLyogY2FuY2VsYWJsZSAqL1xuICAgIHdpbmRvdywgLyogdmlldyAqL1xuICAgIDAsIC8qIGRldGFpbCAqL1xuICAgIHgsIC8qIHNjcmVlblggKi9cbiAgICB5LCAvKiBzY3JlZW5ZICovXG4gICAgeCwgLyogY2xpZW50WCAqL1xuICAgIHksIC8qIGNsaWVudFkgKi9cbiAgICBmYWxzZSwgLyogY3RybEtleSAqL1xuICAgIGZhbHNlLCAvKiBhbHRLZXkgKi9cbiAgICBmYWxzZSwgLyogc2hpZnRLZXkgKi9cbiAgICBmYWxzZSwgLyogbWV0YUtleSAqL1xuICAgIGJ1dHRvbiwgLyogYnV0dG9uICovXG4gICAgbnVsbCAvKiByZWxhdGVkVGFyZ2V0ICovKTtcblxuICAvLyBgaW5pdE1vdXNlRXZlbnRgIGRvZXNuJ3QgYWxsb3cgdXMgdG8gcGFzcyB0aGUgYGJ1dHRvbnNgIGFuZFxuICAvLyBkZWZhdWx0cyBpdCB0byAwIHdoaWNoIGxvb2tzIGxpa2UgYSBmYWtlIGV2ZW50LlxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXZlbnQsICdidXR0b25zJywge2dldDogKCkgPT4gMX0pO1xuXG4gIC8vIElFIHdvbid0IHNldCBgZGVmYXVsdFByZXZlbnRlZGAgb24gc3ludGhldGljIGV2ZW50cyBzbyB3ZSBuZWVkIHRvIGRvIGl0IG1hbnVhbGx5LlxuICBldmVudC5wcmV2ZW50RGVmYXVsdCA9IGZ1bmN0aW9uKCkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShldmVudCwgJ2RlZmF1bHRQcmV2ZW50ZWQnLCB7IGdldDogKCkgPT4gdHJ1ZSB9KTtcbiAgICByZXR1cm4gb3JpZ2luYWxQcmV2ZW50RGVmYXVsdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9O1xuXG4gIHJldHVybiBldmVudDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgYnJvd3NlciBUb3VjaEV2ZW50IHdpdGggdGhlIHNwZWNpZmllZCBwb2ludGVyIGNvb3JkaW5hdGVzLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVG91Y2hFdmVudCh0eXBlOiBzdHJpbmcsIHBhZ2VYID0gMCwgcGFnZVkgPSAwKSB7XG4gIC8vIEluIGZhdm9yIG9mIGNyZWF0aW5nIGV2ZW50cyB0aGF0IHdvcmsgZm9yIG1vc3Qgb2YgdGhlIGJyb3dzZXJzLCB0aGUgZXZlbnQgaXMgY3JlYXRlZFxuICAvLyBhcyBhIGJhc2ljIFVJIEV2ZW50LiBUaGUgbmVjZXNzYXJ5IGRldGFpbHMgZm9yIHRoZSBldmVudCB3aWxsIGJlIHNldCBtYW51YWxseS5cbiAgY29uc3QgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnVUlFdmVudCcpO1xuICBjb25zdCB0b3VjaERldGFpbHMgPSB7cGFnZVgsIHBhZ2VZfTtcblxuICAvLyBUUzMuNiByZW1vdmVzIHRoZSBpbml0VUlFdmVudCBtZXRob2QgYW5kIHN1Z2dlc3RzIHBvcnRpbmcgdG8gXCJuZXcgVUlFdmVudCgpXCIuXG4gIChldmVudCBhcyBhbnkpLmluaXRVSUV2ZW50KHR5cGUsIHRydWUsIHRydWUsIHdpbmRvdywgMCk7XG5cbiAgLy8gTW9zdCBvZiB0aGUgYnJvd3NlcnMgZG9uJ3QgaGF2ZSBhIFwiaW5pdFRvdWNoRXZlbnRcIiBtZXRob2QgdGhhdCBjYW4gYmUgdXNlZCB0byBkZWZpbmVcbiAgLy8gdGhlIHRvdWNoIGRldGFpbHMuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKGV2ZW50LCB7XG4gICAgdG91Y2hlczoge3ZhbHVlOiBbdG91Y2hEZXRhaWxzXX0sXG4gICAgdGFyZ2V0VG91Y2hlczoge3ZhbHVlOiBbdG91Y2hEZXRhaWxzXX0sXG4gICAgY2hhbmdlZFRvdWNoZXM6IHt2YWx1ZTogW3RvdWNoRGV0YWlsc119XG4gIH0pO1xuXG4gIHJldHVybiBldmVudDtcbn1cblxuLyoqXG4gKiBEaXNwYXRjaGVzIGEga2V5ZG93biBldmVudCBmcm9tIGFuIGVsZW1lbnQuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVLZXlib2FyZEV2ZW50KHR5cGU6IHN0cmluZywga2V5Q29kZTogbnVtYmVyID0gMCwga2V5OiBzdHJpbmcgPSAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldD86IEVsZW1lbnQsIG1vZGlmaWVyczogTW9kaWZpZXJLZXlzID0ge30pIHtcbiAgY29uc3QgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnS2V5Ym9hcmRFdmVudCcpIGFzIGFueTtcbiAgY29uc3Qgb3JpZ2luYWxQcmV2ZW50RGVmYXVsdCA9IGV2ZW50LnByZXZlbnREZWZhdWx0O1xuXG4gIC8vIEZpcmVmb3ggZG9lcyBub3Qgc3VwcG9ydCBgaW5pdEtleWJvYXJkRXZlbnRgLCBidXQgc3VwcG9ydHMgYGluaXRLZXlFdmVudGAuXG4gIGlmIChldmVudC5pbml0S2V5RXZlbnQpIHtcbiAgICBldmVudC5pbml0S2V5RXZlbnQodHlwZSwgdHJ1ZSwgdHJ1ZSwgd2luZG93LCBtb2RpZmllcnMuY29udHJvbCwgbW9kaWZpZXJzLmFsdCwgbW9kaWZpZXJzLnNoaWZ0LFxuICAgICAgICBtb2RpZmllcnMubWV0YSwga2V5Q29kZSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYGluaXRLZXlib2FyZEV2ZW50YCBleHBlY3RzIHRvIHJlY2VpdmUgbW9kaWZpZXJzIGFzIGEgd2hpdGVzcGFjZS1kZWxpbWl0ZWQgc3RyaW5nXG4gICAgLy8gU2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9LZXlib2FyZEV2ZW50L2luaXRLZXlib2FyZEV2ZW50XG4gICAgY29uc3QgbW9kaWZpZXJzU3RyID0gKG1vZGlmaWVycy5jb250cm9sID8gJ0NvbnRyb2wgJyA6ICcnICsgbW9kaWZpZXJzLmFsdCA/ICdBbHQgJyA6ICcnICtcbiAgICAgICAgbW9kaWZpZXJzLnNoaWZ0ID8gJ1NoaWZ0ICcgOiAnJyArIG1vZGlmaWVycy5tZXRhID8gJ01ldGEnIDogJycpLnRyaW0oKTtcbiAgICBldmVudC5pbml0S2V5Ym9hcmRFdmVudCh0eXBlLFxuICAgICAgICB0cnVlLCAvKiBjYW5CdWJibGUgKi9cbiAgICAgICAgdHJ1ZSwgLyogY2FuY2VsYWJsZSAqL1xuICAgICAgICB3aW5kb3csIC8qIHZpZXcgKi9cbiAgICAgICAgMCwgLyogY2hhciAqL1xuICAgICAgICBrZXksIC8qIGtleSAqL1xuICAgICAgICAwLCAvKiBsb2NhdGlvbiAqL1xuICAgICAgICBtb2RpZmllcnNTdHIsIC8qIG1vZGlmaWVyc0xpc3QgKi9cbiAgICAgICAgZmFsc2UgLyogcmVwZWF0ICovKTtcbiAgfVxuXG4gIC8vIFdlYmtpdCBCcm93c2VycyBkb24ndCBzZXQgdGhlIGtleUNvZGUgd2hlbiBjYWxsaW5nIHRoZSBpbml0IGZ1bmN0aW9uLlxuICAvLyBTZWUgcmVsYXRlZCBidWcgaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTE2NzM1XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKGV2ZW50LCB7XG4gICAga2V5Q29kZTogeyBnZXQ6ICgpID0+IGtleUNvZGUgfSxcbiAgICBrZXk6IHsgZ2V0OiAoKSA9PiBrZXkgfSxcbiAgICB0YXJnZXQ6IHsgZ2V0OiAoKSA9PiB0YXJnZXQgfSxcbiAgICBjdHJsS2V5OiB7IGdldDogKCkgPT4gISFtb2RpZmllcnMuY29udHJvbCB9LFxuICAgIGFsdEtleTogeyBnZXQ6ICgpID0+ICEhbW9kaWZpZXJzLmFsdCB9LFxuICAgIHNoaWZ0S2V5OiB7IGdldDogKCkgPT4gISFtb2RpZmllcnMuc2hpZnQgfSxcbiAgICBtZXRhS2V5OiB7IGdldDogKCkgPT4gISFtb2RpZmllcnMubWV0YSB9XG4gIH0pO1xuXG4gIC8vIElFIHdvbid0IHNldCBgZGVmYXVsdFByZXZlbnRlZGAgb24gc3ludGhldGljIGV2ZW50cyBzbyB3ZSBuZWVkIHRvIGRvIGl0IG1hbnVhbGx5LlxuICBldmVudC5wcmV2ZW50RGVmYXVsdCA9IGZ1bmN0aW9uKCkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShldmVudCwgJ2RlZmF1bHRQcmV2ZW50ZWQnLCB7IGdldDogKCkgPT4gdHJ1ZSB9KTtcbiAgICByZXR1cm4gb3JpZ2luYWxQcmV2ZW50RGVmYXVsdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9O1xuXG4gIHJldHVybiBldmVudDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgZmFrZSBldmVudCBvYmplY3Qgd2l0aCBhbnkgZGVzaXJlZCBldmVudCB0eXBlLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRmFrZUV2ZW50KHR5cGU6IHN0cmluZywgY2FuQnViYmxlID0gZmFsc2UsIGNhbmNlbGFibGUgPSB0cnVlKSB7XG4gIGNvbnN0IGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG4gIGV2ZW50LmluaXRFdmVudCh0eXBlLCBjYW5CdWJibGUsIGNhbmNlbGFibGUpO1xuICByZXR1cm4gZXZlbnQ7XG59XG4iXX0=