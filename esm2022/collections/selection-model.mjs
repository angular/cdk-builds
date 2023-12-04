/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Subject } from 'rxjs';
/**
 * Class to be used to power selecting one or more options from a list.
 */
export class SelectionModel {
    /** Selected values. */
    get selected() {
        if (!this._selected) {
            this._selected = Array.from(this._selection.values());
        }
        return this._selected;
    }
    constructor(_multiple = false, initiallySelectedValues, _emitChanges = true, compareWith) {
        this._multiple = _multiple;
        this._emitChanges = _emitChanges;
        this.compareWith = compareWith;
        /** Currently-selected values. */
        this._selection = new Set();
        /** Keeps track of the deselected options that haven't been emitted by the change event. */
        this._deselectedToEmit = [];
        /** Keeps track of the selected options that haven't been emitted by the change event. */
        this._selectedToEmit = [];
        /** Event emitted when the value has changed. */
        this.changed = new Subject();
        if (initiallySelectedValues && initiallySelectedValues.length) {
            if (_multiple) {
                initiallySelectedValues.forEach(value => this._markSelected(value));
            }
            else {
                this._markSelected(initiallySelectedValues[0]);
            }
            // Clear the array in order to avoid firing the change event for preselected values.
            this._selectedToEmit.length = 0;
        }
    }
    /**
     * Selects a value or an array of values.
     * @param values The values to select
     * @return Whether the selection changed as a result of this call
     * @breaking-change 16.0.0 make return type boolean
     */
    select(...values) {
        this._verifyValueAssignment(values);
        values.forEach(value => this._markSelected(value));
        const changed = this._hasQueuedChanges();
        this._emitChangeEvent();
        return changed;
    }
    /**
     * Deselects a value or an array of values.
     * @param values The values to deselect
     * @return Whether the selection changed as a result of this call
     * @breaking-change 16.0.0 make return type boolean
     */
    deselect(...values) {
        this._verifyValueAssignment(values);
        values.forEach(value => this._unmarkSelected(value));
        const changed = this._hasQueuedChanges();
        this._emitChangeEvent();
        return changed;
    }
    /**
     * Sets the selected values
     * @param values The new selected values
     * @return Whether the selection changed as a result of this call
     * @breaking-change 16.0.0 make return type boolean
     */
    setSelection(...values) {
        this._verifyValueAssignment(values);
        const oldValues = this.selected;
        const newSelectedSet = new Set(values);
        values.forEach(value => this._markSelected(value));
        oldValues
            .filter(value => !newSelectedSet.has(value))
            .forEach(value => this._unmarkSelected(value));
        const changed = this._hasQueuedChanges();
        this._emitChangeEvent();
        return changed;
    }
    /**
     * Toggles a value between selected and deselected.
     * @param value The value to toggle
     * @return Whether the selection changed as a result of this call
     * @breaking-change 16.0.0 make return type boolean
     */
    toggle(value) {
        return this.isSelected(value) ? this.deselect(value) : this.select(value);
    }
    /**
     * Clears all of the selected values.
     * @param flushEvent Whether to flush the changes in an event.
     *   If false, the changes to the selection will be flushed along with the next event.
     * @return Whether the selection changed as a result of this call
     * @breaking-change 16.0.0 make return type boolean
     */
    clear(flushEvent = true) {
        this._unmarkAll();
        const changed = this._hasQueuedChanges();
        if (flushEvent) {
            this._emitChangeEvent();
        }
        return changed;
    }
    /**
     * Determines whether a value is selected.
     */
    isSelected(value) {
        return this._selection.has(this._getConcreteValue(value));
    }
    /**
     * Determines whether the model does not have a value.
     */
    isEmpty() {
        return this._selection.size === 0;
    }
    /**
     * Determines whether the model has a value.
     */
    hasValue() {
        return !this.isEmpty();
    }
    /**
     * Sorts the selected values based on a predicate function.
     */
    sort(predicate) {
        if (this._multiple && this.selected) {
            this._selected.sort(predicate);
        }
    }
    /**
     * Gets whether multiple values can be selected.
     */
    isMultipleSelection() {
        return this._multiple;
    }
    /** Emits a change event and clears the records of selected and deselected values. */
    _emitChangeEvent() {
        // Clear the selected values so they can be re-cached.
        this._selected = null;
        if (this._selectedToEmit.length || this._deselectedToEmit.length) {
            this.changed.next({
                source: this,
                added: this._selectedToEmit,
                removed: this._deselectedToEmit,
            });
            this._deselectedToEmit = [];
            this._selectedToEmit = [];
        }
    }
    /** Selects a value. */
    _markSelected(value) {
        value = this._getConcreteValue(value);
        if (!this.isSelected(value)) {
            if (!this._multiple) {
                this._unmarkAll();
            }
            if (!this.isSelected(value)) {
                this._selection.add(value);
            }
            if (this._emitChanges) {
                this._selectedToEmit.push(value);
            }
        }
    }
    /** Deselects a value. */
    _unmarkSelected(value) {
        value = this._getConcreteValue(value);
        if (this.isSelected(value)) {
            this._selection.delete(value);
            if (this._emitChanges) {
                this._deselectedToEmit.push(value);
            }
        }
    }
    /** Clears out the selected values. */
    _unmarkAll() {
        if (!this.isEmpty()) {
            this._selection.forEach(value => this._unmarkSelected(value));
        }
    }
    /**
     * Verifies the value assignment and throws an error if the specified value array is
     * including multiple values while the selection model is not supporting multiple values.
     */
    _verifyValueAssignment(values) {
        if (values.length > 1 && !this._multiple && (typeof ngDevMode === 'undefined' || ngDevMode)) {
            throw getMultipleValuesInSingleSelectionError();
        }
    }
    /** Whether there are queued up change to be emitted. */
    _hasQueuedChanges() {
        return !!(this._deselectedToEmit.length || this._selectedToEmit.length);
    }
    /** Returns a value that is comparable to inputValue by applying compareWith function, returns the same inputValue otherwise. */
    _getConcreteValue(inputValue) {
        if (!this.compareWith) {
            return inputValue;
        }
        else {
            for (let selectedValue of this._selection) {
                if (this.compareWith(inputValue, selectedValue)) {
                    return selectedValue;
                }
            }
            return inputValue;
        }
    }
}
/**
 * Returns an error that reports that multiple values are passed into a selection model
 * with a single value.
 * @docs-private
 */
export function getMultipleValuesInSingleSelectionError() {
    return Error('Cannot pass multiple values into SelectionModel with single-value mode.');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0aW9uLW1vZGVsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9jb2xsZWN0aW9ucy9zZWxlY3Rpb24tbW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUU3Qjs7R0FFRztBQUNILE1BQU0sT0FBTyxjQUFjO0lBYXpCLHVCQUF1QjtJQUN2QixJQUFJLFFBQVE7UUFDVixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDeEQsQ0FBQztRQUVELE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUN4QixDQUFDO0lBS0QsWUFDVSxZQUFZLEtBQUssRUFDekIsdUJBQTZCLEVBQ3JCLGVBQWUsSUFBSSxFQUNwQixXQUF1QztRQUh0QyxjQUFTLEdBQVQsU0FBUyxDQUFRO1FBRWpCLGlCQUFZLEdBQVosWUFBWSxDQUFPO1FBQ3BCLGdCQUFXLEdBQVgsV0FBVyxDQUE0QjtRQTVCaEQsaUNBQWlDO1FBQ3pCLGVBQVUsR0FBRyxJQUFJLEdBQUcsRUFBSyxDQUFDO1FBRWxDLDJGQUEyRjtRQUNuRixzQkFBaUIsR0FBUSxFQUFFLENBQUM7UUFFcEMseUZBQXlGO1FBQ2pGLG9CQUFlLEdBQVEsRUFBRSxDQUFDO1FBY2xDLGdEQUFnRDtRQUN2QyxZQUFPLEdBQUcsSUFBSSxPQUFPLEVBQXNCLENBQUM7UUFRbkQsSUFBSSx1QkFBdUIsSUFBSSx1QkFBdUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUM5RCxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNkLHVCQUF1QixDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUN0RSxDQUFDO2lCQUFNLENBQUM7Z0JBQ04sSUFBSSxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pELENBQUM7WUFFRCxvRkFBb0Y7WUFDcEYsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ2xDLENBQUM7SUFDSCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxNQUFNLENBQUMsR0FBRyxNQUFXO1FBQ25CLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNwQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ25ELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQ3pDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3hCLE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFFBQVEsQ0FBQyxHQUFHLE1BQVc7UUFDckIsSUFBSSxDQUFDLHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3BDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDckQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDekMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDeEIsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsWUFBWSxDQUFDLEdBQUcsTUFBVztRQUN6QixJQUFJLENBQUMsc0JBQXNCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDcEMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUNoQyxNQUFNLGNBQWMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN2QyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ25ELFNBQVM7YUFDTixNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDM0MsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ2pELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQ3pDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3hCLE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILE1BQU0sQ0FBQyxLQUFRO1FBQ2IsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzVFLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxLQUFLLENBQUMsVUFBVSxHQUFHLElBQUk7UUFDckIsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ2xCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQ3pDLElBQUksVUFBVSxFQUFFLENBQUM7WUFDZixJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBQ0QsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsVUFBVSxDQUFDLEtBQVE7UUFDakIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxPQUFPO1FBQ0wsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksS0FBSyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsUUFBUTtRQUNOLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDekIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsSUFBSSxDQUFDLFNBQWtDO1FBQ3JDLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDcEMsSUFBSSxDQUFDLFNBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDbEMsQ0FBQztJQUNILENBQUM7SUFFRDs7T0FFRztJQUNILG1CQUFtQjtRQUNqQixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDeEIsQ0FBQztJQUVELHFGQUFxRjtJQUM3RSxnQkFBZ0I7UUFDdEIsc0RBQXNEO1FBQ3RELElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1FBRXRCLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2pFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO2dCQUNoQixNQUFNLEVBQUUsSUFBSTtnQkFDWixLQUFLLEVBQUUsSUFBSSxDQUFDLGVBQWU7Z0JBQzNCLE9BQU8sRUFBRSxJQUFJLENBQUMsaUJBQWlCO2FBQ2hDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxpQkFBaUIsR0FBRyxFQUFFLENBQUM7WUFDNUIsSUFBSSxDQUFDLGVBQWUsR0FBRyxFQUFFLENBQUM7UUFDNUIsQ0FBQztJQUNILENBQUM7SUFFRCx1QkFBdUI7SUFDZixhQUFhLENBQUMsS0FBUTtRQUM1QixLQUFLLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDNUIsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDcEIsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ3BCLENBQUM7WUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUM1QixJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM3QixDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ25DLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUVELHlCQUF5QjtJQUNqQixlQUFlLENBQUMsS0FBUTtRQUM5QixLQUFLLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RDLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQzNCLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRTlCLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUN0QixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JDLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUVELHNDQUFzQztJQUM5QixVQUFVO1FBQ2hCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztZQUNwQixJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNoRSxDQUFDO0lBQ0gsQ0FBQztJQUVEOzs7T0FHRztJQUNLLHNCQUFzQixDQUFDLE1BQVc7UUFDeEMsSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQyxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxDQUFDLEVBQUUsQ0FBQztZQUM1RixNQUFNLHVDQUF1QyxFQUFFLENBQUM7UUFDbEQsQ0FBQztJQUNILENBQUM7SUFFRCx3REFBd0Q7SUFDaEQsaUJBQWlCO1FBQ3ZCLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzFFLENBQUM7SUFFRCxnSUFBZ0k7SUFDeEgsaUJBQWlCLENBQUMsVUFBYTtRQUNyQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3RCLE9BQU8sVUFBVSxDQUFDO1FBQ3BCLENBQUM7YUFBTSxDQUFDO1lBQ04sS0FBSyxJQUFJLGFBQWEsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQzFDLElBQUksSUFBSSxDQUFDLFdBQVksQ0FBQyxVQUFVLEVBQUUsYUFBYSxDQUFDLEVBQUUsQ0FBQztvQkFDakQsT0FBTyxhQUFhLENBQUM7Z0JBQ3ZCLENBQUM7WUFDSCxDQUFDO1lBQ0QsT0FBTyxVQUFVLENBQUM7UUFDcEIsQ0FBQztJQUNILENBQUM7Q0FDRjtBQWVEOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsdUNBQXVDO0lBQ3JELE9BQU8sS0FBSyxDQUFDLHlFQUF5RSxDQUFDLENBQUM7QUFDMUYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1N1YmplY3R9IGZyb20gJ3J4anMnO1xuXG4vKipcbiAqIENsYXNzIHRvIGJlIHVzZWQgdG8gcG93ZXIgc2VsZWN0aW5nIG9uZSBvciBtb3JlIG9wdGlvbnMgZnJvbSBhIGxpc3QuXG4gKi9cbmV4cG9ydCBjbGFzcyBTZWxlY3Rpb25Nb2RlbDxUPiB7XG4gIC8qKiBDdXJyZW50bHktc2VsZWN0ZWQgdmFsdWVzLiAqL1xuICBwcml2YXRlIF9zZWxlY3Rpb24gPSBuZXcgU2V0PFQ+KCk7XG5cbiAgLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBkZXNlbGVjdGVkIG9wdGlvbnMgdGhhdCBoYXZlbid0IGJlZW4gZW1pdHRlZCBieSB0aGUgY2hhbmdlIGV2ZW50LiAqL1xuICBwcml2YXRlIF9kZXNlbGVjdGVkVG9FbWl0OiBUW10gPSBbXTtcblxuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIHNlbGVjdGVkIG9wdGlvbnMgdGhhdCBoYXZlbid0IGJlZW4gZW1pdHRlZCBieSB0aGUgY2hhbmdlIGV2ZW50LiAqL1xuICBwcml2YXRlIF9zZWxlY3RlZFRvRW1pdDogVFtdID0gW107XG5cbiAgLyoqIENhY2hlIGZvciB0aGUgYXJyYXkgdmFsdWUgb2YgdGhlIHNlbGVjdGVkIGl0ZW1zLiAqL1xuICBwcml2YXRlIF9zZWxlY3RlZDogVFtdIHwgbnVsbDtcblxuICAvKiogU2VsZWN0ZWQgdmFsdWVzLiAqL1xuICBnZXQgc2VsZWN0ZWQoKTogVFtdIHtcbiAgICBpZiAoIXRoaXMuX3NlbGVjdGVkKSB7XG4gICAgICB0aGlzLl9zZWxlY3RlZCA9IEFycmF5LmZyb20odGhpcy5fc2VsZWN0aW9uLnZhbHVlcygpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fc2VsZWN0ZWQ7XG4gIH1cblxuICAvKiogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSB2YWx1ZSBoYXMgY2hhbmdlZC4gKi9cbiAgcmVhZG9ubHkgY2hhbmdlZCA9IG5ldyBTdWJqZWN0PFNlbGVjdGlvbkNoYW5nZTxUPj4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIF9tdWx0aXBsZSA9IGZhbHNlLFxuICAgIGluaXRpYWxseVNlbGVjdGVkVmFsdWVzPzogVFtdLFxuICAgIHByaXZhdGUgX2VtaXRDaGFuZ2VzID0gdHJ1ZSxcbiAgICBwdWJsaWMgY29tcGFyZVdpdGg/OiAobzE6IFQsIG8yOiBUKSA9PiBib29sZWFuLFxuICApIHtcbiAgICBpZiAoaW5pdGlhbGx5U2VsZWN0ZWRWYWx1ZXMgJiYgaW5pdGlhbGx5U2VsZWN0ZWRWYWx1ZXMubGVuZ3RoKSB7XG4gICAgICBpZiAoX211bHRpcGxlKSB7XG4gICAgICAgIGluaXRpYWxseVNlbGVjdGVkVmFsdWVzLmZvckVhY2godmFsdWUgPT4gdGhpcy5fbWFya1NlbGVjdGVkKHZhbHVlKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9tYXJrU2VsZWN0ZWQoaW5pdGlhbGx5U2VsZWN0ZWRWYWx1ZXNbMF0pO1xuICAgICAgfVxuXG4gICAgICAvLyBDbGVhciB0aGUgYXJyYXkgaW4gb3JkZXIgdG8gYXZvaWQgZmlyaW5nIHRoZSBjaGFuZ2UgZXZlbnQgZm9yIHByZXNlbGVjdGVkIHZhbHVlcy5cbiAgICAgIHRoaXMuX3NlbGVjdGVkVG9FbWl0Lmxlbmd0aCA9IDA7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbGVjdHMgYSB2YWx1ZSBvciBhbiBhcnJheSBvZiB2YWx1ZXMuXG4gICAqIEBwYXJhbSB2YWx1ZXMgVGhlIHZhbHVlcyB0byBzZWxlY3RcbiAgICogQHJldHVybiBXaGV0aGVyIHRoZSBzZWxlY3Rpb24gY2hhbmdlZCBhcyBhIHJlc3VsdCBvZiB0aGlzIGNhbGxcbiAgICogQGJyZWFraW5nLWNoYW5nZSAxNi4wLjAgbWFrZSByZXR1cm4gdHlwZSBib29sZWFuXG4gICAqL1xuICBzZWxlY3QoLi4udmFsdWVzOiBUW10pOiBib29sZWFuIHwgdm9pZCB7XG4gICAgdGhpcy5fdmVyaWZ5VmFsdWVBc3NpZ25tZW50KHZhbHVlcyk7XG4gICAgdmFsdWVzLmZvckVhY2godmFsdWUgPT4gdGhpcy5fbWFya1NlbGVjdGVkKHZhbHVlKSk7XG4gICAgY29uc3QgY2hhbmdlZCA9IHRoaXMuX2hhc1F1ZXVlZENoYW5nZXMoKTtcbiAgICB0aGlzLl9lbWl0Q2hhbmdlRXZlbnQoKTtcbiAgICByZXR1cm4gY2hhbmdlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXNlbGVjdHMgYSB2YWx1ZSBvciBhbiBhcnJheSBvZiB2YWx1ZXMuXG4gICAqIEBwYXJhbSB2YWx1ZXMgVGhlIHZhbHVlcyB0byBkZXNlbGVjdFxuICAgKiBAcmV0dXJuIFdoZXRoZXIgdGhlIHNlbGVjdGlvbiBjaGFuZ2VkIGFzIGEgcmVzdWx0IG9mIHRoaXMgY2FsbFxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDE2LjAuMCBtYWtlIHJldHVybiB0eXBlIGJvb2xlYW5cbiAgICovXG4gIGRlc2VsZWN0KC4uLnZhbHVlczogVFtdKTogYm9vbGVhbiB8IHZvaWQge1xuICAgIHRoaXMuX3ZlcmlmeVZhbHVlQXNzaWdubWVudCh2YWx1ZXMpO1xuICAgIHZhbHVlcy5mb3JFYWNoKHZhbHVlID0+IHRoaXMuX3VubWFya1NlbGVjdGVkKHZhbHVlKSk7XG4gICAgY29uc3QgY2hhbmdlZCA9IHRoaXMuX2hhc1F1ZXVlZENoYW5nZXMoKTtcbiAgICB0aGlzLl9lbWl0Q2hhbmdlRXZlbnQoKTtcbiAgICByZXR1cm4gY2hhbmdlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBzZWxlY3RlZCB2YWx1ZXNcbiAgICogQHBhcmFtIHZhbHVlcyBUaGUgbmV3IHNlbGVjdGVkIHZhbHVlc1xuICAgKiBAcmV0dXJuIFdoZXRoZXIgdGhlIHNlbGVjdGlvbiBjaGFuZ2VkIGFzIGEgcmVzdWx0IG9mIHRoaXMgY2FsbFxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDE2LjAuMCBtYWtlIHJldHVybiB0eXBlIGJvb2xlYW5cbiAgICovXG4gIHNldFNlbGVjdGlvbiguLi52YWx1ZXM6IFRbXSk6IGJvb2xlYW4gfCB2b2lkIHtcbiAgICB0aGlzLl92ZXJpZnlWYWx1ZUFzc2lnbm1lbnQodmFsdWVzKTtcbiAgICBjb25zdCBvbGRWYWx1ZXMgPSB0aGlzLnNlbGVjdGVkO1xuICAgIGNvbnN0IG5ld1NlbGVjdGVkU2V0ID0gbmV3IFNldCh2YWx1ZXMpO1xuICAgIHZhbHVlcy5mb3JFYWNoKHZhbHVlID0+IHRoaXMuX21hcmtTZWxlY3RlZCh2YWx1ZSkpO1xuICAgIG9sZFZhbHVlc1xuICAgICAgLmZpbHRlcih2YWx1ZSA9PiAhbmV3U2VsZWN0ZWRTZXQuaGFzKHZhbHVlKSlcbiAgICAgIC5mb3JFYWNoKHZhbHVlID0+IHRoaXMuX3VubWFya1NlbGVjdGVkKHZhbHVlKSk7XG4gICAgY29uc3QgY2hhbmdlZCA9IHRoaXMuX2hhc1F1ZXVlZENoYW5nZXMoKTtcbiAgICB0aGlzLl9lbWl0Q2hhbmdlRXZlbnQoKTtcbiAgICByZXR1cm4gY2hhbmdlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGVzIGEgdmFsdWUgYmV0d2VlbiBzZWxlY3RlZCBhbmQgZGVzZWxlY3RlZC5cbiAgICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byB0b2dnbGVcbiAgICogQHJldHVybiBXaGV0aGVyIHRoZSBzZWxlY3Rpb24gY2hhbmdlZCBhcyBhIHJlc3VsdCBvZiB0aGlzIGNhbGxcbiAgICogQGJyZWFraW5nLWNoYW5nZSAxNi4wLjAgbWFrZSByZXR1cm4gdHlwZSBib29sZWFuXG4gICAqL1xuICB0b2dnbGUodmFsdWU6IFQpOiBib29sZWFuIHwgdm9pZCB7XG4gICAgcmV0dXJuIHRoaXMuaXNTZWxlY3RlZCh2YWx1ZSkgPyB0aGlzLmRlc2VsZWN0KHZhbHVlKSA6IHRoaXMuc2VsZWN0KHZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgYWxsIG9mIHRoZSBzZWxlY3RlZCB2YWx1ZXMuXG4gICAqIEBwYXJhbSBmbHVzaEV2ZW50IFdoZXRoZXIgdG8gZmx1c2ggdGhlIGNoYW5nZXMgaW4gYW4gZXZlbnQuXG4gICAqICAgSWYgZmFsc2UsIHRoZSBjaGFuZ2VzIHRvIHRoZSBzZWxlY3Rpb24gd2lsbCBiZSBmbHVzaGVkIGFsb25nIHdpdGggdGhlIG5leHQgZXZlbnQuXG4gICAqIEByZXR1cm4gV2hldGhlciB0aGUgc2VsZWN0aW9uIGNoYW5nZWQgYXMgYSByZXN1bHQgb2YgdGhpcyBjYWxsXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMTYuMC4wIG1ha2UgcmV0dXJuIHR5cGUgYm9vbGVhblxuICAgKi9cbiAgY2xlYXIoZmx1c2hFdmVudCA9IHRydWUpOiBib29sZWFuIHwgdm9pZCB7XG4gICAgdGhpcy5fdW5tYXJrQWxsKCk7XG4gICAgY29uc3QgY2hhbmdlZCA9IHRoaXMuX2hhc1F1ZXVlZENoYW5nZXMoKTtcbiAgICBpZiAoZmx1c2hFdmVudCkge1xuICAgICAgdGhpcy5fZW1pdENoYW5nZUV2ZW50KCk7XG4gICAgfVxuICAgIHJldHVybiBjaGFuZ2VkO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgd2hldGhlciBhIHZhbHVlIGlzIHNlbGVjdGVkLlxuICAgKi9cbiAgaXNTZWxlY3RlZCh2YWx1ZTogVCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9zZWxlY3Rpb24uaGFzKHRoaXMuX2dldENvbmNyZXRlVmFsdWUodmFsdWUpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgdGhlIG1vZGVsIGRvZXMgbm90IGhhdmUgYSB2YWx1ZS5cbiAgICovXG4gIGlzRW1wdHkoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbGVjdGlvbi5zaXplID09PSAwO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgd2hldGhlciB0aGUgbW9kZWwgaGFzIGEgdmFsdWUuXG4gICAqL1xuICBoYXNWYWx1ZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gIXRoaXMuaXNFbXB0eSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNvcnRzIHRoZSBzZWxlY3RlZCB2YWx1ZXMgYmFzZWQgb24gYSBwcmVkaWNhdGUgZnVuY3Rpb24uXG4gICAqL1xuICBzb3J0KHByZWRpY2F0ZT86IChhOiBULCBiOiBUKSA9PiBudW1iZXIpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fbXVsdGlwbGUgJiYgdGhpcy5zZWxlY3RlZCkge1xuICAgICAgdGhpcy5fc2VsZWN0ZWQhLnNvcnQocHJlZGljYXRlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB3aGV0aGVyIG11bHRpcGxlIHZhbHVlcyBjYW4gYmUgc2VsZWN0ZWQuXG4gICAqL1xuICBpc011bHRpcGxlU2VsZWN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9tdWx0aXBsZTtcbiAgfVxuXG4gIC8qKiBFbWl0cyBhIGNoYW5nZSBldmVudCBhbmQgY2xlYXJzIHRoZSByZWNvcmRzIG9mIHNlbGVjdGVkIGFuZCBkZXNlbGVjdGVkIHZhbHVlcy4gKi9cbiAgcHJpdmF0ZSBfZW1pdENoYW5nZUV2ZW50KCkge1xuICAgIC8vIENsZWFyIHRoZSBzZWxlY3RlZCB2YWx1ZXMgc28gdGhleSBjYW4gYmUgcmUtY2FjaGVkLlxuICAgIHRoaXMuX3NlbGVjdGVkID0gbnVsbDtcblxuICAgIGlmICh0aGlzLl9zZWxlY3RlZFRvRW1pdC5sZW5ndGggfHwgdGhpcy5fZGVzZWxlY3RlZFRvRW1pdC5sZW5ndGgpIHtcbiAgICAgIHRoaXMuY2hhbmdlZC5uZXh0KHtcbiAgICAgICAgc291cmNlOiB0aGlzLFxuICAgICAgICBhZGRlZDogdGhpcy5fc2VsZWN0ZWRUb0VtaXQsXG4gICAgICAgIHJlbW92ZWQ6IHRoaXMuX2Rlc2VsZWN0ZWRUb0VtaXQsXG4gICAgICB9KTtcblxuICAgICAgdGhpcy5fZGVzZWxlY3RlZFRvRW1pdCA9IFtdO1xuICAgICAgdGhpcy5fc2VsZWN0ZWRUb0VtaXQgPSBbXTtcbiAgICB9XG4gIH1cblxuICAvKiogU2VsZWN0cyBhIHZhbHVlLiAqL1xuICBwcml2YXRlIF9tYXJrU2VsZWN0ZWQodmFsdWU6IFQpIHtcbiAgICB2YWx1ZSA9IHRoaXMuX2dldENvbmNyZXRlVmFsdWUodmFsdWUpO1xuICAgIGlmICghdGhpcy5pc1NlbGVjdGVkKHZhbHVlKSkge1xuICAgICAgaWYgKCF0aGlzLl9tdWx0aXBsZSkge1xuICAgICAgICB0aGlzLl91bm1hcmtBbGwoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLmlzU2VsZWN0ZWQodmFsdWUpKSB7XG4gICAgICAgIHRoaXMuX3NlbGVjdGlvbi5hZGQodmFsdWUpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fZW1pdENoYW5nZXMpIHtcbiAgICAgICAgdGhpcy5fc2VsZWN0ZWRUb0VtaXQucHVzaCh2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIERlc2VsZWN0cyBhIHZhbHVlLiAqL1xuICBwcml2YXRlIF91bm1hcmtTZWxlY3RlZCh2YWx1ZTogVCkge1xuICAgIHZhbHVlID0gdGhpcy5fZ2V0Q29uY3JldGVWYWx1ZSh2YWx1ZSk7XG4gICAgaWYgKHRoaXMuaXNTZWxlY3RlZCh2YWx1ZSkpIHtcbiAgICAgIHRoaXMuX3NlbGVjdGlvbi5kZWxldGUodmFsdWUpO1xuXG4gICAgICBpZiAodGhpcy5fZW1pdENoYW5nZXMpIHtcbiAgICAgICAgdGhpcy5fZGVzZWxlY3RlZFRvRW1pdC5wdXNoKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogQ2xlYXJzIG91dCB0aGUgc2VsZWN0ZWQgdmFsdWVzLiAqL1xuICBwcml2YXRlIF91bm1hcmtBbGwoKSB7XG4gICAgaWYgKCF0aGlzLmlzRW1wdHkoKSkge1xuICAgICAgdGhpcy5fc2VsZWN0aW9uLmZvckVhY2godmFsdWUgPT4gdGhpcy5fdW5tYXJrU2VsZWN0ZWQodmFsdWUpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVmVyaWZpZXMgdGhlIHZhbHVlIGFzc2lnbm1lbnQgYW5kIHRocm93cyBhbiBlcnJvciBpZiB0aGUgc3BlY2lmaWVkIHZhbHVlIGFycmF5IGlzXG4gICAqIGluY2x1ZGluZyBtdWx0aXBsZSB2YWx1ZXMgd2hpbGUgdGhlIHNlbGVjdGlvbiBtb2RlbCBpcyBub3Qgc3VwcG9ydGluZyBtdWx0aXBsZSB2YWx1ZXMuXG4gICAqL1xuICBwcml2YXRlIF92ZXJpZnlWYWx1ZUFzc2lnbm1lbnQodmFsdWVzOiBUW10pIHtcbiAgICBpZiAodmFsdWVzLmxlbmd0aCA+IDEgJiYgIXRoaXMuX211bHRpcGxlICYmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpKSB7XG4gICAgICB0aHJvdyBnZXRNdWx0aXBsZVZhbHVlc0luU2luZ2xlU2VsZWN0aW9uRXJyb3IoKTtcbiAgICB9XG4gIH1cblxuICAvKiogV2hldGhlciB0aGVyZSBhcmUgcXVldWVkIHVwIGNoYW5nZSB0byBiZSBlbWl0dGVkLiAqL1xuICBwcml2YXRlIF9oYXNRdWV1ZWRDaGFuZ2VzKCkge1xuICAgIHJldHVybiAhISh0aGlzLl9kZXNlbGVjdGVkVG9FbWl0Lmxlbmd0aCB8fCB0aGlzLl9zZWxlY3RlZFRvRW1pdC5sZW5ndGgpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgYSB2YWx1ZSB0aGF0IGlzIGNvbXBhcmFibGUgdG8gaW5wdXRWYWx1ZSBieSBhcHBseWluZyBjb21wYXJlV2l0aCBmdW5jdGlvbiwgcmV0dXJucyB0aGUgc2FtZSBpbnB1dFZhbHVlIG90aGVyd2lzZS4gKi9cbiAgcHJpdmF0ZSBfZ2V0Q29uY3JldGVWYWx1ZShpbnB1dFZhbHVlOiBUKTogVCB7XG4gICAgaWYgKCF0aGlzLmNvbXBhcmVXaXRoKSB7XG4gICAgICByZXR1cm4gaW5wdXRWYWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChsZXQgc2VsZWN0ZWRWYWx1ZSBvZiB0aGlzLl9zZWxlY3Rpb24pIHtcbiAgICAgICAgaWYgKHRoaXMuY29tcGFyZVdpdGghKGlucHV0VmFsdWUsIHNlbGVjdGVkVmFsdWUpKSB7XG4gICAgICAgICAgcmV0dXJuIHNlbGVjdGVkVmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBpbnB1dFZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEV2ZW50IGVtaXR0ZWQgd2hlbiB0aGUgdmFsdWUgb2YgYSBNYXRTZWxlY3Rpb25Nb2RlbCBoYXMgY2hhbmdlZC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTZWxlY3Rpb25DaGFuZ2U8VD4ge1xuICAvKiogTW9kZWwgdGhhdCBkaXNwYXRjaGVkIHRoZSBldmVudC4gKi9cbiAgc291cmNlOiBTZWxlY3Rpb25Nb2RlbDxUPjtcbiAgLyoqIE9wdGlvbnMgdGhhdCB3ZXJlIGFkZGVkIHRvIHRoZSBtb2RlbC4gKi9cbiAgYWRkZWQ6IFRbXTtcbiAgLyoqIE9wdGlvbnMgdGhhdCB3ZXJlIHJlbW92ZWQgZnJvbSB0aGUgbW9kZWwuICovXG4gIHJlbW92ZWQ6IFRbXTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFuIGVycm9yIHRoYXQgcmVwb3J0cyB0aGF0IG11bHRpcGxlIHZhbHVlcyBhcmUgcGFzc2VkIGludG8gYSBzZWxlY3Rpb24gbW9kZWxcbiAqIHdpdGggYSBzaW5nbGUgdmFsdWUuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRNdWx0aXBsZVZhbHVlc0luU2luZ2xlU2VsZWN0aW9uRXJyb3IoKSB7XG4gIHJldHVybiBFcnJvcignQ2Fubm90IHBhc3MgbXVsdGlwbGUgdmFsdWVzIGludG8gU2VsZWN0aW9uTW9kZWwgd2l0aCBzaW5nbGUtdmFsdWUgbW9kZS4nKTtcbn1cbiJdfQ==