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
exports.getWorkspaceConfigGracefully = exports.getTargetTsconfigPath = void 0;
const core_1 = require("@angular-devkit/core");
const reader_1 = require("@angular-devkit/core/src/workspace/json/reader");
/** Name of the default Angular CLI workspace configuration files. */
const defaultWorkspaceConfigPaths = ['/angular.json', '/.angular.json'];
/** Gets the tsconfig path from the given target within the specified project. */
function getTargetTsconfigPath(project, targetName) {
    var _a, _b, _c;
    const tsconfig = (_c = (_b = (_a = project.targets) === null || _a === void 0 ? void 0 : _a.get(targetName)) === null || _b === void 0 ? void 0 : _b.options) === null || _c === void 0 ? void 0 : _c.tsConfig;
    return tsconfig ? (0, core_1.normalize)(tsconfig) : null;
}
exports.getTargetTsconfigPath = getTargetTsconfigPath;
/** Resolve the workspace configuration of the specified tree gracefully. */
function getWorkspaceConfigGracefully(tree) {
    return __awaiter(this, void 0, void 0, function* () {
        const path = defaultWorkspaceConfigPaths.find(filePath => tree.exists(filePath));
        const configBuffer = tree.read(path);
        if (!path || !configBuffer) {
            return null;
        }
        try {
            return yield (0, reader_1.readJsonWorkspace)(path, {
                readFile: (filePath) => __awaiter(this, void 0, void 0, function* () { return tree.read(filePath).toString(); })
            });
        }
        catch (e) {
            return null;
        }
    });
}
exports.getWorkspaceConfigGracefully = getWorkspaceConfigGracefully;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdC10c2NvbmZpZy1wYXRocy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2NoZW1hdGljcy91dGlscy9wcm9qZWN0LXRzY29uZmlnLXBhdGhzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztBQUVILCtDQUErQztBQU0vQywyRUFBaUY7QUFJakYscUVBQXFFO0FBQ3JFLE1BQU0sMkJBQTJCLEdBQUcsQ0FBQyxlQUFlLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztBQUV4RSxpRkFBaUY7QUFDakYsU0FBZ0IscUJBQXFCLENBQUMsT0FBMEIsRUFDMUIsVUFBa0I7O0lBQ3RELE1BQU0sUUFBUSxHQUFHLE1BQUEsTUFBQSxNQUFBLE9BQU8sQ0FBQyxPQUFPLDBDQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsMENBQUUsT0FBTywwQ0FBRSxRQUFRLENBQUM7SUFDckUsT0FBTyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUEsZ0JBQVMsRUFBQyxRQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUN6RCxDQUFDO0FBSkQsc0RBSUM7QUFFRCw0RUFBNEU7QUFDNUUsU0FBc0IsNEJBQTRCLENBQUMsSUFBVTs7UUFDM0QsTUFBTSxJQUFJLEdBQUcsMkJBQTJCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ2pGLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSyxDQUFDLENBQUM7UUFFdEMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRTtZQUMxQixPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsSUFBSTtZQUNGLE9BQU8sTUFBTSxJQUFBLDBCQUFpQixFQUFDLElBQUksRUFBRTtnQkFDbkMsUUFBUSxFQUFFLENBQU0sUUFBUSxFQUFDLEVBQUUsZ0RBQUMsT0FBQSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBRSxDQUFDLFFBQVEsRUFBRSxDQUFBLEdBQUE7YUFDM0MsQ0FBQyxDQUFDO1NBQ3JCO1FBQUMsT0FBTyxDQUFDLEVBQUU7WUFDVixPQUFPLElBQUksQ0FBQztTQUNiO0lBQ0gsQ0FBQztDQUFBO0FBZkQsb0VBZUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtub3JtYWxpemV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7XG4gIFByb2plY3REZWZpbml0aW9uLFxuICBXb3Jrc3BhY2VEZWZpbml0aW9uLFxuICBXb3Jrc3BhY2VIb3N0LFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZS9zcmMvd29ya3NwYWNlJztcbmltcG9ydCB7cmVhZEpzb25Xb3Jrc3BhY2V9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlL3NyYy93b3Jrc3BhY2UvanNvbi9yZWFkZXInO1xuaW1wb3J0IHtUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge1dvcmtzcGFjZVBhdGh9IGZyb20gJy4uL3VwZGF0ZS10b29sL2ZpbGUtc3lzdGVtJztcblxuLyoqIE5hbWUgb2YgdGhlIGRlZmF1bHQgQW5ndWxhciBDTEkgd29ya3NwYWNlIGNvbmZpZ3VyYXRpb24gZmlsZXMuICovXG5jb25zdCBkZWZhdWx0V29ya3NwYWNlQ29uZmlnUGF0aHMgPSBbJy9hbmd1bGFyLmpzb24nLCAnLy5hbmd1bGFyLmpzb24nXTtcblxuLyoqIEdldHMgdGhlIHRzY29uZmlnIHBhdGggZnJvbSB0aGUgZ2l2ZW4gdGFyZ2V0IHdpdGhpbiB0aGUgc3BlY2lmaWVkIHByb2plY3QuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGFyZ2V0VHNjb25maWdQYXRoKHByb2plY3Q6IFByb2plY3REZWZpbml0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXROYW1lOiBzdHJpbmcpOiBXb3Jrc3BhY2VQYXRofG51bGwge1xuICBjb25zdCB0c2NvbmZpZyA9IHByb2plY3QudGFyZ2V0cz8uZ2V0KHRhcmdldE5hbWUpPy5vcHRpb25zPy50c0NvbmZpZztcbiAgcmV0dXJuIHRzY29uZmlnID8gbm9ybWFsaXplKHRzY29uZmlnIGFzIHN0cmluZykgOiBudWxsO1xufVxuXG4vKiogUmVzb2x2ZSB0aGUgd29ya3NwYWNlIGNvbmZpZ3VyYXRpb24gb2YgdGhlIHNwZWNpZmllZCB0cmVlIGdyYWNlZnVsbHkuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0V29ya3NwYWNlQ29uZmlnR3JhY2VmdWxseSh0cmVlOiBUcmVlKTogUHJvbWlzZTxXb3Jrc3BhY2VEZWZpbml0aW9ufG51bGw+IHtcbiAgY29uc3QgcGF0aCA9IGRlZmF1bHRXb3Jrc3BhY2VDb25maWdQYXRocy5maW5kKGZpbGVQYXRoID0+IHRyZWUuZXhpc3RzKGZpbGVQYXRoKSk7XG4gIGNvbnN0IGNvbmZpZ0J1ZmZlciA9IHRyZWUucmVhZChwYXRoISk7XG5cbiAgaWYgKCFwYXRoIHx8ICFjb25maWdCdWZmZXIpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHRyeSB7XG4gICAgcmV0dXJuIGF3YWl0IHJlYWRKc29uV29ya3NwYWNlKHBhdGgsIHtcbiAgICAgIHJlYWRGaWxlOiBhc3luYyBmaWxlUGF0aCA9PiB0cmVlLnJlYWQoZmlsZVBhdGgpIS50b1N0cmluZygpXG4gICAgfSBhcyBXb3Jrc3BhY2VIb3N0KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG4iXX0=