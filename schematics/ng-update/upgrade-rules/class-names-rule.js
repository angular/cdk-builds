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
        define("@angular/cdk/schematics/ng-update/upgrade-rules/class-names-rule", ["require", "exports", "typescript", "@angular/cdk/schematics/update-tool/migration-rule", "@angular/cdk/schematics/ng-update/typescript/imports", "@angular/cdk/schematics/ng-update/typescript/module-specifiers", "@angular/cdk/schematics/ng-update/upgrade-data"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const migration_rule_1 = require("@angular/cdk/schematics/update-tool/migration-rule");
    const imports_1 = require("@angular/cdk/schematics/ng-update/typescript/imports");
    const module_specifiers_1 = require("@angular/cdk/schematics/ng-update/typescript/module-specifiers");
    const upgrade_data_1 = require("@angular/cdk/schematics/ng-update/upgrade-data");
    /**
     * Rule that walks through every identifier that is part of Angular Material or thr CDK
     * and replaces the outdated name with the new one if specified in the upgrade data.
     */
    class ClassNamesRule extends migration_rule_1.MigrationRule {
        constructor() {
            super(...arguments);
            /** Change data that upgrades to the specified target version. */
            this.data = upgrade_data_1.getVersionUpgradeData(this, 'classNames');
            /**
             * List of identifier names that have been imported from `@angular/material` or `@angular/cdk`
             * in the current source file and therefore can be considered trusted.
             */
            this.trustedIdentifiers = new Set();
            /** List of namespaces that have been imported from `@angular/material` or `@angular/cdk`. */
            this.trustedNamespaces = new Set();
            // Only enable the migration rule if there is upgrade data.
            this.ruleEnabled = this.data.length !== 0;
        }
        visitNode(node) {
            if (ts.isIdentifier(node)) {
                this._visitIdentifier(node);
            }
        }
        /** Method that is called for every identifier inside of the specified project. */
        _visitIdentifier(identifier) {
            // For identifiers that aren't listed in the className data, the whole check can be
            // skipped safely.
            if (!this.data.some(data => data.replace === identifier.text)) {
                return;
            }
            // For namespace imports that are referring to Angular Material or the CDK, we store the
            // namespace name in order to be able to safely find identifiers that don't belong to the
            // developer's application.
            if (imports_1.isNamespaceImportNode(identifier) && module_specifiers_1.isMaterialImportDeclaration(identifier)) {
                this.trustedNamespaces.add(identifier.text);
                return this._createFailureWithReplacement(identifier);
            }
            // For export declarations that are referring to Angular Material or the CDK, the identifier
            // can be immediately updated to the new name.
            if (imports_1.isExportSpecifierNode(identifier) && module_specifiers_1.isMaterialExportDeclaration(identifier)) {
                return this._createFailureWithReplacement(identifier);
            }
            // For import declarations that are referring to Angular Material or the CDK, the name of
            // the import identifiers. This allows us to identify identifiers that belong to Material and
            // the CDK, and we won't accidentally touch a developer's identifier.
            if (imports_1.isImportSpecifierNode(identifier) && module_specifiers_1.isMaterialImportDeclaration(identifier)) {
                this.trustedIdentifiers.add(identifier.text);
                return this._createFailureWithReplacement(identifier);
            }
            // In case the identifier is part of a property access expression, we need to verify that the
            // property access originates from a namespace that has been imported from Material or the CDK.
            if (ts.isPropertyAccessExpression(identifier.parent)) {
                const expression = identifier.parent.expression;
                if (ts.isIdentifier(expression) && this.trustedNamespaces.has(expression.text)) {
                    return this._createFailureWithReplacement(identifier);
                }
            }
            else if (this.trustedIdentifiers.has(identifier.text)) {
                return this._createFailureWithReplacement(identifier);
            }
        }
        /** Creates a failure and replacement for the specified identifier. */
        _createFailureWithReplacement(identifier) {
            const classData = this.data.find(data => data.replace === identifier.text);
            const updateRecorder = this.getUpdateRecorder(identifier.getSourceFile().fileName);
            updateRecorder.remove(identifier.getStart(), identifier.getWidth());
            updateRecorder.insertRight(identifier.getStart(), classData.replaceWith);
        }
    }
    exports.ClassNamesRule = ClassNamesRule;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhc3MtbmFtZXMtcnVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2NoZW1hdGljcy9uZy11cGRhdGUvdXBncmFkZS1ydWxlcy9jbGFzcy1uYW1lcy1ydWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsaUNBQWlDO0lBQ2pDLHVGQUErRDtJQUcvRCxrRkFJK0I7SUFDL0Isc0dBR3lDO0lBQ3pDLGlGQUF1RTtJQUV2RTs7O09BR0c7SUFDSCxNQUFhLGNBQWUsU0FBUSw4QkFBOEI7UUFBbEU7O1lBQ0UsaUVBQWlFO1lBQ2pFLFNBQUksR0FBMkIsb0NBQXFCLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBRXpFOzs7ZUFHRztZQUNILHVCQUFrQixHQUFnQixJQUFJLEdBQUcsRUFBRSxDQUFDO1lBRTVDLDZGQUE2RjtZQUM3RixzQkFBaUIsR0FBZ0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUUzQywyREFBMkQ7WUFDM0QsZ0JBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7UUE2RHZDLENBQUM7UUEzREMsU0FBUyxDQUFDLElBQWE7WUFDckIsSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN6QixJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDN0I7UUFDSCxDQUFDO1FBRUQsa0ZBQWtGO1FBQzFFLGdCQUFnQixDQUFDLFVBQXlCO1lBQ2hELG1GQUFtRjtZQUNuRixrQkFBa0I7WUFDbEIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sS0FBSyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQzdELE9BQU87YUFDUjtZQUVELHdGQUF3RjtZQUN4Rix5RkFBeUY7WUFDekYsMkJBQTJCO1lBQzNCLElBQUksK0JBQXFCLENBQUMsVUFBVSxDQUFDLElBQUksK0NBQTJCLENBQUMsVUFBVSxDQUFDLEVBQUU7Z0JBQ2hGLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUU1QyxPQUFPLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxVQUFVLENBQUMsQ0FBQzthQUN2RDtZQUVELDRGQUE0RjtZQUM1Riw4Q0FBOEM7WUFDOUMsSUFBSSwrQkFBcUIsQ0FBQyxVQUFVLENBQUMsSUFBSSwrQ0FBMkIsQ0FBQyxVQUFVLENBQUMsRUFBRTtnQkFDaEYsT0FBTyxJQUFJLENBQUMsNkJBQTZCLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDdkQ7WUFFRCx5RkFBeUY7WUFDekYsNkZBQTZGO1lBQzdGLHFFQUFxRTtZQUNyRSxJQUFJLCtCQUFxQixDQUFDLFVBQVUsQ0FBQyxJQUFJLCtDQUEyQixDQUFDLFVBQVUsQ0FBQyxFQUFFO2dCQUNoRixJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFN0MsT0FBTyxJQUFJLENBQUMsNkJBQTZCLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDdkQ7WUFFRCw2RkFBNkY7WUFDN0YsK0ZBQStGO1lBQy9GLElBQUksRUFBRSxDQUFDLDBCQUEwQixDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDcEQsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUM7Z0JBRWhELElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDOUUsT0FBTyxJQUFJLENBQUMsNkJBQTZCLENBQUMsVUFBVSxDQUFDLENBQUM7aUJBQ3ZEO2FBQ0Y7aUJBQU0sSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDdkQsT0FBTyxJQUFJLENBQUMsNkJBQTZCLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDdkQ7UUFDSCxDQUFDO1FBRUQsc0VBQXNFO1FBQzlELDZCQUE2QixDQUFDLFVBQXlCO1lBQzdELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sS0FBSyxVQUFVLENBQUMsSUFBSSxDQUFFLENBQUM7WUFDNUUsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUVuRixjQUFjLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUNwRSxjQUFjLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDM0UsQ0FBQztLQUNGO0lBM0VELHdDQTJFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7TWlncmF0aW9uUnVsZX0gZnJvbSAnLi4vLi4vdXBkYXRlLXRvb2wvbWlncmF0aW9uLXJ1bGUnO1xuXG5pbXBvcnQge0NsYXNzTmFtZVVwZ3JhZGVEYXRhfSBmcm9tICcuLi9kYXRhJztcbmltcG9ydCB7XG4gIGlzRXhwb3J0U3BlY2lmaWVyTm9kZSxcbiAgaXNJbXBvcnRTcGVjaWZpZXJOb2RlLFxuICBpc05hbWVzcGFjZUltcG9ydE5vZGUsXG59IGZyb20gJy4uL3R5cGVzY3JpcHQvaW1wb3J0cyc7XG5pbXBvcnQge1xuICBpc01hdGVyaWFsRXhwb3J0RGVjbGFyYXRpb24sXG4gIGlzTWF0ZXJpYWxJbXBvcnREZWNsYXJhdGlvbixcbn0gZnJvbSAnLi4vdHlwZXNjcmlwdC9tb2R1bGUtc3BlY2lmaWVycyc7XG5pbXBvcnQge2dldFZlcnNpb25VcGdyYWRlRGF0YSwgUnVsZVVwZ3JhZGVEYXRhfSBmcm9tICcuLi91cGdyYWRlLWRhdGEnO1xuXG4vKipcbiAqIFJ1bGUgdGhhdCB3YWxrcyB0aHJvdWdoIGV2ZXJ5IGlkZW50aWZpZXIgdGhhdCBpcyBwYXJ0IG9mIEFuZ3VsYXIgTWF0ZXJpYWwgb3IgdGhyIENES1xuICogYW5kIHJlcGxhY2VzIHRoZSBvdXRkYXRlZCBuYW1lIHdpdGggdGhlIG5ldyBvbmUgaWYgc3BlY2lmaWVkIGluIHRoZSB1cGdyYWRlIGRhdGEuXG4gKi9cbmV4cG9ydCBjbGFzcyBDbGFzc05hbWVzUnVsZSBleHRlbmRzIE1pZ3JhdGlvblJ1bGU8UnVsZVVwZ3JhZGVEYXRhPiB7XG4gIC8qKiBDaGFuZ2UgZGF0YSB0aGF0IHVwZ3JhZGVzIHRvIHRoZSBzcGVjaWZpZWQgdGFyZ2V0IHZlcnNpb24uICovXG4gIGRhdGE6IENsYXNzTmFtZVVwZ3JhZGVEYXRhW10gPSBnZXRWZXJzaW9uVXBncmFkZURhdGEodGhpcywgJ2NsYXNzTmFtZXMnKTtcblxuICAvKipcbiAgICogTGlzdCBvZiBpZGVudGlmaWVyIG5hbWVzIHRoYXQgaGF2ZSBiZWVuIGltcG9ydGVkIGZyb20gYEBhbmd1bGFyL21hdGVyaWFsYCBvciBgQGFuZ3VsYXIvY2RrYFxuICAgKiBpbiB0aGUgY3VycmVudCBzb3VyY2UgZmlsZSBhbmQgdGhlcmVmb3JlIGNhbiBiZSBjb25zaWRlcmVkIHRydXN0ZWQuXG4gICAqL1xuICB0cnVzdGVkSWRlbnRpZmllcnM6IFNldDxzdHJpbmc+ID0gbmV3IFNldCgpO1xuXG4gIC8qKiBMaXN0IG9mIG5hbWVzcGFjZXMgdGhhdCBoYXZlIGJlZW4gaW1wb3J0ZWQgZnJvbSBgQGFuZ3VsYXIvbWF0ZXJpYWxgIG9yIGBAYW5ndWxhci9jZGtgLiAqL1xuICB0cnVzdGVkTmFtZXNwYWNlczogU2V0PHN0cmluZz4gPSBuZXcgU2V0KCk7XG5cbiAgLy8gT25seSBlbmFibGUgdGhlIG1pZ3JhdGlvbiBydWxlIGlmIHRoZXJlIGlzIHVwZ3JhZGUgZGF0YS5cbiAgcnVsZUVuYWJsZWQgPSB0aGlzLmRhdGEubGVuZ3RoICE9PSAwO1xuXG4gIHZpc2l0Tm9kZShub2RlOiB0cy5Ob2RlKTogdm9pZCB7XG4gICAgaWYgKHRzLmlzSWRlbnRpZmllcihub2RlKSkge1xuICAgICAgdGhpcy5fdmlzaXRJZGVudGlmaWVyKG5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBNZXRob2QgdGhhdCBpcyBjYWxsZWQgZm9yIGV2ZXJ5IGlkZW50aWZpZXIgaW5zaWRlIG9mIHRoZSBzcGVjaWZpZWQgcHJvamVjdC4gKi9cbiAgcHJpdmF0ZSBfdmlzaXRJZGVudGlmaWVyKGlkZW50aWZpZXI6IHRzLklkZW50aWZpZXIpIHtcbiAgICAvLyBGb3IgaWRlbnRpZmllcnMgdGhhdCBhcmVuJ3QgbGlzdGVkIGluIHRoZSBjbGFzc05hbWUgZGF0YSwgdGhlIHdob2xlIGNoZWNrIGNhbiBiZVxuICAgIC8vIHNraXBwZWQgc2FmZWx5LlxuICAgIGlmICghdGhpcy5kYXRhLnNvbWUoZGF0YSA9PiBkYXRhLnJlcGxhY2UgPT09IGlkZW50aWZpZXIudGV4dCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBGb3IgbmFtZXNwYWNlIGltcG9ydHMgdGhhdCBhcmUgcmVmZXJyaW5nIHRvIEFuZ3VsYXIgTWF0ZXJpYWwgb3IgdGhlIENESywgd2Ugc3RvcmUgdGhlXG4gICAgLy8gbmFtZXNwYWNlIG5hbWUgaW4gb3JkZXIgdG8gYmUgYWJsZSB0byBzYWZlbHkgZmluZCBpZGVudGlmaWVycyB0aGF0IGRvbid0IGJlbG9uZyB0byB0aGVcbiAgICAvLyBkZXZlbG9wZXIncyBhcHBsaWNhdGlvbi5cbiAgICBpZiAoaXNOYW1lc3BhY2VJbXBvcnROb2RlKGlkZW50aWZpZXIpICYmIGlzTWF0ZXJpYWxJbXBvcnREZWNsYXJhdGlvbihpZGVudGlmaWVyKSkge1xuICAgICAgdGhpcy50cnVzdGVkTmFtZXNwYWNlcy5hZGQoaWRlbnRpZmllci50ZXh0KTtcblxuICAgICAgcmV0dXJuIHRoaXMuX2NyZWF0ZUZhaWx1cmVXaXRoUmVwbGFjZW1lbnQoaWRlbnRpZmllcik7XG4gICAgfVxuXG4gICAgLy8gRm9yIGV4cG9ydCBkZWNsYXJhdGlvbnMgdGhhdCBhcmUgcmVmZXJyaW5nIHRvIEFuZ3VsYXIgTWF0ZXJpYWwgb3IgdGhlIENESywgdGhlIGlkZW50aWZpZXJcbiAgICAvLyBjYW4gYmUgaW1tZWRpYXRlbHkgdXBkYXRlZCB0byB0aGUgbmV3IG5hbWUuXG4gICAgaWYgKGlzRXhwb3J0U3BlY2lmaWVyTm9kZShpZGVudGlmaWVyKSAmJiBpc01hdGVyaWFsRXhwb3J0RGVjbGFyYXRpb24oaWRlbnRpZmllcikpIHtcbiAgICAgIHJldHVybiB0aGlzLl9jcmVhdGVGYWlsdXJlV2l0aFJlcGxhY2VtZW50KGlkZW50aWZpZXIpO1xuICAgIH1cblxuICAgIC8vIEZvciBpbXBvcnQgZGVjbGFyYXRpb25zIHRoYXQgYXJlIHJlZmVycmluZyB0byBBbmd1bGFyIE1hdGVyaWFsIG9yIHRoZSBDREssIHRoZSBuYW1lIG9mXG4gICAgLy8gdGhlIGltcG9ydCBpZGVudGlmaWVycy4gVGhpcyBhbGxvd3MgdXMgdG8gaWRlbnRpZnkgaWRlbnRpZmllcnMgdGhhdCBiZWxvbmcgdG8gTWF0ZXJpYWwgYW5kXG4gICAgLy8gdGhlIENESywgYW5kIHdlIHdvbid0IGFjY2lkZW50YWxseSB0b3VjaCBhIGRldmVsb3BlcidzIGlkZW50aWZpZXIuXG4gICAgaWYgKGlzSW1wb3J0U3BlY2lmaWVyTm9kZShpZGVudGlmaWVyKSAmJiBpc01hdGVyaWFsSW1wb3J0RGVjbGFyYXRpb24oaWRlbnRpZmllcikpIHtcbiAgICAgIHRoaXMudHJ1c3RlZElkZW50aWZpZXJzLmFkZChpZGVudGlmaWVyLnRleHQpO1xuXG4gICAgICByZXR1cm4gdGhpcy5fY3JlYXRlRmFpbHVyZVdpdGhSZXBsYWNlbWVudChpZGVudGlmaWVyKTtcbiAgICB9XG5cbiAgICAvLyBJbiBjYXNlIHRoZSBpZGVudGlmaWVyIGlzIHBhcnQgb2YgYSBwcm9wZXJ0eSBhY2Nlc3MgZXhwcmVzc2lvbiwgd2UgbmVlZCB0byB2ZXJpZnkgdGhhdCB0aGVcbiAgICAvLyBwcm9wZXJ0eSBhY2Nlc3Mgb3JpZ2luYXRlcyBmcm9tIGEgbmFtZXNwYWNlIHRoYXQgaGFzIGJlZW4gaW1wb3J0ZWQgZnJvbSBNYXRlcmlhbCBvciB0aGUgQ0RLLlxuICAgIGlmICh0cy5pc1Byb3BlcnR5QWNjZXNzRXhwcmVzc2lvbihpZGVudGlmaWVyLnBhcmVudCkpIHtcbiAgICAgIGNvbnN0IGV4cHJlc3Npb24gPSBpZGVudGlmaWVyLnBhcmVudC5leHByZXNzaW9uO1xuXG4gICAgICBpZiAodHMuaXNJZGVudGlmaWVyKGV4cHJlc3Npb24pICYmIHRoaXMudHJ1c3RlZE5hbWVzcGFjZXMuaGFzKGV4cHJlc3Npb24udGV4dCkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NyZWF0ZUZhaWx1cmVXaXRoUmVwbGFjZW1lbnQoaWRlbnRpZmllcik7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0aGlzLnRydXN0ZWRJZGVudGlmaWVycy5oYXMoaWRlbnRpZmllci50ZXh0KSkge1xuICAgICAgcmV0dXJuIHRoaXMuX2NyZWF0ZUZhaWx1cmVXaXRoUmVwbGFjZW1lbnQoaWRlbnRpZmllcik7XG4gICAgfVxuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBmYWlsdXJlIGFuZCByZXBsYWNlbWVudCBmb3IgdGhlIHNwZWNpZmllZCBpZGVudGlmaWVyLiAqL1xuICBwcml2YXRlIF9jcmVhdGVGYWlsdXJlV2l0aFJlcGxhY2VtZW50KGlkZW50aWZpZXI6IHRzLklkZW50aWZpZXIpIHtcbiAgICBjb25zdCBjbGFzc0RhdGEgPSB0aGlzLmRhdGEuZmluZChkYXRhID0+IGRhdGEucmVwbGFjZSA9PT0gaWRlbnRpZmllci50ZXh0KSE7XG4gICAgY29uc3QgdXBkYXRlUmVjb3JkZXIgPSB0aGlzLmdldFVwZGF0ZVJlY29yZGVyKGlkZW50aWZpZXIuZ2V0U291cmNlRmlsZSgpLmZpbGVOYW1lKTtcblxuICAgIHVwZGF0ZVJlY29yZGVyLnJlbW92ZShpZGVudGlmaWVyLmdldFN0YXJ0KCksIGlkZW50aWZpZXIuZ2V0V2lkdGgoKSk7XG4gICAgdXBkYXRlUmVjb3JkZXIuaW5zZXJ0UmlnaHQoaWRlbnRpZmllci5nZXRTdGFydCgpLCBjbGFzc0RhdGEucmVwbGFjZVdpdGgpO1xuICB9XG59XG4iXX0=