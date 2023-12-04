"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPackageVersionFromPackageJson = exports.addPackageToPackageJson = void 0;
/**
 * Sorts the keys of the given object.
 * @returns A new object instance with sorted keys
 */
function sortObjectByKeys(obj) {
    return Object.keys(obj)
        .sort()
        .reduce((result, key) => {
        result[key] = obj[key];
        return result;
    }, {});
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
/** Gets the version of the specified package by looking at the package.json in the given tree. */
function getPackageVersionFromPackageJson(tree, name) {
    if (!tree.exists('package.json')) {
        return null;
    }
    const packageJson = JSON.parse(tree.read('package.json').toString('utf8'));
    if (packageJson.dependencies && packageJson.dependencies[name]) {
        return packageJson.dependencies[name];
    }
    return null;
}
exports.getPackageVersionFromPackageJson = getPackageVersionFromPackageJson;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFja2FnZS1jb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctYWRkL3BhY2thZ2UtY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQVFIOzs7R0FHRztBQUNILFNBQVMsZ0JBQWdCLENBQUMsR0FBMkI7SUFDbkQsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztTQUNwQixJQUFJLEVBQUU7U0FDTixNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEVBQUU7UUFDdEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2QixPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDLEVBQUUsRUFBNEIsQ0FBQyxDQUFDO0FBQ3JDLENBQUM7QUFFRCxpRUFBaUU7QUFDakUsU0FBZ0IsdUJBQXVCLENBQUMsSUFBVSxFQUFFLEdBQVcsRUFBRSxPQUFlO0lBQzlFLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDO1FBQ2hDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFFLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hFLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFnQixDQUFDO1FBRW5ELElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDdkIsSUFBSSxDQUFDLFlBQVksR0FBRyxFQUFFLENBQUM7UUFDekIsQ0FBQztRQUVELElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDNUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUM7WUFDakMsSUFBSSxDQUFDLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDMUQsQ0FBQztRQUVELElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2hFLENBQUM7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFsQkQsMERBa0JDO0FBRUQsa0dBQWtHO0FBQ2xHLFNBQWdCLGdDQUFnQyxDQUFDLElBQVUsRUFBRSxJQUFZO0lBQ3ZFLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUM7UUFDakMsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBZ0IsQ0FBQztJQUUzRixJQUFJLFdBQVcsQ0FBQyxZQUFZLElBQUksV0FBVyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQy9ELE9BQU8sV0FBVyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBWkQsNEVBWUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5cbmludGVyZmFjZSBQYWNrYWdlSnNvbiB7XG4gIGRlcGVuZGVuY2llczogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuLyoqXG4gKiBTb3J0cyB0aGUga2V5cyBvZiB0aGUgZ2l2ZW4gb2JqZWN0LlxuICogQHJldHVybnMgQSBuZXcgb2JqZWN0IGluc3RhbmNlIHdpdGggc29ydGVkIGtleXNcbiAqL1xuZnVuY3Rpb24gc29ydE9iamVjdEJ5S2V5cyhvYmo6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKG9iailcbiAgICAuc29ydCgpXG4gICAgLnJlZHVjZSgocmVzdWx0LCBrZXkpID0+IHtcbiAgICAgIHJlc3VsdFtrZXldID0gb2JqW2tleV07XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sIHt9IGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz4pO1xufVxuXG4vKiogQWRkcyBhIHBhY2thZ2UgdG8gdGhlIHBhY2thZ2UuanNvbiBpbiB0aGUgZ2l2ZW4gaG9zdCB0cmVlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFBhY2thZ2VUb1BhY2thZ2VKc29uKGhvc3Q6IFRyZWUsIHBrZzogc3RyaW5nLCB2ZXJzaW9uOiBzdHJpbmcpOiBUcmVlIHtcbiAgaWYgKGhvc3QuZXhpc3RzKCdwYWNrYWdlLmpzb24nKSkge1xuICAgIGNvbnN0IHNvdXJjZVRleHQgPSBob3N0LnJlYWQoJ3BhY2thZ2UuanNvbicpIS50b1N0cmluZygndXRmLTgnKTtcbiAgICBjb25zdCBqc29uID0gSlNPTi5wYXJzZShzb3VyY2VUZXh0KSBhcyBQYWNrYWdlSnNvbjtcblxuICAgIGlmICghanNvbi5kZXBlbmRlbmNpZXMpIHtcbiAgICAgIGpzb24uZGVwZW5kZW5jaWVzID0ge307XG4gICAgfVxuXG4gICAgaWYgKCFqc29uLmRlcGVuZGVuY2llc1twa2ddKSB7XG4gICAgICBqc29uLmRlcGVuZGVuY2llc1twa2ddID0gdmVyc2lvbjtcbiAgICAgIGpzb24uZGVwZW5kZW5jaWVzID0gc29ydE9iamVjdEJ5S2V5cyhqc29uLmRlcGVuZGVuY2llcyk7XG4gICAgfVxuXG4gICAgaG9zdC5vdmVyd3JpdGUoJ3BhY2thZ2UuanNvbicsIEpTT04uc3RyaW5naWZ5KGpzb24sIG51bGwsIDIpKTtcbiAgfVxuXG4gIHJldHVybiBob3N0O1xufVxuXG4vKiogR2V0cyB0aGUgdmVyc2lvbiBvZiB0aGUgc3BlY2lmaWVkIHBhY2thZ2UgYnkgbG9va2luZyBhdCB0aGUgcGFja2FnZS5qc29uIGluIHRoZSBnaXZlbiB0cmVlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhY2thZ2VWZXJzaW9uRnJvbVBhY2thZ2VKc29uKHRyZWU6IFRyZWUsIG5hbWU6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICBpZiAoIXRyZWUuZXhpc3RzKCdwYWNrYWdlLmpzb24nKSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgcGFja2FnZUpzb24gPSBKU09OLnBhcnNlKHRyZWUucmVhZCgncGFja2FnZS5qc29uJykhLnRvU3RyaW5nKCd1dGY4JykpIGFzIFBhY2thZ2VKc29uO1xuXG4gIGlmIChwYWNrYWdlSnNvbi5kZXBlbmRlbmNpZXMgJiYgcGFja2FnZUpzb24uZGVwZW5kZW5jaWVzW25hbWVdKSB7XG4gICAgcmV0dXJuIHBhY2thZ2VKc29uLmRlcGVuZGVuY2llc1tuYW1lXTtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuIl19