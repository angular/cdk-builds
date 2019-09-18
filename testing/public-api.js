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
        define("@angular/cdk/testing/public-api", ["require", "exports", "tslib", "@angular/cdk/testing/component-harness", "@angular/cdk/testing/dispatch-events", "@angular/cdk/testing/element-focus", "@angular/cdk/testing/event-objects", "@angular/cdk/testing/harness-environment", "@angular/cdk/testing/test-element", "@angular/cdk/testing/type-in-element"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    tslib_1.__exportStar(require("@angular/cdk/testing/component-harness"), exports);
    tslib_1.__exportStar(require("@angular/cdk/testing/dispatch-events"), exports);
    tslib_1.__exportStar(require("@angular/cdk/testing/element-focus"), exports);
    tslib_1.__exportStar(require("@angular/cdk/testing/event-objects"), exports);
    tslib_1.__exportStar(require("@angular/cdk/testing/harness-environment"), exports);
    tslib_1.__exportStar(require("@angular/cdk/testing/test-element"), exports);
    tslib_1.__exportStar(require("@angular/cdk/testing/type-in-element"), exports);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVibGljLWFwaS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGVzdGluZy9wdWJsaWMtYXBpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILGlGQUFvQztJQUNwQywrRUFBa0M7SUFDbEMsNkVBQWdDO0lBQ2hDLDZFQUFnQztJQUNoQyxtRkFBc0M7SUFDdEMsNEVBQStCO0lBQy9CLCtFQUFrQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5leHBvcnQgKiBmcm9tICcuL2NvbXBvbmVudC1oYXJuZXNzJztcbmV4cG9ydCAqIGZyb20gJy4vZGlzcGF0Y2gtZXZlbnRzJztcbmV4cG9ydCAqIGZyb20gJy4vZWxlbWVudC1mb2N1cyc7XG5leHBvcnQgKiBmcm9tICcuL2V2ZW50LW9iamVjdHMnO1xuZXhwb3J0ICogZnJvbSAnLi9oYXJuZXNzLWVudmlyb25tZW50JztcbmV4cG9ydCAqIGZyb20gJy4vdGVzdC1lbGVtZW50JztcbmV4cG9ydCAqIGZyb20gJy4vdHlwZS1pbi1lbGVtZW50JztcbiJdfQ==