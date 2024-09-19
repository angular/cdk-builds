"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./ast"), exports);
__exportStar(require("./ast/ng-module-imports"), exports);
__exportStar(require("./build-component"), exports);
__exportStar(require("./get-project"), exports);
__exportStar(require("./html-manipulation"), exports);
__exportStar(require("./parse5-element"), exports);
__exportStar(require("./project-index-file"), exports);
__exportStar(require("./project-main-file"), exports);
__exportStar(require("./project-style-file"), exports);
__exportStar(require("./project-targets"), exports);
__exportStar(require("./project-tsconfig-paths"), exports);
__exportStar(require("./schematic-options"), exports);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXRpbHMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7OztBQUVILHdDQUFzQjtBQUN0QiwwREFBd0M7QUFDeEMsb0RBQWtDO0FBQ2xDLGdEQUE4QjtBQUM5QixzREFBb0M7QUFDcEMsbURBQWlDO0FBQ2pDLHVEQUFxQztBQUNyQyxzREFBb0M7QUFDcEMsdURBQXFDO0FBQ3JDLG9EQUFrQztBQUNsQywyREFBeUM7QUFDekMsc0RBQW9DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuZGV2L2xpY2Vuc2VcbiAqL1xuXG5leHBvcnQgKiBmcm9tICcuL2FzdCc7XG5leHBvcnQgKiBmcm9tICcuL2FzdC9uZy1tb2R1bGUtaW1wb3J0cyc7XG5leHBvcnQgKiBmcm9tICcuL2J1aWxkLWNvbXBvbmVudCc7XG5leHBvcnQgKiBmcm9tICcuL2dldC1wcm9qZWN0JztcbmV4cG9ydCAqIGZyb20gJy4vaHRtbC1tYW5pcHVsYXRpb24nO1xuZXhwb3J0ICogZnJvbSAnLi9wYXJzZTUtZWxlbWVudCc7XG5leHBvcnQgKiBmcm9tICcuL3Byb2plY3QtaW5kZXgtZmlsZSc7XG5leHBvcnQgKiBmcm9tICcuL3Byb2plY3QtbWFpbi1maWxlJztcbmV4cG9ydCAqIGZyb20gJy4vcHJvamVjdC1zdHlsZS1maWxlJztcbmV4cG9ydCAqIGZyb20gJy4vcHJvamVjdC10YXJnZXRzJztcbmV4cG9ydCAqIGZyb20gJy4vcHJvamVjdC10c2NvbmZpZy1wYXRocyc7XG5leHBvcnQgKiBmcm9tICcuL3NjaGVtYXRpYy1vcHRpb25zJztcbiJdfQ==