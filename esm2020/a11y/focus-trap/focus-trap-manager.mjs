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
export class FocusTrapManager {
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
        this._focusTrapStack = this._focusTrapStack.filter((ft) => ft !== focusTrap);
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
}
FocusTrapManager.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: FocusTrapManager, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
FocusTrapManager.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: FocusTrapManager, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: FocusTrapManager, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXMtdHJhcC1tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9hMTF5L2ZvY3VzLXRyYXAvZm9jdXMtdHJhcC1tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7O0FBWXpDLGtGQUFrRjtBQUVsRixNQUFNLE9BQU8sZ0JBQWdCO0lBRDdCO1FBRUUsbUVBQW1FO1FBQ25FLDhCQUE4QjtRQUN0QixvQkFBZSxHQUF1QixFQUFFLENBQUM7S0FxQ2xEO0lBbkNDOzs7T0FHRztJQUNILFFBQVEsQ0FBQyxTQUEyQjtRQUNsQyxrREFBa0Q7UUFDbEQsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxLQUFLLFNBQVMsQ0FBQyxDQUFDO1FBRTdFLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUM7UUFFakMsSUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFO1lBQ2hCLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO1NBQ3BDO1FBRUQsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN0QixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDdEIsQ0FBQztJQUVEOzs7T0FHRztJQUNILFVBQVUsQ0FBQyxTQUEyQjtRQUNwQyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUM7UUFFckIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQztRQUVuQyxNQUFNLENBQUMsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ25DLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO1lBQ1osS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkIsSUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFO2dCQUNoQixLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQzthQUNuQztTQUNGO0lBQ0gsQ0FBQzs7cUhBdkNVLGdCQUFnQjt5SEFBaEIsZ0JBQWdCLGNBREosTUFBTTttR0FDbEIsZ0JBQWdCO2tCQUQ1QixVQUFVO21CQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG4vKipcbiAqIEEgRm9jdXNUcmFwIG1hbmFnZWQgYnkgRm9jdXNUcmFwTWFuYWdlci5cbiAqIEltcGxlbWVudGVkIGJ5IENvbmZpZ3VyYWJsZUZvY3VzVHJhcCB0byBhdm9pZCBjaXJjdWxhciBkZXBlbmRlbmN5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIE1hbmFnZWRGb2N1c1RyYXAge1xuICBfZW5hYmxlKCk6IHZvaWQ7XG4gIF9kaXNhYmxlKCk6IHZvaWQ7XG4gIGZvY3VzSW5pdGlhbEVsZW1lbnRXaGVuUmVhZHkoKTogUHJvbWlzZTxib29sZWFuPjtcbn1cblxuLyoqIEluamVjdGFibGUgdGhhdCBlbnN1cmVzIG9ubHkgdGhlIG1vc3QgcmVjZW50bHkgZW5hYmxlZCBGb2N1c1RyYXAgaXMgYWN0aXZlLiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgRm9jdXNUcmFwTWFuYWdlciB7XG4gIC8vIEEgc3RhY2sgb2YgdGhlIEZvY3VzVHJhcHMgb24gdGhlIHBhZ2UuIE9ubHkgdGhlIEZvY3VzVHJhcCBhdCB0aGVcbiAgLy8gdG9wIG9mIHRoZSBzdGFjayBpcyBhY3RpdmUuXG4gIHByaXZhdGUgX2ZvY3VzVHJhcFN0YWNrOiBNYW5hZ2VkRm9jdXNUcmFwW10gPSBbXTtcblxuICAvKipcbiAgICogRGlzYWJsZXMgdGhlIEZvY3VzVHJhcCBhdCB0aGUgdG9wIG9mIHRoZSBzdGFjaywgYW5kIHRoZW4gcHVzaGVzXG4gICAqIHRoZSBuZXcgRm9jdXNUcmFwIG9udG8gdGhlIHN0YWNrLlxuICAgKi9cbiAgcmVnaXN0ZXIoZm9jdXNUcmFwOiBNYW5hZ2VkRm9jdXNUcmFwKTogdm9pZCB7XG4gICAgLy8gRGVkdXBlIGZvY3VzVHJhcHMgdGhhdCByZWdpc3RlciBtdWx0aXBsZSB0aW1lcy5cbiAgICB0aGlzLl9mb2N1c1RyYXBTdGFjayA9IHRoaXMuX2ZvY3VzVHJhcFN0YWNrLmZpbHRlcigoZnQpID0+IGZ0ICE9PSBmb2N1c1RyYXApO1xuXG4gICAgbGV0IHN0YWNrID0gdGhpcy5fZm9jdXNUcmFwU3RhY2s7XG5cbiAgICBpZiAoc3RhY2subGVuZ3RoKSB7XG4gICAgICBzdGFja1tzdGFjay5sZW5ndGggLSAxXS5fZGlzYWJsZSgpO1xuICAgIH1cblxuICAgIHN0YWNrLnB1c2goZm9jdXNUcmFwKTtcbiAgICBmb2N1c1RyYXAuX2VuYWJsZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgdGhlIEZvY3VzVHJhcCBmcm9tIHRoZSBzdGFjaywgYW5kIGFjdGl2YXRlcyB0aGVcbiAgICogRm9jdXNUcmFwIHRoYXQgaXMgdGhlIG5ldyB0b3Agb2YgdGhlIHN0YWNrLlxuICAgKi9cbiAgZGVyZWdpc3Rlcihmb2N1c1RyYXA6IE1hbmFnZWRGb2N1c1RyYXApOiB2b2lkIHtcbiAgICBmb2N1c1RyYXAuX2Rpc2FibGUoKTtcblxuICAgIGNvbnN0IHN0YWNrID0gdGhpcy5fZm9jdXNUcmFwU3RhY2s7XG5cbiAgICBjb25zdCBpID0gc3RhY2suaW5kZXhPZihmb2N1c1RyYXApO1xuICAgIGlmIChpICE9PSAtMSkge1xuICAgICAgc3RhY2suc3BsaWNlKGksIDEpO1xuICAgICAgaWYgKHN0YWNrLmxlbmd0aCkge1xuICAgICAgICBzdGFja1tzdGFjay5sZW5ndGggLSAxXS5fZW5hYmxlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=