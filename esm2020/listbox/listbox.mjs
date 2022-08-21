/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectorRef, ContentChildren, Directive, ElementRef, forwardRef, inject, InjectFlags, Input, Output, QueryList, } from '@angular/core';
import { ActiveDescendantKeyManager } from '@angular/cdk/a11y';
import { A, DOWN_ARROW, END, ENTER, hasModifierKey, HOME, LEFT_ARROW, RIGHT_ARROW, SPACE, UP_ARROW, } from '@angular/cdk/keycodes';
import { coerceArray, coerceBooleanProperty } from '@angular/cdk/coercion';
import { SelectionModel } from '@angular/cdk/collections';
import { defer, merge, Subject } from 'rxjs';
import { filter, map, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators, } from '@angular/forms';
import { Directionality } from '@angular/cdk/bidi';
import * as i0 from "@angular/core";
/** The next id to use for creating unique DOM IDs. */
let nextId = 0;
/**
 * An implementation of SelectionModel that internally always represents the selection as a
 * multi-selection. This is necessary so that we can recover the full selection if the user
 * switches the listbox from single-selection to multi-selection after initialization.
 *
 * This selection model may report multiple selected values, even if it is in single-selection
 * mode. It is up to the user (CdkListbox) to check for invalid selections.
 */
class ListboxSelectionModel extends SelectionModel {
    constructor(multiple = false, initiallySelectedValues, emitChanges = true, compareWith) {
        super(true, initiallySelectedValues, emitChanges, compareWith);
        this.multiple = multiple;
    }
    isMultipleSelection() {
        return this.multiple;
    }
    select(...values) {
        // The super class is always in multi-selection mode, so we need to override the behavior if
        // this selection model actually belongs to a single-selection listbox.
        if (this.multiple) {
            return super.select(...values);
        }
        else {
            return super.setSelection(...values);
        }
    }
}
/** A selectable option in a listbox. */
export class CdkOption {
    constructor() {
        this._generatedId = `cdk-option-${nextId++}`;
        this._disabled = false;
        /** The option's host element */
        this.element = inject(ElementRef).nativeElement;
        /** The parent listbox this option belongs to. */
        this.listbox = inject(CdkListbox);
        /** Emits when the option is destroyed. */
        this.destroyed = new Subject();
        /** Emits when the option is clicked. */
        this._clicked = new Subject();
        /** Whether the option is currently active. */
        this._active = false;
    }
    /** The id of the option's host element. */
    get id() {
        return this._id || this._generatedId;
    }
    set id(value) {
        this._id = value;
    }
    /** Whether this option is disabled. */
    get disabled() {
        return this.listbox.disabled || this._disabled;
    }
    set disabled(value) {
        this._disabled = coerceBooleanProperty(value);
    }
    /** The tabindex of the option when it is enabled. */
    get enabledTabIndex() {
        return this._enabledTabIndex === undefined
            ? this.listbox.enabledTabIndex
            : this._enabledTabIndex;
    }
    set enabledTabIndex(value) {
        this._enabledTabIndex = value;
    }
    ngOnDestroy() {
        this.destroyed.next();
        this.destroyed.complete();
    }
    /** Whether this option is selected. */
    isSelected() {
        return this.listbox.isSelected(this);
    }
    /** Whether this option is active. */
    isActive() {
        return this._active;
    }
    /** Toggle the selected state of this option. */
    toggle() {
        this.listbox.toggle(this);
    }
    /** Select this option if it is not selected. */
    select() {
        this.listbox.select(this);
    }
    /** Deselect this option if it is selected. */
    deselect() {
        this.listbox.deselect(this);
    }
    /** Focus this option. */
    focus() {
        this.element.focus();
    }
    /** Get the label for this element which is required by the FocusableOption interface. */
    getLabel() {
        return (this.typeaheadLabel ?? this.element.textContent?.trim()) || '';
    }
    /**
     * Set the option as active.
     * @docs-private
     */
    setActiveStyles() {
        this._active = true;
    }
    /**
     * Set the option as inactive.
     * @docs-private
     */
    setInactiveStyles() {
        this._active = false;
    }
    /** Handle focus events on the option. */
    _handleFocus() {
        // Options can wind up getting focused in active descendant mode if the user clicks on them.
        // In this case, we push focus back to the parent listbox to prevent an extra tab stop when
        // the user performs a shift+tab.
        if (this.listbox.useActiveDescendant) {
            this.listbox._setActiveOption(this);
            this.listbox.focus();
        }
    }
    /** Get the tabindex for this option. */
    _getTabIndex() {
        if (this.listbox.useActiveDescendant || this.disabled) {
            return -1;
        }
        return this.isActive() ? this.enabledTabIndex : -1;
    }
}
CdkOption.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.0-rc.0", ngImport: i0, type: CdkOption, deps: [], target: i0.ɵɵFactoryTarget.Directive });
CdkOption.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "14.2.0-rc.0", type: CdkOption, selector: "[cdkOption]", inputs: { id: "id", value: ["cdkOption", "value"], typeaheadLabel: ["cdkOptionTypeaheadLabel", "typeaheadLabel"], disabled: ["cdkOptionDisabled", "disabled"], enabledTabIndex: ["tabindex", "enabledTabIndex"] }, host: { attributes: { "role": "option" }, listeners: { "click": "_clicked.next($event)", "focus": "_handleFocus()" }, properties: { "id": "id", "attr.aria-selected": "isSelected()", "attr.tabindex": "_getTabIndex()", "attr.aria-disabled": "disabled", "class.cdk-option-active": "isActive()" }, classAttribute: "cdk-option" }, exportAs: ["cdkOption"], ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.0-rc.0", ngImport: i0, type: CdkOption, decorators: [{
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
                        '(focus)': '_handleFocus()',
                    },
                }]
        }], propDecorators: { id: [{
                type: Input
            }], value: [{
                type: Input,
                args: ['cdkOption']
            }], typeaheadLabel: [{
                type: Input,
                args: ['cdkOptionTypeaheadLabel']
            }], disabled: [{
                type: Input,
                args: ['cdkOptionDisabled']
            }], enabledTabIndex: [{
                type: Input,
                args: ['tabindex']
            }] } });
export class CdkListbox {
    constructor() {
        this._generatedId = `cdk-listbox-${nextId++}`;
        this._disabled = false;
        this._useActiveDescendant = false;
        this._orientation = 'vertical';
        this._navigationWrapDisabled = false;
        this._navigateDisabledOptions = false;
        /** Emits when the selected value(s) in the listbox change. */
        this.valueChange = new Subject();
        /** The selection model used by the listbox. */
        this.selectionModel = new ListboxSelectionModel();
        /** Emits when the listbox is destroyed. */
        this.destroyed = new Subject();
        /** The host element of the listbox. */
        this.element = inject(ElementRef).nativeElement;
        /** The change detector for this listbox. */
        this.changeDetectorRef = inject(ChangeDetectorRef);
        /** Whether the currently selected value in the selection model is invalid. */
        this._invalid = false;
        /** The last user-triggered option. */
        this._lastTriggered = null;
        /** Callback called when the listbox has been touched */
        this._onTouched = () => { };
        /** Callback called when the listbox value changes */
        this._onChange = () => { };
        /** Callback called when the form validator changes. */
        this._onValidatorChange = () => { };
        /** Emits when an option has been clicked. */
        this._optionClicked = defer(() => this.options.changes.pipe(startWith(this.options), switchMap(options => merge(...options.map(option => option._clicked.pipe(map(event => ({ option, event }))))))));
        /** The directionality of the page. */
        this._dir = inject(Directionality, InjectFlags.Optional);
        /** A predicate that skips disabled options. */
        this._skipDisabledPredicate = (option) => option.disabled;
        /** A predicate that does not skip any options. */
        this._skipNonePredicate = () => false;
        /**
         * Validator that produces an error if multiple values are selected in a single selection
         * listbox.
         * @param control The control to validate
         * @return A validation error or null
         */
        this._validateUnexpectedMultipleValues = (control) => {
            const controlValue = this._coerceValue(control.value);
            if (!this.multiple && controlValue.length > 1) {
                return { 'cdkListboxUnexpectedMultipleValues': true };
            }
            return null;
        };
        /**
         * Validator that produces an error if any selected values are not valid options for this listbox.
         * @param control The control to validate
         * @return A validation error or null
         */
        this._validateUnexpectedOptionValues = (control) => {
            const controlValue = this._coerceValue(control.value);
            const invalidValues = this._getInvalidOptionValues(controlValue);
            if (invalidValues.length) {
                return { 'cdkListboxUnexpectedOptionValues': { 'values': invalidValues } };
            }
            return null;
        };
        /** The combined set of validators for this listbox. */
        this._validators = Validators.compose([
            this._validateUnexpectedMultipleValues,
            this._validateUnexpectedOptionValues,
        ]);
        // Update the internal value whenever the selection model's selection changes.
        this.selectionModel.changed.pipe(startWith(null), takeUntil(this.destroyed)).subscribe(() => {
            this._updateInternalValue();
        });
    }
    /** The id of the option's host element. */
    get id() {
        return this._id || this._generatedId;
    }
    set id(value) {
        this._id = value;
    }
    /** The tabindex to use when the listbox is enabled. */
    get enabledTabIndex() {
        return this._enabledTabIndex === undefined ? 0 : this._enabledTabIndex;
    }
    set enabledTabIndex(value) {
        this._enabledTabIndex = value;
    }
    /** The value selected in the listbox, represented as an array of option values. */
    get value() {
        return this._invalid ? [] : this.selectionModel.selected;
    }
    set value(value) {
        this._setSelection(value);
    }
    /**
     * Whether the listbox allows multiple options to be selected. If the value switches from `true`
     * to `false`, and more than one option is selected, all options are deselected.
     */
    get multiple() {
        return this.selectionModel.multiple;
    }
    set multiple(value) {
        this.selectionModel.multiple = coerceBooleanProperty(value);
        this._updateInternalValue();
    }
    /** Whether the listbox is disabled. */
    get disabled() {
        return this._disabled;
    }
    set disabled(value) {
        this._disabled = coerceBooleanProperty(value);
    }
    /** Whether the listbox will use active descendant or will move focus onto the options. */
    get useActiveDescendant() {
        return this._useActiveDescendant;
    }
    set useActiveDescendant(shouldUseActiveDescendant) {
        this._useActiveDescendant = coerceBooleanProperty(shouldUseActiveDescendant);
    }
    /** The orientation of the listbox. Only affects keyboard interaction, not visual layout. */
    get orientation() {
        return this._orientation;
    }
    set orientation(value) {
        this._orientation = value === 'horizontal' ? 'horizontal' : 'vertical';
        if (value === 'horizontal') {
            this.listKeyManager?.withHorizontalOrientation(this._dir?.value || 'ltr');
        }
        else {
            this.listKeyManager?.withVerticalOrientation();
        }
    }
    /** The function used to compare option values. */
    get compareWith() {
        return this.selectionModel.compareWith;
    }
    set compareWith(fn) {
        this.selectionModel.compareWith = fn;
    }
    /**
     * Whether the keyboard navigation should wrap when the user presses arrow down on the last item
     * or arrow up on the first item.
     */
    get navigationWrapDisabled() {
        return this._navigationWrapDisabled;
    }
    set navigationWrapDisabled(wrap) {
        this._navigationWrapDisabled = coerceBooleanProperty(wrap);
        this.listKeyManager?.withWrap(!this._navigationWrapDisabled);
    }
    /** Whether keyboard navigation should skip over disabled items. */
    get navigateDisabledOptions() {
        return this._navigateDisabledOptions;
    }
    set navigateDisabledOptions(skip) {
        this._navigateDisabledOptions = coerceBooleanProperty(skip);
        this.listKeyManager?.skipPredicate(this._navigateDisabledOptions ? this._skipNonePredicate : this._skipDisabledPredicate);
    }
    ngAfterContentInit() {
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            this._verifyNoOptionValueCollisions();
        }
        this._initKeyManager();
        // Update the internal value whenever the options change, as this may change the validity of
        // the current selection
        this.options.changes.pipe(startWith(this.options), takeUntil(this.destroyed)).subscribe(() => {
            this._updateInternalValue();
        });
        this._optionClicked
            .pipe(filter(({ option }) => !option.disabled), takeUntil(this.destroyed))
            .subscribe(({ option, event }) => this._handleOptionClicked(option, event));
    }
    ngOnDestroy() {
        this.listKeyManager.change.complete();
        this.destroyed.next();
        this.destroyed.complete();
    }
    /**
     * Toggle the selected state of the given option.
     * @param option The option to toggle
     */
    toggle(option) {
        this.toggleValue(option.value);
    }
    /**
     * Toggle the selected state of the given value.
     * @param value The value to toggle
     */
    toggleValue(value) {
        if (this._invalid) {
            this.selectionModel.clear(false);
        }
        this.selectionModel.toggle(value);
    }
    /**
     * Select the given option.
     * @param option The option to select
     */
    select(option) {
        this.selectValue(option.value);
    }
    /**
     * Select the given value.
     * @param value The value to select
     */
    selectValue(value) {
        if (this._invalid) {
            this.selectionModel.clear(false);
        }
        this.selectionModel.select(value);
    }
    /**
     * Deselect the given option.
     * @param option The option to deselect
     */
    deselect(option) {
        this.deselectValue(option.value);
    }
    /**
     * Deselect the given value.
     * @param value The value to deselect
     */
    deselectValue(value) {
        if (this._invalid) {
            this.selectionModel.clear(false);
        }
        this.selectionModel.deselect(value);
    }
    /**
     * Set the selected state of all options.
     * @param isSelected The new selected state to set
     */
    setAllSelected(isSelected) {
        if (!isSelected) {
            this.selectionModel.clear();
        }
        else {
            if (this._invalid) {
                this.selectionModel.clear(false);
            }
            this.selectionModel.select(...this.options.map(option => option.value));
        }
    }
    /**
     * Get whether the given option is selected.
     * @param option The option to get the selected state of
     */
    isSelected(option) {
        return this.isValueSelected(option.value);
    }
    /**
     * Get whether the given value is selected.
     * @param value The value to get the selected state of
     */
    isValueSelected(value) {
        if (this._invalid) {
            return false;
        }
        return this.selectionModel.isSelected(value);
    }
    /**
     * Registers a callback to be invoked when the listbox's value changes from user input.
     * @param fn The callback to register
     * @docs-private
     */
    registerOnChange(fn) {
        this._onChange = fn;
    }
    /**
     * Registers a callback to be invoked when the listbox is blurred by the user.
     * @param fn The callback to register
     * @docs-private
     */
    registerOnTouched(fn) {
        this._onTouched = fn;
    }
    /**
     * Sets the listbox's value.
     * @param value The new value of the listbox
     * @docs-private
     */
    writeValue(value) {
        this._setSelection(value);
    }
    /**
     * Sets the disabled state of the listbox.
     * @param isDisabled The new disabled state
     * @docs-private
     */
    setDisabledState(isDisabled) {
        this.disabled = isDisabled;
    }
    /**
     * Validate the given control
     * @docs-private
     */
    validate(control) {
        return this._validators(control);
    }
    /**
     * Registers a callback to be called when the form validator changes.
     * @param fn The callback to call
     * @docs-private
     */
    registerOnValidatorChange(fn) {
        this._onValidatorChange = fn;
    }
    /** Focus the listbox's host element. */
    focus() {
        this.element.focus();
    }
    /**
     * Triggers the given option in response to user interaction.
     * - In single selection mode: selects the option and deselects any other selected option.
     * - In multi selection mode: toggles the selected state of the option.
     * @param option The option to trigger
     */
    triggerOption(option) {
        if (option && !option.disabled) {
            this._lastTriggered = option;
            const changed = this.multiple
                ? this.selectionModel.toggle(option.value)
                : this.selectionModel.select(option.value);
            if (changed) {
                this._onChange(this.value);
                this.valueChange.next({
                    value: this.value,
                    listbox: this,
                    option: option,
                });
            }
        }
    }
    /**
     * Trigger the given range of options in response to user interaction.
     * Should only be called in multi-selection mode.
     * @param trigger The option that was triggered
     * @param from The start index of the options to toggle
     * @param to The end index of the options to toggle
     * @param on Whether to toggle the option range on
     */
    triggerRange(trigger, from, to, on) {
        if (this.disabled || (trigger && trigger.disabled)) {
            return;
        }
        this._lastTriggered = trigger;
        const isEqual = this.compareWith ?? Object.is;
        const updateValues = [...this.options]
            .slice(Math.max(0, Math.min(from, to)), Math.min(this.options.length, Math.max(from, to) + 1))
            .filter(option => !option.disabled)
            .map(option => option.value);
        const selected = [...this.value];
        for (const updateValue of updateValues) {
            const selectedIndex = selected.findIndex(selectedValue => isEqual(selectedValue, updateValue));
            if (on && selectedIndex === -1) {
                selected.push(updateValue);
            }
            else if (!on && selectedIndex !== -1) {
                selected.splice(selectedIndex, 1);
            }
        }
        let changed = this.selectionModel.setSelection(...selected);
        if (changed) {
            this._onChange(this.value);
            this.valueChange.next({
                value: this.value,
                listbox: this,
                option: trigger,
            });
        }
    }
    /**
     * Sets the given option as active.
     * @param option The option to make active
     */
    _setActiveOption(option) {
        this.listKeyManager.setActiveItem(option);
    }
    /** Called when the listbox receives focus. */
    _handleFocus() {
        if (!this.useActiveDescendant) {
            this.listKeyManager.setNextItemActive();
            this._focusActiveOption();
        }
    }
    /** Called when the user presses keydown on the listbox. */
    _handleKeydown(event) {
        if (this._disabled) {
            return;
        }
        const { keyCode } = event;
        const previousActiveIndex = this.listKeyManager.activeItemIndex;
        const ctrlKeys = ['ctrlKey', 'metaKey'];
        if (this.multiple && keyCode === A && hasModifierKey(event, ...ctrlKeys)) {
            // Toggle all options off if they're all selected, otherwise toggle them all on.
            this.triggerRange(null, 0, this.options.length - 1, this.options.length !== this.value.length);
            event.preventDefault();
            return;
        }
        if (this.multiple &&
            (keyCode === SPACE || keyCode === ENTER) &&
            hasModifierKey(event, 'shiftKey')) {
            if (this.listKeyManager.activeItem && this.listKeyManager.activeItemIndex != null) {
                this.triggerRange(this.listKeyManager.activeItem, this._getLastTriggeredIndex() ?? this.listKeyManager.activeItemIndex, this.listKeyManager.activeItemIndex, !this.listKeyManager.activeItem.isSelected());
            }
            event.preventDefault();
            return;
        }
        if (this.multiple &&
            keyCode === HOME &&
            hasModifierKey(event, ...ctrlKeys) &&
            hasModifierKey(event, 'shiftKey')) {
            const trigger = this.listKeyManager.activeItem;
            if (trigger) {
                const from = this.listKeyManager.activeItemIndex;
                this.listKeyManager.setFirstItemActive();
                this.triggerRange(trigger, from, this.listKeyManager.activeItemIndex, !trigger.isSelected());
            }
            event.preventDefault();
            return;
        }
        if (this.multiple &&
            keyCode === END &&
            hasModifierKey(event, ...ctrlKeys) &&
            hasModifierKey(event, 'shiftKey')) {
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
        const isNavKey = keyCode === UP_ARROW ||
            keyCode === DOWN_ARROW ||
            keyCode === LEFT_ARROW ||
            keyCode === RIGHT_ARROW ||
            keyCode === HOME ||
            keyCode === END;
        this.listKeyManager.onKeydown(event);
        // Will select an option if shift was pressed while navigating to the option
        if (isNavKey && event.shiftKey && previousActiveIndex !== this.listKeyManager.activeItemIndex) {
            this.triggerOption(this.listKeyManager.activeItem);
        }
    }
    /**
     * Called when the focus leaves an element in the listbox.
     * @param event The focusout event
     */
    _handleFocusOut(event) {
        const otherElement = event.relatedTarget;
        if (this.element !== otherElement && !this.element.contains(otherElement)) {
            this._onTouched();
        }
    }
    /** Get the id of the active option if active descendant is being used. */
    _getAriaActiveDescendant() {
        return this._useActiveDescendant ? this.listKeyManager?.activeItem?.id : null;
    }
    /** Get the tabindex for the listbox. */
    _getTabIndex() {
        if (this.disabled) {
            return -1;
        }
        return this.useActiveDescendant || !this.listKeyManager.activeItem ? this.enabledTabIndex : -1;
    }
    /** Initialize the key manager. */
    _initKeyManager() {
        this.listKeyManager = new ActiveDescendantKeyManager(this.options)
            .withWrap(!this._navigationWrapDisabled)
            .withTypeAhead()
            .withHomeAndEnd()
            .withAllowedModifierKeys(['shiftKey'])
            .skipPredicate(this._navigateDisabledOptions ? this._skipNonePredicate : this._skipDisabledPredicate);
        if (this.orientation === 'vertical') {
            this.listKeyManager.withVerticalOrientation();
        }
        else {
            this.listKeyManager.withHorizontalOrientation(this._dir?.value || 'ltr');
        }
        this.listKeyManager.change
            .pipe(takeUntil(this.destroyed))
            .subscribe(() => this._focusActiveOption());
    }
    /** Focus the active option. */
    _focusActiveOption() {
        if (!this.useActiveDescendant) {
            this.listKeyManager.activeItem?.focus();
        }
        this.changeDetectorRef.markForCheck();
    }
    /**
     * Set the selected values.
     * @param value The list of new selected values.
     */
    _setSelection(value) {
        if (this._invalid) {
            this.selectionModel.clear(false);
        }
        this.selectionModel.setSelection(...this._coerceValue(value));
    }
    /** Update the internal value of the listbox based on the selection model. */
    _updateInternalValue() {
        const indexCache = new Map();
        this.selectionModel.sort((a, b) => {
            const aIndex = this._getIndexForValue(indexCache, a);
            const bIndex = this._getIndexForValue(indexCache, b);
            return aIndex - bIndex;
        });
        const selected = this.selectionModel.selected;
        this._invalid =
            (!this.multiple && selected.length > 1) || !!this._getInvalidOptionValues(selected).length;
        this._onValidatorChange();
        this.changeDetectorRef.markForCheck();
    }
    /**
     * Gets the index of the given value in the given list of options.
     * @param cache The cache of indices found so far
     * @param value The value to find
     * @return The index of the value in the options list
     */
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
    /**
     * Handle the user clicking an option.
     * @param option The option that was clicked.
     */
    _handleOptionClicked(option, event) {
        this.listKeyManager.setActiveItem(option);
        if (event.shiftKey && this.multiple) {
            this.triggerRange(option, this._getLastTriggeredIndex() ?? this.listKeyManager.activeItemIndex, this.listKeyManager.activeItemIndex, !option.isSelected());
        }
        else {
            this.triggerOption(option);
        }
    }
    /** Verifies that no two options represent the same value under the compareWith function. */
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
                    // TODO(mmalerba): Link to docs about this.
                    if (this.compareWith) {
                        console.warn(`Found multiple CdkOption representing the same value under the given compareWith function`, {
                            option1: option.element,
                            option2: duplicate.element,
                            compareWith: this.compareWith,
                        });
                    }
                    else {
                        console.warn(`Found multiple CdkOption with the same value`, {
                            option1: option.element,
                            option2: duplicate.element,
                        });
                    }
                    return;
                }
            }
        });
    }
    /**
     * Coerces a value into an array representing a listbox selection.
     * @param value The value to coerce
     * @return An array
     */
    _coerceValue(value) {
        return value == null ? [] : coerceArray(value);
    }
    /**
     * Get the sublist of values that do not represent valid option values in this listbox.
     * @param values The list of values
     * @return The sublist of values that are not valid option values
     */
    _getInvalidOptionValues(values) {
        const isEqual = this.compareWith || Object.is;
        const validValues = (this.options || []).map(option => option.value);
        return values.filter(value => !validValues.some(validValue => isEqual(value, validValue)));
    }
    /** Get the index of the last triggered option. */
    _getLastTriggeredIndex() {
        const index = this.options.toArray().indexOf(this._lastTriggered);
        return index === -1 ? null : index;
    }
}
CdkListbox.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.0-rc.0", ngImport: i0, type: CdkListbox, deps: [], target: i0.ɵɵFactoryTarget.Directive });
CdkListbox.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "14.2.0-rc.0", type: CdkListbox, selector: "[cdkListbox]", inputs: { id: "id", enabledTabIndex: ["tabindex", "enabledTabIndex"], value: ["cdkListboxValue", "value"], multiple: ["cdkListboxMultiple", "multiple"], disabled: ["cdkListboxDisabled", "disabled"], useActiveDescendant: ["cdkListboxUseActiveDescendant", "useActiveDescendant"], orientation: ["cdkListboxOrientation", "orientation"], compareWith: ["cdkListboxCompareWith", "compareWith"], navigationWrapDisabled: ["cdkListboxNavigationWrapDisabled", "navigationWrapDisabled"], navigateDisabledOptions: ["cdkListboxNavigatesDisabledOptions", "navigateDisabledOptions"] }, outputs: { valueChange: "cdkListboxValueChange" }, host: { attributes: { "role": "listbox" }, listeners: { "focus": "_handleFocus()", "keydown": "_handleKeydown($event)", "focusout": "_handleFocusOut($event)" }, properties: { "id": "id", "attr.tabindex": "_getTabIndex()", "attr.aria-disabled": "disabled", "attr.aria-multiselectable": "multiple", "attr.aria-activedescendant": "_getAriaActiveDescendant()", "attr.aria-orientation": "orientation" }, classAttribute: "cdk-listbox" }, providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CdkListbox),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => CdkListbox),
            multi: true,
        },
    ], queries: [{ propertyName: "options", predicate: CdkOption, descendants: true }], exportAs: ["cdkListbox"], ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.0-rc.0", ngImport: i0, type: CdkListbox, decorators: [{
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
                    },
                    providers: [
                        {
                            provide: NG_VALUE_ACCESSOR,
                            useExisting: forwardRef(() => CdkListbox),
                            multi: true,
                        },
                        {
                            provide: NG_VALIDATORS,
                            useExisting: forwardRef(() => CdkListbox),
                            multi: true,
                        },
                    ],
                }]
        }], ctorParameters: function () { return []; }, propDecorators: { id: [{
                type: Input
            }], enabledTabIndex: [{
                type: Input,
                args: ['tabindex']
            }], value: [{
                type: Input,
                args: ['cdkListboxValue']
            }], multiple: [{
                type: Input,
                args: ['cdkListboxMultiple']
            }], disabled: [{
                type: Input,
                args: ['cdkListboxDisabled']
            }], useActiveDescendant: [{
                type: Input,
                args: ['cdkListboxUseActiveDescendant']
            }], orientation: [{
                type: Input,
                args: ['cdkListboxOrientation']
            }], compareWith: [{
                type: Input,
                args: ['cdkListboxCompareWith']
            }], navigationWrapDisabled: [{
                type: Input,
                args: ['cdkListboxNavigationWrapDisabled']
            }], navigateDisabledOptions: [{
                type: Input,
                args: ['cdkListboxNavigatesDisabledOptions']
            }], valueChange: [{
                type: Output,
                args: ['cdkListboxValueChange']
            }], options: [{
                type: ContentChildren,
                args: [CdkOption, { descendants: true }]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdGJveC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvbGlzdGJveC9saXN0Ym94LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFFTCxpQkFBaUIsRUFDakIsZUFBZSxFQUNmLFNBQVMsRUFDVCxVQUFVLEVBQ1YsVUFBVSxFQUNWLE1BQU0sRUFDTixXQUFXLEVBQ1gsS0FBSyxFQUVMLE1BQU0sRUFDTixTQUFTLEdBQ1YsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLDBCQUEwQixFQUFzQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2xHLE9BQU8sRUFDTCxDQUFDLEVBQ0QsVUFBVSxFQUNWLEdBQUcsRUFDSCxLQUFLLEVBQ0wsY0FBYyxFQUNkLElBQUksRUFDSixVQUFVLEVBQ1YsV0FBVyxFQUNYLEtBQUssRUFDTCxRQUFRLEdBQ1QsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQWUsV0FBVyxFQUFFLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdkYsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ3hELE9BQU8sRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFjLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUN2RCxPQUFPLEVBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzVFLE9BQU8sRUFHTCxhQUFhLEVBQ2IsaUJBQWlCLEVBSWpCLFVBQVUsR0FDWCxNQUFNLGdCQUFnQixDQUFDO0FBQ3hCLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQzs7QUFFakQsc0RBQXNEO0FBQ3RELElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztBQUVmOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLHFCQUF5QixTQUFRLGNBQWlCO0lB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QUFLO3VCQUFDLG9CQUFvQjtnQkFXdkIsUUFBUTtzQkFEWCxLQUFLO3VCQUFDLG9CQUFvQjtnQkFXdkIsbUJBQW1CO3NCQUR0QixLQUFLO3VCQUFDLCtCQUErQjtnQkFXbEMsV0FBVztzQkFEZCxLQUFLO3VCQUFDLHVCQUF1QjtnQkFnQjFCLFdBQVc7c0JBRGQsS0FBSzt1QkFBQyx1QkFBdUI7Z0JBYTFCLHNCQUFzQjtzQkFEekIsS0FBSzt1QkFBQyxrQ0FBa0M7Z0JBWXJDLHVCQUF1QjtzQkFEMUIsS0FBSzt1QkFBQyxvQ0FBb0M7Z0JBYUQsV0FBVztzQkFBcEQsTUFBTTt1QkFBQyx1QkFBdUI7Z0JBRzRCLE9BQU87c0JBQWpFLGVBQWU7dUJBQUMsU0FBUyxFQUFFLEVBQUMsV0FBVyxFQUFFLElBQUksRUFBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBBZnRlckNvbnRlbnRJbml0LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29udGVudENoaWxkcmVuLFxuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIGZvcndhcmRSZWYsXG4gIGluamVjdCxcbiAgSW5qZWN0RmxhZ3MsXG4gIElucHV0LFxuICBPbkRlc3Ryb3ksXG4gIE91dHB1dCxcbiAgUXVlcnlMaXN0LFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7QWN0aXZlRGVzY2VuZGFudEtleU1hbmFnZXIsIEhpZ2hsaWdodGFibGUsIExpc3RLZXlNYW5hZ2VyT3B0aW9ufSBmcm9tICdAYW5ndWxhci9jZGsvYTExeSc7XG5pbXBvcnQge1xuICBBLFxuICBET1dOX0FSUk9XLFxuICBFTkQsXG4gIEVOVEVSLFxuICBoYXNNb2RpZmllcktleSxcbiAgSE9NRSxcbiAgTEVGVF9BUlJPVyxcbiAgUklHSFRfQVJST1csXG4gIFNQQUNFLFxuICBVUF9BUlJPVyxcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2tleWNvZGVzJztcbmltcG9ydCB7Qm9vbGVhbklucHV0LCBjb2VyY2VBcnJheSwgY29lcmNlQm9vbGVhblByb3BlcnR5fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtTZWxlY3Rpb25Nb2RlbH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvbGxlY3Rpb25zJztcbmltcG9ydCB7ZGVmZXIsIG1lcmdlLCBPYnNlcnZhYmxlLCBTdWJqZWN0fSBmcm9tICdyeGpzJztcbmltcG9ydCB7ZmlsdGVyLCBtYXAsIHN0YXJ0V2l0aCwgc3dpdGNoTWFwLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7XG4gIEFic3RyYWN0Q29udHJvbCxcbiAgQ29udHJvbFZhbHVlQWNjZXNzb3IsXG4gIE5HX1ZBTElEQVRPUlMsXG4gIE5HX1ZBTFVFX0FDQ0VTU09SLFxuICBWYWxpZGF0aW9uRXJyb3JzLFxuICBWYWxpZGF0b3IsXG4gIFZhbGlkYXRvckZuLFxuICBWYWxpZGF0b3JzLFxufSBmcm9tICdAYW5ndWxhci9mb3Jtcyc7XG5pbXBvcnQge0RpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5cbi8qKiBUaGUgbmV4dCBpZCB0byB1c2UgZm9yIGNyZWF0aW5nIHVuaXF1ZSBET00gSURzLiAqL1xubGV0IG5leHRJZCA9IDA7XG5cbi8qKlxuICogQW4gaW1wbGVtZW50YXRpb24gb2YgU2VsZWN0aW9uTW9kZWwgdGhhdCBpbnRlcm5hbGx5IGFsd2F5cyByZXByZXNlbnRzIHRoZSBzZWxlY3Rpb24gYXMgYVxuICogbXVsdGktc2VsZWN0aW9uLiBUaGlzIGlzIG5lY2Vzc2FyeSBzbyB0aGF0IHdlIGNhbiByZWNvdmVyIHRoZSBmdWxsIHNlbGVjdGlvbiBpZiB0aGUgdXNlclxuICogc3dpdGNoZXMgdGhlIGxpc3Rib3ggZnJvbSBzaW5nbGUtc2VsZWN0aW9uIHRvIG11bHRpLXNlbGVjdGlvbiBhZnRlciBpbml0aWFsaXphdGlvbi5cbiAqXG4gKiBUaGlzIHNlbGVjdGlvbiBtb2RlbCBtYXkgcmVwb3J0IG11bHRpcGxlIHNlbGVjdGVkIHZhbHVlcywgZXZlbiBpZiBpdCBpcyBpbiBzaW5nbGUtc2VsZWN0aW9uXG4gKiBtb2RlLiBJdCBpcyB1cCB0byB0aGUgdXNlciAoQ2RrTGlzdGJveCkgdG8gY2hlY2sgZm9yIGludmFsaWQgc2VsZWN0aW9ucy5cbiAqL1xuY2xhc3MgTGlzdGJveFNlbGVjdGlvbk1vZGVsPFQ+IGV4dGVuZHMgU2VsZWN0aW9uTW9kZWw8VD4ge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgbXVsdGlwbGUgPSBmYWxzZSxcbiAgICBpbml0aWFsbHlTZWxlY3RlZFZhbHVlcz86IFRbXSxcbiAgICBlbWl0Q2hhbmdlcyA9IHRydWUsXG4gICAgY29tcGFyZVdpdGg/OiAobzE6IFQsIG8yOiBUKSA9PiBib29sZWFuLFxuICApIHtcbiAgICBzdXBlcih0cnVlLCBpbml0aWFsbHlTZWxlY3RlZFZhbHVlcywgZW1pdENoYW5nZXMsIGNvbXBhcmVXaXRoKTtcbiAgfVxuXG4gIG92ZXJyaWRlIGlzTXVsdGlwbGVTZWxlY3Rpb24oKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMubXVsdGlwbGU7XG4gIH1cblxuICBvdmVycmlkZSBzZWxlY3QoLi4udmFsdWVzOiBUW10pIHtcbiAgICAvLyBUaGUgc3VwZXIgY2xhc3MgaXMgYWx3YXlzIGluIG11bHRpLXNlbGVjdGlvbiBtb2RlLCBzbyB3ZSBuZWVkIHRvIG92ZXJyaWRlIHRoZSBiZWhhdmlvciBpZlxuICAgIC8vIHRoaXMgc2VsZWN0aW9uIG1vZGVsIGFjdHVhbGx5IGJlbG9uZ3MgdG8gYSBzaW5nbGUtc2VsZWN0aW9uIGxpc3Rib3guXG4gICAgaWYgKHRoaXMubXVsdGlwbGUpIHtcbiAgICAgIHJldHVybiBzdXBlci5zZWxlY3QoLi4udmFsdWVzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHN1cGVyLnNldFNlbGVjdGlvbiguLi52YWx1ZXMpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogQSBzZWxlY3RhYmxlIG9wdGlvbiBpbiBhIGxpc3Rib3guICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrT3B0aW9uXScsXG4gIGV4cG9ydEFzOiAnY2RrT3B0aW9uJyxcbiAgaG9zdDoge1xuICAgICdyb2xlJzogJ29wdGlvbicsXG4gICAgJ2NsYXNzJzogJ2Nkay1vcHRpb24nLFxuICAgICdbaWRdJzogJ2lkJyxcbiAgICAnW2F0dHIuYXJpYS1zZWxlY3RlZF0nOiAnaXNTZWxlY3RlZCgpJyxcbiAgICAnW2F0dHIudGFiaW5kZXhdJzogJ19nZXRUYWJJbmRleCgpJyxcbiAgICAnW2F0dHIuYXJpYS1kaXNhYmxlZF0nOiAnZGlzYWJsZWQnLFxuICAgICdbY2xhc3MuY2RrLW9wdGlvbi1hY3RpdmVdJzogJ2lzQWN0aXZlKCknLFxuICAgICcoY2xpY2spJzogJ19jbGlja2VkLm5leHQoJGV2ZW50KScsXG4gICAgJyhmb2N1cyknOiAnX2hhbmRsZUZvY3VzKCknLFxuICB9LFxufSlcbmV4cG9ydCBjbGFzcyBDZGtPcHRpb248VCA9IHVua25vd24+IGltcGxlbWVudHMgTGlzdEtleU1hbmFnZXJPcHRpb24sIEhpZ2hsaWdodGFibGUsIE9uRGVzdHJveSB7XG4gIC8qKiBUaGUgaWQgb2YgdGhlIG9wdGlvbidzIGhvc3QgZWxlbWVudC4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGlkKCkge1xuICAgIHJldHVybiB0aGlzLl9pZCB8fCB0aGlzLl9nZW5lcmF0ZWRJZDtcbiAgfVxuICBzZXQgaWQodmFsdWUpIHtcbiAgICB0aGlzLl9pZCA9IHZhbHVlO1xuICB9XG4gIHByaXZhdGUgX2lkOiBzdHJpbmc7XG4gIHByaXZhdGUgX2dlbmVyYXRlZElkID0gYGNkay1vcHRpb24tJHtuZXh0SWQrK31gO1xuXG4gIC8qKiBUaGUgdmFsdWUgb2YgdGhpcyBvcHRpb24uICovXG4gIEBJbnB1dCgnY2RrT3B0aW9uJykgdmFsdWU6IFQ7XG5cbiAgLyoqXG4gICAqIFRoZSB0ZXh0IHVzZWQgdG8gbG9jYXRlIHRoaXMgaXRlbSBkdXJpbmcgbGlzdGJveCB0eXBlYWhlYWQuIElmIG5vdCBzcGVjaWZpZWQsXG4gICAqIHRoZSBgdGV4dENvbnRlbnRgIG9mIHRoZSBpdGVtIHdpbGwgYmUgdXNlZC5cbiAgICovXG4gIEBJbnB1dCgnY2RrT3B0aW9uVHlwZWFoZWFkTGFiZWwnKSB0eXBlYWhlYWRMYWJlbDogc3RyaW5nO1xuXG4gIC8qKiBXaGV0aGVyIHRoaXMgb3B0aW9uIGlzIGRpc2FibGVkLiAqL1xuICBASW5wdXQoJ2Nka09wdGlvbkRpc2FibGVkJylcbiAgZ2V0IGRpc2FibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmxpc3Rib3guZGlzYWJsZWQgfHwgdGhpcy5fZGlzYWJsZWQ7XG4gIH1cbiAgc2V0IGRpc2FibGVkKHZhbHVlOiBCb29sZWFuSW5wdXQpIHtcbiAgICB0aGlzLl9kaXNhYmxlZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gIH1cbiAgcHJpdmF0ZSBfZGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogVGhlIHRhYmluZGV4IG9mIHRoZSBvcHRpb24gd2hlbiBpdCBpcyBlbmFibGVkLiAqL1xuICBASW5wdXQoJ3RhYmluZGV4JylcbiAgZ2V0IGVuYWJsZWRUYWJJbmRleCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZW5hYmxlZFRhYkluZGV4ID09PSB1bmRlZmluZWRcbiAgICAgID8gdGhpcy5saXN0Ym94LmVuYWJsZWRUYWJJbmRleFxuICAgICAgOiB0aGlzLl9lbmFibGVkVGFiSW5kZXg7XG4gIH1cbiAgc2V0IGVuYWJsZWRUYWJJbmRleCh2YWx1ZSkge1xuICAgIHRoaXMuX2VuYWJsZWRUYWJJbmRleCA9IHZhbHVlO1xuICB9XG4gIHByaXZhdGUgX2VuYWJsZWRUYWJJbmRleD86IG51bWJlciB8IG51bGw7XG5cbiAgLyoqIFRoZSBvcHRpb24ncyBob3N0IGVsZW1lbnQgKi9cbiAgcmVhZG9ubHkgZWxlbWVudDogSFRNTEVsZW1lbnQgPSBpbmplY3QoRWxlbWVudFJlZikubmF0aXZlRWxlbWVudDtcblxuICAvKiogVGhlIHBhcmVudCBsaXN0Ym94IHRoaXMgb3B0aW9uIGJlbG9uZ3MgdG8uICovXG4gIHByb3RlY3RlZCByZWFkb25seSBsaXN0Ym94OiBDZGtMaXN0Ym94PFQ+ID0gaW5qZWN0KENka0xpc3Rib3gpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBvcHRpb24gaXMgZGVzdHJveWVkLiAqL1xuICBwcm90ZWN0ZWQgZGVzdHJveWVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgb3B0aW9uIGlzIGNsaWNrZWQuICovXG4gIHJlYWRvbmx5IF9jbGlja2VkID0gbmV3IFN1YmplY3Q8TW91c2VFdmVudD4oKTtcblxuICAvKiogV2hldGhlciB0aGUgb3B0aW9uIGlzIGN1cnJlbnRseSBhY3RpdmUuICovXG4gIHByaXZhdGUgX2FjdGl2ZSA9IGZhbHNlO1xuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLmRlc3Ryb3llZC5jb21wbGV0ZSgpO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhpcyBvcHRpb24gaXMgc2VsZWN0ZWQuICovXG4gIGlzU2VsZWN0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMubGlzdGJveC5pc1NlbGVjdGVkKHRoaXMpO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhpcyBvcHRpb24gaXMgYWN0aXZlLiAqL1xuICBpc0FjdGl2ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fYWN0aXZlO1xuICB9XG5cbiAgLyoqIFRvZ2dsZSB0aGUgc2VsZWN0ZWQgc3RhdGUgb2YgdGhpcyBvcHRpb24uICovXG4gIHRvZ2dsZSgpIHtcbiAgICB0aGlzLmxpc3Rib3gudG9nZ2xlKHRoaXMpO1xuICB9XG5cbiAgLyoqIFNlbGVjdCB0aGlzIG9wdGlvbiBpZiBpdCBpcyBub3Qgc2VsZWN0ZWQuICovXG4gIHNlbGVjdCgpIHtcbiAgICB0aGlzLmxpc3Rib3guc2VsZWN0KHRoaXMpO1xuICB9XG5cbiAgLyoqIERlc2VsZWN0IHRoaXMgb3B0aW9uIGlmIGl0IGlzIHNlbGVjdGVkLiAqL1xuICBkZXNlbGVjdCgpIHtcbiAgICB0aGlzLmxpc3Rib3guZGVzZWxlY3QodGhpcyk7XG4gIH1cblxuICAvKiogRm9jdXMgdGhpcyBvcHRpb24uICovXG4gIGZvY3VzKCkge1xuICAgIHRoaXMuZWxlbWVudC5mb2N1cygpO1xuICB9XG5cbiAgLyoqIEdldCB0aGUgbGFiZWwgZm9yIHRoaXMgZWxlbWVudCB3aGljaCBpcyByZXF1aXJlZCBieSB0aGUgRm9jdXNhYmxlT3B0aW9uIGludGVyZmFjZS4gKi9cbiAgZ2V0TGFiZWwoKSB7XG4gICAgcmV0dXJuICh0aGlzLnR5cGVhaGVhZExhYmVsID8/IHRoaXMuZWxlbWVudC50ZXh0Q29udGVudD8udHJpbSgpKSB8fCAnJztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIG9wdGlvbiBhcyBhY3RpdmUuXG4gICAqIEBkb2NzLXByaXZhdGVcbiAgICovXG4gIHNldEFjdGl2ZVN0eWxlcygpIHtcbiAgICB0aGlzLl9hY3RpdmUgPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgb3B0aW9uIGFzIGluYWN0aXZlLlxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICBzZXRJbmFjdGl2ZVN0eWxlcygpIHtcbiAgICB0aGlzLl9hY3RpdmUgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKiBIYW5kbGUgZm9jdXMgZXZlbnRzIG9uIHRoZSBvcHRpb24uICovXG4gIHByb3RlY3RlZCBfaGFuZGxlRm9jdXMoKSB7XG4gICAgLy8gT3B0aW9ucyBjYW4gd2luZCB1cCBnZXR0aW5nIGZvY3VzZWQgaW4gYWN0aXZlIGRlc2NlbmRhbnQgbW9kZSBpZiB0aGUgdXNlciBjbGlja3Mgb24gdGhlbS5cbiAgICAvLyBJbiB0aGlzIGNhc2UsIHdlIHB1c2ggZm9jdXMgYmFjayB0byB0aGUgcGFyZW50IGxpc3Rib3ggdG8gcHJldmVudCBhbiBleHRyYSB0YWIgc3RvcCB3aGVuXG4gICAgLy8gdGhlIHVzZXIgcGVyZm9ybXMgYSBzaGlmdCt0YWIuXG4gICAgaWYgKHRoaXMubGlzdGJveC51c2VBY3RpdmVEZXNjZW5kYW50KSB7XG4gICAgICB0aGlzLmxpc3Rib3guX3NldEFjdGl2ZU9wdGlvbih0aGlzKTtcbiAgICAgIHRoaXMubGlzdGJveC5mb2N1cygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBHZXQgdGhlIHRhYmluZGV4IGZvciB0aGlzIG9wdGlvbi4gKi9cbiAgcHJvdGVjdGVkIF9nZXRUYWJJbmRleCgpIHtcbiAgICBpZiAodGhpcy5saXN0Ym94LnVzZUFjdGl2ZURlc2NlbmRhbnQgfHwgdGhpcy5kaXNhYmxlZCkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5pc0FjdGl2ZSgpID8gdGhpcy5lbmFibGVkVGFiSW5kZXggOiAtMTtcbiAgfVxufVxuXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrTGlzdGJveF0nLFxuICBleHBvcnRBczogJ2Nka0xpc3Rib3gnLFxuICBob3N0OiB7XG4gICAgJ3JvbGUnOiAnbGlzdGJveCcsXG4gICAgJ2NsYXNzJzogJ2Nkay1saXN0Ym94JyxcbiAgICAnW2lkXSc6ICdpZCcsXG4gICAgJ1thdHRyLnRhYmluZGV4XSc6ICdfZ2V0VGFiSW5kZXgoKScsXG4gICAgJ1thdHRyLmFyaWEtZGlzYWJsZWRdJzogJ2Rpc2FibGVkJyxcbiAgICAnW2F0dHIuYXJpYS1tdWx0aXNlbGVjdGFibGVdJzogJ211bHRpcGxlJyxcbiAgICAnW2F0dHIuYXJpYS1hY3RpdmVkZXNjZW5kYW50XSc6ICdfZ2V0QXJpYUFjdGl2ZURlc2NlbmRhbnQoKScsXG4gICAgJ1thdHRyLmFyaWEtb3JpZW50YXRpb25dJzogJ29yaWVudGF0aW9uJyxcbiAgICAnKGZvY3VzKSc6ICdfaGFuZGxlRm9jdXMoKScsXG4gICAgJyhrZXlkb3duKSc6ICdfaGFuZGxlS2V5ZG93bigkZXZlbnQpJyxcbiAgICAnKGZvY3Vzb3V0KSc6ICdfaGFuZGxlRm9jdXNPdXQoJGV2ZW50KScsXG4gIH0sXG4gIHByb3ZpZGVyczogW1xuICAgIHtcbiAgICAgIHByb3ZpZGU6IE5HX1ZBTFVFX0FDQ0VTU09SLFxuICAgICAgdXNlRXhpc3Rpbmc6IGZvcndhcmRSZWYoKCkgPT4gQ2RrTGlzdGJveCksXG4gICAgICBtdWx0aTogdHJ1ZSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHByb3ZpZGU6IE5HX1ZBTElEQVRPUlMsXG4gICAgICB1c2VFeGlzdGluZzogZm9yd2FyZFJlZigoKSA9PiBDZGtMaXN0Ym94KSxcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgIH0sXG4gIF0sXG59KVxuZXhwb3J0IGNsYXNzIENka0xpc3Rib3g8VCA9IHVua25vd24+XG4gIGltcGxlbWVudHMgQWZ0ZXJDb250ZW50SW5pdCwgT25EZXN0cm95LCBDb250cm9sVmFsdWVBY2Nlc3NvciwgVmFsaWRhdG9yXG57XG4gIC8qKiBUaGUgaWQgb2YgdGhlIG9wdGlvbidzIGhvc3QgZWxlbWVudC4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGlkKCkge1xuICAgIHJldHVybiB0aGlzLl9pZCB8fCB0aGlzLl9nZW5lcmF0ZWRJZDtcbiAgfVxuICBzZXQgaWQodmFsdWUpIHtcbiAgICB0aGlzLl9pZCA9IHZhbHVlO1xuICB9XG4gIHByaXZhdGUgX2lkOiBzdHJpbmc7XG4gIHByaXZhdGUgX2dlbmVyYXRlZElkID0gYGNkay1saXN0Ym94LSR7bmV4dElkKyt9YDtcblxuICAvKiogVGhlIHRhYmluZGV4IHRvIHVzZSB3aGVuIHRoZSBsaXN0Ym94IGlzIGVuYWJsZWQuICovXG4gIEBJbnB1dCgndGFiaW5kZXgnKVxuICBnZXQgZW5hYmxlZFRhYkluZGV4KCkge1xuICAgIHJldHVybiB0aGlzLl9lbmFibGVkVGFiSW5kZXggPT09IHVuZGVmaW5lZCA/IDAgOiB0aGlzLl9lbmFibGVkVGFiSW5kZXg7XG4gIH1cbiAgc2V0IGVuYWJsZWRUYWJJbmRleCh2YWx1ZSkge1xuICAgIHRoaXMuX2VuYWJsZWRUYWJJbmRleCA9IHZhbHVlO1xuICB9XG4gIHByaXZhdGUgX2VuYWJsZWRUYWJJbmRleD86IG51bWJlciB8IG51bGw7XG5cbiAgLyoqIFRoZSB2YWx1ZSBzZWxlY3RlZCBpbiB0aGUgbGlzdGJveCwgcmVwcmVzZW50ZWQgYXMgYW4gYXJyYXkgb2Ygb3B0aW9uIHZhbHVlcy4gKi9cbiAgQElucHV0KCdjZGtMaXN0Ym94VmFsdWUnKVxuICBnZXQgdmFsdWUoKTogcmVhZG9ubHkgVFtdIHtcbiAgICByZXR1cm4gdGhpcy5faW52YWxpZCA/IFtdIDogdGhpcy5zZWxlY3Rpb25Nb2RlbC5zZWxlY3RlZDtcbiAgfVxuICBzZXQgdmFsdWUodmFsdWU6IHJlYWRvbmx5IFRbXSkge1xuICAgIHRoaXMuX3NldFNlbGVjdGlvbih2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0aGUgbGlzdGJveCBhbGxvd3MgbXVsdGlwbGUgb3B0aW9ucyB0byBiZSBzZWxlY3RlZC4gSWYgdGhlIHZhbHVlIHN3aXRjaGVzIGZyb20gYHRydWVgXG4gICAqIHRvIGBmYWxzZWAsIGFuZCBtb3JlIHRoYW4gb25lIG9wdGlvbiBpcyBzZWxlY3RlZCwgYWxsIG9wdGlvbnMgYXJlIGRlc2VsZWN0ZWQuXG4gICAqL1xuICBASW5wdXQoJ2Nka0xpc3Rib3hNdWx0aXBsZScpXG4gIGdldCBtdWx0aXBsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5zZWxlY3Rpb25Nb2RlbC5tdWx0aXBsZTtcbiAgfVxuICBzZXQgbXVsdGlwbGUodmFsdWU6IEJvb2xlYW5JbnB1dCkge1xuICAgIHRoaXMuc2VsZWN0aW9uTW9kZWwubXVsdGlwbGUgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICAgIHRoaXMuX3VwZGF0ZUludGVybmFsVmFsdWUoKTtcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIHRoZSBsaXN0Ym94IGlzIGRpc2FibGVkLiAqL1xuICBASW5wdXQoJ2Nka0xpc3Rib3hEaXNhYmxlZCcpXG4gIGdldCBkaXNhYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fZGlzYWJsZWQ7XG4gIH1cbiAgc2V0IGRpc2FibGVkKHZhbHVlOiBCb29sZWFuSW5wdXQpIHtcbiAgICB0aGlzLl9kaXNhYmxlZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gIH1cbiAgcHJpdmF0ZSBfZGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogV2hldGhlciB0aGUgbGlzdGJveCB3aWxsIHVzZSBhY3RpdmUgZGVzY2VuZGFudCBvciB3aWxsIG1vdmUgZm9jdXMgb250byB0aGUgb3B0aW9ucy4gKi9cbiAgQElucHV0KCdjZGtMaXN0Ym94VXNlQWN0aXZlRGVzY2VuZGFudCcpXG4gIGdldCB1c2VBY3RpdmVEZXNjZW5kYW50KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl91c2VBY3RpdmVEZXNjZW5kYW50O1xuICB9XG4gIHNldCB1c2VBY3RpdmVEZXNjZW5kYW50KHNob3VsZFVzZUFjdGl2ZURlc2NlbmRhbnQ6IEJvb2xlYW5JbnB1dCkge1xuICAgIHRoaXMuX3VzZUFjdGl2ZURlc2NlbmRhbnQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkoc2hvdWxkVXNlQWN0aXZlRGVzY2VuZGFudCk7XG4gIH1cbiAgcHJpdmF0ZSBfdXNlQWN0aXZlRGVzY2VuZGFudDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBUaGUgb3JpZW50YXRpb24gb2YgdGhlIGxpc3Rib3guIE9ubHkgYWZmZWN0cyBrZXlib2FyZCBpbnRlcmFjdGlvbiwgbm90IHZpc3VhbCBsYXlvdXQuICovXG4gIEBJbnB1dCgnY2RrTGlzdGJveE9yaWVudGF0aW9uJylcbiAgZ2V0IG9yaWVudGF0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9vcmllbnRhdGlvbjtcbiAgfVxuICBzZXQgb3JpZW50YXRpb24odmFsdWU6ICdob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCcpIHtcbiAgICB0aGlzLl9vcmllbnRhdGlvbiA9IHZhbHVlID09PSAnaG9yaXpvbnRhbCcgPyAnaG9yaXpvbnRhbCcgOiAndmVydGljYWwnO1xuICAgIGlmICh2YWx1ZSA9PT0gJ2hvcml6b250YWwnKSB7XG4gICAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyPy53aXRoSG9yaXpvbnRhbE9yaWVudGF0aW9uKHRoaXMuX2Rpcj8udmFsdWUgfHwgJ2x0cicpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyPy53aXRoVmVydGljYWxPcmllbnRhdGlvbigpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIF9vcmllbnRhdGlvbjogJ2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJyA9ICd2ZXJ0aWNhbCc7XG5cbiAgLyoqIFRoZSBmdW5jdGlvbiB1c2VkIHRvIGNvbXBhcmUgb3B0aW9uIHZhbHVlcy4gKi9cbiAgQElucHV0KCdjZGtMaXN0Ym94Q29tcGFyZVdpdGgnKVxuICBnZXQgY29tcGFyZVdpdGgoKTogdW5kZWZpbmVkIHwgKChvMTogVCwgbzI6IFQpID0+IGJvb2xlYW4pIHtcbiAgICByZXR1cm4gdGhpcy5zZWxlY3Rpb25Nb2RlbC5jb21wYXJlV2l0aDtcbiAgfVxuICBzZXQgY29tcGFyZVdpdGgoZm46IHVuZGVmaW5lZCB8ICgobzE6IFQsIG8yOiBUKSA9PiBib29sZWFuKSkge1xuICAgIHRoaXMuc2VsZWN0aW9uTW9kZWwuY29tcGFyZVdpdGggPSBmbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBrZXlib2FyZCBuYXZpZ2F0aW9uIHNob3VsZCB3cmFwIHdoZW4gdGhlIHVzZXIgcHJlc3NlcyBhcnJvdyBkb3duIG9uIHRoZSBsYXN0IGl0ZW1cbiAgICogb3IgYXJyb3cgdXAgb24gdGhlIGZpcnN0IGl0ZW0uXG4gICAqL1xuICBASW5wdXQoJ2Nka0xpc3Rib3hOYXZpZ2F0aW9uV3JhcERpc2FibGVkJylcbiAgZ2V0IG5hdmlnYXRpb25XcmFwRGlzYWJsZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX25hdmlnYXRpb25XcmFwRGlzYWJsZWQ7XG4gIH1cbiAgc2V0IG5hdmlnYXRpb25XcmFwRGlzYWJsZWQod3JhcDogQm9vbGVhbklucHV0KSB7XG4gICAgdGhpcy5fbmF2aWdhdGlvbldyYXBEaXNhYmxlZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh3cmFwKTtcbiAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyPy53aXRoV3JhcCghdGhpcy5fbmF2aWdhdGlvbldyYXBEaXNhYmxlZCk7XG4gIH1cbiAgcHJpdmF0ZSBfbmF2aWdhdGlvbldyYXBEaXNhYmxlZCA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIGtleWJvYXJkIG5hdmlnYXRpb24gc2hvdWxkIHNraXAgb3ZlciBkaXNhYmxlZCBpdGVtcy4gKi9cbiAgQElucHV0KCdjZGtMaXN0Ym94TmF2aWdhdGVzRGlzYWJsZWRPcHRpb25zJylcbiAgZ2V0IG5hdmlnYXRlRGlzYWJsZWRPcHRpb25zKCkge1xuICAgIHJldHVybiB0aGlzLl9uYXZpZ2F0ZURpc2FibGVkT3B0aW9ucztcbiAgfVxuICBzZXQgbmF2aWdhdGVEaXNhYmxlZE9wdGlvbnMoc2tpcDogQm9vbGVhbklucHV0KSB7XG4gICAgdGhpcy5fbmF2aWdhdGVEaXNhYmxlZE9wdGlvbnMgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkoc2tpcCk7XG4gICAgdGhpcy5saXN0S2V5TWFuYWdlcj8uc2tpcFByZWRpY2F0ZShcbiAgICAgIHRoaXMuX25hdmlnYXRlRGlzYWJsZWRPcHRpb25zID8gdGhpcy5fc2tpcE5vbmVQcmVkaWNhdGUgOiB0aGlzLl9za2lwRGlzYWJsZWRQcmVkaWNhdGUsXG4gICAgKTtcbiAgfVxuICBwcml2YXRlIF9uYXZpZ2F0ZURpc2FibGVkT3B0aW9ucyA9IGZhbHNlO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBzZWxlY3RlZCB2YWx1ZShzKSBpbiB0aGUgbGlzdGJveCBjaGFuZ2UuICovXG4gIEBPdXRwdXQoJ2Nka0xpc3Rib3hWYWx1ZUNoYW5nZScpIHJlYWRvbmx5IHZhbHVlQ2hhbmdlID0gbmV3IFN1YmplY3Q8TGlzdGJveFZhbHVlQ2hhbmdlRXZlbnQ8VD4+KCk7XG5cbiAgLyoqIFRoZSBjaGlsZCBvcHRpb25zIGluIHRoaXMgbGlzdGJveC4gKi9cbiAgQENvbnRlbnRDaGlsZHJlbihDZGtPcHRpb24sIHtkZXNjZW5kYW50czogdHJ1ZX0pIHByb3RlY3RlZCBvcHRpb25zOiBRdWVyeUxpc3Q8Q2RrT3B0aW9uPFQ+PjtcblxuICAvKiogVGhlIHNlbGVjdGlvbiBtb2RlbCB1c2VkIGJ5IHRoZSBsaXN0Ym94LiAqL1xuICBwcm90ZWN0ZWQgc2VsZWN0aW9uTW9kZWwgPSBuZXcgTGlzdGJveFNlbGVjdGlvbk1vZGVsPFQ+KCk7XG5cbiAgLyoqIFRoZSBrZXkgbWFuYWdlciB0aGF0IG1hbmFnZXMga2V5Ym9hcmQgbmF2aWdhdGlvbiBmb3IgdGhpcyBsaXN0Ym94LiAqL1xuICBwcm90ZWN0ZWQgbGlzdEtleU1hbmFnZXI6IEFjdGl2ZURlc2NlbmRhbnRLZXlNYW5hZ2VyPENka09wdGlvbjxUPj47XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIGxpc3Rib3ggaXMgZGVzdHJveWVkLiAqL1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgZGVzdHJveWVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogVGhlIGhvc3QgZWxlbWVudCBvZiB0aGUgbGlzdGJveC4gKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IGVsZW1lbnQ6IEhUTUxFbGVtZW50ID0gaW5qZWN0KEVsZW1lbnRSZWYpLm5hdGl2ZUVsZW1lbnQ7XG5cbiAgLyoqIFRoZSBjaGFuZ2UgZGV0ZWN0b3IgZm9yIHRoaXMgbGlzdGJveC4gKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IGNoYW5nZURldGVjdG9yUmVmID0gaW5qZWN0KENoYW5nZURldGVjdG9yUmVmKTtcblxuICAvKiogV2hldGhlciB0aGUgY3VycmVudGx5IHNlbGVjdGVkIHZhbHVlIGluIHRoZSBzZWxlY3Rpb24gbW9kZWwgaXMgaW52YWxpZC4gKi9cbiAgcHJpdmF0ZSBfaW52YWxpZCA9IGZhbHNlO1xuXG4gIC8qKiBUaGUgbGFzdCB1c2VyLXRyaWdnZXJlZCBvcHRpb24uICovXG4gIHByaXZhdGUgX2xhc3RUcmlnZ2VyZWQ6IENka09wdGlvbjxUPiB8IG51bGwgPSBudWxsO1xuXG4gIC8qKiBDYWxsYmFjayBjYWxsZWQgd2hlbiB0aGUgbGlzdGJveCBoYXMgYmVlbiB0b3VjaGVkICovXG4gIHByaXZhdGUgX29uVG91Y2hlZCA9ICgpID0+IHt9O1xuXG4gIC8qKiBDYWxsYmFjayBjYWxsZWQgd2hlbiB0aGUgbGlzdGJveCB2YWx1ZSBjaGFuZ2VzICovXG4gIHByaXZhdGUgX29uQ2hhbmdlOiAodmFsdWU6IHJlYWRvbmx5IFRbXSkgPT4gdm9pZCA9ICgpID0+IHt9O1xuXG4gIC8qKiBDYWxsYmFjayBjYWxsZWQgd2hlbiB0aGUgZm9ybSB2YWxpZGF0b3IgY2hhbmdlcy4gKi9cbiAgcHJpdmF0ZSBfb25WYWxpZGF0b3JDaGFuZ2UgPSAoKSA9PiB7fTtcblxuICAvKiogRW1pdHMgd2hlbiBhbiBvcHRpb24gaGFzIGJlZW4gY2xpY2tlZC4gKi9cbiAgcHJpdmF0ZSBfb3B0aW9uQ2xpY2tlZCA9IGRlZmVyKCgpID0+XG4gICAgKHRoaXMub3B0aW9ucy5jaGFuZ2VzIGFzIE9ic2VydmFibGU8Q2RrT3B0aW9uPFQ+W10+KS5waXBlKFxuICAgICAgc3RhcnRXaXRoKHRoaXMub3B0aW9ucyksXG4gICAgICBzd2l0Y2hNYXAob3B0aW9ucyA9PlxuICAgICAgICBtZXJnZSguLi5vcHRpb25zLm1hcChvcHRpb24gPT4gb3B0aW9uLl9jbGlja2VkLnBpcGUobWFwKGV2ZW50ID0+ICh7b3B0aW9uLCBldmVudH0pKSkpKSxcbiAgICAgICksXG4gICAgKSxcbiAgKTtcblxuICAvKiogVGhlIGRpcmVjdGlvbmFsaXR5IG9mIHRoZSBwYWdlLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9kaXIgPSBpbmplY3QoRGlyZWN0aW9uYWxpdHksIEluamVjdEZsYWdzLk9wdGlvbmFsKTtcblxuICAvKiogQSBwcmVkaWNhdGUgdGhhdCBza2lwcyBkaXNhYmxlZCBvcHRpb25zLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9za2lwRGlzYWJsZWRQcmVkaWNhdGUgPSAob3B0aW9uOiBDZGtPcHRpb248VD4pID0+IG9wdGlvbi5kaXNhYmxlZDtcblxuICAvKiogQSBwcmVkaWNhdGUgdGhhdCBkb2VzIG5vdCBza2lwIGFueSBvcHRpb25zLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9za2lwTm9uZVByZWRpY2F0ZSA9ICgpID0+IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBWYWxpZGF0b3IgdGhhdCBwcm9kdWNlcyBhbiBlcnJvciBpZiBtdWx0aXBsZSB2YWx1ZXMgYXJlIHNlbGVjdGVkIGluIGEgc2luZ2xlIHNlbGVjdGlvblxuICAgKiBsaXN0Ym94LlxuICAgKiBAcGFyYW0gY29udHJvbCBUaGUgY29udHJvbCB0byB2YWxpZGF0ZVxuICAgKiBAcmV0dXJuIEEgdmFsaWRhdGlvbiBlcnJvciBvciBudWxsXG4gICAqL1xuICBwcml2YXRlIF92YWxpZGF0ZVVuZXhwZWN0ZWRNdWx0aXBsZVZhbHVlczogVmFsaWRhdG9yRm4gPSAoY29udHJvbDogQWJzdHJhY3RDb250cm9sKSA9PiB7XG4gICAgY29uc3QgY29udHJvbFZhbHVlID0gdGhpcy5fY29lcmNlVmFsdWUoY29udHJvbC52YWx1ZSk7XG4gICAgaWYgKCF0aGlzLm11bHRpcGxlICYmIGNvbnRyb2xWYWx1ZS5sZW5ndGggPiAxKSB7XG4gICAgICByZXR1cm4geydjZGtMaXN0Ym94VW5leHBlY3RlZE11bHRpcGxlVmFsdWVzJzogdHJ1ZX07XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9O1xuXG4gIC8qKlxuICAgKiBWYWxpZGF0b3IgdGhhdCBwcm9kdWNlcyBhbiBlcnJvciBpZiBhbnkgc2VsZWN0ZWQgdmFsdWVzIGFyZSBub3QgdmFsaWQgb3B0aW9ucyBmb3IgdGhpcyBsaXN0Ym94LlxuICAgKiBAcGFyYW0gY29udHJvbCBUaGUgY29udHJvbCB0byB2YWxpZGF0ZVxuICAgKiBAcmV0dXJuIEEgdmFsaWRhdGlvbiBlcnJvciBvciBudWxsXG4gICAqL1xuICBwcml2YXRlIF92YWxpZGF0ZVVuZXhwZWN0ZWRPcHRpb25WYWx1ZXM6IFZhbGlkYXRvckZuID0gKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCkgPT4ge1xuICAgIGNvbnN0IGNvbnRyb2xWYWx1ZSA9IHRoaXMuX2NvZXJjZVZhbHVlKGNvbnRyb2wudmFsdWUpO1xuICAgIGNvbnN0IGludmFsaWRWYWx1ZXMgPSB0aGlzLl9nZXRJbnZhbGlkT3B0aW9uVmFsdWVzKGNvbnRyb2xWYWx1ZSk7XG4gICAgaWYgKGludmFsaWRWYWx1ZXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4geydjZGtMaXN0Ym94VW5leHBlY3RlZE9wdGlvblZhbHVlcyc6IHsndmFsdWVzJzogaW52YWxpZFZhbHVlc319O1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfTtcblxuICAvKiogVGhlIGNvbWJpbmVkIHNldCBvZiB2YWxpZGF0b3JzIGZvciB0aGlzIGxpc3Rib3guICovXG4gIHByaXZhdGUgX3ZhbGlkYXRvcnMgPSBWYWxpZGF0b3JzLmNvbXBvc2UoW1xuICAgIHRoaXMuX3ZhbGlkYXRlVW5leHBlY3RlZE11bHRpcGxlVmFsdWVzLFxuICAgIHRoaXMuX3ZhbGlkYXRlVW5leHBlY3RlZE9wdGlvblZhbHVlcyxcbiAgXSkhO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIC8vIFVwZGF0ZSB0aGUgaW50ZXJuYWwgdmFsdWUgd2hlbmV2ZXIgdGhlIHNlbGVjdGlvbiBtb2RlbCdzIHNlbGVjdGlvbiBjaGFuZ2VzLlxuICAgIHRoaXMuc2VsZWN0aW9uTW9kZWwuY2hhbmdlZC5waXBlKHN0YXJ0V2l0aChudWxsKSwgdGFrZVVudGlsKHRoaXMuZGVzdHJveWVkKSkuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIHRoaXMuX3VwZGF0ZUludGVybmFsVmFsdWUoKTtcbiAgICB9KTtcbiAgfVxuXG4gIG5nQWZ0ZXJDb250ZW50SW5pdCgpIHtcbiAgICBpZiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSB7XG4gICAgICB0aGlzLl92ZXJpZnlOb09wdGlvblZhbHVlQ29sbGlzaW9ucygpO1xuICAgIH1cblxuICAgIHRoaXMuX2luaXRLZXlNYW5hZ2VyKCk7XG5cbiAgICAvLyBVcGRhdGUgdGhlIGludGVybmFsIHZhbHVlIHdoZW5ldmVyIHRoZSBvcHRpb25zIGNoYW5nZSwgYXMgdGhpcyBtYXkgY2hhbmdlIHRoZSB2YWxpZGl0eSBvZlxuICAgIC8vIHRoZSBjdXJyZW50IHNlbGVjdGlvblxuICAgIHRoaXMub3B0aW9ucy5jaGFuZ2VzLnBpcGUoc3RhcnRXaXRoKHRoaXMub3B0aW9ucyksIHRha2VVbnRpbCh0aGlzLmRlc3Ryb3llZCkpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICB0aGlzLl91cGRhdGVJbnRlcm5hbFZhbHVlKCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLl9vcHRpb25DbGlja2VkXG4gICAgICAucGlwZShcbiAgICAgICAgZmlsdGVyKCh7b3B0aW9ufSkgPT4gIW9wdGlvbi5kaXNhYmxlZCksXG4gICAgICAgIHRha2VVbnRpbCh0aGlzLmRlc3Ryb3llZCksXG4gICAgICApXG4gICAgICAuc3Vic2NyaWJlKCh7b3B0aW9uLCBldmVudH0pID0+IHRoaXMuX2hhbmRsZU9wdGlvbkNsaWNrZWQob3B0aW9uLCBldmVudCkpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5saXN0S2V5TWFuYWdlci5jaGFuZ2UuY29tcGxldGUoKTtcbiAgICB0aGlzLmRlc3Ryb3llZC5uZXh0KCk7XG4gICAgdGhpcy5kZXN0cm95ZWQuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGUgdGhlIHNlbGVjdGVkIHN0YXRlIG9mIHRoZSBnaXZlbiBvcHRpb24uXG4gICAqIEBwYXJhbSBvcHRpb24gVGhlIG9wdGlvbiB0byB0b2dnbGVcbiAgICovXG4gIHRvZ2dsZShvcHRpb246IENka09wdGlvbjxUPikge1xuICAgIHRoaXMudG9nZ2xlVmFsdWUob3B0aW9uLnZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGUgdGhlIHNlbGVjdGVkIHN0YXRlIG9mIHRoZSBnaXZlbiB2YWx1ZS5cbiAgICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byB0b2dnbGVcbiAgICovXG4gIHRvZ2dsZVZhbHVlKHZhbHVlOiBUKSB7XG4gICAgaWYgKHRoaXMuX2ludmFsaWQpIHtcbiAgICAgIHRoaXMuc2VsZWN0aW9uTW9kZWwuY2xlYXIoZmFsc2UpO1xuICAgIH1cbiAgICB0aGlzLnNlbGVjdGlvbk1vZGVsLnRvZ2dsZSh2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogU2VsZWN0IHRoZSBnaXZlbiBvcHRpb24uXG4gICAqIEBwYXJhbSBvcHRpb24gVGhlIG9wdGlvbiB0byBzZWxlY3RcbiAgICovXG4gIHNlbGVjdChvcHRpb246IENka09wdGlvbjxUPikge1xuICAgIHRoaXMuc2VsZWN0VmFsdWUob3B0aW9uLnZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWxlY3QgdGhlIGdpdmVuIHZhbHVlLlxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlIHRvIHNlbGVjdFxuICAgKi9cbiAgc2VsZWN0VmFsdWUodmFsdWU6IFQpIHtcbiAgICBpZiAodGhpcy5faW52YWxpZCkge1xuICAgICAgdGhpcy5zZWxlY3Rpb25Nb2RlbC5jbGVhcihmYWxzZSk7XG4gICAgfVxuICAgIHRoaXMuc2VsZWN0aW9uTW9kZWwuc2VsZWN0KHZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXNlbGVjdCB0aGUgZ2l2ZW4gb3B0aW9uLlxuICAgKiBAcGFyYW0gb3B0aW9uIFRoZSBvcHRpb24gdG8gZGVzZWxlY3RcbiAgICovXG4gIGRlc2VsZWN0KG9wdGlvbjogQ2RrT3B0aW9uPFQ+KSB7XG4gICAgdGhpcy5kZXNlbGVjdFZhbHVlKG9wdGlvbi52YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzZWxlY3QgdGhlIGdpdmVuIHZhbHVlLlxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlIHRvIGRlc2VsZWN0XG4gICAqL1xuICBkZXNlbGVjdFZhbHVlKHZhbHVlOiBUKSB7XG4gICAgaWYgKHRoaXMuX2ludmFsaWQpIHtcbiAgICAgIHRoaXMuc2VsZWN0aW9uTW9kZWwuY2xlYXIoZmFsc2UpO1xuICAgIH1cbiAgICB0aGlzLnNlbGVjdGlvbk1vZGVsLmRlc2VsZWN0KHZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIHNlbGVjdGVkIHN0YXRlIG9mIGFsbCBvcHRpb25zLlxuICAgKiBAcGFyYW0gaXNTZWxlY3RlZCBUaGUgbmV3IHNlbGVjdGVkIHN0YXRlIHRvIHNldFxuICAgKi9cbiAgc2V0QWxsU2VsZWN0ZWQoaXNTZWxlY3RlZDogYm9vbGVhbikge1xuICAgIGlmICghaXNTZWxlY3RlZCkge1xuICAgICAgdGhpcy5zZWxlY3Rpb25Nb2RlbC5jbGVhcigpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5faW52YWxpZCkge1xuICAgICAgICB0aGlzLnNlbGVjdGlvbk1vZGVsLmNsZWFyKGZhbHNlKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2VsZWN0aW9uTW9kZWwuc2VsZWN0KC4uLnRoaXMub3B0aW9ucy5tYXAob3B0aW9uID0+IG9wdGlvbi52YWx1ZSkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgd2hldGhlciB0aGUgZ2l2ZW4gb3B0aW9uIGlzIHNlbGVjdGVkLlxuICAgKiBAcGFyYW0gb3B0aW9uIFRoZSBvcHRpb24gdG8gZ2V0IHRoZSBzZWxlY3RlZCBzdGF0ZSBvZlxuICAgKi9cbiAgaXNTZWxlY3RlZChvcHRpb246IENka09wdGlvbjxUPikge1xuICAgIHJldHVybiB0aGlzLmlzVmFsdWVTZWxlY3RlZChvcHRpb24udmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB3aGV0aGVyIHRoZSBnaXZlbiB2YWx1ZSBpcyBzZWxlY3RlZC5cbiAgICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBnZXQgdGhlIHNlbGVjdGVkIHN0YXRlIG9mXG4gICAqL1xuICBpc1ZhbHVlU2VsZWN0ZWQodmFsdWU6IFQpIHtcbiAgICBpZiAodGhpcy5faW52YWxpZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5zZWxlY3Rpb25Nb2RlbC5pc1NlbGVjdGVkKHZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgYSBjYWxsYmFjayB0byBiZSBpbnZva2VkIHdoZW4gdGhlIGxpc3Rib3gncyB2YWx1ZSBjaGFuZ2VzIGZyb20gdXNlciBpbnB1dC5cbiAgICogQHBhcmFtIGZuIFRoZSBjYWxsYmFjayB0byByZWdpc3RlclxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICByZWdpc3Rlck9uQ2hhbmdlKGZuOiAodmFsdWU6IHJlYWRvbmx5IFRbXSkgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMuX29uQ2hhbmdlID0gZm47XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGEgY2FsbGJhY2sgdG8gYmUgaW52b2tlZCB3aGVuIHRoZSBsaXN0Ym94IGlzIGJsdXJyZWQgYnkgdGhlIHVzZXIuXG4gICAqIEBwYXJhbSBmbiBUaGUgY2FsbGJhY2sgdG8gcmVnaXN0ZXJcbiAgICogQGRvY3MtcHJpdmF0ZVxuICAgKi9cbiAgcmVnaXN0ZXJPblRvdWNoZWQoZm46ICgpID0+IHt9KTogdm9pZCB7XG4gICAgdGhpcy5fb25Ub3VjaGVkID0gZm47XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbGlzdGJveCdzIHZhbHVlLlxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIG5ldyB2YWx1ZSBvZiB0aGUgbGlzdGJveFxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICB3cml0ZVZhbHVlKHZhbHVlOiByZWFkb25seSBUW10pOiB2b2lkIHtcbiAgICB0aGlzLl9zZXRTZWxlY3Rpb24odmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGRpc2FibGVkIHN0YXRlIG9mIHRoZSBsaXN0Ym94LlxuICAgKiBAcGFyYW0gaXNEaXNhYmxlZCBUaGUgbmV3IGRpc2FibGVkIHN0YXRlXG4gICAqIEBkb2NzLXByaXZhdGVcbiAgICovXG4gIHNldERpc2FibGVkU3RhdGUoaXNEaXNhYmxlZDogYm9vbGVhbik6IHZvaWQge1xuICAgIHRoaXMuZGlzYWJsZWQgPSBpc0Rpc2FibGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIHRoZSBnaXZlbiBjb250cm9sXG4gICAqIEBkb2NzLXByaXZhdGVcbiAgICovXG4gIHZhbGlkYXRlKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbDxhbnksIGFueT4pOiBWYWxpZGF0aW9uRXJyb3JzIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX3ZhbGlkYXRvcnMoY29udHJvbCk7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGEgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGZvcm0gdmFsaWRhdG9yIGNoYW5nZXMuXG4gICAqIEBwYXJhbSBmbiBUaGUgY2FsbGJhY2sgdG8gY2FsbFxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICByZWdpc3Rlck9uVmFsaWRhdG9yQ2hhbmdlKGZuOiAoKSA9PiB2b2lkKSB7XG4gICAgdGhpcy5fb25WYWxpZGF0b3JDaGFuZ2UgPSBmbjtcbiAgfVxuXG4gIC8qKiBGb2N1cyB0aGUgbGlzdGJveCdzIGhvc3QgZWxlbWVudC4gKi9cbiAgZm9jdXMoKSB7XG4gICAgdGhpcy5lbGVtZW50LmZvY3VzKCk7XG4gIH1cblxuICAvKipcbiAgICogVHJpZ2dlcnMgdGhlIGdpdmVuIG9wdGlvbiBpbiByZXNwb25zZSB0byB1c2VyIGludGVyYWN0aW9uLlxuICAgKiAtIEluIHNpbmdsZSBzZWxlY3Rpb24gbW9kZTogc2VsZWN0cyB0aGUgb3B0aW9uIGFuZCBkZXNlbGVjdHMgYW55IG90aGVyIHNlbGVjdGVkIG9wdGlvbi5cbiAgICogLSBJbiBtdWx0aSBzZWxlY3Rpb24gbW9kZTogdG9nZ2xlcyB0aGUgc2VsZWN0ZWQgc3RhdGUgb2YgdGhlIG9wdGlvbi5cbiAgICogQHBhcmFtIG9wdGlvbiBUaGUgb3B0aW9uIHRvIHRyaWdnZXJcbiAgICovXG4gIHByb3RlY3RlZCB0cmlnZ2VyT3B0aW9uKG9wdGlvbjogQ2RrT3B0aW9uPFQ+IHwgbnVsbCkge1xuICAgIGlmIChvcHRpb24gJiYgIW9wdGlvbi5kaXNhYmxlZCkge1xuICAgICAgdGhpcy5fbGFzdFRyaWdnZXJlZCA9IG9wdGlvbjtcbiAgICAgIGNvbnN0IGNoYW5nZWQgPSB0aGlzLm11bHRpcGxlXG4gICAgICAgID8gdGhpcy5zZWxlY3Rpb25Nb2RlbC50b2dnbGUob3B0aW9uLnZhbHVlKVxuICAgICAgICA6IHRoaXMuc2VsZWN0aW9uTW9kZWwuc2VsZWN0KG9wdGlvbi52YWx1ZSk7XG4gICAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgICB0aGlzLl9vbkNoYW5nZSh0aGlzLnZhbHVlKTtcbiAgICAgICAgdGhpcy52YWx1ZUNoYW5nZS5uZXh0KHtcbiAgICAgICAgICB2YWx1ZTogdGhpcy52YWx1ZSxcbiAgICAgICAgICBsaXN0Ym94OiB0aGlzLFxuICAgICAgICAgIG9wdGlvbjogb3B0aW9uLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVHJpZ2dlciB0aGUgZ2l2ZW4gcmFuZ2Ugb2Ygb3B0aW9ucyBpbiByZXNwb25zZSB0byB1c2VyIGludGVyYWN0aW9uLlxuICAgKiBTaG91bGQgb25seSBiZSBjYWxsZWQgaW4gbXVsdGktc2VsZWN0aW9uIG1vZGUuXG4gICAqIEBwYXJhbSB0cmlnZ2VyIFRoZSBvcHRpb24gdGhhdCB3YXMgdHJpZ2dlcmVkXG4gICAqIEBwYXJhbSBmcm9tIFRoZSBzdGFydCBpbmRleCBvZiB0aGUgb3B0aW9ucyB0byB0b2dnbGVcbiAgICogQHBhcmFtIHRvIFRoZSBlbmQgaW5kZXggb2YgdGhlIG9wdGlvbnMgdG8gdG9nZ2xlXG4gICAqIEBwYXJhbSBvbiBXaGV0aGVyIHRvIHRvZ2dsZSB0aGUgb3B0aW9uIHJhbmdlIG9uXG4gICAqL1xuICBwcm90ZWN0ZWQgdHJpZ2dlclJhbmdlKHRyaWdnZXI6IENka09wdGlvbjxUPiB8IG51bGwsIGZyb206IG51bWJlciwgdG86IG51bWJlciwgb246IGJvb2xlYW4pIHtcbiAgICBpZiAodGhpcy5kaXNhYmxlZCB8fCAodHJpZ2dlciAmJiB0cmlnZ2VyLmRpc2FibGVkKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9sYXN0VHJpZ2dlcmVkID0gdHJpZ2dlcjtcbiAgICBjb25zdCBpc0VxdWFsID0gdGhpcy5jb21wYXJlV2l0aCA/PyBPYmplY3QuaXM7XG4gICAgY29uc3QgdXBkYXRlVmFsdWVzID0gWy4uLnRoaXMub3B0aW9uc11cbiAgICAgIC5zbGljZShNYXRoLm1heCgwLCBNYXRoLm1pbihmcm9tLCB0bykpLCBNYXRoLm1pbih0aGlzLm9wdGlvbnMubGVuZ3RoLCBNYXRoLm1heChmcm9tLCB0bykgKyAxKSlcbiAgICAgIC5maWx0ZXIob3B0aW9uID0+ICFvcHRpb24uZGlzYWJsZWQpXG4gICAgICAubWFwKG9wdGlvbiA9PiBvcHRpb24udmFsdWUpO1xuICAgIGNvbnN0IHNlbGVjdGVkID0gWy4uLnRoaXMudmFsdWVdO1xuICAgIGZvciAoY29uc3QgdXBkYXRlVmFsdWUgb2YgdXBkYXRlVmFsdWVzKSB7XG4gICAgICBjb25zdCBzZWxlY3RlZEluZGV4ID0gc2VsZWN0ZWQuZmluZEluZGV4KHNlbGVjdGVkVmFsdWUgPT5cbiAgICAgICAgaXNFcXVhbChzZWxlY3RlZFZhbHVlLCB1cGRhdGVWYWx1ZSksXG4gICAgICApO1xuICAgICAgaWYgKG9uICYmIHNlbGVjdGVkSW5kZXggPT09IC0xKSB7XG4gICAgICAgIHNlbGVjdGVkLnB1c2godXBkYXRlVmFsdWUpO1xuICAgICAgfSBlbHNlIGlmICghb24gJiYgc2VsZWN0ZWRJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgc2VsZWN0ZWQuc3BsaWNlKHNlbGVjdGVkSW5kZXgsIDEpO1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgY2hhbmdlZCA9IHRoaXMuc2VsZWN0aW9uTW9kZWwuc2V0U2VsZWN0aW9uKC4uLnNlbGVjdGVkKTtcbiAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgdGhpcy5fb25DaGFuZ2UodGhpcy52YWx1ZSk7XG4gICAgICB0aGlzLnZhbHVlQ2hhbmdlLm5leHQoe1xuICAgICAgICB2YWx1ZTogdGhpcy52YWx1ZSxcbiAgICAgICAgbGlzdGJveDogdGhpcyxcbiAgICAgICAgb3B0aW9uOiB0cmlnZ2VyLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGdpdmVuIG9wdGlvbiBhcyBhY3RpdmUuXG4gICAqIEBwYXJhbSBvcHRpb24gVGhlIG9wdGlvbiB0byBtYWtlIGFjdGl2ZVxuICAgKi9cbiAgX3NldEFjdGl2ZU9wdGlvbihvcHRpb246IENka09wdGlvbjxUPikge1xuICAgIHRoaXMubGlzdEtleU1hbmFnZXIuc2V0QWN0aXZlSXRlbShvcHRpb24pO1xuICB9XG5cbiAgLyoqIENhbGxlZCB3aGVuIHRoZSBsaXN0Ym94IHJlY2VpdmVzIGZvY3VzLiAqL1xuICBwcm90ZWN0ZWQgX2hhbmRsZUZvY3VzKCkge1xuICAgIGlmICghdGhpcy51c2VBY3RpdmVEZXNjZW5kYW50KSB7XG4gICAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyLnNldE5leHRJdGVtQWN0aXZlKCk7XG4gICAgICB0aGlzLl9mb2N1c0FjdGl2ZU9wdGlvbigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDYWxsZWQgd2hlbiB0aGUgdXNlciBwcmVzc2VzIGtleWRvd24gb24gdGhlIGxpc3Rib3guICovXG4gIHByb3RlY3RlZCBfaGFuZGxlS2V5ZG93bihldmVudDogS2V5Ym9hcmRFdmVudCkge1xuICAgIGlmICh0aGlzLl9kaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHtrZXlDb2RlfSA9IGV2ZW50O1xuICAgIGNvbnN0IHByZXZpb3VzQWN0aXZlSW5kZXggPSB0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleDtcbiAgICBjb25zdCBjdHJsS2V5cyA9IFsnY3RybEtleScsICdtZXRhS2V5J10gYXMgY29uc3Q7XG5cbiAgICBpZiAodGhpcy5tdWx0aXBsZSAmJiBrZXlDb2RlID09PSBBICYmIGhhc01vZGlmaWVyS2V5KGV2ZW50LCAuLi5jdHJsS2V5cykpIHtcbiAgICAgIC8vIFRvZ2dsZSBhbGwgb3B0aW9ucyBvZmYgaWYgdGhleSdyZSBhbGwgc2VsZWN0ZWQsIG90aGVyd2lzZSB0b2dnbGUgdGhlbSBhbGwgb24uXG4gICAgICB0aGlzLnRyaWdnZXJSYW5nZShcbiAgICAgICAgbnVsbCxcbiAgICAgICAgMCxcbiAgICAgICAgdGhpcy5vcHRpb25zLmxlbmd0aCAtIDEsXG4gICAgICAgIHRoaXMub3B0aW9ucy5sZW5ndGggIT09IHRoaXMudmFsdWUubGVuZ3RoLFxuICAgICAgKTtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgdGhpcy5tdWx0aXBsZSAmJlxuICAgICAgKGtleUNvZGUgPT09IFNQQUNFIHx8IGtleUNvZGUgPT09IEVOVEVSKSAmJlxuICAgICAgaGFzTW9kaWZpZXJLZXkoZXZlbnQsICdzaGlmdEtleScpXG4gICAgKSB7XG4gICAgICBpZiAodGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtICYmIHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbUluZGV4ICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy50cmlnZ2VyUmFuZ2UoXG4gICAgICAgICAgdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtLFxuICAgICAgICAgIHRoaXMuX2dldExhc3RUcmlnZ2VyZWRJbmRleCgpID8/IHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbUluZGV4LFxuICAgICAgICAgIHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbUluZGV4LFxuICAgICAgICAgICF0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW0uaXNTZWxlY3RlZCgpLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICB0aGlzLm11bHRpcGxlICYmXG4gICAgICBrZXlDb2RlID09PSBIT01FICYmXG4gICAgICBoYXNNb2RpZmllcktleShldmVudCwgLi4uY3RybEtleXMpICYmXG4gICAgICBoYXNNb2RpZmllcktleShldmVudCwgJ3NoaWZ0S2V5JylcbiAgICApIHtcbiAgICAgIGNvbnN0IHRyaWdnZXIgPSB0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW07XG4gICAgICBpZiAodHJpZ2dlcikge1xuICAgICAgICBjb25zdCBmcm9tID0gdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtSW5kZXghO1xuICAgICAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyLnNldEZpcnN0SXRlbUFjdGl2ZSgpO1xuICAgICAgICB0aGlzLnRyaWdnZXJSYW5nZShcbiAgICAgICAgICB0cmlnZ2VyLFxuICAgICAgICAgIGZyb20sXG4gICAgICAgICAgdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtSW5kZXghLFxuICAgICAgICAgICF0cmlnZ2VyLmlzU2VsZWN0ZWQoKSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgdGhpcy5tdWx0aXBsZSAmJlxuICAgICAga2V5Q29kZSA9PT0gRU5EICYmXG4gICAgICBoYXNNb2RpZmllcktleShldmVudCwgLi4uY3RybEtleXMpICYmXG4gICAgICBoYXNNb2RpZmllcktleShldmVudCwgJ3NoaWZ0S2V5JylcbiAgICApIHtcbiAgICAgIGNvbnN0IHRyaWdnZXIgPSB0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW07XG4gICAgICBpZiAodHJpZ2dlcikge1xuICAgICAgICBjb25zdCBmcm9tID0gdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtSW5kZXghO1xuICAgICAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyLnNldExhc3RJdGVtQWN0aXZlKCk7XG4gICAgICAgIHRoaXMudHJpZ2dlclJhbmdlKFxuICAgICAgICAgIHRyaWdnZXIsXG4gICAgICAgICAgZnJvbSxcbiAgICAgICAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleCEsXG4gICAgICAgICAgIXRyaWdnZXIuaXNTZWxlY3RlZCgpLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoa2V5Q29kZSA9PT0gU1BBQ0UgfHwga2V5Q29kZSA9PT0gRU5URVIpIHtcbiAgICAgIHRoaXMudHJpZ2dlck9wdGlvbih0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW0pO1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBpc05hdktleSA9XG4gICAgICBrZXlDb2RlID09PSBVUF9BUlJPVyB8fFxuICAgICAga2V5Q29kZSA9PT0gRE9XTl9BUlJPVyB8fFxuICAgICAga2V5Q29kZSA9PT0gTEVGVF9BUlJPVyB8fFxuICAgICAga2V5Q29kZSA9PT0gUklHSFRfQVJST1cgfHxcbiAgICAgIGtleUNvZGUgPT09IEhPTUUgfHxcbiAgICAgIGtleUNvZGUgPT09IEVORDtcbiAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyLm9uS2V5ZG93bihldmVudCk7XG4gICAgLy8gV2lsbCBzZWxlY3QgYW4gb3B0aW9uIGlmIHNoaWZ0IHdhcyBwcmVzc2VkIHdoaWxlIG5hdmlnYXRpbmcgdG8gdGhlIG9wdGlvblxuICAgIGlmIChpc05hdktleSAmJiBldmVudC5zaGlmdEtleSAmJiBwcmV2aW91c0FjdGl2ZUluZGV4ICE9PSB0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleCkge1xuICAgICAgdGhpcy50cmlnZ2VyT3B0aW9uKHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCB3aGVuIHRoZSBmb2N1cyBsZWF2ZXMgYW4gZWxlbWVudCBpbiB0aGUgbGlzdGJveC5cbiAgICogQHBhcmFtIGV2ZW50IFRoZSBmb2N1c291dCBldmVudFxuICAgKi9cbiAgcHJvdGVjdGVkIF9oYW5kbGVGb2N1c091dChldmVudDogRm9jdXNFdmVudCkge1xuICAgIGNvbnN0IG90aGVyRWxlbWVudCA9IGV2ZW50LnJlbGF0ZWRUYXJnZXQgYXMgRWxlbWVudDtcbiAgICBpZiAodGhpcy5lbGVtZW50ICE9PSBvdGhlckVsZW1lbnQgJiYgIXRoaXMuZWxlbWVudC5jb250YWlucyhvdGhlckVsZW1lbnQpKSB7XG4gICAgICB0aGlzLl9vblRvdWNoZWQoKTtcbiAgICB9XG4gIH1cblxuICAvKiogR2V0IHRoZSBpZCBvZiB0aGUgYWN0aXZlIG9wdGlvbiBpZiBhY3RpdmUgZGVzY2VuZGFudCBpcyBiZWluZyB1c2VkLiAqL1xuICBwcm90ZWN0ZWQgX2dldEFyaWFBY3RpdmVEZXNjZW5kYW50KCk6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl91c2VBY3RpdmVEZXNjZW5kYW50ID8gdGhpcy5saXN0S2V5TWFuYWdlcj8uYWN0aXZlSXRlbT8uaWQgOiBudWxsO1xuICB9XG5cbiAgLyoqIEdldCB0aGUgdGFiaW5kZXggZm9yIHRoZSBsaXN0Ym94LiAqL1xuICBwcm90ZWN0ZWQgX2dldFRhYkluZGV4KCkge1xuICAgIGlmICh0aGlzLmRpc2FibGVkKSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnVzZUFjdGl2ZURlc2NlbmRhbnQgfHwgIXRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbSA/IHRoaXMuZW5hYmxlZFRhYkluZGV4IDogLTE7XG4gIH1cblxuICAvKiogSW5pdGlhbGl6ZSB0aGUga2V5IG1hbmFnZXIuICovXG4gIHByaXZhdGUgX2luaXRLZXlNYW5hZ2VyKCkge1xuICAgIHRoaXMubGlzdEtleU1hbmFnZXIgPSBuZXcgQWN0aXZlRGVzY2VuZGFudEtleU1hbmFnZXIodGhpcy5vcHRpb25zKVxuICAgICAgLndpdGhXcmFwKCF0aGlzLl9uYXZpZ2F0aW9uV3JhcERpc2FibGVkKVxuICAgICAgLndpdGhUeXBlQWhlYWQoKVxuICAgICAgLndpdGhIb21lQW5kRW5kKClcbiAgICAgIC53aXRoQWxsb3dlZE1vZGlmaWVyS2V5cyhbJ3NoaWZ0S2V5J10pXG4gICAgICAuc2tpcFByZWRpY2F0ZShcbiAgICAgICAgdGhpcy5fbmF2aWdhdGVEaXNhYmxlZE9wdGlvbnMgPyB0aGlzLl9za2lwTm9uZVByZWRpY2F0ZSA6IHRoaXMuX3NraXBEaXNhYmxlZFByZWRpY2F0ZSxcbiAgICAgICk7XG5cbiAgICBpZiAodGhpcy5vcmllbnRhdGlvbiA9PT0gJ3ZlcnRpY2FsJykge1xuICAgICAgdGhpcy5saXN0S2V5TWFuYWdlci53aXRoVmVydGljYWxPcmllbnRhdGlvbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyLndpdGhIb3Jpem9udGFsT3JpZW50YXRpb24odGhpcy5fZGlyPy52YWx1ZSB8fCAnbHRyJyk7XG4gICAgfVxuXG4gICAgdGhpcy5saXN0S2V5TWFuYWdlci5jaGFuZ2VcbiAgICAgIC5waXBlKHRha2VVbnRpbCh0aGlzLmRlc3Ryb3llZCkpXG4gICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMuX2ZvY3VzQWN0aXZlT3B0aW9uKCkpO1xuICB9XG5cbiAgLyoqIEZvY3VzIHRoZSBhY3RpdmUgb3B0aW9uLiAqL1xuICBwcml2YXRlIF9mb2N1c0FjdGl2ZU9wdGlvbigpIHtcbiAgICBpZiAoIXRoaXMudXNlQWN0aXZlRGVzY2VuZGFudCkge1xuICAgICAgdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtPy5mb2N1cygpO1xuICAgIH1cbiAgICB0aGlzLmNoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgc2VsZWN0ZWQgdmFsdWVzLlxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIGxpc3Qgb2YgbmV3IHNlbGVjdGVkIHZhbHVlcy5cbiAgICovXG4gIHByaXZhdGUgX3NldFNlbGVjdGlvbih2YWx1ZTogcmVhZG9ubHkgVFtdKSB7XG4gICAgaWYgKHRoaXMuX2ludmFsaWQpIHtcbiAgICAgIHRoaXMuc2VsZWN0aW9uTW9kZWwuY2xlYXIoZmFsc2UpO1xuICAgIH1cbiAgICB0aGlzLnNlbGVjdGlvbk1vZGVsLnNldFNlbGVjdGlvbiguLi50aGlzLl9jb2VyY2VWYWx1ZSh2YWx1ZSkpO1xuICB9XG5cbiAgLyoqIFVwZGF0ZSB0aGUgaW50ZXJuYWwgdmFsdWUgb2YgdGhlIGxpc3Rib3ggYmFzZWQgb24gdGhlIHNlbGVjdGlvbiBtb2RlbC4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlSW50ZXJuYWxWYWx1ZSgpIHtcbiAgICBjb25zdCBpbmRleENhY2hlID0gbmV3IE1hcDxULCBudW1iZXI+KCk7XG4gICAgdGhpcy5zZWxlY3Rpb25Nb2RlbC5zb3J0KChhOiBULCBiOiBUKSA9PiB7XG4gICAgICBjb25zdCBhSW5kZXggPSB0aGlzLl9nZXRJbmRleEZvclZhbHVlKGluZGV4Q2FjaGUsIGEpO1xuICAgICAgY29uc3QgYkluZGV4ID0gdGhpcy5fZ2V0SW5kZXhGb3JWYWx1ZShpbmRleENhY2hlLCBiKTtcbiAgICAgIHJldHVybiBhSW5kZXggLSBiSW5kZXg7XG4gICAgfSk7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGlvbk1vZGVsLnNlbGVjdGVkO1xuICAgIHRoaXMuX2ludmFsaWQgPVxuICAgICAgKCF0aGlzLm11bHRpcGxlICYmIHNlbGVjdGVkLmxlbmd0aCA+IDEpIHx8ICEhdGhpcy5fZ2V0SW52YWxpZE9wdGlvblZhbHVlcyhzZWxlY3RlZCkubGVuZ3RoO1xuICAgIHRoaXMuX29uVmFsaWRhdG9yQ2hhbmdlKCk7XG4gICAgdGhpcy5jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpbmRleCBvZiB0aGUgZ2l2ZW4gdmFsdWUgaW4gdGhlIGdpdmVuIGxpc3Qgb2Ygb3B0aW9ucy5cbiAgICogQHBhcmFtIGNhY2hlIFRoZSBjYWNoZSBvZiBpbmRpY2VzIGZvdW5kIHNvIGZhclxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlIHRvIGZpbmRcbiAgICogQHJldHVybiBUaGUgaW5kZXggb2YgdGhlIHZhbHVlIGluIHRoZSBvcHRpb25zIGxpc3RcbiAgICovXG4gIHByaXZhdGUgX2dldEluZGV4Rm9yVmFsdWUoY2FjaGU6IE1hcDxULCBudW1iZXI+LCB2YWx1ZTogVCkge1xuICAgIGNvbnN0IGlzRXF1YWwgPSB0aGlzLmNvbXBhcmVXaXRoIHx8IE9iamVjdC5pcztcbiAgICBpZiAoIWNhY2hlLmhhcyh2YWx1ZSkpIHtcbiAgICAgIGxldCBpbmRleCA9IC0xO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm9wdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGlzRXF1YWwodmFsdWUsIHRoaXMub3B0aW9ucy5nZXQoaSkhLnZhbHVlKSkge1xuICAgICAgICAgIGluZGV4ID0gaTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY2FjaGUuc2V0KHZhbHVlLCBpbmRleCk7XG4gICAgfVxuICAgIHJldHVybiBjYWNoZS5nZXQodmFsdWUpITtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGUgdGhlIHVzZXIgY2xpY2tpbmcgYW4gb3B0aW9uLlxuICAgKiBAcGFyYW0gb3B0aW9uIFRoZSBvcHRpb24gdGhhdCB3YXMgY2xpY2tlZC5cbiAgICovXG4gIHByaXZhdGUgX2hhbmRsZU9wdGlvbkNsaWNrZWQob3B0aW9uOiBDZGtPcHRpb248VD4sIGV2ZW50OiBNb3VzZUV2ZW50KSB7XG4gICAgdGhpcy5saXN0S2V5TWFuYWdlci5zZXRBY3RpdmVJdGVtKG9wdGlvbik7XG4gICAgaWYgKGV2ZW50LnNoaWZ0S2V5ICYmIHRoaXMubXVsdGlwbGUpIHtcbiAgICAgIHRoaXMudHJpZ2dlclJhbmdlKFxuICAgICAgICBvcHRpb24sXG4gICAgICAgIHRoaXMuX2dldExhc3RUcmlnZ2VyZWRJbmRleCgpID8/IHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbUluZGV4ISxcbiAgICAgICAgdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtSW5kZXghLFxuICAgICAgICAhb3B0aW9uLmlzU2VsZWN0ZWQoKSxcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudHJpZ2dlck9wdGlvbihvcHRpb24pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBWZXJpZmllcyB0aGF0IG5vIHR3byBvcHRpb25zIHJlcHJlc2VudCB0aGUgc2FtZSB2YWx1ZSB1bmRlciB0aGUgY29tcGFyZVdpdGggZnVuY3Rpb24uICovXG4gIHByaXZhdGUgX3ZlcmlmeU5vT3B0aW9uVmFsdWVDb2xsaXNpb25zKCkge1xuICAgIHRoaXMub3B0aW9ucy5jaGFuZ2VzLnBpcGUoc3RhcnRXaXRoKHRoaXMub3B0aW9ucyksIHRha2VVbnRpbCh0aGlzLmRlc3Ryb3llZCkpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICBjb25zdCBpc0VxdWFsID0gdGhpcy5jb21wYXJlV2l0aCA/PyBPYmplY3QuaXM7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMub3B0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBvcHRpb24gPSB0aGlzLm9wdGlvbnMuZ2V0KGkpITtcbiAgICAgICAgbGV0IGR1cGxpY2F0ZTogQ2RrT3B0aW9uPFQ+IHwgbnVsbCA9IG51bGw7XG4gICAgICAgIGZvciAobGV0IGogPSBpICsgMTsgaiA8IHRoaXMub3B0aW9ucy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGNvbnN0IG90aGVyID0gdGhpcy5vcHRpb25zLmdldChqKSE7XG4gICAgICAgICAgaWYgKGlzRXF1YWwob3B0aW9uLnZhbHVlLCBvdGhlci52YWx1ZSkpIHtcbiAgICAgICAgICAgIGR1cGxpY2F0ZSA9IG90aGVyO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChkdXBsaWNhdGUpIHtcbiAgICAgICAgICAvLyBUT0RPKG1tYWxlcmJhKTogTGluayB0byBkb2NzIGFib3V0IHRoaXMuXG4gICAgICAgICAgaWYgKHRoaXMuY29tcGFyZVdpdGgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAgICAgYEZvdW5kIG11bHRpcGxlIENka09wdGlvbiByZXByZXNlbnRpbmcgdGhlIHNhbWUgdmFsdWUgdW5kZXIgdGhlIGdpdmVuIGNvbXBhcmVXaXRoIGZ1bmN0aW9uYCxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG9wdGlvbjE6IG9wdGlvbi5lbGVtZW50LFxuICAgICAgICAgICAgICAgIG9wdGlvbjI6IGR1cGxpY2F0ZS5lbGVtZW50LFxuICAgICAgICAgICAgICAgIGNvbXBhcmVXaXRoOiB0aGlzLmNvbXBhcmVXaXRoLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBGb3VuZCBtdWx0aXBsZSBDZGtPcHRpb24gd2l0aCB0aGUgc2FtZSB2YWx1ZWAsIHtcbiAgICAgICAgICAgICAgb3B0aW9uMTogb3B0aW9uLmVsZW1lbnQsXG4gICAgICAgICAgICAgIG9wdGlvbjI6IGR1cGxpY2F0ZS5lbGVtZW50LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENvZXJjZXMgYSB2YWx1ZSBpbnRvIGFuIGFycmF5IHJlcHJlc2VudGluZyBhIGxpc3Rib3ggc2VsZWN0aW9uLlxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlIHRvIGNvZXJjZVxuICAgKiBAcmV0dXJuIEFuIGFycmF5XG4gICAqL1xuICBwcml2YXRlIF9jb2VyY2VWYWx1ZSh2YWx1ZTogcmVhZG9ubHkgVFtdKSB7XG4gICAgcmV0dXJuIHZhbHVlID09IG51bGwgPyBbXSA6IGNvZXJjZUFycmF5KHZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHN1Ymxpc3Qgb2YgdmFsdWVzIHRoYXQgZG8gbm90IHJlcHJlc2VudCB2YWxpZCBvcHRpb24gdmFsdWVzIGluIHRoaXMgbGlzdGJveC5cbiAgICogQHBhcmFtIHZhbHVlcyBUaGUgbGlzdCBvZiB2YWx1ZXNcbiAgICogQHJldHVybiBUaGUgc3VibGlzdCBvZiB2YWx1ZXMgdGhhdCBhcmUgbm90IHZhbGlkIG9wdGlvbiB2YWx1ZXNcbiAgICovXG4gIHByaXZhdGUgX2dldEludmFsaWRPcHRpb25WYWx1ZXModmFsdWVzOiByZWFkb25seSBUW10pIHtcbiAgICBjb25zdCBpc0VxdWFsID0gdGhpcy5jb21wYXJlV2l0aCB8fCBPYmplY3QuaXM7XG4gICAgY29uc3QgdmFsaWRWYWx1ZXMgPSAodGhpcy5vcHRpb25zIHx8IFtdKS5tYXAob3B0aW9uID0+IG9wdGlvbi52YWx1ZSk7XG4gICAgcmV0dXJuIHZhbHVlcy5maWx0ZXIodmFsdWUgPT4gIXZhbGlkVmFsdWVzLnNvbWUodmFsaWRWYWx1ZSA9PiBpc0VxdWFsKHZhbHVlLCB2YWxpZFZhbHVlKSkpO1xuICB9XG5cbiAgLyoqIEdldCB0aGUgaW5kZXggb2YgdGhlIGxhc3QgdHJpZ2dlcmVkIG9wdGlvbi4gKi9cbiAgcHJpdmF0ZSBfZ2V0TGFzdFRyaWdnZXJlZEluZGV4KCkge1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5vcHRpb25zLnRvQXJyYXkoKS5pbmRleE9mKHRoaXMuX2xhc3RUcmlnZ2VyZWQhKTtcbiAgICByZXR1cm4gaW5kZXggPT09IC0xID8gbnVsbCA6IGluZGV4O1xuICB9XG59XG5cbi8qKiBDaGFuZ2UgZXZlbnQgdGhhdCBpcyBmaXJlZCB3aGVuZXZlciB0aGUgdmFsdWUgb2YgdGhlIGxpc3Rib3ggY2hhbmdlcy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTGlzdGJveFZhbHVlQ2hhbmdlRXZlbnQ8VD4ge1xuICAvKiogVGhlIG5ldyB2YWx1ZSBvZiB0aGUgbGlzdGJveC4gKi9cbiAgcmVhZG9ubHkgdmFsdWU6IHJlYWRvbmx5IFRbXTtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSBsaXN0Ym94IHRoYXQgZW1pdHRlZCB0aGUgZXZlbnQuICovXG4gIHJlYWRvbmx5IGxpc3Rib3g6IENka0xpc3Rib3g8VD47XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgb3B0aW9uIHRoYXQgd2FzIHRyaWdnZXJlZC4gKi9cbiAgcmVhZG9ubHkgb3B0aW9uOiBDZGtPcHRpb248VD4gfCBudWxsO1xufVxuIl19