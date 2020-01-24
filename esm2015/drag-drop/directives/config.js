/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/drag-drop/directives/config.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from '@angular/core';
/**
 * Injection token that can be used to configure the
 * behavior of the drag&drop-related components.
 * @type {?}
 */
export const CDK_DRAG_CONFIG = new InjectionToken('CDK_DRAG_CONFIG');
/**
 * Object that can be used to configure the drag
 * items and drop lists within a module or a component.
 * @record
 */
export function DragDropConfig() { }
if (false) {
    /** @type {?|undefined} */
    DragDropConfig.prototype.lockAxis;
    /** @type {?|undefined} */
    DragDropConfig.prototype.dragStartDelay;
    /** @type {?|undefined} */
    DragDropConfig.prototype.constrainPosition;
    /** @type {?|undefined} */
    DragDropConfig.prototype.previewClass;
    /** @type {?|undefined} */
    DragDropConfig.prototype.boundaryElement;
    /** @type {?|undefined} */
    DragDropConfig.prototype.rootElementSelector;
    /** @type {?|undefined} */
    DragDropConfig.prototype.draggingDisabled;
    /** @type {?|undefined} */
    DragDropConfig.prototype.sortingDisabled;
    /** @type {?|undefined} */
    DragDropConfig.prototype.listAutoScrollDisabled;
    /** @type {?|undefined} */
    DragDropConfig.prototype.listOrientation;
}
/**
 * @deprecated No longer being used. To be removed.
 * \@breaking-change 10.0.0
 * \@docs-private
 * @return {?}
 */
export function CDK_DRAG_CONFIG_FACTORY() {
    return { dragStartThreshold: 5, pointerDirectionChangeThreshold: 5 };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZGlyZWN0aXZlcy9jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQzs7Ozs7O0FBbUI3QyxNQUFNLE9BQU8sZUFBZSxHQUFHLElBQUksY0FBYyxDQUFpQixpQkFBaUIsQ0FBQzs7Ozs7O0FBTXBGLG9DQVdDOzs7SUFWQyxrQ0FBb0I7O0lBQ3BCLHdDQUFnQzs7SUFDaEMsMkNBQTBDOztJQUMxQyxzQ0FBaUM7O0lBQ2pDLHlDQUF5Qjs7SUFDekIsNkNBQTZCOztJQUM3QiwwQ0FBMkI7O0lBQzNCLHlDQUEwQjs7SUFDMUIsZ0RBQWlDOztJQUNqQyx5Q0FBc0M7Ozs7Ozs7O0FBUXhDLE1BQU0sVUFBVSx1QkFBdUI7SUFDckMsT0FBTyxFQUFDLGtCQUFrQixFQUFFLENBQUMsRUFBRSwrQkFBK0IsRUFBRSxDQUFDLEVBQUMsQ0FBQztBQUNyRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtEcmFnUmVmQ29uZmlnLCBQb2ludCwgRHJhZ1JlZn0gZnJvbSAnLi4vZHJhZy1yZWYnO1xuXG4vKiogUG9zc2libGUgdmFsdWVzIHRoYXQgY2FuIGJlIHVzZWQgdG8gY29uZmlndXJlIHRoZSBkcmFnIHN0YXJ0IGRlbGF5LiAqL1xuZXhwb3J0IHR5cGUgRHJhZ1N0YXJ0RGVsYXkgPSBudW1iZXIgfCB7dG91Y2g6IG51bWJlciwgbW91c2U6IG51bWJlcn07XG5cbi8qKiBQb3NzaWJsZSBheGlzIGFsb25nIHdoaWNoIGRyYWdnaW5nIGNhbiBiZSBsb2NrZWQuICovXG5leHBvcnQgdHlwZSBEcmFnQXhpcyA9ICd4JyB8ICd5JztcblxuLyoqIEZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gY29uc3RyYWluIHRoZSBwb3NpdGlvbiBvZiBhIGRyYWdnZWQgZWxlbWVudC4gKi9cbmV4cG9ydCB0eXBlIERyYWdDb25zdHJhaW5Qb3NpdGlvbiA9IChwb2ludDogUG9pbnQsIGRyYWdSZWY6IERyYWdSZWYpID0+IFBvaW50O1xuXG4vKiogUG9zc2libGUgb3JpZW50YXRpb25zIGZvciBhIGRyb3AgbGlzdC4gKi9cbmV4cG9ydCB0eXBlIERyb3BMaXN0T3JpZW50YXRpb24gPSAnaG9yaXpvbnRhbCcgfCAndmVydGljYWwnO1xuXG4vKipcbiAqIEluamVjdGlvbiB0b2tlbiB0aGF0IGNhbiBiZSB1c2VkIHRvIGNvbmZpZ3VyZSB0aGVcbiAqIGJlaGF2aW9yIG9mIHRoZSBkcmFnJmRyb3AtcmVsYXRlZCBjb21wb25lbnRzLlxuICovXG5leHBvcnQgY29uc3QgQ0RLX0RSQUdfQ09ORklHID0gbmV3IEluamVjdGlvblRva2VuPERyYWdEcm9wQ29uZmlnPignQ0RLX0RSQUdfQ09ORklHJyk7XG5cbi8qKlxuICogT2JqZWN0IHRoYXQgY2FuIGJlIHVzZWQgdG8gY29uZmlndXJlIHRoZSBkcmFnXG4gKiBpdGVtcyBhbmQgZHJvcCBsaXN0cyB3aXRoaW4gYSBtb2R1bGUgb3IgYSBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRHJhZ0Ryb3BDb25maWcgZXh0ZW5kcyBQYXJ0aWFsPERyYWdSZWZDb25maWc+IHtcbiAgbG9ja0F4aXM/OiBEcmFnQXhpcztcbiAgZHJhZ1N0YXJ0RGVsYXk/OiBEcmFnU3RhcnREZWxheTtcbiAgY29uc3RyYWluUG9zaXRpb24/OiBEcmFnQ29uc3RyYWluUG9zaXRpb247XG4gIHByZXZpZXdDbGFzcz86IHN0cmluZyB8IHN0cmluZ1tdO1xuICBib3VuZGFyeUVsZW1lbnQ/OiBzdHJpbmc7XG4gIHJvb3RFbGVtZW50U2VsZWN0b3I/OiBzdHJpbmc7XG4gIGRyYWdnaW5nRGlzYWJsZWQ/OiBib29sZWFuO1xuICBzb3J0aW5nRGlzYWJsZWQ/OiBib29sZWFuO1xuICBsaXN0QXV0b1Njcm9sbERpc2FibGVkPzogYm9vbGVhbjtcbiAgbGlzdE9yaWVudGF0aW9uPzogRHJvcExpc3RPcmllbnRhdGlvbjtcbn1cblxuLyoqXG4gKiBAZGVwcmVjYXRlZCBObyBsb25nZXIgYmVpbmcgdXNlZC4gVG8gYmUgcmVtb3ZlZC5cbiAqIEBicmVha2luZy1jaGFuZ2UgMTAuMC4wXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBDREtfRFJBR19DT05GSUdfRkFDVE9SWSgpOiBEcmFnRHJvcENvbmZpZyB7XG4gIHJldHVybiB7ZHJhZ1N0YXJ0VGhyZXNob2xkOiA1LCBwb2ludGVyRGlyZWN0aW9uQ2hhbmdlVGhyZXNob2xkOiA1fTtcbn1cbiJdfQ==