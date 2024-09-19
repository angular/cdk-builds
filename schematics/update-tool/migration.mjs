"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration = void 0;
const ts = require("typescript");
class Migration {
    program;
    typeChecker;
    targetVersion;
    context;
    upgradeData;
    fileSystem;
    logger;
    /** List of migration failures that need to be reported. */
    failures = [];
    constructor(
    /** TypeScript program for the migration. */
    program, 
    /** TypeChecker instance for the analysis program. */
    typeChecker, 
    /**
     * Version for which the migration rule should run. Null if the migration
     * is invoked manually.
     */
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL3VwZGF0ZS10b29sL21pZ3JhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCxpQ0FBaUM7QUF1QmpDLE1BQXNCLFNBQVM7SUFTcEI7SUFFQTtJQUtBO0lBRUE7SUFFQTtJQUVBO0lBRUE7SUF2QlQsMkRBQTJEO0lBQzNELFFBQVEsR0FBdUIsRUFBRSxDQUFDO0lBS2xDO0lBQ0UsNENBQTRDO0lBQ3JDLE9BQW1CO0lBQzFCLHFEQUFxRDtJQUM5QyxXQUEyQjtJQUNsQzs7O09BR0c7SUFDSSxhQUFtQztJQUMxQyxzQ0FBc0M7SUFDL0IsT0FBZ0I7SUFDdkIsNENBQTRDO0lBQ3JDLFdBQWlCO0lBQ3hCLHdEQUF3RDtJQUNqRCxVQUFzQjtJQUM3QiwwRUFBMEU7SUFDbkUsTUFBb0I7UUFmcEIsWUFBTyxHQUFQLE9BQU8sQ0FBWTtRQUVuQixnQkFBVyxHQUFYLFdBQVcsQ0FBZ0I7UUFLM0Isa0JBQWEsR0FBYixhQUFhLENBQXNCO1FBRW5DLFlBQU8sR0FBUCxPQUFPLENBQVM7UUFFaEIsZ0JBQVcsR0FBWCxXQUFXLENBQU07UUFFakIsZUFBVSxHQUFWLFVBQVUsQ0FBWTtRQUV0QixXQUFNLEdBQU4sTUFBTSxDQUFjO0lBQzFCLENBQUM7SUFFSixvRUFBb0U7SUFDcEUsSUFBSSxLQUFVLENBQUM7SUFFZjs7O09BR0c7SUFDSCxZQUFZLEtBQVUsQ0FBQztJQUV2Qjs7Ozs7T0FLRztJQUNILFNBQVMsQ0FBQyxJQUFhLElBQVMsQ0FBQztJQUVqQywyRUFBMkU7SUFDM0UsYUFBYSxDQUFDLFFBQTBCLElBQVMsQ0FBQztJQUVsRCxxRUFBcUU7SUFDckUsZUFBZSxDQUFDLFVBQTRCLElBQVMsQ0FBQztJQUV0RCw2RUFBNkU7SUFDbkUsbUJBQW1CLENBQUMsSUFBYSxFQUFFLE9BQWU7UUFDMUQsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3hDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO1lBQ2pCLFFBQVEsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDO1lBQ3RELFFBQVEsRUFBRSxFQUFFLENBQUMsNkJBQTZCLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUN2RSxPQUFPLEVBQUUsT0FBTztTQUNqQixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUEzREQsOEJBMkRDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuZGV2L2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7UmVzb2x2ZWRSZXNvdXJjZX0gZnJvbSAnLi9jb21wb25lbnQtcmVzb3VyY2UtY29sbGVjdG9yJztcbmltcG9ydCB7RmlsZVN5c3RlbSwgV29ya3NwYWNlUGF0aH0gZnJvbSAnLi9maWxlLXN5c3RlbSc7XG5pbXBvcnQge1VwZGF0ZUxvZ2dlcn0gZnJvbSAnLi9sb2dnZXInO1xuaW1wb3J0IHtUYXJnZXRWZXJzaW9ufSBmcm9tICcuL3RhcmdldC12ZXJzaW9uJztcbmltcG9ydCB7TGluZUFuZENoYXJhY3Rlcn0gZnJvbSAnLi91dGlscy9saW5lLW1hcHBpbmdzJztcblxuZXhwb3J0IGludGVyZmFjZSBNaWdyYXRpb25GYWlsdXJlIHtcbiAgZmlsZVBhdGg6IFdvcmtzcGFjZVBhdGg7XG4gIG1lc3NhZ2U6IHN0cmluZztcbiAgcG9zaXRpb24/OiBMaW5lQW5kQ2hhcmFjdGVyO1xufVxuXG5leHBvcnQgdHlwZSBQb3N0TWlncmF0aW9uQWN0aW9uID0gdm9pZCB8IHtcbiAgLyoqIFdoZXRoZXIgdGhlIHBhY2thZ2UgbWFuYWdlciBzaG91bGQgcnVuIHVwb24gbWlncmF0aW9uIGNvbXBsZXRpb24uICovXG4gIHJ1blBhY2thZ2VNYW5hZ2VyOiBib29sZWFuO1xufTtcblxuLyoqIENyZWF0ZXMgYSBjb25zdHJ1Y3RvciB0eXBlIGZvciB0aGUgc3BlY2lmaWVkIHR5cGUuICovXG5leHBvcnQgdHlwZSBDb25zdHJ1Y3RvcjxUPiA9IG5ldyAoLi4uYXJnczogYW55W10pID0+IFQ7XG4vKiogR2V0cyBhIGNvbnN0cnVjdG9yIHR5cGUgZm9yIHRoZSBwYXNzZWQgbWlncmF0aW9uIGRhdGEuICovXG5leHBvcnQgdHlwZSBNaWdyYXRpb25DdG9yPERhdGEsIENvbnRleHQgPSBhbnk+ID0gQ29uc3RydWN0b3I8TWlncmF0aW9uPERhdGEsIENvbnRleHQ+PjtcblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE1pZ3JhdGlvbjxEYXRhLCBDb250ZXh0ID0gYW55PiB7XG4gIC8qKiBMaXN0IG9mIG1pZ3JhdGlvbiBmYWlsdXJlcyB0aGF0IG5lZWQgdG8gYmUgcmVwb3J0ZWQuICovXG4gIGZhaWx1cmVzOiBNaWdyYXRpb25GYWlsdXJlW10gPSBbXTtcblxuICAvKiogV2hldGhlciB0aGUgbWlncmF0aW9uIGlzIGVuYWJsZWQgb3Igbm90LiAqL1xuICBhYnN0cmFjdCBlbmFibGVkOiBib29sZWFuO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIC8qKiBUeXBlU2NyaXB0IHByb2dyYW0gZm9yIHRoZSBtaWdyYXRpb24uICovXG4gICAgcHVibGljIHByb2dyYW06IHRzLlByb2dyYW0sXG4gICAgLyoqIFR5cGVDaGVja2VyIGluc3RhbmNlIGZvciB0aGUgYW5hbHlzaXMgcHJvZ3JhbS4gKi9cbiAgICBwdWJsaWMgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLFxuICAgIC8qKlxuICAgICAqIFZlcnNpb24gZm9yIHdoaWNoIHRoZSBtaWdyYXRpb24gcnVsZSBzaG91bGQgcnVuLiBOdWxsIGlmIHRoZSBtaWdyYXRpb25cbiAgICAgKiBpcyBpbnZva2VkIG1hbnVhbGx5LlxuICAgICAqL1xuICAgIHB1YmxpYyB0YXJnZXRWZXJzaW9uOiBUYXJnZXRWZXJzaW9uIHwgbnVsbCxcbiAgICAvKiogQ29udGV4dCBkYXRhIGZvciB0aGUgbWlncmF0aW9uLiAqL1xuICAgIHB1YmxpYyBjb250ZXh0OiBDb250ZXh0LFxuICAgIC8qKiBVcGdyYWRlIGRhdGEgcGFzc2VkIHRvIHRoZSBtaWdyYXRpb24uICovXG4gICAgcHVibGljIHVwZ3JhZGVEYXRhOiBEYXRhLFxuICAgIC8qKiBGaWxlIHN5c3RlbSB0aGF0IGNhbiBiZSB1c2VkIGZvciBtb2RpZnlpbmcgZmlsZXMuICovXG4gICAgcHVibGljIGZpbGVTeXN0ZW06IEZpbGVTeXN0ZW0sXG4gICAgLyoqIExvZ2dlciB0aGF0IGNhbiBiZSB1c2VkIHRvIHByaW50IG1lc3NhZ2VzIGFzIHBhcnQgb2YgdGhlIG1pZ3JhdGlvbi4gKi9cbiAgICBwdWJsaWMgbG9nZ2VyOiBVcGRhdGVMb2dnZXIsXG4gICkge31cblxuICAvKiogTWV0aG9kIGNhbiBiZSB1c2VkIHRvIHBlcmZvcm0gZ2xvYmFsIGFuYWx5c2lzIG9mIHRoZSBwcm9ncmFtLiAqL1xuICBpbml0KCk6IHZvaWQge31cblxuICAvKipcbiAgICogTWV0aG9kIHRoYXQgd2lsbCBiZSBjYWxsZWQgb25jZSBhbGwgbm9kZXMsIHRlbXBsYXRlcyBhbmQgc3R5bGVzaGVldHNcbiAgICogaGF2ZSBiZWVuIHZpc2l0ZWQuXG4gICAqL1xuICBwb3N0QW5hbHlzaXMoKTogdm9pZCB7fVxuXG4gIC8qKlxuICAgKiBNZXRob2QgdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBub2RlIGluIGEgZ2l2ZW4gc291cmNlIGZpbGUuIFVubGlrZSB0c2xpbnQsIHRoaXNcbiAgICogZnVuY3Rpb24gd2lsbCBvbmx5IHJldHJpZXZlIFR5cGVTY3JpcHQgbm9kZXMgdGhhdCBuZWVkIHRvIGJlIGNhc3RlZCBtYW51YWxseS4gVGhpc1xuICAgKiBhbGxvd3MgdXMgdG8gb25seSB3YWxrIHRoZSBwcm9ncmFtIHNvdXJjZSBmaWxlcyBvbmNlIHBlciBwcm9ncmFtIGFuZCBub3QgcGVyXG4gICAqIG1pZ3JhdGlvbiBydWxlIChzaWduaWZpY2FudCBwZXJmb3JtYW5jZSBib29zdCkuXG4gICAqL1xuICB2aXNpdE5vZGUobm9kZTogdHMuTm9kZSk6IHZvaWQge31cblxuICAvKiogTWV0aG9kIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggQW5ndWxhciB0ZW1wbGF0ZSBpbiB0aGUgcHJvZ3JhbS4gKi9cbiAgdmlzaXRUZW1wbGF0ZSh0ZW1wbGF0ZTogUmVzb2x2ZWRSZXNvdXJjZSk6IHZvaWQge31cblxuICAvKiogTWV0aG9kIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggc3R5bGVzaGVldCBpbiB0aGUgcHJvZ3JhbS4gKi9cbiAgdmlzaXRTdHlsZXNoZWV0KHN0eWxlc2hlZXQ6IFJlc29sdmVkUmVzb3VyY2UpOiB2b2lkIHt9XG5cbiAgLyoqIENyZWF0ZXMgYSBmYWlsdXJlIHdpdGggYSBzcGVjaWZpZWQgbWVzc2FnZSBhdCB0aGUgZ2l2ZW4gbm9kZSBsb2NhdGlvbi4gKi9cbiAgcHJvdGVjdGVkIGNyZWF0ZUZhaWx1cmVBdE5vZGUobm9kZTogdHMuTm9kZSwgbWVzc2FnZTogc3RyaW5nKSB7XG4gICAgY29uc3Qgc291cmNlRmlsZSA9IG5vZGUuZ2V0U291cmNlRmlsZSgpO1xuICAgIHRoaXMuZmFpbHVyZXMucHVzaCh7XG4gICAgICBmaWxlUGF0aDogdGhpcy5maWxlU3lzdGVtLnJlc29sdmUoc291cmNlRmlsZS5maWxlTmFtZSksXG4gICAgICBwb3NpdGlvbjogdHMuZ2V0TGluZUFuZENoYXJhY3Rlck9mUG9zaXRpb24oc291cmNlRmlsZSwgbm9kZS5nZXRTdGFydCgpKSxcbiAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==