export { CdkMonitorFocus, FOCUS_MONITOR_DEFAULT_OPTIONS, FocusMonitor, FocusMonitorDetectionMode, INPUT_MODALITY_DETECTOR_DEFAULT_OPTIONS, INPUT_MODALITY_DETECTOR_OPTIONS, InputModalityDetector } from './_focus-monitor-chunk.mjs';
import { FocusTrap, InteractivityChecker } from './_a11y-module-chunk.mjs';
export { A11yModule, CdkAriaLive, CdkTrapFocus, FocusTrapFactory, HighContrastMode, HighContrastModeDetector, IsFocusableConfig, LIVE_ANNOUNCER_DEFAULT_OPTIONS, LIVE_ANNOUNCER_ELEMENT_TOKEN, LiveAnnouncer } from './_a11y-module-chunk.mjs';
export { _IdGenerator } from './_id-generator-chunk.mjs';
import * as i0 from '@angular/core';
import { inject, DOCUMENT, APP_ID, Injectable, InjectionToken, NgZone, Injector } from '@angular/core';
import { Platform } from './_platform-chunk.mjs';
import { _CdkPrivateStyleLoader } from './_style-loader-chunk.mjs';
import { _VisuallyHiddenLoader } from './private.mjs';
export { ActiveDescendantKeyManager } from './_activedescendant-key-manager-chunk.mjs';
export { FocusKeyManager } from './_focus-key-manager-chunk.mjs';
export { ListKeyManager } from './_list-key-manager-chunk.mjs';
import { Subject } from 'rxjs';
import { TREE_KEY_MANAGER } from './_tree-key-manager-chunk.mjs';
export { TreeKeyManager } from './_tree-key-manager-chunk.mjs';
export { isFakeMousedownFromScreenReader, isFakeTouchstartFromScreenReader } from './_fake-event-detection-chunk.mjs';
import 'rxjs/operators';
import './_keycodes-chunk.mjs';
import './_shadow-dom-chunk.mjs';
import './_passive-listeners-chunk.mjs';
import './_element-chunk.mjs';
import './_breakpoints-observer-chunk.mjs';
import './_array-chunk.mjs';
import '@angular/platform-browser';
import './observers.mjs';
import '@angular/common';
import './_typeahead-chunk.mjs';
import './keycodes.mjs';
import './coercion-private.mjs';

const ID_DELIMITER = ' ';
function addAriaReferencedId(el, attr, id) {
  const ids = getAriaReferenceIds(el, attr);
  id = id.trim();
  if (ids.some(existingId => existingId.trim() === id)) {
    return;
  }
  ids.push(id);
  el.setAttribute(attr, ids.join(ID_DELIMITER));
}
function removeAriaReferencedId(el, attr, id) {
  const ids = getAriaReferenceIds(el, attr);
  id = id.trim();
  const filteredIds = ids.filter(val => val !== id);
  if (filteredIds.length) {
    el.setAttribute(attr, filteredIds.join(ID_DELIMITER));
  } else {
    el.removeAttribute(attr);
  }
}
function getAriaReferenceIds(el, attr) {
  const attrValue = el.getAttribute(attr);
  return attrValue?.match(/\S+/g) ?? [];
}

const MESSAGES_CONTAINER_ID = 'cdk-describedby-message-container';
const CDK_DESCRIBEDBY_ID_PREFIX = 'cdk-describedby-message';
const CDK_DESCRIBEDBY_HOST_ATTRIBUTE = 'cdk-describedby-host';
let nextId = 0;
class AriaDescriber {
  _platform = inject(Platform);
  _document = inject(DOCUMENT);
  _messageRegistry = new Map();
  _messagesContainer = null;
  _id = `${nextId++}`;
  constructor() {
    inject(_CdkPrivateStyleLoader).load(_VisuallyHiddenLoader);
    this._id = inject(APP_ID) + '-' + nextId++;
  }
  describe(hostElement, message, role) {
    if (!this._canBeDescribed(hostElement, message)) {
      return;
    }
    const key = getKey(message, role);
    if (typeof message !== 'string') {
      setMessageId(message, this._id);
      this._messageRegistry.set(key, {
        messageElement: message,
        referenceCount: 0
      });
    } else if (!this._messageRegistry.has(key)) {
      this._createMessageElement(message, role);
    }
    if (!this._isElementDescribedByMessage(hostElement, key)) {
      this._addMessageReference(hostElement, key);
    }
  }
  removeDescription(hostElement, message, role) {
    if (!message || !this._isElementNode(hostElement)) {
      return;
    }
    const key = getKey(message, role);
    if (this._isElementDescribedByMessage(hostElement, key)) {
      this._removeMessageReference(hostElement, key);
    }
    if (typeof message === 'string') {
      const registeredMessage = this._messageRegistry.get(key);
      if (registeredMessage && registeredMessage.referenceCount === 0) {
        this._deleteMessageElement(key);
      }
    }
    if (this._messagesContainer?.childNodes.length === 0) {
      this._messagesContainer.remove();
      this._messagesContainer = null;
    }
  }
  ngOnDestroy() {
    const describedElements = this._document.querySelectorAll(`[${CDK_DESCRIBEDBY_HOST_ATTRIBUTE}="${this._id}"]`);
    for (let i = 0; i < describedElements.length; i++) {
      this._removeCdkDescribedByReferenceIds(describedElements[i]);
      describedElements[i].removeAttribute(CDK_DESCRIBEDBY_HOST_ATTRIBUTE);
    }
    this._messagesContainer?.remove();
    this._messagesContainer = null;
    this._messageRegistry.clear();
  }
  _createMessageElement(message, role) {
    const messageElement = this._document.createElement('div');
    setMessageId(messageElement, this._id);
    messageElement.textContent = message;
    if (role) {
      messageElement.setAttribute('role', role);
    }
    this._createMessagesContainer();
    this._messagesContainer.appendChild(messageElement);
    this._messageRegistry.set(getKey(message, role), {
      messageElement,
      referenceCount: 0
    });
  }
  _deleteMessageElement(key) {
    this._messageRegistry.get(key)?.messageElement?.remove();
    this._messageRegistry.delete(key);
  }
  _createMessagesContainer() {
    if (this._messagesContainer) {
      return;
    }
    const containerClassName = 'cdk-describedby-message-container';
    const serverContainers = this._document.querySelectorAll(`.${containerClassName}[platform="server"]`);
    for (let i = 0; i < serverContainers.length; i++) {
      serverContainers[i].remove();
    }
    const messagesContainer = this._document.createElement('div');
    messagesContainer.style.visibility = 'hidden';
    messagesContainer.classList.add(containerClassName);
    messagesContainer.classList.add('cdk-visually-hidden');
    if (!this._platform.isBrowser) {
      messagesContainer.setAttribute('platform', 'server');
    }
    this._document.body.appendChild(messagesContainer);
    this._messagesContainer = messagesContainer;
  }
  _removeCdkDescribedByReferenceIds(element) {
    const originalReferenceIds = getAriaReferenceIds(element, 'aria-describedby').filter(id => id.indexOf(CDK_DESCRIBEDBY_ID_PREFIX) != 0);
    element.setAttribute('aria-describedby', originalReferenceIds.join(' '));
  }
  _addMessageReference(element, key) {
    const registeredMessage = this._messageRegistry.get(key);
    addAriaReferencedId(element, 'aria-describedby', registeredMessage.messageElement.id);
    element.setAttribute(CDK_DESCRIBEDBY_HOST_ATTRIBUTE, this._id);
    registeredMessage.referenceCount++;
  }
  _removeMessageReference(element, key) {
    const registeredMessage = this._messageRegistry.get(key);
    registeredMessage.referenceCount--;
    removeAriaReferencedId(element, 'aria-describedby', registeredMessage.messageElement.id);
    element.removeAttribute(CDK_DESCRIBEDBY_HOST_ATTRIBUTE);
  }
  _isElementDescribedByMessage(element, key) {
    const referenceIds = getAriaReferenceIds(element, 'aria-describedby');
    const registeredMessage = this._messageRegistry.get(key);
    const messageId = registeredMessage && registeredMessage.messageElement.id;
    return !!messageId && referenceIds.indexOf(messageId) != -1;
  }
  _canBeDescribed(element, message) {
    if (!this._isElementNode(element)) {
      return false;
    }
    if (message && typeof message === 'object') {
      return true;
    }
    const trimmedMessage = message == null ? '' : `${message}`.trim();
    const ariaLabel = element.getAttribute('aria-label');
    return trimmedMessage ? !ariaLabel || ariaLabel.trim() !== trimmedMessage : false;
  }
  _isElementNode(element) {
    return element.nodeType === this._document.ELEMENT_NODE;
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: AriaDescriber,
    deps: [],
    target: i0.ɵɵFactoryTarget.Injectable
  });
  static ɵprov = i0.ɵɵngDeclareInjectable({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: AriaDescriber,
    providedIn: 'root'
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: AriaDescriber,
  decorators: [{
    type: Injectable,
    args: [{
      providedIn: 'root'
    }]
  }],
  ctorParameters: () => []
});
function getKey(message, role) {
  return typeof message === 'string' ? `${role || ''}/${message}` : message;
}
function setMessageId(element, serviceId) {
  if (!element.id) {
    element.id = `${CDK_DESCRIBEDBY_ID_PREFIX}-${serviceId}-${nextId++}`;
  }
}

class NoopTreeKeyManager {
  _isNoopTreeKeyManager = true;
  change = new Subject();
  destroy() {
    this.change.complete();
  }
  onKeydown() {}
  getActiveItemIndex() {
    return null;
  }
  getActiveItem() {
    return null;
  }
  focusItem() {}
}
const NOOP_TREE_KEY_MANAGER_FACTORY_PROVIDER = {
  provide: TREE_KEY_MANAGER,
  useFactory: () => () => new NoopTreeKeyManager()
};

class ConfigurableFocusTrap extends FocusTrap {
  _focusTrapManager;
  _inertStrategy;
  get enabled() {
    return this._enabled;
  }
  set enabled(value) {
    this._enabled = value;
    if (this._enabled) {
      this._focusTrapManager.register(this);
    } else {
      this._focusTrapManager.deregister(this);
    }
  }
  constructor(_element, _checker, _ngZone, _document, _focusTrapManager, _inertStrategy, config, injector) {
    super(_element, _checker, _ngZone, _document, config.defer, injector);
    this._focusTrapManager = _focusTrapManager;
    this._inertStrategy = _inertStrategy;
    this._focusTrapManager.register(this);
  }
  destroy() {
    this._focusTrapManager.deregister(this);
    super.destroy();
  }
  _enable() {
    this._inertStrategy.preventFocus(this);
    this.toggleAnchors(true);
  }
  _disable() {
    this._inertStrategy.allowFocus(this);
    this.toggleAnchors(false);
  }
}

class EventListenerFocusTrapInertStrategy {
  _listener = null;
  preventFocus(focusTrap) {
    if (this._listener) {
      focusTrap._document.removeEventListener('focus', this._listener, true);
    }
    this._listener = e => this._trapFocus(focusTrap, e);
    focusTrap._ngZone.runOutsideAngular(() => {
      focusTrap._document.addEventListener('focus', this._listener, true);
    });
  }
  allowFocus(focusTrap) {
    if (!this._listener) {
      return;
    }
    focusTrap._document.removeEventListener('focus', this._listener, true);
    this._listener = null;
  }
  _trapFocus(focusTrap, event) {
    const target = event.target;
    const focusTrapRoot = focusTrap._element;
    if (target && !focusTrapRoot.contains(target) && !target.closest?.('div.cdk-overlay-pane')) {
      setTimeout(() => {
        if (focusTrap.enabled && !focusTrapRoot.contains(focusTrap._document.activeElement)) {
          focusTrap.focusFirstTabbableElement();
        }
      });
    }
  }
}

const FOCUS_TRAP_INERT_STRATEGY = new InjectionToken('FOCUS_TRAP_INERT_STRATEGY');

class FocusTrapManager {
  _focusTrapStack = [];
  register(focusTrap) {
    this._focusTrapStack = this._focusTrapStack.filter(ft => ft !== focusTrap);
    let stack = this._focusTrapStack;
    if (stack.length) {
      stack[stack.length - 1]._disable();
    }
    stack.push(focusTrap);
    focusTrap._enable();
  }
  deregister(focusTrap) {
    focusTrap._disable();
    const stack = this._focusTrapStack;
    const i = stack.indexOf(focusTrap);
    if (i !== -1) {
      stack.splice(i, 1);
      if (stack.length) {
        stack[stack.length - 1]._enable();
      }
    }
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: FocusTrapManager,
    deps: [],
    target: i0.ɵɵFactoryTarget.Injectable
  });
  static ɵprov = i0.ɵɵngDeclareInjectable({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: FocusTrapManager,
    providedIn: 'root'
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: FocusTrapManager,
  decorators: [{
    type: Injectable,
    args: [{
      providedIn: 'root'
    }]
  }]
});

class ConfigurableFocusTrapFactory {
  _checker = inject(InteractivityChecker);
  _ngZone = inject(NgZone);
  _focusTrapManager = inject(FocusTrapManager);
  _document = inject(DOCUMENT);
  _inertStrategy;
  _injector = inject(Injector);
  constructor() {
    const inertStrategy = inject(FOCUS_TRAP_INERT_STRATEGY, {
      optional: true
    });
    this._inertStrategy = inertStrategy || new EventListenerFocusTrapInertStrategy();
  }
  create(element, config = {
    defer: false
  }) {
    let configObject;
    if (typeof config === 'boolean') {
      configObject = {
        defer: config
      };
    } else {
      configObject = config;
    }
    return new ConfigurableFocusTrap(element, this._checker, this._ngZone, this._document, this._focusTrapManager, this._inertStrategy, configObject, this._injector);
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: ConfigurableFocusTrapFactory,
    deps: [],
    target: i0.ɵɵFactoryTarget.Injectable
  });
  static ɵprov = i0.ɵɵngDeclareInjectable({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: ConfigurableFocusTrapFactory,
    providedIn: 'root'
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: ConfigurableFocusTrapFactory,
  decorators: [{
    type: Injectable,
    args: [{
      providedIn: 'root'
    }]
  }],
  ctorParameters: () => []
});

export { AriaDescriber, CDK_DESCRIBEDBY_HOST_ATTRIBUTE, CDK_DESCRIBEDBY_ID_PREFIX, ConfigurableFocusTrap, ConfigurableFocusTrapFactory, EventListenerFocusTrapInertStrategy, FOCUS_TRAP_INERT_STRATEGY, FocusTrap, InteractivityChecker, MESSAGES_CONTAINER_ID, NOOP_TREE_KEY_MANAGER_FACTORY_PROVIDER, NoopTreeKeyManager, TREE_KEY_MANAGER, addAriaReferencedId, getAriaReferenceIds, removeAriaReferencedId };
//# sourceMappingURL=a11y.mjs.map
