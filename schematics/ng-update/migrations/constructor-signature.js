"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
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
    2554,
    2555,
    2556,
    2557,
];
/**
 * Migration that visits every TypeScript new expression or super call and checks if
 * the parameter type signature is invalid and needs to be updated manually.
 */
class ConstructorSignatureMigration extends migration_1.Migration {
    constructor() {
        super(...arguments);
        // Note that the data for this rule is not distinguished based on the target version because
        // we don't keep track of the new signature and don't want to update incrementally.
        // See: https://github.com/angular/components/pull/12970#issuecomment-418337566
        this.data = (0, version_changes_1.getAllChanges)(this.upgradeData.constructorChecks);
        // Only enable the migration rule if there is upgrade data.
        this.enabled = this.data.length !== 0;
    }
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
        const diagnostics = ts.getPreEmitDiagnostics(this.program, sourceFile)
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
            const signatureClassNames = classType.getConstructSignatures()
                .map(signature => getClassDeclarationOfSignature(signature))
                .map(declaration => declaration && declaration.name ? declaration.name.text : null)
                .filter(Boolean);
            // Besides checking the signature class names, we need to check the actual class name because
            // there can be classes without an explicit constructor.
            if (!this.data.includes(className) &&
                !signatureClassNames.some(name => this.data.includes(name))) {
                continue;
            }
            const classSignatures = classType.getConstructSignatures().map(signature => getParameterTypesFromSignature(signature, this.typeChecker));
            const expressionName = isNewExpression ? `new ${className}` : 'super';
            const signatures = classSignatures
                .map(signature => signature.map(t => t === null ? 'any' : this.typeChecker.typeToString(t)))
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
    return signature.getParameters().map(param => param.declarations ? typeChecker.getTypeAtLocation(param.declarations[0]) : null);
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
    while (!ts.isSourceFile(node = node.parent)) {
        if (ts.isClassDeclaration(node)) {
            return node;
        }
    }
    return null;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RydWN0b3Itc2lnbmF0dXJlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL25nLXVwZGF0ZS9taWdyYXRpb25zL2NvbnN0cnVjdG9yLXNpZ25hdHVyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCxpQ0FBaUM7QUFDakMsMkRBQXNEO0FBQ3RELHVFQUFnRTtBQUdoRTs7Ozs7R0FLRztBQUNILE1BQU0seUJBQXlCLEdBQUc7SUFDaEMsd0NBQXdDO0lBQ3hDLElBQUk7SUFDSixrREFBa0Q7SUFDbEQsSUFBSTtJQUNKLElBQUk7SUFDSixJQUFJO0lBQ0osSUFBSTtDQUNMLENBQUM7QUFFRjs7O0dBR0c7QUFDSCxNQUFhLDZCQUE4QixTQUFRLHFCQUFzQjtJQUF6RTs7UUFDRSw0RkFBNEY7UUFDNUYsbUZBQW1GO1FBQ25GLCtFQUErRTtRQUMvRSxTQUFJLEdBQUcsSUFBQSwrQkFBYSxFQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUV6RCwyREFBMkQ7UUFDM0QsWUFBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQztJQXFFbkMsQ0FBQztJQW5FVSxTQUFTLENBQUMsSUFBYTtRQUM5QixJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDekIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzdCO0lBQ0gsQ0FBQztJQUVEOzs7Ozs7OztPQVFHO0lBQ0ssZ0JBQWdCLENBQUMsVUFBeUI7UUFDaEQsa0VBQWtFO1FBQ2xFLE1BQU0sV0FBVyxHQUNiLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQzthQUM3QyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyx5QkFBeUIs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QUMsSUFBSSxFQUFFO1FBQ1QsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUNELE9BQU8sQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7UUFDM0MsSUFBSSxFQUFFLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDL0IsT0FBTyxJQUFJLENBQUM7U0FDYjtLQUNGO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtNaWdyYXRpb259IGZyb20gJy4uLy4uL3VwZGF0ZS10b29sL21pZ3JhdGlvbic7XG5pbXBvcnQge2dldEFsbENoYW5nZXN9IGZyb20gJy4uLy4uL3VwZGF0ZS10b29sL3ZlcnNpb24tY2hhbmdlcyc7XG5pbXBvcnQge1VwZ3JhZGVEYXRhfSBmcm9tICcuLi91cGdyYWRlLWRhdGEnO1xuXG4vKipcbiAqIExpc3Qgb2YgZGlhZ25vc3RpYyBjb2RlcyB0aGF0IHJlZmVyIHRvIHByZS1lbWl0IGRpYWdub3N0aWNzIHdoaWNoIGluZGljYXRlIGludmFsaWRcbiAqIG5ldyBleHByZXNzaW9uIG9yIHN1cGVyIGNhbGwgc2lnbmF0dXJlcy4gU2VlIHRoZSBsaXN0IG9mIGRpYWdub3N0aWNzIGhlcmU6XG4gKlxuICogaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L2Jsb2IvbWFzdGVyL3NyYy9jb21waWxlci9kaWFnbm9zdGljTWVzc2FnZXMuanNvblxuICovXG5jb25zdCBzaWduYXR1cmVFcnJvckRpYWdub3N0aWNzID0gW1xuICAvLyBUeXBlIG5vdCBhc3NpZ25hYmxlIGVycm9yIGRpYWdub3N0aWMuXG4gIDIzNDUsXG4gIC8vIENvbnN0cnVjdG9yIGFyZ3VtZW50IGxlbmd0aCBpbnZhbGlkIGRpYWdub3N0aWNzXG4gIDI1NTQsXG4gIDI1NTUsXG4gIDI1NTYsXG4gIDI1NTcsXG5dO1xuXG4vKipcbiAqIE1pZ3JhdGlvbiB0aGF0IHZpc2l0cyBldmVyeSBUeXBlU2NyaXB0IG5ldyBleHByZXNzaW9uIG9yIHN1cGVyIGNhbGwgYW5kIGNoZWNrcyBpZlxuICogdGhlIHBhcmFtZXRlciB0eXBlIHNpZ25hdHVyZSBpcyBpbnZhbGlkIGFuZCBuZWVkcyB0byBiZSB1cGRhdGVkIG1hbnVhbGx5LlxuICovXG5leHBvcnQgY2xhc3MgQ29uc3RydWN0b3JTaWduYXR1cmVNaWdyYXRpb24gZXh0ZW5kcyBNaWdyYXRpb248VXBncmFkZURhdGE+IHtcbiAgLy8gTm90ZSB0aGF0IHRoZSBkYXRhIGZvciB0aGlzIHJ1bGUgaXMgbm90IGRpc3Rpbmd1aXNoZWQgYmFzZWQgb24gdGhlIHRhcmdldCB2ZXJzaW9uIGJlY2F1c2VcbiAgLy8gd2UgZG9uJ3Qga2VlcCB0cmFjayBvZiB0aGUgbmV3IHNpZ25hdHVyZSBhbmQgZG9uJ3Qgd2FudCB0byB1cGRhdGUgaW5jcmVtZW50YWxseS5cbiAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9jb21wb25lbnRzL3B1bGwvMTI5NzAjaXNzdWVjb21tZW50LTQxODMzNzU2NlxuICBkYXRhID0gZ2V0QWxsQ2hhbmdlcyh0aGlzLnVwZ3JhZGVEYXRhLmNvbnN0cnVjdG9yQ2hlY2tzKTtcblxuICAvLyBPbmx5IGVuYWJsZSB0aGUgbWlncmF0aW9uIHJ1bGUgaWYgdGhlcmUgaXMgdXBncmFkZSBkYXRhLlxuICBlbmFibGVkID0gdGhpcy5kYXRhLmxlbmd0aCAhPT0gMDtcblxuICBvdmVycmlkZSB2aXNpdE5vZGUobm9kZTogdHMuTm9kZSk6IHZvaWQge1xuICAgIGlmICh0cy5pc1NvdXJjZUZpbGUobm9kZSkpIHtcbiAgICAgIHRoaXMuX3Zpc2l0U291cmNlRmlsZShub2RlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTWV0aG9kIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggc291cmNlIGZpbGUgb2YgdGhlIHVwZ3JhZGUgcHJvamVjdC4gSW4gb3JkZXIgdG9cbiAgICogcHJvcGVybHkgZGV0ZXJtaW5lIGludmFsaWQgY29uc3RydWN0b3Igc2lnbmF0dXJlcywgd2UgdGFrZSBhZHZhbnRhZ2Ugb2YgdGhlIHByZS1lbWl0XG4gICAqIGRpYWdub3N0aWNzIGZyb20gVHlwZVNjcmlwdC5cbiAgICpcbiAgICogQnkgdXNpbmcgdGhlIGRpYWdub3N0aWNzLCB0aGUgbWlncmF0aW9uIGNhbiBoYW5kbGUgdHlwZSBhc3NpZ25hYmlsaXR5LiBOb3QgdXNpbmdcbiAgICogZGlhZ25vc3RpY3Mgd291bGQgbWVhbiB0aGF0IHdlIG5lZWQgdG8gdXNlIHNpbXBsZSB0eXBlIGVxdWFsaXR5IGNoZWNraW5nIHdoaWNoIGlzXG4gICAqIHRvbyBzdHJpY3QuIFNlZSByZWxhdGVkIGlzc3VlOiBodHRwczovL2dpdGh1Yi5jb20vTWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzk4NzlcbiAgICovXG4gIHByaXZhdGUgX3Zpc2l0U291cmNlRmlsZShzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKSB7XG4gICAgLy8gTGlzdCBvZiBjbGFzc2VzIG9mIHdoaWNoIHRoZSBjb25zdHJ1Y3RvciBzaWduYXR1cmUgaGFzIGNoYW5nZWQuXG4gICAgY29uc3QgZGlhZ25vc3RpY3MgPVxuICAgICAgICB0cy5nZXRQcmVFbWl0RGlhZ25vc3RpY3ModGhpcy5wcm9ncmFtLCBzb3VyY2VGaWxlKVxuICAgICAgICAgICAgLmZpbHRlcihkaWFnbm9zdGljID0+IHNpZ25hdHVyZUVycm9yRGlhZ25vc3RpY3MuaW5jbHVkZXMoZGlhZ25vc3RpYy5jb2RlKSlcbiAgICAgICAgICAgIC5maWx0ZXIoZGlhZ25vc3RpYyA9PiBkaWFnbm9zdGljLnN0YXJ0ICE9PSB1bmRlZmluZWQpO1xuXG4gICAgZm9yIChjb25zdCBkaWFnbm9zdGljIG9mIGRpYWdub3N0aWNzKSB7XG4gICAgICBjb25zdCBub2RlID0gZmluZENvbnN0cnVjdG9yTm9kZShkaWFnbm9zdGljLCBzb3VyY2VGaWxlKTtcblxuICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjbGFzc1R5cGUgPSB0aGlzLnR5cGVDaGVja2VyLmdldFR5cGVBdExvY2F0aW9uKG5vZGUuZXhwcmVzc2lvbik7XG4gICAgICBjb25zdCBjbGFzc05hbWUgPSBjbGFzc1R5cGUuc3ltYm9sICYmIGNsYXNzVHlwZS5zeW1ib2wubmFtZTtcbiAgICAgIGNvbnN0IGlzTmV3RXhwcmVzc2lvbiA9IHRzLmlzTmV3RXhwcmVzc2lvbihub2RlKTtcblxuICAgICAgLy8gRGV0ZXJtaW5lIHRoZSBjbGFzcyBuYW1lcyBvZiB0aGUgYWN0dWFsIGNvbnN0cnVjdCBzaWduYXR1cmVzIGJlY2F1c2Ugd2UgY2Fubm90IGFzc3VtZSB0aGF0XG4gICAgICAvLyB0aGUgZGlhZ25vc3RpYyByZWZlcnMgdG8gYSBjb25zdHJ1Y3RvciBvZiB0aGUgYWN0dWFsIGV4cHJlc3Npb24uIEluIGNhc2UgdGhlIGNvbnN0cnVjdG9yXG4gICAgICAvLyBpcyBpbmhlcml0ZWQsIHdlIG5lZWQgdG8gZGV0ZWN0IHRoYXQgdGhlIG93bmVyLWNsYXNzIG9mIHRoZSBjb25zdHJ1Y3RvciBpcyBhZGRlZCB0byB0aGVcbiAgICAgIC8vIGNvbnN0cnVjdG9yIGNoZWNrcyB1cGdyYWRlIGRhdGEuIGUuZy4gYGNsYXNzIEN1c3RvbUNhbGVuZGFyIGV4dGVuZHMgTWF0Q2FsZW5kYXIge31gLlxuICAgICAgY29uc3Qgc2lnbmF0dXJlQ2xhc3NOYW1lcyA9XG4gICAgICAgICAgY2xhc3NUeXBlLmdldENvbnN0cnVjdFNpZ25hdHVyZXMoKVxuICAgICAgICAgICAgICAubWFwKHNpZ25hdHVyZSA9PiBnZXRDbGFzc0RlY2xhcmF0aW9uT2ZTaWduYXR1cmUoc2lnbmF0dXJlKSlcbiAgICAgICAgICAgICAgLm1hcChkZWNsYXJhdGlvbiA9PiBkZWNsYXJhdGlvbiAmJiBkZWNsYXJhdGlvbi5uYW1lID8gZGVjbGFyYXRpb24ubmFtZS50ZXh0IDogbnVsbClcbiAgICAgICAgICAgICAgLmZpbHRlcihCb29sZWFuKTtcblxuICAgICAgLy8gQmVzaWRlcyBjaGVja2luZyB0aGUgc2lnbmF0dXJlIGNsYXNzIG5hbWVzLCB3ZSBuZWVkIHRvIGNoZWNrIHRoZSBhY3R1YWwgY2xhc3MgbmFtZSBiZWNhdXNlXG4gICAgICAvLyB0aGVyZSBjYW4gYmUgY2xhc3NlcyB3aXRob3V0IGFuIGV4cGxpY2l0IGNvbnN0cnVjdG9yLlxuICAgICAgaWYgKCF0aGlzLmRhdGEuaW5jbHVkZXMoY2xhc3NOYW1lKSAmJlxuICAgICAgICAgICFzaWduYXR1cmVDbGFzc05hbWVzLnNvbWUobmFtZSA9PiB0aGlzLmRhdGEuaW5jbHVkZXMobmFtZSEpKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY2xhc3NTaWduYXR1cmVzID0gY2xhc3NUeXBlLmdldENvbnN0cnVjdFNpZ25hdHVyZXMoKS5tYXAoXG4gICAgICAgICAgc2lnbmF0dXJlID0+IGdldFBhcmFtZXRlclR5cGVzRnJvbVNpZ25hdHVyZShzaWduYXR1cmUsIHRoaXMudHlwZUNoZWNrZXIpKTtcblxuICAgICAgY29uc3QgZXhwcmVzc2lvbk5hbWUgPSBpc05ld0V4cHJlc3Npb24gPyBgbmV3ICR7Y2xhc3NOYW1lfWAgOiAnc3VwZXInO1xuICAgICAgY29uc3Qgc2lnbmF0dXJlcyA9IGNsYXNzU2lnbmF0dXJlc1xuICAgICAgICAgIC5tYXAoc2lnbmF0dXJlID0+XG4gICAgICAgICAgICAgIHNpZ25hdHVyZS5tYXAodCA9PiB0ID09PSBudWxsID8gJ2FueScgOiB0aGlzLnR5cGVDaGVja2VyLnR5cGVUb1N0cmluZyh0KSkpXG4gICAgICAgICAgLm1hcChzaWduYXR1cmUgPT4gYCR7ZXhwcmVzc2lvbk5hbWV9KCR7c2lnbmF0dXJlLmpvaW4oJywgJyl9KWApXG4gICAgICAgICAgLmpvaW4oJyBvciAnKTtcblxuICAgICAgdGhpcy5jcmVhdGVGYWlsdXJlQXROb2RlKFxuICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgYEZvdW5kIFwiJHtjbGFzc05hbWV9XCIgY29uc3RydWN0ZWQgd2l0aCBgICtcbiAgICAgICAgICAgICAgYGFuIGludmFsaWQgc2lnbmF0dXJlLiBQbGVhc2UgbWFudWFsbHkgdXBkYXRlIHRoZSAke2V4cHJlc3Npb25OYW1lfSBleHByZXNzaW9uIHRvIGAgK1xuICAgICAgICAgICAgICBgbWF0Y2ggdGhlIG5ldyBzaWduYXR1cmUke2NsYXNzU2lnbmF0dXJlcy5sZW5ndGggPiAxID8gJ3MnIDogJyd9OiAke3NpZ25hdHVyZXN9YCk7XG4gICAgfVxuICB9XG59XG5cblxuLyoqIFJlc29sdmVzIHRoZSB0eXBlIGZvciBlYWNoIHBhcmFtZXRlciBpbiB0aGUgc3BlY2lmaWVkIHNpZ25hdHVyZS4gKi9cbmZ1bmN0aW9uIGdldFBhcmFtZXRlclR5cGVzRnJvbVNpZ25hdHVyZShcbiAgICBzaWduYXR1cmU6IHRzLlNpZ25hdHVyZSwgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyKTogKHRzLlR5cGV8bnVsbClbXSB7XG4gIHJldHVybiBzaWduYXR1cmUuZ2V0UGFyYW1ldGVycygpLm1hcChcbiAgICAgIHBhcmFtID0+IHBhcmFtLmRlY2xhcmF0aW9ucyA/IHR5cGVDaGVja2VyLmdldFR5cGVBdExvY2F0aW9uKHBhcmFtLmRlY2xhcmF0aW9uc1swXSkgOiBudWxsKTtcbn1cblxuLyoqXG4gKiBXYWxrcyB0aHJvdWdoIGVhY2ggbm9kZSBvZiBhIHNvdXJjZSBmaWxlIGluIG9yZGVyIHRvIGZpbmQgYSBuZXctZXhwcmVzc2lvbiBub2RlIG9yIHN1cGVyLWNhbGxcbiAqIGV4cHJlc3Npb24gbm9kZSB0aGF0IGlzIGNhcHR1cmVkIGJ5IHRoZSBzcGVjaWZpZWQgZGlhZ25vc3RpYy5cbiAqL1xuZnVuY3Rpb24gZmluZENvbnN0cnVjdG9yTm9kZShcbiAgICBkaWFnbm9zdGljOiB0cy5EaWFnbm9zdGljLCBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogdHMuQ2FsbEV4cHJlc3Npb258dHMuTmV3RXhwcmVzc2lvbnxudWxsIHtcbiAgbGV0IHJlc29sdmVkTm9kZTogdHMuTm9kZXxudWxsID0gbnVsbDtcblxuICBjb25zdCBfdmlzaXROb2RlID0gKG5vZGU6IHRzLk5vZGUpID0+IHtcbiAgICAvLyBDaGVjayB3aGV0aGVyIHRoZSBjdXJyZW50IG5vZGUgY29udGFpbnMgdGhlIGRpYWdub3N0aWMuIElmIHRoZSBub2RlIGNvbnRhaW5zIHRoZSBkaWFnbm9zdGljLFxuICAgIC8vIHdhbGsgZGVlcGVyIGluIG9yZGVyIHRvIGZpbmQgYWxsIGNvbnN0cnVjdG9yIGV4cHJlc3Npb24gbm9kZXMuXG4gICAgaWYgKG5vZGUuZ2V0U3RhcnQoKSA8PSBkaWFnbm9zdGljLnN0YXJ0ISAmJiBub2RlLmdldEVuZCgpID49IGRpYWdub3N0aWMuc3RhcnQhKSB7XG4gICAgICBpZiAodHMuaXNOZXdFeHByZXNzaW9uKG5vZGUpIHx8XG4gICAgICAgICAgKHRzLmlzQ2FsbEV4cHJlc3Npb24obm9kZSkgJiYgbm9kZS5leHByZXNzaW9uLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuU3VwZXJLZXl3b3JkKSkge1xuICAgICAgICByZXNvbHZlZE5vZGUgPSBub2RlO1xuICAgICAgfVxuXG4gICAgICB0cy5mb3JFYWNoQ2hpbGQobm9kZSwgX3Zpc2l0Tm9kZSk7XG4gICAgfVxuICB9O1xuXG4gIHRzLmZvckVhY2hDaGlsZChzb3VyY2VGaWxlLCBfdmlzaXROb2RlKTtcblxuICByZXR1cm4gcmVzb2x2ZWROb2RlO1xufVxuXG4vKiogRGV0ZXJtaW5lcyB0aGUgY2xhc3MgZGVjbGFyYXRpb24gb2YgdGhlIHNwZWNpZmllZCBjb25zdHJ1Y3Qgc2lnbmF0dXJlLiAqL1xuZnVuY3Rpb24gZ2V0Q2xhc3NEZWNsYXJhdGlvbk9mU2lnbmF0dXJlKHNpZ25hdHVyZTogdHMuU2lnbmF0dXJlKTogdHMuQ2xhc3NEZWNsYXJhdGlvbnxudWxsIHtcbiAgbGV0IG5vZGU6IHRzLk5vZGUgPSBzaWduYXR1cmUuZ2V0RGVjbGFyYXRpb24oKTtcbiAgLy8gSGFuZGxlIHNpZ25hdHVyZXMgd2hpY2ggZG9uJ3QgaGF2ZSBhbiBhY3R1YWwgZGVjbGFyYXRpb24uIFRoaXMgaGFwcGVucyBpZiBhIGNsYXNzXG4gIC8vIGRvZXMgbm90IGhhdmUgYW4gZXhwbGljaXRseSB3cml0dGVuIGNvbnN0cnVjdG9yLlxuICBpZiAoIW5vZGUpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICB3aGlsZSAoIXRzLmlzU291cmNlRmlsZShub2RlID0gbm9kZS5wYXJlbnQpKSB7XG4gICAgaWYgKHRzLmlzQ2xhc3NEZWNsYXJhdGlvbihub2RlKSkge1xuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuIl19