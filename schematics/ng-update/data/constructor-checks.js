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
    [target_version_1.TargetVersion.V12]: [
        {
            pr: 'https://github.com/angular/components/pull/21876',
            changes: ['CdkTable', 'StickyStyler']
        }
    ],
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
        },
        {
            pr: 'https://github.com/angular/components/pull/20511',
            changes: ['OverlayContainer', 'FullscreenOverlayContainer', 'OverlayRef', 'Overlay']
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RydWN0b3ItY2hlY2tzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL25nLXVwZGF0ZS9kYXRhL2NvbnN0cnVjdG9yLWNoZWNrcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCxxRUFBK0Q7QUFLL0Q7Ozs7R0FJRztBQUNVLFFBQUEsaUJBQWlCLEdBQWlEO0lBQzdFLENBQUMsOEJBQWEsQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUNuQjtZQUNFLEVBQUUsRUFBRSxrREFBa0Q7WUFDdEQsT0FBTyxFQUFFLENBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQztTQUN0QztLQUNGO0lBQ0QsQ0FBQyw4QkFBYSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQ25CO1lBQ0UsRUFBRSxFQUFFLGtEQUFrRDtZQUN0RCxPQUFPLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSxlQUFlLEVBQUUsMEJBQTBCLENBQUM7U0FDM0U7UUFDRDtZQUNFLEVBQUUsRUFBRSxrREFBa0Q7WUFDdEQsT0FBTyxFQUFFLENBQUMsYUFBYSxDQUFDO1NBQ3pCO1FBQ0Q7WUFDRSxFQUFFLEVBQUUsa0RBQWtEO1lBQ3RELE9BQU8sRUFBRSxDQUFDLG9CQUFvQixDQUFDO1NBQ2hDO1FBQ0Q7WUFDRSxFQUFFLEVBQUUsa0RBQWtEO1lBQ3RELE9BQU8sRUFBRSxDQUFDLGtCQUFrQixFQUFFLDRCQUE0QixFQUFFLFlBQVksRUFBRSxTQUFTLENBQUM7U0FDckY7S0FDRjtJQUNELENBQUMsOEJBQWEsQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUNuQjtZQUNFLEVBQUUsRUFBRSxrREFBa0Q7WUFDdEQsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDO1NBQ3RCO0tBQ0Y7SUFDRCxDQUFDLDhCQUFhLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUNuQixFQUFFLEVBQUUsa0RBQWtEO1lBQ3RELE9BQU8sRUFBRSxDQUFDLGFBQWEsQ0FBQztTQUN6QixDQUFDO0lBQ0YsQ0FBQyw4QkFBYSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDbkIsRUFBRSxFQUFFLGtEQUFrRDtZQUN0RCxPQUFPLEVBQUU7Z0JBQ1AsU0FBUyxFQUFFLGFBQWEsRUFBRSwyQkFBMkIsRUFBRSxtQ0FBbUM7Z0JBQzFGLHdCQUF3QixFQUFFLFVBQVU7YUFDckM7U0FDRixDQUFDO0lBQ0YsQ0FBQyw4QkFBYSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDdEIsQ0FBQyw4QkFBYSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Q0FDdkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1RhcmdldFZlcnNpb259IGZyb20gJy4uLy4uL3VwZGF0ZS10b29sL3RhcmdldC12ZXJzaW9uJztcbmltcG9ydCB7VmVyc2lvbkNoYW5nZXN9IGZyb20gJy4uLy4uL3VwZGF0ZS10b29sL3ZlcnNpb24tY2hhbmdlcyc7XG5cbmV4cG9ydCB0eXBlIENvbnN0cnVjdG9yQ2hlY2tzVXBncmFkZURhdGEgPSBzdHJpbmc7XG5cbi8qKlxuICogTGlzdCBvZiBjbGFzcyBuYW1lcyBmb3Igd2hpY2ggdGhlIGNvbnN0cnVjdG9yIHNpZ25hdHVyZSBoYXMgYmVlbiBjaGFuZ2VkLiBUaGUgbmV3IGNvbnN0cnVjdG9yXG4gKiBzaWduYXR1cmUgdHlwZXMgZG9uJ3QgbmVlZCB0byBiZSBzdG9yZWQgaGVyZSBiZWNhdXNlIHRoZSBzaWduYXR1cmUgd2lsbCBiZSBkZXRlcm1pbmVkXG4gKiBhdXRvbWF0aWNhbGx5IHRocm91Z2ggdHlwZSBjaGVja2luZy5cbiAqL1xuZXhwb3J0IGNvbnN0IGNvbnN0cnVjdG9yQ2hlY2tzOiBWZXJzaW9uQ2hhbmdlczxDb25zdHJ1Y3RvckNoZWNrc1VwZ3JhZGVEYXRhPiA9IHtcbiAgW1RhcmdldFZlcnNpb24uVjEyXTogW1xuICAgIHtcbiAgICAgIHByOiAnaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvY29tcG9uZW50cy9wdWxsLzIxODc2JyxcbiAgICAgIGNoYW5nZXM6IFsnQ2RrVGFibGUnLCAnU3RpY2t5U3R5bGVyJ11cbiAgICB9XG4gIF0sXG4gIFtUYXJnZXRWZXJzaW9uLlYxMV06IFtcbiAgICB7XG4gICAgICBwcjogJ2h0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2NvbXBvbmVudHMvcHVsbC8yMDQ1NCcsXG4gICAgICBjaGFuZ2VzOiBbJ1Njcm9sbERpc3BhdGNoZXInLCAnVmlld3BvcnRSdWxlcicsICdDZGtWaXJ0dWFsU2Nyb2xsVmlld3BvcnQnXVxuICAgIH0sXG4gICAge1xuICAgICAgcHI6ICdodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9jb21wb25lbnRzL3B1bGwvMjA1MDAnLFxuICAgICAgY2hhbmdlczogWydDZGtEcm9wTGlzdCddXG4gICAgfSxcbiAgICB7XG4gICAgICBwcjogJ2h0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2NvbXBvbmVudHMvcHVsbC8yMDU3MicsXG4gICAgICBjaGFuZ2VzOiBbJ0Nka1RyZWVOb2RlUGFkZGluZyddXG4gICAgfSxcbiAgICB7XG4gICAgICBwcjogJ2h0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2NvbXBvbmVudHMvcHVsbC8yMDUxMScsXG4gICAgICBjaGFuZ2VzOiBbJ092ZXJsYXlDb250YWluZXInLCAnRnVsbHNjcmVlbk92ZXJsYXlDb250YWluZXInLCAnT3ZlcmxheVJlZicsICdPdmVybGF5J11cbiAgICB9XG4gIF0sXG4gIFtUYXJnZXRWZXJzaW9uLlYxMF06IFtcbiAgICB7XG4gICAgICBwcjogJ2h0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2NvbXBvbmVudHMvcHVsbC8xOTM0NycsXG4gICAgICBjaGFuZ2VzOiBbJ1BsYXRmb3JtJ11cbiAgICB9XG4gIF0sXG4gIFtUYXJnZXRWZXJzaW9uLlY5XTogW3tcbiAgICBwcjogJ2h0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2NvbXBvbmVudHMvcHVsbC8xNzA4NCcsXG4gICAgY2hhbmdlczogWydEcm9wTGlzdFJlZiddXG4gIH1dLFxuICBbVGFyZ2V0VmVyc2lvbi5WOF06IFt7XG4gICAgcHI6ICdodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9jb21wb25lbnRzL3B1bGwvMTU2NDcnLFxuICAgIGNoYW5nZXM6IFtcbiAgICAgICdDZGtEcmFnJywgJ0Nka0Ryb3BMaXN0JywgJ0Nvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3knLCAnRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5JyxcbiAgICAgICdPdmVybGF5UG9zaXRpb25CdWlsZGVyJywgJ0Nka1RhYmxlJ1xuICAgIF1cbiAgfV0sXG4gIFtUYXJnZXRWZXJzaW9uLlY3XTogW10sXG4gIFtUYXJnZXRWZXJzaW9uLlY2XTogW11cbn07XG4iXX0=