"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const tasks_1 = require("@angular-devkit/schematics/tasks");
const package_config_1 = require("./package-config");
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
        if ((0, package_config_1.getPackageVersionFromPackageJson)(host, '@angular/cdk') === null) {
            // In order to align the CDK version with other Angular dependencies that are setup by
            // `@schematics/angular`, we use tilde instead of caret. This is default for Angular
            // dependencies in new CLI projects.
            (0, package_config_1.addPackageToPackageJson)(host, '@angular/cdk', `~19.0.1`);
            // Add a task to run the package manager. This is necessary because we updated the
            // workspace "package.json" file and we want lock files to reflect the new version range.
            context.addTask(new tasks_1.NodePackageInstallTask());
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctYWRkL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBY0gsNEJBa0JDO0FBN0JELDREQUF3RTtBQUN4RSxxREFBMkY7QUFFM0Y7Ozs7Ozs7R0FPRztBQUNIO0lBQ0UsT0FBTyxDQUFDLElBQVUsRUFBRSxPQUF5QixFQUFFLEVBQUU7UUFDL0MsMEZBQTBGO1FBQzFGLDZGQUE2RjtRQUM3RiwyRkFBMkY7UUFDM0YsNkZBQTZGO1FBQzdGLGtFQUFrRTtRQUNsRSxJQUFJLElBQUEsaURBQWdDLEVBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDO1lBQ3BFLHNGQUFzRjtZQUN0RixvRkFBb0Y7WUFDcEYsb0NBQW9DO1lBQ3BDLElBQUEsd0NBQXVCLEVBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1lBRXBFLGtGQUFrRjtZQUNsRix5RkFBeUY7WUFDekYsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLDhCQUFzQixFQUFFLENBQUMsQ0FBQztRQUNoRCxDQUFDO0lBQ0gsQ0FBQyxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmRldi9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNDb250ZXh0LCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge05vZGVQYWNrYWdlSW5zdGFsbFRhc2t9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzL3Rhc2tzJztcbmltcG9ydCB7YWRkUGFja2FnZVRvUGFja2FnZUpzb24sIGdldFBhY2thZ2VWZXJzaW9uRnJvbVBhY2thZ2VKc29ufSBmcm9tICcuL3BhY2thZ2UtY29uZmlnJztcblxuLyoqXG4gKiBTY2hlbWF0aWMgZmFjdG9yeSBlbnRyeS1wb2ludCBmb3IgdGhlIGBuZy1hZGRgIHNjaGVtYXRpYy4gVGhlIG5nLWFkZCBzY2hlbWF0aWMgd2lsbCBiZVxuICogYXV0b21hdGljYWxseSBleGVjdXRlZCBpZiBkZXZlbG9wZXJzIHJ1biBgbmcgYWRkIEBhbmd1bGFyL2Nka2AuXG4gKlxuICogQnkgZGVmYXVsdCwgdGhlIENMSSBhbHJlYWR5IGluc3RhbGxzIHRoZSBwYWNrYWdlIHRoYXQgaGFzIGJlZW4gc3BlY2lmaWVkIHdpdGggYG5nIGFkZGAuXG4gKiBXZSBqdXN0IHN0b3JlIHRoZSB2ZXJzaW9uIGluIHRoZSBgcGFja2FnZS5qc29uYCBpbiBjYXNlIHRoZSBwYWNrYWdlIG1hbmFnZXIgZGlkbid0LiBBbHNvXG4gKiB0aGlzIGVuc3VyZXMgdGhhdCB0aGVyZSB3aWxsIGJlIG5vIGVycm9yIHRoYXQgc2F5cyB0aGF0IHRoZSBDREsgZG9lcyBub3Qgc3VwcG9ydCBgbmcgYWRkYC5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKCk6IFJ1bGUge1xuICByZXR1cm4gKGhvc3Q6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICAvLyBUaGUgQ0xJIGluc2VydHMgYEBhbmd1bGFyL2Nka2AgaW50byB0aGUgYHBhY2thZ2UuanNvbmAgYmVmb3JlIHRoaXMgc2NoZW1hdGljIHJ1bnMuIFRoaXNcbiAgICAvLyBtZWFucyB0aGF0IHdlIGRvIG5vdCBuZWVkIHRvIGluc2VydCB0aGUgQ0RLIGludG8gYHBhY2thZ2UuanNvbmAgZmlsZXMgYWdhaW4uIEluIHNvbWUgY2FzZXNcbiAgICAvLyB0aG91Z2gsIGl0IGNvdWxkIGhhcHBlbiB0aGF0IHRoaXMgc2NoZW1hdGljIHJ1bnMgb3V0c2lkZSBvZiB0aGUgQ0xJIGBuZyBhZGRgIGNvbW1hbmQsIG9yXG4gICAgLy8gdGhlIENESyBpcyBvbmx5IGxpc3RlZCBhcyBhIGRldiBkZXBlbmRlbmN5LiBJZiB0aGF0IGlzIHRoZSBjYXNlLCB3ZSBpbnNlcnQgYSB2ZXJzaW9uIGJhc2VkXG4gICAgLy8gb24gdGhlIGN1cnJlbnQgYnVpbGQgdmVyc2lvbiAoc3Vic3RpdHV0ZWQgdmVyc2lvbiBwbGFjZWhvbGRlcikuXG4gICAgaWYgKGdldFBhY2thZ2VWZXJzaW9uRnJvbVBhY2thZ2VKc29uKGhvc3QsICdAYW5ndWxhci9jZGsnKSA9PT0gbnVsbCkge1xuICAgICAgLy8gSW4gb3JkZXIgdG8gYWxpZ24gdGhlIENESyB2ZXJzaW9uIHdpdGggb3RoZXIgQW5ndWxhciBkZXBlbmRlbmNpZXMgdGhhdCBhcmUgc2V0dXAgYnlcbiAgICAgIC8vIGBAc2NoZW1hdGljcy9hbmd1bGFyYCwgd2UgdXNlIHRpbGRlIGluc3RlYWQgb2YgY2FyZXQuIFRoaXMgaXMgZGVmYXVsdCBmb3IgQW5ndWxhclxuICAgICAgLy8gZGVwZW5kZW5jaWVzIGluIG5ldyBDTEkgcHJvamVjdHMuXG4gICAgICBhZGRQYWNrYWdlVG9QYWNrYWdlSnNvbihob3N0LCAnQGFuZ3VsYXIvY2RrJywgYH4wLjAuMC1QTEFDRUhPTERFUmApO1xuXG4gICAgICAvLyBBZGQgYSB0YXNrIHRvIHJ1biB0aGUgcGFja2FnZSBtYW5hZ2VyLiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHdlIHVwZGF0ZWQgdGhlXG4gICAgICAvLyB3b3Jrc3BhY2UgXCJwYWNrYWdlLmpzb25cIiBmaWxlIGFuZCB3ZSB3YW50IGxvY2sgZmlsZXMgdG8gcmVmbGVjdCB0aGUgbmV3IHZlcnNpb24gcmFuZ2UuXG4gICAgICBjb250ZXh0LmFkZFRhc2sobmV3IE5vZGVQYWNrYWdlSW5zdGFsbFRhc2soKSk7XG4gICAgfVxuICB9O1xufVxuIl19