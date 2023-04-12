/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BidiModule } from '@angular/cdk/bidi';
import { NgModule } from '@angular/core';
import { CdkFixedSizeVirtualScroll } from './fixed-size-virtual-scroll';
import { CdkScrollable } from './scrollable';
import { CdkVirtualForOf } from './virtual-for-of';
import { CdkVirtualScrollViewport } from './virtual-scroll-viewport';
import { CdkVirtualScrollableElement } from './virtual-scrollable-element';
import { CdkVirtualScrollableWindow } from './virtual-scrollable-window';
import * as i0 from "@angular/core";
class CdkScrollableModule {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: CdkScrollableModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule }); }
    static { this.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "16.0.0-next.7", ngImport: i0, type: CdkScrollableModule, imports: [CdkScrollable], exports: [CdkScrollable] }); }
    static { this.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: CdkScrollableModule }); }
}
export { CdkScrollableModule };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: CdkScrollableModule, decorators: [{
            type: NgModule,
            args: [{
                    exports: [CdkScrollable],
                    imports: [CdkScrollable],
                }]
        }] });
/**
 * @docs-primary-export
 */
class ScrollingModule {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: ScrollingModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule }); }
    static { this.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "16.0.0-next.7", ngImport: i0, type: ScrollingModule, imports: [BidiModule, CdkScrollableModule, CdkVirtualScrollViewport,
            CdkFixedSizeVirtualScroll,
            CdkVirtualForOf,
            CdkVirtualScrollableWindow,
            CdkVirtualScrollableElement], exports: [BidiModule, CdkScrollableModule, CdkFixedSizeVirtualScroll,
            CdkVirtualForOf,
            CdkVirtualScrollViewport,
            CdkVirtualScrollableWindow,
            CdkVirtualScrollableElement] }); }
    static { this.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: ScrollingModule, imports: [BidiModule,
            CdkScrollableModule,
            CdkVirtualScrollViewport, BidiModule, CdkScrollableModule] }); }
}
export { ScrollingModule };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: ScrollingModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [
                        BidiModule,
                        CdkScrollableModule,
                        CdkVirtualScrollViewport,
                        CdkFixedSizeVirtualScroll,
                        CdkVirtualForOf,
                        CdkVirtualScrollableWindow,
                        CdkVirtualScrollableElement,
                    ],
                    exports: [
                        BidiModule,
                        CdkScrollableModule,
                        CdkFixedSizeVirtualScroll,
                        CdkVirtualForOf,
                        CdkVirtualScrollViewport,
                        CdkVirtualScrollableWindow,
                        CdkVirtualScrollableElement,
                    ],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsaW5nLW1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2Nyb2xsaW5nL3Njcm9sbGluZy1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzdDLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDdkMsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDdEUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUMzQyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDakQsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDbkUsT0FBTyxFQUFDLDJCQUEyQixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDekUsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7O0FBRXZFLE1BSWEsbUJBQW1CO3FIQUFuQixtQkFBbUI7c0hBQW5CLG1CQUFtQixZQUZwQixhQUFhLGFBRGIsYUFBYTtzSEFHWixtQkFBbUI7O1NBQW5CLG1CQUFtQjtrR0FBbkIsbUJBQW1CO2tCQUovQixRQUFRO21CQUFDO29CQUNSLE9BQU8sRUFBRSxDQUFDLGFBQWEsQ0FBQztvQkFDeEIsT0FBTyxFQUFFLENBQUMsYUFBYSxDQUFDO2lCQUN6Qjs7QUFHRDs7R0FFRztBQUNILE1Bb0JhLGVBQWU7cUhBQWYsZUFBZTtzSEFBZixlQUFlLFlBbEJ4QixVQUFVLEVBUEQsbUJBQW1CLEVBUzVCLHdCQUF3QjtZQUN4Qix5QkFBeUI7WUFDekIsZUFBZTtZQUNmLDBCQUEwQjtZQUMxQiwyQkFBMkIsYUFHM0IsVUFBVSxFQWhCRCxtQkFBbUIsRUFrQjVCLHlCQUF5QjtZQUN6QixlQUFlO1lBQ2Ysd0JBQXdCO1lBQ3hCLDBCQUEwQjtZQUMxQiwyQkFBMkI7c0hBR2xCLGVBQWUsWUFsQnhCLFVBQVU7WUFDVixtQkFBbUI7WUFDbkIsd0JBQXdCLEVBT3hCLFVBQVUsRUFoQkQsbUJBQW1COztTQXlCbkIsZUFBZTtrR0FBZixlQUFlO2tCQXBCM0IsUUFBUTttQkFBQztvQkFDUixPQUFPLEVBQUU7d0JBQ1AsVUFBVTt3QkFDVixtQkFBbUI7d0JBQ25CLHdCQUF3Qjt3QkFDeEIseUJBQXlCO3dCQUN6QixlQUFlO3dCQUNmLDBCQUEwQjt3QkFDMUIsMkJBQTJCO3FCQUM1QjtvQkFDRCxPQUFPLEVBQUU7d0JBQ1AsVUFBVTt3QkFDVixtQkFBbUI7d0JBQ25CLHlCQUF5Qjt3QkFDekIsZUFBZTt3QkFDZix3QkFBd0I7d0JBQ3hCLDBCQUEwQjt3QkFDMUIsMkJBQTJCO3FCQUM1QjtpQkFDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0JpZGlNb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7TmdNb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtDZGtGaXhlZFNpemVWaXJ0dWFsU2Nyb2xsfSBmcm9tICcuL2ZpeGVkLXNpemUtdmlydHVhbC1zY3JvbGwnO1xuaW1wb3J0IHtDZGtTY3JvbGxhYmxlfSBmcm9tICcuL3Njcm9sbGFibGUnO1xuaW1wb3J0IHtDZGtWaXJ0dWFsRm9yT2Z9IGZyb20gJy4vdmlydHVhbC1mb3Itb2YnO1xuaW1wb3J0IHtDZGtWaXJ0dWFsU2Nyb2xsVmlld3BvcnR9IGZyb20gJy4vdmlydHVhbC1zY3JvbGwtdmlld3BvcnQnO1xuaW1wb3J0IHtDZGtWaXJ0dWFsU2Nyb2xsYWJsZUVsZW1lbnR9IGZyb20gJy4vdmlydHVhbC1zY3JvbGxhYmxlLWVsZW1lbnQnO1xuaW1wb3J0IHtDZGtWaXJ0dWFsU2Nyb2xsYWJsZVdpbmRvd30gZnJvbSAnLi92aXJ0dWFsLXNjcm9sbGFibGUtd2luZG93JztcblxuQE5nTW9kdWxlKHtcbiAgZXhwb3J0czogW0Nka1Njcm9sbGFibGVdLFxuICBpbXBvcnRzOiBbQ2RrU2Nyb2xsYWJsZV0sXG59KVxuZXhwb3J0IGNsYXNzIENka1Njcm9sbGFibGVNb2R1bGUge31cblxuLyoqXG4gKiBAZG9jcy1wcmltYXJ5LWV4cG9ydFxuICovXG5ATmdNb2R1bGUoe1xuICBpbXBvcnRzOiBbXG4gICAgQmlkaU1vZHVsZSxcbiAgICBDZGtTY3JvbGxhYmxlTW9kdWxlLFxuICAgIENka1ZpcnR1YWxTY3JvbGxWaWV3cG9ydCxcbiAgICBDZGtGaXhlZFNpemVWaXJ0dWFsU2Nyb2xsLFxuICAgIENka1ZpcnR1YWxGb3JPZixcbiAgICBDZGtWaXJ0dWFsU2Nyb2xsYWJsZVdpbmRvdyxcbiAgICBDZGtWaXJ0dWFsU2Nyb2xsYWJsZUVsZW1lbnQsXG4gIF0sXG4gIGV4cG9ydHM6IFtcbiAgICBCaWRpTW9kdWxlLFxuICAgIENka1Njcm9sbGFibGVNb2R1bGUsXG4gICAgQ2RrRml4ZWRTaXplVmlydHVhbFNjcm9sbCxcbiAgICBDZGtWaXJ0dWFsRm9yT2YsXG4gICAgQ2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0LFxuICAgIENka1ZpcnR1YWxTY3JvbGxhYmxlV2luZG93LFxuICAgIENka1ZpcnR1YWxTY3JvbGxhYmxlRWxlbWVudCxcbiAgXSxcbn0pXG5leHBvcnQgY2xhc3MgU2Nyb2xsaW5nTW9kdWxlIHt9XG4iXX0=