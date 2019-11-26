(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/common'), require('@angular/core'), require('tslib'), require('rxjs'), require('@angular/cdk/keycodes'), require('rxjs/operators'), require('@angular/cdk/coercion'), require('@angular/cdk/platform'), require('@angular/cdk/observers')) :
    typeof define === 'function' && define.amd ? define('@angular/cdk/a11y', ['exports', '@angular/common', '@angular/core', 'tslib', 'rxjs', '@angular/cdk/keycodes', 'rxjs/operators', '@angular/cdk/coercion', '@angular/cdk/platform', '@angular/cdk/observers'], factory) :
    (global = global || self, factory((global.ng = global.ng || {}, global.ng.cdk = global.ng.cdk || {}, global.ng.cdk.a11Y = {}), global.ng.common, global.ng.core, global.tslib, global.rxjs, global.ng.cdk.keycodes, global.rxjs.operators, global.ng.cdk.coercion, global.ng.cdk.platform, global.ng.cdk.observers));
}(this, (function (exports, i2, i0, tslib, rxjs, keycodes, operators, coercion, i1, observers) { 'use strict';

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /** IDs are deliminated by an empty space, as per the spec. */
    var ID_DELIMINATOR = ' ';
    /**
     * Adds the given ID to the specified ARIA attribute on an element.
     * Used for attributes such as aria-labelledby, aria-owns, etc.
     */
    function addAriaReferencedId(el, attr, id) {
        var ids = getAriaReferenceIds(el, attr);
        if (ids.some(function (existingId) { return existingId.trim() == id.trim(); })) {
            return;
        }
        ids.push(id.trim());
        el.setAttribute(attr, ids.join(ID_DELIMINATOR));
    }
    /**
     * Removes the given ID from the specified ARIA attribute on an element.
     * Used for attributes such as aria-labelledby, aria-owns, etc.
     */
    function removeAriaReferencedId(el, attr, id) {
        var ids = getAriaReferenceIds(el, attr);
        var filteredIds = ids.filter(function (val) { return val != id.trim(); });
        if (filteredIds.length) {
            el.setAttribute(attr, filteredIds.join(ID_DELIMINATOR));
        }
        else {
            el.removeAttribute(attr);
        }
    }
    /**
     * Gets the list of IDs referenced by the given ARIA attribute on an element.
     * Used for attributes such as aria-labelledby, aria-owns, etc.
     */
    function getAriaReferenceIds(el, attr) {
        // Get string array of all individual ids (whitespace deliminated) in the attribute value
        return (el.getAttribute(attr) || '').match(/\S+/g) || [];
    }

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /** ID used for the body container where all messages are appended. */
    var MESSAGES_CONTAINER_ID = 'cdk-describedby-message-container';
    /** ID prefix used for each created message element. */
    var CDK_DESCRIBEDBY_ID_PREFIX = 'cdk-describedby-message';
    /** Attribute given to each host element that is described by a message element. */
    var CDK_DESCRIBEDBY_HOST_ATTRIBUTE = 'cdk-describedby-host';
    /** Global incremental identifier for each registered message element. */
    var nextId = 0;
    /** Global map of all registered message elements that have been placed into the document. */
    var messageRegistry = new Map();
    /** Container for all registered messages. */
    var messagesContainer = null;
    /**
     * Utility that creates visually hidden elements with a message content. Useful for elements that
     * want to use aria-describedby to further describe themselves without adding additional visual
     * content.
     */
    var AriaDescriber = /** @class */ (function () {
        function AriaDescriber(_document) {
            this._document = _document;
        }
        /**
         * Adds to the host element an aria-describedby reference to a hidden element that contains
         * the message. If the same message has already been registered, then it will reuse the created
         * message element.
         */
        AriaDescriber.prototype.describe = function (hostElement, message) {
            if (!this._canBeDescribed(hostElement, message)) {
                return;
            }
            if (typeof message !== 'string') {
                // We need to ensure that the element has an ID.
                this._setMessageId(message);
                messageRegistry.set(message, { messageElement: message, referenceCount: 0 });
            }
            else if (!messageRegistry.has(message)) {
                this._createMessageElement(message);
            }
            if (!this._isElementDescribedByMessage(hostElement, message)) {
                this._addMessageReference(hostElement, message);
            }
        };
        /** Removes the host element's aria-describedby reference to the message element. */
        AriaDescriber.prototype.removeDescription = function (hostElement, message) {
            if (!this._isElementNode(hostElement)) {
                return;
            }
            if (this._isElementDescribedByMessage(hostElement, message)) {
                this._removeMessageReference(hostElement, message);
            }
            // If the message is a string, it means that it's one that we created for the
            // consumer so we can remove it safely, otherwise we should leave it in place.
            if (typeof message === 'string') {
                var registeredMessage = messageRegistry.get(message);
                if (registeredMessage && registeredMessage.referenceCount === 0) {
                    this._deleteMessageElement(message);
                }
            }
            if (messagesContainer && messagesContainer.childNodes.length === 0) {
                this._deleteMessagesContainer();
            }
        };
        /** Unregisters all created message elements and removes the message container. */
        AriaDescriber.prototype.ngOnDestroy = function () {
            var describedElements = this._document.querySelectorAll("[" + CDK_DESCRIBEDBY_HOST_ATTRIBUTE + "]");
            for (var i = 0; i < describedElements.length; i++) {
                this._removeCdkDescribedByReferenceIds(describedElements[i]);
                describedElements[i].removeAttribute(CDK_DESCRIBEDBY_HOST_ATTRIBUTE);
            }
            if (messagesContainer) {
                this._deleteMessagesContainer();
            }
            messageRegistry.clear();
        };
        /**
         * Creates a new element in the visually hidden message container element with the message
         * as its content and adds it to the message registry.
         */
        AriaDescriber.prototype._createMessageElement = function (message) {
            var messageElement = this._document.createElement('div');
            this._setMessageId(messageElement);
            messageElement.textContent = message;
            this._createMessagesContainer();
            messagesContainer.appendChild(messageElement);
            messageRegistry.set(message, { messageElement: messageElement, referenceCount: 0 });
        };
        /** Assigns a unique ID to an element, if it doesn't have one already. */
        AriaDescriber.prototype._setMessageId = function (element) {
            if (!element.id) {
                element.id = CDK_DESCRIBEDBY_ID_PREFIX + "-" + nextId++;
            }
        };
        /** Deletes the message element from the global messages container. */
        AriaDescriber.prototype._deleteMessageElement = function (message) {
            var registeredMessage = messageRegistry.get(message);
            var messageElement = registeredMessage && registeredMessage.messageElement;
            if (messagesContainer && messageElement) {
                messagesContainer.removeChild(messageElement);
            }
            messageRegistry.delete(message);
        };
        /** Creates the global container for all aria-describedby messages. */
        AriaDescriber.prototype._createMessagesContainer = function () {
            if (!messagesContainer) {
                var preExistingContainer = this._document.getElementById(MESSAGES_CONTAINER_ID);
                // When going from the server to the client, we may end up in a situation where there's
                // already a container on the page, but we don't have a reference to it. Clear the
                // old container so we don't get duplicates. Doing this, instead of emptying the previous
                // container, should be slightly faster.
                if (preExistingContainer) {
                    preExistingContainer.parentNode.removeChild(preExistingContainer);
                }
                messagesContainer = this._document.createElement('div');
                messagesContainer.id = MESSAGES_CONTAINER_ID;
                messagesContainer.setAttribute('aria-hidden', 'true');
                messagesContainer.style.display = 'none';
                this._document.body.appendChild(messagesContainer);
            }
        };
        /** Deletes the global messages container. */
        AriaDescriber.prototype._deleteMessagesContainer = function () {
            if (messagesContainer && messagesContainer.parentNode) {
                messagesContainer.parentNode.removeChild(messagesContainer);
                messagesContainer = null;
            }
        };
        /** Removes all cdk-describedby messages that are hosted through the element. */
        AriaDescriber.prototype._removeCdkDescribedByReferenceIds = function (element) {
            // Remove all aria-describedby reference IDs that are prefixed by CDK_DESCRIBEDBY_ID_PREFIX
            var originalReferenceIds = getAriaReferenceIds(element, 'aria-describedby')
                .filter(function (id) { return id.indexOf(CDK_DESCRIBEDBY_ID_PREFIX) != 0; });
            element.setAttribute('aria-describedby', originalReferenceIds.join(' '));
        };
        /**
         * Adds a message reference to the element using aria-describedby and increments the registered
         * message's reference count.
         */
        AriaDescriber.prototype._addMessageReference = function (element, message) {
            var registeredMessage = messageRegistry.get(message);
            // Add the aria-describedby reference and set the
            // describedby_host attribute to mark the element.
            addAriaReferencedId(element, 'aria-describedby', registeredMessage.messageElement.id);
            element.setAttribute(CDK_DESCRIBEDBY_HOST_ATTRIBUTE, '');
            registeredMessage.referenceCount++;
        };
        /**
         * Removes a message reference from the element using aria-describedby
         * and decrements the registered message's reference count.
         */
        AriaDescriber.prototype._removeMessageReference = function (element, message) {
            var registeredMessage = messageRegistry.get(message);
            registeredMessage.referenceCount--;
            removeAriaReferencedId(element, 'aria-describedby', registeredMessage.messageElement.id);
            element.removeAttribute(CDK_DESCRIBEDBY_HOST_ATTRIBUTE);
        };
        /** Returns true if the element has been described by the provided message ID. */
        AriaDescriber.prototype._isElementDescribedByMessage = function (element, message) {
            var referenceIds = getAriaReferenceIds(element, 'aria-describedby');
            var registeredMessage = messageRegistry.get(message);
            var messageId = registeredMessage && registeredMessage.messageElement.id;
            return !!messageId && referenceIds.indexOf(messageId) != -1;
        };
        /** Determines whether a message can be described on a particular element. */
        AriaDescriber.prototype._canBeDescribed = function (element, message) {
            if (!this._isElementNode(element)) {
                return false;
            }
            if (message && typeof message === 'object') {
                // We'd have to make some assumptions about the description element's text, if the consumer
                // passed in an element. Assume that if an element is passed in, the consumer has verified
                // that it can be used as a description.
                return true;
            }
            var trimmedMessage = message == null ? '' : ("" + message).trim();
            var ariaLabel = element.getAttribute('aria-label');
            // We shouldn't set descriptions if they're exactly the same as the `aria-label` of the
            // element, because screen readers will end up reading out the same text twice in a row.
            return trimmedMessage ? (!ariaLabel || ariaLabel.trim() !== trimmedMessage) : false;
        };
        /** Checks whether a node is an Element node. */
        AriaDescriber.prototype._isElementNode = function (element) {
            return element.nodeType === this._document.ELEMENT_NODE;
        };
        AriaDescriber.decorators = [
            { type: i0.Injectable, args: [{ providedIn: 'root' },] }
        ];
        /** @nocollapse */
        AriaDescriber.ctorParameters = function () { return [
            { type: undefined, decorators: [{ type: i0.Inject, args: [i2.DOCUMENT,] }] }
        ]; };
        AriaDescriber.ɵprov = i0.ɵɵdefineInjectable({ factory: function AriaDescriber_Factory() { return new AriaDescriber(i0.ɵɵinject(i2.DOCUMENT)); }, token: AriaDescriber, providedIn: "root" });
        return AriaDescriber;
    }());

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * This class manages keyboard events for selectable lists. If you pass it a query list
     * of items, it will set the active item correctly when arrow events occur.
     */
    var ListKeyManager = /** @class */ (function () {
        function ListKeyManager(_items) {
            var _this = this;
            this._items = _items;
            this._activeItemIndex = -1;
            this._activeItem = null;
            this._wrap = false;
            this._letterKeyStream = new rxjs.Subject();
            this._typeaheadSubscription = rxjs.Subscription.EMPTY;
            this._vertical = true;
            this._allowedModifierKeys = [];
            /**
             * Predicate function that can be used to check whether an item should be skipped
             * by the key manager. By default, disabled items are skipped.
             */
            this._skipPredicateFn = function (item) { return item.disabled; };
            // Buffer for the letters that the user has pressed when the typeahead option is turned on.
            this._pressedLetters = [];
            /**
             * Stream that emits any time the TAB key is pressed, so components can react
             * when focus is shifted off of the list.
             */
            this.tabOut = new rxjs.Subject();
            /** Stream that emits whenever the active item of the list manager changes. */
            this.change = new rxjs.Subject();
            // We allow for the items to be an array because, in some cases, the consumer may
            // not have access to a QueryList of the items they want to manage (e.g. when the
            // items aren't being collected via `ViewChildren` or `ContentChildren`).
            if (_items instanceof i0.QueryList) {
                _items.changes.subscribe(function (newItems) {
                    if (_this._activeItem) {
                        var itemArray = newItems.toArray();
                        var newIndex = itemArray.indexOf(_this._activeItem);
                        if (newIndex > -1 && newIndex !== _this._activeItemIndex) {
                            _this._activeItemIndex = newIndex;
                        }
                    }
                });
            }
        }
        /**
         * Sets the predicate function that determines which items should be skipped by the
         * list key manager.
         * @param predicate Function that determines whether the given item should be skipped.
         */
        ListKeyManager.prototype.skipPredicate = function (predicate) {
            this._skipPredicateFn = predicate;
            return this;
        };
        /**
         * Configures wrapping mode, which determines whether the active item will wrap to
         * the other end of list when there are no more items in the given direction.
         * @param shouldWrap Whether the list should wrap when reaching the end.
         */
        ListKeyManager.prototype.withWrap = function (shouldWrap) {
            if (shouldWrap === void 0) { shouldWrap = true; }
            this._wrap = shouldWrap;
            return this;
        };
        /**
         * Configures whether the key manager should be able to move the selection vertically.
         * @param enabled Whether vertical selection should be enabled.
         */
        ListKeyManager.prototype.withVerticalOrientation = function (enabled) {
            if (enabled === void 0) { enabled = true; }
            this._vertical = enabled;
            return this;
        };
        /**
         * Configures the key manager to move the selection horizontally.
         * Passing in `null` will disable horizontal movement.
         * @param direction Direction in which the selection can be moved.
         */
        ListKeyManager.prototype.withHorizontalOrientation = function (direction) {
            this._horizontal = direction;
            return this;
        };
        /**
         * Modifier keys which are allowed to be held down and whose default actions will be prevented
         * as the user is pressing the arrow keys. Defaults to not allowing any modifier keys.
         */
        ListKeyManager.prototype.withAllowedModifierKeys = function (keys) {
            this._allowedModifierKeys = keys;
            return this;
        };
        /**
         * Turns on typeahead mode which allows users to set the active item by typing.
         * @param debounceInterval Time to wait after the last keystroke before setting the active item.
         */
        ListKeyManager.prototype.withTypeAhead = function (debounceInterval) {
            var _this = this;
            if (debounceInterval === void 0) { debounceInterval = 200; }
            if (this._items.length && this._items.some(function (item) { return typeof item.getLabel !== 'function'; })) {
                throw Error('ListKeyManager items in typeahead mode must implement the `getLabel` method.');
            }
            this._typeaheadSubscription.unsubscribe();
            // Debounce the presses of non-navigational keys, collect the ones that correspond to letters
            // and convert those letters back into a string. Afterwards find the first item that starts
            // with that string and select it.
            this._typeaheadSubscription = this._letterKeyStream.pipe(operators.tap(function (letter) { return _this._pressedLetters.push(letter); }), operators.debounceTime(debounceInterval), operators.filter(function () { return _this._pressedLetters.length > 0; }), operators.map(function () { return _this._pressedLetters.join(''); })).subscribe(function (inputString) {
                var items = _this._getItemsArray();
                // Start at 1 because we want to start searching at the item immediately
                // following the current active item.
                for (var i = 1; i < items.length + 1; i++) {
                    var index = (_this._activeItemIndex + i) % items.length;
                    var item = items[index];
                    if (!_this._skipPredicateFn(item) &&
                        item.getLabel().toUpperCase().trim().indexOf(inputString) === 0) {
                        _this.setActiveItem(index);
                        break;
                    }
                }
                _this._pressedLetters = [];
            });
            return this;
        };
        ListKeyManager.prototype.setActiveItem = function (item) {
            var previousIndex = this._activeItemIndex;
            this.updateActiveItem(item);
            if (this._activeItemIndex !== previousIndex) {
                this.change.next(this._activeItemIndex);
            }
        };
        /**
         * Sets the active item depending on the key event passed in.
         * @param event Keyboard event to be used for determining which element should be active.
         */
        ListKeyManager.prototype.onKeydown = function (event) {
            var _this = this;
            var keyCode = event.keyCode;
            var modifiers = ['altKey', 'ctrlKey', 'metaKey', 'shiftKey'];
            var isModifierAllowed = modifiers.every(function (modifier) {
                return !event[modifier] || _this._allowedModifierKeys.indexOf(modifier) > -1;
            });
            switch (keyCode) {
                case keycodes.TAB:
                    this.tabOut.next();
                    return;
                case keycodes.DOWN_ARROW:
                    if (this._vertical && isModifierAllowed) {
                        this.setNextItemActive();
                        break;
                    }
                    else {
                        return;
                    }
                case keycodes.UP_ARROW:
                    if (this._vertical && isModifierAllowed) {
                        this.setPreviousItemActive();
                        break;
                    }
                    else {
                        return;
                    }
                case keycodes.RIGHT_ARROW:
                    if (this._horizontal && isModifierAllowed) {
                        this._horizontal === 'rtl' ? this.setPreviousItemActive() : this.setNextItemActive();
                        break;
                    }
                    else {
                        return;
                    }
                case keycodes.LEFT_ARROW:
                    if (this._horizontal && isModifierAllowed) {
                        this._horizontal === 'rtl' ? this.setNextItemActive() : this.setPreviousItemActive();
                        break;
                    }
                    else {
                        return;
                    }
                default:
                    if (isModifierAllowed || keycodes.hasModifierKey(event, 'shiftKey')) {
                        // Attempt to use the `event.key` which also maps it to the user's keyboard language,
                        // otherwise fall back to resolving alphanumeric characters via the keyCode.
                        if (event.key && event.key.length === 1) {
                            this._letterKeyStream.next(event.key.toLocaleUpperCase());
                        }
                        else if ((keyCode >= keycodes.A && keyCode <= keycodes.Z) || (keyCode >= keycodes.ZERO && keyCode <= keycodes.NINE)) {
                            this._letterKeyStream.next(String.fromCharCode(keyCode));
                        }
                    }
                    // Note that we return here, in order to avoid preventing
                    // the default action of non-navigational keys.
                    return;
            }
            this._pressedLetters = [];
            event.preventDefault();
        };
        Object.defineProperty(ListKeyManager.prototype, "activeItemIndex", {
            /** Index of the currently active item. */
            get: function () {
                return this._activeItemIndex;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ListKeyManager.prototype, "activeItem", {
            /** The active item. */
            get: function () {
                return this._activeItem;
            },
            enumerable: true,
            configurable: true
        });
        /** Gets whether the user is currently typing into the manager using the typeahead feature. */
        ListKeyManager.prototype.isTyping = function () {
            return this._pressedLetters.length > 0;
        };
        /** Sets the active item to the first enabled item in the list. */
        ListKeyManager.prototype.setFirstItemActive = function () {
            this._setActiveItemByIndex(0, 1);
        };
        /** Sets the active item to the last enabled item in the list. */
        ListKeyManager.prototype.setLastItemActive = function () {
            this._setActiveItemByIndex(this._items.length - 1, -1);
        };
        /** Sets the active item to the next enabled item in the list. */
        ListKeyManager.prototype.setNextItemActive = function () {
            this._activeItemIndex < 0 ? this.setFirstItemActive() : this._setActiveItemByDelta(1);
        };
        /** Sets the active item to a previous enabled item in the list. */
        ListKeyManager.prototype.setPreviousItemActive = function () {
            this._activeItemIndex < 0 && this._wrap ? this.setLastItemActive()
                : this._setActiveItemByDelta(-1);
        };
        ListKeyManager.prototype.updateActiveItem = function (item) {
            var itemArray = this._getItemsArray();
            var index = typeof item === 'number' ? item : itemArray.indexOf(item);
            var activeItem = itemArray[index];
            // Explicitly check for `null` and `undefined` because other falsy values are valid.
            this._activeItem = activeItem == null ? null : activeItem;
            this._activeItemIndex = index;
        };
        /**
         * This method sets the active item, given a list of items and the delta between the
         * currently active item and the new active item. It will calculate differently
         * depending on whether wrap mode is turned on.
         */
        ListKeyManager.prototype._setActiveItemByDelta = function (delta) {
            this._wrap ? this._setActiveInWrapMode(delta) : this._setActiveInDefaultMode(delta);
        };
        /**
         * Sets the active item properly given "wrap" mode. In other words, it will continue to move
         * down the list until it finds an item that is not disabled, and it will wrap if it
         * encounters either end of the list.
         */
        ListKeyManager.prototype._setActiveInWrapMode = function (delta) {
            var items = this._getItemsArray();
            for (var i = 1; i <= items.length; i++) {
                var index = (this._activeItemIndex + (delta * i) + items.length) % items.length;
                var item = items[index];
                if (!this._skipPredicateFn(item)) {
                    this.setActiveItem(index);
                    return;
                }
            }
        };
        /**
         * Sets the active item properly given the default mode. In other words, it will
         * continue to move down the list until it finds an item that is not disabled. If
         * it encounters either end of the list, it will stop and not wrap.
         */
        ListKeyManager.prototype._setActiveInDefaultMode = function (delta) {
            this._setActiveItemByIndex(this._activeItemIndex + delta, delta);
        };
        /**
         * Sets the active item to the first enabled item starting at the index specified. If the
         * item is disabled, it will move in the fallbackDelta direction until it either
         * finds an enabled item or encounters the end of the list.
         */
        ListKeyManager.prototype._setActiveItemByIndex = function (index, fallbackDelta) {
            var items = this._getItemsArray();
            if (!items[index]) {
                return;
            }
            while (this._skipPredicateFn(items[index])) {
                index += fallbackDelta;
                if (!items[index]) {
                    return;
                }
            }
            this.setActiveItem(index);
        };
        /** Returns the items as an array. */
        ListKeyManager.prototype._getItemsArray = function () {
            return this._items instanceof i0.QueryList ? this._items.toArray() : this._items;
        };
        return ListKeyManager;
    }());

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var ActiveDescendantKeyManager = /** @class */ (function (_super) {
        tslib.__extends(ActiveDescendantKeyManager, _super);
        function ActiveDescendantKeyManager() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ActiveDescendantKeyManager.prototype.setActiveItem = function (index) {
            if (this.activeItem) {
                this.activeItem.setInactiveStyles();
            }
            _super.prototype.setActiveItem.call(this, index);
            if (this.activeItem) {
                this.activeItem.setActiveStyles();
            }
        };
        return ActiveDescendantKeyManager;
    }(ListKeyManager));

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var FocusKeyManager = /** @class */ (function (_super) {
        tslib.__extends(FocusKeyManager, _super);
        function FocusKeyManager() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._origin = 'program';
            return _this;
        }
        /**
         * Sets the focus origin that will be passed in to the items for any subsequent `focus` calls.
         * @param origin Focus origin to be used when focusing items.
         */
        FocusKeyManager.prototype.setFocusOrigin = function (origin) {
            this._origin = origin;
            return this;
        };
        FocusKeyManager.prototype.setActiveItem = function (item) {
            _super.prototype.setActiveItem.call(this, item);
            if (this.activeItem) {
                this.activeItem.focus(this._origin);
            }
        };
        return FocusKeyManager;
    }(ListKeyManager));

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    // The InteractivityChecker leans heavily on the ally.js accessibility utilities.
    // Methods like `isTabbable` are only covering specific edge-cases for the browsers which are
    // supported.
    /**
     * Utility for checking the interactivity of an element, such as whether is is focusable or
     * tabbable.
     */
    var InteractivityChecker = /** @class */ (function () {
        function InteractivityChecker(_platform) {
            this._platform = _platform;
        }
        /**
         * Gets whether an element is disabled.
         *
         * @param element Element to be checked.
         * @returns Whether the element is disabled.
         */
        InteractivityChecker.prototype.isDisabled = function (element) {
            // This does not capture some cases, such as a non-form control with a disabled attribute or
            // a form control inside of a disabled form, but should capture the most common cases.
            return element.hasAttribute('disabled');
        };
        /**
         * Gets whether an element is visible for the purposes of interactivity.
         *
         * This will capture states like `display: none` and `visibility: hidden`, but not things like
         * being clipped by an `overflow: hidden` parent or being outside the viewport.
         *
         * @returns Whether the element is visible.
         */
        InteractivityChecker.prototype.isVisible = function (element) {
            return hasGeometry(element) && getComputedStyle(element).visibility === 'visible';
        };
        /**
         * Gets whether an element can be reached via Tab key.
         * Assumes that the element has already been checked with isFocusable.
         *
         * @param element Element to be checked.
         * @returns Whether the element is tabbable.
         */
        InteractivityChecker.prototype.isTabbable = function (element) {
            // Nothing is tabbable on the server 😎
            if (!this._platform.isBrowser) {
                return false;
            }
            var frameElement = getFrameElement(getWindow(element));
            if (frameElement) {
                var frameType = frameElement && frameElement.nodeName.toLowerCase();
                // Frame elements inherit their tabindex onto all child elements.
                if (getTabIndexValue(frameElement) === -1) {
                    return false;
                }
                // Webkit and Blink consider anything inside of an <object> element as non-tabbable.
                if ((this._platform.BLINK || this._platform.WEBKIT) && frameType === 'object') {
                    return false;
                }
                // Webkit and Blink disable tabbing to an element inside of an invisible frame.
                if ((this._platform.BLINK || this._platform.WEBKIT) && !this.isVisible(frameElement)) {
                    return false;
                }
            }
            var nodeName = element.nodeName.toLowerCase();
            var tabIndexValue = getTabIndexValue(element);
            if (element.hasAttribute('contenteditable')) {
                return tabIndexValue !== -1;
            }
            if (nodeName === 'iframe') {
                // The frames may be tabbable depending on content, but it's not possibly to reliably
                // investigate the content of the frames.
                return false;
            }
            if (nodeName === 'audio') {
                if (!element.hasAttribute('controls')) {
                    // By default an <audio> element without the controls enabled is not tabbable.
                    return false;
                }
                else if (this._platform.BLINK) {
                    // In Blink <audio controls> elements are always tabbable.
                    return true;
                }
            }
            if (nodeName === 'video') {
                if (!element.hasAttribute('controls') && this._platform.TRIDENT) {
                    // In Trident a <video> element without the controls enabled is not tabbable.
                    return false;
                }
                else if (this._platform.BLINK || this._platform.FIREFOX) {
                    // In Chrome and Firefox <video controls> elements are always tabbable.
                    return true;
                }
            }
            if (nodeName === 'object' && (this._platform.BLINK || this._platform.WEBKIT)) {
                // In all Blink and WebKit based browsers <object> elements are never tabbable.
                return false;
            }
            // In iOS the browser only considers some specific elements as tabbable.
            if (this._platform.WEBKIT && this._platform.IOS && !isPotentiallyTabbableIOS(element)) {
                return false;
            }
            return element.tabIndex >= 0;
        };
        /**
         * Gets whether an element can be focused by the user.
         *
         * @param element Element to be checked.
         * @returns Whether the element is focusable.
         */
        InteractivityChecker.prototype.isFocusable = function (element) {
            // Perform checks in order of left to most expensive.
            // Again, naive approach that does not capture many edge cases and browser quirks.
            return isPotentiallyFocusable(element) && !this.isDisabled(element) && this.isVisible(element);
        };
        InteractivityChecker.decorators = [
            { type: i0.Injectable, args: [{ providedIn: 'root' },] }
        ];
        /** @nocollapse */
        InteractivityChecker.ctorParameters = function () { return [
            { type: i1.Platform }
        ]; };
        InteractivityChecker.ɵprov = i0.ɵɵdefineInjectable({ factory: function InteractivityChecker_Factory() { return new InteractivityChecker(i0.ɵɵinject(i1.Platform)); }, token: InteractivityChecker, providedIn: "root" });
        return InteractivityChecker;
    }());
    /**
     * Returns the frame element from a window object. Since browsers like MS Edge throw errors if
     * the frameElement property is being accessed from a different host address, this property
     * should be accessed carefully.
     */
    function getFrameElement(window) {
        try {
            return window.frameElement;
        }
        catch (_a) {
            return null;
        }
    }
    /** Checks whether the specified element has any geometry / rectangles. */
    function hasGeometry(element) {
        // Use logic from jQuery to check for an invisible element.
        // See https://github.com/jquery/jquery/blob/master/src/css/hiddenVisibleSelectors.js#L12
        return !!(element.offsetWidth || element.offsetHeight ||
            (typeof element.getClientRects === 'function' && element.getClientRects().length));
    }
    /** Gets whether an element's  */
    function isNativeFormElement(element) {
        var nodeName = element.nodeName.toLowerCase();
        return nodeName === 'input' ||
            nodeName === 'select' ||
            nodeName === 'button' ||
            nodeName === 'textarea';
    }
    /** Gets whether an element is an `<input type="hidden">`. */
    function isHiddenInput(element) {
        return isInputElement(element) && element.type == 'hidden';
    }
    /** Gets whether an element is an anchor that has an href attribute. */
    function isAnchorWithHref(element) {
        return isAnchorElement(element) && element.hasAttribute('href');
    }
    /** Gets whether an element is an input element. */
    function isInputElement(element) {
        return element.nodeName.toLowerCase() == 'input';
    }
    /** Gets whether an element is an anchor element. */
    function isAnchorElement(element) {
        return element.nodeName.toLowerCase() == 'a';
    }
    /** Gets whether an element has a valid tabindex. */
    function hasValidTabIndex(element) {
        if (!element.hasAttribute('tabindex') || element.tabIndex === undefined) {
            return false;
        }
        var tabIndex = element.getAttribute('tabindex');
        // IE11 parses tabindex="" as the value "-32768"
        if (tabIndex == '-32768') {
            return false;
        }
        return !!(tabIndex && !isNaN(parseInt(tabIndex, 10)));
    }
    /**
     * Returns the parsed tabindex from the element attributes instead of returning the
     * evaluated tabindex from the browsers defaults.
     */
    function getTabIndexValue(element) {
        if (!hasValidTabIndex(element)) {
            return null;
        }
        // See browser issue in Gecko https://bugzilla.mozilla.org/show_bug.cgi?id=1128054
        var tabIndex = parseInt(element.getAttribute('tabindex') || '', 10);
        return isNaN(tabIndex) ? -1 : tabIndex;
    }
    /** Checks whether the specified element is potentially tabbable on iOS */
    function isPotentiallyTabbableIOS(element) {
        var nodeName = element.nodeName.toLowerCase();
        var inputType = nodeName === 'input' && element.type;
        return inputType === 'text'
            || inputType === 'password'
            || nodeName === 'select'
            || nodeName === 'textarea';
    }
    /**
     * Gets whether an element is potentially focusable without taking current visible/disabled state
     * into account.
     */
    function isPotentiallyFocusable(element) {
        // Inputs are potentially focusable *unless* they're type="hidden".
        if (isHiddenInput(element)) {
            return false;
        }
        return isNativeFormElement(element) ||
            isAnchorWithHref(element) ||
            element.hasAttribute('contenteditable') ||
            hasValidTabIndex(element);
    }
    /** Gets the parent window of a DOM node with regards of being inside of an iframe. */
    function getWindow(node) {
        // ownerDocument is null if `node` itself *is* a document.
        return node.ownerDocument && node.ownerDocument.defaultView || window;
    }

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Class that allows for trapping focus within a DOM element.
     *
     * This class currently uses a relatively simple approach to focus trapping.
     * It assumes that the tab order is the same as DOM order, which is not necessarily true.
     * Things like `tabIndex > 0`, flex `order`, and shadow roots can cause to two to misalign.
     */
    var FocusTrap = /** @class */ (function () {
        function FocusTrap(_element, _checker, _ngZone, _document, deferAnchors) {
            var _this = this;
            if (deferAnchors === void 0) { deferAnchors = false; }
            this._element = _element;
            this._checker = _checker;
            this._ngZone = _ngZone;
            this._document = _document;
            this._hasAttached = false;
            // Event listeners for the anchors. Need to be regular functions so that we can unbind them later.
            this.startAnchorListener = function () { return _this.focusLastTabbableElement(); };
            this.endAnchorListener = function () { return _this.focusFirstTabbableElement(); };
            this._enabled = true;
            if (!deferAnchors) {
                this.attachAnchors();
            }
        }
        Object.defineProperty(FocusTrap.prototype, "enabled", {
            /** Whether the focus trap is active. */
            get: function () { return this._enabled; },
            set: function (value) {
                this._enabled = value;
                if (this._startAnchor && this._endAnchor) {
                    this._toggleAnchorTabIndex(value, this._startAnchor);
                    this._toggleAnchorTabIndex(value, this._endAnchor);
                }
            },
            enumerable: true,
            configurable: true
        });
        /** Destroys the focus trap by cleaning up the anchors. */
        FocusTrap.prototype.destroy = function () {
            var startAnchor = this._startAnchor;
            var endAnchor = this._endAnchor;
            if (startAnchor) {
                startAnchor.removeEventListener('focus', this.startAnchorListener);
                if (startAnchor.parentNode) {
                    startAnchor.parentNode.removeChild(startAnchor);
                }
            }
            if (endAnchor) {
                endAnchor.removeEventListener('focus', this.endAnchorListener);
                if (endAnchor.parentNode) {
                    endAnchor.parentNode.removeChild(endAnchor);
                }
            }
            this._startAnchor = this._endAnchor = null;
        };
        /**
         * Inserts the anchors into the DOM. This is usually done automatically
         * in the constructor, but can be deferred for cases like directives with `*ngIf`.
         * @returns Whether the focus trap managed to attach successfuly. This may not be the case
         * if the target element isn't currently in the DOM.
         */
        FocusTrap.prototype.attachAnchors = function () {
            var _this = this;
            // If we're not on the browser, there can be no focus to trap.
            if (this._hasAttached) {
                return true;
            }
            this._ngZone.runOutsideAngular(function () {
                if (!_this._startAnchor) {
                    _this._startAnchor = _this._createAnchor();
                    _this._startAnchor.addEventListener('focus', _this.startAnchorListener);
                }
                if (!_this._endAnchor) {
                    _this._endAnchor = _this._createAnchor();
                    _this._endAnchor.addEventListener('focus', _this.endAnchorListener);
                }
            });
            if (this._element.parentNode) {
                this._element.parentNode.insertBefore(this._startAnchor, this._element);
                this._element.parentNode.insertBefore(this._endAnchor, this._element.nextSibling);
                this._hasAttached = true;
            }
            return this._hasAttached;
        };
        /**
         * Waits for the zone to stabilize, then either focuses the first element that the
         * user specified, or the first tabbable element.
         * @returns Returns a promise that resolves with a boolean, depending
         * on whether focus was moved successfuly.
         */
        FocusTrap.prototype.focusInitialElementWhenReady = function () {
            var _this = this;
            return new Promise(function (resolve) {
                _this._executeOnStable(function () { return resolve(_this.focusInitialElement()); });
            });
        };
        /**
         * Waits for the zone to stabilize, then focuses
         * the first tabbable element within the focus trap region.
         * @returns Returns a promise that resolves with a boolean, depending
         * on whether focus was moved successfuly.
         */
        FocusTrap.prototype.focusFirstTabbableElementWhenReady = function () {
            var _this = this;
            return new Promise(function (resolve) {
                _this._executeOnStable(function () { return resolve(_this.focusFirstTabbableElement()); });
            });
        };
        /**
         * Waits for the zone to stabilize, then focuses
         * the last tabbable element within the focus trap region.
         * @returns Returns a promise that resolves with a boolean, depending
         * on whether focus was moved successfuly.
         */
        FocusTrap.prototype.focusLastTabbableElementWhenReady = function () {
            var _this = this;
            return new Promise(function (resolve) {
                _this._executeOnStable(function () { return resolve(_this.focusLastTabbableElement()); });
            });
        };
        /**
         * Get the specified boundary element of the trapped region.
         * @param bound The boundary to get (start or end of trapped region).
         * @returns The boundary element.
         */
        FocusTrap.prototype._getRegionBoundary = function (bound) {
            // Contains the deprecated version of selector, for temporary backwards comparability.
            var markers = this._element.querySelectorAll("[cdk-focus-region-" + bound + "], " +
                ("[cdkFocusRegion" + bound + "], ") +
                ("[cdk-focus-" + bound + "]"));
            for (var i = 0; i < markers.length; i++) {
                // @breaking-change 8.0.0
                if (markers[i].hasAttribute("cdk-focus-" + bound)) {
                    console.warn("Found use of deprecated attribute 'cdk-focus-" + bound + "', " +
                        ("use 'cdkFocusRegion" + bound + "' instead. The deprecated ") +
                        "attribute will be removed in 8.0.0.", markers[i]);
                }
                else if (markers[i].hasAttribute("cdk-focus-region-" + bound)) {
                    console.warn("Found use of deprecated attribute 'cdk-focus-region-" + bound + "', " +
                        ("use 'cdkFocusRegion" + bound + "' instead. The deprecated attribute ") +
                        "will be removed in 8.0.0.", markers[i]);
                }
            }
            if (bound == 'start') {
                return markers.length ? markers[0] : this._getFirstTabbableElement(this._element);
            }
            return markers.length ?
                markers[markers.length - 1] : this._getLastTabbableElement(this._element);
        };
        /**
         * Focuses the element that should be focused when the focus trap is initialized.
         * @returns Whether focus was moved successfuly.
         */
        FocusTrap.prototype.focusInitialElement = function () {
            // Contains the deprecated version of selector, for temporary backwards comparability.
            var redirectToElement = this._element.querySelector("[cdk-focus-initial], " +
                "[cdkFocusInitial]");
            if (redirectToElement) {
                // @breaking-change 8.0.0
                if (redirectToElement.hasAttribute("cdk-focus-initial")) {
                    console.warn("Found use of deprecated attribute 'cdk-focus-initial', " +
                        "use 'cdkFocusInitial' instead. The deprecated attribute " +
                        "will be removed in 8.0.0", redirectToElement);
                }
                // Warn the consumer if the element they've pointed to
                // isn't focusable, when not in production mode.
                if (i0.isDevMode() && !this._checker.isFocusable(redirectToElement)) {
                    console.warn("Element matching '[cdkFocusInitial]' is not focusable.", redirectToElement);
                }
                redirectToElement.focus();
                return true;
            }
            return this.focusFirstTabbableElement();
        };
        /**
         * Focuses the first tabbable element within the focus trap region.
         * @returns Whether focus was moved successfuly.
         */
        FocusTrap.prototype.focusFirstTabbableElement = function () {
            var redirectToElement = this._getRegionBoundary('start');
            if (redirectToElement) {
                redirectToElement.focus();
            }
            return !!redirectToElement;
        };
        /**
         * Focuses the last tabbable element within the focus trap region.
         * @returns Whether focus was moved successfuly.
         */
        FocusTrap.prototype.focusLastTabbableElement = function () {
            var redirectToElement = this._getRegionBoundary('end');
            if (redirectToElement) {
                redirectToElement.focus();
            }
            return !!redirectToElement;
        };
        /**
         * Checks whether the focus trap has successfuly been attached.
         */
        FocusTrap.prototype.hasAttached = function () {
            return this._hasAttached;
        };
        /** Get the first tabbable element from a DOM subtree (inclusive). */
        FocusTrap.prototype._getFirstTabbableElement = function (root) {
            if (this._checker.isFocusable(root) && this._checker.isTabbable(root)) {
                return root;
            }
            // Iterate in DOM order. Note that IE doesn't have `children` for SVG so we fall
            // back to `childNodes` which includes text nodes, comments etc.
            var children = root.children || root.childNodes;
            for (var i = 0; i < children.length; i++) {
                var tabbableChild = children[i].nodeType === this._document.ELEMENT_NODE ?
                    this._getFirstTabbableElement(children[i]) :
                    null;
                if (tabbableChild) {
                    return tabbableChild;
                }
            }
            return null;
        };
        /** Get the last tabbable element from a DOM subtree (inclusive). */
        FocusTrap.prototype._getLastTabbableElement = function (root) {
            if (this._checker.isFocusable(root) && this._checker.isTabbable(root)) {
                return root;
            }
            // Iterate in reverse DOM order.
            var children = root.children || root.childNodes;
            for (var i = children.length - 1; i >= 0; i--) {
                var tabbableChild = children[i].nodeType === this._document.ELEMENT_NODE ?
                    this._getLastTabbableElement(children[i]) :
                    null;
                if (tabbableChild) {
                    return tabbableChild;
                }
            }
            return null;
        };
        /** Creates an anchor element. */
        FocusTrap.prototype._createAnchor = function () {
            var anchor = this._document.createElement('div');
            this._toggleAnchorTabIndex(this._enabled, anchor);
            anchor.classList.add('cdk-visually-hidden');
            anchor.classList.add('cdk-focus-trap-anchor');
            anchor.setAttribute('aria-hidden', 'true');
            return anchor;
        };
        /**
         * Toggles the `tabindex` of an anchor, based on the enabled state of the focus trap.
         * @param isEnabled Whether the focus trap is enabled.
         * @param anchor Anchor on which to toggle the tabindex.
         */
        FocusTrap.prototype._toggleAnchorTabIndex = function (isEnabled, anchor) {
            // Remove the tabindex completely, rather than setting it to -1, because if the
            // element has a tabindex, the user might still hit it when navigating with the arrow keys.
            isEnabled ? anchor.setAttribute('tabindex', '0') : anchor.removeAttribute('tabindex');
        };
        /** Executes a function when the zone is stable. */
        FocusTrap.prototype._executeOnStable = function (fn) {
            if (this._ngZone.isStable) {
                fn();
            }
            else {
                this._ngZone.onStable.asObservable().pipe(operators.take(1)).subscribe(fn);
            }
        };
        return FocusTrap;
    }());
    /** Factory that allows easy instantiation of focus traps. */
    var FocusTrapFactory = /** @class */ (function () {
        function FocusTrapFactory(_checker, _ngZone, _document) {
            this._checker = _checker;
            this._ngZone = _ngZone;
            this._document = _document;
        }
        /**
         * Creates a focus-trapped region around the given element.
         * @param element The element around which focus will be trapped.
         * @param deferCaptureElements Defers the creation of focus-capturing elements to be done
         *     manually by the user.
         * @returns The created focus trap instance.
         */
        FocusTrapFactory.prototype.create = function (element, deferCaptureElements) {
            if (deferCaptureElements === void 0) { deferCaptureElements = false; }
            return new FocusTrap(element, this._checker, this._ngZone, this._document, deferCaptureElements);
        };
        FocusTrapFactory.decorators = [
            { type: i0.Injectable, args: [{ providedIn: 'root' },] }
        ];
        /** @nocollapse */
        FocusTrapFactory.ctorParameters = function () { return [
            { type: InteractivityChecker },
            { type: i0.NgZone },
            { type: undefined, decorators: [{ type: i0.Inject, args: [i2.DOCUMENT,] }] }
        ]; };
        FocusTrapFactory.ɵprov = i0.ɵɵdefineInjectable({ factory: function FocusTrapFactory_Factory() { return new FocusTrapFactory(i0.ɵɵinject(InteractivityChecker), i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i2.DOCUMENT)); }, token: FocusTrapFactory, providedIn: "root" });
        return FocusTrapFactory;
    }());
    /** Directive for trapping focus within a region. */
    var CdkTrapFocus = /** @class */ (function () {
        function CdkTrapFocus(_elementRef, _focusTrapFactory, _document) {
            this._elementRef = _elementRef;
            this._focusTrapFactory = _focusTrapFactory;
            /** Previously focused element to restore focus to upon destroy when using autoCapture. */
            this._previouslyFocusedElement = null;
            this._document = _document;
            this.focusTrap = this._focusTrapFactory.create(this._elementRef.nativeElement, true);
        }
        Object.defineProperty(CdkTrapFocus.prototype, "enabled", {
            /** Whether the focus trap is active. */
            get: function () { return this.focusTrap.enabled; },
            set: function (value) { this.focusTrap.enabled = coercion.coerceBooleanProperty(value); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CdkTrapFocus.prototype, "autoCapture", {
            /**
             * Whether the directive should automatially move focus into the trapped region upon
             * initialization and return focus to the previous activeElement upon destruction.
             */
            get: function () { return this._autoCapture; },
            set: function (value) { this._autoCapture = coercion.coerceBooleanProperty(value); },
            enumerable: true,
            configurable: true
        });
        CdkTrapFocus.prototype.ngOnDestroy = function () {
            this.focusTrap.destroy();
            // If we stored a previously focused element when using autoCapture, return focus to that
            // element now that the trapped region is being destroyed.
            if (this._previouslyFocusedElement) {
                this._previouslyFocusedElement.focus();
                this._previouslyFocusedElement = null;
            }
        };
        CdkTrapFocus.prototype.ngAfterContentInit = function () {
            this.focusTrap.attachAnchors();
            if (this.autoCapture) {
                this._previouslyFocusedElement = this._document.activeElement;
                this.focusTrap.focusInitialElementWhenReady();
            }
        };
        CdkTrapFocus.prototype.ngDoCheck = function () {
            if (!this.focusTrap.hasAttached()) {
                this.focusTrap.attachAnchors();
            }
        };
        CdkTrapFocus.decorators = [
            { type: i0.Directive, args: [{
                        selector: '[cdkTrapFocus]',
                        exportAs: 'cdkTrapFocus',
                    },] }
        ];
        /** @nocollapse */
        CdkTrapFocus.ctorParameters = function () { return [
            { type: i0.ElementRef },
            { type: FocusTrapFactory },
            { type: undefined, decorators: [{ type: i0.Inject, args: [i2.DOCUMENT,] }] }
        ]; };
        CdkTrapFocus.propDecorators = {
            enabled: [{ type: i0.Input, args: ['cdkTrapFocus',] }],
            autoCapture: [{ type: i0.Input, args: ['cdkTrapFocusAutoCapture',] }]
        };
        return CdkTrapFocus;
    }());

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var LIVE_ANNOUNCER_ELEMENT_TOKEN = new i0.InjectionToken('liveAnnouncerElement', {
        providedIn: 'root',
        factory: LIVE_ANNOUNCER_ELEMENT_TOKEN_FACTORY,
    });
    /** @docs-private */
    function LIVE_ANNOUNCER_ELEMENT_TOKEN_FACTORY() {
        return null;
    }
    /** Injection token that can be used to configure the default options for the LiveAnnouncer. */
    var LIVE_ANNOUNCER_DEFAULT_OPTIONS = new i0.InjectionToken('LIVE_ANNOUNCER_DEFAULT_OPTIONS');

    var LiveAnnouncer = /** @class */ (function () {
        function LiveAnnouncer(elementToken, _ngZone, _document, _defaultOptions) {
            this._ngZone = _ngZone;
            this._defaultOptions = _defaultOptions;
            // We inject the live element and document as `any` because the constructor signature cannot
            // reference browser globals (HTMLElement, Document) on non-browser environments, since having
            // a class decorator causes TypeScript to preserve the constructor signature types.
            this._document = _document;
            this._liveElement = elementToken || this._createLiveElement();
        }
        LiveAnnouncer.prototype.announce = function (message) {
            var _a;
            var _this = this;
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var defaultOptions = this._defaultOptions;
            var politeness;
            var duration;
            if (args.length === 1 && typeof args[0] === 'number') {
                duration = args[0];
            }
            else {
                _a = tslib.__read(args, 2), politeness = _a[0], duration = _a[1];
            }
            this.clear();
            clearTimeout(this._previousTimeout);
            if (!politeness) {
                politeness =
                    (defaultOptions && defaultOptions.politeness) ? defaultOptions.politeness : 'polite';
            }
            if (duration == null && defaultOptions) {
                duration = defaultOptions.duration;
            }
            // TODO: ensure changing the politeness works on all environments we support.
            this._liveElement.setAttribute('aria-live', politeness);
            // This 100ms timeout is necessary for some browser + screen-reader combinations:
            // - Both JAWS and NVDA over IE11 will not announce anything without a non-zero timeout.
            // - With Chrome and IE11 with NVDA or JAWS, a repeated (identical) message won't be read a
            //   second time without clearing and then using a non-zero delay.
            // (using JAWS 17 at time of this writing).
            return this._ngZone.runOutsideAngular(function () {
                return new Promise(function (resolve) {
                    clearTimeout(_this._previousTimeout);
                    _this._previousTimeout = setTimeout(function () {
                        _this._liveElement.textContent = message;
                        resolve();
                        if (typeof duration === 'number') {
                            _this._previousTimeout = setTimeout(function () { return _this.clear(); }, duration);
                        }
                    }, 100);
                });
            });
        };
        /**
         * Clears the current text from the announcer element. Can be used to prevent
         * screen readers from reading the text out again while the user is going
         * through the page landmarks.
         */
        LiveAnnouncer.prototype.clear = function () {
            if (this._liveElement) {
                this._liveElement.textContent = '';
            }
        };
        LiveAnnouncer.prototype.ngOnDestroy = function () {
            clearTimeout(this._previousTimeout);
            if (this._liveElement && this._liveElement.parentNode) {
                this._liveElement.parentNode.removeChild(this._liveElement);
                this._liveElement = null;
            }
        };
        LiveAnnouncer.prototype._createLiveElement = function () {
            var elementClass = 'cdk-live-announcer-element';
            var previousElements = this._document.getElementsByClassName(elementClass);
            var liveEl = this._document.createElement('div');
            // Remove any old containers. This can happen when coming in from a server-side-rendered page.
            for (var i = 0; i < previousElements.length; i++) {
                previousElements[i].parentNode.removeChild(previousElements[i]);
            }
            liveEl.classList.add(elementClass);
            liveEl.classList.add('cdk-visually-hidden');
            liveEl.setAttribute('aria-atomic', 'true');
            liveEl.setAttribute('aria-live', 'polite');
            this._document.body.appendChild(liveEl);
            return liveEl;
        };
        LiveAnnouncer.decorators = [
            { type: i0.Injectable, args: [{ providedIn: 'root' },] }
        ];
        /** @nocollapse */
        LiveAnnouncer.ctorParameters = function () { return [
            { type: undefined, decorators: [{ type: i0.Optional }, { type: i0.Inject, args: [LIVE_ANNOUNCER_ELEMENT_TOKEN,] }] },
            { type: i0.NgZone },
            { type: undefined, decorators: [{ type: i0.Inject, args: [i2.DOCUMENT,] }] },
            { type: undefined, decorators: [{ type: i0.Optional }, { type: i0.Inject, args: [LIVE_ANNOUNCER_DEFAULT_OPTIONS,] }] }
        ]; };
        LiveAnnouncer.ɵprov = i0.ɵɵdefineInjectable({ factory: function LiveAnnouncer_Factory() { return new LiveAnnouncer(i0.ɵɵinject(LIVE_ANNOUNCER_ELEMENT_TOKEN, 8), i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i2.DOCUMENT), i0.ɵɵinject(LIVE_ANNOUNCER_DEFAULT_OPTIONS, 8)); }, token: LiveAnnouncer, providedIn: "root" });
        return LiveAnnouncer;
    }());
    /**
     * A directive that works similarly to aria-live, but uses the LiveAnnouncer to ensure compatibility
     * with a wider range of browsers and screen readers.
     */
    var CdkAriaLive = /** @class */ (function () {
        function CdkAriaLive(_elementRef, _liveAnnouncer, _contentObserver, _ngZone) {
            this._elementRef = _elementRef;
            this._liveAnnouncer = _liveAnnouncer;
            this._contentObserver = _contentObserver;
            this._ngZone = _ngZone;
            this._politeness = 'off';
        }
        Object.defineProperty(CdkAriaLive.prototype, "politeness", {
            /** The aria-live politeness level to use when announcing messages. */
            get: function () { return this._politeness; },
            set: function (value) {
                var _this = this;
                this._politeness = value === 'polite' || value === 'assertive' ? value : 'off';
                if (this._politeness === 'off') {
                    if (this._subscription) {
                        this._subscription.unsubscribe();
                        this._subscription = null;
                    }
                }
                else if (!this._subscription) {
                    this._subscription = this._ngZone.runOutsideAngular(function () {
                        return _this._contentObserver
                            .observe(_this._elementRef)
                            .subscribe(function () {
                            // Note that we use textContent here, rather than innerText, in order to avoid a reflow.
                            var elementText = _this._elementRef.nativeElement.textContent;
                            // The `MutationObserver` fires also for attribute
                            // changes which we don't want to announce.
                            if (elementText !== _this._previousAnnouncedText) {
                                _this._liveAnnouncer.announce(elementText, _this._politeness);
                                _this._previousAnnouncedText = elementText;
                            }
                        });
                    });
                }
            },
            enumerable: true,
            configurable: true
        });
        CdkAriaLive.prototype.ngOnDestroy = function () {
            if (this._subscription) {
                this._subscription.unsubscribe();
            }
        };
        CdkAriaLive.decorators = [
            { type: i0.Directive, args: [{
                        selector: '[cdkAriaLive]',
                        exportAs: 'cdkAriaLive',
                    },] }
        ];
        /** @nocollapse */
        CdkAriaLive.ctorParameters = function () { return [
            { type: i0.ElementRef },
            { type: LiveAnnouncer },
            { type: observers.ContentObserver },
            { type: i0.NgZone }
        ]; };
        CdkAriaLive.propDecorators = {
            politeness: [{ type: i0.Input, args: ['cdkAriaLive',] }]
        };
        return CdkAriaLive;
    }());

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    // This is the value used by AngularJS Material. Through trial and error (on iPhone 6S) they found
    // that a value of around 650ms seems appropriate.
    var TOUCH_BUFFER_MS = 650;
    /**
     * Event listener options that enable capturing and also
     * mark the listener as passive if the browser supports it.
     */
    var captureEventListenerOptions = i1.normalizePassiveListenerOptions({
        passive: true,
        capture: true
    });
    /** Monitors mouse and keyboard events to determine the cause of focus events. */
    var FocusMonitor = /** @class */ (function () {
        function FocusMonitor(_ngZone, _platform) {
            var _this = this;
            this._ngZone = _ngZone;
            this._platform = _platform;
            /** The focus origin that the next focus event is a result of. */
            this._origin = null;
            /** Whether the window has just been focused. */
            this._windowFocused = false;
            /** Map of elements being monitored to their info. */
            this._elementInfo = new Map();
            /** The number of elements currently being monitored. */
            this._monitoredElementCount = 0;
            /**
             * Event listener for `keydown` events on the document.
             * Needs to be an arrow function in order to preserve the context when it gets bound.
             */
            this._documentKeydownListener = function () {
                // On keydown record the origin and clear any touch event that may be in progress.
                _this._lastTouchTarget = null;
                _this._setOriginForCurrentEventQueue('keyboard');
            };
            /**
             * Event listener for `mousedown` events on the document.
             * Needs to be an arrow function in order to preserve the context when it gets bound.
             */
            this._documentMousedownListener = function () {
                // On mousedown record the origin only if there is not touch
                // target, since a mousedown can happen as a result of a touch event.
                if (!_this._lastTouchTarget) {
                    _this._setOriginForCurrentEventQueue('mouse');
                }
            };
            /**
             * Event listener for `touchstart` events on the document.
             * Needs to be an arrow function in order to preserve the context when it gets bound.
             */
            this._documentTouchstartListener = function (event) {
                // When the touchstart event fires the focus event is not yet in the event queue. This means
                // we can't rely on the trick used above (setting timeout of 1ms). Instead we wait 650ms to
                // see if a focus happens.
                if (_this._touchTimeoutId != null) {
                    clearTimeout(_this._touchTimeoutId);
                }
                // Since this listener is bound on the `document` level, any events coming from the shadow DOM
                // will have their `target` set to the shadow root. If available, use `composedPath` to
                // figure out the event target.
                _this._lastTouchTarget = event.composedPath ? event.composedPath()[0] : event.target;
                _this._touchTimeoutId = setTimeout(function () { return _this._lastTouchTarget = null; }, TOUCH_BUFFER_MS);
            };
            /**
             * Event listener for `focus` events on the window.
             * Needs to be an arrow function in order to preserve the context when it gets bound.
             */
            this._windowFocusListener = function () {
                // Make a note of when the window regains focus, so we can
                // restore the origin info for the focused element.
                _this._windowFocused = true;
                _this._windowFocusTimeoutId = setTimeout(function () { return _this._windowFocused = false; });
            };
        }
        FocusMonitor.prototype.monitor = function (element, checkChildren) {
            var _this = this;
            if (checkChildren === void 0) { checkChildren = false; }
            // Do nothing if we're not on the browser platform.
            if (!this._platform.isBrowser) {
                return rxjs.of(null);
            }
            var nativeElement = coercion.coerceElement(element);
            // Check if we're already monitoring this element.
            if (this._elementInfo.has(nativeElement)) {
                var cachedInfo = this._elementInfo.get(nativeElement);
                cachedInfo.checkChildren = checkChildren;
                return cachedInfo.subject.asObservable();
            }
            // Create monitored element info.
            var info = {
                unlisten: function () { },
                checkChildren: checkChildren,
                subject: new rxjs.Subject()
            };
            this._elementInfo.set(nativeElement, info);
            this._incrementMonitoredElementCount();
            // Start listening. We need to listen in capture phase since focus events don't bubble.
            var focusListener = function (event) { return _this._onFocus(event, nativeElement); };
            var blurListener = function (event) { return _this._onBlur(event, nativeElement); };
            this._ngZone.runOutsideAngular(function () {
                nativeElement.addEventListener('focus', focusListener, true);
                nativeElement.addEventListener('blur', blurListener, true);
            });
            // Create an unlisten function for later.
            info.unlisten = function () {
                nativeElement.removeEventListener('focus', focusListener, true);
                nativeElement.removeEventListener('blur', blurListener, true);
            };
            return info.subject.asObservable();
        };
        FocusMonitor.prototype.stopMonitoring = function (element) {
            var nativeElement = coercion.coerceElement(element);
            var elementInfo = this._elementInfo.get(nativeElement);
            if (elementInfo) {
                elementInfo.unlisten();
                elementInfo.subject.complete();
                this._setClasses(nativeElement);
                this._elementInfo.delete(nativeElement);
                this._decrementMonitoredElementCount();
            }
        };
        FocusMonitor.prototype.focusVia = function (element, origin, options) {
            var nativeElement = coercion.coerceElement(element);
            this._setOriginForCurrentEventQueue(origin);
            // `focus` isn't available on the server
            if (typeof nativeElement.focus === 'function') {
                // Cast the element to `any`, because the TS typings don't have the `options` parameter yet.
                nativeElement.focus(options);
            }
        };
        FocusMonitor.prototype.ngOnDestroy = function () {
            var _this = this;
            this._elementInfo.forEach(function (_info, element) { return _this.stopMonitoring(element); });
        };
        FocusMonitor.prototype._toggleClass = function (element, className, shouldSet) {
            if (shouldSet) {
                element.classList.add(className);
            }
            else {
                element.classList.remove(className);
            }
        };
        /**
         * Sets the focus classes on the element based on the given focus origin.
         * @param element The element to update the classes on.
         * @param origin The focus origin.
         */
        FocusMonitor.prototype._setClasses = function (element, origin) {
            var elementInfo = this._elementInfo.get(element);
            if (elementInfo) {
                this._toggleClass(element, 'cdk-focused', !!origin);
                this._toggleClass(element, 'cdk-touch-focused', origin === 'touch');
                this._toggleClass(element, 'cdk-keyboard-focused', origin === 'keyboard');
                this._toggleClass(element, 'cdk-mouse-focused', origin === 'mouse');
                this._toggleClass(element, 'cdk-program-focused', origin === 'program');
            }
        };
        /**
         * Sets the origin and schedules an async function to clear it at the end of the event queue.
         * @param origin The origin to set.
         */
        FocusMonitor.prototype._setOriginForCurrentEventQueue = function (origin) {
            var _this = this;
            this._ngZone.runOutsideAngular(function () {
                _this._origin = origin;
                // Sometimes the focus origin won't be valid in Firefox because Firefox seems to focus *one*
                // tick after the interaction event fired. To ensure the focus origin is always correct,
                // the focus origin will be determined at the beginning of the next tick.
                _this._originTimeoutId = setTimeout(function () { return _this._origin = null; }, 1);
            });
        };
        /**
         * Checks whether the given focus event was caused by a touchstart event.
         * @param event The focus event to check.
         * @returns Whether the event was caused by a touch.
         */
        FocusMonitor.prototype._wasCausedByTouch = function (event) {
            // Note(mmalerba): This implementation is not quite perfect, there is a small edge case.
            // Consider the following dom structure:
            //
            // <div #parent tabindex="0" cdkFocusClasses>
            //   <div #child (click)="#parent.focus()"></div>
            // </div>
            //
            // If the user touches the #child element and the #parent is programmatically focused as a
            // result, this code will still consider it to have been caused by the touch event and will
            // apply the cdk-touch-focused class rather than the cdk-program-focused class. This is a
            // relatively small edge-case that can be worked around by using
            // focusVia(parentEl, 'program') to focus the parent element.
            //
            // If we decide that we absolutely must handle this case correctly, we can do so by listening
            // for the first focus event after the touchstart, and then the first blur event after that
            // focus event. When that blur event fires we know that whatever follows is not a result of the
            // touchstart.
            var focusTarget = event.target;
            return this._lastTouchTarget instanceof Node && focusTarget instanceof Node &&
                (focusTarget === this._lastTouchTarget || focusTarget.contains(this._lastTouchTarget));
        };
        /**
         * Handles focus events on a registered element.
         * @param event The focus event.
         * @param element The monitored element.
         */
        FocusMonitor.prototype._onFocus = function (event, element) {
            // NOTE(mmalerba): We currently set the classes based on the focus origin of the most recent
            // focus event affecting the monitored element. If we want to use the origin of the first event
            // instead we should check for the cdk-focused class here and return if the element already has
            // it. (This only matters for elements that have includesChildren = true).
            // If we are not counting child-element-focus as focused, make sure that the event target is the
            // monitored element itself.
            var elementInfo = this._elementInfo.get(element);
            if (!elementInfo || (!elementInfo.checkChildren && element !== event.target)) {
                return;
            }
            // If we couldn't detect a cause for the focus event, it's due to one of three reasons:
            // 1) The window has just regained focus, in which case we want to restore the focused state of
            //    the element from before the window blurred.
            // 2) It was caused by a touch event, in which case we mark the origin as 'touch'.
            // 3) The element was programmatically focused, in which case we should mark the origin as
            //    'program'.
            var origin = this._origin;
            if (!origin) {
                if (this._windowFocused && this._lastFocusOrigin) {
                    origin = this._lastFocusOrigin;
                }
                else if (this._wasCausedByTouch(event)) {
                    origin = 'touch';
                }
                else {
                    origin = 'program';
                }
            }
            this._setClasses(element, origin);
            this._emitOrigin(elementInfo.subject, origin);
            this._lastFocusOrigin = origin;
        };
        /**
         * Handles blur events on a registered element.
         * @param event The blur event.
         * @param element The monitored element.
         */
        FocusMonitor.prototype._onBlur = function (event, element) {
            // If we are counting child-element-focus as focused, make sure that we aren't just blurring in
            // order to focus another child of the monitored element.
            var elementInfo = this._elementInfo.get(element);
            if (!elementInfo || (elementInfo.checkChildren && event.relatedTarget instanceof Node &&
                element.contains(event.relatedTarget))) {
                return;
            }
            this._setClasses(element);
            this._emitOrigin(elementInfo.subject, null);
        };
        FocusMonitor.prototype._emitOrigin = function (subject, origin) {
            this._ngZone.run(function () { return subject.next(origin); });
        };
        FocusMonitor.prototype._incrementMonitoredElementCount = function () {
            var _this = this;
            // Register global listeners when first element is monitored.
            if (++this._monitoredElementCount == 1 && this._platform.isBrowser) {
                // Note: we listen to events in the capture phase so we
                // can detect them even if the user stops propagation.
                this._ngZone.runOutsideAngular(function () {
                    document.addEventListener('keydown', _this._documentKeydownListener, captureEventListenerOptions);
                    document.addEventListener('mousedown', _this._documentMousedownListener, captureEventListenerOptions);
                    document.addEventListener('touchstart', _this._documentTouchstartListener, captureEventListenerOptions);
                    window.addEventListener('focus', _this._windowFocusListener);
                });
            }
        };
        FocusMonitor.prototype._decrementMonitoredElementCount = function () {
            // Unregister global listeners when last element is unmonitored.
            if (!--this._monitoredElementCount) {
                document.removeEventListener('keydown', this._documentKeydownListener, captureEventListenerOptions);
                document.removeEventListener('mousedown', this._documentMousedownListener, captureEventListenerOptions);
                document.removeEventListener('touchstart', this._documentTouchstartListener, captureEventListenerOptions);
                window.removeEventListener('focus', this._windowFocusListener);
                // Clear timeouts for all potentially pending timeouts to prevent the leaks.
                clearTimeout(this._windowFocusTimeoutId);
                clearTimeout(this._touchTimeoutId);
                clearTimeout(this._originTimeoutId);
            }
        };
        FocusMonitor.decorators = [
            { type: i0.Injectable, args: [{ providedIn: 'root' },] }
        ];
        /** @nocollapse */
        FocusMonitor.ctorParameters = function () { return [
            { type: i0.NgZone },
            { type: i1.Platform }
        ]; };
        FocusMonitor.ɵprov = i0.ɵɵdefineInjectable({ factory: function FocusMonitor_Factory() { return new FocusMonitor(i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i1.Platform)); }, token: FocusMonitor, providedIn: "root" });
        return FocusMonitor;
    }());
    /**
     * Directive that determines how a particular element was focused (via keyboard, mouse, touch, or
     * programmatically) and adds corresponding classes to the element.
     *
     * There are two variants of this directive:
     * 1) cdkMonitorElementFocus: does not consider an element to be focused if one of its children is
     *    focused.
     * 2) cdkMonitorSubtreeFocus: considers an element focused if it or any of its children are focused.
     */
    var CdkMonitorFocus = /** @class */ (function () {
        function CdkMonitorFocus(_elementRef, _focusMonitor) {
            var _this = this;
            this._elementRef = _elementRef;
            this._focusMonitor = _focusMonitor;
            this.cdkFocusChange = new i0.EventEmitter();
            this._monitorSubscription = this._focusMonitor.monitor(this._elementRef, this._elementRef.nativeElement.hasAttribute('cdkMonitorSubtreeFocus'))
                .subscribe(function (origin) { return _this.cdkFocusChange.emit(origin); });
        }
        CdkMonitorFocus.prototype.ngOnDestroy = function () {
            this._focusMonitor.stopMonitoring(this._elementRef);
            this._monitorSubscription.unsubscribe();
        };
        CdkMonitorFocus.decorators = [
            { type: i0.Directive, args: [{
                        selector: '[cdkMonitorElementFocus], [cdkMonitorSubtreeFocus]',
                    },] }
        ];
        /** @nocollapse */
        CdkMonitorFocus.ctorParameters = function () { return [
            { type: i0.ElementRef },
            { type: FocusMonitor }
        ]; };
        CdkMonitorFocus.propDecorators = {
            cdkFocusChange: [{ type: i0.Output }]
        };
        return CdkMonitorFocus;
    }());

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Screenreaders will often fire fake mousedown events when a focusable element
     * is activated using the keyboard. We can typically distinguish between these faked
     * mousedown events and real mousedown events using the "buttons" property. While
     * real mousedowns will indicate the mouse button that was pressed (e.g. "1" for
     * the left mouse button), faked mousedowns will usually set the property value to 0.
     */
    function isFakeMousedownFromScreenReader(event) {
        return event.buttons === 0;
    }

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /** CSS class applied to the document body when in black-on-white high-contrast mode. */
    var BLACK_ON_WHITE_CSS_CLASS = 'cdk-high-contrast-black-on-white';
    /** CSS class applied to the document body when in white-on-black high-contrast mode. */
    var WHITE_ON_BLACK_CSS_CLASS = 'cdk-high-contrast-white-on-black';
    /** CSS class applied to the document body when in high-contrast mode. */
    var HIGH_CONTRAST_MODE_ACTIVE_CSS_CLASS = 'cdk-high-contrast-active';
    /**
     * Service to determine whether the browser is currently in a high-constrast-mode environment.
     *
     * Microsoft Windows supports an accessibility feature called "High Contrast Mode". This mode
     * changes the appearance of all applications, including web applications, to dramatically increase
     * contrast.
     *
     * IE, Edge, and Firefox currently support this mode. Chrome does not support Windows High Contrast
     * Mode. This service does not detect high-contrast mode as added by the Chrome "High Contrast"
     * browser extension.
     */
    var HighContrastModeDetector = /** @class */ (function () {
        function HighContrastModeDetector(_platform, document) {
            this._platform = _platform;
            this._document = document;
        }
        /** Gets the current high-constrast-mode for the page. */
        HighContrastModeDetector.prototype.getHighContrastMode = function () {
            if (!this._platform.isBrowser) {
                return 0 /* NONE */;
            }
            // Create a test element with an arbitrary background-color that is neither black nor
            // white; high-contrast mode will coerce the color to either black or white. Also ensure that
            // appending the test element to the DOM does not affect layout by absolutely positioning it
            var testElement = this._document.createElement('div');
            testElement.style.backgroundColor = 'rgb(1,2,3)';
            testElement.style.position = 'absolute';
            this._document.body.appendChild(testElement);
            // Get the computed style for the background color, collapsing spaces to normalize between
            // browsers. Once we get this color, we no longer need the test element. Access the `window`
            // via the document so we can fake it in tests.
            var documentWindow = this._document.defaultView;
            var computedColor = (documentWindow.getComputedStyle(testElement).backgroundColor || '').replace(/ /g, '');
            this._document.body.removeChild(testElement);
            switch (computedColor) {
                case 'rgb(0,0,0)': return 2 /* WHITE_ON_BLACK */;
                case 'rgb(255,255,255)': return 1 /* BLACK_ON_WHITE */;
            }
            return 0 /* NONE */;
        };
        /** Applies CSS classes indicating high-contrast mode to document body (browser-only). */
        HighContrastModeDetector.prototype._applyBodyHighContrastModeCssClasses = function () {
            if (this._platform.isBrowser && this._document.body) {
                var bodyClasses = this._document.body.classList;
                // IE11 doesn't support `classList` operations with multiple arguments
                bodyClasses.remove(HIGH_CONTRAST_MODE_ACTIVE_CSS_CLASS);
                bodyClasses.remove(BLACK_ON_WHITE_CSS_CLASS);
                bodyClasses.remove(WHITE_ON_BLACK_CSS_CLASS);
                var mode = this.getHighContrastMode();
                if (mode === 1 /* BLACK_ON_WHITE */) {
                    bodyClasses.add(HIGH_CONTRAST_MODE_ACTIVE_CSS_CLASS);
                    bodyClasses.add(BLACK_ON_WHITE_CSS_CLASS);
                }
                else if (mode === 2 /* WHITE_ON_BLACK */) {
                    bodyClasses.add(HIGH_CONTRAST_MODE_ACTIVE_CSS_CLASS);
                    bodyClasses.add(WHITE_ON_BLACK_CSS_CLASS);
                }
            }
        };
        HighContrastModeDetector.decorators = [
            { type: i0.Injectable, args: [{ providedIn: 'root' },] }
        ];
        /** @nocollapse */
        HighContrastModeDetector.ctorParameters = function () { return [
            { type: i1.Platform },
            { type: undefined, decorators: [{ type: i0.Inject, args: [i2.DOCUMENT,] }] }
        ]; };
        HighContrastModeDetector.ɵprov = i0.ɵɵdefineInjectable({ factory: function HighContrastModeDetector_Factory() { return new HighContrastModeDetector(i0.ɵɵinject(i1.Platform), i0.ɵɵinject(i2.DOCUMENT)); }, token: HighContrastModeDetector, providedIn: "root" });
        return HighContrastModeDetector;
    }());

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var A11yModule = /** @class */ (function () {
        function A11yModule(highContrastModeDetector) {
            highContrastModeDetector._applyBodyHighContrastModeCssClasses();
        }
        A11yModule.decorators = [
            { type: i0.NgModule, args: [{
                        imports: [i2.CommonModule, i1.PlatformModule, observers.ObserversModule],
                        declarations: [CdkAriaLive, CdkTrapFocus, CdkMonitorFocus],
                        exports: [CdkAriaLive, CdkTrapFocus, CdkMonitorFocus],
                    },] }
        ];
        /** @nocollapse */
        A11yModule.ctorParameters = function () { return [
            { type: HighContrastModeDetector }
        ]; };
        return A11yModule;
    }());

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */

    /**
     * Generated bundle index. Do not edit.
     */

    exports.A11yModule = A11yModule;
    exports.ActiveDescendantKeyManager = ActiveDescendantKeyManager;
    exports.AriaDescriber = AriaDescriber;
    exports.CDK_DESCRIBEDBY_HOST_ATTRIBUTE = CDK_DESCRIBEDBY_HOST_ATTRIBUTE;
    exports.CDK_DESCRIBEDBY_ID_PREFIX = CDK_DESCRIBEDBY_ID_PREFIX;
    exports.CdkAriaLive = CdkAriaLive;
    exports.CdkMonitorFocus = CdkMonitorFocus;
    exports.CdkTrapFocus = CdkTrapFocus;
    exports.FocusKeyManager = FocusKeyManager;
    exports.FocusMonitor = FocusMonitor;
    exports.FocusTrap = FocusTrap;
    exports.FocusTrapFactory = FocusTrapFactory;
    exports.HighContrastModeDetector = HighContrastModeDetector;
    exports.InteractivityChecker = InteractivityChecker;
    exports.LIVE_ANNOUNCER_DEFAULT_OPTIONS = LIVE_ANNOUNCER_DEFAULT_OPTIONS;
    exports.LIVE_ANNOUNCER_ELEMENT_TOKEN = LIVE_ANNOUNCER_ELEMENT_TOKEN;
    exports.LIVE_ANNOUNCER_ELEMENT_TOKEN_FACTORY = LIVE_ANNOUNCER_ELEMENT_TOKEN_FACTORY;
    exports.ListKeyManager = ListKeyManager;
    exports.LiveAnnouncer = LiveAnnouncer;
    exports.MESSAGES_CONTAINER_ID = MESSAGES_CONTAINER_ID;
    exports.TOUCH_BUFFER_MS = TOUCH_BUFFER_MS;
    exports.isFakeMousedownFromScreenReader = isFakeMousedownFromScreenReader;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=cdk-a11y.umd.js.map
