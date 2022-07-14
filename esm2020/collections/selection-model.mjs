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
    /** Selected values. */
    get selected() {
        if (!this._selected) {
            this._selected = Array.from(this._selection.values());
        }
        return this._selected;
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
        if (this.compareWith) {
            for (const otherValue of this._selection) {
                if (this.compareWith(otherValue, value)) {
                    return true;
                }
            }
            return false;
        }
        return this._selection.has(value);
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
}
/**
 * Returns an error that reports that multiple values are passed into a selection model
 * with a single value.
 * @docs-private
 */
export function getMultipleValuesInSingleSelectionError() {
    return Error('Cannot pass multiple values into SelectionModel with single-value mode.');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0aW9uLW1vZGVsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9jb2xsZWN0aW9ucy9zZWxlY3Rpb24tbW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUU3Qjs7R0FFRztBQUNILE1BQU0sT0FBTyxjQUFjO0lBeUJ6QixZQUNVLFlBQVksS0FBSyxFQUN6Qix1QkFBNkIsRUFDckIsZUFBZSxJQUFJLEVBQ3BCLFdBQXVDO1FBSHRDLGNBQVMsR0FBVCxTQUFTLENBQVE7UUFFakIsaUJBQVksR0FBWixZQUFZLENBQU87UUFDcEIsZ0JBQVcsR0FBWCxXQUFXLENBQTRCO1FBNUJoRCxpQ0FBaUM7UUFDekIsZUFBVSxHQUFHLElBQUksR0FBRyxFQUFLLENBQUM7UUFFbEMsMkZBQTJGO1FBQ25GLHNCQUFpQixHQUFRLEVBQUUsQ0FBQztRQUVwQyx5RkFBeUY7UUFDakYsb0JBQWUsR0FBUSxFQUFFLENBQUM7UUFjbEMsZ0RBQWdEO1FBQ3ZDLFlBQU8sR0FBRyxJQUFJLE9BQU8sRUFBc0IsQ0FBQztRQVFuRCxJQUFJLHVCQUF1QixJQUFJLHVCQUF1QixDQUFDLE1BQU0sRUFBRTtZQUM3RCxJQUFJLFNBQVMsRUFBRTtnQkFDYix1QkFBdUIsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7YUFDckU7aUJBQU07Z0JBQ0wsSUFBSSxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ2hEO1lBRUQsb0ZBQW9GO1lBQ3BGLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztTQUNqQztJQUNILENBQUM7SUE1QkQsdUJBQXVCO0lBQ3ZCLElBQUksUUFBUTtRQUNW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QUFTLENBQUMsRUFBRTtZQUMzRixNQUFNLHVDQUF1QyxFQUFFLENBQUM7U0FDakQ7SUFDSCxDQUFDO0lBRUQsd0RBQXdEO0lBQ2hELGlCQUFpQjtRQUN2QixPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMxRSxDQUFDO0NBQ0Y7QUFlRDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLHVDQUF1QztJQUNyRCxPQUFPLEtBQUssQ0FBQyx5RUFBeUUsQ0FBQyxDQUFDO0FBQzFGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTdWJqZWN0fSBmcm9tICdyeGpzJztcblxuLyoqXG4gKiBDbGFzcyB0byBiZSB1c2VkIHRvIHBvd2VyIHNlbGVjdGluZyBvbmUgb3IgbW9yZSBvcHRpb25zIGZyb20gYSBsaXN0LlxuICovXG5leHBvcnQgY2xhc3MgU2VsZWN0aW9uTW9kZWw8VD4ge1xuICAvKiogQ3VycmVudGx5LXNlbGVjdGVkIHZhbHVlcy4gKi9cbiAgcHJpdmF0ZSBfc2VsZWN0aW9uID0gbmV3IFNldDxUPigpO1xuXG4gIC8qKiBLZWVwcyB0cmFjayBvZiB0aGUgZGVzZWxlY3RlZCBvcHRpb25zIHRoYXQgaGF2ZW4ndCBiZWVuIGVtaXR0ZWQgYnkgdGhlIGNoYW5nZSBldmVudC4gKi9cbiAgcHJpdmF0ZSBfZGVzZWxlY3RlZFRvRW1pdDogVFtdID0gW107XG5cbiAgLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBzZWxlY3RlZCBvcHRpb25zIHRoYXQgaGF2ZW4ndCBiZWVuIGVtaXR0ZWQgYnkgdGhlIGNoYW5nZSBldmVudC4gKi9cbiAgcHJpdmF0ZSBfc2VsZWN0ZWRUb0VtaXQ6IFRbXSA9IFtdO1xuXG4gIC8qKiBDYWNoZSBmb3IgdGhlIGFycmF5IHZhbHVlIG9mIHRoZSBzZWxlY3RlZCBpdGVtcy4gKi9cbiAgcHJpdmF0ZSBfc2VsZWN0ZWQ6IFRbXSB8IG51bGw7XG5cbiAgLyoqIFNlbGVjdGVkIHZhbHVlcy4gKi9cbiAgZ2V0IHNlbGVjdGVkKCk6IFRbXSB7XG4gICAgaWYgKCF0aGlzLl9zZWxlY3RlZCkge1xuICAgICAgdGhpcy5fc2VsZWN0ZWQgPSBBcnJheS5mcm9tKHRoaXMuX3NlbGVjdGlvbi52YWx1ZXMoKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX3NlbGVjdGVkO1xuICB9XG5cbiAgLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiB0aGUgdmFsdWUgaGFzIGNoYW5nZWQuICovXG4gIHJlYWRvbmx5IGNoYW5nZWQgPSBuZXcgU3ViamVjdDxTZWxlY3Rpb25DaGFuZ2U8VD4+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfbXVsdGlwbGUgPSBmYWxzZSxcbiAgICBpbml0aWFsbHlTZWxlY3RlZFZhbHVlcz86IFRbXSxcbiAgICBwcml2YXRlIF9lbWl0Q2hhbmdlcyA9IHRydWUsXG4gICAgcHVibGljIGNvbXBhcmVXaXRoPzogKG8xOiBULCBvMjogVCkgPT4gYm9vbGVhbixcbiAgKSB7XG4gICAgaWYgKGluaXRpYWxseVNlbGVjdGVkVmFsdWVzICYmIGluaXRpYWxseVNlbGVjdGVkVmFsdWVzLmxlbmd0aCkge1xuICAgICAgaWYgKF9tdWx0aXBsZSkge1xuICAgICAgICBpbml0aWFsbHlTZWxlY3RlZFZhbHVlcy5mb3JFYWNoKHZhbHVlID0+IHRoaXMuX21hcmtTZWxlY3RlZCh2YWx1ZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fbWFya1NlbGVjdGVkKGluaXRpYWxseVNlbGVjdGVkVmFsdWVzWzBdKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2xlYXIgdGhlIGFycmF5IGluIG9yZGVyIHRvIGF2b2lkIGZpcmluZyB0aGUgY2hhbmdlIGV2ZW50IGZvciBwcmVzZWxlY3RlZCB2YWx1ZXMuXG4gICAgICB0aGlzLl9zZWxlY3RlZFRvRW1pdC5sZW5ndGggPSAwO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZWxlY3RzIGEgdmFsdWUgb3IgYW4gYXJyYXkgb2YgdmFsdWVzLlxuICAgKiBAcGFyYW0gdmFsdWVzIFRoZSB2YWx1ZXMgdG8gc2VsZWN0XG4gICAqIEByZXR1cm4gV2hldGhlciB0aGUgc2VsZWN0aW9uIGNoYW5nZWQgYXMgYSByZXN1bHQgb2YgdGhpcyBjYWxsXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMTYuMC4wIG1ha2UgcmV0dXJuIHR5cGUgYm9vbGVhblxuICAgKi9cbiAgc2VsZWN0KC4uLnZhbHVlczogVFtdKTogYm9vbGVhbiB8IHZvaWQge1xuICAgIHRoaXMuX3ZlcmlmeVZhbHVlQXNzaWdubWVudCh2YWx1ZXMpO1xuICAgIHZhbHVlcy5mb3JFYWNoKHZhbHVlID0+IHRoaXMuX21hcmtTZWxlY3RlZCh2YWx1ZSkpO1xuICAgIGNvbnN0IGNoYW5nZWQgPSB0aGlzLl9oYXNRdWV1ZWRDaGFuZ2VzKCk7XG4gICAgdGhpcy5fZW1pdENoYW5nZUV2ZW50KCk7XG4gICAgcmV0dXJuIGNoYW5nZWQ7XG4gIH1cblxuICAvKipcbiAgICogRGVzZWxlY3RzIGEgdmFsdWUgb3IgYW4gYXJyYXkgb2YgdmFsdWVzLlxuICAgKiBAcGFyYW0gdmFsdWVzIFRoZSB2YWx1ZXMgdG8gZGVzZWxlY3RcbiAgICogQHJldHVybiBXaGV0aGVyIHRoZSBzZWxlY3Rpb24gY2hhbmdlZCBhcyBhIHJlc3VsdCBvZiB0aGlzIGNhbGxcbiAgICogQGJyZWFraW5nLWNoYW5nZSAxNi4wLjAgbWFrZSByZXR1cm4gdHlwZSBib29sZWFuXG4gICAqL1xuICBkZXNlbGVjdCguLi52YWx1ZXM6IFRbXSk6IGJvb2xlYW4gfCB2b2lkIHtcbiAgICB0aGlzLl92ZXJpZnlWYWx1ZUFzc2lnbm1lbnQodmFsdWVzKTtcbiAgICB2YWx1ZXMuZm9yRWFjaCh2YWx1ZSA9PiB0aGlzLl91bm1hcmtTZWxlY3RlZCh2YWx1ZSkpO1xuICAgIGNvbnN0IGNoYW5nZWQgPSB0aGlzLl9oYXNRdWV1ZWRDaGFuZ2VzKCk7XG4gICAgdGhpcy5fZW1pdENoYW5nZUV2ZW50KCk7XG4gICAgcmV0dXJuIGNoYW5nZWQ7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgc2VsZWN0ZWQgdmFsdWVzXG4gICAqIEBwYXJhbSB2YWx1ZXMgVGhlIG5ldyBzZWxlY3RlZCB2YWx1ZXNcbiAgICogQHJldHVybiBXaGV0aGVyIHRoZSBzZWxlY3Rpb24gY2hhbmdlZCBhcyBhIHJlc3VsdCBvZiB0aGlzIGNhbGxcbiAgICogQGJyZWFraW5nLWNoYW5nZSAxNi4wLjAgbWFrZSByZXR1cm4gdHlwZSBib29sZWFuXG4gICAqL1xuICBzZXRTZWxlY3Rpb24oLi4udmFsdWVzOiBUW10pOiBib29sZWFuIHwgdm9pZCB7XG4gICAgdGhpcy5fdmVyaWZ5VmFsdWVBc3NpZ25tZW50KHZhbHVlcyk7XG4gICAgY29uc3Qgb2xkVmFsdWVzID0gdGhpcy5zZWxlY3RlZDtcbiAgICBjb25zdCBuZXdTZWxlY3RlZFNldCA9IG5ldyBTZXQodmFsdWVzKTtcbiAgICB2YWx1ZXMuZm9yRWFjaCh2YWx1ZSA9PiB0aGlzLl9tYXJrU2VsZWN0ZWQodmFsdWUpKTtcbiAgICBvbGRWYWx1ZXNcbiAgICAgIC5maWx0ZXIodmFsdWUgPT4gIW5ld1NlbGVjdGVkU2V0Lmhhcyh2YWx1ZSkpXG4gICAgICAuZm9yRWFjaCh2YWx1ZSA9PiB0aGlzLl91bm1hcmtTZWxlY3RlZCh2YWx1ZSkpO1xuICAgIGNvbnN0IGNoYW5nZWQgPSB0aGlzLl9oYXNRdWV1ZWRDaGFuZ2VzKCk7XG4gICAgdGhpcy5fZW1pdENoYW5nZUV2ZW50KCk7XG4gICAgcmV0dXJuIGNoYW5nZWQ7XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlcyBhIHZhbHVlIGJldHdlZW4gc2VsZWN0ZWQgYW5kIGRlc2VsZWN0ZWQuXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gdG9nZ2xlXG4gICAqIEByZXR1cm4gV2hldGhlciB0aGUgc2VsZWN0aW9uIGNoYW5nZWQgYXMgYSByZXN1bHQgb2YgdGhpcyBjYWxsXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMTYuMC4wIG1ha2UgcmV0dXJuIHR5cGUgYm9vbGVhblxuICAgKi9cbiAgdG9nZ2xlKHZhbHVlOiBUKTogYm9vbGVhbiB8IHZvaWQge1xuICAgIHJldHVybiB0aGlzLmlzU2VsZWN0ZWQodmFsdWUpID8gdGhpcy5kZXNlbGVjdCh2YWx1ZSkgOiB0aGlzLnNlbGVjdCh2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIGFsbCBvZiB0aGUgc2VsZWN0ZWQgdmFsdWVzLlxuICAgKiBAcGFyYW0gZmx1c2hFdmVudCBXaGV0aGVyIHRvIGZsdXNoIHRoZSBjaGFuZ2VzIGluIGFuIGV2ZW50LlxuICAgKiAgIElmIGZhbHNlLCB0aGUgY2hhbmdlcyB0byB0aGUgc2VsZWN0aW9uIHdpbGwgYmUgZmx1c2hlZCBhbG9uZyB3aXRoIHRoZSBuZXh0IGV2ZW50LlxuICAgKiBAcmV0dXJuIFdoZXRoZXIgdGhlIHNlbGVjdGlvbiBjaGFuZ2VkIGFzIGEgcmVzdWx0IG9mIHRoaXMgY2FsbFxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDE2LjAuMCBtYWtlIHJldHVybiB0eXBlIGJvb2xlYW5cbiAgICovXG4gIGNsZWFyKGZsdXNoRXZlbnQgPSB0cnVlKTogYm9vbGVhbiB8IHZvaWQge1xuICAgIHRoaXMuX3VubWFya0FsbCgpO1xuICAgIGNvbnN0IGNoYW5nZWQgPSB0aGlzLl9oYXNRdWV1ZWRDaGFuZ2VzKCk7XG4gICAgaWYgKGZsdXNoRXZlbnQpIHtcbiAgICAgIHRoaXMuX2VtaXRDaGFuZ2VFdmVudCgpO1xuICAgIH1cbiAgICByZXR1cm4gY2hhbmdlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgYSB2YWx1ZSBpcyBzZWxlY3RlZC5cbiAgICovXG4gIGlzU2VsZWN0ZWQodmFsdWU6IFQpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5jb21wYXJlV2l0aCkge1xuICAgICAgZm9yIChjb25zdCBvdGhlclZhbHVlIG9mIHRoaXMuX3NlbGVjdGlvbikge1xuICAgICAgICBpZiAodGhpcy5jb21wYXJlV2l0aChvdGhlclZhbHVlLCB2YWx1ZSkpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fc2VsZWN0aW9uLmhhcyh2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBtb2RlbCBkb2VzIG5vdCBoYXZlIGEgdmFsdWUuXG4gICAqL1xuICBpc0VtcHR5KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9zZWxlY3Rpb24uc2l6ZSA9PT0gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgdGhlIG1vZGVsIGhhcyBhIHZhbHVlLlxuICAgKi9cbiAgaGFzVmFsdWUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICF0aGlzLmlzRW1wdHkoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTb3J0cyB0aGUgc2VsZWN0ZWQgdmFsdWVzIGJhc2VkIG9uIGEgcHJlZGljYXRlIGZ1bmN0aW9uLlxuICAgKi9cbiAgc29ydChwcmVkaWNhdGU/OiAoYTogVCwgYjogVCkgPT4gbnVtYmVyKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX211bHRpcGxlICYmIHRoaXMuc2VsZWN0ZWQpIHtcbiAgICAgIHRoaXMuX3NlbGVjdGVkIS5zb3J0KHByZWRpY2F0ZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgd2hldGhlciBtdWx0aXBsZSB2YWx1ZXMgY2FuIGJlIHNlbGVjdGVkLlxuICAgKi9cbiAgaXNNdWx0aXBsZVNlbGVjdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fbXVsdGlwbGU7XG4gIH1cblxuICAvKiogRW1pdHMgYSBjaGFuZ2UgZXZlbnQgYW5kIGNsZWFycyB0aGUgcmVjb3JkcyBvZiBzZWxlY3RlZCBhbmQgZGVzZWxlY3RlZCB2YWx1ZXMuICovXG4gIHByaXZhdGUgX2VtaXRDaGFuZ2VFdmVudCgpIHtcbiAgICAvLyBDbGVhciB0aGUgc2VsZWN0ZWQgdmFsdWVzIHNvIHRoZXkgY2FuIGJlIHJlLWNhY2hlZC5cbiAgICB0aGlzLl9zZWxlY3RlZCA9IG51bGw7XG5cbiAgICBpZiAodGhpcy5fc2VsZWN0ZWRUb0VtaXQubGVuZ3RoIHx8IHRoaXMuX2Rlc2VsZWN0ZWRUb0VtaXQubGVuZ3RoKSB7XG4gICAgICB0aGlzLmNoYW5nZWQubmV4dCh7XG4gICAgICAgIHNvdXJjZTogdGhpcyxcbiAgICAgICAgYWRkZWQ6IHRoaXMuX3NlbGVjdGVkVG9FbWl0LFxuICAgICAgICByZW1vdmVkOiB0aGlzLl9kZXNlbGVjdGVkVG9FbWl0LFxuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuX2Rlc2VsZWN0ZWRUb0VtaXQgPSBbXTtcbiAgICAgIHRoaXMuX3NlbGVjdGVkVG9FbWl0ID0gW107XG4gICAgfVxuICB9XG5cbiAgLyoqIFNlbGVjdHMgYSB2YWx1ZS4gKi9cbiAgcHJpdmF0ZSBfbWFya1NlbGVjdGVkKHZhbHVlOiBUKSB7XG4gICAgaWYgKCF0aGlzLmlzU2VsZWN0ZWQodmFsdWUpKSB7XG4gICAgICBpZiAoIXRoaXMuX211bHRpcGxlKSB7XG4gICAgICAgIHRoaXMuX3VubWFya0FsbCgpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXRoaXMuaXNTZWxlY3RlZCh2YWx1ZSkpIHtcbiAgICAgICAgdGhpcy5fc2VsZWN0aW9uLmFkZCh2YWx1ZSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9lbWl0Q2hhbmdlcykge1xuICAgICAgICB0aGlzLl9zZWxlY3RlZFRvRW1pdC5wdXNoKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogRGVzZWxlY3RzIGEgdmFsdWUuICovXG4gIHByaXZhdGUgX3VubWFya1NlbGVjdGVkKHZhbHVlOiBUKSB7XG4gICAgaWYgKHRoaXMuaXNTZWxlY3RlZCh2YWx1ZSkpIHtcbiAgICAgIHRoaXMuX3NlbGVjdGlvbi5kZWxldGUodmFsdWUpO1xuXG4gICAgICBpZiAodGhpcy5fZW1pdENoYW5nZXMpIHtcbiAgICAgICAgdGhpcy5fZGVzZWxlY3RlZFRvRW1pdC5wdXNoKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogQ2xlYXJzIG91dCB0aGUgc2VsZWN0ZWQgdmFsdWVzLiAqL1xuICBwcml2YXRlIF91bm1hcmtBbGwoKSB7XG4gICAgaWYgKCF0aGlzLmlzRW1wdHkoKSkge1xuICAgICAgdGhpcy5fc2VsZWN0aW9uLmZvckVhY2godmFsdWUgPT4gdGhpcy5fdW5tYXJrU2VsZWN0ZWQodmFsdWUpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVmVyaWZpZXMgdGhlIHZhbHVlIGFzc2lnbm1lbnQgYW5kIHRocm93cyBhbiBlcnJvciBpZiB0aGUgc3BlY2lmaWVkIHZhbHVlIGFycmF5IGlzXG4gICAqIGluY2x1ZGluZyBtdWx0aXBsZSB2YWx1ZXMgd2hpbGUgdGhlIHNlbGVjdGlvbiBtb2RlbCBpcyBub3Qgc3VwcG9ydGluZyBtdWx0aXBsZSB2YWx1ZXMuXG4gICAqL1xuICBwcml2YXRlIF92ZXJpZnlWYWx1ZUFzc2lnbm1lbnQodmFsdWVzOiBUW10pIHtcbiAgICBpZiAodmFsdWVzLmxlbmd0aCA+IDEgJiYgIXRoaXMuX211bHRpcGxlICYmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpKSB7XG4gICAgICB0aHJvdyBnZXRNdWx0aXBsZVZhbHVlc0luU2luZ2xlU2VsZWN0aW9uRXJyb3IoKTtcbiAgICB9XG4gIH1cblxuICAvKiogV2hldGhlciB0aGVyZSBhcmUgcXVldWVkIHVwIGNoYW5nZSB0byBiZSBlbWl0dGVkLiAqL1xuICBwcml2YXRlIF9oYXNRdWV1ZWRDaGFuZ2VzKCkge1xuICAgIHJldHVybiAhISh0aGlzLl9kZXNlbGVjdGVkVG9FbWl0Lmxlbmd0aCB8fCB0aGlzLl9zZWxlY3RlZFRvRW1pdC5sZW5ndGgpO1xuICB9XG59XG5cbi8qKlxuICogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSB2YWx1ZSBvZiBhIE1hdFNlbGVjdGlvbk1vZGVsIGhhcyBjaGFuZ2VkLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNlbGVjdGlvbkNoYW5nZTxUPiB7XG4gIC8qKiBNb2RlbCB0aGF0IGRpc3BhdGNoZWQgdGhlIGV2ZW50LiAqL1xuICBzb3VyY2U6IFNlbGVjdGlvbk1vZGVsPFQ+O1xuICAvKiogT3B0aW9ucyB0aGF0IHdlcmUgYWRkZWQgdG8gdGhlIG1vZGVsLiAqL1xuICBhZGRlZDogVFtdO1xuICAvKiogT3B0aW9ucyB0aGF0IHdlcmUgcmVtb3ZlZCBmcm9tIHRoZSBtb2RlbC4gKi9cbiAgcmVtb3ZlZDogVFtdO1xufVxuXG4vKipcbiAqIFJldHVybnMgYW4gZXJyb3IgdGhhdCByZXBvcnRzIHRoYXQgbXVsdGlwbGUgdmFsdWVzIGFyZSBwYXNzZWQgaW50byBhIHNlbGVjdGlvbiBtb2RlbFxuICogd2l0aCBhIHNpbmdsZSB2YWx1ZS5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE11bHRpcGxlVmFsdWVzSW5TaW5nbGVTZWxlY3Rpb25FcnJvcigpIHtcbiAgcmV0dXJuIEVycm9yKCdDYW5ub3QgcGFzcyBtdWx0aXBsZSB2YWx1ZXMgaW50byBTZWxlY3Rpb25Nb2RlbCB3aXRoIHNpbmdsZS12YWx1ZSBtb2RlLicpO1xufVxuIl19