/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __decorate, __metadata } from "tslib";
import { Directive, TemplateRef, Input } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
/**
 * Element that will be used as a template for the preview
 * of a CdkDrag when it is being dragged.
 */
let CdkDragPreview = /** @class */ (() => {
    let CdkDragPreview = class CdkDragPreview {
        constructor(templateRef) {
            this.templateRef = templateRef;
            this._matchSize = false;
        }
        /** Whether the preview should preserve the same size as the item that is being dragged. */
        get matchSize() { return this._matchSize; }
        set matchSize(value) { this._matchSize = coerceBooleanProperty(value); }
    };
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], CdkDragPreview.prototype, "data", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Boolean),
        __metadata("design:paramtypes", [Boolean])
    ], CdkDragPreview.prototype, "matchSize", null);
    CdkDragPreview = __decorate([
        Directive({
            selector: 'ng-template[cdkDragPreview]'
        }),
        __metadata("design:paramtypes", [TemplateRef])
    ], CdkDragPreview);
    return CdkDragPreview;
})();
export { CdkDragPreview };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1wcmV2aWV3LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZGlyZWN0aXZlcy9kcmFnLXByZXZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBQyxTQUFTLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM1RCxPQUFPLEVBQWUscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUUxRTs7O0dBR0c7QUFJSDtJQUFBLElBQWEsY0FBYyxHQUEzQixNQUFhLGNBQWM7UUFVekIsWUFBbUIsV0FBMkI7WUFBM0IsZ0JBQVcsR0FBWCxXQUFXLENBQWdCO1lBRnRDLGVBQVUsR0FBRyxLQUFLLENBQUM7UUFFc0IsQ0FBQztRQU5sRCwyRkFBMkY7UUFFM0YsSUFBSSxTQUFTLEtBQWMsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUNwRCxJQUFJLFNBQVMsQ0FBQyxLQUFjLElBQUksSUFBSSxDQUFDLFVBQVUsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FNbEYsQ0FBQTtJQVhVO1FBQVIsS0FBSyxFQUFFOztnREFBUztJQUlqQjtRQURDLEtBQUssRUFBRTs7O21EQUM0QztJQU56QyxjQUFjO1FBSDFCLFNBQVMsQ0FBQztZQUNULFFBQVEsRUFBRSw2QkFBNkI7U0FDeEMsQ0FBQzt5Q0FXZ0MsV0FBVztPQVZoQyxjQUFjLENBYTFCO0lBQUQscUJBQUM7S0FBQTtTQWJZLGNBQWMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3RpdmUsIFRlbXBsYXRlUmVmLCBJbnB1dH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0Jvb2xlYW5JbnB1dCwgY29lcmNlQm9vbGVhblByb3BlcnR5fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuXG4vKipcbiAqIEVsZW1lbnQgdGhhdCB3aWxsIGJlIHVzZWQgYXMgYSB0ZW1wbGF0ZSBmb3IgdGhlIHByZXZpZXdcbiAqIG9mIGEgQ2RrRHJhZyB3aGVuIGl0IGlzIGJlaW5nIGRyYWdnZWQuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ25nLXRlbXBsYXRlW2Nka0RyYWdQcmV2aWV3XSdcbn0pXG5leHBvcnQgY2xhc3MgQ2RrRHJhZ1ByZXZpZXc8VCA9IGFueT4ge1xuICAvKiogQ29udGV4dCBkYXRhIHRvIGJlIGFkZGVkIHRvIHRoZSBwcmV2aWV3IHRlbXBsYXRlIGluc3RhbmNlLiAqL1xuICBASW5wdXQoKSBkYXRhOiBUO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBwcmV2aWV3IHNob3VsZCBwcmVzZXJ2ZSB0aGUgc2FtZSBzaXplIGFzIHRoZSBpdGVtIHRoYXQgaXMgYmVpbmcgZHJhZ2dlZC4gKi9cbiAgQElucHV0KClcbiAgZ2V0IG1hdGNoU2l6ZSgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX21hdGNoU2l6ZTsgfVxuICBzZXQgbWF0Y2hTaXplKHZhbHVlOiBib29sZWFuKSB7IHRoaXMuX21hdGNoU2l6ZSA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7IH1cbiAgcHJpdmF0ZSBfbWF0Y2hTaXplID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IocHVibGljIHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxUPikge31cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfbWF0Y2hTaXplOiBCb29sZWFuSW5wdXQ7XG59XG4iXX0=