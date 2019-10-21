(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('tslib')) :
    typeof define === 'function' && define.amd ? define('@angular/cdk/testing', ['exports', 'tslib'], factory) :
    (global = global || self, factory((global.ng = global.ng || {}, global.ng.cdk = global.ng.cdk || {}, global.ng.cdk.testing = {}), global.tslib));
}(this, function (exports, tslib_1) { 'use strict';

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Base class for component harnesses that all component harness authors should extend. This base
     * component harness provides the basic ability to locate element and sub-component harness. It
     * should be inherited when defining user's own harness.
     */
    var ComponentHarness = /** @class */ (function () {
        function ComponentHarness(locatorFactory) {
            this.locatorFactory = locatorFactory;
        }
        /** Gets a `Promise` for the `TestElement` representing the host element of the component. */
        ComponentHarness.prototype.host = function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    return [2 /*return*/, this.locatorFactory.rootElement];
                });
            });
        };
        /**
         * Gets a `LocatorFactory` for the document root element. This factory can be used to create
         * locators for elements that a component creates outside of its own root element. (e.g. by
         * appending to document.body).
         */
        ComponentHarness.prototype.documentRootLocatorFactory = function () {
            return this.locatorFactory.documentRootLocatorFactory();
        };
        ComponentHarness.prototype.locatorFor = function (arg) {
            return this.locatorFactory.locatorFor(arg);
        };
        ComponentHarness.prototype.locatorForOptional = function (arg) {
            return this.locatorFactory.locatorForOptional(arg);
        };
        ComponentHarness.prototype.locatorForAll = function (arg) {
            return this.locatorFactory.locatorForAll(arg);
        };
        /**
         * Flushes change detection and async tasks in the Angular zone.
         * In most cases it should not be necessary to call this manually. However, there may be some edge
         * cases where it is needed to fully flush animation events.
         */
        ComponentHarness.prototype.forceStabilize = function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    return [2 /*return*/, this.locatorFactory.forceStabilize()];
                });
            });
        };
        /**
         * Waits for all scheduled or running async tasks to complete. This allows harness
         * authors to wait for async tasks outside of the Angular zone.
         */
        ComponentHarness.prototype.waitForTasksOutsideAngular = function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    return [2 /*return*/, this.locatorFactory.waitForTasksOutsideAngular()];
                });
            });
        };
        return ComponentHarness;
    }());
    /**
     * A class used to associate a ComponentHarness class with predicates functions that can be used to
     * filter instances of the class.
     */
    var HarnessPredicate = /** @class */ (function () {
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
        HarnessPredicate.stringMatches = function (s, pattern) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
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
        HarnessPredicate.prototype.add = function (description, predicate) {
            this._descriptions.push(description);
            this._predicates.push(predicate);
            return this;
        };
        /**
         * Adds a predicate function that depends on an option value to be run against candidate
         * harnesses. If the option value is undefined, the predicate will be ignored.
         * @param name The name of the option (may be used in error messages).
         * @param option The option value.
         * @param predicate The predicate function to run if the option value is not undefined.
         * @return this (for method chaining).
         */
        HarnessPredicate.prototype.addOption = function (name, option, predicate) {
            // Add quotes around strings to differentiate them from other values
            var value = typeof option === 'string' ? "\"" + option + "\"" : "" + option;
            if (option !== undefined) {
                this.add(name + " = " + value, function (item) { return predicate(item, option); });
            }
            return this;
        };
        /**
         * Filters a list of harnesses on this predicate.
         * @param harnesses The list of harnesses to filter.
         * @return A list of harnesses that satisfy this predicate.
         */
        HarnessPredicate.prototype.filter = function (harnesses) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var results;
                var _this = this;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, Promise.all(harnesses.map(function (h) { return _this.evaluate(h); }))];
                        case 1:
                            results = _a.sent();
                            return [2 /*return*/, harnesses.filter(function (_, i) { return results[i]; })];
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
        HarnessPredicate.prototype.evaluate = function (harness) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var results;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, Promise.all(this._predicates.map(function (p) { return p(harness); }))];
                        case 1:
                            results = _a.sent();
                            return [2 /*return*/, results.reduce(function (combined, current) { return combined && current; }, true)];
                    }
                });
            });
        };
        /** Gets a description of this predicate for use in error messages. */
        HarnessPredicate.prototype.getDescription = function () {
            return this._descriptions.join(', ');
        };
        /** Gets the selector used to find candidate elements. */
        HarnessPredicate.prototype.getSelector = function () {
            var _this = this;
            return this._ancestor.split(',')
                .map(function (part) { return (part.trim() + " " + _this.harnessType.hostSelector).trim(); })
                .join(',');
        };
        /** Adds base options common to all harness types. */
        HarnessPredicate.prototype._addBaseOptions = function (options) {
            var _this = this;
            this._ancestor = options.ancestor || '';
            if (this._ancestor) {
                this._descriptions.push("has ancestor matching selector \"" + this._ancestor + "\"");
            }
            var selector = options.selector;
            if (selector !== undefined) {
                this.add("host matches selector \"" + selector + "\"", function (item) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    return tslib_1.__generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, item.host()];
                            case 1: return [2 /*return*/, (_a.sent()).matchesSelector(selector)];
                        }
                    });
                }); });
            }
        };
        return HarnessPredicate;
    }());

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

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
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
    function dispatchFakeEvent(node, type, canBubble) {
        return dispatchEvent(node, createFakeEvent(type, canBubble));
    }
    /**
     * Shorthand to dispatch a keyboard event with a specified key code.
     * @docs-private
     */
    function dispatchKeyboardEvent(node, type, keyCode, key, target, modifiers) {
        return dispatchEvent(node, createKeyboardEvent(type, keyCode, key, target, modifiers));
    }
    /**
     * Shorthand to dispatch a mouse event on the specified coordinates.
     * @docs-private
     */
    function dispatchMouseEvent(node, type, x, y, event) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        if (event === void 0) { event = createMouseEvent(type, x, y); }
        return dispatchEvent(node, event);
    }
    /**
     * Shorthand to dispatch a touch event on the specified coordinates.
     * @docs-private
     */
    function dispatchTouchEvent(node, type, x, y) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        return dispatchEvent(node, createTouchEvent(type, x, y));
    }

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function triggerFocusChange(element, event) {
        var eventFired = false;
        var handler = function () { return eventFired = true; };
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
     * @docs-private
     */
    function patchElementFocus(element) {
        element.focus = function () { return dispatchFakeEvent(element, 'focus'); };
        element.blur = function () { return dispatchFakeEvent(element, 'blur'); };
    }
    /** @docs-private */
    function triggerFocus(element) {
        triggerFocusChange(element, 'focus');
    }
    /** @docs-private */
    function triggerBlur(element) {
        triggerFocusChange(element, 'blur');
    }

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Base harness environment class that can be extended to allow `ComponentHarness`es to be used in
     * different test environments (e.g. testbed, protractor, etc.). This class implements the
     * functionality of both a `HarnessLoader` and `LocatorFactory`. This class is generic on the raw
     * element type, `E`, used by the particular test environment.
     */
    var HarnessEnvironment = /** @class */ (function () {
        function HarnessEnvironment(rawRootElement) {
            this.rawRootElement = rawRootElement;
            this.rootElement = this.createTestElement(rawRootElement);
        }
        // Implemented as part of the `LocatorFactory` interface.
        HarnessEnvironment.prototype.documentRootLocatorFactory = function () {
            return this.createEnvironment(this.getDocumentRoot());
        };
        HarnessEnvironment.prototype.locatorFor = function (arg) {
            var _this = this;
            return function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var _a;
                return tslib_1.__generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!(typeof arg === 'string')) return [3 /*break*/, 2];
                            _a = this.createTestElement;
                            return [4 /*yield*/, this._assertElementFound(arg)];
                        case 1: return [2 /*return*/, _a.apply(this, [_b.sent()])];
                        case 2: return [2 /*return*/, this._assertHarnessFound(arg)];
                    }
                });
            }); };
        };
        HarnessEnvironment.prototype.locatorForOptional = function (arg) {
            var _this = this;
            return function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var element, candidates;
                return tslib_1.__generator(this, function (_a) {
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
            }); };
        };
        HarnessEnvironment.prototype.locatorForAll = function (arg) {
            var _this = this;
            return function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var _this = this;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(typeof arg === 'string')) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.getAllRawElements(arg)];
                        case 1: return [2 /*return*/, (_a.sent()).map(function (e) { return _this.createTestElement(e); })];
                        case 2: return [2 /*return*/, this._getAllHarnesses(arg)];
                    }
                });
            }); };
        };
        // Implemented as part of the `LocatorFactory` interface.
        HarnessEnvironment.prototype.harnessLoaderFor = function (selector) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var _a;
                return tslib_1.__generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = this.createEnvironment;
                            return [4 /*yield*/, this._assertElementFound(selector)];
                        case 1: return [2 /*return*/, _a.apply(this, [_b.sent()])];
                    }
                });
            });
        };
        // Implemented as part of the `LocatorFactory` interface.
        HarnessEnvironment.prototype.harnessLoaderForOptional = function (selector) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var elements;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getAllRawElements(selector)];
                        case 1:
                            elements = _a.sent();
                            return [2 /*return*/, elements[0] ? this.createEnvironment(elements[0]) : null];
                    }
                });
            });
        };
        // Implemented as part of the `LocatorFactory` interface.
        HarnessEnvironment.prototype.harnessLoaderForAll = function (selector) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var elements;
                var _this = this;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getAllRawElements(selector)];
                        case 1:
                            elements = _a.sent();
                            return [2 /*return*/, elements.map(function (element) { return _this.createEnvironment(element); })];
                    }
                });
            });
        };
        // Implemented as part of the `HarnessLoader` interface.
        HarnessEnvironment.prototype.getHarness = function (harnessType) {
            return this.locatorFor(harnessType)();
        };
        // Implemented as part of the `HarnessLoader` interface.
        HarnessEnvironment.prototype.getAllHarnesses = function (harnessType) {
            return this.locatorForAll(harnessType)();
        };
        // Implemented as part of the `HarnessLoader` interface.
        HarnessEnvironment.prototype.getChildLoader = function (selector) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var _a;
                return tslib_1.__generator(this, function (_b) {
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
        HarnessEnvironment.prototype.getAllChildLoaders = function (selector) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var _this = this;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getAllRawElements(selector)];
                        case 1: return [2 /*return*/, (_a.sent()).map(function (e) { return _this.createEnvironment(e); })];
                    }
                });
            });
        };
        /** Creates a `ComponentHarness` for the given harness type with the given raw host element. */
        HarnessEnvironment.prototype.createComponentHarness = function (harnessType, element) {
            return new harnessType(this.createEnvironment(element));
        };
        HarnessEnvironment.prototype._getAllHarnesses = function (harnessType) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var harnessPredicate, elements;
                var _this = this;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            harnessPredicate = harnessType instanceof HarnessPredicate ?
                                harnessType : new HarnessPredicate(harnessType, {});
                            return [4 /*yield*/, this.getAllRawElements(harnessPredicate.getSelector())];
                        case 1:
                            elements = _a.sent();
                            return [2 /*return*/, harnessPredicate.filter(elements.map(function (element) { return _this.createComponentHarness(harnessPredicate.harnessType, element); }))];
                    }
                });
            });
        };
        HarnessEnvironment.prototype._assertElementFound = function (selector) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var element;
                return tslib_1.__generator(this, function (_a) {
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
        HarnessEnvironment.prototype._assertHarnessFound = function (harnessType) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var harness;
                return tslib_1.__generator(this, function (_a) {
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
    function _getErrorForMissingHarness(harnessType) {
        var harnessPredicate = harnessType instanceof HarnessPredicate ? harnessType : new HarnessPredicate(harnessType, {});
        var _a = harnessPredicate.harnessType, name = _a.name, hostSelector = _a.hostSelector;
        var restrictions = harnessPredicate.getDescription();
        var message = "Expected to find element for " + name + " matching selector: \"" + hostSelector + "\"";
        if (restrictions) {
            message += " (with restrictions: " + restrictions + ")";
        }
        message += ', but none was found';
        return Error(message);
    }

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    (function (TestKey) {
        TestKey[TestKey["BACKSPACE"] = 0] = "BACKSPACE";
        TestKey[TestKey["TAB"] = 1] = "TAB";
        TestKey[TestKey["ENTER"] = 2] = "ENTER";
        TestKey[TestKey["SHIFT"] = 3] = "SHIFT";
        TestKey[TestKey["CONTROL"] = 4] = "CONTROL";
        TestKey[TestKey["ALT"] = 5] = "ALT";
        TestKey[TestKey["ESCAPE"] = 6] = "ESCAPE";
        TestKey[TestKey["PAGE_UP"] = 7] = "PAGE_UP";
        TestKey[TestKey["PAGE_DOWN"] = 8] = "PAGE_DOWN";
        TestKey[TestKey["END"] = 9] = "END";
        TestKey[TestKey["HOME"] = 10] = "HOME";
        TestKey[TestKey["LEFT_ARROW"] = 11] = "LEFT_ARROW";
        TestKey[TestKey["UP_ARROW"] = 12] = "UP_ARROW";
        TestKey[TestKey["RIGHT_ARROW"] = 13] = "RIGHT_ARROW";
        TestKey[TestKey["DOWN_ARROW"] = 14] = "DOWN_ARROW";
        TestKey[TestKey["INSERT"] = 15] = "INSERT";
        TestKey[TestKey["DELETE"] = 16] = "DELETE";
        TestKey[TestKey["F1"] = 17] = "F1";
        TestKey[TestKey["F2"] = 18] = "F2";
        TestKey[TestKey["F3"] = 19] = "F3";
        TestKey[TestKey["F4"] = 20] = "F4";
        TestKey[TestKey["F5"] = 21] = "F5";
        TestKey[TestKey["F6"] = 22] = "F6";
        TestKey[TestKey["F7"] = 23] = "F7";
        TestKey[TestKey["F8"] = 24] = "F8";
        TestKey[TestKey["F9"] = 25] = "F9";
        TestKey[TestKey["F10"] = 26] = "F10";
        TestKey[TestKey["F11"] = 27] = "F11";
        TestKey[TestKey["F12"] = 28] = "F12";
        TestKey[TestKey["META"] = 29] = "META";
    })(exports.TestKey || (exports.TestKey = {}));

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Checks whether the given Element is a text input element.
     * @docs-private
     */
    function isTextInput(element) {
        return element.nodeName.toLowerCase() === 'input' ||
            element.nodeName.toLowerCase() === 'textarea';
    }
    function typeInElement(element) {
        var e_1, _a;
        var modifiersAndKeys = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            modifiersAndKeys[_i - 1] = arguments[_i];
        }
        var first = modifiersAndKeys[0];
        var modifiers;
        var rest;
        if (typeof first !== 'string' && first.keyCode === undefined && first.key === undefined) {
            modifiers = first;
            rest = modifiersAndKeys.slice(1);
        }
        else {
            modifiers = {};
            rest = modifiersAndKeys;
        }
        var keys = rest
            .map(function (k) { return typeof k === 'string' ?
            k.split('').map(function (c) { return ({ keyCode: c.toUpperCase().charCodeAt(0), key: c }); }) : [k]; })
            .reduce(function (arr, k) { return arr.concat(k); }, []);
        triggerFocus(element);
        try {
            for (var keys_1 = tslib_1.__values(keys), keys_1_1 = keys_1.next(); !keys_1_1.done; keys_1_1 = keys_1.next()) {
                var key = keys_1_1.value;
                dispatchKeyboardEvent(element, 'keydown', key.keyCode, key.key, element, modifiers);
                dispatchKeyboardEvent(element, 'keypress', key.keyCode, key.key, element, modifiers);
                if (isTextInput(element) && key.key && key.key.length === 1) {
                    element.value += key.key;
                    dispatchFakeEvent(element, 'input');
                }
                dispatchKeyboardEvent(element, 'keyup', key.keyCode, key.key, element, modifiers);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (keys_1_1 && !keys_1_1.done && (_a = keys_1.return)) _a.call(keys_1);
            }
            finally { if (e_1) throw e_1.error; }
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

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */

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
    exports.isTextInput = isTextInput;
    exports.typeInElement = typeInElement;
    exports.clearElement = clearElement;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=cdk-testing.umd.js.map
