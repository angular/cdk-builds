"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevkitMigration = void 0;
const migration_1 = require("../update-tool/migration");
class DevkitMigration extends migration_1.Migration {
    /** Prints an informative message with context on the current target. */
    printInfo(text) {
        const targetName = this.context.isTestTarget ? 'test' : 'build';
        this.logger.info(`- ${this.context.projectName}@${targetName}: ${text}`);
    }
}
exports.DevkitMigration = DevkitMigration;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2a2l0LW1pZ3JhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2NoZW1hdGljcy9uZy11cGRhdGUvZGV2a2l0LW1pZ3JhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFJSCx3REFBcUY7QUFhckYsTUFBc0IsZUFBc0IsU0FBUSxxQkFBOEI7SUFDaEYsd0VBQXdFO0lBQzlELFNBQVMsQ0FBQyxJQUFZO1FBQzlCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUNoRSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxJQUFJLFVBQVUsS0FBSyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQzNFLENBQUM7Q0FTRjtBQWRELDBDQWNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U2NoZW1hdGljQ29udGV4dCwgVHJlZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtQcm9qZWN0RGVmaW5pdGlvbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUvc3JjL3dvcmtzcGFjZSc7XG5pbXBvcnQge0NvbnN0cnVjdG9yLCBNaWdyYXRpb24sIFBvc3RNaWdyYXRpb25BY3Rpb259IGZyb20gJy4uL3VwZGF0ZS10b29sL21pZ3JhdGlvbic7XG5cbmV4cG9ydCB0eXBlIERldmtpdENvbnRleHQgPSB7XG4gIC8qKiBEZXZraXQgdHJlZSBmb3IgdGhlIGN1cnJlbnQgbWlncmF0aW9ucy4gQ2FuIGJlIHVzZWQgdG8gaW5zZXJ0L3JlbW92ZSBmaWxlcy4gKi9cbiAgdHJlZTogVHJlZTtcbiAgLyoqIE5hbWUgb2YgdGhlIHByb2plY3QgdGhlIG1pZ3JhdGlvbnMgcnVuIGFnYWluc3QuICovXG4gIHByb2plY3ROYW1lOiBzdHJpbmc7XG4gIC8qKiBXb3Jrc3BhY2UgcHJvamVjdCB0aGUgbWlncmF0aW9ucyBydW4gYWdhaW5zdC4gKi9cbiAgcHJvamVjdDogUHJvamVjdERlZmluaXRpb247XG4gIC8qKiBXaGV0aGVyIHRoZSBtaWdyYXRpb25zIHJ1biBmb3IgYSB0ZXN0IHRhcmdldC4gKi9cbiAgaXNUZXN0VGFyZ2V0OiBib29sZWFuO1xufTtcblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIERldmtpdE1pZ3JhdGlvbjxEYXRhPiBleHRlbmRzIE1pZ3JhdGlvbjxEYXRhLCBEZXZraXRDb250ZXh0PiB7XG4gIC8qKiBQcmludHMgYW4gaW5mb3JtYXRpdmUgbWVzc2FnZSB3aXRoIGNvbnRleHQgb24gdGhlIGN1cnJlbnQgdGFyZ2V0LiAqL1xuICBwcm90ZWN0ZWQgcHJpbnRJbmZvKHRleHQ6IHN0cmluZykge1xuICAgIGNvbnN0IHRhcmdldE5hbWUgPSB0aGlzLmNvbnRleHQuaXNUZXN0VGFyZ2V0ID8gJ3Rlc3QnIDogJ2J1aWxkJztcbiAgICB0aGlzLmxvZ2dlci5pbmZvKGAtICR7dGhpcy5jb250ZXh0LnByb2plY3ROYW1lfUAke3RhcmdldE5hbWV9OiAke3RleHR9YCk7XG4gIH1cblxuICAvKipcbiAgICogT3B0aW9uYWwgc3RhdGljIG1ldGhvZCB0aGF0IHdpbGwgYmUgY2FsbGVkIG9uY2UgdGhlIG1pZ3JhdGlvbiBvZiBhbGwgcHJvamVjdFxuICAgKiB0YXJnZXRzIGhhcyBiZWVuIHBlcmZvcm1lZC4gVGhpcyBtZXRob2QgY2FuIGJlIHVzZWQgdG8gbWFrZSBjaGFuZ2VzIHJlc3BlY3RpbmcgdGhlXG4gICAqIG1pZ3JhdGlvbiByZXN1bHQgb2YgYWxsIGluZGl2aWR1YWwgdGFyZ2V0cy4gZS5nLiByZW1vdmluZyBIYW1tZXJKUyBpZiBpdFxuICAgKiBpcyBub3QgbmVlZGVkIGluIGFueSBwcm9qZWN0IHRhcmdldC5cbiAgICovXG4gIHN0YXRpYyBnbG9iYWxQb3N0TWlncmF0aW9uPyh0cmVlOiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KTogUG9zdE1pZ3JhdGlvbkFjdGlvbjtcbn1cblxuZXhwb3J0IHR5cGUgRGV2a2l0TWlncmF0aW9uQ3RvcjxEYXRhPiA9IENvbnN0cnVjdG9yPERldmtpdE1pZ3JhdGlvbjxEYXRhPj4gJlxuICB7W20gaW4ga2V5b2YgdHlwZW9mIERldmtpdE1pZ3JhdGlvbl06IHR5cGVvZiBEZXZraXRNaWdyYXRpb25bbV19O1xuIl19