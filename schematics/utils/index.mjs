"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
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
exports.addModuleImportToStandaloneBootstrap = exports.importsProvidersFrom = void 0;
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
__exportStar(require("./schematic-options"), exports);
var standalone_1 = require("./ast/standalone");
Object.defineProperty(exports, "importsProvidersFrom", { enumerable: true, get: function () { return standalone_1.importsProvidersFrom; } });
Object.defineProperty(exports, "addModuleImportToStandaloneBootstrap", { enumerable: true, get: function () { return standalone_1.addModuleImportToStandaloneBootstrap; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXRpbHMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCx3Q0FBc0I7QUFDdEIsMERBQXdDO0FBQ3hDLG9EQUFrQztBQUNsQyxnREFBOEI7QUFDOUIsc0RBQW9DO0FBQ3BDLG1EQUFpQztBQUNqQyx1REFBcUM7QUFDckMsc0RBQW9DO0FBQ3BDLHVEQUFxQztBQUNyQyxvREFBa0M7QUFDbEMsc0RBQW9DO0FBQ3BDLCtDQUE0RjtBQUFwRixrSEFBQSxvQkFBb0IsT0FBQTtBQUFFLGtJQUFBLG9DQUFvQyxPQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmV4cG9ydCAqIGZyb20gJy4vYXN0JztcbmV4cG9ydCAqIGZyb20gJy4vYXN0L25nLW1vZHVsZS1pbXBvcnRzJztcbmV4cG9ydCAqIGZyb20gJy4vYnVpbGQtY29tcG9uZW50JztcbmV4cG9ydCAqIGZyb20gJy4vZ2V0LXByb2plY3QnO1xuZXhwb3J0ICogZnJvbSAnLi9odG1sLW1hbmlwdWxhdGlvbic7XG5leHBvcnQgKiBmcm9tICcuL3BhcnNlNS1lbGVtZW50JztcbmV4cG9ydCAqIGZyb20gJy4vcHJvamVjdC1pbmRleC1maWxlJztcbmV4cG9ydCAqIGZyb20gJy4vcHJvamVjdC1tYWluLWZpbGUnO1xuZXhwb3J0ICogZnJvbSAnLi9wcm9qZWN0LXN0eWxlLWZpbGUnO1xuZXhwb3J0ICogZnJvbSAnLi9wcm9qZWN0LXRhcmdldHMnO1xuZXhwb3J0ICogZnJvbSAnLi9zY2hlbWF0aWMtb3B0aW9ucyc7XG5leHBvcnQge2ltcG9ydHNQcm92aWRlcnNGcm9tLCBhZGRNb2R1bGVJbXBvcnRUb1N0YW5kYWxvbmVCb290c3RyYXB9IGZyb20gJy4vYXN0L3N0YW5kYWxvbmUnO1xuIl19