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
import { coerceBooleanProperty } from '@angular/cdk/coercion';
/**
 * Interface for a mixin to provide a directive with a function that checks if the sticky input has
 * been changed since the last time the function was called. Essentially adds a dirty-check to the
 * sticky value.
 * \@docs-private
 * @record
 */
export function CanStick() { }
if (false) {
    /**
     * Whether sticky positioning should be applied.
     * @type {?}
     */
    CanStick.prototype.sticky;
    /**
     * Whether the sticky input has changed since it was last checked.
     * @type {?}
     */
    CanStick.prototype._hasStickyChanged;
    /**
     * Whether the sticky value has changed since this was last called.
     * @return {?}
     */
    CanStick.prototype.hasStickyChanged = function () { };
    /**
     * Resets the dirty check for cases where the sticky state has been used without checking.
     * @return {?}
     */
    CanStick.prototype.resetStickyChanged = function () { };
}
/**
 * Mixin to provide a directive with a function that checks if the sticky input has been
 * changed since the last time the function was called. Essentially adds a dirty-check to the
 * sticky value.
 * \@docs-private
 * @template T
 * @param {?} base
 * @return {?}
 */
export function mixinHasStickyInput(base) {
    return class extends base {
        /**
         * @param {...?} args
         */
        constructor(...args) {
            super(...args);
            this._sticky = false;
            /**
             * Whether the sticky input has changed since it was last checked.
             */
            this._hasStickyChanged = false;
        }
        /**
         * Whether sticky positioning should be applied.
         * @return {?}
         */
        get sticky() { return this._sticky; }
        /**
         * @param {?} v
         * @return {?}
         */
        set sticky(v) {
            /** @type {?} */
            const prevValue = this._sticky;
            this._sticky = coerceBooleanProperty(v);
            this._hasStickyChanged = prevValue !== this._sticky;
        }
        /**
         * Whether the sticky value has changed since this was last called.
         * @return {?}
         */
        hasStickyChanged() {
            /** @type {?} */
            const hasStickyChanged = this._hasStickyChanged;
            this._hasStickyChanged = false;
            return hasStickyChanged;
        }
        /**
         * Resets the dirty check for cases where the sticky state has been used without checking.
         * @return {?}
         */
        resetStickyChanged() {
            this._hasStickyChanged = false;
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FuLXN0aWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90YWJsZS9jYW4tc3RpY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQzs7Ozs7Ozs7QUFXNUQsOEJBWUM7Ozs7OztJQVZDLDBCQUFnQjs7Ozs7SUFHaEIscUNBQTJCOzs7OztJQUczQixzREFBNEI7Ozs7O0lBRzVCLHdEQUEyQjs7Ozs7Ozs7Ozs7QUFZN0IsTUFBTSxVQUFVLG1CQUFtQixDQUE0QixJQUFPO0lBQ3BFLE9BQU8sS0FBTSxTQUFRLElBQUk7Ozs7UUF5QnZCLFlBQVksR0FBRyxJQUFXO1lBQUksS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFqQjdDLFlBQU8sR0FBWSxLQUFLLENBQUM7Ozs7WUFHekIsc0JBQWlCLEdBQVksS0FBSyxDQUFDO1FBY1csQ0FBQzs7Ozs7UUF2Qi9DLElBQUksTUFBTSxLQUFjLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Ozs7O1FBQzlDLElBQUksTUFBTSxDQUFDLENBQVU7O2tCQUNiLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTztZQUM5QixJQUFJLENBQUMsT0FBTyxHQUFHLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxTQUFTLEtBQUssSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUN0RCxDQUFDOzs7OztRQU9ELGdCQUFnQjs7a0JBQ1IsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQjtZQUMvQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsS0FBSyxDQUFDO1lBQy9CLE9BQU8sZ0JBQWdCLENBQUM7UUFDMUIsQ0FBQzs7Ozs7UUFHRCxrQkFBa0I7WUFDaEIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEtBQUssQ0FBQztRQUNqQyxDQUFDO0tBR0YsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtjb2VyY2VCb29sZWFuUHJvcGVydHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5cbi8qKiBAZG9jcy1wcml2YXRlICovXG5leHBvcnQgdHlwZSBDb25zdHJ1Y3RvcjxUPiA9IG5ldyguLi5hcmdzOiBhbnlbXSkgPT4gVDtcblxuLyoqXG4gKiBJbnRlcmZhY2UgZm9yIGEgbWl4aW4gdG8gcHJvdmlkZSBhIGRpcmVjdGl2ZSB3aXRoIGEgZnVuY3Rpb24gdGhhdCBjaGVja3MgaWYgdGhlIHN0aWNreSBpbnB1dCBoYXNcbiAqIGJlZW4gY2hhbmdlZCBzaW5jZSB0aGUgbGFzdCB0aW1lIHRoZSBmdW5jdGlvbiB3YXMgY2FsbGVkLiBFc3NlbnRpYWxseSBhZGRzIGEgZGlydHktY2hlY2sgdG8gdGhlXG4gKiBzdGlja3kgdmFsdWUuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2FuU3RpY2sge1xuICAvKiogV2hldGhlciBzdGlja3kgcG9zaXRpb25pbmcgc2hvdWxkIGJlIGFwcGxpZWQuICovXG4gIHN0aWNreTogYm9vbGVhbjtcblxuICAvKiogV2hldGhlciB0aGUgc3RpY2t5IGlucHV0IGhhcyBjaGFuZ2VkIHNpbmNlIGl0IHdhcyBsYXN0IGNoZWNrZWQuICovXG4gIF9oYXNTdGlja3lDaGFuZ2VkOiBib29sZWFuO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBzdGlja3kgdmFsdWUgaGFzIGNoYW5nZWQgc2luY2UgdGhpcyB3YXMgbGFzdCBjYWxsZWQuICovXG4gIGhhc1N0aWNreUNoYW5nZWQoKTogYm9vbGVhbjtcblxuICAvKiogUmVzZXRzIHRoZSBkaXJ0eSBjaGVjayBmb3IgY2FzZXMgd2hlcmUgdGhlIHN0aWNreSBzdGF0ZSBoYXMgYmVlbiB1c2VkIHdpdGhvdXQgY2hlY2tpbmcuICovXG4gIHJlc2V0U3RpY2t5Q2hhbmdlZCgpOiB2b2lkO1xufVxuXG4vKiogQGRvY3MtcHJpdmF0ZSAqL1xuZXhwb3J0IHR5cGUgQ2FuU3RpY2tDdG9yID0gQ29uc3RydWN0b3I8Q2FuU3RpY2s+O1xuXG4vKipcbiAqIE1peGluIHRvIHByb3ZpZGUgYSBkaXJlY3RpdmUgd2l0aCBhIGZ1bmN0aW9uIHRoYXQgY2hlY2tzIGlmIHRoZSBzdGlja3kgaW5wdXQgaGFzIGJlZW5cbiAqIGNoYW5nZWQgc2luY2UgdGhlIGxhc3QgdGltZSB0aGUgZnVuY3Rpb24gd2FzIGNhbGxlZC4gRXNzZW50aWFsbHkgYWRkcyBhIGRpcnR5LWNoZWNrIHRvIHRoZVxuICogc3RpY2t5IHZhbHVlLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gbWl4aW5IYXNTdGlja3lJbnB1dDxUIGV4dGVuZHMgQ29uc3RydWN0b3I8e30+PihiYXNlOiBUKTogQ2FuU3RpY2tDdG9yICYgVCB7XG4gIHJldHVybiBjbGFzcyBleHRlbmRzIGJhc2Uge1xuICAgIC8qKiBXaGV0aGVyIHN0aWNreSBwb3NpdGlvbmluZyBzaG91bGQgYmUgYXBwbGllZC4gKi9cbiAgICBnZXQgc3RpY2t5KCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5fc3RpY2t5OyB9XG4gICAgc2V0IHN0aWNreSh2OiBib29sZWFuKSB7XG4gICAgICBjb25zdCBwcmV2VmFsdWUgPSB0aGlzLl9zdGlja3k7XG4gICAgICB0aGlzLl9zdGlja3kgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodik7XG4gICAgICB0aGlzLl9oYXNTdGlja3lDaGFuZ2VkID0gcHJldlZhbHVlICE9PSB0aGlzLl9zdGlja3k7XG4gICAgfVxuICAgIF9zdGlja3k6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAgIC8qKiBXaGV0aGVyIHRoZSBzdGlja3kgaW5wdXQgaGFzIGNoYW5nZWQgc2luY2UgaXQgd2FzIGxhc3QgY2hlY2tlZC4gKi9cbiAgICBfaGFzU3RpY2t5Q2hhbmdlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gICAgLyoqIFdoZXRoZXIgdGhlIHN0aWNreSB2YWx1ZSBoYXMgY2hhbmdlZCBzaW5jZSB0aGlzIHdhcyBsYXN0IGNhbGxlZC4gKi9cbiAgICBoYXNTdGlja3lDaGFuZ2VkKCk6IGJvb2xlYW4ge1xuICAgICAgY29uc3QgaGFzU3RpY2t5Q2hhbmdlZCA9IHRoaXMuX2hhc1N0aWNreUNoYW5nZWQ7XG4gICAgICB0aGlzLl9oYXNTdGlja3lDaGFuZ2VkID0gZmFsc2U7XG4gICAgICByZXR1cm4gaGFzU3RpY2t5Q2hhbmdlZDtcbiAgICB9XG5cbiAgICAvKiogUmVzZXRzIHRoZSBkaXJ0eSBjaGVjayBmb3IgY2FzZXMgd2hlcmUgdGhlIHN0aWNreSBzdGF0ZSBoYXMgYmVlbiB1c2VkIHdpdGhvdXQgY2hlY2tpbmcuICovXG4gICAgcmVzZXRTdGlja3lDaGFuZ2VkKCkge1xuICAgICAgdGhpcy5faGFzU3RpY2t5Q2hhbmdlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKC4uLmFyZ3M6IGFueVtdKSB7IHN1cGVyKC4uLmFyZ3MpOyB9XG4gIH07XG59XG4iXX0=