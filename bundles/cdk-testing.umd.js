/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define('@angular/cdk/testing', ['exports'], factory) :
	(factory((global.ng = global.ng || {}, global.ng.cdk = global.ng.cdk || {}, global.ng.cdk.testing = {})));
}(this, (function (exports) { 'use strict';

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
function createMouseEvent(type, x, y, button) {
    if (x === void 0) { x = 0; }
    if (y === void 0) { y = 0; }
    if (button === void 0) { button = 0; }
    /** @type {?} */
    var event = document.createEvent('MouseEvent');
    /** @type {?} */
    var originalPreventDefault = event.preventDefault;
    event.initMouseEvent(type, true, /* canBubble */ true, /* cancelable */ window, /* view */ 0, /* detail */ x, /* screenX */ y, /* screenY */ x, /* clientX */ y, /* clientY */ false, /* ctrlKey */ false, /* altKey */ false, /* shiftKey */ false, /* metaKey */ button, /* button */ null /* relatedTarget */);
    // `initMouseEvent` doesn't allow us to pass the `buttons` and
    // defaults it to 0 which looks like a fake event.
    Object.defineProperty(event, 'buttons', { get: (/**
         * @return {?}
         */
        function () { return 1; }) });
    // IE won't set `defaultPrevented` on synthetic events so we need to do it manually.
    event.preventDefault = (/**
     * @return {?}
     */
    function () {
        Object.defineProperty(event, 'defaultPrevented', { get: (/**
             * @return {?}
             */
            function () { return true; }) });
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
function createTouchEvent(type, pageX, pageY) {
    if (pageX === void 0) { pageX = 0; }
    if (pageY === void 0) { pageY = 0; }
    // In favor of creating events that work for most of the browsers, the event is created
    // as a basic UI Event. The necessary details for the event will be set manually.
    /** @type {?} */
    var event = document.createEvent('UIEvent');
    /** @type {?} */
    var touchDetails = { pageX: pageX, pageY: pageY };
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
function createKeyboardEvent(type, keyCode, key, target, modifiers) {
    if (keyCode === void 0) { keyCode = 0; }
    if (key === void 0) { key = ''; }
    if (modifiers === void 0) { modifiers = {}; }
    /** @type {?} */
    var event = (/** @type {?} */ (document.createEvent('KeyboardEvent')));
    /** @type {?} */
    var originalPreventDefault = event.preventDefault;
    // Firefox does not support `initKeyboardEvent`, but supports `initKeyEvent`.
    if (event.initKeyEvent) {
        event.initKeyEvent(type, true, true, window, modifiers.control, modifiers.alt, modifiers.shift, modifiers.meta, keyCode);
    }
    else {
        // `initKeyboardEvent` expects to receive modifiers as a whitespace-delimited string
        // See https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/initKeyboardEvent
        /** @type {?} */
        var modifiersStr = (modifiers.control ? 'Control ' : '' + modifiers.alt ? 'Alt ' : '' +
            modifiers.shift ? 'Shift ' : '' + modifiers.meta ? 'Meta' : '').trim();
        event.initKeyboardEvent(type, true, /* canBubble */ true, /* cancelable */ window, /* view */ 0, /* char */ key, /* key */ 0, /* location */ modifiersStr, /* modifiersList */ false /* repeat */);
    }
    // Webkit Browsers don't set the keyCode when calling the init function.
    // See related bug https://bugs.webkit.org/show_bug.cgi?id=16735
    Object.defineProperties(event, {
        keyCode: { get: (/**
             * @return {?}
             */
            function () { return keyCode; }) },
        key: { get: (/**
             * @return {?}
             */
            function () { return key; }) },
        target: { get: (/**
             * @return {?}
             */
            function () { return target; }) },
        ctrlKey: { get: (/**
             * @return {?}
             */
            function () { return !!modifiers.control; }) },
        altKey: { get: (/**
             * @return {?}
             */
            function () { return !!modifiers.alt; }) },
        shiftKey: { get: (/**
             * @return {?}
             */
            function () { return !!modifiers.shift; }) },
        metaKey: { get: (/**
             * @return {?}
             */
            function () { return !!modifiers.meta; }) }
    });
    // IE won't set `defaultPrevented` on synthetic events so we need to do it manually.
    event.preventDefault = (/**
     * @return {?}
     */
    function () {
        Object.defineProperty(event, 'defaultPrevented', { get: (/**
             * @return {?}
             */
            function () { return true; }) });
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
function createFakeEvent(type, canBubble, cancelable) {
    if (canBubble === void 0) { canBubble = false; }
    if (cancelable === void 0) { cancelable = true; }
    /** @type {?} */
    var event = document.createEvent('Event');
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
function dispatchMouseEvent(node, type, x, y, event) {
    if (x === void 0) { x = 0; }
    if (y === void 0) { y = 0; }
    if (event === void 0) { event = createMouseEvent(type, x, y); }
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
function dispatchTouchEvent(node, type, x, y) {
    if (x === void 0) { x = 0; }
    if (y === void 0) { y = 0; }
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
    var eventFired = false;
    /** @type {?} */
    var handler = (/**
     * @return {?}
     */
    function () { return eventFired = true; });
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
    function () { return dispatchFakeEvent(element, 'focus'); });
    element.blur = (/**
     * @return {?}
     */
    function () { return dispatchFakeEvent(element, 'blur'); });
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
function typeInElement(element) {
    var modifiersAndKeys = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        modifiersAndKeys[_i - 1] = arguments[_i];
    }
    /** @type {?} */
    var first = modifiersAndKeys[0];
    /** @type {?} */
    var modifiers;
    /** @type {?} */
    var rest;
    if (typeof first !== 'string' && first.keyCode === undefined && first.key === undefined) {
        modifiers = first;
        rest = modifiersAndKeys.slice(1);
    }
    else {
        modifiers = {};
        rest = modifiersAndKeys;
    }
    /** @type {?} */
    var keys = rest
        .map((/**
     * @param {?} k
     * @return {?}
     */
    function (k) { return typeof k === 'string' ?
        k.split('').map((/**
         * @param {?} c
         * @return {?}
         */
        function (c) { return ({ keyCode: c.toUpperCase().charCodeAt(0), key: c }); })) : [k]; }))
        .reduce((/**
     * @param {?} arr
     * @param {?} k
     * @return {?}
     */
    function (arr, k) { return arr.concat(k); }), []);
    triggerFocus(element);
    for (var _a = 0, keys_1 = keys; _a < keys_1.length; _a++) {
        var key = keys_1[_a];
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

exports.dispatchEvent = dispatchEvent;
exports.dispatchFakeEvent = dispatchFakeEvent;
exports.dispatchKeyboardEvent = dispatchKeyboardEvent;
exports.dispatchMouseEvent = dispatchMouseEvent;
exports.dispatchTouchEvent = dispatchTouchEvent;
exports.createMouseEvent = createMouseEvent;
exports.createTouchEvent = createTouchEvent;
exports.createKeyboardEvent = createKeyboardEvent;
exports.createFakeEvent = createFakeEvent;
exports.isTextInput = isTextInput;
exports.typeInElement = typeInElement;
exports.clearElement = clearElement;
exports.patchElementFocus = patchElementFocus;
exports.triggerFocus = triggerFocus;
exports.triggerBlur = triggerBlur;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=cdk-testing.umd.js.map
