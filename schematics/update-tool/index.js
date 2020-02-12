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
    function runMigrationRules(project, tree, logger, tsconfigPath, isTestTarget, targetVersion, ruleTypes, upgradeData, analyzedFiles) {
        // The CLI uses the working directory as the base directory for the
        // virtual file system tree.
        const basePath = process.cwd();
        const parsed = parse_tsconfig_1.parseTsconfigFile(tsconfigPath, path_1.dirname(tsconfigPath));
        const host = ts.createCompilerHost(parsed.options, true);
        const projectFsPath = path_1.join(basePath, project.root);
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
        // TODO: rework this to collect external/global stylesheets from the workspace config. COMP-280.
        glob_1.sync('!(node_modules|dist)/**/*.+(css|scss)', { absolute: true, cwd: projectFsPath, nodir: true })
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXBkYXRlLXRvb2wvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCwrQ0FBd0Q7SUFHeEQsK0JBQXNDO0lBQ3RDLCtCQUE2QztJQUM3QyxpQ0FBaUM7SUFFakMsbUhBQTBFO0lBRzFFLDZGQUF5RDtJQU96RCxTQUFnQixpQkFBaUIsQ0FDN0IsT0FBeUIsRUFBRSxJQUFVLEVBQUUsTUFBeUIsRUFBRSxZQUFvQixFQUN0RixZQUFxQixFQUFFLGFBQTRCLEVBQUUsU0FBaUMsRUFDdEYsV0FBYyxFQUFFLGFBQTBCO1FBQzVDLG1FQUFtRTtRQUNuRSw0QkFBNEI7UUFDNUIsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQy9CLE1BQU0sTUFBTSxHQUFHLGtDQUFpQixDQUFDLFlBQVksRUFBRSxjQUFPLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztRQUN0RSxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6RCxNQUFNLGFBQWEsR0FBRyxXQUFJLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVuRCw2RUFBNkU7UUFDN0UscUVBQXFFO1FBQ3JFLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLEVBQUU7WUFDekIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzNELG1GQUFtRjtZQUNuRixxRkFBcUY7WUFDckYsT0FBTyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEVB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LE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN0QyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1lBQzVDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRUQsNEVBQTRFO1FBQzVFLFNBQVMsc0JBQXNCLENBQUMsUUFBZ0I7WUFDOUMsT0FBTyxlQUFRLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDMUQsQ0FBQztJQUNILENBQUM7SUFuSUQsOENBbUlDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7bG9nZ2luZywgbm9ybWFsaXplfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQge1RyZWUsIFVwZGF0ZVJlY29yZGVyfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge1dvcmtzcGFjZVByb2plY3R9IGZyb20gJ0BzY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eS93b3Jrc3BhY2UtbW9kZWxzJztcbmltcG9ydCB7c3luYyBhcyBnbG9iU3luY30gZnJvbSAnZ2xvYic7XG5pbXBvcnQge2Rpcm5hbWUsIGpvaW4sIHJlbGF0aXZlfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge0NvbXBvbmVudFJlc291cmNlQ29sbGVjdG9yfSBmcm9tICcuL2NvbXBvbmVudC1yZXNvdXJjZS1jb2xsZWN0b3InO1xuaW1wb3J0IHtNaWdyYXRpb25GYWlsdXJlLCBNaWdyYXRpb25SdWxlfSBmcm9tICcuL21pZ3JhdGlvbi1ydWxlJztcbmltcG9ydCB7VGFyZ2V0VmVyc2lvbn0gZnJvbSAnLi90YXJnZXQtdmVyc2lvbic7XG5pbXBvcnQge3BhcnNlVHNjb25maWdGaWxlfSBmcm9tICcuL3V0aWxzL3BhcnNlLXRzY29uZmlnJztcblxuZXhwb3J0IHR5cGUgQ29uc3RydWN0b3I8VD4gPSAobmV3ICguLi5hcmdzOiBhbnlbXSkgPT4gVCk7XG5leHBvcnQgdHlwZSBNaWdyYXRpb25SdWxlVHlwZTxUPiA9XG4gICAgQ29uc3RydWN0b3I8TWlncmF0aW9uUnVsZTxUPj4me1ttIGluIGtleW9mIHR5cGVvZiBNaWdyYXRpb25SdWxlXTogKHR5cGVvZiBNaWdyYXRpb25SdWxlKVttXX07XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHJ1bk1pZ3JhdGlvblJ1bGVzPFQ+KFxuICAgIHByb2plY3Q6IFdvcmtzcGFjZVByb2plY3QsIHRyZWU6IFRyZWUsIGxvZ2dlcjogbG9nZ2luZy5Mb2dnZXJBcGksIHRzY29uZmlnUGF0aDogc3RyaW5nLFxuICAgIGlzVGVzdFRhcmdldDogYm9vbGVhbiwgdGFyZ2V0VmVyc2lvbjogVGFyZ2V0VmVyc2lvbiwgcnVsZVR5cGVzOiBNaWdyYXRpb25SdWxlVHlwZTxUPltdLFxuICAgIHVwZ3JhZGVEYXRhOiBULCBhbmFseXplZEZpbGVzOiBTZXQ8c3RyaW5nPik6IHtoYXNGYWlsdXJlczogYm9vbGVhbn0ge1xuICAvLyBUaGUgQ0xJIHVzZXMgdGhlIHdvcmtpbmcgZGlyZWN0b3J5IGFzIHRoZSBiYXNlIGRpcmVjdG9yeSBmb3IgdGhlXG4gIC8vIHZpcnR1YWwgZmlsZSBzeXN0ZW0gdHJlZS5cbiAgY29uc3QgYmFzZVBhdGggPSBwcm9jZXNzLmN3ZCgpO1xuICBjb25zdCBwYXJzZWQgPSBwYXJzZVRzY29uZmlnRmlsZSh0c2NvbmZpZ1BhdGgsIGRpcm5hbWUodHNjb25maWdQYXRoKSk7XG4gIGNvbnN0IGhvc3QgPSB0cy5jcmVhdGVDb21waWxlckhvc3QocGFyc2VkLm9wdGlvbnMsIHRydWUpO1xuICBjb25zdCBwcm9qZWN0RnNQYXRoID0gam9pbihiYXNlUGF0aCwgcHJvamVjdC5yb290KTtcblxuICAvLyBXZSBuZWVkIHRvIG92ZXJ3cml0ZSB0aGUgaG9zdCBcInJlYWRGaWxlXCIgbWV0aG9kLCBhcyB3ZSB3YW50IHRoZSBUeXBlU2NyaXB0XG4gIC8vIHByb2dyYW0gdG8gYmUgYmFzZWQgb24gdGhlIGZpbGUgY29udGVudHMgaW4gdGhlIHZpcnR1YWwgZmlsZSB0cmVlLlxuICBob3N0LnJlYWRGaWxlID0gZmlsZU5hbWUgPT4ge1xuICAgIGNvbnN0IGJ1ZmZlciA9IHRyZWUucmVhZChnZXRQcm9qZWN0UmVsYXRpdmVQYXRoKGZpbGVOYW1lKSk7XG4gICAgLy8gU3RyaXAgQk9NIGFzIG90aGVyd2lzZSBUU0MgbWV0aG9kcyAoZS5nLiBcImdldFdpZHRoXCIpIHdpbGwgcmV0dXJuIGFuIG9mZnNldCB3aGljaFxuICAgIC8vIHdoaWNoIGJyZWFrcyB0aGUgQ0xJIFVwZGF0ZVJlY29yZGVyLiBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL3B1bGwvMzA3MTlcbiAgICByZXR1cm4gYnVmZmVyID8gYnVmZmVyLnRvU3RyaW5nKCkucmVwbGFjZSgvXlxcdUZFRkYvLCAnJykgOiB1bmRlZmluZWQ7XG4gIH07XG5cbiAgY29uc3QgcHJvZ3JhbSA9IHRzLmNyZWF0ZVByb2dyYW0ocGFyc2VkLmZpbGVOYW1lcywgcGFyc2VkLm9wdGlvbnMsIGhvc3QpO1xuICBjb25zdCB0eXBlQ2hlY2tlciA9IHByb2dyYW0uZ2V0VHlwZUNoZWNrZXIoKTtcbiAgY29uc3QgcnVsZXM6IE1pZ3JhdGlvblJ1bGU8VD5bXSA9IFtdO1xuXG4gIC8vIENyZWF0ZSBpbnN0YW5jZXMgb2YgYWxsIHNwZWNpZmllZCBtaWdyYXRpb24gcnVsZXMuXG4gIGZvciAoY29uc3QgcnVsZUN0b3Igb2YgcnVsZVR5cGVzKSB7XG4gICAgY29uc3QgcnVsZSA9IG5ldyBydWxlQ3RvcihcbiAgICAgICAgcHJvZ3JhbSwgdHlwZUNoZWNrZXIsIHRhcmdldFZlcnNpb24sIHVwZ3JhZGVEYXRhLCB0cmVlLCBnZXRVcGRhdGVSZWNvcmRlciwgYmFzZVBhdGgsIGxvZ2dlcixcbiAgICAgICAgaXNUZXN0VGFyZ2V0LCB0c2NvbmZpZ1BhdGgpO1xuICAgIHJ1bGUuaW5pdCgpO1xuICAgIGlmIChydWxlLnJ1bGVFbmFibGVkKSB7XG4gICAgICBydWxlcy5wdXNoKHJ1bGUpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHNvdXJjZUZpbGVzID0gcHJvZ3JhbS5nZXRTb3VyY2VGaWxlcygpLmZpbHRlcihcbiAgICAgIGYgPT4gIWYuaXNEZWNsYXJhdGlvbkZpbGUgJiYgIXByb2dyYW0uaXNTb3VyY2VGaWxlRnJvbUV4dGVybmFsTGlicmFyeShmKSk7XG4gIGNvbnN0IHJlc291cmNlQ29sbGVjdG9yID0gbmV3IENvbXBvbmVudFJlc291cmNlQ29sbGVjdG9yKHR5cGVDaGVja2VyKTtcbiAgY29uc3QgdXBkYXRlUmVjb3JkZXJDYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBVcGRhdGVSZWNvcmRlcj4oKTtcblxuICBzb3VyY2VGaWxlcy5mb3JFYWNoKHNvdXJjZUZpbGUgPT4ge1xuICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IGdldFByb2plY3RSZWxhdGl2ZVBhdGgoc291cmNlRmlsZS5maWxlTmFtZSk7XG4gICAgLy8gRG8gbm90IHZpc2l0IHNvdXJjZSBmaWxlcyB3aGljaCBoYXZlIGJlZW4gY2hlY2tlZCBhcyBwYXJ0IG9mIGFcbiAgICAvLyBwcmV2aW91c2x5IG1pZ3JhdGVkIFR5cGVTY3JpcHQgcHJvamVjdC5cbiAgICBpZiAoIWFuYWx5emVkRmlsZXMuaGFzKHJlbGF0aXZlUGF0aCkpIHtcbiAgICAgIF92aXNpdFR5cGVTY3JpcHROb2RlKHNvdXJjZUZpbGUpO1xuICAgICAgYW5hbHl6ZWRGaWxlcy5hZGQocmVsYXRpdmVQYXRoKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJlc291cmNlQ29sbGVjdG9yLnJlc29sdmVkVGVtcGxhdGVzLmZvckVhY2godGVtcGxhdGUgPT4ge1xuICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IGdldFByb2plY3RSZWxhdGl2ZVBhdGgodGVtcGxhdGUuZmlsZVBhdGgpO1xuICAgIC8vIERvIG5vdCB2aXNpdCB0aGUgdGVtcGxhdGUgaWYgaXQgaGFzIGJlZW4gY2hlY2tlZCBiZWZvcmUuIElubGluZVxuICAgIC8vIHRlbXBsYXRlcyBjYW5ub3QgYmUgcmVmZXJlbmNlZCBtdWx0aXBsZSB0aW1lcy5cbiAgICBpZiAodGVtcGxhdGUuaW5saW5lIHx8ICFhbmFseXplZEZpbGVzLmhhcyhyZWxhdGl2ZVBhdGgpKSB7XG4gICAgICBydWxlcy5mb3JFYWNoKHIgPT4gci52aXNpdFRlbXBsYXRlKHRlbXBsYXRlKSk7XG4gICAgICBhbmFseXplZEZpbGVzLmFkZChyZWxhdGl2ZVBhdGgpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmVzb3VyY2VDb2xsZWN0b3IucmVzb2x2ZWRTdHlsZXNoZWV0cy5mb3JFYWNoKHN0eWxlc2hlZXQgPT4ge1xuICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IGdldFByb2plY3RSZWxhdGl2ZVBhdGgoc3R5bGVzaGVldC5maWxlUGF0aCk7XG4gICAgLy8gRG8gbm90IHZpc2l0IHRoZSBzdHlsZXNoZWV0IGlmIGl0IGhhcyBiZWVuIGNoZWNrZWQgYmVmb3JlLiBJbmxpbmVcbiAgICAvLyBzdHlsZXNoZWV0cyBjYW5ub3QgYmUgcmVmZXJlbmNlZCBtdWx0aXBsZSB0aW1lcy5cbiAgICBpZiAoc3R5bGVzaGVldC5pbmxpbmUgfHwgIWFuYWx5emVkRmlsZXMuaGFzKHJlbGF0aXZlUGF0aCkpIHtcbiAgICAgIHJ1bGVzLmZvckVhY2gociA9PiByLnZpc2l0U3R5bGVzaGVldChzdHlsZXNoZWV0KSk7XG4gICAgICBhbmFseXplZEZpbGVzLmFkZChyZWxhdGl2ZVBhdGgpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gSW4gc29tZSBhcHBsaWNhdGlvbnMsIGRldmVsb3BlcnMgd2lsbCBoYXZlIGdsb2JhbCBzdHlsZXNoZWV0cyB3aGljaCBhcmUgbm90IHNwZWNpZmllZCBpbiBhbnlcbiAgLy8gQW5ndWxhciBjb21wb25lbnQuIFRoZXJlZm9yZSB3ZSBnbG9iIHVwIGFsbCBDU1MgYW5kIFNDU1MgZmlsZXMgb3V0c2lkZSBvZiBub2RlX21vZHVsZXMgYW5kXG4gIC8vIGRpc3QuIFRoZSBmaWxlcyB3aWxsIGJlIHJlYWQgYnkgdGhlIGluZGl2aWR1YWwgc3R5bGVzaGVldCBydWxlcyBhbmQgY2hlY2tlZC5cbiAgLy8gVE9ETzogcmV3b3JrIHRoaXMgdG8gY29sbGVjdCBleHRlcm5hbC9nbG9iYWwgc3R5bGVzaGVldHMgZnJvbSB0aGUgd29ya3NwYWNlIGNvbmZpZy4gQ09NUC0yODAuXG4gIGdsb2JTeW5jKFxuICAgICAgJyEobm9kZV9tb2R1bGVzfGRpc3QpLyoqLyouKyhjc3N8c2NzcyknLCB7YWJzb2x1dGU6IHRydWUsIGN3ZDogcHJvamVjdEZzUGF0aCwgbm9kaXI6IHRydWV9KVxuICAgICAgLmZpbHRlcihmaWxlUGF0aCA9PiAhcmVzb3VyY2VDb2xsZWN0b3IucmVzb2x2ZWRTdHlsZXNoZWV0cy5zb21lKHMgPT4gcy5maWxlUGF0aCA9PT0gZmlsZVBhdGgpKVxuICAgICAgLmZvckVhY2goZmlsZVBhdGggPT4ge1xuICAgICAgICBjb25zdCBzdHlsZXNoZWV0ID0gcmVzb3VyY2VDb2xsZWN0b3IucmVzb2x2ZUV4dGVybmFsU3R5bGVzaGVldChmaWxlUGF0aCwgbnVsbCk7XG4gICAgICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IGdldFByb2plY3RSZWxhdGl2ZVBhdGgoZmlsZVBhdGgpO1xuICAgICAgICAvLyBkbyBub3QgdmlzaXQgc3R5bGVzaGVldHMgd2hpY2ggaGF2ZSBiZWVuIHJlZmVyZW5jZWQgZnJvbSBhIGNvbXBvbmVudC5cbiAgICAgICAgaWYgKCFhbmFseXplZEZpbGVzLmhhcyhyZWxhdGl2ZVBhdGgpKSB7XG4gICAgICAgICAgcnVsZXMuZm9yRWFjaChyID0+IHIudmlzaXRTdHlsZXNoZWV0KHN0eWxlc2hlZXQpKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgLy8gQ2FsbCB0aGUgXCJwb3N0QW5hbHlzaXNcIiBtZXRob2QgZm9yIGVhY2ggbWlncmF0aW9uIHJ1bGUuXG4gIHJ1bGVzLmZvckVhY2gociA9PiByLnBvc3RBbmFseXNpcygpKTtcblxuICAvLyBDb21taXQgYWxsIHJlY29yZGVkIHVwZGF0ZXMgaW4gdGhlIHVwZGF0ZSByZWNvcmRlci4gV2UgbmVlZCB0byBwZXJmb3JtIHRoZVxuICAvLyByZXBsYWNlbWVudHMgcGVyIHNvdXJjZSBmaWxlIGluIG9yZGVyIHRvIGVuc3VyZSB0aGF0IG9mZnNldHMgaW4gdGhlIFR5cGVTY3JpcHRcbiAgLy8gcHJvZ3JhbSBhcmUgbm90IGluY29ycmVjdGx5IHNoaWZ0ZWQuXG4gIHVwZGF0ZVJlY29yZGVyQ2FjaGUuZm9yRWFjaChyZWNvcmRlciA9PiB0cmVlLmNvbW1pdFVwZGF0ZShyZWNvcmRlcikpO1xuXG4gIC8vIENvbGxlY3QgYWxsIGZhaWx1cmVzIHJlcG9ydGVkIGJ5IGluZGl2aWR1YWwgbWlncmF0aW9uIHJ1bGVzLlxuICBjb25zdCBydWxlRmFpbHVyZXMgPVxuICAgICAgcnVsZXMucmVkdWNlKChyZXMsIHJ1bGUpID0+IHJlcy5jb25jYXQocnVsZS5mYWlsdXJlcyksIFtdIGFzIE1pZ3JhdGlvbkZhaWx1cmVbXSk7XG5cbiAgLy8gSW4gY2FzZSB0aGVyZSBhcmUgcnVsZSBmYWlsdXJlcywgcHJpbnQgdGhlc2UgdG8gdGhlIENMSSBsb2dnZXIgYXMgd2FybmluZ3MuXG4gIGlmIChydWxlRmFpbHVyZXMubGVuZ3RoKSB7XG4gICAgcnVsZUZhaWx1cmVzLmZvckVhY2goKHtmaWxlUGF0aCwgbWVzc2FnZSwgcG9zaXRpb259KSA9PiB7XG4gICAgICBjb25zdCBub3JtYWxpemVkRmlsZVBhdGggPSBub3JtYWxpemUoZ2V0UHJvamVjdFJlbGF0aXZlUGF0aChmaWxlUGF0aCkpO1xuICAgICAgY29uc3QgbGluZUFuZENoYXJhY3RlciA9IHBvc2l0aW9uID8gYEAke3Bvc2l0aW9uLmxpbmUgKyAxfToke3Bvc2l0aW9uLmNoYXJhY3RlciArIDF9YCA6ICcnO1xuICAgICAgbG9nZ2VyLndhcm4oYCR7bm9ybWFsaXplZEZpbGVQYXRofSR7bGluZUFuZENoYXJhY3Rlcn0gLSAke21lc3NhZ2V9YCk7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGhhc0ZhaWx1cmVzOiAhIXJ1bGVGYWlsdXJlcy5sZW5ndGgsXG4gIH07XG5cbiAgZnVuY3Rpb24gZ2V0VXBkYXRlUmVjb3JkZXIoZmlsZVBhdGg6IHN0cmluZyk6IFVwZGF0ZVJlY29yZGVyIHtcbiAgICBjb25zdCB0cmVlRmlsZVBhdGggPSBnZXRQcm9qZWN0UmVsYXRpdmVQYXRoKGZpbGVQYXRoKTtcbiAgICBpZiAodXBkYXRlUmVjb3JkZXJDYWNoZS5oYXModHJlZUZpbGVQYXRoKSkge1xuICAgICAgcmV0dXJuIHVwZGF0ZVJlY29yZGVyQ2FjaGUuZ2V0KHRyZWVGaWxlUGF0aCkhO1xuICAgIH1cbiAgICBjb25zdCB0cmVlUmVjb3JkZXIgPSB0cmVlLmJlZ2luVXBkYXRlKHRyZWVGaWxlUGF0aCk7XG4gICAgdXBkYXRlUmVjb3JkZXJDYWNoZS5zZXQodHJlZUZpbGVQYXRoLCB0cmVlUmVjb3JkZXIpO1xuICAgIHJldHVybiB0cmVlUmVjb3JkZXI7XG4gIH1cblxuICBmdW5jdGlvbiBfdmlzaXRUeXBlU2NyaXB0Tm9kZShub2RlOiB0cy5Ob2RlKSB7XG4gICAgcnVsZXMuZm9yRWFjaChyID0+IHIudmlzaXROb2RlKG5vZGUpKTtcbiAgICB0cy5mb3JFYWNoQ2hpbGQobm9kZSwgX3Zpc2l0VHlwZVNjcmlwdE5vZGUpO1xuICAgIHJlc291cmNlQ29sbGVjdG9yLnZpc2l0Tm9kZShub2RlKTtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBzcGVjaWZpZWQgcGF0aCByZWxhdGl2ZSB0byB0aGUgcHJvamVjdCByb290IGluIFBPU0lYIGZvcm1hdC4gKi9cbiAgZnVuY3Rpb24gZ2V0UHJvamVjdFJlbGF0aXZlUGF0aChmaWxlUGF0aDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHJlbGF0aXZlKGJhc2VQYXRoLCBmaWxlUGF0aCkucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuICB9XG59XG4iXX0=