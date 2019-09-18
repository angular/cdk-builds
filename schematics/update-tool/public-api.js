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
        define("@angular/cdk/schematics/update-tool/public-api", ["require", "exports", "@angular/cdk/schematics/update-tool", "@angular/cdk/schematics/update-tool/target-version", "@angular/cdk/schematics/update-tool/version-changes", "@angular/cdk/schematics/update-tool/migration-rule", "@angular/cdk/schematics/update-tool/component-resource-collector"], factory);
    }
})(function (require, exports) {
    "use strict";
    function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    __export(require("@angular/cdk/schematics/update-tool"));
    __export(require("@angular/cdk/schematics/update-tool/target-version"));
    __export(require("@angular/cdk/schematics/update-tool/version-changes"));
    __export(require("@angular/cdk/schematics/update-tool/migration-rule"));
    __export(require("@angular/cdk/schematics/update-tool/component-resource-collector"));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVibGljLWFwaS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2NoZW1hdGljcy91cGRhdGUtdG9vbC9wdWJsaWMtYXBpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7O0lBRUgseURBQXdCO0lBQ3hCLHdFQUFpQztJQUNqQyx5RUFBa0M7SUFDbEMsd0VBQWlDO0lBQ2pDLHNGQUErQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5leHBvcnQgKiBmcm9tICcuL2luZGV4JztcbmV4cG9ydCAqIGZyb20gJy4vdGFyZ2V0LXZlcnNpb24nO1xuZXhwb3J0ICogZnJvbSAnLi92ZXJzaW9uLWNoYW5nZXMnO1xuZXhwb3J0ICogZnJvbSAnLi9taWdyYXRpb24tcnVsZSc7XG5leHBvcnQgKiBmcm9tICcuL2NvbXBvbmVudC1yZXNvdXJjZS1jb2xsZWN0b3InO1xuIl19