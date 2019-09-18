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
        define("@angular/cdk/schematics/update-tool/utils/decorators", ["require", "exports", "typescript", "@angular/cdk/schematics/update-tool/utils/imports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const imports_1 = require("@angular/cdk/schematics/update-tool/utils/imports");
    /**
     * Gets all decorators which are imported from an Angular package
     * (e.g. "@angular/core") from a list of decorators.
     */
    function getAngularDecorators(typeChecker, decorators) {
        return decorators.map(node => ({ node, importData: getCallDecoratorImport(typeChecker, node) }))
            .filter(({ importData }) => importData && importData.importModule.startsWith('@angular/'))
            .map(({ node, importData }) => ({
            node: node,
            name: importData.name,
            importNode: importData.node
        }));
    }
    exports.getAngularDecorators = getAngularDecorators;
    function getCallDecoratorImport(typeChecker, decorator) {
        // Note that this does not cover the edge case where decorators are called from
        // a namespace import: e.g. "@core.Component()". This is not handled by Ngtsc either.
        if (!ts.isCallExpression(decorator.expression) ||
            !ts.isIdentifier(decorator.expression.expression)) {
            return null;
        }
        const identifier = decorator.expression.expression;
        return imports_1.getImportOfIdentifier(typeChecker, identifier);
    }
    exports.getCallDecoratorImport = getCallDecoratorImport;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdG9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2NoZW1hdGljcy91cGRhdGUtdG9vbC91dGlscy9kZWNvcmF0b3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsaUNBQWlDO0lBRWpDLCtFQUF3RDtJQVl4RDs7O09BR0c7SUFDSCxTQUFnQixvQkFBb0IsQ0FDaEMsV0FBMkIsRUFBRSxVQUF1QztRQUN0RSxPQUFPLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxzQkFBc0IsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLEVBQUMsQ0FBQyxDQUFDO2FBQ3pGLE1BQU0sQ0FBQyxDQUFDLEVBQUMsVUFBVSxFQUFDLEVBQUUsRUFBRSxDQUFDLFVBQVUsSUFBSSxVQUFVLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQzthQUN2RixHQUFHLENBQUMsQ0FBQyxFQUFDLElBQUksRUFBRSxVQUFVLEVBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN2QixJQUFJLEVBQUUsSUFBK0I7WUFDckMsSUFBSSxFQUFFLFVBQVcsQ0FBQyxJQUFJO1lBQ3RCLFVBQVUsRUFBRSxVQUFXLENBQUMsSUFBSTtTQUM3QixDQUFDLENBQUMsQ0FBQztJQUNmLENBQUM7SUFURCxvREFTQztJQUVELFNBQWdCLHNCQUFzQixDQUNsQyxXQUEyQixFQUFFLFNBQXVCO1FBQ3RELCtFQUErRTtRQUMvRSxxRkFBcUY7UUFDckYsSUFBSSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDO1lBQzFDLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQ3JELE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxNQUFNLFVBQVUsR0FBRyxTQUFTLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQztRQUNuRCxPQUFPLCtCQUFxQixDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBWEQsd0RBV0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Z2V0SW1wb3J0T2ZJZGVudGlmaWVyLCBJbXBvcnR9IGZyb20gJy4vaW1wb3J0cyc7XG5cbmV4cG9ydCB0eXBlIENhbGxFeHByZXNzaW9uRGVjb3JhdG9yID0gdHMuRGVjb3JhdG9yJntcbiAgZXhwcmVzc2lvbjogdHMuQ2FsbEV4cHJlc3Npb247XG59O1xuXG5leHBvcnQgaW50ZXJmYWNlIE5nRGVjb3JhdG9yIHtcbiAgbmFtZTogc3RyaW5nO1xuICBub2RlOiBDYWxsRXhwcmVzc2lvbkRlY29yYXRvcjtcbiAgaW1wb3J0Tm9kZTogdHMuSW1wb3J0RGVjbGFyYXRpb247XG59XG5cbi8qKlxuICogR2V0cyBhbGwgZGVjb3JhdG9ycyB3aGljaCBhcmUgaW1wb3J0ZWQgZnJvbSBhbiBBbmd1bGFyIHBhY2thZ2VcbiAqIChlLmcuIFwiQGFuZ3VsYXIvY29yZVwiKSBmcm9tIGEgbGlzdCBvZiBkZWNvcmF0b3JzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QW5ndWxhckRlY29yYXRvcnMoXG4gICAgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLCBkZWNvcmF0b3JzOiBSZWFkb25seUFycmF5PHRzLkRlY29yYXRvcj4pOiBOZ0RlY29yYXRvcltdIHtcbiAgcmV0dXJuIGRlY29yYXRvcnMubWFwKG5vZGUgPT4gKHtub2RlLCBpbXBvcnREYXRhOiBnZXRDYWxsRGVjb3JhdG9ySW1wb3J0KHR5cGVDaGVja2VyLCBub2RlKX0pKVxuICAgICAgLmZpbHRlcigoe2ltcG9ydERhdGF9KSA9PiBpbXBvcnREYXRhICYmIGltcG9ydERhdGEuaW1wb3J0TW9kdWxlLnN0YXJ0c1dpdGgoJ0Bhbmd1bGFyLycpKVxuICAgICAgLm1hcCgoe25vZGUsIGltcG9ydERhdGF9KSA9PiAoe1xuICAgICAgICAgICAgIG5vZGU6IG5vZGUgYXMgQ2FsbEV4cHJlc3Npb25EZWNvcmF0b3IsXG4gICAgICAgICAgICAgbmFtZTogaW1wb3J0RGF0YSEubmFtZSxcbiAgICAgICAgICAgICBpbXBvcnROb2RlOiBpbXBvcnREYXRhIS5ub2RlXG4gICAgICAgICAgIH0pKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENhbGxEZWNvcmF0b3JJbXBvcnQoXG4gICAgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLCBkZWNvcmF0b3I6IHRzLkRlY29yYXRvcik6IEltcG9ydHxudWxsIHtcbiAgLy8gTm90ZSB0aGF0IHRoaXMgZG9lcyBub3QgY292ZXIgdGhlIGVkZ2UgY2FzZSB3aGVyZSBkZWNvcmF0b3JzIGFyZSBjYWxsZWQgZnJvbVxuICAvLyBhIG5hbWVzcGFjZSBpbXBvcnQ6IGUuZy4gXCJAY29yZS5Db21wb25lbnQoKVwiLiBUaGlzIGlzIG5vdCBoYW5kbGVkIGJ5IE5ndHNjIGVpdGhlci5cbiAgaWYgKCF0cy5pc0NhbGxFeHByZXNzaW9uKGRlY29yYXRvci5leHByZXNzaW9uKSB8fFxuICAgICAgIXRzLmlzSWRlbnRpZmllcihkZWNvcmF0b3IuZXhwcmVzc2lvbi5leHByZXNzaW9uKSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgaWRlbnRpZmllciA9IGRlY29yYXRvci5leHByZXNzaW9uLmV4cHJlc3Npb247XG4gIHJldHVybiBnZXRJbXBvcnRPZklkZW50aWZpZXIodHlwZUNoZWNrZXIsIGlkZW50aWZpZXIpO1xufVxuIl19