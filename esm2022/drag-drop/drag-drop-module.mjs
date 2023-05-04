/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NgModule } from '@angular/core';
import { CdkScrollableModule } from '@angular/cdk/scrolling';
import { CdkDropList } from './directives/drop-list';
import { CdkDropListGroup } from './directives/drop-list-group';
import { CdkDrag } from './directives/drag';
import { CdkDragHandle } from './directives/drag-handle';
import { CdkDragPreview } from './directives/drag-preview';
import { CdkDragPlaceholder } from './directives/drag-placeholder';
import { DragDrop } from './drag-drop';
import * as i0 from "@angular/core";
const DRAG_DROP_DIRECTIVES = [
    CdkDropList,
    CdkDropListGroup,
    CdkDrag,
    CdkDragHandle,
    CdkDragPreview,
    CdkDragPlaceholder,
];
class DragDropModule {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: DragDropModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule }); }
    static { this.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "16.0.0", ngImport: i0, type: DragDropModule, imports: [CdkDropList,
            CdkDropListGroup,
            CdkDrag,
            CdkDragHandle,
            CdkDragPreview,
            CdkDragPlaceholder], exports: [CdkScrollableModule, CdkDropList,
            CdkDropListGroup,
            CdkDrag,
            CdkDragHandle,
            CdkDragPreview,
            CdkDragPlaceholder] }); }
    static { this.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: DragDropModule, providers: [DragDrop], imports: [CdkScrollableModule] }); }
}
export { DragDropModule };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: DragDropModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: DRAG_DROP_DIRECTIVES,
                    exports: [CdkScrollableModule, ...DRAG_DROP_DIRECTIVES],
                    providers: [DragDrop],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1kcm9wLW1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2RyYWctZHJvcC1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUMzRCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDbkQsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDOUQsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzFDLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUN2RCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDekQsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDakUsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGFBQWEsQ0FBQzs7QUFFckMsTUFBTSxvQkFBb0IsR0FBRztJQUMzQixXQUFXO0lBQ1gsZ0JBQWdCO0lBQ2hCLE9BQU87SUFDUCxhQUFhO0lBQ2IsY0FBYztJQUNkLGtCQUFrQjtDQUNuQixDQUFDO0FBRUYsTUFLYSxjQUFjOzhHQUFkLGNBQWM7K0dBQWQsY0FBYyxZQWJ6QixXQUFXO1lBQ1gsZ0JBQWdCO1lBQ2hCLE9BQU87WUFDUCxhQUFhO1lBQ2IsY0FBYztZQUNkLGtCQUFrQixhQUtSLG1CQUFtQixFQVY3QixXQUFXO1lBQ1gsZ0JBQWdCO1lBQ2hCLE9BQU87WUFDUCxhQUFhO1lBQ2IsY0FBYztZQUNkLGtCQUFrQjsrR0FRUCxjQUFjLGFBRmQsQ0FBQyxRQUFRLENBQUMsWUFEWCxtQkFBbUI7O1NBR2xCLGNBQWM7MkZBQWQsY0FBYztrQkFMMUIsUUFBUTttQkFBQztvQkFDUixPQUFPLEVBQUUsb0JBQW9CO29CQUM3QixPQUFPLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLG9CQUFvQixDQUFDO29CQUN2RCxTQUFTLEVBQUUsQ0FBQyxRQUFRLENBQUM7aUJBQ3RCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7TmdNb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtDZGtTY3JvbGxhYmxlTW9kdWxlfSBmcm9tICdAYW5ndWxhci9jZGsvc2Nyb2xsaW5nJztcbmltcG9ydCB7Q2RrRHJvcExpc3R9IGZyb20gJy4vZGlyZWN0aXZlcy9kcm9wLWxpc3QnO1xuaW1wb3J0IHtDZGtEcm9wTGlzdEdyb3VwfSBmcm9tICcuL2RpcmVjdGl2ZXMvZHJvcC1saXN0LWdyb3VwJztcbmltcG9ydCB7Q2RrRHJhZ30gZnJvbSAnLi9kaXJlY3RpdmVzL2RyYWcnO1xuaW1wb3J0IHtDZGtEcmFnSGFuZGxlfSBmcm9tICcuL2RpcmVjdGl2ZXMvZHJhZy1oYW5kbGUnO1xuaW1wb3J0IHtDZGtEcmFnUHJldmlld30gZnJvbSAnLi9kaXJlY3RpdmVzL2RyYWctcHJldmlldyc7XG5pbXBvcnQge0Nka0RyYWdQbGFjZWhvbGRlcn0gZnJvbSAnLi9kaXJlY3RpdmVzL2RyYWctcGxhY2Vob2xkZXInO1xuaW1wb3J0IHtEcmFnRHJvcH0gZnJvbSAnLi9kcmFnLWRyb3AnO1xuXG5jb25zdCBEUkFHX0RST1BfRElSRUNUSVZFUyA9IFtcbiAgQ2RrRHJvcExpc3QsXG4gIENka0Ryb3BMaXN0R3JvdXAsXG4gIENka0RyYWcsXG4gIENka0RyYWdIYW5kbGUsXG4gIENka0RyYWdQcmV2aWV3LFxuICBDZGtEcmFnUGxhY2Vob2xkZXIsXG5dO1xuXG5ATmdNb2R1bGUoe1xuICBpbXBvcnRzOiBEUkFHX0RST1BfRElSRUNUSVZFUyxcbiAgZXhwb3J0czogW0Nka1Njcm9sbGFibGVNb2R1bGUsIC4uLkRSQUdfRFJPUF9ESVJFQ1RJVkVTXSxcbiAgcHJvdmlkZXJzOiBbRHJhZ0Ryb3BdLFxufSlcbmV4cG9ydCBjbGFzcyBEcmFnRHJvcE1vZHVsZSB7fVxuIl19