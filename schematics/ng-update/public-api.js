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
__exportStar(require("./data/index"), exports);
__exportStar(require("./devkit-migration"), exports);
__exportStar(require("./devkit-migration-rule"), exports);
__exportStar(require("./devkit-file-system"), exports);
__exportStar(require("./html-parsing/angular"), exports);
__exportStar(require("./html-parsing/elements"), exports);
__exportStar(require("./typescript/base-types"), exports);
__exportStar(require("./typescript/imports"), exports);
__exportStar(require("./typescript/literal"), exports);
__exportStar(require("./typescript/module-specifiers"), exports);
__exportStar(require("./find-stylesheets"), exports);
__exportStar(require("./upgrade-data"), exports);
//# sourceMappingURL=public-api.js.map