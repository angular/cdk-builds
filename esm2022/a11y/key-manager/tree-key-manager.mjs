/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken, QueryList } from '@angular/core';
import { coerceObservable } from '@angular/cdk/coercion/private';
import { Subject, Subscription, isObservable, of as observableOf } from 'rxjs';
import { take } from 'rxjs/operators';
import { Typeahead } from './typeahead';
/**
 * This class manages keyboard events for trees. If you pass it a QueryList or other list of tree
 * items, it will set the active item, focus, handle expansion and typeahead correctly when
 * keyboard events occur.
 */
export class TreeKeyManager {
    _initialFocus() {
        if (this._hasInitialFocused) {
            return;
        }
        if (!this._items.length) {
            return;
        }
        let focusIndex = 0;
        for (let i = 0; i < this._items.length; i++) {
            if (!this._skipPredicateFn(this._items[i]) && !this._isItemDisabled(this._items[i])) {
                focusIndex = i;
                break;
            }
        }
        this.focusItem(focusIndex);
        this._hasInitialFocused = true;
    }
    /**
     *
     * @param items List of TreeKeyManager options. Can be synchronous or asynchronous.
     * @param config Optional configuration options. By default, use 'ltr' horizontal orientation. By
     * default, do not skip any nodes. By default, key manager only calls `focus` method when items
     * are focused and does not call `activate`. If `typeaheadDefaultInterval` is `true`, use a
     * default interval of 200ms.
     */
    constructor(items, config) {
        /** The index of the currently active (focused) item. */
        this._activeItemIndex = -1;
        /** The currently active (focused) item. */
        this._activeItem = null;
        /** Whether or not we activate the item when it's focused. */
        this._shouldActivationFollowFocus = false;
        /**
         * The orientation that the tree is laid out in. In `rtl` mode, the behavior of Left and
         * Right arrow are switched.
         */
        this._horizontalOrientation = 'ltr';
        /**
         * Predicate function that can be used to check whether an item should be skipped
         * by the key manager.
         *
         * The default value for this doesn't skip any elements in order to keep tree items focusable
         * when disabled. This aligns with ARIA guidelines:
         * https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#focusabilityofdisabledcontrols.
         */
        this._skipPredicateFn = (_item) => false;
        /** Function to determine equivalent items. */
        this._trackByFn = (item) => item;
        /** Synchronous cache of the items to manage. */
        this._items = [];
        this._typeaheadSubscription = Subscription.EMPTY;
        this._hasInitialFocused = false;
        /** Stream that emits any time the focused item changes. */
        this.change = new Subject();
        // We allow for the items to be an array or Observable because, in some cases, the consumer may
        // not have access to a QueryList of the items they want to manage (e.g. when the
        // items aren't being collected via `ViewChildren` or `ContentChildren`).
        if (items instanceof QueryList) {
            this._items = items.toArray();
            items.changes.subscribe((newItems) => {
                this._items = newItems.toArray();
                this._typeahead?.setItems(this._items);
                this._updateActiveItemIndex(this._items);
                this._initialFocus();
            });
        }
        else if (isObservable(items)) {
            items.subscribe(newItems => {
                this._items = newItems;
                this._typeahead?.setItems(newItems);
                this._updateActiveItemIndex(newItems);
                this._initialFocus();
            });
        }
        else {
            this._items = items;
            this._initialFocus();
        }
        if (typeof config.shouldActivationFollowFocus === 'boolean') {
            this._shouldActivationFollowFocus = config.shouldActivationFollowFocus;
        }
        if (config.horizontalOrientation) {
            this._horizontalOrientation = config.horizontalOrientation;
        }
        if (config.skipPredicate) {
            this._skipPredicateFn = config.skipPredicate;
        }
        if (config.trackBy) {
            this._trackByFn = config.trackBy;
        }
        if (typeof config.typeAheadDebounceInterval !== 'undefined') {
            this._setTypeAhead(config.typeAheadDebounceInterval);
        }
    }
    /** Cleans up the key manager. */
    destroy() {
        this._typeaheadSubscription.unsubscribe();
        this._typeahead?.destroy();
        this.change.complete();
    }
    /**
     * Handles a keyboard event on the tree.
     * @param event Keyboard event that represents the user interaction with the tree.
     */
    onKeydown(event) {
        const key = event.key;
        switch (key) {
            case 'Tab':
                // Return early here, in order to allow Tab to actually tab out of the tree
                return;
            case 'ArrowDown':
                this._focusNextItem();
                break;
            case 'ArrowUp':
                this._focusPreviousItem();
                break;
            case 'ArrowRight':
                this._horizontalOrientation === 'rtl'
                    ? this._collapseCurrentItem()
                    : this._expandCurrentItem();
                break;
            case 'ArrowLeft':
                this._horizontalOrientation === 'rtl'
                    ? this._expandCurrentItem()
                    : this._collapseCurrentItem();
                break;
            case 'Home':
                this._focusFirstItem();
                break;
            case 'End':
                this._focusLastItem();
                break;
            case 'Enter':
            case ' ':
                this._activateCurrentItem();
                break;
            default:
                if (event.key === '*') {
                    this._expandAllItemsAtCurrentItemLevel();
                    break;
                }
                this._typeahead?.handleKey(event);
                // Return here, in order to avoid preventing the default action of non-navigational
                // keys or resetting the buffer of pressed letters.
                return;
        }
        // Reset the typeahead since the user has used a navigational key.
        this._typeahead?.reset();
        event.preventDefault();
    }
    /** Index of the currently active item. */
    getActiveItemIndex() {
        return this._activeItemIndex;
    }
    /** The currently active item. */
    getActiveItem() {
        return this._activeItem;
    }
    /** Focus the first available item. */
    _focusFirstItem() {
        this.focusItem(this._findNextAvailableItemIndex(-1));
    }
    /** Focus the last available item. */
    _focusLastItem() {
        this.focusItem(this._findPreviousAvailableItemIndex(this._items.length));
    }
    /** Focus the next available item. */
    _focusNextItem() {
        this.focusItem(this._findNextAvailableItemIndex(this._activeItemIndex));
    }
    /** Focus the previous available item. */
    _focusPreviousItem() {
        this.focusItem(this._findPreviousAvailableItemIndex(this._activeItemIndex));
    }
    focusItem(itemOrIndex, options = {}) {
        // Set default options
        options.emitChangeEvent ??= true;
        let index = typeof itemOrIndex === 'number'
            ? itemOrIndex
            : this._items.findIndex(item => this._trackByFn(item) === this._trackByFn(itemOrIndex));
        if (index < 0 || index >= this._items.length) {
            return;
        }
        const activeItem = this._items[index];
        // If we're just setting the same item, don't re-call activate or focus
        if (this._activeItem !== null &&
            this._trackByFn(activeItem) === this._trackByFn(this._activeItem)) {
            return;
        }
        const previousActiveItem = this._activeItem;
        this._activeItem = activeItem ?? null;
        this._activeItemIndex = index;
        this._typeahead?.setCurrentSelectedItemIndex(index);
        this._activeItem?.focus();
        previousActiveItem?.unfocus();
        if (options.emitChangeEvent) {
            this.change.next(this._activeItem);
        }
        if (this._shouldActivationFollowFocus) {
            this._activateCurrentItem();
        }
    }
    _updateActiveItemIndex(newItems) {
        const activeItem = this._activeItem;
        if (!activeItem) {
            return;
        }
        const newIndex = newItems.findIndex(item => this._trackByFn(item) === this._trackByFn(activeItem));
        if (newIndex > -1 && newIndex !== this._activeItemIndex) {
            this._activeItemIndex = newIndex;
            this._typeahead?.setCurrentSelectedItemIndex(newIndex);
        }
    }
    _setTypeAhead(debounceInterval) {
        this._typeahead = new Typeahead(this._items, {
            debounceInterval: typeof debounceInterval === 'number' ? debounceInterval : undefined,
            skipPredicate: item => this._skipPredicateFn(item),
        });
        this._typeaheadSubscription = this._typeahead.selectedItem.subscribe(item => {
            this.focusItem(item);
        });
    }
    _findNextAvailableItemIndex(startingIndex) {
        for (let i = startingIndex + 1; i < this._items.length; i++) {
            if (!this._skipPredicateFn(this._items[i])) {
                return i;
            }
        }
        return startingIndex;
    }
    _findPreviousAvailableItemIndex(startingIndex) {
        for (let i = startingIndex - 1; i >= 0; i--) {
            if (!this._skipPredicateFn(this._items[i])) {
                return i;
            }
        }
        return startingIndex;
    }
    /**
     * If the item is already expanded, we collapse the item. Otherwise, we will focus the parent.
     */
    _collapseCurrentItem() {
        if (!this._activeItem) {
            return;
        }
        if (this._isCurrentItemExpanded()) {
            this._activeItem.collapse();
        }
        else {
            const parent = this._activeItem.getParent();
            if (!parent || this._skipPredicateFn(parent)) {
                return;
            }
            this.focusItem(parent);
        }
    }
    /**
     * If the item is already collapsed, we expand the item. Otherwise, we will focus the first child.
     */
    _expandCurrentItem() {
        if (!this._activeItem) {
            return;
        }
        if (!this._isCurrentItemExpanded()) {
            this._activeItem.expand();
        }
        else {
            coerceObservable(this._activeItem.getChildren())
                .pipe(take(1))
                .subscribe(children => {
                const firstChild = children.find(child => !this._skipPredicateFn(child));
                if (!firstChild) {
                    return;
                }
                this.focusItem(firstChild);
            });
        }
    }
    _isCurrentItemExpanded() {
        if (!this._activeItem) {
            return false;
        }
        return typeof this._activeItem.isExpanded === 'boolean'
            ? this._activeItem.isExpanded
            : this._activeItem.isExpanded();
    }
    _isItemDisabled(item) {
        return typeof item.isDisabled === 'boolean' ? item.isDisabled : item.isDisabled?.();
    }
    /** For all items that are the same level as the current item, we expand those items. */
    _expandAllItemsAtCurrentItemLevel() {
        if (!this._activeItem) {
            return;
        }
        const parent = this._activeItem.getParent();
        let itemsToExpand;
        if (!parent) {
            itemsToExpand = observableOf(this._items.filter(item => item.getParent() === null));
        }
        else {
            itemsToExpand = coerceObservable(parent.getChildren());
        }
        itemsToExpand.pipe(take(1)).subscribe(items => {
            for (const item of items) {
                item.expand();
            }
        });
    }
    _activateCurrentItem() {
        this._activeItem?.activate();
    }
}
/** @docs-private */
export function TREE_KEY_MANAGER_FACTORY() {
    return (items, options) => new TreeKeyManager(items, options);
}
/** Injection token that determines the key manager to use. */
export const TREE_KEY_MANAGER = new InjectionToken('tree-key-manager', {
    providedIn: 'root',
    factory: TREE_KEY_MANAGER_FACTORY,
});
/** @docs-private */
export const TREE_KEY_MANAGER_FACTORY_PROVIDER = {
    provide: TREE_KEY_MANAGER,
    useFactory: TREE_KEY_MANAGER_FACTORY,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS1rZXktbWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvYTExeS9rZXktbWFuYWdlci90cmVlLWtleS1tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQUUsU0FBUyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3hELE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLCtCQUErQixDQUFDO0FBQy9ELE9BQU8sRUFBYSxPQUFPLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSxFQUFFLElBQUksWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3pGLE9BQU8sRUFBQyxJQUFJLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQU9wQyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBRXRDOzs7O0dBSUc7QUFDSCxNQUFNLE9BQU8sY0FBYztJQWtDakIsYUFBYTtRQUNuQixJQUFJLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1lBQzVCLE9BQU87UUFDVCxDQUFDO1FBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDeEIsT0FBTztRQUNULENBQUM7UUFFRCxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7UUFDbkIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDNUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNwRixVQUFVLEdB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QUFDO0lBQ0wsQ0FBQztJQUVPLG9CQUFvQjtRQUMxQixJQUFJLENBQUMsV0FBVyxFQUFFLFFBQVEsRUFBRSxDQUFDO0lBQy9CLENBQUM7Q0FDRjtBQUVELG9CQUFvQjtBQUNwQixNQUFNLFVBQVUsd0JBQXdCO0lBQ3RDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDaEUsQ0FBQztBQUVELDhEQUE4RDtBQUM5RCxNQUFNLENBQUMsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLGNBQWMsQ0FBNkIsa0JBQWtCLEVBQUU7SUFDakcsVUFBVSxFQUFFLE1BQU07SUFDbEIsT0FBTyxFQUFFLHdCQUF3QjtDQUNsQyxDQUFDLENBQUM7QUFFSCxvQkFBb0I7QUFDcEIsTUFBTSxDQUFDLE1BQU0saUNBQWlDLEdBQUc7SUFDL0MsT0FBTyxFQUFFLGdCQUFnQjtJQUN6QixVQUFVLEVBQUUsd0JBQXdCO0NBQ3JDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbiwgUXVlcnlMaXN0fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Y29lcmNlT2JzZXJ2YWJsZX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uL3ByaXZhdGUnO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJqZWN0LCBTdWJzY3JpcHRpb24sIGlzT2JzZXJ2YWJsZSwgb2YgYXMgb2JzZXJ2YWJsZU9mfSBmcm9tICdyeGpzJztcbmltcG9ydCB7dGFrZX0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtcbiAgVHJlZUtleU1hbmFnZXJGYWN0b3J5LFxuICBUcmVlS2V5TWFuYWdlckl0ZW0sXG4gIFRyZWVLZXlNYW5hZ2VyT3B0aW9ucyxcbiAgVHJlZUtleU1hbmFnZXJTdHJhdGVneSxcbn0gZnJvbSAnLi90cmVlLWtleS1tYW5hZ2VyLXN0cmF0ZWd5JztcbmltcG9ydCB7VHlwZWFoZWFkfSBmcm9tICcuL3R5cGVhaGVhZCc7XG5cbi8qKlxuICogVGhpcyBjbGFzcyBtYW5hZ2VzIGtleWJvYXJkIGV2ZW50cyBmb3IgdHJlZXMuIElmIHlvdSBwYXNzIGl0IGEgUXVlcnlMaXN0IG9yIG90aGVyIGxpc3Qgb2YgdHJlZVxuICogaXRlbXMsIGl0IHdpbGwgc2V0IHRoZSBhY3RpdmUgaXRlbSwgZm9jdXMsIGhhbmRsZSBleHBhbnNpb24gYW5kIHR5cGVhaGVhZCBjb3JyZWN0bHkgd2hlblxuICoga2V5Ym9hcmQgZXZlbnRzIG9jY3VyLlxuICovXG5leHBvcnQgY2xhc3MgVHJlZUtleU1hbmFnZXI8VCBleHRlbmRzIFRyZWVLZXlNYW5hZ2VySXRlbT4gaW1wbGVtZW50cyBUcmVlS2V5TWFuYWdlclN0cmF0ZWd5PFQ+IHtcbiAgLyoqIFRoZSBpbmRleCBvZiB0aGUgY3VycmVudGx5IGFjdGl2ZSAoZm9jdXNlZCkgaXRlbS4gKi9cbiAgcHJpdmF0ZSBfYWN0aXZlSXRlbUluZGV4ID0gLTE7XG4gIC8qKiBUaGUgY3VycmVudGx5IGFjdGl2ZSAoZm9jdXNlZCkgaXRlbS4gKi9cbiAgcHJpdmF0ZSBfYWN0aXZlSXRlbTogVCB8IG51bGwgPSBudWxsO1xuICAvKiogV2hldGhlciBvciBub3Qgd2UgYWN0aXZhdGUgdGhlIGl0ZW0gd2hlbiBpdCdzIGZvY3VzZWQuICovXG4gIHByaXZhdGUgX3Nob3VsZEFjdGl2YXRpb25Gb2xsb3dGb2N1cyA9IGZhbHNlO1xuICAvKipcbiAgICogVGhlIG9yaWVudGF0aW9uIHRoYXQgdGhlIHRyZWUgaXMgbGFpZCBvdXQgaW4uIEluIGBydGxgIG1vZGUsIHRoZSBiZWhhdmlvciBvZiBMZWZ0IGFuZFxuICAgKiBSaWdodCBhcnJvdyBhcmUgc3dpdGNoZWQuXG4gICAqL1xuICBwcml2YXRlIF9ob3Jpem9udGFsT3JpZW50YXRpb246ICdsdHInIHwgJ3J0bCcgPSAnbHRyJztcblxuICAvKipcbiAgICogUHJlZGljYXRlIGZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gY2hlY2sgd2hldGhlciBhbiBpdGVtIHNob3VsZCBiZSBza2lwcGVkXG4gICAqIGJ5IHRoZSBrZXkgbWFuYWdlci5cbiAgICpcbiAgICogVGhlIGRlZmF1bHQgdmFsdWUgZm9yIHRoaXMgZG9lc24ndCBza2lwIGFueSBlbGVtZW50cyBpbiBvcmRlciB0byBrZWVwIHRyZWUgaXRlbXMgZm9jdXNhYmxlXG4gICAqIHdoZW4gZGlzYWJsZWQuIFRoaXMgYWxpZ25zIHdpdGggQVJJQSBndWlkZWxpbmVzOlxuICAgKiBodHRwczovL3d3dy53My5vcmcvV0FJL0FSSUEvYXBnL3ByYWN0aWNlcy9rZXlib2FyZC1pbnRlcmZhY2UvI2ZvY3VzYWJpbGl0eW9mZGlzYWJsZWRjb250cm9scy5cbiAgICovXG4gIHByaXZhdGUgX3NraXBQcmVkaWNhdGVGbiA9IChfaXRlbTogVCkgPT4gZmFsc2U7XG5cbiAgLyoqIEZ1bmN0aW9uIHRvIGRldGVybWluZSBlcXVpdmFsZW50IGl0ZW1zLiAqL1xuICBwcml2YXRlIF90cmFja0J5Rm46IChpdGVtOiBUKSA9PiB1bmtub3duID0gKGl0ZW06IFQpID0+IGl0ZW07XG5cbiAgLyoqIFN5bmNocm9ub3VzIGNhY2hlIG9mIHRoZSBpdGVtcyB0byBtYW5hZ2UuICovXG4gIHByaXZhdGUgX2l0ZW1zOiBUW10gPSBbXTtcblxuICBwcml2YXRlIF90eXBlYWhlYWQ/OiBUeXBlYWhlYWQ8VD47XG4gIHByaXZhdGUgX3R5cGVhaGVhZFN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcblxuICBwcml2YXRlIF9oYXNJbml0aWFsRm9jdXNlZCA9IGZhbHNlO1xuXG4gIHByaXZhdGUgX2luaXRpYWxGb2N1cygpIHtcbiAgICBpZiAodGhpcy5faGFzSW5pdGlhbEZvY3VzZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX2l0ZW1zLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBmb2N1c0luZGV4ID0gMDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX2l0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoIXRoaXMuX3NraXBQcmVkaWNhdGVGbih0aGlzLl9pdGVtc1tpXSkgJiYgIXRoaXMuX2lzSXRlbURpc2FibGVkKHRoaXMuX2l0ZW1zW2ldKSkge1xuICAgICAgICBmb2N1c0luZGV4ID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5mb2N1c0l0ZW0oZm9jdXNJbmRleCk7XG4gICAgdGhpcy5faGFzSW5pdGlhbEZvY3VzZWQgPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBpdGVtcyBMaXN0IG9mIFRyZWVLZXlNYW5hZ2VyIG9wdGlvbnMuIENhbiBiZSBzeW5jaHJvbm91cyBvciBhc3luY2hyb25vdXMuXG4gICAqIEBwYXJhbSBjb25maWcgT3B0aW9uYWwgY29uZmlndXJhdGlvbiBvcHRpb25zLiBCeSBkZWZhdWx0LCB1c2UgJ2x0cicgaG9yaXpvbnRhbCBvcmllbnRhdGlvbi4gQnlcbiAgICogZGVmYXVsdCwgZG8gbm90IHNraXAgYW55IG5vZGVzLiBCeSBkZWZhdWx0LCBrZXkgbWFuYWdlciBvbmx5IGNhbGxzIGBmb2N1c2AgbWV0aG9kIHdoZW4gaXRlbXNcbiAgICogYXJlIGZvY3VzZWQgYW5kIGRvZXMgbm90IGNhbGwgYGFjdGl2YXRlYC4gSWYgYHR5cGVhaGVhZERlZmF1bHRJbnRlcnZhbGAgaXMgYHRydWVgLCB1c2UgYVxuICAgKiBkZWZhdWx0IGludGVydmFsIG9mIDIwMG1zLlxuICAgKi9cbiAgY29uc3RydWN0b3IoaXRlbXM6IE9ic2VydmFibGU8VFtdPiB8IFF1ZXJ5TGlzdDxUPiB8IFRbXSwgY29uZmlnOiBUcmVlS2V5TWFuYWdlck9wdGlvbnM8VD4pIHtcbiAgICAvLyBXZSBhbGxvdyBmb3IgdGhlIGl0ZW1zIHRvIGJlIGFuIGFycmF5IG9yIE9ic2VydmFibGUgYmVjYXVzZSwgaW4gc29tZSBjYXNlcywgdGhlIGNvbnN1bWVyIG1heVxuICAgIC8vIG5vdCBoYXZlIGFjY2VzcyB0byBhIFF1ZXJ5TGlzdCBvZiB0aGUgaXRlbXMgdGhleSB3YW50IHRvIG1hbmFnZSAoZS5nLiB3aGVuIHRoZVxuICAgIC8vIGl0ZW1zIGFyZW4ndCBiZWluZyBjb2xsZWN0ZWQgdmlhIGBWaWV3Q2hpbGRyZW5gIG9yIGBDb250ZW50Q2hpbGRyZW5gKS5cbiAgICBpZiAoaXRlbXMgaW5zdGFuY2VvZiBRdWVyeUxpc3QpIHtcbiAgICAgIHRoaXMuX2l0ZW1zID0gaXRlbXMudG9BcnJheSgpO1xuICAgICAgaXRlbXMuY2hhbmdlcy5zdWJzY3JpYmUoKG5ld0l0ZW1zOiBRdWVyeUxpc3Q8VD4pID0+IHtcbiAgICAgICAgdGhpcy5faXRlbXMgPSBuZXdJdGVtcy50b0FycmF5KCk7XG4gICAgICAgIHRoaXMuX3R5cGVhaGVhZD8uc2V0SXRlbXModGhpcy5faXRlbXMpO1xuICAgICAgICB0aGlzLl91cGRhdGVBY3RpdmVJdGVtSW5kZXgodGhpcy5faXRlbXMpO1xuICAgICAgICB0aGlzLl9pbml0aWFsRm9jdXMoKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoaXNPYnNlcnZhYmxlKGl0ZW1zKSkge1xuICAgICAgaXRlbXMuc3Vic2NyaWJlKG5ld0l0ZW1zID0+IHtcbiAgICAgICAgdGhpcy5faXRlbXMgPSBuZXdJdGVtcztcbiAgICAgICAgdGhpcy5fdHlwZWFoZWFkPy5zZXRJdGVtcyhuZXdJdGVtcyk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUFjdGl2ZUl0ZW1JbmRleChuZXdJdGVtcyk7XG4gICAgICAgIHRoaXMuX2luaXRpYWxGb2N1cygpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2l0ZW1zID0gaXRlbXM7XG4gICAgICB0aGlzLl9pbml0aWFsRm9jdXMoKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGNvbmZpZy5zaG91bGRBY3RpdmF0aW9uRm9sbG93Rm9jdXMgPT09ICdib29sZWFuJykge1xuICAgICAgdGhpcy5fc2hvdWxkQWN0aXZhdGlvbkZvbGxvd0ZvY3VzID0gY29uZmlnLnNob3VsZEFjdGl2YXRpb25Gb2xsb3dGb2N1cztcbiAgICB9XG4gICAgaWYgKGNvbmZpZy5ob3Jpem9udGFsT3JpZW50YXRpb24pIHtcbiAgICAgIHRoaXMuX2hvcml6b250YWxPcmllbnRhdGlvbiA9IGNvbmZpZy5ob3Jpem9udGFsT3JpZW50YXRpb247XG4gICAgfVxuICAgIGlmIChjb25maWcuc2tpcFByZWRpY2F0ZSkge1xuICAgICAgdGhpcy5fc2tpcFByZWRpY2F0ZUZuID0gY29uZmlnLnNraXBQcmVkaWNhdGU7XG4gICAgfVxuICAgIGlmIChjb25maWcudHJhY2tCeSkge1xuICAgICAgdGhpcy5fdHJhY2tCeUZuID0gY29uZmlnLnRyYWNrQnk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgY29uZmlnLnR5cGVBaGVhZERlYm91bmNlSW50ZXJ2YWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aGlzLl9zZXRUeXBlQWhlYWQoY29uZmlnLnR5cGVBaGVhZERlYm91bmNlSW50ZXJ2YWwpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTdHJlYW0gdGhhdCBlbWl0cyBhbnkgdGltZSB0aGUgZm9jdXNlZCBpdGVtIGNoYW5nZXMuICovXG4gIHJlYWRvbmx5IGNoYW5nZSA9IG5ldyBTdWJqZWN0PFQgfCBudWxsPigpO1xuXG4gIC8qKiBDbGVhbnMgdXAgdGhlIGtleSBtYW5hZ2VyLiAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuX3R5cGVhaGVhZFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuX3R5cGVhaGVhZD8uZGVzdHJveSgpO1xuICAgIHRoaXMuY2hhbmdlLmNvbXBsZXRlKCk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBhIGtleWJvYXJkIGV2ZW50IG9uIHRoZSB0cmVlLlxuICAgKiBAcGFyYW0gZXZlbnQgS2V5Ym9hcmQgZXZlbnQgdGhhdCByZXByZXNlbnRzIHRoZSB1c2VyIGludGVyYWN0aW9uIHdpdGggdGhlIHRyZWUuXG4gICAqL1xuICBvbktleWRvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcbiAgICBjb25zdCBrZXkgPSBldmVudC5rZXk7XG5cbiAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgY2FzZSAnVGFiJzpcbiAgICAgICAgLy8gUmV0dXJuIGVhcmx5IGhlcmUsIGluIG9yZGVyIHRvIGFsbG93IFRhYiB0byBhY3R1YWxseSB0YWIgb3V0IG9mIHRoZSB0cmVlXG4gICAgICAgIHJldHVybjtcblxuICAgICAgY2FzZSAnQXJyb3dEb3duJzpcbiAgICAgICAgdGhpcy5fZm9jdXNOZXh0SXRlbSgpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnQXJyb3dVcCc6XG4gICAgICAgIHRoaXMuX2ZvY3VzUHJldmlvdXNJdGVtKCk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdBcnJvd1JpZ2h0JzpcbiAgICAgICAgdGhpcy5faG9yaXpvbnRhbE9yaWVudGF0aW9uID09PSAncnRsJ1xuICAgICAgICAgID8gdGhpcy5fY29sbGFwc2VDdXJyZW50SXRlbSgpXG4gICAgICAgICAgOiB0aGlzLl9leHBhbmRDdXJyZW50SXRlbSgpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnQXJyb3dMZWZ0JzpcbiAgICAgICAgdGhpcy5faG9yaXpvbnRhbE9yaWVudGF0aW9uID09PSAncnRsJ1xuICAgICAgICAgID8gdGhpcy5fZXhwYW5kQ3VycmVudEl0ZW0oKVxuICAgICAgICAgIDogdGhpcy5fY29sbGFwc2VDdXJyZW50SXRlbSgpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnSG9tZSc6XG4gICAgICAgIHRoaXMuX2ZvY3VzRmlyc3RJdGVtKCk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdFbmQnOlxuICAgICAgICB0aGlzLl9mb2N1c0xhc3RJdGVtKCk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdFbnRlcic6XG4gICAgICBjYXNlICcgJzpcbiAgICAgICAgdGhpcy5fYWN0aXZhdGVDdXJyZW50SXRlbSgpO1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGV2ZW50LmtleSA9PT0gJyonKSB7XG4gICAgICAgICAgdGhpcy5fZXhwYW5kQWxsSXRlbXNBdEN1cnJlbnRJdGVtTGV2ZWwoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3R5cGVhaGVhZD8uaGFuZGxlS2V5KGV2ZW50KTtcbiAgICAgICAgLy8gUmV0dXJuIGhlcmUsIGluIG9yZGVyIHRvIGF2b2lkIHByZXZlbnRpbmcgdGhlIGRlZmF1bHQgYWN0aW9uIG9mIG5vbi1uYXZpZ2F0aW9uYWxcbiAgICAgICAgLy8ga2V5cyBvciByZXNldHRpbmcgdGhlIGJ1ZmZlciBvZiBwcmVzc2VkIGxldHRlcnMuXG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBSZXNldCB0aGUgdHlwZWFoZWFkIHNpbmNlIHRoZSB1c2VyIGhhcyB1c2VkIGEgbmF2aWdhdGlvbmFsIGtleS5cbiAgICB0aGlzLl90eXBlYWhlYWQ/LnJlc2V0KCk7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgfVxuXG4gIC8qKiBJbmRleCBvZiB0aGUgY3VycmVudGx5IGFjdGl2ZSBpdGVtLiAqL1xuICBnZXRBY3RpdmVJdGVtSW5kZXgoKTogbnVtYmVyIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX2FjdGl2ZUl0ZW1JbmRleDtcbiAgfVxuXG4gIC8qKiBUaGUgY3VycmVudGx5IGFjdGl2ZSBpdGVtLiAqL1xuICBnZXRBY3RpdmVJdGVtKCk6IFQgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fYWN0aXZlSXRlbTtcbiAgfVxuXG4gIC8qKiBGb2N1cyB0aGUgZmlyc3QgYXZhaWxhYmxlIGl0ZW0uICovXG4gIHByaXZhdGUgX2ZvY3VzRmlyc3RJdGVtKCk6IHZvaWQge1xuICAgIHRoaXMuZm9jdXNJdGVtKHRoaXMuX2ZpbmROZXh0QXZhaWxhYmxlSXRlbUluZGV4KC0xKSk7XG4gIH1cblxuICAvKiogRm9jdXMgdGhlIGxhc3QgYXZhaWxhYmxlIGl0ZW0uICovXG4gIHByaXZhdGUgX2ZvY3VzTGFzdEl0ZW0oKTogdm9pZCB7XG4gICAgdGhpcy5mb2N1c0l0ZW0odGhpcy5fZmluZFByZXZpb3VzQXZhaWxhYmxlSXRlbUluZGV4KHRoaXMuX2l0ZW1zLmxlbmd0aCkpO1xuICB9XG5cbiAgLyoqIEZvY3VzIHRoZSBuZXh0IGF2YWlsYWJsZSBpdGVtLiAqL1xuICBwcml2YXRlIF9mb2N1c05leHRJdGVtKCk6IHZvaWQge1xuICAgIHRoaXMuZm9jdXNJdGVtKHRoaXMuX2ZpbmROZXh0QXZhaWxhYmxlSXRlbUluZGV4KHRoaXMuX2FjdGl2ZUl0ZW1JbmRleCkpO1xuICB9XG5cbiAgLyoqIEZvY3VzIHRoZSBwcmV2aW91cyBhdmFpbGFibGUgaXRlbS4gKi9cbiAgcHJpdmF0ZSBfZm9jdXNQcmV2aW91c0l0ZW0oKTogdm9pZCB7XG4gICAgdGhpcy5mb2N1c0l0ZW0odGhpcy5fZmluZFByZXZpb3VzQXZhaWxhYmxlSXRlbUluZGV4KHRoaXMuX2FjdGl2ZUl0ZW1JbmRleCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvY3VzIHRoZSBwcm92aWRlZCBpdGVtIGJ5IGluZGV4LlxuICAgKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBpdGVtIHRvIGZvY3VzLlxuICAgKiBAcGFyYW0gb3B0aW9ucyBBZGRpdGlvbmFsIGZvY3VzaW5nIG9wdGlvbnMuXG4gICAqL1xuICBmb2N1c0l0ZW0oaW5kZXg6IG51bWJlciwgb3B0aW9ucz86IHtlbWl0Q2hhbmdlRXZlbnQ/OiBib29sZWFufSk6IHZvaWQ7XG4gIGZvY3VzSXRlbShpdGVtOiBULCBvcHRpb25zPzoge2VtaXRDaGFuZ2VFdmVudD86IGJvb2xlYW59KTogdm9pZDtcbiAgZm9jdXNJdGVtKGl0ZW1PckluZGV4OiBudW1iZXIgfCBULCBvcHRpb25zPzoge2VtaXRDaGFuZ2VFdmVudD86IGJvb2xlYW59KTogdm9pZDtcbiAgZm9jdXNJdGVtKGl0ZW1PckluZGV4OiBudW1iZXIgfCBULCBvcHRpb25zOiB7ZW1pdENoYW5nZUV2ZW50PzogYm9vbGVhbn0gPSB7fSkge1xuICAgIC8vIFNldCBkZWZhdWx0IG9wdGlvbnNcbiAgICBvcHRpb25zLmVtaXRDaGFuZ2VFdmVudCA/Pz0gdHJ1ZTtcblxuICAgIGxldCBpbmRleCA9XG4gICAgICB0eXBlb2YgaXRlbU9ySW5kZXggPT09ICdudW1iZXInXG4gICAgICAgID8gaXRlbU9ySW5kZXhcbiAgICAgICAgOiB0aGlzLl9pdGVtcy5maW5kSW5kZXgoaXRlbSA9PiB0aGlzLl90cmFja0J5Rm4oaXRlbSkgPT09IHRoaXMuX3RyYWNrQnlGbihpdGVtT3JJbmRleCkpO1xuICAgIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPj0gdGhpcy5faXRlbXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGFjdGl2ZUl0ZW0gPSB0aGlzLl9pdGVtc1tpbmRleF07XG5cbiAgICAvLyBJZiB3ZSdyZSBqdXN0IHNldHRpbmcgdGhlIHNhbWUgaXRlbSwgZG9uJ3QgcmUtY2FsbCBhY3RpdmF0ZSBvciBmb2N1c1xuICAgIGlmIChcbiAgICAgIHRoaXMuX2FjdGl2ZUl0ZW0gIT09IG51bGwgJiZcbiAgICAgIHRoaXMuX3RyYWNrQnlGbihhY3RpdmVJdGVtKSA9PT0gdGhpcy5fdHJhY2tCeUZuKHRoaXMuX2FjdGl2ZUl0ZW0pXG4gICAgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcHJldmlvdXNBY3RpdmVJdGVtID0gdGhpcy5fYWN0aXZlSXRlbTtcbiAgICB0aGlzLl9hY3RpdmVJdGVtID0gYWN0aXZlSXRlbSA/PyBudWxsO1xuICAgIHRoaXMuX2FjdGl2ZUl0ZW1JbmRleCA9IGluZGV4O1xuICAgIHRoaXMuX3R5cGVhaGVhZD8uc2V0Q3VycmVudFNlbGVjdGVkSXRlbUluZGV4KGluZGV4KTtcblxuICAgIHRoaXMuX2FjdGl2ZUl0ZW0/LmZvY3VzKCk7XG4gICAgcHJldmlvdXNBY3RpdmVJdGVtPy51bmZvY3VzKCk7XG5cbiAgICBpZiAob3B0aW9ucy5lbWl0Q2hhbmdlRXZlbnQpIHtcbiAgICAgIHRoaXMuY2hhbmdlLm5leHQodGhpcy5fYWN0aXZlSXRlbSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3Nob3VsZEFjdGl2YXRpb25Gb2xsb3dGb2N1cykge1xuICAgICAgdGhpcy5fYWN0aXZhdGVDdXJyZW50SXRlbSgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX3VwZGF0ZUFjdGl2ZUl0ZW1JbmRleChuZXdJdGVtczogVFtdKSB7XG4gICAgY29uc3QgYWN0aXZlSXRlbSA9IHRoaXMuX2FjdGl2ZUl0ZW07XG4gICAgaWYgKCFhY3RpdmVJdGVtKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbmV3SW5kZXggPSBuZXdJdGVtcy5maW5kSW5kZXgoXG4gICAgICBpdGVtID0+IHRoaXMuX3RyYWNrQnlGbihpdGVtKSA9PT0gdGhpcy5fdHJhY2tCeUZuKGFjdGl2ZUl0ZW0pLFxuICAgICk7XG5cbiAgICBpZiAobmV3SW5kZXggPiAtMSAmJiBuZXdJbmRleCAhPT0gdGhpcy5fYWN0aXZlSXRlbUluZGV4KSB7XG4gICAgICB0aGlzLl9hY3RpdmVJdGVtSW5kZXggPSBuZXdJbmRleDtcbiAgICAgIHRoaXMuX3R5cGVhaGVhZD8uc2V0Q3VycmVudFNlbGVjdGVkSXRlbUluZGV4KG5ld0luZGV4KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9zZXRUeXBlQWhlYWQoZGVib3VuY2VJbnRlcnZhbDogbnVtYmVyIHwgYm9vbGVhbikge1xuICAgIHRoaXMuX3R5cGVhaGVhZCA9IG5ldyBUeXBlYWhlYWQodGhpcy5faXRlbXMsIHtcbiAgICAgIGRlYm91bmNlSW50ZXJ2YWw6IHR5cGVvZiBkZWJvdW5jZUludGVydmFsID09PSAnbnVtYmVyJyA/IGRlYm91bmNlSW50ZXJ2YWwgOiB1bmRlZmluZWQsXG4gICAgICBza2lwUHJlZGljYXRlOiBpdGVtID0+IHRoaXMuX3NraXBQcmVkaWNhdGVGbihpdGVtKSxcbiAgICB9KTtcblxuICAgIHRoaXMuX3R5cGVhaGVhZFN1YnNjcmlwdGlvbiA9IHRoaXMuX3R5cGVhaGVhZC5zZWxlY3RlZEl0ZW0uc3Vic2NyaWJlKGl0ZW0gPT4ge1xuICAgICAgdGhpcy5mb2N1c0l0ZW0oaXRlbSk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9maW5kTmV4dEF2YWlsYWJsZUl0ZW1JbmRleChzdGFydGluZ0luZGV4OiBudW1iZXIpIHtcbiAgICBmb3IgKGxldCBpID0gc3RhcnRpbmdJbmRleCArIDE7IGkgPCB0aGlzLl9pdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKCF0aGlzLl9za2lwUHJlZGljYXRlRm4odGhpcy5faXRlbXNbaV0pKSB7XG4gICAgICAgIHJldHVybiBpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3RhcnRpbmdJbmRleDtcbiAgfVxuXG4gIHByaXZhdGUgX2ZpbmRQcmV2aW91c0F2YWlsYWJsZUl0ZW1JbmRleChzdGFydGluZ0luZGV4OiBudW1iZXIpIHtcbiAgICBmb3IgKGxldCBpID0gc3RhcnRpbmdJbmRleCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBpZiAoIXRoaXMuX3NraXBQcmVkaWNhdGVGbih0aGlzLl9pdGVtc1tpXSkpIHtcbiAgICAgICAgcmV0dXJuIGk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdGFydGluZ0luZGV4O1xuICB9XG5cbiAgLyoqXG4gICAqIElmIHRoZSBpdGVtIGlzIGFscmVhZHkgZXhwYW5kZWQsIHdlIGNvbGxhcHNlIHRoZSBpdGVtLiBPdGhlcndpc2UsIHdlIHdpbGwgZm9jdXMgdGhlIHBhcmVudC5cbiAgICovXG4gIHByaXZhdGUgX2NvbGxhcHNlQ3VycmVudEl0ZW0oKSB7XG4gICAgaWYgKCF0aGlzLl9hY3RpdmVJdGVtKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2lzQ3VycmVudEl0ZW1FeHBhbmRlZCgpKSB7XG4gICAgICB0aGlzLl9hY3RpdmVJdGVtLmNvbGxhcHNlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXMuX2FjdGl2ZUl0ZW0uZ2V0UGFyZW50KCk7XG4gICAgICBpZiAoIXBhcmVudCB8fCB0aGlzLl9za2lwUHJlZGljYXRlRm4ocGFyZW50IGFzIFQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMuZm9jdXNJdGVtKHBhcmVudCBhcyBUKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSWYgdGhlIGl0ZW0gaXMgYWxyZWFkeSBjb2xsYXBzZWQsIHdlIGV4cGFuZCB0aGUgaXRlbS4gT3RoZXJ3aXNlLCB3ZSB3aWxsIGZvY3VzIHRoZSBmaXJzdCBjaGlsZC5cbiAgICovXG4gIHByaXZhdGUgX2V4cGFuZEN1cnJlbnRJdGVtKCkge1xuICAgIGlmICghdGhpcy5fYWN0aXZlSXRlbSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5faXNDdXJyZW50SXRlbUV4cGFuZGVkKCkpIHtcbiAgICAgIHRoaXMuX2FjdGl2ZUl0ZW0uZXhwYW5kKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZXJjZU9ic2VydmFibGUodGhpcy5fYWN0aXZlSXRlbS5nZXRDaGlsZHJlbigpKVxuICAgICAgICAucGlwZSh0YWtlKDEpKVxuICAgICAgICAuc3Vic2NyaWJlKGNoaWxkcmVuID0+IHtcbiAgICAgICAgICBjb25zdCBmaXJzdENoaWxkID0gY2hpbGRyZW4uZmluZChjaGlsZCA9PiAhdGhpcy5fc2tpcFByZWRpY2F0ZUZuKGNoaWxkIGFzIFQpKTtcbiAgICAgICAgICBpZiAoIWZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5mb2N1c0l0ZW0oZmlyc3RDaGlsZCBhcyBUKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfaXNDdXJyZW50SXRlbUV4cGFuZGVkKCkge1xuICAgIGlmICghdGhpcy5fYWN0aXZlSXRlbSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHlwZW9mIHRoaXMuX2FjdGl2ZUl0ZW0uaXNFeHBhbmRlZCA9PT0gJ2Jvb2xlYW4nXG4gICAgICA/IHRoaXMuX2FjdGl2ZUl0ZW0uaXNFeHBhbmRlZFxuICAgICAgOiB0aGlzLl9hY3RpdmVJdGVtLmlzRXhwYW5kZWQoKTtcbiAgfVxuXG4gIHByaXZhdGUgX2lzSXRlbURpc2FibGVkKGl0ZW06IFRyZWVLZXlNYW5hZ2VySXRlbSkge1xuICAgIHJldHVybiB0eXBlb2YgaXRlbS5pc0Rpc2FibGVkID09PSAnYm9vbGVhbicgPyBpdGVtLmlzRGlzYWJsZWQgOiBpdGVtLmlzRGlzYWJsZWQ/LigpO1xuICB9XG5cbiAgLyoqIEZvciBhbGwgaXRlbXMgdGhhdCBhcmUgdGhlIHNhbWUgbGV2ZWwgYXMgdGhlIGN1cnJlbnQgaXRlbSwgd2UgZXhwYW5kIHRob3NlIGl0ZW1zLiAqL1xuICBwcml2YXRlIF9leHBhbmRBbGxJdGVtc0F0Q3VycmVudEl0ZW1MZXZlbCgpIHtcbiAgICBpZiAoIXRoaXMuX2FjdGl2ZUl0ZW0pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwYXJlbnQgPSB0aGlzLl9hY3RpdmVJdGVtLmdldFBhcmVudCgpO1xuICAgIGxldCBpdGVtc1RvRXhwYW5kO1xuICAgIGlmICghcGFyZW50KSB7XG4gICAgICBpdGVtc1RvRXhwYW5kID0gb2JzZXJ2YWJsZU9mKHRoaXMuX2l0ZW1zLmZpbHRlcihpdGVtID0+IGl0ZW0uZ2V0UGFyZW50KCkgPT09IG51bGwpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaXRlbXNUb0V4cGFuZCA9IGNvZXJjZU9ic2VydmFibGUocGFyZW50LmdldENoaWxkcmVuKCkpO1xuICAgIH1cblxuICAgIGl0ZW1zVG9FeHBhbmQucGlwZSh0YWtlKDEpKS5zdWJzY3JpYmUoaXRlbXMgPT4ge1xuICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGl0ZW1zKSB7XG4gICAgICAgIGl0ZW0uZXhwYW5kKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9hY3RpdmF0ZUN1cnJlbnRJdGVtKCkge1xuICAgIHRoaXMuX2FjdGl2ZUl0ZW0/LmFjdGl2YXRlKCk7XG4gIH1cbn1cblxuLyoqIEBkb2NzLXByaXZhdGUgKi9cbmV4cG9ydCBmdW5jdGlvbiBUUkVFX0tFWV9NQU5BR0VSX0ZBQ1RPUlk8VCBleHRlbmRzIFRyZWVLZXlNYW5hZ2VySXRlbT4oKTogVHJlZUtleU1hbmFnZXJGYWN0b3J5PFQ+IHtcbiAgcmV0dXJuIChpdGVtcywgb3B0aW9ucykgPT4gbmV3IFRyZWVLZXlNYW5hZ2VyKGl0ZW1zLCBvcHRpb25zKTtcbn1cblxuLyoqIEluamVjdGlvbiB0b2tlbiB0aGF0IGRldGVybWluZXMgdGhlIGtleSBtYW5hZ2VyIHRvIHVzZS4gKi9cbmV4cG9ydCBjb25zdCBUUkVFX0tFWV9NQU5BR0VSID0gbmV3IEluamVjdGlvblRva2VuPFRyZWVLZXlNYW5hZ2VyRmFjdG9yeTxhbnk+PigndHJlZS1rZXktbWFuYWdlcicsIHtcbiAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxuICBmYWN0b3J5OiBUUkVFX0tFWV9NQU5BR0VSX0ZBQ1RPUlksXG59KTtcblxuLyoqIEBkb2NzLXByaXZhdGUgKi9cbmV4cG9ydCBjb25zdCBUUkVFX0tFWV9NQU5BR0VSX0ZBQ1RPUllfUFJPVklERVIgPSB7XG4gIHByb3ZpZGU6IFRSRUVfS0VZX01BTkFHRVIsXG4gIHVzZUZhY3Rvcnk6IFRSRUVfS0VZX01BTkFHRVJfRkFDVE9SWSxcbn07XG4iXX0=