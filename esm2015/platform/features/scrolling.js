/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/platform/features/scrolling.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** @enum {number} */
const RtlScrollAxisType = {
    /**
     * scrollLeft is 0 when scrolled all the way left and (scrollWidth - clientWidth) when scrolled
     * all the way right.
     */
    NORMAL: 0,
    /**
     * scrollLeft is -(scrollWidth - clientWidth) when scrolled all the way left and 0 when scrolled
     * all the way right.
     */
    NEGATED: 1,
    /**
     * scrollLeft is (scrollWidth - clientWidth) when scrolled all the way left and 0 when scrolled
     * all the way right.
     */
    INVERTED: 2,
};
export { RtlScrollAxisType };
RtlScrollAxisType[RtlScrollAxisType.NORMAL] = 'NORMAL';
RtlScrollAxisType[RtlScrollAxisType.NEGATED] = 'NEGATED';
RtlScrollAxisType[RtlScrollAxisType.INVERTED] = 'INVERTED';
/**
 * Cached result of the way the browser handles the horizontal scroll axis in RTL mode.
 * @type {?}
 */
let rtlScrollAxisType;
/**
 * Check whether the browser supports scroll behaviors.
 * @return {?}
 */
export function supportsScrollBehavior() {
    return !!(typeof document == 'object' && 'scrollBehavior' in (/** @type {?} */ (document.documentElement)).style);
}
/**
 * Checks the type of RTL scroll axis used by this browser. As of time of writing, Chrome is NORMAL,
 * Firefox & Safari are NEGATED, and IE & Edge are INVERTED.
 * @return {?}
 */
export function getRtlScrollAxisType() {
    // We can't check unless we're on the browser. Just assume 'normal' if we're not.
    if (typeof document !== 'object' || !document) {
        return RtlScrollAxisType.NORMAL;
    }
    if (!rtlScrollAxisType) {
        // Create a 1px wide scrolling container and a 2px wide content element.
        /** @type {?} */
        const scrollContainer = document.createElement('div');
        /** @type {?} */
        const containerStyle = scrollContainer.style;
        scrollContainer.dir = 'rtl';
        containerStyle.height = '1px';
        containerStyle.width = '1px';
        containerStyle.overflow = 'auto';
        containerStyle.visibility = 'hidden';
        containerStyle.pointerEvents = 'none';
        containerStyle.position = 'absolute';
        /** @type {?} */
        const content = document.createElement('div');
        /** @type {?} */
        const contentStyle = content.style;
        contentStyle.width = '2px';
        contentStyle.height = '1px';
        scrollContainer.appendChild(content);
        document.body.appendChild(scrollContainer);
        rtlScrollAxisType = RtlScrollAxisType.NORMAL;
        // The viewport starts scrolled all the way to the right in RTL mode. If we are in a NORMAL
        // browser this would mean that the scrollLeft should be 1. If it's zero instead we know we're
        // dealing with one of the other two types of browsers.
        if (scrollContainer.scrollLeft === 0) {
            // In a NEGATED browser the scrollLeft is always somewhere in [-maxScrollAmount, 0]. For an
            // INVERTED browser it is always somewhere in [0, maxScrollAmount]. We can determine which by
            // setting to the scrollLeft to 1. This is past the max for a NEGATED browser, so it will
            // return 0 when we read it again.
            scrollContainer.scrollLeft = 1;
            rtlScrollAxisType =
                scrollContainer.scrollLeft === 0 ? RtlScrollAxisType.NEGATED : RtlScrollAxisType.INVERTED;
        }
        (/** @type {?} */ (scrollContainer.parentNode)).removeChild(scrollContainer);
    }
    return rtlScrollAxisType;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9wbGF0Zm9ybS9mZWF0dXJlcy9zY3JvbGxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQVNBLE1BQVksaUJBQWlCO0lBQzNCOzs7T0FHRztJQUNILE1BQU0sR0FBQTtJQUNOOzs7T0FHRztJQUNILE9BQU8sR0FBQTtJQUNQOzs7T0FHRztJQUNILFFBQVEsR0FBQTtFQUNUOzs7Ozs7Ozs7SUFHRyxpQkFBb0M7Ozs7O0FBR3hDLE1BQU0sVUFBVSxzQkFBc0I7SUFDcEMsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLFFBQVEsSUFBSSxRQUFRLElBQUssZ0JBQWdCLElBQUksbUJBQUEsUUFBUSxDQUFDLGVBQWUsRUFBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2pHLENBQUM7Ozs7OztBQU1ELE1BQU0sVUFBVSxvQkFBb0I7SUFDbEMsaUZBQWlGO0lBQ2pGLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxJQUFJLENBQUMsUUFBUSxFQUFFO1FBQzdDLE9BQU8saUJBQWlCLENBQUMsTUFBTSxDQUFDO0tBQ2pDO0lBRUQsSUFBSSxDQUFDLGlCQUFpQixFQUFFOzs7Y0FFaEIsZUFBZSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDOztjQUMvQyxjQUFjLEdBQUcsZUFBZSxDQUFDLEtBQUs7UUFDNUMsZUFBZSxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUM7UUFDNUIsY0FBYyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7UUFDOUIsY0FBYyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDN0IsY0FBYyxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUM7UUFDakMsY0FBYyxDQUFDLFVBQVUsR0FBRyxRQUFRLENBQUM7UUFDckMsY0FBYyxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUM7UUFDdEMsY0FBYyxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUM7O2NBRS9CLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQzs7Y0FDdkMsWUFBWSxHQUFHLE9BQU8sQ0FBQyxLQUFLO1FBQ2xDLFlBQVksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQzNCLFlBQVksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1FBRTVCLGVBQWUsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckMsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLENBQUM7UUFFM0MsaUJBQWlCLEdBQUcsaUJBQWlCLENBQUMsTUFBTSxDQUFDO1FBRTdDLDJGQUEyRjtRQUMzRiw4RkFBOEY7UUFDOUYsdURBQXVEO1FBQ3ZELElBQUksZUFBZSxDQUFDLFVBQVUsS0FBSyxDQUFDLEVBQUU7WUFDcEMsMkZBQTJGO1lBQzNGLDZGQUE2RjtZQUM3Rix5RkFBeUY7WUFDekYsa0NBQWtDO1lBQ2xDLGVBQWUsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO1lBQy9CLGlCQUFpQjtnQkFDYixlQUFlLENBQUMsVUFBVSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUM7U0FDL0Y7UUFFRCxtQkFBQSxlQUFlLENBQUMsVUFBVSxFQUFDLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0tBQzFEO0lBQ0QsT0FBTyxpQkFBaUIsQ0FBQztBQUMzQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKiBUaGUgcG9zc2libGUgd2F5cyB0aGUgYnJvd3NlciBtYXkgaGFuZGxlIHRoZSBob3Jpem9udGFsIHNjcm9sbCBheGlzIGluIFJUTCBsYW5ndWFnZXMuICovXG5leHBvcnQgZW51bSBSdGxTY3JvbGxBeGlzVHlwZSB7XG4gIC8qKlxuICAgKiBzY3JvbGxMZWZ0IGlzIDAgd2hlbiBzY3JvbGxlZCBhbGwgdGhlIHdheSBsZWZ0IGFuZCAoc2Nyb2xsV2lkdGggLSBjbGllbnRXaWR0aCkgd2hlbiBzY3JvbGxlZFxuICAgKiBhbGwgdGhlIHdheSByaWdodC5cbiAgICovXG4gIE5PUk1BTCxcbiAgLyoqXG4gICAqIHNjcm9sbExlZnQgaXMgLShzY3JvbGxXaWR0aCAtIGNsaWVudFdpZHRoKSB3aGVuIHNjcm9sbGVkIGFsbCB0aGUgd2F5IGxlZnQgYW5kIDAgd2hlbiBzY3JvbGxlZFxuICAgKiBhbGwgdGhlIHdheSByaWdodC5cbiAgICovXG4gIE5FR0FURUQsXG4gIC8qKlxuICAgKiBzY3JvbGxMZWZ0IGlzIChzY3JvbGxXaWR0aCAtIGNsaWVudFdpZHRoKSB3aGVuIHNjcm9sbGVkIGFsbCB0aGUgd2F5IGxlZnQgYW5kIDAgd2hlbiBzY3JvbGxlZFxuICAgKiBhbGwgdGhlIHdheSByaWdodC5cbiAgICovXG4gIElOVkVSVEVEXG59XG5cbi8qKiBDYWNoZWQgcmVzdWx0IG9mIHRoZSB3YXkgdGhlIGJyb3dzZXIgaGFuZGxlcyB0aGUgaG9yaXpvbnRhbCBzY3JvbGwgYXhpcyBpbiBSVEwgbW9kZS4gKi9cbmxldCBydGxTY3JvbGxBeGlzVHlwZTogUnRsU2Nyb2xsQXhpc1R5cGU7XG5cbi8qKiBDaGVjayB3aGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIHNjcm9sbCBiZWhhdmlvcnMuICovXG5leHBvcnQgZnVuY3Rpb24gc3VwcG9ydHNTY3JvbGxCZWhhdmlvcigpOiBib29sZWFuIHtcbiAgcmV0dXJuICEhKHR5cGVvZiBkb2N1bWVudCA9PSAnb2JqZWN0JyAgJiYgJ3Njcm9sbEJlaGF2aW9yJyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQhLnN0eWxlKTtcbn1cblxuLyoqXG4gKiBDaGVja3MgdGhlIHR5cGUgb2YgUlRMIHNjcm9sbCBheGlzIHVzZWQgYnkgdGhpcyBicm93c2VyLiBBcyBvZiB0aW1lIG9mIHdyaXRpbmcsIENocm9tZSBpcyBOT1JNQUwsXG4gKiBGaXJlZm94ICYgU2FmYXJpIGFyZSBORUdBVEVELCBhbmQgSUUgJiBFZGdlIGFyZSBJTlZFUlRFRC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFJ0bFNjcm9sbEF4aXNUeXBlKCk6IFJ0bFNjcm9sbEF4aXNUeXBlIHtcbiAgLy8gV2UgY2FuJ3QgY2hlY2sgdW5sZXNzIHdlJ3JlIG9uIHRoZSBicm93c2VyLiBKdXN0IGFzc3VtZSAnbm9ybWFsJyBpZiB3ZSdyZSBub3QuXG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgIT09ICdvYmplY3QnIHx8ICFkb2N1bWVudCkge1xuICAgIHJldHVybiBSdGxTY3JvbGxBeGlzVHlwZS5OT1JNQUw7XG4gIH1cblxuICBpZiAoIXJ0bFNjcm9sbEF4aXNUeXBlKSB7XG4gICAgLy8gQ3JlYXRlIGEgMXB4IHdpZGUgc2Nyb2xsaW5nIGNvbnRhaW5lciBhbmQgYSAycHggd2lkZSBjb250ZW50IGVsZW1lbnQuXG4gICAgY29uc3Qgc2Nyb2xsQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgY29uc3QgY29udGFpbmVyU3R5bGUgPSBzY3JvbGxDb250YWluZXIuc3R5bGU7XG4gICAgc2Nyb2xsQ29udGFpbmVyLmRpciA9ICdydGwnO1xuICAgIGNvbnRhaW5lclN0eWxlLmhlaWdodCA9ICcxcHgnO1xuICAgIGNvbnRhaW5lclN0eWxlLndpZHRoID0gJzFweCc7XG4gICAgY29udGFpbmVyU3R5bGUub3ZlcmZsb3cgPSAnYXV0byc7XG4gICAgY29udGFpbmVyU3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICAgIGNvbnRhaW5lclN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XG4gICAgY29udGFpbmVyU3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXG4gICAgY29uc3QgY29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGNvbnN0IGNvbnRlbnRTdHlsZSA9IGNvbnRlbnQuc3R5bGU7XG4gICAgY29udGVudFN0eWxlLndpZHRoID0gJzJweCc7XG4gICAgY29udGVudFN0eWxlLmhlaWdodCA9ICcxcHgnO1xuXG4gICAgc2Nyb2xsQ29udGFpbmVyLmFwcGVuZENoaWxkKGNvbnRlbnQpO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc2Nyb2xsQ29udGFpbmVyKTtcblxuICAgIHJ0bFNjcm9sbEF4aXNUeXBlID0gUnRsU2Nyb2xsQXhpc1R5cGUuTk9STUFMO1xuXG4gICAgLy8gVGhlIHZpZXdwb3J0IHN0YXJ0cyBzY3JvbGxlZCBhbGwgdGhlIHdheSB0byB0aGUgcmlnaHQgaW4gUlRMIG1vZGUuIElmIHdlIGFyZSBpbiBhIE5PUk1BTFxuICAgIC8vIGJyb3dzZXIgdGhpcyB3b3VsZCBtZWFuIHRoYXQgdGhlIHNjcm9sbExlZnQgc2hvdWxkIGJlIDEuIElmIGl0J3MgemVybyBpbnN0ZWFkIHdlIGtub3cgd2UncmVcbiAgICAvLyBkZWFsaW5nIHdpdGggb25lIG9mIHRoZSBvdGhlciB0d28gdHlwZXMgb2YgYnJvd3NlcnMuXG4gICAgaWYgKHNjcm9sbENvbnRhaW5lci5zY3JvbGxMZWZ0ID09PSAwKSB7XG4gICAgICAvLyBJbiBhIE5FR0FURUQgYnJvd3NlciB0aGUgc2Nyb2xsTGVmdCBpcyBhbHdheXMgc29tZXdoZXJlIGluIFstbWF4U2Nyb2xsQW1vdW50LCAwXS4gRm9yIGFuXG4gICAgICAvLyBJTlZFUlRFRCBicm93c2VyIGl0IGlzIGFsd2F5cyBzb21ld2hlcmUgaW4gWzAsIG1heFNjcm9sbEFtb3VudF0uIFdlIGNhbiBkZXRlcm1pbmUgd2hpY2ggYnlcbiAgICAgIC8vIHNldHRpbmcgdG8gdGhlIHNjcm9sbExlZnQgdG8gMS4gVGhpcyBpcyBwYXN0IHRoZSBtYXggZm9yIGEgTkVHQVRFRCBicm93c2VyLCBzbyBpdCB3aWxsXG4gICAgICAvLyByZXR1cm4gMCB3aGVuIHdlIHJlYWQgaXQgYWdhaW4uXG4gICAgICBzY3JvbGxDb250YWluZXIuc2Nyb2xsTGVmdCA9IDE7XG4gICAgICBydGxTY3JvbGxBeGlzVHlwZSA9XG4gICAgICAgICAgc2Nyb2xsQ29udGFpbmVyLnNjcm9sbExlZnQgPT09IDAgPyBSdGxTY3JvbGxBeGlzVHlwZS5ORUdBVEVEIDogUnRsU2Nyb2xsQXhpc1R5cGUuSU5WRVJURUQ7XG4gICAgfVxuXG4gICAgc2Nyb2xsQ29udGFpbmVyLnBhcmVudE5vZGUhLnJlbW92ZUNoaWxkKHNjcm9sbENvbnRhaW5lcik7XG4gIH1cbiAgcmV0dXJuIHJ0bFNjcm9sbEF4aXNUeXBlO1xufVxuIl19