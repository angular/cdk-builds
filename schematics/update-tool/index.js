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
        define("@angular/cdk/schematics/update-tool", ["require", "exports", "path", "typescript", "@angular/cdk/schematics/update-tool/component-resource-collector", "@angular/cdk/schematics/update-tool/logger", "@angular/cdk/schematics/update-tool/utils/parse-tsconfig"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const path_1 = require("path");
    const ts = require("typescript");
    const component_resource_collector_1 = require("@angular/cdk/schematics/update-tool/component-resource-collector");
    const logger_1 = require("@angular/cdk/schematics/update-tool/logger");
    const parse_tsconfig_1 = require("@angular/cdk/schematics/update-tool/utils/parse-tsconfig");
    /**
     * An update project that can be run against individual migrations. An update project
     * accepts a TypeScript program and a context that is provided to all migrations. The
     * context is usually not used by migrations, but in some cases migrations rely on
     * specifics from the tool that performs the update (e.g. the Angular CLI). In those cases,
     * the context can provide the necessary specifics to the migrations in a type-safe way.
     */
    class UpdateProject {
        constructor(_context, _program, _fileSystem, _analyzedFiles = new Set(), _logger = logger_1.defaultLogger) {
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
            additionalStylesheetPaths.forEach(filePath => {
                const resolvedPath = this._fileSystem.resolve(filePath);
                const stylesheet = resourceCollector.resolveExternalStylesheet(resolvedPath, null);
                // Do not visit stylesheets which have been referenced from a component.
                if (!this._analyzedFiles.has(resolvedPath)) {
                    migrations.forEach(r => r.visitStylesheet(stylesheet));
                    this._analyzedFiles.add(resolvedPath);
                }
            });
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
         * to read files through the given file system.
         */
        static createProgramFromTsconfig(tsconfigFsPath, fs) {
            const parsed = parse_tsconfig_1.parseTsconfigFile(tsconfigFsPath, path_1.dirname(tsconfigFsPath));
            const host = ts.createCompilerHost(parsed.options, true);
            // Patch the host to read files through the specified file system.
            host.readFile = fileName => {
                const fileContent = fs.read(fs.resolve(fileName));
                // Strip BOM as otherwise TSC methods (e.g. "getWidth") will return an offset which
                // which breaks the CLI UpdateRecorder. https://github.com/angular/angular/pull/30719
                return fileContent !== null ? fileContent.replace(/^\uFEFF/, '') : undefined;
            };
            return ts.createProgram(parsed.fileNames, parsed.options, host);
        }
    }
    exports.UpdateProject = UpdateProject;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXBkYXRlLXRvb2wvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCwrQkFBNkI7SUFDN0IsaUNBQWlDO0lBRWpDLG1IQUEwRTtJQUUxRSx1RUFBcUQ7SUFHckQsNkZBQXlEO0lBRXpEOzs7Ozs7T0FNRztJQUNILE1BQWEsYUFBYTtRQUd4QixZQUFvQixRQUFpQixFQUNqQixRQUFvQixFQUNwQixXQUF1QixFQUN2QixpQkFBcUMsSUFBSSxHQUFHLEVBQUUsRUFDOUMsVUFBd0Isc0JBQWE7WUFKckMsYUFBUSxHQUFSLFFBQVEsQ0FBUztZQUNqQixhQUFRLEdBQVIsUUFBUSxDQUFZO1lBQ3BCLGdCQUFXLEdBQVgsV0FBVyxDQUFZO1lBQ3ZCLG1CQUFjLEdBQWQsY0FBYyxDQUFnQztZQUM5QyxZQUFPLEdBQVAsT0FBTyxDQUE4QjtZQU54QyxpQkFBWSxHQUFtQixJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBTW5CLENBQUM7UUFFN0Q7Ozs7Ozs7V0FPRztRQUNILE9BQU8sQ0FBTyxjQUE4QyxFQUFFLE1BQXFCLEVBQUUsSUFBVSxFQUMzRix5QkFBb0M7WUFDdEMsZ0RBQWdEO1lBQ2hELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3hFLDhFQUE4RTtZQUM5RSxnRkFBZ0Y7WUFDaEYsZ0ZBQWdGO1lBQ2hGLE1BQU0saUJBQWlCLEdBQUcsSUFBSSx5REFBMEIsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUM5RiwwRUFBMEU7WUFDMUUsMEVBQTBFO1lBQzFFLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxRQUFR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QVMsQ0FBQztZQUMvRSxDQUFDLENBQUM7WUFDRixPQUFPLEVBQUUsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2xFLENBQUM7S0FDRjtJQS9JRCxzQ0ErSUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtkaXJuYW1lfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge0NvbXBvbmVudFJlc291cmNlQ29sbGVjdG9yfSBmcm9tICcuL2NvbXBvbmVudC1yZXNvdXJjZS1jb2xsZWN0b3InO1xuaW1wb3J0IHtGaWxlU3lzdGVtLCBXb3Jrc3BhY2VQYXRofSBmcm9tICcuL2ZpbGUtc3lzdGVtJztcbmltcG9ydCB7ZGVmYXVsdExvZ2dlciwgVXBkYXRlTG9nZ2VyfSBmcm9tICcuL2xvZ2dlcic7XG5pbXBvcnQge01pZ3JhdGlvbiwgTWlncmF0aW9uQ3RvciwgTWlncmF0aW9uRmFpbHVyZX0gZnJvbSAnLi9taWdyYXRpb24nO1xuaW1wb3J0IHtUYXJnZXRWZXJzaW9ufSBmcm9tICcuL3RhcmdldC12ZXJzaW9uJztcbmltcG9ydCB7cGFyc2VUc2NvbmZpZ0ZpbGV9IGZyb20gJy4vdXRpbHMvcGFyc2UtdHNjb25maWcnO1xuXG4vKipcbiAqIEFuIHVwZGF0ZSBwcm9qZWN0IHRoYXQgY2FuIGJlIHJ1biBhZ2FpbnN0IGluZGl2aWR1YWwgbWlncmF0aW9ucy4gQW4gdXBkYXRlIHByb2plY3RcbiAqIGFjY2VwdHMgYSBUeXBlU2NyaXB0IHByb2dyYW0gYW5kIGEgY29udGV4dCB0aGF0IGlzIHByb3ZpZGVkIHRvIGFsbCBtaWdyYXRpb25zLiBUaGVcbiAqIGNvbnRleHQgaXMgdXN1YWxseSBub3QgdXNlZCBieSBtaWdyYXRpb25zLCBidXQgaW4gc29tZSBjYXNlcyBtaWdyYXRpb25zIHJlbHkgb25cbiAqIHNwZWNpZmljcyBmcm9tIHRoZSB0b29sIHRoYXQgcGVyZm9ybXMgdGhlIHVwZGF0ZSAoZS5nLiB0aGUgQW5ndWxhciBDTEkpLiBJbiB0aG9zZSBjYXNlcyxcbiAqIHRoZSBjb250ZXh0IGNhbiBwcm92aWRlIHRoZSBuZWNlc3Nhcnkgc3BlY2lmaWNzIHRvIHRoZSBtaWdyYXRpb25zIGluIGEgdHlwZS1zYWZlIHdheS5cbiAqL1xuZXhwb3J0IGNsYXNzIFVwZGF0ZVByb2plY3Q8Q29udGV4dD4ge1xuICBwcml2YXRlIHJlYWRvbmx5IF90eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIgPSB0aGlzLl9wcm9ncmFtLmdldFR5cGVDaGVja2VyKCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfY29udGV4dDogQ29udGV4dCxcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfcHJvZ3JhbTogdHMuUHJvZ3JhbSxcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfZmlsZVN5c3RlbTogRmlsZVN5c3RlbSxcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfYW5hbHl6ZWRGaWxlczogU2V0PFdvcmtzcGFjZVBhdGg+ID0gbmV3IFNldCgpLFxuICAgICAgICAgICAgICBwcml2YXRlIF9sb2dnZXI6IFVwZGF0ZUxvZ2dlciA9IGRlZmF1bHRMb2dnZXIpIHt9XG5cbiAgLyoqXG4gICAqIE1pZ3JhdGVzIHRoZSBwcm9qZWN0IHRvIHRoZSBzcGVjaWZpZWQgdGFyZ2V0IHZlcnNpb24uXG4gICAqIEBwYXJhbSBtaWdyYXRpb25UeXBlcyBNaWdyYXRpb25zIHRoYXQgc2hvdWxkIGJlIHJ1bi5cbiAgICogQHBhcmFtIHRhcmdldCBWZXJzaW9uIHRoZSBwcm9qZWN0IHNob3VsZCBiZSB1cGRhdGVkIHRvLlxuICAgKiBAcGFyYW0gZGF0YSBVcGdyYWRlIGRhdGEgdGhhdCBpcyBwYXNzZWQgdG8gYWxsIG1pZ3JhdGlvbiBydWxlcy5cbiAgICogQHBhcmFtIGFkZGl0aW9uYWxTdHlsZXNoZWV0UGF0aHMgQWRkaXRpb25hbCBzdHlsZXNoZWV0cyB0aGF0IHNob3VsZCBiZSBtaWdyYXRlZCwgaWYgbm90XG4gICAqICAgcmVmZXJlbmNlZCBpbiBhbiBBbmd1bGFyIGNvbXBvbmVudC4gVGhpcyBpcyBoZWxwZnVsIGZvciBnbG9iYWwgc3R5bGVzaGVldHMgaW4gYSBwcm9qZWN0LlxuICAgKi9cbiAgbWlncmF0ZTxEYXRhPihtaWdyYXRpb25UeXBlczogTWlncmF0aW9uQ3RvcjxEYXRhLCBDb250ZXh0PltdLCB0YXJnZXQ6IFRhcmdldFZlcnNpb24sIGRhdGE6IERhdGEsXG4gICAgICBhZGRpdGlvbmFsU3R5bGVzaGVldFBhdGhzPzogc3RyaW5nW10pOiB7aGFzRmFpbHVyZXM6IGJvb2xlYW59IHtcbiAgICAvLyBDcmVhdGUgaW5zdGFuY2VzIG9mIHRoZSBzcGVjaWZpZWQgbWlncmF0aW9ucy5cbiAgICBjb25zdCBtaWdyYXRpb25zID0gdGhpcy5fY3JlYXRlTWlncmF0aW9ucyhtaWdyYXRpb25UeXBlcywgdGFyZ2V0LCBkYXRhKTtcbiAgICAvLyBDcmVhdGVzIHRoZSBjb21wb25lbnQgcmVzb3VyY2UgY29sbGVjdG9yLiBUaGUgY29sbGVjdG9yIGNhbiB2aXNpdCBhcmJpdHJhcnlcbiAgICAvLyBUeXBlU2NyaXB0IG5vZGVzIGFuZCB3aWxsIGZpbmQgQW5ndWxhciBjb21wb25lbnQgcmVzb3VyY2VzLiBSZXNvdXJjZXMgaW5jbHVkZVxuICAgIC8vIHRlbXBsYXRlcyBhbmQgc3R5bGVzaGVldHMuIEl0IGFsc28gY2FwdHVyZXMgaW5saW5lIHN0eWxlc2hlZXRzIGFuZCB0ZW1wbGF0ZXMuXG4gICAgY29uc3QgcmVzb3VyY2VDb2xsZWN0b3IgPSBuZXcgQ29tcG9uZW50UmVzb3VyY2VDb2xsZWN0b3IodGhpcy5fdHlwZUNoZWNrZXIsIHRoaXMuX2ZpbGVTeXN0ZW0pO1xuICAgIC8vIENvbGxlY3QgYWxsIG9mIHRoZSBUeXBlU2NyaXB0IHNvdXJjZSBmaWxlcyB3ZSB3YW50IHRvIG1pZ3JhdGUuIFdlIGRvbid0XG4gICAgLy8gbWlncmF0ZSB0eXBlIGRlZmluaXRpb24gZmlsZXMsIG9yIHNvdXJjZSBmaWxlcyBmcm9tIGV4dGVybmFsIGxpYnJhcmllcy5cbiAgICBjb25zdCBzb3VyY2VGaWxlcyA9IHRoaXMuX3Byb2dyYW0uZ2V0U291cmNlRmlsZXMoKS5maWx0ZXIoXG4gICAgICBmID0+ICFmLmlzRGVjbGFyYXRpb25GaWxlICYmICF0aGlzLl9wcm9ncmFtLmlzU291cmNlRmlsZUZyb21FeHRlcm5hbExpYnJhcnkoZikpO1xuXG4gICAgLy8gSGVscGVyIGZ1bmN0aW9uIHRoYXQgdmlzaXRzIGEgZ2l2ZW4gVHlwZVNjcmlwdCBub2RlIGFuZCBjb2xsZWN0cyBhbGwgcmVmZXJlbmNlZFxuICAgIC8vIGNvbXBvbmVudCByZXNvdXJjZXMgKGkuZS4gc3R5bGVzaGVldHMgb3IgdGVtcGxhdGVzKS4gQWRkaXRpb25hbGx5LCB0aGUgaGVscGVyXG4gICAgLy8gdmlzaXRzIHRoZSBub2RlIGluIGVhY2ggaW5zdGFudGlhdGVkIG1pZ3JhdGlvbi5cbiAgICBjb25zdCB2aXNpdE5vZGVBbmRDb2xsZWN0UmVzb3VyY2VzID0gKG5vZGU6IHRzLk5vZGUpID0+IHtcbiAgICAgIG1pZ3JhdGlvbnMuZm9yRWFjaChyID0+IHIudmlzaXROb2RlKG5vZGUpKTtcbiAgICAgIHRzLmZvckVhY2hDaGlsZChub2RlLCB2aXNpdE5vZGVBbmRDb2xsZWN0UmVzb3VyY2VzKTtcbiAgICAgIHJlc291cmNlQ29sbGVjdG9yLnZpc2l0Tm9kZShub2RlKTtcbiAgICB9O1xuXG4gICAgLy8gV2FsayB0aHJvdWdoIGFsbCBzb3VyY2UgZmlsZSwgaWYgaXQgaGFzIG5vdCBiZWVuIHZpc2l0ZWQgYmVmb3JlLCBhbmRcbiAgICAvLyB2aXNpdCBmb3VuZCBub2RlcyB3aGlsZSBjb2xsZWN0aW5nIHBvdGVudGlhbCByZXNvdXJjZXMuXG4gICAgc291cmNlRmlsZXMuZm9yRWFjaChzb3VyY2VGaWxlID0+IHtcbiAgICAgIGNvbnN0IHJlc29sdmVkUGF0aCA9IHRoaXMuX2ZpbGVTeXN0ZW0ucmVzb2x2ZShzb3VyY2VGaWxlLmZpbGVOYW1lKTtcbiAgICAgIC8vIERvIG5vdCB2aXNpdCBzb3VyY2UgZmlsZXMgd2hpY2ggaGF2ZSBiZWVuIGNoZWNrZWQgYXMgcGFydCBvZiBhXG4gICAgICAvLyBwcmV2aW91c2x5IG1pZ3JhdGVkIFR5cGVTY3JpcHQgcHJvamVjdC5cbiAgICAgIGlmICghdGhpcy5fYW5hbHl6ZWRGaWxlcy5oYXMocmVzb2x2ZWRQYXRoKSkge1xuICAgICAgICB2aXNpdE5vZGVBbmRDb2xsZWN0UmVzb3VyY2VzKHNvdXJjZUZpbGUpO1xuICAgICAgICB0aGlzLl9hbmFseXplZEZpbGVzLmFkZChyZXNvbHZlZFBhdGgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gV2FsayB0aHJvdWdoIGFsbCByZXNvbHZlZCB0ZW1wbGF0ZXMgYW5kIHZpc2l0IHRoZW0gaW4gZWFjaCBpbnN0YW50aWF0ZWRcbiAgICAvLyBtaWdyYXRpb24uIE5vdGUgdGhhdCB0aGlzIGNhbiBvbmx5IGhhcHBlbiBhZnRlciBzb3VyY2UgZmlsZXMgaGF2ZSBiZWVuXG4gICAgLy8gdmlzaXRlZCBiZWNhdXNlIHdlIGZpbmQgdGVtcGxhdGVzIHRocm91Z2ggdGhlIFR5cGVTY3JpcHQgc291cmNlIGZpbGVzLlxuICAgIHJlc291cmNlQ29sbGVjdG9yLnJlc29sdmVkVGVtcGxhdGVzLmZvckVhY2godGVtcGxhdGUgPT4ge1xuICAgICAgLy8gRG8gbm90IHZpc2l0IHRoZSB0ZW1wbGF0ZSBpZiBpdCBoYXMgYmVlbiBjaGVja2VkIGJlZm9yZS4gSW5saW5lXG4gICAgICAvLyB0ZW1wbGF0ZXMgY2Fubm90IGJlIHJlZmVyZW5jZWQgbXVsdGlwbGUgdGltZXMuXG4gICAgICBpZiAodGVtcGxhdGUuaW5saW5lIHx8ICF0aGlzLl9hbmFseXplZEZpbGVzLmhhcyh0ZW1wbGF0ZS5maWxlUGF0aCkpIHtcbiAgICAgICAgbWlncmF0aW9ucy5mb3JFYWNoKG0gPT4gbS52aXNpdFRlbXBsYXRlKHRlbXBsYXRlKSk7XG4gICAgICAgIHRoaXMuX2FuYWx5emVkRmlsZXMuYWRkKHRlbXBsYXRlLmZpbGVQYXRoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFdhbGsgdGhyb3VnaCBhbGwgcmVzb2x2ZWQgc3R5bGVzaGVldHMgYW5kIHZpc2l0IHRoZW0gaW4gZWFjaCBpbnN0YW50aWF0ZWRcbiAgICAvLyBtaWdyYXRpb24uIE5vdGUgdGhhdCB0aGlzIGNhbiBvbmx5IGhhcHBlbiBhZnRlciBzb3VyY2UgZmlsZXMgaGF2ZSBiZWVuXG4gICAgLy8gdmlzaXRlZCBiZWNhdXNlIHdlIGZpbmQgc3R5bGVzaGVldHMgdGhyb3VnaCB0aGUgVHlwZVNjcmlwdCBzb3VyY2UgZmlsZXMuXG4gICAgcmVzb3VyY2VDb2xsZWN0b3IucmVzb2x2ZWRTdHlsZXNoZWV0cy5mb3JFYWNoKHN0eWxlc2hlZXQgPT4ge1xuICAgICAgLy8gRG8gbm90IHZpc2l0IHRoZSBzdHlsZXNoZWV0IGlmIGl0IGhhcyBiZWVuIGNoZWNrZWQgYmVmb3JlLiBJbmxpbmVcbiAgICAgIC8vIHN0eWxlc2hlZXRzIGNhbm5vdCBiZSByZWZlcmVuY2VkIG11bHRpcGxlIHRpbWVzLlxuICAgICAgaWYgKHN0eWxlc2hlZXQuaW5saW5lIHx8ICF0aGlzLl9hbmFseXplZEZpbGVzLmhhcyhzdHlsZXNoZWV0LmZpbGVQYXRoKSkge1xuICAgICAgICBtaWdyYXRpb25zLmZvckVhY2gociA9PiByLnZpc2l0U3R5bGVzaGVldChzdHlsZXNoZWV0KSk7XG4gICAgICAgIHRoaXMuX2FuYWx5emVkRmlsZXMuYWRkKHN0eWxlc2hlZXQuZmlsZVBhdGgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gSW4gc29tZSBhcHBsaWNhdGlvbnMsIGRldmVsb3BlcnMgd2lsbCBoYXZlIGdsb2JhbCBzdHlsZXNoZWV0cyB3aGljaCBhcmUgbm90XG4gICAgLy8gc3BlY2lmaWVkIGluIGFueSBBbmd1bGFyIGNvbXBvbmVudC4gVGhlcmVmb3JlIHdlIGFsbG93IGZvciBhZGRpdGlvbmFsIHN0eWxlc2hlZXRzXG4gICAgLy8gYmVpbmcgc3BlY2lmaWVkLiBXZSB2aXNpdCB0aGVtIGluIGVhY2ggbWlncmF0aW9uIHVubGVzcyB0aGV5IGhhdmUgYmVlbiBhbHJlYWR5XG4gICAgLy8gZGlzY292ZXJlZCBiZWZvcmUgYXMgYWN0dWFsIGNvbXBvbmVudCByZXNvdXJjZS5cbiAgICBhZGRpdGlvbmFsU3R5bGVzaGVldFBhdGhzLmZvckVhY2goZmlsZVBhdGggPT4ge1xuICAgICAgY29uc3QgcmVzb2x2ZWRQYXRoID0gdGhpcy5fZmlsZVN5c3RlbS5yZXNvbHZlKGZpbGVQYXRoKTtcbiAgICAgIGNvbnN0IHN0eWxlc2hlZXQgPSByZXNvdXJjZUNvbGxlY3Rvci5yZXNvbHZlRXh0ZXJuYWxTdHlsZXNoZWV0KHJlc29sdmVkUGF0aCwgbnVsbCk7XG4gICAgICAvLyBEbyBub3QgdmlzaXQgc3R5bGVzaGVldHMgd2hpY2ggaGF2ZSBiZWVuIHJlZmVyZW5jZWQgZnJvbSBhIGNvbXBvbmVudC5cbiAgICAgIGlmICghdGhpcy5fYW5hbHl6ZWRGaWxlcy5oYXMocmVzb2x2ZWRQYXRoKSkge1xuICAgICAgICBtaWdyYXRpb25zLmZvckVhY2gociA9PiByLnZpc2l0U3R5bGVzaGVldChzdHlsZXNoZWV0KSk7XG4gICAgICAgIHRoaXMuX2FuYWx5emVkRmlsZXMuYWRkKHJlc29sdmVkUGF0aCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBDYWxsIHRoZSBcInBvc3RBbmFseXNpc1wiIG1ldGhvZCBmb3IgZWFjaCBtaWdyYXRpb24uXG4gICAgbWlncmF0aW9ucy5mb3JFYWNoKHIgPT4gci5wb3N0QW5hbHlzaXMoKSk7XG5cbiAgICAvLyBDb2xsZWN0IGFsbCBmYWlsdXJlcyByZXBvcnRlZCBieSBpbmRpdmlkdWFsIG1pZ3JhdGlvbnMuXG4gICAgY29uc3QgZmFpbHVyZXMgPSBtaWdyYXRpb25zLnJlZHVjZSgocmVzLCBtKSA9PlxuICAgICAgICByZXMuY29uY2F0KG0uZmFpbHVyZXMpLCBbXSBhcyBNaWdyYXRpb25GYWlsdXJlW10pO1xuXG4gICAgLy8gSW4gY2FzZSB0aGVyZSBhcmUgZmFpbHVyZXMsIHByaW50IHRoZXNlIHRvIHRoZSBDTEkgbG9nZ2VyIGFzIHdhcm5pbmdzLlxuICAgIGlmIChmYWlsdXJlcy5sZW5ndGgpIHtcbiAgICAgIGZhaWx1cmVzLmZvckVhY2goKHtmaWxlUGF0aCwgbWVzc2FnZSwgcG9zaXRpb259KSA9PiB7XG4gICAgICAgIGNvbnN0IGxpbmVBbmRDaGFyYWN0ZXIgPSBwb3NpdGlvbiA/IGBAJHtwb3NpdGlvbi5saW5lICsgMX06JHtwb3NpdGlvbi5jaGFyYWN0ZXIgKyAxfWAgOiAnJztcbiAgICAgICAgdGhpcy5fbG9nZ2VyLndhcm4oYCR7ZmlsZVBhdGh9JHtsaW5lQW5kQ2hhcmFjdGVyfSAtICR7bWVzc2FnZX1gKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBoYXNGYWlsdXJlczogISFmYWlsdXJlcy5sZW5ndGgsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGluc3RhbmNlcyBvZiB0aGUgZ2l2ZW4gbWlncmF0aW9ucyB3aXRoIHRoZSBzcGVjaWZpZWQgdGFyZ2V0XG4gICAqIHZlcnNpb24gYW5kIGRhdGEuXG4gICAqL1xuICBwcml2YXRlIF9jcmVhdGVNaWdyYXRpb25zPERhdGE+KHR5cGVzOiBNaWdyYXRpb25DdG9yPERhdGEsIENvbnRleHQ+W10sIHRhcmdldDogVGFyZ2V0VmVyc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiBEYXRhKTogTWlncmF0aW9uPERhdGEsIENvbnRleHQ+W10ge1xuICAgIGNvbnN0IHJlc3VsdDogTWlncmF0aW9uPERhdGEsIENvbnRleHQ+W10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGN0b3Igb2YgdHlwZXMpIHtcbiAgICAgIGNvbnN0IGluc3RhbmNlID0gbmV3IGN0b3IodGhpcy5fcHJvZ3JhbSwgdGhpcy5fdHlwZUNoZWNrZXIsIHRhcmdldCwgdGhpcy5fY29udGV4dCxcbiAgICAgICAgZGF0YSwgdGhpcy5fZmlsZVN5c3RlbSwgdGhpcy5fbG9nZ2VyKTtcbiAgICAgIGluc3RhbmNlLmluaXQoKTtcbiAgICAgIGlmIChpbnN0YW5jZS5lbmFibGVkKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGluc3RhbmNlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcHJvZ3JhbSBmb3JtIHRoZSBzcGVjaWZpZWQgdHNjb25maWcgYW5kIHBhdGNoZXMgdGhlIGhvc3RcbiAgICogdG8gcmVhZCBmaWxlcyB0aHJvdWdoIHRoZSBnaXZlbiBmaWxlIHN5c3RlbS5cbiAgICovXG4gIHN0YXRpYyBjcmVhdGVQcm9ncmFtRnJvbVRzY29uZmlnKHRzY29uZmlnRnNQYXRoOiBzdHJpbmcsIGZzOiBGaWxlU3lzdGVtKTogdHMuUHJvZ3JhbSB7XG4gICAgY29uc3QgcGFyc2VkID0gcGFyc2VUc2NvbmZpZ0ZpbGUodHNjb25maWdGc1BhdGgsIGRpcm5hbWUodHNjb25maWdGc1BhdGgpKTtcbiAgICBjb25zdCBob3N0ID0gdHMuY3JlYXRlQ29tcGlsZXJIb3N0KHBhcnNlZC5vcHRpb25zLCB0cnVlKTtcbiAgICAvLyBQYXRjaCB0aGUgaG9zdCB0byByZWFkIGZpbGVzIHRocm91Z2ggdGhlIHNwZWNpZmllZCBmaWxlIHN5c3RlbS5cbiAgICBob3N0LnJlYWRGaWxlID0gZmlsZU5hbWUgPT4ge1xuICAgICAgY29uc3QgZmlsZUNvbnRlbnQgPSBmcy5yZWFkKGZzLnJlc29sdmUoZmlsZU5hbWUpKTtcbiAgICAgIC8vIFN0cmlwIEJPTSBhcyBvdGhlcndpc2UgVFNDIG1ldGhvZHMgKGUuZy4gXCJnZXRXaWR0aFwiKSB3aWxsIHJldHVybiBhbiBvZmZzZXQgd2hpY2hcbiAgICAgIC8vIHdoaWNoIGJyZWFrcyB0aGUgQ0xJIFVwZGF0ZVJlY29yZGVyLiBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL3B1bGwvMzA3MTlcbiAgICAgIHJldHVybiBmaWxlQ29udGVudCAhPT0gbnVsbCA/IGZpbGVDb250ZW50LnJlcGxhY2UoL15cXHVGRUZGLywgJycpIDogdW5kZWZpbmVkO1xuICAgIH07XG4gICAgcmV0dXJuIHRzLmNyZWF0ZVByb2dyYW0ocGFyc2VkLmZpbGVOYW1lcywgcGFyc2VkLm9wdGlvbnMsIGhvc3QpO1xuICB9XG59XG4iXX0=