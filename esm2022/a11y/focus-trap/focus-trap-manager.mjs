/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable } from '@angular/core';
import * as i0 from "@angular/core";
/** Injectable that ensures only the most recently enabled FocusTrap is active. */
class FocusTrapManager {
    constructor() {
        // A stack of the FocusTraps on the page. Only the FocusTrap at the
        // top of the stack is active.
        this._focusTrapStack = [];
    }
    /**
     * Disables the FocusTrap at the top of the stack, and then pushes
     * the new FocusTrap onto the stack.
     */
    register(focusTrap) {
        // Dedupe focusTraps that register multiple times.
        this._focusTrapStack = this._focusTrapStack.filter(ft => ft !== focusTrap);
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
     */
    deregister(focusTrap) {
        focusTrap._disable();
        const stack = this._focusTrapStack;
        const i = stack.indexOf(focusTrap);
        if (i !== -1) {
            stack.splice(i, 1);
            if (stack.length) {
                stack[stack.length - 1]._enable();
            }
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: FocusTrapManager, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: FocusTrapManager, providedIn: 'root' }); }
}
export { FocusTrapManager };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: FocusTrapManager, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXMtdHJhcC1tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9hMTF5L2ZvY3VzLXRyYXAvZm9jdXMtdHJhcC1tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7O0FBWXpDLGtGQUFrRjtBQUNsRixNQUNhLGdCQUFnQjtJQUQ3QjtRQUVFLG1FQUFtRTtRQUNuRSw4QkFBOEI7UUFDdEIsb0JBQWUsR0FBdUIsRUFBRSxDQUFDO0tBcUNsRDtJQW5DQzs7O09BR0c7SUFDSCxRQUFRLENBQUMsU0FBMkI7UUFDbEMsa0RBQWtEO1FBQ2xELElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssU0FBUyxDQUFDLENBQUM7UUFFM0UsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQztRQUVqQyxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUU7WUFDaEIsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7U0FDcEM7UUFFRCxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3RCLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsVUFBVSxDQUFDLFNBQTJCO1FBQ3BDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUVyQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDO1FBRW5DLE1BQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDbkMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDWixLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuQixJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUU7Z0JBQ2hCLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQ25DO1NBQ0Y7SUFDSCxDQUFDOzhHQXZDVSxnQkFBZ0I7a0hBQWhCLGdCQUFnQixjQURKLE1BQU07O1NBQ2xCLGdCQUFnQjsyRkFBaEIsZ0JBQWdCO2tCQUQ1QixVQUFVO21CQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG4vKipcbiAqIEEgRm9jdXNUcmFwIG1hbmFnZWQgYnkgRm9jdXNUcmFwTWFuYWdlci5cbiAqIEltcGxlbWVudGVkIGJ5IENvbmZpZ3VyYWJsZUZvY3VzVHJhcCB0byBhdm9pZCBjaXJjdWxhciBkZXBlbmRlbmN5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIE1hbmFnZWRGb2N1c1RyYXAge1xuICBfZW5hYmxlKCk6IHZvaWQ7XG4gIF9kaXNhYmxlKCk6IHZvaWQ7XG4gIGZvY3VzSW5pdGlhbEVsZW1lbnRXaGVuUmVhZHkoKTogUHJvbWlzZTxib29sZWFuPjtcbn1cblxuLyoqIEluamVjdGFibGUgdGhhdCBlbnN1cmVzIG9ubHkgdGhlIG1vc3QgcmVjZW50bHkgZW5hYmxlZCBGb2N1c1RyYXAgaXMgYWN0aXZlLiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgRm9jdXNUcmFwTWFuYWdlciB7XG4gIC8vIEEgc3RhY2sgb2YgdGhlIEZvY3VzVHJhcHMgb24gdGhlIHBhZ2UuIE9ubHkgdGhlIEZvY3VzVHJhcCBhdCB0aGVcbiAgLy8gdG9wIG9mIHRoZSBzdGFjayBpcyBhY3RpdmUuXG4gIHByaXZhdGUgX2ZvY3VzVHJhcFN0YWNrOiBNYW5hZ2VkRm9jdXNUcmFwW10gPSBbXTtcblxuICAvKipcbiAgICogRGlzYWJsZXMgdGhlIEZvY3VzVHJhcCBhdCB0aGUgdG9wIG9mIHRoZSBzdGFjaywgYW5kIHRoZW4gcHVzaGVzXG4gICAqIHRoZSBuZXcgRm9jdXNUcmFwIG9udG8gdGhlIHN0YWNrLlxuICAgKi9cbiAgcmVnaXN0ZXIoZm9jdXNUcmFwOiBNYW5hZ2VkRm9jdXNUcmFwKTogdm9pZCB7XG4gICAgLy8gRGVkdXBlIGZvY3VzVHJhcHMgdGhhdCByZWdpc3RlciBtdWx0aXBsZSB0aW1lcy5cbiAgICB0aGlzLl9mb2N1c1RyYXBTdGFjayA9IHRoaXMuX2ZvY3VzVHJhcFN0YWNrLmZpbHRlcihmdCA9PiBmdCAhPT0gZm9jdXNUcmFwKTtcblxuICAgIGxldCBzdGFjayA9IHRoaXMuX2ZvY3VzVHJhcFN0YWNrO1xuXG4gICAgaWYgKHN0YWNrLmxlbmd0aCkge1xuICAgICAgc3RhY2tbc3RhY2subGVuZ3RoIC0gMV0uX2Rpc2FibGUoKTtcbiAgICB9XG5cbiAgICBzdGFjay5wdXNoKGZvY3VzVHJhcCk7XG4gICAgZm9jdXNUcmFwLl9lbmFibGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIHRoZSBGb2N1c1RyYXAgZnJvbSB0aGUgc3RhY2ssIGFuZCBhY3RpdmF0ZXMgdGhlXG4gICAqIEZvY3VzVHJhcCB0aGF0IGlzIHRoZSBuZXcgdG9wIG9mIHRoZSBzdGFjay5cbiAgICovXG4gIGRlcmVnaXN0ZXIoZm9jdXNUcmFwOiBNYW5hZ2VkRm9jdXNUcmFwKTogdm9pZCB7XG4gICAgZm9jdXNUcmFwLl9kaXNhYmxlKCk7XG5cbiAgICBjb25zdCBzdGFjayA9IHRoaXMuX2ZvY3VzVHJhcFN0YWNrO1xuXG4gICAgY29uc3QgaSA9IHN0YWNrLmluZGV4T2YoZm9jdXNUcmFwKTtcbiAgICBpZiAoaSAhPT0gLTEpIHtcbiAgICAgIHN0YWNrLnNwbGljZShpLCAxKTtcbiAgICAgIGlmIChzdGFjay5sZW5ndGgpIHtcbiAgICAgICAgc3RhY2tbc3RhY2subGVuZ3RoIC0gMV0uX2VuYWJsZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl19