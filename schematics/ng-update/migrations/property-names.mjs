"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyNamesMigration = void 0;
const ts = require("typescript");
const migration_1 = require("../../update-tool/migration");
const upgrade_data_1 = require("../upgrade-data");
/**
 * Migration that walks through every property access expression and updates
 * accessed properties that have been updated to a new name.
 */
class PropertyNamesMigration extends migration_1.Migration {
    /** Change data that upgrades to the specified target version. */
    data = (0, upgrade_data_1.getVersionUpgradeData)(this, 'propertyNames');
    // Only enable the migration rule if there is upgrade data.
    enabled = this.data.length !== 0;
    visitNode(node) {
        if (ts.isPropertyAccessExpression(node)) {
            this._visitPropertyAccessExpression(node);
        }
    }
    _visitPropertyAccessExpression(node) {
        const hostType = this.typeChecker.getTypeAtLocation(node.expression);
        const typeNames = [];
        if (hostType) {
            if (hostType.isIntersection()) {
                hostType.types.forEach(type => {
                    if (type.symbol) {
                        typeNames.push(type.symbol.getName());
                    }
                });
            }
            else if (hostType.symbol) {
                typeNames.push(hostType.symbol.getName());
            }
        }
        this.data.forEach(data => {
            if (node.name.text !== data.replace) {
                return;
            }
            if (!data.limitedTo || typeNames.some(type => data.limitedTo.classes.includes(type))) {
                this.fileSystem
                    .edit(this.fileSystem.resolve(node.getSourceFile().fileName))
                    .remove(node.name.getStart(), node.name.getWidth())
                    .insertRight(node.name.getStart(), data.replaceWith);
            }
        });
    }
}
exports.PropertyNamesMigration = PropertyNamesMigration;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcGVydHktbmFtZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctdXBkYXRlL21pZ3JhdGlvbnMvcHJvcGVydHktbmFtZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsaUNBQWlDO0FBQ2pDLDJEQUFzRDtBQUd0RCxrREFBbUU7QUFFbkU7OztHQUdHO0FBQ0gsTUFBYSxzQkFBdUIsU0FBUSxxQkFBc0I7SUFDaEUsaUVBQWlFO0lBQ2pFLElBQUksR0FBOEIsSUFBQSxvQ0FBcUIsRUFBQyxJQUFJLEVBQUUsZUFBZSxDQUFDLENBQUM7SUFFL0UsMkRBQTJEO0lBQzNELE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7SUFFeEIsU0FBUyxDQUFDLElBQWE7UUFDOUIsSUFBSSxFQUFFLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUN4QyxJQUFJLENBQUMsOEJBQThCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUMsQ0FBQztJQUNILENBQUM7SUFFTyw4QkFBOEIsQ0FBQyxJQUFpQztRQUN0RSxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNyRSxNQUFNLFNBQVMsR0FBYSxFQUFFLENBQUM7UUFFL0IsSUFBSSxRQUFRLEVBQUUsQ0FBQztZQUNiLElBQUksUUFBUSxDQUFDLGNBQWMsRUFBRSxFQUFFLENBQUM7Z0JBQzlCLFFBQVEsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUM1QixJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQzt3QkFDaEIsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7b0JBQ3hDLENBQUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDO2lCQUFNLElBQUksUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUMzQixTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUM1QyxDQUFDO1FBQ0gsQ0FBQztRQUVELElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3ZCLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNwQyxPQUFPO1lBQ1QsQ0FBQztZQUVELElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNyRixJQUFJLENBQUMsVUFBVTtxQkFDWixJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO3FCQUM1RCxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO3FCQUNsRCxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDekQsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBMUNELHdEQTBDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmRldi9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge01pZ3JhdGlvbn0gZnJvbSAnLi4vLi4vdXBkYXRlLXRvb2wvbWlncmF0aW9uJztcblxuaW1wb3J0IHtQcm9wZXJ0eU5hbWVVcGdyYWRlRGF0YX0gZnJvbSAnLi4vZGF0YSc7XG5pbXBvcnQge2dldFZlcnNpb25VcGdyYWRlRGF0YSwgVXBncmFkZURhdGF9IGZyb20gJy4uL3VwZ3JhZGUtZGF0YSc7XG5cbi8qKlxuICogTWlncmF0aW9uIHRoYXQgd2Fsa3MgdGhyb3VnaCBldmVyeSBwcm9wZXJ0eSBhY2Nlc3MgZXhwcmVzc2lvbiBhbmQgdXBkYXRlc1xuICogYWNjZXNzZWQgcHJvcGVydGllcyB0aGF0IGhhdmUgYmVlbiB1cGRhdGVkIHRvIGEgbmV3IG5hbWUuXG4gKi9cbmV4cG9ydCBjbGFzcyBQcm9wZXJ0eU5hbWVzTWlncmF0aW9uIGV4dGVuZHMgTWlncmF0aW9uPFVwZ3JhZGVEYXRhPiB7XG4gIC8qKiBDaGFuZ2UgZGF0YSB0aGF0IHVwZ3JhZGVzIHRvIHRoZSBzcGVjaWZpZWQgdGFyZ2V0IHZlcnNpb24uICovXG4gIGRhdGE6IFByb3BlcnR5TmFtZVVwZ3JhZGVEYXRhW10gPSBnZXRWZXJzaW9uVXBncmFkZURhdGEodGhpcywgJ3Byb3BlcnR5TmFtZXMnKTtcblxuICAvLyBPbmx5IGVuYWJsZSB0aGUgbWlncmF0aW9uIHJ1bGUgaWYgdGhlcmUgaXMgdXBncmFkZSBkYXRhLlxuICBlbmFibGVkID0gdGhpcy5kYXRhLmxlbmd0aCAhPT0gMDtcblxuICBvdmVycmlkZSB2aXNpdE5vZGUobm9kZTogdHMuTm9kZSk6IHZvaWQge1xuICAgIGlmICh0cy5pc1Byb3BlcnR5QWNjZXNzRXhwcmVzc2lvbihub2RlKSkge1xuICAgICAgdGhpcy5fdmlzaXRQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24obm9kZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfdmlzaXRQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24obm9kZTogdHMuUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKSB7XG4gICAgY29uc3QgaG9zdFR5cGUgPSB0aGlzLnR5cGVDaGVja2VyLmdldFR5cGVBdExvY2F0aW9uKG5vZGUuZXhwcmVzc2lvbik7XG4gICAgY29uc3QgdHlwZU5hbWVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgaWYgKGhvc3RUeXBlKSB7XG4gICAgICBpZiAoaG9zdFR5cGUuaXNJbnRlcnNlY3Rpb24oKSkge1xuICAgICAgICBob3N0VHlwZS50eXBlcy5mb3JFYWNoKHR5cGUgPT4ge1xuICAgICAgICAgIGlmICh0eXBlLnN5bWJvbCkge1xuICAgICAgICAgICAgdHlwZU5hbWVzLnB1c2godHlwZS5zeW1ib2wuZ2V0TmFtZSgpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIGlmIChob3N0VHlwZS5zeW1ib2wpIHtcbiAgICAgICAgdHlwZU5hbWVzLnB1c2goaG9zdFR5cGUuc3ltYm9sLmdldE5hbWUoKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5kYXRhLmZvckVhY2goZGF0YSA9PiB7XG4gICAgICBpZiAobm9kZS5uYW1lLnRleHQgIT09IGRhdGEucmVwbGFjZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmICghZGF0YS5saW1pdGVkVG8gfHwgdHlwZU5hbWVzLnNvbWUodHlwZSA9PiBkYXRhLmxpbWl0ZWRUby5jbGFzc2VzLmluY2x1ZGVzKHR5cGUpKSkge1xuICAgICAgICB0aGlzLmZpbGVTeXN0ZW1cbiAgICAgICAgICAuZWRpdCh0aGlzLmZpbGVTeXN0ZW0ucmVzb2x2ZShub2RlLmdldFNvdXJjZUZpbGUoKS5maWxlTmFtZSkpXG4gICAgICAgICAgLnJlbW92ZShub2RlLm5hbWUuZ2V0U3RhcnQoKSwgbm9kZS5uYW1lLmdldFdpZHRoKCkpXG4gICAgICAgICAgLmluc2VydFJpZ2h0KG5vZGUubmFtZS5nZXRTdGFydCgpLCBkYXRhLnJlcGxhY2VXaXRoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuIl19