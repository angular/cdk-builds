/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { QueryList } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW, TAB, A, Z, ZERO, NINE, hasModifierKey, HOME, END, } from '@angular/cdk/keycodes';
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
                    if (newIndex !== this._activeItemIndex) {
                        // Timeout is required to avoid "changed after checked" errors.
                        setTimeout(() => {
                            this.updateActiveItem(newIndex > -1 ? newIndex : this._activeItemIndex);
                        }, 0);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC1rZXktbWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvYTExeS9rZXktbWFuYWdlci9saXN0LWtleS1tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDeEMsT0FBTyxFQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDM0MsT0FBTyxFQUNMLFFBQVEsRUFDUixVQUFVLEVBQ1YsVUFBVSxFQUNWLFdBQVcsRUFDWCxHQUFHLEVBQ0gsQ0FBQyxFQUNELENBQUMsRUFDRCxJQUFJLEVBQ0osSUFBSSxFQUNKLGNBQWMsRUFDZCxJQUFJLEVBQ0osR0FBRyxHQUNKLE1BQU0sdUJBQXVCLENBQUM7QUFDL0IsT0FBTyxFQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBYzlEOzs7R0FHRztBQUNILE1BQU0sT0FBTyxjQUFjO0lBb0J6QixZQUFvQixNQUEwQjtRQUExQixXQUFNLEdBQU4sTUFBTSxDQUFvQjtRQW5CdEMscUJBQWdCLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDdEIsZ0JBQVcsR0FBYSxJQUFJLENBQUM7UUFDN0IsVUFBSyxHQUFHLEtBQUssQ0FBQztRQUNMLHFCQUFnQixHQUFHLElBQUksT0FBTyxFQUFVLENBQUM7UUFDbEQsMkJBQXNCLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQztRQUM1QyxjQUFTLEdBQUcsSUFBSSxDQUFDO1FBRWpCLHlCQUFvQixHQUFnQyxFQUFFLENBQUM7UUFDdkQsZ0JBQVcsR0FBRyxLQUFLLENBQUM7UUFFNUI7OztXQUdHO1FBQ0sscUJBQWdCLEdBQUcsQ0FBQyxJQUFPLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7UUFFdEQsMkZB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aWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1F1ZXJ5TGlzdH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1N1YmplY3QsIFN1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge1xuICBVUF9BUlJPVyxcbiAgRE9XTl9BUlJPVyxcbiAgTEVGVF9BUlJPVyxcbiAgUklHSFRfQVJST1csXG4gIFRBQixcbiAgQSxcbiAgWixcbiAgWkVSTyxcbiAgTklORSxcbiAgaGFzTW9kaWZpZXJLZXksXG4gIEhPTUUsXG4gIEVORCxcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2tleWNvZGVzJztcbmltcG9ydCB7ZGVib3VuY2VUaW1lLCBmaWx0ZXIsIG1hcCwgdGFwfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbi8qKiBUaGlzIGludGVyZmFjZSBpcyBmb3IgaXRlbXMgdGhhdCBjYW4gYmUgcGFzc2VkIHRvIGEgTGlzdEtleU1hbmFnZXIuICovXG5leHBvcnQgaW50ZXJmYWNlIExpc3RLZXlNYW5hZ2VyT3B0aW9uIHtcbiAgLyoqIFdoZXRoZXIgdGhlIG9wdGlvbiBpcyBkaXNhYmxlZC4gKi9cbiAgZGlzYWJsZWQ/OiBib29sZWFuO1xuXG4gIC8qKiBHZXRzIHRoZSBsYWJlbCBmb3IgdGhpcyBvcHRpb24uICovXG4gIGdldExhYmVsPygpOiBzdHJpbmc7XG59XG5cbi8qKiBNb2RpZmllciBrZXlzIGhhbmRsZWQgYnkgdGhlIExpc3RLZXlNYW5hZ2VyLiAqL1xuZXhwb3J0IHR5cGUgTGlzdEtleU1hbmFnZXJNb2RpZmllcktleSA9ICdhbHRLZXknIHwgJ2N0cmxLZXknIHwgJ21ldGFLZXknIHwgJ3NoaWZ0S2V5JztcblxuLyoqXG4gKiBUaGlzIGNsYXNzIG1hbmFnZXMga2V5Ym9hcmQgZXZlbnRzIGZvciBzZWxlY3RhYmxlIGxpc3RzLiBJZiB5b3UgcGFzcyBpdCBhIHF1ZXJ5IGxpc3RcbiAqIG9mIGl0ZW1zLCBpdCB3aWxsIHNldCB0aGUgYWN0aXZlIGl0ZW0gY29ycmVjdGx5IHdoZW4gYXJyb3cgZXZlbnRzIG9jY3VyLlxuICovXG5leHBvcnQgY2xhc3MgTGlzdEtleU1hbmFnZXI8VCBleHRlbmRzIExpc3RLZXlNYW5hZ2VyT3B0aW9uPiB7XG4gIHByaXZhdGUgX2FjdGl2ZUl0ZW1JbmRleCA9IC0xO1xuICBwcml2YXRlIF9hY3RpdmVJdGVtOiBUIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX3dyYXAgPSBmYWxzZTtcbiAgcHJpdmF0ZSByZWFkb25seSBfbGV0dGVyS2V5U3RyZWFtID0gbmV3IFN1YmplY3Q8c3RyaW5nPigpO1xuICBwcml2YXRlIF90eXBlYWhlYWRTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG4gIHByaXZhdGUgX3ZlcnRpY2FsID0gdHJ1ZTtcbiAgcHJpdmF0ZSBfaG9yaXpvbnRhbDogJ2x0cicgfCAncnRsJyB8IG51bGw7XG4gIHByaXZhdGUgX2FsbG93ZWRNb2RpZmllcktleXM6IExpc3RLZXlNYW5hZ2VyTW9kaWZpZXJLZXlbXSA9IFtdO1xuICBwcml2YXRlIF9ob21lQW5kRW5kID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIFByZWRpY2F0ZSBmdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHRvIGNoZWNrIHdoZXRoZXIgYW4gaXRlbSBzaG91bGQgYmUgc2tpcHBlZFxuICAgKiBieSB0aGUga2V5IG1hbmFnZXIuIEJ5IGRlZmF1bHQsIGRpc2FibGVkIGl0ZW1zIGFyZSBza2lwcGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfc2tpcFByZWRpY2F0ZUZuID0gKGl0ZW06IFQpID0+IGl0ZW0uZGlzYWJsZWQ7XG5cbiAgLy8gQnVmZmVyIGZvciB0aGUgbGV0dGVycyB0aGF0IHRoZSB1c2VyIGhhcyBwcmVzc2VkIHdoZW4gdGhlIHR5cGVhaGVhZCBvcHRpb24gaXMgdHVybmVkIG9uLlxuICBwcml2YXRlIF9wcmVzc2VkTGV0dGVyczogc3RyaW5nW10gPSBbXTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9pdGVtczogUXVlcnlMaXN0PFQ+IHwgVFtdKSB7XG4gICAgLy8gV2UgYWxsb3cgZm9yIHRoZSBpdGVtcyB0byBiZSBhbiBhcnJheSBiZWNhdXNlLCBpbiBzb21lIGNhc2VzLCB0aGUgY29uc3VtZXIgbWF5XG4gICAgLy8gbm90IGhhdmUgYWNjZXNzIHRvIGEgUXVlcnlMaXN0IG9mIHRoZSBpdGVtcyB0aGV5IHdhbnQgdG8gbWFuYWdlIChlLmcuIHdoZW4gdGhlXG4gICAgLy8gaXRlbXMgYXJlbid0IGJlaW5nIGNvbGxlY3RlZCB2aWEgYFZpZXdDaGlsZHJlbmAgb3IgYENvbnRlbnRDaGlsZHJlbmApLlxuICAgIGlmIChfaXRlbXMgaW5zdGFuY2VvZiBRdWVyeUxpc3QpIHtcbiAgICAgIF9pdGVtcy5jaGFuZ2VzLnN1YnNjcmliZSgobmV3SXRlbXM6IFF1ZXJ5TGlzdDxUPikgPT4ge1xuICAgICAgICBpZiAodGhpcy5fYWN0aXZlSXRlbSkge1xuICAgICAgICAgIGNvbnN0IGl0ZW1BcnJheSA9IG5ld0l0ZW1zLnRvQXJyYXkoKTtcbiAgICAgICAgICBjb25zdCBuZXdJbmRleCA9IGl0ZW1BcnJheS5pbmRleE9mKHRoaXMuX2FjdGl2ZUl0ZW0pO1xuXG4gICAgICAgICAgaWYgKG5ld0luZGV4ICE9PSB0aGlzLl9hY3RpdmVJdGVtSW5kZXgpIHtcbiAgICAgICAgICAgIC8vIFRpbWVvdXQgaXMgcmVxdWlyZWQgdG8gYXZvaWQgXCJjaGFuZ2VkIGFmdGVyIGNoZWNrZWRcIiBlcnJvcnMuXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVBY3RpdmVJdGVtKG5ld0luZGV4ID4gLTEgPyBuZXdJbmRleCA6IHRoaXMuX2FjdGl2ZUl0ZW1JbmRleCk7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTdHJlYW0gdGhhdCBlbWl0cyBhbnkgdGltZSB0aGUgVEFCIGtleSBpcyBwcmVzc2VkLCBzbyBjb21wb25lbnRzIGNhbiByZWFjdFxuICAgKiB3aGVuIGZvY3VzIGlzIHNoaWZ0ZWQgb2ZmIG9mIHRoZSBsaXN0LlxuICAgKi9cbiAgcmVhZG9ubHkgdGFiT3V0ID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogU3RyZWFtIHRoYXQgZW1pdHMgd2hlbmV2ZXIgdGhlIGFjdGl2ZSBpdGVtIG9mIHRoZSBsaXN0IG1hbmFnZXIgY2hhbmdlcy4gKi9cbiAgcmVhZG9ubHkgY2hhbmdlID0gbmV3IFN1YmplY3Q8bnVtYmVyPigpO1xuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBwcmVkaWNhdGUgZnVuY3Rpb24gdGhhdCBkZXRlcm1pbmVzIHdoaWNoIGl0ZW1zIHNob3VsZCBiZSBza2lwcGVkIGJ5IHRoZVxuICAgKiBsaXN0IGtleSBtYW5hZ2VyLlxuICAgKiBAcGFyYW0gcHJlZGljYXRlIEZ1bmN0aW9uIHRoYXQgZGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBnaXZlbiBpdGVtIHNob3VsZCBiZSBza2lwcGVkLlxuICAgKi9cbiAgc2tpcFByZWRpY2F0ZShwcmVkaWNhdGU6IChpdGVtOiBUKSA9PiBib29sZWFuKTogdGhpcyB7XG4gICAgdGhpcy5fc2tpcFByZWRpY2F0ZUZuID0gcHJlZGljYXRlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZXMgd3JhcHBpbmcgbW9kZSwgd2hpY2ggZGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBhY3RpdmUgaXRlbSB3aWxsIHdyYXAgdG9cbiAgICogdGhlIG90aGVyIGVuZCBvZiBsaXN0IHdoZW4gdGhlcmUgYXJlIG5vIG1vcmUgaXRlbXMgaW4gdGhlIGdpdmVuIGRpcmVjdGlvbi5cbiAgICogQHBhcmFtIHNob3VsZFdyYXAgV2hldGhlciB0aGUgbGlzdCBzaG91bGQgd3JhcCB3aGVuIHJlYWNoaW5nIHRoZSBlbmQuXG4gICAqL1xuICB3aXRoV3JhcChzaG91bGRXcmFwID0gdHJ1ZSk6IHRoaXMge1xuICAgIHRoaXMuX3dyYXAgPSBzaG91bGRXcmFwO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZXMgd2hldGhlciB0aGUga2V5IG1hbmFnZXIgc2hvdWxkIGJlIGFibGUgdG8gbW92ZSB0aGUgc2VsZWN0aW9uIHZlcnRpY2FsbHkuXG4gICAqIEBwYXJhbSBlbmFibGVkIFdoZXRoZXIgdmVydGljYWwgc2VsZWN0aW9uIHNob3VsZCBiZSBlbmFibGVkLlxuICAgKi9cbiAgd2l0aFZlcnRpY2FsT3JpZW50YXRpb24oZW5hYmxlZDogYm9vbGVhbiA9IHRydWUpOiB0aGlzIHtcbiAgICB0aGlzLl92ZXJ0aWNhbCA9IGVuYWJsZWQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ29uZmlndXJlcyB0aGUga2V5IG1hbmFnZXIgdG8gbW92ZSB0aGUgc2VsZWN0aW9uIGhvcml6b250YWxseS5cbiAgICogUGFzc2luZyBpbiBgbnVsbGAgd2lsbCBkaXNhYmxlIGhvcml6b250YWwgbW92ZW1lbnQuXG4gICAqIEBwYXJhbSBkaXJlY3Rpb24gRGlyZWN0aW9uIGluIHdoaWNoIHRoZSBzZWxlY3Rpb24gY2FuIGJlIG1vdmVkLlxuICAgKi9cbiAgd2l0aEhvcml6b250YWxPcmllbnRhdGlvbihkaXJlY3Rpb246ICdsdHInIHwgJ3J0bCcgfCBudWxsKTogdGhpcyB7XG4gICAgdGhpcy5faG9yaXpvbnRhbCA9IGRpcmVjdGlvbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBNb2RpZmllciBrZXlzIHdoaWNoIGFyZSBhbGxvd2VkIHRvIGJlIGhlbGQgZG93biBhbmQgd2hvc2UgZGVmYXVsdCBhY3Rpb25zIHdpbGwgYmUgcHJldmVudGVkXG4gICAqIGFzIHRoZSB1c2VyIGlzIHByZXNzaW5nIHRoZSBhcnJvdyBrZXlzLiBEZWZhdWx0cyB0byBub3QgYWxsb3dpbmcgYW55IG1vZGlmaWVyIGtleXMuXG4gICAqL1xuICB3aXRoQWxsb3dlZE1vZGlmaWVyS2V5cyhrZXlzOiBMaXN0S2V5TWFuYWdlck1vZGlmaWVyS2V5W10pOiB0aGlzIHtcbiAgICB0aGlzLl9hbGxvd2VkTW9kaWZpZXJLZXlzID0ga2V5cztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUdXJucyBvbiB0eXBlYWhlYWQgbW9kZSB3aGljaCBhbGxvd3MgdXNlcnMgdG8gc2V0IHRoZSBhY3RpdmUgaXRlbSBieSB0eXBpbmcuXG4gICAqIEBwYXJhbSBkZWJvdW5jZUludGVydmFsIFRpbWUgdG8gd2FpdCBhZnRlciB0aGUgbGFzdCBrZXlzdHJva2UgYmVmb3JlIHNldHRpbmcgdGhlIGFjdGl2ZSBpdGVtLlxuICAgKi9cbiAgd2l0aFR5cGVBaGVhZChkZWJvdW5jZUludGVydmFsOiBudW1iZXIgPSAyMDApOiB0aGlzIHtcbiAgICBpZiAoXG4gICAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJlxuICAgICAgdGhpcy5faXRlbXMubGVuZ3RoICYmXG4gICAgICB0aGlzLl9pdGVtcy5zb21lKGl0ZW0gPT4gdHlwZW9mIGl0ZW0uZ2V0TGFiZWwgIT09ICdmdW5jdGlvbicpXG4gICAgKSB7XG4gICAgICB0aHJvdyBFcnJvcignTGlzdEtleU1hbmFnZXIgaXRlbXMgaW4gdHlwZWFoZWFkIG1vZGUgbXVzdCBpbXBsZW1lbnQgdGhlIGBnZXRMYWJlbGAgbWV0aG9kLicpO1xuICAgIH1cblxuICAgIHRoaXMuX3R5cGVhaGVhZFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuXG4gICAgLy8gRGVib3VuY2UgdGhlIHByZXNzZXMgb2Ygbm9uLW5hdmlnYXRpb25hbCBrZXlzLCBjb2xsZWN0IHRoZSBvbmVzIHRoYXQgY29ycmVzcG9uZCB0byBsZXR0ZXJzXG4gICAgLy8gYW5kIGNvbnZlcnQgdGhvc2UgbGV0dGVycyBiYWNrIGludG8gYSBzdHJpbmcuIEFmdGVyd2FyZHMgZmluZCB0aGUgZmlyc3QgaXRlbSB0aGF0IHN0YXJ0c1xuICAgIC8vIHdpdGggdGhhdCBzdHJpbmcgYW5kIHNlbGVjdCBpdC5cbiAgICB0aGlzLl90eXBlYWhlYWRTdWJzY3JpcHRpb24gPSB0aGlzLl9sZXR0ZXJLZXlTdHJlYW1cbiAgICAgIC5waXBlKFxuICAgICAgICB0YXAobGV0dGVyID0+IHRoaXMuX3ByZXNzZWRMZXR0ZXJzLnB1c2gobGV0dGVyKSksXG4gICAgICAgIGRlYm91bmNlVGltZShkZWJvdW5jZUludGVydmFsKSxcbiAgICAgICAgZmlsdGVyKCgpID0+IHRoaXMuX3ByZXNzZWRMZXR0ZXJzLmxlbmd0aCA+IDApLFxuICAgICAgICBtYXAoKCkgPT4gdGhpcy5fcHJlc3NlZExldHRlcnMuam9pbignJykpLFxuICAgICAgKVxuICAgICAgLnN1YnNjcmliZShpbnB1dFN0cmluZyA9PiB7XG4gICAgICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5fZ2V0SXRlbXNBcnJheSgpO1xuXG4gICAgICAgIC8vIFN0YXJ0IGF0IDEgYmVjYXVzZSB3ZSB3YW50IHRvIHN0YXJ0IHNlYXJjaGluZyBhdCB0aGUgaXRlbSBpbW1lZGlhdGVseVxuICAgICAgICAvLyBmb2xsb3dpbmcgdGhlIGN1cnJlbnQgYWN0aXZlIGl0ZW0uXG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgaXRlbXMubGVuZ3RoICsgMTsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgaW5kZXggPSAodGhpcy5fYWN0aXZlSXRlbUluZGV4ICsgaSkgJSBpdGVtcy5sZW5ndGg7XG4gICAgICAgICAgY29uc3QgaXRlbSA9IGl0ZW1zW2luZGV4XTtcblxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICF0aGlzLl9za2lwUHJlZGljYXRlRm4oaXRlbSkgJiZcbiAgICAgICAgICAgIGl0ZW0uZ2V0TGFiZWwhKCkudG9VcHBlckNhc2UoKS50cmltKCkuaW5kZXhPZihpbnB1dFN0cmluZykgPT09IDBcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHRoaXMuc2V0QWN0aXZlSXRlbShpbmRleCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9wcmVzc2VkTGV0dGVycyA9IFtdO1xuICAgICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25maWd1cmVzIHRoZSBrZXkgbWFuYWdlciB0byBhY3RpdmF0ZSB0aGUgZmlyc3QgYW5kIGxhc3QgaXRlbXNcbiAgICogcmVzcGVjdGl2ZWx5IHdoZW4gdGhlIEhvbWUgb3IgRW5kIGtleSBpcyBwcmVzc2VkLlxuICAgKiBAcGFyYW0gZW5hYmxlZCBXaGV0aGVyIHByZXNzaW5nIHRoZSBIb21lIG9yIEVuZCBrZXkgYWN0aXZhdGVzIHRoZSBmaXJzdC9sYXN0IGl0ZW0uXG4gICAqL1xuICB3aXRoSG9tZUFuZEVuZChlbmFibGVkOiBib29sZWFuID0gdHJ1ZSk6IHRoaXMge1xuICAgIHRoaXMuX2hvbWVBbmRFbmQgPSBlbmFibGVkO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGFjdGl2ZSBpdGVtIHRvIHRoZSBpdGVtIGF0IHRoZSBpbmRleCBzcGVjaWZpZWQuXG4gICAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGl0ZW0gdG8gYmUgc2V0IGFzIGFjdGl2ZS5cbiAgICovXG4gIHNldEFjdGl2ZUl0ZW0oaW5kZXg6IG51bWJlcik6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGFjdGl2ZSBpdGVtIHRvIHRoZSBzcGVjaWZpZWQgaXRlbS5cbiAgICogQHBhcmFtIGl0ZW0gVGhlIGl0ZW0gdG8gYmUgc2V0IGFzIGFjdGl2ZS5cbiAgICovXG4gIHNldEFjdGl2ZUl0ZW0oaXRlbTogVCk6IHZvaWQ7XG5cbiAgc2V0QWN0aXZlSXRlbShpdGVtOiBhbnkpOiB2b2lkIHtcbiAgICBjb25zdCBwcmV2aW91c0FjdGl2ZUl0ZW0gPSB0aGlzLl9hY3RpdmVJdGVtO1xuXG4gICAgdGhpcy51cGRhdGVBY3RpdmVJdGVtKGl0ZW0pO1xuXG4gICAgaWYgKHRoaXMuX2FjdGl2ZUl0ZW0gIT09IHByZXZpb3VzQWN0aXZlSXRlbSkge1xuICAgICAgdGhpcy5jaGFuZ2UubmV4dCh0aGlzLl9hY3RpdmVJdGVtSW5kZXgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBhY3RpdmUgaXRlbSBkZXBlbmRpbmcgb24gdGhlIGtleSBldmVudCBwYXNzZWQgaW4uXG4gICAqIEBwYXJhbSBldmVudCBLZXlib2FyZCBldmVudCB0byBiZSB1c2VkIGZvciBkZXRlcm1pbmluZyB3aGljaCBlbGVtZW50IHNob3VsZCBiZSBhY3RpdmUuXG4gICAqL1xuICBvbktleWRvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiB2b2lkIHtcbiAgICBjb25zdCBrZXlDb2RlID0gZXZlbnQua2V5Q29kZTtcbiAgICBjb25zdCBtb2RpZmllcnM6IExpc3RLZXlNYW5hZ2VyTW9kaWZpZXJLZXlbXSA9IFsnYWx0S2V5JywgJ2N0cmxLZXknLCAnbWV0YUtleScsICdzaGlmdEtleSddO1xuICAgIGNvbnN0IGlzTW9kaWZpZXJBbGxvd2VkID0gbW9kaWZpZXJzLmV2ZXJ5KG1vZGlmaWVyID0+IHtcbiAgICAgIHJldHVybiAhZXZlbnRbbW9kaWZpZXJdIHx8IHRoaXMuX2FsbG93ZWRNb2RpZmllcktleXMuaW5kZXhPZihtb2RpZmllcikgPiAtMTtcbiAgICB9KTtcblxuICAgIHN3aXRjaCAoa2V5Q29kZSkge1xuICAgICAgY2FzZSBUQUI6XG4gICAgICAgIHRoaXMudGFiT3V0Lm5leHQoKTtcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgICBjYXNlIERPV05fQVJST1c6XG4gICAgICAgIGlmICh0aGlzLl92ZXJ0aWNhbCAmJiBpc01vZGlmaWVyQWxsb3dlZCkge1xuICAgICAgICAgIHRoaXMuc2V0TmV4dEl0ZW1BY3RpdmUoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgY2FzZSBVUF9BUlJPVzpcbiAgICAgICAgaWYgKHRoaXMuX3ZlcnRpY2FsICYmIGlzTW9kaWZpZXJBbGxvd2VkKSB7XG4gICAgICAgICAgdGhpcy5zZXRQcmV2aW91c0l0ZW1BY3RpdmUoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgY2FzZSBSSUdIVF9BUlJPVzpcbiAgICAgICAgaWYgKHRoaXMuX2hvcml6b250YWwgJiYgaXNNb2RpZmllckFsbG93ZWQpIHtcbiAgICAgICAgICB0aGlzLl9ob3Jpem9udGFsID09PSAncnRsJyA/IHRoaXMuc2V0UHJldmlvdXNJdGVtQWN0aXZlKCkgOiB0aGlzLnNldE5leHRJdGVtQWN0aXZlKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgIGNhc2UgTEVGVF9BUlJPVzpcbiAgICAgICAgaWYgKHRoaXMuX2hvcml6b250YWwgJiYgaXNNb2RpZmllckFsbG93ZWQpIHtcbiAgICAgICAgICB0aGlzLl9ob3Jpem9udGFsID09PSAncnRsJyA/IHRoaXMuc2V0TmV4dEl0ZW1BY3RpdmUoKSA6IHRoaXMuc2V0UHJldmlvdXNJdGVtQWN0aXZlKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgIGNhc2UgSE9NRTpcbiAgICAgICAgaWYgKHRoaXMuX2hvbWVBbmRFbmQgJiYgaXNNb2RpZmllckFsbG93ZWQpIHtcbiAgICAgICAgICB0aGlzLnNldEZpcnN0SXRlbUFjdGl2ZSgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICBjYXNlIEVORDpcbiAgICAgICAgaWYgKHRoaXMuX2hvbWVBbmRFbmQgJiYgaXNNb2RpZmllckFsbG93ZWQpIHtcbiAgICAgICAgICB0aGlzLnNldExhc3RJdGVtQWN0aXZlKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChpc01vZGlmaWVyQWxsb3dlZCB8fCBoYXNNb2RpZmllcktleShldmVudCwgJ3NoaWZ0S2V5JykpIHtcbiAgICAgICAgICAvLyBBdHRlbXB0IHRvIHVzZSB0aGUgYGV2ZW50LmtleWAgd2hpY2ggYWxzbyBtYXBzIGl0IHRvIHRoZSB1c2VyJ3Mga2V5Ym9hcmQgbGFuZ3VhZ2UsXG4gICAgICAgICAgLy8gb3RoZXJ3aXNlIGZhbGwgYmFjayB0byByZXNvbHZpbmcgYWxwaGFudW1lcmljIGNoYXJhY3RlcnMgdmlhIHRoZSBrZXlDb2RlLlxuICAgICAgICAgIGlmIChldmVudC5rZXkgJiYgZXZlbnQua2V5Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgdGhpcy5fbGV0dGVyS2V5U3RyZWFtLm5leHQoZXZlbnQua2V5LnRvTG9jYWxlVXBwZXJDYXNlKCkpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoKGtleUNvZGUgPj0gQSAmJiBrZXlDb2RlIDw9IFopIHx8IChrZXlDb2RlID49IFpFUk8gJiYga2V5Q29kZSA8PSBOSU5FKSkge1xuICAgICAgICAgICAgdGhpcy5fbGV0dGVyS2V5U3RyZWFtLm5leHQoU3RyaW5nLmZyb21DaGFyQ29kZShrZXlDb2RlKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gTm90ZSB0aGF0IHdlIHJldHVybiBoZXJlLCBpbiBvcmRlciB0byBhdm9pZCBwcmV2ZW50aW5nXG4gICAgICAgIC8vIHRoZSBkZWZhdWx0IGFjdGlvbiBvZiBub24tbmF2aWdhdGlvbmFsIGtleXMuXG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9wcmVzc2VkTGV0dGVycyA9IFtdO1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gIH1cblxuICAvKiogSW5kZXggb2YgdGhlIGN1cnJlbnRseSBhY3RpdmUgaXRlbS4gKi9cbiAgZ2V0IGFjdGl2ZUl0ZW1JbmRleCgpOiBudW1iZXIgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fYWN0aXZlSXRlbUluZGV4O1xuICB9XG5cbiAgLyoqIFRoZSBhY3RpdmUgaXRlbS4gKi9cbiAgZ2V0IGFjdGl2ZUl0ZW0oKTogVCB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLl9hY3RpdmVJdGVtO1xuICB9XG5cbiAgLyoqIEdldHMgd2hldGhlciB0aGUgdXNlciBpcyBjdXJyZW50bHkgdHlwaW5nIGludG8gdGhlIG1hbmFnZXIgdXNpbmcgdGhlIHR5cGVhaGVhZCBmZWF0dXJlLiAqL1xuICBpc1R5cGluZygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fcHJlc3NlZExldHRlcnMubGVuZ3RoID4gMDtcbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBhY3RpdmUgaXRlbSB0byB0aGUgZmlyc3QgZW5hYmxlZCBpdGVtIGluIHRoZSBsaXN0LiAqL1xuICBzZXRGaXJzdEl0ZW1BY3RpdmUoKTogdm9pZCB7XG4gICAgdGhpcy5fc2V0QWN0aXZlSXRlbUJ5SW5kZXgoMCwgMSk7XG4gIH1cblxuICAvKiogU2V0cyB0aGUgYWN0aXZlIGl0ZW0gdG8gdGhlIGxhc3QgZW5hYmxlZCBpdGVtIGluIHRoZSBsaXN0LiAqL1xuICBzZXRMYXN0SXRlbUFjdGl2ZSgpOiB2b2lkIHtcbiAgICB0aGlzLl9zZXRBY3RpdmVJdGVtQnlJbmRleCh0aGlzLl9pdGVtcy5sZW5ndGggLSAxLCAtMSk7XG4gIH1cblxuICAvKiogU2V0cyB0aGUgYWN0aXZlIGl0ZW0gdG8gdGhlIG5leHQgZW5hYmxlZCBpdGVtIGluIHRoZSBsaXN0LiAqL1xuICBzZXROZXh0SXRlbUFjdGl2ZSgpOiB2b2lkIHtcbiAgICB0aGlzLl9hY3RpdmVJdGVtSW5kZXggPCAwID8gdGhpcy5zZXRGaXJzdEl0ZW1BY3RpdmUoKSA6IHRoaXMuX3NldEFjdGl2ZUl0ZW1CeURlbHRhKDEpO1xuICB9XG5cbiAgLyoqIFNldHMgdGhlIGFjdGl2ZSBpdGVtIHRvIGEgcHJldmlvdXMgZW5hYmxlZCBpdGVtIGluIHRoZSBsaXN0LiAqL1xuICBzZXRQcmV2aW91c0l0ZW1BY3RpdmUoKTogdm9pZCB7XG4gICAgdGhpcy5fYWN0aXZlSXRlbUluZGV4IDwgMCAmJiB0aGlzLl93cmFwXG4gICAgICA/IHRoaXMuc2V0TGFzdEl0ZW1BY3RpdmUoKVxuICAgICAgOiB0aGlzLl9zZXRBY3RpdmVJdGVtQnlEZWx0YSgtMSk7XG4gIH1cblxuICAvKipcbiAgICogQWxsb3dzIHNldHRpbmcgdGhlIGFjdGl2ZSB3aXRob3V0IGFueSBvdGhlciBlZmZlY3RzLlxuICAgKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGl0ZW0gdG8gYmUgc2V0IGFzIGFjdGl2ZS5cbiAgICovXG4gIHVwZGF0ZUFjdGl2ZUl0ZW0oaW5kZXg6IG51bWJlcik6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEFsbG93cyBzZXR0aW5nIHRoZSBhY3RpdmUgaXRlbSB3aXRob3V0IGFueSBvdGhlciBlZmZlY3RzLlxuICAgKiBAcGFyYW0gaXRlbSBJdGVtIHRvIGJlIHNldCBhcyBhY3RpdmUuXG4gICAqL1xuICB1cGRhdGVBY3RpdmVJdGVtKGl0ZW06IFQpOiB2b2lkO1xuXG4gIHVwZGF0ZUFjdGl2ZUl0ZW0oaXRlbTogYW55KTogdm9pZCB7XG4gICAgY29uc3QgaXRlbUFycmF5ID0gdGhpcy5fZ2V0SXRlbXNBcnJheSgpO1xuICAgIGNvbnN0IGluZGV4ID0gdHlwZW9mIGl0ZW0gPT09ICdudW1iZXInID8gaXRlbSA6IGl0ZW1BcnJheS5pbmRleE9mKGl0ZW0pO1xuICAgIGNvbnN0IGFjdGl2ZUl0ZW0gPSBpdGVtQXJyYXlbaW5kZXhdO1xuXG4gICAgLy8gRXhwbGljaXRseSBjaGVjayBmb3IgYG51bGxgIGFuZCBgdW5kZWZpbmVkYCBiZWNhdXNlIG90aGVyIGZhbHN5IHZhbHVlcyBhcmUgdmFsaWQuXG4gICAgdGhpcy5fYWN0aXZlSXRlbSA9IGFjdGl2ZUl0ZW0gPT0gbnVsbCA/IG51bGwgOiBhY3RpdmVJdGVtO1xuICAgIHRoaXMuX2FjdGl2ZUl0ZW1JbmRleCA9IGluZGV4O1xuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIHNldHMgdGhlIGFjdGl2ZSBpdGVtLCBnaXZlbiBhIGxpc3Qgb2YgaXRlbXMgYW5kIHRoZSBkZWx0YSBiZXR3ZWVuIHRoZVxuICAgKiBjdXJyZW50bHkgYWN0aXZlIGl0ZW0gYW5kIHRoZSBuZXcgYWN0aXZlIGl0ZW0uIEl0IHdpbGwgY2FsY3VsYXRlIGRpZmZlcmVudGx5XG4gICAqIGRlcGVuZGluZyBvbiB3aGV0aGVyIHdyYXAgbW9kZSBpcyB0dXJuZWQgb24uXG4gICAqL1xuICBwcml2YXRlIF9zZXRBY3RpdmVJdGVtQnlEZWx0YShkZWx0YTogLTEgfCAxKTogdm9pZCB7XG4gICAgdGhpcy5fd3JhcCA/IHRoaXMuX3NldEFjdGl2ZUluV3JhcE1vZGUoZGVsdGEpIDogdGhpcy5fc2V0QWN0aXZlSW5EZWZhdWx0TW9kZShkZWx0YSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgYWN0aXZlIGl0ZW0gcHJvcGVybHkgZ2l2ZW4gXCJ3cmFwXCIgbW9kZS4gSW4gb3RoZXIgd29yZHMsIGl0IHdpbGwgY29udGludWUgdG8gbW92ZVxuICAgKiBkb3duIHRoZSBsaXN0IHVudGlsIGl0IGZpbmRzIGFuIGl0ZW0gdGhhdCBpcyBub3QgZGlzYWJsZWQsIGFuZCBpdCB3aWxsIHdyYXAgaWYgaXRcbiAgICogZW5jb3VudGVycyBlaXRoZXIgZW5kIG9mIHRoZSBsaXN0LlxuICAgKi9cbiAgcHJpdmF0ZSBfc2V0QWN0aXZlSW5XcmFwTW9kZShkZWx0YTogLTEgfCAxKTogdm9pZCB7XG4gICAgY29uc3QgaXRlbXMgPSB0aGlzLl9nZXRJdGVtc0FycmF5KCk7XG5cbiAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBpdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgaW5kZXggPSAodGhpcy5fYWN0aXZlSXRlbUluZGV4ICsgZGVsdGEgKiBpICsgaXRlbXMubGVuZ3RoKSAlIGl0ZW1zLmxlbmd0aDtcbiAgICAgIGNvbnN0IGl0ZW0gPSBpdGVtc1tpbmRleF07XG5cbiAgICAgIGlmICghdGhpcy5fc2tpcFByZWRpY2F0ZUZuKGl0ZW0pKSB7XG4gICAgICAgIHRoaXMuc2V0QWN0aXZlSXRlbShpbmRleCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgYWN0aXZlIGl0ZW0gcHJvcGVybHkgZ2l2ZW4gdGhlIGRlZmF1bHQgbW9kZS4gSW4gb3RoZXIgd29yZHMsIGl0IHdpbGxcbiAgICogY29udGludWUgdG8gbW92ZSBkb3duIHRoZSBsaXN0IHVudGlsIGl0IGZpbmRzIGFuIGl0ZW0gdGhhdCBpcyBub3QgZGlzYWJsZWQuIElmXG4gICAqIGl0IGVuY291bnRlcnMgZWl0aGVyIGVuZCBvZiB0aGUgbGlzdCwgaXQgd2lsbCBzdG9wIGFuZCBub3Qgd3JhcC5cbiAgICovXG4gIHByaXZhdGUgX3NldEFjdGl2ZUluRGVmYXVsdE1vZGUoZGVsdGE6IC0xIHwgMSk6IHZvaWQge1xuICAgIHRoaXMuX3NldEFjdGl2ZUl0ZW1CeUluZGV4KHRoaXMuX2FjdGl2ZUl0ZW1JbmRleCArIGRlbHRhLCBkZWx0YSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgYWN0aXZlIGl0ZW0gdG8gdGhlIGZpcnN0IGVuYWJsZWQgaXRlbSBzdGFydGluZyBhdCB0aGUgaW5kZXggc3BlY2lmaWVkLiBJZiB0aGVcbiAgICogaXRlbSBpcyBkaXNhYmxlZCwgaXQgd2lsbCBtb3ZlIGluIHRoZSBmYWxsYmFja0RlbHRhIGRpcmVjdGlvbiB1bnRpbCBpdCBlaXRoZXJcbiAgICogZmluZHMgYW4gZW5hYmxlZCBpdGVtIG9yIGVuY291bnRlcnMgdGhlIGVuZCBvZiB0aGUgbGlzdC5cbiAgICovXG4gIHByaXZhdGUgX3NldEFjdGl2ZUl0ZW1CeUluZGV4KGluZGV4OiBudW1iZXIsIGZhbGxiYWNrRGVsdGE6IC0xIHwgMSk6IHZvaWQge1xuICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5fZ2V0SXRlbXNBcnJheSgpO1xuXG4gICAgaWYgKCFpdGVtc1tpbmRleF0pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB3aGlsZSAodGhpcy5fc2tpcFByZWRpY2F0ZUZuKGl0ZW1zW2luZGV4XSkpIHtcbiAgICAgIGluZGV4ICs9IGZhbGxiYWNrRGVsdGE7XG5cbiAgICAgIGlmICghaXRlbXNbaW5kZXhdKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnNldEFjdGl2ZUl0ZW0oaW5kZXgpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIGl0ZW1zIGFzIGFuIGFycmF5LiAqL1xuICBwcml2YXRlIF9nZXRJdGVtc0FycmF5KCk6IFRbXSB7XG4gICAgcmV0dXJuIHRoaXMuX2l0ZW1zIGluc3RhbmNlb2YgUXVlcnlMaXN0ID8gdGhpcy5faXRlbXMudG9BcnJheSgpIDogdGhpcy5faXRlbXM7XG4gIH1cbn1cbiJdfQ==