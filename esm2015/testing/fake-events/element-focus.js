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
 * This is necessary, because some browsers, like IE11, will call the focus handlers asynchronously,
 * while others won't fire them at all if the browser window is not focused.
 * @docs-private
 */
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudC1mb2N1cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGVzdGluZy9mYWtlLWV2ZW50cy9lbGVtZW50LWZvY3VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRXBELFNBQVMsa0JBQWtCLENBQUMsT0FBb0IsRUFBRSxLQUF1QjtJQUN2RSxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7SUFDdkIsTUFBTSxPQUFPLEdBQUcsR0FBRyxFQUFFLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztJQUN4QyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3pDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO0lBQ2pCLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDNUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtRQUNmLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztLQUNuQztBQUNILENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxPQUFvQjtJQUNwRCxPQUFPLENBQUMsS0FBSyxHQUFHLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUMxRCxPQUFPLENBQUMsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztBQUMxRCxDQUFDO0FBRUQsb0JBQW9CO0FBQ3BCLE1BQU0sVUFBVSxZQUFZLENBQUMsT0FBb0I7SUFDL0Msa0JBQWtCLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ3ZDLENBQUM7QUFFRCxvQkFBb0I7QUFDcEIsTUFBTSxVQUFVLFdBQVcsQ0FBQyxPQUFvQjtJQUM5QyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDdEMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Rpc3BhdGNoRmFrZUV2ZW50fSBmcm9tICcuL2Rpc3BhdGNoLWV2ZW50cyc7XG5cbmZ1bmN0aW9uIHRyaWdnZXJGb2N1c0NoYW5nZShlbGVtZW50OiBIVE1MRWxlbWVudCwgZXZlbnQ6ICdmb2N1cycgfCAnYmx1cicpIHtcbiAgbGV0IGV2ZW50RmlyZWQgPSBmYWxzZTtcbiAgY29uc3QgaGFuZGxlciA9ICgpID0+IGV2ZW50RmlyZWQgPSB0cnVlO1xuICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIpO1xuICBlbGVtZW50W2V2ZW50XSgpO1xuICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIpO1xuICBpZiAoIWV2ZW50RmlyZWQpIHtcbiAgICBkaXNwYXRjaEZha2VFdmVudChlbGVtZW50LCBldmVudCk7XG4gIH1cbn1cblxuLyoqXG4gKiBQYXRjaGVzIGFuIGVsZW1lbnRzIGZvY3VzIGFuZCBibHVyIG1ldGhvZHMgdG8gZW1pdCBldmVudHMgY29uc2lzdGVudGx5IGFuZCBwcmVkaWN0YWJseS5cbiAqIFRoaXMgaXMgbmVjZXNzYXJ5LCBiZWNhdXNlIHNvbWUgYnJvd3NlcnMsIGxpa2UgSUUxMSwgd2lsbCBjYWxsIHRoZSBmb2N1cyBoYW5kbGVycyBhc3luY2hyb25vdXNseSxcbiAqIHdoaWxlIG90aGVycyB3b24ndCBmaXJlIHRoZW0gYXQgYWxsIGlmIHRoZSBicm93c2VyIHdpbmRvdyBpcyBub3QgZm9jdXNlZC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhdGNoRWxlbWVudEZvY3VzKGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gIGVsZW1lbnQuZm9jdXMgPSAoKSA9PiBkaXNwYXRjaEZha2VFdmVudChlbGVtZW50LCAnZm9jdXMnKTtcbiAgZWxlbWVudC5ibHVyID0gKCkgPT4gZGlzcGF0Y2hGYWtlRXZlbnQoZWxlbWVudCwgJ2JsdXInKTtcbn1cblxuLyoqIEBkb2NzLXByaXZhdGUgKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmlnZ2VyRm9jdXMoZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgdHJpZ2dlckZvY3VzQ2hhbmdlKGVsZW1lbnQsICdmb2N1cycpO1xufVxuXG4vKiogQGRvY3MtcHJpdmF0ZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyaWdnZXJCbHVyKGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gIHRyaWdnZXJGb2N1c0NoYW5nZShlbGVtZW50LCAnYmx1cicpO1xufVxuIl19