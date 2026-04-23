"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TsconfigParseError = void 0;
exports.parseTsconfigFile = parseTsconfigFile;
const ts = __importStar(require("typescript"));
const virtual_host_1 = require("./virtual-host");
const path_1 = require("path");
const diagnostics_1 = require("./diagnostics");
/** Code of the error raised by TypeScript when a tsconfig doesn't match any files. */
const NO_INPUTS_ERROR_CODE = 18003;
/** Class capturing a tsconfig parse error. */
class TsconfigParseError extends Error {
}
exports.TsconfigParseError = TsconfigParseError;
/**
 * Attempts to parse the specified tsconfig file.
 *
 * @throws {TsconfigParseError} If the tsconfig could not be read or parsed.
 */
function parseTsconfigFile(tsconfigPath, fileSystem) {
    if (!fileSystem.fileExists(tsconfigPath)) {
        throw new TsconfigParseError(`Tsconfig cannot not be read: ${tsconfigPath}`);
    }
    const { config, error } = ts.readConfigFile(tsconfigPath, p => fileSystem.read(fileSystem.resolve(p)));
    // If there is a config reading error, we never attempt to parse the config.
    if (error) {
        throw new TsconfigParseError((0, diagnostics_1.formatDiagnostics)([error], fileSystem));
    }
    const parsed = ts.parseJsonConfigFileContent(config, new virtual_host_1.FileSystemHost(fileSystem), (0, path_1.dirname)(tsconfigPath), {});
    // Skip the "No inputs found..." error since we don't want to interrupt the migration if a
    // tsconfig doesn't match a file. This will result in an empty `Program` which is still valid.
    const errors = parsed.errors.filter(diag => diag.code !== NO_INPUTS_ERROR_CODE);
    if (errors.length) {
        throw new TsconfigParseError((0, diagnostics_1.formatDiagnostics)(errors, fileSystem));
    }
    return parsed;
}
//# sourceMappingURL=parse-tsconfig.js.map