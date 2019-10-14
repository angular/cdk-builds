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
                const lineAndCharacter = `${position.line + 1}:${position.character + 1}`;
                logger.warn(`${normalizedFilePath}@${lineAndCharacter} - ${message}`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXBkYXRlLXRvb2wvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCwrQ0FBd0Q7SUFFeEQsK0JBQXNDO0lBQ3RDLCtCQUF1QztJQUN2QyxpQ0FBaUM7SUFFakMsbUhBQTBFO0lBRzFFLDZGQUF5RDtJQU96RCxTQUFnQixpQkFBaUIsQ0FDN0IsSUFBVSxFQUFFLE1BQXlCLEVBQUUsWUFBb0IsRUFBRSxZQUFxQixFQUNsRixhQUE0QixFQUFFLFNBQWlDLEVBQUUsV0FBYyxFQUMvRSxhQUEwQjtRQUM1QixtRUFBbUU7UUFDbkUsNEJBQTRCO1FBQzVCLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUMvQixNQUFNLE1BQU0sR0FBRyxrQ0FBaUIsQ0FBQyxZQUFZLEVBQUUsY0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDdEUsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFekQsNkVBQTZFO1FBQzdFLHFFQUFxRTtRQUNyRSxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxFQUFFO1lBQ3pCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUMzRCxtRkFBbUY7WUFDbkYscUZBQXFGO1lBQ3JGLE9BQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1FBQ3ZFLENBQUMsQ0FBQztRQUVGLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FB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Q0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELDRFQUE0RTtRQUM1RSxTQUFTLHNCQUFzQixDQUFDLFFBQWdCO1lBQzlDLE9BQU8sZUFBUSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzFELENBQUM7SUFDSCxDQUFDO0lBaklELDhDQWlJQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2xvZ2dpbmcsIG5vcm1hbGl6ZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtUcmVlLCBVcGRhdGVSZWNvcmRlcn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtzeW5jIGFzIGdsb2JTeW5jfSBmcm9tICdnbG9iJztcbmltcG9ydCB7ZGlybmFtZSwgcmVsYXRpdmV9IGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Q29tcG9uZW50UmVzb3VyY2VDb2xsZWN0b3J9IGZyb20gJy4vY29tcG9uZW50LXJlc291cmNlLWNvbGxlY3Rvcic7XG5pbXBvcnQge01pZ3JhdGlvbkZhaWx1cmUsIE1pZ3JhdGlvblJ1bGV9IGZyb20gJy4vbWlncmF0aW9uLXJ1bGUnO1xuaW1wb3J0IHtUYXJnZXRWZXJzaW9ufSBmcm9tICcuL3RhcmdldC12ZXJzaW9uJztcbmltcG9ydCB7cGFyc2VUc2NvbmZpZ0ZpbGV9IGZyb20gJy4vdXRpbHMvcGFyc2UtdHNjb25maWcnO1xuXG5leHBvcnQgdHlwZSBDb25zdHJ1Y3RvcjxUPiA9IChuZXcgKC4uLmFyZ3M6IGFueVtdKSA9PiBUKTtcbmV4cG9ydCB0eXBlIE1pZ3JhdGlvblJ1bGVUeXBlPFQ+ID0gQ29uc3RydWN0b3I8TWlncmF0aW9uUnVsZTxUPj5cbiAgICAmIHtbbSBpbiBrZXlvZiB0eXBlb2YgTWlncmF0aW9uUnVsZV06ICh0eXBlb2YgTWlncmF0aW9uUnVsZSlbbV19O1xuXG5cbmV4cG9ydCBmdW5jdGlvbiBydW5NaWdyYXRpb25SdWxlczxUPihcbiAgICB0cmVlOiBUcmVlLCBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpLCB0c2NvbmZpZ1BhdGg6IHN0cmluZywgaXNUZXN0VGFyZ2V0OiBib29sZWFuLFxuICAgIHRhcmdldFZlcnNpb246IFRhcmdldFZlcnNpb24sIHJ1bGVUeXBlczogTWlncmF0aW9uUnVsZVR5cGU8VD5bXSwgdXBncmFkZURhdGE6IFQsXG4gICAgYW5hbHl6ZWRGaWxlczogU2V0PHN0cmluZz4pOiB7aGFzRmFpbHVyZXM6IGJvb2xlYW59IHtcbiAgLy8gVGhlIENMSSB1c2VzIHRoZSB3b3JraW5nIGRpcmVjdG9yeSBhcyB0aGUgYmFzZSBkaXJlY3RvcnkgZm9yIHRoZVxuICAvLyB2aXJ0dWFsIGZpbGUgc3lzdGVtIHRyZWUuXG4gIGNvbnN0IGJhc2VQYXRoID0gcHJvY2Vzcy5jd2QoKTtcbiAgY29uc3QgcGFyc2VkID0gcGFyc2VUc2NvbmZpZ0ZpbGUodHNjb25maWdQYXRoLCBkaXJuYW1lKHRzY29uZmlnUGF0aCkpO1xuICBjb25zdCBob3N0ID0gdHMuY3JlYXRlQ29tcGlsZXJIb3N0KHBhcnNlZC5vcHRpb25zLCB0cnVlKTtcblxuICAvLyBXZSBuZWVkIHRvIG92ZXJ3cml0ZSB0aGUgaG9zdCBcInJlYWRGaWxlXCIgbWV0aG9kLCBhcyB3ZSB3YW50IHRoZSBUeXBlU2NyaXB0XG4gIC8vIHByb2dyYW0gdG8gYmUgYmFzZWQgb24gdGhlIGZpbGUgY29udGVudHMgaW4gdGhlIHZpcnR1YWwgZmlsZSB0cmVlLlxuICBob3N0LnJlYWRGaWxlID0gZmlsZU5hbWUgPT4ge1xuICAgIGNvbnN0IGJ1ZmZlciA9IHRyZWUucmVhZChnZXRQcm9qZWN0UmVsYXRpdmVQYXRoKGZpbGVOYW1lKSk7XG4gICAgLy8gU3RyaXAgQk9NIGFzIG90aGVyd2lzZSBUU0MgbWV0aG9kcyAoZS5nLiBcImdldFdpZHRoXCIpIHdpbGwgcmV0dXJuIGFuIG9mZnNldCB3aGljaFxuICAgIC8vIHdoaWNoIGJyZWFrcyB0aGUgQ0xJIFVwZGF0ZVJlY29yZGVyLiBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL3B1bGwvMzA3MTlcbiAgICByZXR1cm4gYnVmZmVyID8gYnVmZmVyLnRvU3RyaW5nKCkucmVwbGFjZSgvXlxcdUZFRkYvLCAnJykgOiB1bmRlZmluZWQ7XG4gIH07XG5cbiAgY29uc3QgcHJvZ3JhbSA9IHRzLmNyZWF0ZVByb2dyYW0ocGFyc2VkLmZpbGVOYW1lcywgcGFyc2VkLm9wdGlvbnMsIGhvc3QpO1xuICBjb25zdCB0eXBlQ2hlY2tlciA9IHByb2dyYW0uZ2V0VHlwZUNoZWNrZXIoKTtcbiAgY29uc3QgcnVsZXM6IE1pZ3JhdGlvblJ1bGU8VD5bXSA9IFtdO1xuXG4gIC8vIENyZWF0ZSBpbnN0YW5jZXMgb2YgYWxsIHNwZWNpZmllZCBtaWdyYXRpb24gcnVsZXMuXG4gIGZvciAoY29uc3QgcnVsZUN0b3Igb2YgcnVsZVR5cGVzKSB7XG4gICAgY29uc3QgcnVsZSA9IG5ldyBydWxlQ3RvcihcbiAgICAgICAgcHJvZ3JhbSwgdHlwZUNoZWNrZXIsIHRhcmdldFZlcnNpb24sIHVwZ3JhZGVEYXRhLCB0cmVlLCBnZXRVcGRhdGVSZWNvcmRlciwgYmFzZVBhdGgsIGxvZ2dlcixcbiAgICAgICAgaXNUZXN0VGFyZ2V0LCB0c2NvbmZpZ1BhdGgpO1xuICAgIHJ1bGUuaW5pdCgpO1xuICAgIGlmIChydWxlLnJ1bGVFbmFibGVkKSB7XG4gICAgICBydWxlcy5wdXNoKHJ1bGUpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHNvdXJjZUZpbGVzID0gcHJvZ3JhbS5nZXRTb3VyY2VGaWxlcygpLmZpbHRlcihcbiAgICAgIGYgPT4gIWYuaXNEZWNsYXJhdGlvbkZpbGUgJiYgIXByb2dyYW0uaXNTb3VyY2VGaWxlRnJvbUV4dGVybmFsTGlicmFyeShmKSk7XG4gIGNvbnN0IHJlc291cmNlQ29sbGVjdG9yID0gbmV3IENvbXBvbmVudFJlc291cmNlQ29sbGVjdG9yKHR5cGVDaGVja2VyKTtcbiAgY29uc3QgdXBkYXRlUmVjb3JkZXJDYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBVcGRhdGVSZWNvcmRlcj4oKTtcblxuICBzb3VyY2VGaWxlcy5mb3JFYWNoKHNvdXJjZUZpbGUgPT4ge1xuICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IGdldFByb2plY3RSZWxhdGl2ZVBhdGgoc291cmNlRmlsZS5maWxlTmFtZSk7XG4gICAgLy8gRG8gbm90IHZpc2l0IHNvdXJjZSBmaWxlcyB3aGljaCBoYXZlIGJlZW4gY2hlY2tlZCBhcyBwYXJ0IG9mIGFcbiAgICAvLyBwcmV2aW91c2x5IG1pZ3JhdGVkIFR5cGVTY3JpcHQgcHJvamVjdC5cbiAgICBpZiAoIWFuYWx5emVkRmlsZXMuaGFzKHJlbGF0aXZlUGF0aCkpIHtcbiAgICAgIF92aXNpdFR5cGVTY3JpcHROb2RlKHNvdXJjZUZpbGUpO1xuICAgICAgYW5hbHl6ZWRGaWxlcy5hZGQocmVsYXRpdmVQYXRoKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJlc291cmNlQ29sbGVjdG9yLnJlc29sdmVkVGVtcGxhdGVzLmZvckVhY2godGVtcGxhdGUgPT4ge1xuICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IGdldFByb2plY3RSZWxhdGl2ZVBhdGgodGVtcGxhdGUuZmlsZVBhdGgpO1xuICAgIC8vIERvIG5vdCB2aXNpdCB0aGUgdGVtcGxhdGUgaWYgaXQgaGFzIGJlZW4gY2hlY2tlZCBiZWZvcmUuIElubGluZVxuICAgIC8vIHRlbXBsYXRlcyBjYW5ub3QgYmUgcmVmZXJlbmNlZCBtdWx0aXBsZSB0aW1lcy5cbiAgICBpZiAodGVtcGxhdGUuaW5saW5lIHx8ICFhbmFseXplZEZpbGVzLmhhcyhyZWxhdGl2ZVBhdGgpKSB7XG4gICAgICBydWxlcy5mb3JFYWNoKHIgPT4gci52aXNpdFRlbXBsYXRlKHRlbXBsYXRlKSk7XG4gICAgICBhbmFseXplZEZpbGVzLmFkZChyZWxhdGl2ZVBhdGgpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmVzb3VyY2VDb2xsZWN0b3IucmVzb2x2ZWRTdHlsZXNoZWV0cy5mb3JFYWNoKHN0eWxlc2hlZXQgPT4ge1xuICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IGdldFByb2plY3RSZWxhdGl2ZVBhdGgoc3R5bGVzaGVldC5maWxlUGF0aCk7XG4gICAgLy8gRG8gbm90IHZpc2l0IHRoZSBzdHlsZXNoZWV0IGlmIGl0IGhhcyBiZWVuIGNoZWNrZWQgYmVmb3JlLiBJbmxpbmVcbiAgICAvLyBzdHlsZXNoZWV0cyBjYW5ub3QgYmUgcmVmZXJlbmNlZCBtdWx0aXBsZSB0aW1lcy5cbiAgICBpZiAoc3R5bGVzaGVldC5pbmxpbmUgfHwgIWFuYWx5emVkRmlsZXMuaGFzKHJlbGF0aXZlUGF0aCkpIHtcbiAgICAgIHJ1bGVzLmZvckVhY2gociA9PiByLnZpc2l0U3R5bGVzaGVldChzdHlsZXNoZWV0KSk7XG4gICAgICBhbmFseXplZEZpbGVzLmFkZChyZWxhdGl2ZVBhdGgpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gSW4gc29tZSBhcHBsaWNhdGlvbnMsIGRldmVsb3BlcnMgd2lsbCBoYXZlIGdsb2JhbCBzdHlsZXNoZWV0cyB3aGljaCBhcmUgbm90IHNwZWNpZmllZCBpbiBhbnlcbiAgLy8gQW5ndWxhciBjb21wb25lbnQuIFRoZXJlZm9yZSB3ZSBnbG9iIHVwIGFsbCBDU1MgYW5kIFNDU1MgZmlsZXMgb3V0c2lkZSBvZiBub2RlX21vZHVsZXMgYW5kXG4gIC8vIGRpc3QuIFRoZSBmaWxlcyB3aWxsIGJlIHJlYWQgYnkgdGhlIGluZGl2aWR1YWwgc3R5bGVzaGVldCBydWxlcyBhbmQgY2hlY2tlZC5cbiAgLy8gVE9ETyhkZXZ2ZXJzaW9uKTogZG91YmxlLWNoZWNrIGlmIHdlIGNhbiBzb2x2ZSB0aGlzIGluIGEgbW9yZSBlbGVnYW50IHdheS5cbiAgZ2xvYlN5bmMoJyEobm9kZV9tb2R1bGVzfGRpc3QpLyoqLyouKyhjc3N8c2NzcyknLCB7YWJzb2x1dGU6IHRydWUsIGN3ZDogYmFzZVBhdGh9KVxuICAgICAgLmZpbHRlcihmaWxlUGF0aCA9PiAhcmVzb3VyY2VDb2xsZWN0b3IucmVzb2x2ZWRTdHlsZXNoZWV0cy5zb21lKHMgPT4gcy5maWxlUGF0aCA9PT0gZmlsZVBhdGgpKVxuICAgICAgLmZvckVhY2goZmlsZVBhdGggPT4ge1xuICAgICAgICBjb25zdCBzdHlsZXNoZWV0ID0gcmVzb3VyY2VDb2xsZWN0b3IucmVzb2x2ZUV4dGVybmFsU3R5bGVzaGVldChmaWxlUGF0aCwgbnVsbCk7XG4gICAgICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IGdldFByb2plY3RSZWxhdGl2ZVBhdGgoZmlsZVBhdGgpO1xuICAgICAgICAvLyBkbyBub3QgdmlzaXQgc3R5bGVzaGVldHMgd2hpY2ggaGF2ZSBiZWVuIHJlZmVyZW5jZWQgZnJvbSBhIGNvbXBvbmVudC5cbiAgICAgICAgaWYgKCFhbmFseXplZEZpbGVzLmhhcyhyZWxhdGl2ZVBhdGgpKSB7XG4gICAgICAgICAgcnVsZXMuZm9yRWFjaChyID0+IHIudmlzaXRTdHlsZXNoZWV0KHN0eWxlc2hlZXQpKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgLy8gQ2FsbCB0aGUgXCJwb3N0QW5hbHlzaXNcIiBtZXRob2QgZm9yIGVhY2ggbWlncmF0aW9uIHJ1bGUuXG4gIHJ1bGVzLmZvckVhY2gociA9PiByLnBvc3RBbmFseXNpcygpKTtcblxuICAvLyBDb21taXQgYWxsIHJlY29yZGVkIHVwZGF0ZXMgaW4gdGhlIHVwZGF0ZSByZWNvcmRlci4gV2UgbmVlZCB0byBwZXJmb3JtIHRoZVxuICAvLyByZXBsYWNlbWVudHMgcGVyIHNvdXJjZSBmaWxlIGluIG9yZGVyIHRvIGVuc3VyZSB0aGF0IG9mZnNldHMgaW4gdGhlIFR5cGVTY3JpcHRcbiAgLy8gcHJvZ3JhbSBhcmUgbm90IGluY29ycmVjdGx5IHNoaWZ0ZWQuXG4gIHVwZGF0ZVJlY29yZGVyQ2FjaGUuZm9yRWFjaChyZWNvcmRlciA9PiB0cmVlLmNvbW1pdFVwZGF0ZShyZWNvcmRlcikpO1xuXG4gIC8vIENvbGxlY3QgYWxsIGZhaWx1cmVzIHJlcG9ydGVkIGJ5IGluZGl2aWR1YWwgbWlncmF0aW9uIHJ1bGVzLlxuICBjb25zdCBydWxlRmFpbHVyZXMgPVxuICAgICAgcnVsZXMucmVkdWNlKChyZXMsIHJ1bGUpID0+IHJlcy5jb25jYXQocnVsZS5mYWlsdXJlcyksIFtdIGFzIE1pZ3JhdGlvbkZhaWx1cmVbXSk7XG5cbiAgLy8gSW4gY2FzZSB0aGVyZSBhcmUgcnVsZSBmYWlsdXJlcywgcHJpbnQgdGhlc2UgdG8gdGhlIENMSSBsb2dnZXIgYXMgd2FybmluZ3MuXG4gIGlmIChydWxlRmFpbHVyZXMubGVuZ3RoKSB7XG4gICAgcnVsZUZhaWx1cmVzLmZvckVhY2goKHtmaWxlUGF0aCwgbWVzc2FnZSwgcG9zaXRpb259KSA9PiB7XG4gICAgICBjb25zdCBub3JtYWxpemVkRmlsZVBhdGggPSBub3JtYWxpemUoZ2V0UHJvamVjdFJlbGF0aXZlUGF0aChmaWxlUGF0aCkpO1xuICAgICAgY29uc3QgbGluZUFuZENoYXJhY3RlciA9IGAke3Bvc2l0aW9uLmxpbmUgKyAxfToke3Bvc2l0aW9uLmNoYXJhY3RlciArIDF9YDtcbiAgICAgIGxvZ2dlci53YXJuKGAke25vcm1hbGl6ZWRGaWxlUGF0aH1AJHtsaW5lQW5kQ2hhcmFjdGVyfSAtICR7bWVzc2FnZX1gKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaGFzRmFpbHVyZXM6ICEhcnVsZUZhaWx1cmVzLmxlbmd0aCxcbiAgfTtcblxuICBmdW5jdGlvbiBnZXRVcGRhdGVSZWNvcmRlcihmaWxlUGF0aDogc3RyaW5nKTogVXBkYXRlUmVjb3JkZXIge1xuICAgIGNvbnN0IHRyZWVGaWxlUGF0aCA9IGdldFByb2plY3RSZWxhdGl2ZVBhdGgoZmlsZVBhdGgpO1xuICAgIGlmICh1cGRhdGVSZWNvcmRlckNhY2hlLmhhcyh0cmVlRmlsZVBhdGgpKSB7XG4gICAgICByZXR1cm4gdXBkYXRlUmVjb3JkZXJDYWNoZS5nZXQodHJlZUZpbGVQYXRoKSE7XG4gICAgfVxuICAgIGNvbnN0IHRyZWVSZWNvcmRlciA9IHRyZWUuYmVnaW5VcGRhdGUodHJlZUZpbGVQYXRoKTtcbiAgICB1cGRhdGVSZWNvcmRlckNhY2hlLnNldCh0cmVlRmlsZVBhdGgsIHRyZWVSZWNvcmRlcik7XG4gICAgcmV0dXJuIHRyZWVSZWNvcmRlcjtcbiAgfVxuXG4gIGZ1bmN0aW9uIF92aXNpdFR5cGVTY3JpcHROb2RlKG5vZGU6IHRzLk5vZGUpIHtcbiAgICBydWxlcy5mb3JFYWNoKHIgPT4gci52aXNpdE5vZGUobm9kZSkpO1xuICAgIHRzLmZvckVhY2hDaGlsZChub2RlLCBfdmlzaXRUeXBlU2NyaXB0Tm9kZSk7XG4gICAgcmVzb3VyY2VDb2xsZWN0b3IudmlzaXROb2RlKG5vZGUpO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIHNwZWNpZmllZCBwYXRoIHJlbGF0aXZlIHRvIHRoZSBwcm9qZWN0IHJvb3QgaW4gUE9TSVggZm9ybWF0LiAqL1xuICBmdW5jdGlvbiBnZXRQcm9qZWN0UmVsYXRpdmVQYXRoKGZpbGVQYXRoOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gcmVsYXRpdmUoYmFzZVBhdGgsIGZpbGVQYXRoKS5yZXBsYWNlKC9cXFxcL2csICcvJyk7XG4gIH1cbn1cbiJdfQ==