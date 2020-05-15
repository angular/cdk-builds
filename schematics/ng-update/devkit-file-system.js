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
        define("@angular/cdk/schematics/ng-update/devkit-file-system", ["require", "exports", "@angular-devkit/core", "path", "@angular/cdk/schematics/update-tool/file-system"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const core_1 = require("@angular-devkit/core");
    const path = require("path");
    const file_system_1 = require("@angular/cdk/schematics/update-tool/file-system");
    /**
     * File system that leverages the virtual tree from the CLI devkit. This file
     * system is commonly used by `ng update` migrations that run as part of the
     * Angular CLI.
     */
    class DevkitFileSystem extends file_system_1.FileSystem {
        constructor(_tree, workspaceFsPath) {
            super();
            this._tree = _tree;
            this._updateRecorderCache = new Map();
            this._workspaceFsPath = core_1.normalize(workspaceFsPath);
        }
        resolve(...segments) {
            // Note: We use `posix.resolve` as the devkit paths are using posix separators.
            const resolvedPath = core_1.normalize(path.posix.resolve(...segments.map(core_1.normalize)));
            // If the resolved path points to the workspace root, then this is an absolute disk
            // path and we need to compute a devkit tree relative path.
            if (resolvedPath.startsWith(this._workspaceFsPath)) {
                return core_1.relative(this._workspaceFsPath, resolvedPath);
            }
            // Otherwise we know that the path is absolute (due to the resolve), and that it
            // refers to an absolute devkit tree path (like `/angular.json`). We keep those
            // unmodified as they are already resolved workspace paths.
            return resolvedPath;
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
        exists(filePath) {
            return this._tree.exists(filePath);
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
    }
    exports.DevkitFileSystem = DevkitFileSystem;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2a2l0LWZpbGUtc3lzdGVtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL25nLXVwZGF0ZS9kZXZraXQtZmlsZS1zeXN0ZW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCwrQ0FBK0Q7SUFFL0QsNkJBQTZCO0lBQzdCLGlGQUFzRDtJQUV0RDs7OztPQUlHO0lBQ0gsTUFBYSxnQkFBaUIsU0FBUSx3QkFBZ0I7UUFJcEQsWUFBb0IsS0FBVyxFQUFFLGVBQXVCO1lBQ3RELEtBQUssRUFBRSxDQUFDO1lBRFUsVUFBSyxHQUFMLEtBQUssQ0FBTTtZQUh2Qix5QkFBb0IsR0FBRyxJQUFJLEdBQUcsRUFBMEIsQ0FBQztZQUsvRCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsZ0JBQVMsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNyRCxDQUFDO1FBRUQsT0FBTyxDQUFDLEdBQUcsUUFBa0I7WUFDM0IsK0VBQStFO1lBQy9FLE1BQU0sWUFBWSxHQUFHLGdCQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLGdCQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0UsbUZBQW1GO1lBQ25GLDJEQUEyRDtZQUMzRCxJQUFJLFlBQVksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEVBQUU7Z0JBQ2xELE9BQU8sZUFBUSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxZQUFZLENBQUMsQ0FBQzthQUN0RDtZQUNELGdGQUFnRjtZQUNoRiwrRUFBK0U7WUFDL0UsMkRBQTJEO1lBQzNELE9BQU8sWUFBWSxDQUFDO1FBQ3RCLENBQUM7UUFFRCxJQUFJLENBQUMsUUFBYztZQUNqQixJQUFJLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQzNDLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUUsQ0FBQzthQUNqRDtZQUNELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2xELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ2xELE9BQU8sUUFBUSxDQUFDO1FBQ2xCLENBQUM7UUFFRCxXQUFXO1lBQ1QsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3BDLENBQUM7UUFFRCxNQUFNLENBQUMsUUFBYztZQUNuQixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFRCxTQUFTLENBQUMsUUFBYyxFQUFFLE9BQWU7WUFDdkMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzFDLENBQUM7UUFFRCxNQUFNLENBQUMsUUFBYyxFQUFFLE9BQWU7WUFDcEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7UUFFRCxNQUFNLENBQUMsUUFBYztZQUNuQixJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBRUQsSUFBSSxDQUFDLFFBQWM7WUFDakIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDekMsT0FBTyxNQUFNLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUNwRCxDQUFDO0tBQ0Y7SUF6REQsNENBeURDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7bm9ybWFsaXplLCBQYXRoLCByZWxhdGl2ZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtUcmVlLCBVcGRhdGVSZWNvcmRlcn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7RmlsZVN5c3RlbX0gZnJvbSAnLi4vdXBkYXRlLXRvb2wvZmlsZS1zeXN0ZW0nO1xuXG4vKipcbiAqIEZpbGUgc3lzdGVtIHRoYXQgbGV2ZXJhZ2VzIHRoZSB2aXJ0dWFsIHRyZWUgZnJvbSB0aGUgQ0xJIGRldmtpdC4gVGhpcyBmaWxlXG4gKiBzeXN0ZW0gaXMgY29tbW9ubHkgdXNlZCBieSBgbmcgdXBkYXRlYCBtaWdyYXRpb25zIHRoYXQgcnVuIGFzIHBhcnQgb2YgdGhlXG4gKiBBbmd1bGFyIENMSS5cbiAqL1xuZXhwb3J0IGNsYXNzIERldmtpdEZpbGVTeXN0ZW0gZXh0ZW5kcyBGaWxlU3lzdGVtPFBhdGg+IHtcbiAgcHJpdmF0ZSBfdXBkYXRlUmVjb3JkZXJDYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBVcGRhdGVSZWNvcmRlcj4oKTtcbiAgcHJpdmF0ZSBfd29ya3NwYWNlRnNQYXRoOiBQYXRoO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX3RyZWU6IFRyZWUsIHdvcmtzcGFjZUZzUGF0aDogc3RyaW5nKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl93b3Jrc3BhY2VGc1BhdGggPSBub3JtYWxpemUod29ya3NwYWNlRnNQYXRoKTtcbiAgfVxuXG4gIHJlc29sdmUoLi4uc2VnbWVudHM6IHN0cmluZ1tdKTogUGF0aCB7XG4gICAgLy8gTm90ZTogV2UgdXNlIGBwb3NpeC5yZXNvbHZlYCBhcyB0aGUgZGV2a2l0IHBhdGhzIGFyZSB1c2luZyBwb3NpeCBzZXBhcmF0b3JzLlxuICAgIGNvbnN0IHJlc29sdmVkUGF0aCA9IG5vcm1hbGl6ZShwYXRoLnBvc2l4LnJlc29sdmUoLi4uc2VnbWVudHMubWFwKG5vcm1hbGl6ZSkpKTtcbiAgICAvLyBJZiB0aGUgcmVzb2x2ZWQgcGF0aCBwb2ludHMgdG8gdGhlIHdvcmtzcGFjZSByb290LCB0aGVuIHRoaXMgaXMgYW4gYWJzb2x1dGUgZGlza1xuICAgIC8vIHBhdGggYW5kIHdlIG5lZWQgdG8gY29tcHV0ZSBhIGRldmtpdCB0cmVlIHJlbGF0aXZlIHBhdGguXG4gICAgaWYgKHJlc29sdmVkUGF0aC5zdGFydHNXaXRoKHRoaXMuX3dvcmtzcGFjZUZzUGF0aCkpIHtcbiAgICAgIHJldHVybiByZWxhdGl2ZSh0aGlzLl93b3Jrc3BhY2VGc1BhdGgsIHJlc29sdmVkUGF0aCk7XG4gICAgfVxuICAgIC8vIE90aGVyd2lzZSB3ZSBrbm93IHRoYXQgdGhlIHBhdGggaXMgYWJzb2x1dGUgKGR1ZSB0byB0aGUgcmVzb2x2ZSksIGFuZCB0aGF0IGl0XG4gICAgLy8gcmVmZXJzIHRvIGFuIGFic29sdXRlIGRldmtpdCB0cmVlIHBhdGggKGxpa2UgYC9hbmd1bGFyLmpzb25gKS4gV2Uga2VlcCB0aG9zZVxuICAgIC8vIHVubW9kaWZpZWQgYXMgdGhleSBhcmUgYWxyZWFkeSByZXNvbHZlZCB3b3Jrc3BhY2UgcGF0aHMuXG4gICAgcmV0dXJuIHJlc29sdmVkUGF0aDtcbiAgfVxuXG4gIGVkaXQoZmlsZVBhdGg6IFBhdGgpIHtcbiAgICBpZiAodGhpcy5fdXBkYXRlUmVjb3JkZXJDYWNoZS5oYXMoZmlsZVBhdGgpKSB7XG4gICAgICByZXR1cm4gdGhpcy5fdXBkYXRlUmVjb3JkZXJDYWNoZS5nZXQoZmlsZVBhdGgpITtcbiAgICB9XG4gICAgY29uc3QgcmVjb3JkZXIgPSB0aGlzLl90cmVlLmJlZ2luVXBkYXRlKGZpbGVQYXRoKTtcbiAgICB0aGlzLl91cGRhdGVSZWNvcmRlckNhY2hlLnNldChmaWxlUGF0aCwgcmVjb3JkZXIpO1xuICAgIHJldHVybiByZWNvcmRlcjtcbiAgfVxuXG4gIGNvbW1pdEVkaXRzKCkge1xuICAgIHRoaXMuX3VwZGF0ZVJlY29yZGVyQ2FjaGUuZm9yRWFjaChyID0+IHRoaXMuX3RyZWUuY29tbWl0VXBkYXRlKHIpKTtcbiAgICB0aGlzLl91cGRhdGVSZWNvcmRlckNhY2hlLmNsZWFyKCk7XG4gIH1cblxuICBleGlzdHMoZmlsZVBhdGg6IFBhdGgpIHtcbiAgICByZXR1cm4gdGhpcy5fdHJlZS5leGlzdHMoZmlsZVBhdGgpO1xuICB9XG5cbiAgb3ZlcndyaXRlKGZpbGVQYXRoOiBQYXRoLCBjb250ZW50OiBzdHJpbmcpIHtcbiAgICB0aGlzLl90cmVlLm92ZXJ3cml0ZShmaWxlUGF0aCwgY29udGVudCk7XG4gIH1cblxuICBjcmVhdGUoZmlsZVBhdGg6IFBhdGgsIGNvbnRlbnQ6IHN0cmluZykge1xuICAgIHRoaXMuX3RyZWUuY3JlYXRlKGZpbGVQYXRoLCBjb250ZW50KTtcbiAgfVxuXG4gIGRlbGV0ZShmaWxlUGF0aDogUGF0aCkge1xuICAgIHRoaXMuX3RyZWUuZGVsZXRlKGZpbGVQYXRoKTtcbiAgfVxuXG4gIHJlYWQoZmlsZVBhdGg6IFBhdGgpIHtcbiAgICBjb25zdCBidWZmZXIgPSB0aGlzLl90cmVlLnJlYWQoZmlsZVBhdGgpO1xuICAgIHJldHVybiBidWZmZXIgIT09IG51bGwgPyBidWZmZXIudG9TdHJpbmcoKSA6IG51bGw7XG4gIH1cbn1cbiJdfQ==