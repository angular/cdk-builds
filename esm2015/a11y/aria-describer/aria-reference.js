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
 * IDs are deliminated by an empty space, as per the spec.
 * @type {?}
 */
const ID_DELIMINATOR = ' ';
/**
 * Adds the given ID to the specified ARIA attribute on an element.
 * Used for attributes such as aria-labelledby, aria-owns, etc.
 * @param {?} el
 * @param {?} attr
 * @param {?} id
 * @return {?}
 */
export function addAriaReferencedId(el, attr, id) {
    /** @type {?} */
    const ids = getAriaReferenceIds(el, attr);
    if (ids.some((/**
     * @param {?} existingId
     * @return {?}
     */
    existingId => existingId.trim() == id.trim()))) {
        return;
    }
    ids.push(id.trim());
    el.setAttribute(attr, ids.join(ID_DELIMINATOR));
}
/**
 * Removes the given ID from the specified ARIA attribute on an element.
 * Used for attributes such as aria-labelledby, aria-owns, etc.
 * @param {?} el
 * @param {?} attr
 * @param {?} id
 * @return {?}
 */
export function removeAriaReferencedId(el, attr, id) {
    /** @type {?} */
    const ids = getAriaReferenceIds(el, attr);
    /** @type {?} */
    const filteredIds = ids.filter((/**
     * @param {?} val
     * @return {?}
     */
    val => val != id.trim()));
    if (filteredIds.length) {
        el.setAttribute(attr, filteredIds.join(ID_DELIMINATOR));
    }
    else {
        el.removeAttribute(attr);
    }
}
/**
 * Gets the list of IDs referenced by the given ARIA attribute on an element.
 * Used for attributes such as aria-labelledby, aria-owns, etc.
 * @param {?} el
 * @param {?} attr
 * @return {?}
 */
export function getAriaReferenceIds(el, attr) {
    // Get string array of all individual ids (whitespace deliminated) in the attribute value
    return (el.getAttribute(attr) || '').match(/\S+/g) || [];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJpYS1yZWZlcmVuY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2ExMXkvYXJpYS1kZXNjcmliZXIvYXJpYS1yZWZlcmVuY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O01BU00sY0FBYyxHQUFHLEdBQUc7Ozs7Ozs7OztBQU0xQixNQUFNLFVBQVUsbUJBQW1CLENBQUMsRUFBVyxFQUFFLElBQVksRUFBRSxFQUFVOztVQUNqRSxHQUFHLEdBQUcsbUJBQW1CLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQztJQUN6QyxJQUFJLEdBQUcsQ0FBQyxJQUFJOzs7O0lBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLElBQUksRUFBRSxFQUFDLEVBQUU7UUFBRSxPQUFPO0tBQUU7SUFDdkUsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUVwQixFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7QUFDbEQsQ0FBQzs7Ozs7Ozs7O0FBTUQsTUFBTSxVQUFVLHNCQUFzQixDQUFDLEVBQVcsRUFBRSxJQUFZLEVBQUUsRUFBVTs7VUFDcEUsR0FBRyxHQUFHLG1CQUFtQixDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUM7O1VBQ25DLFdBQVcsR0FBRyxHQUFHLENBQUMsTUFBTTs7OztJQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBQztJQUV2RCxJQUFJLFdBQVcsQ0FBQyxNQUFNLEVBQUU7UUFDdEIsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO0tBQ3pEO1NBQU07UUFDTCxFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQzFCO0FBQ0gsQ0FBQzs7Ozs7Ozs7QUFNRCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsRUFBVyxFQUFFLElBQVk7SUFDM0QseUZBQXlGO0lBQ3pGLE9BQU8sQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDM0QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKiogSURzIGFyZSBkZWxpbWluYXRlZCBieSBhbiBlbXB0eSBzcGFjZSwgYXMgcGVyIHRoZSBzcGVjLiAqL1xuY29uc3QgSURfREVMSU1JTkFUT1IgPSAnICc7XG5cbi8qKlxuICogQWRkcyB0aGUgZ2l2ZW4gSUQgdG8gdGhlIHNwZWNpZmllZCBBUklBIGF0dHJpYnV0ZSBvbiBhbiBlbGVtZW50LlxuICogVXNlZCBmb3IgYXR0cmlidXRlcyBzdWNoIGFzIGFyaWEtbGFiZWxsZWRieSwgYXJpYS1vd25zLCBldGMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRBcmlhUmVmZXJlbmNlZElkKGVsOiBFbGVtZW50LCBhdHRyOiBzdHJpbmcsIGlkOiBzdHJpbmcpIHtcbiAgY29uc3QgaWRzID0gZ2V0QXJpYVJlZmVyZW5jZUlkcyhlbCwgYXR0cik7XG4gIGlmIChpZHMuc29tZShleGlzdGluZ0lkID0+IGV4aXN0aW5nSWQudHJpbSgpID09IGlkLnRyaW0oKSkpIHsgcmV0dXJuOyB9XG4gIGlkcy5wdXNoKGlkLnRyaW0oKSk7XG5cbiAgZWwuc2V0QXR0cmlidXRlKGF0dHIsIGlkcy5qb2luKElEX0RFTElNSU5BVE9SKSk7XG59XG5cbi8qKlxuICogUmVtb3ZlcyB0aGUgZ2l2ZW4gSUQgZnJvbSB0aGUgc3BlY2lmaWVkIEFSSUEgYXR0cmlidXRlIG9uIGFuIGVsZW1lbnQuXG4gKiBVc2VkIGZvciBhdHRyaWJ1dGVzIHN1Y2ggYXMgYXJpYS1sYWJlbGxlZGJ5LCBhcmlhLW93bnMsIGV0Yy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZUFyaWFSZWZlcmVuY2VkSWQoZWw6IEVsZW1lbnQsIGF0dHI6IHN0cmluZywgaWQ6IHN0cmluZykge1xuICBjb25zdCBpZHMgPSBnZXRBcmlhUmVmZXJlbmNlSWRzKGVsLCBhdHRyKTtcbiAgY29uc3QgZmlsdGVyZWRJZHMgPSBpZHMuZmlsdGVyKHZhbCA9PiB2YWwgIT0gaWQudHJpbSgpKTtcblxuICBpZiAoZmlsdGVyZWRJZHMubGVuZ3RoKSB7XG4gICAgZWwuc2V0QXR0cmlidXRlKGF0dHIsIGZpbHRlcmVkSWRzLmpvaW4oSURfREVMSU1JTkFUT1IpKTtcbiAgfSBlbHNlIHtcbiAgICBlbC5yZW1vdmVBdHRyaWJ1dGUoYXR0cik7XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBsaXN0IG9mIElEcyByZWZlcmVuY2VkIGJ5IHRoZSBnaXZlbiBBUklBIGF0dHJpYnV0ZSBvbiBhbiBlbGVtZW50LlxuICogVXNlZCBmb3IgYXR0cmlidXRlcyBzdWNoIGFzIGFyaWEtbGFiZWxsZWRieSwgYXJpYS1vd25zLCBldGMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRBcmlhUmVmZXJlbmNlSWRzKGVsOiBFbGVtZW50LCBhdHRyOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIC8vIEdldCBzdHJpbmcgYXJyYXkgb2YgYWxsIGluZGl2aWR1YWwgaWRzICh3aGl0ZXNwYWNlIGRlbGltaW5hdGVkKSBpbiB0aGUgYXR0cmlidXRlIHZhbHVlXG4gIHJldHVybiAoZWwuZ2V0QXR0cmlidXRlKGF0dHIpIHx8ICcnKS5tYXRjaCgvXFxTKy9nKSB8fCBbXTtcbn1cbiJdfQ==