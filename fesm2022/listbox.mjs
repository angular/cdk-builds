import * as i0 from '@angular/core';
import { inject, signal, ElementRef, booleanAttribute, numberAttribute, Directive, Input, NgZone, ChangeDetectorRef, Renderer2, forwardRef, Output, ContentChildren, NgModule } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject, defer, merge } from 'rxjs';
import { startWith, switchMap, map, takeUntil, filter } from 'rxjs/operators';
import { A, SPACE, ENTER, HOME, END, UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW } from './_keycodes-chunk.mjs';
import { ActiveDescendantKeyManager } from './_activedescendant-key-manager-chunk.mjs';
import { SelectionModel } from './_selection-model-chunk.mjs';
import { _IdGenerator } from './_id-generator-chunk.mjs';
import { Directionality } from './_directionality-chunk.mjs';
import { Platform } from './_platform-chunk.mjs';
import { hasModifierKey } from './keycodes.mjs';
import { coerceArray } from './_array-chunk.mjs';
import './_list-key-manager-chunk.mjs';
import './_typeahead-chunk.mjs';
import '@angular/common';

class ListboxSelectionModel extends SelectionModel {
  multiple;
  constructor(multiple = false, initiallySelectedValues, emitChanges = true, compareWith) {
    super(true, initiallySelectedValues, emitChanges, compareWith);
    this.multiple = multiple;
  }
  isMultipleSelection() {
    return this.multiple;
  }
  select(...values) {
    if (this.multiple) {
      return super.select(...values);
    } else {
      return super.setSelection(...values);
    }
  }
}
class CdkOption {
  get id() {
    return this._id || this._generatedId;
  }
  set id(value) {
    this._id = value;
  }
  _id;
  _generatedId = inject(_IdGenerator).getId('cdk-option-');
  value;
  typeaheadLabel = null;
  get disabled() {
    return this.listbox.disabled || this._disabled();
  }
  set disabled(value) {
    this._disabled.set(value);
  }
  _disabled = signal(false, ...(ngDevMode ? [{
    debugName: "_disabled"
  }] : []));
  get enabledTabIndex() {
    return this._enabledTabIndex() === undefined ? this.listbox.enabledTabIndex : this._enabledTabIndex();
  }
  set enabledTabIndex(value) {
    this._enabledTabIndex.set(value);
  }
  _enabledTabIndex = signal(undefined, ...(ngDevMode ? [{
    debugName: "_enabledTabIndex"
  }] : []));
  element = inject(ElementRef).nativeElement;
  listbox = inject(CdkListbox);
  destroyed = new Subject();
  _clicked = new Subject();
  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }
  isSelected() {
    return this.listbox.isSelected(this);
  }
  isActive() {
    return this.listbox.isActive(this);
  }
  toggle() {
    this.listbox.toggle(this);
  }
  select() {
    this.listbox.select(this);
  }
  deselect() {
    this.listbox.deselect(this);
  }
  focus() {
    this.element.focus();
  }
  getLabel() {
    return (this.typeaheadLabel ?? this.element.textContent?.trim()) || '';
  }
  setActiveStyles() {
    if (this.listbox.useActiveDescendant) {
      this.element.scrollIntoView({
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }
  setInactiveStyles() {}
  _handleFocus() {
    if (this.listbox.useActiveDescendant) {
      this.listbox._setActiveOption(this);
      this.listbox.focus();
    }
  }
  _getTabIndex() {
    if (this.listbox.useActiveDescendant || this.disabled) {
      return -1;
    }
    return this.isActive() ? this.enabledTabIndex : -1;
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkOption,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "16.1.0",
    version: "21.0.3",
    type: CdkOption,
    isStandalone: true,
    selector: "[cdkOption]",
    inputs: {
      id: "id",
      value: ["cdkOption", "value"],
      typeaheadLabel: ["cdkOptionTypeaheadLabel", "typeaheadLabel"],
      disabled: ["cdkOptionDisabled", "disabled", booleanAttribute],
      enabledTabIndex: ["tabindex", "enabledTabIndex", value => value == null ? undefined : numberAttribute(value)]
    },
    host: {
      attributes: {
        "role": "option"
      },
      listeners: {
        "click": "_clicked.next($event)",
        "focus": "_handleFocus()"
      },
      properties: {
        "id": "id",
        "attr.aria-selected": "isSelected()",
        "attr.tabindex": "_getTabIndex()",
        "attr.aria-disabled": "disabled",
        "class.cdk-option-active": "isActive()"
      },
      classAttribute: "cdk-option"
    },
    exportAs: ["cdkOption"],
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkOption,
  decorators: [{
    type: Directive,
    args: [{
      selector: '[cdkOption]',
      exportAs: 'cdkOption',
      host: {
        'role': 'option',
        'class': 'cdk-option',
        '[id]': 'id',
        '[attr.aria-selected]': 'isSelected()',
        '[attr.tabindex]': '_getTabIndex()',
        '[attr.aria-disabled]': 'disabled',
        '[class.cdk-option-active]': 'isActive()',
        '(click)': '_clicked.next($event)',
        '(focus)': '_handleFocus()'
      }
    }]
  }],
  propDecorators: {
    id: [{
      type: Input
    }],
    value: [{
      type: Input,
      args: ['cdkOption']
    }],
    typeaheadLabel: [{
      type: Input,
      args: ['cdkOptionTypeaheadLabel']
    }],
    disabled: [{
      type: Input,
      args: [{
        alias: 'cdkOptionDisabled',
        transform: booleanAttribute
      }]
    }],
    enabledTabIndex: [{
      type: Input,
      args: [{
        alias: 'tabindex',
        transform: value => value == null ? undefined : numberAttribute(value)
      }]
    }]
  }
});
class CdkListbox {
  _cleanupWindowBlur;
  get id() {
    return this._id || this._generatedId;
  }
  set id(value) {
    this._id = value;
  }
  _id;
  _generatedId = inject(_IdGenerator).getId('cdk-listbox-');
  get enabledTabIndex() {
    return this._enabledTabIndex() === undefined ? 0 : this._enabledTabIndex();
  }
  set enabledTabIndex(value) {
    this._enabledTabIndex.set(value);
  }
  _enabledTabIndex = signal(undefined, ...(ngDevMode ? [{
    debugName: "_enabledTabIndex"
  }] : []));
  get value() {
    return this._invalid ? [] : this.selectionModel.selected;
  }
  set value(value) {
    this._setSelection(value);
  }
  get multiple() {
    return this.selectionModel.multiple;
  }
  set multiple(value) {
    this.selectionModel.multiple = value;
    if (this.options) {
      this._updateInternalValue();
    }
  }
  get disabled() {
    return this._disabled();
  }
  set disabled(value) {
    this._disabled.set(value);
  }
  _disabled = signal(false, ...(ngDevMode ? [{
    debugName: "_disabled"
  }] : []));
  get useActiveDescendant() {
    return this._useActiveDescendant();
  }
  set useActiveDescendant(value) {
    this._useActiveDescendant.set(value);
  }
  _useActiveDescendant = signal(false, ...(ngDevMode ? [{
    debugName: "_useActiveDescendant"
  }] : []));
  get orientation() {
    return this._orientation;
  }
  set orientation(value) {
    this._orientation = value === 'horizontal' ? 'horizontal' : 'vertical';
    if (value === 'horizontal') {
      this.listKeyManager?.withHorizontalOrientation(this._dir?.value || 'ltr');
    } else {
      this.listKeyManager?.withVerticalOrientation();
    }
  }
  _orientation = 'vertical';
  get compareWith() {
    return this.selectionModel.compareWith;
  }
  set compareWith(fn) {
    this.selectionModel.compareWith = fn;
  }
  get navigationWrapDisabled() {
    return this._navigationWrapDisabled;
  }
  set navigationWrapDisabled(wrap) {
    this._navigationWrapDisabled = wrap;
    this.listKeyManager?.withWrap(!this._navigationWrapDisabled);
  }
  _navigationWrapDisabled = false;
  get navigateDisabledOptions() {
    return this._navigateDisabledOptions;
  }
  set navigateDisabledOptions(skip) {
    this._navigateDisabledOptions = skip;
    this.listKeyManager?.skipPredicate(this._navigateDisabledOptions ? this._skipNonePredicate : this._skipDisabledPredicate);
  }
  _navigateDisabledOptions = false;
  valueChange = new Subject();
  options;
  selectionModel = new ListboxSelectionModel();
  listKeyManager;
  destroyed = new Subject();
  element = inject(ElementRef).nativeElement;
  ngZone = inject(NgZone);
  changeDetectorRef = inject(ChangeDetectorRef);
  _invalid = false;
  _lastTriggered = null;
  _onTouched = () => {};
  _onChange = () => {};
  _optionClicked = defer(() => this.options.changes.pipe(startWith(this.options), switchMap(options => merge(...options.map(option => option._clicked.pipe(map(event => ({
    option,
    event
  }))))))));
  _dir = inject(Directionality, {
    optional: true
  });
  _isBrowser = inject(Platform).isBrowser;
  _skipDisabledPredicate = option => option.disabled;
  _skipNonePredicate = () => false;
  _hasFocus = false;
  _previousActiveOption = null;
  constructor() {
    if (this._isBrowser) {
      const renderer = inject(Renderer2);
      this._cleanupWindowBlur = this.ngZone.runOutsideAngular(() => {
        return renderer.listen('window', 'blur', () => {
          if (this.element.contains(document.activeElement) && this._previousActiveOption) {
            this._setActiveOption(this._previousActiveOption);
            this._previousActiveOption = null;
          }
        });
      });
    }
  }
  ngAfterContentInit() {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      this._verifyNoOptionValueCollisions();
      this._verifyOptionValues();
    }
    this._initKeyManager();
    merge(this.selectionModel.changed, this.options.changes).pipe(startWith(null), takeUntil(this.destroyed)).subscribe(() => this._updateInternalValue());
    this._optionClicked.pipe(filter(({
      option
    }) => !option.disabled), takeUntil(this.destroyed)).subscribe(({
      option,
      event
    }) => this._handleOptionClicked(option, event));
  }
  ngOnDestroy() {
    this._cleanupWindowBlur?.();
    this.listKeyManager?.destroy();
    this.destroyed.next();
    this.destroyed.complete();
  }
  toggle(option) {
    this.toggleValue(option.value);
  }
  toggleValue(value) {
    if (this._invalid) {
      this.selectionModel.clear(false);
    }
    this.selectionModel.toggle(value);
  }
  select(option) {
    this.selectValue(option.value);
  }
  selectValue(value) {
    if (this._invalid) {
      this.selectionModel.clear(false);
    }
    this.selectionModel.select(value);
  }
  deselect(option) {
    this.deselectValue(option.value);
  }
  deselectValue(value) {
    if (this._invalid) {
      this.selectionModel.clear(false);
    }
    this.selectionModel.deselect(value);
  }
  setAllSelected(isSelected) {
    if (!isSelected) {
      this.selectionModel.clear();
    } else {
      if (this._invalid) {
        this.selectionModel.clear(false);
      }
      this.selectionModel.select(...this.options.map(option => option.value));
    }
  }
  isSelected(option) {
    return this.isValueSelected(option.value);
  }
  isActive(option) {
    return !!(this.listKeyManager?.activeItem === option);
  }
  isValueSelected(value) {
    if (this._invalid) {
      return false;
    }
    return this.selectionModel.isSelected(value);
  }
  registerOnChange(fn) {
    this._onChange = fn;
  }
  registerOnTouched(fn) {
    this._onTouched = fn;
  }
  writeValue(value) {
    this._setSelection(value);
    this._verifyOptionValues();
  }
  setDisabledState(isDisabled) {
    this.disabled = isDisabled;
    this.changeDetectorRef.markForCheck();
  }
  focus() {
    this.element.focus();
  }
  triggerOption(option) {
    if (option && !option.disabled) {
      this._lastTriggered = option;
      const changed = this.multiple ? this.selectionModel.toggle(option.value) : this.selectionModel.select(option.value);
      if (changed) {
        this._onChange(this.value);
        this.valueChange.next({
          value: this.value,
          listbox: this,
          option: option
        });
      }
    }
  }
  triggerRange(trigger, from, to, on) {
    if (this.disabled || trigger && trigger.disabled) {
      return;
    }
    this._lastTriggered = trigger;
    const isEqual = this.compareWith ?? Object.is;
    const updateValues = [...this.options].slice(Math.max(0, Math.min(from, to)), Math.min(this.options.length, Math.max(from, to) + 1)).filter(option => !option.disabled).map(option => option.value);
    const selected = [...this.value];
    for (const updateValue of updateValues) {
      const selectedIndex = selected.findIndex(selectedValue => isEqual(selectedValue, updateValue));
      if (on && selectedIndex === -1) {
        selected.push(updateValue);
      } else if (!on && selectedIndex !== -1) {
        selected.splice(selectedIndex, 1);
      }
    }
    let changed = this.selectionModel.setSelection(...selected);
    if (changed) {
      this._onChange(this.value);
      this.valueChange.next({
        value: this.value,
        listbox: this,
        option: trigger
      });
    }
  }
  _setActiveOption(option) {
    this.listKeyManager.setActiveItem(option);
  }
  _handleFocus() {
    if (!this.useActiveDescendant) {
      if (this.selectionModel.selected.length > 0) {
        this._setNextFocusToSelectedOption();
      } else {
        this.listKeyManager.setNextItemActive();
      }
      this._focusActiveOption();
    }
  }
  _handleKeydown(event) {
    if (this.disabled) {
      return;
    }
    const {
      keyCode
    } = event;
    const previousActiveIndex = this.listKeyManager.activeItemIndex;
    const ctrlKeys = ['ctrlKey', 'metaKey'];
    if (this.multiple && keyCode === A && hasModifierKey(event, ...ctrlKeys)) {
      this.triggerRange(null, 0, this.options.length - 1, this.options.length !== this.value.length);
      event.preventDefault();
      return;
    }
    if (this.multiple && (keyCode === SPACE || keyCode === ENTER) && hasModifierKey(event, 'shiftKey')) {
      if (this.listKeyManager.activeItem && this.listKeyManager.activeItemIndex != null) {
        this.triggerRange(this.listKeyManager.activeItem, this._getLastTriggeredIndex() ?? this.listKeyManager.activeItemIndex, this.listKeyManager.activeItemIndex, !this.listKeyManager.activeItem.isSelected());
      }
      event.preventDefault();
      return;
    }
    if (this.multiple && keyCode === HOME && hasModifierKey(event, ...ctrlKeys) && hasModifierKey(event, 'shiftKey')) {
      const trigger = this.listKeyManager.activeItem;
      if (trigger) {
        const from = this.listKeyManager.activeItemIndex;
        this.listKeyManager.setFirstItemActive();
        this.triggerRange(trigger, from, this.listKeyManager.activeItemIndex, !trigger.isSelected());
      }
      event.preventDefault();
      return;
    }
    if (this.multiple && keyCode === END && hasModifierKey(event, ...ctrlKeys) && hasModifierKey(event, 'shiftKey')) {
      const trigger = this.listKeyManager.activeItem;
      if (trigger) {
        const from = this.listKeyManager.activeItemIndex;
        this.listKeyManager.setLastItemActive();
        this.triggerRange(trigger, from, this.listKeyManager.activeItemIndex, !trigger.isSelected());
      }
      event.preventDefault();
      return;
    }
    if (keyCode === SPACE || keyCode === ENTER) {
      this.triggerOption(this.listKeyManager.activeItem);
      event.preventDefault();
      return;
    }
    const isNavKey = keyCode === UP_ARROW || keyCode === DOWN_ARROW || keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW || keyCode === HOME || keyCode === END;
    this.listKeyManager.onKeydown(event);
    if (isNavKey && event.shiftKey && previousActiveIndex !== this.listKeyManager.activeItemIndex) {
      this.triggerOption(this.listKeyManager.activeItem);
    }
  }
  _handleFocusIn() {
    this._hasFocus = true;
  }
  _handleFocusOut(event) {
    this._previousActiveOption = this.listKeyManager.activeItem;
    const otherElement = event.relatedTarget;
    if (this.element !== otherElement && !this.element.contains(otherElement)) {
      this._onTouched();
      this._hasFocus = false;
      this._setNextFocusToSelectedOption();
    }
  }
  _getAriaActiveDescendant() {
    return this.useActiveDescendant ? this.listKeyManager?.activeItem?.id : null;
  }
  _getTabIndex() {
    if (this.disabled) {
      return -1;
    }
    return this.useActiveDescendant || !this.listKeyManager.activeItem ? this.enabledTabIndex : -1;
  }
  _initKeyManager() {
    this.listKeyManager = new ActiveDescendantKeyManager(this.options).withWrap(!this._navigationWrapDisabled).withTypeAhead().withHomeAndEnd().withAllowedModifierKeys(['shiftKey']).skipPredicate(this._navigateDisabledOptions ? this._skipNonePredicate : this._skipDisabledPredicate);
    if (this.orientation === 'vertical') {
      this.listKeyManager.withVerticalOrientation();
    } else {
      this.listKeyManager.withHorizontalOrientation(this._dir?.value || 'ltr');
    }
    if (this.selectionModel.selected.length) {
      Promise.resolve().then(() => this._setNextFocusToSelectedOption());
    }
    this.listKeyManager.change.subscribe(() => this._focusActiveOption());
    this.options.changes.pipe(takeUntil(this.destroyed)).subscribe(() => {
      const activeOption = this.listKeyManager.activeItem;
      if (activeOption && !this.options.find(option => option === activeOption)) {
        this.listKeyManager.setActiveItem(-1);
        this.changeDetectorRef.markForCheck();
      }
    });
  }
  _focusActiveOption() {
    if (!this.useActiveDescendant) {
      this.listKeyManager.activeItem?.focus();
    }
    this.changeDetectorRef.markForCheck();
  }
  _setSelection(value) {
    if (this._invalid) {
      this.selectionModel.clear(false);
    }
    this.selectionModel.setSelection(...this._coerceValue(value));
    if (!this._hasFocus) {
      this._setNextFocusToSelectedOption();
    }
  }
  _setNextFocusToSelectedOption() {
    const selected = this.options?.find(option => option.isSelected());
    if (selected) {
      this.listKeyManager.updateActiveItem(selected);
    }
  }
  _updateInternalValue() {
    const indexCache = new Map();
    this.selectionModel.sort((a, b) => {
      const aIndex = this._getIndexForValue(indexCache, a);
      const bIndex = this._getIndexForValue(indexCache, b);
      return aIndex - bIndex;
    });
    const selected = this.selectionModel.selected;
    this._invalid = !this.multiple && selected.length > 1 || !!this._getInvalidOptionValues(selected).length;
    this.changeDetectorRef.markForCheck();
  }
  _getIndexForValue(cache, value) {
    const isEqual = this.compareWith || Object.is;
    if (!cache.has(value)) {
      let index = -1;
      for (let i = 0; i < this.options.length; i++) {
        if (isEqual(value, this.options.get(i).value)) {
          index = i;
          break;
        }
      }
      cache.set(value, index);
    }
    return cache.get(value);
  }
  _handleOptionClicked(option, event) {
    event.preventDefault();
    this.listKeyManager.setActiveItem(option);
    if (event.shiftKey && this.multiple) {
      this.triggerRange(option, this._getLastTriggeredIndex() ?? this.listKeyManager.activeItemIndex, this.listKeyManager.activeItemIndex, !option.isSelected());
    } else {
      this.triggerOption(option);
    }
  }
  _verifyNoOptionValueCollisions() {
    this.options.changes.pipe(startWith(this.options), takeUntil(this.destroyed)).subscribe(() => {
      const isEqual = this.compareWith ?? Object.is;
      for (let i = 0; i < this.options.length; i++) {
        const option = this.options.get(i);
        let duplicate = null;
        for (let j = i + 1; j < this.options.length; j++) {
          const other = this.options.get(j);
          if (isEqual(option.value, other.value)) {
            duplicate = other;
            break;
          }
        }
        if (duplicate) {
          if (this.compareWith) {
            console.warn(`Found multiple CdkOption representing the same value under the given compareWith function`, {
              option1: option.element,
              option2: duplicate.element,
              compareWith: this.compareWith
            });
          } else {
            console.warn(`Found multiple CdkOption with the same value`, {
              option1: option.element,
              option2: duplicate.element
            });
          }
          return;
        }
      }
    });
  }
  _verifyOptionValues() {
    if (this.options && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      const selected = this.selectionModel.selected;
      const invalidValues = this._getInvalidOptionValues(selected);
      if (!this.multiple && selected.length > 1) {
        throw Error('Listbox cannot have more than one selected value in multi-selection mode.');
      }
      if (invalidValues.length) {
        throw Error('Listbox has selected values that do not match any of its options.');
      }
    }
  }
  _coerceValue(value) {
    return value == null ? [] : coerceArray(value);
  }
  _getInvalidOptionValues(values) {
    const isEqual = this.compareWith || Object.is;
    const validValues = (this.options || []).map(option => option.value);
    return values.filter(value => !validValues.some(validValue => isEqual(value, validValue)));
  }
  _getLastTriggeredIndex() {
    const index = this.options.toArray().indexOf(this._lastTriggered);
    return index === -1 ? null : index;
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkListbox,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "16.1.0",
    version: "21.0.3",
    type: CdkListbox,
    isStandalone: true,
    selector: "[cdkListbox]",
    inputs: {
      id: "id",
      enabledTabIndex: ["tabindex", "enabledTabIndex"],
      value: ["cdkListboxValue", "value"],
      multiple: ["cdkListboxMultiple", "multiple", booleanAttribute],
      disabled: ["cdkListboxDisabled", "disabled", booleanAttribute],
      useActiveDescendant: ["cdkListboxUseActiveDescendant", "useActiveDescendant", booleanAttribute],
      orientation: ["cdkListboxOrientation", "orientation"],
      compareWith: ["cdkListboxCompareWith", "compareWith"],
      navigationWrapDisabled: ["cdkListboxNavigationWrapDisabled", "navigationWrapDisabled", booleanAttribute],
      navigateDisabledOptions: ["cdkListboxNavigatesDisabledOptions", "navigateDisabledOptions", booleanAttribute]
    },
    outputs: {
      valueChange: "cdkListboxValueChange"
    },
    host: {
      attributes: {
        "role": "listbox"
      },
      listeners: {
        "focus": "_handleFocus()",
        "keydown": "_handleKeydown($event)",
        "focusout": "_handleFocusOut($event)",
        "focusin": "_handleFocusIn()"
      },
      properties: {
        "id": "id",
        "attr.tabindex": "_getTabIndex()",
        "attr.aria-disabled": "disabled",
        "attr.aria-multiselectable": "multiple",
        "attr.aria-activedescendant": "_getAriaActiveDescendant()",
        "attr.aria-orientation": "orientation"
      },
      classAttribute: "cdk-listbox"
    },
    providers: [{
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CdkListbox),
      multi: true
    }],
    queries: [{
      propertyName: "options",
      predicate: CdkOption,
      descendants: true
    }],
    exportAs: ["cdkListbox"],
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkListbox,
  decorators: [{
    type: Directive,
    args: [{
      selector: '[cdkListbox]',
      exportAs: 'cdkListbox',
      host: {
        'role': 'listbox',
        'class': 'cdk-listbox',
        '[id]': 'id',
        '[attr.tabindex]': '_getTabIndex()',
        '[attr.aria-disabled]': 'disabled',
        '[attr.aria-multiselectable]': 'multiple',
        '[attr.aria-activedescendant]': '_getAriaActiveDescendant()',
        '[attr.aria-orientation]': 'orientation',
        '(focus)': '_handleFocus()',
        '(keydown)': '_handleKeydown($event)',
        '(focusout)': '_handleFocusOut($event)',
        '(focusin)': '_handleFocusIn()'
      },
      providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => CdkListbox),
        multi: true
      }]
    }]
  }],
  ctorParameters: () => [],
  propDecorators: {
    id: [{
      type: Input
    }],
    enabledTabIndex: [{
      type: Input,
      args: ['tabindex']
    }],
    value: [{
      type: Input,
      args: ['cdkListboxValue']
    }],
    multiple: [{
      type: Input,
      args: [{
        alias: 'cdkListboxMultiple',
        transform: booleanAttribute
      }]
    }],
    disabled: [{
      type: Input,
      args: [{
        alias: 'cdkListboxDisabled',
        transform: booleanAttribute
      }]
    }],
    useActiveDescendant: [{
      type: Input,
      args: [{
        alias: 'cdkListboxUseActiveDescendant',
        transform: booleanAttribute
      }]
    }],
    orientation: [{
      type: Input,
      args: ['cdkListboxOrientation']
    }],
    compareWith: [{
      type: Input,
      args: ['cdkListboxCompareWith']
    }],
    navigationWrapDisabled: [{
      type: Input,
      args: [{
        alias: 'cdkListboxNavigationWrapDisabled',
        transform: booleanAttribute
      }]
    }],
    navigateDisabledOptions: [{
      type: Input,
      args: [{
        alias: 'cdkListboxNavigatesDisabledOptions',
        transform: booleanAttribute
      }]
    }],
    valueChange: [{
      type: Output,
      args: ['cdkListboxValueChange']
    }],
    options: [{
      type: ContentChildren,
      args: [CdkOption, {
        descendants: true
      }]
    }]
  }
});

const EXPORTED_DECLARATIONS = [CdkListbox, CdkOption];
class CdkListboxModule {
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkListboxModule,
    deps: [],
    target: i0.ɵɵFactoryTarget.NgModule
  });
  static ɵmod = i0.ɵɵngDeclareNgModule({
    minVersion: "14.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkListboxModule,
    imports: [CdkListbox, CdkOption],
    exports: [CdkListbox, CdkOption]
  });
  static ɵinj = i0.ɵɵngDeclareInjector({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkListboxModule
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkListboxModule,
  decorators: [{
    type: NgModule,
    args: [{
      imports: [...EXPORTED_DECLARATIONS],
      exports: [...EXPORTED_DECLARATIONS]
    }]
  }]
});

export { CdkListbox, CdkListboxModule, CdkOption };
//# sourceMappingURL=listbox.mjs.map
