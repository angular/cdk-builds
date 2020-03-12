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
/**
 * Gets the shadow root of an element, if supported and the element is inside the Shadow DOM.
 * @param {?} element
 * @return {?}
 */
export function _getShadowRoot(element) {
    if (_supportsShadowDom()) {
        /** @type {?} */
        const rootNode = element.getRootNode ? element.getRootNode() : null;
        if (rootNode instanceof ShadowRoot) {
            return rootNode;
        }
    }
    return null;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhZG93LWRvbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvcGxhdGZvcm0vZmVhdHVyZXMvc2hhZG93LWRvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0lBUUksb0JBQTZCOzs7OztBQUdqQyxNQUFNLFVBQVUsa0JBQWtCO0lBQ2hDLElBQUksb0JBQW9CLElBQUksSUFBSSxFQUFFOztjQUMxQixJQUFJLEdBQUcsT0FBTyxRQUFRLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJO1FBQ25FLG9CQUFvQixHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsbUJBQUEsSUFBSSxFQUFPLENBQUMsQ0FBQyxnQkFBZ0IsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztLQUMxRjtJQUVELE9BQU8sb0JBQW9CLENBQUM7QUFDOUIsQ0FBQzs7Ozs7O0FBR0QsTUFBTSxVQUFVLGNBQWMsQ0FBQyxPQUFvQjtJQUNqRCxJQUFJLGtCQUFrQixFQUFFLEVBQUU7O2NBQ2xCLFFBQVEsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUk7UUFFbkUsSUFBSSxRQUFRLFlBQVksVUFBVSxFQUFFO1lBQ2xDLE9BQU8sUUFBUSxDQUFDO1NBQ2pCO0tBQ0Y7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxubGV0IHNoYWRvd0RvbUlzU3VwcG9ydGVkOiBib29sZWFuO1xuXG4vKiogQ2hlY2tzIHdoZXRoZXIgdGhlIHVzZXIncyBicm93c2VyIHN1cHBvcnQgU2hhZG93IERPTS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfc3VwcG9ydHNTaGFkb3dEb20oKTogYm9vbGVhbiB7XG4gIGlmIChzaGFkb3dEb21Jc1N1cHBvcnRlZCA9PSBudWxsKSB7XG4gICAgY29uc3QgaGVhZCA9IHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcgPyBkb2N1bWVudC5oZWFkIDogbnVsbDtcbiAgICBzaGFkb3dEb21Jc1N1cHBvcnRlZCA9ICEhKGhlYWQgJiYgKChoZWFkIGFzIGFueSkuY3JlYXRlU2hhZG93Um9vdCB8fCBoZWFkLmF0dGFjaFNoYWRvdykpO1xuICB9XG5cbiAgcmV0dXJuIHNoYWRvd0RvbUlzU3VwcG9ydGVkO1xufVxuXG4vKiogR2V0cyB0aGUgc2hhZG93IHJvb3Qgb2YgYW4gZWxlbWVudCwgaWYgc3VwcG9ydGVkIGFuZCB0aGUgZWxlbWVudCBpcyBpbnNpZGUgdGhlIFNoYWRvdyBET00uICovXG5leHBvcnQgZnVuY3Rpb24gX2dldFNoYWRvd1Jvb3QoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBOb2RlIHwgbnVsbCB7XG4gIGlmIChfc3VwcG9ydHNTaGFkb3dEb20oKSkge1xuICAgIGNvbnN0IHJvb3ROb2RlID0gZWxlbWVudC5nZXRSb290Tm9kZSA/IGVsZW1lbnQuZ2V0Um9vdE5vZGUoKSA6IG51bGw7XG5cbiAgICBpZiAocm9vdE5vZGUgaW5zdGFuY2VvZiBTaGFkb3dSb290KSB7XG4gICAgICByZXR1cm4gcm9vdE5vZGU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG4iXX0=