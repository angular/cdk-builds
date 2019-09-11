/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __awaiter } from 'tslib';

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Base class for component harnesses that all component harness authors should extend. This base
 * component harness provides the basic ability to locate element and sub-component harness. It
 * should be inherited when defining user's own harness.
 * @abstract
 */
class ComponentHarness {
    /**
     * @param {?} locatorFactory
     */
    constructor(locatorFactory) {
        this.locatorFactory = locatorFactory;
    }
    /**
     * Gets a `Promise` for the `TestElement` representing the host element of the component.
     * @return {?}
     */
    host() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.locatorFactory.rootElement;
        });
    }
    /**
     * Gets a `LocatorFactory` for the document root element. This factory can be used to create
     * locators for elements that a component creates outside of its own root element. (e.g. by
     * appending to document.body).
     * @protected
     * @return {?}
     */
    documentRootLocatorFactory() {
        return this.locatorFactory.documentRootLocatorFactory();
    }
    /**
     * @protected
     * @param {?} arg
     * @return {?}
     */
    locatorFor(arg) {
        return this.locatorFactory.locatorFor(arg);
    }
    /**
     * @protected
     * @param {?} arg
     * @return {?}
     */
    locatorForOptional(arg) {
        return this.locatorFactory.locatorForOptional(arg);
    }
    /**
     * @protected
     * @param {?} arg
     * @return {?}
     */
    locatorForAll(arg) {
        return this.locatorFactory.locatorForAll(arg);
    }
}
/**
 * A class used to associate a ComponentHarness class with predicates functions that can be used to
 * filter instances of the class.
 * @template T
 */
class HarnessPredicate {
    /**
     * @param {?} harnessType
     * @param {?} options
     */
    constructor(harnessType, options) {
        this.harnessType = harnessType;
        this._predicates = [];
        this._descriptions = [];
        this._addBaseOptions(options);
    }
    /**
     * Checks if a string matches the given pattern.
     * @param {?} s The string to check, or a Promise for the string to check.
     * @param {?} pattern The pattern the string is expected to match. If `pattern` is a string, `s` is
     *   expected to match exactly. If `pattern` is a regex, a partial match is allowed.
     * @return {?} A Promise that resolves to whether the string matches the pattern.
     */
    static stringMatches(s, pattern) {
        return __awaiter(this, void 0, void 0, function* () {
            s = yield s;
            return typeof pattern === 'string' ? s === pattern : pattern.test(s);
        });
    }
    /**
     * Adds a predicate function to be run against candidate harnesses.
     * @template THIS
     * @this {THIS}
     * @param {?} description A description of this predicate that may be used in error messages.
     * @param {?} predicate An async predicate function.
     * @return {THIS}
     */
    add(description, predicate) {
        (/** @type {?} */ (this))._descriptions.push(description);
        (/** @type {?} */ (this))._predicates.push(predicate);
        return (/** @type {?} */ (this));
    }
    /**
     * Adds a predicate function that depends on an option value to be run against candidate
     * harnesses. If the option value is undefined, the predicate will be ignored.
     * @template THIS,O
     * @this {THIS}
     * @param {?} name The name of the option (may be used in error messages).
     * @param {?} option The option value.
     * @param {?} predicate The predicate function to run if the option value is not undefined.
     * @return {THIS}
     */
    addOption(name, option, predicate) {
        // Add quotes around strings to differentiate them from other values
        /** @type {?} */
        const value = typeof option === 'string' ? `"${option}"` : `${option}`;
        if (option !== undefined) {
            (/** @type {?} */ (this)).add(`${name} = ${value}`, (/**
             * @param {?} item
             * @return {?}
             */
            item => predicate(item, option)));
        }
        return (/** @type {?} */ (this));
    }
    /**
     * Filters a list of harnesses on this predicate.
     * @param {?} harnesses The list of harnesses to filter.
     * @return {?} A list of harnesses that satisfy this predicate.
     */
    filter(harnesses) {
        return __awaiter(this, void 0, void 0, function* () {
            /** @type {?} */
            const results = yield Promise.all(harnesses.map((/**
             * @param {?} h
             * @return {?}
             */
            h => this.evaluate(h))));
            return harnesses.filter((/**
             * @param {?} _
             * @param {?} i
             * @return {?}
             */
            (_, i) => results[i]));
        });
    }
    /**
     * Evaluates whether the given harness satisfies this predicate.
     * @param {?} harness The harness to check
     * @return {?} A promise that resolves to true if the harness satisfies this predicate,
     *   and resolves to false otherwise.
     */
    evaluate(harness) {
        return __awaiter(this, void 0, void 0, function* () {
            /** @type {?} */
            const results = yield Promise.all(this._predicates.map((/**
             * @param {?} p
             * @return {?}
             */
            p => p(harness))));
            return results.reduce((/**
             * @param {?} combined
             * @param {?} current
             * @return {?}
             */
            (combined, current) => combined && current), true);
        });
    }
    /**
     * Gets a description of this predicate for use in error messages.
     * @return {?}
     */
    getDescription() {
        return this._descriptions.join(', ');
    }
    /**
     * Gets the selector used to find candidate elements.
     * @return {?}
     */
    getSelector() {
        return this._ancestor.split(',')
            .map((/**
         * @param {?} part
         * @return {?}
         */
        part => `${part.trim()} ${this.harnessType.hostSelector}`.trim()))
            .join(',');
    }
    /**
     * Adds base options common to all harness types.
     * @private
     * @param {?} options
     * @return {?}
     */
    _addBaseOptions(options) {
        this._ancestor = options.ancestor || '';
        if (this._ancestor) {
            this._descriptions.push(`has ancestor matching selector "${this._ancestor}"`);
        }
        /** @type {?} */
        const selector = options.selector;
        if (selector !== undefined) {
            this.add(`host matches selector "${selector}"`, (/**
             * @param {?} item
             * @return {?}
             */
            (item) => __awaiter(this, void 0, void 0, function* () {
                return (yield item.host()).matchesSelector(selector);
            })));
        }
    }
}

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
 * Base harness environment class that can be extended to allow `ComponentHarness`es to be used in
 * different test environments (e.g. testbed, protractor, etc.). This class implements the
 * functionality of both a `HarnessLoader` and `LocatorFactory`. This class is generic on the raw
 * element type, `E`, used by the particular test environment.
 * @abstract
 * @template E
 */
class HarnessEnvironment {
    /**
     * @protected
     * @param {?} rawRootElement
     */
    constructor(rawRootElement) {
        this.rawRootElement = rawRootElement;
        this.rootElement = this.createTestElement(rawRootElement);
    }
    // Implemented as part of the `LocatorFactory` interface.
    /**
     * @return {?}
     */
    documentRootLocatorFactory() {
        return this.createEnvironment(this.getDocumentRoot());
    }
    /**
     * @template T
     * @param {?} arg
     * @return {?}
     */
    locatorFor(arg) {
        return (/**
         * @return {?}
         */
        () => __awaiter(this, void 0, void 0, function* () {
            if (typeof arg === 'string') {
                return this.createTestElement(yield this._assertElementFound(arg));
            }
            else {
                return this._assertHarnessFound(arg);
            }
        }));
    }
    /**
     * @template T
     * @param {?} arg
     * @return {?}
     */
    locatorForOptional(arg) {
        return (/**
         * @return {?}
         */
        () => __awaiter(this, void 0, void 0, function* () {
            if (typeof arg === 'string') {
                /** @type {?} */
                const element = (yield this.getAllRawElements(arg))[0];
                return element ? this.createTestElement(element) : null;
            }
            else {
                /** @type {?} */
                const candidates = yield this._getAllHarnesses(arg);
                return candidates[0] || null;
            }
        }));
    }
    /**
     * @template T
     * @param {?} arg
     * @return {?}
     */
    locatorForAll(arg) {
        return (/**
         * @return {?}
         */
        () => __awaiter(this, void 0, void 0, function* () {
            if (typeof arg === 'string') {
                return (yield this.getAllRawElements(arg)).map((/**
                 * @param {?} e
                 * @return {?}
                 */
                e => this.createTestElement(e)));
            }
            else {
                return this._getAllHarnesses(arg);
            }
        }));
    }
    // Implemented as part of the `HarnessLoader` interface.
    /**
     * @template T
     * @param {?} harnessType
     * @return {?}
     */
    getHarness(harnessType) {
        return this.locatorFor(harnessType)();
    }
    // Implemented as part of the `HarnessLoader` interface.
    /**
     * @template T
     * @param {?} harnessType
     * @return {?}
     */
    getAllHarnesses(harnessType) {
        return this.locatorForAll(harnessType)();
    }
    // Implemented as part of the `HarnessLoader` interface.
    /**
     * @param {?} selector
     * @return {?}
     */
    getChildLoader(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.createEnvironment(yield this._assertElementFound(selector));
        });
    }
    // Implemented as part of the `HarnessLoader` interface.
    /**
     * @param {?} selector
     * @return {?}
     */
    getAllChildLoaders(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getAllRawElements(selector)).map((/**
             * @param {?} e
             * @return {?}
             */
            e => this.createEnvironment(e)));
        });
    }
    /**
     * Creates a `ComponentHarness` for the given harness type with the given raw host element.
     * @protected
     * @template T
     * @param {?} harnessType
     * @param {?} element
     * @return {?}
     */
    createComponentHarness(harnessType, element) {
        return new harnessType(this.createEnvironment(element));
    }
    /**
     * @private
     * @template T
     * @param {?} harnessType
     * @return {?}
     */
    _getAllHarnesses(harnessType) {
        return __awaiter(this, void 0, void 0, function* () {
            /** @type {?} */
            const harnessPredicate = harnessType instanceof HarnessPredicate ?
                harnessType : new HarnessPredicate(harnessType, {});
            /** @type {?} */
            const elements = yield this.getAllRawElements(harnessPredicate.getSelector());
            return harnessPredicate.filter(elements.map((/**
             * @param {?} element
             * @return {?}
             */
            element => this.createComponentHarness(harnessPredicate.harnessType, element))));
        });
    }
    /**
     * @private
     * @param {?} selector
     * @return {?}
     */
    _assertElementFound(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            /** @type {?} */
            const element = (yield this.getAllRawElements(selector))[0];
            if (!element) {
                throw Error(`Expected to find element matching selector: "${selector}", but none was found`);
            }
            return element;
        });
    }
    /**
     * @private
     * @template T
     * @param {?} harnessType
     * @return {?}
     */
    _assertHarnessFound(harnessType) {
        return __awaiter(this, void 0, void 0, function* () {
            /** @type {?} */
            const harness = (yield this._getAllHarnesses(harnessType))[0];
            if (!harness) {
                throw _getErrorForMissingHarness(harnessType);
            }
            return harness;
        });
    }
}
/**
 * @template T
 * @param {?} harnessType
 * @return {?}
 */
function _getErrorForMissingHarness(harnessType) {
    /** @type {?} */
    const harnessPredicate = harnessType instanceof HarnessPredicate ? harnessType : new HarnessPredicate(harnessType, {});
    const { name, hostSelector } = harnessPredicate.harnessType;
    /** @type {?} */
    let restrictions = harnessPredicate.getDescription();
    /** @type {?} */
    let message = `Expected to find element for ${name} matching selector: "${hostSelector}"`;
    if (restrictions) {
        message += ` (with restrictions: ${restrictions})`;
    }
    message += ', but none was found';
    return Error(message);
}

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

/** @enum {number} */
const TestKey = {
    BACKSPACE: 0,
    TAB: 1,
    ENTER: 2,
    SHIFT: 3,
    CONTROL: 4,
    ALT: 5,
    ESCAPE: 6,
    PAGE_UP: 7,
    PAGE_DOWN: 8,
    END: 9,
    HOME: 10,
    LEFT_ARROW: 11,
    UP_ARROW: 12,
    RIGHT_ARROW: 13,
    DOWN_ARROW: 14,
    INSERT: 15,
    DELETE: 16,
    F1: 17,
    F2: 18,
    F3: 19,
    F4: 20,
    F5: 21,
    F6: 22,
    F7: 23,
    F8: 24,
    F9: 25,
    F10: 26,
    F11: 27,
    F12: 28,
    META: 29,
};
TestKey[TestKey.BACKSPACE] = 'BACKSPACE';
TestKey[TestKey.TAB] = 'TAB';
TestKey[TestKey.ENTER] = 'ENTER';
TestKey[TestKey.SHIFT] = 'SHIFT';
TestKey[TestKey.CONTROL] = 'CONTROL';
TestKey[TestKey.ALT] = 'ALT';
TestKey[TestKey.ESCAPE] = 'ESCAPE';
TestKey[TestKey.PAGE_UP] = 'PAGE_UP';
TestKey[TestKey.PAGE_DOWN] = 'PAGE_DOWN';
TestKey[TestKey.END] = 'END';
TestKey[TestKey.HOME] = 'HOME';
TestKey[TestKey.LEFT_ARROW] = 'LEFT_ARROW';
TestKey[TestKey.UP_ARROW] = 'UP_ARROW';
TestKey[TestKey.RIGHT_ARROW] = 'RIGHT_ARROW';
TestKey[TestKey.DOWN_ARROW] = 'DOWN_ARROW';
TestKey[TestKey.INSERT] = 'INSERT';
TestKey[TestKey.DELETE] = 'DELETE';
TestKey[TestKey.F1] = 'F1';
TestKey[TestKey.F2] = 'F2';
TestKey[TestKey.F3] = 'F3';
TestKey[TestKey.F4] = 'F4';
TestKey[TestKey.F5] = 'F5';
TestKey[TestKey.F6] = 'F6';
TestKey[TestKey.F7] = 'F7';
TestKey[TestKey.F8] = 'F8';
TestKey[TestKey.F9] = 'F9';
TestKey[TestKey.F10] = 'F10';
TestKey[TestKey.F11] = 'F11';
TestKey[TestKey.F12] = 'F12';
TestKey[TestKey.META] = 'META';

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

export { ComponentHarness, HarnessPredicate, dispatchEvent, dispatchFakeEvent, dispatchKeyboardEvent, dispatchMouseEvent, dispatchTouchEvent, patchElementFocus, triggerFocus, triggerBlur, createMouseEvent, createTouchEvent, createKeyboardEvent, createFakeEvent, HarnessEnvironment, TestKey, isTextInput, typeInElement, clearElement };
//# sourceMappingURL=testing.js.map
