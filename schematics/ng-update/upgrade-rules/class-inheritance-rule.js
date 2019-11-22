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
        define("@angular/cdk/schematics/ng-update/upgrade-rules/class-inheritance-rule", ["require", "exports", "typescript", "@angular/cdk/schematics/update-tool/migration-rule", "@angular/cdk/schematics/ng-update/typescript/base-types", "@angular/cdk/schematics/ng-update/upgrade-data"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const migration_rule_1 = require("@angular/cdk/schematics/update-tool/migration-rule");
    const base_types_1 = require("@angular/cdk/schematics/ng-update/typescript/base-types");
    const upgrade_data_1 = require("@angular/cdk/schematics/ng-update/upgrade-data");
    /**
     * Rule that identifies class declarations that extend CDK or Material classes
     * which had a public property change.
     */
    class ClassInheritanceRule extends migration_rule_1.MigrationRule {
        constructor() {
            super(...arguments);
            /**
             * Map of classes that have been updated. Each class name maps to the according property
             * change data.
             */
            this.propertyNames = new Map();
            // Only enable the migration rule if there is upgrade data.
            this.ruleEnabled = this.propertyNames.size !== 0;
        }
        init() {
            upgrade_data_1.getVersionUpgradeData(this, 'propertyNames')
                .filter(data => data.whitelist && data.whitelist.classes)
                .forEach(data => data.whitelist.classes.forEach(name => this.propertyNames.set(name, data)));
        }
        visitNode(node) {
            if (ts.isClassDeclaration(node)) {
                this._visitClassDeclaration(node);
            }
        }
        _visitClassDeclaration(node) {
            const baseTypes = base_types_1.determineBaseTypes(node);
            const className = node.name ? node.name.text : '{unknown-name}';
            if (!baseTypes) {
                return;
            }
            baseTypes.forEach(typeName => {
                const data = this.propertyNames.get(typeName);
                if (data) {
                    this.createFailureAtNode(node, `Found class "${className}" which extends class ` +
                        `"${typeName}". Please note that the base class property ` +
                        `"${data.replace}" has changed to "${data.replaceWith}". ` +
                        `You may need to update your class as well.`);
                }
            });
        }
    }
    exports.ClassInheritanceRule = ClassInheritanceRule;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhc3MtaW5oZXJpdGFuY2UtcnVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2NoZW1hdGljcy9uZy11cGRhdGUvdXBncmFkZS1ydWxlcy9jbGFzcy1pbmhlcml0YW5jZS1ydWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsaUNBQWlDO0lBQ2pDLHVGQUErRDtJQUUvRCx3RkFBNEQ7SUFDNUQsaUZBQXVFO0lBRXZFOzs7T0FHRztJQUNILE1BQWEsb0JBQXFCLFNBQVEsOEJBQThCO1FBQXhFOztZQUNFOzs7ZUFHRztZQUNILGtCQUFhLEdBQUcsSUFBSSxHQUFHLEVBQW1DLENBQUM7WUFFM0QsMkRBQTJEO1lBQzNELGdCQUFXLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDO1FBb0M5QyxDQUFDO1FBbENDLElBQUk7WUFDRixvQ0FBcUIsQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDO2lCQUN2QyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDO2lCQUN4RCxPQUFPLENBQ0osSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlGLENBQUM7UUFFRCxTQUFTLENBQUMsSUFBYTtZQUNyQixJQUFJLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDL0IsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ25DO1FBQ0gsQ0FBQztRQUVPLHNCQUFzQixDQUFDLElBQXlCO1lBQ3RELE1BQU0sU0FBUyxHQUFHLCtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzNDLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQztZQUVoRSxJQUFJLENBQUMsU0FBUyxFQUFFO2dCQUNkLE9BQU87YUFDUjtZQUVELFNBQVMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQzNCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUU5QyxJQUFJLElBQUksRUFBRTtvQkFDUixJQUFJLENBQUMsbUJBQW1CLENBQ3BCLElBQUksRUFDSixnQkFBZ0IsU0FBUyx3QkFBd0I7d0JBQzdDLElBQUksUUFBUSw4Q0FBOEM7d0JBQzFELElBQUksSUFBSSxDQUFDLE9BQU8scUJBQXFCLElBQUksQ0FBQyxXQUFXLEtBQUs7d0JBQzFELDRDQUE0QyxDQUFDLENBQUM7aUJBQ3ZEO1lBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO0tBQ0Y7SUE1Q0Qsb0RBNENDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtNaWdyYXRpb25SdWxlfSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC9taWdyYXRpb24tcnVsZSc7XG5pbXBvcnQge1Byb3BlcnR5TmFtZVVwZ3JhZGVEYXRhfSBmcm9tICcuLi9kYXRhL3Byb3BlcnR5LW5hbWVzJztcbmltcG9ydCB7ZGV0ZXJtaW5lQmFzZVR5cGVzfSBmcm9tICcuLi90eXBlc2NyaXB0L2Jhc2UtdHlwZXMnO1xuaW1wb3J0IHtnZXRWZXJzaW9uVXBncmFkZURhdGEsIFJ1bGVVcGdyYWRlRGF0YX0gZnJvbSAnLi4vdXBncmFkZS1kYXRhJztcblxuLyoqXG4gKiBSdWxlIHRoYXQgaWRlbnRpZmllcyBjbGFzcyBkZWNsYXJhdGlvbnMgdGhhdCBleHRlbmQgQ0RLIG9yIE1hdGVyaWFsIGNsYXNzZXNcbiAqIHdoaWNoIGhhZCBhIHB1YmxpYyBwcm9wZXJ0eSBjaGFuZ2UuXG4gKi9cbmV4cG9ydCBjbGFzcyBDbGFzc0luaGVyaXRhbmNlUnVsZSBleHRlbmRzIE1pZ3JhdGlvblJ1bGU8UnVsZVVwZ3JhZGVEYXRhPiB7XG4gIC8qKlxuICAgKiBNYXAgb2YgY2xhc3NlcyB0aGF0IGhhdmUgYmVlbiB1cGRhdGVkLiBFYWNoIGNsYXNzIG5hbWUgbWFwcyB0byB0aGUgYWNjb3JkaW5nIHByb3BlcnR5XG4gICAqIGNoYW5nZSBkYXRhLlxuICAgKi9cbiAgcHJvcGVydHlOYW1lcyA9IG5ldyBNYXA8c3RyaW5nLCBQcm9wZXJ0eU5hbWVVcGdyYWRlRGF0YT4oKTtcblxuICAvLyBPbmx5IGVuYWJsZSB0aGUgbWlncmF0aW9uIHJ1bGUgaWYgdGhlcmUgaXMgdXBncmFkZSBkYXRhLlxuICBydWxlRW5hYmxlZCA9IHRoaXMucHJvcGVydHlOYW1lcy5zaXplICE9PSAwO1xuXG4gIGluaXQoKTogdm9pZCB7XG4gICAgZ2V0VmVyc2lvblVwZ3JhZGVEYXRhKHRoaXMsICdwcm9wZXJ0eU5hbWVzJylcbiAgICAgICAgLmZpbHRlcihkYXRhID0+IGRhdGEud2hpdGVsaXN0ICYmIGRhdGEud2hpdGVsaXN0LmNsYXNzZXMpXG4gICAgICAgIC5mb3JFYWNoKFxuICAgICAgICAgICAgZGF0YSA9PiBkYXRhLndoaXRlbGlzdC5jbGFzc2VzLmZvckVhY2gobmFtZSA9PiB0aGlzLnByb3BlcnR5TmFtZXMuc2V0KG5hbWUsIGRhdGEpKSk7XG4gIH1cblxuICB2aXNpdE5vZGUobm9kZTogdHMuTm9kZSk6IHZvaWQge1xuICAgIGlmICh0cy5pc0NsYXNzRGVjbGFyYXRpb24obm9kZSkpIHtcbiAgICAgIHRoaXMuX3Zpc2l0Q2xhc3NEZWNsYXJhdGlvbihub2RlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF92aXNpdENsYXNzRGVjbGFyYXRpb24obm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbikge1xuICAgIGNvbnN0IGJhc2VUeXBlcyA9IGRldGVybWluZUJhc2VUeXBlcyhub2RlKTtcbiAgICBjb25zdCBjbGFzc05hbWUgPSBub2RlLm5hbWUgPyBub2RlLm5hbWUudGV4dCA6ICd7dW5rbm93bi1uYW1lfSc7XG5cbiAgICBpZiAoIWJhc2VUeXBlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGJhc2VUeXBlcy5mb3JFYWNoKHR5cGVOYW1lID0+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLnByb3BlcnR5TmFtZXMuZ2V0KHR5cGVOYW1lKTtcblxuICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgdGhpcy5jcmVhdGVGYWlsdXJlQXROb2RlKFxuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgIGBGb3VuZCBjbGFzcyBcIiR7Y2xhc3NOYW1lfVwiIHdoaWNoIGV4dGVuZHMgY2xhc3MgYCArXG4gICAgICAgICAgICAgICAgYFwiJHt0eXBlTmFtZX1cIi4gUGxlYXNlIG5vdGUgdGhhdCB0aGUgYmFzZSBjbGFzcyBwcm9wZXJ0eSBgICtcbiAgICAgICAgICAgICAgICBgXCIke2RhdGEucmVwbGFjZX1cIiBoYXMgY2hhbmdlZCB0byBcIiR7ZGF0YS5yZXBsYWNlV2l0aH1cIi4gYCArXG4gICAgICAgICAgICAgICAgYFlvdSBtYXkgbmVlZCB0byB1cGRhdGUgeW91ciBjbGFzcyBhcyB3ZWxsLmApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG4iXX0=