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
        define("@angular/cdk/schematics/ng-add/index", ["require", "exports", "@angular/cdk/schematics/ng-add/package-config"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
        return (host) => {
            // In order to align the CDK version with the other Angular dependencies, we use tilde
            // instead of caret. This is default for Angular dependencies in new CLI projects.
            package_config_1.addPackageToPackageJson(host, '@angular/cdk', `~${exports.cdkVersion}`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctYWRkL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBR0gsa0ZBQXlEO0lBRXpELG9GQUFvRjtJQUN2RSxRQUFBLFVBQVUsR0FBRyw0QkFBNEIsQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUV2RTs7Ozs7OztPQU9HO0lBQ0g7UUFDRSxPQUFPLENBQUMsSUFBVSxFQUFFLEVBQUU7WUFDcEIsc0ZBQXNGO1lBQ3RGLGtGQUFrRjtZQUNsRix3Q0FBdUIsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFLElBQUksa0JBQVUsRUFBRSxDQUFDLENBQUM7UUFDbEUsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQU5ELDRCQU1DO0lBRUQsd0VBQXdFO0lBQ3hFLFNBQVMsNEJBQTRCLENBQUMsV0FBbUI7UUFDdkQsSUFBSTtZQUNGLE9BQU8sT0FBTyxDQUFDLEdBQUcsV0FBVyxlQUFlLENBQUMsQ0FBQyxPQUFPLENBQUM7U0FDdkQ7UUFBQyxXQUFNO1lBQ04sT0FBTyxJQUFJLENBQUM7U0FDYjtJQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdWxlLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge2FkZFBhY2thZ2VUb1BhY2thZ2VKc29ufSBmcm9tICcuL3BhY2thZ2UtY29uZmlnJztcblxuLyoqIE5hbWUgb2YgdGhlIEFuZ3VsYXIgQ0RLIHZlcnNpb24gdGhhdCBpcyBzaGlwcGVkIHRvZ2V0aGVyIHdpdGggdGhlIHNjaGVtYXRpY3MuICovXG5leHBvcnQgY29uc3QgY2RrVmVyc2lvbiA9IGxvYWRQYWNrYWdlVmVyc2lvbkdyYWNlZnVsbHkoJ0Bhbmd1bGFyL2NkaycpO1xuXG4vKipcbiAqIFNjaGVtYXRpYyBmYWN0b3J5IGVudHJ5LXBvaW50IGZvciB0aGUgYG5nLWFkZGAgc2NoZW1hdGljLiBUaGUgbmctYWRkIHNjaGVtYXRpYyB3aWxsIGJlXG4gKiBhdXRvbWF0aWNhbGx5IGV4ZWN1dGVkIGlmIGRldmVsb3BlcnMgcnVuIGBuZyBhZGQgQGFuZ3VsYXIvY2RrYC5cbiAqXG4gKiBCeSBkZWZhdWx0LCB0aGUgQ0xJIGFscmVhZHkgaW5zdGFsbHMgdGhlIHBhY2thZ2UgdGhhdCBoYXMgYmVlbiBzcGVjaWZpZWQgd2l0aCBgbmcgYWRkYC5cbiAqIFdlIGp1c3Qgc3RvcmUgdGhlIHZlcnNpb24gaW4gdGhlIGBwYWNrYWdlLmpzb25gIGluIGNhc2UgdGhlIHBhY2thZ2UgbWFuYWdlciBkaWRuJ3QuIEFsc29cbiAqIHRoaXMgZW5zdXJlcyB0aGF0IHRoZXJlIHdpbGwgYmUgbm8gZXJyb3IgdGhhdCBzYXlzIHRoYXQgdGhlIENESyBkb2VzIG5vdCBzdXBwb3J0IGBuZyBhZGRgLlxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpOiBSdWxlIHtcbiAgcmV0dXJuIChob3N0OiBUcmVlKSA9PiB7XG4gICAgLy8gSW4gb3JkZXIgdG8gYWxpZ24gdGhlIENESyB2ZXJzaW9uIHdpdGggdGhlIG90aGVyIEFuZ3VsYXIgZGVwZW5kZW5jaWVzLCB3ZSB1c2UgdGlsZGVcbiAgICAvLyBpbnN0ZWFkIG9mIGNhcmV0LiBUaGlzIGlzIGRlZmF1bHQgZm9yIEFuZ3VsYXIgZGVwZW5kZW5jaWVzIGluIG5ldyBDTEkgcHJvamVjdHMuXG4gICAgYWRkUGFja2FnZVRvUGFja2FnZUpzb24oaG9zdCwgJ0Bhbmd1bGFyL2NkaycsIGB+JHtjZGtWZXJzaW9ufWApO1xuICB9O1xufVxuXG4vKiogTG9hZHMgdGhlIGZ1bGwgdmVyc2lvbiBmcm9tIHRoZSBnaXZlbiBBbmd1bGFyIHBhY2thZ2UgZ3JhY2VmdWxseS4gKi9cbmZ1bmN0aW9uIGxvYWRQYWNrYWdlVmVyc2lvbkdyYWNlZnVsbHkocGFja2FnZU5hbWU6IHN0cmluZyk6IHN0cmluZ3xudWxsIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gcmVxdWlyZShgJHtwYWNrYWdlTmFtZX0vcGFja2FnZS5qc29uYCkudmVyc2lvbjtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiJdfQ==