/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Gets text of element excluding certain selectors within the element.
 * @param element Element to get text from,
 * @param excludeSelector Selector identifying which elements to exclude,
 */
export function _getTextWithExcludedElements(element, excludeSelector) {
    const clone = element.cloneNode(true);
    const exclusions = clone.querySelectorAll(excludeSelector);
    for (let i = 0; i < exclusions.length; i++) {
        exclusions[i].remove();
    }
    return (clone.textContent || '').trim();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dC1maWx0ZXJpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Rlc3RpbmcvdGV4dC1maWx0ZXJpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUg7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSw0QkFBNEIsQ0FBQyxPQUFnQixFQUFFLGVBQXVCO0lBQ3BGLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFZLENBQUM7SUFDakQsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQzNELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDM0MsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ3pCLENBQUM7SUFDRCxPQUFPLENBQUMsS0FBSyxDQUFDLFdBQVcsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUMxQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogR2V0cyB0ZXh0IG9mIGVsZW1lbnQgZXhjbHVkaW5nIGNlcnRhaW4gc2VsZWN0b3JzIHdpdGhpbiB0aGUgZWxlbWVudC5cbiAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgdG8gZ2V0IHRleHQgZnJvbSxcbiAqIEBwYXJhbSBleGNsdWRlU2VsZWN0b3IgU2VsZWN0b3IgaWRlbnRpZnlpbmcgd2hpY2ggZWxlbWVudHMgdG8gZXhjbHVkZSxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIF9nZXRUZXh0V2l0aEV4Y2x1ZGVkRWxlbWVudHMoZWxlbWVudDogRWxlbWVudCwgZXhjbHVkZVNlbGVjdG9yOiBzdHJpbmcpIHtcbiAgY29uc3QgY2xvbmUgPSBlbGVtZW50LmNsb25lTm9kZSh0cnVlKSBhcyBFbGVtZW50O1xuICBjb25zdCBleGNsdXNpb25zID0gY2xvbmUucXVlcnlTZWxlY3RvckFsbChleGNsdWRlU2VsZWN0b3IpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGV4Y2x1c2lvbnMubGVuZ3RoOyBpKyspIHtcbiAgICBleGNsdXNpb25zW2ldLnJlbW92ZSgpO1xuICB9XG4gIHJldHVybiAoY2xvbmUudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKTtcbn1cbiJdfQ==