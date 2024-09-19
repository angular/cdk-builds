"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentResourceCollector = void 0;
const path_1 = require("path");
const ts = require("typescript");
const decorators_1 = require("./utils/decorators");
const functions_1 = require("./utils/functions");
const line_mappings_1 = require("./utils/line-mappings");
const property_name_1 = require("./utils/property-name");
/**
 * Collector that can be used to find Angular templates and stylesheets referenced within
 * given TypeScript source files (inline or external referenced files)
 */
class ComponentResourceCollector {
    typeChecker;
    _fileSystem;
    resolvedTemplates = [];
    resolvedStylesheets = [];
    constructor(typeChecker, _fileSystem) {
        this.typeChecker = typeChecker;
        this._fileSystem = _fileSystem;
    }
    visitNode(node) {
        if (node.kind === ts.SyntaxKind.ClassDeclaration) {
            this._visitClassDeclaration(node);
        }
    }
    _visitClassDeclaration(node) {
        const decorators = ts.getDecorators(node);
        if (!decorators || !decorators.length) {
            return;
        }
        const ngDecorators = (0, decorators_1.getAngularDecorators)(this.typeChecker, decorators);
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
        const componentMetadata = (0, functions_1.unwrapExpression)(decoratorCall.arguments[0]);
        // Ensure that the component metadata is an object literal expression.
        if (!ts.isObjectLiteralExpression(componentMetadata)) {
            return;
        }
        const sourceFile = node.getSourceFile();
        const filePath = this._fileSystem.resolve(sourceFile.fileName);
        const sourceFileDirPath = (0, path_1.dirname)(sourceFile.fileName);
        // Walk through all component metadata properties and determine the referenced
        // HTML templates (either external or inline)
        componentMetadata.properties.forEach(property => {
            if (!ts.isPropertyAssignment(property)) {
                return;
            }
            const propertyName = (0, property_name_1.getPropertyNameText)(property.name);
            if (propertyName === 'styles') {
                const elements = ts.isArrayLiteralExpression(property.initializer)
                    ? property.initializer.elements
                    : [property.initializer];
                elements.forEach(el => {
                    if (ts.isStringLiteralLike(el)) {
                        // Need to add an offset of one to the start because the template quotes are
                        // not part of the template content.
                        const templateStartIdx = el.getStart() + 1;
                        const content = stripBom(el.text);
                        this.resolvedStylesheets.push({
                            filePath,
                            container: node,
                            content,
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
                    getCharacterAndLineOfPosition: pos => ts.getLineAndCharacterOfPosition(sourceFile, pos + templateStartIdx),
                });
            }
            if (propertyName === 'styleUrls' && ts.isArrayLiteralExpression(property.initializer)) {
                property.initializer.elements.forEach(el => {
                    if (ts.isStringLiteralLike(el)) {
                        this._trackExternalStylesheet(sourceFileDirPath, el, node);
                    }
                });
            }
            if (propertyName === 'styleUrl' && ts.isStringLiteralLike(property.initializer)) {
                this._trackExternalStylesheet(sourceFileDirPath, property.initializer, node);
            }
            if (propertyName === 'templateUrl' && ts.isStringLiteralLike(property.initializer)) {
                const templateUrl = property.initializer.text;
                const templatePath = this._fileSystem.resolve(sourceFileDirPath, templateUrl);
                // In case the template does not exist in the file system, skip this
                // external template.
                if (!this._fileSystem.fileExists(templatePath)) {
                    return;
                }
                const fileContent = stripBom(this._fileSystem.read(templatePath) || '');
                if (fileContent) {
                    const lineStartsMap = (0, line_mappings_1.computeLineStartsMap)(fileContent);
                    this.resolvedTemplates.push({
                        filePath: templatePath,
                        container: node,
                        content: fileContent,
                        inline: false,
                        start: 0,
                        getCharacterAndLineOfPosition: p => (0, line_mappings_1.getLineAndCharacterFromPosition)(lineStartsMap, p),
                    });
                }
            }
        });
    }
    /** Resolves an external stylesheet by reading its content and computing line mappings. */
    resolveExternalStylesheet(filePath, container) {
        // Strip the BOM to avoid issues with the Sass compiler. See:
        // https://github.com/angular/components/issues/24227#issuecomment-1200934258
        const fileContent = stripBom(this._fileSystem.read(filePath) || '');
        if (!fileContent) {
            return null;
        }
        const lineStartsMap = (0, line_mappings_1.computeLineStartsMap)(fileContent);
        return {
            filePath: filePath,
            container: container,
            content: fileContent,
            inline: false,
            start: 0,
            getCharacterAndLineOfPosition: pos => (0, line_mappings_1.getLineAndCharacterFromPosition)(lineStartsMap, pos),
        };
    }
    _trackExternalStylesheet(sourceFileDirPath, node, container) {
        const stylesheetPath = this._fileSystem.resolve(sourceFileDirPath, node.text);
        const stylesheet = this.resolveExternalStylesheet(stylesheetPath, container);
        if (stylesheet) {
            this.resolvedStylesheets.push(stylesheet);
        }
    }
}
exports.ComponentResourceCollector = ComponentResourceCollector;
/** Strips the BOM from a string. */
function stripBom(content) {
    return content.replace(/\uFEFF/g, '');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LXJlc291cmNlLWNvbGxlY3Rvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2NoZW1hdGljcy91cGRhdGUtdG9vbC9jb21wb25lbnQtcmVzb3VyY2UtY29sbGVjdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILCtCQUE2QjtBQUM3QixpQ0FBaUM7QUFFakMsbURBQXdEO0FBQ3hELGlEQUFtRDtBQUNuRCx5REFJK0I7QUFDL0IseURBQTBEO0FBcUIxRDs7O0dBR0c7QUFDSCxNQUFhLDBCQUEwQjtJQUs1QjtJQUNDO0lBTFYsaUJBQWlCLEdBQXVCLEVBQUUsQ0FBQztJQUMzQyxtQkFBbUIsR0FBdUIsRUFBRSxDQUFDO0lBRTdDLFlBQ1MsV0FBMkIsRUFDMUIsV0FBdUI7UUFEeEIsZ0JBQVcsR0FBWCxXQUFXLENBQWdCO1FBQzFCLGdCQUFXLEdBQVgsV0FBVyxDQUFZO0lBQzlCLENBQUM7SUFFSixTQUFTLENBQUMsSUFBYTtRQUNyQixJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ2pELElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUEyQixDQUFDLENBQUM7UUFDM0QsQ0FBQztJQUNILENBQUM7SUFFTyxzQkFBc0IsQ0FBQyxJQUF5QjtRQUN0RCxNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRTFDLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDdEMsT0FBTztRQUNULENBQUM7UUFFRCxNQUFNLFlBQVksR0FBRyxJQUFBLGlDQUFvQixFQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDeEUsTUFBTSxrQkFBa0IsR0FBRyxZQUFZLENBQUMsSUFBSSxD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QUNMLFFBQVEsRUFBRSxRQUFRO1lBQ2xCLFNBQVMsRUFBRSxTQUFTO1lBQ3BCLE9BQU8sRUFBRSxXQUFXO1lBQ3BCLE1BQU0sRUFBRSxLQUFLO1lBQ2IsS0FBSyxFQUFFLENBQUM7WUFDUiw2QkFBNkIsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUEsK0NBQStCLEVBQUMsYUFBYSxFQUFFLEdBQUcsQ0FBQztTQUMxRixDQUFDO0lBQ0osQ0FBQztJQUVPLHdCQUF3QixDQUM5QixpQkFBeUIsRUFDekIsSUFBMEIsRUFDMUIsU0FBOEI7UUFFOUIsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlFLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxjQUFjLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFFN0UsSUFBSSxVQUFVLEVBQUUsQ0FBQztZQUNmLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDNUMsQ0FBQztJQUNILENBQUM7Q0FDRjtBQS9LRCxnRUErS0M7QUFFRCxvQ0FBb0M7QUFDcEMsU0FBUyxRQUFRLENBQUMsT0FBZTtJQUMvQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ3hDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5kZXYvbGljZW5zZVxuICovXG5cbmltcG9ydCB7ZGlybmFtZX0gZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7RmlsZVN5c3RlbSwgV29ya3NwYWNlUGF0aH0gZnJvbSAnLi9maWxlLXN5c3RlbSc7XG5pbXBvcnQge2dldEFuZ3VsYXJEZWNvcmF0b3JzfSBmcm9tICcuL3V0aWxzL2RlY29yYXRvcnMnO1xuaW1wb3J0IHt1bndyYXBFeHByZXNzaW9ufSBmcm9tICcuL3V0aWxzL2Z1bmN0aW9ucyc7XG5pbXBvcnQge1xuICBjb21wdXRlTGluZVN0YXJ0c01hcCxcbiAgZ2V0TGluZUFuZENoYXJhY3RlckZyb21Qb3NpdGlvbixcbiAgTGluZUFuZENoYXJhY3Rlcixcbn0gZnJvbSAnLi91dGlscy9saW5lLW1hcHBpbmdzJztcbmltcG9ydCB7Z2V0UHJvcGVydHlOYW1lVGV4dH0gZnJvbSAnLi91dGlscy9wcm9wZXJ0eS1uYW1lJztcblxuZXhwb3J0IGludGVyZmFjZSBSZXNvbHZlZFJlc291cmNlIHtcbiAgLyoqIENsYXNzIGRlY2xhcmF0aW9uIHRoYXQgY29udGFpbnMgdGhpcyByZXNvdXJjZS4gKi9cbiAgY29udGFpbmVyOiB0cy5DbGFzc0RlY2xhcmF0aW9uIHwgbnVsbDtcbiAgLyoqIEZpbGUgY29udGVudCBvZiB0aGUgZ2l2ZW4gdGVtcGxhdGUuICovXG4gIGNvbnRlbnQ6IHN0cmluZztcbiAgLyoqIFN0YXJ0IG9mZnNldCBvZiB0aGUgcmVzb3VyY2UgY29udGVudCAoZS5nLiBpbiB0aGUgaW5saW5lIHNvdXJjZSBmaWxlKSAqL1xuICBzdGFydDogbnVtYmVyO1xuICAvKiogV2hldGhlciB0aGUgZ2l2ZW4gcmVzb3VyY2UgaXMgaW5saW5lIG9yIG5vdC4gKi9cbiAgaW5saW5lOiBib29sZWFuO1xuICAvKiogUGF0aCB0byB0aGUgZmlsZSB0aGF0IGNvbnRhaW5zIHRoaXMgcmVzb3VyY2UuICovXG4gIGZpbGVQYXRoOiBXb3Jrc3BhY2VQYXRoO1xuICAvKipcbiAgICogR2V0cyB0aGUgY2hhcmFjdGVyIGFuZCBsaW5lIG9mIGEgZ2l2ZW4gcG9zaXRpb24gaW5kZXggaW4gdGhlIHJlc291cmNlLlxuICAgKiBJZiB0aGUgcmVzb3VyY2UgaXMgZGVjbGFyZWQgaW5saW5lIHdpdGhpbiBhIFR5cGVTY3JpcHQgc291cmNlIGZpbGUsIHRoZSBsaW5lIGFuZFxuICAgKiBjaGFyYWN0ZXIgYXJlIGJhc2VkIG9uIHRoZSBmdWxsIHNvdXJjZSBmaWxlIGNvbnRlbnQuXG4gICAqL1xuICBnZXRDaGFyYWN0ZXJBbmRMaW5lT2ZQb3NpdGlvbjogKHBvczogbnVtYmVyKSA9PiBMaW5lQW5kQ2hhcmFjdGVyO1xufVxuXG4vKipcbiAqIENvbGxlY3RvciB0aGF0IGNhbiBiZSB1c2VkIHRvIGZpbmQgQW5ndWxhciB0ZW1wbGF0ZXMgYW5kIHN0eWxlc2hlZXRzIHJlZmVyZW5jZWQgd2l0aGluXG4gKiBnaXZlbiBUeXBlU2NyaXB0IHNvdXJjZSBmaWxlcyAoaW5saW5lIG9yIGV4dGVybmFsIHJlZmVyZW5jZWQgZmlsZXMpXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRSZXNvdXJjZUNvbGxlY3RvciB7XG4gIHJlc29sdmVkVGVtcGxhdGVzOiBSZXNvbHZlZFJlc291cmNlW10gPSBbXTtcbiAgcmVzb2x2ZWRTdHlsZXNoZWV0czogUmVzb2x2ZWRSZXNvdXJjZVtdID0gW107XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcixcbiAgICBwcml2YXRlIF9maWxlU3lzdGVtOiBGaWxlU3lzdGVtLFxuICApIHt9XG5cbiAgdmlzaXROb2RlKG5vZGU6IHRzLk5vZGUpIHtcbiAgICBpZiAobm9kZS5raW5kID09PSB0cy5TeW50YXhLaW5kLkNsYXNzRGVjbGFyYXRpb24pIHtcbiAgICAgIHRoaXMuX3Zpc2l0Q2xhc3NEZWNsYXJhdGlvbihub2RlIGFzIHRzLkNsYXNzRGVjbGFyYXRpb24pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX3Zpc2l0Q2xhc3NEZWNsYXJhdGlvbihub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uKSB7XG4gICAgY29uc3QgZGVjb3JhdG9ycyA9IHRzLmdldERlY29yYXRvcnMobm9kZSk7XG5cbiAgICBpZiAoIWRlY29yYXRvcnMgfHwgIWRlY29yYXRvcnMubGVuZ3RoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbmdEZWNvcmF0b3JzID0gZ2V0QW5ndWxhckRlY29yYXRvcnModGhpcy50eXBlQ2hlY2tlciwgZGVjb3JhdG9ycyk7XG4gICAgY29uc3QgY29tcG9uZW50RGVjb3JhdG9yID0gbmdEZWNvcmF0b3JzLmZpbmQoZGVjID0+IGRlYy5uYW1lID09PSAnQ29tcG9uZW50Jyk7XG5cbiAgICAvLyBJbiBjYXNlIG5vIFwiQENvbXBvbmVudFwiIGRlY29yYXRvciBjb3VsZCBiZSBmb3VuZCBvbiB0aGUgY3VycmVudCBjbGFzcywgc2tpcC5cbiAgICBpZiAoIWNvbXBvbmVudERlY29yYXRvcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGRlY29yYXRvckNhbGwgPSBjb21wb25lbnREZWNvcmF0b3Iubm9kZS5leHByZXNzaW9uO1xuXG4gICAgLy8gSW4gY2FzZSB0aGUgY29tcG9uZW50IGRlY29yYXRvciBjYWxsIGlzIG5vdCB2YWxpZCwgc2tpcCB0aGlzIGNsYXNzIGRlY2xhcmF0aW9uLlxuICAgIGlmIChkZWNvcmF0b3JDYWxsLmFyZ3VtZW50cy5sZW5ndGggIT09IDEpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjb21wb25lbnRNZXRhZGF0YSA9IHVud3JhcEV4cHJlc3Npb24oZGVjb3JhdG9yQ2FsbC5hcmd1bWVudHNbMF0pO1xuXG4gICAgLy8gRW5zdXJlIHRoYXQgdGhlIGNvbXBvbmVudCBtZXRhZGF0YSBpcyBhbiBvYmplY3QgbGl0ZXJhbCBleHByZXNzaW9uLlxuICAgIGlmICghdHMuaXNPYmplY3RMaXRlcmFsRXhwcmVzc2lvbihjb21wb25lbnRNZXRhZGF0YSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzb3VyY2VGaWxlID0gbm9kZS5nZXRTb3VyY2VGaWxlKCk7XG4gICAgY29uc3QgZmlsZVBhdGggPSB0aGlzLl9maWxlU3lzdGVtLnJlc29sdmUoc291cmNlRmlsZS5maWxlTmFtZSk7XG4gICAgY29uc3Qgc291cmNlRmlsZURpclBhdGggPSBkaXJuYW1lKHNvdXJjZUZpbGUuZmlsZU5hbWUpO1xuXG4gICAgLy8gV2FsayB0aHJvdWdoIGFsbCBjb21wb25lbnQgbWV0YWRhdGEgcHJvcGVydGllcyBhbmQgZGV0ZXJtaW5lIHRoZSByZWZlcmVuY2VkXG4gICAgLy8gSFRNTCB0ZW1wbGF0ZXMgKGVpdGhlciBleHRlcm5hbCBvciBpbmxpbmUpXG4gICAgY29tcG9uZW50TWV0YWRhdGEucHJvcGVydGllcy5mb3JFYWNoKHByb3BlcnR5ID0+IHtcbiAgICAgIGlmICghdHMuaXNQcm9wZXJ0eUFzc2lnbm1lbnQocHJvcGVydHkpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcHJvcGVydHlOYW1lID0gZ2V0UHJvcGVydHlOYW1lVGV4dChwcm9wZXJ0eS5uYW1lKTtcblxuICAgICAgaWYgKHByb3BlcnR5TmFtZSA9PT0gJ3N0eWxlcycpIHtcbiAgICAgICAgY29uc3QgZWxlbWVudHMgPSB0cy5pc0FycmF5TGl0ZXJhbEV4cHJlc3Npb24ocHJvcGVydHkuaW5pdGlhbGl6ZXIpXG4gICAgICAgICAgPyBwcm9wZXJ0eS5pbml0aWFsaXplci5lbGVtZW50c1xuICAgICAgICAgIDogW3Byb3BlcnR5LmluaXRpYWxpemVyXTtcblxuICAgICAgICBlbGVtZW50cy5mb3JFYWNoKGVsID0+IHtcbiAgICAgICAgICBpZiAodHMuaXNTdHJpbmdMaXRlcmFsTGlrZShlbCkpIHtcbiAgICAgICAgICAgIC8vIE5lZWQgdG8gYWRkIGFuIG9mZnNldCBvZiBvbmUgdG8gdGhlIHN0YXJ0IGJlY2F1c2UgdGhlIHRlbXBsYXRlIHF1b3RlcyBhcmVcbiAgICAgICAgICAgIC8vIG5vdCBwYXJ0IG9mIHRoZSB0ZW1wbGF0ZSBjb250ZW50LlxuICAgICAgICAgICAgY29uc3QgdGVtcGxhdGVTdGFydElkeCA9IGVsLmdldFN0YXJ0KCkgKyAxO1xuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IHN0cmlwQm9tKGVsLnRleHQpO1xuICAgICAgICAgICAgdGhpcy5yZXNvbHZlZFN0eWxlc2hlZXRzLnB1c2goe1xuICAgICAgICAgICAgICBmaWxlUGF0aCxcbiAgICAgICAgICAgICAgY29udGFpbmVyOiBub2RlLFxuICAgICAgICAgICAgICBjb250ZW50LFxuICAgICAgICAgICAgICBpbmxpbmU6IHRydWUsXG4gICAgICAgICAgICAgIHN0YXJ0OiB0ZW1wbGF0ZVN0YXJ0SWR4LFxuICAgICAgICAgICAgICBnZXRDaGFyYWN0ZXJBbmRMaW5lT2ZQb3NpdGlvbjogcG9zID0+XG4gICAgICAgICAgICAgICAgdHMuZ2V0TGluZUFuZENoYXJhY3Rlck9mUG9zaXRpb24oc291cmNlRmlsZSwgcG9zICsgdGVtcGxhdGVTdGFydElkeCksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBJbiBjYXNlIHRoZXJlIGlzIGFuIGlubGluZSB0ZW1wbGF0ZSBzcGVjaWZpZWQsIGVuc3VyZSB0aGF0IHRoZSB2YWx1ZSBpcyBzdGF0aWNhbGx5XG4gICAgICAvLyBhbmFseXphYmxlIGJ5IGNoZWNraW5nIGlmIHRoZSBpbml0aWFsaXplciBpcyBhIHN0cmluZyBsaXRlcmFsLWxpa2Ugbm9kZS5cbiAgICAgIGlmIChwcm9wZXJ0eU5hbWUgPT09ICd0ZW1wbGF0ZScgJiYgdHMuaXNTdHJpbmdMaXRlcmFsTGlrZShwcm9wZXJ0eS5pbml0aWFsaXplcikpIHtcbiAgICAgICAgLy8gTmVlZCB0byBhZGQgYW4gb2Zmc2V0IG9mIG9uZSB0byB0aGUgc3RhcnQgYmVjYXVzZSB0aGUgdGVtcGxhdGUgcXVvdGVzIGFyZVxuICAgICAgICAvLyBub3QgcGFydCBvZiB0aGUgdGVtcGxhdGUgY29udGVudC5cbiAgICAgICAgY29uc3QgdGVtcGxhdGVTdGFydElkeCA9IHByb3BlcnR5LmluaXRpYWxpemVyLmdldFN0YXJ0KCkgKyAxO1xuICAgICAgICB0aGlzLnJlc29sdmVkVGVtcGxhdGVzLnB1c2goe1xuICAgICAgICAgIGZpbGVQYXRoLFxuICAgICAgICAgIGNvbnRhaW5lcjogbm9kZSxcbiAgICAgICAgICBjb250ZW50OiBwcm9wZXJ0eS5pbml0aWFsaXplci50ZXh0LFxuICAgICAgICAgIGlubGluZTogdHJ1ZSxcbiAgICAgICAgICBzdGFydDogdGVtcGxhdGVTdGFydElkeCxcbiAgICAgICAgICBnZXRDaGFyYWN0ZXJBbmRMaW5lT2ZQb3NpdGlvbjogcG9zID0+XG4gICAgICAgICAgICB0cy5nZXRMaW5lQW5kQ2hhcmFjdGVyT2ZQb3NpdGlvbihzb3VyY2VGaWxlLCBwb3MgKyB0ZW1wbGF0ZVN0YXJ0SWR4KSxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChwcm9wZXJ0eU5hbWUgPT09ICdzdHlsZVVybHMnICYmIHRzLmlzQXJyYXlMaXRlcmFsRXhwcmVzc2lvbihwcm9wZXJ0eS5pbml0aWFsaXplcikpIHtcbiAgICAgICAgcHJvcGVydHkuaW5pdGlhbGl6ZXIuZWxlbWVudHMuZm9yRWFjaChlbCA9PiB7XG4gICAgICAgICAgaWYgKHRzLmlzU3RyaW5nTGl0ZXJhbExpa2UoZWwpKSB7XG4gICAgICAgICAgICB0aGlzLl90cmFja0V4dGVybmFsU3R5bGVzaGVldChzb3VyY2VGaWxlRGlyUGF0aCwgZWwsIG5vZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChwcm9wZXJ0eU5hbWUgPT09ICdzdHlsZVVybCcgJiYgdHMuaXNTdHJpbmdMaXRlcmFsTGlrZShwcm9wZXJ0eS5pbml0aWFsaXplcikpIHtcbiAgICAgICAgdGhpcy5fdHJhY2tFeHRlcm5hbFN0eWxlc2hlZXQoc291cmNlRmlsZURpclBhdGgsIHByb3BlcnR5LmluaXRpYWxpemVyLCBub2RlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHByb3BlcnR5TmFtZSA9PT0gJ3RlbXBsYXRlVXJsJyAmJiB0cy5pc1N0cmluZ0xpdGVyYWxMaWtlKHByb3BlcnR5LmluaXRpYWxpemVyKSkge1xuICAgICAgICBjb25zdCB0ZW1wbGF0ZVVybCA9IHByb3BlcnR5LmluaXRpYWxpemVyLnRleHQ7XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlUGF0aCA9IHRoaXMuX2ZpbGVTeXN0ZW0ucmVzb2x2ZShzb3VyY2VGaWxlRGlyUGF0aCwgdGVtcGxhdGVVcmwpO1xuXG4gICAgICAgIC8vIEluIGNhc2UgdGhlIHRlbXBsYXRlIGRvZXMgbm90IGV4aXN0IGluIHRoZSBmaWxlIHN5c3RlbSwgc2tpcCB0aGlzXG4gICAgICAgIC8vIGV4dGVybmFsIHRlbXBsYXRlLlxuICAgICAgICBpZiAoIXRoaXMuX2ZpbGVTeXN0ZW0uZmlsZUV4aXN0cyh0ZW1wbGF0ZVBhdGgpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZmlsZUNvbnRlbnQgPSBzdHJpcEJvbSh0aGlzLl9maWxlU3lzdGVtLnJlYWQodGVtcGxhdGVQYXRoKSB8fCAnJyk7XG5cbiAgICAgICAgaWYgKGZpbGVDb250ZW50KSB7XG4gICAgICAgICAgY29uc3QgbGluZVN0YXJ0c01hcCA9IGNvbXB1dGVMaW5lU3RhcnRzTWFwKGZpbGVDb250ZW50KTtcblxuICAgICAgICAgIHRoaXMucmVzb2x2ZWRUZW1wbGF0ZXMucHVzaCh7XG4gICAgICAgICAgICBmaWxlUGF0aDogdGVtcGxhdGVQYXRoLFxuICAgICAgICAgICAgY29udGFpbmVyOiBub2RlLFxuICAgICAgICAgICAgY29udGVudDogZmlsZUNvbnRlbnQsXG4gICAgICAgICAgICBpbmxpbmU6IGZhbHNlLFxuICAgICAgICAgICAgc3RhcnQ6IDAsXG4gICAgICAgICAgICBnZXRDaGFyYWN0ZXJBbmRMaW5lT2ZQb3NpdGlvbjogcCA9PiBnZXRMaW5lQW5kQ2hhcmFjdGVyRnJvbVBvc2l0aW9uKGxpbmVTdGFydHNNYXAsIHApLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKiogUmVzb2x2ZXMgYW4gZXh0ZXJuYWwgc3R5bGVzaGVldCBieSByZWFkaW5nIGl0cyBjb250ZW50IGFuZCBjb21wdXRpbmcgbGluZSBtYXBwaW5ncy4gKi9cbiAgcmVzb2x2ZUV4dGVybmFsU3R5bGVzaGVldChcbiAgICBmaWxlUGF0aDogV29ya3NwYWNlUGF0aCxcbiAgICBjb250YWluZXI6IHRzLkNsYXNzRGVjbGFyYXRpb24gfCBudWxsLFxuICApOiBSZXNvbHZlZFJlc291cmNlIHwgbnVsbCB7XG4gICAgLy8gU3RyaXAgdGhlIEJPTSB0byBhdm9pZCBpc3N1ZXMgd2l0aCB0aGUgU2FzcyBjb21waWxlci4gU2VlOlxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2NvbXBvbmVudHMvaXNzdWVzLzI0MjI3I2lzc3VlY29tbWVudC0xMjAwOTM0MjU4XG4gICAgY29uc3QgZmlsZUNvbnRlbnQgPSBzdHJpcEJvbSh0aGlzLl9maWxlU3lzdGVtLnJlYWQoZmlsZVBhdGgpIHx8ICcnKTtcblxuICAgIGlmICghZmlsZUNvbnRlbnQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGxpbmVTdGFydHNNYXAgPSBjb21wdXRlTGluZVN0YXJ0c01hcChmaWxlQ29udGVudCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgZmlsZVBhdGg6IGZpbGVQYXRoLFxuICAgICAgY29udGFpbmVyOiBjb250YWluZXIsXG4gICAgICBjb250ZW50OiBmaWxlQ29udGVudCxcbiAgICAgIGlubGluZTogZmFsc2UsXG4gICAgICBzdGFydDogMCxcbiAgICAgIGdldENoYXJhY3RlckFuZExpbmVPZlBvc2l0aW9uOiBwb3MgPT4gZ2V0TGluZUFuZENoYXJhY3RlckZyb21Qb3NpdGlvbihsaW5lU3RhcnRzTWFwLCBwb3MpLFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIF90cmFja0V4dGVybmFsU3R5bGVzaGVldChcbiAgICBzb3VyY2VGaWxlRGlyUGF0aDogc3RyaW5nLFxuICAgIG5vZGU6IHRzLlN0cmluZ0xpdGVyYWxMaWtlLFxuICAgIGNvbnRhaW5lcjogdHMuQ2xhc3NEZWNsYXJhdGlvbixcbiAgKSB7XG4gICAgY29uc3Qgc3R5bGVzaGVldFBhdGggPSB0aGlzLl9maWxlU3lzdGVtLnJlc29sdmUoc291cmNlRmlsZURpclBhdGgsIG5vZGUudGV4dCk7XG4gICAgY29uc3Qgc3R5bGVzaGVldCA9IHRoaXMucmVzb2x2ZUV4dGVybmFsU3R5bGVzaGVldChzdHlsZXNoZWV0UGF0aCwgY29udGFpbmVyKTtcblxuICAgIGlmIChzdHlsZXNoZWV0KSB7XG4gICAgICB0aGlzLnJlc29sdmVkU3R5bGVzaGVldHMucHVzaChzdHlsZXNoZWV0KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFN0cmlwcyB0aGUgQk9NIGZyb20gYSBzdHJpbmcuICovXG5mdW5jdGlvbiBzdHJpcEJvbShjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gY29udGVudC5yZXBsYWNlKC9cXHVGRUZGL2csICcnKTtcbn1cbiJdfQ==