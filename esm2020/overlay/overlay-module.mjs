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
OverlayModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.0.1", ngImport: i0, type: OverlayModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
OverlayModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "14.0.1", ngImport: i0, type: OverlayModule, declarations: [CdkConnectedOverlay, CdkOverlayOrigin], imports: [BidiModule, PortalModule, ScrollingModule], exports: [CdkConnectedOverlay, CdkOverlayOrigin, ScrollingModule] });
OverlayModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "14.0.1", ngImport: i0, type: OverlayModule, providers: [Overlay, CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER], imports: [BidiModule, PortalModule, ScrollingModule, ScrollingModule] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.0.1", ngImport: i0, type: OverlayModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [BidiModule, PortalModule, ScrollingModule],
                    exports: [CdkConnectedOverlay, CdkOverlayOrigin, ScrollingModule],
                    declarations: [CdkConnectedOverlay, CdkOverlayOrigin],
                    providers: [Overlay, CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvb3ZlcmxheS1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzdDLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDdkQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sRUFDTCw4Q0FBOEMsRUFDOUMsbUJBQW1CLEVBQ25CLGdCQUFnQixHQUNqQixNQUFNLHNCQUFzQixDQUFDOztBQVE5QixNQUFNLE9BQU8sYUFBYTs7MEdBQWIsYUFBYTsyR0FBYixhQUFhLGlCQUhULG1CQUFtQixFQUFFLGdCQUFnQixhQUYxQyxVQUFVLEVBQUUsWUFBWSxFQUFFLGVBQWUsYUFDekMsbUJBQW1CLEVBQUUsZ0JBQWdCLEVBQUUsZUFBZTsyR0FJckQsYUFBYSxhQUZiLENBQUMsT0FBTyxFQUFFLDhDQUE4QyxDQUFDLFlBSDFELFVBQVUsRUFBRSxZQUFZLEVBQUUsZUFBZSxFQUNGLGVBQWU7MkZBSXJELGFBQWE7a0JBTnpCLFFBQVE7bUJBQUM7b0JBQ1IsT0FBTyxFQUFFLENBQUMsVUFBVSxFQUFFLFlBQVksRUFBRSxlQUFlLENBQUM7b0JBQ3BELE9BQU8sRUFBRSxDQUFDLG1CQUFtQixFQUFFLGdCQUFnQixFQUFFLGVBQWUsQ0FBQztvQkFDakUsWUFBWSxFQUFFLENBQUMsbUJBQW1CLEVBQUUsZ0JBQWdCLENBQUM7b0JBQ3JELFNBQVMsRUFBRSxDQUFDLE9BQU8sRUFBRSw4Q0FBOEMsQ0FBQztpQkFDckUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtCaWRpTW9kdWxlfSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge1BvcnRhbE1vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BvcnRhbCc7XG5pbXBvcnQge1Njcm9sbGluZ01vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvY2RrL3Njcm9sbGluZyc7XG5pbXBvcnQge05nTW9kdWxlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T3ZlcmxheX0gZnJvbSAnLi9vdmVybGF5JztcbmltcG9ydCB7XG4gIENES19DT05ORUNURURfT1ZFUkxBWV9TQ1JPTExfU1RSQVRFR1lfUFJPVklERVIsXG4gIENka0Nvbm5lY3RlZE92ZXJsYXksXG4gIENka092ZXJsYXlPcmlnaW4sXG59IGZyb20gJy4vb3ZlcmxheS1kaXJlY3RpdmVzJztcblxuQE5nTW9kdWxlKHtcbiAgaW1wb3J0czogW0JpZGlNb2R1bGUsIFBvcnRhbE1vZHVsZSwgU2Nyb2xsaW5nTW9kdWxlXSxcbiAgZXhwb3J0czogW0Nka0Nvbm5lY3RlZE92ZXJsYXksIENka092ZXJsYXlPcmlnaW4sIFNjcm9sbGluZ01vZHVsZV0sXG4gIGRlY2xhcmF0aW9uczogW0Nka0Nvbm5lY3RlZE92ZXJsYXksIENka092ZXJsYXlPcmlnaW5dLFxuICBwcm92aWRlcnM6IFtPdmVybGF5LCBDREtfQ09OTkVDVEVEX09WRVJMQVlfU0NST0xMX1NUUkFURUdZX1BST1ZJREVSXSxcbn0pXG5leHBvcnQgY2xhc3MgT3ZlcmxheU1vZHVsZSB7fVxuIl19