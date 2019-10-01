/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/cdk/schematics/ng-update/upgrade-rules/constructor-signature-rule", ["require", "exports", "typescript", "@angular/cdk/schematics/update-tool/migration-rule", "@angular/cdk/schematics/update-tool/version-changes"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const migration_rule_1 = require("@angular/cdk/schematics/update-tool/migration-rule");
    const version_changes_1 = require("@angular/cdk/schematics/update-tool/version-changes");
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
     * Rule that visits every TypeScript new expression or super call and checks if
     * the parameter type signature is invalid and needs to be updated manually.
     */
    class ConstructorSignatureRule extends migration_rule_1.MigrationRule {
        constructor() {
            super(...arguments);
            // Note that the data for this rule is not distinguished based on the target version because
            // we don't keep track of the new signature and don't want to update incrementally.
            // See: https://github.com/angular/components/pull/12970#issuecomment-418337566
            this.data = version_changes_1.getAllChanges(this.upgradeData.constructorChecks);
            // Only enable the migration rule if there is upgrade data.
            this.ruleEnabled = this.data.length !== 0;
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
                const signatures = classSignatures.map(signature => signature.map(t => this.typeChecker.typeToString(t)))
                    .map(signature => `${expressionName}(${signature.join(', ')})`)
                    .join(' or ');
                this.createFailureAtNode(node, `Found "${className}" constructed with ` +
                    `an invalid signature. Please manually update the ${expressionName} expression to ` +
                    `match the new signature${classSignatures.length > 1 ? 's' : ''}: ${signatures}`);
            }
        }
    }
    exports.ConstructorSignatureRule = ConstructorSignatureRule;
    /** Resolves the type for each parameter in the specified signature. */
    function getParameterTypesFromSignature(signature, typeChecker) {
        return signature.getParameters().map(param => typeChecker.getTypeAtLocation(param.declarations[0]));
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
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RydWN0b3Itc2lnbmF0dXJlLXJ1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctdXBkYXRlL3VwZ3JhZGUtcnVsZXMvY29uc3RydWN0b3Itc2lnbmF0dXJlLXJ1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCxpQ0FBaUM7SUFDakMsdUZBQStEO0lBQy9ELHlGQUFnRTtJQUdoRTs7Ozs7T0FLRztJQUNILE1BQU0seUJBQXlCLEdBQUc7UUFDaEMsd0NBQXdDO1FBQ3hDLElBQUk7UUFDSixrREFBa0Q7UUFDbEQsSUFBSTtRQUNKLElBQUk7UUFDSixJQUFJO1FBQ0osSUFBSTtLQUNMLENBQUM7SUFFRjs7O09BR0c7SUFDSCxNQUFhLHdCQUF5QixTQUFRLDhCQUE4QjtRQUE1RTs7WUFDRSw0RkFBNEY7WUFDNUYsbUZBQW1GO1lBQ25GLCtFQUErRTtZQUMvRSxTQUFJLEdBQUcsK0JBQWEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFFekQsMkRBQTJEO1lBQzNELGdCQUFXLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDO1FBb0V2QyxDQUFDO1FBbEVDLFNBQVMsQ0FBQyxJQUFhO1lBQ3JCLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDekIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO2FBQzdCO1FBQ0gsQ0FBQztRQUVEOzs7Ozs7OztXQVFHO1FBQ0ssZ0JBQWdCLENBQUMsVUFBeUI7WUFDaEQsa0VBQWtFO1lBQ2xFLE1BQU0sV0FBVyxHQUNiLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQztpQkFDN0MsTUFBTSxDQUFDLFVBQVUsQ0FB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QUMsWUFBWSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDM0MsSUFBSSxFQUFFLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQy9CLE9BQU8sSUFBSSxDQUFDO2FBQ2I7U0FDRjtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7TWlncmF0aW9uUnVsZX0gZnJvbSAnLi4vLi4vdXBkYXRlLXRvb2wvbWlncmF0aW9uLXJ1bGUnO1xuaW1wb3J0IHtnZXRBbGxDaGFuZ2VzfSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC92ZXJzaW9uLWNoYW5nZXMnO1xuaW1wb3J0IHtSdWxlVXBncmFkZURhdGF9IGZyb20gJy4uL3VwZ3JhZGUtZGF0YSc7XG5cbi8qKlxuICogTGlzdCBvZiBkaWFnbm9zdGljIGNvZGVzIHRoYXQgcmVmZXIgdG8gcHJlLWVtaXQgZGlhZ25vc3RpY3Mgd2hpY2ggaW5kaWNhdGUgaW52YWxpZFxuICogbmV3IGV4cHJlc3Npb24gb3Igc3VwZXIgY2FsbCBzaWduYXR1cmVzLiBTZWUgdGhlIGxpc3Qgb2YgZGlhZ25vc3RpY3MgaGVyZTpcbiAqXG4gKiBodHRwczovL2dpdGh1Yi5jb20vTWljcm9zb2Z0L1R5cGVTY3JpcHQvYmxvYi9tYXN0ZXIvc3JjL2NvbXBpbGVyL2RpYWdub3N0aWNNZXNzYWdlcy5qc29uXG4gKi9cbmNvbnN0IHNpZ25hdHVyZUVycm9yRGlhZ25vc3RpY3MgPSBbXG4gIC8vIFR5cGUgbm90IGFzc2lnbmFibGUgZXJyb3IgZGlhZ25vc3RpYy5cbiAgMjM0NSxcbiAgLy8gQ29uc3RydWN0b3IgYXJndW1lbnQgbGVuZ3RoIGludmFsaWQgZGlhZ25vc3RpY3NcbiAgMjU1NCxcbiAgMjU1NSxcbiAgMjU1NixcbiAgMjU1Nyxcbl07XG5cbi8qKlxuICogUnVsZSB0aGF0IHZpc2l0cyBldmVyeSBUeXBlU2NyaXB0IG5ldyBleHByZXNzaW9uIG9yIHN1cGVyIGNhbGwgYW5kIGNoZWNrcyBpZlxuICogdGhlIHBhcmFtZXRlciB0eXBlIHNpZ25hdHVyZSBpcyBpbnZhbGlkIGFuZCBuZWVkcyB0byBiZSB1cGRhdGVkIG1hbnVhbGx5LlxuICovXG5leHBvcnQgY2xhc3MgQ29uc3RydWN0b3JTaWduYXR1cmVSdWxlIGV4dGVuZHMgTWlncmF0aW9uUnVsZTxSdWxlVXBncmFkZURhdGE+IHtcbiAgLy8gTm90ZSB0aGF0IHRoZSBkYXRhIGZvciB0aGlzIHJ1bGUgaXMgbm90IGRpc3Rpbmd1aXNoZWQgYmFzZWQgb24gdGhlIHRhcmdldCB2ZXJzaW9uIGJlY2F1c2VcbiAgLy8gd2UgZG9uJ3Qga2VlcCB0cmFjayBvZiB0aGUgbmV3IHNpZ25hdHVyZSBhbmQgZG9uJ3Qgd2FudCB0byB1cGRhdGUgaW5jcmVtZW50YWxseS5cbiAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9jb21wb25lbnRzL3B1bGwvMTI5NzAjaXNzdWVjb21tZW50LTQxODMzNzU2NlxuICBkYXRhID0gZ2V0QWxsQ2hhbmdlcyh0aGlzLnVwZ3JhZGVEYXRhLmNvbnN0cnVjdG9yQ2hlY2tzKTtcblxuICAvLyBPbmx5IGVuYWJsZSB0aGUgbWlncmF0aW9uIHJ1bGUgaWYgdGhlcmUgaXMgdXBncmFkZSBkYXRhLlxuICBydWxlRW5hYmxlZCA9IHRoaXMuZGF0YS5sZW5ndGggIT09IDA7XG5cbiAgdmlzaXROb2RlKG5vZGU6IHRzLk5vZGUpOiB2b2lkIHtcbiAgICBpZiAodHMuaXNTb3VyY2VGaWxlKG5vZGUpKSB7XG4gICAgICB0aGlzLl92aXNpdFNvdXJjZUZpbGUobm9kZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE1ldGhvZCB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoIHNvdXJjZSBmaWxlIG9mIHRoZSB1cGdyYWRlIHByb2plY3QuIEluIG9yZGVyIHRvXG4gICAqIHByb3Blcmx5IGRldGVybWluZSBpbnZhbGlkIGNvbnN0cnVjdG9yIHNpZ25hdHVyZXMsIHdlIHRha2UgYWR2YW50YWdlIG9mIHRoZSBwcmUtZW1pdFxuICAgKiBkaWFnbm9zdGljcyBmcm9tIFR5cGVTY3JpcHQuXG4gICAqXG4gICAqIEJ5IHVzaW5nIHRoZSBkaWFnbm9zdGljcywgdGhlIG1pZ3JhdGlvbiBjYW4gaGFuZGxlIHR5cGUgYXNzaWduYWJpbGl0eS4gTm90IHVzaW5nXG4gICAqIGRpYWdub3N0aWNzIHdvdWxkIG1lYW4gdGhhdCB3ZSBuZWVkIHRvIHVzZSBzaW1wbGUgdHlwZSBlcXVhbGl0eSBjaGVja2luZyB3aGljaCBpc1xuICAgKiB0b28gc3RyaWN0LiBTZWUgcmVsYXRlZCBpc3N1ZTogaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy85ODc5XG4gICAqL1xuICBwcml2YXRlIF92aXNpdFNvdXJjZUZpbGUoc291cmNlRmlsZTogdHMuU291cmNlRmlsZSkge1xuICAgIC8vIExpc3Qgb2YgY2xhc3NlcyBvZiB3aGljaCB0aGUgY29uc3RydWN0b3Igc2lnbmF0dXJlIGhhcyBjaGFuZ2VkLlxuICAgIGNvbnN0IGRpYWdub3N0aWNzID1cbiAgICAgICAgdHMuZ2V0UHJlRW1pdERpYWdub3N0aWNzKHRoaXMucHJvZ3JhbSwgc291cmNlRmlsZSlcbiAgICAgICAgICAgIC5maWx0ZXIoZGlhZ25vc3RpYyA9PiBzaWduYXR1cmVFcnJvckRpYWdub3N0aWNzLmluY2x1ZGVzKGRpYWdub3N0aWMuY29kZSkpXG4gICAgICAgICAgICAuZmlsdGVyKGRpYWdub3N0aWMgPT4gZGlhZ25vc3RpYy5zdGFydCAhPT0gdW5kZWZpbmVkKTtcblxuICAgIGZvciAoY29uc3QgZGlhZ25vc3RpYyBvZiBkaWFnbm9zdGljcykge1xuICAgICAgY29uc3Qgbm9kZSA9IGZpbmRDb25zdHJ1Y3Rvck5vZGUoZGlhZ25vc3RpYywgc291cmNlRmlsZSk7XG5cbiAgICAgIGlmICghbm9kZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY2xhc3NUeXBlID0gdGhpcy50eXBlQ2hlY2tlci5nZXRUeXBlQXRMb2NhdGlvbihub2RlLmV4cHJlc3Npb24pO1xuICAgICAgY29uc3QgY2xhc3NOYW1lID0gY2xhc3NUeXBlLnN5bWJvbCAmJiBjbGFzc1R5cGUuc3ltYm9sLm5hbWU7XG4gICAgICBjb25zdCBpc05ld0V4cHJlc3Npb24gPSB0cy5pc05ld0V4cHJlc3Npb24obm9kZSk7XG5cbiAgICAgIC8vIERldGVybWluZSB0aGUgY2xhc3MgbmFtZXMgb2YgdGhlIGFjdHVhbCBjb25zdHJ1Y3Qgc2lnbmF0dXJlcyBiZWNhdXNlIHdlIGNhbm5vdCBhc3N1bWUgdGhhdFxuICAgICAgLy8gdGhlIGRpYWdub3N0aWMgcmVmZXJzIHRvIGEgY29uc3RydWN0b3Igb2YgdGhlIGFjdHVhbCBleHByZXNzaW9uLiBJbiBjYXNlIHRoZSBjb25zdHJ1Y3RvclxuICAgICAgLy8gaXMgaW5oZXJpdGVkLCB3ZSBuZWVkIHRvIGRldGVjdCB0aGF0IHRoZSBvd25lci1jbGFzcyBvZiB0aGUgY29uc3RydWN0b3IgaXMgYWRkZWQgdG8gdGhlXG4gICAgICAvLyBjb25zdHJ1Y3RvciBjaGVja3MgdXBncmFkZSBkYXRhLiBlLmcuIGBjbGFzcyBDdXN0b21DYWxlbmRhciBleHRlbmRzIE1hdENhbGVuZGFyIHt9YC5cbiAgICAgIGNvbnN0IHNpZ25hdHVyZUNsYXNzTmFtZXMgPVxuICAgICAgICAgIGNsYXNzVHlwZS5nZXRDb25zdHJ1Y3RTaWduYXR1cmVzKClcbiAgICAgICAgICAgICAgLm1hcChzaWduYXR1cmUgPT4gZ2V0Q2xhc3NEZWNsYXJhdGlvbk9mU2lnbmF0dXJlKHNpZ25hdHVyZSkpXG4gICAgICAgICAgICAgIC5tYXAoZGVjbGFyYXRpb24gPT4gZGVjbGFyYXRpb24gJiYgZGVjbGFyYXRpb24ubmFtZSA/IGRlY2xhcmF0aW9uLm5hbWUudGV4dCA6IG51bGwpXG4gICAgICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgIC8vIEJlc2lkZXMgY2hlY2tpbmcgdGhlIHNpZ25hdHVyZSBjbGFzcyBuYW1lcywgd2UgbmVlZCB0byBjaGVjayB0aGUgYWN0dWFsIGNsYXNzIG5hbWUgYmVjYXVzZVxuICAgICAgLy8gdGhlcmUgY2FuIGJlIGNsYXNzZXMgd2l0aG91dCBhbiBleHBsaWNpdCBjb25zdHJ1Y3Rvci5cbiAgICAgIGlmICghdGhpcy5kYXRhLmluY2x1ZGVzKGNsYXNzTmFtZSkgJiZcbiAgICAgICAgICAhc2lnbmF0dXJlQ2xhc3NOYW1lcy5zb21lKG5hbWUgPT4gdGhpcy5kYXRhLmluY2x1ZGVzKG5hbWUhKSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNsYXNzU2lnbmF0dXJlcyA9IGNsYXNzVHlwZS5nZXRDb25zdHJ1Y3RTaWduYXR1cmVzKCkubWFwKFxuICAgICAgICAgIHNpZ25hdHVyZSA9PiBnZXRQYXJhbWV0ZXJUeXBlc0Zyb21TaWduYXR1cmUoc2lnbmF0dXJlLCB0aGlzLnR5cGVDaGVja2VyKSk7XG5cbiAgICAgIGNvbnN0IGV4cHJlc3Npb25OYW1lID0gaXNOZXdFeHByZXNzaW9uID8gYG5ldyAke2NsYXNzTmFtZX1gIDogJ3N1cGVyJztcbiAgICAgIGNvbnN0IHNpZ25hdHVyZXMgPVxuICAgICAgICAgIGNsYXNzU2lnbmF0dXJlcy5tYXAoc2lnbmF0dXJlID0+IHNpZ25hdHVyZS5tYXAodCA9PiB0aGlzLnR5cGVDaGVja2VyLnR5cGVUb1N0cmluZyh0KSkpXG4gICAgICAgICAgICAgIC5tYXAoc2lnbmF0dXJlID0+IGAke2V4cHJlc3Npb25OYW1lfSgke3NpZ25hdHVyZS5qb2luKCcsICcpfSlgKVxuICAgICAgICAgICAgICAuam9pbignIG9yICcpO1xuXG4gICAgICB0aGlzLmNyZWF0ZUZhaWx1cmVBdE5vZGUoXG4gICAgICAgICAgbm9kZSxcbiAgICAgICAgICBgRm91bmQgXCIke2NsYXNzTmFtZX1cIiBjb25zdHJ1Y3RlZCB3aXRoIGAgK1xuICAgICAgICAgICAgICBgYW4gaW52YWxpZCBzaWduYXR1cmUuIFBsZWFzZSBtYW51YWxseSB1cGRhdGUgdGhlICR7ZXhwcmVzc2lvbk5hbWV9IGV4cHJlc3Npb24gdG8gYCArXG4gICAgICAgICAgICAgIGBtYXRjaCB0aGUgbmV3IHNpZ25hdHVyZSR7Y2xhc3NTaWduYXR1cmVzLmxlbmd0aCA+IDEgPyAncycgOiAnJ306ICR7c2lnbmF0dXJlc31gKTtcbiAgICB9XG4gIH1cbn1cblxuXG4vKiogUmVzb2x2ZXMgdGhlIHR5cGUgZm9yIGVhY2ggcGFyYW1ldGVyIGluIHRoZSBzcGVjaWZpZWQgc2lnbmF0dXJlLiAqL1xuZnVuY3Rpb24gZ2V0UGFyYW1ldGVyVHlwZXNGcm9tU2lnbmF0dXJlKFxuICAgIHNpZ25hdHVyZTogdHMuU2lnbmF0dXJlLCB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIpOiB0cy5UeXBlW10ge1xuICByZXR1cm4gc2lnbmF0dXJlLmdldFBhcmFtZXRlcnMoKS5tYXAoXG4gICAgICBwYXJhbSA9PiB0eXBlQ2hlY2tlci5nZXRUeXBlQXRMb2NhdGlvbihwYXJhbS5kZWNsYXJhdGlvbnNbMF0pKTtcbn1cblxuLyoqXG4gKiBXYWxrcyB0aHJvdWdoIGVhY2ggbm9kZSBvZiBhIHNvdXJjZSBmaWxlIGluIG9yZGVyIHRvIGZpbmQgYSBuZXctZXhwcmVzc2lvbiBub2RlIG9yIHN1cGVyLWNhbGxcbiAqIGV4cHJlc3Npb24gbm9kZSB0aGF0IGlzIGNhcHR1cmVkIGJ5IHRoZSBzcGVjaWZpZWQgZGlhZ25vc3RpYy5cbiAqL1xuZnVuY3Rpb24gZmluZENvbnN0cnVjdG9yTm9kZShcbiAgICBkaWFnbm9zdGljOiB0cy5EaWFnbm9zdGljLCBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogdHMuQ2FsbEV4cHJlc3Npb258dHMuTmV3RXhwcmVzc2lvbnxudWxsIHtcbiAgbGV0IHJlc29sdmVkTm9kZTogdHMuTm9kZXxudWxsID0gbnVsbDtcblxuICBjb25zdCBfdmlzaXROb2RlID0gKG5vZGU6IHRzLk5vZGUpID0+IHtcbiAgICAvLyBDaGVjayB3aGV0aGVyIHRoZSBjdXJyZW50IG5vZGUgY29udGFpbnMgdGhlIGRpYWdub3N0aWMuIElmIHRoZSBub2RlIGNvbnRhaW5zIHRoZSBkaWFnbm9zdGljLFxuICAgIC8vIHdhbGsgZGVlcGVyIGluIG9yZGVyIHRvIGZpbmQgYWxsIGNvbnN0cnVjdG9yIGV4cHJlc3Npb24gbm9kZXMuXG4gICAgaWYgKG5vZGUuZ2V0U3RhcnQoKSA8PSBkaWFnbm9zdGljLnN0YXJ0ISAmJiBub2RlLmdldEVuZCgpID49IGRpYWdub3N0aWMuc3RhcnQhKSB7XG4gICAgICBpZiAodHMuaXNOZXdFeHByZXNzaW9uKG5vZGUpIHx8XG4gICAgICAgICAgKHRzLmlzQ2FsbEV4cHJlc3Npb24obm9kZSkgJiYgbm9kZS5leHByZXNzaW9uLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuU3VwZXJLZXl3b3JkKSkge1xuICAgICAgICByZXNvbHZlZE5vZGUgPSBub2RlO1xuICAgICAgfVxuXG4gICAgICB0cy5mb3JFYWNoQ2hpbGQobm9kZSwgX3Zpc2l0Tm9kZSk7XG4gICAgfVxuICB9O1xuXG4gIHRzLmZvckVhY2hDaGlsZChzb3VyY2VGaWxlLCBfdmlzaXROb2RlKTtcblxuICByZXR1cm4gcmVzb2x2ZWROb2RlO1xufVxuXG4vKiogRGV0ZXJtaW5lcyB0aGUgY2xhc3MgZGVjbGFyYXRpb24gb2YgdGhlIHNwZWNpZmllZCBjb25zdHJ1Y3Qgc2lnbmF0dXJlLiAqL1xuZnVuY3Rpb24gZ2V0Q2xhc3NEZWNsYXJhdGlvbk9mU2lnbmF0dXJlKHNpZ25hdHVyZTogdHMuU2lnbmF0dXJlKTogdHMuQ2xhc3NEZWNsYXJhdGlvbnxudWxsIHtcbiAgbGV0IG5vZGU6IHRzLk5vZGUgPSBzaWduYXR1cmUuZ2V0RGVjbGFyYXRpb24oKTtcbiAgLy8gSGFuZGxlIHNpZ25hdHVyZXMgd2hpY2ggZG9uJ3QgaGF2ZSBhbiBhY3R1YWwgZGVjbGFyYXRpb24uIFRoaXMgaGFwcGVucyBpZiBhIGNsYXNzXG4gIC8vIGRvZXMgbm90IGhhdmUgYW4gZXhwbGljaXRseSB3cml0dGVuIGNvbnN0cnVjdG9yLlxuICBpZiAoIW5vZGUpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICB3aGlsZSAoIXRzLmlzU291cmNlRmlsZShub2RlID0gbm9kZS5wYXJlbnQpKSB7XG4gICAgaWYgKHRzLmlzQ2xhc3NEZWNsYXJhdGlvbihub2RlKSkge1xuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuIl19