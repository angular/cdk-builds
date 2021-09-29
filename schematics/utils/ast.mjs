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
exports.findModuleFromOptions = exports.addModuleImportToModule = exports.addModuleImportToRootModule = exports.parseSourceFile = void 0;
const schematics_1 = require("@angular-devkit/schematics");
const change_1 = require("@schematics/angular/utility/change");
const workspace_1 = require("@schematics/angular/utility/workspace");
const find_module_1 = require("@schematics/angular/utility/find-module");
const ts = require("typescript");
const project_main_file_1 = require("./project-main-file");
const vendored_ast_utils_1 = require("./vendored-ast-utils");
/** Reads file given path and returns TypeScript source file. */
function parseSourceFile(host, path) {
    const buffer = host.read(path);
    if (!buffer) {
        throw new schematics_1.SchematicsException(`Could not find file for path: ${path}`);
    }
    return ts.createSourceFile(path, buffer.toString(), ts.ScriptTarget.Latest, true);
}
exports.parseSourceFile = parseSourceFile;
/** Import and add module to root app module. */
function addModuleImportToRootModule(host, moduleName, src, project) {
    const modulePath = (0, vendored_ast_utils_1.getAppModulePath)(host, (0, project_main_file_1.getProjectMainFile)(project));
    addModuleImportToModule(host, modulePath, moduleName, src);
}
exports.addModuleImportToRootModule = addModuleImportToRootModule;
/**
 * Import and add module to specific module path.
 * @param host the tree we are updating
 * @param modulePath src location of the module to import
 * @param moduleName name of module to import
 * @param src src location to import
 */
function addModuleImportToModule(host, modulePath, moduleName, src) {
    const moduleSource = parseSourceFile(host, modulePath);
    if (!moduleSource) {
        throw new schematics_1.SchematicsException(`Module not found: ${modulePath}`);
    }
    const changes = (0, vendored_ast_utils_1.addImportToModule)(moduleSource, modulePath, moduleName, src);
    const recorder = host.beginUpdate(modulePath);
    changes.forEach(change => {
        if (change instanceof change_1.InsertChange) {
            recorder.insertLeft(change.pos, change.toAdd);
        }
    });
    host.commitUpdate(recorder);
}
exports.addModuleImportToModule = addModuleImportToModule;
/** Wraps the internal find module from options with undefined path handling  */
function findModuleFromOptions(host, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const workspace = yield (0, workspace_1.getWorkspace)(host);
        if (!options.project) {
            options.project = Array.from(workspace.projects.keys())[0];
        }
        const project = workspace.projects.get(options.project);
        if (options.path === undefined) {
            options.path = `/${project.root}/src/app`;
        }
        return (0, find_module_1.findModuleFromOptions)(host, options);
    });
}
exports.findModuleFromOptions = findModuleFromOptions;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL3V0aWxzL2FzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7QUFFSCwyREFBcUU7QUFFckUsK0RBQWdFO0FBQ2hFLHFFQUFtRTtBQUNuRSx5RUFBb0c7QUFFcEcsaUNBQWlDO0FBQ2pDLDJEQUF1RDtBQUN2RCw2REFBeUU7QUFFekUsZ0VBQWdFO0FBQ2hFLFNBQWdCLGVBQWUsQ0FBQyxJQUFVLEVBQUUsSUFBWTtJQUN0RCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQy9CLElBQUksQ0FBQyxNQUFNLEVBQUU7UUFDWCxNQUFNLElBQUksZ0NBQW1CLENBQUMsaUNBQWlDLElBQUksRUFBRSxDQUFDLENBQUM7S0FDeEU7SUFDRCxPQUFPLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLEVBQUUsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3BGLENBQUM7QUFORCwwQ0FNQztBQUVELGdEQUFnRDtBQUNoRCxTQUFnQiwyQkFBMkIsQ0FBQyxJQUFVLEVBQUUsVUFBa0IsRUFBRSxHQUFXLEVBQzNDLE9BQTBCO0lBQ3BFLE1BQU0sVUFBVSxHQUFHLElBQUEscUNBQWdCLEVBQUMsSUFBSSxFQUFFLElBQUEsc0NBQWtCLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUN2RSx1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUM3RCxDQUFDO0FBSkQsa0VBSUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxTQUFnQix1QkFBdUIsQ0FBQyxJQUFVLEVBQUUsVUFBa0IsRUFBRSxVQUFrQixFQUNsRCxHQUFXO0lBRWpELE1BQU0sWUFBWSxHQUFHLGVBQWUsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFFdkQsSUFBSSxDQUFDLFlBQVksRUFBRTtRQUNqQixNQUFNLElBQUksZ0NBQW1CLENBQUMscUJBQXFCLFVBQVUsRUFBRSxDQUFDLENBQUM7S0FDbEU7SUFFRCxNQUFNLE9BQU8sR0FBRyxJQUFBLHNDQUFpQixFQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQzdFLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7SUFFOUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtRQUN2QixJQUFJLE1BQU0sWUFBWSxxQkFBWSxFQUFFO1lBQ2xDLFFBQVEsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDL0M7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDOUIsQ0FBQztBQW5CRCwwREFtQkM7QUFFRCxnRkFBZ0Y7QUFDaEYsU0FBc0IscUJBQXFCLENBQUMsSUFBVSxFQUFFLE9BQXlCOztRQUUvRSxNQUFNLFNBQVMsR0FBRyxNQUFNLElBQUEsd0JBQVksRUFBQyxJQUFJLENBQUMsQ0FBQztRQUUzQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTtZQUNwQixPQUFPLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQzVEO1FBRUQsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBRSxDQUFDO1FBRXpELElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUU7WUFDOUIsT0FBTyxDQUFDLElBQUksR0FBRyxJQUFJLE9BQU8sQ0FBQyxJQUFJLFVBQVUsQ0FBQztTQUMzQztRQUVELE9BQU8sSUFBQSxtQ0FBa0IsRUFBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDM0MsQ0FBQztDQUFBO0FBZkQsc0RBZUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge1NjaGVtYSBhcyBDb21wb25lbnRPcHRpb25zfSBmcm9tICdAc2NoZW1hdGljcy9hbmd1bGFyL2NvbXBvbmVudC9zY2hlbWEnO1xuaW1wb3J0IHtJbnNlcnRDaGFuZ2V9IGZyb20gJ0BzY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eS9jaGFuZ2UnO1xuaW1wb3J0IHtnZXRXb3Jrc3BhY2V9IGZyb20gJ0BzY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eS93b3Jrc3BhY2UnO1xuaW1wb3J0IHtmaW5kTW9kdWxlRnJvbU9wdGlvbnMgYXMgaW50ZXJuYWxGaW5kTW9kdWxlfSBmcm9tICdAc2NoZW1hdGljcy9hbmd1bGFyL3V0aWxpdHkvZmluZC1tb2R1bGUnO1xuaW1wb3J0IHtQcm9qZWN0RGVmaW5pdGlvbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUvc3JjL3dvcmtzcGFjZSc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7Z2V0UHJvamVjdE1haW5GaWxlfSBmcm9tICcuL3Byb2plY3QtbWFpbi1maWxlJztcbmltcG9ydCB7YWRkSW1wb3J0VG9Nb2R1bGUsIGdldEFwcE1vZHVsZVBhdGh9IGZyb20gJy4vdmVuZG9yZWQtYXN0LXV0aWxzJztcblxuLyoqIFJlYWRzIGZpbGUgZ2l2ZW4gcGF0aCBhbmQgcmV0dXJucyBUeXBlU2NyaXB0IHNvdXJjZSBmaWxlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU291cmNlRmlsZShob3N0OiBUcmVlLCBwYXRoOiBzdHJpbmcpOiB0cy5Tb3VyY2VGaWxlIHtcbiAgY29uc3QgYnVmZmVyID0gaG9zdC5yZWFkKHBhdGgpO1xuICBpZiAoIWJ1ZmZlcikge1xuICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKGBDb3VsZCBub3QgZmluZCBmaWxlIGZvciBwYXRoOiAke3BhdGh9YCk7XG4gIH1cbiAgcmV0dXJuIHRzLmNyZWF0ZVNvdXJjZUZpbGUocGF0aCwgYnVmZmVyLnRvU3RyaW5nKCksIHRzLlNjcmlwdFRhcmdldC5MYXRlc3QsIHRydWUpO1xufVxuXG4vKiogSW1wb3J0IGFuZCBhZGQgbW9kdWxlIHRvIHJvb3QgYXBwIG1vZHVsZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRNb2R1bGVJbXBvcnRUb1Jvb3RNb2R1bGUoaG9zdDogVHJlZSwgbW9kdWxlTmFtZTogc3RyaW5nLCBzcmM6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvamVjdDogUHJvamVjdERlZmluaXRpb24pIHtcbiAgY29uc3QgbW9kdWxlUGF0aCA9IGdldEFwcE1vZHVsZVBhdGgoaG9zdCwgZ2V0UHJvamVjdE1haW5GaWxlKHByb2plY3QpKTtcbiAgYWRkTW9kdWxlSW1wb3J0VG9Nb2R1bGUoaG9zdCwgbW9kdWxlUGF0aCwgbW9kdWxlTmFtZSwgc3JjKTtcbn1cblxuLyoqXG4gKiBJbXBvcnQgYW5kIGFkZCBtb2R1bGUgdG8gc3BlY2lmaWMgbW9kdWxlIHBhdGguXG4gKiBAcGFyYW0gaG9zdCB0aGUgdHJlZSB3ZSBhcmUgdXBkYXRpbmdcbiAqIEBwYXJhbSBtb2R1bGVQYXRoIHNyYyBsb2NhdGlvbiBvZiB0aGUgbW9kdWxlIHRvIGltcG9ydFxuICogQHBhcmFtIG1vZHVsZU5hbWUgbmFtZSBvZiBtb2R1bGUgdG8gaW1wb3J0XG4gKiBAcGFyYW0gc3JjIHNyYyBsb2NhdGlvbiB0byBpbXBvcnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZE1vZHVsZUltcG9ydFRvTW9kdWxlKGhvc3Q6IFRyZWUsIG1vZHVsZVBhdGg6IHN0cmluZywgbW9kdWxlTmFtZTogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogc3RyaW5nKSB7XG5cbiAgY29uc3QgbW9kdWxlU291cmNlID0gcGFyc2VTb3VyY2VGaWxlKGhvc3QsIG1vZHVsZVBhdGgpO1xuXG4gIGlmICghbW9kdWxlU291cmNlKSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYE1vZHVsZSBub3QgZm91bmQ6ICR7bW9kdWxlUGF0aH1gKTtcbiAgfVxuXG4gIGNvbnN0IGNoYW5nZXMgPSBhZGRJbXBvcnRUb01vZHVsZShtb2R1bGVTb3VyY2UsIG1vZHVsZVBhdGgsIG1vZHVsZU5hbWUsIHNyYyk7XG4gIGNvbnN0IHJlY29yZGVyID0gaG9zdC5iZWdpblVwZGF0ZShtb2R1bGVQYXRoKTtcblxuICBjaGFuZ2VzLmZvckVhY2goY2hhbmdlID0+IHtcbiAgICBpZiAoY2hhbmdlIGluc3RhbmNlb2YgSW5zZXJ0Q2hhbmdlKSB7XG4gICAgICByZWNvcmRlci5pbnNlcnRMZWZ0KGNoYW5nZS5wb3MsIGNoYW5nZS50b0FkZCk7XG4gICAgfVxuICB9KTtcblxuICBob3N0LmNvbW1pdFVwZGF0ZShyZWNvcmRlcik7XG59XG5cbi8qKiBXcmFwcyB0aGUgaW50ZXJuYWwgZmluZCBtb2R1bGUgZnJvbSBvcHRpb25zIHdpdGggdW5kZWZpbmVkIHBhdGggaGFuZGxpbmcgICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmluZE1vZHVsZUZyb21PcHRpb25zKGhvc3Q6IFRyZWUsIG9wdGlvbnM6IENvbXBvbmVudE9wdGlvbnMpOlxuICBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4ge1xuICBjb25zdCB3b3Jrc3BhY2UgPSBhd2FpdCBnZXRXb3Jrc3BhY2UoaG9zdCk7XG5cbiAgaWYgKCFvcHRpb25zLnByb2plY3QpIHtcbiAgICBvcHRpb25zLnByb2plY3QgPSBBcnJheS5mcm9tKHdvcmtzcGFjZS5wcm9qZWN0cy5rZXlzKCkpWzBdO1xuICB9XG5cbiAgY29uc3QgcHJvamVjdCA9IHdvcmtzcGFjZS5wcm9qZWN0cy5nZXQob3B0aW9ucy5wcm9qZWN0KSE7XG5cbiAgaWYgKG9wdGlvbnMucGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgb3B0aW9ucy5wYXRoID0gYC8ke3Byb2plY3Qucm9vdH0vc3JjL2FwcGA7XG4gIH1cblxuICByZXR1cm4gaW50ZXJuYWxGaW5kTW9kdWxlKGhvc3QsIG9wdGlvbnMpO1xufVxuIl19