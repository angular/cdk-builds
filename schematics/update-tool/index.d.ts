/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/cdk/schematics/update-tool" />
import { logging } from '@angular-devkit/core';
import { Tree } from '@angular-devkit/schematics';
import { MigrationRule } from './migration-rule';
import { TargetVersion } from './target-version';
export declare type Constructor<T> = (new (...args: any[]) => T);
export declare type MigrationRuleType<T> = Constructor<MigrationRule<T>> & {
    [m in keyof typeof MigrationRule]: (typeof MigrationRule)[m];
};
export declare function runMigrationRules<T>(tree: Tree, logger: logging.LoggerApi, tsconfigPath: string, isTestTarget: boolean, targetVersion: TargetVersion, ruleTypes: MigrationRuleType<T>[], upgradeData: T, analyzedFiles: Set<string>): {
    hasFailures: boolean;
};
