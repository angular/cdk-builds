"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolRemovalMigration = void 0;
const ts = require("typescript");
const migration_1 = require("../../update-tool/migration");
const upgrade_data_1 = require("../upgrade-data");
/** Migration that flags imports for symbols that have been removed. */
class SymbolRemovalMigration extends migration_1.Migration {
    /** Change data that upgrades to the specified target version. */
    data = (0, upgrade_data_1.getVersionUpgradeData)(this, 'symbolRemoval');
    // Only enable the migration rule if there is upgrade data.
    enabled = this.data.length !== 0;
    visitNode(node) {
        if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) {
            return;
        }
        const namedBindings = node.importClause && node.importClause.namedBindings;
        if (!namedBindings || !ts.isNamedImports(namedBindings)) {
            return;
        }
        const moduleNameMatches = this.data.filter(entry => node.moduleSpecifier.text === entry.module);
        if (!moduleNameMatches.length) {
            return;
        }
        namedBindings.elements.forEach(element => {
            const elementName = element.propertyName?.text || element.name.text;
            moduleNameMatches.forEach(match => {
                if (match.name === elementName) {
                    this.createFailureAtNode(element, match.message);
                }
            });
        });
    }
}
exports.SymbolRemovalMigration = SymbolRemovalMigration;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ltYm9sLXJlbW92YWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctdXBkYXRlL21pZ3JhdGlvbnMvc3ltYm9sLXJlbW92YWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsaUNBQWlDO0FBQ2pDLDJEQUFzRDtBQUV0RCxrREFBbUU7QUFFbkUsdUVBQXVFO0FBQ3ZFLE1BQWEsc0JBQXVCLFNBQVEscUJBQXNCO0lBQ2hFLGlFQUFpRTtJQUNqRSxJQUFJLEdBQStCLElBQUEsb0NBQXFCLEVBQUMsSUFBSSxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBRWhGLDJEQUEyRDtJQUMzRCxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDO0lBRXhCLFNBQVMsQ0FBQyxJQUFhO1FBQzlCLElBQUksQ0FBQyxFQUFFLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDO1lBQy9FLE9BQU87UUFDVCxDQUFDO1FBRUQsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLFlBQVksSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQztRQUUzRSxJQUFJLENBQUMsYUFBYSxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDO1lBQ3hELE9BQU87UUFDVCxDQUFDO1FBRUQsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FDeEMsS0FBSyxDQUFDLEVBQUUsQ0FBRSxJQUFJLENBQUMsZUFBb0MsQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDLE1BQU0sQ0FDMUUsQ0FBQztRQUVGLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUM5QixPQUFPO1FBQ1QsQ0FBQztRQUVELGFBQWEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ3ZDLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxZQUFZLEVBQUUsSUFBSSxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBRXBFLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDaEMsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLFdBQVcsRUFBRSxDQUFDO29CQUMvQixJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDbkQsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFwQ0Qsd0RBb0NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuZGV2L2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7TWlncmF0aW9ufSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC9taWdyYXRpb24nO1xuaW1wb3J0IHtTeW1ib2xSZW1vdmFsVXBncmFkZURhdGF9IGZyb20gJy4uL2RhdGEnO1xuaW1wb3J0IHtnZXRWZXJzaW9uVXBncmFkZURhdGEsIFVwZ3JhZGVEYXRhfSBmcm9tICcuLi91cGdyYWRlLWRhdGEnO1xuXG4vKiogTWlncmF0aW9uIHRoYXQgZmxhZ3MgaW1wb3J0cyBmb3Igc3ltYm9scyB0aGF0IGhhdmUgYmVlbiByZW1vdmVkLiAqL1xuZXhwb3J0IGNsYXNzIFN5bWJvbFJlbW92YWxNaWdyYXRpb24gZXh0ZW5kcyBNaWdyYXRpb248VXBncmFkZURhdGE+IHtcbiAgLyoqIENoYW5nZSBkYXRhIHRoYXQgdXBncmFkZXMgdG8gdGhlIHNwZWNpZmllZCB0YXJnZXQgdmVyc2lvbi4gKi9cbiAgZGF0YTogU3ltYm9sUmVtb3ZhbFVwZ3JhZGVEYXRhW10gPSBnZXRWZXJzaW9uVXBncmFkZURhdGEodGhpcywgJ3N5bWJvbFJlbW92YWwnKTtcblxuICAvLyBPbmx5IGVuYWJsZSB0aGUgbWlncmF0aW9uIHJ1bGUgaWYgdGhlcmUgaXMgdXBncmFkZSBkYXRhLlxuICBlbmFibGVkID0gdGhpcy5kYXRhLmxlbmd0aCAhPT0gMDtcblxuICBvdmVycmlkZSB2aXNpdE5vZGUobm9kZTogdHMuTm9kZSk6IHZvaWQge1xuICAgIGlmICghdHMuaXNJbXBvcnREZWNsYXJhdGlvbihub2RlKSB8fCAhdHMuaXNTdHJpbmdMaXRlcmFsKG5vZGUubW9kdWxlU3BlY2lmaWVyKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG5hbWVkQmluZGluZ3MgPSBub2RlLmltcG9ydENsYXVzZSAmJiBub2RlLmltcG9ydENsYXVzZS5uYW1lZEJpbmRpbmdzO1xuXG4gICAgaWYgKCFuYW1lZEJpbmRpbmdzIHx8ICF0cy5pc05hbWVkSW1wb3J0cyhuYW1lZEJpbmRpbmdzKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG1vZHVsZU5hbWVNYXRjaGVzID0gdGhpcy5kYXRhLmZpbHRlcihcbiAgICAgIGVudHJ5ID0+IChub2RlLm1vZHVsZVNwZWNpZmllciBhcyB0cy5TdHJpbmdMaXRlcmFsKS50ZXh0ID09PSBlbnRyeS5tb2R1bGUsXG4gICAgKTtcblxuICAgIGlmICghbW9kdWxlTmFtZU1hdGNoZXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbmFtZWRCaW5kaW5ncy5lbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgY29uc3QgZWxlbWVudE5hbWUgPSBlbGVtZW50LnByb3BlcnR5TmFtZT8udGV4dCB8fCBlbGVtZW50Lm5hbWUudGV4dDtcblxuICAgICAgbW9kdWxlTmFtZU1hdGNoZXMuZm9yRWFjaChtYXRjaCA9PiB7XG4gICAgICAgIGlmIChtYXRjaC5uYW1lID09PSBlbGVtZW50TmFtZSkge1xuICAgICAgICAgIHRoaXMuY3JlYXRlRmFpbHVyZUF0Tm9kZShlbGVtZW50LCBtYXRjaC5tZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==