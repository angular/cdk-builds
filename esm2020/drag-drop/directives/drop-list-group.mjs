/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, Input, InjectionToken } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import * as i0 from "@angular/core";
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
export class CdkDropListGroup {
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
CdkDropListGroup.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: CdkDropListGroup, deps: [], target: i0.ɵɵFactoryTarget.Directive });
CdkDropListGroup.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.0.0-next.15", type: CdkDropListGroup, selector: "[cdkDropListGroup]", inputs: { disabled: ["cdkDropListGroupDisabled", "disabled"] }, providers: [{ provide: CDK_DROP_LIST_GROUP, useExisting: CdkDropListGroup }], exportAs: ["cdkDropListGroup"], ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: CdkDropListGroup, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkDropListGroup]',
                    exportAs: 'cdkDropListGroup',
                    providers: [{ provide: CDK_DROP_LIST_GROUP, useExisting: CdkDropListGroup }],
                }]
        }], propDecorators: { disabled: [{
                type: Input,
                args: ['cdkDropListGroupDisabled']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcC1saXN0LWdyb3VwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZGlyZWN0aXZlcy9kcm9wLWxpc3QtZ3JvdXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFNBQVMsRUFBYSxLQUFLLEVBQUUsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzFFLE9BQU8sRUFBZSxxQkFBcUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDOztBQUUxRTs7OztHQUlHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sbUJBQW1CLEdBQzVCLElBQUksY0FBYyxDQUE0QixrQkFBa0IsQ0FBQyxDQUFDO0FBRXRFOzs7OztHQUtHO0FBTUgsTUFBTSxPQUFPLGdCQUFnQjtJQUw3QjtRQU1FLDhDQUE4QztRQUNyQyxXQUFNLEdBQUcsSUFBSSxHQUFHLEVBQUssQ0FBQztRQVF2QixjQUFTLEdBQUcsS0FBSyxDQUFDO0tBTzNCO0lBYkMsK0VBQStFO0lBQy9FLElBQ0ksUUFBUSxLQUFjLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDbEQsSUFBSSxRQUFRLENBQUMsS0FBYztRQUN6QixJQUFJLENBQUMsU0FBUyxHQUFHLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2hELENBQUM7SUFHRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUN0QixDQUFDOztxSEFkVSxnQkFBZ0I7eUdBQWhCLGdCQUFnQiw2R0FGaEIsQ0FBQyxFQUFDLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxXQUFXLEVBQUUsZ0JBQWdCLEVBQUMsQ0FBQzttR0FFL0QsZ0JBQWdCO2tCQUw1QixTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSxvQkFBb0I7b0JBQzlCLFFBQVEsRUFBRSxrQkFBa0I7b0JBQzVCLFNBQVMsRUFBRSxDQUFDLEVBQUMsT0FBTyxFQUFFLG1CQUFtQixFQUFFLFdBQVcsa0JBQWtCLEVBQUMsQ0FBQztpQkFDM0U7OEJBT0ssUUFBUTtzQkFEWCxLQUFLO3VCQUFDLDBCQUEwQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGl2ZSwgT25EZXN0cm95LCBJbnB1dCwgSW5qZWN0aW9uVG9rZW59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtCb29sZWFuSW5wdXQsIGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcblxuLyoqXG4gKiBJbmplY3Rpb24gdG9rZW4gdGhhdCBjYW4gYmUgdXNlZCB0byByZWZlcmVuY2UgaW5zdGFuY2VzIG9mIGBDZGtEcm9wTGlzdEdyb3VwYC4gSXQgc2VydmVzIGFzXG4gKiBhbHRlcm5hdGl2ZSB0b2tlbiB0byB0aGUgYWN0dWFsIGBDZGtEcm9wTGlzdEdyb3VwYCBjbGFzcyB3aGljaCBjb3VsZCBjYXVzZSB1bm5lY2Vzc2FyeVxuICogcmV0ZW50aW9uIG9mIHRoZSBjbGFzcyBhbmQgaXRzIGRpcmVjdGl2ZSBtZXRhZGF0YS5cbiAqL1xuZXhwb3J0IGNvbnN0IENES19EUk9QX0xJU1RfR1JPVVAgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjxDZGtEcm9wTGlzdEdyb3VwPHVua25vd24+PignQ2RrRHJvcExpc3RHcm91cCcpO1xuXG4vKipcbiAqIERlY2xhcmF0aXZlbHkgY29ubmVjdHMgc2libGluZyBgY2RrRHJvcExpc3RgIGluc3RhbmNlcyB0b2dldGhlci4gQWxsIG9mIHRoZSBgY2RrRHJvcExpc3RgXG4gKiBlbGVtZW50cyB0aGF0IGFyZSBwbGFjZWQgaW5zaWRlIGEgYGNka0Ryb3BMaXN0R3JvdXBgIHdpbGwgYmUgY29ubmVjdGVkIHRvIGVhY2ggb3RoZXJcbiAqIGF1dG9tYXRpY2FsbHkuIENhbiBiZSB1c2VkIGFzIGFuIGFsdGVybmF0aXZlIHRvIHRoZSBgY2RrRHJvcExpc3RDb25uZWN0ZWRUb2AgaW5wdXRcbiAqIGZyb20gYGNka0Ryb3BMaXN0YC5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka0Ryb3BMaXN0R3JvdXBdJyxcbiAgZXhwb3J0QXM6ICdjZGtEcm9wTGlzdEdyb3VwJyxcbiAgcHJvdmlkZXJzOiBbe3Byb3ZpZGU6IENES19EUk9QX0xJU1RfR1JPVVAsIHVzZUV4aXN0aW5nOiBDZGtEcm9wTGlzdEdyb3VwfV0sXG59KVxuZXhwb3J0IGNsYXNzIENka0Ryb3BMaXN0R3JvdXA8VD4gaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogRHJvcCBsaXN0cyByZWdpc3RlcmVkIGluc2lkZSB0aGUgZ3JvdXAuICovXG4gIHJlYWRvbmx5IF9pdGVtcyA9IG5ldyBTZXQ8VD4oKTtcblxuICAvKiogV2hldGhlciBzdGFydGluZyBhIGRyYWdnaW5nIHNlcXVlbmNlIGZyb20gaW5zaWRlIHRoaXMgZ3JvdXAgaXMgZGlzYWJsZWQuICovXG4gIEBJbnB1dCgnY2RrRHJvcExpc3RHcm91cERpc2FibGVkJylcbiAgZ2V0IGRpc2FibGVkKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5fZGlzYWJsZWQ7IH1cbiAgc2V0IGRpc2FibGVkKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5fZGlzYWJsZWQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG4gIHByaXZhdGUgX2Rpc2FibGVkID0gZmFsc2U7XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5faXRlbXMuY2xlYXIoKTtcbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9kaXNhYmxlZDogQm9vbGVhbklucHV0O1xufVxuIl19