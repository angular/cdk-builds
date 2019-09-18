"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const target_version_1 = require("../../update-tool/target-version");
exports.classNames = {
    [target_version_1.TargetVersion.V9]: [{
            pr: 'https://github.com/angular/components/pull/17084',
            changes: [
                { replace: 'CDK_DROP_LIST_CONTAINER', replaceWith: 'CDK_DROP_LIST' },
                { replace: 'CdkDragConfig', replaceWith: 'DragRefConfig' }
            ]
        }],
    [target_version_1.TargetVersion.V8]: [],
    [target_version_1.TargetVersion.V7]: [],
    [target_version_1.TargetVersion.V6]: [
        {
            pr: 'https://github.com/angular/components/pull/10161',
            changes: [
                { replace: 'ConnectedOverlayDirective', replaceWith: 'CdkConnectedOverlay' },
                { replace: 'OverlayOrigin', replaceWith: 'CdkOverlayOrigin' }
            ]
        },
        {
            pr: 'https://github.com/angular/components/pull/10267',
            changes: [{ replace: 'ObserveContent', replaceWith: 'CdkObserveContent' }]
        },
        {
            pr: 'https://github.com/angular/components/pull/10325',
            changes: [{ replace: 'FocusTrapDirective', replaceWith: 'CdkTrapFocus' }]
        }
    ]
};
//# sourceMappingURL=class-names.js.map