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
        define("@angular/cdk/schematics/utils/build-component", ["require", "exports", "@angular-devkit/core", "@angular-devkit/schematics", "@schematics/angular/utility/change", "@schematics/angular/utility/config", "@schematics/angular/utility/find-module", "@schematics/angular/utility/parse-name", "@schematics/angular/utility/project", "@schematics/angular/utility/validation", "fs", "path", "typescript", "@angular/cdk/schematics/utils/vendored-ast-utils/index", "@angular/cdk/schematics/utils/get-project", "@angular/cdk/schematics/utils/schematic-options"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const core_1 = require("@angular-devkit/core");
    const schematics_1 = require("@angular-devkit/schematics");
    const change_1 = require("@schematics/angular/utility/change");
    const config_1 = require("@schematics/angular/utility/config");
    const find_module_1 = require("@schematics/angular/utility/find-module");
    const parse_name_1 = require("@schematics/angular/utility/parse-name");
    const project_1 = require("@schematics/angular/utility/project");
    const validation_1 = require("@schematics/angular/utility/validation");
    const fs_1 = require("fs");
    const path_1 = require("path");
    const ts = require("typescript");
    const vendored_ast_utils_1 = require("@angular/cdk/schematics/utils/vendored-ast-utils/index");
    const get_project_1 = require("@angular/cdk/schematics/utils/get-project");
    const schematic_options_1 = require("@angular/cdk/schematics/utils/schematic-options");
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
            if (options.entryComponent) {
                // Need to refresh the AST because we overwrote the file in the host.
                source = readIntoSourceFile(host, modulePath);
                const entryComponentRecorder = host.beginUpdate(modulePath);
                const entryComponentChanges = vendored_ast_utils_1.addEntryComponentToModule(source, modulePath, core_1.strings.classify(`${options.name}Component`), relativePath);
                for (const change of entryComponentChanges) {
                    if (change instanceof change_1.InsertChange) {
                        entryComponentRecorder.insertLeft(change.pos, change.toAdd);
                    }
                }
                host.commitUpdate(entryComponentRecorder);
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
        return (host, context) => {
            const workspace = config_1.getWorkspace(host);
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
                .filter(optionName => options[optionName] == null && defaultComponentOptions[optionName])
                .forEach(optionName => options[optionName] = defaultComponentOptions[optionName]);
            if (options.path === undefined) {
                // TODO(jelbourn): figure out if the need for this `as any` is a bug due to two different
                // incompatible `WorkspaceProject` classes in @angular-devkit
                options.path = project_1.buildDefaultPath(project);
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
            return schematics_1.chain([
                schematics_1.branchAndMerge(schematics_1.chain([
                    addDeclarationToNgModule(options),
                    schematics_1.mergeWith(templateSource),
                ])),
            ])(host, context);
        };
    }
    exports.buildComponent = buildComponent;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQtY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL3V0aWxzL2J1aWxkLWNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILCtDQUE4RTtJQUM5RSwyREFhb0M7SUFHcEMsK0RBQWdFO0lBQ2hFLCtEQUFnRTtJQUNoRSx5RUFBaUc7SUFDakcsdUVBQWlFO0lBQ2pFLGlFQUFxRTtJQUNyRSx1RUFBMEY7SUFDMUYsMkJBQTBDO0lBQzFDLCtCQUE0QztJQUM1QyxpQ0FBaUM7SUFDakMsK0ZBSXFDO0lBQ3JDLDJFQUFzRDtJQUN0RCx1RkFBK0Q7SUFFL0Q7OztPQUdHO0lBQ0gsTUFBTSxzQkFBc0IsR0FBRyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFFdkQsU0FBUyxrQkFBa0IsQ0FBQyxJQUFVLEVBQUUsVUFBa0I7UUFDeEQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNuQyxJQUFJLElBQUksS0FBSyxJQUFJLEVBQUU7WUFDakIsTUFBTSxJQUFJLGdDQUFtQixDQUFDLFFBQVEsVUFBVSxrQkFBa0IsQ0FBQyxDQUFDO1NBQ3JFO1FBRUQsT0FBTyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDL0YsQ0FBQztJQUVELFNBQVMsd0JBQXdCLENBQUMsT0FBeUI7UUFDekQsT0FBTyxDQUFDLElBQVUsRUFBRSxFQUFFO1lBQ3BCLElBQUksT0FBTyxDQUFDLFVBQVUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUU7Z0JBQ3pDLE9BQU8sSUFBSSxDQUFDO2FB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QUFDLENBQUMsQ0FBQyxtQkFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsaUJBQUksRUFBRTtnQkFDaEYsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsbUJBQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGlCQUFJLEVBQUU7Z0JBQ3BGLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLG1CQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBSSxFQUFFO2dCQUNsRiwwRkFBMEY7Z0JBQzFGLHdGQUF3RjtnQkFDeEYsMkJBQWMsQ0FBQyxnQkFBQyxpQkFBaUIsRUFBRSxhQUFhLElBQUssbUJBQW1CLENBQVEsQ0FBQztnQkFDakYsNkVBQTZFO2dCQUM3RSwwRUFBMEU7Z0JBQzFFLGlCQUFJLENBQUMsSUFBVyxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUM7YUFDbkMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxrQkFBSyxDQUFDO2dCQUNYLDJCQUFjLENBQUMsa0JBQUssQ0FBQztvQkFDbkIsd0JBQXdCLENBQUMsT0FBTyxDQUFDO29CQUNqQyxzQkFBUyxDQUFDLGNBQWMsQ0FBQztpQkFDMUIsQ0FBQyxDQUFDO2FBQ0osQ0FBQyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNwQixDQUFDLENBQUM7SUFDSixDQUFDO0lBM0ZELHdDQTJGQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge3N0cmluZ3MsIHRlbXBsYXRlIGFzIGludGVycG9sYXRlVGVtcGxhdGV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7XG4gIGFwcGx5LFxuICBhcHBseVRlbXBsYXRlcyxcbiAgYnJhbmNoQW5kTWVyZ2UsXG4gIGNoYWluLFxuICBmaWx0ZXIsXG4gIG1lcmdlV2l0aCxcbiAgbW92ZSxcbiAgbm9vcCxcbiAgUnVsZSxcbiAgU2NoZW1hdGljc0V4Y2VwdGlvbixcbiAgVHJlZSxcbiAgdXJsLFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge0ZpbGVTeXN0ZW1TY2hlbWF0aWNDb250ZXh0fSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcy90b29scyc7XG5pbXBvcnQge1NjaGVtYSBhcyBDb21wb25lbnRPcHRpb25zLCBTdHlsZX0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci9jb21wb25lbnQvc2NoZW1hJztcbmltcG9ydCB7SW5zZXJ0Q2hhbmdlfSBmcm9tICdAc2NoZW1hdGljcy9hbmd1bGFyL3V0aWxpdHkvY2hhbmdlJztcbmltcG9ydCB7Z2V0V29ya3NwYWNlfSBmcm9tICdAc2NoZW1hdGljcy9hbmd1bGFyL3V0aWxpdHkvY29uZmlnJztcbmltcG9ydCB7YnVpbGRSZWxhdGl2ZVBhdGgsIGZpbmRNb2R1bGVGcm9tT3B0aW9uc30gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L2ZpbmQtbW9kdWxlJztcbmltcG9ydCB7cGFyc2VOYW1lfSBmcm9tICdAc2NoZW1hdGljcy9hbmd1bGFyL3V0aWxpdHkvcGFyc2UtbmFtZSc7XG5pbXBvcnQge2J1aWxkRGVmYXVsdFBhdGh9IGZyb20gJ0BzY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eS9wcm9qZWN0JztcbmltcG9ydCB7dmFsaWRhdGVIdG1sU2VsZWN0b3IsIHZhbGlkYXRlTmFtZX0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L3ZhbGlkYXRpb24nO1xuaW1wb3J0IHtyZWFkRmlsZVN5bmMsIHN0YXRTeW5jfSBmcm9tICdmcyc7XG5pbXBvcnQge2Rpcm5hbWUsIGpvaW4sIHJlc29sdmV9IGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge1xuICBhZGREZWNsYXJhdGlvblRvTW9kdWxlLFxuICBhZGRFbnRyeUNvbXBvbmVudFRvTW9kdWxlLFxuICBhZGRFeHBvcnRUb01vZHVsZSxcbn0gZnJvbSAnLi4vdXRpbHMvdmVuZG9yZWQtYXN0LXV0aWxzJztcbmltcG9ydCB7Z2V0UHJvamVjdEZyb21Xb3Jrc3BhY2V9IGZyb20gJy4vZ2V0LXByb2plY3QnO1xuaW1wb3J0IHtnZXREZWZhdWx0Q29tcG9uZW50T3B0aW9uc30gZnJvbSAnLi9zY2hlbWF0aWMtb3B0aW9ucyc7XG5cbi8qKlxuICogTGlzdCBvZiBzdHlsZSBleHRlbnNpb25zIHdoaWNoIGFyZSBDU1MgY29tcGF0aWJsZS4gQWxsIHN1cHBvcnRlZCBDTEkgc3R5bGUgZXh0ZW5zaW9ucyBjYW4gYmVcbiAqIGZvdW5kIGhlcmU6IGFuZ3VsYXIvYW5ndWxhci1jbGkvbWFzdGVyL3BhY2thZ2VzL3NjaGVtYXRpY3MvYW5ndWxhci9uZy1uZXcvc2NoZW1hLmpzb24jTDExOC1MMTIyXG4gKi9cbmNvbnN0IHN1cHBvcnRlZENzc0V4dGVuc2lvbnMgPSBbJ2NzcycsICdzY3NzJywgJ2xlc3MnXTtcblxuZnVuY3Rpb24gcmVhZEludG9Tb3VyY2VGaWxlKGhvc3Q6IFRyZWUsIG1vZHVsZVBhdGg6IHN0cmluZykge1xuICBjb25zdCB0ZXh0ID0gaG9zdC5yZWFkKG1vZHVsZVBhdGgpO1xuICBpZiAodGV4dCA9PT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKGBGaWxlICR7bW9kdWxlUGF0aH0gZG9lcyBub3QgZXhpc3QuYCk7XG4gIH1cblxuICByZXR1cm4gdHMuY3JlYXRlU291cmNlRmlsZShtb2R1bGVQYXRoLCB0ZXh0LnRvU3RyaW5nKCd1dGYtOCcpLCB0cy5TY3JpcHRUYXJnZXQuTGF0ZXN0LCB0cnVlKTtcbn1cblxuZnVuY3Rpb24gYWRkRGVjbGFyYXRpb25Ub05nTW9kdWxlKG9wdGlvbnM6IENvbXBvbmVudE9wdGlvbnMpOiBSdWxlIHtcbiAgcmV0dXJuIChob3N0OiBUcmVlKSA9PiB7XG4gICAgaWYgKG9wdGlvbnMuc2tpcEltcG9ydCB8fCAhb3B0aW9ucy5tb2R1bGUpIHtcbiAgICAgIHJldHVybiBob3N0O1xuICAgIH1cblxuICAgIGNvbnN0IG1vZHVsZVBhdGggPSBvcHRpb25zLm1vZHVsZTtcbiAgICBsZXQgc291cmNlID0gcmVhZEludG9Tb3VyY2VGaWxlKGhvc3QsIG1vZHVsZVBhdGgpO1xuXG4gICAgY29uc3QgY29tcG9uZW50UGF0aCA9IGAvJHtvcHRpb25zLnBhdGh9L2BcbiAgICAgICsgKG9wdGlvbnMuZmxhdCA/ICcnIDogc3RyaW5ncy5kYXNoZXJpemUob3B0aW9ucy5uYW1lKSArICcvJylcbiAgICAgICsgc3RyaW5ncy5kYXNoZXJpemUob3B0aW9ucy5uYW1lKVxuICAgICAgKyAnLmNvbXBvbmVudCc7XG4gICAgY29uc3QgcmVsYXRpdmVQYXRoID0gYnVpbGRSZWxhdGl2ZVBhdGgobW9kdWxlUGF0aCwgY29tcG9uZW50UGF0aCk7XG4gICAgY29uc3QgY2xhc3NpZmllZE5hbWUgPSBzdHJpbmdzLmNsYXNzaWZ5KGAke29wdGlvbnMubmFtZX1Db21wb25lbnRgKTtcblxuICAgIGNvbnN0IGRlY2xhcmF0aW9uQ2hhbmdlcyA9IGFkZERlY2xhcmF0aW9uVG9Nb2R1bGUoXG4gICAgICBzb3VyY2UsXG4gICAgICBtb2R1bGVQYXRoLFxuICAgICAgY2xhc3NpZmllZE5hbWUsXG4gICAgICByZWxhdGl2ZVBhdGgpO1xuXG4gICAgY29uc3QgZGVjbGFyYXRpb25SZWNvcmRlciA9IGhvc3QuYmVnaW5VcGRhdGUobW9kdWxlUGF0aCk7XG4gICAgZm9yIChjb25zdCBjaGFuZ2Ugb2YgZGVjbGFyYXRpb25DaGFuZ2VzKSB7XG4gICAgICBpZiAoY2hhbmdlIGluc3RhbmNlb2YgSW5zZXJ0Q2hhbmdlKSB7XG4gICAgICAgIGRlY2xhcmF0aW9uUmVjb3JkZXIuaW5zZXJ0TGVmdChjaGFuZ2UucG9zLCBjaGFuZ2UudG9BZGQpO1xuICAgICAgfVxuICAgIH1cbiAgICBob3N0LmNvbW1pdFVwZGF0ZShkZWNsYXJhdGlvblJlY29yZGVyKTtcblxuICAgIGlmIChvcHRpb25zLmV4cG9ydCkge1xuICAgICAgLy8gTmVlZCB0byByZWZyZXNoIHRoZSBBU1QgYmVjYXVzZSB3ZSBvdmVyd3JvdGUgdGhlIGZpbGUgaW4gdGhlIGhvc3QuXG4gICAgICBzb3VyY2UgPSByZWFkSW50b1NvdXJjZUZpbGUoaG9zdCwgbW9kdWxlUGF0aCk7XG5cbiAgICAgIGNvbnN0IGV4cG9ydFJlY29yZGVyID0gaG9zdC5iZWdpblVwZGF0ZShtb2R1bGVQYXRoKTtcbiAgICAgIGNvbnN0IGV4cG9ydENoYW5nZXMgPSBhZGRFeHBvcnRUb01vZHVsZShcbiAgICAgICAgc291cmNlLFxuICAgICAgICBtb2R1bGVQYXRoLFxuICAgICAgICBzdHJpbmdzLmNsYXNzaWZ5KGAke29wdGlvbnMubmFtZX1Db21wb25lbnRgKSxcbiAgICAgICAgcmVsYXRpdmVQYXRoKTtcblxuICAgICAgZm9yIChjb25zdCBjaGFuZ2Ugb2YgZXhwb3J0Q2hhbmdlcykge1xuICAgICAgICBpZiAoY2hhbmdlIGluc3RhbmNlb2YgSW5zZXJ0Q2hhbmdlKSB7XG4gICAgICAgICAgZXhwb3J0UmVjb3JkZXIuaW5zZXJ0TGVmdChjaGFuZ2UucG9zLCBjaGFuZ2UudG9BZGQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBob3N0LmNvbW1pdFVwZGF0ZShleHBvcnRSZWNvcmRlcik7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuZW50cnlDb21wb25lbnQpIHtcbiAgICAgIC8vIE5lZWQgdG8gcmVmcmVzaCB0aGUgQVNUIGJlY2F1c2Ugd2Ugb3Zlcndyb3RlIHRoZSBmaWxlIGluIHRoZSBob3N0LlxuICAgICAgc291cmNlID0gcmVhZEludG9Tb3VyY2VGaWxlKGhvc3QsIG1vZHVsZVBhdGgpO1xuXG4gICAgICBjb25zdCBlbnRyeUNvbXBvbmVudFJlY29yZGVyID0gaG9zdC5iZWdpblVwZGF0ZShtb2R1bGVQYXRoKTtcbiAgICAgIGNvbnN0IGVudHJ5Q29tcG9uZW50Q2hhbmdlcyA9IGFkZEVudHJ5Q29tcG9uZW50VG9Nb2R1bGUoXG4gICAgICAgIHNvdXJjZSxcbiAgICAgICAgbW9kdWxlUGF0aCxcbiAgICAgICAgc3RyaW5ncy5jbGFzc2lmeShgJHtvcHRpb25zLm5hbWV9Q29tcG9uZW50YCksXG4gICAgICAgIHJlbGF0aXZlUGF0aCk7XG5cbiAgICAgIGZvciAoY29uc3QgY2hhbmdlIG9mIGVudHJ5Q29tcG9uZW50Q2hhbmdlcykge1xuICAgICAgICBpZiAoY2hhbmdlIGluc3RhbmNlb2YgSW5zZXJ0Q2hhbmdlKSB7XG4gICAgICAgICAgZW50cnlDb21wb25lbnRSZWNvcmRlci5pbnNlcnRMZWZ0KGNoYW5nZS5wb3MsIGNoYW5nZS50b0FkZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGhvc3QuY29tbWl0VXBkYXRlKGVudHJ5Q29tcG9uZW50UmVjb3JkZXIpO1xuICAgIH1cblxuXG4gICAgcmV0dXJuIGhvc3Q7XG4gIH07XG59XG5cblxuZnVuY3Rpb24gYnVpbGRTZWxlY3RvcihvcHRpb25zOiBDb21wb25lbnRPcHRpb25zLCBwcm9qZWN0UHJlZml4OiBzdHJpbmcpIHtcbiAgbGV0IHNlbGVjdG9yID0gc3RyaW5ncy5kYXNoZXJpemUob3B0aW9ucy5uYW1lKTtcbiAgaWYgKG9wdGlvbnMucHJlZml4KSB7XG4gICAgc2VsZWN0b3IgPSBgJHtvcHRpb25zLnByZWZpeH0tJHtzZWxlY3Rvcn1gO1xuICB9IGVsc2UgaWYgKG9wdGlvbnMucHJlZml4ID09PSB1bmRlZmluZWQgJiYgcHJvamVjdFByZWZpeCkge1xuICAgIHNlbGVjdG9yID0gYCR7cHJvamVjdFByZWZpeH0tJHtzZWxlY3Rvcn1gO1xuICB9XG5cbiAgcmV0dXJuIHNlbGVjdG9yO1xufVxuXG4vKipcbiAqIEluZGVudHMgdGhlIHRleHQgY29udGVudCB3aXRoIHRoZSBhbW91bnQgb2Ygc3BlY2lmaWVkIHNwYWNlcy4gVGhlIHNwYWNlcyB3aWxsIGJlIGFkZGVkIGFmdGVyXG4gKiBldmVyeSBsaW5lLWJyZWFrLiBUaGlzIHV0aWxpdHkgZnVuY3Rpb24gY2FuIGJlIHVzZWQgaW5zaWRlIG9mIEVKUyB0ZW1wbGF0ZXMgdG8gcHJvcGVybHlcbiAqIGluY2x1ZGUgdGhlIGFkZGl0aW9uYWwgZmlsZXMuXG4gKi9cbmZ1bmN0aW9uIGluZGVudFRleHRDb250ZW50KHRleHQ6IHN0cmluZywgbnVtU3BhY2VzOiBudW1iZXIpOiBzdHJpbmcge1xuICAvLyBJbiB0aGUgTWF0ZXJpYWwgcHJvamVjdCB0aGVyZSBzaG91bGQgYmUgb25seSBMRiBsaW5lLWVuZGluZ3MsIGJ1dCB0aGUgc2NoZW1hdGljIGZpbGVzXG4gIC8vIGFyZSBub3QgYmVpbmcgbGludGVkIGFuZCB0aGVyZWZvcmUgdGhlcmUgY2FuIGJlIGFsc28gQ1JMRiBvciBqdXN0IENSIGxpbmUtZW5kaW5ncy5cbiAgcmV0dXJuIHRleHQucmVwbGFjZSgvKFxcclxcbnxcXHJ8XFxuKS9nLCBgJDEkeycgJy5yZXBlYXQobnVtU3BhY2VzKX1gKTtcbn1cblxuLyoqXG4gKiBSdWxlIHRoYXQgY29waWVzIGFuZCBpbnRlcnBvbGF0ZXMgdGhlIGZpbGVzIHRoYXQgYmVsb25nIHRvIHRoaXMgc2NoZW1hdGljIGNvbnRleHQuIEFkZGl0aW9uYWxseVxuICogYSBsaXN0IG9mIGZpbGUgcGF0aHMgY2FuIGJlIHBhc3NlZCB0byB0aGlzIHJ1bGUgaW4gb3JkZXIgdG8gZXhwb3NlIHRoZW0gaW5zaWRlIHRoZSBFSlNcbiAqIHRlbXBsYXRlIGNvbnRleHQuXG4gKlxuICogVGhpcyBhbGxvd3MgaW5saW5pbmcgdGhlIGV4dGVybmFsIHRlbXBsYXRlIG9yIHN0eWxlc2hlZXQgZmlsZXMgaW4gRUpTIHdpdGhvdXQgaGF2aW5nXG4gKiB0byBtYW51YWxseSBkdXBsaWNhdGUgdGhlIGZpbGUgY29udGVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkQ29tcG9uZW50KG9wdGlvbnM6IENvbXBvbmVudE9wdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkaXRpb25hbEZpbGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9KTogUnVsZSB7XG5cbiAgcmV0dXJuIChob3N0OiBUcmVlLCBjb250ZXh0OiBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IHdvcmtzcGFjZSA9IGdldFdvcmtzcGFjZShob3N0KTtcbiAgICBjb25zdCBwcm9qZWN0ID0gZ2V0UHJvamVjdEZyb21Xb3Jrc3BhY2Uod29ya3NwYWNlLCBvcHRpb25zLnByb2plY3QpO1xuICAgIGNvbnN0IGRlZmF1bHRDb21wb25lbnRPcHRpb25zID0gZ2V0RGVmYXVsdENvbXBvbmVudE9wdGlvbnMocHJvamVjdCk7XG5cbiAgICAvLyBUT0RPKGRldnZlcnNpb24pOiBSZW1vdmUgaWYgd2UgZHJvcCBzdXBwb3J0IGZvciBvbGRlciBDTEkgdmVyc2lvbnMuXG4gICAgLy8gVGhpcyBoYW5kbGVzIGFuIHVucmVwb3J0ZWQgYnJlYWtpbmcgY2hhbmdlIGZyb20gdGhlIEBhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzLiBQcmV2aW91c2x5XG4gICAgLy8gdGhlIGRlc2NyaXB0aW9uIHBhdGggcmVzb2x2ZWQgdG8gdGhlIGZhY3RvcnkgZmlsZSwgYnV0IHN0YXJ0aW5nIGZyb20gNi4yLjAsIGl0IHJlc29sdmVzXG4gICAgLy8gdG8gdGhlIGZhY3RvcnkgZGlyZWN0b3J5LlxuICAgIGNvbnN0IHNjaGVtYXRpY1BhdGggPSBzdGF0U3luYyhjb250ZXh0LnNjaGVtYXRpYy5kZXNjcmlwdGlvbi5wYXRoKS5pc0RpcmVjdG9yeSgpID9cbiAgICAgICAgY29udGV4dC5zY2hlbWF0aWMuZGVzY3JpcHRpb24ucGF0aCA6XG4gICAgICAgIGRpcm5hbWUoY29udGV4dC5zY2hlbWF0aWMuZGVzY3JpcHRpb24ucGF0aCk7XG5cbiAgICBjb25zdCBzY2hlbWF0aWNGaWxlc1VybCA9ICcuL2ZpbGVzJztcbiAgICBjb25zdCBzY2hlbWF0aWNGaWxlc1BhdGggPSByZXNvbHZlKHNjaGVtYXRpY1BhdGgsIHNjaGVtYXRpY0ZpbGVzVXJsKTtcblxuICAgIC8vIEFkZCB0aGUgZGVmYXVsdCBjb21wb25lbnQgb3B0aW9uIHZhbHVlcyB0byB0aGUgb3B0aW9ucyBpZiBhbiBvcHRpb24gaXMgbm90IGV4cGxpY2l0bHlcbiAgICAvLyBzcGVjaWZpZWQgYnV0IGEgZGVmYXVsdCBjb21wb25lbnQgb3B0aW9uIGlzIGF2YWlsYWJsZS5cbiAgICBPYmplY3Qua2V5cyhvcHRpb25zKVxuICAgICAgLmZpbHRlcihvcHRpb25OYW1lID0+IG9wdGlvbnNbb3B0aW9uTmFtZV0gPT0gbnVsbCAmJiBkZWZhdWx0Q29tcG9uZW50T3B0aW9uc1tvcHRpb25OYW1lXSlcbiAgICAgIC5mb3JFYWNoKG9wdGlvbk5hbWUgPT4gb3B0aW9uc1tvcHRpb25OYW1lXSA9IGRlZmF1bHRDb21wb25lbnRPcHRpb25zW29wdGlvbk5hbWVdKTtcblxuICAgIGlmIChvcHRpb25zLnBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gVE9ETyhqZWxib3Vybik6IGZpZ3VyZSBvdXQgaWYgdGhlIG5lZWQgZm9yIHRoaXMgYGFzIGFueWAgaXMgYSBidWcgZHVlIHRvIHR3byBkaWZmZXJlbnRcbiAgICAgIC8vIGluY29tcGF0aWJsZSBgV29ya3NwYWNlUHJvamVjdGAgY2xhc3NlcyBpbiBAYW5ndWxhci1kZXZraXRcbiAgICAgIG9wdGlvbnMucGF0aCA9IGJ1aWxkRGVmYXVsdFBhdGgocHJvamVjdCBhcyBhbnkpO1xuICAgIH1cblxuICAgIG9wdGlvbnMubW9kdWxlID0gZmluZE1vZHVsZUZyb21PcHRpb25zKGhvc3QsIG9wdGlvbnMpO1xuXG4gICAgY29uc3QgcGFyc2VkUGF0aCA9IHBhcnNlTmFtZShvcHRpb25zLnBhdGghLCBvcHRpb25zLm5hbWUpO1xuXG4gICAgb3B0aW9ucy5uYW1lID0gcGFyc2VkUGF0aC5uYW1lO1xuICAgIG9wdGlvbnMucGF0aCA9IHBhcnNlZFBhdGgucGF0aDtcbiAgICBvcHRpb25zLnNlbGVjdG9yID0gb3B0aW9ucy5zZWxlY3RvciB8fCBidWlsZFNlbGVjdG9yKG9wdGlvbnMsIHByb2plY3QucHJlZml4KTtcblxuICAgIHZhbGlkYXRlTmFtZShvcHRpb25zLm5hbWUpO1xuICAgIHZhbGlkYXRlSHRtbFNlbGVjdG9yKG9wdGlvbnMuc2VsZWN0b3IhKTtcblxuICAgIC8vIEluIGNhc2UgdGhlIHNwZWNpZmllZCBzdHlsZSBleHRlbnNpb24gaXMgbm90IHBhcnQgb2YgdGhlIHN1cHBvcnRlZCBDU1Mgc3VwZXJzZXRzLFxuICAgIC8vIHdlIGdlbmVyYXRlIHRoZSBzdHlsZXNoZWV0cyB3aXRoIHRoZSBcImNzc1wiIGV4dGVuc2lvbi4gVGhpcyBlbnN1cmVzIHRoYXQgd2UgZG9uJ3RcbiAgICAvLyBhY2NpZGVudGFsbHkgZ2VuZXJhdGUgaW52YWxpZCBzdHlsZXNoZWV0cyAoZS5nLiBkcmFnLWRyb3AtY29tcC5zdHlsKSB3aGljaCB3aWxsXG4gICAgLy8gYnJlYWsgdGhlIEFuZ3VsYXIgQ0xJIHByb2plY3QuIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvY29tcG9uZW50cy9pc3N1ZXMvMTUxNjRcbiAgICBpZiAoIXN1cHBvcnRlZENzc0V4dGVuc2lvbnMuaW5jbHVkZXMob3B0aW9ucy5zdHlsZSEpKSB7XG4gICAgICAvLyBUT0RPOiBDYXN0IGlzIG5lY2Vzc2FyeSBhcyB3ZSBjYW4ndCB1c2UgdGhlIFN0eWxlIGVudW0gd2hpY2ggaGFzIGJlZW4gaW50cm9kdWNlZFxuICAgICAgLy8gd2l0aGluIENMSSB2Ny4zLjAtcmMuMC4gVGhpcyB3b3VsZCBicmVhayB0aGUgc2NoZW1hdGljIGZvciBvbGRlciBDTEkgdmVyc2lvbnMuXG4gICAgICBvcHRpb25zLnN0eWxlID0gJ2NzcycgYXMgU3R5bGU7XG4gICAgfVxuXG4gICAgLy8gT2JqZWN0IHRoYXQgd2lsbCBiZSB1c2VkIGFzIGNvbnRleHQgZm9yIHRoZSBFSlMgdGVtcGxhdGVzLlxuICAgIGNvbnN0IGJhc2VUZW1wbGF0ZUNvbnRleHQgPSB7XG4gICAgICAuLi5zdHJpbmdzLFxuICAgICAgJ2lmLWZsYXQnOiAoczogc3RyaW5nKSA9PiBvcHRpb25zLmZsYXQgPyAnJyA6IHMsXG4gICAgICAuLi5vcHRpb25zLFxuICAgIH07XG5cbiAgICAvLyBLZXktdmFsdWUgb2JqZWN0IHRoYXQgaW5jbHVkZXMgdGhlIHNwZWNpZmllZCBhZGRpdGlvbmFsIGZpbGVzIHdpdGggdGhlaXIgbG9hZGVkIGNvbnRlbnQuXG4gICAgLy8gVGhlIHJlc29sdmVkIGNvbnRlbnRzIGNhbiBiZSB1c2VkIGluc2lkZSBFSlMgdGVtcGxhdGVzLlxuICAgIGNvbnN0IHJlc29sdmVkRmlsZXMgPSB7fTtcblxuICAgIGZvciAobGV0IGtleSBpbiBhZGRpdGlvbmFsRmlsZXMpIHtcbiAgICAgIGlmIChhZGRpdGlvbmFsRmlsZXNba2V5XSkge1xuICAgICAgICBjb25zdCBmaWxlQ29udGVudCA9IHJlYWRGaWxlU3luYyhqb2luKHNjaGVtYXRpY0ZpbGVzUGF0aCwgYWRkaXRpb25hbEZpbGVzW2tleV0pLCAndXRmLTgnKTtcblxuICAgICAgICAvLyBJbnRlcnBvbGF0ZSB0aGUgYWRkaXRpb25hbCBmaWxlcyB3aXRoIHRoZSBiYXNlIEVKUyB0ZW1wbGF0ZSBjb250ZXh0LlxuICAgICAgICByZXNvbHZlZEZpbGVzW2tleV0gPSBpbnRlcnBvbGF0ZVRlbXBsYXRlKGZpbGVDb250ZW50KShiYXNlVGVtcGxhdGVDb250ZXh0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCB0ZW1wbGF0ZVNvdXJjZSA9IGFwcGx5KHVybChzY2hlbWF0aWNGaWxlc1VybCksIFtcbiAgICAgIG9wdGlvbnMuc2tpcFRlc3RzID8gZmlsdGVyKHBhdGggPT4gIXBhdGguZW5kc1dpdGgoJy5zcGVjLnRzLnRlbXBsYXRlJykpIDogbm9vcCgpLFxuICAgICAgb3B0aW9ucy5pbmxpbmVTdHlsZSA/IGZpbHRlcihwYXRoID0+ICFwYXRoLmVuZHNXaXRoKCcuX19zdHlsZV9fLnRlbXBsYXRlJykpIDogbm9vcCgpLFxuICAgICAgb3B0aW9ucy5pbmxpbmVUZW1wbGF0ZSA/IGZpbHRlcihwYXRoID0+ICFwYXRoLmVuZHNXaXRoKCcuaHRtbC50ZW1wbGF0ZScpKSA6IG5vb3AoKSxcbiAgICAgIC8vIFRyZWF0IHRoZSB0ZW1wbGF0ZSBvcHRpb25zIGFzIGFueSwgYmVjYXVzZSB0aGUgdHlwZSBkZWZpbml0aW9uIGZvciB0aGUgdGVtcGxhdGUgb3B0aW9uc1xuICAgICAgLy8gaXMgbWFkZSB1bm5lY2Vzc2FyaWx5IGV4cGxpY2l0LiBFdmVyeSB0eXBlIG9mIG9iamVjdCBjYW4gYmUgdXNlZCBpbiB0aGUgRUpTIHRlbXBsYXRlLlxuICAgICAgYXBwbHlUZW1wbGF0ZXMoe2luZGVudFRleHRDb250ZW50LCByZXNvbHZlZEZpbGVzLCAuLi5iYXNlVGVtcGxhdGVDb250ZXh0fSBhcyBhbnkpLFxuICAgICAgLy8gVE9ETyhkZXZ2ZXJzaW9uKTogZmlndXJlIG91dCB3aHkgd2UgY2Fubm90IGp1c3QgcmVtb3ZlIHRoZSBmaXJzdCBwYXJhbWV0ZXJcbiAgICAgIC8vIFNlZSBmb3IgZXhhbXBsZTogYW5ndWxhci1jbGkjc2NoZW1hdGljcy9hbmd1bGFyL2NvbXBvbmVudC9pbmRleC50cyNMMTYwXG4gICAgICBtb3ZlKG51bGwgYXMgYW55LCBwYXJzZWRQYXRoLnBhdGgpLFxuICAgIF0pO1xuXG4gICAgcmV0dXJuIGNoYWluKFtcbiAgICAgIGJyYW5jaEFuZE1lcmdlKGNoYWluKFtcbiAgICAgICAgYWRkRGVjbGFyYXRpb25Ub05nTW9kdWxlKG9wdGlvbnMpLFxuICAgICAgICBtZXJnZVdpdGgodGVtcGxhdGVTb3VyY2UpLFxuICAgICAgXSkpLFxuICAgIF0pKGhvc3QsIGNvbnRleHQpO1xuICB9O1xufVxuIl19