/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef } from '@angular/core';
/** Handle that can be used to drag and CdkDrag instance. */
export declare class CdkDragHandle {
    element: ElementRef<HTMLElement>;
    /** Closest parent draggable instance. */
    _parentDrag: {} | undefined;
    /** Whether starting to drag through this handle is disabled. */
    disabled: boolean;
    private _disabled;
    constructor(element: ElementRef<HTMLElement>, parentDrag?: any);
}
