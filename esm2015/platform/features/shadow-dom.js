/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/platform/features/shadow-dom.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhZG93LWRvbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvcGxhdGZvcm0vZmVhdHVyZXMvc2hhZG93LWRvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0lBUUksb0JBQTZCOzs7OztBQUdqQyxNQUFNLFVBQVUsa0JBQWtCO0lBQ2hDLElBQUksb0JBQW9CLElBQUksSUFBSSxFQUFFOztjQUMxQixJQUFJLEdBQUcsT0FBTyxRQUFRLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJO1FBQ25FLG9CQUFvQixHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsbUJBQUEsSUFBSSxFQUFPLENBQUMsQ0FBQyxnQkFBZ0IsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztLQUMxRjtJQUVELE9BQU8sb0JBQW9CLENBQUM7QUFDOUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5sZXQgc2hhZG93RG9tSXNTdXBwb3J0ZWQ6IGJvb2xlYW47XG5cbi8qKiBDaGVja3Mgd2hldGhlciB0aGUgdXNlcidzIGJyb3dzZXIgc3VwcG9ydCBTaGFkb3cgRE9NLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIF9zdXBwb3J0c1NoYWRvd0RvbSgpOiBib29sZWFuIHtcbiAgaWYgKHNoYWRvd0RvbUlzU3VwcG9ydGVkID09IG51bGwpIHtcbiAgICBjb25zdCBoZWFkID0gdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyA/IGRvY3VtZW50LmhlYWQgOiBudWxsO1xuICAgIHNoYWRvd0RvbUlzU3VwcG9ydGVkID0gISEoaGVhZCAmJiAoKGhlYWQgYXMgYW55KS5jcmVhdGVTaGFkb3dSb290IHx8IGhlYWQuYXR0YWNoU2hhZG93KSk7XG4gIH1cblxuICByZXR1cm4gc2hhZG93RG9tSXNTdXBwb3J0ZWQ7XG59XG4iXX0=