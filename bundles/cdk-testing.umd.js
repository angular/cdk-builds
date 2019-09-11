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

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

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
var   /**
 * Base class for component harnesses that all component harness authors should extend. This base
 * component harness provides the basic ability to locate element and sub-component harness. It
 * should be inherited when defining user's own harness.
 * @abstract
 */
ComponentHarness = /** @class */ (function () {
    function ComponentHarness(locatorFactory) {
        this.locatorFactory = locatorFactory;
    }
    /** Gets a `Promise` for the `TestElement` representing the host element of the component. */
    /**
     * Gets a `Promise` for the `TestElement` representing the host element of the component.
     * @return {?}
     */
    ComponentHarness.prototype.host = /**
     * Gets a `Promise` for the `TestElement` representing the host element of the component.
     * @return {?}
     */
    function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.locatorFactory.rootElement];
            });
        });
    };
    /**
     * Gets a `LocatorFactory` for the document root element. This factory can be used to create
     * locators for elements that a component creates outside of its own root element. (e.g. by
     * appending to document.body).
     */
    /**
     * Gets a `LocatorFactory` for the document root element. This factory can be used to create
     * locators for elements that a component creates outside of its own root element. (e.g. by
     * appending to document.body).
     * @protected
     * @return {?}
     */
    ComponentHarness.prototype.documentRootLocatorFactory = /**
     * Gets a `LocatorFactory` for the document root element. This factory can be used to create
     * locators for elements that a component creates outside of its own root element. (e.g. by
     * appending to document.body).
     * @protected
     * @return {?}
     */
    function () {
        return this.locatorFactory.documentRootLocatorFactory();
    };
    /**
     * @protected
     * @param {?} arg
     * @return {?}
     */
    ComponentHarness.prototype.locatorFor = /**
     * @protected
     * @param {?} arg
     * @return {?}
     */
    function (arg) {
        return this.locatorFactory.locatorFor(arg);
    };
    /**
     * @protected
     * @param {?} arg
     * @return {?}
     */
    ComponentHarness.prototype.locatorForOptional = /**
     * @protected
     * @param {?} arg
     * @return {?}
     */
    function (arg) {
        return this.locatorFactory.locatorForOptional(arg);
    };
    /**
     * @protected
     * @param {?} arg
     * @return {?}
     */
    ComponentHarness.prototype.locatorForAll = /**
     * @protected
     * @param {?} arg
     * @return {?}
     */
    function (arg) {
        return this.locatorFactory.locatorForAll(arg);
    };
    return ComponentHarness;
}());
/**
 * A class used to associate a ComponentHarness class with predicates functions that can be used to
 * filter instances of the class.
 * @template T
 */
var   /**
 * A class used to associate a ComponentHarness class with predicates functions that can be used to
 * filter instances of the class.
 * @template T
 */
HarnessPredicate = /** @class */ (function () {
    function HarnessPredicate(harnessType, options) {
        this.harnessType = harnessType;
        this._predicates = [];
        this._descriptions = [];
        this._addBaseOptions(options);
    }
    /**
     * Checks if a string matches the given pattern.
     * @param s The string to check, or a Promise for the string to check.
     * @param pattern The pattern the string is expected to match. If `pattern` is a string, `s` is
     *   expected to match exactly. If `pattern` is a regex, a partial match is allowed.
     * @return A Promise that resolves to whether the string matches the pattern.
     */
    /**
     * Checks if a string matches the given pattern.
     * @param {?} s The string to check, or a Promise for the string to check.
     * @param {?} pattern The pattern the string is expected to match. If `pattern` is a string, `s` is
     *   expected to match exactly. If `pattern` is a regex, a partial match is allowed.
     * @return {?} A Promise that resolves to whether the string matches the pattern.
     */
    HarnessPredicate.stringMatches = /**
     * Checks if a string matches the given pattern.
     * @param {?} s The string to check, or a Promise for the string to check.
     * @param {?} pattern The pattern the string is expected to match. If `pattern` is a string, `s` is
     *   expected to match exactly. If `pattern` is a regex, a partial match is allowed.
     * @return {?} A Promise that resolves to whether the string matches the pattern.
     */
    function (s, pattern) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, s];
                    case 1:
                        s = _a.sent();
                        return [2 /*return*/, typeof pattern === 'string' ? s === pattern : pattern.test(s)];
                }
            });
        });
    };
    /**
     * Adds a predicate function to be run against candidate harnesses.
     * @param description A description of this predicate that may be used in error messages.
     * @param predicate An async predicate function.
     * @return this (for method chaining).
     */
    /**
     * Adds a predicate function to be run against candidate harnesses.
     * @template THIS
     * @this {THIS}
     * @param {?} description A description of this predicate that may be used in error messages.
     * @param {?} predicate An async predicate function.
     * @return {THIS}
     */
    HarnessPredicate.prototype.add = /**
     * Adds a predicate function to be run against candidate harnesses.
     * @template THIS
     * @this {THIS}
     * @param {?} description A description of this predicate that may be used in error messages.
     * @param {?} predicate An async predicate function.
     * @return {THIS}
     */
    function (description, predicate) {
        (/** @type {?} */ (this))._descriptions.push(description);
        (/** @type {?} */ (this))._predicates.push(predicate);
        return (/** @type {?} */ (this));
    };
    /**
     * Adds a predicate function that depends on an option value to be run against candidate
     * harnesses. If the option value is undefined, the predicate will be ignored.
     * @param name The name of the option (may be used in error messages).
     * @param option The option value.
     * @param predicate The predicate function to run if the option value is not undefined.
     * @return this (for method chaining).
     */
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
    HarnessPredicate.prototype.addOption = /**
     * Adds a predicate function that depends on an option value to be run against candidate
     * harnesses. If the option value is undefined, the predicate will be ignored.
     * @template THIS,O
     * @this {THIS}
     * @param {?} name The name of the option (may be used in error messages).
     * @param {?} option The option value.
     * @param {?} predicate The predicate function to run if the option value is not undefined.
     * @return {THIS}
     */
    function (name, option, predicate) {
        // Add quotes around strings to differentiate them from other values
        /** @type {?} */
        var value = typeof option === 'string' ? "\"" + option + "\"" : "" + option;
        if (option !== undefined) {
            (/** @type {?} */ (this)).add(name + " = " + value, (/**
             * @param {?} item
             * @return {?}
             */
            function (item) { return predicate(item, option); }));
        }
        return (/** @type {?} */ (this));
    };
    /**
     * Filters a list of harnesses on this predicate.
     * @param harnesses The list of harnesses to filter.
     * @return A list of harnesses that satisfy this predicate.
     */
    /**
     * Filters a list of harnesses on this predicate.
     * @param {?} harnesses The list of harnesses to filter.
     * @return {?} A list of harnesses that satisfy this predicate.
     */
    HarnessPredicate.prototype.filter = /**
     * Filters a list of harnesses on this predicate.
     * @param {?} harnesses The list of harnesses to filter.
     * @return {?} A list of harnesses that satisfy this predicate.
     */
    function (harnesses) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(harnesses.map((/**
                         * @param {?} h
                         * @return {?}
                         */
                        function (h) { return _this.evaluate(h); })))];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, harnesses.filter((/**
                             * @param {?} _
                             * @param {?} i
                             * @return {?}
                             */
                            function (_, i) { return results[i]; }))];
                }
            });
        });
    };
    /**
     * Evaluates whether the given harness satisfies this predicate.
     * @param harness The harness to check
     * @return A promise that resolves to true if the harness satisfies this predicate,
     *   and resolves to false otherwise.
     */
    /**
     * Evaluates whether the given harness satisfies this predicate.
     * @param {?} harness The harness to check
     * @return {?} A promise that resolves to true if the harness satisfies this predicate,
     *   and resolves to false otherwise.
     */
    HarnessPredicate.prototype.evaluate = /**
     * Evaluates whether the given harness satisfies this predicate.
     * @param {?} harness The harness to check
     * @return {?} A promise that resolves to true if the harness satisfies this predicate,
     *   and resolves to false otherwise.
     */
    function (harness) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(this._predicates.map((/**
                         * @param {?} p
                         * @return {?}
                         */
                        function (p) { return p(harness); })))];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results.reduce((/**
                             * @param {?} combined
                             * @param {?} current
                             * @return {?}
                             */
                            function (combined, current) { return combined && current; }), true)];
                }
            });
        });
    };
    /** Gets a description of this predicate for use in error messages. */
    /**
     * Gets a description of this predicate for use in error messages.
     * @return {?}
     */
    HarnessPredicate.prototype.getDescription = /**
     * Gets a description of this predicate for use in error messages.
     * @return {?}
     */
    function () {
        return this._descriptions.join(', ');
    };
    /** Gets the selector used to find candidate elements. */
    /**
     * Gets the selector used to find candidate elements.
     * @return {?}
     */
    HarnessPredicate.prototype.getSelector = /**
     * Gets the selector used to find candidate elements.
     * @return {?}
     */
    function () {
        var _this = this;
        return this._ancestor.split(',')
            .map((/**
         * @param {?} part
         * @return {?}
         */
        function (part) { return (part.trim() + " " + _this.harnessType.hostSelector).trim(); }))
            .join(',');
    };
    /** Adds base options common to all harness types. */
    /**
     * Adds base options common to all harness types.
     * @private
     * @param {?} options
     * @return {?}
     */
    HarnessPredicate.prototype._addBaseOptions = /**
     * Adds base options common to all harness types.
     * @private
     * @param {?} options
     * @return {?}
     */
    function (options) {
        var _this = this;
        this._ancestor = options.ancestor || '';
        if (this._ancestor) {
            this._descriptions.push("has ancestor matching selector \"" + this._ancestor + "\"");
        }
        /** @type {?} */
        var selector = options.selector;
        if (selector !== undefined) {
            this.add("host matches selector \"" + selector + "\"", (/**
             * @param {?} item
             * @return {?}
             */
            function (item) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, item.host()];
                        case 1: return [2 /*return*/, (_a.sent()).matchesSelector(selector)];
                    }
                });
            }); }));
        }
    };
    return HarnessPredicate;
}());

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
 * Base harness environment class that can be extended to allow `ComponentHarness`es to be used in
 * different test environments (e.g. testbed, protractor, etc.). This class implements the
 * functionality of both a `HarnessLoader` and `LocatorFactory`. This class is generic on the raw
 * element type, `E`, used by the particular test environment.
 * @abstract
 * @template E
 */
var   /**
 * Base harness environment class that can be extended to allow `ComponentHarness`es to be used in
 * different test environments (e.g. testbed, protractor, etc.). This class implements the
 * functionality of both a `HarnessLoader` and `LocatorFactory`. This class is generic on the raw
 * element type, `E`, used by the particular test environment.
 * @abstract
 * @template E
 */
HarnessEnvironment = /** @class */ (function () {
    function HarnessEnvironment(rawRootElement) {
        this.rawRootElement = rawRootElement;
        this.rootElement = this.createTestElement(rawRootElement);
    }
    // Implemented as part of the `LocatorFactory` interface.
    // Implemented as part of the `LocatorFactory` interface.
    /**
     * @return {?}
     */
    HarnessEnvironment.prototype.documentRootLocatorFactory = 
    // Implemented as part of the `LocatorFactory` interface.
    /**
     * @return {?}
     */
    function () {
        return this.createEnvironment(this.getDocumentRoot());
    };
    /**
     * @template T
     * @param {?} arg
     * @return {?}
     */
    HarnessEnvironment.prototype.locatorFor = /**
     * @template T
     * @param {?} arg
     * @return {?}
     */
    function (arg) {
        var _this = this;
        return (/**
         * @return {?}
         */
        function () { return __awaiter(_this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(typeof arg === 'string')) return [3 /*break*/, 2];
                        _a = this.createTestElement;
                        return [4 /*yield*/, this._assertElementFound(arg)];
                    case 1: return [2 /*return*/, _a.apply(this, [_b.sent()])];
                    case 2: return [2 /*return*/, this._assertHarnessFound(arg)];
                }
            });
        }); });
    };
    /**
     * @template T
     * @param {?} arg
     * @return {?}
     */
    HarnessEnvironment.prototype.locatorForOptional = /**
     * @template T
     * @param {?} arg
     * @return {?}
     */
    function (arg) {
        var _this = this;
        return (/**
         * @return {?}
         */
        function () { return __awaiter(_this, void 0, void 0, function () {
            var element, candidates;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(typeof arg === 'string')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getAllRawElements(arg)];
                    case 1:
                        element = (_a.sent())[0];
                        return [2 /*return*/, element ? this.createTestElement(element) : null];
                    case 2: return [4 /*yield*/, this._getAllHarnesses(arg)];
                    case 3:
                        candidates = _a.sent();
                        return [2 /*return*/, candidates[0] || null];
                }
            });
        }); });
    };
    /**
     * @template T
     * @param {?} arg
     * @return {?}
     */
    HarnessEnvironment.prototype.locatorForAll = /**
     * @template T
     * @param {?} arg
     * @return {?}
     */
    function (arg) {
        var _this = this;
        return (/**
         * @return {?}
         */
        function () { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(typeof arg === 'string')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getAllRawElements(arg)];
                    case 1: return [2 /*return*/, (_a.sent()).map((/**
                         * @param {?} e
                         * @return {?}
                         */
                        function (e) { return _this.createTestElement(e); }))];
                    case 2: return [2 /*return*/, this._getAllHarnesses(arg)];
                }
            });
        }); });
    };
    // Implemented as part of the `HarnessLoader` interface.
    // Implemented as part of the `HarnessLoader` interface.
    /**
     * @template T
     * @param {?} harnessType
     * @return {?}
     */
    HarnessEnvironment.prototype.getHarness = 
    // Implemented as part of the `HarnessLoader` interface.
    /**
     * @template T
     * @param {?} harnessType
     * @return {?}
     */
    function (harnessType) {
        return this.locatorFor(harnessType)();
    };
    // Implemented as part of the `HarnessLoader` interface.
    // Implemented as part of the `HarnessLoader` interface.
    /**
     * @template T
     * @param {?} harnessType
     * @return {?}
     */
    HarnessEnvironment.prototype.getAllHarnesses = 
    // Implemented as part of the `HarnessLoader` interface.
    /**
     * @template T
     * @param {?} harnessType
     * @return {?}
     */
    function (harnessType) {
        return this.locatorForAll(harnessType)();
    };
    // Implemented as part of the `HarnessLoader` interface.
    // Implemented as part of the `HarnessLoader` interface.
    /**
     * @param {?} selector
     * @return {?}
     */
    HarnessEnvironment.prototype.getChildLoader = 
    // Implemented as part of the `HarnessLoader` interface.
    /**
     * @param {?} selector
     * @return {?}
     */
    function (selector) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.createEnvironment;
                        return [4 /*yield*/, this._assertElementFound(selector)];
                    case 1: return [2 /*return*/, _a.apply(this, [_b.sent()])];
                }
            });
        });
    };
    // Implemented as part of the `HarnessLoader` interface.
    // Implemented as part of the `HarnessLoader` interface.
    /**
     * @param {?} selector
     * @return {?}
     */
    HarnessEnvironment.prototype.getAllChildLoaders = 
    // Implemented as part of the `HarnessLoader` interface.
    /**
     * @param {?} selector
     * @return {?}
     */
    function (selector) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getAllRawElements(selector)];
                    case 1: return [2 /*return*/, (_a.sent()).map((/**
                         * @param {?} e
                         * @return {?}
                         */
                        function (e) { return _this.createEnvironment(e); }))];
                }
            });
        });
    };
    /** Creates a `ComponentHarness` for the given harness type with the given raw host element. */
    /**
     * Creates a `ComponentHarness` for the given harness type with the given raw host element.
     * @protected
     * @template T
     * @param {?} harnessType
     * @param {?} element
     * @return {?}
     */
    HarnessEnvironment.prototype.createComponentHarness = /**
     * Creates a `ComponentHarness` for the given harness type with the given raw host element.
     * @protected
     * @template T
     * @param {?} harnessType
     * @param {?} element
     * @return {?}
     */
    function (harnessType, element) {
        return new harnessType(this.createEnvironment(element));
    };
    /**
     * @private
     * @template T
     * @param {?} harnessType
     * @return {?}
     */
    HarnessEnvironment.prototype._getAllHarnesses = /**
     * @private
     * @template T
     * @param {?} harnessType
     * @return {?}
     */
    function (harnessType) {
        return __awaiter(this, void 0, void 0, function () {
            var harnessPredicate, elements;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        harnessPredicate = harnessType instanceof HarnessPredicate ?
                            harnessType : new HarnessPredicate(harnessType, {});
                        return [4 /*yield*/, this.getAllRawElements(harnessPredicate.getSelector())];
                    case 1:
                        elements = _a.sent();
                        return [2 /*return*/, harnessPredicate.filter(elements.map((/**
                             * @param {?} element
                             * @return {?}
                             */
                            function (element) { return _this.createComponentHarness(harnessPredicate.harnessType, element); })))];
                }
            });
        });
    };
    /**
     * @private
     * @param {?} selector
     * @return {?}
     */
    HarnessEnvironment.prototype._assertElementFound = /**
     * @private
     * @param {?} selector
     * @return {?}
     */
    function (selector) {
        return __awaiter(this, void 0, void 0, function () {
            var element;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getAllRawElements(selector)];
                    case 1:
                        element = (_a.sent())[0];
                        if (!element) {
                            throw Error("Expected to find element matching selector: \"" + selector + "\", but none was found");
                        }
                        return [2 /*return*/, element];
                }
            });
        });
    };
    /**
     * @private
     * @template T
     * @param {?} harnessType
     * @return {?}
     */
    HarnessEnvironment.prototype._assertHarnessFound = /**
     * @private
     * @template T
     * @param {?} harnessType
     * @return {?}
     */
    function (harnessType) {
        return __awaiter(this, void 0, void 0, function () {
            var harness;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._getAllHarnesses(harnessType)];
                    case 1:
                        harness = (_a.sent())[0];
                        if (!harness) {
                            throw _getErrorForMissingHarness(harnessType);
                        }
                        return [2 /*return*/, harness];
                }
            });
        });
    };
    return HarnessEnvironment;
}());
/**
 * @template T
 * @param {?} harnessType
 * @return {?}
 */
function _getErrorForMissingHarness(harnessType) {
    /** @type {?} */
    var harnessPredicate = harnessType instanceof HarnessPredicate ? harnessType : new HarnessPredicate(harnessType, {});
    var _a = harnessPredicate.harnessType, name = _a.name, hostSelector = _a.hostSelector;
    /** @type {?} */
    var restrictions = harnessPredicate.getDescription();
    /** @type {?} */
    var message = "Expected to find element for " + name + " matching selector: \"" + hostSelector + "\"";
    if (restrictions) {
        message += " (with restrictions: " + restrictions + ")";
    }
    message += ', but none was found';
    return Error(message);
}

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

/** @enum {number} */
var TestKey = {
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

exports.ComponentHarness = ComponentHarness;
exports.HarnessPredicate = HarnessPredicate;
exports.dispatchEvent = dispatchEvent;
exports.dispatchFakeEvent = dispatchFakeEvent;
exports.dispatchKeyboardEvent = dispatchKeyboardEvent;
exports.dispatchMouseEvent = dispatchMouseEvent;
exports.dispatchTouchEvent = dispatchTouchEvent;
exports.patchElementFocus = patchElementFocus;
exports.triggerFocus = triggerFocus;
exports.triggerBlur = triggerBlur;
exports.createMouseEvent = createMouseEvent;
exports.createTouchEvent = createTouchEvent;
exports.createKeyboardEvent = createKeyboardEvent;
exports.createFakeEvent = createFakeEvent;
exports.HarnessEnvironment = HarnessEnvironment;
exports.TestKey = TestKey;
exports.isTextInput = isTextInput;
exports.typeInElement = typeInElement;
exports.clearElement = clearElement;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=cdk-testing.umd.js.map
