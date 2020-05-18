/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/drag-drop/directives/drop-list-group.ts
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
let CdkDropListGroup = /** @class */ (() => {
    /**
     * Declaratively connects sibling `cdkDropList` instances together. All of the `cdkDropList`
     * elements that are placed inside a `cdkDropListGroup` will be connected to each other
     * automatically. Can be used as an alternative to the `cdkDropListConnectedTo` input
     * from `cdkDropList`.
     * @template T
     */
    class CdkDropListGroup {
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
    return CdkDropListGroup;
})();
export { CdkDropListGroup };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LWdyb3VwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZGlyZWN0aXZlcy9kcm9wLWxpc3QtZ3JvdXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFNBQVMsRUFBYSxLQUFLLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDMUQsT0FBTyxFQUFlLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7Ozs7Ozs7O0FBUTFFOzs7Ozs7OztJQUFBLE1BSWEsZ0JBQWdCO1FBSjdCOzs7O1lBTVcsV0FBTSxHQUFHLElBQUksR0FBRyxFQUFLLENBQUM7WUFRdkIsY0FBUyxHQUFHLEtBQUssQ0FBQztRQU81QixDQUFDOzs7OztRQVpDLElBQ0ksUUFBUSxLQUFjLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7Ozs7O1FBQ2xELElBQUksUUFBUSxDQUFDLEtBQWM7WUFDekIsSUFBSSxDQUFDLFNBQVMsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoRCxDQUFDOzs7O1FBR0QsV0FBVztZQUNULElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDdEIsQ0FBQzs7O2dCQWxCRixTQUFTLFNBQUM7b0JBQ1QsUUFBUSxFQUFFLG9CQUFvQjtvQkFDOUIsUUFBUSxFQUFFLGtCQUFrQjtpQkFDN0I7OzsyQkFNRSxLQUFLLFNBQUMsMEJBQTBCOztJQVluQyx1QkFBQztLQUFBO1NBakJZLGdCQUFnQjs7O0lBZ0IzQiw0Q0FBZ0Q7Ozs7O0lBZGhELGtDQUErQjs7Ozs7SUFRL0IscUNBQTBCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aXZlLCBPbkRlc3Ryb3ksIElucHV0fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Qm9vbGVhbklucHV0LCBjb2VyY2VCb29sZWFuUHJvcGVydHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5cbi8qKlxuICogRGVjbGFyYXRpdmVseSBjb25uZWN0cyBzaWJsaW5nIGBjZGtEcm9wTGlzdGAgaW5zdGFuY2VzIHRvZ2V0aGVyLiBBbGwgb2YgdGhlIGBjZGtEcm9wTGlzdGBcbiAqIGVsZW1lbnRzIHRoYXQgYXJlIHBsYWNlZCBpbnNpZGUgYSBgY2RrRHJvcExpc3RHcm91cGAgd2lsbCBiZSBjb25uZWN0ZWQgdG8gZWFjaCBvdGhlclxuICogYXV0b21hdGljYWxseS4gQ2FuIGJlIHVzZWQgYXMgYW4gYWx0ZXJuYXRpdmUgdG8gdGhlIGBjZGtEcm9wTGlzdENvbm5lY3RlZFRvYCBpbnB1dFxuICogZnJvbSBgY2RrRHJvcExpc3RgLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrRHJvcExpc3RHcm91cF0nLFxuICBleHBvcnRBczogJ2Nka0Ryb3BMaXN0R3JvdXAnLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtEcm9wTGlzdEdyb3VwPFQ+IGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIERyb3AgbGlzdHMgcmVnaXN0ZXJlZCBpbnNpZGUgdGhlIGdyb3VwLiAqL1xuICByZWFkb25seSBfaXRlbXMgPSBuZXcgU2V0PFQ+KCk7XG5cbiAgLyoqIFdoZXRoZXIgc3RhcnRpbmcgYSBkcmFnZ2luZyBzZXF1ZW5jZSBmcm9tIGluc2lkZSB0aGlzIGdyb3VwIGlzIGRpc2FibGVkLiAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0R3JvdXBEaXNhYmxlZCcpXG4gIGdldCBkaXNhYmxlZCgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX2Rpc2FibGVkOyB9XG4gIHNldCBkaXNhYmxlZCh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX2Rpc2FibGVkID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgfVxuICBwcml2YXRlIF9kaXNhYmxlZCA9IGZhbHNlO1xuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2l0ZW1zLmNsZWFyKCk7XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfZGlzYWJsZWQ6IEJvb2xlYW5JbnB1dDtcbn1cbiJdfQ==