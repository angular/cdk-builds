/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __awaiter } from "tslib";
import { _getTextWithExcludedElements, TestKey } from '@angular/cdk/testing';
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
/** A `TestElement` implementation for Protractor. */
export class ProtractorElement {
    constructor(element) {
        this.element = element;
    }
    blur() {
        return __awaiter(this, void 0, void 0, function* () {
            return browser.executeScript('arguments[0].blur()', this.element);
        });
    }
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.element.clear();
        });
    }
    click(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._dispatchClickEventSequence(args);
        });
    }
    rightClick(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._dispatchClickEventSequence(args, Button.RIGHT);
        });
    }
    focus() {
        return __awaiter(this, void 0, void 0, function* () {
            return browser.executeScript('arguments[0].focus()', this.element);
        });
    }
    getCssValue(property) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.element.getCssValue(property);
        });
    }
    hover() {
        return __awaiter(this, void 0, void 0, function* () {
            return browser.actions()
                .mouseMove(yield this.element.getWebElement())
                .perform();
        });
    }
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
    text(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (options === null || options === void 0 ? void 0 : options.exclude) {
                return browser.executeScript(_getTextWithExcludedElements, this.element, options.exclude);
            }
            return this.element.getText();
        });
    }
    getAttribute(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return browser.executeScript(`return arguments[0].getAttribute(arguments[1])`, this.element, name);
        });
    }
    hasClass(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const classes = (yield this.getAttribute('class')) || '';
            return new Set(classes.split(/\s+/).filter(c => c)).has(name);
        });
    }
    getDimensions() {
        return __awaiter(this, void 0, void 0, function* () {
            const { width, height } = yield this.element.getSize();
            const { x: left, y: top } = yield this.element.getLocation();
            return { width, height, left, top };
        });
    }
    getProperty(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return browser.executeScript(`return arguments[0][arguments[1]]`, this.element, name);
        });
    }
    setInputValue(value) {
        return __awaiter(this, void 0, void 0, function* () {
            return browser.executeScript(`arguments[0].value = arguments[1]`, this.element, value);
        });
    }
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
    matchesSelector(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            return browser.executeScript(`
          return (Element.prototype.matches ||
                  Element.prototype.msMatchesSelector).call(arguments[0], arguments[1])
          `, this.element, selector);
        });
    }
    isFocused() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.element.equals(browser.driver.switchTo().activeElement());
        });
    }
    dispatchEvent(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return browser.executeScript(_dispatchEvent, name, this.element);
        });
    }
    /** Dispatches all the events that are part of a click event sequence. */
    _dispatchClickEventSequence(args, button) {
        return __awaiter(this, void 0, void 0, function* () {
            // Omitting the offset argument to mouseMove results in clicking the center.
            // This is the default behavior we want, so we use an empty array of offsetArgs if no args are
            // passed to this method.
            const offsetArgs = args.length === 2 ? [{ x: args[0], y: args[1] }] : [];
            yield browser.actions()
                .mouseMove(yield this.element.getWebElement(), ...offsetArgs)
                .click(button)
                .perform();
        });
    }
}
/**
 * Dispatches an event with a particular name and data to an element.
 * Note that this needs to be a pure function, because it gets stringified by
 * Protractor and is executed inside the browser.
 */
function _dispatchEvent(name, element) {
    const event = document.createEvent('Event');
    event.initEvent(name);
    // This type has a string index signature, so we cannot access it using a dotted property access.
    element['dispatchEvent'](event);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdHJhY3Rvci1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Byb3RyYWN0b3IvcHJvdHJhY3Rvci1lbGVtZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQ0wsNEJBQTRCLEVBSTVCLE9BQU8sRUFFUixNQUFNLHNCQUFzQixDQUFDO0FBQzlCLE9BQU8sRUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBaUIsR0FBRyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBRW5FLG9FQUFvRTtBQUNwRSxNQUFNLE1BQU0sR0FBRztJQUNiLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVO0lBQ25DLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHO0lBQ3RCLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxLQUFLO0lBQzFCLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxLQUFLO0lBQzFCLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxPQUFPO0lBQzlCLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHO0lBQ3RCLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxNQUFNO0lBQzVCLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxPQUFPO0lBQzlCLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxTQUFTO0lBQ2xDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHO0lBQ3RCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxJQUFJO0lBQ3hCLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVO0lBQ3BDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxRQUFRO0lBQ2hDLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxXQUFXO0lBQ3RDLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVO0lBQ3BDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxNQUFNO0lBQzVCLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxNQUFNO0lBQzVCLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0lBQ3BCLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0lBQ3BCLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0lBQ3BCLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0lBQ3BCLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0lBQ3BCLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0lBQ3BCLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0lBQ3BCLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0lBQ3BCLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0lBQ3BCLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHO0lBQ3RCLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHO0lBQ3RCLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHO0lBQ3RCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxJQUFJO0NBQ3pCLENBQUM7QUFFRix1RUFBdUU7QUFDdkUsU0FBUyx3QkFBd0IsQ0FBQyxTQUF1QjtJQUN2RCxNQUFNLE1BQU0sR0FBYSxFQUFFLENBQUM7SUFDNUIsSUFBSSxTQUFTLENBQUMsT0FBTyxFQUFFO1FBQ3JCLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQzFCO0lBQ0QsSUFBSSxTQUFTLENBQUMsR0FBRyxFQUFFO1FBQ2pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ3RCO0lBQ0QsSUFBSSxTQUFTLENBQUMsS0FBSyxFQUFFO1FBQ25CLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ3hCO0lBQ0QsSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFO1FBQ2xCLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3ZCO0lBQ0QsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQUVELHFEQUFxRDtBQUNyRCxNQUFNLE9BQU8saUJBQWlCO0lBQzVCLFlBQXFCLE9BQXNCO1FBQXRCLFlBQU8sR0FBUCxPQUFPLENBQWU7SUFBRyxDQUFDO0lBRXpDLElBQUk7O1lBQ1IsT0FBTyxPQUFPLENBQUMsYUFBYSxDQUFDLHFCQUFxQixFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNwRSxDQUFDO0tBQUE7SUFFSyxLQUFLOztZQUNULE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUM5QixDQUFDO0tBQUE7SUFFSyxLQUFLLENBQUMsR0FBRyxJQUF3Qzs7WUFDckQsTUFBTSxJQUFJLENBQUMsMkJBQTJCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0MsQ0FBQztLQUFBO0lBRUssVUFBVSxDQUFDLEdBQUcsSUFBd0M7O1lBQzFELE1BQU0sSUFBSSxDQUFDLDJCQUEyQixDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDN0QsQ0FBQztLQUFBO0lBRUssS0FBSzs7WUFDVCxPQUFPLE9BQU8sQ0FBQyxhQUFhLENBQUMsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3JFLENBQUM7S0FBQTtJQUVLLFdBQVcsQ0FBQyxRQUFnQjs7WUFDaEMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM1QyxDQUFDO0tBQUE7SUFFSyxLQUFLOztZQUNULE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRTtpQkFDbkIsU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsQ0FBQztpQkFDN0MsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQztLQUFBO0lBRUssU0FBUzs7WUFDYixPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUU7aUJBQ25CLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLEVBQUUsRUFBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFDLENBQUM7aUJBQzdELE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUM7S0FBQTtJQUlLLFFBQVEsQ0FBQyxHQUFHLGdCQUF1Qjs7WUFDdkMsTUFBTSxLQUFLLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEMsSUFBSSxTQUF1QixDQUFDO1lBQzVCLElBQUksSUFBMEIsQ0FBQztZQUMvQixJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7Z0JBQzFELFNBQVMsR0FBRyxLQUFLLENBQUM7Z0JBQ2xCLElBQUksR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDbEM7aUJBQU07Z0JBQ0wsU0FBUyxHQUFHLEVBQUUsQ0FBQztnQkFDZixJQUFJLEdBQUcsZ0JBQWdCLENBQUM7YUFDekI7WUFFRCxNQUFNLFlBQVksR0FBRyx3QkFBd0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN6RCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUN4RSxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDdEMsMkVBQTJFO2dCQUMzRSxnREFBZ0Q7aUJBQy9DLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsWUFBWSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUUzRSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDeEMsQ0FBQztLQUFBO0lBRUssSUFBSSxDQUFDLE9BQXFCOztZQUM5QixJQUFJLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxPQUFPLEVBQUU7Z0JBQ3BCLE9BQU8sT0FBTyxDQUFDLGFBQWEsQ0FBQyw0QkFBNEIsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUMzRjtZQUNELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNoQyxDQUFDO0tBQUE7SUFFSyxZQUFZLENBQUMsSUFBWTs7WUFDN0IsT0FBTyxPQUFPLENBQUMsYUFBYSxDQUN4QixnREFBZ0QsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzVFLENBQUM7S0FBQTtJQUVLLFFBQVEsQ0FBQyxJQUFZOztZQUN6QixNQUFNLE9BQU8sR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUN6RCxPQUFPLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEUsQ0FBQztLQUFBO0lBRUssYUFBYTs7WUFDakIsTUFBTSxFQUFDLEtBQUssRUFBRSxNQUFNLEVBQUMsR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDckQsTUFBTSxFQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBQyxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUMzRCxPQUFPLEVBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDLENBQUM7UUFDcEMsQ0FBQztLQUFBO0lBRUssV0FBVyxDQUFDLElBQVk7O1lBQzVCLE9BQU8sT0FBTyxDQUFDLGFBQWEsQ0FBQyxtQ0FBbUMsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3hGLENBQUM7S0FBQTtJQUVLLGFBQWEsQ0FBQyxLQUFhOztZQUMvQixPQUFPLE9BQU8sQ0FBQyxhQUFhLENBQUMsbUNBQW1DLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN6RixDQUFDO0tBQUE7SUFFSyxhQUFhLENBQUMsR0FBRyxhQUF1Qjs7WUFDNUMsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDekQsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyx5Q0FBeUM7WUFFakYsSUFBSSxPQUFPLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUU7Z0JBQ2xDLGlFQUFpRTtnQkFDakUsK0RBQStEO2dCQUMvRCxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBRTdCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUN2QyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUU7d0JBQ2xCLG9GQUFvRjt3QkFDcEYsc0ZBQXNGO3dCQUN0RixNQUFNLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUN2RCxNQUFNLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDekIsTUFBTSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztxQkFDdEQ7aUJBQ0Y7YUFDRjtRQUNILENBQUM7S0FBQTtJQUVLLGVBQWUsQ0FBQyxRQUFnQjs7WUFDbEMsT0FBTyxPQUFPLENBQUMsYUFBYSxDQUFDOzs7V0FHeEIsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ25DLENBQUM7S0FBQTtJQUVLLFNBQVM7O1lBQ2IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUM7UUFDeEUsQ0FBQztLQUFBO0lBRUssYUFBYSxDQUFDLElBQVk7O1lBQzlCLE9BQU8sT0FBTyxDQUFDLGFBQWEsQ0FBQyxjQUFjLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNuRSxDQUFDO0tBQUE7SUFFRCx5RUFBeUU7SUFDM0QsMkJBQTJCLENBQ3ZDLElBQXdDLEVBQ3hDLE1BQWU7O1lBQ2YsNEVBQTRFO1lBQzVFLDhGQUE4RjtZQUM5Rix5QkFBeUI7WUFDekIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFFdkUsTUFBTSxPQUFPLENBQUMsT0FBTyxFQUFFO2lCQUNwQixTQUFTLENBQUMsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxFQUFFLEdBQUcsVUFBVSxDQUFDO2lCQUM1RCxLQUFLLENBQUMsTUFBTSxDQUFDO2lCQUNiLE9BQU8sRUFBRSxDQUFDO1FBQ2YsQ0FBQztLQUFBO0NBQ0Y7QUFFRDs7OztHQUlHO0FBQ0gsU0FBUyxjQUFjLENBQUMsSUFBWSxFQUFFLE9BQXNCO0lBQzFELE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDNUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0QixpR0FBaUc7SUFDakcsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2xDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgX2dldFRleHRXaXRoRXhjbHVkZWRFbGVtZW50cyxcbiAgRWxlbWVudERpbWVuc2lvbnMsXG4gIE1vZGlmaWVyS2V5cyxcbiAgVGVzdEVsZW1lbnQsXG4gIFRlc3RLZXksXG4gIFRleHRPcHRpb25zXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay90ZXN0aW5nJztcbmltcG9ydCB7YnJvd3NlciwgQnV0dG9uLCBieSwgRWxlbWVudEZpbmRlciwgS2V5fSBmcm9tICdwcm90cmFjdG9yJztcblxuLyoqIE1hcHMgdGhlIGBUZXN0S2V5YCBjb25zdGFudHMgdG8gUHJvdHJhY3RvcidzIGBLZXlgIGNvbnN0YW50cy4gKi9cbmNvbnN0IGtleU1hcCA9IHtcbiAgW1Rlc3RLZXkuQkFDS1NQQUNFXTogS2V5LkJBQ0tfU1BBQ0UsXG4gIFtUZXN0S2V5LlRBQl06IEtleS5UQUIsXG4gIFtUZXN0S2V5LkVOVEVSXTogS2V5LkVOVEVSLFxuICBbVGVzdEtleS5TSElGVF06IEtleS5TSElGVCxcbiAgW1Rlc3RLZXkuQ09OVFJPTF06IEtleS5DT05UUk9MLFxuICBbVGVzdEtleS5BTFRdOiBLZXkuQUxULFxuICBbVGVzdEtleS5FU0NBUEVdOiBLZXkuRVNDQVBFLFxuICBbVGVzdEtleS5QQUdFX1VQXTogS2V5LlBBR0VfVVAsXG4gIFtUZXN0S2V5LlBBR0VfRE9XTl06IEtleS5QQUdFX0RPV04sXG4gIFtUZXN0S2V5LkVORF06IEtleS5FTkQsXG4gIFtUZXN0S2V5LkhPTUVdOiBLZXkuSE9NRSxcbiAgW1Rlc3RLZXkuTEVGVF9BUlJPV106IEtleS5BUlJPV19MRUZULFxuICBbVGVzdEtleS5VUF9BUlJPV106IEtleS5BUlJPV19VUCxcbiAgW1Rlc3RLZXkuUklHSFRfQVJST1ddOiBLZXkuQVJST1dfUklHSFQsXG4gIFtUZXN0S2V5LkRPV05fQVJST1ddOiBLZXkuQVJST1dfRE9XTixcbiAgW1Rlc3RLZXkuSU5TRVJUXTogS2V5LklOU0VSVCxcbiAgW1Rlc3RLZXkuREVMRVRFXTogS2V5LkRFTEVURSxcbiAgW1Rlc3RLZXkuRjFdOiBLZXkuRjEsXG4gIFtUZXN0S2V5LkYyXTogS2V5LkYyLFxuICBbVGVzdEtleS5GM106IEtleS5GMyxcbiAgW1Rlc3RLZXkuRjRdOiBLZXkuRjQsXG4gIFtUZXN0S2V5LkY1XTogS2V5LkY1LFxuICBbVGVzdEtleS5GNl06IEtleS5GNixcbiAgW1Rlc3RLZXkuRjddOiBLZXkuRjcsXG4gIFtUZXN0S2V5LkY4XTogS2V5LkY4LFxuICBbVGVzdEtleS5GOV06IEtleS5GOSxcbiAgW1Rlc3RLZXkuRjEwXTogS2V5LkYxMCxcbiAgW1Rlc3RLZXkuRjExXTogS2V5LkYxMSxcbiAgW1Rlc3RLZXkuRjEyXTogS2V5LkYxMixcbiAgW1Rlc3RLZXkuTUVUQV06IEtleS5NRVRBXG59O1xuXG4vKiogQ29udmVydHMgYSBgTW9kaWZpZXJLZXlzYCBvYmplY3QgdG8gYSBsaXN0IG9mIFByb3RyYWN0b3IgYEtleWBzLiAqL1xuZnVuY3Rpb24gdG9Qcm90cmFjdG9yTW9kaWZpZXJLZXlzKG1vZGlmaWVyczogTW9kaWZpZXJLZXlzKTogc3RyaW5nW10ge1xuICBjb25zdCByZXN1bHQ6IHN0cmluZ1tdID0gW107XG4gIGlmIChtb2RpZmllcnMuY29udHJvbCkge1xuICAgIHJlc3VsdC5wdXNoKEtleS5DT05UUk9MKTtcbiAgfVxuICBpZiAobW9kaWZpZXJzLmFsdCkge1xuICAgIHJlc3VsdC5wdXNoKEtleS5BTFQpO1xuICB9XG4gIGlmIChtb2RpZmllcnMuc2hpZnQpIHtcbiAgICByZXN1bHQucHVzaChLZXkuU0hJRlQpO1xuICB9XG4gIGlmIChtb2RpZmllcnMubWV0YSkge1xuICAgIHJlc3VsdC5wdXNoKEtleS5NRVRBKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKiogQSBgVGVzdEVsZW1lbnRgIGltcGxlbWVudGF0aW9uIGZvciBQcm90cmFjdG9yLiAqL1xuZXhwb3J0IGNsYXNzIFByb3RyYWN0b3JFbGVtZW50IGltcGxlbWVudHMgVGVzdEVsZW1lbnQge1xuICBjb25zdHJ1Y3RvcihyZWFkb25seSBlbGVtZW50OiBFbGVtZW50RmluZGVyKSB7fVxuXG4gIGFzeW5jIGJsdXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIGJyb3dzZXIuZXhlY3V0ZVNjcmlwdCgnYXJndW1lbnRzWzBdLmJsdXIoKScsIHRoaXMuZWxlbWVudCk7XG4gIH1cblxuICBhc3luYyBjbGVhcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50LmNsZWFyKCk7XG4gIH1cblxuICBhc3luYyBjbGljayguLi5hcmdzOiBbXSB8IFsnY2VudGVyJ10gfCBbbnVtYmVyLCBudW1iZXJdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5fZGlzcGF0Y2hDbGlja0V2ZW50U2VxdWVuY2UoYXJncyk7XG4gIH1cblxuICBhc3luYyByaWdodENsaWNrKC4uLmFyZ3M6IFtdIHwgWydjZW50ZXInXSB8IFtudW1iZXIsIG51bWJlcl0pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLl9kaXNwYXRjaENsaWNrRXZlbnRTZXF1ZW5jZShhcmdzLCBCdXR0b24uUklHSFQpO1xuICB9XG5cbiAgYXN5bmMgZm9jdXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIGJyb3dzZXIuZXhlY3V0ZVNjcmlwdCgnYXJndW1lbnRzWzBdLmZvY3VzKCknLCB0aGlzLmVsZW1lbnQpO1xuICB9XG5cbiAgYXN5bmMgZ2V0Q3NzVmFsdWUocHJvcGVydHk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudC5nZXRDc3NWYWx1ZShwcm9wZXJ0eSk7XG4gIH1cblxuICBhc3luYyBob3ZlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gYnJvd3Nlci5hY3Rpb25zKClcbiAgICAgICAgLm1vdXNlTW92ZShhd2FpdCB0aGlzLmVsZW1lbnQuZ2V0V2ViRWxlbWVudCgpKVxuICAgICAgICAucGVyZm9ybSgpO1xuICB9XG5cbiAgYXN5bmMgbW91c2VBd2F5KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBicm93c2VyLmFjdGlvbnMoKVxuICAgICAgICAubW91c2VNb3ZlKGF3YWl0IHRoaXMuZWxlbWVudC5nZXRXZWJFbGVtZW50KCksIHt4OiAtMSwgeTogLTF9KVxuICAgICAgICAucGVyZm9ybSgpO1xuICB9XG5cbiAgYXN5bmMgc2VuZEtleXMoLi4ua2V5czogKHN0cmluZyB8IFRlc3RLZXkpW10pOiBQcm9taXNlPHZvaWQ+O1xuICBhc3luYyBzZW5kS2V5cyhtb2RpZmllcnM6IE1vZGlmaWVyS2V5cywgLi4ua2V5czogKHN0cmluZyB8IFRlc3RLZXkpW10pOiBQcm9taXNlPHZvaWQ+O1xuICBhc3luYyBzZW5kS2V5cyguLi5tb2RpZmllcnNBbmRLZXlzOiBhbnlbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZpcnN0ID0gbW9kaWZpZXJzQW5kS2V5c1swXTtcbiAgICBsZXQgbW9kaWZpZXJzOiBNb2RpZmllcktleXM7XG4gICAgbGV0IHJlc3Q6IChzdHJpbmcgfCBUZXN0S2V5KVtdO1xuICAgIGlmICh0eXBlb2YgZmlyc3QgIT09ICdzdHJpbmcnICYmIHR5cGVvZiBmaXJzdCAhPT0gJ251bWJlcicpIHtcbiAgICAgIG1vZGlmaWVycyA9IGZpcnN0O1xuICAgICAgcmVzdCA9IG1vZGlmaWVyc0FuZEtleXMuc2xpY2UoMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1vZGlmaWVycyA9IHt9O1xuICAgICAgcmVzdCA9IG1vZGlmaWVyc0FuZEtleXM7XG4gICAgfVxuXG4gICAgY29uc3QgbW9kaWZpZXJLZXlzID0gdG9Qcm90cmFjdG9yTW9kaWZpZXJLZXlzKG1vZGlmaWVycyk7XG4gICAgY29uc3Qga2V5cyA9IHJlc3QubWFwKGsgPT4gdHlwZW9mIGsgPT09ICdzdHJpbmcnID8gay5zcGxpdCgnJykgOiBba2V5TWFwW2tdXSlcbiAgICAgICAgLnJlZHVjZSgoYXJyLCBrKSA9PiBhcnIuY29uY2F0KGspLCBbXSlcbiAgICAgICAgLy8gS2V5LmNob3JkIGRvZXNuJ3Qgd29yayB3ZWxsIHdpdGggZ2Vja29kcml2ZXIgKG1vemlsbGEvZ2Vja29kcml2ZXIjMTUwMiksXG4gICAgICAgIC8vIHNvIGF2b2lkIGl0IGlmIG5vIG1vZGlmaWVyIGtleXMgYXJlIHJlcXVpcmVkLlxuICAgICAgICAubWFwKGsgPT4gbW9kaWZpZXJLZXlzLmxlbmd0aCA+IDAgPyBLZXkuY2hvcmQoLi4ubW9kaWZpZXJLZXlzLCBrKSA6IGspO1xuXG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudC5zZW5kS2V5cyguLi5rZXlzKTtcbiAgfVxuXG4gIGFzeW5jIHRleHQob3B0aW9ucz86IFRleHRPcHRpb25zKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAob3B0aW9ucz8uZXhjbHVkZSkge1xuICAgICAgcmV0dXJuIGJyb3dzZXIuZXhlY3V0ZVNjcmlwdChfZ2V0VGV4dFdpdGhFeGNsdWRlZEVsZW1lbnRzLCB0aGlzLmVsZW1lbnQsIG9wdGlvbnMuZXhjbHVkZSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZ2V0VGV4dCgpO1xuICB9XG5cbiAgYXN5bmMgZ2V0QXR0cmlidXRlKG5hbWU6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nfG51bGw+IHtcbiAgICByZXR1cm4gYnJvd3Nlci5leGVjdXRlU2NyaXB0KFxuICAgICAgICBgcmV0dXJuIGFyZ3VtZW50c1swXS5nZXRBdHRyaWJ1dGUoYXJndW1lbnRzWzFdKWAsIHRoaXMuZWxlbWVudCwgbmFtZSk7XG4gIH1cblxuICBhc3luYyBoYXNDbGFzcyhuYW1lOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBjbGFzc2VzID0gKGF3YWl0IHRoaXMuZ2V0QXR0cmlidXRlKCdjbGFzcycpKSB8fCAnJztcbiAgICByZXR1cm4gbmV3IFNldChjbGFzc2VzLnNwbGl0KC9cXHMrLykuZmlsdGVyKGMgPT4gYykpLmhhcyhuYW1lKTtcbiAgfVxuXG4gIGFzeW5jIGdldERpbWVuc2lvbnMoKTogUHJvbWlzZTxFbGVtZW50RGltZW5zaW9ucz4ge1xuICAgIGNvbnN0IHt3aWR0aCwgaGVpZ2h0fSA9IGF3YWl0IHRoaXMuZWxlbWVudC5nZXRTaXplKCk7XG4gICAgY29uc3Qge3g6IGxlZnQsIHk6IHRvcH0gPSBhd2FpdCB0aGlzLmVsZW1lbnQuZ2V0TG9jYXRpb24oKTtcbiAgICByZXR1cm4ge3dpZHRoLCBoZWlnaHQsIGxlZnQsIHRvcH07XG4gIH1cblxuICBhc3luYyBnZXRQcm9wZXJ0eShuYW1lOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiBicm93c2VyLmV4ZWN1dGVTY3JpcHQoYHJldHVybiBhcmd1bWVudHNbMF1bYXJndW1lbnRzWzFdXWAsIHRoaXMuZWxlbWVudCwgbmFtZSk7XG4gIH1cblxuICBhc3luYyBzZXRJbnB1dFZhbHVlKHZhbHVlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gYnJvd3Nlci5leGVjdXRlU2NyaXB0KGBhcmd1bWVudHNbMF0udmFsdWUgPSBhcmd1bWVudHNbMV1gLCB0aGlzLmVsZW1lbnQsIHZhbHVlKTtcbiAgfVxuXG4gIGFzeW5jIHNlbGVjdE9wdGlvbnMoLi4ub3B0aW9uSW5kZXhlczogbnVtYmVyW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBvcHRpb25zID0gYXdhaXQgdGhpcy5lbGVtZW50LmFsbChieS5jc3MoJ29wdGlvbicpKTtcbiAgICBjb25zdCBpbmRleGVzID0gbmV3IFNldChvcHRpb25JbmRleGVzKTsgLy8gQ29udmVydCB0byBhIHNldCB0byByZW1vdmUgZHVwbGljYXRlcy5cblxuICAgIGlmIChvcHRpb25zLmxlbmd0aCAmJiBpbmRleGVzLnNpemUpIHtcbiAgICAgIC8vIFJlc2V0IHRoZSB2YWx1ZSBzbyBhbGwgdGhlIHNlbGVjdGVkIHN0YXRlcyBhcmUgY2xlYXJlZC4gV2UgY2FuXG4gICAgICAvLyByZXVzZSB0aGUgaW5wdXQtc3BlY2lmaWMgbWV0aG9kIHNpbmNlIHRoZSBsb2dpYyBpcyB0aGUgc2FtZS5cbiAgICAgIGF3YWl0IHRoaXMuc2V0SW5wdXRWYWx1ZSgnJyk7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb3B0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoaW5kZXhlcy5oYXMoaSkpIHtcbiAgICAgICAgICAvLyBXZSBoYXZlIHRvIGhvbGQgdGhlIGNvbnRyb2wga2V5IHdoaWxlIGNsaWNraW5nIG9uIG9wdGlvbnMgc28gdGhhdCBtdWx0aXBsZSBjYW4gYmVcbiAgICAgICAgICAvLyBzZWxlY3RlZCBpbiBtdWx0aS1zZWxlY3Rpb24gbW9kZS4gVGhlIGtleSBkb2Vzbid0IGRvIGFueXRoaW5nIGZvciBzaW5nbGUgc2VsZWN0aW9uLlxuICAgICAgICAgIGF3YWl0IGJyb3dzZXIuYWN0aW9ucygpLmtleURvd24oS2V5LkNPTlRST0wpLnBlcmZvcm0oKTtcbiAgICAgICAgICBhd2FpdCBvcHRpb25zW2ldLmNsaWNrKCk7XG4gICAgICAgICAgYXdhaXQgYnJvd3Nlci5hY3Rpb25zKCkua2V5VXAoS2V5LkNPTlRST0wpLnBlcmZvcm0oKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIG1hdGNoZXNTZWxlY3RvcihzZWxlY3Rvcjogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICByZXR1cm4gYnJvd3Nlci5leGVjdXRlU2NyaXB0KGBcbiAgICAgICAgICByZXR1cm4gKEVsZW1lbnQucHJvdG90eXBlLm1hdGNoZXMgfHxcbiAgICAgICAgICAgICAgICAgIEVsZW1lbnQucHJvdG90eXBlLm1zTWF0Y2hlc1NlbGVjdG9yKS5jYWxsKGFyZ3VtZW50c1swXSwgYXJndW1lbnRzWzFdKVxuICAgICAgICAgIGAsIHRoaXMuZWxlbWVudCwgc2VsZWN0b3IpO1xuICB9XG5cbiAgYXN5bmMgaXNGb2N1c2VkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZXF1YWxzKGJyb3dzZXIuZHJpdmVyLnN3aXRjaFRvKCkuYWN0aXZlRWxlbWVudCgpKTtcbiAgfVxuXG4gIGFzeW5jIGRpc3BhdGNoRXZlbnQobmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIGJyb3dzZXIuZXhlY3V0ZVNjcmlwdChfZGlzcGF0Y2hFdmVudCwgbmFtZSwgdGhpcy5lbGVtZW50KTtcbiAgfVxuXG4gIC8qKiBEaXNwYXRjaGVzIGFsbCB0aGUgZXZlbnRzIHRoYXQgYXJlIHBhcnQgb2YgYSBjbGljayBldmVudCBzZXF1ZW5jZS4gKi9cbiAgcHJpdmF0ZSBhc3luYyBfZGlzcGF0Y2hDbGlja0V2ZW50U2VxdWVuY2UoXG4gICAgYXJnczogW10gfCBbJ2NlbnRlciddIHwgW251bWJlciwgbnVtYmVyXSxcbiAgICBidXR0b24/OiBzdHJpbmcpIHtcbiAgICAvLyBPbWl0dGluZyB0aGUgb2Zmc2V0IGFyZ3VtZW50IHRvIG1vdXNlTW92ZSByZXN1bHRzIGluIGNsaWNraW5nIHRoZSBjZW50ZXIuXG4gICAgLy8gVGhpcyBpcyB0aGUgZGVmYXVsdCBiZWhhdmlvciB3ZSB3YW50LCBzbyB3ZSB1c2UgYW4gZW1wdHkgYXJyYXkgb2Ygb2Zmc2V0QXJncyBpZiBubyBhcmdzIGFyZVxuICAgIC8vIHBhc3NlZCB0byB0aGlzIG1ldGhvZC5cbiAgICBjb25zdCBvZmZzZXRBcmdzID0gYXJncy5sZW5ndGggPT09IDIgPyBbe3g6IGFyZ3NbMF0sIHk6IGFyZ3NbMV19XSA6IFtdO1xuXG4gICAgYXdhaXQgYnJvd3Nlci5hY3Rpb25zKClcbiAgICAgIC5tb3VzZU1vdmUoYXdhaXQgdGhpcy5lbGVtZW50LmdldFdlYkVsZW1lbnQoKSwgLi4ub2Zmc2V0QXJncylcbiAgICAgIC5jbGljayhidXR0b24pXG4gICAgICAucGVyZm9ybSgpO1xuICB9XG59XG5cbi8qKlxuICogRGlzcGF0Y2hlcyBhbiBldmVudCB3aXRoIGEgcGFydGljdWxhciBuYW1lIGFuZCBkYXRhIHRvIGFuIGVsZW1lbnQuXG4gKiBOb3RlIHRoYXQgdGhpcyBuZWVkcyB0byBiZSBhIHB1cmUgZnVuY3Rpb24sIGJlY2F1c2UgaXQgZ2V0cyBzdHJpbmdpZmllZCBieVxuICogUHJvdHJhY3RvciBhbmQgaXMgZXhlY3V0ZWQgaW5zaWRlIHRoZSBicm93c2VyLlxuICovXG5mdW5jdGlvbiBfZGlzcGF0Y2hFdmVudChuYW1lOiBzdHJpbmcsIGVsZW1lbnQ6IEVsZW1lbnRGaW5kZXIpIHtcbiAgY29uc3QgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnRXZlbnQnKTtcbiAgZXZlbnQuaW5pdEV2ZW50KG5hbWUpO1xuICAvLyBUaGlzIHR5cGUgaGFzIGEgc3RyaW5nIGluZGV4IHNpZ25hdHVyZSwgc28gd2UgY2Fubm90IGFjY2VzcyBpdCB1c2luZyBhIGRvdHRlZCBwcm9wZXJ0eSBhY2Nlc3MuXG4gIGVsZW1lbnRbJ2Rpc3BhdGNoRXZlbnQnXShldmVudCk7XG59XG4iXX0=