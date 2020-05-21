/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __decorate } from "tslib";
import { BidiModule } from '@angular/cdk/bidi';
import { PlatformModule } from '@angular/cdk/platform';
import { NgModule } from '@angular/core';
import { CdkFixedSizeVirtualScroll } from './fixed-size-virtual-scroll';
import { CdkScrollable } from './scrollable';
import { CdkVirtualForOf } from './virtual-for-of';
import { CdkVirtualScrollViewport } from './virtual-scroll-viewport';
let CdkScrollableModule = /** @class */ (() => {
    let CdkScrollableModule = class CdkScrollableModule {
    };
    CdkScrollableModule = __decorate([
        NgModule({
            exports: [CdkScrollable],
            declarations: [CdkScrollable]
        })
    ], CdkScrollableModule);
    return CdkScrollableModule;
})();
export { CdkScrollableModule };
let ScrollingModule = /** @class */ (() => {
    let ScrollingModule = class ScrollingModule {
    };
    ScrollingModule = __decorate([
        NgModule({
            imports: [
                BidiModule,
                PlatformModule,
                CdkScrollableModule
            ],
            exports: [
                BidiModule,
                CdkScrollableModule,
                CdkFixedSizeVirtualScroll,
                CdkVirtualForOf,
                CdkVirtualScrollViewport,
            ],
            declarations: [
                CdkFixedSizeVirtualScroll,
                CdkVirtualForOf,
                CdkVirtualScrollViewport,
            ],
        })
    ], ScrollingModule);
    return ScrollingModule;
})();
export { ScrollingModule };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsaW5nLW1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2Nyb2xsaW5nL3Njcm9sbGluZy1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM3QyxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDckQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN2QyxPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUN0RSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQzNDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNqRCxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQU1uRTtJQUFBLElBQWEsbUJBQW1CLEdBQWhDLE1BQWEsbUJBQW1CO0tBQUcsQ0FBQTtJQUF0QixtQkFBbUI7UUFKL0IsUUFBUSxDQUFDO1lBQ1IsT0FBTyxFQUFFLENBQUMsYUFBYSxDQUFDO1lBQ3hCLFlBQVksRUFBRSxDQUFDLGFBQWEsQ0FBQztTQUM5QixDQUFDO09BQ1csbUJBQW1CLENBQUc7SUFBRCwwQkFBQztLQUFBO1NBQXRCLG1CQUFtQjtBQXFCaEM7SUFBQSxJQUFhLGVBQWUsR0FBNUIsTUFBYSxlQUFlO0tBQUcsQ0FBQTtJQUFsQixlQUFlO1FBbkIzQixRQUFRLENBQUM7WUFDUixPQUFPLEVBQUU7Z0JBQ1AsVUFBVTtnQkFDVixjQUFjO2dCQUNkLG1CQUFtQjthQUNwQjtZQUNELE9BQU8sRUFBRTtnQkFDUCxVQUFVO2dCQUNWLG1CQUFtQjtnQkFDbkIseUJBQXlCO2dCQUN6QixlQUFlO2dCQUNmLHdCQUF3QjthQUN6QjtZQUNELFlBQVksRUFBRTtnQkFDWix5QkFBeUI7Z0JBQ3pCLGVBQWU7Z0JBQ2Ysd0JBQXdCO2FBQ3pCO1NBQ0YsQ0FBQztPQUNXLGVBQWUsQ0FBRztJQUFELHNCQUFDO0tBQUE7U0FBbEIsZUFBZSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0JpZGlNb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7UGxhdGZvcm1Nb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge05nTW9kdWxlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Q2RrRml4ZWRTaXplVmlydHVhbFNjcm9sbH0gZnJvbSAnLi9maXhlZC1zaXplLXZpcnR1YWwtc2Nyb2xsJztcbmltcG9ydCB7Q2RrU2Nyb2xsYWJsZX0gZnJvbSAnLi9zY3JvbGxhYmxlJztcbmltcG9ydCB7Q2RrVmlydHVhbEZvck9mfSBmcm9tICcuL3ZpcnR1YWwtZm9yLW9mJztcbmltcG9ydCB7Q2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0fSBmcm9tICcuL3ZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0JztcblxuQE5nTW9kdWxlKHtcbiAgZXhwb3J0czogW0Nka1Njcm9sbGFibGVdLFxuICBkZWNsYXJhdGlvbnM6IFtDZGtTY3JvbGxhYmxlXVxufSlcbmV4cG9ydCBjbGFzcyBDZGtTY3JvbGxhYmxlTW9kdWxlIHt9XG5cbkBOZ01vZHVsZSh7XG4gIGltcG9ydHM6IFtcbiAgICBCaWRpTW9kdWxlLFxuICAgIFBsYXRmb3JtTW9kdWxlLFxuICAgIENka1Njcm9sbGFibGVNb2R1bGVcbiAgXSxcbiAgZXhwb3J0czogW1xuICAgIEJpZGlNb2R1bGUsXG4gICAgQ2RrU2Nyb2xsYWJsZU1vZHVsZSxcbiAgICBDZGtGaXhlZFNpemVWaXJ0dWFsU2Nyb2xsLFxuICAgIENka1ZpcnR1YWxGb3JPZixcbiAgICBDZGtWaXJ0dWFsU2Nyb2xsVmlld3BvcnQsXG4gIF0sXG4gIGRlY2xhcmF0aW9uczogW1xuICAgIENka0ZpeGVkU2l6ZVZpcnR1YWxTY3JvbGwsXG4gICAgQ2RrVmlydHVhbEZvck9mLFxuICAgIENka1ZpcnR1YWxTY3JvbGxWaWV3cG9ydCxcbiAgXSxcbn0pXG5leHBvcnQgY2xhc3MgU2Nyb2xsaW5nTW9kdWxlIHt9XG4iXX0=