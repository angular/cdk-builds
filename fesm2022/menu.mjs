import * as i0 from '@angular/core';
import { Directive, InjectionToken, inject, Injectable, Injector, ViewContainerRef, EventEmitter, NgZone, RendererFactory2, ElementRef, ChangeDetectorRef, Renderer2, booleanAttribute, Input, Output, QueryList, signal, computed, ContentChildren, NgModule } from '@angular/core';
import { startWith, debounceTime, distinctUntilChanged, takeUntil, mergeMap, mapTo, mergeAll, switchMap, skipWhile, skip } from 'rxjs/operators';
import { UniqueSelectionDispatcher } from './_unique-selection-dispatcher-chunk.mjs';
import { Subject, merge, partition } from 'rxjs';
import { _IdGenerator } from './_id-generator-chunk.mjs';
import { createRepositionScrollStrategy, createOverlayRef, OverlayConfig, createFlexibleConnectedPositionStrategy, STANDARD_DROPDOWN_BELOW_POSITIONS, STANDARD_DROPDOWN_ADJACENT_POSITIONS, OverlayModule } from './_overlay-module-chunk.mjs';
import { TemplatePortal } from './portal.mjs';
import { ENTER, SPACE, UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW, TAB, ESCAPE } from './_keycodes-chunk.mjs';
import { InputModalityDetector, FocusMonitor } from './_focus-monitor-chunk.mjs';
import { Directionality } from './_directionality-chunk.mjs';
import { hasModifierKey } from './keycodes.mjs';
import { _getEventTarget } from './_shadow-dom-chunk.mjs';
import { FocusKeyManager } from './_focus-key-manager-chunk.mjs';
import '@angular/common';
import './_platform-chunk.mjs';
import './_test-environment-chunk.mjs';
import './_style-loader-chunk.mjs';
import './_css-pixel-value-chunk.mjs';
import './_array-chunk.mjs';
import './scrolling.mjs';
import './_element-chunk.mjs';
import './_scrolling-chunk.mjs';
import './bidi.mjs';
import './_recycle-view-repeater-strategy-chunk.mjs';
import './_data-source-chunk.mjs';
import './_fake-event-detection-chunk.mjs';
import './_passive-listeners-chunk.mjs';
import './_list-key-manager-chunk.mjs';
import './_typeahead-chunk.mjs';

class CdkMenuGroup {
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkMenuGroup,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "14.0.0",
    version: "21.0.3",
    type: CdkMenuGroup,
    isStandalone: true,
    selector: "[cdkMenuGroup]",
    host: {
      attributes: {
        "role": "group"
      },
      classAttribute: "cdk-menu-group"
    },
    providers: [{
      provide: UniqueSelectionDispatcher,
      useClass: UniqueSelectionDispatcher
    }],
    exportAs: ["cdkMenuGroup"],
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkMenuGroup,
  decorators: [{
    type: Directive,
    args: [{
      selector: '[cdkMenuGroup]',
      exportAs: 'cdkMenuGroup',
      host: {
        'role': 'group',
        'class': 'cdk-menu-group'
      },
      providers: [{
        provide: UniqueSelectionDispatcher,
        useClass: UniqueSelectionDispatcher
      }]
    }]
  }]
});

const CDK_MENU = new InjectionToken('cdk-menu');

var FocusNext;
(function (FocusNext) {
  FocusNext[FocusNext["nextItem"] = 0] = "nextItem";
  FocusNext[FocusNext["previousItem"] = 1] = "previousItem";
  FocusNext[FocusNext["currentItem"] = 2] = "currentItem";
})(FocusNext || (FocusNext = {}));
const MENU_STACK = new InjectionToken('cdk-menu-stack');
const PARENT_OR_NEW_MENU_STACK_PROVIDER = {
  provide: MENU_STACK,
  useFactory: () => inject(MENU_STACK, {
    optional: true,
    skipSelf: true
  }) || new MenuStack()
};
const PARENT_OR_NEW_INLINE_MENU_STACK_PROVIDER = orientation => ({
  provide: MENU_STACK,
  useFactory: () => inject(MENU_STACK, {
    optional: true,
    skipSelf: true
  }) || MenuStack.inline(orientation)
});
class MenuStack {
  id = inject(_IdGenerator).getId('cdk-menu-stack-');
  _elements = [];
  _close = new Subject();
  _empty = new Subject();
  _hasFocus = new Subject();
  closed = this._close;
  hasFocus = this._hasFocus.pipe(startWith(false), debounceTime(0), distinctUntilChanged());
  emptied = this._empty;
  _inlineMenuOrientation = null;
  static inline(orientation) {
    const stack = new MenuStack();
    stack._inlineMenuOrientation = orientation;
    return stack;
  }
  push(menu) {
    this._elements.push(menu);
  }
  close(lastItem, options) {
    const {
      focusNextOnEmpty,
      focusParentTrigger
    } = {
      ...options
    };
    if (this._elements.indexOf(lastItem) >= 0) {
      let poppedElement;
      do {
        poppedElement = this._elements.pop();
        this._close.next({
          item: poppedElement,
          focusParentTrigger
        });
      } while (poppedElement !== lastItem);
      if (this.isEmpty()) {
        this._empty.next(focusNextOnEmpty);
      }
    }
  }
  closeSubMenuOf(lastItem) {
    let removed = false;
    if (this._elements.indexOf(lastItem) >= 0) {
      removed = this.peek() !== lastItem;
      while (this.peek() !== lastItem) {
        this._close.next({
          item: this._elements.pop()
        });
      }
    }
    return removed;
  }
  closeAll(options) {
    const {
      focusNextOnEmpty,
      focusParentTrigger
    } = {
      ...options
    };
    if (!this.isEmpty()) {
      while (!this.isEmpty()) {
        const menuStackItem = this._elements.pop();
        if (menuStackItem) {
          this._close.next({
            item: menuStackItem,
            focusParentTrigger
          });
        }
      }
      this._empty.next(focusNextOnEmpty);
    }
  }
  isEmpty() {
    return !this._elements.length;
  }
  length() {
    return this._elements.length;
  }
  peek() {
    return this._elements[this._elements.length - 1];
  }
  hasInlineMenu() {
    return this._inlineMenuOrientation != null;
  }
  inlineMenuOrientation() {
    return this._inlineMenuOrientation;
  }
  setHasFocus(hasFocus) {
    this._hasFocus.next(hasFocus);
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: MenuStack,
    deps: [],
    target: i0.ɵɵFactoryTarget.Injectable
  });
  static ɵprov = i0.ɵɵngDeclareInjectable({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: MenuStack
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: MenuStack,
  decorators: [{
    type: Injectable
  }]
});

const MENU_TRIGGER = new InjectionToken('cdk-menu-trigger');
const MENU_SCROLL_STRATEGY = new InjectionToken('cdk-menu-scroll-strategy', {
  providedIn: 'root',
  factory: () => {
    const injector = inject(Injector);
    return () => createRepositionScrollStrategy(injector);
  }
});
class MenuTracker {
  static _openMenuTrigger;
  update(trigger) {
    if (MenuTracker._openMenuTrigger !== trigger) {
      MenuTracker._openMenuTrigger?.close();
      MenuTracker._openMenuTrigger = trigger;
    }
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: MenuTracker,
    deps: [],
    target: i0.ɵɵFactoryTarget.Injectable
  });
  static ɵprov = i0.ɵɵngDeclareInjectable({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: MenuTracker,
    providedIn: 'root'
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: MenuTracker,
  decorators: [{
    type: Injectable,
    args: [{
      providedIn: 'root'
    }]
  }]
});
class CdkMenuTriggerBase {
  injector = inject(Injector);
  viewContainerRef = inject(ViewContainerRef);
  menuStack = inject(MENU_STACK);
  menuScrollStrategy = inject(MENU_SCROLL_STRATEGY);
  menuPosition;
  opened = new EventEmitter();
  closed = new EventEmitter();
  menuTemplateRef = null;
  menuData;
  transformOriginSelector = null;
  overlayRef = null;
  destroyed = new Subject();
  stopOutsideClicksListener = merge(this.closed, this.destroyed);
  childMenu;
  _menuPortal;
  _childMenuInjector;
  ngOnDestroy() {
    this._destroyOverlay();
    this.destroyed.next();
    this.destroyed.complete();
  }
  isOpen() {
    return !!this.overlayRef?.hasAttached();
  }
  registerChildMenu(child) {
    this.childMenu = child;
  }
  getMenuContentPortal() {
    const hasMenuContentChanged = this.menuTemplateRef !== this._menuPortal?.templateRef;
    if (this.menuTemplateRef && (!this._menuPortal || hasMenuContentChanged)) {
      this._menuPortal = new TemplatePortal(this.menuTemplateRef, this.viewContainerRef, this.menuData, this._getChildMenuInjector());
    }
    return this._menuPortal;
  }
  isElementInsideMenuStack(element) {
    for (let el = element; el; el = el?.parentElement ?? null) {
      if (el.getAttribute('data-cdk-menu-stack-id') === this.menuStack.id) {
        return true;
      }
    }
    return false;
  }
  _destroyOverlay() {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }
  _getChildMenuInjector() {
    this._childMenuInjector = this._childMenuInjector || Injector.create({
      providers: [{
        provide: MENU_TRIGGER,
        useValue: this
      }, {
        provide: MENU_STACK,
        useValue: this.menuStack
      }],
      parent: this.injector
    });
    return this._childMenuInjector;
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkMenuTriggerBase,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "14.0.0",
    version: "21.0.3",
    type: CdkMenuTriggerBase,
    isStandalone: true,
    host: {
      properties: {
        "attr.aria-controls": "childMenu?.id",
        "attr.data-cdk-menu-stack-id": "menuStack.id"
      }
    },
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkMenuTriggerBase,
  decorators: [{
    type: Directive,
    args: [{
      host: {
        '[attr.aria-controls]': 'childMenu?.id',
        '[attr.data-cdk-menu-stack-id]': 'menuStack.id'
      }
    }]
  }]
});

function throwMissingPointerFocusTracker() {
  throw Error('expected an instance of PointerFocusTracker to be provided');
}
function throwMissingMenuReference() {
  throw Error('expected a reference to the parent menu');
}

const MENU_AIM = new InjectionToken('cdk-menu-aim');
const MOUSE_MOVE_SAMPLE_FREQUENCY = 3;
const NUM_POINTS = 5;
const CLOSE_DELAY = 300;
function getSlope(a, b) {
  return (b.y - a.y) / (b.x - a.x);
}
function getYIntercept(point, slope) {
  return point.y - slope * point.x;
}
function isWithinSubmenu(submenuPoints, m, b) {
  const {
    left,
    right,
    top,
    bottom
  } = submenuPoints;
  return m * left + b >= top && m * left + b <= bottom || m * right + b >= top && m * right + b <= bottom || (top - b) / m >= left && (top - b) / m <= right || (bottom - b) / m >= left && (bottom - b) / m <= right;
}
class TargetMenuAim {
  _ngZone = inject(NgZone);
  _renderer = inject(RendererFactory2).createRenderer(null, null);
  _cleanupMousemove;
  _points = [];
  _menu;
  _pointerTracker;
  _timeoutId = null;
  _destroyed = new Subject();
  ngOnDestroy() {
    this._cleanupMousemove?.();
    this._destroyed.next();
    this._destroyed.complete();
  }
  initialize(menu, pointerTracker) {
    this._menu = menu;
    this._pointerTracker = pointerTracker;
    this._subscribeToMouseMoves();
  }
  toggle(doToggle) {
    if (this._menu.orientation === 'horizontal') {
      doToggle();
    }
    this._checkConfigured();
    const siblingItemIsWaiting = !!this._timeoutId;
    const hasPoints = this._points.length > 1;
    if (hasPoints && !siblingItemIsWaiting) {
      if (this._isMovingToSubmenu()) {
        this._startTimeout(doToggle);
      } else {
        doToggle();
      }
    } else if (!siblingItemIsWaiting) {
      doToggle();
    }
  }
  _startTimeout(doToggle) {
    const timeoutId = setTimeout(() => {
      if (this._pointerTracker.activeElement && timeoutId === this._timeoutId) {
        doToggle();
      }
      this._timeoutId = null;
    }, CLOSE_DELAY);
    this._timeoutId = timeoutId;
  }
  _isMovingToSubmenu() {
    const submenuPoints = this._getSubmenuBounds();
    if (!submenuPoints) {
      return false;
    }
    let numMoving = 0;
    const currPoint = this._points[this._points.length - 1];
    for (let i = this._points.length - 2; i >= 0; i--) {
      const previous = this._points[i];
      const slope = getSlope(currPoint, previous);
      if (isWithinSubmenu(submenuPoints, slope, getYIntercept(currPoint, slope))) {
        numMoving++;
      }
    }
    return numMoving >= Math.floor(NUM_POINTS / 2);
  }
  _getSubmenuBounds() {
    return this._pointerTracker?.previousElement?.getMenu()?.nativeElement.getBoundingClientRect();
  }
  _checkConfigured() {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      if (!this._pointerTracker) {
        throwMissingPointerFocusTracker();
      }
      if (!this._menu) {
        throwMissingMenuReference();
      }
    }
  }
  _subscribeToMouseMoves() {
    this._cleanupMousemove?.();
    this._cleanupMousemove = this._ngZone.runOutsideAngular(() => {
      let eventIndex = 0;
      return this._renderer.listen(this._menu.nativeElement, 'mousemove', event => {
        if (eventIndex % MOUSE_MOVE_SAMPLE_FREQUENCY === 0) {
          this._points.push({
            x: event.clientX,
            y: event.clientY
          });
          if (this._points.length > NUM_POINTS) {
            this._points.shift();
          }
        }
        eventIndex++;
      });
    });
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: TargetMenuAim,
    deps: [],
    target: i0.ɵɵFactoryTarget.Injectable
  });
  static ɵprov = i0.ɵɵngDeclareInjectable({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: TargetMenuAim
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: TargetMenuAim,
  decorators: [{
    type: Injectable
  }]
});
class CdkTargetMenuAim {
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkTargetMenuAim,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "14.0.0",
    version: "21.0.3",
    type: CdkTargetMenuAim,
    isStandalone: true,
    selector: "[cdkTargetMenuAim]",
    providers: [{
      provide: MENU_AIM,
      useClass: TargetMenuAim
    }],
    exportAs: ["cdkTargetMenuAim"],
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkTargetMenuAim,
  decorators: [{
    type: Directive,
    args: [{
      selector: '[cdkTargetMenuAim]',
      exportAs: 'cdkTargetMenuAim',
      providers: [{
        provide: MENU_AIM,
        useClass: TargetMenuAim
      }]
    }]
  }]
});

function eventDispatchesNativeClick(elementRef, event) {
  if (!event.isTrusted) {
    return false;
  }
  const el = elementRef.nativeElement;
  const keyCode = event.keyCode;
  if (el.nodeName === 'BUTTON' && !el.disabled) {
    return keyCode === ENTER || keyCode === SPACE;
  }
  if (el.nodeName === 'A') {
    return keyCode === ENTER;
  }
  return false;
}

class CdkMenuTrigger extends CdkMenuTriggerBase {
  _elementRef = inject(ElementRef);
  _ngZone = inject(NgZone);
  _changeDetectorRef = inject(ChangeDetectorRef);
  _inputModalityDetector = inject(InputModalityDetector);
  _directionality = inject(Directionality, {
    optional: true
  });
  _renderer = inject(Renderer2);
  _injector = inject(Injector);
  _cleanupMouseenter;
  _menuTracker = inject(MenuTracker);
  _parentMenu = inject(CDK_MENU, {
    optional: true
  });
  _menuAim = inject(MENU_AIM, {
    optional: true
  });
  constructor() {
    super();
    this._setRole();
    this._registerCloseHandler();
    this._subscribeToMenuStackClosed();
    this._subscribeToMouseEnter();
    this._subscribeToMenuStackHasFocus();
    this._setType();
  }
  toggle() {
    this.isOpen() ? this.close() : this.open();
  }
  open() {
    if (!this._parentMenu) {
      this._menuTracker.update(this);
    }
    if (!this.isOpen() && this.menuTemplateRef != null) {
      this.opened.next();
      this.overlayRef = this.overlayRef || createOverlayRef(this._injector, this._getOverlayConfig());
      this.overlayRef.attach(this.getMenuContentPortal());
      this._changeDetectorRef.markForCheck();
      this._subscribeToOutsideClicks();
    }
  }
  close() {
    if (this.isOpen()) {
      this.closed.next();
      this.overlayRef.detach();
      this._changeDetectorRef.markForCheck();
    }
    this._closeSiblingTriggers();
  }
  getMenu() {
    return this.childMenu;
  }
  ngOnChanges(changes) {
    if (changes['menuPosition'] && this.overlayRef) {
      this.overlayRef.updatePositionStrategy(this._getOverlayPositionStrategy());
    }
  }
  ngOnDestroy() {
    this._cleanupMouseenter();
    super.ngOnDestroy();
  }
  _toggleOnKeydown(event) {
    const isParentVertical = this._parentMenu?.orientation === 'vertical';
    switch (event.keyCode) {
      case SPACE:
      case ENTER:
        if (!hasModifierKey(event) && !eventDispatchesNativeClick(this._elementRef, event)) {
          this.toggle();
          this.childMenu?.focusFirstItem('keyboard');
        }
        break;
      case RIGHT_ARROW:
        if (!hasModifierKey(event)) {
          if (this._parentMenu && isParentVertical && this._directionality?.value !== 'rtl') {
            event.preventDefault();
            this.open();
            this.childMenu?.focusFirstItem('keyboard');
          }
        }
        break;
      case LEFT_ARROW:
        if (!hasModifierKey(event)) {
          if (this._parentMenu && isParentVertical && this._directionality?.value === 'rtl') {
            event.preventDefault();
            this.open();
            this.childMenu?.focusFirstItem('keyboard');
          }
        }
        break;
      case DOWN_ARROW:
      case UP_ARROW:
        if (!hasModifierKey(event)) {
          if (!isParentVertical) {
            event.preventDefault();
            this.open();
            event.keyCode === DOWN_ARROW ? this.childMenu?.focusFirstItem('keyboard') : this.childMenu?.focusLastItem('keyboard');
          }
        }
        break;
    }
  }
  _handleClick() {
    this.toggle();
    this.childMenu?.focusFirstItem('mouse');
  }
  _setHasFocus(hasFocus) {
    if (!this._parentMenu) {
      this.menuStack.setHasFocus(hasFocus);
    }
  }
  _subscribeToMouseEnter() {
    this._cleanupMouseenter = this._ngZone.runOutsideAngular(() => {
      return this._renderer.listen(this._elementRef.nativeElement, 'mouseenter', () => {
        if (this._inputModalityDetector.mostRecentModality !== 'touch' && !this.menuStack.isEmpty() && !this.isOpen()) {
          const toggleMenus = () => this._ngZone.run(() => {
            this._closeSiblingTriggers();
            this.open();
          });
          if (this._menuAim) {
            this._menuAim.toggle(toggleMenus);
          } else {
            toggleMenus();
          }
        }
      });
    });
  }
  _closeSiblingTriggers() {
    if (this._parentMenu) {
      const isParentMenuBar = !this.menuStack.closeSubMenuOf(this._parentMenu) && this.menuStack.peek() !== this._parentMenu;
      if (isParentMenuBar) {
        this.menuStack.closeAll();
      }
    } else {
      this.menuStack.closeAll();
    }
  }
  _getOverlayConfig() {
    return new OverlayConfig({
      positionStrategy: this._getOverlayPositionStrategy(),
      scrollStrategy: this.menuScrollStrategy(),
      direction: this._directionality || undefined
    });
  }
  _getOverlayPositionStrategy() {
    const strategy = createFlexibleConnectedPositionStrategy(this._injector, this._elementRef).withLockedPosition().withFlexibleDimensions(false).withPositions(this._getOverlayPositions());
    if (this.transformOriginSelector) {
      strategy.withTransformOriginOn(this.transformOriginSelector);
    }
    return strategy;
  }
  _getOverlayPositions() {
    return this.menuPosition ?? (!this._parentMenu || this._parentMenu.orientation === 'horizontal' ? STANDARD_DROPDOWN_BELOW_POSITIONS : STANDARD_DROPDOWN_ADJACENT_POSITIONS);
  }
  _registerCloseHandler() {
    if (!this._parentMenu) {
      this.menuStack.closed.pipe(takeUntil(this.destroyed)).subscribe(({
        item
      }) => {
        if (item === this.childMenu) {
          this.close();
        }
      });
    }
  }
  _subscribeToOutsideClicks() {
    if (this.overlayRef) {
      this.overlayRef.outsidePointerEvents().pipe(takeUntil(this.stopOutsideClicksListener)).subscribe(event => {
        const target = _getEventTarget(event);
        const element = this._elementRef.nativeElement;
        if (target !== element && !element.contains(target)) {
          if (!this.isElementInsideMenuStack(target)) {
            this.menuStack.closeAll();
          } else {
            this._closeSiblingTriggers();
          }
        }
      });
    }
  }
  _subscribeToMenuStackHasFocus() {
    if (!this._parentMenu) {
      this.menuStack.hasFocus.pipe(takeUntil(this.destroyed)).subscribe(hasFocus => {
        if (!hasFocus) {
          this.menuStack.closeAll();
        }
      });
    }
  }
  _subscribeToMenuStackClosed() {
    if (!this._parentMenu) {
      this.menuStack.closed.subscribe(({
        focusParentTrigger
      }) => {
        if (focusParentTrigger && !this.menuStack.length()) {
          this._elementRef.nativeElement.focus();
        }
      });
    }
  }
  _setRole() {
    if (!this._parentMenu) {
      this._elementRef.nativeElement.setAttribute('role', 'button');
    }
  }
  _setType() {
    const element = this._elementRef.nativeElement;
    if (element.nodeName === 'BUTTON' && !element.getAttribute('type')) {
      element.setAttribute('type', 'button');
    }
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkMenuTrigger,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "14.0.0",
    version: "21.0.3",
    type: CdkMenuTrigger,
    isStandalone: true,
    selector: "[cdkMenuTriggerFor]",
    inputs: {
      menuTemplateRef: ["cdkMenuTriggerFor", "menuTemplateRef"],
      menuPosition: ["cdkMenuPosition", "menuPosition"],
      menuData: ["cdkMenuTriggerData", "menuData"],
      transformOriginSelector: ["cdkMenuTriggerTransformOriginOn", "transformOriginSelector"]
    },
    outputs: {
      opened: "cdkMenuOpened",
      closed: "cdkMenuClosed"
    },
    host: {
      listeners: {
        "focusin": "_setHasFocus(true)",
        "focusout": "_setHasFocus(false)",
        "keydown": "_toggleOnKeydown($event)",
        "click": "_handleClick()"
      },
      properties: {
        "attr.aria-haspopup": "menuTemplateRef ? \"menu\" : null",
        "attr.aria-expanded": "menuTemplateRef == null ? null : isOpen()"
      },
      classAttribute: "cdk-menu-trigger"
    },
    providers: [{
      provide: MENU_TRIGGER,
      useExisting: CdkMenuTrigger
    }, PARENT_OR_NEW_MENU_STACK_PROVIDER],
    exportAs: ["cdkMenuTriggerFor"],
    usesInheritance: true,
    usesOnChanges: true,
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkMenuTrigger,
  decorators: [{
    type: Directive,
    args: [{
      selector: '[cdkMenuTriggerFor]',
      exportAs: 'cdkMenuTriggerFor',
      host: {
        'class': 'cdk-menu-trigger',
        '[attr.aria-haspopup]': 'menuTemplateRef ? "menu" : null',
        '[attr.aria-expanded]': 'menuTemplateRef == null ? null : isOpen()',
        '(focusin)': '_setHasFocus(true)',
        '(focusout)': '_setHasFocus(false)',
        '(keydown)': '_toggleOnKeydown($event)',
        '(click)': '_handleClick()'
      },
      inputs: [{
        name: 'menuTemplateRef',
        alias: 'cdkMenuTriggerFor'
      }, {
        name: 'menuPosition',
        alias: 'cdkMenuPosition'
      }, {
        name: 'menuData',
        alias: 'cdkMenuTriggerData'
      }, {
        name: 'transformOriginSelector',
        alias: 'cdkMenuTriggerTransformOriginOn'
      }],
      outputs: ['opened: cdkMenuOpened', 'closed: cdkMenuClosed'],
      providers: [{
        provide: MENU_TRIGGER,
        useExisting: CdkMenuTrigger
      }, PARENT_OR_NEW_MENU_STACK_PROVIDER]
    }]
  }],
  ctorParameters: () => []
});

class CdkMenuItem {
  _dir = inject(Directionality, {
    optional: true
  });
  _elementRef = inject(ElementRef);
  _ngZone = inject(NgZone);
  _inputModalityDetector = inject(InputModalityDetector);
  _renderer = inject(Renderer2);
  _cleanupMouseEnter;
  _menuAim = inject(MENU_AIM, {
    optional: true
  });
  _menuStack = inject(MENU_STACK);
  _parentMenu = inject(CDK_MENU, {
    optional: true
  });
  _menuTrigger = inject(CdkMenuTrigger, {
    optional: true,
    self: true
  });
  disabled = false;
  typeaheadLabel = null;
  triggered = new EventEmitter();
  get hasMenu() {
    return this._menuTrigger?.menuTemplateRef != null;
  }
  _tabindex = -1;
  closeOnSpacebarTrigger = true;
  destroyed = new Subject();
  constructor() {
    this._setupMouseEnter();
    this._setType();
    if (this._isStandaloneItem()) {
      this._tabindex = 0;
    }
  }
  ngOnDestroy() {
    this._cleanupMouseEnter?.();
    this.destroyed.next();
    this.destroyed.complete();
  }
  focus() {
    this._elementRef.nativeElement.focus();
  }
  trigger(options) {
    const {
      keepOpen
    } = {
      ...options
    };
    if (!this.disabled && !this.hasMenu) {
      this.triggered.next();
      if (!keepOpen) {
        this._menuStack.closeAll({
          focusParentTrigger: true
        });
      }
    }
  }
  isMenuOpen() {
    return !!this._menuTrigger?.isOpen();
  }
  getMenu() {
    return this._menuTrigger?.getMenu();
  }
  getMenuTrigger() {
    return this._menuTrigger;
  }
  getLabel() {
    return this.typeaheadLabel || this._elementRef.nativeElement.textContent?.trim() || '';
  }
  _resetTabIndex() {
    if (!this._isStandaloneItem()) {
      this._tabindex = -1;
    }
  }
  _setTabIndex(event) {
    if (this.disabled) {
      return;
    }
    if (!event || !this._menuStack.isEmpty()) {
      this._tabindex = 0;
    }
  }
  _handleClick(event) {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      this.trigger();
    }
  }
  _onKeydown(event) {
    switch (event.keyCode) {
      case SPACE:
      case ENTER:
        if (!hasModifierKey(event) && !eventDispatchesNativeClick(this._elementRef, event)) {
          const nodeName = this._elementRef.nativeElement.nodeName;
          if (nodeName !== 'A' && nodeName !== 'BUTTON') {
            event.preventDefault();
          }
          this.trigger({
            keepOpen: event.keyCode === SPACE && !this.closeOnSpacebarTrigger
          });
        }
        break;
      case RIGHT_ARROW:
        if (!hasModifierKey(event)) {
          if (this._parentMenu && this._isParentVertical()) {
            if (this._dir?.value !== 'rtl') {
              this._forwardArrowPressed(event);
            } else {
              this._backArrowPressed(event);
            }
          }
        }
        break;
      case LEFT_ARROW:
        if (!hasModifierKey(event)) {
          if (this._parentMenu && this._isParentVertical()) {
            if (this._dir?.value !== 'rtl') {
              this._backArrowPressed(event);
            } else {
              this._forwardArrowPressed(event);
            }
          }
        }
        break;
    }
  }
  _isStandaloneItem() {
    return !this._parentMenu;
  }
  _backArrowPressed(event) {
    const parentMenu = this._parentMenu;
    if (this._menuStack.hasInlineMenu() || this._menuStack.length() > 1) {
      event.preventDefault();
      this._menuStack.close(parentMenu, {
        focusNextOnEmpty: this._menuStack.inlineMenuOrientation() === 'horizontal' ? FocusNext.previousItem : FocusNext.currentItem,
        focusParentTrigger: true
      });
    }
  }
  _forwardArrowPressed(event) {
    if (!this.hasMenu && this._menuStack.inlineMenuOrientation() === 'horizontal') {
      event.preventDefault();
      this._menuStack.closeAll({
        focusNextOnEmpty: FocusNext.nextItem,
        focusParentTrigger: true
      });
    }
  }
  _setupMouseEnter() {
    if (!this._isStandaloneItem()) {
      const closeOpenSiblings = () => this._ngZone.run(() => this._menuStack.closeSubMenuOf(this._parentMenu));
      this._cleanupMouseEnter = this._ngZone.runOutsideAngular(() => this._renderer.listen(this._elementRef.nativeElement, 'mouseenter', () => {
        if (this._inputModalityDetector.mostRecentModality !== 'touch' && !this._menuStack.isEmpty() && !this.hasMenu) {
          if (this._menuAim) {
            this._menuAim.toggle(closeOpenSiblings);
          } else {
            closeOpenSiblings();
          }
        }
      }));
    }
  }
  _isParentVertical() {
    return this._parentMenu?.orientation === 'vertical';
  }
  _setType() {
    const element = this._elementRef.nativeElement;
    if (element.nodeName === 'BUTTON' && !element.getAttribute('type')) {
      element.setAttribute('type', 'button');
    }
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkMenuItem,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "16.1.0",
    version: "21.0.3",
    type: CdkMenuItem,
    isStandalone: true,
    selector: "[cdkMenuItem]",
    inputs: {
      disabled: ["cdkMenuItemDisabled", "disabled", booleanAttribute],
      typeaheadLabel: ["cdkMenuitemTypeaheadLabel", "typeaheadLabel"]
    },
    outputs: {
      triggered: "cdkMenuItemTriggered"
    },
    host: {
      attributes: {
        "role": "menuitem"
      },
      listeners: {
        "blur": "_resetTabIndex()",
        "focus": "_setTabIndex()",
        "click": "_handleClick($event)",
        "keydown": "_onKeydown($event)"
      },
      properties: {
        "class.cdk-menu-item-disabled": "disabled",
        "tabindex": "_tabindex",
        "attr.aria-disabled": "disabled || null"
      },
      classAttribute: "cdk-menu-item"
    },
    exportAs: ["cdkMenuItem"],
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkMenuItem,
  decorators: [{
    type: Directive,
    args: [{
      selector: '[cdkMenuItem]',
      exportAs: 'cdkMenuItem',
      host: {
        'role': 'menuitem',
        'class': 'cdk-menu-item',
        '[class.cdk-menu-item-disabled]': 'disabled',
        '[tabindex]': '_tabindex',
        '[attr.aria-disabled]': 'disabled || null',
        '(blur)': '_resetTabIndex()',
        '(focus)': '_setTabIndex()',
        '(click)': '_handleClick($event)',
        '(keydown)': '_onKeydown($event)'
      }
    }]
  }],
  ctorParameters: () => [],
  propDecorators: {
    disabled: [{
      type: Input,
      args: [{
        alias: 'cdkMenuItemDisabled',
        transform: booleanAttribute
      }]
    }],
    typeaheadLabel: [{
      type: Input,
      args: ['cdkMenuitemTypeaheadLabel']
    }],
    triggered: [{
      type: Output,
      args: ['cdkMenuItemTriggered']
    }]
  }
});

class PointerFocusTracker {
  _renderer;
  _items;
  _eventCleanups;
  _itemsSubscription;
  entered = new Subject();
  exited = new Subject();
  activeElement;
  previousElement;
  constructor(_renderer, _items) {
    this._renderer = _renderer;
    this._items = _items;
    this._bindEvents();
    this.entered.subscribe(element => this.activeElement = element);
    this.exited.subscribe(() => {
      this.previousElement = this.activeElement;
      this.activeElement = undefined;
    });
  }
  destroy() {
    this._cleanupEvents();
    this._itemsSubscription?.unsubscribe();
  }
  _bindEvents() {
    this._itemsSubscription = this._items.changes.pipe(startWith(this._items)).subscribe(() => {
      this._cleanupEvents();
      this._eventCleanups = [];
      this._items.forEach(item => {
        const element = item._elementRef.nativeElement;
        this._eventCleanups.push(this._renderer.listen(element, 'mouseenter', () => {
          this.entered.next(item);
        }), this._renderer.listen(element, 'mouseout', () => {
          this.exited.next(item);
        }));
      });
    });
  }
  _cleanupEvents() {
    this._eventCleanups?.forEach(cleanup => cleanup());
    this._eventCleanups = undefined;
  }
}

class CdkMenuBase extends CdkMenuGroup {
  _focusMonitor = inject(FocusMonitor);
  ngZone = inject(NgZone);
  _renderer = inject(Renderer2);
  nativeElement = inject(ElementRef).nativeElement;
  menuStack = inject(MENU_STACK);
  menuAim = inject(MENU_AIM, {
    optional: true,
    self: true
  });
  dir = inject(Directionality, {
    optional: true
  });
  _allItems;
  id = inject(_IdGenerator).getId('cdk-menu-');
  items = new QueryList();
  orientation = 'vertical';
  isInline = false;
  keyManager;
  destroyed = new Subject();
  triggerItem;
  pointerTracker;
  _menuStackHasFocus = signal(false, ...(ngDevMode ? [{
    debugName: "_menuStackHasFocus"
  }] : []));
  _tabIndexSignal = computed(() => {
    const tabindexIfInline = this._menuStackHasFocus() ? -1 : 0;
    return this.isInline ? tabindexIfInline : null;
  }, ...(ngDevMode ? [{
    debugName: "_tabIndexSignal"
  }] : []));
  ngAfterContentInit() {
    if (!this.isInline) {
      this.menuStack.push(this);
    }
    this._setItems();
    this._setKeyManager();
    this._handleFocus();
    this._subscribeToMenuStackHasFocus();
    this._subscribeToMenuOpen();
    this._subscribeToMenuStackClosed();
    this._setUpPointerTracker();
  }
  ngOnDestroy() {
    this._focusMonitor.stopMonitoring(this.nativeElement);
    this.keyManager?.destroy();
    this.destroyed.next();
    this.destroyed.complete();
    this.pointerTracker?.destroy();
  }
  focusFirstItem(focusOrigin = 'program') {
    this.keyManager.setFocusOrigin(focusOrigin);
    this.keyManager.setFirstItemActive();
  }
  focusLastItem(focusOrigin = 'program') {
    this.keyManager.setFocusOrigin(focusOrigin);
    this.keyManager.setLastItemActive();
  }
  setActiveMenuItem(item) {
    this.keyManager?.setActiveItem(item);
  }
  _getTabIndex() {
    return this._tabIndexSignal();
  }
  closeOpenMenu(menu, options) {
    const {
      focusParentTrigger
    } = {
      ...options
    };
    const keyManager = this.keyManager;
    const trigger = this.triggerItem;
    if (menu === trigger?.getMenuTrigger()?.getMenu()) {
      trigger?.getMenuTrigger()?.close();
      if (focusParentTrigger) {
        if (trigger) {
          keyManager.setActiveItem(trigger);
        } else {
          keyManager.setFirstItemActive();
        }
      }
    }
  }
  _setItems() {
    this._allItems.changes.pipe(startWith(this._allItems), takeUntil(this.destroyed)).subscribe(items => {
      this.items.reset(items.filter(item => item._parentMenu === this));
      this.items.notifyOnChanges();
    });
  }
  _setKeyManager() {
    this.keyManager = new FocusKeyManager(this.items).withWrap().withTypeAhead().withHomeAndEnd().skipPredicate(() => false);
    if (this.orientation === 'horizontal') {
      this.keyManager.withHorizontalOrientation(this.dir?.value || 'ltr');
    } else {
      this.keyManager.withVerticalOrientation();
    }
  }
  _subscribeToMenuOpen() {
    const exitCondition = merge(this.items.changes, this.destroyed);
    this.items.changes.pipe(startWith(this.items), mergeMap(list => list.filter(item => item.hasMenu).map(item => item.getMenuTrigger().opened.pipe(mapTo(item), takeUntil(exitCondition)))), mergeAll(), switchMap(item => {
      this.triggerItem = item;
      return item.getMenuTrigger().closed;
    }), takeUntil(this.destroyed)).subscribe(() => this.triggerItem = undefined);
  }
  _subscribeToMenuStackClosed() {
    this.menuStack.closed.pipe(takeUntil(this.destroyed)).subscribe(({
      item,
      focusParentTrigger
    }) => this.closeOpenMenu(item, {
      focusParentTrigger
    }));
  }
  _subscribeToMenuStackHasFocus() {
    if (this.isInline) {
      this.menuStack.hasFocus.pipe(takeUntil(this.destroyed)).subscribe(hasFocus => {
        this._menuStackHasFocus.set(hasFocus);
      });
    }
  }
  _setUpPointerTracker() {
    if (this.menuAim) {
      this.ngZone.runOutsideAngular(() => {
        this.pointerTracker = new PointerFocusTracker(this._renderer, this.items);
      });
      this.menuAim.initialize(this, this.pointerTracker);
    }
  }
  _handleFocus() {
    this._focusMonitor.monitor(this.nativeElement, false).pipe(takeUntil(this.destroyed)).subscribe(origin => {
      if (origin !== null && origin !== 'mouse') {
        this.focusFirstItem(origin);
      }
    });
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkMenuBase,
    deps: null,
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "14.0.0",
    version: "21.0.3",
    type: CdkMenuBase,
    isStandalone: true,
    inputs: {
      id: "id"
    },
    host: {
      attributes: {
        "role": "menu"
      },
      listeners: {
        "focusin": "menuStack.setHasFocus(true)",
        "focusout": "menuStack.setHasFocus(false)"
      },
      properties: {
        "tabindex": "_getTabIndex()",
        "id": "id",
        "attr.aria-orientation": "orientation",
        "attr.data-cdk-menu-stack-id": "menuStack.id"
      }
    },
    queries: [{
      propertyName: "_allItems",
      predicate: CdkMenuItem,
      descendants: true
    }],
    usesInheritance: true,
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkMenuBase,
  decorators: [{
    type: Directive,
    args: [{
      host: {
        'role': 'menu',
        'class': '',
        '[tabindex]': '_getTabIndex()',
        '[id]': 'id',
        '[attr.aria-orientation]': 'orientation',
        '[attr.data-cdk-menu-stack-id]': 'menuStack.id',
        '(focusin)': 'menuStack.setHasFocus(true)',
        '(focusout)': 'menuStack.setHasFocus(false)'
      }
    }]
  }],
  propDecorators: {
    _allItems: [{
      type: ContentChildren,
      args: [CdkMenuItem, {
        descendants: true
      }]
    }],
    id: [{
      type: Input
    }]
  }
});

class CdkMenu extends CdkMenuBase {
  _parentTrigger = inject(MENU_TRIGGER, {
    optional: true
  });
  closed = new EventEmitter();
  orientation = 'vertical';
  isInline = !this._parentTrigger;
  constructor() {
    super();
    this.destroyed.subscribe(this.closed);
    this._parentTrigger?.registerChildMenu(this);
  }
  ngAfterContentInit() {
    super.ngAfterContentInit();
    this._subscribeToMenuStackEmptied();
  }
  ngOnDestroy() {
    super.ngOnDestroy();
    this.closed.complete();
  }
  _handleKeyEvent(event) {
    const keyManager = this.keyManager;
    switch (event.keyCode) {
      case LEFT_ARROW:
      case RIGHT_ARROW:
        if (!hasModifierKey(event)) {
          event.preventDefault();
          keyManager.setFocusOrigin('keyboard');
          keyManager.onKeydown(event);
        }
        break;
      case ESCAPE:
        if (!hasModifierKey(event)) {
          event.preventDefault();
          this.menuStack.close(this, {
            focusNextOnEmpty: FocusNext.currentItem,
            focusParentTrigger: true
          });
        }
        break;
      case TAB:
        if (!hasModifierKey(event, 'altKey', 'metaKey', 'ctrlKey')) {
          this.menuStack.closeAll({
            focusParentTrigger: true
          });
        }
        break;
      default:
        keyManager.onKeydown(event);
    }
  }
  _toggleMenuFocus(focusNext) {
    const keyManager = this.keyManager;
    switch (focusNext) {
      case FocusNext.nextItem:
        keyManager.setFocusOrigin('keyboard');
        keyManager.setNextItemActive();
        break;
      case FocusNext.previousItem:
        keyManager.setFocusOrigin('keyboard');
        keyManager.setPreviousItemActive();
        break;
      case FocusNext.currentItem:
        if (keyManager.activeItem) {
          keyManager.setFocusOrigin('keyboard');
          keyManager.setActiveItem(keyManager.activeItem);
        }
        break;
    }
  }
  _subscribeToMenuStackEmptied() {
    this.menuStack.emptied.pipe(takeUntil(this.destroyed)).subscribe(event => this._toggleMenuFocus(event));
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkMenu,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "14.0.0",
    version: "21.0.3",
    type: CdkMenu,
    isStandalone: true,
    selector: "[cdkMenu]",
    outputs: {
      closed: "closed"
    },
    host: {
      attributes: {
        "role": "menu"
      },
      listeners: {
        "keydown": "_handleKeyEvent($event)"
      },
      properties: {
        "class.cdk-menu-inline": "isInline"
      },
      classAttribute: "cdk-menu"
    },
    providers: [{
      provide: CdkMenuGroup,
      useExisting: CdkMenu
    }, {
      provide: CDK_MENU,
      useExisting: CdkMenu
    }, PARENT_OR_NEW_INLINE_MENU_STACK_PROVIDER('vertical')],
    exportAs: ["cdkMenu"],
    usesInheritance: true,
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkMenu,
  decorators: [{
    type: Directive,
    args: [{
      selector: '[cdkMenu]',
      exportAs: 'cdkMenu',
      host: {
        'role': 'menu',
        'class': 'cdk-menu',
        '[class.cdk-menu-inline]': 'isInline',
        '(keydown)': '_handleKeyEvent($event)'
      },
      providers: [{
        provide: CdkMenuGroup,
        useExisting: CdkMenu
      }, {
        provide: CDK_MENU,
        useExisting: CdkMenu
      }, PARENT_OR_NEW_INLINE_MENU_STACK_PROVIDER('vertical')]
    }]
  }],
  ctorParameters: () => [],
  propDecorators: {
    closed: [{
      type: Output
    }]
  }
});

class CdkMenuBar extends CdkMenuBase {
  orientation = 'horizontal';
  isInline = true;
  ngAfterContentInit() {
    super.ngAfterContentInit();
    this._subscribeToMenuStackEmptied();
  }
  _handleKeyEvent(event) {
    const keyManager = this.keyManager;
    switch (event.keyCode) {
      case UP_ARROW:
      case DOWN_ARROW:
      case LEFT_ARROW:
      case RIGHT_ARROW:
        if (!hasModifierKey(event)) {
          const horizontalArrows = event.keyCode === LEFT_ARROW || event.keyCode === RIGHT_ARROW;
          if (horizontalArrows) {
            event.preventDefault();
            const prevIsOpen = keyManager.activeItem?.isMenuOpen();
            keyManager.activeItem?.getMenuTrigger()?.close();
            keyManager.setFocusOrigin('keyboard');
            keyManager.onKeydown(event);
            if (prevIsOpen) {
              keyManager.activeItem?.getMenuTrigger()?.open();
            }
          }
        }
        break;
      case ESCAPE:
        if (!hasModifierKey(event)) {
          event.preventDefault();
          keyManager.activeItem?.getMenuTrigger()?.close();
        }
        break;
      case TAB:
        if (!hasModifierKey(event, 'altKey', 'metaKey', 'ctrlKey')) {
          keyManager.activeItem?.getMenuTrigger()?.close();
        }
        break;
      default:
        keyManager.onKeydown(event);
    }
  }
  _toggleOpenMenu(focusNext) {
    const keyManager = this.keyManager;
    switch (focusNext) {
      case FocusNext.nextItem:
        keyManager.setFocusOrigin('keyboard');
        keyManager.setNextItemActive();
        keyManager.activeItem?.getMenuTrigger()?.open();
        break;
      case FocusNext.previousItem:
        keyManager.setFocusOrigin('keyboard');
        keyManager.setPreviousItemActive();
        keyManager.activeItem?.getMenuTrigger()?.open();
        break;
      case FocusNext.currentItem:
        if (keyManager.activeItem) {
          keyManager.setFocusOrigin('keyboard');
          keyManager.setActiveItem(keyManager.activeItem);
        }
        break;
    }
  }
  _subscribeToMenuStackEmptied() {
    this.menuStack?.emptied.pipe(takeUntil(this.destroyed)).subscribe(event => this._toggleOpenMenu(event));
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkMenuBar,
    deps: null,
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "14.0.0",
    version: "21.0.3",
    type: CdkMenuBar,
    isStandalone: true,
    selector: "[cdkMenuBar]",
    host: {
      attributes: {
        "role": "menubar"
      },
      listeners: {
        "keydown": "_handleKeyEvent($event)"
      },
      classAttribute: "cdk-menu-bar"
    },
    providers: [{
      provide: CdkMenuGroup,
      useExisting: CdkMenuBar
    }, {
      provide: CDK_MENU,
      useExisting: CdkMenuBar
    }, {
      provide: MENU_STACK,
      useFactory: () => MenuStack.inline('horizontal')
    }],
    exportAs: ["cdkMenuBar"],
    usesInheritance: true,
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkMenuBar,
  decorators: [{
    type: Directive,
    args: [{
      selector: '[cdkMenuBar]',
      exportAs: 'cdkMenuBar',
      host: {
        'role': 'menubar',
        'class': 'cdk-menu-bar',
        '(keydown)': '_handleKeyEvent($event)'
      },
      providers: [{
        provide: CdkMenuGroup,
        useExisting: CdkMenuBar
      }, {
        provide: CDK_MENU,
        useExisting: CdkMenuBar
      }, {
        provide: MENU_STACK,
        useFactory: () => MenuStack.inline('horizontal')
      }]
    }]
  }]
});

class CdkMenuItemSelectable extends CdkMenuItem {
  checked = false;
  closeOnSpacebarTrigger = false;
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkMenuItemSelectable,
    deps: null,
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "16.1.0",
    version: "21.0.3",
    type: CdkMenuItemSelectable,
    isStandalone: true,
    inputs: {
      checked: ["cdkMenuItemChecked", "checked", booleanAttribute]
    },
    host: {
      properties: {
        "attr.aria-checked": "!!checked",
        "attr.aria-disabled": "disabled || null"
      }
    },
    usesInheritance: true,
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkMenuItemSelectable,
  decorators: [{
    type: Directive,
    args: [{
      host: {
        '[attr.aria-checked]': '!!checked',
        '[attr.aria-disabled]': 'disabled || null'
      }
    }]
  }],
  propDecorators: {
    checked: [{
      type: Input,
      args: [{
        alias: 'cdkMenuItemChecked',
        transform: booleanAttribute
      }]
    }]
  }
});

class CdkMenuItemRadio extends CdkMenuItemSelectable {
  _selectionDispatcher = inject(UniqueSelectionDispatcher);
  _id = inject(_IdGenerator).getId('cdk-menu-item-radio-');
  _removeDispatcherListener;
  constructor() {
    super();
    this._removeDispatcherListener = this._selectionDispatcher.listen(id => {
      this.checked = this._id === id;
    });
  }
  ngOnDestroy() {
    super.ngOnDestroy();
    this._removeDispatcherListener();
  }
  trigger(options) {
    super.trigger(options);
    if (!this.disabled) {
      this._selectionDispatcher.notify(this._id, '');
    }
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkMenuItemRadio,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "14.0.0",
    version: "21.0.3",
    type: CdkMenuItemRadio,
    isStandalone: true,
    selector: "[cdkMenuItemRadio]",
    host: {
      attributes: {
        "role": "menuitemradio"
      },
      properties: {
        "class.cdk-menu-item-radio": "true"
      }
    },
    providers: [{
      provide: CdkMenuItemSelectable,
      useExisting: CdkMenuItemRadio
    }, {
      provide: CdkMenuItem,
      useExisting: CdkMenuItemSelectable
    }],
    exportAs: ["cdkMenuItemRadio"],
    usesInheritance: true,
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkMenuItemRadio,
  decorators: [{
    type: Directive,
    args: [{
      selector: '[cdkMenuItemRadio]',
      exportAs: 'cdkMenuItemRadio',
      host: {
        'role': 'menuitemradio',
        '[class.cdk-menu-item-radio]': 'true'
      },
      providers: [{
        provide: CdkMenuItemSelectable,
        useExisting: CdkMenuItemRadio
      }, {
        provide: CdkMenuItem,
        useExisting: CdkMenuItemSelectable
      }]
    }]
  }],
  ctorParameters: () => []
});

class CdkMenuItemCheckbox extends CdkMenuItemSelectable {
  trigger(options) {
    super.trigger(options);
    if (!this.disabled) {
      this.checked = !this.checked;
    }
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkMenuItemCheckbox,
    deps: null,
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "14.0.0",
    version: "21.0.3",
    type: CdkMenuItemCheckbox,
    isStandalone: true,
    selector: "[cdkMenuItemCheckbox]",
    host: {
      attributes: {
        "role": "menuitemcheckbox"
      },
      properties: {
        "class.cdk-menu-item-checkbox": "true"
      }
    },
    providers: [{
      provide: CdkMenuItemSelectable,
      useExisting: CdkMenuItemCheckbox
    }, {
      provide: CdkMenuItem,
      useExisting: CdkMenuItemSelectable
    }],
    exportAs: ["cdkMenuItemCheckbox"],
    usesInheritance: true,
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkMenuItemCheckbox,
  decorators: [{
    type: Directive,
    args: [{
      selector: '[cdkMenuItemCheckbox]',
      exportAs: 'cdkMenuItemCheckbox',
      host: {
        'role': 'menuitemcheckbox',
        '[class.cdk-menu-item-checkbox]': 'true'
      },
      providers: [{
        provide: CdkMenuItemSelectable,
        useExisting: CdkMenuItemCheckbox
      }, {
        provide: CdkMenuItem,
        useExisting: CdkMenuItemSelectable
      }]
    }]
  }]
});

const CONTEXT_MENU_POSITIONS = STANDARD_DROPDOWN_BELOW_POSITIONS.map(position => {
  const offsetX = position.overlayX === 'start' ? 2 : -2;
  const offsetY = position.overlayY === 'top' ? 2 : -2;
  return {
    ...position,
    offsetX,
    offsetY
  };
});
class CdkContextMenuTrigger extends CdkMenuTriggerBase {
  _injector = inject(Injector);
  _directionality = inject(Directionality, {
    optional: true
  });
  _menuTracker = inject(MenuTracker);
  _changeDetectorRef = inject(ChangeDetectorRef);
  disabled = false;
  constructor() {
    super();
    this._setMenuStackCloseListener();
  }
  open(coordinates) {
    this._open(null, coordinates);
    this._changeDetectorRef.markForCheck();
  }
  close() {
    this.menuStack.closeAll();
  }
  _openOnContextMenu(event) {
    if (!this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      this._menuTracker.update(this);
      this._open(event, {
        x: event.clientX,
        y: event.clientY
      });
      if (event.button === 2) {
        this.childMenu?.focusFirstItem('mouse');
      } else if (event.button === 0) {
        this.childMenu?.focusFirstItem('keyboard');
      } else {
        this.childMenu?.focusFirstItem('program');
      }
    }
  }
  _getOverlayConfig(coordinates) {
    return new OverlayConfig({
      positionStrategy: this._getOverlayPositionStrategy(coordinates),
      scrollStrategy: this.menuScrollStrategy(),
      direction: this._directionality || undefined
    });
  }
  _getOverlayPositionStrategy(coordinates) {
    const strategy = createFlexibleConnectedPositionStrategy(this._injector, coordinates).withLockedPosition().withGrowAfterOpen().withPositions(this.menuPosition ?? CONTEXT_MENU_POSITIONS);
    if (this.transformOriginSelector) {
      strategy.withTransformOriginOn(this.transformOriginSelector);
    }
    return strategy;
  }
  _setMenuStackCloseListener() {
    this.menuStack.closed.pipe(takeUntil(this.destroyed)).subscribe(({
      item
    }) => {
      if (item === this.childMenu && this.isOpen()) {
        this.closed.next();
        this.overlayRef.detach();
        this.childMenu = undefined;
        this._changeDetectorRef.markForCheck();
      }
    });
  }
  _subscribeToOutsideClicks(userEvent) {
    if (this.overlayRef) {
      let outsideClicks = this.overlayRef.outsidePointerEvents();
      if (userEvent) {
        const [auxClicks, nonAuxClicks] = partition(outsideClicks, ({
          type
        }) => type === 'auxclick');
        outsideClicks = merge(nonAuxClicks.pipe(skipWhile((event, index) => userEvent.ctrlKey && index === 0 && event.ctrlKey)), auxClicks.pipe(skip(1)));
      }
      outsideClicks.pipe(takeUntil(this.stopOutsideClicksListener)).subscribe(event => {
        if (!this.isElementInsideMenuStack(_getEventTarget(event))) {
          this.menuStack.closeAll();
        }
      });
    }
  }
  _open(userEvent, coordinates) {
    if (this.disabled) {
      return;
    }
    if (this.isOpen()) {
      this.menuStack.closeSubMenuOf(this.childMenu);
      this.overlayRef.getConfig().positionStrategy.setOrigin(coordinates);
      this.overlayRef.updatePosition();
    } else {
      this.opened.next();
      if (this.overlayRef) {
        this.overlayRef.getConfig().positionStrategy.setOrigin(coordinates);
        this.overlayRef.updatePosition();
      } else {
        this.overlayRef = createOverlayRef(this._injector, this._getOverlayConfig(coordinates));
      }
      this.overlayRef.attach(this.getMenuContentPortal());
      this._subscribeToOutsideClicks(userEvent);
    }
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkContextMenuTrigger,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "16.1.0",
    version: "21.0.3",
    type: CdkContextMenuTrigger,
    isStandalone: true,
    selector: "[cdkContextMenuTriggerFor]",
    inputs: {
      menuTemplateRef: ["cdkContextMenuTriggerFor", "menuTemplateRef"],
      menuPosition: ["cdkContextMenuPosition", "menuPosition"],
      menuData: ["cdkContextMenuTriggerData", "menuData"],
      transformOriginSelector: ["cdkContextMenuTriggerTransformOriginOn", "transformOriginSelector"],
      disabled: ["cdkContextMenuDisabled", "disabled", booleanAttribute]
    },
    outputs: {
      opened: "cdkContextMenuOpened",
      closed: "cdkContextMenuClosed"
    },
    host: {
      listeners: {
        "contextmenu": "_openOnContextMenu($event)"
      },
      properties: {
        "attr.data-cdk-menu-stack-id": "null"
      }
    },
    providers: [{
      provide: MENU_TRIGGER,
      useExisting: CdkContextMenuTrigger
    }, {
      provide: MENU_STACK,
      useClass: MenuStack
    }],
    exportAs: ["cdkContextMenuTriggerFor"],
    usesInheritance: true,
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkContextMenuTrigger,
  decorators: [{
    type: Directive,
    args: [{
      selector: '[cdkContextMenuTriggerFor]',
      exportAs: 'cdkContextMenuTriggerFor',
      host: {
        '[attr.data-cdk-menu-stack-id]': 'null',
        '(contextmenu)': '_openOnContextMenu($event)'
      },
      inputs: [{
        name: 'menuTemplateRef',
        alias: 'cdkContextMenuTriggerFor'
      }, {
        name: 'menuPosition',
        alias: 'cdkContextMenuPosition'
      }, {
        name: 'menuData',
        alias: 'cdkContextMenuTriggerData'
      }, {
        name: 'transformOriginSelector',
        alias: 'cdkContextMenuTriggerTransformOriginOn'
      }],
      outputs: ['opened: cdkContextMenuOpened', 'closed: cdkContextMenuClosed'],
      providers: [{
        provide: MENU_TRIGGER,
        useExisting: CdkContextMenuTrigger
      }, {
        provide: MENU_STACK,
        useClass: MenuStack
      }]
    }]
  }],
  ctorParameters: () => [],
  propDecorators: {
    disabled: [{
      type: Input,
      args: [{
        alias: 'cdkContextMenuDisabled',
        transform: booleanAttribute
      }]
    }]
  }
});

const MENU_DIRECTIVES = [CdkMenuBar, CdkMenu, CdkMenuItem, CdkMenuItemRadio, CdkMenuItemCheckbox, CdkMenuTrigger, CdkMenuGroup, CdkContextMenuTrigger, CdkTargetMenuAim];
class CdkMenuModule {
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkMenuModule,
    deps: [],
    target: i0.ɵɵFactoryTarget.NgModule
  });
  static ɵmod = i0.ɵɵngDeclareNgModule({
    minVersion: "14.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkMenuModule,
    imports: [OverlayModule, CdkMenuBar, CdkMenu, CdkMenuItem, CdkMenuItemRadio, CdkMenuItemCheckbox, CdkMenuTrigger, CdkMenuGroup, CdkContextMenuTrigger, CdkTargetMenuAim],
    exports: [CdkMenuBar, CdkMenu, CdkMenuItem, CdkMenuItemRadio, CdkMenuItemCheckbox, CdkMenuTrigger, CdkMenuGroup, CdkContextMenuTrigger, CdkTargetMenuAim]
  });
  static ɵinj = i0.ɵɵngDeclareInjector({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkMenuModule,
    imports: [OverlayModule]
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkMenuModule,
  decorators: [{
    type: NgModule,
    args: [{
      imports: [OverlayModule, ...MENU_DIRECTIVES],
      exports: MENU_DIRECTIVES
    }]
  }]
});

export { CDK_MENU, CdkContextMenuTrigger, CdkMenu, CdkMenuBar, CdkMenuBase, CdkMenuGroup, CdkMenuItem, CdkMenuItemCheckbox, CdkMenuItemRadio, CdkMenuItemSelectable, CdkMenuModule, CdkMenuTrigger, CdkMenuTriggerBase, CdkTargetMenuAim, MenuTracker as ContextMenuTracker, FocusNext, MENU_AIM, MENU_SCROLL_STRATEGY, MENU_STACK, MENU_TRIGGER, MenuStack, MenuTracker, PARENT_OR_NEW_INLINE_MENU_STACK_PROVIDER, PARENT_OR_NEW_MENU_STACK_PROVIDER, PointerFocusTracker, TargetMenuAim };
//# sourceMappingURL=menu.mjs.map
