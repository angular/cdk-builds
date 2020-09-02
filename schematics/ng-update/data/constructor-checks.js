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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RydWN0b3ItY2hlY2tzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL25nLXVwZGF0ZS9kYXRhL2NvbnN0cnVjdG9yLWNoZWNrcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCxxRUFBK0Q7QUFLL0Q7Ozs7R0FJRztBQUNVLFFBQUEsaUJBQWlCLEdBQWlEO0lBQzdFLENBQUMsOEJBQWEsQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUNuQjtZQUNFLEVBQUUsRUFBRSxrREFBa0Q7WUFDdEQsT0FBTyxFQUFFLENBQUMsa0JBQWtCLEVBQUUsZUFBZSxFQUFFLDBCQUEwQixDQUFDO1NBQzNFO0tBQ0Y7SUFDRCxDQUFDLDhCQUFhLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDbkI7WUFDRSxFQUFFLEVBQUUsa0RBQWtEO1lBQ3RELE9BQU8sRUFBRSxDQUFDLFVBQVUsQ0FBQztTQUN0QjtLQUNGO0lBQ0QsQ0FBQyw4QkFBYSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDbkIsRUFBRSxFQUFFLGtEQUFrRDtZQUN0RCxPQUFPLEVBQUUsQ0FBQyxhQUFhLENBQUM7U0FDekIsQ0FBQztJQUNGLENBQUMsOEJBQWEsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQ25CLEVBQUUsRUFBRSxrREFBa0Q7WUFDdEQsT0FBTyxFQUFFO2dCQUNQLFNBQVMsRUFBRSxhQUFhLEVBQUUsMkJBQTJCLEVBQUUsbUNBQW1DO2dCQUMxRix3QkFBd0IsRUFBRSxVQUFVO2FBQ3JDO1NBQ0YsQ0FBQztJQUNGLENBQUMsOEJBQWEsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0lBQ3RCLENBQUMsOEJBQWEsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0NBQ3ZCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUYXJnZXRWZXJzaW9ufSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC90YXJnZXQtdmVyc2lvbic7XG5pbXBvcnQge1ZlcnNpb25DaGFuZ2VzfSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC92ZXJzaW9uLWNoYW5nZXMnO1xuXG5leHBvcnQgdHlwZSBDb25zdHJ1Y3RvckNoZWNrc1VwZ3JhZGVEYXRhID0gc3RyaW5nO1xuXG4vKipcbiAqIExpc3Qgb2YgY2xhc3MgbmFtZXMgZm9yIHdoaWNoIHRoZSBjb25zdHJ1Y3RvciBzaWduYXR1cmUgaGFzIGJlZW4gY2hhbmdlZC4gVGhlIG5ldyBjb25zdHJ1Y3RvclxuICogc2lnbmF0dXJlIHR5cGVzIGRvbid0IG5lZWQgdG8gYmUgc3RvcmVkIGhlcmUgYmVjYXVzZSB0aGUgc2lnbmF0dXJlIHdpbGwgYmUgZGV0ZXJtaW5lZFxuICogYXV0b21hdGljYWxseSB0aHJvdWdoIHR5cGUgY2hlY2tpbmcuXG4gKi9cbmV4cG9ydCBjb25zdCBjb25zdHJ1Y3RvckNoZWNrczogVmVyc2lvbkNoYW5nZXM8Q29uc3RydWN0b3JDaGVja3NVcGdyYWRlRGF0YT4gPSB7XG4gIFtUYXJnZXRWZXJzaW9uLlYxMV06IFtcbiAgICB7XG4gICAgICBwcjogJ2h0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2NvbXBvbmVudHMvcHVsbC8yMDQ1NCcsXG4gICAgICBjaGFuZ2VzOiBbJ1Njcm9sbERpc3BhdGNoZXInLCAnVmlld3BvcnRSdWxlcicsICdDZGtWaXJ0dWFsU2Nyb2xsVmlld3BvcnQnXVxuICAgIH1cbiAgXSxcbiAgW1RhcmdldFZlcnNpb24uVjEwXTogW1xuICAgIHtcbiAgICAgIHByOiAnaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvY29tcG9uZW50cy9wdWxsLzE5MzQ3JyxcbiAgICAgIGNoYW5nZXM6IFsnUGxhdGZvcm0nXVxuICAgIH1cbiAgXSxcbiAgW1RhcmdldFZlcnNpb24uVjldOiBbe1xuICAgIHByOiAnaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvY29tcG9uZW50cy9wdWxsLzE3MDg0JyxcbiAgICBjaGFuZ2VzOiBbJ0Ryb3BMaXN0UmVmJ11cbiAgfV0sXG4gIFtUYXJnZXRWZXJzaW9uLlY4XTogW3tcbiAgICBwcjogJ2h0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2NvbXBvbmVudHMvcHVsbC8xNTY0NycsXG4gICAgY2hhbmdlczogW1xuICAgICAgJ0Nka0RyYWcnLCAnQ2RrRHJvcExpc3QnLCAnQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneScsICdGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3knLFxuICAgICAgJ092ZXJsYXlQb3NpdGlvbkJ1aWxkZXInLCAnQ2RrVGFibGUnXG4gICAgXVxuICB9XSxcbiAgW1RhcmdldFZlcnNpb24uVjddOiBbXSxcbiAgW1RhcmdldFZlcnNpb24uVjZdOiBbXVxufTtcbiJdfQ==