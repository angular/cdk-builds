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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0-rc.2", ngImport: i0, type: CdkScrollableModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule }); }
    static { this.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "16.0.0-rc.2", ngImport: i0, type: CdkScrollableModule, imports: [CdkScrollable], exports: [CdkScrollable] }); }
    static { this.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "16.0.0-rc.2", ngImport: i0, type: CdkScrollableModule }); }
}
export { CdkScrollableModule };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0-rc.2", ngImport: i0, type: CdkScrollableModule, decorators: [{
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0-rc.2", ngImport: i0, type: ScrollingModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule }); }
    static { this.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "16.0.0-rc.2", ngImport: i0, type: ScrollingModule, imports: [BidiModule, CdkScrollableModule, CdkVirtualScrollViewport,
            CdkFixedSizeVirtualScroll,
            CdkVirtualForOf,
            CdkVirtualScrollableWindow,
            CdkVirtualScrollableElement], exports: [BidiModule, CdkScrollableModule, CdkFixedSizeVirtualScroll,
            CdkVirtualForOf,
            CdkVirtualScrollViewport,
            CdkVirtualScrollableWindow,
            CdkVirtualScrollableElement] }); }
    static { this.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "16.0.0-rc.2", ngImport: i0, type: ScrollingModule, imports: [BidiModule,
            CdkScrollableModule, BidiModule, CdkScrollableModule] }); }
}
export { ScrollingModule };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0-rc.2", ngImport: i0, type: ScrollingModule, decorators: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsaW5nLW1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2Nyb2xsaW5nL3Njcm9sbGluZy1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzdDLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDdkMsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDdEUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUMzQyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDakQsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDbkUsT0FBTyxFQUFDLDJCQUEyQixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDekUsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7O0FBRXZFLE1BSWEsbUJBQW1CO21IQUFuQixtQkFBbUI7b0hBQW5CLG1CQUFtQixZQUZwQixhQUFhLGFBRGIsYUFBYTtvSEFHWixtQkFBbUI7O1NBQW5CLG1CQUFtQjtnR0FBbkIsbUJBQW1CO2tCQUovQixRQUFRO21CQUFDO29CQUNSLE9BQU8sRUFBRSxDQUFDLGFBQWEsQ0FBQztvQkFDeEIsT0FBTyxFQUFFLENBQUMsYUFBYSxDQUFDO2lCQUN6Qjs7QUFHRDs7R0FFRztBQUNILE1Bb0JhLGVBQWU7bUhBQWYsZUFBZTtvSEFBZixlQUFlLFlBbEJ4QixVQUFVLEVBUEQsbUJBQW1CLEVBUzVCLHdCQUF3QjtZQUN4Qix5QkFBeUI7WUFDekIsZUFBZTtZQUNmLDBCQUEwQjtZQUMxQiwyQkFBMkIsYUFHM0IsVUFBVSxFQWhCRCxtQkFBbUIsRUFrQjVCLHlCQUF5QjtZQUN6QixlQUFlO1lBQ2Ysd0JBQXdCO1lBQ3hCLDBCQUEwQjtZQUMxQiwyQkFBMkI7b0hBR2xCLGVBQWUsWUFsQnhCLFVBQVU7WUFDVixtQkFBbUIsRUFRbkIsVUFBVSxFQWhCRCxtQkFBbUI7O1NBeUJuQixlQUFlO2dHQUFmLGVBQWU7a0JBcEIzQixRQUFRO21CQUFDO29CQUNSLE9BQU8sRUFBRTt3QkFDUCxVQUFVO3dCQUNWLG1CQUFtQjt3QkFDbkIsd0JBQXdCO3dCQUN4Qix5QkFBeUI7d0JBQ3pCLGVBQWU7d0JBQ2YsMEJBQTBCO3dCQUMxQiwyQkFBMkI7cUJBQzVCO29CQUNELE9BQU8sRUFBRTt3QkFDUCxVQUFVO3dCQUNWLG1CQUFtQjt3QkFDbkIseUJBQXlCO3dCQUN6QixlQUFlO3dCQUNmLHdCQUF3Qjt3QkFDeEIsMEJBQTBCO3dCQUMxQiwyQkFBMkI7cUJBQzVCO2lCQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QmlkaU1vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtOZ01vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0Nka0ZpeGVkU2l6ZVZpcnR1YWxTY3JvbGx9IGZyb20gJy4vZml4ZWQtc2l6ZS12aXJ0dWFsLXNjcm9sbCc7XG5pbXBvcnQge0Nka1Njcm9sbGFibGV9IGZyb20gJy4vc2Nyb2xsYWJsZSc7XG5pbXBvcnQge0Nka1ZpcnR1YWxGb3JPZn0gZnJvbSAnLi92aXJ0dWFsLWZvci1vZic7XG5pbXBvcnQge0Nka1ZpcnR1YWxTY3JvbGxWaWV3cG9ydH0gZnJvbSAnLi92aXJ0dWFsLXNjcm9sbC12aWV3cG9ydCc7XG5pbXBvcnQge0Nka1ZpcnR1YWxTY3JvbGxhYmxlRWxlbWVudH0gZnJvbSAnLi92aXJ0dWFsLXNjcm9sbGFibGUtZWxlbWVudCc7XG5pbXBvcnQge0Nka1ZpcnR1YWxTY3JvbGxhYmxlV2luZG93fSBmcm9tICcuL3ZpcnR1YWwtc2Nyb2xsYWJsZS13aW5kb3cnO1xuXG5ATmdNb2R1bGUoe1xuICBleHBvcnRzOiBbQ2RrU2Nyb2xsYWJsZV0sXG4gIGltcG9ydHM6IFtDZGtTY3JvbGxhYmxlXSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrU2Nyb2xsYWJsZU1vZHVsZSB7fVxuXG4vKipcbiAqIEBkb2NzLXByaW1hcnktZXhwb3J0XG4gKi9cbkBOZ01vZHVsZSh7XG4gIGltcG9ydHM6IFtcbiAgICBCaWRpTW9kdWxlLFxuICAgIENka1Njcm9sbGFibGVNb2R1bGUsXG4gICAgQ2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0LFxuICAgIENka0ZpeGVkU2l6ZVZpcnR1YWxTY3JvbGwsXG4gICAgQ2RrVmlydHVhbEZvck9mLFxuICAgIENka1ZpcnR1YWxTY3JvbGxhYmxlV2luZG93LFxuICAgIENka1ZpcnR1YWxTY3JvbGxhYmxlRWxlbWVudCxcbiAgXSxcbiAgZXhwb3J0czogW1xuICAgIEJpZGlNb2R1bGUsXG4gICAgQ2RrU2Nyb2xsYWJsZU1vZHVsZSxcbiAgICBDZGtGaXhlZFNpemVWaXJ0dWFsU2Nyb2xsLFxuICAgIENka1ZpcnR1YWxGb3JPZixcbiAgICBDZGtWaXJ0dWFsU2Nyb2xsVmlld3BvcnQsXG4gICAgQ2RrVmlydHVhbFNjcm9sbGFibGVXaW5kb3csXG4gICAgQ2RrVmlydHVhbFNjcm9sbGFibGVFbGVtZW50LFxuICBdLFxufSlcbmV4cG9ydCBjbGFzcyBTY3JvbGxpbmdNb2R1bGUge31cbiJdfQ==