import { __awaiter } from 'tslib';
import { TestKey, HarnessEnvironment } from '@angular/cdk/testing';
import { Key, browser, element, by } from 'protractor';

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
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
class ProtractorElement {
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
    click(relativeX = 0, relativeY = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            yield browser.actions()
                .mouseMove(yield this.element.getWebElement(), { x: relativeX, y: relativeY })
                .click()
                .perform();
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
                .map(k => Key.chord(...modifierKeys, k));
            return this.element.sendKeys(...keys);
        });
    }
    text() {
        return __awaiter(this, void 0, void 0, function* () {
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
    matchesSelector(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            return browser.executeScript(`
          return (Element.prototype.matches ||
                  Element.prototype.msMatchesSelector).call(arguments[0], arguments[1])
          `, this.element, selector);
        });
    }
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** A `HarnessEnvironment` implementation for Protractor. */
class ProtractorHarnessEnvironment extends HarnessEnvironment {
    constructor(rawRootElement) {
        super(rawRootElement);
    }
    /** Creates a `HarnessLoader` rooted at the document root. */
    static loader() {
        return new ProtractorHarnessEnvironment(element(by.css('body')));
    }
    forceStabilize() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    waitForTasksOutsideAngular() {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: figure out how we can do this for the protractor environment.
            // https://github.com/angular/components/issues/17412
        });
    }
    getDocumentRoot() {
        return element(by.css('body'));
    }
    createTestElement(element) {
        return new ProtractorElement(element);
    }
    createEnvironment(element) {
        return new ProtractorHarnessEnvironment(element);
    }
    getAllRawElements(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            const elementFinderArray = this.rawRootElement.all(by.css(selector));
            const length = yield elementFinderArray.count();
            const elements = [];
            for (let i = 0; i < length; i++) {
                elements.push(elementFinderArray.get(i));
            }
            return elements;
        });
    }
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

export { ProtractorElement, ProtractorHarnessEnvironment };
//# sourceMappingURL=protractor.js.map
