/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { dispatchFakeEvent } from './dispatch-events';
function triggerFocusChange(element, event) {
    let eventFired = false;
    const handler = () => eventFired = true;
    element.addEventListener(event, handler);
    element[event]();
    element.removeEventListener(event, handler);
    if (!eventFired) {
        dispatchFakeEvent(element, event);
    }
}
/**
 * Patches an elements focus and blur methods to emit events consistently and predictably.
 * This is necessary, because some browsers can call the focus handlers asynchronously,
 * while others won't fire them at all if the browser window is not focused.
 * @docs-private
 */
// TODO: Check if this element focus patching is still needed for local testing,
// where browser is not necessarily focused.
export function patchElementFocus(element) {
    element.focus = () => dispatchFakeEvent(element, 'focus');
    element.blur = () => dispatchFakeEvent(element, 'blur');
}
/** @docs-private */
export function triggerFocus(element) {
    triggerFocusChange(element, 'focus');
}
/** @docs-private */
export function triggerBlur(element) {
    triggerFocusChange(element, 'blur');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudC1mb2N1cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGVzdGluZy90ZXN0YmVkL2Zha2UtZXZlbnRzL2VsZW1lbnQtZm9jdXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFcEQsU0FBUyxrQkFBa0IsQ0FBQyxPQUFvQixFQUFFLEtBQXVCO0lBQ3ZFLElBQUksVUFBVSxHQUFHLEtBQUssQ0FBQztJQUN2QixNQUFNLE9BQU8sR0FBRyxHQUFHLEVBQUUsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0lBQ3hDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDekMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7SUFDakIsT0FBTyxDQUFDLG1CQUFtQixDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztJQUM1QyxJQUFJLENBQUMsVUFBVSxFQUFFO1FBQ2YsaUJBQWlCLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ25DO0FBQ0gsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsZ0ZBQWdGO0FBQ2hGLDRDQUE0QztBQUM1QyxNQUFNLFVBQVUsaUJBQWlCLENBQUMsT0FBb0I7SUFDcEQsT0FBTyxDQUFDLEtBQUssR0FBRyxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDMUQsT0FBTyxDQUFDLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDMUQsQ0FBQztBQUVELG9CQUFvQjtBQUNwQixNQUFNLFVBQVUsWUFBWSxDQUFDLE9BQW9CO0lBQy9DLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUN2QyxDQUFDO0FBRUQsb0JBQW9CO0FBQ3BCLE1BQU0sVUFBVSxXQUFXLENBQUMsT0FBb0I7SUFDOUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3RDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtkaXNwYXRjaEZha2VFdmVudH0gZnJvbSAnLi9kaXNwYXRjaC1ldmVudHMnO1xuXG5mdW5jdGlvbiB0cmlnZ2VyRm9jdXNDaGFuZ2UoZWxlbWVudDogSFRNTEVsZW1lbnQsIGV2ZW50OiAnZm9jdXMnIHwgJ2JsdXInKSB7XG4gIGxldCBldmVudEZpcmVkID0gZmFsc2U7XG4gIGNvbnN0IGhhbmRsZXIgPSAoKSA9PiBldmVudEZpcmVkID0gdHJ1ZTtcbiAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVyKTtcbiAgZWxlbWVudFtldmVudF0oKTtcbiAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVyKTtcbiAgaWYgKCFldmVudEZpcmVkKSB7XG4gICAgZGlzcGF0Y2hGYWtlRXZlbnQoZWxlbWVudCwgZXZlbnQpO1xuICB9XG59XG5cbi8qKlxuICogUGF0Y2hlcyBhbiBlbGVtZW50cyBmb2N1cyBhbmQgYmx1ciBtZXRob2RzIHRvIGVtaXQgZXZlbnRzIGNvbnNpc3RlbnRseSBhbmQgcHJlZGljdGFibHkuXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSwgYmVjYXVzZSBzb21lIGJyb3dzZXJzIGNhbiBjYWxsIHRoZSBmb2N1cyBoYW5kbGVycyBhc3luY2hyb25vdXNseSxcbiAqIHdoaWxlIG90aGVycyB3b24ndCBmaXJlIHRoZW0gYXQgYWxsIGlmIHRoZSBicm93c2VyIHdpbmRvdyBpcyBub3QgZm9jdXNlZC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuLy8gVE9ETzogQ2hlY2sgaWYgdGhpcyBlbGVtZW50IGZvY3VzIHBhdGNoaW5nIGlzIHN0aWxsIG5lZWRlZCBmb3IgbG9jYWwgdGVzdGluZyxcbi8vIHdoZXJlIGJyb3dzZXIgaXMgbm90IG5lY2Vzc2FyaWx5IGZvY3VzZWQuXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2hFbGVtZW50Rm9jdXMoZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgZWxlbWVudC5mb2N1cyA9ICgpID0+IGRpc3BhdGNoRmFrZUV2ZW50KGVsZW1lbnQsICdmb2N1cycpO1xuICBlbGVtZW50LmJsdXIgPSAoKSA9PiBkaXNwYXRjaEZha2VFdmVudChlbGVtZW50LCAnYmx1cicpO1xufVxuXG4vKiogQGRvY3MtcHJpdmF0ZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyaWdnZXJGb2N1cyhlbGVtZW50OiBIVE1MRWxlbWVudCkge1xuICB0cmlnZ2VyRm9jdXNDaGFuZ2UoZWxlbWVudCwgJ2ZvY3VzJyk7XG59XG5cbi8qKiBAZG9jcy1wcml2YXRlICovXG5leHBvcnQgZnVuY3Rpb24gdHJpZ2dlckJsdXIoZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgdHJpZ2dlckZvY3VzQ2hhbmdlKGVsZW1lbnQsICdibHVyJyk7XG59XG4iXX0=