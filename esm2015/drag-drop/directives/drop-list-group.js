/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, Input } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
/**
 * Declaratively connects sibling `cdkDropList` instances together. All of the `cdkDropList`
 * elements that are placed inside a `cdkDropListGroup` will be connected to each other
 * automatically. Can be used as an alternative to the `cdkDropListConnectedTo` input
 * from `cdkDropList`.
 * @template T
 */
export class CdkDropListGroup {
    constructor() {
        /**
         * Drop lists registered inside the group.
         */
        this._items = new Set();
        this._disabled = false;
    }
    /**
     * Whether starting a dragging sequence from inside this group is disabled.
     * @return {?}
     */
    get disabled() { return this._disabled; }
    /**
     * @param {?} value
     * @return {?}
     */
    set disabled(value) {
        this._disabled = coerceBooleanProperty(value);
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        this._items.clear();
    }
}
CdkDropListGroup.decorators = [
    { type: Directive, args: [{
                selector: '[cdkDropListGroup]',
                exportAs: 'cdkDropListGroup',
            },] }
];
CdkDropListGroup.propDecorators = {
    disabled: [{ type: Input, args: ['cdkDropListGroupDisabled',] }]
};
if (false) {
    /** @type {?} */
    CdkDropListGroup.ngAcceptInputType_disabled;
    /**
     * Drop lists registered inside the group.
     * @type {?}
     */
    CdkDropListGroup.prototype._items;
    /**
     * @type {?}
     * @private
     */
    CdkDropListGroup.prototype._disabled;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LWdyb3VwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZGlyZWN0aXZlcy9kcm9wLWxpc3QtZ3JvdXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsU0FBUyxFQUFhLEtBQUssRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMxRCxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQzs7Ozs7Ozs7QUFZNUQsTUFBTSxPQUFPLGdCQUFnQjtJQUo3Qjs7OztRQU1XLFdBQU0sR0FBRyxJQUFJLEdBQUcsRUFBSyxDQUFDO1FBUXZCLGNBQVMsR0FBRyxLQUFLLENBQUM7SUFPNUIsQ0FBQzs7Ozs7SUFaQyxJQUNJLFFBQVEsS0FBYyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDOzs7OztJQUNsRCxJQUFJLFFBQVEsQ0FBQyxLQUFjO1FBQ3pCLElBQUksQ0FBQyxTQUFTLEdBQUcscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDaEQsQ0FBQzs7OztJQUdELFdBQVc7UUFDVCxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3RCLENBQUM7OztZQWxCRixTQUFTLFNBQUM7Z0JBQ1QsUUFBUSxFQUFFLG9CQUFvQjtnQkFDOUIsUUFBUSxFQUFFLGtCQUFrQjthQUM3Qjs7O3VCQU1FLEtBQUssU0FBQywwQkFBMEI7Ozs7SUFXakMsNENBQW9EOzs7OztJQWRwRCxrQ0FBK0I7Ozs7O0lBUS9CLHFDQUEwQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGl2ZSwgT25EZXN0cm95LCBJbnB1dH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge2NvZXJjZUJvb2xlYW5Qcm9wZXJ0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcblxuLyoqXG4gKiBEZWNsYXJhdGl2ZWx5IGNvbm5lY3RzIHNpYmxpbmcgYGNka0Ryb3BMaXN0YCBpbnN0YW5jZXMgdG9nZXRoZXIuIEFsbCBvZiB0aGUgYGNka0Ryb3BMaXN0YFxuICogZWxlbWVudHMgdGhhdCBhcmUgcGxhY2VkIGluc2lkZSBhIGBjZGtEcm9wTGlzdEdyb3VwYCB3aWxsIGJlIGNvbm5lY3RlZCB0byBlYWNoIG90aGVyXG4gKiBhdXRvbWF0aWNhbGx5LiBDYW4gYmUgdXNlZCBhcyBhbiBhbHRlcm5hdGl2ZSB0byB0aGUgYGNka0Ryb3BMaXN0Q29ubmVjdGVkVG9gIGlucHV0XG4gKiBmcm9tIGBjZGtEcm9wTGlzdGAuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtEcm9wTGlzdEdyb3VwXScsXG4gIGV4cG9ydEFzOiAnY2RrRHJvcExpc3RHcm91cCcsXG59KVxuZXhwb3J0IGNsYXNzIENka0Ryb3BMaXN0R3JvdXA8VD4gaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogRHJvcCBsaXN0cyByZWdpc3RlcmVkIGluc2lkZSB0aGUgZ3JvdXAuICovXG4gIHJlYWRvbmx5IF9pdGVtcyA9IG5ldyBTZXQ8VD4oKTtcblxuICAvKiogV2hldGhlciBzdGFydGluZyBhIGRyYWdnaW5nIHNlcXVlbmNlIGZyb20gaW5zaWRlIHRoaXMgZ3JvdXAgaXMgZGlzYWJsZWQuICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3RHcm91cERpc2FibGVkJylcbiAgZ2V0IGRpc2FibGVkKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5fZGlzYWJsZWQ7IH1cbiAgc2V0IGRpc2FibGVkKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5fZGlzYWJsZWQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG4gIHByaXZhdGUgX2Rpc2FibGVkID0gZmFsc2U7XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5faXRlbXMuY2xlYXIoKTtcbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9kaXNhYmxlZDogYm9vbGVhbiB8IHN0cmluZztcbn1cbiJdfQ==