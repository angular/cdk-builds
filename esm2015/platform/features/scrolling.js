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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9wbGF0Zm9ybS9mZWF0dXJlcy9zY3JvbGxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQVVFOzs7T0FHRztJQUNILFNBQU07SUFDTjs7O09BR0c7SUFDSCxVQUFPO0lBQ1A7OztPQUdHO0lBQ0gsV0FBUTs7Ozs7Ozs7OztJQUlOLGlCQUFvQzs7Ozs7QUFHeEMsTUFBTSxVQUFVLHNCQUFzQjtJQUNwQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sUUFBUSxJQUFJLFFBQVEsSUFBSyxnQkFBZ0IsSUFBSSxtQkFBQSxRQUFRLENBQUMsZUFBZSxFQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDakcsQ0FBQzs7Ozs7O0FBTUQsTUFBTSxVQUFVLG9CQUFvQjtJQUNsQyxpRkFBaUY7SUFDakYsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLElBQUksQ0FBQyxRQUFRLEVBQUU7UUFDN0MsT0FBTyxpQkFBaUIsQ0FBQyxNQUFNLENBQUM7S0FDakM7SUFFRCxJQUFJLENBQUMsaUJBQWlCLEVBQUU7OztjQUVoQixlQUFlLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7O2NBQy9DLGNBQWMsR0FBRyxlQUFlLENBQUMsS0FBSztRQUM1QyxlQUFlLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQztRQUM1QixjQUFjLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztRQUM5QixjQUFjLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUM3QixjQUFjLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQztRQUNqQyxjQUFjLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQztRQUNyQyxjQUFjLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQztRQUN0QyxjQUFjLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQzs7Y0FFL0IsT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDOztjQUN2QyxZQUFZLEdBQUcsT0FBTyxDQUFDLEtBQUs7UUFDbEMsWUFBWSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDM0IsWUFBWSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7UUFFNUIsZUFBZSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNyQyxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUUzQyxpQkFBaUIsR0FBRyxpQkFBaUIsQ0FBQyxNQUFNLENBQUM7UUFFN0MsMkZBQTJGO1FBQzNGLDhGQUE4RjtRQUM5Rix1REFBdUQ7UUFDdkQsSUFBSSxlQUFlLENBQUMsVUFBVSxLQUFLLENBQUMsRUFBRTtZQUNwQywyRkFBMkY7WUFDM0YsNkZBQTZGO1lBQzdGLHlGQUF5RjtZQUN6RixrQ0FBa0M7WUFDbEMsZUFBZSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7WUFDL0IsaUJBQWlCO2dCQUNiLGVBQWUsQ0FBQyxVQUFVLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQztTQUMvRjtRQUVELG1CQUFBLGVBQWUsQ0FBQyxVQUFVLEVBQUMsQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLENBQUM7S0FDMUQ7SUFDRCxPQUFPLGlCQUFpQixDQUFDO0FBQzNCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqIFRoZSBwb3NzaWJsZSB3YXlzIHRoZSBicm93c2VyIG1heSBoYW5kbGUgdGhlIGhvcml6b250YWwgc2Nyb2xsIGF4aXMgaW4gUlRMIGxhbmd1YWdlcy4gKi9cbmV4cG9ydCBlbnVtIFJ0bFNjcm9sbEF4aXNUeXBlIHtcbiAgLyoqXG4gICAqIHNjcm9sbExlZnQgaXMgMCB3aGVuIHNjcm9sbGVkIGFsbCB0aGUgd2F5IGxlZnQgYW5kIChzY3JvbGxXaWR0aCAtIGNsaWVudFdpZHRoKSB3aGVuIHNjcm9sbGVkXG4gICAqIGFsbCB0aGUgd2F5IHJpZ2h0LlxuICAgKi9cbiAgTk9STUFMLFxuICAvKipcbiAgICogc2Nyb2xsTGVmdCBpcyAtKHNjcm9sbFdpZHRoIC0gY2xpZW50V2lkdGgpIHdoZW4gc2Nyb2xsZWQgYWxsIHRoZSB3YXkgbGVmdCBhbmQgMCB3aGVuIHNjcm9sbGVkXG4gICAqIGFsbCB0aGUgd2F5IHJpZ2h0LlxuICAgKi9cbiAgTkVHQVRFRCxcbiAgLyoqXG4gICAqIHNjcm9sbExlZnQgaXMgKHNjcm9sbFdpZHRoIC0gY2xpZW50V2lkdGgpIHdoZW4gc2Nyb2xsZWQgYWxsIHRoZSB3YXkgbGVmdCBhbmQgMCB3aGVuIHNjcm9sbGVkXG4gICAqIGFsbCB0aGUgd2F5IHJpZ2h0LlxuICAgKi9cbiAgSU5WRVJURURcbn1cblxuLyoqIENhY2hlZCByZXN1bHQgb2YgdGhlIHdheSB0aGUgYnJvd3NlciBoYW5kbGVzIHRoZSBob3Jpem9udGFsIHNjcm9sbCBheGlzIGluIFJUTCBtb2RlLiAqL1xubGV0IHJ0bFNjcm9sbEF4aXNUeXBlOiBSdGxTY3JvbGxBeGlzVHlwZTtcblxuLyoqIENoZWNrIHdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgc2Nyb2xsIGJlaGF2aW9ycy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdXBwb3J0c1Njcm9sbEJlaGF2aW9yKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gISEodHlwZW9mIGRvY3VtZW50ID09ICdvYmplY3QnICAmJiAnc2Nyb2xsQmVoYXZpb3InIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCEuc3R5bGUpO1xufVxuXG4vKipcbiAqIENoZWNrcyB0aGUgdHlwZSBvZiBSVEwgc2Nyb2xsIGF4aXMgdXNlZCBieSB0aGlzIGJyb3dzZXIuIEFzIG9mIHRpbWUgb2Ygd3JpdGluZywgQ2hyb21lIGlzIE5PUk1BTCxcbiAqIEZpcmVmb3ggJiBTYWZhcmkgYXJlIE5FR0FURUQsIGFuZCBJRSAmIEVkZ2UgYXJlIElOVkVSVEVELlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UnRsU2Nyb2xsQXhpc1R5cGUoKTogUnRsU2Nyb2xsQXhpc1R5cGUge1xuICAvLyBXZSBjYW4ndCBjaGVjayB1bmxlc3Mgd2UncmUgb24gdGhlIGJyb3dzZXIuIEp1c3QgYXNzdW1lICdub3JtYWwnIGlmIHdlJ3JlIG5vdC5cbiAgaWYgKHR5cGVvZiBkb2N1bWVudCAhPT0gJ29iamVjdCcgfHwgIWRvY3VtZW50KSB7XG4gICAgcmV0dXJuIFJ0bFNjcm9sbEF4aXNUeXBlLk5PUk1BTDtcbiAgfVxuXG4gIGlmICghcnRsU2Nyb2xsQXhpc1R5cGUpIHtcbiAgICAvLyBDcmVhdGUgYSAxcHggd2lkZSBzY3JvbGxpbmcgY29udGFpbmVyIGFuZCBhIDJweCB3aWRlIGNvbnRlbnQgZWxlbWVudC5cbiAgICBjb25zdCBzY3JvbGxDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjb25zdCBjb250YWluZXJTdHlsZSA9IHNjcm9sbENvbnRhaW5lci5zdHlsZTtcbiAgICBzY3JvbGxDb250YWluZXIuZGlyID0gJ3J0bCc7XG4gICAgY29udGFpbmVyU3R5bGUuaGVpZ2h0ID0gJzFweCc7XG4gICAgY29udGFpbmVyU3R5bGUud2lkdGggPSAnMXB4JztcbiAgICBjb250YWluZXJTdHlsZS5vdmVyZmxvdyA9ICdhdXRvJztcbiAgICBjb250YWluZXJTdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gICAgY29udGFpbmVyU3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcbiAgICBjb250YWluZXJTdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cbiAgICBjb25zdCBjb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgY29uc3QgY29udGVudFN0eWxlID0gY29udGVudC5zdHlsZTtcbiAgICBjb250ZW50U3R5bGUud2lkdGggPSAnMnB4JztcbiAgICBjb250ZW50U3R5bGUuaGVpZ2h0ID0gJzFweCc7XG5cbiAgICBzY3JvbGxDb250YWluZXIuYXBwZW5kQ2hpbGQoY29udGVudCk7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzY3JvbGxDb250YWluZXIpO1xuXG4gICAgcnRsU2Nyb2xsQXhpc1R5cGUgPSBSdGxTY3JvbGxBeGlzVHlwZS5OT1JNQUw7XG5cbiAgICAvLyBUaGUgdmlld3BvcnQgc3RhcnRzIHNjcm9sbGVkIGFsbCB0aGUgd2F5IHRvIHRoZSByaWdodCBpbiBSVEwgbW9kZS4gSWYgd2UgYXJlIGluIGEgTk9STUFMXG4gICAgLy8gYnJvd3NlciB0aGlzIHdvdWxkIG1lYW4gdGhhdCB0aGUgc2Nyb2xsTGVmdCBzaG91bGQgYmUgMS4gSWYgaXQncyB6ZXJvIGluc3RlYWQgd2Uga25vdyB3ZSdyZVxuICAgIC8vIGRlYWxpbmcgd2l0aCBvbmUgb2YgdGhlIG90aGVyIHR3byB0eXBlcyBvZiBicm93c2Vycy5cbiAgICBpZiAoc2Nyb2xsQ29udGFpbmVyLnNjcm9sbExlZnQgPT09IDApIHtcbiAgICAgIC8vIEluIGEgTkVHQVRFRCBicm93c2VyIHRoZSBzY3JvbGxMZWZ0IGlzIGFsd2F5cyBzb21ld2hlcmUgaW4gWy1tYXhTY3JvbGxBbW91bnQsIDBdLiBGb3IgYW5cbiAgICAgIC8vIElOVkVSVEVEIGJyb3dzZXIgaXQgaXMgYWx3YXlzIHNvbWV3aGVyZSBpbiBbMCwgbWF4U2Nyb2xsQW1vdW50XS4gV2UgY2FuIGRldGVybWluZSB3aGljaCBieVxuICAgICAgLy8gc2V0dGluZyB0byB0aGUgc2Nyb2xsTGVmdCB0byAxLiBUaGlzIGlzIHBhc3QgdGhlIG1heCBmb3IgYSBORUdBVEVEIGJyb3dzZXIsIHNvIGl0IHdpbGxcbiAgICAgIC8vIHJldHVybiAwIHdoZW4gd2UgcmVhZCBpdCBhZ2Fpbi5cbiAgICAgIHNjcm9sbENvbnRhaW5lci5zY3JvbGxMZWZ0ID0gMTtcbiAgICAgIHJ0bFNjcm9sbEF4aXNUeXBlID1cbiAgICAgICAgICBzY3JvbGxDb250YWluZXIuc2Nyb2xsTGVmdCA9PT0gMCA/IFJ0bFNjcm9sbEF4aXNUeXBlLk5FR0FURUQgOiBSdGxTY3JvbGxBeGlzVHlwZS5JTlZFUlRFRDtcbiAgICB9XG5cbiAgICBzY3JvbGxDb250YWluZXIucGFyZW50Tm9kZSEucmVtb3ZlQ2hpbGQoc2Nyb2xsQ29udGFpbmVyKTtcbiAgfVxuICByZXR1cm4gcnRsU2Nyb2xsQXhpc1R5cGU7XG59XG4iXX0=