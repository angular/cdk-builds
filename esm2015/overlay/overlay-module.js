/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/overlay/overlay-module.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
import { OVERLAY_KEYBOARD_DISPATCHER_PROVIDER } from './keyboard/overlay-keyboard-dispatcher';
import { Overlay } from './overlay';
import { OVERLAY_CONTAINER_PROVIDER } from './overlay-container';
import { CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER, CdkConnectedOverlay, CdkOverlayOrigin, } from './overlay-directives';
import { OverlayPositionBuilder } from './position/overlay-position-builder';
let OverlayModule = /** @class */ (() => {
    class OverlayModule {
    }
    OverlayModule.decorators = [
        { type: NgModule, args: [{
                    imports: [BidiModule, PortalModule, ScrollingModule],
                    exports: [CdkConnectedOverlay, CdkOverlayOrigin, ScrollingModule],
                    declarations: [CdkConnectedOverlay, CdkOverlayOrigin],
                    providers: [
                        Overlay,
                        CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER,
                    ],
                },] }
    ];
    return OverlayModule;
})();
export { OverlayModule };
/**
 * @deprecated Use `OverlayModule` instead.
 * \@breaking-change 8.0.0
 * \@docs-private
 * @type {?}
 */
export const OVERLAY_PROVIDERS = [
    Overlay,
    OverlayPositionBuilder,
    OVERLAY_KEYBOARD_DISPATCHER_PROVIDER,
    OVERLAY_CONTAINER_PROVIDER,
    CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER,
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvb3ZlcmxheS1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzdDLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDdkQsT0FBTyxFQUFDLFFBQVEsRUFBVyxNQUFNLGVBQWUsQ0FBQztBQUNqRCxPQUFPLEVBQUMsb0NBQW9DLEVBQUMsTUFBTSx3Q0FBd0MsQ0FBQztBQUM1RixPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sRUFBQywwQkFBMEIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQy9ELE9BQU8sRUFDTCw4Q0FBOEMsRUFDOUMsbUJBQW1CLEVBQ25CLGdCQUFnQixHQUNqQixNQUFNLHNCQUFzQixDQUFDO0FBQzlCLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLHFDQUFxQyxDQUFDO0FBRzNFO0lBQUEsTUFTYSxhQUFhOzs7Z0JBVHpCLFFBQVEsU0FBQztvQkFDUixPQUFPLEVBQUUsQ0FBQyxVQUFVLEVBQUUsWUFBWSxFQUFFLGVBQWUsQ0FBQztvQkFDcEQsT0FBTyxFQUFFLENBQUMsbUJBQW1CLEVBQUUsZ0JBQWdCLEVBQUUsZUFBZSxDQUFDO29CQUNqRSxZQUFZLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxnQkFBZ0IsQ0FBQztvQkFDckQsU0FBUyxFQUFFO3dCQUNULE9BQU87d0JBQ1AsOENBQThDO3FCQUMvQztpQkFDRjs7SUFDMkIsb0JBQUM7S0FBQTtTQUFoQixhQUFhOzs7Ozs7O0FBUTFCLE1BQU0sT0FBTyxpQkFBaUIsR0FBZTtJQUMzQyxPQUFPO0lBQ1Asc0JBQXNCO0lBQ3RCLG9DQUFvQztJQUNwQywwQkFBMEI7SUFDMUIsOENBQThDO0NBQy9DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QmlkaU1vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtQb3J0YWxNb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wb3J0YWwnO1xuaW1wb3J0IHtTY3JvbGxpbmdNb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2Nkay9zY3JvbGxpbmcnO1xuaW1wb3J0IHtOZ01vZHVsZSwgUHJvdmlkZXJ9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtPVkVSTEFZX0tFWUJPQVJEX0RJU1BBVENIRVJfUFJPVklERVJ9IGZyb20gJy4va2V5Ym9hcmQvb3ZlcmxheS1rZXlib2FyZC1kaXNwYXRjaGVyJztcbmltcG9ydCB7T3ZlcmxheX0gZnJvbSAnLi9vdmVybGF5JztcbmltcG9ydCB7T1ZFUkxBWV9DT05UQUlORVJfUFJPVklERVJ9IGZyb20gJy4vb3ZlcmxheS1jb250YWluZXInO1xuaW1wb3J0IHtcbiAgQ0RLX0NPTk5FQ1RFRF9PVkVSTEFZX1NDUk9MTF9TVFJBVEVHWV9QUk9WSURFUixcbiAgQ2RrQ29ubmVjdGVkT3ZlcmxheSxcbiAgQ2RrT3ZlcmxheU9yaWdpbixcbn0gZnJvbSAnLi9vdmVybGF5LWRpcmVjdGl2ZXMnO1xuaW1wb3J0IHtPdmVybGF5UG9zaXRpb25CdWlsZGVyfSBmcm9tICcuL3Bvc2l0aW9uL292ZXJsYXktcG9zaXRpb24tYnVpbGRlcic7XG5cblxuQE5nTW9kdWxlKHtcbiAgaW1wb3J0czogW0JpZGlNb2R1bGUsIFBvcnRhbE1vZHVsZSwgU2Nyb2xsaW5nTW9kdWxlXSxcbiAgZXhwb3J0czogW0Nka0Nvbm5lY3RlZE92ZXJsYXksIENka092ZXJsYXlPcmlnaW4sIFNjcm9sbGluZ01vZHVsZV0sXG4gIGRlY2xhcmF0aW9uczogW0Nka0Nvbm5lY3RlZE92ZXJsYXksIENka092ZXJsYXlPcmlnaW5dLFxuICBwcm92aWRlcnM6IFtcbiAgICBPdmVybGF5LFxuICAgIENES19DT05ORUNURURfT1ZFUkxBWV9TQ1JPTExfU1RSQVRFR1lfUFJPVklERVIsXG4gIF0sXG59KVxuZXhwb3J0IGNsYXNzIE92ZXJsYXlNb2R1bGUge31cblxuXG4vKipcbiAqIEBkZXByZWNhdGVkIFVzZSBgT3ZlcmxheU1vZHVsZWAgaW5zdGVhZC5cbiAqIEBicmVha2luZy1jaGFuZ2UgOC4wLjBcbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGNvbnN0IE9WRVJMQVlfUFJPVklERVJTOiBQcm92aWRlcltdID0gW1xuICBPdmVybGF5LFxuICBPdmVybGF5UG9zaXRpb25CdWlsZGVyLFxuICBPVkVSTEFZX0tFWUJPQVJEX0RJU1BBVENIRVJfUFJPVklERVIsXG4gIE9WRVJMQVlfQ09OVEFJTkVSX1BST1ZJREVSLFxuICBDREtfQ09OTkVDVEVEX09WRVJMQVlfU0NST0xMX1NUUkFURUdZX1BST1ZJREVSLFxuXTtcbiJdfQ==