"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
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
    _context;
    _program;
    _fileSystem;
    _analyzedFiles;
    _logger;
    _typeChecker;
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
     * @param limitToDirectory If specified, changes will be limited to the given directory.
     */
    migrate(migrationTypes, target, data, additionalStylesheetPaths, limitToDirectory) {
        limitToDirectory &&= this._fileSystem.resolve(limitToDirectory);
        // Create instances of the specified migrations.
        const migrations = this._createMigrations(migrationTypes, target, data);
        // Creates the component resource collector. The collector can visit arbitrary
        // TypeScript nodes and will find Angular component resources. Resources include
        // templates and stylesheets. It also captures inline stylesheets and templates.
        const resourceCollector = new component_resource_collector_1.ComponentResourceCollector(this._typeChecker, this._fileSystem);
        // Collect all of the TypeScript source files we want to migrate. We don't
        // migrate type definition files, or source files from external libraries.
        const sourceFiles = this._program.getSourceFiles().filter(f => {
            return (!f.isDeclarationFile &&
                (limitToDirectory == null ||
                    this._fileSystem.resolve(f.fileName).startsWith(limitToDirectory)) &&
                !this._program.isSourceFileFromExternalLibrary(f));
        });
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
                if (limitToDirectory == null || resolvedPath.startsWith(limitToDirectory)) {
                    const stylesheet = resourceCollector.resolveExternalStylesheet(resolvedPath, null);
                    // Do not visit stylesheets which have been referenced from a component.
                    if (!this._analyzedFiles.has(resolvedPath) && stylesheet) {
                        migrations.forEach(r => r.visitStylesheet(stylesheet));
                        this._analyzedFiles.add(resolvedPath);
                    }
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
     * Creates a program from the specified tsconfig and patches the host
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXBkYXRlLXRvb2wvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsaUNBQWlDO0FBRWpDLGlGQUEwRTtBQUUxRSxxQ0FBcUQ7QUFHckQsMkRBQXlEO0FBQ3pELHVEQUFrRTtBQUVsRTs7Ozs7O0dBTUc7QUFDSCxNQUFhLGFBQWE7SUFLZDtJQUVBO0lBRUE7SUFLQTtJQUVBO0lBZk8sWUFBWSxDQUFpQjtJQUU5QztJQUNFLDBDQUEwQztJQUNsQyxRQUFpQjtJQUN6QixnREFBZ0Q7SUFDeEMsUUFBb0I7SUFDNUIsK0RBQStEO0lBQ3ZELFdBQXVCO0lBQy9COzs7T0FHRztJQUNLLGlCQUFxQyxJQUFJLEdBQUcsRUFBRTtJQUN0RCx5Q0FBeUM7SUFDakMsVUFBd0Isc0JBQWE7UUFYckMsYUFBUSxHQUFSLFFBQVEsQ0FBUztRQUVqQixhQUFRLEdBQVIsUUFBUSxDQUFZO1FBRXBCLGdCQUFXLEdBQVgsV0FBVyxDQUFZO1FBS3ZCLG1CQUFjLEdBQWQsY0FBYyxDQUFnQztRQUU5QyxZQUFPLEdBQVAsT0FBTyxDQUE4QjtRQUU3QyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFFLENBQUM7SUFDckQsQ0FBQztJQUVEOzs7Ozs7Ozs7T0FTRztJQUNILE9BQU8sQ0FDTCxjQUE4QyxFQUM5QyxNQUE0QixFQUM1QixJQUFVLEVBQ1YseUJBQW9DLEVBQ3BDLGdCQUF5QjtRQUV6QixnQkFBZ0IsS0FBSyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBRWhFLGdEQUFnRDtRQUNoRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsY0FBYyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztR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Q3hCLENBQUM7UUFDSCxDQUFDO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsTUFBTSxDQUFDLHlCQUF5QixDQUFDLFlBQTJCLEVBQUUsRUFBYztRQUMxRSxNQUFNLE1BQU0sR0FBRyxJQUFBLGtDQUFpQixFQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDL0QsTUFBTSxJQUFJLEdBQUcsSUFBQSwyQ0FBNEIsRUFBQyxNQUFNLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzlELE9BQU8sRUFBRSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDbEUsQ0FBQztDQUNGO0FBckxELHNDQXFMQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmRldi9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Q29tcG9uZW50UmVzb3VyY2VDb2xsZWN0b3J9IGZyb20gJy4vY29tcG9uZW50LXJlc291cmNlLWNvbGxlY3Rvcic7XG5pbXBvcnQge0ZpbGVTeXN0ZW0sIFdvcmtzcGFjZVBhdGh9IGZyb20gJy4vZmlsZS1zeXN0ZW0nO1xuaW1wb3J0IHtkZWZhdWx0TG9nZ2VyLCBVcGRhdGVMb2dnZXJ9IGZyb20gJy4vbG9nZ2VyJztcbmltcG9ydCB7TWlncmF0aW9uLCBNaWdyYXRpb25DdG9yLCBNaWdyYXRpb25GYWlsdXJlfSBmcm9tICcuL21pZ3JhdGlvbic7XG5pbXBvcnQge1RhcmdldFZlcnNpb259IGZyb20gJy4vdGFyZ2V0LXZlcnNpb24nO1xuaW1wb3J0IHtwYXJzZVRzY29uZmlnRmlsZX0gZnJvbSAnLi91dGlscy9wYXJzZS10c2NvbmZpZyc7XG5pbXBvcnQge2NyZWF0ZUZpbGVTeXN0ZW1Db21waWxlckhvc3R9IGZyb20gJy4vdXRpbHMvdmlydHVhbC1ob3N0JztcblxuLyoqXG4gKiBBbiB1cGRhdGUgcHJvamVjdCB0aGF0IGNhbiBiZSBydW4gYWdhaW5zdCBpbmRpdmlkdWFsIG1pZ3JhdGlvbnMuIEFuIHVwZGF0ZSBwcm9qZWN0XG4gKiBhY2NlcHRzIGEgVHlwZVNjcmlwdCBwcm9ncmFtIGFuZCBhIGNvbnRleHQgdGhhdCBpcyBwcm92aWRlZCB0byBhbGwgbWlncmF0aW9ucy4gVGhlXG4gKiBjb250ZXh0IGlzIHVzdWFsbHkgbm90IHVzZWQgYnkgbWlncmF0aW9ucywgYnV0IGluIHNvbWUgY2FzZXMgbWlncmF0aW9ucyByZWx5IG9uXG4gKiBzcGVjaWZpY3MgZnJvbSB0aGUgdG9vbCB0aGF0IHBlcmZvcm1zIHRoZSB1cGRhdGUgKGUuZy4gdGhlIEFuZ3VsYXIgQ0xJKS4gSW4gdGhvc2UgY2FzZXMsXG4gKiB0aGUgY29udGV4dCBjYW4gcHJvdmlkZSB0aGUgbmVjZXNzYXJ5IHNwZWNpZmljcyB0byB0aGUgbWlncmF0aW9ucyBpbiBhIHR5cGUtc2FmZSB3YXkuXG4gKi9cbmV4cG9ydCBjbGFzcyBVcGRhdGVQcm9qZWN0PENvbnRleHQ+IHtcbiAgcHJpdmF0ZSByZWFkb25seSBfdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIC8qKiBDb250ZXh0IHByb3ZpZGVkIHRvIGFsbCBtaWdyYXRpb25zLiAqL1xuICAgIHByaXZhdGUgX2NvbnRleHQ6IENvbnRleHQsXG4gICAgLyoqIFR5cGVTY3JpcHQgcHJvZ3JhbSB1c2luZyB3b3Jrc3BhY2UgcGF0aHMuICovXG4gICAgcHJpdmF0ZSBfcHJvZ3JhbTogdHMuUHJvZ3JhbSxcbiAgICAvKiogRmlsZSBzeXN0ZW0gdXNlZCBmb3IgcmVhZGluZywgd3JpdGluZyBhbmQgZWRpdGluZyBmaWxlcy4gKi9cbiAgICBwcml2YXRlIF9maWxlU3lzdGVtOiBGaWxlU3lzdGVtLFxuICAgIC8qKlxuICAgICAqIFNldCBvZiBhbmFseXplZCBmaWxlcy4gVXNlZCBmb3IgYXZvaWRpbmcgbXVsdGlwbGUgbWlncmF0aW9uIHJ1bnMgaWZcbiAgICAgKiBmaWxlcyBvdmVybGFwIGJldHdlZW4gdGFyZ2V0cy5cbiAgICAgKi9cbiAgICBwcml2YXRlIF9hbmFseXplZEZpbGVzOiBTZXQ8V29ya3NwYWNlUGF0aD4gPSBuZXcgU2V0KCksXG4gICAgLyoqIExvZ2dlciB1c2VkIGZvciBwcmludGluZyBtZXNzYWdlcy4gKi9cbiAgICBwcml2YXRlIF9sb2dnZXI6IFVwZGF0ZUxvZ2dlciA9IGRlZmF1bHRMb2dnZXIsXG4gICkge1xuICAgIHRoaXMuX3R5cGVDaGVja2VyID0gdGhpcy5fcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIE1pZ3JhdGVzIHRoZSBwcm9qZWN0IHRvIHRoZSBzcGVjaWZpZWQgdGFyZ2V0IHZlcnNpb24uXG4gICAqIEBwYXJhbSBtaWdyYXRpb25UeXBlcyBNaWdyYXRpb25zIHRoYXQgc2hvdWxkIGJlIHJ1bi5cbiAgICogQHBhcmFtIHRhcmdldCBWZXJzaW9uIHRoZSBwcm9qZWN0IHNob3VsZCBiZSB1cGRhdGVkIHRvLiBDYW4gYmUgYG51bGxgIGlmIHRoZSBzZXQgb2ZcbiAgICogICBzcGVjaWZpZWQgbWlncmF0aW9ucyBydW5zIHJlZ2FyZGxlc3Mgb2YgYSB0YXJnZXQgdmVyc2lvbi5cbiAgICogQHBhcmFtIGRhdGEgVXBncmFkZSBkYXRhIHRoYXQgaXMgcGFzc2VkIHRvIGFsbCBtaWdyYXRpb24gcnVsZXMuXG4gICAqIEBwYXJhbSBhZGRpdGlvbmFsU3R5bGVzaGVldFBhdGhzIEFkZGl0aW9uYWwgc3R5bGVzaGVldHMgdGhhdCBzaG91bGQgYmUgbWlncmF0ZWQsIGlmIG5vdFxuICAgKiAgIHJlZmVyZW5jZWQgaW4gYW4gQW5ndWxhciBjb21wb25lbnQuIFRoaXMgaXMgaGVscGZ1bCBmb3IgZ2xvYmFsIHN0eWxlc2hlZXRzIGluIGEgcHJvamVjdC5cbiAgICogQHBhcmFtIGxpbWl0VG9EaXJlY3RvcnkgSWYgc3BlY2lmaWVkLCBjaGFuZ2VzIHdpbGwgYmUgbGltaXRlZCB0byB0aGUgZ2l2ZW4gZGlyZWN0b3J5LlxuICAgKi9cbiAgbWlncmF0ZTxEYXRhPihcbiAgICBtaWdyYXRpb25UeXBlczogTWlncmF0aW9uQ3RvcjxEYXRhLCBDb250ZXh0PltdLFxuICAgIHRhcmdldDogVGFyZ2V0VmVyc2lvbiB8IG51bGwsXG4gICAgZGF0YTogRGF0YSxcbiAgICBhZGRpdGlvbmFsU3R5bGVzaGVldFBhdGhzPzogc3RyaW5nW10sXG4gICAgbGltaXRUb0RpcmVjdG9yeT86IHN0cmluZyxcbiAgKToge2hhc0ZhaWx1cmVzOiBib29sZWFufSB7XG4gICAgbGltaXRUb0RpcmVjdG9yeSAmJj0gdGhpcy5fZmlsZVN5c3RlbS5yZXNvbHZlKGxpbWl0VG9EaXJlY3RvcnkpO1xuXG4gICAgLy8gQ3JlYXRlIGluc3RhbmNlcyBvZiB0aGUgc3BlY2lmaWVkIG1pZ3JhdGlvbnMuXG4gICAgY29uc3QgbWlncmF0aW9ucyA9IHRoaXMuX2NyZWF0ZU1pZ3JhdGlvbnMobWlncmF0aW9uVHlwZXMsIHRhcmdldCwgZGF0YSk7XG4gICAgLy8gQ3JlYXRlcyB0aGUgY29tcG9uZW50IHJlc291cmNlIGNvbGxlY3Rvci4gVGhlIGNvbGxlY3RvciBjYW4gdmlzaXQgYXJiaXRyYXJ5XG4gICAgLy8gVHlwZVNjcmlwdCBub2RlcyBhbmQgd2lsbCBmaW5kIEFuZ3VsYXIgY29tcG9uZW50IHJlc291cmNlcy4gUmVzb3VyY2VzIGluY2x1ZGVcbiAgICAvLyB0ZW1wbGF0ZXMgYW5kIHN0eWxlc2hlZXRzLiBJdCBhbHNvIGNhcHR1cmVzIGlubGluZSBzdHlsZXNoZWV0cyBhbmQgdGVtcGxhdGVzLlxuICAgIGNvbnN0IHJlc291cmNlQ29sbGVjdG9yID0gbmV3IENvbXBvbmVudFJlc291cmNlQ29sbGVjdG9yKHRoaXMuX3R5cGVDaGVja2VyLCB0aGlzLl9maWxlU3lzdGVtKTtcbiAgICAvLyBDb2xsZWN0IGFsbCBvZiB0aGUgVHlwZVNjcmlwdCBzb3VyY2UgZmlsZXMgd2Ugd2FudCB0byBtaWdyYXRlLiBXZSBkb24ndFxuICAgIC8vIG1pZ3JhdGUgdHlwZSBkZWZpbml0aW9uIGZpbGVzLCBvciBzb3VyY2UgZmlsZXMgZnJvbSBleHRlcm5hbCBsaWJyYXJpZXMuXG4gICAgY29uc3Qgc291cmNlRmlsZXMgPSB0aGlzLl9wcm9ncmFtLmdldFNvdXJjZUZpbGVzKCkuZmlsdGVyKGYgPT4ge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgIWYuaXNEZWNsYXJhdGlvbkZpbGUgJiZcbiAgICAgICAgKGxpbWl0VG9EaXJlY3RvcnkgPT0gbnVsbCB8fFxuICAgICAgICAgIHRoaXMuX2ZpbGVTeXN0ZW0ucmVzb2x2ZShmLmZpbGVOYW1lKS5zdGFydHNXaXRoKGxpbWl0VG9EaXJlY3RvcnkpKSAmJlxuICAgICAgICAhdGhpcy5fcHJvZ3JhbS5pc1NvdXJjZUZpbGVGcm9tRXh0ZXJuYWxMaWJyYXJ5KGYpXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgLy8gSGVscGVyIGZ1bmN0aW9uIHRoYXQgdmlzaXRzIGEgZ2l2ZW4gVHlwZVNjcmlwdCBub2RlIGFuZCBjb2xsZWN0cyBhbGwgcmVmZXJlbmNlZFxuICAgIC8vIGNvbXBvbmVudCByZXNvdXJjZXMgKGkuZS4gc3R5bGVzaGVldHMgb3IgdGVtcGxhdGVzKS4gQWRkaXRpb25hbGx5LCB0aGUgaGVscGVyXG4gICAgLy8gdmlzaXRzIHRoZSBub2RlIGluIGVhY2ggaW5zdGFudGlhdGVkIG1pZ3JhdGlvbi5cbiAgICBjb25zdCB2aXNpdE5vZGVBbmRDb2xsZWN0UmVzb3VyY2VzID0gKG5vZGU6IHRzLk5vZGUpID0+IHtcbiAgICAgIG1pZ3JhdGlvbnMuZm9yRWFjaChyID0+IHIudmlzaXROb2RlKG5vZGUpKTtcbiAgICAgIHRzLmZvckVhY2hDaGlsZChub2RlLCB2aXNpdE5vZGVBbmRDb2xsZWN0UmVzb3VyY2VzKTtcbiAgICAgIHJlc291cmNlQ29sbGVjdG9yLnZpc2l0Tm9kZShub2RlKTtcbiAgICB9O1xuXG4gICAgLy8gV2FsayB0aHJvdWdoIGFsbCBzb3VyY2UgZmlsZSwgaWYgaXQgaGFzIG5vdCBiZWVuIHZpc2l0ZWQgYmVmb3JlLCBhbmRcbiAgICAvLyB2aXNpdCBmb3VuZCBub2RlcyB3aGlsZSBjb2xsZWN0aW5nIHBvdGVudGlhbCByZXNvdXJjZXMuXG4gICAgc291cmNlRmlsZXMuZm9yRWFjaChzb3VyY2VGaWxlID0+IHtcbiAgICAgIGNvbnN0IHJlc29sdmVkUGF0aCA9IHRoaXMuX2ZpbGVTeXN0ZW0ucmVzb2x2ZShzb3VyY2VGaWxlLmZpbGVOYW1lKTtcbiAgICAgIC8vIERvIG5vdCB2aXNpdCBzb3VyY2UgZmlsZXMgd2hpY2ggaGF2ZSBiZWVuIGNoZWNrZWQgYXMgcGFydCBvZiBhXG4gICAgICAvLyBwcmV2aW91c2x5IG1pZ3JhdGVkIFR5cGVTY3JpcHQgcHJvamVjdC5cbiAgICAgIGlmICghdGhpcy5fYW5hbHl6ZWRGaWxlcy5oYXMocmVzb2x2ZWRQYXRoKSkge1xuICAgICAgICB2aXNpdE5vZGVBbmRDb2xsZWN0UmVzb3VyY2VzKHNvdXJjZUZpbGUpO1xuICAgICAgICB0aGlzLl9hbmFseXplZEZpbGVzLmFkZChyZXNvbHZlZFBhdGgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gV2FsayB0aHJvdWdoIGFsbCByZXNvbHZlZCB0ZW1wbGF0ZXMgYW5kIHZpc2l0IHRoZW0gaW4gZWFjaCBpbnN0YW50aWF0ZWRcbiAgICAvLyBtaWdyYXRpb24uIE5vdGUgdGhhdCB0aGlzIGNhbiBvbmx5IGhhcHBlbiBhZnRlciBzb3VyY2UgZmlsZXMgaGF2ZSBiZWVuXG4gICAgLy8gdmlzaXRlZCBiZWNhdXNlIHdlIGZpbmQgdGVtcGxhdGVzIHRocm91Z2ggdGhlIFR5cGVTY3JpcHQgc291cmNlIGZpbGVzLlxuICAgIHJlc291cmNlQ29sbGVjdG9yLnJlc29sdmVkVGVtcGxhdGVzLmZvckVhY2godGVtcGxhdGUgPT4ge1xuICAgICAgLy8gRG8gbm90IHZpc2l0IHRoZSB0ZW1wbGF0ZSBpZiBpdCBoYXMgYmVlbiBjaGVja2VkIGJlZm9yZS4gSW5saW5lXG4gICAgICAvLyB0ZW1wbGF0ZXMgY2Fubm90IGJlIHJlZmVyZW5jZWQgbXVsdGlwbGUgdGltZXMuXG4gICAgICBpZiAodGVtcGxhdGUuaW5saW5lIHx8ICF0aGlzLl9hbmFseXplZEZpbGVzLmhhcyh0ZW1wbGF0ZS5maWxlUGF0aCkpIHtcbiAgICAgICAgbWlncmF0aW9ucy5mb3JFYWNoKG0gPT4gbS52aXNpdFRlbXBsYXRlKHRlbXBsYXRlKSk7XG4gICAgICAgIHRoaXMuX2FuYWx5emVkRmlsZXMuYWRkKHRlbXBsYXRlLmZpbGVQYXRoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFdhbGsgdGhyb3VnaCBhbGwgcmVzb2x2ZWQgc3R5bGVzaGVldHMgYW5kIHZpc2l0IHRoZW0gaW4gZWFjaCBpbnN0YW50aWF0ZWRcbiAgICAvLyBtaWdyYXRpb24uIE5vdGUgdGhhdCB0aGlzIGNhbiBvbmx5IGhhcHBlbiBhZnRlciBzb3VyY2UgZmlsZXMgaGF2ZSBiZWVuXG4gICAgLy8gdmlzaXRlZCBiZWNhdXNlIHdlIGZpbmQgc3R5bGVzaGVldHMgdGhyb3VnaCB0aGUgVHlwZVNjcmlwdCBzb3VyY2UgZmlsZXMuXG4gICAgcmVzb3VyY2VDb2xsZWN0b3IucmVzb2x2ZWRTdHlsZXNoZWV0cy5mb3JFYWNoKHN0eWxlc2hlZXQgPT4ge1xuICAgICAgLy8gRG8gbm90IHZpc2l0IHRoZSBzdHlsZXNoZWV0IGlmIGl0IGhhcyBiZWVuIGNoZWNrZWQgYmVmb3JlLiBJbmxpbmVcbiAgICAgIC8vIHN0eWxlc2hlZXRzIGNhbm5vdCBiZSByZWZlcmVuY2VkIG11bHRpcGxlIHRpbWVzLlxuICAgICAgaWYgKHN0eWxlc2hlZXQuaW5saW5lIHx8ICF0aGlzLl9hbmFseXplZEZpbGVzLmhhcyhzdHlsZXNoZWV0LmZpbGVQYXRoKSkge1xuICAgICAgICBtaWdyYXRpb25zLmZvckVhY2gociA9PiByLnZpc2l0U3R5bGVzaGVldChzdHlsZXNoZWV0KSk7XG4gICAgICAgIHRoaXMuX2FuYWx5emVkRmlsZXMuYWRkKHN0eWxlc2hlZXQuZmlsZVBhdGgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gSW4gc29tZSBhcHBsaWNhdGlvbnMsIGRldmVsb3BlcnMgd2lsbCBoYXZlIGdsb2JhbCBzdHlsZXNoZWV0cyB3aGljaCBhcmUgbm90XG4gICAgLy8gc3BlY2lmaWVkIGluIGFueSBBbmd1bGFyIGNvbXBvbmVudC4gVGhlcmVmb3JlIHdlIGFsbG93IGZvciBhZGRpdGlvbmFsIHN0eWxlc2hlZXRzXG4gICAgLy8gYmVpbmcgc3BlY2lmaWVkLiBXZSB2aXNpdCB0aGVtIGluIGVhY2ggbWlncmF0aW9uIHVubGVzcyB0aGV5IGhhdmUgYmVlbiBhbHJlYWR5XG4gICAgLy8gZGlzY292ZXJlZCBiZWZvcmUgYXMgYWN0dWFsIGNvbXBvbmVudCByZXNvdXJjZS5cbiAgICBpZiAoYWRkaXRpb25hbFN0eWxlc2hlZXRQYXRocykge1xuICAgICAgYWRkaXRpb25hbFN0eWxlc2hlZXRQYXRocy5mb3JFYWNoKGZpbGVQYXRoID0+IHtcbiAgICAgICAgY29uc3QgcmVzb2x2ZWRQYXRoID0gdGhpcy5fZmlsZVN5c3RlbS5yZXNvbHZlKGZpbGVQYXRoKTtcbiAgICAgICAgaWYgKGxpbWl0VG9EaXJlY3RvcnkgPT0gbnVsbCB8fCByZXNvbHZlZFBhdGguc3RhcnRzV2l0aChsaW1pdFRvRGlyZWN0b3J5KSkge1xuICAgICAgICAgIGNvbnN0IHN0eWxlc2hlZXQgPSByZXNvdXJjZUNvbGxlY3Rvci5yZXNvbHZlRXh0ZXJuYWxTdHlsZXNoZWV0KHJlc29sdmVkUGF0aCwgbnVsbCk7XG4gICAgICAgICAgLy8gRG8gbm90IHZpc2l0IHN0eWxlc2hlZXRzIHdoaWNoIGhhdmUgYmVlbiByZWZlcmVuY2VkIGZyb20gYSBjb21wb25lbnQuXG4gICAgICAgICAgaWYgKCF0aGlzLl9hbmFseXplZEZpbGVzLmhhcyhyZXNvbHZlZFBhdGgpICYmIHN0eWxlc2hlZXQpIHtcbiAgICAgICAgICAgIG1pZ3JhdGlvbnMuZm9yRWFjaChyID0+IHIudmlzaXRTdHlsZXNoZWV0KHN0eWxlc2hlZXQpKTtcbiAgICAgICAgICAgIHRoaXMuX2FuYWx5emVkRmlsZXMuYWRkKHJlc29sdmVkUGF0aCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBDYWxsIHRoZSBcInBvc3RBbmFseXNpc1wiIG1ldGhvZCBmb3IgZWFjaCBtaWdyYXRpb24uXG4gICAgbWlncmF0aW9ucy5mb3JFYWNoKHIgPT4gci5wb3N0QW5hbHlzaXMoKSk7XG5cbiAgICAvLyBDb2xsZWN0IGFsbCBmYWlsdXJlcyByZXBvcnRlZCBieSBpbmRpdmlkdWFsIG1pZ3JhdGlvbnMuXG4gICAgY29uc3QgZmFpbHVyZXMgPSBtaWdyYXRpb25zLnJlZHVjZShcbiAgICAgIChyZXMsIG0pID0+IHJlcy5jb25jYXQobS5mYWlsdXJlcyksXG4gICAgICBbXSBhcyBNaWdyYXRpb25GYWlsdXJlW10sXG4gICAgKTtcblxuICAgIC8vIEluIGNhc2UgdGhlcmUgYXJlIGZhaWx1cmVzLCBwcmludCB0aGVzZSB0byB0aGUgQ0xJIGxvZ2dlciBhcyB3YXJuaW5ncy5cbiAgICBpZiAoZmFpbHVyZXMubGVuZ3RoKSB7XG4gICAgICBmYWlsdXJlcy5mb3JFYWNoKCh7ZmlsZVBhdGgsIG1lc3NhZ2UsIHBvc2l0aW9ufSkgPT4ge1xuICAgICAgICBjb25zdCBsaW5lQW5kQ2hhcmFjdGVyID0gcG9zaXRpb24gPyBgQCR7cG9zaXRpb24ubGluZSArIDF9OiR7cG9zaXRpb24uY2hhcmFjdGVyICsgMX1gIDogJyc7XG4gICAgICAgIHRoaXMuX2xvZ2dlci53YXJuKGAke2ZpbGVQYXRofSR7bGluZUFuZENoYXJhY3Rlcn0gLSAke21lc3NhZ2V9YCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgaGFzRmFpbHVyZXM6ICEhZmFpbHVyZXMubGVuZ3RoLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBpbnN0YW5jZXMgb2YgdGhlIGdpdmVuIG1pZ3JhdGlvbnMgd2l0aCB0aGUgc3BlY2lmaWVkIHRhcmdldFxuICAgKiB2ZXJzaW9uIGFuZCBkYXRhLlxuICAgKi9cbiAgcHJpdmF0ZSBfY3JlYXRlTWlncmF0aW9uczxEYXRhPihcbiAgICB0eXBlczogTWlncmF0aW9uQ3RvcjxEYXRhLCBDb250ZXh0PltdLFxuICAgIHRhcmdldDogVGFyZ2V0VmVyc2lvbiB8IG51bGwsXG4gICAgZGF0YTogRGF0YSxcbiAgKTogTWlncmF0aW9uPERhdGEsIENvbnRleHQ+W10ge1xuICAgIGNvbnN0IHJlc3VsdDogTWlncmF0aW9uPERhdGEsIENvbnRleHQ+W10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGN0b3Igb2YgdHlwZXMpIHtcbiAgICAgIGNvbnN0IGluc3RhbmNlID0gbmV3IGN0b3IoXG4gICAgICAgIHRoaXMuX3Byb2dyYW0sXG4gICAgICAgIHRoaXMuX3R5cGVDaGVja2VyLFxuICAgICAgICB0YXJnZXQsXG4gICAgICAgIHRoaXMuX2NvbnRleHQsXG4gICAgICAgIGRhdGEsXG4gICAgICAgIHRoaXMuX2ZpbGVTeXN0ZW0sXG4gICAgICAgIHRoaXMuX2xvZ2dlcixcbiAgICAgICk7XG4gICAgICBpbnN0YW5jZS5pbml0KCk7XG4gICAgICBpZiAoaW5zdGFuY2UuZW5hYmxlZCkge1xuICAgICAgICByZXN1bHQucHVzaChpbnN0YW5jZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHByb2dyYW0gZnJvbSB0aGUgc3BlY2lmaWVkIHRzY29uZmlnIGFuZCBwYXRjaGVzIHRoZSBob3N0XG4gICAqIHRvIHJlYWQgZmlsZXMgYW5kIGRpcmVjdG9yaWVzIHRocm91Z2ggdGhlIGdpdmVuIGZpbGUgc3lzdGVtLlxuICAgKlxuICAgKiBAdGhyb3dzIHtUc2NvbmZpZ1BhcnNlRXJyb3J9IElmIHRoZSB0c2NvbmZpZyBjb3VsZCBub3QgYmUgcGFyc2VkLlxuICAgKi9cbiAgc3RhdGljIGNyZWF0ZVByb2dyYW1Gcm9tVHNjb25maWcodHNjb25maWdQYXRoOiBXb3Jrc3BhY2VQYXRoLCBmczogRmlsZVN5c3RlbSk6IHRzLlByb2dyYW0ge1xuICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlVHNjb25maWdGaWxlKGZzLnJlc29sdmUodHNjb25maWdQYXRoKSwgZnMpO1xuICAgIGNvbnN0IGhvc3QgPSBjcmVhdGVGaWxlU3lzdGVtQ29tcGlsZXJIb3N0KHBhcnNlZC5vcHRpb25zLCBmcyk7XG4gICAgcmV0dXJuIHRzLmNyZWF0ZVByb2dyYW0ocGFyc2VkLmZpbGVOYW1lcywgcGFyc2VkLm9wdGlvbnMsIGhvc3QpO1xuICB9XG59XG4iXX0=