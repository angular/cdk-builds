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
var SelectionModel = /** @class */ (function () {
    function SelectionModel(_multiple, initiallySelectedValues, _emitChanges) {
        var _this = this;
        if (_multiple === void 0) { _multiple = false; }
        if (_emitChanges === void 0) { _emitChanges = true; }
        this._multiple = _multiple;
        this._emitChanges = _emitChanges;
        /** Currently-selected values. */
        this._selection = new Set();
        /** Keeps track of the deselected options that haven't been emitted by the change event. */
        this._deselectedToEmit = [];
        /** Keeps track of the selected options that haven't been emitted by the change event. */
        this._selectedToEmit = [];
        /** Event emitted when the value has changed. */
        this.changed = new Subject();
        /**
         * Event emitted when the value has changed.
         * @deprecated Use `changed` instead.
         * @breaking-change 8.0.0 To be changed to `changed`
         */
        this.onChange = this.changed;
        if (initiallySelectedValues && initiallySelectedValues.length) {
            if (_multiple) {
                initiallySelectedValues.forEach(function (value) { return _this._markSelected(value); });
            }
            else {
                this._markSelected(initiallySelectedValues[0]);
            }
            // Clear the array in order to avoid firing the change event for preselected values.
            this._selectedToEmit.length = 0;
        }
    }
    Object.defineProperty(SelectionModel.prototype, "selected", {
        /** Selected values. */
        get: function () {
            if (!this._selected) {
                this._selected = Array.from(this._selection.values());
            }
            return this._selected;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Selects a value or an array of values.
     */
    SelectionModel.prototype.select = function () {
        var _this = this;
        var values = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            values[_i] = arguments[_i];
        }
        this._verifyValueAssignment(values);
        values.forEach(function (value) { return _this._markSelected(value); });
        this._emitChangeEvent();
    };
    /**
     * Deselects a value or an array of values.
     */
    SelectionModel.prototype.deselect = function () {
        var _this = this;
        var values = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            values[_i] = arguments[_i];
        }
        this._verifyValueAssignment(values);
        values.forEach(function (value) { return _this._unmarkSelected(value); });
        this._emitChangeEvent();
    };
    /**
     * Toggles a value between selected and deselected.
     */
    SelectionModel.prototype.toggle = function (value) {
        this.isSelected(value) ? this.deselect(value) : this.select(value);
    };
    /**
     * Clears all of the selected values.
     */
    SelectionModel.prototype.clear = function () {
        this._unmarkAll();
        this._emitChangeEvent();
    };
    /**
     * Determines whether a value is selected.
     */
    SelectionModel.prototype.isSelected = function (value) {
        return this._selection.has(value);
    };
    /**
     * Determines whether the model does not have a value.
     */
    SelectionModel.prototype.isEmpty = function () {
        return this._selection.size === 0;
    };
    /**
     * Determines whether the model has a value.
     */
    SelectionModel.prototype.hasValue = function () {
        return !this.isEmpty();
    };
    /**
     * Sorts the selected values based on a predicate function.
     */
    SelectionModel.prototype.sort = function (predicate) {
        if (this._multiple && this.selected) {
            this._selected.sort(predicate);
        }
    };
    /**
     * Gets whether multiple values can be selected.
     */
    SelectionModel.prototype.isMultipleSelection = function () {
        return this._multiple;
    };
    /** Emits a change event and clears the records of selected and deselected values. */
    SelectionModel.prototype._emitChangeEvent = function () {
        // Clear the selected values so they can be re-cached.
        this._selected = null;
        if (this._selectedToEmit.length || this._deselectedToEmit.length) {
            this.changed.next({
                source: this,
                added: this._selectedToEmit,
                removed: this._deselectedToEmit
            });
            this._deselectedToEmit = [];
            this._selectedToEmit = [];
        }
    };
    /** Selects a value. */
    SelectionModel.prototype._markSelected = function (value) {
        if (!this.isSelected(value)) {
            if (!this._multiple) {
                this._unmarkAll();
            }
            this._selection.add(value);
            if (this._emitChanges) {
                this._selectedToEmit.push(value);
            }
        }
    };
    /** Deselects a value. */
    SelectionModel.prototype._unmarkSelected = function (value) {
        if (this.isSelected(value)) {
            this._selection.delete(value);
            if (this._emitChanges) {
                this._deselectedToEmit.push(value);
            }
        }
    };
    /** Clears out the selected values. */
    SelectionModel.prototype._unmarkAll = function () {
        var _this = this;
        if (!this.isEmpty()) {
            this._selection.forEach(function (value) { return _this._unmarkSelected(value); });
        }
    };
    /**
     * Verifies the value assignment and throws an error if the specified value array is
     * including multiple values while the selection model is not supporting multiple values.
     */
    SelectionModel.prototype._verifyValueAssignment = function (values) {
        if (values.length > 1 && !this._multiple) {
            throw getMultipleValuesInSingleSelectionError();
        }
    };
    return SelectionModel;
}());
export { SelectionModel };
/**
 * Returns an error that reports that multiple values are passed into a selection model
 * with a single value.
 * @docs-private
 */
export function getMultipleValuesInSingleSelectionError() {
    return Error('Cannot pass multiple values into SelectionModel with single-value mode.');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9jb2xsZWN0aW9ucy9zZWxlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUU3Qjs7R0FFRztBQUNIO0lBZ0NFLHdCQUNVLFNBQWlCLEVBQ3pCLHVCQUE2QixFQUNyQixZQUFtQjtRQUg3QixpQkFlQztRQWRTLDBCQUFBLEVBQUEsaUJBQWlCO1FBRWpCLDZCQUFBLEVBQUEsbUJBQW1CO1FBRm5CLGNBQVMsR0FBVCxTQUFTLENBQVE7UUFFakIsaUJBQVksR0FBWixZQUFZLENBQU87UUFsQzdCLGlDQUFpQztRQUN6QixlQUFVLEdBQUcsSUFBSSxHQUFHLEVBQUssQ0FBQztRQUVsQywyRkFBMkY7UUFDbkYsc0JBQWlCLEdBQVEsRUFBRSxDQUFDO1FBRXBDLHlGQUF5RjtRQUNqRixvQkFBZSxHQUFRLEVBQUUsQ0FBQztRQWNsQyxnREFBZ0Q7UUFDaEQsWUFBTyxHQUFnQyxJQUFJLE9BQU8sRUFBRSxDQUFDO1FBRXJEOzs7O1dBSUc7UUFDSCxhQUFRLEdBQWdDLElBQUksQ0FBQyxPQUFPLENBQUM7UUFPbkQsSUFBSSx1QkFBdUIsSUFBSSx1QkFBdUIsQ0FBQyxNQUFNLEVBQUU7WUFDN0QsSUFBSSxTQUFTLEVBQUU7Z0JBQ2IsdUJBQXVCLENBQUMsT0FBTyxDQUFDLFVBQUEsS0FBSyxJQUFJLE9BQUEsS0FBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsRUFBekIsQ0FBeUIsQ0FBQyxDQUFDO2FBQ3JFO2lCQUFNO2dCQUNMLElBQUksQ0FBQyxhQUFhLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNoRDtZQUVELG9GQUFvRjtZQUNwRixJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sR0FBRyxD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QUMvRDtJQUNILENBQUM7SUFFRDs7O09BR0c7SUFDSywrQ0FBc0IsR0FBOUIsVUFBK0IsTUFBVztRQUN4QyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUN4QyxNQUFNLHVDQUF1QyxFQUFFLENBQUM7U0FDakQ7SUFDSCxDQUFDO0lBQ0gscUJBQUM7QUFBRCxDQUFDLEFBbExELElBa0xDOztBQWVEOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsdUNBQXVDO0lBQ3JELE9BQU8sS0FBSyxDQUFDLHlFQUF5RSxDQUFDLENBQUM7QUFDMUYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1N1YmplY3R9IGZyb20gJ3J4anMnO1xuXG4vKipcbiAqIENsYXNzIHRvIGJlIHVzZWQgdG8gcG93ZXIgc2VsZWN0aW5nIG9uZSBvciBtb3JlIG9wdGlvbnMgZnJvbSBhIGxpc3QuXG4gKi9cbmV4cG9ydCBjbGFzcyBTZWxlY3Rpb25Nb2RlbDxUPiB7XG4gIC8qKiBDdXJyZW50bHktc2VsZWN0ZWQgdmFsdWVzLiAqL1xuICBwcml2YXRlIF9zZWxlY3Rpb24gPSBuZXcgU2V0PFQ+KCk7XG5cbiAgLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBkZXNlbGVjdGVkIG9wdGlvbnMgdGhhdCBoYXZlbid0IGJlZW4gZW1pdHRlZCBieSB0aGUgY2hhbmdlIGV2ZW50LiAqL1xuICBwcml2YXRlIF9kZXNlbGVjdGVkVG9FbWl0OiBUW10gPSBbXTtcblxuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIHNlbGVjdGVkIG9wdGlvbnMgdGhhdCBoYXZlbid0IGJlZW4gZW1pdHRlZCBieSB0aGUgY2hhbmdlIGV2ZW50LiAqL1xuICBwcml2YXRlIF9zZWxlY3RlZFRvRW1pdDogVFtdID0gW107XG5cbiAgLyoqIENhY2hlIGZvciB0aGUgYXJyYXkgdmFsdWUgb2YgdGhlIHNlbGVjdGVkIGl0ZW1zLiAqL1xuICBwcml2YXRlIF9zZWxlY3RlZDogVFtdIHwgbnVsbDtcblxuICAvKiogU2VsZWN0ZWQgdmFsdWVzLiAqL1xuICBnZXQgc2VsZWN0ZWQoKTogVFtdIHtcbiAgICBpZiAoIXRoaXMuX3NlbGVjdGVkKSB7XG4gICAgICB0aGlzLl9zZWxlY3RlZCA9IEFycmF5LmZyb20odGhpcy5fc2VsZWN0aW9uLnZhbHVlcygpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fc2VsZWN0ZWQ7XG4gIH1cblxuICAvKiogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSB2YWx1ZSBoYXMgY2hhbmdlZC4gKi9cbiAgY2hhbmdlZDogU3ViamVjdDxTZWxlY3Rpb25DaGFuZ2U8VD4+ID0gbmV3IFN1YmplY3QoKTtcblxuICAvKipcbiAgICogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSB2YWx1ZSBoYXMgY2hhbmdlZC5cbiAgICogQGRlcHJlY2F0ZWQgVXNlIGBjaGFuZ2VkYCBpbnN0ZWFkLlxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDguMC4wIFRvIGJlIGNoYW5nZWQgdG8gYGNoYW5nZWRgXG4gICAqL1xuICBvbkNoYW5nZTogU3ViamVjdDxTZWxlY3Rpb25DaGFuZ2U8VD4+ID0gdGhpcy5jaGFuZ2VkO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgX211bHRpcGxlID0gZmFsc2UsXG4gICAgaW5pdGlhbGx5U2VsZWN0ZWRWYWx1ZXM/OiBUW10sXG4gICAgcHJpdmF0ZSBfZW1pdENoYW5nZXMgPSB0cnVlKSB7XG5cbiAgICBpZiAoaW5pdGlhbGx5U2VsZWN0ZWRWYWx1ZXMgJiYgaW5pdGlhbGx5U2VsZWN0ZWRWYWx1ZXMubGVuZ3RoKSB7XG4gICAgICBpZiAoX211bHRpcGxlKSB7XG4gICAgICAgIGluaXRpYWxseVNlbGVjdGVkVmFsdWVzLmZvckVhY2godmFsdWUgPT4gdGhpcy5fbWFya1NlbGVjdGVkKHZhbHVlKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9tYXJrU2VsZWN0ZWQoaW5pdGlhbGx5U2VsZWN0ZWRWYWx1ZXNbMF0pO1xuICAgICAgfVxuXG4gICAgICAvLyBDbGVhciB0aGUgYXJyYXkgaW4gb3JkZXIgdG8gYXZvaWQgZmlyaW5nIHRoZSBjaGFuZ2UgZXZlbnQgZm9yIHByZXNlbGVjdGVkIHZhbHVlcy5cbiAgICAgIHRoaXMuX3NlbGVjdGVkVG9FbWl0Lmxlbmd0aCA9IDA7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbGVjdHMgYSB2YWx1ZSBvciBhbiBhcnJheSBvZiB2YWx1ZXMuXG4gICAqL1xuICBzZWxlY3QoLi4udmFsdWVzOiBUW10pOiB2b2lkIHtcbiAgICB0aGlzLl92ZXJpZnlWYWx1ZUFzc2lnbm1lbnQodmFsdWVzKTtcbiAgICB2YWx1ZXMuZm9yRWFjaCh2YWx1ZSA9PiB0aGlzLl9tYXJrU2VsZWN0ZWQodmFsdWUpKTtcbiAgICB0aGlzLl9lbWl0Q2hhbmdlRXZlbnQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXNlbGVjdHMgYSB2YWx1ZSBvciBhbiBhcnJheSBvZiB2YWx1ZXMuXG4gICAqL1xuICBkZXNlbGVjdCguLi52YWx1ZXM6IFRbXSk6IHZvaWQge1xuICAgIHRoaXMuX3ZlcmlmeVZhbHVlQXNzaWdubWVudCh2YWx1ZXMpO1xuICAgIHZhbHVlcy5mb3JFYWNoKHZhbHVlID0+IHRoaXMuX3VubWFya1NlbGVjdGVkKHZhbHVlKSk7XG4gICAgdGhpcy5fZW1pdENoYW5nZUV2ZW50KCk7XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlcyBhIHZhbHVlIGJldHdlZW4gc2VsZWN0ZWQgYW5kIGRlc2VsZWN0ZWQuXG4gICAqL1xuICB0b2dnbGUodmFsdWU6IFQpOiB2b2lkIHtcbiAgICB0aGlzLmlzU2VsZWN0ZWQodmFsdWUpID8gdGhpcy5kZXNlbGVjdCh2YWx1ZSkgOiB0aGlzLnNlbGVjdCh2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIGFsbCBvZiB0aGUgc2VsZWN0ZWQgdmFsdWVzLlxuICAgKi9cbiAgY2xlYXIoKTogdm9pZCB7XG4gICAgdGhpcy5fdW5tYXJrQWxsKCk7XG4gICAgdGhpcy5fZW1pdENoYW5nZUV2ZW50KCk7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIGEgdmFsdWUgaXMgc2VsZWN0ZWQuXG4gICAqL1xuICBpc1NlbGVjdGVkKHZhbHVlOiBUKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbGVjdGlvbi5oYXModmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgd2hldGhlciB0aGUgbW9kZWwgZG9lcyBub3QgaGF2ZSBhIHZhbHVlLlxuICAgKi9cbiAgaXNFbXB0eSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fc2VsZWN0aW9uLnNpemUgPT09IDA7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBtb2RlbCBoYXMgYSB2YWx1ZS5cbiAgICovXG4gIGhhc1ZhbHVlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhdGhpcy5pc0VtcHR5KCk7XG4gIH1cblxuICAvKipcbiAgICogU29ydHMgdGhlIHNlbGVjdGVkIHZhbHVlcyBiYXNlZCBvbiBhIHByZWRpY2F0ZSBmdW5jdGlvbi5cbiAgICovXG4gIHNvcnQocHJlZGljYXRlPzogKGE6IFQsIGI6IFQpID0+IG51bWJlcik6IHZvaWQge1xuICAgIGlmICh0aGlzLl9tdWx0aXBsZSAmJiB0aGlzLnNlbGVjdGVkKSB7XG4gICAgICB0aGlzLl9zZWxlY3RlZCEuc29ydChwcmVkaWNhdGUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHdoZXRoZXIgbXVsdGlwbGUgdmFsdWVzIGNhbiBiZSBzZWxlY3RlZC5cbiAgICovXG4gIGlzTXVsdGlwbGVTZWxlY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX211bHRpcGxlO1xuICB9XG5cbiAgLyoqIEVtaXRzIGEgY2hhbmdlIGV2ZW50IGFuZCBjbGVhcnMgdGhlIHJlY29yZHMgb2Ygc2VsZWN0ZWQgYW5kIGRlc2VsZWN0ZWQgdmFsdWVzLiAqL1xuICBwcml2YXRlIF9lbWl0Q2hhbmdlRXZlbnQoKSB7XG4gICAgLy8gQ2xlYXIgdGhlIHNlbGVjdGVkIHZhbHVlcyBzbyB0aGV5IGNhbiBiZSByZS1jYWNoZWQuXG4gICAgdGhpcy5fc2VsZWN0ZWQgPSBudWxsO1xuXG4gICAgaWYgKHRoaXMuX3NlbGVjdGVkVG9FbWl0Lmxlbmd0aCB8fCB0aGlzLl9kZXNlbGVjdGVkVG9FbWl0Lmxlbmd0aCkge1xuICAgICAgdGhpcy5jaGFuZ2VkLm5leHQoe1xuICAgICAgICBzb3VyY2U6IHRoaXMsXG4gICAgICAgIGFkZGVkOiB0aGlzLl9zZWxlY3RlZFRvRW1pdCxcbiAgICAgICAgcmVtb3ZlZDogdGhpcy5fZGVzZWxlY3RlZFRvRW1pdFxuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuX2Rlc2VsZWN0ZWRUb0VtaXQgPSBbXTtcbiAgICAgIHRoaXMuX3NlbGVjdGVkVG9FbWl0ID0gW107XG4gICAgfVxuICB9XG5cbiAgLyoqIFNlbGVjdHMgYSB2YWx1ZS4gKi9cbiAgcHJpdmF0ZSBfbWFya1NlbGVjdGVkKHZhbHVlOiBUKSB7XG4gICAgaWYgKCF0aGlzLmlzU2VsZWN0ZWQodmFsdWUpKSB7XG4gICAgICBpZiAoIXRoaXMuX211bHRpcGxlKSB7XG4gICAgICAgIHRoaXMuX3VubWFya0FsbCgpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9zZWxlY3Rpb24uYWRkKHZhbHVlKTtcblxuICAgICAgaWYgKHRoaXMuX2VtaXRDaGFuZ2VzKSB7XG4gICAgICAgIHRoaXMuX3NlbGVjdGVkVG9FbWl0LnB1c2godmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBEZXNlbGVjdHMgYSB2YWx1ZS4gKi9cbiAgcHJpdmF0ZSBfdW5tYXJrU2VsZWN0ZWQodmFsdWU6IFQpIHtcbiAgICBpZiAodGhpcy5pc1NlbGVjdGVkKHZhbHVlKSkge1xuICAgICAgdGhpcy5fc2VsZWN0aW9uLmRlbGV0ZSh2YWx1ZSk7XG5cbiAgICAgIGlmICh0aGlzLl9lbWl0Q2hhbmdlcykge1xuICAgICAgICB0aGlzLl9kZXNlbGVjdGVkVG9FbWl0LnB1c2godmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBDbGVhcnMgb3V0IHRoZSBzZWxlY3RlZCB2YWx1ZXMuICovXG4gIHByaXZhdGUgX3VubWFya0FsbCgpIHtcbiAgICBpZiAoIXRoaXMuaXNFbXB0eSgpKSB7XG4gICAgICB0aGlzLl9zZWxlY3Rpb24uZm9yRWFjaCh2YWx1ZSA9PiB0aGlzLl91bm1hcmtTZWxlY3RlZCh2YWx1ZSkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBWZXJpZmllcyB0aGUgdmFsdWUgYXNzaWdubWVudCBhbmQgdGhyb3dzIGFuIGVycm9yIGlmIHRoZSBzcGVjaWZpZWQgdmFsdWUgYXJyYXkgaXNcbiAgICogaW5jbHVkaW5nIG11bHRpcGxlIHZhbHVlcyB3aGlsZSB0aGUgc2VsZWN0aW9uIG1vZGVsIGlzIG5vdCBzdXBwb3J0aW5nIG11bHRpcGxlIHZhbHVlcy5cbiAgICovXG4gIHByaXZhdGUgX3ZlcmlmeVZhbHVlQXNzaWdubWVudCh2YWx1ZXM6IFRbXSkge1xuICAgIGlmICh2YWx1ZXMubGVuZ3RoID4gMSAmJiAhdGhpcy5fbXVsdGlwbGUpIHtcbiAgICAgIHRocm93IGdldE11bHRpcGxlVmFsdWVzSW5TaW5nbGVTZWxlY3Rpb25FcnJvcigpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEV2ZW50IGVtaXR0ZWQgd2hlbiB0aGUgdmFsdWUgb2YgYSBNYXRTZWxlY3Rpb25Nb2RlbCBoYXMgY2hhbmdlZC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTZWxlY3Rpb25DaGFuZ2U8VD4ge1xuICAvKiogTW9kZWwgdGhhdCBkaXNwYXRjaGVkIHRoZSBldmVudC4gKi9cbiAgc291cmNlOiBTZWxlY3Rpb25Nb2RlbDxUPjtcbiAgLyoqIE9wdGlvbnMgdGhhdCB3ZXJlIGFkZGVkIHRvIHRoZSBtb2RlbC4gKi9cbiAgYWRkZWQ6IFRbXTtcbiAgLyoqIE9wdGlvbnMgdGhhdCB3ZXJlIHJlbW92ZWQgZnJvbSB0aGUgbW9kZWwuICovXG4gIHJlbW92ZWQ6IFRbXTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFuIGVycm9yIHRoYXQgcmVwb3J0cyB0aGF0IG11bHRpcGxlIHZhbHVlcyBhcmUgcGFzc2VkIGludG8gYSBzZWxlY3Rpb24gbW9kZWxcbiAqIHdpdGggYSBzaW5nbGUgdmFsdWUuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRNdWx0aXBsZVZhbHVlc0luU2luZ2xlU2VsZWN0aW9uRXJyb3IoKSB7XG4gIHJldHVybiBFcnJvcignQ2Fubm90IHBhc3MgbXVsdGlwbGUgdmFsdWVzIGludG8gU2VsZWN0aW9uTW9kZWwgd2l0aCBzaW5nbGUtdmFsdWUgbW9kZS4nKTtcbn1cbiJdfQ==