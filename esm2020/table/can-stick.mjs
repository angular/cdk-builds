/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { coerceBooleanProperty } from '@angular/cdk/coercion';
/**
 * Mixin to provide a directive with a function that checks if the sticky input has been
 * changed since the last time the function was called. Essentially adds a dirty-check to the
 * sticky value.
 * @docs-private
 */
export function mixinHasStickyInput(base) {
    return class extends base {
        constructor(...args) {
            super(...args);
            this._sticky = false;
            /** Whether the sticky input has changed since it was last checked. */
            this._hasStickyChanged = false;
        }
        /** Whether sticky positioning should be applied. */
        get sticky() {
            return this._sticky;
        }
        set sticky(v) {
            const prevValue = this._sticky;
            this._sticky = coerceBooleanProperty(v);
            this._hasStickyChanged = prevValue !== this._sticky;
        }
        /** Whether the sticky value has changed since this was last called. */
        hasStickyChanged() {
            const hasStickyChanged = this._hasStickyChanged;
            this._hasStickyChanged = false;
            return hasStickyChanged;
        }
        /** Resets the dirty check for cases where the sticky state has been used without checking. */
        resetStickyChanged() {
            this._hasStickyChanged = false;
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FuLXN0aWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90YWJsZS9jYW4tc3RpY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUE0QjVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLG1CQUFtQixDQUE0QixJQUFPO0lBQ3BFLE9BQU8sS0FBTSxTQUFRLElBQUk7UUEyQnZCLFlBQVksR0FBRyxJQUFXO1lBQ3hCLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO1lBbEJqQixZQUFPLEdBQVksS0FBSyxDQUFDO1lBRXpCLHNFQUFzRTtZQUN0RSxzQkFBaUIsR0FBWSxLQUFLLENBQUM7UUFnQm5DLENBQUM7UUE1QkQsb0RBQW9EO1FBQ3BELElBQUksTUFBTTtZQUNSLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUN0QixDQUFDO1FBQ0QsSUFBSSxNQUFNLENBQUMsQ0FBVTtZQUNuQixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQy9CLElBQUksQ0FBQyxPQUFPLEdBQUcscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFNBQVMsS0FBSyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ3RELENBQUM7UUFNRCx1RUFBdUU7UUFDdkUsZ0JBQWdCO1lBQ2QsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUM7WUFDaEQsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEtBQUssQ0FBQztZQUMvQixPQUFPLGdCQUFnQixDQUFDO1FBQzFCLENBQUM7UUFFRCw4RkFBOEY7UUFDOUYsa0JBQWtCO1lBQ2hCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxLQUFLLENBQUM7UUFDakMsQ0FBQztLQUtGLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Y29lcmNlQm9vbGVhblByb3BlcnR5fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuXG4vKiogQGRvY3MtcHJpdmF0ZSAqL1xuZXhwb3J0IHR5cGUgQ29uc3RydWN0b3I8VD4gPSBuZXcgKC4uLmFyZ3M6IGFueVtdKSA9PiBUO1xuXG4vKipcbiAqIEludGVyZmFjZSBmb3IgYSBtaXhpbiB0byBwcm92aWRlIGEgZGlyZWN0aXZlIHdpdGggYSBmdW5jdGlvbiB0aGF0IGNoZWNrcyBpZiB0aGUgc3RpY2t5IGlucHV0IGhhc1xuICogYmVlbiBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IHRpbWUgdGhlIGZ1bmN0aW9uIHdhcyBjYWxsZWQuIEVzc2VudGlhbGx5IGFkZHMgYSBkaXJ0eS1jaGVjayB0byB0aGVcbiAqIHN0aWNreSB2YWx1ZS5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDYW5TdGljayB7XG4gIC8qKiBXaGV0aGVyIHN0aWNreSBwb3NpdGlvbmluZyBzaG91bGQgYmUgYXBwbGllZC4gKi9cbiAgc3RpY2t5OiBib29sZWFuO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBzdGlja3kgaW5wdXQgaGFzIGNoYW5nZWQgc2luY2UgaXQgd2FzIGxhc3QgY2hlY2tlZC4gKi9cbiAgX2hhc1N0aWNreUNoYW5nZWQ6IGJvb2xlYW47XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHN0aWNreSB2YWx1ZSBoYXMgY2hhbmdlZCBzaW5jZSB0aGlzIHdhcyBsYXN0IGNhbGxlZC4gKi9cbiAgaGFzU3RpY2t5Q2hhbmdlZCgpOiBib29sZWFuO1xuXG4gIC8qKiBSZXNldHMgdGhlIGRpcnR5IGNoZWNrIGZvciBjYXNlcyB3aGVyZSB0aGUgc3RpY2t5IHN0YXRlIGhhcyBiZWVuIHVzZWQgd2l0aG91dCBjaGVja2luZy4gKi9cbiAgcmVzZXRTdGlja3lDaGFuZ2VkKCk6IHZvaWQ7XG59XG5cbi8qKiBAZG9jcy1wcml2YXRlICovXG5leHBvcnQgdHlwZSBDYW5TdGlja0N0b3IgPSBDb25zdHJ1Y3RvcjxDYW5TdGljaz47XG5cbi8qKlxuICogTWl4aW4gdG8gcHJvdmlkZSBhIGRpcmVjdGl2ZSB3aXRoIGEgZnVuY3Rpb24gdGhhdCBjaGVja3MgaWYgdGhlIHN0aWNreSBpbnB1dCBoYXMgYmVlblxuICogY2hhbmdlZCBzaW5jZSB0aGUgbGFzdCB0aW1lIHRoZSBmdW5jdGlvbiB3YXMgY2FsbGVkLiBFc3NlbnRpYWxseSBhZGRzIGEgZGlydHktY2hlY2sgdG8gdGhlXG4gKiBzdGlja3kgdmFsdWUuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtaXhpbkhhc1N0aWNreUlucHV0PFQgZXh0ZW5kcyBDb25zdHJ1Y3Rvcjx7fT4+KGJhc2U6IFQpOiBDYW5TdGlja0N0b3IgJiBUIHtcbiAgcmV0dXJuIGNsYXNzIGV4dGVuZHMgYmFzZSB7XG4gICAgLyoqIFdoZXRoZXIgc3RpY2t5IHBvc2l0aW9uaW5nIHNob3VsZCBiZSBhcHBsaWVkLiAqL1xuICAgIGdldCBzdGlja3koKTogYm9vbGVhbiB7XG4gICAgICByZXR1cm4gdGhpcy5fc3RpY2t5O1xuICAgIH1cbiAgICBzZXQgc3RpY2t5KHY6IGJvb2xlYW4pIHtcbiAgICAgIGNvbnN0IHByZXZWYWx1ZSA9IHRoaXMuX3N0aWNreTtcbiAgICAgIHRoaXMuX3N0aWNreSA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2KTtcbiAgICAgIHRoaXMuX2hhc1N0aWNreUNoYW5nZWQgPSBwcmV2VmFsdWUgIT09IHRoaXMuX3N0aWNreTtcbiAgICB9XG4gICAgX3N0aWNreTogYm9vbGVhbiA9IGZhbHNlO1xuXG4gICAgLyoqIFdoZXRoZXIgdGhlIHN0aWNreSBpbnB1dCBoYXMgY2hhbmdlZCBzaW5jZSBpdCB3YXMgbGFzdCBjaGVja2VkLiAqL1xuICAgIF9oYXNTdGlja3lDaGFuZ2VkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgICAvKiogV2hldGhlciB0aGUgc3RpY2t5IHZhbHVlIGhhcyBjaGFuZ2VkIHNpbmNlIHRoaXMgd2FzIGxhc3QgY2FsbGVkLiAqL1xuICAgIGhhc1N0aWNreUNoYW5nZWQoKTogYm9vbGVhbiB7XG4gICAgICBjb25zdCBoYXNTdGlja3lDaGFuZ2VkID0gdGhpcy5faGFzU3RpY2t5Q2hhbmdlZDtcbiAgICAgIHRoaXMuX2hhc1N0aWNreUNoYW5nZWQgPSBmYWxzZTtcbiAgICAgIHJldHVybiBoYXNTdGlja3lDaGFuZ2VkO1xuICAgIH1cblxuICAgIC8qKiBSZXNldHMgdGhlIGRpcnR5IGNoZWNrIGZvciBjYXNlcyB3aGVyZSB0aGUgc3RpY2t5IHN0YXRlIGhhcyBiZWVuIHVzZWQgd2l0aG91dCBjaGVja2luZy4gKi9cbiAgICByZXNldFN0aWNreUNoYW5nZWQoKSB7XG4gICAgICB0aGlzLl9oYXNTdGlja3lDaGFuZ2VkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IoLi4uYXJnczogYW55W10pIHtcbiAgICAgIHN1cGVyKC4uLmFyZ3MpO1xuICAgIH1cbiAgfTtcbn1cbiJdfQ==