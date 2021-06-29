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
    const root = project.sourceRoot
        ? `/${project.sourceRoot}/`
        : `/${project.root}/src/`;
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
        const componentPath = `/${options.path}/`
            + (options.flat ? '' : core_1.strings.dasherize(options.name) + '/')
            + core_1.strings.dasherize(options.name)
            + '.component';
        const relativePath = find_module_1.buildRelativePath(modulePath, componentPath);
        const classifiedName = core_1.strings.classify(`${options.name}Component`);
        const declarationChanges = vendored_ast_utils_1.addDeclarationToModule(source, modulePath, classifiedName, relativePath);
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
            const exportChanges = vendored_ast_utils_1.addExportToModule(source, modulePath, core_1.strings.classify(`${options.name}Component`), relativePath);
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
    return (host, context) => __awaiter(this, void 0, void 0, function* () {
        const workspace = yield workspace_1.getWorkspace(host);
        const project = get_project_1.getProjectFromWorkspace(workspace, options.project);
        const defaultComponentOptions = schematic_options_1.getDefaultComponentOptions(project);
        // TODO(devversion): Remove if we drop support for older CLI versions.
        // This handles an unreported breaking change from the @angular-devkit/schematics. Previously
        // the description path resolved to the factory file, but starting from 6.2.0, it resolves
        // to the factory directory.
        const schematicPath = fs_1.statSync(context.schematic.description.path).isDirectory() ?
            context.schematic.description.path :
            path_1.dirname(context.schematic.description.path);
        const schematicFilesUrl = './files';
        const schematicFilesPath = path_1.resolve(schematicPath, schematicFilesUrl);
        // Add the default component option values to the options if an option is not explicitly
        // specified but a default component option is available.
        Object.keys(options)
            .filter((optionName) => {
            return options[optionName] == null && defaultComponentOptions[optionName];
        })
            .forEach((optionName) => {
            options[optionName] = defaultComponentOptions[optionName];
        });
        if (options.path === undefined) {
            // TODO(jelbourn): figure out if the need for this `as any` is a bug due to two different
            // incompatible `ProjectDefinition` classes in @angular-devkit
            options.path = buildDefaultPath(project);
        }
        options.module = find_module_1.findModuleFromOptions(host, options);
        const parsedPath = parse_name_1.parseName(options.path, options.name);
        options.name = parsedPath.name;
        options.path = parsedPath.path;
        options.selector = options.selector || buildSelector(options, project.prefix);
        validation_1.validateName(options.name);
        validation_1.validateHtmlSelector(options.selector);
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
        const baseTemplateContext = Object.assign(Object.assign(Object.assign({}, core_1.strings), { 'if-flat': (s) => options.flat ? '' : s }), options);
        // Key-value object that includes the specified additional files with their loaded content.
        // The resolved contents can be used inside EJS templates.
        const resolvedFiles = {};
        for (let key in additionalFiles) {
            if (additionalFiles[key]) {
                const fileContent = fs_1.readFileSync(path_1.join(schematicFilesPath, additionalFiles[key]), 'utf-8');
                // Interpolate the additional files with the base EJS template context.
                resolvedFiles[key] = core_1.template(fileContent)(baseTemplateContext);
            }
        }
        const templateSource = schematics_1.apply(schematics_1.url(schematicFilesUrl), [
            options.skipTests ? schematics_1.filter(path => !path.endsWith('.spec.ts.template')) : schematics_1.noop(),
            options.inlineStyle ? schematics_1.filter(path => !path.endsWith('.__style__.template')) : schematics_1.noop(),
            options.inlineTemplate ? schematics_1.filter(path => !path.endsWith('.html.template')) : schematics_1.noop(),
            // Treat the template options as any, because the type definition for the template options
            // is made unnecessarily explicit. Every type of object can be used in the EJS template.
            schematics_1.applyTemplates(Object.assign({ indentTextContent, resolvedFiles }, baseTemplateContext)),
            // TODO(devversion): figure out why we cannot just remove the first parameter
            // See for example: angular-cli#schematics/angular/component/index.ts#L160
            schematics_1.move(null, parsedPath.path),
        ]);
        return () => schematics_1.chain([
            schematics_1.branchAndMerge(schematics_1.chain([
                addDeclarationToNgModule(options),
                schematics_1.mergeWith(templateSource),
            ])),
        ])(host, context);
    });
}
exports.buildComponent = buildComponent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQtY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL3V0aWxzL2J1aWxkLWNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7QUFFSCwrQ0FBOEU7QUFDOUUsMkRBYW9DO0FBR3BDLCtEQUFnRTtBQUNoRSxxRUFBbUU7QUFDbkUseUVBQWlHO0FBQ2pHLHVFQUFpRTtBQUNqRSx1RUFBMEY7QUFDMUYsbUZBQXlFO0FBQ3pFLDJCQUEwQztBQUMxQywrQkFBNEM7QUFDNUMsaUNBQWlDO0FBQ2pDLG9FQUdxQztBQUNyQywrQ0FBc0Q7QUFDdEQsMkRBQStEO0FBRy9EOzs7R0FHRztBQUNILFNBQVMsZ0JBQWdCLENBQUMsT0FBMEI7SUFDbEQsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFVBQVU7UUFDN0IsQ0FBQyxDQUFDLElBQUksT0FBTyxDQUFDLFVBQVUsR0FBRztRQUMzQixDQUFDLENBQUMsSUFBSSxPQUFPLENBQUMsSUFBSSxPQUFPLENBQUM7SUFFNUIsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxXQUFXLEtBQUssOEJBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0lBRWxHLE9BQU8sR0FBRyxJQUFJLEdBQUcsY0FBYyxFQUFFLENBQUM7QUFDcEMsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sc0JBQXNCLEdBQUcsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBRXZELFNBQVMsa0JBQWtCLENBQUMsSUFBVSxFQUFFLFVBQWtCO0lBQ3hELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDbkMsSUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFO1FBQ2pC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QUMsQ0FBQyxDQUFDLG1CQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBSSxFQUFFO1lBQ3BGLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLG1CQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBSSxFQUFFO1lBQ2xGLDBGQUEwRjtZQUMxRix3RkFBd0Y7WUFDeEYsMkJBQWMsQ0FBQyxnQkFBQyxpQkFBaUIsRUFBRSxhQUFhLElBQUssbUJBQW1CLENBQVEsQ0FBQztZQUNqRiw2RUFBNkU7WUFDN0UsMEVBQTBFO1lBQzFFLGlCQUFJLENBQUMsSUFBVyxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUM7U0FDbkMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxHQUFHLEVBQUUsQ0FBQyxrQkFBSyxDQUFDO1lBQ2pCLDJCQUFjLENBQUMsa0JBQUssQ0FBQztnQkFDbkIsd0JBQXdCLENBQUMsT0FBTyxDQUFDO2dCQUNqQyxzQkFBUyxDQUFDLGNBQWMsQ0FBQzthQUMxQixDQUFDLENBQUM7U0FDSixDQUFDLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3BCLENBQUMsQ0FBQSxDQUFDO0FBQ0osQ0FBQztBQS9GRCx3Q0ErRkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtzdHJpbmdzLCB0ZW1wbGF0ZSBhcyBpbnRlcnBvbGF0ZVRlbXBsYXRlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQge1xuICBhcHBseSxcbiAgYXBwbHlUZW1wbGF0ZXMsXG4gIGJyYW5jaEFuZE1lcmdlLFxuICBjaGFpbixcbiAgZmlsdGVyLFxuICBtZXJnZVdpdGgsXG4gIG1vdmUsXG4gIG5vb3AsXG4gIFJ1bGUsXG4gIFNjaGVtYXRpY3NFeGNlcHRpb24sXG4gIFRyZWUsXG4gIHVybCxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MvdG9vbHMnO1xuaW1wb3J0IHtTY2hlbWEgYXMgQ29tcG9uZW50T3B0aW9ucywgU3R5bGV9IGZyb20gJ0BzY2hlbWF0aWNzL2FuZ3VsYXIvY29tcG9uZW50L3NjaGVtYSc7XG5pbXBvcnQge0luc2VydENoYW5nZX0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L2NoYW5nZSc7XG5pbXBvcnQge2dldFdvcmtzcGFjZX0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L3dvcmtzcGFjZSc7XG5pbXBvcnQge2J1aWxkUmVsYXRpdmVQYXRoLCBmaW5kTW9kdWxlRnJvbU9wdGlvbnN9IGZyb20gJ0BzY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eS9maW5kLW1vZHVsZSc7XG5pbXBvcnQge3BhcnNlTmFtZX0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L3BhcnNlLW5hbWUnO1xuaW1wb3J0IHt2YWxpZGF0ZUh0bWxTZWxlY3RvciwgdmFsaWRhdGVOYW1lfSBmcm9tICdAc2NoZW1hdGljcy9hbmd1bGFyL3V0aWxpdHkvdmFsaWRhdGlvbic7XG5pbXBvcnQge1Byb2plY3RUeXBlfSBmcm9tICdAc2NoZW1hdGljcy9hbmd1bGFyL3V0aWxpdHkvd29ya3NwYWNlLW1vZGVscyc7XG5pbXBvcnQge3JlYWRGaWxlU3luYywgc3RhdFN5bmN9IGZyb20gJ2ZzJztcbmltcG9ydCB7ZGlybmFtZSwgam9pbiwgcmVzb2x2ZX0gZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7XG4gIGFkZERlY2xhcmF0aW9uVG9Nb2R1bGUsXG4gIGFkZEV4cG9ydFRvTW9kdWxlLFxufSBmcm9tICcuLi91dGlscy92ZW5kb3JlZC1hc3QtdXRpbHMnO1xuaW1wb3J0IHtnZXRQcm9qZWN0RnJvbVdvcmtzcGFjZX0gZnJvbSAnLi9nZXQtcHJvamVjdCc7XG5pbXBvcnQge2dldERlZmF1bHRDb21wb25lbnRPcHRpb25zfSBmcm9tICcuL3NjaGVtYXRpYy1vcHRpb25zJztcbmltcG9ydCB7UHJvamVjdERlZmluaXRpb259IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlL3NyYy93b3Jrc3BhY2UnO1xuXG4vKipcbiAqIEJ1aWxkIGEgZGVmYXVsdCBwcm9qZWN0IHBhdGggZm9yIGdlbmVyYXRpbmcuXG4gKiBAcGFyYW0gcHJvamVjdCBUaGUgcHJvamVjdCB0byBidWlsZCB0aGUgcGF0aCBmb3IuXG4gKi9cbmZ1bmN0aW9uIGJ1aWxkRGVmYXVsdFBhdGgocHJvamVjdDogUHJvamVjdERlZmluaXRpb24pOiBzdHJpbmcge1xuICBjb25zdCByb290ID0gcHJvamVjdC5zb3VyY2VSb290XG4gICAgPyBgLyR7cHJvamVjdC5zb3VyY2VSb290fS9gXG4gICAgOiBgLyR7cHJvamVjdC5yb290fS9zcmMvYDtcblxuICBjb25zdCBwcm9qZWN0RGlyTmFtZSA9IHByb2plY3QuZXh0ZW5zaW9ucy5wcm9qZWN0VHlwZSA9PT0gUHJvamVjdFR5cGUuQXBwbGljYXRpb24gPyAnYXBwJyA6ICdsaWInO1xuXG4gIHJldHVybiBgJHtyb290fSR7cHJvamVjdERpck5hbWV9YDtcbn1cblxuLyoqXG4gKiBMaXN0IG9mIHN0eWxlIGV4dGVuc2lvbnMgd2hpY2ggYXJlIENTUyBjb21wYXRpYmxlLiBBbGwgc3VwcG9ydGVkIENMSSBzdHlsZSBleHRlbnNpb25zIGNhbiBiZVxuICogZm91bmQgaGVyZTogYW5ndWxhci9hbmd1bGFyLWNsaS9tYXN0ZXIvcGFja2FnZXMvc2NoZW1hdGljcy9hbmd1bGFyL25nLW5ldy9zY2hlbWEuanNvbiNMMTE4LUwxMjJcbiAqL1xuY29uc3Qgc3VwcG9ydGVkQ3NzRXh0ZW5zaW9ucyA9IFsnY3NzJywgJ3Njc3MnLCAnbGVzcyddO1xuXG5mdW5jdGlvbiByZWFkSW50b1NvdXJjZUZpbGUoaG9zdDogVHJlZSwgbW9kdWxlUGF0aDogc3RyaW5nKSB7XG4gIGNvbnN0IHRleHQgPSBob3N0LnJlYWQobW9kdWxlUGF0aCk7XG4gIGlmICh0ZXh0ID09PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYEZpbGUgJHttb2R1bGVQYXRofSBkb2VzIG5vdCBleGlzdC5gKTtcbiAgfVxuXG4gIHJldHVybiB0cy5jcmVhdGVTb3VyY2VGaWxlKG1vZHVsZVBhdGgsIHRleHQudG9TdHJpbmcoJ3V0Zi04JyksIHRzLlNjcmlwdFRhcmdldC5MYXRlc3QsIHRydWUpO1xufVxuXG5mdW5jdGlvbiBhZGREZWNsYXJhdGlvblRvTmdNb2R1bGUob3B0aW9uczogQ29tcG9uZW50T3B0aW9ucyk6IFJ1bGUge1xuICByZXR1cm4gKGhvc3Q6IFRyZWUpID0+IHtcbiAgICBpZiAob3B0aW9ucy5za2lwSW1wb3J0IHx8ICFvcHRpb25zLm1vZHVsZSkge1xuICAgICAgcmV0dXJuIGhvc3Q7XG4gICAgfVxuXG4gICAgY29uc3QgbW9kdWxlUGF0aCA9IG9wdGlvbnMubW9kdWxlO1xuICAgIGxldCBzb3VyY2UgPSByZWFkSW50b1NvdXJjZUZpbGUoaG9zdCwgbW9kdWxlUGF0aCk7XG5cbiAgICBjb25zdCBjb21wb25lbnRQYXRoID0gYC8ke29wdGlvbnMucGF0aH0vYFxuICAgICAgKyAob3B0aW9ucy5mbGF0ID8gJycgOiBzdHJpbmdzLmRhc2hlcml6ZShvcHRpb25zLm5hbWUpICsgJy8nKVxuICAgICAgKyBzdHJpbmdzLmRhc2hlcml6ZShvcHRpb25zLm5hbWUpXG4gICAgICArICcuY29tcG9uZW50JztcbiAgICBjb25zdCByZWxhdGl2ZVBhdGggPSBidWlsZFJlbGF0aXZlUGF0aChtb2R1bGVQYXRoLCBjb21wb25lbnRQYXRoKTtcbiAgICBjb25zdCBjbGFzc2lmaWVkTmFtZSA9IHN0cmluZ3MuY2xhc3NpZnkoYCR7b3B0aW9ucy5uYW1lfUNvbXBvbmVudGApO1xuXG4gICAgY29uc3QgZGVjbGFyYXRpb25DaGFuZ2VzID0gYWRkRGVjbGFyYXRpb25Ub01vZHVsZShcbiAgICAgIHNvdXJjZSxcbiAgICAgIG1vZHVsZVBhdGgsXG4gICAgICBjbGFzc2lmaWVkTmFtZSxcbiAgICAgIHJlbGF0aXZlUGF0aCk7XG5cbiAgICBjb25zdCBkZWNsYXJhdGlvblJlY29yZGVyID0gaG9zdC5iZWdpblVwZGF0ZShtb2R1bGVQYXRoKTtcbiAgICBmb3IgKGNvbnN0IGNoYW5nZSBvZiBkZWNsYXJhdGlvbkNoYW5nZXMpIHtcbiAgICAgIGlmIChjaGFuZ2UgaW5zdGFuY2VvZiBJbnNlcnRDaGFuZ2UpIHtcbiAgICAgICAgZGVjbGFyYXRpb25SZWNvcmRlci5pbnNlcnRMZWZ0KGNoYW5nZS5wb3MsIGNoYW5nZS50b0FkZCk7XG4gICAgICB9XG4gICAgfVxuICAgIGhvc3QuY29tbWl0VXBkYXRlKGRlY2xhcmF0aW9uUmVjb3JkZXIpO1xuXG4gICAgaWYgKG9wdGlvbnMuZXhwb3J0KSB7XG4gICAgICAvLyBOZWVkIHRvIHJlZnJlc2ggdGhlIEFTVCBiZWNhdXNlIHdlIG92ZXJ3cm90ZSB0aGUgZmlsZSBpbiB0aGUgaG9zdC5cbiAgICAgIHNvdXJjZSA9IHJlYWRJbnRvU291cmNlRmlsZShob3N0LCBtb2R1bGVQYXRoKTtcblxuICAgICAgY29uc3QgZXhwb3J0UmVjb3JkZXIgPSBob3N0LmJlZ2luVXBkYXRlKG1vZHVsZVBhdGgpO1xuICAgICAgY29uc3QgZXhwb3J0Q2hhbmdlcyA9IGFkZEV4cG9ydFRvTW9kdWxlKFxuICAgICAgICBzb3VyY2UsXG4gICAgICAgIG1vZHVsZVBhdGgsXG4gICAgICAgIHN0cmluZ3MuY2xhc3NpZnkoYCR7b3B0aW9ucy5uYW1lfUNvbXBvbmVudGApLFxuICAgICAgICByZWxhdGl2ZVBhdGgpO1xuXG4gICAgICBmb3IgKGNvbnN0IGNoYW5nZSBvZiBleHBvcnRDaGFuZ2VzKSB7XG4gICAgICAgIGlmIChjaGFuZ2UgaW5zdGFuY2VvZiBJbnNlcnRDaGFuZ2UpIHtcbiAgICAgICAgICBleHBvcnRSZWNvcmRlci5pbnNlcnRMZWZ0KGNoYW5nZS5wb3MsIGNoYW5nZS50b0FkZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGhvc3QuY29tbWl0VXBkYXRlKGV4cG9ydFJlY29yZGVyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaG9zdDtcbiAgfTtcbn1cblxuXG5mdW5jdGlvbiBidWlsZFNlbGVjdG9yKG9wdGlvbnM6IENvbXBvbmVudE9wdGlvbnMsIHByb2plY3RQcmVmaXg/OiBzdHJpbmcpIHtcbiAgbGV0IHNlbGVjdG9yID0gc3RyaW5ncy5kYXNoZXJpemUob3B0aW9ucy5uYW1lKTtcbiAgaWYgKG9wdGlvbnMucHJlZml4KSB7XG4gICAgc2VsZWN0b3IgPSBgJHtvcHRpb25zLnByZWZpeH0tJHtzZWxlY3Rvcn1gO1xuICB9IGVsc2UgaWYgKG9wdGlvbnMucHJlZml4ID09PSB1bmRlZmluZWQgJiYgcHJvamVjdFByZWZpeCkge1xuICAgIHNlbGVjdG9yID0gYCR7cHJvamVjdFByZWZpeH0tJHtzZWxlY3Rvcn1gO1xuICB9XG5cbiAgcmV0dXJuIHNlbGVjdG9yO1xufVxuXG4vKipcbiAqIEluZGVudHMgdGhlIHRleHQgY29udGVudCB3aXRoIHRoZSBhbW91bnQgb2Ygc3BlY2lmaWVkIHNwYWNlcy4gVGhlIHNwYWNlcyB3aWxsIGJlIGFkZGVkIGFmdGVyXG4gKiBldmVyeSBsaW5lLWJyZWFrLiBUaGlzIHV0aWxpdHkgZnVuY3Rpb24gY2FuIGJlIHVzZWQgaW5zaWRlIG9mIEVKUyB0ZW1wbGF0ZXMgdG8gcHJvcGVybHlcbiAqIGluY2x1ZGUgdGhlIGFkZGl0aW9uYWwgZmlsZXMuXG4gKi9cbmZ1bmN0aW9uIGluZGVudFRleHRDb250ZW50KHRleHQ6IHN0cmluZywgbnVtU3BhY2VzOiBudW1iZXIpOiBzdHJpbmcge1xuICAvLyBJbiB0aGUgTWF0ZXJpYWwgcHJvamVjdCB0aGVyZSBzaG91bGQgYmUgb25seSBMRiBsaW5lLWVuZGluZ3MsIGJ1dCB0aGUgc2NoZW1hdGljIGZpbGVzXG4gIC8vIGFyZSBub3QgYmVpbmcgbGludGVkIGFuZCB0aGVyZWZvcmUgdGhlcmUgY2FuIGJlIGFsc28gQ1JMRiBvciBqdXN0IENSIGxpbmUtZW5kaW5ncy5cbiAgcmV0dXJuIHRleHQucmVwbGFjZSgvKFxcclxcbnxcXHJ8XFxuKS9nLCBgJDEkeycgJy5yZXBlYXQobnVtU3BhY2VzKX1gKTtcbn1cblxuLyoqXG4gKiBSdWxlIHRoYXQgY29waWVzIGFuZCBpbnRlcnBvbGF0ZXMgdGhlIGZpbGVzIHRoYXQgYmVsb25nIHRvIHRoaXMgc2NoZW1hdGljIGNvbnRleHQuIEFkZGl0aW9uYWxseVxuICogYSBsaXN0IG9mIGZpbGUgcGF0aHMgY2FuIGJlIHBhc3NlZCB0byB0aGlzIHJ1bGUgaW4gb3JkZXIgdG8gZXhwb3NlIHRoZW0gaW5zaWRlIHRoZSBFSlNcbiAqIHRlbXBsYXRlIGNvbnRleHQuXG4gKlxuICogVGhpcyBhbGxvd3MgaW5saW5pbmcgdGhlIGV4dGVybmFsIHRlbXBsYXRlIG9yIHN0eWxlc2hlZXQgZmlsZXMgaW4gRUpTIHdpdGhvdXQgaGF2aW5nXG4gKiB0byBtYW51YWxseSBkdXBsaWNhdGUgdGhlIGZpbGUgY29udGVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkQ29tcG9uZW50KG9wdGlvbnM6IENvbXBvbmVudE9wdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkaXRpb25hbEZpbGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9KTogUnVsZSB7XG5cbiAgcmV0dXJuIGFzeW5jIChob3N0OiBUcmVlLCBjb250ZXh0OiBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IHdvcmtzcGFjZSA9IGF3YWl0IGdldFdvcmtzcGFjZShob3N0KTtcbiAgICBjb25zdCBwcm9qZWN0ID0gZ2V0UHJvamVjdEZyb21Xb3Jrc3BhY2Uod29ya3NwYWNlLCBvcHRpb25zLnByb2plY3QpO1xuICAgIGNvbnN0IGRlZmF1bHRDb21wb25lbnRPcHRpb25zID0gZ2V0RGVmYXVsdENvbXBvbmVudE9wdGlvbnMocHJvamVjdCk7XG5cbiAgICAvLyBUT0RPKGRldnZlcnNpb24pOiBSZW1vdmUgaWYgd2UgZHJvcCBzdXBwb3J0IGZvciBvbGRlciBDTEkgdmVyc2lvbnMuXG4gICAgLy8gVGhpcyBoYW5kbGVzIGFuIHVucmVwb3J0ZWQgYnJlYWtpbmcgY2hhbmdlIGZyb20gdGhlIEBhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzLiBQcmV2aW91c2x5XG4gICAgLy8gdGhlIGRlc2NyaXB0aW9uIHBhdGggcmVzb2x2ZWQgdG8gdGhlIGZhY3RvcnkgZmlsZSwgYnV0IHN0YXJ0aW5nIGZyb20gNi4yLjAsIGl0IHJlc29sdmVzXG4gICAgLy8gdG8gdGhlIGZhY3RvcnkgZGlyZWN0b3J5LlxuICAgIGNvbnN0IHNjaGVtYXRpY1BhdGggPSBzdGF0U3luYyhjb250ZXh0LnNjaGVtYXRpYy5kZXNjcmlwdGlvbi5wYXRoKS5pc0RpcmVjdG9yeSgpID9cbiAgICAgICAgY29udGV4dC5zY2hlbWF0aWMuZGVzY3JpcHRpb24ucGF0aCA6XG4gICAgICAgIGRpcm5hbWUoY29udGV4dC5zY2hlbWF0aWMuZGVzY3JpcHRpb24ucGF0aCk7XG5cbiAgICBjb25zdCBzY2hlbWF0aWNGaWxlc1VybCA9ICcuL2ZpbGVzJztcbiAgICBjb25zdCBzY2hlbWF0aWNGaWxlc1BhdGggPSByZXNvbHZlKHNjaGVtYXRpY1BhdGgsIHNjaGVtYXRpY0ZpbGVzVXJsKTtcblxuICAgIC8vIEFkZCB0aGUgZGVmYXVsdCBjb21wb25lbnQgb3B0aW9uIHZhbHVlcyB0byB0aGUgb3B0aW9ucyBpZiBhbiBvcHRpb24gaXMgbm90IGV4cGxpY2l0bHlcbiAgICAvLyBzcGVjaWZpZWQgYnV0IGEgZGVmYXVsdCBjb21wb25lbnQgb3B0aW9uIGlzIGF2YWlsYWJsZS5cbiAgICBPYmplY3Qua2V5cyhvcHRpb25zKVxuICAgICAgLmZpbHRlcigob3B0aW9uTmFtZToga2V5b2YgQ29tcG9uZW50T3B0aW9ucykgPT4ge1xuICAgICAgICByZXR1cm4gb3B0aW9uc1tvcHRpb25OYW1lXSA9PSBudWxsICYmIGRlZmF1bHRDb21wb25lbnRPcHRpb25zW29wdGlvbk5hbWVdO1xuICAgICAgfSlcbiAgICAgIC5mb3JFYWNoKChvcHRpb25OYW1lOiBrZXlvZiBDb21wb25lbnRPcHRpb25zKSA9PiB7XG4gICAgICAgIChvcHRpb25zIGFzIGFueSlbb3B0aW9uTmFtZV0gPSAoZGVmYXVsdENvbXBvbmVudE9wdGlvbnMgYXMgQ29tcG9uZW50T3B0aW9ucylbb3B0aW9uTmFtZV07XG4gICAgICB9KTtcblxuICAgIGlmIChvcHRpb25zLnBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gVE9ETyhqZWxib3Vybik6IGZpZ3VyZSBvdXQgaWYgdGhlIG5lZWQgZm9yIHRoaXMgYGFzIGFueWAgaXMgYSBidWcgZHVlIHRvIHR3byBkaWZmZXJlbnRcbiAgICAgIC8vIGluY29tcGF0aWJsZSBgUHJvamVjdERlZmluaXRpb25gIGNsYXNzZXMgaW4gQGFuZ3VsYXItZGV2a2l0XG4gICAgICBvcHRpb25zLnBhdGggPSBidWlsZERlZmF1bHRQYXRoKHByb2plY3QgYXMgYW55KTtcbiAgICB9XG5cbiAgICBvcHRpb25zLm1vZHVsZSA9IGZpbmRNb2R1bGVGcm9tT3B0aW9ucyhob3N0LCBvcHRpb25zKTtcblxuICAgIGNvbnN0IHBhcnNlZFBhdGggPSBwYXJzZU5hbWUob3B0aW9ucy5wYXRoISwgb3B0aW9ucy5uYW1lKTtcblxuICAgIG9wdGlvbnMubmFtZSA9IHBhcnNlZFBhdGgubmFtZTtcbiAgICBvcHRpb25zLnBhdGggPSBwYXJzZWRQYXRoLnBhdGg7XG4gICAgb3B0aW9ucy5zZWxlY3RvciA9IG9wdGlvbnMuc2VsZWN0b3IgfHwgYnVpbGRTZWxlY3RvcihvcHRpb25zLCBwcm9qZWN0LnByZWZpeCk7XG5cbiAgICB2YWxpZGF0ZU5hbWUob3B0aW9ucy5uYW1lKTtcbiAgICB2YWxpZGF0ZUh0bWxTZWxlY3RvcihvcHRpb25zLnNlbGVjdG9yISk7XG5cbiAgICAvLyBJbiBjYXNlIHRoZSBzcGVjaWZpZWQgc3R5bGUgZXh0ZW5zaW9uIGlzIG5vdCBwYXJ0IG9mIHRoZSBzdXBwb3J0ZWQgQ1NTIHN1cGVyc2V0cyxcbiAgICAvLyB3ZSBnZW5lcmF0ZSB0aGUgc3R5bGVzaGVldHMgd2l0aCB0aGUgXCJjc3NcIiBleHRlbnNpb24uIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGRvbid0XG4gICAgLy8gYWNjaWRlbnRhbGx5IGdlbmVyYXRlIGludmFsaWQgc3R5bGVzaGVldHMgKGUuZy4gZHJhZy1kcm9wLWNvbXAuc3R5bCkgd2hpY2ggd2lsbFxuICAgIC8vIGJyZWFrIHRoZSBBbmd1bGFyIENMSSBwcm9qZWN0LiBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2NvbXBvbmVudHMvaXNzdWVzLzE1MTY0XG4gICAgaWYgKCFzdXBwb3J0ZWRDc3NFeHRlbnNpb25zLmluY2x1ZGVzKG9wdGlvbnMuc3R5bGUhKSkge1xuICAgICAgLy8gVE9ETzogQ2FzdCBpcyBuZWNlc3NhcnkgYXMgd2UgY2FuJ3QgdXNlIHRoZSBTdHlsZSBlbnVtIHdoaWNoIGhhcyBiZWVuIGludHJvZHVjZWRcbiAgICAgIC8vIHdpdGhpbiBDTEkgdjcuMy4wLXJjLjAuIFRoaXMgd291bGQgYnJlYWsgdGhlIHNjaGVtYXRpYyBmb3Igb2xkZXIgQ0xJIHZlcnNpb25zLlxuICAgICAgb3B0aW9ucy5zdHlsZSA9ICdjc3MnIGFzIFN0eWxlO1xuICAgIH1cblxuICAgIC8vIE9iamVjdCB0aGF0IHdpbGwgYmUgdXNlZCBhcyBjb250ZXh0IGZvciB0aGUgRUpTIHRlbXBsYXRlcy5cbiAgICBjb25zdCBiYXNlVGVtcGxhdGVDb250ZXh0ID0ge1xuICAgICAgLi4uc3RyaW5ncyxcbiAgICAgICdpZi1mbGF0JzogKHM6IHN0cmluZykgPT4gb3B0aW9ucy5mbGF0ID8gJycgOiBzLFxuICAgICAgLi4ub3B0aW9ucyxcbiAgICB9O1xuXG4gICAgLy8gS2V5LXZhbHVlIG9iamVjdCB0aGF0IGluY2x1ZGVzIHRoZSBzcGVjaWZpZWQgYWRkaXRpb25hbCBmaWxlcyB3aXRoIHRoZWlyIGxvYWRlZCBjb250ZW50LlxuICAgIC8vIFRoZSByZXNvbHZlZCBjb250ZW50cyBjYW4gYmUgdXNlZCBpbnNpZGUgRUpTIHRlbXBsYXRlcy5cbiAgICBjb25zdCByZXNvbHZlZEZpbGVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG5cbiAgICBmb3IgKGxldCBrZXkgaW4gYWRkaXRpb25hbEZpbGVzKSB7XG4gICAgICBpZiAoYWRkaXRpb25hbEZpbGVzW2tleV0pIHtcbiAgICAgICAgY29uc3QgZmlsZUNvbnRlbnQgPSByZWFkRmlsZVN5bmMoam9pbihzY2hlbWF0aWNGaWxlc1BhdGgsIGFkZGl0aW9uYWxGaWxlc1trZXldKSwgJ3V0Zi04Jyk7XG5cbiAgICAgICAgLy8gSW50ZXJwb2xhdGUgdGhlIGFkZGl0aW9uYWwgZmlsZXMgd2l0aCB0aGUgYmFzZSBFSlMgdGVtcGxhdGUgY29udGV4dC5cbiAgICAgICAgcmVzb2x2ZWRGaWxlc1trZXldID0gaW50ZXJwb2xhdGVUZW1wbGF0ZShmaWxlQ29udGVudCkoYmFzZVRlbXBsYXRlQ29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgdGVtcGxhdGVTb3VyY2UgPSBhcHBseSh1cmwoc2NoZW1hdGljRmlsZXNVcmwpLCBbXG4gICAgICBvcHRpb25zLnNraXBUZXN0cyA/IGZpbHRlcihwYXRoID0+ICFwYXRoLmVuZHNXaXRoKCcuc3BlYy50cy50ZW1wbGF0ZScpKSA6IG5vb3AoKSxcbiAgICAgIG9wdGlvbnMuaW5saW5lU3R5bGUgPyBmaWx0ZXIocGF0aCA9PiAhcGF0aC5lbmRzV2l0aCgnLl9fc3R5bGVfXy50ZW1wbGF0ZScpKSA6IG5vb3AoKSxcbiAgICAgIG9wdGlvbnMuaW5saW5lVGVtcGxhdGUgPyBmaWx0ZXIocGF0aCA9PiAhcGF0aC5lbmRzV2l0aCgnLmh0bWwudGVtcGxhdGUnKSkgOiBub29wKCksXG4gICAgICAvLyBUcmVhdCB0aGUgdGVtcGxhdGUgb3B0aW9ucyBhcyBhbnksIGJlY2F1c2UgdGhlIHR5cGUgZGVmaW5pdGlvbiBmb3IgdGhlIHRlbXBsYXRlIG9wdGlvbnNcbiAgICAgIC8vIGlzIG1hZGUgdW5uZWNlc3NhcmlseSBleHBsaWNpdC4gRXZlcnkgdHlwZSBvZiBvYmplY3QgY2FuIGJlIHVzZWQgaW4gdGhlIEVKUyB0ZW1wbGF0ZS5cbiAgICAgIGFwcGx5VGVtcGxhdGVzKHtpbmRlbnRUZXh0Q29udGVudCwgcmVzb2x2ZWRGaWxlcywgLi4uYmFzZVRlbXBsYXRlQ29udGV4dH0gYXMgYW55KSxcbiAgICAgIC8vIFRPRE8oZGV2dmVyc2lvbik6IGZpZ3VyZSBvdXQgd2h5IHdlIGNhbm5vdCBqdXN0IHJlbW92ZSB0aGUgZmlyc3QgcGFyYW1ldGVyXG4gICAgICAvLyBTZWUgZm9yIGV4YW1wbGU6IGFuZ3VsYXItY2xpI3NjaGVtYXRpY3MvYW5ndWxhci9jb21wb25lbnQvaW5kZXgudHMjTDE2MFxuICAgICAgbW92ZShudWxsIGFzIGFueSwgcGFyc2VkUGF0aC5wYXRoKSxcbiAgICBdKTtcblxuICAgIHJldHVybiAoKSA9PiBjaGFpbihbXG4gICAgICBicmFuY2hBbmRNZXJnZShjaGFpbihbXG4gICAgICAgIGFkZERlY2xhcmF0aW9uVG9OZ01vZHVsZShvcHRpb25zKSxcbiAgICAgICAgbWVyZ2VXaXRoKHRlbXBsYXRlU291cmNlKSxcbiAgICAgIF0pKSxcbiAgICBdKShob3N0LCBjb250ZXh0KTtcbiAgfTtcbn1cbiJdfQ==