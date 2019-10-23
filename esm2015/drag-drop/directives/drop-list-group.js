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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LWdyb3VwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZGlyZWN0aXZlcy9kcm9wLWxpc3QtZ3JvdXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsU0FBUyxFQUFhLEtBQUssRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMxRCxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQzs7Ozs7Ozs7QUFZNUQsTUFBTSxPQUFPLGdCQUFnQjtJQUo3Qjs7OztRQU1XLFdBQU0sR0FBRyxJQUFJLEdBQUcsRUFBSyxDQUFDO1FBUXZCLGNBQVMsR0FBRyxLQUFLLENBQUM7SUFLNUIsQ0FBQzs7Ozs7SUFWQyxJQUNJLFFBQVEsS0FBYyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDOzs7OztJQUNsRCxJQUFJLFFBQVEsQ0FBQyxLQUFjO1FBQ3pCLElBQUksQ0FBQyxTQUFTLEdBQUcscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDaEQsQ0FBQzs7OztJQUdELFdBQVc7UUFDVCxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3RCLENBQUM7OztZQWxCRixTQUFTLFNBQUM7Z0JBQ1QsUUFBUSxFQUFFLG9CQUFvQjtnQkFDOUIsUUFBUSxFQUFFLGtCQUFrQjthQUM3Qjs7O3VCQU1FLEtBQUssU0FBQywwQkFBMEI7Ozs7Ozs7SUFIakMsa0NBQStCOzs7OztJQVEvQixxQ0FBMEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3RpdmUsIE9uRGVzdHJveSwgSW5wdXR9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtjb2VyY2VCb29sZWFuUHJvcGVydHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5cbi8qKlxuICogRGVjbGFyYXRpdmVseSBjb25uZWN0cyBzaWJsaW5nIGBjZGtEcm9wTGlzdGAgaW5zdGFuY2VzIHRvZ2V0aGVyLiBBbGwgb2YgdGhlIGBjZGtEcm9wTGlzdGBcbiAqIGVsZW1lbnRzIHRoYXQgYXJlIHBsYWNlZCBpbnNpZGUgYSBgY2RrRHJvcExpc3RHcm91cGAgd2lsbCBiZSBjb25uZWN0ZWQgdG8gZWFjaCBvdGhlclxuICogYXV0b21hdGljYWxseS4gQ2FuIGJlIHVzZWQgYXMgYW4gYWx0ZXJuYXRpdmUgdG8gdGhlIGBjZGtEcm9wTGlzdENvbm5lY3RlZFRvYCBpbnB1dFxuICogZnJvbSBgY2RrRHJvcExpc3RgLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrRHJvcExpc3RHcm91cF0nLFxuICBleHBvcnRBczogJ2Nka0Ryb3BMaXN0R3JvdXAnLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtEcm9wTGlzdEdyb3VwPFQ+IGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIERyb3AgbGlzdHMgcmVnaXN0ZXJlZCBpbnNpZGUgdGhlIGdyb3VwLiAqL1xuICByZWFkb25seSBfaXRlbXMgPSBuZXcgU2V0PFQ+KCk7XG5cbiAgLyoqIFdoZXRoZXIgc3RhcnRpbmcgYSBkcmFnZ2luZyBzZXF1ZW5jZSBmcm9tIGluc2lkZSB0aGlzIGdyb3VwIGlzIGRpc2FibGVkLiAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0R3JvdXBEaXNhYmxlZCcpXG4gIGdldCBkaXNhYmxlZCgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX2Rpc2FibGVkOyB9XG4gIHNldCBkaXNhYmxlZCh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX2Rpc2FibGVkID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgfVxuICBwcml2YXRlIF9kaXNhYmxlZCA9IGZhbHNlO1xuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2l0ZW1zLmNsZWFyKCk7XG4gIH1cbn1cbiJdfQ==