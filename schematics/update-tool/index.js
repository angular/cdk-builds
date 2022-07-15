"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProject = void 0;
const ts = require("typescript");
const component_resource_collector_1 = require("./component-resource-collector");
const logger_1 = require("./logger");
const parse_tsconfig_1 = require("./utils/parse-tsconfig");
const virtual_host_1 = require("./utils/virtual-host");
/**
 * An update project that can be run against individual migrations. An update project
 * accepts a TypeScript program and a context that is provided to all migrations. The
 * context is usually not used by migrations, but in some cases migrations rely on
 * specifics from the tool that performs the update (e.g. the Angular CLI). In those cases,
 * the context can provide the necessary specifics to the migrations in a type-safe way.
 */
class UpdateProject {
    constructor(
    /** Context provided to all migrations. */
    _context, 
    /** TypeScript program using workspace paths. */
    _program, 
    /** File system used for reading, writing and editing files. */
    _fileSystem, 
    /**
     * Set of analyzed files. Used for avoiding multiple migration runs if
     * files overlap between targets.
     */
    _analyzedFiles = new Set(), 
    /** Logger used for printing messages. */
    _logger = logger_1.defaultLogger) {
        this._context = _context;
        this._program = _program;
        this._fileSystem = _fileSystem;
        this._analyzedFiles = _analyzedFiles;
        this._logger = _logger;
        this._typeChecker = this._program.getTypeChecker();
    }
    /**
     * Migrates the project to the specified target version.
     * @param migrationTypes Migrations that should be run.
     * @param target Version the project should be updated to. Can be `null` if the set of
     *   specified migrations runs regardless of a target version.
     * @param data Upgrade data that is passed to all migration rules.
     * @param additionalStylesheetPaths Additional stylesheets that should be migrated, if not
     *   referenced in an Angular component. This is helpful for global stylesheets in a project.
     */
    migrate(migrationTypes, target, data, additionalStylesheetPaths) {
        // Create instances of the specified migrations.
        const migrations = this._createMigrations(migrationTypes, target, data);
        // Creates the component resource collector. The collector can visit arbitrary
        // TypeScript nodes and will find Angular component resources. Resources include
        // templates and stylesheets. It also captures inline stylesheets and templates.
        const resourceCollector = new component_resource_collector_1.ComponentResourceCollector(this._typeChecker, this._fileSystem);
        // Collect all of the TypeScript source files we want to migrate. We don't
        // migrate type definition files, or source files from external libraries.
        const sourceFiles = this._program
            .getSourceFiles()
            .filter(f => !f.isDeclarationFile && !this._program.isSourceFileFromExternalLibrary(f));
        // Helper function that visits a given TypeScript node and collects all referenced
        // component resources (i.e. stylesheets or templates). Additionally, the helper
        // visits the node in each instantiated migration.
        const visitNodeAndCollectResources = (node) => {
            migrations.forEach(r => r.visitNode(node));
            ts.forEachChild(node, visitNodeAndCollectResources);
            resourceCollector.visitNode(node);
        };
        // Walk through all source file, if it has not been visited before, and
        // visit found nodes while collecting potential resources.
        sourceFiles.forEach(sourceFile => {
            const resolvedPath = this._fileSystem.resolve(sourceFile.fileName);
            // Do not visit source files which have been checked as part of a
            // previously migrated TypeScript project.
            if (!this._analyzedFiles.has(resolvedPath)) {
                visitNodeAndCollectResources(sourceFile);
                this._analyzedFiles.add(resolvedPath);
            }
        });
        // Walk through all resolved templates and visit them in each instantiated
        // migration. Note that this can only happen after source files have been
        // visited because we find templates through the TypeScript source files.
        resourceCollector.resolvedTemplates.forEach(template => {
            // Do not visit the template if it has been checked before. Inline
            // templates cannot be referenced multiple times.
            if (template.inline || !this._analyzedFiles.has(template.filePath)) {
                migrations.forEach(m => m.visitTemplate(template));
                this._analyzedFiles.add(template.filePath);
            }
        });
        // Walk through all resolved stylesheets and visit them in each instantiated
        // migration. Note that this can only happen after source files have been
        // visited because we find stylesheets through the TypeScript source files.
        resourceCollector.resolvedStylesheets.forEach(stylesheet => {
            // Do not visit the stylesheet if it has been checked before. Inline
            // stylesheets cannot be referenced multiple times.
            if (stylesheet.inline || !this._analyzedFiles.has(stylesheet.filePath)) {
                migrations.forEach(r => r.visitStylesheet(stylesheet));
                this._analyzedFiles.add(stylesheet.filePath);
            }
        });
        // In some applications, developers will have global stylesheets which are not
        // specified in any Angular component. Therefore we allow for additional stylesheets
        // being specified. We visit them in each migration unless they have been already
        // discovered before as actual component resource.
        if (additionalStylesheetPaths) {
            additionalStylesheetPaths.forEach(filePath => {
                const resolvedPath = this._fileSystem.resolve(filePath);
                const stylesheet = resourceCollector.resolveExternalStylesheet(resolvedPath, null);
                // Do not visit stylesheets which have been referenced from a component.
                if (!this._analyzedFiles.has(resolvedPath) && stylesheet) {
                    migrations.forEach(r => r.visitStylesheet(stylesheet));
                    this._analyzedFiles.add(resolvedPath);
                }
            });
        }
        // Call the "postAnalysis" method for each migration.
        migrations.forEach(r => r.postAnalysis());
        // Collect all failures reported by individual migrations.
        const failures = migrations.reduce((res, m) => res.concat(m.failures), []);
        // In case there are failures, print these to the CLI logger as warnings.
        if (failures.length) {
            failures.forEach(({ filePath, message, position }) => {
                const lineAndCharacter = position ? `@${position.line + 1}:${position.character + 1}` : '';
                this._logger.warn(`${filePath}${lineAndCharacter} - ${message}`);
            });
        }
        return {
            hasFailures: !!failures.length,
        };
    }
    /**
     * Creates instances of the given migrations with the specified target
     * version and data.
     */
    _createMigrations(types, target, data) {
        const result = [];
        for (const ctor of types) {
            const instance = new ctor(this._program, this._typeChecker, target, this._context, data, this._fileSystem, this._logger);
            instance.init();
            if (instance.enabled) {
                result.push(instance);
            }
        }
        return result;
    }
    /**
     * Creates a program form the specified tsconfig and patches the host
     * to read files and directories through the given file system.
     *
     * @throws {TsconfigParseError} If the tsconfig could not be parsed.
     */
    static createProgramFromTsconfig(tsconfigPath, fs) {
        const parsed = (0, parse_tsconfig_1.parseTsconfigFile)(fs.resolve(tsconfigPath), fs);
        const host = (0, virtual_host_1.createFileSystemCompilerHost)(parsed.options, fs);
        return ts.createProgram(parsed.fileNames, parsed.options, host);
    }
}
exports.UpdateProject = UpdateProject;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXBkYXRlLXRvb2wvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsaUNBQWlDO0FBRWpDLGlGQUEwRTtBQUUxRSxxQ0FBcUQ7QUFHckQsMkRBQXlEO0FBQ3pELHVEQUFrRTtBQUVsRTs7Ozs7O0dBTUc7QUFDSCxNQUFhLGFBQWE7SUFHeEI7SUFDRSwwQ0FBMEM7SUFDbEMsUUFBaUI7SUFDekIsZ0RBQWdEO0lBQ3hDLFFBQW9CO0lBQzVCLCtEQUErRDtJQUN2RCxXQUF1QjtJQUMvQjs7O09BR0c7SUFDSyxpQkFBcUMsSUFBSSxHQUFHLEVBQUU7SUFDdEQseUNBQXlDO0lBQ2pDLFVBQXdCLHNCQUFhO1FBWHJDLGFBQVEsR0FBUixRQUFRLENBQVM7UUFFakIsYUFBUSxHQUFSLFFBQVEsQ0FBWTtRQUVwQixnQkFBVyxHQUFYLFdBQVcsQ0FBWTtRQUt2QixtQkFBYyxHQUFkLGNBQWMsQ0FBZ0M7UUFFOUMsWUFBTyxHQUFQLE9BQU8sQ0FBOEI7UUFmOUIsaUJBQVksR0FBbUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjLEVBQUUsQ0FBQztJQWdCNUUsQ0FBQztJQUVKOzs7Ozs7OztPQVFHO0lBQ0gsT0FBTyxDQUNMLGNBQThDLEVBQzlDLE1BQTRCLEVBQzVCLElBQVUsRUFDVix5QkFBb0M7UUFFcEMsZ0RBQWdEO1FBQ2hELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3hFLDhFQUE4RTtRQUM5RSxnRkFBZ0Y7UUFDaEYsZ0ZBQWdGO1FBQ2hGLE1BQU0saUJBQWlCLEdBQUcsSUFBSSx5REFBMEIsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUM5RiwwRUFBMEU7UUFDMUUsMEVBQTBFO1FBQzFFLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxRQUFRO2FBQzlCLGNBQWMsRUFBRTthQUNoQixNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsK0JBQStCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUUxRixrRkFBa0Y7UUFDbEYsZ0ZBQWdGO1FBQ2hGLGtEQUFrRDtRQUNsRCxNQUFNLDRCQUE0QixHQUFHLENBQUMsSUFBYSxFQUFFLEVBQUU7WUFDckQsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUMzQyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO1lBQ3BELGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQyxDQUFDLENBQUM7UUFFRix1RUFBdUU7UUFDdkUsMERBQTBEO1FBQzFELFdBQVcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDL0IsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ25FLGlFQUFpRTtZQUNqRSwwQ0FBMEM7WUFDMUMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxFQUFFO2dCQUMxQyw0QkFBNEIsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDekMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7YUFDdkM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILDBFQUEwRTtRQUMxRSx5RUFBeUU7UUFDekUseUVBQXlFO1FBQ3pFLGlCQUFpQixDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNyRCxrRUFBa0U7WUFDbEUsaURBQWlEO1lBQ2pELElBQUksUUFBUSxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDbEUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDbkQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQzVDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCw0RUFBNEU7UUFDNUUseUVBQXlFO1FBQ3pFLDJFQUEyRTtRQUMzRSxpQkFBaUIsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDekQsb0VBQW9FO1lBQ3BFLG1EQUFtRDtZQUNuRCxJQUFJLFVBQVUsQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQ3RFLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZELElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUM5QztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsOEVBQThFO1FBQzlFLG9GQUFvRjtRQUNwRixpRkFBaUY7UUFDakYsa0RBQWtEO1FBQ2xELElBQUkseUJBQXlCLEVBQUU7WUFDN0IseUJBQXlCLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUMzQyxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDeEQsTUFBTSxVQUFVLEdBQUcsaUJBQWlCLENBQUMseUJBQXlCLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNuRix3RUFBd0U7Z0JBQ3hFLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsSUFBSSxVQUFVLEVBQUU7b0JBQ3hELFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7b0JBQ3ZELElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO2lCQUN2QztZQUNILENBQUMsQ0FBQyxDQUFDO1NBQ0o7UUFFRCxxREFBcUQ7UUFDckQsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1FBRTFDLDBEQUEwRDtRQUMxRCxNQUFNLFFBQVEsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUNoQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUNsQyxFQUF3QixDQUN6QixDQUFDO1FBRUYseUVBQXlFO1FBQ3pFLElBQUksUUFBUSxDQUFDLE1BQU0sRUFBRTtZQUNuQixRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBQyxFQUFFLEVBQUU7Z0JBQ2pELE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDM0YsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxRQUFRLEdBQUcsZ0JBQWdCLE1BQU0sT0FBTyxFQUFFLENBQUMsQ0FBQztZQUNuRSxDQUFDLENBQUMsQ0FBQztTQUNKO1FBRUQsT0FBTztZQUNMLFdBQVcsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU07U0FDL0IsQ0FBQztJQUNKLENBQUM7SUFFRDs7O09BR0c7SUFDSyxpQkFBaUIsQ0FDdkIsS0FBcUMsRUFDckMsTUFBNEIsRUFDNUIsSUFBVTtRQUVWLE1BQU0sTUFBTSxHQUErQixFQUFFLENBQUM7UUFDOUMsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUU7WUFDeEIsTUFBTSxRQUFRLEdBQUcsSUFBSSxJQUFJLENBQ3ZCLElBQUksQ0FBQyxRQUFRLEVBQ2IsSUFBSSxDQUFDLFlBQVksRUFDakIsTUFBTSxFQUNOLElBQUksQ0FBQyxRQUFRLEVBQ2IsSUFBSSxFQUNKLElBQUksQ0FBQyxXQUFXLEVBQ2hCLElBQUksQ0FBQyxPQUFPLENBQ2IsQ0FBQztZQUNGLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNoQixJQUFJLFFBQVEsQ0FBQyxPQUFPLEVBQUU7Z0JBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDdkI7U0FDRjtRQUNELE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxZQUEyQixFQUFFLEVBQWM7UUFDMUUsTUFBTSxNQUFNLEdBQUcsSUFBQSxrQ0FBaUIsRUFBQyxFQUFFLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQy9ELE1BQU0sSUFBSSxHQUFHLElBQUEsMkNBQTRCLEVBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztRQUM5RCxPQUFPLEVBQUUsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2xFLENBQUM7Q0FDRjtBQXhLRCxzQ0F3S0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Q29tcG9uZW50UmVzb3VyY2VDb2xsZWN0b3J9IGZyb20gJy4vY29tcG9uZW50LXJlc291cmNlLWNvbGxlY3Rvcic7XG5pbXBvcnQge0ZpbGVTeXN0ZW0sIFdvcmtzcGFjZVBhdGh9IGZyb20gJy4vZmlsZS1zeXN0ZW0nO1xuaW1wb3J0IHtkZWZhdWx0TG9nZ2VyLCBVcGRhdGVMb2dnZXJ9IGZyb20gJy4vbG9nZ2VyJztcbmltcG9ydCB7TWlncmF0aW9uLCBNaWdyYXRpb25DdG9yLCBNaWdyYXRpb25GYWlsdXJlfSBmcm9tICcuL21pZ3JhdGlvbic7XG5pbXBvcnQge1RhcmdldFZlcnNpb259IGZyb20gJy4vdGFyZ2V0LXZlcnNpb24nO1xuaW1wb3J0IHtwYXJzZVRzY29uZmlnRmlsZX0gZnJvbSAnLi91dGlscy9wYXJzZS10c2NvbmZpZyc7XG5pbXBvcnQge2NyZWF0ZUZpbGVTeXN0ZW1Db21waWxlckhvc3R9IGZyb20gJy4vdXRpbHMvdmlydHVhbC1ob3N0JztcblxuLyoqXG4gKiBBbiB1cGRhdGUgcHJvamVjdCB0aGF0IGNhbiBiZSBydW4gYWdhaW5zdCBpbmRpdmlkdWFsIG1pZ3JhdGlvbnMuIEFuIHVwZGF0ZSBwcm9qZWN0XG4gKiBhY2NlcHRzIGEgVHlwZVNjcmlwdCBwcm9ncmFtIGFuZCBhIGNvbnRleHQgdGhhdCBpcyBwcm92aWRlZCB0byBhbGwgbWlncmF0aW9ucy4gVGhlXG4gKiBjb250ZXh0IGlzIHVzdWFsbHkgbm90IHVzZWQgYnkgbWlncmF0aW9ucywgYnV0IGluIHNvbWUgY2FzZXMgbWlncmF0aW9ucyByZWx5IG9uXG4gKiBzcGVjaWZpY3MgZnJvbSB0aGUgdG9vbCB0aGF0IHBlcmZvcm1zIHRoZSB1cGRhdGUgKGUuZy4gdGhlIEFuZ3VsYXIgQ0xJKS4gSW4gdGhvc2UgY2FzZXMsXG4gKiB0aGUgY29udGV4dCBjYW4gcHJvdmlkZSB0aGUgbmVjZXNzYXJ5IHNwZWNpZmljcyB0byB0aGUgbWlncmF0aW9ucyBpbiBhIHR5cGUtc2FmZSB3YXkuXG4gKi9cbmV4cG9ydCBjbGFzcyBVcGRhdGVQcm9qZWN0PENvbnRleHQ+IHtcbiAgcHJpdmF0ZSByZWFkb25seSBfdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyID0gdGhpcy5fcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIC8qKiBDb250ZXh0IHByb3ZpZGVkIHRvIGFsbCBtaWdyYXRpb25zLiAqL1xuICAgIHByaXZhdGUgX2NvbnRleHQ6IENvbnRleHQsXG4gICAgLyoqIFR5cGVTY3JpcHQgcHJvZ3JhbSB1c2luZyB3b3Jrc3BhY2UgcGF0aHMuICovXG4gICAgcHJpdmF0ZSBfcHJvZ3JhbTogdHMuUHJvZ3JhbSxcbiAgICAvKiogRmlsZSBzeXN0ZW0gdXNlZCBmb3IgcmVhZGluZywgd3JpdGluZyBhbmQgZWRpdGluZyBmaWxlcy4gKi9cbiAgICBwcml2YXRlIF9maWxlU3lzdGVtOiBGaWxlU3lzdGVtLFxuICAgIC8qKlxuICAgICAqIFNldCBvZiBhbmFseXplZCBmaWxlcy4gVXNlZCBmb3IgYXZvaWRpbmcgbXVsdGlwbGUgbWlncmF0aW9uIHJ1bnMgaWZcbiAgICAgKiBmaWxlcyBvdmVybGFwIGJldHdlZW4gdGFyZ2V0cy5cbiAgICAgKi9cbiAgICBwcml2YXRlIF9hbmFseXplZEZpbGVzOiBTZXQ8V29ya3NwYWNlUGF0aD4gPSBuZXcgU2V0KCksXG4gICAgLyoqIExvZ2dlciB1c2VkIGZvciBwcmludGluZyBtZXNzYWdlcy4gKi9cbiAgICBwcml2YXRlIF9sb2dnZXI6IFVwZGF0ZUxvZ2dlciA9IGRlZmF1bHRMb2dnZXIsXG4gICkge31cblxuICAvKipcbiAgICogTWlncmF0ZXMgdGhlIHByb2plY3QgdG8gdGhlIHNwZWNpZmllZCB0YXJnZXQgdmVyc2lvbi5cbiAgICogQHBhcmFtIG1pZ3JhdGlvblR5cGVzIE1pZ3JhdGlvbnMgdGhhdCBzaG91bGQgYmUgcnVuLlxuICAgKiBAcGFyYW0gdGFyZ2V0IFZlcnNpb24gdGhlIHByb2plY3Qgc2hvdWxkIGJlIHVwZGF0ZWQgdG8uIENhbiBiZSBgbnVsbGAgaWYgdGhlIHNldCBvZlxuICAgKiAgIHNwZWNpZmllZCBtaWdyYXRpb25zIHJ1bnMgcmVnYXJkbGVzcyBvZiBhIHRhcmdldCB2ZXJzaW9uLlxuICAgKiBAcGFyYW0gZGF0YSBVcGdyYWRlIGRhdGEgdGhhdCBpcyBwYXNzZWQgdG8gYWxsIG1pZ3JhdGlvbiBydWxlcy5cbiAgICogQHBhcmFtIGFkZGl0aW9uYWxTdHlsZXNoZWV0UGF0aHMgQWRkaXRpb25hbCBzdHlsZXNoZWV0cyB0aGF0IHNob3VsZCBiZSBtaWdyYXRlZCwgaWYgbm90XG4gICAqICAgcmVmZXJlbmNlZCBpbiBhbiBBbmd1bGFyIGNvbXBvbmVudC4gVGhpcyBpcyBoZWxwZnVsIGZvciBnbG9iYWwgc3R5bGVzaGVldHMgaW4gYSBwcm9qZWN0LlxuICAgKi9cbiAgbWlncmF0ZTxEYXRhPihcbiAgICBtaWdyYXRpb25UeXBlczogTWlncmF0aW9uQ3RvcjxEYXRhLCBDb250ZXh0PltdLFxuICAgIHRhcmdldDogVGFyZ2V0VmVyc2lvbiB8IG51bGwsXG4gICAgZGF0YTogRGF0YSxcbiAgICBhZGRpdGlvbmFsU3R5bGVzaGVldFBhdGhzPzogc3RyaW5nW10sXG4gICk6IHtoYXNGYWlsdXJlczogYm9vbGVhbn0ge1xuICAgIC8vIENyZWF0ZSBpbnN0YW5jZXMgb2YgdGhlIHNwZWNpZmllZCBtaWdyYXRpb25zLlxuICAgIGNvbnN0IG1pZ3JhdGlvbnMgPSB0aGlzLl9jcmVhdGVNaWdyYXRpb25zKG1pZ3JhdGlvblR5cGVzLCB0YXJnZXQsIGRhdGEpO1xuICAgIC8vIENyZWF0ZXMgdGhlIGNvbXBvbmVudCByZXNvdXJjZSBjb2xsZWN0b3IuIFRoZSBjb2xsZWN0b3IgY2FuIHZpc2l0IGFyYml0cmFyeVxuICAgIC8vIFR5cGVTY3JpcHQgbm9kZXMgYW5kIHdpbGwgZmluZCBBbmd1bGFyIGNvbXBvbmVudCByZXNvdXJjZXMuIFJlc291cmNlcyBpbmNsdWRlXG4gICAgLy8gdGVtcGxhdGVzIGFuZCBzdHlsZXNoZWV0cy4gSXQgYWxzbyBjYXB0dXJlcyBpbmxpbmUgc3R5bGVzaGVldHMgYW5kIHRlbXBsYXRlcy5cbiAgICBjb25zdCByZXNvdXJjZUNvbGxlY3RvciA9IG5ldyBDb21wb25lbnRSZXNvdXJjZUNvbGxlY3Rvcih0aGlzLl90eXBlQ2hlY2tlciwgdGhpcy5fZmlsZVN5c3RlbSk7XG4gICAgLy8gQ29sbGVjdCBhbGwgb2YgdGhlIFR5cGVTY3JpcHQgc291cmNlIGZpbGVzIHdlIHdhbnQgdG8gbWlncmF0ZS4gV2UgZG9uJ3RcbiAgICAvLyBtaWdyYXRlIHR5cGUgZGVmaW5pdGlvbiBmaWxlcywgb3Igc291cmNlIGZpbGVzIGZyb20gZXh0ZXJuYWwgbGlicmFyaWVzLlxuICAgIGNvbnN0IHNvdXJjZUZpbGVzID0gdGhpcy5fcHJvZ3JhbVxuICAgICAgLmdldFNvdXJjZUZpbGVzKClcbiAgICAgIC5maWx0ZXIoZiA9PiAhZi5pc0RlY2xhcmF0aW9uRmlsZSAmJiAhdGhpcy5fcHJvZ3JhbS5pc1NvdXJjZUZpbGVGcm9tRXh0ZXJuYWxMaWJyYXJ5KGYpKTtcblxuICAgIC8vIEhlbHBlciBmdW5jdGlvbiB0aGF0IHZpc2l0cyBhIGdpdmVuIFR5cGVTY3JpcHQgbm9kZSBhbmQgY29sbGVjdHMgYWxsIHJlZmVyZW5jZWRcbiAgICAvLyBjb21wb25lbnQgcmVzb3VyY2VzIChpLmUuIHN0eWxlc2hlZXRzIG9yIHRlbXBsYXRlcykuIEFkZGl0aW9uYWxseSwgdGhlIGhlbHBlclxuICAgIC8vIHZpc2l0cyB0aGUgbm9kZSBpbiBlYWNoIGluc3RhbnRpYXRlZCBtaWdyYXRpb24uXG4gICAgY29uc3QgdmlzaXROb2RlQW5kQ29sbGVjdFJlc291cmNlcyA9IChub2RlOiB0cy5Ob2RlKSA9PiB7XG4gICAgICBtaWdyYXRpb25zLmZvckVhY2gociA9PiByLnZpc2l0Tm9kZShub2RlKSk7XG4gICAgICB0cy5mb3JFYWNoQ2hpbGQobm9kZSwgdmlzaXROb2RlQW5kQ29sbGVjdFJlc291cmNlcyk7XG4gICAgICByZXNvdXJjZUNvbGxlY3Rvci52aXNpdE5vZGUobm9kZSk7XG4gICAgfTtcblxuICAgIC8vIFdhbGsgdGhyb3VnaCBhbGwgc291cmNlIGZpbGUsIGlmIGl0IGhhcyBub3QgYmVlbiB2aXNpdGVkIGJlZm9yZSwgYW5kXG4gICAgLy8gdmlzaXQgZm91bmQgbm9kZXMgd2hpbGUgY29sbGVjdGluZyBwb3RlbnRpYWwgcmVzb3VyY2VzLlxuICAgIHNvdXJjZUZpbGVzLmZvckVhY2goc291cmNlRmlsZSA9PiB7XG4gICAgICBjb25zdCByZXNvbHZlZFBhdGggPSB0aGlzLl9maWxlU3lzdGVtLnJlc29sdmUoc291cmNlRmlsZS5maWxlTmFtZSk7XG4gICAgICAvLyBEbyBub3QgdmlzaXQgc291cmNlIGZpbGVzIHdoaWNoIGhhdmUgYmVlbiBjaGVja2VkIGFzIHBhcnQgb2YgYVxuICAgICAgLy8gcHJldmlvdXNseSBtaWdyYXRlZCBUeXBlU2NyaXB0IHByb2plY3QuXG4gICAgICBpZiAoIXRoaXMuX2FuYWx5emVkRmlsZXMuaGFzKHJlc29sdmVkUGF0aCkpIHtcbiAgICAgICAgdmlzaXROb2RlQW5kQ29sbGVjdFJlc291cmNlcyhzb3VyY2VGaWxlKTtcbiAgICAgICAgdGhpcy5fYW5hbHl6ZWRGaWxlcy5hZGQocmVzb2x2ZWRQYXRoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFdhbGsgdGhyb3VnaCBhbGwgcmVzb2x2ZWQgdGVtcGxhdGVzIGFuZCB2aXNpdCB0aGVtIGluIGVhY2ggaW5zdGFudGlhdGVkXG4gICAgLy8gbWlncmF0aW9uLiBOb3RlIHRoYXQgdGhpcyBjYW4gb25seSBoYXBwZW4gYWZ0ZXIgc291cmNlIGZpbGVzIGhhdmUgYmVlblxuICAgIC8vIHZpc2l0ZWQgYmVjYXVzZSB3ZSBmaW5kIHRlbXBsYXRlcyB0aHJvdWdoIHRoZSBUeXBlU2NyaXB0IHNvdXJjZSBmaWxlcy5cbiAgICByZXNvdXJjZUNvbGxlY3Rvci5yZXNvbHZlZFRlbXBsYXRlcy5mb3JFYWNoKHRlbXBsYXRlID0+IHtcbiAgICAgIC8vIERvIG5vdCB2aXNpdCB0aGUgdGVtcGxhdGUgaWYgaXQgaGFzIGJlZW4gY2hlY2tlZCBiZWZvcmUuIElubGluZVxuICAgICAgLy8gdGVtcGxhdGVzIGNhbm5vdCBiZSByZWZlcmVuY2VkIG11bHRpcGxlIHRpbWVzLlxuICAgICAgaWYgKHRlbXBsYXRlLmlubGluZSB8fCAhdGhpcy5fYW5hbHl6ZWRGaWxlcy5oYXModGVtcGxhdGUuZmlsZVBhdGgpKSB7XG4gICAgICAgIG1pZ3JhdGlvbnMuZm9yRWFjaChtID0+IG0udmlzaXRUZW1wbGF0ZSh0ZW1wbGF0ZSkpO1xuICAgICAgICB0aGlzLl9hbmFseXplZEZpbGVzLmFkZCh0ZW1wbGF0ZS5maWxlUGF0aCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBXYWxrIHRocm91Z2ggYWxsIHJlc29sdmVkIHN0eWxlc2hlZXRzIGFuZCB2aXNpdCB0aGVtIGluIGVhY2ggaW5zdGFudGlhdGVkXG4gICAgLy8gbWlncmF0aW9uLiBOb3RlIHRoYXQgdGhpcyBjYW4gb25seSBoYXBwZW4gYWZ0ZXIgc291cmNlIGZpbGVzIGhhdmUgYmVlblxuICAgIC8vIHZpc2l0ZWQgYmVjYXVzZSB3ZSBmaW5kIHN0eWxlc2hlZXRzIHRocm91Z2ggdGhlIFR5cGVTY3JpcHQgc291cmNlIGZpbGVzLlxuICAgIHJlc291cmNlQ29sbGVjdG9yLnJlc29sdmVkU3R5bGVzaGVldHMuZm9yRWFjaChzdHlsZXNoZWV0ID0+IHtcbiAgICAgIC8vIERvIG5vdCB2aXNpdCB0aGUgc3R5bGVzaGVldCBpZiBpdCBoYXMgYmVlbiBjaGVja2VkIGJlZm9yZS4gSW5saW5lXG4gICAgICAvLyBzdHlsZXNoZWV0cyBjYW5ub3QgYmUgcmVmZXJlbmNlZCBtdWx0aXBsZSB0aW1lcy5cbiAgICAgIGlmIChzdHlsZXNoZWV0LmlubGluZSB8fCAhdGhpcy5fYW5hbHl6ZWRGaWxlcy5oYXMoc3R5bGVzaGVldC5maWxlUGF0aCkpIHtcbiAgICAgICAgbWlncmF0aW9ucy5mb3JFYWNoKHIgPT4gci52aXNpdFN0eWxlc2hlZXQoc3R5bGVzaGVldCkpO1xuICAgICAgICB0aGlzLl9hbmFseXplZEZpbGVzLmFkZChzdHlsZXNoZWV0LmZpbGVQYXRoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEluIHNvbWUgYXBwbGljYXRpb25zLCBkZXZlbG9wZXJzIHdpbGwgaGF2ZSBnbG9iYWwgc3R5bGVzaGVldHMgd2hpY2ggYXJlIG5vdFxuICAgIC8vIHNwZWNpZmllZCBpbiBhbnkgQW5ndWxhciBjb21wb25lbnQuIFRoZXJlZm9yZSB3ZSBhbGxvdyBmb3IgYWRkaXRpb25hbCBzdHlsZXNoZWV0c1xuICAgIC8vIGJlaW5nIHNwZWNpZmllZC4gV2UgdmlzaXQgdGhlbSBpbiBlYWNoIG1pZ3JhdGlvbiB1bmxlc3MgdGhleSBoYXZlIGJlZW4gYWxyZWFkeVxuICAgIC8vIGRpc2NvdmVyZWQgYmVmb3JlIGFzIGFjdHVhbCBjb21wb25lbnQgcmVzb3VyY2UuXG4gICAgaWYgKGFkZGl0aW9uYWxTdHlsZXNoZWV0UGF0aHMpIHtcbiAgICAgIGFkZGl0aW9uYWxTdHlsZXNoZWV0UGF0aHMuZm9yRWFjaChmaWxlUGF0aCA9PiB7XG4gICAgICAgIGNvbnN0IHJlc29sdmVkUGF0aCA9IHRoaXMuX2ZpbGVTeXN0ZW0ucmVzb2x2ZShmaWxlUGF0aCk7XG4gICAgICAgIGNvbnN0IHN0eWxlc2hlZXQgPSByZXNvdXJjZUNvbGxlY3Rvci5yZXNvbHZlRXh0ZXJuYWxTdHlsZXNoZWV0KHJlc29sdmVkUGF0aCwgbnVsbCk7XG4gICAgICAgIC8vIERvIG5vdCB2aXNpdCBzdHlsZXNoZWV0cyB3aGljaCBoYXZlIGJlZW4gcmVmZXJlbmNlZCBmcm9tIGEgY29tcG9uZW50LlxuICAgICAgICBpZiAoIXRoaXMuX2FuYWx5emVkRmlsZXMuaGFzKHJlc29sdmVkUGF0aCkgJiYgc3R5bGVzaGVldCkge1xuICAgICAgICAgIG1pZ3JhdGlvbnMuZm9yRWFjaChyID0+IHIudmlzaXRTdHlsZXNoZWV0KHN0eWxlc2hlZXQpKTtcbiAgICAgICAgICB0aGlzLl9hbmFseXplZEZpbGVzLmFkZChyZXNvbHZlZFBhdGgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBDYWxsIHRoZSBcInBvc3RBbmFseXNpc1wiIG1ldGhvZCBmb3IgZWFjaCBtaWdyYXRpb24uXG4gICAgbWlncmF0aW9ucy5mb3JFYWNoKHIgPT4gci5wb3N0QW5hbHlzaXMoKSk7XG5cbiAgICAvLyBDb2xsZWN0IGFsbCBmYWlsdXJlcyByZXBvcnRlZCBieSBpbmRpdmlkdWFsIG1pZ3JhdGlvbnMuXG4gICAgY29uc3QgZmFpbHVyZXMgPSBtaWdyYXRpb25zLnJlZHVjZShcbiAgICAgIChyZXMsIG0pID0+IHJlcy5jb25jYXQobS5mYWlsdXJlcyksXG4gICAgICBbXSBhcyBNaWdyYXRpb25GYWlsdXJlW10sXG4gICAgKTtcblxuICAgIC8vIEluIGNhc2UgdGhlcmUgYXJlIGZhaWx1cmVzLCBwcmludCB0aGVzZSB0byB0aGUgQ0xJIGxvZ2dlciBhcyB3YXJuaW5ncy5cbiAgICBpZiAoZmFpbHVyZXMubGVuZ3RoKSB7XG4gICAgICBmYWlsdXJlcy5mb3JFYWNoKCh7ZmlsZVBhdGgsIG1lc3NhZ2UsIHBvc2l0aW9ufSkgPT4ge1xuICAgICAgICBjb25zdCBsaW5lQW5kQ2hhcmFjdGVyID0gcG9zaXRpb24gPyBgQCR7cG9zaXRpb24ubGluZSArIDF9OiR7cG9zaXRpb24uY2hhcmFjdGVyICsgMX1gIDogJyc7XG4gICAgICAgIHRoaXMuX2xvZ2dlci53YXJuKGAke2ZpbGVQYXRofSR7bGluZUFuZENoYXJhY3Rlcn0gLSAke21lc3NhZ2V9YCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgaGFzRmFpbHVyZXM6ICEhZmFpbHVyZXMubGVuZ3RoLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBpbnN0YW5jZXMgb2YgdGhlIGdpdmVuIG1pZ3JhdGlvbnMgd2l0aCB0aGUgc3BlY2lmaWVkIHRhcmdldFxuICAgKiB2ZXJzaW9uIGFuZCBkYXRhLlxuICAgKi9cbiAgcHJpdmF0ZSBfY3JlYXRlTWlncmF0aW9uczxEYXRhPihcbiAgICB0eXBlczogTWlncmF0aW9uQ3RvcjxEYXRhLCBDb250ZXh0PltdLFxuICAgIHRhcmdldDogVGFyZ2V0VmVyc2lvbiB8IG51bGwsXG4gICAgZGF0YTogRGF0YSxcbiAgKTogTWlncmF0aW9uPERhdGEsIENvbnRleHQ+W10ge1xuICAgIGNvbnN0IHJlc3VsdDogTWlncmF0aW9uPERhdGEsIENvbnRleHQ+W10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGN0b3Igb2YgdHlwZXMpIHtcbiAgICAgIGNvbnN0IGluc3RhbmNlID0gbmV3IGN0b3IoXG4gICAgICAgIHRoaXMuX3Byb2dyYW0sXG4gICAgICAgIHRoaXMuX3R5cGVDaGVja2VyLFxuICAgICAgICB0YXJnZXQsXG4gICAgICAgIHRoaXMuX2NvbnRleHQsXG4gICAgICAgIGRhdGEsXG4gICAgICAgIHRoaXMuX2ZpbGVTeXN0ZW0sXG4gICAgICAgIHRoaXMuX2xvZ2dlcixcbiAgICAgICk7XG4gICAgICBpbnN0YW5jZS5pbml0KCk7XG4gICAgICBpZiAoaW5zdGFuY2UuZW5hYmxlZCkge1xuICAgICAgICByZXN1bHQucHVzaChpbnN0YW5jZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHByb2dyYW0gZm9ybSB0aGUgc3BlY2lmaWVkIHRzY29uZmlnIGFuZCBwYXRjaGVzIHRoZSBob3N0XG4gICAqIHRvIHJlYWQgZmlsZXMgYW5kIGRpcmVjdG9yaWVzIHRocm91Z2ggdGhlIGdpdmVuIGZpbGUgc3lzdGVtLlxuICAgKlxuICAgKiBAdGhyb3dzIHtUc2NvbmZpZ1BhcnNlRXJyb3J9IElmIHRoZSB0c2NvbmZpZyBjb3VsZCBub3QgYmUgcGFyc2VkLlxuICAgKi9cbiAgc3RhdGljIGNyZWF0ZVByb2dyYW1Gcm9tVHNjb25maWcodHNjb25maWdQYXRoOiBXb3Jrc3BhY2VQYXRoLCBmczogRmlsZVN5c3RlbSk6IHRzLlByb2dyYW0ge1xuICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlVHNjb25maWdGaWxlKGZzLnJlc29sdmUodHNjb25maWdQYXRoKSwgZnMpO1xuICAgIGNvbnN0IGhvc3QgPSBjcmVhdGVGaWxlU3lzdGVtQ29tcGlsZXJIb3N0KHBhcnNlZC5vcHRpb25zLCBmcyk7XG4gICAgcmV0dXJuIHRzLmNyZWF0ZVByb2dyYW0ocGFyc2VkLmZpbGVOYW1lcywgcGFyc2VkLm9wdGlvbnMsIGhvc3QpO1xuICB9XG59XG4iXX0=