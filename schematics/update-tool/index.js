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
const path_1 = require("path");
const ts = require("typescript");
const component_resource_collector_1 = require("./component-resource-collector");
const logger_1 = require("./logger");
const parse_tsconfig_1 = require("./utils/parse-tsconfig");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXBkYXRlLXRvb2wvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsK0JBQTZCO0FBQzdCLGlDQUFpQztBQUVqQyxpRkFBMEU7QUFFMUUscUNBQXFEO0FBR3JELDJEQUF5RDtBQUV6RDs7Ozs7O0dBTUc7QUFDSCxNQUFhLGFBQWE7SUFHeEIsWUFBb0IsUUFBaUIsRUFDakIsUUFBb0IsRUFDcEIsV0FBdUIsRUFDdkIsaUJBQXFDLElBQUksR0FBRyxFQUFFLEVBQzlDLFVBQXdCLHNCQUFhO1FBSnJDLGFBQVEsR0FBUixRQUFRLENBQVM7UUFDakIsYUFBUSxHQUFSLFFBQVEsQ0FBWTtRQUNwQixnQkFBVyxHQUFYLFdBQVcsQ0FBWTtRQUN2QixtQkFBYyxHQUFkLGNBQWMsQ0FBZ0M7UUFDOUMsWUFBTyxHQUFQLE9BQU8sQ0FBOEI7UUFOeEMsaUJBQVksR0FBbUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjLEVBQUUsQ0FBQztJQU1uQixDQUFDO0lBRTdEOzs7Ozs7O09BT0c7SUFDSCxPQUFPLENBQU8sY0FBOEMsRUFBRSxNQUFxQixFQUFFLElBQVUsRUFDM0YseUJBQW9DO1FBQ3RDLGdEQUFnRDtRQUNoRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsY0FBYyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN4RSw4RUFBOEU7UUFDOUUsZ0ZBQWdGO1FBQ2hGLGdGQUFnRjtRQUNoRixNQUFNLGlCQUFpQixHQUFHLElBQUkseURBQTBCLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDOUYsMEVBQTBFO1FBQzFFLDBFQUEwRTtRQUMxRSxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGNB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LFNBQVMsQ0FBQztRQUMvRSxDQUFDLENBQUM7UUFDRixPQUFPLEVBQUUsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2xFLENBQUM7Q0FDRjtBQWpKRCxzQ0FpSkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtkaXJuYW1lfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge0NvbXBvbmVudFJlc291cmNlQ29sbGVjdG9yfSBmcm9tICcuL2NvbXBvbmVudC1yZXNvdXJjZS1jb2xsZWN0b3InO1xuaW1wb3J0IHtGaWxlU3lzdGVtLCBXb3Jrc3BhY2VQYXRofSBmcm9tICcuL2ZpbGUtc3lzdGVtJztcbmltcG9ydCB7ZGVmYXVsdExvZ2dlciwgVXBkYXRlTG9nZ2VyfSBmcm9tICcuL2xvZ2dlcic7XG5pbXBvcnQge01pZ3JhdGlvbiwgTWlncmF0aW9uQ3RvciwgTWlncmF0aW9uRmFpbHVyZX0gZnJvbSAnLi9taWdyYXRpb24nO1xuaW1wb3J0IHtUYXJnZXRWZXJzaW9ufSBmcm9tICcuL3RhcmdldC12ZXJzaW9uJztcbmltcG9ydCB7cGFyc2VUc2NvbmZpZ0ZpbGV9IGZyb20gJy4vdXRpbHMvcGFyc2UtdHNjb25maWcnO1xuXG4vKipcbiAqIEFuIHVwZGF0ZSBwcm9qZWN0IHRoYXQgY2FuIGJlIHJ1biBhZ2FpbnN0IGluZGl2aWR1YWwgbWlncmF0aW9ucy4gQW4gdXBkYXRlIHByb2plY3RcbiAqIGFjY2VwdHMgYSBUeXBlU2NyaXB0IHByb2dyYW0gYW5kIGEgY29udGV4dCB0aGF0IGlzIHByb3ZpZGVkIHRvIGFsbCBtaWdyYXRpb25zLiBUaGVcbiAqIGNvbnRleHQgaXMgdXN1YWxseSBub3QgdXNlZCBieSBtaWdyYXRpb25zLCBidXQgaW4gc29tZSBjYXNlcyBtaWdyYXRpb25zIHJlbHkgb25cbiAqIHNwZWNpZmljcyBmcm9tIHRoZSB0b29sIHRoYXQgcGVyZm9ybXMgdGhlIHVwZGF0ZSAoZS5nLiB0aGUgQW5ndWxhciBDTEkpLiBJbiB0aG9zZSBjYXNlcyxcbiAqIHRoZSBjb250ZXh0IGNhbiBwcm92aWRlIHRoZSBuZWNlc3Nhcnkgc3BlY2lmaWNzIHRvIHRoZSBtaWdyYXRpb25zIGluIGEgdHlwZS1zYWZlIHdheS5cbiAqL1xuZXhwb3J0IGNsYXNzIFVwZGF0ZVByb2plY3Q8Q29udGV4dD4ge1xuICBwcml2YXRlIHJlYWRvbmx5IF90eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIgPSB0aGlzLl9wcm9ncmFtLmdldFR5cGVDaGVja2VyKCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfY29udGV4dDogQ29udGV4dCxcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfcHJvZ3JhbTogdHMuUHJvZ3JhbSxcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfZmlsZVN5c3RlbTogRmlsZVN5c3RlbSxcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfYW5hbHl6ZWRGaWxlczogU2V0PFdvcmtzcGFjZVBhdGg+ID0gbmV3IFNldCgpLFxuICAgICAgICAgICAgICBwcml2YXRlIF9sb2dnZXI6IFVwZGF0ZUxvZ2dlciA9IGRlZmF1bHRMb2dnZXIpIHt9XG5cbiAgLyoqXG4gICAqIE1pZ3JhdGVzIHRoZSBwcm9qZWN0IHRvIHRoZSBzcGVjaWZpZWQgdGFyZ2V0IHZlcnNpb24uXG4gICAqIEBwYXJhbSBtaWdyYXRpb25UeXBlcyBNaWdyYXRpb25zIHRoYXQgc2hvdWxkIGJlIHJ1bi5cbiAgICogQHBhcmFtIHRhcmdldCBWZXJzaW9uIHRoZSBwcm9qZWN0IHNob3VsZCBiZSB1cGRhdGVkIHRvLlxuICAgKiBAcGFyYW0gZGF0YSBVcGdyYWRlIGRhdGEgdGhhdCBpcyBwYXNzZWQgdG8gYWxsIG1pZ3JhdGlvbiBydWxlcy5cbiAgICogQHBhcmFtIGFkZGl0aW9uYWxTdHlsZXNoZWV0UGF0aHMgQWRkaXRpb25hbCBzdHlsZXNoZWV0cyB0aGF0IHNob3VsZCBiZSBtaWdyYXRlZCwgaWYgbm90XG4gICAqICAgcmVmZXJlbmNlZCBpbiBhbiBBbmd1bGFyIGNvbXBvbmVudC4gVGhpcyBpcyBoZWxwZnVsIGZvciBnbG9iYWwgc3R5bGVzaGVldHMgaW4gYSBwcm9qZWN0LlxuICAgKi9cbiAgbWlncmF0ZTxEYXRhPihtaWdyYXRpb25UeXBlczogTWlncmF0aW9uQ3RvcjxEYXRhLCBDb250ZXh0PltdLCB0YXJnZXQ6IFRhcmdldFZlcnNpb24sIGRhdGE6IERhdGEsXG4gICAgICBhZGRpdGlvbmFsU3R5bGVzaGVldFBhdGhzPzogc3RyaW5nW10pOiB7aGFzRmFpbHVyZXM6IGJvb2xlYW59IHtcbiAgICAvLyBDcmVhdGUgaW5zdGFuY2VzIG9mIHRoZSBzcGVjaWZpZWQgbWlncmF0aW9ucy5cbiAgICBjb25zdCBtaWdyYXRpb25zID0gdGhpcy5fY3JlYXRlTWlncmF0aW9ucyhtaWdyYXRpb25UeXBlcywgdGFyZ2V0LCBkYXRhKTtcbiAgICAvLyBDcmVhdGVzIHRoZSBjb21wb25lbnQgcmVzb3VyY2UgY29sbGVjdG9yLiBUaGUgY29sbGVjdG9yIGNhbiB2aXNpdCBhcmJpdHJhcnlcbiAgICAvLyBUeXBlU2NyaXB0IG5vZGVzIGFuZCB3aWxsIGZpbmQgQW5ndWxhciBjb21wb25lbnQgcmVzb3VyY2VzLiBSZXNvdXJjZXMgaW5jbHVkZVxuICAgIC8vIHRlbXBsYXRlcyBhbmQgc3R5bGVzaGVldHMuIEl0IGFsc28gY2FwdHVyZXMgaW5saW5lIHN0eWxlc2hlZXRzIGFuZCB0ZW1wbGF0ZXMuXG4gICAgY29uc3QgcmVzb3VyY2VDb2xsZWN0b3IgPSBuZXcgQ29tcG9uZW50UmVzb3VyY2VDb2xsZWN0b3IodGhpcy5fdHlwZUNoZWNrZXIsIHRoaXMuX2ZpbGVTeXN0ZW0pO1xuICAgIC8vIENvbGxlY3QgYWxsIG9mIHRoZSBUeXBlU2NyaXB0IHNvdXJjZSBmaWxlcyB3ZSB3YW50IHRvIG1pZ3JhdGUuIFdlIGRvbid0XG4gICAgLy8gbWlncmF0ZSB0eXBlIGRlZmluaXRpb24gZmlsZXMsIG9yIHNvdXJjZSBmaWxlcyBmcm9tIGV4dGVybmFsIGxpYnJhcmllcy5cbiAgICBjb25zdCBzb3VyY2VGaWxlcyA9IHRoaXMuX3Byb2dyYW0uZ2V0U291cmNlRmlsZXMoKS5maWx0ZXIoXG4gICAgICBmID0+ICFmLmlzRGVjbGFyYXRpb25GaWxlICYmICF0aGlzLl9wcm9ncmFtLmlzU291cmNlRmlsZUZyb21FeHRlcm5hbExpYnJhcnkoZikpO1xuXG4gICAgLy8gSGVscGVyIGZ1bmN0aW9uIHRoYXQgdmlzaXRzIGEgZ2l2ZW4gVHlwZVNjcmlwdCBub2RlIGFuZCBjb2xsZWN0cyBhbGwgcmVmZXJlbmNlZFxuICAgIC8vIGNvbXBvbmVudCByZXNvdXJjZXMgKGkuZS4gc3R5bGVzaGVldHMgb3IgdGVtcGxhdGVzKS4gQWRkaXRpb25hbGx5LCB0aGUgaGVscGVyXG4gICAgLy8gdmlzaXRzIHRoZSBub2RlIGluIGVhY2ggaW5zdGFudGlhdGVkIG1pZ3JhdGlvbi5cbiAgICBjb25zdCB2aXNpdE5vZGVBbmRDb2xsZWN0UmVzb3VyY2VzID0gKG5vZGU6IHRzLk5vZGUpID0+IHtcbiAgICAgIG1pZ3JhdGlvbnMuZm9yRWFjaChyID0+IHIudmlzaXROb2RlKG5vZGUpKTtcbiAgICAgIHRzLmZvckVhY2hDaGlsZChub2RlLCB2aXNpdE5vZGVBbmRDb2xsZWN0UmVzb3VyY2VzKTtcbiAgICAgIHJlc291cmNlQ29sbGVjdG9yLnZpc2l0Tm9kZShub2RlKTtcbiAgICB9O1xuXG4gICAgLy8gV2FsayB0aHJvdWdoIGFsbCBzb3VyY2UgZmlsZSwgaWYgaXQgaGFzIG5vdCBiZWVuIHZpc2l0ZWQgYmVmb3JlLCBhbmRcbiAgICAvLyB2aXNpdCBmb3VuZCBub2RlcyB3aGlsZSBjb2xsZWN0aW5nIHBvdGVudGlhbCByZXNvdXJjZXMuXG4gICAgc291cmNlRmlsZXMuZm9yRWFjaChzb3VyY2VGaWxlID0+IHtcbiAgICAgIGNvbnN0IHJlc29sdmVkUGF0aCA9IHRoaXMuX2ZpbGVTeXN0ZW0ucmVzb2x2ZShzb3VyY2VGaWxlLmZpbGVOYW1lKTtcbiAgICAgIC8vIERvIG5vdCB2aXNpdCBzb3VyY2UgZmlsZXMgd2hpY2ggaGF2ZSBiZWVuIGNoZWNrZWQgYXMgcGFydCBvZiBhXG4gICAgICAvLyBwcmV2aW91c2x5IG1pZ3JhdGVkIFR5cGVTY3JpcHQgcHJvamVjdC5cbiAgICAgIGlmICghdGhpcy5fYW5hbHl6ZWRGaWxlcy5oYXMocmVzb2x2ZWRQYXRoKSkge1xuICAgICAgICB2aXNpdE5vZGVBbmRDb2xsZWN0UmVzb3VyY2VzKHNvdXJjZUZpbGUpO1xuICAgICAgICB0aGlzLl9hbmFseXplZEZpbGVzLmFkZChyZXNvbHZlZFBhdGgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gV2FsayB0aHJvdWdoIGFsbCByZXNvbHZlZCB0ZW1wbGF0ZXMgYW5kIHZpc2l0IHRoZW0gaW4gZWFjaCBpbnN0YW50aWF0ZWRcbiAgICAvLyBtaWdyYXRpb24uIE5vdGUgdGhhdCB0aGlzIGNhbiBvbmx5IGhhcHBlbiBhZnRlciBzb3VyY2UgZmlsZXMgaGF2ZSBiZWVuXG4gICAgLy8gdmlzaXRlZCBiZWNhdXNlIHdlIGZpbmQgdGVtcGxhdGVzIHRocm91Z2ggdGhlIFR5cGVTY3JpcHQgc291cmNlIGZpbGVzLlxuICAgIHJlc291cmNlQ29sbGVjdG9yLnJlc29sdmVkVGVtcGxhdGVzLmZvckVhY2godGVtcGxhdGUgPT4ge1xuICAgICAgLy8gRG8gbm90IHZpc2l0IHRoZSB0ZW1wbGF0ZSBpZiBpdCBoYXMgYmVlbiBjaGVja2VkIGJlZm9yZS4gSW5saW5lXG4gICAgICAvLyB0ZW1wbGF0ZXMgY2Fubm90IGJlIHJlZmVyZW5jZWQgbXVsdGlwbGUgdGltZXMuXG4gICAgICBpZiAodGVtcGxhdGUuaW5saW5lIHx8ICF0aGlzLl9hbmFseXplZEZpbGVzLmhhcyh0ZW1wbGF0ZS5maWxlUGF0aCkpIHtcbiAgICAgICAgbWlncmF0aW9ucy5mb3JFYWNoKG0gPT4gbS52aXNpdFRlbXBsYXRlKHRlbXBsYXRlKSk7XG4gICAgICAgIHRoaXMuX2FuYWx5emVkRmlsZXMuYWRkKHRlbXBsYXRlLmZpbGVQYXRoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFdhbGsgdGhyb3VnaCBhbGwgcmVzb2x2ZWQgc3R5bGVzaGVldHMgYW5kIHZpc2l0IHRoZW0gaW4gZWFjaCBpbnN0YW50aWF0ZWRcbiAgICAvLyBtaWdyYXRpb24uIE5vdGUgdGhhdCB0aGlzIGNhbiBvbmx5IGhhcHBlbiBhZnRlciBzb3VyY2UgZmlsZXMgaGF2ZSBiZWVuXG4gICAgLy8gdmlzaXRlZCBiZWNhdXNlIHdlIGZpbmQgc3R5bGVzaGVldHMgdGhyb3VnaCB0aGUgVHlwZVNjcmlwdCBzb3VyY2UgZmlsZXMuXG4gICAgcmVzb3VyY2VDb2xsZWN0b3IucmVzb2x2ZWRTdHlsZXNoZWV0cy5mb3JFYWNoKHN0eWxlc2hlZXQgPT4ge1xuICAgICAgLy8gRG8gbm90IHZpc2l0IHRoZSBzdHlsZXNoZWV0IGlmIGl0IGhhcyBiZWVuIGNoZWNrZWQgYmVmb3JlLiBJbmxpbmVcbiAgICAgIC8vIHN0eWxlc2hlZXRzIGNhbm5vdCBiZSByZWZlcmVuY2VkIG11bHRpcGxlIHRpbWVzLlxuICAgICAgaWYgKHN0eWxlc2hlZXQuaW5saW5lIHx8ICF0aGlzLl9hbmFseXplZEZpbGVzLmhhcyhzdHlsZXNoZWV0LmZpbGVQYXRoKSkge1xuICAgICAgICBtaWdyYXRpb25zLmZvckVhY2gociA9PiByLnZpc2l0U3R5bGVzaGVldChzdHlsZXNoZWV0KSk7XG4gICAgICAgIHRoaXMuX2FuYWx5emVkRmlsZXMuYWRkKHN0eWxlc2hlZXQuZmlsZVBhdGgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gSW4gc29tZSBhcHBsaWNhdGlvbnMsIGRldmVsb3BlcnMgd2lsbCBoYXZlIGdsb2JhbCBzdHlsZXNoZWV0cyB3aGljaCBhcmUgbm90XG4gICAgLy8gc3BlY2lmaWVkIGluIGFueSBBbmd1bGFyIGNvbXBvbmVudC4gVGhlcmVmb3JlIHdlIGFsbG93IGZvciBhZGRpdGlvbmFsIHN0eWxlc2hlZXRzXG4gICAgLy8gYmVpbmcgc3BlY2lmaWVkLiBXZSB2aXNpdCB0aGVtIGluIGVhY2ggbWlncmF0aW9uIHVubGVzcyB0aGV5IGhhdmUgYmVlbiBhbHJlYWR5XG4gICAgLy8gZGlzY292ZXJlZCBiZWZvcmUgYXMgYWN0dWFsIGNvbXBvbmVudCByZXNvdXJjZS5cbiAgICBpZiAoYWRkaXRpb25hbFN0eWxlc2hlZXRQYXRocykge1xuICAgICAgYWRkaXRpb25hbFN0eWxlc2hlZXRQYXRocy5mb3JFYWNoKGZpbGVQYXRoID0+IHtcbiAgICAgICAgY29uc3QgcmVzb2x2ZWRQYXRoID0gdGhpcy5fZmlsZVN5c3RlbS5yZXNvbHZlKGZpbGVQYXRoKTtcbiAgICAgICAgY29uc3Qgc3R5bGVzaGVldCA9IHJlc291cmNlQ29sbGVjdG9yLnJlc29sdmVFeHRlcm5hbFN0eWxlc2hlZXQocmVzb2x2ZWRQYXRoLCBudWxsKTtcbiAgICAgICAgLy8gRG8gbm90IHZpc2l0IHN0eWxlc2hlZXRzIHdoaWNoIGhhdmUgYmVlbiByZWZlcmVuY2VkIGZyb20gYSBjb21wb25lbnQuXG4gICAgICAgIGlmICghdGhpcy5fYW5hbHl6ZWRGaWxlcy5oYXMocmVzb2x2ZWRQYXRoKSAmJiBzdHlsZXNoZWV0KSB7XG4gICAgICAgICAgbWlncmF0aW9ucy5mb3JFYWNoKHIgPT4gci52aXNpdFN0eWxlc2hlZXQoc3R5bGVzaGVldCkpO1xuICAgICAgICAgIHRoaXMuX2FuYWx5emVkRmlsZXMuYWRkKHJlc29sdmVkUGF0aCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIENhbGwgdGhlIFwicG9zdEFuYWx5c2lzXCIgbWV0aG9kIGZvciBlYWNoIG1pZ3JhdGlvbi5cbiAgICBtaWdyYXRpb25zLmZvckVhY2gociA9PiByLnBvc3RBbmFseXNpcygpKTtcblxuICAgIC8vIENvbGxlY3QgYWxsIGZhaWx1cmVzIHJlcG9ydGVkIGJ5IGluZGl2aWR1YWwgbWlncmF0aW9ucy5cbiAgICBjb25zdCBmYWlsdXJlcyA9IG1pZ3JhdGlvbnMucmVkdWNlKChyZXMsIG0pID0+XG4gICAgICAgIHJlcy5jb25jYXQobS5mYWlsdXJlcyksIFtdIGFzIE1pZ3JhdGlvbkZhaWx1cmVbXSk7XG5cbiAgICAvLyBJbiBjYXNlIHRoZXJlIGFyZSBmYWlsdXJlcywgcHJpbnQgdGhlc2UgdG8gdGhlIENMSSBsb2dnZXIgYXMgd2FybmluZ3MuXG4gICAgaWYgKGZhaWx1cmVzLmxlbmd0aCkge1xuICAgICAgZmFpbHVyZXMuZm9yRWFjaCgoe2ZpbGVQYXRoLCBtZXNzYWdlLCBwb3NpdGlvbn0pID0+IHtcbiAgICAgICAgY29uc3QgbGluZUFuZENoYXJhY3RlciA9IHBvc2l0aW9uID8gYEAke3Bvc2l0aW9uLmxpbmUgKyAxfToke3Bvc2l0aW9uLmNoYXJhY3RlciArIDF9YCA6ICcnO1xuICAgICAgICB0aGlzLl9sb2dnZXIud2FybihgJHtmaWxlUGF0aH0ke2xpbmVBbmRDaGFyYWN0ZXJ9IC0gJHttZXNzYWdlfWApO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGhhc0ZhaWx1cmVzOiAhIWZhaWx1cmVzLmxlbmd0aCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgaW5zdGFuY2VzIG9mIHRoZSBnaXZlbiBtaWdyYXRpb25zIHdpdGggdGhlIHNwZWNpZmllZCB0YXJnZXRcbiAgICogdmVyc2lvbiBhbmQgZGF0YS5cbiAgICovXG4gIHByaXZhdGUgX2NyZWF0ZU1pZ3JhdGlvbnM8RGF0YT4odHlwZXM6IE1pZ3JhdGlvbkN0b3I8RGF0YSwgQ29udGV4dD5bXSwgdGFyZ2V0OiBUYXJnZXRWZXJzaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IERhdGEpOiBNaWdyYXRpb248RGF0YSwgQ29udGV4dD5bXSB7XG4gICAgY29uc3QgcmVzdWx0OiBNaWdyYXRpb248RGF0YSwgQ29udGV4dD5bXSA9IFtdO1xuICAgIGZvciAoY29uc3QgY3RvciBvZiB0eXBlcykge1xuICAgICAgY29uc3QgaW5zdGFuY2UgPSBuZXcgY3Rvcih0aGlzLl9wcm9ncmFtLCB0aGlzLl90eXBlQ2hlY2tlciwgdGFyZ2V0LCB0aGlzLl9jb250ZXh0LFxuICAgICAgICBkYXRhLCB0aGlzLl9maWxlU3lzdGVtLCB0aGlzLl9sb2dnZXIpO1xuICAgICAgaW5zdGFuY2UuaW5pdCgpO1xuICAgICAgaWYgKGluc3RhbmNlLmVuYWJsZWQpIHtcbiAgICAgICAgcmVzdWx0LnB1c2goaW5zdGFuY2UpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBwcm9ncmFtIGZvcm0gdGhlIHNwZWNpZmllZCB0c2NvbmZpZyBhbmQgcGF0Y2hlcyB0aGUgaG9zdFxuICAgKiB0byByZWFkIGZpbGVzIHRocm91Z2ggdGhlIGdpdmVuIGZpbGUgc3lzdGVtLlxuICAgKi9cbiAgc3RhdGljIGNyZWF0ZVByb2dyYW1Gcm9tVHNjb25maWcodHNjb25maWdGc1BhdGg6IHN0cmluZywgZnM6IEZpbGVTeXN0ZW0pOiB0cy5Qcm9ncmFtIHtcbiAgICBjb25zdCBwYXJzZWQgPSBwYXJzZVRzY29uZmlnRmlsZSh0c2NvbmZpZ0ZzUGF0aCwgZGlybmFtZSh0c2NvbmZpZ0ZzUGF0aCkpO1xuICAgIGNvbnN0IGhvc3QgPSB0cy5jcmVhdGVDb21waWxlckhvc3QocGFyc2VkLm9wdGlvbnMsIHRydWUpO1xuICAgIC8vIFBhdGNoIHRoZSBob3N0IHRvIHJlYWQgZmlsZXMgdGhyb3VnaCB0aGUgc3BlY2lmaWVkIGZpbGUgc3lzdGVtLlxuICAgIGhvc3QucmVhZEZpbGUgPSBmaWxlTmFtZSA9PiB7XG4gICAgICBjb25zdCBmaWxlQ29udGVudCA9IGZzLnJlYWQoZnMucmVzb2x2ZShmaWxlTmFtZSkpO1xuICAgICAgLy8gU3RyaXAgQk9NIGFzIG90aGVyd2lzZSBUU0MgbWV0aG9kcyAoZS5nLiBcImdldFdpZHRoXCIpIHdpbGwgcmV0dXJuIGFuIG9mZnNldCB3aGljaFxuICAgICAgLy8gd2hpY2ggYnJlYWtzIHRoZSBDTEkgVXBkYXRlUmVjb3JkZXIuIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvcHVsbC8zMDcxOVxuICAgICAgcmV0dXJuIGZpbGVDb250ZW50ICE9PSBudWxsID8gZmlsZUNvbnRlbnQucmVwbGFjZSgvXlxcdUZFRkYvLCAnJykgOiB1bmRlZmluZWQ7XG4gICAgfTtcbiAgICByZXR1cm4gdHMuY3JlYXRlUHJvZ3JhbShwYXJzZWQuZmlsZU5hbWVzLCBwYXJzZWQub3B0aW9ucywgaG9zdCk7XG4gIH1cbn1cbiJdfQ==