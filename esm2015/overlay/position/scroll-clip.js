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
// TODO(jelbourn): move this to live with the rest of the scrolling code
// TODO(jelbourn): someday replace this with IntersectionObservers
/**
 * Gets whether an element is scrolled outside of view by any of its parent scrolling containers.
 * \@docs-private
 * @param {?} element Dimensions of the element (from getBoundingClientRect)
 * @param {?} scrollContainers Dimensions of element's scrolling containers (from getBoundingClientRect)
 * @return {?} Whether the element is scrolled out of view
 */
export function isElementScrolledOutsideView(element, scrollContainers) {
    return scrollContainers.some((/**
     * @param {?} containerBounds
     * @return {?}
     */
    containerBounds => {
        /** @type {?} */
        const outsideAbove = element.bottom < containerBounds.top;
        /** @type {?} */
        const outsideBelow = element.top > containerBounds.bottom;
        /** @type {?} */
        const outsideLeft = element.right < containerBounds.left;
        /** @type {?} */
        const outsideRight = element.left > containerBounds.right;
        return outsideAbove || outsideBelow || outsideLeft || outsideRight;
    }));
}
/**
 * Gets whether an element is clipped by any of its scrolling containers.
 * \@docs-private
 * @param {?} element Dimensions of the element (from getBoundingClientRect)
 * @param {?} scrollContainers Dimensions of element's scrolling containers (from getBoundingClientRect)
 * @return {?} Whether the element is clipped
 */
export function isElementClippedByScrolling(element, scrollContainers) {
    return scrollContainers.some((/**
     * @param {?} scrollContainerRect
     * @return {?}
     */
    scrollContainerRect => {
        /** @type {?} */
        const clippedAbove = element.top < scrollContainerRect.top;
        /** @type {?} */
        const clippedBelow = element.bottom > scrollContainerRect.bottom;
        /** @type {?} */
        const clippedLeft = element.left < scrollContainerRect.left;
        /** @type {?} */
        const clippedRight = element.right > scrollContainerRect.right;
        return clippedAbove || clippedBelow || clippedLeft || clippedRight;
    }));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsLWNsaXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvcG9zaXRpb24vc2Nyb2xsLWNsaXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkEsTUFBTSxVQUFVLDRCQUE0QixDQUFDLE9BQW1CLEVBQUUsZ0JBQThCO0lBQzlGLE9BQU8sZ0JBQWdCLENBQUMsSUFBSTs7OztJQUFDLGVBQWUsQ0FBQyxFQUFFOztjQUN2QyxZQUFZLEdBQUcsT0FBTyxDQUFDLE1BQU0sR0FBRyxlQUFlLENBQUMsR0FBRzs7Y0FDbkQsWUFBWSxHQUFHLE9BQU8sQ0FBQyxHQUFHLEdBQUcsZUFBZSxDQUFDLE1BQU07O2NBQ25ELFdBQVcsR0FBRyxPQUFPLENBQUMsS0FBSyxHQUFHLGVBQWUsQ0FBQyxJQUFJOztjQUNsRCxZQUFZLEdBQUcsT0FBTyxDQUFDLElBQUksR0FBRyxlQUFlLENBQUMsS0FBSztRQUV6RCxPQUFPLFlBQVksSUFBSSxZQUFZLElBQUksV0FBVyxJQUFJLFlBQVksQ0FBQztJQUNyRSxDQUFDLEVBQUMsQ0FBQztBQUNMLENBQUM7Ozs7Ozs7O0FBVUQsTUFBTSxVQUFVLDJCQUEyQixDQUFDLE9BQW1CLEVBQUUsZ0JBQThCO0lBQzdGLE9BQU8sZ0JBQWdCLENBQUMsSUFBSTs7OztJQUFDLG1CQUFtQixDQUFDLEVBQUU7O2NBQzNDLFlBQVksR0FBRyxPQUFPLENBQUMsR0FBRyxHQUFHLG1CQUFtQixDQUFDLEdBQUc7O2NBQ3BELFlBQVksR0FBRyxPQUFPLENBQUMsTUFBTSxHQUFHLG1CQUFtQixDQUFDLE1BQU07O2NBQzFELFdBQVcsR0FBRyxPQUFPLENBQUMsSUFBSSxHQUFHLG1CQUFtQixDQUFDLElBQUk7O2NBQ3JELFlBQVksR0FBRyxPQUFPLENBQUMsS0FBSyxHQUFHLG1CQUFtQixDQUFDLEtBQUs7UUFFOUQsT0FBTyxZQUFZLElBQUksWUFBWSxJQUFJLFdBQVcsSUFBSSxZQUFZLENBQUM7SUFDckUsQ0FBQyxFQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFRPRE8oamVsYm91cm4pOiBtb3ZlIHRoaXMgdG8gbGl2ZSB3aXRoIHRoZSByZXN0IG9mIHRoZSBzY3JvbGxpbmcgY29kZVxuLy8gVE9ETyhqZWxib3Vybik6IHNvbWVkYXkgcmVwbGFjZSB0aGlzIHdpdGggSW50ZXJzZWN0aW9uT2JzZXJ2ZXJzXG5cbi8qKlxuICogR2V0cyB3aGV0aGVyIGFuIGVsZW1lbnQgaXMgc2Nyb2xsZWQgb3V0c2lkZSBvZiB2aWV3IGJ5IGFueSBvZiBpdHMgcGFyZW50IHNjcm9sbGluZyBjb250YWluZXJzLlxuICogQHBhcmFtIGVsZW1lbnQgRGltZW5zaW9ucyBvZiB0aGUgZWxlbWVudCAoZnJvbSBnZXRCb3VuZGluZ0NsaWVudFJlY3QpXG4gKiBAcGFyYW0gc2Nyb2xsQ29udGFpbmVycyBEaW1lbnNpb25zIG9mIGVsZW1lbnQncyBzY3JvbGxpbmcgY29udGFpbmVycyAoZnJvbSBnZXRCb3VuZGluZ0NsaWVudFJlY3QpXG4gKiBAcmV0dXJucyBXaGV0aGVyIHRoZSBlbGVtZW50IGlzIHNjcm9sbGVkIG91dCBvZiB2aWV3XG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0VsZW1lbnRTY3JvbGxlZE91dHNpZGVWaWV3KGVsZW1lbnQ6IENsaWVudFJlY3QsIHNjcm9sbENvbnRhaW5lcnM6IENsaWVudFJlY3RbXSkge1xuICByZXR1cm4gc2Nyb2xsQ29udGFpbmVycy5zb21lKGNvbnRhaW5lckJvdW5kcyA9PiB7XG4gICAgY29uc3Qgb3V0c2lkZUFib3ZlID0gZWxlbWVudC5ib3R0b20gPCBjb250YWluZXJCb3VuZHMudG9wO1xuICAgIGNvbnN0IG91dHNpZGVCZWxvdyA9IGVsZW1lbnQudG9wID4gY29udGFpbmVyQm91bmRzLmJvdHRvbTtcbiAgICBjb25zdCBvdXRzaWRlTGVmdCA9IGVsZW1lbnQucmlnaHQgPCBjb250YWluZXJCb3VuZHMubGVmdDtcbiAgICBjb25zdCBvdXRzaWRlUmlnaHQgPSBlbGVtZW50LmxlZnQgPiBjb250YWluZXJCb3VuZHMucmlnaHQ7XG5cbiAgICByZXR1cm4gb3V0c2lkZUFib3ZlIHx8IG91dHNpZGVCZWxvdyB8fCBvdXRzaWRlTGVmdCB8fCBvdXRzaWRlUmlnaHQ7XG4gIH0pO1xufVxuXG5cbi8qKlxuICogR2V0cyB3aGV0aGVyIGFuIGVsZW1lbnQgaXMgY2xpcHBlZCBieSBhbnkgb2YgaXRzIHNjcm9sbGluZyBjb250YWluZXJzLlxuICogQHBhcmFtIGVsZW1lbnQgRGltZW5zaW9ucyBvZiB0aGUgZWxlbWVudCAoZnJvbSBnZXRCb3VuZGluZ0NsaWVudFJlY3QpXG4gKiBAcGFyYW0gc2Nyb2xsQ29udGFpbmVycyBEaW1lbnNpb25zIG9mIGVsZW1lbnQncyBzY3JvbGxpbmcgY29udGFpbmVycyAoZnJvbSBnZXRCb3VuZGluZ0NsaWVudFJlY3QpXG4gKiBAcmV0dXJucyBXaGV0aGVyIHRoZSBlbGVtZW50IGlzIGNsaXBwZWRcbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRWxlbWVudENsaXBwZWRCeVNjcm9sbGluZyhlbGVtZW50OiBDbGllbnRSZWN0LCBzY3JvbGxDb250YWluZXJzOiBDbGllbnRSZWN0W10pIHtcbiAgcmV0dXJuIHNjcm9sbENvbnRhaW5lcnMuc29tZShzY3JvbGxDb250YWluZXJSZWN0ID0+IHtcbiAgICBjb25zdCBjbGlwcGVkQWJvdmUgPSBlbGVtZW50LnRvcCA8IHNjcm9sbENvbnRhaW5lclJlY3QudG9wO1xuICAgIGNvbnN0IGNsaXBwZWRCZWxvdyA9IGVsZW1lbnQuYm90dG9tID4gc2Nyb2xsQ29udGFpbmVyUmVjdC5ib3R0b207XG4gICAgY29uc3QgY2xpcHBlZExlZnQgPSBlbGVtZW50LmxlZnQgPCBzY3JvbGxDb250YWluZXJSZWN0LmxlZnQ7XG4gICAgY29uc3QgY2xpcHBlZFJpZ2h0ID0gZWxlbWVudC5yaWdodCA+IHNjcm9sbENvbnRhaW5lclJlY3QucmlnaHQ7XG5cbiAgICByZXR1cm4gY2xpcHBlZEFib3ZlIHx8IGNsaXBwZWRCZWxvdyB8fCBjbGlwcGVkTGVmdCB8fCBjbGlwcGVkUmlnaHQ7XG4gIH0pO1xufVxuIl19