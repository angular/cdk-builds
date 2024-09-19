"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildComponent = buildComponent;
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const schema_1 = require("@schematics/angular/component/schema");
const change_1 = require("@schematics/angular/utility/change");
const workspace_1 = require("@schematics/angular/utility/workspace");
const find_module_1 = require("@schematics/angular/utility/find-module");
const parse_name_1 = require("@schematics/angular/utility/parse-name");
const validation_1 = require("@schematics/angular/utility/validation");
const workspace_models_1 = require("@schematics/angular/utility/workspace-models");
const ast_utils_1 = require("@schematics/angular/utility/ast-utils");
const fs_1 = require("fs");
const path_1 = require("path");
const ts = require("typescript");
const get_project_1 = require("./get-project");
const schematic_options_1 = require("./schematic-options");
/**
 * Build a default project path for generating.
 * @param project The project to build the path for.
 */
function buildDefaultPath(project) {
    const root = project.sourceRoot ? `/${project.sourceRoot}/` : `/${project.root}/src/`;
    const projectDirName = project.extensions['projectType'] === workspace_models_1.ProjectType.Application ? 'app' : 'lib';
    return `${root}${projectDirName}`;
}
/**
 * List of style extensions which are CSS compatible. All supported CLI style extensions can be
 * found here: angular/angular-cli/main/packages/schematics/angular/ng-new/schema.json#L118-L122
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
        if (options.skipImport || options.standalone || !options.module) {
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
        const declarationChanges = (0, ast_utils_1.addDeclarationToModule)(source, modulePath, classifiedName, relativePath);
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
            const exportChanges = (0, ast_utils_1.addExportToModule)(source, modulePath, core_1.strings.classify(`${options.name}Component`), relativePath);
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
    return async (host, ctx) => {
        const context = ctx;
        const workspace = await (0, workspace_1.getWorkspace)(host);
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
            options.path = buildDefaultPath(project);
        }
        options.standalone = await (0, schematic_options_1.isStandaloneSchematic)(host, options);
        if (!options.standalone) {
            options.module = (0, find_module_1.findModuleFromOptions)(host, options);
        }
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
            options.style = schema_1.Style.Css;
        }
        // Object that will be used as context for the EJS templates.
        const baseTemplateContext = {
            ...core_1.strings,
            'if-flat': (s) => (options.flat ? '' : s),
            ...options,
        };
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
            (0, schematics_1.applyTemplates)({ indentTextContent, resolvedFiles, ...baseTemplateContext }),
            // TODO(devversion): figure out why we cannot just remove the first parameter
            // See for example: angular-cli#schematics/angular/component/index.ts#L160
            (0, schematics_1.move)(null, parsedPath.path),
        ]);
        return () => (0, schematics_1.chain)([
            (0, schematics_1.branchAndMerge)((0, schematics_1.chain)([addDeclarationToNgModule(options), (0, schematics_1.mergeWith)(templateSource)])),
        ])(host, context);
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQtY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL3V0aWxzL2J1aWxkLWNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQWtKSCx3Q0FtR0M7QUFuUEQsK0NBQTBGO0FBQzFGLDJEQWFvQztBQUVwQyxpRUFBdUY7QUFDdkYsK0RBQWdFO0FBQ2hFLHFFQUFtRTtBQUNuRSx5RUFBaUc7QUFDakcsdUVBQWlFO0FBQ2pFLHVFQUE0RTtBQUM1RSxtRkFBeUU7QUFDekUscUVBQWdHO0FBQ2hHLDJCQUEwQztBQUMxQywrQkFBNEM7QUFDNUMsaUNBQWlDO0FBQ2pDLCtDQUFzRDtBQUN0RCwyREFBc0Y7QUFFdEY7OztHQUdHO0FBQ0gsU0FBUyxnQkFBZ0IsQ0FBQyxPQUFxQztJQUM3RCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxPQUFPLENBQUMsSUFBSSxPQUFPLENBQUM7SUFFdEYsTUFBTSxjQUFjLEdBQ2xCLE9BQU8sQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLEtBQUssOEJBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0lBRWhGLE9BQU8sR0FBRyxJQUFJLEdBQUcsY0FBYyxFQUFFLENBQUM7QUFDcEMsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sc0JBQXNCLEdBQUcsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBRXZELFNBQVMsa0JBQWtCLENBQUMsSUFBVSxFQUFFLFVBQWtCO0lBQ3hELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDbkMsSUFBSSxJQUFJ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QUFBLHNCQUFTLEVBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3RGLENBQUMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDdEIsQ0FBQyxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmRldi9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtzdHJpbmdzLCB0ZW1wbGF0ZSBhcyBpbnRlcnBvbGF0ZVRlbXBsYXRlLCB3b3Jrc3BhY2VzfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQge1xuICBhcHBseSxcbiAgYXBwbHlUZW1wbGF0ZXMsXG4gIGJyYW5jaEFuZE1lcmdlLFxuICBjaGFpbixcbiAgZmlsdGVyLFxuICBtZXJnZVdpdGgsXG4gIG1vdmUsXG4gIG5vb3AsXG4gIFJ1bGUsXG4gIFNjaGVtYXRpY3NFeGNlcHRpb24sXG4gIFRyZWUsXG4gIHVybCxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MvdG9vbHMnO1xuaW1wb3J0IHtTY2hlbWEgYXMgQ29tcG9uZW50T3B0aW9ucywgU3R5bGV9IGZyb20gJ0BzY2hlbWF0aWNzL2FuZ3VsYXIvY29tcG9uZW50L3NjaGVtYSc7XG5pbXBvcnQge0luc2VydENoYW5nZX0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L2NoYW5nZSc7XG5pbXBvcnQge2dldFdvcmtzcGFjZX0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L3dvcmtzcGFjZSc7XG5pbXBvcnQge2J1aWxkUmVsYXRpdmVQYXRoLCBmaW5kTW9kdWxlRnJvbU9wdGlvbnN9IGZyb20gJ0BzY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eS9maW5kLW1vZHVsZSc7XG5pbXBvcnQge3BhcnNlTmFtZX0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L3BhcnNlLW5hbWUnO1xuaW1wb3J0IHt2YWxpZGF0ZUh0bWxTZWxlY3Rvcn0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L3ZhbGlkYXRpb24nO1xuaW1wb3J0IHtQcm9qZWN0VHlwZX0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L3dvcmtzcGFjZS1tb2RlbHMnO1xuaW1wb3J0IHthZGREZWNsYXJhdGlvblRvTW9kdWxlLCBhZGRFeHBvcnRUb01vZHVsZX0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L2FzdC11dGlscyc7XG5pbXBvcnQge3JlYWRGaWxlU3luYywgc3RhdFN5bmN9IGZyb20gJ2ZzJztcbmltcG9ydCB7ZGlybmFtZSwgam9pbiwgcmVzb2x2ZX0gZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7Z2V0UHJvamVjdEZyb21Xb3Jrc3BhY2V9IGZyb20gJy4vZ2V0LXByb2plY3QnO1xuaW1wb3J0IHtnZXREZWZhdWx0Q29tcG9uZW50T3B0aW9ucywgaXNTdGFuZGFsb25lU2NoZW1hdGljfSBmcm9tICcuL3NjaGVtYXRpYy1vcHRpb25zJztcblxuLyoqXG4gKiBCdWlsZCBhIGRlZmF1bHQgcHJvamVjdCBwYXRoIGZvciBnZW5lcmF0aW5nLlxuICogQHBhcmFtIHByb2plY3QgVGhlIHByb2plY3QgdG8gYnVpbGQgdGhlIHBhdGggZm9yLlxuICovXG5mdW5jdGlvbiBidWlsZERlZmF1bHRQYXRoKHByb2plY3Q6IHdvcmtzcGFjZXMuUHJvamVjdERlZmluaXRpb24pOiBzdHJpbmcge1xuICBjb25zdCByb290ID0gcHJvamVjdC5zb3VyY2VSb290ID8gYC8ke3Byb2plY3Quc291cmNlUm9vdH0vYCA6IGAvJHtwcm9qZWN0LnJvb3R9L3NyYy9gO1xuXG4gIGNvbnN0IHByb2plY3REaXJOYW1lID1cbiAgICBwcm9qZWN0LmV4dGVuc2lvbnNbJ3Byb2plY3RUeXBlJ10gPT09IFByb2plY3RUeXBlLkFwcGxpY2F0aW9uID8gJ2FwcCcgOiAnbGliJztcblxuICByZXR1cm4gYCR7cm9vdH0ke3Byb2plY3REaXJOYW1lfWA7XG59XG5cbi8qKlxuICogTGlzdCBvZiBzdHlsZSBleHRlbnNpb25zIHdoaWNoIGFyZSBDU1MgY29tcGF0aWJsZS4gQWxsIHN1cHBvcnRlZCBDTEkgc3R5bGUgZXh0ZW5zaW9ucyBjYW4gYmVcbiAqIGZvdW5kIGhlcmU6IGFuZ3VsYXIvYW5ndWxhci1jbGkvbWFpbi9wYWNrYWdlcy9zY2hlbWF0aWNzL2FuZ3VsYXIvbmctbmV3L3NjaGVtYS5qc29uI0wxMTgtTDEyMlxuICovXG5jb25zdCBzdXBwb3J0ZWRDc3NFeHRlbnNpb25zID0gWydjc3MnLCAnc2NzcycsICdsZXNzJ107XG5cbmZ1bmN0aW9uIHJlYWRJbnRvU291cmNlRmlsZShob3N0OiBUcmVlLCBtb2R1bGVQYXRoOiBzdHJpbmcpIHtcbiAgY29uc3QgdGV4dCA9IGhvc3QucmVhZChtb2R1bGVQYXRoKTtcbiAgaWYgKHRleHQgPT09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgRmlsZSAke21vZHVsZVBhdGh9IGRvZXMgbm90IGV4aXN0LmApO1xuICB9XG5cbiAgcmV0dXJuIHRzLmNyZWF0ZVNvdXJjZUZpbGUobW9kdWxlUGF0aCwgdGV4dC50b1N0cmluZygndXRmLTgnKSwgdHMuU2NyaXB0VGFyZ2V0LkxhdGVzdCwgdHJ1ZSk7XG59XG5cbmZ1bmN0aW9uIGFkZERlY2xhcmF0aW9uVG9OZ01vZHVsZShvcHRpb25zOiBDb21wb25lbnRPcHRpb25zKTogUnVsZSB7XG4gIHJldHVybiAoaG9zdDogVHJlZSkgPT4ge1xuICAgIGlmIChvcHRpb25zLnNraXBJbXBvcnQgfHwgb3B0aW9ucy5zdGFuZGFsb25lIHx8ICFvcHRpb25zLm1vZHVsZSkge1xuICAgICAgcmV0dXJuIGhvc3Q7XG4gICAgfVxuXG4gICAgY29uc3QgbW9kdWxlUGF0aCA9IG9wdGlvbnMubW9kdWxlO1xuICAgIGxldCBzb3VyY2UgPSByZWFkSW50b1NvdXJjZUZpbGUoaG9zdCwgbW9kdWxlUGF0aCk7XG5cbiAgICBjb25zdCBjb21wb25lbnRQYXRoID1cbiAgICAgIGAvJHtvcHRpb25zLnBhdGh9L2AgK1xuICAgICAgKG9wdGlvbnMuZmxhdCA/ICcnIDogc3RyaW5ncy5kYXNoZXJpemUob3B0aW9ucy5uYW1lKSArICcvJykgK1xuICAgICAgc3RyaW5ncy5kYXNoZXJpemUob3B0aW9ucy5uYW1lKSArXG4gICAgICAnLmNvbXBvbmVudCc7XG4gICAgY29uc3QgcmVsYXRpdmVQYXRoID0gYnVpbGRSZWxhdGl2ZVBhdGgobW9kdWxlUGF0aCwgY29tcG9uZW50UGF0aCk7XG4gICAgY29uc3QgY2xhc3NpZmllZE5hbWUgPSBzdHJpbmdzLmNsYXNzaWZ5KGAke29wdGlvbnMubmFtZX1Db21wb25lbnRgKTtcblxuICAgIGNvbnN0IGRlY2xhcmF0aW9uQ2hhbmdlcyA9IGFkZERlY2xhcmF0aW9uVG9Nb2R1bGUoXG4gICAgICBzb3VyY2UsXG4gICAgICBtb2R1bGVQYXRoLFxuICAgICAgY2xhc3NpZmllZE5hbWUsXG4gICAgICByZWxhdGl2ZVBhdGgsXG4gICAgKTtcblxuICAgIGNvbnN0IGRlY2xhcmF0aW9uUmVjb3JkZXIgPSBob3N0LmJlZ2luVXBkYXRlKG1vZHVsZVBhdGgpO1xuICAgIGZvciAoY29uc3QgY2hhbmdlIG9mIGRlY2xhcmF0aW9uQ2hhbmdlcykge1xuICAgICAgaWYgKGNoYW5nZSBpbnN0YW5jZW9mIEluc2VydENoYW5nZSkge1xuICAgICAgICBkZWNsYXJhdGlvblJlY29yZGVyLmluc2VydExlZnQoY2hhbmdlLnBvcywgY2hhbmdlLnRvQWRkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaG9zdC5jb21taXRVcGRhdGUoZGVjbGFyYXRpb25SZWNvcmRlcik7XG5cbiAgICBpZiAob3B0aW9ucy5leHBvcnQpIHtcbiAgICAgIC8vIE5lZWQgdG8gcmVmcmVzaCB0aGUgQVNUIGJlY2F1c2Ugd2Ugb3Zlcndyb3RlIHRoZSBmaWxlIGluIHRoZSBob3N0LlxuICAgICAgc291cmNlID0gcmVhZEludG9Tb3VyY2VGaWxlKGhvc3QsIG1vZHVsZVBhdGgpO1xuXG4gICAgICBjb25zdCBleHBvcnRSZWNvcmRlciA9IGhvc3QuYmVnaW5VcGRhdGUobW9kdWxlUGF0aCk7XG4gICAgICBjb25zdCBleHBvcnRDaGFuZ2VzID0gYWRkRXhwb3J0VG9Nb2R1bGUoXG4gICAgICAgIHNvdXJjZSxcbiAgICAgICAgbW9kdWxlUGF0aCxcbiAgICAgICAgc3RyaW5ncy5jbGFzc2lmeShgJHtvcHRpb25zLm5hbWV9Q29tcG9uZW50YCksXG4gICAgICAgIHJlbGF0aXZlUGF0aCxcbiAgICAgICk7XG5cbiAgICAgIGZvciAoY29uc3QgY2hhbmdlIG9mIGV4cG9ydENoYW5nZXMpIHtcbiAgICAgICAgaWYgKGNoYW5nZSBpbnN0YW5jZW9mIEluc2VydENoYW5nZSkge1xuICAgICAgICAgIGV4cG9ydFJlY29yZGVyLmluc2VydExlZnQoY2hhbmdlLnBvcywgY2hhbmdlLnRvQWRkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaG9zdC5jb21taXRVcGRhdGUoZXhwb3J0UmVjb3JkZXIpO1xuICAgIH1cblxuICAgIHJldHVybiBob3N0O1xuICB9O1xufVxuXG5mdW5jdGlvbiBidWlsZFNlbGVjdG9yKG9wdGlvbnM6IENvbXBvbmVudE9wdGlvbnMsIHByb2plY3RQcmVmaXg/OiBzdHJpbmcpIHtcbiAgbGV0IHNlbGVjdG9yID0gc3RyaW5ncy5kYXNoZXJpemUob3B0aW9ucy5uYW1lKTtcbiAgaWYgKG9wdGlvbnMucHJlZml4KSB7XG4gICAgc2VsZWN0b3IgPSBgJHtvcHRpb25zLnByZWZpeH0tJHtzZWxlY3Rvcn1gO1xuICB9IGVsc2UgaWYgKG9wdGlvbnMucHJlZml4ID09PSB1bmRlZmluZWQgJiYgcHJvamVjdFByZWZpeCkge1xuICAgIHNlbGVjdG9yID0gYCR7cHJvamVjdFByZWZpeH0tJHtzZWxlY3Rvcn1gO1xuICB9XG5cbiAgcmV0dXJuIHNlbGVjdG9yO1xufVxuXG4vKipcbiAqIEluZGVudHMgdGhlIHRleHQgY29udGVudCB3aXRoIHRoZSBhbW91bnQgb2Ygc3BlY2lmaWVkIHNwYWNlcy4gVGhlIHNwYWNlcyB3aWxsIGJlIGFkZGVkIGFmdGVyXG4gKiBldmVyeSBsaW5lLWJyZWFrLiBUaGlzIHV0aWxpdHkgZnVuY3Rpb24gY2FuIGJlIHVzZWQgaW5zaWRlIG9mIEVKUyB0ZW1wbGF0ZXMgdG8gcHJvcGVybHlcbiAqIGluY2x1ZGUgdGhlIGFkZGl0aW9uYWwgZmlsZXMuXG4gKi9cbmZ1bmN0aW9uIGluZGVudFRleHRDb250ZW50KHRleHQ6IHN0cmluZywgbnVtU3BhY2VzOiBudW1iZXIpOiBzdHJpbmcge1xuICAvLyBJbiB0aGUgTWF0ZXJpYWwgcHJvamVjdCB0aGVyZSBzaG91bGQgYmUgb25seSBMRiBsaW5lLWVuZGluZ3MsIGJ1dCB0aGUgc2NoZW1hdGljIGZpbGVzXG4gIC8vIGFyZSBub3QgYmVpbmcgbGludGVkIGFuZCB0aGVyZWZvcmUgdGhlcmUgY2FuIGJlIGFsc28gQ1JMRiBvciBqdXN0IENSIGxpbmUtZW5kaW5ncy5cbiAgcmV0dXJuIHRleHQucmVwbGFjZSgvKFxcclxcbnxcXHJ8XFxuKS9nLCBgJDEkeycgJy5yZXBlYXQobnVtU3BhY2VzKX1gKTtcbn1cblxuLyoqXG4gKiBSdWxlIHRoYXQgY29waWVzIGFuZCBpbnRlcnBvbGF0ZXMgdGhlIGZpbGVzIHRoYXQgYmVsb25nIHRvIHRoaXMgc2NoZW1hdGljIGNvbnRleHQuIEFkZGl0aW9uYWxseVxuICogYSBsaXN0IG9mIGZpbGUgcGF0aHMgY2FuIGJlIHBhc3NlZCB0byB0aGlzIHJ1bGUgaW4gb3JkZXIgdG8gZXhwb3NlIHRoZW0gaW5zaWRlIHRoZSBFSlNcbiAqIHRlbXBsYXRlIGNvbnRleHQuXG4gKlxuICogVGhpcyBhbGxvd3MgaW5saW5pbmcgdGhlIGV4dGVybmFsIHRlbXBsYXRlIG9yIHN0eWxlc2hlZXQgZmlsZXMgaW4gRUpTIHdpdGhvdXQgaGF2aW5nXG4gKiB0byBtYW51YWxseSBkdXBsaWNhdGUgdGhlIGZpbGUgY29udGVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkQ29tcG9uZW50KFxuICBvcHRpb25zOiBDb21wb25lbnRPcHRpb25zLFxuICBhZGRpdGlvbmFsRmlsZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9ID0ge30sXG4pOiBSdWxlIHtcbiAgcmV0dXJuIGFzeW5jIChob3N0LCBjdHgpID0+IHtcbiAgICBjb25zdCBjb250ZXh0ID0gY3R4IGFzIEZpbGVTeXN0ZW1TY2hlbWF0aWNDb250ZXh0O1xuICAgIGNvbnN0IHdvcmtzcGFjZSA9IGF3YWl0IGdldFdvcmtzcGFjZShob3N0KTtcbiAgICBjb25zdCBwcm9qZWN0ID0gZ2V0UHJvamVjdEZyb21Xb3Jrc3BhY2Uod29ya3NwYWNlLCBvcHRpb25zLnByb2plY3QpO1xuICAgIGNvbnN0IGRlZmF1bHRDb21wb25lbnRPcHRpb25zID0gZ2V0RGVmYXVsdENvbXBvbmVudE9wdGlvbnMocHJvamVjdCk7XG5cbiAgICAvLyBUT0RPKGRldnZlcnNpb24pOiBSZW1vdmUgaWYgd2UgZHJvcCBzdXBwb3J0IGZvciBvbGRlciBDTEkgdmVyc2lvbnMuXG4gICAgLy8gVGhpcyBoYW5kbGVzIGFuIHVucmVwb3J0ZWQgYnJlYWtpbmcgY2hhbmdlIGZyb20gdGhlIEBhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzLiBQcmV2aW91c2x5XG4gICAgLy8gdGhlIGRlc2NyaXB0aW9uIHBhdGggcmVzb2x2ZWQgdG8gdGhlIGZhY3RvcnkgZmlsZSwgYnV0IHN0YXJ0aW5nIGZyb20gNi4yLjAsIGl0IHJlc29sdmVzXG4gICAgLy8gdG8gdGhlIGZhY3RvcnkgZGlyZWN0b3J5LlxuICAgIGNvbnN0IHNjaGVtYXRpY1BhdGggPSBzdGF0U3luYyhjb250ZXh0LnNjaGVtYXRpYy5kZXNjcmlwdGlvbi5wYXRoKS5pc0RpcmVjdG9yeSgpXG4gICAgICA/IGNvbnRleHQuc2NoZW1hdGljLmRlc2NyaXB0aW9uLnBhdGhcbiAgICAgIDogZGlybmFtZShjb250ZXh0LnNjaGVtYXRpYy5kZXNjcmlwdGlvbi5wYXRoKTtcblxuICAgIGNvbnN0IHNjaGVtYXRpY0ZpbGVzVXJsID0gJy4vZmlsZXMnO1xuICAgIGNvbnN0IHNjaGVtYXRpY0ZpbGVzUGF0aCA9IHJlc29sdmUoc2NoZW1hdGljUGF0aCwgc2NoZW1hdGljRmlsZXNVcmwpO1xuXG4gICAgLy8gQWRkIHRoZSBkZWZhdWx0IGNvbXBvbmVudCBvcHRpb24gdmFsdWVzIHRvIHRoZSBvcHRpb25zIGlmIGFuIG9wdGlvbiBpcyBub3QgZXhwbGljaXRseVxuICAgIC8vIHNwZWNpZmllZCBidXQgYSBkZWZhdWx0IGNvbXBvbmVudCBvcHRpb24gaXMgYXZhaWxhYmxlLlxuICAgIE9iamVjdC5rZXlzKG9wdGlvbnMpXG4gICAgICAuZmlsdGVyKFxuICAgICAgICBrZXkgPT5cbiAgICAgICAgICBvcHRpb25zW2tleSBhcyBrZXlvZiBDb21wb25lbnRPcHRpb25zXSA9PSBudWxsICYmXG4gICAgICAgICAgZGVmYXVsdENvbXBvbmVudE9wdGlvbnNba2V5IGFzIGtleW9mIENvbXBvbmVudE9wdGlvbnNdLFxuICAgICAgKVxuICAgICAgLmZvckVhY2goXG4gICAgICAgIGtleSA9PlxuICAgICAgICAgICgob3B0aW9ucyBhcyBhbnkpW2tleV0gPSAoZGVmYXVsdENvbXBvbmVudE9wdGlvbnMgYXMgQ29tcG9uZW50T3B0aW9ucylbXG4gICAgICAgICAgICBrZXkgYXMga2V5b2YgQ29tcG9uZW50T3B0aW9uc1xuICAgICAgICAgIF0pLFxuICAgICAgKTtcblxuICAgIGlmIChvcHRpb25zLnBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgb3B0aW9ucy5wYXRoID0gYnVpbGREZWZhdWx0UGF0aChwcm9qZWN0KTtcbiAgICB9XG5cbiAgICBvcHRpb25zLnN0YW5kYWxvbmUgPSBhd2FpdCBpc1N0YW5kYWxvbmVTY2hlbWF0aWMoaG9zdCwgb3B0aW9ucyk7XG5cbiAgICBpZiAoIW9wdGlvbnMuc3RhbmRhbG9uZSkge1xuICAgICAgb3B0aW9ucy5tb2R1bGUgPSBmaW5kTW9kdWxlRnJvbU9wdGlvbnMoaG9zdCwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgY29uc3QgcGFyc2VkUGF0aCA9IHBhcnNlTmFtZShvcHRpb25zLnBhdGghLCBvcHRpb25zLm5hbWUpO1xuXG4gICAgb3B0aW9ucy5uYW1lID0gcGFyc2VkUGF0aC5uYW1lO1xuICAgIG9wdGlvbnMucGF0aCA9IHBhcnNlZFBhdGgucGF0aDtcbiAgICBvcHRpb25zLnNlbGVjdG9yID0gb3B0aW9ucy5zZWxlY3RvciB8fCBidWlsZFNlbGVjdG9yKG9wdGlvbnMsIHByb2plY3QucHJlZml4KTtcblxuICAgIHZhbGlkYXRlSHRtbFNlbGVjdG9yKG9wdGlvbnMuc2VsZWN0b3IhKTtcblxuICAgIC8vIEluIGNhc2UgdGhlIHNwZWNpZmllZCBzdHlsZSBleHRlbnNpb24gaXMgbm90IHBhcnQgb2YgdGhlIHN1cHBvcnRlZCBDU1Mgc3VwZXJzZXRzLFxuICAgIC8vIHdlIGdlbmVyYXRlIHRoZSBzdHlsZXNoZWV0cyB3aXRoIHRoZSBcImNzc1wiIGV4dGVuc2lvbi4gVGhpcyBlbnN1cmVzIHRoYXQgd2UgZG9uJ3RcbiAgICAvLyBhY2NpZGVudGFsbHkgZ2VuZXJhdGUgaW52YWxpZCBzdHlsZXNoZWV0cyAoZS5nLiBkcmFnLWRyb3AtY29tcC5zdHlsKSB3aGljaCB3aWxsXG4gICAgLy8gYnJlYWsgdGhlIEFuZ3VsYXIgQ0xJIHByb2plY3QuIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvY29tcG9uZW50cy9pc3N1ZXMvMTUxNjRcbiAgICBpZiAoIXN1cHBvcnRlZENzc0V4dGVuc2lvbnMuaW5jbHVkZXMob3B0aW9ucy5zdHlsZSEpKSB7XG4gICAgICBvcHRpb25zLnN0eWxlID0gU3R5bGUuQ3NzO1xuICAgIH1cblxuICAgIC8vIE9iamVjdCB0aGF0IHdpbGwgYmUgdXNlZCBhcyBjb250ZXh0IGZvciB0aGUgRUpTIHRlbXBsYXRlcy5cbiAgICBjb25zdCBiYXNlVGVtcGxhdGVDb250ZXh0ID0ge1xuICAgICAgLi4uc3RyaW5ncyxcbiAgICAgICdpZi1mbGF0JzogKHM6IHN0cmluZykgPT4gKG9wdGlvbnMuZmxhdCA/ICcnIDogcyksXG4gICAgICAuLi5vcHRpb25zLFxuICAgIH07XG5cbiAgICAvLyBLZXktdmFsdWUgb2JqZWN0IHRoYXQgaW5jbHVkZXMgdGhlIHNwZWNpZmllZCBhZGRpdGlvbmFsIGZpbGVzIHdpdGggdGhlaXIgbG9hZGVkIGNvbnRlbnQuXG4gICAgLy8gVGhlIHJlc29sdmVkIGNvbnRlbnRzIGNhbiBiZSB1c2VkIGluc2lkZSBFSlMgdGVtcGxhdGVzLlxuICAgIGNvbnN0IHJlc29sdmVkRmlsZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcblxuICAgIGZvciAobGV0IGtleSBpbiBhZGRpdGlvbmFsRmlsZXMpIHtcbiAgICAgIGlmIChhZGRpdGlvbmFsRmlsZXNba2V5XSkge1xuICAgICAgICBjb25zdCBmaWxlQ29udGVudCA9IHJlYWRGaWxlU3luYyhqb2luKHNjaGVtYXRpY0ZpbGVzUGF0aCwgYWRkaXRpb25hbEZpbGVzW2tleV0pLCAndXRmLTgnKTtcblxuICAgICAgICAvLyBJbnRlcnBvbGF0ZSB0aGUgYWRkaXRpb25hbCBmaWxlcyB3aXRoIHRoZSBiYXNlIEVKUyB0ZW1wbGF0ZSBjb250ZXh0LlxuICAgICAgICByZXNvbHZlZEZpbGVzW2tleV0gPSBpbnRlcnBvbGF0ZVRlbXBsYXRlKGZpbGVDb250ZW50KShiYXNlVGVtcGxhdGVDb250ZXh0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCB0ZW1wbGF0ZVNvdXJjZSA9IGFwcGx5KHVybChzY2hlbWF0aWNGaWxlc1VybCksIFtcbiAgICAgIG9wdGlvbnMuc2tpcFRlc3RzID8gZmlsdGVyKHBhdGggPT4gIXBhdGguZW5kc1dpdGgoJy5zcGVjLnRzLnRlbXBsYXRlJykpIDogbm9vcCgpLFxuICAgICAgb3B0aW9ucy5pbmxpbmVTdHlsZSA/IGZpbHRlcihwYXRoID0+ICFwYXRoLmVuZHNXaXRoKCcuX19zdHlsZV9fLnRlbXBsYXRlJykpIDogbm9vcCgpLFxuICAgICAgb3B0aW9ucy5pbmxpbmVUZW1wbGF0ZSA/IGZpbHRlcihwYXRoID0+ICFwYXRoLmVuZHNXaXRoKCcuaHRtbC50ZW1wbGF0ZScpKSA6IG5vb3AoKSxcbiAgICAgIC8vIFRyZWF0IHRoZSB0ZW1wbGF0ZSBvcHRpb25zIGFzIGFueSwgYmVjYXVzZSB0aGUgdHlwZSBkZWZpbml0aW9uIGZvciB0aGUgdGVtcGxhdGUgb3B0aW9uc1xuICAgICAgLy8gaXMgbWFkZSB1bm5lY2Vzc2FyaWx5IGV4cGxpY2l0LiBFdmVyeSB0eXBlIG9mIG9iamVjdCBjYW4gYmUgdXNlZCBpbiB0aGUgRUpTIHRlbXBsYXRlLlxuICAgICAgYXBwbHlUZW1wbGF0ZXMoe2luZGVudFRleHRDb250ZW50LCByZXNvbHZlZEZpbGVzLCAuLi5iYXNlVGVtcGxhdGVDb250ZXh0fSBhcyBhbnkpLFxuICAgICAgLy8gVE9ETyhkZXZ2ZXJzaW9uKTogZmlndXJlIG91dCB3aHkgd2UgY2Fubm90IGp1c3QgcmVtb3ZlIHRoZSBmaXJzdCBwYXJhbWV0ZXJcbiAgICAgIC8vIFNlZSBmb3IgZXhhbXBsZTogYW5ndWxhci1jbGkjc2NoZW1hdGljcy9hbmd1bGFyL2NvbXBvbmVudC9pbmRleC50cyNMMTYwXG4gICAgICBtb3ZlKG51bGwgYXMgYW55LCBwYXJzZWRQYXRoLnBhdGgpLFxuICAgIF0pO1xuXG4gICAgcmV0dXJuICgpID0+XG4gICAgICBjaGFpbihbXG4gICAgICAgIGJyYW5jaEFuZE1lcmdlKGNoYWluKFthZGREZWNsYXJhdGlvblRvTmdNb2R1bGUob3B0aW9ucyksIG1lcmdlV2l0aCh0ZW1wbGF0ZVNvdXJjZSldKSksXG4gICAgICBdKShob3N0LCBjb250ZXh0KTtcbiAgfTtcbn1cbiJdfQ==