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
        define("@angular/cdk/schematics/ng-update/migrations/property-names", ["require", "exports", "typescript", "@angular/cdk/schematics/update-tool/migration", "@angular/cdk/schematics/ng-update/upgrade-data"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const migration_1 = require("@angular/cdk/schematics/update-tool/migration");
    const upgrade_data_1 = require("@angular/cdk/schematics/ng-update/upgrade-data");
    /**
     * Migration that walks through every property access expression and updates
     * accessed properties that have been updated to a new name.
     */
    class PropertyNamesMigration extends migration_1.Migration {
        constructor() {
            super(...arguments);
            /** Change data that upgrades to the specified target version. */
            this.data = upgrade_data_1.getVersionUpgradeData(this, 'propertyNames');
            // Only enable the migration rule if there is upgrade data.
            this.enabled = this.data.length !== 0;
        }
        visitNode(node) {
            if (ts.isPropertyAccessExpression(node)) {
                this._visitPropertyAccessExpression(node);
            }
        }
        _visitPropertyAccessExpression(node) {
            const hostType = this.typeChecker.getTypeAtLocation(node.expression);
            const typeName = hostType && hostType.symbol && hostType.symbol.getName();
            this.data.forEach(data => {
                if (node.name.text !== data.replace) {
                    return;
                }
                if (!data.whitelist || data.whitelist.classes.includes(typeName)) {
                    this.fileSystem.edit(this.fileSystem.resolve(node.getSourceFile().fileName))
                        .remove(node.name.getStart(), node.name.getWidth())
                        .insertRight(node.name.getStart(), data.replaceWith);
                }
            });
        }
    }
    exports.PropertyNamesMigration = PropertyNamesMigration;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcGVydHktbmFtZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctdXBkYXRlL21pZ3JhdGlvbnMvcHJvcGVydHktbmFtZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCxpQ0FBaUM7SUFDakMsNkVBQXNEO0lBR3RELGlGQUFtRTtJQUVuRTs7O09BR0c7SUFDSCxNQUFhLHNCQUF1QixTQUFRLHFCQUFzQjtRQUFsRTs7WUFDRSxpRUFBaUU7WUFDakUsU0FBSSxHQUE4QixvQ0FBcUIsQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFFL0UsMkRBQTJEO1lBQzNELFlBQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7UUF3Qm5DLENBQUM7UUF0QkMsU0FBUyxDQUFDLElBQWE7WUFDckIsSUFBSSxFQUFFLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ3ZDLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUMzQztRQUNILENBQUM7UUFFTyw4QkFBOEIsQ0FBQyxJQUFpQztZQUN0RSxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNyRSxNQUFNLFFBQVEsR0FBRyxRQUFRLElBQUksUUFBUSxDQUFDLE1BQU0sSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRTFFLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN2QixJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxPQUFPLEVBQUU7b0JBQ25DLE9BQU87aUJBQ1I7Z0JBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFO29CQUNoRSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUM7eUJBQ3pFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7eUJBQ2xELFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztpQkFDeEQ7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRjtJQTdCRCx3REE2QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge01pZ3JhdGlvbn0gZnJvbSAnLi4vLi4vdXBkYXRlLXRvb2wvbWlncmF0aW9uJztcblxuaW1wb3J0IHtQcm9wZXJ0eU5hbWVVcGdyYWRlRGF0YX0gZnJvbSAnLi4vZGF0YSc7XG5pbXBvcnQge2dldFZlcnNpb25VcGdyYWRlRGF0YSwgVXBncmFkZURhdGF9IGZyb20gJy4uL3VwZ3JhZGUtZGF0YSc7XG5cbi8qKlxuICogTWlncmF0aW9uIHRoYXQgd2Fsa3MgdGhyb3VnaCBldmVyeSBwcm9wZXJ0eSBhY2Nlc3MgZXhwcmVzc2lvbiBhbmQgdXBkYXRlc1xuICogYWNjZXNzZWQgcHJvcGVydGllcyB0aGF0IGhhdmUgYmVlbiB1cGRhdGVkIHRvIGEgbmV3IG5hbWUuXG4gKi9cbmV4cG9ydCBjbGFzcyBQcm9wZXJ0eU5hbWVzTWlncmF0aW9uIGV4dGVuZHMgTWlncmF0aW9uPFVwZ3JhZGVEYXRhPiB7XG4gIC8qKiBDaGFuZ2UgZGF0YSB0aGF0IHVwZ3JhZGVzIHRvIHRoZSBzcGVjaWZpZWQgdGFyZ2V0IHZlcnNpb24uICovXG4gIGRhdGE6IFByb3BlcnR5TmFtZVVwZ3JhZGVEYXRhW10gPSBnZXRWZXJzaW9uVXBncmFkZURhdGEodGhpcywgJ3Byb3BlcnR5TmFtZXMnKTtcblxuICAvLyBPbmx5IGVuYWJsZSB0aGUgbWlncmF0aW9uIHJ1bGUgaWYgdGhlcmUgaXMgdXBncmFkZSBkYXRhLlxuICBlbmFibGVkID0gdGhpcy5kYXRhLmxlbmd0aCAhPT0gMDtcblxuICB2aXNpdE5vZGUobm9kZTogdHMuTm9kZSk6IHZvaWQge1xuICAgIGlmICh0cy5pc1Byb3BlcnR5QWNjZXNzRXhwcmVzc2lvbihub2RlKSkge1xuICAgICAgdGhpcy5fdmlzaXRQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24obm9kZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfdmlzaXRQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24obm9kZTogdHMuUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKSB7XG4gICAgY29uc3QgaG9zdFR5cGUgPSB0aGlzLnR5cGVDaGVja2VyLmdldFR5cGVBdExvY2F0aW9uKG5vZGUuZXhwcmVzc2lvbik7XG4gICAgY29uc3QgdHlwZU5hbWUgPSBob3N0VHlwZSAmJiBob3N0VHlwZS5zeW1ib2wgJiYgaG9zdFR5cGUuc3ltYm9sLmdldE5hbWUoKTtcblxuICAgIHRoaXMuZGF0YS5mb3JFYWNoKGRhdGEgPT4ge1xuICAgICAgaWYgKG5vZGUubmFtZS50ZXh0ICE9PSBkYXRhLnJlcGxhY2UpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWRhdGEud2hpdGVsaXN0IHx8IGRhdGEud2hpdGVsaXN0LmNsYXNzZXMuaW5jbHVkZXModHlwZU5hbWUpKSB7XG4gICAgICAgIHRoaXMuZmlsZVN5c3RlbS5lZGl0KHRoaXMuZmlsZVN5c3RlbS5yZXNvbHZlKG5vZGUuZ2V0U291cmNlRmlsZSgpLmZpbGVOYW1lKSlcbiAgICAgICAgICAucmVtb3ZlKG5vZGUubmFtZS5nZXRTdGFydCgpLCBub2RlLm5hbWUuZ2V0V2lkdGgoKSlcbiAgICAgICAgICAuaW5zZXJ0UmlnaHQobm9kZS5uYW1lLmdldFN0YXJ0KCksIGRhdGEucmVwbGFjZVdpdGgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG4iXX0=