/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BidiModule } from '@angular/cdk/bidi';
import { PlatformModule } from '@angular/cdk/platform';
import { NgModule } from '@angular/core';
import { CdkFixedSizeVirtualScroll } from './fixed-size-virtual-scroll';
import { CdkScrollable } from './scrollable';
import { CdkVirtualForOf } from './virtual-for-of';
import { CdkVirtualScrollViewport } from './virtual-scroll-viewport';
import * as i0 from "@angular/core";
export class CdkScrollableModule {
}
CdkScrollableModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: CdkScrollableModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CdkScrollableModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: CdkScrollableModule, declarations: [CdkScrollable], exports: [CdkScrollable] });
CdkScrollableModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: CdkScrollableModule });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: CdkScrollableModule, decorators: [{
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
ScrollingModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: ScrollingModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
ScrollingModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: ScrollingModule, declarations: [CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport], imports: [BidiModule, PlatformModule, CdkScrollableModule], exports: [BidiModule, CdkScrollableModule, CdkFixedSizeVirtualScroll,
        CdkVirtualForOf,
        CdkVirtualScrollViewport] });
ScrollingModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: ScrollingModule, imports: [[BidiModule, PlatformModule, CdkScrollableModule], BidiModule, CdkScrollableModule] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: ScrollingModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [BidiModule, PlatformModule, CdkScrollableModule],
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsaW5nLW1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2Nyb2xsaW5nL3Njcm9sbGluZy1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzdDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3ZDLE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQ3RFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDM0MsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ2pELE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLDJCQUEyQixDQUFDOztBQU1uRSxNQUFNLE9BQU8sbUJBQW1COztnSEFBbkIsbUJBQW1CO2lIQUFuQixtQkFBbUIsaUJBRmYsYUFBYSxhQURsQixhQUFhO2lIQUdaLG1CQUFtQjsyRkFBbkIsbUJBQW1CO2tCQUovQixRQUFRO21CQUFDO29CQUNSLE9BQU8sRUFBRSxDQUFDLGFBQWEsQ0FBQztvQkFDeEIsWUFBWSxFQUFFLENBQUMsYUFBYSxDQUFDO2lCQUM5Qjs7QUFHRDs7R0FFRztBQVlILE1BQU0sT0FBTyxlQUFlOzs0R0FBZixlQUFlOzZHQUFmLGVBQWUsaUJBRlgseUJBQXlCLEVBQUUsZUFBZSxFQUFFLHdCQUF3QixhQVJ6RSxVQUFVLEVBQUUsY0FBYyxFQU56QixtQkFBbUIsYUFRNUIsVUFBVSxFQVJELG1CQUFtQixFQVU1Qix5QkFBeUI7UUFDekIsZUFBZTtRQUNmLHdCQUF3Qjs2R0FJZixlQUFlLFlBVmpCLENBQUMsVUFBVSxFQUFFLGNBQWMsRUFBRSxtQkFBbUIsQ0FBQyxFQUV4RCxVQUFVLEVBUkQsbUJBQW1COzJGQWdCbkIsZUFBZTtrQkFYM0IsUUFBUTttQkFBQztvQkFDUixPQUFPLEVBQUUsQ0FBQyxVQUFVLEVBQUUsY0FBYyxFQUFFLG1CQUFtQixDQUFDO29CQUMxRCxPQUFPLEVBQUU7d0JBQ1AsVUFBVTt3QkFDVixtQkFBbUI7d0JBQ25CLHlCQUF5Qjt3QkFDekIsZUFBZTt3QkFDZix3QkFBd0I7cUJBQ3pCO29CQUNELFlBQVksRUFBRSxDQUFDLHlCQUF5QixFQUFFLGVBQWUsRUFBRSx3QkFBd0IsQ0FBQztpQkFDckYiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtCaWRpTW9kdWxlfSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge1BsYXRmb3JtTW9kdWxlfSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtOZ01vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0Nka0ZpeGVkU2l6ZVZpcnR1YWxTY3JvbGx9IGZyb20gJy4vZml4ZWQtc2l6ZS12aXJ0dWFsLXNjcm9sbCc7XG5pbXBvcnQge0Nka1Njcm9sbGFibGV9IGZyb20gJy4vc2Nyb2xsYWJsZSc7XG5pbXBvcnQge0Nka1ZpcnR1YWxGb3JPZn0gZnJvbSAnLi92aXJ0dWFsLWZvci1vZic7XG5pbXBvcnQge0Nka1ZpcnR1YWxTY3JvbGxWaWV3cG9ydH0gZnJvbSAnLi92aXJ0dWFsLXNjcm9sbC12aWV3cG9ydCc7XG5cbkBOZ01vZHVsZSh7XG4gIGV4cG9ydHM6IFtDZGtTY3JvbGxhYmxlXSxcbiAgZGVjbGFyYXRpb25zOiBbQ2RrU2Nyb2xsYWJsZV0sXG59KVxuZXhwb3J0IGNsYXNzIENka1Njcm9sbGFibGVNb2R1bGUge31cblxuLyoqXG4gKiBAZG9jcy1wcmltYXJ5LWV4cG9ydFxuICovXG5ATmdNb2R1bGUoe1xuICBpbXBvcnRzOiBbQmlkaU1vZHVsZSwgUGxhdGZvcm1Nb2R1bGUsIENka1Njcm9sbGFibGVNb2R1bGVdLFxuICBleHBvcnRzOiBbXG4gICAgQmlkaU1vZHVsZSxcbiAgICBDZGtTY3JvbGxhYmxlTW9kdWxlLFxuICAgIENka0ZpeGVkU2l6ZVZpcnR1YWxTY3JvbGwsXG4gICAgQ2RrVmlydHVhbEZvck9mLFxuICAgIENka1ZpcnR1YWxTY3JvbGxWaWV3cG9ydCxcbiAgXSxcbiAgZGVjbGFyYXRpb25zOiBbQ2RrRml4ZWRTaXplVmlydHVhbFNjcm9sbCwgQ2RrVmlydHVhbEZvck9mLCBDZGtWaXJ0dWFsU2Nyb2xsVmlld3BvcnRdLFxufSlcbmV4cG9ydCBjbGFzcyBTY3JvbGxpbmdNb2R1bGUge31cbiJdfQ==