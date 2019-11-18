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
        define("@angular/cdk/schematics/update-tool/public-api", ["require", "exports", "@angular/cdk/schematics/update-tool", "@angular/cdk/schematics/update-tool/target-version", "@angular/cdk/schematics/update-tool/version-changes", "@angular/cdk/schematics/update-tool/migration-rule", "@angular/cdk/schematics/update-tool/component-resource-collector", "@angular/cdk/schematics/update-tool/utils/imports", "@angular/cdk/schematics/update-tool/utils/decorators"], factory);
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
    __export(require("@angular/cdk/schematics/update-tool/utils/imports"));
    __export(require("@angular/cdk/schematics/update-tool/utils/decorators"));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVibGljLWFwaS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2NoZW1hdGljcy91cGRhdGUtdG9vbC9wdWJsaWMtYXBpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7O0lBRUgseURBQXdCO0lBQ3hCLHdFQUFpQztJQUNqQyx5RUFBa0M7SUFDbEMsd0VBQWlDO0lBQ2pDLHNGQUErQztJQUMvQyx1RUFBZ0M7SUFDaEMsMEVBQW1DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmV4cG9ydCAqIGZyb20gJy4vaW5kZXgnO1xuZXhwb3J0ICogZnJvbSAnLi90YXJnZXQtdmVyc2lvbic7XG5leHBvcnQgKiBmcm9tICcuL3ZlcnNpb24tY2hhbmdlcyc7XG5leHBvcnQgKiBmcm9tICcuL21pZ3JhdGlvbi1ydWxlJztcbmV4cG9ydCAqIGZyb20gJy4vY29tcG9uZW50LXJlc291cmNlLWNvbGxlY3Rvcic7XG5leHBvcnQgKiBmcm9tICcuL3V0aWxzL2ltcG9ydHMnO1xuZXhwb3J0ICogZnJvbSAnLi91dGlscy9kZWNvcmF0b3JzJztcbiJdfQ==