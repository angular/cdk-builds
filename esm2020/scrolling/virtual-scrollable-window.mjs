/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directionality } from '@angular/cdk/bidi';
import { Directive, ElementRef, NgZone, Optional } from '@angular/core';
import { fromEvent, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ScrollDispatcher } from './scroll-dispatcher';
import { CdkVirtualScrollable, VIRTUAL_SCROLLABLE } from './virtual-scrollable';
import * as i0 from "@angular/core";
import * as i1 from "./scroll-dispatcher";
import * as i2 from "@angular/cdk/bidi";
/**
 * Provides as virtual scrollable for the global / window scrollbar.
 */
export class CdkVirtualScrollableWindow extends CdkVirtualScrollable {
    constructor(scrollDispatcher, ngZone, dir) {
        super(new ElementRef(document.documentElement), scrollDispatcher, ngZone, dir);
        this._elementScrolled = new Observable((observer) => this.ngZone.runOutsideAngular(() => fromEvent(document, 'scroll').pipe(takeUntil(this._destroyed)).subscribe(observer)));
    }
    measureBoundingClientRectWithScrollOffset(from) {
        return this.getElementRef().nativeElement.getBoundingClientRect()[from];
    }
}
CdkVirtualScrollableWindow.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: CdkVirtualScrollableWindow, deps: [{ token: i1.ScrollDispatcher }, { token: i0.NgZone }, { token: i2.Directionality, optional: true }], target: i0.ɵɵFactoryTarget.Directive });
CdkVirtualScrollableWindow.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "14.2.0", type: CdkVirtualScrollableWindow, selector: "cdk-virtual-scroll-viewport[scrollWindow]", providers: [{ provide: VIRTUAL_SCROLLABLE, useExisting: CdkVirtualScrollableWindow }], usesInheritance: true, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: CdkVirtualScrollableWindow, decorators: [{
            type: Directive,
            args: [{
                    selector: 'cdk-virtual-scroll-viewport[scrollWindow]',
                    providers: [{ provide: VIRTUAL_SCROLLABLE, useExisting: CdkVirtualScrollableWindow }],
                }]
        }], ctorParameters: function () { return [{ type: i1.ScrollDispatcher }, { type: i0.NgZone }, { type: i2.Directionality, decorators: [{
                    type: Optional
                }] }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1zY3JvbGxhYmxlLXdpbmRvdy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2Nyb2xsaW5nL3ZpcnR1YWwtc2Nyb2xsYWJsZS13aW5kb3cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxTQUFTLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDdEUsT0FBTyxFQUFDLFNBQVMsRUFBRSxVQUFVLEVBQVcsTUFBTSxNQUFNLENBQUM7QUFDckQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLHNCQUFzQixDQUFDOzs7O0FBRTlFOztHQUVHO0FBS0gsTUFBTSxPQUFPLDBCQUEyQixTQUFRLG9CQUFvQjtJQVFsRSxZQUFZLGdCQUFrQyxFQUFFLE1BQWMsRUFBYyxHQUFtQjtRQUM3RixLQUFLLENBQUMsSUFBSSxVQUFVLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztRQVI5RCxxQkFBZ0IsR0FBc0IsSUFBSSxVQUFVLENBQ3JFLENBQUMsUUFBeUIsRUFBRSxFQUFFLENBQzVCLElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFLENBQ2pDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQ25GLENBQ0osQ0FBQztJQUlGLENBQUM7SUFFUSx5Q0FBeUMsQ0FDaEQsSUFBeUM7UUFFekMsT0FBTyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsYUFBYSxDQUFDLHFCQUFxQixFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDMUUsQ0FBQzs7dUhBaEJVLDBCQUEwQjsyR0FBMUIsMEJBQTBCLG9FQUYxQixDQUFDLEVBQUMsT0FBTyxFQUFFLGtCQUFrQixFQUFFLFdBQVcsRUFBRSwwQkFBMEIsRUFBQyxDQUFDOzJGQUV4RSwwQkFBMEI7a0JBSnRDLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLDJDQUEyQztvQkFDckQsU0FBUyxFQUFFLENBQUMsRUFBQyxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsV0FBVyw0QkFBNEIsRUFBQyxDQUFDO2lCQUNwRjs7MEJBU2tFLFFBQVEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtEaXJlY3RpdmUsIEVsZW1lbnRSZWYsIE5nWm9uZSwgT3B0aW9uYWx9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtmcm9tRXZlbnQsIE9ic2VydmFibGUsIE9ic2VydmVyfSBmcm9tICdyeGpzJztcbmltcG9ydCB7dGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge1Njcm9sbERpc3BhdGNoZXJ9IGZyb20gJy4vc2Nyb2xsLWRpc3BhdGNoZXInO1xuaW1wb3J0IHtDZGtWaXJ0dWFsU2Nyb2xsYWJsZSwgVklSVFVBTF9TQ1JPTExBQkxFfSBmcm9tICcuL3ZpcnR1YWwtc2Nyb2xsYWJsZSc7XG5cbi8qKlxuICogUHJvdmlkZXMgYXMgdmlydHVhbCBzY3JvbGxhYmxlIGZvciB0aGUgZ2xvYmFsIC8gd2luZG93IHNjcm9sbGJhci5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnY2RrLXZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0W3Njcm9sbFdpbmRvd10nLFxuICBwcm92aWRlcnM6IFt7cHJvdmlkZTogVklSVFVBTF9TQ1JPTExBQkxFLCB1c2VFeGlzdGluZzogQ2RrVmlydHVhbFNjcm9sbGFibGVXaW5kb3d9XSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrVmlydHVhbFNjcm9sbGFibGVXaW5kb3cgZXh0ZW5kcyBDZGtWaXJ0dWFsU2Nyb2xsYWJsZSB7XG4gIHByb3RlY3RlZCBvdmVycmlkZSBfZWxlbWVudFNjcm9sbGVkOiBPYnNlcnZhYmxlPEV2ZW50PiA9IG5ldyBPYnNlcnZhYmxlKFxuICAgIChvYnNlcnZlcjogT2JzZXJ2ZXI8RXZlbnQ+KSA9PlxuICAgICAgdGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT5cbiAgICAgICAgZnJvbUV2ZW50KGRvY3VtZW50LCAnc2Nyb2xsJykucGlwZSh0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSkuc3Vic2NyaWJlKG9ic2VydmVyKSxcbiAgICAgICksXG4gICk7XG5cbiAgY29uc3RydWN0b3Ioc2Nyb2xsRGlzcGF0Y2hlcjogU2Nyb2xsRGlzcGF0Y2hlciwgbmdab25lOiBOZ1pvbmUsIEBPcHRpb25hbCgpIGRpcjogRGlyZWN0aW9uYWxpdHkpIHtcbiAgICBzdXBlcihuZXcgRWxlbWVudFJlZihkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQpLCBzY3JvbGxEaXNwYXRjaGVyLCBuZ1pvbmUsIGRpcik7XG4gIH1cblxuICBvdmVycmlkZSBtZWFzdXJlQm91bmRpbmdDbGllbnRSZWN0V2l0aFNjcm9sbE9mZnNldChcbiAgICBmcm9tOiAnbGVmdCcgfCAndG9wJyB8ICdyaWdodCcgfCAnYm90dG9tJyxcbiAgKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5nZXRFbGVtZW50UmVmKCkubmF0aXZlRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVtmcm9tXTtcbiAgfVxufVxuIl19