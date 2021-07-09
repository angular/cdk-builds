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
                dest.setProperty(key, value, (importantProperties === null || importantProperties === void 0 ? void 0 : importantProperties.has(key)) ? 'important' : '');
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
    return initialTransform ? (transform + ' ' + initialTransform) : transform;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1zdHlsaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kcmFnLWRyb3AvZHJhZy1zdHlsaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQVdIOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsWUFBWSxDQUFDLElBQXlCLEVBQ3pCLE1BQThCLEVBQzlCLG1CQUFpQztJQUM1RCxLQUFLLElBQUksR0FBRyxJQUFJLE1BQU0sRUFBRTtRQUN0QixJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDOUIsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRTFCLElBQUksS0FBSyxFQUFFO2dCQUNULElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFBLG1CQUFtQixhQUFuQixtQkFBbUIsdUJBQW5CLG1CQUFtQixDQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUNoRjtpQkFBTTtnQkFDTCxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQzFCO1NBQ0Y7S0FDRjtJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUdEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLDRCQUE0QixDQUFDLE9BQW9CLEVBQUUsTUFBZTtJQUNoRixNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO0lBRXhDLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFO1FBQzFCLGNBQWMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTTtRQUNwQyxtQkFBbUIsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTTtRQUN6Qyw2QkFBNkIsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsYUFBYTtRQUMxRCxhQUFhLEVBQUUsVUFBVTtRQUN6QixpQkFBaUIsRUFBRSxVQUFVO1FBQzdCLHFCQUFxQixFQUFFLFVBQVU7UUFDakMsa0JBQWtCLEVBQUUsVUFBVTtLQUMvQixDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsTUFBTSxVQUFVLGdCQUFnQixDQUFDLE9BQW9CLEVBQ3BCLE1BQWUsRUFDZixtQkFBaUM7SUFDaEUsWUFBWSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUU7UUFDMUIsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPO1FBQy9CLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRztRQUN0QixPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUc7UUFDMUIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRO0tBQzdCLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztBQUMxQixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLGlCQUFpQixDQUFDLFNBQWlCLEVBQUUsZ0JBQXlCO0lBQzVFLE9BQU8sZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxHQUFHLEdBQUcsR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7QUFDN0UsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIEV4dGVuZGVkIENTU1N0eWxlRGVjbGFyYXRpb24gdGhhdCBpbmNsdWRlcyBhIGNvdXBsZSBvZiBkcmFnLXJlbGF0ZWRcbiAqIHByb3BlcnRpZXMgdGhhdCBhcmVuJ3QgaW4gdGhlIGJ1aWx0LWluIFRTIHR5cGluZ3MuXG4gKi9cbiBleHBvcnQgaW50ZXJmYWNlIERyYWdDU1NTdHlsZURlY2xhcmF0aW9uIGV4dGVuZHMgQ1NTU3R5bGVEZWNsYXJhdGlvbiB7XG4gIG1zU2Nyb2xsU25hcFR5cGU6IHN0cmluZztcbiAgc2Nyb2xsU25hcFR5cGU6IHN0cmluZztcbn1cblxuLyoqXG4gKiBTaGFsbG93LWV4dGVuZHMgYSBzdHlsZXNoZWV0IG9iamVjdCB3aXRoIGFub3RoZXIgc3R5bGVzaGVldC1saWtlIG9iamVjdC5cbiAqIE5vdGUgdGhhdCB0aGUga2V5cyBpbiBgc291cmNlYCBoYXZlIHRvIGJlIGRhc2gtY2FzZWQuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRlbmRTdHlsZXMoZGVzdDogQ1NTU3R5bGVEZWNsYXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnRhbnRQcm9wZXJ0aWVzPzogU2V0PHN0cmluZz4pIHtcbiAgZm9yIChsZXQga2V5IGluIHNvdXJjZSkge1xuICAgIGlmIChzb3VyY2UuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgY29uc3QgdmFsdWUgPSBzb3VyY2Vba2V5XTtcblxuICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIGRlc3Quc2V0UHJvcGVydHkoa2V5LCB2YWx1ZSwgaW1wb3J0YW50UHJvcGVydGllcz8uaGFzKGtleSkgPyAnaW1wb3J0YW50JyA6ICcnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlc3QucmVtb3ZlUHJvcGVydHkoa2V5KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gZGVzdDtcbn1cblxuXG4vKipcbiAqIFRvZ2dsZXMgd2hldGhlciB0aGUgbmF0aXZlIGRyYWcgaW50ZXJhY3Rpb25zIHNob3VsZCBiZSBlbmFibGVkIGZvciBhbiBlbGVtZW50LlxuICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCBvbiB3aGljaCB0byB0b2dnbGUgdGhlIGRyYWcgaW50ZXJhY3Rpb25zLlxuICogQHBhcmFtIGVuYWJsZSBXaGV0aGVyIHRoZSBkcmFnIGludGVyYWN0aW9ucyBzaG91bGQgYmUgZW5hYmxlZC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMoZWxlbWVudDogSFRNTEVsZW1lbnQsIGVuYWJsZTogYm9vbGVhbikge1xuICBjb25zdCB1c2VyU2VsZWN0ID0gZW5hYmxlID8gJycgOiAnbm9uZSc7XG5cbiAgZXh0ZW5kU3R5bGVzKGVsZW1lbnQuc3R5bGUsIHtcbiAgICAndG91Y2gtYWN0aW9uJzogZW5hYmxlID8gJycgOiAnbm9uZScsXG4gICAgJy13ZWJraXQtdXNlci1kcmFnJzogZW5hYmxlID8gJycgOiAnbm9uZScsXG4gICAgJy13ZWJraXQtdGFwLWhpZ2hsaWdodC1jb2xvcic6IGVuYWJsZSA/ICcnIDogJ3RyYW5zcGFyZW50JyxcbiAgICAndXNlci1zZWxlY3QnOiB1c2VyU2VsZWN0LFxuICAgICctbXMtdXNlci1zZWxlY3QnOiB1c2VyU2VsZWN0LFxuICAgICctd2Via2l0LXVzZXItc2VsZWN0JzogdXNlclNlbGVjdCxcbiAgICAnLW1vei11c2VyLXNlbGVjdCc6IHVzZXJTZWxlY3RcbiAgfSk7XG59XG5cbi8qKlxuICogVG9nZ2xlcyB3aGV0aGVyIGFuIGVsZW1lbnQgaXMgdmlzaWJsZSB3aGlsZSBwcmVzZXJ2aW5nIGl0cyBkaW1lbnNpb25zLlxuICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCB3aG9zZSB2aXNpYmlsaXR5IHRvIHRvZ2dsZVxuICogQHBhcmFtIGVuYWJsZSBXaGV0aGVyIHRoZSBlbGVtZW50IHNob3VsZCBiZSB2aXNpYmxlLlxuICogQHBhcmFtIGltcG9ydGFudFByb3BlcnRpZXMgUHJvcGVydGllcyB0byBiZSBzZXQgYXMgYCFpbXBvcnRhbnRgLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9nZ2xlVmlzaWJpbGl0eShlbGVtZW50OiBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZTogYm9vbGVhbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydGFudFByb3BlcnRpZXM/OiBTZXQ8c3RyaW5nPikge1xuICBleHRlbmRTdHlsZXMoZWxlbWVudC5zdHlsZSwge1xuICAgIHBvc2l0aW9uOiBlbmFibGUgPyAnJyA6ICdmaXhlZCcsXG4gICAgdG9wOiBlbmFibGUgPyAnJyA6ICcwJyxcbiAgICBvcGFjaXR5OiBlbmFibGUgPyAnJyA6ICcwJyxcbiAgICBsZWZ0OiBlbmFibGUgPyAnJyA6ICctOTk5ZW0nXG4gIH0sIGltcG9ydGFudFByb3BlcnRpZXMpO1xufVxuXG4vKipcbiAqIENvbWJpbmVzIGEgdHJhbnNmb3JtIHN0cmluZyB3aXRoIGFuIG9wdGlvbmFsIG90aGVyIHRyYW5zZm9ybVxuICogdGhhdCBleGl0ZWQgYmVmb3JlIHRoZSBiYXNlIHRyYW5zZm9ybSB3YXMgYXBwbGllZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbWJpbmVUcmFuc2Zvcm1zKHRyYW5zZm9ybTogc3RyaW5nLCBpbml0aWFsVHJhbnNmb3JtPzogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGluaXRpYWxUcmFuc2Zvcm0gPyAodHJhbnNmb3JtICsgJyAnICsgaW5pdGlhbFRyYW5zZm9ybSkgOiB0cmFuc2Zvcm07XG59XG4iXX0=