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
        define("@angular/cdk/schematics/update-tool/version-changes", ["require", "exports", "@angular-devkit/schematics", "@angular/cdk/schematics/update-tool/target-version"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const target_version_1 = require("@angular/cdk/schematics/update-tool/target-version");
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
            throw new schematics_1.SchematicsException(`No data could be found for target version: ${target_version_1.TargetVersion[target]}`);
        }
        if (!data[target]) {
            return [];
        }
        return data[target].reduce((result, prData) => result.concat(prData.changes), []);
    }
    exports.getChangesForTarget = getChangesForTarget;
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
    exports.getAllChanges = getAllChanges;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyc2lvbi1jaGFuZ2VzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL3VwZGF0ZS10b29sL3ZlcnNpb24tY2hhbmdlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILDJEQUErRDtJQUMvRCx1RkFBK0M7SUFhL0M7Ozs7Ozs7T0FPRztJQUNILFNBQWdCLG1CQUFtQixDQUFJLE1BQXFCLEVBQUUsSUFBdUI7UUFDbkYsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNULE1BQU0sSUFBSSxnQ0FBbUIsQ0FDekIsOENBQThDLDhCQUFhLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQzVFO1FBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUNqQixPQUFPLEVBQUUsQ0FBQztTQUNYO1FBRUQsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBUyxDQUFDLENBQUM7SUFDNUYsQ0FBQztJQVhELGtEQVdDO0lBRUQ7Ozs7T0FJRztJQUNILFNBQWdCLGFBQWEsQ0FBSSxJQUF1QjtRQUN0RCxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO2FBQ25CLEdBQUcsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLG1CQUFtQixDQUFDLGFBQThCLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDL0UsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFFLFdBQVcsRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN2RSxDQUFDO0lBSkQsc0NBSUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTY2hlbWF0aWNzRXhjZXB0aW9ufSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge1RhcmdldFZlcnNpb259IGZyb20gJy4vdGFyZ2V0LXZlcnNpb24nO1xuXG5leHBvcnQgdHlwZSBWZXJzaW9uQ2hhbmdlczxUPiA9IHtcbiAgW3RhcmdldCBpbiBUYXJnZXRWZXJzaW9uXT86IFJlYWRhYmxlQ2hhbmdlPFQ+W107XG59O1xuXG5leHBvcnQgdHlwZSBSZWFkYWJsZUNoYW5nZTxUPiA9IHtcbiAgcHI6IHN0cmluZzsgY2hhbmdlczogVFtdXG59O1xuXG4vKiogQ29uZGl0aW9uYWwgdHlwZSB0aGF0IHVud3JhcHMgdGhlIHZhbHVlIG9mIGEgdmVyc2lvbiBjaGFuZ2VzIHR5cGUuICovXG5leHBvcnQgdHlwZSBWYWx1ZU9mQ2hhbmdlczxUPiA9IFQgZXh0ZW5kcyBWZXJzaW9uQ2hhbmdlczxpbmZlciBYPj8gWCA6IG51bGw7XG5cbi8qKlxuICogR2V0cyB0aGUgY2hhbmdlcyBmb3IgYSBnaXZlbiB0YXJnZXQgdmVyc2lvbiBmcm9tIHRoZSBzcGVjaWZpZWQgdmVyc2lvbiBjaGFuZ2VzIG9iamVjdC5cbiAqXG4gKiBGb3IgcmVhZGFiaWxpdHkgYW5kIGEgZ29vZCBvdmVydmlldyBvZiBicmVha2luZyBjaGFuZ2VzLCB0aGUgdmVyc2lvbiBjaGFuZ2UgZGF0YSBhbHdheXNcbiAqIGluY2x1ZGVzIHRoZSByZWxhdGVkIFB1bGwgUmVxdWVzdCBsaW5rLiBTaW5jZSB0aGlzIGRhdGEgaXMgbm90IG5lZWRlZCB3aGVuIHBlcmZvcm1pbmcgdGhlXG4gKiB1cGdyYWRlLCB0aGlzIHVudXNlZCBkYXRhIGNhbiBiZSByZW1vdmVkIGFuZCB0aGUgY2hhbmdlcyBkYXRhIGNhbiBiZSBmbGF0dGVuZWQgaW50byBhblxuICogZWFzeSBpdGVyYWJsZSBhcnJheS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENoYW5nZXNGb3JUYXJnZXQ8VD4odGFyZ2V0OiBUYXJnZXRWZXJzaW9uLCBkYXRhOiBWZXJzaW9uQ2hhbmdlczxUPik6IFRbXSB7XG4gIGlmICghZGF0YSkge1xuICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgICBgTm8gZGF0YSBjb3VsZCBiZSBmb3VuZCBmb3IgdGFyZ2V0IHZlcnNpb246ICR7VGFyZ2V0VmVyc2lvblt0YXJnZXRdfWApO1xuICB9XG5cbiAgaWYgKCFkYXRhW3RhcmdldF0pIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICByZXR1cm4gZGF0YVt0YXJnZXRdIS5yZWR1Y2UoKHJlc3VsdCwgcHJEYXRhKSA9PiByZXN1bHQuY29uY2F0KHByRGF0YS5jaGFuZ2VzKSwgW10gYXMgVFtdKTtcbn1cblxuLyoqXG4gKiBHZXRzIGFsbCBjaGFuZ2VzIGZyb20gdGhlIHNwZWNpZmllZCB2ZXJzaW9uIGNoYW5nZXMgb2JqZWN0LiBUaGlzIGlzIGhlbHBmdWwgaW4gY2FzZSBhIG1pZ3JhdGlvblxuICogcnVsZSBkb2VzIG5vdCBkaXN0aW5ndWlzaCBkYXRhIGJhc2VkIG9uIHRoZSB0YXJnZXQgdmVyc2lvbiwgYnV0IGZvciByZWFkYWJpbGl0eSB0aGVcbiAqIHVwZ3JhZGUgZGF0YSBpcyBzZXBhcmF0ZWQgZm9yIGVhY2ggdGFyZ2V0IHZlcnNpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRBbGxDaGFuZ2VzPFQ+KGRhdGE6IFZlcnNpb25DaGFuZ2VzPFQ+KTogVFtdIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKGRhdGEpXG4gICAgICAubWFwKHRhcmdldFZlcnNpb24gPT4gZ2V0Q2hhbmdlc0ZvclRhcmdldCh0YXJnZXRWZXJzaW9uIGFzIFRhcmdldFZlcnNpb24sIGRhdGEpKVxuICAgICAgLnJlZHVjZSgocmVzdWx0LCB2ZXJzaW9uRGF0YSkgPT4gcmVzdWx0LmNvbmNhdCh2ZXJzaW9uRGF0YSksIFtdKTtcbn1cbiJdfQ==