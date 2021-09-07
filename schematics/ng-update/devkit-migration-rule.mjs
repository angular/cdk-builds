"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDevkitMigration = exports.createMigrationSchematicRule = exports.cdkMigrations = void 0;
const tasks_1 = require("@angular-devkit/schematics/tasks");
const update_tool_1 = require("../update-tool");
const project_tsconfig_paths_1 = require("../utils/project-tsconfig-paths");
const devkit_file_system_1 = require("./devkit-file-system");
const devkit_migration_1 = require("./devkit-migration");
const find_stylesheets_1 = require("./find-stylesheets");
const attribute_selectors_1 = require("./migrations/attribute-selectors");
const class_inheritance_1 = require("./migrations/class-inheritance");
const class_names_1 = require("./migrations/class-names");
const constructor_signature_1 = require("./migrations/constructor-signature");
const css_selectors_1 = require("./migrations/css-selectors");
const element_selectors_1 = require("./migrations/element-selectors");
const input_names_1 = require("./migrations/input-names");
const method_call_arguments_1 = require("./migrations/method-call-arguments");
const misc_template_1 = require("./migrations/misc-template");
const output_names_1 = require("./migrations/output-names");
const property_names_1 = require("./migrations/property-names");
const symbol_removal_1 = require("./migrations/symbol-removal");
/** List of migrations which run for the CDK update. */
exports.cdkMigrations = [
    attribute_selectors_1.AttributeSelectorsMigration,
    class_inheritance_1.ClassInheritanceMigration,
    class_names_1.ClassNamesMigration,
    constructor_signature_1.ConstructorSignatureMigration,
    css_selectors_1.CssSelectorsMigration,
    element_selectors_1.ElementSelectorsMigration,
    input_names_1.InputNamesMigration,
    method_call_arguments_1.MethodCallArgumentsMigration,
    misc_template_1.MiscTemplateMigration,
    output_names_1.OutputNamesMigration,
    property_names_1.PropertyNamesMigration,
    symbol_removal_1.SymbolRemovalMigration,
];
/**
 * Creates a Angular schematic rule that runs the upgrade for the
 * specified target version.
 */
function createMigrationSchematicRule(targetVersion, extraMigrations, upgradeData, onMigrationCompleteFn) {
    return (tree, context) => __awaiter(this, void 0, void 0, function* () {
        const logger = context.logger;
        const workspace = yield project_tsconfig_paths_1.getWorkspaceConfigGracefully(tree);
        if (workspace === null) {
            logger.error('Could not find workspace configuration file.');
            return;
        }
        // Keep track of all project source files which have been checked/migrated. This is
        // necessary because multiple TypeScript projects can contain the same source file and
        // we don't want to check these again, as this would result in duplicated failure messages.
        const analyzedFiles = new Set();
        const fileSystem = new devkit_file_system_1.DevkitFileSystem(tree);
        const projectNames = workspace.projects.keys();
        const migrations = [...exports.cdkMigrations, ...extraMigrations];
        let hasFailures = false;
        for (const projectName of projectNames) {
            const project = workspace.projects.get(projectName);
            const buildTsconfigPath = project_tsconfig_paths_1.getTargetTsconfigPath(project, 'build');
            const testTsconfigPath = project_tsconfig_paths_1.getTargetTsconfigPath(project, 'test');
            if (!buildTsconfigPath && !testTsconfigPath) {
                logger.warn(`Could not find TypeScript project for project: ${projectName}`);
                continue;
            }
            // In some applications, developers will have global stylesheets which are not
            // specified in any Angular component. Therefore we glob up all CSS and SCSS files
            // in the project and migrate them if needed.
            // TODO: rework this to collect global stylesheets from the workspace config. COMP-280.
            const additionalStylesheetPaths = find_stylesheets_1.findStylesheetFiles(tree, project.root);
            if (buildTsconfigPath !== null) {
                runMigrations(project, projectName, buildTsconfigPath, additionalStylesheetPaths, false);
            }
            if (testTsconfigPath !== null) {
                runMigrations(project, projectName, testTsconfigPath, additionalStylesheetPaths, true);
            }
        }
        let runPackageManager = false;
        // Run the global post migration static members for all
        // registered devkit migrations.
        migrations.forEach(m => {
            const actionResult = isDevkitMigration(m) && m.globalPostMigration !== undefined ?
                m.globalPostMigration(tree, context) : null;
            if (actionResult) {
                runPackageManager = runPackageManager || actionResult.runPackageManager;
            }
        });
        // If a migration requested the package manager to run, we run it as an
        // asynchronous post migration task. We cannot run it synchronously,
        // as file changes from the current migration task are not applied to
        // the file system yet.
        if (runPackageManager) {
            context.addTask(new tasks_1.NodePackageInstallTask({ quiet: false }));
        }
        if (onMigrationCompleteFn) {
            onMigrationCompleteFn(context, targetVersion, hasFailures);
        }
        /** Runs the migrations for the specified workspace project. */
        function runMigrations(project, projectName, tsconfigPath, additionalStylesheetPaths, isTestTarget) {
            const program = update_tool_1.UpdateProject.createProgramFromTsconfig(tsconfigPath, fileSystem);
            const updateContext = {
                isTestTarget,
                projectName,
                project,
                tree,
            };
            const updateProject = new update_tool_1.UpdateProject(updateContext, program, fileSystem, analyzedFiles, context.logger);
            const result = updateProject.migrate(migrations, targetVersion, upgradeData, additionalStylesheetPaths);
            // Commit all recorded edits in the update recorder. We apply the edits after all
            // migrations ran because otherwise offsets in the TypeScript program would be
            // shifted and individual migrations could no longer update the same source file.
            fileSystem.commitEdits();
            hasFailures = hasFailures || result.hasFailures;
        }
    });
}
exports.createMigrationSchematicRule = createMigrationSchematicRule;
/** Whether the given migration type refers to a devkit migration */
function isDevkitMigration(value) {
    return devkit_migration_1.DevkitMigration.isPrototypeOf(value);
}
exports.isDevkitMigration = isDevkitMigration;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2a2l0LW1pZ3JhdGlvbi1ydWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL25nLXVwZGF0ZS9kZXZraXQtbWlncmF0aW9uLXJ1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0FBR0gsNERBQXdFO0FBR3hFLGdEQUE2QztBQUk3Qyw0RUFBb0c7QUFFcEcsNkRBQXNEO0FBQ3RELHlEQUF1RjtBQUN2Rix5REFBdUQ7QUFDdkQsMEVBQTZFO0FBQzdFLHNFQUF5RTtBQUN6RSwwREFBNkQ7QUFDN0QsOEVBQWlGO0FBQ2pGLDhEQUFpRTtBQUNqRSxzRUFBeUU7QUFDekUsMERBQTZEO0FBQzdELDhFQUFnRjtBQUNoRiw4REFBaUU7QUFDakUsNERBQStEO0FBQy9ELGdFQUFtRTtBQUVuRSxnRUFBbUU7QUFHbkUsdURBQXVEO0FBQzFDLFFBQUEsYUFBYSxHQUFpQztJQUN6RCxpREFBMkI7SUFDM0IsNkNBQXlCO0lBQ3pCLGlDQUFtQjtJQUNuQixxREFBNkI7SUFDN0IscUNBQXFCO0lBQ3JCLDZDQUF5QjtJQUN6QixpQ0FBbUI7SUFDbkIsb0RBQTRCO0lBQzVCLHFDQUFxQjtJQUNyQixtQ0FBb0I7SUFDcEIsdUNBQXNCO0lBQ3RCLHVDQUFzQjtDQUN2QixDQUFDO0FBT0Y7OztHQUdHO0FBQ0gsU0FBZ0IsNEJBQTRCLENBQ3hDLGFBQTRCLEVBQUUsZUFBMEMsRUFDeEUsV0FBd0IsRUFBRSxxQkFBdUM7SUFDbkUsT0FBTyxDQUFPLElBQVUsRUFBRSxPQUF5QixFQUFFLEVBQUU7UUFDckQsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztRQUM5QixNQUFNLFNBQVMsR0FBRyxNQUFNLHFEQUE0QixDQUFDLElBQUksQ0FBQyxDQUFDO1FBRTNELElBQUksU0FBUyxLQUFLLElBQUksRUFBRTtZQUN0QixNQUFNLENBQUMsS0FB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QyxZQUFZO2dCQUNaLFdBQVc7Z0JBQ1gsT0FBTztnQkFDUCxJQUFJO2FBQ0wsQ0FBQztZQUVGLE1BQU0sYUFBYSxHQUFHLElBQUksMkJBQWEsQ0FDckMsYUFBYSxFQUNiLE9BQU8sRUFDUCxVQUFVLEVBQ1YsYUFBYSxFQUNiLE9BQU8sQ0FBQyxNQUFNLENBQ2YsQ0FBQztZQUVGLE1BQU0sTUFBTSxHQUNWLGFBQWEsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUseUJBQXlCLENBQUMsQ0FBQztZQUUzRixpRkFBaUY7WUFDakYsOEVBQThFO1lBQzlFLGlGQUFpRjtZQUNqRixVQUFVLENBQUMsV0FBVyxFQUFFLENBQUM7WUFFekIsV0FBVyxHQUFHLFdBQVcsSUFBSSxNQUFNLENBQUMsV0FBVyxDQUFDO1FBQ2xELENBQUM7SUFDSCxDQUFDLENBQUEsQ0FBQztBQUNKLENBQUM7QUFuR0Qsb0VBbUdDO0FBRUQsb0VBQW9FO0FBQ3BFLFNBQWdCLGlCQUFpQixDQUFDLEtBQThCO0lBRTlELE9BQU8sa0NBQWUsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDOUMsQ0FBQztBQUhELDhDQUdDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UnVsZSwgU2NoZW1hdGljQ29udGV4dCwgVHJlZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtOb2RlUGFja2FnZUluc3RhbGxUYXNrfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcy90YXNrcyc7XG5pbXBvcnQge1Byb2plY3REZWZpbml0aW9ufSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZS9zcmMvd29ya3NwYWNlJztcblxuaW1wb3J0IHtVcGRhdGVQcm9qZWN0fSBmcm9tICcuLi91cGRhdGUtdG9vbCc7XG5pbXBvcnQge1dvcmtzcGFjZVBhdGh9IGZyb20gJy4uL3VwZGF0ZS10b29sL2ZpbGUtc3lzdGVtJztcbmltcG9ydCB7TWlncmF0aW9uQ3Rvcn0gZnJvbSAnLi4vdXBkYXRlLXRvb2wvbWlncmF0aW9uJztcbmltcG9ydCB7VGFyZ2V0VmVyc2lvbn0gZnJvbSAnLi4vdXBkYXRlLXRvb2wvdGFyZ2V0LXZlcnNpb24nO1xuaW1wb3J0IHtnZXRUYXJnZXRUc2NvbmZpZ1BhdGgsIGdldFdvcmtzcGFjZUNvbmZpZ0dyYWNlZnVsbHl9IGZyb20gJy4uL3V0aWxzL3Byb2plY3QtdHNjb25maWctcGF0aHMnO1xuXG5pbXBvcnQge0RldmtpdEZpbGVTeXN0ZW19IGZyb20gJy4vZGV2a2l0LWZpbGUtc3lzdGVtJztcbmltcG9ydCB7RGV2a2l0Q29udGV4dCwgRGV2a2l0TWlncmF0aW9uLCBEZXZraXRNaWdyYXRpb25DdG9yfSBmcm9tICcuL2RldmtpdC1taWdyYXRpb24nO1xuaW1wb3J0IHtmaW5kU3R5bGVzaGVldEZpbGVzfSBmcm9tICcuL2ZpbmQtc3R5bGVzaGVldHMnO1xuaW1wb3J0IHtBdHRyaWJ1dGVTZWxlY3RvcnNNaWdyYXRpb259IGZyb20gJy4vbWlncmF0aW9ucy9hdHRyaWJ1dGUtc2VsZWN0b3JzJztcbmltcG9ydCB7Q2xhc3NJbmhlcml0YW5jZU1pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL2NsYXNzLWluaGVyaXRhbmNlJztcbmltcG9ydCB7Q2xhc3NOYW1lc01pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL2NsYXNzLW5hbWVzJztcbmltcG9ydCB7Q29uc3RydWN0b3JTaWduYXR1cmVNaWdyYXRpb259IGZyb20gJy4vbWlncmF0aW9ucy9jb25zdHJ1Y3Rvci1zaWduYXR1cmUnO1xuaW1wb3J0IHtDc3NTZWxlY3RvcnNNaWdyYXRpb259IGZyb20gJy4vbWlncmF0aW9ucy9jc3Mtc2VsZWN0b3JzJztcbmltcG9ydCB7RWxlbWVudFNlbGVjdG9yc01pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL2VsZW1lbnQtc2VsZWN0b3JzJztcbmltcG9ydCB7SW5wdXROYW1lc01pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL2lucHV0LW5hbWVzJztcbmltcG9ydCB7TWV0aG9kQ2FsbEFyZ3VtZW50c01pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL21ldGhvZC1jYWxsLWFyZ3VtZW50cyc7XG5pbXBvcnQge01pc2NUZW1wbGF0ZU1pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL21pc2MtdGVtcGxhdGUnO1xuaW1wb3J0IHtPdXRwdXROYW1lc01pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL291dHB1dC1uYW1lcyc7XG5pbXBvcnQge1Byb3BlcnR5TmFtZXNNaWdyYXRpb259IGZyb20gJy4vbWlncmF0aW9ucy9wcm9wZXJ0eS1uYW1lcyc7XG5pbXBvcnQge1VwZ3JhZGVEYXRhfSBmcm9tICcuL3VwZ3JhZGUtZGF0YSc7XG5pbXBvcnQge1N5bWJvbFJlbW92YWxNaWdyYXRpb259IGZyb20gJy4vbWlncmF0aW9ucy9zeW1ib2wtcmVtb3ZhbCc7XG5cblxuLyoqIExpc3Qgb2YgbWlncmF0aW9ucyB3aGljaCBydW4gZm9yIHRoZSBDREsgdXBkYXRlLiAqL1xuZXhwb3J0IGNvbnN0IGNka01pZ3JhdGlvbnM6IE1pZ3JhdGlvbkN0b3I8VXBncmFkZURhdGE+W10gPSBbXG4gIEF0dHJpYnV0ZVNlbGVjdG9yc01pZ3JhdGlvbixcbiAgQ2xhc3NJbmhlcml0YW5jZU1pZ3JhdGlvbixcbiAgQ2xhc3NOYW1lc01pZ3JhdGlvbixcbiAgQ29uc3RydWN0b3JTaWduYXR1cmVNaWdyYXRpb24sXG4gIENzc1NlbGVjdG9yc01pZ3JhdGlvbixcbiAgRWxlbWVudFNlbGVjdG9yc01pZ3JhdGlvbixcbiAgSW5wdXROYW1lc01pZ3JhdGlvbixcbiAgTWV0aG9kQ2FsbEFyZ3VtZW50c01pZ3JhdGlvbixcbiAgTWlzY1RlbXBsYXRlTWlncmF0aW9uLFxuICBPdXRwdXROYW1lc01pZ3JhdGlvbixcbiAgUHJvcGVydHlOYW1lc01pZ3JhdGlvbixcbiAgU3ltYm9sUmVtb3ZhbE1pZ3JhdGlvbixcbl07XG5cbmV4cG9ydCB0eXBlIE51bGxhYmxlRGV2a2l0TWlncmF0aW9uID0gTWlncmF0aW9uQ3RvcjxVcGdyYWRlRGF0YXxudWxsLCBEZXZraXRDb250ZXh0PjtcblxudHlwZSBQb3N0TWlncmF0aW9uRm4gPVxuICAgIChjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0LCB0YXJnZXRWZXJzaW9uOiBUYXJnZXRWZXJzaW9uLCBoYXNGYWlsdXJlOiBib29sZWFuKSA9PiB2b2lkO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBBbmd1bGFyIHNjaGVtYXRpYyBydWxlIHRoYXQgcnVucyB0aGUgdXBncmFkZSBmb3IgdGhlXG4gKiBzcGVjaWZpZWQgdGFyZ2V0IHZlcnNpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVNaWdyYXRpb25TY2hlbWF0aWNSdWxlKFxuICAgIHRhcmdldFZlcnNpb246IFRhcmdldFZlcnNpb24sIGV4dHJhTWlncmF0aW9uczogTnVsbGFibGVEZXZraXRNaWdyYXRpb25bXSxcbiAgICB1cGdyYWRlRGF0YTogVXBncmFkZURhdGEsIG9uTWlncmF0aW9uQ29tcGxldGVGbj86IFBvc3RNaWdyYXRpb25Gbik6IFJ1bGUge1xuICByZXR1cm4gYXN5bmMgKHRyZWU6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb25zdCBsb2dnZXIgPSBjb250ZXh0LmxvZ2dlcjtcbiAgICBjb25zdCB3b3Jrc3BhY2UgPSBhd2FpdCBnZXRXb3Jrc3BhY2VDb25maWdHcmFjZWZ1bGx5KHRyZWUpO1xuXG4gICAgaWYgKHdvcmtzcGFjZSA9PT0gbnVsbCkge1xuICAgICAgbG9nZ2VyLmVycm9yKCdDb3VsZCBub3QgZmluZCB3b3Jrc3BhY2UgY29uZmlndXJhdGlvbiBmaWxlLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEtlZXAgdHJhY2sgb2YgYWxsIHByb2plY3Qgc291cmNlIGZpbGVzIHdoaWNoIGhhdmUgYmVlbiBjaGVja2VkL21pZ3JhdGVkLiBUaGlzIGlzXG4gICAgLy8gbmVjZXNzYXJ5IGJlY2F1c2UgbXVsdGlwbGUgVHlwZVNjcmlwdCBwcm9qZWN0cyBjYW4gY29udGFpbiB0aGUgc2FtZSBzb3VyY2UgZmlsZSBhbmRcbiAgICAvLyB3ZSBkb24ndCB3YW50IHRvIGNoZWNrIHRoZXNlIGFnYWluLCBhcyB0aGlzIHdvdWxkIHJlc3VsdCBpbiBkdXBsaWNhdGVkIGZhaWx1cmUgbWVzc2FnZXMuXG4gICAgY29uc3QgYW5hbHl6ZWRGaWxlcyA9IG5ldyBTZXQ8V29ya3NwYWNlUGF0aD4oKTtcbiAgICBjb25zdCBmaWxlU3lzdGVtID0gbmV3IERldmtpdEZpbGVTeXN0ZW0odHJlZSk7XG4gICAgY29uc3QgcHJvamVjdE5hbWVzID0gd29ya3NwYWNlLnByb2plY3RzLmtleXMoKTtcbiAgICBjb25zdCBtaWdyYXRpb25zID0gWy4uLmNka01pZ3JhdGlvbnMsIC4uLmV4dHJhTWlncmF0aW9uc10gYXMgTnVsbGFibGVEZXZraXRNaWdyYXRpb25bXTtcbiAgICBsZXQgaGFzRmFpbHVyZXMgPSBmYWxzZTtcblxuICAgIGZvciAoY29uc3QgcHJvamVjdE5hbWUgb2YgcHJvamVjdE5hbWVzKSB7XG4gICAgICBjb25zdCBwcm9qZWN0ID0gd29ya3NwYWNlLnByb2plY3RzLmdldChwcm9qZWN0TmFtZSkhO1xuICAgICAgY29uc3QgYnVpbGRUc2NvbmZpZ1BhdGggPSBnZXRUYXJnZXRUc2NvbmZpZ1BhdGgocHJvamVjdCwgJ2J1aWxkJyk7XG4gICAgICBjb25zdCB0ZXN0VHNjb25maWdQYXRoID0gZ2V0VGFyZ2V0VHNjb25maWdQYXRoKHByb2plY3QsICd0ZXN0Jyk7XG5cbiAgICAgIGlmICghYnVpbGRUc2NvbmZpZ1BhdGggJiYgIXRlc3RUc2NvbmZpZ1BhdGgpIHtcbiAgICAgICAgbG9nZ2VyLndhcm4oYENvdWxkIG5vdCBmaW5kIFR5cGVTY3JpcHQgcHJvamVjdCBmb3IgcHJvamVjdDogJHtwcm9qZWN0TmFtZX1gKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIEluIHNvbWUgYXBwbGljYXRpb25zLCBkZXZlbG9wZXJzIHdpbGwgaGF2ZSBnbG9iYWwgc3R5bGVzaGVldHMgd2hpY2ggYXJlIG5vdFxuICAgICAgLy8gc3BlY2lmaWVkIGluIGFueSBBbmd1bGFyIGNvbXBvbmVudC4gVGhlcmVmb3JlIHdlIGdsb2IgdXAgYWxsIENTUyBhbmQgU0NTUyBmaWxlc1xuICAgICAgLy8gaW4gdGhlIHByb2plY3QgYW5kIG1pZ3JhdGUgdGhlbSBpZiBuZWVkZWQuXG4gICAgICAvLyBUT0RPOiByZXdvcmsgdGhpcyB0byBjb2xsZWN0IGdsb2JhbCBzdHlsZXNoZWV0cyBmcm9tIHRoZSB3b3Jrc3BhY2UgY29uZmlnLiBDT01QLTI4MC5cbiAgICAgIGNvbnN0IGFkZGl0aW9uYWxTdHlsZXNoZWV0UGF0aHMgPSBmaW5kU3R5bGVzaGVldEZpbGVzKHRyZWUsIHByb2plY3Qucm9vdCk7XG5cbiAgICAgIGlmIChidWlsZFRzY29uZmlnUGF0aCAhPT0gbnVsbCkge1xuICAgICAgICBydW5NaWdyYXRpb25zKHByb2plY3QsIHByb2plY3ROYW1lLCBidWlsZFRzY29uZmlnUGF0aCwgYWRkaXRpb25hbFN0eWxlc2hlZXRQYXRocywgZmFsc2UpO1xuICAgICAgfVxuICAgICAgaWYgKHRlc3RUc2NvbmZpZ1BhdGggIT09IG51bGwpIHtcbiAgICAgICAgcnVuTWlncmF0aW9ucyhwcm9qZWN0LCBwcm9qZWN0TmFtZSwgdGVzdFRzY29uZmlnUGF0aCwgYWRkaXRpb25hbFN0eWxlc2hlZXRQYXRocywgdHJ1ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IHJ1blBhY2thZ2VNYW5hZ2VyID0gZmFsc2U7XG4gICAgLy8gUnVuIHRoZSBnbG9iYWwgcG9zdCBtaWdyYXRpb24gc3RhdGljIG1lbWJlcnMgZm9yIGFsbFxuICAgIC8vIHJlZ2lzdGVyZWQgZGV2a2l0IG1pZ3JhdGlvbnMuXG4gICAgbWlncmF0aW9ucy5mb3JFYWNoKG0gPT4ge1xuICAgICAgY29uc3QgYWN0aW9uUmVzdWx0ID0gaXNEZXZraXRNaWdyYXRpb24obSkgJiYgbS5nbG9iYWxQb3N0TWlncmF0aW9uICE9PSB1bmRlZmluZWQgP1xuICAgICAgICAgIG0uZ2xvYmFsUG9zdE1pZ3JhdGlvbih0cmVlLCBjb250ZXh0KSA6IG51bGw7XG4gICAgICBpZiAoYWN0aW9uUmVzdWx0KSB7XG4gICAgICAgIHJ1blBhY2thZ2VNYW5hZ2VyID0gcnVuUGFja2FnZU1hbmFnZXIgfHwgYWN0aW9uUmVzdWx0LnJ1blBhY2thZ2VNYW5hZ2VyO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gSWYgYSBtaWdyYXRpb24gcmVxdWVzdGVkIHRoZSBwYWNrYWdlIG1hbmFnZXIgdG8gcnVuLCB3ZSBydW4gaXQgYXMgYW5cbiAgICAvLyBhc3luY2hyb25vdXMgcG9zdCBtaWdyYXRpb24gdGFzay4gV2UgY2Fubm90IHJ1biBpdCBzeW5jaHJvbm91c2x5LFxuICAgIC8vIGFzIGZpbGUgY2hhbmdlcyBmcm9tIHRoZSBjdXJyZW50IG1pZ3JhdGlvbiB0YXNrIGFyZSBub3QgYXBwbGllZCB0b1xuICAgIC8vIHRoZSBmaWxlIHN5c3RlbSB5ZXQuXG4gICAgaWYgKHJ1blBhY2thZ2VNYW5hZ2VyKSB7XG4gICAgICBjb250ZXh0LmFkZFRhc2sobmV3IE5vZGVQYWNrYWdlSW5zdGFsbFRhc2soe3F1aWV0OiBmYWxzZX0pKTtcbiAgICB9XG5cbiAgICBpZiAob25NaWdyYXRpb25Db21wbGV0ZUZuKSB7XG4gICAgICBvbk1pZ3JhdGlvbkNvbXBsZXRlRm4oY29udGV4dCwgdGFyZ2V0VmVyc2lvbiwgaGFzRmFpbHVyZXMpO1xuICAgIH1cblxuICAgIC8qKiBSdW5zIHRoZSBtaWdyYXRpb25zIGZvciB0aGUgc3BlY2lmaWVkIHdvcmtzcGFjZSBwcm9qZWN0LiAqL1xuICAgIGZ1bmN0aW9uIHJ1bk1pZ3JhdGlvbnMocHJvamVjdDogUHJvamVjdERlZmluaXRpb24sIHByb2plY3ROYW1lOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0c2NvbmZpZ1BhdGg6IFdvcmtzcGFjZVBhdGgsIGFkZGl0aW9uYWxTdHlsZXNoZWV0UGF0aHM6IHN0cmluZ1tdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNUZXN0VGFyZ2V0OiBib29sZWFuKSB7XG4gICAgICBjb25zdCBwcm9ncmFtID0gVXBkYXRlUHJvamVjdC5jcmVhdGVQcm9ncmFtRnJvbVRzY29uZmlnKHRzY29uZmlnUGF0aCwgZmlsZVN5c3RlbSk7XG4gICAgICBjb25zdCB1cGRhdGVDb250ZXh0OiBEZXZraXRDb250ZXh0ID0ge1xuICAgICAgICBpc1Rlc3RUYXJnZXQsXG4gICAgICAgIHByb2plY3ROYW1lLFxuICAgICAgICBwcm9qZWN0LFxuICAgICAgICB0cmVlLFxuICAgICAgfTtcblxuICAgICAgY29uc3QgdXBkYXRlUHJvamVjdCA9IG5ldyBVcGRhdGVQcm9qZWN0KFxuICAgICAgICB1cGRhdGVDb250ZXh0LFxuICAgICAgICBwcm9ncmFtLFxuICAgICAgICBmaWxlU3lzdGVtLFxuICAgICAgICBhbmFseXplZEZpbGVzLFxuICAgICAgICBjb250ZXh0LmxvZ2dlcixcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9XG4gICAgICAgIHVwZGF0ZVByb2plY3QubWlncmF0ZShtaWdyYXRpb25zLCB0YXJnZXRWZXJzaW9uLCB1cGdyYWRlRGF0YSwgYWRkaXRpb25hbFN0eWxlc2hlZXRQYXRocyk7XG5cbiAgICAgIC8vIENvbW1pdCBhbGwgcmVjb3JkZWQgZWRpdHMgaW4gdGhlIHVwZGF0ZSByZWNvcmRlci4gV2UgYXBwbHkgdGhlIGVkaXRzIGFmdGVyIGFsbFxuICAgICAgLy8gbWlncmF0aW9ucyByYW4gYmVjYXVzZSBvdGhlcndpc2Ugb2Zmc2V0cyBpbiB0aGUgVHlwZVNjcmlwdCBwcm9ncmFtIHdvdWxkIGJlXG4gICAgICAvLyBzaGlmdGVkIGFuZCBpbmRpdmlkdWFsIG1pZ3JhdGlvbnMgY291bGQgbm8gbG9uZ2VyIHVwZGF0ZSB0aGUgc2FtZSBzb3VyY2UgZmlsZS5cbiAgICAgIGZpbGVTeXN0ZW0uY29tbWl0RWRpdHMoKTtcblxuICAgICAgaGFzRmFpbHVyZXMgPSBoYXNGYWlsdXJlcyB8fCByZXN1bHQuaGFzRmFpbHVyZXM7XG4gICAgfVxuICB9O1xufVxuXG4vKiogV2hldGhlciB0aGUgZ2l2ZW4gbWlncmF0aW9uIHR5cGUgcmVmZXJzIHRvIGEgZGV2a2l0IG1pZ3JhdGlvbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRGV2a2l0TWlncmF0aW9uKHZhbHVlOiBNaWdyYXRpb25DdG9yPGFueSwgYW55PilcbiAgICA6IHZhbHVlIGlzIERldmtpdE1pZ3JhdGlvbkN0b3I8YW55PiB7XG4gIHJldHVybiBEZXZraXRNaWdyYXRpb24uaXNQcm90b3R5cGVPZih2YWx1ZSk7XG59XG4iXX0=