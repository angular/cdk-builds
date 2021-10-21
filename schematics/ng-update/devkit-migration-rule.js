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
    });
}
exports.createMigrationSchematicRule = createMigrationSchematicRule;
/** Whether the given migration type refers to a devkit migration */
function isDevkitMigration(value) {
    return devkit_migration_1.DevkitMigration.isPrototypeOf(value);
}
exports.isDevkitMigration = isDevkitMigration;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2a2l0LW1pZ3JhdGlvbi1ydWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL25nLXVwZGF0ZS9kZXZraXQtbWlncmF0aW9uLXJ1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0FBR0gsNERBQXdFO0FBR3hFLGdEQUE2QztBQUk3Qyw0RUFBb0c7QUFFcEcsNkRBQXNEO0FBQ3RELHlEQUF1RjtBQUN2Rix5REFBdUQ7QUFDdkQsMEVBQTZFO0FBQzdFLHNFQUF5RTtBQUN6RSwwREFBNkQ7QUFDN0QsOEVBQWlGO0FBQ2pGLDhEQUFpRTtBQUNqRSxzRUFBeUU7QUFDekUsMERBQTZEO0FBQzdELDhFQUFnRjtBQUNoRiw4REFBaUU7QUFDakUsNERBQStEO0FBQy9ELGdFQUFtRTtBQUVuRSxnRUFBbUU7QUFFbkUsdURBQXVEO0FBQzFDLFFBQUEsYUFBYSxHQUFpQztJQUN6RCxpREFBMkI7SUFDM0IsNkNBQXlCO0lBQ3pCLGlDQUFtQjtJQUNuQixxREFBNkI7SUFDN0IscUNBQXFCO0lBQ3JCLDZDQUF5QjtJQUN6QixpQ0FBbUI7SUFDbkIsb0RBQTRCO0lBQzVCLHFDQUFxQjtJQUNyQixtQ0FBb0I7SUFDcEIsdUNBQXNCO0lBQ3RCLHVDQUFzQjtDQUN2QixDQUFDO0FBVUY7OztHQUdHO0FBQ0gsU0FBZ0IsNEJBQTRCLENBQzFDLGFBQTRCLEVBQzVCLGVBQTBDLEVBQzFDLFdBQXdCLEVBQ3hCLHFCQUF1QztJQUV2QyxPQUFPLENBQU8sSUFBVSxFQUFFLE9BQXlCLEVBQUUsRUFBRTtRQUNyRCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQzlCLE1BQU0sU0FBUyxHQUFHLE1BQU0sSUFBQSxxREFBNEIsRUFBQyxJQUFJLENBQUMsQ0FBQztRQUUzRCxJQUFJLFNBQVMsS0FBSyxJQUFJLEVBQUU7WUFDdEIsTUFBTSxD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Q0FBQyxDQUFDO1lBQ2xGLE1BQU0sYUFBYSxHQUFrQjtnQkFDbkMsWUFBWTtnQkFDWixXQUFXO2dCQUNYLE9BQU87Z0JBQ1AsSUFBSTthQUNMLENBQUM7WUFFRixNQUFNLGFBQWEsR0FBRyxJQUFJLDJCQUFhLENBQ3JDLGFBQWEsRUFDYixPQUFPLEVBQ1AsVUFBVSxFQUNWLGFBQWEsRUFDYixPQUFPLENBQUMsTUFBTSxDQUNmLENBQUM7WUFFRixNQUFNLE1BQU0sR0FBRyxhQUFhLENBQUMsT0FBTyxDQUNsQyxVQUFVLEVBQ1YsYUFBYSxFQUNiLFdBQVcsRUFDWCx5QkFBeUIsQ0FDMUIsQ0FBQztZQUVGLGlGQUFpRjtZQUNqRiw4RUFBOEU7WUFDOUUsaUZBQWlGO1lBQ2pGLFVBQVUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUV6QixXQUFXLEdBQUcsV0FBVyxJQUFJLE1BQU0sQ0FBQyxXQUFXLENBQUM7UUFDbEQsQ0FBQztJQUNILENBQUMsQ0FBQSxDQUFDO0FBQ0osQ0FBQztBQWhIRCxvRUFnSEM7QUFFRCxvRUFBb0U7QUFDcEUsU0FBZ0IsaUJBQWlCLENBQy9CLEtBQThCO0lBRTlCLE9BQU8sa0NBQWUsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDOUMsQ0FBQztBQUpELDhDQUlDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UnVsZSwgU2NoZW1hdGljQ29udGV4dCwgVHJlZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtOb2RlUGFja2FnZUluc3RhbGxUYXNrfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcy90YXNrcyc7XG5pbXBvcnQge1Byb2plY3REZWZpbml0aW9ufSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZS9zcmMvd29ya3NwYWNlJztcblxuaW1wb3J0IHtVcGRhdGVQcm9qZWN0fSBmcm9tICcuLi91cGRhdGUtdG9vbCc7XG5pbXBvcnQge1dvcmtzcGFjZVBhdGh9IGZyb20gJy4uL3VwZGF0ZS10b29sL2ZpbGUtc3lzdGVtJztcbmltcG9ydCB7TWlncmF0aW9uQ3Rvcn0gZnJvbSAnLi4vdXBkYXRlLXRvb2wvbWlncmF0aW9uJztcbmltcG9ydCB7VGFyZ2V0VmVyc2lvbn0gZnJvbSAnLi4vdXBkYXRlLXRvb2wvdGFyZ2V0LXZlcnNpb24nO1xuaW1wb3J0IHtnZXRUYXJnZXRUc2NvbmZpZ1BhdGgsIGdldFdvcmtzcGFjZUNvbmZpZ0dyYWNlZnVsbHl9IGZyb20gJy4uL3V0aWxzL3Byb2plY3QtdHNjb25maWctcGF0aHMnO1xuXG5pbXBvcnQge0RldmtpdEZpbGVTeXN0ZW19IGZyb20gJy4vZGV2a2l0LWZpbGUtc3lzdGVtJztcbmltcG9ydCB7RGV2a2l0Q29udGV4dCwgRGV2a2l0TWlncmF0aW9uLCBEZXZraXRNaWdyYXRpb25DdG9yfSBmcm9tICcuL2RldmtpdC1taWdyYXRpb24nO1xuaW1wb3J0IHtmaW5kU3R5bGVzaGVldEZpbGVzfSBmcm9tICcuL2ZpbmQtc3R5bGVzaGVldHMnO1xuaW1wb3J0IHtBdHRyaWJ1dGVTZWxlY3RvcnNNaWdyYXRpb259IGZyb20gJy4vbWlncmF0aW9ucy9hdHRyaWJ1dGUtc2VsZWN0b3JzJztcbmltcG9ydCB7Q2xhc3NJbmhlcml0YW5jZU1pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL2NsYXNzLWluaGVyaXRhbmNlJztcbmltcG9ydCB7Q2xhc3NOYW1lc01pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL2NsYXNzLW5hbWVzJztcbmltcG9ydCB7Q29uc3RydWN0b3JTaWduYXR1cmVNaWdyYXRpb259IGZyb20gJy4vbWlncmF0aW9ucy9jb25zdHJ1Y3Rvci1zaWduYXR1cmUnO1xuaW1wb3J0IHtDc3NTZWxlY3RvcnNNaWdyYXRpb259IGZyb20gJy4vbWlncmF0aW9ucy9jc3Mtc2VsZWN0b3JzJztcbmltcG9ydCB7RWxlbWVudFNlbGVjdG9yc01pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL2VsZW1lbnQtc2VsZWN0b3JzJztcbmltcG9ydCB7SW5wdXROYW1lc01pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL2lucHV0LW5hbWVzJztcbmltcG9ydCB7TWV0aG9kQ2FsbEFyZ3VtZW50c01pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL21ldGhvZC1jYWxsLWFyZ3VtZW50cyc7XG5pbXBvcnQge01pc2NUZW1wbGF0ZU1pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL21pc2MtdGVtcGxhdGUnO1xuaW1wb3J0IHtPdXRwdXROYW1lc01pZ3JhdGlvbn0gZnJvbSAnLi9taWdyYXRpb25zL291dHB1dC1uYW1lcyc7XG5pbXBvcnQge1Byb3BlcnR5TmFtZXNNaWdyYXRpb259IGZyb20gJy4vbWlncmF0aW9ucy9wcm9wZXJ0eS1uYW1lcyc7XG5pbXBvcnQge1VwZ3JhZGVEYXRhfSBmcm9tICcuL3VwZ3JhZGUtZGF0YSc7XG5pbXBvcnQge1N5bWJvbFJlbW92YWxNaWdyYXRpb259IGZyb20gJy4vbWlncmF0aW9ucy9zeW1ib2wtcmVtb3ZhbCc7XG5cbi8qKiBMaXN0IG9mIG1pZ3JhdGlvbnMgd2hpY2ggcnVuIGZvciB0aGUgQ0RLIHVwZGF0ZS4gKi9cbmV4cG9ydCBjb25zdCBjZGtNaWdyYXRpb25zOiBNaWdyYXRpb25DdG9yPFVwZ3JhZGVEYXRhPltdID0gW1xuICBBdHRyaWJ1dGVTZWxlY3RvcnNNaWdyYXRpb24sXG4gIENsYXNzSW5oZXJpdGFuY2VNaWdyYXRpb24sXG4gIENsYXNzTmFtZXNNaWdyYXRpb24sXG4gIENvbnN0cnVjdG9yU2lnbmF0dXJlTWlncmF0aW9uLFxuICBDc3NTZWxlY3RvcnNNaWdyYXRpb24sXG4gIEVsZW1lbnRTZWxlY3RvcnNNaWdyYXRpb24sXG4gIElucHV0TmFtZXNNaWdyYXRpb24sXG4gIE1ldGhvZENhbGxBcmd1bWVudHNNaWdyYXRpb24sXG4gIE1pc2NUZW1wbGF0ZU1pZ3JhdGlvbixcbiAgT3V0cHV0TmFtZXNNaWdyYXRpb24sXG4gIFByb3BlcnR5TmFtZXNNaWdyYXRpb24sXG4gIFN5bWJvbFJlbW92YWxNaWdyYXRpb24sXG5dO1xuXG5leHBvcnQgdHlwZSBOdWxsYWJsZURldmtpdE1pZ3JhdGlvbiA9IE1pZ3JhdGlvbkN0b3I8VXBncmFkZURhdGEgfCBudWxsLCBEZXZraXRDb250ZXh0PjtcblxudHlwZSBQb3N0TWlncmF0aW9uRm4gPSAoXG4gIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQsXG4gIHRhcmdldFZlcnNpb246IFRhcmdldFZlcnNpb24sXG4gIGhhc0ZhaWx1cmU6IGJvb2xlYW4sXG4pID0+IHZvaWQ7XG5cbi8qKlxuICogQ3JlYXRlcyBhIEFuZ3VsYXIgc2NoZW1hdGljIHJ1bGUgdGhhdCBydW5zIHRoZSB1cGdyYWRlIGZvciB0aGVcbiAqIHNwZWNpZmllZCB0YXJnZXQgdmVyc2lvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU1pZ3JhdGlvblNjaGVtYXRpY1J1bGUoXG4gIHRhcmdldFZlcnNpb246IFRhcmdldFZlcnNpb24sXG4gIGV4dHJhTWlncmF0aW9uczogTnVsbGFibGVEZXZraXRNaWdyYXRpb25bXSxcbiAgdXBncmFkZURhdGE6IFVwZ3JhZGVEYXRhLFxuICBvbk1pZ3JhdGlvbkNvbXBsZXRlRm4/OiBQb3N0TWlncmF0aW9uRm4sXG4pOiBSdWxlIHtcbiAgcmV0dXJuIGFzeW5jICh0cmVlOiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29uc3QgbG9nZ2VyID0gY29udGV4dC5sb2dnZXI7XG4gICAgY29uc3Qgd29ya3NwYWNlID0gYXdhaXQgZ2V0V29ya3NwYWNlQ29uZmlnR3JhY2VmdWxseSh0cmVlKTtcblxuICAgIGlmICh3b3Jrc3BhY2UgPT09IG51bGwpIHtcbiAgICAgIGxvZ2dlci5lcnJvcignQ291bGQgbm90IGZpbmQgd29ya3NwYWNlIGNvbmZpZ3VyYXRpb24gZmlsZS4nKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBLZWVwIHRyYWNrIG9mIGFsbCBwcm9qZWN0IHNvdXJjZSBmaWxlcyB3aGljaCBoYXZlIGJlZW4gY2hlY2tlZC9taWdyYXRlZC4gVGhpcyBpc1xuICAgIC8vIG5lY2Vzc2FyeSBiZWNhdXNlIG11bHRpcGxlIFR5cGVTY3JpcHQgcHJvamVjdHMgY2FuIGNvbnRhaW4gdGhlIHNhbWUgc291cmNlIGZpbGUgYW5kXG4gICAgLy8gd2UgZG9uJ3Qgd2FudCB0byBjaGVjayB0aGVzZSBhZ2FpbiwgYXMgdGhpcyB3b3VsZCByZXN1bHQgaW4gZHVwbGljYXRlZCBmYWlsdXJlIG1lc3NhZ2VzLlxuICAgIGNvbnN0IGFuYWx5emVkRmlsZXMgPSBuZXcgU2V0PFdvcmtzcGFjZVBhdGg+KCk7XG4gICAgY29uc3QgZmlsZVN5c3RlbSA9IG5ldyBEZXZraXRGaWxlU3lzdGVtKHRyZWUpO1xuICAgIGNvbnN0IHByb2plY3ROYW1lcyA9IHdvcmtzcGFjZS5wcm9qZWN0cy5rZXlzKCk7XG4gICAgY29uc3QgbWlncmF0aW9ucyA9IFsuLi5jZGtNaWdyYXRpb25zLCAuLi5leHRyYU1pZ3JhdGlvbnNdIGFzIE51bGxhYmxlRGV2a2l0TWlncmF0aW9uW107XG4gICAgbGV0IGhhc0ZhaWx1cmVzID0gZmFsc2U7XG5cbiAgICBmb3IgKGNvbnN0IHByb2plY3ROYW1lIG9mIHByb2plY3ROYW1lcykge1xuICAgICAgY29uc3QgcHJvamVjdCA9IHdvcmtzcGFjZS5wcm9qZWN0cy5nZXQocHJvamVjdE5hbWUpITtcbiAgICAgIGNvbnN0IGJ1aWxkVHNjb25maWdQYXRoID0gZ2V0VGFyZ2V0VHNjb25maWdQYXRoKHByb2plY3QsICdidWlsZCcpO1xuICAgICAgY29uc3QgdGVzdFRzY29uZmlnUGF0aCA9IGdldFRhcmdldFRzY29uZmlnUGF0aChwcm9qZWN0LCAndGVzdCcpO1xuXG4gICAgICBpZiAoIWJ1aWxkVHNjb25maWdQYXRoICYmICF0ZXN0VHNjb25maWdQYXRoKSB7XG4gICAgICAgIGxvZ2dlci53YXJuKGBDb3VsZCBub3QgZmluZCBUeXBlU2NyaXB0IHByb2plY3QgZm9yIHByb2plY3Q6ICR7cHJvamVjdE5hbWV9YCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBJbiBzb21lIGFwcGxpY2F0aW9ucywgZGV2ZWxvcGVycyB3aWxsIGhhdmUgZ2xvYmFsIHN0eWxlc2hlZXRzIHdoaWNoIGFyZSBub3RcbiAgICAgIC8vIHNwZWNpZmllZCBpbiBhbnkgQW5ndWxhciBjb21wb25lbnQuIFRoZXJlZm9yZSB3ZSBnbG9iIHVwIGFsbCBDU1MgYW5kIFNDU1MgZmlsZXNcbiAgICAgIC8vIGluIHRoZSBwcm9qZWN0IGFuZCBtaWdyYXRlIHRoZW0gaWYgbmVlZGVkLlxuICAgICAgLy8gVE9ETzogcmV3b3JrIHRoaXMgdG8gY29sbGVjdCBnbG9iYWwgc3R5bGVzaGVldHMgZnJvbSB0aGUgd29ya3NwYWNlIGNvbmZpZy4gQ09NUC0yODAuXG4gICAgICBjb25zdCBhZGRpdGlvbmFsU3R5bGVzaGVldFBhdGhzID0gZmluZFN0eWxlc2hlZXRGaWxlcyh0cmVlLCBwcm9qZWN0LnJvb3QpO1xuXG4gICAgICBpZiAoYnVpbGRUc2NvbmZpZ1BhdGggIT09IG51bGwpIHtcbiAgICAgICAgcnVuTWlncmF0aW9ucyhwcm9qZWN0LCBwcm9qZWN0TmFtZSwgYnVpbGRUc2NvbmZpZ1BhdGgsIGFkZGl0aW9uYWxTdHlsZXNoZWV0UGF0aHMsIGZhbHNlKTtcbiAgICAgIH1cbiAgICAgIGlmICh0ZXN0VHNjb25maWdQYXRoICE9PSBudWxsKSB7XG4gICAgICAgIHJ1bk1pZ3JhdGlvbnMocHJvamVjdCwgcHJvamVjdE5hbWUsIHRlc3RUc2NvbmZpZ1BhdGgsIGFkZGl0aW9uYWxTdHlsZXNoZWV0UGF0aHMsIHRydWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBydW5QYWNrYWdlTWFuYWdlciA9IGZhbHNlO1xuICAgIC8vIFJ1biB0aGUgZ2xvYmFsIHBvc3QgbWlncmF0aW9uIHN0YXRpYyBtZW1iZXJzIGZvciBhbGxcbiAgICAvLyByZWdpc3RlcmVkIGRldmtpdCBtaWdyYXRpb25zLlxuICAgIG1pZ3JhdGlvbnMuZm9yRWFjaChtID0+IHtcbiAgICAgIGNvbnN0IGFjdGlvblJlc3VsdCA9XG4gICAgICAgIGlzRGV2a2l0TWlncmF0aW9uKG0pICYmIG0uZ2xvYmFsUG9zdE1pZ3JhdGlvbiAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgPyBtLmdsb2JhbFBvc3RNaWdyYXRpb24odHJlZSwgdGFyZ2V0VmVyc2lvbiwgY29udGV4dClcbiAgICAgICAgICA6IG51bGw7XG4gICAgICBpZiAoYWN0aW9uUmVzdWx0KSB7XG4gICAgICAgIHJ1blBhY2thZ2VNYW5hZ2VyID0gcnVuUGFja2FnZU1hbmFnZXIgfHwgYWN0aW9uUmVzdWx0LnJ1blBhY2thZ2VNYW5hZ2VyO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gSWYgYSBtaWdyYXRpb24gcmVxdWVzdGVkIHRoZSBwYWNrYWdlIG1hbmFnZXIgdG8gcnVuLCB3ZSBydW4gaXQgYXMgYW5cbiAgICAvLyBhc3luY2hyb25vdXMgcG9zdCBtaWdyYXRpb24gdGFzay4gV2UgY2Fubm90IHJ1biBpdCBzeW5jaHJvbm91c2x5LFxuICAgIC8vIGFzIGZpbGUgY2hhbmdlcyBmcm9tIHRoZSBjdXJyZW50IG1pZ3JhdGlvbiB0YXNrIGFyZSBub3QgYXBwbGllZCB0b1xuICAgIC8vIHRoZSBmaWxlIHN5c3RlbSB5ZXQuXG4gICAgaWYgKHJ1blBhY2thZ2VNYW5hZ2VyKSB7XG4gICAgICBjb250ZXh0LmFkZFRhc2sobmV3IE5vZGVQYWNrYWdlSW5zdGFsbFRhc2soe3F1aWV0OiBmYWxzZX0pKTtcbiAgICB9XG5cbiAgICBpZiAob25NaWdyYXRpb25Db21wbGV0ZUZuKSB7XG4gICAgICBvbk1pZ3JhdGlvbkNvbXBsZXRlRm4oY29udGV4dCwgdGFyZ2V0VmVyc2lvbiwgaGFzRmFpbHVyZXMpO1xuICAgIH1cblxuICAgIC8qKiBSdW5zIHRoZSBtaWdyYXRpb25zIGZvciB0aGUgc3BlY2lmaWVkIHdvcmtzcGFjZSBwcm9qZWN0LiAqL1xuICAgIGZ1bmN0aW9uIHJ1bk1pZ3JhdGlvbnMoXG4gICAgICBwcm9qZWN0OiBQcm9qZWN0RGVmaW5pdGlvbixcbiAgICAgIHByb2plY3ROYW1lOiBzdHJpbmcsXG4gICAgICB0c2NvbmZpZ1BhdGg6IFdvcmtzcGFjZVBhdGgsXG4gICAgICBhZGRpdGlvbmFsU3R5bGVzaGVldFBhdGhzOiBzdHJpbmdbXSxcbiAgICAgIGlzVGVzdFRhcmdldDogYm9vbGVhbixcbiAgICApIHtcbiAgICAgIGNvbnN0IHByb2dyYW0gPSBVcGRhdGVQcm9qZWN0LmNyZWF0ZVByb2dyYW1Gcm9tVHNjb25maWcodHNjb25maWdQYXRoLCBmaWxlU3lzdGVtKTtcbiAgICAgIGNvbnN0IHVwZGF0ZUNvbnRleHQ6IERldmtpdENvbnRleHQgPSB7XG4gICAgICAgIGlzVGVzdFRhcmdldCxcbiAgICAgICAgcHJvamVjdE5hbWUsXG4gICAgICAgIHByb2plY3QsXG4gICAgICAgIHRyZWUsXG4gICAgICB9O1xuXG4gICAgICBjb25zdCB1cGRhdGVQcm9qZWN0ID0gbmV3IFVwZGF0ZVByb2plY3QoXG4gICAgICAgIHVwZGF0ZUNvbnRleHQsXG4gICAgICAgIHByb2dyYW0sXG4gICAgICAgIGZpbGVTeXN0ZW0sXG4gICAgICAgIGFuYWx5emVkRmlsZXMsXG4gICAgICAgIGNvbnRleHQubG9nZ2VyLFxuICAgICAgKTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gdXBkYXRlUHJvamVjdC5taWdyYXRlKFxuICAgICAgICBtaWdyYXRpb25zLFxuICAgICAgICB0YXJnZXRWZXJzaW9uLFxuICAgICAgICB1cGdyYWRlRGF0YSxcbiAgICAgICAgYWRkaXRpb25hbFN0eWxlc2hlZXRQYXRocyxcbiAgICAgICk7XG5cbiAgICAgIC8vIENvbW1pdCBhbGwgcmVjb3JkZWQgZWRpdHMgaW4gdGhlIHVwZGF0ZSByZWNvcmRlci4gV2UgYXBwbHkgdGhlIGVkaXRzIGFmdGVyIGFsbFxuICAgICAgLy8gbWlncmF0aW9ucyByYW4gYmVjYXVzZSBvdGhlcndpc2Ugb2Zmc2V0cyBpbiB0aGUgVHlwZVNjcmlwdCBwcm9ncmFtIHdvdWxkIGJlXG4gICAgICAvLyBzaGlmdGVkIGFuZCBpbmRpdmlkdWFsIG1pZ3JhdGlvbnMgY291bGQgbm8gbG9uZ2VyIHVwZGF0ZSB0aGUgc2FtZSBzb3VyY2UgZmlsZS5cbiAgICAgIGZpbGVTeXN0ZW0uY29tbWl0RWRpdHMoKTtcblxuICAgICAgaGFzRmFpbHVyZXMgPSBoYXNGYWlsdXJlcyB8fCByZXN1bHQuaGFzRmFpbHVyZXM7XG4gICAgfVxuICB9O1xufVxuXG4vKiogV2hldGhlciB0aGUgZ2l2ZW4gbWlncmF0aW9uIHR5cGUgcmVmZXJzIHRvIGEgZGV2a2l0IG1pZ3JhdGlvbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRGV2a2l0TWlncmF0aW9uKFxuICB2YWx1ZTogTWlncmF0aW9uQ3RvcjxhbnksIGFueT4sXG4pOiB2YWx1ZSBpcyBEZXZraXRNaWdyYXRpb25DdG9yPGFueT4ge1xuICByZXR1cm4gRGV2a2l0TWlncmF0aW9uLmlzUHJvdG90eXBlT2YodmFsdWUpO1xufVxuIl19