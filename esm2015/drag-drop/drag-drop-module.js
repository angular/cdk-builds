/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __decorate } from "tslib";
import { NgModule } from '@angular/core';
import { CdkScrollableModule } from '@angular/cdk/scrolling';
import { CdkDropList } from './directives/drop-list';
import { CdkDropListGroup } from './directives/drop-list-group';
import { CdkDrag } from './directives/drag';
import { CdkDragHandle } from './directives/drag-handle';
import { CdkDragPreview } from './directives/drag-preview';
import { CdkDragPlaceholder } from './directives/drag-placeholder';
import { DragDrop } from './drag-drop';
let DragDropModule = /** @class */ (() => {
    let DragDropModule = class DragDropModule {
    };
    DragDropModule = __decorate([
        NgModule({
            declarations: [
                CdkDropList,
                CdkDropListGroup,
                CdkDrag,
                CdkDragHandle,
                CdkDragPreview,
                CdkDragPlaceholder,
            ],
            exports: [
                CdkScrollableModule,
                CdkDropList,
                CdkDropListGroup,
                CdkDrag,
                CdkDragHandle,
                CdkDragPreview,
                CdkDragPlaceholder,
            ],
            providers: [
                DragDrop,
            ]
        })
    ], DragDropModule);
    return DragDropModule;
})();
export { DragDropModule };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1kcm9wLW1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2RyYWctZHJvcC1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDdkMsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDM0QsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ25ELE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQzlELE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUMxQyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDdkQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQ3pELE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLCtCQUErQixDQUFDO0FBQ2pFLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxhQUFhLENBQUM7QUF3QnJDO0lBQUEsSUFBYSxjQUFjLEdBQTNCLE1BQWEsY0FBYztLQUFHLENBQUE7SUFBakIsY0FBYztRQXRCMUIsUUFBUSxDQUFDO1lBQ1IsWUFBWSxFQUFFO2dCQUNaLFdBQVc7Z0JBQ1gsZ0JBQWdCO2dCQUNoQixPQUFPO2dCQUNQLGFBQWE7Z0JBQ2IsY0FBYztnQkFDZCxrQkFBa0I7YUFDbkI7WUFDRCxPQUFPLEVBQUU7Z0JBQ1AsbUJBQW1CO2dCQUNuQixXQUFXO2dCQUNYLGdCQUFnQjtnQkFDaEIsT0FBTztnQkFDUCxhQUFhO2dCQUNiLGNBQWM7Z0JBQ2Qsa0JBQWtCO2FBQ25CO1lBQ0QsU0FBUyxFQUFFO2dCQUNULFFBQVE7YUFDVDtTQUNGLENBQUM7T0FDVyxjQUFjLENBQUc7SUFBRCxxQkFBQztLQUFBO1NBQWpCLGNBQWMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtOZ01vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0Nka1Njcm9sbGFibGVNb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2Nkay9zY3JvbGxpbmcnO1xuaW1wb3J0IHtDZGtEcm9wTGlzdH0gZnJvbSAnLi9kaXJlY3RpdmVzL2Ryb3AtbGlzdCc7XG5pbXBvcnQge0Nka0Ryb3BMaXN0R3JvdXB9IGZyb20gJy4vZGlyZWN0aXZlcy9kcm9wLWxpc3QtZ3JvdXAnO1xuaW1wb3J0IHtDZGtEcmFnfSBmcm9tICcuL2RpcmVjdGl2ZXMvZHJhZyc7XG5pbXBvcnQge0Nka0RyYWdIYW5kbGV9IGZyb20gJy4vZGlyZWN0aXZlcy9kcmFnLWhhbmRsZSc7XG5pbXBvcnQge0Nka0RyYWdQcmV2aWV3fSBmcm9tICcuL2RpcmVjdGl2ZXMvZHJhZy1wcmV2aWV3JztcbmltcG9ydCB7Q2RrRHJhZ1BsYWNlaG9sZGVyfSBmcm9tICcuL2RpcmVjdGl2ZXMvZHJhZy1wbGFjZWhvbGRlcic7XG5pbXBvcnQge0RyYWdEcm9wfSBmcm9tICcuL2RyYWctZHJvcCc7XG5cbkBOZ01vZHVsZSh7XG4gIGRlY2xhcmF0aW9uczogW1xuICAgIENka0Ryb3BMaXN0LFxuICAgIENka0Ryb3BMaXN0R3JvdXAsXG4gICAgQ2RrRHJhZyxcbiAgICBDZGtEcmFnSGFuZGxlLFxuICAgIENka0RyYWdQcmV2aWV3LFxuICAgIENka0RyYWdQbGFjZWhvbGRlcixcbiAgXSxcbiAgZXhwb3J0czogW1xuICAgIENka1Njcm9sbGFibGVNb2R1bGUsXG4gICAgQ2RrRHJvcExpc3QsXG4gICAgQ2RrRHJvcExpc3RHcm91cCxcbiAgICBDZGtEcmFnLFxuICAgIENka0RyYWdIYW5kbGUsXG4gICAgQ2RrRHJhZ1ByZXZpZXcsXG4gICAgQ2RrRHJhZ1BsYWNlaG9sZGVyLFxuICBdLFxuICBwcm92aWRlcnM6IFtcbiAgICBEcmFnRHJvcCxcbiAgXVxufSlcbmV4cG9ydCBjbGFzcyBEcmFnRHJvcE1vZHVsZSB7fVxuIl19