/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NgModule } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { A11yModule } from '@angular/cdk/a11y';
import { Dialog } from './dialog';
import { CdkDialogContainer } from './dialog-container';
import { DIALOG_SCROLL_STRATEGY_PROVIDER } from './dialog-injectors';
import * as i0 from "@angular/core";
export class DialogModule {
}
DialogModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.0.0-next.13", ngImport: i0, type: DialogModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
DialogModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "14.0.0-next.13", ngImport: i0, type: DialogModule, declarations: [CdkDialogContainer], imports: [OverlayModule, PortalModule, A11yModule], exports: [
        // Re-export the PortalModule so that people extending the `CdkDialogContainer`
        // don't have to remember to import it or be faced with an unhelpful error.
        PortalModule,
        CdkDialogContainer] });
DialogModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "14.0.0-next.13", ngImport: i0, type: DialogModule, providers: [Dialog, DIALOG_SCROLL_STRATEGY_PROVIDER], imports: [[OverlayModule, PortalModule, A11yModule], 
        // Re-export the PortalModule so that people extending the `CdkDialogContainer`
        // don't have to remember to import it or be faced with an unhelpful error.
        PortalModule] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.0.0-next.13", ngImport: i0, type: DialogModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [OverlayModule, PortalModule, A11yModule],
                    exports: [
                        // Re-export the PortalModule so that people extending the `CdkDialogContainer`
                        // don't have to remember to import it or be faced with an unhelpful error.
                        PortalModule,
                        CdkDialogContainer,
                    ],
                    declarations: [CdkDialogContainer],
                    providers: [Dialog, DIALOG_SCROLL_STRATEGY_PROVIDER],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhbG9nLW1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZGlhbG9nL2RpYWxvZy1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDbkQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM3QyxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ2hDLE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3RELE9BQU8sRUFBQywrQkFBK0IsRUFBQyxNQUFNLG9CQUFvQixDQUFDOztBQWFuRSxNQUFNLE9BQU8sWUFBWTs7aUhBQVosWUFBWTtrSEFBWixZQUFZLGlCQUhSLGtCQUFrQixhQVB2QixhQUFhLEVBQUUsWUFBWSxFQUFFLFVBQVU7UUFFL0MsK0VBQStFO1FBQy9FLDJFQUEyRTtRQUMzRSxZQUFZO1FBQ1osa0JBQWtCO2tIQUtULFlBQVksYUFGWixDQUFDLE1BQU0sRUFBRSwrQkFBK0IsQ0FBQyxZQVIzQyxDQUFDLGFBQWEsRUFBRSxZQUFZLEVBQUUsVUFBVSxDQUFDO1FBRWhELCtFQUErRTtRQUMvRSwyRUFBMkU7UUFDM0UsWUFBWTttR0FNSCxZQUFZO2tCQVh4QixRQUFRO21CQUFDO29CQUNSLE9BQU8sRUFBRSxDQUFDLGFBQWEsRUFBRSxZQUFZLEVBQUUsVUFBVSxDQUFDO29CQUNsRCxPQUFPLEVBQUU7d0JBQ1AsK0VBQStFO3dCQUMvRSwyRUFBMkU7d0JBQzNFLFlBQVk7d0JBQ1osa0JBQWtCO3FCQUNuQjtvQkFDRCxZQUFZLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQztvQkFDbEMsU0FBUyxFQUFFLENBQUMsTUFBTSxFQUFFLCtCQUErQixDQUFDO2lCQUNyRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge05nTW9kdWxlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T3ZlcmxheU1vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvY2RrL292ZXJsYXknO1xuaW1wb3J0IHtQb3J0YWxNb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wb3J0YWwnO1xuaW1wb3J0IHtBMTF5TW9kdWxlfSBmcm9tICdAYW5ndWxhci9jZGsvYTExeSc7XG5pbXBvcnQge0RpYWxvZ30gZnJvbSAnLi9kaWFsb2cnO1xuaW1wb3J0IHtDZGtEaWFsb2dDb250YWluZXJ9IGZyb20gJy4vZGlhbG9nLWNvbnRhaW5lcic7XG5pbXBvcnQge0RJQUxPR19TQ1JPTExfU1RSQVRFR1lfUFJPVklERVJ9IGZyb20gJy4vZGlhbG9nLWluamVjdG9ycyc7XG5cbkBOZ01vZHVsZSh7XG4gIGltcG9ydHM6IFtPdmVybGF5TW9kdWxlLCBQb3J0YWxNb2R1bGUsIEExMXlNb2R1bGVdLFxuICBleHBvcnRzOiBbXG4gICAgLy8gUmUtZXhwb3J0IHRoZSBQb3J0YWxNb2R1bGUgc28gdGhhdCBwZW9wbGUgZXh0ZW5kaW5nIHRoZSBgQ2RrRGlhbG9nQ29udGFpbmVyYFxuICAgIC8vIGRvbid0IGhhdmUgdG8gcmVtZW1iZXIgdG8gaW1wb3J0IGl0IG9yIGJlIGZhY2VkIHdpdGggYW4gdW5oZWxwZnVsIGVycm9yLlxuICAgIFBvcnRhbE1vZHVsZSxcbiAgICBDZGtEaWFsb2dDb250YWluZXIsXG4gIF0sXG4gIGRlY2xhcmF0aW9uczogW0Nka0RpYWxvZ0NvbnRhaW5lcl0sXG4gIHByb3ZpZGVyczogW0RpYWxvZywgRElBTE9HX1NDUk9MTF9TVFJBVEVHWV9QUk9WSURFUl0sXG59KVxuZXhwb3J0IGNsYXNzIERpYWxvZ01vZHVsZSB7fVxuIl19