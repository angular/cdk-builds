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
import { Subject } from 'rxjs';
/**
 * Class to be used to power selecting one or more options from a list.
 * @template T
 */
export class SelectionModel {
    /**
     * @param {?=} _multiple
     * @param {?=} initiallySelectedValues
     * @param {?=} _emitChanges
     */
    constructor(_multiple = false, initiallySelectedValues, _emitChanges = true) {
        this._multiple = _multiple;
        this._emitChanges = _emitChanges;
        /**
         * Currently-selected values.
         */
        this._selection = new Set();
        /**
         * Keeps track of the deselected options that haven't been emitted by the change event.
         */
        this._deselectedToEmit = [];
        /**
         * Keeps track of the selected options that haven't been emitted by the change event.
         */
        this._selectedToEmit = [];
        /**
         * Event emitted when the value has changed.
         */
        this.changed = new Subject();
        /**
         * Event emitted when the value has changed.
         * @deprecated Use `changed` instead.
         * \@breaking-change 8.0.0 To be changed to `changed`
         */
        this.onChange = this.changed;
        if (initiallySelectedValues && initiallySelectedValues.length) {
            if (_multiple) {
                initiallySelectedValues.forEach((/**
                 * @param {?} value
                 * @return {?}
                 */
                value => this._markSelected(value)));
            }
            else {
                this._markSelected(initiallySelectedValues[0]);
            }
            // Clear the array in order to avoid firing the change event for preselected values.
            this._selectedToEmit.length = 0;
        }
    }
    /**
     * Selected values.
     * @return {?}
     */
    get selected() {
        if (!this._selected) {
            this._selected = Array.from(this._selection.values());
        }
        return this._selected;
    }
    /**
     * Selects a value or an array of values.
     * @param {...?} values
     * @return {?}
     */
    select(...values) {
        this._verifyValueAssignment(values);
        values.forEach((/**
         * @param {?} value
         * @return {?}
         */
        value => this._markSelected(value)));
        this._emitChangeEvent();
    }
    /**
     * Deselects a value or an array of values.
     * @param {...?} values
     * @return {?}
     */
    deselect(...values) {
        this._verifyValueAssignment(values);
        values.forEach((/**
         * @param {?} value
         * @return {?}
         */
        value => this._unmarkSelected(value)));
        this._emitChangeEvent();
    }
    /**
     * Toggles a value between selected and deselected.
     * @param {?} value
     * @return {?}
     */
    toggle(value) {
        this.isSelected(value) ? this.deselect(value) : this.select(value);
    }
    /**
     * Clears all of the selected values.
     * @return {?}
     */
    clear() {
        this._unmarkAll();
        this._emitChangeEvent();
    }
    /**
     * Determines whether a value is selected.
     * @param {?} value
     * @return {?}
     */
    isSelected(value) {
        return this._selection.has(value);
    }
    /**
     * Determines whether the model does not have a value.
     * @return {?}
     */
    isEmpty() {
        return this._selection.size === 0;
    }
    /**
     * Determines whether the model has a value.
     * @return {?}
     */
    hasValue() {
        return !this.isEmpty();
    }
    /**
     * Sorts the selected values based on a predicate function.
     * @param {?=} predicate
     * @return {?}
     */
    sort(predicate) {
        if (this._multiple && this.selected) {
            (/** @type {?} */ (this._selected)).sort(predicate);
        }
    }
    /**
     * Gets whether multiple values can be selected.
     * @return {?}
     */
    isMultipleSelection() {
        return this._multiple;
    }
    /**
     * Emits a change event and clears the records of selected and deselected values.
     * @private
     * @return {?}
     */
    _emitChangeEvent() {
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
    }
    /**
     * Selects a value.
     * @private
     * @param {?} value
     * @return {?}
     */
    _markSelected(value) {
        if (!this.isSelected(value)) {
            if (!this._multiple) {
                this._unmarkAll();
            }
            this._selection.add(value);
            if (this._emitChanges) {
                this._selectedToEmit.push(value);
            }
        }
    }
    /**
     * Deselects a value.
     * @private
     * @param {?} value
     * @return {?}
     */
    _unmarkSelected(value) {
        if (this.isSelected(value)) {
            this._selection.delete(value);
            if (this._emitChanges) {
                this._deselectedToEmit.push(value);
            }
        }
    }
    /**
     * Clears out the selected values.
     * @private
     * @return {?}
     */
    _unmarkAll() {
        if (!this.isEmpty()) {
            this._selection.forEach((/**
             * @param {?} value
             * @return {?}
             */
            value => this._unmarkSelected(value)));
        }
    }
    /**
     * Verifies the value assignment and throws an error if the specified value array is
     * including multiple values while the selection model is not supporting multiple values.
     * @private
     * @param {?} values
     * @return {?}
     */
    _verifyValueAssignment(values) {
        if (values.length > 1 && !this._multiple) {
            throw getMultipleValuesInSingleSelectionError();
        }
    }
}
if (false) {
    /**
     * Currently-selected values.
     * @type {?}
     * @private
     */
    SelectionModel.prototype._selection;
    /**
     * Keeps track of the deselected options that haven't been emitted by the change event.
     * @type {?}
     * @private
     */
    SelectionModel.prototype._deselectedToEmit;
    /**
     * Keeps track of the selected options that haven't been emitted by the change event.
     * @type {?}
     * @private
     */
    SelectionModel.prototype._selectedToEmit;
    /**
     * Cache for the array value of the selected items.
     * @type {?}
     * @private
     */
    SelectionModel.prototype._selected;
    /**
     * Event emitted when the value has changed.
     * @type {?}
     */
    SelectionModel.prototype.changed;
    /**
     * Event emitted when the value has changed.
     * @deprecated Use `changed` instead.
     * \@breaking-change 8.0.0 To be changed to `changed`
     * @type {?}
     */
    SelectionModel.prototype.onChange;
    /**
     * @type {?}
     * @private
     */
    SelectionModel.prototype._multiple;
    /**
     * @type {?}
     * @private
     */
    SelectionModel.prototype._emitChanges;
}
/**
 * Event emitted when the value of a MatSelectionModel has changed.
 * \@docs-private
 * @record
 * @template T
 */
export function SelectionChange() { }
if (false) {
    /**
     * Model that dispatched the event.
     * @type {?}
     */
    SelectionChange.prototype.source;
    /**
     * Options that were added to the model.
     * @type {?}
     */
    SelectionChange.prototype.added;
    /**
     * Options that were removed from the model.
     * @type {?}
     */
    SelectionChange.prototype.removed;
}
/**
 * Returns an error that reports that multiple values are passed into a selection model
 * with a single value.
 * \@docs-private
 * @return {?}
 */
export function getMultipleValuesInSingleSelectionError() {
    return Error('Cannot pass multiple values into SelectionModel with single-value mode.');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9jb2xsZWN0aW9ucy9zZWxlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDOzs7OztBQUs3QixNQUFNLE9BQU8sY0FBYzs7Ozs7O0lBZ0N6QixZQUNVLFlBQVksS0FBSyxFQUN6Qix1QkFBNkIsRUFDckIsZUFBZSxJQUFJO1FBRm5CLGNBQVMsR0FBVCxTQUFTLENBQVE7UUFFakIsaUJBQVksR0FBWixZQUFZLENBQU87Ozs7UUFqQ3JCLGVBQVUsR0FBRyxJQUFJLEdBQUcsRUFBSyxDQUFDOzs7O1FBRzFCLHNCQUFpQixHQUFRLEVBQUUsQ0FBQzs7OztRQUc1QixvQkFBZSxHQUFRLEVBQUUsQ0FBQzs7OztRQWVsQyxZQUFPLEdBQWdDLElBQUksT0FBTyxFQUFFLENBQUM7Ozs7OztRQU9yRCxhQUFRLEdBQWdDLElBQUksQ0FBQyxPQUFPLENBQUM7UUFPbkQsSUFBSSx1QkFBdUIsSUFBSSx1QkFBdUIsQ0FBQyxNQUFNLEVBQUU7WUFDN0QsSUFBSSxTQUFTLEVBQUU7Z0JBQ2IsdUJBQXVCLENBQUMsT0FBTzs7OztnQkFBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLEVBQUMsQ0FBQzthQUNyRTtpQkFBTTtnQkFDTCxJQUFJLENBQUMsYUFBYSxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDaEQ7WUFFRCxvRkFBb0Y7WUFDcEYsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1NBQ2pDO0lBQ0gsQ0FBQzs7Ozs7SUFqQ0QsSUFBSSxRQUFRO1FBQ1YsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDbkIsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFL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QUFDLENBQUM7QUFDMUYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1N1YmplY3R9IGZyb20gJ3J4anMnO1xuXG4vKipcbiAqIENsYXNzIHRvIGJlIHVzZWQgdG8gcG93ZXIgc2VsZWN0aW5nIG9uZSBvciBtb3JlIG9wdGlvbnMgZnJvbSBhIGxpc3QuXG4gKi9cbmV4cG9ydCBjbGFzcyBTZWxlY3Rpb25Nb2RlbDxUPiB7XG4gIC8qKiBDdXJyZW50bHktc2VsZWN0ZWQgdmFsdWVzLiAqL1xuICBwcml2YXRlIF9zZWxlY3Rpb24gPSBuZXcgU2V0PFQ+KCk7XG5cbiAgLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBkZXNlbGVjdGVkIG9wdGlvbnMgdGhhdCBoYXZlbid0IGJlZW4gZW1pdHRlZCBieSB0aGUgY2hhbmdlIGV2ZW50LiAqL1xuICBwcml2YXRlIF9kZXNlbGVjdGVkVG9FbWl0OiBUW10gPSBbXTtcblxuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIHNlbGVjdGVkIG9wdGlvbnMgdGhhdCBoYXZlbid0IGJlZW4gZW1pdHRlZCBieSB0aGUgY2hhbmdlIGV2ZW50LiAqL1xuICBwcml2YXRlIF9zZWxlY3RlZFRvRW1pdDogVFtdID0gW107XG5cbiAgLyoqIENhY2hlIGZvciB0aGUgYXJyYXkgdmFsdWUgb2YgdGhlIHNlbGVjdGVkIGl0ZW1zLiAqL1xuICBwcml2YXRlIF9zZWxlY3RlZDogVFtdIHwgbnVsbDtcblxuICAvKiogU2VsZWN0ZWQgdmFsdWVzLiAqL1xuICBnZXQgc2VsZWN0ZWQoKTogVFtdIHtcbiAgICBpZiAoIXRoaXMuX3NlbGVjdGVkKSB7XG4gICAgICB0aGlzLl9zZWxlY3RlZCA9IEFycmF5LmZyb20odGhpcy5fc2VsZWN0aW9uLnZhbHVlcygpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fc2VsZWN0ZWQ7XG4gIH1cblxuICAvKiogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSB2YWx1ZSBoYXMgY2hhbmdlZC4gKi9cbiAgY2hhbmdlZDogU3ViamVjdDxTZWxlY3Rpb25DaGFuZ2U8VD4+ID0gbmV3IFN1YmplY3QoKTtcblxuICAvKipcbiAgICogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSB2YWx1ZSBoYXMgY2hhbmdlZC5cbiAgICogQGRlcHJlY2F0ZWQgVXNlIGBjaGFuZ2VkYCBpbnN0ZWFkLlxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDguMC4wIFRvIGJlIGNoYW5nZWQgdG8gYGNoYW5nZWRgXG4gICAqL1xuICBvbkNoYW5nZTogU3ViamVjdDxTZWxlY3Rpb25DaGFuZ2U8VD4+ID0gdGhpcy5jaGFuZ2VkO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgX211bHRpcGxlID0gZmFsc2UsXG4gICAgaW5pdGlhbGx5U2VsZWN0ZWRWYWx1ZXM/OiBUW10sXG4gICAgcHJpdmF0ZSBfZW1pdENoYW5nZXMgPSB0cnVlKSB7XG5cbiAgICBpZiAoaW5pdGlhbGx5U2VsZWN0ZWRWYWx1ZXMgJiYgaW5pdGlhbGx5U2VsZWN0ZWRWYWx1ZXMubGVuZ3RoKSB7XG4gICAgICBpZiAoX211bHRpcGxlKSB7XG4gICAgICAgIGluaXRpYWxseVNlbGVjdGVkVmFsdWVzLmZvckVhY2godmFsdWUgPT4gdGhpcy5fbWFya1NlbGVjdGVkKHZhbHVlKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9tYXJrU2VsZWN0ZWQoaW5pdGlhbGx5U2VsZWN0ZWRWYWx1ZXNbMF0pO1xuICAgICAgfVxuXG4gICAgICAvLyBDbGVhciB0aGUgYXJyYXkgaW4gb3JkZXIgdG8gYXZvaWQgZmlyaW5nIHRoZSBjaGFuZ2UgZXZlbnQgZm9yIHByZXNlbGVjdGVkIHZhbHVlcy5cbiAgICAgIHRoaXMuX3NlbGVjdGVkVG9FbWl0Lmxlbmd0aCA9IDA7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbGVjdHMgYSB2YWx1ZSBvciBhbiBhcnJheSBvZiB2YWx1ZXMuXG4gICAqL1xuICBzZWxlY3QoLi4udmFsdWVzOiBUW10pOiB2b2lkIHtcbiAgICB0aGlzLl92ZXJpZnlWYWx1ZUFzc2lnbm1lbnQodmFsdWVzKTtcbiAgICB2YWx1ZXMuZm9yRWFjaCh2YWx1ZSA9PiB0aGlzLl9tYXJrU2VsZWN0ZWQodmFsdWUpKTtcbiAgICB0aGlzLl9lbWl0Q2hhbmdlRXZlbnQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXNlbGVjdHMgYSB2YWx1ZSBvciBhbiBhcnJheSBvZiB2YWx1ZXMuXG4gICAqL1xuICBkZXNlbGVjdCguLi52YWx1ZXM6IFRbXSk6IHZvaWQge1xuICAgIHRoaXMuX3ZlcmlmeVZhbHVlQXNzaWdubWVudCh2YWx1ZXMpO1xuICAgIHZhbHVlcy5mb3JFYWNoKHZhbHVlID0+IHRoaXMuX3VubWFya1NlbGVjdGVkKHZhbHVlKSk7XG4gICAgdGhpcy5fZW1pdENoYW5nZUV2ZW50KCk7XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlcyBhIHZhbHVlIGJldHdlZW4gc2VsZWN0ZWQgYW5kIGRlc2VsZWN0ZWQuXG4gICAqL1xuICB0b2dnbGUodmFsdWU6IFQpOiB2b2lkIHtcbiAgICB0aGlzLmlzU2VsZWN0ZWQodmFsdWUpID8gdGhpcy5kZXNlbGVjdCh2YWx1ZSkgOiB0aGlzLnNlbGVjdCh2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIGFsbCBvZiB0aGUgc2VsZWN0ZWQgdmFsdWVzLlxuICAgKi9cbiAgY2xlYXIoKTogdm9pZCB7XG4gICAgdGhpcy5fdW5tYXJrQWxsKCk7XG4gICAgdGhpcy5fZW1pdENoYW5nZUV2ZW50KCk7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIGEgdmFsdWUgaXMgc2VsZWN0ZWQuXG4gICAqL1xuICBpc1NlbGVjdGVkKHZhbHVlOiBUKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbGVjdGlvbi5oYXModmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgd2hldGhlciB0aGUgbW9kZWwgZG9lcyBub3QgaGF2ZSBhIHZhbHVlLlxuICAgKi9cbiAgaXNFbXB0eSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fc2VsZWN0aW9uLnNpemUgPT09IDA7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBtb2RlbCBoYXMgYSB2YWx1ZS5cbiAgICovXG4gIGhhc1ZhbHVlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhdGhpcy5pc0VtcHR5KCk7XG4gIH1cblxuICAvKipcbiAgICogU29ydHMgdGhlIHNlbGVjdGVkIHZhbHVlcyBiYXNlZCBvbiBhIHByZWRpY2F0ZSBmdW5jdGlvbi5cbiAgICovXG4gIHNvcnQocHJlZGljYXRlPzogKGE6IFQsIGI6IFQpID0+IG51bWJlcik6IHZvaWQge1xuICAgIGlmICh0aGlzLl9tdWx0aXBsZSAmJiB0aGlzLnNlbGVjdGVkKSB7XG4gICAgICB0aGlzLl9zZWxlY3RlZCEuc29ydChwcmVkaWNhdGUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHdoZXRoZXIgbXVsdGlwbGUgdmFsdWVzIGNhbiBiZSBzZWxlY3RlZC5cbiAgICovXG4gIGlzTXVsdGlwbGVTZWxlY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX211bHRpcGxlO1xuICB9XG5cbiAgLyoqIEVtaXRzIGEgY2hhbmdlIGV2ZW50IGFuZCBjbGVhcnMgdGhlIHJlY29yZHMgb2Ygc2VsZWN0ZWQgYW5kIGRlc2VsZWN0ZWQgdmFsdWVzLiAqL1xuICBwcml2YXRlIF9lbWl0Q2hhbmdlRXZlbnQoKSB7XG4gICAgLy8gQ2xlYXIgdGhlIHNlbGVjdGVkIHZhbHVlcyBzbyB0aGV5IGNhbiBiZSByZS1jYWNoZWQuXG4gICAgdGhpcy5fc2VsZWN0ZWQgPSBudWxsO1xuXG4gICAgaWYgKHRoaXMuX3NlbGVjdGVkVG9FbWl0Lmxlbmd0aCB8fCB0aGlzLl9kZXNlbGVjdGVkVG9FbWl0Lmxlbmd0aCkge1xuICAgICAgdGhpcy5jaGFuZ2VkLm5leHQoe1xuICAgICAgICBzb3VyY2U6IHRoaXMsXG4gICAgICAgIGFkZGVkOiB0aGlzLl9zZWxlY3RlZFRvRW1pdCxcbiAgICAgICAgcmVtb3ZlZDogdGhpcy5fZGVzZWxlY3RlZFRvRW1pdFxuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuX2Rlc2VsZWN0ZWRUb0VtaXQgPSBbXTtcbiAgICAgIHRoaXMuX3NlbGVjdGVkVG9FbWl0ID0gW107XG4gICAgfVxuICB9XG5cbiAgLyoqIFNlbGVjdHMgYSB2YWx1ZS4gKi9cbiAgcHJpdmF0ZSBfbWFya1NlbGVjdGVkKHZhbHVlOiBUKSB7XG4gICAgaWYgKCF0aGlzLmlzU2VsZWN0ZWQodmFsdWUpKSB7XG4gICAgICBpZiAoIXRoaXMuX211bHRpcGxlKSB7XG4gICAgICAgIHRoaXMuX3VubWFya0FsbCgpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9zZWxlY3Rpb24uYWRkKHZhbHVlKTtcblxuICAgICAgaWYgKHRoaXMuX2VtaXRDaGFuZ2VzKSB7XG4gICAgICAgIHRoaXMuX3NlbGVjdGVkVG9FbWl0LnB1c2godmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBEZXNlbGVjdHMgYSB2YWx1ZS4gKi9cbiAgcHJpdmF0ZSBfdW5tYXJrU2VsZWN0ZWQodmFsdWU6IFQpIHtcbiAgICBpZiAodGhpcy5pc1NlbGVjdGVkKHZhbHVlKSkge1xuICAgICAgdGhpcy5fc2VsZWN0aW9uLmRlbGV0ZSh2YWx1ZSk7XG5cbiAgICAgIGlmICh0aGlzLl9lbWl0Q2hhbmdlcykge1xuICAgICAgICB0aGlzLl9kZXNlbGVjdGVkVG9FbWl0LnB1c2godmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBDbGVhcnMgb3V0IHRoZSBzZWxlY3RlZCB2YWx1ZXMuICovXG4gIHByaXZhdGUgX3VubWFya0FsbCgpIHtcbiAgICBpZiAoIXRoaXMuaXNFbXB0eSgpKSB7XG4gICAgICB0aGlzLl9zZWxlY3Rpb24uZm9yRWFjaCh2YWx1ZSA9PiB0aGlzLl91bm1hcmtTZWxlY3RlZCh2YWx1ZSkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBWZXJpZmllcyB0aGUgdmFsdWUgYXNzaWdubWVudCBhbmQgdGhyb3dzIGFuIGVycm9yIGlmIHRoZSBzcGVjaWZpZWQgdmFsdWUgYXJyYXkgaXNcbiAgICogaW5jbHVkaW5nIG11bHRpcGxlIHZhbHVlcyB3aGlsZSB0aGUgc2VsZWN0aW9uIG1vZGVsIGlzIG5vdCBzdXBwb3J0aW5nIG11bHRpcGxlIHZhbHVlcy5cbiAgICovXG4gIHByaXZhdGUgX3ZlcmlmeVZhbHVlQXNzaWdubWVudCh2YWx1ZXM6IFRbXSkge1xuICAgIGlmICh2YWx1ZXMubGVuZ3RoID4gMSAmJiAhdGhpcy5fbXVsdGlwbGUpIHtcbiAgICAgIHRocm93IGdldE11bHRpcGxlVmFsdWVzSW5TaW5nbGVTZWxlY3Rpb25FcnJvcigpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEV2ZW50IGVtaXR0ZWQgd2hlbiB0aGUgdmFsdWUgb2YgYSBNYXRTZWxlY3Rpb25Nb2RlbCBoYXMgY2hhbmdlZC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTZWxlY3Rpb25DaGFuZ2U8VD4ge1xuICAvKiogTW9kZWwgdGhhdCBkaXNwYXRjaGVkIHRoZSBldmVudC4gKi9cbiAgc291cmNlOiBTZWxlY3Rpb25Nb2RlbDxUPjtcbiAgLyoqIE9wdGlvbnMgdGhhdCB3ZXJlIGFkZGVkIHRvIHRoZSBtb2RlbC4gKi9cbiAgYWRkZWQ6IFRbXTtcbiAgLyoqIE9wdGlvbnMgdGhhdCB3ZXJlIHJlbW92ZWQgZnJvbSB0aGUgbW9kZWwuICovXG4gIHJlbW92ZWQ6IFRbXTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFuIGVycm9yIHRoYXQgcmVwb3J0cyB0aGF0IG11bHRpcGxlIHZhbHVlcyBhcmUgcGFzc2VkIGludG8gYSBzZWxlY3Rpb24gbW9kZWxcbiAqIHdpdGggYSBzaW5nbGUgdmFsdWUuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRNdWx0aXBsZVZhbHVlc0luU2luZ2xlU2VsZWN0aW9uRXJyb3IoKSB7XG4gIHJldHVybiBFcnJvcignQ2Fubm90IHBhc3MgbXVsdGlwbGUgdmFsdWVzIGludG8gU2VsZWN0aW9uTW9kZWwgd2l0aCBzaW5nbGUtdmFsdWUgbW9kZS4nKTtcbn1cbiJdfQ==