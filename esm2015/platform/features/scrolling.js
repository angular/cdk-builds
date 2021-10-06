/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** Cached result of the way the browser handles the horizontal scroll axis in RTL mode. */
let rtlScrollAxisType;
/** Cached result of the check that indicates whether the browser supports scroll behaviors. */
let scrollBehaviorSupported;
/** Check whether the browser supports scroll behaviors. */
export function supportsScrollBehavior() {
    if (scrollBehaviorSupported == null) {
        // If we're not in the browser, it can't be supported. Also check for `Element`, because
        // some projects stub out the global `document` during SSR which can throw us off.
        if (typeof document !== 'object' || !document || typeof Element !== 'function' || !Element) {
            scrollBehaviorSupported = false;
            return scrollBehaviorSupported;
        }
        // If the element can have a `scrollBehavior` style, we can be sure that it's supported.
        if ('scrollBehavior' in document.documentElement.style) {
            scrollBehaviorSupported = true;
        }
        else {
            // At this point we have 3 possibilities: `scrollTo` isn't supported at all, it's
            // supported but it doesn't handle scroll behavior, or it has been polyfilled.
            const scrollToFunction = Element.prototype.scrollTo;
            if (scrollToFunction) {
                // We can detect if the function has been polyfilled by calling `toString` on it. Native
                // functions are obfuscated using `[native code]`, whereas if it was overwritten we'd get
                // the actual function source. Via https://davidwalsh.name/detect-native-function. Consider
                // polyfilled functions as supporting scroll behavior.
                scrollBehaviorSupported = !/\{\s*\[native code\]\s*\}/.test(scrollToFunction.toString());
            }
            else {
                scrollBehaviorSupported = false;
            }
        }
    }
    return scrollBehaviorSupported;
}
/**
 * Checks the type of RTL scroll axis used by this browser. As of time of writing, Chrome is NORMAL,
 * Firefox & Safari are NEGATED, and IE & Edge are INVERTED.
 */
export function getRtlScrollAxisType() {
    // We can't check unless we're on the browser. Just assume 'normal' if we're not.
    if (typeof document !== 'object' || !document) {
        return 0 /* NORMAL */;
    }
    if (rtlScrollAxisType == null) {
        // Create a 1px wide scrolling container and a 2px wide content element.
        const scrollContainer = document.createElement('div');
        const containerStyle = scrollContainer.style;
        scrollContainer.dir = 'rtl';
        containerStyle.width = '1px';
        containerStyle.overflow = 'auto';
        containerStyle.visibility = 'hidden';
        containerStyle.pointerEvents = 'none';
        containerStyle.position = 'absolute';
        const content = document.createElement('div');
        const contentStyle = content.style;
        contentStyle.width = '2px';
        contentStyle.height = '1px';
        scrollContainer.appendChild(content);
        document.body.appendChild(scrollContainer);
        rtlScrollAxisType = 0 /* NORMAL */;
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
                scrollContainer.scrollLeft === 0 ? 1 /* NEGATED */ : 2 /* INVERTED */;
        }
        scrollContainer.remove();
    }
    return rtlScrollAxisType;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9wbGF0Zm9ybS9mZWF0dXJlcy9zY3JvbGxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBcUJILDJGQUEyRjtBQUMzRixJQUFJLGlCQUE4QyxDQUFDO0FBRW5ELCtGQUErRjtBQUMvRixJQUFJLHVCQUEwQyxDQUFDO0FBRS9DLDJEQUEyRDtBQUMzRCxNQUFNLFVBQVUsc0JBQXNCO0lBQ3BDLElBQUksdUJBQXVCLElBQUksSUFBSSxFQUFFO1FBQ25DLHdGQUF3RjtRQUN4RixrRkFBa0Y7UUFDbEYsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLElBQUksQ0FBQyxRQUFRLElBQUksT0FBTyxPQUFPLEtBQUssVUFBVSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQzFGLHVCQUF1QixHQUFHLEtBQUssQ0FBQztZQUNoQyxPQUFPLHVCQUF1QixDQUFDO1NBQ2hDO1FBRUQsd0ZBQXdGO1FBQ3hGLElBQUksZ0JBQWdCLElBQUksUUFBUSxDQUFDLGVBQWdCLENBQUMsS0FBSyxFQUFFO1lBQ3ZELHVCQUF1QixHQUFHLElBQUksQ0FBQztTQUNoQzthQUFNO1lBQ0wsaUZBQWlGO1lBQ2pGLDhFQUE4RTtZQUM5RSxNQUFNLGdCQUFnQixHQUF1QixPQUFPLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQztZQUV4RSxJQUFJLGdCQUFnQixFQUFFO2dCQUNwQix3RkFBd0Y7Z0JBQ3hGLHlGQUF5RjtnQkFDekYsMkZBQTJGO2dCQUMzRixzREFBc0Q7Z0JBQ3RELHVCQUF1QixHQUFHLENBQUMsMkJBQTJCLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7YUFDMUY7aUJBQU07Z0JBQ0wsdUJBQXVCLEdBQUcsS0FBSyxDQUFDO2FBQ2pDO1NBQ0Y7S0FDRjtJQUVELE9BQU8sdUJBQXVCLENBQUM7QUFDakMsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sVUFBVSxvQkFBb0I7SUFDbEMsaUZBQWlGO0lBQ2pGLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxJQUFJLENBQUMsUUFBUSxFQUFFO1FBQzdDLHNCQUFnQztLQUNqQztJQUVELElBQUksaUJBQWlCLElBQUksSUFBSSxFQUFFO1FBQzdCLHdFQUF3RTtRQUN4RSxNQUFNLGVBQWUsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RELE1BQU0sY0FBYyxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUM7UUFDN0MsZUFBZSxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUM7UUFDNUIsY0FBYyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDN0IsY0FBYyxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUM7UUFDakMsY0FBYyxDQUFDLFVBQVUsR0FBRyxRQUFRLENBQUM7UUFDckMsY0FBYyxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUM7UUFDdEMsY0FBYyxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUM7UUFFckMsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM5QyxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO1FBQ25DLFlBQVksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQzNCLFlBQVksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1FBRTVCLGVBQWUsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckMsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLENBQUM7UUFFM0MsaUJBQWlCLGlCQUEyQixDQUFDO1FBRTdDLDJGQUEyRjtRQUMzRiw4RkFBOEY7UUFDOUYsdURBQXVEO1FBQ3ZELElBQUksZUFBZSxDQUFDLFVBQVUsS0FBSyxDQUFDLEVBQUU7WUFDcEMsMkZBQTJGO1lBQzNGLDZGQUE2RjtZQUM3Rix5RkFBeUY7WUFDekYsa0NBQWtDO1lBQ2xDLGVBQWUsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO1lBQy9CLGlCQUFpQjtnQkFDYixlQUFlLENBQUMsVUFBVSxLQUFLLENBQUMsQ0FBQyxDQUFDLGlCQUEyQixDQUFDLGlCQUEyQixDQUFDO1NBQy9GO1FBRUQsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDO0tBQzFCO0lBQ0QsT0FBTyxpQkFBaUIsQ0FBQztBQUMzQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKiBUaGUgcG9zc2libGUgd2F5cyB0aGUgYnJvd3NlciBtYXkgaGFuZGxlIHRoZSBob3Jpem9udGFsIHNjcm9sbCBheGlzIGluIFJUTCBsYW5ndWFnZXMuICovXG5leHBvcnQgY29uc3QgZW51bSBSdGxTY3JvbGxBeGlzVHlwZSB7XG4gIC8qKlxuICAgKiBzY3JvbGxMZWZ0IGlzIDAgd2hlbiBzY3JvbGxlZCBhbGwgdGhlIHdheSBsZWZ0IGFuZCAoc2Nyb2xsV2lkdGggLSBjbGllbnRXaWR0aCkgd2hlbiBzY3JvbGxlZFxuICAgKiBhbGwgdGhlIHdheSByaWdodC5cbiAgICovXG4gIE5PUk1BTCxcbiAgLyoqXG4gICAqIHNjcm9sbExlZnQgaXMgLShzY3JvbGxXaWR0aCAtIGNsaWVudFdpZHRoKSB3aGVuIHNjcm9sbGVkIGFsbCB0aGUgd2F5IGxlZnQgYW5kIDAgd2hlbiBzY3JvbGxlZFxuICAgKiBhbGwgdGhlIHdheSByaWdodC5cbiAgICovXG4gIE5FR0FURUQsXG4gIC8qKlxuICAgKiBzY3JvbGxMZWZ0IGlzIChzY3JvbGxXaWR0aCAtIGNsaWVudFdpZHRoKSB3aGVuIHNjcm9sbGVkIGFsbCB0aGUgd2F5IGxlZnQgYW5kIDAgd2hlbiBzY3JvbGxlZFxuICAgKiBhbGwgdGhlIHdheSByaWdodC5cbiAgICovXG4gIElOVkVSVEVEXG59XG5cbi8qKiBDYWNoZWQgcmVzdWx0IG9mIHRoZSB3YXkgdGhlIGJyb3dzZXIgaGFuZGxlcyB0aGUgaG9yaXpvbnRhbCBzY3JvbGwgYXhpcyBpbiBSVEwgbW9kZS4gKi9cbmxldCBydGxTY3JvbGxBeGlzVHlwZTogUnRsU2Nyb2xsQXhpc1R5cGV8dW5kZWZpbmVkO1xuXG4vKiogQ2FjaGVkIHJlc3VsdCBvZiB0aGUgY2hlY2sgdGhhdCBpbmRpY2F0ZXMgd2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0cyBzY3JvbGwgYmVoYXZpb3JzLiAqL1xubGV0IHNjcm9sbEJlaGF2aW9yU3VwcG9ydGVkOiBib29sZWFufHVuZGVmaW5lZDtcblxuLyoqIENoZWNrIHdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgc2Nyb2xsIGJlaGF2aW9ycy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdXBwb3J0c1Njcm9sbEJlaGF2aW9yKCk6IGJvb2xlYW4ge1xuICBpZiAoc2Nyb2xsQmVoYXZpb3JTdXBwb3J0ZWQgPT0gbnVsbCkge1xuICAgIC8vIElmIHdlJ3JlIG5vdCBpbiB0aGUgYnJvd3NlciwgaXQgY2FuJ3QgYmUgc3VwcG9ydGVkLiBBbHNvIGNoZWNrIGZvciBgRWxlbWVudGAsIGJlY2F1c2VcbiAgICAvLyBzb21lIHByb2plY3RzIHN0dWIgb3V0IHRoZSBnbG9iYWwgYGRvY3VtZW50YCBkdXJpbmcgU1NSIHdoaWNoIGNhbiB0aHJvdyB1cyBvZmYuXG4gICAgaWYgKHR5cGVvZiBkb2N1bWVudCAhPT0gJ29iamVjdCcgfHwgIWRvY3VtZW50IHx8IHR5cGVvZiBFbGVtZW50ICE9PSAnZnVuY3Rpb24nIHx8ICFFbGVtZW50KSB7XG4gICAgICBzY3JvbGxCZWhhdmlvclN1cHBvcnRlZCA9IGZhbHNlO1xuICAgICAgcmV0dXJuIHNjcm9sbEJlaGF2aW9yU3VwcG9ydGVkO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBlbGVtZW50IGNhbiBoYXZlIGEgYHNjcm9sbEJlaGF2aW9yYCBzdHlsZSwgd2UgY2FuIGJlIHN1cmUgdGhhdCBpdCdzIHN1cHBvcnRlZC5cbiAgICBpZiAoJ3Njcm9sbEJlaGF2aW9yJyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQhLnN0eWxlKSB7XG4gICAgICBzY3JvbGxCZWhhdmlvclN1cHBvcnRlZCA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEF0IHRoaXMgcG9pbnQgd2UgaGF2ZSAzIHBvc3NpYmlsaXRpZXM6IGBzY3JvbGxUb2AgaXNuJ3Qgc3VwcG9ydGVkIGF0IGFsbCwgaXQnc1xuICAgICAgLy8gc3VwcG9ydGVkIGJ1dCBpdCBkb2Vzbid0IGhhbmRsZSBzY3JvbGwgYmVoYXZpb3IsIG9yIGl0IGhhcyBiZWVuIHBvbHlmaWxsZWQuXG4gICAgICBjb25zdCBzY3JvbGxUb0Z1bmN0aW9uOiBGdW5jdGlvbnx1bmRlZmluZWQgPSBFbGVtZW50LnByb3RvdHlwZS5zY3JvbGxUbztcblxuICAgICAgaWYgKHNjcm9sbFRvRnVuY3Rpb24pIHtcbiAgICAgICAgLy8gV2UgY2FuIGRldGVjdCBpZiB0aGUgZnVuY3Rpb24gaGFzIGJlZW4gcG9seWZpbGxlZCBieSBjYWxsaW5nIGB0b1N0cmluZ2Agb24gaXQuIE5hdGl2ZVxuICAgICAgICAvLyBmdW5jdGlvbnMgYXJlIG9iZnVzY2F0ZWQgdXNpbmcgYFtuYXRpdmUgY29kZV1gLCB3aGVyZWFzIGlmIGl0IHdhcyBvdmVyd3JpdHRlbiB3ZSdkIGdldFxuICAgICAgICAvLyB0aGUgYWN0dWFsIGZ1bmN0aW9uIHNvdXJjZS4gVmlhIGh0dHBzOi8vZGF2aWR3YWxzaC5uYW1lL2RldGVjdC1uYXRpdmUtZnVuY3Rpb24uIENvbnNpZGVyXG4gICAgICAgIC8vIHBvbHlmaWxsZWQgZnVuY3Rpb25zIGFzIHN1cHBvcnRpbmcgc2Nyb2xsIGJlaGF2aW9yLlxuICAgICAgICBzY3JvbGxCZWhhdmlvclN1cHBvcnRlZCA9ICEvXFx7XFxzKlxcW25hdGl2ZSBjb2RlXFxdXFxzKlxcfS8udGVzdChzY3JvbGxUb0Z1bmN0aW9uLnRvU3RyaW5nKCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2Nyb2xsQmVoYXZpb3JTdXBwb3J0ZWQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gc2Nyb2xsQmVoYXZpb3JTdXBwb3J0ZWQ7XG59XG5cbi8qKlxuICogQ2hlY2tzIHRoZSB0eXBlIG9mIFJUTCBzY3JvbGwgYXhpcyB1c2VkIGJ5IHRoaXMgYnJvd3Nlci4gQXMgb2YgdGltZSBvZiB3cml0aW5nLCBDaHJvbWUgaXMgTk9STUFMLFxuICogRmlyZWZveCAmIFNhZmFyaSBhcmUgTkVHQVRFRCwgYW5kIElFICYgRWRnZSBhcmUgSU5WRVJURUQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSdGxTY3JvbGxBeGlzVHlwZSgpOiBSdGxTY3JvbGxBeGlzVHlwZSB7XG4gIC8vIFdlIGNhbid0IGNoZWNrIHVubGVzcyB3ZSdyZSBvbiB0aGUgYnJvd3Nlci4gSnVzdCBhc3N1bWUgJ25vcm1hbCcgaWYgd2UncmUgbm90LlxuICBpZiAodHlwZW9mIGRvY3VtZW50ICE9PSAnb2JqZWN0JyB8fCAhZG9jdW1lbnQpIHtcbiAgICByZXR1cm4gUnRsU2Nyb2xsQXhpc1R5cGUuTk9STUFMO1xuICB9XG5cbiAgaWYgKHJ0bFNjcm9sbEF4aXNUeXBlID09IG51bGwpIHtcbiAgICAvLyBDcmVhdGUgYSAxcHggd2lkZSBzY3JvbGxpbmcgY29udGFpbmVyIGFuZCBhIDJweCB3aWRlIGNvbnRlbnQgZWxlbWVudC5cbiAgICBjb25zdCBzY3JvbGxDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjb25zdCBjb250YWluZXJTdHlsZSA9IHNjcm9sbENvbnRhaW5lci5zdHlsZTtcbiAgICBzY3JvbGxDb250YWluZXIuZGlyID0gJ3J0bCc7XG4gICAgY29udGFpbmVyU3R5bGUud2lkdGggPSAnMXB4JztcbiAgICBjb250YWluZXJTdHlsZS5vdmVyZmxvdyA9ICdhdXRvJztcbiAgICBjb250YWluZXJTdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gICAgY29udGFpbmVyU3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcbiAgICBjb250YWluZXJTdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cbiAgICBjb25zdCBjb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgY29uc3QgY29udGVudFN0eWxlID0gY29udGVudC5zdHlsZTtcbiAgICBjb250ZW50U3R5bGUud2lkdGggPSAnMnB4JztcbiAgICBjb250ZW50U3R5bGUuaGVpZ2h0ID0gJzFweCc7XG5cbiAgICBzY3JvbGxDb250YWluZXIuYXBwZW5kQ2hpbGQoY29udGVudCk7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzY3JvbGxDb250YWluZXIpO1xuXG4gICAgcnRsU2Nyb2xsQXhpc1R5cGUgPSBSdGxTY3JvbGxBeGlzVHlwZS5OT1JNQUw7XG5cbiAgICAvLyBUaGUgdmlld3BvcnQgc3RhcnRzIHNjcm9sbGVkIGFsbCB0aGUgd2F5IHRvIHRoZSByaWdodCBpbiBSVEwgbW9kZS4gSWYgd2UgYXJlIGluIGEgTk9STUFMXG4gICAgLy8gYnJvd3NlciB0aGlzIHdvdWxkIG1lYW4gdGhhdCB0aGUgc2Nyb2xsTGVmdCBzaG91bGQgYmUgMS4gSWYgaXQncyB6ZXJvIGluc3RlYWQgd2Uga25vdyB3ZSdyZVxuICAgIC8vIGRlYWxpbmcgd2l0aCBvbmUgb2YgdGhlIG90aGVyIHR3byB0eXBlcyBvZiBicm93c2Vycy5cbiAgICBpZiAoc2Nyb2xsQ29udGFpbmVyLnNjcm9sbExlZnQgPT09IDApIHtcbiAgICAgIC8vIEluIGEgTkVHQVRFRCBicm93c2VyIHRoZSBzY3JvbGxMZWZ0IGlzIGFsd2F5cyBzb21ld2hlcmUgaW4gWy1tYXhTY3JvbGxBbW91bnQsIDBdLiBGb3IgYW5cbiAgICAgIC8vIElOVkVSVEVEIGJyb3dzZXIgaXQgaXMgYWx3YXlzIHNvbWV3aGVyZSBpbiBbMCwgbWF4U2Nyb2xsQW1vdW50XS4gV2UgY2FuIGRldGVybWluZSB3aGljaCBieVxuICAgICAgLy8gc2V0dGluZyB0byB0aGUgc2Nyb2xsTGVmdCB0byAxLiBUaGlzIGlzIHBhc3QgdGhlIG1heCBmb3IgYSBORUdBVEVEIGJyb3dzZXIsIHNvIGl0IHdpbGxcbiAgICAgIC8vIHJldHVybiAwIHdoZW4gd2UgcmVhZCBpdCBhZ2Fpbi5cbiAgICAgIHNjcm9sbENvbnRhaW5lci5zY3JvbGxMZWZ0ID0gMTtcbiAgICAgIHJ0bFNjcm9sbEF4aXNUeXBlID1cbiAgICAgICAgICBzY3JvbGxDb250YWluZXIuc2Nyb2xsTGVmdCA9PT0gMCA/IFJ0bFNjcm9sbEF4aXNUeXBlLk5FR0FURUQgOiBSdGxTY3JvbGxBeGlzVHlwZS5JTlZFUlRFRDtcbiAgICB9XG5cbiAgICBzY3JvbGxDb250YWluZXIucmVtb3ZlKCk7XG4gIH1cbiAgcmV0dXJuIHJ0bFNjcm9sbEF4aXNUeXBlO1xufVxuIl19