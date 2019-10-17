/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/cdk/schematics/update-tool/migration-rule" />
import { logging } from '@angular-devkit/core';
import { SchematicContext, Tree, UpdateRecorder } from '@angular-devkit/schematics';
import * as ts from 'typescript';
import { ResolvedResource } from './component-resource-collector';
import { TargetVersion } from './target-version';
import { LineAndCharacter } from './utils/line-mappings';
export interface MigrationFailure {
    filePath: string;
    message: string;
    position?: LineAndCharacter;
}
export declare class MigrationRule<T> {
    /** TypeScript program for the migration. */
    program: ts.Program;
    /** TypeChecker instance for the analysis program. */
    typeChecker: ts.TypeChecker;
    /** Version for which the migration rule should run. */
    targetVersion: TargetVersion;
    /** Upgrade data passed to the migration. */
    upgradeData: T;
    /** Devkit tree for the current migration. Can be used to insert/remove files. */
    tree: Tree;
    /** Gets the update recorder for a given source file or resolved template. */
    getUpdateRecorder: (filePath: string) => UpdateRecorder;
    /** Base directory of the virtual file system tree. */
    basePath: string;
    /** Logger that can be used to print messages as part of the migration. */
    logger: logging.LoggerApi;
    /** Whether the migration runs for a test target. */
    isTestTarget: boolean;
    /** Path to the tsconfig that is migrated. */
    tsconfigPath: string;
    /** List of migration failures that need to be reported. */
    failures: MigrationFailure[];
    /** Whether the migration rule is enabled or not. */
    ruleEnabled: boolean;
    constructor(
    /** TypeScript program for the migration. */
    program: ts.Program, 
    /** TypeChecker instance for the analysis program. */
    typeChecker: ts.TypeChecker, 
    /** Version for which the migration rule should run. */
    targetVersion: TargetVersion, 
    /** Upgrade data passed to the migration. */
    upgradeData: T, 
    /** Devkit tree for the current migration. Can be used to insert/remove files. */
    tree: Tree, 
    /** Gets the update recorder for a given source file or resolved template. */
    getUpdateRecorder: (filePath: string) => UpdateRecorder, 
    /** Base directory of the virtual file system tree. */
    basePath: string, 
    /** Logger that can be used to print messages as part of the migration. */
    logger: logging.LoggerApi, 
    /** Whether the migration runs for a test target. */
    isTestTarget: boolean, 
    /** Path to the tsconfig that is migrated. */
    tsconfigPath: string);
    /** Method can be used to perform global analysis of the program. */
    init(): void;
    /**
     * Method that will be called once all nodes, templates and stylesheets
     * have been visited.
     */
    postAnalysis(): void;
    /**
     * Method that will be called for each node in a given source file. Unlike tslint, this
     * function will only retrieve TypeScript nodes that need to be casted manually. This
     * allows us to only walk the program source files once per program and not per
     * migration rule (significant performance boost).
     */
    visitNode(node: ts.Node): void;
    /** Method that will be called for each Angular template in the program. */
    visitTemplate(template: ResolvedResource): void;
    /** Method that will be called for each stylesheet in the program. */
    visitStylesheet(stylesheet: ResolvedResource): void;
    /** Creates a failure with a specified message at the given node location. */
    createFailureAtNode(node: ts.Node, message: string): void;
    /** Prints the specified message with "info" loglevel. */
    printInfo(text: string): void;
    /**
     * Static method that will be called once the migration of all project targets
     * has been performed. This method can be used to make changes respecting the
     * migration result of all individual targets. e.g. removing HammerJS if it
     * is not needed in any project target.
     */
    static globalPostMigration(tree: Tree, context: SchematicContext): void;
}
