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
            .filter(value => !newSelectedSet.has(this._getConcreteValue(value, newSelectedSet)))
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
    _getConcreteValue(inputValue, selection) {
        if (!this.compareWith) {
            return inputValue;
        }
        else {
            selection = selection ?? this._selection;
            for (let selectedValue of selection) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0aW9uLW1vZGVsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9jb2xsZWN0aW9ucy9zZWxlY3Rpb24tbW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUU3Qjs7R0FFRztBQUNILE1BQU0sT0FBTyxjQUFjO0lBYXpCLHVCQUF1QjtJQUN2QixJQUFJLFFBQVE7UUFDVixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNuQixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1NBQ3ZEO1FBRUQsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQ3hCLENBQUM7SUFLRCxZQUNVLFlBQVksS0FBSyxFQUN6Qix1QkFBNkIsRUFDckIsZUFBZSxJQUFJLEVBQ3BCLFdBQXVDO1FBSHRDLGNBQVMsR0FBVCxTQUFTLENBQVE7UUFFakIsaUJBQVksR0FBWixZQUFZLENBQU87UUFDcEIsZ0JBQVcsR0FBWCxXQUFXLENBQTRCO1FBNUJoRCxpQ0FBaUM7UUFDekIsZUFBVSxHQUFHLElBQUksR0FBRyxFQUFLLENBQUM7UUFFbEMsMkZBQTJGO1FBQ25GLHNCQUFpQixHQUFRLEVBQUUsQ0FBQztRQUVwQyx5RkFBeUY7UUFDakYsb0JBQWUsR0FBUSxFQUFFLENBQUM7UUFjbEMsZ0RBQWdEO1FBQ3ZDLFlBQU8sR0FBRyxJQUFJLE9BQU8sRUFBc0IsQ0FBQztRQVFuRCxJQUFJLHVCQUF1QixJQUFJLHVCQUF1QixDQUFDLE1BQU0sRUFBRTtZQUM3RCxJQUFJLFNBQVMsRUFBRTtnQkFDYix1QkFBdUIsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FB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LHVDQUF1QyxFQUFFLENBQUM7U0FDakQ7SUFDSCxDQUFDO0lBRUQsd0RBQXdEO0lBQ2hELGlCQUFpQjtRQUN2QixPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMxRSxDQUFDO0lBRUQsZ0lBQWdJO0lBQ3hILGlCQUFpQixDQUFDLFVBQWEsRUFBRSxTQUFrQjtRQUN6RCxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNyQixPQUFPLFVBQVUsQ0FBQztTQUNuQjthQUFNO1lBQ0wsU0FBUyxHQUFHLFNBQVMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQ3pDLEtBQUssSUFBSSxhQUFhLElBQUksU0FBUyxFQUFFO2dCQUNuQyxJQUFJLElBQUksQ0FBQyxXQUFZLENBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxFQUFFO29CQUNoRCxPQUFPLGFBQWEsQ0FBQztpQkFDdEI7YUFDRjtZQUNELE9BQU8sVUFBVSxDQUFDO1NBQ25CO0lBQ0gsQ0FBQztDQUNGO0FBZUQ7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSx1Q0FBdUM7SUFDckQsT0FBTyxLQUFLLENBQUMseUVBQXlFLENBQUMsQ0FBQztBQUMxRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U3ViamVjdH0gZnJvbSAncnhqcyc7XG5cbi8qKlxuICogQ2xhc3MgdG8gYmUgdXNlZCB0byBwb3dlciBzZWxlY3Rpbmcgb25lIG9yIG1vcmUgb3B0aW9ucyBmcm9tIGEgbGlzdC5cbiAqL1xuZXhwb3J0IGNsYXNzIFNlbGVjdGlvbk1vZGVsPFQ+IHtcbiAgLyoqIEN1cnJlbnRseS1zZWxlY3RlZCB2YWx1ZXMuICovXG4gIHByaXZhdGUgX3NlbGVjdGlvbiA9IG5ldyBTZXQ8VD4oKTtcblxuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIGRlc2VsZWN0ZWQgb3B0aW9ucyB0aGF0IGhhdmVuJ3QgYmVlbiBlbWl0dGVkIGJ5IHRoZSBjaGFuZ2UgZXZlbnQuICovXG4gIHByaXZhdGUgX2Rlc2VsZWN0ZWRUb0VtaXQ6IFRbXSA9IFtdO1xuXG4gIC8qKiBLZWVwcyB0cmFjayBvZiB0aGUgc2VsZWN0ZWQgb3B0aW9ucyB0aGF0IGhhdmVuJ3QgYmVlbiBlbWl0dGVkIGJ5IHRoZSBjaGFuZ2UgZXZlbnQuICovXG4gIHByaXZhdGUgX3NlbGVjdGVkVG9FbWl0OiBUW10gPSBbXTtcblxuICAvKiogQ2FjaGUgZm9yIHRoZSBhcnJheSB2YWx1ZSBvZiB0aGUgc2VsZWN0ZWQgaXRlbXMuICovXG4gIHByaXZhdGUgX3NlbGVjdGVkOiBUW10gfCBudWxsO1xuXG4gIC8qKiBTZWxlY3RlZCB2YWx1ZXMuICovXG4gIGdldCBzZWxlY3RlZCgpOiBUW10ge1xuICAgIGlmICghdGhpcy5fc2VsZWN0ZWQpIHtcbiAgICAgIHRoaXMuX3NlbGVjdGVkID0gQXJyYXkuZnJvbSh0aGlzLl9zZWxlY3Rpb24udmFsdWVzKCkpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9zZWxlY3RlZDtcbiAgfVxuXG4gIC8qKiBFdmVudCBlbWl0dGVkIHdoZW4gdGhlIHZhbHVlIGhhcyBjaGFuZ2VkLiAqL1xuICByZWFkb25seSBjaGFuZ2VkID0gbmV3IFN1YmplY3Q8U2VsZWN0aW9uQ2hhbmdlPFQ+PigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgX211bHRpcGxlID0gZmFsc2UsXG4gICAgaW5pdGlhbGx5U2VsZWN0ZWRWYWx1ZXM/OiBUW10sXG4gICAgcHJpdmF0ZSBfZW1pdENoYW5nZXMgPSB0cnVlLFxuICAgIHB1YmxpYyBjb21wYXJlV2l0aD86IChvMTogVCwgbzI6IFQpID0+IGJvb2xlYW4sXG4gICkge1xuICAgIGlmIChpbml0aWFsbHlTZWxlY3RlZFZhbHVlcyAmJiBpbml0aWFsbHlTZWxlY3RlZFZhbHVlcy5sZW5ndGgpIHtcbiAgICAgIGlmIChfbXVsdGlwbGUpIHtcbiAgICAgICAgaW5pdGlhbGx5U2VsZWN0ZWRWYWx1ZXMuZm9yRWFjaCh2YWx1ZSA9PiB0aGlzLl9tYXJrU2VsZWN0ZWQodmFsdWUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX21hcmtTZWxlY3RlZChpbml0aWFsbHlTZWxlY3RlZFZhbHVlc1swXSk7XG4gICAgICB9XG5cbiAgICAgIC8vIENsZWFyIHRoZSBhcnJheSBpbiBvcmRlciB0byBhdm9pZCBmaXJpbmcgdGhlIGNoYW5nZSBldmVudCBmb3IgcHJlc2VsZWN0ZWQgdmFsdWVzLlxuICAgICAgdGhpcy5fc2VsZWN0ZWRUb0VtaXQubGVuZ3RoID0gMDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2VsZWN0cyBhIHZhbHVlIG9yIGFuIGFycmF5IG9mIHZhbHVlcy5cbiAgICogQHBhcmFtIHZhbHVlcyBUaGUgdmFsdWVzIHRvIHNlbGVjdFxuICAgKiBAcmV0dXJuIFdoZXRoZXIgdGhlIHNlbGVjdGlvbiBjaGFuZ2VkIGFzIGEgcmVzdWx0IG9mIHRoaXMgY2FsbFxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDE2LjAuMCBtYWtlIHJldHVybiB0eXBlIGJvb2xlYW5cbiAgICovXG4gIHNlbGVjdCguLi52YWx1ZXM6IFRbXSk6IGJvb2xlYW4gfCB2b2lkIHtcbiAgICB0aGlzLl92ZXJpZnlWYWx1ZUFzc2lnbm1lbnQodmFsdWVzKTtcbiAgICB2YWx1ZXMuZm9yRWFjaCh2YWx1ZSA9PiB0aGlzLl9tYXJrU2VsZWN0ZWQodmFsdWUpKTtcbiAgICBjb25zdCBjaGFuZ2VkID0gdGhpcy5faGFzUXVldWVkQ2hhbmdlcygpO1xuICAgIHRoaXMuX2VtaXRDaGFuZ2VFdmVudCgpO1xuICAgIHJldHVybiBjaGFuZ2VkO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc2VsZWN0cyBhIHZhbHVlIG9yIGFuIGFycmF5IG9mIHZhbHVlcy5cbiAgICogQHBhcmFtIHZhbHVlcyBUaGUgdmFsdWVzIHRvIGRlc2VsZWN0XG4gICAqIEByZXR1cm4gV2hldGhlciB0aGUgc2VsZWN0aW9uIGNoYW5nZWQgYXMgYSByZXN1bHQgb2YgdGhpcyBjYWxsXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMTYuMC4wIG1ha2UgcmV0dXJuIHR5cGUgYm9vbGVhblxuICAgKi9cbiAgZGVzZWxlY3QoLi4udmFsdWVzOiBUW10pOiBib29sZWFuIHwgdm9pZCB7XG4gICAgdGhpcy5fdmVyaWZ5VmFsdWVBc3NpZ25tZW50KHZhbHVlcyk7XG4gICAgdmFsdWVzLmZvckVhY2godmFsdWUgPT4gdGhpcy5fdW5tYXJrU2VsZWN0ZWQodmFsdWUpKTtcbiAgICBjb25zdCBjaGFuZ2VkID0gdGhpcy5faGFzUXVldWVkQ2hhbmdlcygpO1xuICAgIHRoaXMuX2VtaXRDaGFuZ2VFdmVudCgpO1xuICAgIHJldHVybiBjaGFuZ2VkO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHNlbGVjdGVkIHZhbHVlc1xuICAgKiBAcGFyYW0gdmFsdWVzIFRoZSBuZXcgc2VsZWN0ZWQgdmFsdWVzXG4gICAqIEByZXR1cm4gV2hldGhlciB0aGUgc2VsZWN0aW9uIGNoYW5nZWQgYXMgYSByZXN1bHQgb2YgdGhpcyBjYWxsXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMTYuMC4wIG1ha2UgcmV0dXJuIHR5cGUgYm9vbGVhblxuICAgKi9cbiAgc2V0U2VsZWN0aW9uKC4uLnZhbHVlczogVFtdKTogYm9vbGVhbiB8IHZvaWQge1xuICAgIHRoaXMuX3ZlcmlmeVZhbHVlQXNzaWdubWVudCh2YWx1ZXMpO1xuICAgIGNvbnN0IG9sZFZhbHVlcyA9IHRoaXMuc2VsZWN0ZWQ7XG4gICAgY29uc3QgbmV3U2VsZWN0ZWRTZXQgPSBuZXcgU2V0KHZhbHVlcyk7XG4gICAgdmFsdWVzLmZvckVhY2godmFsdWUgPT4gdGhpcy5fbWFya1NlbGVjdGVkKHZhbHVlKSk7XG4gICAgb2xkVmFsdWVzXG4gICAgICAuZmlsdGVyKHZhbHVlID0+ICFuZXdTZWxlY3RlZFNldC5oYXModGhpcy5fZ2V0Q29uY3JldGVWYWx1ZSh2YWx1ZSwgbmV3U2VsZWN0ZWRTZXQpKSlcbiAgICAgIC5mb3JFYWNoKHZhbHVlID0+IHRoaXMuX3VubWFya1NlbGVjdGVkKHZhbHVlKSk7XG4gICAgY29uc3QgY2hhbmdlZCA9IHRoaXMuX2hhc1F1ZXVlZENoYW5nZXMoKTtcbiAgICB0aGlzLl9lbWl0Q2hhbmdlRXZlbnQoKTtcbiAgICByZXR1cm4gY2hhbmdlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGVzIGEgdmFsdWUgYmV0d2VlbiBzZWxlY3RlZCBhbmQgZGVzZWxlY3RlZC5cbiAgICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byB0b2dnbGVcbiAgICogQHJldHVybiBXaGV0aGVyIHRoZSBzZWxlY3Rpb24gY2hhbmdlZCBhcyBhIHJlc3VsdCBvZiB0aGlzIGNhbGxcbiAgICogQGJyZWFraW5nLWNoYW5nZSAxNi4wLjAgbWFrZSByZXR1cm4gdHlwZSBib29sZWFuXG4gICAqL1xuICB0b2dnbGUodmFsdWU6IFQpOiBib29sZWFuIHwgdm9pZCB7XG4gICAgcmV0dXJuIHRoaXMuaXNTZWxlY3RlZCh2YWx1ZSkgPyB0aGlzLmRlc2VsZWN0KHZhbHVlKSA6IHRoaXMuc2VsZWN0KHZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgYWxsIG9mIHRoZSBzZWxlY3RlZCB2YWx1ZXMuXG4gICAqIEBwYXJhbSBmbHVzaEV2ZW50IFdoZXRoZXIgdG8gZmx1c2ggdGhlIGNoYW5nZXMgaW4gYW4gZXZlbnQuXG4gICAqICAgSWYgZmFsc2UsIHRoZSBjaGFuZ2VzIHRvIHRoZSBzZWxlY3Rpb24gd2lsbCBiZSBmbHVzaGVkIGFsb25nIHdpdGggdGhlIG5leHQgZXZlbnQuXG4gICAqIEByZXR1cm4gV2hldGhlciB0aGUgc2VsZWN0aW9uIGNoYW5nZWQgYXMgYSByZXN1bHQgb2YgdGhpcyBjYWxsXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMTYuMC4wIG1ha2UgcmV0dXJuIHR5cGUgYm9vbGVhblxuICAgKi9cbiAgY2xlYXIoZmx1c2hFdmVudCA9IHRydWUpOiBib29sZWFuIHwgdm9pZCB7XG4gICAgdGhpcy5fdW5tYXJrQWxsKCk7XG4gICAgY29uc3QgY2hhbmdlZCA9IHRoaXMuX2hhc1F1ZXVlZENoYW5nZXMoKTtcbiAgICBpZiAoZmx1c2hFdmVudCkge1xuICAgICAgdGhpcy5fZW1pdENoYW5nZUV2ZW50KCk7XG4gICAgfVxuICAgIHJldHVybiBjaGFuZ2VkO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgd2hldGhlciBhIHZhbHVlIGlzIHNlbGVjdGVkLlxuICAgKi9cbiAgaXNTZWxlY3RlZCh2YWx1ZTogVCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9zZWxlY3Rpb24uaGFzKHRoaXMuX2dldENvbmNyZXRlVmFsdWUodmFsdWUpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgdGhlIG1vZGVsIGRvZXMgbm90IGhhdmUgYSB2YWx1ZS5cbiAgICovXG4gIGlzRW1wdHkoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbGVjdGlvbi5zaXplID09PSAwO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgd2hldGhlciB0aGUgbW9kZWwgaGFzIGEgdmFsdWUuXG4gICAqL1xuICBoYXNWYWx1ZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gIXRoaXMuaXNFbXB0eSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNvcnRzIHRoZSBzZWxlY3RlZCB2YWx1ZXMgYmFzZWQgb24gYSBwcmVkaWNhdGUgZnVuY3Rpb24uXG4gICAqL1xuICBzb3J0KHByZWRpY2F0ZT86IChhOiBULCBiOiBUKSA9PiBudW1iZXIpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fbXVsdGlwbGUgJiYgdGhpcy5zZWxlY3RlZCkge1xuICAgICAgdGhpcy5fc2VsZWN0ZWQhLnNvcnQocHJlZGljYXRlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB3aGV0aGVyIG11bHRpcGxlIHZhbHVlcyBjYW4gYmUgc2VsZWN0ZWQuXG4gICAqL1xuICBpc011bHRpcGxlU2VsZWN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9tdWx0aXBsZTtcbiAgfVxuXG4gIC8qKiBFbWl0cyBhIGNoYW5nZSBldmVudCBhbmQgY2xlYXJzIHRoZSByZWNvcmRzIG9mIHNlbGVjdGVkIGFuZCBkZXNlbGVjdGVkIHZhbHVlcy4gKi9cbiAgcHJpdmF0ZSBfZW1pdENoYW5nZUV2ZW50KCkge1xuICAgIC8vIENsZWFyIHRoZSBzZWxlY3RlZCB2YWx1ZXMgc28gdGhleSBjYW4gYmUgcmUtY2FjaGVkLlxuICAgIHRoaXMuX3NlbGVjdGVkID0gbnVsbDtcblxuICAgIGlmICh0aGlzLl9zZWxlY3RlZFRvRW1pdC5sZW5ndGggfHwgdGhpcy5fZGVzZWxlY3RlZFRvRW1pdC5sZW5ndGgpIHtcbiAgICAgIHRoaXMuY2hhbmdlZC5uZXh0KHtcbiAgICAgICAgc291cmNlOiB0aGlzLFxuICAgICAgICBhZGRlZDogdGhpcy5fc2VsZWN0ZWRUb0VtaXQsXG4gICAgICAgIHJlbW92ZWQ6IHRoaXMuX2Rlc2VsZWN0ZWRUb0VtaXQsXG4gICAgICB9KTtcblxuICAgICAgdGhpcy5fZGVzZWxlY3RlZFRvRW1pdCA9IFtdO1xuICAgICAgdGhpcy5fc2VsZWN0ZWRUb0VtaXQgPSBbXTtcbiAgICB9XG4gIH1cblxuICAvKiogU2VsZWN0cyBhIHZhbHVlLiAqL1xuICBwcml2YXRlIF9tYXJrU2VsZWN0ZWQodmFsdWU6IFQpIHtcbiAgICB2YWx1ZSA9IHRoaXMuX2dldENvbmNyZXRlVmFsdWUodmFsdWUpO1xuICAgIGlmICghdGhpcy5pc1NlbGVjdGVkKHZhbHVlKSkge1xuICAgICAgaWYgKCF0aGlzLl9tdWx0aXBsZSkge1xuICAgICAgICB0aGlzLl91bm1hcmtBbGwoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLmlzU2VsZWN0ZWQodmFsdWUpKSB7XG4gICAgICAgIHRoaXMuX3NlbGVjdGlvbi5hZGQodmFsdWUpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fZW1pdENoYW5nZXMpIHtcbiAgICAgICAgdGhpcy5fc2VsZWN0ZWRUb0VtaXQucHVzaCh2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIERlc2VsZWN0cyBhIHZhbHVlLiAqL1xuICBwcml2YXRlIF91bm1hcmtTZWxlY3RlZCh2YWx1ZTogVCkge1xuICAgIHZhbHVlID0gdGhpcy5fZ2V0Q29uY3JldGVWYWx1ZSh2YWx1ZSk7XG4gICAgaWYgKHRoaXMuaXNTZWxlY3RlZCh2YWx1ZSkpIHtcbiAgICAgIHRoaXMuX3NlbGVjdGlvbi5kZWxldGUodmFsdWUpO1xuXG4gICAgICBpZiAodGhpcy5fZW1pdENoYW5nZXMpIHtcbiAgICAgICAgdGhpcy5fZGVzZWxlY3RlZFRvRW1pdC5wdXNoKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogQ2xlYXJzIG91dCB0aGUgc2VsZWN0ZWQgdmFsdWVzLiAqL1xuICBwcml2YXRlIF91bm1hcmtBbGwoKSB7XG4gICAgaWYgKCF0aGlzLmlzRW1wdHkoKSkge1xuICAgICAgdGhpcy5fc2VsZWN0aW9uLmZvckVhY2godmFsdWUgPT4gdGhpcy5fdW5tYXJrU2VsZWN0ZWQodmFsdWUpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVmVyaWZpZXMgdGhlIHZhbHVlIGFzc2lnbm1lbnQgYW5kIHRocm93cyBhbiBlcnJvciBpZiB0aGUgc3BlY2lmaWVkIHZhbHVlIGFycmF5IGlzXG4gICAqIGluY2x1ZGluZyBtdWx0aXBsZSB2YWx1ZXMgd2hpbGUgdGhlIHNlbGVjdGlvbiBtb2RlbCBpcyBub3Qgc3VwcG9ydGluZyBtdWx0aXBsZSB2YWx1ZXMuXG4gICAqL1xuICBwcml2YXRlIF92ZXJpZnlWYWx1ZUFzc2lnbm1lbnQodmFsdWVzOiBUW10pIHtcbiAgICBpZiAodmFsdWVzLmxlbmd0aCA+IDEgJiYgIXRoaXMuX211bHRpcGxlICYmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpKSB7XG4gICAgICB0aHJvdyBnZXRNdWx0aXBsZVZhbHVlc0luU2luZ2xlU2VsZWN0aW9uRXJyb3IoKTtcbiAgICB9XG4gIH1cblxuICAvKiogV2hldGhlciB0aGVyZSBhcmUgcXVldWVkIHVwIGNoYW5nZSB0byBiZSBlbWl0dGVkLiAqL1xuICBwcml2YXRlIF9oYXNRdWV1ZWRDaGFuZ2VzKCkge1xuICAgIHJldHVybiAhISh0aGlzLl9kZXNlbGVjdGVkVG9FbWl0Lmxlbmd0aCB8fCB0aGlzLl9zZWxlY3RlZFRvRW1pdC5sZW5ndGgpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgYSB2YWx1ZSB0aGF0IGlzIGNvbXBhcmFibGUgdG8gaW5wdXRWYWx1ZSBieSBhcHBseWluZyBjb21wYXJlV2l0aCBmdW5jdGlvbiwgcmV0dXJucyB0aGUgc2FtZSBpbnB1dFZhbHVlIG90aGVyd2lzZS4gKi9cbiAgcHJpdmF0ZSBfZ2V0Q29uY3JldGVWYWx1ZShpbnB1dFZhbHVlOiBULCBzZWxlY3Rpb24/OiBTZXQ8VD4pOiBUIHtcbiAgICBpZiAoIXRoaXMuY29tcGFyZVdpdGgpIHtcbiAgICAgIHJldHVybiBpbnB1dFZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWxlY3Rpb24gPSBzZWxlY3Rpb24gPz8gdGhpcy5fc2VsZWN0aW9uO1xuICAgICAgZm9yIChsZXQgc2VsZWN0ZWRWYWx1ZSBvZiBzZWxlY3Rpb24pIHtcbiAgICAgICAgaWYgKHRoaXMuY29tcGFyZVdpdGghKGlucHV0VmFsdWUsIHNlbGVjdGVkVmFsdWUpKSB7XG4gICAgICAgICAgcmV0dXJuIHNlbGVjdGVkVmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBpbnB1dFZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEV2ZW50IGVtaXR0ZWQgd2hlbiB0aGUgdmFsdWUgb2YgYSBNYXRTZWxlY3Rpb25Nb2RlbCBoYXMgY2hhbmdlZC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTZWxlY3Rpb25DaGFuZ2U8VD4ge1xuICAvKiogTW9kZWwgdGhhdCBkaXNwYXRjaGVkIHRoZSBldmVudC4gKi9cbiAgc291cmNlOiBTZWxlY3Rpb25Nb2RlbDxUPjtcbiAgLyoqIE9wdGlvbnMgdGhhdCB3ZXJlIGFkZGVkIHRvIHRoZSBtb2RlbC4gKi9cbiAgYWRkZWQ6IFRbXTtcbiAgLyoqIE9wdGlvbnMgdGhhdCB3ZXJlIHJlbW92ZWQgZnJvbSB0aGUgbW9kZWwuICovXG4gIHJlbW92ZWQ6IFRbXTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFuIGVycm9yIHRoYXQgcmVwb3J0cyB0aGF0IG11bHRpcGxlIHZhbHVlcyBhcmUgcGFzc2VkIGludG8gYSBzZWxlY3Rpb24gbW9kZWxcbiAqIHdpdGggYSBzaW5nbGUgdmFsdWUuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRNdWx0aXBsZVZhbHVlc0luU2luZ2xlU2VsZWN0aW9uRXJyb3IoKSB7XG4gIHJldHVybiBFcnJvcignQ2Fubm90IHBhc3MgbXVsdGlwbGUgdmFsdWVzIGludG8gU2VsZWN0aW9uTW9kZWwgd2l0aCBzaW5nbGUtdmFsdWUgbW9kZS4nKTtcbn1cbiJdfQ==