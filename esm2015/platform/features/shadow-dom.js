/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** @type {?} */
let shadowDomIsSupported;
/**
 * Checks whether the user's browser support Shadow DOM.
 * @return {?}
 */
export function _supportsShadowDom() {
    if (shadowDomIsSupported == null) {
        /** @type {?} */
        const head = typeof document !== 'undefined' ? document.head : null;
        shadowDomIsSupported = !!(head && (((/** @type {?} */ (head))).createShadowRoot || head.attachShadow));
    }
    return shadowDomIsSupported;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhZG93LWRvbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvcGxhdGZvcm0vZmVhdHVyZXMvc2hhZG93LWRvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7SUFRSSxvQkFBNkI7Ozs7O0FBR2pDLE1BQU0sVUFBVSxrQkFBa0I7SUFDaEMsSUFBSSxvQkFBb0IsSUFBSSxJQUFJLEVBQUU7O2NBQzFCLElBQUksR0FBRyxPQUFPLFFBQVEsS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUk7UUFDbkUsb0JBQW9CLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxtQkFBQSxJQUFJLEVBQU8sQ0FBQyxDQUFDLGdCQUFnQixJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO0tBQzFGO0lBRUQsT0FBTyxvQkFBb0IsQ0FBQztBQUM5QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmxldCBzaGFkb3dEb21Jc1N1cHBvcnRlZDogYm9vbGVhbjtcblxuLyoqIENoZWNrcyB3aGV0aGVyIHRoZSB1c2VyJ3MgYnJvd3NlciBzdXBwb3J0IFNoYWRvdyBET00uICovXG5leHBvcnQgZnVuY3Rpb24gX3N1cHBvcnRzU2hhZG93RG9tKCk6IGJvb2xlYW4ge1xuICBpZiAoc2hhZG93RG9tSXNTdXBwb3J0ZWQgPT0gbnVsbCkge1xuICAgIGNvbnN0IGhlYWQgPSB0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnID8gZG9jdW1lbnQuaGVhZCA6IG51bGw7XG4gICAgc2hhZG93RG9tSXNTdXBwb3J0ZWQgPSAhIShoZWFkICYmICgoaGVhZCBhcyBhbnkpLmNyZWF0ZVNoYWRvd1Jvb3QgfHwgaGVhZC5hdHRhY2hTaGFkb3cpKTtcbiAgfVxuXG4gIHJldHVybiBzaGFkb3dEb21Jc1N1cHBvcnRlZDtcbn1cbiJdfQ==