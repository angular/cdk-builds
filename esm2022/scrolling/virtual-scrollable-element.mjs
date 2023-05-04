/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directionality } from '@angular/cdk/bidi';
import { Directive, ElementRef, NgZone, Optional } from '@angular/core';
import { ScrollDispatcher } from './scroll-dispatcher';
import { CdkVirtualScrollable, VIRTUAL_SCROLLABLE } from './virtual-scrollable';
import * as i0 from "@angular/core";
import * as i1 from "./scroll-dispatcher";
import * as i2 from "@angular/cdk/bidi";
/**
 * Provides a virtual scrollable for the element it is attached to.
 */
class CdkVirtualScrollableElement extends CdkVirtualScrollable {
    constructor(elementRef, scrollDispatcher, ngZone, dir) {
        super(elementRef, scrollDispatcher, ngZone, dir);
    }
    measureBoundingClientRectWithScrollOffset(from) {
        return (this.getElementRef().nativeElement.getBoundingClientRect()[from] -
            this.measureScrollOffset(from));
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkVirtualScrollableElement, deps: [{ token: i0.ElementRef }, { token: i1.ScrollDispatcher }, { token: i0.NgZone }, { token: i2.Directionality, optional: true }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.0", type: CdkVirtualScrollableElement, isStandalone: true, selector: "[cdkVirtualScrollingElement]", host: { classAttribute: "cdk-virtual-scrollable" }, providers: [{ provide: VIRTUAL_SCROLLABLE, useExisting: CdkVirtualScrollableElement }], usesInheritance: true, ngImport: i0 }); }
}
export { CdkVirtualScrollableElement };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkVirtualScrollableElement, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkVirtualScrollingElement]',
                    providers: [{ provide: VIRTUAL_SCROLLABLE, useExisting: CdkVirtualScrollableElement }],
                    standalone: true,
                    host: {
                        'class': 'cdk-virtual-scrollable',
                    },
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i1.ScrollDispatcher }, { type: i0.NgZone }, { type: i2.Directionality, decorators: [{
                    type: Optional
                }] }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1zY3JvbGxhYmxlLWVsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy92aXJ0dWFsLXNjcm9sbGFibGUtZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN0RSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsb0JBQW9CLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQzs7OztBQUU5RTs7R0FFRztBQUNILE1BUWEsMkJBQTRCLFNBQVEsb0JBQW9CO0lBQ25FLFlBQ0UsVUFBc0IsRUFDdEIsZ0JBQWtDLEVBQ2xDLE1BQWMsRUFDRixHQUFtQjtRQUUvQixLQUFLLENBQUMsVUFBVSxFQUFFLGdCQUFnQixFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRVEseUNBQXlDLENBQ2hELElBQXlDO1FBRXpDLE9BQU8sQ0FDTCxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsYUFBYSxDQUFDLHFCQUFxQixFQUFFLENBQUMsSUFBSSxDQUFDO1lBQ2hFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FDL0IsQ0FBQztJQUNKLENBQUM7OEdBakJVLDJCQUEyQjtrR0FBM0IsMkJBQTJCLCtIQU4zQixDQUFDLEVBQUMsT0FBTyxFQUFFLGtCQUFrQixFQUFFLFdBQVcsRUFBRSwyQkFBMkIsRUFBQyxDQUFDOztTQU16RSwyQkFBMkI7MkZBQTNCLDJCQUEyQjtrQkFSdkMsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUsOEJBQThCO29CQUN4QyxTQUFTLEVBQUUsQ0FBQyxFQUFDLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxXQUFXLDZCQUE2QixFQUFDLENBQUM7b0JBQ3BGLFVBQVUsRUFBRSxJQUFJO29CQUNoQixJQUFJLEVBQUU7d0JBQ0osT0FBTyxFQUFFLHdCQUF3QjtxQkFDbEM7aUJBQ0Y7OzBCQU1JLFFBQVEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtEaXJlY3RpdmUsIEVsZW1lbnRSZWYsIE5nWm9uZSwgT3B0aW9uYWx9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtTY3JvbGxEaXNwYXRjaGVyfSBmcm9tICcuL3Njcm9sbC1kaXNwYXRjaGVyJztcbmltcG9ydCB7Q2RrVmlydHVhbFNjcm9sbGFibGUsIFZJUlRVQUxfU0NST0xMQUJMRX0gZnJvbSAnLi92aXJ0dWFsLXNjcm9sbGFibGUnO1xuXG4vKipcbiAqIFByb3ZpZGVzIGEgdmlydHVhbCBzY3JvbGxhYmxlIGZvciB0aGUgZWxlbWVudCBpdCBpcyBhdHRhY2hlZCB0by5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka1ZpcnR1YWxTY3JvbGxpbmdFbGVtZW50XScsXG4gIHByb3ZpZGVyczogW3twcm92aWRlOiBWSVJUVUFMX1NDUk9MTEFCTEUsIHVzZUV4aXN0aW5nOiBDZGtWaXJ0dWFsU2Nyb2xsYWJsZUVsZW1lbnR9XSxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstdmlydHVhbC1zY3JvbGxhYmxlJyxcbiAgfSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrVmlydHVhbFNjcm9sbGFibGVFbGVtZW50IGV4dGVuZHMgQ2RrVmlydHVhbFNjcm9sbGFibGUge1xuICBjb25zdHJ1Y3RvcihcbiAgICBlbGVtZW50UmVmOiBFbGVtZW50UmVmLFxuICAgIHNjcm9sbERpc3BhdGNoZXI6IFNjcm9sbERpc3BhdGNoZXIsXG4gICAgbmdab25lOiBOZ1pvbmUsXG4gICAgQE9wdGlvbmFsKCkgZGlyOiBEaXJlY3Rpb25hbGl0eSxcbiAgKSB7XG4gICAgc3VwZXIoZWxlbWVudFJlZiwgc2Nyb2xsRGlzcGF0Y2hlciwgbmdab25lLCBkaXIpO1xuICB9XG5cbiAgb3ZlcnJpZGUgbWVhc3VyZUJvdW5kaW5nQ2xpZW50UmVjdFdpdGhTY3JvbGxPZmZzZXQoXG4gICAgZnJvbTogJ2xlZnQnIHwgJ3RvcCcgfCAncmlnaHQnIHwgJ2JvdHRvbScsXG4gICk6IG51bWJlciB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMuZ2V0RWxlbWVudFJlZigpLm5hdGl2ZUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClbZnJvbV0gLVxuICAgICAgdGhpcy5tZWFzdXJlU2Nyb2xsT2Zmc2V0KGZyb20pXG4gICAgKTtcbiAgfVxufVxuIl19