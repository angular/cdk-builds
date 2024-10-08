"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChangesForTarget = getChangesForTarget;
exports.getAllChanges = getAllChanges;
const target_version_1 = require("./target-version");
/**
 * Gets the changes for a given target version from the specified version changes object.
 *
 * For readability and a good overview of breaking changes, the version change data always
 * includes the related Pull Request link. Since this data is not needed when performing the
 * upgrade, this unused data can be removed and the changes data can be flattened into an
 * easy iterable array.
 */
function getChangesForTarget(target, data) {
    if (!data) {
        const version = target_version_1.TargetVersion[target];
        throw new Error(`No data could be found for target version: ${version}`);
    }
    return (data[target] || []).reduce((result, prData) => result.concat(prData.changes), []);
}
/**
 * Gets all changes from the specified version changes object. This is helpful in case a migration
 * rule does not distinguish data based on the target version, but for readability the
 * upgrade data is separated for each target version.
 */
function getAllChanges(data) {
    return Object.keys(data)
        .map(targetVersion => getChangesForTarget(targetVersion, data))
        .reduce((result, versionData) => result.concat(versionData), []);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyc2lvbi1jaGFuZ2VzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL3VwZGF0ZS10b29sL3ZlcnNpb24tY2hhbmdlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQXdCSCxrREFPQztBQU9ELHNDQUlDO0FBeENELHFEQUErQztBQWMvQzs7Ozs7OztHQU9HO0FBQ0gsU0FBZ0IsbUJBQW1CLENBQUksTUFBcUIsRUFBRSxJQUF1QjtJQUNuRixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDVixNQUFNLE9BQU8sR0FBSSw4QkFBd0MsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsRSxNQUFNLElBQUksS0FBSyxDQUFDLDhDQUE4QyxPQUFPLEVBQUUsQ0FBQyxDQUFDO0lBQzNFLENBQUM7SUFFRCxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQVMsQ0FBQyxDQUFDO0FBQ25HLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBZ0IsYUFBYSxDQUFJLElBQXVCO0lBQ3RELE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7U0FDckIsR0FBRyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsbUJBQW1CLENBQUMsYUFBOEIsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUMvRSxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ3JFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5kZXYvbGljZW5zZVxuICovXG5cbmltcG9ydCB7VGFyZ2V0VmVyc2lvbn0gZnJvbSAnLi90YXJnZXQtdmVyc2lvbic7XG5cbmV4cG9ydCB0eXBlIFZlcnNpb25DaGFuZ2VzPFQ+ID0ge1xuICBbdGFyZ2V0IGluIFRhcmdldFZlcnNpb25dPzogUmVhZGFibGVDaGFuZ2U8VD5bXTtcbn07XG5cbmV4cG9ydCB0eXBlIFJlYWRhYmxlQ2hhbmdlPFQ+ID0ge1xuICBwcjogc3RyaW5nO1xuICBjaGFuZ2VzOiBUW107XG59O1xuXG4vKiogQ29uZGl0aW9uYWwgdHlwZSB0aGF0IHVud3JhcHMgdGhlIHZhbHVlIG9mIGEgdmVyc2lvbiBjaGFuZ2VzIHR5cGUuICovXG5leHBvcnQgdHlwZSBWYWx1ZU9mQ2hhbmdlczxUPiA9IFQgZXh0ZW5kcyBWZXJzaW9uQ2hhbmdlczxpbmZlciBYPiA/IFggOiBudWxsO1xuXG4vKipcbiAqIEdldHMgdGhlIGNoYW5nZXMgZm9yIGEgZ2l2ZW4gdGFyZ2V0IHZlcnNpb24gZnJvbSB0aGUgc3BlY2lmaWVkIHZlcnNpb24gY2hhbmdlcyBvYmplY3QuXG4gKlxuICogRm9yIHJlYWRhYmlsaXR5IGFuZCBhIGdvb2Qgb3ZlcnZpZXcgb2YgYnJlYWtpbmcgY2hhbmdlcywgdGhlIHZlcnNpb24gY2hhbmdlIGRhdGEgYWx3YXlzXG4gKiBpbmNsdWRlcyB0aGUgcmVsYXRlZCBQdWxsIFJlcXVlc3QgbGluay4gU2luY2UgdGhpcyBkYXRhIGlzIG5vdCBuZWVkZWQgd2hlbiBwZXJmb3JtaW5nIHRoZVxuICogdXBncmFkZSwgdGhpcyB1bnVzZWQgZGF0YSBjYW4gYmUgcmVtb3ZlZCBhbmQgdGhlIGNoYW5nZXMgZGF0YSBjYW4gYmUgZmxhdHRlbmVkIGludG8gYW5cbiAqIGVhc3kgaXRlcmFibGUgYXJyYXkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDaGFuZ2VzRm9yVGFyZ2V0PFQ+KHRhcmdldDogVGFyZ2V0VmVyc2lvbiwgZGF0YTogVmVyc2lvbkNoYW5nZXM8VD4pOiBUW10ge1xuICBpZiAoIWRhdGEpIHtcbiAgICBjb25zdCB2ZXJzaW9uID0gKFRhcmdldFZlcnNpb24gYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPilbdGFyZ2V0XTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIGRhdGEgY291bGQgYmUgZm91bmQgZm9yIHRhcmdldCB2ZXJzaW9uOiAke3ZlcnNpb259YCk7XG4gIH1cblxuICByZXR1cm4gKGRhdGFbdGFyZ2V0XSB8fCBbXSkucmVkdWNlKChyZXN1bHQsIHByRGF0YSkgPT4gcmVzdWx0LmNvbmNhdChwckRhdGEuY2hhbmdlcyksIFtdIGFzIFRbXSk7XG59XG5cbi8qKlxuICogR2V0cyBhbGwgY2hhbmdlcyBmcm9tIHRoZSBzcGVjaWZpZWQgdmVyc2lvbiBjaGFuZ2VzIG9iamVjdC4gVGhpcyBpcyBoZWxwZnVsIGluIGNhc2UgYSBtaWdyYXRpb25cbiAqIHJ1bGUgZG9lcyBub3QgZGlzdGluZ3Vpc2ggZGF0YSBiYXNlZCBvbiB0aGUgdGFyZ2V0IHZlcnNpb24sIGJ1dCBmb3IgcmVhZGFiaWxpdHkgdGhlXG4gKiB1cGdyYWRlIGRhdGEgaXMgc2VwYXJhdGVkIGZvciBlYWNoIHRhcmdldCB2ZXJzaW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWxsQ2hhbmdlczxUPihkYXRhOiBWZXJzaW9uQ2hhbmdlczxUPik6IFRbXSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyhkYXRhKVxuICAgIC5tYXAodGFyZ2V0VmVyc2lvbiA9PiBnZXRDaGFuZ2VzRm9yVGFyZ2V0KHRhcmdldFZlcnNpb24gYXMgVGFyZ2V0VmVyc2lvbiwgZGF0YSkpXG4gICAgLnJlZHVjZSgocmVzdWx0LCB2ZXJzaW9uRGF0YSkgPT4gcmVzdWx0LmNvbmNhdCh2ZXJzaW9uRGF0YSksIFtdKTtcbn1cbiJdfQ==