/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Shallow-extends a stylesheet object with another stylesheet-like object.
 * Note that the keys in `source` have to be dash-cased.
 * @docs-private
 */
export function extendStyles(dest, source, importantProperties) {
    for (let key in source) {
        if (source.hasOwnProperty(key)) {
            const value = source[key];
            if (value) {
                dest.setProperty(key, value, importantProperties?.has(key) ? 'important' : '');
            }
            else {
                dest.removeProperty(key);
            }
        }
    }
    return dest;
}
/**
 * Toggles whether the native drag interactions should be enabled for an element.
 * @param element Element on which to toggle the drag interactions.
 * @param enable Whether the drag interactions should be enabled.
 * @docs-private
 */
export function toggleNativeDragInteractions(element, enable) {
    const userSelect = enable ? '' : 'none';
    extendStyles(element.style, {
        'touch-action': enable ? '' : 'none',
        '-webkit-user-drag': enable ? '' : 'none',
        '-webkit-tap-highlight-color': enable ? '' : 'transparent',
        'user-select': userSelect,
        '-ms-user-select': userSelect,
        '-webkit-user-select': userSelect,
        '-moz-user-select': userSelect
    });
}
/**
 * Toggles whether an element is visible while preserving its dimensions.
 * @param element Element whose visibility to toggle
 * @param enable Whether the element should be visible.
 * @param importantProperties Properties to be set as `!important`.
 * @docs-private
 */
export function toggleVisibility(element, enable, importantProperties) {
    extendStyles(element.style, {
        position: enable ? '' : 'fixed',
        top: enable ? '' : '0',
        opacity: enable ? '' : '0',
        left: enable ? '' : '-999em'
    }, importantProperties);
}
/**
 * Combines a transform string with an optional other transform
 * that exited before the base transform was applied.
 */
export function combineTransforms(transform, initialTransform) {
    return initialTransform && initialTransform != 'none' ?
        (transform + ' ' + initialTransform) :
        transform;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1zdHlsaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZHJhZy1zdHlsaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQVdIOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsWUFBWSxDQUFDLElBQXlCLEVBQ3pCLE1BQThCLEVBQzlCLG1CQUFpQztJQUM1RCxLQUFLLElBQUksR0FBRyxJQUFJLE1BQU0sRUFBRTtRQUN0QixJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDOUIsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRTFCLElBQUksS0FBSyxFQUFFO2dCQUNULElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxtQkFBbUIsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7YUFDaEY7aUJBQU07Z0JBQ0wsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUMxQjtTQUNGO0tBQ0Y7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFHRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSw0QkFBNEIsQ0FBQyxPQUFvQixFQUFFLE1BQWU7SUFDaEYsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUV4QyxZQUFZLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRTtRQUMxQixjQUFjLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU07UUFDcEMsbUJBQW1CLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU07UUFDekMsNkJBQTZCLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGFBQWE7UUFDMUQsYUFBYSxFQUFFLFVBQVU7UUFDekIsaUJBQWlCLEVBQUUsVUFBVTtRQUM3QixxQkFBcUIsRUFBRSxVQUFVO1FBQ2pDLGtCQUFrQixFQUFFLFVBQVU7S0FDL0IsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVEOzs7Ozs7R0FNRztBQUNILE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxPQUFvQixFQUNwQixNQUFlLEVBQ2YsbUJBQWlDO0lBQ2hFLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFO1FBQzFCLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTztRQUMvQixHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUc7UUFDdEIsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHO1FBQzFCLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUTtLQUM3QixFQUFFLG1CQUFtQixDQUFDLENBQUM7QUFDMUIsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxTQUFpQixFQUFFLGdCQUF5QjtJQUM1RSxPQUFPLGdCQUFnQixJQUFJLGdCQUFnQixJQUFJLE1BQU0sQ0FBQyxDQUFDO1FBQ25ELENBQUMsU0FBUyxHQUFHLEdBQUcsR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7UUFDdEMsU0FBUyxDQUFDO0FBQ2hCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqXG4gKiBFeHRlbmRlZCBDU1NTdHlsZURlY2xhcmF0aW9uIHRoYXQgaW5jbHVkZXMgYSBjb3VwbGUgb2YgZHJhZy1yZWxhdGVkXG4gKiBwcm9wZXJ0aWVzIHRoYXQgYXJlbid0IGluIHRoZSBidWlsdC1pbiBUUyB0eXBpbmdzLlxuICovXG4gZXhwb3J0IGludGVyZmFjZSBEcmFnQ1NTU3R5bGVEZWNsYXJhdGlvbiBleHRlbmRzIENTU1N0eWxlRGVjbGFyYXRpb24ge1xuICBtc1Njcm9sbFNuYXBUeXBlOiBzdHJpbmc7XG4gIHNjcm9sbFNuYXBUeXBlOiBzdHJpbmc7XG59XG5cbi8qKlxuICogU2hhbGxvdy1leHRlbmRzIGEgc3R5bGVzaGVldCBvYmplY3Qgd2l0aCBhbm90aGVyIHN0eWxlc2hlZXQtbGlrZSBvYmplY3QuXG4gKiBOb3RlIHRoYXQgdGhlIGtleXMgaW4gYHNvdXJjZWAgaGF2ZSB0byBiZSBkYXNoLWNhc2VkLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0ZW5kU3R5bGVzKGRlc3Q6IENTU1N0eWxlRGVjbGFyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogUmVjb3JkPHN0cmluZywgc3RyaW5nPixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0YW50UHJvcGVydGllcz86IFNldDxzdHJpbmc+KSB7XG4gIGZvciAobGV0IGtleSBpbiBzb3VyY2UpIHtcbiAgICBpZiAoc291cmNlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gc291cmNlW2tleV07XG5cbiAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICBkZXN0LnNldFByb3BlcnR5KGtleSwgdmFsdWUsIGltcG9ydGFudFByb3BlcnRpZXM/LmhhcyhrZXkpID8gJ2ltcG9ydGFudCcgOiAnJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZXN0LnJlbW92ZVByb3BlcnR5KGtleSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGRlc3Q7XG59XG5cblxuLyoqXG4gKiBUb2dnbGVzIHdoZXRoZXIgdGhlIG5hdGl2ZSBkcmFnIGludGVyYWN0aW9ucyBzaG91bGQgYmUgZW5hYmxlZCBmb3IgYW4gZWxlbWVudC5cbiAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgb24gd2hpY2ggdG8gdG9nZ2xlIHRoZSBkcmFnIGludGVyYWN0aW9ucy5cbiAqIEBwYXJhbSBlbmFibGUgV2hldGhlciB0aGUgZHJhZyBpbnRlcmFjdGlvbnMgc2hvdWxkIGJlIGVuYWJsZWQuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBlbmFibGU6IGJvb2xlYW4pIHtcbiAgY29uc3QgdXNlclNlbGVjdCA9IGVuYWJsZSA/ICcnIDogJ25vbmUnO1xuXG4gIGV4dGVuZFN0eWxlcyhlbGVtZW50LnN0eWxlLCB7XG4gICAgJ3RvdWNoLWFjdGlvbic6IGVuYWJsZSA/ICcnIDogJ25vbmUnLFxuICAgICctd2Via2l0LXVzZXItZHJhZyc6IGVuYWJsZSA/ICcnIDogJ25vbmUnLFxuICAgICctd2Via2l0LXRhcC1oaWdobGlnaHQtY29sb3InOiBlbmFibGUgPyAnJyA6ICd0cmFuc3BhcmVudCcsXG4gICAgJ3VzZXItc2VsZWN0JzogdXNlclNlbGVjdCxcbiAgICAnLW1zLXVzZXItc2VsZWN0JzogdXNlclNlbGVjdCxcbiAgICAnLXdlYmtpdC11c2VyLXNlbGVjdCc6IHVzZXJTZWxlY3QsXG4gICAgJy1tb3otdXNlci1zZWxlY3QnOiB1c2VyU2VsZWN0XG4gIH0pO1xufVxuXG4vKipcbiAqIFRvZ2dsZXMgd2hldGhlciBhbiBlbGVtZW50IGlzIHZpc2libGUgd2hpbGUgcHJlc2VydmluZyBpdHMgZGltZW5zaW9ucy5cbiAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgd2hvc2UgdmlzaWJpbGl0eSB0byB0b2dnbGVcbiAqIEBwYXJhbSBlbmFibGUgV2hldGhlciB0aGUgZWxlbWVudCBzaG91bGQgYmUgdmlzaWJsZS5cbiAqIEBwYXJhbSBpbXBvcnRhbnRQcm9wZXJ0aWVzIFByb3BlcnRpZXMgdG8gYmUgc2V0IGFzIGAhaW1wb3J0YW50YC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvZ2dsZVZpc2liaWxpdHkoZWxlbWVudDogSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmFibGU6IGJvb2xlYW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnRhbnRQcm9wZXJ0aWVzPzogU2V0PHN0cmluZz4pIHtcbiAgZXh0ZW5kU3R5bGVzKGVsZW1lbnQuc3R5bGUsIHtcbiAgICBwb3NpdGlvbjogZW5hYmxlID8gJycgOiAnZml4ZWQnLFxuICAgIHRvcDogZW5hYmxlID8gJycgOiAnMCcsXG4gICAgb3BhY2l0eTogZW5hYmxlID8gJycgOiAnMCcsXG4gICAgbGVmdDogZW5hYmxlID8gJycgOiAnLTk5OWVtJ1xuICB9LCBpbXBvcnRhbnRQcm9wZXJ0aWVzKTtcbn1cblxuLyoqXG4gKiBDb21iaW5lcyBhIHRyYW5zZm9ybSBzdHJpbmcgd2l0aCBhbiBvcHRpb25hbCBvdGhlciB0cmFuc2Zvcm1cbiAqIHRoYXQgZXhpdGVkIGJlZm9yZSB0aGUgYmFzZSB0cmFuc2Zvcm0gd2FzIGFwcGxpZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21iaW5lVHJhbnNmb3Jtcyh0cmFuc2Zvcm06IHN0cmluZywgaW5pdGlhbFRyYW5zZm9ybT86IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpbml0aWFsVHJhbnNmb3JtICYmIGluaXRpYWxUcmFuc2Zvcm0gIT0gJ25vbmUnID9cbiAgICAgICh0cmFuc2Zvcm0gKyAnICcgKyBpbml0aWFsVHJhbnNmb3JtKSA6XG4gICAgICB0cmFuc2Zvcm07XG59XG4iXX0=