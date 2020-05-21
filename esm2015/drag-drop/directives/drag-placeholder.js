/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __decorate, __metadata } from "tslib";
import { Directive, TemplateRef, Input } from '@angular/core';
/**
 * Element that will be used as a template for the placeholder of a CdkDrag when
 * it is being dragged. The placeholder is displayed in place of the element being dragged.
 */
let CdkDragPlaceholder = /** @class */ (() => {
    let CdkDragPlaceholder = class CdkDragPlaceholder {
        constructor(templateRef) {
            this.templateRef = templateRef;
        }
    };
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], CdkDragPlaceholder.prototype, "data", void 0);
    CdkDragPlaceholder = __decorate([
        Directive({
            selector: 'ng-template[cdkDragPlaceholder]'
        }),
        __metadata("design:paramtypes", [TemplateRef])
    ], CdkDragPlaceholder);
    return CdkDragPlaceholder;
})();
export { CdkDragPlaceholder };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1wbGFjZWhvbGRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2RpcmVjdGl2ZXMvZHJhZy1wbGFjZWhvbGRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRTVEOzs7R0FHRztBQUlIO0lBQUEsSUFBYSxrQkFBa0IsR0FBL0IsTUFBYSxrQkFBa0I7UUFHN0IsWUFBbUIsV0FBMkI7WUFBM0IsZ0JBQVcsR0FBWCxXQUFXLENBQWdCO1FBQUcsQ0FBQztLQUNuRCxDQUFBO0lBRlU7UUFBUixLQUFLLEVBQUU7O29EQUFTO0lBRk4sa0JBQWtCO1FBSDlCLFNBQVMsQ0FBQztZQUNULFFBQVEsRUFBRSxpQ0FBaUM7U0FDNUMsQ0FBQzt5Q0FJZ0MsV0FBVztPQUhoQyxrQkFBa0IsQ0FJOUI7SUFBRCx5QkFBQztLQUFBO1NBSlksa0JBQWtCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aXZlLCBUZW1wbGF0ZVJlZiwgSW5wdXR9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG4vKipcbiAqIEVsZW1lbnQgdGhhdCB3aWxsIGJlIHVzZWQgYXMgYSB0ZW1wbGF0ZSBmb3IgdGhlIHBsYWNlaG9sZGVyIG9mIGEgQ2RrRHJhZyB3aGVuXG4gKiBpdCBpcyBiZWluZyBkcmFnZ2VkLiBUaGUgcGxhY2Vob2xkZXIgaXMgZGlzcGxheWVkIGluIHBsYWNlIG9mIHRoZSBlbGVtZW50IGJlaW5nIGRyYWdnZWQuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ25nLXRlbXBsYXRlW2Nka0RyYWdQbGFjZWhvbGRlcl0nXG59KVxuZXhwb3J0IGNsYXNzIENka0RyYWdQbGFjZWhvbGRlcjxUID0gYW55PiB7XG4gIC8qKiBDb250ZXh0IGRhdGEgdG8gYmUgYWRkZWQgdG8gdGhlIHBsYWNlaG9sZGVyIHRlbXBsYXRlIGluc3RhbmNlLiAqL1xuICBASW5wdXQoKSBkYXRhOiBUO1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgdGVtcGxhdGVSZWY6IFRlbXBsYXRlUmVmPFQ+KSB7fVxufVxuIl19