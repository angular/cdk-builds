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
CdkOption.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: CdkOption, deps: [], target: i0.ɵɵFactoryTarget.Directive });
CdkOption.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "14.2.0", type: CdkOption, selector: "[cdkOption]", inputs: { id: "id", value: ["cdkOption", "value"], typeaheadLabel: ["cdkOptionTypeaheadLabel", "typeaheadLabel"], disabled: ["cdkOptionDisabled", "disabled"], enabledTabIndex: ["tabindex", "enabledTabIndex"] }, host: { attributes: { "role": "option" }, listeners: { "click": "_clicked.next($event)", "focus": "_handleFocus()" }, properties: { "id": "id", "attr.aria-selected": "isSelected()", "attr.tabindex": "_getTabIndex()", "attr.aria-disabled": "disabled", "class.cdk-option-active": "isActive()" }, classAttribute: "cdk-option" }, exportAs: ["cdkOption"], ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: CdkOption, decorators: [{
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
        if (this.options) {
            this._updateInternalValue();
        }
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
        // Update the internal value whenever the options or the model value changes.
        merge(this.selectionModel.changed, this.options.changes)
            .pipe(startWith(null), takeUntil(this.destroyed))
            .subscribe(() => this._updateInternalValue());
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
CdkListbox.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: CdkListbox, deps: [], target: i0.ɵɵFactoryTarget.Directive });
CdkListbox.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "14.2.0", type: CdkListbox, selector: "[cdkListbox]", inputs: { id: "id", enabledTabIndex: ["tabindex", "enabledTabIndex"], value: ["cdkListboxValue", "value"], multiple: ["cdkListboxMultiple", "multiple"], disabled: ["cdkListboxDisabled", "disabled"], useActiveDescendant: ["cdkListboxUseActiveDescendant", "useActiveDescendant"], orientation: ["cdkListboxOrientation", "orientation"], compareWith: ["cdkListboxCompareWith", "compareWith"], navigationWrapDisabled: ["cdkListboxNavigationWrapDisabled", "navigationWrapDisabled"], navigateDisabledOptions: ["cdkListboxNavigatesDisabledOptions", "navigateDisabledOptions"] }, outputs: { valueChange: "cdkListboxValueChange" }, host: { attributes: { "role": "listbox" }, listeners: { "focus": "_handleFocus()", "keydown": "_handleKeydown($event)", "focusout": "_handleFocusOut($event)" }, properties: { "id": "id", "attr.tabindex": "_getTabIndex()", "attr.aria-disabled": "disabled", "attr.aria-multiselectable": "multiple", "attr.aria-activedescendant": "_getAriaActiveDescendant()", "attr.aria-orientation": "orientation" }, classAttribute: "cdk-listbox" }, providers: [
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
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: CdkListbox, decorators: [{
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
        }], propDecorators: { id: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdGJveC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvbGlzdGJveC9saXN0Ym94LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFFTCxpQkFBaUIsRUFDakIsZUFBZSxFQUNmLFNBQVMsRUFDVCxVQUFVLEVBQ1YsVUFBVSxFQUNWLE1BQU0sRUFDTixXQUFXLEVBQ1gsS0FBSyxFQUVMLE1BQU0sRUFDTixTQUFTLEdBQ1YsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLDBCQUEwQixFQUFzQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2xHLE9BQU8sRUFDTCxDQUFDLEVBQ0QsVUFBVSxFQUNWLEdBQUcsRUFDSCxLQUFLLEVBQ0wsY0FBYyxFQUNkLElBQUksRUFDSixVQUFVLEVBQ1YsV0FBVyxFQUNYLEtBQUssRUFDTCxRQUFRLEdBQ1QsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQWUsV0FBVyxFQUFFLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdkYsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ3hELE9BQU8sRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFjLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUN2RCxPQUFPLEVBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzVFLE9BQU8sRUFHTCxhQUFhLEVBQ2IsaUJBQWlCLEVBSWpCLFVBQVUsR0FDWCxNQUFNLGdCQUFnQixDQUFDO0FBQ3hCLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQzs7QUFFakQsc0RBQXNEO0FBQ3RELElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztBQUVmOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLHFCQUF5QixTQUFRLGNBQWlCO0lBQ3RELFlBQ1MsV0FBVyxLQUFLLEVBQ3ZCLHVCQUE2QixFQUM3QixXQUFXLEdBQUcsSUFBSSxFQUNsQixXQUF1QztRQUV2QyxLQUFLLENBQUMsSUFBSSxFQUFFLHVCQUF1QixFQUFFLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUx4RCxhQUFRLEdBQVIsUUFBUSxDQUFRO0lBTXpCLENBQUM7SUFFUSxtQkFBbUI7UUFDMUIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO0lBQ3ZCLENBQUM7SUFFUSxNQUFNLENBQUMsR0FBRyxNQUFXO1FBQzVCLDRGQUE0RjtRQUM1Rix1RUFBdUU7UUFDdkUsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2pCLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDO1NBQ2hDO2FBQU07WUFDTCxPQUFPLEtBQUssQ0FBQyxZQUFZLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQztTQUN0QztJQUNILENBQUM7Q0FDRjtBQUVELHdDQUF3QztBQWdCeEMsTUFBTSxPQUFPLFNBQVM7SUFmdEI7UUF5QlUsaUJBQVksR0FBRyxjQUFjLE1BQU0sRUFBRSxFQUFFLENBQUM7UUFtQnhDLGNBQVMsR0FBWSxLQUFLLENBQUM7UUFjbkMsZ0NBQWdDO1FBQ3ZCLFlBQU8sR0FBZ0IsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLGFBQWEsQ0FBQztRQUVqRSxpREFBaUQ7UUFDOUIsWUFBTyxHQUFrQixNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFL0QsMENBQTBDO1FBQ2hDLGNBQVMsR0FBRyxJQUFJLE9BQU8sRUFBUSxDQUFDO1FBRTFDLHdDQUF3QztRQUMvQixhQUFRLEdBQUcsSUFBSSxPQUFPLEVBQWMsQ0FBQztRQUU5Qyw4Q0FBOEM7UUFDdEMsWUFBTyxHQUFHLEtBQUssQ0FBQztLQTRFekI7SUFuSUMsMkNBQTJDO0lBQzNDLElBQ0ksRUFBRTtRQUNKLE9BQU8sSUFBSSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDO0lBQ3ZDLENBQUM7SUFDRCxJQUFJLEVBQUUsQ0FBQyxLQUFLO1FBQ1YsSUFBSSxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUM7SUFDbkIsQ0FBQztJQWFELHVDQUF1QztJQUN2QyxJQUNJLFFBQVE7UUFDVixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDakQsQ0FBQztJQUNELElBQUksUUFBUSxDQUFDLEtBQW1CO1FBQzlCLElBQUksQ0FBQyxTQUFTLEdBQUcscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUdELHFEQUFxRDtJQUNyRCxJQUNJLGVBQWU7UUFDakIsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLEtBQUssU0FBUztZQUN4QyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlO1lBQzlCLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7SUFDNUIsQ0FBQztJQUNELElBQUksZUFBZSxDQUFDLEtBQUs7UUFDdkIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQztJQUNoQyxDQUFDO0lBa0JELFdBQVc7UUFDVCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUVELHVDQUF1QztJQUN2QyxVQUFVO1FBQ1IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBRUQscUNBQXFDO0lBQ3JDLFFBQVE7UUFDTixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7SUFDdEIsQ0FBQztJQUVELGdEQUFnRDtJQUNoRCxNQUFNO1FBQ0osSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUVELGdEQUFnRDtJQUNoRCxNQUFNO1FBQ0osSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUVELDhDQUE4QztJQUM5QyxRQUFRO1FBQ04sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUVELHlCQUF5QjtJQUN6QixLQUFLO1FBQ0gsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUN2QixDQUFDO0lBRUQseUZBQXlGO0lBQ3pGLFFBQVE7UUFDTixPQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUN6RSxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsZUFBZTtRQUNiLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0lBQ3RCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxpQkFBaUI7UUFDZixJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztJQUN2QixDQUFDO0lBRUQseUNBQXlDO0lBQy9CLFlBQVk7UUFDcEIsNEZBQTRGO1FBQzVGLDJGQUEyRjtRQUMzRixpQ0FBaUM7UUFDakMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixFQUFFO1lBQ3BDLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUN0QjtJQUNILENBQUM7SUFFRCx3Q0FBd0M7SUFDOUIsWUFBWTtRQUNwQixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNyRCxPQUFPLENBQUMsQ0FBQyxDQUFDO1NBQ1g7UUFDRCxPQUFPLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDckQsQ0FBQzs7c0dBbklVLFNBQVM7MEZBQVQsU0FBUzsyRkFBVCxTQUFTO2tCQWZyQixTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSxhQUFhO29CQUN2QixRQUFRLEVBQUUsV0FBVztvQkFDckIsSUFBSSxFQUFFO3dCQUNKLE1BQU0sRUFBRSxRQUFRO3dCQUNoQixPQUFPLEVBQUUsWUFBWTt3QkFDckIsTUFBTSxFQUFFLElBQUk7d0JBQ1osc0JBQXNCLEVBQUUsY0FBYzt3QkFDdEMsaUJBQWlCLEVBQUUsZ0JBQWdCO3dCQUNuQyxzQkFBc0IsRUFBRSxVQUFVO3dCQUNsQywyQkFBMkIsRUFBRSxZQUFZO3dCQUN6QyxTQUFTLEVBQUUsdUJBQXVCO3dCQUNsQyxTQUFTLEVBQUUsZ0JBQWdCO3FCQUM1QjtpQkFDRjs4QkFJSyxFQUFFO3NCQURMLEtBQUs7Z0JBV2MsS0FBSztzQkFBeEIsS0FBSzt1QkFBQyxXQUFXO2dCQU1nQixjQUFjO3NCQUEvQyxLQUFLO3VCQUFDLHlCQUF5QjtnQkFJNUIsUUFBUTtzQkFEWCxLQUFLO3VCQUFDLG1CQUFtQjtnQkFXdEIsZUFBZTtzQkFEbEIsS0FBSzt1QkFBQyxVQUFVOztBQW1JbkIsTUFBTSxPQUFPLFVBQVU7SUE3QnZCO1FBeUNVLGlCQUFZLEdBQUcsZUFBZSxNQUFNLEVBQUUsRUFBRSxDQUFDO1FBNkN6QyxjQUFTLEdBQVksS0FBSyxDQUFDO1FBVTNCLHlCQUFvQixHQUFZLEtBQUssQ0FBQztRQWV0QyxpQkFBWSxHQUE4QixVQUFVLENBQUM7UUF1QnJELDRCQUF1QixHQUFHLEtBQUssQ0FBQztRQWFoQyw2QkFBd0IsR0FBRyxLQUFLLENBQUM7UUFFekMsOERBQThEO1FBQ3BCLGdCQUFXLEdBQUcsSUFBSSxPQUFPLEVBQThCLENBQUM7UUFLbEcsK0NBQStDO1FBQ3JDLG1CQUFjLEdBQUcsSUFBSSxxQkFBcUIsRUFBSyxDQUFDO1FBSzFELDJDQUEyQztRQUN4QixjQUFTLEdBQUcsSUFBSSxPQUFPLEVBQVEsQ0FBQztRQUVuRCx1Q0FBdUM7UUFDcEIsWUFBTyxHQUFnQixNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsYUFBYSxDQUFDO1FBRTNFLDRDQUE0QztRQUN6QixzQkFBaUIsR0FBRyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUVqRSw4RUFBOEU7UUFDdEUsYUFBUSxHQUFHLEtBQUssQ0FBQztRQUV6QixzQ0FBc0M7UUFDOUIsbUJBQWMsR0FBd0IsSUFBSSxDQUFDO1FBRW5ELHdEQUF3RDtRQUNoRCxlQUFVLEdBQUcsR0FBRyxFQUFFLEdBQUUsQ0FBQyxDQUFDO1FBRTlCLHFEQUFxRDtRQUM3QyxjQUFTLEdBQWtDLEdBQUcsRUFBRSxHQUFFLENBQUMsQ0FBQztRQUU1RCx1REFBdUQ7UUFDL0MsdUJBQWtCLEdBQUcsR0FBRyxFQUFFLEdBQUUsQ0FBQyxDQUFDO1FBRXRDLDZDQUE2QztRQUNyQyxtQkFBYyxHQUFHLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FDakMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFzQyxDQUFDLElBQUksQ0FDdkQsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFDdkIsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQ2xCLEtBQUssQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUMsTUFBTSxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FDdkYsQ0FDRixDQUNGLENBQUM7UUFFRixzQ0FBc0M7UUFDckIsU0FBSSxHQUFHLE1BQU0sQ0FBQyxjQUFjLEVBQUUsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRXJFLCtDQUErQztRQUM5QiwyQkFBc0IsR0FBRyxDQUFDLE1BQW9CLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUM7UUFFcEYsa0RBQWtEO1FBQ2pDLHVCQUFrQixHQUFHLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQztRQUVsRDs7Ozs7V0FLRztRQUNLLHNDQUFpQyxHQUFnQixDQUFDLE9BQXdCLEVBQUUsRUFBRTtZQUNwRixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN0RCxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDN0MsT0FBTyxFQUFDLG9DQUFvQyxFQUFFLElBQUksRUFBQyxDQUFDO2FBQ3JEO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDLENBQUM7UUFFRjs7OztXQUlHO1FBQ0ssb0NBQStCLEdBQWdCLENBQUMsT0FBd0IsRUFBRSxFQUFFO1lBQ2xGLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RELE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNqRSxJQUFJLGFBQWEsQ0FBQyxNQUFNLEVBQUU7Z0JBQ3hCLE9BQU8sRUFBQyxrQ0FBa0MsRUFBRSxFQUFDLFFBQVEsRUFBRSxhQUFhLEVBQUMsRUFBQyxDQUFDO2FBQ3hFO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDLENBQUM7UUFFRix1REFBdUQ7UUFDL0MsZ0JBQVcsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxpQ0FBaUM7WUFDdEMsSUFBSSxDQUFDLCtCQUErQjtTQUNyQyxDQUFFLENBQUM7S0EwaEJMO0lBdHVCQywyQ0FBMkM7SUFDM0MsSUFDSSxFQUFFO1FBQ0osT0FBTyxJQUFJLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUM7SUFDdkMsQ0FBQztJQUNELElBQUksRUFBRSxDQUFDLEtBQUs7UUFDVixJQUFJLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQztJQUNuQixDQUFDO0lBSUQsdURBQXVEO0lBQ3ZELElBQ0ksZUFBZTtRQUNqQixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDO0lBQ3pFLENBQUM7SUFDRCxJQUFJLGVBQWUsQ0FBQyxLQUFLO1FBQ3ZCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7SUFDaEMsQ0FBQztJQUdELG1GQUFtRjtJQUNuRixJQUNJLEtBQUs7UUFDUCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUM7SUFDM0QsQ0FBQztJQUNELElBQUksS0FBSyxDQUFDLEtBQW1CO1FBQzNCLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUVEOzs7T0FHRztJQUNILElBQ0ksUUFBUTtRQUNWLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUM7SUFDdEMsQ0FBQztJQUNELElBQUksUUFBUSxDQUFDLEtBQW1CO1FBQzlCLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxHQUFHLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRTVELElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNoQixJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztTQUM3QjtJQUNILENBQUM7SUFFRCx1Q0FBdUM7SUFDdkMsSUFDSSxRQUFRO1FBQ1YsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQ3hCLENBQUM7SUFDRCxJQUFJLFFBQVEsQ0FBQyxLQUFtQjtRQUM5QixJQUFJLENBQUMsU0FBUyxHQUFHLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2hELENBQUM7SUFHRCwwRkFBMEY7SUFDMUYsSUFDSSxtQkFBbUI7UUFDckIsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUM7SUFDbkMsQ0FBQztJQUNELElBQUksbUJBQW1CLENBQUMseUJBQXVDO1FBQzdELElBQUksQ0FBQyxvQkFBb0IsR0FBRyxxQkFBcUIsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0lBQy9FLENBQUM7SUFHRCw0RkFBNEY7SUFDNUYsSUFDSSxXQUFXO1FBQ2IsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO0lBQzNCLENBQUM7SUFDRCxJQUFJLFdBQVcsQ0FBQyxLQUFnQztRQUM5QyxJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssS0FBSyxZQUFZLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDO1FBQ3ZFLElBQUksS0FBSyxLQUFLLFlBQVksRUFBRTtZQUMxQixJQUFJLENBQUMsY0FBYyxFQUFFLHlCQUF5QixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxJQUFJLEtBQUssQ0FBQyxDQUFDO1NBQzNFO2FBQU07WUFDTCxJQUFJLENBQUMsY0FBYyxFQUFFLHVCQUF1QixFQUFFLENBQUM7U0FDaEQ7SUFDSCxDQUFDO0lBR0Qsa0RBQWtEO0lBQ2xELElBQ0ksV0FBVztRQUNiLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUM7SUFDekMsQ0FBQztJQUNELElBQUksV0FBVyxDQUFDLEVBQTJDO1FBQ3pELElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQztJQUN2QyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsSUFDSSxzQkFBc0I7UUFDeEIsT0FBTyxJQUFJLENBQUMsdUJBQXVCLENBQUM7SUFDdEMsQ0FBQztJQUNELElBQUksc0JBQXNCLENBQUMsSUFBa0I7UUFDM0MsSUFBSSxDQUFDLHVCQUF1QixHQUFHLHFCQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzNELElBQUksQ0FBQyxjQUFjLEVBQUUsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUM7SUFDL0QsQ0FBQztJQUdELG1FQUFtRTtJQUNuRSxJQUNJLHVCQUF1QjtRQUN6QixPQUFPLElBQUksQ0FBQyx3QkFBd0IsQ0FBQztJQUN2QyxDQUFDO0lBQ0QsSUFBSSx1QkFBdUIsQ0FBQyxJQUFrQjtRQUM1QyxJQUFJLENBQUMsd0JBQXdCLEdBQUcscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUQsSUFBSSxDQUFDLGNBQWMsRUFBRSxhQUFhLENBQ2hDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQ3RGLENBQUM7SUFDSixDQUFDO0lBNEZELGtCQUFrQjtRQUNoQixJQUFJLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLEVBQUU7WUFDakQsSUFBSSxDQUFDLDhCQUE4QixFQUFFLENBQUM7U0FDdkM7UUFFRCxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFFdkIsNkVBQTZFO1FBQzdFLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQzthQUNyRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7YUFDaEQsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUM7UUFFaEQsSUFBSSxDQUFDLGNBQWM7YUFDaEIsSUFBSSxDQUNILE1BQU0sQ0FBQyxDQUFDLEVBQUMsTUFBTSxFQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUN0QyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUMxQjthQUNBLFNBQVMsQ0FBQyxDQUFDLEVBQUMsTUFBTSxFQUFFLEtBQUssRUFBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDOUUsQ0FBQztJQUVELFdBQVc7UUFDVCxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUN0QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUVEOzs7T0FHRztJQUNILE1BQU0sQ0FBQyxNQUFvQjtRQUN6QixJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsV0FBVyxDQUFDLEtBQVE7UUFDbEIsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2pCLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ2xDO1FBQ0QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVEOzs7T0FHRztJQUNILE1BQU0sQ0FBQyxNQUFvQjtRQUN6QixJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsV0FBVyxDQUFDLEtBQVE7UUFDbEIsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2pCLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ2xDO1FBQ0QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVEOzs7T0FHRztJQUNILFFBQVEsQ0FBQyxNQUFvQjtRQUMzQixJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsYUFBYSxDQUFDLEtBQVE7UUFDcEIsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2pCLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ2xDO1FBQ0QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVEOzs7T0FHRztJQUNILGNBQWMsQ0FBQyxVQUFtQjtRQUNoQyxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ2YsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUM3QjthQUFNO1lBQ0wsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUNqQixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUNsQztZQUNELElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztTQUN6RTtJQUNILENBQUM7SUFFRDs7O09BR0c7SUFDSCxVQUFVLENBQUMsTUFBb0I7UUFDN0IsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsZUFBZSxDQUFDLEtBQVE7UUFDdEIsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2pCLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFDRCxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsZ0JBQWdCLENBQUMsRUFBaUM7UUFDaEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7SUFDdEIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxpQkFBaUIsQ0FBQyxFQUFZO1FBQzVCLElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO0lBQ3ZCLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsVUFBVSxDQUFDLEtBQW1CO1FBQzVCLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxnQkFBZ0IsQ0FBQyxVQUFtQjtRQUNsQyxJQUFJLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQztJQUM3QixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsUUFBUSxDQUFDLE9BQWtDO1FBQ3pDLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILHlCQUF5QixDQUFDLEVBQWM7UUFDdEMsSUFBSSxDQUFDLGtCQUFrQixHQUFHLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBRUQsd0NBQXdDO0lBQ3hDLEtBQUs7UUFDSCxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3ZCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNPLGFBQWEsQ0FBQyxNQUEyQjtRQUNqRCxJQUFJLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUU7WUFDOUIsSUFBSSxDQUFDLGNBQWMsR0FBRyxNQUFNLENBQUM7WUFDN0IsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVE7Z0JBQzNCLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO2dCQUMxQyxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzdDLElBQUksT0FBTyxFQUFFO2dCQUNYLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUMzQixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQztvQkFDcEIsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO29CQUNqQixPQUFPLEVBQUUsSUFBSTtvQkFDYixNQUFNLEVBQUUsTUFBTTtpQkFDZixDQUFDLENBQUM7YUFDSjtTQUNGO0lBQ0gsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDTyxZQUFZLENBQUMsT0FBNEIsRUFBRSxJQUFZLEVBQUUsRUFBVSxFQUFFLEVBQVc7UUFDeEYsSUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNsRCxPQUFPO1NBQ1I7UUFDRCxJQUFJLENBQUMsY0FBYyxHQUFHLE9BQU8sQ0FBQztRQUM5QixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsV0FBVyxJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDOUMsTUFBTSxZQUFZLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7YUFDbkMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzthQUM3RixNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUM7YUFDbEMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9CLE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDakMsS0FBSyxNQUFNLFdBQVcsSUFBSSxZQUFZLEVBQUU7WUFDdEMsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUN2RCxPQUFPLENBQUMsYUFBYSxFQUFFLFdBQVcsQ0FBQyxDQUNwQyxDQUFDO1lBQ0YsSUFBSSxFQUFFLElBQUksYUFBYSxLQUFLLENBQUMsQ0FBQyxFQUFFO2dCQUM5QixRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2FBQzVCO2lCQUFNLElBQUksQ0FBQyxFQUFFLElBQUksYUFBYSxLQUFLLENBQUMsQ0FBQyxFQUFFO2dCQUN0QyxRQUFRLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQzthQUNuQztTQUNGO1FBQ0QsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQztRQUM1RCxJQUFJLE9BQU8sRUFBRTtZQUNYLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO2dCQUNwQixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7Z0JBQ2pCLE9BQU8sRUFBRSxJQUFJO2dCQUNiLE1BQU0sRUFBRSxPQUFPO2FBQ2hCLENBQUMsQ0FBQztTQUNKO0lBQ0gsQ0FBQztJQUVEOzs7T0FHRztJQUNILGdCQUFnQixDQUFDLE1BQW9CO1FBQ25DLElBQUksQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFRCw4Q0FBOEM7SUFDcEMsWUFBWTtRQUNwQixJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFO1lBQzdCLElBQUksQ0FBQyxjQUFjLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUN4QyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztTQUMzQjtJQUNILENBQUM7SUFFRCwyREFBMkQ7SUFDakQsY0FBYyxDQUFDLEtBQW9CO1FBQzNDLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNsQixPQUFPO1NBQ1I7UUFFRCxNQUFNLEVBQUMsT0FBTyxFQUFDLEdBQUcsS0FBSyxDQUFDO1FBQ3hCLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUM7UUFDaEUsTUFBTSxRQUFRLEdBQUcsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFVLENBQUM7UUFFakQsSUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLE9BQU8sS0FBSyxDQUFDLElBQUksY0FBYyxDQUFDLEtBQUssRUFBRSxHQUFHLFFBQVEsQ0FBQyxFQUFFO1lBQ3hFLGdGQUFnRjtZQUNoRixJQUFJLENBQUMsWUFBWSxDQUNmLElBQUksRUFDSixDQUFDLEVBQ0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUN2QixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FDMUMsQ0FBQztZQUNGLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN2QixPQUFPO1NBQ1I7UUFFRCxJQUNFLElBQUksQ0FBQyxRQUFRO1lBQ2IsQ0FBQyxPQUFPLEtBQUssS0FBSyxJQUFJLE9BQU8sS0FBSyxLQUFLLENBQUM7WUFDeEMsY0FBYyxDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsRUFDakM7WUFDQSxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsZUFBZSxJQUFJLElBQUksRUFBRTtnQkFDakYsSUFBSSxDQUFDLFlBQVksQ0FDZixJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFDOUIsSUFBSSxDQUFDLHNCQUFzQixFQUFFLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxlQUFlLEVBQ3BFLElBQUksQ0FBQyxjQUFjLENBQUMsZUFBZSxFQUNuQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRSxDQUM3QyxDQUFDO2FBQ0g7WUFDRCxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDdkIsT0FBTztTQUNSO1FBRUQsSUFDRSxJQUFJLENBQUMsUUFBUTtZQUNiLE9BQU8sS0FBSyxJQUFJO1lBQ2hCLGNBQWMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxRQUFRLENBQUM7WUFDbEMsY0FBYyxDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsRUFDakM7WUFDQSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQztZQUMvQyxJQUFJLE9BQU8sRUFBRTtnQkFDWCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLGVBQWdCLENBQUM7Z0JBQ2xELElBQUksQ0FBQyxjQUFjLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFDekMsSUFBSSxDQUFDLFlBQVksQ0FDZixPQUFPLEVBQ1AsSUFBSSxFQUNKLElBQUksQ0FBQyxjQUFjLENBQUMsZUFBZ0IsRUFDcEMsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQ3RCLENBQUM7YUFDSDtZQUNELEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN2QixPQUFPO1NBQ1I7UUFFRCxJQUNFLElBQUksQ0FBQyxRQUFRO1lBQ2IsT0FBTyxLQUFLLEdBQUc7WUFDZixjQUFjLENBQUMsS0FBSyxFQUFFLEdBQUcsUUFBUSxDQUFDO1lBQ2xDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLEVBQ2pDO1lBQ0EsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUM7WUFDL0MsSUFBSSxPQUFPLEVBQUU7Z0JBQ1gsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxlQUFnQixDQUFDO2dCQUNsRCxJQUFJLENBQUMsY0FBYyxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQ3hDLElBQUksQ0FBQyxZQUFZLENBQ2YsT0FBTyxFQUNQLElBQUksRUFDSixJQUFJLENBQUMsY0FBYyxDQUFDLGVBQWdCLEVBQ3BDLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUN0QixDQUFDO2FBQ0g7WUFDRCxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDdkIsT0FBTztTQUNSO1FBRUQsSUFBSSxPQUFPLEtBQUssS0FBSyxJQUFJLE9BQU8sS0FBSyxLQUFLLEVBQUU7WUFDMUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ25ELEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN2QixPQUFPO1NBQ1I7UUFFRCxNQUFNLFFBQVEsR0FDWixPQUFPLEtBQUssUUFBUTtZQUNwQixPQUFPLEtBQUssVUFBVTtZQUN0QixPQUFPLEtBQUssVUFBVTtZQUN0QixPQUFPLEtBQUssV0FBVztZQUN2QixPQUFPLEtBQUssSUFBSTtZQUNoQixPQUFPLEtBQUssR0FBRyxDQUFDO1FBQ2xCLElBQUksQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JDLDRFQUE0RTtRQUM1RSxJQUFJLFFBQVEsSUFBSSxLQUFLLENBQUMsUUFBUSxJQUFJLG1CQUFtQixLQUFLLElBQUksQ0FBQyxjQUFjLENBQUMsZUFBZSxFQUFFO1lBQzdGLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUNwRDtJQUNILENBQUM7SUFFRDs7O09BR0c7SUFDTyxlQUFlLENBQUMsS0FBaUI7UUFDekMsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLGFBQXdCLENBQUM7UUFDcEQsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLFlBQVksSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxFQUFFO1lBQ3pFLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztTQUNuQjtJQUNILENBQUM7SUFFRCwwRUFBMEU7SUFDaEUsd0JBQXdCO1FBQ2hDLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUNoRixDQUFDO0lBRUQsd0NBQXdDO0lBQzlCLFlBQVk7UUFDcEIsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2pCLE9BQU8sQ0FBQyxDQUFDLENBQUM7U0FDWDtRQUNELE9BQU8sSUFBSSxDQUFDLG1CQUFtQixJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2pHLENBQUM7SUFFRCxrQ0FBa0M7SUFDMUIsZUFBZTtRQUNyQixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksMEJBQTBCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQzthQUMvRCxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUM7YUFDdkMsYUFBYSxFQUFFO2FBQ2YsY0FBYyxFQUFFO2FBQ2hCLHVCQUF1QixDQUFDLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDckMsYUFBYSxDQUNaLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQ3RGLENBQUM7UUFFSixJQUFJLElBQUksQ0FBQyxXQUFXLEtBQUssVUFBVSxFQUFFO1lBQ25DLElBQUksQ0FBQyxjQUFjLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztTQUMvQzthQUFNO1lBQ0wsSUFBSSxDQUFDLGNBQWMsQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssSUFBSSxLQUFLLENBQUMsQ0FBQztTQUMxRTtRQUVELElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTTthQUN2QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQzthQUMvQixTQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQztJQUNoRCxDQUFDO0lBRUQsK0JBQStCO0lBQ3ZCLGtCQUFrQjtRQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFO1lBQzdCLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxDQUFDO1NBQ3pDO1FBQ0QsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFlBQVksRUFBRSxDQUFDO0lBQ3hDLENBQUM7SUFFRDs7O09BR0c7SUFDSyxhQUFhLENBQUMsS0FBbUI7UUFDdkMsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2pCLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ2xDO1FBQ0QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDaEUsQ0FBQztJQUVELDZFQUE2RTtJQUNyRSxvQkFBb0I7UUFDMUIsTUFBTSxVQUFVLEdBQUcsSUFBSSxHQUFHLEVBQWEsQ0FBQztRQUN4QyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUksRUFBRSxDQUFJLEVBQUUsRUFBRTtZQUN0QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckQsT0FBTyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3pCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUM7UUFDOUMsSUFBSSxDQUFDLFFBQVE7WUFDWCxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQzdGLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQzFCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUN4QyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSyxpQkFBaUIsQ0FBQyxLQUFxQixFQUFFLEtBQVE7UUFDdkQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFdBQVcsSUFBSSxNQUFNLENBQUMsRUFBRSxDQUFDO1FBQzlDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ3JCLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2YsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUM1QyxJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFFLENBQUMsS0FBSyxDQUFDLEVBQUU7b0JBQzlDLEtBQUssR0FBRyxDQUFDLENBQUM7b0JBQ1YsTUFBTTtpQkFDUDthQUNGO1lBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDekI7UUFDRCxPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFFLENBQUM7SUFDM0IsQ0FBQztJQUVEOzs7T0FHRztJQUNLLG9CQUFvQixDQUFDLE1BQW9CLEVBQUUsS0FBaUI7UUFDbEUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDMUMsSUFBSSxLQUFLLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDbkMsSUFBSSxDQUFDLFlBQVksQ0FDZixNQUFNLEVBQ04sSUFBSSxDQUFDLHNCQUFzQixFQUFFLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxlQUFnQixFQUNyRSxJQUFJLENBQUMsY0FBYyxDQUFDLGVBQWdCLEVBQ3BDLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUNyQixDQUFDO1NBQ0g7YUFBTTtZQUNMLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDNUI7SUFDSCxDQUFDO0lBRUQsNEZBQTRGO0lBQ3BGLDhCQUE4QjtRQUNwQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRTtZQUMzRixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsV0FBVyxJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDOUMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUM1QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUUsQ0FBQztnQkFDcEMsSUFBSSxTQUFTLEdBQXdCLElBQUksQ0FBQztnQkFDMUMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDaEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFFLENBQUM7b0JBQ25DLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFO3dCQUN0QyxTQUFTLEdBQUcsS0FBSyxDQUFDO3dCQUNsQixNQUFNO3FCQUNQO2lCQUNGO2dCQUNELElBQUksU0FBUyxFQUFFO29CQUNiLDJDQUEyQztvQkFDM0MsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO3dCQUNwQixPQUFPLENBQUMsSUFBSSxDQUNWLDJGQUEyRixFQUMzRjs0QkFDRSxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU87NEJBQ3ZCLE9BQU8sRUFBRSxTQUFTLENBQUMsT0FBTzs0QkFDMUIsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXO3lCQUM5QixDQUNGLENBQUM7cUJBQ0g7eUJBQU07d0JBQ0wsT0FBTyxDQUFDLElBQUksQ0FBQyw4Q0FBOEMsRUFBRTs0QkFDM0QsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPOzRCQUN2QixPQUFPLEVBQUUsU0FBUyxDQUFDLE9BQU87eUJBQzNCLENBQUMsQ0FBQztxQkFDSjtvQkFDRCxPQUFPO2lCQUNSO2FBQ0Y7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7OztPQUlHO0lBQ0ssWUFBWSxDQUFDLEtBQW1CO1FBQ3RDLE9BQU8sS0FBSyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVEOzs7O09BSUc7SUFDSyx1QkFBdUIsQ0FBQyxNQUFvQjtRQUNsRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsV0FBVyxJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDOUMsTUFBTSxXQUFXLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyRSxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3RixDQUFDO0lBRUQsa0RBQWtEO0lBQzFDLHNCQUFzQjtRQUM1QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsY0FBZSxDQUFDLENBQUM7UUFDbkUsT0FBTyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0lBQ3JDLENBQUM7O3VHQXh1QlUsVUFBVTsyRkFBVixVQUFVLG9rQ0FiVjtRQUNUO1lBQ0UsT0FBTyxFQUFFLGlCQUFpQjtZQUMxQixXQUFXLEVBQUUsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQztZQUN6QyxLQUFLLEVBQUUsSUFBSTtTQUNaO1FBQ0Q7WUFDRSxPQUFPLEVBQUUsYUFBYTtZQUN0QixXQUFXLEVBQUUsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQztZQUN6QyxLQUFLLEVBQUUsSUFBSTtTQUNaO0tBQ0Ysa0RBOEhnQixTQUFTOzJGQTVIZixVQUFVO2tCQTdCdEIsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUsY0FBYztvQkFDeEIsUUFBUSxFQUFFLFlBQVk7b0JBQ3RCLElBQUksRUFBRTt3QkFDSixNQUFNLEVBQUUsU0FBUzt3QkFDakIsT0FBTyxFQUFFLGFBQWE7d0JBQ3RCLE1BQU0sRUFBRSxJQUFJO3dCQUNaLGlCQUFpQixFQUFFLGdCQUFnQjt3QkFDbkMsc0JBQXNCLEVBQUUsVUFBVTt3QkFDbEMsNkJBQTZCLEVBQUUsVUFBVTt3QkFDekMsOEJBQThCLEVBQUUsNEJBQTRCO3dCQUM1RCx5QkFBeUIsRUFBRSxhQUFhO3dCQUN4QyxTQUFTLEVBQUUsZ0JBQWdCO3dCQUMzQixXQUFXLEVBQUUsd0JBQXdCO3dCQUNyQyxZQUFZLEVBQUUseUJBQXlCO3FCQUN4QztvQkFDRCxTQUFTLEVBQUU7d0JBQ1Q7NEJBQ0UsT0FBTyxFQUFFLGlCQUFpQjs0QkFDMUIsV0FBVyxFQUFFLFVBQVUsQ0FBQyxHQUFHLEVBQUUsV0FBVyxDQUFDOzRCQUN6QyxLQUFLLEVBQUUsSUFBSTt5QkFDWjt3QkFDRDs0QkFDRSxPQUFPLEVBQUUsYUFBYTs0QkFDdEIsV0FBVyxFQUFFLFVBQVUsQ0FBQyxHQUFHLEVBQUUsV0FBVyxDQUFDOzRCQUN6QyxLQUFLLEVBQUUsSUFBSTt5QkFDWjtxQkFDRjtpQkFDRjs4QkFNSyxFQUFFO3NCQURMLEtBQUs7Z0JBWUYsZUFBZTtzQkFEbEIsS0FBSzt1QkFBQyxVQUFVO2dCQVdiLEtBQUs7c0JBRFIsS0FBSzt1QkFBQyxpQkFBaUI7Z0JBYXBCLFFBQVE7c0JBRFgsS0FBSzt1QkFBQyxvQkFBb0I7Z0JBY3ZCLFFBQVE7c0JBRFgsS0FBSzt1QkFBQyxvQkFBb0I7Z0JBV3ZCLG1CQUFtQjtzQkFEdEIsS0FBSzt1QkFBQywrQkFBK0I7Z0JBV2xDLFdBQVc7c0JBRGQsS0FBSzt1QkFBQyx1QkFBdUI7Z0JBZ0IxQixXQUFXO3NCQURkLEtBQUs7dUJBQUMsdUJBQXVCO2dCQWExQixzQkFBc0I7c0JBRHpCLEtBQUs7dUJBQUMsa0NBQWtDO2dCQVlyQyx1QkFBdUI7c0JBRDFCLEtBQUs7dUJBQUMsb0NBQW9DO2dCQWFELFdBQVc7c0JBQXBELE1BQU07dUJBQUMsdUJBQXVCO2dCQUc0QixPQUFPO3NCQUFqRSxlQUFlO3VCQUFDLFNBQVMsRUFBRSxFQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgQWZ0ZXJDb250ZW50SW5pdCxcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIENvbnRlbnRDaGlsZHJlbixcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBmb3J3YXJkUmVmLFxuICBpbmplY3QsXG4gIEluamVjdEZsYWdzLFxuICBJbnB1dCxcbiAgT25EZXN0cm95LFxuICBPdXRwdXQsXG4gIFF1ZXJ5TGlzdCxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0FjdGl2ZURlc2NlbmRhbnRLZXlNYW5hZ2VyLCBIaWdobGlnaHRhYmxlLCBMaXN0S2V5TWFuYWdlck9wdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2ExMXknO1xuaW1wb3J0IHtcbiAgQSxcbiAgRE9XTl9BUlJPVyxcbiAgRU5ELFxuICBFTlRFUixcbiAgaGFzTW9kaWZpZXJLZXksXG4gIEhPTUUsXG4gIExFRlRfQVJST1csXG4gIFJJR0hUX0FSUk9XLFxuICBTUEFDRSxcbiAgVVBfQVJST1csXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9rZXljb2Rlcyc7XG5pbXBvcnQge0Jvb2xlYW5JbnB1dCwgY29lcmNlQXJyYXksIGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7U2VsZWN0aW9uTW9kZWx9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2xsZWN0aW9ucyc7XG5pbXBvcnQge2RlZmVyLCBtZXJnZSwgT2JzZXJ2YWJsZSwgU3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2ZpbHRlciwgbWFwLCBzdGFydFdpdGgsIHN3aXRjaE1hcCwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge1xuICBBYnN0cmFjdENvbnRyb2wsXG4gIENvbnRyb2xWYWx1ZUFjY2Vzc29yLFxuICBOR19WQUxJREFUT1JTLFxuICBOR19WQUxVRV9BQ0NFU1NPUixcbiAgVmFsaWRhdGlvbkVycm9ycyxcbiAgVmFsaWRhdG9yLFxuICBWYWxpZGF0b3JGbixcbiAgVmFsaWRhdG9ycyxcbn0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xuaW1wb3J0IHtEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuXG4vKiogVGhlIG5leHQgaWQgdG8gdXNlIGZvciBjcmVhdGluZyB1bmlxdWUgRE9NIElEcy4gKi9cbmxldCBuZXh0SWQgPSAwO1xuXG4vKipcbiAqIEFuIGltcGxlbWVudGF0aW9uIG9mIFNlbGVjdGlvbk1vZGVsIHRoYXQgaW50ZXJuYWxseSBhbHdheXMgcmVwcmVzZW50cyB0aGUgc2VsZWN0aW9uIGFzIGFcbiAqIG11bHRpLXNlbGVjdGlvbi4gVGhpcyBpcyBuZWNlc3Nhcnkgc28gdGhhdCB3ZSBjYW4gcmVjb3ZlciB0aGUgZnVsbCBzZWxlY3Rpb24gaWYgdGhlIHVzZXJcbiAqIHN3aXRjaGVzIHRoZSBsaXN0Ym94IGZyb20gc2luZ2xlLXNlbGVjdGlvbiB0byBtdWx0aS1zZWxlY3Rpb24gYWZ0ZXIgaW5pdGlhbGl6YXRpb24uXG4gKlxuICogVGhpcyBzZWxlY3Rpb24gbW9kZWwgbWF5IHJlcG9ydCBtdWx0aXBsZSBzZWxlY3RlZCB2YWx1ZXMsIGV2ZW4gaWYgaXQgaXMgaW4gc2luZ2xlLXNlbGVjdGlvblxuICogbW9kZS4gSXQgaXMgdXAgdG8gdGhlIHVzZXIgKENka0xpc3Rib3gpIHRvIGNoZWNrIGZvciBpbnZhbGlkIHNlbGVjdGlvbnMuXG4gKi9cbmNsYXNzIExpc3Rib3hTZWxlY3Rpb25Nb2RlbDxUPiBleHRlbmRzIFNlbGVjdGlvbk1vZGVsPFQ+IHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIG11bHRpcGxlID0gZmFsc2UsXG4gICAgaW5pdGlhbGx5U2VsZWN0ZWRWYWx1ZXM/OiBUW10sXG4gICAgZW1pdENoYW5nZXMgPSB0cnVlLFxuICAgIGNvbXBhcmVXaXRoPzogKG8xOiBULCBvMjogVCkgPT4gYm9vbGVhbixcbiAgKSB7XG4gICAgc3VwZXIodHJ1ZSwgaW5pdGlhbGx5U2VsZWN0ZWRWYWx1ZXMsIGVtaXRDaGFuZ2VzLCBjb21wYXJlV2l0aCk7XG4gIH1cblxuICBvdmVycmlkZSBpc011bHRpcGxlU2VsZWN0aW9uKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLm11bHRpcGxlO1xuICB9XG5cbiAgb3ZlcnJpZGUgc2VsZWN0KC4uLnZhbHVlczogVFtdKSB7XG4gICAgLy8gVGhlIHN1cGVyIGNsYXNzIGlzIGFsd2F5cyBpbiBtdWx0aS1zZWxlY3Rpb24gbW9kZSwgc28gd2UgbmVlZCB0byBvdmVycmlkZSB0aGUgYmVoYXZpb3IgaWZcbiAgICAvLyB0aGlzIHNlbGVjdGlvbiBtb2RlbCBhY3R1YWxseSBiZWxvbmdzIHRvIGEgc2luZ2xlLXNlbGVjdGlvbiBsaXN0Ym94LlxuICAgIGlmICh0aGlzLm11bHRpcGxlKSB7XG4gICAgICByZXR1cm4gc3VwZXIuc2VsZWN0KC4uLnZhbHVlcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzdXBlci5zZXRTZWxlY3Rpb24oLi4udmFsdWVzKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIEEgc2VsZWN0YWJsZSBvcHRpb24gaW4gYSBsaXN0Ym94LiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka09wdGlvbl0nLFxuICBleHBvcnRBczogJ2Nka09wdGlvbicsXG4gIGhvc3Q6IHtcbiAgICAncm9sZSc6ICdvcHRpb24nLFxuICAgICdjbGFzcyc6ICdjZGstb3B0aW9uJyxcbiAgICAnW2lkXSc6ICdpZCcsXG4gICAgJ1thdHRyLmFyaWEtc2VsZWN0ZWRdJzogJ2lzU2VsZWN0ZWQoKScsXG4gICAgJ1thdHRyLnRhYmluZGV4XSc6ICdfZ2V0VGFiSW5kZXgoKScsXG4gICAgJ1thdHRyLmFyaWEtZGlzYWJsZWRdJzogJ2Rpc2FibGVkJyxcbiAgICAnW2NsYXNzLmNkay1vcHRpb24tYWN0aXZlXSc6ICdpc0FjdGl2ZSgpJyxcbiAgICAnKGNsaWNrKSc6ICdfY2xpY2tlZC5uZXh0KCRldmVudCknLFxuICAgICcoZm9jdXMpJzogJ19oYW5kbGVGb2N1cygpJyxcbiAgfSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrT3B0aW9uPFQgPSB1bmtub3duPiBpbXBsZW1lbnRzIExpc3RLZXlNYW5hZ2VyT3B0aW9uLCBIaWdobGlnaHRhYmxlLCBPbkRlc3Ryb3kge1xuICAvKiogVGhlIGlkIG9mIHRoZSBvcHRpb24ncyBob3N0IGVsZW1lbnQuICovXG4gIEBJbnB1dCgpXG4gIGdldCBpZCgpIHtcbiAgICByZXR1cm4gdGhpcy5faWQgfHwgdGhpcy5fZ2VuZXJhdGVkSWQ7XG4gIH1cbiAgc2V0IGlkKHZhbHVlKSB7XG4gICAgdGhpcy5faWQgPSB2YWx1ZTtcbiAgfVxuICBwcml2YXRlIF9pZDogc3RyaW5nO1xuICBwcml2YXRlIF9nZW5lcmF0ZWRJZCA9IGBjZGstb3B0aW9uLSR7bmV4dElkKyt9YDtcblxuICAvKiogVGhlIHZhbHVlIG9mIHRoaXMgb3B0aW9uLiAqL1xuICBASW5wdXQoJ2Nka09wdGlvbicpIHZhbHVlOiBUO1xuXG4gIC8qKlxuICAgKiBUaGUgdGV4dCB1c2VkIHRvIGxvY2F0ZSB0aGlzIGl0ZW0gZHVyaW5nIGxpc3Rib3ggdHlwZWFoZWFkLiBJZiBub3Qgc3BlY2lmaWVkLFxuICAgKiB0aGUgYHRleHRDb250ZW50YCBvZiB0aGUgaXRlbSB3aWxsIGJlIHVzZWQuXG4gICAqL1xuICBASW5wdXQoJ2Nka09wdGlvblR5cGVhaGVhZExhYmVsJykgdHlwZWFoZWFkTGFiZWw6IHN0cmluZztcblxuICAvKiogV2hldGhlciB0aGlzIG9wdGlvbiBpcyBkaXNhYmxlZC4gKi9cbiAgQElucHV0KCdjZGtPcHRpb25EaXNhYmxlZCcpXG4gIGdldCBkaXNhYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5saXN0Ym94LmRpc2FibGVkIHx8IHRoaXMuX2Rpc2FibGVkO1xuICB9XG4gIHNldCBkaXNhYmxlZCh2YWx1ZTogQm9vbGVhbklucHV0KSB7XG4gICAgdGhpcy5fZGlzYWJsZWQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG4gIHByaXZhdGUgX2Rpc2FibGVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqIFRoZSB0YWJpbmRleCBvZiB0aGUgb3B0aW9uIHdoZW4gaXQgaXMgZW5hYmxlZC4gKi9cbiAgQElucHV0KCd0YWJpbmRleCcpXG4gIGdldCBlbmFibGVkVGFiSW5kZXgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2VuYWJsZWRUYWJJbmRleCA9PT0gdW5kZWZpbmVkXG4gICAgICA/IHRoaXMubGlzdGJveC5lbmFibGVkVGFiSW5kZXhcbiAgICAgIDogdGhpcy5fZW5hYmxlZFRhYkluZGV4O1xuICB9XG4gIHNldCBlbmFibGVkVGFiSW5kZXgodmFsdWUpIHtcbiAgICB0aGlzLl9lbmFibGVkVGFiSW5kZXggPSB2YWx1ZTtcbiAgfVxuICBwcml2YXRlIF9lbmFibGVkVGFiSW5kZXg/OiBudW1iZXIgfCBudWxsO1xuXG4gIC8qKiBUaGUgb3B0aW9uJ3MgaG9zdCBlbGVtZW50ICovXG4gIHJlYWRvbmx5IGVsZW1lbnQ6IEhUTUxFbGVtZW50ID0gaW5qZWN0KEVsZW1lbnRSZWYpLm5hdGl2ZUVsZW1lbnQ7XG5cbiAgLyoqIFRoZSBwYXJlbnQgbGlzdGJveCB0aGlzIG9wdGlvbiBiZWxvbmdzIHRvLiAqL1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgbGlzdGJveDogQ2RrTGlzdGJveDxUPiA9IGluamVjdChDZGtMaXN0Ym94KTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgb3B0aW9uIGlzIGRlc3Ryb3llZC4gKi9cbiAgcHJvdGVjdGVkIGRlc3Ryb3llZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIG9wdGlvbiBpcyBjbGlja2VkLiAqL1xuICByZWFkb25seSBfY2xpY2tlZCA9IG5ldyBTdWJqZWN0PE1vdXNlRXZlbnQ+KCk7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG9wdGlvbiBpcyBjdXJyZW50bHkgYWN0aXZlLiAqL1xuICBwcml2YXRlIF9hY3RpdmUgPSBmYWxzZTtcblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLmRlc3Ryb3llZC5uZXh0KCk7XG4gICAgdGhpcy5kZXN0cm95ZWQuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIHRoaXMgb3B0aW9uIGlzIHNlbGVjdGVkLiAqL1xuICBpc1NlbGVjdGVkKCkge1xuICAgIHJldHVybiB0aGlzLmxpc3Rib3guaXNTZWxlY3RlZCh0aGlzKTtcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIHRoaXMgb3B0aW9uIGlzIGFjdGl2ZS4gKi9cbiAgaXNBY3RpdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2FjdGl2ZTtcbiAgfVxuXG4gIC8qKiBUb2dnbGUgdGhlIHNlbGVjdGVkIHN0YXRlIG9mIHRoaXMgb3B0aW9uLiAqL1xuICB0b2dnbGUoKSB7XG4gICAgdGhpcy5saXN0Ym94LnRvZ2dsZSh0aGlzKTtcbiAgfVxuXG4gIC8qKiBTZWxlY3QgdGhpcyBvcHRpb24gaWYgaXQgaXMgbm90IHNlbGVjdGVkLiAqL1xuICBzZWxlY3QoKSB7XG4gICAgdGhpcy5saXN0Ym94LnNlbGVjdCh0aGlzKTtcbiAgfVxuXG4gIC8qKiBEZXNlbGVjdCB0aGlzIG9wdGlvbiBpZiBpdCBpcyBzZWxlY3RlZC4gKi9cbiAgZGVzZWxlY3QoKSB7XG4gICAgdGhpcy5saXN0Ym94LmRlc2VsZWN0KHRoaXMpO1xuICB9XG5cbiAgLyoqIEZvY3VzIHRoaXMgb3B0aW9uLiAqL1xuICBmb2N1cygpIHtcbiAgICB0aGlzLmVsZW1lbnQuZm9jdXMoKTtcbiAgfVxuXG4gIC8qKiBHZXQgdGhlIGxhYmVsIGZvciB0aGlzIGVsZW1lbnQgd2hpY2ggaXMgcmVxdWlyZWQgYnkgdGhlIEZvY3VzYWJsZU9wdGlvbiBpbnRlcmZhY2UuICovXG4gIGdldExhYmVsKCkge1xuICAgIHJldHVybiAodGhpcy50eXBlYWhlYWRMYWJlbCA/PyB0aGlzLmVsZW1lbnQudGV4dENvbnRlbnQ/LnRyaW0oKSkgfHwgJyc7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBvcHRpb24gYXMgYWN0aXZlLlxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICBzZXRBY3RpdmVTdHlsZXMoKSB7XG4gICAgdGhpcy5fYWN0aXZlID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIG9wdGlvbiBhcyBpbmFjdGl2ZS5cbiAgICogQGRvY3MtcHJpdmF0ZVxuICAgKi9cbiAgc2V0SW5hY3RpdmVTdHlsZXMoKSB7XG4gICAgdGhpcy5fYWN0aXZlID0gZmFsc2U7XG4gIH1cblxuICAvKiogSGFuZGxlIGZvY3VzIGV2ZW50cyBvbiB0aGUgb3B0aW9uLiAqL1xuICBwcm90ZWN0ZWQgX2hhbmRsZUZvY3VzKCkge1xuICAgIC8vIE9wdGlvbnMgY2FuIHdpbmQgdXAgZ2V0dGluZyBmb2N1c2VkIGluIGFjdGl2ZSBkZXNjZW5kYW50IG1vZGUgaWYgdGhlIHVzZXIgY2xpY2tzIG9uIHRoZW0uXG4gICAgLy8gSW4gdGhpcyBjYXNlLCB3ZSBwdXNoIGZvY3VzIGJhY2sgdG8gdGhlIHBhcmVudCBsaXN0Ym94IHRvIHByZXZlbnQgYW4gZXh0cmEgdGFiIHN0b3Agd2hlblxuICAgIC8vIHRoZSB1c2VyIHBlcmZvcm1zIGEgc2hpZnQrdGFiLlxuICAgIGlmICh0aGlzLmxpc3Rib3gudXNlQWN0aXZlRGVzY2VuZGFudCkge1xuICAgICAgdGhpcy5saXN0Ym94Ll9zZXRBY3RpdmVPcHRpb24odGhpcyk7XG4gICAgICB0aGlzLmxpc3Rib3guZm9jdXMoKTtcbiAgICB9XG4gIH1cblxuICAvKiogR2V0IHRoZSB0YWJpbmRleCBmb3IgdGhpcyBvcHRpb24uICovXG4gIHByb3RlY3RlZCBfZ2V0VGFiSW5kZXgoKSB7XG4gICAgaWYgKHRoaXMubGlzdGJveC51c2VBY3RpdmVEZXNjZW5kYW50IHx8IHRoaXMuZGlzYWJsZWQpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuaXNBY3RpdmUoKSA/IHRoaXMuZW5hYmxlZFRhYkluZGV4IDogLTE7XG4gIH1cbn1cblxuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka0xpc3Rib3hdJyxcbiAgZXhwb3J0QXM6ICdjZGtMaXN0Ym94JyxcbiAgaG9zdDoge1xuICAgICdyb2xlJzogJ2xpc3Rib3gnLFxuICAgICdjbGFzcyc6ICdjZGstbGlzdGJveCcsXG4gICAgJ1tpZF0nOiAnaWQnLFxuICAgICdbYXR0ci50YWJpbmRleF0nOiAnX2dldFRhYkluZGV4KCknLFxuICAgICdbYXR0ci5hcmlhLWRpc2FibGVkXSc6ICdkaXNhYmxlZCcsXG4gICAgJ1thdHRyLmFyaWEtbXVsdGlzZWxlY3RhYmxlXSc6ICdtdWx0aXBsZScsXG4gICAgJ1thdHRyLmFyaWEtYWN0aXZlZGVzY2VuZGFudF0nOiAnX2dldEFyaWFBY3RpdmVEZXNjZW5kYW50KCknLFxuICAgICdbYXR0ci5hcmlhLW9yaWVudGF0aW9uXSc6ICdvcmllbnRhdGlvbicsXG4gICAgJyhmb2N1cyknOiAnX2hhbmRsZUZvY3VzKCknLFxuICAgICcoa2V5ZG93biknOiAnX2hhbmRsZUtleWRvd24oJGV2ZW50KScsXG4gICAgJyhmb2N1c291dCknOiAnX2hhbmRsZUZvY3VzT3V0KCRldmVudCknLFxuICB9LFxuICBwcm92aWRlcnM6IFtcbiAgICB7XG4gICAgICBwcm92aWRlOiBOR19WQUxVRV9BQ0NFU1NPUixcbiAgICAgIHVzZUV4aXN0aW5nOiBmb3J3YXJkUmVmKCgpID0+IENka0xpc3Rib3gpLFxuICAgICAgbXVsdGk6IHRydWUsXG4gICAgfSxcbiAgICB7XG4gICAgICBwcm92aWRlOiBOR19WQUxJREFUT1JTLFxuICAgICAgdXNlRXhpc3Rpbmc6IGZvcndhcmRSZWYoKCkgPT4gQ2RrTGlzdGJveCksXG4gICAgICBtdWx0aTogdHJ1ZSxcbiAgICB9LFxuICBdLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtMaXN0Ym94PFQgPSB1bmtub3duPlxuICBpbXBsZW1lbnRzIEFmdGVyQ29udGVudEluaXQsIE9uRGVzdHJveSwgQ29udHJvbFZhbHVlQWNjZXNzb3IsIFZhbGlkYXRvclxue1xuICAvKiogVGhlIGlkIG9mIHRoZSBvcHRpb24ncyBob3N0IGVsZW1lbnQuICovXG4gIEBJbnB1dCgpXG4gIGdldCBpZCgpIHtcbiAgICByZXR1cm4gdGhpcy5faWQgfHwgdGhpcy5fZ2VuZXJhdGVkSWQ7XG4gIH1cbiAgc2V0IGlkKHZhbHVlKSB7XG4gICAgdGhpcy5faWQgPSB2YWx1ZTtcbiAgfVxuICBwcml2YXRlIF9pZDogc3RyaW5nO1xuICBwcml2YXRlIF9nZW5lcmF0ZWRJZCA9IGBjZGstbGlzdGJveC0ke25leHRJZCsrfWA7XG5cbiAgLyoqIFRoZSB0YWJpbmRleCB0byB1c2Ugd2hlbiB0aGUgbGlzdGJveCBpcyBlbmFibGVkLiAqL1xuICBASW5wdXQoJ3RhYmluZGV4JylcbiAgZ2V0IGVuYWJsZWRUYWJJbmRleCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZW5hYmxlZFRhYkluZGV4ID09PSB1bmRlZmluZWQgPyAwIDogdGhpcy5fZW5hYmxlZFRhYkluZGV4O1xuICB9XG4gIHNldCBlbmFibGVkVGFiSW5kZXgodmFsdWUpIHtcbiAgICB0aGlzLl9lbmFibGVkVGFiSW5kZXggPSB2YWx1ZTtcbiAgfVxuICBwcml2YXRlIF9lbmFibGVkVGFiSW5kZXg/OiBudW1iZXIgfCBudWxsO1xuXG4gIC8qKiBUaGUgdmFsdWUgc2VsZWN0ZWQgaW4gdGhlIGxpc3Rib3gsIHJlcHJlc2VudGVkIGFzIGFuIGFycmF5IG9mIG9wdGlvbiB2YWx1ZXMuICovXG4gIEBJbnB1dCgnY2RrTGlzdGJveFZhbHVlJylcbiAgZ2V0IHZhbHVlKCk6IHJlYWRvbmx5IFRbXSB7XG4gICAgcmV0dXJuIHRoaXMuX2ludmFsaWQgPyBbXSA6IHRoaXMuc2VsZWN0aW9uTW9kZWwuc2VsZWN0ZWQ7XG4gIH1cbiAgc2V0IHZhbHVlKHZhbHVlOiByZWFkb25seSBUW10pIHtcbiAgICB0aGlzLl9zZXRTZWxlY3Rpb24odmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGxpc3Rib3ggYWxsb3dzIG11bHRpcGxlIG9wdGlvbnMgdG8gYmUgc2VsZWN0ZWQuIElmIHRoZSB2YWx1ZSBzd2l0Y2hlcyBmcm9tIGB0cnVlYFxuICAgKiB0byBgZmFsc2VgLCBhbmQgbW9yZSB0aGFuIG9uZSBvcHRpb24gaXMgc2VsZWN0ZWQsIGFsbCBvcHRpb25zIGFyZSBkZXNlbGVjdGVkLlxuICAgKi9cbiAgQElucHV0KCdjZGtMaXN0Ym94TXVsdGlwbGUnKVxuICBnZXQgbXVsdGlwbGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuc2VsZWN0aW9uTW9kZWwubXVsdGlwbGU7XG4gIH1cbiAgc2V0IG11bHRpcGxlKHZhbHVlOiBCb29sZWFuSW5wdXQpIHtcbiAgICB0aGlzLnNlbGVjdGlvbk1vZGVsLm11bHRpcGxlID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMpIHtcbiAgICAgIHRoaXMuX3VwZGF0ZUludGVybmFsVmFsdWUoKTtcbiAgICB9XG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgbGlzdGJveCBpcyBkaXNhYmxlZC4gKi9cbiAgQElucHV0KCdjZGtMaXN0Ym94RGlzYWJsZWQnKVxuICBnZXQgZGlzYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2Rpc2FibGVkO1xuICB9XG4gIHNldCBkaXNhYmxlZCh2YWx1ZTogQm9vbGVhbklucHV0KSB7XG4gICAgdGhpcy5fZGlzYWJsZWQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG4gIHByaXZhdGUgX2Rpc2FibGVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGxpc3Rib3ggd2lsbCB1c2UgYWN0aXZlIGRlc2NlbmRhbnQgb3Igd2lsbCBtb3ZlIGZvY3VzIG9udG8gdGhlIG9wdGlvbnMuICovXG4gIEBJbnB1dCgnY2RrTGlzdGJveFVzZUFjdGl2ZURlc2NlbmRhbnQnKVxuICBnZXQgdXNlQWN0aXZlRGVzY2VuZGFudCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fdXNlQWN0aXZlRGVzY2VuZGFudDtcbiAgfVxuICBzZXQgdXNlQWN0aXZlRGVzY2VuZGFudChzaG91bGRVc2VBY3RpdmVEZXNjZW5kYW50OiBCb29sZWFuSW5wdXQpIHtcbiAgICB0aGlzLl91c2VBY3RpdmVEZXNjZW5kYW50ID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHNob3VsZFVzZUFjdGl2ZURlc2NlbmRhbnQpO1xuICB9XG4gIHByaXZhdGUgX3VzZUFjdGl2ZURlc2NlbmRhbnQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogVGhlIG9yaWVudGF0aW9uIG9mIHRoZSBsaXN0Ym94LiBPbmx5IGFmZmVjdHMga2V5Ym9hcmQgaW50ZXJhY3Rpb24sIG5vdCB2aXN1YWwgbGF5b3V0LiAqL1xuICBASW5wdXQoJ2Nka0xpc3Rib3hPcmllbnRhdGlvbicpXG4gIGdldCBvcmllbnRhdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fb3JpZW50YXRpb247XG4gIH1cbiAgc2V0IG9yaWVudGF0aW9uKHZhbHVlOiAnaG9yaXpvbnRhbCcgfCAndmVydGljYWwnKSB7XG4gICAgdGhpcy5fb3JpZW50YXRpb24gPSB2YWx1ZSA9PT0gJ2hvcml6b250YWwnID8gJ2hvcml6b250YWwnIDogJ3ZlcnRpY2FsJztcbiAgICBpZiAodmFsdWUgPT09ICdob3Jpem9udGFsJykge1xuICAgICAgdGhpcy5saXN0S2V5TWFuYWdlcj8ud2l0aEhvcml6b250YWxPcmllbnRhdGlvbih0aGlzLl9kaXI/LnZhbHVlIHx8ICdsdHInKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5saXN0S2V5TWFuYWdlcj8ud2l0aFZlcnRpY2FsT3JpZW50YXRpb24oKTtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBfb3JpZW50YXRpb246ICdob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCcgPSAndmVydGljYWwnO1xuXG4gIC8qKiBUaGUgZnVuY3Rpb24gdXNlZCB0byBjb21wYXJlIG9wdGlvbiB2YWx1ZXMuICovXG4gIEBJbnB1dCgnY2RrTGlzdGJveENvbXBhcmVXaXRoJylcbiAgZ2V0IGNvbXBhcmVXaXRoKCk6IHVuZGVmaW5lZCB8ICgobzE6IFQsIG8yOiBUKSA9PiBib29sZWFuKSB7XG4gICAgcmV0dXJuIHRoaXMuc2VsZWN0aW9uTW9kZWwuY29tcGFyZVdpdGg7XG4gIH1cbiAgc2V0IGNvbXBhcmVXaXRoKGZuOiB1bmRlZmluZWQgfCAoKG8xOiBULCBvMjogVCkgPT4gYm9vbGVhbikpIHtcbiAgICB0aGlzLnNlbGVjdGlvbk1vZGVsLmNvbXBhcmVXaXRoID0gZm47XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0aGUga2V5Ym9hcmQgbmF2aWdhdGlvbiBzaG91bGQgd3JhcCB3aGVuIHRoZSB1c2VyIHByZXNzZXMgYXJyb3cgZG93biBvbiB0aGUgbGFzdCBpdGVtXG4gICAqIG9yIGFycm93IHVwIG9uIHRoZSBmaXJzdCBpdGVtLlxuICAgKi9cbiAgQElucHV0KCdjZGtMaXN0Ym94TmF2aWdhdGlvbldyYXBEaXNhYmxlZCcpXG4gIGdldCBuYXZpZ2F0aW9uV3JhcERpc2FibGVkKCkge1xuICAgIHJldHVybiB0aGlzLl9uYXZpZ2F0aW9uV3JhcERpc2FibGVkO1xuICB9XG4gIHNldCBuYXZpZ2F0aW9uV3JhcERpc2FibGVkKHdyYXA6IEJvb2xlYW5JbnB1dCkge1xuICAgIHRoaXMuX25hdmlnYXRpb25XcmFwRGlzYWJsZWQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkod3JhcCk7XG4gICAgdGhpcy5saXN0S2V5TWFuYWdlcj8ud2l0aFdyYXAoIXRoaXMuX25hdmlnYXRpb25XcmFwRGlzYWJsZWQpO1xuICB9XG4gIHByaXZhdGUgX25hdmlnYXRpb25XcmFwRGlzYWJsZWQgPSBmYWxzZTtcblxuICAvKiogV2hldGhlciBrZXlib2FyZCBuYXZpZ2F0aW9uIHNob3VsZCBza2lwIG92ZXIgZGlzYWJsZWQgaXRlbXMuICovXG4gIEBJbnB1dCgnY2RrTGlzdGJveE5hdmlnYXRlc0Rpc2FibGVkT3B0aW9ucycpXG4gIGdldCBuYXZpZ2F0ZURpc2FibGVkT3B0aW9ucygpIHtcbiAgICByZXR1cm4gdGhpcy5fbmF2aWdhdGVEaXNhYmxlZE9wdGlvbnM7XG4gIH1cbiAgc2V0IG5hdmlnYXRlRGlzYWJsZWRPcHRpb25zKHNraXA6IEJvb2xlYW5JbnB1dCkge1xuICAgIHRoaXMuX25hdmlnYXRlRGlzYWJsZWRPcHRpb25zID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHNraXApO1xuICAgIHRoaXMubGlzdEtleU1hbmFnZXI/LnNraXBQcmVkaWNhdGUoXG4gICAgICB0aGlzLl9uYXZpZ2F0ZURpc2FibGVkT3B0aW9ucyA/IHRoaXMuX3NraXBOb25lUHJlZGljYXRlIDogdGhpcy5fc2tpcERpc2FibGVkUHJlZGljYXRlLFxuICAgICk7XG4gIH1cbiAgcHJpdmF0ZSBfbmF2aWdhdGVEaXNhYmxlZE9wdGlvbnMgPSBmYWxzZTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgc2VsZWN0ZWQgdmFsdWUocykgaW4gdGhlIGxpc3Rib3ggY2hhbmdlLiAqL1xuICBAT3V0cHV0KCdjZGtMaXN0Ym94VmFsdWVDaGFuZ2UnKSByZWFkb25seSB2YWx1ZUNoYW5nZSA9IG5ldyBTdWJqZWN0PExpc3Rib3hWYWx1ZUNoYW5nZUV2ZW50PFQ+PigpO1xuXG4gIC8qKiBUaGUgY2hpbGQgb3B0aW9ucyBpbiB0aGlzIGxpc3Rib3guICovXG4gIEBDb250ZW50Q2hpbGRyZW4oQ2RrT3B0aW9uLCB7ZGVzY2VuZGFudHM6IHRydWV9KSBwcm90ZWN0ZWQgb3B0aW9uczogUXVlcnlMaXN0PENka09wdGlvbjxUPj47XG5cbiAgLyoqIFRoZSBzZWxlY3Rpb24gbW9kZWwgdXNlZCBieSB0aGUgbGlzdGJveC4gKi9cbiAgcHJvdGVjdGVkIHNlbGVjdGlvbk1vZGVsID0gbmV3IExpc3Rib3hTZWxlY3Rpb25Nb2RlbDxUPigpO1xuXG4gIC8qKiBUaGUga2V5IG1hbmFnZXIgdGhhdCBtYW5hZ2VzIGtleWJvYXJkIG5hdmlnYXRpb24gZm9yIHRoaXMgbGlzdGJveC4gKi9cbiAgcHJvdGVjdGVkIGxpc3RLZXlNYW5hZ2VyOiBBY3RpdmVEZXNjZW5kYW50S2V5TWFuYWdlcjxDZGtPcHRpb248VD4+O1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBsaXN0Ym94IGlzIGRlc3Ryb3llZC4gKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IGRlc3Ryb3llZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIFRoZSBob3N0IGVsZW1lbnQgb2YgdGhlIGxpc3Rib3guICovXG4gIHByb3RlY3RlZCByZWFkb25seSBlbGVtZW50OiBIVE1MRWxlbWVudCA9IGluamVjdChFbGVtZW50UmVmKS5uYXRpdmVFbGVtZW50O1xuXG4gIC8qKiBUaGUgY2hhbmdlIGRldGVjdG9yIGZvciB0aGlzIGxpc3Rib3guICovXG4gIHByb3RlY3RlZCByZWFkb25seSBjaGFuZ2VEZXRlY3RvclJlZiA9IGluamVjdChDaGFuZ2VEZXRlY3RvclJlZik7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCB2YWx1ZSBpbiB0aGUgc2VsZWN0aW9uIG1vZGVsIGlzIGludmFsaWQuICovXG4gIHByaXZhdGUgX2ludmFsaWQgPSBmYWxzZTtcblxuICAvKiogVGhlIGxhc3QgdXNlci10cmlnZ2VyZWQgb3B0aW9uLiAqL1xuICBwcml2YXRlIF9sYXN0VHJpZ2dlcmVkOiBDZGtPcHRpb248VD4gfCBudWxsID0gbnVsbDtcblxuICAvKiogQ2FsbGJhY2sgY2FsbGVkIHdoZW4gdGhlIGxpc3Rib3ggaGFzIGJlZW4gdG91Y2hlZCAqL1xuICBwcml2YXRlIF9vblRvdWNoZWQgPSAoKSA9PiB7fTtcblxuICAvKiogQ2FsbGJhY2sgY2FsbGVkIHdoZW4gdGhlIGxpc3Rib3ggdmFsdWUgY2hhbmdlcyAqL1xuICBwcml2YXRlIF9vbkNoYW5nZTogKHZhbHVlOiByZWFkb25seSBUW10pID0+IHZvaWQgPSAoKSA9PiB7fTtcblxuICAvKiogQ2FsbGJhY2sgY2FsbGVkIHdoZW4gdGhlIGZvcm0gdmFsaWRhdG9yIGNoYW5nZXMuICovXG4gIHByaXZhdGUgX29uVmFsaWRhdG9yQ2hhbmdlID0gKCkgPT4ge307XG5cbiAgLyoqIEVtaXRzIHdoZW4gYW4gb3B0aW9uIGhhcyBiZWVuIGNsaWNrZWQuICovXG4gIHByaXZhdGUgX29wdGlvbkNsaWNrZWQgPSBkZWZlcigoKSA9PlxuICAgICh0aGlzLm9wdGlvbnMuY2hhbmdlcyBhcyBPYnNlcnZhYmxlPENka09wdGlvbjxUPltdPikucGlwZShcbiAgICAgIHN0YXJ0V2l0aCh0aGlzLm9wdGlvbnMpLFxuICAgICAgc3dpdGNoTWFwKG9wdGlvbnMgPT5cbiAgICAgICAgbWVyZ2UoLi4ub3B0aW9ucy5tYXAob3B0aW9uID0+IG9wdGlvbi5fY2xpY2tlZC5waXBlKG1hcChldmVudCA9PiAoe29wdGlvbiwgZXZlbnR9KSkpKSksXG4gICAgICApLFxuICAgICksXG4gICk7XG5cbiAgLyoqIFRoZSBkaXJlY3Rpb25hbGl0eSBvZiB0aGUgcGFnZS4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfZGlyID0gaW5qZWN0KERpcmVjdGlvbmFsaXR5LCBJbmplY3RGbGFncy5PcHRpb25hbCk7XG5cbiAgLyoqIEEgcHJlZGljYXRlIHRoYXQgc2tpcHMgZGlzYWJsZWQgb3B0aW9ucy4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfc2tpcERpc2FibGVkUHJlZGljYXRlID0gKG9wdGlvbjogQ2RrT3B0aW9uPFQ+KSA9PiBvcHRpb24uZGlzYWJsZWQ7XG5cbiAgLyoqIEEgcHJlZGljYXRlIHRoYXQgZG9lcyBub3Qgc2tpcCBhbnkgb3B0aW9ucy4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfc2tpcE5vbmVQcmVkaWNhdGUgPSAoKSA9PiBmYWxzZTtcblxuICAvKipcbiAgICogVmFsaWRhdG9yIHRoYXQgcHJvZHVjZXMgYW4gZXJyb3IgaWYgbXVsdGlwbGUgdmFsdWVzIGFyZSBzZWxlY3RlZCBpbiBhIHNpbmdsZSBzZWxlY3Rpb25cbiAgICogbGlzdGJveC5cbiAgICogQHBhcmFtIGNvbnRyb2wgVGhlIGNvbnRyb2wgdG8gdmFsaWRhdGVcbiAgICogQHJldHVybiBBIHZhbGlkYXRpb24gZXJyb3Igb3IgbnVsbFxuICAgKi9cbiAgcHJpdmF0ZSBfdmFsaWRhdGVVbmV4cGVjdGVkTXVsdGlwbGVWYWx1ZXM6IFZhbGlkYXRvckZuID0gKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCkgPT4ge1xuICAgIGNvbnN0IGNvbnRyb2xWYWx1ZSA9IHRoaXMuX2NvZXJjZVZhbHVlKGNvbnRyb2wudmFsdWUpO1xuICAgIGlmICghdGhpcy5tdWx0aXBsZSAmJiBjb250cm9sVmFsdWUubGVuZ3RoID4gMSkge1xuICAgICAgcmV0dXJuIHsnY2RrTGlzdGJveFVuZXhwZWN0ZWRNdWx0aXBsZVZhbHVlcyc6IHRydWV9O1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfTtcblxuICAvKipcbiAgICogVmFsaWRhdG9yIHRoYXQgcHJvZHVjZXMgYW4gZXJyb3IgaWYgYW55IHNlbGVjdGVkIHZhbHVlcyBhcmUgbm90IHZhbGlkIG9wdGlvbnMgZm9yIHRoaXMgbGlzdGJveC5cbiAgICogQHBhcmFtIGNvbnRyb2wgVGhlIGNvbnRyb2wgdG8gdmFsaWRhdGVcbiAgICogQHJldHVybiBBIHZhbGlkYXRpb24gZXJyb3Igb3IgbnVsbFxuICAgKi9cbiAgcHJpdmF0ZSBfdmFsaWRhdGVVbmV4cGVjdGVkT3B0aW9uVmFsdWVzOiBWYWxpZGF0b3JGbiA9IChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wpID0+IHtcbiAgICBjb25zdCBjb250cm9sVmFsdWUgPSB0aGlzLl9jb2VyY2VWYWx1ZShjb250cm9sLnZhbHVlKTtcbiAgICBjb25zdCBpbnZhbGlkVmFsdWVzID0gdGhpcy5fZ2V0SW52YWxpZE9wdGlvblZhbHVlcyhjb250cm9sVmFsdWUpO1xuICAgIGlmIChpbnZhbGlkVmFsdWVzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHsnY2RrTGlzdGJveFVuZXhwZWN0ZWRPcHRpb25WYWx1ZXMnOiB7J3ZhbHVlcyc6IGludmFsaWRWYWx1ZXN9fTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH07XG5cbiAgLyoqIFRoZSBjb21iaW5lZCBzZXQgb2YgdmFsaWRhdG9ycyBmb3IgdGhpcyBsaXN0Ym94LiAqL1xuICBwcml2YXRlIF92YWxpZGF0b3JzID0gVmFsaWRhdG9ycy5jb21wb3NlKFtcbiAgICB0aGlzLl92YWxpZGF0ZVVuZXhwZWN0ZWRNdWx0aXBsZVZhbHVlcyxcbiAgICB0aGlzLl92YWxpZGF0ZVVuZXhwZWN0ZWRPcHRpb25WYWx1ZXMsXG4gIF0pITtcblxuICBuZ0FmdGVyQ29udGVudEluaXQoKSB7XG4gICAgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkge1xuICAgICAgdGhpcy5fdmVyaWZ5Tm9PcHRpb25WYWx1ZUNvbGxpc2lvbnMoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9pbml0S2V5TWFuYWdlcigpO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBpbnRlcm5hbCB2YWx1ZSB3aGVuZXZlciB0aGUgb3B0aW9ucyBvciB0aGUgbW9kZWwgdmFsdWUgY2hhbmdlcy5cbiAgICBtZXJnZSh0aGlzLnNlbGVjdGlvbk1vZGVsLmNoYW5nZWQsIHRoaXMub3B0aW9ucy5jaGFuZ2VzKVxuICAgICAgLnBpcGUoc3RhcnRXaXRoKG51bGwpLCB0YWtlVW50aWwodGhpcy5kZXN0cm95ZWQpKVxuICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLl91cGRhdGVJbnRlcm5hbFZhbHVlKCkpO1xuXG4gICAgdGhpcy5fb3B0aW9uQ2xpY2tlZFxuICAgICAgLnBpcGUoXG4gICAgICAgIGZpbHRlcigoe29wdGlvbn0pID0+ICFvcHRpb24uZGlzYWJsZWQpLFxuICAgICAgICB0YWtlVW50aWwodGhpcy5kZXN0cm95ZWQpLFxuICAgICAgKVxuICAgICAgLnN1YnNjcmliZSgoe29wdGlvbiwgZXZlbnR9KSA9PiB0aGlzLl9oYW5kbGVPcHRpb25DbGlja2VkKG9wdGlvbiwgZXZlbnQpKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMubGlzdEtleU1hbmFnZXIuY2hhbmdlLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5kZXN0cm95ZWQubmV4dCgpO1xuICAgIHRoaXMuZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlIHRoZSBzZWxlY3RlZCBzdGF0ZSBvZiB0aGUgZ2l2ZW4gb3B0aW9uLlxuICAgKiBAcGFyYW0gb3B0aW9uIFRoZSBvcHRpb24gdG8gdG9nZ2xlXG4gICAqL1xuICB0b2dnbGUob3B0aW9uOiBDZGtPcHRpb248VD4pIHtcbiAgICB0aGlzLnRvZ2dsZVZhbHVlKG9wdGlvbi52YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlIHRoZSBzZWxlY3RlZCBzdGF0ZSBvZiB0aGUgZ2l2ZW4gdmFsdWUuXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gdG9nZ2xlXG4gICAqL1xuICB0b2dnbGVWYWx1ZSh2YWx1ZTogVCkge1xuICAgIGlmICh0aGlzLl9pbnZhbGlkKSB7XG4gICAgICB0aGlzLnNlbGVjdGlvbk1vZGVsLmNsZWFyKGZhbHNlKTtcbiAgICB9XG4gICAgdGhpcy5zZWxlY3Rpb25Nb2RlbC50b2dnbGUodmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbGVjdCB0aGUgZ2l2ZW4gb3B0aW9uLlxuICAgKiBAcGFyYW0gb3B0aW9uIFRoZSBvcHRpb24gdG8gc2VsZWN0XG4gICAqL1xuICBzZWxlY3Qob3B0aW9uOiBDZGtPcHRpb248VD4pIHtcbiAgICB0aGlzLnNlbGVjdFZhbHVlKG9wdGlvbi52YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogU2VsZWN0IHRoZSBnaXZlbiB2YWx1ZS5cbiAgICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBzZWxlY3RcbiAgICovXG4gIHNlbGVjdFZhbHVlKHZhbHVlOiBUKSB7XG4gICAgaWYgKHRoaXMuX2ludmFsaWQpIHtcbiAgICAgIHRoaXMuc2VsZWN0aW9uTW9kZWwuY2xlYXIoZmFsc2UpO1xuICAgIH1cbiAgICB0aGlzLnNlbGVjdGlvbk1vZGVsLnNlbGVjdCh2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzZWxlY3QgdGhlIGdpdmVuIG9wdGlvbi5cbiAgICogQHBhcmFtIG9wdGlvbiBUaGUgb3B0aW9uIHRvIGRlc2VsZWN0XG4gICAqL1xuICBkZXNlbGVjdChvcHRpb246IENka09wdGlvbjxUPikge1xuICAgIHRoaXMuZGVzZWxlY3RWYWx1ZShvcHRpb24udmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc2VsZWN0IHRoZSBnaXZlbiB2YWx1ZS5cbiAgICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBkZXNlbGVjdFxuICAgKi9cbiAgZGVzZWxlY3RWYWx1ZSh2YWx1ZTogVCkge1xuICAgIGlmICh0aGlzLl9pbnZhbGlkKSB7XG4gICAgICB0aGlzLnNlbGVjdGlvbk1vZGVsLmNsZWFyKGZhbHNlKTtcbiAgICB9XG4gICAgdGhpcy5zZWxlY3Rpb25Nb2RlbC5kZXNlbGVjdCh2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBzZWxlY3RlZCBzdGF0ZSBvZiBhbGwgb3B0aW9ucy5cbiAgICogQHBhcmFtIGlzU2VsZWN0ZWQgVGhlIG5ldyBzZWxlY3RlZCBzdGF0ZSB0byBzZXRcbiAgICovXG4gIHNldEFsbFNlbGVjdGVkKGlzU2VsZWN0ZWQ6IGJvb2xlYW4pIHtcbiAgICBpZiAoIWlzU2VsZWN0ZWQpIHtcbiAgICAgIHRoaXMuc2VsZWN0aW9uTW9kZWwuY2xlYXIoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMuX2ludmFsaWQpIHtcbiAgICAgICAgdGhpcy5zZWxlY3Rpb25Nb2RlbC5jbGVhcihmYWxzZSk7XG4gICAgICB9XG4gICAgICB0aGlzLnNlbGVjdGlvbk1vZGVsLnNlbGVjdCguLi50aGlzLm9wdGlvbnMubWFwKG9wdGlvbiA9PiBvcHRpb24udmFsdWUpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IHdoZXRoZXIgdGhlIGdpdmVuIG9wdGlvbiBpcyBzZWxlY3RlZC5cbiAgICogQHBhcmFtIG9wdGlvbiBUaGUgb3B0aW9uIHRvIGdldCB0aGUgc2VsZWN0ZWQgc3RhdGUgb2ZcbiAgICovXG4gIGlzU2VsZWN0ZWQob3B0aW9uOiBDZGtPcHRpb248VD4pIHtcbiAgICByZXR1cm4gdGhpcy5pc1ZhbHVlU2VsZWN0ZWQob3B0aW9uLnZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgd2hldGhlciB0aGUgZ2l2ZW4gdmFsdWUgaXMgc2VsZWN0ZWQuXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gZ2V0IHRoZSBzZWxlY3RlZCBzdGF0ZSBvZlxuICAgKi9cbiAgaXNWYWx1ZVNlbGVjdGVkKHZhbHVlOiBUKSB7XG4gICAgaWYgKHRoaXMuX2ludmFsaWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuc2VsZWN0aW9uTW9kZWwuaXNTZWxlY3RlZCh2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGEgY2FsbGJhY2sgdG8gYmUgaW52b2tlZCB3aGVuIHRoZSBsaXN0Ym94J3MgdmFsdWUgY2hhbmdlcyBmcm9tIHVzZXIgaW5wdXQuXG4gICAqIEBwYXJhbSBmbiBUaGUgY2FsbGJhY2sgdG8gcmVnaXN0ZXJcbiAgICogQGRvY3MtcHJpdmF0ZVxuICAgKi9cbiAgcmVnaXN0ZXJPbkNoYW5nZShmbjogKHZhbHVlOiByZWFkb25seSBUW10pID0+IHZvaWQpOiB2b2lkIHtcbiAgICB0aGlzLl9vbkNoYW5nZSA9IGZuO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBhIGNhbGxiYWNrIHRvIGJlIGludm9rZWQgd2hlbiB0aGUgbGlzdGJveCBpcyBibHVycmVkIGJ5IHRoZSB1c2VyLlxuICAgKiBAcGFyYW0gZm4gVGhlIGNhbGxiYWNrIHRvIHJlZ2lzdGVyXG4gICAqIEBkb2NzLXByaXZhdGVcbiAgICovXG4gIHJlZ2lzdGVyT25Ub3VjaGVkKGZuOiAoKSA9PiB7fSk6IHZvaWQge1xuICAgIHRoaXMuX29uVG91Y2hlZCA9IGZuO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGxpc3Rib3gncyB2YWx1ZS5cbiAgICogQHBhcmFtIHZhbHVlIFRoZSBuZXcgdmFsdWUgb2YgdGhlIGxpc3Rib3hcbiAgICogQGRvY3MtcHJpdmF0ZVxuICAgKi9cbiAgd3JpdGVWYWx1ZSh2YWx1ZTogcmVhZG9ubHkgVFtdKTogdm9pZCB7XG4gICAgdGhpcy5fc2V0U2VsZWN0aW9uKHZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBkaXNhYmxlZCBzdGF0ZSBvZiB0aGUgbGlzdGJveC5cbiAgICogQHBhcmFtIGlzRGlzYWJsZWQgVGhlIG5ldyBkaXNhYmxlZCBzdGF0ZVxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICBzZXREaXNhYmxlZFN0YXRlKGlzRGlzYWJsZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICB0aGlzLmRpc2FibGVkID0gaXNEaXNhYmxlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGUgZ2l2ZW4gY29udHJvbFxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICB2YWxpZGF0ZShjb250cm9sOiBBYnN0cmFjdENvbnRyb2w8YW55LCBhbnk+KTogVmFsaWRhdGlvbkVycm9ycyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLl92YWxpZGF0b3JzKGNvbnRyb2wpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBhIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBmb3JtIHZhbGlkYXRvciBjaGFuZ2VzLlxuICAgKiBAcGFyYW0gZm4gVGhlIGNhbGxiYWNrIHRvIGNhbGxcbiAgICogQGRvY3MtcHJpdmF0ZVxuICAgKi9cbiAgcmVnaXN0ZXJPblZhbGlkYXRvckNoYW5nZShmbjogKCkgPT4gdm9pZCkge1xuICAgIHRoaXMuX29uVmFsaWRhdG9yQ2hhbmdlID0gZm47XG4gIH1cblxuICAvKiogRm9jdXMgdGhlIGxpc3Rib3gncyBob3N0IGVsZW1lbnQuICovXG4gIGZvY3VzKCkge1xuICAgIHRoaXMuZWxlbWVudC5mb2N1cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyaWdnZXJzIHRoZSBnaXZlbiBvcHRpb24gaW4gcmVzcG9uc2UgdG8gdXNlciBpbnRlcmFjdGlvbi5cbiAgICogLSBJbiBzaW5nbGUgc2VsZWN0aW9uIG1vZGU6IHNlbGVjdHMgdGhlIG9wdGlvbiBhbmQgZGVzZWxlY3RzIGFueSBvdGhlciBzZWxlY3RlZCBvcHRpb24uXG4gICAqIC0gSW4gbXVsdGkgc2VsZWN0aW9uIG1vZGU6IHRvZ2dsZXMgdGhlIHNlbGVjdGVkIHN0YXRlIG9mIHRoZSBvcHRpb24uXG4gICAqIEBwYXJhbSBvcHRpb24gVGhlIG9wdGlvbiB0byB0cmlnZ2VyXG4gICAqL1xuICBwcm90ZWN0ZWQgdHJpZ2dlck9wdGlvbihvcHRpb246IENka09wdGlvbjxUPiB8IG51bGwpIHtcbiAgICBpZiAob3B0aW9uICYmICFvcHRpb24uZGlzYWJsZWQpIHtcbiAgICAgIHRoaXMuX2xhc3RUcmlnZ2VyZWQgPSBvcHRpb247XG4gICAgICBjb25zdCBjaGFuZ2VkID0gdGhpcy5tdWx0aXBsZVxuICAgICAgICA/IHRoaXMuc2VsZWN0aW9uTW9kZWwudG9nZ2xlKG9wdGlvbi52YWx1ZSlcbiAgICAgICAgOiB0aGlzLnNlbGVjdGlvbk1vZGVsLnNlbGVjdChvcHRpb24udmFsdWUpO1xuICAgICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgICAgdGhpcy5fb25DaGFuZ2UodGhpcy52YWx1ZSk7XG4gICAgICAgIHRoaXMudmFsdWVDaGFuZ2UubmV4dCh7XG4gICAgICAgICAgdmFsdWU6IHRoaXMudmFsdWUsXG4gICAgICAgICAgbGlzdGJveDogdGhpcyxcbiAgICAgICAgICBvcHRpb246IG9wdGlvbixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRyaWdnZXIgdGhlIGdpdmVuIHJhbmdlIG9mIG9wdGlvbnMgaW4gcmVzcG9uc2UgdG8gdXNlciBpbnRlcmFjdGlvbi5cbiAgICogU2hvdWxkIG9ubHkgYmUgY2FsbGVkIGluIG11bHRpLXNlbGVjdGlvbiBtb2RlLlxuICAgKiBAcGFyYW0gdHJpZ2dlciBUaGUgb3B0aW9uIHRoYXQgd2FzIHRyaWdnZXJlZFxuICAgKiBAcGFyYW0gZnJvbSBUaGUgc3RhcnQgaW5kZXggb2YgdGhlIG9wdGlvbnMgdG8gdG9nZ2xlXG4gICAqIEBwYXJhbSB0byBUaGUgZW5kIGluZGV4IG9mIHRoZSBvcHRpb25zIHRvIHRvZ2dsZVxuICAgKiBAcGFyYW0gb24gV2hldGhlciB0byB0b2dnbGUgdGhlIG9wdGlvbiByYW5nZSBvblxuICAgKi9cbiAgcHJvdGVjdGVkIHRyaWdnZXJSYW5nZSh0cmlnZ2VyOiBDZGtPcHRpb248VD4gfCBudWxsLCBmcm9tOiBudW1iZXIsIHRvOiBudW1iZXIsIG9uOiBib29sZWFuKSB7XG4gICAgaWYgKHRoaXMuZGlzYWJsZWQgfHwgKHRyaWdnZXIgJiYgdHJpZ2dlci5kaXNhYmxlZCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fbGFzdFRyaWdnZXJlZCA9IHRyaWdnZXI7XG4gICAgY29uc3QgaXNFcXVhbCA9IHRoaXMuY29tcGFyZVdpdGggPz8gT2JqZWN0LmlzO1xuICAgIGNvbnN0IHVwZGF0ZVZhbHVlcyA9IFsuLi50aGlzLm9wdGlvbnNdXG4gICAgICAuc2xpY2UoTWF0aC5tYXgoMCwgTWF0aC5taW4oZnJvbSwgdG8pKSwgTWF0aC5taW4odGhpcy5vcHRpb25zLmxlbmd0aCwgTWF0aC5tYXgoZnJvbSwgdG8pICsgMSkpXG4gICAgICAuZmlsdGVyKG9wdGlvbiA9PiAhb3B0aW9uLmRpc2FibGVkKVxuICAgICAgLm1hcChvcHRpb24gPT4gb3B0aW9uLnZhbHVlKTtcbiAgICBjb25zdCBzZWxlY3RlZCA9IFsuLi50aGlzLnZhbHVlXTtcbiAgICBmb3IgKGNvbnN0IHVwZGF0ZVZhbHVlIG9mIHVwZGF0ZVZhbHVlcykge1xuICAgICAgY29uc3Qgc2VsZWN0ZWRJbmRleCA9IHNlbGVjdGVkLmZpbmRJbmRleChzZWxlY3RlZFZhbHVlID0+XG4gICAgICAgIGlzRXF1YWwoc2VsZWN0ZWRWYWx1ZSwgdXBkYXRlVmFsdWUpLFxuICAgICAgKTtcbiAgICAgIGlmIChvbiAmJiBzZWxlY3RlZEluZGV4ID09PSAtMSkge1xuICAgICAgICBzZWxlY3RlZC5wdXNoKHVwZGF0ZVZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAoIW9uICYmIHNlbGVjdGVkSW5kZXggIT09IC0xKSB7XG4gICAgICAgIHNlbGVjdGVkLnNwbGljZShzZWxlY3RlZEluZGV4LCAxKTtcbiAgICAgIH1cbiAgICB9XG4gICAgbGV0IGNoYW5nZWQgPSB0aGlzLnNlbGVjdGlvbk1vZGVsLnNldFNlbGVjdGlvbiguLi5zZWxlY3RlZCk7XG4gICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgIHRoaXMuX29uQ2hhbmdlKHRoaXMudmFsdWUpO1xuICAgICAgdGhpcy52YWx1ZUNoYW5nZS5uZXh0KHtcbiAgICAgICAgdmFsdWU6IHRoaXMudmFsdWUsXG4gICAgICAgIGxpc3Rib3g6IHRoaXMsXG4gICAgICAgIG9wdGlvbjogdHJpZ2dlcixcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBnaXZlbiBvcHRpb24gYXMgYWN0aXZlLlxuICAgKiBAcGFyYW0gb3B0aW9uIFRoZSBvcHRpb24gdG8gbWFrZSBhY3RpdmVcbiAgICovXG4gIF9zZXRBY3RpdmVPcHRpb24ob3B0aW9uOiBDZGtPcHRpb248VD4pIHtcbiAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyLnNldEFjdGl2ZUl0ZW0ob3B0aW9uKTtcbiAgfVxuXG4gIC8qKiBDYWxsZWQgd2hlbiB0aGUgbGlzdGJveCByZWNlaXZlcyBmb2N1cy4gKi9cbiAgcHJvdGVjdGVkIF9oYW5kbGVGb2N1cygpIHtcbiAgICBpZiAoIXRoaXMudXNlQWN0aXZlRGVzY2VuZGFudCkge1xuICAgICAgdGhpcy5saXN0S2V5TWFuYWdlci5zZXROZXh0SXRlbUFjdGl2ZSgpO1xuICAgICAgdGhpcy5fZm9jdXNBY3RpdmVPcHRpb24oKTtcbiAgICB9XG4gIH1cblxuICAvKiogQ2FsbGVkIHdoZW4gdGhlIHVzZXIgcHJlc3NlcyBrZXlkb3duIG9uIHRoZSBsaXN0Ym94LiAqL1xuICBwcm90ZWN0ZWQgX2hhbmRsZUtleWRvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcbiAgICBpZiAodGhpcy5fZGlzYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB7a2V5Q29kZX0gPSBldmVudDtcbiAgICBjb25zdCBwcmV2aW91c0FjdGl2ZUluZGV4ID0gdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtSW5kZXg7XG4gICAgY29uc3QgY3RybEtleXMgPSBbJ2N0cmxLZXknLCAnbWV0YUtleSddIGFzIGNvbnN0O1xuXG4gICAgaWYgKHRoaXMubXVsdGlwbGUgJiYga2V5Q29kZSA9PT0gQSAmJiBoYXNNb2RpZmllcktleShldmVudCwgLi4uY3RybEtleXMpKSB7XG4gICAgICAvLyBUb2dnbGUgYWxsIG9wdGlvbnMgb2ZmIGlmIHRoZXkncmUgYWxsIHNlbGVjdGVkLCBvdGhlcndpc2UgdG9nZ2xlIHRoZW0gYWxsIG9uLlxuICAgICAgdGhpcy50cmlnZ2VyUmFuZ2UoXG4gICAgICAgIG51bGwsXG4gICAgICAgIDAsXG4gICAgICAgIHRoaXMub3B0aW9ucy5sZW5ndGggLSAxLFxuICAgICAgICB0aGlzLm9wdGlvbnMubGVuZ3RoICE9PSB0aGlzLnZhbHVlLmxlbmd0aCxcbiAgICAgICk7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgIHRoaXMubXVsdGlwbGUgJiZcbiAgICAgIChrZXlDb2RlID09PSBTUEFDRSB8fCBrZXlDb2RlID09PSBFTlRFUikgJiZcbiAgICAgIGhhc01vZGlmaWVyS2V5KGV2ZW50LCAnc2hpZnRLZXknKVxuICAgICkge1xuICAgICAgaWYgKHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbSAmJiB0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleCAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMudHJpZ2dlclJhbmdlKFxuICAgICAgICAgIHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbSxcbiAgICAgICAgICB0aGlzLl9nZXRMYXN0VHJpZ2dlcmVkSW5kZXgoKSA/PyB0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleCxcbiAgICAgICAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleCxcbiAgICAgICAgICAhdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtLmlzU2VsZWN0ZWQoKSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgdGhpcy5tdWx0aXBsZSAmJlxuICAgICAga2V5Q29kZSA9PT0gSE9NRSAmJlxuICAgICAgaGFzTW9kaWZpZXJLZXkoZXZlbnQsIC4uLmN0cmxLZXlzKSAmJlxuICAgICAgaGFzTW9kaWZpZXJLZXkoZXZlbnQsICdzaGlmdEtleScpXG4gICAgKSB7XG4gICAgICBjb25zdCB0cmlnZ2VyID0gdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtO1xuICAgICAgaWYgKHRyaWdnZXIpIHtcbiAgICAgICAgY29uc3QgZnJvbSA9IHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbUluZGV4ITtcbiAgICAgICAgdGhpcy5saXN0S2V5TWFuYWdlci5zZXRGaXJzdEl0ZW1BY3RpdmUoKTtcbiAgICAgICAgdGhpcy50cmlnZ2VyUmFuZ2UoXG4gICAgICAgICAgdHJpZ2dlcixcbiAgICAgICAgICBmcm9tLFxuICAgICAgICAgIHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbUluZGV4ISxcbiAgICAgICAgICAhdHJpZ2dlci5pc1NlbGVjdGVkKCksXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgIHRoaXMubXVsdGlwbGUgJiZcbiAgICAgIGtleUNvZGUgPT09IEVORCAmJlxuICAgICAgaGFzTW9kaWZpZXJLZXkoZXZlbnQsIC4uLmN0cmxLZXlzKSAmJlxuICAgICAgaGFzTW9kaWZpZXJLZXkoZXZlbnQsICdzaGlmdEtleScpXG4gICAgKSB7XG4gICAgICBjb25zdCB0cmlnZ2VyID0gdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtO1xuICAgICAgaWYgKHRyaWdnZXIpIHtcbiAgICAgICAgY29uc3QgZnJvbSA9IHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbUluZGV4ITtcbiAgICAgICAgdGhpcy5saXN0S2V5TWFuYWdlci5zZXRMYXN0SXRlbUFjdGl2ZSgpO1xuICAgICAgICB0aGlzLnRyaWdnZXJSYW5nZShcbiAgICAgICAgICB0cmlnZ2VyLFxuICAgICAgICAgIGZyb20sXG4gICAgICAgICAgdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtSW5kZXghLFxuICAgICAgICAgICF0cmlnZ2VyLmlzU2VsZWN0ZWQoKSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGtleUNvZGUgPT09IFNQQUNFIHx8IGtleUNvZGUgPT09IEVOVEVSKSB7XG4gICAgICB0aGlzLnRyaWdnZXJPcHRpb24odGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtKTtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaXNOYXZLZXkgPVxuICAgICAga2V5Q29kZSA9PT0gVVBfQVJST1cgfHxcbiAgICAgIGtleUNvZGUgPT09IERPV05fQVJST1cgfHxcbiAgICAgIGtleUNvZGUgPT09IExFRlRfQVJST1cgfHxcbiAgICAgIGtleUNvZGUgPT09IFJJR0hUX0FSUk9XIHx8XG4gICAgICBrZXlDb2RlID09PSBIT01FIHx8XG4gICAgICBrZXlDb2RlID09PSBFTkQ7XG4gICAgdGhpcy5saXN0S2V5TWFuYWdlci5vbktleWRvd24oZXZlbnQpO1xuICAgIC8vIFdpbGwgc2VsZWN0IGFuIG9wdGlvbiBpZiBzaGlmdCB3YXMgcHJlc3NlZCB3aGlsZSBuYXZpZ2F0aW5nIHRvIHRoZSBvcHRpb25cbiAgICBpZiAoaXNOYXZLZXkgJiYgZXZlbnQuc2hpZnRLZXkgJiYgcHJldmlvdXNBY3RpdmVJbmRleCAhPT0gdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtSW5kZXgpIHtcbiAgICAgIHRoaXMudHJpZ2dlck9wdGlvbih0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsZWQgd2hlbiB0aGUgZm9jdXMgbGVhdmVzIGFuIGVsZW1lbnQgaW4gdGhlIGxpc3Rib3guXG4gICAqIEBwYXJhbSBldmVudCBUaGUgZm9jdXNvdXQgZXZlbnRcbiAgICovXG4gIHByb3RlY3RlZCBfaGFuZGxlRm9jdXNPdXQoZXZlbnQ6IEZvY3VzRXZlbnQpIHtcbiAgICBjb25zdCBvdGhlckVsZW1lbnQgPSBldmVudC5yZWxhdGVkVGFyZ2V0IGFzIEVsZW1lbnQ7XG4gICAgaWYgKHRoaXMuZWxlbWVudCAhPT0gb3RoZXJFbGVtZW50ICYmICF0aGlzLmVsZW1lbnQuY29udGFpbnMob3RoZXJFbGVtZW50KSkge1xuICAgICAgdGhpcy5fb25Ub3VjaGVkKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEdldCB0aGUgaWQgb2YgdGhlIGFjdGl2ZSBvcHRpb24gaWYgYWN0aXZlIGRlc2NlbmRhbnQgaXMgYmVpbmcgdXNlZC4gKi9cbiAgcHJvdGVjdGVkIF9nZXRBcmlhQWN0aXZlRGVzY2VuZGFudCgpOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fdXNlQWN0aXZlRGVzY2VuZGFudCA/IHRoaXMubGlzdEtleU1hbmFnZXI/LmFjdGl2ZUl0ZW0/LmlkIDogbnVsbDtcbiAgfVxuXG4gIC8qKiBHZXQgdGhlIHRhYmluZGV4IGZvciB0aGUgbGlzdGJveC4gKi9cbiAgcHJvdGVjdGVkIF9nZXRUYWJJbmRleCgpIHtcbiAgICBpZiAodGhpcy5kaXNhYmxlZCkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy51c2VBY3RpdmVEZXNjZW5kYW50IHx8ICF0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW0gPyB0aGlzLmVuYWJsZWRUYWJJbmRleCA6IC0xO1xuICB9XG5cbiAgLyoqIEluaXRpYWxpemUgdGhlIGtleSBtYW5hZ2VyLiAqL1xuICBwcml2YXRlIF9pbml0S2V5TWFuYWdlcigpIHtcbiAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyID0gbmV3IEFjdGl2ZURlc2NlbmRhbnRLZXlNYW5hZ2VyKHRoaXMub3B0aW9ucylcbiAgICAgIC53aXRoV3JhcCghdGhpcy5fbmF2aWdhdGlvbldyYXBEaXNhYmxlZClcbiAgICAgIC53aXRoVHlwZUFoZWFkKClcbiAgICAgIC53aXRoSG9tZUFuZEVuZCgpXG4gICAgICAud2l0aEFsbG93ZWRNb2RpZmllcktleXMoWydzaGlmdEtleSddKVxuICAgICAgLnNraXBQcmVkaWNhdGUoXG4gICAgICAgIHRoaXMuX25hdmlnYXRlRGlzYWJsZWRPcHRpb25zID8gdGhpcy5fc2tpcE5vbmVQcmVkaWNhdGUgOiB0aGlzLl9za2lwRGlzYWJsZWRQcmVkaWNhdGUsXG4gICAgICApO1xuXG4gICAgaWYgKHRoaXMub3JpZW50YXRpb24gPT09ICd2ZXJ0aWNhbCcpIHtcbiAgICAgIHRoaXMubGlzdEtleU1hbmFnZXIud2l0aFZlcnRpY2FsT3JpZW50YXRpb24oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5saXN0S2V5TWFuYWdlci53aXRoSG9yaXpvbnRhbE9yaWVudGF0aW9uKHRoaXMuX2Rpcj8udmFsdWUgfHwgJ2x0cicpO1xuICAgIH1cblxuICAgIHRoaXMubGlzdEtleU1hbmFnZXIuY2hhbmdlXG4gICAgICAucGlwZSh0YWtlVW50aWwodGhpcy5kZXN0cm95ZWQpKVxuICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9mb2N1c0FjdGl2ZU9wdGlvbigpKTtcbiAgfVxuXG4gIC8qKiBGb2N1cyB0aGUgYWN0aXZlIG9wdGlvbi4gKi9cbiAgcHJpdmF0ZSBfZm9jdXNBY3RpdmVPcHRpb24oKSB7XG4gICAgaWYgKCF0aGlzLnVzZUFjdGl2ZURlc2NlbmRhbnQpIHtcbiAgICAgIHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbT8uZm9jdXMoKTtcbiAgICB9XG4gICAgdGhpcy5jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIHNlbGVjdGVkIHZhbHVlcy5cbiAgICogQHBhcmFtIHZhbHVlIFRoZSBsaXN0IG9mIG5ldyBzZWxlY3RlZCB2YWx1ZXMuXG4gICAqL1xuICBwcml2YXRlIF9zZXRTZWxlY3Rpb24odmFsdWU6IHJlYWRvbmx5IFRbXSkge1xuICAgIGlmICh0aGlzLl9pbnZhbGlkKSB7XG4gICAgICB0aGlzLnNlbGVjdGlvbk1vZGVsLmNsZWFyKGZhbHNlKTtcbiAgICB9XG4gICAgdGhpcy5zZWxlY3Rpb25Nb2RlbC5zZXRTZWxlY3Rpb24oLi4udGhpcy5fY29lcmNlVmFsdWUodmFsdWUpKTtcbiAgfVxuXG4gIC8qKiBVcGRhdGUgdGhlIGludGVybmFsIHZhbHVlIG9mIHRoZSBsaXN0Ym94IGJhc2VkIG9uIHRoZSBzZWxlY3Rpb24gbW9kZWwuICovXG4gIHByaXZhdGUgX3VwZGF0ZUludGVybmFsVmFsdWUoKSB7XG4gICAgY29uc3QgaW5kZXhDYWNoZSA9IG5ldyBNYXA8VCwgbnVtYmVyPigpO1xuICAgIHRoaXMuc2VsZWN0aW9uTW9kZWwuc29ydCgoYTogVCwgYjogVCkgPT4ge1xuICAgICAgY29uc3QgYUluZGV4ID0gdGhpcy5fZ2V0SW5kZXhGb3JWYWx1ZShpbmRleENhY2hlLCBhKTtcbiAgICAgIGNvbnN0IGJJbmRleCA9IHRoaXMuX2dldEluZGV4Rm9yVmFsdWUoaW5kZXhDYWNoZSwgYik7XG4gICAgICByZXR1cm4gYUluZGV4IC0gYkluZGV4O1xuICAgIH0pO1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3Rpb25Nb2RlbC5zZWxlY3RlZDtcbiAgICB0aGlzLl9pbnZhbGlkID1cbiAgICAgICghdGhpcy5tdWx0aXBsZSAmJiBzZWxlY3RlZC5sZW5ndGggPiAxKSB8fCAhIXRoaXMuX2dldEludmFsaWRPcHRpb25WYWx1ZXMoc2VsZWN0ZWQpLmxlbmd0aDtcbiAgICB0aGlzLl9vblZhbGlkYXRvckNoYW5nZSgpO1xuICAgIHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW5kZXggb2YgdGhlIGdpdmVuIHZhbHVlIGluIHRoZSBnaXZlbiBsaXN0IG9mIG9wdGlvbnMuXG4gICAqIEBwYXJhbSBjYWNoZSBUaGUgY2FjaGUgb2YgaW5kaWNlcyBmb3VuZCBzbyBmYXJcbiAgICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBmaW5kXG4gICAqIEByZXR1cm4gVGhlIGluZGV4IG9mIHRoZSB2YWx1ZSBpbiB0aGUgb3B0aW9ucyBsaXN0XG4gICAqL1xuICBwcml2YXRlIF9nZXRJbmRleEZvclZhbHVlKGNhY2hlOiBNYXA8VCwgbnVtYmVyPiwgdmFsdWU6IFQpIHtcbiAgICBjb25zdCBpc0VxdWFsID0gdGhpcy5jb21wYXJlV2l0aCB8fCBPYmplY3QuaXM7XG4gICAgaWYgKCFjYWNoZS5oYXModmFsdWUpKSB7XG4gICAgICBsZXQgaW5kZXggPSAtMTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5vcHRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChpc0VxdWFsKHZhbHVlLCB0aGlzLm9wdGlvbnMuZ2V0KGkpIS52YWx1ZSkpIHtcbiAgICAgICAgICBpbmRleCA9IGk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNhY2hlLnNldCh2YWx1ZSwgaW5kZXgpO1xuICAgIH1cbiAgICByZXR1cm4gY2FjaGUuZ2V0KHZhbHVlKSE7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlIHRoZSB1c2VyIGNsaWNraW5nIGFuIG9wdGlvbi5cbiAgICogQHBhcmFtIG9wdGlvbiBUaGUgb3B0aW9uIHRoYXQgd2FzIGNsaWNrZWQuXG4gICAqL1xuICBwcml2YXRlIF9oYW5kbGVPcHRpb25DbGlja2VkKG9wdGlvbjogQ2RrT3B0aW9uPFQ+LCBldmVudDogTW91c2VFdmVudCkge1xuICAgIHRoaXMubGlzdEtleU1hbmFnZXIuc2V0QWN0aXZlSXRlbShvcHRpb24pO1xuICAgIGlmIChldmVudC5zaGlmdEtleSAmJiB0aGlzLm11bHRpcGxlKSB7XG4gICAgICB0aGlzLnRyaWdnZXJSYW5nZShcbiAgICAgICAgb3B0aW9uLFxuICAgICAgICB0aGlzLl9nZXRMYXN0VHJpZ2dlcmVkSW5kZXgoKSA/PyB0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleCEsXG4gICAgICAgIHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbUluZGV4ISxcbiAgICAgICAgIW9wdGlvbi5pc1NlbGVjdGVkKCksXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnRyaWdnZXJPcHRpb24ob3B0aW9uKTtcbiAgICB9XG4gIH1cblxuICAvKiogVmVyaWZpZXMgdGhhdCBubyB0d28gb3B0aW9ucyByZXByZXNlbnQgdGhlIHNhbWUgdmFsdWUgdW5kZXIgdGhlIGNvbXBhcmVXaXRoIGZ1bmN0aW9uLiAqL1xuICBwcml2YXRlIF92ZXJpZnlOb09wdGlvblZhbHVlQ29sbGlzaW9ucygpIHtcbiAgICB0aGlzLm9wdGlvbnMuY2hhbmdlcy5waXBlKHN0YXJ0V2l0aCh0aGlzLm9wdGlvbnMpLCB0YWtlVW50aWwodGhpcy5kZXN0cm95ZWQpKS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgY29uc3QgaXNFcXVhbCA9IHRoaXMuY29tcGFyZVdpdGggPz8gT2JqZWN0LmlzO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm9wdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3Qgb3B0aW9uID0gdGhpcy5vcHRpb25zLmdldChpKSE7XG4gICAgICAgIGxldCBkdXBsaWNhdGU6IENka09wdGlvbjxUPiB8IG51bGwgPSBudWxsO1xuICAgICAgICBmb3IgKGxldCBqID0gaSArIDE7IGogPCB0aGlzLm9wdGlvbnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBjb25zdCBvdGhlciA9IHRoaXMub3B0aW9ucy5nZXQoaikhO1xuICAgICAgICAgIGlmIChpc0VxdWFsKG9wdGlvbi52YWx1ZSwgb3RoZXIudmFsdWUpKSB7XG4gICAgICAgICAgICBkdXBsaWNhdGUgPSBvdGhlcjtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZHVwbGljYXRlKSB7XG4gICAgICAgICAgLy8gVE9ETyhtbWFsZXJiYSk6IExpbmsgdG8gZG9jcyBhYm91dCB0aGlzLlxuICAgICAgICAgIGlmICh0aGlzLmNvbXBhcmVXaXRoKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICAgIGBGb3VuZCBtdWx0aXBsZSBDZGtPcHRpb24gcmVwcmVzZW50aW5nIHRoZSBzYW1lIHZhbHVlIHVuZGVyIHRoZSBnaXZlbiBjb21wYXJlV2l0aCBmdW5jdGlvbmAsXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBvcHRpb24xOiBvcHRpb24uZWxlbWVudCxcbiAgICAgICAgICAgICAgICBvcHRpb24yOiBkdXBsaWNhdGUuZWxlbWVudCxcbiAgICAgICAgICAgICAgICBjb21wYXJlV2l0aDogdGhpcy5jb21wYXJlV2l0aCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgRm91bmQgbXVsdGlwbGUgQ2RrT3B0aW9uIHdpdGggdGhlIHNhbWUgdmFsdWVgLCB7XG4gICAgICAgICAgICAgIG9wdGlvbjE6IG9wdGlvbi5lbGVtZW50LFxuICAgICAgICAgICAgICBvcHRpb24yOiBkdXBsaWNhdGUuZWxlbWVudCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb2VyY2VzIGEgdmFsdWUgaW50byBhbiBhcnJheSByZXByZXNlbnRpbmcgYSBsaXN0Ym94IHNlbGVjdGlvbi5cbiAgICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBjb2VyY2VcbiAgICogQHJldHVybiBBbiBhcnJheVxuICAgKi9cbiAgcHJpdmF0ZSBfY29lcmNlVmFsdWUodmFsdWU6IHJlYWRvbmx5IFRbXSkge1xuICAgIHJldHVybiB2YWx1ZSA9PSBudWxsID8gW10gOiBjb2VyY2VBcnJheSh2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBzdWJsaXN0IG9mIHZhbHVlcyB0aGF0IGRvIG5vdCByZXByZXNlbnQgdmFsaWQgb3B0aW9uIHZhbHVlcyBpbiB0aGlzIGxpc3Rib3guXG4gICAqIEBwYXJhbSB2YWx1ZXMgVGhlIGxpc3Qgb2YgdmFsdWVzXG4gICAqIEByZXR1cm4gVGhlIHN1Ymxpc3Qgb2YgdmFsdWVzIHRoYXQgYXJlIG5vdCB2YWxpZCBvcHRpb24gdmFsdWVzXG4gICAqL1xuICBwcml2YXRlIF9nZXRJbnZhbGlkT3B0aW9uVmFsdWVzKHZhbHVlczogcmVhZG9ubHkgVFtdKSB7XG4gICAgY29uc3QgaXNFcXVhbCA9IHRoaXMuY29tcGFyZVdpdGggfHwgT2JqZWN0LmlzO1xuICAgIGNvbnN0IHZhbGlkVmFsdWVzID0gKHRoaXMub3B0aW9ucyB8fCBbXSkubWFwKG9wdGlvbiA9PiBvcHRpb24udmFsdWUpO1xuICAgIHJldHVybiB2YWx1ZXMuZmlsdGVyKHZhbHVlID0+ICF2YWxpZFZhbHVlcy5zb21lKHZhbGlkVmFsdWUgPT4gaXNFcXVhbCh2YWx1ZSwgdmFsaWRWYWx1ZSkpKTtcbiAgfVxuXG4gIC8qKiBHZXQgdGhlIGluZGV4IG9mIHRoZSBsYXN0IHRyaWdnZXJlZCBvcHRpb24uICovXG4gIHByaXZhdGUgX2dldExhc3RUcmlnZ2VyZWRJbmRleCgpIHtcbiAgICBjb25zdCBpbmRleCA9IHRoaXMub3B0aW9ucy50b0FycmF5KCkuaW5kZXhPZih0aGlzLl9sYXN0VHJpZ2dlcmVkISk7XG4gICAgcmV0dXJuIGluZGV4ID09PSAtMSA/IG51bGwgOiBpbmRleDtcbiAgfVxufVxuXG4vKiogQ2hhbmdlIGV2ZW50IHRoYXQgaXMgZmlyZWQgd2hlbmV2ZXIgdGhlIHZhbHVlIG9mIHRoZSBsaXN0Ym94IGNoYW5nZXMuICovXG5leHBvcnQgaW50ZXJmYWNlIExpc3Rib3hWYWx1ZUNoYW5nZUV2ZW50PFQ+IHtcbiAgLyoqIFRoZSBuZXcgdmFsdWUgb2YgdGhlIGxpc3Rib3guICovXG4gIHJlYWRvbmx5IHZhbHVlOiByZWFkb25seSBUW107XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgbGlzdGJveCB0aGF0IGVtaXR0ZWQgdGhlIGV2ZW50LiAqL1xuICByZWFkb25seSBsaXN0Ym94OiBDZGtMaXN0Ym94PFQ+O1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIG9wdGlvbiB0aGF0IHdhcyB0cmlnZ2VyZWQuICovXG4gIHJlYWRvbmx5IG9wdGlvbjogQ2RrT3B0aW9uPFQ+IHwgbnVsbDtcbn1cbiJdfQ==