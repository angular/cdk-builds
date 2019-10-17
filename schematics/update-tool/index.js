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
        define("@angular/cdk/schematics/update-tool", ["require", "exports", "@angular-devkit/core", "glob", "path", "typescript", "@angular/cdk/schematics/update-tool/component-resource-collector", "@angular/cdk/schematics/update-tool/utils/parse-tsconfig"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const core_1 = require("@angular-devkit/core");
    const glob_1 = require("glob");
    const path_1 = require("path");
    const ts = require("typescript");
    const component_resource_collector_1 = require("@angular/cdk/schematics/update-tool/component-resource-collector");
    const parse_tsconfig_1 = require("@angular/cdk/schematics/update-tool/utils/parse-tsconfig");
    function runMigrationRules(tree, logger, tsconfigPath, isTestTarget, targetVersion, ruleTypes, upgradeData, analyzedFiles) {
        // The CLI uses the working directory as the base directory for the
        // virtual file system tree.
        const basePath = process.cwd();
        const parsed = parse_tsconfig_1.parseTsconfigFile(tsconfigPath, path_1.dirname(tsconfigPath));
        const host = ts.createCompilerHost(parsed.options, true);
        // We need to overwrite the host "readFile" method, as we want the TypeScript
        // program to be based on the file contents in the virtual file tree.
        host.readFile = fileName => {
            const buffer = tree.read(getProjectRelativePath(fileName));
            // Strip BOM as otherwise TSC methods (e.g. "getWidth") will return an offset which
            // which breaks the CLI UpdateRecorder. https://github.com/angular/angular/pull/30719
            return buffer ? buffer.toString().replace(/^\uFEFF/, '') : undefined;
        };
        const program = ts.createProgram(parsed.fileNames, parsed.options, host);
        const typeChecker = program.getTypeChecker();
        const rules = [];
        // Create instances of all specified migration rules.
        for (const ruleCtor of ruleTypes) {
            const rule = new ruleCtor(program, typeChecker, targetVersion, upgradeData, tree, getUpdateRecorder, basePath, logger, isTestTarget, tsconfigPath);
            rule.init();
            if (rule.ruleEnabled) {
                rules.push(rule);
            }
        }
        const sourceFiles = program.getSourceFiles().filter(f => !f.isDeclarationFile && !program.isSourceFileFromExternalLibrary(f));
        const resourceCollector = new component_resource_collector_1.ComponentResourceCollector(typeChecker);
        const updateRecorderCache = new Map();
        sourceFiles.forEach(sourceFile => {
            const relativePath = getProjectRelativePath(sourceFile.fileName);
            // Do not visit source files which have been checked as part of a
            // previously migrated TypeScript project.
            if (!analyzedFiles.has(relativePath)) {
                _visitTypeScriptNode(sourceFile);
                analyzedFiles.add(relativePath);
            }
        });
        resourceCollector.resolvedTemplates.forEach(template => {
            const relativePath = getProjectRelativePath(template.filePath);
            // Do not visit the template if it has been checked before. Inline
            // templates cannot be referenced multiple times.
            if (template.inline || !analyzedFiles.has(relativePath)) {
                rules.forEach(r => r.visitTemplate(template));
                analyzedFiles.add(relativePath);
            }
        });
        resourceCollector.resolvedStylesheets.forEach(stylesheet => {
            const relativePath = getProjectRelativePath(stylesheet.filePath);
            // Do not visit the stylesheet if it has been checked before. Inline
            // stylesheets cannot be referenced multiple times.
            if (stylesheet.inline || !analyzedFiles.has(relativePath)) {
                rules.forEach(r => r.visitStylesheet(stylesheet));
                analyzedFiles.add(relativePath);
            }
        });
        // In some applications, developers will have global stylesheets which are not specified in any
        // Angular component. Therefore we glob up all CSS and SCSS files outside of node_modules and
        // dist. The files will be read by the individual stylesheet rules and checked.
        // TODO(devversion): double-check if we can solve this in a more elegant way.
        glob_1.sync('!(node_modules|dist)/**/*.+(css|scss)', { absolute: true, cwd: basePath })
            .filter(filePath => !resourceCollector.resolvedStylesheets.some(s => s.filePath === filePath))
            .forEach(filePath => {
            const stylesheet = resourceCollector.resolveExternalStylesheet(filePath, null);
            const relativePath = getProjectRelativePath(filePath);
            // do not visit stylesheets which have been referenced from a component.
            if (!analyzedFiles.has(relativePath)) {
                rules.forEach(r => r.visitStylesheet(stylesheet));
            }
        });
        // Call the "postAnalysis" method for each migration rule.
        rules.forEach(r => r.postAnalysis());
        // Commit all recorded updates in the update recorder. We need to perform the
        // replacements per source file in order to ensure that offsets in the TypeScript
        // program are not incorrectly shifted.
        updateRecorderCache.forEach(recorder => tree.commitUpdate(recorder));
        // Collect all failures reported by individual migration rules.
        const ruleFailures = rules.reduce((res, rule) => res.concat(rule.failures), []);
        // In case there are rule failures, print these to the CLI logger as warnings.
        if (ruleFailures.length) {
            ruleFailures.forEach(({ filePath, message, position }) => {
                const normalizedFilePath = core_1.normalize(getProjectRelativePath(filePath));
                const lineAndCharacter = position ? `@${position.line + 1}:${position.character + 1}` : '';
                logger.warn(`${normalizedFilePath}${lineAndCharacter} - ${message}`);
            });
        }
        return {
            hasFailures: !!ruleFailures.length,
        };
        function getUpdateRecorder(filePath) {
            const treeFilePath = getProjectRelativePath(filePath);
            if (updateRecorderCache.has(treeFilePath)) {
                return updateRecorderCache.get(treeFilePath);
            }
            const treeRecorder = tree.beginUpdate(treeFilePath);
            updateRecorderCache.set(treeFilePath, treeRecorder);
            return treeRecorder;
        }
        function _visitTypeScriptNode(node) {
            rules.forEach(r => r.visitNode(node));
            ts.forEachChild(node, _visitTypeScriptNode);
            resourceCollector.visitNode(node);
        }
        /** Gets the specified path relative to the project root in POSIX format. */
        function getProjectRelativePath(filePath) {
            return path_1.relative(basePath, filePath).replace(/\\/g, '/');
        }
    }
    exports.runMigrationRules = runMigrationRules;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXBkYXRlLXRvb2wvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCwrQ0FBd0Q7SUFFeEQsK0JBQXNDO0lBQ3RDLCtCQUF1QztJQUN2QyxpQ0FBaUM7SUFFakMsbUhBQTBFO0lBRzFFLDZGQUF5RDtJQU96RCxTQUFnQixpQkFBaUIsQ0FDN0IsSUFBVSxFQUFFLE1BQXlCLEVBQUUsWUFBb0IsRUFBRSxZQUFxQixFQUNsRixhQUE0QixFQUFFLFNBQWlDLEVBQUUsV0FBYyxFQUMvRSxhQUEwQjtRQUM1QixtRUFBbUU7UUFDbkUsNEJBQTRCO1FBQzVCLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUMvQixNQUFNLE1BQU0sR0FBRyxrQ0FBaUIsQ0FBQyxZQUFZLEVBQUUsY0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDdEUsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFekQsNkVBQTZFO1FBQzdFLHFFQUFxRTtRQUNyRSxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxFQUFFO1lBQ3pCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUMzRCxtRkFBbUY7WUFDbkYscUZBQXFGO1lBQ3JGLE9BQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1FBQ3ZFLENBQUMsQ0FBQztRQUVGLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FB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SUFBSSxFQUFFLG9CQUFvQixDQUFDLENBQUM7WUFDNUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFRCw0RUFBNEU7UUFDNUUsU0FBUyxzQkFBc0IsQ0FBQyxRQUFnQjtZQUM5QyxPQUFPLGVBQVEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztRQUMxRCxDQUFDO0lBQ0gsQ0FBQztJQWpJRCw4Q0FpSUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtsb2dnaW5nLCBub3JtYWxpemV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7VHJlZSwgVXBkYXRlUmVjb3JkZXJ9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7c3luYyBhcyBnbG9iU3luY30gZnJvbSAnZ2xvYic7XG5pbXBvcnQge2Rpcm5hbWUsIHJlbGF0aXZlfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge0NvbXBvbmVudFJlc291cmNlQ29sbGVjdG9yfSBmcm9tICcuL2NvbXBvbmVudC1yZXNvdXJjZS1jb2xsZWN0b3InO1xuaW1wb3J0IHtNaWdyYXRpb25GYWlsdXJlLCBNaWdyYXRpb25SdWxlfSBmcm9tICcuL21pZ3JhdGlvbi1ydWxlJztcbmltcG9ydCB7VGFyZ2V0VmVyc2lvbn0gZnJvbSAnLi90YXJnZXQtdmVyc2lvbic7XG5pbXBvcnQge3BhcnNlVHNjb25maWdGaWxlfSBmcm9tICcuL3V0aWxzL3BhcnNlLXRzY29uZmlnJztcblxuZXhwb3J0IHR5cGUgQ29uc3RydWN0b3I8VD4gPSAobmV3ICguLi5hcmdzOiBhbnlbXSkgPT4gVCk7XG5leHBvcnQgdHlwZSBNaWdyYXRpb25SdWxlVHlwZTxUPiA9IENvbnN0cnVjdG9yPE1pZ3JhdGlvblJ1bGU8VD4+XG4gICAgJiB7W20gaW4ga2V5b2YgdHlwZW9mIE1pZ3JhdGlvblJ1bGVdOiAodHlwZW9mIE1pZ3JhdGlvblJ1bGUpW21dfTtcblxuXG5leHBvcnQgZnVuY3Rpb24gcnVuTWlncmF0aW9uUnVsZXM8VD4oXG4gICAgdHJlZTogVHJlZSwgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSwgdHNjb25maWdQYXRoOiBzdHJpbmcsIGlzVGVzdFRhcmdldDogYm9vbGVhbixcbiAgICB0YXJnZXRWZXJzaW9uOiBUYXJnZXRWZXJzaW9uLCBydWxlVHlwZXM6IE1pZ3JhdGlvblJ1bGVUeXBlPFQ+W10sIHVwZ3JhZGVEYXRhOiBULFxuICAgIGFuYWx5emVkRmlsZXM6IFNldDxzdHJpbmc+KToge2hhc0ZhaWx1cmVzOiBib29sZWFufSB7XG4gIC8vIFRoZSBDTEkgdXNlcyB0aGUgd29ya2luZyBkaXJlY3RvcnkgYXMgdGhlIGJhc2UgZGlyZWN0b3J5IGZvciB0aGVcbiAgLy8gdmlydHVhbCBmaWxlIHN5c3RlbSB0cmVlLlxuICBjb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuY3dkKCk7XG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlVHNjb25maWdGaWxlKHRzY29uZmlnUGF0aCwgZGlybmFtZSh0c2NvbmZpZ1BhdGgpKTtcbiAgY29uc3QgaG9zdCA9IHRzLmNyZWF0ZUNvbXBpbGVySG9zdChwYXJzZWQub3B0aW9ucywgdHJ1ZSk7XG5cbiAgLy8gV2UgbmVlZCB0byBvdmVyd3JpdGUgdGhlIGhvc3QgXCJyZWFkRmlsZVwiIG1ldGhvZCwgYXMgd2Ugd2FudCB0aGUgVHlwZVNjcmlwdFxuICAvLyBwcm9ncmFtIHRvIGJlIGJhc2VkIG9uIHRoZSBmaWxlIGNvbnRlbnRzIGluIHRoZSB2aXJ0dWFsIGZpbGUgdHJlZS5cbiAgaG9zdC5yZWFkRmlsZSA9IGZpbGVOYW1lID0+IHtcbiAgICBjb25zdCBidWZmZXIgPSB0cmVlLnJlYWQoZ2V0UHJvamVjdFJlbGF0aXZlUGF0aChmaWxlTmFtZSkpO1xuICAgIC8vIFN0cmlwIEJPTSBhcyBvdGhlcndpc2UgVFNDIG1ldGhvZHMgKGUuZy4gXCJnZXRXaWR0aFwiKSB3aWxsIHJldHVybiBhbiBvZmZzZXQgd2hpY2hcbiAgICAvLyB3aGljaCBicmVha3MgdGhlIENMSSBVcGRhdGVSZWNvcmRlci4gaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9wdWxsLzMwNzE5XG4gICAgcmV0dXJuIGJ1ZmZlciA/IGJ1ZmZlci50b1N0cmluZygpLnJlcGxhY2UoL15cXHVGRUZGLywgJycpIDogdW5kZWZpbmVkO1xuICB9O1xuXG4gIGNvbnN0IHByb2dyYW0gPSB0cy5jcmVhdGVQcm9ncmFtKHBhcnNlZC5maWxlTmFtZXMsIHBhcnNlZC5vcHRpb25zLCBob3N0KTtcbiAgY29uc3QgdHlwZUNoZWNrZXIgPSBwcm9ncmFtLmdldFR5cGVDaGVja2VyKCk7XG4gIGNvbnN0IHJ1bGVzOiBNaWdyYXRpb25SdWxlPFQ+W10gPSBbXTtcblxuICAvLyBDcmVhdGUgaW5zdGFuY2VzIG9mIGFsbCBzcGVjaWZpZWQgbWlncmF0aW9uIHJ1bGVzLlxuICBmb3IgKGNvbnN0IHJ1bGVDdG9yIG9mIHJ1bGVUeXBlcykge1xuICAgIGNvbnN0IHJ1bGUgPSBuZXcgcnVsZUN0b3IoXG4gICAgICAgIHByb2dyYW0sIHR5cGVDaGVja2VyLCB0YXJnZXRWZXJzaW9uLCB1cGdyYWRlRGF0YSwgdHJlZSwgZ2V0VXBkYXRlUmVjb3JkZXIsIGJhc2VQYXRoLCBsb2dnZXIsXG4gICAgICAgIGlzVGVzdFRhcmdldCwgdHNjb25maWdQYXRoKTtcbiAgICBydWxlLmluaXQoKTtcbiAgICBpZiAocnVsZS5ydWxlRW5hYmxlZCkge1xuICAgICAgcnVsZXMucHVzaChydWxlKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBzb3VyY2VGaWxlcyA9IHByb2dyYW0uZ2V0U291cmNlRmlsZXMoKS5maWx0ZXIoXG4gICAgICBmID0+ICFmLmlzRGVjbGFyYXRpb25GaWxlICYmICFwcm9ncmFtLmlzU291cmNlRmlsZUZyb21FeHRlcm5hbExpYnJhcnkoZikpO1xuICBjb25zdCByZXNvdXJjZUNvbGxlY3RvciA9IG5ldyBDb21wb25lbnRSZXNvdXJjZUNvbGxlY3Rvcih0eXBlQ2hlY2tlcik7XG4gIGNvbnN0IHVwZGF0ZVJlY29yZGVyQ2FjaGUgPSBuZXcgTWFwPHN0cmluZywgVXBkYXRlUmVjb3JkZXI+KCk7XG5cbiAgc291cmNlRmlsZXMuZm9yRWFjaChzb3VyY2VGaWxlID0+IHtcbiAgICBjb25zdCByZWxhdGl2ZVBhdGggPSBnZXRQcm9qZWN0UmVsYXRpdmVQYXRoKHNvdXJjZUZpbGUuZmlsZU5hbWUpO1xuICAgIC8vIERvIG5vdCB2aXNpdCBzb3VyY2UgZmlsZXMgd2hpY2ggaGF2ZSBiZWVuIGNoZWNrZWQgYXMgcGFydCBvZiBhXG4gICAgLy8gcHJldmlvdXNseSBtaWdyYXRlZCBUeXBlU2NyaXB0IHByb2plY3QuXG4gICAgaWYgKCFhbmFseXplZEZpbGVzLmhhcyhyZWxhdGl2ZVBhdGgpKSB7XG4gICAgICBfdmlzaXRUeXBlU2NyaXB0Tm9kZShzb3VyY2VGaWxlKTtcbiAgICAgIGFuYWx5emVkRmlsZXMuYWRkKHJlbGF0aXZlUGF0aCk7XG4gICAgfVxuICB9KTtcblxuICByZXNvdXJjZUNvbGxlY3Rvci5yZXNvbHZlZFRlbXBsYXRlcy5mb3JFYWNoKHRlbXBsYXRlID0+IHtcbiAgICBjb25zdCByZWxhdGl2ZVBhdGggPSBnZXRQcm9qZWN0UmVsYXRpdmVQYXRoKHRlbXBsYXRlLmZpbGVQYXRoKTtcbiAgICAvLyBEbyBub3QgdmlzaXQgdGhlIHRlbXBsYXRlIGlmIGl0IGhhcyBiZWVuIGNoZWNrZWQgYmVmb3JlLiBJbmxpbmVcbiAgICAvLyB0ZW1wbGF0ZXMgY2Fubm90IGJlIHJlZmVyZW5jZWQgbXVsdGlwbGUgdGltZXMuXG4gICAgaWYgKHRlbXBsYXRlLmlubGluZSB8fCAhYW5hbHl6ZWRGaWxlcy5oYXMocmVsYXRpdmVQYXRoKSkge1xuICAgICAgcnVsZXMuZm9yRWFjaChyID0+IHIudmlzaXRUZW1wbGF0ZSh0ZW1wbGF0ZSkpO1xuICAgICAgYW5hbHl6ZWRGaWxlcy5hZGQocmVsYXRpdmVQYXRoKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJlc291cmNlQ29sbGVjdG9yLnJlc29sdmVkU3R5bGVzaGVldHMuZm9yRWFjaChzdHlsZXNoZWV0ID0+IHtcbiAgICBjb25zdCByZWxhdGl2ZVBhdGggPSBnZXRQcm9qZWN0UmVsYXRpdmVQYXRoKHN0eWxlc2hlZXQuZmlsZVBhdGgpO1xuICAgIC8vIERvIG5vdCB2aXNpdCB0aGUgc3R5bGVzaGVldCBpZiBpdCBoYXMgYmVlbiBjaGVja2VkIGJlZm9yZS4gSW5saW5lXG4gICAgLy8gc3R5bGVzaGVldHMgY2Fubm90IGJlIHJlZmVyZW5jZWQgbXVsdGlwbGUgdGltZXMuXG4gICAgaWYgKHN0eWxlc2hlZXQuaW5saW5lIHx8ICFhbmFseXplZEZpbGVzLmhhcyhyZWxhdGl2ZVBhdGgpKSB7XG4gICAgICBydWxlcy5mb3JFYWNoKHIgPT4gci52aXNpdFN0eWxlc2hlZXQoc3R5bGVzaGVldCkpO1xuICAgICAgYW5hbHl6ZWRGaWxlcy5hZGQocmVsYXRpdmVQYXRoKTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIEluIHNvbWUgYXBwbGljYXRpb25zLCBkZXZlbG9wZXJzIHdpbGwgaGF2ZSBnbG9iYWwgc3R5bGVzaGVldHMgd2hpY2ggYXJlIG5vdCBzcGVjaWZpZWQgaW4gYW55XG4gIC8vIEFuZ3VsYXIgY29tcG9uZW50LiBUaGVyZWZvcmUgd2UgZ2xvYiB1cCBhbGwgQ1NTIGFuZCBTQ1NTIGZpbGVzIG91dHNpZGUgb2Ygbm9kZV9tb2R1bGVzIGFuZFxuICAvLyBkaXN0LiBUaGUgZmlsZXMgd2lsbCBiZSByZWFkIGJ5IHRoZSBpbmRpdmlkdWFsIHN0eWxlc2hlZXQgcnVsZXMgYW5kIGNoZWNrZWQuXG4gIC8vIFRPRE8oZGV2dmVyc2lvbik6IGRvdWJsZS1jaGVjayBpZiB3ZSBjYW4gc29sdmUgdGhpcyBpbiBhIG1vcmUgZWxlZ2FudCB3YXkuXG4gIGdsb2JTeW5jKCchKG5vZGVfbW9kdWxlc3xkaXN0KS8qKi8qLisoY3NzfHNjc3MpJywge2Fic29sdXRlOiB0cnVlLCBjd2Q6IGJhc2VQYXRofSlcbiAgICAgIC5maWx0ZXIoZmlsZVBhdGggPT4gIXJlc291cmNlQ29sbGVjdG9yLnJlc29sdmVkU3R5bGVzaGVldHMuc29tZShzID0+IHMuZmlsZVBhdGggPT09IGZpbGVQYXRoKSlcbiAgICAgIC5mb3JFYWNoKGZpbGVQYXRoID0+IHtcbiAgICAgICAgY29uc3Qgc3R5bGVzaGVldCA9IHJlc291cmNlQ29sbGVjdG9yLnJlc29sdmVFeHRlcm5hbFN0eWxlc2hlZXQoZmlsZVBhdGgsIG51bGwpO1xuICAgICAgICBjb25zdCByZWxhdGl2ZVBhdGggPSBnZXRQcm9qZWN0UmVsYXRpdmVQYXRoKGZpbGVQYXRoKTtcbiAgICAgICAgLy8gZG8gbm90IHZpc2l0IHN0eWxlc2hlZXRzIHdoaWNoIGhhdmUgYmVlbiByZWZlcmVuY2VkIGZyb20gYSBjb21wb25lbnQuXG4gICAgICAgIGlmICghYW5hbHl6ZWRGaWxlcy5oYXMocmVsYXRpdmVQYXRoKSkge1xuICAgICAgICAgIHJ1bGVzLmZvckVhY2gociA9PiByLnZpc2l0U3R5bGVzaGVldChzdHlsZXNoZWV0KSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gIC8vIENhbGwgdGhlIFwicG9zdEFuYWx5c2lzXCIgbWV0aG9kIGZvciBlYWNoIG1pZ3JhdGlvbiBydWxlLlxuICBydWxlcy5mb3JFYWNoKHIgPT4gci5wb3N0QW5hbHlzaXMoKSk7XG5cbiAgLy8gQ29tbWl0IGFsbCByZWNvcmRlZCB1cGRhdGVzIGluIHRoZSB1cGRhdGUgcmVjb3JkZXIuIFdlIG5lZWQgdG8gcGVyZm9ybSB0aGVcbiAgLy8gcmVwbGFjZW1lbnRzIHBlciBzb3VyY2UgZmlsZSBpbiBvcmRlciB0byBlbnN1cmUgdGhhdCBvZmZzZXRzIGluIHRoZSBUeXBlU2NyaXB0XG4gIC8vIHByb2dyYW0gYXJlIG5vdCBpbmNvcnJlY3RseSBzaGlmdGVkLlxuICB1cGRhdGVSZWNvcmRlckNhY2hlLmZvckVhY2gocmVjb3JkZXIgPT4gdHJlZS5jb21taXRVcGRhdGUocmVjb3JkZXIpKTtcblxuICAvLyBDb2xsZWN0IGFsbCBmYWlsdXJlcyByZXBvcnRlZCBieSBpbmRpdmlkdWFsIG1pZ3JhdGlvbiBydWxlcy5cbiAgY29uc3QgcnVsZUZhaWx1cmVzID1cbiAgICAgIHJ1bGVzLnJlZHVjZSgocmVzLCBydWxlKSA9PiByZXMuY29uY2F0KHJ1bGUuZmFpbHVyZXMpLCBbXSBhcyBNaWdyYXRpb25GYWlsdXJlW10pO1xuXG4gIC8vIEluIGNhc2UgdGhlcmUgYXJlIHJ1bGUgZmFpbHVyZXMsIHByaW50IHRoZXNlIHRvIHRoZSBDTEkgbG9nZ2VyIGFzIHdhcm5pbmdzLlxuICBpZiAocnVsZUZhaWx1cmVzLmxlbmd0aCkge1xuICAgIHJ1bGVGYWlsdXJlcy5mb3JFYWNoKCh7ZmlsZVBhdGgsIG1lc3NhZ2UsIHBvc2l0aW9ufSkgPT4ge1xuICAgICAgY29uc3Qgbm9ybWFsaXplZEZpbGVQYXRoID0gbm9ybWFsaXplKGdldFByb2plY3RSZWxhdGl2ZVBhdGgoZmlsZVBhdGgpKTtcbiAgICAgIGNvbnN0IGxpbmVBbmRDaGFyYWN0ZXIgPSBwb3NpdGlvbiA/IGBAJHtwb3NpdGlvbi5saW5lICsgMX06JHtwb3NpdGlvbi5jaGFyYWN0ZXIgKyAxfWAgOiAnJztcbiAgICAgIGxvZ2dlci53YXJuKGAke25vcm1hbGl6ZWRGaWxlUGF0aH0ke2xpbmVBbmRDaGFyYWN0ZXJ9IC0gJHttZXNzYWdlfWApO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBoYXNGYWlsdXJlczogISFydWxlRmFpbHVyZXMubGVuZ3RoLFxuICB9O1xuXG4gIGZ1bmN0aW9uIGdldFVwZGF0ZVJlY29yZGVyKGZpbGVQYXRoOiBzdHJpbmcpOiBVcGRhdGVSZWNvcmRlciB7XG4gICAgY29uc3QgdHJlZUZpbGVQYXRoID0gZ2V0UHJvamVjdFJlbGF0aXZlUGF0aChmaWxlUGF0aCk7XG4gICAgaWYgKHVwZGF0ZVJlY29yZGVyQ2FjaGUuaGFzKHRyZWVGaWxlUGF0aCkpIHtcbiAgICAgIHJldHVybiB1cGRhdGVSZWNvcmRlckNhY2hlLmdldCh0cmVlRmlsZVBhdGgpITtcbiAgICB9XG4gICAgY29uc3QgdHJlZVJlY29yZGVyID0gdHJlZS5iZWdpblVwZGF0ZSh0cmVlRmlsZVBhdGgpO1xuICAgIHVwZGF0ZVJlY29yZGVyQ2FjaGUuc2V0KHRyZWVGaWxlUGF0aCwgdHJlZVJlY29yZGVyKTtcbiAgICByZXR1cm4gdHJlZVJlY29yZGVyO1xuICB9XG5cbiAgZnVuY3Rpb24gX3Zpc2l0VHlwZVNjcmlwdE5vZGUobm9kZTogdHMuTm9kZSkge1xuICAgIHJ1bGVzLmZvckVhY2gociA9PiByLnZpc2l0Tm9kZShub2RlKSk7XG4gICAgdHMuZm9yRWFjaENoaWxkKG5vZGUsIF92aXNpdFR5cGVTY3JpcHROb2RlKTtcbiAgICByZXNvdXJjZUNvbGxlY3Rvci52aXNpdE5vZGUobm9kZSk7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgc3BlY2lmaWVkIHBhdGggcmVsYXRpdmUgdG8gdGhlIHByb2plY3Qgcm9vdCBpbiBQT1NJWCBmb3JtYXQuICovXG4gIGZ1bmN0aW9uIGdldFByb2plY3RSZWxhdGl2ZVBhdGgoZmlsZVBhdGg6IHN0cmluZykge1xuICAgIHJldHVybiByZWxhdGl2ZShiYXNlUGF0aCwgZmlsZVBhdGgpLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcbiAgfVxufVxuIl19