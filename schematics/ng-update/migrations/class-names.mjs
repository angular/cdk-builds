"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassNamesMigration = void 0;
const ts = require("typescript");
const migration_1 = require("../../update-tool/migration");
const imports_1 = require("../typescript/imports");
const module_specifiers_1 = require("../typescript/module-specifiers");
const upgrade_data_1 = require("../upgrade-data");
/**
 * Migration that walks through every identifier that is part of Angular Material or thr CDK
 * and replaces the outdated name with the new one if specified in the upgrade data.
 */
// TODO: rework this rule to identify symbols using the import identifier resolver. This
// makes it more robust, less AST convoluted and is more TypeScript AST idiomatic. COMP-300.
class ClassNamesMigration extends migration_1.Migration {
    constructor() {
        super(...arguments);
        /** Change data that upgrades to the specified target version. */
        this.data = (0, upgrade_data_1.getVersionUpgradeData)(this, 'classNames');
        /**
         * List of identifier names that have been imported from `@angular/material` or `@angular/cdk`
         * in the current source file and therefore can be considered trusted.
         */
        this.trustedIdentifiers = new Set();
        /** List of namespaces that have been imported from `@angular/material` or `@angular/cdk`. */
        this.trustedNamespaces = new Set();
        // Only enable the migration rule if there is upgrade data.
        this.enabled = this.data.length !== 0;
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
        if ((0, imports_1.isNamespaceImportNode)(identifier) && (0, module_specifiers_1.isMaterialImportDeclaration)(identifier)) {
            this.trustedNamespaces.add(identifier.text);
            return this._createFailureWithReplacement(identifier);
        }
        // For export declarations that are referring to Angular Material or the CDK, the identifier
        // can be immediately updated to the new name.
        if ((0, imports_1.isExportSpecifierNode)(identifier) && (0, module_specifiers_1.isMaterialExportDeclaration)(identifier)) {
            return this._createFailureWithReplacement(identifier);
        }
        // For import declarations that are referring to Angular Material or the CDK, the name of
        // the import identifiers. This allows us to identify identifiers that belong to Material and
        // the CDK, and we won't accidentally touch a developer's identifier.
        if ((0, imports_1.isImportSpecifierNode)(identifier) && (0, module_specifiers_1.isMaterialImportDeclaration)(identifier)) {
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
        const filePath = this.fileSystem.resolve(identifier.getSourceFile().fileName);
        this.fileSystem.edit(filePath)
            .remove(identifier.getStart(), identifier.getWidth())
            .insertRight(identifier.getStart(), classData.replaceWith);
    }
}
exports.ClassNamesMigration = ClassNamesMigration;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhc3MtbmFtZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctdXBkYXRlL21pZ3JhdGlvbnMvY2xhc3MtbmFtZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsaUNBQWlDO0FBQ2pDLDJEQUFzRDtBQUd0RCxtREFJK0I7QUFDL0IsdUVBR3lDO0FBQ3pDLGtEQUFtRTtBQUVuRTs7O0dBR0c7QUFDSCx3RkFBd0Y7QUFDeEYsNEZBQTRGO0FBQzVGLE1BQWEsbUJBQW9CLFNBQVEscUJBQXNCO0lBQS9EOztRQUNFLGlFQUFpRTtRQUNqRSxTQUFJLEdBQTJCLElBQUEsb0NBQXFCLEVBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBRXpFOzs7V0FHRztRQUNILHVCQUFrQixHQUFnQixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBRTVDLDZGQUE2RjtRQUM3RixzQkFBaUIsR0FBZ0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUUzQywyREFBMkQ7UUFDM0QsWUFBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQztJQThEbkMsQ0FBQztJQTVEVSxTQUFTLENBQUMsSUFBYTtRQUM5QixJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDekIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzdCO0lBQ0gsQ0FBQztJQUVELGtGQUFrRjtJQUMxRSxnQkFBZ0IsQ0FBQyxVQUF5QjtRQUNoRCxtRkFBbUY7UUFDbkYsa0JBQWtCO1FBQ2xCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLEtBQUssVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQzdELE9BQU87U0FDUjtRQUVELHdGQUF3RjtRQUN4Rix5RkFBeUY7UUFDekYsMkJBQTJCO1FBQzNCLElBQUksSUFBQSwrQkFBcUIsRUFBQyxVQUFVLENBQUMsSUFBSSxJQUFBLCtDQUEyQixFQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQ2hGLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRTVDLE9BQU8sSUFBSSxDQUFDLDZCQUE2QixDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQ3ZEO1FBRUQsNEZBQTRGO1FBQzVGLDhDQUE4QztRQUM5QyxJQUFJLElBQUEsK0JBQXFCLEVBQUMsVUFBVSxDQUFDLElBQUksSUFBQSwrQ0FBMkIsRUFBQyxVQUFVLENBQUMsRUFBRTtZQUNoRixPQUFPLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUN2RDtRQUVELHlGQUF5RjtRQUN6Riw2RkFBNkY7UUFDN0YscUVBQXFFO1FBQ3JFLElBQUksSUFBQSwrQkFBcUIsRUFBQyxVQUFVLENBQUMsSUFBSSxJQUFBLCtDQUEyQixFQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQ2hGLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRTdDLE9BQU8sSUFBSSxDQUFDLDZCQUE2QixDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQ3ZEO1FBRUQsNkZBQTZGO1FBQzdGLCtGQUErRjtRQUMvRixJQUFJLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDcEQsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUM7WUFFaEQsSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUM5RSxPQUFPLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxVQUFVLENBQUMsQ0FBQzthQUN2RDtTQUNGO2FBQU0sSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUN2RCxPQUFPLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUN2RDtJQUNILENBQUM7SUFFRCxzRUFBc0U7SUFDOUQsNkJBQTZCLENBQUMsVUFBeUI7UUFDN0QsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxLQUFLLFVBQVUsQ0FBQyxJQUFJLENBQUUsQ0FBQztRQUM1RSxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsYUFBYSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFOUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO2FBQzNCLE1BQU0sQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLEVBQUUsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDO2FBQ3BELFdBQVcsQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLEVBQUUsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQy9ELENBQUM7Q0FDRjtBQTVFRCxrREE0RUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge01pZ3JhdGlvbn0gZnJvbSAnLi4vLi4vdXBkYXRlLXRvb2wvbWlncmF0aW9uJztcblxuaW1wb3J0IHtDbGFzc05hbWVVcGdyYWRlRGF0YX0gZnJvbSAnLi4vZGF0YSc7XG5pbXBvcnQge1xuICBpc0V4cG9ydFNwZWNpZmllck5vZGUsXG4gIGlzSW1wb3J0U3BlY2lmaWVyTm9kZSxcbiAgaXNOYW1lc3BhY2VJbXBvcnROb2RlLFxufSBmcm9tICcuLi90eXBlc2NyaXB0L2ltcG9ydHMnO1xuaW1wb3J0IHtcbiAgaXNNYXRlcmlhbEV4cG9ydERlY2xhcmF0aW9uLFxuICBpc01hdGVyaWFsSW1wb3J0RGVjbGFyYXRpb24sXG59IGZyb20gJy4uL3R5cGVzY3JpcHQvbW9kdWxlLXNwZWNpZmllcnMnO1xuaW1wb3J0IHtnZXRWZXJzaW9uVXBncmFkZURhdGEsIFVwZ3JhZGVEYXRhfSBmcm9tICcuLi91cGdyYWRlLWRhdGEnO1xuXG4vKipcbiAqIE1pZ3JhdGlvbiB0aGF0IHdhbGtzIHRocm91Z2ggZXZlcnkgaWRlbnRpZmllciB0aGF0IGlzIHBhcnQgb2YgQW5ndWxhciBNYXRlcmlhbCBvciB0aHIgQ0RLXG4gKiBhbmQgcmVwbGFjZXMgdGhlIG91dGRhdGVkIG5hbWUgd2l0aCB0aGUgbmV3IG9uZSBpZiBzcGVjaWZpZWQgaW4gdGhlIHVwZ3JhZGUgZGF0YS5cbiAqL1xuLy8gVE9ETzogcmV3b3JrIHRoaXMgcnVsZSB0byBpZGVudGlmeSBzeW1ib2xzIHVzaW5nIHRoZSBpbXBvcnQgaWRlbnRpZmllciByZXNvbHZlci4gVGhpc1xuLy8gbWFrZXMgaXQgbW9yZSByb2J1c3QsIGxlc3MgQVNUIGNvbnZvbHV0ZWQgYW5kIGlzIG1vcmUgVHlwZVNjcmlwdCBBU1QgaWRpb21hdGljLiBDT01QLTMwMC5cbmV4cG9ydCBjbGFzcyBDbGFzc05hbWVzTWlncmF0aW9uIGV4dGVuZHMgTWlncmF0aW9uPFVwZ3JhZGVEYXRhPiB7XG4gIC8qKiBDaGFuZ2UgZGF0YSB0aGF0IHVwZ3JhZGVzIHRvIHRoZSBzcGVjaWZpZWQgdGFyZ2V0IHZlcnNpb24uICovXG4gIGRhdGE6IENsYXNzTmFtZVVwZ3JhZGVEYXRhW10gPSBnZXRWZXJzaW9uVXBncmFkZURhdGEodGhpcywgJ2NsYXNzTmFtZXMnKTtcblxuICAvKipcbiAgICogTGlzdCBvZiBpZGVudGlmaWVyIG5hbWVzIHRoYXQgaGF2ZSBiZWVuIGltcG9ydGVkIGZyb20gYEBhbmd1bGFyL21hdGVyaWFsYCBvciBgQGFuZ3VsYXIvY2RrYFxuICAgKiBpbiB0aGUgY3VycmVudCBzb3VyY2UgZmlsZSBhbmQgdGhlcmVmb3JlIGNhbiBiZSBjb25zaWRlcmVkIHRydXN0ZWQuXG4gICAqL1xuICB0cnVzdGVkSWRlbnRpZmllcnM6IFNldDxzdHJpbmc+ID0gbmV3IFNldCgpO1xuXG4gIC8qKiBMaXN0IG9mIG5hbWVzcGFjZXMgdGhhdCBoYXZlIGJlZW4gaW1wb3J0ZWQgZnJvbSBgQGFuZ3VsYXIvbWF0ZXJpYWxgIG9yIGBAYW5ndWxhci9jZGtgLiAqL1xuICB0cnVzdGVkTmFtZXNwYWNlczogU2V0PHN0cmluZz4gPSBuZXcgU2V0KCk7XG5cbiAgLy8gT25seSBlbmFibGUgdGhlIG1pZ3JhdGlvbiBydWxlIGlmIHRoZXJlIGlzIHVwZ3JhZGUgZGF0YS5cbiAgZW5hYmxlZCA9IHRoaXMuZGF0YS5sZW5ndGggIT09IDA7XG5cbiAgb3ZlcnJpZGUgdmlzaXROb2RlKG5vZGU6IHRzLk5vZGUpOiB2b2lkIHtcbiAgICBpZiAodHMuaXNJZGVudGlmaWVyKG5vZGUpKSB7XG4gICAgICB0aGlzLl92aXNpdElkZW50aWZpZXIobm9kZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIE1ldGhvZCB0aGF0IGlzIGNhbGxlZCBmb3IgZXZlcnkgaWRlbnRpZmllciBpbnNpZGUgb2YgdGhlIHNwZWNpZmllZCBwcm9qZWN0LiAqL1xuICBwcml2YXRlIF92aXNpdElkZW50aWZpZXIoaWRlbnRpZmllcjogdHMuSWRlbnRpZmllcikge1xuICAgIC8vIEZvciBpZGVudGlmaWVycyB0aGF0IGFyZW4ndCBsaXN0ZWQgaW4gdGhlIGNsYXNzTmFtZSBkYXRhLCB0aGUgd2hvbGUgY2hlY2sgY2FuIGJlXG4gICAgLy8gc2tpcHBlZCBzYWZlbHkuXG4gICAgaWYgKCF0aGlzLmRhdGEuc29tZShkYXRhID0+IGRhdGEucmVwbGFjZSA9PT0gaWRlbnRpZmllci50ZXh0KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEZvciBuYW1lc3BhY2UgaW1wb3J0cyB0aGF0IGFyZSByZWZlcnJpbmcgdG8gQW5ndWxhciBNYXRlcmlhbCBvciB0aGUgQ0RLLCB3ZSBzdG9yZSB0aGVcbiAgICAvLyBuYW1lc3BhY2UgbmFtZSBpbiBvcmRlciB0byBiZSBhYmxlIHRvIHNhZmVseSBmaW5kIGlkZW50aWZpZXJzIHRoYXQgZG9uJ3QgYmVsb25nIHRvIHRoZVxuICAgIC8vIGRldmVsb3BlcidzIGFwcGxpY2F0aW9uLlxuICAgIGlmIChpc05hbWVzcGFjZUltcG9ydE5vZGUoaWRlbnRpZmllcikgJiYgaXNNYXRlcmlhbEltcG9ydERlY2xhcmF0aW9uKGlkZW50aWZpZXIpKSB7XG4gICAgICB0aGlzLnRydXN0ZWROYW1lc3BhY2VzLmFkZChpZGVudGlmaWVyLnRleHQpO1xuXG4gICAgICByZXR1cm4gdGhpcy5fY3JlYXRlRmFpbHVyZVdpdGhSZXBsYWNlbWVudChpZGVudGlmaWVyKTtcbiAgICB9XG5cbiAgICAvLyBGb3IgZXhwb3J0IGRlY2xhcmF0aW9ucyB0aGF0IGFyZSByZWZlcnJpbmcgdG8gQW5ndWxhciBNYXRlcmlhbCBvciB0aGUgQ0RLLCB0aGUgaWRlbnRpZmllclxuICAgIC8vIGNhbiBiZSBpbW1lZGlhdGVseSB1cGRhdGVkIHRvIHRoZSBuZXcgbmFtZS5cbiAgICBpZiAoaXNFeHBvcnRTcGVjaWZpZXJOb2RlKGlkZW50aWZpZXIpICYmIGlzTWF0ZXJpYWxFeHBvcnREZWNsYXJhdGlvbihpZGVudGlmaWVyKSkge1xuICAgICAgcmV0dXJuIHRoaXMuX2NyZWF0ZUZhaWx1cmVXaXRoUmVwbGFjZW1lbnQoaWRlbnRpZmllcik7XG4gICAgfVxuXG4gICAgLy8gRm9yIGltcG9ydCBkZWNsYXJhdGlvbnMgdGhhdCBhcmUgcmVmZXJyaW5nIHRvIEFuZ3VsYXIgTWF0ZXJpYWwgb3IgdGhlIENESywgdGhlIG5hbWUgb2ZcbiAgICAvLyB0aGUgaW1wb3J0IGlkZW50aWZpZXJzLiBUaGlzIGFsbG93cyB1cyB0byBpZGVudGlmeSBpZGVudGlmaWVycyB0aGF0IGJlbG9uZyB0byBNYXRlcmlhbCBhbmRcbiAgICAvLyB0aGUgQ0RLLCBhbmQgd2Ugd29uJ3QgYWNjaWRlbnRhbGx5IHRvdWNoIGEgZGV2ZWxvcGVyJ3MgaWRlbnRpZmllci5cbiAgICBpZiAoaXNJbXBvcnRTcGVjaWZpZXJOb2RlKGlkZW50aWZpZXIpICYmIGlzTWF0ZXJpYWxJbXBvcnREZWNsYXJhdGlvbihpZGVudGlmaWVyKSkge1xuICAgICAgdGhpcy50cnVzdGVkSWRlbnRpZmllcnMuYWRkKGlkZW50aWZpZXIudGV4dCk7XG5cbiAgICAgIHJldHVybiB0aGlzLl9jcmVhdGVGYWlsdXJlV2l0aFJlcGxhY2VtZW50KGlkZW50aWZpZXIpO1xuICAgIH1cblxuICAgIC8vIEluIGNhc2UgdGhlIGlkZW50aWZpZXIgaXMgcGFydCBvZiBhIHByb3BlcnR5IGFjY2VzcyBleHByZXNzaW9uLCB3ZSBuZWVkIHRvIHZlcmlmeSB0aGF0IHRoZVxuICAgIC8vIHByb3BlcnR5IGFjY2VzcyBvcmlnaW5hdGVzIGZyb20gYSBuYW1lc3BhY2UgdGhhdCBoYXMgYmVlbiBpbXBvcnRlZCBmcm9tIE1hdGVyaWFsIG9yIHRoZSBDREsuXG4gICAgaWYgKHRzLmlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKGlkZW50aWZpZXIucGFyZW50KSkge1xuICAgICAgY29uc3QgZXhwcmVzc2lvbiA9IGlkZW50aWZpZXIucGFyZW50LmV4cHJlc3Npb247XG5cbiAgICAgIGlmICh0cy5pc0lkZW50aWZpZXIoZXhwcmVzc2lvbikgJiYgdGhpcy50cnVzdGVkTmFtZXNwYWNlcy5oYXMoZXhwcmVzc2lvbi50ZXh0KSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY3JlYXRlRmFpbHVyZVdpdGhSZXBsYWNlbWVudChpZGVudGlmaWVyKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRoaXMudHJ1c3RlZElkZW50aWZpZXJzLmhhcyhpZGVudGlmaWVyLnRleHQpKSB7XG4gICAgICByZXR1cm4gdGhpcy5fY3JlYXRlRmFpbHVyZVdpdGhSZXBsYWNlbWVudChpZGVudGlmaWVyKTtcbiAgICB9XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIGZhaWx1cmUgYW5kIHJlcGxhY2VtZW50IGZvciB0aGUgc3BlY2lmaWVkIGlkZW50aWZpZXIuICovXG4gIHByaXZhdGUgX2NyZWF0ZUZhaWx1cmVXaXRoUmVwbGFjZW1lbnQoaWRlbnRpZmllcjogdHMuSWRlbnRpZmllcikge1xuICAgIGNvbnN0IGNsYXNzRGF0YSA9IHRoaXMuZGF0YS5maW5kKGRhdGEgPT4gZGF0YS5yZXBsYWNlID09PSBpZGVudGlmaWVyLnRleHQpITtcbiAgICBjb25zdCBmaWxlUGF0aCA9IHRoaXMuZmlsZVN5c3RlbS5yZXNvbHZlKGlkZW50aWZpZXIuZ2V0U291cmNlRmlsZSgpLmZpbGVOYW1lKTtcblxuICAgIHRoaXMuZmlsZVN5c3RlbS5lZGl0KGZpbGVQYXRoKVxuICAgICAgLnJlbW92ZShpZGVudGlmaWVyLmdldFN0YXJ0KCksIGlkZW50aWZpZXIuZ2V0V2lkdGgoKSlcbiAgICAgIC5pbnNlcnRSaWdodChpZGVudGlmaWVyLmdldFN0YXJ0KCksIGNsYXNzRGF0YS5yZXBsYWNlV2l0aCk7XG4gIH1cbn1cbiJdfQ==