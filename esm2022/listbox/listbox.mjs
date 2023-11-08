/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { booleanAttribute, ChangeDetectorRef, ContentChildren, Directive, ElementRef, forwardRef, inject, Input, NgZone, Output, QueryList, } from '@angular/core';
import { ActiveDescendantKeyManager } from '@angular/cdk/a11y';
import { A, DOWN_ARROW, END, ENTER, hasModifierKey, HOME, LEFT_ARROW, RIGHT_ARROW, SPACE, UP_ARROW, } from '@angular/cdk/keycodes';
import { coerceArray } from '@angular/cdk/coercion';
import { SelectionModel } from '@angular/cdk/collections';
import { defer, fromEvent, merge, Subject } from 'rxjs';
import { filter, map, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
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
        this._disabled = value;
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
        return this.listbox.isActive(this);
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
     * No-op implemented as a part of `Highlightable`.
     * @docs-private
     */
    setActiveStyles() { }
    /**
     * No-op implemented as a part of `Highlightable`.
     * @docs-private
     */
    setInactiveStyles() { }
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkOption, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "16.1.0", version: "17.0.0", type: CdkOption, isStandalone: true, selector: "[cdkOption]", inputs: { id: "id", value: ["cdkOption", "value"], typeaheadLabel: ["cdkOptionTypeaheadLabel", "typeaheadLabel"], disabled: ["cdkOptionDisabled", "disabled", booleanAttribute], enabledTabIndex: ["tabindex", "enabledTabIndex"] }, host: { attributes: { "role": "option" }, listeners: { "click": "_clicked.next($event)", "focus": "_handleFocus()" }, properties: { "id": "id", "attr.aria-selected": "isSelected()", "attr.tabindex": "_getTabIndex()", "attr.aria-disabled": "disabled", "class.cdk-option-active": "isActive()" }, classAttribute: "cdk-option" }, exportAs: ["cdkOption"], ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkOption, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkOption]',
                    standalone: true,
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
                args: [{ alias: 'cdkOptionDisabled', transform: booleanAttribute }]
            }], enabledTabIndex: [{
                type: Input,
                args: ['tabindex']
            }] } });
export class CdkListbox {
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
        this.selectionModel.multiple = value;
        if (this.options) {
            this._updateInternalValue();
        }
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
        this._navigationWrapDisabled = wrap;
        this.listKeyManager?.withWrap(!this._navigationWrapDisabled);
    }
    /** Whether keyboard navigation should skip over disabled items. */
    get navigateDisabledOptions() {
        return this._navigateDisabledOptions;
    }
    set navigateDisabledOptions(skip) {
        this._navigateDisabledOptions = skip;
        this.listKeyManager?.skipPredicate(this._navigateDisabledOptions ? this._skipNonePredicate : this._skipDisabledPredicate);
    }
    constructor() {
        this._generatedId = `cdk-listbox-${nextId++}`;
        /** Whether the listbox is disabled. */
        this.disabled = false;
        /** Whether the listbox will use active descendant or will move focus onto the options. */
        this.useActiveDescendant = false;
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
        /** The Angular zone. */
        this.ngZone = inject(NgZone);
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
        /** Emits when an option has been clicked. */
        this._optionClicked = defer(() => this.options.changes.pipe(startWith(this.options), switchMap(options => merge(...options.map(option => option._clicked.pipe(map(event => ({ option, event }))))))));
        /** The directionality of the page. */
        this._dir = inject(Directionality, { optional: true });
        /** A predicate that skips disabled options. */
        this._skipDisabledPredicate = (option) => option.disabled;
        /** A predicate that does not skip any options. */
        this._skipNonePredicate = () => false;
        /** Whether the listbox currently has focus. */
        this._hasFocus = false;
        /** A reference to the option that was active before the listbox lost focus. */
        this._previousActiveOption = null;
        this._setPreviousActiveOptionAsActiveOptionOnWindowBlur();
    }
    ngAfterContentInit() {
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            this._verifyNoOptionValueCollisions();
            this._verifyOptionValues();
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
     * Get whether the given option is active.
     * @param option The option to get the active state of
     */
    isActive(option) {
        return !!(this.listKeyManager?.activeItem === option);
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
        this._verifyOptionValues();
    }
    /**
     * Sets the disabled state of the listbox.
     * @param isDisabled The new disabled state
     * @docs-private
     */
    setDisabledState(isDisabled) {
        this.disabled = isDisabled;
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
            if (this.selectionModel.selected.length > 0) {
                this._setNextFocusToSelectedOption();
            }
            else {
                this.listKeyManager.setNextItemActive();
            }
            this._focusActiveOption();
        }
    }
    /** Called when the user presses keydown on the listbox. */
    _handleKeydown(event) {
        if (this.disabled) {
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
    /** Called when a focus moves into the listbox. */
    _handleFocusIn() {
        // Note that we use a `focusin` handler for this instead of the existing `focus` handler,
        // because focus won't land on the listbox if `useActiveDescendant` is enabled.
        this._hasFocus = true;
    }
    /**
     * Called when the focus leaves an element in the listbox.
     * @param event The focusout event
     */
    _handleFocusOut(event) {
        // Some browsers (e.g. Chrome and Firefox) trigger the focusout event when the user returns back to the document.
        // To prevent losing the active option in this case, we store it in `_previousActiveOption` and restore it on the window `blur` event
        // This ensures that the `activeItem` matches the actual focused element when the user returns to the document.
        this._previousActiveOption = this.listKeyManager.activeItem;
        const otherElement = event.relatedTarget;
        if (this.element !== otherElement && !this.element.contains(otherElement)) {
            this._onTouched();
            this._hasFocus = false;
            this._setNextFocusToSelectedOption();
        }
    }
    /** Get the id of the active option if active descendant is being used. */
    _getAriaActiveDescendant() {
        return this.useActiveDescendant ? this.listKeyManager?.activeItem?.id : null;
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
        if (this.selectionModel.selected.length) {
            Promise.resolve().then(() => this._setNextFocusToSelectedOption());
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
        if (!this._hasFocus) {
            this._setNextFocusToSelectedOption();
        }
    }
    /** Sets the first selected option as first in the keyboard focus order. */
    _setNextFocusToSelectedOption() {
        // Null check the options since they only get defined after `ngAfterContentInit`.
        const selected = this.options?.find(option => option.isSelected());
        if (selected) {
            this.listKeyManager.updateActiveItem(selected);
        }
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
        event.preventDefault();
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
    /** Verifies that the option values are valid. */
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
    /**
     * Set previous active option as active option on window blur.
     * This ensures that the `activeOption` matches the actual focused element when the user returns to the document.
     */
    _setPreviousActiveOptionAsActiveOptionOnWindowBlur() {
        this.ngZone.runOutsideAngular(() => {
            fromEvent(window, 'blur')
                .pipe(takeUntil(this.destroyed))
                .subscribe(() => {
                if (this.element.contains(document.activeElement) && this._previousActiveOption) {
                    this._setActiveOption(this._previousActiveOption);
                    this._previousActiveOption = null;
                }
            });
        });
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkListbox, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "16.1.0", version: "17.0.0", type: CdkListbox, isStandalone: true, selector: "[cdkListbox]", inputs: { id: "id", enabledTabIndex: ["tabindex", "enabledTabIndex"], value: ["cdkListboxValue", "value"], multiple: ["cdkListboxMultiple", "multiple", booleanAttribute], disabled: ["cdkListboxDisabled", "disabled", booleanAttribute], useActiveDescendant: ["cdkListboxUseActiveDescendant", "useActiveDescendant", booleanAttribute], orientation: ["cdkListboxOrientation", "orientation"], compareWith: ["cdkListboxCompareWith", "compareWith"], navigationWrapDisabled: ["cdkListboxNavigationWrapDisabled", "navigationWrapDisabled", booleanAttribute], navigateDisabledOptions: ["cdkListboxNavigatesDisabledOptions", "navigateDisabledOptions", booleanAttribute] }, outputs: { valueChange: "cdkListboxValueChange" }, host: { attributes: { "role": "listbox" }, listeners: { "focus": "_handleFocus()", "keydown": "_handleKeydown($event)", "focusout": "_handleFocusOut($event)", "focusin": "_handleFocusIn()" }, properties: { "id": "id", "attr.tabindex": "_getTabIndex()", "attr.aria-disabled": "disabled", "attr.aria-multiselectable": "multiple", "attr.aria-activedescendant": "_getAriaActiveDescendant()", "attr.aria-orientation": "orientation" }, classAttribute: "cdk-listbox" }, providers: [
            {
                provide: NG_VALUE_ACCESSOR,
                useExisting: forwardRef(() => CdkListbox),
                multi: true,
            },
        ], queries: [{ propertyName: "options", predicate: CdkOption, descendants: true }], exportAs: ["cdkListbox"], ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkListbox, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkListbox]',
                    standalone: true,
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
                        '(focusin)': '_handleFocusIn()',
                    },
                    providers: [
                        {
                            provide: NG_VALUE_ACCESSOR,
                            useExisting: forwardRef(() => CdkListbox),
                            multi: true,
                        },
                    ],
                }]
        }], ctorParameters: () => [], propDecorators: { id: [{
                type: Input
            }], enabledTabIndex: [{
                type: Input,
                args: ['tabindex']
            }], value: [{
                type: Input,
                args: ['cdkListboxValue']
            }], multiple: [{
                type: Input,
                args: [{ alias: 'cdkListboxMultiple', transform: booleanAttribute }]
            }], disabled: [{
                type: Input,
                args: [{ alias: 'cdkListboxDisabled', transform: booleanAttribute }]
            }], useActiveDescendant: [{
                type: Input,
                args: [{ alias: 'cdkListboxUseActiveDescendant', transform: booleanAttribute }]
            }], orientation: [{
                type: Input,
                args: ['cdkListboxOrientation']
            }], compareWith: [{
                type: Input,
                args: ['cdkListboxCompareWith']
            }], navigationWrapDisabled: [{
                type: Input,
                args: [{ alias: 'cdkListboxNavigationWrapDisabled', transform: booleanAttribute }]
            }], navigateDisabledOptions: [{
                type: Input,
                args: [{ alias: 'cdkListboxNavigatesDisabledOptions', transform: booleanAttribute }]
            }], valueChange: [{
                type: Output,
                args: ['cdkListboxValueChange']
            }], options: [{
                type: ContentChildren,
                args: [CdkOption, { descendants: true }]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdGJveC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvbGlzdGJveC9saXN0Ym94LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFFTCxnQkFBZ0IsRUFDaEIsaUJBQWlCLEVBQ2pCLGVBQWUsRUFDZixTQUFTLEVBQ1QsVUFBVSxFQUNWLFVBQVUsRUFDVixNQUFNLEVBQ04sS0FBSyxFQUNMLE1BQU0sRUFFTixNQUFNLEVBQ04sU0FBUyxHQUNWLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQywwQkFBMEIsRUFBc0MsTUFBTSxtQkFBbUIsQ0FBQztBQUNsRyxPQUFPLEVBQ0wsQ0FBQyxFQUNELFVBQVUsRUFDVixHQUFHLEVBQ0gsS0FBSyxFQUNMLGNBQWMsRUFDZCxJQUFJLEVBQ0osVUFBVSxFQUNWLFdBQVcsRUFDWCxLQUFLLEVBQ0wsUUFBUSxHQUNULE1BQU0sdUJBQXVCLENBQUM7QUFDL0IsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2xELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUN4RCxPQUFPLEVBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQWMsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ2xFLE9BQU8sRUFBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDNUUsT0FBTyxFQUF1QixpQkFBaUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3ZFLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQzs7QUFFakQsc0RBQXNEO0FBQ3RELElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztBQUVmOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLHFCQUF5QixTQUFRLGNBQWlCO0lBQ3RELFlBQ1Ms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T0FBTztzQkFBakUsZUFBZTt1QkFBQyxTQUFTLEVBQUUsRUFBQyxXQUFXLEVBQUUsSUFBSSxFQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIEFmdGVyQ29udGVudEluaXQsXG4gIGJvb2xlYW5BdHRyaWJ1dGUsXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBDb250ZW50Q2hpbGRyZW4sXG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgZm9yd2FyZFJlZixcbiAgaW5qZWN0LFxuICBJbnB1dCxcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIE91dHB1dCxcbiAgUXVlcnlMaXN0LFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7QWN0aXZlRGVzY2VuZGFudEtleU1hbmFnZXIsIEhpZ2hsaWdodGFibGUsIExpc3RLZXlNYW5hZ2VyT3B0aW9ufSBmcm9tICdAYW5ndWxhci9jZGsvYTExeSc7XG5pbXBvcnQge1xuICBBLFxuICBET1dOX0FSUk9XLFxuICBFTkQsXG4gIEVOVEVSLFxuICBoYXNNb2RpZmllcktleSxcbiAgSE9NRSxcbiAgTEVGVF9BUlJPVyxcbiAgUklHSFRfQVJST1csXG4gIFNQQUNFLFxuICBVUF9BUlJPVyxcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2tleWNvZGVzJztcbmltcG9ydCB7Y29lcmNlQXJyYXl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge1NlbGVjdGlvbk1vZGVsfSBmcm9tICdAYW5ndWxhci9jZGsvY29sbGVjdGlvbnMnO1xuaW1wb3J0IHtkZWZlciwgZnJvbUV2ZW50LCBtZXJnZSwgT2JzZXJ2YWJsZSwgU3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2ZpbHRlciwgbWFwLCBzdGFydFdpdGgsIHN3aXRjaE1hcCwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge0NvbnRyb2xWYWx1ZUFjY2Vzc29yLCBOR19WQUxVRV9BQ0NFU1NPUn0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xuaW1wb3J0IHtEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuXG4vKiogVGhlIG5leHQgaWQgdG8gdXNlIGZvciBjcmVhdGluZyB1bmlxdWUgRE9NIElEcy4gKi9cbmxldCBuZXh0SWQgPSAwO1xuXG4vKipcbiAqIEFuIGltcGxlbWVudGF0aW9uIG9mIFNlbGVjdGlvbk1vZGVsIHRoYXQgaW50ZXJuYWxseSBhbHdheXMgcmVwcmVzZW50cyB0aGUgc2VsZWN0aW9uIGFzIGFcbiAqIG11bHRpLXNlbGVjdGlvbi4gVGhpcyBpcyBuZWNlc3Nhcnkgc28gdGhhdCB3ZSBjYW4gcmVjb3ZlciB0aGUgZnVsbCBzZWxlY3Rpb24gaWYgdGhlIHVzZXJcbiAqIHN3aXRjaGVzIHRoZSBsaXN0Ym94IGZyb20gc2luZ2xlLXNlbGVjdGlvbiB0byBtdWx0aS1zZWxlY3Rpb24gYWZ0ZXIgaW5pdGlhbGl6YXRpb24uXG4gKlxuICogVGhpcyBzZWxlY3Rpb24gbW9kZWwgbWF5IHJlcG9ydCBtdWx0aXBsZSBzZWxlY3RlZCB2YWx1ZXMsIGV2ZW4gaWYgaXQgaXMgaW4gc2luZ2xlLXNlbGVjdGlvblxuICogbW9kZS4gSXQgaXMgdXAgdG8gdGhlIHVzZXIgKENka0xpc3Rib3gpIHRvIGNoZWNrIGZvciBpbnZhbGlkIHNlbGVjdGlvbnMuXG4gKi9cbmNsYXNzIExpc3Rib3hTZWxlY3Rpb25Nb2RlbDxUPiBleHRlbmRzIFNlbGVjdGlvbk1vZGVsPFQ+IHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIG11bHRpcGxlID0gZmFsc2UsXG4gICAgaW5pdGlhbGx5U2VsZWN0ZWRWYWx1ZXM/OiBUW10sXG4gICAgZW1pdENoYW5nZXMgPSB0cnVlLFxuICAgIGNvbXBhcmVXaXRoPzogKG8xOiBULCBvMjogVCkgPT4gYm9vbGVhbixcbiAgKSB7XG4gICAgc3VwZXIodHJ1ZSwgaW5pdGlhbGx5U2VsZWN0ZWRWYWx1ZXMsIGVtaXRDaGFuZ2VzLCBjb21wYXJlV2l0aCk7XG4gIH1cblxuICBvdmVycmlkZSBpc011bHRpcGxlU2VsZWN0aW9uKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLm11bHRpcGxlO1xuICB9XG5cbiAgb3ZlcnJpZGUgc2VsZWN0KC4uLnZhbHVlczogVFtdKSB7XG4gICAgLy8gVGhlIHN1cGVyIGNsYXNzIGlzIGFsd2F5cyBpbiBtdWx0aS1zZWxlY3Rpb24gbW9kZSwgc28gd2UgbmVlZCB0byBvdmVycmlkZSB0aGUgYmVoYXZpb3IgaWZcbiAgICAvLyB0aGlzIHNlbGVjdGlvbiBtb2RlbCBhY3R1YWxseSBiZWxvbmdzIHRvIGEgc2luZ2xlLXNlbGVjdGlvbiBsaXN0Ym94LlxuICAgIGlmICh0aGlzLm11bHRpcGxlKSB7XG4gICAgICByZXR1cm4gc3VwZXIuc2VsZWN0KC4uLnZhbHVlcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzdXBlci5zZXRTZWxlY3Rpb24oLi4udmFsdWVzKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIEEgc2VsZWN0YWJsZSBvcHRpb24gaW4gYSBsaXN0Ym94LiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka09wdGlvbl0nLFxuICBzdGFuZGFsb25lOiB0cnVlLFxuICBleHBvcnRBczogJ2Nka09wdGlvbicsXG4gIGhvc3Q6IHtcbiAgICAncm9sZSc6ICdvcHRpb24nLFxuICAgICdjbGFzcyc6ICdjZGstb3B0aW9uJyxcbiAgICAnW2lkXSc6ICdpZCcsXG4gICAgJ1thdHRyLmFyaWEtc2VsZWN0ZWRdJzogJ2lzU2VsZWN0ZWQoKScsXG4gICAgJ1thdHRyLnRhYmluZGV4XSc6ICdfZ2V0VGFiSW5kZXgoKScsXG4gICAgJ1thdHRyLmFyaWEtZGlzYWJsZWRdJzogJ2Rpc2FibGVkJyxcbiAgICAnW2NsYXNzLmNkay1vcHRpb24tYWN0aXZlXSc6ICdpc0FjdGl2ZSgpJyxcbiAgICAnKGNsaWNrKSc6ICdfY2xpY2tlZC5uZXh0KCRldmVudCknLFxuICAgICcoZm9jdXMpJzogJ19oYW5kbGVGb2N1cygpJyxcbiAgfSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrT3B0aW9uPFQgPSB1bmtub3duPiBpbXBsZW1lbnRzIExpc3RLZXlNYW5hZ2VyT3B0aW9uLCBIaWdobGlnaHRhYmxlLCBPbkRlc3Ryb3kge1xuICAvKiogVGhlIGlkIG9mIHRoZSBvcHRpb24ncyBob3N0IGVsZW1lbnQuICovXG4gIEBJbnB1dCgpXG4gIGdldCBpZCgpIHtcbiAgICByZXR1cm4gdGhpcy5faWQgfHwgdGhpcy5fZ2VuZXJhdGVkSWQ7XG4gIH1cbiAgc2V0IGlkKHZhbHVlKSB7XG4gICAgdGhpcy5faWQgPSB2YWx1ZTtcbiAgfVxuICBwcml2YXRlIF9pZDogc3RyaW5nO1xuICBwcml2YXRlIF9nZW5lcmF0ZWRJZCA9IGBjZGstb3B0aW9uLSR7bmV4dElkKyt9YDtcblxuICAvKiogVGhlIHZhbHVlIG9mIHRoaXMgb3B0aW9uLiAqL1xuICBASW5wdXQoJ2Nka09wdGlvbicpIHZhbHVlOiBUO1xuXG4gIC8qKlxuICAgKiBUaGUgdGV4dCB1c2VkIHRvIGxvY2F0ZSB0aGlzIGl0ZW0gZHVyaW5nIGxpc3Rib3ggdHlwZWFoZWFkLiBJZiBub3Qgc3BlY2lmaWVkLFxuICAgKiB0aGUgYHRleHRDb250ZW50YCBvZiB0aGUgaXRlbSB3aWxsIGJlIHVzZWQuXG4gICAqL1xuICBASW5wdXQoJ2Nka09wdGlvblR5cGVhaGVhZExhYmVsJykgdHlwZWFoZWFkTGFiZWw6IHN0cmluZztcblxuICAvKiogV2hldGhlciB0aGlzIG9wdGlvbiBpcyBkaXNhYmxlZC4gKi9cbiAgQElucHV0KHthbGlhczogJ2Nka09wdGlvbkRpc2FibGVkJywgdHJhbnNmb3JtOiBib29sZWFuQXR0cmlidXRlfSlcbiAgZ2V0IGRpc2FibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmxpc3Rib3guZGlzYWJsZWQgfHwgdGhpcy5fZGlzYWJsZWQ7XG4gIH1cbiAgc2V0IGRpc2FibGVkKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5fZGlzYWJsZWQgPSB2YWx1ZTtcbiAgfVxuICBwcml2YXRlIF9kaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBUaGUgdGFiaW5kZXggb2YgdGhlIG9wdGlvbiB3aGVuIGl0IGlzIGVuYWJsZWQuICovXG4gIEBJbnB1dCgndGFiaW5kZXgnKVxuICBnZXQgZW5hYmxlZFRhYkluZGV4KCkge1xuICAgIHJldHVybiB0aGlzLl9lbmFibGVkVGFiSW5kZXggPT09IHVuZGVmaW5lZFxuICAgICAgPyB0aGlzLmxpc3Rib3guZW5hYmxlZFRhYkluZGV4XG4gICAgICA6IHRoaXMuX2VuYWJsZWRUYWJJbmRleDtcbiAgfVxuICBzZXQgZW5hYmxlZFRhYkluZGV4KHZhbHVlKSB7XG4gICAgdGhpcy5fZW5hYmxlZFRhYkluZGV4ID0gdmFsdWU7XG4gIH1cbiAgcHJpdmF0ZSBfZW5hYmxlZFRhYkluZGV4PzogbnVtYmVyIHwgbnVsbDtcblxuICAvKiogVGhlIG9wdGlvbidzIGhvc3QgZWxlbWVudCAqL1xuICByZWFkb25seSBlbGVtZW50OiBIVE1MRWxlbWVudCA9IGluamVjdChFbGVtZW50UmVmKS5uYXRpdmVFbGVtZW50O1xuXG4gIC8qKiBUaGUgcGFyZW50IGxpc3Rib3ggdGhpcyBvcHRpb24gYmVsb25ncyB0by4gKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IGxpc3Rib3g6IENka0xpc3Rib3g8VD4gPSBpbmplY3QoQ2RrTGlzdGJveCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIG9wdGlvbiBpcyBkZXN0cm95ZWQuICovXG4gIHByb3RlY3RlZCBkZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBvcHRpb24gaXMgY2xpY2tlZC4gKi9cbiAgcmVhZG9ubHkgX2NsaWNrZWQgPSBuZXcgU3ViamVjdDxNb3VzZUV2ZW50PigpO1xuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLmRlc3Ryb3llZC5jb21wbGV0ZSgpO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhpcyBvcHRpb24gaXMgc2VsZWN0ZWQuICovXG4gIGlzU2VsZWN0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMubGlzdGJveC5pc1NlbGVjdGVkKHRoaXMpO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhpcyBvcHRpb24gaXMgYWN0aXZlLiAqL1xuICBpc0FjdGl2ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5saXN0Ym94LmlzQWN0aXZlKHRoaXMpO1xuICB9XG5cbiAgLyoqIFRvZ2dsZSB0aGUgc2VsZWN0ZWQgc3RhdGUgb2YgdGhpcyBvcHRpb24uICovXG4gIHRvZ2dsZSgpIHtcbiAgICB0aGlzLmxpc3Rib3gudG9nZ2xlKHRoaXMpO1xuICB9XG5cbiAgLyoqIFNlbGVjdCB0aGlzIG9wdGlvbiBpZiBpdCBpcyBub3Qgc2VsZWN0ZWQuICovXG4gIHNlbGVjdCgpIHtcbiAgICB0aGlzLmxpc3Rib3guc2VsZWN0KHRoaXMpO1xuICB9XG5cbiAgLyoqIERlc2VsZWN0IHRoaXMgb3B0aW9uIGlmIGl0IGlzIHNlbGVjdGVkLiAqL1xuICBkZXNlbGVjdCgpIHtcbiAgICB0aGlzLmxpc3Rib3guZGVzZWxlY3QodGhpcyk7XG4gIH1cblxuICAvKiogRm9jdXMgdGhpcyBvcHRpb24uICovXG4gIGZvY3VzKCkge1xuICAgIHRoaXMuZWxlbWVudC5mb2N1cygpO1xuICB9XG5cbiAgLyoqIEdldCB0aGUgbGFiZWwgZm9yIHRoaXMgZWxlbWVudCB3aGljaCBpcyByZXF1aXJlZCBieSB0aGUgRm9jdXNhYmxlT3B0aW9uIGludGVyZmFjZS4gKi9cbiAgZ2V0TGFiZWwoKSB7XG4gICAgcmV0dXJuICh0aGlzLnR5cGVhaGVhZExhYmVsID8/IHRoaXMuZWxlbWVudC50ZXh0Q29udGVudD8udHJpbSgpKSB8fCAnJztcbiAgfVxuXG4gIC8qKlxuICAgKiBOby1vcCBpbXBsZW1lbnRlZCBhcyBhIHBhcnQgb2YgYEhpZ2hsaWdodGFibGVgLlxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICBzZXRBY3RpdmVTdHlsZXMoKSB7fVxuXG4gIC8qKlxuICAgKiBOby1vcCBpbXBsZW1lbnRlZCBhcyBhIHBhcnQgb2YgYEhpZ2hsaWdodGFibGVgLlxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICBzZXRJbmFjdGl2ZVN0eWxlcygpIHt9XG5cbiAgLyoqIEhhbmRsZSBmb2N1cyBldmVudHMgb24gdGhlIG9wdGlvbi4gKi9cbiAgcHJvdGVjdGVkIF9oYW5kbGVGb2N1cygpIHtcbiAgICAvLyBPcHRpb25zIGNhbiB3aW5kIHVwIGdldHRpbmcgZm9jdXNlZCBpbiBhY3RpdmUgZGVzY2VuZGFudCBtb2RlIGlmIHRoZSB1c2VyIGNsaWNrcyBvbiB0aGVtLlxuICAgIC8vIEluIHRoaXMgY2FzZSwgd2UgcHVzaCBmb2N1cyBiYWNrIHRvIHRoZSBwYXJlbnQgbGlzdGJveCB0byBwcmV2ZW50IGFuIGV4dHJhIHRhYiBzdG9wIHdoZW5cbiAgICAvLyB0aGUgdXNlciBwZXJmb3JtcyBhIHNoaWZ0K3RhYi5cbiAgICBpZiAodGhpcy5saXN0Ym94LnVzZUFjdGl2ZURlc2NlbmRhbnQpIHtcbiAgICAgIHRoaXMubGlzdGJveC5fc2V0QWN0aXZlT3B0aW9uKHRoaXMpO1xuICAgICAgdGhpcy5saXN0Ym94LmZvY3VzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEdldCB0aGUgdGFiaW5kZXggZm9yIHRoaXMgb3B0aW9uLiAqL1xuICBwcm90ZWN0ZWQgX2dldFRhYkluZGV4KCkge1xuICAgIGlmICh0aGlzLmxpc3Rib3gudXNlQWN0aXZlRGVzY2VuZGFudCB8fCB0aGlzLmRpc2FibGVkKSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmlzQWN0aXZlKCkgPyB0aGlzLmVuYWJsZWRUYWJJbmRleCA6IC0xO1xuICB9XG59XG5cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtMaXN0Ym94XScsXG4gIHN0YW5kYWxvbmU6IHRydWUsXG4gIGV4cG9ydEFzOiAnY2RrTGlzdGJveCcsXG4gIGhvc3Q6IHtcbiAgICAncm9sZSc6ICdsaXN0Ym94JyxcbiAgICAnY2xhc3MnOiAnY2RrLWxpc3Rib3gnLFxuICAgICdbaWRdJzogJ2lkJyxcbiAgICAnW2F0dHIudGFiaW5kZXhdJzogJ19nZXRUYWJJbmRleCgpJyxcbiAgICAnW2F0dHIuYXJpYS1kaXNhYmxlZF0nOiAnZGlzYWJsZWQnLFxuICAgICdbYXR0ci5hcmlhLW11bHRpc2VsZWN0YWJsZV0nOiAnbXVsdGlwbGUnLFxuICAgICdbYXR0ci5hcmlhLWFjdGl2ZWRlc2NlbmRhbnRdJzogJ19nZXRBcmlhQWN0aXZlRGVzY2VuZGFudCgpJyxcbiAgICAnW2F0dHIuYXJpYS1vcmllbnRhdGlvbl0nOiAnb3JpZW50YXRpb24nLFxuICAgICcoZm9jdXMpJzogJ19oYW5kbGVGb2N1cygpJyxcbiAgICAnKGtleWRvd24pJzogJ19oYW5kbGVLZXlkb3duKCRldmVudCknLFxuICAgICcoZm9jdXNvdXQpJzogJ19oYW5kbGVGb2N1c091dCgkZXZlbnQpJyxcbiAgICAnKGZvY3VzaW4pJzogJ19oYW5kbGVGb2N1c0luKCknLFxuICB9LFxuICBwcm92aWRlcnM6IFtcbiAgICB7XG4gICAgICBwcm92aWRlOiBOR19WQUxVRV9BQ0NFU1NPUixcbiAgICAgIHVzZUV4aXN0aW5nOiBmb3J3YXJkUmVmKCgpID0+IENka0xpc3Rib3gpLFxuICAgICAgbXVsdGk6IHRydWUsXG4gICAgfSxcbiAgXSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrTGlzdGJveDxUID0gdW5rbm93bj4gaW1wbGVtZW50cyBBZnRlckNvbnRlbnRJbml0LCBPbkRlc3Ryb3ksIENvbnRyb2xWYWx1ZUFjY2Vzc29yIHtcbiAgLyoqIFRoZSBpZCBvZiB0aGUgb3B0aW9uJ3MgaG9zdCBlbGVtZW50LiAqL1xuICBASW5wdXQoKVxuICBnZXQgaWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lkIHx8IHRoaXMuX2dlbmVyYXRlZElkO1xuICB9XG4gIHNldCBpZCh2YWx1ZSkge1xuICAgIHRoaXMuX2lkID0gdmFsdWU7XG4gIH1cbiAgcHJpdmF0ZSBfaWQ6IHN0cmluZztcbiAgcHJpdmF0ZSBfZ2VuZXJhdGVkSWQgPSBgY2RrLWxpc3Rib3gtJHtuZXh0SWQrK31gO1xuXG4gIC8qKiBUaGUgdGFiaW5kZXggdG8gdXNlIHdoZW4gdGhlIGxpc3Rib3ggaXMgZW5hYmxlZC4gKi9cbiAgQElucHV0KCd0YWJpbmRleCcpXG4gIGdldCBlbmFibGVkVGFiSW5kZXgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2VuYWJsZWRUYWJJbmRleCA9PT0gdW5kZWZpbmVkID8gMCA6IHRoaXMuX2VuYWJsZWRUYWJJbmRleDtcbiAgfVxuICBzZXQgZW5hYmxlZFRhYkluZGV4KHZhbHVlKSB7XG4gICAgdGhpcy5fZW5hYmxlZFRhYkluZGV4ID0gdmFsdWU7XG4gIH1cbiAgcHJpdmF0ZSBfZW5hYmxlZFRhYkluZGV4PzogbnVtYmVyIHwgbnVsbDtcblxuICAvKiogVGhlIHZhbHVlIHNlbGVjdGVkIGluIHRoZSBsaXN0Ym94LCByZXByZXNlbnRlZCBhcyBhbiBhcnJheSBvZiBvcHRpb24gdmFsdWVzLiAqL1xuICBASW5wdXQoJ2Nka0xpc3Rib3hWYWx1ZScpXG4gIGdldCB2YWx1ZSgpOiByZWFkb25seSBUW10ge1xuICAgIHJldHVybiB0aGlzLl9pbnZhbGlkID8gW10gOiB0aGlzLnNlbGVjdGlvbk1vZGVsLnNlbGVjdGVkO1xuICB9XG4gIHNldCB2YWx1ZSh2YWx1ZTogcmVhZG9ubHkgVFtdKSB7XG4gICAgdGhpcy5fc2V0U2VsZWN0aW9uKHZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBsaXN0Ym94IGFsbG93cyBtdWx0aXBsZSBvcHRpb25zIHRvIGJlIHNlbGVjdGVkLiBJZiB0aGUgdmFsdWUgc3dpdGNoZXMgZnJvbSBgdHJ1ZWBcbiAgICogdG8gYGZhbHNlYCwgYW5kIG1vcmUgdGhhbiBvbmUgb3B0aW9uIGlzIHNlbGVjdGVkLCBhbGwgb3B0aW9ucyBhcmUgZGVzZWxlY3RlZC5cbiAgICovXG4gIEBJbnB1dCh7YWxpYXM6ICdjZGtMaXN0Ym94TXVsdGlwbGUnLCB0cmFuc2Zvcm06IGJvb2xlYW5BdHRyaWJ1dGV9KVxuICBnZXQgbXVsdGlwbGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuc2VsZWN0aW9uTW9kZWwubXVsdGlwbGU7XG4gIH1cbiAgc2V0IG11bHRpcGxlKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5zZWxlY3Rpb25Nb2RlbC5tdWx0aXBsZSA9IHZhbHVlO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucykge1xuICAgICAgdGhpcy5fdXBkYXRlSW50ZXJuYWxWYWx1ZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBXaGV0aGVyIHRoZSBsaXN0Ym94IGlzIGRpc2FibGVkLiAqL1xuICBASW5wdXQoe2FsaWFzOiAnY2RrTGlzdGJveERpc2FibGVkJywgdHJhbnNmb3JtOiBib29sZWFuQXR0cmlidXRlfSlcbiAgZGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogV2hldGhlciB0aGUgbGlzdGJveCB3aWxsIHVzZSBhY3RpdmUgZGVzY2VuZGFudCBvciB3aWxsIG1vdmUgZm9jdXMgb250byB0aGUgb3B0aW9ucy4gKi9cbiAgQElucHV0KHthbGlhczogJ2Nka0xpc3Rib3hVc2VBY3RpdmVEZXNjZW5kYW50JywgdHJhbnNmb3JtOiBib29sZWFuQXR0cmlidXRlfSlcbiAgdXNlQWN0aXZlRGVzY2VuZGFudDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBUaGUgb3JpZW50YXRpb24gb2YgdGhlIGxpc3Rib3guIE9ubHkgYWZmZWN0cyBrZXlib2FyZCBpbnRlcmFjdGlvbiwgbm90IHZpc3VhbCBsYXlvdXQuICovXG4gIEBJbnB1dCgnY2RrTGlzdGJveE9yaWVudGF0aW9uJylcbiAgZ2V0IG9yaWVudGF0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9vcmllbnRhdGlvbjtcbiAgfVxuICBzZXQgb3JpZW50YXRpb24odmFsdWU6ICdob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCcpIHtcbiAgICB0aGlzLl9vcmllbnRhdGlvbiA9IHZhbHVlID09PSAnaG9yaXpvbnRhbCcgPyAnaG9yaXpvbnRhbCcgOiAndmVydGljYWwnO1xuICAgIGlmICh2YWx1ZSA9PT0gJ2hvcml6b250YWwnKSB7XG4gICAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyPy53aXRoSG9yaXpvbnRhbE9yaWVudGF0aW9uKHRoaXMuX2Rpcj8udmFsdWUgfHwgJ2x0cicpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyPy53aXRoVmVydGljYWxPcmllbnRhdGlvbigpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIF9vcmllbnRhdGlvbjogJ2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJyA9ICd2ZXJ0aWNhbCc7XG5cbiAgLyoqIFRoZSBmdW5jdGlvbiB1c2VkIHRvIGNvbXBhcmUgb3B0aW9uIHZhbHVlcy4gKi9cbiAgQElucHV0KCdjZGtMaXN0Ym94Q29tcGFyZVdpdGgnKVxuICBnZXQgY29tcGFyZVdpdGgoKTogdW5kZWZpbmVkIHwgKChvMTogVCwgbzI6IFQpID0+IGJvb2xlYW4pIHtcbiAgICByZXR1cm4gdGhpcy5zZWxlY3Rpb25Nb2RlbC5jb21wYXJlV2l0aDtcbiAgfVxuICBzZXQgY29tcGFyZVdpdGgoZm46IHVuZGVmaW5lZCB8ICgobzE6IFQsIG8yOiBUKSA9PiBib29sZWFuKSkge1xuICAgIHRoaXMuc2VsZWN0aW9uTW9kZWwuY29tcGFyZVdpdGggPSBmbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBrZXlib2FyZCBuYXZpZ2F0aW9uIHNob3VsZCB3cmFwIHdoZW4gdGhlIHVzZXIgcHJlc3NlcyBhcnJvdyBkb3duIG9uIHRoZSBsYXN0IGl0ZW1cbiAgICogb3IgYXJyb3cgdXAgb24gdGhlIGZpcnN0IGl0ZW0uXG4gICAqL1xuICBASW5wdXQoe2FsaWFzOiAnY2RrTGlzdGJveE5hdmlnYXRpb25XcmFwRGlzYWJsZWQnLCB0cmFuc2Zvcm06IGJvb2xlYW5BdHRyaWJ1dGV9KVxuICBnZXQgbmF2aWdhdGlvbldyYXBEaXNhYmxlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fbmF2aWdhdGlvbldyYXBEaXNhYmxlZDtcbiAgfVxuICBzZXQgbmF2aWdhdGlvbldyYXBEaXNhYmxlZCh3cmFwOiBib29sZWFuKSB7XG4gICAgdGhpcy5fbmF2aWdhdGlvbldyYXBEaXNhYmxlZCA9IHdyYXA7XG4gICAgdGhpcy5saXN0S2V5TWFuYWdlcj8ud2l0aFdyYXAoIXRoaXMuX25hdmlnYXRpb25XcmFwRGlzYWJsZWQpO1xuICB9XG4gIHByaXZhdGUgX25hdmlnYXRpb25XcmFwRGlzYWJsZWQgPSBmYWxzZTtcblxuICAvKiogV2hldGhlciBrZXlib2FyZCBuYXZpZ2F0aW9uIHNob3VsZCBza2lwIG92ZXIgZGlzYWJsZWQgaXRlbXMuICovXG4gIEBJbnB1dCh7YWxpYXM6ICdjZGtMaXN0Ym94TmF2aWdhdGVzRGlzYWJsZWRPcHRpb25zJywgdHJhbnNmb3JtOiBib29sZWFuQXR0cmlidXRlfSlcbiAgZ2V0IG5hdmlnYXRlRGlzYWJsZWRPcHRpb25zKCkge1xuICAgIHJldHVybiB0aGlzLl9uYXZpZ2F0ZURpc2FibGVkT3B0aW9ucztcbiAgfVxuICBzZXQgbmF2aWdhdGVEaXNhYmxlZE9wdGlvbnMoc2tpcDogYm9vbGVhbikge1xuICAgIHRoaXMuX25hdmlnYXRlRGlzYWJsZWRPcHRpb25zID0gc2tpcDtcbiAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyPy5za2lwUHJlZGljYXRlKFxuICAgICAgdGhpcy5fbmF2aWdhdGVEaXNhYmxlZE9wdGlvbnMgPyB0aGlzLl9za2lwTm9uZVByZWRpY2F0ZSA6IHRoaXMuX3NraXBEaXNhYmxlZFByZWRpY2F0ZSxcbiAgICApO1xuICB9XG4gIHByaXZhdGUgX25hdmlnYXRlRGlzYWJsZWRPcHRpb25zID0gZmFsc2U7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHNlbGVjdGVkIHZhbHVlKHMpIGluIHRoZSBsaXN0Ym94IGNoYW5nZS4gKi9cbiAgQE91dHB1dCgnY2RrTGlzdGJveFZhbHVlQ2hhbmdlJykgcmVhZG9ubHkgdmFsdWVDaGFuZ2UgPSBuZXcgU3ViamVjdDxMaXN0Ym94VmFsdWVDaGFuZ2VFdmVudDxUPj4oKTtcblxuICAvKiogVGhlIGNoaWxkIG9wdGlvbnMgaW4gdGhpcyBsaXN0Ym94LiAqL1xuICBAQ29udGVudENoaWxkcmVuKENka09wdGlvbiwge2Rlc2NlbmRhbnRzOiB0cnVlfSkgcHJvdGVjdGVkIG9wdGlvbnM6IFF1ZXJ5TGlzdDxDZGtPcHRpb248VD4+O1xuXG4gIC8qKiBUaGUgc2VsZWN0aW9uIG1vZGVsIHVzZWQgYnkgdGhlIGxpc3Rib3guICovXG4gIHByb3RlY3RlZCBzZWxlY3Rpb25Nb2RlbCA9IG5ldyBMaXN0Ym94U2VsZWN0aW9uTW9kZWw8VD4oKTtcblxuICAvKiogVGhlIGtleSBtYW5hZ2VyIHRoYXQgbWFuYWdlcyBrZXlib2FyZCBuYXZpZ2F0aW9uIGZvciB0aGlzIGxpc3Rib3guICovXG4gIHByb3RlY3RlZCBsaXN0S2V5TWFuYWdlcjogQWN0aXZlRGVzY2VuZGFudEtleU1hbmFnZXI8Q2RrT3B0aW9uPFQ+PjtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgbGlzdGJveCBpcyBkZXN0cm95ZWQuICovXG4gIHByb3RlY3RlZCByZWFkb25seSBkZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBUaGUgaG9zdCBlbGVtZW50IG9mIHRoZSBsaXN0Ym94LiAqL1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgZWxlbWVudDogSFRNTEVsZW1lbnQgPSBpbmplY3QoRWxlbWVudFJlZikubmF0aXZlRWxlbWVudDtcblxuICAvKiogVGhlIEFuZ3VsYXIgem9uZS4gKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IG5nWm9uZSA9IGluamVjdChOZ1pvbmUpO1xuXG4gIC8qKiBUaGUgY2hhbmdlIGRldGVjdG9yIGZvciB0aGlzIGxpc3Rib3guICovXG4gIHByb3RlY3RlZCByZWFkb25seSBjaGFuZ2VEZXRlY3RvclJlZiA9IGluamVjdChDaGFuZ2VEZXRlY3RvclJlZik7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCB2YWx1ZSBpbiB0aGUgc2VsZWN0aW9uIG1vZGVsIGlzIGludmFsaWQuICovXG4gIHByaXZhdGUgX2ludmFsaWQgPSBmYWxzZTtcblxuICAvKiogVGhlIGxhc3QgdXNlci10cmlnZ2VyZWQgb3B0aW9uLiAqL1xuICBwcml2YXRlIF9sYXN0VHJpZ2dlcmVkOiBDZGtPcHRpb248VD4gfCBudWxsID0gbnVsbDtcblxuICAvKiogQ2FsbGJhY2sgY2FsbGVkIHdoZW4gdGhlIGxpc3Rib3ggaGFzIGJlZW4gdG91Y2hlZCAqL1xuICBwcml2YXRlIF9vblRvdWNoZWQgPSAoKSA9PiB7fTtcblxuICAvKiogQ2FsbGJhY2sgY2FsbGVkIHdoZW4gdGhlIGxpc3Rib3ggdmFsdWUgY2hhbmdlcyAqL1xuICBwcml2YXRlIF9vbkNoYW5nZTogKHZhbHVlOiByZWFkb25seSBUW10pID0+IHZvaWQgPSAoKSA9PiB7fTtcblxuICAvKiogRW1pdHMgd2hlbiBhbiBvcHRpb24gaGFzIGJlZW4gY2xpY2tlZC4gKi9cbiAgcHJpdmF0ZSBfb3B0aW9uQ2xpY2tlZCA9IGRlZmVyKCgpID0+XG4gICAgKHRoaXMub3B0aW9ucy5jaGFuZ2VzIGFzIE9ic2VydmFibGU8Q2RrT3B0aW9uPFQ+W10+KS5waXBlKFxuICAgICAgc3RhcnRXaXRoKHRoaXMub3B0aW9ucyksXG4gICAgICBzd2l0Y2hNYXAob3B0aW9ucyA9PlxuICAgICAgICBtZXJnZSguLi5vcHRpb25zLm1hcChvcHRpb24gPT4gb3B0aW9uLl9jbGlja2VkLnBpcGUobWFwKGV2ZW50ID0+ICh7b3B0aW9uLCBldmVudH0pKSkpKSxcbiAgICAgICksXG4gICAgKSxcbiAgKTtcblxuICAvKiogVGhlIGRpcmVjdGlvbmFsaXR5IG9mIHRoZSBwYWdlLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9kaXIgPSBpbmplY3QoRGlyZWN0aW9uYWxpdHksIHtvcHRpb25hbDogdHJ1ZX0pO1xuXG4gIC8qKiBBIHByZWRpY2F0ZSB0aGF0IHNraXBzIGRpc2FibGVkIG9wdGlvbnMuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX3NraXBEaXNhYmxlZFByZWRpY2F0ZSA9IChvcHRpb246IENka09wdGlvbjxUPikgPT4gb3B0aW9uLmRpc2FibGVkO1xuXG4gIC8qKiBBIHByZWRpY2F0ZSB0aGF0IGRvZXMgbm90IHNraXAgYW55IG9wdGlvbnMuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX3NraXBOb25lUHJlZGljYXRlID0gKCkgPT4gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGxpc3Rib3ggY3VycmVudGx5IGhhcyBmb2N1cy4gKi9cbiAgcHJpdmF0ZSBfaGFzRm9jdXMgPSBmYWxzZTtcblxuICAvKiogQSByZWZlcmVuY2UgdG8gdGhlIG9wdGlvbiB0aGF0IHdhcyBhY3RpdmUgYmVmb3JlIHRoZSBsaXN0Ym94IGxvc3QgZm9jdXMuICovXG4gIHByaXZhdGUgX3ByZXZpb3VzQWN0aXZlT3B0aW9uOiBDZGtPcHRpb248VD4gfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9zZXRQcmV2aW91c0FjdGl2ZU9wdGlvbkFzQWN0aXZlT3B0aW9uT25XaW5kb3dCbHVyKCk7XG4gIH1cblxuICBuZ0FmdGVyQ29udGVudEluaXQoKSB7XG4gICAgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkge1xuICAgICAgdGhpcy5fdmVyaWZ5Tm9PcHRpb25WYWx1ZUNvbGxpc2lvbnMoKTtcbiAgICAgIHRoaXMuX3ZlcmlmeU9wdGlvblZhbHVlcygpO1xuICAgIH1cblxuICAgIHRoaXMuX2luaXRLZXlNYW5hZ2VyKCk7XG5cbiAgICAvLyBVcGRhdGUgdGhlIGludGVybmFsIHZhbHVlIHdoZW5ldmVyIHRoZSBvcHRpb25zIG9yIHRoZSBtb2RlbCB2YWx1ZSBjaGFuZ2VzLlxuICAgIG1lcmdlKHRoaXMuc2VsZWN0aW9uTW9kZWwuY2hhbmdlZCwgdGhpcy5vcHRpb25zLmNoYW5nZXMpXG4gICAgICAucGlwZShzdGFydFdpdGgobnVsbCksIHRha2VVbnRpbCh0aGlzLmRlc3Ryb3llZCkpXG4gICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMuX3VwZGF0ZUludGVybmFsVmFsdWUoKSk7XG5cbiAgICB0aGlzLl9vcHRpb25DbGlja2VkXG4gICAgICAucGlwZShcbiAgICAgICAgZmlsdGVyKCh7b3B0aW9ufSkgPT4gIW9wdGlvbi5kaXNhYmxlZCksXG4gICAgICAgIHRha2VVbnRpbCh0aGlzLmRlc3Ryb3llZCksXG4gICAgICApXG4gICAgICAuc3Vic2NyaWJlKCh7b3B0aW9uLCBldmVudH0pID0+IHRoaXMuX2hhbmRsZU9wdGlvbkNsaWNrZWQob3B0aW9uLCBldmVudCkpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5saXN0S2V5TWFuYWdlcj8uZGVzdHJveSgpO1xuICAgIHRoaXMuZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLmRlc3Ryb3llZC5jb21wbGV0ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZSB0aGUgc2VsZWN0ZWQgc3RhdGUgb2YgdGhlIGdpdmVuIG9wdGlvbi5cbiAgICogQHBhcmFtIG9wdGlvbiBUaGUgb3B0aW9uIHRvIHRvZ2dsZVxuICAgKi9cbiAgdG9nZ2xlKG9wdGlvbjogQ2RrT3B0aW9uPFQ+KSB7XG4gICAgdGhpcy50b2dnbGVWYWx1ZShvcHRpb24udmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZSB0aGUgc2VsZWN0ZWQgc3RhdGUgb2YgdGhlIGdpdmVuIHZhbHVlLlxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlIHRvIHRvZ2dsZVxuICAgKi9cbiAgdG9nZ2xlVmFsdWUodmFsdWU6IFQpIHtcbiAgICBpZiAodGhpcy5faW52YWxpZCkge1xuICAgICAgdGhpcy5zZWxlY3Rpb25Nb2RlbC5jbGVhcihmYWxzZSk7XG4gICAgfVxuICAgIHRoaXMuc2VsZWN0aW9uTW9kZWwudG9nZ2xlKHZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWxlY3QgdGhlIGdpdmVuIG9wdGlvbi5cbiAgICogQHBhcmFtIG9wdGlvbiBUaGUgb3B0aW9uIHRvIHNlbGVjdFxuICAgKi9cbiAgc2VsZWN0KG9wdGlvbjogQ2RrT3B0aW9uPFQ+KSB7XG4gICAgdGhpcy5zZWxlY3RWYWx1ZShvcHRpb24udmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbGVjdCB0aGUgZ2l2ZW4gdmFsdWUuXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gc2VsZWN0XG4gICAqL1xuICBzZWxlY3RWYWx1ZSh2YWx1ZTogVCkge1xuICAgIGlmICh0aGlzLl9pbnZhbGlkKSB7XG4gICAgICB0aGlzLnNlbGVjdGlvbk1vZGVsLmNsZWFyKGZhbHNlKTtcbiAgICB9XG4gICAgdGhpcy5zZWxlY3Rpb25Nb2RlbC5zZWxlY3QodmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc2VsZWN0IHRoZSBnaXZlbiBvcHRpb24uXG4gICAqIEBwYXJhbSBvcHRpb24gVGhlIG9wdGlvbiB0byBkZXNlbGVjdFxuICAgKi9cbiAgZGVzZWxlY3Qob3B0aW9uOiBDZGtPcHRpb248VD4pIHtcbiAgICB0aGlzLmRlc2VsZWN0VmFsdWUob3B0aW9uLnZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXNlbGVjdCB0aGUgZ2l2ZW4gdmFsdWUuXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gZGVzZWxlY3RcbiAgICovXG4gIGRlc2VsZWN0VmFsdWUodmFsdWU6IFQpIHtcbiAgICBpZiAodGhpcy5faW52YWxpZCkge1xuICAgICAgdGhpcy5zZWxlY3Rpb25Nb2RlbC5jbGVhcihmYWxzZSk7XG4gICAgfVxuICAgIHRoaXMuc2VsZWN0aW9uTW9kZWwuZGVzZWxlY3QodmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgc2VsZWN0ZWQgc3RhdGUgb2YgYWxsIG9wdGlvbnMuXG4gICAqIEBwYXJhbSBpc1NlbGVjdGVkIFRoZSBuZXcgc2VsZWN0ZWQgc3RhdGUgdG8gc2V0XG4gICAqL1xuICBzZXRBbGxTZWxlY3RlZChpc1NlbGVjdGVkOiBib29sZWFuKSB7XG4gICAgaWYgKCFpc1NlbGVjdGVkKSB7XG4gICAgICB0aGlzLnNlbGVjdGlvbk1vZGVsLmNsZWFyKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLl9pbnZhbGlkKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0aW9uTW9kZWwuY2xlYXIoZmFsc2UpO1xuICAgICAgfVxuICAgICAgdGhpcy5zZWxlY3Rpb25Nb2RlbC5zZWxlY3QoLi4udGhpcy5vcHRpb25zLm1hcChvcHRpb24gPT4gb3B0aW9uLnZhbHVlKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCB3aGV0aGVyIHRoZSBnaXZlbiBvcHRpb24gaXMgc2VsZWN0ZWQuXG4gICAqIEBwYXJhbSBvcHRpb24gVGhlIG9wdGlvbiB0byBnZXQgdGhlIHNlbGVjdGVkIHN0YXRlIG9mXG4gICAqL1xuICBpc1NlbGVjdGVkKG9wdGlvbjogQ2RrT3B0aW9uPFQ+KSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWx1ZVNlbGVjdGVkKG9wdGlvbi52YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHdoZXRoZXIgdGhlIGdpdmVuIG9wdGlvbiBpcyBhY3RpdmUuXG4gICAqIEBwYXJhbSBvcHRpb24gVGhlIG9wdGlvbiB0byBnZXQgdGhlIGFjdGl2ZSBzdGF0ZSBvZlxuICAgKi9cbiAgaXNBY3RpdmUob3B0aW9uOiBDZGtPcHRpb248VD4pOiBib29sZWFuIHtcbiAgICByZXR1cm4gISEodGhpcy5saXN0S2V5TWFuYWdlcj8uYWN0aXZlSXRlbSA9PT0gb3B0aW9uKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgd2hldGhlciB0aGUgZ2l2ZW4gdmFsdWUgaXMgc2VsZWN0ZWQuXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gZ2V0IHRoZSBzZWxlY3RlZCBzdGF0ZSBvZlxuICAgKi9cbiAgaXNWYWx1ZVNlbGVjdGVkKHZhbHVlOiBUKSB7XG4gICAgaWYgKHRoaXMuX2ludmFsaWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuc2VsZWN0aW9uTW9kZWwuaXNTZWxlY3RlZCh2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGEgY2FsbGJhY2sgdG8gYmUgaW52b2tlZCB3aGVuIHRoZSBsaXN0Ym94J3MgdmFsdWUgY2hhbmdlcyBmcm9tIHVzZXIgaW5wdXQuXG4gICAqIEBwYXJhbSBmbiBUaGUgY2FsbGJhY2sgdG8gcmVnaXN0ZXJcbiAgICogQGRvY3MtcHJpdmF0ZVxuICAgKi9cbiAgcmVnaXN0ZXJPbkNoYW5nZShmbjogKHZhbHVlOiByZWFkb25seSBUW10pID0+IHZvaWQpOiB2b2lkIHtcbiAgICB0aGlzLl9vbkNoYW5nZSA9IGZuO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBhIGNhbGxiYWNrIHRvIGJlIGludm9rZWQgd2hlbiB0aGUgbGlzdGJveCBpcyBibHVycmVkIGJ5IHRoZSB1c2VyLlxuICAgKiBAcGFyYW0gZm4gVGhlIGNhbGxiYWNrIHRvIHJlZ2lzdGVyXG4gICAqIEBkb2NzLXByaXZhdGVcbiAgICovXG4gIHJlZ2lzdGVyT25Ub3VjaGVkKGZuOiAoKSA9PiB7fSk6IHZvaWQge1xuICAgIHRoaXMuX29uVG91Y2hlZCA9IGZuO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGxpc3Rib3gncyB2YWx1ZS5cbiAgICogQHBhcmFtIHZhbHVlIFRoZSBuZXcgdmFsdWUgb2YgdGhlIGxpc3Rib3hcbiAgICogQGRvY3MtcHJpdmF0ZVxuICAgKi9cbiAgd3JpdGVWYWx1ZSh2YWx1ZTogcmVhZG9ubHkgVFtdKTogdm9pZCB7XG4gICAgdGhpcy5fc2V0U2VsZWN0aW9uKHZhbHVlKTtcbiAgICB0aGlzLl92ZXJpZnlPcHRpb25WYWx1ZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBkaXNhYmxlZCBzdGF0ZSBvZiB0aGUgbGlzdGJveC5cbiAgICogQHBhcmFtIGlzRGlzYWJsZWQgVGhlIG5ldyBkaXNhYmxlZCBzdGF0ZVxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICBzZXREaXNhYmxlZFN0YXRlKGlzRGlzYWJsZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICB0aGlzLmRpc2FibGVkID0gaXNEaXNhYmxlZDtcbiAgfVxuXG4gIC8qKiBGb2N1cyB0aGUgbGlzdGJveCdzIGhvc3QgZWxlbWVudC4gKi9cbiAgZm9jdXMoKSB7XG4gICAgdGhpcy5lbGVtZW50LmZvY3VzKCk7XG4gIH1cblxuICAvKipcbiAgICogVHJpZ2dlcnMgdGhlIGdpdmVuIG9wdGlvbiBpbiByZXNwb25zZSB0byB1c2VyIGludGVyYWN0aW9uLlxuICAgKiAtIEluIHNpbmdsZSBzZWxlY3Rpb24gbW9kZTogc2VsZWN0cyB0aGUgb3B0aW9uIGFuZCBkZXNlbGVjdHMgYW55IG90aGVyIHNlbGVjdGVkIG9wdGlvbi5cbiAgICogLSBJbiBtdWx0aSBzZWxlY3Rpb24gbW9kZTogdG9nZ2xlcyB0aGUgc2VsZWN0ZWQgc3RhdGUgb2YgdGhlIG9wdGlvbi5cbiAgICogQHBhcmFtIG9wdGlvbiBUaGUgb3B0aW9uIHRvIHRyaWdnZXJcbiAgICovXG4gIHByb3RlY3RlZCB0cmlnZ2VyT3B0aW9uKG9wdGlvbjogQ2RrT3B0aW9uPFQ+IHwgbnVsbCkge1xuICAgIGlmIChvcHRpb24gJiYgIW9wdGlvbi5kaXNhYmxlZCkge1xuICAgICAgdGhpcy5fbGFzdFRyaWdnZXJlZCA9IG9wdGlvbjtcbiAgICAgIGNvbnN0IGNoYW5nZWQgPSB0aGlzLm11bHRpcGxlXG4gICAgICAgID8gdGhpcy5zZWxlY3Rpb25Nb2RlbC50b2dnbGUob3B0aW9uLnZhbHVlKVxuICAgICAgICA6IHRoaXMuc2VsZWN0aW9uTW9kZWwuc2VsZWN0KG9wdGlvbi52YWx1ZSk7XG4gICAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgICB0aGlzLl9vbkNoYW5nZSh0aGlzLnZhbHVlKTtcbiAgICAgICAgdGhpcy52YWx1ZUNoYW5nZS5uZXh0KHtcbiAgICAgICAgICB2YWx1ZTogdGhpcy52YWx1ZSxcbiAgICAgICAgICBsaXN0Ym94OiB0aGlzLFxuICAgICAgICAgIG9wdGlvbjogb3B0aW9uLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVHJpZ2dlciB0aGUgZ2l2ZW4gcmFuZ2Ugb2Ygb3B0aW9ucyBpbiByZXNwb25zZSB0byB1c2VyIGludGVyYWN0aW9uLlxuICAgKiBTaG91bGQgb25seSBiZSBjYWxsZWQgaW4gbXVsdGktc2VsZWN0aW9uIG1vZGUuXG4gICAqIEBwYXJhbSB0cmlnZ2VyIFRoZSBvcHRpb24gdGhhdCB3YXMgdHJpZ2dlcmVkXG4gICAqIEBwYXJhbSBmcm9tIFRoZSBzdGFydCBpbmRleCBvZiB0aGUgb3B0aW9ucyB0byB0b2dnbGVcbiAgICogQHBhcmFtIHRvIFRoZSBlbmQgaW5kZXggb2YgdGhlIG9wdGlvbnMgdG8gdG9nZ2xlXG4gICAqIEBwYXJhbSBvbiBXaGV0aGVyIHRvIHRvZ2dsZSB0aGUgb3B0aW9uIHJhbmdlIG9uXG4gICAqL1xuICBwcm90ZWN0ZWQgdHJpZ2dlclJhbmdlKHRyaWdnZXI6IENka09wdGlvbjxUPiB8IG51bGwsIGZyb206IG51bWJlciwgdG86IG51bWJlciwgb246IGJvb2xlYW4pIHtcbiAgICBpZiAodGhpcy5kaXNhYmxlZCB8fCAodHJpZ2dlciAmJiB0cmlnZ2VyLmRpc2FibGVkKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9sYXN0VHJpZ2dlcmVkID0gdHJpZ2dlcjtcbiAgICBjb25zdCBpc0VxdWFsID0gdGhpcy5jb21wYXJlV2l0aCA/PyBPYmplY3QuaXM7XG4gICAgY29uc3QgdXBkYXRlVmFsdWVzID0gWy4uLnRoaXMub3B0aW9uc11cbiAgICAgIC5zbGljZShNYXRoLm1heCgwLCBNYXRoLm1pbihmcm9tLCB0bykpLCBNYXRoLm1pbih0aGlzLm9wdGlvbnMubGVuZ3RoLCBNYXRoLm1heChmcm9tLCB0bykgKyAxKSlcbiAgICAgIC5maWx0ZXIob3B0aW9uID0+ICFvcHRpb24uZGlzYWJsZWQpXG4gICAgICAubWFwKG9wdGlvbiA9PiBvcHRpb24udmFsdWUpO1xuICAgIGNvbnN0IHNlbGVjdGVkID0gWy4uLnRoaXMudmFsdWVdO1xuICAgIGZvciAoY29uc3QgdXBkYXRlVmFsdWUgb2YgdXBkYXRlVmFsdWVzKSB7XG4gICAgICBjb25zdCBzZWxlY3RlZEluZGV4ID0gc2VsZWN0ZWQuZmluZEluZGV4KHNlbGVjdGVkVmFsdWUgPT5cbiAgICAgICAgaXNFcXVhbChzZWxlY3RlZFZhbHVlLCB1cGRhdGVWYWx1ZSksXG4gICAgICApO1xuICAgICAgaWYgKG9uICYmIHNlbGVjdGVkSW5kZXggPT09IC0xKSB7XG4gICAgICAgIHNlbGVjdGVkLnB1c2godXBkYXRlVmFsdWUpO1xuICAgICAgfSBlbHNlIGlmICghb24gJiYgc2VsZWN0ZWRJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgc2VsZWN0ZWQuc3BsaWNlKHNlbGVjdGVkSW5kZXgsIDEpO1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgY2hhbmdlZCA9IHRoaXMuc2VsZWN0aW9uTW9kZWwuc2V0U2VsZWN0aW9uKC4uLnNlbGVjdGVkKTtcbiAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgdGhpcy5fb25DaGFuZ2UodGhpcy52YWx1ZSk7XG4gICAgICB0aGlzLnZhbHVlQ2hhbmdlLm5leHQoe1xuICAgICAgICB2YWx1ZTogdGhpcy52YWx1ZSxcbiAgICAgICAgbGlzdGJveDogdGhpcyxcbiAgICAgICAgb3B0aW9uOiB0cmlnZ2VyLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGdpdmVuIG9wdGlvbiBhcyBhY3RpdmUuXG4gICAqIEBwYXJhbSBvcHRpb24gVGhlIG9wdGlvbiB0byBtYWtlIGFjdGl2ZVxuICAgKi9cbiAgX3NldEFjdGl2ZU9wdGlvbihvcHRpb246IENka09wdGlvbjxUPikge1xuICAgIHRoaXMubGlzdEtleU1hbmFnZXIuc2V0QWN0aXZlSXRlbShvcHRpb24pO1xuICB9XG5cbiAgLyoqIENhbGxlZCB3aGVuIHRoZSBsaXN0Ym94IHJlY2VpdmVzIGZvY3VzLiAqL1xuICBwcm90ZWN0ZWQgX2hhbmRsZUZvY3VzKCkge1xuICAgIGlmICghdGhpcy51c2VBY3RpdmVEZXNjZW5kYW50KSB7XG4gICAgICBpZiAodGhpcy5zZWxlY3Rpb25Nb2RlbC5zZWxlY3RlZC5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRoaXMuX3NldE5leHRGb2N1c1RvU2VsZWN0ZWRPcHRpb24oKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubGlzdEtleU1hbmFnZXIuc2V0TmV4dEl0ZW1BY3RpdmUoKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fZm9jdXNBY3RpdmVPcHRpb24oKTtcbiAgICB9XG4gIH1cblxuICAvKiogQ2FsbGVkIHdoZW4gdGhlIHVzZXIgcHJlc3NlcyBrZXlkb3duIG9uIHRoZSBsaXN0Ym94LiAqL1xuICBwcm90ZWN0ZWQgX2hhbmRsZUtleWRvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcbiAgICBpZiAodGhpcy5kaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHtrZXlDb2RlfSA9IGV2ZW50O1xuICAgIGNvbnN0IHByZXZpb3VzQWN0aXZlSW5kZXggPSB0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleDtcbiAgICBjb25zdCBjdHJsS2V5cyA9IFsnY3RybEtleScsICdtZXRhS2V5J10gYXMgY29uc3Q7XG5cbiAgICBpZiAodGhpcy5tdWx0aXBsZSAmJiBrZXlDb2RlID09PSBBICYmIGhhc01vZGlmaWVyS2V5KGV2ZW50LCAuLi5jdHJsS2V5cykpIHtcbiAgICAgIC8vIFRvZ2dsZSBhbGwgb3B0aW9ucyBvZmYgaWYgdGhleSdyZSBhbGwgc2VsZWN0ZWQsIG90aGVyd2lzZSB0b2dnbGUgdGhlbSBhbGwgb24uXG4gICAgICB0aGlzLnRyaWdnZXJSYW5nZShcbiAgICAgICAgbnVsbCxcbiAgICAgICAgMCxcbiAgICAgICAgdGhpcy5vcHRpb25zLmxlbmd0aCAtIDEsXG4gICAgICAgIHRoaXMub3B0aW9ucy5sZW5ndGggIT09IHRoaXMudmFsdWUubGVuZ3RoLFxuICAgICAgKTtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgdGhpcy5tdWx0aXBsZSAmJlxuICAgICAgKGtleUNvZGUgPT09IFNQQUNFIHx8IGtleUNvZGUgPT09IEVOVEVSKSAmJlxuICAgICAgaGFzTW9kaWZpZXJLZXkoZXZlbnQsICdzaGlmdEtleScpXG4gICAgKSB7XG4gICAgICBpZiAodGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtICYmIHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbUluZGV4ICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy50cmlnZ2VyUmFuZ2UoXG4gICAgICAgICAgdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtLFxuICAgICAgICAgIHRoaXMuX2dldExhc3RUcmlnZ2VyZWRJbmRleCgpID8/IHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbUluZGV4LFxuICAgICAgICAgIHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbUluZGV4LFxuICAgICAgICAgICF0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW0uaXNTZWxlY3RlZCgpLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICB0aGlzLm11bHRpcGxlICYmXG4gICAgICBrZXlDb2RlID09PSBIT01FICYmXG4gICAgICBoYXNNb2RpZmllcktleShldmVudCwgLi4uY3RybEtleXMpICYmXG4gICAgICBoYXNNb2RpZmllcktleShldmVudCwgJ3NoaWZ0S2V5JylcbiAgICApIHtcbiAgICAgIGNvbnN0IHRyaWdnZXIgPSB0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW07XG4gICAgICBpZiAodHJpZ2dlcikge1xuICAgICAgICBjb25zdCBmcm9tID0gdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtSW5kZXghO1xuICAgICAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyLnNldEZpcnN0SXRlbUFjdGl2ZSgpO1xuICAgICAgICB0aGlzLnRyaWdnZXJSYW5nZShcbiAgICAgICAgICB0cmlnZ2VyLFxuICAgICAgICAgIGZyb20sXG4gICAgICAgICAgdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtSW5kZXghLFxuICAgICAgICAgICF0cmlnZ2VyLmlzU2VsZWN0ZWQoKSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgdGhpcy5tdWx0aXBsZSAmJlxuICAgICAga2V5Q29kZSA9PT0gRU5EICYmXG4gICAgICBoYXNNb2RpZmllcktleShldmVudCwgLi4uY3RybEtleXMpICYmXG4gICAgICBoYXNNb2RpZmllcktleShldmVudCwgJ3NoaWZ0S2V5JylcbiAgICApIHtcbiAgICAgIGNvbnN0IHRyaWdnZXIgPSB0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW07XG4gICAgICBpZiAodHJpZ2dlcikge1xuICAgICAgICBjb25zdCBmcm9tID0gdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtSW5kZXghO1xuICAgICAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyLnNldExhc3RJdGVtQWN0aXZlKCk7XG4gICAgICAgIHRoaXMudHJpZ2dlclJhbmdlKFxuICAgICAgICAgIHRyaWdnZXIsXG4gICAgICAgICAgZnJvbSxcbiAgICAgICAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleCEsXG4gICAgICAgICAgIXRyaWdnZXIuaXNTZWxlY3RlZCgpLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoa2V5Q29kZSA9PT0gU1BBQ0UgfHwga2V5Q29kZSA9PT0gRU5URVIpIHtcbiAgICAgIHRoaXMudHJpZ2dlck9wdGlvbih0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW0pO1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBpc05hdktleSA9XG4gICAgICBrZXlDb2RlID09PSBVUF9BUlJPVyB8fFxuICAgICAga2V5Q29kZSA9PT0gRE9XTl9BUlJPVyB8fFxuICAgICAga2V5Q29kZSA9PT0gTEVGVF9BUlJPVyB8fFxuICAgICAga2V5Q29kZSA9PT0gUklHSFRfQVJST1cgfHxcbiAgICAgIGtleUNvZGUgPT09IEhPTUUgfHxcbiAgICAgIGtleUNvZGUgPT09IEVORDtcbiAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyLm9uS2V5ZG93bihldmVudCk7XG4gICAgLy8gV2lsbCBzZWxlY3QgYW4gb3B0aW9uIGlmIHNoaWZ0IHdhcyBwcmVzc2VkIHdoaWxlIG5hdmlnYXRpbmcgdG8gdGhlIG9wdGlvblxuICAgIGlmIChpc05hdktleSAmJiBldmVudC5zaGlmdEtleSAmJiBwcmV2aW91c0FjdGl2ZUluZGV4ICE9PSB0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleCkge1xuICAgICAgdGhpcy50cmlnZ2VyT3B0aW9uKHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENhbGxlZCB3aGVuIGEgZm9jdXMgbW92ZXMgaW50byB0aGUgbGlzdGJveC4gKi9cbiAgcHJvdGVjdGVkIF9oYW5kbGVGb2N1c0luKCkge1xuICAgIC8vIE5vdGUgdGhhdCB3ZSB1c2UgYSBgZm9jdXNpbmAgaGFuZGxlciBmb3IgdGhpcyBpbnN0ZWFkIG9mIHRoZSBleGlzdGluZyBgZm9jdXNgIGhhbmRsZXIsXG4gICAgLy8gYmVjYXVzZSBmb2N1cyB3b24ndCBsYW5kIG9uIHRoZSBsaXN0Ym94IGlmIGB1c2VBY3RpdmVEZXNjZW5kYW50YCBpcyBlbmFibGVkLlxuICAgIHRoaXMuX2hhc0ZvY3VzID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsZWQgd2hlbiB0aGUgZm9jdXMgbGVhdmVzIGFuIGVsZW1lbnQgaW4gdGhlIGxpc3Rib3guXG4gICAqIEBwYXJhbSBldmVudCBUaGUgZm9jdXNvdXQgZXZlbnRcbiAgICovXG4gIHByb3RlY3RlZCBfaGFuZGxlRm9jdXNPdXQoZXZlbnQ6IEZvY3VzRXZlbnQpIHtcbiAgICAvLyBTb21lIGJyb3dzZXJzIChlLmcuIENocm9tZSBhbmQgRmlyZWZveCkgdHJpZ2dlciB0aGUgZm9jdXNvdXQgZXZlbnQgd2hlbiB0aGUgdXNlciByZXR1cm5zIGJhY2sgdG8gdGhlIGRvY3VtZW50LlxuICAgIC8vIFRvIHByZXZlbnQgbG9zaW5nIHRoZSBhY3RpdmUgb3B0aW9uIGluIHRoaXMgY2FzZSwgd2Ugc3RvcmUgaXQgaW4gYF9wcmV2aW91c0FjdGl2ZU9wdGlvbmAgYW5kIHJlc3RvcmUgaXQgb24gdGhlIHdpbmRvdyBgYmx1cmAgZXZlbnRcbiAgICAvLyBUaGlzIGVuc3VyZXMgdGhhdCB0aGUgYGFjdGl2ZUl0ZW1gIG1hdGNoZXMgdGhlIGFjdHVhbCBmb2N1c2VkIGVsZW1lbnQgd2hlbiB0aGUgdXNlciByZXR1cm5zIHRvIHRoZSBkb2N1bWVudC5cbiAgICB0aGlzLl9wcmV2aW91c0FjdGl2ZU9wdGlvbiA9IHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbTtcblxuICAgIGNvbnN0IG90aGVyRWxlbWVudCA9IGV2ZW50LnJlbGF0ZWRUYXJnZXQgYXMgRWxlbWVudDtcbiAgICBpZiAodGhpcy5lbGVtZW50ICE9PSBvdGhlckVsZW1lbnQgJiYgIXRoaXMuZWxlbWVudC5jb250YWlucyhvdGhlckVsZW1lbnQpKSB7XG4gICAgICB0aGlzLl9vblRvdWNoZWQoKTtcbiAgICAgIHRoaXMuX2hhc0ZvY3VzID0gZmFsc2U7XG4gICAgICB0aGlzLl9zZXROZXh0Rm9jdXNUb1NlbGVjdGVkT3B0aW9uKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEdldCB0aGUgaWQgb2YgdGhlIGFjdGl2ZSBvcHRpb24gaWYgYWN0aXZlIGRlc2NlbmRhbnQgaXMgYmVpbmcgdXNlZC4gKi9cbiAgcHJvdGVjdGVkIF9nZXRBcmlhQWN0aXZlRGVzY2VuZGFudCgpOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy51c2VBY3RpdmVEZXNjZW5kYW50ID8gdGhpcy5saXN0S2V5TWFuYWdlcj8uYWN0aXZlSXRlbT8uaWQgOiBudWxsO1xuICB9XG5cbiAgLyoqIEdldCB0aGUgdGFiaW5kZXggZm9yIHRoZSBsaXN0Ym94LiAqL1xuICBwcm90ZWN0ZWQgX2dldFRhYkluZGV4KCkge1xuICAgIGlmICh0aGlzLmRpc2FibGVkKSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnVzZUFjdGl2ZURlc2NlbmRhbnQgfHwgIXRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbSA/IHRoaXMuZW5hYmxlZFRhYkluZGV4IDogLTE7XG4gIH1cblxuICAvKiogSW5pdGlhbGl6ZSB0aGUga2V5IG1hbmFnZXIuICovXG4gIHByaXZhdGUgX2luaXRLZXlNYW5hZ2VyKCkge1xuICAgIHRoaXMubGlzdEtleU1hbmFnZXIgPSBuZXcgQWN0aXZlRGVzY2VuZGFudEtleU1hbmFnZXIodGhpcy5vcHRpb25zKVxuICAgICAgLndpdGhXcmFwKCF0aGlzLl9uYXZpZ2F0aW9uV3JhcERpc2FibGVkKVxuICAgICAgLndpdGhUeXBlQWhlYWQoKVxuICAgICAgLndpdGhIb21lQW5kRW5kKClcbiAgICAgIC53aXRoQWxsb3dlZE1vZGlmaWVyS2V5cyhbJ3NoaWZ0S2V5J10pXG4gICAgICAuc2tpcFByZWRpY2F0ZShcbiAgICAgICAgdGhpcy5fbmF2aWdhdGVEaXNhYmxlZE9wdGlvbnMgPyB0aGlzLl9za2lwTm9uZVByZWRpY2F0ZSA6IHRoaXMuX3NraXBEaXNhYmxlZFByZWRpY2F0ZSxcbiAgICAgICk7XG5cbiAgICBpZiAodGhpcy5vcmllbnRhdGlvbiA9PT0gJ3ZlcnRpY2FsJykge1xuICAgICAgdGhpcy5saXN0S2V5TWFuYWdlci53aXRoVmVydGljYWxPcmllbnRhdGlvbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyLndpdGhIb3Jpem9udGFsT3JpZW50YXRpb24odGhpcy5fZGlyPy52YWx1ZSB8fCAnbHRyJyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc2VsZWN0aW9uTW9kZWwuc2VsZWN0ZWQubGVuZ3RoKSB7XG4gICAgICBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHRoaXMuX3NldE5leHRGb2N1c1RvU2VsZWN0ZWRPcHRpb24oKSk7XG4gICAgfVxuXG4gICAgdGhpcy5saXN0S2V5TWFuYWdlci5jaGFuZ2Uuc3Vic2NyaWJlKCgpID0+IHRoaXMuX2ZvY3VzQWN0aXZlT3B0aW9uKCkpO1xuICB9XG5cbiAgLyoqIEZvY3VzIHRoZSBhY3RpdmUgb3B0aW9uLiAqL1xuICBwcml2YXRlIF9mb2N1c0FjdGl2ZU9wdGlvbigpIHtcbiAgICBpZiAoIXRoaXMudXNlQWN0aXZlRGVzY2VuZGFudCkge1xuICAgICAgdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtPy5mb2N1cygpO1xuICAgIH1cbiAgICB0aGlzLmNoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgc2VsZWN0ZWQgdmFsdWVzLlxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIGxpc3Qgb2YgbmV3IHNlbGVjdGVkIHZhbHVlcy5cbiAgICovXG4gIHByaXZhdGUgX3NldFNlbGVjdGlvbih2YWx1ZTogcmVhZG9ubHkgVFtdKSB7XG4gICAgaWYgKHRoaXMuX2ludmFsaWQpIHtcbiAgICAgIHRoaXMuc2VsZWN0aW9uTW9kZWwuY2xlYXIoZmFsc2UpO1xuICAgIH1cbiAgICB0aGlzLnNlbGVjdGlvbk1vZGVsLnNldFNlbGVjdGlvbiguLi50aGlzLl9jb2VyY2VWYWx1ZSh2YWx1ZSkpO1xuXG4gICAgaWYgKCF0aGlzLl9oYXNGb2N1cykge1xuICAgICAgdGhpcy5fc2V0TmV4dEZvY3VzVG9TZWxlY3RlZE9wdGlvbigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBmaXJzdCBzZWxlY3RlZCBvcHRpb24gYXMgZmlyc3QgaW4gdGhlIGtleWJvYXJkIGZvY3VzIG9yZGVyLiAqL1xuICBwcml2YXRlIF9zZXROZXh0Rm9jdXNUb1NlbGVjdGVkT3B0aW9uKCkge1xuICAgIC8vIE51bGwgY2hlY2sgdGhlIG9wdGlvbnMgc2luY2UgdGhleSBvbmx5IGdldCBkZWZpbmVkIGFmdGVyIGBuZ0FmdGVyQ29udGVudEluaXRgLlxuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5vcHRpb25zPy5maW5kKG9wdGlvbiA9PiBvcHRpb24uaXNTZWxlY3RlZCgpKTtcblxuICAgIGlmIChzZWxlY3RlZCkge1xuICAgICAgdGhpcy5saXN0S2V5TWFuYWdlci51cGRhdGVBY3RpdmVJdGVtKHNlbGVjdGVkKTtcbiAgICB9XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSBpbnRlcm5hbCB2YWx1ZSBvZiB0aGUgbGlzdGJveCBiYXNlZCBvbiB0aGUgc2VsZWN0aW9uIG1vZGVsLiAqL1xuICBwcml2YXRlIF91cGRhdGVJbnRlcm5hbFZhbHVlKCkge1xuICAgIGNvbnN0IGluZGV4Q2FjaGUgPSBuZXcgTWFwPFQsIG51bWJlcj4oKTtcbiAgICB0aGlzLnNlbGVjdGlvbk1vZGVsLnNvcnQoKGE6IFQsIGI6IFQpID0+IHtcbiAgICAgIGNvbnN0IGFJbmRleCA9IHRoaXMuX2dldEluZGV4Rm9yVmFsdWUoaW5kZXhDYWNoZSwgYSk7XG4gICAgICBjb25zdCBiSW5kZXggPSB0aGlzLl9nZXRJbmRleEZvclZhbHVlKGluZGV4Q2FjaGUsIGIpO1xuICAgICAgcmV0dXJuIGFJbmRleCAtIGJJbmRleDtcbiAgICB9KTtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0aW9uTW9kZWwuc2VsZWN0ZWQ7XG4gICAgdGhpcy5faW52YWxpZCA9XG4gICAgICAoIXRoaXMubXVsdGlwbGUgJiYgc2VsZWN0ZWQubGVuZ3RoID4gMSkgfHwgISF0aGlzLl9nZXRJbnZhbGlkT3B0aW9uVmFsdWVzKHNlbGVjdGVkKS5sZW5ndGg7XG4gICAgdGhpcy5jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpbmRleCBvZiB0aGUgZ2l2ZW4gdmFsdWUgaW4gdGhlIGdpdmVuIGxpc3Qgb2Ygb3B0aW9ucy5cbiAgICogQHBhcmFtIGNhY2hlIFRoZSBjYWNoZSBvZiBpbmRpY2VzIGZvdW5kIHNvIGZhclxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlIHRvIGZpbmRcbiAgICogQHJldHVybiBUaGUgaW5kZXggb2YgdGhlIHZhbHVlIGluIHRoZSBvcHRpb25zIGxpc3RcbiAgICovXG4gIHByaXZhdGUgX2dldEluZGV4Rm9yVmFsdWUoY2FjaGU6IE1hcDxULCBudW1iZXI+LCB2YWx1ZTogVCkge1xuICAgIGNvbnN0IGlzRXF1YWwgPSB0aGlzLmNvbXBhcmVXaXRoIHx8IE9iamVjdC5pcztcbiAgICBpZiAoIWNhY2hlLmhhcyh2YWx1ZSkpIHtcbiAgICAgIGxldCBpbmRleCA9IC0xO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm9wdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGlzRXF1YWwodmFsdWUsIHRoaXMub3B0aW9ucy5nZXQoaSkhLnZhbHVlKSkge1xuICAgICAgICAgIGluZGV4ID0gaTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY2FjaGUuc2V0KHZhbHVlLCBpbmRleCk7XG4gICAgfVxuICAgIHJldHVybiBjYWNoZS5nZXQodmFsdWUpITtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGUgdGhlIHVzZXIgY2xpY2tpbmcgYW4gb3B0aW9uLlxuICAgKiBAcGFyYW0gb3B0aW9uIFRoZSBvcHRpb24gdGhhdCB3YXMgY2xpY2tlZC5cbiAgICovXG4gIHByaXZhdGUgX2hhbmRsZU9wdGlvbkNsaWNrZWQob3B0aW9uOiBDZGtPcHRpb248VD4sIGV2ZW50OiBNb3VzZUV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyLnNldEFjdGl2ZUl0ZW0ob3B0aW9uKTtcbiAgICBpZiAoZXZlbnQuc2hpZnRLZXkgJiYgdGhpcy5tdWx0aXBsZSkge1xuICAgICAgdGhpcy50cmlnZ2VyUmFuZ2UoXG4gICAgICAgIG9wdGlvbixcbiAgICAgICAgdGhpcy5fZ2V0TGFzdFRyaWdnZXJlZEluZGV4KCkgPz8gdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtSW5kZXghLFxuICAgICAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleCEsXG4gICAgICAgICFvcHRpb24uaXNTZWxlY3RlZCgpLFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy50cmlnZ2VyT3B0aW9uKG9wdGlvbik7XG4gICAgfVxuICB9XG5cbiAgLyoqIFZlcmlmaWVzIHRoYXQgbm8gdHdvIG9wdGlvbnMgcmVwcmVzZW50IHRoZSBzYW1lIHZhbHVlIHVuZGVyIHRoZSBjb21wYXJlV2l0aCBmdW5jdGlvbi4gKi9cbiAgcHJpdmF0ZSBfdmVyaWZ5Tm9PcHRpb25WYWx1ZUNvbGxpc2lvbnMoKSB7XG4gICAgdGhpcy5vcHRpb25zLmNoYW5nZXMucGlwZShzdGFydFdpdGgodGhpcy5vcHRpb25zKSwgdGFrZVVudGlsKHRoaXMuZGVzdHJveWVkKSkuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIGNvbnN0IGlzRXF1YWwgPSB0aGlzLmNvbXBhcmVXaXRoID8/IE9iamVjdC5pcztcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5vcHRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IG9wdGlvbiA9IHRoaXMub3B0aW9ucy5nZXQoaSkhO1xuICAgICAgICBsZXQgZHVwbGljYXRlOiBDZGtPcHRpb248VD4gfCBudWxsID0gbnVsbDtcbiAgICAgICAgZm9yIChsZXQgaiA9IGkgKyAxOyBqIDwgdGhpcy5vcHRpb25zLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgY29uc3Qgb3RoZXIgPSB0aGlzLm9wdGlvbnMuZ2V0KGopITtcbiAgICAgICAgICBpZiAoaXNFcXVhbChvcHRpb24udmFsdWUsIG90aGVyLnZhbHVlKSkge1xuICAgICAgICAgICAgZHVwbGljYXRlID0gb3RoZXI7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGR1cGxpY2F0ZSkge1xuICAgICAgICAgIC8vIFRPRE8obW1hbGVyYmEpOiBMaW5rIHRvIGRvY3MgYWJvdXQgdGhpcy5cbiAgICAgICAgICBpZiAodGhpcy5jb21wYXJlV2l0aCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgICAgICBgRm91bmQgbXVsdGlwbGUgQ2RrT3B0aW9uIHJlcHJlc2VudGluZyB0aGUgc2FtZSB2YWx1ZSB1bmRlciB0aGUgZ2l2ZW4gY29tcGFyZVdpdGggZnVuY3Rpb25gLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgb3B0aW9uMTogb3B0aW9uLmVsZW1lbnQsXG4gICAgICAgICAgICAgICAgb3B0aW9uMjogZHVwbGljYXRlLmVsZW1lbnQsXG4gICAgICAgICAgICAgICAgY29tcGFyZVdpdGg6IHRoaXMuY29tcGFyZVdpdGgsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYEZvdW5kIG11bHRpcGxlIENka09wdGlvbiB3aXRoIHRoZSBzYW1lIHZhbHVlYCwge1xuICAgICAgICAgICAgICBvcHRpb24xOiBvcHRpb24uZWxlbWVudCxcbiAgICAgICAgICAgICAgb3B0aW9uMjogZHVwbGljYXRlLmVsZW1lbnQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKiogVmVyaWZpZXMgdGhhdCB0aGUgb3B0aW9uIHZhbHVlcyBhcmUgdmFsaWQuICovXG4gIHByaXZhdGUgX3ZlcmlmeU9wdGlvblZhbHVlcygpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zICYmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpKSB7XG4gICAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0aW9uTW9kZWwuc2VsZWN0ZWQ7XG4gICAgICBjb25zdCBpbnZhbGlkVmFsdWVzID0gdGhpcy5fZ2V0SW52YWxpZE9wdGlvblZhbHVlcyhzZWxlY3RlZCk7XG5cbiAgICAgIGlmICghdGhpcy5tdWx0aXBsZSAmJiBzZWxlY3RlZC5sZW5ndGggPiAxKSB7XG4gICAgICAgIHRocm93IEVycm9yKCdMaXN0Ym94IGNhbm5vdCBoYXZlIG1vcmUgdGhhbiBvbmUgc2VsZWN0ZWQgdmFsdWUgaW4gbXVsdGktc2VsZWN0aW9uIG1vZGUuJyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChpbnZhbGlkVmFsdWVzLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBFcnJvcignTGlzdGJveCBoYXMgc2VsZWN0ZWQgdmFsdWVzIHRoYXQgZG8gbm90IG1hdGNoIGFueSBvZiBpdHMgb3B0aW9ucy4nKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ29lcmNlcyBhIHZhbHVlIGludG8gYW4gYXJyYXkgcmVwcmVzZW50aW5nIGEgbGlzdGJveCBzZWxlY3Rpb24uXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gY29lcmNlXG4gICAqIEByZXR1cm4gQW4gYXJyYXlcbiAgICovXG4gIHByaXZhdGUgX2NvZXJjZVZhbHVlKHZhbHVlOiByZWFkb25seSBUW10pIHtcbiAgICByZXR1cm4gdmFsdWUgPT0gbnVsbCA/IFtdIDogY29lcmNlQXJyYXkodmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgc3VibGlzdCBvZiB2YWx1ZXMgdGhhdCBkbyBub3QgcmVwcmVzZW50IHZhbGlkIG9wdGlvbiB2YWx1ZXMgaW4gdGhpcyBsaXN0Ym94LlxuICAgKiBAcGFyYW0gdmFsdWVzIFRoZSBsaXN0IG9mIHZhbHVlc1xuICAgKiBAcmV0dXJuIFRoZSBzdWJsaXN0IG9mIHZhbHVlcyB0aGF0IGFyZSBub3QgdmFsaWQgb3B0aW9uIHZhbHVlc1xuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0SW52YWxpZE9wdGlvblZhbHVlcyh2YWx1ZXM6IHJlYWRvbmx5IFRbXSkge1xuICAgIGNvbnN0IGlzRXF1YWwgPSB0aGlzLmNvbXBhcmVXaXRoIHx8IE9iamVjdC5pcztcbiAgICBjb25zdCB2YWxpZFZhbHVlcyA9ICh0aGlzLm9wdGlvbnMgfHwgW10pLm1hcChvcHRpb24gPT4gb3B0aW9uLnZhbHVlKTtcbiAgICByZXR1cm4gdmFsdWVzLmZpbHRlcih2YWx1ZSA9PiAhdmFsaWRWYWx1ZXMuc29tZSh2YWxpZFZhbHVlID0+IGlzRXF1YWwodmFsdWUsIHZhbGlkVmFsdWUpKSk7XG4gIH1cblxuICAvKiogR2V0IHRoZSBpbmRleCBvZiB0aGUgbGFzdCB0cmlnZ2VyZWQgb3B0aW9uLiAqL1xuICBwcml2YXRlIF9nZXRMYXN0VHJpZ2dlcmVkSW5kZXgoKSB7XG4gICAgY29uc3QgaW5kZXggPSB0aGlzLm9wdGlvbnMudG9BcnJheSgpLmluZGV4T2YodGhpcy5fbGFzdFRyaWdnZXJlZCEpO1xuICAgIHJldHVybiBpbmRleCA9PT0gLTEgPyBudWxsIDogaW5kZXg7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHByZXZpb3VzIGFjdGl2ZSBvcHRpb24gYXMgYWN0aXZlIG9wdGlvbiBvbiB3aW5kb3cgYmx1ci5cbiAgICogVGhpcyBlbnN1cmVzIHRoYXQgdGhlIGBhY3RpdmVPcHRpb25gIG1hdGNoZXMgdGhlIGFjdHVhbCBmb2N1c2VkIGVsZW1lbnQgd2hlbiB0aGUgdXNlciByZXR1cm5zIHRvIHRoZSBkb2N1bWVudC5cbiAgICovXG4gIHByaXZhdGUgX3NldFByZXZpb3VzQWN0aXZlT3B0aW9uQXNBY3RpdmVPcHRpb25PbldpbmRvd0JsdXIoKSB7XG4gICAgdGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgZnJvbUV2ZW50KHdpbmRvdywgJ2JsdXInKVxuICAgICAgICAucGlwZSh0YWtlVW50aWwodGhpcy5kZXN0cm95ZWQpKVxuICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5lbGVtZW50LmNvbnRhaW5zKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpICYmIHRoaXMuX3ByZXZpb3VzQWN0aXZlT3B0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRBY3RpdmVPcHRpb24odGhpcy5fcHJldmlvdXNBY3RpdmVPcHRpb24pO1xuICAgICAgICAgICAgdGhpcy5fcHJldmlvdXNBY3RpdmVPcHRpb24gPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqIENoYW5nZSBldmVudCB0aGF0IGlzIGZpcmVkIHdoZW5ldmVyIHRoZSB2YWx1ZSBvZiB0aGUgbGlzdGJveCBjaGFuZ2VzLiAqL1xuZXhwb3J0IGludGVyZmFjZSBMaXN0Ym94VmFsdWVDaGFuZ2VFdmVudDxUPiB7XG4gIC8qKiBUaGUgbmV3IHZhbHVlIG9mIHRoZSBsaXN0Ym94LiAqL1xuICByZWFkb25seSB2YWx1ZTogcmVhZG9ubHkgVFtdO1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIGxpc3Rib3ggdGhhdCBlbWl0dGVkIHRoZSBldmVudC4gKi9cbiAgcmVhZG9ubHkgbGlzdGJveDogQ2RrTGlzdGJveDxUPjtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSBvcHRpb24gdGhhdCB3YXMgdHJpZ2dlcmVkLiAqL1xuICByZWFkb25seSBvcHRpb246IENka09wdGlvbjxUPiB8IG51bGw7XG59XG4iXX0=