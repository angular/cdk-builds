/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __awaiter } from "tslib";
import { _getTextWithExcludedElements, TestKey, } from '@angular/cdk/testing';
import { browser, Button, by, Key } from 'protractor';
/** Maps the `TestKey` constants to Protractor's `Key` constants. */
const keyMap = {
    [TestKey.BACKSPACE]: Key.BACK_SPACE,
    [TestKey.TAB]: Key.TAB,
    [TestKey.ENTER]: Key.ENTER,
    [TestKey.SHIFT]: Key.SHIFT,
    [TestKey.CONTROL]: Key.CONTROL,
    [TestKey.ALT]: Key.ALT,
    [TestKey.ESCAPE]: Key.ESCAPE,
    [TestKey.PAGE_UP]: Key.PAGE_UP,
    [TestKey.PAGE_DOWN]: Key.PAGE_DOWN,
    [TestKey.END]: Key.END,
    [TestKey.HOME]: Key.HOME,
    [TestKey.LEFT_ARROW]: Key.ARROW_LEFT,
    [TestKey.UP_ARROW]: Key.ARROW_UP,
    [TestKey.RIGHT_ARROW]: Key.ARROW_RIGHT,
    [TestKey.DOWN_ARROW]: Key.ARROW_DOWN,
    [TestKey.INSERT]: Key.INSERT,
    [TestKey.DELETE]: Key.DELETE,
    [TestKey.F1]: Key.F1,
    [TestKey.F2]: Key.F2,
    [TestKey.F3]: Key.F3,
    [TestKey.F4]: Key.F4,
    [TestKey.F5]: Key.F5,
    [TestKey.F6]: Key.F6,
    [TestKey.F7]: Key.F7,
    [TestKey.F8]: Key.F8,
    [TestKey.F9]: Key.F9,
    [TestKey.F10]: Key.F10,
    [TestKey.F11]: Key.F11,
    [TestKey.F12]: Key.F12,
    [TestKey.META]: Key.META
};
/** Converts a `ModifierKeys` object to a list of Protractor `Key`s. */
function toProtractorModifierKeys(modifiers) {
    const result = [];
    if (modifiers.control) {
        result.push(Key.CONTROL);
    }
    if (modifiers.alt) {
        result.push(Key.ALT);
    }
    if (modifiers.shift) {
        result.push(Key.SHIFT);
    }
    if (modifiers.meta) {
        result.push(Key.META);
    }
    return result;
}
/**
 * A `TestElement` implementation for Protractor.
 * @deprecated
 * @breaking-change 13.0.0
 */
export class ProtractorElement {
    constructor(element) {
        this.element = element;
    }
    /** Blur the element. */
    blur() {
        return __awaiter(this, void 0, void 0, function* () {
            return browser.executeScript('arguments[0].blur()', this.element);
        });
    }
    /** Clear the element's input (for input and textarea elements only). */
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.element.clear();
        });
    }
    click(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._dispatchClickEventSequence(args, Button.LEFT);
        });
    }
    rightClick(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._dispatchClickEventSequence(args, Button.RIGHT);
        });
    }
    /** Focus the element. */
    focus() {
        return __awaiter(this, void 0, void 0, function* () {
            return browser.executeScript('arguments[0].focus()', this.element);
        });
    }
    /** Get the computed value of the given CSS property for the element. */
    getCssValue(property) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.element.getCssValue(property);
        });
    }
    /** Hovers the mouse over the element. */
    hover() {
        return __awaiter(this, void 0, void 0, function* () {
            return browser.actions()
                .mouseMove(yield this.element.getWebElement())
                .perform();
        });
    }
    /** Moves the mouse away from the element. */
    mouseAway() {
        return __awaiter(this, void 0, void 0, function* () {
            return browser.actions()
                .mouseMove(yield this.element.getWebElement(), { x: -1, y: -1 })
                .perform();
        });
    }
    sendKeys(...modifiersAndKeys) {
        return __awaiter(this, void 0, void 0, function* () {
            const first = modifiersAndKeys[0];
            let modifiers;
            let rest;
            if (typeof first !== 'string' && typeof first !== 'number') {
                modifiers = first;
                rest = modifiersAndKeys.slice(1);
            }
            else {
                modifiers = {};
                rest = modifiersAndKeys;
            }
            const modifierKeys = toProtractorModifierKeys(modifiers);
            const keys = rest.map(k => typeof k === 'string' ? k.split('') : [keyMap[k]])
                .reduce((arr, k) => arr.concat(k), [])
                // Key.chord doesn't work well with geckodriver (mozilla/geckodriver#1502),
                // so avoid it if no modifier keys are required.
                .map(k => modifierKeys.length > 0 ? Key.chord(...modifierKeys, k) : k);
            return this.element.sendKeys(...keys);
        });
    }
    /**
     * Gets the text from the element.
     * @param options Options that affect what text is included.
     */
    text(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (options === null || options === void 0 ? void 0 : options.exclude) {
                return browser.executeScript(_getTextWithExcludedElements, this.element, options.exclude);
            }
            // We don't go through Protractor's `getText`, because it excludes text from hidden elements.
            return browser.executeScript(`return (arguments[0].textContent || '').trim()`, this.element);
        });
    }
    /** Gets the value for the given attribute from the element. */
    getAttribute(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return browser.executeScript(`return arguments[0].getAttribute(arguments[1])`, this.element, name);
        });
    }
    /** Checks whether the element has the given class. */
    hasClass(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const classes = (yield this.getAttribute('class')) || '';
            return new Set(classes.split(/\s+/).filter(c => c)).has(name);
        });
    }
    /** Gets the dimensions of the element. */
    getDimensions() {
        return __awaiter(this, void 0, void 0, function* () {
            const { width, height } = yield this.element.getSize();
            const { x: left, y: top } = yield this.element.getLocation();
            return { width, height, left, top };
        });
    }
    /** Gets the value of a property of an element. */
    getProperty(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return browser.executeScript(`return arguments[0][arguments[1]]`, this.element, name);
        });
    }
    /** Sets the value of a property of an input. */
    setInputValue(value) {
        return __awaiter(this, void 0, void 0, function* () {
            return browser.executeScript(`arguments[0].value = arguments[1]`, this.element, value);
        });
    }
    /** Selects the options at the specified indexes inside of a native `select` element. */
    selectOptions(...optionIndexes) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = yield this.element.all(by.css('option'));
            const indexes = new Set(optionIndexes); // Convert to a set to remove duplicates.
            if (options.length && indexes.size) {
                // Reset the value so all the selected states are cleared. We can
                // reuse the input-specific method since the logic is the same.
                yield this.setInputValue('');
                for (let i = 0; i < options.length; i++) {
                    if (indexes.has(i)) {
                        // We have to hold the control key while clicking on options so that multiple can be
                        // selected in multi-selection mode. The key doesn't do anything for single selection.
                        yield browser.actions().keyDown(Key.CONTROL).perform();
                        yield options[i].click();
                        yield browser.actions().keyUp(Key.CONTROL).perform();
                    }
                }
            }
        });
    }
    /** Checks whether this element matches the given selector. */
    matchesSelector(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            return browser.executeScript(`
          return (Element.prototype.matches ||
                  Element.prototype.msMatchesSelector).call(arguments[0], arguments[1])
          `, this.element, selector);
        });
    }
    /** Checks whether the element is focused. */
    isFocused() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.element.equals(browser.driver.switchTo().activeElement());
        });
    }
    /**
     * Dispatches an event with a particular name.
     * @param name Name of the event to be dispatched.
     */
    dispatchEvent(name, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return browser.executeScript(_dispatchEvent, name, this.element, data);
        });
    }
    /** Dispatches all the events that are part of a click event sequence. */
    _dispatchClickEventSequence(args, button) {
        return __awaiter(this, void 0, void 0, function* () {
            let modifiers = {};
            if (args.length && typeof args[args.length - 1] === 'object') {
                modifiers = args.pop();
            }
            const modifierKeys = toProtractorModifierKeys(modifiers);
            // Omitting the offset argument to mouseMove results in clicking the center.
            // This is the default behavior we want, so we use an empty array of offsetArgs if
            // no args remain after popping the modifiers from the args passed to this function.
            const offsetArgs = (args.length === 2 ?
                [{ x: args[0], y: args[1] }] : []);
            let actions = browser.actions()
                .mouseMove(yield this.element.getWebElement(), ...offsetArgs);
            for (const modifierKey of modifierKeys) {
                actions = actions.keyDown(modifierKey);
            }
            actions = actions.click(button);
            for (const modifierKey of modifierKeys) {
                actions = actions.keyUp(modifierKey);
            }
            yield actions.perform();
        });
    }
}
/**
 * Dispatches an event with a particular name and data to an element.
 * Note that this needs to be a pure function, because it gets stringified by
 * Protractor and is executed inside the browser.
 */
function _dispatchEvent(name, element, data) {
    const event = document.createEvent('Event');
    event.initEvent(name);
    if (data) {
        // tslint:disable-next-line:ban Have to use `Object.assign` to preserve the original object.
        Object.assign(event, data);
    }
    // This type has a string index signature, so we cannot access it using a dotted property access.
    element['dispatchEvent'](event);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdHJhY3Rvci1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Byb3RyYWN0b3IvcHJvdHJhY3Rvci1lbGVtZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQ0wsNEJBQTRCLEVBSTVCLE9BQU8sR0FHUixNQUFNLHNCQUFzQixDQUFDO0FBQzlCLE9BQU8sRUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBaUIsR0FBRyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBRW5FLG9FQUFvRTtBQUNwRSxNQUFNLE1BQU0sR0FBRztJQUNiLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVO0lBQ25DLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHO0lBQ3RCLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxLQUFLO0lBQzFCLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxLQUFLO0lBQzFCLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxPQUFPO0lBQzlCLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHO0lBQ3RCLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxNQUFNO0lBQzVCLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxPQUFPO0lBQzlCLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxTQUFTO0lBQ2xDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHO0lBQ3RCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxJQUFJO0lBQ3hCLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVO0lBQ3BDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxRQUFRO0lBQ2hDLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxXQUFXO0lBQ3RDLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVO0lBQ3BDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxNQUFNO0lBQzVCLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxNQUFNO0lBQzVCLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0lBQ3BCLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0lBQ3BCLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0lBQ3BCLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0lBQ3BCLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0lBQ3BCLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0lBQ3BCLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0lBQ3BCLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0lBQ3BCLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0lBQ3BCLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHO0lBQ3RCLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHO0lBQ3RCLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FB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QU8sQ0FBQyxPQUFPLEVBQUU7aUJBQzVCLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLEVBQUUsR0FBRyxVQUFVLENBQUMsQ0FBQztZQUVoRSxLQUFLLE1BQU0sV0FBVyxJQUFJLFlBQVksRUFBRTtnQkFDdEMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7YUFDeEM7WUFDRCxPQUFPLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNoQyxLQUFLLE1BQU0sV0FBVyxJQUFJLFlBQVksRUFBRTtnQkFDdEMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7YUFDdEM7WUFFRCxNQUFNLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMxQixDQUFDO0tBQUE7Q0FDRjtBQUVEOzs7O0dBSUc7QUFDSCxTQUFTLGNBQWMsQ0FBQyxJQUFZLEVBQUUsT0FBc0IsRUFBRSxJQUFnQztJQUM1RixNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzVDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFdEIsSUFBSSxJQUFJLEVBQUU7UUFDUiw0RkFBNEY7UUFDNUYsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDNUI7SUFFRCxpR0FBaUc7SUFDakcsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2xDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgX2dldFRleHRXaXRoRXhjbHVkZWRFbGVtZW50cyxcbiAgRWxlbWVudERpbWVuc2lvbnMsXG4gIE1vZGlmaWVyS2V5cyxcbiAgVGVzdEVsZW1lbnQsXG4gIFRlc3RLZXksXG4gIFRleHRPcHRpb25zLFxuICBFdmVudERhdGEsXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay90ZXN0aW5nJztcbmltcG9ydCB7YnJvd3NlciwgQnV0dG9uLCBieSwgRWxlbWVudEZpbmRlciwgS2V5fSBmcm9tICdwcm90cmFjdG9yJztcblxuLyoqIE1hcHMgdGhlIGBUZXN0S2V5YCBjb25zdGFudHMgdG8gUHJvdHJhY3RvcidzIGBLZXlgIGNvbnN0YW50cy4gKi9cbmNvbnN0IGtleU1hcCA9IHtcbiAgW1Rlc3RLZXkuQkFDS1NQQUNFXTogS2V5LkJBQ0tfU1BBQ0UsXG4gIFtUZXN0S2V5LlRBQl06IEtleS5UQUIsXG4gIFtUZXN0S2V5LkVOVEVSXTogS2V5LkVOVEVSLFxuICBbVGVzdEtleS5TSElGVF06IEtleS5TSElGVCxcbiAgW1Rlc3RLZXkuQ09OVFJPTF06IEtleS5DT05UUk9MLFxuICBbVGVzdEtleS5BTFRdOiBLZXkuQUxULFxuICBbVGVzdEtleS5FU0NBUEVdOiBLZXkuRVNDQVBFLFxuICBbVGVzdEtleS5QQUdFX1VQXTogS2V5LlBBR0VfVVAsXG4gIFtUZXN0S2V5LlBBR0VfRE9XTl06IEtleS5QQUdFX0RPV04sXG4gIFtUZXN0S2V5LkVORF06IEtleS5FTkQsXG4gIFtUZXN0S2V5LkhPTUVdOiBLZXkuSE9NRSxcbiAgW1Rlc3RLZXkuTEVGVF9BUlJPV106IEtleS5BUlJPV19MRUZULFxuICBbVGVzdEtleS5VUF9BUlJPV106IEtleS5BUlJPV19VUCxcbiAgW1Rlc3RLZXkuUklHSFRfQVJST1ddOiBLZXkuQVJST1dfUklHSFQsXG4gIFtUZXN0S2V5LkRPV05fQVJST1ddOiBLZXkuQVJST1dfRE9XTixcbiAgW1Rlc3RLZXkuSU5TRVJUXTogS2V5LklOU0VSVCxcbiAgW1Rlc3RLZXkuREVMRVRFXTogS2V5LkRFTEVURSxcbiAgW1Rlc3RLZXkuRjFdOiBLZXkuRjEsXG4gIFtUZXN0S2V5LkYyXTogS2V5LkYyLFxuICBbVGVzdEtleS5GM106IEtleS5GMyxcbiAgW1Rlc3RLZXkuRjRdOiBLZXkuRjQsXG4gIFtUZXN0S2V5LkY1XTogS2V5LkY1LFxuICBbVGVzdEtleS5GNl06IEtleS5GNixcbiAgW1Rlc3RLZXkuRjddOiBLZXkuRjcsXG4gIFtUZXN0S2V5LkY4XTogS2V5LkY4LFxuICBbVGVzdEtleS5GOV06IEtleS5GOSxcbiAgW1Rlc3RLZXkuRjEwXTogS2V5LkYxMCxcbiAgW1Rlc3RLZXkuRjExXTogS2V5LkYxMSxcbiAgW1Rlc3RLZXkuRjEyXTogS2V5LkYxMixcbiAgW1Rlc3RLZXkuTUVUQV06IEtleS5NRVRBXG59O1xuXG4vKiogQ29udmVydHMgYSBgTW9kaWZpZXJLZXlzYCBvYmplY3QgdG8gYSBsaXN0IG9mIFByb3RyYWN0b3IgYEtleWBzLiAqL1xuZnVuY3Rpb24gdG9Qcm90cmFjdG9yTW9kaWZpZXJLZXlzKG1vZGlmaWVyczogTW9kaWZpZXJLZXlzKTogc3RyaW5nW10ge1xuICBjb25zdCByZXN1bHQ6IHN0cmluZ1tdID0gW107XG4gIGlmIChtb2RpZmllcnMuY29udHJvbCkge1xuICAgIHJlc3VsdC5wdXNoKEtleS5DT05UUk9MKTtcbiAgfVxuICBpZiAobW9kaWZpZXJzLmFsdCkge1xuICAgIHJlc3VsdC5wdXNoKEtleS5BTFQpO1xuICB9XG4gIGlmIChtb2RpZmllcnMuc2hpZnQpIHtcbiAgICByZXN1bHQucHVzaChLZXkuU0hJRlQpO1xuICB9XG4gIGlmIChtb2RpZmllcnMubWV0YSkge1xuICAgIHJlc3VsdC5wdXNoKEtleS5NRVRBKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIEEgYFRlc3RFbGVtZW50YCBpbXBsZW1lbnRhdGlvbiBmb3IgUHJvdHJhY3Rvci5cbiAqIEBkZXByZWNhdGVkXG4gKiBAYnJlYWtpbmctY2hhbmdlIDEzLjAuMFxuICovXG5leHBvcnQgY2xhc3MgUHJvdHJhY3RvckVsZW1lbnQgaW1wbGVtZW50cyBUZXN0RWxlbWVudCB7XG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IGVsZW1lbnQ6IEVsZW1lbnRGaW5kZXIpIHt9XG5cbiAgLyoqIEJsdXIgdGhlIGVsZW1lbnQuICovXG4gIGFzeW5jIGJsdXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIGJyb3dzZXIuZXhlY3V0ZVNjcmlwdCgnYXJndW1lbnRzWzBdLmJsdXIoKScsIHRoaXMuZWxlbWVudCk7XG4gIH1cblxuICAvKiogQ2xlYXIgdGhlIGVsZW1lbnQncyBpbnB1dCAoZm9yIGlucHV0IGFuZCB0ZXh0YXJlYSBlbGVtZW50cyBvbmx5KS4gKi9cbiAgYXN5bmMgY2xlYXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudC5jbGVhcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIENsaWNrIHRoZSBlbGVtZW50IGF0IHRoZSBkZWZhdWx0IGxvY2F0aW9uIGZvciB0aGUgY3VycmVudCBlbnZpcm9ubWVudC4gSWYgeW91IG5lZWQgdG8gZ3VhcmFudGVlXG4gICAqIHRoZSBlbGVtZW50IGlzIGNsaWNrZWQgYXQgYSBzcGVjaWZpYyBsb2NhdGlvbiwgY29uc2lkZXIgdXNpbmcgYGNsaWNrKCdjZW50ZXInKWAgb3JcbiAgICogYGNsaWNrKHgsIHkpYCBpbnN0ZWFkLlxuICAgKi9cbiAgY2xpY2sobW9kaWZpZXJzPzogTW9kaWZpZXJLZXlzKTogUHJvbWlzZTx2b2lkPjtcbiAgLyoqIENsaWNrIHRoZSBlbGVtZW50IGF0IHRoZSBlbGVtZW50J3MgY2VudGVyLiAqL1xuICBjbGljayhsb2NhdGlvbjogJ2NlbnRlcicsIG1vZGlmaWVycz86IE1vZGlmaWVyS2V5cyk6IFByb21pc2U8dm9pZD47XG4gIC8qKlxuICAgKiBDbGljayB0aGUgZWxlbWVudCBhdCB0aGUgc3BlY2lmaWVkIGNvb3JkaW5hdGVzIHJlbGF0aXZlIHRvIHRoZSB0b3AtbGVmdCBvZiB0aGUgZWxlbWVudC5cbiAgICogQHBhcmFtIHJlbGF0aXZlWCBDb29yZGluYXRlIHdpdGhpbiB0aGUgZWxlbWVudCwgYWxvbmcgdGhlIFgtYXhpcyBhdCB3aGljaCB0byBjbGljay5cbiAgICogQHBhcmFtIHJlbGF0aXZlWSBDb29yZGluYXRlIHdpdGhpbiB0aGUgZWxlbWVudCwgYWxvbmcgdGhlIFktYXhpcyBhdCB3aGljaCB0byBjbGljay5cbiAgICogQHBhcmFtIG1vZGlmaWVycyBNb2RpZmllciBrZXlzIGhlbGQgd2hpbGUgY2xpY2tpbmdcbiAgICovXG4gIGNsaWNrKHJlbGF0aXZlWDogbnVtYmVyLCByZWxhdGl2ZVk6IG51bWJlciwgbW9kaWZpZXJzPzogTW9kaWZpZXJLZXlzKTogUHJvbWlzZTx2b2lkPjtcbiAgYXN5bmMgY2xpY2soLi4uYXJnczogW01vZGlmaWVyS2V5cz9dIHwgWydjZW50ZXInLCBNb2RpZmllcktleXM/XSB8XG4gICAgW251bWJlciwgbnVtYmVyLCBNb2RpZmllcktleXM/XSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuX2Rpc3BhdGNoQ2xpY2tFdmVudFNlcXVlbmNlKGFyZ3MsIEJ1dHRvbi5MRUZUKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSaWdodCBjbGlja3Mgb24gdGhlIGVsZW1lbnQgYXQgdGhlIHNwZWNpZmllZCBjb29yZGluYXRlcyByZWxhdGl2ZSB0byB0aGUgdG9wLWxlZnQgb2YgaXQuXG4gICAqIEBwYXJhbSByZWxhdGl2ZVggQ29vcmRpbmF0ZSB3aXRoaW4gdGhlIGVsZW1lbnQsIGFsb25nIHRoZSBYLWF4aXMgYXQgd2hpY2ggdG8gY2xpY2suXG4gICAqIEBwYXJhbSByZWxhdGl2ZVkgQ29vcmRpbmF0ZSB3aXRoaW4gdGhlIGVsZW1lbnQsIGFsb25nIHRoZSBZLWF4aXMgYXQgd2hpY2ggdG8gY2xpY2suXG4gICAqIEBwYXJhbSBtb2RpZmllcnMgTW9kaWZpZXIga2V5cyBoZWxkIHdoaWxlIGNsaWNraW5nXG4gICAqL1xuICByaWdodENsaWNrKHJlbGF0aXZlWDogbnVtYmVyLCByZWxhdGl2ZVk6IG51bWJlciwgbW9kaWZpZXJzPzogTW9kaWZpZXJLZXlzKTogUHJvbWlzZTx2b2lkPjtcbiAgYXN5bmMgcmlnaHRDbGljayguLi5hcmdzOiBbTW9kaWZpZXJLZXlzP10gfCBbJ2NlbnRlcicsIE1vZGlmaWVyS2V5cz9dIHxcbiAgICBbbnVtYmVyLCBudW1iZXIsIE1vZGlmaWVyS2V5cz9dKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5fZGlzcGF0Y2hDbGlja0V2ZW50U2VxdWVuY2UoYXJncywgQnV0dG9uLlJJR0hUKTtcbiAgfVxuXG4gIC8qKiBGb2N1cyB0aGUgZWxlbWVudC4gKi9cbiAgYXN5bmMgZm9jdXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIGJyb3dzZXIuZXhlY3V0ZVNjcmlwdCgnYXJndW1lbnRzWzBdLmZvY3VzKCknLCB0aGlzLmVsZW1lbnQpO1xuICB9XG5cbiAgLyoqIEdldCB0aGUgY29tcHV0ZWQgdmFsdWUgb2YgdGhlIGdpdmVuIENTUyBwcm9wZXJ0eSBmb3IgdGhlIGVsZW1lbnQuICovXG4gIGFzeW5jIGdldENzc1ZhbHVlKHByb3BlcnR5OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZ2V0Q3NzVmFsdWUocHJvcGVydHkpO1xuICB9XG5cbiAgLyoqIEhvdmVycyB0aGUgbW91c2Ugb3ZlciB0aGUgZWxlbWVudC4gKi9cbiAgYXN5bmMgaG92ZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIGJyb3dzZXIuYWN0aW9ucygpXG4gICAgICAgIC5tb3VzZU1vdmUoYXdhaXQgdGhpcy5lbGVtZW50LmdldFdlYkVsZW1lbnQoKSlcbiAgICAgICAgLnBlcmZvcm0oKTtcbiAgfVxuXG4gIC8qKiBNb3ZlcyB0aGUgbW91c2UgYXdheSBmcm9tIHRoZSBlbGVtZW50LiAqL1xuICBhc3luYyBtb3VzZUF3YXkoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIGJyb3dzZXIuYWN0aW9ucygpXG4gICAgICAgIC5tb3VzZU1vdmUoYXdhaXQgdGhpcy5lbGVtZW50LmdldFdlYkVsZW1lbnQoKSwge3g6IC0xLCB5OiAtMX0pXG4gICAgICAgIC5wZXJmb3JtKCk7XG4gIH1cblxuICAvKipcbiAgICogU2VuZHMgdGhlIGdpdmVuIHN0cmluZyB0byB0aGUgaW5wdXQgYXMgYSBzZXJpZXMgb2Yga2V5IHByZXNzZXMuIEFsc28gZmlyZXMgaW5wdXQgZXZlbnRzXG4gICAqIGFuZCBhdHRlbXB0cyB0byBhZGQgdGhlIHN0cmluZyB0byB0aGUgRWxlbWVudCdzIHZhbHVlLlxuICAgKi9cbiAgYXN5bmMgc2VuZEtleXMoLi4ua2V5czogKHN0cmluZyB8IFRlc3RLZXkpW10pOiBQcm9taXNlPHZvaWQ+O1xuICAvKipcbiAgICogU2VuZHMgdGhlIGdpdmVuIHN0cmluZyB0byB0aGUgaW5wdXQgYXMgYSBzZXJpZXMgb2Yga2V5IHByZXNzZXMuIEFsc28gZmlyZXMgaW5wdXQgZXZlbnRzXG4gICAqIGFuZCBhdHRlbXB0cyB0byBhZGQgdGhlIHN0cmluZyB0byB0aGUgRWxlbWVudCdzIHZhbHVlLlxuICAgKi9cbiAgYXN5bmMgc2VuZEtleXMobW9kaWZpZXJzOiBNb2RpZmllcktleXMsIC4uLmtleXM6IChzdHJpbmcgfCBUZXN0S2V5KVtdKTogUHJvbWlzZTx2b2lkPjtcbiAgYXN5bmMgc2VuZEtleXMoLi4ubW9kaWZpZXJzQW5kS2V5czogYW55W10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaXJzdCA9IG1vZGlmaWVyc0FuZEtleXNbMF07XG4gICAgbGV0IG1vZGlmaWVyczogTW9kaWZpZXJLZXlzO1xuICAgIGxldCByZXN0OiAoc3RyaW5nIHwgVGVzdEtleSlbXTtcbiAgICBpZiAodHlwZW9mIGZpcnN0ICE9PSAnc3RyaW5nJyAmJiB0eXBlb2YgZmlyc3QgIT09ICdudW1iZXInKSB7XG4gICAgICBtb2RpZmllcnMgPSBmaXJzdDtcbiAgICAgIHJlc3QgPSBtb2RpZmllcnNBbmRLZXlzLnNsaWNlKDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBtb2RpZmllcnMgPSB7fTtcbiAgICAgIHJlc3QgPSBtb2RpZmllcnNBbmRLZXlzO1xuICAgIH1cblxuICAgIGNvbnN0IG1vZGlmaWVyS2V5cyA9IHRvUHJvdHJhY3Rvck1vZGlmaWVyS2V5cyhtb2RpZmllcnMpO1xuICAgIGNvbnN0IGtleXMgPSByZXN0Lm1hcChrID0+IHR5cGVvZiBrID09PSAnc3RyaW5nJyA/IGsuc3BsaXQoJycpIDogW2tleU1hcFtrXV0pXG4gICAgICAgIC5yZWR1Y2UoKGFyciwgaykgPT4gYXJyLmNvbmNhdChrKSwgW10pXG4gICAgICAgIC8vIEtleS5jaG9yZCBkb2Vzbid0IHdvcmsgd2VsbCB3aXRoIGdlY2tvZHJpdmVyIChtb3ppbGxhL2dlY2tvZHJpdmVyIzE1MDIpLFxuICAgICAgICAvLyBzbyBhdm9pZCBpdCBpZiBubyBtb2RpZmllciBrZXlzIGFyZSByZXF1aXJlZC5cbiAgICAgICAgLm1hcChrID0+IG1vZGlmaWVyS2V5cy5sZW5ndGggPiAwID8gS2V5LmNob3JkKC4uLm1vZGlmaWVyS2V5cywgaykgOiBrKTtcblxuICAgIHJldHVybiB0aGlzLmVsZW1lbnQuc2VuZEtleXMoLi4ua2V5cyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdGV4dCBmcm9tIHRoZSBlbGVtZW50LlxuICAgKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIHRoYXQgYWZmZWN0IHdoYXQgdGV4dCBpcyBpbmNsdWRlZC5cbiAgICovXG4gIGFzeW5jIHRleHQob3B0aW9ucz86IFRleHRPcHRpb25zKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAob3B0aW9ucz8uZXhjbHVkZSkge1xuICAgICAgcmV0dXJuIGJyb3dzZXIuZXhlY3V0ZVNjcmlwdChfZ2V0VGV4dFdpdGhFeGNsdWRlZEVsZW1lbnRzLCB0aGlzLmVsZW1lbnQsIG9wdGlvbnMuZXhjbHVkZSk7XG4gICAgfVxuICAgIC8vIFdlIGRvbid0IGdvIHRocm91Z2ggUHJvdHJhY3RvcidzIGBnZXRUZXh0YCwgYmVjYXVzZSBpdCBleGNsdWRlcyB0ZXh0IGZyb20gaGlkZGVuIGVsZW1lbnRzLlxuICAgIHJldHVybiBicm93c2VyLmV4ZWN1dGVTY3JpcHQoYHJldHVybiAoYXJndW1lbnRzWzBdLnRleHRDb250ZW50IHx8ICcnKS50cmltKClgLCB0aGlzLmVsZW1lbnQpO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIHZhbHVlIGZvciB0aGUgZ2l2ZW4gYXR0cmlidXRlIGZyb20gdGhlIGVsZW1lbnQuICovXG4gIGFzeW5jIGdldEF0dHJpYnV0ZShuYW1lOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ3xudWxsPiB7XG4gICAgcmV0dXJuIGJyb3dzZXIuZXhlY3V0ZVNjcmlwdChcbiAgICAgICAgYHJldHVybiBhcmd1bWVudHNbMF0uZ2V0QXR0cmlidXRlKGFyZ3VtZW50c1sxXSlgLCB0aGlzLmVsZW1lbnQsIG5hbWUpO1xuICB9XG5cbiAgLyoqIENoZWNrcyB3aGV0aGVyIHRoZSBlbGVtZW50IGhhcyB0aGUgZ2l2ZW4gY2xhc3MuICovXG4gIGFzeW5jIGhhc0NsYXNzKG5hbWU6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGNsYXNzZXMgPSAoYXdhaXQgdGhpcy5nZXRBdHRyaWJ1dGUoJ2NsYXNzJykpIHx8ICcnO1xuICAgIHJldHVybiBuZXcgU2V0KGNsYXNzZXMuc3BsaXQoL1xccysvKS5maWx0ZXIoYyA9PiBjKSkuaGFzKG5hbWUpO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIGRpbWVuc2lvbnMgb2YgdGhlIGVsZW1lbnQuICovXG4gIGFzeW5jIGdldERpbWVuc2lvbnMoKTogUHJvbWlzZTxFbGVtZW50RGltZW5zaW9ucz4ge1xuICAgIGNvbnN0IHt3aWR0aCwgaGVpZ2h0fSA9IGF3YWl0IHRoaXMuZWxlbWVudC5nZXRTaXplKCk7XG4gICAgY29uc3Qge3g6IGxlZnQsIHk6IHRvcH0gPSBhd2FpdCB0aGlzLmVsZW1lbnQuZ2V0TG9jYXRpb24oKTtcbiAgICByZXR1cm4ge3dpZHRoLCBoZWlnaHQsIGxlZnQsIHRvcH07XG4gIH1cblxuICAvKiogR2V0cyB0aGUgdmFsdWUgb2YgYSBwcm9wZXJ0eSBvZiBhbiBlbGVtZW50LiAqL1xuICBhc3luYyBnZXRQcm9wZXJ0eTxUID0gYW55PihuYW1lOiBzdHJpbmcpOiBQcm9taXNlPFQ+IHtcbiAgICByZXR1cm4gYnJvd3Nlci5leGVjdXRlU2NyaXB0KGByZXR1cm4gYXJndW1lbnRzWzBdW2FyZ3VtZW50c1sxXV1gLCB0aGlzLmVsZW1lbnQsIG5hbWUpO1xuICB9XG5cbiAgLyoqIFNldHMgdGhlIHZhbHVlIG9mIGEgcHJvcGVydHkgb2YgYW4gaW5wdXQuICovXG4gIGFzeW5jIHNldElucHV0VmFsdWUodmFsdWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBicm93c2VyLmV4ZWN1dGVTY3JpcHQoYGFyZ3VtZW50c1swXS52YWx1ZSA9IGFyZ3VtZW50c1sxXWAsIHRoaXMuZWxlbWVudCwgdmFsdWUpO1xuICB9XG5cbiAgLyoqIFNlbGVjdHMgdGhlIG9wdGlvbnMgYXQgdGhlIHNwZWNpZmllZCBpbmRleGVzIGluc2lkZSBvZiBhIG5hdGl2ZSBgc2VsZWN0YCBlbGVtZW50LiAqL1xuICBhc3luYyBzZWxlY3RPcHRpb25zKC4uLm9wdGlvbkluZGV4ZXM6IG51bWJlcltdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IGF3YWl0IHRoaXMuZWxlbWVudC5hbGwoYnkuY3NzKCdvcHRpb24nKSk7XG4gICAgY29uc3QgaW5kZXhlcyA9IG5ldyBTZXQob3B0aW9uSW5kZXhlcyk7IC8vIENvbnZlcnQgdG8gYSBzZXQgdG8gcmVtb3ZlIGR1cGxpY2F0ZXMuXG5cbiAgICBpZiAob3B0aW9ucy5sZW5ndGggJiYgaW5kZXhlcy5zaXplKSB7XG4gICAgICAvLyBSZXNldCB0aGUgdmFsdWUgc28gYWxsIHRoZSBzZWxlY3RlZCBzdGF0ZXMgYXJlIGNsZWFyZWQuIFdlIGNhblxuICAgICAgLy8gcmV1c2UgdGhlIGlucHV0LXNwZWNpZmljIG1ldGhvZCBzaW5jZSB0aGUgbG9naWMgaXMgdGhlIHNhbWUuXG4gICAgICBhd2FpdCB0aGlzLnNldElucHV0VmFsdWUoJycpO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9wdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGluZGV4ZXMuaGFzKGkpKSB7XG4gICAgICAgICAgLy8gV2UgaGF2ZSB0byBob2xkIHRoZSBjb250cm9sIGtleSB3aGlsZSBjbGlja2luZyBvbiBvcHRpb25zIHNvIHRoYXQgbXVsdGlwbGUgY2FuIGJlXG4gICAgICAgICAgLy8gc2VsZWN0ZWQgaW4gbXVsdGktc2VsZWN0aW9uIG1vZGUuIFRoZSBrZXkgZG9lc24ndCBkbyBhbnl0aGluZyBmb3Igc2luZ2xlIHNlbGVjdGlvbi5cbiAgICAgICAgICBhd2FpdCBicm93c2VyLmFjdGlvbnMoKS5rZXlEb3duKEtleS5DT05UUk9MKS5wZXJmb3JtKCk7XG4gICAgICAgICAgYXdhaXQgb3B0aW9uc1tpXS5jbGljaygpO1xuICAgICAgICAgIGF3YWl0IGJyb3dzZXIuYWN0aW9ucygpLmtleVVwKEtleS5DT05UUk9MKS5wZXJmb3JtKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogQ2hlY2tzIHdoZXRoZXIgdGhpcyBlbGVtZW50IG1hdGNoZXMgdGhlIGdpdmVuIHNlbGVjdG9yLiAqL1xuICBhc3luYyBtYXRjaGVzU2VsZWN0b3Ioc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgcmV0dXJuIGJyb3dzZXIuZXhlY3V0ZVNjcmlwdChgXG4gICAgICAgICAgcmV0dXJuIChFbGVtZW50LnByb3RvdHlwZS5tYXRjaGVzIHx8XG4gICAgICAgICAgICAgICAgICBFbGVtZW50LnByb3RvdHlwZS5tc01hdGNoZXNTZWxlY3RvcikuY2FsbChhcmd1bWVudHNbMF0sIGFyZ3VtZW50c1sxXSlcbiAgICAgICAgICBgLCB0aGlzLmVsZW1lbnQsIHNlbGVjdG9yKTtcbiAgfVxuXG4gIC8qKiBDaGVja3Mgd2hldGhlciB0aGUgZWxlbWVudCBpcyBmb2N1c2VkLiAqL1xuICBhc3luYyBpc0ZvY3VzZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudC5lcXVhbHMoYnJvd3Nlci5kcml2ZXIuc3dpdGNoVG8oKS5hY3RpdmVFbGVtZW50KCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIERpc3BhdGNoZXMgYW4gZXZlbnQgd2l0aCBhIHBhcnRpY3VsYXIgbmFtZS5cbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgZXZlbnQgdG8gYmUgZGlzcGF0Y2hlZC5cbiAgICovXG4gIGFzeW5jIGRpc3BhdGNoRXZlbnQobmFtZTogc3RyaW5nLCBkYXRhPzogUmVjb3JkPHN0cmluZywgRXZlbnREYXRhPik6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBicm93c2VyLmV4ZWN1dGVTY3JpcHQoX2Rpc3BhdGNoRXZlbnQsIG5hbWUsIHRoaXMuZWxlbWVudCwgZGF0YSk7XG4gIH1cblxuICAvKiogRGlzcGF0Y2hlcyBhbGwgdGhlIGV2ZW50cyB0aGF0IGFyZSBwYXJ0IG9mIGEgY2xpY2sgZXZlbnQgc2VxdWVuY2UuICovXG4gIHByaXZhdGUgYXN5bmMgX2Rpc3BhdGNoQ2xpY2tFdmVudFNlcXVlbmNlKFxuICAgIGFyZ3M6IFtNb2RpZmllcktleXM/XSB8IFsnY2VudGVyJywgTW9kaWZpZXJLZXlzP10gfFxuICAgICAgW251bWJlciwgbnVtYmVyLCBNb2RpZmllcktleXM/XSxcbiAgICBidXR0b246IHN0cmluZykge1xuICAgIGxldCBtb2RpZmllcnM6IE1vZGlmaWVyS2V5cyA9IHt9O1xuICAgIGlmIChhcmdzLmxlbmd0aCAmJiB0eXBlb2YgYXJnc1thcmdzLmxlbmd0aCAtIDFdID09PSAnb2JqZWN0Jykge1xuICAgICAgbW9kaWZpZXJzID0gYXJncy5wb3AoKSBhcyBNb2RpZmllcktleXM7XG4gICAgfVxuICAgIGNvbnN0IG1vZGlmaWVyS2V5cyA9IHRvUHJvdHJhY3Rvck1vZGlmaWVyS2V5cyhtb2RpZmllcnMpO1xuXG4gICAgLy8gT21pdHRpbmcgdGhlIG9mZnNldCBhcmd1bWVudCB0byBtb3VzZU1vdmUgcmVzdWx0cyBpbiBjbGlja2luZyB0aGUgY2VudGVyLlxuICAgIC8vIFRoaXMgaXMgdGhlIGRlZmF1bHQgYmVoYXZpb3Igd2Ugd2FudCwgc28gd2UgdXNlIGFuIGVtcHR5IGFycmF5IG9mIG9mZnNldEFyZ3MgaWZcbiAgICAvLyBubyBhcmdzIHJlbWFpbiBhZnRlciBwb3BwaW5nIHRoZSBtb2RpZmllcnMgZnJvbSB0aGUgYXJncyBwYXNzZWQgdG8gdGhpcyBmdW5jdGlvbi5cbiAgICBjb25zdCBvZmZzZXRBcmdzID0gKGFyZ3MubGVuZ3RoID09PSAyID9cbiAgICAgIFt7eDogYXJnc1swXSwgeTogYXJnc1sxXX1dIDogW10pIGFzIFt7eDogbnVtYmVyLCB5OiBudW1iZXJ9XTtcblxuICAgIGxldCBhY3Rpb25zID0gYnJvd3Nlci5hY3Rpb25zKClcbiAgICAgIC5tb3VzZU1vdmUoYXdhaXQgdGhpcy5lbGVtZW50LmdldFdlYkVsZW1lbnQoKSwgLi4ub2Zmc2V0QXJncyk7XG5cbiAgICBmb3IgKGNvbnN0IG1vZGlmaWVyS2V5IG9mIG1vZGlmaWVyS2V5cykge1xuICAgICAgYWN0aW9ucyA9IGFjdGlvbnMua2V5RG93bihtb2RpZmllcktleSk7XG4gICAgfVxuICAgIGFjdGlvbnMgPSBhY3Rpb25zLmNsaWNrKGJ1dHRvbik7XG4gICAgZm9yIChjb25zdCBtb2RpZmllcktleSBvZiBtb2RpZmllcktleXMpIHtcbiAgICAgIGFjdGlvbnMgPSBhY3Rpb25zLmtleVVwKG1vZGlmaWVyS2V5KTtcbiAgICB9XG5cbiAgICBhd2FpdCBhY3Rpb25zLnBlcmZvcm0oKTtcbiAgfVxufVxuXG4vKipcbiAqIERpc3BhdGNoZXMgYW4gZXZlbnQgd2l0aCBhIHBhcnRpY3VsYXIgbmFtZSBhbmQgZGF0YSB0byBhbiBlbGVtZW50LlxuICogTm90ZSB0aGF0IHRoaXMgbmVlZHMgdG8gYmUgYSBwdXJlIGZ1bmN0aW9uLCBiZWNhdXNlIGl0IGdldHMgc3RyaW5naWZpZWQgYnlcbiAqIFByb3RyYWN0b3IgYW5kIGlzIGV4ZWN1dGVkIGluc2lkZSB0aGUgYnJvd3Nlci5cbiAqL1xuZnVuY3Rpb24gX2Rpc3BhdGNoRXZlbnQobmFtZTogc3RyaW5nLCBlbGVtZW50OiBFbGVtZW50RmluZGVyLCBkYXRhPzogUmVjb3JkPHN0cmluZywgRXZlbnREYXRhPikge1xuICBjb25zdCBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuICBldmVudC5pbml0RXZlbnQobmFtZSk7XG5cbiAgaWYgKGRhdGEpIHtcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6YmFuIEhhdmUgdG8gdXNlIGBPYmplY3QuYXNzaWduYCB0byBwcmVzZXJ2ZSB0aGUgb3JpZ2luYWwgb2JqZWN0LlxuICAgIE9iamVjdC5hc3NpZ24oZXZlbnQsIGRhdGEpO1xuICB9XG5cbiAgLy8gVGhpcyB0eXBlIGhhcyBhIHN0cmluZyBpbmRleCBzaWduYXR1cmUsIHNvIHdlIGNhbm5vdCBhY2Nlc3MgaXQgdXNpbmcgYSBkb3R0ZWQgcHJvcGVydHkgYWNjZXNzLlxuICBlbGVtZW50WydkaXNwYXRjaEV2ZW50J10oZXZlbnQpO1xufVxuIl19