"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const target_version_1 = require("../update-tool/target-version");
const upgrade_data_1 = require("./upgrade-data");
const upgrade_rules_1 = require("./upgrade-rules");
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
//# sourceMappingURL=index.js.map