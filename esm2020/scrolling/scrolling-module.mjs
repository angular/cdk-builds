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
import * as i0 from "@angular/core";
export class CdkScrollableModule {
}
CdkScrollableModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.0.0-rc.1", ngImport: i0, type: CdkScrollableModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CdkScrollableModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "14.0.0-rc.1", ngImport: i0, type: CdkScrollableModule, declarations: [CdkScrollable], exports: [CdkScrollable] });
CdkScrollableModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "14.0.0-rc.1", ngImport: i0, type: CdkScrollableModule });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.0.0-rc.1", ngImport: i0, type: CdkScrollableModule, decorators: [{
            type: NgModule,
            args: [{
                    exports: [CdkScrollable],
                    declarations: [CdkScrollable],
                }]
        }] });
/**
 * @docs-primary-export
 */
export class ScrollingModule {
}
ScrollingModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.0.0-rc.1", ngImport: i0, type: ScrollingModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
ScrollingModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "14.0.0-rc.1", ngImport: i0, type: ScrollingModule, declarations: [CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport], imports: [BidiModule, CdkScrollableModule], exports: [BidiModule, CdkScrollableModule, CdkFixedSizeVirtualScroll,
        CdkVirtualForOf,
        CdkVirtualScrollViewport] });
ScrollingModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "14.0.0-rc.1", ngImport: i0, type: ScrollingModule, imports: [BidiModule, CdkScrollableModule, BidiModule, CdkScrollableModule] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.0.0-rc.1", ngImport: i0, type: ScrollingModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [BidiModule, CdkScrollableModule],
                    exports: [
                        BidiModule,
                        CdkScrollableModule,
                        CdkFixedSizeVirtualScroll,
                        CdkVirtualForOf,
                        CdkVirtualScrollViewport,
                    ],
                    declarations: [CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsaW5nLW1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2Nyb2xsaW5nL3Njcm9sbGluZy1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzdDLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDdkMsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDdEUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUMzQyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDakQsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0sMkJBQTJCLENBQUM7O0FBTW5FLE1BQU0sT0FBTyxtQkFBbUI7O3FIQUFuQixtQkFBbUI7c0hBQW5CLG1CQUFtQixpQkFGZixhQUFhLGFBRGxCLGFBQWE7c0hBR1osbUJBQW1CO2dHQUFuQixtQkFBbUI7a0JBSi9CLFFBQVE7bUJBQUM7b0JBQ1IsT0FBTyxFQUFFLENBQUMsYUFBYSxDQUFDO29CQUN4QixZQUFZLEVBQUUsQ0FBQyxhQUFhLENBQUM7aUJBQzlCOztBQUdEOztHQUVHO0FBWUgsTUFBTSxPQUFPLGVBQWU7O2lIQUFmLGVBQWU7a0hBQWYsZUFBZSxpQkFGWCx5QkFBeUIsRUFBRSxlQUFlLEVBQUUsd0JBQXdCLGFBUnpFLFVBQVUsRUFOVCxtQkFBbUIsYUFRNUIsVUFBVSxFQVJELG1CQUFtQixFQVU1Qix5QkFBeUI7UUFDekIsZUFBZTtRQUNmLHdCQUF3QjtrSEFJZixlQUFlLFlBVmhCLFVBQVUsRUFBRSxtQkFBbUIsRUFFdkMsVUFBVSxFQVJELG1CQUFtQjtnR0FnQm5CLGVBQWU7a0JBWDNCLFFBQVE7bUJBQUM7b0JBQ1IsT0FBTyxFQUFFLENBQUMsVUFBVSxFQUFFLG1CQUFtQixDQUFDO29CQUMxQyxPQUFPLEVBQUU7d0JBQ1AsVUFBVTt3QkFDVixtQkFBbUI7d0JBQ25CLHlCQUF5Qjt3QkFDekIsZUFBZTt3QkFDZix3QkFBd0I7cUJBQ3pCO29CQUNELFlBQVksRUFBRSxDQUFDLHlCQUF5QixFQUFFLGVBQWUsRUFBRSx3QkFBd0IsQ0FBQztpQkFDckYiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtCaWRpTW9kdWxlfSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge05nTW9kdWxlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Q2RrRml4ZWRTaXplVmlydHVhbFNjcm9sbH0gZnJvbSAnLi9maXhlZC1zaXplLXZpcnR1YWwtc2Nyb2xsJztcbmltcG9ydCB7Q2RrU2Nyb2xsYWJsZX0gZnJvbSAnLi9zY3JvbGxhYmxlJztcbmltcG9ydCB7Q2RrVmlydHVhbEZvck9mfSBmcm9tICcuL3ZpcnR1YWwtZm9yLW9mJztcbmltcG9ydCB7Q2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0fSBmcm9tICcuL3ZpcnR1YWwtc2Nyb2xsLXZpZXdwb3J0JztcblxuQE5nTW9kdWxlKHtcbiAgZXhwb3J0czogW0Nka1Njcm9sbGFibGVdLFxuICBkZWNsYXJhdGlvbnM6IFtDZGtTY3JvbGxhYmxlXSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrU2Nyb2xsYWJsZU1vZHVsZSB7fVxuXG4vKipcbiAqIEBkb2NzLXByaW1hcnktZXhwb3J0XG4gKi9cbkBOZ01vZHVsZSh7XG4gIGltcG9ydHM6IFtCaWRpTW9kdWxlLCBDZGtTY3JvbGxhYmxlTW9kdWxlXSxcbiAgZXhwb3J0czogW1xuICAgIEJpZGlNb2R1bGUsXG4gICAgQ2RrU2Nyb2xsYWJsZU1vZHVsZSxcbiAgICBDZGtGaXhlZFNpemVWaXJ0dWFsU2Nyb2xsLFxuICAgIENka1ZpcnR1YWxGb3JPZixcbiAgICBDZGtWaXJ0dWFsU2Nyb2xsVmlld3BvcnQsXG4gIF0sXG4gIGRlY2xhcmF0aW9uczogW0Nka0ZpeGVkU2l6ZVZpcnR1YWxTY3JvbGwsIENka1ZpcnR1YWxGb3JPZiwgQ2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0XSxcbn0pXG5leHBvcnQgY2xhc3MgU2Nyb2xsaW5nTW9kdWxlIHt9XG4iXX0=