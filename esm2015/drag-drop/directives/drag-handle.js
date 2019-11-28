/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/drag-drop/directives/drag-handle.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, ElementRef, Inject, Optional, Input } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Subject } from 'rxjs';
import { CDK_DRAG_PARENT } from '../drag-parent';
import { toggleNativeDragInteractions } from '../drag-styling';
/**
 * Handle that can be used to drag and CdkDrag instance.
 */
export class CdkDragHandle {
    /**
     * @param {?} element
     * @param {?=} parentDrag
     */
    constructor(element, parentDrag) {
        this.element = element;
        /**
         * Emits when the state of the handle has changed.
         */
        this._stateChanges = new Subject();
        this._disabled = false;
        this._parentDrag = parentDrag;
        toggleNativeDragInteractions(element.nativeElement, false);
    }
    /**
     * Whether starting to drag through this handle is disabled.
     * @return {?}
     */
    get disabled() { return this._disabled; }
    /**
     * @param {?} value
     * @return {?}
     */
    set disabled(value) {
        this._disabled = coerceBooleanProperty(value);
        this._stateChanges.next(this);
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        this._stateChanges.complete();
    }
}
CdkDragHandle.decorators = [
    { type: Directive, args: [{
                selector: '[cdkDragHandle]',
                host: {
                    'class': 'cdk-drag-handle'
                }
            },] }
];
/** @nocollapse */
CdkDragHandle.ctorParameters = () => [
    { type: ElementRef },
    { type: undefined, decorators: [{ type: Inject, args: [CDK_DRAG_PARENT,] }, { type: Optional }] }
];
CdkDragHandle.propDecorators = {
    disabled: [{ type: Input, args: ['cdkDragHandleDisabled',] }]
};
if (false) {
    /** @type {?} */
    CdkDragHandle.ngAcceptInputType_disabled;
    /**
     * Closest parent draggable instance.
     * @type {?}
     */
    CdkDragHandle.prototype._parentDrag;
    /**
     * Emits when the state of the handle has changed.
     * @type {?}
     */
    CdkDragHandle.prototype._stateChanges;
    /**
     * @type {?}
     * @private
     */
    CdkDragHandle.prototype._disabled;
    /** @type {?} */
    CdkDragHandle.prototype.element;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1oYW5kbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2RyYWctZHJvcC9kaXJlY3RpdmVzL2RyYWctaGFuZGxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxTQUFTLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFZLE1BQU0sZUFBZSxDQUFDO0FBQ3hGLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzVELE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDN0IsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQy9DLE9BQU8sRUFBQyw0QkFBNEIsRUFBQyxNQUFNLGlCQUFpQixDQUFDOzs7O0FBUzdELE1BQU0sT0FBTyxhQUFhOzs7OztJQWdCeEIsWUFDUyxPQUFnQyxFQUNGLFVBQWdCO1FBRDlDLFlBQU8sR0FBUCxPQUFPLENBQXlCOzs7O1FBWnpDLGtCQUFhLEdBQUcsSUFBSSxPQUFPLEVBQWlCLENBQUM7UUFTckMsY0FBUyxHQUFHLEtBQUssQ0FBQztRQU14QixJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztRQUM5Qiw0QkFBNEIsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzdELENBQUM7Ozs7O0lBZEQsSUFDSSxRQUFRLEtBQWMsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQzs7Ozs7SUFDbEQsSUFBSSxRQUFRLENBQUMsS0FBYztRQUN6QixJQUFJLENBQUMsU0FBUyxHQUFHLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzlDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2hDLENBQUM7Ozs7SUFXRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUNoQyxDQUFDOzs7WUFoQ0YsU0FBUyxTQUFDO2dCQUNULFFBQVEsRUFBRSxpQkFBaUI7Z0JBQzNCLElBQUksRUFBRTtvQkFDSixPQUFPLEVBQUUsaUJBQWlCO2lCQUMzQjthQUNGOzs7O1lBWmtCLFVBQVU7NENBK0J4QixNQUFNLFNBQUMsZUFBZSxjQUFHLFFBQVE7Ozt1QkFWbkMsS0FBSyxTQUFDLHVCQUF1Qjs7OztJQW9COUIseUNBQXVFOzs7OztJQTFCdkUsb0NBQTRCOzs7OztJQUc1QixzQ0FBNkM7Ozs7O0lBUzdDLGtDQUEwQjs7SUFHeEIsZ0NBQXVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aXZlLCBFbGVtZW50UmVmLCBJbmplY3QsIE9wdGlvbmFsLCBJbnB1dCwgT25EZXN0cm95fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Y29lcmNlQm9vbGVhblByb3BlcnR5fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtTdWJqZWN0fSBmcm9tICdyeGpzJztcbmltcG9ydCB7Q0RLX0RSQUdfUEFSRU5UfSBmcm9tICcuLi9kcmFnLXBhcmVudCc7XG5pbXBvcnQge3RvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnN9IGZyb20gJy4uL2RyYWctc3R5bGluZyc7XG5cbi8qKiBIYW5kbGUgdGhhdCBjYW4gYmUgdXNlZCB0byBkcmFnIGFuZCBDZGtEcmFnIGluc3RhbmNlLiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka0RyYWdIYW5kbGVdJyxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstZHJhZy1oYW5kbGUnXG4gIH1cbn0pXG5leHBvcnQgY2xhc3MgQ2RrRHJhZ0hhbmRsZSBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qKiBDbG9zZXN0IHBhcmVudCBkcmFnZ2FibGUgaW5zdGFuY2UuICovXG4gIF9wYXJlbnREcmFnOiB7fSB8IHVuZGVmaW5lZDtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgc3RhdGUgb2YgdGhlIGhhbmRsZSBoYXMgY2hhbmdlZC4gKi9cbiAgX3N0YXRlQ2hhbmdlcyA9IG5ldyBTdWJqZWN0PENka0RyYWdIYW5kbGU+KCk7XG5cbiAgLyoqIFdoZXRoZXIgc3RhcnRpbmcgdG8gZHJhZyB0aHJvdWdoIHRoaXMgaGFuZGxlIGlzIGRpc2FibGVkLiAqL1xuICBASW5wdXQoJ2Nka0RyYWdIYW5kbGVEaXNhYmxlZCcpXG4gIGdldCBkaXNhYmxlZCgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX2Rpc2FibGVkOyB9XG4gIHNldCBkaXNhYmxlZCh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX2Rpc2FibGVkID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgICB0aGlzLl9zdGF0ZUNoYW5nZXMubmV4dCh0aGlzKTtcbiAgfVxuICBwcml2YXRlIF9kaXNhYmxlZCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyBlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICBASW5qZWN0KENES19EUkFHX1BBUkVOVCkgQE9wdGlvbmFsKCkgcGFyZW50RHJhZz86IGFueSkge1xuXG4gICAgdGhpcy5fcGFyZW50RHJhZyA9IHBhcmVudERyYWc7XG4gICAgdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucyhlbGVtZW50Lm5hdGl2ZUVsZW1lbnQsIGZhbHNlKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX3N0YXRlQ2hhbmdlcy5jb21wbGV0ZSgpO1xuICB9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2Rpc2FibGVkOiBib29sZWFuIHwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZDtcbn1cbiJdfQ==