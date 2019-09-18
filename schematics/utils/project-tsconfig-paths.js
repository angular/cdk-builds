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
        define("@angular/cdk/schematics/utils/project-tsconfig-paths", ["require", "exports", "@angular-devkit/core"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const core_1 = require("@angular-devkit/core");
    /** Name of the default Angular CLI workspace configuration files. */
    const defaultWorkspaceConfigPaths = ['/angular.json', '/.angular.json'];
    /**
     * Gets all tsconfig paths from a CLI project by reading the workspace configuration
     * and looking for common tsconfig locations.
     */
    function getProjectTsConfigPaths(tree) {
        // Start with some tsconfig paths that are generally used within CLI projects. Note
        // that we are not interested in IDE-specific tsconfig files (e.g. /tsconfig.json)
        const buildPaths = new Set([]);
        const testPaths = new Set([]);
        // Add any tsconfig directly referenced in a build or test task of the angular.json workspace.
        const workspace = getWorkspaceConfigGracefully(tree);
        if (workspace) {
            const projects = Object.keys(workspace.projects).map(name => workspace.projects[name]);
            for (const project of projects) {
                const buildPath = getTargetTsconfigPath(project, 'build');
                const testPath = getTargetTsconfigPath(project, 'test');
                if (buildPath) {
                    buildPaths.add(buildPath);
                }
                if (testPath) {
                    testPaths.add(testPath);
                }
            }
        }
        // Filter out tsconfig files that don't exist in the CLI project.
        return {
            buildPaths: Array.from(buildPaths).filter(p => tree.exists(p)),
            testPaths: Array.from(testPaths).filter(p => tree.exists(p)),
        };
    }
    exports.getProjectTsConfigPaths = getProjectTsConfigPaths;
    /** Gets the tsconfig path from the given target within the specified project. */
    function getTargetTsconfigPath(project, targetName) {
        if (project.targets && project.targets[targetName] && project.targets[targetName].options &&
            project.targets[targetName].options.tsConfig) {
            return core_1.normalize(project.targets[targetName].options.tsConfig);
        }
        if (project.architect && project.architect[targetName] && project.architect[targetName].options &&
            project.architect[targetName].options.tsConfig) {
            return core_1.normalize(project.architect[targetName].options.tsConfig);
        }
        return null;
    }
    /**
     * Resolve the workspace configuration of the specified tree gracefully. We cannot use the utility
     * functions from the default Angular schematics because those might not be present in older
     * versions of the CLI. Also it's important to resolve the workspace gracefully because
     * the CLI project could be still using `.angular-cli.json` instead of thew new config.
     */
    function getWorkspaceConfigGracefully(tree) {
        const path = defaultWorkspaceConfigPaths.find(filePath => tree.exists(filePath));
        const configBuffer = tree.read(path);
        if (!path || !configBuffer) {
            return null;
        }
        try {
            // Parse the workspace file as JSON5 which is also supported for CLI
            // workspace configurations.
            return core_1.parseJson(configBuffer.toString(), core_1.JsonParseMode.Json5);
        }
        catch (e) {
            return null;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdC10c2NvbmZpZy1wYXRocy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2NoZW1hdGljcy91dGlscy9wcm9qZWN0LXRzY29uZmlnLXBhdGhzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsK0NBQXlFO0lBSXpFLHFFQUFxRTtJQUNyRSxNQUFNLDJCQUEyQixHQUFHLENBQUMsZUFBZSxFQUFFLGdCQUFnQixDQUFDLENBQUM7SUFFeEU7OztPQUdHO0lBQ0gsU0FBZ0IsdUJBQXVCLENBQUMsSUFBVTtRQUNoRCxtRkFBbUY7UUFDbkYsa0ZBQWtGO1FBQ2xGLE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxDQUFTLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sU0FBUyxHQUFHLElBQUksR0FBRyxDQUFTLEVBQUUsQ0FBQyxDQUFDO1FBRXRDLDhGQUE4RjtRQUM5RixNQUFNLFNBQVMsR0FBRyw0QkFBNEIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVyRCxJQUFJLFNBQVMsRUFBRTtZQUNiLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN2RixLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRTtnQkFDOUIsTUFBTSxTQUFTLEdBQUcscUJBQXFCLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUMxRCxNQUFNLFFBQVEsR0FBRyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBRXhELElBQUksU0FBUyxFQUFFO29CQUNiLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7aUJBQzNCO2dCQUVELElBQUksUUFBUSxFQUFFO29CQUNaLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7aUJBQ3pCO2FBQ0Y7U0FDRjtRQUVELGlFQUFpRTtRQUNqRSxPQUFPO1lBQ0wsVUFBVSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5RCxTQUFTLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQzdELENBQUM7SUFDSixDQUFDO0lBOUJELDBEQThCQztJQUVELGlGQUFpRjtJQUNqRixTQUFTLHFCQUFxQixDQUFDLE9BQXlCLEVBQUUsVUFBa0I7UUFDMUUsSUFBSSxPQUFPLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPO1lBQ3JGLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRTtZQUNoRCxPQUFPLGdCQUFTLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDaEU7UUFFRCxJQUFJLE9BQU8sQ0FBQyxTQUFTLElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsSUFBSSxPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU87WUFDM0YsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFO1lBQ2xELE9BQU8sZ0JBQVMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUNsRTtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsU0FBUyw0QkFBNEIsQ0FBQyxJQUFVO1FBQzlDLE1BQU0sSUFBSSxHQUFHLDJCQUEyQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUNqRixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUssQ0FBQyxDQUFDO1FBRXRDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUU7WUFDMUIsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELElBQUk7WUFDRixvRUFBb0U7WUFDcEUsNEJBQTRCO1lBQzVCLE9BQU8sZ0JBQVMsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLEVBQUUsb0JBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNoRTtRQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ1YsT0FBTyxJQUFJLENBQUM7U0FDYjtJQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtKc29uUGFyc2VNb2RlLCBub3JtYWxpemUsIHBhcnNlSnNvbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge1dvcmtzcGFjZVByb2plY3R9IGZyb20gJ0BzY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eS93b3Jrc3BhY2UtbW9kZWxzJztcblxuLyoqIE5hbWUgb2YgdGhlIGRlZmF1bHQgQW5ndWxhciBDTEkgd29ya3NwYWNlIGNvbmZpZ3VyYXRpb24gZmlsZXMuICovXG5jb25zdCBkZWZhdWx0V29ya3NwYWNlQ29uZmlnUGF0aHMgPSBbJy9hbmd1bGFyLmpzb24nLCAnLy5hbmd1bGFyLmpzb24nXTtcblxuLyoqXG4gKiBHZXRzIGFsbCB0c2NvbmZpZyBwYXRocyBmcm9tIGEgQ0xJIHByb2plY3QgYnkgcmVhZGluZyB0aGUgd29ya3NwYWNlIGNvbmZpZ3VyYXRpb25cbiAqIGFuZCBsb29raW5nIGZvciBjb21tb24gdHNjb25maWcgbG9jYXRpb25zLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvamVjdFRzQ29uZmlnUGF0aHModHJlZTogVHJlZSk6IHtidWlsZFBhdGhzOiBzdHJpbmdbXSwgdGVzdFBhdGhzOiBzdHJpbmdbXX0ge1xuICAvLyBTdGFydCB3aXRoIHNvbWUgdHNjb25maWcgcGF0aHMgdGhhdCBhcmUgZ2VuZXJhbGx5IHVzZWQgd2l0aGluIENMSSBwcm9qZWN0cy4gTm90ZVxuICAvLyB0aGF0IHdlIGFyZSBub3QgaW50ZXJlc3RlZCBpbiBJREUtc3BlY2lmaWMgdHNjb25maWcgZmlsZXMgKGUuZy4gL3RzY29uZmlnLmpzb24pXG4gIGNvbnN0IGJ1aWxkUGF0aHMgPSBuZXcgU2V0PHN0cmluZz4oW10pO1xuICBjb25zdCB0ZXN0UGF0aHMgPSBuZXcgU2V0PHN0cmluZz4oW10pO1xuXG4gIC8vIEFkZCBhbnkgdHNjb25maWcgZGlyZWN0bHkgcmVmZXJlbmNlZCBpbiBhIGJ1aWxkIG9yIHRlc3QgdGFzayBvZiB0aGUgYW5ndWxhci5qc29uIHdvcmtzcGFjZS5cbiAgY29uc3Qgd29ya3NwYWNlID0gZ2V0V29ya3NwYWNlQ29uZmlnR3JhY2VmdWxseSh0cmVlKTtcblxuICBpZiAod29ya3NwYWNlKSB7XG4gICAgY29uc3QgcHJvamVjdHMgPSBPYmplY3Qua2V5cyh3b3Jrc3BhY2UucHJvamVjdHMpLm1hcChuYW1lID0+IHdvcmtzcGFjZS5wcm9qZWN0c1tuYW1lXSk7XG4gICAgZm9yIChjb25zdCBwcm9qZWN0IG9mIHByb2plY3RzKSB7XG4gICAgICBjb25zdCBidWlsZFBhdGggPSBnZXRUYXJnZXRUc2NvbmZpZ1BhdGgocHJvamVjdCwgJ2J1aWxkJyk7XG4gICAgICBjb25zdCB0ZXN0UGF0aCA9IGdldFRhcmdldFRzY29uZmlnUGF0aChwcm9qZWN0LCAndGVzdCcpO1xuXG4gICAgICBpZiAoYnVpbGRQYXRoKSB7XG4gICAgICAgIGJ1aWxkUGF0aHMuYWRkKGJ1aWxkUGF0aCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0ZXN0UGF0aCkge1xuICAgICAgICB0ZXN0UGF0aHMuYWRkKHRlc3RQYXRoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBGaWx0ZXIgb3V0IHRzY29uZmlnIGZpbGVzIHRoYXQgZG9uJ3QgZXhpc3QgaW4gdGhlIENMSSBwcm9qZWN0LlxuICByZXR1cm4ge1xuICAgIGJ1aWxkUGF0aHM6IEFycmF5LmZyb20oYnVpbGRQYXRocykuZmlsdGVyKHAgPT4gdHJlZS5leGlzdHMocCkpLFxuICAgIHRlc3RQYXRoczogQXJyYXkuZnJvbSh0ZXN0UGF0aHMpLmZpbHRlcihwID0+IHRyZWUuZXhpc3RzKHApKSxcbiAgfTtcbn1cblxuLyoqIEdldHMgdGhlIHRzY29uZmlnIHBhdGggZnJvbSB0aGUgZ2l2ZW4gdGFyZ2V0IHdpdGhpbiB0aGUgc3BlY2lmaWVkIHByb2plY3QuICovXG5mdW5jdGlvbiBnZXRUYXJnZXRUc2NvbmZpZ1BhdGgocHJvamVjdDogV29ya3NwYWNlUHJvamVjdCwgdGFyZ2V0TmFtZTogc3RyaW5nKTogc3RyaW5nfG51bGwge1xuICBpZiAocHJvamVjdC50YXJnZXRzICYmIHByb2plY3QudGFyZ2V0c1t0YXJnZXROYW1lXSAmJiBwcm9qZWN0LnRhcmdldHNbdGFyZ2V0TmFtZV0ub3B0aW9ucyAmJlxuICAgICAgcHJvamVjdC50YXJnZXRzW3RhcmdldE5hbWVdLm9wdGlvbnMudHNDb25maWcpIHtcbiAgICByZXR1cm4gbm9ybWFsaXplKHByb2plY3QudGFyZ2V0c1t0YXJnZXROYW1lXS5vcHRpb25zLnRzQ29uZmlnKTtcbiAgfVxuXG4gIGlmIChwcm9qZWN0LmFyY2hpdGVjdCAmJiBwcm9qZWN0LmFyY2hpdGVjdFt0YXJnZXROYW1lXSAmJiBwcm9qZWN0LmFyY2hpdGVjdFt0YXJnZXROYW1lXS5vcHRpb25zICYmXG4gICAgICBwcm9qZWN0LmFyY2hpdGVjdFt0YXJnZXROYW1lXS5vcHRpb25zLnRzQ29uZmlnKSB7XG4gICAgcmV0dXJuIG5vcm1hbGl6ZShwcm9qZWN0LmFyY2hpdGVjdFt0YXJnZXROYW1lXS5vcHRpb25zLnRzQ29uZmlnKTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBSZXNvbHZlIHRoZSB3b3Jrc3BhY2UgY29uZmlndXJhdGlvbiBvZiB0aGUgc3BlY2lmaWVkIHRyZWUgZ3JhY2VmdWxseS4gV2UgY2Fubm90IHVzZSB0aGUgdXRpbGl0eVxuICogZnVuY3Rpb25zIGZyb20gdGhlIGRlZmF1bHQgQW5ndWxhciBzY2hlbWF0aWNzIGJlY2F1c2UgdGhvc2UgbWlnaHQgbm90IGJlIHByZXNlbnQgaW4gb2xkZXJcbiAqIHZlcnNpb25zIG9mIHRoZSBDTEkuIEFsc28gaXQncyBpbXBvcnRhbnQgdG8gcmVzb2x2ZSB0aGUgd29ya3NwYWNlIGdyYWNlZnVsbHkgYmVjYXVzZVxuICogdGhlIENMSSBwcm9qZWN0IGNvdWxkIGJlIHN0aWxsIHVzaW5nIGAuYW5ndWxhci1jbGkuanNvbmAgaW5zdGVhZCBvZiB0aGV3IG5ldyBjb25maWcuXG4gKi9cbmZ1bmN0aW9uIGdldFdvcmtzcGFjZUNvbmZpZ0dyYWNlZnVsbHkodHJlZTogVHJlZSk6IGFueSB7XG4gIGNvbnN0IHBhdGggPSBkZWZhdWx0V29ya3NwYWNlQ29uZmlnUGF0aHMuZmluZChmaWxlUGF0aCA9PiB0cmVlLmV4aXN0cyhmaWxlUGF0aCkpO1xuICBjb25zdCBjb25maWdCdWZmZXIgPSB0cmVlLnJlYWQocGF0aCEpO1xuXG4gIGlmICghcGF0aCB8fCAhY29uZmlnQnVmZmVyKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICB0cnkge1xuICAgIC8vIFBhcnNlIHRoZSB3b3Jrc3BhY2UgZmlsZSBhcyBKU09ONSB3aGljaCBpcyBhbHNvIHN1cHBvcnRlZCBmb3IgQ0xJXG4gICAgLy8gd29ya3NwYWNlIGNvbmZpZ3VyYXRpb25zLlxuICAgIHJldHVybiBwYXJzZUpzb24oY29uZmlnQnVmZmVyLnRvU3RyaW5nKCksIEpzb25QYXJzZU1vZGUuSnNvbjUpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiJdfQ==