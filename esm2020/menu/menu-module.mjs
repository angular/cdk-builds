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
CdkMenuModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.0.0-next.14", ngImport: i0, type: CdkMenuModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CdkMenuModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "14.0.0-next.14", ngImport: i0, type: CdkMenuModule, declarations: [CdkMenuBar,
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
CdkMenuModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "14.0.0-next.14", ngImport: i0, type: CdkMenuModule, imports: [[OverlayModule]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.0.0-next.14", ngImport: i0, type: CdkMenuModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [OverlayModule],
                    exports: EXPORTED_DECLARATIONS,
                    declarations: EXPORTED_DECLARATIONS,
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS1tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL21lbnUvbWVudS1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDbkQsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUMvQixPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ3RDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDeEMsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUMxQyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNuRCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUN6RCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDOUMsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDN0QsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sWUFBWSxDQUFDOztBQUU1QyxtR0FBbUc7QUFDbkcsTUFBTSxxQkFBcUIsR0FBRztJQUM1QixVQUFVO0lBQ1YsT0FBTztJQUNQLFdBQVc7SUFDWCxnQkFBZ0I7SUFDaEIsbUJBQW1CO0lBQ25CLGNBQWM7SUFDZCxZQUFZO0lBQ1oscUJBQXFCO0lBQ3JCLGdCQUFnQjtDQUNqQixDQUFDO0FBRUYsdUVBQXVFO0FBTXZFLE1BQU0sT0FBTyxhQUFhOztrSEFBYixhQUFhO21IQUFiLGFBQWEsaUJBakJ4QixVQUFVO1FBQ1YsT0FBTztRQUNQLFdBQVc7UUFDWCxnQkFBZ0I7UUFDaEIsbUJBQW1CO1FBQ25CLGNBQWM7UUFDZCxZQUFZO1FBQ1oscUJBQXFCO1FBQ3JCLGdCQUFnQixhQUtOLGFBQWEsYUFidkIsVUFBVTtRQUNWLE9BQU87UUFDUCxXQUFXO1FBQ1gsZ0JBQWdCO1FBQ2hCLG1CQUFtQjtRQUNuQixjQUFjO1FBQ2QsWUFBWTtRQUNaLHFCQUFxQjtRQUNyQixnQkFBZ0I7bUhBU0wsYUFBYSxZQUpmLENBQUMsYUFBYSxDQUFDO21HQUliLGFBQWE7a0JBTHpCLFFBQVE7bUJBQUM7b0JBQ1IsT0FBTyxFQUFFLENBQUMsYUFBYSxDQUFDO29CQUN4QixPQUFPLEVBQUUscUJBQXFCO29CQUM5QixZQUFZLEVBQUUscUJBQXFCO2lCQUNwQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge05nTW9kdWxlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T3ZlcmxheU1vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvY2RrL292ZXJsYXknO1xuaW1wb3J0IHtDZGtNZW51fSBmcm9tICcuL21lbnUnO1xuaW1wb3J0IHtDZGtNZW51QmFyfSBmcm9tICcuL21lbnUtYmFyJztcbmltcG9ydCB7Q2RrTWVudUl0ZW19IGZyb20gJy4vbWVudS1pdGVtJztcbmltcG9ydCB7Q2RrTWVudUdyb3VwfSBmcm9tICcuL21lbnUtZ3JvdXAnO1xuaW1wb3J0IHtDZGtNZW51SXRlbVJhZGlvfSBmcm9tICcuL21lbnUtaXRlbS1yYWRpbyc7XG5pbXBvcnQge0Nka01lbnVJdGVtQ2hlY2tib3h9IGZyb20gJy4vbWVudS1pdGVtLWNoZWNrYm94JztcbmltcG9ydCB7Q2RrTWVudVRyaWdnZXJ9IGZyb20gJy4vbWVudS10cmlnZ2VyJztcbmltcG9ydCB7Q2RrQ29udGV4dE1lbnVUcmlnZ2VyfSBmcm9tICcuL2NvbnRleHQtbWVudS10cmlnZ2VyJztcbmltcG9ydCB7Q2RrVGFyZ2V0TWVudUFpbX0gZnJvbSAnLi9tZW51LWFpbSc7XG5cbi8qKiBUaGUgbGlzdCBvZiBjb21wb25lbnRzIGFuZCBkaXJlY3RpdmVzIHRoYXQgc2hvdWxkIGJlIGRlY2xhcmVkIGFuZCBleHBvcnRlZCBmcm9tIHRoaXMgbW9kdWxlLiAqL1xuY29uc3QgRVhQT1JURURfREVDTEFSQVRJT05TID0gW1xuICBDZGtNZW51QmFyLFxuICBDZGtNZW51LFxuICBDZGtNZW51SXRlbSxcbiAgQ2RrTWVudUl0ZW1SYWRpbyxcbiAgQ2RrTWVudUl0ZW1DaGVja2JveCxcbiAgQ2RrTWVudVRyaWdnZXIsXG4gIENka01lbnVHcm91cCxcbiAgQ2RrQ29udGV4dE1lbnVUcmlnZ2VyLFxuICBDZGtUYXJnZXRNZW51QWltLFxuXTtcblxuLyoqIE1vZHVsZSB0aGF0IGRlY2xhcmVzIGNvbXBvbmVudHMgYW5kIGRpcmVjdGl2ZXMgZm9yIHRoZSBDREsgbWVudS4gKi9cbkBOZ01vZHVsZSh7XG4gIGltcG9ydHM6IFtPdmVybGF5TW9kdWxlXSxcbiAgZXhwb3J0czogRVhQT1JURURfREVDTEFSQVRJT05TLFxuICBkZWNsYXJhdGlvbnM6IEVYUE9SVEVEX0RFQ0xBUkFUSU9OUyxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrTWVudU1vZHVsZSB7fVxuIl19