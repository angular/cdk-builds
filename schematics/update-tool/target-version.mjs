"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TargetVersion = void 0;
exports.getAllVersionNames = getAllVersionNames;
/** Possible versions that can be automatically migrated by `ng update`. */
// tslint:disable-next-line:prefer-const-enum
var TargetVersion;
(function (TargetVersion) {
    TargetVersion["V19"] = "version 19";
})(TargetVersion || (exports.TargetVersion = TargetVersion = {}));
/**
 * Returns all versions that are supported by "ng update". The versions are determined
 * based on the "TargetVersion" enum.
 */
function getAllVersionNames() {
    return Object.keys(TargetVersion).filter(enumValue => {
        return typeof TargetVersion[enumValue] === 'string';
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFyZ2V0LXZlcnNpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXBkYXRlLXRvb2wvdGFyZ2V0LXZlcnNpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBYUgsZ0RBSUM7QUFmRCwyRUFBMkU7QUFFM0UsNkNBQTZDO0FBQzdDLElBQVksYUFFWDtBQUZELFdBQVksYUFBYTtJQUN2QixtQ0FBa0IsQ0FBQTtBQUNwQixDQUFDLEVBRlcsYUFBYSw2QkFBYixhQUFhLFFBRXhCO0FBRUQ7OztHQUdHO0FBQ0gsU0FBZ0Isa0JBQWtCO0lBQ2hDLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUU7UUFDbkQsT0FBTyxPQUFRLGFBQW9ELENBQUMsU0FBUyxDQUFDLEtBQUssUUFBUSxDQUFDO0lBQzlGLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmRldi9saWNlbnNlXG4gKi9cblxuLyoqIFBvc3NpYmxlIHZlcnNpb25zIHRoYXQgY2FuIGJlIGF1dG9tYXRpY2FsbHkgbWlncmF0ZWQgYnkgYG5nIHVwZGF0ZWAuICovXG5cbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpwcmVmZXItY29uc3QtZW51bVxuZXhwb3J0IGVudW0gVGFyZ2V0VmVyc2lvbiB7XG4gIFYxOSA9ICd2ZXJzaW9uIDE5Jyxcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFsbCB2ZXJzaW9ucyB0aGF0IGFyZSBzdXBwb3J0ZWQgYnkgXCJuZyB1cGRhdGVcIi4gVGhlIHZlcnNpb25zIGFyZSBkZXRlcm1pbmVkXG4gKiBiYXNlZCBvbiB0aGUgXCJUYXJnZXRWZXJzaW9uXCIgZW51bS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEFsbFZlcnNpb25OYW1lcygpOiBzdHJpbmdbXSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyhUYXJnZXRWZXJzaW9uKS5maWx0ZXIoZW51bVZhbHVlID0+IHtcbiAgICByZXR1cm4gdHlwZW9mIChUYXJnZXRWZXJzaW9uIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IHVuZGVmaW5lZD4pW2VudW1WYWx1ZV0gPT09ICdzdHJpbmcnO1xuICB9KTtcbn1cbiJdfQ==