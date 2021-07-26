/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __awaiter } from "tslib";
import { _getTextWithExcludedElements } from '@angular/cdk/testing';
import * as webdriver from 'selenium-webdriver';
import { getSeleniumWebDriverModifierKeys, seleniumWebDriverKeyMap } from './selenium-webdriver-keys';
/** A `TestElement` implementation for WebDriver. */
export class SeleniumWebDriverElement {
    constructor(element, _stabilize) {
        this.element = element;
        this._stabilize = _stabilize;
    }
    /** Blur the element. */
    blur() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._executeScript(((element) => element.blur()), this.element());
            yield this._stabilize();
        });
    }
    /** Clear the element's input (for input and textarea elements only). */
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.element().clear();
            yield this._stabilize();
        });
    }
    click(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._dispatchClickEventSequence(args, webdriver.Button.LEFT);
            yield this._stabilize();
        });
    }
    rightClick(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._dispatchClickEventSequence(args, webdriver.Button.RIGHT);
            yield this._stabilize();
        });
    }
    /** Focus the element. */
    focus() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._executeScript((element) => element.focus(), this.element());
            yield this._stabilize();
        });
    }
    /** Get the computed value of the given CSS property for the element. */
    getCssValue(property) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._stabilize();
            return this.element().getCssValue(property);
        });
    }
    /** Hovers the mouse over the element. */
    hover() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._actions().mouseMove(this.element()).perform();
            yield this._stabilize();
        });
    }
    /** Moves the mouse away from the element. */
    mouseAway() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._actions().mouseMove(this.element(), { x: -1, y: -1 }).perform();
            yield this._stabilize();
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
            const modifierKeys = getSeleniumWebDriverModifierKeys(modifiers);
            const keys = rest.map(k => typeof k === 'string' ? k.split('') : [seleniumWebDriverKeyMap[k]])
                .reduce((arr, k) => arr.concat(k), [])
                // webdriver.Key.chord doesn't work well with geckodriver (mozilla/geckodriver#1502),
                // so avoid it if no modifier keys are required.
                .map(k => modifierKeys.length > 0 ? webdriver.Key.chord(...modifierKeys, k) : k);
            yield this.element().sendKeys(...keys);
            yield this._stabilize();
        });
    }
    /**
     * Gets the text from the element.
     * @param options Options that affect what text is included.
     */
    text(options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._stabilize();
            if (options === null || options === void 0 ? void 0 : options.exclude) {
                return this._executeScript(_getTextWithExcludedElements, this.element(), options.exclude);
            }
            // We don't go through the WebDriver `getText`, because it excludes text from hidden elements.
            return this._executeScript((element) => (element.textContent || '').trim(), this.element());
        });
    }
    /** Gets the value for the given attribute from the element. */
    getAttribute(name) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._stabilize();
            return this._executeScript((element, attribute) => element.getAttribute(attribute), this.element(), name);
        });
    }
    /** Checks whether the element has the given class. */
    hasClass(name) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._stabilize();
            const classes = (yield this.getAttribute('class')) || '';
            return new Set(classes.split(/\s+/).filter(c => c)).has(name);
        });
    }
    /** Gets the dimensions of the element. */
    getDimensions() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._stabilize();
            const { width, height } = yield this.element().getSize();
            const { x: left, y: top } = yield this.element().getLocation();
            return { width, height, left, top };
        });
    }
    /** Gets the value of a property of an element. */
    getProperty(name) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._stabilize();
            return this._executeScript((element, property) => element[property], this.element(), name);
        });
    }
    /** Sets the value of a property of an input. */
    setInputValue(newValue) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._executeScript((element, value) => element.value = value, this.element(), newValue);
            yield this._stabilize();
        });
    }
    /** Selects the options at the specified indexes inside of a native `select` element. */
    selectOptions(...optionIndexes) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._stabilize();
            const options = yield this.element().findElements(webdriver.By.css('option'));
            const indexes = new Set(optionIndexes); // Convert to a set to remove duplicates.
            if (options.length && indexes.size) {
                // Reset the value so all the selected states are cleared. We can
                // reuse the input-specific method since the logic is the same.
                yield this.setInputValue('');
                for (let i = 0; i < options.length; i++) {
                    if (indexes.has(i)) {
                        // We have to hold the control key while clicking on options so that multiple can be
                        // selected in multi-selection mode. The key doesn't do anything for single selection.
                        yield this._actions().keyDown(webdriver.Key.CONTROL).perform();
                        yield options[i].click();
                        yield this._actions().keyUp(webdriver.Key.CONTROL).perform();
                    }
                }
                yield this._stabilize();
            }
        });
    }
    /** Checks whether this element matches the given selector. */
    matchesSelector(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._stabilize();
            return this._executeScript((element, s) => (Element.prototype.matches || Element.prototype.msMatchesSelector)
                .call(element, s), this.element(), selector);
        });
    }
    /** Checks whether the element is focused. */
    isFocused() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._stabilize();
            return webdriver.WebElement.equals(this.element(), this.element().getDriver().switchTo().activeElement());
        });
    }
    /**
     * Dispatches an event with a particular name.
     * @param name Name of the event to be dispatched.
     */
    dispatchEvent(name, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._executeScript(dispatchEvent, name, this.element(), data);
            yield this._stabilize();
        });
    }
    /** Gets the webdriver action sequence. */
    _actions() {
        return this.element().getDriver().actions();
    }
    /** Executes a function in the browser. */
    _executeScript(script, ...var_args) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.element().getDriver().executeScript(script, ...var_args);
        });
    }
    /** Dispatches all the events that are part of a click event sequence. */
    _dispatchClickEventSequence(args, button) {
        return __awaiter(this, void 0, void 0, function* () {
            let modifiers = {};
            if (args.length && typeof args[args.length - 1] === 'object') {
                modifiers = args.pop();
            }
            const modifierKeys = getSeleniumWebDriverModifierKeys(modifiers);
            // Omitting the offset argument to mouseMove results in clicking the center.
            // This is the default behavior we want, so we use an empty array of offsetArgs if
            // no args remain after popping the modifiers from the args passed to this function.
            const offsetArgs = (args.length === 2 ?
                [{ x: args[0], y: args[1] }] : []);
            let actions = this._actions().mouseMove(this.element(), ...offsetArgs);
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
 * Dispatches an event with a particular name and data to an element. Note that this needs to be a
 * pure function, because it gets stringified by WebDriver and is executed inside the browser.
 */
function dispatchEvent(name, element, data) {
    const event = document.createEvent('Event');
    event.initEvent(name);
    // tslint:disable-next-line:ban Have to use `Object.assign` to preserve the original object.
    Object.assign(event, data || {});
    element.dispatchEvent(event);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZW5pdW0td2ViLWRyaXZlci1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3NlbGVuaXVtLXdlYmRyaXZlci9zZWxlbml1bS13ZWItZHJpdmVyLWVsZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFDTCw0QkFBNEIsRUFPN0IsTUFBTSxzQkFBc0IsQ0FBQztBQUM5QixPQUFPLEtBQUssU0FBUyxNQUFNLG9CQUFvQixDQUFDO0FBQ2hELE9BQU8sRUFBQyxnQ0FBZ0MsRUFBRSx1QkFBdUIsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBRXBHLG9EQUFvRDtBQUNwRCxNQUFNLE9BQU8sd0JBQXdCO0lBQ25DLFlBQ2EsT0FBbUMsRUFDcEMsVUFBK0I7UUFEOUIsWUFBTyxHQUFQLE9BQU8sQ0FBNEI7UUFDcEMsZUFBVSxHQUFWLFVBQVUsQ0FBcUI7SUFBRyxDQUFDO0lBRS9DLHdCQUF3QjtJQUNsQixJQUFJOztZQUNSLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsT0FBb0IsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDdEYsTUFBTSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDMUIsQ0FBQztLQUFBO0lBRUQsd0VBQXdFO0lBQ2xFLEtBQUs7O1lBQ1QsTUFBTSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDN0IsTUFBTSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDMUIsQ0FBQztLQUFBO0lBaUJLLEtBQUssQ0FBQyxHQUFHLElBQ29COztZQUNqQyxNQUFNLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwRSxNQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUMxQixDQUFDO0tBQUE7SUFTSyxVQUFVLENBQUMsR0FBRyxJQUNlOztZQUNqQyxNQUFNLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNyRSxNQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUMxQixDQUFDO0tBQUE7SUFFRCx5QkFBeUI7SUFDbkIsS0FBSzs7WUFDVCxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxPQUFvQixFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDckYsTUFBTSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDMUIsQ0FBQztLQUFBO0lBRUQsd0VBQXdFO0lBQ2xFLFdBQVcsQ0FBQyxRQUFnQjs7WUFDaEMsTUFBTSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDeEIsT0FBTyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlDLENBQUM7S0FBQTtJQUVELHlDQUF5QztJQUNuQyxLQUFLOztZQUNULE1BQU0sSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUMxRCxNQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUMxQixDQUFDO0tBQUE7SUFFRCw2Q0FBNkM7SUFDdkMsU0FBUzs7WUFDYixNQUFNLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDMUUsTUFBTSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDMUIsQ0FBQztLQUFBO0lBWUssUUFBUSxDQUFDLEdBQUcsZ0JBQXVCOztZQUN2QyxNQUFNLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsQyxJQUFJLFNBQXVCLENBQUM7WUFDNUIsSUFBSSxJQUEwQixDQUFDO1lBQy9CLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRTtnQkFDMUQsU0FBUyxHQUFHLEtBQUssQ0FBQztnQkFDbEIsSUFBSSxHQUFHLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNsQztpQkFBTTtnQkFDTCxTQUFTLEdBQUcsRUFBRSxDQUFDO2dCQUNmLElBQUksR0FBRyxnQkFBZ0IsQ0FBQzthQUN6QjtZQUVELE1BQU0sWUFBWSxHQUFHLGdDQUFnQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDekYsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3RDLHFGQUFxRjtnQkFDckYsZ0RBQWdEO2lCQUMvQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXJGLE1BQU0sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQzFCLENBQUM7S0FBQTtJQUVEOzs7T0FHRztJQUNHLElBQUksQ0FBQyxPQUFxQjs7WUFDOUIsTUFBTSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDeEIsSUFBSSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsT0FBTyxFQUFFO2dCQUNwQixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsNEJBQTRCLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUMzRjtZQUNELDhGQUE4RjtZQUM5RixPQUFPLElBQUksQ0FBQyxjQUFjLENBQ3hCLENBQUMsT0FBZ0IsRUFBRSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsV0FBVyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQzlFLENBQUM7S0FBQTtJQUVELCtEQUErRDtJQUN6RCxZQUFZLENBQUMsSUFBWTs7WUFDN0IsTUFBTSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDeEIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUN0QixDQUFDLE9BQWdCLEVBQUUsU0FBaUIsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsRUFDeEUsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzVCLENBQUM7S0FBQTtJQUVELHNEQUFzRDtJQUNoRCxRQUFRLENBQUMsSUFBWTs7WUFDekIsTUFBTSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDeEIsTUFBTSxPQUFPLEdBQUcsQ0FBQyxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDekQsT0FBTyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hFLENBQUM7S0FBQTtJQUVELDBDQUEwQztJQUNwQyxhQUFhOztZQUNqQixNQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUN4QixNQUFNLEVBQUMsS0FBSyxFQUFFLE1BQU0sRUFBQyxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3ZELE1BQU0sRUFBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUMsR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM3RCxPQUFPLEVBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDLENBQUM7UUFDcEMsQ0FBQztLQUFBO0lBRUQsa0RBQWtEO0lBQzVDLFdBQVcsQ0FBVSxJQUFZOztZQUNyQyxNQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUN4QixPQUFPLElBQUksQ0FBQyxjQUFjLENBQ3RCLENBQUMsT0FBZ0IsRUFBRSxRQUF1QixFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQ2hFLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM1QixDQUFDO0tBQUE7SUFFRCxnREFBZ0Q7SUFDMUMsYUFBYSxDQUFDLFFBQWdCOztZQUNsQyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQ3JCLENBQUMsT0FBeUIsRUFBRSxLQUFhLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsS0FBSyxFQUNuRSxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDOUIsTUFBTSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDMUIsQ0FBQztLQUFBO0lBRUQsd0ZBQXdGO0lBQ2xGLGFBQWEsQ0FBQyxHQUFHLGFBQXVCOztZQUM1QyxNQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUN4QixNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUM5RSxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLHlDQUF5QztZQUVqRixJQUFJLE9BQU8sQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDLElBQUksRUFBRTtnQkFDbEMsaUVBQWlFO2dCQUNqRSwrREFBK0Q7Z0JBQy9ELE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFFN0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQ3ZDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRTt3QkFDbEIsb0ZBQW9GO3dCQUNwRixzRkFBc0Y7d0JBQ3RGLE1BQU0sSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUMvRCxNQUFNLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDekIsTUFBTSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7cUJBQzlEO2lCQUNGO2dCQUVELE1BQU0sSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2FBQ3pCO1FBQ0gsQ0FBQztLQUFBO0lBRUQsOERBQThEO0lBQ3hELGVBQWUsQ0FBQyxRQUFnQjs7WUFDcEMsTUFBTSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDeEIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsT0FBZ0IsRUFBRSxDQUFTLEVBQUUsRUFBRSxDQUN2RCxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxJQUFLLE9BQU8sQ0FBQyxTQUFpQixDQUFDLGlCQUFpQixDQUFDO2lCQUN0RSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxFQUNyQixJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDaEMsQ0FBQztLQUFBO0lBRUQsNkNBQTZDO0lBQ3ZDLFNBQVM7O1lBQ2IsTUFBTSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDeEIsT0FBTyxTQUFTLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FDOUIsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDO1FBQzdFLENBQUM7S0FBQTtJQUVEOzs7T0FHRztJQUNHLGFBQWEsQ0FBQyxJQUFZLEVBQUUsSUFBZ0M7O1lBQ2hFLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxhQUFhLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNyRSxNQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUMxQixDQUFDO0tBQUE7SUFFRCwwQ0FBMEM7SUFDbEMsUUFBUTtRQUNkLE9BQU8sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzlDLENBQUM7SUFFRCwwQ0FBMEM7SUFDNUIsY0FBYyxDQUFJLE1BQWdCLEVBQUUsR0FBRyxRQUFlOztZQUNsRSxPQUFPLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLENBQUM7UUFDdkUsQ0FBQztLQUFBO0lBRUQseUVBQXlFO0lBQzNELDJCQUEyQixDQUNyQyxJQUFtRixFQUNuRixNQUFjOztZQUNoQixJQUFJLFNBQVMsR0FBaUIsRUFBRSxDQUFDO1lBQ2pDLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLFFBQVEsRUFBRTtnQkFDNUQsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQWtCLENBQUM7YUFDeEM7WUFDRCxNQUFNLFlBQVksR0FBRyxnQ0FBZ0MsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUVqRSw0RUFBNEU7WUFDNUUsa0ZBQWtGO1lBQ2xGLG9GQUFvRjtZQUNwRixNQUFNLFVBQVUsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ25DLENBQUMsRUFBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQTZCLENBQUM7WUFFakUsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsR0FBRyxVQUFVLENBQUMsQ0FBQztZQUV2RSxLQUFLLE1BQU0sV0FBVyxJQUFJLFlBQVksRUFBRTtnQkFDdEMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7YUFDeEM7WUFDRCxPQUFPLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNoQyxLQUFLLE1BQU0sV0FBVyxJQUFJLFlBQVksRUFBRTtnQkFDdEMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7YUFDdEM7WUFFRCxNQUFNLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMxQixDQUFDO0tBQUE7Q0FDRjtBQUVEOzs7R0FHRztBQUNILFNBQVMsYUFBYSxDQUFDLElBQVksRUFBRSxPQUFnQixFQUFFLElBQWdDO0lBQ3JGLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDNUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0Qiw0RkFBNEY7SUFDNUYsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ2pDLE9BQU8sQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDL0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBfZ2V0VGV4dFdpdGhFeGNsdWRlZEVsZW1lbnRzLFxuICBFbGVtZW50RGltZW5zaW9ucyxcbiAgRXZlbnREYXRhLFxuICBNb2RpZmllcktleXMsXG4gIFRlc3RFbGVtZW50LFxuICBUZXN0S2V5LFxuICBUZXh0T3B0aW9uc1xufSBmcm9tICdAYW5ndWxhci9jZGsvdGVzdGluZyc7XG5pbXBvcnQgKiBhcyB3ZWJkcml2ZXIgZnJvbSAnc2VsZW5pdW0td2ViZHJpdmVyJztcbmltcG9ydCB7Z2V0U2VsZW5pdW1XZWJEcml2ZXJNb2RpZmllcktleXMsIHNlbGVuaXVtV2ViRHJpdmVyS2V5TWFwfSBmcm9tICcuL3NlbGVuaXVtLXdlYmRyaXZlci1rZXlzJztcblxuLyoqIEEgYFRlc3RFbGVtZW50YCBpbXBsZW1lbnRhdGlvbiBmb3IgV2ViRHJpdmVyLiAqL1xuZXhwb3J0IGNsYXNzIFNlbGVuaXVtV2ViRHJpdmVyRWxlbWVudCBpbXBsZW1lbnRzIFRlc3RFbGVtZW50IHtcbiAgY29uc3RydWN0b3IoXG4gICAgICByZWFkb25seSBlbGVtZW50OiAoKSA9PiB3ZWJkcml2ZXIuV2ViRWxlbWVudCxcbiAgICAgIHByaXZhdGUgX3N0YWJpbGl6ZTogKCkgPT4gUHJvbWlzZTx2b2lkPikge31cblxuICAvKiogQmx1ciB0aGUgZWxlbWVudC4gKi9cbiAgYXN5bmMgYmx1cigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLl9leGVjdXRlU2NyaXB0KCgoZWxlbWVudDogSFRNTEVsZW1lbnQpID0+IGVsZW1lbnQuYmx1cigpKSwgdGhpcy5lbGVtZW50KCkpO1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG5cbiAgLyoqIENsZWFyIHRoZSBlbGVtZW50J3MgaW5wdXQgKGZvciBpbnB1dCBhbmQgdGV4dGFyZWEgZWxlbWVudHMgb25seSkuICovXG4gIGFzeW5jIGNsZWFyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuZWxlbWVudCgpLmNsZWFyKCk7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2xpY2sgdGhlIGVsZW1lbnQgYXQgdGhlIGRlZmF1bHQgbG9jYXRpb24gZm9yIHRoZSBjdXJyZW50IGVudmlyb25tZW50LiBJZiB5b3UgbmVlZCB0byBndWFyYW50ZWVcbiAgICogdGhlIGVsZW1lbnQgaXMgY2xpY2tlZCBhdCBhIHNwZWNpZmljIGxvY2F0aW9uLCBjb25zaWRlciB1c2luZyBgY2xpY2soJ2NlbnRlcicpYCBvclxuICAgKiBgY2xpY2soeCwgeSlgIGluc3RlYWQuXG4gICAqL1xuICBjbGljayhtb2RpZmllcnM/OiBNb2RpZmllcktleXMpOiBQcm9taXNlPHZvaWQ+O1xuICAvKiogQ2xpY2sgdGhlIGVsZW1lbnQgYXQgdGhlIGVsZW1lbnQncyBjZW50ZXIuICovXG4gIGNsaWNrKGxvY2F0aW9uOiAnY2VudGVyJywgbW9kaWZpZXJzPzogTW9kaWZpZXJLZXlzKTogUHJvbWlzZTx2b2lkPjtcbiAgLyoqXG4gICAqIENsaWNrIHRoZSBlbGVtZW50IGF0IHRoZSBzcGVjaWZpZWQgY29vcmRpbmF0ZXMgcmVsYXRpdmUgdG8gdGhlIHRvcC1sZWZ0IG9mIHRoZSBlbGVtZW50LlxuICAgKiBAcGFyYW0gcmVsYXRpdmVYIENvb3JkaW5hdGUgd2l0aGluIHRoZSBlbGVtZW50LCBhbG9uZyB0aGUgWC1heGlzIGF0IHdoaWNoIHRvIGNsaWNrLlxuICAgKiBAcGFyYW0gcmVsYXRpdmVZIENvb3JkaW5hdGUgd2l0aGluIHRoZSBlbGVtZW50LCBhbG9uZyB0aGUgWS1heGlzIGF0IHdoaWNoIHRvIGNsaWNrLlxuICAgKiBAcGFyYW0gbW9kaWZpZXJzIE1vZGlmaWVyIGtleXMgaGVsZCB3aGlsZSBjbGlja2luZ1xuICAgKi9cbiAgY2xpY2socmVsYXRpdmVYOiBudW1iZXIsIHJlbGF0aXZlWTogbnVtYmVyLCBtb2RpZmllcnM/OiBNb2RpZmllcktleXMpOiBQcm9taXNlPHZvaWQ+O1xuICBhc3luYyBjbGljayguLi5hcmdzOiBbTW9kaWZpZXJLZXlzP10gfCBbJ2NlbnRlcicsIE1vZGlmaWVyS2V5cz9dIHxcbiAgICAgIFtudW1iZXIsIG51bWJlciwgTW9kaWZpZXJLZXlzP10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLl9kaXNwYXRjaENsaWNrRXZlbnRTZXF1ZW5jZShhcmdzLCB3ZWJkcml2ZXIuQnV0dG9uLkxFRlQpO1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJpZ2h0IGNsaWNrcyBvbiB0aGUgZWxlbWVudCBhdCB0aGUgc3BlY2lmaWVkIGNvb3JkaW5hdGVzIHJlbGF0aXZlIHRvIHRoZSB0b3AtbGVmdCBvZiBpdC5cbiAgICogQHBhcmFtIHJlbGF0aXZlWCBDb29yZGluYXRlIHdpdGhpbiB0aGUgZWxlbWVudCwgYWxvbmcgdGhlIFgtYXhpcyBhdCB3aGljaCB0byBjbGljay5cbiAgICogQHBhcmFtIHJlbGF0aXZlWSBDb29yZGluYXRlIHdpdGhpbiB0aGUgZWxlbWVudCwgYWxvbmcgdGhlIFktYXhpcyBhdCB3aGljaCB0byBjbGljay5cbiAgICogQHBhcmFtIG1vZGlmaWVycyBNb2RpZmllciBrZXlzIGhlbGQgd2hpbGUgY2xpY2tpbmdcbiAgICovXG4gIHJpZ2h0Q2xpY2socmVsYXRpdmVYOiBudW1iZXIsIHJlbGF0aXZlWTogbnVtYmVyLCBtb2RpZmllcnM/OiBNb2RpZmllcktleXMpOiBQcm9taXNlPHZvaWQ+O1xuICBhc3luYyByaWdodENsaWNrKC4uLmFyZ3M6IFtNb2RpZmllcktleXM/XSB8IFsnY2VudGVyJywgTW9kaWZpZXJLZXlzP10gfFxuICAgICAgW251bWJlciwgbnVtYmVyLCBNb2RpZmllcktleXM/XSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuX2Rpc3BhdGNoQ2xpY2tFdmVudFNlcXVlbmNlKGFyZ3MsIHdlYmRyaXZlci5CdXR0b24uUklHSFQpO1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG5cbiAgLyoqIEZvY3VzIHRoZSBlbGVtZW50LiAqL1xuICBhc3luYyBmb2N1cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLl9leGVjdXRlU2NyaXB0KChlbGVtZW50OiBIVE1MRWxlbWVudCkgPT4gZWxlbWVudC5mb2N1cygpLCB0aGlzLmVsZW1lbnQoKSk7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gIH1cblxuICAvKiogR2V0IHRoZSBjb21wdXRlZCB2YWx1ZSBvZiB0aGUgZ2l2ZW4gQ1NTIHByb3BlcnR5IGZvciB0aGUgZWxlbWVudC4gKi9cbiAgYXN5bmMgZ2V0Q3NzVmFsdWUocHJvcGVydHk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudCgpLmdldENzc1ZhbHVlKHByb3BlcnR5KTtcbiAgfVxuXG4gIC8qKiBIb3ZlcnMgdGhlIG1vdXNlIG92ZXIgdGhlIGVsZW1lbnQuICovXG4gIGFzeW5jIGhvdmVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuX2FjdGlvbnMoKS5tb3VzZU1vdmUodGhpcy5lbGVtZW50KCkpLnBlcmZvcm0oKTtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgfVxuXG4gIC8qKiBNb3ZlcyB0aGUgbW91c2UgYXdheSBmcm9tIHRoZSBlbGVtZW50LiAqL1xuICBhc3luYyBtb3VzZUF3YXkoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5fYWN0aW9ucygpLm1vdXNlTW92ZSh0aGlzLmVsZW1lbnQoKSwge3g6IC0xLCB5OiAtMX0pLnBlcmZvcm0oKTtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kcyB0aGUgZ2l2ZW4gc3RyaW5nIHRvIHRoZSBpbnB1dCBhcyBhIHNlcmllcyBvZiBrZXkgcHJlc3Nlcy4gQWxzbyBmaXJlcyBpbnB1dCBldmVudHNcbiAgICogYW5kIGF0dGVtcHRzIHRvIGFkZCB0aGUgc3RyaW5nIHRvIHRoZSBFbGVtZW50J3MgdmFsdWUuXG4gICAqL1xuICBhc3luYyBzZW5kS2V5cyguLi5rZXlzOiAoc3RyaW5nIHwgVGVzdEtleSlbXSk6IFByb21pc2U8dm9pZD47XG4gIC8qKlxuICAgKiBTZW5kcyB0aGUgZ2l2ZW4gc3RyaW5nIHRvIHRoZSBpbnB1dCBhcyBhIHNlcmllcyBvZiBrZXkgcHJlc3Nlcy4gQWxzbyBmaXJlcyBpbnB1dCBldmVudHNcbiAgICogYW5kIGF0dGVtcHRzIHRvIGFkZCB0aGUgc3RyaW5nIHRvIHRoZSBFbGVtZW50J3MgdmFsdWUuXG4gICAqL1xuICBhc3luYyBzZW5kS2V5cyhtb2RpZmllcnM6IE1vZGlmaWVyS2V5cywgLi4ua2V5czogKHN0cmluZyB8IFRlc3RLZXkpW10pOiBQcm9taXNlPHZvaWQ+O1xuICBhc3luYyBzZW5kS2V5cyguLi5tb2RpZmllcnNBbmRLZXlzOiBhbnlbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZpcnN0ID0gbW9kaWZpZXJzQW5kS2V5c1swXTtcbiAgICBsZXQgbW9kaWZpZXJzOiBNb2RpZmllcktleXM7XG4gICAgbGV0IHJlc3Q6IChzdHJpbmcgfCBUZXN0S2V5KVtdO1xuICAgIGlmICh0eXBlb2YgZmlyc3QgIT09ICdzdHJpbmcnICYmIHR5cGVvZiBmaXJzdCAhPT0gJ251bWJlcicpIHtcbiAgICAgIG1vZGlmaWVycyA9IGZpcnN0O1xuICAgICAgcmVzdCA9IG1vZGlmaWVyc0FuZEtleXMuc2xpY2UoMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1vZGlmaWVycyA9IHt9O1xuICAgICAgcmVzdCA9IG1vZGlmaWVyc0FuZEtleXM7XG4gICAgfVxuXG4gICAgY29uc3QgbW9kaWZpZXJLZXlzID0gZ2V0U2VsZW5pdW1XZWJEcml2ZXJNb2RpZmllcktleXMobW9kaWZpZXJzKTtcbiAgICBjb25zdCBrZXlzID0gcmVzdC5tYXAoayA9PiB0eXBlb2YgayA9PT0gJ3N0cmluZycgPyBrLnNwbGl0KCcnKSA6IFtzZWxlbml1bVdlYkRyaXZlcktleU1hcFtrXV0pXG4gICAgICAgIC5yZWR1Y2UoKGFyciwgaykgPT4gYXJyLmNvbmNhdChrKSwgW10pXG4gICAgICAgIC8vIHdlYmRyaXZlci5LZXkuY2hvcmQgZG9lc24ndCB3b3JrIHdlbGwgd2l0aCBnZWNrb2RyaXZlciAobW96aWxsYS9nZWNrb2RyaXZlciMxNTAyKSxcbiAgICAgICAgLy8gc28gYXZvaWQgaXQgaWYgbm8gbW9kaWZpZXIga2V5cyBhcmUgcmVxdWlyZWQuXG4gICAgICAgIC5tYXAoayA9PiBtb2RpZmllcktleXMubGVuZ3RoID4gMCA/IHdlYmRyaXZlci5LZXkuY2hvcmQoLi4ubW9kaWZpZXJLZXlzLCBrKSA6IGspO1xuXG4gICAgYXdhaXQgdGhpcy5lbGVtZW50KCkuc2VuZEtleXMoLi4ua2V5cyk7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdGV4dCBmcm9tIHRoZSBlbGVtZW50LlxuICAgKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIHRoYXQgYWZmZWN0IHdoYXQgdGV4dCBpcyBpbmNsdWRlZC5cbiAgICovXG4gIGFzeW5jIHRleHQob3B0aW9ucz86IFRleHRPcHRpb25zKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICBpZiAob3B0aW9ucz8uZXhjbHVkZSkge1xuICAgICAgcmV0dXJuIHRoaXMuX2V4ZWN1dGVTY3JpcHQoX2dldFRleHRXaXRoRXhjbHVkZWRFbGVtZW50cywgdGhpcy5lbGVtZW50KCksIG9wdGlvbnMuZXhjbHVkZSk7XG4gICAgfVxuICAgIC8vIFdlIGRvbid0IGdvIHRocm91Z2ggdGhlIFdlYkRyaXZlciBgZ2V0VGV4dGAsIGJlY2F1c2UgaXQgZXhjbHVkZXMgdGV4dCBmcm9tIGhpZGRlbiBlbGVtZW50cy5cbiAgICByZXR1cm4gdGhpcy5fZXhlY3V0ZVNjcmlwdChcbiAgICAgIChlbGVtZW50OiBFbGVtZW50KSA9PiAoZWxlbWVudC50ZXh0Q29udGVudCB8fCAnJykudHJpbSgpLCB0aGlzLmVsZW1lbnQoKSk7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgdmFsdWUgZm9yIHRoZSBnaXZlbiBhdHRyaWJ1dGUgZnJvbSB0aGUgZWxlbWVudC4gKi9cbiAgYXN5bmMgZ2V0QXR0cmlidXRlKG5hbWU6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nfG51bGw+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICByZXR1cm4gdGhpcy5fZXhlY3V0ZVNjcmlwdChcbiAgICAgICAgKGVsZW1lbnQ6IEVsZW1lbnQsIGF0dHJpYnV0ZTogc3RyaW5nKSA9PiBlbGVtZW50LmdldEF0dHJpYnV0ZShhdHRyaWJ1dGUpLFxuICAgICAgICB0aGlzLmVsZW1lbnQoKSwgbmFtZSk7XG4gIH1cblxuICAvKiogQ2hlY2tzIHdoZXRoZXIgdGhlIGVsZW1lbnQgaGFzIHRoZSBnaXZlbiBjbGFzcy4gKi9cbiAgYXN5bmMgaGFzQ2xhc3MobmFtZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgY29uc3QgY2xhc3NlcyA9IChhd2FpdCB0aGlzLmdldEF0dHJpYnV0ZSgnY2xhc3MnKSkgfHwgJyc7XG4gICAgcmV0dXJuIG5ldyBTZXQoY2xhc3Nlcy5zcGxpdCgvXFxzKy8pLmZpbHRlcihjID0+IGMpKS5oYXMobmFtZSk7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgZGltZW5zaW9ucyBvZiB0aGUgZWxlbWVudC4gKi9cbiAgYXN5bmMgZ2V0RGltZW5zaW9ucygpOiBQcm9taXNlPEVsZW1lbnREaW1lbnNpb25zPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgY29uc3Qge3dpZHRoLCBoZWlnaHR9ID0gYXdhaXQgdGhpcy5lbGVtZW50KCkuZ2V0U2l6ZSgpO1xuICAgIGNvbnN0IHt4OiBsZWZ0LCB5OiB0b3B9ID0gYXdhaXQgdGhpcy5lbGVtZW50KCkuZ2V0TG9jYXRpb24oKTtcbiAgICByZXR1cm4ge3dpZHRoLCBoZWlnaHQsIGxlZnQsIHRvcH07XG4gIH1cblxuICAvKiogR2V0cyB0aGUgdmFsdWUgb2YgYSBwcm9wZXJ0eSBvZiBhbiBlbGVtZW50LiAqL1xuICBhc3luYyBnZXRQcm9wZXJ0eTxUID0gYW55PihuYW1lOiBzdHJpbmcpOiBQcm9taXNlPFQ+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICByZXR1cm4gdGhpcy5fZXhlY3V0ZVNjcmlwdChcbiAgICAgICAgKGVsZW1lbnQ6IEVsZW1lbnQsIHByb3BlcnR5OiBrZXlvZiBFbGVtZW50KSA9PiBlbGVtZW50W3Byb3BlcnR5XSxcbiAgICAgICAgdGhpcy5lbGVtZW50KCksIG5hbWUpO1xuICB9XG5cbiAgLyoqIFNldHMgdGhlIHZhbHVlIG9mIGEgcHJvcGVydHkgb2YgYW4gaW5wdXQuICovXG4gIGFzeW5jIHNldElucHV0VmFsdWUobmV3VmFsdWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuX2V4ZWN1dGVTY3JpcHQoXG4gICAgICAgIChlbGVtZW50OiBIVE1MSW5wdXRFbGVtZW50LCB2YWx1ZTogc3RyaW5nKSA9PiBlbGVtZW50LnZhbHVlID0gdmFsdWUsXG4gICAgICAgIHRoaXMuZWxlbWVudCgpLCBuZXdWYWx1ZSk7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gIH1cblxuICAvKiogU2VsZWN0cyB0aGUgb3B0aW9ucyBhdCB0aGUgc3BlY2lmaWVkIGluZGV4ZXMgaW5zaWRlIG9mIGEgbmF0aXZlIGBzZWxlY3RgIGVsZW1lbnQuICovXG4gIGFzeW5jIHNlbGVjdE9wdGlvbnMoLi4ub3B0aW9uSW5kZXhlczogbnVtYmVyW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICBjb25zdCBvcHRpb25zID0gYXdhaXQgdGhpcy5lbGVtZW50KCkuZmluZEVsZW1lbnRzKHdlYmRyaXZlci5CeS5jc3MoJ29wdGlvbicpKTtcbiAgICBjb25zdCBpbmRleGVzID0gbmV3IFNldChvcHRpb25JbmRleGVzKTsgLy8gQ29udmVydCB0byBhIHNldCB0byByZW1vdmUgZHVwbGljYXRlcy5cblxuICAgIGlmIChvcHRpb25zLmxlbmd0aCAmJiBpbmRleGVzLnNpemUpIHtcbiAgICAgIC8vIFJlc2V0IHRoZSB2YWx1ZSBzbyBhbGwgdGhlIHNlbGVjdGVkIHN0YXRlcyBhcmUgY2xlYXJlZC4gV2UgY2FuXG4gICAgICAvLyByZXVzZSB0aGUgaW5wdXQtc3BlY2lmaWMgbWV0aG9kIHNpbmNlIHRoZSBsb2dpYyBpcyB0aGUgc2FtZS5cbiAgICAgIGF3YWl0IHRoaXMuc2V0SW5wdXRWYWx1ZSgnJyk7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb3B0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoaW5kZXhlcy5oYXMoaSkpIHtcbiAgICAgICAgICAvLyBXZSBoYXZlIHRvIGhvbGQgdGhlIGNvbnRyb2wga2V5IHdoaWxlIGNsaWNraW5nIG9uIG9wdGlvbnMgc28gdGhhdCBtdWx0aXBsZSBjYW4gYmVcbiAgICAgICAgICAvLyBzZWxlY3RlZCBpbiBtdWx0aS1zZWxlY3Rpb24gbW9kZS4gVGhlIGtleSBkb2Vzbid0IGRvIGFueXRoaW5nIGZvciBzaW5nbGUgc2VsZWN0aW9uLlxuICAgICAgICAgIGF3YWl0IHRoaXMuX2FjdGlvbnMoKS5rZXlEb3duKHdlYmRyaXZlci5LZXkuQ09OVFJPTCkucGVyZm9ybSgpO1xuICAgICAgICAgIGF3YWl0IG9wdGlvbnNbaV0uY2xpY2soKTtcbiAgICAgICAgICBhd2FpdCB0aGlzLl9hY3Rpb25zKCkua2V5VXAod2ViZHJpdmVyLktleS5DT05UUk9MKS5wZXJmb3JtKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENoZWNrcyB3aGV0aGVyIHRoaXMgZWxlbWVudCBtYXRjaGVzIHRoZSBnaXZlbiBzZWxlY3Rvci4gKi9cbiAgYXN5bmMgbWF0Y2hlc1NlbGVjdG9yKHNlbGVjdG9yOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICByZXR1cm4gdGhpcy5fZXhlY3V0ZVNjcmlwdCgoZWxlbWVudDogRWxlbWVudCwgczogc3RyaW5nKSA9PlxuICAgICAgICAoRWxlbWVudC5wcm90b3R5cGUubWF0Y2hlcyB8fCAoRWxlbWVudC5wcm90b3R5cGUgYXMgYW55KS5tc01hdGNoZXNTZWxlY3RvcilcbiAgICAgICAgICAgIC5jYWxsKGVsZW1lbnQsIHMpLFxuICAgICAgICB0aGlzLmVsZW1lbnQoKSwgc2VsZWN0b3IpO1xuICB9XG5cbiAgLyoqIENoZWNrcyB3aGV0aGVyIHRoZSBlbGVtZW50IGlzIGZvY3VzZWQuICovXG4gIGFzeW5jIGlzRm9jdXNlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICByZXR1cm4gd2ViZHJpdmVyLldlYkVsZW1lbnQuZXF1YWxzKFxuICAgICAgICB0aGlzLmVsZW1lbnQoKSwgdGhpcy5lbGVtZW50KCkuZ2V0RHJpdmVyKCkuc3dpdGNoVG8oKS5hY3RpdmVFbGVtZW50KCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIERpc3BhdGNoZXMgYW4gZXZlbnQgd2l0aCBhIHBhcnRpY3VsYXIgbmFtZS5cbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgZXZlbnQgdG8gYmUgZGlzcGF0Y2hlZC5cbiAgICovXG4gIGFzeW5jIGRpc3BhdGNoRXZlbnQobmFtZTogc3RyaW5nLCBkYXRhPzogUmVjb3JkPHN0cmluZywgRXZlbnREYXRhPik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuX2V4ZWN1dGVTY3JpcHQoZGlzcGF0Y2hFdmVudCwgbmFtZSwgdGhpcy5lbGVtZW50KCksIGRhdGEpO1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIHdlYmRyaXZlciBhY3Rpb24gc2VxdWVuY2UuICovXG4gIHByaXZhdGUgX2FjdGlvbnMoKSB7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudCgpLmdldERyaXZlcigpLmFjdGlvbnMoKTtcbiAgfVxuXG4gIC8qKiBFeGVjdXRlcyBhIGZ1bmN0aW9uIGluIHRoZSBicm93c2VyLiAqL1xuICBwcml2YXRlIGFzeW5jIF9leGVjdXRlU2NyaXB0PFQ+KHNjcmlwdDogRnVuY3Rpb24sIC4uLnZhcl9hcmdzOiBhbnlbXSk6IFByb21pc2U8VD4ge1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnQoKS5nZXREcml2ZXIoKS5leGVjdXRlU2NyaXB0KHNjcmlwdCwgLi4udmFyX2FyZ3MpO1xuICB9XG5cbiAgLyoqIERpc3BhdGNoZXMgYWxsIHRoZSBldmVudHMgdGhhdCBhcmUgcGFydCBvZiBhIGNsaWNrIGV2ZW50IHNlcXVlbmNlLiAqL1xuICBwcml2YXRlIGFzeW5jIF9kaXNwYXRjaENsaWNrRXZlbnRTZXF1ZW5jZShcbiAgICAgIGFyZ3M6IFtNb2RpZmllcktleXM/XSB8IFsnY2VudGVyJywgTW9kaWZpZXJLZXlzP10gfCBbbnVtYmVyLCBudW1iZXIsIE1vZGlmaWVyS2V5cz9dLFxuICAgICAgYnV0dG9uOiBzdHJpbmcpIHtcbiAgICBsZXQgbW9kaWZpZXJzOiBNb2RpZmllcktleXMgPSB7fTtcbiAgICBpZiAoYXJncy5sZW5ndGggJiYgdHlwZW9mIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIG1vZGlmaWVycyA9IGFyZ3MucG9wKCkgYXMgTW9kaWZpZXJLZXlzO1xuICAgIH1cbiAgICBjb25zdCBtb2RpZmllcktleXMgPSBnZXRTZWxlbml1bVdlYkRyaXZlck1vZGlmaWVyS2V5cyhtb2RpZmllcnMpO1xuXG4gICAgLy8gT21pdHRpbmcgdGhlIG9mZnNldCBhcmd1bWVudCB0byBtb3VzZU1vdmUgcmVzdWx0cyBpbiBjbGlja2luZyB0aGUgY2VudGVyLlxuICAgIC8vIFRoaXMgaXMgdGhlIGRlZmF1bHQgYmVoYXZpb3Igd2Ugd2FudCwgc28gd2UgdXNlIGFuIGVtcHR5IGFycmF5IG9mIG9mZnNldEFyZ3MgaWZcbiAgICAvLyBubyBhcmdzIHJlbWFpbiBhZnRlciBwb3BwaW5nIHRoZSBtb2RpZmllcnMgZnJvbSB0aGUgYXJncyBwYXNzZWQgdG8gdGhpcyBmdW5jdGlvbi5cbiAgICBjb25zdCBvZmZzZXRBcmdzID0gKGFyZ3MubGVuZ3RoID09PSAyID9cbiAgICAgICAgW3t4OiBhcmdzWzBdLCB5OiBhcmdzWzFdfV0gOiBbXSkgYXMgW3t4OiBudW1iZXIsIHk6IG51bWJlcn1dO1xuXG4gICAgbGV0IGFjdGlvbnMgPSB0aGlzLl9hY3Rpb25zKCkubW91c2VNb3ZlKHRoaXMuZWxlbWVudCgpLCAuLi5vZmZzZXRBcmdzKTtcblxuICAgIGZvciAoY29uc3QgbW9kaWZpZXJLZXkgb2YgbW9kaWZpZXJLZXlzKSB7XG4gICAgICBhY3Rpb25zID0gYWN0aW9ucy5rZXlEb3duKG1vZGlmaWVyS2V5KTtcbiAgICB9XG4gICAgYWN0aW9ucyA9IGFjdGlvbnMuY2xpY2soYnV0dG9uKTtcbiAgICBmb3IgKGNvbnN0IG1vZGlmaWVyS2V5IG9mIG1vZGlmaWVyS2V5cykge1xuICAgICAgYWN0aW9ucyA9IGFjdGlvbnMua2V5VXAobW9kaWZpZXJLZXkpO1xuICAgIH1cblxuICAgIGF3YWl0IGFjdGlvbnMucGVyZm9ybSgpO1xuICB9XG59XG5cbi8qKlxuICogRGlzcGF0Y2hlcyBhbiBldmVudCB3aXRoIGEgcGFydGljdWxhciBuYW1lIGFuZCBkYXRhIHRvIGFuIGVsZW1lbnQuIE5vdGUgdGhhdCB0aGlzIG5lZWRzIHRvIGJlIGFcbiAqIHB1cmUgZnVuY3Rpb24sIGJlY2F1c2UgaXQgZ2V0cyBzdHJpbmdpZmllZCBieSBXZWJEcml2ZXIgYW5kIGlzIGV4ZWN1dGVkIGluc2lkZSB0aGUgYnJvd3Nlci5cbiAqL1xuZnVuY3Rpb24gZGlzcGF0Y2hFdmVudChuYW1lOiBzdHJpbmcsIGVsZW1lbnQ6IEVsZW1lbnQsIGRhdGE/OiBSZWNvcmQ8c3RyaW5nLCBFdmVudERhdGE+KSB7XG4gIGNvbnN0IGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG4gIGV2ZW50LmluaXRFdmVudChuYW1lKTtcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOmJhbiBIYXZlIHRvIHVzZSBgT2JqZWN0LmFzc2lnbmAgdG8gcHJlc2VydmUgdGhlIG9yaWdpbmFsIG9iamVjdC5cbiAgT2JqZWN0LmFzc2lnbihldmVudCwgZGF0YSB8fCB7fSk7XG4gIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChldmVudCk7XG59XG4iXX0=