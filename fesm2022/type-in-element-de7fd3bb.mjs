import { g as getNoKeysSpecifiedError } from './test-element-errors-83375db9.mjs';
import { aV as PERIOD } from './keycodes-0e4398c6.mjs';

/** Used to generate unique IDs for events. */
let uniqueIds = 0;
/**
 * Creates a browser MouseEvent with the specified options.
 * @docs-private
 */
function createMouseEvent(type, clientX = 0, clientY = 0, offsetX = 0, offsetY = 0, button = 0, modifiers = {}) {
    // Note: We cannot determine the position of the mouse event based on the screen
    // because the dimensions and position of the browser window are not available
    // To provide reasonable `screenX` and `screenY` coordinates, we simply use the
    // client coordinates as if the browser is opened in fullscreen.
    const screenX = clientX;
    const screenY = clientY;
    const event = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true, // Required for shadow DOM events.
        view: window,
        detail: 1,
        relatedTarget: null,
        screenX,
        screenY,
        clientX,
        clientY,
        ctrlKey: modifiers.control,
        altKey: modifiers.alt,
        shiftKey: modifiers.shift,
        metaKey: modifiers.meta,
        button: button,
        buttons: 1,
    });
    // The `MouseEvent` constructor doesn't allow us to pass these properties into the constructor.
    // Override them to `1`, because they're used for fake screen reader event detection.
    if (offsetX != null) {
        defineReadonlyEventProperty(event, 'offsetX', offsetX);
    }
    if (offsetY != null) {
        defineReadonlyEventProperty(event, 'offsetY', offsetY);
    }
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
function createPointerEvent(type, clientX = 0, clientY = 0, offsetX, offsetY, options = { isPrimary: true }) {
    const event = new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true, // Required for shadow DOM events.
        view: window,
        clientX,
        clientY,
        ...options,
    });
    if (offsetX != null) {
        defineReadonlyEventProperty(event, 'offsetX', offsetX);
    }
    if (offsetY != null) {
        defineReadonlyEventProperty(event, 'offsetY', offsetY);
    }
    return event;
}
/**
 * Creates a browser TouchEvent with the specified pointer coordinates.
 * @docs-private
 */
function createTouchEvent(type, pageX = 0, pageY = 0, clientX = 0, clientY = 0) {
    // We cannot use the `TouchEvent` or `Touch` because Firefox and Safari lack support.
    // TODO: Switch to the constructor API when it is available for Firefox and Safari.
    const event = document.createEvent('UIEvent');
    const touchDetails = { pageX, pageY, clientX, clientY, identifier: uniqueIds++ };
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
 * Creates a keyboard event with the specified key and modifiers.
 * @docs-private
 */
function createKeyboardEvent(type, keyCode = 0, key = '', modifiers = {}, code = '') {
    return new KeyboardEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true, // Required for shadow DOM events.
        view: window,
        keyCode,
        key,
        shiftKey: modifiers.shift,
        metaKey: modifiers.meta,
        altKey: modifiers.alt,
        ctrlKey: modifiers.control,
        code,
    });
}
/**
 * Creates a fake event object with any desired event type.
 * @docs-private
 */
function createFakeEvent(type, bubbles = false, cancelable = true, composed = true) {
    return new Event(type, { bubbles, cancelable, composed });
}
/**
 * Defines a readonly property on the given event object. Readonly properties on an event object
 * are always set as configurable as that matches default readonly properties for DOM event objects.
 */
function defineReadonlyEventProperty(event, propertyName, value) {
    Object.defineProperty(event, propertyName, { get: () => value, configurable: true });
}

/**
 * Utility to dispatch any event on a Node.
 * @docs-private
 */
function dispatchEvent(node, event) {
    node.dispatchEvent(event);
    return event;
}
/**
 * Shorthand to dispatch a fake event on a specified node.
 * @docs-private
 */
function dispatchFakeEvent(node, type, bubbles) {
    return dispatchEvent(node, createFakeEvent(type, bubbles));
}
/**
 * Shorthand to dispatch a keyboard event with a specified key code and
 * optional modifiers.
 * @docs-private
 */
function dispatchKeyboardEvent(node, type, keyCode, key, modifiers, code) {
    return dispatchEvent(node, createKeyboardEvent(type, keyCode, key, modifiers, code));
}
/**
 * Shorthand to dispatch a mouse event on the specified coordinates.
 * @docs-private
 */
function dispatchMouseEvent(node, type, clientX = 0, clientY = 0, offsetX, offsetY, button, modifiers) {
    return dispatchEvent(node, createMouseEvent(type, clientX, clientY, offsetX, offsetY, button, modifiers));
}
/**
 * Shorthand to dispatch a pointer event on the specified coordinates.
 * @docs-private
 */
function dispatchPointerEvent(node, type, clientX = 0, clientY = 0, offsetX, offsetY, options) {
    return dispatchEvent(node, createPointerEvent(type, clientX, clientY, offsetX, offsetY, options));
}
/**
 * Shorthand to dispatch a touch event on the specified coordinates.
 * @docs-private
 */
function dispatchTouchEvent(node, type, pageX = 0, pageY = 0, clientX = 0, clientY = 0) {
    return dispatchEvent(node, createTouchEvent(type, pageX, pageY, clientX, clientY));
}

function triggerFocusChange(element, event) {
    let eventFired = false;
    const handler = () => (eventFired = true);
    element.addEventListener(event, handler);
    element[event]();
    element.removeEventListener(event, handler);
    if (!eventFired) {
        dispatchFakeEvent(element, event);
    }
}
/**
 * Patches an elements focus and blur methods to emit events consistently and predictably.
 * This is necessary, because some browsers can call the focus handlers asynchronously,
 * while others won't fire them at all if the browser window is not focused.
 * @docs-private
 */
// TODO: Check if this element focus patching is still needed for local testing,
// where browser is not necessarily focused.
function patchElementFocus(element) {
    element.focus = () => dispatchFakeEvent(element, 'focus');
    element.blur = () => dispatchFakeEvent(element, 'blur');
}
/** @docs-private */
function triggerFocus(element) {
    triggerFocusChange(element, 'focus');
}
/** @docs-private */
function triggerBlur(element) {
    triggerFocusChange(element, 'blur');
}

/** Input types for which the value can be entered incrementally. */
const incrementalInputTypes = new Set([
    'text',
    'email',
    'hidden',
    'password',
    'search',
    'tel',
    'url',
]);
/**
 * Manual mapping of some common characters to their `code` in a keyboard event. Non-exhaustive, see
 * the tables on MDN for more info: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
 */
const charsToCodes = {
    ' ': 'Space',
    '.': 'Period',
    ',': 'Comma',
    '`': 'Backquote',
    '-': 'Minus',
    '=': 'Equal',
    '[': 'BracketLeft',
    ']': 'BracketRight',
    '\\': 'Backslash',
    '/': 'Slash',
    "'": 'Quote',
    '"': 'Quote',
    ';': 'Semicolon',
};
/**
 * Determines the `KeyboardEvent.key` from a character. See #27034 and
 * https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
 */
function getKeyboardEventCode(char) {
    if (char.length !== 1) {
        return '';
    }
    const charCode = char.charCodeAt(0);
    // Key is a letter between a and z, uppercase or lowercase.
    if ((charCode >= 97 && charCode <= 122) || (charCode >= 65 && charCode <= 90)) {
        return `Key${char.toUpperCase()}`;
    }
    // Digits from 0 to 9.
    if (48 <= charCode && charCode <= 57) {
        return `Digit${char}`;
    }
    return charsToCodes[char] ?? '';
}
/**
 * Checks whether the given Element is a text input element.
 * @docs-private
 */
function isTextInput(element) {
    const nodeName = element.nodeName.toLowerCase();
    return nodeName === 'input' || nodeName === 'textarea';
}
function typeInElement(element, ...modifiersAndKeys) {
    const first = modifiersAndKeys[0];
    let modifiers;
    let rest;
    if (first !== undefined &&
        typeof first !== 'string' &&
        first.keyCode === undefined &&
        first.key === undefined) {
        modifiers = first;
        rest = modifiersAndKeys.slice(1);
    }
    else {
        modifiers = {};
        rest = modifiersAndKeys;
    }
    const isInput = isTextInput(element);
    const inputType = element.getAttribute('type') || 'text';
    const keys = rest
        .map(k => typeof k === 'string'
        ? k.split('').map(c => ({
            keyCode: c.toUpperCase().charCodeAt(0),
            key: c,
            code: getKeyboardEventCode(c),
        }))
        : [k])
        .reduce((arr, k) => arr.concat(k), []);
    // Throw an error if no keys have been specified. Calling this function with no
    // keys should not result in a focus event being dispatched unexpectedly.
    if (keys.length === 0) {
        throw getNoKeysSpecifiedError();
    }
    // We simulate the user typing in a value by incrementally assigning the value below. The problem
    // is that for some input types, the browser won't allow for an invalid value to be set via the
    // `value` property which will always be the case when going character-by-character. If we detect
    // such an input, we have to set the value all at once or listeners to the `input` event (e.g.
    // the `ReactiveFormsModule` uses such an approach) won't receive the correct value.
    const enterValueIncrementally = inputType === 'number'
        ? // The value can be set character by character in number inputs if it doesn't have any decimals.
            keys.every(key => key.key !== '.' && key.key !== '-' && key.keyCode !== PERIOD)
        : incrementalInputTypes.has(inputType);
    triggerFocus(element);
    // When we aren't entering the value incrementally, assign it all at once ahead
    // of time so that any listeners to the key events below will have access to it.
    if (!enterValueIncrementally) {
        element.value = keys.reduce((value, key) => value + (key.key || ''), '');
    }
    for (const key of keys) {
        dispatchKeyboardEvent(element, 'keydown', key.keyCode, key.key, modifiers, key.code);
        dispatchKeyboardEvent(element, 'keypress', key.keyCode, key.key, modifiers, key.code);
        if (isInput && key.key && key.key.length === 1) {
            if (enterValueIncrementally) {
                element.value += key.key;
                dispatchFakeEvent(element, 'input');
            }
        }
        dispatchKeyboardEvent(element, 'keyup', key.keyCode, key.key, modifiers, key.code);
    }
    // Since we weren't dispatching `input` events while sending the keys, we have to do it now.
    if (!enterValueIncrementally) {
        dispatchFakeEvent(element, 'input');
    }
}
/**
 * Clears the text in an input or textarea element.
 * @docs-private
 */
function clearElement(element) {
    triggerFocus(element);
    element.value = '';
    dispatchFakeEvent(element, 'input');
}

export { dispatchFakeEvent as a, dispatchKeyboardEvent as b, dispatchMouseEvent as c, dispatchEvent as d, dispatchPointerEvent as e, dispatchTouchEvent as f, createMouseEvent as g, createPointerEvent as h, createTouchEvent as i, createKeyboardEvent as j, createFakeEvent as k, triggerBlur as l, isTextInput as m, typeInElement as n, clearElement as o, patchElementFocus as p, triggerFocus as t };
//# sourceMappingURL=type-in-element-de7fd3bb.mjs.map
