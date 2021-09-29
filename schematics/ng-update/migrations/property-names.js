"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
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
    constructor() {
        super(...arguments);
        /** Change data that upgrades to the specified target version. */
        this.data = (0, upgrade_data_1.getVersionUpgradeData)(this, 'propertyNames');
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
                this.fileSystem.edit(this.fileSystem.resolve(node.getSourceFile().fileName))
                    .remove(node.name.getStart(), node.name.getWidth())
                    .insertRight(node.name.getStart(), data.replaceWith);
            }
        });
    }
}
exports.PropertyNamesMigration = PropertyNamesMigration;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcGVydHktbmFtZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctdXBkYXRlL21pZ3JhdGlvbnMvcHJvcGVydHktbmFtZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsaUNBQWlDO0FBQ2pDLDJEQUFzRDtBQUd0RCxrREFBbUU7QUFFbkU7OztHQUdHO0FBQ0gsTUFBYSxzQkFBdUIsU0FBUSxxQkFBc0I7SUFBbEU7O1FBQ0UsaUVBQWlFO1FBQ2pFLFNBQUksR0FBOEIsSUFBQSxvQ0FBcUIsRUFBQyxJQUFJLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFFL0UsMkRBQTJEO1FBQzNELFlBQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7SUFvQ25DLENBQUM7SUFsQ1UsU0FBUyxDQUFDLElBQWE7UUFDOUIsSUFBSSxFQUFFLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDdkMsSUFBSSxDQUFDLDhCQUE4QixDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzNDO0lBQ0gsQ0FBQztJQUVPLDhCQUE4QixDQUFDLElBQWlDO1FBQ3RFLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3JFLE1BQU0sU0FBUyxHQUFhLEVBQUUsQ0FBQztRQUUvQixJQUFJLFFBQVEsRUFBRTtZQUNaLElBQUksUUFBUSxDQUFDLGNBQWMsRUFBRSxFQUFFO2dCQUM1QixRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDNUIsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO3dCQUNmLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO3FCQUN2QztnQkFDSCxDQUFDLENBQUMsQ0FBQzthQUNMO2lCQUFNLElBQUksUUFBUSxDQUFDLE1BQU0sRUFBRTtnQkFDMUIsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7YUFDM0M7U0FDRjtRQUVELElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3ZCLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFDbkMsT0FBTzthQUNSO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO2dCQUNwRixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUM7cUJBQ3pFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7cUJBQ2xELFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQzthQUN4RDtRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBekNELHdEQXlDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7TWlncmF0aW9ufSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC9taWdyYXRpb24nO1xuXG5pbXBvcnQge1Byb3BlcnR5TmFtZVVwZ3JhZGVEYXRhfSBmcm9tICcuLi9kYXRhJztcbmltcG9ydCB7Z2V0VmVyc2lvblVwZ3JhZGVEYXRhLCBVcGdyYWRlRGF0YX0gZnJvbSAnLi4vdXBncmFkZS1kYXRhJztcblxuLyoqXG4gKiBNaWdyYXRpb24gdGhhdCB3YWxrcyB0aHJvdWdoIGV2ZXJ5IHByb3BlcnR5IGFjY2VzcyBleHByZXNzaW9uIGFuZCB1cGRhdGVzXG4gKiBhY2Nlc3NlZCBwcm9wZXJ0aWVzIHRoYXQgaGF2ZSBiZWVuIHVwZGF0ZWQgdG8gYSBuZXcgbmFtZS5cbiAqL1xuZXhwb3J0IGNsYXNzIFByb3BlcnR5TmFtZXNNaWdyYXRpb24gZXh0ZW5kcyBNaWdyYXRpb248VXBncmFkZURhdGE+IHtcbiAgLyoqIENoYW5nZSBkYXRhIHRoYXQgdXBncmFkZXMgdG8gdGhlIHNwZWNpZmllZCB0YXJnZXQgdmVyc2lvbi4gKi9cbiAgZGF0YTogUHJvcGVydHlOYW1lVXBncmFkZURhdGFbXSA9IGdldFZlcnNpb25VcGdyYWRlRGF0YSh0aGlzLCAncHJvcGVydHlOYW1lcycpO1xuXG4gIC8vIE9ubHkgZW5hYmxlIHRoZSBtaWdyYXRpb24gcnVsZSBpZiB0aGVyZSBpcyB1cGdyYWRlIGRhdGEuXG4gIGVuYWJsZWQgPSB0aGlzLmRhdGEubGVuZ3RoICE9PSAwO1xuXG4gIG92ZXJyaWRlIHZpc2l0Tm9kZShub2RlOiB0cy5Ob2RlKTogdm9pZCB7XG4gICAgaWYgKHRzLmlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKG5vZGUpKSB7XG4gICAgICB0aGlzLl92aXNpdFByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbihub2RlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF92aXNpdFByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbihub2RlOiB0cy5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24pIHtcbiAgICBjb25zdCBob3N0VHlwZSA9IHRoaXMudHlwZUNoZWNrZXIuZ2V0VHlwZUF0TG9jYXRpb24obm9kZS5leHByZXNzaW9uKTtcbiAgICBjb25zdCB0eXBlTmFtZXM6IHN0cmluZ1tdID0gW107XG5cbiAgICBpZiAoaG9zdFR5cGUpIHtcbiAgICAgIGlmIChob3N0VHlwZS5pc0ludGVyc2VjdGlvbigpKSB7XG4gICAgICAgICBob3N0VHlwZS50eXBlcy5mb3JFYWNoKHR5cGUgPT4ge1xuICAgICAgICAgICBpZiAodHlwZS5zeW1ib2wpIHtcbiAgICAgICAgICAgICB0eXBlTmFtZXMucHVzaCh0eXBlLnN5bWJvbC5nZXROYW1lKCkpO1xuICAgICAgICAgICB9XG4gICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAoaG9zdFR5cGUuc3ltYm9sKSB7XG4gICAgICAgIHR5cGVOYW1lcy5wdXNoKGhvc3RUeXBlLnN5bWJvbC5nZXROYW1lKCkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuZGF0YS5mb3JFYWNoKGRhdGEgPT4ge1xuICAgICAgaWYgKG5vZGUubmFtZS50ZXh0ICE9PSBkYXRhLnJlcGxhY2UpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWRhdGEubGltaXRlZFRvIHx8IHR5cGVOYW1lcy5zb21lKHR5cGUgPT4gZGF0YS5saW1pdGVkVG8uY2xhc3Nlcy5pbmNsdWRlcyh0eXBlKSkpIHtcbiAgICAgICAgdGhpcy5maWxlU3lzdGVtLmVkaXQodGhpcy5maWxlU3lzdGVtLnJlc29sdmUobm9kZS5nZXRTb3VyY2VGaWxlKCkuZmlsZU5hbWUpKVxuICAgICAgICAgIC5yZW1vdmUobm9kZS5uYW1lLmdldFN0YXJ0KCksIG5vZGUubmFtZS5nZXRXaWR0aCgpKVxuICAgICAgICAgIC5pbnNlcnRSaWdodChub2RlLm5hbWUuZ2V0U3RhcnQoKSwgZGF0YS5yZXBsYWNlV2l0aCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==