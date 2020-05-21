import { __decorate, __metadata, __param } from "tslib";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, Inject, InjectionToken, Optional, ViewContainerRef, } from '@angular/core';
/**
 * Injection token used to provide a `CdkTreeNode` to its outlet.
 * Used primarily to avoid circular imports.
 * @docs-private
 */
export const CDK_TREE_NODE_OUTLET_NODE = new InjectionToken('CDK_TREE_NODE_OUTLET_NODE');
/**
 * Outlet for nested CdkNode. Put `[cdkTreeNodeOutlet]` on a tag to place children dataNodes
 * inside the outlet.
 */
let CdkTreeNodeOutlet = /** @class */ (() => {
    let CdkTreeNodeOutlet = class CdkTreeNodeOutlet {
        constructor(viewContainer, _node) {
            this.viewContainer = viewContainer;
            this._node = _node;
        }
    };
    CdkTreeNodeOutlet = __decorate([
        Directive({
            selector: '[cdkTreeNodeOutlet]'
        }),
        __param(1, Inject(CDK_TREE_NODE_OUTLET_NODE)), __param(1, Optional()),
        __metadata("design:paramtypes", [ViewContainerRef, Object])
    ], CdkTreeNodeOutlet);
    return CdkTreeNodeOutlet;
})();
export { CdkTreeNodeOutlet };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0bGV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90cmVlL291dGxldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HO0FBQ0gsT0FBTyxFQUNMLFNBQVMsRUFDVCxNQUFNLEVBQ04sY0FBYyxFQUNkLFFBQVEsRUFDUixnQkFBZ0IsR0FDakIsTUFBTSxlQUFlLENBQUM7QUFFdkI7Ozs7R0FJRztBQUNILE1BQU0sQ0FBQyxNQUFNLHlCQUF5QixHQUFHLElBQUksY0FBYyxDQUFLLDJCQUEyQixDQUFDLENBQUM7QUFFN0Y7OztHQUdHO0FBSUg7SUFBQSxJQUFhLGlCQUFpQixHQUE5QixNQUFhLGlCQUFpQjtRQUM1QixZQUNXLGFBQStCLEVBQ2dCLEtBQVc7WUFEMUQsa0JBQWEsR0FBYixhQUFhLENBQWtCO1lBQ2dCLFVBQUssR0FBTCxLQUFLLENBQU07UUFBRyxDQUFDO0tBQzFFLENBQUE7SUFKWSxpQkFBaUI7UUFIN0IsU0FBUyxDQUFDO1lBQ1QsUUFBUSxFQUFFLHFCQUFxQjtTQUNoQyxDQUFDO1FBSUssV0FBQSxNQUFNLENBQUMseUJBQXlCLENBQUMsQ0FBQSxFQUFFLFdBQUEsUUFBUSxFQUFFLENBQUE7eUNBRHhCLGdCQUFnQjtPQUYvQixpQkFBaUIsQ0FJN0I7SUFBRCx3QkFBQztLQUFBO1NBSlksaUJBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIEluamVjdCxcbiAgSW5qZWN0aW9uVG9rZW4sXG4gIE9wdGlvbmFsLFxuICBWaWV3Q29udGFpbmVyUmVmLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuLyoqXG4gKiBJbmplY3Rpb24gdG9rZW4gdXNlZCB0byBwcm92aWRlIGEgYENka1RyZWVOb2RlYCB0byBpdHMgb3V0bGV0LlxuICogVXNlZCBwcmltYXJpbHkgdG8gYXZvaWQgY2lyY3VsYXIgaW1wb3J0cy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGNvbnN0IENES19UUkVFX05PREVfT1VUTEVUX05PREUgPSBuZXcgSW5qZWN0aW9uVG9rZW48e30+KCdDREtfVFJFRV9OT0RFX09VVExFVF9OT0RFJyk7XG5cbi8qKlxuICogT3V0bGV0IGZvciBuZXN0ZWQgQ2RrTm9kZS4gUHV0IGBbY2RrVHJlZU5vZGVPdXRsZXRdYCBvbiBhIHRhZyB0byBwbGFjZSBjaGlsZHJlbiBkYXRhTm9kZXNcbiAqIGluc2lkZSB0aGUgb3V0bGV0LlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrVHJlZU5vZGVPdXRsZXRdJ1xufSlcbmV4cG9ydCBjbGFzcyBDZGtUcmVlTm9kZU91dGxldCB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIHZpZXdDb250YWluZXI6IFZpZXdDb250YWluZXJSZWYsXG4gICAgICBASW5qZWN0KENES19UUkVFX05PREVfT1VUTEVUX05PREUpIEBPcHRpb25hbCgpIHB1YmxpYyBfbm9kZT86IGFueSkge31cbn1cbiJdfQ==