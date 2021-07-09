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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2a2l0LW1pZ3JhdGlvbi1ydWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL25nLXVwZGF0ZS9kZXZraXQtbWlncmF0aW9uLXJ1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0FBR0gsNERBQXdFO0FBR3hFLGdEQUE2QztBQUk3Qyw0RUFBb0c7QUFFcEcsNkRBQXNEO0FBQ3RELHlEQUF1RjtBQUN2Rix5REFBdUQ7QUFDdkQsMEVBQTZFO0FBQzdFLHNFQUF5RTtBQUN6RSwwREFBNkQ7QUFDN0QsOEVBQWlGO0FBQ2pGLDhEQUFpRTtBQUNqRSxzRUFBeUU7QUFDekUsMERBQTZEO0FBQzdELDhFQUFnRjtBQUNoRiw4REFBaUU7QUFDakUsNERBQStEO0FBQy9ELGdFQUFtRTtBQUluRSx1REFBdUQ7QUFDMUMsUUFBQSxhQUFhLEdBQWlDO0lBQ3pELGlEQUEyQjtJQUMzQiw2Q0FBeUI7SUFDekIsaUNBQW1CO0lBQ25CLHFEQUE2QjtJQUM3QixxQ0FBcUI7SUFDckIsNkNBQXlCO0lBQ3pCLGlDQUFtQjtJQUNuQixvREFBNEI7SUFDNUIscUNBQXFCO0lBQ3JCLG1DQUFvQjtJQUNwQix1Q0FBc0I7Q0FDdkIsQ0FBQztBQU9GOzs7R0FHRztBQUNILFNBQWdCLDRCQUE0QixDQUN4QyxhQUE0QixFQUFFLGVBQTBDLEVBQ3hFLFdBQXdCLEVBQUUscUJBQXVDO0lBQ25FLE9BQU8sQ0FBTyxJQUFVLEVBQUUsT0FBeUIsRUFBRSxFQUFFO1FBQ3JELE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFDOUIsTUFBTSxTQUFTLEdBQUcsTUFBTSxxREFBNEIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUUzRCxJQUFJLFNBQVMsS0FBSyxJQUFJLEVBQUU7WUFDdEIsTUFBTSxDQUFDLEtBQUssQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFDO1lB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QU87Z0JBQ1AsSUFBSTthQUNMLENBQUM7WUFFRixNQUFNLGFBQWEsR0FBRyxJQUFJLDJCQUFhLENBQ3JDLGFBQWEsRUFDYixPQUFPLEVBQ1AsVUFBVSxFQUNWLGFBQWEsRUFDYixPQUFPLENBQUMsTUFBTSxDQUNmLENBQUM7WUFFRixNQUFNLE1BQU0sR0FDVixhQUFhLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFFLHlCQUF5QixDQUFDLENBQUM7WUFFM0YsaUZBQWlGO1lBQ2pGLDhFQUE4RTtZQUM5RSxpRkFBaUY7WUFDakYsVUFBVSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBRXpCLFdBQVcsR0FBRyxXQUFXLElBQUksTUFBTSxDQUFDLFdBQVcsQ0FBQztRQUNsRCxDQUFDO0lBQ0gsQ0FBQyxDQUFBLENBQUM7QUFDSixDQUFDO0FBbkdELG9FQW1HQztBQUVELG9FQUFvRTtBQUNwRSxTQUFnQixpQkFBaUIsQ0FBQyxLQUE4QjtJQUU5RCxPQUFPLGtDQUFlLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzlDLENBQUM7QUFIRCw4Q0FHQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1J1bGUsIFNjaGVtYXRpY0NvbnRleHQsIFRyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7Tm9kZVBhY2thZ2VJbnN0YWxsVGFza30gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MvdGFza3MnO1xuaW1wb3J0IHtQcm9qZWN0RGVmaW5pdGlvbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUvc3JjL3dvcmtzcGFjZSc7XG5cbmltcG9ydCB7VXBkYXRlUHJvamVjdH0gZnJvbSAnLi4vdXBkYXRlLXRvb2wnO1xuaW1wb3J0IHtXb3Jrc3BhY2VQYXRofSBmcm9tICcuLi91cGRhdGUtdG9vbC9maWxlLXN5c3RlbSc7XG5pbXBvcnQge01pZ3JhdGlvbkN0b3J9IGZyb20gJy4uL3VwZGF0ZS10b29sL21pZ3JhdGlvbic7XG5pbXBvcnQge1RhcmdldFZlcnNpb259IGZyb20gJy4uL3VwZGF0ZS10b29sL3RhcmdldC12ZXJzaW9uJztcbmltcG9ydCB7Z2V0VGFyZ2V0VHNjb25maWdQYXRoLCBnZXRXb3Jrc3BhY2VDb25maWdHcmFjZWZ1bGx5fSBmcm9tICcuLi91dGlscy9wcm9qZWN0LXRzY29uZmlnLXBhdGhzJztcblxuaW1wb3J0IHtEZXZraXRGaWxlU3lzdGVtfSBmcm9tICcuL2RldmtpdC1maWxlLXN5c3RlbSc7XG5pbXBvcnQge0RldmtpdENvbnRleHQsIERldmtpdE1pZ3JhdGlvbiwgRGV2a2l0TWlncmF0aW9uQ3Rvcn0gZnJvbSAnLi9kZXZraXQtbWlncmF0aW9uJztcbmltcG9ydCB7ZmluZFN0eWxlc2hlZXRGaWxlc30gZnJvbSAnLi9maW5kLXN0eWxlc2hlZXRzJztcbmltcG9ydCB7QXR0cmlidXRlU2VsZWN0b3JzTWlncmF0aW9ufSBmcm9tICcuL21pZ3JhdGlvbnMvYXR0cmlidXRlLXNlbGVjdG9ycyc7XG5pbXBvcnQge0NsYXNzSW5oZXJpdGFuY2VNaWdyYXRpb259IGZyb20gJy4vbWlncmF0aW9ucy9jbGFzcy1pbmhlcml0YW5jZSc7XG5pbXBvcnQge0NsYXNzTmFtZXNNaWdyYXRpb259IGZyb20gJy4vbWlncmF0aW9ucy9jbGFzcy1uYW1lcyc7XG5pbXBvcnQge0NvbnN0cnVjdG9yU2lnbmF0dXJlTWlncmF0aW9ufSBmcm9tICcuL21pZ3JhdGlvbnMvY29uc3RydWN0b3Itc2lnbmF0dXJlJztcbmltcG9ydCB7Q3NzU2VsZWN0b3JzTWlncmF0aW9ufSBmcm9tICcuL21pZ3JhdGlvbnMvY3NzLXNlbGVjdG9ycyc7XG5pbXBvcnQge0VsZW1lbnRTZWxlY3RvcnNNaWdyYXRpb259IGZyb20gJy4vbWlncmF0aW9ucy9lbGVtZW50LXNlbGVjdG9ycyc7XG5pbXBvcnQge0lucHV0TmFtZXNNaWdyYXRpb259IGZyb20gJy4vbWlncmF0aW9ucy9pbnB1dC1uYW1lcyc7XG5pbXBvcnQge01ldGhvZENhbGxBcmd1bWVudHNNaWdyYXRpb259IGZyb20gJy4vbWlncmF0aW9ucy9tZXRob2QtY2FsbC1hcmd1bWVudHMnO1xuaW1wb3J0IHtNaXNjVGVtcGxhdGVNaWdyYXRpb259IGZyb20gJy4vbWlncmF0aW9ucy9taXNjLXRlbXBsYXRlJztcbmltcG9ydCB7T3V0cHV0TmFtZXNNaWdyYXRpb259IGZyb20gJy4vbWlncmF0aW9ucy9vdXRwdXQtbmFtZXMnO1xuaW1wb3J0IHtQcm9wZXJ0eU5hbWVzTWlncmF0aW9ufSBmcm9tICcuL21pZ3JhdGlvbnMvcHJvcGVydHktbmFtZXMnO1xuaW1wb3J0IHtVcGdyYWRlRGF0YX0gZnJvbSAnLi91cGdyYWRlLWRhdGEnO1xuXG5cbi8qKiBMaXN0IG9mIG1pZ3JhdGlvbnMgd2hpY2ggcnVuIGZvciB0aGUgQ0RLIHVwZGF0ZS4gKi9cbmV4cG9ydCBjb25zdCBjZGtNaWdyYXRpb25zOiBNaWdyYXRpb25DdG9yPFVwZ3JhZGVEYXRhPltdID0gW1xuICBBdHRyaWJ1dGVTZWxlY3RvcnNNaWdyYXRpb24sXG4gIENsYXNzSW5oZXJpdGFuY2VNaWdyYXRpb24sXG4gIENsYXNzTmFtZXNNaWdyYXRpb24sXG4gIENvbnN0cnVjdG9yU2lnbmF0dXJlTWlncmF0aW9uLFxuICBDc3NTZWxlY3RvcnNNaWdyYXRpb24sXG4gIEVsZW1lbnRTZWxlY3RvcnNNaWdyYXRpb24sXG4gIElucHV0TmFtZXNNaWdyYXRpb24sXG4gIE1ldGhvZENhbGxBcmd1bWVudHNNaWdyYXRpb24sXG4gIE1pc2NUZW1wbGF0ZU1pZ3JhdGlvbixcbiAgT3V0cHV0TmFtZXNNaWdyYXRpb24sXG4gIFByb3BlcnR5TmFtZXNNaWdyYXRpb24sXG5dO1xuXG5leHBvcnQgdHlwZSBOdWxsYWJsZURldmtpdE1pZ3JhdGlvbiA9IE1pZ3JhdGlvbkN0b3I8VXBncmFkZURhdGF8bnVsbCwgRGV2a2l0Q29udGV4dD47XG5cbnR5cGUgUG9zdE1pZ3JhdGlvbkZuID1cbiAgICAoY29udGV4dDogU2NoZW1hdGljQ29udGV4dCwgdGFyZ2V0VmVyc2lvbjogVGFyZ2V0VmVyc2lvbiwgaGFzRmFpbHVyZTogYm9vbGVhbikgPT4gdm9pZDtcblxuLyoqXG4gKiBDcmVhdGVzIGEgQW5ndWxhciBzY2hlbWF0aWMgcnVsZSB0aGF0IHJ1bnMgdGhlIHVwZ3JhZGUgZm9yIHRoZVxuICogc3BlY2lmaWVkIHRhcmdldCB2ZXJzaW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTWlncmF0aW9uU2NoZW1hdGljUnVsZShcbiAgICB0YXJnZXRWZXJzaW9uOiBUYXJnZXRWZXJzaW9uLCBleHRyYU1pZ3JhdGlvbnM6IE51bGxhYmxlRGV2a2l0TWlncmF0aW9uW10sXG4gICAgdXBncmFkZURhdGE6IFVwZ3JhZGVEYXRhLCBvbk1pZ3JhdGlvbkNvbXBsZXRlRm4/OiBQb3N0TWlncmF0aW9uRm4pOiBSdWxlIHtcbiAgcmV0dXJuIGFzeW5jICh0cmVlOiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29uc3QgbG9nZ2VyID0gY29udGV4dC5sb2dnZXI7XG4gICAgY29uc3Qgd29ya3NwYWNlID0gYXdhaXQgZ2V0V29ya3NwYWNlQ29uZmlnR3JhY2VmdWxseSh0cmVlKTtcblxuICAgIGlmICh3b3Jrc3BhY2UgPT09IG51bGwpIHtcbiAgICAgIGxvZ2dlci5lcnJvcignQ291bGQgbm90IGZpbmQgd29ya3NwYWNlIGNvbmZpZ3VyYXRpb24gZmlsZS4nKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBLZWVwIHRyYWNrIG9mIGFsbCBwcm9qZWN0IHNvdXJjZSBmaWxlcyB3aGljaCBoYXZlIGJlZW4gY2hlY2tlZC9taWdyYXRlZC4gVGhpcyBpc1xuICAgIC8vIG5lY2Vzc2FyeSBiZWNhdXNlIG11bHRpcGxlIFR5cGVTY3JpcHQgcHJvamVjdHMgY2FuIGNvbnRhaW4gdGhlIHNhbWUgc291cmNlIGZpbGUgYW5kXG4gICAgLy8gd2UgZG9uJ3Qgd2FudCB0byBjaGVjayB0aGVzZSBhZ2FpbiwgYXMgdGhpcyB3b3VsZCByZXN1bHQgaW4gZHVwbGljYXRlZCBmYWlsdXJlIG1lc3NhZ2VzLlxuICAgIGNvbnN0IGFuYWx5emVkRmlsZXMgPSBuZXcgU2V0PFdvcmtzcGFjZVBhdGg+KCk7XG4gICAgY29uc3QgZmlsZVN5c3RlbSA9IG5ldyBEZXZraXRGaWxlU3lzdGVtKHRyZWUpO1xuICAgIGNvbnN0IHByb2plY3ROYW1lcyA9IHdvcmtzcGFjZS5wcm9qZWN0cy5rZXlzKCk7XG4gICAgY29uc3QgbWlncmF0aW9ucyA9IFsuLi5jZGtNaWdyYXRpb25zLCAuLi5leHRyYU1pZ3JhdGlvbnNdIGFzIE51bGxhYmxlRGV2a2l0TWlncmF0aW9uW107XG4gICAgbGV0IGhhc0ZhaWx1cmVzID0gZmFsc2U7XG5cbiAgICBmb3IgKGNvbnN0IHByb2plY3ROYW1lIG9mIHByb2plY3ROYW1lcykge1xuICAgICAgY29uc3QgcHJvamVjdCA9IHdvcmtzcGFjZS5wcm9qZWN0cy5nZXQocHJvamVjdE5hbWUpITtcbiAgICAgIGNvbnN0IGJ1aWxkVHNjb25maWdQYXRoID0gZ2V0VGFyZ2V0VHNjb25maWdQYXRoKHByb2plY3QsICdidWlsZCcpO1xuICAgICAgY29uc3QgdGVzdFRzY29uZmlnUGF0aCA9IGdldFRhcmdldFRzY29uZmlnUGF0aChwcm9qZWN0LCAndGVzdCcpO1xuXG4gICAgICBpZiAoIWJ1aWxkVHNjb25maWdQYXRoICYmICF0ZXN0VHNjb25maWdQYXRoKSB7XG4gICAgICAgIGxvZ2dlci53YXJuKGBDb3VsZCBub3QgZmluZCBUeXBlU2NyaXB0IHByb2plY3QgZm9yIHByb2plY3Q6ICR7cHJvamVjdE5hbWV9YCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBJbiBzb21lIGFwcGxpY2F0aW9ucywgZGV2ZWxvcGVycyB3aWxsIGhhdmUgZ2xvYmFsIHN0eWxlc2hlZXRzIHdoaWNoIGFyZSBub3RcbiAgICAgIC8vIHNwZWNpZmllZCBpbiBhbnkgQW5ndWxhciBjb21wb25lbnQuIFRoZXJlZm9yZSB3ZSBnbG9iIHVwIGFsbCBDU1MgYW5kIFNDU1MgZmlsZXNcbiAgICAgIC8vIGluIHRoZSBwcm9qZWN0IGFuZCBtaWdyYXRlIHRoZW0gaWYgbmVlZGVkLlxuICAgICAgLy8gVE9ETzogcmV3b3JrIHRoaXMgdG8gY29sbGVjdCBnbG9iYWwgc3R5bGVzaGVldHMgZnJvbSB0aGUgd29ya3NwYWNlIGNvbmZpZy4gQ09NUC0yODAuXG4gICAgICBjb25zdCBhZGRpdGlvbmFsU3R5bGVzaGVldFBhdGhzID0gZmluZFN0eWxlc2hlZXRGaWxlcyh0cmVlLCBwcm9qZWN0LnJvb3QpO1xuXG4gICAgICBpZiAoYnVpbGRUc2NvbmZpZ1BhdGggIT09IG51bGwpIHtcbiAgICAgICAgcnVuTWlncmF0aW9ucyhwcm9qZWN0LCBwcm9qZWN0TmFtZSwgYnVpbGRUc2NvbmZpZ1BhdGgsIGFkZGl0aW9uYWxTdHlsZXNoZWV0UGF0aHMsIGZhbHNlKTtcbiAgICAgIH1cbiAgICAgIGlmICh0ZXN0VHNjb25maWdQYXRoICE9PSBudWxsKSB7XG4gICAgICAgIHJ1bk1pZ3JhdGlvbnMocHJvamVjdCwgcHJvamVjdE5hbWUsIHRlc3RUc2NvbmZpZ1BhdGgsIGFkZGl0aW9uYWxTdHlsZXNoZWV0UGF0aHMsIHRydWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBydW5QYWNrYWdlTWFuYWdlciA9IGZhbHNlO1xuICAgIC8vIFJ1biB0aGUgZ2xvYmFsIHBvc3QgbWlncmF0aW9uIHN0YXRpYyBtZW1iZXJzIGZvciBhbGxcbiAgICAvLyByZWdpc3RlcmVkIGRldmtpdCBtaWdyYXRpb25zLlxuICAgIG1pZ3JhdGlvbnMuZm9yRWFjaChtID0+IHtcbiAgICAgIGNvbnN0IGFjdGlvblJlc3VsdCA9IGlzRGV2a2l0TWlncmF0aW9uKG0pICYmIG0uZ2xvYmFsUG9zdE1pZ3JhdGlvbiAhPT0gdW5kZWZpbmVkID9cbiAgICAgICAgICBtLmdsb2JhbFBvc3RNaWdyYXRpb24odHJlZSwgY29udGV4dCkgOiBudWxsO1xuICAgICAgaWYgKGFjdGlvblJlc3VsdCkge1xuICAgICAgICBydW5QYWNrYWdlTWFuYWdlciA9IHJ1blBhY2thZ2VNYW5hZ2VyIHx8IGFjdGlvblJlc3VsdC5ydW5QYWNrYWdlTWFuYWdlcjtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIElmIGEgbWlncmF0aW9uIHJlcXVlc3RlZCB0aGUgcGFja2FnZSBtYW5hZ2VyIHRvIHJ1biwgd2UgcnVuIGl0IGFzIGFuXG4gICAgLy8gYXN5bmNocm9ub3VzIHBvc3QgbWlncmF0aW9uIHRhc2suIFdlIGNhbm5vdCBydW4gaXQgc3luY2hyb25vdXNseSxcbiAgICAvLyBhcyBmaWxlIGNoYW5nZXMgZnJvbSB0aGUgY3VycmVudCBtaWdyYXRpb24gdGFzayBhcmUgbm90IGFwcGxpZWQgdG9cbiAgICAvLyB0aGUgZmlsZSBzeXN0ZW0geWV0LlxuICAgIGlmIChydW5QYWNrYWdlTWFuYWdlcikge1xuICAgICAgY29udGV4dC5hZGRUYXNrKG5ldyBOb2RlUGFja2FnZUluc3RhbGxUYXNrKHtxdWlldDogZmFsc2V9KSk7XG4gICAgfVxuXG4gICAgaWYgKG9uTWlncmF0aW9uQ29tcGxldGVGbikge1xuICAgICAgb25NaWdyYXRpb25Db21wbGV0ZUZuKGNvbnRleHQsIHRhcmdldFZlcnNpb24sIGhhc0ZhaWx1cmVzKTtcbiAgICB9XG5cbiAgICAvKiogUnVucyB0aGUgbWlncmF0aW9ucyBmb3IgdGhlIHNwZWNpZmllZCB3b3Jrc3BhY2UgcHJvamVjdC4gKi9cbiAgICBmdW5jdGlvbiBydW5NaWdyYXRpb25zKHByb2plY3Q6IFByb2plY3REZWZpbml0aW9uLCBwcm9qZWN0TmFtZTogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdHNjb25maWdQYXRoOiBXb3Jrc3BhY2VQYXRoLCBhZGRpdGlvbmFsU3R5bGVzaGVldFBhdGhzOiBzdHJpbmdbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzVGVzdFRhcmdldDogYm9vbGVhbikge1xuICAgICAgY29uc3QgcHJvZ3JhbSA9IFVwZGF0ZVByb2plY3QuY3JlYXRlUHJvZ3JhbUZyb21Uc2NvbmZpZyh0c2NvbmZpZ1BhdGgsIGZpbGVTeXN0ZW0pO1xuICAgICAgY29uc3QgdXBkYXRlQ29udGV4dDogRGV2a2l0Q29udGV4dCA9IHtcbiAgICAgICAgaXNUZXN0VGFyZ2V0LFxuICAgICAgICBwcm9qZWN0TmFtZSxcbiAgICAgICAgcHJvamVjdCxcbiAgICAgICAgdHJlZSxcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHVwZGF0ZVByb2plY3QgPSBuZXcgVXBkYXRlUHJvamVjdChcbiAgICAgICAgdXBkYXRlQ29udGV4dCxcbiAgICAgICAgcHJvZ3JhbSxcbiAgICAgICAgZmlsZVN5c3RlbSxcbiAgICAgICAgYW5hbHl6ZWRGaWxlcyxcbiAgICAgICAgY29udGV4dC5sb2dnZXIsXG4gICAgICApO1xuXG4gICAgICBjb25zdCByZXN1bHQgPVxuICAgICAgICB1cGRhdGVQcm9qZWN0Lm1pZ3JhdGUobWlncmF0aW9ucywgdGFyZ2V0VmVyc2lvbiwgdXBncmFkZURhdGEsIGFkZGl0aW9uYWxTdHlsZXNoZWV0UGF0aHMpO1xuXG4gICAgICAvLyBDb21taXQgYWxsIHJlY29yZGVkIGVkaXRzIGluIHRoZSB1cGRhdGUgcmVjb3JkZXIuIFdlIGFwcGx5IHRoZSBlZGl0cyBhZnRlciBhbGxcbiAgICAgIC8vIG1pZ3JhdGlvbnMgcmFuIGJlY2F1c2Ugb3RoZXJ3aXNlIG9mZnNldHMgaW4gdGhlIFR5cGVTY3JpcHQgcHJvZ3JhbSB3b3VsZCBiZVxuICAgICAgLy8gc2hpZnRlZCBhbmQgaW5kaXZpZHVhbCBtaWdyYXRpb25zIGNvdWxkIG5vIGxvbmdlciB1cGRhdGUgdGhlIHNhbWUgc291cmNlIGZpbGUuXG4gICAgICBmaWxlU3lzdGVtLmNvbW1pdEVkaXRzKCk7XG5cbiAgICAgIGhhc0ZhaWx1cmVzID0gaGFzRmFpbHVyZXMgfHwgcmVzdWx0Lmhhc0ZhaWx1cmVzO1xuICAgIH1cbiAgfTtcbn1cblxuLyoqIFdoZXRoZXIgdGhlIGdpdmVuIG1pZ3JhdGlvbiB0eXBlIHJlZmVycyB0byBhIGRldmtpdCBtaWdyYXRpb24gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0RldmtpdE1pZ3JhdGlvbih2YWx1ZTogTWlncmF0aW9uQ3RvcjxhbnksIGFueT4pXG4gICAgOiB2YWx1ZSBpcyBEZXZraXRNaWdyYXRpb25DdG9yPGFueT4ge1xuICByZXR1cm4gRGV2a2l0TWlncmF0aW9uLmlzUHJvdG90eXBlT2YodmFsdWUpO1xufVxuIl19