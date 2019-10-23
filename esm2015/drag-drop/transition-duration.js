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
 * Parses a CSS time value to milliseconds.
 * @param {?} value
 * @return {?}
 */
function parseCssTimeUnitsToMs(value) {
    // Some browsers will return it in seconds, whereas others will return milliseconds.
    /** @type {?} */
    const multiplier = value.toLowerCase().indexOf('ms') > -1 ? 1 : 1000;
    return parseFloat(value) * multiplier;
}
/**
 * Gets the transform transition duration, including the delay, of an element in milliseconds.
 * @param {?} element
 * @return {?}
 */
export function getTransformTransitionDurationInMs(element) {
    /** @type {?} */
    const computedStyle = getComputedStyle(element);
    /** @type {?} */
    const transitionedProperties = parseCssPropertyValue(computedStyle, 'transition-property');
    /** @type {?} */
    const property = transitionedProperties.find((/**
     * @param {?} prop
     * @return {?}
     */
    prop => prop === 'transform' || prop === 'all'));
    // If there's no transition for `all` or `transform`, we shouldn't do anything.
    if (!property) {
        return 0;
    }
    // Get the index of the property that we're interested in and match
    // it up to the same index in `transition-delay` and `transition-duration`.
    /** @type {?} */
    const propertyIndex = transitionedProperties.indexOf(property);
    /** @type {?} */
    const rawDurations = parseCssPropertyValue(computedStyle, 'transition-duration');
    /** @type {?} */
    const rawDelays = parseCssPropertyValue(computedStyle, 'transition-delay');
    return parseCssTimeUnitsToMs(rawDurations[propertyIndex]) +
        parseCssTimeUnitsToMs(rawDelays[propertyIndex]);
}
/**
 * Parses out multiple values from a computed style into an array.
 * @param {?} computedStyle
 * @param {?} name
 * @return {?}
 */
function parseCssPropertyValue(computedStyle, name) {
    /** @type {?} */
    const value = computedStyle.getPropertyValue(name);
    return value.split(',').map((/**
     * @param {?} part
     * @return {?}
     */
    part => part.trim()));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNpdGlvbi1kdXJhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL3RyYW5zaXRpb24tZHVyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQVNBLFNBQVMscUJBQXFCLENBQUMsS0FBYTs7O1VBRXBDLFVBQVUsR0FBRyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7SUFDcEUsT0FBTyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsVUFBVSxDQUFDO0FBQ3hDLENBQUM7Ozs7OztBQUdELE1BQU0sVUFBVSxrQ0FBa0MsQ0FBQyxPQUFvQjs7VUFDL0QsYUFBYSxHQUFHLGdCQUFnQixDQUFDLE9BQU8sQ0FBQzs7VUFDekMsc0JBQXNCLEdBQUcscUJBQXFCLENBQUMsYUFBYSxFQUFFLHFCQUFxQixDQUFDOztVQUNwRixRQUFRLEdBQUcsc0JBQXNCLENBQUMsSUFBSTs7OztJQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFLLFdBQVcsSUFBSSxJQUFJLEtBQUssS0FBSyxFQUFDO0lBRTVGLCtFQUErRTtJQUMvRSxJQUFJLENBQUMsUUFBUSxFQUFFO1FBQ2IsT0FBTyxDQUFDLENBQUM7S0FDVjs7OztVQUlLLGFBQWEsR0FBRyxzQkFBc0IsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDOztVQUN4RCxZQUFZLEdBQUcscUJBQXFCLENBQUMsYUFBYSxFQUFFLHFCQUFxQixDQUFDOztVQUMxRSxTQUFTLEdBQUcscUJBQXFCLENBQUMsYUFBYSxFQUFFLGtCQUFrQixDQUFDO0lBRTFFLE9BQU8scUJBQXFCLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ2xELHFCQUFxQixDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO0FBQ3pELENBQUM7Ozs7Ozs7QUFHRCxTQUFTLHFCQUFxQixDQUFDLGFBQWtDLEVBQUUsSUFBWTs7VUFDdkUsS0FBSyxHQUFHLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUM7SUFDbEQsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUc7Ozs7SUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBQyxDQUFDO0FBQ25ELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqIFBhcnNlcyBhIENTUyB0aW1lIHZhbHVlIHRvIG1pbGxpc2Vjb25kcy4gKi9cbmZ1bmN0aW9uIHBhcnNlQ3NzVGltZVVuaXRzVG9Ncyh2YWx1ZTogc3RyaW5nKTogbnVtYmVyIHtcbiAgLy8gU29tZSBicm93c2VycyB3aWxsIHJldHVybiBpdCBpbiBzZWNvbmRzLCB3aGVyZWFzIG90aGVycyB3aWxsIHJldHVybiBtaWxsaXNlY29uZHMuXG4gIGNvbnN0IG11bHRpcGxpZXIgPSB2YWx1ZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ21zJykgPiAtMSA/IDEgOiAxMDAwO1xuICByZXR1cm4gcGFyc2VGbG9hdCh2YWx1ZSkgKiBtdWx0aXBsaWVyO1xufVxuXG4vKiogR2V0cyB0aGUgdHJhbnNmb3JtIHRyYW5zaXRpb24gZHVyYXRpb24sIGluY2x1ZGluZyB0aGUgZGVsYXksIG9mIGFuIGVsZW1lbnQgaW4gbWlsbGlzZWNvbmRzLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRyYW5zZm9ybVRyYW5zaXRpb25EdXJhdGlvbkluTXMoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBudW1iZXIge1xuICBjb25zdCBjb21wdXRlZFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KTtcbiAgY29uc3QgdHJhbnNpdGlvbmVkUHJvcGVydGllcyA9IHBhcnNlQ3NzUHJvcGVydHlWYWx1ZShjb21wdXRlZFN0eWxlLCAndHJhbnNpdGlvbi1wcm9wZXJ0eScpO1xuICBjb25zdCBwcm9wZXJ0eSA9IHRyYW5zaXRpb25lZFByb3BlcnRpZXMuZmluZChwcm9wID0+IHByb3AgPT09ICd0cmFuc2Zvcm0nIHx8IHByb3AgPT09ICdhbGwnKTtcblxuICAvLyBJZiB0aGVyZSdzIG5vIHRyYW5zaXRpb24gZm9yIGBhbGxgIG9yIGB0cmFuc2Zvcm1gLCB3ZSBzaG91bGRuJ3QgZG8gYW55dGhpbmcuXG4gIGlmICghcHJvcGVydHkpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIC8vIEdldCB0aGUgaW5kZXggb2YgdGhlIHByb3BlcnR5IHRoYXQgd2UncmUgaW50ZXJlc3RlZCBpbiBhbmQgbWF0Y2hcbiAgLy8gaXQgdXAgdG8gdGhlIHNhbWUgaW5kZXggaW4gYHRyYW5zaXRpb24tZGVsYXlgIGFuZCBgdHJhbnNpdGlvbi1kdXJhdGlvbmAuXG4gIGNvbnN0IHByb3BlcnR5SW5kZXggPSB0cmFuc2l0aW9uZWRQcm9wZXJ0aWVzLmluZGV4T2YocHJvcGVydHkpO1xuICBjb25zdCByYXdEdXJhdGlvbnMgPSBwYXJzZUNzc1Byb3BlcnR5VmFsdWUoY29tcHV0ZWRTdHlsZSwgJ3RyYW5zaXRpb24tZHVyYXRpb24nKTtcbiAgY29uc3QgcmF3RGVsYXlzID0gcGFyc2VDc3NQcm9wZXJ0eVZhbHVlKGNvbXB1dGVkU3R5bGUsICd0cmFuc2l0aW9uLWRlbGF5Jyk7XG5cbiAgcmV0dXJuIHBhcnNlQ3NzVGltZVVuaXRzVG9NcyhyYXdEdXJhdGlvbnNbcHJvcGVydHlJbmRleF0pICtcbiAgICAgICAgIHBhcnNlQ3NzVGltZVVuaXRzVG9NcyhyYXdEZWxheXNbcHJvcGVydHlJbmRleF0pO1xufVxuXG4vKiogUGFyc2VzIG91dCBtdWx0aXBsZSB2YWx1ZXMgZnJvbSBhIGNvbXB1dGVkIHN0eWxlIGludG8gYW4gYXJyYXkuICovXG5mdW5jdGlvbiBwYXJzZUNzc1Byb3BlcnR5VmFsdWUoY29tcHV0ZWRTdHlsZTogQ1NTU3R5bGVEZWNsYXJhdGlvbiwgbmFtZTogc3RyaW5nKTogc3RyaW5nW10ge1xuICBjb25zdCB2YWx1ZSA9IGNvbXB1dGVkU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZShuYW1lKTtcbiAgcmV0dXJuIHZhbHVlLnNwbGl0KCcsJykubWFwKHBhcnQgPT4gcGFydC50cmltKCkpO1xufVxuIl19