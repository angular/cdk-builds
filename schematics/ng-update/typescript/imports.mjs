"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isImportSpecifierNode = isImportSpecifierNode;
exports.isExportSpecifierNode = isExportSpecifierNode;
exports.isNamespaceImportNode = isNamespaceImportNode;
exports.getImportDeclaration = getImportDeclaration;
exports.getExportDeclaration = getExportDeclaration;
const ts = require("typescript");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2NoZW1hdGljcy9uZy11cGRhdGUvdHlwZXNjcmlwdC9pbXBvcnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBS0gsc0RBRUM7QUFHRCxzREFFQztBQUdELHNEQUVDO0FBR0Qsb0RBRUM7QUFHRCxvREFFQztBQXpCRCxpQ0FBaUM7QUFFakMseUVBQXlFO0FBQ3pFLFNBQWdCLHFCQUFxQixDQUFDLElBQWE7SUFDakQsT0FBTyxZQUFZLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLENBQUM7QUFDM0QsQ0FBQztBQUVELHlFQUF5RTtBQUN6RSxTQUFnQixxQkFBcUIsQ0FBQyxJQUFhO0lBQ2pELE9BQU8sWUFBWSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBQzNELENBQUM7QUFFRCxtRUFBbUU7QUFDbkUsU0FBZ0IscUJBQXFCLENBQUMsSUFBYTtJQUNqRCxPQUFPLFlBQVksQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUMzRCxDQUFDO0FBRUQsc0VBQXNFO0FBQ3RFLFNBQWdCLG9CQUFvQixDQUFDLElBQWE7SUFDaEQsT0FBTyxlQUFlLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsaUJBQWlCLENBQXlCLENBQUM7QUFDeEYsQ0FBQztBQUVELHFFQUFxRTtBQUNyRSxTQUFnQixvQkFBb0IsQ0FBQyxJQUFhO0lBQ2hELE9BQU8sZUFBZSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLGlCQUFpQixDQUF5QixDQUFDO0FBQ3hGLENBQUM7QUFFRCw2RkFBNkY7QUFDN0YsU0FBUyxlQUFlLENBQTBCLElBQWEsRUFBRSxJQUFPO0lBQ3RFLE9BQU8sSUFBSSxDQUFDLElBQUksS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUMxQixJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUNyQixDQUFDO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsZ0dBQWdHO0FBQ2hHLFNBQVMsWUFBWSxDQUEwQixJQUFhLEVBQUUsSUFBTztJQUNuRSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssSUFBSSxFQUFFLENBQUM7UUFDdkIsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO1NBQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDbEQsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQsT0FBTyxZQUFZLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztBQUN6QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG4vKiogQ2hlY2tzIHdoZXRoZXIgdGhlIGdpdmVuIG5vZGUgaXMgcGFydCBvZiBhbiBpbXBvcnQgc3BlY2lmaWVyIG5vZGUuICovXG5leHBvcnQgZnVuY3Rpb24gaXNJbXBvcnRTcGVjaWZpZXJOb2RlKG5vZGU6IHRzLk5vZGUpIHtcbiAgcmV0dXJuIGlzUGFydE9mS2luZChub2RlLCB0cy5TeW50YXhLaW5kLkltcG9ydFNwZWNpZmllcik7XG59XG5cbi8qKiBDaGVja3Mgd2hldGhlciB0aGUgZ2l2ZW4gbm9kZSBpcyBwYXJ0IG9mIGFuIGV4cG9ydCBzcGVjaWZpZXIgbm9kZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0V4cG9ydFNwZWNpZmllck5vZGUobm9kZTogdHMuTm9kZSkge1xuICByZXR1cm4gaXNQYXJ0T2ZLaW5kKG5vZGUsIHRzLlN5bnRheEtpbmQuRXhwb3J0U3BlY2lmaWVyKTtcbn1cblxuLyoqIENoZWNrcyB3aGV0aGVyIHRoZSBnaXZlbiBub2RlIGlzIHBhcnQgb2YgYSBuYW1lc3BhY2UgaW1wb3J0LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTmFtZXNwYWNlSW1wb3J0Tm9kZShub2RlOiB0cy5Ob2RlKSB7XG4gIHJldHVybiBpc1BhcnRPZktpbmQobm9kZSwgdHMuU3ludGF4S2luZC5OYW1lc3BhY2VJbXBvcnQpO1xufVxuXG4vKiogRmluZHMgdGhlIHBhcmVudCBpbXBvcnQgZGVjbGFyYXRpb24gb2YgYSBnaXZlbiBUeXBlU2NyaXB0IG5vZGUuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW1wb3J0RGVjbGFyYXRpb24obm9kZTogdHMuTm9kZSkge1xuICByZXR1cm4gZmluZERlY2xhcmF0aW9uKG5vZGUsIHRzLlN5bnRheEtpbmQuSW1wb3J0RGVjbGFyYXRpb24pIGFzIHRzLkltcG9ydERlY2xhcmF0aW9uO1xufVxuXG4vKiogRmluZHMgdGhlIHBhcmVudCBleHBvcnQgZGVjbGFyYXRpb24gb2YgYSBnaXZlbiBUeXBlU2NyaXB0IG5vZGUgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRFeHBvcnREZWNsYXJhdGlvbihub2RlOiB0cy5Ob2RlKSB7XG4gIHJldHVybiBmaW5kRGVjbGFyYXRpb24obm9kZSwgdHMuU3ludGF4S2luZC5FeHBvcnREZWNsYXJhdGlvbikgYXMgdHMuRXhwb3J0RGVjbGFyYXRpb247XG59XG5cbi8qKiBGaW5kcyB0aGUgc3BlY2lmaWVkIGRlY2xhcmF0aW9uIGZvciB0aGUgZ2l2ZW4gbm9kZSBieSB3YWxraW5nIHVwIHRoZSBUeXBlU2NyaXB0IG5vZGVzLiAqL1xuZnVuY3Rpb24gZmluZERlY2xhcmF0aW9uPFQgZXh0ZW5kcyB0cy5TeW50YXhLaW5kPihub2RlOiB0cy5Ob2RlLCBraW5kOiBUKSB7XG4gIHdoaWxlIChub2RlLmtpbmQgIT09IGtpbmQpIHtcbiAgICBub2RlID0gbm9kZS5wYXJlbnQ7XG4gIH1cblxuICByZXR1cm4gbm9kZTtcbn1cblxuLyoqIENoZWNrcyB3aGV0aGVyIHRoZSBnaXZlbiBub2RlIGlzIHBhcnQgb2YgYW5vdGhlciBUeXBlU2NyaXB0IE5vZGUgd2l0aCB0aGUgc3BlY2lmaWVkIGtpbmQuICovXG5mdW5jdGlvbiBpc1BhcnRPZktpbmQ8VCBleHRlbmRzIHRzLlN5bnRheEtpbmQ+KG5vZGU6IHRzLk5vZGUsIGtpbmQ6IFQpOiBib29sZWFuIHtcbiAgaWYgKG5vZGUua2luZCA9PT0ga2luZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKG5vZGUua2luZCA9PT0gdHMuU3ludGF4S2luZC5Tb3VyY2VGaWxlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIGlzUGFydE9mS2luZChub2RlLnBhcmVudCwga2luZCk7XG59XG4iXX0=