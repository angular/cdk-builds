"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevkitFileSystem = void 0;
const core_1 = require("@angular-devkit/core");
const file_system_1 = require("../update-tool/file-system");
const path = require("path");
/**
 * File system that leverages the virtual tree from the CLI devkit. This file
 * system is commonly used by `ng update` migrations that run as part of the
 * Angular CLI.
 */
class DevkitFileSystem extends file_system_1.FileSystem {
    _tree;
    _updateRecorderCache = new Map();
    constructor(_tree) {
        super();
        this._tree = _tree;
    }
    resolve(...segments) {
        // Note: We use `posix.resolve` as the devkit paths are using posix separators.
        return (0, core_1.normalize)(path.posix.resolve('/', ...segments.map(core_1.normalize)));
    }
    edit(filePath) {
        if (this._updateRecorderCache.has(filePath)) {
            return this._updateRecorderCache.get(filePath);
        }
        const recorder = this._tree.beginUpdate(filePath);
        this._updateRecorderCache.set(filePath, recorder);
        return recorder;
    }
    commitEdits() {
        this._updateRecorderCache.forEach(r => this._tree.commitUpdate(r));
        this._updateRecorderCache.clear();
    }
    fileExists(filePath) {
        return this._tree.exists(filePath);
    }
    directoryExists(dirPath) {
        // The devkit tree does not expose an API for checking whether a given
        // directory exists. It throws a specific error though if a directory
        // is being read as a file. We use that to check if a directory exists.
        try {
            this._tree.get(dirPath);
        }
        catch (e) {
            // Note: We do not use an `instanceof` check here. It could happen that
            // the devkit version used by the CLI is different than the one we end up
            // loading. This can happen depending on how Yarn/NPM hoists the NPM
            // packages / whether there are multiple versions installed. Typescript
            // throws a compilation error if the type isn't specified and we can't
            // check the type, so we have to cast the error output to any.
            if (e.constructor.name === 'PathIsDirectoryException') {
                return true;
            }
        }
        return false;
    }
    overwrite(filePath, content) {
        this._tree.overwrite(filePath, content);
    }
    create(filePath, content) {
        this._tree.create(filePath, content);
    }
    delete(filePath) {
        this._tree.delete(filePath);
    }
    read(filePath) {
        const buffer = this._tree.read(filePath);
        return buffer !== null ? buffer.toString() : null;
    }
    readDirectory(dirPath) {
        const { subdirs: directories, subfiles: files } = this._tree.getDir(dirPath);
        return { directories, files };
    }
}
exports.DevkitFileSystem = DevkitFileSystem;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2a2l0LWZpbGUtc3lzdGVtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL25nLXVwZGF0ZS9kZXZraXQtZmlsZS1zeXN0ZW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsK0NBQXFEO0FBRXJELDREQUFzRTtBQUN0RSw2QkFBNkI7QUFFN0I7Ozs7R0FJRztBQUNILE1BQWEsZ0JBQWlCLFNBQVEsd0JBQVU7SUFHMUI7SUFGWixvQkFBb0IsR0FBRyxJQUFJLEdBQUcsRUFBMEIsQ0FBQztJQUVqRSxZQUFvQixLQUFXO1FBQzdCLEtBQUssRUFBRSxDQUFDO1FBRFUsVUFBSyxHQUFMLEtBQUssQ0FBTTtJQUUvQixDQUFDO0lBRUQsT0FBTyxDQUFDLEdBQUcsUUFBa0I7UUFDM0IsK0VBQStFO1FBQy9FLE9BQU8sSUFBQSxnQkFBUyxFQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsZ0JBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4RSxDQUFDO0lBRUQsSUFBSSxDQUFDLFFBQWM7UUFDakIsSUFBSSxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQzNDLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUUsQ0FBQztTQUNqRDtRQUNELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2xELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ2xELE9BQU8sUUFBUSxDQUFDO0lBQ2xCLENBQUM7SUFFRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3BDLENBQUM7SUFFRCxVQUFVLENBQUMsUUFBYztRQUN2QixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3JDLENBQUM7SUFFRCxlQUFlLENBQUMsT0FBYTtRQUMzQixzRUFBc0U7UUFDdEUscUVBQXFFO1FBQ3JFLHVFQUF1RTtRQUN2RSxJQUFJO1lBQ0YsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDekI7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNWLHVFQUF1RTtZQUN2RSx5RUFBeUU7WUFDekUsb0VBQW9FO1lBQ3BFLHVFQUF1RTtZQUN2RSxzRUFBc0U7WUFDdEUsOERBQThEO1lBQzlELElBQUssQ0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEtBQUssMEJBQTBCLEVBQUU7Z0JBQzlELE9BQU8sSUFBSSxDQUFDO2FBQ2I7U0FDRjtRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVELFNBQVMsQ0FBQyxRQUFjLEVBQUUsT0FBZTtRQUN2QyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVELE1BQU0sQ0FBQyxRQUFjLEVBQUUsT0FBZTtRQUNwQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVELE1BQU0sQ0FBQyxRQUFjO1FBQ25CLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFRCxJQUFJLENBQUMsUUFBYztRQUNqQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN6QyxPQUFPLE1BQU0sS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ3BELENBQUM7SUFFRCxhQUFhLENBQUMsT0FBYTtRQUN6QixNQUFNLEVBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDM0UsT0FBTyxFQUFDLFdBQVcsRUFBRSxLQUFLLEVBQUMsQ0FBQztJQUM5QixDQUFDO0NBQ0Y7QUF2RUQsNENBdUVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7bm9ybWFsaXplLCBQYXRofSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQge1RyZWUsIFVwZGF0ZVJlY29yZGVyfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge0RpcmVjdG9yeUVudHJ5LCBGaWxlU3lzdGVtfSBmcm9tICcuLi91cGRhdGUtdG9vbC9maWxlLXN5c3RlbSc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG4vKipcbiAqIEZpbGUgc3lzdGVtIHRoYXQgbGV2ZXJhZ2VzIHRoZSB2aXJ0dWFsIHRyZWUgZnJvbSB0aGUgQ0xJIGRldmtpdC4gVGhpcyBmaWxlXG4gKiBzeXN0ZW0gaXMgY29tbW9ubHkgdXNlZCBieSBgbmcgdXBkYXRlYCBtaWdyYXRpb25zIHRoYXQgcnVuIGFzIHBhcnQgb2YgdGhlXG4gKiBBbmd1bGFyIENMSS5cbiAqL1xuZXhwb3J0IGNsYXNzIERldmtpdEZpbGVTeXN0ZW0gZXh0ZW5kcyBGaWxlU3lzdGVtIHtcbiAgcHJpdmF0ZSBfdXBkYXRlUmVjb3JkZXJDYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBVcGRhdGVSZWNvcmRlcj4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF90cmVlOiBUcmVlKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIHJlc29sdmUoLi4uc2VnbWVudHM6IHN0cmluZ1tdKTogUGF0aCB7XG4gICAgLy8gTm90ZTogV2UgdXNlIGBwb3NpeC5yZXNvbHZlYCBhcyB0aGUgZGV2a2l0IHBhdGhzIGFyZSB1c2luZyBwb3NpeCBzZXBhcmF0b3JzLlxuICAgIHJldHVybiBub3JtYWxpemUocGF0aC5wb3NpeC5yZXNvbHZlKCcvJywgLi4uc2VnbWVudHMubWFwKG5vcm1hbGl6ZSkpKTtcbiAgfVxuXG4gIGVkaXQoZmlsZVBhdGg6IFBhdGgpIHtcbiAgICBpZiAodGhpcy5fdXBkYXRlUmVjb3JkZXJDYWNoZS5oYXMoZmlsZVBhdGgpKSB7XG4gICAgICByZXR1cm4gdGhpcy5fdXBkYXRlUmVjb3JkZXJDYWNoZS5nZXQoZmlsZVBhdGgpITtcbiAgICB9XG4gICAgY29uc3QgcmVjb3JkZXIgPSB0aGlzLl90cmVlLmJlZ2luVXBkYXRlKGZpbGVQYXRoKTtcbiAgICB0aGlzLl91cGRhdGVSZWNvcmRlckNhY2hlLnNldChmaWxlUGF0aCwgcmVjb3JkZXIpO1xuICAgIHJldHVybiByZWNvcmRlcjtcbiAgfVxuXG4gIGNvbW1pdEVkaXRzKCkge1xuICAgIHRoaXMuX3VwZGF0ZVJlY29yZGVyQ2FjaGUuZm9yRWFjaChyID0+IHRoaXMuX3RyZWUuY29tbWl0VXBkYXRlKHIpKTtcbiAgICB0aGlzLl91cGRhdGVSZWNvcmRlckNhY2hlLmNsZWFyKCk7XG4gIH1cblxuICBmaWxlRXhpc3RzKGZpbGVQYXRoOiBQYXRoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3RyZWUuZXhpc3RzKGZpbGVQYXRoKTtcbiAgfVxuXG4gIGRpcmVjdG9yeUV4aXN0cyhkaXJQYXRoOiBQYXRoKSB7XG4gICAgLy8gVGhlIGRldmtpdCB0cmVlIGRvZXMgbm90IGV4cG9zZSBhbiBBUEkgZm9yIGNoZWNraW5nIHdoZXRoZXIgYSBnaXZlblxuICAgIC8vIGRpcmVjdG9yeSBleGlzdHMuIEl0IHRocm93cyBhIHNwZWNpZmljIGVycm9yIHRob3VnaCBpZiBhIGRpcmVjdG9yeVxuICAgIC8vIGlzIGJlaW5nIHJlYWQgYXMgYSBmaWxlLiBXZSB1c2UgdGhhdCB0byBjaGVjayBpZiBhIGRpcmVjdG9yeSBleGlzdHMuXG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuX3RyZWUuZ2V0KGRpclBhdGgpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIC8vIE5vdGU6IFdlIGRvIG5vdCB1c2UgYW4gYGluc3RhbmNlb2ZgIGNoZWNrIGhlcmUuIEl0IGNvdWxkIGhhcHBlbiB0aGF0XG4gICAgICAvLyB0aGUgZGV2a2l0IHZlcnNpb24gdXNlZCBieSB0aGUgQ0xJIGlzIGRpZmZlcmVudCB0aGFuIHRoZSBvbmUgd2UgZW5kIHVwXG4gICAgICAvLyBsb2FkaW5nLiBUaGlzIGNhbiBoYXBwZW4gZGVwZW5kaW5nIG9uIGhvdyBZYXJuL05QTSBob2lzdHMgdGhlIE5QTVxuICAgICAgLy8gcGFja2FnZXMgLyB3aGV0aGVyIHRoZXJlIGFyZSBtdWx0aXBsZSB2ZXJzaW9ucyBpbnN0YWxsZWQuIFR5cGVzY3JpcHRcbiAgICAgIC8vIHRocm93cyBhIGNvbXBpbGF0aW9uIGVycm9yIGlmIHRoZSB0eXBlIGlzbid0IHNwZWNpZmllZCBhbmQgd2UgY2FuJ3RcbiAgICAgIC8vIGNoZWNrIHRoZSB0eXBlLCBzbyB3ZSBoYXZlIHRvIGNhc3QgdGhlIGVycm9yIG91dHB1dCB0byBhbnkuXG4gICAgICBpZiAoKGUgYXMgYW55KS5jb25zdHJ1Y3Rvci5uYW1lID09PSAnUGF0aElzRGlyZWN0b3J5RXhjZXB0aW9uJykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgb3ZlcndyaXRlKGZpbGVQYXRoOiBQYXRoLCBjb250ZW50OiBzdHJpbmcpIHtcbiAgICB0aGlzLl90cmVlLm92ZXJ3cml0ZShmaWxlUGF0aCwgY29udGVudCk7XG4gIH1cblxuICBjcmVhdGUoZmlsZVBhdGg6IFBhdGgsIGNvbnRlbnQ6IHN0cmluZykge1xuICAgIHRoaXMuX3RyZWUuY3JlYXRlKGZpbGVQYXRoLCBjb250ZW50KTtcbiAgfVxuXG4gIGRlbGV0ZShmaWxlUGF0aDogUGF0aCkge1xuICAgIHRoaXMuX3RyZWUuZGVsZXRlKGZpbGVQYXRoKTtcbiAgfVxuXG4gIHJlYWQoZmlsZVBhdGg6IFBhdGgpIHtcbiAgICBjb25zdCBidWZmZXIgPSB0aGlzLl90cmVlLnJlYWQoZmlsZVBhdGgpO1xuICAgIHJldHVybiBidWZmZXIgIT09IG51bGwgPyBidWZmZXIudG9TdHJpbmcoKSA6IG51bGw7XG4gIH1cblxuICByZWFkRGlyZWN0b3J5KGRpclBhdGg6IFBhdGgpOiBEaXJlY3RvcnlFbnRyeSB7XG4gICAgY29uc3Qge3N1YmRpcnM6IGRpcmVjdG9yaWVzLCBzdWJmaWxlczogZmlsZXN9ID0gdGhpcy5fdHJlZS5nZXREaXIoZGlyUGF0aCk7XG4gICAgcmV0dXJuIHtkaXJlY3RvcmllcywgZmlsZXN9O1xuICB9XG59XG4iXX0=