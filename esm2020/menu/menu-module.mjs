/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NgModule } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { CdkMenu } from './menu';
import { CdkMenuBar } from './menu-bar';
import { CdkMenuItem } from './menu-item';
import { CdkMenuGroup } from './menu-group';
import { CdkMenuItemRadio } from './menu-item-radio';
import { CdkMenuItemCheckbox } from './menu-item-checkbox';
import { CdkMenuTrigger } from './menu-trigger';
import { CdkContextMenuTrigger } from './context-menu-trigger';
import { CdkTargetMenuAim } from './menu-aim';
import * as i0 from "@angular/core";
/** The list of components and directives that should be declared and exported from this module. */
const EXPORTED_DECLARATIONS = [
    CdkMenuBar,
    CdkMenu,
    CdkMenuItem,
    CdkMenuItemRadio,
    CdkMenuItemCheckbox,
    CdkMenuTrigger,
    CdkMenuGroup,
    CdkContextMenuTrigger,
    CdkTargetMenuAim,
];
/** Module that declares components and directives for the CDK menu. */
export class CdkMenuModule {
}
CdkMenuModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.0.0-rc.1", ngImport: i0, type: CdkMenuModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CdkMenuModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "14.0.0-rc.1", ngImport: i0, type: CdkMenuModule, declarations: [CdkMenuBar,
        CdkMenu,
        CdkMenuItem,
        CdkMenuItemRadio,
        CdkMenuItemCheckbox,
        CdkMenuTrigger,
        CdkMenuGroup,
        CdkContextMenuTrigger,
        CdkTargetMenuAim], imports: [OverlayModule], exports: [CdkMenuBar,
        CdkMenu,
        CdkMenuItem,
        CdkMenuItemRadio,
        CdkMenuItemCheckbox,
        CdkMenuTrigger,
        CdkMenuGroup,
        CdkContextMenuTrigger,
        CdkTargetMenuAim] });
CdkMenuModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "14.0.0-rc.1", ngImport: i0, type: CdkMenuModule, imports: [OverlayModule] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.0.0-rc.1", ngImport: i0, type: CdkMenuModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [OverlayModule],
                    exports: EXPORTED_DECLARATIONS,
                    declarations: EXPORTED_DECLARATIONS,
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS1tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL21lbnUvbWVudS1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDbkQsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUMvQixPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ3RDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDeEMsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUMxQyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNuRCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUN6RCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDOUMsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDN0QsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sWUFBWSxDQUFDOztBQUU1QyxtR0FBbUc7QUFDbkcsTUFBTSxxQkFBcUIsR0FBRztJQUM1QixVQUFVO0lBQ1YsT0FBTztJQUNQLFdBQVc7SUFDWCxnQkFBZ0I7SUFDaEIsbUJBQW1CO0lBQ25CLGNBQWM7SUFDZCxZQUFZO0lBQ1oscUJBQXFCO0lBQ3JCLGdCQUFnQjtDQUNqQixDQUFDO0FBRUYsdUVBQXVFO0FBTXZFLE1BQU0sT0FBTyxhQUFhOzsrR0FBYixhQUFhO2dIQUFiLGFBQWEsaUJBakJ4QixVQUFVO1FBQ1YsT0FBTztRQUNQLFdBQVc7UUFDWCxnQkFBZ0I7UUFDaEIsbUJBQW1CO1FBQ25CLGNBQWM7UUFDZCxZQUFZO1FBQ1oscUJBQXFCO1FBQ3JCLGdCQUFnQixhQUtOLGFBQWEsYUFidkIsVUFBVTtRQUNWLE9BQU87UUFDUCxXQUFXO1FBQ1gsZ0JBQWdCO1FBQ2hCLG1CQUFtQjtRQUNuQixjQUFjO1FBQ2QsWUFBWTtRQUNaLHFCQUFxQjtRQUNyQixnQkFBZ0I7Z0hBU0wsYUFBYSxZQUpkLGFBQWE7Z0dBSVosYUFBYTtrQkFMekIsUUFBUTttQkFBQztvQkFDUixPQUFPLEVBQUUsQ0FBQyxhQUFhLENBQUM7b0JBQ3hCLE9BQU8sRUFBRSxxQkFBcUI7b0JBQzlCLFlBQVksRUFBRSxxQkFBcUI7aUJBQ3BDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7TmdNb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtPdmVybGF5TW9kdWxlfSBmcm9tICdAYW5ndWxhci9jZGsvb3ZlcmxheSc7XG5pbXBvcnQge0Nka01lbnV9IGZyb20gJy4vbWVudSc7XG5pbXBvcnQge0Nka01lbnVCYXJ9IGZyb20gJy4vbWVudS1iYXInO1xuaW1wb3J0IHtDZGtNZW51SXRlbX0gZnJvbSAnLi9tZW51LWl0ZW0nO1xuaW1wb3J0IHtDZGtNZW51R3JvdXB9IGZyb20gJy4vbWVudS1ncm91cCc7XG5pbXBvcnQge0Nka01lbnVJdGVtUmFkaW99IGZyb20gJy4vbWVudS1pdGVtLXJhZGlvJztcbmltcG9ydCB7Q2RrTWVudUl0ZW1DaGVja2JveH0gZnJvbSAnLi9tZW51LWl0ZW0tY2hlY2tib3gnO1xuaW1wb3J0IHtDZGtNZW51VHJpZ2dlcn0gZnJvbSAnLi9tZW51LXRyaWdnZXInO1xuaW1wb3J0IHtDZGtDb250ZXh0TWVudVRyaWdnZXJ9IGZyb20gJy4vY29udGV4dC1tZW51LXRyaWdnZXInO1xuaW1wb3J0IHtDZGtUYXJnZXRNZW51QWltfSBmcm9tICcuL21lbnUtYWltJztcblxuLyoqIFRoZSBsaXN0IG9mIGNvbXBvbmVudHMgYW5kIGRpcmVjdGl2ZXMgdGhhdCBzaG91bGQgYmUgZGVjbGFyZWQgYW5kIGV4cG9ydGVkIGZyb20gdGhpcyBtb2R1bGUuICovXG5jb25zdCBFWFBPUlRFRF9ERUNMQVJBVElPTlMgPSBbXG4gIENka01lbnVCYXIsXG4gIENka01lbnUsXG4gIENka01lbnVJdGVtLFxuICBDZGtNZW51SXRlbVJhZGlvLFxuICBDZGtNZW51SXRlbUNoZWNrYm94LFxuICBDZGtNZW51VHJpZ2dlcixcbiAgQ2RrTWVudUdyb3VwLFxuICBDZGtDb250ZXh0TWVudVRyaWdnZXIsXG4gIENka1RhcmdldE1lbnVBaW0sXG5dO1xuXG4vKiogTW9kdWxlIHRoYXQgZGVjbGFyZXMgY29tcG9uZW50cyBhbmQgZGlyZWN0aXZlcyBmb3IgdGhlIENESyBtZW51LiAqL1xuQE5nTW9kdWxlKHtcbiAgaW1wb3J0czogW092ZXJsYXlNb2R1bGVdLFxuICBleHBvcnRzOiBFWFBPUlRFRF9ERUNMQVJBVElPTlMsXG4gIGRlY2xhcmF0aW9uczogRVhQT1JURURfREVDTEFSQVRJT05TLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtNZW51TW9kdWxlIHt9XG4iXX0=