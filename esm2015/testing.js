/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Creates a browser MouseEvent with the specified options.
 * \@docs-private
 * @param {?} type
 * @param {?=} x
 * @param {?=} y
 * @param {?=} button
 * @return {?}
 */
function createMouseEvent(type, x = 0, y = 0, button = 0) {
    /** @type {?} */
    const event = document.createEvent('MouseEvent');
    /** @type {?} */
    const originalPreventDefault = event.preventDefault;
    event.initMouseEvent(type, true, /* canBubble */ true, /* cancelable */ window, /* view */ 0, /* detail */ x, /* screenX */ y, /* screenY */ x, /* clientX */ y, /* clientY */ false, /* ctrlKey */ false, /* altKey */ false, /* shiftKey */ false, /* metaKey */ button, /* button */ null /* relatedTarget */);
    // `initMouseEvent` doesn't allow us to pass the `buttons` and
    // defaults it to 0 which looks like a fake event.
    Object.defineProperty(event, 'buttons', { get: (/**
         * @return {?}
         */
        () => 1) });
    // IE won't set `defaultPrevented` on synthetic events so we need to do it manually.
    event.preventDefault = (/**
     * @return {?}
     */
    function () {
        Object.defineProperty(event, 'defaultPrevented', { get: (/**
             * @return {?}
             */
            () => true) });
        return originalPreventDefault.apply(this, arguments);
    });
    return event;
}
/**
 * Creates a browser TouchEvent with the specified pointer coordinates.
 * \@docs-private
 * @param {?} type
 * @param {?=} pageX
 * @param {?=} pageY
 * @return {?}
 */
function createTouchEvent(type, pageX = 0, pageY = 0) {
    // In favor of creating events that work for most of the browsers, the event is created
    // as a basic UI Event. The necessary details for the event will be set manually.
    /** @type {?} */
    const event = document.createEvent('UIEvent');
    /** @type {?} */
    const touchDetails = { pageX, pageY };
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
 * \@docs-private
 * @param {?} type
 * @param {?=} keyCode
 * @param {?=} key
 * @param {?=} target
 * @param {?=} modifiers
 * @return {?}
 */
function createKeyboardEvent(type, keyCode = 0, key = '', target, modifiers = {}) {
    /** @type {?} */
    const event = (/** @type {?} */ (document.createEvent('KeyboardEvent')));
    /** @type {?} */
    const originalPreventDefault = event.preventDefault;
    // Firefox does not support `initKeyboardEvent`, but supports `initKeyEvent`.
    if (event.initKeyEvent) {
        event.initKeyEvent(type, true, true, window, modifiers.control, modifiers.alt, modifiers.shift, modifiers.meta, keyCode);
    }
    else {
        // `initKeyboardEvent` expects to receive modifiers as a whitespace-delimited string
        // See https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/initKeyboardEvent
        /** @type {?} */
        const modifiersStr = (modifiers.control ? 'Control ' : '' + modifiers.alt ? 'Alt ' : '' +
            modifiers.shift ? 'Shift ' : '' + modifiers.meta ? 'Meta' : '').trim();
        event.initKeyboardEvent(type, true, /* canBubble */ true, /* cancelable */ window, /* view */ 0, /* char */ key, /* key */ 0, /* location */ modifiersStr, /* modifiersList */ false /* repeat */);
    }
    // Webkit Browsers don't set the keyCode when calling the init function.
    // See related bug https://bugs.webkit.org/show_bug.cgi?id=16735
    Object.defineProperties(event, {
        keyCode: { get: (/**
             * @return {?}
             */
            () => keyCode) },
        key: { get: (/**
             * @return {?}
             */
            () => key) },
        target: { get: (/**
             * @return {?}
             */
            () => target) },
        ctrlKey: { get: (/**
             * @return {?}
             */
            () => !!modifiers.control) },
        altKey: { get: (/**
             * @return {?}
             */
            () => !!modifiers.alt) },
        shiftKey: { get: (/**
             * @return {?}
             */
            () => !!modifiers.shift) },
        metaKey: { get: (/**
             * @return {?}
             */
            () => !!modifiers.meta) }
    });
    // IE won't set `defaultPrevented` on synthetic events so we need to do it manually.
    event.preventDefault = (/**
     * @return {?}
     */
    function () {
        Object.defineProperty(event, 'defaultPrevented', { get: (/**
             * @return {?}
             */
            () => true) });
        return originalPreventDefault.apply(this, arguments);
    });
    return event;
}
/**
 * Creates a fake event object with any desired event type.
 * \@docs-private
 * @param {?} type
 * @param {?=} canBubble
 * @param {?=} cancelable
 * @return {?}
 */
function createFakeEvent(type, canBubble = false, cancelable = true) {
    /** @type {?} */
    const event = document.createEvent('Event');
    event.initEvent(type, canBubble, cancelable);
    return event;
}

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Utility to dispatch any event on a Node.
 * \@docs-private
 * @param {?} node
 * @param {?} event
 * @return {?}
 */
function dispatchEvent(node, event) {
    node.dispatchEvent(event);
    return event;
}
/**
 * Shorthand to dispatch a fake event on a specified node.
 * \@docs-private
 * @param {?} node
 * @param {?} type
 * @param {?=} canBubble
 * @return {?}
 */
function dispatchFakeEvent(node, type, canBubble) {
    return dispatchEvent(node, createFakeEvent(type, canBubble));
}
/**
 * Shorthand to dispatch a keyboard event with a specified key code.
 * \@docs-private
 * @param {?} node
 * @param {?} type
 * @param {?=} keyCode
 * @param {?=} key
 * @param {?=} target
 * @param {?=} modifiers
 * @return {?}
 */
function dispatchKeyboardEvent(node, type, keyCode, key, target, modifiers) {
    return (/** @type {?} */ (dispatchEvent(node, createKeyboardEvent(type, keyCode, key, target, modifiers))));
}
/**
 * Shorthand to dispatch a mouse event on the specified coordinates.
 * \@docs-private
 * @param {?} node
 * @param {?} type
 * @param {?=} x
 * @param {?=} y
 * @param {?=} event
 * @return {?}
 */
function dispatchMouseEvent(node, type, x = 0, y = 0, event = createMouseEvent(type, x, y)) {
    return (/** @type {?} */ (dispatchEvent(node, event)));
}
/**
 * Shorthand to dispatch a touch event on the specified coordinates.
 * \@docs-private
 * @param {?} node
 * @param {?} type
 * @param {?=} x
 * @param {?=} y
 * @return {?}
 */
function dispatchTouchEvent(node, type, x = 0, y = 0) {
    return dispatchEvent(node, createTouchEvent(type, x, y));
}

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @param {?} element
 * @param {?} event
 * @return {?}
 */
function triggerFocusChange(element, event) {
    /** @type {?} */
    let eventFired = false;
    /** @type {?} */
    const handler = (/**
     * @return {?}
     */
    () => eventFired = true);
    element.addEventListener(event, handler);
    element[event]();
    element.removeEventListener(event, handler);
    if (!eventFired) {
        dispatchFakeEvent(element, event);
    }
}
/**
 * Patches an elements focus and blur methods to emit events consistently and predictably.
 * This is necessary, because some browsers, like IE11, will call the focus handlers asynchronously,
 * while others won't fire them at all if the browser window is not focused.
 * \@docs-private
 * @param {?} element
 * @return {?}
 */
function patchElementFocus(element) {
    element.focus = (/**
     * @return {?}
     */
    () => dispatchFakeEvent(element, 'focus'));
    element.blur = (/**
     * @return {?}
     */
    () => dispatchFakeEvent(element, 'blur'));
}
/**
 * \@docs-private
 * @param {?} element
 * @return {?}
 */
function triggerFocus(element) {
    triggerFocusChange(element, 'focus');
}
/**
 * \@docs-private
 * @param {?} element
 * @return {?}
 */
function triggerBlur(element) {
    triggerFocusChange(element, 'blur');
}

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Checks whether the given Element is a text input element.
 * \@docs-private
 * @param {?} element
 * @return {?}
 */
function isTextInput(element) {
    return element.nodeName.toLowerCase() === 'input' ||
        element.nodeName.toLowerCase() === 'textarea';
}
/**
 * @param {?} element
 * @param {...?} modifiersAndKeys
 * @return {?}
 */
function typeInElement(element, ...modifiersAndKeys) {
    /** @type {?} */
    const first = modifiersAndKeys[0];
    /** @type {?} */
    let modifiers;
    /** @type {?} */
    let rest;
    if (typeof first !== 'string' && first.keyCode === undefined && first.key === undefined) {
        modifiers = first;
        rest = modifiersAndKeys.slice(1);
    }
    else {
        modifiers = {};
        rest = modifiersAndKeys;
    }
    /** @type {?} */
    const keys = rest
        .map((/**
     * @param {?} k
     * @return {?}
     */
    k => typeof k === 'string' ?
        k.split('').map((/**
         * @param {?} c
         * @return {?}
         */
        c => ({ keyCode: c.toUpperCase().charCodeAt(0), key: c }))) : [k]))
        .reduce((/**
     * @param {?} arr
     * @param {?} k
     * @return {?}
     */
    (arr, k) => arr.concat(k)), []);
    triggerFocus(element);
    for (const key of keys) {
        dispatchKeyboardEvent(element, 'keydown', key.keyCode, key.key, element, modifiers);
        dispatchKeyboardEvent(element, 'keypress', key.keyCode, key.key, element, modifiers);
        if (isTextInput(element) && key.key && key.key.length === 1) {
            element.value += key.key;
            dispatchFakeEvent(element, 'input');
        }
        dispatchKeyboardEvent(element, 'keyup', key.keyCode, key.key, element, modifiers);
    }
}
/**
 * Clears the text in an input or textarea element.
 * \@docs-private
 * @param {?} element
 * @return {?}
 */
function clearElement(element) {
    triggerFocus((/** @type {?} */ (element)));
    element.value = '';
    dispatchFakeEvent(element, 'input');
}

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

export { dispatchEvent, dispatchFakeEvent, dispatchKeyboardEvent, dispatchMouseEvent, dispatchTouchEvent, createMouseEvent, createTouchEvent, createKeyboardEvent, createFakeEvent, isTextInput, typeInElement, clearElement, patchElementFocus, triggerFocus, triggerBlur };
//# sourceMappingURL=testing.js.map
