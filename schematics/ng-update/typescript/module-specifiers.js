"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMaterialExportDeclaration = exports.isMaterialImportDeclaration = exports.cdkModuleSpecifier = exports.materialModuleSpecifier = void 0;
const imports_1 = require("../typescript/imports");
/** Name of the Angular Material module specifier. */
exports.materialModuleSpecifier = '@angular/material';
/** Name of the Angular CDK module specifier. */
exports.cdkModuleSpecifier = '@angular/cdk';
/** Whether the specified node is part of an Angular Material or CDK import declaration. */
function isMaterialImportDeclaration(node) {
    return isMaterialDeclaration((0, imports_1.getImportDeclaration)(node));
}
exports.isMaterialImportDeclaration = isMaterialImportDeclaration;
/** Whether the specified node is part of an Angular Material or CDK import declaration. */
function isMaterialExportDeclaration(node) {
    return isMaterialDeclaration((0, imports_1.getExportDeclaration)(node));
}
exports.isMaterialExportDeclaration = isMaterialExportDeclaration;
/** Whether the declaration is part of Angular Material. */
function isMaterialDeclaration(declaration) {
    if (!declaration.moduleSpecifier) {
        return false;
    }
    const moduleSpecifier = declaration.moduleSpecifier.getText();
    return moduleSpecifier.indexOf(exports.materialModuleSpecifier) !== -1 ||
        moduleSpecifier.indexOf(exports.cdkModuleSpecifier) !== -1;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kdWxlLXNwZWNpZmllcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctdXBkYXRlL3R5cGVzY3JpcHQvbW9kdWxlLXNwZWNpZmllcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBR0gsbURBQWlGO0FBRWpGLHFEQUFxRDtBQUN4QyxRQUFBLHVCQUF1QixHQUFHLG1CQUFtQixDQUFDO0FBRTNELGdEQUFnRDtBQUNuQyxRQUFBLGtCQUFrQixHQUFHLGNBQWMsQ0FBQztBQUVqRCwyRkFBMkY7QUFDM0YsU0FBZ0IsMkJBQTJCLENBQUMsSUFBYTtJQUN2RCxPQUFPLHFCQUFxQixDQUFDLElBQUEsOEJBQW9CLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUMzRCxDQUFDO0FBRkQsa0VBRUM7QUFFRCwyRkFBMkY7QUFDM0YsU0FBZ0IsMkJBQTJCLENBQUMsSUFBYTtJQUN2RCxPQUFPLHFCQUFxQixDQUFDLElBQUEsOEJBQW9CLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUMzRCxDQUFDO0FBRkQsa0VBRUM7QUFFRCwyREFBMkQ7QUFDM0QsU0FBUyxxQkFBcUIsQ0FBQyxXQUFzRDtJQUNuRixJQUFJLENBQUMsV0FBVyxDQUFDLGVBQWUsRUFBRTtRQUNoQyxPQUFPLEtBQUssQ0FBQztLQUNkO0lBRUQsTUFBTSxlQUFlLEdBQUcsV0FBVyxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUM5RCxPQUFPLGVBQWUsQ0FBQyxPQUFPLENBQUMsK0JBQXVCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUQsZUFBZSxDQUFDLE9BQU8sQ0FBQywwQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ3pELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge2dldEV4cG9ydERlY2xhcmF0aW9uLCBnZXRJbXBvcnREZWNsYXJhdGlvbn0gZnJvbSAnLi4vdHlwZXNjcmlwdC9pbXBvcnRzJztcblxuLyoqIE5hbWUgb2YgdGhlIEFuZ3VsYXIgTWF0ZXJpYWwgbW9kdWxlIHNwZWNpZmllci4gKi9cbmV4cG9ydCBjb25zdCBtYXRlcmlhbE1vZHVsZVNwZWNpZmllciA9ICdAYW5ndWxhci9tYXRlcmlhbCc7XG5cbi8qKiBOYW1lIG9mIHRoZSBBbmd1bGFyIENESyBtb2R1bGUgc3BlY2lmaWVyLiAqL1xuZXhwb3J0IGNvbnN0IGNka01vZHVsZVNwZWNpZmllciA9ICdAYW5ndWxhci9jZGsnO1xuXG4vKiogV2hldGhlciB0aGUgc3BlY2lmaWVkIG5vZGUgaXMgcGFydCBvZiBhbiBBbmd1bGFyIE1hdGVyaWFsIG9yIENESyBpbXBvcnQgZGVjbGFyYXRpb24uICovXG5leHBvcnQgZnVuY3Rpb24gaXNNYXRlcmlhbEltcG9ydERlY2xhcmF0aW9uKG5vZGU6IHRzLk5vZGUpIHtcbiAgcmV0dXJuIGlzTWF0ZXJpYWxEZWNsYXJhdGlvbihnZXRJbXBvcnREZWNsYXJhdGlvbihub2RlKSk7XG59XG5cbi8qKiBXaGV0aGVyIHRoZSBzcGVjaWZpZWQgbm9kZSBpcyBwYXJ0IG9mIGFuIEFuZ3VsYXIgTWF0ZXJpYWwgb3IgQ0RLIGltcG9ydCBkZWNsYXJhdGlvbi4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc01hdGVyaWFsRXhwb3J0RGVjbGFyYXRpb24obm9kZTogdHMuTm9kZSkge1xuICByZXR1cm4gaXNNYXRlcmlhbERlY2xhcmF0aW9uKGdldEV4cG9ydERlY2xhcmF0aW9uKG5vZGUpKTtcbn1cblxuLyoqIFdoZXRoZXIgdGhlIGRlY2xhcmF0aW9uIGlzIHBhcnQgb2YgQW5ndWxhciBNYXRlcmlhbC4gKi9cbmZ1bmN0aW9uIGlzTWF0ZXJpYWxEZWNsYXJhdGlvbihkZWNsYXJhdGlvbjogdHMuSW1wb3J0RGVjbGFyYXRpb258dHMuRXhwb3J0RGVjbGFyYXRpb24pIHtcbiAgaWYgKCFkZWNsYXJhdGlvbi5tb2R1bGVTcGVjaWZpZXIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBjb25zdCBtb2R1bGVTcGVjaWZpZXIgPSBkZWNsYXJhdGlvbi5tb2R1bGVTcGVjaWZpZXIuZ2V0VGV4dCgpO1xuICByZXR1cm4gbW9kdWxlU3BlY2lmaWVyLmluZGV4T2YobWF0ZXJpYWxNb2R1bGVTcGVjaWZpZXIpICE9PSAtMSB8fFxuICAgICAgbW9kdWxlU3BlY2lmaWVyLmluZGV4T2YoY2RrTW9kdWxlU3BlY2lmaWVyKSAhPT0gLTE7XG59XG4iXX0=