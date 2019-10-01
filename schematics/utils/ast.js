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
        define("@angular/cdk/schematics/utils/ast", ["require", "exports", "@angular-devkit/schematics", "@schematics/angular/utility/ast-utils", "@schematics/angular/utility/change", "@schematics/angular/utility/config", "@schematics/angular/utility/find-module", "@schematics/angular/utility/ng-ast-utils", "@angular/cdk/schematics/utils/project-main-file", "@angular/cdk/schematics/utils/version-agnostic-typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const ast_utils_1 = require("@schematics/angular/utility/ast-utils");
    const change_1 = require("@schematics/angular/utility/change");
    const config_1 = require("@schematics/angular/utility/config");
    const find_module_1 = require("@schematics/angular/utility/find-module");
    const ng_ast_utils_1 = require("@schematics/angular/utility/ng-ast-utils");
    const project_main_file_1 = require("@angular/cdk/schematics/utils/project-main-file");
    const version_agnostic_typescript_1 = require("@angular/cdk/schematics/utils/version-agnostic-typescript");
    /** Reads file given path and returns TypeScript source file. */
    function getSourceFile(host, path) {
        const buffer = host.read(path);
        if (!buffer) {
            throw new schematics_1.SchematicsException(`Could not find file for path: ${path}`);
        }
        return version_agnostic_typescript_1.ts.createSourceFile(path, buffer.toString(), version_agnostic_typescript_1.ts.ScriptTarget.Latest, true);
    }
    exports.getSourceFile = getSourceFile;
    /** Import and add module to root app module. */
    function addModuleImportToRootModule(host, moduleName, src, project) {
        const modulePath = ng_ast_utils_1.getAppModulePath(host, project_main_file_1.getProjectMainFile(project));
        addModuleImportToModule(host, modulePath, moduleName, src);
    }
    exports.addModuleImportToRootModule = addModuleImportToRootModule;
    /**
     * Import and add module to specific module path.
     * @param host the tree we are updating
     * @param modulePath src location of the module to import
     * @param moduleName name of module to import
     * @param src src location to import
     */
    function addModuleImportToModule(host, modulePath, moduleName, src) {
        const moduleSource = getSourceFile(host, modulePath);
        if (!moduleSource) {
            throw new schematics_1.SchematicsException(`Module not found: ${modulePath}`);
        }
        const changes = ast_utils_1.addImportToModule(moduleSource, modulePath, moduleName, src);
        const recorder = host.beginUpdate(modulePath);
        changes.forEach((change) => {
            if (change instanceof change_1.InsertChange) {
                recorder.insertLeft(change.pos, change.toAdd);
            }
        });
        host.commitUpdate(recorder);
    }
    exports.addModuleImportToModule = addModuleImportToModule;
    /** Wraps the internal find module from options with undefined path handling  */
    function findModuleFromOptions(host, options) {
        const workspace = config_1.getWorkspace(host);
        if (!options.project) {
            options.project = Object.keys(workspace.projects)[0];
        }
        const project = workspace.projects[options.project];
        if (options.path === undefined) {
            options.path = `/${project.root}/src/app`;
        }
        return find_module_1.findModuleFromOptions(host, options);
    }
    exports.findModuleFromOptions = findModuleFromOptions;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL3V0aWxzL2FzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUdILDJEQUFxRTtJQUVyRSxxRUFBd0U7SUFDeEUsK0RBQWdFO0lBQ2hFLCtEQUFnRTtJQUNoRSx5RUFBb0c7SUFDcEcsMkVBQTBFO0lBQzFFLHVGQUF1RDtJQUN2RCwyR0FBNkQ7SUFHN0QsZ0VBQWdFO0lBQ2hFLFNBQWdCLGFBQWEsQ0FBQyxJQUFVLEVBQUUsSUFBWTtRQUNwRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDWCxNQUFNLElBQUksZ0NBQW1CLENBQUMsaUNBQWlDLElBQUksRUFBRSxDQUFDLENBQUM7U0FDeEU7UUFDRCxPQUFPLGdDQUFFLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxnQ0FBRSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDcEYsQ0FBQztJQU5ELHNDQU1DO0lBRUQsZ0RBQWdEO0lBQ2hELFNBQWdCLDJCQUEyQixDQUFDLElBQVUsRUFBRSxVQUFrQixFQUFFLEdBQVcsRUFDM0MsT0FBeUI7UUFDbkUsTUFBTSxVQUFVLEdBQUcsK0JBQWdCLENBQUMsSUFBSSxFQUFFLHNDQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDdkUsdUJBQXVCLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDN0QsQ0FBQztJQUpELGtFQUlDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsU0FBZ0IsdUJBQXVCLENBQUMsSUFBVSxFQUFFLFVBQWtCLEVBQUUsVUFBa0IsRUFDbEQsR0FBVztRQUVqRCxNQUFNLFlBQVksR0FBRyxhQUFhLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBRXJELElBQUksQ0FBQyxZQUFZLEVBQUU7WUFDakIsTUFBTSxJQUFJLGdDQUFtQixDQUFDLHFCQUFxQixVQUFVLEVBQUUsQ0FBQyxDQUFDO1NBQ2xFO1FBRUQsTUFBTSxPQUFPLEdBQUcsNkJBQWlCLENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDN0UsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUU5QyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDekIsSUFBSSxNQUFNLFlBQVkscUJBQVksRUFBRTtnQkFDbEMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUMvQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBbkJELDBEQW1CQztJQUVELGdGQUFnRjtJQUNoRixTQUFnQixxQkFBcUIsQ0FBQyxJQUFVLEVBQUUsT0FBeUI7UUFDekUsTUFBTSxTQUFTLEdBQUcscUJBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVyQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTtZQUNwQixPQUFPLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3REO1FBRUQsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFcEQsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBRTtZQUM5QixPQUFPLENBQUMsSUFBSSxHQUFHLElBQUksT0FBTyxDQUFDLElBQUksVUFBVSxDQUFDO1NBQzNDO1FBRUQsT0FBTyxtQ0FBa0IsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQWRELHNEQWNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7V29ya3NwYWNlUHJvamVjdH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUvc3JjL2V4cGVyaW1lbnRhbC93b3Jrc3BhY2UnO1xuaW1wb3J0IHtTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge1NjaGVtYSBhcyBDb21wb25lbnRPcHRpb25zfSBmcm9tICdAc2NoZW1hdGljcy9hbmd1bGFyL2NvbXBvbmVudC9zY2hlbWEnO1xuaW1wb3J0IHthZGRJbXBvcnRUb01vZHVsZX0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L2FzdC11dGlscyc7XG5pbXBvcnQge0luc2VydENoYW5nZX0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L2NoYW5nZSc7XG5pbXBvcnQge2dldFdvcmtzcGFjZX0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L2NvbmZpZyc7XG5pbXBvcnQge2ZpbmRNb2R1bGVGcm9tT3B0aW9ucyBhcyBpbnRlcm5hbEZpbmRNb2R1bGV9IGZyb20gJ0BzY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eS9maW5kLW1vZHVsZSc7XG5pbXBvcnQge2dldEFwcE1vZHVsZVBhdGh9IGZyb20gJ0BzY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eS9uZy1hc3QtdXRpbHMnO1xuaW1wb3J0IHtnZXRQcm9qZWN0TWFpbkZpbGV9IGZyb20gJy4vcHJvamVjdC1tYWluLWZpbGUnO1xuaW1wb3J0IHt0cywgdHlwZXNjcmlwdH0gZnJvbSAnLi92ZXJzaW9uLWFnbm9zdGljLXR5cGVzY3JpcHQnO1xuXG5cbi8qKiBSZWFkcyBmaWxlIGdpdmVuIHBhdGggYW5kIHJldHVybnMgVHlwZVNjcmlwdCBzb3VyY2UgZmlsZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTb3VyY2VGaWxlKGhvc3Q6IFRyZWUsIHBhdGg6IHN0cmluZyk6IHR5cGVzY3JpcHQuU291cmNlRmlsZSB7XG4gIGNvbnN0IGJ1ZmZlciA9IGhvc3QucmVhZChwYXRoKTtcbiAgaWYgKCFidWZmZXIpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgQ291bGQgbm90IGZpbmQgZmlsZSBmb3IgcGF0aDogJHtwYXRofWApO1xuICB9XG4gIHJldHVybiB0cy5jcmVhdGVTb3VyY2VGaWxlKHBhdGgsIGJ1ZmZlci50b1N0cmluZygpLCB0cy5TY3JpcHRUYXJnZXQuTGF0ZXN0LCB0cnVlKTtcbn1cblxuLyoqIEltcG9ydCBhbmQgYWRkIG1vZHVsZSB0byByb290IGFwcCBtb2R1bGUuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkTW9kdWxlSW1wb3J0VG9Sb290TW9kdWxlKGhvc3Q6IFRyZWUsIG1vZHVsZU5hbWU6IHN0cmluZywgc3JjOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2plY3Q6IFdvcmtzcGFjZVByb2plY3QpIHtcbiAgY29uc3QgbW9kdWxlUGF0aCA9IGdldEFwcE1vZHVsZVBhdGgoaG9zdCwgZ2V0UHJvamVjdE1haW5GaWxlKHByb2plY3QpKTtcbiAgYWRkTW9kdWxlSW1wb3J0VG9Nb2R1bGUoaG9zdCwgbW9kdWxlUGF0aCwgbW9kdWxlTmFtZSwgc3JjKTtcbn1cblxuLyoqXG4gKiBJbXBvcnQgYW5kIGFkZCBtb2R1bGUgdG8gc3BlY2lmaWMgbW9kdWxlIHBhdGguXG4gKiBAcGFyYW0gaG9zdCB0aGUgdHJlZSB3ZSBhcmUgdXBkYXRpbmdcbiAqIEBwYXJhbSBtb2R1bGVQYXRoIHNyYyBsb2NhdGlvbiBvZiB0aGUgbW9kdWxlIHRvIGltcG9ydFxuICogQHBhcmFtIG1vZHVsZU5hbWUgbmFtZSBvZiBtb2R1bGUgdG8gaW1wb3J0XG4gKiBAcGFyYW0gc3JjIHNyYyBsb2NhdGlvbiB0byBpbXBvcnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZE1vZHVsZUltcG9ydFRvTW9kdWxlKGhvc3Q6IFRyZWUsIG1vZHVsZVBhdGg6IHN0cmluZywgbW9kdWxlTmFtZTogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogc3RyaW5nKSB7XG5cbiAgY29uc3QgbW9kdWxlU291cmNlID0gZ2V0U291cmNlRmlsZShob3N0LCBtb2R1bGVQYXRoKTtcblxuICBpZiAoIW1vZHVsZVNvdXJjZSkge1xuICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKGBNb2R1bGUgbm90IGZvdW5kOiAke21vZHVsZVBhdGh9YCk7XG4gIH1cblxuICBjb25zdCBjaGFuZ2VzID0gYWRkSW1wb3J0VG9Nb2R1bGUobW9kdWxlU291cmNlLCBtb2R1bGVQYXRoLCBtb2R1bGVOYW1lLCBzcmMpO1xuICBjb25zdCByZWNvcmRlciA9IGhvc3QuYmVnaW5VcGRhdGUobW9kdWxlUGF0aCk7XG5cbiAgY2hhbmdlcy5mb3JFYWNoKChjaGFuZ2UpID0+IHtcbiAgICBpZiAoY2hhbmdlIGluc3RhbmNlb2YgSW5zZXJ0Q2hhbmdlKSB7XG4gICAgICByZWNvcmRlci5pbnNlcnRMZWZ0KGNoYW5nZS5wb3MsIGNoYW5nZS50b0FkZCk7XG4gICAgfVxuICB9KTtcblxuICBob3N0LmNvbW1pdFVwZGF0ZShyZWNvcmRlcik7XG59XG5cbi8qKiBXcmFwcyB0aGUgaW50ZXJuYWwgZmluZCBtb2R1bGUgZnJvbSBvcHRpb25zIHdpdGggdW5kZWZpbmVkIHBhdGggaGFuZGxpbmcgICovXG5leHBvcnQgZnVuY3Rpb24gZmluZE1vZHVsZUZyb21PcHRpb25zKGhvc3Q6IFRyZWUsIG9wdGlvbnM6IENvbXBvbmVudE9wdGlvbnMpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICBjb25zdCB3b3Jrc3BhY2UgPSBnZXRXb3Jrc3BhY2UoaG9zdCk7XG5cbiAgaWYgKCFvcHRpb25zLnByb2plY3QpIHtcbiAgICBvcHRpb25zLnByb2plY3QgPSBPYmplY3Qua2V5cyh3b3Jrc3BhY2UucHJvamVjdHMpWzBdO1xuICB9XG5cbiAgY29uc3QgcHJvamVjdCA9IHdvcmtzcGFjZS5wcm9qZWN0c1tvcHRpb25zLnByb2plY3RdO1xuXG4gIGlmIChvcHRpb25zLnBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgIG9wdGlvbnMucGF0aCA9IGAvJHtwcm9qZWN0LnJvb3R9L3NyYy9hcHBgO1xuICB9XG5cbiAgcmV0dXJuIGludGVybmFsRmluZE1vZHVsZShob3N0LCBvcHRpb25zKTtcbn1cbiJdfQ==