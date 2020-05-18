/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/a11y/focus-trap/focus-trap-manager.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable } from '@angular/core';
import * as i0 from "@angular/core";
/**
 * A FocusTrap managed by FocusTrapManager.
 * Implemented by ConfigurableFocusTrap to avoid circular dependency.
 * @record
 */
export function ManagedFocusTrap() { }
if (false) {
    /**
     * @return {?}
     */
    ManagedFocusTrap.prototype._enable = function () { };
    /**
     * @return {?}
     */
    ManagedFocusTrap.prototype._disable = function () { };
    /**
     * @return {?}
     */
    ManagedFocusTrap.prototype.focusInitialElementWhenReady = function () { };
}
/**
 * Injectable that ensures only the most recently enabled FocusTrap is active.
 */
let FocusTrapManager = /** @class */ (() => {
    /**
     * Injectable that ensures only the most recently enabled FocusTrap is active.
     */
    class FocusTrapManager {
        constructor() {
            // A stack of the FocusTraps on the page. Only the FocusTrap at the
            // top of the stack is active.
            this._focusTrapStack = [];
        }
        /**
         * Disables the FocusTrap at the top of the stack, and then pushes
         * the new FocusTrap onto the stack.
         * @param {?} focusTrap
         * @return {?}
         */
        register(focusTrap) {
            // Dedupe focusTraps that register multiple times.
            this._focusTrapStack = this._focusTrapStack.filter((/**
             * @param {?} ft
             * @return {?}
             */
            (ft) => ft !== focusTrap));
            /** @type {?} */
            let stack = this._focusTrapStack;
            if (stack.length) {
                stack[stack.length - 1]._disable();
            }
            stack.push(focusTrap);
            focusTrap._enable();
        }
        /**
         * Removes the FocusTrap from the stack, and activates the
         * FocusTrap that is the new top of the stack.
         * @param {?} focusTrap
         * @return {?}
         */
        deregister(focusTrap) {
            focusTrap._disable();
            /** @type {?} */
            const stack = this._focusTrapStack;
            /** @type {?} */
            const i = stack.indexOf(focusTrap);
            if (i !== -1) {
                stack.splice(i, 1);
                if (stack.length) {
                    stack[stack.length - 1]._enable();
                }
            }
        }
    }
    FocusTrapManager.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    /** @nocollapse */ FocusTrapManager.ɵprov = i0.ɵɵdefineInjectable({ factory: function FocusTrapManager_Factory() { return new FocusTrapManager(); }, token: FocusTrapManager, providedIn: "root" });
    return FocusTrapManager;
})();
export { FocusTrapManager };
if (false) {
    /**
     * @type {?}
     * @private
     */
    FocusTrapManager.prototype._focusTrapStack;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXMtdHJhcC1tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9hMTF5L2ZvY3VzLXRyYXAvZm9jdXMtdHJhcC1tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7Ozs7Ozs7QUFNekMsc0NBSUM7Ozs7O0lBSEMscURBQWdCOzs7O0lBQ2hCLHNEQUFpQjs7OztJQUNqQiwwRUFBaUQ7Ozs7O0FBSW5EOzs7O0lBQUEsTUFDYSxnQkFBZ0I7UUFEN0I7OztZQUlVLG9CQUFlLEdBQXVCLEVBQUUsQ0FBQztTQXFDbEQ7Ozs7Ozs7UUEvQkMsUUFBUSxDQUFDLFNBQTJCO1lBQ2xDLGtEQUFrRDtZQUNsRCxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTTs7OztZQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEtBQUssU0FBUyxFQUFDLENBQUM7O2dCQUV6RSxLQUFLLEdBQUcsSUFBSSxDQUFDLGVBQWU7WUFFaEMsSUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFO2dCQUNoQixLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQzthQUNwQztZQUVELEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDdEIsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3RCLENBQUM7Ozs7Ozs7UUFNRCxVQUFVLENBQUMsU0FBMkI7WUFDcEMsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDOztrQkFFZixLQUFLLEdBQUcsSUFBSSxDQUFDLGVBQWU7O2tCQUU1QixDQUFDLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUM7WUFDbEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7Z0JBQ1osS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ25CLElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRTtvQkFDaEIsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7aUJBQ25DO2FBQ0Y7UUFDSCxDQUFDOzs7Z0JBeENGLFVBQVUsU0FBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7OzsyQkFyQmhDO0tBOERDO1NBeENZLGdCQUFnQjs7Ozs7O0lBRzNCLDJDQUFpRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG4vKipcbiAqIEEgRm9jdXNUcmFwIG1hbmFnZWQgYnkgRm9jdXNUcmFwTWFuYWdlci5cbiAqIEltcGxlbWVudGVkIGJ5IENvbmZpZ3VyYWJsZUZvY3VzVHJhcCB0byBhdm9pZCBjaXJjdWxhciBkZXBlbmRlbmN5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIE1hbmFnZWRGb2N1c1RyYXAge1xuICBfZW5hYmxlKCk6IHZvaWQ7XG4gIF9kaXNhYmxlKCk6IHZvaWQ7XG4gIGZvY3VzSW5pdGlhbEVsZW1lbnRXaGVuUmVhZHkoKTogUHJvbWlzZTxib29sZWFuPjtcbn1cblxuLyoqIEluamVjdGFibGUgdGhhdCBlbnN1cmVzIG9ubHkgdGhlIG1vc3QgcmVjZW50bHkgZW5hYmxlZCBGb2N1c1RyYXAgaXMgYWN0aXZlLiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgRm9jdXNUcmFwTWFuYWdlciB7XG4gIC8vIEEgc3RhY2sgb2YgdGhlIEZvY3VzVHJhcHMgb24gdGhlIHBhZ2UuIE9ubHkgdGhlIEZvY3VzVHJhcCBhdCB0aGVcbiAgLy8gdG9wIG9mIHRoZSBzdGFjayBpcyBhY3RpdmUuXG4gIHByaXZhdGUgX2ZvY3VzVHJhcFN0YWNrOiBNYW5hZ2VkRm9jdXNUcmFwW10gPSBbXTtcblxuICAvKipcbiAgICogRGlzYWJsZXMgdGhlIEZvY3VzVHJhcCBhdCB0aGUgdG9wIG9mIHRoZSBzdGFjaywgYW5kIHRoZW4gcHVzaGVzXG4gICAqIHRoZSBuZXcgRm9jdXNUcmFwIG9udG8gdGhlIHN0YWNrLlxuICAgKi9cbiAgcmVnaXN0ZXIoZm9jdXNUcmFwOiBNYW5hZ2VkRm9jdXNUcmFwKTogdm9pZCB7XG4gICAgLy8gRGVkdXBlIGZvY3VzVHJhcHMgdGhhdCByZWdpc3RlciBtdWx0aXBsZSB0aW1lcy5cbiAgICB0aGlzLl9mb2N1c1RyYXBTdGFjayA9IHRoaXMuX2ZvY3VzVHJhcFN0YWNrLmZpbHRlcigoZnQpID0+IGZ0ICE9PSBmb2N1c1RyYXApO1xuXG4gICAgbGV0IHN0YWNrID0gdGhpcy5fZm9jdXNUcmFwU3RhY2s7XG5cbiAgICBpZiAoc3RhY2subGVuZ3RoKSB7XG4gICAgICBzdGFja1tzdGFjay5sZW5ndGggLSAxXS5fZGlzYWJsZSgpO1xuICAgIH1cblxuICAgIHN0YWNrLnB1c2goZm9jdXNUcmFwKTtcbiAgICBmb2N1c1RyYXAuX2VuYWJsZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgdGhlIEZvY3VzVHJhcCBmcm9tIHRoZSBzdGFjaywgYW5kIGFjdGl2YXRlcyB0aGVcbiAgICogRm9jdXNUcmFwIHRoYXQgaXMgdGhlIG5ldyB0b3Agb2YgdGhlIHN0YWNrLlxuICAgKi9cbiAgZGVyZWdpc3Rlcihmb2N1c1RyYXA6IE1hbmFnZWRGb2N1c1RyYXApOiB2b2lkIHtcbiAgICBmb2N1c1RyYXAuX2Rpc2FibGUoKTtcblxuICAgIGNvbnN0IHN0YWNrID0gdGhpcy5fZm9jdXNUcmFwU3RhY2s7XG5cbiAgICBjb25zdCBpID0gc3RhY2suaW5kZXhPZihmb2N1c1RyYXApO1xuICAgIGlmIChpICE9PSAtMSkge1xuICAgICAgc3RhY2suc3BsaWNlKGksIDEpO1xuICAgICAgaWYgKHN0YWNrLmxlbmd0aCkge1xuICAgICAgICBzdGFja1tzdGFjay5sZW5ndGggLSAxXS5fZW5hYmxlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=