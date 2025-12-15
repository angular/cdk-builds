import * as i0 from '@angular/core';
import { inject, ElementRef, NgZone, Renderer2, ChangeDetectorRef, Injector, DOCUMENT, afterNextRender, Component, ViewEncapsulation, ChangeDetectionStrategy, ViewChild, InjectionToken, TemplateRef, Injectable, signal, EventEmitter, NgModule } from '@angular/core';
import { Subject, defer } from 'rxjs';
import { BasePortalOutlet, CdkPortalOutlet, ComponentPortal, TemplatePortal, PortalModule } from './portal.mjs';
export { CdkPortal as ɵɵCdkPortal } from './portal.mjs';
import { FocusTrapFactory, InteractivityChecker, A11yModule } from './_a11y-module-chunk.mjs';
import { FocusMonitor } from './_focus-monitor-chunk.mjs';
import { Platform } from './_platform-chunk.mjs';
import { _getFocusedElementPierceShadowDom } from './_shadow-dom-chunk.mjs';
import { ESCAPE } from './_keycodes-chunk.mjs';
import { hasModifierKey } from './keycodes.mjs';
import { startWith, take } from 'rxjs/operators';
import { createBlockScrollStrategy, OverlayContainer, createOverlayRef, OverlayConfig, createGlobalPositionStrategy, OverlayRef, OverlayModule } from './_overlay-module-chunk.mjs';
import { _IdGenerator } from './_id-generator-chunk.mjs';
import { Directionality } from './_directionality-chunk.mjs';
import './_style-loader-chunk.mjs';
import './private.mjs';
import './_breakpoints-observer-chunk.mjs';
import './_array-chunk.mjs';
import '@angular/platform-browser';
import './observers.mjs';
import './_element-chunk.mjs';
import './_fake-event-detection-chunk.mjs';
import './_passive-listeners-chunk.mjs';
import '@angular/common';
import './_test-environment-chunk.mjs';
import './_css-pixel-value-chunk.mjs';
import './scrolling.mjs';
import './_scrolling-chunk.mjs';
import './bidi.mjs';
import './_recycle-view-repeater-strategy-chunk.mjs';
import './_data-source-chunk.mjs';

class DialogConfig {
  viewContainerRef;
  injector;
  id;
  role = 'dialog';
  panelClass = '';
  hasBackdrop = true;
  backdropClass = '';
  disableClose = false;
  closePredicate;
  width = '';
  height = '';
  minWidth;
  minHeight;
  maxWidth;
  maxHeight;
  positionStrategy;
  data = null;
  direction;
  ariaDescribedBy = null;
  ariaLabelledBy = null;
  ariaLabel = null;
  ariaModal = false;
  autoFocus = 'first-tabbable';
  restoreFocus = true;
  scrollStrategy;
  closeOnNavigation = true;
  closeOnDestroy = true;
  closeOnOverlayDetachments = true;
  disableAnimations = false;
  providers;
  container;
  templateContext;
}

function throwDialogContentAlreadyAttachedError() {
  throw Error('Attempting to attach dialog content after content is already attached');
}
class CdkDialogContainer extends BasePortalOutlet {
  _elementRef = inject(ElementRef);
  _focusTrapFactory = inject(FocusTrapFactory);
  _config;
  _interactivityChecker = inject(InteractivityChecker);
  _ngZone = inject(NgZone);
  _focusMonitor = inject(FocusMonitor);
  _renderer = inject(Renderer2);
  _changeDetectorRef = inject(ChangeDetectorRef);
  _injector = inject(Injector);
  _platform = inject(Platform);
  _document = inject(DOCUMENT);
  _portalOutlet;
  _focusTrapped = new Subject();
  _focusTrap = null;
  _elementFocusedBeforeDialogWasOpened = null;
  _closeInteractionType = null;
  _ariaLabelledByQueue = [];
  _isDestroyed = false;
  constructor() {
    super();
    this._config = inject(DialogConfig, {
      optional: true
    }) || new DialogConfig();
    if (this._config.ariaLabelledBy) {
      this._ariaLabelledByQueue.push(this._config.ariaLabelledBy);
    }
  }
  _addAriaLabelledBy(id) {
    this._ariaLabelledByQueue.push(id);
    this._changeDetectorRef.markForCheck();
  }
  _removeAriaLabelledBy(id) {
    const index = this._ariaLabelledByQueue.indexOf(id);
    if (index > -1) {
      this._ariaLabelledByQueue.splice(index, 1);
      this._changeDetectorRef.markForCheck();
    }
  }
  _contentAttached() {
    this._initializeFocusTrap();
    this._captureInitialFocus();
  }
  _captureInitialFocus() {
    this._trapFocus();
  }
  ngOnDestroy() {
    this._focusTrapped.complete();
    this._isDestroyed = true;
    this._restoreFocus();
  }
  attachComponentPortal(portal) {
    if (this._portalOutlet.hasAttached() && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throwDialogContentAlreadyAttachedError();
    }
    const result = this._portalOutlet.attachComponentPortal(portal);
    this._contentAttached();
    return result;
  }
  attachTemplatePortal(portal) {
    if (this._portalOutlet.hasAttached() && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throwDialogContentAlreadyAttachedError();
    }
    const result = this._portalOutlet.attachTemplatePortal(portal);
    this._contentAttached();
    return result;
  }
  attachDomPortal = portal => {
    if (this._portalOutlet.hasAttached() && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throwDialogContentAlreadyAttachedError();
    }
    const result = this._portalOutlet.attachDomPortal(portal);
    this._contentAttached();
    return result;
  };
  _recaptureFocus() {
    if (!this._containsFocus()) {
      this._trapFocus();
    }
  }
  _forceFocus(element, options) {
    if (!this._interactivityChecker.isFocusable(element)) {
      element.tabIndex = -1;
      this._ngZone.runOutsideAngular(() => {
        const callback = () => {
          deregisterBlur();
          deregisterMousedown();
          element.removeAttribute('tabindex');
        };
        const deregisterBlur = this._renderer.listen(element, 'blur', callback);
        const deregisterMousedown = this._renderer.listen(element, 'mousedown', callback);
      });
    }
    element.focus(options);
  }
  _focusByCssSelector(selector, options) {
    let elementToFocus = this._elementRef.nativeElement.querySelector(selector);
    if (elementToFocus) {
      this._forceFocus(elementToFocus, options);
    }
  }
  _trapFocus(options) {
    if (this._isDestroyed) {
      return;
    }
    afterNextRender(() => {
      const element = this._elementRef.nativeElement;
      switch (this._config.autoFocus) {
        case false:
        case 'dialog':
          if (!this._containsFocus()) {
            element.focus(options);
          }
          break;
        case true:
        case 'first-tabbable':
          const focusedSuccessfully = this._focusTrap?.focusInitialElement(options);
          if (!focusedSuccessfully) {
            this._focusDialogContainer(options);
          }
          break;
        case 'first-heading':
          this._focusByCssSelector('h1, h2, h3, h4, h5, h6, [role="heading"]', options);
          break;
        default:
          this._focusByCssSelector(this._config.autoFocus, options);
          break;
      }
      this._focusTrapped.next();
    }, {
      injector: this._injector
    });
  }
  _restoreFocus() {
    const focusConfig = this._config.restoreFocus;
    let focusTargetElement = null;
    if (typeof focusConfig === 'string') {
      focusTargetElement = this._document.querySelector(focusConfig);
    } else if (typeof focusConfig === 'boolean') {
      focusTargetElement = focusConfig ? this._elementFocusedBeforeDialogWasOpened : null;
    } else if (focusConfig) {
      focusTargetElement = focusConfig;
    }
    if (this._config.restoreFocus && focusTargetElement && typeof focusTargetElement.focus === 'function') {
      const activeElement = _getFocusedElementPierceShadowDom();
      const element = this._elementRef.nativeElement;
      if (!activeElement || activeElement === this._document.body || activeElement === element || element.contains(activeElement)) {
        if (this._focusMonitor) {
          this._focusMonitor.focusVia(focusTargetElement, this._closeInteractionType);
          this._closeInteractionType = null;
        } else {
          focusTargetElement.focus();
        }
      }
    }
    if (this._focusTrap) {
      this._focusTrap.destroy();
    }
  }
  _focusDialogContainer(options) {
    this._elementRef.nativeElement.focus?.(options);
  }
  _containsFocus() {
    const element = this._elementRef.nativeElement;
    const activeElement = _getFocusedElementPierceShadowDom();
    return element === activeElement || element.contains(activeElement);
  }
  _initializeFocusTrap() {
    if (this._platform.isBrowser) {
      this._focusTrap = this._focusTrapFactory.create(this._elementRef.nativeElement);
      if (this._document) {
        this._elementFocusedBeforeDialogWasOpened = _getFocusedElementPierceShadowDom();
      }
    }
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkDialogContainer,
    deps: [],
    target: i0.ɵɵFactoryTarget.Component
  });
  static ɵcmp = i0.ɵɵngDeclareComponent({
    minVersion: "14.0.0",
    version: "21.0.3",
    type: CdkDialogContainer,
    isStandalone: true,
    selector: "cdk-dialog-container",
    host: {
      attributes: {
        "tabindex": "-1"
      },
      properties: {
        "attr.id": "_config.id || null",
        "attr.role": "_config.role",
        "attr.aria-modal": "_config.ariaModal",
        "attr.aria-labelledby": "_config.ariaLabel ? null : _ariaLabelledByQueue[0]",
        "attr.aria-label": "_config.ariaLabel",
        "attr.aria-describedby": "_config.ariaDescribedBy || null"
      },
      classAttribute: "cdk-dialog-container"
    },
    viewQueries: [{
      propertyName: "_portalOutlet",
      first: true,
      predicate: CdkPortalOutlet,
      descendants: true,
      static: true
    }],
    usesInheritance: true,
    ngImport: i0,
    template: "<ng-template cdkPortalOutlet />\n",
    styles: [".cdk-dialog-container{display:block;width:100%;height:100%;min-height:inherit;max-height:inherit}\n"],
    dependencies: [{
      kind: "directive",
      type: CdkPortalOutlet,
      selector: "[cdkPortalOutlet]",
      inputs: ["cdkPortalOutlet"],
      outputs: ["attached"],
      exportAs: ["cdkPortalOutlet"]
    }],
    changeDetection: i0.ChangeDetectionStrategy.Default,
    encapsulation: i0.ViewEncapsulation.None
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkDialogContainer,
  decorators: [{
    type: Component,
    args: [{
      selector: 'cdk-dialog-container',
      encapsulation: ViewEncapsulation.None,
      changeDetection: ChangeDetectionStrategy.Default,
      imports: [CdkPortalOutlet],
      host: {
        'class': 'cdk-dialog-container',
        'tabindex': '-1',
        '[attr.id]': '_config.id || null',
        '[attr.role]': '_config.role',
        '[attr.aria-modal]': '_config.ariaModal',
        '[attr.aria-labelledby]': '_config.ariaLabel ? null : _ariaLabelledByQueue[0]',
        '[attr.aria-label]': '_config.ariaLabel',
        '[attr.aria-describedby]': '_config.ariaDescribedBy || null'
      },
      template: "<ng-template cdkPortalOutlet />\n",
      styles: [".cdk-dialog-container{display:block;width:100%;height:100%;min-height:inherit;max-height:inherit}\n"]
    }]
  }],
  ctorParameters: () => [],
  propDecorators: {
    _portalOutlet: [{
      type: ViewChild,
      args: [CdkPortalOutlet, {
        static: true
      }]
    }]
  }
});

class DialogRef {
  overlayRef;
  config;
  componentInstance = null;
  componentRef = null;
  containerInstance;
  disableClose;
  closed = new Subject();
  backdropClick;
  keydownEvents;
  outsidePointerEvents;
  id;
  _detachSubscription;
  constructor(overlayRef, config) {
    this.overlayRef = overlayRef;
    this.config = config;
    this.disableClose = config.disableClose;
    this.backdropClick = overlayRef.backdropClick();
    this.keydownEvents = overlayRef.keydownEvents();
    this.outsidePointerEvents = overlayRef.outsidePointerEvents();
    this.id = config.id;
    this.keydownEvents.subscribe(event => {
      if (event.keyCode === ESCAPE && !this.disableClose && !hasModifierKey(event)) {
        event.preventDefault();
        this.close(undefined, {
          focusOrigin: 'keyboard'
        });
      }
    });
    this.backdropClick.subscribe(() => {
      if (!this.disableClose && this._canClose()) {
        this.close(undefined, {
          focusOrigin: 'mouse'
        });
      } else {
        this.containerInstance._recaptureFocus?.();
      }
    });
    this._detachSubscription = overlayRef.detachments().subscribe(() => {
      if (config.closeOnOverlayDetachments !== false) {
        this.close();
      }
    });
  }
  close(result, options) {
    if (this._canClose(result)) {
      const closedSubject = this.closed;
      this.containerInstance._closeInteractionType = options?.focusOrigin || 'program';
      this._detachSubscription.unsubscribe();
      this.overlayRef.dispose();
      closedSubject.next(result);
      closedSubject.complete();
      this.componentInstance = this.containerInstance = null;
    }
  }
  updatePosition() {
    this.overlayRef.updatePosition();
    return this;
  }
  updateSize(width = '', height = '') {
    this.overlayRef.updateSize({
      width,
      height
    });
    return this;
  }
  addPanelClass(classes) {
    this.overlayRef.addPanelClass(classes);
    return this;
  }
  removePanelClass(classes) {
    this.overlayRef.removePanelClass(classes);
    return this;
  }
  _canClose(result) {
    const config = this.config;
    return !!this.containerInstance && (!config.closePredicate || config.closePredicate(result, config, this.componentInstance));
  }
}

const DIALOG_SCROLL_STRATEGY = new InjectionToken('DialogScrollStrategy', {
  providedIn: 'root',
  factory: () => {
    const injector = inject(Injector);
    return () => createBlockScrollStrategy(injector);
  }
});
const DIALOG_DATA = new InjectionToken('DialogData');
const DEFAULT_DIALOG_CONFIG = new InjectionToken('DefaultDialogConfig');

function getDirectionality(value) {
  const valueSignal = signal(value, ...(ngDevMode ? [{
    debugName: "valueSignal"
  }] : []));
  const change = new EventEmitter();
  return {
    valueSignal,
    get value() {
      return valueSignal();
    },
    change,
    ngOnDestroy() {
      change.complete();
    }
  };
}
class Dialog {
  _injector = inject(Injector);
  _defaultOptions = inject(DEFAULT_DIALOG_CONFIG, {
    optional: true
  });
  _parentDialog = inject(Dialog, {
    optional: true,
    skipSelf: true
  });
  _overlayContainer = inject(OverlayContainer);
  _idGenerator = inject(_IdGenerator);
  _openDialogsAtThisLevel = [];
  _afterAllClosedAtThisLevel = new Subject();
  _afterOpenedAtThisLevel = new Subject();
  _ariaHiddenElements = new Map();
  _scrollStrategy = inject(DIALOG_SCROLL_STRATEGY);
  get openDialogs() {
    return this._parentDialog ? this._parentDialog.openDialogs : this._openDialogsAtThisLevel;
  }
  get afterOpened() {
    return this._parentDialog ? this._parentDialog.afterOpened : this._afterOpenedAtThisLevel;
  }
  afterAllClosed = defer(() => this.openDialogs.length ? this._getAfterAllClosed() : this._getAfterAllClosed().pipe(startWith(undefined)));
  constructor() {}
  open(componentOrTemplateRef, config) {
    const defaults = this._defaultOptions || new DialogConfig();
    config = {
      ...defaults,
      ...config
    };
    config.id = config.id || this._idGenerator.getId('cdk-dialog-');
    if (config.id && this.getDialogById(config.id) && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw Error(`Dialog with id "${config.id}" exists already. The dialog id must be unique.`);
    }
    const overlayConfig = this._getOverlayConfig(config);
    const overlayRef = createOverlayRef(this._injector, overlayConfig);
    const dialogRef = new DialogRef(overlayRef, config);
    const dialogContainer = this._attachContainer(overlayRef, dialogRef, config);
    dialogRef.containerInstance = dialogContainer;
    if (!this.openDialogs.length) {
      const overlayContainer = this._overlayContainer.getContainerElement();
      if (dialogContainer._focusTrapped) {
        dialogContainer._focusTrapped.pipe(take(1)).subscribe(() => {
          this._hideNonDialogContentFromAssistiveTechnology(overlayContainer);
        });
      } else {
        this._hideNonDialogContentFromAssistiveTechnology(overlayContainer);
      }
    }
    this._attachDialogContent(componentOrTemplateRef, dialogRef, dialogContainer, config);
    this.openDialogs.push(dialogRef);
    dialogRef.closed.subscribe(() => this._removeOpenDialog(dialogRef, true));
    this.afterOpened.next(dialogRef);
    return dialogRef;
  }
  closeAll() {
    reverseForEach(this.openDialogs, dialog => dialog.close());
  }
  getDialogById(id) {
    return this.openDialogs.find(dialog => dialog.id === id);
  }
  ngOnDestroy() {
    reverseForEach(this._openDialogsAtThisLevel, dialog => {
      if (dialog.config.closeOnDestroy === false) {
        this._removeOpenDialog(dialog, false);
      }
    });
    reverseForEach(this._openDialogsAtThisLevel, dialog => dialog.close());
    this._afterAllClosedAtThisLevel.complete();
    this._afterOpenedAtThisLevel.complete();
    this._openDialogsAtThisLevel = [];
  }
  _getOverlayConfig(config) {
    const state = new OverlayConfig({
      positionStrategy: config.positionStrategy || createGlobalPositionStrategy().centerHorizontally().centerVertically(),
      scrollStrategy: config.scrollStrategy || this._scrollStrategy(),
      panelClass: config.panelClass,
      hasBackdrop: config.hasBackdrop,
      direction: config.direction,
      minWidth: config.minWidth,
      minHeight: config.minHeight,
      maxWidth: config.maxWidth,
      maxHeight: config.maxHeight,
      width: config.width,
      height: config.height,
      disposeOnNavigation: config.closeOnNavigation,
      disableAnimations: config.disableAnimations
    });
    if (config.backdropClass) {
      state.backdropClass = config.backdropClass;
    }
    return state;
  }
  _attachContainer(overlay, dialogRef, config) {
    const userInjector = config.injector || config.viewContainerRef?.injector;
    const providers = [{
      provide: DialogConfig,
      useValue: config
    }, {
      provide: DialogRef,
      useValue: dialogRef
    }, {
      provide: OverlayRef,
      useValue: overlay
    }];
    let containerType;
    if (config.container) {
      if (typeof config.container === 'function') {
        containerType = config.container;
      } else {
        containerType = config.container.type;
        providers.push(...config.container.providers(config));
      }
    } else {
      containerType = CdkDialogContainer;
    }
    const containerPortal = new ComponentPortal(containerType, config.viewContainerRef, Injector.create({
      parent: userInjector || this._injector,
      providers
    }));
    const containerRef = overlay.attach(containerPortal);
    return containerRef.instance;
  }
  _attachDialogContent(componentOrTemplateRef, dialogRef, dialogContainer, config) {
    if (componentOrTemplateRef instanceof TemplateRef) {
      const injector = this._createInjector(config, dialogRef, dialogContainer, undefined);
      let context = {
        $implicit: config.data,
        dialogRef
      };
      if (config.templateContext) {
        context = {
          ...context,
          ...(typeof config.templateContext === 'function' ? config.templateContext() : config.templateContext)
        };
      }
      dialogContainer.attachTemplatePortal(new TemplatePortal(componentOrTemplateRef, null, context, injector));
    } else {
      const injector = this._createInjector(config, dialogRef, dialogContainer, this._injector);
      const contentRef = dialogContainer.attachComponentPortal(new ComponentPortal(componentOrTemplateRef, config.viewContainerRef, injector));
      dialogRef.componentRef = contentRef;
      dialogRef.componentInstance = contentRef.instance;
    }
  }
  _createInjector(config, dialogRef, dialogContainer, fallbackInjector) {
    const userInjector = config.injector || config.viewContainerRef?.injector;
    const providers = [{
      provide: DIALOG_DATA,
      useValue: config.data
    }, {
      provide: DialogRef,
      useValue: dialogRef
    }];
    if (config.providers) {
      if (typeof config.providers === 'function') {
        providers.push(...config.providers(dialogRef, config, dialogContainer));
      } else {
        providers.push(...config.providers);
      }
    }
    if (config.direction && (!userInjector || !userInjector.get(Directionality, null, {
      optional: true
    }))) {
      providers.push({
        provide: Directionality,
        useValue: getDirectionality(config.direction)
      });
    }
    return Injector.create({
      parent: userInjector || fallbackInjector,
      providers
    });
  }
  _removeOpenDialog(dialogRef, emitEvent) {
    const index = this.openDialogs.indexOf(dialogRef);
    if (index > -1) {
      this.openDialogs.splice(index, 1);
      if (!this.openDialogs.length) {
        this._ariaHiddenElements.forEach((previousValue, element) => {
          if (previousValue) {
            element.setAttribute('aria-hidden', previousValue);
          } else {
            element.removeAttribute('aria-hidden');
          }
        });
        this._ariaHiddenElements.clear();
        if (emitEvent) {
          this._getAfterAllClosed().next();
        }
      }
    }
  }
  _hideNonDialogContentFromAssistiveTechnology(overlayContainer) {
    if (overlayContainer.parentElement) {
      const siblings = overlayContainer.parentElement.children;
      for (let i = siblings.length - 1; i > -1; i--) {
        const sibling = siblings[i];
        if (sibling !== overlayContainer && sibling.nodeName !== 'SCRIPT' && sibling.nodeName !== 'STYLE' && !sibling.hasAttribute('aria-live') && !sibling.hasAttribute('popover')) {
          this._ariaHiddenElements.set(sibling, sibling.getAttribute('aria-hidden'));
          sibling.setAttribute('aria-hidden', 'true');
        }
      }
    }
  }
  _getAfterAllClosed() {
    const parent = this._parentDialog;
    return parent ? parent._getAfterAllClosed() : this._afterAllClosedAtThisLevel;
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: Dialog,
    deps: [],
    target: i0.ɵɵFactoryTarget.Injectable
  });
  static ɵprov = i0.ɵɵngDeclareInjectable({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: Dialog,
    providedIn: 'root'
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: Dialog,
  decorators: [{
    type: Injectable,
    args: [{
      providedIn: 'root'
    }]
  }],
  ctorParameters: () => []
});
function reverseForEach(items, callback) {
  let i = items.length;
  while (i--) {
    callback(items[i]);
  }
}

class DialogModule {
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: DialogModule,
    deps: [],
    target: i0.ɵɵFactoryTarget.NgModule
  });
  static ɵmod = i0.ɵɵngDeclareNgModule({
    minVersion: "14.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: DialogModule,
    imports: [OverlayModule, PortalModule, A11yModule, CdkDialogContainer],
    exports: [PortalModule, CdkDialogContainer]
  });
  static ɵinj = i0.ɵɵngDeclareInjector({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: DialogModule,
    providers: [Dialog],
    imports: [OverlayModule, PortalModule, A11yModule, PortalModule]
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: DialogModule,
  decorators: [{
    type: NgModule,
    args: [{
      imports: [OverlayModule, PortalModule, A11yModule, CdkDialogContainer],
      exports: [PortalModule, CdkDialogContainer],
      providers: [Dialog]
    }]
  }]
});

export { CdkDialogContainer, DEFAULT_DIALOG_CONFIG, DIALOG_DATA, DIALOG_SCROLL_STRATEGY, Dialog, DialogConfig, DialogModule, DialogRef, throwDialogContentAlreadyAttachedError, CdkPortalOutlet as ɵɵCdkPortalOutlet };
//# sourceMappingURL=dialog.mjs.map
