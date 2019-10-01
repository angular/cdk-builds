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
        define("@angular/cdk/schematics/ng-update/public-api", ["require", "exports", "@angular/cdk/schematics/ng-update/upgrade-data", "@angular/cdk/schematics/ng-update/data/index", "@angular/cdk/schematics/ng-update/html-parsing/angular", "@angular/cdk/schematics/ng-update/html-parsing/elements", "@angular/cdk/schematics/ng-update/upgrade-rules/index", "@angular/cdk/schematics/ng-update/typescript/base-types", "@angular/cdk/schematics/ng-update/typescript/imports", "@angular/cdk/schematics/ng-update/typescript/literal", "@angular/cdk/schematics/ng-update/typescript/module-specifiers"], factory);
    }
})(function (require, exports) {
    "use strict";
    function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    __export(require("@angular/cdk/schematics/ng-update/upgrade-data"));
    __export(require("@angular/cdk/schematics/ng-update/data/index"));
    __export(require("@angular/cdk/schematics/ng-update/html-parsing/angular"));
    __export(require("@angular/cdk/schematics/ng-update/html-parsing/elements"));
    __export(require("@angular/cdk/schematics/ng-update/upgrade-rules/index"));
    __export(require("@angular/cdk/schematics/ng-update/typescript/base-types"));
    __export(require("@angular/cdk/schematics/ng-update/typescript/imports"));
    __export(require("@angular/cdk/schematics/ng-update/typescript/literal"));
    __export(require("@angular/cdk/schematics/ng-update/typescript/module-specifiers"));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVibGljLWFwaS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2NoZW1hdGljcy9uZy11cGRhdGUvcHVibGljLWFwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7OztJQUVILG9FQUErQjtJQUMvQixrRUFBNkI7SUFDN0IsNEVBQXVDO0lBQ3ZDLDZFQUF3QztJQUN4QywyRUFBc0M7SUFDdEMsNkVBQXdDO0lBQ3hDLDBFQUFxQztJQUNyQywwRUFBcUM7SUFDckMsb0ZBQStDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmV4cG9ydCAqIGZyb20gJy4vdXBncmFkZS1kYXRhJztcbmV4cG9ydCAqIGZyb20gJy4vZGF0YS9pbmRleCc7XG5leHBvcnQgKiBmcm9tICcuL2h0bWwtcGFyc2luZy9hbmd1bGFyJztcbmV4cG9ydCAqIGZyb20gJy4vaHRtbC1wYXJzaW5nL2VsZW1lbnRzJztcbmV4cG9ydCAqIGZyb20gJy4vdXBncmFkZS1ydWxlcy9pbmRleCc7XG5leHBvcnQgKiBmcm9tICcuL3R5cGVzY3JpcHQvYmFzZS10eXBlcyc7XG5leHBvcnQgKiBmcm9tICcuL3R5cGVzY3JpcHQvaW1wb3J0cyc7XG5leHBvcnQgKiBmcm9tICcuL3R5cGVzY3JpcHQvbGl0ZXJhbCc7XG5leHBvcnQgKiBmcm9tICcuL3R5cGVzY3JpcHQvbW9kdWxlLXNwZWNpZmllcnMnO1xuIl19