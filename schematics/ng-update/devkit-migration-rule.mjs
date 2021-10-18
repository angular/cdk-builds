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
            const actionResult = isDevkitMigration(m) && m.globalPostMigration !== undefined
                ? m.globalPostMigration(tree, context)
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
    });
}
exports.createMigrationSchematicRule = createMigrationSchematicRule;
/** Whether the given migration type refers to a devkit migration */
function isDevkitMigration(value) {
    return devkit_migration_1.DevkitMigration.isPrototypeOf(value);
}
exports.isDevkitMigration = isDevkitMigration;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2a2l0LW1pZ3JhdGlvbi1ydWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL25nLXVwZGF0ZS9kZXZraXQtbWlncmF0aW9uLXJ1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0FBR0gsNERBQXdFO0FBR3hFLGdEQUE2QztBQUk3Qyw0RUFBb0c7QUFFcEcsNkRBQXNEO0FBQ3RELHlEQUF1RjtBQUN2Rix5REFBdUQ7QUFDdkQsMEVBQTZFO0FBQzdFLHNFQUF5RTtBQUN6RSwwREFBNkQ7QUFDN0QsOEVBQWlGO0FBQ2pGLDhEQUFpRTtBQUNqRSxzRUFBeUU7QUFDekUsMERBQTZEO0FBQzdELDhFQUFnRjtBQUNoRiw4REFBaUU7QUFDakUsNERBQStEO0FBQy9ELGdFQUFtRTtBQUVuRSxnRUFBbUU7QUFFbkUsdURBQXVEO0FBQzFDLFFBQUEsYUFBYSxHQUFpQztJQUN6RCxpREFBMkI7SUFDM0IsNkNBQXlCO0lBQ3pCLGlDQUFtQjtJQUNuQixxREFBNkI7SUFDN0IscUNBQXFCO0lBQ3JCLDZDQUF5QjtJQUN6QixpQ0FBbUI7SUFDbkIsb0RBQTRCO0lBQzVCLHFDQUFxQjtJQUNyQixtQ0FBb0I7SUFDcEIsdUNBQXNCO0lBQ3RCLHVDQUFzQjtDQUN2QixDQUFDO0FBVUY7OztHQUdHO0FBQ0gsU0FBZ0IsNEJBQTRCLENBQzFDLGFBQTRCLEVBQzVCLGVBQTBDLEVBQzFDLFdBQXdCLEVBQ3hCLHFCQUF1QztJQUV2QyxPQUFPLENBQU8sSUFBVSxFQUFFLE9BQXlCLEVBQUUsRUFBRTtRQUNyRCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQzlCLE1BQU0sU0FBUyxHQUFHLE1BQU0sSUFBQSxxREFBNEIsRUFBQyxJQUFJLENBQUMsQ0FBQztRQUUzRCxJQUFJLFNBQVMsS0FBSyxJQUFJLEVBQUU7WUFDdEIsTUFBTSxD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WUFDbEYsTUFBTSxhQUFhLEdBQWtCO2dCQUNuQyxZQUFZO2dCQUNaLFdBQVc7Z0JBQ1gsT0FBTztnQkFDUCxJQUFJO2FBQ0wsQ0FBQztZQUVGLE1BQU0sYUFBYSxHQUFHLElBQUksMkJBQWEsQ0FDckMsYUFBYSxFQUNiLE9BQU8sRUFDUCxVQUFVLEVBQ1YsYUFBYSxFQUNiLE9BQU8sQ0FBQyxNQUFNLENBQ2YsQ0FBQztZQUVGLE1BQU0sTUFBTSxHQUFHLGFBQWEsQ0FBQyxPQUFPLENBQ2xDLFVBQVUsRUFDVixhQUFhLEVBQ2IsV0FBVyxFQUNYLHlCQUF5QixDQUMxQixDQUFDO1lBRUYsaUZBQWlGO1lBQ2pGLDhFQUE4RTtZQUM5RSxpRkFBaUY7WUFDakYsVUFBVSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBRXpCLFdBQVcsR0FBRyxXQUFXLElBQUksTUFBTSxDQUFDLFdBQVcsQ0FBQztRQUNsRCxDQUFDO0lBQ0gsQ0FBQyxDQUFBLENBQUM7QUFDSixDQUFDO0FBaEhELG9FQWdIQztBQUVELG9FQUFvRTtBQUNwRSxTQUFnQixpQkFBaUIsQ0FDL0IsS0FBOEI7SUFFOUIsT0FBTyxrQ0FBZSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM5QyxDQUFDO0FBSkQsOENBSUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNDb250ZXh0LCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge05vZGVQYWNrYWdlSW5zdGFsbFRhc2t9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzL3Rhc2tzJztcbmltcG9ydCB7UHJvamVjdERlZmluaXRpb259IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlL3NyYy93b3Jrc3BhY2UnO1xuXG5pbXBvcnQge1VwZGF0ZVByb2plY3R9IGZyb20gJy4uL3VwZGF0ZS10b29sJztcbmltcG9ydCB7V29ya3NwYWNlUGF0aH0gZnJvbSAnLi4vdXBkYXRlLXRvb2wvZmlsZS1zeXN0ZW0nO1xuaW1wb3J0IHtNaWdyYXRpb25DdG9yfSBmcm9tICcuLi91cGRhdGUtdG9vbC9taWdyYXRpb24nO1xuaW1wb3J0IHtUYXJnZXRWZXJzaW9ufSBmcm9tICcuLi91cGRhdGUtdG9vbC90YXJnZXQtdmVyc2lvbic7XG5pbXBvcnQge2dldFRhcmdldFRzY29uZmlnUGF0aCwgZ2V0V29ya3NwYWNlQ29uZmlnR3JhY2VmdWxseX0gZnJvbSAnLi4vdXRpbHMvcHJvamVjdC10c2NvbmZpZy1wYXRocyc7XG5cbmltcG9ydCB7RGV2a2l0RmlsZVN5c3RlbX0gZnJvbSAnLi9kZXZraXQtZmlsZS1zeXN0ZW0nO1xuaW1wb3J0IHtEZXZraXRDb250ZXh0LCBEZXZraXRNaWdyYXRpb24sIERldmtpdE1pZ3JhdGlvbkN0b3J9IGZyb20gJy4vZGV2a2l0LW1pZ3JhdGlvbic7XG5pbXBvcnQge2ZpbmRTdHlsZXNoZWV0RmlsZXN9IGZyb20gJy4vZmluZC1zdHlsZXNoZWV0cyc7XG5pbXBvcnQge0F0dHJpYnV0ZVNlbGVjdG9yc01pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL2F0dHJpYnV0ZS1zZWxlY3RvcnMnO1xuaW1wb3J0IHtDbGFzc0luaGVyaXRhbmNlTWlncmF0aW9ufSBmcm9tICcuL21pZ3JhdGlvbnMvY2xhc3MtaW5oZXJpdGFuY2UnO1xuaW1wb3J0IHtDbGFzc05hbWVzTWlncmF0aW9ufSBmcm9tICcuL21pZ3JhdGlvbnMvY2xhc3MtbmFtZXMnO1xuaW1wb3J0IHtDb25zdHJ1Y3RvclNpZ25hdHVyZU1pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL2NvbnN0cnVjdG9yLXNpZ25hdHVyZSc7XG5pbXBvcnQge0Nzc1NlbGVjdG9yc01pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL2Nzcy1zZWxlY3RvcnMnO1xuaW1wb3J0IHtFbGVtZW50U2VsZWN0b3JzTWlncmF0aW9ufSBmcm9tICcuL21pZ3JhdGlvbnMvZWxlbWVudC1zZWxlY3RvcnMnO1xuaW1wb3J0IHtJbnB1dE5hbWVzTWlncmF0aW9ufSBmcm9tICcuL21pZ3JhdGlvbnMvaW5wdXQtbmFtZXMnO1xuaW1wb3J0IHtNZXRob2RDYWxsQXJndW1lbnRzTWlncmF0aW9ufSBmcm9tICcuL21pZ3JhdGlvbnMvbWV0aG9kLWNhbGwtYXJndW1lbnRzJztcbmltcG9ydCB7TWlzY1RlbXBsYXRlTWlncmF0aW9ufSBmcm9tICcuL21pZ3JhdGlvbnMvbWlzYy10ZW1wbGF0ZSc7XG5pbXBvcnQge091dHB1dE5hbWVzTWlncmF0aW9ufSBmcm9tICcuL21pZ3JhdGlvbnMvb3V0cHV0LW5hbWVzJztcbmltcG9ydCB7UHJvcGVydHlOYW1lc01pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL3Byb3BlcnR5LW5hbWVzJztcbmltcG9ydCB7VXBncmFkZURhdGF9IGZyb20gJy4vdXBncmFkZS1kYXRhJztcbmltcG9ydCB7U3ltYm9sUmVtb3ZhbE1pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL3N5bWJvbC1yZW1vdmFsJztcblxuLyoqIExpc3Qgb2YgbWlncmF0aW9ucyB3aGljaCBydW4gZm9yIHRoZSBDREsgdXBkYXRlLiAqL1xuZXhwb3J0IGNvbnN0IGNka01pZ3JhdGlvbnM6IE1pZ3JhdGlvbkN0b3I8VXBncmFkZURhdGE+W10gPSBbXG4gIEF0dHJpYnV0ZVNlbGVjdG9yc01pZ3JhdGlvbixcbiAgQ2xhc3NJbmhlcml0YW5jZU1pZ3JhdGlvbixcbiAgQ2xhc3NOYW1lc01pZ3JhdGlvbixcbiAgQ29uc3RydWN0b3JTaWduYXR1cmVNaWdyYXRpb24sXG4gIENzc1NlbGVjdG9yc01pZ3JhdGlvbixcbiAgRWxlbWVudFNlbGVjdG9yc01pZ3JhdGlvbixcbiAgSW5wdXROYW1lc01pZ3JhdGlvbixcbiAgTWV0aG9kQ2FsbEFyZ3VtZW50c01pZ3JhdGlvbixcbiAgTWlzY1RlbXBsYXRlTWlncmF0aW9uLFxuICBPdXRwdXROYW1lc01pZ3JhdGlvbixcbiAgUHJvcGVydHlOYW1lc01pZ3JhdGlvbixcbiAgU3ltYm9sUmVtb3ZhbE1pZ3JhdGlvbixcbl07XG5cbmV4cG9ydCB0eXBlIE51bGxhYmxlRGV2a2l0TWlncmF0aW9uID0gTWlncmF0aW9uQ3RvcjxVcGdyYWRlRGF0YSB8IG51bGwsIERldmtpdENvbnRleHQ+O1xuXG50eXBlIFBvc3RNaWdyYXRpb25GbiA9IChcbiAgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCxcbiAgdGFyZ2V0VmVyc2lvbjogVGFyZ2V0VmVyc2lvbixcbiAgaGFzRmFpbHVyZTogYm9vbGVhbixcbikgPT4gdm9pZDtcblxuLyoqXG4gKiBDcmVhdGVzIGEgQW5ndWxhciBzY2hlbWF0aWMgcnVsZSB0aGF0IHJ1bnMgdGhlIHVwZ3JhZGUgZm9yIHRoZVxuICogc3BlY2lmaWVkIHRhcmdldCB2ZXJzaW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTWlncmF0aW9uU2NoZW1hdGljUnVsZShcbiAgdGFyZ2V0VmVyc2lvbjogVGFyZ2V0VmVyc2lvbixcbiAgZXh0cmFNaWdyYXRpb25zOiBOdWxsYWJsZURldmtpdE1pZ3JhdGlvbltdLFxuICB1cGdyYWRlRGF0YTogVXBncmFkZURhdGEsXG4gIG9uTWlncmF0aW9uQ29tcGxldGVGbj86IFBvc3RNaWdyYXRpb25Gbixcbik6IFJ1bGUge1xuICByZXR1cm4gYXN5bmMgKHRyZWU6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb25zdCBsb2dnZXIgPSBjb250ZXh0LmxvZ2dlcjtcbiAgICBjb25zdCB3b3Jrc3BhY2UgPSBhd2FpdCBnZXRXb3Jrc3BhY2VDb25maWdHcmFjZWZ1bGx5KHRyZWUpO1xuXG4gICAgaWYgKHdvcmtzcGFjZSA9PT0gbnVsbCkge1xuICAgICAgbG9nZ2VyLmVycm9yKCdDb3VsZCBub3QgZmluZCB3b3Jrc3BhY2UgY29uZmlndXJhdGlvbiBmaWxlLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEtlZXAgdHJhY2sgb2YgYWxsIHByb2plY3Qgc291cmNlIGZpbGVzIHdoaWNoIGhhdmUgYmVlbiBjaGVja2VkL21pZ3JhdGVkLiBUaGlzIGlzXG4gICAgLy8gbmVjZXNzYXJ5IGJlY2F1c2UgbXVsdGlwbGUgVHlwZVNjcmlwdCBwcm9qZWN0cyBjYW4gY29udGFpbiB0aGUgc2FtZSBzb3VyY2UgZmlsZSBhbmRcbiAgICAvLyB3ZSBkb24ndCB3YW50IHRvIGNoZWNrIHRoZXNlIGFnYWluLCBhcyB0aGlzIHdvdWxkIHJlc3VsdCBpbiBkdXBsaWNhdGVkIGZhaWx1cmUgbWVzc2FnZXMuXG4gICAgY29uc3QgYW5hbHl6ZWRGaWxlcyA9IG5ldyBTZXQ8V29ya3NwYWNlUGF0aD4oKTtcbiAgICBjb25zdCBmaWxlU3lzdGVtID0gbmV3IERldmtpdEZpbGVTeXN0ZW0odHJlZSk7XG4gICAgY29uc3QgcHJvamVjdE5hbWVzID0gd29ya3NwYWNlLnByb2plY3RzLmtleXMoKTtcbiAgICBjb25zdCBtaWdyYXRpb25zID0gWy4uLmNka01pZ3JhdGlvbnMsIC4uLmV4dHJhTWlncmF0aW9uc10gYXMgTnVsbGFibGVEZXZraXRNaWdyYXRpb25bXTtcbiAgICBsZXQgaGFzRmFpbHVyZXMgPSBmYWxzZTtcblxuICAgIGZvciAoY29uc3QgcHJvamVjdE5hbWUgb2YgcHJvamVjdE5hbWVzKSB7XG4gICAgICBjb25zdCBwcm9qZWN0ID0gd29ya3NwYWNlLnByb2plY3RzLmdldChwcm9qZWN0TmFtZSkhO1xuICAgICAgY29uc3QgYnVpbGRUc2NvbmZpZ1BhdGggPSBnZXRUYXJnZXRUc2NvbmZpZ1BhdGgocHJvamVjdCwgJ2J1aWxkJyk7XG4gICAgICBjb25zdCB0ZXN0VHNjb25maWdQYXRoID0gZ2V0VGFyZ2V0VHNjb25maWdQYXRoKHByb2plY3QsICd0ZXN0Jyk7XG5cbiAgICAgIGlmICghYnVpbGRUc2NvbmZpZ1BhdGggJiYgIXRlc3RUc2NvbmZpZ1BhdGgpIHtcbiAgICAgICAgbG9nZ2VyLndhcm4oYENvdWxkIG5vdCBmaW5kIFR5cGVTY3JpcHQgcHJvamVjdCBmb3IgcHJvamVjdDogJHtwcm9qZWN0TmFtZX1gKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIEluIHNvbWUgYXBwbGljYXRpb25zLCBkZXZlbG9wZXJzIHdpbGwgaGF2ZSBnbG9iYWwgc3R5bGVzaGVldHMgd2hpY2ggYXJlIG5vdFxuICAgICAgLy8gc3BlY2lmaWVkIGluIGFueSBBbmd1bGFyIGNvbXBvbmVudC4gVGhlcmVmb3JlIHdlIGdsb2IgdXAgYWxsIENTUyBhbmQgU0NTUyBmaWxlc1xuICAgICAgLy8gaW4gdGhlIHByb2plY3QgYW5kIG1pZ3JhdGUgdGhlbSBpZiBuZWVkZWQuXG4gICAgICAvLyBUT0RPOiByZXdvcmsgdGhpcyB0byBjb2xsZWN0IGdsb2JhbCBzdHlsZXNoZWV0cyBmcm9tIHRoZSB3b3Jrc3BhY2UgY29uZmlnLiBDT01QLTI4MC5cbiAgICAgIGNvbnN0IGFkZGl0aW9uYWxTdHlsZXNoZWV0UGF0aHMgPSBmaW5kU3R5bGVzaGVldEZpbGVzKHRyZWUsIHByb2plY3Qucm9vdCk7XG5cbiAgICAgIGlmIChidWlsZFRzY29uZmlnUGF0aCAhPT0gbnVsbCkge1xuICAgICAgICBydW5NaWdyYXRpb25zKHByb2plY3QsIHByb2plY3ROYW1lLCBidWlsZFRzY29uZmlnUGF0aCwgYWRkaXRpb25hbFN0eWxlc2hlZXRQYXRocywgZmFsc2UpO1xuICAgICAgfVxuICAgICAgaWYgKHRlc3RUc2NvbmZpZ1BhdGggIT09IG51bGwpIHtcbiAgICAgICAgcnVuTWlncmF0aW9ucyhwcm9qZWN0LCBwcm9qZWN0TmFtZSwgdGVzdFRzY29uZmlnUGF0aCwgYWRkaXRpb25hbFN0eWxlc2hlZXRQYXRocywgdHJ1ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IHJ1blBhY2thZ2VNYW5hZ2VyID0gZmFsc2U7XG4gICAgLy8gUnVuIHRoZSBnbG9iYWwgcG9zdCBtaWdyYXRpb24gc3RhdGljIG1lbWJlcnMgZm9yIGFsbFxuICAgIC8vIHJlZ2lzdGVyZWQgZGV2a2l0IG1pZ3JhdGlvbnMuXG4gICAgbWlncmF0aW9ucy5mb3JFYWNoKG0gPT4ge1xuICAgICAgY29uc3QgYWN0aW9uUmVzdWx0ID1cbiAgICAgICAgaXNEZXZraXRNaWdyYXRpb24obSkgJiYgbS5nbG9iYWxQb3N0TWlncmF0aW9uICE9PSB1bmRlZmluZWRcbiAgICAgICAgICA/IG0uZ2xvYmFsUG9zdE1pZ3JhdGlvbih0cmVlLCBjb250ZXh0KVxuICAgICAgICAgIDogbnVsbDtcbiAgICAgIGlmIChhY3Rpb25SZXN1bHQpIHtcbiAgICAgICAgcnVuUGFja2FnZU1hbmFnZXIgPSBydW5QYWNrYWdlTWFuYWdlciB8fCBhY3Rpb25SZXN1bHQucnVuUGFja2FnZU1hbmFnZXI7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBJZiBhIG1pZ3JhdGlvbiByZXF1ZXN0ZWQgdGhlIHBhY2thZ2UgbWFuYWdlciB0byBydW4sIHdlIHJ1biBpdCBhcyBhblxuICAgIC8vIGFzeW5jaHJvbm91cyBwb3N0IG1pZ3JhdGlvbiB0YXNrLiBXZSBjYW5ub3QgcnVuIGl0IHN5bmNocm9ub3VzbHksXG4gICAgLy8gYXMgZmlsZSBjaGFuZ2VzIGZyb20gdGhlIGN1cnJlbnQgbWlncmF0aW9uIHRhc2sgYXJlIG5vdCBhcHBsaWVkIHRvXG4gICAgLy8gdGhlIGZpbGUgc3lzdGVtIHlldC5cbiAgICBpZiAocnVuUGFja2FnZU1hbmFnZXIpIHtcbiAgICAgIGNvbnRleHQuYWRkVGFzayhuZXcgTm9kZVBhY2thZ2VJbnN0YWxsVGFzayh7cXVpZXQ6IGZhbHNlfSkpO1xuICAgIH1cblxuICAgIGlmIChvbk1pZ3JhdGlvbkNvbXBsZXRlRm4pIHtcbiAgICAgIG9uTWlncmF0aW9uQ29tcGxldGVGbihjb250ZXh0LCB0YXJnZXRWZXJzaW9uLCBoYXNGYWlsdXJlcyk7XG4gICAgfVxuXG4gICAgLyoqIFJ1bnMgdGhlIG1pZ3JhdGlvbnMgZm9yIHRoZSBzcGVjaWZpZWQgd29ya3NwYWNlIHByb2plY3QuICovXG4gICAgZnVuY3Rpb24gcnVuTWlncmF0aW9ucyhcbiAgICAgIHByb2plY3Q6IFByb2plY3REZWZpbml0aW9uLFxuICAgICAgcHJvamVjdE5hbWU6IHN0cmluZyxcbiAgICAgIHRzY29uZmlnUGF0aDogV29ya3NwYWNlUGF0aCxcbiAgICAgIGFkZGl0aW9uYWxTdHlsZXNoZWV0UGF0aHM6IHN0cmluZ1tdLFxuICAgICAgaXNUZXN0VGFyZ2V0OiBib29sZWFuLFxuICAgICkge1xuICAgICAgY29uc3QgcHJvZ3JhbSA9IFVwZGF0ZVByb2plY3QuY3JlYXRlUHJvZ3JhbUZyb21Uc2NvbmZpZyh0c2NvbmZpZ1BhdGgsIGZpbGVTeXN0ZW0pO1xuICAgICAgY29uc3QgdXBkYXRlQ29udGV4dDogRGV2a2l0Q29udGV4dCA9IHtcbiAgICAgICAgaXNUZXN0VGFyZ2V0LFxuICAgICAgICBwcm9qZWN0TmFtZSxcbiAgICAgICAgcHJvamVjdCxcbiAgICAgICAgdHJlZSxcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHVwZGF0ZVByb2plY3QgPSBuZXcgVXBkYXRlUHJvamVjdChcbiAgICAgICAgdXBkYXRlQ29udGV4dCxcbiAgICAgICAgcHJvZ3JhbSxcbiAgICAgICAgZmlsZVN5c3RlbSxcbiAgICAgICAgYW5hbHl6ZWRGaWxlcyxcbiAgICAgICAgY29udGV4dC5sb2dnZXIsXG4gICAgICApO1xuXG4gICAgICBjb25zdCByZXN1bHQgPSB1cGRhdGVQcm9qZWN0Lm1pZ3JhdGUoXG4gICAgICAgIG1pZ3JhdGlvbnMsXG4gICAgICAgIHRhcmdldFZlcnNpb24sXG4gICAgICAgIHVwZ3JhZGVEYXRhLFxuICAgICAgICBhZGRpdGlvbmFsU3R5bGVzaGVldFBhdGhzLFxuICAgICAgKTtcblxuICAgICAgLy8gQ29tbWl0IGFsbCByZWNvcmRlZCBlZGl0cyBpbiB0aGUgdXBkYXRlIHJlY29yZGVyLiBXZSBhcHBseSB0aGUgZWRpdHMgYWZ0ZXIgYWxsXG4gICAgICAvLyBtaWdyYXRpb25zIHJhbiBiZWNhdXNlIG90aGVyd2lzZSBvZmZzZXRzIGluIHRoZSBUeXBlU2NyaXB0IHByb2dyYW0gd291bGQgYmVcbiAgICAgIC8vIHNoaWZ0ZWQgYW5kIGluZGl2aWR1YWwgbWlncmF0aW9ucyBjb3VsZCBubyBsb25nZXIgdXBkYXRlIHRoZSBzYW1lIHNvdXJjZSBmaWxlLlxuICAgICAgZmlsZVN5c3RlbS5jb21taXRFZGl0cygpO1xuXG4gICAgICBoYXNGYWlsdXJlcyA9IGhhc0ZhaWx1cmVzIHx8IHJlc3VsdC5oYXNGYWlsdXJlcztcbiAgICB9XG4gIH07XG59XG5cbi8qKiBXaGV0aGVyIHRoZSBnaXZlbiBtaWdyYXRpb24gdHlwZSByZWZlcnMgdG8gYSBkZXZraXQgbWlncmF0aW9uICovXG5leHBvcnQgZnVuY3Rpb24gaXNEZXZraXRNaWdyYXRpb24oXG4gIHZhbHVlOiBNaWdyYXRpb25DdG9yPGFueSwgYW55Pixcbik6IHZhbHVlIGlzIERldmtpdE1pZ3JhdGlvbkN0b3I8YW55PiB7XG4gIHJldHVybiBEZXZraXRNaWdyYXRpb24uaXNQcm90b3R5cGVPZih2YWx1ZSk7XG59XG4iXX0=