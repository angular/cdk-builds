"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const testing_1 = require("@angular-devkit/core/node/testing");
const virtualFs = require("@angular-devkit/core/src/virtual-fs/host");
const testing_2 = require("@angular-devkit/schematics/testing");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const testing_3 = require("../testing");
/** Reads the UTF8 content of the specified file. Normalizes the path and ensures that */
function readFileContent(filePath) {
    return fs_extra_1.readFileSync(filePath, 'utf8');
}
exports.readFileContent = readFileContent;
/**
 * Creates a test app schematic tree that will be copied over to a real filesystem location.
 * This is necessary because TSLint is not able to read from the virtual filesystem tree.
 */
function createFileSystemTestApp(runner) {
    const tempFileSystemHost = new testing_1.TempScopedNodeJsSyncHost();
    const appTree = testing_3.createTestApp(runner, { name: 'cdk-testing' });
    const tempPath = core_1.getSystemPath(tempFileSystemHost.root);
    // Since the TSLint fix task expects all files to be present on the real file system, we
    // map every file in the app tree to a temporary location on the file system.
    appTree.files.map(f => core_1.normalize(f)).forEach(f => {
        tempFileSystemHost.sync.write(f, virtualFs.stringToFileBuffer(appTree.readContent(f)));
    });
    return { appTree, tempPath };
}
exports.createFileSystemTestApp = createFileSystemTestApp;
function runTestCases(migrationName, collectionPath, inputs) {
    return __awaiter(this, void 0, void 0, function* () {
        const runner = new testing_2.SchematicTestRunner('schematics', collectionPath);
        const inputNames = Object.keys(inputs);
        const initialWorkingDir = process.cwd();
        let logOutput = '';
        runner.logger.subscribe(entry => logOutput += entry.message);
        const { appTree, tempPath } = createFileSystemTestApp(runner);
        // Write each test-case input to the file-system. This is necessary because otherwise
        // TSLint won't be able to pick up the test cases.
        inputNames.forEach(inputName => {
            const tempInputPath = path_1.join(tempPath, `projects/cdk-testing/src/test-cases/${inputName}.ts`);
            fs_extra_1.mkdirpSync(path_1.dirname(tempInputPath));
            fs_extra_1.writeFileSync(tempInputPath, readFileContent(inputs[inputName]));
        });
        runner.runSchematic(migrationName, {}, appTree);
        // Switch to the new temporary directory because otherwise TSLint cannot read the files.
        process.chdir(tempPath);
        // Run the scheduled TSLint fix task from the update schematic. This task is responsible for
        // identifying outdated code parts and performs the fixes. Since tasks won't run automatically
        // within a `SchematicTestRunner`, we manually need to run the scheduled task.
        yield testing_3.runPostScheduledTasks(runner, 'tslint-fix').toPromise();
        // Switch back to the initial working directory.
        process.chdir(initialWorkingDir);
        return { tempPath, logOutput };
    });
}
exports.runTestCases = runTestCases;
//# sourceMappingURL=test-case-setup.js.map