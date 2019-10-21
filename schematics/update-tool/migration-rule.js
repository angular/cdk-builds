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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9uLXJ1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXBkYXRlLXRvb2wvbWlncmF0aW9uLXJ1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFJSCxpQ0FBaUM7SUFnQmpDLE1BQWEsYUFBYTtRQU94QjtRQUNJLDRDQUE0QztRQUNyQyxPQUFtQjtRQUMxQixxREFBcUQ7UUFDOUMsV0FBMkI7UUFDbEMsdURBQXVEO1FBQ2hELGFBQTRCO1FBQ25DLDRDQUE0QztRQUNyQyxXQUFjO1FBQ3JCLGlGQUFpRjtRQUMxRSxJQUFVO1FBQ2pCLDZFQUE2RTtRQUN0RSxpQkFBdUQ7UUFDOUQsc0RBQXNEO1FBQy9DLFFBQWdCO1FBQ3ZCLDBFQUEwRTtRQUNuRSxNQUF5QjtRQUNoQyxvREFBb0Q7UUFDN0MsWUFBcUI7UUFDNUIsNkNBQTZDO1FBQ3RDLFlBQW9CO1lBbEJwQixZQUFPLEdBQVAsT0FBTyxDQUFZO1lBRW5CLGdCQUFXLEdBQVgsV0FBVyxDQUFnQjtZQUUzQixrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUU1QixnQkFBVyxHQUFYLFdBQVcsQ0FBRztZQUVkLFNBQUksR0FBSixJQUFJLENBQU07WUFFVixzQkFBaUIsR0FBakIsaUJBQWlCLENBQXNDO1lBRXZELGFBQVEsR0FBUixRQUFRLENBQVE7WUFFaEIsV0FBTSxHQUFOLE1BQU0sQ0FBbUI7WUFFekIsaUJBQVksR0FBWixZQUFZLENBQVM7WUFFckIsaUJBQVksR0FBWixZQUFZLENBQVE7WUExQi9CLDJEQUEyRDtZQUMzRCxhQUFRLEdBQXVCLEVBQUUsQ0FBQztZQUVsQyxvREFBb0Q7WUFDcEQsZ0JBQVcsR0FBRyxJQUFJLENBQUM7UUFzQmUsQ0FBQztRQUVuQyxvRUFBb0U7UUFDcEUsSUFBSSxLQUFVLENBQUM7UUFFZjs7O1dBR0c7UUFDSCxZQUFZLEtBQVUsQ0FBQztRQUV2Qjs7Ozs7V0FLRztRQUNILFNBQVMsQ0FBQyxJQUFhLElBQVMsQ0FBQztRQUVqQywyRUFBMkU7UUFDM0UsYUFBYSxDQUFDLFFBQTBCLElBQVMsQ0FBQztRQUVsRCxxRUFBcUU7UUFDckUsZUFBZSxDQUFDLFVBQTRCLElBQVMsQ0FBQztRQUV0RCw2RUFBNkU7UUFDN0UsbUJBQW1CLENBQUMsSUFBYSxFQUFFLE9BQWU7WUFDaEQsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3hDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO2dCQUNqQixRQUFRLEVBQUUsVUFBVSxDQUFDLFFBQVE7Z0JBQzdCLFFBQVEsRUFBRSxFQUFFLENBQUMsNkJBQTZCLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDdkUsT0FBTyxFQUFFLE9BQU87YUFDakIsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELHlEQUF5RDtRQUN6RCxTQUFTLENBQUMsSUFBWTtZQUNwQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxZQUFZLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRUQ7Ozs7O1dBS0c7UUFDSCxNQUFNLENBQUMsbUJBQW1CLENBQUMsSUFBVSxFQUFFLE9BQXlCLElBQXdCLENBQUM7S0FDMUY7SUExRUQsc0NBMEVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7bG9nZ2luZ30gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtTY2hlbWF0aWNDb250ZXh0LCBUcmVlLCBVcGRhdGVSZWNvcmRlcn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge1Jlc29sdmVkUmVzb3VyY2V9IGZyb20gJy4vY29tcG9uZW50LXJlc291cmNlLWNvbGxlY3Rvcic7XG5pbXBvcnQge1RhcmdldFZlcnNpb259IGZyb20gJy4vdGFyZ2V0LXZlcnNpb24nO1xuaW1wb3J0IHtMaW5lQW5kQ2hhcmFjdGVyfSBmcm9tICcuL3V0aWxzL2xpbmUtbWFwcGluZ3MnO1xuXG5leHBvcnQgaW50ZXJmYWNlIE1pZ3JhdGlvbkZhaWx1cmUge1xuICBmaWxlUGF0aDogc3RyaW5nO1xuICBtZXNzYWdlOiBzdHJpbmc7XG4gIHBvc2l0aW9uPzogTGluZUFuZENoYXJhY3Rlcjtcbn1cblxuZXhwb3J0IHR5cGUgUG9zdE1pZ3JhdGlvbkFjdGlvbiA9IHZvaWQgfCB7XG4gIC8qKiBXaGV0aGVyIHRoZSBwYWNrYWdlIG1hbmFnZXIgc2hvdWxkIHJ1biB1cG9uIG1pZ3JhdGlvbiBjb21wbGV0aW9uLiAqL1xuICBydW5QYWNrYWdlTWFuYWdlcjogYm9vbGVhbjtcbn07XG5cbmV4cG9ydCBjbGFzcyBNaWdyYXRpb25SdWxlPFQ+IHtcbiAgLyoqIExpc3Qgb2YgbWlncmF0aW9uIGZhaWx1cmVzIHRoYXQgbmVlZCB0byBiZSByZXBvcnRlZC4gKi9cbiAgZmFpbHVyZXM6IE1pZ3JhdGlvbkZhaWx1cmVbXSA9IFtdO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBtaWdyYXRpb24gcnVsZSBpcyBlbmFibGVkIG9yIG5vdC4gKi9cbiAgcnVsZUVuYWJsZWQgPSB0cnVlO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgLyoqIFR5cGVTY3JpcHQgcHJvZ3JhbSBmb3IgdGhlIG1pZ3JhdGlvbi4gKi9cbiAgICAgIHB1YmxpYyBwcm9ncmFtOiB0cy5Qcm9ncmFtLFxuICAgICAgLyoqIFR5cGVDaGVja2VyIGluc3RhbmNlIGZvciB0aGUgYW5hbHlzaXMgcHJvZ3JhbS4gKi9cbiAgICAgIHB1YmxpYyB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsXG4gICAgICAvKiogVmVyc2lvbiBmb3Igd2hpY2ggdGhlIG1pZ3JhdGlvbiBydWxlIHNob3VsZCBydW4uICovXG4gICAgICBwdWJsaWMgdGFyZ2V0VmVyc2lvbjogVGFyZ2V0VmVyc2lvbixcbiAgICAgIC8qKiBVcGdyYWRlIGRhdGEgcGFzc2VkIHRvIHRoZSBtaWdyYXRpb24uICovXG4gICAgICBwdWJsaWMgdXBncmFkZURhdGE6IFQsXG4gICAgICAvKiogRGV2a2l0IHRyZWUgZm9yIHRoZSBjdXJyZW50IG1pZ3JhdGlvbi4gQ2FuIGJlIHVzZWQgdG8gaW5zZXJ0L3JlbW92ZSBmaWxlcy4gKi9cbiAgICAgIHB1YmxpYyB0cmVlOiBUcmVlLFxuICAgICAgLyoqIEdldHMgdGhlIHVwZGF0ZSByZWNvcmRlciBmb3IgYSBnaXZlbiBzb3VyY2UgZmlsZSBvciByZXNvbHZlZCB0ZW1wbGF0ZS4gKi9cbiAgICAgIHB1YmxpYyBnZXRVcGRhdGVSZWNvcmRlcjogKGZpbGVQYXRoOiBzdHJpbmcpID0+IFVwZGF0ZVJlY29yZGVyLFxuICAgICAgLyoqIEJhc2UgZGlyZWN0b3J5IG9mIHRoZSB2aXJ0dWFsIGZpbGUgc3lzdGVtIHRyZWUuICovXG4gICAgICBwdWJsaWMgYmFzZVBhdGg6IHN0cmluZyxcbiAgICAgIC8qKiBMb2dnZXIgdGhhdCBjYW4gYmUgdXNlZCB0byBwcmludCBtZXNzYWdlcyBhcyBwYXJ0IG9mIHRoZSBtaWdyYXRpb24uICovXG4gICAgICBwdWJsaWMgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSxcbiAgICAgIC8qKiBXaGV0aGVyIHRoZSBtaWdyYXRpb24gcnVucyBmb3IgYSB0ZXN0IHRhcmdldC4gKi9cbiAgICAgIHB1YmxpYyBpc1Rlc3RUYXJnZXQ6IGJvb2xlYW4sXG4gICAgICAvKiogUGF0aCB0byB0aGUgdHNjb25maWcgdGhhdCBpcyBtaWdyYXRlZC4gKi9cbiAgICAgIHB1YmxpYyB0c2NvbmZpZ1BhdGg6IHN0cmluZykge31cblxuICAvKiogTWV0aG9kIGNhbiBiZSB1c2VkIHRvIHBlcmZvcm0gZ2xvYmFsIGFuYWx5c2lzIG9mIHRoZSBwcm9ncmFtLiAqL1xuICBpbml0KCk6IHZvaWQge31cblxuICAvKipcbiAgICogTWV0aG9kIHRoYXQgd2lsbCBiZSBjYWxsZWQgb25jZSBhbGwgbm9kZXMsIHRlbXBsYXRlcyBhbmQgc3R5bGVzaGVldHNcbiAgICogaGF2ZSBiZWVuIHZpc2l0ZWQuXG4gICAqL1xuICBwb3N0QW5hbHlzaXMoKTogdm9pZCB7fVxuXG4gIC8qKlxuICAgKiBNZXRob2QgdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBub2RlIGluIGEgZ2l2ZW4gc291cmNlIGZpbGUuIFVubGlrZSB0c2xpbnQsIHRoaXNcbiAgICogZnVuY3Rpb24gd2lsbCBvbmx5IHJldHJpZXZlIFR5cGVTY3JpcHQgbm9kZXMgdGhhdCBuZWVkIHRvIGJlIGNhc3RlZCBtYW51YWxseS4gVGhpc1xuICAgKiBhbGxvd3MgdXMgdG8gb25seSB3YWxrIHRoZSBwcm9ncmFtIHNvdXJjZSBmaWxlcyBvbmNlIHBlciBwcm9ncmFtIGFuZCBub3QgcGVyXG4gICAqIG1pZ3JhdGlvbiBydWxlIChzaWduaWZpY2FudCBwZXJmb3JtYW5jZSBib29zdCkuXG4gICAqL1xuICB2aXNpdE5vZGUobm9kZTogdHMuTm9kZSk6IHZvaWQge31cblxuICAvKiogTWV0aG9kIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggQW5ndWxhciB0ZW1wbGF0ZSBpbiB0aGUgcHJvZ3JhbS4gKi9cbiAgdmlzaXRUZW1wbGF0ZSh0ZW1wbGF0ZTogUmVzb2x2ZWRSZXNvdXJjZSk6IHZvaWQge31cblxuICAvKiogTWV0aG9kIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggc3R5bGVzaGVldCBpbiB0aGUgcHJvZ3JhbS4gKi9cbiAgdmlzaXRTdHlsZXNoZWV0KHN0eWxlc2hlZXQ6IFJlc29sdmVkUmVzb3VyY2UpOiB2b2lkIHt9XG5cbiAgLyoqIENyZWF0ZXMgYSBmYWlsdXJlIHdpdGggYSBzcGVjaWZpZWQgbWVzc2FnZSBhdCB0aGUgZ2l2ZW4gbm9kZSBsb2NhdGlvbi4gKi9cbiAgY3JlYXRlRmFpbHVyZUF0Tm9kZShub2RlOiB0cy5Ob2RlLCBtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBzb3VyY2VGaWxlID0gbm9kZS5nZXRTb3VyY2VGaWxlKCk7XG4gICAgdGhpcy5mYWlsdXJlcy5wdXNoKHtcbiAgICAgIGZpbGVQYXRoOiBzb3VyY2VGaWxlLmZpbGVOYW1lLFxuICAgICAgcG9zaXRpb246IHRzLmdldExpbmVBbmRDaGFyYWN0ZXJPZlBvc2l0aW9uKHNvdXJjZUZpbGUsIG5vZGUuZ2V0U3RhcnQoKSksXG4gICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqIFByaW50cyB0aGUgc3BlY2lmaWVkIG1lc3NhZ2Ugd2l0aCBcImluZm9cIiBsb2dsZXZlbC4gKi9cbiAgcHJpbnRJbmZvKHRleHQ6IHN0cmluZykge1xuICAgIHRoaXMubG9nZ2VyLmluZm8oYC0gJHt0aGlzLnRzY29uZmlnUGF0aH06ICR7dGV4dH1gKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGF0aWMgbWV0aG9kIHRoYXQgd2lsbCBiZSBjYWxsZWQgb25jZSB0aGUgbWlncmF0aW9uIG9mIGFsbCBwcm9qZWN0IHRhcmdldHNcbiAgICogaGFzIGJlZW4gcGVyZm9ybWVkLiBUaGlzIG1ldGhvZCBjYW4gYmUgdXNlZCB0byBtYWtlIGNoYW5nZXMgcmVzcGVjdGluZyB0aGVcbiAgICogbWlncmF0aW9uIHJlc3VsdCBvZiBhbGwgaW5kaXZpZHVhbCB0YXJnZXRzLiBlLmcuIHJlbW92aW5nIEhhbW1lckpTIGlmIGl0XG4gICAqIGlzIG5vdCBuZWVkZWQgaW4gYW55IHByb2plY3QgdGFyZ2V0LlxuICAgKi9cbiAgc3RhdGljIGdsb2JhbFBvc3RNaWdyYXRpb24odHJlZTogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCk6IFBvc3RNaWdyYXRpb25BY3Rpb24ge31cbn1cbiJdfQ==