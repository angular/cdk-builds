/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NgModule } from '@angular/core';
import { CdkDropList } from './directives/drop-list';
import { CdkDropListGroup } from './directives/drop-list-group';
import { CdkDrag } from './directives/drag';
import { CdkDragHandle } from './directives/drag-handle';
import { CdkDragPreview } from './directives/drag-preview';
import { CdkDragPlaceholder } from './directives/drag-placeholder';
import { DragDrop } from './drag-drop';
export class DragDropModule {
}
DragDropModule.decorators = [
    { type: NgModule, args: [{
                declarations: [
                    CdkDropList,
                    CdkDropListGroup,
                    CdkDrag,
                    CdkDragHandle,
                    CdkDragPreview,
                    CdkDragPlaceholder,
                ],
                exports: [
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
            },] }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1kcm9wLW1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2RyYWctZHJvcC1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3ZDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNuRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUM5RCxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDMUMsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ3ZELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUN6RCxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUNqRSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBdUJyQyxNQUFNLE9BQU8sY0FBYzs7O1lBckIxQixRQUFRLFNBQUM7Z0JBQ1IsWUFBWSxFQUFFO29CQUNaLFdBQVc7b0JBQ1gsZ0JBQWdCO29CQUNoQixPQUFPO29CQUNQLGFBQWE7b0JBQ2IsY0FBYztvQkFDZCxrQkFBa0I7aUJBQ25CO2dCQUNELE9BQU8sRUFBRTtvQkFDUCxXQUFXO29CQUNYLGdCQUFnQjtvQkFDaEIsT0FBTztvQkFDUCxhQUFhO29CQUNiLGNBQWM7b0JBQ2Qsa0JBQWtCO2lCQUNuQjtnQkFDRCxTQUFTLEVBQUU7b0JBQ1QsUUFBUTtpQkFDVDthQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7TmdNb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtDZGtEcm9wTGlzdH0gZnJvbSAnLi9kaXJlY3RpdmVzL2Ryb3AtbGlzdCc7XG5pbXBvcnQge0Nka0Ryb3BMaXN0R3JvdXB9IGZyb20gJy4vZGlyZWN0aXZlcy9kcm9wLWxpc3QtZ3JvdXAnO1xuaW1wb3J0IHtDZGtEcmFnfSBmcm9tICcuL2RpcmVjdGl2ZXMvZHJhZyc7XG5pbXBvcnQge0Nka0RyYWdIYW5kbGV9IGZyb20gJy4vZGlyZWN0aXZlcy9kcmFnLWhhbmRsZSc7XG5pbXBvcnQge0Nka0RyYWdQcmV2aWV3fSBmcm9tICcuL2RpcmVjdGl2ZXMvZHJhZy1wcmV2aWV3JztcbmltcG9ydCB7Q2RrRHJhZ1BsYWNlaG9sZGVyfSBmcm9tICcuL2RpcmVjdGl2ZXMvZHJhZy1wbGFjZWhvbGRlcic7XG5pbXBvcnQge0RyYWdEcm9wfSBmcm9tICcuL2RyYWctZHJvcCc7XG5cbkBOZ01vZHVsZSh7XG4gIGRlY2xhcmF0aW9uczogW1xuICAgIENka0Ryb3BMaXN0LFxuICAgIENka0Ryb3BMaXN0R3JvdXAsXG4gICAgQ2RrRHJhZyxcbiAgICBDZGtEcmFnSGFuZGxlLFxuICAgIENka0RyYWdQcmV2aWV3LFxuICAgIENka0RyYWdQbGFjZWhvbGRlcixcbiAgXSxcbiAgZXhwb3J0czogW1xuICAgIENka0Ryb3BMaXN0LFxuICAgIENka0Ryb3BMaXN0R3JvdXAsXG4gICAgQ2RrRHJhZyxcbiAgICBDZGtEcmFnSGFuZGxlLFxuICAgIENka0RyYWdQcmV2aWV3LFxuICAgIENka0RyYWdQbGFjZWhvbGRlcixcbiAgXSxcbiAgcHJvdmlkZXJzOiBbXG4gICAgRHJhZ0Ryb3AsXG4gIF1cbn0pXG5leHBvcnQgY2xhc3MgRHJhZ0Ryb3BNb2R1bGUge31cbiJdfQ==