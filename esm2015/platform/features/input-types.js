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
 * Cached result Set of input types support by the current browser.
 * @type {?}
 */
let supportedInputTypes;
/**
 * Types of `<input>` that *might* be supported.
 * @type {?}
 */
const candidateInputTypes = [
    // `color` must come first. Chrome 56 shows a warning if we change the type to `color` after
    // first changing it to something else:
    // The specified value "" does not conform to the required format.
    // The format is "#rrggbb" where rr, gg, bb are two-digit hexadecimal numbers.
    'color',
    'button',
    'checkbox',
    'date',
    'datetime-local',
    'email',
    'file',
    'hidden',
    'image',
    'month',
    'number',
    'password',
    'radio',
    'range',
    'reset',
    'search',
    'submit',
    'tel',
    'text',
    'time',
    'url',
    'week',
];
/**
 * @return {?} The input types supported by this browser.
 */
export function getSupportedInputTypes() {
    // Result is cached.
    if (supportedInputTypes) {
        return supportedInputTypes;
    }
    // We can't check if an input type is not supported until we're on the browser, so say that
    // everything is supported when not on the browser. We don't use `Platform` here since it's
    // just a helper function and can't inject it.
    if (typeof document !== 'object' || !document) {
        supportedInputTypes = new Set(candidateInputTypes);
        return supportedInputTypes;
    }
    /** @type {?} */
    let featureTestInput = document.createElement('input');
    supportedInputTypes = new Set(candidateInputTypes.filter((/**
     * @param {?} value
     * @return {?}
     */
    value => {
        featureTestInput.setAttribute('type', value);
        return featureTestInput.type === value;
    })));
    return supportedInputTypes;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXQtdHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3BsYXRmb3JtL2ZlYXR1cmVzL2lucHV0LXR5cGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztJQVNJLG1CQUFnQzs7Ozs7TUFHOUIsbUJBQW1CLEdBQUc7SUFDMUIsNEZBQTRGO0lBQzVGLHVDQUF1QztJQUN2QyxrRUFBa0U7SUFDbEUsOEVBQThFO0lBQzlFLE9BQU87SUFDUCxRQUFRO0lBQ1IsVUFBVTtJQUNWLE1BQU07SUFDTixnQkFBZ0I7SUFDaEIsT0FBTztJQUNQLE1BQU07SUFDTixRQUFRO0lBQ1IsT0FBTztJQUNQLE9BQU87SUFDUCxRQUFRO0lBQ1IsVUFBVTtJQUNWLE9BQU87SUFDUCxPQUFPO0lBQ1AsT0FBTztJQUNQLFFBQVE7SUFDUixRQUFRO0lBQ1IsS0FBSztJQUNMLE1BQU07SUFDTixNQUFNO0lBQ04sS0FBSztJQUNMLE1BQU07Q0FDUDs7OztBQUdELE1BQU0sVUFBVSxzQkFBc0I7SUFDcEMsb0JBQW9CO0lBQ3BCLElBQUksbUJBQW1CLEVBQUU7UUFDdkIsT0FBTyxtQkFBbUIsQ0FBQztLQUM1QjtJQUVELDJGQUEyRjtJQUMzRiwyRkFBMkY7SUFDM0YsOENBQThDO0lBQzlDLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxJQUFJLENBQUMsUUFBUSxFQUFFO1FBQzdDLG1CQUFtQixHQUFHLElBQUksR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDbkQsT0FBTyxtQkFBbUIsQ0FBQztLQUM1Qjs7UUFFRyxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQztJQUN0RCxtQkFBbUIsR0FBRyxJQUFJLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNOzs7O0lBQUMsS0FBSyxDQUFDLEVBQUU7UUFDL0QsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM3QyxPQUFPLGdCQUFnQixDQUFDLElBQUksS0FBSyxLQUFLLENBQUM7SUFDekMsQ0FBQyxFQUFDLENBQUMsQ0FBQztJQUVKLE9BQU8sbUJBQW1CLENBQUM7QUFDN0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKiogQ2FjaGVkIHJlc3VsdCBTZXQgb2YgaW5wdXQgdHlwZXMgc3VwcG9ydCBieSB0aGUgY3VycmVudCBicm93c2VyLiAqL1xubGV0IHN1cHBvcnRlZElucHV0VHlwZXM6IFNldDxzdHJpbmc+O1xuXG4vKiogVHlwZXMgb2YgYDxpbnB1dD5gIHRoYXQgKm1pZ2h0KiBiZSBzdXBwb3J0ZWQuICovXG5jb25zdCBjYW5kaWRhdGVJbnB1dFR5cGVzID0gW1xuICAvLyBgY29sb3JgIG11c3QgY29tZSBmaXJzdC4gQ2hyb21lIDU2IHNob3dzIGEgd2FybmluZyBpZiB3ZSBjaGFuZ2UgdGhlIHR5cGUgdG8gYGNvbG9yYCBhZnRlclxuICAvLyBmaXJzdCBjaGFuZ2luZyBpdCB0byBzb21ldGhpbmcgZWxzZTpcbiAgLy8gVGhlIHNwZWNpZmllZCB2YWx1ZSBcIlwiIGRvZXMgbm90IGNvbmZvcm0gdG8gdGhlIHJlcXVpcmVkIGZvcm1hdC5cbiAgLy8gVGhlIGZvcm1hdCBpcyBcIiNycmdnYmJcIiB3aGVyZSByciwgZ2csIGJiIGFyZSB0d28tZGlnaXQgaGV4YWRlY2ltYWwgbnVtYmVycy5cbiAgJ2NvbG9yJyxcbiAgJ2J1dHRvbicsXG4gICdjaGVja2JveCcsXG4gICdkYXRlJyxcbiAgJ2RhdGV0aW1lLWxvY2FsJyxcbiAgJ2VtYWlsJyxcbiAgJ2ZpbGUnLFxuICAnaGlkZGVuJyxcbiAgJ2ltYWdlJyxcbiAgJ21vbnRoJyxcbiAgJ251bWJlcicsXG4gICdwYXNzd29yZCcsXG4gICdyYWRpbycsXG4gICdyYW5nZScsXG4gICdyZXNldCcsXG4gICdzZWFyY2gnLFxuICAnc3VibWl0JyxcbiAgJ3RlbCcsXG4gICd0ZXh0JyxcbiAgJ3RpbWUnLFxuICAndXJsJyxcbiAgJ3dlZWsnLFxuXTtcblxuLyoqIEByZXR1cm5zIFRoZSBpbnB1dCB0eXBlcyBzdXBwb3J0ZWQgYnkgdGhpcyBicm93c2VyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFN1cHBvcnRlZElucHV0VHlwZXMoKTogU2V0PHN0cmluZz4ge1xuICAvLyBSZXN1bHQgaXMgY2FjaGVkLlxuICBpZiAoc3VwcG9ydGVkSW5wdXRUeXBlcykge1xuICAgIHJldHVybiBzdXBwb3J0ZWRJbnB1dFR5cGVzO1xuICB9XG5cbiAgLy8gV2UgY2FuJ3QgY2hlY2sgaWYgYW4gaW5wdXQgdHlwZSBpcyBub3Qgc3VwcG9ydGVkIHVudGlsIHdlJ3JlIG9uIHRoZSBicm93c2VyLCBzbyBzYXkgdGhhdFxuICAvLyBldmVyeXRoaW5nIGlzIHN1cHBvcnRlZCB3aGVuIG5vdCBvbiB0aGUgYnJvd3Nlci4gV2UgZG9uJ3QgdXNlIGBQbGF0Zm9ybWAgaGVyZSBzaW5jZSBpdCdzXG4gIC8vIGp1c3QgYSBoZWxwZXIgZnVuY3Rpb24gYW5kIGNhbid0IGluamVjdCBpdC5cbiAgaWYgKHR5cGVvZiBkb2N1bWVudCAhPT0gJ29iamVjdCcgfHwgIWRvY3VtZW50KSB7XG4gICAgc3VwcG9ydGVkSW5wdXRUeXBlcyA9IG5ldyBTZXQoY2FuZGlkYXRlSW5wdXRUeXBlcyk7XG4gICAgcmV0dXJuIHN1cHBvcnRlZElucHV0VHlwZXM7XG4gIH1cblxuICBsZXQgZmVhdHVyZVRlc3RJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gIHN1cHBvcnRlZElucHV0VHlwZXMgPSBuZXcgU2V0KGNhbmRpZGF0ZUlucHV0VHlwZXMuZmlsdGVyKHZhbHVlID0+IHtcbiAgICBmZWF0dXJlVGVzdElucHV0LnNldEF0dHJpYnV0ZSgndHlwZScsIHZhbHVlKTtcbiAgICByZXR1cm4gZmVhdHVyZVRlc3RJbnB1dC50eXBlID09PSB2YWx1ZTtcbiAgfSkpO1xuXG4gIHJldHVybiBzdXBwb3J0ZWRJbnB1dFR5cGVzO1xufVxuIl19