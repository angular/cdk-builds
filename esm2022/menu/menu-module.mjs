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
const MENU_DIRECTIVES = [
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
class CdkMenuModule {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkMenuModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule }); }
    static { this.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "16.0.0", ngImport: i0, type: CdkMenuModule, imports: [OverlayModule, CdkMenuBar,
            CdkMenu,
            CdkMenuItem,
            CdkMenuItemRadio,
            CdkMenuItemCheckbox,
            CdkMenuTrigger,
            CdkMenuGroup,
            CdkContextMenuTrigger,
            CdkTargetMenuAim], exports: [CdkMenuBar,
            CdkMenu,
            CdkMenuItem,
            CdkMenuItemRadio,
            CdkMenuItemCheckbox,
            CdkMenuTrigger,
            CdkMenuGroup,
            CdkContextMenuTrigger,
            CdkTargetMenuAim] }); }
    static { this.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkMenuModule, imports: [OverlayModule] }); }
}
export { CdkMenuModule };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkMenuModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [OverlayModule, ...MENU_DIRECTIVES],
                    exports: MENU_DIRECTIVES,
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS1tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL21lbnUvbWVudS1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDbkQsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUMvQixPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ3RDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDeEMsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUMxQyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNuRCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUN6RCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDOUMsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDN0QsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sWUFBWSxDQUFDOztBQUU1QyxNQUFNLGVBQWUsR0FBRztJQUN0QixVQUFVO0lBQ1YsT0FBTztJQUNQLFdBQVc7SUFDWCxnQkFBZ0I7SUFDaEIsbUJBQW1CO0lBQ25CLGNBQWM7SUFDZCxZQUFZO0lBQ1oscUJBQXFCO0lBQ3JCLGdCQUFnQjtDQUNqQixDQUFDO0FBRUYsdUVBQXVFO0FBQ3ZFLE1BSWEsYUFBYTs4R0FBYixhQUFhOytHQUFiLGFBQWEsWUFIZCxhQUFhLEVBYnZCLFVBQVU7WUFDVixPQUFPO1lBQ1AsV0FBVztZQUNYLGdCQUFnQjtZQUNoQixtQkFBbUI7WUFDbkIsY0FBYztZQUNkLFlBQVk7WUFDWixxQkFBcUI7WUFDckIsZ0JBQWdCLGFBUmhCLFVBQVU7WUFDVixPQUFPO1lBQ1AsV0FBVztZQUNYLGdCQUFnQjtZQUNoQixtQkFBbUI7WUFDbkIsY0FBYztZQUNkLFlBQVk7WUFDWixxQkFBcUI7WUFDckIsZ0JBQWdCOytHQVFMLGFBQWEsWUFIZCxhQUFhOztTQUdaLGFBQWE7MkZBQWIsYUFBYTtrQkFKekIsUUFBUTttQkFBQztvQkFDUixPQUFPLEVBQUUsQ0FBQyxhQUFhLEVBQUUsR0FBRyxlQUFlLENBQUM7b0JBQzVDLE9BQU8sRUFBRSxlQUFlO2lCQUN6QiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge05nTW9kdWxlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T3ZlcmxheU1vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvY2RrL292ZXJsYXknO1xuaW1wb3J0IHtDZGtNZW51fSBmcm9tICcuL21lbnUnO1xuaW1wb3J0IHtDZGtNZW51QmFyfSBmcm9tICcuL21lbnUtYmFyJztcbmltcG9ydCB7Q2RrTWVudUl0ZW19IGZyb20gJy4vbWVudS1pdGVtJztcbmltcG9ydCB7Q2RrTWVudUdyb3VwfSBmcm9tICcuL21lbnUtZ3JvdXAnO1xuaW1wb3J0IHtDZGtNZW51SXRlbVJhZGlvfSBmcm9tICcuL21lbnUtaXRlbS1yYWRpbyc7XG5pbXBvcnQge0Nka01lbnVJdGVtQ2hlY2tib3h9IGZyb20gJy4vbWVudS1pdGVtLWNoZWNrYm94JztcbmltcG9ydCB7Q2RrTWVudVRyaWdnZXJ9IGZyb20gJy4vbWVudS10cmlnZ2VyJztcbmltcG9ydCB7Q2RrQ29udGV4dE1lbnVUcmlnZ2VyfSBmcm9tICcuL2NvbnRleHQtbWVudS10cmlnZ2VyJztcbmltcG9ydCB7Q2RrVGFyZ2V0TWVudUFpbX0gZnJvbSAnLi9tZW51LWFpbSc7XG5cbmNvbnN0IE1FTlVfRElSRUNUSVZFUyA9IFtcbiAgQ2RrTWVudUJhcixcbiAgQ2RrTWVudSxcbiAgQ2RrTWVudUl0ZW0sXG4gIENka01lbnVJdGVtUmFkaW8sXG4gIENka01lbnVJdGVtQ2hlY2tib3gsXG4gIENka01lbnVUcmlnZ2VyLFxuICBDZGtNZW51R3JvdXAsXG4gIENka0NvbnRleHRNZW51VHJpZ2dlcixcbiAgQ2RrVGFyZ2V0TWVudUFpbSxcbl07XG5cbi8qKiBNb2R1bGUgdGhhdCBkZWNsYXJlcyBjb21wb25lbnRzIGFuZCBkaXJlY3RpdmVzIGZvciB0aGUgQ0RLIG1lbnUuICovXG5ATmdNb2R1bGUoe1xuICBpbXBvcnRzOiBbT3ZlcmxheU1vZHVsZSwgLi4uTUVOVV9ESVJFQ1RJVkVTXSxcbiAgZXhwb3J0czogTUVOVV9ESVJFQ1RJVkVTLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtNZW51TW9kdWxlIHt9XG4iXX0=