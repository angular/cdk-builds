/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ListKeyManager } from './list-key-manager';
/**
 * This is the interface for highlightable items (used by the ActiveDescendantKeyManager).
 * Each item must know how to style itself as active or inactive and whether or not it is
 * currently disabled.
 * @record
 */
export function Highlightable() { }
if (false) {
    /**
     * Applies the styles for an active item to this item.
     * @return {?}
     */
    Highlightable.prototype.setActiveStyles = function () { };
    /**
     * Applies the styles for an inactive item to this item.
     * @return {?}
     */
    Highlightable.prototype.setInactiveStyles = function () { };
}
/**
 * @template T
 */
export class ActiveDescendantKeyManager extends ListKeyManager {
    /**
     * @param {?} index
     * @return {?}
     */
    setActiveItem(index) {
        if (this.activeItem) {
            this.activeItem.setInactiveStyles();
        }
        super.setActiveItem(index);
        if (this.activeItem) {
            this.activeItem.setActiveStyles();
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aXZlZGVzY2VuZGFudC1rZXktbWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvYTExeS9rZXktbWFuYWdlci9hY3RpdmVkZXNjZW5kYW50LWtleS1tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGNBQWMsRUFBdUIsTUFBTSxvQkFBb0IsQ0FBQzs7Ozs7OztBQU94RSxtQ0FNQzs7Ozs7O0lBSkMsMERBQXdCOzs7OztJQUd4Qiw0REFBMEI7Ozs7O0FBRzVCLE1BQU0sT0FBTywwQkFBOEIsU0FBUSxjQUFpQzs7Ozs7SUFrQmxGLGFBQWEsQ0FBQyxLQUFVO1FBQ3RCLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNuQixJQUFJLENBQUMsVUFBVSxDQUFDLGlCQUFpQixFQUFFLENBQUM7U0FDckM7UUFDRCxLQUFLLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNCLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNuQixJQUFJLENBQUMsVUFBVSxDQUFDLGVBQWUsRUFBRSxDQUFDO1NBQ25DO0lBQ0gsQ0FBQztDQUVGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7TGlzdEtleU1hbmFnZXIsIExpc3RLZXlNYW5hZ2VyT3B0aW9ufSBmcm9tICcuL2xpc3Qta2V5LW1hbmFnZXInO1xuXG4vKipcbiAqIFRoaXMgaXMgdGhlIGludGVyZmFjZSBmb3IgaGlnaGxpZ2h0YWJsZSBpdGVtcyAodXNlZCBieSB0aGUgQWN0aXZlRGVzY2VuZGFudEtleU1hbmFnZXIpLlxuICogRWFjaCBpdGVtIG11c3Qga25vdyBob3cgdG8gc3R5bGUgaXRzZWxmIGFzIGFjdGl2ZSBvciBpbmFjdGl2ZSBhbmQgd2hldGhlciBvciBub3QgaXQgaXNcbiAqIGN1cnJlbnRseSBkaXNhYmxlZC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBIaWdobGlnaHRhYmxlIGV4dGVuZHMgTGlzdEtleU1hbmFnZXJPcHRpb24ge1xuICAvKiogQXBwbGllcyB0aGUgc3R5bGVzIGZvciBhbiBhY3RpdmUgaXRlbSB0byB0aGlzIGl0ZW0uICovXG4gIHNldEFjdGl2ZVN0eWxlcygpOiB2b2lkO1xuXG4gIC8qKiBBcHBsaWVzIHRoZSBzdHlsZXMgZm9yIGFuIGluYWN0aXZlIGl0ZW0gdG8gdGhpcyBpdGVtLiAqL1xuICBzZXRJbmFjdGl2ZVN0eWxlcygpOiB2b2lkO1xufVxuXG5leHBvcnQgY2xhc3MgQWN0aXZlRGVzY2VuZGFudEtleU1hbmFnZXI8VD4gZXh0ZW5kcyBMaXN0S2V5TWFuYWdlcjxIaWdobGlnaHRhYmxlICYgVD4ge1xuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBhY3RpdmUgaXRlbSB0byB0aGUgaXRlbSBhdCB0aGUgc3BlY2lmaWVkIGluZGV4IGFuZCBhZGRzIHRoZVxuICAgKiBhY3RpdmUgc3R5bGVzIHRvIHRoZSBuZXdseSBhY3RpdmUgaXRlbS4gQWxzbyByZW1vdmVzIGFjdGl2ZSBzdHlsZXNcbiAgICogZnJvbSB0aGUgcHJldmlvdXNseSBhY3RpdmUgaXRlbS5cbiAgICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBpdGVtIHRvIGJlIHNldCBhcyBhY3RpdmUuXG4gICAqL1xuICBzZXRBY3RpdmVJdGVtKGluZGV4OiBudW1iZXIpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBhY3RpdmUgaXRlbSB0byB0aGUgaXRlbSB0byB0aGUgc3BlY2lmaWVkIG9uZSBhbmQgYWRkcyB0aGVcbiAgICogYWN0aXZlIHN0eWxlcyB0byB0aGUgaXQuIEFsc28gcmVtb3ZlcyBhY3RpdmUgc3R5bGVzIGZyb20gdGhlXG4gICAqIHByZXZpb3VzbHkgYWN0aXZlIGl0ZW0uXG4gICAqIEBwYXJhbSBpdGVtIEl0ZW0gdG8gYmUgc2V0IGFzIGFjdGl2ZS5cbiAgICovXG4gIHNldEFjdGl2ZUl0ZW0oaXRlbTogVCk6IHZvaWQ7XG5cbiAgc2V0QWN0aXZlSXRlbShpbmRleDogYW55KTogdm9pZCB7XG4gICAgaWYgKHRoaXMuYWN0aXZlSXRlbSkge1xuICAgICAgdGhpcy5hY3RpdmVJdGVtLnNldEluYWN0aXZlU3R5bGVzKCk7XG4gICAgfVxuICAgIHN1cGVyLnNldEFjdGl2ZUl0ZW0oaW5kZXgpO1xuICAgIGlmICh0aGlzLmFjdGl2ZUl0ZW0pIHtcbiAgICAgIHRoaXMuYWN0aXZlSXRlbS5zZXRBY3RpdmVTdHlsZXMoKTtcbiAgICB9XG4gIH1cblxufVxuIl19