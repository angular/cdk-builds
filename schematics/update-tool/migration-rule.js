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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9uLXJ1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXBkYXRlLXRvb2wvbWlncmF0aW9uLXJ1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFJSCxpQ0FBaUM7SUFXakMsTUFBYSxhQUFhO1FBT3hCO1FBQ0ksNENBQTRDO1FBQ3JDLE9BQW1CO1FBQzFCLHFEQUFxRDtRQUM5QyxXQUEyQjtRQUNsQyx1REFBdUQ7UUFDaEQsYUFBNEI7UUFDbkMsNENBQTRDO1FBQ3JDLFdBQWM7UUFDckIsaUZBQWlGO1FBQzFFLElBQVU7UUFDakIsNkVBQTZFO1FBQ3RFLGlCQUF1RDtRQUM5RCxzREFBc0Q7UUFDL0MsUUFBZ0I7UUFDdkIsMEVBQTBFO1FBQ25FLE1BQXlCO1FBQ2hDLG9EQUFvRDtRQUM3QyxZQUFxQjtRQUM1Qiw2Q0FBNkM7UUFDdEMsWUFBb0I7WUFsQnBCLFlBQU8sR0FBUCxPQUFPLENBQVk7WUFFbkIsZ0JBQVcsR0FBWCxXQUFXLENBQWdCO1lBRTNCLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBRTVCLGdCQUFXLEdBQVgsV0FBVyxDQUFHO1lBRWQsU0FBSSxHQUFKLElBQUksQ0FBTTtZQUVWLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBc0M7WUFFdkQsYUFBUSxHQUFSLFFBQVEsQ0FBUTtZQUVoQixXQUFNLEdBQU4sTUFBTSxDQUFtQjtZQUV6QixpQkFBWSxHQUFaLFlBQVksQ0FBUztZQUVyQixpQkFBWSxHQUFaLFlBQVksQ0FBUTtZQTFCL0IsMkRBQTJEO1lBQzNELGFBQVEsR0FBdUIsRUFBRSxDQUFDO1lBRWxDLG9EQUFvRDtZQUNwRCxnQkFBVyxHQUFHLElBQUksQ0FBQztRQXNCZSxDQUFDO1FBRW5DLG9FQUFvRTtRQUNwRSxJQUFJLEtBQVUsQ0FBQztRQUVmOzs7V0FHRztRQUNILFlBQVksS0FBVSxDQUFDO1FBRXZCOzs7OztXQUtHO1FBQ0gsU0FBUyxDQUFDLElBQWEsSUFBUyxDQUFDO1FBRWpDLDJFQUEyRTtRQUMzRSxhQUFhLENBQUMsUUFBMEIsSUFBUyxDQUFDO1FBRWxELHFFQUFxRTtRQUNyRSxlQUFlLENBQUMsVUFBNEIsSUFBUyxDQUFDO1FBRXRELDZFQUE2RTtRQUM3RSxtQkFBbUIsQ0FBQyxJQUFhLEVBQUUsT0FBZTtZQUNoRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDeEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7Z0JBQ2pCLFFBQVEsRUFBRSxVQUFVLENBQUMsUUFBUTtnQkFDN0IsUUFBUSxFQUFFLEVBQUUsQ0FBQyw2QkFBNkIsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUN2RSxPQUFPLEVBQUUsT0FBTzthQUNqQixDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQseURBQXlEO1FBQ3pELFNBQVMsQ0FBQyxJQUFZO1lBQ3BCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLFlBQVksS0FBSyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFFRDs7Ozs7V0FLRztRQUNILE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxJQUFVLEVBQUUsT0FBeUIsSUFBRyxDQUFDO0tBQ3JFO0lBMUVELHNDQTBFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2xvZ2dpbmd9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7U2NoZW1hdGljQ29udGV4dCwgVHJlZSwgVXBkYXRlUmVjb3JkZXJ9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtSZXNvbHZlZFJlc291cmNlfSBmcm9tICcuL2NvbXBvbmVudC1yZXNvdXJjZS1jb2xsZWN0b3InO1xuaW1wb3J0IHtUYXJnZXRWZXJzaW9ufSBmcm9tICcuL3RhcmdldC12ZXJzaW9uJztcbmltcG9ydCB7TGluZUFuZENoYXJhY3Rlcn0gZnJvbSAnLi91dGlscy9saW5lLW1hcHBpbmdzJztcblxuZXhwb3J0IGludGVyZmFjZSBNaWdyYXRpb25GYWlsdXJlIHtcbiAgZmlsZVBhdGg6IHN0cmluZztcbiAgbWVzc2FnZTogc3RyaW5nO1xuICBwb3NpdGlvbjogTGluZUFuZENoYXJhY3Rlcjtcbn1cblxuZXhwb3J0IGNsYXNzIE1pZ3JhdGlvblJ1bGU8VD4ge1xuICAvKiogTGlzdCBvZiBtaWdyYXRpb24gZmFpbHVyZXMgdGhhdCBuZWVkIHRvIGJlIHJlcG9ydGVkLiAqL1xuICBmYWlsdXJlczogTWlncmF0aW9uRmFpbHVyZVtdID0gW107XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG1pZ3JhdGlvbiBydWxlIGlzIGVuYWJsZWQgb3Igbm90LiAqL1xuICBydWxlRW5hYmxlZCA9IHRydWU7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICAvKiogVHlwZVNjcmlwdCBwcm9ncmFtIGZvciB0aGUgbWlncmF0aW9uLiAqL1xuICAgICAgcHVibGljIHByb2dyYW06IHRzLlByb2dyYW0sXG4gICAgICAvKiogVHlwZUNoZWNrZXIgaW5zdGFuY2UgZm9yIHRoZSBhbmFseXNpcyBwcm9ncmFtLiAqL1xuICAgICAgcHVibGljIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcixcbiAgICAgIC8qKiBWZXJzaW9uIGZvciB3aGljaCB0aGUgbWlncmF0aW9uIHJ1bGUgc2hvdWxkIHJ1bi4gKi9cbiAgICAgIHB1YmxpYyB0YXJnZXRWZXJzaW9uOiBUYXJnZXRWZXJzaW9uLFxuICAgICAgLyoqIFVwZ3JhZGUgZGF0YSBwYXNzZWQgdG8gdGhlIG1pZ3JhdGlvbi4gKi9cbiAgICAgIHB1YmxpYyB1cGdyYWRlRGF0YTogVCxcbiAgICAgIC8qKiBEZXZraXQgdHJlZSBmb3IgdGhlIGN1cnJlbnQgbWlncmF0aW9uLiBDYW4gYmUgdXNlZCB0byBpbnNlcnQvcmVtb3ZlIGZpbGVzLiAqL1xuICAgICAgcHVibGljIHRyZWU6IFRyZWUsXG4gICAgICAvKiogR2V0cyB0aGUgdXBkYXRlIHJlY29yZGVyIGZvciBhIGdpdmVuIHNvdXJjZSBmaWxlIG9yIHJlc29sdmVkIHRlbXBsYXRlLiAqL1xuICAgICAgcHVibGljIGdldFVwZGF0ZVJlY29yZGVyOiAoZmlsZVBhdGg6IHN0cmluZykgPT4gVXBkYXRlUmVjb3JkZXIsXG4gICAgICAvKiogQmFzZSBkaXJlY3Rvcnkgb2YgdGhlIHZpcnR1YWwgZmlsZSBzeXN0ZW0gdHJlZS4gKi9cbiAgICAgIHB1YmxpYyBiYXNlUGF0aDogc3RyaW5nLFxuICAgICAgLyoqIExvZ2dlciB0aGF0IGNhbiBiZSB1c2VkIHRvIHByaW50IG1lc3NhZ2VzIGFzIHBhcnQgb2YgdGhlIG1pZ3JhdGlvbi4gKi9cbiAgICAgIHB1YmxpYyBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpLFxuICAgICAgLyoqIFdoZXRoZXIgdGhlIG1pZ3JhdGlvbiBydW5zIGZvciBhIHRlc3QgdGFyZ2V0LiAqL1xuICAgICAgcHVibGljIGlzVGVzdFRhcmdldDogYm9vbGVhbixcbiAgICAgIC8qKiBQYXRoIHRvIHRoZSB0c2NvbmZpZyB0aGF0IGlzIG1pZ3JhdGVkLiAqL1xuICAgICAgcHVibGljIHRzY29uZmlnUGF0aDogc3RyaW5nKSB7fVxuXG4gIC8qKiBNZXRob2QgY2FuIGJlIHVzZWQgdG8gcGVyZm9ybSBnbG9iYWwgYW5hbHlzaXMgb2YgdGhlIHByb2dyYW0uICovXG4gIGluaXQoKTogdm9pZCB7fVxuXG4gIC8qKlxuICAgKiBNZXRob2QgdGhhdCB3aWxsIGJlIGNhbGxlZCBvbmNlIGFsbCBub2RlcywgdGVtcGxhdGVzIGFuZCBzdHlsZXNoZWV0c1xuICAgKiBoYXZlIGJlZW4gdmlzaXRlZC5cbiAgICovXG4gIHBvc3RBbmFseXNpcygpOiB2b2lkIHt9XG5cbiAgLyoqXG4gICAqIE1ldGhvZCB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoIG5vZGUgaW4gYSBnaXZlbiBzb3VyY2UgZmlsZS4gVW5saWtlIHRzbGludCwgdGhpc1xuICAgKiBmdW5jdGlvbiB3aWxsIG9ubHkgcmV0cmlldmUgVHlwZVNjcmlwdCBub2RlcyB0aGF0IG5lZWQgdG8gYmUgY2FzdGVkIG1hbnVhbGx5LiBUaGlzXG4gICAqIGFsbG93cyB1cyB0byBvbmx5IHdhbGsgdGhlIHByb2dyYW0gc291cmNlIGZpbGVzIG9uY2UgcGVyIHByb2dyYW0gYW5kIG5vdCBwZXJcbiAgICogbWlncmF0aW9uIHJ1bGUgKHNpZ25pZmljYW50IHBlcmZvcm1hbmNlIGJvb3N0KS5cbiAgICovXG4gIHZpc2l0Tm9kZShub2RlOiB0cy5Ob2RlKTogdm9pZCB7fVxuXG4gIC8qKiBNZXRob2QgdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBBbmd1bGFyIHRlbXBsYXRlIGluIHRoZSBwcm9ncmFtLiAqL1xuICB2aXNpdFRlbXBsYXRlKHRlbXBsYXRlOiBSZXNvbHZlZFJlc291cmNlKTogdm9pZCB7fVxuXG4gIC8qKiBNZXRob2QgdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBzdHlsZXNoZWV0IGluIHRoZSBwcm9ncmFtLiAqL1xuICB2aXNpdFN0eWxlc2hlZXQoc3R5bGVzaGVldDogUmVzb2x2ZWRSZXNvdXJjZSk6IHZvaWQge31cblxuICAvKiogQ3JlYXRlcyBhIGZhaWx1cmUgd2l0aCBhIHNwZWNpZmllZCBtZXNzYWdlIGF0IHRoZSBnaXZlbiBub2RlIGxvY2F0aW9uLiAqL1xuICBjcmVhdGVGYWlsdXJlQXROb2RlKG5vZGU6IHRzLk5vZGUsIG1lc3NhZ2U6IHN0cmluZykge1xuICAgIGNvbnN0IHNvdXJjZUZpbGUgPSBub2RlLmdldFNvdXJjZUZpbGUoKTtcbiAgICB0aGlzLmZhaWx1cmVzLnB1c2goe1xuICAgICAgZmlsZVBhdGg6IHNvdXJjZUZpbGUuZmlsZU5hbWUsXG4gICAgICBwb3NpdGlvbjogdHMuZ2V0TGluZUFuZENoYXJhY3Rlck9mUG9zaXRpb24oc291cmNlRmlsZSwgbm9kZS5nZXRTdGFydCgpKSxcbiAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgfSk7XG4gIH1cblxuICAvKiogUHJpbnRzIHRoZSBzcGVjaWZpZWQgbWVzc2FnZSB3aXRoIFwiaW5mb1wiIGxvZ2xldmVsLiAqL1xuICBwcmludEluZm8odGV4dDogc3RyaW5nKSB7XG4gICAgdGhpcy5sb2dnZXIuaW5mbyhgLSAke3RoaXMudHNjb25maWdQYXRofTogJHt0ZXh0fWApO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0YXRpYyBtZXRob2QgdGhhdCB3aWxsIGJlIGNhbGxlZCBvbmNlIHRoZSBtaWdyYXRpb24gb2YgYWxsIHByb2plY3QgdGFyZ2V0c1xuICAgKiBoYXMgYmVlbiBwZXJmb3JtZWQuIFRoaXMgbWV0aG9kIGNhbiBiZSB1c2VkIHRvIG1ha2UgY2hhbmdlcyByZXNwZWN0aW5nIHRoZVxuICAgKiBtaWdyYXRpb24gcmVzdWx0IG9mIGFsbCBpbmRpdmlkdWFsIHRhcmdldHMuIGUuZy4gcmVtb3ZpbmcgSGFtbWVySlMgaWYgaXRcbiAgICogaXMgbm90IG5lZWRlZCBpbiBhbnkgcHJvamVjdCB0YXJnZXQuXG4gICAqL1xuICBzdGF0aWMgZ2xvYmFsUG9zdE1pZ3JhdGlvbih0cmVlOiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSB7fVxufVxuIl19