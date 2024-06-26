"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAngularDecorators = getAngularDecorators;
exports.getCallDecoratorImport = getCallDecoratorImport;
const ts = require("typescript");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdG9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2NoZW1hdGljcy91cGRhdGUtdG9vbC91dGlscy9kZWNvcmF0b3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBbUJILG9EQVdDO0FBRUQsd0RBZUM7QUE3Q0QsaUNBQWlDO0FBRWpDLHVDQUF3RDtBQVd4RDs7O0dBR0c7QUFDSCxTQUFnQixvQkFBb0IsQ0FDbEMsV0FBMkIsRUFDM0IsVUFBbUM7SUFFbkMsT0FBTyxVQUFVO1NBQ2QsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsc0JBQXNCLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxFQUFDLENBQUMsQ0FBQztTQUM1RSxNQUFNLENBQUMsQ0FBQyxFQUFDLFVBQVUsRUFBQyxFQUFFLEVBQUUsQ0FBQyxVQUFVLElBQUksVUFBVSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDckYsR0FBRyxDQUFDLENBQUMsRUFBQyxJQUFJLEVBQUUsVUFBVSxFQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDNUIsSUFBSSxFQUFFLElBQStCO1FBQ3JDLElBQUksRUFBRSxVQUFXLENBQUMsVUFBVTtLQUM3QixDQUFDLENBQUMsQ0FBQztBQUNSLENBQUM7QUFFRCxTQUFnQixzQkFBc0IsQ0FDcEMsV0FBMkIsRUFDM0IsU0FBdUI7SUFFdkIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztRQUMvQyxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFDRCxNQUFNLFNBQVMsR0FBRyxTQUFTLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQztJQUNsRCxJQUFJLFVBQVUsR0FBeUIsSUFBSSxDQUFDO0lBQzVDLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO1FBQy9CLFVBQVUsR0FBRyxTQUFTLENBQUM7SUFDekIsQ0FBQztTQUFNLElBQUksRUFBRSxDQUFDLDBCQUEwQixDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDdkYsVUFBVSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUM7SUFDOUIsQ0FBQztJQUNELE9BQU8sVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFBLCtCQUFxQixFQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQzVFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Z2V0SW1wb3J0T2ZJZGVudGlmaWVyLCBJbXBvcnR9IGZyb20gJy4vaW1wb3J0cyc7XG5cbmV4cG9ydCB0eXBlIENhbGxFeHByZXNzaW9uRGVjb3JhdG9yID0gdHMuRGVjb3JhdG9yICYge1xuICBleHByZXNzaW9uOiB0cy5DYWxsRXhwcmVzc2lvbjtcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgTmdEZWNvcmF0b3Ige1xuICBuYW1lOiBzdHJpbmc7XG4gIG5vZGU6IENhbGxFeHByZXNzaW9uRGVjb3JhdG9yO1xufVxuXG4vKipcbiAqIEdldHMgYWxsIGRlY29yYXRvcnMgd2hpY2ggYXJlIGltcG9ydGVkIGZyb20gYW4gQW5ndWxhciBwYWNrYWdlXG4gKiAoZS5nLiBcIkBhbmd1bGFyL2NvcmVcIikgZnJvbSBhIGxpc3Qgb2YgZGVjb3JhdG9ycy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEFuZ3VsYXJEZWNvcmF0b3JzKFxuICB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsXG4gIGRlY29yYXRvcnM6IHJlYWRvbmx5IHRzLkRlY29yYXRvcltdLFxuKTogcmVhZG9ubHkgTmdEZWNvcmF0b3JbXSB7XG4gIHJldHVybiBkZWNvcmF0b3JzXG4gICAgLm1hcChub2RlID0+ICh7bm9kZSwgaW1wb3J0RGF0YTogZ2V0Q2FsbERlY29yYXRvckltcG9ydCh0eXBlQ2hlY2tlciwgbm9kZSl9KSlcbiAgICAuZmlsdGVyKCh7aW1wb3J0RGF0YX0pID0+IGltcG9ydERhdGEgJiYgaW1wb3J0RGF0YS5tb2R1bGVOYW1lLnN0YXJ0c1dpdGgoJ0Bhbmd1bGFyLycpKVxuICAgIC5tYXAoKHtub2RlLCBpbXBvcnREYXRhfSkgPT4gKHtcbiAgICAgIG5vZGU6IG5vZGUgYXMgQ2FsbEV4cHJlc3Npb25EZWNvcmF0b3IsXG4gICAgICBuYW1lOiBpbXBvcnREYXRhIS5zeW1ib2xOYW1lLFxuICAgIH0pKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENhbGxEZWNvcmF0b3JJbXBvcnQoXG4gIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcixcbiAgZGVjb3JhdG9yOiB0cy5EZWNvcmF0b3IsXG4pOiBJbXBvcnQgfCBudWxsIHtcbiAgaWYgKCF0cy5pc0NhbGxFeHByZXNzaW9uKGRlY29yYXRvci5leHByZXNzaW9uKSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGNvbnN0IHZhbHVlRXhwciA9IGRlY29yYXRvci5leHByZXNzaW9uLmV4cHJlc3Npb247XG4gIGxldCBpZGVudGlmaWVyOiB0cy5JZGVudGlmaWVyIHwgbnVsbCA9IG51bGw7XG4gIGlmICh0cy5pc0lkZW50aWZpZXIodmFsdWVFeHByKSkge1xuICAgIGlkZW50aWZpZXIgPSB2YWx1ZUV4cHI7XG4gIH0gZWxzZSBpZiAodHMuaXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24odmFsdWVFeHByKSAmJiB0cy5pc0lkZW50aWZpZXIodmFsdWVFeHByLm5hbWUpKSB7XG4gICAgaWRlbnRpZmllciA9IHZhbHVlRXhwci5uYW1lO1xuICB9XG4gIHJldHVybiBpZGVudGlmaWVyID8gZ2V0SW1wb3J0T2ZJZGVudGlmaWVyKGlkZW50aWZpZXIsIHR5cGVDaGVja2VyKSA6IG51bGw7XG59XG4iXX0=