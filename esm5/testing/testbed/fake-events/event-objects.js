/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __assign } from "tslib";
/**
 * Creates a browser MouseEvent with the specified options.
 * @docs-private
 */
export function createMouseEvent(type, clientX, clientY, button) {
    if (clientX === void 0) { clientX = 0; }
    if (clientY === void 0) { clientY = 0; }
    if (button === void 0) { button = 0; }
    var event = document.createEvent('MouseEvent');
    var originalPreventDefault = event.preventDefault.bind(event);
    // Note: We cannot determine the position of the mouse event based on the screen
    // because the dimensions and position of the browser window are not available
    // To provide reasonable `screenX` and `screenY` coordinates, we simply use the
    // client coordinates as if the browser is opened in fullscreen.
    var screenX = clientX;
    var screenY = clientY;
    event.initMouseEvent(type, 
    /* canBubble */ true, 
    /* cancelable */ true, 
    /* view */ window, 
    /* detail */ 0, 
    /* screenX */ screenX, 
    /* screenY */ screenY, 
    /* clientX */ clientX, 
    /* clientY */ clientY, 
    /* ctrlKey */ false, 
    /* altKey */ false, 
    /* shiftKey */ false, 
    /* metaKey */ false, 
    /* button */ button, 
    /* relatedTarget */ null);
    // `initMouseEvent` doesn't allow us to pass the `buttons` and
    // defaults it to 0 which looks like a fake event.
    defineReadonlyEventProperty(event, 'buttons', 1);
    // IE won't set `defaultPrevented` on synthetic events so we need to do it manually.
    event.preventDefault = function () {
        defineReadonlyEventProperty(event, 'defaultPrevented', true);
        return originalPreventDefault();
    };
    return event;
}
/**
 * Creates a browser `PointerEvent` with the specified options. Pointer events
 * by default will appear as if they are the primary pointer of their type.
 * https://www.w3.org/TR/pointerevents2/#dom-pointerevent-isprimary.
 *
 * For example, if pointer events for a multi-touch interaction are created, the non-primary
 * pointer touches would need to be represented by non-primary pointer events.
 *
 * @docs-private
 */
export function createPointerEvent(type, clientX, clientY, options) {
    if (clientX === void 0) { clientX = 0; }
    if (clientY === void 0) { clientY = 0; }
    if (options === void 0) { options = { isPrimary: true }; }
    return new PointerEvent(type, __assign({ bubbles: true, cancelable: true, view: window, clientX: clientX,
        clientY: clientY }, options));
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
    defineReadonlyEventProperty(event, 'touches', [touchDetails]);
    defineReadonlyEventProperty(event, 'targetTouches', [touchDetails]);
    defineReadonlyEventProperty(event, 'changedTouches', [touchDetails]);
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
    defineReadonlyEventProperty(event, 'keyCode', keyCode);
    defineReadonlyEventProperty(event, 'key', key);
    defineReadonlyEventProperty(event, 'target', target);
    defineReadonlyEventProperty(event, 'ctrlKey', !!modifiers.control);
    defineReadonlyEventProperty(event, 'altKey', !!modifiers.alt);
    defineReadonlyEventProperty(event, 'shiftKey', !!modifiers.shift);
    defineReadonlyEventProperty(event, 'metaKey', !!modifiers.meta);
    // IE won't set `defaultPrevented` on synthetic events so we need to do it manually.
    event.preventDefault = function () {
        defineReadonlyEventProperty(event, 'defaultPrevented', true);
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
/**
 * Defines a readonly property on the given event object. Readonly properties on an event object
 * are always set as configurable as that matches default readonly properties for DOM event objects.
 */
function defineReadonlyEventProperty(event, propertyName, value) {
    Object.defineProperty(event, propertyName, { get: function () { return value; }, configurable: true });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnQtb2JqZWN0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGVzdGluZy90ZXN0YmVkL2Zha2UtZXZlbnRzL2V2ZW50LW9iamVjdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUlIOzs7R0FHRztBQUNILE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxJQUFZLEVBQUUsT0FBVyxFQUFFLE9BQVcsRUFBRSxNQUFVO0lBQXBDLHdCQUFBLEVBQUEsV0FBVztJQUFFLHdCQUFBLEVBQUEsV0FBVztJQUFFLHVCQUFBLEVBQUEsVUFBVTtJQUNqRixJQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ2pELElBQU0sc0JBQXNCLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFaEUsZ0ZBQWdGO0lBQ2hGLDhFQUE4RTtJQUM5RSwrRUFBK0U7SUFDL0UsZ0VBQWdFO0lBQ2hFLElBQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQztJQUN4QixJQUFNLE9BQU8sR0FBRyxPQUFPLENBQUM7SUFFeEIsS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJO0lBQ3ZCLGVBQWUsQ0FBQyxJQUFJO0lBQ3BCLGdCQUFnQixDQUFDLElBQUk7SUFDckIsVUFBVSxDQUFDLE1BQU07SUFDakIsWUFBWSxDQUFDLENBQUM7SUFDZCxhQUFhLENBQUMsT0FBTztJQUNyQixhQUFhLENBQUMsT0FBTztJQUNyQixhQUFhLENBQUMsT0FBTztJQUNyQixhQUFhLENBQUMsT0FBTztJQUNyQixhQUFhLENBQUMsS0FBSztJQUNuQixZQUFZLENBQUMsS0FBSztJQUNsQixjQUFjLENBQUMsS0FBSztJQUNwQixhQUFhLENBQUMsS0FBSztJQUNuQixZQUFZLENBQUMsTUFBTTtJQUNuQixtQkFBbUIsQ0FBQyxJ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UUFDckIsMkJBQTJCLENBQUMsS0FBSyxFQUFFLGtCQUFrQixFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzdELE9BQU8sc0JBQXNCLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN2RCxDQUFDLENBQUM7SUFFRixPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsZUFBZSxDQUFDLElBQVksRUFBRSxTQUFpQixFQUFFLFVBQWlCO0lBQXBDLDBCQUFBLEVBQUEsaUJBQWlCO0lBQUUsMkJBQUEsRUFBQSxpQkFBaUI7SUFDaEYsSUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM1QyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDN0MsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUywyQkFBMkIsQ0FBQyxLQUFZLEVBQUUsWUFBb0IsRUFBRSxLQUFVO0lBQ2pGLE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxFQUFDLEdBQUcsRUFBRSxjQUFNLE9BQUEsS0FBSyxFQUFMLENBQUssRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUNyRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7TW9kaWZpZXJLZXlzfSBmcm9tICdAYW5ndWxhci9jZGsvdGVzdGluZyc7XG5cbi8qKlxuICogQ3JlYXRlcyBhIGJyb3dzZXIgTW91c2VFdmVudCB3aXRoIHRoZSBzcGVjaWZpZWQgb3B0aW9ucy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU1vdXNlRXZlbnQodHlwZTogc3RyaW5nLCBjbGllbnRYID0gMCwgY2xpZW50WSA9IDAsIGJ1dHRvbiA9IDApIHtcbiAgY29uc3QgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnTW91c2VFdmVudCcpO1xuICBjb25zdCBvcmlnaW5hbFByZXZlbnREZWZhdWx0ID0gZXZlbnQucHJldmVudERlZmF1bHQuYmluZChldmVudCk7XG5cbiAgLy8gTm90ZTogV2UgY2Fubm90IGRldGVybWluZSB0aGUgcG9zaXRpb24gb2YgdGhlIG1vdXNlIGV2ZW50IGJhc2VkIG9uIHRoZSBzY3JlZW5cbiAgLy8gYmVjYXVzZSB0aGUgZGltZW5zaW9ucyBhbmQgcG9zaXRpb24gb2YgdGhlIGJyb3dzZXIgd2luZG93IGFyZSBub3QgYXZhaWxhYmxlXG4gIC8vIFRvIHByb3ZpZGUgcmVhc29uYWJsZSBgc2NyZWVuWGAgYW5kIGBzY3JlZW5ZYCBjb29yZGluYXRlcywgd2Ugc2ltcGx5IHVzZSB0aGVcbiAgLy8gY2xpZW50IGNvb3JkaW5hdGVzIGFzIGlmIHRoZSBicm93c2VyIGlzIG9wZW5lZCBpbiBmdWxsc2NyZWVuLlxuICBjb25zdCBzY3JlZW5YID0gY2xpZW50WDtcbiAgY29uc3Qgc2NyZWVuWSA9IGNsaWVudFk7XG5cbiAgZXZlbnQuaW5pdE1vdXNlRXZlbnQodHlwZSxcbiAgICAvKiBjYW5CdWJibGUgKi8gdHJ1ZSxcbiAgICAvKiBjYW5jZWxhYmxlICovIHRydWUsXG4gICAgLyogdmlldyAqLyB3aW5kb3csXG4gICAgLyogZGV0YWlsICovIDAsXG4gICAgLyogc2NyZWVuWCAqLyBzY3JlZW5YLFxuICAgIC8qIHNjcmVlblkgKi8gc2NyZWVuWSxcbiAgICAvKiBjbGllbnRYICovIGNsaWVudFgsXG4gICAgLyogY2xpZW50WSAqLyBjbGllbnRZLFxuICAgIC8qIGN0cmxLZXkgKi8gZmFsc2UsXG4gICAgLyogYWx0S2V5ICovIGZhbHNlLFxuICAgIC8qIHNoaWZ0S2V5ICovIGZhbHNlLFxuICAgIC8qIG1ldGFLZXkgKi8gZmFsc2UsXG4gICAgLyogYnV0dG9uICovIGJ1dHRvbixcbiAgICAvKiByZWxhdGVkVGFyZ2V0ICovIG51bGwpO1xuXG4gIC8vIGBpbml0TW91c2VFdmVudGAgZG9lc24ndCBhbGxvdyB1cyB0byBwYXNzIHRoZSBgYnV0dG9uc2AgYW5kXG4gIC8vIGRlZmF1bHRzIGl0IHRvIDAgd2hpY2ggbG9va3MgbGlrZSBhIGZha2UgZXZlbnQuXG4gIGRlZmluZVJlYWRvbmx5RXZlbnRQcm9wZXJ0eShldmVudCwgJ2J1dHRvbnMnLCAxKTtcblxuICAvLyBJRSB3b24ndCBzZXQgYGRlZmF1bHRQcmV2ZW50ZWRgIG9uIHN5bnRoZXRpYyBldmVudHMgc28gd2UgbmVlZCB0byBkbyBpdCBtYW51YWxseS5cbiAgZXZlbnQucHJldmVudERlZmF1bHQgPSBmdW5jdGlvbigpIHtcbiAgICBkZWZpbmVSZWFkb25seUV2ZW50UHJvcGVydHkoZXZlbnQsICdkZWZhdWx0UHJldmVudGVkJywgdHJ1ZSk7XG4gICAgcmV0dXJuIG9yaWdpbmFsUHJldmVudERlZmF1bHQoKTtcbiAgfTtcblxuICByZXR1cm4gZXZlbnQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGJyb3dzZXIgYFBvaW50ZXJFdmVudGAgd2l0aCB0aGUgc3BlY2lmaWVkIG9wdGlvbnMuIFBvaW50ZXIgZXZlbnRzXG4gKiBieSBkZWZhdWx0IHdpbGwgYXBwZWFyIGFzIGlmIHRoZXkgYXJlIHRoZSBwcmltYXJ5IHBvaW50ZXIgb2YgdGhlaXIgdHlwZS5cbiAqIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9wb2ludGVyZXZlbnRzMi8jZG9tLXBvaW50ZXJldmVudC1pc3ByaW1hcnkuXG4gKlxuICogRm9yIGV4YW1wbGUsIGlmIHBvaW50ZXIgZXZlbnRzIGZvciBhIG11bHRpLXRvdWNoIGludGVyYWN0aW9uIGFyZSBjcmVhdGVkLCB0aGUgbm9uLXByaW1hcnlcbiAqIHBvaW50ZXIgdG91Y2hlcyB3b3VsZCBuZWVkIHRvIGJlIHJlcHJlc2VudGVkIGJ5IG5vbi1wcmltYXJ5IHBvaW50ZXIgZXZlbnRzLlxuICpcbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVBvaW50ZXJFdmVudCh0eXBlOiBzdHJpbmcsIGNsaWVudFggPSAwLCBjbGllbnRZID0gMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uczogUG9pbnRlckV2ZW50SW5pdCA9IHtpc1ByaW1hcnk6IHRydWV9KSB7XG4gIHJldHVybiBuZXcgUG9pbnRlckV2ZW50KHR5cGUsIHtcbiAgICBidWJibGVzOiB0cnVlLFxuICAgIGNhbmNlbGFibGU6IHRydWUsXG4gICAgdmlldzogd2luZG93LFxuICAgIGNsaWVudFgsXG4gICAgY2xpZW50WSxcbiAgICAuLi5vcHRpb25zLFxuICB9KTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgYnJvd3NlciBUb3VjaEV2ZW50IHdpdGggdGhlIHNwZWNpZmllZCBwb2ludGVyIGNvb3JkaW5hdGVzLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVG91Y2hFdmVudCh0eXBlOiBzdHJpbmcsIHBhZ2VYID0gMCwgcGFnZVkgPSAwKSB7XG4gIC8vIEluIGZhdm9yIG9mIGNyZWF0aW5nIGV2ZW50cyB0aGF0IHdvcmsgZm9yIG1vc3Qgb2YgdGhlIGJyb3dzZXJzLCB0aGUgZXZlbnQgaXMgY3JlYXRlZFxuICAvLyBhcyBhIGJhc2ljIFVJIEV2ZW50LiBUaGUgbmVjZXNzYXJ5IGRldGFpbHMgZm9yIHRoZSBldmVudCB3aWxsIGJlIHNldCBtYW51YWxseS5cbiAgY29uc3QgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnVUlFdmVudCcpO1xuICBjb25zdCB0b3VjaERldGFpbHMgPSB7cGFnZVgsIHBhZ2VZfTtcblxuICAvLyBUUzMuNiByZW1vdmVzIHRoZSBpbml0VUlFdmVudCBtZXRob2QgYW5kIHN1Z2dlc3RzIHBvcnRpbmcgdG8gXCJuZXcgVUlFdmVudCgpXCIuXG4gIChldmVudCBhcyBhbnkpLmluaXRVSUV2ZW50KHR5cGUsIHRydWUsIHRydWUsIHdpbmRvdywgMCk7XG5cbiAgLy8gTW9zdCBvZiB0aGUgYnJvd3NlcnMgZG9uJ3QgaGF2ZSBhIFwiaW5pdFRvdWNoRXZlbnRcIiBtZXRob2QgdGhhdCBjYW4gYmUgdXNlZCB0byBkZWZpbmVcbiAgLy8gdGhlIHRvdWNoIGRldGFpbHMuXG4gIGRlZmluZVJlYWRvbmx5RXZlbnRQcm9wZXJ0eShldmVudCwgJ3RvdWNoZXMnLCBbdG91Y2hEZXRhaWxzXSk7XG4gIGRlZmluZVJlYWRvbmx5RXZlbnRQcm9wZXJ0eShldmVudCwgJ3RhcmdldFRvdWNoZXMnLCBbdG91Y2hEZXRhaWxzXSk7XG4gIGRlZmluZVJlYWRvbmx5RXZlbnRQcm9wZXJ0eShldmVudCwgJ2NoYW5nZWRUb3VjaGVzJywgW3RvdWNoRGV0YWlsc10pO1xuXG4gIHJldHVybiBldmVudDtcbn1cblxuLyoqXG4gKiBEaXNwYXRjaGVzIGEga2V5ZG93biBldmVudCBmcm9tIGFuIGVsZW1lbnQuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVLZXlib2FyZEV2ZW50KHR5cGU6IHN0cmluZywga2V5Q29kZTogbnVtYmVyID0gMCwga2V5OiBzdHJpbmcgPSAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldD86IEVsZW1lbnQsIG1vZGlmaWVyczogTW9kaWZpZXJLZXlzID0ge30pIHtcbiAgY29uc3QgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnS2V5Ym9hcmRFdmVudCcpIGFzIGFueTtcbiAgY29uc3Qgb3JpZ2luYWxQcmV2ZW50RGVmYXVsdCA9IGV2ZW50LnByZXZlbnREZWZhdWx0O1xuXG4gIC8vIEZpcmVmb3ggZG9lcyBub3Qgc3VwcG9ydCBgaW5pdEtleWJvYXJkRXZlbnRgLCBidXQgc3VwcG9ydHMgYGluaXRLZXlFdmVudGAuXG4gIGlmIChldmVudC5pbml0S2V5RXZlbnQpIHtcbiAgICBldmVudC5pbml0S2V5RXZlbnQodHlwZSwgdHJ1ZSwgdHJ1ZSwgd2luZG93LCBtb2RpZmllcnMuY29udHJvbCwgbW9kaWZpZXJzLmFsdCwgbW9kaWZpZXJzLnNoaWZ0LFxuICAgICAgICBtb2RpZmllcnMubWV0YSwga2V5Q29kZSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYGluaXRLZXlib2FyZEV2ZW50YCBleHBlY3RzIHRvIHJlY2VpdmUgbW9kaWZpZXJzIGFzIGEgd2hpdGVzcGFjZS1kZWxpbWl0ZWQgc3RyaW5nXG4gICAgLy8gU2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9LZXlib2FyZEV2ZW50L2luaXRLZXlib2FyZEV2ZW50XG4gICAgbGV0IG1vZGlmaWVyc0xpc3QgPSAnJztcblxuICAgIGlmIChtb2RpZmllcnMuY29udHJvbCkge1xuICAgICAgbW9kaWZpZXJzTGlzdCArPSAnQ29udHJvbCAnO1xuICAgIH1cblxuICAgIGlmIChtb2RpZmllcnMuYWx0KSB7XG4gICAgICBtb2RpZmllcnNMaXN0ICs9ICdBbHQgJztcbiAgICB9XG5cbiAgICBpZiAobW9kaWZpZXJzLnNoaWZ0KSB7XG4gICAgICBtb2RpZmllcnNMaXN0ICs9ICdTaGlmdCAnO1xuICAgIH1cblxuICAgIGlmIChtb2RpZmllcnMubWV0YSkge1xuICAgICAgbW9kaWZpZXJzTGlzdCArPSAnTWV0YSAnO1xuICAgIH1cblxuICAgIGV2ZW50LmluaXRLZXlib2FyZEV2ZW50KHR5cGUsXG4gICAgICAgIHRydWUsIC8qIGNhbkJ1YmJsZSAqL1xuICAgICAgICB0cnVlLCAvKiBjYW5jZWxhYmxlICovXG4gICAgICAgIHdpbmRvdywgLyogdmlldyAqL1xuICAgICAgICAwLCAvKiBjaGFyICovXG4gICAgICAgIGtleSwgLyoga2V5ICovXG4gICAgICAgIDAsIC8qIGxvY2F0aW9uICovXG4gICAgICAgIG1vZGlmaWVyc0xpc3QudHJpbSgpLCAvKiBtb2RpZmllcnNMaXN0ICovXG4gICAgICAgIGZhbHNlIC8qIHJlcGVhdCAqLyk7XG4gIH1cblxuICAvLyBXZWJraXQgQnJvd3NlcnMgZG9uJ3Qgc2V0IHRoZSBrZXlDb2RlIHdoZW4gY2FsbGluZyB0aGUgaW5pdCBmdW5jdGlvbi5cbiAgLy8gU2VlIHJlbGF0ZWQgYnVnIGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD0xNjczNVxuICBkZWZpbmVSZWFkb25seUV2ZW50UHJvcGVydHkoZXZlbnQsICdrZXlDb2RlJywga2V5Q29kZSk7XG4gIGRlZmluZVJlYWRvbmx5RXZlbnRQcm9wZXJ0eShldmVudCwgJ2tleScsIGtleSk7XG4gIGRlZmluZVJlYWRvbmx5RXZlbnRQcm9wZXJ0eShldmVudCwgJ3RhcmdldCcsIHRhcmdldCk7XG4gIGRlZmluZVJlYWRvbmx5RXZlbnRQcm9wZXJ0eShldmVudCwgJ2N0cmxLZXknLCAhIW1vZGlmaWVycy5jb250cm9sKTtcbiAgZGVmaW5lUmVhZG9ubHlFdmVudFByb3BlcnR5KGV2ZW50LCAnYWx0S2V5JywgISFtb2RpZmllcnMuYWx0KTtcbiAgZGVmaW5lUmVhZG9ubHlFdmVudFByb3BlcnR5KGV2ZW50LCAnc2hpZnRLZXknLCAhIW1vZGlmaWVycy5zaGlmdCk7XG4gIGRlZmluZVJlYWRvbmx5RXZlbnRQcm9wZXJ0eShldmVudCwgJ21ldGFLZXknLCAhIW1vZGlmaWVycy5tZXRhKTtcblxuICAvLyBJRSB3b24ndCBzZXQgYGRlZmF1bHRQcmV2ZW50ZWRgIG9uIHN5bnRoZXRpYyBldmVudHMgc28gd2UgbmVlZCB0byBkbyBpdCBtYW51YWxseS5cbiAgZXZlbnQucHJldmVudERlZmF1bHQgPSBmdW5jdGlvbigpIHtcbiAgICBkZWZpbmVSZWFkb25seUV2ZW50UHJvcGVydHkoZXZlbnQsICdkZWZhdWx0UHJldmVudGVkJywgdHJ1ZSk7XG4gICAgcmV0dXJuIG9yaWdpbmFsUHJldmVudERlZmF1bHQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfTtcblxuICByZXR1cm4gZXZlbnQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZha2UgZXZlbnQgb2JqZWN0IHdpdGggYW55IGRlc2lyZWQgZXZlbnQgdHlwZS5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZha2VFdmVudCh0eXBlOiBzdHJpbmcsIGNhbkJ1YmJsZSA9IGZhbHNlLCBjYW5jZWxhYmxlID0gdHJ1ZSkge1xuICBjb25zdCBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuICBldmVudC5pbml0RXZlbnQodHlwZSwgY2FuQnViYmxlLCBjYW5jZWxhYmxlKTtcbiAgcmV0dXJuIGV2ZW50O1xufVxuXG4vKipcbiAqIERlZmluZXMgYSByZWFkb25seSBwcm9wZXJ0eSBvbiB0aGUgZ2l2ZW4gZXZlbnQgb2JqZWN0LiBSZWFkb25seSBwcm9wZXJ0aWVzIG9uIGFuIGV2ZW50IG9iamVjdFxuICogYXJlIGFsd2F5cyBzZXQgYXMgY29uZmlndXJhYmxlIGFzIHRoYXQgbWF0Y2hlcyBkZWZhdWx0IHJlYWRvbmx5IHByb3BlcnRpZXMgZm9yIERPTSBldmVudCBvYmplY3RzLlxuICovXG5mdW5jdGlvbiBkZWZpbmVSZWFkb25seUV2ZW50UHJvcGVydHkoZXZlbnQ6IEV2ZW50LCBwcm9wZXJ0eU5hbWU6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXZlbnQsIHByb3BlcnR5TmFtZSwge2dldDogKCkgPT4gdmFsdWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZX0pO1xufVxuIl19