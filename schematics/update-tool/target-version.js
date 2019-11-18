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
        define("@angular/cdk/schematics/update-tool/target-version", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /** Possible versions that can be automatically migrated by `ng update`. */
    var TargetVersion;
    (function (TargetVersion) {
        TargetVersion["V6"] = "version 6";
        TargetVersion["V7"] = "version 7";
        TargetVersion["V8"] = "version 8";
        TargetVersion["V9"] = "version 9";
        TargetVersion["V10"] = "version 10";
    })(TargetVersion = exports.TargetVersion || (exports.TargetVersion = {}));
    /**
     * Returns all versions that are supported by "ng update". The versions are determined
     * based on the "TargetVersion" enum.
     */
    function getAllVersionNames() {
        return Object.keys(TargetVersion)
            .filter(enumValue => typeof TargetVersion[enumValue] === 'string');
    }
    exports.getAllVersionNames = getAllVersionNames;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFyZ2V0LXZlcnNpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXBkYXRlLXRvb2wvdGFyZ2V0LXZlcnNpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCwyRUFBMkU7SUFDM0UsSUFBWSxhQU1YO0lBTkQsV0FBWSxhQUFhO1FBQ3ZCLGlDQUFnQixDQUFBO1FBQ2hCLGlDQUFnQixDQUFBO1FBQ2hCLGlDQUFnQixDQUFBO1FBQ2hCLGlDQUFnQixDQUFBO1FBQ2hCLG1DQUFrQixDQUFBO0lBQ3BCLENBQUMsRUFOVyxhQUFhLEdBQWIscUJBQWEsS0FBYixxQkFBYSxRQU14QjtJQUVEOzs7T0FHRztJQUNILFNBQWdCLGtCQUFrQjtRQUNoQyxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDO2FBQzVCLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLE9BQU8sYUFBYSxDQUFDLFNBQVMsQ0FBQyxLQUFLLFFBQVEsQ0FBQyxDQUFDO0lBQ3pFLENBQUM7SUFIRCxnREFHQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKiogUG9zc2libGUgdmVyc2lvbnMgdGhhdCBjYW4gYmUgYXV0b21hdGljYWxseSBtaWdyYXRlZCBieSBgbmcgdXBkYXRlYC4gKi9cbmV4cG9ydCBlbnVtIFRhcmdldFZlcnNpb24ge1xuICBWNiA9ICd2ZXJzaW9uIDYnLFxuICBWNyA9ICd2ZXJzaW9uIDcnLFxuICBWOCA9ICd2ZXJzaW9uIDgnLFxuICBWOSA9ICd2ZXJzaW9uIDknLFxuICBWMTAgPSAndmVyc2lvbiAxMCcsXG59XG5cbi8qKlxuICogUmV0dXJucyBhbGwgdmVyc2lvbnMgdGhhdCBhcmUgc3VwcG9ydGVkIGJ5IFwibmcgdXBkYXRlXCIuIFRoZSB2ZXJzaW9ucyBhcmUgZGV0ZXJtaW5lZFxuICogYmFzZWQgb24gdGhlIFwiVGFyZ2V0VmVyc2lvblwiIGVudW0uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRBbGxWZXJzaW9uTmFtZXMoKTogc3RyaW5nW10ge1xuICByZXR1cm4gT2JqZWN0LmtleXMoVGFyZ2V0VmVyc2lvbilcbiAgICAgIC5maWx0ZXIoZW51bVZhbHVlID0+IHR5cGVvZiBUYXJnZXRWZXJzaW9uW2VudW1WYWx1ZV0gPT09ICdzdHJpbmcnKTtcbn1cbiJdfQ==