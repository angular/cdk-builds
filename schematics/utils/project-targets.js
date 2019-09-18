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
        define("@angular/cdk/schematics/utils/project-targets", ["require", "exports", "@angular-devkit/schematics"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    /** Resolves the architect options for the build target of the given project. */
    function getProjectTargetOptions(project, buildTarget) {
        if (project.targets &&
            project.targets[buildTarget] &&
            project.targets[buildTarget].options) {
            return project.targets[buildTarget].options;
        }
        // TODO(devversion): consider removing this architect check if the CLI completely switched
        // over to `targets`, and the `architect` support has been removed.
        // See: https://github.com/angular/angular-cli/commit/307160806cb48c95ecb8982854f452303801ac9f
        if (project.architect &&
            project.architect[buildTarget] &&
            project.architect[buildTarget].options) {
            return project.architect[buildTarget].options;
        }
        throw new schematics_1.SchematicsException(`Cannot determine project target configuration for: ${buildTarget}.`);
    }
    exports.getProjectTargetOptions = getProjectTargetOptions;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdC10YXJnZXRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL3V0aWxzL3Byb2plY3QtdGFyZ2V0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUdILDJEQUErRDtJQUUvRCxnRkFBZ0Y7SUFDaEYsU0FBZ0IsdUJBQXVCLENBQUMsT0FBeUIsRUFBRSxXQUFtQjtRQUNwRixJQUFJLE9BQU8sQ0FBQyxPQUFPO1lBQ2pCLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDO1lBQzVCLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsT0FBTyxFQUFFO1lBRXRDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxPQUFPLENBQUM7U0FDN0M7UUFFRCwwRkFBMEY7UUFDMUYsbUVBQW1FO1FBQ25FLDhGQUE4RjtRQUM5RixJQUFJLE9BQU8sQ0FBQyxTQUFTO1lBQ2pCLE9BQU8sQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDO1lBQzlCLE9BQU8sQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUMsT0FBTyxFQUFFO1lBRTFDLE9BQU8sT0FBTyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxPQUFPLENBQUM7U0FDL0M7UUFFRCxNQUFNLElBQUksZ0NBQW1CLENBQzNCLHNEQUFzRCxXQUFXLEdBQUcsQ0FBQyxDQUFDO0lBQzFFLENBQUM7SUFwQkQsMERBb0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7V29ya3NwYWNlUHJvamVjdH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUvc3JjL2V4cGVyaW1lbnRhbC93b3Jrc3BhY2UnO1xuaW1wb3J0IHtTY2hlbWF0aWNzRXhjZXB0aW9ufSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5cbi8qKiBSZXNvbHZlcyB0aGUgYXJjaGl0ZWN0IG9wdGlvbnMgZm9yIHRoZSBidWlsZCB0YXJnZXQgb2YgdGhlIGdpdmVuIHByb2plY3QuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvamVjdFRhcmdldE9wdGlvbnMocHJvamVjdDogV29ya3NwYWNlUHJvamVjdCwgYnVpbGRUYXJnZXQ6IHN0cmluZykge1xuICBpZiAocHJvamVjdC50YXJnZXRzICYmXG4gICAgcHJvamVjdC50YXJnZXRzW2J1aWxkVGFyZ2V0XSAmJlxuICAgIHByb2plY3QudGFyZ2V0c1tidWlsZFRhcmdldF0ub3B0aW9ucykge1xuXG4gICAgcmV0dXJuIHByb2plY3QudGFyZ2V0c1tidWlsZFRhcmdldF0ub3B0aW9ucztcbiAgfVxuXG4gIC8vIFRPRE8oZGV2dmVyc2lvbik6IGNvbnNpZGVyIHJlbW92aW5nIHRoaXMgYXJjaGl0ZWN0IGNoZWNrIGlmIHRoZSBDTEkgY29tcGxldGVseSBzd2l0Y2hlZFxuICAvLyBvdmVyIHRvIGB0YXJnZXRzYCwgYW5kIHRoZSBgYXJjaGl0ZWN0YCBzdXBwb3J0IGhhcyBiZWVuIHJlbW92ZWQuXG4gIC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci1jbGkvY29tbWl0LzMwNzE2MDgwNmNiNDhjOTVlY2I4OTgyODU0ZjQ1MjMwMzgwMWFjOWZcbiAgaWYgKHByb2plY3QuYXJjaGl0ZWN0ICYmXG4gICAgICBwcm9qZWN0LmFyY2hpdGVjdFtidWlsZFRhcmdldF0gJiZcbiAgICAgIHByb2plY3QuYXJjaGl0ZWN0W2J1aWxkVGFyZ2V0XS5vcHRpb25zKSB7XG5cbiAgICByZXR1cm4gcHJvamVjdC5hcmNoaXRlY3RbYnVpbGRUYXJnZXRdLm9wdGlvbnM7XG4gIH1cblxuICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICBgQ2Fubm90IGRldGVybWluZSBwcm9qZWN0IHRhcmdldCBjb25maWd1cmF0aW9uIGZvcjogJHtidWlsZFRhcmdldH0uYCk7XG59XG4iXX0=