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
/**
 * Cached result of whether the user's browser supports passive event listeners.
 * @type {?}
 */
let supportsPassiveEvents;
/**
 * Checks whether the user's browser supports passive event listeners.
 * See: https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md
 * @return {?}
 */
export function supportsPassiveEventListeners() {
    if (supportsPassiveEvents == null && typeof window !== 'undefined') {
        try {
            window.addEventListener('test', (/** @type {?} */ (null)), Object.defineProperty({}, 'passive', {
                get: (/**
                 * @return {?}
                 */
                () => supportsPassiveEvents = true)
            }));
        }
        finally {
            supportsPassiveEvents = supportsPassiveEvents || false;
        }
    }
    return supportsPassiveEvents;
}
/**
 * Normalizes an `AddEventListener` object to something that can be passed
 * to `addEventListener` on any browser, no matter whether it supports the
 * `options` parameter.
 * @param {?} options Object to be normalized.
 * @return {?}
 */
export function normalizePassiveListenerOptions(options) {
    return supportsPassiveEventListeners() ? options : !!options.capture;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFzc2l2ZS1saXN0ZW5lcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3BsYXRmb3JtL2ZlYXR1cmVzL3Bhc3NpdmUtbGlzdGVuZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztJQVNJLHFCQUE4Qjs7Ozs7O0FBTWxDLE1BQU0sVUFBVSw2QkFBNkI7SUFDM0MsSUFBSSxxQkFBcUIsSUFBSSxJQUFJLElBQUksT0FBTyxNQUFNLEtBQUssV0FBVyxFQUFFO1FBQ2xFLElBQUk7WUFDRixNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLG1CQUFBLElBQUksRUFBQyxFQUFFLE1BQU0sQ0FBQyxjQUFjLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRTtnQkFDMUUsR0FBRzs7O2dCQUFFLEdBQUcsRUFBRSxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQTthQUN4QyxDQUFDLENBQUMsQ0FBQztTQUNMO2dCQUFTO1lBQ1IscUJBQXFCLEdBQUcscUJBQXFCLElBQUksS0FBSyxDQUFDO1NBQ3hEO0tBQ0Y7SUFFRCxPQUFPLHFCQUFxQixDQUFDO0FBQy9CLENBQUM7Ozs7Ozs7O0FBUUQsTUFBTSxVQUFVLCtCQUErQixDQUFDLE9BQWdDO0lBRTlFLE9BQU8sNkJBQTZCLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztBQUN2RSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKiBDYWNoZWQgcmVzdWx0IG9mIHdoZXRoZXIgdGhlIHVzZXIncyBicm93c2VyIHN1cHBvcnRzIHBhc3NpdmUgZXZlbnQgbGlzdGVuZXJzLiAqL1xubGV0IHN1cHBvcnRzUGFzc2l2ZUV2ZW50czogYm9vbGVhbjtcblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciB0aGUgdXNlcidzIGJyb3dzZXIgc3VwcG9ydHMgcGFzc2l2ZSBldmVudCBsaXN0ZW5lcnMuXG4gKiBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9XSUNHL0V2ZW50TGlzdGVuZXJPcHRpb25zL2Jsb2IvZ2gtcGFnZXMvZXhwbGFpbmVyLm1kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdXBwb3J0c1Bhc3NpdmVFdmVudExpc3RlbmVycygpOiBib29sZWFuIHtcbiAgaWYgKHN1cHBvcnRzUGFzc2l2ZUV2ZW50cyA9PSBudWxsICYmIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgdHJ5IHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0ZXN0JywgbnVsbCEsIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh7fSwgJ3Bhc3NpdmUnLCB7XG4gICAgICAgIGdldDogKCkgPT4gc3VwcG9ydHNQYXNzaXZlRXZlbnRzID0gdHJ1ZVxuICAgICAgfSkpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzdXBwb3J0c1Bhc3NpdmVFdmVudHMgPSBzdXBwb3J0c1Bhc3NpdmVFdmVudHMgfHwgZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHN1cHBvcnRzUGFzc2l2ZUV2ZW50cztcbn1cblxuLyoqXG4gKiBOb3JtYWxpemVzIGFuIGBBZGRFdmVudExpc3RlbmVyYCBvYmplY3QgdG8gc29tZXRoaW5nIHRoYXQgY2FuIGJlIHBhc3NlZFxuICogdG8gYGFkZEV2ZW50TGlzdGVuZXJgIG9uIGFueSBicm93c2VyLCBubyBtYXR0ZXIgd2hldGhlciBpdCBzdXBwb3J0cyB0aGVcbiAqIGBvcHRpb25zYCBwYXJhbWV0ZXIuXG4gKiBAcGFyYW0gb3B0aW9ucyBPYmplY3QgdG8gYmUgbm9ybWFsaXplZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMob3B0aW9uczogQWRkRXZlbnRMaXN0ZW5lck9wdGlvbnMpOlxuICBBZGRFdmVudExpc3RlbmVyT3B0aW9ucyB8IGJvb2xlYW4ge1xuICByZXR1cm4gc3VwcG9ydHNQYXNzaXZlRXZlbnRMaXN0ZW5lcnMoKSA/IG9wdGlvbnMgOiAhIW9wdGlvbnMuY2FwdHVyZTtcbn1cbiJdfQ==