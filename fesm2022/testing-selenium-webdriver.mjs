import * as webdriver from 'selenium-webdriver';
import { TestKey, getNoKeysSpecifiedError, _getTextWithExcludedElements, HarnessEnvironment } from './testing.mjs';
import 'rxjs';

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
  [TestKey.COMMA]: ','
};
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

class SeleniumWebDriverElement {
  element;
  _stabilize;
  constructor(element, _stabilize) {
    this.element = element;
    this._stabilize = _stabilize;
  }
  async blur() {
    await this._executeScript(element => element.blur(), this.element());
    await this._stabilize();
  }
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
  async focus() {
    await this._executeScript(element => element.focus(), this.element());
    await this._stabilize();
  }
  async getCssValue(property) {
    await this._stabilize();
    return this.element().getCssValue(property);
  }
  async hover() {
    await this._actions().mouseMove(this.element()).perform();
    await this._stabilize();
  }
  async mouseAway() {
    await this._actions().mouseMove(this.element(), {
      x: -1,
      y: -1
    }).perform();
    await this._stabilize();
  }
  async sendKeys(...modifiersAndKeys) {
    const first = modifiersAndKeys[0];
    let modifiers;
    let rest;
    if (first !== undefined && typeof first !== 'string' && typeof first !== 'number') {
      modifiers = first;
      rest = modifiersAndKeys.slice(1);
    } else {
      modifiers = {};
      rest = modifiersAndKeys;
    }
    const modifierKeys = getSeleniumWebDriverModifierKeys(modifiers);
    const keys = rest.map(k => typeof k === 'string' ? k.split('') : [seleniumWebDriverKeyMap[k]]).reduce((arr, k) => arr.concat(k), []).map(k => modifierKeys.length > 0 ? webdriver.Key.chord(...modifierKeys, k) : k);
    if (keys.length === 0) {
      throw getNoKeysSpecifiedError();
    }
    await this.element().sendKeys(...keys);
    await this._stabilize();
  }
  async text(options) {
    await this._stabilize();
    if (options?.exclude) {
      return this._executeScript(_getTextWithExcludedElements, this.element(), options.exclude);
    }
    return this._executeScript(element => (element.textContent || '').trim(), this.element());
  }
  async setContenteditableValue(value) {
    const contenteditableAttr = await this.getAttribute('contenteditable');
    if (contenteditableAttr !== '' && contenteditableAttr !== 'true' && contenteditableAttr !== 'plaintext-only') {
      throw new Error('setContenteditableValue can only be called on a `contenteditable` element.');
    }
    await this._stabilize();
    return this._executeScript((element, valueToSet) => element.textContent = valueToSet, this.element(), value);
  }
  async getAttribute(name) {
    await this._stabilize();
    return this._executeScript((element, attribute) => element.getAttribute(attribute), this.element(), name);
  }
  async hasClass(name) {
    await this._stabilize();
    const classes = (await this.getAttribute('class')) || '';
    return new Set(classes.split(/\s+/).filter(c => c)).has(name);
  }
  async getDimensions() {
    await this._stabilize();
    const {
      width,
      height
    } = await this.element().getSize();
    const {
      x: left,
      y: top
    } = await this.element().getLocation();
    return {
      width,
      height,
      left,
      top
    };
  }
  async getProperty(name) {
    await this._stabilize();
    return this._executeScript((element, property) => element[property], this.element(), name);
  }
  async setInputValue(newValue) {
    await this._executeScript((element, value) => element.value = value, this.element(), newValue);
    await this._stabilize();
  }
  async selectOptions(...optionIndexes) {
    await this._stabilize();
    const options = await this.element().findElements(webdriver.By.css('option'));
    const indexes = new Set(optionIndexes);
    if (options.length && indexes.size) {
      await this.setInputValue('');
      for (let i = 0; i < options.length; i++) {
        if (indexes.has(i)) {
          await this._actions().keyDown(webdriver.Key.CONTROL).perform();
          await options[i].click();
          await this._actions().keyUp(webdriver.Key.CONTROL).perform();
        }
      }
      await this._stabilize();
    }
  }
  async matchesSelector(selector) {
    await this._stabilize();
    return this._executeScript((element, s) => (Element.prototype.matches || Element.prototype.msMatchesSelector).call(element, s), this.element(), selector);
  }
  async isFocused() {
    await this._stabilize();
    return webdriver.WebElement.equals(this.element(), this.element().getDriver().switchTo().activeElement());
  }
  async dispatchEvent(name, data) {
    await this._executeScript(dispatchEvent, name, this.element(), data);
    await this._stabilize();
  }
  _actions() {
    return this.element().getDriver().actions();
  }
  async _executeScript(script, ...var_args) {
    return this.element().getDriver().executeScript(script, ...var_args);
  }
  async _dispatchClickEventSequence(args, button) {
    let modifiers = {};
    if (args.length && typeof args[args.length - 1] === 'object') {
      modifiers = args.pop();
    }
    const modifierKeys = getSeleniumWebDriverModifierKeys(modifiers);
    const offsetArgs = args.length === 2 ? [{
      x: args[0],
      y: args[1]
    }] : [];
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
function dispatchEvent(name, element, data) {
  const event = document.createEvent('Event');
  event.initEvent(name);
  Object.assign(event, data || {});
  element.dispatchEvent(event);
}

const defaultEnvironmentOptions = {
  queryFn: async (selector, root) => root().findElements(webdriver.By.css(selector))
};
function whenStable(callback) {
  Promise.all(window.frameworkStabilizers.map(stabilizer => new Promise(stabilizer))).then(callback);
}
function isBootstrapped() {
  return !!window.frameworkStabilizers;
}
async function waitForAngularReady(wd) {
  await wd.wait(() => wd.executeScript(isBootstrapped));
  await wd.executeAsyncScript(whenStable);
}
class SeleniumWebDriverHarnessEnvironment extends HarnessEnvironment {
  _options;
  _stabilizeCallback;
  constructor(rawRootElement, options) {
    super(rawRootElement);
    this._options = {
      ...defaultEnvironmentOptions,
      ...options
    };
    this._stabilizeCallback = () => this.forceStabilize();
  }
  static getNativeElement(el) {
    if (el instanceof SeleniumWebDriverElement) {
      return el.element();
    }
    throw Error('This TestElement was not created by the WebDriverHarnessEnvironment');
  }
  static loader(driver, options) {
    return new SeleniumWebDriverHarnessEnvironment(() => driver.findElement(webdriver.By.css('body')), options);
  }
  async forceStabilize() {
    await this.rawRootElement().getDriver().executeAsyncScript(whenStable);
  }
  async waitForTasksOutsideAngular() {}
  getDocumentRoot() {
    return () => this.rawRootElement().getDriver().findElement(webdriver.By.css('body'));
  }
  createTestElement(element) {
    return new SeleniumWebDriverElement(element, this._stabilizeCallback);
  }
  createEnvironment(element) {
    return new SeleniumWebDriverHarnessEnvironment(element, this._options);
  }
  async getAllRawElements(selector) {
    const els = await this._options.queryFn(selector, this.rawRootElement);
    return els.map(x => () => x);
  }
}

export { SeleniumWebDriverElement, SeleniumWebDriverHarnessEnvironment, waitForAngularReady };
//# sourceMappingURL=testing-selenium-webdriver.mjs.map
