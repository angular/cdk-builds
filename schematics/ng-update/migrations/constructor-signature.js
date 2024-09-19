"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConstructorSignatureMigration = void 0;
const ts = require("typescript");
const migration_1 = require("../../update-tool/migration");
const version_changes_1 = require("../../update-tool/version-changes");
/**
 * List of diagnostic codes that refer to pre-emit diagnostics which indicate invalid
 * new expression or super call signatures. See the list of diagnostics here:
 *
 * https://github.com/Microsoft/TypeScript/blob/master/src/compiler/diagnosticMessages.json
 */
const signatureErrorDiagnostics = [
    // Type not assignable error diagnostic.
    2345,
    // Constructor argument length invalid diagnostics
    2554, 2555, 2556, 2557,
];
/**
 * Migration that visits every TypeScript new expression or super call and checks if
 * the parameter type signature is invalid and needs to be updated manually.
 */
class ConstructorSignatureMigration extends migration_1.Migration {
    // Note that the data for this rule is not distinguished based on the target version because
    // we don't keep track of the new signature and don't want to update incrementally.
    // See: https://github.com/angular/components/pull/12970#issuecomment-418337566
    data = (0, version_changes_1.getAllChanges)(this.upgradeData.constructorChecks);
    // Only enable the migration rule if there is upgrade data.
    enabled = this.data.length !== 0;
    visitNode(node) {
        if (ts.isSourceFile(node)) {
            this._visitSourceFile(node);
        }
    }
    /**
     * Method that will be called for each source file of the upgrade project. In order to
     * properly determine invalid constructor signatures, we take advantage of the pre-emit
     * diagnostics from TypeScript.
     *
     * By using the diagnostics, the migration can handle type assignability. Not using
     * diagnostics would mean that we need to use simple type equality checking which is
     * too strict. See related issue: https://github.com/Microsoft/TypeScript/issues/9879
     */
    _visitSourceFile(sourceFile) {
        // List of classes of which the constructor signature has changed.
        const diagnostics = ts
            .getPreEmitDiagnostics(this.program, sourceFile)
            .filter(diagnostic => signatureErrorDiagnostics.includes(diagnostic.code))
            .filter(diagnostic => diagnostic.start !== undefined);
        for (const diagnostic of diagnostics) {
            const node = findConstructorNode(diagnostic, sourceFile);
            if (!node) {
                continue;
            }
            const classType = this.typeChecker.getTypeAtLocation(node.expression);
            const className = classType.symbol && classType.symbol.name;
            const isNewExpression = ts.isNewExpression(node);
            // Determine the class names of the actual construct signatures because we cannot assume that
            // the diagnostic refers to a constructor of the actual expression. In case the constructor
            // is inherited, we need to detect that the owner-class of the constructor is added to the
            // constructor checks upgrade data. e.g. `class CustomCalendar extends MatCalendar {}`.
            const signatureClassNames = classType
                .getConstructSignatures()
                .map(signature => getClassDeclarationOfSignature(signature))
                .map(declaration => (declaration && declaration.name ? declaration.name.text : null))
                .filter(Boolean);
            // Besides checking the signature class names, we need to check the actual class name because
            // there can be classes without an explicit constructor.
            if (!this.data.includes(className) &&
                !signatureClassNames.some(name => this.data.includes(name))) {
                continue;
            }
            const classSignatures = classType
                .getConstructSignatures()
                .map(signature => getParameterTypesFromSignature(signature, this.typeChecker));
            const expressionName = isNewExpression ? `new ${className}` : 'super';
            const signatures = classSignatures
                .map(signature => signature.map(t => (t === null ? 'any' : this.typeChecker.typeToString(t))))
                .map(signature => `${expressionName}(${signature.join(', ')})`)
                .join(' or ');
            this.createFailureAtNode(node, `Found "${className}" constructed with ` +
                `an invalid signature. Please manually update the ${expressionName} expression to ` +
                `match the new signature${classSignatures.length > 1 ? 's' : ''}: ${signatures}`);
        }
    }
}
exports.ConstructorSignatureMigration = ConstructorSignatureMigration;
/** Resolves the type for each parameter in the specified signature. */
function getParameterTypesFromSignature(signature, typeChecker) {
    return signature
        .getParameters()
        .map(param => param.declarations ? typeChecker.getTypeAtLocation(param.declarations[0]) : null);
}
/**
 * Walks through each node of a source file in order to find a new-expression node or super-call
 * expression node that is captured by the specified diagnostic.
 */
function findConstructorNode(diagnostic, sourceFile) {
    let resolvedNode = null;
    const _visitNode = (node) => {
        // Check whether the current node contains the diagnostic. If the node contains the diagnostic,
        // walk deeper in order to find all constructor expression nodes.
        if (node.getStart() <= diagnostic.start && node.getEnd() >= diagnostic.start) {
            if (ts.isNewExpression(node) ||
                (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.SuperKeyword)) {
                resolvedNode = node;
            }
            ts.forEachChild(node, _visitNode);
        }
    };
    ts.forEachChild(sourceFile, _visitNode);
    return resolvedNode;
}
/** Determines the class declaration of the specified construct signature. */
function getClassDeclarationOfSignature(signature) {
    let node = signature.getDeclaration();
    // Handle signatures which don't have an actual declaration. This happens if a class
    // does not have an explicitly written constructor.
    if (!node) {
        return null;
    }
    while (!ts.isSourceFile((node = node.parent))) {
        if (ts.isClassDeclaration(node)) {
            return node;
        }
    }
    return null;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RydWN0b3Itc2lnbmF0dXJlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL25nLXVwZGF0ZS9taWdyYXRpb25zL2NvbnN0cnVjdG9yLXNpZ25hdHVyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCxpQ0FBaUM7QUFDakMsMkRBQXNEO0FBQ3RELHVFQUFnRTtBQUdoRTs7Ozs7R0FLRztBQUNILE1BQU0seUJBQXlCLEdBQUc7SUFDaEMsd0NBQXdDO0lBQ3hDLElBQUk7SUFDSixrREFBa0Q7SUFDbEQsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSTtDQUN2QixDQUFDO0FBRUY7OztHQUdHO0FBQ0gsTUFBYSw2QkFBOEIsU0FBUSxxQkFBc0I7SUFDdkUsNEZBQTRGO0lBQzVGLG1GQUFtRjtJQUNuRiwrRUFBK0U7SUFDL0UsSUFBSSxHQUFHLElBQUEsK0JBQWEsRUFBQyxJQUFJLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLENBQUM7SUFFekQsMkRBQTJEO0lBQzNELE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7SUFFeEIsU0FBUyxDQUFDLElBQWE7UUFDOUIsSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlCLENBQUM7SUFDSCxDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSyxnQkFBZ0IsQ0FBQyxVQUF5QjtRQUNoRCxrRUFBa0U7UUFDbEUsTUFBTSxXQUFXLEdBQUcsRUFBRTthQUNuQixxQkFBcUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQzthQUMvQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxR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R0FBWSxTQUFTLENBQUMsY0FBYyxFQUFFLENBQUM7SUFDL0Msb0ZBQW9GO0lBQ3BGLG1EQUFtRDtJQUNuRCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDVixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFDRCxPQUFPLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQzlDLElBQUksRUFBRSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDaEMsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO0lBQ0gsQ0FBQztJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmRldi9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge01pZ3JhdGlvbn0gZnJvbSAnLi4vLi4vdXBkYXRlLXRvb2wvbWlncmF0aW9uJztcbmltcG9ydCB7Z2V0QWxsQ2hhbmdlc30gZnJvbSAnLi4vLi4vdXBkYXRlLXRvb2wvdmVyc2lvbi1jaGFuZ2VzJztcbmltcG9ydCB7VXBncmFkZURhdGF9IGZyb20gJy4uL3VwZ3JhZGUtZGF0YSc7XG5cbi8qKlxuICogTGlzdCBvZiBkaWFnbm9zdGljIGNvZGVzIHRoYXQgcmVmZXIgdG8gcHJlLWVtaXQgZGlhZ25vc3RpY3Mgd2hpY2ggaW5kaWNhdGUgaW52YWxpZFxuICogbmV3IGV4cHJlc3Npb24gb3Igc3VwZXIgY2FsbCBzaWduYXR1cmVzLiBTZWUgdGhlIGxpc3Qgb2YgZGlhZ25vc3RpY3MgaGVyZTpcbiAqXG4gKiBodHRwczovL2dpdGh1Yi5jb20vTWljcm9zb2Z0L1R5cGVTY3JpcHQvYmxvYi9tYXN0ZXIvc3JjL2NvbXBpbGVyL2RpYWdub3N0aWNNZXNzYWdlcy5qc29uXG4gKi9cbmNvbnN0IHNpZ25hdHVyZUVycm9yRGlhZ25vc3RpY3MgPSBbXG4gIC8vIFR5cGUgbm90IGFzc2lnbmFibGUgZXJyb3IgZGlhZ25vc3RpYy5cbiAgMjM0NSxcbiAgLy8gQ29uc3RydWN0b3IgYXJndW1lbnQgbGVuZ3RoIGludmFsaWQgZGlhZ25vc3RpY3NcbiAgMjU1NCwgMjU1NSwgMjU1NiwgMjU1Nyxcbl07XG5cbi8qKlxuICogTWlncmF0aW9uIHRoYXQgdmlzaXRzIGV2ZXJ5IFR5cGVTY3JpcHQgbmV3IGV4cHJlc3Npb24gb3Igc3VwZXIgY2FsbCBhbmQgY2hlY2tzIGlmXG4gKiB0aGUgcGFyYW1ldGVyIHR5cGUgc2lnbmF0dXJlIGlzIGludmFsaWQgYW5kIG5lZWRzIHRvIGJlIHVwZGF0ZWQgbWFudWFsbHkuXG4gKi9cbmV4cG9ydCBjbGFzcyBDb25zdHJ1Y3RvclNpZ25hdHVyZU1pZ3JhdGlvbiBleHRlbmRzIE1pZ3JhdGlvbjxVcGdyYWRlRGF0YT4ge1xuICAvLyBOb3RlIHRoYXQgdGhlIGRhdGEgZm9yIHRoaXMgcnVsZSBpcyBub3QgZGlzdGluZ3Vpc2hlZCBiYXNlZCBvbiB0aGUgdGFyZ2V0IHZlcnNpb24gYmVjYXVzZVxuICAvLyB3ZSBkb24ndCBrZWVwIHRyYWNrIG9mIHRoZSBuZXcgc2lnbmF0dXJlIGFuZCBkb24ndCB3YW50IHRvIHVwZGF0ZSBpbmNyZW1lbnRhbGx5LlxuICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2NvbXBvbmVudHMvcHVsbC8xMjk3MCNpc3N1ZWNvbW1lbnQtNDE4MzM3NTY2XG4gIGRhdGEgPSBnZXRBbGxDaGFuZ2VzKHRoaXMudXBncmFkZURhdGEuY29uc3RydWN0b3JDaGVja3MpO1xuXG4gIC8vIE9ubHkgZW5hYmxlIHRoZSBtaWdyYXRpb24gcnVsZSBpZiB0aGVyZSBpcyB1cGdyYWRlIGRhdGEuXG4gIGVuYWJsZWQgPSB0aGlzLmRhdGEubGVuZ3RoICE9PSAwO1xuXG4gIG92ZXJyaWRlIHZpc2l0Tm9kZShub2RlOiB0cy5Ob2RlKTogdm9pZCB7XG4gICAgaWYgKHRzLmlzU291cmNlRmlsZShub2RlKSkge1xuICAgICAgdGhpcy5fdmlzaXRTb3VyY2VGaWxlKG5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBNZXRob2QgdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBzb3VyY2UgZmlsZSBvZiB0aGUgdXBncmFkZSBwcm9qZWN0LiBJbiBvcmRlciB0b1xuICAgKiBwcm9wZXJseSBkZXRlcm1pbmUgaW52YWxpZCBjb25zdHJ1Y3RvciBzaWduYXR1cmVzLCB3ZSB0YWtlIGFkdmFudGFnZSBvZiB0aGUgcHJlLWVtaXRcbiAgICogZGlhZ25vc3RpY3MgZnJvbSBUeXBlU2NyaXB0LlxuICAgKlxuICAgKiBCeSB1c2luZyB0aGUgZGlhZ25vc3RpY3MsIHRoZSBtaWdyYXRpb24gY2FuIGhhbmRsZSB0eXBlIGFzc2lnbmFiaWxpdHkuIE5vdCB1c2luZ1xuICAgKiBkaWFnbm9zdGljcyB3b3VsZCBtZWFuIHRoYXQgd2UgbmVlZCB0byB1c2Ugc2ltcGxlIHR5cGUgZXF1YWxpdHkgY2hlY2tpbmcgd2hpY2ggaXNcbiAgICogdG9vIHN0cmljdC4gU2VlIHJlbGF0ZWQgaXNzdWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9NaWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvOTg3OVxuICAgKi9cbiAgcHJpdmF0ZSBfdmlzaXRTb3VyY2VGaWxlKHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpIHtcbiAgICAvLyBMaXN0IG9mIGNsYXNzZXMgb2Ygd2hpY2ggdGhlIGNvbnN0cnVjdG9yIHNpZ25hdHVyZSBoYXMgY2hhbmdlZC5cbiAgICBjb25zdCBkaWFnbm9zdGljcyA9IHRzXG4gICAgICAuZ2V0UHJlRW1pdERpYWdub3N0aWNzKHRoaXMucHJvZ3JhbSwgc291cmNlRmlsZSlcbiAgICAgIC5maWx0ZXIoZGlhZ25vc3RpYyA9PiBzaWduYXR1cmVFcnJvckRpYWdub3N0aWNzLmluY2x1ZGVzKGRpYWdub3N0aWMuY29kZSkpXG4gICAgICAuZmlsdGVyKGRpYWdub3N0aWMgPT4gZGlhZ25vc3RpYy5zdGFydCAhPT0gdW5kZWZpbmVkKTtcblxuICAgIGZvciAoY29uc3QgZGlhZ25vc3RpYyBvZiBkaWFnbm9zdGljcykge1xuICAgICAgY29uc3Qgbm9kZSA9IGZpbmRDb25zdHJ1Y3Rvck5vZGUoZGlhZ25vc3RpYywgc291cmNlRmlsZSk7XG5cbiAgICAgIGlmICghbm9kZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY2xhc3NUeXBlID0gdGhpcy50eXBlQ2hlY2tlci5nZXRUeXBlQXRMb2NhdGlvbihub2RlLmV4cHJlc3Npb24pO1xuICAgICAgY29uc3QgY2xhc3NOYW1lID0gY2xhc3NUeXBlLnN5bWJvbCAmJiBjbGFzc1R5cGUuc3ltYm9sLm5hbWU7XG4gICAgICBjb25zdCBpc05ld0V4cHJlc3Npb24gPSB0cy5pc05ld0V4cHJlc3Npb24obm9kZSk7XG5cbiAgICAgIC8vIERldGVybWluZSB0aGUgY2xhc3MgbmFtZXMgb2YgdGhlIGFjdHVhbCBjb25zdHJ1Y3Qgc2lnbmF0dXJlcyBiZWNhdXNlIHdlIGNhbm5vdCBhc3N1bWUgdGhhdFxuICAgICAgLy8gdGhlIGRpYWdub3N0aWMgcmVmZXJzIHRvIGEgY29uc3RydWN0b3Igb2YgdGhlIGFjdHVhbCBleHByZXNzaW9uLiBJbiBjYXNlIHRoZSBjb25zdHJ1Y3RvclxuICAgICAgLy8gaXMgaW5oZXJpdGVkLCB3ZSBuZWVkIHRvIGRldGVjdCB0aGF0IHRoZSBvd25lci1jbGFzcyBvZiB0aGUgY29uc3RydWN0b3IgaXMgYWRkZWQgdG8gdGhlXG4gICAgICAvLyBjb25zdHJ1Y3RvciBjaGVja3MgdXBncmFkZSBkYXRhLiBlLmcuIGBjbGFzcyBDdXN0b21DYWxlbmRhciBleHRlbmRzIE1hdENhbGVuZGFyIHt9YC5cbiAgICAgIGNvbnN0IHNpZ25hdHVyZUNsYXNzTmFtZXMgPSBjbGFzc1R5cGVcbiAgICAgICAgLmdldENvbnN0cnVjdFNpZ25hdHVyZXMoKVxuICAgICAgICAubWFwKHNpZ25hdHVyZSA9PiBnZXRDbGFzc0RlY2xhcmF0aW9uT2ZTaWduYXR1cmUoc2lnbmF0dXJlKSlcbiAgICAgICAgLm1hcChkZWNsYXJhdGlvbiA9PiAoZGVjbGFyYXRpb24gJiYgZGVjbGFyYXRpb24ubmFtZSA/IGRlY2xhcmF0aW9uLm5hbWUudGV4dCA6IG51bGwpKVxuICAgICAgICAuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgICAvLyBCZXNpZGVzIGNoZWNraW5nIHRoZSBzaWduYXR1cmUgY2xhc3MgbmFtZXMsIHdlIG5lZWQgdG8gY2hlY2sgdGhlIGFjdHVhbCBjbGFzcyBuYW1lIGJlY2F1c2VcbiAgICAgIC8vIHRoZXJlIGNhbiBiZSBjbGFzc2VzIHdpdGhvdXQgYW4gZXhwbGljaXQgY29uc3RydWN0b3IuXG4gICAgICBpZiAoXG4gICAgICAgICF0aGlzLmRhdGEuaW5jbHVkZXMoY2xhc3NOYW1lKSAmJlxuICAgICAgICAhc2lnbmF0dXJlQ2xhc3NOYW1lcy5zb21lKG5hbWUgPT4gdGhpcy5kYXRhLmluY2x1ZGVzKG5hbWUhKSlcbiAgICAgICkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY2xhc3NTaWduYXR1cmVzID0gY2xhc3NUeXBlXG4gICAgICAgIC5nZXRDb25zdHJ1Y3RTaWduYXR1cmVzKClcbiAgICAgICAgLm1hcChzaWduYXR1cmUgPT4gZ2V0UGFyYW1ldGVyVHlwZXNGcm9tU2lnbmF0dXJlKHNpZ25hdHVyZSwgdGhpcy50eXBlQ2hlY2tlcikpO1xuXG4gICAgICBjb25zdCBleHByZXNzaW9uTmFtZSA9IGlzTmV3RXhwcmVzc2lvbiA/IGBuZXcgJHtjbGFzc05hbWV9YCA6ICdzdXBlcic7XG4gICAgICBjb25zdCBzaWduYXR1cmVzID0gY2xhc3NTaWduYXR1cmVzXG4gICAgICAgIC5tYXAoc2lnbmF0dXJlID0+XG4gICAgICAgICAgc2lnbmF0dXJlLm1hcCh0ID0+ICh0ID09PSBudWxsID8gJ2FueScgOiB0aGlzLnR5cGVDaGVja2VyLnR5cGVUb1N0cmluZyh0KSkpLFxuICAgICAgICApXG4gICAgICAgIC5tYXAoc2lnbmF0dXJlID0+IGAke2V4cHJlc3Npb25OYW1lfSgke3NpZ25hdHVyZS5qb2luKCcsICcpfSlgKVxuICAgICAgICAuam9pbignIG9yICcpO1xuXG4gICAgICB0aGlzLmNyZWF0ZUZhaWx1cmVBdE5vZGUoXG4gICAgICAgIG5vZGUsXG4gICAgICAgIGBGb3VuZCBcIiR7Y2xhc3NOYW1lfVwiIGNvbnN0cnVjdGVkIHdpdGggYCArXG4gICAgICAgICAgYGFuIGludmFsaWQgc2lnbmF0dXJlLiBQbGVhc2UgbWFudWFsbHkgdXBkYXRlIHRoZSAke2V4cHJlc3Npb25OYW1lfSBleHByZXNzaW9uIHRvIGAgK1xuICAgICAgICAgIGBtYXRjaCB0aGUgbmV3IHNpZ25hdHVyZSR7Y2xhc3NTaWduYXR1cmVzLmxlbmd0aCA+IDEgPyAncycgOiAnJ306ICR7c2lnbmF0dXJlc31gLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFJlc29sdmVzIHRoZSB0eXBlIGZvciBlYWNoIHBhcmFtZXRlciBpbiB0aGUgc3BlY2lmaWVkIHNpZ25hdHVyZS4gKi9cbmZ1bmN0aW9uIGdldFBhcmFtZXRlclR5cGVzRnJvbVNpZ25hdHVyZShcbiAgc2lnbmF0dXJlOiB0cy5TaWduYXR1cmUsXG4gIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcixcbik6ICh0cy5UeXBlIHwgbnVsbClbXSB7XG4gIHJldHVybiBzaWduYXR1cmVcbiAgICAuZ2V0UGFyYW1ldGVycygpXG4gICAgLm1hcChwYXJhbSA9PlxuICAgICAgcGFyYW0uZGVjbGFyYXRpb25zID8gdHlwZUNoZWNrZXIuZ2V0VHlwZUF0TG9jYXRpb24ocGFyYW0uZGVjbGFyYXRpb25zWzBdKSA6IG51bGwsXG4gICAgKTtcbn1cblxuLyoqXG4gKiBXYWxrcyB0aHJvdWdoIGVhY2ggbm9kZSBvZiBhIHNvdXJjZSBmaWxlIGluIG9yZGVyIHRvIGZpbmQgYSBuZXctZXhwcmVzc2lvbiBub2RlIG9yIHN1cGVyLWNhbGxcbiAqIGV4cHJlc3Npb24gbm9kZSB0aGF0IGlzIGNhcHR1cmVkIGJ5IHRoZSBzcGVjaWZpZWQgZGlhZ25vc3RpYy5cbiAqL1xuZnVuY3Rpb24gZmluZENvbnN0cnVjdG9yTm9kZShcbiAgZGlhZ25vc3RpYzogdHMuRGlhZ25vc3RpYyxcbiAgc291cmNlRmlsZTogdHMuU291cmNlRmlsZSxcbik6IHRzLkNhbGxFeHByZXNzaW9uIHwgdHMuTmV3RXhwcmVzc2lvbiB8IG51bGwge1xuICBsZXQgcmVzb2x2ZWROb2RlOiB0cy5Ob2RlIHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3QgX3Zpc2l0Tm9kZSA9IChub2RlOiB0cy5Ob2RlKSA9PiB7XG4gICAgLy8gQ2hlY2sgd2hldGhlciB0aGUgY3VycmVudCBub2RlIGNvbnRhaW5zIHRoZSBkaWFnbm9zdGljLiBJZiB0aGUgbm9kZSBjb250YWlucyB0aGUgZGlhZ25vc3RpYyxcbiAgICAvLyB3YWxrIGRlZXBlciBpbiBvcmRlciB0byBmaW5kIGFsbCBjb25zdHJ1Y3RvciBleHByZXNzaW9uIG5vZGVzLlxuICAgIGlmIChub2RlLmdldFN0YXJ0KCkgPD0gZGlhZ25vc3RpYy5zdGFydCEgJiYgbm9kZS5nZXRFbmQoKSA+PSBkaWFnbm9zdGljLnN0YXJ0ISkge1xuICAgICAgaWYgKFxuICAgICAgICB0cy5pc05ld0V4cHJlc3Npb24obm9kZSkgfHxcbiAgICAgICAgKHRzLmlzQ2FsbEV4cHJlc3Npb24obm9kZSkgJiYgbm9kZS5leHByZXNzaW9uLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuU3VwZXJLZXl3b3JkKVxuICAgICAgKSB7XG4gICAgICAgIHJlc29sdmVkTm9kZSA9IG5vZGU7XG4gICAgICB9XG5cbiAgICAgIHRzLmZvckVhY2hDaGlsZChub2RlLCBfdmlzaXROb2RlKTtcbiAgICB9XG4gIH07XG5cbiAgdHMuZm9yRWFjaENoaWxkKHNvdXJjZUZpbGUsIF92aXNpdE5vZGUpO1xuXG4gIHJldHVybiByZXNvbHZlZE5vZGU7XG59XG5cbi8qKiBEZXRlcm1pbmVzIHRoZSBjbGFzcyBkZWNsYXJhdGlvbiBvZiB0aGUgc3BlY2lmaWVkIGNvbnN0cnVjdCBzaWduYXR1cmUuICovXG5mdW5jdGlvbiBnZXRDbGFzc0RlY2xhcmF0aW9uT2ZTaWduYXR1cmUoc2lnbmF0dXJlOiB0cy5TaWduYXR1cmUpOiB0cy5DbGFzc0RlY2xhcmF0aW9uIHwgbnVsbCB7XG4gIGxldCBub2RlOiB0cy5Ob2RlID0gc2lnbmF0dXJlLmdldERlY2xhcmF0aW9uKCk7XG4gIC8vIEhhbmRsZSBzaWduYXR1cmVzIHdoaWNoIGRvbid0IGhhdmUgYW4gYWN0dWFsIGRlY2xhcmF0aW9uLiBUaGlzIGhhcHBlbnMgaWYgYSBjbGFzc1xuICAvLyBkb2VzIG5vdCBoYXZlIGFuIGV4cGxpY2l0bHkgd3JpdHRlbiBjb25zdHJ1Y3Rvci5cbiAgaWYgKCFub2RlKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgd2hpbGUgKCF0cy5pc1NvdXJjZUZpbGUoKG5vZGUgPSBub2RlLnBhcmVudCkpKSB7XG4gICAgaWYgKHRzLmlzQ2xhc3NEZWNsYXJhdGlvbihub2RlKSkge1xuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuIl19