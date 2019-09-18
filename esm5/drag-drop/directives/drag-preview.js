/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, TemplateRef, Input } from '@angular/core';
/**
 * Element that will be used as a template for the preview
 * of a CdkDrag when it is being dragged.
 */
var CdkDragPreview = /** @class */ (function () {
    function CdkDragPreview(templateRef) {
        this.templateRef = templateRef;
    }
    CdkDragPreview.decorators = [
        { type: Directive, args: [{
                    selector: 'ng-template[cdkDragPreview]'
                },] }
    ];
    /** @nocollapse */
    CdkDragPreview.ctorParameters = function () { return [
        { type: TemplateRef }
    ]; };
    CdkDragPreview.propDecorators = {
        data: [{ type: Input }]
    };
    return CdkDragPreview;
}());
export { CdkDragPreview };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1wcmV2aWV3LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZGlyZWN0aXZlcy9kcmFnLXByZXZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRTVEOzs7R0FHRztBQUNIO0lBTUUsd0JBQW1CLFdBQTJCO1FBQTNCLGdCQUFXLEdBQVgsV0FBVyxDQUFnQjtJQUFHLENBQUM7O2dCQU5uRCxTQUFTLFNBQUM7b0JBQ1QsUUFBUSxFQUFFLDZCQUE2QjtpQkFDeEM7Ozs7Z0JBUmtCLFdBQVc7Ozt1QkFXM0IsS0FBSzs7SUFFUixxQkFBQztDQUFBLEFBUEQsSUFPQztTQUpZLGNBQWMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3RpdmUsIFRlbXBsYXRlUmVmLCBJbnB1dH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbi8qKlxuICogRWxlbWVudCB0aGF0IHdpbGwgYmUgdXNlZCBhcyBhIHRlbXBsYXRlIGZvciB0aGUgcHJldmlld1xuICogb2YgYSBDZGtEcmFnIHdoZW4gaXQgaXMgYmVpbmcgZHJhZ2dlZC5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnbmctdGVtcGxhdGVbY2RrRHJhZ1ByZXZpZXddJ1xufSlcbmV4cG9ydCBjbGFzcyBDZGtEcmFnUHJldmlldzxUID0gYW55PiB7XG4gIC8qKiBDb250ZXh0IGRhdGEgdG8gYmUgYWRkZWQgdG8gdGhlIHByZXZpZXcgdGVtcGxhdGUgaW5zdGFuY2UuICovXG4gIEBJbnB1dCgpIGRhdGE6IFQ7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyB0ZW1wbGF0ZVJlZjogVGVtcGxhdGVSZWY8VD4pIHt9XG59XG4iXX0=