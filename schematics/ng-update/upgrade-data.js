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
        define("@angular/cdk/schematics/ng-update/upgrade-data", ["require", "exports", "@angular/cdk/schematics/update-tool/version-changes", "@angular/cdk/schematics/ng-update/data/index"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const version_changes_1 = require("@angular/cdk/schematics/update-tool/version-changes");
    const data_1 = require("@angular/cdk/schematics/ng-update/data/index");
    /** Upgrade data for the Angular CDK. */
    exports.cdkUpgradeData = {
        attributeSelectors: data_1.attributeSelectors,
        classNames: data_1.classNames,
        constructorChecks: data_1.constructorChecks,
        cssSelectors: data_1.cssSelectors,
        elementSelectors: data_1.elementSelectors,
        inputNames: data_1.inputNames,
        methodCallChecks: data_1.methodCallChecks,
        outputNames: data_1.outputNames,
        propertyNames: data_1.propertyNames,
    };
    /**
     * Gets the reduced upgrade data for the specified data key from the rule walker options.
     *
     * The function reads out the target version and upgrade data object from the rule options and
     * resolves the specified data portion that is specifically tied to the target version.
     */
    function getVersionUpgradeData(r, dataName) {
        // Note that below we need to cast to `unknown` first TS doesn't infer the type of T correctly.
        return version_changes_1.getChangesForTarget(r.targetVersion, r.upgradeData[dataName]);
    }
    exports.getVersionUpgradeData = getVersionUpgradeData;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBncmFkZS1kYXRhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL25nLXVwZGF0ZS91cGdyYWRlLWRhdGEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFHSCx5RkFBbUc7SUFDbkcsdUVBbUJnQjtJQUdoQix3Q0FBd0M7SUFDM0IsUUFBQSxjQUFjLEdBQW9CO1FBQzdDLGtCQUFrQixFQUFsQix5QkFBa0I7UUFDbEIsVUFBVSxFQUFWLGlCQUFVO1FBQ1YsaUJBQWlCLEVBQWpCLHdCQUFpQjtRQUNqQixZQUFZLEVBQVosbUJBQVk7UUFDWixnQkFBZ0IsRUFBaEIsdUJBQWdCO1FBQ2hCLFVBQVUsRUFBVixpQkFBVTtRQUNWLGdCQUFnQixFQUFoQix1QkFBZ0I7UUFDaEIsV0FBVyxFQUFYLGtCQUFXO1FBQ1gsYUFBYSxFQUFiLG9CQUFhO0tBQ2QsQ0FBQztJQWtCRjs7Ozs7T0FLRztJQUNILFNBQ0EscUJBQXFCLENBQ2pCLENBQWlDLEVBQUUsUUFBVztRQUNoRCwrRkFBK0Y7UUFDL0YsT0FBTyxxQ0FBbUIsQ0FBSSxDQUFDLENBQUMsYUFBYSxFQUNmLENBQUMsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFpQyxDQUFDLENBQUM7SUFDekYsQ0FBQztJQU5ELHNEQU1DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7TWlncmF0aW9uUnVsZX0gZnJvbSAnLi4vdXBkYXRlLXRvb2wvbWlncmF0aW9uLXJ1bGUnO1xuaW1wb3J0IHtnZXRDaGFuZ2VzRm9yVGFyZ2V0LCBWYWx1ZU9mQ2hhbmdlcywgVmVyc2lvbkNoYW5nZXN9IGZyb20gJy4uL3VwZGF0ZS10b29sL3ZlcnNpb24tY2hhbmdlcyc7XG5pbXBvcnQge1xuICBhdHRyaWJ1dGVTZWxlY3RvcnMsXG4gIEF0dHJpYnV0ZVNlbGVjdG9yVXBncmFkZURhdGEsXG4gIGNsYXNzTmFtZXMsXG4gIENsYXNzTmFtZVVwZ3JhZGVEYXRhLFxuICBjb25zdHJ1Y3RvckNoZWNrcyxcbiAgQ29uc3RydWN0b3JDaGVja3NVcGdyYWRlRGF0YSxcbiAgY3NzU2VsZWN0b3JzLFxuICBDc3NTZWxlY3RvclVwZ3JhZGVEYXRhLFxuICBlbGVtZW50U2VsZWN0b3JzLFxuICBFbGVtZW50U2VsZWN0b3JVcGdyYWRlRGF0YSxcbiAgaW5wdXROYW1lcyxcbiAgSW5wdXROYW1lVXBncmFkZURhdGEsXG4gIG1ldGhvZENhbGxDaGVja3MsXG4gIE1ldGhvZENhbGxVcGdyYWRlRGF0YSxcbiAgb3V0cHV0TmFtZXMsXG4gIE91dHB1dE5hbWVVcGdyYWRlRGF0YSxcbiAgcHJvcGVydHlOYW1lcyxcbiAgUHJvcGVydHlOYW1lVXBncmFkZURhdGEsXG59IGZyb20gJy4vZGF0YSc7XG5cblxuLyoqIFVwZ3JhZGUgZGF0YSBmb3IgdGhlIEFuZ3VsYXIgQ0RLLiAqL1xuZXhwb3J0IGNvbnN0IGNka1VwZ3JhZGVEYXRhOiBSdWxlVXBncmFkZURhdGEgPSB7XG4gIGF0dHJpYnV0ZVNlbGVjdG9ycyxcbiAgY2xhc3NOYW1lcyxcbiAgY29uc3RydWN0b3JDaGVja3MsXG4gIGNzc1NlbGVjdG9ycyxcbiAgZWxlbWVudFNlbGVjdG9ycyxcbiAgaW5wdXROYW1lcyxcbiAgbWV0aG9kQ2FsbENoZWNrcyxcbiAgb3V0cHV0TmFtZXMsXG4gIHByb3BlcnR5TmFtZXMsXG59O1xuXG4vKipcbiAqIEludGVyZmFjZSB0aGF0IGRlc2NyaWJlcyB0aGUgdXBncmFkZSBkYXRhIHRoYXQgbmVlZHMgdG8gYmUgZGVmaW5lZCB3aGVuIHVzaW5nIHRoZSBDREtcbiAqIHVwZ3JhZGUgcnVsZXMuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUnVsZVVwZ3JhZGVEYXRhIHtcbiAgYXR0cmlidXRlU2VsZWN0b3JzOiBWZXJzaW9uQ2hhbmdlczxBdHRyaWJ1dGVTZWxlY3RvclVwZ3JhZGVEYXRhPjtcbiAgY2xhc3NOYW1lczogVmVyc2lvbkNoYW5nZXM8Q2xhc3NOYW1lVXBncmFkZURhdGE+O1xuICBjb25zdHJ1Y3RvckNoZWNrczogVmVyc2lvbkNoYW5nZXM8Q29uc3RydWN0b3JDaGVja3NVcGdyYWRlRGF0YT47XG4gIGNzc1NlbGVjdG9yczogVmVyc2lvbkNoYW5nZXM8Q3NzU2VsZWN0b3JVcGdyYWRlRGF0YT47XG4gIGVsZW1lbnRTZWxlY3RvcnM6IFZlcnNpb25DaGFuZ2VzPEVsZW1lbnRTZWxlY3RvclVwZ3JhZGVEYXRhPjtcbiAgaW5wdXROYW1lczogVmVyc2lvbkNoYW5nZXM8SW5wdXROYW1lVXBncmFkZURhdGE+O1xuICBtZXRob2RDYWxsQ2hlY2tzOiBWZXJzaW9uQ2hhbmdlczxNZXRob2RDYWxsVXBncmFkZURhdGE+O1xuICBvdXRwdXROYW1lczogVmVyc2lvbkNoYW5nZXM8T3V0cHV0TmFtZVVwZ3JhZGVEYXRhPjtcbiAgcHJvcGVydHlOYW1lczogVmVyc2lvbkNoYW5nZXM8UHJvcGVydHlOYW1lVXBncmFkZURhdGE+O1xufVxuXG4vKipcbiAqIEdldHMgdGhlIHJlZHVjZWQgdXBncmFkZSBkYXRhIGZvciB0aGUgc3BlY2lmaWVkIGRhdGEga2V5IGZyb20gdGhlIHJ1bGUgd2Fsa2VyIG9wdGlvbnMuXG4gKlxuICogVGhlIGZ1bmN0aW9uIHJlYWRzIG91dCB0aGUgdGFyZ2V0IHZlcnNpb24gYW5kIHVwZ3JhZGUgZGF0YSBvYmplY3QgZnJvbSB0aGUgcnVsZSBvcHRpb25zIGFuZFxuICogcmVzb2x2ZXMgdGhlIHNwZWNpZmllZCBkYXRhIHBvcnRpb24gdGhhdCBpcyBzcGVjaWZpY2FsbHkgdGllZCB0byB0aGUgdGFyZ2V0IHZlcnNpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvblxuZ2V0VmVyc2lvblVwZ3JhZGVEYXRhPFQgZXh0ZW5kcyBrZXlvZiBSdWxlVXBncmFkZURhdGEsIFUgPSBWYWx1ZU9mQ2hhbmdlczxSdWxlVXBncmFkZURhdGFbVF0+PihcbiAgICByOiBNaWdyYXRpb25SdWxlPFJ1bGVVcGdyYWRlRGF0YT4sIGRhdGFOYW1lOiBUKTogVVtdIHtcbiAgLy8gTm90ZSB0aGF0IGJlbG93IHdlIG5lZWQgdG8gY2FzdCB0byBgdW5rbm93bmAgZmlyc3QgVFMgZG9lc24ndCBpbmZlciB0aGUgdHlwZSBvZiBUIGNvcnJlY3RseS5cbiAgcmV0dXJuIGdldENoYW5nZXNGb3JUYXJnZXQ8VT4oci50YXJnZXRWZXJzaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByLnVwZ3JhZGVEYXRhW2RhdGFOYW1lXSBhcyB1bmtub3duIGFzIFZlcnNpb25DaGFuZ2VzPFU+KTtcbn1cbiJdfQ==