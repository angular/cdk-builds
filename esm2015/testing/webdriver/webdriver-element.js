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
    blur() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._executeScript(((element) => element.blur()), this.element());
            yield this._stabilize();
        });
    }
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
    focus() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._executeScript((element) => element.focus(), this.element());
            yield this._stabilize();
        });
    }
    getCssValue(property) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._stabilize();
            return this.element().getCssValue(property);
        });
    }
    hover() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._actions().mouseMove(this.element()).perform();
            yield this._stabilize();
        });
    }
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
    text(options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._stabilize();
            if (options === null || options === void 0 ? void 0 : options.exclude) {
                return this._executeScript(_getTextWithExcludedElements, this.element(), options.exclude);
            }
            return this.element().getText();
        });
    }
    getAttribute(name) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._stabilize();
            return this._executeScript((element, attribute) => element.getAttribute(attribute), this.element(), name);
        });
    }
    hasClass(name) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._stabilize();
            const classes = (yield this.getAttribute('class')) || '';
            return new Set(classes.split(/\s+/).filter(c => c)).has(name);
        });
    }
    getDimensions() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._stabilize();
            const { width, height } = yield this.element().getSize();
            const { x: left, y: top } = yield this.element().getLocation();
            return { width, height, left, top };
        });
    }
    getProperty(name) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._stabilize();
            return this._executeScript((element, property) => element[property], this.element(), name);
        });
    }
    setInputValue(newValue) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._executeScript((element, value) => element.value = value, this.element(), newValue);
            yield this._stabilize();
        });
    }
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
    matchesSelector(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._stabilize();
            return this._executeScript((element, s) => (Element.prototype.matches || Element.prototype.msMatchesSelector)
                .call(element, s), this.element(), selector);
        });
    }
    isFocused() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._stabilize();
            return webdriver.WebElement.equals(this.element(), this.element().getDriver().switchTo().activeElement());
        });
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViZHJpdmVyLWVsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Rlc3Rpbmcvd2ViZHJpdmVyL3dlYmRyaXZlci1lbGVtZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQ0wsNEJBQTRCLEVBTzdCLE1BQU0sc0JBQXNCLENBQUM7QUFDOUIsT0FBTyxLQUFLLFNBQVMsTUFBTSxvQkFBb0IsQ0FBQztBQUNoRCxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsZUFBZSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFFM0Usb0RBQW9EO0FBQ3BELE1BQU0sT0FBTyxnQkFBZ0I7SUFDM0IsWUFDYSxPQUFtQyxFQUNwQyxVQUErQjtRQUQ5QixZQUFPLEdBQVAsT0FBTyxDQUE0QjtRQUNwQyxlQUFVLEdBQVYsVUFBVSxDQUFxQjtJQUFHLENBQUM7SUFFekMsSUFBSTs7WUFDUixNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLE9BQW9CLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ3RGLE1BQU0sSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQzFCLENBQUM7S0FBQTtJQUVLLEtBQUs7O1lBQ1QsTUFBTSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDN0IsTUFBTSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDMUIsQ0FBQztLQUFBO0lBRUssS0FBSyxDQUFDLEdBQUcsSUFDb0I7O1lBQ2pDLE1BQU0sSUFBSSxDQUFDLDJCQUEyQixDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BFLE1BQU0sSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQzFCLENBQUM7S0FB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b29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBfZ2V0VGV4dFdpdGhFeGNsdWRlZEVsZW1lbnRzLFxuICBFbGVtZW50RGltZW5zaW9ucyxcbiAgRXZlbnREYXRhLFxuICBNb2RpZmllcktleXMsXG4gIFRlc3RFbGVtZW50LFxuICBUZXN0S2V5LFxuICBUZXh0T3B0aW9uc1xufSBmcm9tICdAYW5ndWxhci9jZGsvdGVzdGluZyc7XG5pbXBvcnQgKiBhcyB3ZWJkcml2ZXIgZnJvbSAnc2VsZW5pdW0td2ViZHJpdmVyJztcbmltcG9ydCB7Z2V0V2ViRHJpdmVyTW9kaWZpZXJLZXlzLCB3ZWJEcml2ZXJLZXlNYXB9IGZyb20gJy4vd2ViZHJpdmVyLWtleXMnO1xuXG4vKiogQSBgVGVzdEVsZW1lbnRgIGltcGxlbWVudGF0aW9uIGZvciBXZWJEcml2ZXIuICovXG5leHBvcnQgY2xhc3MgV2ViRHJpdmVyRWxlbWVudCBpbXBsZW1lbnRzIFRlc3RFbGVtZW50IHtcbiAgY29uc3RydWN0b3IoXG4gICAgICByZWFkb25seSBlbGVtZW50OiAoKSA9PiB3ZWJkcml2ZXIuV2ViRWxlbWVudCxcbiAgICAgIHByaXZhdGUgX3N0YWJpbGl6ZTogKCkgPT4gUHJvbWlzZTx2b2lkPikge31cblxuICBhc3luYyBibHVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuX2V4ZWN1dGVTY3JpcHQoKChlbGVtZW50OiBIVE1MRWxlbWVudCkgPT4gZWxlbWVudC5ibHVyKCkpLCB0aGlzLmVsZW1lbnQoKSk7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gIH1cblxuICBhc3luYyBjbGVhcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmVsZW1lbnQoKS5jbGVhcigpO1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG5cbiAgYXN5bmMgY2xpY2soLi4uYXJnczogW01vZGlmaWVyS2V5cz9dIHwgWydjZW50ZXInLCBNb2RpZmllcktleXM/XSB8XG4gICAgICBbbnVtYmVyLCBudW1iZXIsIE1vZGlmaWVyS2V5cz9dKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5fZGlzcGF0Y2hDbGlja0V2ZW50U2VxdWVuY2UoYXJncywgd2ViZHJpdmVyLkJ1dHRvbi5MRUZUKTtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgfVxuXG4gIGFzeW5jIHJpZ2h0Q2xpY2soLi4uYXJnczogW01vZGlmaWVyS2V5cz9dIHwgWydjZW50ZXInLCBNb2RpZmllcktleXM/XSB8XG4gICAgICBbbnVtYmVyLCBudW1iZXIsIE1vZGlmaWVyS2V5cz9dKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5fZGlzcGF0Y2hDbGlja0V2ZW50U2VxdWVuY2UoYXJncywgd2ViZHJpdmVyLkJ1dHRvbi5SSUdIVCk7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gIH1cblxuICBhc3luYyBmb2N1cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLl9leGVjdXRlU2NyaXB0KChlbGVtZW50OiBIVE1MRWxlbWVudCkgPT4gZWxlbWVudC5mb2N1cygpLCB0aGlzLmVsZW1lbnQoKSk7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gIH1cblxuICBhc3luYyBnZXRDc3NWYWx1ZShwcm9wZXJ0eTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50KCkuZ2V0Q3NzVmFsdWUocHJvcGVydHkpO1xuICB9XG5cbiAgYXN5bmMgaG92ZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5fYWN0aW9ucygpLm1vdXNlTW92ZSh0aGlzLmVsZW1lbnQoKSkucGVyZm9ybSgpO1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG5cbiAgYXN5bmMgbW91c2VBd2F5KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuX2FjdGlvbnMoKS5tb3VzZU1vdmUodGhpcy5lbGVtZW50KCksIHt4OiAtMSwgeTogLTF9KS5wZXJmb3JtKCk7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gIH1cblxuICBhc3luYyBzZW5kS2V5cyguLi5rZXlzOiAoc3RyaW5nIHwgVGVzdEtleSlbXSk6IFByb21pc2U8dm9pZD47XG4gIGFzeW5jIHNlbmRLZXlzKG1vZGlmaWVyczogTW9kaWZpZXJLZXlzLCAuLi5rZXlzOiAoc3RyaW5nIHwgVGVzdEtleSlbXSk6IFByb21pc2U8dm9pZD47XG4gIGFzeW5jIHNlbmRLZXlzKC4uLm1vZGlmaWVyc0FuZEtleXM6IGFueVtdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlyc3QgPSBtb2RpZmllcnNBbmRLZXlzWzBdO1xuICAgIGxldCBtb2RpZmllcnM6IE1vZGlmaWVyS2V5cztcbiAgICBsZXQgcmVzdDogKHN0cmluZyB8IFRlc3RLZXkpW107XG4gICAgaWYgKHR5cGVvZiBmaXJzdCAhPT0gJ3N0cmluZycgJiYgdHlwZW9mIGZpcnN0ICE9PSAnbnVtYmVyJykge1xuICAgICAgbW9kaWZpZXJzID0gZmlyc3Q7XG4gICAgICByZXN0ID0gbW9kaWZpZXJzQW5kS2V5cy5zbGljZSgxKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbW9kaWZpZXJzID0ge307XG4gICAgICByZXN0ID0gbW9kaWZpZXJzQW5kS2V5cztcbiAgICB9XG5cbiAgICBjb25zdCBtb2RpZmllcktleXMgPSBnZXRXZWJEcml2ZXJNb2RpZmllcktleXMobW9kaWZpZXJzKTtcbiAgICBjb25zdCBrZXlzID0gcmVzdC5tYXAoayA9PiB0eXBlb2YgayA9PT0gJ3N0cmluZycgPyBrLnNwbGl0KCcnKSA6IFt3ZWJEcml2ZXJLZXlNYXBba11dKVxuICAgICAgICAucmVkdWNlKChhcnIsIGspID0+IGFyci5jb25jYXQoayksIFtdKVxuICAgICAgICAvLyB3ZWJkcml2ZXIuS2V5LmNob3JkIGRvZXNuJ3Qgd29yayB3ZWxsIHdpdGggZ2Vja29kcml2ZXIgKG1vemlsbGEvZ2Vja29kcml2ZXIjMTUwMiksXG4gICAgICAgIC8vIHNvIGF2b2lkIGl0IGlmIG5vIG1vZGlmaWVyIGtleXMgYXJlIHJlcXVpcmVkLlxuICAgICAgICAubWFwKGsgPT4gbW9kaWZpZXJLZXlzLmxlbmd0aCA+IDAgPyB3ZWJkcml2ZXIuS2V5LmNob3JkKC4uLm1vZGlmaWVyS2V5cywgaykgOiBrKTtcblxuICAgIGF3YWl0IHRoaXMuZWxlbWVudCgpLnNlbmRLZXlzKC4uLmtleXMpO1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICB9XG5cbiAgYXN5bmMgdGV4dChvcHRpb25zPzogVGV4dE9wdGlvbnMpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIGlmIChvcHRpb25zPy5leGNsdWRlKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZXhlY3V0ZVNjcmlwdChfZ2V0VGV4dFdpdGhFeGNsdWRlZEVsZW1lbnRzLCB0aGlzLmVsZW1lbnQoKSwgb3B0aW9ucy5leGNsdWRlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudCgpLmdldFRleHQoKTtcbiAgfVxuXG4gIGFzeW5jIGdldEF0dHJpYnV0ZShuYW1lOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ3xudWxsPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgcmV0dXJuIHRoaXMuX2V4ZWN1dGVTY3JpcHQoXG4gICAgICAgIChlbGVtZW50OiBFbGVtZW50LCBhdHRyaWJ1dGU6IHN0cmluZykgPT4gZWxlbWVudC5nZXRBdHRyaWJ1dGUoYXR0cmlidXRlKSxcbiAgICAgICAgdGhpcy5lbGVtZW50KCksIG5hbWUpO1xuICB9XG5cbiAgYXN5bmMgaGFzQ2xhc3MobmFtZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgY29uc3QgY2xhc3NlcyA9IChhd2FpdCB0aGlzLmdldEF0dHJpYnV0ZSgnY2xhc3MnKSkgfHwgJyc7XG4gICAgcmV0dXJuIG5ldyBTZXQoY2xhc3Nlcy5zcGxpdCgvXFxzKy8pLmZpbHRlcihjID0+IGMpKS5oYXMobmFtZSk7XG4gIH1cblxuICBhc3luYyBnZXREaW1lbnNpb25zKCk6IFByb21pc2U8RWxlbWVudERpbWVuc2lvbnM+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICBjb25zdCB7d2lkdGgsIGhlaWdodH0gPSBhd2FpdCB0aGlzLmVsZW1lbnQoKS5nZXRTaXplKCk7XG4gICAgY29uc3Qge3g6IGxlZnQsIHk6IHRvcH0gPSBhd2FpdCB0aGlzLmVsZW1lbnQoKS5nZXRMb2NhdGlvbigpO1xuICAgIHJldHVybiB7d2lkdGgsIGhlaWdodCwgbGVmdCwgdG9wfTtcbiAgfVxuXG4gIGFzeW5jIGdldFByb3BlcnR5KG5hbWU6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgcmV0dXJuIHRoaXMuX2V4ZWN1dGVTY3JpcHQoXG4gICAgICAgIChlbGVtZW50OiBFbGVtZW50LCBwcm9wZXJ0eToga2V5b2YgRWxlbWVudCkgPT4gZWxlbWVudFtwcm9wZXJ0eV0sXG4gICAgICAgIHRoaXMuZWxlbWVudCgpLCBuYW1lKTtcbiAgfVxuXG4gIGFzeW5jIHNldElucHV0VmFsdWUobmV3VmFsdWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuX2V4ZWN1dGVTY3JpcHQoXG4gICAgICAgIChlbGVtZW50OiBIVE1MSW5wdXRFbGVtZW50LCB2YWx1ZTogc3RyaW5nKSA9PiBlbGVtZW50LnZhbHVlID0gdmFsdWUsXG4gICAgICAgIHRoaXMuZWxlbWVudCgpLCBuZXdWYWx1ZSk7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gIH1cblxuICBhc3luYyBzZWxlY3RPcHRpb25zKC4uLm9wdGlvbkluZGV4ZXM6IG51bWJlcltdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgY29uc3Qgb3B0aW9ucyA9IGF3YWl0IHRoaXMuZWxlbWVudCgpLmZpbmRFbGVtZW50cyh3ZWJkcml2ZXIuQnkuY3NzKCdvcHRpb24nKSk7XG4gICAgY29uc3QgaW5kZXhlcyA9IG5ldyBTZXQob3B0aW9uSW5kZXhlcyk7IC8vIENvbnZlcnQgdG8gYSBzZXQgdG8gcmVtb3ZlIGR1cGxpY2F0ZXMuXG5cbiAgICBpZiAob3B0aW9ucy5sZW5ndGggJiYgaW5kZXhlcy5zaXplKSB7XG4gICAgICAvLyBSZXNldCB0aGUgdmFsdWUgc28gYWxsIHRoZSBzZWxlY3RlZCBzdGF0ZXMgYXJlIGNsZWFyZWQuIFdlIGNhblxuICAgICAgLy8gcmV1c2UgdGhlIGlucHV0LXNwZWNpZmljIG1ldGhvZCBzaW5jZSB0aGUgbG9naWMgaXMgdGhlIHNhbWUuXG4gICAgICBhd2FpdCB0aGlzLnNldElucHV0VmFsdWUoJycpO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9wdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGluZGV4ZXMuaGFzKGkpKSB7XG4gICAgICAgICAgLy8gV2UgaGF2ZSB0byBob2xkIHRoZSBjb250cm9sIGtleSB3aGlsZSBjbGlja2luZyBvbiBvcHRpb25zIHNvIHRoYXQgbXVsdGlwbGUgY2FuIGJlXG4gICAgICAgICAgLy8gc2VsZWN0ZWQgaW4gbXVsdGktc2VsZWN0aW9uIG1vZGUuIFRoZSBrZXkgZG9lc24ndCBkbyBhbnl0aGluZyBmb3Igc2luZ2xlIHNlbGVjdGlvbi5cbiAgICAgICAgICBhd2FpdCB0aGlzLl9hY3Rpb25zKCkua2V5RG93bih3ZWJkcml2ZXIuS2V5LkNPTlRST0wpLnBlcmZvcm0oKTtcbiAgICAgICAgICBhd2FpdCBvcHRpb25zW2ldLmNsaWNrKCk7XG4gICAgICAgICAgYXdhaXQgdGhpcy5fYWN0aW9ucygpLmtleVVwKHdlYmRyaXZlci5LZXkuQ09OVFJPTCkucGVyZm9ybSgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHRoaXMuX3N0YWJpbGl6ZSgpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIG1hdGNoZXNTZWxlY3RvcihzZWxlY3Rvcjogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gICAgcmV0dXJuIHRoaXMuX2V4ZWN1dGVTY3JpcHQoKGVsZW1lbnQ6IEVsZW1lbnQsIHM6IHN0cmluZykgPT5cbiAgICAgICAgKEVsZW1lbnQucHJvdG90eXBlLm1hdGNoZXMgfHwgKEVsZW1lbnQucHJvdG90eXBlIGFzIGFueSkubXNNYXRjaGVzU2VsZWN0b3IpXG4gICAgICAgICAgICAuY2FsbChlbGVtZW50LCBzKSxcbiAgICAgICAgdGhpcy5lbGVtZW50KCksIHNlbGVjdG9yKTtcbiAgfVxuXG4gIGFzeW5jIGlzRm9jdXNlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBhd2FpdCB0aGlzLl9zdGFiaWxpemUoKTtcbiAgICByZXR1cm4gd2ViZHJpdmVyLldlYkVsZW1lbnQuZXF1YWxzKFxuICAgICAgICB0aGlzLmVsZW1lbnQoKSwgdGhpcy5lbGVtZW50KCkuZ2V0RHJpdmVyKCkuc3dpdGNoVG8oKS5hY3RpdmVFbGVtZW50KCkpO1xuICB9XG5cbiAgYXN5bmMgZGlzcGF0Y2hFdmVudChuYW1lOiBzdHJpbmcsIGRhdGE/OiBSZWNvcmQ8c3RyaW5nLCBFdmVudERhdGE+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5fZXhlY3V0ZVNjcmlwdChkaXNwYXRjaEV2ZW50LCBuYW1lLCB0aGlzLmVsZW1lbnQoKSwgZGF0YSk7XG4gICAgYXdhaXQgdGhpcy5fc3RhYmlsaXplKCk7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgd2ViZHJpdmVyIGFjdGlvbiBzZXF1ZW5jZS4gKi9cbiAgcHJpdmF0ZSBfYWN0aW9ucygpIHtcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50KCkuZ2V0RHJpdmVyKCkuYWN0aW9ucygpO1xuICB9XG5cbiAgLyoqIEV4ZWN1dGVzIGEgZnVuY3Rpb24gaW4gdGhlIGJyb3dzZXIuICovXG4gIHByaXZhdGUgYXN5bmMgX2V4ZWN1dGVTY3JpcHQ8VD4oc2NyaXB0OiBGdW5jdGlvbiwgLi4udmFyX2FyZ3M6IGFueVtdKTogUHJvbWlzZTxUPiB7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudCgpLmdldERyaXZlcigpLmV4ZWN1dGVTY3JpcHQoc2NyaXB0LCAuLi52YXJfYXJncyk7XG4gIH1cblxuICAvKiogRGlzcGF0Y2hlcyBhbGwgdGhlIGV2ZW50cyB0aGF0IGFyZSBwYXJ0IG9mIGEgY2xpY2sgZXZlbnQgc2VxdWVuY2UuICovXG4gIHByaXZhdGUgYXN5bmMgX2Rpc3BhdGNoQ2xpY2tFdmVudFNlcXVlbmNlKFxuICAgICAgYXJnczogW01vZGlmaWVyS2V5cz9dIHwgWydjZW50ZXInLCBNb2RpZmllcktleXM/XSB8IFtudW1iZXIsIG51bWJlciwgTW9kaWZpZXJLZXlzP10sXG4gICAgICBidXR0b246IHN0cmluZykge1xuICAgIGxldCBtb2RpZmllcnM6IE1vZGlmaWVyS2V5cyA9IHt9O1xuICAgIGlmIChhcmdzLmxlbmd0aCAmJiB0eXBlb2YgYXJnc1thcmdzLmxlbmd0aCAtIDFdID09PSAnb2JqZWN0Jykge1xuICAgICAgbW9kaWZpZXJzID0gYXJncy5wb3AoKSBhcyBNb2RpZmllcktleXM7XG4gICAgfVxuICAgIGNvbnN0IG1vZGlmaWVyS2V5cyA9IGdldFdlYkRyaXZlck1vZGlmaWVyS2V5cyhtb2RpZmllcnMpO1xuXG4gICAgLy8gT21pdHRpbmcgdGhlIG9mZnNldCBhcmd1bWVudCB0byBtb3VzZU1vdmUgcmVzdWx0cyBpbiBjbGlja2luZyB0aGUgY2VudGVyLlxuICAgIC8vIFRoaXMgaXMgdGhlIGRlZmF1bHQgYmVoYXZpb3Igd2Ugd2FudCwgc28gd2UgdXNlIGFuIGVtcHR5IGFycmF5IG9mIG9mZnNldEFyZ3MgaWZcbiAgICAvLyBubyBhcmdzIHJlbWFpbiBhZnRlciBwb3BwaW5nIHRoZSBtb2RpZmllcnMgZnJvbSB0aGUgYXJncyBwYXNzZWQgdG8gdGhpcyBmdW5jdGlvbi5cbiAgICBjb25zdCBvZmZzZXRBcmdzID0gKGFyZ3MubGVuZ3RoID09PSAyID9cbiAgICAgICAgW3t4OiBhcmdzWzBdLCB5OiBhcmdzWzFdfV0gOiBbXSkgYXMgW3t4OiBudW1iZXIsIHk6IG51bWJlcn1dO1xuXG4gICAgbGV0IGFjdGlvbnMgPSB0aGlzLl9hY3Rpb25zKCkubW91c2VNb3ZlKHRoaXMuZWxlbWVudCgpLCAuLi5vZmZzZXRBcmdzKTtcblxuICAgIGZvciAoY29uc3QgbW9kaWZpZXJLZXkgb2YgbW9kaWZpZXJLZXlzKSB7XG4gICAgICBhY3Rpb25zID0gYWN0aW9ucy5rZXlEb3duKG1vZGlmaWVyS2V5KTtcbiAgICB9XG4gICAgYWN0aW9ucyA9IGFjdGlvbnMuY2xpY2soYnV0dG9uKTtcbiAgICBmb3IgKGNvbnN0IG1vZGlmaWVyS2V5IG9mIG1vZGlmaWVyS2V5cykge1xuICAgICAgYWN0aW9ucyA9IGFjdGlvbnMua2V5VXAobW9kaWZpZXJLZXkpO1xuICAgIH1cblxuICAgIGF3YWl0IGFjdGlvbnMucGVyZm9ybSgpO1xuICB9XG59XG5cbi8qKlxuICogRGlzcGF0Y2hlcyBhbiBldmVudCB3aXRoIGEgcGFydGljdWxhciBuYW1lIGFuZCBkYXRhIHRvIGFuIGVsZW1lbnQuIE5vdGUgdGhhdCB0aGlzIG5lZWRzIHRvIGJlIGFcbiAqIHB1cmUgZnVuY3Rpb24sIGJlY2F1c2UgaXQgZ2V0cyBzdHJpbmdpZmllZCBieSBXZWJEcml2ZXIgYW5kIGlzIGV4ZWN1dGVkIGluc2lkZSB0aGUgYnJvd3Nlci5cbiAqL1xuZnVuY3Rpb24gZGlzcGF0Y2hFdmVudChuYW1lOiBzdHJpbmcsIGVsZW1lbnQ6IEVsZW1lbnQsIGRhdGE/OiBSZWNvcmQ8c3RyaW5nLCBFdmVudERhdGE+KSB7XG4gIGNvbnN0IGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG4gIGV2ZW50LmluaXRFdmVudChuYW1lKTtcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOmJhbiBIYXZlIHRvIHVzZSBgT2JqZWN0LmFzc2lnbmAgdG8gcHJlc2VydmUgdGhlIG9yaWdpbmFsIG9iamVjdC5cbiAgT2JqZWN0LmFzc2lnbihldmVudCwgZGF0YSB8fCB7fSk7XG4gIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChldmVudCk7XG59XG4iXX0=