import * as i0 from '@angular/core';
import { inject, Injectable, afterNextRender, NgZone, DOCUMENT, Injector, ElementRef, booleanAttribute, Directive, Input, InjectionToken, NgModule } from '@angular/core';
import { CdkMonitorFocus } from './_focus-monitor-chunk.mjs';
import { Platform } from './_platform-chunk.mjs';
import { _getFocusedElementPierceShadowDom } from './_shadow-dom-chunk.mjs';
import { _CdkPrivateStyleLoader } from './_style-loader-chunk.mjs';
import { _VisuallyHiddenLoader, _setInnerHtml } from './private.mjs';
import { BreakpointObserver } from './_breakpoints-observer-chunk.mjs';
import { DomSanitizer } from '@angular/platform-browser';
import { ContentObserver, ObserversModule } from './observers.mjs';

class IsFocusableConfig {
  ignoreVisibility = false;
}
class InteractivityChecker {
  _platform = inject(Platform);
  constructor() {}
  isDisabled(element) {
    return element.hasAttribute('disabled');
  }
  isVisible(element) {
    return hasGeometry(element) && getComputedStyle(element).visibility === 'visible';
  }
  isTabbable(element) {
    if (!this._platform.isBrowser) {
      return false;
    }
    const frameElement = getFrameElement(getWindow(element));
    if (frameElement) {
      if (getTabIndexValue(frameElement) === -1) {
        return false;
      }
      if (!this.isVisible(frameElement)) {
        return false;
      }
    }
    let nodeName = element.nodeName.toLowerCase();
    let tabIndexValue = getTabIndexValue(element);
    if (element.hasAttribute('contenteditable')) {
      return tabIndexValue !== -1;
    }
    if (nodeName === 'iframe' || nodeName === 'object') {
      return false;
    }
    if (this._platform.WEBKIT && this._platform.IOS && !isPotentiallyTabbableIOS(element)) {
      return false;
    }
    if (nodeName === 'audio') {
      if (!element.hasAttribute('controls')) {
        return false;
      }
      return tabIndexValue !== -1;
    }
    if (nodeName === 'video') {
      if (tabIndexValue === -1) {
        return false;
      }
      if (tabIndexValue !== null) {
        return true;
      }
      return this._platform.FIREFOX || element.hasAttribute('controls');
    }
    return element.tabIndex >= 0;
  }
  isFocusable(element, config) {
    return isPotentiallyFocusable(element) && !this.isDisabled(element) && (config?.ignoreVisibility || this.isVisible(element));
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: InteractivityChecker,
    deps: [],
    target: i0.ɵɵFactoryTarget.Injectable
  });
  static ɵprov = i0.ɵɵngDeclareInjectable({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: InteractivityChecker,
    providedIn: 'root'
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: InteractivityChecker,
  decorators: [{
    type: Injectable,
    args: [{
      providedIn: 'root'
    }]
  }],
  ctorParameters: () => []
});
function getFrameElement(window) {
  try {
    return window.frameElement;
  } catch {
    return null;
  }
}
function hasGeometry(element) {
  return !!(element.offsetWidth || element.offsetHeight || typeof element.getClientRects === 'function' && element.getClientRects().length);
}
function isNativeFormElement(element) {
  let nodeName = element.nodeName.toLowerCase();
  return nodeName === 'input' || nodeName === 'select' || nodeName === 'button' || nodeName === 'textarea';
}
function isHiddenInput(element) {
  return isInputElement(element) && element.type == 'hidden';
}
function isAnchorWithHref(element) {
  return isAnchorElement(element) && element.hasAttribute('href');
}
function isInputElement(element) {
  return element.nodeName.toLowerCase() == 'input';
}
function isAnchorElement(element) {
  return element.nodeName.toLowerCase() == 'a';
}
function hasValidTabIndex(element) {
  if (!element.hasAttribute('tabindex') || element.tabIndex === undefined) {
    return false;
  }
  let tabIndex = element.getAttribute('tabindex');
  return !!(tabIndex && !isNaN(parseInt(tabIndex, 10)));
}
function getTabIndexValue(element) {
  if (!hasValidTabIndex(element)) {
    return null;
  }
  const tabIndex = parseInt(element.getAttribute('tabindex') || '', 10);
  return isNaN(tabIndex) ? -1 : tabIndex;
}
function isPotentiallyTabbableIOS(element) {
  let nodeName = element.nodeName.toLowerCase();
  let inputType = nodeName === 'input' && element.type;
  return inputType === 'text' || inputType === 'password' || nodeName === 'select' || nodeName === 'textarea';
}
function isPotentiallyFocusable(element) {
  if (isHiddenInput(element)) {
    return false;
  }
  return isNativeFormElement(element) || isAnchorWithHref(element) || element.hasAttribute('contenteditable') || hasValidTabIndex(element);
}
function getWindow(node) {
  return node.ownerDocument && node.ownerDocument.defaultView || window;
}

class FocusTrap {
  _element;
  _checker;
  _ngZone;
  _document;
  _injector;
  _startAnchor = null;
  _endAnchor = null;
  _hasAttached = false;
  startAnchorListener = () => this.focusLastTabbableElement();
  endAnchorListener = () => this.focusFirstTabbableElement();
  get enabled() {
    return this._enabled;
  }
  set enabled(value) {
    this._enabled = value;
    if (this._startAnchor && this._endAnchor) {
      this._toggleAnchorTabIndex(value, this._startAnchor);
      this._toggleAnchorTabIndex(value, this._endAnchor);
    }
  }
  _enabled = true;
  constructor(_element, _checker, _ngZone, _document, deferAnchors = false, _injector) {
    this._element = _element;
    this._checker = _checker;
    this._ngZone = _ngZone;
    this._document = _document;
    this._injector = _injector;
    if (!deferAnchors) {
      this.attachAnchors();
    }
  }
  destroy() {
    const startAnchor = this._startAnchor;
    const endAnchor = this._endAnchor;
    if (startAnchor) {
      startAnchor.removeEventListener('focus', this.startAnchorListener);
      startAnchor.remove();
    }
    if (endAnchor) {
      endAnchor.removeEventListener('focus', this.endAnchorListener);
      endAnchor.remove();
    }
    this._startAnchor = this._endAnchor = null;
    this._hasAttached = false;
  }
  attachAnchors() {
    if (this._hasAttached) {
      return true;
    }
    this._ngZone.runOutsideAngular(() => {
      if (!this._startAnchor) {
        this._startAnchor = this._createAnchor();
        this._startAnchor.addEventListener('focus', this.startAnchorListener);
      }
      if (!this._endAnchor) {
        this._endAnchor = this._createAnchor();
        this._endAnchor.addEventListener('focus', this.endAnchorListener);
      }
    });
    if (this._element.parentNode) {
      this._element.parentNode.insertBefore(this._startAnchor, this._element);
      this._element.parentNode.insertBefore(this._endAnchor, this._element.nextSibling);
      this._hasAttached = true;
    }
    return this._hasAttached;
  }
  focusInitialElementWhenReady(options) {
    return new Promise(resolve => {
      this._executeOnStable(() => resolve(this.focusInitialElement(options)));
    });
  }
  focusFirstTabbableElementWhenReady(options) {
    return new Promise(resolve => {
      this._executeOnStable(() => resolve(this.focusFirstTabbableElement(options)));
    });
  }
  focusLastTabbableElementWhenReady(options) {
    return new Promise(resolve => {
      this._executeOnStable(() => resolve(this.focusLastTabbableElement(options)));
    });
  }
  _getRegionBoundary(bound) {
    const markers = this._element.querySelectorAll(`[cdk-focus-region-${bound}], ` + `[cdkFocusRegion${bound}], ` + `[cdk-focus-${bound}]`);
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      for (let i = 0; i < markers.length; i++) {
        if (markers[i].hasAttribute(`cdk-focus-${bound}`)) {
          console.warn(`Found use of deprecated attribute 'cdk-focus-${bound}', ` + `use 'cdkFocusRegion${bound}' instead. The deprecated ` + `attribute will be removed in 8.0.0.`, markers[i]);
        } else if (markers[i].hasAttribute(`cdk-focus-region-${bound}`)) {
          console.warn(`Found use of deprecated attribute 'cdk-focus-region-${bound}', ` + `use 'cdkFocusRegion${bound}' instead. The deprecated attribute ` + `will be removed in 8.0.0.`, markers[i]);
        }
      }
    }
    if (bound == 'start') {
      return markers.length ? markers[0] : this._getFirstTabbableElement(this._element);
    }
    return markers.length ? markers[markers.length - 1] : this._getLastTabbableElement(this._element);
  }
  focusInitialElement(options) {
    const redirectToElement = this._element.querySelector(`[cdk-focus-initial], ` + `[cdkFocusInitial]`);
    if (redirectToElement) {
      if ((typeof ngDevMode === 'undefined' || ngDevMode) && redirectToElement.hasAttribute(`cdk-focus-initial`)) {
        console.warn(`Found use of deprecated attribute 'cdk-focus-initial', ` + `use 'cdkFocusInitial' instead. The deprecated attribute ` + `will be removed in 8.0.0`, redirectToElement);
      }
      if ((typeof ngDevMode === 'undefined' || ngDevMode) && !this._checker.isFocusable(redirectToElement)) {
        console.warn(`Element matching '[cdkFocusInitial]' is not focusable.`, redirectToElement);
      }
      if (!this._checker.isFocusable(redirectToElement)) {
        const focusableChild = this._getFirstTabbableElement(redirectToElement);
        focusableChild?.focus(options);
        return !!focusableChild;
      }
      redirectToElement.focus(options);
      return true;
    }
    return this.focusFirstTabbableElement(options);
  }
  focusFirstTabbableElement(options) {
    const redirectToElement = this._getRegionBoundary('start');
    if (redirectToElement) {
      redirectToElement.focus(options);
    }
    return !!redirectToElement;
  }
  focusLastTabbableElement(options) {
    const redirectToElement = this._getRegionBoundary('end');
    if (redirectToElement) {
      redirectToElement.focus(options);
    }
    return !!redirectToElement;
  }
  hasAttached() {
    return this._hasAttached;
  }
  _getFirstTabbableElement(root) {
    if (this._checker.isFocusable(root) && this._checker.isTabbable(root)) {
      return root;
    }
    const children = root.children;
    for (let i = 0; i < children.length; i++) {
      const tabbableChild = children[i].nodeType === this._document.ELEMENT_NODE ? this._getFirstTabbableElement(children[i]) : null;
      if (tabbableChild) {
        return tabbableChild;
      }
    }
    return null;
  }
  _getLastTabbableElement(root) {
    if (this._checker.isFocusable(root) && this._checker.isTabbable(root)) {
      return root;
    }
    const children = root.children;
    for (let i = children.length - 1; i >= 0; i--) {
      const tabbableChild = children[i].nodeType === this._document.ELEMENT_NODE ? this._getLastTabbableElement(children[i]) : null;
      if (tabbableChild) {
        return tabbableChild;
      }
    }
    return null;
  }
  _createAnchor() {
    const anchor = this._document.createElement('div');
    this._toggleAnchorTabIndex(this._enabled, anchor);
    anchor.classList.add('cdk-visually-hidden');
    anchor.classList.add('cdk-focus-trap-anchor');
    anchor.setAttribute('aria-hidden', 'true');
    return anchor;
  }
  _toggleAnchorTabIndex(isEnabled, anchor) {
    isEnabled ? anchor.setAttribute('tabindex', '0') : anchor.removeAttribute('tabindex');
  }
  toggleAnchors(enabled) {
    if (this._startAnchor && this._endAnchor) {
      this._toggleAnchorTabIndex(enabled, this._startAnchor);
      this._toggleAnchorTabIndex(enabled, this._endAnchor);
    }
  }
  _executeOnStable(fn) {
    if (this._injector) {
      afterNextRender(fn, {
        injector: this._injector
      });
    } else {
      setTimeout(fn);
    }
  }
}
class FocusTrapFactory {
  _checker = inject(InteractivityChecker);
  _ngZone = inject(NgZone);
  _document = inject(DOCUMENT);
  _injector = inject(Injector);
  constructor() {
    inject(_CdkPrivateStyleLoader).load(_VisuallyHiddenLoader);
  }
  create(element, deferCaptureElements = false) {
    return new FocusTrap(element, this._checker, this._ngZone, this._document, deferCaptureElements, this._injector);
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: FocusTrapFactory,
    deps: [],
    target: i0.ɵɵFactoryTarget.Injectable
  });
  static ɵprov = i0.ɵɵngDeclareInjectable({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: FocusTrapFactory,
    providedIn: 'root'
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: FocusTrapFactory,
  decorators: [{
    type: Injectable,
    args: [{
      providedIn: 'root'
    }]
  }],
  ctorParameters: () => []
});
class CdkTrapFocus {
  _elementRef = inject(ElementRef);
  _focusTrapFactory = inject(FocusTrapFactory);
  focusTrap = undefined;
  _previouslyFocusedElement = null;
  get enabled() {
    return this.focusTrap?.enabled || false;
  }
  set enabled(value) {
    if (this.focusTrap) {
      this.focusTrap.enabled = value;
    }
  }
  autoCapture = false;
  constructor() {
    const platform = inject(Platform);
    if (platform.isBrowser) {
      this.focusTrap = this._focusTrapFactory.create(this._elementRef.nativeElement, true);
    }
  }
  ngOnDestroy() {
    this.focusTrap?.destroy();
    if (this._previouslyFocusedElement) {
      this._previouslyFocusedElement.focus();
      this._previouslyFocusedElement = null;
    }
  }
  ngAfterContentInit() {
    this.focusTrap?.attachAnchors();
    if (this.autoCapture) {
      this._captureFocus();
    }
  }
  ngDoCheck() {
    if (this.focusTrap && !this.focusTrap.hasAttached()) {
      this.focusTrap.attachAnchors();
    }
  }
  ngOnChanges(changes) {
    const autoCaptureChange = changes['autoCapture'];
    if (autoCaptureChange && !autoCaptureChange.firstChange && this.autoCapture && this.focusTrap?.hasAttached()) {
      this._captureFocus();
    }
  }
  _captureFocus() {
    this._previouslyFocusedElement = _getFocusedElementPierceShadowDom();
    this.focusTrap?.focusInitialElementWhenReady();
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkTrapFocus,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "16.1.0",
    version: "21.0.3",
    type: CdkTrapFocus,
    isStandalone: true,
    selector: "[cdkTrapFocus]",
    inputs: {
      enabled: ["cdkTrapFocus", "enabled", booleanAttribute],
      autoCapture: ["cdkTrapFocusAutoCapture", "autoCapture", booleanAttribute]
    },
    exportAs: ["cdkTrapFocus"],
    usesOnChanges: true,
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkTrapFocus,
  decorators: [{
    type: Directive,
    args: [{
      selector: '[cdkTrapFocus]',
      exportAs: 'cdkTrapFocus'
    }]
  }],
  ctorParameters: () => [],
  propDecorators: {
    enabled: [{
      type: Input,
      args: [{
        alias: 'cdkTrapFocus',
        transform: booleanAttribute
      }]
    }],
    autoCapture: [{
      type: Input,
      args: [{
        alias: 'cdkTrapFocusAutoCapture',
        transform: booleanAttribute
      }]
    }]
  }
});

const LIVE_ANNOUNCER_ELEMENT_TOKEN = new InjectionToken('liveAnnouncerElement', {
  providedIn: 'root',
  factory: () => null
});
const LIVE_ANNOUNCER_DEFAULT_OPTIONS = new InjectionToken('LIVE_ANNOUNCER_DEFAULT_OPTIONS');

let uniqueIds = 0;
class LiveAnnouncer {
  _ngZone = inject(NgZone);
  _defaultOptions = inject(LIVE_ANNOUNCER_DEFAULT_OPTIONS, {
    optional: true
  });
  _liveElement;
  _document = inject(DOCUMENT);
  _sanitizer = inject(DomSanitizer);
  _previousTimeout;
  _currentPromise;
  _currentResolve;
  constructor() {
    const elementToken = inject(LIVE_ANNOUNCER_ELEMENT_TOKEN, {
      optional: true
    });
    this._liveElement = elementToken || this._createLiveElement();
  }
  announce(message, ...args) {
    const defaultOptions = this._defaultOptions;
    let politeness;
    let duration;
    if (args.length === 1 && typeof args[0] === 'number') {
      duration = args[0];
    } else {
      [politeness, duration] = args;
    }
    this.clear();
    clearTimeout(this._previousTimeout);
    if (!politeness) {
      politeness = defaultOptions && defaultOptions.politeness ? defaultOptions.politeness : 'polite';
    }
    if (duration == null && defaultOptions) {
      duration = defaultOptions.duration;
    }
    this._liveElement.setAttribute('aria-live', politeness);
    if (this._liveElement.id) {
      this._exposeAnnouncerToModals(this._liveElement.id);
    }
    return this._ngZone.runOutsideAngular(() => {
      if (!this._currentPromise) {
        this._currentPromise = new Promise(resolve => this._currentResolve = resolve);
      }
      clearTimeout(this._previousTimeout);
      this._previousTimeout = setTimeout(() => {
        if (!message || typeof message === 'string') {
          this._liveElement.textContent = message;
        } else {
          _setInnerHtml(this._liveElement, message, this._sanitizer);
        }
        if (typeof duration === 'number') {
          this._previousTimeout = setTimeout(() => this.clear(), duration);
        }
        this._currentResolve?.();
        this._currentPromise = this._currentResolve = undefined;
      }, 100);
      return this._currentPromise;
    });
  }
  clear() {
    if (this._liveElement) {
      this._liveElement.textContent = '';
    }
  }
  ngOnDestroy() {
    clearTimeout(this._previousTimeout);
    this._liveElement?.remove();
    this._liveElement = null;
    this._currentResolve?.();
    this._currentPromise = this._currentResolve = undefined;
  }
  _createLiveElement() {
    const elementClass = 'cdk-live-announcer-element';
    const previousElements = this._document.getElementsByClassName(elementClass);
    const liveEl = this._document.createElement('div');
    for (let i = 0; i < previousElements.length; i++) {
      previousElements[i].remove();
    }
    liveEl.classList.add(elementClass);
    liveEl.classList.add('cdk-visually-hidden');
    liveEl.setAttribute('aria-atomic', 'true');
    liveEl.setAttribute('aria-live', 'polite');
    liveEl.id = `cdk-live-announcer-${uniqueIds++}`;
    this._document.body.appendChild(liveEl);
    return liveEl;
  }
  _exposeAnnouncerToModals(id) {
    const modals = this._document.querySelectorAll('body > .cdk-overlay-container [aria-modal="true"]');
    for (let i = 0; i < modals.length; i++) {
      const modal = modals[i];
      const ariaOwns = modal.getAttribute('aria-owns');
      if (!ariaOwns) {
        modal.setAttribute('aria-owns', id);
      } else if (ariaOwns.indexOf(id) === -1) {
        modal.setAttribute('aria-owns', ariaOwns + ' ' + id);
      }
    }
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: LiveAnnouncer,
    deps: [],
    target: i0.ɵɵFactoryTarget.Injectable
  });
  static ɵprov = i0.ɵɵngDeclareInjectable({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: LiveAnnouncer,
    providedIn: 'root'
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: LiveAnnouncer,
  decorators: [{
    type: Injectable,
    args: [{
      providedIn: 'root'
    }]
  }],
  ctorParameters: () => []
});
class CdkAriaLive {
  _elementRef = inject(ElementRef);
  _liveAnnouncer = inject(LiveAnnouncer);
  _contentObserver = inject(ContentObserver);
  _ngZone = inject(NgZone);
  get politeness() {
    return this._politeness;
  }
  set politeness(value) {
    this._politeness = value === 'off' || value === 'assertive' ? value : 'polite';
    if (this._politeness === 'off') {
      if (this._subscription) {
        this._subscription.unsubscribe();
        this._subscription = undefined;
      }
    } else if (!this._subscription) {
      this._subscription = this._ngZone.runOutsideAngular(() => {
        return this._contentObserver.observe(this._elementRef).subscribe(() => {
          const elementText = this._elementRef.nativeElement.textContent;
          if (elementText !== this._previousAnnouncedText) {
            this._liveAnnouncer.announce(elementText, this._politeness, this.duration);
            this._previousAnnouncedText = elementText;
          }
        });
      });
    }
  }
  _politeness = 'polite';
  duration;
  _previousAnnouncedText;
  _subscription;
  constructor() {
    inject(_CdkPrivateStyleLoader).load(_VisuallyHiddenLoader);
  }
  ngOnDestroy() {
    this._subscription?.unsubscribe();
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkAriaLive,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "14.0.0",
    version: "21.0.3",
    type: CdkAriaLive,
    isStandalone: true,
    selector: "[cdkAriaLive]",
    inputs: {
      politeness: ["cdkAriaLive", "politeness"],
      duration: ["cdkAriaLiveDuration", "duration"]
    },
    exportAs: ["cdkAriaLive"],
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkAriaLive,
  decorators: [{
    type: Directive,
    args: [{
      selector: '[cdkAriaLive]',
      exportAs: 'cdkAriaLive'
    }]
  }],
  ctorParameters: () => [],
  propDecorators: {
    politeness: [{
      type: Input,
      args: ['cdkAriaLive']
    }],
    duration: [{
      type: Input,
      args: ['cdkAriaLiveDuration']
    }]
  }
});

var HighContrastMode;
(function (HighContrastMode) {
  HighContrastMode[HighContrastMode["NONE"] = 0] = "NONE";
  HighContrastMode[HighContrastMode["BLACK_ON_WHITE"] = 1] = "BLACK_ON_WHITE";
  HighContrastMode[HighContrastMode["WHITE_ON_BLACK"] = 2] = "WHITE_ON_BLACK";
})(HighContrastMode || (HighContrastMode = {}));
const BLACK_ON_WHITE_CSS_CLASS = 'cdk-high-contrast-black-on-white';
const WHITE_ON_BLACK_CSS_CLASS = 'cdk-high-contrast-white-on-black';
const HIGH_CONTRAST_MODE_ACTIVE_CSS_CLASS = 'cdk-high-contrast-active';
class HighContrastModeDetector {
  _platform = inject(Platform);
  _hasCheckedHighContrastMode = false;
  _document = inject(DOCUMENT);
  _breakpointSubscription;
  constructor() {
    this._breakpointSubscription = inject(BreakpointObserver).observe('(forced-colors: active)').subscribe(() => {
      if (this._hasCheckedHighContrastMode) {
        this._hasCheckedHighContrastMode = false;
        this._applyBodyHighContrastModeCssClasses();
      }
    });
  }
  getHighContrastMode() {
    if (!this._platform.isBrowser) {
      return HighContrastMode.NONE;
    }
    const testElement = this._document.createElement('div');
    testElement.style.backgroundColor = 'rgb(1,2,3)';
    testElement.style.position = 'absolute';
    this._document.body.appendChild(testElement);
    const documentWindow = this._document.defaultView || window;
    const computedStyle = documentWindow && documentWindow.getComputedStyle ? documentWindow.getComputedStyle(testElement) : null;
    const computedColor = (computedStyle && computedStyle.backgroundColor || '').replace(/ /g, '');
    testElement.remove();
    switch (computedColor) {
      case 'rgb(0,0,0)':
      case 'rgb(45,50,54)':
      case 'rgb(32,32,32)':
        return HighContrastMode.WHITE_ON_BLACK;
      case 'rgb(255,255,255)':
      case 'rgb(255,250,239)':
        return HighContrastMode.BLACK_ON_WHITE;
    }
    return HighContrastMode.NONE;
  }
  ngOnDestroy() {
    this._breakpointSubscription.unsubscribe();
  }
  _applyBodyHighContrastModeCssClasses() {
    if (!this._hasCheckedHighContrastMode && this._platform.isBrowser && this._document.body) {
      const bodyClasses = this._document.body.classList;
      bodyClasses.remove(HIGH_CONTRAST_MODE_ACTIVE_CSS_CLASS, BLACK_ON_WHITE_CSS_CLASS, WHITE_ON_BLACK_CSS_CLASS);
      this._hasCheckedHighContrastMode = true;
      const mode = this.getHighContrastMode();
      if (mode === HighContrastMode.BLACK_ON_WHITE) {
        bodyClasses.add(HIGH_CONTRAST_MODE_ACTIVE_CSS_CLASS, BLACK_ON_WHITE_CSS_CLASS);
      } else if (mode === HighContrastMode.WHITE_ON_BLACK) {
        bodyClasses.add(HIGH_CONTRAST_MODE_ACTIVE_CSS_CLASS, WHITE_ON_BLACK_CSS_CLASS);
      }
    }
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: HighContrastModeDetector,
    deps: [],
    target: i0.ɵɵFactoryTarget.Injectable
  });
  static ɵprov = i0.ɵɵngDeclareInjectable({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: HighContrastModeDetector,
    providedIn: 'root'
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: HighContrastModeDetector,
  decorators: [{
    type: Injectable,
    args: [{
      providedIn: 'root'
    }]
  }],
  ctorParameters: () => []
});

class A11yModule {
  constructor() {
    inject(HighContrastModeDetector)._applyBodyHighContrastModeCssClasses();
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: A11yModule,
    deps: [],
    target: i0.ɵɵFactoryTarget.NgModule
  });
  static ɵmod = i0.ɵɵngDeclareNgModule({
    minVersion: "14.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: A11yModule,
    imports: [ObserversModule, CdkAriaLive, CdkTrapFocus, CdkMonitorFocus],
    exports: [CdkAriaLive, CdkTrapFocus, CdkMonitorFocus]
  });
  static ɵinj = i0.ɵɵngDeclareInjector({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: A11yModule,
    imports: [ObserversModule]
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: A11yModule,
  decorators: [{
    type: NgModule,
    args: [{
      imports: [ObserversModule, CdkAriaLive, CdkTrapFocus, CdkMonitorFocus],
      exports: [CdkAriaLive, CdkTrapFocus, CdkMonitorFocus]
    }]
  }],
  ctorParameters: () => []
});

export { A11yModule, CdkAriaLive, CdkTrapFocus, FocusTrap, FocusTrapFactory, HighContrastMode, HighContrastModeDetector, InteractivityChecker, IsFocusableConfig, LIVE_ANNOUNCER_DEFAULT_OPTIONS, LIVE_ANNOUNCER_ELEMENT_TOKEN, LiveAnnouncer };
//# sourceMappingURL=_a11y-module-chunk.mjs.map
