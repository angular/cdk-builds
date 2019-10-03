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
    function runMigrationRules(tree, logger, tsconfigPath, targetVersion, ruleTypes, upgradeData, analyzedFiles) {
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
            const rule = new ruleCtor(program, typeChecker, targetVersion, upgradeData);
            rule.getUpdateRecorder = getUpdateRecorder;
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
            rules.forEach(r => r.visitStylesheet(stylesheet));
        });
        // Commit all recorded updates in the update recorder. We need to perform the
        // replacements per source file in order to ensure that offsets in the TypeScript
        // program are not incorrectly shifted.
        updateRecorderCache.forEach(recorder => tree.commitUpdate(recorder));
        // Collect all failures reported by individual migration rules.
        const ruleFailures = rules.reduce((res, rule) => res.concat(rule.failures), []);
        // In case there are rule failures, print these to the CLI logger as warnings.
        if (ruleFailures.length) {
            ruleFailures.forEach(({ filePath, message, position }) => {
                const normalizedFilePath = core_1.normalize(path_1.relative(basePath, filePath));
                const lineAndCharacter = `${position.line + 1}:${position.character + 1}`;
                logger.warn(`${normalizedFilePath}@${lineAndCharacter} - ${message}`);
            });
        }
        return !!ruleFailures.length;
        function getUpdateRecorder(filePath) {
            const treeFilePath = path_1.relative(basePath, filePath);
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
        /** Gets the specified path relative to the project root. */
        function getProjectRelativePath(filePath) {
            return path_1.relative(basePath, filePath);
        }
    }
    exports.runMigrationRules = runMigrationRules;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXBkYXRlLXRvb2wvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCwrQ0FBd0Q7SUFFeEQsK0JBQXNDO0lBQ3RDLCtCQUF1QztJQUN2QyxpQ0FBaUM7SUFFakMsbUhBQTBFO0lBRzFFLDZGQUF5RDtJQUl6RCxTQUFnQixpQkFBaUIsQ0FDN0IsSUFBVSxFQUFFLE1BQXlCLEVBQUUsWUFBb0IsRUFBRSxhQUE0QixFQUN6RixTQUEwQyxFQUFFLFdBQWMsRUFDMUQsYUFBMEI7UUFDNUIsbUVBQW1FO1FBQ25FLDRCQUE0QjtRQUM1QixNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDL0IsTUFBTSxNQUFNLEdBQUcsa0NBQWlCLENBQUMsWUFBWSxFQUFFLGNBQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXpELDZFQUE2RTtRQUM3RSxxRUFBcUU7UUFDckUsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsRUFBRTtZQUN6QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDM0QsbUZBQW1GO1lBQ25GLHFGQUFxRjtZQUNyRixPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUN2RSxDQUFDLENBQUM7UUFFRixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFD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Q0FBQztnQkFDMUUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLGtCQUFrQixJQUFJLGdCQUFnQixNQUFNLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDeEUsQ0FBQyxDQUFDLENBQUM7U0FDSjtRQUVELE9BQU8sQ0FBQyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUM7UUFFN0IsU0FBUyxpQkFBaUIsQ0FBQyxRQUFnQjtZQUN6QyxNQUFNLFlBQVksR0FBRyxlQUFRLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ2xELElBQUksbUJBQW1CLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxFQUFFO2dCQUN6QyxPQUFPLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUUsQ0FBQzthQUMvQztZQUNELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDcEQsbUJBQW1CLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQztZQUNwRCxPQUFPLFlBQVksQ0FBQztRQUN0QixDQUFDO1FBRUQsU0FBUyxvQkFBb0IsQ0FBQyxJQUFhO1lBQ3pDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDdEMsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztZQUM1QyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELDREQUE0RDtRQUM1RCxTQUFTLHNCQUFzQixDQUFDLFFBQWdCO1lBQzlDLE9BQU8sZUFBUSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN0QyxDQUFDO0lBQ0gsQ0FBQztJQXZIRCw4Q0F1SEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtsb2dnaW5nLCBub3JtYWxpemV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7VHJlZSwgVXBkYXRlUmVjb3JkZXJ9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7c3luYyBhcyBnbG9iU3luY30gZnJvbSAnZ2xvYic7XG5pbXBvcnQge2Rpcm5hbWUsIHJlbGF0aXZlfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge0NvbXBvbmVudFJlc291cmNlQ29sbGVjdG9yfSBmcm9tICcuL2NvbXBvbmVudC1yZXNvdXJjZS1jb2xsZWN0b3InO1xuaW1wb3J0IHtNaWdyYXRpb25GYWlsdXJlLCBNaWdyYXRpb25SdWxlfSBmcm9tICcuL21pZ3JhdGlvbi1ydWxlJztcbmltcG9ydCB7VGFyZ2V0VmVyc2lvbn0gZnJvbSAnLi90YXJnZXQtdmVyc2lvbic7XG5pbXBvcnQge3BhcnNlVHNjb25maWdGaWxlfSBmcm9tICcuL3V0aWxzL3BhcnNlLXRzY29uZmlnJztcblxuZXhwb3J0IHR5cGUgQ29uc3RydWN0b3I8VD4gPSBuZXcgKC4uLmFyZ3M6IGFueVtdKSA9PiBUO1xuXG5leHBvcnQgZnVuY3Rpb24gcnVuTWlncmF0aW9uUnVsZXM8VD4oXG4gICAgdHJlZTogVHJlZSwgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSwgdHNjb25maWdQYXRoOiBzdHJpbmcsIHRhcmdldFZlcnNpb246IFRhcmdldFZlcnNpb24sXG4gICAgcnVsZVR5cGVzOiBDb25zdHJ1Y3RvcjxNaWdyYXRpb25SdWxlPFQ+PltdLCB1cGdyYWRlRGF0YTogVCxcbiAgICBhbmFseXplZEZpbGVzOiBTZXQ8c3RyaW5nPik6IGJvb2xlYW4ge1xuICAvLyBUaGUgQ0xJIHVzZXMgdGhlIHdvcmtpbmcgZGlyZWN0b3J5IGFzIHRoZSBiYXNlIGRpcmVjdG9yeSBmb3IgdGhlXG4gIC8vIHZpcnR1YWwgZmlsZSBzeXN0ZW0gdHJlZS5cbiAgY29uc3QgYmFzZVBhdGggPSBwcm9jZXNzLmN3ZCgpO1xuICBjb25zdCBwYXJzZWQgPSBwYXJzZVRzY29uZmlnRmlsZSh0c2NvbmZpZ1BhdGgsIGRpcm5hbWUodHNjb25maWdQYXRoKSk7XG4gIGNvbnN0IGhvc3QgPSB0cy5jcmVhdGVDb21waWxlckhvc3QocGFyc2VkLm9wdGlvbnMsIHRydWUpO1xuXG4gIC8vIFdlIG5lZWQgdG8gb3ZlcndyaXRlIHRoZSBob3N0IFwicmVhZEZpbGVcIiBtZXRob2QsIGFzIHdlIHdhbnQgdGhlIFR5cGVTY3JpcHRcbiAgLy8gcHJvZ3JhbSB0byBiZSBiYXNlZCBvbiB0aGUgZmlsZSBjb250ZW50cyBpbiB0aGUgdmlydHVhbCBmaWxlIHRyZWUuXG4gIGhvc3QucmVhZEZpbGUgPSBmaWxlTmFtZSA9PiB7XG4gICAgY29uc3QgYnVmZmVyID0gdHJlZS5yZWFkKGdldFByb2plY3RSZWxhdGl2ZVBhdGgoZmlsZU5hbWUpKTtcbiAgICAvLyBTdHJpcCBCT00gYXMgb3RoZXJ3aXNlIFRTQyBtZXRob2RzIChlLmcuIFwiZ2V0V2lkdGhcIikgd2lsbCByZXR1cm4gYW4gb2Zmc2V0IHdoaWNoXG4gICAgLy8gd2hpY2ggYnJlYWtzIHRoZSBDTEkgVXBkYXRlUmVjb3JkZXIuIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvcHVsbC8zMDcxOVxuICAgIHJldHVybiBidWZmZXIgPyBidWZmZXIudG9TdHJpbmcoKS5yZXBsYWNlKC9eXFx1RkVGRi8sICcnKSA6IHVuZGVmaW5lZDtcbiAgfTtcblxuICBjb25zdCBwcm9ncmFtID0gdHMuY3JlYXRlUHJvZ3JhbShwYXJzZWQuZmlsZU5hbWVzLCBwYXJzZWQub3B0aW9ucywgaG9zdCk7XG4gIGNvbnN0IHR5cGVDaGVja2VyID0gcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuICBjb25zdCBydWxlczogTWlncmF0aW9uUnVsZTxUPltdID0gW107XG5cbiAgLy8gQ3JlYXRlIGluc3RhbmNlcyBvZiBhbGwgc3BlY2lmaWVkIG1pZ3JhdGlvbiBydWxlcy5cbiAgZm9yIChjb25zdCBydWxlQ3RvciBvZiBydWxlVHlwZXMpIHtcbiAgICBjb25zdCBydWxlID0gbmV3IHJ1bGVDdG9yKHByb2dyYW0sIHR5cGVDaGVja2VyLCB0YXJnZXRWZXJzaW9uLCB1cGdyYWRlRGF0YSk7XG4gICAgcnVsZS5nZXRVcGRhdGVSZWNvcmRlciA9IGdldFVwZGF0ZVJlY29yZGVyO1xuICAgIHJ1bGUuaW5pdCgpO1xuICAgIGlmIChydWxlLnJ1bGVFbmFibGVkKSB7XG4gICAgICBydWxlcy5wdXNoKHJ1bGUpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHNvdXJjZUZpbGVzID0gcHJvZ3JhbS5nZXRTb3VyY2VGaWxlcygpLmZpbHRlcihcbiAgICAgIGYgPT4gIWYuaXNEZWNsYXJhdGlvbkZpbGUgJiYgIXByb2dyYW0uaXNTb3VyY2VGaWxlRnJvbUV4dGVybmFsTGlicmFyeShmKSk7XG4gIGNvbnN0IHJlc291cmNlQ29sbGVjdG9yID0gbmV3IENvbXBvbmVudFJlc291cmNlQ29sbGVjdG9yKHR5cGVDaGVja2VyKTtcbiAgY29uc3QgdXBkYXRlUmVjb3JkZXJDYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBVcGRhdGVSZWNvcmRlcj4oKTtcblxuICBzb3VyY2VGaWxlcy5mb3JFYWNoKHNvdXJjZUZpbGUgPT4ge1xuICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IGdldFByb2plY3RSZWxhdGl2ZVBhdGgoc291cmNlRmlsZS5maWxlTmFtZSk7XG4gICAgLy8gRG8gbm90IHZpc2l0IHNvdXJjZSBmaWxlcyB3aGljaCBoYXZlIGJlZW4gY2hlY2tlZCBhcyBwYXJ0IG9mIGFcbiAgICAvLyBwcmV2aW91c2x5IG1pZ3JhdGVkIFR5cGVTY3JpcHQgcHJvamVjdC5cbiAgICBpZiAoIWFuYWx5emVkRmlsZXMuaGFzKHJlbGF0aXZlUGF0aCkpIHtcbiAgICAgIF92aXNpdFR5cGVTY3JpcHROb2RlKHNvdXJjZUZpbGUpO1xuICAgICAgYW5hbHl6ZWRGaWxlcy5hZGQocmVsYXRpdmVQYXRoKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJlc291cmNlQ29sbGVjdG9yLnJlc29sdmVkVGVtcGxhdGVzLmZvckVhY2godGVtcGxhdGUgPT4ge1xuICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IGdldFByb2plY3RSZWxhdGl2ZVBhdGgodGVtcGxhdGUuZmlsZVBhdGgpO1xuICAgIC8vIERvIG5vdCB2aXNpdCB0aGUgdGVtcGxhdGUgaWYgaXQgaGFzIGJlZW4gY2hlY2tlZCBiZWZvcmUuIElubGluZVxuICAgIC8vIHRlbXBsYXRlcyBjYW5ub3QgYmUgcmVmZXJlbmNlZCBtdWx0aXBsZSB0aW1lcy5cbiAgICBpZiAodGVtcGxhdGUuaW5saW5lIHx8ICFhbmFseXplZEZpbGVzLmhhcyhyZWxhdGl2ZVBhdGgpKSB7XG4gICAgICBydWxlcy5mb3JFYWNoKHIgPT4gci52aXNpdFRlbXBsYXRlKHRlbXBsYXRlKSk7XG4gICAgICBhbmFseXplZEZpbGVzLmFkZChyZWxhdGl2ZVBhdGgpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmVzb3VyY2VDb2xsZWN0b3IucmVzb2x2ZWRTdHlsZXNoZWV0cy5mb3JFYWNoKHN0eWxlc2hlZXQgPT4ge1xuICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IGdldFByb2plY3RSZWxhdGl2ZVBhdGgoc3R5bGVzaGVldC5maWxlUGF0aCk7XG4gICAgLy8gRG8gbm90IHZpc2l0IHRoZSBzdHlsZXNoZWV0IGlmIGl0IGhhcyBiZWVuIGNoZWNrZWQgYmVmb3JlLiBJbmxpbmVcbiAgICAvLyBzdHlsZXNoZWV0cyBjYW5ub3QgYmUgcmVmZXJlbmNlZCBtdWx0aXBsZSB0aW1lcy5cbiAgICBpZiAoc3R5bGVzaGVldC5pbmxpbmUgfHwgIWFuYWx5emVkRmlsZXMuaGFzKHJlbGF0aXZlUGF0aCkpIHtcbiAgICAgIHJ1bGVzLmZvckVhY2gociA9PiByLnZpc2l0U3R5bGVzaGVldChzdHlsZXNoZWV0KSk7XG4gICAgICBhbmFseXplZEZpbGVzLmFkZChyZWxhdGl2ZVBhdGgpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gSW4gc29tZSBhcHBsaWNhdGlvbnMsIGRldmVsb3BlcnMgd2lsbCBoYXZlIGdsb2JhbCBzdHlsZXNoZWV0cyB3aGljaCBhcmUgbm90IHNwZWNpZmllZCBpbiBhbnlcbiAgLy8gQW5ndWxhciBjb21wb25lbnQuIFRoZXJlZm9yZSB3ZSBnbG9iIHVwIGFsbCBDU1MgYW5kIFNDU1MgZmlsZXMgb3V0c2lkZSBvZiBub2RlX21vZHVsZXMgYW5kXG4gIC8vIGRpc3QuIFRoZSBmaWxlcyB3aWxsIGJlIHJlYWQgYnkgdGhlIGluZGl2aWR1YWwgc3R5bGVzaGVldCBydWxlcyBhbmQgY2hlY2tlZC5cbiAgLy8gVE9ETyhkZXZ2ZXJzaW9uKTogZG91YmxlLWNoZWNrIGlmIHdlIGNhbiBzb2x2ZSB0aGlzIGluIGEgbW9yZSBlbGVnYW50IHdheS5cbiAgZ2xvYlN5bmMoJyEobm9kZV9tb2R1bGVzfGRpc3QpLyoqLyouKyhjc3N8c2NzcyknLCB7YWJzb2x1dGU6IHRydWUsIGN3ZDogYmFzZVBhdGh9KVxuICAgICAgLmZpbHRlcihmaWxlUGF0aCA9PiAhcmVzb3VyY2VDb2xsZWN0b3IucmVzb2x2ZWRTdHlsZXNoZWV0cy5zb21lKHMgPT4gcy5maWxlUGF0aCA9PT0gZmlsZVBhdGgpKVxuICAgICAgLmZvckVhY2goZmlsZVBhdGggPT4ge1xuICAgICAgICBjb25zdCBzdHlsZXNoZWV0ID0gcmVzb3VyY2VDb2xsZWN0b3IucmVzb2x2ZUV4dGVybmFsU3R5bGVzaGVldChmaWxlUGF0aCwgbnVsbCk7XG4gICAgICAgIHJ1bGVzLmZvckVhY2gociA9PiByLnZpc2l0U3R5bGVzaGVldChzdHlsZXNoZWV0KSk7XG4gICAgICB9KTtcblxuICAvLyBDb21taXQgYWxsIHJlY29yZGVkIHVwZGF0ZXMgaW4gdGhlIHVwZGF0ZSByZWNvcmRlci4gV2UgbmVlZCB0byBwZXJmb3JtIHRoZVxuICAvLyByZXBsYWNlbWVudHMgcGVyIHNvdXJjZSBmaWxlIGluIG9yZGVyIHRvIGVuc3VyZSB0aGF0IG9mZnNldHMgaW4gdGhlIFR5cGVTY3JpcHRcbiAgLy8gcHJvZ3JhbSBhcmUgbm90IGluY29ycmVjdGx5IHNoaWZ0ZWQuXG4gIHVwZGF0ZVJlY29yZGVyQ2FjaGUuZm9yRWFjaChyZWNvcmRlciA9PiB0cmVlLmNvbW1pdFVwZGF0ZShyZWNvcmRlcikpO1xuXG4gIC8vIENvbGxlY3QgYWxsIGZhaWx1cmVzIHJlcG9ydGVkIGJ5IGluZGl2aWR1YWwgbWlncmF0aW9uIHJ1bGVzLlxuICBjb25zdCBydWxlRmFpbHVyZXMgPVxuICAgICAgcnVsZXMucmVkdWNlKChyZXMsIHJ1bGUpID0+IHJlcy5jb25jYXQocnVsZS5mYWlsdXJlcyksIFtdIGFzIE1pZ3JhdGlvbkZhaWx1cmVbXSk7XG5cbiAgLy8gSW4gY2FzZSB0aGVyZSBhcmUgcnVsZSBmYWlsdXJlcywgcHJpbnQgdGhlc2UgdG8gdGhlIENMSSBsb2dnZXIgYXMgd2FybmluZ3MuXG4gIGlmIChydWxlRmFpbHVyZXMubGVuZ3RoKSB7XG4gICAgcnVsZUZhaWx1cmVzLmZvckVhY2goKHtmaWxlUGF0aCwgbWVzc2FnZSwgcG9zaXRpb259KSA9PiB7XG4gICAgICBjb25zdCBub3JtYWxpemVkRmlsZVBhdGggPSBub3JtYWxpemUocmVsYXRpdmUoYmFzZVBhdGgsIGZpbGVQYXRoKSk7XG4gICAgICBjb25zdCBsaW5lQW5kQ2hhcmFjdGVyID0gYCR7cG9zaXRpb24ubGluZSArIDF9OiR7cG9zaXRpb24uY2hhcmFjdGVyICsgMX1gO1xuICAgICAgbG9nZ2VyLndhcm4oYCR7bm9ybWFsaXplZEZpbGVQYXRofUAke2xpbmVBbmRDaGFyYWN0ZXJ9IC0gJHttZXNzYWdlfWApO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuICEhcnVsZUZhaWx1cmVzLmxlbmd0aDtcblxuICBmdW5jdGlvbiBnZXRVcGRhdGVSZWNvcmRlcihmaWxlUGF0aDogc3RyaW5nKTogVXBkYXRlUmVjb3JkZXIge1xuICAgIGNvbnN0IHRyZWVGaWxlUGF0aCA9IHJlbGF0aXZlKGJhc2VQYXRoLCBmaWxlUGF0aCk7XG4gICAgaWYgKHVwZGF0ZVJlY29yZGVyQ2FjaGUuaGFzKHRyZWVGaWxlUGF0aCkpIHtcbiAgICAgIHJldHVybiB1cGRhdGVSZWNvcmRlckNhY2hlLmdldCh0cmVlRmlsZVBhdGgpITtcbiAgICB9XG4gICAgY29uc3QgdHJlZVJlY29yZGVyID0gdHJlZS5iZWdpblVwZGF0ZSh0cmVlRmlsZVBhdGgpO1xuICAgIHVwZGF0ZVJlY29yZGVyQ2FjaGUuc2V0KHRyZWVGaWxlUGF0aCwgdHJlZVJlY29yZGVyKTtcbiAgICByZXR1cm4gdHJlZVJlY29yZGVyO1xuICB9XG5cbiAgZnVuY3Rpb24gX3Zpc2l0VHlwZVNjcmlwdE5vZGUobm9kZTogdHMuTm9kZSkge1xuICAgIHJ1bGVzLmZvckVhY2gociA9PiByLnZpc2l0Tm9kZShub2RlKSk7XG4gICAgdHMuZm9yRWFjaENoaWxkKG5vZGUsIF92aXNpdFR5cGVTY3JpcHROb2RlKTtcbiAgICByZXNvdXJjZUNvbGxlY3Rvci52aXNpdE5vZGUobm9kZSk7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgc3BlY2lmaWVkIHBhdGggcmVsYXRpdmUgdG8gdGhlIHByb2plY3Qgcm9vdC4gKi9cbiAgZnVuY3Rpb24gZ2V0UHJvamVjdFJlbGF0aXZlUGF0aChmaWxlUGF0aDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHJlbGF0aXZlKGJhc2VQYXRoLCBmaWxlUGF0aCk7XG4gIH1cbn1cbiJdfQ==