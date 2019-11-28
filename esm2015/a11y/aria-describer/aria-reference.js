/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/a11y/aria-describer/aria-reference.ts
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJpYS1yZWZlcmVuY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2ExMXkvYXJpYS1kZXNjcmliZXIvYXJpYS1yZWZlcmVuY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztNQVNNLGNBQWMsR0FBRyxHQUFHOzs7Ozs7Ozs7QUFNMUIsTUFBTSxVQUFVLG1CQUFtQixDQUFDLEVBQVcsRUFBRSxJQUFZLEVBQUUsRUFBVTs7VUFDakUsR0FBRyxHQUFHLG1CQUFtQixDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUM7SUFDekMsSUFBSSxHQUFHLENBQUMsSUFBSTs7OztJQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBQyxFQUFFO1FBQUUsT0FBTztLQUFFO0lBQ3ZFLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7SUFFcEIsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO0FBQ2xELENBQUM7Ozs7Ozs7OztBQU1ELE1BQU0sVUFBVSxzQkFBc0IsQ0FBQyxFQUFXLEVBQUUsSUFBWSxFQUFFLEVBQVU7O1VBQ3BFLEdBQUcsR0FBRyxtQkFBbUIsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDOztVQUNuQyxXQUFXLEdBQUcsR0FBRyxDQUFDLE1BQU07Ozs7SUFBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUM7SUFFdkQsSUFBSSxXQUFXLENBQUMsTUFBTSxFQUFFO1FBQ3RCLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztLQUN6RDtTQUFNO1FBQ0wsRUFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUMxQjtBQUNILENBQUM7Ozs7Ozs7O0FBTUQsTUFBTSxVQUFVLG1CQUFtQixDQUFDLEVBQVcsRUFBRSxJQUFZO0lBQzNELHlGQUF5RjtJQUN6RixPQUFPLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO0FBQzNELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqIElEcyBhcmUgZGVsaW1pbmF0ZWQgYnkgYW4gZW1wdHkgc3BhY2UsIGFzIHBlciB0aGUgc3BlYy4gKi9cbmNvbnN0IElEX0RFTElNSU5BVE9SID0gJyAnO1xuXG4vKipcbiAqIEFkZHMgdGhlIGdpdmVuIElEIHRvIHRoZSBzcGVjaWZpZWQgQVJJQSBhdHRyaWJ1dGUgb24gYW4gZWxlbWVudC5cbiAqIFVzZWQgZm9yIGF0dHJpYnV0ZXMgc3VjaCBhcyBhcmlhLWxhYmVsbGVkYnksIGFyaWEtb3ducywgZXRjLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkQXJpYVJlZmVyZW5jZWRJZChlbDogRWxlbWVudCwgYXR0cjogc3RyaW5nLCBpZDogc3RyaW5nKSB7XG4gIGNvbnN0IGlkcyA9IGdldEFyaWFSZWZlcmVuY2VJZHMoZWwsIGF0dHIpO1xuICBpZiAoaWRzLnNvbWUoZXhpc3RpbmdJZCA9PiBleGlzdGluZ0lkLnRyaW0oKSA9PSBpZC50cmltKCkpKSB7IHJldHVybjsgfVxuICBpZHMucHVzaChpZC50cmltKCkpO1xuXG4gIGVsLnNldEF0dHJpYnV0ZShhdHRyLCBpZHMuam9pbihJRF9ERUxJTUlOQVRPUikpO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgdGhlIGdpdmVuIElEIGZyb20gdGhlIHNwZWNpZmllZCBBUklBIGF0dHJpYnV0ZSBvbiBhbiBlbGVtZW50LlxuICogVXNlZCBmb3IgYXR0cmlidXRlcyBzdWNoIGFzIGFyaWEtbGFiZWxsZWRieSwgYXJpYS1vd25zLCBldGMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVBcmlhUmVmZXJlbmNlZElkKGVsOiBFbGVtZW50LCBhdHRyOiBzdHJpbmcsIGlkOiBzdHJpbmcpIHtcbiAgY29uc3QgaWRzID0gZ2V0QXJpYVJlZmVyZW5jZUlkcyhlbCwgYXR0cik7XG4gIGNvbnN0IGZpbHRlcmVkSWRzID0gaWRzLmZpbHRlcih2YWwgPT4gdmFsICE9IGlkLnRyaW0oKSk7XG5cbiAgaWYgKGZpbHRlcmVkSWRzLmxlbmd0aCkge1xuICAgIGVsLnNldEF0dHJpYnV0ZShhdHRyLCBmaWx0ZXJlZElkcy5qb2luKElEX0RFTElNSU5BVE9SKSk7XG4gIH0gZWxzZSB7XG4gICAgZWwucmVtb3ZlQXR0cmlidXRlKGF0dHIpO1xuICB9XG59XG5cbi8qKlxuICogR2V0cyB0aGUgbGlzdCBvZiBJRHMgcmVmZXJlbmNlZCBieSB0aGUgZ2l2ZW4gQVJJQSBhdHRyaWJ1dGUgb24gYW4gZWxlbWVudC5cbiAqIFVzZWQgZm9yIGF0dHJpYnV0ZXMgc3VjaCBhcyBhcmlhLWxhYmVsbGVkYnksIGFyaWEtb3ducywgZXRjLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QXJpYVJlZmVyZW5jZUlkcyhlbDogRWxlbWVudCwgYXR0cjogc3RyaW5nKTogc3RyaW5nW10ge1xuICAvLyBHZXQgc3RyaW5nIGFycmF5IG9mIGFsbCBpbmRpdmlkdWFsIGlkcyAod2hpdGVzcGFjZSBkZWxpbWluYXRlZCkgaW4gdGhlIGF0dHJpYnV0ZSB2YWx1ZVxuICByZXR1cm4gKGVsLmdldEF0dHJpYnV0ZShhdHRyKSB8fCAnJykubWF0Y2goL1xcUysvZykgfHwgW107XG59XG4iXX0=