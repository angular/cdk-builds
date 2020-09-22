"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.constructorChecks = void 0;
const target_version_1 = require("../../update-tool/target-version");
/**
 * List of class names for which the constructor signature has been changed. The new constructor
 * signature types don't need to be stored here because the signature will be determined
 * automatically through type checking.
 */
exports.constructorChecks = {
    [target_version_1.TargetVersion.V11]: [
        {
            pr: 'https://github.com/angular/components/pull/20454',
            changes: ['ScrollDispatcher', 'ViewportRuler', 'CdkVirtualScrollViewport']
        },
        {
            pr: 'https://github.com/angular/components/pull/20500',
            changes: ['CdkDropList']
        },
        {
            pr: 'https://github.com/angular/components/pull/20572',
            changes: ['CdkTreeNodePadding']
        }
    ],
    [target_version_1.TargetVersion.V10]: [
        {
            pr: 'https://github.com/angular/components/pull/19347',
            changes: ['Platform']
        }
    ],
    [target_version_1.TargetVersion.V9]: [{
            pr: 'https://github.com/angular/components/pull/17084',
            changes: ['DropListRef']
        }],
    [target_version_1.TargetVersion.V8]: [{
            pr: 'https://github.com/angular/components/pull/15647',
            changes: [
                'CdkDrag', 'CdkDropList', 'ConnectedPositionStrategy', 'FlexibleConnectedPositionStrategy',
                'OverlayPositionBuilder', 'CdkTable'
            ]
        }],
    [target_version_1.TargetVersion.V7]: [],
    [target_version_1.TargetVersion.V6]: []
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RydWN0b3ItY2hlY2tzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL25nLXVwZGF0ZS9kYXRhL2NvbnN0cnVjdG9yLWNoZWNrcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCxxRUFBK0Q7QUFLL0Q7Ozs7R0FJRztBQUNVLFFBQUEsaUJBQWlCLEdBQWlEO0lBQzdFLENBQUMsOEJBQWEsQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUNuQjtZQUNFLEVBQUUsRUFBRSxrREFBa0Q7WUFDdEQsT0FBTyxFQUFFLENBQUMsa0JBQWtCLEVBQUUsZUFBZSxFQUFFLDBCQUEwQixDQUFDO1NBQzNFO1FBQ0Q7WUFDRSxFQUFFLEVBQUUsa0RBQWtEO1lBQ3RELE9BQU8sRUFBRSxDQUFDLGFBQWEsQ0FBQztTQUN6QjtRQUNEO1lBQ0UsRUFBRSxFQUFFLGtEQUFrRDtZQUN0RCxPQUFPLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQztTQUNoQztLQUNGO0lBQ0QsQ0FBQyw4QkFBYSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQ25CO1lBQ0UsRUFBRSxFQUFFLGtEQUFrRDtZQUN0RCxPQUFPLEVBQUUsQ0FBQyxVQUFVLENBQUM7U0FDdEI7S0FDRjtJQUNELENBQUMsOEJBQWEsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQ25CLEVBQUUsRUFBRSxrREFBa0Q7WUFDdEQsT0FBTyxFQUFFLENBQUMsYUFBYSxDQUFDO1NBQ3pCLENBQUM7SUFDRixDQUFDLDhCQUFhLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUNuQixFQUFFLEVBQUUsa0RBQWtEO1lBQ3RELE9BQU8sRUFBRTtnQkFDUCxTQUFTLEVBQUUsYUFBYSxFQUFFLDJCQUEyQixFQUFFLG1DQUFtQztnQkFDMUYsd0JBQXdCLEVBQUUsVUFBVTthQUNyQztTQUNGLENBQUM7SUFDRixDQUFDLDhCQUFhLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtJQUN0QixDQUFDLDhCQUFhLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtDQUN2QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VGFyZ2V0VmVyc2lvbn0gZnJvbSAnLi4vLi4vdXBkYXRlLXRvb2wvdGFyZ2V0LXZlcnNpb24nO1xuaW1wb3J0IHtWZXJzaW9uQ2hhbmdlc30gZnJvbSAnLi4vLi4vdXBkYXRlLXRvb2wvdmVyc2lvbi1jaGFuZ2VzJztcblxuZXhwb3J0IHR5cGUgQ29uc3RydWN0b3JDaGVja3NVcGdyYWRlRGF0YSA9IHN0cmluZztcblxuLyoqXG4gKiBMaXN0IG9mIGNsYXNzIG5hbWVzIGZvciB3aGljaCB0aGUgY29uc3RydWN0b3Igc2lnbmF0dXJlIGhhcyBiZWVuIGNoYW5nZWQuIFRoZSBuZXcgY29uc3RydWN0b3JcbiAqIHNpZ25hdHVyZSB0eXBlcyBkb24ndCBuZWVkIHRvIGJlIHN0b3JlZCBoZXJlIGJlY2F1c2UgdGhlIHNpZ25hdHVyZSB3aWxsIGJlIGRldGVybWluZWRcbiAqIGF1dG9tYXRpY2FsbHkgdGhyb3VnaCB0eXBlIGNoZWNraW5nLlxuICovXG5leHBvcnQgY29uc3QgY29uc3RydWN0b3JDaGVja3M6IFZlcnNpb25DaGFuZ2VzPENvbnN0cnVjdG9yQ2hlY2tzVXBncmFkZURhdGE+ID0ge1xuICBbVGFyZ2V0VmVyc2lvbi5WMTFdOiBbXG4gICAge1xuICAgICAgcHI6ICdodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9jb21wb25lbnRzL3B1bGwvMjA0NTQnLFxuICAgICAgY2hhbmdlczogWydTY3JvbGxEaXNwYXRjaGVyJywgJ1ZpZXdwb3J0UnVsZXInLCAnQ2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0J11cbiAgICB9LFxuICAgIHtcbiAgICAgIHByOiAnaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvY29tcG9uZW50cy9wdWxsLzIwNTAwJyxcbiAgICAgIGNoYW5nZXM6IFsnQ2RrRHJvcExpc3QnXVxuICAgIH0sXG4gICAge1xuICAgICAgcHI6ICdodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9jb21wb25lbnRzL3B1bGwvMjA1NzInLFxuICAgICAgY2hhbmdlczogWydDZGtUcmVlTm9kZVBhZGRpbmcnXVxuICAgIH1cbiAgXSxcbiAgW1RhcmdldFZlcnNpb24uVjEwXTogW1xuICAgIHtcbiAgICAgIHByOiAnaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvY29tcG9uZW50cy9wdWxsLzE5MzQ3JyxcbiAgICAgIGNoYW5nZXM6IFsnUGxhdGZvcm0nXVxuICAgIH1cbiAgXSxcbiAgW1RhcmdldFZlcnNpb24uVjldOiBbe1xuICAgIHByOiAnaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvY29tcG9uZW50cy9wdWxsLzE3MDg0JyxcbiAgICBjaGFuZ2VzOiBbJ0Ryb3BMaXN0UmVmJ11cbiAgfV0sXG4gIFtUYXJnZXRWZXJzaW9uLlY4XTogW3tcbiAgICBwcjogJ2h0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2NvbXBvbmVudHMvcHVsbC8xNTY0NycsXG4gICAgY2hhbmdlczogW1xuICAgICAgJ0Nka0RyYWcnLCAnQ2RrRHJvcExpc3QnLCAnQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneScsICdGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3knLFxuICAgICAgJ092ZXJsYXlQb3NpdGlvbkJ1aWxkZXInLCAnQ2RrVGFibGUnXG4gICAgXVxuICB9XSxcbiAgW1RhcmdldFZlcnNpb24uVjddOiBbXSxcbiAgW1RhcmdldFZlcnNpb24uVjZdOiBbXVxufTtcbiJdfQ==