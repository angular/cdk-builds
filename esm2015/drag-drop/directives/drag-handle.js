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
let CdkDragHandle = /** @class */ (() => {
    /**
     * Handle that can be used to drag and CdkDrag instance.
     */
    class CdkDragHandle {
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
    return CdkDragHandle;
})();
export { CdkDragHandle };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1oYW5kbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2RyYWctZHJvcC9kaXJlY3RpdmVzL2RyYWctaGFuZGxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxTQUFTLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFZLE1BQU0sZUFBZSxDQUFDO0FBQ3hGLE9BQU8sRUFBZSxxQkFBcUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzFFLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDN0IsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQy9DLE9BQU8sRUFBQyw0QkFBNEIsRUFBQyxNQUFNLGlCQUFpQixDQUFDOzs7O0FBRzdEOzs7O0lBQUEsTUFNYSxhQUFhOzs7OztRQWdCeEIsWUFDUyxPQUFnQyxFQUNGLFVBQWdCO1lBRDlDLFlBQU8sR0FBUCxPQUFPLENBQXlCOzs7O1lBWnpDLGtCQUFhLEdBQUcsSUFBSSxPQUFPLEVBQWlCLENBQUM7WUFTckMsY0FBUyxHQUFHLEtBQUssQ0FBQztZQU14QixJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztZQUM5Qiw0QkFBNEIsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzdELENBQUM7Ozs7O1FBZEQsSUFDSSxRQUFRLEtBQWMsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQzs7Ozs7UUFDbEQsSUFBSSxRQUFRLENBQUMsS0FBYztZQUN6QixJQUFJLENBQUMsU0FBUyxHQUFHLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzlDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hDLENBQUM7Ozs7UUFXRCxXQUFXO1lBQ1QsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNoQyxDQUFDOzs7Z0JBaENGLFNBQVMsU0FBQztvQkFDVCxRQUFRLEVBQUUsaUJBQWlCO29CQUMzQixJQUFJLEVBQUU7d0JBQ0osT0FBTyxFQUFFLGlCQUFpQjtxQkFDM0I7aUJBQ0Y7Ozs7Z0JBWmtCLFVBQVU7Z0RBK0J4QixNQUFNLFNBQUMsZUFBZSxjQUFHLFFBQVE7OzsyQkFWbkMsS0FBSyxTQUFDLHVCQUF1Qjs7SUFxQmhDLG9CQUFDO0tBQUE7U0E3QlksYUFBYTs7O0lBNEJ4Qix5Q0FBZ0Q7Ozs7O0lBMUJoRCxvQ0FBNEI7Ozs7O0lBRzVCLHNDQUE2Qzs7Ozs7SUFTN0Msa0NBQTBCOztJQUd4QixnQ0FBdUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3RpdmUsIEVsZW1lbnRSZWYsIEluamVjdCwgT3B0aW9uYWwsIElucHV0LCBPbkRlc3Ryb3l9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtCb29sZWFuSW5wdXQsIGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7U3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge0NES19EUkFHX1BBUkVOVH0gZnJvbSAnLi4vZHJhZy1wYXJlbnQnO1xuaW1wb3J0IHt0b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zfSBmcm9tICcuLi9kcmFnLXN0eWxpbmcnO1xuXG4vKiogSGFuZGxlIHRoYXQgY2FuIGJlIHVzZWQgdG8gZHJhZyBhbmQgQ2RrRHJhZyBpbnN0YW5jZS4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtEcmFnSGFuZGxlXScsXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLWRyYWctaGFuZGxlJ1xuICB9XG59KVxuZXhwb3J0IGNsYXNzIENka0RyYWdIYW5kbGUgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogQ2xvc2VzdCBwYXJlbnQgZHJhZ2dhYmxlIGluc3RhbmNlLiAqL1xuICBfcGFyZW50RHJhZzoge30gfCB1bmRlZmluZWQ7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHN0YXRlIG9mIHRoZSBoYW5kbGUgaGFzIGNoYW5nZWQuICovXG4gIF9zdGF0ZUNoYW5nZXMgPSBuZXcgU3ViamVjdDxDZGtEcmFnSGFuZGxlPigpO1xuXG4gIC8qKiBXaGV0aGVyIHN0YXJ0aW5nIHRvIGRyYWcgdGhyb3VnaCB0aGlzIGhhbmRsZSBpcyBkaXNhYmxlZC4gKi9cbiAgQElucHV0KCdjZGtEcmFnSGFuZGxlRGlzYWJsZWQnKVxuICBnZXQgZGlzYWJsZWQoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLl9kaXNhYmxlZDsgfVxuICBzZXQgZGlzYWJsZWQodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9kaXNhYmxlZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gICAgdGhpcy5fc3RhdGVDaGFuZ2VzLm5leHQodGhpcyk7XG4gIH1cbiAgcHJpdmF0ZSBfZGlzYWJsZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgQEluamVjdChDREtfRFJBR19QQVJFTlQpIEBPcHRpb25hbCgpIHBhcmVudERyYWc/OiBhbnkpIHtcblxuICAgIHRoaXMuX3BhcmVudERyYWcgPSBwYXJlbnREcmFnO1xuICAgIHRvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMoZWxlbWVudC5uYXRpdmVFbGVtZW50LCBmYWxzZSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9zdGF0ZUNoYW5nZXMuY29tcGxldGUoKTtcbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9kaXNhYmxlZDogQm9vbGVhbklucHV0O1xufVxuIl19