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
        define("@angular/cdk/schematics/ng-update/upgrade-rules/class-inheritance-rule", ["require", "exports", "chalk", "typescript", "@angular/cdk/schematics/update-tool/migration-rule", "@angular/cdk/schematics/ng-update/typescript/base-types", "@angular/cdk/schematics/ng-update/upgrade-data"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const chalk_1 = require("chalk");
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
                    this.createFailureAtNode(node, `Found class "${chalk_1.default.bold(className)}" which extends class ` +
                        `"${chalk_1.default.bold(typeName)}". Please note that the base class property ` +
                        `"${chalk_1.default.red(data.replace)}" has changed to "${chalk_1.default.green(data.replaceWith)}". ` +
                        `You may need to update your class as well.`);
                }
            });
        }
    }
    exports.ClassInheritanceRule = ClassInheritanceRule;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhc3MtaW5oZXJpdGFuY2UtcnVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2NoZW1hdGljcy9uZy11cGRhdGUvdXBncmFkZS1ydWxlcy9jbGFzcy1pbmhlcml0YW5jZS1ydWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsaUNBQTBCO0lBQzFCLGlDQUFpQztJQUNqQyx1RkFBK0Q7SUFFL0Qsd0ZBQTREO0lBQzVELGlGQUF1RTtJQUV2RTs7O09BR0c7SUFDSCxNQUFhLG9CQUFxQixTQUFRLDhCQUE4QjtRQUF4RTs7WUFDRTs7O2VBR0c7WUFDSCxrQkFBYSxHQUFHLElBQUksR0FBRyxFQUFtQyxDQUFDO1lBRTNELDJEQUEyRDtZQUMzRCxnQkFBVyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQztRQW9DOUMsQ0FBQztRQWxDQyxJQUFJO1lBQ0Ysb0NBQXFCLENBQUMsSUFBSSxFQUFFLGVBQWUsQ0FBQztpQkFDdkMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQztpQkFDeEQsT0FBTyxDQUNKLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM5RixDQUFDO1FBRUQsU0FBUyxDQUFDLElBQWE7WUFDckIsSUFBSSxFQUFFLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQy9CLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNuQztRQUNILENBQUM7UUFFTyxzQkFBc0IsQ0FBQyxJQUF5QjtZQUN0RCxNQUFNLFNBQVMsR0FBRywrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMzQyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUM7WUFFaEUsSUFBSSxDQUFDLFNBQVMsRUFBRTtnQkFDZCxPQUFPO2FBQ1I7WUFFRCxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUMzQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFFOUMsSUFBSSxJQUFJLEVBQUU7b0JBQ1IsSUFBSSxDQUFDLG1CQUFtQixDQUNwQixJQUFJLEVBQ0osZ0JBQWdCLGVBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLHdCQUF3Qjt3QkFDekQsSUFBSSxlQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyw4Q0FBOEM7d0JBQ3RFLElBQUksZUFBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLHFCQUFxQixlQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSzt3QkFDbEYsNENBQTRDLENBQUMsQ0FBQztpQkFDdkQ7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRjtJQTVDRCxvREE0Q0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtNaWdyYXRpb25SdWxlfSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC9taWdyYXRpb24tcnVsZSc7XG5pbXBvcnQge1Byb3BlcnR5TmFtZVVwZ3JhZGVEYXRhfSBmcm9tICcuLi9kYXRhL3Byb3BlcnR5LW5hbWVzJztcbmltcG9ydCB7ZGV0ZXJtaW5lQmFzZVR5cGVzfSBmcm9tICcuLi90eXBlc2NyaXB0L2Jhc2UtdHlwZXMnO1xuaW1wb3J0IHtnZXRWZXJzaW9uVXBncmFkZURhdGEsIFJ1bGVVcGdyYWRlRGF0YX0gZnJvbSAnLi4vdXBncmFkZS1kYXRhJztcblxuLyoqXG4gKiBSdWxlIHRoYXQgaWRlbnRpZmllcyBjbGFzcyBkZWNsYXJhdGlvbnMgdGhhdCBleHRlbmQgQ0RLIG9yIE1hdGVyaWFsIGNsYXNzZXNcbiAqIHdoaWNoIGhhZCBhIHB1YmxpYyBwcm9wZXJ0eSBjaGFuZ2UuXG4gKi9cbmV4cG9ydCBjbGFzcyBDbGFzc0luaGVyaXRhbmNlUnVsZSBleHRlbmRzIE1pZ3JhdGlvblJ1bGU8UnVsZVVwZ3JhZGVEYXRhPiB7XG4gIC8qKlxuICAgKiBNYXAgb2YgY2xhc3NlcyB0aGF0IGhhdmUgYmVlbiB1cGRhdGVkLiBFYWNoIGNsYXNzIG5hbWUgbWFwcyB0byB0aGUgYWNjb3JkaW5nIHByb3BlcnR5XG4gICAqIGNoYW5nZSBkYXRhLlxuICAgKi9cbiAgcHJvcGVydHlOYW1lcyA9IG5ldyBNYXA8c3RyaW5nLCBQcm9wZXJ0eU5hbWVVcGdyYWRlRGF0YT4oKTtcblxuICAvLyBPbmx5IGVuYWJsZSB0aGUgbWlncmF0aW9uIHJ1bGUgaWYgdGhlcmUgaXMgdXBncmFkZSBkYXRhLlxuICBydWxlRW5hYmxlZCA9IHRoaXMucHJvcGVydHlOYW1lcy5zaXplICE9PSAwO1xuXG4gIGluaXQoKTogdm9pZCB7XG4gICAgZ2V0VmVyc2lvblVwZ3JhZGVEYXRhKHRoaXMsICdwcm9wZXJ0eU5hbWVzJylcbiAgICAgICAgLmZpbHRlcihkYXRhID0+IGRhdGEud2hpdGVsaXN0ICYmIGRhdGEud2hpdGVsaXN0LmNsYXNzZXMpXG4gICAgICAgIC5mb3JFYWNoKFxuICAgICAgICAgICAgZGF0YSA9PiBkYXRhLndoaXRlbGlzdC5jbGFzc2VzLmZvckVhY2gobmFtZSA9PiB0aGlzLnByb3BlcnR5TmFtZXMuc2V0KG5hbWUsIGRhdGEpKSk7XG4gIH1cblxuICB2aXNpdE5vZGUobm9kZTogdHMuTm9kZSk6IHZvaWQge1xuICAgIGlmICh0cy5pc0NsYXNzRGVjbGFyYXRpb24obm9kZSkpIHtcbiAgICAgIHRoaXMuX3Zpc2l0Q2xhc3NEZWNsYXJhdGlvbihub2RlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF92aXNpdENsYXNzRGVjbGFyYXRpb24obm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbikge1xuICAgIGNvbnN0IGJhc2VUeXBlcyA9IGRldGVybWluZUJhc2VUeXBlcyhub2RlKTtcbiAgICBjb25zdCBjbGFzc05hbWUgPSBub2RlLm5hbWUgPyBub2RlLm5hbWUudGV4dCA6ICd7dW5rbm93bi1uYW1lfSc7XG5cbiAgICBpZiAoIWJhc2VUeXBlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGJhc2VUeXBlcy5mb3JFYWNoKHR5cGVOYW1lID0+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLnByb3BlcnR5TmFtZXMuZ2V0KHR5cGVOYW1lKTtcblxuICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgdGhpcy5jcmVhdGVGYWlsdXJlQXROb2RlKFxuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgIGBGb3VuZCBjbGFzcyBcIiR7Y2hhbGsuYm9sZChjbGFzc05hbWUpfVwiIHdoaWNoIGV4dGVuZHMgY2xhc3MgYCArXG4gICAgICAgICAgICAgICAgYFwiJHtjaGFsay5ib2xkKHR5cGVOYW1lKX1cIi4gUGxlYXNlIG5vdGUgdGhhdCB0aGUgYmFzZSBjbGFzcyBwcm9wZXJ0eSBgICtcbiAgICAgICAgICAgICAgICBgXCIke2NoYWxrLnJlZChkYXRhLnJlcGxhY2UpfVwiIGhhcyBjaGFuZ2VkIHRvIFwiJHtjaGFsay5ncmVlbihkYXRhLnJlcGxhY2VXaXRoKX1cIi4gYCArXG4gICAgICAgICAgICAgICAgYFlvdSBtYXkgbmVlZCB0byB1cGRhdGUgeW91ciBjbGFzcyBhcyB3ZWxsLmApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG4iXX0=