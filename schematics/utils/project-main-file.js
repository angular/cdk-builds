/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/cdk/schematics/utils/project-main-file", ["require", "exports", "@angular-devkit/schematics", "@angular/cdk/schematics/utils/project-targets"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const project_targets_1 = require("@angular/cdk/schematics/utils/project-targets");
    /** Looks for the main TypeScript file in the given project and returns its path. */
    function getProjectMainFile(project) {
        const buildOptions = project_targets_1.getProjectTargetOptions(project, 'build');
        if (!buildOptions.main) {
            throw new schematics_1.SchematicsException(`Could not find the project main file inside of the ` +
                `workspace config (${project.sourceRoot})`);
        }
        return buildOptions.main;
    }
    exports.getProjectMainFile = getProjectMainFile;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdC1tYWluLWZpbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXRpbHMvcHJvamVjdC1tYWluLWZpbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFJSCwyREFBK0Q7SUFDL0QsbUZBQTBEO0lBRTFELG9GQUFvRjtJQUNwRixTQUFnQixrQkFBa0IsQ0FBQyxPQUF5QjtRQUMxRCxNQUFNLFlBQVksR0FBRyx5Q0FBdUIsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFL0QsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUU7WUFDdEIsTUFBTSxJQUFJLGdDQUFtQixDQUFDLHFEQUFxRDtnQkFDL0UscUJBQXFCLE9BQU8sQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO1NBQ2pEO1FBRUQsT0FBTyxZQUFZLENBQUMsSUFBSSxDQUFDO0lBQzNCLENBQUM7SUFURCxnREFTQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1BhdGh9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7V29ya3NwYWNlUHJvamVjdH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUvc3JjL2V4cGVyaW1lbnRhbC93b3Jrc3BhY2UnO1xuaW1wb3J0IHtTY2hlbWF0aWNzRXhjZXB0aW9ufSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge2dldFByb2plY3RUYXJnZXRPcHRpb25zfSBmcm9tICcuL3Byb2plY3QtdGFyZ2V0cyc7XG5cbi8qKiBMb29rcyBmb3IgdGhlIG1haW4gVHlwZVNjcmlwdCBmaWxlIGluIHRoZSBnaXZlbiBwcm9qZWN0IGFuZCByZXR1cm5zIGl0cyBwYXRoLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFByb2plY3RNYWluRmlsZShwcm9qZWN0OiBXb3Jrc3BhY2VQcm9qZWN0KTogUGF0aCB7XG4gIGNvbnN0IGJ1aWxkT3B0aW9ucyA9IGdldFByb2plY3RUYXJnZXRPcHRpb25zKHByb2plY3QsICdidWlsZCcpO1xuXG4gIGlmICghYnVpbGRPcHRpb25zLm1haW4pIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgQ291bGQgbm90IGZpbmQgdGhlIHByb2plY3QgbWFpbiBmaWxlIGluc2lkZSBvZiB0aGUgYCArXG4gICAgICAgIGB3b3Jrc3BhY2UgY29uZmlnICgke3Byb2plY3Quc291cmNlUm9vdH0pYCk7XG4gIH1cblxuICByZXR1cm4gYnVpbGRPcHRpb25zLm1haW47XG59XG4iXX0=