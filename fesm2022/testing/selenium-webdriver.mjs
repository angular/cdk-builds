import * as webdriver from 'selenium-webdriver';
import { TestKey, getNoKeysSpecifiedError, _getTextWithExcludedElements, HarnessEnvironment } from '../testing.mjs';
import 'rxjs';

/**
 * Maps the `TestKey` constants to WebDriver's `webdriver.Key` constants.
 * See https://github.com/SeleniumHQ/selenium/blob/trunk/javascript/webdriver/key.js#L29
 */
const seleniumWebDriverKeyMap = {
    [TestKey.BACKSPACE]: webdriver.Key.BACK_SPACE,
    [TestKey.TAB]: webdriver.Key.TAB,
    [TestKey.ENTER]: webdriver.Key.ENTER,
    [TestKey.SHIFT]: webdriver.Key.SHIFT,
    [TestKey.CONTROL]: webdriver.Key.CONTROL,
    [TestKey.ALT]: webdriver.Key.ALT,
    [TestKey.ESCAPE]: webdriver.Key.ESCAPE,
    [TestKey.PAGE_UP]: webdriver.Key.PAGE_UP,
    [TestKey.PAGE_DOWN]: webdriver.Key.PAGE_DOWN,
    [TestKey.END]: webdriver.Key.END,
    [TestKey.HOME]: webdriver.Key.HOME,
    [TestKey.LEFT_ARROW]: webdriver.Key.ARROW_LEFT,
    [TestKey.UP_ARROW]: webdriver.Key.ARROW_UP,
    [TestKey.RIGHT_ARROW]: webdriver.Key.ARROW_RIGHT,
    [TestKey.DOWN_ARROW]: webdriver.Key.ARROW_DOWN,
    [TestKey.INSERT]: webdriver.Key.INSERT,
    [TestKey.DELETE]: webdriver.Key.DELETE,
    [TestKey.F1]: webdriver.Key.F1,
    [TestKey.F2]: webdriver.Key.F2,
    [TestKey.F3]: webdriver.Key.F3,
    [TestKey.F4]: webdriver.Key.F4,
    [TestKey.F5]: webdriver.Key.F5,
    [TestKey.F6]: webdriver.Key.F6,
    [TestKey.F7]: webdriver.Key.F7,
    [TestKey.F8]: webdriver.Key.F8,
    [TestKey.F9]: webdriver.Key.F9,
    [TestKey.F10]: webdriver.Key.F10,
    [TestKey.F11]: webdriver.Key.F11,
    [TestKey.F12]: webdriver.Key.F12,
    [TestKey.META]: webdriver.Key.META,
    [TestKey.COMMA]: ',',
};
/** Gets a list of WebDriver `Key`s for the given `ModifierKeys`. */
function getSeleniumWebDriverModifierKeys(modifiers) {
    const result = [];
    if (modifiers.control) {
        result.push(webdriver.Key.CONTROL);
    }
    if (modifiers.alt) {
        result.push(webdriver.Key.ALT);
    }
    if (modifiers.shift) {
        result.push(webdriver.Key.SHIFT);
    }
    if (modifiers.meta) {
        result.push(webdriver.Key.META);
    }
    return result;
}

/** A `TestElement` implementation for WebDriver. */
class SeleniumWebDriverElement {
    element;
    _stabilize;
    constructor(element, _stabilize) {
        this.element = element;
        this._stabilize = _stabilize;
    }
    /** Blur the element. */
    async blur() {
        await this._executeScript((element) => element.blur(), this.element());
        await this._stabilize();
    }
    /** Clear the element's input (for input and textarea elements only). */
    async clear() {
        await this.element().clear();
        await this._stabilize();
    }
    async click(...args) {
        await this._dispatchClickEventSequence(args, webdriver.Button.LEFT);
        await this._stabilize();
    }
    async rightClick(...args) {
        await this._dispatchClickEventSequence(args, webdriver.Button.RIGHT);
        await this._stabilize();
    }
    /** Focus the element. */
    async focus() {
        await this._executeScript((element) => element.focus(), this.element());
        await this._stabilize();
    }
    /** Get the computed value of the given CSS property for the element. */
    async getCssValue(property) {
        await this._stabilize();
        return this.element().getCssValue(property);
    }
    /** Hovers the mouse over the element. */
    async hover() {
        await this._actions().mouseMove(this.element()).perform();
        await this._stabilize();
    }
    /** Moves the mouse away from the element. */
    async mouseAway() {
        await this._actions().mouseMove(this.element(), { x: -1, y: -1 }).perform();
        await this._stabilize();
    }
    async sendKeys(...modifiersAndKeys) {
        const first = modifiersAndKeys[0];
        let modifiers;
        let rest;
        if (first !== undefined && typeof first !== 'string' && typeof first !== 'number') {
            modifiers = first;
            rest = modifiersAndKeys.slice(1);
        }
        else {
            modifiers = {};
            rest = modifiersAndKeys;
        }
        const modifierKeys = getSeleniumWebDriverModifierKeys(modifiers);
        const keys = rest
            .map(k => (typeof k === 'string' ? k.split('') : [seleniumWebDriverKeyMap[k]]))
            .reduce((arr, k) => arr.concat(k), [])
            // webdriver.Key.chord doesn't work well with geckodriver (mozilla/geckodriver#1502),
            // so avoid it if no modifier keys are required.
            .map(k => (modifierKeys.length > 0 ? webdriver.Key.chord(...modifierKeys, k) : k));
        // Throw an error if no keys have been specified. Calling this function with no
        // keys should not result in a focus event being dispatched unexpectedly.
        if (keys.length === 0) {
            throw getNoKeysSpecifiedError();
        }
        await this.element().sendKeys(...keys);
        await this._stabilize();
    }
    /**
     * Gets the text from the element.
     * @param options Options that affect what text is included.
     */
    async text(options) {
        await this._stabilize();
        if (options?.exclude) {
            return this._executeScript(_getTextWithExcludedElements, this.element(), options.exclude);
        }
        // We don't go through the WebDriver `getText`, because it excludes text from hidden elements.
        return this._executeScript((element) => (element.textContent || '').trim(), this.element());
    }
    /**
     * Sets the value of a `contenteditable` element.
     * @param value Value to be set on the element.
     */
    async setContenteditableValue(value) {
        const contenteditableAttr = await this.getAttribute('contenteditable');
        if (contenteditableAttr !== '' &&
            contenteditableAttr !== 'true' &&
            contenteditableAttr !== 'plaintext-only') {
            throw new Error('setContenteditableValue can only be called on a `contenteditable` element.');
        }
        await this._stabilize();
        return this._executeScript((element, valueToSet) => (element.textContent = valueToSet), this.element(), value);
    }
    /** Gets the value for the given attribute from the element. */
    async getAttribute(name) {
        await this._stabilize();
        return this._executeScript((element, attribute) => element.getAttribute(attribute), this.element(), name);
    }
    /** Checks whether the element has the given class. */
    async hasClass(name) {
        await this._stabilize();
        const classes = (await this.getAttribute('class')) || '';
        return new Set(classes.split(/\s+/).filter(c => c)).has(name);
    }
    /** Gets the dimensions of the element. */
    async getDimensions() {
        await this._stabilize();
        const { width, height } = await this.element().getSize();
        const { x: left, y: top } = await this.element().getLocation();
        return { width, height, left, top };
    }
    /** Gets the value of a property of an element. */
    async getProperty(name) {
        await this._stabilize();
        return this._executeScript((element, property) => element[property], this.element(), name);
    }
    /** Sets the value of a property of an input. */
    async setInputValue(newValue) {
        await this._executeScript((element, value) => (element.value = value), this.element(), newValue);
        await this._stabilize();
    }
    /** Selects the options at the specified indexes inside of a native `select` element. */
    async selectOptions(...optionIndexes) {
        await this._stabilize();
        const options = await this.element().findElements(webdriver.By.css('option'));
        const indexes = new Set(optionIndexes); // Convert to a set to remove duplicates.
        if (options.length && indexes.size) {
            // Reset the value so all the selected states are cleared. We can
            // reuse the input-specific method since the logic is the same.
            await this.setInputValue('');
            for (let i = 0; i < options.length; i++) {
                if (indexes.has(i)) {
                    // We have to hold the control key while clicking on options so that multiple can be
                    // selected in multi-selection mode. The key doesn't do anything for single selection.
                    await this._actions().keyDown(webdriver.Key.CONTROL).perform();
                    await options[i].click();
                    await this._actions().keyUp(webdriver.Key.CONTROL).perform();
                }
            }
            await this._stabilize();
        }
    }
    /** Checks whether this element matches the given selector. */
    async matchesSelector(selector) {
        await this._stabilize();
        return this._executeScript((element, s) => (Element.prototype.matches || Element.prototype.msMatchesSelector).call(element, s), this.element(), selector);
    }
    /** Checks whether the element is focused. */
    async isFocused() {
        await this._stabilize();
        return webdriver.WebElement.equals(this.element(), this.element().getDriver().switchTo().activeElement());
    }
    /**
     * Dispatches an event with a particular name.
     * @param name Name of the event to be dispatched.
     */
    async dispatchEvent(name, data) {
        await this._executeScript(dispatchEvent, name, this.element(), data);
        await this._stabilize();
    }
    /** Gets the webdriver action sequence. */
    _actions() {
        return this.element().getDriver().actions();
    }
    /** Executes a function in the browser. */
    async _executeScript(script, ...var_args) {
        return this.element()
            .getDriver()
            .executeScript(script, ...var_args);
    }
    /** Dispatches all the events that are part of a click event sequence. */
    async _dispatchClickEventSequence(args, button) {
        let modifiers = {};
        if (args.length && typeof args[args.length - 1] === 'object') {
            modifiers = args.pop();
        }
        const modifierKeys = getSeleniumWebDriverModifierKeys(modifiers);
        // Omitting the offset argument to mouseMove results in clicking the center.
        // This is the default behavior we want, so we use an empty array of offsetArgs if
        // no args remain after popping the modifiers from the args passed to this function.
        const offsetArgs = (args.length === 2 ? [{ x: args[0], y: args[1] }] : []);
        let actions = this._actions().mouseMove(this.element(), ...offsetArgs);
        for (const modifierKey of modifierKeys) {
            actions = actions.keyDown(modifierKey);
        }
        actions = actions.click(button);
        for (const modifierKey of modifierKeys) {
            actions = actions.keyUp(modifierKey);
        }
        await actions.perform();
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

/** The default environment options. */
const defaultEnvironmentOptions = {
    queryFn: async (selector, root) => root().findElements(webdriver.By.css(selector)),
};
/**
 * This function is meant to be executed in the browser. It taps into the hooks exposed by Angular
 * and invokes the specified `callback` when the application is stable (no more pending tasks).
 */
function whenStable(callback) {
    Promise.all(window.frameworkStabilizers.map(stabilizer => new Promise(stabilizer))).then(callback);
}
/**
 * This function is meant to be executed in the browser. It checks whether the Angular framework has
 * bootstrapped yet.
 */
function isBootstrapped() {
    return !!window.frameworkStabilizers;
}
/** Waits for angular to be ready after the page load. */
async function waitForAngularReady(wd) {
    await wd.wait(() => wd.executeScript(isBootstrapped));
    await wd.executeAsyncScript(whenStable);
}
/** A `HarnessEnvironment` implementation for WebDriver. */
class SeleniumWebDriverHarnessEnvironment extends HarnessEnvironment {
    /** The options for this environment. */
    _options;
    /** Environment stabilization callback passed to the created test elements. */
    _stabilizeCallback;
    constructor(rawRootElement, options) {
        super(rawRootElement);
        this._options = { ...defaultEnvironmentOptions, ...options };
        this._stabilizeCallback = () => this.forceStabilize();
    }
    /** Gets the ElementFinder corresponding to the given TestElement. */
    static getNativeElement(el) {
        if (el instanceof SeleniumWebDriverElement) {
            return el.element();
        }
        throw Error('This TestElement was not created by the WebDriverHarnessEnvironment');
    }
    /** Creates a `HarnessLoader` rooted at the document root. */
    static loader(driver, options) {
        return new SeleniumWebDriverHarnessEnvironment(() => driver.findElement(webdriver.By.css('body')), options);
    }
    /**
     * Flushes change detection and async tasks captured in the Angular zone.
     * In most cases it should not be necessary to call this manually. However, there may be some edge
     * cases where it is needed to fully flush animation events.
     */
    async forceStabilize() {
        await this.rawRootElement().getDriver().executeAsyncScript(whenStable);
    }
    /** @docs-private */
    async waitForTasksOutsideAngular() {
        // TODO: figure out how we can do this for the webdriver environment.
        //  https://github.com/angular/components/issues/17412
    }
    /** Gets the root element for the document. */
    getDocumentRoot() {
        return () => this.rawRootElement().getDriver().findElement(webdriver.By.css('body'));
    }
    /** Creates a `TestElement` from a raw element. */
    createTestElement(element) {
        return new SeleniumWebDriverElement(element, this._stabilizeCallback);
    }
    /** Creates a `HarnessLoader` rooted at the given raw element. */
    createEnvironment(element) {
        return new SeleniumWebDriverHarnessEnvironment(element, this._options);
    }
    // Note: This seems to be working, though we may need to re-evaluate if we encounter issues with
    // stale element references. `() => Promise<webdriver.WebElement[]>` seems like a more correct
    // return type, though supporting it would require changes to the public harness API.
    /**
     * Gets a list of all elements matching the given selector under this environment's root element.
     */
    async getAllRawElements(selector) {
        const els = await this._options.queryFn(selector, this.rawRootElement);
        return els.map((x) => () => x);
    }
}

export { SeleniumWebDriverElement, SeleniumWebDriverHarnessEnvironment, waitForAngularReady };
//# sourceMappingURL=selenium-webdriver.mjs.map
