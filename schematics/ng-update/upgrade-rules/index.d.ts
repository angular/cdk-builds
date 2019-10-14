/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/cdk/schematics/ng-update/upgrade-rules/index" />
import { Rule } from '@angular-devkit/schematics';
import { MigrationRuleType } from '../../update-tool';
import { TargetVersion } from '../../update-tool/target-version';
import { RuleUpgradeData } from '../upgrade-data';
/** List of migration rules which run for the CDK update. */
export declare const cdkMigrationRules: MigrationRuleType<RuleUpgradeData>[];
declare type NullableMigrationRule = MigrationRuleType<RuleUpgradeData | null>;
/**
 * Creates a Angular schematic rule that runs the upgrade for the
 * specified target version.
 */
export declare function createUpgradeRule(targetVersion: TargetVersion, extraRules: NullableMigrationRule[], upgradeData: RuleUpgradeData, onMigrationCompleteFn?: (targetVersion: TargetVersion, hasFailures: boolean) => void): Rule;
export {};
