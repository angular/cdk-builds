"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration = void 0;
const ts = require("typescript");
class Migration {
    constructor(
    /** TypeScript program for the migration. */
    program, 
    /** TypeChecker instance for the analysis program. */
    typeChecker, 
    /** Version for which the migration rule should run. */
    targetVersion, 
    /** Context data for the migration. */
    context, 
    /** Upgrade data passed to the migration. */
    upgradeData, 
    /** File system that can be used for modifying files. */
    fileSystem, 
    /** Logger that can be used to print messages as part of the migration. */
    logger) {
        this.program = program;
        this.typeChecker = typeChecker;
        this.targetVersion = targetVersion;
        this.context = context;
        this.upgradeData = upgradeData;
        this.fileSystem = fileSystem;
        this.logger = logger;
        /** List of migration failures that need to be reported. */
        this.failures = [];
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
            filePath: this.fileSystem.resolve(sourceFile.fileName),
            position: ts.getLineAndCharacterOfPosition(sourceFile, node.getStart()),
            message: message,
        });
    }
}
exports.Migration = Migration;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL3VwZGF0ZS10b29sL21pZ3JhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCxpQ0FBaUM7QUF1QmpDLE1BQXNCLFNBQVM7SUFPN0I7SUFDSSw0Q0FBNEM7SUFDckMsT0FBbUI7SUFDMUIscURBQXFEO0lBQzlDLFdBQTJCO0lBQ2xDLHVEQUF1RDtJQUNoRCxhQUE0QjtJQUNuQyxzQ0FBc0M7SUFDL0IsT0FBZ0I7SUFDdkIsNENBQTRDO0lBQ3JDLFdBQWlCO0lBQ3hCLHdEQUF3RDtJQUNqRCxVQUFzQjtJQUM3QiwwRUFBMEU7SUFDbkUsTUFBb0I7UUFacEIsWUFBTyxHQUFQLE9BQU8sQ0FBWTtRQUVuQixnQkFBVyxHQUFYLFdBQVcsQ0FBZ0I7UUFFM0Isa0JBQWEsR0FBYixhQUFhLENBQWU7UUFFNUIsWUFBTyxHQUFQLE9BQU8sQ0FBUztRQUVoQixnQkFBVyxHQUFYLFdBQVcsQ0FBTTtRQUVqQixlQUFVLEdBQVYsVUFBVSxDQUFZO1FBRXRCLFdBQU0sR0FBTixNQUFNLENBQWM7UUFwQi9CLDJEQUEyRDtRQUMzRCxhQUFRLEdBQXVCLEVBQUUsQ0FBQztJQW1CQSxDQUFDO0lBRW5DLG9FQUFvRTtJQUNwRSxJQUFJLEtBQVUsQ0FBQztJQUVmOzs7T0FHRztJQUNILFlBQVksS0FBVSxDQUFDO0lBRXZCOzs7OztPQUtHO0lBQ0gsU0FBUyxDQUFDLElBQWEsSUFBUyxDQUFDO0lBRWpDLDJFQUEyRTtJQUMzRSxhQUFhLENBQUMsUUFBMEIsSUFBUyxDQUFDO0lBRWxELHFFQUFxRTtJQUNyRSxlQUFlLENBQUMsVUFBNEIsSUFBUyxDQUFDO0lBRXRELDZFQUE2RTtJQUNuRSxtQkFBbUIsQ0FBQyxJQUFhLEVBQUUsT0FBZTtRQUMxRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDeEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7WUFDakIsUUFBUSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUM7WUFDdEQsUUFBUSxFQUFFLEVBQUUsQ0FBQyw2QkFBNkIsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3ZFLE9BQU8sRUFBRSxPQUFPO1NBQ2pCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXZERCw4QkF1REMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge1Jlc29sdmVkUmVzb3VyY2V9IGZyb20gJy4vY29tcG9uZW50LXJlc291cmNlLWNvbGxlY3Rvcic7XG5pbXBvcnQge0ZpbGVTeXN0ZW0sIFdvcmtzcGFjZVBhdGh9IGZyb20gJy4vZmlsZS1zeXN0ZW0nO1xuaW1wb3J0IHtVcGRhdGVMb2dnZXJ9IGZyb20gJy4vbG9nZ2VyJztcbmltcG9ydCB7VGFyZ2V0VmVyc2lvbn0gZnJvbSAnLi90YXJnZXQtdmVyc2lvbic7XG5pbXBvcnQge0xpbmVBbmRDaGFyYWN0ZXJ9IGZyb20gJy4vdXRpbHMvbGluZS1tYXBwaW5ncyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWlncmF0aW9uRmFpbHVyZSB7XG4gIGZpbGVQYXRoOiBXb3Jrc3BhY2VQYXRoO1xuICBtZXNzYWdlOiBzdHJpbmc7XG4gIHBvc2l0aW9uPzogTGluZUFuZENoYXJhY3Rlcjtcbn1cblxuZXhwb3J0IHR5cGUgUG9zdE1pZ3JhdGlvbkFjdGlvbiA9IHZvaWQgfCB7XG4gIC8qKiBXaGV0aGVyIHRoZSBwYWNrYWdlIG1hbmFnZXIgc2hvdWxkIHJ1biB1cG9uIG1pZ3JhdGlvbiBjb21wbGV0aW9uLiAqL1xuICBydW5QYWNrYWdlTWFuYWdlcjogYm9vbGVhbjtcbn07XG5cbi8qKiBDcmVhdGVzIGEgY29uc3RydWN0b3IgdHlwZSBmb3IgdGhlIHNwZWNpZmllZCB0eXBlLiAqL1xuZXhwb3J0IHR5cGUgQ29uc3RydWN0b3I8VD4gPSAobmV3ICguLi5hcmdzOiBhbnlbXSkgPT4gVCk7XG4vKiogR2V0cyBhIGNvbnN0cnVjdG9yIHR5cGUgZm9yIHRoZSBwYXNzZWQgbWlncmF0aW9uIGRhdGEuICovXG5leHBvcnQgdHlwZSBNaWdyYXRpb25DdG9yPERhdGEsIENvbnRleHQgPSBhbnk+ID0gQ29uc3RydWN0b3I8TWlncmF0aW9uPERhdGEsIENvbnRleHQ+PjtcblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE1pZ3JhdGlvbjxEYXRhLCBDb250ZXh0ID0gYW55PiB7XG4gIC8qKiBMaXN0IG9mIG1pZ3JhdGlvbiBmYWlsdXJlcyB0aGF0IG5lZWQgdG8gYmUgcmVwb3J0ZWQuICovXG4gIGZhaWx1cmVzOiBNaWdyYXRpb25GYWlsdXJlW10gPSBbXTtcblxuICAvKiogV2hldGhlciB0aGUgbWlncmF0aW9uIGlzIGVuYWJsZWQgb3Igbm90LiAqL1xuICBhYnN0cmFjdCBlbmFibGVkOiBib29sZWFuO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgLyoqIFR5cGVTY3JpcHQgcHJvZ3JhbSBmb3IgdGhlIG1pZ3JhdGlvbi4gKi9cbiAgICAgIHB1YmxpYyBwcm9ncmFtOiB0cy5Qcm9ncmFtLFxuICAgICAgLyoqIFR5cGVDaGVja2VyIGluc3RhbmNlIGZvciB0aGUgYW5hbHlzaXMgcHJvZ3JhbS4gKi9cbiAgICAgIHB1YmxpYyB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsXG4gICAgICAvKiogVmVyc2lvbiBmb3Igd2hpY2ggdGhlIG1pZ3JhdGlvbiBydWxlIHNob3VsZCBydW4uICovXG4gICAgICBwdWJsaWMgdGFyZ2V0VmVyc2lvbjogVGFyZ2V0VmVyc2lvbixcbiAgICAgIC8qKiBDb250ZXh0IGRhdGEgZm9yIHRoZSBtaWdyYXRpb24uICovXG4gICAgICBwdWJsaWMgY29udGV4dDogQ29udGV4dCxcbiAgICAgIC8qKiBVcGdyYWRlIGRhdGEgcGFzc2VkIHRvIHRoZSBtaWdyYXRpb24uICovXG4gICAgICBwdWJsaWMgdXBncmFkZURhdGE6IERhdGEsXG4gICAgICAvKiogRmlsZSBzeXN0ZW0gdGhhdCBjYW4gYmUgdXNlZCBmb3IgbW9kaWZ5aW5nIGZpbGVzLiAqL1xuICAgICAgcHVibGljIGZpbGVTeXN0ZW06IEZpbGVTeXN0ZW0sXG4gICAgICAvKiogTG9nZ2VyIHRoYXQgY2FuIGJlIHVzZWQgdG8gcHJpbnQgbWVzc2FnZXMgYXMgcGFydCBvZiB0aGUgbWlncmF0aW9uLiAqL1xuICAgICAgcHVibGljIGxvZ2dlcjogVXBkYXRlTG9nZ2VyKSB7fVxuXG4gIC8qKiBNZXRob2QgY2FuIGJlIHVzZWQgdG8gcGVyZm9ybSBnbG9iYWwgYW5hbHlzaXMgb2YgdGhlIHByb2dyYW0uICovXG4gIGluaXQoKTogdm9pZCB7fVxuXG4gIC8qKlxuICAgKiBNZXRob2QgdGhhdCB3aWxsIGJlIGNhbGxlZCBvbmNlIGFsbCBub2RlcywgdGVtcGxhdGVzIGFuZCBzdHlsZXNoZWV0c1xuICAgKiBoYXZlIGJlZW4gdmlzaXRlZC5cbiAgICovXG4gIHBvc3RBbmFseXNpcygpOiB2b2lkIHt9XG5cbiAgLyoqXG4gICAqIE1ldGhvZCB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoIG5vZGUgaW4gYSBnaXZlbiBzb3VyY2UgZmlsZS4gVW5saWtlIHRzbGludCwgdGhpc1xuICAgKiBmdW5jdGlvbiB3aWxsIG9ubHkgcmV0cmlldmUgVHlwZVNjcmlwdCBub2RlcyB0aGF0IG5lZWQgdG8gYmUgY2FzdGVkIG1hbnVhbGx5LiBUaGlzXG4gICAqIGFsbG93cyB1cyB0byBvbmx5IHdhbGsgdGhlIHByb2dyYW0gc291cmNlIGZpbGVzIG9uY2UgcGVyIHByb2dyYW0gYW5kIG5vdCBwZXJcbiAgICogbWlncmF0aW9uIHJ1bGUgKHNpZ25pZmljYW50IHBlcmZvcm1hbmNlIGJvb3N0KS5cbiAgICovXG4gIHZpc2l0Tm9kZShub2RlOiB0cy5Ob2RlKTogdm9pZCB7fVxuXG4gIC8qKiBNZXRob2QgdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBBbmd1bGFyIHRlbXBsYXRlIGluIHRoZSBwcm9ncmFtLiAqL1xuICB2aXNpdFRlbXBsYXRlKHRlbXBsYXRlOiBSZXNvbHZlZFJlc291cmNlKTogdm9pZCB7fVxuXG4gIC8qKiBNZXRob2QgdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBzdHlsZXNoZWV0IGluIHRoZSBwcm9ncmFtLiAqL1xuICB2aXNpdFN0eWxlc2hlZXQoc3R5bGVzaGVldDogUmVzb2x2ZWRSZXNvdXJjZSk6IHZvaWQge31cblxuICAvKiogQ3JlYXRlcyBhIGZhaWx1cmUgd2l0aCBhIHNwZWNpZmllZCBtZXNzYWdlIGF0IHRoZSBnaXZlbiBub2RlIGxvY2F0aW9uLiAqL1xuICBwcm90ZWN0ZWQgY3JlYXRlRmFpbHVyZUF0Tm9kZShub2RlOiB0cy5Ob2RlLCBtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBzb3VyY2VGaWxlID0gbm9kZS5nZXRTb3VyY2VGaWxlKCk7XG4gICAgdGhpcy5mYWlsdXJlcy5wdXNoKHtcbiAgICAgIGZpbGVQYXRoOiB0aGlzLmZpbGVTeXN0ZW0ucmVzb2x2ZShzb3VyY2VGaWxlLmZpbGVOYW1lKSxcbiAgICAgIHBvc2l0aW9uOiB0cy5nZXRMaW5lQW5kQ2hhcmFjdGVyT2ZQb3NpdGlvbihzb3VyY2VGaWxlLCBub2RlLmdldFN0YXJ0KCkpLFxuICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICB9KTtcbiAgfVxufVxuIl19