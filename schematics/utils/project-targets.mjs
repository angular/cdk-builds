"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectTargetOptions = getProjectTargetOptions;
exports.getProjectBuildTargets = getProjectBuildTargets;
exports.getProjectTestTargets = getProjectTestTargets;
const schematics_1 = require("@angular-devkit/schematics");
/** Resolves the architect options for the build target of the given project. */
function getProjectTargetOptions(project, buildTarget) {
    const options = project.targets?.get(buildTarget)?.options;
    if (!options) {
        throw new schematics_1.SchematicsException(`Cannot determine project target configuration for: ${buildTarget}.`);
    }
    return options;
}
/** Gets all of the default CLI-provided build targets in a project. */
function getProjectBuildTargets(project) {
    return getTargetsByBuilderName(project, builder => builder === '@angular-devkit/build-angular:application' ||
        builder === '@angular-devkit/build-angular:browser' ||
        builder === '@angular-devkit/build-angular:browser-esbuild');
}
/** Gets all of the default CLI-provided testing targets in a project. */
function getProjectTestTargets(project) {
    return getTargetsByBuilderName(project, builder => builder === '@angular-devkit/build-angular:karma');
}
/** Gets all targets from the given project that pass a predicate check. */
function getTargetsByBuilderName(project, predicate) {
    return Array.from(project.targets.keys())
        .filter(name => predicate(project.targets.get(name)?.builder))
        .map(name => project.targets.get(name));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdC10YXJnZXRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL3V0aWxzL3Byb2plY3QtdGFyZ2V0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQU1ILDBEQWFDO0FBR0Qsd0RBVUM7QUFHRCxzREFPQztBQXZDRCwyREFBK0Q7QUFFL0QsZ0ZBQWdGO0FBQ2hGLFNBQWdCLHVCQUF1QixDQUNyQyxPQUFxQyxFQUNyQyxXQUFtQjtJQUVuQixNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxPQUFPLENBQUM7SUFFM0QsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2IsTUFBTSxJQUFJLGdDQUFtQixDQUMzQixzREFBc0QsV0FBVyxHQUFHLENBQ3JFLENBQUM7SUFDSixDQUFDO0lBRUQsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQztBQUVELHVFQUF1RTtBQUN2RSxTQUFnQixzQkFBc0IsQ0FDcEMsT0FBcUM7SUFFckMsT0FBTyx1QkFBdUIsQ0FDNUIsT0FBTyxFQUNQLE9BQU8sQ0FBQyxFQUFFLENBQ1IsT0FBTyxLQUFLLDJDQUEyQztRQUN2RCxPQUFPLEtBQUssdUNBQXVDO1FBQ25ELE9BQU8sS0FBSywrQ0FBK0MsQ0FDOUQsQ0FBQztBQUNKLENBQUM7QUFFRCx5RUFBeUU7QUFDekUsU0FBZ0IscUJBQXFCLENBQ25DLE9BQXFDO0lBRXJDLE9BQU8sdUJBQXVCLENBQzVCLE9BQU8sRUFDUCxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sS0FBSyxxQ0FBcUMsQ0FDN0QsQ0FBQztBQUNKLENBQUM7QUFFRCwyRUFBMkU7QUFDM0UsU0FBUyx1QkFBdUIsQ0FDOUIsT0FBcUMsRUFDckMsU0FBZ0Q7SUFFaEQsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDdEMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQzdELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBRSxDQUFDLENBQUM7QUFDN0MsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmRldi9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtKc29uVmFsdWUsIHdvcmtzcGFjZXN9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7U2NoZW1hdGljc0V4Y2VwdGlvbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuXG4vKiogUmVzb2x2ZXMgdGhlIGFyY2hpdGVjdCBvcHRpb25zIGZvciB0aGUgYnVpbGQgdGFyZ2V0IG9mIHRoZSBnaXZlbiBwcm9qZWN0LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFByb2plY3RUYXJnZXRPcHRpb25zKFxuICBwcm9qZWN0OiB3b3Jrc3BhY2VzLlByb2plY3REZWZpbml0aW9uLFxuICBidWlsZFRhcmdldDogc3RyaW5nLFxuKTogUmVjb3JkPHN0cmluZywgSnNvblZhbHVlIHwgdW5kZWZpbmVkPiB7XG4gIGNvbnN0IG9wdGlvbnMgPSBwcm9qZWN0LnRhcmdldHM/LmdldChidWlsZFRhcmdldCk/Lm9wdGlvbnM7XG5cbiAgaWYgKCFvcHRpb25zKSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICBgQ2Fubm90IGRldGVybWluZSBwcm9qZWN0IHRhcmdldCBjb25maWd1cmF0aW9uIGZvcjogJHtidWlsZFRhcmdldH0uYCxcbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIG9wdGlvbnM7XG59XG5cbi8qKiBHZXRzIGFsbCBvZiB0aGUgZGVmYXVsdCBDTEktcHJvdmlkZWQgYnVpbGQgdGFyZ2V0cyBpbiBhIHByb2plY3QuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvamVjdEJ1aWxkVGFyZ2V0cyhcbiAgcHJvamVjdDogd29ya3NwYWNlcy5Qcm9qZWN0RGVmaW5pdGlvbixcbik6IHdvcmtzcGFjZXMuVGFyZ2V0RGVmaW5pdGlvbltdIHtcbiAgcmV0dXJuIGdldFRhcmdldHNCeUJ1aWxkZXJOYW1lKFxuICAgIHByb2plY3QsXG4gICAgYnVpbGRlciA9PlxuICAgICAgYnVpbGRlciA9PT0gJ0Bhbmd1bGFyLWRldmtpdC9idWlsZC1hbmd1bGFyOmFwcGxpY2F0aW9uJyB8fFxuICAgICAgYnVpbGRlciA9PT0gJ0Bhbmd1bGFyLWRldmtpdC9idWlsZC1hbmd1bGFyOmJyb3dzZXInIHx8XG4gICAgICBidWlsZGVyID09PSAnQGFuZ3VsYXItZGV2a2l0L2J1aWxkLWFuZ3VsYXI6YnJvd3Nlci1lc2J1aWxkJyxcbiAgKTtcbn1cblxuLyoqIEdldHMgYWxsIG9mIHRoZSBkZWZhdWx0IENMSS1wcm92aWRlZCB0ZXN0aW5nIHRhcmdldHMgaW4gYSBwcm9qZWN0LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFByb2plY3RUZXN0VGFyZ2V0cyhcbiAgcHJvamVjdDogd29ya3NwYWNlcy5Qcm9qZWN0RGVmaW5pdGlvbixcbik6IHdvcmtzcGFjZXMuVGFyZ2V0RGVmaW5pdGlvbltdIHtcbiAgcmV0dXJuIGdldFRhcmdldHNCeUJ1aWxkZXJOYW1lKFxuICAgIHByb2plY3QsXG4gICAgYnVpbGRlciA9PiBidWlsZGVyID09PSAnQGFuZ3VsYXItZGV2a2l0L2J1aWxkLWFuZ3VsYXI6a2FybWEnLFxuICApO1xufVxuXG4vKiogR2V0cyBhbGwgdGFyZ2V0cyBmcm9tIHRoZSBnaXZlbiBwcm9qZWN0IHRoYXQgcGFzcyBhIHByZWRpY2F0ZSBjaGVjay4gKi9cbmZ1bmN0aW9uIGdldFRhcmdldHNCeUJ1aWxkZXJOYW1lKFxuICBwcm9qZWN0OiB3b3Jrc3BhY2VzLlByb2plY3REZWZpbml0aW9uLFxuICBwcmVkaWNhdGU6IChuYW1lOiBzdHJpbmcgfCB1bmRlZmluZWQpID0+IGJvb2xlYW4sXG4pOiB3b3Jrc3BhY2VzLlRhcmdldERlZmluaXRpb25bXSB7XG4gIHJldHVybiBBcnJheS5mcm9tKHByb2plY3QudGFyZ2V0cy5rZXlzKCkpXG4gICAgLmZpbHRlcihuYW1lID0+IHByZWRpY2F0ZShwcm9qZWN0LnRhcmdldHMuZ2V0KG5hbWUpPy5idWlsZGVyKSlcbiAgICAubWFwKG5hbWUgPT4gcHJvamVjdC50YXJnZXRzLmdldChuYW1lKSEpO1xufVxuIl19