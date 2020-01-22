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
export function createMouseEvent(type, x = 0, y = 0, button = 0) {
    const event = document.createEvent('MouseEvent');
    const originalPreventDefault = event.preventDefault.bind(event);
    event.initMouseEvent(type, true, /* canBubble */ true, /* cancelable */ window, /* view */ 0, /* detail */ x, /* screenX */ y, /* screenY */ x, /* clientX */ y, /* clientY */ false, /* ctrlKey */ false, /* altKey */ false, /* shiftKey */ false, /* metaKey */ button, /* button */ null /* relatedTarget */);
    // `initMouseEvent` doesn't allow us to pass the `buttons` and
    // defaults it to 0 which looks like a fake event.
    Object.defineProperty(event, 'buttons', { get: () => 1 });
    // IE won't set `defaultPrevented` on synthetic events so we need to do it manually.
    event.preventDefault = function () {
        Object.defineProperty(event, 'defaultPrevented', { get: () => true });
        return originalPreventDefault();
    };
    return event;
}
/**
 * Creates a browser TouchEvent with the specified pointer coordinates.
 * @docs-private
 */
export function createTouchEvent(type, pageX = 0, pageY = 0) {
    // In favor of creating events that work for most of the browsers, the event is created
    // as a basic UI Event. The necessary details for the event will be set manually.
    const event = document.createEvent('UIEvent');
    const touchDetails = { pageX, pageY };
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
export function createKeyboardEvent(type, keyCode = 0, key = '', target, modifiers = {}) {
    const event = document.createEvent('KeyboardEvent');
    const originalPreventDefault = event.preventDefault;
    // Firefox does not support `initKeyboardEvent`, but supports `initKeyEvent`.
    if (event.initKeyEvent) {
        event.initKeyEvent(type, true, true, window, modifiers.control, modifiers.alt, modifiers.shift, modifiers.meta, keyCode);
    }
    else {
        // `initKeyboardEvent` expects to receive modifiers as a whitespace-delimited string
        // See https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/initKeyboardEvent
        let modifiersList = '';
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
        keyCode: { get: () => keyCode },
        key: { get: () => key },
        target: { get: () => target },
        ctrlKey: { get: () => !!modifiers.control },
        altKey: { get: () => !!modifiers.alt },
        shiftKey: { get: () => !!modifiers.shift },
        metaKey: { get: () => !!modifiers.meta }
    });
    // IE won't set `defaultPrevented` on synthetic events so we need to do it manually.
    event.preventDefault = function () {
        Object.defineProperty(event, 'defaultPrevented', { get: () => true });
        return originalPreventDefault.apply(this, arguments);
    };
    return event;
}
/**
 * Creates a fake event object with any desired event type.
 * @docs-private
 */
export function createFakeEvent(type, canBubble = false, cancelable = true) {
    const event = document.createEvent('Event');
    event.initEvent(type, canBubble, cancelable);
    return event;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnQtb2JqZWN0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGVzdGluZy90ZXN0YmVkL2Zha2UtZXZlbnRzL2V2ZW50LW9iamVjdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBSUg7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLGdCQUFnQixDQUFDLElBQVksRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsTUFBTSxHQUFHLENBQUM7SUFDckUsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUNqRCxNQUFNLHNCQUFzQixHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRWhFLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUN2QixJQUFJLEVBQUUsZUFBZSxDQUNyQixJQUFJLEVBQUUsZ0JBQWdCLENBQ3RCLE1BQU0sRUFBRSxVQUFVLENBQ2xCLENBQUMsRUFBRSxZQUFZLENBQ2YsQ0FBQyxFQUFFLGFBQWEsQ0FDaEIsQ0FBQyxFQUFFLGFBQWEsQ0FDaEIsQ0FBQyxFQUFFLGFBQWEsQ0FDaEIsQ0FBQyxFQUFFLGFBQWEsQ0FDaEIsS0FBSyxFQUFFLGFBQWEsQ0FDcEIsS0FBSyxFQUFFLFlBQVksQ0FDbkIsS0FBSyxFQUFFLGNBQWMsQ0FDckIsS0FBSyxFQUFFLGFBQWEsQ0FDcEIsTUFBTSxFQUFFLFlBQVksQ0FDcEIsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUM7SUFFNUIsOERBQThEO0lBQzlELGtEQUFrRDtJQUNsRCxNQUFNLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztJQUV4RCxvRkFBb0Y7SUFDcEYsS0FBSyxDQUFD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QUFDO0lBQzdDLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge01vZGlmaWVyS2V5c30gZnJvbSAnQGFuZ3VsYXIvY2RrL3Rlc3RpbmcnO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBicm93c2VyIE1vdXNlRXZlbnQgd2l0aCB0aGUgc3BlY2lmaWVkIG9wdGlvbnMuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVNb3VzZUV2ZW50KHR5cGU6IHN0cmluZywgeCA9IDAsIHkgPSAwLCBidXR0b24gPSAwKSB7XG4gIGNvbnN0IGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ01vdXNlRXZlbnQnKTtcbiAgY29uc3Qgb3JpZ2luYWxQcmV2ZW50RGVmYXVsdCA9IGV2ZW50LnByZXZlbnREZWZhdWx0LmJpbmQoZXZlbnQpO1xuXG4gIGV2ZW50LmluaXRNb3VzZUV2ZW50KHR5cGUsXG4gICAgdHJ1ZSwgLyogY2FuQnViYmxlICovXG4gICAgdHJ1ZSwgLyogY2FuY2VsYWJsZSAqL1xuICAgIHdpbmRvdywgLyogdmlldyAqL1xuICAgIDAsIC8qIGRldGFpbCAqL1xuICAgIHgsIC8qIHNjcmVlblggKi9cbiAgICB5LCAvKiBzY3JlZW5ZICovXG4gICAgeCwgLyogY2xpZW50WCAqL1xuICAgIHksIC8qIGNsaWVudFkgKi9cbiAgICBmYWxzZSwgLyogY3RybEtleSAqL1xuICAgIGZhbHNlLCAvKiBhbHRLZXkgKi9cbiAgICBmYWxzZSwgLyogc2hpZnRLZXkgKi9cbiAgICBmYWxzZSwgLyogbWV0YUtleSAqL1xuICAgIGJ1dHRvbiwgLyogYnV0dG9uICovXG4gICAgbnVsbCAvKiByZWxhdGVkVGFyZ2V0ICovKTtcblxuICAvLyBgaW5pdE1vdXNlRXZlbnRgIGRvZXNuJ3QgYWxsb3cgdXMgdG8gcGFzcyB0aGUgYGJ1dHRvbnNgIGFuZFxuICAvLyBkZWZhdWx0cyBpdCB0byAwIHdoaWNoIGxvb2tzIGxpa2UgYSBmYWtlIGV2ZW50LlxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXZlbnQsICdidXR0b25zJywge2dldDogKCkgPT4gMX0pO1xuXG4gIC8vIElFIHdvbid0IHNldCBgZGVmYXVsdFByZXZlbnRlZGAgb24gc3ludGhldGljIGV2ZW50cyBzbyB3ZSBuZWVkIHRvIGRvIGl0IG1hbnVhbGx5LlxuICBldmVudC5wcmV2ZW50RGVmYXVsdCA9IGZ1bmN0aW9uKCkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShldmVudCwgJ2RlZmF1bHRQcmV2ZW50ZWQnLCB7IGdldDogKCkgPT4gdHJ1ZSB9KTtcbiAgICByZXR1cm4gb3JpZ2luYWxQcmV2ZW50RGVmYXVsdCgpO1xuICB9O1xuXG4gIHJldHVybiBldmVudDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgYnJvd3NlciBUb3VjaEV2ZW50IHdpdGggdGhlIHNwZWNpZmllZCBwb2ludGVyIGNvb3JkaW5hdGVzLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVG91Y2hFdmVudCh0eXBlOiBzdHJpbmcsIHBhZ2VYID0gMCwgcGFnZVkgPSAwKSB7XG4gIC8vIEluIGZhdm9yIG9mIGNyZWF0aW5nIGV2ZW50cyB0aGF0IHdvcmsgZm9yIG1vc3Qgb2YgdGhlIGJyb3dzZXJzLCB0aGUgZXZlbnQgaXMgY3JlYXRlZFxuICAvLyBhcyBhIGJhc2ljIFVJIEV2ZW50LiBUaGUgbmVjZXNzYXJ5IGRldGFpbHMgZm9yIHRoZSBldmVudCB3aWxsIGJlIHNldCBtYW51YWxseS5cbiAgY29uc3QgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnVUlFdmVudCcpO1xuICBjb25zdCB0b3VjaERldGFpbHMgPSB7cGFnZVgsIHBhZ2VZfTtcblxuICAvLyBUUzMuNiByZW1vdmVzIHRoZSBpbml0VUlFdmVudCBtZXRob2QgYW5kIHN1Z2dlc3RzIHBvcnRpbmcgdG8gXCJuZXcgVUlFdmVudCgpXCIuXG4gIChldmVudCBhcyBhbnkpLmluaXRVSUV2ZW50KHR5cGUsIHRydWUsIHRydWUsIHdpbmRvdywgMCk7XG5cbiAgLy8gTW9zdCBvZiB0aGUgYnJvd3NlcnMgZG9uJ3QgaGF2ZSBhIFwiaW5pdFRvdWNoRXZlbnRcIiBtZXRob2QgdGhhdCBjYW4gYmUgdXNlZCB0byBkZWZpbmVcbiAgLy8gdGhlIHRvdWNoIGRldGFpbHMuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKGV2ZW50LCB7XG4gICAgdG91Y2hlczoge3ZhbHVlOiBbdG91Y2hEZXRhaWxzXX0sXG4gICAgdGFyZ2V0VG91Y2hlczoge3ZhbHVlOiBbdG91Y2hEZXRhaWxzXX0sXG4gICAgY2hhbmdlZFRvdWNoZXM6IHt2YWx1ZTogW3RvdWNoRGV0YWlsc119XG4gIH0pO1xuXG4gIHJldHVybiBldmVudDtcbn1cblxuLyoqXG4gKiBEaXNwYXRjaGVzIGEga2V5ZG93biBldmVudCBmcm9tIGFuIGVsZW1lbnQuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVLZXlib2FyZEV2ZW50KHR5cGU6IHN0cmluZywga2V5Q29kZTogbnVtYmVyID0gMCwga2V5OiBzdHJpbmcgPSAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldD86IEVsZW1lbnQsIG1vZGlmaWVyczogTW9kaWZpZXJLZXlzID0ge30pIHtcbiAgY29uc3QgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnS2V5Ym9hcmRFdmVudCcpIGFzIGFueTtcbiAgY29uc3Qgb3JpZ2luYWxQcmV2ZW50RGVmYXVsdCA9IGV2ZW50LnByZXZlbnREZWZhdWx0O1xuXG4gIC8vIEZpcmVmb3ggZG9lcyBub3Qgc3VwcG9ydCBgaW5pdEtleWJvYXJkRXZlbnRgLCBidXQgc3VwcG9ydHMgYGluaXRLZXlFdmVudGAuXG4gIGlmIChldmVudC5pbml0S2V5RXZlbnQpIHtcbiAgICBldmVudC5pbml0S2V5RXZlbnQodHlwZSwgdHJ1ZSwgdHJ1ZSwgd2luZG93LCBtb2RpZmllcnMuY29udHJvbCwgbW9kaWZpZXJzLmFsdCwgbW9kaWZpZXJzLnNoaWZ0LFxuICAgICAgICBtb2RpZmllcnMubWV0YSwga2V5Q29kZSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYGluaXRLZXlib2FyZEV2ZW50YCBleHBlY3RzIHRvIHJlY2VpdmUgbW9kaWZpZXJzIGFzIGEgd2hpdGVzcGFjZS1kZWxpbWl0ZWQgc3RyaW5nXG4gICAgLy8gU2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9LZXlib2FyZEV2ZW50L2luaXRLZXlib2FyZEV2ZW50XG4gICAgbGV0IG1vZGlmaWVyc0xpc3QgPSAnJztcblxuICAgIGlmIChtb2RpZmllcnMuY29udHJvbCkge1xuICAgICAgbW9kaWZpZXJzTGlzdCArPSAnQ29udHJvbCAnO1xuICAgIH1cblxuICAgIGlmIChtb2RpZmllcnMuYWx0KSB7XG4gICAgICBtb2RpZmllcnNMaXN0ICs9ICdBbHQgJztcbiAgICB9XG5cbiAgICBpZiAobW9kaWZpZXJzLnNoaWZ0KSB7XG4gICAgICBtb2RpZmllcnNMaXN0ICs9ICdTaGlmdCAnO1xuICAgIH1cblxuICAgIGlmIChtb2RpZmllcnMubWV0YSkge1xuICAgICAgbW9kaWZpZXJzTGlzdCArPSAnTWV0YSAnO1xuICAgIH1cblxuICAgIGV2ZW50LmluaXRLZXlib2FyZEV2ZW50KHR5cGUsXG4gICAgICAgIHRydWUsIC8qIGNhbkJ1YmJsZSAqL1xuICAgICAgICB0cnVlLCAvKiBjYW5jZWxhYmxlICovXG4gICAgICAgIHdpbmRvdywgLyogdmlldyAqL1xuICAgICAgICAwLCAvKiBjaGFyICovXG4gICAgICAgIGtleSwgLyoga2V5ICovXG4gICAgICAgIDAsIC8qIGxvY2F0aW9uICovXG4gICAgICAgIG1vZGlmaWVyc0xpc3QudHJpbSgpLCAvKiBtb2RpZmllcnNMaXN0ICovXG4gICAgICAgIGZhbHNlIC8qIHJlcGVhdCAqLyk7XG4gIH1cblxuICAvLyBXZWJraXQgQnJvd3NlcnMgZG9uJ3Qgc2V0IHRoZSBrZXlDb2RlIHdoZW4gY2FsbGluZyB0aGUgaW5pdCBmdW5jdGlvbi5cbiAgLy8gU2VlIHJlbGF0ZWQgYnVnIGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD0xNjczNVxuICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhldmVudCwge1xuICAgIGtleUNvZGU6IHsgZ2V0OiAoKSA9PiBrZXlDb2RlIH0sXG4gICAga2V5OiB7IGdldDogKCkgPT4ga2V5IH0sXG4gICAgdGFyZ2V0OiB7IGdldDogKCkgPT4gdGFyZ2V0IH0sXG4gICAgY3RybEtleTogeyBnZXQ6ICgpID0+ICEhbW9kaWZpZXJzLmNvbnRyb2wgfSxcbiAgICBhbHRLZXk6IHsgZ2V0OiAoKSA9PiAhIW1vZGlmaWVycy5hbHQgfSxcbiAgICBzaGlmdEtleTogeyBnZXQ6ICgpID0+ICEhbW9kaWZpZXJzLnNoaWZ0IH0sXG4gICAgbWV0YUtleTogeyBnZXQ6ICgpID0+ICEhbW9kaWZpZXJzLm1ldGEgfVxuICB9KTtcblxuICAvLyBJRSB3b24ndCBzZXQgYGRlZmF1bHRQcmV2ZW50ZWRgIG9uIHN5bnRoZXRpYyBldmVudHMgc28gd2UgbmVlZCB0byBkbyBpdCBtYW51YWxseS5cbiAgZXZlbnQucHJldmVudERlZmF1bHQgPSBmdW5jdGlvbigpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXZlbnQsICdkZWZhdWx0UHJldmVudGVkJywgeyBnZXQ6ICgpID0+IHRydWUgfSk7XG4gICAgcmV0dXJuIG9yaWdpbmFsUHJldmVudERlZmF1bHQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfTtcblxuICByZXR1cm4gZXZlbnQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZha2UgZXZlbnQgb2JqZWN0IHdpdGggYW55IGRlc2lyZWQgZXZlbnQgdHlwZS5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZha2VFdmVudCh0eXBlOiBzdHJpbmcsIGNhbkJ1YmJsZSA9IGZhbHNlLCBjYW5jZWxhYmxlID0gdHJ1ZSkge1xuICBjb25zdCBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuICBldmVudC5pbml0RXZlbnQodHlwZSwgY2FuQnViYmxlLCBjYW5jZWxhYmxlKTtcbiAgcmV0dXJuIGV2ZW50O1xufVxuIl19