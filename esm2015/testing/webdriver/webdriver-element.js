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
import { getWebDriverModifierKeys, webDriverKeyMap } from './webdriver-keys';
/** A `TestElement` implementation for WebDriver. */
export class WebDriverElement {
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
            const modifierKeys = getWebDriverModifierKeys(modifiers);
            const keys = rest.map(k => typeof k === 'string' ? k.split('') : [webDriverKeyMap[k]])
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
            return this.element().getText();
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
            const modifierKeys = getWebDriverModifierKeys(modifiers);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViZHJpdmVyLWVsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Rlc3Rpbmcvd2ViZHJpdmVyL3dlYmRyaXZlci1lbGVtZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQ0wsNEJBQTRCLEVBTzdCLE1BQU0sc0JBQXNCLENBQUM7QUFDOUIsT0FBTyxLQUFLLFNBQVMsTUFBTSxvQkFBb0IsQ0FBQztBQUNoRCxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsZUFBZSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFFM0Usb0RBQW9EO0FBQ3BELE1BQU0sT0FBTyxnQkFBZ0I7SUFDM0IsWUFDYSxPQUFtQyxFQUNwQyxVQUErQjtRQUQ5QixZQUFPLEdBQVAsT0FBTyxDQUE0QjtRQUNwQyxlQUFVLEdBQVYsVUFBVSxDQUFxQjtJQUFHLENBQUM7SUFFL0Msd0JBQXdCO0lBQ2xCLElBQUk7O1lBQ1IsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxPQUFvQixFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUN0RixNQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUMxQixDQUFDO0tBQUE7SUFFRCx3RUFBd0U7SUFDbEUsS0FBSzs7WUFDVCxNQUFNLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUM3QixNQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUMxQixDQUFDO0tBQUE7SUFpQkssS0FBSyxDQUFDLEdBQUcsSUFDb0I7O1lBQ2pDLE1BQU0sSUFBSSxDQUFDLDJCQUEyQixDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BFLE1BQU0sSUFBSSxDQUFDLFVB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QUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0Qiw0RkFBNEY7SUFDNUYsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ2pDLE9BQU8sQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDL0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBfZ2V0VGV4dFdpdGhFeGNsdWRlZEVsZW1lbnRzLFxuICBFbGVtZW50RGltZW5zaW9ucyxcbiAgRXZlbnREYXRhLFxuICBNb2RpZmllcktleXMsXG4gIFRlc3RFbGVtZW50LFxuICBUZXN0S2V5LFxuICBUZXh0T3B0aW9uc1xufSBmcm9tICdAYW5ndWxhci9jZGsvdGVzdGluZyc7XG5pbXBvcnQgKiBhcyB3ZWJkcml2ZXIgZnJvbSAnc2VsZW5pdW0td2ViZHJpdmVyJztcbmltcG9ydCB7Z2V0V2ViRHJpdmVyTW9kaWZpZXJLZXlzLCB3ZWJEcml2ZXJLZXlNYXB9IGZyb20gJy4vd2ViZHJpdmVyLWtleXMnO1xuXG4vKiogQSBgVGVzdEVsZW1lbnRgIGltcGxlbWVudGF0aW9uIGZvciBXZWJEcml2ZXIuICovXG5leHBvcnQgY2xhc3MgV2ViRHJpdmVyRWxlbWVudCBpbXBsZW1lbnRzIFRlc3RFbGVtZW50IHtcbiAgY29uc3RydWN0b3IoXG4gICAgICByZWFkb25seSBlbGVtZW50OiAoKSA9PiB3ZWJkcml2ZXIuV2ViRWxlbWVudCxcbiAgICAgIHByaXZhdGUgX3N0YWJpbGl6ZTogKCkgPT4gUHJvbWlzZTx2b2lkPikge31cblxuICAvKiogQmx1ciB0aGUgZWxlbWVudC4gKi9cbiAgYXN5bmMgYmx1cigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLl9leGVjdXRlU2NyaXB0KCgoZWxlbWVudDogSFRNTEVsZW1lbnQpID0+IGVsZW1lbnQuYmx1cigpKSwgdGhpcy5lbGVtZW50KCkpO1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG5cbiAgLyoqIENsZWFyIHRoZSBlbGVtZW50J3MgaW5wdXQgKGZvciBpbnB1dCBhbmQgdGV4dGFyZWEgZWxlbWVudHMgb25seSkuICovXG4gIGFzeW5jIGNsZWFyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuZWxlbWVudCgpLmNsZWFyKCk7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2xpY2sgdGhlIGVsZW1lbnQgYXQgdGhlIGRlZmF1bHQgbG9jYXRpb24gZm9yIHRoZSBjdXJyZW50IGVudmlyb25tZW50LiBJZiB5b3UgbmVlZCB0byBndWFyYW50ZWVcbiAgICogdGhlIGVsZW1lbnQgaXMgY2xpY2tlZCBhdCBhIHNwZWNpZmljIGxvY2F0aW9uLCBjb25zaWRlciB1c2luZyBgY2xpY2soJ2NlbnRlcicpYCBvclxuICAgKiBgY2xpY2soeCwgeSlgIGluc3RlYWQuXG4gICAqL1xuICBjbGljayhtb2RpZmllcnM/OiBNb2RpZmllcktleXMpOiBQcm9taXNlPHZvaWQ+O1xuICAvKiogQ2xpY2sgdGhlIGVsZW1lbnQgYXQgdGhlIGVsZW1lbnQncyBjZW50ZXIuICovXG4gIGNsaWNrKGxvY2F0aW9uOiAnY2VudGVyJywgbW9kaWZpZXJzPzogTW9kaWZpZXJLZXlzKTogUHJvbWlzZTx2b2lkPjtcbiAgLyoqXG4gICAqIENsaWNrIHRoZSBlbGVtZW50IGF0IHRoZSBzcGVjaWZpZWQgY29vcmRpbmF0ZXMgcmVsYXRpdmUgdG8gdGhlIHRvcC1sZWZ0IG9mIHRoZSBlbGVtZW50LlxuICAgKiBAcGFyYW0gcmVsYXRpdmVYIENvb3JkaW5hdGUgd2l0aGluIHRoZSBlbGVtZW50LCBhbG9uZyB0aGUgWC1heGlzIGF0IHdoaWNoIHRvIGNsaWNrLlxuICAgKiBAcGFyYW0gcmVsYXRpdmVZIENvb3JkaW5hdGUgd2l0aGluIHRoZSBlbGVtZW50LCBhbG9uZyB0aGUgWS1heGlzIGF0IHdoaWNoIHRvIGNsaWNrLlxuICAgKiBAcGFyYW0gbW9kaWZpZXJzIE1vZGlmaWVyIGtleXMgaGVsZCB3aGlsZSBjbGlja2luZ1xuICAgKi9cbiAgY2xpY2socmVsYXRpdmVYOiBudW1iZXIsIHJlbGF0aXZlWTogbnVtYmVyLCBtb2RpZmllcnM/OiBNb2RpZmllcktleXMpOiBQcm9taXNlPHZvaWQ+O1xuICBhc3luYyBjbGljayguLi5hcmdzOiBbTW9kaWZpZXJLZXlzP10gfCBbJ2NlbnRlcicsIE1vZGlmaWVyS2V5cz9dIHxcbiAgICAgIFtudW1iZXIsIG51bWJlciwgTW9kaWZpZXJLZXlzP10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLl9kaXNwYXRjaENsaWNrRXZlbnRTZXF1ZW5jZShhcmdzLCB3ZWJkcml2ZXIuQnV0dG9uLkxFRlQpO1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJpZ2h0IGNsaWNrcyBvbiB0aGUgZWxlbWVudCBhdCB0aGUgc3BlY2lmaWVkIGNvb3JkaW5hdGVzIHJlbGF0aXZlIHRvIHRoZSB0b3AtbGVmdCBvZiBpdC5cbiAgICogQHBhcmFtIHJlbGF0aXZlWCBDb29yZGluYXRlIHdpdGhpbiB0aGUgZWxlbWVudCwgYWxvbmcgdGhlIFgtYXhpcyBhdCB3aGljaCB0byBjbGljay5cbiAgICogQHBhcmFtIHJlbGF0aXZlWSBDb29yZGluYXRlIHdpdGhpbiB0aGUgZWxlbWVudCwgYWxvbmcgdGhlIFktYXhpcyBhdCB3aGljaCB0byBjbGljay5cbiAgICogQHBhcmFtIG1vZGlmaWVycyBNb2RpZmllciBrZXlzIGhlbGQgd2hpbGUgY2xpY2tpbmdcbiAgICovXG4gIHJpZ2h0Q2xpY2socmVsYXRpdmVYOiBudW1iZXIsIHJlbGF0aXZlWTogbnVtYmVyLCBtb2RpZmllcnM/OiBNb2RpZmllcktleXMpOiBQcm9taXNlPHZvaWQ+O1xuICBhc3luYyByaWdodENsaWNrKC4uLmFyZ3M6IFtNb2RpZmllcktleXM/XSB8IFsnY2VudGVyJywgTW9kaWZpZXJLZXlzP10gfFxuICAgICAgW251bWJlciwgbnVtYmVyLCBNb2RpZmllcktleXM/XSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuX2Rpc3BhdGNoQ2xpY2tFdmVudFNlcXVlbmNlKGFyZ3MsIHdlYmRyaXZlci5CdXR0b24uUklHSFQpO1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG5cbiAgLyoqIEZvY3VzIHRoZSBlbGVtZW50LiAqL1xuICBhc3luYyBmb2N1cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLl9leGVjdXRlU2NyaXB0KChlbGVtZW50OiBIVE1MRWxlbWVudCkgPT4gZWxlbWVudC5mb2N1cygpLCB0aGlzLmVsZW1lbnQoKSk7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gIH1cblxuICAvKiogR2V0IHRoZSBjb21wdXRlZCB2YWx1ZSBvZiB0aGUgZ2l2ZW4gQ1NTIHByb3BlcnR5IGZvciB0aGUgZWxlbWVudC4gKi9cbiAgYXN5bmMgZ2V0Q3NzVmFsdWUocHJvcGVydHk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudCgpLmdldENzc1ZhbHVlKHByb3BlcnR5KTtcbiAgfVxuXG4gIC8qKiBIb3ZlcnMgdGhlIG1vdXNlIG92ZXIgdGhlIGVsZW1lbnQuICovXG4gIGFzeW5jIGhvdmVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuX2FjdGlvbnMoKS5tb3VzZU1vdmUodGhpcy5lbGVtZW50KCkpLnBlcmZvcm0oKTtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgfVxuXG4gIC8qKiBNb3ZlcyB0aGUgbW91c2UgYXdheSBmcm9tIHRoZSBlbGVtZW50LiAqL1xuICBhc3luYyBtb3VzZUF3YXkoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5fYWN0aW9ucygpLm1vdXNlTW92ZSh0aGlzLmVsZW1lbnQoKSwge3g6IC0xLCB5OiAtMX0pLnBlcmZvcm0oKTtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kcyB0aGUgZ2l2ZW4gc3RyaW5nIHRvIHRoZSBpbnB1dCBhcyBhIHNlcmllcyBvZiBrZXkgcHJlc3Nlcy4gQWxzbyBmaXJlcyBpbnB1dCBldmVudHNcbiAgICogYW5kIGF0dGVtcHRzIHRvIGFkZCB0aGUgc3RyaW5nIHRvIHRoZSBFbGVtZW50J3MgdmFsdWUuXG4gICAqL1xuICBhc3luYyBzZW5kS2V5cyguLi5rZXlzOiAoc3RyaW5nIHwgVGVzdEtleSlbXSk6IFByb21pc2U8dm9pZD47XG4gIC8qKlxuICAgKiBTZW5kcyB0aGUgZ2l2ZW4gc3RyaW5nIHRvIHRoZSBpbnB1dCBhcyBhIHNlcmllcyBvZiBrZXkgcHJlc3Nlcy4gQWxzbyBmaXJlcyBpbnB1dCBldmVudHNcbiAgICogYW5kIGF0dGVtcHRzIHRvIGFkZCB0aGUgc3RyaW5nIHRvIHRoZSBFbGVtZW50J3MgdmFsdWUuXG4gICAqL1xuICBhc3luYyBzZW5kS2V5cyhtb2RpZmllcnM6IE1vZGlmaWVyS2V5cywgLi4ua2V5czogKHN0cmluZyB8IFRlc3RLZXkpW10pOiBQcm9taXNlPHZvaWQ+O1xuICBhc3luYyBzZW5kS2V5cyguLi5tb2RpZmllcnNBbmRLZXlzOiBhbnlbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZpcnN0ID0gbW9kaWZpZXJzQW5kS2V5c1swXTtcbiAgICBsZXQgbW9kaWZpZXJzOiBNb2RpZmllcktleXM7XG4gICAgbGV0IHJlc3Q6IChzdHJpbmcgfCBUZXN0S2V5KVtdO1xuICAgIGlmICh0eXBlb2YgZmlyc3QgIT09ICdzdHJpbmcnICYmIHR5cGVvZiBmaXJzdCAhPT0gJ251bWJlcicpIHtcbiAgICAgIG1vZGlmaWVycyA9IGZpcnN0O1xuICAgICAgcmVzdCA9IG1vZGlmaWVyc0FuZEtleXMuc2xpY2UoMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1vZGlmaWVycyA9IHt9O1xuICAgICAgcmVzdCA9IG1vZGlmaWVyc0FuZEtleXM7XG4gICAgfVxuXG4gICAgY29uc3QgbW9kaWZpZXJLZXlzID0gZ2V0V2ViRHJpdmVyTW9kaWZpZXJLZXlzKG1vZGlmaWVycyk7XG4gICAgY29uc3Qga2V5cyA9IHJlc3QubWFwKGsgPT4gdHlwZW9mIGsgPT09ICdzdHJpbmcnID8gay5zcGxpdCgnJykgOiBbd2ViRHJpdmVyS2V5TWFwW2tdXSlcbiAgICAgICAgLnJlZHVjZSgoYXJyLCBrKSA9PiBhcnIuY29uY2F0KGspLCBbXSlcbiAgICAgICAgLy8gd2ViZHJpdmVyLktleS5jaG9yZCBkb2Vzbid0IHdvcmsgd2VsbCB3aXRoIGdlY2tvZHJpdmVyIChtb3ppbGxhL2dlY2tvZHJpdmVyIzE1MDIpLFxuICAgICAgICAvLyBzbyBhdm9pZCBpdCBpZiBubyBtb2RpZmllciBrZXlzIGFyZSByZXF1aXJlZC5cbiAgICAgICAgLm1hcChrID0+IG1vZGlmaWVyS2V5cy5sZW5ndGggPiAwID8gd2ViZHJpdmVyLktleS5jaG9yZCguLi5tb2RpZmllcktleXMsIGspIDogayk7XG5cbiAgICBhd2FpdCB0aGlzLmVsZW1lbnQoKS5zZW5kS2V5cyguLi5rZXlzKTtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB0ZXh0IGZyb20gdGhlIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgdGhhdCBhZmZlY3Qgd2hhdCB0ZXh0IGlzIGluY2x1ZGVkLlxuICAgKi9cbiAgYXN5bmMgdGV4dChvcHRpb25zPzogVGV4dE9wdGlvbnMpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIGlmIChvcHRpb25zPy5leGNsdWRlKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZXhlY3V0ZVNjcmlwdChfZ2V0VGV4dFdpdGhFeGNsdWRlZEVsZW1lbnRzLCB0aGlzLmVsZW1lbnQoKSwgb3B0aW9ucy5leGNsdWRlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudCgpLmdldFRleHQoKTtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSB2YWx1ZSBmb3IgdGhlIGdpdmVuIGF0dHJpYnV0ZSBmcm9tIHRoZSBlbGVtZW50LiAqL1xuICBhc3luYyBnZXRBdHRyaWJ1dGUobmFtZTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmd8bnVsbD4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIHJldHVybiB0aGlzLl9leGVjdXRlU2NyaXB0KFxuICAgICAgICAoZWxlbWVudDogRWxlbWVudCwgYXR0cmlidXRlOiBzdHJpbmcpID0+IGVsZW1lbnQuZ2V0QXR0cmlidXRlKGF0dHJpYnV0ZSksXG4gICAgICAgIHRoaXMuZWxlbWVudCgpLCBuYW1lKTtcbiAgfVxuXG4gIC8qKiBDaGVja3Mgd2hldGhlciB0aGUgZWxlbWVudCBoYXMgdGhlIGdpdmVuIGNsYXNzLiAqL1xuICBhc3luYyBoYXNDbGFzcyhuYW1lOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICBjb25zdCBjbGFzc2VzID0gKGF3YWl0IHRoaXMuZ2V0QXR0cmlidXRlKCdjbGFzcycpKSB8fCAnJztcbiAgICByZXR1cm4gbmV3IFNldChjbGFzc2VzLnNwbGl0KC9cXHMrLykuZmlsdGVyKGMgPT4gYykpLmhhcyhuYW1lKTtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBkaW1lbnNpb25zIG9mIHRoZSBlbGVtZW50LiAqL1xuICBhc3luYyBnZXREaW1lbnNpb25zKCk6IFByb21pc2U8RWxlbWVudERpbWVuc2lvbnM+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICBjb25zdCB7d2lkdGgsIGhlaWdodH0gPSBhd2FpdCB0aGlzLmVsZW1lbnQoKS5nZXRTaXplKCk7XG4gICAgY29uc3Qge3g6IGxlZnQsIHk6IHRvcH0gPSBhd2FpdCB0aGlzLmVsZW1lbnQoKS5nZXRMb2NhdGlvbigpO1xuICAgIHJldHVybiB7d2lkdGgsIGhlaWdodCwgbGVmdCwgdG9wfTtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSB2YWx1ZSBvZiBhIHByb3BlcnR5IG9mIGFuIGVsZW1lbnQuICovXG4gIGFzeW5jIGdldFByb3BlcnR5KG5hbWU6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgcmV0dXJuIHRoaXMuX2V4ZWN1dGVTY3JpcHQoXG4gICAgICAgIChlbGVtZW50OiBFbGVtZW50LCBwcm9wZXJ0eToga2V5b2YgRWxlbWVudCkgPT4gZWxlbWVudFtwcm9wZXJ0eV0sXG4gICAgICAgIHRoaXMuZWxlbWVudCgpLCBuYW1lKTtcbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSB2YWx1ZSBvZiBhIHByb3BlcnR5IG9mIGFuIGlucHV0LiAqL1xuICBhc3luYyBzZXRJbnB1dFZhbHVlKG5ld1ZhbHVlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLl9leGVjdXRlU2NyaXB0KFxuICAgICAgICAoZWxlbWVudDogSFRNTElucHV0RWxlbWVudCwgdmFsdWU6IHN0cmluZykgPT4gZWxlbWVudC52YWx1ZSA9IHZhbHVlLFxuICAgICAgICB0aGlzLmVsZW1lbnQoKSwgbmV3VmFsdWUpO1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG5cbiAgLyoqIFNlbGVjdHMgdGhlIG9wdGlvbnMgYXQgdGhlIHNwZWNpZmllZCBpbmRleGVzIGluc2lkZSBvZiBhIG5hdGl2ZSBgc2VsZWN0YCBlbGVtZW50LiAqL1xuICBhc3luYyBzZWxlY3RPcHRpb25zKC4uLm9wdGlvbkluZGV4ZXM6IG51bWJlcltdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgY29uc3Qgb3B0aW9ucyA9IGF3YWl0IHRoaXMuZWxlbWVudCgpLmZpbmRFbGVtZW50cyh3ZWJkcml2ZXIuQnkuY3NzKCdvcHRpb24nKSk7XG4gICAgY29uc3QgaW5kZXhlcyA9IG5ldyBTZXQob3B0aW9uSW5kZXhlcyk7IC8vIENvbnZlcnQgdG8gYSBzZXQgdG8gcmVtb3ZlIGR1cGxpY2F0ZXMuXG5cbiAgICBpZiAob3B0aW9ucy5sZW5ndGggJiYgaW5kZXhlcy5zaXplKSB7XG4gICAgICAvLyBSZXNldCB0aGUgdmFsdWUgc28gYWxsIHRoZSBzZWxlY3RlZCBzdGF0ZXMgYXJlIGNsZWFyZWQuIFdlIGNhblxuICAgICAgLy8gcmV1c2UgdGhlIGlucHV0LXNwZWNpZmljIG1ldGhvZCBzaW5jZSB0aGUgbG9naWMgaXMgdGhlIHNhbWUuXG4gICAgICBhd2FpdCB0aGlzLnNldElucHV0VmFsdWUoJycpO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9wdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGluZGV4ZXMuaGFzKGkpKSB7XG4gICAgICAgICAgLy8gV2UgaGF2ZSB0byBob2xkIHRoZSBjb250cm9sIGtleSB3aGlsZSBjbGlja2luZyBvbiBvcHRpb25zIHNvIHRoYXQgbXVsdGlwbGUgY2FuIGJlXG4gICAgICAgICAgLy8gc2VsZWN0ZWQgaW4gbXVsdGktc2VsZWN0aW9uIG1vZGUuIFRoZSBrZXkgZG9lc24ndCBkbyBhbnl0aGluZyBmb3Igc2luZ2xlIHNlbGVjdGlvbi5cbiAgICAgICAgICBhd2FpdCB0aGlzLl9hY3Rpb25zKCkua2V5RG93bih3ZWJkcml2ZXIuS2V5LkNPTlRST0wpLnBlcmZvcm0oKTtcbiAgICAgICAgICBhd2FpdCBvcHRpb25zW2ldLmNsaWNrKCk7XG4gICAgICAgICAgYXdhaXQgdGhpcy5fYWN0aW9ucygpLmtleVVwKHdlYmRyaXZlci5LZXkuQ09OVFJPTCkucGVyZm9ybSgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDaGVja3Mgd2hldGhlciB0aGlzIGVsZW1lbnQgbWF0Y2hlcyB0aGUgZ2l2ZW4gc2VsZWN0b3IuICovXG4gIGFzeW5jIG1hdGNoZXNTZWxlY3RvcihzZWxlY3Rvcjogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgcmV0dXJuIHRoaXMuX2V4ZWN1dGVTY3JpcHQoKGVsZW1lbnQ6IEVsZW1lbnQsIHM6IHN0cmluZykgPT5cbiAgICAgICAgKEVsZW1lbnQucHJvdG90eXBlLm1hdGNoZXMgfHwgKEVsZW1lbnQucHJvdG90eXBlIGFzIGFueSkubXNNYXRjaGVzU2VsZWN0b3IpXG4gICAgICAgICAgICAuY2FsbChlbGVtZW50LCBzKSxcbiAgICAgICAgdGhpcy5lbGVtZW50KCksIHNlbGVjdG9yKTtcbiAgfVxuXG4gIC8qKiBDaGVja3Mgd2hldGhlciB0aGUgZWxlbWVudCBpcyBmb2N1c2VkLiAqL1xuICBhc3luYyBpc0ZvY3VzZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgcmV0dXJuIHdlYmRyaXZlci5XZWJFbGVtZW50LmVxdWFscyhcbiAgICAgICAgdGhpcy5lbGVtZW50KCksIHRoaXMuZWxlbWVudCgpLmdldERyaXZlcigpLnN3aXRjaFRvKCkuYWN0aXZlRWxlbWVudCgpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNwYXRjaGVzIGFuIGV2ZW50IHdpdGggYSBwYXJ0aWN1bGFyIG5hbWUuXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIGV2ZW50IHRvIGJlIGRpc3BhdGNoZWQuXG4gICAqL1xuICBhc3luYyBkaXNwYXRjaEV2ZW50KG5hbWU6IHN0cmluZywgZGF0YT86IFJlY29yZDxzdHJpbmcsIEV2ZW50RGF0YT4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLl9leGVjdXRlU2NyaXB0KGRpc3BhdGNoRXZlbnQsIG5hbWUsIHRoaXMuZWxlbWVudCgpLCBkYXRhKTtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSB3ZWJkcml2ZXIgYWN0aW9uIHNlcXVlbmNlLiAqL1xuICBwcml2YXRlIF9hY3Rpb25zKCkge1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnQoKS5nZXREcml2ZXIoKS5hY3Rpb25zKCk7XG4gIH1cblxuICAvKiogRXhlY3V0ZXMgYSBmdW5jdGlvbiBpbiB0aGUgYnJvd3Nlci4gKi9cbiAgcHJpdmF0ZSBhc3luYyBfZXhlY3V0ZVNjcmlwdDxUPihzY3JpcHQ6IEZ1bmN0aW9uLCAuLi52YXJfYXJnczogYW55W10pOiBQcm9taXNlPFQ+IHtcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50KCkuZ2V0RHJpdmVyKCkuZXhlY3V0ZVNjcmlwdChzY3JpcHQsIC4uLnZhcl9hcmdzKTtcbiAgfVxuXG4gIC8qKiBEaXNwYXRjaGVzIGFsbCB0aGUgZXZlbnRzIHRoYXQgYXJlIHBhcnQgb2YgYSBjbGljayBldmVudCBzZXF1ZW5jZS4gKi9cbiAgcHJpdmF0ZSBhc3luYyBfZGlzcGF0Y2hDbGlja0V2ZW50U2VxdWVuY2UoXG4gICAgICBhcmdzOiBbTW9kaWZpZXJLZXlzP10gfCBbJ2NlbnRlcicsIE1vZGlmaWVyS2V5cz9dIHwgW251bWJlciwgbnVtYmVyLCBNb2RpZmllcktleXM/XSxcbiAgICAgIGJ1dHRvbjogc3RyaW5nKSB7XG4gICAgbGV0IG1vZGlmaWVyczogTW9kaWZpZXJLZXlzID0ge307XG4gICAgaWYgKGFyZ3MubGVuZ3RoICYmIHR5cGVvZiBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0gPT09ICdvYmplY3QnKSB7XG4gICAgICBtb2RpZmllcnMgPSBhcmdzLnBvcCgpIGFzIE1vZGlmaWVyS2V5cztcbiAgICB9XG4gICAgY29uc3QgbW9kaWZpZXJLZXlzID0gZ2V0V2ViRHJpdmVyTW9kaWZpZXJLZXlzKG1vZGlmaWVycyk7XG5cbiAgICAvLyBPbWl0dGluZyB0aGUgb2Zmc2V0IGFyZ3VtZW50IHRvIG1vdXNlTW92ZSByZXN1bHRzIGluIGNsaWNraW5nIHRoZSBjZW50ZXIuXG4gICAgLy8gVGhpcyBpcyB0aGUgZGVmYXVsdCBiZWhhdmlvciB3ZSB3YW50LCBzbyB3ZSB1c2UgYW4gZW1wdHkgYXJyYXkgb2Ygb2Zmc2V0QXJncyBpZlxuICAgIC8vIG5vIGFyZ3MgcmVtYWluIGFmdGVyIHBvcHBpbmcgdGhlIG1vZGlmaWVycyBmcm9tIHRoZSBhcmdzIHBhc3NlZCB0byB0aGlzIGZ1bmN0aW9uLlxuICAgIGNvbnN0IG9mZnNldEFyZ3MgPSAoYXJncy5sZW5ndGggPT09IDIgP1xuICAgICAgICBbe3g6IGFyZ3NbMF0sIHk6IGFyZ3NbMV19XSA6IFtdKSBhcyBbe3g6IG51bWJlciwgeTogbnVtYmVyfV07XG5cbiAgICBsZXQgYWN0aW9ucyA9IHRoaXMuX2FjdGlvbnMoKS5tb3VzZU1vdmUodGhpcy5lbGVtZW50KCksIC4uLm9mZnNldEFyZ3MpO1xuXG4gICAgZm9yIChjb25zdCBtb2RpZmllcktleSBvZiBtb2RpZmllcktleXMpIHtcbiAgICAgIGFjdGlvbnMgPSBhY3Rpb25zLmtleURvd24obW9kaWZpZXJLZXkpO1xuICAgIH1cbiAgICBhY3Rpb25zID0gYWN0aW9ucy5jbGljayhidXR0b24pO1xuICAgIGZvciAoY29uc3QgbW9kaWZpZXJLZXkgb2YgbW9kaWZpZXJLZXlzKSB7XG4gICAgICBhY3Rpb25zID0gYWN0aW9ucy5rZXlVcChtb2RpZmllcktleSk7XG4gICAgfVxuXG4gICAgYXdhaXQgYWN0aW9ucy5wZXJmb3JtKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBEaXNwYXRjaGVzIGFuIGV2ZW50IHdpdGggYSBwYXJ0aWN1bGFyIG5hbWUgYW5kIGRhdGEgdG8gYW4gZWxlbWVudC4gTm90ZSB0aGF0IHRoaXMgbmVlZHMgdG8gYmUgYVxuICogcHVyZSBmdW5jdGlvbiwgYmVjYXVzZSBpdCBnZXRzIHN0cmluZ2lmaWVkIGJ5IFdlYkRyaXZlciBhbmQgaXMgZXhlY3V0ZWQgaW5zaWRlIHRoZSBicm93c2VyLlxuICovXG5mdW5jdGlvbiBkaXNwYXRjaEV2ZW50KG5hbWU6IHN0cmluZywgZWxlbWVudDogRWxlbWVudCwgZGF0YT86IFJlY29yZDxzdHJpbmcsIEV2ZW50RGF0YT4pIHtcbiAgY29uc3QgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnRXZlbnQnKTtcbiAgZXZlbnQuaW5pdEV2ZW50KG5hbWUpO1xuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6YmFuIEhhdmUgdG8gdXNlIGBPYmplY3QuYXNzaWduYCB0byBwcmVzZXJ2ZSB0aGUgb3JpZ2luYWwgb2JqZWN0LlxuICBPYmplY3QuYXNzaWduKGV2ZW50LCBkYXRhIHx8IHt9KTtcbiAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbn1cbiJdfQ==