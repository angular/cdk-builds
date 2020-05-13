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
    /** @type {?|undefined} */
    DragDropConfig.prototype.zIndex;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZGlyZWN0aXZlcy9jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQzs7Ozs7O0FBbUI3QyxNQUFNLE9BQU8sZUFBZSxHQUFHLElBQUksY0FBYyxDQUFpQixpQkFBaUIsQ0FBQzs7Ozs7O0FBTXBGLG9DQVlDOzs7SUFYQyxrQ0FBb0I7O0lBQ3BCLHdDQUFnQzs7SUFDaEMsMkNBQTBDOztJQUMxQyxzQ0FBaUM7O0lBQ2pDLHlDQUF5Qjs7SUFDekIsNkNBQTZCOztJQUM3QiwwQ0FBMkI7O0lBQzNCLHlDQUEwQjs7SUFDMUIsZ0RBQWlDOztJQUNqQyx5Q0FBc0M7O0lBQ3RDLGdDQUFnQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7RHJhZ1JlZkNvbmZpZywgUG9pbnQsIERyYWdSZWZ9IGZyb20gJy4uL2RyYWctcmVmJztcblxuLyoqIFBvc3NpYmxlIHZhbHVlcyB0aGF0IGNhbiBiZSB1c2VkIHRvIGNvbmZpZ3VyZSB0aGUgZHJhZyBzdGFydCBkZWxheS4gKi9cbmV4cG9ydCB0eXBlIERyYWdTdGFydERlbGF5ID0gbnVtYmVyIHwge3RvdWNoOiBudW1iZXIsIG1vdXNlOiBudW1iZXJ9O1xuXG4vKiogUG9zc2libGUgYXhpcyBhbG9uZyB3aGljaCBkcmFnZ2luZyBjYW4gYmUgbG9ja2VkLiAqL1xuZXhwb3J0IHR5cGUgRHJhZ0F4aXMgPSAneCcgfCAneSc7XG5cbi8qKiBGdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHRvIGNvbnN0cmFpbiB0aGUgcG9zaXRpb24gb2YgYSBkcmFnZ2VkIGVsZW1lbnQuICovXG5leHBvcnQgdHlwZSBEcmFnQ29uc3RyYWluUG9zaXRpb24gPSAocG9pbnQ6IFBvaW50LCBkcmFnUmVmOiBEcmFnUmVmKSA9PiBQb2ludDtcblxuLyoqIFBvc3NpYmxlIG9yaWVudGF0aW9ucyBmb3IgYSBkcm9wIGxpc3QuICovXG5leHBvcnQgdHlwZSBEcm9wTGlzdE9yaWVudGF0aW9uID0gJ2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJztcblxuLyoqXG4gKiBJbmplY3Rpb24gdG9rZW4gdGhhdCBjYW4gYmUgdXNlZCB0byBjb25maWd1cmUgdGhlXG4gKiBiZWhhdmlvciBvZiB0aGUgZHJhZyZkcm9wLXJlbGF0ZWQgY29tcG9uZW50cy5cbiAqL1xuZXhwb3J0IGNvbnN0IENES19EUkFHX0NPTkZJRyA9IG5ldyBJbmplY3Rpb25Ub2tlbjxEcmFnRHJvcENvbmZpZz4oJ0NES19EUkFHX0NPTkZJRycpO1xuXG4vKipcbiAqIE9iamVjdCB0aGF0IGNhbiBiZSB1c2VkIHRvIGNvbmZpZ3VyZSB0aGUgZHJhZ1xuICogaXRlbXMgYW5kIGRyb3AgbGlzdHMgd2l0aGluIGEgbW9kdWxlIG9yIGEgY29tcG9uZW50LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERyYWdEcm9wQ29uZmlnIGV4dGVuZHMgUGFydGlhbDxEcmFnUmVmQ29uZmlnPiB7XG4gIGxvY2tBeGlzPzogRHJhZ0F4aXM7XG4gIGRyYWdTdGFydERlbGF5PzogRHJhZ1N0YXJ0RGVsYXk7XG4gIGNvbnN0cmFpblBvc2l0aW9uPzogRHJhZ0NvbnN0cmFpblBvc2l0aW9uO1xuICBwcmV2aWV3Q2xhc3M/OiBzdHJpbmcgfCBzdHJpbmdbXTtcbiAgYm91bmRhcnlFbGVtZW50Pzogc3RyaW5nO1xuICByb290RWxlbWVudFNlbGVjdG9yPzogc3RyaW5nO1xuICBkcmFnZ2luZ0Rpc2FibGVkPzogYm9vbGVhbjtcbiAgc29ydGluZ0Rpc2FibGVkPzogYm9vbGVhbjtcbiAgbGlzdEF1dG9TY3JvbGxEaXNhYmxlZD86IGJvb2xlYW47XG4gIGxpc3RPcmllbnRhdGlvbj86IERyb3BMaXN0T3JpZW50YXRpb247XG4gIHpJbmRleD86IG51bWJlcjtcbn1cbiJdfQ==