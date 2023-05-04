/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ObserversModule } from '@angular/cdk/observers';
import { NgModule } from '@angular/core';
import { CdkMonitorFocus } from './focus-monitor/focus-monitor';
import { CdkTrapFocus } from './focus-trap/focus-trap';
import { HighContrastModeDetector } from './high-contrast-mode/high-contrast-mode-detector';
import { CdkAriaLive } from './live-announcer/live-announcer';
import * as i0 from "@angular/core";
import * as i1 from "./high-contrast-mode/high-contrast-mode-detector";
class A11yModule {
    constructor(highContrastModeDetector) {
        highContrastModeDetector._applyBodyHighContrastModeCssClasses();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: A11yModule, deps: [{ token: i1.HighContrastModeDetector }], target: i0.ɵɵFactoryTarget.NgModule }); }
    static { this.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "16.0.0", ngImport: i0, type: A11yModule, declarations: [CdkAriaLive, CdkTrapFocus, CdkMonitorFocus], imports: [ObserversModule], exports: [CdkAriaLive, CdkTrapFocus, CdkMonitorFocus] }); }
    static { this.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: A11yModule, imports: [ObserversModule] }); }
}
export { A11yModule };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: A11yModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [ObserversModule],
                    declarations: [CdkAriaLive, CdkTrapFocus, CdkMonitorFocus],
                    exports: [CdkAriaLive, CdkTrapFocus, CdkMonitorFocus],
                }]
        }], ctorParameters: function () { return [{ type: i1.HighContrastModeDetector }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYTExeS1tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2ExMXkvYTExeS1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3ZELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDdkMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLCtCQUErQixDQUFDO0FBQzlELE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSxrREFBa0QsQ0FBQztBQUMxRixPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0saUNBQWlDLENBQUM7OztBQUU1RCxNQUthLFVBQVU7SUFDckIsWUFBWSx3QkFBa0Q7UUFDNUQsd0JBQXdCLENBQUMsb0NBQW9DLEVBQUUsQ0FBQztJQUNsRSxDQUFDOzhHQUhVLFVBQVU7K0dBQVYsVUFBVSxpQkFITixXQUFXLEVBQUUsWUFBWSxFQUFFLGVBQWUsYUFEL0MsZUFBZSxhQUVmLFdBQVcsRUFBRSxZQUFZLEVBQUUsZUFBZTsrR0FFekMsVUFBVSxZQUpYLGVBQWU7O1NBSWQsVUFBVTsyRkFBVixVQUFVO2tCQUx0QixRQUFRO21CQUFDO29CQUNSLE9BQU8sRUFBRSxDQUFDLGVBQWUsQ0FBQztvQkFDMUIsWUFBWSxFQUFFLENBQUMsV0FBVyxFQUFFLFlBQVksRUFBRSxlQUFlLENBQUM7b0JBQzFELE9BQU8sRUFBRSxDQUFDLFdBQVcsRUFBRSxZQUFZLEVBQUUsZUFBZSxDQUFDO2lCQUN0RCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge09ic2VydmVyc01vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvY2RrL29ic2VydmVycyc7XG5pbXBvcnQge05nTW9kdWxlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Q2RrTW9uaXRvckZvY3VzfSBmcm9tICcuL2ZvY3VzLW1vbml0b3IvZm9jdXMtbW9uaXRvcic7XG5pbXBvcnQge0Nka1RyYXBGb2N1c30gZnJvbSAnLi9mb2N1cy10cmFwL2ZvY3VzLXRyYXAnO1xuaW1wb3J0IHtIaWdoQ29udHJhc3RNb2RlRGV0ZWN0b3J9IGZyb20gJy4vaGlnaC1jb250cmFzdC1tb2RlL2hpZ2gtY29udHJhc3QtbW9kZS1kZXRlY3Rvcic7XG5pbXBvcnQge0Nka0FyaWFMaXZlfSBmcm9tICcuL2xpdmUtYW5ub3VuY2VyL2xpdmUtYW5ub3VuY2VyJztcblxuQE5nTW9kdWxlKHtcbiAgaW1wb3J0czogW09ic2VydmVyc01vZHVsZV0sXG4gIGRlY2xhcmF0aW9uczogW0Nka0FyaWFMaXZlLCBDZGtUcmFwRm9jdXMsIENka01vbml0b3JGb2N1c10sXG4gIGV4cG9ydHM6IFtDZGtBcmlhTGl2ZSwgQ2RrVHJhcEZvY3VzLCBDZGtNb25pdG9yRm9jdXNdLFxufSlcbmV4cG9ydCBjbGFzcyBBMTF5TW9kdWxlIHtcbiAgY29uc3RydWN0b3IoaGlnaENvbnRyYXN0TW9kZURldGVjdG9yOiBIaWdoQ29udHJhc3RNb2RlRGV0ZWN0b3IpIHtcbiAgICBoaWdoQ29udHJhc3RNb2RlRGV0ZWN0b3IuX2FwcGx5Qm9keUhpZ2hDb250cmFzdE1vZGVDc3NDbGFzc2VzKCk7XG4gIH1cbn1cbiJdfQ==