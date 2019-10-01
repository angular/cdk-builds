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
        define("@angular/cdk/schematics/utils/ast/ng-module-imports", ["require", "exports", "@angular-devkit/schematics", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const ts = require("typescript");
    /**
     * Whether the Angular module in the given path imports the specified module class name.
     */
    function hasNgModuleImport(tree, modulePath, className) {
        const moduleFileContent = tree.read(modulePath);
        if (!moduleFileContent) {
            throw new schematics_1.SchematicsException(`Could not read Angular module file: ${modulePath}`);
        }
        const parsedFile = ts.createSourceFile(modulePath, moduleFileContent.toString(), ts.ScriptTarget.Latest, true);
        const ngModuleMetadata = findNgModuleMetadata(parsedFile);
        if (!ngModuleMetadata) {
            throw new schematics_1.SchematicsException(`Could not find NgModule declaration inside: "${modulePath}"`);
        }
        for (let property of ngModuleMetadata.properties) {
            if (!ts.isPropertyAssignment(property) || property.name.getText() !== 'imports' ||
                !ts.isArrayLiteralExpression(property.initializer)) {
                continue;
            }
            if (property.initializer.elements.some(element => element.getText() === className)) {
                return true;
            }
        }
        return false;
    }
    exports.hasNgModuleImport = hasNgModuleImport;
    /**
     * Resolves the last identifier that is part of the given expression. This helps resolving
     * identifiers of nested property access expressions (e.g. myNamespace.core.NgModule).
     */
    function resolveIdentifierOfExpression(expression) {
        if (ts.isIdentifier(expression)) {
            return expression;
        }
        else if (ts.isPropertyAccessExpression(expression)) {
            return expression.name;
        }
        return null;
    }
    /**
     * Finds a NgModule declaration within the specified TypeScript node and returns the
     * corresponding metadata for it. This function searches breadth first because
     * NgModule's are usually not nested within other expressions or declarations.
     */
    function findNgModuleMetadata(rootNode) {
        // Add immediate child nodes of the root node to the queue.
        const nodeQueue = [...rootNode.getChildren()];
        while (nodeQueue.length) {
            const node = nodeQueue.shift();
            if (ts.isDecorator(node) && ts.isCallExpression(node.expression) &&
                isNgModuleCallExpression(node.expression)) {
                return node.expression.arguments[0];
            }
            else {
                nodeQueue.push(...node.getChildren());
            }
        }
        return null;
    }
    /** Whether the specified call expression is referring to a NgModule definition. */
    function isNgModuleCallExpression(callExpression) {
        if (!callExpression.arguments.length ||
            !ts.isObjectLiteralExpression(callExpression.arguments[0])) {
            return false;
        }
        const decoratorIdentifier = resolveIdentifierOfExpression(callExpression.expression);
        return decoratorIdentifier ? decoratorIdentifier.text === 'NgModule' : false;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmctbW9kdWxlLWltcG9ydHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXRpbHMvYXN0L25nLW1vZHVsZS1pbXBvcnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsMkRBQXFFO0lBQ3JFLGlDQUFpQztJQUVqQzs7T0FFRztJQUNILFNBQWdCLGlCQUFpQixDQUFDLElBQVUsRUFBRSxVQUFrQixFQUFFLFNBQWlCO1FBQ2pGLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUVoRCxJQUFJLENBQUMsaUJBQWlCLEVBQUU7WUFDdEIsTUFBTSxJQUFJLGdDQUFtQixDQUFDLHVDQUF1QyxVQUFVLEVBQUUsQ0FBQyxDQUFDO1NBQ3BGO1FBRUQsTUFBTSxVQUFVLEdBQUcsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxpQkFBaUIsQ0FBQyxRQUFRLEVBQUUsRUFDM0UsRUFBRSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbEMsTUFBTSxnQkFBZ0IsR0FBRyxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUUxRCxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7WUFDckIsTUFBTSxJQUFJLGdDQUFtQixDQUFDLGdEQUFnRCxVQUFVLEdBQUcsQ0FBQyxDQUFDO1NBQzlGO1FBRUQsS0FBSyxJQUFJLFFBQVEsSUFBSSxnQkFBaUIsQ0FBQyxVQUFVLEVBQUU7WUFDakQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLFNBQVM7Z0JBQzNFLENBQUMsRUFBRSxDQUFDLHdCQUF3QixDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRTtnQkFDdEQsU0FBUzthQUNWO1lBRUQsSUFBSSxRQUFRLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLEtBQUssU0FBUyxDQUFDLEVBQUU7Z0JBQ2xGLE9BQU8sSUFBSSxDQUFDO2FBQ2I7U0FDRjtRQUVELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQTNCRCw4Q0EyQkM7SUFFRDs7O09BR0c7SUFDSCxTQUFTLDZCQUE2QixDQUFDLFVBQXlCO1FBQzlELElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUMvQixPQUFPLFVBQVUsQ0FBQztTQUNuQjthQUFNLElBQUksRUFBRSxDQUFDLDBCQUEwQixDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQ3BELE9BQU8sVUFBVSxDQUFDLElBQUksQ0FBQztTQUN4QjtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxTQUFTLG9CQUFvQixDQUFDLFFBQWlCO1FBQzdDLDJEQUEyRDtRQUMzRCxNQUFNLFNBQVMsR0FBYyxDQUFDLEdBQUcsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7UUFFekQsT0FBTyxTQUFTLENBQUMsTUFBTSxFQUFFO1lBQ3ZCLE1BQU0sSUFBSSxHQUFHLFNBQVMsQ0FBQyxLQUFLLEVBQUcsQ0FBQztZQUVoQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7Z0JBQzVELHdCQUF3QixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRTtnQkFDN0MsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQStCLENBQUM7YUFDbkU7aUJBQU07Z0JBQ0wsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO2FBQ3ZDO1NBQ0Y7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxtRkFBbUY7SUFDbkYsU0FBUyx3QkFBd0IsQ0FBQyxjQUFpQztRQUNqRSxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxNQUFNO1lBQ2hDLENBQUMsRUFBRSxDQUFDLHlCQUF5QixDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUM5RCxPQUFPLEtBQUssQ0FBQztTQUNkO1FBRUQsTUFBTSxtQkFBbUIsR0FBRyw2QkFBNkIsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDckYsT0FBTyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsSUFBSSxLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0lBQy9FLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuLyoqXG4gKiBXaGV0aGVyIHRoZSBBbmd1bGFyIG1vZHVsZSBpbiB0aGUgZ2l2ZW4gcGF0aCBpbXBvcnRzIHRoZSBzcGVjaWZpZWQgbW9kdWxlIGNsYXNzIG5hbWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYXNOZ01vZHVsZUltcG9ydCh0cmVlOiBUcmVlLCBtb2R1bGVQYXRoOiBzdHJpbmcsIGNsYXNzTmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IG1vZHVsZUZpbGVDb250ZW50ID0gdHJlZS5yZWFkKG1vZHVsZVBhdGgpO1xuXG4gIGlmICghbW9kdWxlRmlsZUNvbnRlbnQpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgQ291bGQgbm90IHJlYWQgQW5ndWxhciBtb2R1bGUgZmlsZTogJHttb2R1bGVQYXRofWApO1xuICB9XG5cbiAgY29uc3QgcGFyc2VkRmlsZSA9IHRzLmNyZWF0ZVNvdXJjZUZpbGUobW9kdWxlUGF0aCwgbW9kdWxlRmlsZUNvbnRlbnQudG9TdHJpbmcoKSxcbiAgICAgIHRzLlNjcmlwdFRhcmdldC5MYXRlc3QsIHRydWUpO1xuICBjb25zdCBuZ01vZHVsZU1ldGFkYXRhID0gZmluZE5nTW9kdWxlTWV0YWRhdGEocGFyc2VkRmlsZSk7XG5cbiAgaWYgKCFuZ01vZHVsZU1ldGFkYXRhKSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYENvdWxkIG5vdCBmaW5kIE5nTW9kdWxlIGRlY2xhcmF0aW9uIGluc2lkZTogXCIke21vZHVsZVBhdGh9XCJgKTtcbiAgfVxuXG4gIGZvciAobGV0IHByb3BlcnR5IG9mIG5nTW9kdWxlTWV0YWRhdGEhLnByb3BlcnRpZXMpIHtcbiAgICBpZiAoIXRzLmlzUHJvcGVydHlBc3NpZ25tZW50KHByb3BlcnR5KSB8fCBwcm9wZXJ0eS5uYW1lLmdldFRleHQoKSAhPT0gJ2ltcG9ydHMnIHx8XG4gICAgICAgICF0cy5pc0FycmF5TGl0ZXJhbEV4cHJlc3Npb24ocHJvcGVydHkuaW5pdGlhbGl6ZXIpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAocHJvcGVydHkuaW5pdGlhbGl6ZXIuZWxlbWVudHMuc29tZShlbGVtZW50ID0+IGVsZW1lbnQuZ2V0VGV4dCgpID09PSBjbGFzc05hbWUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogUmVzb2x2ZXMgdGhlIGxhc3QgaWRlbnRpZmllciB0aGF0IGlzIHBhcnQgb2YgdGhlIGdpdmVuIGV4cHJlc3Npb24uIFRoaXMgaGVscHMgcmVzb2x2aW5nXG4gKiBpZGVudGlmaWVycyBvZiBuZXN0ZWQgcHJvcGVydHkgYWNjZXNzIGV4cHJlc3Npb25zIChlLmcuIG15TmFtZXNwYWNlLmNvcmUuTmdNb2R1bGUpLlxuICovXG5mdW5jdGlvbiByZXNvbHZlSWRlbnRpZmllck9mRXhwcmVzc2lvbihleHByZXNzaW9uOiB0cy5FeHByZXNzaW9uKTogdHMuSWRlbnRpZmllciB8IG51bGwge1xuICBpZiAodHMuaXNJZGVudGlmaWVyKGV4cHJlc3Npb24pKSB7XG4gICAgcmV0dXJuIGV4cHJlc3Npb247XG4gIH0gZWxzZSBpZiAodHMuaXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24oZXhwcmVzc2lvbikpIHtcbiAgICByZXR1cm4gZXhwcmVzc2lvbi5uYW1lO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEZpbmRzIGEgTmdNb2R1bGUgZGVjbGFyYXRpb24gd2l0aGluIHRoZSBzcGVjaWZpZWQgVHlwZVNjcmlwdCBub2RlIGFuZCByZXR1cm5zIHRoZVxuICogY29ycmVzcG9uZGluZyBtZXRhZGF0YSBmb3IgaXQuIFRoaXMgZnVuY3Rpb24gc2VhcmNoZXMgYnJlYWR0aCBmaXJzdCBiZWNhdXNlXG4gKiBOZ01vZHVsZSdzIGFyZSB1c3VhbGx5IG5vdCBuZXN0ZWQgd2l0aGluIG90aGVyIGV4cHJlc3Npb25zIG9yIGRlY2xhcmF0aW9ucy5cbiAqL1xuZnVuY3Rpb24gZmluZE5nTW9kdWxlTWV0YWRhdGEocm9vdE5vZGU6IHRzLk5vZGUpOiB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbiB8IG51bGwge1xuICAvLyBBZGQgaW1tZWRpYXRlIGNoaWxkIG5vZGVzIG9mIHRoZSByb290IG5vZGUgdG8gdGhlIHF1ZXVlLlxuICBjb25zdCBub2RlUXVldWU6IHRzLk5vZGVbXSA9IFsuLi5yb290Tm9kZS5nZXRDaGlsZHJlbigpXTtcblxuICB3aGlsZSAobm9kZVF1ZXVlLmxlbmd0aCkge1xuICAgIGNvbnN0IG5vZGUgPSBub2RlUXVldWUuc2hpZnQoKSE7XG5cbiAgICBpZiAodHMuaXNEZWNvcmF0b3Iobm9kZSkgJiYgdHMuaXNDYWxsRXhwcmVzc2lvbihub2RlLmV4cHJlc3Npb24pICYmXG4gICAgICAgIGlzTmdNb2R1bGVDYWxsRXhwcmVzc2lvbihub2RlLmV4cHJlc3Npb24pKSB7XG4gICAgICByZXR1cm4gbm9kZS5leHByZXNzaW9uLmFyZ3VtZW50c1swXSBhcyB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbjtcbiAgICB9IGVsc2Uge1xuICAgICAgbm9kZVF1ZXVlLnB1c2goLi4ubm9kZS5nZXRDaGlsZHJlbigpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqIFdoZXRoZXIgdGhlIHNwZWNpZmllZCBjYWxsIGV4cHJlc3Npb24gaXMgcmVmZXJyaW5nIHRvIGEgTmdNb2R1bGUgZGVmaW5pdGlvbi4gKi9cbmZ1bmN0aW9uIGlzTmdNb2R1bGVDYWxsRXhwcmVzc2lvbihjYWxsRXhwcmVzc2lvbjogdHMuQ2FsbEV4cHJlc3Npb24pOiBib29sZWFuIHtcbiAgaWYgKCFjYWxsRXhwcmVzc2lvbi5hcmd1bWVudHMubGVuZ3RoIHx8XG4gICAgICAhdHMuaXNPYmplY3RMaXRlcmFsRXhwcmVzc2lvbihjYWxsRXhwcmVzc2lvbi5hcmd1bWVudHNbMF0pKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgY29uc3QgZGVjb3JhdG9ySWRlbnRpZmllciA9IHJlc29sdmVJZGVudGlmaWVyT2ZFeHByZXNzaW9uKGNhbGxFeHByZXNzaW9uLmV4cHJlc3Npb24pO1xuICByZXR1cm4gZGVjb3JhdG9ySWRlbnRpZmllciA/IGRlY29yYXRvcklkZW50aWZpZXIudGV4dCA9PT0gJ05nTW9kdWxlJyA6IGZhbHNlO1xufVxuIl19