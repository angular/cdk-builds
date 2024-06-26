"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TsconfigParseError = void 0;
exports.parseTsconfigFile = parseTsconfigFile;
const ts = require("typescript");
const virtual_host_1 = require("./virtual-host");
const path_1 = require("path");
const diagnostics_1 = require("./diagnostics");
/** Code of the error raised by TypeScript when a tsconfig doesn't match any files. */
const NO_INPUTS_ERROR_CODE = 18003;
/** Class capturing a tsconfig parse error. */
class TsconfigParseError extends Error {
}
exports.TsconfigParseError = TsconfigParseError;
/**
 * Attempts to parse the specified tsconfig file.
 *
 * @throws {TsconfigParseError} If the tsconfig could not be read or parsed.
 */
function parseTsconfigFile(tsconfigPath, fileSystem) {
    if (!fileSystem.fileExists(tsconfigPath)) {
        throw new TsconfigParseError(`Tsconfig cannot not be read: ${tsconfigPath}`);
    }
    const { config, error } = ts.readConfigFile(tsconfigPath, p => fileSystem.read(fileSystem.resolve(p)));
    // If there is a config reading error, we never attempt to parse the config.
    if (error) {
        throw new TsconfigParseError((0, diagnostics_1.formatDiagnostics)([error], fileSystem));
    }
    const parsed = ts.parseJsonConfigFileContent(config, new virtual_host_1.FileSystemHost(fileSystem), (0, path_1.dirname)(tsconfigPath), {});
    // Skip the "No inputs found..." error since we don't want to interrupt the migration if a
    // tsconfig doesn't match a file. This will result in an empty `Program` which is still valid.
    const errors = parsed.errors.filter(diag => diag.code !== NO_INPUTS_ERROR_CODE);
    if (errors.length) {
        throw new TsconfigParseError((0, diagnostics_1.formatDiagnostics)(errors, fileSystem));
    }
    return parsed;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2UtdHNjb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXBkYXRlLXRvb2wvdXRpbHMvcGFyc2UtdHNjb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBbUJILDhDQWtDQztBQW5ERCxpQ0FBaUM7QUFFakMsaURBQThDO0FBQzlDLCtCQUE2QjtBQUM3QiwrQ0FBZ0Q7QUFFaEQsc0ZBQXNGO0FBQ3RGLE1BQU0sb0JBQW9CLEdBQUcsS0FBSyxDQUFDO0FBRW5DLDhDQUE4QztBQUM5QyxNQUFhLGtCQUFtQixTQUFRLEtBQUs7Q0FBRztBQUFoRCxnREFBZ0Q7QUFFaEQ7Ozs7R0FJRztBQUNILFNBQWdCLGlCQUFpQixDQUMvQixZQUEyQixFQUMzQixVQUFzQjtJQUV0QixJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO1FBQ3pDLE1BQU0sSUFBSSxrQkFBa0IsQ0FBQyxnQ0FBZ0MsWUFBWSxFQUFFLENBQUMsQ0FBQztJQUMvRSxDQUFDO0lBRUQsTUFBTSxFQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUMsR0FBRyxFQUFFLENBQUMsY0FBYyxDQUN2QyxZQUFZLEVBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FDN0MsQ0FBQztJQUVGLDRFQUE0RTtJQUM1RSxJQUFJLEtBQUssRUFBRSxDQUFDO1FBQ1YsTUFBTSxJQUFJLGtCQUFrQixDQUFDLElBQUEsK0JBQWlCLEVBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7SUFFRCxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsMEJBQTBCLENBQzFDLE1BQU0sRUFDTixJQUFJLDZCQUFjLENBQUMsVUFBVSxDQUFDLEVBQzlCLElBQUEsY0FBTyxFQUFDLFlBQVksQ0FBQyxFQUNyQixFQUFFLENBQ0gsQ0FBQztJQUVGLDBGQUEwRjtJQUMxRiw4RkFBOEY7SUFDOUYsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLG9CQUFvQixDQUFDLENBQUM7SUFFaEYsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDbEIsTUFBTSxJQUFJLGtCQUFrQixDQUFDLElBQUEsK0JBQWlCLEVBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFDdEUsQ0FBQztJQUVELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge0ZpbGVTeXN0ZW0sIFdvcmtzcGFjZVBhdGh9IGZyb20gJy4uL2ZpbGUtc3lzdGVtJztcbmltcG9ydCB7RmlsZVN5c3RlbUhvc3R9IGZyb20gJy4vdmlydHVhbC1ob3N0JztcbmltcG9ydCB7ZGlybmFtZX0gZnJvbSAncGF0aCc7XG5pbXBvcnQge2Zvcm1hdERpYWdub3N0aWNzfSBmcm9tICcuL2RpYWdub3N0aWNzJztcblxuLyoqIENvZGUgb2YgdGhlIGVycm9yIHJhaXNlZCBieSBUeXBlU2NyaXB0IHdoZW4gYSB0c2NvbmZpZyBkb2Vzbid0IG1hdGNoIGFueSBmaWxlcy4gKi9cbmNvbnN0IE5PX0lOUFVUU19FUlJPUl9DT0RFID0gMTgwMDM7XG5cbi8qKiBDbGFzcyBjYXB0dXJpbmcgYSB0c2NvbmZpZyBwYXJzZSBlcnJvci4gKi9cbmV4cG9ydCBjbGFzcyBUc2NvbmZpZ1BhcnNlRXJyb3IgZXh0ZW5kcyBFcnJvciB7fVxuXG4vKipcbiAqIEF0dGVtcHRzIHRvIHBhcnNlIHRoZSBzcGVjaWZpZWQgdHNjb25maWcgZmlsZS5cbiAqXG4gKiBAdGhyb3dzIHtUc2NvbmZpZ1BhcnNlRXJyb3J9IElmIHRoZSB0c2NvbmZpZyBjb3VsZCBub3QgYmUgcmVhZCBvciBwYXJzZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVRzY29uZmlnRmlsZShcbiAgdHNjb25maWdQYXRoOiBXb3Jrc3BhY2VQYXRoLFxuICBmaWxlU3lzdGVtOiBGaWxlU3lzdGVtLFxuKTogdHMuUGFyc2VkQ29tbWFuZExpbmUge1xuICBpZiAoIWZpbGVTeXN0ZW0uZmlsZUV4aXN0cyh0c2NvbmZpZ1BhdGgpKSB7XG4gICAgdGhyb3cgbmV3IFRzY29uZmlnUGFyc2VFcnJvcihgVHNjb25maWcgY2Fubm90IG5vdCBiZSByZWFkOiAke3RzY29uZmlnUGF0aH1gKTtcbiAgfVxuXG4gIGNvbnN0IHtjb25maWcsIGVycm9yfSA9IHRzLnJlYWRDb25maWdGaWxlKFxuICAgIHRzY29uZmlnUGF0aCxcbiAgICBwID0+IGZpbGVTeXN0ZW0ucmVhZChmaWxlU3lzdGVtLnJlc29sdmUocCkpISxcbiAgKTtcblxuICAvLyBJZiB0aGVyZSBpcyBhIGNvbmZpZyByZWFkaW5nIGVycm9yLCB3ZSBuZXZlciBhdHRlbXB0IHRvIHBhcnNlIHRoZSBjb25maWcuXG4gIGlmIChlcnJvcikge1xuICAgIHRocm93IG5ldyBUc2NvbmZpZ1BhcnNlRXJyb3IoZm9ybWF0RGlhZ25vc3RpY3MoW2Vycm9yXSwgZmlsZVN5c3RlbSkpO1xuICB9XG5cbiAgY29uc3QgcGFyc2VkID0gdHMucGFyc2VKc29uQ29uZmlnRmlsZUNvbnRlbnQoXG4gICAgY29uZmlnLFxuICAgIG5ldyBGaWxlU3lzdGVtSG9zdChmaWxlU3lzdGVtKSxcbiAgICBkaXJuYW1lKHRzY29uZmlnUGF0aCksXG4gICAge30sXG4gICk7XG5cbiAgLy8gU2tpcCB0aGUgXCJObyBpbnB1dHMgZm91bmQuLi5cIiBlcnJvciBzaW5jZSB3ZSBkb24ndCB3YW50IHRvIGludGVycnVwdCB0aGUgbWlncmF0aW9uIGlmIGFcbiAgLy8gdHNjb25maWcgZG9lc24ndCBtYXRjaCBhIGZpbGUuIFRoaXMgd2lsbCByZXN1bHQgaW4gYW4gZW1wdHkgYFByb2dyYW1gIHdoaWNoIGlzIHN0aWxsIHZhbGlkLlxuICBjb25zdCBlcnJvcnMgPSBwYXJzZWQuZXJyb3JzLmZpbHRlcihkaWFnID0+IGRpYWcuY29kZSAhPT0gTk9fSU5QVVRTX0VSUk9SX0NPREUpO1xuXG4gIGlmIChlcnJvcnMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFRzY29uZmlnUGFyc2VFcnJvcihmb3JtYXREaWFnbm9zdGljcyhlcnJvcnMsIGZpbGVTeXN0ZW0pKTtcbiAgfVxuXG4gIHJldHVybiBwYXJzZWQ7XG59XG4iXX0=