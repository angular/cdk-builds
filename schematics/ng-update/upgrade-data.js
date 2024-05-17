"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVersionUpgradeData = exports.cdkUpgradeData = void 0;
const version_changes_1 = require("../update-tool/version-changes");
const data_1 = require("./data");
/** Upgrade data for the Angular CDK. */
exports.cdkUpgradeData = {
    attributeSelectors: data_1.attributeSelectors,
    classNames: data_1.classNames,
    constructorChecks: data_1.constructorChecks,
    cssSelectors: data_1.cssSelectors,
    cssTokens: data_1.cssTokens,
    elementSelectors: data_1.elementSelectors,
    inputNames: data_1.inputNames,
    methodCallChecks: data_1.methodCallChecks,
    outputNames: data_1.outputNames,
    propertyNames: data_1.propertyNames,
    symbolRemoval: data_1.symbolRemoval,
};
/**
 * Gets the reduced upgrade data for the specified data key. The function reads out the
 * target version and upgrade data object from the migration and resolves the specified
 * data portion that is specifically tied to the target version.
 */
function getVersionUpgradeData(migration, dataName) {
    if (migration.targetVersion === null) {
        return [];
    }
    // Note that below we need to cast to `unknown` first TS doesn't infer the type of T correctly.
    return (0, version_changes_1.getChangesForTarget)(migration.targetVersion, migration.upgradeData[dataName]);
}
exports.getVersionUpgradeData = getVersionUpgradeData;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBncmFkZS1kYXRhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL25nLXVwZGF0ZS91cGdyYWRlLWRhdGEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBR0gsb0VBQW1HO0FBQ25HLGlDQXVCZ0I7QUFFaEIsd0NBQXdDO0FBQzNCLFFBQUEsY0FBYyxHQUFnQjtJQUN6QyxrQkFBa0IsRUFBbEIseUJBQWtCO0lBQ2xCLFVBQVUsRUFBVixpQkFBVTtJQUNWLGlCQUFpQixFQUFqQix3QkFBaUI7SUFDakIsWUFBWSxFQUFaLG1CQUFZO0lBQ1osU0FBUyxFQUFULGdCQUFTO0lBQ1QsZ0JBQWdCLEVBQWhCLHVCQUFnQjtJQUNoQixVQUFVLEVBQVYsaUJBQVU7SUFDVixnQkFBZ0IsRUFBaEIsdUJBQWdCO0lBQ2hCLFdBQVcsRUFBWCxrQkFBVztJQUNYLGFBQWEsRUFBYixvQkFBYTtJQUNiLGFBQWEsRUFBYixvQkFBYTtDQUNkLENBQUM7QUFvQkY7Ozs7R0FJRztBQUNILFNBQWdCLHFCQUFxQixDQUduQyxTQUFpQyxFQUFFLFFBQVc7SUFDOUMsSUFBSSxTQUFTLENBQUMsYUFBYSxLQUFLLElBQUksRUFBRSxDQUFDO1FBQ3JDLE9BQU8sRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUVELCtGQUErRjtJQUMvRixPQUFPLElBQUEscUNBQW1CLEVBQ3hCLFNBQVMsQ0FBQyxhQUFhLEVBQ3ZCLFNBQVMsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFpQyxDQUNoRSxDQUFDO0FBQ0osQ0FBQztBQWJELHNEQWFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7TWlncmF0aW9ufSBmcm9tICcuLi91cGRhdGUtdG9vbC9taWdyYXRpb24nO1xuaW1wb3J0IHtnZXRDaGFuZ2VzRm9yVGFyZ2V0LCBWYWx1ZU9mQ2hhbmdlcywgVmVyc2lvbkNoYW5nZXN9IGZyb20gJy4uL3VwZGF0ZS10b29sL3ZlcnNpb24tY2hhbmdlcyc7XG5pbXBvcnQge1xuICBhdHRyaWJ1dGVTZWxlY3RvcnMsXG4gIEF0dHJpYnV0ZVNlbGVjdG9yVXBncmFkZURhdGEsXG4gIGNsYXNzTmFtZXMsXG4gIENsYXNzTmFtZVVwZ3JhZGVEYXRhLFxuICBjb25zdHJ1Y3RvckNoZWNrcyxcbiAgQ29uc3RydWN0b3JDaGVja3NVcGdyYWRlRGF0YSxcbiAgY3NzU2VsZWN0b3JzLFxuICBDc3NTZWxlY3RvclVwZ3JhZGVEYXRhLFxuICBlbGVtZW50U2VsZWN0b3JzLFxuICBFbGVtZW50U2VsZWN0b3JVcGdyYWRlRGF0YSxcbiAgaW5wdXROYW1lcyxcbiAgSW5wdXROYW1lVXBncmFkZURhdGEsXG4gIG1ldGhvZENhbGxDaGVja3MsXG4gIE1ldGhvZENhbGxVcGdyYWRlRGF0YSxcbiAgb3V0cHV0TmFtZXMsXG4gIE91dHB1dE5hbWVVcGdyYWRlRGF0YSxcbiAgcHJvcGVydHlOYW1lcyxcbiAgUHJvcGVydHlOYW1lVXBncmFkZURhdGEsXG4gIFN5bWJvbFJlbW92YWxVcGdyYWRlRGF0YSxcbiAgc3ltYm9sUmVtb3ZhbCxcbiAgY3NzVG9rZW5zLFxuICBDc3NUb2tlblVwZ3JhZGVEYXRhLFxufSBmcm9tICcuL2RhdGEnO1xuXG4vKiogVXBncmFkZSBkYXRhIGZvciB0aGUgQW5ndWxhciBDREsuICovXG5leHBvcnQgY29uc3QgY2RrVXBncmFkZURhdGE6IFVwZ3JhZGVEYXRhID0ge1xuICBhdHRyaWJ1dGVTZWxlY3RvcnMsXG4gIGNsYXNzTmFtZXMsXG4gIGNvbnN0cnVjdG9yQ2hlY2tzLFxuICBjc3NTZWxlY3RvcnMsXG4gIGNzc1Rva2VucyxcbiAgZWxlbWVudFNlbGVjdG9ycyxcbiAgaW5wdXROYW1lcyxcbiAgbWV0aG9kQ2FsbENoZWNrcyxcbiAgb3V0cHV0TmFtZXMsXG4gIHByb3BlcnR5TmFtZXMsXG4gIHN5bWJvbFJlbW92YWwsXG59O1xuXG4vKipcbiAqIEludGVyZmFjZSB0aGF0IGRlc2NyaWJlcyB0aGUgdXBncmFkZSBkYXRhIHRoYXQgbmVlZHMgdG8gYmUgZGVmaW5lZCB3aGVuIHVzaW5nIHRoZSBDREtcbiAqIHVwZ3JhZGUgcnVsZXMuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVXBncmFkZURhdGEge1xuICBhdHRyaWJ1dGVTZWxlY3RvcnM6IFZlcnNpb25DaGFuZ2VzPEF0dHJpYnV0ZVNlbGVjdG9yVXBncmFkZURhdGE+O1xuICBjbGFzc05hbWVzOiBWZXJzaW9uQ2hhbmdlczxDbGFzc05hbWVVcGdyYWRlRGF0YT47XG4gIGNvbnN0cnVjdG9yQ2hlY2tzOiBWZXJzaW9uQ2hhbmdlczxDb25zdHJ1Y3RvckNoZWNrc1VwZ3JhZGVEYXRhPjtcbiAgY3NzU2VsZWN0b3JzOiBWZXJzaW9uQ2hhbmdlczxDc3NTZWxlY3RvclVwZ3JhZGVEYXRhPjtcbiAgY3NzVG9rZW5zOiBWZXJzaW9uQ2hhbmdlczxDc3NUb2tlblVwZ3JhZGVEYXRhPjtcbiAgZWxlbWVudFNlbGVjdG9yczogVmVyc2lvbkNoYW5nZXM8RWxlbWVudFNlbGVjdG9yVXBncmFkZURhdGE+O1xuICBpbnB1dE5hbWVzOiBWZXJzaW9uQ2hhbmdlczxJbnB1dE5hbWVVcGdyYWRlRGF0YT47XG4gIG1ldGhvZENhbGxDaGVja3M6IFZlcnNpb25DaGFuZ2VzPE1ldGhvZENhbGxVcGdyYWRlRGF0YT47XG4gIG91dHB1dE5hbWVzOiBWZXJzaW9uQ2hhbmdlczxPdXRwdXROYW1lVXBncmFkZURhdGE+O1xuICBwcm9wZXJ0eU5hbWVzOiBWZXJzaW9uQ2hhbmdlczxQcm9wZXJ0eU5hbWVVcGdyYWRlRGF0YT47XG4gIHN5bWJvbFJlbW92YWw6IFZlcnNpb25DaGFuZ2VzPFN5bWJvbFJlbW92YWxVcGdyYWRlRGF0YT47XG59XG5cbi8qKlxuICogR2V0cyB0aGUgcmVkdWNlZCB1cGdyYWRlIGRhdGEgZm9yIHRoZSBzcGVjaWZpZWQgZGF0YSBrZXkuIFRoZSBmdW5jdGlvbiByZWFkcyBvdXQgdGhlXG4gKiB0YXJnZXQgdmVyc2lvbiBhbmQgdXBncmFkZSBkYXRhIG9iamVjdCBmcm9tIHRoZSBtaWdyYXRpb24gYW5kIHJlc29sdmVzIHRoZSBzcGVjaWZpZWRcbiAqIGRhdGEgcG9ydGlvbiB0aGF0IGlzIHNwZWNpZmljYWxseSB0aWVkIHRvIHRoZSB0YXJnZXQgdmVyc2lvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFZlcnNpb25VcGdyYWRlRGF0YTxcbiAgVCBleHRlbmRzIGtleW9mIFVwZ3JhZGVEYXRhLFxuICBVID0gVmFsdWVPZkNoYW5nZXM8VXBncmFkZURhdGFbVF0+LFxuPihtaWdyYXRpb246IE1pZ3JhdGlvbjxVcGdyYWRlRGF0YT4sIGRhdGFOYW1lOiBUKTogVVtdIHtcbiAgaWYgKG1pZ3JhdGlvbi50YXJnZXRWZXJzaW9uID09PSBudWxsKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgLy8gTm90ZSB0aGF0IGJlbG93IHdlIG5lZWQgdG8gY2FzdCB0byBgdW5rbm93bmAgZmlyc3QgVFMgZG9lc24ndCBpbmZlciB0aGUgdHlwZSBvZiBUIGNvcnJlY3RseS5cbiAgcmV0dXJuIGdldENoYW5nZXNGb3JUYXJnZXQ8VT4oXG4gICAgbWlncmF0aW9uLnRhcmdldFZlcnNpb24sXG4gICAgbWlncmF0aW9uLnVwZ3JhZGVEYXRhW2RhdGFOYW1lXSBhcyB1bmtub3duIGFzIFZlcnNpb25DaGFuZ2VzPFU+LFxuICApO1xufVxuIl19