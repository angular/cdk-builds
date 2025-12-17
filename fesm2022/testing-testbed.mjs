import { flush } from '@angular/core/testing';
import { takeWhile } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { getNoKeysSpecifiedError, _getTextWithExcludedElements, TestKey, HarnessEnvironment, handleAutoChangeDetectionStatus, stopHandlingAutoChangeDetectionStatus } from './testing.mjs';
import { PERIOD, BACKSPACE, TAB, ENTER, SHIFT, CONTROL, ALT, ESCAPE, PAGE_UP, PAGE_DOWN, END, HOME, LEFT_ARROW, UP_ARROW, RIGHT_ARROW, DOWN_ARROW, INSERT, DELETE, F1, F2, F3, F4, F5, F6, F7, F8, F9, F10, F11, F12, META, COMMA } from './_keycodes-chunk.mjs';

const stateObservableSymbol = Symbol('ProxyZone_PATCHED#stateObservable');
class TaskStateZoneInterceptor {
  _lastState = null;
  _stateSubject = new BehaviorSubject(this._lastState ? this._getTaskStateFromInternalZoneState(this._lastState) : {
    stable: true
  });
  state = this._stateSubject;
  constructor(lastState) {
    this._lastState = lastState;
  }
  onHasTask(delegate, current, target, hasTaskState) {
    if (current === target) {
      this._stateSubject.next(this._getTaskStateFromInternalZoneState(hasTaskState));
    }
  }
  _getTaskStateFromInternalZoneState(state) {
    return {
      stable: !state.macroTask && !state.microTask
    };
  }
  static isInProxyZone() {
    if (typeof Zone === 'undefined') {
      return false;
    }
    return Zone['ProxyZoneSpec']?.get() !== undefined;
  }
  static setup() {
    if (Zone === undefined) {
      throw Error('Could not find ZoneJS. For test harnesses running in TestBed, ' + 'ZoneJS needs to be installed.');
    }
    const ProxyZoneSpec = Zone['ProxyZoneSpec'];
    if (!ProxyZoneSpec) {
      throw Error('ProxyZoneSpec is needed for the test harnesses but could not be found. ' + 'Please make sure that your environment includes zone.js/dist/zone-testing.js');
    }
    const zoneSpec = ProxyZoneSpec.assertPresent();
    if (zoneSpec[stateObservableSymbol]) {
      return zoneSpec[stateObservableSymbol];
    }
    const interceptor = new TaskStateZoneInterceptor(zoneSpec.lastTaskState);
    const zoneSpecOnHasTask = zoneSpec.onHasTask.bind(zoneSpec);
    zoneSpec.onHasTask = function (...args) {
      zoneSpecOnHasTask(...args);
      interceptor.onHasTask(...args);
    };
    return zoneSpec[stateObservableSymbol] = interceptor.state;
  }
}

function createMouseEvent(type, clientX = 0, clientY = 0, offsetX = 0, offsetY = 0, button = 0, modifiers = {}) {
  const screenX = clientX;
  const screenY = clientY;
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    view: getEventView(),
    detail: 1,
    relatedTarget: null,
    screenX,
    screenY,
    clientX,
    clientY,
    ctrlKey: modifiers.control,
    altKey: modifiers.alt,
    shiftKey: modifiers.shift,
    metaKey: modifiers.meta,
    button: button,
    buttons: 1
  });
  if (offsetX != null) {
    defineReadonlyEventProperty(event, 'offsetX', offsetX);
  }
  if (offsetY != null) {
    defineReadonlyEventProperty(event, 'offsetY', offsetY);
  }
  return event;
}
function createPointerEvent(type, clientX = 0, clientY = 0, offsetX, offsetY, options = {
  isPrimary: true
}) {
  const event = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    view: getEventView(),
    clientX,
    clientY,
    ...options
  });
  if (offsetX != null) {
    defineReadonlyEventProperty(event, 'offsetX', offsetX);
  }
  if (offsetY != null) {
    defineReadonlyEventProperty(event, 'offsetY', offsetY);
  }
  return event;
}
function createKeyboardEvent(type, keyCode = 0, key = '', modifiers = {}, code = '') {
  return new KeyboardEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    view: getEventView(),
    keyCode,
    key,
    shiftKey: modifiers.shift,
    metaKey: modifiers.meta,
    altKey: modifiers.alt,
    ctrlKey: modifiers.control,
    code
  });
}
function createFakeEvent(type, bubbles = false, cancelable = true, composed = true) {
  return new Event(type, {
    bubbles,
    cancelable,
    composed
  });
}
function defineReadonlyEventProperty(event, propertyName, value) {
  Object.defineProperty(event, propertyName, {
    get: () => value,
    configurable: true
  });
}
function getEventView() {
  return typeof window !== 'undefined' && window && !window.jsdom ? window : undefined;
}

function dispatchEvent(node, event) {
  node.dispatchEvent(event);
  return event;
}
function dispatchFakeEvent(node, type, bubbles) {
  return dispatchEvent(node, createFakeEvent(type, bubbles));
}
function dispatchKeyboardEvent(node, type, keyCode, key, modifiers, code) {
  return dispatchEvent(node, createKeyboardEvent(type, keyCode, key, modifiers, code));
}
function dispatchMouseEvent(node, type, clientX = 0, clientY = 0, offsetX, offsetY, button, modifiers) {
  return dispatchEvent(node, createMouseEvent(type, clientX, clientY, offsetX, offsetY, button, modifiers));
}
function dispatchPointerEvent(node, type, clientX = 0, clientY = 0, offsetX, offsetY, options) {
  return dispatchEvent(node, createPointerEvent(type, clientX, clientY, offsetX, offsetY, options));
}

function triggerFocusChange(element, event) {
  let eventFired = false;
  const handler = () => eventFired = true;
  element.addEventListener(event, handler);
  element[event]();
  element.removeEventListener(event, handler);
  if (!eventFired) {
    dispatchFakeEvent(element, event);
  }
}
function triggerFocus(element) {
  triggerFocusChange(element, 'focus');
}
function triggerBlur(element) {
  triggerFocusChange(element, 'blur');
}

const incrementalInputTypes = new Set(['text', 'email', 'hidden', 'password', 'search', 'tel', 'url']);
const charsToCodes = {
  ' ': 'Space',
  '.': 'Period',
  ',': 'Comma',
  '`': 'Backquote',
  '-': 'Minus',
  '=': 'Equal',
  '[': 'BracketLeft',
  ']': 'BracketRight',
  '\\': 'Backslash',
  '/': 'Slash',
  "'": 'Quote',
  '"': 'Quote',
  ';': 'Semicolon'
};
function getKeyboardEventCode(char) {
  if (char.length !== 1) {
    return '';
  }
  const charCode = char.charCodeAt(0);
  if (charCode >= 97 && charCode <= 122 || charCode >= 65 && charCode <= 90) {
    return `Key${char.toUpperCase()}`;
  }
  if (48 <= charCode && charCode <= 57) {
    return `Digit${char}`;
  }
  return charsToCodes[char] ?? '';
}
function isTextInput(element) {
  const nodeName = element.nodeName.toLowerCase();
  return nodeName === 'input' || nodeName === 'textarea';
}
function typeInElement(element, ...modifiersAndKeys) {
  const first = modifiersAndKeys[0];
  let modifiers;
  let rest;
  if (first !== undefined && typeof first !== 'string' && first.keyCode === undefined && first.key === undefined) {
    modifiers = first;
    rest = modifiersAndKeys.slice(1);
  } else {
    modifiers = {};
    rest = modifiersAndKeys;
  }
  const isInput = isTextInput(element);
  const inputType = element.getAttribute('type') || 'text';
  const keys = rest.map(k => typeof k === 'string' ? k.split('').map(c => ({
    keyCode: c.toUpperCase().charCodeAt(0),
    key: c,
    code: getKeyboardEventCode(c)
  })) : [k]).reduce((arr, k) => arr.concat(k), []);
  if (keys.length === 0) {
    throw getNoKeysSpecifiedError();
  }
  const enterValueIncrementally = inputType === 'number' ? keys.every(key => key.key !== '.' && key.key !== '-' && key.keyCode !== PERIOD) : incrementalInputTypes.has(inputType);
  triggerFocus(element);
  if (!enterValueIncrementally) {
    element.value = keys.reduce((value, key) => value + (key.key || ''), '');
  }
  for (const key of keys) {
    dispatchKeyboardEvent(element, 'keydown', key.keyCode, key.key, modifiers, key.code);
    dispatchKeyboardEvent(element, 'keypress', key.keyCode, key.key, modifiers, key.code);
    if (isInput && key.key && key.key.length === 1) {
      if (enterValueIncrementally) {
        element.value += key.key;
        dispatchFakeEvent(element, 'input');
      }
    }
    dispatchKeyboardEvent(element, 'keyup', key.keyCode, key.key, modifiers, key.code);
  }
  if (!enterValueIncrementally) {
    dispatchFakeEvent(element, 'input');
  }
}
function clearElement(element) {
  triggerFocus(element);
  element.value = '';
  dispatchFakeEvent(element, 'input');
}

const keyMap = {
  [TestKey.BACKSPACE]: {
    keyCode: BACKSPACE,
    key: 'Backspace',
    code: 'Backspace'
  },
  [TestKey.TAB]: {
    keyCode: TAB,
    key: 'Tab',
    code: 'Tab'
  },
  [TestKey.ENTER]: {
    keyCode: ENTER,
    key: 'Enter',
    code: 'Enter'
  },
  [TestKey.SHIFT]: {
    keyCode: SHIFT,
    key: 'Shift',
    code: 'ShiftLeft'
  },
  [TestKey.CONTROL]: {
    keyCode: CONTROL,
    key: 'Control',
    code: 'ControlLeft'
  },
  [TestKey.ALT]: {
    keyCode: ALT,
    key: 'Alt',
    code: 'AltLeft'
  },
  [TestKey.ESCAPE]: {
    keyCode: ESCAPE,
    key: 'Escape',
    code: 'Escape'
  },
  [TestKey.PAGE_UP]: {
    keyCode: PAGE_UP,
    key: 'PageUp',
    code: 'PageUp'
  },
  [TestKey.PAGE_DOWN]: {
    keyCode: PAGE_DOWN,
    key: 'PageDown',
    code: 'PageDown'
  },
  [TestKey.END]: {
    keyCode: END,
    key: 'End',
    code: 'End'
  },
  [TestKey.HOME]: {
    keyCode: HOME,
    key: 'Home',
    code: 'Home'
  },
  [TestKey.LEFT_ARROW]: {
    keyCode: LEFT_ARROW,
    key: 'ArrowLeft',
    code: 'ArrowLeft'
  },
  [TestKey.UP_ARROW]: {
    keyCode: UP_ARROW,
    key: 'ArrowUp',
    code: 'ArrowUp'
  },
  [TestKey.RIGHT_ARROW]: {
    keyCode: RIGHT_ARROW,
    key: 'ArrowRight',
    code: 'ArrowRight'
  },
  [TestKey.DOWN_ARROW]: {
    keyCode: DOWN_ARROW,
    key: 'ArrowDown',
    code: 'ArrowDown'
  },
  [TestKey.INSERT]: {
    keyCode: INSERT,
    key: 'Insert',
    code: 'Insert'
  },
  [TestKey.DELETE]: {
    keyCode: DELETE,
    key: 'Delete',
    code: 'Delete'
  },
  [TestKey.F1]: {
    keyCode: F1,
    key: 'F1',
    code: 'F1'
  },
  [TestKey.F2]: {
    keyCode: F2,
    key: 'F2',
    code: 'F2'
  },
  [TestKey.F3]: {
    keyCode: F3,
    key: 'F3',
    code: 'F3'
  },
  [TestKey.F4]: {
    keyCode: F4,
    key: 'F4',
    code: 'F4'
  },
  [TestKey.F5]: {
    keyCode: F5,
    key: 'F5',
    code: 'F5'
  },
  [TestKey.F6]: {
    keyCode: F6,
    key: 'F6',
    code: 'F6'
  },
  [TestKey.F7]: {
    keyCode: F7,
    key: 'F7',
    code: 'F7'
  },
  [TestKey.F8]: {
    keyCode: F8,
    key: 'F8',
    code: 'F8'
  },
  [TestKey.F9]: {
    keyCode: F9,
    key: 'F9',
    code: 'F9'
  },
  [TestKey.F10]: {
    keyCode: F10,
    key: 'F10',
    code: 'F10'
  },
  [TestKey.F11]: {
    keyCode: F11,
    key: 'F11',
    code: 'F11'
  },
  [TestKey.F12]: {
    keyCode: F12,
    key: 'F12',
    code: 'F12'
  },
  [TestKey.META]: {
    keyCode: META,
    key: 'Meta',
    code: 'MetaLeft'
  },
  [TestKey.COMMA]: {
    keyCode: COMMA,
    key: ',',
    code: 'Comma'
  }
};
class UnitTestElement {
  element;
  _stabilize;
  constructor(element, _stabilize) {
    this.element = element;
    this._stabilize = _stabilize;
  }
  async blur() {
    triggerBlur(this.element);
    await this._stabilize();
  }
  async clear() {
    if (!isTextInput(this.element)) {
      throw Error('Attempting to clear an invalid element');
    }
    clearElement(this.element);
    await this._stabilize();
  }
  async click(...args) {
    const isDisabled = this.element.disabled === true;
    await this._dispatchMouseEventSequence(isDisabled ? null : 'click', args, 0);
    await this._stabilize();
  }
  async rightClick(...args) {
    await this._dispatchMouseEventSequence('contextmenu', args, 2);
    await this._stabilize();
  }
  async focus() {
    triggerFocus(this.element);
    await this._stabilize();
  }
  async getCssValue(property) {
    await this._stabilize();
    return getComputedStyle(this.element).getPropertyValue(property);
  }
  async hover() {
    this._dispatchPointerEventIfSupported('pointerenter');
    dispatchMouseEvent(this.element, 'mouseover');
    dispatchMouseEvent(this.element, 'mouseenter');
    await this._stabilize();
  }
  async mouseAway() {
    this._dispatchPointerEventIfSupported('pointerleave');
    dispatchMouseEvent(this.element, 'mouseout');
    dispatchMouseEvent(this.element, 'mouseleave');
    await this._stabilize();
  }
  async sendKeys(...modifiersAndKeys) {
    const args = modifiersAndKeys.map(k => typeof k === 'number' ? keyMap[k] : k);
    typeInElement(this.element, ...args);
    await this._stabilize();
  }
  async text(options) {
    await this._stabilize();
    if (options?.exclude) {
      return _getTextWithExcludedElements(this.element, options.exclude);
    }
    return (this.element.textContent || '').trim();
  }
  async setContenteditableValue(value) {
    const contenteditableAttr = await this.getAttribute('contenteditable');
    if (contenteditableAttr !== '' && contenteditableAttr !== 'true' && contenteditableAttr !== 'plaintext-only') {
      throw new Error('setContenteditableValue can only be called on a `contenteditable` element.');
    }
    await this._stabilize();
    this.element.textContent = value;
  }
  async getAttribute(name) {
    await this._stabilize();
    return this.element.getAttribute(name);
  }
  async hasClass(name) {
    await this._stabilize();
    return this.element.classList.contains(name);
  }
  async getDimensions() {
    await this._stabilize();
    return this.element.getBoundingClientRect();
  }
  async getProperty(name) {
    await this._stabilize();
    return this.element[name];
  }
  async setInputValue(value) {
    this.element.value = value;
    await this._stabilize();
  }
  async selectOptions(...optionIndexes) {
    let hasChanged = false;
    const options = this.element.querySelectorAll('option');
    const indexes = new Set(optionIndexes);
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      const wasSelected = option.selected;
      option.selected = indexes.has(i);
      if (option.selected !== wasSelected) {
        hasChanged = true;
        dispatchFakeEvent(this.element, 'change');
      }
    }
    if (hasChanged) {
      await this._stabilize();
    }
  }
  async matchesSelector(selector) {
    await this._stabilize();
    const elementPrototype = Element.prototype;
    return (elementPrototype['matches'] || elementPrototype['msMatchesSelector']).call(this.element, selector);
  }
  async isFocused() {
    await this._stabilize();
    return document.activeElement === this.element;
  }
  async dispatchEvent(name, data) {
    const event = createFakeEvent(name);
    if (data) {
      Object.assign(event, data);
    }
    dispatchEvent(this.element, event);
    await this._stabilize();
  }
  _dispatchPointerEventIfSupported(name, clientX, clientY, offsetX, offsetY, button) {
    if (typeof PointerEvent !== 'undefined' && PointerEvent) {
      dispatchPointerEvent(this.element, name, clientX, clientY, offsetX, offsetY, {
        isPrimary: true,
        button
      });
    }
  }
  async _dispatchMouseEventSequence(primaryEventName, args, button) {
    let clientX = undefined;
    let clientY = undefined;
    let offsetX = undefined;
    let offsetY = undefined;
    let modifiers = {};
    if (args.length && typeof args[args.length - 1] === 'object') {
      modifiers = args.pop();
    }
    if (args.length) {
      const {
        left,
        top,
        width,
        height
      } = await this.getDimensions();
      offsetX = args[0] === 'center' ? width / 2 : args[0];
      offsetY = args[0] === 'center' ? height / 2 : args[1];
      clientX = Math.round(left + offsetX);
      clientY = Math.round(top + offsetY);
    }
    this._dispatchPointerEventIfSupported('pointerdown', clientX, clientY, offsetX, offsetY, button);
    dispatchMouseEvent(this.element, 'mousedown', clientX, clientY, offsetX, offsetY, button, modifiers);
    this._dispatchPointerEventIfSupported('pointerup', clientX, clientY, offsetX, offsetY, button);
    dispatchMouseEvent(this.element, 'mouseup', clientX, clientY, offsetX, offsetY, button, modifiers);
    if (primaryEventName !== null) {
      dispatchMouseEvent(this.element, primaryEventName, clientX, clientY, offsetX, offsetY, button, modifiers);
    }
    await this._stabilize();
  }
}

const defaultEnvironmentOptions = {
  queryFn: (selector, root) => root.querySelectorAll(selector)
};
let disableAutoChangeDetection = false;
const activeFixtures = new Set();
function installAutoChangeDetectionStatusHandler(fixture) {
  if (!activeFixtures.size) {
    handleAutoChangeDetectionStatus(({
      isDisabled,
      onDetectChangesNow
    }) => {
      disableAutoChangeDetection = isDisabled;
      if (onDetectChangesNow) {
        Promise.all(Array.from(activeFixtures).map(detectChanges)).then(onDetectChangesNow);
      }
    });
  }
  activeFixtures.add(fixture);
}
function uninstallAutoChangeDetectionStatusHandler(fixture) {
  activeFixtures.delete(fixture);
  if (!activeFixtures.size) {
    stopHandlingAutoChangeDetectionStatus();
  }
}
function isInFakeAsyncZone() {
  return typeof Zone !== 'undefined' && Zone.current.get('FakeAsyncTestZoneSpec') != null;
}
async function detectChanges(fixture) {
  fixture.detectChanges();
  if (isInFakeAsyncZone()) {
    flush();
  } else {
    await fixture.whenStable();
  }
}
class TestbedHarnessEnvironment extends HarnessEnvironment {
  _fixture;
  _destroyed = false;
  _taskState;
  _options;
  _stabilizeCallback;
  constructor(rawRootElement, _fixture, options) {
    super(rawRootElement);
    this._fixture = _fixture;
    this._options = {
      ...defaultEnvironmentOptions,
      ...options
    };
    if (TaskStateZoneInterceptor.isInProxyZone()) {
      this._taskState = TaskStateZoneInterceptor.setup();
    }
    this._stabilizeCallback = () => this.forceStabilize();
    installAutoChangeDetectionStatusHandler(_fixture);
    _fixture.componentRef.onDestroy(() => {
      uninstallAutoChangeDetectionStatusHandler(_fixture);
      this._destroyed = true;
    });
  }
  static loader(fixture, options) {
    return new TestbedHarnessEnvironment(fixture.nativeElement, fixture, options);
  }
  static documentRootLoader(fixture, options) {
    return new TestbedHarnessEnvironment(document.body, fixture, options);
  }
  static getNativeElement(el) {
    if (el instanceof UnitTestElement) {
      return el.element;
    }
    throw Error('This TestElement was not created by the TestbedHarnessEnvironment');
  }
  static async harnessForFixture(fixture, harnessType, options) {
    const environment = new TestbedHarnessEnvironment(fixture.nativeElement, fixture, options);
    await environment.forceStabilize();
    return environment.createComponentHarness(harnessType, fixture.nativeElement);
  }
  async forceStabilize() {
    if (!disableAutoChangeDetection) {
      if (this._destroyed) {
        throw Error('Harness is attempting to use a fixture that has already been destroyed.');
      }
      await detectChanges(this._fixture);
    }
  }
  async waitForTasksOutsideAngular() {
    if (isInFakeAsyncZone()) {
      flush();
    }
    await this._taskState?.pipe(takeWhile(state => !state.stable)).toPromise();
  }
  getDocumentRoot() {
    return document.body;
  }
  createTestElement(element) {
    return new UnitTestElement(element, this._stabilizeCallback);
  }
  createEnvironment(element) {
    return new TestbedHarnessEnvironment(element, this._fixture, this._options);
  }
  async getAllRawElements(selector) {
    await this.forceStabilize();
    return Array.from(this._options.queryFn(selector, this.rawRootElement));
  }
}

export { TestbedHarnessEnvironment, UnitTestElement };
//# sourceMappingURL=testing-testbed.mjs.map
