"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFormatDiagnosticHost = exports.createFileSystemCompilerHost = exports.FileSystemHost = void 0;
const ts = require("typescript");
/**
 * Implementation of a TypeScript parse config host that relies fully on
 * a given virtual file system.
 */
class FileSystemHost {
    _fileSystem;
    useCaseSensitiveFileNames = ts.sys.useCaseSensitiveFileNames;
    constructor(_fileSystem) {
        this._fileSystem = _fileSystem;
    }
    fileExists(path) {
        return this._fileSystem.fileExists(this._fileSystem.resolve(path));
    }
    readFile(path) {
        const content = this._fileSystem.read(this._fileSystem.resolve(path));
        if (content === null) {
            return undefined;
        }
        // Strip BOM as otherwise TSC methods (e.g. "getWidth") will return an offset which
        // which breaks the CLI UpdateRecorder. https://github.com/angular/angular/pull/30719
        return content.replace(/^\uFEFF/, '');
    }
    readDirectory(rootDir, extensions, excludes, includes, depth) {
        if (ts.matchFiles === undefined) {
            throw Error('Unable to read directory in virtual file system host. This means that ' +
                'TypeScript changed its file matching internals.\n\nPlease consider downgrading your ' +
                'TypeScript version, and report an issue in the Angular Components repository.');
        }
        return ts.matchFiles(rootDir, extensions, extensions, includes, this.useCaseSensitiveFileNames, '/', depth, p => this._getFileSystemEntries(p), p => this._fileSystem.resolve(p), p => this._fileSystem.directoryExists(this._fileSystem.resolve(p)));
    }
    _getFileSystemEntries(path) {
        return this._fileSystem.readDirectory(this._fileSystem.resolve(path));
    }
}
exports.FileSystemHost = FileSystemHost;
/**
 * Creates a TypeScript compiler host that fully relies fully on the given
 * virtual file system. i.e. no interactions with the working directory.
 */
function createFileSystemCompilerHost(options, fileSystem) {
    const host = ts.createCompilerHost(options, true);
    const virtualHost = new FileSystemHost(fileSystem);
    host.readFile = virtualHost.readFile.bind(virtualHost);
    host.readDirectory = virtualHost.readDirectory.bind(virtualHost);
    host.fileExists = virtualHost.fileExists.bind(virtualHost);
    host.directoryExists = dirPath => fileSystem.directoryExists(fileSystem.resolve(dirPath));
    host.getCurrentDirectory = () => '/';
    host.getCanonicalFileName = p => fileSystem.resolve(p);
    return host;
}
exports.createFileSystemCompilerHost = createFileSystemCompilerHost;
/** Creates a format diagnostic host that works with the given file system. */
function createFormatDiagnosticHost(fileSystem) {
    return {
        getCanonicalFileName: p => fileSystem.resolve(p),
        getCurrentDirectory: () => '/',
        getNewLine: () => '\n',
    };
}
exports.createFormatDiagnosticHost = createFormatDiagnosticHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1ob3N0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL3VwZGF0ZS10b29sL3V0aWxzL3ZpcnR1YWwtaG9zdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCxpQ0FBaUM7QUFnQ2pDOzs7R0FHRztBQUNILE1BQWEsY0FBYztJQUdMO0lBRnBCLHlCQUF5QixHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMseUJBQXlCLENBQUM7SUFFN0QsWUFBb0IsV0FBdUI7UUFBdkIsZ0JBQVcsR0FBWCxXQUFXLENBQVk7SUFBRyxDQUFDO0lBRS9DLFVBQVUsQ0FBQyxJQUFZO1FBQ3JCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNyRSxDQUFDO0lBRUQsUUFBUSxDQUFDLElBQVk7UUFDbkIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN0RSxJQUFJLE9BQU8sS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUNyQixPQUFPLFNBQVMsQ0FBQztRQUNuQixDQUFDO1FBQ0QsbUZBQW1GO1FBQ25GLHFGQUFxRjtRQUNyRixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFRCxhQUFhLENBQ1gsT0FBZSxFQUNmLFVBQW9CLEVBQ3BCLFFBQThCLEVBQzlCLFFBQWtCLEVBQ2xCLEtBQWM7UUFFZCxJQUFJLEVBQUUsQ0FBQyxVQUFVLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDaEMsTUFBTSxLQUFLLENBQ1Qsd0VBQXdFO2dCQUN0RSxzRkFBc0Y7Z0JBQ3RGLCtFQUErRSxDQUNsRixDQUFDO1FBQ0osQ0FBQztRQUNELE9BQU8sRUFBRSxDQUFDLFVBQVUsQ0FDbEIsT0FBTyxFQUNQLFVBQVUsRUFDVixVQUFVLEVBQ1YsUUFBUSxFQUNSLElBQUksQ0FBQyx5QkFBeUIsRUFDOUIsR0FBRyxFQUNILEtBQUssRUFDTCxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsRUFDbEMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFDaEMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUNuRSxDQUFDO0lBQ0osQ0FBQztJQUVPLHFCQUFxQixDQUFDLElBQVk7UUFDeEMsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3hFLENBQUM7Q0FDRjtBQWxERCx3Q0FrREM7QUFFRDs7O0dBR0c7QUFDSCxTQUFnQiw0QkFBNEIsQ0FDMUMsT0FBMkIsRUFDM0IsVUFBc0I7SUFFdEIsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNsRCxNQUFNLFdBQVcsR0FBRyxJQUFJLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUVuRCxJQUFJLENBQUMsUUFBUSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3ZELElBQUksQ0FBQyxhQUFhLEdBQUcsV0FBVyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDakUsSUFBSSxDQUFDLFVBQVUsR0FBRyxXQUFXLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUMzRCxJQUFJLENBQUMsZUFBZSxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDMUYsSUFBSSxDQUFDLG1CQUFtQixHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQztJQUNyQyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXZELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQWZELG9FQWVDO0FBRUQsOEVBQThFO0FBQzlFLFNBQWdCLDBCQUEwQixDQUFDLFVBQXNCO0lBQy9ELE9BQU87UUFDTCxvQkFBb0IsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ2hELG1CQUFtQixFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUc7UUFDOUIsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUk7S0FDdkIsQ0FBQztBQUNKLENBQUM7QUFORCxnRUFNQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7RmlsZVN5c3RlbX0gZnJvbSAnLi4vZmlsZS1zeXN0ZW0nO1xuXG4vLyBXZSB1c2UgVHlwZVNjcmlwdCdzIG5hdGl2ZSBgdHMubWF0Y2hGaWxlc2AgdXRpbGl0eSBmb3IgdGhlIHZpcnR1YWwgZmlsZSBzeXN0ZW1cbi8vIGhvc3RzLCBhcyB0aGF0IGZ1bmN0aW9uIGltcGxlbWVudHMgY29tcGxleCBsb2dpYyBmb3IgbWF0Y2hpbmcgZmlsZXMgd2l0aCByZXNwZWN0XG4vLyB0byByb290IGRpcmVjdG9yeSwgZXh0ZW5zaW9ucywgZXhjbHVkZXMsIGluY2x1ZGVzIGV0Yy4gVGhlIGZ1bmN0aW9uIGlzIGN1cnJlbnRseVxuLy8gaW50ZXJuYWwgYnV0IHdlIGNhbiB1c2UgaXQgYXMgdGhlIEFQSSBtb3N0IGxpa2VseSB3aWxsIG5vdCBjaGFuZ2UgYW55IHRpbWUgc29vbixcbi8vIG5vciBkb2VzIGl0IHNlZW0gbGlrZSB0aGlzIGlzIGJlaW5nIG1hZGUgcHVibGljIGFueSB0aW1lIHNvb24uXG4vLyBSZWxhdGVkIGlzc3VlIGZvciB0cmFja2luZzogaHR0cHM6Ly9naXRodWIuY29tL21pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy8xMzc5My5cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9taWNyb3NvZnQvVHlwZVNjcmlwdC9ibG9iL2IzOTdkMWZkNGFiZDBlZGVmODVhZGYwYWZkOTFjMDMwYmIwYjQ5NTUvc3JjL2NvbXBpbGVyL3V0aWxpdGllcy50cyNMNjE5MlxuZGVjbGFyZSBtb2R1bGUgJ3R5cGVzY3JpcHQnIHtcbiAgZXhwb3J0IGludGVyZmFjZSBGaWxlU3lzdGVtRW50cmllcyB7XG4gICAgcmVhZG9ubHkgZmlsZXM6IHJlYWRvbmx5IHN0cmluZ1tdO1xuICAgIHJlYWRvbmx5IGRpcmVjdG9yaWVzOiByZWFkb25seSBzdHJpbmdbXTtcbiAgfVxuXG4gIGV4cG9ydCBjb25zdCBtYXRjaEZpbGVzOlxuICAgIHwgdW5kZWZpbmVkXG4gICAgfCAoKFxuICAgICAgICBwYXRoOiBzdHJpbmcsXG4gICAgICAgIGV4dGVuc2lvbnM6IHJlYWRvbmx5IHN0cmluZ1tdIHwgdW5kZWZpbmVkLFxuICAgICAgICBleGNsdWRlczogcmVhZG9ubHkgc3RyaW5nW10gfCB1bmRlZmluZWQsXG4gICAgICAgIGluY2x1ZGVzOiByZWFkb25seSBzdHJpbmdbXSB8IHVuZGVmaW5lZCxcbiAgICAgICAgdXNlQ2FzZVNlbnNpdGl2ZUZpbGVOYW1lczogYm9vbGVhbixcbiAgICAgICAgY3VycmVudERpcmVjdG9yeTogc3RyaW5nLFxuICAgICAgICBkZXB0aDogbnVtYmVyIHwgdW5kZWZpbmVkLFxuICAgICAgICBnZXRGaWxlU3lzdGVtRW50cmllczogKHBhdGg6IHN0cmluZykgPT4gRmlsZVN5c3RlbUVudHJpZXMsXG4gICAgICAgIHJlYWxwYXRoOiAocGF0aDogc3RyaW5nKSA9PiBzdHJpbmcsXG4gICAgICAgIGRpcmVjdG9yeUV4aXN0czogKHBhdGg6IHN0cmluZykgPT4gYm9vbGVhbixcbiAgICAgICkgPT4gc3RyaW5nW10pO1xufVxuXG4vKipcbiAqIEltcGxlbWVudGF0aW9uIG9mIGEgVHlwZVNjcmlwdCBwYXJzZSBjb25maWcgaG9zdCB0aGF0IHJlbGllcyBmdWxseSBvblxuICogYSBnaXZlbiB2aXJ0dWFsIGZpbGUgc3lzdGVtLlxuICovXG5leHBvcnQgY2xhc3MgRmlsZVN5c3RlbUhvc3QgaW1wbGVtZW50cyB0cy5QYXJzZUNvbmZpZ0hvc3Qge1xuICB1c2VDYXNlU2Vuc2l0aXZlRmlsZU5hbWVzID0gdHMuc3lzLnVzZUNhc2VTZW5zaXRpdmVGaWxlTmFtZXM7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfZmlsZVN5c3RlbTogRmlsZVN5c3RlbSkge31cblxuICBmaWxlRXhpc3RzKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9maWxlU3lzdGVtLmZpbGVFeGlzdHModGhpcy5fZmlsZVN5c3RlbS5yZXNvbHZlKHBhdGgpKTtcbiAgfVxuXG4gIHJlYWRGaWxlKHBhdGg6IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgY29udGVudCA9IHRoaXMuX2ZpbGVTeXN0ZW0ucmVhZCh0aGlzLl9maWxlU3lzdGVtLnJlc29sdmUocGF0aCkpO1xuICAgIGlmIChjb250ZW50ID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICAvLyBTdHJpcCBCT00gYXMgb3RoZXJ3aXNlIFRTQyBtZXRob2RzIChlLmcuIFwiZ2V0V2lkdGhcIikgd2lsbCByZXR1cm4gYW4gb2Zmc2V0IHdoaWNoXG4gICAgLy8gd2hpY2ggYnJlYWtzIHRoZSBDTEkgVXBkYXRlUmVjb3JkZXIuIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvcHVsbC8zMDcxOVxuICAgIHJldHVybiBjb250ZW50LnJlcGxhY2UoL15cXHVGRUZGLywgJycpO1xuICB9XG5cbiAgcmVhZERpcmVjdG9yeShcbiAgICByb290RGlyOiBzdHJpbmcsXG4gICAgZXh0ZW5zaW9uczogc3RyaW5nW10sXG4gICAgZXhjbHVkZXM6IHN0cmluZ1tdIHwgdW5kZWZpbmVkLFxuICAgIGluY2x1ZGVzOiBzdHJpbmdbXSxcbiAgICBkZXB0aD86IG51bWJlcixcbiAgKTogc3RyaW5nW10ge1xuICAgIGlmICh0cy5tYXRjaEZpbGVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAnVW5hYmxlIHRvIHJlYWQgZGlyZWN0b3J5IGluIHZpcnR1YWwgZmlsZSBzeXN0ZW0gaG9zdC4gVGhpcyBtZWFucyB0aGF0ICcgK1xuICAgICAgICAgICdUeXBlU2NyaXB0IGNoYW5nZWQgaXRzIGZpbGUgbWF0Y2hpbmcgaW50ZXJuYWxzLlxcblxcblBsZWFzZSBjb25zaWRlciBkb3duZ3JhZGluZyB5b3VyICcgK1xuICAgICAgICAgICdUeXBlU2NyaXB0IHZlcnNpb24sIGFuZCByZXBvcnQgYW4gaXNzdWUgaW4gdGhlIEFuZ3VsYXIgQ29tcG9uZW50cyByZXBvc2l0b3J5LicsXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gdHMubWF0Y2hGaWxlcyhcbiAgICAgIHJvb3REaXIsXG4gICAgICBleHRlbnNpb25zLFxuICAgICAgZXh0ZW5zaW9ucyxcbiAgICAgIGluY2x1ZGVzLFxuICAgICAgdGhpcy51c2VDYXNlU2Vuc2l0aXZlRmlsZU5hbWVzLFxuICAgICAgJy8nLFxuICAgICAgZGVwdGgsXG4gICAgICBwID0+IHRoaXMuX2dldEZpbGVTeXN0ZW1FbnRyaWVzKHApLFxuICAgICAgcCA9PiB0aGlzLl9maWxlU3lzdGVtLnJlc29sdmUocCksXG4gICAgICBwID0+IHRoaXMuX2ZpbGVTeXN0ZW0uZGlyZWN0b3J5RXhpc3RzKHRoaXMuX2ZpbGVTeXN0ZW0ucmVzb2x2ZShwKSksXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldEZpbGVTeXN0ZW1FbnRyaWVzKHBhdGg6IHN0cmluZyk6IHRzLkZpbGVTeXN0ZW1FbnRyaWVzIHtcbiAgICByZXR1cm4gdGhpcy5fZmlsZVN5c3RlbS5yZWFkRGlyZWN0b3J5KHRoaXMuX2ZpbGVTeXN0ZW0ucmVzb2x2ZShwYXRoKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVHlwZVNjcmlwdCBjb21waWxlciBob3N0IHRoYXQgZnVsbHkgcmVsaWVzIGZ1bGx5IG9uIHRoZSBnaXZlblxuICogdmlydHVhbCBmaWxlIHN5c3RlbS4gaS5lLiBubyBpbnRlcmFjdGlvbnMgd2l0aCB0aGUgd29ya2luZyBkaXJlY3RvcnkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVGaWxlU3lzdGVtQ29tcGlsZXJIb3N0KFxuICBvcHRpb25zOiB0cy5Db21waWxlck9wdGlvbnMsXG4gIGZpbGVTeXN0ZW06IEZpbGVTeXN0ZW0sXG4pOiB0cy5Db21waWxlckhvc3Qge1xuICBjb25zdCBob3N0ID0gdHMuY3JlYXRlQ29tcGlsZXJIb3N0KG9wdGlvbnMsIHRydWUpO1xuICBjb25zdCB2aXJ0dWFsSG9zdCA9IG5ldyBGaWxlU3lzdGVtSG9zdChmaWxlU3lzdGVtKTtcblxuICBob3N0LnJlYWRGaWxlID0gdmlydHVhbEhvc3QucmVhZEZpbGUuYmluZCh2aXJ0dWFsSG9zdCk7XG4gIGhvc3QucmVhZERpcmVjdG9yeSA9IHZpcnR1YWxIb3N0LnJlYWREaXJlY3RvcnkuYmluZCh2aXJ0dWFsSG9zdCk7XG4gIGhvc3QuZmlsZUV4aXN0cyA9IHZpcnR1YWxIb3N0LmZpbGVFeGlzdHMuYmluZCh2aXJ0dWFsSG9zdCk7XG4gIGhvc3QuZGlyZWN0b3J5RXhpc3RzID0gZGlyUGF0aCA9PiBmaWxlU3lzdGVtLmRpcmVjdG9yeUV4aXN0cyhmaWxlU3lzdGVtLnJlc29sdmUoZGlyUGF0aCkpO1xuICBob3N0LmdldEN1cnJlbnREaXJlY3RvcnkgPSAoKSA9PiAnLyc7XG4gIGhvc3QuZ2V0Q2Fub25pY2FsRmlsZU5hbWUgPSBwID0+IGZpbGVTeXN0ZW0ucmVzb2x2ZShwKTtcblxuICByZXR1cm4gaG9zdDtcbn1cblxuLyoqIENyZWF0ZXMgYSBmb3JtYXQgZGlhZ25vc3RpYyBob3N0IHRoYXQgd29ya3Mgd2l0aCB0aGUgZ2l2ZW4gZmlsZSBzeXN0ZW0uICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRm9ybWF0RGlhZ25vc3RpY0hvc3QoZmlsZVN5c3RlbTogRmlsZVN5c3RlbSk6IHRzLkZvcm1hdERpYWdub3N0aWNzSG9zdCB7XG4gIHJldHVybiB7XG4gICAgZ2V0Q2Fub25pY2FsRmlsZU5hbWU6IHAgPT4gZmlsZVN5c3RlbS5yZXNvbHZlKHApLFxuICAgIGdldEN1cnJlbnREaXJlY3Rvcnk6ICgpID0+ICcvJyxcbiAgICBnZXROZXdMaW5lOiAoKSA9PiAnXFxuJyxcbiAgfTtcbn1cbiJdfQ==