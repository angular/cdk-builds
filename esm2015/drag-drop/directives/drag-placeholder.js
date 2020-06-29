/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, TemplateRef, Input, InjectionToken } from '@angular/core';
/**
 * Injection token that can be used to reference instances of `CdkDragPlaceholder`. It serves as
 * alternative token to the actual `CdkDragPlaceholder` class which could cause unnecessary
 * retention of the class and its directive metadata.
 */
export const CDK_DRAG_PLACEHOLDER = new InjectionToken('CdkDragPlaceholder');
/**
 * Element that will be used as a template for the placeholder of a CdkDrag when
 * it is being dragged. The placeholder is displayed in place of the element being dragged.
 */
let CdkDragPlaceholder = /** @class */ (() => {
    class CdkDragPlaceholder {
        constructor(templateRef) {
            this.templateRef = templateRef;
        }
    }
    CdkDragPlaceholder.decorators = [
        { type: Directive, args: [{
                    selector: 'ng-template[cdkDragPlaceholder]',
                    providers: [{ provide: CDK_DRAG_PLACEHOLDER, useExisting: CdkDragPlaceholder }],
                },] }
    ];
    CdkDragPlaceholder.ctorParameters = () => [
        { type: TemplateRef }
    ];
    CdkDragPlaceholder.propDecorators = {
        data: [{ type: Input }]
    };
    return CdkDragPlaceholder;
})();
export { CdkDragPlaceholder };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1wbGFjZWhvbGRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2RpcmVjdGl2ZXMvZHJhZy1wbGFjZWhvbGRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsU0FBUyxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRTVFOzs7O0dBSUc7QUFDSCxNQUFNLENBQUMsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLGNBQWMsQ0FBcUIsb0JBQW9CLENBQUMsQ0FBQztBQUVqRzs7O0dBR0c7QUFDSDtJQUFBLE1BSWEsa0JBQWtCO1FBRzdCLFlBQW1CLFdBQTJCO1lBQTNCLGdCQUFXLEdBQVgsV0FBVyxDQUFnQjtRQUFHLENBQUM7OztnQkFQbkQsU0FBUyxTQUFDO29CQUNULFFBQVEsRUFBRSxpQ0FBaUM7b0JBQzNDLFNBQVMsRUFBRSxDQUFDLEVBQUMsT0FBTyxFQUFFLG9CQUFvQixFQUFFLFdBQVcsRUFBRSxrQkFBa0IsRUFBQyxDQUFDO2lCQUM5RTs7O2dCQWhCa0IsV0FBVzs7O3VCQW1CM0IsS0FBSzs7SUFFUix5QkFBQztLQUFBO1NBSlksa0JBQWtCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aXZlLCBUZW1wbGF0ZVJlZiwgSW5wdXQsIEluamVjdGlvblRva2VufSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuLyoqXG4gKiBJbmplY3Rpb24gdG9rZW4gdGhhdCBjYW4gYmUgdXNlZCB0byByZWZlcmVuY2UgaW5zdGFuY2VzIG9mIGBDZGtEcmFnUGxhY2Vob2xkZXJgLiBJdCBzZXJ2ZXMgYXNcbiAqIGFsdGVybmF0aXZlIHRva2VuIHRvIHRoZSBhY3R1YWwgYENka0RyYWdQbGFjZWhvbGRlcmAgY2xhc3Mgd2hpY2ggY291bGQgY2F1c2UgdW5uZWNlc3NhcnlcbiAqIHJldGVudGlvbiBvZiB0aGUgY2xhc3MgYW5kIGl0cyBkaXJlY3RpdmUgbWV0YWRhdGEuXG4gKi9cbmV4cG9ydCBjb25zdCBDREtfRFJBR19QTEFDRUhPTERFUiA9IG5ldyBJbmplY3Rpb25Ub2tlbjxDZGtEcmFnUGxhY2Vob2xkZXI+KCdDZGtEcmFnUGxhY2Vob2xkZXInKTtcblxuLyoqXG4gKiBFbGVtZW50IHRoYXQgd2lsbCBiZSB1c2VkIGFzIGEgdGVtcGxhdGUgZm9yIHRoZSBwbGFjZWhvbGRlciBvZiBhIENka0RyYWcgd2hlblxuICogaXQgaXMgYmVpbmcgZHJhZ2dlZC4gVGhlIHBsYWNlaG9sZGVyIGlzIGRpc3BsYXllZCBpbiBwbGFjZSBvZiB0aGUgZWxlbWVudCBiZWluZyBkcmFnZ2VkLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICduZy10ZW1wbGF0ZVtjZGtEcmFnUGxhY2Vob2xkZXJdJyxcbiAgcHJvdmlkZXJzOiBbe3Byb3ZpZGU6IENES19EUkFHX1BMQUNFSE9MREVSLCB1c2VFeGlzdGluZzogQ2RrRHJhZ1BsYWNlaG9sZGVyfV0sXG59KVxuZXhwb3J0IGNsYXNzIENka0RyYWdQbGFjZWhvbGRlcjxUID0gYW55PiB7XG4gIC8qKiBDb250ZXh0IGRhdGEgdG8gYmUgYWRkZWQgdG8gdGhlIHBsYWNlaG9sZGVyIHRlbXBsYXRlIGluc3RhbmNlLiAqL1xuICBASW5wdXQoKSBkYXRhOiBUO1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgdGVtcGxhdGVSZWY6IFRlbXBsYXRlUmVmPFQ+KSB7fVxufVxuIl19