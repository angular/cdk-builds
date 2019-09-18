/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** The possible ways the browser may handle the horizontal scroll axis in RTL languages. */
export var RtlScrollAxisType;
(function (RtlScrollAxisType) {
    /**
     * scrollLeft is 0 when scrolled all the way left and (scrollWidth - clientWidth) when scrolled
     * all the way right.
     */
    RtlScrollAxisType[RtlScrollAxisType["NORMAL"] = 0] = "NORMAL";
    /**
     * scrollLeft is -(scrollWidth - clientWidth) when scrolled all the way left and 0 when scrolled
     * all the way right.
     */
    RtlScrollAxisType[RtlScrollAxisType["NEGATED"] = 1] = "NEGATED";
    /**
     * scrollLeft is (scrollWidth - clientWidth) when scrolled all the way left and 0 when scrolled
     * all the way right.
     */
    RtlScrollAxisType[RtlScrollAxisType["INVERTED"] = 2] = "INVERTED";
})(RtlScrollAxisType || (RtlScrollAxisType = {}));
/** Cached result of the way the browser handles the horizontal scroll axis in RTL mode. */
var rtlScrollAxisType;
/** Check whether the browser supports scroll behaviors. */
export function supportsScrollBehavior() {
    return !!(typeof document == 'object' && 'scrollBehavior' in document.documentElement.style);
}
/**
 * Checks the type of RTL scroll axis used by this browser. As of time of writing, Chrome is NORMAL,
 * Firefox & Safari are NEGATED, and IE & Edge are INVERTED.
 */
export function getRtlScrollAxisType() {
    // We can't check unless we're on the browser. Just assume 'normal' if we're not.
    if (typeof document !== 'object' || !document) {
        return RtlScrollAxisType.NORMAL;
    }
    if (!rtlScrollAxisType) {
        // Create a 1px wide scrolling container and a 2px wide content element.
        var scrollContainer = document.createElement('div');
        var containerStyle = scrollContainer.style;
        scrollContainer.dir = 'rtl';
        containerStyle.height = '1px';
        containerStyle.width = '1px';
        containerStyle.overflow = 'auto';
        containerStyle.visibility = 'hidden';
        containerStyle.pointerEvents = 'none';
        containerStyle.position = 'absolute';
        var content = document.createElement('div');
        var contentStyle = content.style;
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
        scrollContainer.parentNode.removeChild(scrollContainer);
    }
    return rtlScrollAxisType;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9wbGF0Zm9ybS9mZWF0dXJlcy9zY3JvbGxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsNEZBQTRGO0FBQzVGLE1BQU0sQ0FBTixJQUFZLGlCQWdCWDtBQWhCRCxXQUFZLGlCQUFpQjtJQUMzQjs7O09BR0c7SUFDSCw2REFBTSxDQUFBO0lBQ047OztPQUdHO0lBQ0gsK0RBQU8sQ0FBQTtJQUNQOzs7T0FHRztJQUNILGlFQUFRLENBQUE7QUFDVixDQUFDLEVBaEJXLGlCQUFpQixLQUFqQixpQkFBaUIsUUFnQjVCO0FBRUQsMkZBQTJGO0FBQzNGLElBQUksaUJBQW9DLENBQUM7QUFFekMsMkRBQTJEO0FBQzNELE1BQU0sVUFBVSxzQkFBc0I7SUFDcEMsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLFFBQVEsSUFBSSxRQUFRLElBQUssZ0JBQWdCLElBQUksUUFBUSxDQUFDLGVBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDakcsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sVUFBVSxvQkFBb0I7SUFDbEMsaUZBQWlGO0lBQ2pGLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxJQUFJLENBQUMsUUFBUSxFQUFFO1FBQzdDLE9BQU8saUJBQWlCLENBQUMsTUFBTSxDQUFDO0tBQ2pDO0lBRUQsSUFBSSxDQUFDLGlCQUFpQixFQUFFO1FBQ3RCLHdFQUF3RTtRQUN4RSxJQUFNLGVBQWUsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RELElBQU0sY0FBYyxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUM7UUFDN0MsZUFBZSxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUM7UUFDNUIsY0FBYyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7UUFDOUIsY0FBYyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDN0IsY0FBYyxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUM7UUFDakMsY0FBYyxDQUFDLFVBQVUsR0FBRyxRQUFRLENBQUM7UUFDckMsY0FBYyxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUM7UUFDdEMsY0FBYyxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUM7UUFFckMsSUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM5QyxJQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO1FBQ25DLFlBQVksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQzNCLFlBQVksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1FBRTVCLGVBQWUsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckMsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLENBQUM7UUFFM0MsaUJBQWlCLEdBQUcsaUJBQWlCLENBQUMsTUFBTSxDQUFDO1FBRTdDLDJGQUEyRjtRQUMzRiw4RkFBOEY7UUFDOUYsdURBQXVEO1FBQ3ZELElBQUksZUFBZSxDQUFDLFVBQVUsS0FBSyxDQUFDLEVBQUU7WUFDcEMsMkZBQTJGO1lBQzNGLDZGQUE2RjtZQUM3Rix5RkFBeUY7WUFDekYsa0NBQWtDO1lBQ2xDLGVBQWUsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO1lBQy9CLGlCQUFpQjtnQkFDYixlQUFlLENBQUMsVUFBVSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUM7U0FDL0Y7UUFFRCxlQUFlLENBQUMsVUFBVyxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQztLQUMxRDtJQUNELE9BQU8saUJBQWlCLENBQUM7QUFDM0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKiogVGhlIHBvc3NpYmxlIHdheXMgdGhlIGJyb3dzZXIgbWF5IGhhbmRsZSB0aGUgaG9yaXpvbnRhbCBzY3JvbGwgYXhpcyBpbiBSVEwgbGFuZ3VhZ2VzLiAqL1xuZXhwb3J0IGVudW0gUnRsU2Nyb2xsQXhpc1R5cGUge1xuICAvKipcbiAgICogc2Nyb2xsTGVmdCBpcyAwIHdoZW4gc2Nyb2xsZWQgYWxsIHRoZSB3YXkgbGVmdCBhbmQgKHNjcm9sbFdpZHRoIC0gY2xpZW50V2lkdGgpIHdoZW4gc2Nyb2xsZWRcbiAgICogYWxsIHRoZSB3YXkgcmlnaHQuXG4gICAqL1xuICBOT1JNQUwsXG4gIC8qKlxuICAgKiBzY3JvbGxMZWZ0IGlzIC0oc2Nyb2xsV2lkdGggLSBjbGllbnRXaWR0aCkgd2hlbiBzY3JvbGxlZCBhbGwgdGhlIHdheSBsZWZ0IGFuZCAwIHdoZW4gc2Nyb2xsZWRcbiAgICogYWxsIHRoZSB3YXkgcmlnaHQuXG4gICAqL1xuICBORUdBVEVELFxuICAvKipcbiAgICogc2Nyb2xsTGVmdCBpcyAoc2Nyb2xsV2lkdGggLSBjbGllbnRXaWR0aCkgd2hlbiBzY3JvbGxlZCBhbGwgdGhlIHdheSBsZWZ0IGFuZCAwIHdoZW4gc2Nyb2xsZWRcbiAgICogYWxsIHRoZSB3YXkgcmlnaHQuXG4gICAqL1xuICBJTlZFUlRFRFxufVxuXG4vKiogQ2FjaGVkIHJlc3VsdCBvZiB0aGUgd2F5IHRoZSBicm93c2VyIGhhbmRsZXMgdGhlIGhvcml6b250YWwgc2Nyb2xsIGF4aXMgaW4gUlRMIG1vZGUuICovXG5sZXQgcnRsU2Nyb2xsQXhpc1R5cGU6IFJ0bFNjcm9sbEF4aXNUeXBlO1xuXG4vKiogQ2hlY2sgd2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0cyBzY3JvbGwgYmVoYXZpb3JzLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN1cHBvcnRzU2Nyb2xsQmVoYXZpb3IoKTogYm9vbGVhbiB7XG4gIHJldHVybiAhISh0eXBlb2YgZG9jdW1lbnQgPT0gJ29iamVjdCcgICYmICdzY3JvbGxCZWhhdmlvcicgaW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IS5zdHlsZSk7XG59XG5cbi8qKlxuICogQ2hlY2tzIHRoZSB0eXBlIG9mIFJUTCBzY3JvbGwgYXhpcyB1c2VkIGJ5IHRoaXMgYnJvd3Nlci4gQXMgb2YgdGltZSBvZiB3cml0aW5nLCBDaHJvbWUgaXMgTk9STUFMLFxuICogRmlyZWZveCAmIFNhZmFyaSBhcmUgTkVHQVRFRCwgYW5kIElFICYgRWRnZSBhcmUgSU5WRVJURUQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSdGxTY3JvbGxBeGlzVHlwZSgpOiBSdGxTY3JvbGxBeGlzVHlwZSB7XG4gIC8vIFdlIGNhbid0IGNoZWNrIHVubGVzcyB3ZSdyZSBvbiB0aGUgYnJvd3Nlci4gSnVzdCBhc3N1bWUgJ25vcm1hbCcgaWYgd2UncmUgbm90LlxuICBpZiAodHlwZW9mIGRvY3VtZW50ICE9PSAnb2JqZWN0JyB8fCAhZG9jdW1lbnQpIHtcbiAgICByZXR1cm4gUnRsU2Nyb2xsQXhpc1R5cGUuTk9STUFMO1xuICB9XG5cbiAgaWYgKCFydGxTY3JvbGxBeGlzVHlwZSkge1xuICAgIC8vIENyZWF0ZSBhIDFweCB3aWRlIHNjcm9sbGluZyBjb250YWluZXIgYW5kIGEgMnB4IHdpZGUgY29udGVudCBlbGVtZW50LlxuICAgIGNvbnN0IHNjcm9sbENvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGNvbnN0IGNvbnRhaW5lclN0eWxlID0gc2Nyb2xsQ29udGFpbmVyLnN0eWxlO1xuICAgIHNjcm9sbENvbnRhaW5lci5kaXIgPSAncnRsJztcbiAgICBjb250YWluZXJTdHlsZS5oZWlnaHQgPSAnMXB4JztcbiAgICBjb250YWluZXJTdHlsZS53aWR0aCA9ICcxcHgnO1xuICAgIGNvbnRhaW5lclN0eWxlLm92ZXJmbG93ID0gJ2F1dG8nO1xuICAgIGNvbnRhaW5lclN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgICBjb250YWluZXJTdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuICAgIGNvbnRhaW5lclN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblxuICAgIGNvbnN0IGNvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjb25zdCBjb250ZW50U3R5bGUgPSBjb250ZW50LnN0eWxlO1xuICAgIGNvbnRlbnRTdHlsZS53aWR0aCA9ICcycHgnO1xuICAgIGNvbnRlbnRTdHlsZS5oZWlnaHQgPSAnMXB4JztcblxuICAgIHNjcm9sbENvbnRhaW5lci5hcHBlbmRDaGlsZChjb250ZW50KTtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHNjcm9sbENvbnRhaW5lcik7XG5cbiAgICBydGxTY3JvbGxBeGlzVHlwZSA9IFJ0bFNjcm9sbEF4aXNUeXBlLk5PUk1BTDtcblxuICAgIC8vIFRoZSB2aWV3cG9ydCBzdGFydHMgc2Nyb2xsZWQgYWxsIHRoZSB3YXkgdG8gdGhlIHJpZ2h0IGluIFJUTCBtb2RlLiBJZiB3ZSBhcmUgaW4gYSBOT1JNQUxcbiAgICAvLyBicm93c2VyIHRoaXMgd291bGQgbWVhbiB0aGF0IHRoZSBzY3JvbGxMZWZ0IHNob3VsZCBiZSAxLiBJZiBpdCdzIHplcm8gaW5zdGVhZCB3ZSBrbm93IHdlJ3JlXG4gICAgLy8gZGVhbGluZyB3aXRoIG9uZSBvZiB0aGUgb3RoZXIgdHdvIHR5cGVzIG9mIGJyb3dzZXJzLlxuICAgIGlmIChzY3JvbGxDb250YWluZXIuc2Nyb2xsTGVmdCA9PT0gMCkge1xuICAgICAgLy8gSW4gYSBORUdBVEVEIGJyb3dzZXIgdGhlIHNjcm9sbExlZnQgaXMgYWx3YXlzIHNvbWV3aGVyZSBpbiBbLW1heFNjcm9sbEFtb3VudCwgMF0uIEZvciBhblxuICAgICAgLy8gSU5WRVJURUQgYnJvd3NlciBpdCBpcyBhbHdheXMgc29tZXdoZXJlIGluIFswLCBtYXhTY3JvbGxBbW91bnRdLiBXZSBjYW4gZGV0ZXJtaW5lIHdoaWNoIGJ5XG4gICAgICAvLyBzZXR0aW5nIHRvIHRoZSBzY3JvbGxMZWZ0IHRvIDEuIFRoaXMgaXMgcGFzdCB0aGUgbWF4IGZvciBhIE5FR0FURUQgYnJvd3Nlciwgc28gaXQgd2lsbFxuICAgICAgLy8gcmV0dXJuIDAgd2hlbiB3ZSByZWFkIGl0IGFnYWluLlxuICAgICAgc2Nyb2xsQ29udGFpbmVyLnNjcm9sbExlZnQgPSAxO1xuICAgICAgcnRsU2Nyb2xsQXhpc1R5cGUgPVxuICAgICAgICAgIHNjcm9sbENvbnRhaW5lci5zY3JvbGxMZWZ0ID09PSAwID8gUnRsU2Nyb2xsQXhpc1R5cGUuTkVHQVRFRCA6IFJ0bFNjcm9sbEF4aXNUeXBlLklOVkVSVEVEO1xuICAgIH1cblxuICAgIHNjcm9sbENvbnRhaW5lci5wYXJlbnROb2RlIS5yZW1vdmVDaGlsZChzY3JvbGxDb250YWluZXIpO1xuICB9XG4gIHJldHVybiBydGxTY3JvbGxBeGlzVHlwZTtcbn1cbiJdfQ==