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
/**
 * @param {?} value
 * @param {?=} fallbackValue
 * @return {?}
 */
export function coerceNumberProperty(value, fallbackValue = 0) {
    return _isNumberValue(value) ? Number(value) : fallbackValue;
}
/**
 * Whether the provided value is considered a number.
 * \@docs-private
 * @param {?} value
 * @return {?}
 */
export function _isNumberValue(value) {
    // parseFloat(value) handles most of the cases we're interested in (it treats null, empty string,
    // and other non-number values as NaN, where Number just uses 0) but it considers the string
    // '123hello' to be a valid number. Therefore we also check if Number(value) is NaN.
    return !isNaN(parseFloat((/** @type {?} */ (value)))) && !isNaN(Number(value));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVtYmVyLXByb3BlcnR5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9jb2VyY2lvbi9udW1iZXItcHJvcGVydHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQVdBLE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxLQUFVLEVBQUUsYUFBYSxHQUFHLENBQUM7SUFDaEUsT0FBTyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDO0FBQy9ELENBQUM7Ozs7Ozs7QUFNRCxNQUFNLFVBQVUsY0FBYyxDQUFDLEtBQVU7SUFDdkMsaUdBQWlHO0lBQ2pHLDRGQUE0RjtJQUM1RixvRkFBb0Y7SUFDcEYsT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsbUJBQUEsS0FBSyxFQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ25FLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqIENvZXJjZXMgYSBkYXRhLWJvdW5kIHZhbHVlICh0eXBpY2FsbHkgYSBzdHJpbmcpIHRvIGEgbnVtYmVyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvZXJjZU51bWJlclByb3BlcnR5KHZhbHVlOiBhbnkpOiBudW1iZXI7XG5leHBvcnQgZnVuY3Rpb24gY29lcmNlTnVtYmVyUHJvcGVydHk8RD4odmFsdWU6IGFueSwgZmFsbGJhY2s6IEQpOiBudW1iZXIgfCBEO1xuZXhwb3J0IGZ1bmN0aW9uIGNvZXJjZU51bWJlclByb3BlcnR5KHZhbHVlOiBhbnksIGZhbGxiYWNrVmFsdWUgPSAwKSB7XG4gIHJldHVybiBfaXNOdW1iZXJWYWx1ZSh2YWx1ZSkgPyBOdW1iZXIodmFsdWUpIDogZmFsbGJhY2tWYWx1ZTtcbn1cblxuLyoqXG4gKiBXaGV0aGVyIHRoZSBwcm92aWRlZCB2YWx1ZSBpcyBjb25zaWRlcmVkIGEgbnVtYmVyLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gX2lzTnVtYmVyVmFsdWUodmFsdWU6IGFueSk6IGJvb2xlYW4ge1xuICAvLyBwYXJzZUZsb2F0KHZhbHVlKSBoYW5kbGVzIG1vc3Qgb2YgdGhlIGNhc2VzIHdlJ3JlIGludGVyZXN0ZWQgaW4gKGl0IHRyZWF0cyBudWxsLCBlbXB0eSBzdHJpbmcsXG4gIC8vIGFuZCBvdGhlciBub24tbnVtYmVyIHZhbHVlcyBhcyBOYU4sIHdoZXJlIE51bWJlciBqdXN0IHVzZXMgMCkgYnV0IGl0IGNvbnNpZGVycyB0aGUgc3RyaW5nXG4gIC8vICcxMjNoZWxsbycgdG8gYmUgYSB2YWxpZCBudW1iZXIuIFRoZXJlZm9yZSB3ZSBhbHNvIGNoZWNrIGlmIE51bWJlcih2YWx1ZSkgaXMgTmFOLlxuICByZXR1cm4gIWlzTmFOKHBhcnNlRmxvYXQodmFsdWUgYXMgYW55KSkgJiYgIWlzTmFOKE51bWJlcih2YWx1ZSkpO1xufVxuIl19