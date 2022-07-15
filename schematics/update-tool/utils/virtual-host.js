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
    constructor(_fileSystem) {
        this._fileSystem = _fileSystem;
        this.useCaseSensitiveFileNames = ts.sys.useCaseSensitiveFileNames;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1ob3N0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL3VwZGF0ZS10b29sL3V0aWxzL3ZpcnR1YWwtaG9zdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCxpQ0FBaUM7QUFnQ2pDOzs7R0FHRztBQUNILE1BQWEsY0FBYztJQUd6QixZQUFvQixXQUF1QjtRQUF2QixnQkFBVyxHQUFYLFdBQVcsQ0FBWTtRQUYzQyw4QkFBeUIsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLHlCQUF5QixDQUFDO0lBRWYsQ0FBQztJQUUvQyxVQUFVLENBQUMsSUFBWTtRQUNyQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDckUsQ0FBQztJQUVELFFBQVEsQ0FBQyxJQUFZO1FBQ25CLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDdEUsSUFBSSxPQUFPLEtBQUssSUFBSSxFQUFFO1lBQ3BCLE9BQU8sU0FBUyxDQUFDO1NBQ2xCO1FBQ0QsbUZBQW1GO1FBQ25GLHFGQUFxRjtRQUNyRixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFRCxhQUFhLENBQ1gsT0FBZSxFQUNmLFVBQW9CLEVBQ3BCLFFBQThCLEVBQzlCLFFBQWtCLEVBQ2xCLEtBQWM7UUFFZCxJQUFJLEVBQUUsQ0FBQyxVQUFVLEtBQUssU0FBUyxFQUFFO1lBQy9CLE1BQU0sS0FBSyxDQUNULHdFQUF3RTtnQkFDdEUsc0ZBQXNGO2dCQUN0RiwrRUFBK0UsQ0FDbEYsQ0FBQztTQUNIO1FBQ0QsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUNsQixPQUFPLEVBQ1AsVUFBVSxFQUNWLFVBQVUsRUFDVixRQUFRLEVBQ1IsSUFBSSxDQUFDLHlCQUF5QixFQUM5QixHQUFHLEVBQ0gsS0FBSyxFQUNMLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxFQUNsQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUNoQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQ25FLENBQUM7SUFDSixDQUFDO0lBRU8scUJBQXFCLENBQUMsSUFBWTtRQUN4QyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDeEUsQ0FBQztDQUNGO0FBbERELHdDQWtEQztBQUVEOzs7R0FHRztBQUNILFNBQWdCLDRCQUE0QixDQUMxQyxPQUEyQixFQUMzQixVQUFzQjtJQUV0QixNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2xELE1BQU0sV0FBVyxHQUFHLElBQUksY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBRW5ELElBQUksQ0FBQyxRQUFRLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDdkQsSUFBSSxDQUFDLGFBQWEsR0FBRyxXQUFXLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNqRSxJQUFJLENBQUMsVUFBVSxHQUFHLFdBQVcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQzNELElBQUksQ0FBQyxlQUFlLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUMxRixJQUFJLENBQUMsbUJBQW1CLEdBQUcsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDO0lBQ3JDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFdkQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBZkQsb0VBZUM7QUFFRCw4RUFBOEU7QUFDOUUsU0FBZ0IsMEJBQTBCLENBQUMsVUFBc0I7SUFDL0QsT0FBTztRQUNMLG9CQUFvQixFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDaEQsbUJBQW1CLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRztRQUM5QixVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSTtLQUN2QixDQUFDO0FBQ0osQ0FBQztBQU5ELGdFQU1DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtGaWxlU3lzdGVtfSBmcm9tICcuLi9maWxlLXN5c3RlbSc7XG5cbi8vIFdlIHVzZSBUeXBlU2NyaXB0J3MgbmF0aXZlIGB0cy5tYXRjaEZpbGVzYCB1dGlsaXR5IGZvciB0aGUgdmlydHVhbCBmaWxlIHN5c3RlbVxuLy8gaG9zdHMsIGFzIHRoYXQgZnVuY3Rpb24gaW1wbGVtZW50cyBjb21wbGV4IGxvZ2ljIGZvciBtYXRjaGluZyBmaWxlcyB3aXRoIHJlc3BlY3Rcbi8vIHRvIHJvb3QgZGlyZWN0b3J5LCBleHRlbnNpb25zLCBleGNsdWRlcywgaW5jbHVkZXMgZXRjLiBUaGUgZnVuY3Rpb24gaXMgY3VycmVudGx5XG4vLyBpbnRlcm5hbCBidXQgd2UgY2FuIHVzZSBpdCBhcyB0aGUgQVBJIG1vc3QgbGlrZWx5IHdpbGwgbm90IGNoYW5nZSBhbnkgdGltZSBzb29uLFxuLy8gbm9yIGRvZXMgaXQgc2VlbSBsaWtlIHRoaXMgaXMgYmVpbmcgbWFkZSBwdWJsaWMgYW55IHRpbWUgc29vbi5cbi8vIFJlbGF0ZWQgaXNzdWUgZm9yIHRyYWNraW5nOiBodHRwczovL2dpdGh1Yi5jb20vbWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzEzNzkzLlxuLy8gaHR0cHM6Ly9naXRodWIuY29tL21pY3Jvc29mdC9UeXBlU2NyaXB0L2Jsb2IvYjM5N2QxZmQ0YWJkMGVkZWY4NWFkZjBhZmQ5MWMwMzBiYjBiNDk1NS9zcmMvY29tcGlsZXIvdXRpbGl0aWVzLnRzI0w2MTkyXG5kZWNsYXJlIG1vZHVsZSAndHlwZXNjcmlwdCcge1xuICBleHBvcnQgaW50ZXJmYWNlIEZpbGVTeXN0ZW1FbnRyaWVzIHtcbiAgICByZWFkb25seSBmaWxlczogcmVhZG9ubHkgc3RyaW5nW107XG4gICAgcmVhZG9ubHkgZGlyZWN0b3JpZXM6IHJlYWRvbmx5IHN0cmluZ1tdO1xuICB9XG5cbiAgZXhwb3J0IGNvbnN0IG1hdGNoRmlsZXM6XG4gICAgfCB1bmRlZmluZWRcbiAgICB8ICgoXG4gICAgICAgIHBhdGg6IHN0cmluZyxcbiAgICAgICAgZXh0ZW5zaW9uczogcmVhZG9ubHkgc3RyaW5nW10gfCB1bmRlZmluZWQsXG4gICAgICAgIGV4Y2x1ZGVzOiByZWFkb25seSBzdHJpbmdbXSB8IHVuZGVmaW5lZCxcbiAgICAgICAgaW5jbHVkZXM6IHJlYWRvbmx5IHN0cmluZ1tdIHwgdW5kZWZpbmVkLFxuICAgICAgICB1c2VDYXNlU2Vuc2l0aXZlRmlsZU5hbWVzOiBib29sZWFuLFxuICAgICAgICBjdXJyZW50RGlyZWN0b3J5OiBzdHJpbmcsXG4gICAgICAgIGRlcHRoOiBudW1iZXIgfCB1bmRlZmluZWQsXG4gICAgICAgIGdldEZpbGVTeXN0ZW1FbnRyaWVzOiAocGF0aDogc3RyaW5nKSA9PiBGaWxlU3lzdGVtRW50cmllcyxcbiAgICAgICAgcmVhbHBhdGg6IChwYXRoOiBzdHJpbmcpID0+IHN0cmluZyxcbiAgICAgICAgZGlyZWN0b3J5RXhpc3RzOiAocGF0aDogc3RyaW5nKSA9PiBib29sZWFuLFxuICAgICAgKSA9PiBzdHJpbmdbXSk7XG59XG5cbi8qKlxuICogSW1wbGVtZW50YXRpb24gb2YgYSBUeXBlU2NyaXB0IHBhcnNlIGNvbmZpZyBob3N0IHRoYXQgcmVsaWVzIGZ1bGx5IG9uXG4gKiBhIGdpdmVuIHZpcnR1YWwgZmlsZSBzeXN0ZW0uXG4gKi9cbmV4cG9ydCBjbGFzcyBGaWxlU3lzdGVtSG9zdCBpbXBsZW1lbnRzIHRzLlBhcnNlQ29uZmlnSG9zdCB7XG4gIHVzZUNhc2VTZW5zaXRpdmVGaWxlTmFtZXMgPSB0cy5zeXMudXNlQ2FzZVNlbnNpdGl2ZUZpbGVOYW1lcztcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9maWxlU3lzdGVtOiBGaWxlU3lzdGVtKSB7fVxuXG4gIGZpbGVFeGlzdHMocGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2ZpbGVTeXN0ZW0uZmlsZUV4aXN0cyh0aGlzLl9maWxlU3lzdGVtLnJlc29sdmUocGF0aCkpO1xuICB9XG5cbiAgcmVhZEZpbGUocGF0aDogc3RyaW5nKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBjb250ZW50ID0gdGhpcy5fZmlsZVN5c3RlbS5yZWFkKHRoaXMuX2ZpbGVTeXN0ZW0ucmVzb2x2ZShwYXRoKSk7XG4gICAgaWYgKGNvbnRlbnQgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIC8vIFN0cmlwIEJPTSBhcyBvdGhlcndpc2UgVFNDIG1ldGhvZHMgKGUuZy4gXCJnZXRXaWR0aFwiKSB3aWxsIHJldHVybiBhbiBvZmZzZXQgd2hpY2hcbiAgICAvLyB3aGljaCBicmVha3MgdGhlIENMSSBVcGRhdGVSZWNvcmRlci4gaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9wdWxsLzMwNzE5XG4gICAgcmV0dXJuIGNvbnRlbnQucmVwbGFjZSgvXlxcdUZFRkYvLCAnJyk7XG4gIH1cblxuICByZWFkRGlyZWN0b3J5KFxuICAgIHJvb3REaXI6IHN0cmluZyxcbiAgICBleHRlbnNpb25zOiBzdHJpbmdbXSxcbiAgICBleGNsdWRlczogc3RyaW5nW10gfCB1bmRlZmluZWQsXG4gICAgaW5jbHVkZXM6IHN0cmluZ1tdLFxuICAgIGRlcHRoPzogbnVtYmVyLFxuICApOiBzdHJpbmdbXSB7XG4gICAgaWYgKHRzLm1hdGNoRmlsZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgICdVbmFibGUgdG8gcmVhZCBkaXJlY3RvcnkgaW4gdmlydHVhbCBmaWxlIHN5c3RlbSBob3N0LiBUaGlzIG1lYW5zIHRoYXQgJyArXG4gICAgICAgICAgJ1R5cGVTY3JpcHQgY2hhbmdlZCBpdHMgZmlsZSBtYXRjaGluZyBpbnRlcm5hbHMuXFxuXFxuUGxlYXNlIGNvbnNpZGVyIGRvd25ncmFkaW5nIHlvdXIgJyArXG4gICAgICAgICAgJ1R5cGVTY3JpcHQgdmVyc2lvbiwgYW5kIHJlcG9ydCBhbiBpc3N1ZSBpbiB0aGUgQW5ndWxhciBDb21wb25lbnRzIHJlcG9zaXRvcnkuJyxcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiB0cy5tYXRjaEZpbGVzKFxuICAgICAgcm9vdERpcixcbiAgICAgIGV4dGVuc2lvbnMsXG4gICAgICBleHRlbnNpb25zLFxuICAgICAgaW5jbHVkZXMsXG4gICAgICB0aGlzLnVzZUNhc2VTZW5zaXRpdmVGaWxlTmFtZXMsXG4gICAgICAnLycsXG4gICAgICBkZXB0aCxcbiAgICAgIHAgPT4gdGhpcy5fZ2V0RmlsZVN5c3RlbUVudHJpZXMocCksXG4gICAgICBwID0+IHRoaXMuX2ZpbGVTeXN0ZW0ucmVzb2x2ZShwKSxcbiAgICAgIHAgPT4gdGhpcy5fZmlsZVN5c3RlbS5kaXJlY3RvcnlFeGlzdHModGhpcy5fZmlsZVN5c3RlbS5yZXNvbHZlKHApKSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0RmlsZVN5c3RlbUVudHJpZXMocGF0aDogc3RyaW5nKTogdHMuRmlsZVN5c3RlbUVudHJpZXMge1xuICAgIHJldHVybiB0aGlzLl9maWxlU3lzdGVtLnJlYWREaXJlY3RvcnkodGhpcy5fZmlsZVN5c3RlbS5yZXNvbHZlKHBhdGgpKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBUeXBlU2NyaXB0IGNvbXBpbGVyIGhvc3QgdGhhdCBmdWxseSByZWxpZXMgZnVsbHkgb24gdGhlIGdpdmVuXG4gKiB2aXJ0dWFsIGZpbGUgc3lzdGVtLiBpLmUuIG5vIGludGVyYWN0aW9ucyB3aXRoIHRoZSB3b3JraW5nIGRpcmVjdG9yeS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZpbGVTeXN0ZW1Db21waWxlckhvc3QoXG4gIG9wdGlvbnM6IHRzLkNvbXBpbGVyT3B0aW9ucyxcbiAgZmlsZVN5c3RlbTogRmlsZVN5c3RlbSxcbik6IHRzLkNvbXBpbGVySG9zdCB7XG4gIGNvbnN0IGhvc3QgPSB0cy5jcmVhdGVDb21waWxlckhvc3Qob3B0aW9ucywgdHJ1ZSk7XG4gIGNvbnN0IHZpcnR1YWxIb3N0ID0gbmV3IEZpbGVTeXN0ZW1Ib3N0KGZpbGVTeXN0ZW0pO1xuXG4gIGhvc3QucmVhZEZpbGUgPSB2aXJ0dWFsSG9zdC5yZWFkRmlsZS5iaW5kKHZpcnR1YWxIb3N0KTtcbiAgaG9zdC5yZWFkRGlyZWN0b3J5ID0gdmlydHVhbEhvc3QucmVhZERpcmVjdG9yeS5iaW5kKHZpcnR1YWxIb3N0KTtcbiAgaG9zdC5maWxlRXhpc3RzID0gdmlydHVhbEhvc3QuZmlsZUV4aXN0cy5iaW5kKHZpcnR1YWxIb3N0KTtcbiAgaG9zdC5kaXJlY3RvcnlFeGlzdHMgPSBkaXJQYXRoID0+IGZpbGVTeXN0ZW0uZGlyZWN0b3J5RXhpc3RzKGZpbGVTeXN0ZW0ucmVzb2x2ZShkaXJQYXRoKSk7XG4gIGhvc3QuZ2V0Q3VycmVudERpcmVjdG9yeSA9ICgpID0+ICcvJztcbiAgaG9zdC5nZXRDYW5vbmljYWxGaWxlTmFtZSA9IHAgPT4gZmlsZVN5c3RlbS5yZXNvbHZlKHApO1xuXG4gIHJldHVybiBob3N0O1xufVxuXG4vKiogQ3JlYXRlcyBhIGZvcm1hdCBkaWFnbm9zdGljIGhvc3QgdGhhdCB3b3JrcyB3aXRoIHRoZSBnaXZlbiBmaWxlIHN5c3RlbS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVGb3JtYXREaWFnbm9zdGljSG9zdChmaWxlU3lzdGVtOiBGaWxlU3lzdGVtKTogdHMuRm9ybWF0RGlhZ25vc3RpY3NIb3N0IHtcbiAgcmV0dXJuIHtcbiAgICBnZXRDYW5vbmljYWxGaWxlTmFtZTogcCA9PiBmaWxlU3lzdGVtLnJlc29sdmUocCksXG4gICAgZ2V0Q3VycmVudERpcmVjdG9yeTogKCkgPT4gJy8nLFxuICAgIGdldE5ld0xpbmU6ICgpID0+ICdcXG4nLFxuICB9O1xufVxuIl19