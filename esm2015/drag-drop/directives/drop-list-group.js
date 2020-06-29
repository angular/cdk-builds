/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, Input, InjectionToken } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
/**
 * Injection token that can be used to reference instances of `CdkDropListGroup`. It serves as
 * alternative token to the actual `CdkDropListGroup` class which could cause unnecessary
 * retention of the class and its directive metadata.
 */
export const CDK_DROP_LIST_GROUP = new InjectionToken('CdkDropListGroup');
/**
 * Declaratively connects sibling `cdkDropList` instances together. All of the `cdkDropList`
 * elements that are placed inside a `cdkDropListGroup` will be connected to each other
 * automatically. Can be used as an alternative to the `cdkDropListConnectedTo` input
 * from `cdkDropList`.
 */
let CdkDropListGroup = /** @class */ (() => {
    class CdkDropListGroup {
        constructor() {
            /** Drop lists registered inside the group. */
            this._items = new Set();
            this._disabled = false;
        }
        /** Whether starting a dragging sequence from inside this group is disabled. */
        get disabled() { return this._disabled; }
        set disabled(value) {
            this._disabled = coerceBooleanProperty(value);
        }
        ngOnDestroy() {
            this._items.clear();
        }
    }
    CdkDropListGroup.decorators = [
        { type: Directive, args: [{
                    selector: '[cdkDropListGroup]',
                    exportAs: 'cdkDropListGroup',
                    providers: [{ provide: CDK_DROP_LIST_GROUP, useExisting: CdkDropListGroup }],
                },] }
    ];
    CdkDropListGroup.propDecorators = {
        disabled: [{ type: Input, args: ['cdkDropListGroupDisabled',] }]
    };
    return CdkDropListGroup;
})();
export { CdkDropListGroup };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LWdyb3VwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZGlyZWN0aXZlcy9kcm9wLWxpc3QtZ3JvdXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFNBQVMsRUFBYSxLQUFLLEVBQUUsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzFFLE9BQU8sRUFBZSxxQkFBcUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRTFFOzs7O0dBSUc7QUFDSCxNQUFNLENBQUMsTUFBTSxtQkFBbUIsR0FDNUIsSUFBSSxjQUFjLENBQTRCLGtCQUFrQixDQUFDLENBQUM7QUFFdEU7Ozs7O0dBS0c7QUFDSDtJQUFBLE1BS2EsZ0JBQWdCO1FBTDdCO1lBTUUsOENBQThDO1lBQ3JDLFdBQU0sR0FBRyxJQUFJLEdBQUcsRUFBSyxDQUFDO1lBUXZCLGNBQVMsR0FBRyxLQUFLLENBQUM7UUFPNUIsQ0FBQztRQWJDLCtFQUErRTtRQUMvRSxJQUNJLFFBQVEsS0FBYyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ2xELElBQUksUUFBUSxDQUFDLEtBQWM7WUFDekIsSUFBSSxDQUFDLFNBQVMsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBR0QsV0FBVztZQUNULElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDdEIsQ0FBQzs7O2dCQW5CRixTQUFTLFNBQUM7b0JBQ1QsUUFBUSxFQUFFLG9CQUFvQjtvQkFDOUIsUUFBUSxFQUFFLGtCQUFrQjtvQkFDNUIsU0FBUyxFQUFFLENBQUMsRUFBQyxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixFQUFDLENBQUM7aUJBQzNFOzs7MkJBTUUsS0FBSyxTQUFDLDBCQUEwQjs7SUFZbkMsdUJBQUM7S0FBQTtTQWpCWSxnQkFBZ0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3RpdmUsIE9uRGVzdHJveSwgSW5wdXQsIEluamVjdGlvblRva2VufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Qm9vbGVhbklucHV0LCBjb2VyY2VCb29sZWFuUHJvcGVydHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5cbi8qKlxuICogSW5qZWN0aW9uIHRva2VuIHRoYXQgY2FuIGJlIHVzZWQgdG8gcmVmZXJlbmNlIGluc3RhbmNlcyBvZiBgQ2RrRHJvcExpc3RHcm91cGAuIEl0IHNlcnZlcyBhc1xuICogYWx0ZXJuYXRpdmUgdG9rZW4gdG8gdGhlIGFjdHVhbCBgQ2RrRHJvcExpc3RHcm91cGAgY2xhc3Mgd2hpY2ggY291bGQgY2F1c2UgdW5uZWNlc3NhcnlcbiAqIHJldGVudGlvbiBvZiB0aGUgY2xhc3MgYW5kIGl0cyBkaXJlY3RpdmUgbWV0YWRhdGEuXG4gKi9cbmV4cG9ydCBjb25zdCBDREtfRFJPUF9MSVNUX0dST1VQID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48Q2RrRHJvcExpc3RHcm91cDx1bmtub3duPj4oJ0Nka0Ryb3BMaXN0R3JvdXAnKTtcblxuLyoqXG4gKiBEZWNsYXJhdGl2ZWx5IGNvbm5lY3RzIHNpYmxpbmcgYGNka0Ryb3BMaXN0YCBpbnN0YW5jZXMgdG9nZXRoZXIuIEFsbCBvZiB0aGUgYGNka0Ryb3BMaXN0YFxuICogZWxlbWVudHMgdGhhdCBhcmUgcGxhY2VkIGluc2lkZSBhIGBjZGtEcm9wTGlzdEdyb3VwYCB3aWxsIGJlIGNvbm5lY3RlZCB0byBlYWNoIG90aGVyXG4gKiBhdXRvbWF0aWNhbGx5LiBDYW4gYmUgdXNlZCBhcyBhbiBhbHRlcm5hdGl2ZSB0byB0aGUgYGNka0Ryb3BMaXN0Q29ubmVjdGVkVG9gIGlucHV0XG4gKiBmcm9tIGBjZGtEcm9wTGlzdGAuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtEcm9wTGlzdEdyb3VwXScsXG4gIGV4cG9ydEFzOiAnY2RrRHJvcExpc3RHcm91cCcsXG4gIHByb3ZpZGVyczogW3twcm92aWRlOiBDREtfRFJPUF9MSVNUX0dST1VQLCB1c2VFeGlzdGluZzogQ2RrRHJvcExpc3RHcm91cH1dLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtEcm9wTGlzdEdyb3VwPFQ+IGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIERyb3AgbGlzdHMgcmVnaXN0ZXJlZCBpbnNpZGUgdGhlIGdyb3VwLiAqL1xuICByZWFkb25seSBfaXRlbXMgPSBuZXcgU2V0PFQ+KCk7XG5cbiAgLyoqIFdoZXRoZXIgc3RhcnRpbmcgYSBkcmFnZ2luZyBzZXF1ZW5jZSBmcm9tIGluc2lkZSB0aGlzIGdyb3VwIGlzIGRpc2FibGVkLiAqL1xuICBASW5wdXQoJ2Nka0Ryb3BMaXN0R3JvdXBEaXNhYmxlZCcpXG4gIGdldCBkaXNhYmxlZCgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX2Rpc2FibGVkOyB9XG4gIHNldCBkaXNhYmxlZCh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX2Rpc2FibGVkID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgfVxuICBwcml2YXRlIF9kaXNhYmxlZCA9IGZhbHNlO1xuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2l0ZW1zLmNsZWFyKCk7XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfZGlzYWJsZWQ6IEJvb2xlYW5JbnB1dDtcbn1cbiJdfQ==