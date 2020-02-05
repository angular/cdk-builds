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
        define("@angular/cdk/schematics/ng-add/index", ["require", "exports", "@angular-devkit/schematics/tasks", "@angular/cdk/schematics/ng-add/package-config"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const tasks_1 = require("@angular-devkit/schematics/tasks");
    const package_config_1 = require("@angular/cdk/schematics/ng-add/package-config");
    /** Name of the Angular CDK version that is shipped together with the schematics. */
    exports.cdkVersion = loadPackageVersionGracefully('@angular/cdk');
    /**
     * Schematic factory entry-point for the `ng-add` schematic. The ng-add schematic will be
     * automatically executed if developers run `ng add @angular/cdk`.
     *
     * By default, the CLI already installs the package that has been specified with `ng add`.
     * We just store the version in the `package.json` in case the package manager didn't. Also
     * this ensures that there will be no error that says that the CDK does not support `ng add`.
     */
    function default_1() {
        return (host, context) => {
            // The CLI inserts `@angular/cdk` into the `package.json` before this schematic runs. This
            // means that we do not need to insert the CDK into `package.json` files again. In some cases
            // though, it could happen that this schematic runs outside of the CLI `ng add` command, or
            // the CDK is only listed as a dev dependency. If that is the case, we insert a version based
            // on the current build version (substituted version placeholder).
            if (package_config_1.getPackageVersionFromPackageJson(host, '@angular/cdk') === null) {
                // In order to align the CDK version with other Angular dependencies that are setup by
                // `@schematics/angular`, we use tilde instead of caret. This is default for Angular
                // dependencies in new CLI projects.
                package_config_1.addPackageToPackageJson(host, '@angular/cdk', `~9.0.0-rc.9-sha-1001b70ec`);
                // Add a task to run the package manager. This is necessary because we updated the
                // workspace "package.json" file and we want lock files to reflect the new version range.
                context.addTask(new tasks_1.NodePackageInstallTask());
            }
        };
    }
    exports.default = default_1;
    /** Loads the full version from the given Angular package gracefully. */
    function loadPackageVersionGracefully(packageName) {
        try {
            return require(`${packageName}/package.json`).version;
        }
        catch (_a) {
            return null;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctYWRkL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBR0gsNERBQXdFO0lBQ3hFLGtGQUEyRjtJQUUzRixvRkFBb0Y7SUFDdkUsUUFBQSxVQUFVLEdBQUcsNEJBQTRCLENBQUMsY0FBYyxDQUFDLENBQUM7SUFFdkU7Ozs7Ozs7T0FPRztJQUNIO1FBQ0UsT0FBTyxDQUFDLElBQVUsRUFBRSxPQUF5QixFQUFFLEVBQUU7WUFDL0MsMEZBQTBGO1lBQzFGLDZGQUE2RjtZQUM3RiwyRkFBMkY7WUFDM0YsNkZBQTZGO1lBQzdGLGtFQUFrRTtZQUNsRSxJQUFJLGlEQUFnQyxDQUFDLElBQUksRUFBRSxjQUFjLENBQUMsS0FBSyxJQUFJLEVBQUU7Z0JBQ25FLHNGQUFzRjtnQkFDdEYsb0ZBQW9GO2dCQUNwRixvQ0FBb0M7Z0JBQ3BDLHdDQUF1QixDQUFDLElBQUksRUFBRSxjQUFjLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztnQkFFcEUsa0ZBQWtGO2dCQUNsRix5RkFBeUY7Z0JBQ3pGLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSw4QkFBc0IsRUFBRSxDQUFDLENBQUM7YUFDL0M7UUFDSCxDQUFDLENBQUM7SUFDSixDQUFDO0lBbEJELDRCQWtCQztJQUVELHdFQUF3RTtJQUN4RSxTQUFTLDRCQUE0QixDQUFDLFdBQW1CO1FBQ3ZELElBQUk7WUFDRixPQUFPLE9BQU8sQ0FBQyxHQUFHLFdBQVcsZUFBZSxDQUFDLENBQUMsT0FBTyxDQUFDO1NBQ3ZEO1FBQUMsV0FBTTtZQUNOLE9BQU8sSUFBSSxDQUFDO1NBQ2I7SUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UnVsZSwgU2NoZW1hdGljQ29udGV4dCwgVHJlZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtOb2RlUGFja2FnZUluc3RhbGxUYXNrfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcy90YXNrcyc7XG5pbXBvcnQge2FkZFBhY2thZ2VUb1BhY2thZ2VKc29uLCBnZXRQYWNrYWdlVmVyc2lvbkZyb21QYWNrYWdlSnNvbn0gZnJvbSAnLi9wYWNrYWdlLWNvbmZpZyc7XG5cbi8qKiBOYW1lIG9mIHRoZSBBbmd1bGFyIENESyB2ZXJzaW9uIHRoYXQgaXMgc2hpcHBlZCB0b2dldGhlciB3aXRoIHRoZSBzY2hlbWF0aWNzLiAqL1xuZXhwb3J0IGNvbnN0IGNka1ZlcnNpb24gPSBsb2FkUGFja2FnZVZlcnNpb25HcmFjZWZ1bGx5KCdAYW5ndWxhci9jZGsnKTtcblxuLyoqXG4gKiBTY2hlbWF0aWMgZmFjdG9yeSBlbnRyeS1wb2ludCBmb3IgdGhlIGBuZy1hZGRgIHNjaGVtYXRpYy4gVGhlIG5nLWFkZCBzY2hlbWF0aWMgd2lsbCBiZVxuICogYXV0b21hdGljYWxseSBleGVjdXRlZCBpZiBkZXZlbG9wZXJzIHJ1biBgbmcgYWRkIEBhbmd1bGFyL2Nka2AuXG4gKlxuICogQnkgZGVmYXVsdCwgdGhlIENMSSBhbHJlYWR5IGluc3RhbGxzIHRoZSBwYWNrYWdlIHRoYXQgaGFzIGJlZW4gc3BlY2lmaWVkIHdpdGggYG5nIGFkZGAuXG4gKiBXZSBqdXN0IHN0b3JlIHRoZSB2ZXJzaW9uIGluIHRoZSBgcGFja2FnZS5qc29uYCBpbiBjYXNlIHRoZSBwYWNrYWdlIG1hbmFnZXIgZGlkbid0LiBBbHNvXG4gKiB0aGlzIGVuc3VyZXMgdGhhdCB0aGVyZSB3aWxsIGJlIG5vIGVycm9yIHRoYXQgc2F5cyB0aGF0IHRoZSBDREsgZG9lcyBub3Qgc3VwcG9ydCBgbmcgYWRkYC5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKTogUnVsZSB7XG4gIHJldHVybiAoaG9zdDogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIC8vIFRoZSBDTEkgaW5zZXJ0cyBgQGFuZ3VsYXIvY2RrYCBpbnRvIHRoZSBgcGFja2FnZS5qc29uYCBiZWZvcmUgdGhpcyBzY2hlbWF0aWMgcnVucy4gVGhpc1xuICAgIC8vIG1lYW5zIHRoYXQgd2UgZG8gbm90IG5lZWQgdG8gaW5zZXJ0IHRoZSBDREsgaW50byBgcGFja2FnZS5qc29uYCBmaWxlcyBhZ2Fpbi4gSW4gc29tZSBjYXNlc1xuICAgIC8vIHRob3VnaCwgaXQgY291bGQgaGFwcGVuIHRoYXQgdGhpcyBzY2hlbWF0aWMgcnVucyBvdXRzaWRlIG9mIHRoZSBDTEkgYG5nIGFkZGAgY29tbWFuZCwgb3JcbiAgICAvLyB0aGUgQ0RLIGlzIG9ubHkgbGlzdGVkIGFzIGEgZGV2IGRlcGVuZGVuY3kuIElmIHRoYXQgaXMgdGhlIGNhc2UsIHdlIGluc2VydCBhIHZlcnNpb24gYmFzZWRcbiAgICAvLyBvbiB0aGUgY3VycmVudCBidWlsZCB2ZXJzaW9uIChzdWJzdGl0dXRlZCB2ZXJzaW9uIHBsYWNlaG9sZGVyKS5cbiAgICBpZiAoZ2V0UGFja2FnZVZlcnNpb25Gcm9tUGFja2FnZUpzb24oaG9zdCwgJ0Bhbmd1bGFyL2NkaycpID09PSBudWxsKSB7XG4gICAgICAvLyBJbiBvcmRlciB0byBhbGlnbiB0aGUgQ0RLIHZlcnNpb24gd2l0aCBvdGhlciBBbmd1bGFyIGRlcGVuZGVuY2llcyB0aGF0IGFyZSBzZXR1cCBieVxuICAgICAgLy8gYEBzY2hlbWF0aWNzL2FuZ3VsYXJgLCB3ZSB1c2UgdGlsZGUgaW5zdGVhZCBvZiBjYXJldC4gVGhpcyBpcyBkZWZhdWx0IGZvciBBbmd1bGFyXG4gICAgICAvLyBkZXBlbmRlbmNpZXMgaW4gbmV3IENMSSBwcm9qZWN0cy5cbiAgICAgIGFkZFBhY2thZ2VUb1BhY2thZ2VKc29uKGhvc3QsICdAYW5ndWxhci9jZGsnLCBgfjAuMC4wLVBMQUNFSE9MREVSYCk7XG5cbiAgICAgIC8vIEFkZCBhIHRhc2sgdG8gcnVuIHRoZSBwYWNrYWdlIG1hbmFnZXIuIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2Ugd2UgdXBkYXRlZCB0aGVcbiAgICAgIC8vIHdvcmtzcGFjZSBcInBhY2thZ2UuanNvblwiIGZpbGUgYW5kIHdlIHdhbnQgbG9jayBmaWxlcyB0byByZWZsZWN0IHRoZSBuZXcgdmVyc2lvbiByYW5nZS5cbiAgICAgIGNvbnRleHQuYWRkVGFzayhuZXcgTm9kZVBhY2thZ2VJbnN0YWxsVGFzaygpKTtcbiAgICB9XG4gIH07XG59XG5cbi8qKiBMb2FkcyB0aGUgZnVsbCB2ZXJzaW9uIGZyb20gdGhlIGdpdmVuIEFuZ3VsYXIgcGFja2FnZSBncmFjZWZ1bGx5LiAqL1xuZnVuY3Rpb24gbG9hZFBhY2thZ2VWZXJzaW9uR3JhY2VmdWxseShwYWNrYWdlTmFtZTogc3RyaW5nKTogc3RyaW5nfG51bGwge1xuICB0cnkge1xuICAgIHJldHVybiByZXF1aXJlKGAke3BhY2thZ2VOYW1lfS9wYWNrYWdlLmpzb25gKS52ZXJzaW9uO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuIl19