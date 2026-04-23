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
exports.getAngularDecorators = getAngularDecorators;
exports.getCallDecoratorImport = getCallDecoratorImport;
const ts = __importStar(require("typescript"));
const imports_1 = require("./imports");
/**
 * Gets all decorators which are imported from an Angular package
 * (e.g. "@angular/core") from a list of decorators.
 */
function getAngularDecorators(typeChecker, decorators) {
    return decorators
        .map(node => ({ node, importData: getCallDecoratorImport(typeChecker, node) }))
        .filter(({ importData }) => importData && importData.moduleName.startsWith('@angular/'))
        .map(({ node, importData }) => ({
        node: node,
        name: importData.symbolName,
    }));
}
function getCallDecoratorImport(typeChecker, decorator) {
    if (!ts.isCallExpression(decorator.expression)) {
        return null;
    }
    const valueExpr = decorator.expression.expression;
    let identifier = null;
    if (ts.isIdentifier(valueExpr)) {
        identifier = valueExpr;
    }
    else if (ts.isPropertyAccessExpression(valueExpr) && ts.isIdentifier(valueExpr.name)) {
        identifier = valueExpr.name;
    }
    return identifier ? (0, imports_1.getImportOfIdentifier)(identifier, typeChecker) : null;
}
//# sourceMappingURL=decorators.js.map