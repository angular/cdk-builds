/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/drag-drop/drag-styling.ts
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
 * Extended CSSStyleDeclaration that includes a couple of drag-related
 * properties that aren't in the built-in TS typings.
 * @record
 */
export function DragCSSStyleDeclaration() { }
if (false) {
    /** @type {?} */
    DragCSSStyleDeclaration.prototype.webkitUserDrag;
    /** @type {?} */
    DragCSSStyleDeclaration.prototype.MozUserSelect;
    /** @type {?} */
    DragCSSStyleDeclaration.prototype.msScrollSnapType;
    /** @type {?} */
    DragCSSStyleDeclaration.prototype.scrollSnapType;
    /** @type {?} */
    DragCSSStyleDeclaration.prototype.msUserSelect;
}
/**
 * Shallow-extends a stylesheet object with another stylesheet object.
 * \@docs-private
 * @param {?} dest
 * @param {?} source
 * @return {?}
 */
export function extendStyles(dest, source) {
    for (let key in source) {
        if (source.hasOwnProperty(key)) {
            dest[key] = (/** @type {?} */ (source[key]));
        }
    }
    return dest;
}
/**
 * Toggles whether the native drag interactions should be enabled for an element.
 * \@docs-private
 * @param {?} element Element on which to toggle the drag interactions.
 * @param {?} enable Whether the drag interactions should be enabled.
 * @return {?}
 */
export function toggleNativeDragInteractions(element, enable) {
    /** @type {?} */
    const userSelect = enable ? '' : 'none';
    extendStyles(element.style, {
        touchAction: enable ? '' : 'none',
        webkitUserDrag: enable ? '' : 'none',
        webkitTapHighlightColor: enable ? '' : 'transparent',
        userSelect: userSelect,
        msUserSelect: userSelect,
        webkitUserSelect: userSelect,
        MozUserSelect: userSelect
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1zdHlsaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZHJhZy1zdHlsaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBLDZDQU1DOzs7SUFMQyxpREFBdUI7O0lBQ3ZCLGdEQUFzQjs7SUFDdEIsbURBQXlCOztJQUN6QixpREFBdUI7O0lBQ3ZCLCtDQUFxQjs7Ozs7Ozs7O0FBT3ZCLE1BQU0sVUFBVSxZQUFZLENBQ3hCLElBQW9DLEVBQ3BDLE1BQXdDO0lBQzFDLEtBQUssSUFBSSxHQUFHLElBQUksTUFBTSxFQUFFO1FBQ3RCLElBQUksTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUM5QixJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsbUJBQUEsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFDLENBQUM7U0FDMUI7S0FDRjtJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQzs7Ozs7Ozs7QUFTRCxNQUFNLFVBQVUsNEJBQTRCLENBQUMsT0FBb0IsRUFBRSxNQUFlOztVQUMxRSxVQUFVLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU07SUFFdkMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUU7UUFDMUIsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNO1FBQ2pDLGNBQWMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTTtRQUNwQyx1QkFBdUIsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsYUFBYTtRQUNwRCxVQUFVLEVBQUUsVUFBVTtRQUN0QixZQUFZLEVBQUUsVUFBVTtRQUN4QixnQkFBZ0IsRUFBRSxVQUFVO1FBQzVCLGFBQWEsRUFBRSxVQUFVO0tBQzFCLENBQUMsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuXG4vLyBIZWxwZXIgdHlwZSB0aGF0IGlnbm9yZXMgYHJlYWRvbmx5YCBwcm9wZXJ0aWVzLiBUaGlzIGlzIHVzZWQgaW5cbi8vIGBleHRlbmRTdHlsZXNgIHRvIGlnbm9yZSB0aGUgcmVhZG9ubHkgcHJvcGVydGllcyBvbiBDU1NTdHlsZURlY2xhcmF0aW9uXG4vLyBzaW5jZSB3ZSB3b24ndCBiZSB0b3VjaGluZyB0aG9zZSBhbnl3YXkuXG50eXBlIFdyaXRlYWJsZTxUPiA9IHsgLXJlYWRvbmx5IFtQIGluIGtleW9mIFRdLT86IFRbUF0gfTtcblxuLyoqXG4gKiBFeHRlbmRlZCBDU1NTdHlsZURlY2xhcmF0aW9uIHRoYXQgaW5jbHVkZXMgYSBjb3VwbGUgb2YgZHJhZy1yZWxhdGVkXG4gKiBwcm9wZXJ0aWVzIHRoYXQgYXJlbid0IGluIHRoZSBidWlsdC1pbiBUUyB0eXBpbmdzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERyYWdDU1NTdHlsZURlY2xhcmF0aW9uIGV4dGVuZHMgQ1NTU3R5bGVEZWNsYXJhdGlvbiB7XG4gIHdlYmtpdFVzZXJEcmFnOiBzdHJpbmc7XG4gIE1velVzZXJTZWxlY3Q6IHN0cmluZzsgLy8gRm9yIHNvbWUgcmVhc29uIHRoZSBGaXJlZm94IHByb3BlcnR5IGlzIGluIFBhc2NhbENhc2UuXG4gIG1zU2Nyb2xsU25hcFR5cGU6IHN0cmluZztcbiAgc2Nyb2xsU25hcFR5cGU6IHN0cmluZztcbiAgbXNVc2VyU2VsZWN0OiBzdHJpbmc7XG59XG5cbi8qKlxuICogU2hhbGxvdy1leHRlbmRzIGEgc3R5bGVzaGVldCBvYmplY3Qgd2l0aCBhbm90aGVyIHN0eWxlc2hlZXQgb2JqZWN0LlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0ZW5kU3R5bGVzKFxuICAgIGRlc3Q6IFdyaXRlYWJsZTxDU1NTdHlsZURlY2xhcmF0aW9uPixcbiAgICBzb3VyY2U6IFBhcnRpYWw8RHJhZ0NTU1N0eWxlRGVjbGFyYXRpb24+KSB7XG4gIGZvciAobGV0IGtleSBpbiBzb3VyY2UpIHtcbiAgICBpZiAoc291cmNlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIGRlc3Rba2V5XSA9IHNvdXJjZVtrZXldITtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZGVzdDtcbn1cblxuXG4vKipcbiAqIFRvZ2dsZXMgd2hldGhlciB0aGUgbmF0aXZlIGRyYWcgaW50ZXJhY3Rpb25zIHNob3VsZCBiZSBlbmFibGVkIGZvciBhbiBlbGVtZW50LlxuICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCBvbiB3aGljaCB0byB0b2dnbGUgdGhlIGRyYWcgaW50ZXJhY3Rpb25zLlxuICogQHBhcmFtIGVuYWJsZSBXaGV0aGVyIHRoZSBkcmFnIGludGVyYWN0aW9ucyBzaG91bGQgYmUgZW5hYmxlZC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMoZWxlbWVudDogSFRNTEVsZW1lbnQsIGVuYWJsZTogYm9vbGVhbikge1xuICBjb25zdCB1c2VyU2VsZWN0ID0gZW5hYmxlID8gJycgOiAnbm9uZSc7XG5cbiAgZXh0ZW5kU3R5bGVzKGVsZW1lbnQuc3R5bGUsIHtcbiAgICB0b3VjaEFjdGlvbjogZW5hYmxlID8gJycgOiAnbm9uZScsXG4gICAgd2Via2l0VXNlckRyYWc6IGVuYWJsZSA/ICcnIDogJ25vbmUnLFxuICAgIHdlYmtpdFRhcEhpZ2hsaWdodENvbG9yOiBlbmFibGUgPyAnJyA6ICd0cmFuc3BhcmVudCcsXG4gICAgdXNlclNlbGVjdDogdXNlclNlbGVjdCxcbiAgICBtc1VzZXJTZWxlY3Q6IHVzZXJTZWxlY3QsXG4gICAgd2Via2l0VXNlclNlbGVjdDogdXNlclNlbGVjdCxcbiAgICBNb3pVc2VyU2VsZWN0OiB1c2VyU2VsZWN0XG4gIH0pO1xufVxuIl19