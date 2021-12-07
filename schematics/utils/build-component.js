"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildComponent = void 0;
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const change_1 = require("@schematics/angular/utility/change");
const workspace_1 = require("@schematics/angular/utility/workspace");
const find_module_1 = require("@schematics/angular/utility/find-module");
const parse_name_1 = require("@schematics/angular/utility/parse-name");
const validation_1 = require("@schematics/angular/utility/validation");
const workspace_models_1 = require("@schematics/angular/utility/workspace-models");
const fs_1 = require("fs");
const path_1 = require("path");
const ts = require("typescript");
const vendored_ast_utils_1 = require("../utils/vendored-ast-utils");
const get_project_1 = require("./get-project");
const schematic_options_1 = require("./schematic-options");
/**
 * Build a default project path for generating.
 * @param project The project to build the path for.
 */
function buildDefaultPath(project) {
    const root = project.sourceRoot ? `/${project.sourceRoot}/` : `/${project.root}/src/`;
    const projectDirName = project.extensions.projectType === workspace_models_1.ProjectType.Application ? 'app' : 'lib';
    return `${root}${projectDirName}`;
}
/**
 * List of style extensions which are CSS compatible. All supported CLI style extensions can be
 * found here: angular/angular-cli/master/packages/schematics/angular/ng-new/schema.json#L118-L122
 */
const supportedCssExtensions = ['css', 'scss', 'less'];
function readIntoSourceFile(host, modulePath) {
    const text = host.read(modulePath);
    if (text === null) {
        throw new schematics_1.SchematicsException(`File ${modulePath} does not exist.`);
    }
    return ts.createSourceFile(modulePath, text.toString('utf-8'), ts.ScriptTarget.Latest, true);
}
function addDeclarationToNgModule(options) {
    return (host) => {
        if (options.skipImport || !options.module) {
            return host;
        }
        const modulePath = options.module;
        let source = readIntoSourceFile(host, modulePath);
        const componentPath = `/${options.path}/` +
            (options.flat ? '' : core_1.strings.dasherize(options.name) + '/') +
            core_1.strings.dasherize(options.name) +
            '.component';
        const relativePath = (0, find_module_1.buildRelativePath)(modulePath, componentPath);
        const classifiedName = core_1.strings.classify(`${options.name}Component`);
        const declarationChanges = (0, vendored_ast_utils_1.addDeclarationToModule)(source, modulePath, classifiedName, relativePath);
        const declarationRecorder = host.beginUpdate(modulePath);
        for (const change of declarationChanges) {
            if (change instanceof change_1.InsertChange) {
                declarationRecorder.insertLeft(change.pos, change.toAdd);
            }
        }
        host.commitUpdate(declarationRecorder);
        if (options.export) {
            // Need to refresh the AST because we overwrote the file in the host.
            source = readIntoSourceFile(host, modulePath);
            const exportRecorder = host.beginUpdate(modulePath);
            const exportChanges = (0, vendored_ast_utils_1.addExportToModule)(source, modulePath, core_1.strings.classify(`${options.name}Component`), relativePath);
            for (const change of exportChanges) {
                if (change instanceof change_1.InsertChange) {
                    exportRecorder.insertLeft(change.pos, change.toAdd);
                }
            }
            host.commitUpdate(exportRecorder);
        }
        return host;
    };
}
function buildSelector(options, projectPrefix) {
    let selector = core_1.strings.dasherize(options.name);
    if (options.prefix) {
        selector = `${options.prefix}-${selector}`;
    }
    else if (options.prefix === undefined && projectPrefix) {
        selector = `${projectPrefix}-${selector}`;
    }
    return selector;
}
/**
 * Indents the text content with the amount of specified spaces. The spaces will be added after
 * every line-break. This utility function can be used inside of EJS templates to properly
 * include the additional files.
 */
function indentTextContent(text, numSpaces) {
    // In the Material project there should be only LF line-endings, but the schematic files
    // are not being linted and therefore there can be also CRLF or just CR line-endings.
    return text.replace(/(\r\n|\r|\n)/g, `$1${' '.repeat(numSpaces)}`);
}
/**
 * Rule that copies and interpolates the files that belong to this schematic context. Additionally
 * a list of file paths can be passed to this rule in order to expose them inside the EJS
 * template context.
 *
 * This allows inlining the external template or stylesheet files in EJS without having
 * to manually duplicate the file content.
 */
function buildComponent(options, additionalFiles = {}) {
    return (host, ctx) => __awaiter(this, void 0, void 0, function* () {
        const context = ctx;
        const workspace = yield (0, workspace_1.getWorkspace)(host);
        const project = (0, get_project_1.getProjectFromWorkspace)(workspace, options.project);
        const defaultComponentOptions = (0, schematic_options_1.getDefaultComponentOptions)(project);
        // TODO(devversion): Remove if we drop support for older CLI versions.
        // This handles an unreported breaking change from the @angular-devkit/schematics. Previously
        // the description path resolved to the factory file, but starting from 6.2.0, it resolves
        // to the factory directory.
        const schematicPath = (0, fs_1.statSync)(context.schematic.description.path).isDirectory()
            ? context.schematic.description.path
            : (0, path_1.dirname)(context.schematic.description.path);
        const schematicFilesUrl = './files';
        const schematicFilesPath = (0, path_1.resolve)(schematicPath, schematicFilesUrl);
        // Add the default component option values to the options if an option is not explicitly
        // specified but a default component option is available.
        Object.keys(options)
            .filter(key => options[key] == null &&
            defaultComponentOptions[key])
            .forEach(key => (options[key] = defaultComponentOptions[key]));
        if (options.path === undefined) {
            // TODO(jelbourn): figure out if the need for this `as any` is a bug due to two different
            // incompatible `ProjectDefinition` classes in @angular-devkit
            options.path = buildDefaultPath(project);
        }
        options.module = (0, find_module_1.findModuleFromOptions)(host, options);
        const parsedPath = (0, parse_name_1.parseName)(options.path, options.name);
        options.name = parsedPath.name;
        options.path = parsedPath.path;
        options.selector = options.selector || buildSelector(options, project.prefix);
        (0, validation_1.validateHtmlSelector)(options.selector);
        // In case the specified style extension is not part of the supported CSS supersets,
        // we generate the stylesheets with the "css" extension. This ensures that we don't
        // accidentally generate invalid stylesheets (e.g. drag-drop-comp.styl) which will
        // break the Angular CLI project. See: https://github.com/angular/components/issues/15164
        if (!supportedCssExtensions.includes(options.style)) {
            // TODO: Cast is necessary as we can't use the Style enum which has been introduced
            // within CLI v7.3.0-rc.0. This would break the schematic for older CLI versions.
            options.style = 'css';
        }
        // Object that will be used as context for the EJS templates.
        const baseTemplateContext = Object.assign(Object.assign(Object.assign({}, core_1.strings), { 'if-flat': (s) => (options.flat ? '' : s) }), options);
        // Key-value object that includes the specified additional files with their loaded content.
        // The resolved contents can be used inside EJS templates.
        const resolvedFiles = {};
        for (let key in additionalFiles) {
            if (additionalFiles[key]) {
                const fileContent = (0, fs_1.readFileSync)((0, path_1.join)(schematicFilesPath, additionalFiles[key]), 'utf-8');
                // Interpolate the additional files with the base EJS template context.
                resolvedFiles[key] = (0, core_1.template)(fileContent)(baseTemplateContext);
            }
        }
        const templateSource = (0, schematics_1.apply)((0, schematics_1.url)(schematicFilesUrl), [
            options.skipTests ? (0, schematics_1.filter)(path => !path.endsWith('.spec.ts.template')) : (0, schematics_1.noop)(),
            options.inlineStyle ? (0, schematics_1.filter)(path => !path.endsWith('.__style__.template')) : (0, schematics_1.noop)(),
            options.inlineTemplate ? (0, schematics_1.filter)(path => !path.endsWith('.html.template')) : (0, schematics_1.noop)(),
            // Treat the template options as any, because the type definition for the template options
            // is made unnecessarily explicit. Every type of object can be used in the EJS template.
            (0, schematics_1.applyTemplates)(Object.assign({ indentTextContent, resolvedFiles }, baseTemplateContext)),
            // TODO(devversion): figure out why we cannot just remove the first parameter
            // See for example: angular-cli#schematics/angular/component/index.ts#L160
            (0, schematics_1.move)(null, parsedPath.path),
        ]);
        return () => (0, schematics_1.chain)([
            (0, schematics_1.branchAndMerge)((0, schematics_1.chain)([addDeclarationToNgModule(options), (0, schematics_1.mergeWith)(templateSource)])),
        ])(host, context);
    });
}
exports.buildComponent = buildComponent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQtY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL3V0aWxzL2J1aWxkLWNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7QUFFSCwrQ0FBOEU7QUFDOUUsMkRBYW9DO0FBR3BDLCtEQUFnRTtBQUNoRSxxRUFBbUU7QUFDbkUseUVBQWlHO0FBQ2pHLHVFQUFpRTtBQUNqRSx1RUFBNEU7QUFDNUUsbUZBQXlFO0FBQ3pFLDJCQUEwQztBQUMxQywrQkFBNEM7QUFDNUMsaUNBQWlDO0FBQ2pDLG9FQUFzRjtBQUN0RiwrQ0FBc0Q7QUFDdEQsMkRBQStEO0FBRy9EOzs7R0FHRztBQUNILFNBQVMsZ0JBQWdCLENBQUMsT0FBMEI7SUFDbEQsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksT0FBTyxDQUFDLElBQUksT0FBTyxDQUFDO0lBRXRGLE1BQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsV0FBVyxLQUFLLDhCQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztJQUVsRyxPQUFPLEdBQUcsSUFBSSxHQUFHLGNBQWMsRUFBRSxDQUFDO0FBQ3BDLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLHNCQUFzQixHQUFHLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztBQUV2RCxTQUFTLGtCQUFrQixDQUFDLElBQVUsRUFBRSxVQUFrQjtJQUN4RCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ25DLElBQUksSUFBSSxLQUFLLElBQUksRUFBRTtRQUNqQixN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QUMsQ0FBQyxDQUFDLENBQUMsSUFBQSxpQkFBSSxHQUFFO1lBQ2hGLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUEsbUJBQU0sRUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUEsaUJBQUksR0FBRTtZQUNwRixPQUFPLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxJQUFBLG1CQUFNLEVBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLGlCQUFJLEdBQUU7WUFDbEYsMEZBQTBGO1lBQzFGLHdGQUF3RjtZQUN4RixJQUFBLDJCQUFjLEVBQUMsZ0JBQUMsaUJBQWlCLEVBQUUsYUFBYSxJQUFLLG1CQUFtQixDQUFRLENBQUM7WUFDakYsNkVBQTZFO1lBQzdFLDBFQUEwRTtZQUMxRSxJQUFBLGlCQUFJLEVBQUMsSUFBVyxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUM7U0FDbkMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxHQUFHLEVBQUUsQ0FDVixJQUFBLGtCQUFLLEVBQUM7WUFDSixJQUFBLDJCQUFjLEVBQUMsSUFBQSxrQkFBSyxFQUFDLENBQUMsd0JBQXdCLENBQUMsT0FBTyxDQUFDLEVBQUUsSUFBQSxzQkFBUyxFQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN0RixDQUFDLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3RCLENBQUMsQ0FBQSxDQUFDO0FBQ0osQ0FBQztBQW5HRCx3Q0FtR0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtzdHJpbmdzLCB0ZW1wbGF0ZSBhcyBpbnRlcnBvbGF0ZVRlbXBsYXRlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQge1xuICBhcHBseSxcbiAgYXBwbHlUZW1wbGF0ZXMsXG4gIGJyYW5jaEFuZE1lcmdlLFxuICBjaGFpbixcbiAgZmlsdGVyLFxuICBtZXJnZVdpdGgsXG4gIG1vdmUsXG4gIG5vb3AsXG4gIFJ1bGUsXG4gIFNjaGVtYXRpY3NFeGNlcHRpb24sXG4gIFRyZWUsXG4gIHVybCxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MvdG9vbHMnO1xuaW1wb3J0IHtTY2hlbWEgYXMgQ29tcG9uZW50T3B0aW9ucywgU3R5bGV9IGZyb20gJ0BzY2hlbWF0aWNzL2FuZ3VsYXIvY29tcG9uZW50L3NjaGVtYSc7XG5pbXBvcnQge0luc2VydENoYW5nZX0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L2NoYW5nZSc7XG5pbXBvcnQge2dldFdvcmtzcGFjZX0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L3dvcmtzcGFjZSc7XG5pbXBvcnQge2J1aWxkUmVsYXRpdmVQYXRoLCBmaW5kTW9kdWxlRnJvbU9wdGlvbnN9IGZyb20gJ0BzY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eS9maW5kLW1vZHVsZSc7XG5pbXBvcnQge3BhcnNlTmFtZX0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L3BhcnNlLW5hbWUnO1xuaW1wb3J0IHt2YWxpZGF0ZUh0bWxTZWxlY3Rvcn0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L3ZhbGlkYXRpb24nO1xuaW1wb3J0IHtQcm9qZWN0VHlwZX0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L3dvcmtzcGFjZS1tb2RlbHMnO1xuaW1wb3J0IHtyZWFkRmlsZVN5bmMsIHN0YXRTeW5jfSBmcm9tICdmcyc7XG5pbXBvcnQge2Rpcm5hbWUsIGpvaW4sIHJlc29sdmV9IGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge2FkZERlY2xhcmF0aW9uVG9Nb2R1bGUsIGFkZEV4cG9ydFRvTW9kdWxlfSBmcm9tICcuLi91dGlscy92ZW5kb3JlZC1hc3QtdXRpbHMnO1xuaW1wb3J0IHtnZXRQcm9qZWN0RnJvbVdvcmtzcGFjZX0gZnJvbSAnLi9nZXQtcHJvamVjdCc7XG5pbXBvcnQge2dldERlZmF1bHRDb21wb25lbnRPcHRpb25zfSBmcm9tICcuL3NjaGVtYXRpYy1vcHRpb25zJztcbmltcG9ydCB7UHJvamVjdERlZmluaXRpb259IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlL3NyYy93b3Jrc3BhY2UnO1xuXG4vKipcbiAqIEJ1aWxkIGEgZGVmYXVsdCBwcm9qZWN0IHBhdGggZm9yIGdlbmVyYXRpbmcuXG4gKiBAcGFyYW0gcHJvamVjdCBUaGUgcHJvamVjdCB0byBidWlsZCB0aGUgcGF0aCBmb3IuXG4gKi9cbmZ1bmN0aW9uIGJ1aWxkRGVmYXVsdFBhdGgocHJvamVjdDogUHJvamVjdERlZmluaXRpb24pOiBzdHJpbmcge1xuICBjb25zdCByb290ID0gcHJvamVjdC5zb3VyY2VSb290ID8gYC8ke3Byb2plY3Quc291cmNlUm9vdH0vYCA6IGAvJHtwcm9qZWN0LnJvb3R9L3NyYy9gO1xuXG4gIGNvbnN0IHByb2plY3REaXJOYW1lID0gcHJvamVjdC5leHRlbnNpb25zLnByb2plY3RUeXBlID09PSBQcm9qZWN0VHlwZS5BcHBsaWNhdGlvbiA/ICdhcHAnIDogJ2xpYic7XG5cbiAgcmV0dXJuIGAke3Jvb3R9JHtwcm9qZWN0RGlyTmFtZX1gO1xufVxuXG4vKipcbiAqIExpc3Qgb2Ygc3R5bGUgZXh0ZW5zaW9ucyB3aGljaCBhcmUgQ1NTIGNvbXBhdGlibGUuIEFsbCBzdXBwb3J0ZWQgQ0xJIHN0eWxlIGV4dGVuc2lvbnMgY2FuIGJlXG4gKiBmb3VuZCBoZXJlOiBhbmd1bGFyL2FuZ3VsYXItY2xpL21hc3Rlci9wYWNrYWdlcy9zY2hlbWF0aWNzL2FuZ3VsYXIvbmctbmV3L3NjaGVtYS5qc29uI0wxMTgtTDEyMlxuICovXG5jb25zdCBzdXBwb3J0ZWRDc3NFeHRlbnNpb25zID0gWydjc3MnLCAnc2NzcycsICdsZXNzJ107XG5cbmZ1bmN0aW9uIHJlYWRJbnRvU291cmNlRmlsZShob3N0OiBUcmVlLCBtb2R1bGVQYXRoOiBzdHJpbmcpIHtcbiAgY29uc3QgdGV4dCA9IGhvc3QucmVhZChtb2R1bGVQYXRoKTtcbiAgaWYgKHRleHQgPT09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgRmlsZSAke21vZHVsZVBhdGh9IGRvZXMgbm90IGV4aXN0LmApO1xuICB9XG5cbiAgcmV0dXJuIHRzLmNyZWF0ZVNvdXJjZUZpbGUobW9kdWxlUGF0aCwgdGV4dC50b1N0cmluZygndXRmLTgnKSwgdHMuU2NyaXB0VGFyZ2V0LkxhdGVzdCwgdHJ1ZSk7XG59XG5cbmZ1bmN0aW9uIGFkZERlY2xhcmF0aW9uVG9OZ01vZHVsZShvcHRpb25zOiBDb21wb25lbnRPcHRpb25zKTogUnVsZSB7XG4gIHJldHVybiAoaG9zdDogVHJlZSkgPT4ge1xuICAgIGlmIChvcHRpb25zLnNraXBJbXBvcnQgfHwgIW9wdGlvbnMubW9kdWxlKSB7XG4gICAgICByZXR1cm4gaG9zdDtcbiAgICB9XG5cbiAgICBjb25zdCBtb2R1bGVQYXRoID0gb3B0aW9ucy5tb2R1bGU7XG4gICAgbGV0IHNvdXJjZSA9IHJlYWRJbnRvU291cmNlRmlsZShob3N0LCBtb2R1bGVQYXRoKTtcblxuICAgIGNvbnN0IGNvbXBvbmVudFBhdGggPVxuICAgICAgYC8ke29wdGlvbnMucGF0aH0vYCArXG4gICAgICAob3B0aW9ucy5mbGF0ID8gJycgOiBzdHJpbmdzLmRhc2hlcml6ZShvcHRpb25zLm5hbWUpICsgJy8nKSArXG4gICAgICBzdHJpbmdzLmRhc2hlcml6ZShvcHRpb25zLm5hbWUpICtcbiAgICAgICcuY29tcG9uZW50JztcbiAgICBjb25zdCByZWxhdGl2ZVBhdGggPSBidWlsZFJlbGF0aXZlUGF0aChtb2R1bGVQYXRoLCBjb21wb25lbnRQYXRoKTtcbiAgICBjb25zdCBjbGFzc2lmaWVkTmFtZSA9IHN0cmluZ3MuY2xhc3NpZnkoYCR7b3B0aW9ucy5uYW1lfUNvbXBvbmVudGApO1xuXG4gICAgY29uc3QgZGVjbGFyYXRpb25DaGFuZ2VzID0gYWRkRGVjbGFyYXRpb25Ub01vZHVsZShcbiAgICAgIHNvdXJjZSxcbiAgICAgIG1vZHVsZVBhdGgsXG4gICAgICBjbGFzc2lmaWVkTmFtZSxcbiAgICAgIHJlbGF0aXZlUGF0aCxcbiAgICApO1xuXG4gICAgY29uc3QgZGVjbGFyYXRpb25SZWNvcmRlciA9IGhvc3QuYmVnaW5VcGRhdGUobW9kdWxlUGF0aCk7XG4gICAgZm9yIChjb25zdCBjaGFuZ2Ugb2YgZGVjbGFyYXRpb25DaGFuZ2VzKSB7XG4gICAgICBpZiAoY2hhbmdlIGluc3RhbmNlb2YgSW5zZXJ0Q2hhbmdlKSB7XG4gICAgICAgIGRlY2xhcmF0aW9uUmVjb3JkZXIuaW5zZXJ0TGVmdChjaGFuZ2UucG9zLCBjaGFuZ2UudG9BZGQpO1xuICAgICAgfVxuICAgIH1cbiAgICBob3N0LmNvbW1pdFVwZGF0ZShkZWNsYXJhdGlvblJlY29yZGVyKTtcblxuICAgIGlmIChvcHRpb25zLmV4cG9ydCkge1xuICAgICAgLy8gTmVlZCB0byByZWZyZXNoIHRoZSBBU1QgYmVjYXVzZSB3ZSBvdmVyd3JvdGUgdGhlIGZpbGUgaW4gdGhlIGhvc3QuXG4gICAgICBzb3VyY2UgPSByZWFkSW50b1NvdXJjZUZpbGUoaG9zdCwgbW9kdWxlUGF0aCk7XG5cbiAgICAgIGNvbnN0IGV4cG9ydFJlY29yZGVyID0gaG9zdC5iZWdpblVwZGF0ZShtb2R1bGVQYXRoKTtcbiAgICAgIGNvbnN0IGV4cG9ydENoYW5nZXMgPSBhZGRFeHBvcnRUb01vZHVsZShcbiAgICAgICAgc291cmNlLFxuICAgICAgICBtb2R1bGVQYXRoLFxuICAgICAgICBzdHJpbmdzLmNsYXNzaWZ5KGAke29wdGlvbnMubmFtZX1Db21wb25lbnRgKSxcbiAgICAgICAgcmVsYXRpdmVQYXRoLFxuICAgICAgKTtcblxuICAgICAgZm9yIChjb25zdCBjaGFuZ2Ugb2YgZXhwb3J0Q2hhbmdlcykge1xuICAgICAgICBpZiAoY2hhbmdlIGluc3RhbmNlb2YgSW5zZXJ0Q2hhbmdlKSB7XG4gICAgICAgICAgZXhwb3J0UmVjb3JkZXIuaW5zZXJ0TGVmdChjaGFuZ2UucG9zLCBjaGFuZ2UudG9BZGQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBob3N0LmNvbW1pdFVwZGF0ZShleHBvcnRSZWNvcmRlcik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGhvc3Q7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGJ1aWxkU2VsZWN0b3Iob3B0aW9uczogQ29tcG9uZW50T3B0aW9ucywgcHJvamVjdFByZWZpeD86IHN0cmluZykge1xuICBsZXQgc2VsZWN0b3IgPSBzdHJpbmdzLmRhc2hlcml6ZShvcHRpb25zLm5hbWUpO1xuICBpZiAob3B0aW9ucy5wcmVmaXgpIHtcbiAgICBzZWxlY3RvciA9IGAke29wdGlvbnMucHJlZml4fS0ke3NlbGVjdG9yfWA7XG4gIH0gZWxzZSBpZiAob3B0aW9ucy5wcmVmaXggPT09IHVuZGVmaW5lZCAmJiBwcm9qZWN0UHJlZml4KSB7XG4gICAgc2VsZWN0b3IgPSBgJHtwcm9qZWN0UHJlZml4fS0ke3NlbGVjdG9yfWA7XG4gIH1cblxuICByZXR1cm4gc2VsZWN0b3I7XG59XG5cbi8qKlxuICogSW5kZW50cyB0aGUgdGV4dCBjb250ZW50IHdpdGggdGhlIGFtb3VudCBvZiBzcGVjaWZpZWQgc3BhY2VzLiBUaGUgc3BhY2VzIHdpbGwgYmUgYWRkZWQgYWZ0ZXJcbiAqIGV2ZXJ5IGxpbmUtYnJlYWsuIFRoaXMgdXRpbGl0eSBmdW5jdGlvbiBjYW4gYmUgdXNlZCBpbnNpZGUgb2YgRUpTIHRlbXBsYXRlcyB0byBwcm9wZXJseVxuICogaW5jbHVkZSB0aGUgYWRkaXRpb25hbCBmaWxlcy5cbiAqL1xuZnVuY3Rpb24gaW5kZW50VGV4dENvbnRlbnQodGV4dDogc3RyaW5nLCBudW1TcGFjZXM6IG51bWJlcik6IHN0cmluZyB7XG4gIC8vIEluIHRoZSBNYXRlcmlhbCBwcm9qZWN0IHRoZXJlIHNob3VsZCBiZSBvbmx5IExGIGxpbmUtZW5kaW5ncywgYnV0IHRoZSBzY2hlbWF0aWMgZmlsZXNcbiAgLy8gYXJlIG5vdCBiZWluZyBsaW50ZWQgYW5kIHRoZXJlZm9yZSB0aGVyZSBjYW4gYmUgYWxzbyBDUkxGIG9yIGp1c3QgQ1IgbGluZS1lbmRpbmdzLlxuICByZXR1cm4gdGV4dC5yZXBsYWNlKC8oXFxyXFxufFxccnxcXG4pL2csIGAkMSR7JyAnLnJlcGVhdChudW1TcGFjZXMpfWApO1xufVxuXG4vKipcbiAqIFJ1bGUgdGhhdCBjb3BpZXMgYW5kIGludGVycG9sYXRlcyB0aGUgZmlsZXMgdGhhdCBiZWxvbmcgdG8gdGhpcyBzY2hlbWF0aWMgY29udGV4dC4gQWRkaXRpb25hbGx5XG4gKiBhIGxpc3Qgb2YgZmlsZSBwYXRocyBjYW4gYmUgcGFzc2VkIHRvIHRoaXMgcnVsZSBpbiBvcmRlciB0byBleHBvc2UgdGhlbSBpbnNpZGUgdGhlIEVKU1xuICogdGVtcGxhdGUgY29udGV4dC5cbiAqXG4gKiBUaGlzIGFsbG93cyBpbmxpbmluZyB0aGUgZXh0ZXJuYWwgdGVtcGxhdGUgb3Igc3R5bGVzaGVldCBmaWxlcyBpbiBFSlMgd2l0aG91dCBoYXZpbmdcbiAqIHRvIG1hbnVhbGx5IGR1cGxpY2F0ZSB0aGUgZmlsZSBjb250ZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRDb21wb25lbnQoXG4gIG9wdGlvbnM6IENvbXBvbmVudE9wdGlvbnMsXG4gIGFkZGl0aW9uYWxGaWxlczoge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSB7fSxcbik6IFJ1bGUge1xuICByZXR1cm4gYXN5bmMgKGhvc3QsIGN0eCkgPT4ge1xuICAgIGNvbnN0IGNvbnRleHQgPSBjdHggYXMgRmlsZVN5c3RlbVNjaGVtYXRpY0NvbnRleHQ7XG4gICAgY29uc3Qgd29ya3NwYWNlID0gYXdhaXQgZ2V0V29ya3NwYWNlKGhvc3QpO1xuICAgIGNvbnN0IHByb2plY3QgPSBnZXRQcm9qZWN0RnJvbVdvcmtzcGFjZSh3b3Jrc3BhY2UsIG9wdGlvbnMucHJvamVjdCk7XG4gICAgY29uc3QgZGVmYXVsdENvbXBvbmVudE9wdGlvbnMgPSBnZXREZWZhdWx0Q29tcG9uZW50T3B0aW9ucyhwcm9qZWN0KTtcblxuICAgIC8vIFRPRE8oZGV2dmVyc2lvbik6IFJlbW92ZSBpZiB3ZSBkcm9wIHN1cHBvcnQgZm9yIG9sZGVyIENMSSB2ZXJzaW9ucy5cbiAgICAvLyBUaGlzIGhhbmRsZXMgYW4gdW5yZXBvcnRlZCBicmVha2luZyBjaGFuZ2UgZnJvbSB0aGUgQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MuIFByZXZpb3VzbHlcbiAgICAvLyB0aGUgZGVzY3JpcHRpb24gcGF0aCByZXNvbHZlZCB0byB0aGUgZmFjdG9yeSBmaWxlLCBidXQgc3RhcnRpbmcgZnJvbSA2LjIuMCwgaXQgcmVzb2x2ZXNcbiAgICAvLyB0byB0aGUgZmFjdG9yeSBkaXJlY3RvcnkuXG4gICAgY29uc3Qgc2NoZW1hdGljUGF0aCA9IHN0YXRTeW5jKGNvbnRleHQuc2NoZW1hdGljLmRlc2NyaXB0aW9uLnBhdGgpLmlzRGlyZWN0b3J5KClcbiAgICAgID8gY29udGV4dC5zY2hlbWF0aWMuZGVzY3JpcHRpb24ucGF0aFxuICAgICAgOiBkaXJuYW1lKGNvbnRleHQuc2NoZW1hdGljLmRlc2NyaXB0aW9uLnBhdGgpO1xuXG4gICAgY29uc3Qgc2NoZW1hdGljRmlsZXNVcmwgPSAnLi9maWxlcyc7XG4gICAgY29uc3Qgc2NoZW1hdGljRmlsZXNQYXRoID0gcmVzb2x2ZShzY2hlbWF0aWNQYXRoLCBzY2hlbWF0aWNGaWxlc1VybCk7XG5cbiAgICAvLyBBZGQgdGhlIGRlZmF1bHQgY29tcG9uZW50IG9wdGlvbiB2YWx1ZXMgdG8gdGhlIG9wdGlvbnMgaWYgYW4gb3B0aW9uIGlzIG5vdCBleHBsaWNpdGx5XG4gICAgLy8gc3BlY2lmaWVkIGJ1dCBhIGRlZmF1bHQgY29tcG9uZW50IG9wdGlvbiBpcyBhdmFpbGFibGUuXG4gICAgT2JqZWN0LmtleXMob3B0aW9ucylcbiAgICAgIC5maWx0ZXIoXG4gICAgICAgIGtleSA9PlxuICAgICAgICAgIG9wdGlvbnNba2V5IGFzIGtleW9mIENvbXBvbmVudE9wdGlvbnNdID09IG51bGwgJiZcbiAgICAgICAgICBkZWZhdWx0Q29tcG9uZW50T3B0aW9uc1trZXkgYXMga2V5b2YgQ29tcG9uZW50T3B0aW9uc10sXG4gICAgICApXG4gICAgICAuZm9yRWFjaChcbiAgICAgICAga2V5ID0+XG4gICAgICAgICAgKChvcHRpb25zIGFzIGFueSlba2V5XSA9IChkZWZhdWx0Q29tcG9uZW50T3B0aW9ucyBhcyBDb21wb25lbnRPcHRpb25zKVtcbiAgICAgICAgICAgIGtleSBhcyBrZXlvZiBDb21wb25lbnRPcHRpb25zXG4gICAgICAgICAgXSksXG4gICAgICApO1xuXG4gICAgaWYgKG9wdGlvbnMucGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBUT0RPKGplbGJvdXJuKTogZmlndXJlIG91dCBpZiB0aGUgbmVlZCBmb3IgdGhpcyBgYXMgYW55YCBpcyBhIGJ1ZyBkdWUgdG8gdHdvIGRpZmZlcmVudFxuICAgICAgLy8gaW5jb21wYXRpYmxlIGBQcm9qZWN0RGVmaW5pdGlvbmAgY2xhc3NlcyBpbiBAYW5ndWxhci1kZXZraXRcbiAgICAgIG9wdGlvbnMucGF0aCA9IGJ1aWxkRGVmYXVsdFBhdGgocHJvamVjdCBhcyBhbnkpO1xuICAgIH1cblxuICAgIG9wdGlvbnMubW9kdWxlID0gZmluZE1vZHVsZUZyb21PcHRpb25zKGhvc3QsIG9wdGlvbnMpO1xuXG4gICAgY29uc3QgcGFyc2VkUGF0aCA9IHBhcnNlTmFtZShvcHRpb25zLnBhdGghLCBvcHRpb25zLm5hbWUpO1xuXG4gICAgb3B0aW9ucy5uYW1lID0gcGFyc2VkUGF0aC5uYW1lO1xuICAgIG9wdGlvbnMucGF0aCA9IHBhcnNlZFBhdGgucGF0aDtcbiAgICBvcHRpb25zLnNlbGVjdG9yID0gb3B0aW9ucy5zZWxlY3RvciB8fCBidWlsZFNlbGVjdG9yKG9wdGlvbnMsIHByb2plY3QucHJlZml4KTtcblxuICAgIHZhbGlkYXRlSHRtbFNlbGVjdG9yKG9wdGlvbnMuc2VsZWN0b3IhKTtcblxuICAgIC8vIEluIGNhc2UgdGhlIHNwZWNpZmllZCBzdHlsZSBleHRlbnNpb24gaXMgbm90IHBhcnQgb2YgdGhlIHN1cHBvcnRlZCBDU1Mgc3VwZXJzZXRzLFxuICAgIC8vIHdlIGdlbmVyYXRlIHRoZSBzdHlsZXNoZWV0cyB3aXRoIHRoZSBcImNzc1wiIGV4dGVuc2lvbi4gVGhpcyBlbnN1cmVzIHRoYXQgd2UgZG9uJ3RcbiAgICAvLyBhY2NpZGVudGFsbHkgZ2VuZXJhdGUgaW52YWxpZCBzdHlsZXNoZWV0cyAoZS5nLiBkcmFnLWRyb3AtY29tcC5zdHlsKSB3aGljaCB3aWxsXG4gICAgLy8gYnJlYWsgdGhlIEFuZ3VsYXIgQ0xJIHByb2plY3QuIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvY29tcG9uZW50cy9pc3N1ZXMvMTUxNjRcbiAgICBpZiAoIXN1cHBvcnRlZENzc0V4dGVuc2lvbnMuaW5jbHVkZXMob3B0aW9ucy5zdHlsZSEpKSB7XG4gICAgICAvLyBUT0RPOiBDYXN0IGlzIG5lY2Vzc2FyeSBhcyB3ZSBjYW4ndCB1c2UgdGhlIFN0eWxlIGVudW0gd2hpY2ggaGFzIGJlZW4gaW50cm9kdWNlZFxuICAgICAgLy8gd2l0aGluIENMSSB2Ny4zLjAtcmMuMC4gVGhpcyB3b3VsZCBicmVhayB0aGUgc2NoZW1hdGljIGZvciBvbGRlciBDTEkgdmVyc2lvbnMuXG4gICAgICBvcHRpb25zLnN0eWxlID0gJ2NzcycgYXMgU3R5bGU7XG4gICAgfVxuXG4gICAgLy8gT2JqZWN0IHRoYXQgd2lsbCBiZSB1c2VkIGFzIGNvbnRleHQgZm9yIHRoZSBFSlMgdGVtcGxhdGVzLlxuICAgIGNvbnN0IGJhc2VUZW1wbGF0ZUNvbnRleHQgPSB7XG4gICAgICAuLi5zdHJpbmdzLFxuICAgICAgJ2lmLWZsYXQnOiAoczogc3RyaW5nKSA9PiAob3B0aW9ucy5mbGF0ID8gJycgOiBzKSxcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgfTtcblxuICAgIC8vIEtleS12YWx1ZSBvYmplY3QgdGhhdCBpbmNsdWRlcyB0aGUgc3BlY2lmaWVkIGFkZGl0aW9uYWwgZmlsZXMgd2l0aCB0aGVpciBsb2FkZWQgY29udGVudC5cbiAgICAvLyBUaGUgcmVzb2x2ZWQgY29udGVudHMgY2FuIGJlIHVzZWQgaW5zaWRlIEVKUyB0ZW1wbGF0ZXMuXG4gICAgY29uc3QgcmVzb2x2ZWRGaWxlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuXG4gICAgZm9yIChsZXQga2V5IGluIGFkZGl0aW9uYWxGaWxlcykge1xuICAgICAgaWYgKGFkZGl0aW9uYWxGaWxlc1trZXldKSB7XG4gICAgICAgIGNvbnN0IGZpbGVDb250ZW50ID0gcmVhZEZpbGVTeW5jKGpvaW4oc2NoZW1hdGljRmlsZXNQYXRoLCBhZGRpdGlvbmFsRmlsZXNba2V5XSksICd1dGYtOCcpO1xuXG4gICAgICAgIC8vIEludGVycG9sYXRlIHRoZSBhZGRpdGlvbmFsIGZpbGVzIHdpdGggdGhlIGJhc2UgRUpTIHRlbXBsYXRlIGNvbnRleHQuXG4gICAgICAgIHJlc29sdmVkRmlsZXNba2V5XSA9IGludGVycG9sYXRlVGVtcGxhdGUoZmlsZUNvbnRlbnQpKGJhc2VUZW1wbGF0ZUNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHRlbXBsYXRlU291cmNlID0gYXBwbHkodXJsKHNjaGVtYXRpY0ZpbGVzVXJsKSwgW1xuICAgICAgb3B0aW9ucy5za2lwVGVzdHMgPyBmaWx0ZXIocGF0aCA9PiAhcGF0aC5lbmRzV2l0aCgnLnNwZWMudHMudGVtcGxhdGUnKSkgOiBub29wKCksXG4gICAgICBvcHRpb25zLmlubGluZVN0eWxlID8gZmlsdGVyKHBhdGggPT4gIXBhdGguZW5kc1dpdGgoJy5fX3N0eWxlX18udGVtcGxhdGUnKSkgOiBub29wKCksXG4gICAgICBvcHRpb25zLmlubGluZVRlbXBsYXRlID8gZmlsdGVyKHBhdGggPT4gIXBhdGguZW5kc1dpdGgoJy5odG1sLnRlbXBsYXRlJykpIDogbm9vcCgpLFxuICAgICAgLy8gVHJlYXQgdGhlIHRlbXBsYXRlIG9wdGlvbnMgYXMgYW55LCBiZWNhdXNlIHRoZSB0eXBlIGRlZmluaXRpb24gZm9yIHRoZSB0ZW1wbGF0ZSBvcHRpb25zXG4gICAgICAvLyBpcyBtYWRlIHVubmVjZXNzYXJpbHkgZXhwbGljaXQuIEV2ZXJ5IHR5cGUgb2Ygb2JqZWN0IGNhbiBiZSB1c2VkIGluIHRoZSBFSlMgdGVtcGxhdGUuXG4gICAgICBhcHBseVRlbXBsYXRlcyh7aW5kZW50VGV4dENvbnRlbnQsIHJlc29sdmVkRmlsZXMsIC4uLmJhc2VUZW1wbGF0ZUNvbnRleHR9IGFzIGFueSksXG4gICAgICAvLyBUT0RPKGRldnZlcnNpb24pOiBmaWd1cmUgb3V0IHdoeSB3ZSBjYW5ub3QganVzdCByZW1vdmUgdGhlIGZpcnN0IHBhcmFtZXRlclxuICAgICAgLy8gU2VlIGZvciBleGFtcGxlOiBhbmd1bGFyLWNsaSNzY2hlbWF0aWNzL2FuZ3VsYXIvY29tcG9uZW50L2luZGV4LnRzI0wxNjBcbiAgICAgIG1vdmUobnVsbCBhcyBhbnksIHBhcnNlZFBhdGgucGF0aCksXG4gICAgXSk7XG5cbiAgICByZXR1cm4gKCkgPT5cbiAgICAgIGNoYWluKFtcbiAgICAgICAgYnJhbmNoQW5kTWVyZ2UoY2hhaW4oW2FkZERlY2xhcmF0aW9uVG9OZ01vZHVsZShvcHRpb25zKSwgbWVyZ2VXaXRoKHRlbXBsYXRlU291cmNlKV0pKSxcbiAgICAgIF0pKGhvc3QsIGNvbnRleHQpO1xuICB9O1xufVxuIl19