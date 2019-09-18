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
        define("@angular/cdk/schematics/ng-add/package-config", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Sorts the keys of the given object.
     * @returns A new object instance with sorted keys
     */
    function sortObjectByKeys(obj) {
        return Object.keys(obj).sort().reduce((result, key) => (result[key] = obj[key]) && result, {});
    }
    /** Adds a package to the package.json in the given host tree. */
    function addPackageToPackageJson(host, pkg, version) {
        if (host.exists('package.json')) {
            const sourceText = host.read('package.json').toString('utf-8');
            const json = JSON.parse(sourceText);
            if (!json.dependencies) {
                json.dependencies = {};
            }
            if (!json.dependencies[pkg]) {
                json.dependencies[pkg] = version;
                json.dependencies = sortObjectByKeys(json.dependencies);
            }
            host.overwrite('package.json', JSON.stringify(json, null, 2));
        }
        return host;
    }
    exports.addPackageToPackageJson = addPackageToPackageJson;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFja2FnZS1jb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctYWRkL3BhY2thZ2UtY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBSUg7OztPQUdHO0lBQ0gsU0FBUyxnQkFBZ0IsQ0FBQyxHQUFXO1FBQ25DLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDakcsQ0FBQztJQUVELGlFQUFpRTtJQUNqRSxTQUFnQix1QkFBdUIsQ0FBQyxJQUFVLEVBQUUsR0FBVyxFQUFFLE9BQWU7UUFFOUUsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxFQUFFO1lBQy9CLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFFLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2hFLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFcEMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUU7Z0JBQ3RCLElBQUksQ0FBQyxZQUFZLEdBQUcsRUFBRSxDQUFDO2FBQ3hCO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQzNCLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEdBQUcsT0FBTyxDQUFDO2dCQUNqQyxJQUFJLENBQUMsWUFBWSxHQUFHLGdCQUFnQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQzthQUN6RDtZQUVELElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQy9EO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBbkJELDBEQW1CQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1RyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcblxuLyoqXG4gKiBTb3J0cyB0aGUga2V5cyBvZiB0aGUgZ2l2ZW4gb2JqZWN0LlxuICogQHJldHVybnMgQSBuZXcgb2JqZWN0IGluc3RhbmNlIHdpdGggc29ydGVkIGtleXNcbiAqL1xuZnVuY3Rpb24gc29ydE9iamVjdEJ5S2V5cyhvYmo6IG9iamVjdCkge1xuICByZXR1cm4gT2JqZWN0LmtleXMob2JqKS5zb3J0KCkucmVkdWNlKChyZXN1bHQsIGtleSkgPT4gKHJlc3VsdFtrZXldID0gb2JqW2tleV0pICYmIHJlc3VsdCwge30pO1xufVxuXG4vKiogQWRkcyBhIHBhY2thZ2UgdG8gdGhlIHBhY2thZ2UuanNvbiBpbiB0aGUgZ2l2ZW4gaG9zdCB0cmVlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFBhY2thZ2VUb1BhY2thZ2VKc29uKGhvc3Q6IFRyZWUsIHBrZzogc3RyaW5nLCB2ZXJzaW9uOiBzdHJpbmcpOiBUcmVlIHtcblxuICBpZiAoaG9zdC5leGlzdHMoJ3BhY2thZ2UuanNvbicpKSB7XG4gICAgY29uc3Qgc291cmNlVGV4dCA9IGhvc3QucmVhZCgncGFja2FnZS5qc29uJykhLnRvU3RyaW5nKCd1dGYtOCcpO1xuICAgIGNvbnN0IGpzb24gPSBKU09OLnBhcnNlKHNvdXJjZVRleHQpO1xuXG4gICAgaWYgKCFqc29uLmRlcGVuZGVuY2llcykge1xuICAgICAganNvbi5kZXBlbmRlbmNpZXMgPSB7fTtcbiAgICB9XG5cbiAgICBpZiAoIWpzb24uZGVwZW5kZW5jaWVzW3BrZ10pIHtcbiAgICAgIGpzb24uZGVwZW5kZW5jaWVzW3BrZ10gPSB2ZXJzaW9uO1xuICAgICAganNvbi5kZXBlbmRlbmNpZXMgPSBzb3J0T2JqZWN0QnlLZXlzKGpzb24uZGVwZW5kZW5jaWVzKTtcbiAgICB9XG5cbiAgICBob3N0Lm92ZXJ3cml0ZSgncGFja2FnZS5qc29uJywgSlNPTi5zdHJpbmdpZnkoanNvbiwgbnVsbCwgMikpO1xuICB9XG5cbiAgcmV0dXJuIGhvc3Q7XG59XG4iXX0=