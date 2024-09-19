"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2a2l0LWZpbGUtc3lzdGVtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL25nLXVwZGF0ZS9kZXZraXQtZmlsZS1zeXN0ZW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsK0NBQXFEO0FBRXJELDREQUFzRTtBQUN0RSw2QkFBNkI7QUFFN0I7Ozs7R0FJRztBQUNILE1BQWEsZ0JBQWlCLFNBQVEsd0JBQVU7SUFHMUI7SUFGWixvQkFBb0IsR0FBRyxJQUFJLEdBQUcsRUFBMEIsQ0FBQztJQUVqRSxZQUFvQixLQUFXO1FBQzdCLEtBQUssRUFBRSxDQUFDO1FBRFUsVUFBSyxHQUFMLEtBQUssQ0FBTTtJQUUvQixDQUFDO0lBRUQsT0FBTyxDQUFDLEdBQUcsUUFBa0I7UUFDM0IsK0VBQStFO1FBQy9FLE9BQU8sSUFBQSxnQkFBUyxFQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsZ0JBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4RSxDQUFDO0lBRUQsSUFBSSxDQUFDLFFBQWM7UUFDakIsSUFBSSxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDNUMsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBRSxDQUFDO1FBQ2xELENBQUM7UUFDRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNsRCxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNsRCxPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0lBRUQsV0FBVztRQUNULElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25FLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNwQyxDQUFDO0lBRUQsVUFBVSxDQUFDLFFBQWM7UUFDdkIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBRUQsZUFBZSxDQUFDLE9BQWE7UUFDM0Isc0VBQXNFO1FBQ3RFLHFFQUFxRTtRQUNyRSx1RUFBdUU7UUFDdkUsSUFBSSxDQUFDO1lBQ0gsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDMUIsQ0FBQztRQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDWCx1RUFBdUU7WUFDdkUseUVBQXlFO1lBQ3pFLG9FQUFvRTtZQUNwRSx1RUFBdUU7WUFDdkUsc0VBQXNFO1lBQ3RFLDhEQUE4RDtZQUM5RCxJQUFLLENBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxLQUFLLDBCQUEwQixFQUFFLENBQUM7Z0JBQy9ELE9BQU8sSUFBSSxDQUFDO1lBQ2QsQ0FBQztRQUNILENBQUM7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCxTQUFTLENBQUMsUUFBYyxFQUFFLE9BQWU7UUFDdkMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFFRCxNQUFNLENBQUMsUUFBYyxFQUFFLE9BQWU7UUFDcEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFRCxNQUFNLENBQUMsUUFBYztRQUNuQixJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBRUQsSUFBSSxDQUFDLFFBQWM7UUFDakIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDekMsT0FBTyxNQUFNLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUNwRCxDQUFDO0lBRUQsYUFBYSxDQUFDLE9BQWE7UUFDekIsTUFBTSxFQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzNFLE9BQU8sRUFBQyxXQUFXLEVBQUUsS0FBSyxFQUFDLENBQUM7SUFDOUIsQ0FBQztDQUNGO0FBdkVELDRDQXVFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmRldi9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtub3JtYWxpemUsIFBhdGh9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7VHJlZSwgVXBkYXRlUmVjb3JkZXJ9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7RGlyZWN0b3J5RW50cnksIEZpbGVTeXN0ZW19IGZyb20gJy4uL3VwZGF0ZS10b29sL2ZpbGUtc3lzdGVtJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbi8qKlxuICogRmlsZSBzeXN0ZW0gdGhhdCBsZXZlcmFnZXMgdGhlIHZpcnR1YWwgdHJlZSBmcm9tIHRoZSBDTEkgZGV2a2l0LiBUaGlzIGZpbGVcbiAqIHN5c3RlbSBpcyBjb21tb25seSB1c2VkIGJ5IGBuZyB1cGRhdGVgIG1pZ3JhdGlvbnMgdGhhdCBydW4gYXMgcGFydCBvZiB0aGVcbiAqIEFuZ3VsYXIgQ0xJLlxuICovXG5leHBvcnQgY2xhc3MgRGV2a2l0RmlsZVN5c3RlbSBleHRlbmRzIEZpbGVTeXN0ZW0ge1xuICBwcml2YXRlIF91cGRhdGVSZWNvcmRlckNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIFVwZGF0ZVJlY29yZGVyPigpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX3RyZWU6IFRyZWUpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgcmVzb2x2ZSguLi5zZWdtZW50czogc3RyaW5nW10pOiBQYXRoIHtcbiAgICAvLyBOb3RlOiBXZSB1c2UgYHBvc2l4LnJlc29sdmVgIGFzIHRoZSBkZXZraXQgcGF0aHMgYXJlIHVzaW5nIHBvc2l4IHNlcGFyYXRvcnMuXG4gICAgcmV0dXJuIG5vcm1hbGl6ZShwYXRoLnBvc2l4LnJlc29sdmUoJy8nLCAuLi5zZWdtZW50cy5tYXAobm9ybWFsaXplKSkpO1xuICB9XG5cbiAgZWRpdChmaWxlUGF0aDogUGF0aCkge1xuICAgIGlmICh0aGlzLl91cGRhdGVSZWNvcmRlckNhY2hlLmhhcyhmaWxlUGF0aCkpIHtcbiAgICAgIHJldHVybiB0aGlzLl91cGRhdGVSZWNvcmRlckNhY2hlLmdldChmaWxlUGF0aCkhO1xuICAgIH1cbiAgICBjb25zdCByZWNvcmRlciA9IHRoaXMuX3RyZWUuYmVnaW5VcGRhdGUoZmlsZVBhdGgpO1xuICAgIHRoaXMuX3VwZGF0ZVJlY29yZGVyQ2FjaGUuc2V0KGZpbGVQYXRoLCByZWNvcmRlcik7XG4gICAgcmV0dXJuIHJlY29yZGVyO1xuICB9XG5cbiAgY29tbWl0RWRpdHMoKSB7XG4gICAgdGhpcy5fdXBkYXRlUmVjb3JkZXJDYWNoZS5mb3JFYWNoKHIgPT4gdGhpcy5fdHJlZS5jb21taXRVcGRhdGUocikpO1xuICAgIHRoaXMuX3VwZGF0ZVJlY29yZGVyQ2FjaGUuY2xlYXIoKTtcbiAgfVxuXG4gIGZpbGVFeGlzdHMoZmlsZVBhdGg6IFBhdGgpIHtcbiAgICByZXR1cm4gdGhpcy5fdHJlZS5leGlzdHMoZmlsZVBhdGgpO1xuICB9XG5cbiAgZGlyZWN0b3J5RXhpc3RzKGRpclBhdGg6IFBhdGgpIHtcbiAgICAvLyBUaGUgZGV2a2l0IHRyZWUgZG9lcyBub3QgZXhwb3NlIGFuIEFQSSBmb3IgY2hlY2tpbmcgd2hldGhlciBhIGdpdmVuXG4gICAgLy8gZGlyZWN0b3J5IGV4aXN0cy4gSXQgdGhyb3dzIGEgc3BlY2lmaWMgZXJyb3IgdGhvdWdoIGlmIGEgZGlyZWN0b3J5XG4gICAgLy8gaXMgYmVpbmcgcmVhZCBhcyBhIGZpbGUuIFdlIHVzZSB0aGF0IHRvIGNoZWNrIGlmIGEgZGlyZWN0b3J5IGV4aXN0cy5cbiAgICB0cnkge1xuICAgICAgdGhpcy5fdHJlZS5nZXQoZGlyUGF0aCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gTm90ZTogV2UgZG8gbm90IHVzZSBhbiBgaW5zdGFuY2VvZmAgY2hlY2sgaGVyZS4gSXQgY291bGQgaGFwcGVuIHRoYXRcbiAgICAgIC8vIHRoZSBkZXZraXQgdmVyc2lvbiB1c2VkIGJ5IHRoZSBDTEkgaXMgZGlmZmVyZW50IHRoYW4gdGhlIG9uZSB3ZSBlbmQgdXBcbiAgICAgIC8vIGxvYWRpbmcuIFRoaXMgY2FuIGhhcHBlbiBkZXBlbmRpbmcgb24gaG93IFlhcm4vTlBNIGhvaXN0cyB0aGUgTlBNXG4gICAgICAvLyBwYWNrYWdlcyAvIHdoZXRoZXIgdGhlcmUgYXJlIG11bHRpcGxlIHZlcnNpb25zIGluc3RhbGxlZC4gVHlwZXNjcmlwdFxuICAgICAgLy8gdGhyb3dzIGEgY29tcGlsYXRpb24gZXJyb3IgaWYgdGhlIHR5cGUgaXNuJ3Qgc3BlY2lmaWVkIGFuZCB3ZSBjYW4ndFxuICAgICAgLy8gY2hlY2sgdGhlIHR5cGUsIHNvIHdlIGhhdmUgdG8gY2FzdCB0aGUgZXJyb3Igb3V0cHV0IHRvIGFueS5cbiAgICAgIGlmICgoZSBhcyBhbnkpLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdQYXRoSXNEaXJlY3RvcnlFeGNlcHRpb24nKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBvdmVyd3JpdGUoZmlsZVBhdGg6IFBhdGgsIGNvbnRlbnQ6IHN0cmluZykge1xuICAgIHRoaXMuX3RyZWUub3ZlcndyaXRlKGZpbGVQYXRoLCBjb250ZW50KTtcbiAgfVxuXG4gIGNyZWF0ZShmaWxlUGF0aDogUGF0aCwgY29udGVudDogc3RyaW5nKSB7XG4gICAgdGhpcy5fdHJlZS5jcmVhdGUoZmlsZVBhdGgsIGNvbnRlbnQpO1xuICB9XG5cbiAgZGVsZXRlKGZpbGVQYXRoOiBQYXRoKSB7XG4gICAgdGhpcy5fdHJlZS5kZWxldGUoZmlsZVBhdGgpO1xuICB9XG5cbiAgcmVhZChmaWxlUGF0aDogUGF0aCkge1xuICAgIGNvbnN0IGJ1ZmZlciA9IHRoaXMuX3RyZWUucmVhZChmaWxlUGF0aCk7XG4gICAgcmV0dXJuIGJ1ZmZlciAhPT0gbnVsbCA/IGJ1ZmZlci50b1N0cmluZygpIDogbnVsbDtcbiAgfVxuXG4gIHJlYWREaXJlY3RvcnkoZGlyUGF0aDogUGF0aCk6IERpcmVjdG9yeUVudHJ5IHtcbiAgICBjb25zdCB7c3ViZGlyczogZGlyZWN0b3JpZXMsIHN1YmZpbGVzOiBmaWxlc30gPSB0aGlzLl90cmVlLmdldERpcihkaXJQYXRoKTtcbiAgICByZXR1cm4ge2RpcmVjdG9yaWVzLCBmaWxlc307XG4gIH1cbn1cbiJdfQ==