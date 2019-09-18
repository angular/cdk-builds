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
        console.log(chalk_1.green(`  ✓  Updated Angular CDK to ${targetVersion}`));
        console.log();
        if (hasFailures) {
            console.log(chalk_1.yellow('  ⚠  Some issues were detected but could not be fixed automatically. Please check the ' +
                'output above and fix these issues manually.'));
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctdXBkYXRlL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBR0gsaUNBQW9DO0lBQ3BDLHVGQUE0RDtJQUM1RCxpRkFBOEM7SUFDOUMseUZBQWtEO0lBRWxELGdGQUFnRjtJQUNoRixTQUFnQixVQUFVO1FBQ3hCLE9BQU8saUNBQWlCLENBQUMsOEJBQWEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLDZCQUFjLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztJQUN0RixDQUFDO0lBRkQsZ0NBRUM7SUFFRCxnRkFBZ0Y7SUFDaEYsU0FBZ0IsVUFBVTtRQUN4QixPQUFPLGlDQUFpQixDQUFDLDhCQUFhLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSw2QkFBYyxFQUFFLG1CQUFtQixDQUFDLENBQUM7SUFDdEYsQ0FBQztJQUZELGdDQUVDO0lBRUQsZ0ZBQWdGO0lBQ2hGLFNBQWdCLFVBQVU7UUFDeEIsT0FBTyxpQ0FBaUIsQ0FBQyw4QkFBYSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsNkJBQWMsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO0lBQ3RGLENBQUM7SUFGRCxnQ0FFQztJQUVELGdGQUFnRjtJQUNoRixTQUFnQixVQUFVO1FBQ3hCLE9BQU8saUNBQWlCLENBQUMsOEJBQWEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLDZCQUFjLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztJQUN0RixDQUFDO0lBRkQsZ0NBRUM7SUFFRCxpRUFBaUU7SUFDakUsU0FBUyxtQkFBbUIsQ0FBQyxhQUE0QixFQUFFLFdBQW9CO1FBQzdFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNkLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBSyxDQUFDLCtCQUErQixhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbkUsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRWQsSUFBSSxXQUFXLEVBQUU7WUFDZixPQUFPLENBQUMsR0FBRyxDQUFDLGNBQU0sQ0FDaEIsd0ZBQXdGO2dCQUN4Riw2Q0FBNkMsQ0FBQyxDQUFDLENBQUM7U0FDbkQ7SUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UnVsZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtncmVlbiwgeWVsbG93fSBmcm9tICdjaGFsayc7XG5pbXBvcnQge1RhcmdldFZlcnNpb259IGZyb20gJy4uL3VwZGF0ZS10b29sL3RhcmdldC12ZXJzaW9uJztcbmltcG9ydCB7Y2RrVXBncmFkZURhdGF9IGZyb20gJy4vdXBncmFkZS1kYXRhJztcbmltcG9ydCB7Y3JlYXRlVXBncmFkZVJ1bGV9IGZyb20gJy4vdXBncmFkZS1ydWxlcyc7XG5cbi8qKiBFbnRyeSBwb2ludCBmb3IgdGhlIG1pZ3JhdGlvbiBzY2hlbWF0aWNzIHdpdGggdGFyZ2V0IG9mIEFuZ3VsYXIgQ0RLIDYuMC4wICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlVG9WNigpOiBSdWxlIHtcbiAgcmV0dXJuIGNyZWF0ZVVwZ3JhZGVSdWxlKFRhcmdldFZlcnNpb24uVjYsIFtdLCBjZGtVcGdyYWRlRGF0YSwgb25NaWdyYXRpb25Db21wbGV0ZSk7XG59XG5cbi8qKiBFbnRyeSBwb2ludCBmb3IgdGhlIG1pZ3JhdGlvbiBzY2hlbWF0aWNzIHdpdGggdGFyZ2V0IG9mIEFuZ3VsYXIgQ0RLIDcuMC4wICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlVG9WNygpOiBSdWxlIHtcbiAgcmV0dXJuIGNyZWF0ZVVwZ3JhZGVSdWxlKFRhcmdldFZlcnNpb24uVjcsIFtdLCBjZGtVcGdyYWRlRGF0YSwgb25NaWdyYXRpb25Db21wbGV0ZSk7XG59XG5cbi8qKiBFbnRyeSBwb2ludCBmb3IgdGhlIG1pZ3JhdGlvbiBzY2hlbWF0aWNzIHdpdGggdGFyZ2V0IG9mIEFuZ3VsYXIgQ0RLIDguMC4wICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlVG9WOCgpOiBSdWxlIHtcbiAgcmV0dXJuIGNyZWF0ZVVwZ3JhZGVSdWxlKFRhcmdldFZlcnNpb24uVjgsIFtdLCBjZGtVcGdyYWRlRGF0YSwgb25NaWdyYXRpb25Db21wbGV0ZSk7XG59XG5cbi8qKiBFbnRyeSBwb2ludCBmb3IgdGhlIG1pZ3JhdGlvbiBzY2hlbWF0aWNzIHdpdGggdGFyZ2V0IG9mIEFuZ3VsYXIgQ0RLIDkuMC4wICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlVG9WOSgpOiBSdWxlIHtcbiAgcmV0dXJuIGNyZWF0ZVVwZ3JhZGVSdWxlKFRhcmdldFZlcnNpb24uVjksIFtdLCBjZGtVcGdyYWRlRGF0YSwgb25NaWdyYXRpb25Db21wbGV0ZSk7XG59XG5cbi8qKiBGdW5jdGlvbiB0aGF0IHdpbGwgYmUgY2FsbGVkIHdoZW4gdGhlIG1pZ3JhdGlvbiBjb21wbGV0ZWQuICovXG5mdW5jdGlvbiBvbk1pZ3JhdGlvbkNvbXBsZXRlKHRhcmdldFZlcnNpb246IFRhcmdldFZlcnNpb24sIGhhc0ZhaWx1cmVzOiBib29sZWFuKSB7XG4gIGNvbnNvbGUubG9nKCk7XG4gIGNvbnNvbGUubG9nKGdyZWVuKGAgIOKckyAgVXBkYXRlZCBBbmd1bGFyIENESyB0byAke3RhcmdldFZlcnNpb259YCkpO1xuICBjb25zb2xlLmxvZygpO1xuXG4gIGlmIChoYXNGYWlsdXJlcykge1xuICAgIGNvbnNvbGUubG9nKHllbGxvdyhcbiAgICAgICcgIOKaoCAgU29tZSBpc3N1ZXMgd2VyZSBkZXRlY3RlZCBidXQgY291bGQgbm90IGJlIGZpeGVkIGF1dG9tYXRpY2FsbHkuIFBsZWFzZSBjaGVjayB0aGUgJyArXG4gICAgICAnb3V0cHV0IGFib3ZlIGFuZCBmaXggdGhlc2UgaXNzdWVzIG1hbnVhbGx5LicpKTtcbiAgfVxufVxuIl19