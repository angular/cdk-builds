"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cdkMigrations = void 0;
exports.createMigrationSchematicRule = createMigrationSchematicRule;
exports.isDevkitMigration = isDevkitMigration;
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
const css_tokens_1 = require("./migrations/css-tokens");
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
    css_tokens_1.CssTokensMigration,
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
    return async (tree, context) => {
        const logger = context.logger;
        const workspace = await (0, project_tsconfig_paths_1.getWorkspaceConfigGracefully)(tree);
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
            const buildTsconfigPath = (0, project_tsconfig_paths_1.getTargetTsconfigPath)(project, 'build');
            const testTsconfigPath = (0, project_tsconfig_paths_1.getTargetTsconfigPath)(project, 'test');
            if (!buildTsconfigPath && !testTsconfigPath) {
                logger.warn(`Skipping migration for project ${projectName}. Unable to determine 'tsconfig.json' file in workspace config.`);
                continue;
            }
            // In some applications, developers will have global stylesheets which are not
            // specified in any Angular component. Therefore we glob up all CSS and SCSS files
            // in the project and migrate them if needed.
            // TODO: rework this to collect global stylesheets from the workspace config.
            // TODO: https://github.com/angular/components/issues/24032.
            const additionalStylesheetPaths = (0, find_stylesheets_1.findStylesheetFiles)(tree, project.root);
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
            const actionResult = isDevkitMigration(m) && m.globalPostMigration !== undefined
                ? m.globalPostMigration(tree, targetVersion, context)
                : null;
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
    };
}
/** Whether the given migration type refers to a devkit migration */
function isDevkitMigration(value) {
    return devkit_migration_1.DevkitMigration.isPrototypeOf(value);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2a2l0LW1pZ3JhdGlvbi1ydWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL25nLXVwZGF0ZS9kZXZraXQtbWlncmF0aW9uLXJ1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBMkRILG9FQW1IQztBQUdELDhDQUlDO0FBakxELDREQUF3RTtBQUV4RSxnREFBNkM7QUFJN0MsNEVBQW9HO0FBRXBHLDZEQUFzRDtBQUN0RCx5REFBdUY7QUFDdkYseURBQXVEO0FBQ3ZELDBFQUE2RTtBQUM3RSxzRUFBeUU7QUFDekUsMERBQTZEO0FBQzdELDhFQUFpRjtBQUNqRiw4REFBaUU7QUFDakUsd0RBQTJEO0FBQzNELHNFQUF5RTtBQUN6RSwwREFBNkQ7QUFDN0QsOEVBQWdGO0FBQ2hGLDhEQUFpRTtBQUNqRSw0REFBK0Q7QUFDL0QsZ0VBQW1FO0FBQ25FLGdFQUFtRTtBQUduRSx1REFBdUQ7QUFDMUMsUUFBQSxhQUFhLEdBQWlDO0lBQ3pELGlEQUEyQjtJQUMzQiw2Q0FBeUI7SUFDekIsaUNBQW1CO0lBQ25CLHFEQUE2QjtJQUM3QixxQ0FBcUI7SUFDckIsK0JBQWtCO0lBQ2xCLDZDQUF5QjtJQUN6QixpQ0FBbUI7SUFDbkIsb0RBQTRCO0lBQzVCLHFDQUFxQjtJQUNyQixtQ0FBb0I7SUFDcEIsdUNBQXNCO0lBQ3RCLHVDQUFzQjtDQUN2QixDQUFDO0FBVUY7OztHQUdHO0FBQ0gsU0FBZ0IsNEJBQTRCLENBQzFDLGFBQTRCLEVBQzVCLGVBQTBDLEVBQzFDLFdBQXdCLEVBQ3hCLHFCQUF1QztJQUV2QyxPQUFPLEtBQUssRUFBRSxJQUFVLEVBQUUsT0FBeUIsRUFBRSxFQUFFO1FBQ3JELE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFDOUIsTUFBTSxTQUFTLEdBQUcsTUFBTSxJQUFBLHFEQUE0QixFQUFDLElBQUksQ0FBQyxD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REFBK0Q7UUFDL0QsU0FBUyxhQUFhLENBQ3BCLE9BQXFDLEVBQ3JDLFdBQW1CLEVBQ25CLFlBQTJCLEVBQzNCLHlCQUFtQyxFQUNuQyxZQUFxQjtZQUVyQixNQUFNLE9BQU8sR0FBRywyQkFBYSxDQUFDLHlCQUF5QixDQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNsRixNQUFNLGFBQWEsR0FBa0I7Z0JBQ25DLFlBQVk7Z0JBQ1osV0FBVztnQkFDWCxPQUFPO2dCQUNQLElBQUk7YUFDTCxDQUFDO1lBRUYsTUFBTSxhQUFhLEdBQUcsSUFBSSwyQkFBYSxDQUNyQyxhQUFhLEVBQ2IsT0FBTyxFQUNQLFVBQVUsRUFDVixhQUFhLEVBQ2IsT0FBTyxDQUFDLE1BQU0sQ0FDZixDQUFDO1lBRUYsTUFBTSxNQUFNLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FDbEMsVUFBVSxFQUNWLGFBQWEsRUFDYixXQUFXLEVBQ1gseUJBQXlCLENBQzFCLENBQUM7WUFFRixpRkFBaUY7WUFDakYsOEVBQThFO1lBQzlFLGlGQUFpRjtZQUNqRixVQUFVLENBQUMsV0FBVyxFQUFFLENBQUM7WUFFekIsV0FBVyxHQUFHLFdBQVcsSUFBSSxNQUFNLENBQUMsV0FBVyxDQUFDO1FBQ2xELENBQUM7SUFDSCxDQUFDLENBQUM7QUFDSixDQUFDO0FBRUQsb0VBQW9FO0FBQ3BFLFNBQWdCLGlCQUFpQixDQUMvQixLQUE4QjtJQUU5QixPQUFPLGtDQUFlLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzlDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHt3b3Jrc3BhY2VzfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQge1J1bGUsIFNjaGVtYXRpY0NvbnRleHQsIFRyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7Tm9kZVBhY2thZ2VJbnN0YWxsVGFza30gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MvdGFza3MnO1xuXG5pbXBvcnQge1VwZGF0ZVByb2plY3R9IGZyb20gJy4uL3VwZGF0ZS10b29sJztcbmltcG9ydCB7V29ya3NwYWNlUGF0aH0gZnJvbSAnLi4vdXBkYXRlLXRvb2wvZmlsZS1zeXN0ZW0nO1xuaW1wb3J0IHtNaWdyYXRpb25DdG9yfSBmcm9tICcuLi91cGRhdGUtdG9vbC9taWdyYXRpb24nO1xuaW1wb3J0IHtUYXJnZXRWZXJzaW9ufSBmcm9tICcuLi91cGRhdGUtdG9vbC90YXJnZXQtdmVyc2lvbic7XG5pbXBvcnQge2dldFRhcmdldFRzY29uZmlnUGF0aCwgZ2V0V29ya3NwYWNlQ29uZmlnR3JhY2VmdWxseX0gZnJvbSAnLi4vdXRpbHMvcHJvamVjdC10c2NvbmZpZy1wYXRocyc7XG5cbmltcG9ydCB7RGV2a2l0RmlsZVN5c3RlbX0gZnJvbSAnLi9kZXZraXQtZmlsZS1zeXN0ZW0nO1xuaW1wb3J0IHtEZXZraXRDb250ZXh0LCBEZXZraXRNaWdyYXRpb24sIERldmtpdE1pZ3JhdGlvbkN0b3J9IGZyb20gJy4vZGV2a2l0LW1pZ3JhdGlvbic7XG5pbXBvcnQge2ZpbmRTdHlsZXNoZWV0RmlsZXN9IGZyb20gJy4vZmluZC1zdHlsZXNoZWV0cyc7XG5pbXBvcnQge0F0dHJpYnV0ZVNlbGVjdG9yc01pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL2F0dHJpYnV0ZS1zZWxlY3RvcnMnO1xuaW1wb3J0IHtDbGFzc0luaGVyaXRhbmNlTWlncmF0aW9ufSBmcm9tICcuL21pZ3JhdGlvbnMvY2xhc3MtaW5oZXJpdGFuY2UnO1xuaW1wb3J0IHtDbGFzc05hbWVzTWlncmF0aW9ufSBmcm9tICcuL21pZ3JhdGlvbnMvY2xhc3MtbmFtZXMnO1xuaW1wb3J0IHtDb25zdHJ1Y3RvclNpZ25hdHVyZU1pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL2NvbnN0cnVjdG9yLXNpZ25hdHVyZSc7XG5pbXBvcnQge0Nzc1NlbGVjdG9yc01pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL2Nzcy1zZWxlY3RvcnMnO1xuaW1wb3J0IHtDc3NUb2tlbnNNaWdyYXRpb259IGZyb20gJy4vbWlncmF0aW9ucy9jc3MtdG9rZW5zJztcbmltcG9ydCB7RWxlbWVudFNlbGVjdG9yc01pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL2VsZW1lbnQtc2VsZWN0b3JzJztcbmltcG9ydCB7SW5wdXROYW1lc01pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL2lucHV0LW5hbWVzJztcbmltcG9ydCB7TWV0aG9kQ2FsbEFyZ3VtZW50c01pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL21ldGhvZC1jYWxsLWFyZ3VtZW50cyc7XG5pbXBvcnQge01pc2NUZW1wbGF0ZU1pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL21pc2MtdGVtcGxhdGUnO1xuaW1wb3J0IHtPdXRwdXROYW1lc01pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL291dHB1dC1uYW1lcyc7XG5pbXBvcnQge1Byb3BlcnR5TmFtZXNNaWdyYXRpb259IGZyb20gJy4vbWlncmF0aW9ucy9wcm9wZXJ0eS1uYW1lcyc7XG5pbXBvcnQge1N5bWJvbFJlbW92YWxNaWdyYXRpb259IGZyb20gJy4vbWlncmF0aW9ucy9zeW1ib2wtcmVtb3ZhbCc7XG5pbXBvcnQge1VwZ3JhZGVEYXRhfSBmcm9tICcuL3VwZ3JhZGUtZGF0YSc7XG5cbi8qKiBMaXN0IG9mIG1pZ3JhdGlvbnMgd2hpY2ggcnVuIGZvciB0aGUgQ0RLIHVwZGF0ZS4gKi9cbmV4cG9ydCBjb25zdCBjZGtNaWdyYXRpb25zOiBNaWdyYXRpb25DdG9yPFVwZ3JhZGVEYXRhPltdID0gW1xuICBBdHRyaWJ1dGVTZWxlY3RvcnNNaWdyYXRpb24sXG4gIENsYXNzSW5oZXJpdGFuY2VNaWdyYXRpb24sXG4gIENsYXNzTmFtZXNNaWdyYXRpb24sXG4gIENvbnN0cnVjdG9yU2lnbmF0dXJlTWlncmF0aW9uLFxuICBDc3NTZWxlY3RvcnNNaWdyYXRpb24sXG4gIENzc1Rva2Vuc01pZ3JhdGlvbixcbiAgRWxlbWVudFNlbGVjdG9yc01pZ3JhdGlvbixcbiAgSW5wdXROYW1lc01pZ3JhdGlvbixcbiAgTWV0aG9kQ2FsbEFyZ3VtZW50c01pZ3JhdGlvbixcbiAgTWlzY1RlbXBsYXRlTWlncmF0aW9uLFxuICBPdXRwdXROYW1lc01pZ3JhdGlvbixcbiAgUHJvcGVydHlOYW1lc01pZ3JhdGlvbixcbiAgU3ltYm9sUmVtb3ZhbE1pZ3JhdGlvbixcbl07XG5cbmV4cG9ydCB0eXBlIE51bGxhYmxlRGV2a2l0TWlncmF0aW9uID0gTWlncmF0aW9uQ3RvcjxVcGdyYWRlRGF0YSB8IG51bGwsIERldmtpdENvbnRleHQ+O1xuXG50eXBlIFBvc3RNaWdyYXRpb25GbiA9IChcbiAgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCxcbiAgdGFyZ2V0VmVyc2lvbjogVGFyZ2V0VmVyc2lvbixcbiAgaGFzRmFpbHVyZTogYm9vbGVhbixcbikgPT4gdm9pZDtcblxuLyoqXG4gKiBDcmVhdGVzIGEgQW5ndWxhciBzY2hlbWF0aWMgcnVsZSB0aGF0IHJ1bnMgdGhlIHVwZ3JhZGUgZm9yIHRoZVxuICogc3BlY2lmaWVkIHRhcmdldCB2ZXJzaW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTWlncmF0aW9uU2NoZW1hdGljUnVsZShcbiAgdGFyZ2V0VmVyc2lvbjogVGFyZ2V0VmVyc2lvbixcbiAgZXh0cmFNaWdyYXRpb25zOiBOdWxsYWJsZURldmtpdE1pZ3JhdGlvbltdLFxuICB1cGdyYWRlRGF0YTogVXBncmFkZURhdGEsXG4gIG9uTWlncmF0aW9uQ29tcGxldGVGbj86IFBvc3RNaWdyYXRpb25Gbixcbik6IFJ1bGUge1xuICByZXR1cm4gYXN5bmMgKHRyZWU6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb25zdCBsb2dnZXIgPSBjb250ZXh0LmxvZ2dlcjtcbiAgICBjb25zdCB3b3Jrc3BhY2UgPSBhd2FpdCBnZXRXb3Jrc3BhY2VDb25maWdHcmFjZWZ1bGx5KHRyZWUpO1xuXG4gICAgaWYgKHdvcmtzcGFjZSA9PT0gbnVsbCkge1xuICAgICAgbG9nZ2VyLmVycm9yKCdDb3VsZCBub3QgZmluZCB3b3Jrc3BhY2UgY29uZmlndXJhdGlvbiBmaWxlLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEtlZXAgdHJhY2sgb2YgYWxsIHByb2plY3Qgc291cmNlIGZpbGVzIHdoaWNoIGhhdmUgYmVlbiBjaGVja2VkL21pZ3JhdGVkLiBUaGlzIGlzXG4gICAgLy8gbmVjZXNzYXJ5IGJlY2F1c2UgbXVsdGlwbGUgVHlwZVNjcmlwdCBwcm9qZWN0cyBjYW4gY29udGFpbiB0aGUgc2FtZSBzb3VyY2UgZmlsZSBhbmRcbiAgICAvLyB3ZSBkb24ndCB3YW50IHRvIGNoZWNrIHRoZXNlIGFnYWluLCBhcyB0aGlzIHdvdWxkIHJlc3VsdCBpbiBkdXBsaWNhdGVkIGZhaWx1cmUgbWVzc2FnZXMuXG4gICAgY29uc3QgYW5hbHl6ZWRGaWxlcyA9IG5ldyBTZXQ8V29ya3NwYWNlUGF0aD4oKTtcbiAgICBjb25zdCBmaWxlU3lzdGVtID0gbmV3IERldmtpdEZpbGVTeXN0ZW0odHJlZSk7XG4gICAgY29uc3QgcHJvamVjdE5hbWVzID0gd29ya3NwYWNlLnByb2plY3RzLmtleXMoKTtcbiAgICBjb25zdCBtaWdyYXRpb25zID0gWy4uLmNka01pZ3JhdGlvbnMsIC4uLmV4dHJhTWlncmF0aW9uc10gYXMgTnVsbGFibGVEZXZraXRNaWdyYXRpb25bXTtcbiAgICBsZXQgaGFzRmFpbHVyZXMgPSBmYWxzZTtcblxuICAgIGZvciAoY29uc3QgcHJvamVjdE5hbWUgb2YgcHJvamVjdE5hbWVzKSB7XG4gICAgICBjb25zdCBwcm9qZWN0ID0gd29ya3NwYWNlLnByb2plY3RzLmdldChwcm9qZWN0TmFtZSkhO1xuICAgICAgY29uc3QgYnVpbGRUc2NvbmZpZ1BhdGggPSBnZXRUYXJnZXRUc2NvbmZpZ1BhdGgocHJvamVjdCwgJ2J1aWxkJyk7XG4gICAgICBjb25zdCB0ZXN0VHNjb25maWdQYXRoID0gZ2V0VGFyZ2V0VHNjb25maWdQYXRoKHByb2plY3QsICd0ZXN0Jyk7XG5cbiAgICAgIGlmICghYnVpbGRUc2NvbmZpZ1BhdGggJiYgIXRlc3RUc2NvbmZpZ1BhdGgpIHtcbiAgICAgICAgbG9nZ2VyLndhcm4oXG4gICAgICAgICAgYFNraXBwaW5nIG1pZ3JhdGlvbiBmb3IgcHJvamVjdCAke3Byb2plY3ROYW1lfS4gVW5hYmxlIHRvIGRldGVybWluZSAndHNjb25maWcuanNvbicgZmlsZSBpbiB3b3Jrc3BhY2UgY29uZmlnLmAsXG4gICAgICAgICk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBJbiBzb21lIGFwcGxpY2F0aW9ucywgZGV2ZWxvcGVycyB3aWxsIGhhdmUgZ2xvYmFsIHN0eWxlc2hlZXRzIHdoaWNoIGFyZSBub3RcbiAgICAgIC8vIHNwZWNpZmllZCBpbiBhbnkgQW5ndWxhciBjb21wb25lbnQuIFRoZXJlZm9yZSB3ZSBnbG9iIHVwIGFsbCBDU1MgYW5kIFNDU1MgZmlsZXNcbiAgICAgIC8vIGluIHRoZSBwcm9qZWN0IGFuZCBtaWdyYXRlIHRoZW0gaWYgbmVlZGVkLlxuICAgICAgLy8gVE9ETzogcmV3b3JrIHRoaXMgdG8gY29sbGVjdCBnbG9iYWwgc3R5bGVzaGVldHMgZnJvbSB0aGUgd29ya3NwYWNlIGNvbmZpZy5cbiAgICAgIC8vIFRPRE86IGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2NvbXBvbmVudHMvaXNzdWVzLzI0MDMyLlxuICAgICAgY29uc3QgYWRkaXRpb25hbFN0eWxlc2hlZXRQYXRocyA9IGZpbmRTdHlsZXNoZWV0RmlsZXModHJlZSwgcHJvamVjdC5yb290KTtcblxuICAgICAgaWYgKGJ1aWxkVHNjb25maWdQYXRoICE9PSBudWxsKSB7XG4gICAgICAgIHJ1bk1pZ3JhdGlvbnMocHJvamVjdCwgcHJvamVjdE5hbWUsIGJ1aWxkVHNjb25maWdQYXRoLCBhZGRpdGlvbmFsU3R5bGVzaGVldFBhdGhzLCBmYWxzZSk7XG4gICAgICB9XG4gICAgICBpZiAodGVzdFRzY29uZmlnUGF0aCAhPT0gbnVsbCkge1xuICAgICAgICBydW5NaWdyYXRpb25zKHByb2plY3QsIHByb2plY3ROYW1lLCB0ZXN0VHNjb25maWdQYXRoLCBhZGRpdGlvbmFsU3R5bGVzaGVldFBhdGhzLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgcnVuUGFja2FnZU1hbmFnZXIgPSBmYWxzZTtcbiAgICAvLyBSdW4gdGhlIGdsb2JhbCBwb3N0IG1pZ3JhdGlvbiBzdGF0aWMgbWVtYmVycyBmb3IgYWxsXG4gICAgLy8gcmVnaXN0ZXJlZCBkZXZraXQgbWlncmF0aW9ucy5cbiAgICBtaWdyYXRpb25zLmZvckVhY2gobSA9PiB7XG4gICAgICBjb25zdCBhY3Rpb25SZXN1bHQgPVxuICAgICAgICBpc0RldmtpdE1pZ3JhdGlvbihtKSAmJiBtLmdsb2JhbFBvc3RNaWdyYXRpb24gIT09IHVuZGVmaW5lZFxuICAgICAgICAgID8gbS5nbG9iYWxQb3N0TWlncmF0aW9uKHRyZWUsIHRhcmdldFZlcnNpb24sIGNvbnRleHQpXG4gICAgICAgICAgOiBudWxsO1xuICAgICAgaWYgKGFjdGlvblJlc3VsdCkge1xuICAgICAgICBydW5QYWNrYWdlTWFuYWdlciA9IHJ1blBhY2thZ2VNYW5hZ2VyIHx8IGFjdGlvblJlc3VsdC5ydW5QYWNrYWdlTWFuYWdlcjtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIElmIGEgbWlncmF0aW9uIHJlcXVlc3RlZCB0aGUgcGFja2FnZSBtYW5hZ2VyIHRvIHJ1biwgd2UgcnVuIGl0IGFzIGFuXG4gICAgLy8gYXN5bmNocm9ub3VzIHBvc3QgbWlncmF0aW9uIHRhc2suIFdlIGNhbm5vdCBydW4gaXQgc3luY2hyb25vdXNseSxcbiAgICAvLyBhcyBmaWxlIGNoYW5nZXMgZnJvbSB0aGUgY3VycmVudCBtaWdyYXRpb24gdGFzayBhcmUgbm90IGFwcGxpZWQgdG9cbiAgICAvLyB0aGUgZmlsZSBzeXN0ZW0geWV0LlxuICAgIGlmIChydW5QYWNrYWdlTWFuYWdlcikge1xuICAgICAgY29udGV4dC5hZGRUYXNrKG5ldyBOb2RlUGFja2FnZUluc3RhbGxUYXNrKHtxdWlldDogZmFsc2V9KSk7XG4gICAgfVxuXG4gICAgaWYgKG9uTWlncmF0aW9uQ29tcGxldGVGbikge1xuICAgICAgb25NaWdyYXRpb25Db21wbGV0ZUZuKGNvbnRleHQsIHRhcmdldFZlcnNpb24sIGhhc0ZhaWx1cmVzKTtcbiAgICB9XG5cbiAgICAvKiogUnVucyB0aGUgbWlncmF0aW9ucyBmb3IgdGhlIHNwZWNpZmllZCB3b3Jrc3BhY2UgcHJvamVjdC4gKi9cbiAgICBmdW5jdGlvbiBydW5NaWdyYXRpb25zKFxuICAgICAgcHJvamVjdDogd29ya3NwYWNlcy5Qcm9qZWN0RGVmaW5pdGlvbixcbiAgICAgIHByb2plY3ROYW1lOiBzdHJpbmcsXG4gICAgICB0c2NvbmZpZ1BhdGg6IFdvcmtzcGFjZVBhdGgsXG4gICAgICBhZGRpdGlvbmFsU3R5bGVzaGVldFBhdGhzOiBzdHJpbmdbXSxcbiAgICAgIGlzVGVzdFRhcmdldDogYm9vbGVhbixcbiAgICApIHtcbiAgICAgIGNvbnN0IHByb2dyYW0gPSBVcGRhdGVQcm9qZWN0LmNyZWF0ZVByb2dyYW1Gcm9tVHNjb25maWcodHNjb25maWdQYXRoLCBmaWxlU3lzdGVtKTtcbiAgICAgIGNvbnN0IHVwZGF0ZUNvbnRleHQ6IERldmtpdENvbnRleHQgPSB7XG4gICAgICAgIGlzVGVzdFRhcmdldCxcbiAgICAgICAgcHJvamVjdE5hbWUsXG4gICAgICAgIHByb2plY3QsXG4gICAgICAgIHRyZWUsXG4gICAgICB9O1xuXG4gICAgICBjb25zdCB1cGRhdGVQcm9qZWN0ID0gbmV3IFVwZGF0ZVByb2plY3QoXG4gICAgICAgIHVwZGF0ZUNvbnRleHQsXG4gICAgICAgIHByb2dyYW0sXG4gICAgICAgIGZpbGVTeXN0ZW0sXG4gICAgICAgIGFuYWx5emVkRmlsZXMsXG4gICAgICAgIGNvbnRleHQubG9nZ2VyLFxuICAgICAgKTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gdXBkYXRlUHJvamVjdC5taWdyYXRlKFxuICAgICAgICBtaWdyYXRpb25zLFxuICAgICAgICB0YXJnZXRWZXJzaW9uLFxuICAgICAgICB1cGdyYWRlRGF0YSxcbiAgICAgICAgYWRkaXRpb25hbFN0eWxlc2hlZXRQYXRocyxcbiAgICAgICk7XG5cbiAgICAgIC8vIENvbW1pdCBhbGwgcmVjb3JkZWQgZWRpdHMgaW4gdGhlIHVwZGF0ZSByZWNvcmRlci4gV2UgYXBwbHkgdGhlIGVkaXRzIGFmdGVyIGFsbFxuICAgICAgLy8gbWlncmF0aW9ucyByYW4gYmVjYXVzZSBvdGhlcndpc2Ugb2Zmc2V0cyBpbiB0aGUgVHlwZVNjcmlwdCBwcm9ncmFtIHdvdWxkIGJlXG4gICAgICAvLyBzaGlmdGVkIGFuZCBpbmRpdmlkdWFsIG1pZ3JhdGlvbnMgY291bGQgbm8gbG9uZ2VyIHVwZGF0ZSB0aGUgc2FtZSBzb3VyY2UgZmlsZS5cbiAgICAgIGZpbGVTeXN0ZW0uY29tbWl0RWRpdHMoKTtcblxuICAgICAgaGFzRmFpbHVyZXMgPSBoYXNGYWlsdXJlcyB8fCByZXN1bHQuaGFzRmFpbHVyZXM7XG4gICAgfVxuICB9O1xufVxuXG4vKiogV2hldGhlciB0aGUgZ2l2ZW4gbWlncmF0aW9uIHR5cGUgcmVmZXJzIHRvIGEgZGV2a2l0IG1pZ3JhdGlvbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRGV2a2l0TWlncmF0aW9uKFxuICB2YWx1ZTogTWlncmF0aW9uQ3RvcjxhbnksIGFueT4sXG4pOiB2YWx1ZSBpcyBEZXZraXRNaWdyYXRpb25DdG9yPGFueT4ge1xuICByZXR1cm4gRGV2a2l0TWlncmF0aW9uLmlzUHJvdG90eXBlT2YodmFsdWUpO1xufVxuIl19