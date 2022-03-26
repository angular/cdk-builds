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
    [target_version_1.TargetVersion.V13]: [
        {
            pr: 'https://github.com/angular/components/pull/23328',
            changes: ['CdkStepper'],
        },
    ],
    [target_version_1.TargetVersion.V12]: [
        {
            pr: 'https://github.com/angular/components/pull/21876',
            changes: ['CdkTable', 'StickyStyler'],
        },
        {
            pr: 'https://github.com/angular/components/issues/21900',
            changes: ['CdkStepper'],
        },
    ],
    [target_version_1.TargetVersion.V11]: [
        {
            pr: 'https://github.com/angular/components/pull/20454',
            changes: ['ScrollDispatcher', 'ViewportRuler', 'CdkVirtualScrollViewport'],
        },
        {
            pr: 'https://github.com/angular/components/pull/20500',
            changes: ['CdkDropList'],
        },
        {
            pr: 'https://github.com/angular/components/pull/20572',
            changes: ['CdkTreeNodePadding'],
        },
        {
            pr: 'https://github.com/angular/components/pull/20511',
            changes: ['OverlayContainer', 'FullscreenOverlayContainer', 'OverlayRef', 'Overlay'],
        },
    ],
    [target_version_1.TargetVersion.V10]: [
        {
            pr: 'https://github.com/angular/components/pull/19347',
            changes: ['Platform'],
        },
    ],
    [target_version_1.TargetVersion.V9]: [
        {
            pr: 'https://github.com/angular/components/pull/17084',
            changes: ['DropListRef'],
        },
    ],
    [target_version_1.TargetVersion.V8]: [
        {
            pr: 'https://github.com/angular/components/pull/15647',
            changes: [
                'CdkDrag',
                'CdkDropList',
                'ConnectedPositionStrategy',
                'FlexibleConnectedPositionStrategy',
                'OverlayPositionBuilder',
                'CdkTable',
            ],
        },
    ],
    [target_version_1.TargetVersion.V7]: [],
    [target_version_1.TargetVersion.V6]: [],
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RydWN0b3ItY2hlY2tzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL25nLXVwZGF0ZS9kYXRhL2NvbnN0cnVjdG9yLWNoZWNrcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCxxRUFBK0Q7QUFLL0Q7Ozs7R0FJRztBQUNVLFFBQUEsaUJBQWlCLEdBQWlEO0lBQzdFLENBQUMsOEJBQWEsQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUNuQjtZQUNFLEVBQUUsRUFBRSxrREFBa0Q7WUFDdEQsT0FBTyxFQUFFLENBQUMsWUFBWSxDQUFDO1NBQ3hCO0tBQ0Y7SUFDRCxDQUFDLDhCQUFhLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDbkI7WUFDRSxFQUFFLEVBQUUsa0RBQWtEO1lBQ3RELE9BQU8sRUFBRSxDQUFDLFVBQVUsRUFBRSxjQUFjLENBQUM7U0FDdEM7UUFDRDtZQUNFLEVBQUUsRUFBRSxvREFBb0Q7WUFDeEQsT0FBTyxFQUFFLENBQUMsWUFBWSxDQUFDO1NBQ3hCO0tBQ0Y7SUFDRCxDQUFDLDhCQUFhLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDbkI7WUFDRSxFQUFFLEVBQUUsa0RBQWtEO1lBQ3RELE9BQU8sRUFBRSxDQUFDLGtCQUFrQixFQUFFLGVBQWUsRUFBRSwwQkFBMEIsQ0FBQztTQUMzRTtRQUNEO1lBQ0UsRUFBRSxFQUFFLGtEQUFrRDtZQUN0RCxPQUFPLEVBQUUsQ0FBQyxhQUFhLENBQUM7U0FDekI7UUFDRDtZQUNFLEVBQUUsRUFBRSxrREFBa0Q7WUFDdEQsT0FBTyxFQUFFLENBQUMsb0JBQW9CLENBQUM7U0FDaEM7UUFDRDtZQUNFLEVBQUUsRUFBRSxrREFBa0Q7WUFDdEQsT0FBTyxFQUFFLENBQUMsa0JBQWtCLEVBQUUsNEJBQTRCLEVBQUUsWUFBWSxFQUFFLFNBQVMsQ0FBQztTQUNyRjtLQUNGO0lBQ0QsQ0FBQyw4QkFBYSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQ25CO1lBQ0UsRUFBRSxFQUFFLGtEQUFrRDtZQUN0RCxPQUFPLEVBQUUsQ0FBQyxVQUFVLENBQUM7U0FDdEI7S0FDRjtJQUNELENBQUMsOEJBQWEsQ0FBQyxFQUFFLENBQUMsRUFBRTtRQUNsQjtZQUNFLEVBQUUsRUFBRSxrREFBa0Q7WUFDdEQsT0FBTyxFQUFFLENBQUMsYUFBYSxDQUFDO1NBQ3pCO0tBQ0Y7SUFDRCxDQUFDLDhCQUFhLENBQUMsRUFBRSxDQUFDLEVBQUU7UUFDbEI7WUFDRSxFQUFFLEVBQUUsa0RBQWtEO1lBQ3RELE9BQU8sRUFBRTtnQkFDUCxTQUFTO2dCQUNULGFBQWE7Z0JBQ2IsMkJBQTJCO2dCQUMzQixtQ0FBbUM7Z0JBQ25DLHdCQUF3QjtnQkFDeEIsVUFBVTthQUNYO1NBQ0Y7S0FDRjtJQUNELENBQUMsOEJBQWEsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0lBQ3RCLENBQUMsOEJBQWEsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0NBQ3ZCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUYXJnZXRWZXJzaW9ufSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC90YXJnZXQtdmVyc2lvbic7XG5pbXBvcnQge1ZlcnNpb25DaGFuZ2VzfSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC92ZXJzaW9uLWNoYW5nZXMnO1xuXG5leHBvcnQgdHlwZSBDb25zdHJ1Y3RvckNoZWNrc1VwZ3JhZGVEYXRhID0gc3RyaW5nO1xuXG4vKipcbiAqIExpc3Qgb2YgY2xhc3MgbmFtZXMgZm9yIHdoaWNoIHRoZSBjb25zdHJ1Y3RvciBzaWduYXR1cmUgaGFzIGJlZW4gY2hhbmdlZC4gVGhlIG5ldyBjb25zdHJ1Y3RvclxuICogc2lnbmF0dXJlIHR5cGVzIGRvbid0IG5lZWQgdG8gYmUgc3RvcmVkIGhlcmUgYmVjYXVzZSB0aGUgc2lnbmF0dXJlIHdpbGwgYmUgZGV0ZXJtaW5lZFxuICogYXV0b21hdGljYWxseSB0aHJvdWdoIHR5cGUgY2hlY2tpbmcuXG4gKi9cbmV4cG9ydCBjb25zdCBjb25zdHJ1Y3RvckNoZWNrczogVmVyc2lvbkNoYW5nZXM8Q29uc3RydWN0b3JDaGVja3NVcGdyYWRlRGF0YT4gPSB7XG4gIFtUYXJnZXRWZXJzaW9uLlYxM106IFtcbiAgICB7XG4gICAgICBwcjogJ2h0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2NvbXBvbmVudHMvcHVsbC8yMzMyOCcsXG4gICAgICBjaGFuZ2VzOiBbJ0Nka1N0ZXBwZXInXSxcbiAgICB9LFxuICBdLFxuICBbVGFyZ2V0VmVyc2lvbi5WMTJdOiBbXG4gICAge1xuICAgICAgcHI6ICdodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9jb21wb25lbnRzL3B1bGwvMjE4NzYnLFxuICAgICAgY2hhbmdlczogWydDZGtUYWJsZScsICdTdGlja3lTdHlsZXInXSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHByOiAnaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvY29tcG9uZW50cy9pc3N1ZXMvMjE5MDAnLFxuICAgICAgY2hhbmdlczogWydDZGtTdGVwcGVyJ10sXG4gICAgfSxcbiAgXSxcbiAgW1RhcmdldFZlcnNpb24uVjExXTogW1xuICAgIHtcbiAgICAgIHByOiAnaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvY29tcG9uZW50cy9wdWxsLzIwNDU0JyxcbiAgICAgIGNoYW5nZXM6IFsnU2Nyb2xsRGlzcGF0Y2hlcicsICdWaWV3cG9ydFJ1bGVyJywgJ0Nka1ZpcnR1YWxTY3JvbGxWaWV3cG9ydCddLFxuICAgIH0sXG4gICAge1xuICAgICAgcHI6ICdodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9jb21wb25lbnRzL3B1bGwvMjA1MDAnLFxuICAgICAgY2hhbmdlczogWydDZGtEcm9wTGlzdCddLFxuICAgIH0sXG4gICAge1xuICAgICAgcHI6ICdodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9jb21wb25lbnRzL3B1bGwvMjA1NzInLFxuICAgICAgY2hhbmdlczogWydDZGtUcmVlTm9kZVBhZGRpbmcnXSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHByOiAnaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvY29tcG9uZW50cy9wdWxsLzIwNTExJyxcbiAgICAgIGNoYW5nZXM6IFsnT3ZlcmxheUNvbnRhaW5lcicsICdGdWxsc2NyZWVuT3ZlcmxheUNvbnRhaW5lcicsICdPdmVybGF5UmVmJywgJ092ZXJsYXknXSxcbiAgICB9LFxuICBdLFxuICBbVGFyZ2V0VmVyc2lvbi5WMTBdOiBbXG4gICAge1xuICAgICAgcHI6ICdodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9jb21wb25lbnRzL3B1bGwvMTkzNDcnLFxuICAgICAgY2hhbmdlczogWydQbGF0Zm9ybSddLFxuICAgIH0sXG4gIF0sXG4gIFtUYXJnZXRWZXJzaW9uLlY5XTogW1xuICAgIHtcbiAgICAgIHByOiAnaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvY29tcG9uZW50cy9wdWxsLzE3MDg0JyxcbiAgICAgIGNoYW5nZXM6IFsnRHJvcExpc3RSZWYnXSxcbiAgICB9LFxuICBdLFxuICBbVGFyZ2V0VmVyc2lvbi5WOF06IFtcbiAgICB7XG4gICAgICBwcjogJ2h0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2NvbXBvbmVudHMvcHVsbC8xNTY0NycsXG4gICAgICBjaGFuZ2VzOiBbXG4gICAgICAgICdDZGtEcmFnJyxcbiAgICAgICAgJ0Nka0Ryb3BMaXN0JyxcbiAgICAgICAgJ0Nvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3knLFxuICAgICAgICAnRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5JyxcbiAgICAgICAgJ092ZXJsYXlQb3NpdGlvbkJ1aWxkZXInLFxuICAgICAgICAnQ2RrVGFibGUnLFxuICAgICAgXSxcbiAgICB9LFxuICBdLFxuICBbVGFyZ2V0VmVyc2lvbi5WN106IFtdLFxuICBbVGFyZ2V0VmVyc2lvbi5WNl06IFtdLFxufTtcbiJdfQ==