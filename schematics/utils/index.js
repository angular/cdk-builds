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
        define("@angular/cdk/schematics/utils/index", ["require", "exports", "@angular/cdk/schematics/utils/ast", "@angular/cdk/schematics/utils/ast/ng-module-imports", "@angular/cdk/schematics/utils/build-component", "@angular/cdk/schematics/utils/get-project", "@angular/cdk/schematics/utils/html-head-element", "@angular/cdk/schematics/utils/parse5-element", "@angular/cdk/schematics/utils/project-index-file", "@angular/cdk/schematics/utils/project-main-file", "@angular/cdk/schematics/utils/project-style-file", "@angular/cdk/schematics/utils/project-targets", "@angular/cdk/schematics/utils/schematic-options", "@angular/cdk/schematics/utils/version-agnostic-typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    __export(require("@angular/cdk/schematics/utils/ast"));
    __export(require("@angular/cdk/schematics/utils/ast/ng-module-imports"));
    __export(require("@angular/cdk/schematics/utils/build-component"));
    __export(require("@angular/cdk/schematics/utils/get-project"));
    __export(require("@angular/cdk/schematics/utils/html-head-element"));
    __export(require("@angular/cdk/schematics/utils/parse5-element"));
    __export(require("@angular/cdk/schematics/utils/project-index-file"));
    __export(require("@angular/cdk/schematics/utils/project-main-file"));
    __export(require("@angular/cdk/schematics/utils/project-style-file"));
    __export(require("@angular/cdk/schematics/utils/project-targets"));
    __export(require("@angular/cdk/schematics/utils/schematic-options"));
    __export(require("@angular/cdk/schematics/utils/version-agnostic-typescript"));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXRpbHMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7SUFFSCx1REFBc0I7SUFDdEIseUVBQXdDO0lBQ3hDLG1FQUFrQztJQUNsQywrREFBOEI7SUFDOUIscUVBQW9DO0lBQ3BDLGtFQUFpQztJQUNqQyxzRUFBcUM7SUFDckMscUVBQW9DO0lBQ3BDLHNFQUFxQztJQUNyQyxtRUFBa0M7SUFDbEMscUVBQW9DO0lBQ3BDLCtFQUE4QyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5leHBvcnQgKiBmcm9tICcuL2FzdCc7XG5leHBvcnQgKiBmcm9tICcuL2FzdC9uZy1tb2R1bGUtaW1wb3J0cyc7XG5leHBvcnQgKiBmcm9tICcuL2J1aWxkLWNvbXBvbmVudCc7XG5leHBvcnQgKiBmcm9tICcuL2dldC1wcm9qZWN0JztcbmV4cG9ydCAqIGZyb20gJy4vaHRtbC1oZWFkLWVsZW1lbnQnO1xuZXhwb3J0ICogZnJvbSAnLi9wYXJzZTUtZWxlbWVudCc7XG5leHBvcnQgKiBmcm9tICcuL3Byb2plY3QtaW5kZXgtZmlsZSc7XG5leHBvcnQgKiBmcm9tICcuL3Byb2plY3QtbWFpbi1maWxlJztcbmV4cG9ydCAqIGZyb20gJy4vcHJvamVjdC1zdHlsZS1maWxlJztcbmV4cG9ydCAqIGZyb20gJy4vcHJvamVjdC10YXJnZXRzJztcbmV4cG9ydCAqIGZyb20gJy4vc2NoZW1hdGljLW9wdGlvbnMnO1xuZXhwb3J0ICogZnJvbSAnLi92ZXJzaW9uLWFnbm9zdGljLXR5cGVzY3JpcHQnO1xuIl19