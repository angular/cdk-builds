/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { QueryList } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW, TAB, A, Z, ZERO, NINE, hasModifierKey, } from '@angular/cdk/keycodes';
import { debounceTime, filter, map, tap } from 'rxjs/operators';
/**
 * This interface is for items that can be passed to a ListKeyManager.
 * @record
 */
export function ListKeyManagerOption() { }
if (false) {
    /**
     * Whether the option is disabled.
     * @type {?|undefined}
     */
    ListKeyManagerOption.prototype.disabled;
    /**
     * Gets the label for this option.
     * @return {?}
     */
    ListKeyManagerOption.prototype.getLabel = function () { };
}
/**
 * This class manages keyboard events for selectable lists. If you pass it a query list
 * of items, it will set the active item correctly when arrow events occur.
 * @template T
 */
export class ListKeyManager {
    /**
     * @param {?} _items
     */
    constructor(_items) {
        this._items = _items;
        this._activeItemIndex = -1;
        this._activeItem = null;
        this._wrap = false;
        this._letterKeyStream = new Subject();
        this._typeaheadSubscription = Subscription.EMPTY;
        this._vertical = true;
        this._allowedModifierKeys = [];
        /**
         * Predicate function that can be used to check whether an item should be skipped
         * by the key manager. By default, disabled items are skipped.
         */
        this._skipPredicateFn = (/**
         * @param {?} item
         * @return {?}
         */
        (item) => item.disabled);
        // Buffer for the letters that the user has pressed when the typeahead option is turned on.
        this._pressedLetters = [];
        /**
         * Stream that emits any time the TAB key is pressed, so components can react
         * when focus is shifted off of the list.
         */
        this.tabOut = new Subject();
        /**
         * Stream that emits whenever the active item of the list manager changes.
         */
        this.change = new Subject();
        // We allow for the items to be an array because, in some cases, the consumer may
        // not have access to a QueryList of the items they want to manage (e.g. when the
        // items aren't being collected via `ViewChildren` or `ContentChildren`).
        if (_items instanceof QueryList) {
            _items.changes.subscribe((/**
             * @param {?} newItems
             * @return {?}
             */
            (newItems) => {
                if (this._activeItem) {
                    /** @type {?} */
                    const itemArray = newItems.toArray();
                    /** @type {?} */
                    const newIndex = itemArray.indexOf(this._activeItem);
                    if (newIndex > -1 && newIndex !== this._activeItemIndex) {
                        this._activeItemIndex = newIndex;
                    }
                }
            }));
        }
    }
    /**
     * Sets the predicate function that determines which items should be skipped by the
     * list key manager.
     * @template THIS
     * @this {THIS}
     * @param {?} predicate Function that determines whether the given item should be skipped.
     * @return {THIS}
     */
    skipPredicate(predicate) {
        (/** @type {?} */ (this))._skipPredicateFn = predicate;
        return (/** @type {?} */ (this));
    }
    /**
     * Configures wrapping mode, which determines whether the active item will wrap to
     * the other end of list when there are no more items in the given direction.
     * @template THIS
     * @this {THIS}
     * @param {?=} shouldWrap Whether the list should wrap when reaching the end.
     * @return {THIS}
     */
    withWrap(shouldWrap = true) {
        (/** @type {?} */ (this))._wrap = shouldWrap;
        return (/** @type {?} */ (this));
    }
    /**
     * Configures whether the key manager should be able to move the selection vertically.
     * @template THIS
     * @this {THIS}
     * @param {?=} enabled Whether vertical selection should be enabled.
     * @return {THIS}
     */
    withVerticalOrientation(enabled = true) {
        (/** @type {?} */ (this))._vertical = enabled;
        return (/** @type {?} */ (this));
    }
    /**
     * Configures the key manager to move the selection horizontally.
     * Passing in `null` will disable horizontal movement.
     * @template THIS
     * @this {THIS}
     * @param {?} direction Direction in which the selection can be moved.
     * @return {THIS}
     */
    withHorizontalOrientation(direction) {
        (/** @type {?} */ (this))._horizontal = direction;
        return (/** @type {?} */ (this));
    }
    /**
     * Modifier keys which are allowed to be held down and whose default actions will be prevented
     * as the user is pressing the arrow keys. Defaults to not allowing any modifier keys.
     * @template THIS
     * @this {THIS}
     * @param {?} keys
     * @return {THIS}
     */
    withAllowedModifierKeys(keys) {
        (/** @type {?} */ (this))._allowedModifierKeys = keys;
        return (/** @type {?} */ (this));
    }
    /**
     * Turns on typeahead mode which allows users to set the active item by typing.
     * @template THIS
     * @this {THIS}
     * @param {?=} debounceInterval Time to wait after the last keystroke before setting the active item.
     * @return {THIS}
     */
    withTypeAhead(debounceInterval = 200) {
        if ((/** @type {?} */ (this))._items.length && (/** @type {?} */ (this))._items.some((/**
         * @param {?} item
         * @return {?}
         */
        item => typeof item.getLabel !== 'function'))) {
            throw Error('ListKeyManager items in typeahead mode must implement the `getLabel` method.');
        }
        (/** @type {?} */ (this))._typeaheadSubscription.unsubscribe();
        // Debounce the presses of non-navigational keys, collect the ones that correspond to letters
        // and convert those letters back into a string. Afterwards find the first item that starts
        // with that string and select it.
        (/** @type {?} */ (this))._typeaheadSubscription = (/** @type {?} */ (this))._letterKeyStream.pipe(tap((/**
         * @param {?} keyCode
         * @return {?}
         */
        keyCode => (/** @type {?} */ (this))._pressedLetters.push(keyCode))), debounceTime(debounceInterval), filter((/**
         * @return {?}
         */
        () => (/** @type {?} */ (this))._pressedLetters.length > 0)), map((/**
         * @return {?}
         */
        () => (/** @type {?} */ (this))._pressedLetters.join('')))).subscribe((/**
         * @param {?} inputString
         * @return {?}
         */
        inputString => {
            /** @type {?} */
            const items = (/** @type {?} */ (this))._getItemsArray();
            // Start at 1 because we want to start searching at the item immediately
            // following the current active item.
            for (let i = 1; i < items.length + 1; i++) {
                /** @type {?} */
                const index = ((/** @type {?} */ (this))._activeItemIndex + i) % items.length;
                /** @type {?} */
                const item = items[index];
                if (!(/** @type {?} */ (this))._skipPredicateFn(item) &&
                    (/** @type {?} */ (item.getLabel))().toUpperCase().trim().indexOf(inputString) === 0) {
                    (/** @type {?} */ (this)).setActiveItem(index);
                    break;
                }
            }
            (/** @type {?} */ (this))._pressedLetters = [];
        }));
        return (/** @type {?} */ (this));
    }
    /**
     * @param {?} item
     * @return {?}
     */
    setActiveItem(item) {
        /** @type {?} */
        const previousIndex = this._activeItemIndex;
        this.updateActiveItem(item);
        if (this._activeItemIndex !== previousIndex) {
            this.change.next(this._activeItemIndex);
        }
    }
    /**
     * Sets the active item depending on the key event passed in.
     * @param {?} event Keyboard event to be used for determining which element should be active.
     * @return {?}
     */
    onKeydown(event) {
        /** @type {?} */
        const keyCode = event.keyCode;
        /** @type {?} */
        const modifiers = ['altKey', 'ctrlKey', 'metaKey', 'shiftKey'];
        /** @type {?} */
        const isModifierAllowed = modifiers.every((/**
         * @param {?} modifier
         * @return {?}
         */
        modifier => {
            return !event[modifier] || this._allowedModifierKeys.indexOf(modifier) > -1;
        }));
        switch (keyCode) {
            case TAB:
                this.tabOut.next();
                return;
            case DOWN_ARROW:
                if (this._vertical && isModifierAllowed) {
                    this.setNextItemActive();
                    break;
                }
                else {
                    return;
                }
            case UP_ARROW:
                if (this._vertical && isModifierAllowed) {
                    this.setPreviousItemActive();
                    break;
                }
                else {
                    return;
                }
            case RIGHT_ARROW:
                if (this._horizontal && isModifierAllowed) {
                    this._horizontal === 'rtl' ? this.setPreviousItemActive() : this.setNextItemActive();
                    break;
                }
                else {
                    return;
                }
            case LEFT_ARROW:
                if (this._horizontal && isModifierAllowed) {
                    this._horizontal === 'rtl' ? this.setNextItemActive() : this.setPreviousItemActive();
                    break;
                }
                else {
                    return;
                }
            default:
                if (isModifierAllowed || hasModifierKey(event, 'shiftKey')) {
                    // Attempt to use the `event.key` which also maps it to the user's keyboard language,
                    // otherwise fall back to resolving alphanumeric characters via the keyCode.
                    if (event.key && event.key.length === 1) {
                        this._letterKeyStream.next(event.key.toLocaleUpperCase());
                    }
                    else if ((keyCode >= A && keyCode <= Z) || (keyCode >= ZERO && keyCode <= NINE)) {
                        this._letterKeyStream.next(String.fromCharCode(keyCode));
                    }
                }
                // Note that we return here, in order to avoid preventing
                // the default action of non-navigational keys.
                return;
        }
        this._pressedLetters = [];
        event.preventDefault();
    }
    /**
     * Index of the currently active item.
     * @return {?}
     */
    get activeItemIndex() {
        return this._activeItemIndex;
    }
    /**
     * The active item.
     * @return {?}
     */
    get activeItem() {
        return this._activeItem;
    }
    /**
     * Sets the active item to the first enabled item in the list.
     * @return {?}
     */
    setFirstItemActive() {
        this._setActiveItemByIndex(0, 1);
    }
    /**
     * Sets the active item to the last enabled item in the list.
     * @return {?}
     */
    setLastItemActive() {
        this._setActiveItemByIndex(this._items.length - 1, -1);
    }
    /**
     * Sets the active item to the next enabled item in the list.
     * @return {?}
     */
    setNextItemActive() {
        this._activeItemIndex < 0 ? this.setFirstItemActive() : this._setActiveItemByDelta(1);
    }
    /**
     * Sets the active item to a previous enabled item in the list.
     * @return {?}
     */
    setPreviousItemActive() {
        this._activeItemIndex < 0 && this._wrap ? this.setLastItemActive()
            : this._setActiveItemByDelta(-1);
    }
    /**
     * @param {?} item
     * @return {?}
     */
    updateActiveItem(item) {
        /** @type {?} */
        const itemArray = this._getItemsArray();
        /** @type {?} */
        const index = typeof item === 'number' ? item : itemArray.indexOf(item);
        /** @type {?} */
        const activeItem = itemArray[index];
        // Explicitly check for `null` and `undefined` because other falsy values are valid.
        this._activeItem = activeItem == null ? null : activeItem;
        this._activeItemIndex = index;
    }
    /**
     * This method sets the active item, given a list of items and the delta between the
     * currently active item and the new active item. It will calculate differently
     * depending on whether wrap mode is turned on.
     * @private
     * @param {?} delta
     * @return {?}
     */
    _setActiveItemByDelta(delta) {
        this._wrap ? this._setActiveInWrapMode(delta) : this._setActiveInDefaultMode(delta);
    }
    /**
     * Sets the active item properly given "wrap" mode. In other words, it will continue to move
     * down the list until it finds an item that is not disabled, and it will wrap if it
     * encounters either end of the list.
     * @private
     * @param {?} delta
     * @return {?}
     */
    _setActiveInWrapMode(delta) {
        /** @type {?} */
        const items = this._getItemsArray();
        for (let i = 1; i <= items.length; i++) {
            /** @type {?} */
            const index = (this._activeItemIndex + (delta * i) + items.length) % items.length;
            /** @type {?} */
            const item = items[index];
            if (!this._skipPredicateFn(item)) {
                this.setActiveItem(index);
                return;
            }
        }
    }
    /**
     * Sets the active item properly given the default mode. In other words, it will
     * continue to move down the list until it finds an item that is not disabled. If
     * it encounters either end of the list, it will stop and not wrap.
     * @private
     * @param {?} delta
     * @return {?}
     */
    _setActiveInDefaultMode(delta) {
        this._setActiveItemByIndex(this._activeItemIndex + delta, delta);
    }
    /**
     * Sets the active item to the first enabled item starting at the index specified. If the
     * item is disabled, it will move in the fallbackDelta direction until it either
     * finds an enabled item or encounters the end of the list.
     * @private
     * @param {?} index
     * @param {?} fallbackDelta
     * @return {?}
     */
    _setActiveItemByIndex(index, fallbackDelta) {
        /** @type {?} */
        const items = this._getItemsArray();
        if (!items[index]) {
            return;
        }
        while (this._skipPredicateFn(items[index])) {
            index += fallbackDelta;
            if (!items[index]) {
                return;
            }
        }
        this.setActiveItem(index);
    }
    /**
     * Returns the items as an array.
     * @private
     * @return {?}
     */
    _getItemsArray() {
        return this._items instanceof QueryList ? this._items.toArray() : this._items;
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    ListKeyManager.prototype._activeItemIndex;
    /**
     * @type {?}
     * @private
     */
    ListKeyManager.prototype._activeItem;
    /**
     * @type {?}
     * @private
     */
    ListKeyManager.prototype._wrap;
    /**
     * @type {?}
     * @private
     */
    ListKeyManager.prototype._letterKeyStream;
    /**
     * @type {?}
     * @private
     */
    ListKeyManager.prototype._typeaheadSubscription;
    /**
     * @type {?}
     * @private
     */
    ListKeyManager.prototype._vertical;
    /**
     * @type {?}
     * @private
     */
    ListKeyManager.prototype._horizontal;
    /**
     * @type {?}
     * @private
     */
    ListKeyManager.prototype._allowedModifierKeys;
    /**
     * Predicate function that can be used to check whether an item should be skipped
     * by the key manager. By default, disabled items are skipped.
     * @type {?}
     * @private
     */
    ListKeyManager.prototype._skipPredicateFn;
    /**
     * @type {?}
     * @private
     */
    ListKeyManager.prototype._pressedLetters;
    /**
     * Stream that emits any time the TAB key is pressed, so components can react
     * when focus is shifted off of the list.
     * @type {?}
     */
    ListKeyManager.prototype.tabOut;
    /**
     * Stream that emits whenever the active item of the list manager changes.
     * @type {?}
     */
    ListKeyManager.prototype.change;
    /**
     * @type {?}
     * @private
     */
    ListKeyManager.prototype._items;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC1rZXktbWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvYTExeS9rZXktbWFuYWdlci9saXN0LWtleS1tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN4QyxPQUFPLEVBQUMsT0FBTyxFQUFFLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUMzQyxPQUFPLEVBQ0wsUUFBUSxFQUNSLFVBQVUsRUFDVixVQUFVLEVBQ1YsV0FBVyxFQUNYLEdBQUcsRUFDSCxDQUFDLEVBQ0QsQ0FBQyxFQUNELElBQUksRUFDSixJQUFJLEVBQ0osY0FBYyxHQUNmLE1BQU0sdUJBQXVCLENBQUM7QUFDL0IsT0FBTyxFQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBQyxNQUFNLGdCQUFnQixDQUFDOzs7OztBQUc5RCwwQ0FNQzs7Ozs7O0lBSkMsd0NBQW1COzs7OztJQUduQiwwREFBb0I7Ozs7Ozs7QUFVdEIsTUFBTSxPQUFPLGNBQWM7Ozs7SUFtQnpCLFlBQW9CLE1BQTBCO1FBQTFCLFdBQU0sR0FBTixNQUFNLENBQW9CO1FBbEJ0QyxxQkFBZ0IsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN0QixnQkFBVyxHQUFhLElBQUksQ0FBQztRQUM3QixVQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ2QscUJBQWdCLEdBQUcsSUFBSSxPQUFPLEVBQVUsQ0FBQztRQUN6QywyQkFBc0IsR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDO1FBQzVDLGNBQVMsR0FBRyxJQUFJLENBQUM7UUFFakIseUJBQW9CLEdBQWdDLEVBQUUsQ0FBQzs7Ozs7UUFNdkQscUJBQWdCOzs7O1FBQUcsQ0FBQyxJQUFPLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUM7O1FBRzlDLG9CQUFlLEdBQWEs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QyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQ2pCLE9BQU87YUFDUjtTQUNGO1FBRUQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM1QixDQUFDOzs7Ozs7SUFHTyxjQUFjO1FBQ3BCLE9BQU8sSUFBSSxDQUFDLE1BQU0sWUFBWSxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDaEYsQ0FBQztDQUNGOzs7Ozs7SUF0VkMsMENBQThCOzs7OztJQUM5QixxQ0FBcUM7Ozs7O0lBQ3JDLCtCQUFzQjs7Ozs7SUFDdEIsMENBQWlEOzs7OztJQUNqRCxnREFBb0Q7Ozs7O0lBQ3BELG1DQUF5Qjs7Ozs7SUFDekIscUNBQTBDOzs7OztJQUMxQyw4Q0FBK0Q7Ozs7Ozs7SUFNL0QsMENBQXNEOzs7OztJQUd0RCx5Q0FBdUM7Ozs7OztJQXdCdkMsZ0NBQTRDOzs7OztJQUc1QyxnQ0FBK0I7Ozs7O0lBekJuQixnQ0FBa0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtRdWVyeUxpc3R9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtTdWJqZWN0LCBTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtcbiAgVVBfQVJST1csXG4gIERPV05fQVJST1csXG4gIExFRlRfQVJST1csXG4gIFJJR0hUX0FSUk9XLFxuICBUQUIsXG4gIEEsXG4gIFosXG4gIFpFUk8sXG4gIE5JTkUsXG4gIGhhc01vZGlmaWVyS2V5LFxufSBmcm9tICdAYW5ndWxhci9jZGsva2V5Y29kZXMnO1xuaW1wb3J0IHtkZWJvdW5jZVRpbWUsIGZpbHRlciwgbWFwLCB0YXB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuLyoqIFRoaXMgaW50ZXJmYWNlIGlzIGZvciBpdGVtcyB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gYSBMaXN0S2V5TWFuYWdlci4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTGlzdEtleU1hbmFnZXJPcHRpb24ge1xuICAvKiogV2hldGhlciB0aGUgb3B0aW9uIGlzIGRpc2FibGVkLiAqL1xuICBkaXNhYmxlZD86IGJvb2xlYW47XG5cbiAgLyoqIEdldHMgdGhlIGxhYmVsIGZvciB0aGlzIG9wdGlvbi4gKi9cbiAgZ2V0TGFiZWw/KCk6IHN0cmluZztcbn1cblxuLyoqIE1vZGlmaWVyIGtleXMgaGFuZGxlZCBieSB0aGUgTGlzdEtleU1hbmFnZXIuICovXG5leHBvcnQgdHlwZSBMaXN0S2V5TWFuYWdlck1vZGlmaWVyS2V5ID0gJ2FsdEtleScgfCAnY3RybEtleScgfCAnbWV0YUtleScgfCAnc2hpZnRLZXknO1xuXG4vKipcbiAqIFRoaXMgY2xhc3MgbWFuYWdlcyBrZXlib2FyZCBldmVudHMgZm9yIHNlbGVjdGFibGUgbGlzdHMuIElmIHlvdSBwYXNzIGl0IGEgcXVlcnkgbGlzdFxuICogb2YgaXRlbXMsIGl0IHdpbGwgc2V0IHRoZSBhY3RpdmUgaXRlbSBjb3JyZWN0bHkgd2hlbiBhcnJvdyBldmVudHMgb2NjdXIuXG4gKi9cbmV4cG9ydCBjbGFzcyBMaXN0S2V5TWFuYWdlcjxUIGV4dGVuZHMgTGlzdEtleU1hbmFnZXJPcHRpb24+IHtcbiAgcHJpdmF0ZSBfYWN0aXZlSXRlbUluZGV4ID0gLTE7XG4gIHByaXZhdGUgX2FjdGl2ZUl0ZW06IFQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfd3JhcCA9IGZhbHNlO1xuICBwcml2YXRlIF9sZXR0ZXJLZXlTdHJlYW0gPSBuZXcgU3ViamVjdDxzdHJpbmc+KCk7XG4gIHByaXZhdGUgX3R5cGVhaGVhZFN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcbiAgcHJpdmF0ZSBfdmVydGljYWwgPSB0cnVlO1xuICBwcml2YXRlIF9ob3Jpem9udGFsOiAnbHRyJyB8ICdydGwnIHwgbnVsbDtcbiAgcHJpdmF0ZSBfYWxsb3dlZE1vZGlmaWVyS2V5czogTGlzdEtleU1hbmFnZXJNb2RpZmllcktleVtdID0gW107XG5cbiAgLyoqXG4gICAqIFByZWRpY2F0ZSBmdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHRvIGNoZWNrIHdoZXRoZXIgYW4gaXRlbSBzaG91bGQgYmUgc2tpcHBlZFxuICAgKiBieSB0aGUga2V5IG1hbmFnZXIuIEJ5IGRlZmF1bHQsIGRpc2FibGVkIGl0ZW1zIGFyZSBza2lwcGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfc2tpcFByZWRpY2F0ZUZuID0gKGl0ZW06IFQpID0+IGl0ZW0uZGlzYWJsZWQ7XG5cbiAgLy8gQnVmZmVyIGZvciB0aGUgbGV0dGVycyB0aGF0IHRoZSB1c2VyIGhhcyBwcmVzc2VkIHdoZW4gdGhlIHR5cGVhaGVhZCBvcHRpb24gaXMgdHVybmVkIG9uLlxuICBwcml2YXRlIF9wcmVzc2VkTGV0dGVyczogc3RyaW5nW10gPSBbXTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9pdGVtczogUXVlcnlMaXN0PFQ+IHwgVFtdKSB7XG4gICAgLy8gV2UgYWxsb3cgZm9yIHRoZSBpdGVtcyB0byBiZSBhbiBhcnJheSBiZWNhdXNlLCBpbiBzb21lIGNhc2VzLCB0aGUgY29uc3VtZXIgbWF5XG4gICAgLy8gbm90IGhhdmUgYWNjZXNzIHRvIGEgUXVlcnlMaXN0IG9mIHRoZSBpdGVtcyB0aGV5IHdhbnQgdG8gbWFuYWdlIChlLmcuIHdoZW4gdGhlXG4gICAgLy8gaXRlbXMgYXJlbid0IGJlaW5nIGNvbGxlY3RlZCB2aWEgYFZpZXdDaGlsZHJlbmAgb3IgYENvbnRlbnRDaGlsZHJlbmApLlxuICAgIGlmIChfaXRlbXMgaW5zdGFuY2VvZiBRdWVyeUxpc3QpIHtcbiAgICAgIF9pdGVtcy5jaGFuZ2VzLnN1YnNjcmliZSgobmV3SXRlbXM6IFF1ZXJ5TGlzdDxUPikgPT4ge1xuICAgICAgICBpZiAodGhpcy5fYWN0aXZlSXRlbSkge1xuICAgICAgICAgIGNvbnN0IGl0ZW1BcnJheSA9IG5ld0l0ZW1zLnRvQXJyYXkoKTtcbiAgICAgICAgICBjb25zdCBuZXdJbmRleCA9IGl0ZW1BcnJheS5pbmRleE9mKHRoaXMuX2FjdGl2ZUl0ZW0pO1xuXG4gICAgICAgICAgaWYgKG5ld0luZGV4ID4gLTEgJiYgbmV3SW5kZXggIT09IHRoaXMuX2FjdGl2ZUl0ZW1JbmRleCkge1xuICAgICAgICAgICAgdGhpcy5fYWN0aXZlSXRlbUluZGV4ID0gbmV3SW5kZXg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU3RyZWFtIHRoYXQgZW1pdHMgYW55IHRpbWUgdGhlIFRBQiBrZXkgaXMgcHJlc3NlZCwgc28gY29tcG9uZW50cyBjYW4gcmVhY3RcbiAgICogd2hlbiBmb2N1cyBpcyBzaGlmdGVkIG9mZiBvZiB0aGUgbGlzdC5cbiAgICovXG4gIHRhYk91dDogU3ViamVjdDx2b2lkPiA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIFN0cmVhbSB0aGF0IGVtaXRzIHdoZW5ldmVyIHRoZSBhY3RpdmUgaXRlbSBvZiB0aGUgbGlzdCBtYW5hZ2VyIGNoYW5nZXMuICovXG4gIGNoYW5nZSA9IG5ldyBTdWJqZWN0PG51bWJlcj4oKTtcblxuICAvKipcbiAgICogU2V0cyB0aGUgcHJlZGljYXRlIGZ1bmN0aW9uIHRoYXQgZGV0ZXJtaW5lcyB3aGljaCBpdGVtcyBzaG91bGQgYmUgc2tpcHBlZCBieSB0aGVcbiAgICogbGlzdCBrZXkgbWFuYWdlci5cbiAgICogQHBhcmFtIHByZWRpY2F0ZSBGdW5jdGlvbiB0aGF0IGRldGVybWluZXMgd2hldGhlciB0aGUgZ2l2ZW4gaXRlbSBzaG91bGQgYmUgc2tpcHBlZC5cbiAgICovXG4gIHNraXBQcmVkaWNhdGUocHJlZGljYXRlOiAoaXRlbTogVCkgPT4gYm9vbGVhbik6IHRoaXMge1xuICAgIHRoaXMuX3NraXBQcmVkaWNhdGVGbiA9IHByZWRpY2F0ZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25maWd1cmVzIHdyYXBwaW5nIG1vZGUsIHdoaWNoIGRldGVybWluZXMgd2hldGhlciB0aGUgYWN0aXZlIGl0ZW0gd2lsbCB3cmFwIHRvXG4gICAqIHRoZSBvdGhlciBlbmQgb2YgbGlzdCB3aGVuIHRoZXJlIGFyZSBubyBtb3JlIGl0ZW1zIGluIHRoZSBnaXZlbiBkaXJlY3Rpb24uXG4gICAqIEBwYXJhbSBzaG91bGRXcmFwIFdoZXRoZXIgdGhlIGxpc3Qgc2hvdWxkIHdyYXAgd2hlbiByZWFjaGluZyB0aGUgZW5kLlxuICAgKi9cbiAgd2l0aFdyYXAoc2hvdWxkV3JhcCA9IHRydWUpOiB0aGlzIHtcbiAgICB0aGlzLl93cmFwID0gc2hvdWxkV3JhcDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25maWd1cmVzIHdoZXRoZXIgdGhlIGtleSBtYW5hZ2VyIHNob3VsZCBiZSBhYmxlIHRvIG1vdmUgdGhlIHNlbGVjdGlvbiB2ZXJ0aWNhbGx5LlxuICAgKiBAcGFyYW0gZW5hYmxlZCBXaGV0aGVyIHZlcnRpY2FsIHNlbGVjdGlvbiBzaG91bGQgYmUgZW5hYmxlZC5cbiAgICovXG4gIHdpdGhWZXJ0aWNhbE9yaWVudGF0aW9uKGVuYWJsZWQ6IGJvb2xlYW4gPSB0cnVlKTogdGhpcyB7XG4gICAgdGhpcy5fdmVydGljYWwgPSBlbmFibGVkO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZXMgdGhlIGtleSBtYW5hZ2VyIHRvIG1vdmUgdGhlIHNlbGVjdGlvbiBob3Jpem9udGFsbHkuXG4gICAqIFBhc3NpbmcgaW4gYG51bGxgIHdpbGwgZGlzYWJsZSBob3Jpem9udGFsIG1vdmVtZW50LlxuICAgKiBAcGFyYW0gZGlyZWN0aW9uIERpcmVjdGlvbiBpbiB3aGljaCB0aGUgc2VsZWN0aW9uIGNhbiBiZSBtb3ZlZC5cbiAgICovXG4gIHdpdGhIb3Jpem9udGFsT3JpZW50YXRpb24oZGlyZWN0aW9uOiAnbHRyJyB8ICdydGwnIHwgbnVsbCk6IHRoaXMge1xuICAgIHRoaXMuX2hvcml6b250YWwgPSBkaXJlY3Rpb247XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogTW9kaWZpZXIga2V5cyB3aGljaCBhcmUgYWxsb3dlZCB0byBiZSBoZWxkIGRvd24gYW5kIHdob3NlIGRlZmF1bHQgYWN0aW9ucyB3aWxsIGJlIHByZXZlbnRlZFxuICAgKiBhcyB0aGUgdXNlciBpcyBwcmVzc2luZyB0aGUgYXJyb3cga2V5cy4gRGVmYXVsdHMgdG8gbm90IGFsbG93aW5nIGFueSBtb2RpZmllciBrZXlzLlxuICAgKi9cbiAgd2l0aEFsbG93ZWRNb2RpZmllcktleXMoa2V5czogTGlzdEtleU1hbmFnZXJNb2RpZmllcktleVtdKTogdGhpcyB7XG4gICAgdGhpcy5fYWxsb3dlZE1vZGlmaWVyS2V5cyA9IGtleXM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogVHVybnMgb24gdHlwZWFoZWFkIG1vZGUgd2hpY2ggYWxsb3dzIHVzZXJzIHRvIHNldCB0aGUgYWN0aXZlIGl0ZW0gYnkgdHlwaW5nLlxuICAgKiBAcGFyYW0gZGVib3VuY2VJbnRlcnZhbCBUaW1lIHRvIHdhaXQgYWZ0ZXIgdGhlIGxhc3Qga2V5c3Ryb2tlIGJlZm9yZSBzZXR0aW5nIHRoZSBhY3RpdmUgaXRlbS5cbiAgICovXG4gIHdpdGhUeXBlQWhlYWQoZGVib3VuY2VJbnRlcnZhbDogbnVtYmVyID0gMjAwKTogdGhpcyB7XG4gICAgaWYgKHRoaXMuX2l0ZW1zLmxlbmd0aCAmJiB0aGlzLl9pdGVtcy5zb21lKGl0ZW0gPT4gdHlwZW9mIGl0ZW0uZ2V0TGFiZWwgIT09ICdmdW5jdGlvbicpKSB7XG4gICAgICB0aHJvdyBFcnJvcignTGlzdEtleU1hbmFnZXIgaXRlbXMgaW4gdHlwZWFoZWFkIG1vZGUgbXVzdCBpbXBsZW1lbnQgdGhlIGBnZXRMYWJlbGAgbWV0aG9kLicpO1xuICAgIH1cblxuICAgIHRoaXMuX3R5cGVhaGVhZFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuXG4gICAgLy8gRGVib3VuY2UgdGhlIHByZXNzZXMgb2Ygbm9uLW5hdmlnYXRpb25hbCBrZXlzLCBjb2xsZWN0IHRoZSBvbmVzIHRoYXQgY29ycmVzcG9uZCB0byBsZXR0ZXJzXG4gICAgLy8gYW5kIGNvbnZlcnQgdGhvc2UgbGV0dGVycyBiYWNrIGludG8gYSBzdHJpbmcuIEFmdGVyd2FyZHMgZmluZCB0aGUgZmlyc3QgaXRlbSB0aGF0IHN0YXJ0c1xuICAgIC8vIHdpdGggdGhhdCBzdHJpbmcgYW5kIHNlbGVjdCBpdC5cbiAgICB0aGlzLl90eXBlYWhlYWRTdWJzY3JpcHRpb24gPSB0aGlzLl9sZXR0ZXJLZXlTdHJlYW0ucGlwZShcbiAgICAgIHRhcChrZXlDb2RlID0+IHRoaXMuX3ByZXNzZWRMZXR0ZXJzLnB1c2goa2V5Q29kZSkpLFxuICAgICAgZGVib3VuY2VUaW1lKGRlYm91bmNlSW50ZXJ2YWwpLFxuICAgICAgZmlsdGVyKCgpID0+IHRoaXMuX3ByZXNzZWRMZXR0ZXJzLmxlbmd0aCA+IDApLFxuICAgICAgbWFwKCgpID0+IHRoaXMuX3ByZXNzZWRMZXR0ZXJzLmpvaW4oJycpKVxuICAgICkuc3Vic2NyaWJlKGlucHV0U3RyaW5nID0+IHtcbiAgICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5fZ2V0SXRlbXNBcnJheSgpO1xuXG4gICAgICAvLyBTdGFydCBhdCAxIGJlY2F1c2Ugd2Ugd2FudCB0byBzdGFydCBzZWFyY2hpbmcgYXQgdGhlIGl0ZW0gaW1tZWRpYXRlbHlcbiAgICAgIC8vIGZvbGxvd2luZyB0aGUgY3VycmVudCBhY3RpdmUgaXRlbS5cbiAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgaXRlbXMubGVuZ3RoICsgMTsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gKHRoaXMuX2FjdGl2ZUl0ZW1JbmRleCArIGkpICUgaXRlbXMubGVuZ3RoO1xuICAgICAgICBjb25zdCBpdGVtID0gaXRlbXNbaW5kZXhdO1xuXG4gICAgICAgIGlmICghdGhpcy5fc2tpcFByZWRpY2F0ZUZuKGl0ZW0pICYmXG4gICAgICAgICAgICBpdGVtLmdldExhYmVsISgpLnRvVXBwZXJDYXNlKCkudHJpbSgpLmluZGV4T2YoaW5wdXRTdHJpbmcpID09PSAwKSB7XG5cbiAgICAgICAgICB0aGlzLnNldEFjdGl2ZUl0ZW0oaW5kZXgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3ByZXNzZWRMZXR0ZXJzID0gW107XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBhY3RpdmUgaXRlbSB0byB0aGUgaXRlbSBhdCB0aGUgaW5kZXggc3BlY2lmaWVkLlxuICAgKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBpdGVtIHRvIGJlIHNldCBhcyBhY3RpdmUuXG4gICAqL1xuICBzZXRBY3RpdmVJdGVtKGluZGV4OiBudW1iZXIpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBhY3RpdmUgaXRlbSB0byB0aGUgc3BlY2lmaWVkIGl0ZW0uXG4gICAqIEBwYXJhbSBpdGVtIFRoZSBpdGVtIHRvIGJlIHNldCBhcyBhY3RpdmUuXG4gICAqL1xuICBzZXRBY3RpdmVJdGVtKGl0ZW06IFQpOiB2b2lkO1xuXG4gIHNldEFjdGl2ZUl0ZW0oaXRlbTogYW55KTogdm9pZCB7XG4gICAgY29uc3QgcHJldmlvdXNJbmRleCA9IHRoaXMuX2FjdGl2ZUl0ZW1JbmRleDtcblxuICAgIHRoaXMudXBkYXRlQWN0aXZlSXRlbShpdGVtKTtcblxuICAgIGlmICh0aGlzLl9hY3RpdmVJdGVtSW5kZXggIT09IHByZXZpb3VzSW5kZXgpIHtcbiAgICAgIHRoaXMuY2hhbmdlLm5leHQodGhpcy5fYWN0aXZlSXRlbUluZGV4KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgYWN0aXZlIGl0ZW0gZGVwZW5kaW5nIG9uIHRoZSBrZXkgZXZlbnQgcGFzc2VkIGluLlxuICAgKiBAcGFyYW0gZXZlbnQgS2V5Ym9hcmQgZXZlbnQgdG8gYmUgdXNlZCBmb3IgZGV0ZXJtaW5pbmcgd2hpY2ggZWxlbWVudCBzaG91bGQgYmUgYWN0aXZlLlxuICAgKi9cbiAgb25LZXlkb3duKGV2ZW50OiBLZXlib2FyZEV2ZW50KTogdm9pZCB7XG4gICAgY29uc3Qga2V5Q29kZSA9IGV2ZW50LmtleUNvZGU7XG4gICAgY29uc3QgbW9kaWZpZXJzOiBMaXN0S2V5TWFuYWdlck1vZGlmaWVyS2V5W10gPSBbJ2FsdEtleScsICdjdHJsS2V5JywgJ21ldGFLZXknLCAnc2hpZnRLZXknXTtcbiAgICBjb25zdCBpc01vZGlmaWVyQWxsb3dlZCA9IG1vZGlmaWVycy5ldmVyeShtb2RpZmllciA9PiB7XG4gICAgICByZXR1cm4gIWV2ZW50W21vZGlmaWVyXSB8fCB0aGlzLl9hbGxvd2VkTW9kaWZpZXJLZXlzLmluZGV4T2YobW9kaWZpZXIpID4gLTE7XG4gICAgfSk7XG5cbiAgICBzd2l0Y2ggKGtleUNvZGUpIHtcbiAgICAgIGNhc2UgVEFCOlxuICAgICAgICB0aGlzLnRhYk91dC5uZXh0KCk7XG4gICAgICAgIHJldHVybjtcblxuICAgICAgY2FzZSBET1dOX0FSUk9XOlxuICAgICAgICBpZiAodGhpcy5fdmVydGljYWwgJiYgaXNNb2RpZmllckFsbG93ZWQpIHtcbiAgICAgICAgICB0aGlzLnNldE5leHRJdGVtQWN0aXZlKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgIGNhc2UgVVBfQVJST1c6XG4gICAgICAgIGlmICh0aGlzLl92ZXJ0aWNhbCAmJiBpc01vZGlmaWVyQWxsb3dlZCkge1xuICAgICAgICAgIHRoaXMuc2V0UHJldmlvdXNJdGVtQWN0aXZlKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgIGNhc2UgUklHSFRfQVJST1c6XG4gICAgICAgIGlmICh0aGlzLl9ob3Jpem9udGFsICYmIGlzTW9kaWZpZXJBbGxvd2VkKSB7XG4gICAgICAgICAgdGhpcy5faG9yaXpvbnRhbCA9PT0gJ3J0bCcgPyB0aGlzLnNldFByZXZpb3VzSXRlbUFjdGl2ZSgpIDogdGhpcy5zZXROZXh0SXRlbUFjdGl2ZSgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICBjYXNlIExFRlRfQVJST1c6XG4gICAgICAgIGlmICh0aGlzLl9ob3Jpem9udGFsICYmIGlzTW9kaWZpZXJBbGxvd2VkKSB7XG4gICAgICAgICAgdGhpcy5faG9yaXpvbnRhbCA9PT0gJ3J0bCcgPyB0aGlzLnNldE5leHRJdGVtQWN0aXZlKCkgOiB0aGlzLnNldFByZXZpb3VzSXRlbUFjdGl2ZSgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgaWYgKGlzTW9kaWZpZXJBbGxvd2VkIHx8IGhhc01vZGlmaWVyS2V5KGV2ZW50LCAnc2hpZnRLZXknKSkge1xuICAgICAgICAgIC8vIEF0dGVtcHQgdG8gdXNlIHRoZSBgZXZlbnQua2V5YCB3aGljaCBhbHNvIG1hcHMgaXQgdG8gdGhlIHVzZXIncyBrZXlib2FyZCBsYW5ndWFnZSxcbiAgICAgICAgICAvLyBvdGhlcndpc2UgZmFsbCBiYWNrIHRvIHJlc29sdmluZyBhbHBoYW51bWVyaWMgY2hhcmFjdGVycyB2aWEgdGhlIGtleUNvZGUuXG4gICAgICAgICAgaWYgKGV2ZW50LmtleSAmJiBldmVudC5rZXkubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICB0aGlzLl9sZXR0ZXJLZXlTdHJlYW0ubmV4dChldmVudC5rZXkudG9Mb2NhbGVVcHBlckNhc2UoKSk7XG4gICAgICAgICAgfSBlbHNlIGlmICgoa2V5Q29kZSA+PSBBICYmIGtleUNvZGUgPD0gWikgfHwgKGtleUNvZGUgPj0gWkVSTyAmJiBrZXlDb2RlIDw9IE5JTkUpKSB7XG4gICAgICAgICAgICB0aGlzLl9sZXR0ZXJLZXlTdHJlYW0ubmV4dChTdHJpbmcuZnJvbUNoYXJDb2RlKGtleUNvZGUpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBOb3RlIHRoYXQgd2UgcmV0dXJuIGhlcmUsIGluIG9yZGVyIHRvIGF2b2lkIHByZXZlbnRpbmdcbiAgICAgICAgLy8gdGhlIGRlZmF1bHQgYWN0aW9uIG9mIG5vbi1uYXZpZ2F0aW9uYWwga2V5cy5cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3ByZXNzZWRMZXR0ZXJzID0gW107XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgfVxuXG4gIC8qKiBJbmRleCBvZiB0aGUgY3VycmVudGx5IGFjdGl2ZSBpdGVtLiAqL1xuICBnZXQgYWN0aXZlSXRlbUluZGV4KCk6IG51bWJlciB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLl9hY3RpdmVJdGVtSW5kZXg7XG4gIH1cblxuICAvKiogVGhlIGFjdGl2ZSBpdGVtLiAqL1xuICBnZXQgYWN0aXZlSXRlbSgpOiBUIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX2FjdGl2ZUl0ZW07XG4gIH1cblxuICAvKiogU2V0cyB0aGUgYWN0aXZlIGl0ZW0gdG8gdGhlIGZpcnN0IGVuYWJsZWQgaXRlbSBpbiB0aGUgbGlzdC4gKi9cbiAgc2V0Rmlyc3RJdGVtQWN0aXZlKCk6IHZvaWQge1xuICAgIHRoaXMuX3NldEFjdGl2ZUl0ZW1CeUluZGV4KDAsIDEpO1xuICB9XG5cbiAgLyoqIFNldHMgdGhlIGFjdGl2ZSBpdGVtIHRvIHRoZSBsYXN0IGVuYWJsZWQgaXRlbSBpbiB0aGUgbGlzdC4gKi9cbiAgc2V0TGFzdEl0ZW1BY3RpdmUoKTogdm9pZCB7XG4gICAgdGhpcy5fc2V0QWN0aXZlSXRlbUJ5SW5kZXgodGhpcy5faXRlbXMubGVuZ3RoIC0gMSwgLTEpO1xuICB9XG5cbiAgLyoqIFNldHMgdGhlIGFjdGl2ZSBpdGVtIHRvIHRoZSBuZXh0IGVuYWJsZWQgaXRlbSBpbiB0aGUgbGlzdC4gKi9cbiAgc2V0TmV4dEl0ZW1BY3RpdmUoKTogdm9pZCB7XG4gICAgdGhpcy5fYWN0aXZlSXRlbUluZGV4IDwgMCA/IHRoaXMuc2V0Rmlyc3RJdGVtQWN0aXZlKCkgOiB0aGlzLl9zZXRBY3RpdmVJdGVtQnlEZWx0YSgxKTtcbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBhY3RpdmUgaXRlbSB0byBhIHByZXZpb3VzIGVuYWJsZWQgaXRlbSBpbiB0aGUgbGlzdC4gKi9cbiAgc2V0UHJldmlvdXNJdGVtQWN0aXZlKCk6IHZvaWQge1xuICAgIHRoaXMuX2FjdGl2ZUl0ZW1JbmRleCA8IDAgJiYgdGhpcy5fd3JhcCA/IHRoaXMuc2V0TGFzdEl0ZW1BY3RpdmUoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHRoaXMuX3NldEFjdGl2ZUl0ZW1CeURlbHRhKC0xKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbGxvd3Mgc2V0dGluZyB0aGUgYWN0aXZlIHdpdGhvdXQgYW55IG90aGVyIGVmZmVjdHMuXG4gICAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgaXRlbSB0byBiZSBzZXQgYXMgYWN0aXZlLlxuICAgKi9cbiAgdXBkYXRlQWN0aXZlSXRlbShpbmRleDogbnVtYmVyKTogdm9pZDtcblxuICAvKipcbiAgICogQWxsb3dzIHNldHRpbmcgdGhlIGFjdGl2ZSBpdGVtIHdpdGhvdXQgYW55IG90aGVyIGVmZmVjdHMuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdG8gYmUgc2V0IGFzIGFjdGl2ZS5cbiAgICovXG4gIHVwZGF0ZUFjdGl2ZUl0ZW0oaXRlbTogVCk6IHZvaWQ7XG5cbiAgdXBkYXRlQWN0aXZlSXRlbShpdGVtOiBhbnkpOiB2b2lkIHtcbiAgICBjb25zdCBpdGVtQXJyYXkgPSB0aGlzLl9nZXRJdGVtc0FycmF5KCk7XG4gICAgY29uc3QgaW5kZXggPSB0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicgPyBpdGVtIDogaXRlbUFycmF5LmluZGV4T2YoaXRlbSk7XG4gICAgY29uc3QgYWN0aXZlSXRlbSA9IGl0ZW1BcnJheVtpbmRleF07XG5cbiAgICAvLyBFeHBsaWNpdGx5IGNoZWNrIGZvciBgbnVsbGAgYW5kIGB1bmRlZmluZWRgIGJlY2F1c2Ugb3RoZXIgZmFsc3kgdmFsdWVzIGFyZSB2YWxpZC5cbiAgICB0aGlzLl9hY3RpdmVJdGVtID0gYWN0aXZlSXRlbSA9PSBudWxsID8gbnVsbCA6IGFjdGl2ZUl0ZW07XG4gICAgdGhpcy5fYWN0aXZlSXRlbUluZGV4ID0gaW5kZXg7XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBtZXRob2Qgc2V0cyB0aGUgYWN0aXZlIGl0ZW0sIGdpdmVuIGEgbGlzdCBvZiBpdGVtcyBhbmQgdGhlIGRlbHRhIGJldHdlZW4gdGhlXG4gICAqIGN1cnJlbnRseSBhY3RpdmUgaXRlbSBhbmQgdGhlIG5ldyBhY3RpdmUgaXRlbS4gSXQgd2lsbCBjYWxjdWxhdGUgZGlmZmVyZW50bHlcbiAgICogZGVwZW5kaW5nIG9uIHdoZXRoZXIgd3JhcCBtb2RlIGlzIHR1cm5lZCBvbi5cbiAgICovXG4gIHByaXZhdGUgX3NldEFjdGl2ZUl0ZW1CeURlbHRhKGRlbHRhOiAtMSB8IDEpOiB2b2lkIHtcbiAgICB0aGlzLl93cmFwID8gdGhpcy5fc2V0QWN0aXZlSW5XcmFwTW9kZShkZWx0YSkgOiB0aGlzLl9zZXRBY3RpdmVJbkRlZmF1bHRNb2RlKGRlbHRhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBhY3RpdmUgaXRlbSBwcm9wZXJseSBnaXZlbiBcIndyYXBcIiBtb2RlLiBJbiBvdGhlciB3b3JkcywgaXQgd2lsbCBjb250aW51ZSB0byBtb3ZlXG4gICAqIGRvd24gdGhlIGxpc3QgdW50aWwgaXQgZmluZHMgYW4gaXRlbSB0aGF0IGlzIG5vdCBkaXNhYmxlZCwgYW5kIGl0IHdpbGwgd3JhcCBpZiBpdFxuICAgKiBlbmNvdW50ZXJzIGVpdGhlciBlbmQgb2YgdGhlIGxpc3QuXG4gICAqL1xuICBwcml2YXRlIF9zZXRBY3RpdmVJbldyYXBNb2RlKGRlbHRhOiAtMSB8IDEpOiB2b2lkIHtcbiAgICBjb25zdCBpdGVtcyA9IHRoaXMuX2dldEl0ZW1zQXJyYXkoKTtcblxuICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IGl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBpbmRleCA9ICh0aGlzLl9hY3RpdmVJdGVtSW5kZXggKyAoZGVsdGEgKiBpKSArIGl0ZW1zLmxlbmd0aCkgJSBpdGVtcy5sZW5ndGg7XG4gICAgICBjb25zdCBpdGVtID0gaXRlbXNbaW5kZXhdO1xuXG4gICAgICBpZiAoIXRoaXMuX3NraXBQcmVkaWNhdGVGbihpdGVtKSkge1xuICAgICAgICB0aGlzLnNldEFjdGl2ZUl0ZW0oaW5kZXgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGFjdGl2ZSBpdGVtIHByb3Blcmx5IGdpdmVuIHRoZSBkZWZhdWx0IG1vZGUuIEluIG90aGVyIHdvcmRzLCBpdCB3aWxsXG4gICAqIGNvbnRpbnVlIHRvIG1vdmUgZG93biB0aGUgbGlzdCB1bnRpbCBpdCBmaW5kcyBhbiBpdGVtIHRoYXQgaXMgbm90IGRpc2FibGVkLiBJZlxuICAgKiBpdCBlbmNvdW50ZXJzIGVpdGhlciBlbmQgb2YgdGhlIGxpc3QsIGl0IHdpbGwgc3RvcCBhbmQgbm90IHdyYXAuXG4gICAqL1xuICBwcml2YXRlIF9zZXRBY3RpdmVJbkRlZmF1bHRNb2RlKGRlbHRhOiAtMSB8IDEpOiB2b2lkIHtcbiAgICB0aGlzLl9zZXRBY3RpdmVJdGVtQnlJbmRleCh0aGlzLl9hY3RpdmVJdGVtSW5kZXggKyBkZWx0YSwgZGVsdGEpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGFjdGl2ZSBpdGVtIHRvIHRoZSBmaXJzdCBlbmFibGVkIGl0ZW0gc3RhcnRpbmcgYXQgdGhlIGluZGV4IHNwZWNpZmllZC4gSWYgdGhlXG4gICAqIGl0ZW0gaXMgZGlzYWJsZWQsIGl0IHdpbGwgbW92ZSBpbiB0aGUgZmFsbGJhY2tEZWx0YSBkaXJlY3Rpb24gdW50aWwgaXQgZWl0aGVyXG4gICAqIGZpbmRzIGFuIGVuYWJsZWQgaXRlbSBvciBlbmNvdW50ZXJzIHRoZSBlbmQgb2YgdGhlIGxpc3QuXG4gICAqL1xuICBwcml2YXRlIF9zZXRBY3RpdmVJdGVtQnlJbmRleChpbmRleDogbnVtYmVyLCBmYWxsYmFja0RlbHRhOiAtMSB8IDEpOiB2b2lkIHtcbiAgICBjb25zdCBpdGVtcyA9IHRoaXMuX2dldEl0ZW1zQXJyYXkoKTtcblxuICAgIGlmICghaXRlbXNbaW5kZXhdKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgd2hpbGUgKHRoaXMuX3NraXBQcmVkaWNhdGVGbihpdGVtc1tpbmRleF0pKSB7XG4gICAgICBpbmRleCArPSBmYWxsYmFja0RlbHRhO1xuXG4gICAgICBpZiAoIWl0ZW1zW2luZGV4XSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5zZXRBY3RpdmVJdGVtKGluZGV4KTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHRoZSBpdGVtcyBhcyBhbiBhcnJheS4gKi9cbiAgcHJpdmF0ZSBfZ2V0SXRlbXNBcnJheSgpOiBUW10ge1xuICAgIHJldHVybiB0aGlzLl9pdGVtcyBpbnN0YW5jZW9mIFF1ZXJ5TGlzdCA/IHRoaXMuX2l0ZW1zLnRvQXJyYXkoKSA6IHRoaXMuX2l0ZW1zO1xuICB9XG59XG4iXX0=