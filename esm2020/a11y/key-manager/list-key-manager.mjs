/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { QueryList } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW, TAB, A, Z, ZERO, NINE, hasModifierKey, HOME, END, PAGE_UP, PAGE_DOWN, } from '@angular/cdk/keycodes';
import { debounceTime, filter, map, tap } from 'rxjs/operators';
/**
 * This class manages keyboard events for selectable lists. If you pass it a query list
 * of items, it will set the active item correctly when arrow events occur.
 */
export class ListKeyManager {
    constructor(_items) {
        this._items = _items;
        this._activeItemIndex = -1;
        this._activeItem = null;
        this._wrap = false;
        this._letterKeyStream = new Subject();
        this._typeaheadSubscription = Subscription.EMPTY;
        this._vertical = true;
        this._allowedModifierKeys = [];
        this._homeAndEnd = false;
        this._pageUpAndDown = { enabled: false, delta: 10 };
        /**
         * Predicate function that can be used to check whether an item should be skipped
         * by the key manager. By default, disabled items are skipped.
         */
        this._skipPredicateFn = (item) => item.disabled;
        // Buffer for the letters that the user has pressed when the typeahead option is turned on.
        this._pressedLetters = [];
        /**
         * Stream that emits any time the TAB key is pressed, so components can react
         * when focus is shifted off of the list.
         */
        this.tabOut = new Subject();
        /** Stream that emits whenever the active item of the list manager changes. */
        this.change = new Subject();
        // We allow for the items to be an array because, in some cases, the consumer may
        // not have access to a QueryList of the items they want to manage (e.g. when the
        // items aren't being collected via `ViewChildren` or `ContentChildren`).
        if (_items instanceof QueryList) {
            _items.changes.subscribe((newItems) => {
                if (this._activeItem) {
                    const itemArray = newItems.toArray();
                    const newIndex = itemArray.indexOf(this._activeItem);
                    if (newIndex > -1 && newIndex !== this._activeItemIndex) {
                        this._activeItemIndex = newIndex;
                    }
                }
            });
        }
    }
    /**
     * Sets the predicate function that determines which items should be skipped by the
     * list key manager.
     * @param predicate Function that determines whether the given item should be skipped.
     */
    skipPredicate(predicate) {
        this._skipPredicateFn = predicate;
        return this;
    }
    /**
     * Configures wrapping mode, which determines whether the active item will wrap to
     * the other end of list when there are no more items in the given direction.
     * @param shouldWrap Whether the list should wrap when reaching the end.
     */
    withWrap(shouldWrap = true) {
        this._wrap = shouldWrap;
        return this;
    }
    /**
     * Configures whether the key manager should be able to move the selection vertically.
     * @param enabled Whether vertical selection should be enabled.
     */
    withVerticalOrientation(enabled = true) {
        this._vertical = enabled;
        return this;
    }
    /**
     * Configures the key manager to move the selection horizontally.
     * Passing in `null` will disable horizontal movement.
     * @param direction Direction in which the selection can be moved.
     */
    withHorizontalOrientation(direction) {
        this._horizontal = direction;
        return this;
    }
    /**
     * Modifier keys which are allowed to be held down and whose default actions will be prevented
     * as the user is pressing the arrow keys. Defaults to not allowing any modifier keys.
     */
    withAllowedModifierKeys(keys) {
        this._allowedModifierKeys = keys;
        return this;
    }
    /**
     * Turns on typeahead mode which allows users to set the active item by typing.
     * @param debounceInterval Time to wait after the last keystroke before setting the active item.
     */
    withTypeAhead(debounceInterval = 200) {
        if ((typeof ngDevMode === 'undefined' || ngDevMode) &&
            this._items.length &&
            this._items.some(item => typeof item.getLabel !== 'function')) {
            throw Error('ListKeyManager items in typeahead mode must implement the `getLabel` method.');
        }
        this._typeaheadSubscription.unsubscribe();
        // Debounce the presses of non-navigational keys, collect the ones that correspond to letters
        // and convert those letters back into a string. Afterwards find the first item that starts
        // with that string and select it.
        this._typeaheadSubscription = this._letterKeyStream
            .pipe(tap(letter => this._pressedLetters.push(letter)), debounceTime(debounceInterval), filter(() => this._pressedLetters.length > 0), map(() => this._pressedLetters.join('')))
            .subscribe(inputString => {
            const items = this._getItemsArray();
            // Start at 1 because we want to start searching at the item immediately
            // following the current active item.
            for (let i = 1; i < items.length + 1; i++) {
                const index = (this._activeItemIndex + i) % items.length;
                const item = items[index];
                if (!this._skipPredicateFn(item) &&
                    item.getLabel().toUpperCase().trim().indexOf(inputString) === 0) {
                    this.setActiveItem(index);
                    break;
                }
            }
            this._pressedLetters = [];
        });
        return this;
    }
    /**
     * Configures the key manager to activate the first and last items
     * respectively when the Home or End key is pressed.
     * @param enabled Whether pressing the Home or End key activates the first/last item.
     */
    withHomeAndEnd(enabled = true) {
        this._homeAndEnd = enabled;
        return this;
    }
    /**
     * Configures the key manager to activate every 10th, configured or first/last element in up/down direction
     * respectively when the Page-Up or Page-Down key is pressed.
     * @param enabled Whether pressing the Page-Up or Page-Down key activates the first/last item.
     * @param delta Whether pressing the Home or End key activates the first/last item.
     */
    withPageUpDown(enabled = true, delta = 10) {
        this._pageUpAndDown = { enabled, delta };
        return this;
    }
    setActiveItem(item) {
        const previousActiveItem = this._activeItem;
        this.updateActiveItem(item);
        if (this._activeItem !== previousActiveItem) {
            this.change.next(this._activeItemIndex);
        }
    }
    /**
     * Sets the active item depending on the key event passed in.
     * @param event Keyboard event to be used for determining which element should be active.
     */
    onKeydown(event) {
        const keyCode = event.keyCode;
        const modifiers = ['altKey', 'ctrlKey', 'metaKey', 'shiftKey'];
        const isModifierAllowed = modifiers.every(modifier => {
            return !event[modifier] || this._allowedModifierKeys.indexOf(modifier) > -1;
        });
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
            case HOME:
                if (this._homeAndEnd && isModifierAllowed) {
                    this.setFirstItemActive();
                    break;
                }
                else {
                    return;
                }
            case END:
                if (this._homeAndEnd && isModifierAllowed) {
                    this.setLastItemActive();
                    break;
                }
                else {
                    return;
                }
            case PAGE_UP:
                if (this._pageUpAndDown.enabled && isModifierAllowed) {
                    const targetIndex = this._activeItemIndex - this._pageUpAndDown.delta;
                    this._setActiveItemByIndex(targetIndex > 0 ? targetIndex : 0, 1);
                    break;
                }
                else {
                    return;
                }
            case PAGE_DOWN:
                if (this._pageUpAndDown.enabled && isModifierAllowed) {
                    const targetIndex = this._activeItemIndex + this._pageUpAndDown.delta;
                    const itemsLength = this._getItemsArray().length;
                    this._setActiveItemByIndex(targetIndex < itemsLength ? targetIndex : itemsLength - 1, -1);
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
    /** Index of the currently active item. */
    get activeItemIndex() {
        return this._activeItemIndex;
    }
    /** The active item. */
    get activeItem() {
        return this._activeItem;
    }
    /** Gets whether the user is currently typing into the manager using the typeahead feature. */
    isTyping() {
        return this._pressedLetters.length > 0;
    }
    /** Sets the active item to the first enabled item in the list. */
    setFirstItemActive() {
        this._setActiveItemByIndex(0, 1);
    }
    /** Sets the active item to the last enabled item in the list. */
    setLastItemActive() {
        this._setActiveItemByIndex(this._items.length - 1, -1);
    }
    /** Sets the active item to the next enabled item in the list. */
    setNextItemActive() {
        this._activeItemIndex < 0 ? this.setFirstItemActive() : this._setActiveItemByDelta(1);
    }
    /** Sets the active item to a previous enabled item in the list. */
    setPreviousItemActive() {
        this._activeItemIndex < 0 && this._wrap
            ? this.setLastItemActive()
            : this._setActiveItemByDelta(-1);
    }
    updateActiveItem(item) {
        const itemArray = this._getItemsArray();
        const index = typeof item === 'number' ? item : itemArray.indexOf(item);
        const activeItem = itemArray[index];
        // Explicitly check for `null` and `undefined` because other falsy values are valid.
        this._activeItem = activeItem == null ? null : activeItem;
        this._activeItemIndex = index;
    }
    /**
     * This method sets the active item, given a list of items and the delta between the
     * currently active item and the new active item. It will calculate differently
     * depending on whether wrap mode is turned on.
     */
    _setActiveItemByDelta(delta) {
        this._wrap ? this._setActiveInWrapMode(delta) : this._setActiveInDefaultMode(delta);
    }
    /**
     * Sets the active item properly given "wrap" mode. In other words, it will continue to move
     * down the list until it finds an item that is not disabled, and it will wrap if it
     * encounters either end of the list.
     */
    _setActiveInWrapMode(delta) {
        const items = this._getItemsArray();
        for (let i = 1; i <= items.length; i++) {
            const index = (this._activeItemIndex + delta * i + items.length) % items.length;
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
     */
    _setActiveInDefaultMode(delta) {
        this._setActiveItemByIndex(this._activeItemIndex + delta, delta);
    }
    /**
     * Sets the active item to the first enabled item starting at the index specified. If the
     * item is disabled, it will move in the fallbackDelta direction until it either
     * finds an enabled item or encounters the end of the list.
     */
    _setActiveItemByIndex(index, fallbackDelta) {
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
    /** Returns the items as an array. */
    _getItemsArray() {
        return this._items instanceof QueryList ? this._items.toArray() : this._items;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC1rZXktbWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvYTExeS9rZXktbWFuYWdlci9saXN0LWtleS1tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDeEMsT0FBTyxFQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDM0MsT0FBTyxFQUNMLFFBQVEsRUFDUixVQUFVLEVBQ1YsVUFBVSxFQUNWLFdBQVcsRUFDWCxHQUFHLEVBQ0gsQ0FBQyxFQUNELENBQUMsRUFDRCxJQUFJLEVBQ0osSUFBSSxFQUNKLGNBQWMsRUFDZCxJQUFJLEVBQ0osR0FBRyxFQUNILE9BQU8sRUFDUCxTQUFTLEdBQ1YsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFjOUQ7OztHQUdHO0FBQ0gsTUFBTSxPQUFPLGNBQWM7SUFxQnpCLFlBQW9CLE1BQTBCO1FBQTFCLFdBQU0sR0FBTixNQUFNLENBQW9CO1FBcEJ0QyxxQkFBZ0IsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN0QixnQkFBVyxHQUFhLElBQUksQ0FBQztRQUM3QixVQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ0wscUJBQWdCLEdBQUcsSUFBSSxPQUFPLEVBQVUsQ0FBQztRQUNsRCwyQkFBc0IsR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDO1FBQzVDLGNBQVMsR0FBRyxJQUFJLENBQUM7UUFFakIseUJBQW9CLEdBQWdDLEVBQUUsQ0FBQztRQUN2RCxnQkFBVyxHQUFHLEtBQUssQ0FBQztRQUNwQixtQkFBYyxHQUFHLEVBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFDLENB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LENBQUMsRUFBRTtnQkFDaEMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDMUIsT0FBTzthQUNSO1NBQ0Y7SUFDSCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNLLHVCQUF1QixDQUFDLEtBQWE7UUFDM0MsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDbkUsQ0FBQztJQUVEOzs7O09BSUc7SUFDSyxxQkFBcUIsQ0FBQyxLQUFhLEVBQUUsYUFBcUI7UUFDaEUsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBRXBDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDakIsT0FBTztTQUNSO1FBRUQsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDMUMsS0FBSyxJQUFJLGFBQWEsQ0FBQztZQUV2QixJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNqQixPQUFPO2FBQ1I7U0FDRjtRQUVELElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUVELHFDQUFxQztJQUM3QixjQUFjO1FBQ3BCLE9BQU8sSUFBSSxDQUFDLE1BQU0sWUFBWSxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDaEYsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UXVlcnlMaXN0fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7U3ViamVjdCwgU3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcbmltcG9ydCB7XG4gIFVQX0FSUk9XLFxuICBET1dOX0FSUk9XLFxuICBMRUZUX0FSUk9XLFxuICBSSUdIVF9BUlJPVyxcbiAgVEFCLFxuICBBLFxuICBaLFxuICBaRVJPLFxuICBOSU5FLFxuICBoYXNNb2RpZmllcktleSxcbiAgSE9NRSxcbiAgRU5ELFxuICBQQUdFX1VQLFxuICBQQUdFX0RPV04sXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9rZXljb2Rlcyc7XG5pbXBvcnQge2RlYm91bmNlVGltZSwgZmlsdGVyLCBtYXAsIHRhcH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG4vKiogVGhpcyBpbnRlcmZhY2UgaXMgZm9yIGl0ZW1zIHRoYXQgY2FuIGJlIHBhc3NlZCB0byBhIExpc3RLZXlNYW5hZ2VyLiAqL1xuZXhwb3J0IGludGVyZmFjZSBMaXN0S2V5TWFuYWdlck9wdGlvbiB7XG4gIC8qKiBXaGV0aGVyIHRoZSBvcHRpb24gaXMgZGlzYWJsZWQuICovXG4gIGRpc2FibGVkPzogYm9vbGVhbjtcblxuICAvKiogR2V0cyB0aGUgbGFiZWwgZm9yIHRoaXMgb3B0aW9uLiAqL1xuICBnZXRMYWJlbD8oKTogc3RyaW5nO1xufVxuXG4vKiogTW9kaWZpZXIga2V5cyBoYW5kbGVkIGJ5IHRoZSBMaXN0S2V5TWFuYWdlci4gKi9cbmV4cG9ydCB0eXBlIExpc3RLZXlNYW5hZ2VyTW9kaWZpZXJLZXkgPSAnYWx0S2V5JyB8ICdjdHJsS2V5JyB8ICdtZXRhS2V5JyB8ICdzaGlmdEtleSc7XG5cbi8qKlxuICogVGhpcyBjbGFzcyBtYW5hZ2VzIGtleWJvYXJkIGV2ZW50cyBmb3Igc2VsZWN0YWJsZSBsaXN0cy4gSWYgeW91IHBhc3MgaXQgYSBxdWVyeSBsaXN0XG4gKiBvZiBpdGVtcywgaXQgd2lsbCBzZXQgdGhlIGFjdGl2ZSBpdGVtIGNvcnJlY3RseSB3aGVuIGFycm93IGV2ZW50cyBvY2N1ci5cbiAqL1xuZXhwb3J0IGNsYXNzIExpc3RLZXlNYW5hZ2VyPFQgZXh0ZW5kcyBMaXN0S2V5TWFuYWdlck9wdGlvbj4ge1xuICBwcml2YXRlIF9hY3RpdmVJdGVtSW5kZXggPSAtMTtcbiAgcHJpdmF0ZSBfYWN0aXZlSXRlbTogVCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIF93cmFwID0gZmFsc2U7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2xldHRlcktleVN0cmVhbSA9IG5ldyBTdWJqZWN0PHN0cmluZz4oKTtcbiAgcHJpdmF0ZSBfdHlwZWFoZWFkU3Vic2NyaXB0aW9uID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuICBwcml2YXRlIF92ZXJ0aWNhbCA9IHRydWU7XG4gIHByaXZhdGUgX2hvcml6b250YWw6ICdsdHInIHwgJ3J0bCcgfCBudWxsO1xuICBwcml2YXRlIF9hbGxvd2VkTW9kaWZpZXJLZXlzOiBMaXN0S2V5TWFuYWdlck1vZGlmaWVyS2V5W10gPSBbXTtcbiAgcHJpdmF0ZSBfaG9tZUFuZEVuZCA9IGZhbHNlO1xuICBwcml2YXRlIF9wYWdlVXBBbmREb3duID0ge2VuYWJsZWQ6IGZhbHNlLCBkZWx0YTogMTB9O1xuXG4gIC8qKlxuICAgKiBQcmVkaWNhdGUgZnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB0byBjaGVjayB3aGV0aGVyIGFuIGl0ZW0gc2hvdWxkIGJlIHNraXBwZWRcbiAgICogYnkgdGhlIGtleSBtYW5hZ2VyLiBCeSBkZWZhdWx0LCBkaXNhYmxlZCBpdGVtcyBhcmUgc2tpcHBlZC5cbiAgICovXG4gIHByaXZhdGUgX3NraXBQcmVkaWNhdGVGbiA9IChpdGVtOiBUKSA9PiBpdGVtLmRpc2FibGVkO1xuXG4gIC8vIEJ1ZmZlciBmb3IgdGhlIGxldHRlcnMgdGhhdCB0aGUgdXNlciBoYXMgcHJlc3NlZCB3aGVuIHRoZSB0eXBlYWhlYWQgb3B0aW9uIGlzIHR1cm5lZCBvbi5cbiAgcHJpdmF0ZSBfcHJlc3NlZExldHRlcnM6IHN0cmluZ1tdID0gW107XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfaXRlbXM6IFF1ZXJ5TGlzdDxUPiB8IFRbXSkge1xuICAgIC8vIFdlIGFsbG93IGZvciB0aGUgaXRlbXMgdG8gYmUgYW4gYXJyYXkgYmVjYXVzZSwgaW4gc29tZSBjYXNlcywgdGhlIGNvbnN1bWVyIG1heVxuICAgIC8vIG5vdCBoYXZlIGFjY2VzcyB0byBhIFF1ZXJ5TGlzdCBvZiB0aGUgaXRlbXMgdGhleSB3YW50IHRvIG1hbmFnZSAoZS5nLiB3aGVuIHRoZVxuICAgIC8vIGl0ZW1zIGFyZW4ndCBiZWluZyBjb2xsZWN0ZWQgdmlhIGBWaWV3Q2hpbGRyZW5gIG9yIGBDb250ZW50Q2hpbGRyZW5gKS5cbiAgICBpZiAoX2l0ZW1zIGluc3RhbmNlb2YgUXVlcnlMaXN0KSB7XG4gICAgICBfaXRlbXMuY2hhbmdlcy5zdWJzY3JpYmUoKG5ld0l0ZW1zOiBRdWVyeUxpc3Q8VD4pID0+IHtcbiAgICAgICAgaWYgKHRoaXMuX2FjdGl2ZUl0ZW0pIHtcbiAgICAgICAgICBjb25zdCBpdGVtQXJyYXkgPSBuZXdJdGVtcy50b0FycmF5KCk7XG4gICAgICAgICAgY29uc3QgbmV3SW5kZXggPSBpdGVtQXJyYXkuaW5kZXhPZih0aGlzLl9hY3RpdmVJdGVtKTtcblxuICAgICAgICAgIGlmIChuZXdJbmRleCA+IC0xICYmIG5ld0luZGV4ICE9PSB0aGlzLl9hY3RpdmVJdGVtSW5kZXgpIHtcbiAgICAgICAgICAgIHRoaXMuX2FjdGl2ZUl0ZW1JbmRleCA9IG5ld0luZGV4O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFN0cmVhbSB0aGF0IGVtaXRzIGFueSB0aW1lIHRoZSBUQUIga2V5IGlzIHByZXNzZWQsIHNvIGNvbXBvbmVudHMgY2FuIHJlYWN0XG4gICAqIHdoZW4gZm9jdXMgaXMgc2hpZnRlZCBvZmYgb2YgdGhlIGxpc3QuXG4gICAqL1xuICByZWFkb25seSB0YWJPdXQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBTdHJlYW0gdGhhdCBlbWl0cyB3aGVuZXZlciB0aGUgYWN0aXZlIGl0ZW0gb2YgdGhlIGxpc3QgbWFuYWdlciBjaGFuZ2VzLiAqL1xuICByZWFkb25seSBjaGFuZ2UgPSBuZXcgU3ViamVjdDxudW1iZXI+KCk7XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHByZWRpY2F0ZSBmdW5jdGlvbiB0aGF0IGRldGVybWluZXMgd2hpY2ggaXRlbXMgc2hvdWxkIGJlIHNraXBwZWQgYnkgdGhlXG4gICAqIGxpc3Qga2V5IG1hbmFnZXIuXG4gICAqIEBwYXJhbSBwcmVkaWNhdGUgRnVuY3Rpb24gdGhhdCBkZXRlcm1pbmVzIHdoZXRoZXIgdGhlIGdpdmVuIGl0ZW0gc2hvdWxkIGJlIHNraXBwZWQuXG4gICAqL1xuICBza2lwUHJlZGljYXRlKHByZWRpY2F0ZTogKGl0ZW06IFQpID0+IGJvb2xlYW4pOiB0aGlzIHtcbiAgICB0aGlzLl9za2lwUHJlZGljYXRlRm4gPSBwcmVkaWNhdGU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ29uZmlndXJlcyB3cmFwcGluZyBtb2RlLCB3aGljaCBkZXRlcm1pbmVzIHdoZXRoZXIgdGhlIGFjdGl2ZSBpdGVtIHdpbGwgd3JhcCB0b1xuICAgKiB0aGUgb3RoZXIgZW5kIG9mIGxpc3Qgd2hlbiB0aGVyZSBhcmUgbm8gbW9yZSBpdGVtcyBpbiB0aGUgZ2l2ZW4gZGlyZWN0aW9uLlxuICAgKiBAcGFyYW0gc2hvdWxkV3JhcCBXaGV0aGVyIHRoZSBsaXN0IHNob3VsZCB3cmFwIHdoZW4gcmVhY2hpbmcgdGhlIGVuZC5cbiAgICovXG4gIHdpdGhXcmFwKHNob3VsZFdyYXAgPSB0cnVlKTogdGhpcyB7XG4gICAgdGhpcy5fd3JhcCA9IHNob3VsZFdyYXA7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ29uZmlndXJlcyB3aGV0aGVyIHRoZSBrZXkgbWFuYWdlciBzaG91bGQgYmUgYWJsZSB0byBtb3ZlIHRoZSBzZWxlY3Rpb24gdmVydGljYWxseS5cbiAgICogQHBhcmFtIGVuYWJsZWQgV2hldGhlciB2ZXJ0aWNhbCBzZWxlY3Rpb24gc2hvdWxkIGJlIGVuYWJsZWQuXG4gICAqL1xuICB3aXRoVmVydGljYWxPcmllbnRhdGlvbihlbmFibGVkOiBib29sZWFuID0gdHJ1ZSk6IHRoaXMge1xuICAgIHRoaXMuX3ZlcnRpY2FsID0gZW5hYmxlZDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25maWd1cmVzIHRoZSBrZXkgbWFuYWdlciB0byBtb3ZlIHRoZSBzZWxlY3Rpb24gaG9yaXpvbnRhbGx5LlxuICAgKiBQYXNzaW5nIGluIGBudWxsYCB3aWxsIGRpc2FibGUgaG9yaXpvbnRhbCBtb3ZlbWVudC5cbiAgICogQHBhcmFtIGRpcmVjdGlvbiBEaXJlY3Rpb24gaW4gd2hpY2ggdGhlIHNlbGVjdGlvbiBjYW4gYmUgbW92ZWQuXG4gICAqL1xuICB3aXRoSG9yaXpvbnRhbE9yaWVudGF0aW9uKGRpcmVjdGlvbjogJ2x0cicgfCAncnRsJyB8IG51bGwpOiB0aGlzIHtcbiAgICB0aGlzLl9ob3Jpem9udGFsID0gZGlyZWN0aW9uO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIE1vZGlmaWVyIGtleXMgd2hpY2ggYXJlIGFsbG93ZWQgdG8gYmUgaGVsZCBkb3duIGFuZCB3aG9zZSBkZWZhdWx0IGFjdGlvbnMgd2lsbCBiZSBwcmV2ZW50ZWRcbiAgICogYXMgdGhlIHVzZXIgaXMgcHJlc3NpbmcgdGhlIGFycm93IGtleXMuIERlZmF1bHRzIHRvIG5vdCBhbGxvd2luZyBhbnkgbW9kaWZpZXIga2V5cy5cbiAgICovXG4gIHdpdGhBbGxvd2VkTW9kaWZpZXJLZXlzKGtleXM6IExpc3RLZXlNYW5hZ2VyTW9kaWZpZXJLZXlbXSk6IHRoaXMge1xuICAgIHRoaXMuX2FsbG93ZWRNb2RpZmllcktleXMgPSBrZXlzO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFR1cm5zIG9uIHR5cGVhaGVhZCBtb2RlIHdoaWNoIGFsbG93cyB1c2VycyB0byBzZXQgdGhlIGFjdGl2ZSBpdGVtIGJ5IHR5cGluZy5cbiAgICogQHBhcmFtIGRlYm91bmNlSW50ZXJ2YWwgVGltZSB0byB3YWl0IGFmdGVyIHRoZSBsYXN0IGtleXN0cm9rZSBiZWZvcmUgc2V0dGluZyB0aGUgYWN0aXZlIGl0ZW0uXG4gICAqL1xuICB3aXRoVHlwZUFoZWFkKGRlYm91bmNlSW50ZXJ2YWw6IG51bWJlciA9IDIwMCk6IHRoaXMge1xuICAgIGlmIChcbiAgICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmXG4gICAgICB0aGlzLl9pdGVtcy5sZW5ndGggJiZcbiAgICAgIHRoaXMuX2l0ZW1zLnNvbWUoaXRlbSA9PiB0eXBlb2YgaXRlbS5nZXRMYWJlbCAhPT0gJ2Z1bmN0aW9uJylcbiAgICApIHtcbiAgICAgIHRocm93IEVycm9yKCdMaXN0S2V5TWFuYWdlciBpdGVtcyBpbiB0eXBlYWhlYWQgbW9kZSBtdXN0IGltcGxlbWVudCB0aGUgYGdldExhYmVsYCBtZXRob2QuJyk7XG4gICAgfVxuXG4gICAgdGhpcy5fdHlwZWFoZWFkU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG5cbiAgICAvLyBEZWJvdW5jZSB0aGUgcHJlc3NlcyBvZiBub24tbmF2aWdhdGlvbmFsIGtleXMsIGNvbGxlY3QgdGhlIG9uZXMgdGhhdCBjb3JyZXNwb25kIHRvIGxldHRlcnNcbiAgICAvLyBhbmQgY29udmVydCB0aG9zZSBsZXR0ZXJzIGJhY2sgaW50byBhIHN0cmluZy4gQWZ0ZXJ3YXJkcyBmaW5kIHRoZSBmaXJzdCBpdGVtIHRoYXQgc3RhcnRzXG4gICAgLy8gd2l0aCB0aGF0IHN0cmluZyBhbmQgc2VsZWN0IGl0LlxuICAgIHRoaXMuX3R5cGVhaGVhZFN1YnNjcmlwdGlvbiA9IHRoaXMuX2xldHRlcktleVN0cmVhbVxuICAgICAgLnBpcGUoXG4gICAgICAgIHRhcChsZXR0ZXIgPT4gdGhpcy5fcHJlc3NlZExldHRlcnMucHVzaChsZXR0ZXIpKSxcbiAgICAgICAgZGVib3VuY2VUaW1lKGRlYm91bmNlSW50ZXJ2YWwpLFxuICAgICAgICBmaWx0ZXIoKCkgPT4gdGhpcy5fcHJlc3NlZExldHRlcnMubGVuZ3RoID4gMCksXG4gICAgICAgIG1hcCgoKSA9PiB0aGlzLl9wcmVzc2VkTGV0dGVycy5qb2luKCcnKSksXG4gICAgICApXG4gICAgICAuc3Vic2NyaWJlKGlucHV0U3RyaW5nID0+IHtcbiAgICAgICAgY29uc3QgaXRlbXMgPSB0aGlzLl9nZXRJdGVtc0FycmF5KCk7XG5cbiAgICAgICAgLy8gU3RhcnQgYXQgMSBiZWNhdXNlIHdlIHdhbnQgdG8gc3RhcnQgc2VhcmNoaW5nIGF0IHRoZSBpdGVtIGltbWVkaWF0ZWx5XG4gICAgICAgIC8vIGZvbGxvd2luZyB0aGUgY3VycmVudCBhY3RpdmUgaXRlbS5cbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBpdGVtcy5sZW5ndGggKyAxOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBpbmRleCA9ICh0aGlzLl9hY3RpdmVJdGVtSW5kZXggKyBpKSAlIGl0ZW1zLmxlbmd0aDtcbiAgICAgICAgICBjb25zdCBpdGVtID0gaXRlbXNbaW5kZXhdO1xuXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgIXRoaXMuX3NraXBQcmVkaWNhdGVGbihpdGVtKSAmJlxuICAgICAgICAgICAgaXRlbS5nZXRMYWJlbCEoKS50b1VwcGVyQ2FzZSgpLnRyaW0oKS5pbmRleE9mKGlucHV0U3RyaW5nKSA9PT0gMFxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy5zZXRBY3RpdmVJdGVtKGluZGV4KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3ByZXNzZWRMZXR0ZXJzID0gW107XG4gICAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZXMgdGhlIGtleSBtYW5hZ2VyIHRvIGFjdGl2YXRlIHRoZSBmaXJzdCBhbmQgbGFzdCBpdGVtc1xuICAgKiByZXNwZWN0aXZlbHkgd2hlbiB0aGUgSG9tZSBvciBFbmQga2V5IGlzIHByZXNzZWQuXG4gICAqIEBwYXJhbSBlbmFibGVkIFdoZXRoZXIgcHJlc3NpbmcgdGhlIEhvbWUgb3IgRW5kIGtleSBhY3RpdmF0ZXMgdGhlIGZpcnN0L2xhc3QgaXRlbS5cbiAgICovXG4gIHdpdGhIb21lQW5kRW5kKGVuYWJsZWQ6IGJvb2xlYW4gPSB0cnVlKTogdGhpcyB7XG4gICAgdGhpcy5faG9tZUFuZEVuZCA9IGVuYWJsZWQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ29uZmlndXJlcyB0aGUga2V5IG1hbmFnZXIgdG8gYWN0aXZhdGUgZXZlcnkgMTB0aCwgY29uZmlndXJlZCBvciBmaXJzdC9sYXN0IGVsZW1lbnQgaW4gdXAvZG93biBkaXJlY3Rpb25cbiAgICogcmVzcGVjdGl2ZWx5IHdoZW4gdGhlIFBhZ2UtVXAgb3IgUGFnZS1Eb3duIGtleSBpcyBwcmVzc2VkLlxuICAgKiBAcGFyYW0gZW5hYmxlZCBXaGV0aGVyIHByZXNzaW5nIHRoZSBQYWdlLVVwIG9yIFBhZ2UtRG93biBrZXkgYWN0aXZhdGVzIHRoZSBmaXJzdC9sYXN0IGl0ZW0uXG4gICAqIEBwYXJhbSBkZWx0YSBXaGV0aGVyIHByZXNzaW5nIHRoZSBIb21lIG9yIEVuZCBrZXkgYWN0aXZhdGVzIHRoZSBmaXJzdC9sYXN0IGl0ZW0uXG4gICAqL1xuICB3aXRoUGFnZVVwRG93bihlbmFibGVkOiBib29sZWFuID0gdHJ1ZSwgZGVsdGE6IG51bWJlciA9IDEwKTogdGhpcyB7XG4gICAgdGhpcy5fcGFnZVVwQW5kRG93biA9IHtlbmFibGVkLCBkZWx0YX07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgYWN0aXZlIGl0ZW0gdG8gdGhlIGl0ZW0gYXQgdGhlIGluZGV4IHNwZWNpZmllZC5cbiAgICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgaXRlbSB0byBiZSBzZXQgYXMgYWN0aXZlLlxuICAgKi9cbiAgc2V0QWN0aXZlSXRlbShpbmRleDogbnVtYmVyKTogdm9pZDtcblxuICAvKipcbiAgICogU2V0cyB0aGUgYWN0aXZlIGl0ZW0gdG8gdGhlIHNwZWNpZmllZCBpdGVtLlxuICAgKiBAcGFyYW0gaXRlbSBUaGUgaXRlbSB0byBiZSBzZXQgYXMgYWN0aXZlLlxuICAgKi9cbiAgc2V0QWN0aXZlSXRlbShpdGVtOiBUKTogdm9pZDtcblxuICBzZXRBY3RpdmVJdGVtKGl0ZW06IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IHByZXZpb3VzQWN0aXZlSXRlbSA9IHRoaXMuX2FjdGl2ZUl0ZW07XG5cbiAgICB0aGlzLnVwZGF0ZUFjdGl2ZUl0ZW0oaXRlbSk7XG5cbiAgICBpZiAodGhpcy5fYWN0aXZlSXRlbSAhPT0gcHJldmlvdXNBY3RpdmVJdGVtKSB7XG4gICAgICB0aGlzLmNoYW5nZS5uZXh0KHRoaXMuX2FjdGl2ZUl0ZW1JbmRleCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGFjdGl2ZSBpdGVtIGRlcGVuZGluZyBvbiB0aGUga2V5IGV2ZW50IHBhc3NlZCBpbi5cbiAgICogQHBhcmFtIGV2ZW50IEtleWJvYXJkIGV2ZW50IHRvIGJlIHVzZWQgZm9yIGRldGVybWluaW5nIHdoaWNoIGVsZW1lbnQgc2hvdWxkIGJlIGFjdGl2ZS5cbiAgICovXG4gIG9uS2V5ZG93bihldmVudDogS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xuICAgIGNvbnN0IGtleUNvZGUgPSBldmVudC5rZXlDb2RlO1xuICAgIGNvbnN0IG1vZGlmaWVyczogTGlzdEtleU1hbmFnZXJNb2RpZmllcktleVtdID0gWydhbHRLZXknLCAnY3RybEtleScsICdtZXRhS2V5JywgJ3NoaWZ0S2V5J107XG4gICAgY29uc3QgaXNNb2RpZmllckFsbG93ZWQgPSBtb2RpZmllcnMuZXZlcnkobW9kaWZpZXIgPT4ge1xuICAgICAgcmV0dXJuICFldmVudFttb2RpZmllcl0gfHwgdGhpcy5fYWxsb3dlZE1vZGlmaWVyS2V5cy5pbmRleE9mKG1vZGlmaWVyKSA+IC0xO1xuICAgIH0pO1xuXG4gICAgc3dpdGNoIChrZXlDb2RlKSB7XG4gICAgICBjYXNlIFRBQjpcbiAgICAgICAgdGhpcy50YWJPdXQubmV4dCgpO1xuICAgICAgICByZXR1cm47XG5cbiAgICAgIGNhc2UgRE9XTl9BUlJPVzpcbiAgICAgICAgaWYgKHRoaXMuX3ZlcnRpY2FsICYmIGlzTW9kaWZpZXJBbGxvd2VkKSB7XG4gICAgICAgICAgdGhpcy5zZXROZXh0SXRlbUFjdGl2ZSgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICBjYXNlIFVQX0FSUk9XOlxuICAgICAgICBpZiAodGhpcy5fdmVydGljYWwgJiYgaXNNb2RpZmllckFsbG93ZWQpIHtcbiAgICAgICAgICB0aGlzLnNldFByZXZpb3VzSXRlbUFjdGl2ZSgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICBjYXNlIFJJR0hUX0FSUk9XOlxuICAgICAgICBpZiAodGhpcy5faG9yaXpvbnRhbCAmJiBpc01vZGlmaWVyQWxsb3dlZCkge1xuICAgICAgICAgIHRoaXMuX2hvcml6b250YWwgPT09ICdydGwnID8gdGhpcy5zZXRQcmV2aW91c0l0ZW1BY3RpdmUoKSA6IHRoaXMuc2V0TmV4dEl0ZW1BY3RpdmUoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgY2FzZSBMRUZUX0FSUk9XOlxuICAgICAgICBpZiAodGhpcy5faG9yaXpvbnRhbCAmJiBpc01vZGlmaWVyQWxsb3dlZCkge1xuICAgICAgICAgIHRoaXMuX2hvcml6b250YWwgPT09ICdydGwnID8gdGhpcy5zZXROZXh0SXRlbUFjdGl2ZSgpIDogdGhpcy5zZXRQcmV2aW91c0l0ZW1BY3RpdmUoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgY2FzZSBIT01FOlxuICAgICAgICBpZiAodGhpcy5faG9tZUFuZEVuZCAmJiBpc01vZGlmaWVyQWxsb3dlZCkge1xuICAgICAgICAgIHRoaXMuc2V0Rmlyc3RJdGVtQWN0aXZlKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgIGNhc2UgRU5EOlxuICAgICAgICBpZiAodGhpcy5faG9tZUFuZEVuZCAmJiBpc01vZGlmaWVyQWxsb3dlZCkge1xuICAgICAgICAgIHRoaXMuc2V0TGFzdEl0ZW1BY3RpdmUoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgY2FzZSBQQUdFX1VQOlxuICAgICAgICBpZiAodGhpcy5fcGFnZVVwQW5kRG93bi5lbmFibGVkICYmIGlzTW9kaWZpZXJBbGxvd2VkKSB7XG4gICAgICAgICAgY29uc3QgdGFyZ2V0SW5kZXggPSB0aGlzLl9hY3RpdmVJdGVtSW5kZXggLSB0aGlzLl9wYWdlVXBBbmREb3duLmRlbHRhO1xuICAgICAgICAgIHRoaXMuX3NldEFjdGl2ZUl0ZW1CeUluZGV4KHRhcmdldEluZGV4ID4gMCA/IHRhcmdldEluZGV4IDogMCwgMSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgIGNhc2UgUEFHRV9ET1dOOlxuICAgICAgICBpZiAodGhpcy5fcGFnZVVwQW5kRG93bi5lbmFibGVkICYmIGlzTW9kaWZpZXJBbGxvd2VkKSB7XG4gICAgICAgICAgY29uc3QgdGFyZ2V0SW5kZXggPSB0aGlzLl9hY3RpdmVJdGVtSW5kZXggKyB0aGlzLl9wYWdlVXBBbmREb3duLmRlbHRhO1xuICAgICAgICAgIGNvbnN0IGl0ZW1zTGVuZ3RoID0gdGhpcy5fZ2V0SXRlbXNBcnJheSgpLmxlbmd0aDtcbiAgICAgICAgICB0aGlzLl9zZXRBY3RpdmVJdGVtQnlJbmRleCh0YXJnZXRJbmRleCA8IGl0ZW1zTGVuZ3RoID8gdGFyZ2V0SW5kZXggOiBpdGVtc0xlbmd0aCAtIDEsIC0xKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGlzTW9kaWZpZXJBbGxvd2VkIHx8IGhhc01vZGlmaWVyS2V5KGV2ZW50LCAnc2hpZnRLZXknKSkge1xuICAgICAgICAgIC8vIEF0dGVtcHQgdG8gdXNlIHRoZSBgZXZlbnQua2V5YCB3aGljaCBhbHNvIG1hcHMgaXQgdG8gdGhlIHVzZXIncyBrZXlib2FyZCBsYW5ndWFnZSxcbiAgICAgICAgICAvLyBvdGhlcndpc2UgZmFsbCBiYWNrIHRvIHJlc29sdmluZyBhbHBoYW51bWVyaWMgY2hhcmFjdGVycyB2aWEgdGhlIGtleUNvZGUuXG4gICAgICAgICAgaWYgKGV2ZW50LmtleSAmJiBldmVudC5rZXkubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICB0aGlzLl9sZXR0ZXJLZXlTdHJlYW0ubmV4dChldmVudC5rZXkudG9Mb2NhbGVVcHBlckNhc2UoKSk7XG4gICAgICAgICAgfSBlbHNlIGlmICgoa2V5Q29kZSA+PSBBICYmIGtleUNvZGUgPD0gWikgfHwgKGtleUNvZGUgPj0gWkVSTyAmJiBrZXlDb2RlIDw9IE5JTkUpKSB7XG4gICAgICAgICAgICB0aGlzLl9sZXR0ZXJLZXlTdHJlYW0ubmV4dChTdHJpbmcuZnJvbUNoYXJDb2RlKGtleUNvZGUpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBOb3RlIHRoYXQgd2UgcmV0dXJuIGhlcmUsIGluIG9yZGVyIHRvIGF2b2lkIHByZXZlbnRpbmdcbiAgICAgICAgLy8gdGhlIGRlZmF1bHQgYWN0aW9uIG9mIG5vbi1uYXZpZ2F0aW9uYWwga2V5cy5cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3ByZXNzZWRMZXR0ZXJzID0gW107XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgfVxuXG4gIC8qKiBJbmRleCBvZiB0aGUgY3VycmVudGx5IGFjdGl2ZSBpdGVtLiAqL1xuICBnZXQgYWN0aXZlSXRlbUluZGV4KCk6IG51bWJlciB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLl9hY3RpdmVJdGVtSW5kZXg7XG4gIH1cblxuICAvKiogVGhlIGFjdGl2ZSBpdGVtLiAqL1xuICBnZXQgYWN0aXZlSXRlbSgpOiBUIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX2FjdGl2ZUl0ZW07XG4gIH1cblxuICAvKiogR2V0cyB3aGV0aGVyIHRoZSB1c2VyIGlzIGN1cnJlbnRseSB0eXBpbmcgaW50byB0aGUgbWFuYWdlciB1c2luZyB0aGUgdHlwZWFoZWFkIGZlYXR1cmUuICovXG4gIGlzVHlwaW5nKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9wcmVzc2VkTGV0dGVycy5sZW5ndGggPiAwO1xuICB9XG5cbiAgLyoqIFNldHMgdGhlIGFjdGl2ZSBpdGVtIHRvIHRoZSBmaXJzdCBlbmFibGVkIGl0ZW0gaW4gdGhlIGxpc3QuICovXG4gIHNldEZpcnN0SXRlbUFjdGl2ZSgpOiB2b2lkIHtcbiAgICB0aGlzLl9zZXRBY3RpdmVJdGVtQnlJbmRleCgwLCAxKTtcbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBhY3RpdmUgaXRlbSB0byB0aGUgbGFzdCBlbmFibGVkIGl0ZW0gaW4gdGhlIGxpc3QuICovXG4gIHNldExhc3RJdGVtQWN0aXZlKCk6IHZvaWQge1xuICAgIHRoaXMuX3NldEFjdGl2ZUl0ZW1CeUluZGV4KHRoaXMuX2l0ZW1zLmxlbmd0aCAtIDEsIC0xKTtcbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBhY3RpdmUgaXRlbSB0byB0aGUgbmV4dCBlbmFibGVkIGl0ZW0gaW4gdGhlIGxpc3QuICovXG4gIHNldE5leHRJdGVtQWN0aXZlKCk6IHZvaWQge1xuICAgIHRoaXMuX2FjdGl2ZUl0ZW1JbmRleCA8IDAgPyB0aGlzLnNldEZpcnN0SXRlbUFjdGl2ZSgpIDogdGhpcy5fc2V0QWN0aXZlSXRlbUJ5RGVsdGEoMSk7XG4gIH1cblxuICAvKiogU2V0cyB0aGUgYWN0aXZlIGl0ZW0gdG8gYSBwcmV2aW91cyBlbmFibGVkIGl0ZW0gaW4gdGhlIGxpc3QuICovXG4gIHNldFByZXZpb3VzSXRlbUFjdGl2ZSgpOiB2b2lkIHtcbiAgICB0aGlzLl9hY3RpdmVJdGVtSW5kZXggPCAwICYmIHRoaXMuX3dyYXBcbiAgICAgID8gdGhpcy5zZXRMYXN0SXRlbUFjdGl2ZSgpXG4gICAgICA6IHRoaXMuX3NldEFjdGl2ZUl0ZW1CeURlbHRhKC0xKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbGxvd3Mgc2V0dGluZyB0aGUgYWN0aXZlIHdpdGhvdXQgYW55IG90aGVyIGVmZmVjdHMuXG4gICAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgaXRlbSB0byBiZSBzZXQgYXMgYWN0aXZlLlxuICAgKi9cbiAgdXBkYXRlQWN0aXZlSXRlbShpbmRleDogbnVtYmVyKTogdm9pZDtcblxuICAvKipcbiAgICogQWxsb3dzIHNldHRpbmcgdGhlIGFjdGl2ZSBpdGVtIHdpdGhvdXQgYW55IG90aGVyIGVmZmVjdHMuXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdG8gYmUgc2V0IGFzIGFjdGl2ZS5cbiAgICovXG4gIHVwZGF0ZUFjdGl2ZUl0ZW0oaXRlbTogVCk6IHZvaWQ7XG5cbiAgdXBkYXRlQWN0aXZlSXRlbShpdGVtOiBhbnkpOiB2b2lkIHtcbiAgICBjb25zdCBpdGVtQXJyYXkgPSB0aGlzLl9nZXRJdGVtc0FycmF5KCk7XG4gICAgY29uc3QgaW5kZXggPSB0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicgPyBpdGVtIDogaXRlbUFycmF5LmluZGV4T2YoaXRlbSk7XG4gICAgY29uc3QgYWN0aXZlSXRlbSA9IGl0ZW1BcnJheVtpbmRleF07XG5cbiAgICAvLyBFeHBsaWNpdGx5IGNoZWNrIGZvciBgbnVsbGAgYW5kIGB1bmRlZmluZWRgIGJlY2F1c2Ugb3RoZXIgZmFsc3kgdmFsdWVzIGFyZSB2YWxpZC5cbiAgICB0aGlzLl9hY3RpdmVJdGVtID0gYWN0aXZlSXRlbSA9PSBudWxsID8gbnVsbCA6IGFjdGl2ZUl0ZW07XG4gICAgdGhpcy5fYWN0aXZlSXRlbUluZGV4ID0gaW5kZXg7XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBtZXRob2Qgc2V0cyB0aGUgYWN0aXZlIGl0ZW0sIGdpdmVuIGEgbGlzdCBvZiBpdGVtcyBhbmQgdGhlIGRlbHRhIGJldHdlZW4gdGhlXG4gICAqIGN1cnJlbnRseSBhY3RpdmUgaXRlbSBhbmQgdGhlIG5ldyBhY3RpdmUgaXRlbS4gSXQgd2lsbCBjYWxjdWxhdGUgZGlmZmVyZW50bHlcbiAgICogZGVwZW5kaW5nIG9uIHdoZXRoZXIgd3JhcCBtb2RlIGlzIHR1cm5lZCBvbi5cbiAgICovXG4gIHByaXZhdGUgX3NldEFjdGl2ZUl0ZW1CeURlbHRhKGRlbHRhOiAtMSB8IDEpOiB2b2lkIHtcbiAgICB0aGlzLl93cmFwID8gdGhpcy5fc2V0QWN0aXZlSW5XcmFwTW9kZShkZWx0YSkgOiB0aGlzLl9zZXRBY3RpdmVJbkRlZmF1bHRNb2RlKGRlbHRhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBhY3RpdmUgaXRlbSBwcm9wZXJseSBnaXZlbiBcIndyYXBcIiBtb2RlLiBJbiBvdGhlciB3b3JkcywgaXQgd2lsbCBjb250aW51ZSB0byBtb3ZlXG4gICAqIGRvd24gdGhlIGxpc3QgdW50aWwgaXQgZmluZHMgYW4gaXRlbSB0aGF0IGlzIG5vdCBkaXNhYmxlZCwgYW5kIGl0IHdpbGwgd3JhcCBpZiBpdFxuICAgKiBlbmNvdW50ZXJzIGVpdGhlciBlbmQgb2YgdGhlIGxpc3QuXG4gICAqL1xuICBwcml2YXRlIF9zZXRBY3RpdmVJbldyYXBNb2RlKGRlbHRhOiAtMSB8IDEpOiB2b2lkIHtcbiAgICBjb25zdCBpdGVtcyA9IHRoaXMuX2dldEl0ZW1zQXJyYXkoKTtcblxuICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IGl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBpbmRleCA9ICh0aGlzLl9hY3RpdmVJdGVtSW5kZXggKyBkZWx0YSAqIGkgKyBpdGVtcy5sZW5ndGgpICUgaXRlbXMubGVuZ3RoO1xuICAgICAgY29uc3QgaXRlbSA9IGl0ZW1zW2luZGV4XTtcblxuICAgICAgaWYgKCF0aGlzLl9za2lwUHJlZGljYXRlRm4oaXRlbSkpIHtcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVJdGVtKGluZGV4KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBhY3RpdmUgaXRlbSBwcm9wZXJseSBnaXZlbiB0aGUgZGVmYXVsdCBtb2RlLiBJbiBvdGhlciB3b3JkcywgaXQgd2lsbFxuICAgKiBjb250aW51ZSB0byBtb3ZlIGRvd24gdGhlIGxpc3QgdW50aWwgaXQgZmluZHMgYW4gaXRlbSB0aGF0IGlzIG5vdCBkaXNhYmxlZC4gSWZcbiAgICogaXQgZW5jb3VudGVycyBlaXRoZXIgZW5kIG9mIHRoZSBsaXN0LCBpdCB3aWxsIHN0b3AgYW5kIG5vdCB3cmFwLlxuICAgKi9cbiAgcHJpdmF0ZSBfc2V0QWN0aXZlSW5EZWZhdWx0TW9kZShkZWx0YTogLTEgfCAxKTogdm9pZCB7XG4gICAgdGhpcy5fc2V0QWN0aXZlSXRlbUJ5SW5kZXgodGhpcy5fYWN0aXZlSXRlbUluZGV4ICsgZGVsdGEsIGRlbHRhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBhY3RpdmUgaXRlbSB0byB0aGUgZmlyc3QgZW5hYmxlZCBpdGVtIHN0YXJ0aW5nIGF0IHRoZSBpbmRleCBzcGVjaWZpZWQuIElmIHRoZVxuICAgKiBpdGVtIGlzIGRpc2FibGVkLCBpdCB3aWxsIG1vdmUgaW4gdGhlIGZhbGxiYWNrRGVsdGEgZGlyZWN0aW9uIHVudGlsIGl0IGVpdGhlclxuICAgKiBmaW5kcyBhbiBlbmFibGVkIGl0ZW0gb3IgZW5jb3VudGVycyB0aGUgZW5kIG9mIHRoZSBsaXN0LlxuICAgKi9cbiAgcHJpdmF0ZSBfc2V0QWN0aXZlSXRlbUJ5SW5kZXgoaW5kZXg6IG51bWJlciwgZmFsbGJhY2tEZWx0YTogLTEgfCAxKTogdm9pZCB7XG4gICAgY29uc3QgaXRlbXMgPSB0aGlzLl9nZXRJdGVtc0FycmF5KCk7XG5cbiAgICBpZiAoIWl0ZW1zW2luZGV4XSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHdoaWxlICh0aGlzLl9za2lwUHJlZGljYXRlRm4oaXRlbXNbaW5kZXhdKSkge1xuICAgICAgaW5kZXggKz0gZmFsbGJhY2tEZWx0YTtcblxuICAgICAgaWYgKCFpdGVtc1tpbmRleF0pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuc2V0QWN0aXZlSXRlbShpbmRleCk7XG4gIH1cblxuICAvKiogUmV0dXJucyB0aGUgaXRlbXMgYXMgYW4gYXJyYXkuICovXG4gIHByaXZhdGUgX2dldEl0ZW1zQXJyYXkoKTogVFtdIHtcbiAgICByZXR1cm4gdGhpcy5faXRlbXMgaW5zdGFuY2VvZiBRdWVyeUxpc3QgPyB0aGlzLl9pdGVtcy50b0FycmF5KCkgOiB0aGlzLl9pdGVtcztcbiAgfVxufVxuIl19