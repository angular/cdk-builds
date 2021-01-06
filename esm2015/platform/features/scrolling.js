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
        // If we're not in the browser, it can't be supported.
        if (typeof document !== 'object' || !document) {
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
        scrollContainer.parentNode.removeChild(scrollContainer);
    }
    return rtlScrollAxisType;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9wbGF0Zm9ybS9mZWF0dXJlcy9zY3JvbGxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBcUJILDJGQUEyRjtBQUMzRixJQUFJLGlCQUE4QyxDQUFDO0FBRW5ELCtGQUErRjtBQUMvRixJQUFJLHVCQUEwQyxDQUFDO0FBRS9DLDJEQUEyRDtBQUMzRCxNQUFNLFVBQVUsc0JBQXNCO0lBQ3BDLElBQUksdUJBQXVCLElBQUksSUFBSSxFQUFFO1FBQ25DLHNEQUFzRDtRQUN0RCxJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUM3Qyx1QkFBdUIsR0FBRyxLQUFLLENBQUM7WUFDaEMsT0FBTyx1QkFBdUIsQ0FBQztTQUNoQztRQUVELHdGQUF3RjtRQUN4RixJQUFJLGdCQUFnQixJQUFJLFFBQVEsQ0FBQyxlQUFnQixDQUFDLEtBQUssRUFBRTtZQUN2RCx1QkFBdUIsR0FBRyxJQUFJLENBQUM7U0FDaEM7YUFBTTtZQUNMLGlGQUFpRjtZQUNqRiw4RUFBOEU7WUFDOUUsTUFBTSxnQkFBZ0IsR0FBdUIsT0FBTyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUM7WUFFeEUsSUFBSSxnQkFBZ0IsRUFBRTtnQkFDcEIsd0ZBQXdGO2dCQUN4Rix5RkFBeUY7Z0JBQ3pGLDJGQUEyRjtnQkFDM0Ysc0RBQXNEO2dCQUN0RCx1QkFBdUIsR0FBRyxDQUFDLDJCQUEyQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2FBQzFGO2lCQUFNO2dCQUNMLHVCQUF1QixHQUFHLEtBQUssQ0FBQzthQUNqQztTQUNGO0tBQ0Y7SUFFRCxPQUFPLHVCQUF1QixDQUFDO0FBQ2pDLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsb0JBQW9CO0lBQ2xDLGlGQUFpRjtJQUNqRixJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsSUFBSSxDQUFDLFFBQVEsRUFBRTtRQUM3QyxzQkFBZ0M7S0FDakM7SUFFRCxJQUFJLGlCQUFpQixJQUFJLElBQUksRUFBRTtRQUM3Qix3RUFBd0U7UUFDeEUsTUFBTSxlQUFlLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0RCxNQUFNLGNBQWMsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDO1FBQzdDLGVBQWUsQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDO1FBQzVCLGNBQWMsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQzdCLGNBQWMsQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDO1FBQ2pDLGNBQWMsQ0FBQyxVQUFVLEdBQUcsUUFBUSxDQUFDO1FBQ3JDLGNBQWMsQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDO1FBQ3RDLGNBQWMsQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDO1FBRXJDLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDOUMsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQztRQUNuQyxZQUFZLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUMzQixZQUFZLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztRQUU1QixlQUFlLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3JDLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBRTNDLGlCQUFpQixpQkFBMkIsQ0FBQztRQUU3QywyRkFBMkY7UUFDM0YsOEZBQThGO1FBQzlGLHVEQUF1RDtRQUN2RCxJQUFJLGVBQWUsQ0FBQyxVQUFVLEtBQUssQ0FBQyxFQUFFO1lBQ3BDLDJGQUEyRjtZQUMzRiw2RkFBNkY7WUFDN0YseUZBQXlGO1lBQ3pGLGtDQUFrQztZQUNsQyxlQUFlLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQztZQUMvQixpQkFBaUI7Z0JBQ2IsZUFBZSxDQUFDLFVBQVUsS0FBSyxDQUFDLENBQUMsQ0FBQyxpQkFBMkIsQ0FBQyxpQkFBMkIsQ0FBQztTQUMvRjtRQUVELGVBQWUsQ0FBQyxVQUFXLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0tBQzFEO0lBQ0QsT0FBTyxpQkFBaUIsQ0FBQztBQUMzQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKiBUaGUgcG9zc2libGUgd2F5cyB0aGUgYnJvd3NlciBtYXkgaGFuZGxlIHRoZSBob3Jpem9udGFsIHNjcm9sbCBheGlzIGluIFJUTCBsYW5ndWFnZXMuICovXG5leHBvcnQgY29uc3QgZW51bSBSdGxTY3JvbGxBeGlzVHlwZSB7XG4gIC8qKlxuICAgKiBzY3JvbGxMZWZ0IGlzIDAgd2hlbiBzY3JvbGxlZCBhbGwgdGhlIHdheSBsZWZ0IGFuZCAoc2Nyb2xsV2lkdGggLSBjbGllbnRXaWR0aCkgd2hlbiBzY3JvbGxlZFxuICAgKiBhbGwgdGhlIHdheSByaWdodC5cbiAgICovXG4gIE5PUk1BTCxcbiAgLyoqXG4gICAqIHNjcm9sbExlZnQgaXMgLShzY3JvbGxXaWR0aCAtIGNsaWVudFdpZHRoKSB3aGVuIHNjcm9sbGVkIGFsbCB0aGUgd2F5IGxlZnQgYW5kIDAgd2hlbiBzY3JvbGxlZFxuICAgKiBhbGwgdGhlIHdheSByaWdodC5cbiAgICovXG4gIE5FR0FURUQsXG4gIC8qKlxuICAgKiBzY3JvbGxMZWZ0IGlzIChzY3JvbGxXaWR0aCAtIGNsaWVudFdpZHRoKSB3aGVuIHNjcm9sbGVkIGFsbCB0aGUgd2F5IGxlZnQgYW5kIDAgd2hlbiBzY3JvbGxlZFxuICAgKiBhbGwgdGhlIHdheSByaWdodC5cbiAgICovXG4gIElOVkVSVEVEXG59XG5cbi8qKiBDYWNoZWQgcmVzdWx0IG9mIHRoZSB3YXkgdGhlIGJyb3dzZXIgaGFuZGxlcyB0aGUgaG9yaXpvbnRhbCBzY3JvbGwgYXhpcyBpbiBSVEwgbW9kZS4gKi9cbmxldCBydGxTY3JvbGxBeGlzVHlwZTogUnRsU2Nyb2xsQXhpc1R5cGV8dW5kZWZpbmVkO1xuXG4vKiogQ2FjaGVkIHJlc3VsdCBvZiB0aGUgY2hlY2sgdGhhdCBpbmRpY2F0ZXMgd2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0cyBzY3JvbGwgYmVoYXZpb3JzLiAqL1xubGV0IHNjcm9sbEJlaGF2aW9yU3VwcG9ydGVkOiBib29sZWFufHVuZGVmaW5lZDtcblxuLyoqIENoZWNrIHdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgc2Nyb2xsIGJlaGF2aW9ycy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdXBwb3J0c1Njcm9sbEJlaGF2aW9yKCk6IGJvb2xlYW4ge1xuICBpZiAoc2Nyb2xsQmVoYXZpb3JTdXBwb3J0ZWQgPT0gbnVsbCkge1xuICAgIC8vIElmIHdlJ3JlIG5vdCBpbiB0aGUgYnJvd3NlciwgaXQgY2FuJ3QgYmUgc3VwcG9ydGVkLlxuICAgIGlmICh0eXBlb2YgZG9jdW1lbnQgIT09ICdvYmplY3QnIHx8ICFkb2N1bWVudCkge1xuICAgICAgc2Nyb2xsQmVoYXZpb3JTdXBwb3J0ZWQgPSBmYWxzZTtcbiAgICAgIHJldHVybiBzY3JvbGxCZWhhdmlvclN1cHBvcnRlZDtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgZWxlbWVudCBjYW4gaGF2ZSBhIGBzY3JvbGxCZWhhdmlvcmAgc3R5bGUsIHdlIGNhbiBiZSBzdXJlIHRoYXQgaXQncyBzdXBwb3J0ZWQuXG4gICAgaWYgKCdzY3JvbGxCZWhhdmlvcicgaW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IS5zdHlsZSkge1xuICAgICAgc2Nyb2xsQmVoYXZpb3JTdXBwb3J0ZWQgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBBdCB0aGlzIHBvaW50IHdlIGhhdmUgMyBwb3NzaWJpbGl0aWVzOiBgc2Nyb2xsVG9gIGlzbid0IHN1cHBvcnRlZCBhdCBhbGwsIGl0J3NcbiAgICAgIC8vIHN1cHBvcnRlZCBidXQgaXQgZG9lc24ndCBoYW5kbGUgc2Nyb2xsIGJlaGF2aW9yLCBvciBpdCBoYXMgYmVlbiBwb2x5ZmlsbGVkLlxuICAgICAgY29uc3Qgc2Nyb2xsVG9GdW5jdGlvbjogRnVuY3Rpb258dW5kZWZpbmVkID0gRWxlbWVudC5wcm90b3R5cGUuc2Nyb2xsVG87XG5cbiAgICAgIGlmIChzY3JvbGxUb0Z1bmN0aW9uKSB7XG4gICAgICAgIC8vIFdlIGNhbiBkZXRlY3QgaWYgdGhlIGZ1bmN0aW9uIGhhcyBiZWVuIHBvbHlmaWxsZWQgYnkgY2FsbGluZyBgdG9TdHJpbmdgIG9uIGl0LiBOYXRpdmVcbiAgICAgICAgLy8gZnVuY3Rpb25zIGFyZSBvYmZ1c2NhdGVkIHVzaW5nIGBbbmF0aXZlIGNvZGVdYCwgd2hlcmVhcyBpZiBpdCB3YXMgb3ZlcndyaXR0ZW4gd2UnZCBnZXRcbiAgICAgICAgLy8gdGhlIGFjdHVhbCBmdW5jdGlvbiBzb3VyY2UuIFZpYSBodHRwczovL2Rhdmlkd2Fsc2gubmFtZS9kZXRlY3QtbmF0aXZlLWZ1bmN0aW9uLiBDb25zaWRlclxuICAgICAgICAvLyBwb2x5ZmlsbGVkIGZ1bmN0aW9ucyBhcyBzdXBwb3J0aW5nIHNjcm9sbCBiZWhhdmlvci5cbiAgICAgICAgc2Nyb2xsQmVoYXZpb3JTdXBwb3J0ZWQgPSAhL1xce1xccypcXFtuYXRpdmUgY29kZVxcXVxccypcXH0vLnRlc3Qoc2Nyb2xsVG9GdW5jdGlvbi50b1N0cmluZygpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNjcm9sbEJlaGF2aW9yU3VwcG9ydGVkID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHNjcm9sbEJlaGF2aW9yU3VwcG9ydGVkO1xufVxuXG4vKipcbiAqIENoZWNrcyB0aGUgdHlwZSBvZiBSVEwgc2Nyb2xsIGF4aXMgdXNlZCBieSB0aGlzIGJyb3dzZXIuIEFzIG9mIHRpbWUgb2Ygd3JpdGluZywgQ2hyb21lIGlzIE5PUk1BTCxcbiAqIEZpcmVmb3ggJiBTYWZhcmkgYXJlIE5FR0FURUQsIGFuZCBJRSAmIEVkZ2UgYXJlIElOVkVSVEVELlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UnRsU2Nyb2xsQXhpc1R5cGUoKTogUnRsU2Nyb2xsQXhpc1R5cGUge1xuICAvLyBXZSBjYW4ndCBjaGVjayB1bmxlc3Mgd2UncmUgb24gdGhlIGJyb3dzZXIuIEp1c3QgYXNzdW1lICdub3JtYWwnIGlmIHdlJ3JlIG5vdC5cbiAgaWYgKHR5cGVvZiBkb2N1bWVudCAhPT0gJ29iamVjdCcgfHwgIWRvY3VtZW50KSB7XG4gICAgcmV0dXJuIFJ0bFNjcm9sbEF4aXNUeXBlLk5PUk1BTDtcbiAgfVxuXG4gIGlmIChydGxTY3JvbGxBeGlzVHlwZSA9PSBudWxsKSB7XG4gICAgLy8gQ3JlYXRlIGEgMXB4IHdpZGUgc2Nyb2xsaW5nIGNvbnRhaW5lciBhbmQgYSAycHggd2lkZSBjb250ZW50IGVsZW1lbnQuXG4gICAgY29uc3Qgc2Nyb2xsQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgY29uc3QgY29udGFpbmVyU3R5bGUgPSBzY3JvbGxDb250YWluZXIuc3R5bGU7XG4gICAgc2Nyb2xsQ29udGFpbmVyLmRpciA9ICdydGwnO1xuICAgIGNvbnRhaW5lclN0eWxlLndpZHRoID0gJzFweCc7XG4gICAgY29udGFpbmVyU3R5bGUub3ZlcmZsb3cgPSAnYXV0byc7XG4gICAgY29udGFpbmVyU3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICAgIGNvbnRhaW5lclN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XG4gICAgY29udGFpbmVyU3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXG4gICAgY29uc3QgY29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGNvbnN0IGNvbnRlbnRTdHlsZSA9IGNvbnRlbnQuc3R5bGU7XG4gICAgY29udGVudFN0eWxlLndpZHRoID0gJzJweCc7XG4gICAgY29udGVudFN0eWxlLmhlaWdodCA9ICcxcHgnO1xuXG4gICAgc2Nyb2xsQ29udGFpbmVyLmFwcGVuZENoaWxkKGNvbnRlbnQpO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc2Nyb2xsQ29udGFpbmVyKTtcblxuICAgIHJ0bFNjcm9sbEF4aXNUeXBlID0gUnRsU2Nyb2xsQXhpc1R5cGUuTk9STUFMO1xuXG4gICAgLy8gVGhlIHZpZXdwb3J0IHN0YXJ0cyBzY3JvbGxlZCBhbGwgdGhlIHdheSB0byB0aGUgcmlnaHQgaW4gUlRMIG1vZGUuIElmIHdlIGFyZSBpbiBhIE5PUk1BTFxuICAgIC8vIGJyb3dzZXIgdGhpcyB3b3VsZCBtZWFuIHRoYXQgdGhlIHNjcm9sbExlZnQgc2hvdWxkIGJlIDEuIElmIGl0J3MgemVybyBpbnN0ZWFkIHdlIGtub3cgd2UncmVcbiAgICAvLyBkZWFsaW5nIHdpdGggb25lIG9mIHRoZSBvdGhlciB0d28gdHlwZXMgb2YgYnJvd3NlcnMuXG4gICAgaWYgKHNjcm9sbENvbnRhaW5lci5zY3JvbGxMZWZ0ID09PSAwKSB7XG4gICAgICAvLyBJbiBhIE5FR0FURUQgYnJvd3NlciB0aGUgc2Nyb2xsTGVmdCBpcyBhbHdheXMgc29tZXdoZXJlIGluIFstbWF4U2Nyb2xsQW1vdW50LCAwXS4gRm9yIGFuXG4gICAgICAvLyBJTlZFUlRFRCBicm93c2VyIGl0IGlzIGFsd2F5cyBzb21ld2hlcmUgaW4gWzAsIG1heFNjcm9sbEFtb3VudF0uIFdlIGNhbiBkZXRlcm1pbmUgd2hpY2ggYnlcbiAgICAgIC8vIHNldHRpbmcgdG8gdGhlIHNjcm9sbExlZnQgdG8gMS4gVGhpcyBpcyBwYXN0IHRoZSBtYXggZm9yIGEgTkVHQVRFRCBicm93c2VyLCBzbyBpdCB3aWxsXG4gICAgICAvLyByZXR1cm4gMCB3aGVuIHdlIHJlYWQgaXQgYWdhaW4uXG4gICAgICBzY3JvbGxDb250YWluZXIuc2Nyb2xsTGVmdCA9IDE7XG4gICAgICBydGxTY3JvbGxBeGlzVHlwZSA9XG4gICAgICAgICAgc2Nyb2xsQ29udGFpbmVyLnNjcm9sbExlZnQgPT09IDAgPyBSdGxTY3JvbGxBeGlzVHlwZS5ORUdBVEVEIDogUnRsU2Nyb2xsQXhpc1R5cGUuSU5WRVJURUQ7XG4gICAgfVxuXG4gICAgc2Nyb2xsQ29udGFpbmVyLnBhcmVudE5vZGUhLnJlbW92ZUNoaWxkKHNjcm9sbENvbnRhaW5lcik7XG4gIH1cbiAgcmV0dXJuIHJ0bFNjcm9sbEF4aXNUeXBlO1xufVxuIl19