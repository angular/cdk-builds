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
 * Extended CSSStyleDeclaration that includes a couple of drag-related
 * properties that aren't in the built-in TS typings.
 * @record
 */
function DragCSSStyleDeclaration() { }
if (false) {
    /** @type {?} */
    DragCSSStyleDeclaration.prototype.webkitUserDrag;
    /** @type {?} */
    DragCSSStyleDeclaration.prototype.MozUserSelect;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1zdHlsaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZHJhZy1zdHlsaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkEsc0NBR0M7OztJQUZDLGlEQUF1Qjs7SUFDdkIsZ0RBQXNCOzs7Ozs7Ozs7QUFPeEIsTUFBTSxVQUFVLFlBQVksQ0FDeEIsSUFBb0MsRUFDcEMsTUFBd0M7SUFDMUMsS0FBSyxJQUFJLEdBQUcsSUFBSSxNQUFNLEVBQUU7UUFDdEIsSUFBSSxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQzlCLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxtQkFBQSxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUMsQ0FBQztTQUMxQjtLQUNGO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDOzs7Ozs7OztBQVNELE1BQU0sVUFBVSw0QkFBNEIsQ0FBQyxPQUFvQixFQUFFLE1BQWU7O1VBQzFFLFVBQVUsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTTtJQUV2QyxZQUFZLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRTtRQUMxQixXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU07UUFDakMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNO1FBQ3BDLHVCQUF1QixFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxhQUFhO1FBQ3BELFVBQVUsRUFBRSxVQUFVO1FBQ3RCLFlBQVksRUFBRSxVQUFVO1FBQ3hCLGdCQUFnQixFQUFFLFVBQVU7UUFDNUIsYUFBYSxFQUFFLFVBQVU7S0FDMUIsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5cbi8vIEhlbHBlciB0eXBlIHRoYXQgaWdub3JlcyBgcmVhZG9ubHlgIHByb3BlcnRpZXMuIFRoaXMgaXMgdXNlZCBpblxuLy8gYGV4dGVuZFN0eWxlc2AgdG8gaWdub3JlIHRoZSByZWFkb25seSBwcm9wZXJ0aWVzIG9uIENTU1N0eWxlRGVjbGFyYXRpb25cbi8vIHNpbmNlIHdlIHdvbid0IGJlIHRvdWNoaW5nIHRob3NlIGFueXdheS5cbnR5cGUgV3JpdGVhYmxlPFQ+ID0geyAtcmVhZG9ubHkgW1AgaW4ga2V5b2YgVF0tPzogVFtQXSB9O1xuXG4vKipcbiAqIEV4dGVuZGVkIENTU1N0eWxlRGVjbGFyYXRpb24gdGhhdCBpbmNsdWRlcyBhIGNvdXBsZSBvZiBkcmFnLXJlbGF0ZWRcbiAqIHByb3BlcnRpZXMgdGhhdCBhcmVuJ3QgaW4gdGhlIGJ1aWx0LWluIFRTIHR5cGluZ3MuXG4gKi9cbmludGVyZmFjZSBEcmFnQ1NTU3R5bGVEZWNsYXJhdGlvbiBleHRlbmRzIENTU1N0eWxlRGVjbGFyYXRpb24ge1xuICB3ZWJraXRVc2VyRHJhZzogc3RyaW5nO1xuICBNb3pVc2VyU2VsZWN0OiBzdHJpbmc7IC8vIEZvciBzb21lIHJlYXNvbiB0aGUgRmlyZWZveCBwcm9wZXJ0eSBpcyBpbiBQYXNjYWxDYXNlLlxufVxuXG4vKipcbiAqIFNoYWxsb3ctZXh0ZW5kcyBhIHN0eWxlc2hlZXQgb2JqZWN0IHdpdGggYW5vdGhlciBzdHlsZXNoZWV0IG9iamVjdC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dGVuZFN0eWxlcyhcbiAgICBkZXN0OiBXcml0ZWFibGU8Q1NTU3R5bGVEZWNsYXJhdGlvbj4sXG4gICAgc291cmNlOiBQYXJ0aWFsPERyYWdDU1NTdHlsZURlY2xhcmF0aW9uPikge1xuICBmb3IgKGxldCBrZXkgaW4gc291cmNlKSB7XG4gICAgaWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICBkZXN0W2tleV0gPSBzb3VyY2Vba2V5XSE7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGRlc3Q7XG59XG5cblxuLyoqXG4gKiBUb2dnbGVzIHdoZXRoZXIgdGhlIG5hdGl2ZSBkcmFnIGludGVyYWN0aW9ucyBzaG91bGQgYmUgZW5hYmxlZCBmb3IgYW4gZWxlbWVudC5cbiAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgb24gd2hpY2ggdG8gdG9nZ2xlIHRoZSBkcmFnIGludGVyYWN0aW9ucy5cbiAqIEBwYXJhbSBlbmFibGUgV2hldGhlciB0aGUgZHJhZyBpbnRlcmFjdGlvbnMgc2hvdWxkIGJlIGVuYWJsZWQuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBlbmFibGU6IGJvb2xlYW4pIHtcbiAgY29uc3QgdXNlclNlbGVjdCA9IGVuYWJsZSA/ICcnIDogJ25vbmUnO1xuXG4gIGV4dGVuZFN0eWxlcyhlbGVtZW50LnN0eWxlLCB7XG4gICAgdG91Y2hBY3Rpb246IGVuYWJsZSA/ICcnIDogJ25vbmUnLFxuICAgIHdlYmtpdFVzZXJEcmFnOiBlbmFibGUgPyAnJyA6ICdub25lJyxcbiAgICB3ZWJraXRUYXBIaWdobGlnaHRDb2xvcjogZW5hYmxlID8gJycgOiAndHJhbnNwYXJlbnQnLFxuICAgIHVzZXJTZWxlY3Q6IHVzZXJTZWxlY3QsXG4gICAgbXNVc2VyU2VsZWN0OiB1c2VyU2VsZWN0LFxuICAgIHdlYmtpdFVzZXJTZWxlY3Q6IHVzZXJTZWxlY3QsXG4gICAgTW96VXNlclNlbGVjdDogdXNlclNlbGVjdFxuICB9KTtcbn1cbiJdfQ==