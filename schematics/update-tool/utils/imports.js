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
        define("@angular/cdk/schematics/update-tool/utils/imports", ["require", "exports", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    /** Gets import information about the specified identifier by using the type checker. */
    function getImportOfIdentifier(typeChecker, node) {
        const symbol = typeChecker.getSymbolAtLocation(node);
        if (!symbol || !symbol.declarations || !symbol.declarations.length) {
            return null;
        }
        const decl = symbol.declarations[0];
        if (!ts.isImportSpecifier(decl)) {
            return null;
        }
        // Since "decl" is an import specifier, we can walk up three times to get a reference
        // to the import declaration node (NamedImports -> ImportClause -> ImportDeclaration).
        const importDecl = decl.parent.parent.parent;
        if (!ts.isStringLiteral(importDecl.moduleSpecifier)) {
            return null;
        }
        return {
            // Handles aliased imports: e.g. "import {Component as myComp} from ...";
            name: decl.propertyName ? decl.propertyName.text : decl.name.text,
            importModule: importDecl.moduleSpecifier.text,
            node: importDecl
        };
    }
    exports.getImportOfIdentifier = getImportOfIdentifier;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2NoZW1hdGljcy91cGRhdGUtdG9vbC91dGlscy9pbXBvcnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsaUNBQWlDO0lBUWpDLHdGQUF3RjtJQUN4RixTQUFnQixxQkFBcUIsQ0FBQyxXQUEyQixFQUFFLElBQW1CO1FBRXBGLE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVyRCxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFO1lBQ2xFLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXBDLElBQUksQ0FBQyxFQUFFLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDL0IsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELHFGQUFxRjtRQUNyRixzRkFBc0Y7UUFDdEYsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBRTdDLElBQUksQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsRUFBRTtZQUNuRCxPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsT0FBTztZQUNMLHlFQUF5RTtZQUN6RSxJQUFJLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSTtZQUNqRSxZQUFZLEVBQUUsVUFBVSxDQUFDLGVBQWUsQ0FBQyxJQUFJO1lBQzdDLElBQUksRUFBRSxVQUFVO1NBQ2pCLENBQUM7SUFDSixDQUFDO0lBNUJELHNEQTRCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuZXhwb3J0IHR5cGUgSW1wb3J0ID0ge1xuICBuYW1lOiBzdHJpbmcsXG4gIGltcG9ydE1vZHVsZTogc3RyaW5nLFxuICBub2RlOiB0cy5JbXBvcnREZWNsYXJhdGlvblxufTtcblxuLyoqIEdldHMgaW1wb3J0IGluZm9ybWF0aW9uIGFib3V0IHRoZSBzcGVjaWZpZWQgaWRlbnRpZmllciBieSB1c2luZyB0aGUgdHlwZSBjaGVja2VyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEltcG9ydE9mSWRlbnRpZmllcih0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsIG5vZGU6IHRzLklkZW50aWZpZXIpOiBJbXBvcnR8XG4gICAgbnVsbCB7XG4gIGNvbnN0IHN5bWJvbCA9IHR5cGVDaGVja2VyLmdldFN5bWJvbEF0TG9jYXRpb24obm9kZSk7XG5cbiAgaWYgKCFzeW1ib2wgfHwgIXN5bWJvbC5kZWNsYXJhdGlvbnMgfHwgIXN5bWJvbC5kZWNsYXJhdGlvbnMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBkZWNsID0gc3ltYm9sLmRlY2xhcmF0aW9uc1swXTtcblxuICBpZiAoIXRzLmlzSW1wb3J0U3BlY2lmaWVyKGRlY2wpKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvLyBTaW5jZSBcImRlY2xcIiBpcyBhbiBpbXBvcnQgc3BlY2lmaWVyLCB3ZSBjYW4gd2FsayB1cCB0aHJlZSB0aW1lcyB0byBnZXQgYSByZWZlcmVuY2VcbiAgLy8gdG8gdGhlIGltcG9ydCBkZWNsYXJhdGlvbiBub2RlIChOYW1lZEltcG9ydHMgLT4gSW1wb3J0Q2xhdXNlIC0+IEltcG9ydERlY2xhcmF0aW9uKS5cbiAgY29uc3QgaW1wb3J0RGVjbCA9IGRlY2wucGFyZW50LnBhcmVudC5wYXJlbnQ7XG5cbiAgaWYgKCF0cy5pc1N0cmluZ0xpdGVyYWwoaW1wb3J0RGVjbC5tb2R1bGVTcGVjaWZpZXIpKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIC8vIEhhbmRsZXMgYWxpYXNlZCBpbXBvcnRzOiBlLmcuIFwiaW1wb3J0IHtDb21wb25lbnQgYXMgbXlDb21wfSBmcm9tIC4uLlwiO1xuICAgIG5hbWU6IGRlY2wucHJvcGVydHlOYW1lID8gZGVjbC5wcm9wZXJ0eU5hbWUudGV4dCA6IGRlY2wubmFtZS50ZXh0LFxuICAgIGltcG9ydE1vZHVsZTogaW1wb3J0RGVjbC5tb2R1bGVTcGVjaWZpZXIudGV4dCxcbiAgICBub2RlOiBpbXBvcnREZWNsXG4gIH07XG59XG4iXX0=