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
        constructor(program, typeChecker, targetVersion, upgradeData) {
            this.program = program;
            this.typeChecker = typeChecker;
            this.targetVersion = targetVersion;
            this.upgradeData = upgradeData;
            /** List of migration failures that need to be reported. */
            this.failures = [];
            /** Whether the migration rule is enabled or not. */
            this.ruleEnabled = true;
        }
        /** Method can be used to perform global analysis of the program. */
        init() { }
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
        /** Gets the update recorder for a given source file or resolved template. */
        getUpdateRecorder(filePath) {
            throw new Error('MigrationRule#getUpdateRecorder is not implemented.');
        }
        /** Creates a failure with a specified message at the given node location. */
        createFailureAtNode(node, message) {
            const sourceFile = node.getSourceFile();
            this.failures.push({
                filePath: sourceFile.fileName,
                position: ts.getLineAndCharacterOfPosition(sourceFile, node.getStart()),
                message: message,
            });
        }
    }
    exports.MigrationRule = MigrationRule;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9uLXJ1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXBkYXRlLXRvb2wvbWlncmF0aW9uLXJ1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFHSCxpQ0FBaUM7SUFXakMsTUFBYSxhQUFhO1FBT3hCLFlBQ1csT0FBbUIsRUFBUyxXQUEyQixFQUN2RCxhQUE0QixFQUFTLFdBQWM7WUFEbkQsWUFBTyxHQUFQLE9BQU8sQ0FBWTtZQUFTLGdCQUFXLEdBQVgsV0FBVyxDQUFnQjtZQUN2RCxrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUFTLGdCQUFXLEdBQVgsV0FBVyxDQUFHO1lBUjlELDJEQUEyRDtZQUMzRCxhQUFRLEdBQXVCLEVBQUUsQ0FBQztZQUVsQyxvREFBb0Q7WUFDcEQsZ0JBQVcsR0FBRyxJQUFJLENBQUM7UUFJOEMsQ0FBQztRQUVsRSxvRUFBb0U7UUFDcEUsSUFBSSxLQUFVLENBQUM7UUFFZjs7Ozs7V0FLRztRQUNILFNBQVMsQ0FBQyxJQUFhLElBQVMsQ0FBQztRQUVqQywyRUFBMkU7UUFDM0UsYUFBYSxDQUFDLFFBQTBCLElBQVMsQ0FBQztRQUVsRCxxRUFBcUU7UUFDckUsZUFBZSxDQUFDLFVBQTRCLElBQVMsQ0FBQztRQUV0RCw2RUFBNkU7UUFDN0UsaUJBQWlCLENBQUMsUUFBZ0I7WUFDaEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxxREFBcUQsQ0FBQyxDQUFDO1FBQ3pFLENBQUM7UUFFRCw2RUFBNkU7UUFDN0UsbUJBQW1CLENBQUMsSUFBYSxFQUFFLE9BQWU7WUFDaEQsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3hDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO2dCQUNqQixRQUFRLEVBQUUsVUFBVSxDQUFDLFFBQVE7Z0JBQzdCLFFBQVEsRUFBRSxFQUFFLENBQUMsNkJBQTZCLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDdkUsT0FBTyxFQUFFLE9BQU87YUFDakIsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUNGO0lBMUNELHNDQTBDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1VwZGF0ZVJlY29yZGVyfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7UmVzb2x2ZWRSZXNvdXJjZX0gZnJvbSAnLi9jb21wb25lbnQtcmVzb3VyY2UtY29sbGVjdG9yJztcbmltcG9ydCB7VGFyZ2V0VmVyc2lvbn0gZnJvbSAnLi90YXJnZXQtdmVyc2lvbic7XG5pbXBvcnQge0xpbmVBbmRDaGFyYWN0ZXJ9IGZyb20gJy4vdXRpbHMvbGluZS1tYXBwaW5ncyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWlncmF0aW9uRmFpbHVyZSB7XG4gIGZpbGVQYXRoOiBzdHJpbmc7XG4gIG1lc3NhZ2U6IHN0cmluZztcbiAgcG9zaXRpb246IExpbmVBbmRDaGFyYWN0ZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBNaWdyYXRpb25SdWxlPFQ+IHtcbiAgLyoqIExpc3Qgb2YgbWlncmF0aW9uIGZhaWx1cmVzIHRoYXQgbmVlZCB0byBiZSByZXBvcnRlZC4gKi9cbiAgZmFpbHVyZXM6IE1pZ3JhdGlvbkZhaWx1cmVbXSA9IFtdO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBtaWdyYXRpb24gcnVsZSBpcyBlbmFibGVkIG9yIG5vdC4gKi9cbiAgcnVsZUVuYWJsZWQgPSB0cnVlO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIHByb2dyYW06IHRzLlByb2dyYW0sIHB1YmxpYyB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsXG4gICAgICBwdWJsaWMgdGFyZ2V0VmVyc2lvbjogVGFyZ2V0VmVyc2lvbiwgcHVibGljIHVwZ3JhZGVEYXRhOiBUKSB7fVxuXG4gIC8qKiBNZXRob2QgY2FuIGJlIHVzZWQgdG8gcGVyZm9ybSBnbG9iYWwgYW5hbHlzaXMgb2YgdGhlIHByb2dyYW0uICovXG4gIGluaXQoKTogdm9pZCB7fVxuXG4gIC8qKlxuICAgKiBNZXRob2QgdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBub2RlIGluIGEgZ2l2ZW4gc291cmNlIGZpbGUuIFVubGlrZSB0c2xpbnQsIHRoaXNcbiAgICogZnVuY3Rpb24gd2lsbCBvbmx5IHJldHJpZXZlIFR5cGVTY3JpcHQgbm9kZXMgdGhhdCBuZWVkIHRvIGJlIGNhc3RlZCBtYW51YWxseS4gVGhpc1xuICAgKiBhbGxvd3MgdXMgdG8gb25seSB3YWxrIHRoZSBwcm9ncmFtIHNvdXJjZSBmaWxlcyBvbmNlIHBlciBwcm9ncmFtIGFuZCBub3QgcGVyXG4gICAqIG1pZ3JhdGlvbiBydWxlIChzaWduaWZpY2FudCBwZXJmb3JtYW5jZSBib29zdCkuXG4gICAqL1xuICB2aXNpdE5vZGUobm9kZTogdHMuTm9kZSk6IHZvaWQge31cblxuICAvKiogTWV0aG9kIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggQW5ndWxhciB0ZW1wbGF0ZSBpbiB0aGUgcHJvZ3JhbS4gKi9cbiAgdmlzaXRUZW1wbGF0ZSh0ZW1wbGF0ZTogUmVzb2x2ZWRSZXNvdXJjZSk6IHZvaWQge31cblxuICAvKiogTWV0aG9kIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggc3R5bGVzaGVldCBpbiB0aGUgcHJvZ3JhbS4gKi9cbiAgdmlzaXRTdHlsZXNoZWV0KHN0eWxlc2hlZXQ6IFJlc29sdmVkUmVzb3VyY2UpOiB2b2lkIHt9XG5cbiAgLyoqIEdldHMgdGhlIHVwZGF0ZSByZWNvcmRlciBmb3IgYSBnaXZlbiBzb3VyY2UgZmlsZSBvciByZXNvbHZlZCB0ZW1wbGF0ZS4gKi9cbiAgZ2V0VXBkYXRlUmVjb3JkZXIoZmlsZVBhdGg6IHN0cmluZyk6IFVwZGF0ZVJlY29yZGVyIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ01pZ3JhdGlvblJ1bGUjZ2V0VXBkYXRlUmVjb3JkZXIgaXMgbm90IGltcGxlbWVudGVkLicpO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBmYWlsdXJlIHdpdGggYSBzcGVjaWZpZWQgbWVzc2FnZSBhdCB0aGUgZ2l2ZW4gbm9kZSBsb2NhdGlvbi4gKi9cbiAgY3JlYXRlRmFpbHVyZUF0Tm9kZShub2RlOiB0cy5Ob2RlLCBtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBzb3VyY2VGaWxlID0gbm9kZS5nZXRTb3VyY2VGaWxlKCk7XG4gICAgdGhpcy5mYWlsdXJlcy5wdXNoKHtcbiAgICAgIGZpbGVQYXRoOiBzb3VyY2VGaWxlLmZpbGVOYW1lLFxuICAgICAgcG9zaXRpb246IHRzLmdldExpbmVBbmRDaGFyYWN0ZXJPZlBvc2l0aW9uKHNvdXJjZUZpbGUsIG5vZGUuZ2V0U3RhcnQoKSksXG4gICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgIH0pO1xuICB9XG59XG4iXX0=