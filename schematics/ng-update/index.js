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
        define("@angular/cdk/schematics/ng-update/index", ["require", "exports", "chalk", "@angular/cdk/schematics/update-tool/target-version", "@angular/cdk/schematics/ng-update/upgrade-data", "@angular/cdk/schematics/ng-update/upgrade-rules/index"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const chalk_1 = require("chalk");
    const target_version_1 = require("@angular/cdk/schematics/update-tool/target-version");
    const upgrade_data_1 = require("@angular/cdk/schematics/ng-update/upgrade-data");
    const upgrade_rules_1 = require("@angular/cdk/schematics/ng-update/upgrade-rules/index");
    /** Entry point for the migration schematics with target of Angular CDK 6.0.0 */
    function updateToV6() {
        return upgrade_rules_1.createUpgradeRule(target_version_1.TargetVersion.V6, [], upgrade_data_1.cdkUpgradeData, onMigrationComplete);
    }
    exports.updateToV6 = updateToV6;
    /** Entry point for the migration schematics with target of Angular CDK 7.0.0 */
    function updateToV7() {
        return upgrade_rules_1.createUpgradeRule(target_version_1.TargetVersion.V7, [], upgrade_data_1.cdkUpgradeData, onMigrationComplete);
    }
    exports.updateToV7 = updateToV7;
    /** Entry point for the migration schematics with target of Angular CDK 8.0.0 */
    function updateToV8() {
        return upgrade_rules_1.createUpgradeRule(target_version_1.TargetVersion.V8, [], upgrade_data_1.cdkUpgradeData, onMigrationComplete);
    }
    exports.updateToV8 = updateToV8;
    /** Entry point for the migration schematics with target of Angular CDK 9.0.0 */
    function updateToV9() {
        return upgrade_rules_1.createUpgradeRule(target_version_1.TargetVersion.V9, [], upgrade_data_1.cdkUpgradeData, onMigrationComplete);
    }
    exports.updateToV9 = updateToV9;
    /** Function that will be called when the migration completed. */
    function onMigrationComplete(targetVersion, hasFailures) {
        console.log();
        console.log(chalk_1.default.green(`  ✓  Updated Angular CDK to ${targetVersion}`));
        console.log();
        if (hasFailures) {
            console.log(chalk_1.default.yellow('  ⚠  Some issues were detected but could not be fixed automatically. Please check the ' +
                'output above and fix these issues manually.'));
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctdXBkYXRlL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBR0gsaUNBQTBCO0lBQzFCLHVGQUE0RDtJQUM1RCxpRkFBOEM7SUFDOUMseUZBQWtEO0lBRWxELGdGQUFnRjtJQUNoRixTQUFnQixVQUFVO1FBQ3hCLE9BQU8saUNBQWlCLENBQUMsOEJBQWEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLDZCQUFjLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztJQUN0RixDQUFDO0lBRkQsZ0NBRUM7SUFFRCxnRkFBZ0Y7SUFDaEYsU0FBZ0IsVUFBVTtRQUN4QixPQUFPLGlDQUFpQixDQUFDLDhCQUFhLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSw2QkFBYyxFQUFFLG1CQUFtQixDQUFDLENBQUM7SUFDdEYsQ0FBQztJQUZELGdDQUVDO0lBRUQsZ0ZBQWdGO0lBQ2hGLFNBQWdCLFVBQVU7UUFDeEIsT0FBTyxpQ0FBaUIsQ0FBQyw4QkFBYSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsNkJBQWMsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO0lBQ3RGLENBQUM7SUFGRCxnQ0FFQztJQUVELGdGQUFnRjtJQUNoRixTQUFnQixVQUFVO1FBQ3hCLE9BQU8saUNBQWlCLENBQUMsOEJBQWEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLDZCQUFjLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztJQUN0RixDQUFDO0lBRkQsZ0NBRUM7SUFFRCxpRUFBaUU7SUFDakUsU0FBUyxtQkFBbUIsQ0FBQyxhQUE0QixFQUFFLFdBQW9CO1FBQzdFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNkLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBSyxDQUFDLEtBQUssQ0FBQywrQkFBK0IsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3pFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUVkLElBQUksV0FBVyxFQUFFO1lBQ2YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFLLENBQUMsTUFBTSxDQUN0Qix3RkFBd0Y7Z0JBQ3hGLDZDQUE2QyxDQUFDLENBQUMsQ0FBQztTQUNuRDtJQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdWxlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnO1xuaW1wb3J0IHtUYXJnZXRWZXJzaW9ufSBmcm9tICcuLi91cGRhdGUtdG9vbC90YXJnZXQtdmVyc2lvbic7XG5pbXBvcnQge2Nka1VwZ3JhZGVEYXRhfSBmcm9tICcuL3VwZ3JhZGUtZGF0YSc7XG5pbXBvcnQge2NyZWF0ZVVwZ3JhZGVSdWxlfSBmcm9tICcuL3VwZ3JhZGUtcnVsZXMnO1xuXG4vKiogRW50cnkgcG9pbnQgZm9yIHRoZSBtaWdyYXRpb24gc2NoZW1hdGljcyB3aXRoIHRhcmdldCBvZiBBbmd1bGFyIENESyA2LjAuMCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVRvVjYoKTogUnVsZSB7XG4gIHJldHVybiBjcmVhdGVVcGdyYWRlUnVsZShUYXJnZXRWZXJzaW9uLlY2LCBbXSwgY2RrVXBncmFkZURhdGEsIG9uTWlncmF0aW9uQ29tcGxldGUpO1xufVxuXG4vKiogRW50cnkgcG9pbnQgZm9yIHRoZSBtaWdyYXRpb24gc2NoZW1hdGljcyB3aXRoIHRhcmdldCBvZiBBbmd1bGFyIENESyA3LjAuMCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVRvVjcoKTogUnVsZSB7XG4gIHJldHVybiBjcmVhdGVVcGdyYWRlUnVsZShUYXJnZXRWZXJzaW9uLlY3LCBbXSwgY2RrVXBncmFkZURhdGEsIG9uTWlncmF0aW9uQ29tcGxldGUpO1xufVxuXG4vKiogRW50cnkgcG9pbnQgZm9yIHRoZSBtaWdyYXRpb24gc2NoZW1hdGljcyB3aXRoIHRhcmdldCBvZiBBbmd1bGFyIENESyA4LjAuMCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVRvVjgoKTogUnVsZSB7XG4gIHJldHVybiBjcmVhdGVVcGdyYWRlUnVsZShUYXJnZXRWZXJzaW9uLlY4LCBbXSwgY2RrVXBncmFkZURhdGEsIG9uTWlncmF0aW9uQ29tcGxldGUpO1xufVxuXG4vKiogRW50cnkgcG9pbnQgZm9yIHRoZSBtaWdyYXRpb24gc2NoZW1hdGljcyB3aXRoIHRhcmdldCBvZiBBbmd1bGFyIENESyA5LjAuMCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVRvVjkoKTogUnVsZSB7XG4gIHJldHVybiBjcmVhdGVVcGdyYWRlUnVsZShUYXJnZXRWZXJzaW9uLlY5LCBbXSwgY2RrVXBncmFkZURhdGEsIG9uTWlncmF0aW9uQ29tcGxldGUpO1xufVxuXG4vKiogRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCB3aGVuIHRoZSBtaWdyYXRpb24gY29tcGxldGVkLiAqL1xuZnVuY3Rpb24gb25NaWdyYXRpb25Db21wbGV0ZSh0YXJnZXRWZXJzaW9uOiBUYXJnZXRWZXJzaW9uLCBoYXNGYWlsdXJlczogYm9vbGVhbikge1xuICBjb25zb2xlLmxvZygpO1xuICBjb25zb2xlLmxvZyhjaGFsay5ncmVlbihgICDinJMgIFVwZGF0ZWQgQW5ndWxhciBDREsgdG8gJHt0YXJnZXRWZXJzaW9ufWApKTtcbiAgY29uc29sZS5sb2coKTtcblxuICBpZiAoaGFzRmFpbHVyZXMpIHtcbiAgICBjb25zb2xlLmxvZyhjaGFsay55ZWxsb3coXG4gICAgICAnICDimqAgIFNvbWUgaXNzdWVzIHdlcmUgZGV0ZWN0ZWQgYnV0IGNvdWxkIG5vdCBiZSBmaXhlZCBhdXRvbWF0aWNhbGx5LiBQbGVhc2UgY2hlY2sgdGhlICcgK1xuICAgICAgJ291dHB1dCBhYm92ZSBhbmQgZml4IHRoZXNlIGlzc3VlcyBtYW51YWxseS4nKSk7XG4gIH1cbn1cbiJdfQ==