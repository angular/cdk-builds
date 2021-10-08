/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BidiModule } from '@angular/cdk/bidi';
import { PortalModule } from '@angular/cdk/portal';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { NgModule } from '@angular/core';
import { Overlay } from './overlay';
import { CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER, CdkConnectedOverlay, CdkOverlayOrigin, } from './overlay-directives';
import * as i0 from "@angular/core";
export class OverlayModule {
}
OverlayModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: OverlayModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
OverlayModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: OverlayModule, declarations: [CdkConnectedOverlay, CdkOverlayOrigin], imports: [BidiModule, PortalModule, ScrollingModule], exports: [CdkConnectedOverlay, CdkOverlayOrigin, ScrollingModule] });
OverlayModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: OverlayModule, providers: [
        Overlay,
        CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER,
    ], imports: [[BidiModule, PortalModule, ScrollingModule], ScrollingModule] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: OverlayModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [BidiModule, PortalModule, ScrollingModule],
                    exports: [CdkConnectedOverlay, CdkOverlayOrigin, ScrollingModule],
                    declarations: [CdkConnectedOverlay, CdkOverlayOrigin],
                    providers: [
                        Overlay,
                        CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER,
                    ],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvb3ZlcmxheS1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzdDLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDdkQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sRUFDTCw4Q0FBOEMsRUFDOUMsbUJBQW1CLEVBQ25CLGdCQUFnQixHQUNqQixNQUFNLHNCQUFzQixDQUFDOztBQVk5QixNQUFNLE9BQU8sYUFBYTs7a0hBQWIsYUFBYTttSEFBYixhQUFhLGlCQU5ULG1CQUFtQixFQUFFLGdCQUFnQixhQUYxQyxVQUFVLEVBQUUsWUFBWSxFQUFFLGVBQWUsYUFDekMsbUJBQW1CLEVBQUUsZ0JBQWdCLEVBQUUsZUFBZTttSEFPckQsYUFBYSxhQUxiO1FBQ1QsT0FBTztRQUNQLDhDQUE4QztLQUMvQyxZQU5RLENBQUMsVUFBVSxFQUFFLFlBQVksRUFBRSxlQUFlLENBQUMsRUFDSCxlQUFlO21HQU9yRCxhQUFhO2tCQVR6QixRQUFRO21CQUFDO29CQUNSLE9BQU8sRUFBRSxDQUFDLFVBQVUsRUFBRSxZQUFZLEVBQUUsZUFBZSxDQUFDO29CQUNwRCxPQUFPLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxnQkFBZ0IsRUFBRSxlQUFlLENBQUM7b0JBQ2pFLFlBQVksRUFBRSxDQUFDLG1CQUFtQixFQUFFLGdCQUFnQixDQUFDO29CQUNyRCxTQUFTLEVBQUU7d0JBQ1QsT0FBTzt3QkFDUCw4Q0FBOEM7cUJBQy9DO2lCQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QmlkaU1vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtQb3J0YWxNb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wb3J0YWwnO1xuaW1wb3J0IHtTY3JvbGxpbmdNb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2Nkay9zY3JvbGxpbmcnO1xuaW1wb3J0IHtOZ01vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge092ZXJsYXl9IGZyb20gJy4vb3ZlcmxheSc7XG5pbXBvcnQge1xuICBDREtfQ09OTkVDVEVEX09WRVJMQVlfU0NST0xMX1NUUkFURUdZX1BST1ZJREVSLFxuICBDZGtDb25uZWN0ZWRPdmVybGF5LFxuICBDZGtPdmVybGF5T3JpZ2luLFxufSBmcm9tICcuL292ZXJsYXktZGlyZWN0aXZlcyc7XG5cblxuQE5nTW9kdWxlKHtcbiAgaW1wb3J0czogW0JpZGlNb2R1bGUsIFBvcnRhbE1vZHVsZSwgU2Nyb2xsaW5nTW9kdWxlXSxcbiAgZXhwb3J0czogW0Nka0Nvbm5lY3RlZE92ZXJsYXksIENka092ZXJsYXlPcmlnaW4sIFNjcm9sbGluZ01vZHVsZV0sXG4gIGRlY2xhcmF0aW9uczogW0Nka0Nvbm5lY3RlZE92ZXJsYXksIENka092ZXJsYXlPcmlnaW5dLFxuICBwcm92aWRlcnM6IFtcbiAgICBPdmVybGF5LFxuICAgIENES19DT05ORUNURURfT1ZFUkxBWV9TQ1JPTExfU1RSQVRFR1lfUFJPVklERVIsXG4gIF0sXG59KVxuZXhwb3J0IGNsYXNzIE92ZXJsYXlNb2R1bGUge31cbiJdfQ==