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
        const workspace = yield (0, project_tsconfig_paths_1.getWorkspaceConfigGracefully)(tree);
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
                logger.warn(`Could not find TypeScript project for project: ${projectName}`);
                continue;
            }
            // In some applications, developers will have global stylesheets which are not
            // specified in any Angular component. Therefore we glob up all CSS and SCSS files
            // in the project and migrate them if needed.
            // TODO: rework this to collect global stylesheets from the workspace config. COMP-280.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2a2l0LW1pZ3JhdGlvbi1ydWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL25nLXVwZGF0ZS9kZXZraXQtbWlncmF0aW9uLXJ1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0FBR0gsNERBQXdFO0FBR3hFLGdEQUE2QztBQUk3Qyw0RUFBb0c7QUFFcEcsNkRBQXNEO0FBQ3RELHlEQUF1RjtBQUN2Rix5REFBdUQ7QUFDdkQsMEVBQTZFO0FBQzdFLHNFQUF5RTtBQUN6RSwwREFBNkQ7QUFDN0QsOEVBQWlGO0FBQ2pGLDhEQUFpRTtBQUNqRSxzRUFBeUU7QUFDekUsMERBQTZEO0FBQzdELDhFQUFnRjtBQUNoRiw4REFBaUU7QUFDakUsNERBQStEO0FBQy9ELGdFQUFtRTtBQUVuRSxnRUFBbUU7QUFHbkUsdURBQXVEO0FBQzFDLFFBQUEsYUFBYSxHQUFpQztJQUN6RCxpREFBMkI7SUFDM0IsNkNBQXlCO0lBQ3pCLGlDQUFtQjtJQUNuQixxREFBNkI7SUFDN0IscUNBQXFCO0lBQ3JCLDZDQUF5QjtJQUN6QixpQ0FBbUI7SUFDbkIsb0RBQTRCO0lBQzVCLHFDQUFxQjtJQUNyQixtQ0FBb0I7SUFDcEIsdUNBQXNCO0lBQ3RCLHVDQUFzQjtDQUN2QixDQUFDO0FBT0Y7OztHQUdHO0FBQ0gsU0FBZ0IsNEJBQTRCLENBQ3hDLGFBQTRCLEVBQUUsZUFBMEMsRUFDeEUsV0FBd0IsRUFBRSxxQkFBdUM7SUFDbkUsT0FBTyxDQUFPLElBQVUsRUFBRSxPQUF5QixFQUFFLEVBQUU7UUFDckQsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztRQUM5QixNQUFNLFNBQVMsR0FBRyxNQUFNLElBQUEscURBQTRCLEVBQUMsSUFBSSxDQUFDLENBQUM7UUFFM0QsSUFBSSxTQUFTLEtBQUssSUFBSSxFQUFFO1lBQ3RCLE1BQU0sQ0FB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QUFNLGFBQWEsR0FBa0I7Z0JBQ25DLFlBQVk7Z0JBQ1osV0FBVztnQkFDWCxPQUFPO2dCQUNQLElBQUk7YUFDTCxDQUFDO1lBRUYsTUFBTSxhQUFhLEdBQUcsSUFBSSwyQkFBYSxDQUNyQyxhQUFhLEVBQ2IsT0FBTyxFQUNQLFVBQVUsRUFDVixhQUFhLEVBQ2IsT0FBTyxDQUFDLE1BQU0sQ0FDZixDQUFDO1lBRUYsTUFBTSxNQUFNLEdBQ1YsYUFBYSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO1lBRTNGLGlGQUFpRjtZQUNqRiw4RUFBOEU7WUFDOUUsaUZBQWlGO1lBQ2pGLFVBQVUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUV6QixXQUFXLEdBQUcsV0FBVyxJQUFJLE1BQU0sQ0FBQyxXQUFXLENBQUM7UUFDbEQsQ0FBQztJQUNILENBQUMsQ0FBQSxDQUFDO0FBQ0osQ0FBQztBQW5HRCxvRUFtR0M7QUFFRCxvRUFBb0U7QUFDcEUsU0FBZ0IsaUJBQWlCLENBQUMsS0FBOEI7SUFFOUQsT0FBTyxrQ0FBZSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM5QyxDQUFDO0FBSEQsOENBR0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNDb250ZXh0LCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge05vZGVQYWNrYWdlSW5zdGFsbFRhc2t9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzL3Rhc2tzJztcbmltcG9ydCB7UHJvamVjdERlZmluaXRpb259IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlL3NyYy93b3Jrc3BhY2UnO1xuXG5pbXBvcnQge1VwZGF0ZVByb2plY3R9IGZyb20gJy4uL3VwZGF0ZS10b29sJztcbmltcG9ydCB7V29ya3NwYWNlUGF0aH0gZnJvbSAnLi4vdXBkYXRlLXRvb2wvZmlsZS1zeXN0ZW0nO1xuaW1wb3J0IHtNaWdyYXRpb25DdG9yfSBmcm9tICcuLi91cGRhdGUtdG9vbC9taWdyYXRpb24nO1xuaW1wb3J0IHtUYXJnZXRWZXJzaW9ufSBmcm9tICcuLi91cGRhdGUtdG9vbC90YXJnZXQtdmVyc2lvbic7XG5pbXBvcnQge2dldFRhcmdldFRzY29uZmlnUGF0aCwgZ2V0V29ya3NwYWNlQ29uZmlnR3JhY2VmdWxseX0gZnJvbSAnLi4vdXRpbHMvcHJvamVjdC10c2NvbmZpZy1wYXRocyc7XG5cbmltcG9ydCB7RGV2a2l0RmlsZVN5c3RlbX0gZnJvbSAnLi9kZXZraXQtZmlsZS1zeXN0ZW0nO1xuaW1wb3J0IHtEZXZraXRDb250ZXh0LCBEZXZraXRNaWdyYXRpb24sIERldmtpdE1pZ3JhdGlvbkN0b3J9IGZyb20gJy4vZGV2a2l0LW1pZ3JhdGlvbic7XG5pbXBvcnQge2ZpbmRTdHlsZXNoZWV0RmlsZXN9IGZyb20gJy4vZmluZC1zdHlsZXNoZWV0cyc7XG5pbXBvcnQge0F0dHJpYnV0ZVNlbGVjdG9yc01pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL2F0dHJpYnV0ZS1zZWxlY3RvcnMnO1xuaW1wb3J0IHtDbGFzc0luaGVyaXRhbmNlTWlncmF0aW9ufSBmcm9tICcuL21pZ3JhdGlvbnMvY2xhc3MtaW5oZXJpdGFuY2UnO1xuaW1wb3J0IHtDbGFzc05hbWVzTWlncmF0aW9ufSBmcm9tICcuL21pZ3JhdGlvbnMvY2xhc3MtbmFtZXMnO1xuaW1wb3J0IHtDb25zdHJ1Y3RvclNpZ25hdHVyZU1pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL2NvbnN0cnVjdG9yLXNpZ25hdHVyZSc7XG5pbXBvcnQge0Nzc1NlbGVjdG9yc01pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL2Nzcy1zZWxlY3RvcnMnO1xuaW1wb3J0IHtFbGVtZW50U2VsZWN0b3JzTWlncmF0aW9ufSBmcm9tICcuL21pZ3JhdGlvbnMvZWxlbWVudC1zZWxlY3RvcnMnO1xuaW1wb3J0IHtJbnB1dE5hbWVzTWlncmF0aW9ufSBmcm9tICcuL21pZ3JhdGlvbnMvaW5wdXQtbmFtZXMnO1xuaW1wb3J0IHtNZXRob2RDYWxsQXJndW1lbnRzTWlncmF0aW9ufSBmcm9tICcuL21pZ3JhdGlvbnMvbWV0aG9kLWNhbGwtYXJndW1lbnRzJztcbmltcG9ydCB7TWlzY1RlbXBsYXRlTWlncmF0aW9ufSBmcm9tICcuL21pZ3JhdGlvbnMvbWlzYy10ZW1wbGF0ZSc7XG5pbXBvcnQge091dHB1dE5hbWVzTWlncmF0aW9ufSBmcm9tICcuL21pZ3JhdGlvbnMvb3V0cHV0LW5hbWVzJztcbmltcG9ydCB7UHJvcGVydHlOYW1lc01pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL3Byb3BlcnR5LW5hbWVzJztcbmltcG9ydCB7VXBncmFkZURhdGF9IGZyb20gJy4vdXBncmFkZS1kYXRhJztcbmltcG9ydCB7U3ltYm9sUmVtb3ZhbE1pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL3N5bWJvbC1yZW1vdmFsJztcblxuXG4vKiogTGlzdCBvZiBtaWdyYXRpb25zIHdoaWNoIHJ1biBmb3IgdGhlIENESyB1cGRhdGUuICovXG5leHBvcnQgY29uc3QgY2RrTWlncmF0aW9uczogTWlncmF0aW9uQ3RvcjxVcGdyYWRlRGF0YT5bXSA9IFtcbiAgQXR0cmlidXRlU2VsZWN0b3JzTWlncmF0aW9uLFxuICBDbGFzc0luaGVyaXRhbmNlTWlncmF0aW9uLFxuICBDbGFzc05hbWVzTWlncmF0aW9uLFxuICBDb25zdHJ1Y3RvclNpZ25hdHVyZU1pZ3JhdGlvbixcbiAgQ3NzU2VsZWN0b3JzTWlncmF0aW9uLFxuICBFbGVtZW50U2VsZWN0b3JzTWlncmF0aW9uLFxuICBJbnB1dE5hbWVzTWlncmF0aW9uLFxuICBNZXRob2RDYWxsQXJndW1lbnRzTWlncmF0aW9uLFxuICBNaXNjVGVtcGxhdGVNaWdyYXRpb24sXG4gIE91dHB1dE5hbWVzTWlncmF0aW9uLFxuICBQcm9wZXJ0eU5hbWVzTWlncmF0aW9uLFxuICBTeW1ib2xSZW1vdmFsTWlncmF0aW9uLFxuXTtcblxuZXhwb3J0IHR5cGUgTnVsbGFibGVEZXZraXRNaWdyYXRpb24gPSBNaWdyYXRpb25DdG9yPFVwZ3JhZGVEYXRhfG51bGwsIERldmtpdENvbnRleHQ+O1xuXG50eXBlIFBvc3RNaWdyYXRpb25GbiA9XG4gICAgKGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQsIHRhcmdldFZlcnNpb246IFRhcmdldFZlcnNpb24sIGhhc0ZhaWx1cmU6IGJvb2xlYW4pID0+IHZvaWQ7XG5cbi8qKlxuICogQ3JlYXRlcyBhIEFuZ3VsYXIgc2NoZW1hdGljIHJ1bGUgdGhhdCBydW5zIHRoZSB1cGdyYWRlIGZvciB0aGVcbiAqIHNwZWNpZmllZCB0YXJnZXQgdmVyc2lvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU1pZ3JhdGlvblNjaGVtYXRpY1J1bGUoXG4gICAgdGFyZ2V0VmVyc2lvbjogVGFyZ2V0VmVyc2lvbiwgZXh0cmFNaWdyYXRpb25zOiBOdWxsYWJsZURldmtpdE1pZ3JhdGlvbltdLFxuICAgIHVwZ3JhZGVEYXRhOiBVcGdyYWRlRGF0YSwgb25NaWdyYXRpb25Db21wbGV0ZUZuPzogUG9zdE1pZ3JhdGlvbkZuKTogUnVsZSB7XG4gIHJldHVybiBhc3luYyAodHJlZTogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IGxvZ2dlciA9IGNvbnRleHQubG9nZ2VyO1xuICAgIGNvbnN0IHdvcmtzcGFjZSA9IGF3YWl0IGdldFdvcmtzcGFjZUNvbmZpZ0dyYWNlZnVsbHkodHJlZSk7XG5cbiAgICBpZiAod29ya3NwYWNlID09PSBudWxsKSB7XG4gICAgICBsb2dnZXIuZXJyb3IoJ0NvdWxkIG5vdCBmaW5kIHdvcmtzcGFjZSBjb25maWd1cmF0aW9uIGZpbGUuJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gS2VlcCB0cmFjayBvZiBhbGwgcHJvamVjdCBzb3VyY2UgZmlsZXMgd2hpY2ggaGF2ZSBiZWVuIGNoZWNrZWQvbWlncmF0ZWQuIFRoaXMgaXNcbiAgICAvLyBuZWNlc3NhcnkgYmVjYXVzZSBtdWx0aXBsZSBUeXBlU2NyaXB0IHByb2plY3RzIGNhbiBjb250YWluIHRoZSBzYW1lIHNvdXJjZSBmaWxlIGFuZFxuICAgIC8vIHdlIGRvbid0IHdhbnQgdG8gY2hlY2sgdGhlc2UgYWdhaW4sIGFzIHRoaXMgd291bGQgcmVzdWx0IGluIGR1cGxpY2F0ZWQgZmFpbHVyZSBtZXNzYWdlcy5cbiAgICBjb25zdCBhbmFseXplZEZpbGVzID0gbmV3IFNldDxXb3Jrc3BhY2VQYXRoPigpO1xuICAgIGNvbnN0IGZpbGVTeXN0ZW0gPSBuZXcgRGV2a2l0RmlsZVN5c3RlbSh0cmVlKTtcbiAgICBjb25zdCBwcm9qZWN0TmFtZXMgPSB3b3Jrc3BhY2UucHJvamVjdHMua2V5cygpO1xuICAgIGNvbnN0IG1pZ3JhdGlvbnMgPSBbLi4uY2RrTWlncmF0aW9ucywgLi4uZXh0cmFNaWdyYXRpb25zXSBhcyBOdWxsYWJsZURldmtpdE1pZ3JhdGlvbltdO1xuICAgIGxldCBoYXNGYWlsdXJlcyA9IGZhbHNlO1xuXG4gICAgZm9yIChjb25zdCBwcm9qZWN0TmFtZSBvZiBwcm9qZWN0TmFtZXMpIHtcbiAgICAgIGNvbnN0IHByb2plY3QgPSB3b3Jrc3BhY2UucHJvamVjdHMuZ2V0KHByb2plY3ROYW1lKSE7XG4gICAgICBjb25zdCBidWlsZFRzY29uZmlnUGF0aCA9IGdldFRhcmdldFRzY29uZmlnUGF0aChwcm9qZWN0LCAnYnVpbGQnKTtcbiAgICAgIGNvbnN0IHRlc3RUc2NvbmZpZ1BhdGggPSBnZXRUYXJnZXRUc2NvbmZpZ1BhdGgocHJvamVjdCwgJ3Rlc3QnKTtcblxuICAgICAgaWYgKCFidWlsZFRzY29uZmlnUGF0aCAmJiAhdGVzdFRzY29uZmlnUGF0aCkge1xuICAgICAgICBsb2dnZXIud2FybihgQ291bGQgbm90IGZpbmQgVHlwZVNjcmlwdCBwcm9qZWN0IGZvciBwcm9qZWN0OiAke3Byb2plY3ROYW1lfWApO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gSW4gc29tZSBhcHBsaWNhdGlvbnMsIGRldmVsb3BlcnMgd2lsbCBoYXZlIGdsb2JhbCBzdHlsZXNoZWV0cyB3aGljaCBhcmUgbm90XG4gICAgICAvLyBzcGVjaWZpZWQgaW4gYW55IEFuZ3VsYXIgY29tcG9uZW50LiBUaGVyZWZvcmUgd2UgZ2xvYiB1cCBhbGwgQ1NTIGFuZCBTQ1NTIGZpbGVzXG4gICAgICAvLyBpbiB0aGUgcHJvamVjdCBhbmQgbWlncmF0ZSB0aGVtIGlmIG5lZWRlZC5cbiAgICAgIC8vIFRPRE86IHJld29yayB0aGlzIHRvIGNvbGxlY3QgZ2xvYmFsIHN0eWxlc2hlZXRzIGZyb20gdGhlIHdvcmtzcGFjZSBjb25maWcuIENPTVAtMjgwLlxuICAgICAgY29uc3QgYWRkaXRpb25hbFN0eWxlc2hlZXRQYXRocyA9IGZpbmRTdHlsZXNoZWV0RmlsZXModHJlZSwgcHJvamVjdC5yb290KTtcblxuICAgICAgaWYgKGJ1aWxkVHNjb25maWdQYXRoICE9PSBudWxsKSB7XG4gICAgICAgIHJ1bk1pZ3JhdGlvbnMocHJvamVjdCwgcHJvamVjdE5hbWUsIGJ1aWxkVHNjb25maWdQYXRoLCBhZGRpdGlvbmFsU3R5bGVzaGVldFBhdGhzLCBmYWxzZSk7XG4gICAgICB9XG4gICAgICBpZiAodGVzdFRzY29uZmlnUGF0aCAhPT0gbnVsbCkge1xuICAgICAgICBydW5NaWdyYXRpb25zKHByb2plY3QsIHByb2plY3ROYW1lLCB0ZXN0VHNjb25maWdQYXRoLCBhZGRpdGlvbmFsU3R5bGVzaGVldFBhdGhzLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgcnVuUGFja2FnZU1hbmFnZXIgPSBmYWxzZTtcbiAgICAvLyBSdW4gdGhlIGdsb2JhbCBwb3N0IG1pZ3JhdGlvbiBzdGF0aWMgbWVtYmVycyBmb3IgYWxsXG4gICAgLy8gcmVnaXN0ZXJlZCBkZXZraXQgbWlncmF0aW9ucy5cbiAgICBtaWdyYXRpb25zLmZvckVhY2gobSA9PiB7XG4gICAgICBjb25zdCBhY3Rpb25SZXN1bHQgPSBpc0RldmtpdE1pZ3JhdGlvbihtKSAmJiBtLmdsb2JhbFBvc3RNaWdyYXRpb24gIT09IHVuZGVmaW5lZCA/XG4gICAgICAgICAgbS5nbG9iYWxQb3N0TWlncmF0aW9uKHRyZWUsIGNvbnRleHQpIDogbnVsbDtcbiAgICAgIGlmIChhY3Rpb25SZXN1bHQpIHtcbiAgICAgICAgcnVuUGFja2FnZU1hbmFnZXIgPSBydW5QYWNrYWdlTWFuYWdlciB8fCBhY3Rpb25SZXN1bHQucnVuUGFja2FnZU1hbmFnZXI7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBJZiBhIG1pZ3JhdGlvbiByZXF1ZXN0ZWQgdGhlIHBhY2thZ2UgbWFuYWdlciB0byBydW4sIHdlIHJ1biBpdCBhcyBhblxuICAgIC8vIGFzeW5jaHJvbm91cyBwb3N0IG1pZ3JhdGlvbiB0YXNrLiBXZSBjYW5ub3QgcnVuIGl0IHN5bmNocm9ub3VzbHksXG4gICAgLy8gYXMgZmlsZSBjaGFuZ2VzIGZyb20gdGhlIGN1cnJlbnQgbWlncmF0aW9uIHRhc2sgYXJlIG5vdCBhcHBsaWVkIHRvXG4gICAgLy8gdGhlIGZpbGUgc3lzdGVtIHlldC5cbiAgICBpZiAocnVuUGFja2FnZU1hbmFnZXIpIHtcbiAgICAgIGNvbnRleHQuYWRkVGFzayhuZXcgTm9kZVBhY2thZ2VJbnN0YWxsVGFzayh7cXVpZXQ6IGZhbHNlfSkpO1xuICAgIH1cblxuICAgIGlmIChvbk1pZ3JhdGlvbkNvbXBsZXRlRm4pIHtcbiAgICAgIG9uTWlncmF0aW9uQ29tcGxldGVGbihjb250ZXh0LCB0YXJnZXRWZXJzaW9uLCBoYXNGYWlsdXJlcyk7XG4gICAgfVxuXG4gICAgLyoqIFJ1bnMgdGhlIG1pZ3JhdGlvbnMgZm9yIHRoZSBzcGVjaWZpZWQgd29ya3NwYWNlIHByb2plY3QuICovXG4gICAgZnVuY3Rpb24gcnVuTWlncmF0aW9ucyhwcm9qZWN0OiBQcm9qZWN0RGVmaW5pdGlvbiwgcHJvamVjdE5hbWU6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHRzY29uZmlnUGF0aDogV29ya3NwYWNlUGF0aCwgYWRkaXRpb25hbFN0eWxlc2hlZXRQYXRoczogc3RyaW5nW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBpc1Rlc3RUYXJnZXQ6IGJvb2xlYW4pIHtcbiAgICAgIGNvbnN0IHByb2dyYW0gPSBVcGRhdGVQcm9qZWN0LmNyZWF0ZVByb2dyYW1Gcm9tVHNjb25maWcodHNjb25maWdQYXRoLCBmaWxlU3lzdGVtKTtcbiAgICAgIGNvbnN0IHVwZGF0ZUNvbnRleHQ6IERldmtpdENvbnRleHQgPSB7XG4gICAgICAgIGlzVGVzdFRhcmdldCxcbiAgICAgICAgcHJvamVjdE5hbWUsXG4gICAgICAgIHByb2plY3QsXG4gICAgICAgIHRyZWUsXG4gICAgICB9O1xuXG4gICAgICBjb25zdCB1cGRhdGVQcm9qZWN0ID0gbmV3IFVwZGF0ZVByb2plY3QoXG4gICAgICAgIHVwZGF0ZUNvbnRleHQsXG4gICAgICAgIHByb2dyYW0sXG4gICAgICAgIGZpbGVTeXN0ZW0sXG4gICAgICAgIGFuYWx5emVkRmlsZXMsXG4gICAgICAgIGNvbnRleHQubG9nZ2VyLFxuICAgICAgKTtcblxuICAgICAgY29uc3QgcmVzdWx0ID1cbiAgICAgICAgdXBkYXRlUHJvamVjdC5taWdyYXRlKG1pZ3JhdGlvbnMsIHRhcmdldFZlcnNpb24sIHVwZ3JhZGVEYXRhLCBhZGRpdGlvbmFsU3R5bGVzaGVldFBhdGhzKTtcblxuICAgICAgLy8gQ29tbWl0IGFsbCByZWNvcmRlZCBlZGl0cyBpbiB0aGUgdXBkYXRlIHJlY29yZGVyLiBXZSBhcHBseSB0aGUgZWRpdHMgYWZ0ZXIgYWxsXG4gICAgICAvLyBtaWdyYXRpb25zIHJhbiBiZWNhdXNlIG90aGVyd2lzZSBvZmZzZXRzIGluIHRoZSBUeXBlU2NyaXB0IHByb2dyYW0gd291bGQgYmVcbiAgICAgIC8vIHNoaWZ0ZWQgYW5kIGluZGl2aWR1YWwgbWlncmF0aW9ucyBjb3VsZCBubyBsb25nZXIgdXBkYXRlIHRoZSBzYW1lIHNvdXJjZSBmaWxlLlxuICAgICAgZmlsZVN5c3RlbS5jb21taXRFZGl0cygpO1xuXG4gICAgICBoYXNGYWlsdXJlcyA9IGhhc0ZhaWx1cmVzIHx8IHJlc3VsdC5oYXNGYWlsdXJlcztcbiAgICB9XG4gIH07XG59XG5cbi8qKiBXaGV0aGVyIHRoZSBnaXZlbiBtaWdyYXRpb24gdHlwZSByZWZlcnMgdG8gYSBkZXZraXQgbWlncmF0aW9uICovXG5leHBvcnQgZnVuY3Rpb24gaXNEZXZraXRNaWdyYXRpb24odmFsdWU6IE1pZ3JhdGlvbkN0b3I8YW55LCBhbnk+KVxuICAgIDogdmFsdWUgaXMgRGV2a2l0TWlncmF0aW9uQ3Rvcjxhbnk+IHtcbiAgcmV0dXJuIERldmtpdE1pZ3JhdGlvbi5pc1Byb3RvdHlwZU9mKHZhbHVlKTtcbn1cbiJdfQ==