"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllVersionNames = exports.TargetVersion = void 0;
/** Possible versions that can be automatically migrated by `ng update`. */
// Used in an `Object.keys` call below so it can't be `const enum`.
// tslint:disable-next-line:prefer-const-enum
var TargetVersion;
(function (TargetVersion) {
    TargetVersion["V16"] = "version 16";
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
exports.getAllVersionNames = getAllVersionNames;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFyZ2V0LXZlcnNpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXBkYXRlLXRvb2wvdGFyZ2V0LXZlcnNpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsMkVBQTJFO0FBQzNFLG1FQUFtRTtBQUNuRSw2Q0FBNkM7QUFDN0MsSUFBWSxhQUVYO0FBRkQsV0FBWSxhQUFhO0lBQ3ZCLG1DQUFrQixDQUFBO0FBQ3BCLENBQUMsRUFGVyxhQUFhLDZCQUFiLGFBQWEsUUFFeEI7QUFFRDs7O0dBR0c7QUFDSCxTQUFnQixrQkFBa0I7SUFDaEMsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRTtRQUNuRCxPQUFPLE9BQVEsYUFBb0QsQ0FBQyxTQUFTLENBQUMsS0FBSyxRQUFRLENBQUM7SUFDOUYsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBSkQsZ0RBSUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqIFBvc3NpYmxlIHZlcnNpb25zIHRoYXQgY2FuIGJlIGF1dG9tYXRpY2FsbHkgbWlncmF0ZWQgYnkgYG5nIHVwZGF0ZWAuICovXG4vLyBVc2VkIGluIGFuIGBPYmplY3Qua2V5c2AgY2FsbCBiZWxvdyBzbyBpdCBjYW4ndCBiZSBgY29uc3QgZW51bWAuXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6cHJlZmVyLWNvbnN0LWVudW1cbmV4cG9ydCBlbnVtIFRhcmdldFZlcnNpb24ge1xuICBWMTYgPSAndmVyc2lvbiAxNicsXG59XG5cbi8qKlxuICogUmV0dXJucyBhbGwgdmVyc2lvbnMgdGhhdCBhcmUgc3VwcG9ydGVkIGJ5IFwibmcgdXBkYXRlXCIuIFRoZSB2ZXJzaW9ucyBhcmUgZGV0ZXJtaW5lZFxuICogYmFzZWQgb24gdGhlIFwiVGFyZ2V0VmVyc2lvblwiIGVudW0uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRBbGxWZXJzaW9uTmFtZXMoKTogc3RyaW5nW10ge1xuICByZXR1cm4gT2JqZWN0LmtleXMoVGFyZ2V0VmVyc2lvbikuZmlsdGVyKGVudW1WYWx1ZSA9PiB7XG4gICAgcmV0dXJuIHR5cGVvZiAoVGFyZ2V0VmVyc2lvbiBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmcgfCB1bmRlZmluZWQ+KVtlbnVtVmFsdWVdID09PSAnc3RyaW5nJztcbiAgfSk7XG59XG4iXX0=