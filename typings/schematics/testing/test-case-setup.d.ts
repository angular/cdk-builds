/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
/** Reads the UTF8 content of the specified file. Normalizes the path and ensures that */
export declare function readFileContent(filePath: string): string;
/**
 * Creates a test app schematic tree that will be copied over to a real filesystem location.
 * This is necessary because TSLint is not able to read from the virtual filesystem tree.
 */
export declare function createFileSystemTestApp(runner: SchematicTestRunner): {
    appTree: import("@angular-devkit/schematics/testing/schematic-test-runner").UnitTestTree;
    tempPath: string;
};
export declare function runTestCases(migrationName: string, collectionPath: string, inputs: {
    [name: string]: string;
}): Promise<{
    tempPath: string;
    logOutput: string;
}>;
