"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyc2lvbi1jaGFuZ2VzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL3VwZGF0ZS10b29sL3ZlcnNpb24tY2hhbmdlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQXdCSCxrREFPQztBQU9ELHNDQUlDO0FBeENELHFEQUErQztBQWMvQzs7Ozs7OztHQU9HO0FBQ0gsU0FBZ0IsbUJBQW1CLENBQUksTUFBcUIsRUFBRSxJQUF1QjtJQUNuRixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDVixNQUFNLE9BQU8sR0FBSSw4QkFBd0MsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsRSxNQUFNLElBQUksS0FBSyxDQUFDLDhDQUE4QyxPQUFPLEVBQUUsQ0FBQyxDQUFDO0lBQzNFLENBQUM7SUFFRCxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQVMsQ0FBQyxDQUFDO0FBQ25HLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBZ0IsYUFBYSxDQUFJLElBQXVCO0lBQ3RELE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7U0FDckIsR0FBRyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsbUJBQW1CLENBQUMsYUFBOEIsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUMvRSxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ3JFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUYXJnZXRWZXJzaW9ufSBmcm9tICcuL3RhcmdldC12ZXJzaW9uJztcblxuZXhwb3J0IHR5cGUgVmVyc2lvbkNoYW5nZXM8VD4gPSB7XG4gIFt0YXJnZXQgaW4gVGFyZ2V0VmVyc2lvbl0/OiBSZWFkYWJsZUNoYW5nZTxUPltdO1xufTtcblxuZXhwb3J0IHR5cGUgUmVhZGFibGVDaGFuZ2U8VD4gPSB7XG4gIHByOiBzdHJpbmc7XG4gIGNoYW5nZXM6IFRbXTtcbn07XG5cbi8qKiBDb25kaXRpb25hbCB0eXBlIHRoYXQgdW53cmFwcyB0aGUgdmFsdWUgb2YgYSB2ZXJzaW9uIGNoYW5nZXMgdHlwZS4gKi9cbmV4cG9ydCB0eXBlIFZhbHVlT2ZDaGFuZ2VzPFQ+ID0gVCBleHRlbmRzIFZlcnNpb25DaGFuZ2VzPGluZmVyIFg+ID8gWCA6IG51bGw7XG5cbi8qKlxuICogR2V0cyB0aGUgY2hhbmdlcyBmb3IgYSBnaXZlbiB0YXJnZXQgdmVyc2lvbiBmcm9tIHRoZSBzcGVjaWZpZWQgdmVyc2lvbiBjaGFuZ2VzIG9iamVjdC5cbiAqXG4gKiBGb3IgcmVhZGFiaWxpdHkgYW5kIGEgZ29vZCBvdmVydmlldyBvZiBicmVha2luZyBjaGFuZ2VzLCB0aGUgdmVyc2lvbiBjaGFuZ2UgZGF0YSBhbHdheXNcbiAqIGluY2x1ZGVzIHRoZSByZWxhdGVkIFB1bGwgUmVxdWVzdCBsaW5rLiBTaW5jZSB0aGlzIGRhdGEgaXMgbm90IG5lZWRlZCB3aGVuIHBlcmZvcm1pbmcgdGhlXG4gKiB1cGdyYWRlLCB0aGlzIHVudXNlZCBkYXRhIGNhbiBiZSByZW1vdmVkIGFuZCB0aGUgY2hhbmdlcyBkYXRhIGNhbiBiZSBmbGF0dGVuZWQgaW50byBhblxuICogZWFzeSBpdGVyYWJsZSBhcnJheS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENoYW5nZXNGb3JUYXJnZXQ8VD4odGFyZ2V0OiBUYXJnZXRWZXJzaW9uLCBkYXRhOiBWZXJzaW9uQ2hhbmdlczxUPik6IFRbXSB7XG4gIGlmICghZGF0YSkge1xuICAgIGNvbnN0IHZlcnNpb24gPSAoVGFyZ2V0VmVyc2lvbiBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KVt0YXJnZXRdO1xuICAgIHRocm93IG5ldyBFcnJvcihgTm8gZGF0YSBjb3VsZCBiZSBmb3VuZCBmb3IgdGFyZ2V0IHZlcnNpb246ICR7dmVyc2lvbn1gKTtcbiAgfVxuXG4gIHJldHVybiAoZGF0YVt0YXJnZXRdIHx8IFtdKS5yZWR1Y2UoKHJlc3VsdCwgcHJEYXRhKSA9PiByZXN1bHQuY29uY2F0KHByRGF0YS5jaGFuZ2VzKSwgW10gYXMgVFtdKTtcbn1cblxuLyoqXG4gKiBHZXRzIGFsbCBjaGFuZ2VzIGZyb20gdGhlIHNwZWNpZmllZCB2ZXJzaW9uIGNoYW5nZXMgb2JqZWN0LiBUaGlzIGlzIGhlbHBmdWwgaW4gY2FzZSBhIG1pZ3JhdGlvblxuICogcnVsZSBkb2VzIG5vdCBkaXN0aW5ndWlzaCBkYXRhIGJhc2VkIG9uIHRoZSB0YXJnZXQgdmVyc2lvbiwgYnV0IGZvciByZWFkYWJpbGl0eSB0aGVcbiAqIHVwZ3JhZGUgZGF0YSBpcyBzZXBhcmF0ZWQgZm9yIGVhY2ggdGFyZ2V0IHZlcnNpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRBbGxDaGFuZ2VzPFQ+KGRhdGE6IFZlcnNpb25DaGFuZ2VzPFQ+KTogVFtdIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKGRhdGEpXG4gICAgLm1hcCh0YXJnZXRWZXJzaW9uID0+IGdldENoYW5nZXNGb3JUYXJnZXQodGFyZ2V0VmVyc2lvbiBhcyBUYXJnZXRWZXJzaW9uLCBkYXRhKSlcbiAgICAucmVkdWNlKChyZXN1bHQsIHZlcnNpb25EYXRhKSA9PiByZXN1bHQuY29uY2F0KHZlcnNpb25EYXRhKSwgW10pO1xufVxuIl19