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
    return (host, ctx) => __awaiter(this, void 0, void 0, function* () {
        const context = ctx;
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
            .filter(key => options[key] == null &&
            defaultComponentOptions[key])
            .forEach(key => options[key] =
            defaultComponentOptions[key]);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQtY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL3V0aWxzL2J1aWxkLWNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7QUFFSCwrQ0FBOEU7QUFDOUUsMkRBYW9DO0FBR3BDLCtEQUFnRTtBQUNoRSxxRUFBbUU7QUFDbkUseUVBQWlHO0FBQ2pHLHVFQUFpRTtBQUNqRSx1RUFBMEY7QUFDMUYsbUZBQXlFO0FBQ3pFLDJCQUEwQztBQUMxQywrQkFBNEM7QUFDNUMsaUNBQWlDO0FBQ2pDLG9FQUdxQztBQUNyQywrQ0FBc0Q7QUFDdEQsMkRBQStEO0FBRy9EOzs7R0FHRztBQUNILFNBQVMsZ0JBQWdCLENBQUMsT0FBMEI7SUFDbEQsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFVBQVU7UUFDN0IsQ0FBQyxDQUFDLElBQUksT0FBTyxDQUFDLFVBQVUsR0FBRztRQUMzQixDQUFDLENBQUMsSUFBSSxPQUFPLENBQUMsSUFBSSxPQUFPLENBQUM7SUFFNUIsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxXQUFXLEtBQUssOEJBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0lBRWxHLE9BQU8sR0FBRyxJQUFJLEdBQUcsY0FBYyxFQUFFLENBQUM7QUFDcEMsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sc0JBQXNCLEdBQUcsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBRXZELFNBQVMsa0JBQWtCLENBQUMsSUFBVSxFQUFFLFVBQWtCO0lBQ3hELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDbkMsSUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFO1FBQ2pC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bUJBQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGlCQUFJLEVBQUU7WUFDcEYsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsbUJBQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGlCQUFJLEVBQUU7WUFDbEYsMEZBQTBGO1lBQzFGLHdGQUF3RjtZQUN4RiwyQkFBYyxDQUFDLGdCQUFDLGlCQUFpQixFQUFFLGFBQWEsSUFBSyxtQkFBbUIsQ0FBUSxDQUFDO1lBQ2pGLDZFQUE2RTtZQUM3RSwwRUFBMEU7WUFDMUUsaUJBQUksQ0FBQyxJQUFXLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQztTQUNuQyxDQUFDLENBQUM7UUFFSCxPQUFPLEdBQUcsRUFBRSxDQUFDLGtCQUFLLENBQUM7WUFDakIsMkJBQWMsQ0FBQyxrQkFBSyxDQUFDO2dCQUNuQix3QkFBd0IsQ0FBQyxPQUFPLENBQUM7Z0JBQ2pDLHNCQUFTLENBQUMsY0FBYyxDQUFDO2FBQzFCLENBQUMsQ0FBQztTQUNKLENBQUMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDcEIsQ0FBQyxDQUFBLENBQUM7QUFDSixDQUFDO0FBOUZELHdDQThGQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge3N0cmluZ3MsIHRlbXBsYXRlIGFzIGludGVycG9sYXRlVGVtcGxhdGV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7XG4gIGFwcGx5LFxuICBhcHBseVRlbXBsYXRlcyxcbiAgYnJhbmNoQW5kTWVyZ2UsXG4gIGNoYWluLFxuICBmaWx0ZXIsXG4gIG1lcmdlV2l0aCxcbiAgbW92ZSxcbiAgbm9vcCxcbiAgUnVsZSxcbiAgU2NoZW1hdGljc0V4Y2VwdGlvbixcbiAgVHJlZSxcbiAgdXJsLFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge0ZpbGVTeXN0ZW1TY2hlbWF0aWNDb250ZXh0fSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcy90b29scyc7XG5pbXBvcnQge1NjaGVtYSBhcyBDb21wb25lbnRPcHRpb25zLCBTdHlsZX0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci9jb21wb25lbnQvc2NoZW1hJztcbmltcG9ydCB7SW5zZXJ0Q2hhbmdlfSBmcm9tICdAc2NoZW1hdGljcy9hbmd1bGFyL3V0aWxpdHkvY2hhbmdlJztcbmltcG9ydCB7Z2V0V29ya3NwYWNlfSBmcm9tICdAc2NoZW1hdGljcy9hbmd1bGFyL3V0aWxpdHkvd29ya3NwYWNlJztcbmltcG9ydCB7YnVpbGRSZWxhdGl2ZVBhdGgsIGZpbmRNb2R1bGVGcm9tT3B0aW9uc30gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L2ZpbmQtbW9kdWxlJztcbmltcG9ydCB7cGFyc2VOYW1lfSBmcm9tICdAc2NoZW1hdGljcy9hbmd1bGFyL3V0aWxpdHkvcGFyc2UtbmFtZSc7XG5pbXBvcnQge3ZhbGlkYXRlSHRtbFNlbGVjdG9yLCB2YWxpZGF0ZU5hbWV9IGZyb20gJ0BzY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eS92YWxpZGF0aW9uJztcbmltcG9ydCB7UHJvamVjdFR5cGV9IGZyb20gJ0BzY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eS93b3Jrc3BhY2UtbW9kZWxzJztcbmltcG9ydCB7cmVhZEZpbGVTeW5jLCBzdGF0U3luY30gZnJvbSAnZnMnO1xuaW1wb3J0IHtkaXJuYW1lLCBqb2luLCByZXNvbHZlfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtcbiAgYWRkRGVjbGFyYXRpb25Ub01vZHVsZSxcbiAgYWRkRXhwb3J0VG9Nb2R1bGUsXG59IGZyb20gJy4uL3V0aWxzL3ZlbmRvcmVkLWFzdC11dGlscyc7XG5pbXBvcnQge2dldFByb2plY3RGcm9tV29ya3NwYWNlfSBmcm9tICcuL2dldC1wcm9qZWN0JztcbmltcG9ydCB7Z2V0RGVmYXVsdENvbXBvbmVudE9wdGlvbnN9IGZyb20gJy4vc2NoZW1hdGljLW9wdGlvbnMnO1xuaW1wb3J0IHtQcm9qZWN0RGVmaW5pdGlvbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUvc3JjL3dvcmtzcGFjZSc7XG5cbi8qKlxuICogQnVpbGQgYSBkZWZhdWx0IHByb2plY3QgcGF0aCBmb3IgZ2VuZXJhdGluZy5cbiAqIEBwYXJhbSBwcm9qZWN0IFRoZSBwcm9qZWN0IHRvIGJ1aWxkIHRoZSBwYXRoIGZvci5cbiAqL1xuZnVuY3Rpb24gYnVpbGREZWZhdWx0UGF0aChwcm9qZWN0OiBQcm9qZWN0RGVmaW5pdGlvbik6IHN0cmluZyB7XG4gIGNvbnN0IHJvb3QgPSBwcm9qZWN0LnNvdXJjZVJvb3RcbiAgICA/IGAvJHtwcm9qZWN0LnNvdXJjZVJvb3R9L2BcbiAgICA6IGAvJHtwcm9qZWN0LnJvb3R9L3NyYy9gO1xuXG4gIGNvbnN0IHByb2plY3REaXJOYW1lID0gcHJvamVjdC5leHRlbnNpb25zLnByb2plY3RUeXBlID09PSBQcm9qZWN0VHlwZS5BcHBsaWNhdGlvbiA/ICdhcHAnIDogJ2xpYic7XG5cbiAgcmV0dXJuIGAke3Jvb3R9JHtwcm9qZWN0RGlyTmFtZX1gO1xufVxuXG4vKipcbiAqIExpc3Qgb2Ygc3R5bGUgZXh0ZW5zaW9ucyB3aGljaCBhcmUgQ1NTIGNvbXBhdGlibGUuIEFsbCBzdXBwb3J0ZWQgQ0xJIHN0eWxlIGV4dGVuc2lvbnMgY2FuIGJlXG4gKiBmb3VuZCBoZXJlOiBhbmd1bGFyL2FuZ3VsYXItY2xpL21hc3Rlci9wYWNrYWdlcy9zY2hlbWF0aWNzL2FuZ3VsYXIvbmctbmV3L3NjaGVtYS5qc29uI0wxMTgtTDEyMlxuICovXG5jb25zdCBzdXBwb3J0ZWRDc3NFeHRlbnNpb25zID0gWydjc3MnLCAnc2NzcycsICdsZXNzJ107XG5cbmZ1bmN0aW9uIHJlYWRJbnRvU291cmNlRmlsZShob3N0OiBUcmVlLCBtb2R1bGVQYXRoOiBzdHJpbmcpIHtcbiAgY29uc3QgdGV4dCA9IGhvc3QucmVhZChtb2R1bGVQYXRoKTtcbiAgaWYgKHRleHQgPT09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgRmlsZSAke21vZHVsZVBhdGh9IGRvZXMgbm90IGV4aXN0LmApO1xuICB9XG5cbiAgcmV0dXJuIHRzLmNyZWF0ZVNvdXJjZUZpbGUobW9kdWxlUGF0aCwgdGV4dC50b1N0cmluZygndXRmLTgnKSwgdHMuU2NyaXB0VGFyZ2V0LkxhdGVzdCwgdHJ1ZSk7XG59XG5cbmZ1bmN0aW9uIGFkZERlY2xhcmF0aW9uVG9OZ01vZHVsZShvcHRpb25zOiBDb21wb25lbnRPcHRpb25zKTogUnVsZSB7XG4gIHJldHVybiAoaG9zdDogVHJlZSkgPT4ge1xuICAgIGlmIChvcHRpb25zLnNraXBJbXBvcnQgfHwgIW9wdGlvbnMubW9kdWxlKSB7XG4gICAgICByZXR1cm4gaG9zdDtcbiAgICB9XG5cbiAgICBjb25zdCBtb2R1bGVQYXRoID0gb3B0aW9ucy5tb2R1bGU7XG4gICAgbGV0IHNvdXJjZSA9IHJlYWRJbnRvU291cmNlRmlsZShob3N0LCBtb2R1bGVQYXRoKTtcblxuICAgIGNvbnN0IGNvbXBvbmVudFBhdGggPSBgLyR7b3B0aW9ucy5wYXRofS9gXG4gICAgICArIChvcHRpb25zLmZsYXQgPyAnJyA6IHN0cmluZ3MuZGFzaGVyaXplKG9wdGlvbnMubmFtZSkgKyAnLycpXG4gICAgICArIHN0cmluZ3MuZGFzaGVyaXplKG9wdGlvbnMubmFtZSlcbiAgICAgICsgJy5jb21wb25lbnQnO1xuICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IGJ1aWxkUmVsYXRpdmVQYXRoKG1vZHVsZVBhdGgsIGNvbXBvbmVudFBhdGgpO1xuICAgIGNvbnN0IGNsYXNzaWZpZWROYW1lID0gc3RyaW5ncy5jbGFzc2lmeShgJHtvcHRpb25zLm5hbWV9Q29tcG9uZW50YCk7XG5cbiAgICBjb25zdCBkZWNsYXJhdGlvbkNoYW5nZXMgPSBhZGREZWNsYXJhdGlvblRvTW9kdWxlKFxuICAgICAgc291cmNlLFxuICAgICAgbW9kdWxlUGF0aCxcbiAgICAgIGNsYXNzaWZpZWROYW1lLFxuICAgICAgcmVsYXRpdmVQYXRoKTtcblxuICAgIGNvbnN0IGRlY2xhcmF0aW9uUmVjb3JkZXIgPSBob3N0LmJlZ2luVXBkYXRlKG1vZHVsZVBhdGgpO1xuICAgIGZvciAoY29uc3QgY2hhbmdlIG9mIGRlY2xhcmF0aW9uQ2hhbmdlcykge1xuICAgICAgaWYgKGNoYW5nZSBpbnN0YW5jZW9mIEluc2VydENoYW5nZSkge1xuICAgICAgICBkZWNsYXJhdGlvblJlY29yZGVyLmluc2VydExlZnQoY2hhbmdlLnBvcywgY2hhbmdlLnRvQWRkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaG9zdC5jb21taXRVcGRhdGUoZGVjbGFyYXRpb25SZWNvcmRlcik7XG5cbiAgICBpZiAob3B0aW9ucy5leHBvcnQpIHtcbiAgICAgIC8vIE5lZWQgdG8gcmVmcmVzaCB0aGUgQVNUIGJlY2F1c2Ugd2Ugb3Zlcndyb3RlIHRoZSBmaWxlIGluIHRoZSBob3N0LlxuICAgICAgc291cmNlID0gcmVhZEludG9Tb3VyY2VGaWxlKGhvc3QsIG1vZHVsZVBhdGgpO1xuXG4gICAgICBjb25zdCBleHBvcnRSZWNvcmRlciA9IGhvc3QuYmVnaW5VcGRhdGUobW9kdWxlUGF0aCk7XG4gICAgICBjb25zdCBleHBvcnRDaGFuZ2VzID0gYWRkRXhwb3J0VG9Nb2R1bGUoXG4gICAgICAgIHNvdXJjZSxcbiAgICAgICAgbW9kdWxlUGF0aCxcbiAgICAgICAgc3RyaW5ncy5jbGFzc2lmeShgJHtvcHRpb25zLm5hbWV9Q29tcG9uZW50YCksXG4gICAgICAgIHJlbGF0aXZlUGF0aCk7XG5cbiAgICAgIGZvciAoY29uc3QgY2hhbmdlIG9mIGV4cG9ydENoYW5nZXMpIHtcbiAgICAgICAgaWYgKGNoYW5nZSBpbnN0YW5jZW9mIEluc2VydENoYW5nZSkge1xuICAgICAgICAgIGV4cG9ydFJlY29yZGVyLmluc2VydExlZnQoY2hhbmdlLnBvcywgY2hhbmdlLnRvQWRkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaG9zdC5jb21taXRVcGRhdGUoZXhwb3J0UmVjb3JkZXIpO1xuICAgIH1cblxuICAgIHJldHVybiBob3N0O1xuICB9O1xufVxuXG5cbmZ1bmN0aW9uIGJ1aWxkU2VsZWN0b3Iob3B0aW9uczogQ29tcG9uZW50T3B0aW9ucywgcHJvamVjdFByZWZpeD86IHN0cmluZykge1xuICBsZXQgc2VsZWN0b3IgPSBzdHJpbmdzLmRhc2hlcml6ZShvcHRpb25zLm5hbWUpO1xuICBpZiAob3B0aW9ucy5wcmVmaXgpIHtcbiAgICBzZWxlY3RvciA9IGAke29wdGlvbnMucHJlZml4fS0ke3NlbGVjdG9yfWA7XG4gIH0gZWxzZSBpZiAob3B0aW9ucy5wcmVmaXggPT09IHVuZGVmaW5lZCAmJiBwcm9qZWN0UHJlZml4KSB7XG4gICAgc2VsZWN0b3IgPSBgJHtwcm9qZWN0UHJlZml4fS0ke3NlbGVjdG9yfWA7XG4gIH1cblxuICByZXR1cm4gc2VsZWN0b3I7XG59XG5cbi8qKlxuICogSW5kZW50cyB0aGUgdGV4dCBjb250ZW50IHdpdGggdGhlIGFtb3VudCBvZiBzcGVjaWZpZWQgc3BhY2VzLiBUaGUgc3BhY2VzIHdpbGwgYmUgYWRkZWQgYWZ0ZXJcbiAqIGV2ZXJ5IGxpbmUtYnJlYWsuIFRoaXMgdXRpbGl0eSBmdW5jdGlvbiBjYW4gYmUgdXNlZCBpbnNpZGUgb2YgRUpTIHRlbXBsYXRlcyB0byBwcm9wZXJseVxuICogaW5jbHVkZSB0aGUgYWRkaXRpb25hbCBmaWxlcy5cbiAqL1xuZnVuY3Rpb24gaW5kZW50VGV4dENvbnRlbnQodGV4dDogc3RyaW5nLCBudW1TcGFjZXM6IG51bWJlcik6IHN0cmluZyB7XG4gIC8vIEluIHRoZSBNYXRlcmlhbCBwcm9qZWN0IHRoZXJlIHNob3VsZCBiZSBvbmx5IExGIGxpbmUtZW5kaW5ncywgYnV0IHRoZSBzY2hlbWF0aWMgZmlsZXNcbiAgLy8gYXJlIG5vdCBiZWluZyBsaW50ZWQgYW5kIHRoZXJlZm9yZSB0aGVyZSBjYW4gYmUgYWxzbyBDUkxGIG9yIGp1c3QgQ1IgbGluZS1lbmRpbmdzLlxuICByZXR1cm4gdGV4dC5yZXBsYWNlKC8oXFxyXFxufFxccnxcXG4pL2csIGAkMSR7JyAnLnJlcGVhdChudW1TcGFjZXMpfWApO1xufVxuXG4vKipcbiAqIFJ1bGUgdGhhdCBjb3BpZXMgYW5kIGludGVycG9sYXRlcyB0aGUgZmlsZXMgdGhhdCBiZWxvbmcgdG8gdGhpcyBzY2hlbWF0aWMgY29udGV4dC4gQWRkaXRpb25hbGx5XG4gKiBhIGxpc3Qgb2YgZmlsZSBwYXRocyBjYW4gYmUgcGFzc2VkIHRvIHRoaXMgcnVsZSBpbiBvcmRlciB0byBleHBvc2UgdGhlbSBpbnNpZGUgdGhlIEVKU1xuICogdGVtcGxhdGUgY29udGV4dC5cbiAqXG4gKiBUaGlzIGFsbG93cyBpbmxpbmluZyB0aGUgZXh0ZXJuYWwgdGVtcGxhdGUgb3Igc3R5bGVzaGVldCBmaWxlcyBpbiBFSlMgd2l0aG91dCBoYXZpbmdcbiAqIHRvIG1hbnVhbGx5IGR1cGxpY2F0ZSB0aGUgZmlsZSBjb250ZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRDb21wb25lbnQob3B0aW9uczogQ29tcG9uZW50T3B0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRpdGlvbmFsRmlsZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9ID0ge30pOiBSdWxlIHtcblxuICByZXR1cm4gYXN5bmMgKGhvc3QsIGN0eCkgPT4ge1xuICAgIGNvbnN0IGNvbnRleHQgPSBjdHggYXMgRmlsZVN5c3RlbVNjaGVtYXRpY0NvbnRleHQ7XG4gICAgY29uc3Qgd29ya3NwYWNlID0gYXdhaXQgZ2V0V29ya3NwYWNlKGhvc3QpO1xuICAgIGNvbnN0IHByb2plY3QgPSBnZXRQcm9qZWN0RnJvbVdvcmtzcGFjZSh3b3Jrc3BhY2UsIG9wdGlvbnMucHJvamVjdCk7XG4gICAgY29uc3QgZGVmYXVsdENvbXBvbmVudE9wdGlvbnMgPSBnZXREZWZhdWx0Q29tcG9uZW50T3B0aW9ucyhwcm9qZWN0KTtcblxuICAgIC8vIFRPRE8oZGV2dmVyc2lvbik6IFJlbW92ZSBpZiB3ZSBkcm9wIHN1cHBvcnQgZm9yIG9sZGVyIENMSSB2ZXJzaW9ucy5cbiAgICAvLyBUaGlzIGhhbmRsZXMgYW4gdW5yZXBvcnRlZCBicmVha2luZyBjaGFuZ2UgZnJvbSB0aGUgQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MuIFByZXZpb3VzbHlcbiAgICAvLyB0aGUgZGVzY3JpcHRpb24gcGF0aCByZXNvbHZlZCB0byB0aGUgZmFjdG9yeSBmaWxlLCBidXQgc3RhcnRpbmcgZnJvbSA2LjIuMCwgaXQgcmVzb2x2ZXNcbiAgICAvLyB0byB0aGUgZmFjdG9yeSBkaXJlY3RvcnkuXG4gICAgY29uc3Qgc2NoZW1hdGljUGF0aCA9IHN0YXRTeW5jKGNvbnRleHQuc2NoZW1hdGljLmRlc2NyaXB0aW9uLnBhdGgpLmlzRGlyZWN0b3J5KCkgP1xuICAgICAgICBjb250ZXh0LnNjaGVtYXRpYy5kZXNjcmlwdGlvbi5wYXRoIDpcbiAgICAgICAgZGlybmFtZShjb250ZXh0LnNjaGVtYXRpYy5kZXNjcmlwdGlvbi5wYXRoKTtcblxuICAgIGNvbnN0IHNjaGVtYXRpY0ZpbGVzVXJsID0gJy4vZmlsZXMnO1xuICAgIGNvbnN0IHNjaGVtYXRpY0ZpbGVzUGF0aCA9IHJlc29sdmUoc2NoZW1hdGljUGF0aCwgc2NoZW1hdGljRmlsZXNVcmwpO1xuXG4gICAgLy8gQWRkIHRoZSBkZWZhdWx0IGNvbXBvbmVudCBvcHRpb24gdmFsdWVzIHRvIHRoZSBvcHRpb25zIGlmIGFuIG9wdGlvbiBpcyBub3QgZXhwbGljaXRseVxuICAgIC8vIHNwZWNpZmllZCBidXQgYSBkZWZhdWx0IGNvbXBvbmVudCBvcHRpb24gaXMgYXZhaWxhYmxlLlxuICAgIE9iamVjdC5rZXlzKG9wdGlvbnMpXG4gICAgICAuZmlsdGVyKGtleSA9PiBvcHRpb25zW2tleSBhcyBrZXlvZiBDb21wb25lbnRPcHRpb25zXSA9PSBudWxsICYmXG4gICAgICAgICAgICAgICAgICAgICBkZWZhdWx0Q29tcG9uZW50T3B0aW9uc1trZXkgYXMga2V5b2YgQ29tcG9uZW50T3B0aW9uc10pXG4gICAgICAuZm9yRWFjaChrZXkgPT4gKG9wdGlvbnMgYXMgYW55KVtrZXldID1cbiAgICAgICAgICAoZGVmYXVsdENvbXBvbmVudE9wdGlvbnMgYXMgQ29tcG9uZW50T3B0aW9ucylba2V5IGFzIGtleW9mIENvbXBvbmVudE9wdGlvbnNdKTtcblxuICAgIGlmIChvcHRpb25zLnBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gVE9ETyhqZWxib3Vybik6IGZpZ3VyZSBvdXQgaWYgdGhlIG5lZWQgZm9yIHRoaXMgYGFzIGFueWAgaXMgYSBidWcgZHVlIHRvIHR3byBkaWZmZXJlbnRcbiAgICAgIC8vIGluY29tcGF0aWJsZSBgUHJvamVjdERlZmluaXRpb25gIGNsYXNzZXMgaW4gQGFuZ3VsYXItZGV2a2l0XG4gICAgICBvcHRpb25zLnBhdGggPSBidWlsZERlZmF1bHRQYXRoKHByb2plY3QgYXMgYW55KTtcbiAgICB9XG5cbiAgICBvcHRpb25zLm1vZHVsZSA9IGZpbmRNb2R1bGVGcm9tT3B0aW9ucyhob3N0LCBvcHRpb25zKTtcblxuICAgIGNvbnN0IHBhcnNlZFBhdGggPSBwYXJzZU5hbWUob3B0aW9ucy5wYXRoISwgb3B0aW9ucy5uYW1lKTtcblxuICAgIG9wdGlvbnMubmFtZSA9IHBhcnNlZFBhdGgubmFtZTtcbiAgICBvcHRpb25zLnBhdGggPSBwYXJzZWRQYXRoLnBhdGg7XG4gICAgb3B0aW9ucy5zZWxlY3RvciA9IG9wdGlvbnMuc2VsZWN0b3IgfHwgYnVpbGRTZWxlY3RvcihvcHRpb25zLCBwcm9qZWN0LnByZWZpeCk7XG5cbiAgICB2YWxpZGF0ZU5hbWUob3B0aW9ucy5uYW1lKTtcbiAgICB2YWxpZGF0ZUh0bWxTZWxlY3RvcihvcHRpb25zLnNlbGVjdG9yISk7XG5cbiAgICAvLyBJbiBjYXNlIHRoZSBzcGVjaWZpZWQgc3R5bGUgZXh0ZW5zaW9uIGlzIG5vdCBwYXJ0IG9mIHRoZSBzdXBwb3J0ZWQgQ1NTIHN1cGVyc2V0cyxcbiAgICAvLyB3ZSBnZW5lcmF0ZSB0aGUgc3R5bGVzaGVldHMgd2l0aCB0aGUgXCJjc3NcIiBleHRlbnNpb24uIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGRvbid0XG4gICAgLy8gYWNjaWRlbnRhbGx5IGdlbmVyYXRlIGludmFsaWQgc3R5bGVzaGVldHMgKGUuZy4gZHJhZy1kcm9wLWNvbXAuc3R5bCkgd2hpY2ggd2lsbFxuICAgIC8vIGJyZWFrIHRoZSBBbmd1bGFyIENMSSBwcm9qZWN0LiBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2NvbXBvbmVudHMvaXNzdWVzLzE1MTY0XG4gICAgaWYgKCFzdXBwb3J0ZWRDc3NFeHRlbnNpb25zLmluY2x1ZGVzKG9wdGlvbnMuc3R5bGUhKSkge1xuICAgICAgLy8gVE9ETzogQ2FzdCBpcyBuZWNlc3NhcnkgYXMgd2UgY2FuJ3QgdXNlIHRoZSBTdHlsZSBlbnVtIHdoaWNoIGhhcyBiZWVuIGludHJvZHVjZWRcbiAgICAgIC8vIHdpdGhpbiBDTEkgdjcuMy4wLXJjLjAuIFRoaXMgd291bGQgYnJlYWsgdGhlIHNjaGVtYXRpYyBmb3Igb2xkZXIgQ0xJIHZlcnNpb25zLlxuICAgICAgb3B0aW9ucy5zdHlsZSA9ICdjc3MnIGFzIFN0eWxlO1xuICAgIH1cblxuICAgIC8vIE9iamVjdCB0aGF0IHdpbGwgYmUgdXNlZCBhcyBjb250ZXh0IGZvciB0aGUgRUpTIHRlbXBsYXRlcy5cbiAgICBjb25zdCBiYXNlVGVtcGxhdGVDb250ZXh0ID0ge1xuICAgICAgLi4uc3RyaW5ncyxcbiAgICAgICdpZi1mbGF0JzogKHM6IHN0cmluZykgPT4gb3B0aW9ucy5mbGF0ID8gJycgOiBzLFxuICAgICAgLi4ub3B0aW9ucyxcbiAgICB9O1xuXG4gICAgLy8gS2V5LXZhbHVlIG9iamVjdCB0aGF0IGluY2x1ZGVzIHRoZSBzcGVjaWZpZWQgYWRkaXRpb25hbCBmaWxlcyB3aXRoIHRoZWlyIGxvYWRlZCBjb250ZW50LlxuICAgIC8vIFRoZSByZXNvbHZlZCBjb250ZW50cyBjYW4gYmUgdXNlZCBpbnNpZGUgRUpTIHRlbXBsYXRlcy5cbiAgICBjb25zdCByZXNvbHZlZEZpbGVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG5cbiAgICBmb3IgKGxldCBrZXkgaW4gYWRkaXRpb25hbEZpbGVzKSB7XG4gICAgICBpZiAoYWRkaXRpb25hbEZpbGVzW2tleV0pIHtcbiAgICAgICAgY29uc3QgZmlsZUNvbnRlbnQgPSByZWFkRmlsZVN5bmMoam9pbihzY2hlbWF0aWNGaWxlc1BhdGgsIGFkZGl0aW9uYWxGaWxlc1trZXldKSwgJ3V0Zi04Jyk7XG5cbiAgICAgICAgLy8gSW50ZXJwb2xhdGUgdGhlIGFkZGl0aW9uYWwgZmlsZXMgd2l0aCB0aGUgYmFzZSBFSlMgdGVtcGxhdGUgY29udGV4dC5cbiAgICAgICAgcmVzb2x2ZWRGaWxlc1trZXldID0gaW50ZXJwb2xhdGVUZW1wbGF0ZShmaWxlQ29udGVudCkoYmFzZVRlbXBsYXRlQ29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgdGVtcGxhdGVTb3VyY2UgPSBhcHBseSh1cmwoc2NoZW1hdGljRmlsZXNVcmwpLCBbXG4gICAgICBvcHRpb25zLnNraXBUZXN0cyA/IGZpbHRlcihwYXRoID0+ICFwYXRoLmVuZHNXaXRoKCcuc3BlYy50cy50ZW1wbGF0ZScpKSA6IG5vb3AoKSxcbiAgICAgIG9wdGlvbnMuaW5saW5lU3R5bGUgPyBmaWx0ZXIocGF0aCA9PiAhcGF0aC5lbmRzV2l0aCgnLl9fc3R5bGVfXy50ZW1wbGF0ZScpKSA6IG5vb3AoKSxcbiAgICAgIG9wdGlvbnMuaW5saW5lVGVtcGxhdGUgPyBmaWx0ZXIocGF0aCA9PiAhcGF0aC5lbmRzV2l0aCgnLmh0bWwudGVtcGxhdGUnKSkgOiBub29wKCksXG4gICAgICAvLyBUcmVhdCB0aGUgdGVtcGxhdGUgb3B0aW9ucyBhcyBhbnksIGJlY2F1c2UgdGhlIHR5cGUgZGVmaW5pdGlvbiBmb3IgdGhlIHRlbXBsYXRlIG9wdGlvbnNcbiAgICAgIC8vIGlzIG1hZGUgdW5uZWNlc3NhcmlseSBleHBsaWNpdC4gRXZlcnkgdHlwZSBvZiBvYmplY3QgY2FuIGJlIHVzZWQgaW4gdGhlIEVKUyB0ZW1wbGF0ZS5cbiAgICAgIGFwcGx5VGVtcGxhdGVzKHtpbmRlbnRUZXh0Q29udGVudCwgcmVzb2x2ZWRGaWxlcywgLi4uYmFzZVRlbXBsYXRlQ29udGV4dH0gYXMgYW55KSxcbiAgICAgIC8vIFRPRE8oZGV2dmVyc2lvbik6IGZpZ3VyZSBvdXQgd2h5IHdlIGNhbm5vdCBqdXN0IHJlbW92ZSB0aGUgZmlyc3QgcGFyYW1ldGVyXG4gICAgICAvLyBTZWUgZm9yIGV4YW1wbGU6IGFuZ3VsYXItY2xpI3NjaGVtYXRpY3MvYW5ndWxhci9jb21wb25lbnQvaW5kZXgudHMjTDE2MFxuICAgICAgbW92ZShudWxsIGFzIGFueSwgcGFyc2VkUGF0aC5wYXRoKSxcbiAgICBdKTtcblxuICAgIHJldHVybiAoKSA9PiBjaGFpbihbXG4gICAgICBicmFuY2hBbmRNZXJnZShjaGFpbihbXG4gICAgICAgIGFkZERlY2xhcmF0aW9uVG9OZ01vZHVsZShvcHRpb25zKSxcbiAgICAgICAgbWVyZ2VXaXRoKHRlbXBsYXRlU291cmNlKSxcbiAgICAgIF0pKSxcbiAgICBdKShob3N0LCBjb250ZXh0KTtcbiAgfTtcbn1cbiJdfQ==