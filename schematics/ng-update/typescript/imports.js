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
exports.isImportSpecifierNode = isImportSpecifierNode;
exports.isExportSpecifierNode = isExportSpecifierNode;
exports.isNamespaceImportNode = isNamespaceImportNode;
exports.getImportDeclaration = getImportDeclaration;
exports.getExportDeclaration = getExportDeclaration;
const ts = __importStar(require("typescript"));
/** Checks whether the given node is part of an import specifier node. */
function isImportSpecifierNode(node) {
    return isPartOfKind(node, ts.SyntaxKind.ImportSpecifier);
}
/** Checks whether the given node is part of an export specifier node. */
function isExportSpecifierNode(node) {
    return isPartOfKind(node, ts.SyntaxKind.ExportSpecifier);
}
/** Checks whether the given node is part of a namespace import. */
function isNamespaceImportNode(node) {
    return isPartOfKind(node, ts.SyntaxKind.NamespaceImport);
}
/** Finds the parent import declaration of a given TypeScript node. */
function getImportDeclaration(node) {
    return findDeclaration(node, ts.SyntaxKind.ImportDeclaration);
}
/** Finds the parent export declaration of a given TypeScript node */
function getExportDeclaration(node) {
    return findDeclaration(node, ts.SyntaxKind.ExportDeclaration);
}
/** Finds the specified declaration for the given node by walking up the TypeScript nodes. */
function findDeclaration(node, kind) {
    while (node.kind !== kind) {
        node = node.parent;
    }
    return node;
}
/** Checks whether the given node is part of another TypeScript Node with the specified kind. */
function isPartOfKind(node, kind) {
    if (node.kind === kind) {
        return true;
    }
    else if (node.kind === ts.SyntaxKind.SourceFile) {
        return false;
    }
    return isPartOfKind(node.parent, kind);
}
//# sourceMappingURL=imports.js.map