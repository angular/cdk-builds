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
            const relativePath = getProjectRelativePath(filePath);
            // do not visit stylesheets which have been referenced from a component.
            if (!analyzedFiles.has(relativePath)) {
                rules.forEach(r => r.visitStylesheet(stylesheet));
            }
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
                const normalizedFilePath = core_1.normalize(getProjectRelativePath(filePath));
                const lineAndCharacter = `${position.line + 1}:${position.character + 1}`;
                logger.warn(`${normalizedFilePath}@${lineAndCharacter} - ${message}`);
            });
        }
        return !!ruleFailures.length;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXBkYXRlLXRvb2wvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCwrQ0FBd0Q7SUFFeEQsK0JBQXNDO0lBQ3RDLCtCQUF1QztJQUN2QyxpQ0FBaUM7SUFFakMsbUhBQTBFO0lBRzFFLDZGQUF5RDtJQUl6RCxTQUFnQixpQkFBaUIsQ0FDN0IsSUFBVSxFQUFFLE1BQXlCLEVBQUUsWUFBb0IsRUFBRSxhQUE0QixFQUN6RixTQUEwQyxFQUFFLFdBQWMsRUFDMUQsYUFBMEI7UUFDNUIsbUVBQW1FO1FBQ25FLDRCQUE0QjtRQUM1QixNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDL0IsTUFBTSxNQUFNLEdBQUcsa0NBQWlCLENBQUMsWUFBWSxFQUFFLGNBQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXpELDZFQUE2RTtRQUM3RSxxRUFBcUU7UUFDckUsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsRUFBRTtZQUN6QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDM0QsbUZBQW1GO1lBQ25GLHFGQUFxRjtZQUNyRixPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUN2RSxDQUFDLENBQUM7UUFFRixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFD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QUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzFELENBQUM7SUFDSCxDQUFDO0lBM0hELDhDQTJIQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2xvZ2dpbmcsIG5vcm1hbGl6ZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtUcmVlLCBVcGRhdGVSZWNvcmRlcn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtzeW5jIGFzIGdsb2JTeW5jfSBmcm9tICdnbG9iJztcbmltcG9ydCB7ZGlybmFtZSwgcmVsYXRpdmV9IGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Q29tcG9uZW50UmVzb3VyY2VDb2xsZWN0b3J9IGZyb20gJy4vY29tcG9uZW50LXJlc291cmNlLWNvbGxlY3Rvcic7XG5pbXBvcnQge01pZ3JhdGlvbkZhaWx1cmUsIE1pZ3JhdGlvblJ1bGV9IGZyb20gJy4vbWlncmF0aW9uLXJ1bGUnO1xuaW1wb3J0IHtUYXJnZXRWZXJzaW9ufSBmcm9tICcuL3RhcmdldC12ZXJzaW9uJztcbmltcG9ydCB7cGFyc2VUc2NvbmZpZ0ZpbGV9IGZyb20gJy4vdXRpbHMvcGFyc2UtdHNjb25maWcnO1xuXG5leHBvcnQgdHlwZSBDb25zdHJ1Y3RvcjxUPiA9IG5ldyAoLi4uYXJnczogYW55W10pID0+IFQ7XG5cbmV4cG9ydCBmdW5jdGlvbiBydW5NaWdyYXRpb25SdWxlczxUPihcbiAgICB0cmVlOiBUcmVlLCBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpLCB0c2NvbmZpZ1BhdGg6IHN0cmluZywgdGFyZ2V0VmVyc2lvbjogVGFyZ2V0VmVyc2lvbixcbiAgICBydWxlVHlwZXM6IENvbnN0cnVjdG9yPE1pZ3JhdGlvblJ1bGU8VD4+W10sIHVwZ3JhZGVEYXRhOiBULFxuICAgIGFuYWx5emVkRmlsZXM6IFNldDxzdHJpbmc+KTogYm9vbGVhbiB7XG4gIC8vIFRoZSBDTEkgdXNlcyB0aGUgd29ya2luZyBkaXJlY3RvcnkgYXMgdGhlIGJhc2UgZGlyZWN0b3J5IGZvciB0aGVcbiAgLy8gdmlydHVhbCBmaWxlIHN5c3RlbSB0cmVlLlxuICBjb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuY3dkKCk7XG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlVHNjb25maWdGaWxlKHRzY29uZmlnUGF0aCwgZGlybmFtZSh0c2NvbmZpZ1BhdGgpKTtcbiAgY29uc3QgaG9zdCA9IHRzLmNyZWF0ZUNvbXBpbGVySG9zdChwYXJzZWQub3B0aW9ucywgdHJ1ZSk7XG5cbiAgLy8gV2UgbmVlZCB0byBvdmVyd3JpdGUgdGhlIGhvc3QgXCJyZWFkRmlsZVwiIG1ldGhvZCwgYXMgd2Ugd2FudCB0aGUgVHlwZVNjcmlwdFxuICAvLyBwcm9ncmFtIHRvIGJlIGJhc2VkIG9uIHRoZSBmaWxlIGNvbnRlbnRzIGluIHRoZSB2aXJ0dWFsIGZpbGUgdHJlZS5cbiAgaG9zdC5yZWFkRmlsZSA9IGZpbGVOYW1lID0+IHtcbiAgICBjb25zdCBidWZmZXIgPSB0cmVlLnJlYWQoZ2V0UHJvamVjdFJlbGF0aXZlUGF0aChmaWxlTmFtZSkpO1xuICAgIC8vIFN0cmlwIEJPTSBhcyBvdGhlcndpc2UgVFNDIG1ldGhvZHMgKGUuZy4gXCJnZXRXaWR0aFwiKSB3aWxsIHJldHVybiBhbiBvZmZzZXQgd2hpY2hcbiAgICAvLyB3aGljaCBicmVha3MgdGhlIENMSSBVcGRhdGVSZWNvcmRlci4gaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9wdWxsLzMwNzE5XG4gICAgcmV0dXJuIGJ1ZmZlciA/IGJ1ZmZlci50b1N0cmluZygpLnJlcGxhY2UoL15cXHVGRUZGLywgJycpIDogdW5kZWZpbmVkO1xuICB9O1xuXG4gIGNvbnN0IHByb2dyYW0gPSB0cy5jcmVhdGVQcm9ncmFtKHBhcnNlZC5maWxlTmFtZXMsIHBhcnNlZC5vcHRpb25zLCBob3N0KTtcbiAgY29uc3QgdHlwZUNoZWNrZXIgPSBwcm9ncmFtLmdldFR5cGVDaGVja2VyKCk7XG4gIGNvbnN0IHJ1bGVzOiBNaWdyYXRpb25SdWxlPFQ+W10gPSBbXTtcblxuICAvLyBDcmVhdGUgaW5zdGFuY2VzIG9mIGFsbCBzcGVjaWZpZWQgbWlncmF0aW9uIHJ1bGVzLlxuICBmb3IgKGNvbnN0IHJ1bGVDdG9yIG9mIHJ1bGVUeXBlcykge1xuICAgIGNvbnN0IHJ1bGUgPSBuZXcgcnVsZUN0b3IocHJvZ3JhbSwgdHlwZUNoZWNrZXIsIHRhcmdldFZlcnNpb24sIHVwZ3JhZGVEYXRhKTtcbiAgICBydWxlLmdldFVwZGF0ZVJlY29yZGVyID0gZ2V0VXBkYXRlUmVjb3JkZXI7XG4gICAgcnVsZS5pbml0KCk7XG4gICAgaWYgKHJ1bGUucnVsZUVuYWJsZWQpIHtcbiAgICAgIHJ1bGVzLnB1c2gocnVsZSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgc291cmNlRmlsZXMgPSBwcm9ncmFtLmdldFNvdXJjZUZpbGVzKCkuZmlsdGVyKFxuICAgICAgZiA9PiAhZi5pc0RlY2xhcmF0aW9uRmlsZSAmJiAhcHJvZ3JhbS5pc1NvdXJjZUZpbGVGcm9tRXh0ZXJuYWxMaWJyYXJ5KGYpKTtcbiAgY29uc3QgcmVzb3VyY2VDb2xsZWN0b3IgPSBuZXcgQ29tcG9uZW50UmVzb3VyY2VDb2xsZWN0b3IodHlwZUNoZWNrZXIpO1xuICBjb25zdCB1cGRhdGVSZWNvcmRlckNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIFVwZGF0ZVJlY29yZGVyPigpO1xuXG4gIHNvdXJjZUZpbGVzLmZvckVhY2goc291cmNlRmlsZSA9PiB7XG4gICAgY29uc3QgcmVsYXRpdmVQYXRoID0gZ2V0UHJvamVjdFJlbGF0aXZlUGF0aChzb3VyY2VGaWxlLmZpbGVOYW1lKTtcbiAgICAvLyBEbyBub3QgdmlzaXQgc291cmNlIGZpbGVzIHdoaWNoIGhhdmUgYmVlbiBjaGVja2VkIGFzIHBhcnQgb2YgYVxuICAgIC8vIHByZXZpb3VzbHkgbWlncmF0ZWQgVHlwZVNjcmlwdCBwcm9qZWN0LlxuICAgIGlmICghYW5hbHl6ZWRGaWxlcy5oYXMocmVsYXRpdmVQYXRoKSkge1xuICAgICAgX3Zpc2l0VHlwZVNjcmlwdE5vZGUoc291cmNlRmlsZSk7XG4gICAgICBhbmFseXplZEZpbGVzLmFkZChyZWxhdGl2ZVBhdGgpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmVzb3VyY2VDb2xsZWN0b3IucmVzb2x2ZWRUZW1wbGF0ZXMuZm9yRWFjaCh0ZW1wbGF0ZSA9PiB7XG4gICAgY29uc3QgcmVsYXRpdmVQYXRoID0gZ2V0UHJvamVjdFJlbGF0aXZlUGF0aCh0ZW1wbGF0ZS5maWxlUGF0aCk7XG4gICAgLy8gRG8gbm90IHZpc2l0IHRoZSB0ZW1wbGF0ZSBpZiBpdCBoYXMgYmVlbiBjaGVja2VkIGJlZm9yZS4gSW5saW5lXG4gICAgLy8gdGVtcGxhdGVzIGNhbm5vdCBiZSByZWZlcmVuY2VkIG11bHRpcGxlIHRpbWVzLlxuICAgIGlmICh0ZW1wbGF0ZS5pbmxpbmUgfHwgIWFuYWx5emVkRmlsZXMuaGFzKHJlbGF0aXZlUGF0aCkpIHtcbiAgICAgIHJ1bGVzLmZvckVhY2gociA9PiByLnZpc2l0VGVtcGxhdGUodGVtcGxhdGUpKTtcbiAgICAgIGFuYWx5emVkRmlsZXMuYWRkKHJlbGF0aXZlUGF0aCk7XG4gICAgfVxuICB9KTtcblxuICByZXNvdXJjZUNvbGxlY3Rvci5yZXNvbHZlZFN0eWxlc2hlZXRzLmZvckVhY2goc3R5bGVzaGVldCA9PiB7XG4gICAgY29uc3QgcmVsYXRpdmVQYXRoID0gZ2V0UHJvamVjdFJlbGF0aXZlUGF0aChzdHlsZXNoZWV0LmZpbGVQYXRoKTtcbiAgICAvLyBEbyBub3QgdmlzaXQgdGhlIHN0eWxlc2hlZXQgaWYgaXQgaGFzIGJlZW4gY2hlY2tlZCBiZWZvcmUuIElubGluZVxuICAgIC8vIHN0eWxlc2hlZXRzIGNhbm5vdCBiZSByZWZlcmVuY2VkIG11bHRpcGxlIHRpbWVzLlxuICAgIGlmIChzdHlsZXNoZWV0LmlubGluZSB8fCAhYW5hbHl6ZWRGaWxlcy5oYXMocmVsYXRpdmVQYXRoKSkge1xuICAgICAgcnVsZXMuZm9yRWFjaChyID0+IHIudmlzaXRTdHlsZXNoZWV0KHN0eWxlc2hlZXQpKTtcbiAgICAgIGFuYWx5emVkRmlsZXMuYWRkKHJlbGF0aXZlUGF0aCk7XG4gICAgfVxuICB9KTtcblxuICAvLyBJbiBzb21lIGFwcGxpY2F0aW9ucywgZGV2ZWxvcGVycyB3aWxsIGhhdmUgZ2xvYmFsIHN0eWxlc2hlZXRzIHdoaWNoIGFyZSBub3Qgc3BlY2lmaWVkIGluIGFueVxuICAvLyBBbmd1bGFyIGNvbXBvbmVudC4gVGhlcmVmb3JlIHdlIGdsb2IgdXAgYWxsIENTUyBhbmQgU0NTUyBmaWxlcyBvdXRzaWRlIG9mIG5vZGVfbW9kdWxlcyBhbmRcbiAgLy8gZGlzdC4gVGhlIGZpbGVzIHdpbGwgYmUgcmVhZCBieSB0aGUgaW5kaXZpZHVhbCBzdHlsZXNoZWV0IHJ1bGVzIGFuZCBjaGVja2VkLlxuICAvLyBUT0RPKGRldnZlcnNpb24pOiBkb3VibGUtY2hlY2sgaWYgd2UgY2FuIHNvbHZlIHRoaXMgaW4gYSBtb3JlIGVsZWdhbnQgd2F5LlxuICBnbG9iU3luYygnIShub2RlX21vZHVsZXN8ZGlzdCkvKiovKi4rKGNzc3xzY3NzKScsIHthYnNvbHV0ZTogdHJ1ZSwgY3dkOiBiYXNlUGF0aH0pXG4gICAgICAuZmlsdGVyKGZpbGVQYXRoID0+ICFyZXNvdXJjZUNvbGxlY3Rvci5yZXNvbHZlZFN0eWxlc2hlZXRzLnNvbWUocyA9PiBzLmZpbGVQYXRoID09PSBmaWxlUGF0aCkpXG4gICAgICAuZm9yRWFjaChmaWxlUGF0aCA9PiB7XG4gICAgICAgIGNvbnN0IHN0eWxlc2hlZXQgPSByZXNvdXJjZUNvbGxlY3Rvci5yZXNvbHZlRXh0ZXJuYWxTdHlsZXNoZWV0KGZpbGVQYXRoLCBudWxsKTtcbiAgICAgICAgY29uc3QgcmVsYXRpdmVQYXRoID0gZ2V0UHJvamVjdFJlbGF0aXZlUGF0aChmaWxlUGF0aCk7XG4gICAgICAgIC8vIGRvIG5vdCB2aXNpdCBzdHlsZXNoZWV0cyB3aGljaCBoYXZlIGJlZW4gcmVmZXJlbmNlZCBmcm9tIGEgY29tcG9uZW50LlxuICAgICAgICBpZiAoIWFuYWx5emVkRmlsZXMuaGFzKHJlbGF0aXZlUGF0aCkpIHtcbiAgICAgICAgICBydWxlcy5mb3JFYWNoKHIgPT4gci52aXNpdFN0eWxlc2hlZXQoc3R5bGVzaGVldCkpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAvLyBDb21taXQgYWxsIHJlY29yZGVkIHVwZGF0ZXMgaW4gdGhlIHVwZGF0ZSByZWNvcmRlci4gV2UgbmVlZCB0byBwZXJmb3JtIHRoZVxuICAvLyByZXBsYWNlbWVudHMgcGVyIHNvdXJjZSBmaWxlIGluIG9yZGVyIHRvIGVuc3VyZSB0aGF0IG9mZnNldHMgaW4gdGhlIFR5cGVTY3JpcHRcbiAgLy8gcHJvZ3JhbSBhcmUgbm90IGluY29ycmVjdGx5IHNoaWZ0ZWQuXG4gIHVwZGF0ZVJlY29yZGVyQ2FjaGUuZm9yRWFjaChyZWNvcmRlciA9PiB0cmVlLmNvbW1pdFVwZGF0ZShyZWNvcmRlcikpO1xuXG4gIC8vIENvbGxlY3QgYWxsIGZhaWx1cmVzIHJlcG9ydGVkIGJ5IGluZGl2aWR1YWwgbWlncmF0aW9uIHJ1bGVzLlxuICBjb25zdCBydWxlRmFpbHVyZXMgPVxuICAgICAgcnVsZXMucmVkdWNlKChyZXMsIHJ1bGUpID0+IHJlcy5jb25jYXQocnVsZS5mYWlsdXJlcyksIFtdIGFzIE1pZ3JhdGlvbkZhaWx1cmVbXSk7XG5cbiAgLy8gSW4gY2FzZSB0aGVyZSBhcmUgcnVsZSBmYWlsdXJlcywgcHJpbnQgdGhlc2UgdG8gdGhlIENMSSBsb2dnZXIgYXMgd2FybmluZ3MuXG4gIGlmIChydWxlRmFpbHVyZXMubGVuZ3RoKSB7XG4gICAgcnVsZUZhaWx1cmVzLmZvckVhY2goKHtmaWxlUGF0aCwgbWVzc2FnZSwgcG9zaXRpb259KSA9PiB7XG4gICAgICBjb25zdCBub3JtYWxpemVkRmlsZVBhdGggPSBub3JtYWxpemUoZ2V0UHJvamVjdFJlbGF0aXZlUGF0aChmaWxlUGF0aCkpO1xuICAgICAgY29uc3QgbGluZUFuZENoYXJhY3RlciA9IGAke3Bvc2l0aW9uLmxpbmUgKyAxfToke3Bvc2l0aW9uLmNoYXJhY3RlciArIDF9YDtcbiAgICAgIGxvZ2dlci53YXJuKGAke25vcm1hbGl6ZWRGaWxlUGF0aH1AJHtsaW5lQW5kQ2hhcmFjdGVyfSAtICR7bWVzc2FnZX1gKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiAhIXJ1bGVGYWlsdXJlcy5sZW5ndGg7XG5cbiAgZnVuY3Rpb24gZ2V0VXBkYXRlUmVjb3JkZXIoZmlsZVBhdGg6IHN0cmluZyk6IFVwZGF0ZVJlY29yZGVyIHtcbiAgICBjb25zdCB0cmVlRmlsZVBhdGggPSBnZXRQcm9qZWN0UmVsYXRpdmVQYXRoKGZpbGVQYXRoKTtcbiAgICBpZiAodXBkYXRlUmVjb3JkZXJDYWNoZS5oYXModHJlZUZpbGVQYXRoKSkge1xuICAgICAgcmV0dXJuIHVwZGF0ZVJlY29yZGVyQ2FjaGUuZ2V0KHRyZWVGaWxlUGF0aCkhO1xuICAgIH1cbiAgICBjb25zdCB0cmVlUmVjb3JkZXIgPSB0cmVlLmJlZ2luVXBkYXRlKHRyZWVGaWxlUGF0aCk7XG4gICAgdXBkYXRlUmVjb3JkZXJDYWNoZS5zZXQodHJlZUZpbGVQYXRoLCB0cmVlUmVjb3JkZXIpO1xuICAgIHJldHVybiB0cmVlUmVjb3JkZXI7XG4gIH1cblxuICBmdW5jdGlvbiBfdmlzaXRUeXBlU2NyaXB0Tm9kZShub2RlOiB0cy5Ob2RlKSB7XG4gICAgcnVsZXMuZm9yRWFjaChyID0+IHIudmlzaXROb2RlKG5vZGUpKTtcbiAgICB0cy5mb3JFYWNoQ2hpbGQobm9kZSwgX3Zpc2l0VHlwZVNjcmlwdE5vZGUpO1xuICAgIHJlc291cmNlQ29sbGVjdG9yLnZpc2l0Tm9kZShub2RlKTtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBzcGVjaWZpZWQgcGF0aCByZWxhdGl2ZSB0byB0aGUgcHJvamVjdCByb290IGluIFBPU0lYIGZvcm1hdC4gKi9cbiAgZnVuY3Rpb24gZ2V0UHJvamVjdFJlbGF0aXZlUGF0aChmaWxlUGF0aDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHJlbGF0aXZlKGJhc2VQYXRoLCBmaWxlUGF0aCkucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuICB9XG59XG4iXX0=