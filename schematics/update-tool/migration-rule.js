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
        define("@angular/cdk/schematics/update-tool/migration-rule", ["require", "exports", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    class MigrationRule {
        constructor(
        /** TypeScript program for the migration. */
        program, 
        /** TypeChecker instance for the analysis program. */
        typeChecker, 
        /** Version for which the migration rule should run. */
        targetVersion, 
        /** Upgrade data passed to the migration. */
        upgradeData, 
        /** Devkit tree for the current migration. Can be used to insert/remove files. */
        tree, 
        /** Gets the update recorder for a given source file or resolved template. */
        getUpdateRecorder, 
        /** Base directory of the virtual file system tree. */
        basePath, 
        /** Logger that can be used to print messages as part of the migration. */
        logger, 
        /** Whether the migration runs for a test target. */
        isTestTarget, 
        /** Path to the tsconfig that is migrated. */
        tsconfigPath) {
            this.program = program;
            this.typeChecker = typeChecker;
            this.targetVersion = targetVersion;
            this.upgradeData = upgradeData;
            this.tree = tree;
            this.getUpdateRecorder = getUpdateRecorder;
            this.basePath = basePath;
            this.logger = logger;
            this.isTestTarget = isTestTarget;
            this.tsconfigPath = tsconfigPath;
            /** List of migration failures that need to be reported. */
            this.failures = [];
            /** Whether the migration rule is enabled or not. */
            this.ruleEnabled = true;
        }
        /** Method can be used to perform global analysis of the program. */
        init() { }
        /**
         * Method that will be called once all nodes, templates and stylesheets
         * have been visited.
         */
        postAnalysis() { }
        /**
         * Method that will be called for each node in a given source file. Unlike tslint, this
         * function will only retrieve TypeScript nodes that need to be casted manually. This
         * allows us to only walk the program source files once per program and not per
         * migration rule (significant performance boost).
         */
        visitNode(node) { }
        /** Method that will be called for each Angular template in the program. */
        visitTemplate(template) { }
        /** Method that will be called for each stylesheet in the program. */
        visitStylesheet(stylesheet) { }
        /** Creates a failure with a specified message at the given node location. */
        createFailureAtNode(node, message) {
            const sourceFile = node.getSourceFile();
            this.failures.push({
                filePath: sourceFile.fileName,
                position: ts.getLineAndCharacterOfPosition(sourceFile, node.getStart()),
                message: message,
            });
        }
        /** Prints the specified message with "info" loglevel. */
        printInfo(text) {
            this.logger.info(`- ${this.tsconfigPath}: ${text}`);
        }
        /**
         * Static method that will be called once the migration of all project targets
         * has been performed. This method can be used to make changes respecting the
         * migration result of all individual targets. e.g. removing HammerJS if it
         * is not needed in any project target.
         */
        static globalPostMigration(tree, context) { }
    }
    exports.MigrationRule = MigrationRule;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9uLXJ1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXBkYXRlLXRvb2wvbWlncmF0aW9uLXJ1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFJSCxpQ0FBaUM7SUFXakMsTUFBYSxhQUFhO1FBT3hCO1FBQ0ksNENBQTRDO1FBQ3JDLE9BQW1CO1FBQzFCLHFEQUFxRDtRQUM5QyxXQUEyQjtRQUNsQyx1REFBdUQ7UUFDaEQsYUFBNEI7UUFDbkMsNENBQTRDO1FBQ3JDLFdBQWM7UUFDckIsaUZBQWlGO1FBQzFFLElBQVU7UUFDakIsNkVBQTZFO1FBQ3RFLGlCQUF1RDtRQUM5RCxzREFBc0Q7UUFDL0MsUUFBZ0I7UUFDdkIsMEVBQTBFO1FBQ25FLE1BQXlCO1FBQ2hDLG9EQUFvRDtRQUM3QyxZQUFxQjtRQUM1Qiw2Q0FBNkM7UUFDdEMsWUFBb0I7WUFsQnBCLFlBQU8sR0FBUCxPQUFPLENBQVk7WUFFbkIsZ0JBQVcsR0FBWCxXQUFXLENBQWdCO1lBRTNCLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBRTVCLGdCQUFXLEdBQVgsV0FBVyxDQUFHO1lBRWQsU0FBSSxHQUFKLElBQUksQ0FBTTtZQUVWLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBc0M7WUFFdkQsYUFBUSxHQUFSLFFBQVEsQ0FBUTtZQUVoQixXQUFNLEdBQU4sTUFBTSxDQUFtQjtZQUV6QixpQkFBWSxHQUFaLFlBQVksQ0FBUztZQUVyQixpQkFBWSxHQUFaLFlBQVksQ0FBUTtZQTFCL0IsMkRBQTJEO1lBQzNELGFBQVEsR0FBdUIsRUFBRSxDQUFDO1lBRWxDLG9EQUFvRDtZQUNwRCxnQkFBVyxHQUFHLElBQUksQ0FBQztRQXNCZSxDQUFDO1FBRW5DLG9FQUFvRTtRQUNwRSxJQUFJLEtBQVUsQ0FBQztRQUVmOzs7V0FHRztRQUNILFlBQVksS0FBVSxDQUFDO1FBRXZCOzs7OztXQUtHO1FBQ0gsU0FBUyxDQUFDLElBQWEsSUFBUyxDQUFDO1FBRWpDLDJFQUEyRTtRQUMzRSxhQUFhLENBQUMsUUFBMEIsSUFBUyxDQUFDO1FBRWxELHFFQUFxRTtRQUNyRSxlQUFlLENBQUMsVUFBNEIsSUFBUyxDQUFDO1FBRXRELDZFQUE2RTtRQUM3RSxtQkFBbUIsQ0FBQyxJQUFhLEVBQUUsT0FBZTtZQUNoRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDeEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7Z0JBQ2pCLFFBQVEsRUFBRSxVQUFVLENBQUMsUUFBUTtnQkFDN0IsUUFBUSxFQUFFLEVBQUUsQ0FBQyw2QkFBNkIsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUN2RSxPQUFPLEVBQUUsT0FBTzthQUNqQixDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQseURBQXlEO1FBQ3pELFNBQVMsQ0FBQyxJQUFZO1lBQ3BCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLFlBQVksS0FBSyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFFRDs7Ozs7V0FLRztRQUNILE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxJQUFVLEVBQUUsT0FBeUIsSUFBRyxDQUFDO0tBQ3JFO0lBMUVELHNDQTBFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2xvZ2dpbmd9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7U2NoZW1hdGljQ29udGV4dCwgVHJlZSwgVXBkYXRlUmVjb3JkZXJ9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtSZXNvbHZlZFJlc291cmNlfSBmcm9tICcuL2NvbXBvbmVudC1yZXNvdXJjZS1jb2xsZWN0b3InO1xuaW1wb3J0IHtUYXJnZXRWZXJzaW9ufSBmcm9tICcuL3RhcmdldC12ZXJzaW9uJztcbmltcG9ydCB7TGluZUFuZENoYXJhY3Rlcn0gZnJvbSAnLi91dGlscy9saW5lLW1hcHBpbmdzJztcblxuZXhwb3J0IGludGVyZmFjZSBNaWdyYXRpb25GYWlsdXJlIHtcbiAgZmlsZVBhdGg6IHN0cmluZztcbiAgbWVzc2FnZTogc3RyaW5nO1xuICBwb3NpdGlvbj86IExpbmVBbmRDaGFyYWN0ZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBNaWdyYXRpb25SdWxlPFQ+IHtcbiAgLyoqIExpc3Qgb2YgbWlncmF0aW9uIGZhaWx1cmVzIHRoYXQgbmVlZCB0byBiZSByZXBvcnRlZC4gKi9cbiAgZmFpbHVyZXM6IE1pZ3JhdGlvbkZhaWx1cmVbXSA9IFtdO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBtaWdyYXRpb24gcnVsZSBpcyBlbmFibGVkIG9yIG5vdC4gKi9cbiAgcnVsZUVuYWJsZWQgPSB0cnVlO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgLyoqIFR5cGVTY3JpcHQgcHJvZ3JhbSBmb3IgdGhlIG1pZ3JhdGlvbi4gKi9cbiAgICAgIHB1YmxpYyBwcm9ncmFtOiB0cy5Qcm9ncmFtLFxuICAgICAgLyoqIFR5cGVDaGVja2VyIGluc3RhbmNlIGZvciB0aGUgYW5hbHlzaXMgcHJvZ3JhbS4gKi9cbiAgICAgIHB1YmxpYyB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsXG4gICAgICAvKiogVmVyc2lvbiBmb3Igd2hpY2ggdGhlIG1pZ3JhdGlvbiBydWxlIHNob3VsZCBydW4uICovXG4gICAgICBwdWJsaWMgdGFyZ2V0VmVyc2lvbjogVGFyZ2V0VmVyc2lvbixcbiAgICAgIC8qKiBVcGdyYWRlIGRhdGEgcGFzc2VkIHRvIHRoZSBtaWdyYXRpb24uICovXG4gICAgICBwdWJsaWMgdXBncmFkZURhdGE6IFQsXG4gICAgICAvKiogRGV2a2l0IHRyZWUgZm9yIHRoZSBjdXJyZW50IG1pZ3JhdGlvbi4gQ2FuIGJlIHVzZWQgdG8gaW5zZXJ0L3JlbW92ZSBmaWxlcy4gKi9cbiAgICAgIHB1YmxpYyB0cmVlOiBUcmVlLFxuICAgICAgLyoqIEdldHMgdGhlIHVwZGF0ZSByZWNvcmRlciBmb3IgYSBnaXZlbiBzb3VyY2UgZmlsZSBvciByZXNvbHZlZCB0ZW1wbGF0ZS4gKi9cbiAgICAgIHB1YmxpYyBnZXRVcGRhdGVSZWNvcmRlcjogKGZpbGVQYXRoOiBzdHJpbmcpID0+IFVwZGF0ZVJlY29yZGVyLFxuICAgICAgLyoqIEJhc2UgZGlyZWN0b3J5IG9mIHRoZSB2aXJ0dWFsIGZpbGUgc3lzdGVtIHRyZWUuICovXG4gICAgICBwdWJsaWMgYmFzZVBhdGg6IHN0cmluZyxcbiAgICAgIC8qKiBMb2dnZXIgdGhhdCBjYW4gYmUgdXNlZCB0byBwcmludCBtZXNzYWdlcyBhcyBwYXJ0IG9mIHRoZSBtaWdyYXRpb24uICovXG4gICAgICBwdWJsaWMgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSxcbiAgICAgIC8qKiBXaGV0aGVyIHRoZSBtaWdyYXRpb24gcnVucyBmb3IgYSB0ZXN0IHRhcmdldC4gKi9cbiAgICAgIHB1YmxpYyBpc1Rlc3RUYXJnZXQ6IGJvb2xlYW4sXG4gICAgICAvKiogUGF0aCB0byB0aGUgdHNjb25maWcgdGhhdCBpcyBtaWdyYXRlZC4gKi9cbiAgICAgIHB1YmxpYyB0c2NvbmZpZ1BhdGg6IHN0cmluZykge31cblxuICAvKiogTWV0aG9kIGNhbiBiZSB1c2VkIHRvIHBlcmZvcm0gZ2xvYmFsIGFuYWx5c2lzIG9mIHRoZSBwcm9ncmFtLiAqL1xuICBpbml0KCk6IHZvaWQge31cblxuICAvKipcbiAgICogTWV0aG9kIHRoYXQgd2lsbCBiZSBjYWxsZWQgb25jZSBhbGwgbm9kZXMsIHRlbXBsYXRlcyBhbmQgc3R5bGVzaGVldHNcbiAgICogaGF2ZSBiZWVuIHZpc2l0ZWQuXG4gICAqL1xuICBwb3N0QW5hbHlzaXMoKTogdm9pZCB7fVxuXG4gIC8qKlxuICAgKiBNZXRob2QgdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBub2RlIGluIGEgZ2l2ZW4gc291cmNlIGZpbGUuIFVubGlrZSB0c2xpbnQsIHRoaXNcbiAgICogZnVuY3Rpb24gd2lsbCBvbmx5IHJldHJpZXZlIFR5cGVTY3JpcHQgbm9kZXMgdGhhdCBuZWVkIHRvIGJlIGNhc3RlZCBtYW51YWxseS4gVGhpc1xuICAgKiBhbGxvd3MgdXMgdG8gb25seSB3YWxrIHRoZSBwcm9ncmFtIHNvdXJjZSBmaWxlcyBvbmNlIHBlciBwcm9ncmFtIGFuZCBub3QgcGVyXG4gICAqIG1pZ3JhdGlvbiBydWxlIChzaWduaWZpY2FudCBwZXJmb3JtYW5jZSBib29zdCkuXG4gICAqL1xuICB2aXNpdE5vZGUobm9kZTogdHMuTm9kZSk6IHZvaWQge31cblxuICAvKiogTWV0aG9kIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggQW5ndWxhciB0ZW1wbGF0ZSBpbiB0aGUgcHJvZ3JhbS4gKi9cbiAgdmlzaXRUZW1wbGF0ZSh0ZW1wbGF0ZTogUmVzb2x2ZWRSZXNvdXJjZSk6IHZvaWQge31cblxuICAvKiogTWV0aG9kIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggc3R5bGVzaGVldCBpbiB0aGUgcHJvZ3JhbS4gKi9cbiAgdmlzaXRTdHlsZXNoZWV0KHN0eWxlc2hlZXQ6IFJlc29sdmVkUmVzb3VyY2UpOiB2b2lkIHt9XG5cbiAgLyoqIENyZWF0ZXMgYSBmYWlsdXJlIHdpdGggYSBzcGVjaWZpZWQgbWVzc2FnZSBhdCB0aGUgZ2l2ZW4gbm9kZSBsb2NhdGlvbi4gKi9cbiAgY3JlYXRlRmFpbHVyZUF0Tm9kZShub2RlOiB0cy5Ob2RlLCBtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBzb3VyY2VGaWxlID0gbm9kZS5nZXRTb3VyY2VGaWxlKCk7XG4gICAgdGhpcy5mYWlsdXJlcy5wdXNoKHtcbiAgICAgIGZpbGVQYXRoOiBzb3VyY2VGaWxlLmZpbGVOYW1lLFxuICAgICAgcG9zaXRpb246IHRzLmdldExpbmVBbmRDaGFyYWN0ZXJPZlBvc2l0aW9uKHNvdXJjZUZpbGUsIG5vZGUuZ2V0U3RhcnQoKSksXG4gICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqIFByaW50cyB0aGUgc3BlY2lmaWVkIG1lc3NhZ2Ugd2l0aCBcImluZm9cIiBsb2dsZXZlbC4gKi9cbiAgcHJpbnRJbmZvKHRleHQ6IHN0cmluZykge1xuICAgIHRoaXMubG9nZ2VyLmluZm8oYC0gJHt0aGlzLnRzY29uZmlnUGF0aH06ICR7dGV4dH1gKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGF0aWMgbWV0aG9kIHRoYXQgd2lsbCBiZSBjYWxsZWQgb25jZSB0aGUgbWlncmF0aW9uIG9mIGFsbCBwcm9qZWN0IHRhcmdldHNcbiAgICogaGFzIGJlZW4gcGVyZm9ybWVkLiBUaGlzIG1ldGhvZCBjYW4gYmUgdXNlZCB0byBtYWtlIGNoYW5nZXMgcmVzcGVjdGluZyB0aGVcbiAgICogbWlncmF0aW9uIHJlc3VsdCBvZiBhbGwgaW5kaXZpZHVhbCB0YXJnZXRzLiBlLmcuIHJlbW92aW5nIEhhbW1lckpTIGlmIGl0XG4gICAqIGlzIG5vdCBuZWVkZWQgaW4gYW55IHByb2plY3QgdGFyZ2V0LlxuICAgKi9cbiAgc3RhdGljIGdsb2JhbFBvc3RNaWdyYXRpb24odHJlZTogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkge31cbn1cbiJdfQ==