/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/drag-drop/directives/drag-preview.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, TemplateRef, Input } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
/**
 * Element that will be used as a template for the preview
 * of a CdkDrag when it is being dragged.
 * @template T
 */
let CdkDragPreview = /** @class */ (() => {
    /**
     * Element that will be used as a template for the preview
     * of a CdkDrag when it is being dragged.
     * @template T
     */
    class CdkDragPreview {
        /**
         * @param {?} templateRef
         */
        constructor(templateRef) {
            this.templateRef = templateRef;
            this._matchSize = false;
        }
        /**
         * Whether the preview should preserve the same size as the item that is being dragged.
         * @return {?}
         */
        get matchSize() { return this._matchSize; }
        /**
         * @param {?} value
         * @return {?}
         */
        set matchSize(value) { this._matchSize = coerceBooleanProperty(value); }
    }
    CdkDragPreview.decorators = [
        { type: Directive, args: [{
                    selector: 'ng-template[cdkDragPreview]'
                },] }
    ];
    /** @nocollapse */
    CdkDragPreview.ctorParameters = () => [
        { type: TemplateRef }
    ];
    CdkDragPreview.propDecorators = {
        data: [{ type: Input }],
        matchSize: [{ type: Input }]
    };
    return CdkDragPreview;
})();
export { CdkDragPreview };
if (false) {
    /** @type {?} */
    CdkDragPreview.ngAcceptInputType_matchSize;
    /**
     * Context data to be added to the preview template instance.
     * @type {?}
     */
    CdkDragPreview.prototype.data;
    /**
     * @type {?}
     * @private
     */
    CdkDragPreview.prototype._matchSize;
    /** @type {?} */
    CdkDragPreview.prototype.templateRef;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1wcmV2aWV3LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZGlyZWN0aXZlcy9kcmFnLXByZXZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzVELE9BQU8sRUFBZSxxQkFBcUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDOzs7Ozs7QUFNMUU7Ozs7OztJQUFBLE1BR2EsY0FBYzs7OztRQVV6QixZQUFtQixXQUEyQjtZQUEzQixnQkFBVyxHQUFYLFdBQVcsQ0FBZ0I7WUFGdEMsZUFBVSxHQUFHLEtBQUssQ0FBQztRQUVzQixDQUFDOzs7OztRQUxsRCxJQUNJLFNBQVMsS0FBYyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDOzs7OztRQUNwRCxJQUFJLFNBQVMsQ0FBQyxLQUFjLElBQUksSUFBSSxDQUFDLFVBQVUsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7OztnQkFWbEYsU0FBUyxTQUFDO29CQUNULFFBQVEsRUFBRSw2QkFBNkI7aUJBQ3hDOzs7O2dCQVRrQixXQUFXOzs7dUJBWTNCLEtBQUs7NEJBR0wsS0FBSzs7SUFRUixxQkFBQztLQUFBO1NBYlksY0FBYzs7O0lBWXpCLDJDQUFpRDs7Ozs7SUFWakQsOEJBQWlCOzs7OztJQU1qQixvQ0FBMkI7O0lBRWYscUNBQWtDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aXZlLCBUZW1wbGF0ZVJlZiwgSW5wdXR9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtCb29sZWFuSW5wdXQsIGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcblxuLyoqXG4gKiBFbGVtZW50IHRoYXQgd2lsbCBiZSB1c2VkIGFzIGEgdGVtcGxhdGUgZm9yIHRoZSBwcmV2aWV3XG4gKiBvZiBhIENka0RyYWcgd2hlbiBpdCBpcyBiZWluZyBkcmFnZ2VkLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICduZy10ZW1wbGF0ZVtjZGtEcmFnUHJldmlld10nXG59KVxuZXhwb3J0IGNsYXNzIENka0RyYWdQcmV2aWV3PFQgPSBhbnk+IHtcbiAgLyoqIENvbnRleHQgZGF0YSB0byBiZSBhZGRlZCB0byB0aGUgcHJldmlldyB0ZW1wbGF0ZSBpbnN0YW5jZS4gKi9cbiAgQElucHV0KCkgZGF0YTogVDtcblxuICAvKiogV2hldGhlciB0aGUgcHJldmlldyBzaG91bGQgcHJlc2VydmUgdGhlIHNhbWUgc2l6ZSBhcyB0aGUgaXRlbSB0aGF0IGlzIGJlaW5nIGRyYWdnZWQuICovXG4gIEBJbnB1dCgpXG4gIGdldCBtYXRjaFNpemUoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLl9tYXRjaFNpemU7IH1cbiAgc2V0IG1hdGNoU2l6ZSh2YWx1ZTogYm9vbGVhbikgeyB0aGlzLl9tYXRjaFNpemUgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpOyB9XG4gIHByaXZhdGUgX21hdGNoU2l6ZSA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyB0ZW1wbGF0ZVJlZjogVGVtcGxhdGVSZWY8VD4pIHt9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX21hdGNoU2l6ZTogQm9vbGVhbklucHV0O1xufVxuIl19