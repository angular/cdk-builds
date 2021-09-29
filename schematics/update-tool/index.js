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
    constructor(/** Context provided to all migrations. */ _context, 
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
     * @param target Version the project should be updated to.
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
        const sourceFiles = this._program.getSourceFiles().filter(f => !f.isDeclarationFile && !this._program.isSourceFileFromExternalLibrary(f));
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
     */
    static createProgramFromTsconfig(tsconfigPath, fs) {
        const parsed = (0, parse_tsconfig_1.parseTsconfigFile)(fs.resolve(tsconfigPath), fs);
        const host = (0, virtual_host_1.createFileSystemCompilerHost)(parsed.options, fs);
        return ts.createProgram(parsed.fileNames, parsed.options, host);
    }
}
exports.UpdateProject = UpdateProject;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXBkYXRlLXRvb2wvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsaUNBQWlDO0FBRWpDLGlGQUEwRTtBQUUxRSxxQ0FBcUQ7QUFHckQsMkRBQXlEO0FBQ3pELHVEQUFrRTtBQUVsRTs7Ozs7O0dBTUc7QUFDSCxNQUFhLGFBQWE7SUFHeEIsWUFBWSwwQ0FBMEMsQ0FDbEMsUUFBaUI7SUFDekIsZ0RBQWdEO0lBQ3hDLFFBQW9CO0lBQzVCLCtEQUErRDtJQUN2RCxXQUF1QjtJQUMvQjs7O09BR0c7SUFDSyxpQkFBcUMsSUFBSSxHQUFHLEVBQUU7SUFDdEQseUNBQXlDO0lBQ2pDLFVBQXdCLHNCQUFhO1FBWHJDLGFBQVEsR0FBUixRQUFRLENBQVM7UUFFakIsYUFBUSxHQUFSLFFBQVEsQ0FBWTtRQUVwQixnQkFBVyxHQUFYLFdBQVcsQ0FBWTtRQUt2QixtQkFBYyxHQUFkLGNBQWMsQ0FBZ0M7UUFFOUMsWUFBTyxHQUFQLE9BQU8sQ0FBOEI7UUFkeEMsaUJBQVksR0FBbUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjLEVBQUUsQ0FBQztJQWNuQixDQUFDO0lBRTdEOzs7Ozs7O09BT0c7SUFDSCxPQUFPLENBQU8sY0FBOEMsRUFBRSxNQUFxQixFQUFFLElBQVUsRUFDM0YseUJBQW9DO1FBQ3RDLGdEQUFnRDtRQUNoRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsY0FBYyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN4RSw4RUFBOEU7UUFDOUUsZ0ZBQWdGO1FBQ2hGLGdGQUFnRjtRQUNoRixNQUFNLGlCQUFpQixHQUFHLElBQUkseURBQTBCLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDOUYs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RCxPQUFPO1lBQ0wsV0FBVyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTTtTQUMvQixDQUFDO0lBQ0osQ0FBQztJQUVEOzs7T0FHRztJQUNLLGlCQUFpQixDQUFPLEtBQXFDLEVBQUUsTUFBcUIsRUFDNUQsSUFBVTtRQUN4QyxNQUFNLE1BQU0sR0FBK0IsRUFBRSxDQUFDO1FBQzlDLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFO1lBQ3hCLE1BQU0sUUFBUSxHQUFHLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFDL0UsSUFBSSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3hDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNoQixJQUFJLFFBQVEsQ0FBQyxPQUFPLEVBQUU7Z0JBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDdkI7U0FDRjtRQUNELE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxNQUFNLENBQUMseUJBQXlCLENBQUMsWUFBMkIsRUFBRSxFQUFjO1FBQzFFLE1BQU0sTUFBTSxHQUFHLElBQUEsa0NBQWlCLEVBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUMvRCxNQUFNLElBQUksR0FBRyxJQUFBLDJDQUE0QixFQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDOUQsT0FBTyxFQUFFLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNsRSxDQUFDO0NBQ0Y7QUFsSkQsc0NBa0pDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge0NvbXBvbmVudFJlc291cmNlQ29sbGVjdG9yfSBmcm9tICcuL2NvbXBvbmVudC1yZXNvdXJjZS1jb2xsZWN0b3InO1xuaW1wb3J0IHtGaWxlU3lzdGVtLCBXb3Jrc3BhY2VQYXRofSBmcm9tICcuL2ZpbGUtc3lzdGVtJztcbmltcG9ydCB7ZGVmYXVsdExvZ2dlciwgVXBkYXRlTG9nZ2VyfSBmcm9tICcuL2xvZ2dlcic7XG5pbXBvcnQge01pZ3JhdGlvbiwgTWlncmF0aW9uQ3RvciwgTWlncmF0aW9uRmFpbHVyZX0gZnJvbSAnLi9taWdyYXRpb24nO1xuaW1wb3J0IHtUYXJnZXRWZXJzaW9ufSBmcm9tICcuL3RhcmdldC12ZXJzaW9uJztcbmltcG9ydCB7cGFyc2VUc2NvbmZpZ0ZpbGV9IGZyb20gJy4vdXRpbHMvcGFyc2UtdHNjb25maWcnO1xuaW1wb3J0IHtjcmVhdGVGaWxlU3lzdGVtQ29tcGlsZXJIb3N0fSBmcm9tICcuL3V0aWxzL3ZpcnR1YWwtaG9zdCc7XG5cbi8qKlxuICogQW4gdXBkYXRlIHByb2plY3QgdGhhdCBjYW4gYmUgcnVuIGFnYWluc3QgaW5kaXZpZHVhbCBtaWdyYXRpb25zLiBBbiB1cGRhdGUgcHJvamVjdFxuICogYWNjZXB0cyBhIFR5cGVTY3JpcHQgcHJvZ3JhbSBhbmQgYSBjb250ZXh0IHRoYXQgaXMgcHJvdmlkZWQgdG8gYWxsIG1pZ3JhdGlvbnMuIFRoZVxuICogY29udGV4dCBpcyB1c3VhbGx5IG5vdCB1c2VkIGJ5IG1pZ3JhdGlvbnMsIGJ1dCBpbiBzb21lIGNhc2VzIG1pZ3JhdGlvbnMgcmVseSBvblxuICogc3BlY2lmaWNzIGZyb20gdGhlIHRvb2wgdGhhdCBwZXJmb3JtcyB0aGUgdXBkYXRlIChlLmcuIHRoZSBBbmd1bGFyIENMSSkuIEluIHRob3NlIGNhc2VzLFxuICogdGhlIGNvbnRleHQgY2FuIHByb3ZpZGUgdGhlIG5lY2Vzc2FyeSBzcGVjaWZpY3MgdG8gdGhlIG1pZ3JhdGlvbnMgaW4gYSB0eXBlLXNhZmUgd2F5LlxuICovXG5leHBvcnQgY2xhc3MgVXBkYXRlUHJvamVjdDxDb250ZXh0PiB7XG4gIHByaXZhdGUgcmVhZG9ubHkgX3R5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlciA9IHRoaXMuX3Byb2dyYW0uZ2V0VHlwZUNoZWNrZXIoKTtcblxuICBjb25zdHJ1Y3RvcigvKiogQ29udGV4dCBwcm92aWRlZCB0byBhbGwgbWlncmF0aW9ucy4gKi9cbiAgICAgICAgICAgICAgcHJpdmF0ZSBfY29udGV4dDogQ29udGV4dCxcbiAgICAgICAgICAgICAgLyoqIFR5cGVTY3JpcHQgcHJvZ3JhbSB1c2luZyB3b3Jrc3BhY2UgcGF0aHMuICovXG4gICAgICAgICAgICAgIHByaXZhdGUgX3Byb2dyYW06IHRzLlByb2dyYW0sXG4gICAgICAgICAgICAgIC8qKiBGaWxlIHN5c3RlbSB1c2VkIGZvciByZWFkaW5nLCB3cml0aW5nIGFuZCBlZGl0aW5nIGZpbGVzLiAqL1xuICAgICAgICAgICAgICBwcml2YXRlIF9maWxlU3lzdGVtOiBGaWxlU3lzdGVtLFxuICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICogU2V0IG9mIGFuYWx5emVkIGZpbGVzLiBVc2VkIGZvciBhdm9pZGluZyBtdWx0aXBsZSBtaWdyYXRpb24gcnVucyBpZlxuICAgICAgICAgICAgICAgKiBmaWxlcyBvdmVybGFwIGJldHdlZW4gdGFyZ2V0cy5cbiAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgIHByaXZhdGUgX2FuYWx5emVkRmlsZXM6IFNldDxXb3Jrc3BhY2VQYXRoPiA9IG5ldyBTZXQoKSxcbiAgICAgICAgICAgICAgLyoqIExvZ2dlciB1c2VkIGZvciBwcmludGluZyBtZXNzYWdlcy4gKi9cbiAgICAgICAgICAgICAgcHJpdmF0ZSBfbG9nZ2VyOiBVcGRhdGVMb2dnZXIgPSBkZWZhdWx0TG9nZ2VyKSB7fVxuXG4gIC8qKlxuICAgKiBNaWdyYXRlcyB0aGUgcHJvamVjdCB0byB0aGUgc3BlY2lmaWVkIHRhcmdldCB2ZXJzaW9uLlxuICAgKiBAcGFyYW0gbWlncmF0aW9uVHlwZXMgTWlncmF0aW9ucyB0aGF0IHNob3VsZCBiZSBydW4uXG4gICAqIEBwYXJhbSB0YXJnZXQgVmVyc2lvbiB0aGUgcHJvamVjdCBzaG91bGQgYmUgdXBkYXRlZCB0by5cbiAgICogQHBhcmFtIGRhdGEgVXBncmFkZSBkYXRhIHRoYXQgaXMgcGFzc2VkIHRvIGFsbCBtaWdyYXRpb24gcnVsZXMuXG4gICAqIEBwYXJhbSBhZGRpdGlvbmFsU3R5bGVzaGVldFBhdGhzIEFkZGl0aW9uYWwgc3R5bGVzaGVldHMgdGhhdCBzaG91bGQgYmUgbWlncmF0ZWQsIGlmIG5vdFxuICAgKiAgIHJlZmVyZW5jZWQgaW4gYW4gQW5ndWxhciBjb21wb25lbnQuIFRoaXMgaXMgaGVscGZ1bCBmb3IgZ2xvYmFsIHN0eWxlc2hlZXRzIGluIGEgcHJvamVjdC5cbiAgICovXG4gIG1pZ3JhdGU8RGF0YT4obWlncmF0aW9uVHlwZXM6IE1pZ3JhdGlvbkN0b3I8RGF0YSwgQ29udGV4dD5bXSwgdGFyZ2V0OiBUYXJnZXRWZXJzaW9uLCBkYXRhOiBEYXRhLFxuICAgICAgYWRkaXRpb25hbFN0eWxlc2hlZXRQYXRocz86IHN0cmluZ1tdKToge2hhc0ZhaWx1cmVzOiBib29sZWFufSB7XG4gICAgLy8gQ3JlYXRlIGluc3RhbmNlcyBvZiB0aGUgc3BlY2lmaWVkIG1pZ3JhdGlvbnMuXG4gICAgY29uc3QgbWlncmF0aW9ucyA9IHRoaXMuX2NyZWF0ZU1pZ3JhdGlvbnMobWlncmF0aW9uVHlwZXMsIHRhcmdldCwgZGF0YSk7XG4gICAgLy8gQ3JlYXRlcyB0aGUgY29tcG9uZW50IHJlc291cmNlIGNvbGxlY3Rvci4gVGhlIGNvbGxlY3RvciBjYW4gdmlzaXQgYXJiaXRyYXJ5XG4gICAgLy8gVHlwZVNjcmlwdCBub2RlcyBhbmQgd2lsbCBmaW5kIEFuZ3VsYXIgY29tcG9uZW50IHJlc291cmNlcy4gUmVzb3VyY2VzIGluY2x1ZGVcbiAgICAvLyB0ZW1wbGF0ZXMgYW5kIHN0eWxlc2hlZXRzLiBJdCBhbHNvIGNhcHR1cmVzIGlubGluZSBzdHlsZXNoZWV0cyBhbmQgdGVtcGxhdGVzLlxuICAgIGNvbnN0IHJlc291cmNlQ29sbGVjdG9yID0gbmV3IENvbXBvbmVudFJlc291cmNlQ29sbGVjdG9yKHRoaXMuX3R5cGVDaGVja2VyLCB0aGlzLl9maWxlU3lzdGVtKTtcbiAgICAvLyBDb2xsZWN0IGFsbCBvZiB0aGUgVHlwZVNjcmlwdCBzb3VyY2UgZmlsZXMgd2Ugd2FudCB0byBtaWdyYXRlLiBXZSBkb24ndFxuICAgIC8vIG1pZ3JhdGUgdHlwZSBkZWZpbml0aW9uIGZpbGVzLCBvciBzb3VyY2UgZmlsZXMgZnJvbSBleHRlcm5hbCBsaWJyYXJpZXMuXG4gICAgY29uc3Qgc291cmNlRmlsZXMgPSB0aGlzLl9wcm9ncmFtLmdldFNvdXJjZUZpbGVzKCkuZmlsdGVyKFxuICAgICAgZiA9PiAhZi5pc0RlY2xhcmF0aW9uRmlsZSAmJiAhdGhpcy5fcHJvZ3JhbS5pc1NvdXJjZUZpbGVGcm9tRXh0ZXJuYWxMaWJyYXJ5KGYpKTtcblxuICAgIC8vIEhlbHBlciBmdW5jdGlvbiB0aGF0IHZpc2l0cyBhIGdpdmVuIFR5cGVTY3JpcHQgbm9kZSBhbmQgY29sbGVjdHMgYWxsIHJlZmVyZW5jZWRcbiAgICAvLyBjb21wb25lbnQgcmVzb3VyY2VzIChpLmUuIHN0eWxlc2hlZXRzIG9yIHRlbXBsYXRlcykuIEFkZGl0aW9uYWxseSwgdGhlIGhlbHBlclxuICAgIC8vIHZpc2l0cyB0aGUgbm9kZSBpbiBlYWNoIGluc3RhbnRpYXRlZCBtaWdyYXRpb24uXG4gICAgY29uc3QgdmlzaXROb2RlQW5kQ29sbGVjdFJlc291cmNlcyA9IChub2RlOiB0cy5Ob2RlKSA9PiB7XG4gICAgICBtaWdyYXRpb25zLmZvckVhY2gociA9PiByLnZpc2l0Tm9kZShub2RlKSk7XG4gICAgICB0cy5mb3JFYWNoQ2hpbGQobm9kZSwgdmlzaXROb2RlQW5kQ29sbGVjdFJlc291cmNlcyk7XG4gICAgICByZXNvdXJjZUNvbGxlY3Rvci52aXNpdE5vZGUobm9kZSk7XG4gICAgfTtcblxuICAgIC8vIFdhbGsgdGhyb3VnaCBhbGwgc291cmNlIGZpbGUsIGlmIGl0IGhhcyBub3QgYmVlbiB2aXNpdGVkIGJlZm9yZSwgYW5kXG4gICAgLy8gdmlzaXQgZm91bmQgbm9kZXMgd2hpbGUgY29sbGVjdGluZyBwb3RlbnRpYWwgcmVzb3VyY2VzLlxuICAgIHNvdXJjZUZpbGVzLmZvckVhY2goc291cmNlRmlsZSA9PiB7XG4gICAgICBjb25zdCByZXNvbHZlZFBhdGggPSB0aGlzLl9maWxlU3lzdGVtLnJlc29sdmUoc291cmNlRmlsZS5maWxlTmFtZSk7XG4gICAgICAvLyBEbyBub3QgdmlzaXQgc291cmNlIGZpbGVzIHdoaWNoIGhhdmUgYmVlbiBjaGVja2VkIGFzIHBhcnQgb2YgYVxuICAgICAgLy8gcHJldmlvdXNseSBtaWdyYXRlZCBUeXBlU2NyaXB0IHByb2plY3QuXG4gICAgICBpZiAoIXRoaXMuX2FuYWx5emVkRmlsZXMuaGFzKHJlc29sdmVkUGF0aCkpIHtcbiAgICAgICAgdmlzaXROb2RlQW5kQ29sbGVjdFJlc291cmNlcyhzb3VyY2VGaWxlKTtcbiAgICAgICAgdGhpcy5fYW5hbHl6ZWRGaWxlcy5hZGQocmVzb2x2ZWRQYXRoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFdhbGsgdGhyb3VnaCBhbGwgcmVzb2x2ZWQgdGVtcGxhdGVzIGFuZCB2aXNpdCB0aGVtIGluIGVhY2ggaW5zdGFudGlhdGVkXG4gICAgLy8gbWlncmF0aW9uLiBOb3RlIHRoYXQgdGhpcyBjYW4gb25seSBoYXBwZW4gYWZ0ZXIgc291cmNlIGZpbGVzIGhhdmUgYmVlblxuICAgIC8vIHZpc2l0ZWQgYmVjYXVzZSB3ZSBmaW5kIHRlbXBsYXRlcyB0aHJvdWdoIHRoZSBUeXBlU2NyaXB0IHNvdXJjZSBmaWxlcy5cbiAgICByZXNvdXJjZUNvbGxlY3Rvci5yZXNvbHZlZFRlbXBsYXRlcy5mb3JFYWNoKHRlbXBsYXRlID0+IHtcbiAgICAgIC8vIERvIG5vdCB2aXNpdCB0aGUgdGVtcGxhdGUgaWYgaXQgaGFzIGJlZW4gY2hlY2tlZCBiZWZvcmUuIElubGluZVxuICAgICAgLy8gdGVtcGxhdGVzIGNhbm5vdCBiZSByZWZlcmVuY2VkIG11bHRpcGxlIHRpbWVzLlxuICAgICAgaWYgKHRlbXBsYXRlLmlubGluZSB8fCAhdGhpcy5fYW5hbHl6ZWRGaWxlcy5oYXModGVtcGxhdGUuZmlsZVBhdGgpKSB7XG4gICAgICAgIG1pZ3JhdGlvbnMuZm9yRWFjaChtID0+IG0udmlzaXRUZW1wbGF0ZSh0ZW1wbGF0ZSkpO1xuICAgICAgICB0aGlzLl9hbmFseXplZEZpbGVzLmFkZCh0ZW1wbGF0ZS5maWxlUGF0aCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBXYWxrIHRocm91Z2ggYWxsIHJlc29sdmVkIHN0eWxlc2hlZXRzIGFuZCB2aXNpdCB0aGVtIGluIGVhY2ggaW5zdGFudGlhdGVkXG4gICAgLy8gbWlncmF0aW9uLiBOb3RlIHRoYXQgdGhpcyBjYW4gb25seSBoYXBwZW4gYWZ0ZXIgc291cmNlIGZpbGVzIGhhdmUgYmVlblxuICAgIC8vIHZpc2l0ZWQgYmVjYXVzZSB3ZSBmaW5kIHN0eWxlc2hlZXRzIHRocm91Z2ggdGhlIFR5cGVTY3JpcHQgc291cmNlIGZpbGVzLlxuICAgIHJlc291cmNlQ29sbGVjdG9yLnJlc29sdmVkU3R5bGVzaGVldHMuZm9yRWFjaChzdHlsZXNoZWV0ID0+IHtcbiAgICAgIC8vIERvIG5vdCB2aXNpdCB0aGUgc3R5bGVzaGVldCBpZiBpdCBoYXMgYmVlbiBjaGVja2VkIGJlZm9yZS4gSW5saW5lXG4gICAgICAvLyBzdHlsZXNoZWV0cyBjYW5ub3QgYmUgcmVmZXJlbmNlZCBtdWx0aXBsZSB0aW1lcy5cbiAgICAgIGlmIChzdHlsZXNoZWV0LmlubGluZSB8fCAhdGhpcy5fYW5hbHl6ZWRGaWxlcy5oYXMoc3R5bGVzaGVldC5maWxlUGF0aCkpIHtcbiAgICAgICAgbWlncmF0aW9ucy5mb3JFYWNoKHIgPT4gci52aXNpdFN0eWxlc2hlZXQoc3R5bGVzaGVldCkpO1xuICAgICAgICB0aGlzLl9hbmFseXplZEZpbGVzLmFkZChzdHlsZXNoZWV0LmZpbGVQYXRoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEluIHNvbWUgYXBwbGljYXRpb25zLCBkZXZlbG9wZXJzIHdpbGwgaGF2ZSBnbG9iYWwgc3R5bGVzaGVldHMgd2hpY2ggYXJlIG5vdFxuICAgIC8vIHNwZWNpZmllZCBpbiBhbnkgQW5ndWxhciBjb21wb25lbnQuIFRoZXJlZm9yZSB3ZSBhbGxvdyBmb3IgYWRkaXRpb25hbCBzdHlsZXNoZWV0c1xuICAgIC8vIGJlaW5nIHNwZWNpZmllZC4gV2UgdmlzaXQgdGhlbSBpbiBlYWNoIG1pZ3JhdGlvbiB1bmxlc3MgdGhleSBoYXZlIGJlZW4gYWxyZWFkeVxuICAgIC8vIGRpc2NvdmVyZWQgYmVmb3JlIGFzIGFjdHVhbCBjb21wb25lbnQgcmVzb3VyY2UuXG4gICAgaWYgKGFkZGl0aW9uYWxTdHlsZXNoZWV0UGF0aHMpIHtcbiAgICAgIGFkZGl0aW9uYWxTdHlsZXNoZWV0UGF0aHMuZm9yRWFjaChmaWxlUGF0aCA9PiB7XG4gICAgICAgIGNvbnN0IHJlc29sdmVkUGF0aCA9IHRoaXMuX2ZpbGVTeXN0ZW0ucmVzb2x2ZShmaWxlUGF0aCk7XG4gICAgICAgIGNvbnN0IHN0eWxlc2hlZXQgPSByZXNvdXJjZUNvbGxlY3Rvci5yZXNvbHZlRXh0ZXJuYWxTdHlsZXNoZWV0KHJlc29sdmVkUGF0aCwgbnVsbCk7XG4gICAgICAgIC8vIERvIG5vdCB2aXNpdCBzdHlsZXNoZWV0cyB3aGljaCBoYXZlIGJlZW4gcmVmZXJlbmNlZCBmcm9tIGEgY29tcG9uZW50LlxuICAgICAgICBpZiAoIXRoaXMuX2FuYWx5emVkRmlsZXMuaGFzKHJlc29sdmVkUGF0aCkgJiYgc3R5bGVzaGVldCkge1xuICAgICAgICAgIG1pZ3JhdGlvbnMuZm9yRWFjaChyID0+IHIudmlzaXRTdHlsZXNoZWV0KHN0eWxlc2hlZXQpKTtcbiAgICAgICAgICB0aGlzLl9hbmFseXplZEZpbGVzLmFkZChyZXNvbHZlZFBhdGgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBDYWxsIHRoZSBcInBvc3RBbmFseXNpc1wiIG1ldGhvZCBmb3IgZWFjaCBtaWdyYXRpb24uXG4gICAgbWlncmF0aW9ucy5mb3JFYWNoKHIgPT4gci5wb3N0QW5hbHlzaXMoKSk7XG5cbiAgICAvLyBDb2xsZWN0IGFsbCBmYWlsdXJlcyByZXBvcnRlZCBieSBpbmRpdmlkdWFsIG1pZ3JhdGlvbnMuXG4gICAgY29uc3QgZmFpbHVyZXMgPSBtaWdyYXRpb25zLnJlZHVjZSgocmVzLCBtKSA9PlxuICAgICAgICByZXMuY29uY2F0KG0uZmFpbHVyZXMpLCBbXSBhcyBNaWdyYXRpb25GYWlsdXJlW10pO1xuXG4gICAgLy8gSW4gY2FzZSB0aGVyZSBhcmUgZmFpbHVyZXMsIHByaW50IHRoZXNlIHRvIHRoZSBDTEkgbG9nZ2VyIGFzIHdhcm5pbmdzLlxuICAgIGlmIChmYWlsdXJlcy5sZW5ndGgpIHtcbiAgICAgIGZhaWx1cmVzLmZvckVhY2goKHtmaWxlUGF0aCwgbWVzc2FnZSwgcG9zaXRpb259KSA9PiB7XG4gICAgICAgIGNvbnN0IGxpbmVBbmRDaGFyYWN0ZXIgPSBwb3NpdGlvbiA/IGBAJHtwb3NpdGlvbi5saW5lICsgMX06JHtwb3NpdGlvbi5jaGFyYWN0ZXIgKyAxfWAgOiAnJztcbiAgICAgICAgdGhpcy5fbG9nZ2VyLndhcm4oYCR7ZmlsZVBhdGh9JHtsaW5lQW5kQ2hhcmFjdGVyfSAtICR7bWVzc2FnZX1gKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBoYXNGYWlsdXJlczogISFmYWlsdXJlcy5sZW5ndGgsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGluc3RhbmNlcyBvZiB0aGUgZ2l2ZW4gbWlncmF0aW9ucyB3aXRoIHRoZSBzcGVjaWZpZWQgdGFyZ2V0XG4gICAqIHZlcnNpb24gYW5kIGRhdGEuXG4gICAqL1xuICBwcml2YXRlIF9jcmVhdGVNaWdyYXRpb25zPERhdGE+KHR5cGVzOiBNaWdyYXRpb25DdG9yPERhdGEsIENvbnRleHQ+W10sIHRhcmdldDogVGFyZ2V0VmVyc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiBEYXRhKTogTWlncmF0aW9uPERhdGEsIENvbnRleHQ+W10ge1xuICAgIGNvbnN0IHJlc3VsdDogTWlncmF0aW9uPERhdGEsIENvbnRleHQ+W10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGN0b3Igb2YgdHlwZXMpIHtcbiAgICAgIGNvbnN0IGluc3RhbmNlID0gbmV3IGN0b3IodGhpcy5fcHJvZ3JhbSwgdGhpcy5fdHlwZUNoZWNrZXIsIHRhcmdldCwgdGhpcy5fY29udGV4dCxcbiAgICAgICAgZGF0YSwgdGhpcy5fZmlsZVN5c3RlbSwgdGhpcy5fbG9nZ2VyKTtcbiAgICAgIGluc3RhbmNlLmluaXQoKTtcbiAgICAgIGlmIChpbnN0YW5jZS5lbmFibGVkKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGluc3RhbmNlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcHJvZ3JhbSBmb3JtIHRoZSBzcGVjaWZpZWQgdHNjb25maWcgYW5kIHBhdGNoZXMgdGhlIGhvc3RcbiAgICogdG8gcmVhZCBmaWxlcyBhbmQgZGlyZWN0b3JpZXMgdGhyb3VnaCB0aGUgZ2l2ZW4gZmlsZSBzeXN0ZW0uXG4gICAqL1xuICBzdGF0aWMgY3JlYXRlUHJvZ3JhbUZyb21Uc2NvbmZpZyh0c2NvbmZpZ1BhdGg6IFdvcmtzcGFjZVBhdGgsIGZzOiBGaWxlU3lzdGVtKTogdHMuUHJvZ3JhbSB7XG4gICAgY29uc3QgcGFyc2VkID0gcGFyc2VUc2NvbmZpZ0ZpbGUoZnMucmVzb2x2ZSh0c2NvbmZpZ1BhdGgpLCBmcyk7XG4gICAgY29uc3QgaG9zdCA9IGNyZWF0ZUZpbGVTeXN0ZW1Db21waWxlckhvc3QocGFyc2VkLm9wdGlvbnMsIGZzKTtcbiAgICByZXR1cm4gdHMuY3JlYXRlUHJvZ3JhbShwYXJzZWQuZmlsZU5hbWVzLCBwYXJzZWQub3B0aW9ucywgaG9zdCk7XG4gIH1cbn1cbiJdfQ==