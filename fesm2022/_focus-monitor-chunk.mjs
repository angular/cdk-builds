import * as i0 from '@angular/core';
import { InjectionToken, inject, NgZone, DOCUMENT, RendererFactory2, Injectable, ElementRef, EventEmitter, Directive, Output } from '@angular/core';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { skip, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { isFakeMousedownFromScreenReader, isFakeTouchstartFromScreenReader } from './_fake-event-detection-chunk.mjs';
import { ALT, CONTROL, MAC_META, META, SHIFT } from './_keycodes-chunk.mjs';
import { _getEventTarget, _getShadowRoot } from './_shadow-dom-chunk.mjs';
import { Platform } from './_platform-chunk.mjs';
import { normalizePassiveListenerOptions } from './_passive-listeners-chunk.mjs';
import { coerceElement } from './_element-chunk.mjs';

const INPUT_MODALITY_DETECTOR_OPTIONS = new InjectionToken('cdk-input-modality-detector-options');
const INPUT_MODALITY_DETECTOR_DEFAULT_OPTIONS = {
  ignoreKeys: [ALT, CONTROL, MAC_META, META, SHIFT]
};
const TOUCH_BUFFER_MS = 650;
const modalityEventListenerOptions = {
  passive: true,
  capture: true
};
class InputModalityDetector {
  _platform = inject(Platform);
  _listenerCleanups;
  modalityDetected;
  modalityChanged;
  get mostRecentModality() {
    return this._modality.value;
  }
  _mostRecentTarget = null;
  _modality = new BehaviorSubject(null);
  _options;
  _lastTouchMs = 0;
  _onKeydown = event => {
    if (this._options?.ignoreKeys?.some(keyCode => keyCode === event.keyCode)) {
      return;
    }
    this._modality.next('keyboard');
    this._mostRecentTarget = _getEventTarget(event);
  };
  _onMousedown = event => {
    if (Date.now() - this._lastTouchMs < TOUCH_BUFFER_MS) {
      return;
    }
    this._modality.next(isFakeMousedownFromScreenReader(event) ? 'keyboard' : 'mouse');
    this._mostRecentTarget = _getEventTarget(event);
  };
  _onTouchstart = event => {
    if (isFakeTouchstartFromScreenReader(event)) {
      this._modality.next('keyboard');
      return;
    }
    this._lastTouchMs = Date.now();
    this._modality.next('touch');
    this._mostRecentTarget = _getEventTarget(event);
  };
  constructor() {
    const ngZone = inject(NgZone);
    const document = inject(DOCUMENT);
    const options = inject(INPUT_MODALITY_DETECTOR_OPTIONS, {
      optional: true
    });
    this._options = {
      ...INPUT_MODALITY_DETECTOR_DEFAULT_OPTIONS,
      ...options
    };
    this.modalityDetected = this._modality.pipe(skip(1));
    this.modalityChanged = this.modalityDetected.pipe(distinctUntilChanged());
    if (this._platform.isBrowser) {
      const renderer = inject(RendererFactory2).createRenderer(null, null);
      this._listenerCleanups = ngZone.runOutsideAngular(() => {
        return [renderer.listen(document, 'keydown', this._onKeydown, modalityEventListenerOptions), renderer.listen(document, 'mousedown', this._onMousedown, modalityEventListenerOptions), renderer.listen(document, 'touchstart', this._onTouchstart, modalityEventListenerOptions)];
      });
    }
  }
  ngOnDestroy() {
    this._modality.complete();
    this._listenerCleanups?.forEach(cleanup => cleanup());
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: InputModalityDetector,
    deps: [],
    target: i0.ɵɵFactoryTarget.Injectable
  });
  static ɵprov = i0.ɵɵngDeclareInjectable({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: InputModalityDetector,
    providedIn: 'root'
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: InputModalityDetector,
  decorators: [{
    type: Injectable,
    args: [{
      providedIn: 'root'
    }]
  }],
  ctorParameters: () => []
});

var FocusMonitorDetectionMode;
(function (FocusMonitorDetectionMode) {
  FocusMonitorDetectionMode[FocusMonitorDetectionMode["IMMEDIATE"] = 0] = "IMMEDIATE";
  FocusMonitorDetectionMode[FocusMonitorDetectionMode["EVENTUAL"] = 1] = "EVENTUAL";
})(FocusMonitorDetectionMode || (FocusMonitorDetectionMode = {}));
const FOCUS_MONITOR_DEFAULT_OPTIONS = new InjectionToken('cdk-focus-monitor-default-options');
const captureEventListenerOptions = normalizePassiveListenerOptions({
  passive: true,
  capture: true
});
class FocusMonitor {
  _ngZone = inject(NgZone);
  _platform = inject(Platform);
  _inputModalityDetector = inject(InputModalityDetector);
  _origin = null;
  _lastFocusOrigin = null;
  _windowFocused = false;
  _windowFocusTimeoutId;
  _originTimeoutId;
  _originFromTouchInteraction = false;
  _elementInfo = new Map();
  _monitoredElementCount = 0;
  _rootNodeFocusListenerCount = new Map();
  _detectionMode;
  _windowFocusListener = () => {
    this._windowFocused = true;
    this._windowFocusTimeoutId = setTimeout(() => this._windowFocused = false);
  };
  _document = inject(DOCUMENT);
  _stopInputModalityDetector = new Subject();
  constructor() {
    const options = inject(FOCUS_MONITOR_DEFAULT_OPTIONS, {
      optional: true
    });
    this._detectionMode = options?.detectionMode || FocusMonitorDetectionMode.IMMEDIATE;
  }
  _rootNodeFocusAndBlurListener = event => {
    const target = _getEventTarget(event);
    for (let element = target; element; element = element.parentElement) {
      if (event.type === 'focus') {
        this._onFocus(event, element);
      } else {
        this._onBlur(event, element);
      }
    }
  };
  monitor(element, checkChildren = false) {
    const nativeElement = coerceElement(element);
    if (!this._platform.isBrowser || nativeElement.nodeType !== 1) {
      return of();
    }
    const rootNode = _getShadowRoot(nativeElement) || this._document;
    const cachedInfo = this._elementInfo.get(nativeElement);
    if (cachedInfo) {
      if (checkChildren) {
        cachedInfo.checkChildren = true;
      }
      return cachedInfo.subject;
    }
    const info = {
      checkChildren: checkChildren,
      subject: new Subject(),
      rootNode
    };
    this._elementInfo.set(nativeElement, info);
    this._registerGlobalListeners(info);
    return info.subject;
  }
  stopMonitoring(element) {
    const nativeElement = coerceElement(element);
    const elementInfo = this._elementInfo.get(nativeElement);
    if (elementInfo) {
      elementInfo.subject.complete();
      this._setClasses(nativeElement);
      this._elementInfo.delete(nativeElement);
      this._removeGlobalListeners(elementInfo);
    }
  }
  focusVia(element, origin, options) {
    const nativeElement = coerceElement(element);
    const focusedElement = this._document.activeElement;
    if (nativeElement === focusedElement) {
      this._getClosestElementsInfo(nativeElement).forEach(([currentElement, info]) => this._originChanged(currentElement, origin, info));
    } else {
      this._setOrigin(origin);
      if (typeof nativeElement.focus === 'function') {
        nativeElement.focus(options);
      }
    }
  }
  ngOnDestroy() {
    this._elementInfo.forEach((_info, element) => this.stopMonitoring(element));
  }
  _getWindow() {
    return this._document.defaultView || window;
  }
  _getFocusOrigin(focusEventTarget) {
    if (this._origin) {
      if (this._originFromTouchInteraction) {
        return this._shouldBeAttributedToTouch(focusEventTarget) ? 'touch' : 'program';
      } else {
        return this._origin;
      }
    }
    if (this._windowFocused && this._lastFocusOrigin) {
      return this._lastFocusOrigin;
    }
    if (focusEventTarget && this._isLastInteractionFromInputLabel(focusEventTarget)) {
      return 'mouse';
    }
    return 'program';
  }
  _shouldBeAttributedToTouch(focusEventTarget) {
    return this._detectionMode === FocusMonitorDetectionMode.EVENTUAL || !!focusEventTarget?.contains(this._inputModalityDetector._mostRecentTarget);
  }
  _setClasses(element, origin) {
    element.classList.toggle('cdk-focused', !!origin);
    element.classList.toggle('cdk-touch-focused', origin === 'touch');
    element.classList.toggle('cdk-keyboard-focused', origin === 'keyboard');
    element.classList.toggle('cdk-mouse-focused', origin === 'mouse');
    element.classList.toggle('cdk-program-focused', origin === 'program');
  }
  _setOrigin(origin, isFromInteraction = false) {
    this._ngZone.runOutsideAngular(() => {
      this._origin = origin;
      this._originFromTouchInteraction = origin === 'touch' && isFromInteraction;
      if (this._detectionMode === FocusMonitorDetectionMode.IMMEDIATE) {
        clearTimeout(this._originTimeoutId);
        const ms = this._originFromTouchInteraction ? TOUCH_BUFFER_MS : 1;
        this._originTimeoutId = setTimeout(() => this._origin = null, ms);
      }
    });
  }
  _onFocus(event, element) {
    const elementInfo = this._elementInfo.get(element);
    const focusEventTarget = _getEventTarget(event);
    if (!elementInfo || !elementInfo.checkChildren && element !== focusEventTarget) {
      return;
    }
    this._originChanged(element, this._getFocusOrigin(focusEventTarget), elementInfo);
  }
  _onBlur(event, element) {
    const elementInfo = this._elementInfo.get(element);
    if (!elementInfo || elementInfo.checkChildren && event.relatedTarget instanceof Node && element.contains(event.relatedTarget)) {
      return;
    }
    this._setClasses(element);
    this._emitOrigin(elementInfo, null);
  }
  _emitOrigin(info, origin) {
    if (info.subject.observers.length) {
      this._ngZone.run(() => info.subject.next(origin));
    }
  }
  _registerGlobalListeners(elementInfo) {
    if (!this._platform.isBrowser) {
      return;
    }
    const rootNode = elementInfo.rootNode;
    const rootNodeFocusListeners = this._rootNodeFocusListenerCount.get(rootNode) || 0;
    if (!rootNodeFocusListeners) {
      this._ngZone.runOutsideAngular(() => {
        rootNode.addEventListener('focus', this._rootNodeFocusAndBlurListener, captureEventListenerOptions);
        rootNode.addEventListener('blur', this._rootNodeFocusAndBlurListener, captureEventListenerOptions);
      });
    }
    this._rootNodeFocusListenerCount.set(rootNode, rootNodeFocusListeners + 1);
    if (++this._monitoredElementCount === 1) {
      this._ngZone.runOutsideAngular(() => {
        const window = this._getWindow();
        window.addEventListener('focus', this._windowFocusListener);
      });
      this._inputModalityDetector.modalityDetected.pipe(takeUntil(this._stopInputModalityDetector)).subscribe(modality => {
        this._setOrigin(modality, true);
      });
    }
  }
  _removeGlobalListeners(elementInfo) {
    const rootNode = elementInfo.rootNode;
    if (this._rootNodeFocusListenerCount.has(rootNode)) {
      const rootNodeFocusListeners = this._rootNodeFocusListenerCount.get(rootNode);
      if (rootNodeFocusListeners > 1) {
        this._rootNodeFocusListenerCount.set(rootNode, rootNodeFocusListeners - 1);
      } else {
        rootNode.removeEventListener('focus', this._rootNodeFocusAndBlurListener, captureEventListenerOptions);
        rootNode.removeEventListener('blur', this._rootNodeFocusAndBlurListener, captureEventListenerOptions);
        this._rootNodeFocusListenerCount.delete(rootNode);
      }
    }
    if (! --this._monitoredElementCount) {
      const window = this._getWindow();
      window.removeEventListener('focus', this._windowFocusListener);
      this._stopInputModalityDetector.next();
      clearTimeout(this._windowFocusTimeoutId);
      clearTimeout(this._originTimeoutId);
    }
  }
  _originChanged(element, origin, elementInfo) {
    this._setClasses(element, origin);
    this._emitOrigin(elementInfo, origin);
    this._lastFocusOrigin = origin;
  }
  _getClosestElementsInfo(element) {
    const results = [];
    this._elementInfo.forEach((info, currentElement) => {
      if (currentElement === element || info.checkChildren && currentElement.contains(element)) {
        results.push([currentElement, info]);
      }
    });
    return results;
  }
  _isLastInteractionFromInputLabel(focusEventTarget) {
    const {
      _mostRecentTarget: mostRecentTarget,
      mostRecentModality
    } = this._inputModalityDetector;
    if (mostRecentModality !== 'mouse' || !mostRecentTarget || mostRecentTarget === focusEventTarget || focusEventTarget.nodeName !== 'INPUT' && focusEventTarget.nodeName !== 'TEXTAREA' || focusEventTarget.disabled) {
      return false;
    }
    const labels = focusEventTarget.labels;
    if (labels) {
      for (let i = 0; i < labels.length; i++) {
        if (labels[i].contains(mostRecentTarget)) {
          return true;
        }
      }
    }
    return false;
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: FocusMonitor,
    deps: [],
    target: i0.ɵɵFactoryTarget.Injectable
  });
  static ɵprov = i0.ɵɵngDeclareInjectable({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: FocusMonitor,
    providedIn: 'root'
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: FocusMonitor,
  decorators: [{
    type: Injectable,
    args: [{
      providedIn: 'root'
    }]
  }],
  ctorParameters: () => []
});
class CdkMonitorFocus {
  _elementRef = inject(ElementRef);
  _focusMonitor = inject(FocusMonitor);
  _monitorSubscription;
  _focusOrigin = null;
  cdkFocusChange = new EventEmitter();
  constructor() {}
  get focusOrigin() {
    return this._focusOrigin;
  }
  ngAfterViewInit() {
    const element = this._elementRef.nativeElement;
    this._monitorSubscription = this._focusMonitor.monitor(element, element.nodeType === 1 && element.hasAttribute('cdkMonitorSubtreeFocus')).subscribe(origin => {
      this._focusOrigin = origin;
      this.cdkFocusChange.emit(origin);
    });
  }
  ngOnDestroy() {
    this._focusMonitor.stopMonitoring(this._elementRef);
    this._monitorSubscription?.unsubscribe();
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkMonitorFocus,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "14.0.0",
    version: "21.0.3",
    type: CdkMonitorFocus,
    isStandalone: true,
    selector: "[cdkMonitorElementFocus], [cdkMonitorSubtreeFocus]",
    outputs: {
      cdkFocusChange: "cdkFocusChange"
    },
    exportAs: ["cdkMonitorFocus"],
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkMonitorFocus,
  decorators: [{
    type: Directive,
    args: [{
      selector: '[cdkMonitorElementFocus], [cdkMonitorSubtreeFocus]',
      exportAs: 'cdkMonitorFocus'
    }]
  }],
  ctorParameters: () => [],
  propDecorators: {
    cdkFocusChange: [{
      type: Output
    }]
  }
});

export { CdkMonitorFocus, FOCUS_MONITOR_DEFAULT_OPTIONS, FocusMonitor, FocusMonitorDetectionMode, INPUT_MODALITY_DETECTOR_DEFAULT_OPTIONS, INPUT_MODALITY_DETECTOR_OPTIONS, InputModalityDetector };
//# sourceMappingURL=_focus-monitor-chunk.mjs.map
