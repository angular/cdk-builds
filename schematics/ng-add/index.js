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
            // In order to align the CDK version with other Angular dependencies that are setup
            // by "@schematics/angular", we use tilde instead of caret. This is default for Angular
            // dependencies in new CLI projects.
            package_config_1.addPackageToPackageJson(host, '@angular/cdk', `~9.0.0-rc.9-sha-2fc488cfe`);
            // Add a task to run the package manager. This is necessary because we updated the
            // workspace "package.json" file and we want lock files to reflect the new version range.
            context.addTask(new tasks_1.NodePackageInstallTask());
        };
    }
    exports.default = default_1;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctYWRkL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBR0gsNERBQXdFO0lBQ3hFLGtGQUF5RDtJQUV6RDs7Ozs7OztPQU9HO0lBQ0g7UUFDRSxPQUFPLENBQUMsSUFBVSxFQUFFLE9BQXlCLEVBQUUsRUFBRTtZQUMvQyxtRkFBbUY7WUFDbkYsdUZBQXVGO1lBQ3ZGLG9DQUFvQztZQUNwQyx3Q0FBdUIsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFLG9CQUFvQixDQUFDLENBQUM7WUFFcEUsa0ZBQWtGO1lBQ2xGLHlGQUF5RjtZQUN6RixPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksOEJBQXNCLEVBQUUsQ0FBQyxDQUFDO1FBQ2hELENBQUMsQ0FBQztJQUNKLENBQUM7SUFYRCw0QkFXQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1J1bGUsIFNjaGVtYXRpY0NvbnRleHQsIFRyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7Tm9kZVBhY2thZ2VJbnN0YWxsVGFza30gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MvdGFza3MnO1xuaW1wb3J0IHthZGRQYWNrYWdlVG9QYWNrYWdlSnNvbn0gZnJvbSAnLi9wYWNrYWdlLWNvbmZpZyc7XG5cbi8qKlxuICogU2NoZW1hdGljIGZhY3RvcnkgZW50cnktcG9pbnQgZm9yIHRoZSBgbmctYWRkYCBzY2hlbWF0aWMuIFRoZSBuZy1hZGQgc2NoZW1hdGljIHdpbGwgYmVcbiAqIGF1dG9tYXRpY2FsbHkgZXhlY3V0ZWQgaWYgZGV2ZWxvcGVycyBydW4gYG5nIGFkZCBAYW5ndWxhci9jZGtgLlxuICpcbiAqIEJ5IGRlZmF1bHQsIHRoZSBDTEkgYWxyZWFkeSBpbnN0YWxscyB0aGUgcGFja2FnZSB0aGF0IGhhcyBiZWVuIHNwZWNpZmllZCB3aXRoIGBuZyBhZGRgLlxuICogV2UganVzdCBzdG9yZSB0aGUgdmVyc2lvbiBpbiB0aGUgYHBhY2thZ2UuanNvbmAgaW4gY2FzZSB0aGUgcGFja2FnZSBtYW5hZ2VyIGRpZG4ndC4gQWxzb1xuICogdGhpcyBlbnN1cmVzIHRoYXQgdGhlcmUgd2lsbCBiZSBubyBlcnJvciB0aGF0IHNheXMgdGhhdCB0aGUgQ0RLIGRvZXMgbm90IHN1cHBvcnQgYG5nIGFkZGAuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCk6IFJ1bGUge1xuICByZXR1cm4gKGhvc3Q6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICAvLyBJbiBvcmRlciB0byBhbGlnbiB0aGUgQ0RLIHZlcnNpb24gd2l0aCBvdGhlciBBbmd1bGFyIGRlcGVuZGVuY2llcyB0aGF0IGFyZSBzZXR1cFxuICAgIC8vIGJ5IFwiQHNjaGVtYXRpY3MvYW5ndWxhclwiLCB3ZSB1c2UgdGlsZGUgaW5zdGVhZCBvZiBjYXJldC4gVGhpcyBpcyBkZWZhdWx0IGZvciBBbmd1bGFyXG4gICAgLy8gZGVwZW5kZW5jaWVzIGluIG5ldyBDTEkgcHJvamVjdHMuXG4gICAgYWRkUGFja2FnZVRvUGFja2FnZUpzb24oaG9zdCwgJ0Bhbmd1bGFyL2NkaycsIGB+MC4wLjAtUExBQ0VIT0xERVJgKTtcblxuICAgIC8vIEFkZCBhIHRhc2sgdG8gcnVuIHRoZSBwYWNrYWdlIG1hbmFnZXIuIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2Ugd2UgdXBkYXRlZCB0aGVcbiAgICAvLyB3b3Jrc3BhY2UgXCJwYWNrYWdlLmpzb25cIiBmaWxlIGFuZCB3ZSB3YW50IGxvY2sgZmlsZXMgdG8gcmVmbGVjdCB0aGUgbmV3IHZlcnNpb24gcmFuZ2UuXG4gICAgY29udGV4dC5hZGRUYXNrKG5ldyBOb2RlUGFja2FnZUluc3RhbGxUYXNrKCkpO1xuICB9O1xufVxuIl19