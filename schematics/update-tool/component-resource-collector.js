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
        define("@angular/cdk/schematics/update-tool/component-resource-collector", ["require", "exports", "path", "typescript", "@angular/cdk/schematics/update-tool/utils/decorators", "@angular/cdk/schematics/update-tool/utils/functions", "@angular/cdk/schematics/update-tool/utils/line-mappings", "@angular/cdk/schematics/update-tool/utils/property-name"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const path_1 = require("path");
    const ts = require("typescript");
    const decorators_1 = require("@angular/cdk/schematics/update-tool/utils/decorators");
    const functions_1 = require("@angular/cdk/schematics/update-tool/utils/functions");
    const line_mappings_1 = require("@angular/cdk/schematics/update-tool/utils/line-mappings");
    const property_name_1 = require("@angular/cdk/schematics/update-tool/utils/property-name");
    /**
     * Collector that can be used to find Angular templates and stylesheets referenced within
     * given TypeScript source files (inline or external referenced files)
     */
    class ComponentResourceCollector {
        constructor(typeChecker, _fileSystem) {
            this.typeChecker = typeChecker;
            this._fileSystem = _fileSystem;
            this.resolvedTemplates = [];
            this.resolvedStylesheets = [];
        }
        visitNode(node) {
            if (node.kind === ts.SyntaxKind.ClassDeclaration) {
                this._visitClassDeclaration(node);
            }
        }
        _visitClassDeclaration(node) {
            if (!node.decorators || !node.decorators.length) {
                return;
            }
            const ngDecorators = decorators_1.getAngularDecorators(this.typeChecker, node.decorators);
            const componentDecorator = ngDecorators.find(dec => dec.name === 'Component');
            // In case no "@Component" decorator could be found on the current class, skip.
            if (!componentDecorator) {
                return;
            }
            const decoratorCall = componentDecorator.node.expression;
            // In case the component decorator call is not valid, skip this class declaration.
            if (decoratorCall.arguments.length !== 1) {
                return;
            }
            const componentMetadata = functions_1.unwrapExpression(decoratorCall.arguments[0]);
            // Ensure that the component metadata is an object literal expression.
            if (!ts.isObjectLiteralExpression(componentMetadata)) {
                return;
            }
            const sourceFile = node.getSourceFile();
            const filePath = this._fileSystem.resolve(sourceFile.fileName);
            const sourceFileDirPath = path_1.dirname(sourceFile.fileName);
            // Walk through all component metadata properties and determine the referenced
            // HTML templates (either external or inline)
            componentMetadata.properties.forEach(property => {
                if (!ts.isPropertyAssignment(property)) {
                    return;
                }
                const propertyName = property_name_1.getPropertyNameText(property.name);
                if (propertyName === 'styles' && ts.isArrayLiteralExpression(property.initializer)) {
                    property.initializer.elements.forEach(el => {
                        if (ts.isStringLiteralLike(el)) {
                            // Need to add an offset of one to the start because the template quotes are
                            // not part of the template content.
                            const templateStartIdx = el.getStart() + 1;
                            this.resolvedStylesheets.push({
                                filePath,
                                container: node,
                                content: el.text,
                                inline: true,
                                start: templateStartIdx,
                                getCharacterAndLineOfPosition: pos => ts.getLineAndCharacterOfPosition(sourceFile, pos + templateStartIdx),
                            });
                        }
                    });
                }
                // In case there is an inline template specified, ensure that the value is statically
                // analyzable by checking if the initializer is a string literal-like node.
                if (propertyName === 'template' && ts.isStringLiteralLike(property.initializer)) {
                    // Need to add an offset of one to the start because the template quotes are
                    // not part of the template content.
                    const templateStartIdx = property.initializer.getStart() + 1;
                    this.resolvedTemplates.push({
                        filePath,
                        container: node,
                        content: property.initializer.text,
                        inline: true,
                        start: templateStartIdx,
                        getCharacterAndLineOfPosition: pos => ts.getLineAndCharacterOfPosition(sourceFile, pos + templateStartIdx)
                    });
                }
                if (propertyName === 'styleUrls' && ts.isArrayLiteralExpression(property.initializer)) {
                    property.initializer.elements.forEach(el => {
                        if (ts.isStringLiteralLike(el)) {
                            const stylesheetPath = this._fileSystem.resolve(sourceFileDirPath, el.text);
                            // In case the stylesheet does not exist in the file system, skip it gracefully.
                            if (!this._fileSystem.exists(stylesheetPath)) {
                                return;
                            }
                            this.resolvedStylesheets.push(this.resolveExternalStylesheet(stylesheetPath, node));
                        }
                    });
                }
                if (propertyName === 'templateUrl' && ts.isStringLiteralLike(property.initializer)) {
                    const templateUrl = property.initializer.text;
                    const templatePath = this._fileSystem.resolve(sourceFileDirPath, templateUrl);
                    // In case the template does not exist in the file system, skip this
                    // external template.
                    if (!this._fileSystem.exists(templatePath)) {
                        return;
                    }
                    const fileContent = this._fileSystem.read(templatePath);
                    const lineStartsMap = line_mappings_1.computeLineStartsMap(fileContent);
                    this.resolvedTemplates.push({
                        filePath: templatePath,
                        container: node,
                        content: fileContent,
                        inline: false,
                        start: 0,
                        getCharacterAndLineOfPosition: pos => line_mappings_1.getLineAndCharacterFromPosition(lineStartsMap, pos),
                    });
                }
            });
        }
        /** Resolves an external stylesheet by reading its content and computing line mappings. */
        resolveExternalStylesheet(filePath, container) {
            const fileContent = this._fileSystem.read(filePath);
            const lineStartsMap = line_mappings_1.computeLineStartsMap(fileContent);
            return {
                filePath: filePath,
                container: container,
                content: fileContent,
                inline: false,
                start: 0,
                getCharacterAndLineOfPosition: pos => line_mappings_1.getLineAndCharacterFromPosition(lineStartsMap, pos),
            };
        }
    }
    exports.ComponentResourceCollector = ComponentResourceCollector;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LXJlc291cmNlLWNvbGxlY3Rvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2NoZW1hdGljcy91cGRhdGUtdG9vbC9jb21wb25lbnQtcmVzb3VyY2UtY29sbGVjdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsK0JBQTZCO0lBQzdCLGlDQUFpQztJQUVqQyxxRkFBd0Q7SUFDeEQsbUZBQW1EO0lBQ25ELDJGQUkrQjtJQUMvQiwyRkFBMEQ7SUFxQjFEOzs7T0FHRztJQUNILE1BQWEsMEJBQTBCO1FBSXJDLFlBQW1CLFdBQTJCLEVBQVUsV0FBdUI7WUFBNUQsZ0JBQVcsR0FBWCxXQUFXLENBQWdCO1lBQVUsZ0JBQVcsR0FBWCxXQUFXLENBQVk7WUFIL0Usc0JBQWlCLEdBQXVCLEVBQUUsQ0FBQztZQUMzQyx3QkFBbUIsR0FBdUIsRUFBRSxDQUFDO1FBRXFDLENBQUM7UUFFbkYsU0FBUyxDQUFDLElBQWE7WUFDckIsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLEVBQUU7Z0JBQ2hELElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUEyQixDQUFDLENBQUM7YUFDMUQ7UUFDSCxDQUFDO1FBRU8sc0JBQXNCLENBQUMsSUFBeUI7WUFDdEQsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRTtnQkFDL0MsT0FBTzthQUNSO1lBRUQsTUFBTSxZQUFZLEdBQUcsaUNBQW9CLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDN0UsTUFBTSxrQkFBa0IsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxXQUFXLENB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LENBQUMsV0FBVyxDQUFDLENBQUM7b0JBRXhELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUM7d0JBQzFCLFFBQVEsRUFBRSxZQUFZO3dCQUN0QixTQUFTLEVBQUUsSUFBSTt3QkFDZixPQUFPLEVBQUUsV0FBVzt3QkFDcEIsTUFBTSxFQUFFLEtBQUs7d0JBQ2IsS0FBSyxFQUFFLENBQUM7d0JBQ1IsNkJBQTZCLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQywrQ0FBK0IsQ0FBQyxhQUFhLEVBQUUsR0FBRyxDQUFDO3FCQUMxRixDQUFDLENBQUM7aUJBQ0o7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCwwRkFBMEY7UUFDMUYseUJBQXlCLENBQUMsUUFBdUIsRUFBRSxTQUFtQztZQUVwRixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNwRCxNQUFNLGFBQWEsR0FBRyxvQ0FBb0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUV4RCxPQUFPO2dCQUNMLFFBQVEsRUFBRSxRQUFRO2dCQUNsQixTQUFTLEVBQUUsU0FBUztnQkFDcEIsT0FBTyxFQUFFLFdBQVc7Z0JBQ3BCLE1BQU0sRUFBRSxLQUFLO2dCQUNiLEtBQUssRUFBRSxDQUFDO2dCQUNSLDZCQUE2QixFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsK0NBQStCLENBQUMsYUFBYSxFQUFFLEdBQUcsQ0FBQzthQUMxRixDQUFDO1FBQ0osQ0FBQztLQUNGO0lBL0lELGdFQStJQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Rpcm5hbWV9IGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge0ZpbGVTeXN0ZW0sIFdvcmtzcGFjZVBhdGh9IGZyb20gJy4vZmlsZS1zeXN0ZW0nO1xuaW1wb3J0IHtnZXRBbmd1bGFyRGVjb3JhdG9yc30gZnJvbSAnLi91dGlscy9kZWNvcmF0b3JzJztcbmltcG9ydCB7dW53cmFwRXhwcmVzc2lvbn0gZnJvbSAnLi91dGlscy9mdW5jdGlvbnMnO1xuaW1wb3J0IHtcbiAgY29tcHV0ZUxpbmVTdGFydHNNYXAsXG4gIGdldExpbmVBbmRDaGFyYWN0ZXJGcm9tUG9zaXRpb24sXG4gIExpbmVBbmRDaGFyYWN0ZXJcbn0gZnJvbSAnLi91dGlscy9saW5lLW1hcHBpbmdzJztcbmltcG9ydCB7Z2V0UHJvcGVydHlOYW1lVGV4dH0gZnJvbSAnLi91dGlscy9wcm9wZXJ0eS1uYW1lJztcblxuZXhwb3J0IGludGVyZmFjZSBSZXNvbHZlZFJlc291cmNlIHtcbiAgLyoqIENsYXNzIGRlY2xhcmF0aW9uIHRoYXQgY29udGFpbnMgdGhpcyByZXNvdXJjZS4gKi9cbiAgY29udGFpbmVyOiB0cy5DbGFzc0RlY2xhcmF0aW9ufG51bGw7XG4gIC8qKiBGaWxlIGNvbnRlbnQgb2YgdGhlIGdpdmVuIHRlbXBsYXRlLiAqL1xuICBjb250ZW50OiBzdHJpbmc7XG4gIC8qKiBTdGFydCBvZmZzZXQgb2YgdGhlIHJlc291cmNlIGNvbnRlbnQgKGUuZy4gaW4gdGhlIGlubGluZSBzb3VyY2UgZmlsZSkgKi9cbiAgc3RhcnQ6IG51bWJlcjtcbiAgLyoqIFdoZXRoZXIgdGhlIGdpdmVuIHJlc291cmNlIGlzIGlubGluZSBvciBub3QuICovXG4gIGlubGluZTogYm9vbGVhbjtcbiAgLyoqIFBhdGggdG8gdGhlIGZpbGUgdGhhdCBjb250YWlucyB0aGlzIHJlc291cmNlLiAqL1xuICBmaWxlUGF0aDogV29ya3NwYWNlUGF0aDtcbiAgLyoqXG4gICAqIEdldHMgdGhlIGNoYXJhY3RlciBhbmQgbGluZSBvZiBhIGdpdmVuIHBvc2l0aW9uIGluZGV4IGluIHRoZSByZXNvdXJjZS5cbiAgICogSWYgdGhlIHJlc291cmNlIGlzIGRlY2xhcmVkIGlubGluZSB3aXRoaW4gYSBUeXBlU2NyaXB0IHNvdXJjZSBmaWxlLCB0aGUgbGluZSBhbmRcbiAgICogY2hhcmFjdGVyIGFyZSBiYXNlZCBvbiB0aGUgZnVsbCBzb3VyY2UgZmlsZSBjb250ZW50LlxuICAgKi9cbiAgZ2V0Q2hhcmFjdGVyQW5kTGluZU9mUG9zaXRpb246IChwb3M6IG51bWJlcikgPT4gTGluZUFuZENoYXJhY3Rlcjtcbn1cblxuLyoqXG4gKiBDb2xsZWN0b3IgdGhhdCBjYW4gYmUgdXNlZCB0byBmaW5kIEFuZ3VsYXIgdGVtcGxhdGVzIGFuZCBzdHlsZXNoZWV0cyByZWZlcmVuY2VkIHdpdGhpblxuICogZ2l2ZW4gVHlwZVNjcmlwdCBzb3VyY2UgZmlsZXMgKGlubGluZSBvciBleHRlcm5hbCByZWZlcmVuY2VkIGZpbGVzKVxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50UmVzb3VyY2VDb2xsZWN0b3Ige1xuICByZXNvbHZlZFRlbXBsYXRlczogUmVzb2x2ZWRSZXNvdXJjZVtdID0gW107XG4gIHJlc29sdmVkU3R5bGVzaGVldHM6IFJlc29sdmVkUmVzb3VyY2VbXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsIHByaXZhdGUgX2ZpbGVTeXN0ZW06IEZpbGVTeXN0ZW0pIHt9XG5cbiAgdmlzaXROb2RlKG5vZGU6IHRzLk5vZGUpIHtcbiAgICBpZiAobm9kZS5raW5kID09PSB0cy5TeW50YXhLaW5kLkNsYXNzRGVjbGFyYXRpb24pIHtcbiAgICAgIHRoaXMuX3Zpc2l0Q2xhc3NEZWNsYXJhdGlvbihub2RlIGFzIHRzLkNsYXNzRGVjbGFyYXRpb24pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX3Zpc2l0Q2xhc3NEZWNsYXJhdGlvbihub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uKSB7XG4gICAgaWYgKCFub2RlLmRlY29yYXRvcnMgfHwgIW5vZGUuZGVjb3JhdG9ycy5sZW5ndGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBuZ0RlY29yYXRvcnMgPSBnZXRBbmd1bGFyRGVjb3JhdG9ycyh0aGlzLnR5cGVDaGVja2VyLCBub2RlLmRlY29yYXRvcnMpO1xuICAgIGNvbnN0IGNvbXBvbmVudERlY29yYXRvciA9IG5nRGVjb3JhdG9ycy5maW5kKGRlYyA9PiBkZWMubmFtZSA9PT0gJ0NvbXBvbmVudCcpO1xuXG4gICAgLy8gSW4gY2FzZSBubyBcIkBDb21wb25lbnRcIiBkZWNvcmF0b3IgY291bGQgYmUgZm91bmQgb24gdGhlIGN1cnJlbnQgY2xhc3MsIHNraXAuXG4gICAgaWYgKCFjb21wb25lbnREZWNvcmF0b3IpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBkZWNvcmF0b3JDYWxsID0gY29tcG9uZW50RGVjb3JhdG9yLm5vZGUuZXhwcmVzc2lvbjtcblxuICAgIC8vIEluIGNhc2UgdGhlIGNvbXBvbmVudCBkZWNvcmF0b3IgY2FsbCBpcyBub3QgdmFsaWQsIHNraXAgdGhpcyBjbGFzcyBkZWNsYXJhdGlvbi5cbiAgICBpZiAoZGVjb3JhdG9yQ2FsbC5hcmd1bWVudHMubGVuZ3RoICE9PSAxKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY29tcG9uZW50TWV0YWRhdGEgPSB1bndyYXBFeHByZXNzaW9uKGRlY29yYXRvckNhbGwuYXJndW1lbnRzWzBdKTtcblxuICAgIC8vIEVuc3VyZSB0aGF0IHRoZSBjb21wb25lbnQgbWV0YWRhdGEgaXMgYW4gb2JqZWN0IGxpdGVyYWwgZXhwcmVzc2lvbi5cbiAgICBpZiAoIXRzLmlzT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24oY29tcG9uZW50TWV0YWRhdGEpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc291cmNlRmlsZSA9IG5vZGUuZ2V0U291cmNlRmlsZSgpO1xuICAgIGNvbnN0IGZpbGVQYXRoID0gdGhpcy5fZmlsZVN5c3RlbS5yZXNvbHZlKHNvdXJjZUZpbGUuZmlsZU5hbWUpO1xuICAgIGNvbnN0IHNvdXJjZUZpbGVEaXJQYXRoID0gZGlybmFtZShzb3VyY2VGaWxlLmZpbGVOYW1lKTtcblxuICAgIC8vIFdhbGsgdGhyb3VnaCBhbGwgY29tcG9uZW50IG1ldGFkYXRhIHByb3BlcnRpZXMgYW5kIGRldGVybWluZSB0aGUgcmVmZXJlbmNlZFxuICAgIC8vIEhUTUwgdGVtcGxhdGVzIChlaXRoZXIgZXh0ZXJuYWwgb3IgaW5saW5lKVxuICAgIGNvbXBvbmVudE1ldGFkYXRhLnByb3BlcnRpZXMuZm9yRWFjaChwcm9wZXJ0eSA9PiB7XG4gICAgICBpZiAoIXRzLmlzUHJvcGVydHlBc3NpZ25tZW50KHByb3BlcnR5KSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHByb3BlcnR5TmFtZSA9IGdldFByb3BlcnR5TmFtZVRleHQocHJvcGVydHkubmFtZSk7XG5cbiAgICAgIGlmIChwcm9wZXJ0eU5hbWUgPT09ICdzdHlsZXMnICYmIHRzLmlzQXJyYXlMaXRlcmFsRXhwcmVzc2lvbihwcm9wZXJ0eS5pbml0aWFsaXplcikpIHtcbiAgICAgICAgcHJvcGVydHkuaW5pdGlhbGl6ZXIuZWxlbWVudHMuZm9yRWFjaChlbCA9PiB7XG4gICAgICAgICAgaWYgKHRzLmlzU3RyaW5nTGl0ZXJhbExpa2UoZWwpKSB7XG4gICAgICAgICAgICAvLyBOZWVkIHRvIGFkZCBhbiBvZmZzZXQgb2Ygb25lIHRvIHRoZSBzdGFydCBiZWNhdXNlIHRoZSB0ZW1wbGF0ZSBxdW90ZXMgYXJlXG4gICAgICAgICAgICAvLyBub3QgcGFydCBvZiB0aGUgdGVtcGxhdGUgY29udGVudC5cbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlU3RhcnRJZHggPSBlbC5nZXRTdGFydCgpICsgMTtcbiAgICAgICAgICAgIHRoaXMucmVzb2x2ZWRTdHlsZXNoZWV0cy5wdXNoKHtcbiAgICAgICAgICAgICAgZmlsZVBhdGgsXG4gICAgICAgICAgICAgIGNvbnRhaW5lcjogbm9kZSxcbiAgICAgICAgICAgICAgY29udGVudDogZWwudGV4dCxcbiAgICAgICAgICAgICAgaW5saW5lOiB0cnVlLFxuICAgICAgICAgICAgICBzdGFydDogdGVtcGxhdGVTdGFydElkeCxcbiAgICAgICAgICAgICAgZ2V0Q2hhcmFjdGVyQW5kTGluZU9mUG9zaXRpb246IHBvcyA9PlxuICAgICAgICAgICAgICAgICAgdHMuZ2V0TGluZUFuZENoYXJhY3Rlck9mUG9zaXRpb24oc291cmNlRmlsZSwgcG9zICsgdGVtcGxhdGVTdGFydElkeCksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBJbiBjYXNlIHRoZXJlIGlzIGFuIGlubGluZSB0ZW1wbGF0ZSBzcGVjaWZpZWQsIGVuc3VyZSB0aGF0IHRoZSB2YWx1ZSBpcyBzdGF0aWNhbGx5XG4gICAgICAvLyBhbmFseXphYmxlIGJ5IGNoZWNraW5nIGlmIHRoZSBpbml0aWFsaXplciBpcyBhIHN0cmluZyBsaXRlcmFsLWxpa2Ugbm9kZS5cbiAgICAgIGlmIChwcm9wZXJ0eU5hbWUgPT09ICd0ZW1wbGF0ZScgJiYgdHMuaXNTdHJpbmdMaXRlcmFsTGlrZShwcm9wZXJ0eS5pbml0aWFsaXplcikpIHtcbiAgICAgICAgLy8gTmVlZCB0byBhZGQgYW4gb2Zmc2V0IG9mIG9uZSB0byB0aGUgc3RhcnQgYmVjYXVzZSB0aGUgdGVtcGxhdGUgcXVvdGVzIGFyZVxuICAgICAgICAvLyBub3QgcGFydCBvZiB0aGUgdGVtcGxhdGUgY29udGVudC5cbiAgICAgICAgY29uc3QgdGVtcGxhdGVTdGFydElkeCA9IHByb3BlcnR5LmluaXRpYWxpemVyLmdldFN0YXJ0KCkgKyAxO1xuICAgICAgICB0aGlzLnJlc29sdmVkVGVtcGxhdGVzLnB1c2goe1xuICAgICAgICAgIGZpbGVQYXRoLFxuICAgICAgICAgIGNvbnRhaW5lcjogbm9kZSxcbiAgICAgICAgICBjb250ZW50OiBwcm9wZXJ0eS5pbml0aWFsaXplci50ZXh0LFxuICAgICAgICAgIGlubGluZTogdHJ1ZSxcbiAgICAgICAgICBzdGFydDogdGVtcGxhdGVTdGFydElkeCxcbiAgICAgICAgICBnZXRDaGFyYWN0ZXJBbmRMaW5lT2ZQb3NpdGlvbjogcG9zID0+XG4gICAgICAgICAgICAgIHRzLmdldExpbmVBbmRDaGFyYWN0ZXJPZlBvc2l0aW9uKHNvdXJjZUZpbGUsIHBvcyArIHRlbXBsYXRlU3RhcnRJZHgpXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAocHJvcGVydHlOYW1lID09PSAnc3R5bGVVcmxzJyAmJiB0cy5pc0FycmF5TGl0ZXJhbEV4cHJlc3Npb24ocHJvcGVydHkuaW5pdGlhbGl6ZXIpKSB7XG4gICAgICAgIHByb3BlcnR5LmluaXRpYWxpemVyLmVsZW1lbnRzLmZvckVhY2goZWwgPT4ge1xuICAgICAgICAgIGlmICh0cy5pc1N0cmluZ0xpdGVyYWxMaWtlKGVsKSkge1xuICAgICAgICAgICAgY29uc3Qgc3R5bGVzaGVldFBhdGggPSB0aGlzLl9maWxlU3lzdGVtLnJlc29sdmUoc291cmNlRmlsZURpclBhdGgsIGVsLnRleHQpO1xuXG4gICAgICAgICAgICAvLyBJbiBjYXNlIHRoZSBzdHlsZXNoZWV0IGRvZXMgbm90IGV4aXN0IGluIHRoZSBmaWxlIHN5c3RlbSwgc2tpcCBpdCBncmFjZWZ1bGx5LlxuICAgICAgICAgICAgaWYgKCF0aGlzLl9maWxlU3lzdGVtLmV4aXN0cyhzdHlsZXNoZWV0UGF0aCkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnJlc29sdmVkU3R5bGVzaGVldHMucHVzaCh0aGlzLnJlc29sdmVFeHRlcm5hbFN0eWxlc2hlZXQoc3R5bGVzaGVldFBhdGgsIG5vZGUpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAocHJvcGVydHlOYW1lID09PSAndGVtcGxhdGVVcmwnICYmIHRzLmlzU3RyaW5nTGl0ZXJhbExpa2UocHJvcGVydHkuaW5pdGlhbGl6ZXIpKSB7XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlVXJsID0gcHJvcGVydHkuaW5pdGlhbGl6ZXIudGV4dDtcbiAgICAgICAgY29uc3QgdGVtcGxhdGVQYXRoID0gdGhpcy5fZmlsZVN5c3RlbS5yZXNvbHZlKHNvdXJjZUZpbGVEaXJQYXRoLCB0ZW1wbGF0ZVVybCk7XG5cbiAgICAgICAgLy8gSW4gY2FzZSB0aGUgdGVtcGxhdGUgZG9lcyBub3QgZXhpc3QgaW4gdGhlIGZpbGUgc3lzdGVtLCBza2lwIHRoaXNcbiAgICAgICAgLy8gZXh0ZXJuYWwgdGVtcGxhdGUuXG4gICAgICAgIGlmICghdGhpcy5fZmlsZVN5c3RlbS5leGlzdHModGVtcGxhdGVQYXRoKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZpbGVDb250ZW50ID0gdGhpcy5fZmlsZVN5c3RlbS5yZWFkKHRlbXBsYXRlUGF0aCk7XG4gICAgICAgIGNvbnN0IGxpbmVTdGFydHNNYXAgPSBjb21wdXRlTGluZVN0YXJ0c01hcChmaWxlQ29udGVudCk7XG5cbiAgICAgICAgdGhpcy5yZXNvbHZlZFRlbXBsYXRlcy5wdXNoKHtcbiAgICAgICAgICBmaWxlUGF0aDogdGVtcGxhdGVQYXRoLFxuICAgICAgICAgIGNvbnRhaW5lcjogbm9kZSxcbiAgICAgICAgICBjb250ZW50OiBmaWxlQ29udGVudCxcbiAgICAgICAgICBpbmxpbmU6IGZhbHNlLFxuICAgICAgICAgIHN0YXJ0OiAwLFxuICAgICAgICAgIGdldENoYXJhY3RlckFuZExpbmVPZlBvc2l0aW9uOiBwb3MgPT4gZ2V0TGluZUFuZENoYXJhY3RlckZyb21Qb3NpdGlvbihsaW5lU3RhcnRzTWFwLCBwb3MpLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBSZXNvbHZlcyBhbiBleHRlcm5hbCBzdHlsZXNoZWV0IGJ5IHJlYWRpbmcgaXRzIGNvbnRlbnQgYW5kIGNvbXB1dGluZyBsaW5lIG1hcHBpbmdzLiAqL1xuICByZXNvbHZlRXh0ZXJuYWxTdHlsZXNoZWV0KGZpbGVQYXRoOiBXb3Jrc3BhY2VQYXRoLCBjb250YWluZXI6IHRzLkNsYXNzRGVjbGFyYXRpb258bnVsbCk6XG4gICAgICBSZXNvbHZlZFJlc291cmNlIHtcbiAgICBjb25zdCBmaWxlQ29udGVudCA9IHRoaXMuX2ZpbGVTeXN0ZW0ucmVhZChmaWxlUGF0aCk7XG4gICAgY29uc3QgbGluZVN0YXJ0c01hcCA9IGNvbXB1dGVMaW5lU3RhcnRzTWFwKGZpbGVDb250ZW50KTtcblxuICAgIHJldHVybiB7XG4gICAgICBmaWxlUGF0aDogZmlsZVBhdGgsXG4gICAgICBjb250YWluZXI6IGNvbnRhaW5lcixcbiAgICAgIGNvbnRlbnQ6IGZpbGVDb250ZW50LFxuICAgICAgaW5saW5lOiBmYWxzZSxcbiAgICAgIHN0YXJ0OiAwLFxuICAgICAgZ2V0Q2hhcmFjdGVyQW5kTGluZU9mUG9zaXRpb246IHBvcyA9PiBnZXRMaW5lQW5kQ2hhcmFjdGVyRnJvbVBvc2l0aW9uKGxpbmVTdGFydHNNYXAsIHBvcyksXG4gICAgfTtcbiAgfVxufVxuIl19