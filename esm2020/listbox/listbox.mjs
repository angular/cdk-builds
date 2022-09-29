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
CdkOption.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.0.0-next.1", ngImport: i0, type: CdkOption, deps: [], target: i0.ɵɵFactoryTarget.Directive });
CdkOption.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "15.0.0-next.1", type: CdkOption, selector: "[cdkOption]", inputs: { id: "id", value: ["cdkOption", "value"], typeaheadLabel: ["cdkOptionTypeaheadLabel", "typeaheadLabel"], disabled: ["cdkOptionDisabled", "disabled"], enabledTabIndex: ["tabindex", "enabledTabIndex"] }, host: { attributes: { "role": "option" }, listeners: { "click": "_clicked.next($event)", "focus": "_handleFocus()" }, properties: { "id": "id", "attr.aria-selected": "isSelected()", "attr.tabindex": "_getTabIndex()", "attr.aria-disabled": "disabled", "class.cdk-option-active": "isActive()" }, classAttribute: "cdk-option" }, exportAs: ["cdkOption"], ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.0.0-next.1", ngImport: i0, type: CdkOption, decorators: [{
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
        this.listKeyManager?.destroy();
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
        this.listKeyManager.change.subscribe(() => this._focusActiveOption());
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
CdkListbox.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.0.0-next.1", ngImport: i0, type: CdkListbox, deps: [], target: i0.ɵɵFactoryTarget.Directive });
CdkListbox.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "15.0.0-next.1", type: CdkListbox, selector: "[cdkListbox]", inputs: { id: "id", enabledTabIndex: ["tabindex", "enabledTabIndex"], value: ["cdkListboxValue", "value"], multiple: ["cdkListboxMultiple", "multiple"], disabled: ["cdkListboxDisabled", "disabled"], useActiveDescendant: ["cdkListboxUseActiveDescendant", "useActiveDescendant"], orientation: ["cdkListboxOrientation", "orientation"], compareWith: ["cdkListboxCompareWith", "compareWith"], navigationWrapDisabled: ["cdkListboxNavigationWrapDisabled", "navigationWrapDisabled"], navigateDisabledOptions: ["cdkListboxNavigatesDisabledOptions", "navigateDisabledOptions"] }, outputs: { valueChange: "cdkListboxValueChange" }, host: { attributes: { "role": "listbox" }, listeners: { "focus": "_handleFocus()", "keydown": "_handleKeydown($event)", "focusout": "_handleFocusOut($event)" }, properties: { "id": "id", "attr.tabindex": "_getTabIndex()", "attr.aria-disabled": "disabled", "attr.aria-multiselectable": "multiple", "attr.aria-activedescendant": "_getAriaActiveDescendant()", "attr.aria-orientation": "orientation" }, classAttribute: "cdk-listbox" }, providers: [
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
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.0.0-next.1", ngImport: i0, type: CdkListbox, decorators: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdGJveC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvbGlzdGJveC9saXN0Ym94LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFFTCxpQkFBaUIsRUFDakIsZUFBZSxFQUNmLFNBQVMsRUFDVCxVQUFVLEVBQ1YsVUFBVSxFQUNWLE1BQU0sRUFDTixXQUFXLEVBQ1gsS0FBSyxFQUVMLE1BQU0sRUFDTixTQUFTLEdBQ1YsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLDBCQUEwQixFQUFzQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2xHLE9BQU8sRUFDTCxDQUFDLEVBQ0QsVUFBVSxFQUNWLEdBQUcsRUFDSCxLQUFLLEVBQ0wsY0FBYyxFQUNkLElBQUksRUFDSixVQUFVLEVBQ1YsV0FBVyxFQUNYLEtBQUssRUFDTCxRQUFRLEdBQ1QsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQWUsV0FBVyxFQUFFLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdkYsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ3hELE9BQU8sRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFjLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUN2RCxPQUFPLEVBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzVFLE9BQU8sRUFHTCxhQUFhLEVBQ2IsaUJBQWlCLEVBSWpCLFVBQVUsR0FDWCxNQUFNLGdCQUFnQixDQUFDO0FBQ3hCLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQzs7QUFFakQsc0RBQXNEO0FBQ3RELElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztBQUVmOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLHFCQUF5QixTQUFRLGNBQWlCO0lB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O3NCQUQxQixLQUFLO3VCQUFDLG9DQUFvQztnQkFhRCxXQUFXO3NCQUFwRCxNQUFNO3VCQUFDLHVCQUF1QjtnQkFHNEIsT0FBTztzQkFBakUsZUFBZTt1QkFBQyxTQUFTLEVBQUUsRUFBQyxXQUFXLEVBQUUsSUFBSSxFQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIEFmdGVyQ29udGVudEluaXQsXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBDb250ZW50Q2hpbGRyZW4sXG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgZm9yd2FyZFJlZixcbiAgaW5qZWN0LFxuICBJbmplY3RGbGFncyxcbiAgSW5wdXQsXG4gIE9uRGVzdHJveSxcbiAgT3V0cHV0LFxuICBRdWVyeUxpc3QsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtBY3RpdmVEZXNjZW5kYW50S2V5TWFuYWdlciwgSGlnaGxpZ2h0YWJsZSwgTGlzdEtleU1hbmFnZXJPcHRpb259IGZyb20gJ0Bhbmd1bGFyL2Nkay9hMTF5JztcbmltcG9ydCB7XG4gIEEsXG4gIERPV05fQVJST1csXG4gIEVORCxcbiAgRU5URVIsXG4gIGhhc01vZGlmaWVyS2V5LFxuICBIT01FLFxuICBMRUZUX0FSUk9XLFxuICBSSUdIVF9BUlJPVyxcbiAgU1BBQ0UsXG4gIFVQX0FSUk9XLFxufSBmcm9tICdAYW5ndWxhci9jZGsva2V5Y29kZXMnO1xuaW1wb3J0IHtCb29sZWFuSW5wdXQsIGNvZXJjZUFycmF5LCBjb2VyY2VCb29sZWFuUHJvcGVydHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge1NlbGVjdGlvbk1vZGVsfSBmcm9tICdAYW5ndWxhci9jZGsvY29sbGVjdGlvbnMnO1xuaW1wb3J0IHtkZWZlciwgbWVyZ2UsIE9ic2VydmFibGUsIFN1YmplY3R9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtmaWx0ZXIsIG1hcCwgc3RhcnRXaXRoLCBzd2l0Y2hNYXAsIHRha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtcbiAgQWJzdHJhY3RDb250cm9sLFxuICBDb250cm9sVmFsdWVBY2Nlc3NvcixcbiAgTkdfVkFMSURBVE9SUyxcbiAgTkdfVkFMVUVfQUNDRVNTT1IsXG4gIFZhbGlkYXRpb25FcnJvcnMsXG4gIFZhbGlkYXRvcixcbiAgVmFsaWRhdG9yRm4sXG4gIFZhbGlkYXRvcnMsXG59IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcblxuLyoqIFRoZSBuZXh0IGlkIHRvIHVzZSBmb3IgY3JlYXRpbmcgdW5pcXVlIERPTSBJRHMuICovXG5sZXQgbmV4dElkID0gMDtcblxuLyoqXG4gKiBBbiBpbXBsZW1lbnRhdGlvbiBvZiBTZWxlY3Rpb25Nb2RlbCB0aGF0IGludGVybmFsbHkgYWx3YXlzIHJlcHJlc2VudHMgdGhlIHNlbGVjdGlvbiBhcyBhXG4gKiBtdWx0aS1zZWxlY3Rpb24uIFRoaXMgaXMgbmVjZXNzYXJ5IHNvIHRoYXQgd2UgY2FuIHJlY292ZXIgdGhlIGZ1bGwgc2VsZWN0aW9uIGlmIHRoZSB1c2VyXG4gKiBzd2l0Y2hlcyB0aGUgbGlzdGJveCBmcm9tIHNpbmdsZS1zZWxlY3Rpb24gdG8gbXVsdGktc2VsZWN0aW9uIGFmdGVyIGluaXRpYWxpemF0aW9uLlxuICpcbiAqIFRoaXMgc2VsZWN0aW9uIG1vZGVsIG1heSByZXBvcnQgbXVsdGlwbGUgc2VsZWN0ZWQgdmFsdWVzLCBldmVuIGlmIGl0IGlzIGluIHNpbmdsZS1zZWxlY3Rpb25cbiAqIG1vZGUuIEl0IGlzIHVwIHRvIHRoZSB1c2VyIChDZGtMaXN0Ym94KSB0byBjaGVjayBmb3IgaW52YWxpZCBzZWxlY3Rpb25zLlxuICovXG5jbGFzcyBMaXN0Ym94U2VsZWN0aW9uTW9kZWw8VD4gZXh0ZW5kcyBTZWxlY3Rpb25Nb2RlbDxUPiB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyBtdWx0aXBsZSA9IGZhbHNlLFxuICAgIGluaXRpYWxseVNlbGVjdGVkVmFsdWVzPzogVFtdLFxuICAgIGVtaXRDaGFuZ2VzID0gdHJ1ZSxcbiAgICBjb21wYXJlV2l0aD86IChvMTogVCwgbzI6IFQpID0+IGJvb2xlYW4sXG4gICkge1xuICAgIHN1cGVyKHRydWUsIGluaXRpYWxseVNlbGVjdGVkVmFsdWVzLCBlbWl0Q2hhbmdlcywgY29tcGFyZVdpdGgpO1xuICB9XG5cbiAgb3ZlcnJpZGUgaXNNdWx0aXBsZVNlbGVjdGlvbigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5tdWx0aXBsZTtcbiAgfVxuXG4gIG92ZXJyaWRlIHNlbGVjdCguLi52YWx1ZXM6IFRbXSkge1xuICAgIC8vIFRoZSBzdXBlciBjbGFzcyBpcyBhbHdheXMgaW4gbXVsdGktc2VsZWN0aW9uIG1vZGUsIHNvIHdlIG5lZWQgdG8gb3ZlcnJpZGUgdGhlIGJlaGF2aW9yIGlmXG4gICAgLy8gdGhpcyBzZWxlY3Rpb24gbW9kZWwgYWN0dWFsbHkgYmVsb25ncyB0byBhIHNpbmdsZS1zZWxlY3Rpb24gbGlzdGJveC5cbiAgICBpZiAodGhpcy5tdWx0aXBsZSkge1xuICAgICAgcmV0dXJuIHN1cGVyLnNlbGVjdCguLi52YWx1ZXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc3VwZXIuc2V0U2VsZWN0aW9uKC4uLnZhbHVlcyk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBBIHNlbGVjdGFibGUgb3B0aW9uIGluIGEgbGlzdGJveC4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtPcHRpb25dJyxcbiAgZXhwb3J0QXM6ICdjZGtPcHRpb24nLFxuICBob3N0OiB7XG4gICAgJ3JvbGUnOiAnb3B0aW9uJyxcbiAgICAnY2xhc3MnOiAnY2RrLW9wdGlvbicsXG4gICAgJ1tpZF0nOiAnaWQnLFxuICAgICdbYXR0ci5hcmlhLXNlbGVjdGVkXSc6ICdpc1NlbGVjdGVkKCknLFxuICAgICdbYXR0ci50YWJpbmRleF0nOiAnX2dldFRhYkluZGV4KCknLFxuICAgICdbYXR0ci5hcmlhLWRpc2FibGVkXSc6ICdkaXNhYmxlZCcsXG4gICAgJ1tjbGFzcy5jZGstb3B0aW9uLWFjdGl2ZV0nOiAnaXNBY3RpdmUoKScsXG4gICAgJyhjbGljayknOiAnX2NsaWNrZWQubmV4dCgkZXZlbnQpJyxcbiAgICAnKGZvY3VzKSc6ICdfaGFuZGxlRm9jdXMoKScsXG4gIH0sXG59KVxuZXhwb3J0IGNsYXNzIENka09wdGlvbjxUID0gdW5rbm93bj4gaW1wbGVtZW50cyBMaXN0S2V5TWFuYWdlck9wdGlvbiwgSGlnaGxpZ2h0YWJsZSwgT25EZXN0cm95IHtcbiAgLyoqIFRoZSBpZCBvZiB0aGUgb3B0aW9uJ3MgaG9zdCBlbGVtZW50LiAqL1xuICBASW5wdXQoKVxuICBnZXQgaWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lkIHx8IHRoaXMuX2dlbmVyYXRlZElkO1xuICB9XG4gIHNldCBpZCh2YWx1ZSkge1xuICAgIHRoaXMuX2lkID0gdmFsdWU7XG4gIH1cbiAgcHJpdmF0ZSBfaWQ6IHN0cmluZztcbiAgcHJpdmF0ZSBfZ2VuZXJhdGVkSWQgPSBgY2RrLW9wdGlvbi0ke25leHRJZCsrfWA7XG5cbiAgLyoqIFRoZSB2YWx1ZSBvZiB0aGlzIG9wdGlvbi4gKi9cbiAgQElucHV0KCdjZGtPcHRpb24nKSB2YWx1ZTogVDtcblxuICAvKipcbiAgICogVGhlIHRleHQgdXNlZCB0byBsb2NhdGUgdGhpcyBpdGVtIGR1cmluZyBsaXN0Ym94IHR5cGVhaGVhZC4gSWYgbm90IHNwZWNpZmllZCxcbiAgICogdGhlIGB0ZXh0Q29udGVudGAgb2YgdGhlIGl0ZW0gd2lsbCBiZSB1c2VkLlxuICAgKi9cbiAgQElucHV0KCdjZGtPcHRpb25UeXBlYWhlYWRMYWJlbCcpIHR5cGVhaGVhZExhYmVsOiBzdHJpbmc7XG5cbiAgLyoqIFdoZXRoZXIgdGhpcyBvcHRpb24gaXMgZGlzYWJsZWQuICovXG4gIEBJbnB1dCgnY2RrT3B0aW9uRGlzYWJsZWQnKVxuICBnZXQgZGlzYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMubGlzdGJveC5kaXNhYmxlZCB8fCB0aGlzLl9kaXNhYmxlZDtcbiAgfVxuICBzZXQgZGlzYWJsZWQodmFsdWU6IEJvb2xlYW5JbnB1dCkge1xuICAgIHRoaXMuX2Rpc2FibGVkID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgfVxuICBwcml2YXRlIF9kaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBUaGUgdGFiaW5kZXggb2YgdGhlIG9wdGlvbiB3aGVuIGl0IGlzIGVuYWJsZWQuICovXG4gIEBJbnB1dCgndGFiaW5kZXgnKVxuICBnZXQgZW5hYmxlZFRhYkluZGV4KCkge1xuICAgIHJldHVybiB0aGlzLl9lbmFibGVkVGFiSW5kZXggPT09IHVuZGVmaW5lZFxuICAgICAgPyB0aGlzLmxpc3Rib3guZW5hYmxlZFRhYkluZGV4XG4gICAgICA6IHRoaXMuX2VuYWJsZWRUYWJJbmRleDtcbiAgfVxuICBzZXQgZW5hYmxlZFRhYkluZGV4KHZhbHVlKSB7XG4gICAgdGhpcy5fZW5hYmxlZFRhYkluZGV4ID0gdmFsdWU7XG4gIH1cbiAgcHJpdmF0ZSBfZW5hYmxlZFRhYkluZGV4PzogbnVtYmVyIHwgbnVsbDtcblxuICAvKiogVGhlIG9wdGlvbidzIGhvc3QgZWxlbWVudCAqL1xuICByZWFkb25seSBlbGVtZW50OiBIVE1MRWxlbWVudCA9IGluamVjdChFbGVtZW50UmVmKS5uYXRpdmVFbGVtZW50O1xuXG4gIC8qKiBUaGUgcGFyZW50IGxpc3Rib3ggdGhpcyBvcHRpb24gYmVsb25ncyB0by4gKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IGxpc3Rib3g6IENka0xpc3Rib3g8VD4gPSBpbmplY3QoQ2RrTGlzdGJveCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIG9wdGlvbiBpcyBkZXN0cm95ZWQuICovXG4gIHByb3RlY3RlZCBkZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBvcHRpb24gaXMgY2xpY2tlZC4gKi9cbiAgcmVhZG9ubHkgX2NsaWNrZWQgPSBuZXcgU3ViamVjdDxNb3VzZUV2ZW50PigpO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBvcHRpb24gaXMgY3VycmVudGx5IGFjdGl2ZS4gKi9cbiAgcHJpdmF0ZSBfYWN0aXZlID0gZmFsc2U7XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5kZXN0cm95ZWQubmV4dCgpO1xuICAgIHRoaXMuZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gIH1cblxuICAvKiogV2hldGhlciB0aGlzIG9wdGlvbiBpcyBzZWxlY3RlZC4gKi9cbiAgaXNTZWxlY3RlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5saXN0Ym94LmlzU2VsZWN0ZWQodGhpcyk7XG4gIH1cblxuICAvKiogV2hldGhlciB0aGlzIG9wdGlvbiBpcyBhY3RpdmUuICovXG4gIGlzQWN0aXZlKCkge1xuICAgIHJldHVybiB0aGlzLl9hY3RpdmU7XG4gIH1cblxuICAvKiogVG9nZ2xlIHRoZSBzZWxlY3RlZCBzdGF0ZSBvZiB0aGlzIG9wdGlvbi4gKi9cbiAgdG9nZ2xlKCkge1xuICAgIHRoaXMubGlzdGJveC50b2dnbGUodGhpcyk7XG4gIH1cblxuICAvKiogU2VsZWN0IHRoaXMgb3B0aW9uIGlmIGl0IGlzIG5vdCBzZWxlY3RlZC4gKi9cbiAgc2VsZWN0KCkge1xuICAgIHRoaXMubGlzdGJveC5zZWxlY3QodGhpcyk7XG4gIH1cblxuICAvKiogRGVzZWxlY3QgdGhpcyBvcHRpb24gaWYgaXQgaXMgc2VsZWN0ZWQuICovXG4gIGRlc2VsZWN0KCkge1xuICAgIHRoaXMubGlzdGJveC5kZXNlbGVjdCh0aGlzKTtcbiAgfVxuXG4gIC8qKiBGb2N1cyB0aGlzIG9wdGlvbi4gKi9cbiAgZm9jdXMoKSB7XG4gICAgdGhpcy5lbGVtZW50LmZvY3VzKCk7XG4gIH1cblxuICAvKiogR2V0IHRoZSBsYWJlbCBmb3IgdGhpcyBlbGVtZW50IHdoaWNoIGlzIHJlcXVpcmVkIGJ5IHRoZSBGb2N1c2FibGVPcHRpb24gaW50ZXJmYWNlLiAqL1xuICBnZXRMYWJlbCgpIHtcbiAgICByZXR1cm4gKHRoaXMudHlwZWFoZWFkTGFiZWwgPz8gdGhpcy5lbGVtZW50LnRleHRDb250ZW50Py50cmltKCkpIHx8ICcnO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgb3B0aW9uIGFzIGFjdGl2ZS5cbiAgICogQGRvY3MtcHJpdmF0ZVxuICAgKi9cbiAgc2V0QWN0aXZlU3R5bGVzKCkge1xuICAgIHRoaXMuX2FjdGl2ZSA9IHRydWU7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBvcHRpb24gYXMgaW5hY3RpdmUuXG4gICAqIEBkb2NzLXByaXZhdGVcbiAgICovXG4gIHNldEluYWN0aXZlU3R5bGVzKCkge1xuICAgIHRoaXMuX2FjdGl2ZSA9IGZhbHNlO1xuICB9XG5cbiAgLyoqIEhhbmRsZSBmb2N1cyBldmVudHMgb24gdGhlIG9wdGlvbi4gKi9cbiAgcHJvdGVjdGVkIF9oYW5kbGVGb2N1cygpIHtcbiAgICAvLyBPcHRpb25zIGNhbiB3aW5kIHVwIGdldHRpbmcgZm9jdXNlZCBpbiBhY3RpdmUgZGVzY2VuZGFudCBtb2RlIGlmIHRoZSB1c2VyIGNsaWNrcyBvbiB0aGVtLlxuICAgIC8vIEluIHRoaXMgY2FzZSwgd2UgcHVzaCBmb2N1cyBiYWNrIHRvIHRoZSBwYXJlbnQgbGlzdGJveCB0byBwcmV2ZW50IGFuIGV4dHJhIHRhYiBzdG9wIHdoZW5cbiAgICAvLyB0aGUgdXNlciBwZXJmb3JtcyBhIHNoaWZ0K3RhYi5cbiAgICBpZiAodGhpcy5saXN0Ym94LnVzZUFjdGl2ZURlc2NlbmRhbnQpIHtcbiAgICAgIHRoaXMubGlzdGJveC5fc2V0QWN0aXZlT3B0aW9uKHRoaXMpO1xuICAgICAgdGhpcy5saXN0Ym94LmZvY3VzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEdldCB0aGUgdGFiaW5kZXggZm9yIHRoaXMgb3B0aW9uLiAqL1xuICBwcm90ZWN0ZWQgX2dldFRhYkluZGV4KCkge1xuICAgIGlmICh0aGlzLmxpc3Rib3gudXNlQWN0aXZlRGVzY2VuZGFudCB8fCB0aGlzLmRpc2FibGVkKSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmlzQWN0aXZlKCkgPyB0aGlzLmVuYWJsZWRUYWJJbmRleCA6IC0xO1xuICB9XG59XG5cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtMaXN0Ym94XScsXG4gIGV4cG9ydEFzOiAnY2RrTGlzdGJveCcsXG4gIGhvc3Q6IHtcbiAgICAncm9sZSc6ICdsaXN0Ym94JyxcbiAgICAnY2xhc3MnOiAnY2RrLWxpc3Rib3gnLFxuICAgICdbaWRdJzogJ2lkJyxcbiAgICAnW2F0dHIudGFiaW5kZXhdJzogJ19nZXRUYWJJbmRleCgpJyxcbiAgICAnW2F0dHIuYXJpYS1kaXNhYmxlZF0nOiAnZGlzYWJsZWQnLFxuICAgICdbYXR0ci5hcmlhLW11bHRpc2VsZWN0YWJsZV0nOiAnbXVsdGlwbGUnLFxuICAgICdbYXR0ci5hcmlhLWFjdGl2ZWRlc2NlbmRhbnRdJzogJ19nZXRBcmlhQWN0aXZlRGVzY2VuZGFudCgpJyxcbiAgICAnW2F0dHIuYXJpYS1vcmllbnRhdGlvbl0nOiAnb3JpZW50YXRpb24nLFxuICAgICcoZm9jdXMpJzogJ19oYW5kbGVGb2N1cygpJyxcbiAgICAnKGtleWRvd24pJzogJ19oYW5kbGVLZXlkb3duKCRldmVudCknLFxuICAgICcoZm9jdXNvdXQpJzogJ19oYW5kbGVGb2N1c091dCgkZXZlbnQpJyxcbiAgfSxcbiAgcHJvdmlkZXJzOiBbXG4gICAge1xuICAgICAgcHJvdmlkZTogTkdfVkFMVUVfQUNDRVNTT1IsXG4gICAgICB1c2VFeGlzdGluZzogZm9yd2FyZFJlZigoKSA9PiBDZGtMaXN0Ym94KSxcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogTkdfVkFMSURBVE9SUyxcbiAgICAgIHVzZUV4aXN0aW5nOiBmb3J3YXJkUmVmKCgpID0+IENka0xpc3Rib3gpLFxuICAgICAgbXVsdGk6IHRydWUsXG4gICAgfSxcbiAgXSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrTGlzdGJveDxUID0gdW5rbm93bj5cbiAgaW1wbGVtZW50cyBBZnRlckNvbnRlbnRJbml0LCBPbkRlc3Ryb3ksIENvbnRyb2xWYWx1ZUFjY2Vzc29yLCBWYWxpZGF0b3JcbntcbiAgLyoqIFRoZSBpZCBvZiB0aGUgb3B0aW9uJ3MgaG9zdCBlbGVtZW50LiAqL1xuICBASW5wdXQoKVxuICBnZXQgaWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lkIHx8IHRoaXMuX2dlbmVyYXRlZElkO1xuICB9XG4gIHNldCBpZCh2YWx1ZSkge1xuICAgIHRoaXMuX2lkID0gdmFsdWU7XG4gIH1cbiAgcHJpdmF0ZSBfaWQ6IHN0cmluZztcbiAgcHJpdmF0ZSBfZ2VuZXJhdGVkSWQgPSBgY2RrLWxpc3Rib3gtJHtuZXh0SWQrK31gO1xuXG4gIC8qKiBUaGUgdGFiaW5kZXggdG8gdXNlIHdoZW4gdGhlIGxpc3Rib3ggaXMgZW5hYmxlZC4gKi9cbiAgQElucHV0KCd0YWJpbmRleCcpXG4gIGdldCBlbmFibGVkVGFiSW5kZXgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2VuYWJsZWRUYWJJbmRleCA9PT0gdW5kZWZpbmVkID8gMCA6IHRoaXMuX2VuYWJsZWRUYWJJbmRleDtcbiAgfVxuICBzZXQgZW5hYmxlZFRhYkluZGV4KHZhbHVlKSB7XG4gICAgdGhpcy5fZW5hYmxlZFRhYkluZGV4ID0gdmFsdWU7XG4gIH1cbiAgcHJpdmF0ZSBfZW5hYmxlZFRhYkluZGV4PzogbnVtYmVyIHwgbnVsbDtcblxuICAvKiogVGhlIHZhbHVlIHNlbGVjdGVkIGluIHRoZSBsaXN0Ym94LCByZXByZXNlbnRlZCBhcyBhbiBhcnJheSBvZiBvcHRpb24gdmFsdWVzLiAqL1xuICBASW5wdXQoJ2Nka0xpc3Rib3hWYWx1ZScpXG4gIGdldCB2YWx1ZSgpOiByZWFkb25seSBUW10ge1xuICAgIHJldHVybiB0aGlzLl9pbnZhbGlkID8gW10gOiB0aGlzLnNlbGVjdGlvbk1vZGVsLnNlbGVjdGVkO1xuICB9XG4gIHNldCB2YWx1ZSh2YWx1ZTogcmVhZG9ubHkgVFtdKSB7XG4gICAgdGhpcy5fc2V0U2VsZWN0aW9uKHZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBsaXN0Ym94IGFsbG93cyBtdWx0aXBsZSBvcHRpb25zIHRvIGJlIHNlbGVjdGVkLiBJZiB0aGUgdmFsdWUgc3dpdGNoZXMgZnJvbSBgdHJ1ZWBcbiAgICogdG8gYGZhbHNlYCwgYW5kIG1vcmUgdGhhbiBvbmUgb3B0aW9uIGlzIHNlbGVjdGVkLCBhbGwgb3B0aW9ucyBhcmUgZGVzZWxlY3RlZC5cbiAgICovXG4gIEBJbnB1dCgnY2RrTGlzdGJveE11bHRpcGxlJylcbiAgZ2V0IG11bHRpcGxlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLnNlbGVjdGlvbk1vZGVsLm11bHRpcGxlO1xuICB9XG4gIHNldCBtdWx0aXBsZSh2YWx1ZTogQm9vbGVhbklucHV0KSB7XG4gICAgdGhpcy5zZWxlY3Rpb25Nb2RlbC5tdWx0aXBsZSA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zKSB7XG4gICAgICB0aGlzLl91cGRhdGVJbnRlcm5hbFZhbHVlKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGxpc3Rib3ggaXMgZGlzYWJsZWQuICovXG4gIEBJbnB1dCgnY2RrTGlzdGJveERpc2FibGVkJylcbiAgZ2V0IGRpc2FibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9kaXNhYmxlZDtcbiAgfVxuICBzZXQgZGlzYWJsZWQodmFsdWU6IEJvb2xlYW5JbnB1dCkge1xuICAgIHRoaXMuX2Rpc2FibGVkID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgfVxuICBwcml2YXRlIF9kaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBsaXN0Ym94IHdpbGwgdXNlIGFjdGl2ZSBkZXNjZW5kYW50IG9yIHdpbGwgbW92ZSBmb2N1cyBvbnRvIHRoZSBvcHRpb25zLiAqL1xuICBASW5wdXQoJ2Nka0xpc3Rib3hVc2VBY3RpdmVEZXNjZW5kYW50JylcbiAgZ2V0IHVzZUFjdGl2ZURlc2NlbmRhbnQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX3VzZUFjdGl2ZURlc2NlbmRhbnQ7XG4gIH1cbiAgc2V0IHVzZUFjdGl2ZURlc2NlbmRhbnQoc2hvdWxkVXNlQWN0aXZlRGVzY2VuZGFudDogQm9vbGVhbklucHV0KSB7XG4gICAgdGhpcy5fdXNlQWN0aXZlRGVzY2VuZGFudCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eShzaG91bGRVc2VBY3RpdmVEZXNjZW5kYW50KTtcbiAgfVxuICBwcml2YXRlIF91c2VBY3RpdmVEZXNjZW5kYW50OiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqIFRoZSBvcmllbnRhdGlvbiBvZiB0aGUgbGlzdGJveC4gT25seSBhZmZlY3RzIGtleWJvYXJkIGludGVyYWN0aW9uLCBub3QgdmlzdWFsIGxheW91dC4gKi9cbiAgQElucHV0KCdjZGtMaXN0Ym94T3JpZW50YXRpb24nKVxuICBnZXQgb3JpZW50YXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX29yaWVudGF0aW9uO1xuICB9XG4gIHNldCBvcmllbnRhdGlvbih2YWx1ZTogJ2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJykge1xuICAgIHRoaXMuX29yaWVudGF0aW9uID0gdmFsdWUgPT09ICdob3Jpem9udGFsJyA/ICdob3Jpem9udGFsJyA6ICd2ZXJ0aWNhbCc7XG4gICAgaWYgKHZhbHVlID09PSAnaG9yaXpvbnRhbCcpIHtcbiAgICAgIHRoaXMubGlzdEtleU1hbmFnZXI/LndpdGhIb3Jpem9udGFsT3JpZW50YXRpb24odGhpcy5fZGlyPy52YWx1ZSB8fCAnbHRyJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubGlzdEtleU1hbmFnZXI/LndpdGhWZXJ0aWNhbE9yaWVudGF0aW9uKCk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgX29yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcgfCAndmVydGljYWwnID0gJ3ZlcnRpY2FsJztcblxuICAvKiogVGhlIGZ1bmN0aW9uIHVzZWQgdG8gY29tcGFyZSBvcHRpb24gdmFsdWVzLiAqL1xuICBASW5wdXQoJ2Nka0xpc3Rib3hDb21wYXJlV2l0aCcpXG4gIGdldCBjb21wYXJlV2l0aCgpOiB1bmRlZmluZWQgfCAoKG8xOiBULCBvMjogVCkgPT4gYm9vbGVhbikge1xuICAgIHJldHVybiB0aGlzLnNlbGVjdGlvbk1vZGVsLmNvbXBhcmVXaXRoO1xuICB9XG4gIHNldCBjb21wYXJlV2l0aChmbjogdW5kZWZpbmVkIHwgKChvMTogVCwgbzI6IFQpID0+IGJvb2xlYW4pKSB7XG4gICAgdGhpcy5zZWxlY3Rpb25Nb2RlbC5jb21wYXJlV2l0aCA9IGZuO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGtleWJvYXJkIG5hdmlnYXRpb24gc2hvdWxkIHdyYXAgd2hlbiB0aGUgdXNlciBwcmVzc2VzIGFycm93IGRvd24gb24gdGhlIGxhc3QgaXRlbVxuICAgKiBvciBhcnJvdyB1cCBvbiB0aGUgZmlyc3QgaXRlbS5cbiAgICovXG4gIEBJbnB1dCgnY2RrTGlzdGJveE5hdmlnYXRpb25XcmFwRGlzYWJsZWQnKVxuICBnZXQgbmF2aWdhdGlvbldyYXBEaXNhYmxlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fbmF2aWdhdGlvbldyYXBEaXNhYmxlZDtcbiAgfVxuICBzZXQgbmF2aWdhdGlvbldyYXBEaXNhYmxlZCh3cmFwOiBCb29sZWFuSW5wdXQpIHtcbiAgICB0aGlzLl9uYXZpZ2F0aW9uV3JhcERpc2FibGVkID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHdyYXApO1xuICAgIHRoaXMubGlzdEtleU1hbmFnZXI/LndpdGhXcmFwKCF0aGlzLl9uYXZpZ2F0aW9uV3JhcERpc2FibGVkKTtcbiAgfVxuICBwcml2YXRlIF9uYXZpZ2F0aW9uV3JhcERpc2FibGVkID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIga2V5Ym9hcmQgbmF2aWdhdGlvbiBzaG91bGQgc2tpcCBvdmVyIGRpc2FibGVkIGl0ZW1zLiAqL1xuICBASW5wdXQoJ2Nka0xpc3Rib3hOYXZpZ2F0ZXNEaXNhYmxlZE9wdGlvbnMnKVxuICBnZXQgbmF2aWdhdGVEaXNhYmxlZE9wdGlvbnMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX25hdmlnYXRlRGlzYWJsZWRPcHRpb25zO1xuICB9XG4gIHNldCBuYXZpZ2F0ZURpc2FibGVkT3B0aW9ucyhza2lwOiBCb29sZWFuSW5wdXQpIHtcbiAgICB0aGlzLl9uYXZpZ2F0ZURpc2FibGVkT3B0aW9ucyA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eShza2lwKTtcbiAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyPy5za2lwUHJlZGljYXRlKFxuICAgICAgdGhpcy5fbmF2aWdhdGVEaXNhYmxlZE9wdGlvbnMgPyB0aGlzLl9za2lwTm9uZVByZWRpY2F0ZSA6IHRoaXMuX3NraXBEaXNhYmxlZFByZWRpY2F0ZSxcbiAgICApO1xuICB9XG4gIHByaXZhdGUgX25hdmlnYXRlRGlzYWJsZWRPcHRpb25zID0gZmFsc2U7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHNlbGVjdGVkIHZhbHVlKHMpIGluIHRoZSBsaXN0Ym94IGNoYW5nZS4gKi9cbiAgQE91dHB1dCgnY2RrTGlzdGJveFZhbHVlQ2hhbmdlJykgcmVhZG9ubHkgdmFsdWVDaGFuZ2UgPSBuZXcgU3ViamVjdDxMaXN0Ym94VmFsdWVDaGFuZ2VFdmVudDxUPj4oKTtcblxuICAvKiogVGhlIGNoaWxkIG9wdGlvbnMgaW4gdGhpcyBsaXN0Ym94LiAqL1xuICBAQ29udGVudENoaWxkcmVuKENka09wdGlvbiwge2Rlc2NlbmRhbnRzOiB0cnVlfSkgcHJvdGVjdGVkIG9wdGlvbnM6IFF1ZXJ5TGlzdDxDZGtPcHRpb248VD4+O1xuXG4gIC8qKiBUaGUgc2VsZWN0aW9uIG1vZGVsIHVzZWQgYnkgdGhlIGxpc3Rib3guICovXG4gIHByb3RlY3RlZCBzZWxlY3Rpb25Nb2RlbCA9IG5ldyBMaXN0Ym94U2VsZWN0aW9uTW9kZWw8VD4oKTtcblxuICAvKiogVGhlIGtleSBtYW5hZ2VyIHRoYXQgbWFuYWdlcyBrZXlib2FyZCBuYXZpZ2F0aW9uIGZvciB0aGlzIGxpc3Rib3guICovXG4gIHByb3RlY3RlZCBsaXN0S2V5TWFuYWdlcjogQWN0aXZlRGVzY2VuZGFudEtleU1hbmFnZXI8Q2RrT3B0aW9uPFQ+PjtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgbGlzdGJveCBpcyBkZXN0cm95ZWQuICovXG4gIHByb3RlY3RlZCByZWFkb25seSBkZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBUaGUgaG9zdCBlbGVtZW50IG9mIHRoZSBsaXN0Ym94LiAqL1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgZWxlbWVudDogSFRNTEVsZW1lbnQgPSBpbmplY3QoRWxlbWVudFJlZikubmF0aXZlRWxlbWVudDtcblxuICAvKiogVGhlIGNoYW5nZSBkZXRlY3RvciBmb3IgdGhpcyBsaXN0Ym94LiAqL1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgY2hhbmdlRGV0ZWN0b3JSZWYgPSBpbmplY3QoQ2hhbmdlRGV0ZWN0b3JSZWYpO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgdmFsdWUgaW4gdGhlIHNlbGVjdGlvbiBtb2RlbCBpcyBpbnZhbGlkLiAqL1xuICBwcml2YXRlIF9pbnZhbGlkID0gZmFsc2U7XG5cbiAgLyoqIFRoZSBsYXN0IHVzZXItdHJpZ2dlcmVkIG9wdGlvbi4gKi9cbiAgcHJpdmF0ZSBfbGFzdFRyaWdnZXJlZDogQ2RrT3B0aW9uPFQ+IHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIENhbGxiYWNrIGNhbGxlZCB3aGVuIHRoZSBsaXN0Ym94IGhhcyBiZWVuIHRvdWNoZWQgKi9cbiAgcHJpdmF0ZSBfb25Ub3VjaGVkID0gKCkgPT4ge307XG5cbiAgLyoqIENhbGxiYWNrIGNhbGxlZCB3aGVuIHRoZSBsaXN0Ym94IHZhbHVlIGNoYW5nZXMgKi9cbiAgcHJpdmF0ZSBfb25DaGFuZ2U6ICh2YWx1ZTogcmVhZG9ubHkgVFtdKSA9PiB2b2lkID0gKCkgPT4ge307XG5cbiAgLyoqIENhbGxiYWNrIGNhbGxlZCB3aGVuIHRoZSBmb3JtIHZhbGlkYXRvciBjaGFuZ2VzLiAqL1xuICBwcml2YXRlIF9vblZhbGlkYXRvckNoYW5nZSA9ICgpID0+IHt9O1xuXG4gIC8qKiBFbWl0cyB3aGVuIGFuIG9wdGlvbiBoYXMgYmVlbiBjbGlja2VkLiAqL1xuICBwcml2YXRlIF9vcHRpb25DbGlja2VkID0gZGVmZXIoKCkgPT5cbiAgICAodGhpcy5vcHRpb25zLmNoYW5nZXMgYXMgT2JzZXJ2YWJsZTxDZGtPcHRpb248VD5bXT4pLnBpcGUoXG4gICAgICBzdGFydFdpdGgodGhpcy5vcHRpb25zKSxcbiAgICAgIHN3aXRjaE1hcChvcHRpb25zID0+XG4gICAgICAgIG1lcmdlKC4uLm9wdGlvbnMubWFwKG9wdGlvbiA9PiBvcHRpb24uX2NsaWNrZWQucGlwZShtYXAoZXZlbnQgPT4gKHtvcHRpb24sIGV2ZW50fSkpKSkpLFxuICAgICAgKSxcbiAgICApLFxuICApO1xuXG4gIC8qKiBUaGUgZGlyZWN0aW9uYWxpdHkgb2YgdGhlIHBhZ2UuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX2RpciA9IGluamVjdChEaXJlY3Rpb25hbGl0eSwgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpO1xuXG4gIC8qKiBBIHByZWRpY2F0ZSB0aGF0IHNraXBzIGRpc2FibGVkIG9wdGlvbnMuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX3NraXBEaXNhYmxlZFByZWRpY2F0ZSA9IChvcHRpb246IENka09wdGlvbjxUPikgPT4gb3B0aW9uLmRpc2FibGVkO1xuXG4gIC8qKiBBIHByZWRpY2F0ZSB0aGF0IGRvZXMgbm90IHNraXAgYW55IG9wdGlvbnMuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX3NraXBOb25lUHJlZGljYXRlID0gKCkgPT4gZmFsc2U7XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRvciB0aGF0IHByb2R1Y2VzIGFuIGVycm9yIGlmIG11bHRpcGxlIHZhbHVlcyBhcmUgc2VsZWN0ZWQgaW4gYSBzaW5nbGUgc2VsZWN0aW9uXG4gICAqIGxpc3Rib3guXG4gICAqIEBwYXJhbSBjb250cm9sIFRoZSBjb250cm9sIHRvIHZhbGlkYXRlXG4gICAqIEByZXR1cm4gQSB2YWxpZGF0aW9uIGVycm9yIG9yIG51bGxcbiAgICovXG4gIHByaXZhdGUgX3ZhbGlkYXRlVW5leHBlY3RlZE11bHRpcGxlVmFsdWVzOiBWYWxpZGF0b3JGbiA9IChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wpID0+IHtcbiAgICBjb25zdCBjb250cm9sVmFsdWUgPSB0aGlzLl9jb2VyY2VWYWx1ZShjb250cm9sLnZhbHVlKTtcbiAgICBpZiAoIXRoaXMubXVsdGlwbGUgJiYgY29udHJvbFZhbHVlLmxlbmd0aCA+IDEpIHtcbiAgICAgIHJldHVybiB7J2Nka0xpc3Rib3hVbmV4cGVjdGVkTXVsdGlwbGVWYWx1ZXMnOiB0cnVlfTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH07XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRvciB0aGF0IHByb2R1Y2VzIGFuIGVycm9yIGlmIGFueSBzZWxlY3RlZCB2YWx1ZXMgYXJlIG5vdCB2YWxpZCBvcHRpb25zIGZvciB0aGlzIGxpc3Rib3guXG4gICAqIEBwYXJhbSBjb250cm9sIFRoZSBjb250cm9sIHRvIHZhbGlkYXRlXG4gICAqIEByZXR1cm4gQSB2YWxpZGF0aW9uIGVycm9yIG9yIG51bGxcbiAgICovXG4gIHByaXZhdGUgX3ZhbGlkYXRlVW5leHBlY3RlZE9wdGlvblZhbHVlczogVmFsaWRhdG9yRm4gPSAoY29udHJvbDogQWJzdHJhY3RDb250cm9sKSA9PiB7XG4gICAgY29uc3QgY29udHJvbFZhbHVlID0gdGhpcy5fY29lcmNlVmFsdWUoY29udHJvbC52YWx1ZSk7XG4gICAgY29uc3QgaW52YWxpZFZhbHVlcyA9IHRoaXMuX2dldEludmFsaWRPcHRpb25WYWx1ZXMoY29udHJvbFZhbHVlKTtcbiAgICBpZiAoaW52YWxpZFZhbHVlcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiB7J2Nka0xpc3Rib3hVbmV4cGVjdGVkT3B0aW9uVmFsdWVzJzogeyd2YWx1ZXMnOiBpbnZhbGlkVmFsdWVzfX07XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9O1xuXG4gIC8qKiBUaGUgY29tYmluZWQgc2V0IG9mIHZhbGlkYXRvcnMgZm9yIHRoaXMgbGlzdGJveC4gKi9cbiAgcHJpdmF0ZSBfdmFsaWRhdG9ycyA9IFZhbGlkYXRvcnMuY29tcG9zZShbXG4gICAgdGhpcy5fdmFsaWRhdGVVbmV4cGVjdGVkTXVsdGlwbGVWYWx1ZXMsXG4gICAgdGhpcy5fdmFsaWRhdGVVbmV4cGVjdGVkT3B0aW9uVmFsdWVzLFxuICBdKSE7XG5cbiAgbmdBZnRlckNvbnRlbnRJbml0KCkge1xuICAgIGlmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpIHtcbiAgICAgIHRoaXMuX3ZlcmlmeU5vT3B0aW9uVmFsdWVDb2xsaXNpb25zKCk7XG4gICAgfVxuXG4gICAgdGhpcy5faW5pdEtleU1hbmFnZXIoKTtcblxuICAgIC8vIFVwZGF0ZSB0aGUgaW50ZXJuYWwgdmFsdWUgd2hlbmV2ZXIgdGhlIG9wdGlvbnMgb3IgdGhlIG1vZGVsIHZhbHVlIGNoYW5nZXMuXG4gICAgbWVyZ2UodGhpcy5zZWxlY3Rpb25Nb2RlbC5jaGFuZ2VkLCB0aGlzLm9wdGlvbnMuY2hhbmdlcylcbiAgICAgIC5waXBlKHN0YXJ0V2l0aChudWxsKSwgdGFrZVVudGlsKHRoaXMuZGVzdHJveWVkKSlcbiAgICAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy5fdXBkYXRlSW50ZXJuYWxWYWx1ZSgpKTtcblxuICAgIHRoaXMuX29wdGlvbkNsaWNrZWRcbiAgICAgIC5waXBlKFxuICAgICAgICBmaWx0ZXIoKHtvcHRpb259KSA9PiAhb3B0aW9uLmRpc2FibGVkKSxcbiAgICAgICAgdGFrZVVudGlsKHRoaXMuZGVzdHJveWVkKSxcbiAgICAgIClcbiAgICAgIC5zdWJzY3JpYmUoKHtvcHRpb24sIGV2ZW50fSkgPT4gdGhpcy5faGFuZGxlT3B0aW9uQ2xpY2tlZChvcHRpb24sIGV2ZW50KSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyPy5kZXN0cm95KCk7XG4gICAgdGhpcy5kZXN0cm95ZWQubmV4dCgpO1xuICAgIHRoaXMuZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlIHRoZSBzZWxlY3RlZCBzdGF0ZSBvZiB0aGUgZ2l2ZW4gb3B0aW9uLlxuICAgKiBAcGFyYW0gb3B0aW9uIFRoZSBvcHRpb24gdG8gdG9nZ2xlXG4gICAqL1xuICB0b2dnbGUob3B0aW9uOiBDZGtPcHRpb248VD4pIHtcbiAgICB0aGlzLnRvZ2dsZVZhbHVlKG9wdGlvbi52YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlIHRoZSBzZWxlY3RlZCBzdGF0ZSBvZiB0aGUgZ2l2ZW4gdmFsdWUuXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gdG9nZ2xlXG4gICAqL1xuICB0b2dnbGVWYWx1ZSh2YWx1ZTogVCkge1xuICAgIGlmICh0aGlzLl9pbnZhbGlkKSB7XG4gICAgICB0aGlzLnNlbGVjdGlvbk1vZGVsLmNsZWFyKGZhbHNlKTtcbiAgICB9XG4gICAgdGhpcy5zZWxlY3Rpb25Nb2RlbC50b2dnbGUodmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbGVjdCB0aGUgZ2l2ZW4gb3B0aW9uLlxuICAgKiBAcGFyYW0gb3B0aW9uIFRoZSBvcHRpb24gdG8gc2VsZWN0XG4gICAqL1xuICBzZWxlY3Qob3B0aW9uOiBDZGtPcHRpb248VD4pIHtcbiAgICB0aGlzLnNlbGVjdFZhbHVlKG9wdGlvbi52YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogU2VsZWN0IHRoZSBnaXZlbiB2YWx1ZS5cbiAgICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBzZWxlY3RcbiAgICovXG4gIHNlbGVjdFZhbHVlKHZhbHVlOiBUKSB7XG4gICAgaWYgKHRoaXMuX2ludmFsaWQpIHtcbiAgICAgIHRoaXMuc2VsZWN0aW9uTW9kZWwuY2xlYXIoZmFsc2UpO1xuICAgIH1cbiAgICB0aGlzLnNlbGVjdGlvbk1vZGVsLnNlbGVjdCh2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzZWxlY3QgdGhlIGdpdmVuIG9wdGlvbi5cbiAgICogQHBhcmFtIG9wdGlvbiBUaGUgb3B0aW9uIHRvIGRlc2VsZWN0XG4gICAqL1xuICBkZXNlbGVjdChvcHRpb246IENka09wdGlvbjxUPikge1xuICAgIHRoaXMuZGVzZWxlY3RWYWx1ZShvcHRpb24udmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc2VsZWN0IHRoZSBnaXZlbiB2YWx1ZS5cbiAgICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBkZXNlbGVjdFxuICAgKi9cbiAgZGVzZWxlY3RWYWx1ZSh2YWx1ZTogVCkge1xuICAgIGlmICh0aGlzLl9pbnZhbGlkKSB7XG4gICAgICB0aGlzLnNlbGVjdGlvbk1vZGVsLmNsZWFyKGZhbHNlKTtcbiAgICB9XG4gICAgdGhpcy5zZWxlY3Rpb25Nb2RlbC5kZXNlbGVjdCh2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBzZWxlY3RlZCBzdGF0ZSBvZiBhbGwgb3B0aW9ucy5cbiAgICogQHBhcmFtIGlzU2VsZWN0ZWQgVGhlIG5ldyBzZWxlY3RlZCBzdGF0ZSB0byBzZXRcbiAgICovXG4gIHNldEFsbFNlbGVjdGVkKGlzU2VsZWN0ZWQ6IGJvb2xlYW4pIHtcbiAgICBpZiAoIWlzU2VsZWN0ZWQpIHtcbiAgICAgIHRoaXMuc2VsZWN0aW9uTW9kZWwuY2xlYXIoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMuX2ludmFsaWQpIHtcbiAgICAgICAgdGhpcy5zZWxlY3Rpb25Nb2RlbC5jbGVhcihmYWxzZSk7XG4gICAgICB9XG4gICAgICB0aGlzLnNlbGVjdGlvbk1vZGVsLnNlbGVjdCguLi50aGlzLm9wdGlvbnMubWFwKG9wdGlvbiA9PiBvcHRpb24udmFsdWUpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IHdoZXRoZXIgdGhlIGdpdmVuIG9wdGlvbiBpcyBzZWxlY3RlZC5cbiAgICogQHBhcmFtIG9wdGlvbiBUaGUgb3B0aW9uIHRvIGdldCB0aGUgc2VsZWN0ZWQgc3RhdGUgb2ZcbiAgICovXG4gIGlzU2VsZWN0ZWQob3B0aW9uOiBDZGtPcHRpb248VD4pIHtcbiAgICByZXR1cm4gdGhpcy5pc1ZhbHVlU2VsZWN0ZWQob3B0aW9uLnZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgd2hldGhlciB0aGUgZ2l2ZW4gdmFsdWUgaXMgc2VsZWN0ZWQuXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gZ2V0IHRoZSBzZWxlY3RlZCBzdGF0ZSBvZlxuICAgKi9cbiAgaXNWYWx1ZVNlbGVjdGVkKHZhbHVlOiBUKSB7XG4gICAgaWYgKHRoaXMuX2ludmFsaWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuc2VsZWN0aW9uTW9kZWwuaXNTZWxlY3RlZCh2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGEgY2FsbGJhY2sgdG8gYmUgaW52b2tlZCB3aGVuIHRoZSBsaXN0Ym94J3MgdmFsdWUgY2hhbmdlcyBmcm9tIHVzZXIgaW5wdXQuXG4gICAqIEBwYXJhbSBmbiBUaGUgY2FsbGJhY2sgdG8gcmVnaXN0ZXJcbiAgICogQGRvY3MtcHJpdmF0ZVxuICAgKi9cbiAgcmVnaXN0ZXJPbkNoYW5nZShmbjogKHZhbHVlOiByZWFkb25seSBUW10pID0+IHZvaWQpOiB2b2lkIHtcbiAgICB0aGlzLl9vbkNoYW5nZSA9IGZuO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBhIGNhbGxiYWNrIHRvIGJlIGludm9rZWQgd2hlbiB0aGUgbGlzdGJveCBpcyBibHVycmVkIGJ5IHRoZSB1c2VyLlxuICAgKiBAcGFyYW0gZm4gVGhlIGNhbGxiYWNrIHRvIHJlZ2lzdGVyXG4gICAqIEBkb2NzLXByaXZhdGVcbiAgICovXG4gIHJlZ2lzdGVyT25Ub3VjaGVkKGZuOiAoKSA9PiB7fSk6IHZvaWQge1xuICAgIHRoaXMuX29uVG91Y2hlZCA9IGZuO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGxpc3Rib3gncyB2YWx1ZS5cbiAgICogQHBhcmFtIHZhbHVlIFRoZSBuZXcgdmFsdWUgb2YgdGhlIGxpc3Rib3hcbiAgICogQGRvY3MtcHJpdmF0ZVxuICAgKi9cbiAgd3JpdGVWYWx1ZSh2YWx1ZTogcmVhZG9ubHkgVFtdKTogdm9pZCB7XG4gICAgdGhpcy5fc2V0U2VsZWN0aW9uKHZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBkaXNhYmxlZCBzdGF0ZSBvZiB0aGUgbGlzdGJveC5cbiAgICogQHBhcmFtIGlzRGlzYWJsZWQgVGhlIG5ldyBkaXNhYmxlZCBzdGF0ZVxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICBzZXREaXNhYmxlZFN0YXRlKGlzRGlzYWJsZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICB0aGlzLmRpc2FibGVkID0gaXNEaXNhYmxlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGUgZ2l2ZW4gY29udHJvbFxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICB2YWxpZGF0ZShjb250cm9sOiBBYnN0cmFjdENvbnRyb2w8YW55LCBhbnk+KTogVmFsaWRhdGlvbkVycm9ycyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLl92YWxpZGF0b3JzKGNvbnRyb2wpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBhIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBmb3JtIHZhbGlkYXRvciBjaGFuZ2VzLlxuICAgKiBAcGFyYW0gZm4gVGhlIGNhbGxiYWNrIHRvIGNhbGxcbiAgICogQGRvY3MtcHJpdmF0ZVxuICAgKi9cbiAgcmVnaXN0ZXJPblZhbGlkYXRvckNoYW5nZShmbjogKCkgPT4gdm9pZCkge1xuICAgIHRoaXMuX29uVmFsaWRhdG9yQ2hhbmdlID0gZm47XG4gIH1cblxuICAvKiogRm9jdXMgdGhlIGxpc3Rib3gncyBob3N0IGVsZW1lbnQuICovXG4gIGZvY3VzKCkge1xuICAgIHRoaXMuZWxlbWVudC5mb2N1cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyaWdnZXJzIHRoZSBnaXZlbiBvcHRpb24gaW4gcmVzcG9uc2UgdG8gdXNlciBpbnRlcmFjdGlvbi5cbiAgICogLSBJbiBzaW5nbGUgc2VsZWN0aW9uIG1vZGU6IHNlbGVjdHMgdGhlIG9wdGlvbiBhbmQgZGVzZWxlY3RzIGFueSBvdGhlciBzZWxlY3RlZCBvcHRpb24uXG4gICAqIC0gSW4gbXVsdGkgc2VsZWN0aW9uIG1vZGU6IHRvZ2dsZXMgdGhlIHNlbGVjdGVkIHN0YXRlIG9mIHRoZSBvcHRpb24uXG4gICAqIEBwYXJhbSBvcHRpb24gVGhlIG9wdGlvbiB0byB0cmlnZ2VyXG4gICAqL1xuICBwcm90ZWN0ZWQgdHJpZ2dlck9wdGlvbihvcHRpb246IENka09wdGlvbjxUPiB8IG51bGwpIHtcbiAgICBpZiAob3B0aW9uICYmICFvcHRpb24uZGlzYWJsZWQpIHtcbiAgICAgIHRoaXMuX2xhc3RUcmlnZ2VyZWQgPSBvcHRpb247XG4gICAgICBjb25zdCBjaGFuZ2VkID0gdGhpcy5tdWx0aXBsZVxuICAgICAgICA/IHRoaXMuc2VsZWN0aW9uTW9kZWwudG9nZ2xlKG9wdGlvbi52YWx1ZSlcbiAgICAgICAgOiB0aGlzLnNlbGVjdGlvbk1vZGVsLnNlbGVjdChvcHRpb24udmFsdWUpO1xuICAgICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgICAgdGhpcy5fb25DaGFuZ2UodGhpcy52YWx1ZSk7XG4gICAgICAgIHRoaXMudmFsdWVDaGFuZ2UubmV4dCh7XG4gICAgICAgICAgdmFsdWU6IHRoaXMudmFsdWUsXG4gICAgICAgICAgbGlzdGJveDogdGhpcyxcbiAgICAgICAgICBvcHRpb246IG9wdGlvbixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRyaWdnZXIgdGhlIGdpdmVuIHJhbmdlIG9mIG9wdGlvbnMgaW4gcmVzcG9uc2UgdG8gdXNlciBpbnRlcmFjdGlvbi5cbiAgICogU2hvdWxkIG9ubHkgYmUgY2FsbGVkIGluIG11bHRpLXNlbGVjdGlvbiBtb2RlLlxuICAgKiBAcGFyYW0gdHJpZ2dlciBUaGUgb3B0aW9uIHRoYXQgd2FzIHRyaWdnZXJlZFxuICAgKiBAcGFyYW0gZnJvbSBUaGUgc3RhcnQgaW5kZXggb2YgdGhlIG9wdGlvbnMgdG8gdG9nZ2xlXG4gICAqIEBwYXJhbSB0byBUaGUgZW5kIGluZGV4IG9mIHRoZSBvcHRpb25zIHRvIHRvZ2dsZVxuICAgKiBAcGFyYW0gb24gV2hldGhlciB0byB0b2dnbGUgdGhlIG9wdGlvbiByYW5nZSBvblxuICAgKi9cbiAgcHJvdGVjdGVkIHRyaWdnZXJSYW5nZSh0cmlnZ2VyOiBDZGtPcHRpb248VD4gfCBudWxsLCBmcm9tOiBudW1iZXIsIHRvOiBudW1iZXIsIG9uOiBib29sZWFuKSB7XG4gICAgaWYgKHRoaXMuZGlzYWJsZWQgfHwgKHRyaWdnZXIgJiYgdHJpZ2dlci5kaXNhYmxlZCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fbGFzdFRyaWdnZXJlZCA9IHRyaWdnZXI7XG4gICAgY29uc3QgaXNFcXVhbCA9IHRoaXMuY29tcGFyZVdpdGggPz8gT2JqZWN0LmlzO1xuICAgIGNvbnN0IHVwZGF0ZVZhbHVlcyA9IFsuLi50aGlzLm9wdGlvbnNdXG4gICAgICAuc2xpY2UoTWF0aC5tYXgoMCwgTWF0aC5taW4oZnJvbSwgdG8pKSwgTWF0aC5taW4odGhpcy5vcHRpb25zLmxlbmd0aCwgTWF0aC5tYXgoZnJvbSwgdG8pICsgMSkpXG4gICAgICAuZmlsdGVyKG9wdGlvbiA9PiAhb3B0aW9uLmRpc2FibGVkKVxuICAgICAgLm1hcChvcHRpb24gPT4gb3B0aW9uLnZhbHVlKTtcbiAgICBjb25zdCBzZWxlY3RlZCA9IFsuLi50aGlzLnZhbHVlXTtcbiAgICBmb3IgKGNvbnN0IHVwZGF0ZVZhbHVlIG9mIHVwZGF0ZVZhbHVlcykge1xuICAgICAgY29uc3Qgc2VsZWN0ZWRJbmRleCA9IHNlbGVjdGVkLmZpbmRJbmRleChzZWxlY3RlZFZhbHVlID0+XG4gICAgICAgIGlzRXF1YWwoc2VsZWN0ZWRWYWx1ZSwgdXBkYXRlVmFsdWUpLFxuICAgICAgKTtcbiAgICAgIGlmIChvbiAmJiBzZWxlY3RlZEluZGV4ID09PSAtMSkge1xuICAgICAgICBzZWxlY3RlZC5wdXNoKHVwZGF0ZVZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAoIW9uICYmIHNlbGVjdGVkSW5kZXggIT09IC0xKSB7XG4gICAgICAgIHNlbGVjdGVkLnNwbGljZShzZWxlY3RlZEluZGV4LCAxKTtcbiAgICAgIH1cbiAgICB9XG4gICAgbGV0IGNoYW5nZWQgPSB0aGlzLnNlbGVjdGlvbk1vZGVsLnNldFNlbGVjdGlvbiguLi5zZWxlY3RlZCk7XG4gICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgIHRoaXMuX29uQ2hhbmdlKHRoaXMudmFsdWUpO1xuICAgICAgdGhpcy52YWx1ZUNoYW5nZS5uZXh0KHtcbiAgICAgICAgdmFsdWU6IHRoaXMudmFsdWUsXG4gICAgICAgIGxpc3Rib3g6IHRoaXMsXG4gICAgICAgIG9wdGlvbjogdHJpZ2dlcixcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBnaXZlbiBvcHRpb24gYXMgYWN0aXZlLlxuICAgKiBAcGFyYW0gb3B0aW9uIFRoZSBvcHRpb24gdG8gbWFrZSBhY3RpdmVcbiAgICovXG4gIF9zZXRBY3RpdmVPcHRpb24ob3B0aW9uOiBDZGtPcHRpb248VD4pIHtcbiAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyLnNldEFjdGl2ZUl0ZW0ob3B0aW9uKTtcbiAgfVxuXG4gIC8qKiBDYWxsZWQgd2hlbiB0aGUgbGlzdGJveCByZWNlaXZlcyBmb2N1cy4gKi9cbiAgcHJvdGVjdGVkIF9oYW5kbGVGb2N1cygpIHtcbiAgICBpZiAoIXRoaXMudXNlQWN0aXZlRGVzY2VuZGFudCkge1xuICAgICAgdGhpcy5saXN0S2V5TWFuYWdlci5zZXROZXh0SXRlbUFjdGl2ZSgpO1xuICAgICAgdGhpcy5fZm9jdXNBY3RpdmVPcHRpb24oKTtcbiAgICB9XG4gIH1cblxuICAvKiogQ2FsbGVkIHdoZW4gdGhlIHVzZXIgcHJlc3NlcyBrZXlkb3duIG9uIHRoZSBsaXN0Ym94LiAqL1xuICBwcm90ZWN0ZWQgX2hhbmRsZUtleWRvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcbiAgICBpZiAodGhpcy5fZGlzYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB7a2V5Q29kZX0gPSBldmVudDtcbiAgICBjb25zdCBwcmV2aW91c0FjdGl2ZUluZGV4ID0gdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtSW5kZXg7XG4gICAgY29uc3QgY3RybEtleXMgPSBbJ2N0cmxLZXknLCAnbWV0YUtleSddIGFzIGNvbnN0O1xuXG4gICAgaWYgKHRoaXMubXVsdGlwbGUgJiYga2V5Q29kZSA9PT0gQSAmJiBoYXNNb2RpZmllcktleShldmVudCwgLi4uY3RybEtleXMpKSB7XG4gICAgICAvLyBUb2dnbGUgYWxsIG9wdGlvbnMgb2ZmIGlmIHRoZXkncmUgYWxsIHNlbGVjdGVkLCBvdGhlcndpc2UgdG9nZ2xlIHRoZW0gYWxsIG9uLlxuICAgICAgdGhpcy50cmlnZ2VyUmFuZ2UoXG4gICAgICAgIG51bGwsXG4gICAgICAgIDAsXG4gICAgICAgIHRoaXMub3B0aW9ucy5sZW5ndGggLSAxLFxuICAgICAgICB0aGlzLm9wdGlvbnMubGVuZ3RoICE9PSB0aGlzLnZhbHVlLmxlbmd0aCxcbiAgICAgICk7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgIHRoaXMubXVsdGlwbGUgJiZcbiAgICAgIChrZXlDb2RlID09PSBTUEFDRSB8fCBrZXlDb2RlID09PSBFTlRFUikgJiZcbiAgICAgIGhhc01vZGlmaWVyS2V5KGV2ZW50LCAnc2hpZnRLZXknKVxuICAgICkge1xuICAgICAgaWYgKHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbSAmJiB0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleCAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMudHJpZ2dlclJhbmdlKFxuICAgICAgICAgIHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbSxcbiAgICAgICAgICB0aGlzLl9nZXRMYXN0VHJpZ2dlcmVkSW5kZXgoKSA/PyB0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleCxcbiAgICAgICAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleCxcbiAgICAgICAgICAhdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtLmlzU2VsZWN0ZWQoKSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgdGhpcy5tdWx0aXBsZSAmJlxuICAgICAga2V5Q29kZSA9PT0gSE9NRSAmJlxuICAgICAgaGFzTW9kaWZpZXJLZXkoZXZlbnQsIC4uLmN0cmxLZXlzKSAmJlxuICAgICAgaGFzTW9kaWZpZXJLZXkoZXZlbnQsICdzaGlmdEtleScpXG4gICAgKSB7XG4gICAgICBjb25zdCB0cmlnZ2VyID0gdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtO1xuICAgICAgaWYgKHRyaWdnZXIpIHtcbiAgICAgICAgY29uc3QgZnJvbSA9IHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbUluZGV4ITtcbiAgICAgICAgdGhpcy5saXN0S2V5TWFuYWdlci5zZXRGaXJzdEl0ZW1BY3RpdmUoKTtcbiAgICAgICAgdGhpcy50cmlnZ2VyUmFuZ2UoXG4gICAgICAgICAgdHJpZ2dlcixcbiAgICAgICAgICBmcm9tLFxuICAgICAgICAgIHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbUluZGV4ISxcbiAgICAgICAgICAhdHJpZ2dlci5pc1NlbGVjdGVkKCksXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgIHRoaXMubXVsdGlwbGUgJiZcbiAgICAgIGtleUNvZGUgPT09IEVORCAmJlxuICAgICAgaGFzTW9kaWZpZXJLZXkoZXZlbnQsIC4uLmN0cmxLZXlzKSAmJlxuICAgICAgaGFzTW9kaWZpZXJLZXkoZXZlbnQsICdzaGlmdEtleScpXG4gICAgKSB7XG4gICAgICBjb25zdCB0cmlnZ2VyID0gdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtO1xuICAgICAgaWYgKHRyaWdnZXIpIHtcbiAgICAgICAgY29uc3QgZnJvbSA9IHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbUluZGV4ITtcbiAgICAgICAgdGhpcy5saXN0S2V5TWFuYWdlci5zZXRMYXN0SXRlbUFjdGl2ZSgpO1xuICAgICAgICB0aGlzLnRyaWdnZXJSYW5nZShcbiAgICAgICAgICB0cmlnZ2VyLFxuICAgICAgICAgIGZyb20sXG4gICAgICAgICAgdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtSW5kZXghLFxuICAgICAgICAgICF0cmlnZ2VyLmlzU2VsZWN0ZWQoKSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGtleUNvZGUgPT09IFNQQUNFIHx8IGtleUNvZGUgPT09IEVOVEVSKSB7XG4gICAgICB0aGlzLnRyaWdnZXJPcHRpb24odGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtKTtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaXNOYXZLZXkgPVxuICAgICAga2V5Q29kZSA9PT0gVVBfQVJST1cgfHxcbiAgICAgIGtleUNvZGUgPT09IERPV05fQVJST1cgfHxcbiAgICAgIGtleUNvZGUgPT09IExFRlRfQVJST1cgfHxcbiAgICAgIGtleUNvZGUgPT09IFJJR0hUX0FSUk9XIHx8XG4gICAgICBrZXlDb2RlID09PSBIT01FIHx8XG4gICAgICBrZXlDb2RlID09PSBFTkQ7XG4gICAgdGhpcy5saXN0S2V5TWFuYWdlci5vbktleWRvd24oZXZlbnQpO1xuICAgIC8vIFdpbGwgc2VsZWN0IGFuIG9wdGlvbiBpZiBzaGlmdCB3YXMgcHJlc3NlZCB3aGlsZSBuYXZpZ2F0aW5nIHRvIHRoZSBvcHRpb25cbiAgICBpZiAoaXNOYXZLZXkgJiYgZXZlbnQuc2hpZnRLZXkgJiYgcHJldmlvdXNBY3RpdmVJbmRleCAhPT0gdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtSW5kZXgpIHtcbiAgICAgIHRoaXMudHJpZ2dlck9wdGlvbih0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsZWQgd2hlbiB0aGUgZm9jdXMgbGVhdmVzIGFuIGVsZW1lbnQgaW4gdGhlIGxpc3Rib3guXG4gICAqIEBwYXJhbSBldmVudCBUaGUgZm9jdXNvdXQgZXZlbnRcbiAgICovXG4gIHByb3RlY3RlZCBfaGFuZGxlRm9jdXNPdXQoZXZlbnQ6IEZvY3VzRXZlbnQpIHtcbiAgICBjb25zdCBvdGhlckVsZW1lbnQgPSBldmVudC5yZWxhdGVkVGFyZ2V0IGFzIEVsZW1lbnQ7XG4gICAgaWYgKHRoaXMuZWxlbWVudCAhPT0gb3RoZXJFbGVtZW50ICYmICF0aGlzLmVsZW1lbnQuY29udGFpbnMob3RoZXJFbGVtZW50KSkge1xuICAgICAgdGhpcy5fb25Ub3VjaGVkKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEdldCB0aGUgaWQgb2YgdGhlIGFjdGl2ZSBvcHRpb24gaWYgYWN0aXZlIGRlc2NlbmRhbnQgaXMgYmVpbmcgdXNlZC4gKi9cbiAgcHJvdGVjdGVkIF9nZXRBcmlhQWN0aXZlRGVzY2VuZGFudCgpOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fdXNlQWN0aXZlRGVzY2VuZGFudCA/IHRoaXMubGlzdEtleU1hbmFnZXI/LmFjdGl2ZUl0ZW0/LmlkIDogbnVsbDtcbiAgfVxuXG4gIC8qKiBHZXQgdGhlIHRhYmluZGV4IGZvciB0aGUgbGlzdGJveC4gKi9cbiAgcHJvdGVjdGVkIF9nZXRUYWJJbmRleCgpIHtcbiAgICBpZiAodGhpcy5kaXNhYmxlZCkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy51c2VBY3RpdmVEZXNjZW5kYW50IHx8ICF0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW0gPyB0aGlzLmVuYWJsZWRUYWJJbmRleCA6IC0xO1xuICB9XG5cbiAgLyoqIEluaXRpYWxpemUgdGhlIGtleSBtYW5hZ2VyLiAqL1xuICBwcml2YXRlIF9pbml0S2V5TWFuYWdlcigpIHtcbiAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyID0gbmV3IEFjdGl2ZURlc2NlbmRhbnRLZXlNYW5hZ2VyKHRoaXMub3B0aW9ucylcbiAgICAgIC53aXRoV3JhcCghdGhpcy5fbmF2aWdhdGlvbldyYXBEaXNhYmxlZClcbiAgICAgIC53aXRoVHlwZUFoZWFkKClcbiAgICAgIC53aXRoSG9tZUFuZEVuZCgpXG4gICAgICAud2l0aEFsbG93ZWRNb2RpZmllcktleXMoWydzaGlmdEtleSddKVxuICAgICAgLnNraXBQcmVkaWNhdGUoXG4gICAgICAgIHRoaXMuX25hdmlnYXRlRGlzYWJsZWRPcHRpb25zID8gdGhpcy5fc2tpcE5vbmVQcmVkaWNhdGUgOiB0aGlzLl9za2lwRGlzYWJsZWRQcmVkaWNhdGUsXG4gICAgICApO1xuXG4gICAgaWYgKHRoaXMub3JpZW50YXRpb24gPT09ICd2ZXJ0aWNhbCcpIHtcbiAgICAgIHRoaXMubGlzdEtleU1hbmFnZXIud2l0aFZlcnRpY2FsT3JpZW50YXRpb24oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5saXN0S2V5TWFuYWdlci53aXRoSG9yaXpvbnRhbE9yaWVudGF0aW9uKHRoaXMuX2Rpcj8udmFsdWUgfHwgJ2x0cicpO1xuICAgIH1cblxuICAgIHRoaXMubGlzdEtleU1hbmFnZXIuY2hhbmdlLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9mb2N1c0FjdGl2ZU9wdGlvbigpKTtcbiAgfVxuXG4gIC8qKiBGb2N1cyB0aGUgYWN0aXZlIG9wdGlvbi4gKi9cbiAgcHJpdmF0ZSBfZm9jdXNBY3RpdmVPcHRpb24oKSB7XG4gICAgaWYgKCF0aGlzLnVzZUFjdGl2ZURlc2NlbmRhbnQpIHtcbiAgICAgIHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbT8uZm9jdXMoKTtcbiAgICB9XG4gICAgdGhpcy5jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIHNlbGVjdGVkIHZhbHVlcy5cbiAgICogQHBhcmFtIHZhbHVlIFRoZSBsaXN0IG9mIG5ldyBzZWxlY3RlZCB2YWx1ZXMuXG4gICAqL1xuICBwcml2YXRlIF9zZXRTZWxlY3Rpb24odmFsdWU6IHJlYWRvbmx5IFRbXSkge1xuICAgIGlmICh0aGlzLl9pbnZhbGlkKSB7XG4gICAgICB0aGlzLnNlbGVjdGlvbk1vZGVsLmNsZWFyKGZhbHNlKTtcbiAgICB9XG4gICAgdGhpcy5zZWxlY3Rpb25Nb2RlbC5zZXRTZWxlY3Rpb24oLi4udGhpcy5fY29lcmNlVmFsdWUodmFsdWUpKTtcbiAgfVxuXG4gIC8qKiBVcGRhdGUgdGhlIGludGVybmFsIHZhbHVlIG9mIHRoZSBsaXN0Ym94IGJhc2VkIG9uIHRoZSBzZWxlY3Rpb24gbW9kZWwuICovXG4gIHByaXZhdGUgX3VwZGF0ZUludGVybmFsVmFsdWUoKSB7XG4gICAgY29uc3QgaW5kZXhDYWNoZSA9IG5ldyBNYXA8VCwgbnVtYmVyPigpO1xuICAgIHRoaXMuc2VsZWN0aW9uTW9kZWwuc29ydCgoYTogVCwgYjogVCkgPT4ge1xuICAgICAgY29uc3QgYUluZGV4ID0gdGhpcy5fZ2V0SW5kZXhGb3JWYWx1ZShpbmRleENhY2hlLCBhKTtcbiAgICAgIGNvbnN0IGJJbmRleCA9IHRoaXMuX2dldEluZGV4Rm9yVmFsdWUoaW5kZXhDYWNoZSwgYik7XG4gICAgICByZXR1cm4gYUluZGV4IC0gYkluZGV4O1xuICAgIH0pO1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3Rpb25Nb2RlbC5zZWxlY3RlZDtcbiAgICB0aGlzLl9pbnZhbGlkID1cbiAgICAgICghdGhpcy5tdWx0aXBsZSAmJiBzZWxlY3RlZC5sZW5ndGggPiAxKSB8fCAhIXRoaXMuX2dldEludmFsaWRPcHRpb25WYWx1ZXMoc2VsZWN0ZWQpLmxlbmd0aDtcbiAgICB0aGlzLl9vblZhbGlkYXRvckNoYW5nZSgpO1xuICAgIHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW5kZXggb2YgdGhlIGdpdmVuIHZhbHVlIGluIHRoZSBnaXZlbiBsaXN0IG9mIG9wdGlvbnMuXG4gICAqIEBwYXJhbSBjYWNoZSBUaGUgY2FjaGUgb2YgaW5kaWNlcyBmb3VuZCBzbyBmYXJcbiAgICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBmaW5kXG4gICAqIEByZXR1cm4gVGhlIGluZGV4IG9mIHRoZSB2YWx1ZSBpbiB0aGUgb3B0aW9ucyBsaXN0XG4gICAqL1xuICBwcml2YXRlIF9nZXRJbmRleEZvclZhbHVlKGNhY2hlOiBNYXA8VCwgbnVtYmVyPiwgdmFsdWU6IFQpIHtcbiAgICBjb25zdCBpc0VxdWFsID0gdGhpcy5jb21wYXJlV2l0aCB8fCBPYmplY3QuaXM7XG4gICAgaWYgKCFjYWNoZS5oYXModmFsdWUpKSB7XG4gICAgICBsZXQgaW5kZXggPSAtMTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5vcHRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChpc0VxdWFsKHZhbHVlLCB0aGlzLm9wdGlvbnMuZ2V0KGkpIS52YWx1ZSkpIHtcbiAgICAgICAgICBpbmRleCA9IGk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNhY2hlLnNldCh2YWx1ZSwgaW5kZXgpO1xuICAgIH1cbiAgICByZXR1cm4gY2FjaGUuZ2V0KHZhbHVlKSE7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlIHRoZSB1c2VyIGNsaWNraW5nIGFuIG9wdGlvbi5cbiAgICogQHBhcmFtIG9wdGlvbiBUaGUgb3B0aW9uIHRoYXQgd2FzIGNsaWNrZWQuXG4gICAqL1xuICBwcml2YXRlIF9oYW5kbGVPcHRpb25DbGlja2VkKG9wdGlvbjogQ2RrT3B0aW9uPFQ+LCBldmVudDogTW91c2VFdmVudCkge1xuICAgIHRoaXMubGlzdEtleU1hbmFnZXIuc2V0QWN0aXZlSXRlbShvcHRpb24pO1xuICAgIGlmIChldmVudC5zaGlmdEtleSAmJiB0aGlzLm11bHRpcGxlKSB7XG4gICAgICB0aGlzLnRyaWdnZXJSYW5nZShcbiAgICAgICAgb3B0aW9uLFxuICAgICAgICB0aGlzLl9nZXRMYXN0VHJpZ2dlcmVkSW5kZXgoKSA/PyB0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleCEsXG4gICAgICAgIHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbUluZGV4ISxcbiAgICAgICAgIW9wdGlvbi5pc1NlbGVjdGVkKCksXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnRyaWdnZXJPcHRpb24ob3B0aW9uKTtcbiAgICB9XG4gIH1cblxuICAvKiogVmVyaWZpZXMgdGhhdCBubyB0d28gb3B0aW9ucyByZXByZXNlbnQgdGhlIHNhbWUgdmFsdWUgdW5kZXIgdGhlIGNvbXBhcmVXaXRoIGZ1bmN0aW9uLiAqL1xuICBwcml2YXRlIF92ZXJpZnlOb09wdGlvblZhbHVlQ29sbGlzaW9ucygpIHtcbiAgICB0aGlzLm9wdGlvbnMuY2hhbmdlcy5waXBlKHN0YXJ0V2l0aCh0aGlzLm9wdGlvbnMpLCB0YWtlVW50aWwodGhpcy5kZXN0cm95ZWQpKS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgY29uc3QgaXNFcXVhbCA9IHRoaXMuY29tcGFyZVdpdGggPz8gT2JqZWN0LmlzO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm9wdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3Qgb3B0aW9uID0gdGhpcy5vcHRpb25zLmdldChpKSE7XG4gICAgICAgIGxldCBkdXBsaWNhdGU6IENka09wdGlvbjxUPiB8IG51bGwgPSBudWxsO1xuICAgICAgICBmb3IgKGxldCBqID0gaSArIDE7IGogPCB0aGlzLm9wdGlvbnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBjb25zdCBvdGhlciA9IHRoaXMub3B0aW9ucy5nZXQoaikhO1xuICAgICAgICAgIGlmIChpc0VxdWFsKG9wdGlvbi52YWx1ZSwgb3RoZXIudmFsdWUpKSB7XG4gICAgICAgICAgICBkdXBsaWNhdGUgPSBvdGhlcjtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZHVwbGljYXRlKSB7XG4gICAgICAgICAgLy8gVE9ETyhtbWFsZXJiYSk6IExpbmsgdG8gZG9jcyBhYm91dCB0aGlzLlxuICAgICAgICAgIGlmICh0aGlzLmNvbXBhcmVXaXRoKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICAgIGBGb3VuZCBtdWx0aXBsZSBDZGtPcHRpb24gcmVwcmVzZW50aW5nIHRoZSBzYW1lIHZhbHVlIHVuZGVyIHRoZSBnaXZlbiBjb21wYXJlV2l0aCBmdW5jdGlvbmAsXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBvcHRpb24xOiBvcHRpb24uZWxlbWVudCxcbiAgICAgICAgICAgICAgICBvcHRpb24yOiBkdXBsaWNhdGUuZWxlbWVudCxcbiAgICAgICAgICAgICAgICBjb21wYXJlV2l0aDogdGhpcy5jb21wYXJlV2l0aCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgRm91bmQgbXVsdGlwbGUgQ2RrT3B0aW9uIHdpdGggdGhlIHNhbWUgdmFsdWVgLCB7XG4gICAgICAgICAgICAgIG9wdGlvbjE6IG9wdGlvbi5lbGVtZW50LFxuICAgICAgICAgICAgICBvcHRpb24yOiBkdXBsaWNhdGUuZWxlbWVudCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb2VyY2VzIGEgdmFsdWUgaW50byBhbiBhcnJheSByZXByZXNlbnRpbmcgYSBsaXN0Ym94IHNlbGVjdGlvbi5cbiAgICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBjb2VyY2VcbiAgICogQHJldHVybiBBbiBhcnJheVxuICAgKi9cbiAgcHJpdmF0ZSBfY29lcmNlVmFsdWUodmFsdWU6IHJlYWRvbmx5IFRbXSkge1xuICAgIHJldHVybiB2YWx1ZSA9PSBudWxsID8gW10gOiBjb2VyY2VBcnJheSh2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBzdWJsaXN0IG9mIHZhbHVlcyB0aGF0IGRvIG5vdCByZXByZXNlbnQgdmFsaWQgb3B0aW9uIHZhbHVlcyBpbiB0aGlzIGxpc3Rib3guXG4gICAqIEBwYXJhbSB2YWx1ZXMgVGhlIGxpc3Qgb2YgdmFsdWVzXG4gICAqIEByZXR1cm4gVGhlIHN1Ymxpc3Qgb2YgdmFsdWVzIHRoYXQgYXJlIG5vdCB2YWxpZCBvcHRpb24gdmFsdWVzXG4gICAqL1xuICBwcml2YXRlIF9nZXRJbnZhbGlkT3B0aW9uVmFsdWVzKHZhbHVlczogcmVhZG9ubHkgVFtdKSB7XG4gICAgY29uc3QgaXNFcXVhbCA9IHRoaXMuY29tcGFyZVdpdGggfHwgT2JqZWN0LmlzO1xuICAgIGNvbnN0IHZhbGlkVmFsdWVzID0gKHRoaXMub3B0aW9ucyB8fCBbXSkubWFwKG9wdGlvbiA9PiBvcHRpb24udmFsdWUpO1xuICAgIHJldHVybiB2YWx1ZXMuZmlsdGVyKHZhbHVlID0+ICF2YWxpZFZhbHVlcy5zb21lKHZhbGlkVmFsdWUgPT4gaXNFcXVhbCh2YWx1ZSwgdmFsaWRWYWx1ZSkpKTtcbiAgfVxuXG4gIC8qKiBHZXQgdGhlIGluZGV4IG9mIHRoZSBsYXN0IHRyaWdnZXJlZCBvcHRpb24uICovXG4gIHByaXZhdGUgX2dldExhc3RUcmlnZ2VyZWRJbmRleCgpIHtcbiAgICBjb25zdCBpbmRleCA9IHRoaXMub3B0aW9ucy50b0FycmF5KCkuaW5kZXhPZih0aGlzLl9sYXN0VHJpZ2dlcmVkISk7XG4gICAgcmV0dXJuIGluZGV4ID09PSAtMSA/IG51bGwgOiBpbmRleDtcbiAgfVxufVxuXG4vKiogQ2hhbmdlIGV2ZW50IHRoYXQgaXMgZmlyZWQgd2hlbmV2ZXIgdGhlIHZhbHVlIG9mIHRoZSBsaXN0Ym94IGNoYW5nZXMuICovXG5leHBvcnQgaW50ZXJmYWNlIExpc3Rib3hWYWx1ZUNoYW5nZUV2ZW50PFQ+IHtcbiAgLyoqIFRoZSBuZXcgdmFsdWUgb2YgdGhlIGxpc3Rib3guICovXG4gIHJlYWRvbmx5IHZhbHVlOiByZWFkb25seSBUW107XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgbGlzdGJveCB0aGF0IGVtaXR0ZWQgdGhlIGV2ZW50LiAqL1xuICByZWFkb25seSBsaXN0Ym94OiBDZGtMaXN0Ym94PFQ+O1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIG9wdGlvbiB0aGF0IHdhcyB0cmlnZ2VyZWQuICovXG4gIHJlYWRvbmx5IG9wdGlvbjogQ2RrT3B0aW9uPFQ+IHwgbnVsbDtcbn1cbiJdfQ==