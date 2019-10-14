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
        define("@angular/cdk/schematics", ["require", "exports", "@angular/cdk/schematics/utils/index", "@angular/cdk/schematics/ng-update/public-api", "@angular/cdk/schematics/update-tool/public-api", "parse5"], factory);
    }
})(function (require, exports) {
    "use strict";
    function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    __export(require("@angular/cdk/schematics/utils/index"));
    __export(require("@angular/cdk/schematics/ng-update/public-api"));
    __export(require("@angular/cdk/schematics/update-tool/public-api"));
    // Re-export parse5 from the CDK. Material schematics code cannot simply import
    // "parse5" because it could result in a different version. As long as we import
    // it from within the CDK, it will always be the correct version that is specified
    // in the CDK "package.json" as optional dependency.
    const parse5 = require("parse5");
    exports.parse5 = parse5;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7SUFFSCx5REFBd0I7SUFDeEIsa0VBQXVDO0lBQ3ZDLG9FQUF5QztJQUV6QywrRUFBK0U7SUFDL0UsZ0ZBQWdGO0lBQ2hGLGtGQUFrRjtJQUNsRixvREFBb0Q7SUFDcEQsaUNBQWlDO0lBQ3pCLHdCQUFNIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmV4cG9ydCAqIGZyb20gJy4vdXRpbHMnO1xuZXhwb3J0ICogZnJvbSAnLi9uZy11cGRhdGUvcHVibGljLWFwaSc7XG5leHBvcnQgKiBmcm9tICcuL3VwZGF0ZS10b29sL3B1YmxpYy1hcGknO1xuXG4vLyBSZS1leHBvcnQgcGFyc2U1IGZyb20gdGhlIENESy4gTWF0ZXJpYWwgc2NoZW1hdGljcyBjb2RlIGNhbm5vdCBzaW1wbHkgaW1wb3J0XG4vLyBcInBhcnNlNVwiIGJlY2F1c2UgaXQgY291bGQgcmVzdWx0IGluIGEgZGlmZmVyZW50IHZlcnNpb24uIEFzIGxvbmcgYXMgd2UgaW1wb3J0XG4vLyBpdCBmcm9tIHdpdGhpbiB0aGUgQ0RLLCBpdCB3aWxsIGFsd2F5cyBiZSB0aGUgY29ycmVjdCB2ZXJzaW9uIHRoYXQgaXMgc3BlY2lmaWVkXG4vLyBpbiB0aGUgQ0RLIFwicGFja2FnZS5qc29uXCIgYXMgb3B0aW9uYWwgZGVwZW5kZW5jeS5cbmltcG9ydCAqIGFzIHBhcnNlNSBmcm9tICdwYXJzZTUnO1xuZXhwb3J0IHtwYXJzZTV9O1xuIl19