import { Subject } from 'rxjs';
import { tap, debounceTime, filter, map } from 'rxjs/operators';
import { c as A, Z, d as ZERO, N as NINE } from './keycodes-107cd3e4.mjs';

const DEFAULT_TYPEAHEAD_DEBOUNCE_INTERVAL_MS = 200;
/**
 * Selects items based on keyboard inputs. Implements the typeahead functionality of
 * `role="listbox"` or `role="tree"` and other related roles.
 */
class Typeahead {
    _letterKeyStream = new Subject();
    _items = [];
    _selectedItemIndex = -1;
    /** Buffer for the letters that the user has pressed */
    _pressedLetters = [];
    _skipPredicateFn;
    _selectedItem = new Subject();
    selectedItem = this._selectedItem;
    constructor(initialItems, config) {
        const typeAheadInterval = typeof config?.debounceInterval === 'number'
            ? config.debounceInterval
            : DEFAULT_TYPEAHEAD_DEBOUNCE_INTERVAL_MS;
        if (config?.skipPredicate) {
            this._skipPredicateFn = config.skipPredicate;
        }
        if ((typeof ngDevMode === 'undefined' || ngDevMode) &&
            initialItems.length &&
            initialItems.some(item => typeof item.getLabel !== 'function')) {
            throw new Error('KeyManager items in typeahead mode must implement the `getLabel` method.');
        }
        this.setItems(initialItems);
        this._setupKeyHandler(typeAheadInterval);
    }
    destroy() {
        this._pressedLetters = [];
        this._letterKeyStream.complete();
        this._selectedItem.complete();
    }
    setCurrentSelectedItemIndex(index) {
        this._selectedItemIndex = index;
    }
    setItems(items) {
        this._items = items;
    }
    handleKey(event) {
        const keyCode = event.keyCode;
        // Attempt to use the `event.key` which also maps it to the user's keyboard language,
        // otherwise fall back to resolving alphanumeric characters via the keyCode.
        if (event.key && event.key.length === 1) {
            this._letterKeyStream.next(event.key.toLocaleUpperCase());
        }
        else if ((keyCode >= A && keyCode <= Z) || (keyCode >= ZERO && keyCode <= NINE)) {
            this._letterKeyStream.next(String.fromCharCode(keyCode));
        }
    }
    /** Gets whether the user is currently typing into the manager using the typeahead feature. */
    isTyping() {
        return this._pressedLetters.length > 0;
    }
    /** Resets the currently stored sequence of typed letters. */
    reset() {
        this._pressedLetters = [];
    }
    _setupKeyHandler(typeAheadInterval) {
        // Debounce the presses of non-navigational keys, collect the ones that correspond to letters
        // and convert those letters back into a string. Afterwards find the first item that starts
        // with that string and select it.
        this._letterKeyStream
            .pipe(tap(letter => this._pressedLetters.push(letter)), debounceTime(typeAheadInterval), filter(() => this._pressedLetters.length > 0), map(() => this._pressedLetters.join('').toLocaleUpperCase()))
            .subscribe(inputString => {
            // Start at 1 because we want to start searching at the item immediately
            // following the current active item.
            for (let i = 1; i < this._items.length + 1; i++) {
                const index = (this._selectedItemIndex + i) % this._items.length;
                const item = this._items[index];
                if (!this._skipPredicateFn?.(item) &&
                    item.getLabel?.().toLocaleUpperCase().trim().indexOf(inputString) === 0) {
                    this._selectedItem.next(item);
                    break;
                }
            }
            this._pressedLetters = [];
        });
    }
}

export { Typeahead as T };
//# sourceMappingURL=typeahead-11ae39bd.mjs.map
