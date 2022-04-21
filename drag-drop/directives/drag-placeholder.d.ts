/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { TemplateRef, InjectionToken } from '@angular/core';
import * as i0 from "@angular/core";
/**
 * Injection token that can be used to reference instances of `CdkDragPlaceholder`. It serves as
 * alternative token to the actual `CdkDragPlaceholder` class which could cause unnecessary
 * retention of the class and its directive metadata.
 */
export declare const CDK_DRAG_PLACEHOLDER: InjectionToken<CdkDragPlaceholder<any>>;
/**
 * Element that will be used as a template for the placeholder of a CdkDrag when
 * it is being dragged. The placeholder is displayed in place of the element being dragged.
 */
export declare class CdkDragPlaceholder<T = any> {
    templateRef: TemplateRef<T>;
    /** Context data to be added to the placeholder template instance. */
    data: T;
    constructor(templateRef: TemplateRef<T>);
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkDragPlaceholder<any>, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkDragPlaceholder<any>, "ng-template[cdkDragPlaceholder]", never, { "data": "data"; }, {}, never, never, false>;
}
