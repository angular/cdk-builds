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
        /** Workspace project the migration rule runs against. */
        project, 
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
            this.project = project;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9uLXJ1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXBkYXRlLXRvb2wvbWlncmF0aW9uLXJ1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFLSCxpQ0FBaUM7SUFnQmpDLE1BQWEsYUFBYTtRQU94QjtRQUNJLHlEQUF5RDtRQUNsRCxPQUF5QjtRQUNoQyw0Q0FBNEM7UUFDckMsT0FBbUI7UUFDMUIscURBQXFEO1FBQzlDLFdBQTJCO1FBQ2xDLHVEQUF1RDtRQUNoRCxhQUE0QjtRQUNuQyw0Q0FBNEM7UUFDckMsV0FBYztRQUNyQixpRkFBaUY7UUFDMUUsSUFBVTtRQUNqQiw2RUFBNkU7UUFDdEUsaUJBQXVEO1FBQzlELHNEQUFzRDtRQUMvQyxRQUFnQjtRQUN2QiwwRUFBMEU7UUFDbkUsTUFBeUI7UUFDaEMsb0RBQW9EO1FBQzdDLFlBQXFCO1FBQzVCLDZDQUE2QztRQUN0QyxZQUFvQjtZQXBCcEIsWUFBTyxHQUFQLE9BQU8sQ0FBa0I7WUFFekIsWUFBTyxHQUFQLE9BQU8sQ0FBWTtZQUVuQixnQkFBVyxHQUFYLFdBQVcsQ0FBZ0I7WUFFM0Isa0JBQWEsR0FBYixhQUFhLENBQWU7WUFFNUIsZ0JBQVcsR0FBWCxXQUFXLENBQUc7WUFFZCxTQUFJLEdBQUosSUFBSSxDQUFNO1lBRVYsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFzQztZQUV2RCxhQUFRLEdBQVIsUUFBUSxDQUFRO1lBRWhCLFdBQU0sR0FBTixNQUFNLENBQW1CO1lBRXpCLGlCQUFZLEdBQVosWUFBWSxDQUFTO1lBRXJCLGlCQUFZLEdBQVosWUFBWSxDQUFRO1lBNUIvQiwyREFBMkQ7WUFDM0QsYUFBUSxHQUF1QixFQUFFLENBQUM7WUFFbEMsb0RBQW9EO1lBQ3BELGdCQUFXLEdBQUcsSUFBSSxDQUFDO1FBd0JlLENBQUM7UUFFbkMsb0VBQW9FO1FBQ3BFLElBQUksS0FBVSxDQUFDO1FBRWY7OztXQUdHO1FBQ0gsWUFBWSxLQUFVLENBQUM7UUFFdkI7Ozs7O1dBS0c7UUFDSCxTQUFTLENBQUMsSUFBYSxJQUFTLENBQUM7UUFFakMsMkVBQTJFO1FBQzNFLGFBQWEsQ0FBQyxRQUEwQixJQUFTLENBQUM7UUFFbEQscUVBQXFFO1FBQ3JFLGVBQWUsQ0FBQyxVQUE0QixJQUFTLENBQUM7UUFFdEQsNkVBQTZFO1FBQzdFLG1CQUFtQixDQUFDLElBQWEsRUFBRSxPQUFlO1lBQ2hELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN4QyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztnQkFDakIsUUFBUSxFQUFFLFVBQVUsQ0FBQyxRQUFRO2dCQUM3QixRQUFRLEVBQUUsRUFBRSxDQUFDLDZCQUE2QixDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3ZFLE9BQU8sRUFBRSxPQUFPO2FBQ2pCLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCx5REFBeUQ7UUFDekQsU0FBUyxDQUFDLElBQVk7WUFDcEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsWUFBWSxLQUFLLElBQUksRUFBRSxDQUFDLENBQUM7UUFDdEQsQ0FBQztRQUVEOzs7OztXQUtHO1FBQ0gsTUFBTSxDQUFDLG1CQUFtQixDQUFDLElBQVUsRUFBRSxPQUF5QixJQUF3QixDQUFDO0tBQzFGO0lBNUVELHNDQTRFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2xvZ2dpbmd9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7U2NoZW1hdGljQ29udGV4dCwgVHJlZSwgVXBkYXRlUmVjb3JkZXJ9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7V29ya3NwYWNlUHJvamVjdH0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L3dvcmtzcGFjZS1tb2RlbHMnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge1Jlc29sdmVkUmVzb3VyY2V9IGZyb20gJy4vY29tcG9uZW50LXJlc291cmNlLWNvbGxlY3Rvcic7XG5pbXBvcnQge1RhcmdldFZlcnNpb259IGZyb20gJy4vdGFyZ2V0LXZlcnNpb24nO1xuaW1wb3J0IHtMaW5lQW5kQ2hhcmFjdGVyfSBmcm9tICcuL3V0aWxzL2xpbmUtbWFwcGluZ3MnO1xuXG5leHBvcnQgaW50ZXJmYWNlIE1pZ3JhdGlvbkZhaWx1cmUge1xuICBmaWxlUGF0aDogc3RyaW5nO1xuICBtZXNzYWdlOiBzdHJpbmc7XG4gIHBvc2l0aW9uPzogTGluZUFuZENoYXJhY3Rlcjtcbn1cblxuZXhwb3J0IHR5cGUgUG9zdE1pZ3JhdGlvbkFjdGlvbiA9IHZvaWQgfCB7XG4gIC8qKiBXaGV0aGVyIHRoZSBwYWNrYWdlIG1hbmFnZXIgc2hvdWxkIHJ1biB1cG9uIG1pZ3JhdGlvbiBjb21wbGV0aW9uLiAqL1xuICBydW5QYWNrYWdlTWFuYWdlcjogYm9vbGVhbjtcbn07XG5cbmV4cG9ydCBjbGFzcyBNaWdyYXRpb25SdWxlPFQ+IHtcbiAgLyoqIExpc3Qgb2YgbWlncmF0aW9uIGZhaWx1cmVzIHRoYXQgbmVlZCB0byBiZSByZXBvcnRlZC4gKi9cbiAgZmFpbHVyZXM6IE1pZ3JhdGlvbkZhaWx1cmVbXSA9IFtdO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBtaWdyYXRpb24gcnVsZSBpcyBlbmFibGVkIG9yIG5vdC4gKi9cbiAgcnVsZUVuYWJsZWQgPSB0cnVlO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgLyoqIFdvcmtzcGFjZSBwcm9qZWN0IHRoZSBtaWdyYXRpb24gcnVsZSBydW5zIGFnYWluc3QuICovXG4gICAgICBwdWJsaWMgcHJvamVjdDogV29ya3NwYWNlUHJvamVjdCxcbiAgICAgIC8qKiBUeXBlU2NyaXB0IHByb2dyYW0gZm9yIHRoZSBtaWdyYXRpb24uICovXG4gICAgICBwdWJsaWMgcHJvZ3JhbTogdHMuUHJvZ3JhbSxcbiAgICAgIC8qKiBUeXBlQ2hlY2tlciBpbnN0YW5jZSBmb3IgdGhlIGFuYWx5c2lzIHByb2dyYW0uICovXG4gICAgICBwdWJsaWMgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLFxuICAgICAgLyoqIFZlcnNpb24gZm9yIHdoaWNoIHRoZSBtaWdyYXRpb24gcnVsZSBzaG91bGQgcnVuLiAqL1xuICAgICAgcHVibGljIHRhcmdldFZlcnNpb246IFRhcmdldFZlcnNpb24sXG4gICAgICAvKiogVXBncmFkZSBkYXRhIHBhc3NlZCB0byB0aGUgbWlncmF0aW9uLiAqL1xuICAgICAgcHVibGljIHVwZ3JhZGVEYXRhOiBULFxuICAgICAgLyoqIERldmtpdCB0cmVlIGZvciB0aGUgY3VycmVudCBtaWdyYXRpb24uIENhbiBiZSB1c2VkIHRvIGluc2VydC9yZW1vdmUgZmlsZXMuICovXG4gICAgICBwdWJsaWMgdHJlZTogVHJlZSxcbiAgICAgIC8qKiBHZXRzIHRoZSB1cGRhdGUgcmVjb3JkZXIgZm9yIGEgZ2l2ZW4gc291cmNlIGZpbGUgb3IgcmVzb2x2ZWQgdGVtcGxhdGUuICovXG4gICAgICBwdWJsaWMgZ2V0VXBkYXRlUmVjb3JkZXI6IChmaWxlUGF0aDogc3RyaW5nKSA9PiBVcGRhdGVSZWNvcmRlcixcbiAgICAgIC8qKiBCYXNlIGRpcmVjdG9yeSBvZiB0aGUgdmlydHVhbCBmaWxlIHN5c3RlbSB0cmVlLiAqL1xuICAgICAgcHVibGljIGJhc2VQYXRoOiBzdHJpbmcsXG4gICAgICAvKiogTG9nZ2VyIHRoYXQgY2FuIGJlIHVzZWQgdG8gcHJpbnQgbWVzc2FnZXMgYXMgcGFydCBvZiB0aGUgbWlncmF0aW9uLiAqL1xuICAgICAgcHVibGljIGxvZ2dlcjogbG9nZ2luZy5Mb2dnZXJBcGksXG4gICAgICAvKiogV2hldGhlciB0aGUgbWlncmF0aW9uIHJ1bnMgZm9yIGEgdGVzdCB0YXJnZXQuICovXG4gICAgICBwdWJsaWMgaXNUZXN0VGFyZ2V0OiBib29sZWFuLFxuICAgICAgLyoqIFBhdGggdG8gdGhlIHRzY29uZmlnIHRoYXQgaXMgbWlncmF0ZWQuICovXG4gICAgICBwdWJsaWMgdHNjb25maWdQYXRoOiBzdHJpbmcpIHt9XG5cbiAgLyoqIE1ldGhvZCBjYW4gYmUgdXNlZCB0byBwZXJmb3JtIGdsb2JhbCBhbmFseXNpcyBvZiB0aGUgcHJvZ3JhbS4gKi9cbiAgaW5pdCgpOiB2b2lkIHt9XG5cbiAgLyoqXG4gICAqIE1ldGhvZCB0aGF0IHdpbGwgYmUgY2FsbGVkIG9uY2UgYWxsIG5vZGVzLCB0ZW1wbGF0ZXMgYW5kIHN0eWxlc2hlZXRzXG4gICAqIGhhdmUgYmVlbiB2aXNpdGVkLlxuICAgKi9cbiAgcG9zdEFuYWx5c2lzKCk6IHZvaWQge31cblxuICAvKipcbiAgICogTWV0aG9kIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggbm9kZSBpbiBhIGdpdmVuIHNvdXJjZSBmaWxlLiBVbmxpa2UgdHNsaW50LCB0aGlzXG4gICAqIGZ1bmN0aW9uIHdpbGwgb25seSByZXRyaWV2ZSBUeXBlU2NyaXB0IG5vZGVzIHRoYXQgbmVlZCB0byBiZSBjYXN0ZWQgbWFudWFsbHkuIFRoaXNcbiAgICogYWxsb3dzIHVzIHRvIG9ubHkgd2FsayB0aGUgcHJvZ3JhbSBzb3VyY2UgZmlsZXMgb25jZSBwZXIgcHJvZ3JhbSBhbmQgbm90IHBlclxuICAgKiBtaWdyYXRpb24gcnVsZSAoc2lnbmlmaWNhbnQgcGVyZm9ybWFuY2UgYm9vc3QpLlxuICAgKi9cbiAgdmlzaXROb2RlKG5vZGU6IHRzLk5vZGUpOiB2b2lkIHt9XG5cbiAgLyoqIE1ldGhvZCB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoIEFuZ3VsYXIgdGVtcGxhdGUgaW4gdGhlIHByb2dyYW0uICovXG4gIHZpc2l0VGVtcGxhdGUodGVtcGxhdGU6IFJlc29sdmVkUmVzb3VyY2UpOiB2b2lkIHt9XG5cbiAgLyoqIE1ldGhvZCB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoIHN0eWxlc2hlZXQgaW4gdGhlIHByb2dyYW0uICovXG4gIHZpc2l0U3R5bGVzaGVldChzdHlsZXNoZWV0OiBSZXNvbHZlZFJlc291cmNlKTogdm9pZCB7fVxuXG4gIC8qKiBDcmVhdGVzIGEgZmFpbHVyZSB3aXRoIGEgc3BlY2lmaWVkIG1lc3NhZ2UgYXQgdGhlIGdpdmVuIG5vZGUgbG9jYXRpb24uICovXG4gIGNyZWF0ZUZhaWx1cmVBdE5vZGUobm9kZTogdHMuTm9kZSwgbWVzc2FnZTogc3RyaW5nKSB7XG4gICAgY29uc3Qgc291cmNlRmlsZSA9IG5vZGUuZ2V0U291cmNlRmlsZSgpO1xuICAgIHRoaXMuZmFpbHVyZXMucHVzaCh7XG4gICAgICBmaWxlUGF0aDogc291cmNlRmlsZS5maWxlTmFtZSxcbiAgICAgIHBvc2l0aW9uOiB0cy5nZXRMaW5lQW5kQ2hhcmFjdGVyT2ZQb3NpdGlvbihzb3VyY2VGaWxlLCBub2RlLmdldFN0YXJ0KCkpLFxuICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBQcmludHMgdGhlIHNwZWNpZmllZCBtZXNzYWdlIHdpdGggXCJpbmZvXCIgbG9nbGV2ZWwuICovXG4gIHByaW50SW5mbyh0ZXh0OiBzdHJpbmcpIHtcbiAgICB0aGlzLmxvZ2dlci5pbmZvKGAtICR7dGhpcy50c2NvbmZpZ1BhdGh9OiAke3RleHR9YCk7XG4gIH1cblxuICAvKipcbiAgICogU3RhdGljIG1ldGhvZCB0aGF0IHdpbGwgYmUgY2FsbGVkIG9uY2UgdGhlIG1pZ3JhdGlvbiBvZiBhbGwgcHJvamVjdCB0YXJnZXRzXG4gICAqIGhhcyBiZWVuIHBlcmZvcm1lZC4gVGhpcyBtZXRob2QgY2FuIGJlIHVzZWQgdG8gbWFrZSBjaGFuZ2VzIHJlc3BlY3RpbmcgdGhlXG4gICAqIG1pZ3JhdGlvbiByZXN1bHQgb2YgYWxsIGluZGl2aWR1YWwgdGFyZ2V0cy4gZS5nLiByZW1vdmluZyBIYW1tZXJKUyBpZiBpdFxuICAgKiBpcyBub3QgbmVlZGVkIGluIGFueSBwcm9qZWN0IHRhcmdldC5cbiAgICovXG4gIHN0YXRpYyBnbG9iYWxQb3N0TWlncmF0aW9uKHRyZWU6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpOiBQb3N0TWlncmF0aW9uQWN0aW9uIHt9XG59XG4iXX0=