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
        '-moz-user-select': userSelect,
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
        left: enable ? '' : '-999em',
    }, importantProperties);
}
/**
 * Combines a transform string with an optional other transform
 * that exited before the base transform was applied.
 */
export function combineTransforms(transform, initialTransform) {
    return initialTransform && initialTransform != 'none'
        ? transform + ' ' + initialTransform
        : transform;
}
/**
 * Matches the target element's size to the source's size.
 * @param target Element that needs to be resized.
 * @param sourceRect Dimensions of the source element.
 */
export function matchElementSize(target, sourceRect) {
    target.style.width = `${sourceRect.width}px`;
    target.style.height = `${sourceRect.height}px`;
    target.style.transform = getTransform(sourceRect.left, sourceRect.top);
}
/**
 * Gets a 3d `transform` that can be applied to an element.
 * @param x Desired position of the element along the X axis.
 * @param y Desired position of the element along the Y axis.
 */
export function getTransform(x, y) {
    // Round the transforms since some browsers will
    // blur the elements for sub-pixel transforms.
    return `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2RvbS9zdHlsaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQVlIOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsWUFBWSxDQUMxQixJQUF5QixFQUN6QixNQUE4QixFQUM5QixtQkFBaUM7SUFFakMsS0FBSyxJQUFJLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUN2QixJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUMvQixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFMUIsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDVixJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2pGLENBQUM7aUJBQU0sQ0FBQztnQkFDTixJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzNCLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLDRCQUE0QixDQUFDLE9BQW9CLEVBQUUsTUFBZTtJQUNoRixNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO0lBRXhDLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFO1FBQzFCLGNBQWMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTTtRQUNwQyxtQkFBbUIsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTTtRQUN6Qyw2QkFBNkIsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsYUFBYTtRQUMxRCxhQUFhLEVBQUUsVUFBVTtRQUN6QixpQkFBaUIsRUFBRSxVQUFVO1FBQzdCLHFCQUFxQixFQUFFLFVBQVU7UUFDakMsa0JBQWtCLEVBQUUsVUFBVTtLQUMvQixDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsTUFBTSxVQUFVLGdCQUFnQixDQUM5QixPQUFvQixFQUNwQixNQUFlLEVBQ2YsbUJBQWlDO0lBRWpDLFlBQVksQ0FDVixPQUFPLENBQUMsS0FBSyxFQUNiO1FBQ0UsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPO1FBQy9CLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRztRQUN0QixPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUc7UUFDMUIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRO0tBQzdCLEVBQ0QsbUJBQW1CLENBQ3BCLENBQUM7QUFDSixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLGlCQUFpQixDQUFDLFNBQWlCLEVBQUUsZ0JBQXlCO0lBQzVFLE9BQU8sZ0JBQWdCLElBQUksZ0JBQWdCLElBQUksTUFBTTtRQUNuRCxDQUFDLENBQUMsU0FBUyxHQUFHLEdBQUcsR0FBRyxnQkFBZ0I7UUFDcEMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztBQUNoQixDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxNQUFtQixFQUFFLFVBQW1CO0lBQ3ZFLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEdBQUcsVUFBVSxDQUFDLEtBQUssSUFBSSxDQUFDO0lBQzdDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLEdBQUcsVUFBVSxDQUFDLE1BQU0sSUFBSSxDQUFDO0lBQy9DLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLFlBQVksQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN6RSxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxZQUFZLENBQUMsQ0FBUyxFQUFFLENBQVM7SUFDL0MsZ0RBQWdEO0lBQ2hELDhDQUE4QztJQUM5QyxPQUFPLGVBQWUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUM7QUFDbEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIEV4dGVuZGVkIENTU1N0eWxlRGVjbGFyYXRpb24gdGhhdCBpbmNsdWRlcyBhIGNvdXBsZSBvZiBkcmFnLXJlbGF0ZWRcbiAqIHByb3BlcnRpZXMgdGhhdCBhcmVuJ3QgaW4gdGhlIGJ1aWx0LWluIFRTIHR5cGluZ3MuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRHJhZ0NTU1N0eWxlRGVjbGFyYXRpb24gZXh0ZW5kcyBDU1NTdHlsZURlY2xhcmF0aW9uIHtcbiAgbXNTY3JvbGxTbmFwVHlwZTogc3RyaW5nO1xuICBzY3JvbGxTbmFwVHlwZTogc3RyaW5nO1xuICB3ZWJraXRUYXBIaWdobGlnaHRDb2xvcjogc3RyaW5nO1xufVxuXG4vKipcbiAqIFNoYWxsb3ctZXh0ZW5kcyBhIHN0eWxlc2hlZXQgb2JqZWN0IHdpdGggYW5vdGhlciBzdHlsZXNoZWV0LWxpa2Ugb2JqZWN0LlxuICogTm90ZSB0aGF0IHRoZSBrZXlzIGluIGBzb3VyY2VgIGhhdmUgdG8gYmUgZGFzaC1jYXNlZC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dGVuZFN0eWxlcyhcbiAgZGVzdDogQ1NTU3R5bGVEZWNsYXJhdGlvbixcbiAgc291cmNlOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+LFxuICBpbXBvcnRhbnRQcm9wZXJ0aWVzPzogU2V0PHN0cmluZz4sXG4pIHtcbiAgZm9yIChsZXQga2V5IGluIHNvdXJjZSkge1xuICAgIGlmIChzb3VyY2UuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgY29uc3QgdmFsdWUgPSBzb3VyY2Vba2V5XTtcblxuICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIGRlc3Quc2V0UHJvcGVydHkoa2V5LCB2YWx1ZSwgaW1wb3J0YW50UHJvcGVydGllcz8uaGFzKGtleSkgPyAnaW1wb3J0YW50JyA6ICcnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlc3QucmVtb3ZlUHJvcGVydHkoa2V5KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gZGVzdDtcbn1cblxuLyoqXG4gKiBUb2dnbGVzIHdoZXRoZXIgdGhlIG5hdGl2ZSBkcmFnIGludGVyYWN0aW9ucyBzaG91bGQgYmUgZW5hYmxlZCBmb3IgYW4gZWxlbWVudC5cbiAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgb24gd2hpY2ggdG8gdG9nZ2xlIHRoZSBkcmFnIGludGVyYWN0aW9ucy5cbiAqIEBwYXJhbSBlbmFibGUgV2hldGhlciB0aGUgZHJhZyBpbnRlcmFjdGlvbnMgc2hvdWxkIGJlIGVuYWJsZWQuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBlbmFibGU6IGJvb2xlYW4pIHtcbiAgY29uc3QgdXNlclNlbGVjdCA9IGVuYWJsZSA/ICcnIDogJ25vbmUnO1xuXG4gIGV4dGVuZFN0eWxlcyhlbGVtZW50LnN0eWxlLCB7XG4gICAgJ3RvdWNoLWFjdGlvbic6IGVuYWJsZSA/ICcnIDogJ25vbmUnLFxuICAgICctd2Via2l0LXVzZXItZHJhZyc6IGVuYWJsZSA/ICcnIDogJ25vbmUnLFxuICAgICctd2Via2l0LXRhcC1oaWdobGlnaHQtY29sb3InOiBlbmFibGUgPyAnJyA6ICd0cmFuc3BhcmVudCcsXG4gICAgJ3VzZXItc2VsZWN0JzogdXNlclNlbGVjdCxcbiAgICAnLW1zLXVzZXItc2VsZWN0JzogdXNlclNlbGVjdCxcbiAgICAnLXdlYmtpdC11c2VyLXNlbGVjdCc6IHVzZXJTZWxlY3QsXG4gICAgJy1tb3otdXNlci1zZWxlY3QnOiB1c2VyU2VsZWN0LFxuICB9KTtcbn1cblxuLyoqXG4gKiBUb2dnbGVzIHdoZXRoZXIgYW4gZWxlbWVudCBpcyB2aXNpYmxlIHdoaWxlIHByZXNlcnZpbmcgaXRzIGRpbWVuc2lvbnMuXG4gKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IHdob3NlIHZpc2liaWxpdHkgdG8gdG9nZ2xlXG4gKiBAcGFyYW0gZW5hYmxlIFdoZXRoZXIgdGhlIGVsZW1lbnQgc2hvdWxkIGJlIHZpc2libGUuXG4gKiBAcGFyYW0gaW1wb3J0YW50UHJvcGVydGllcyBQcm9wZXJ0aWVzIHRvIGJlIHNldCBhcyBgIWltcG9ydGFudGAuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b2dnbGVWaXNpYmlsaXR5KFxuICBlbGVtZW50OiBIVE1MRWxlbWVudCxcbiAgZW5hYmxlOiBib29sZWFuLFxuICBpbXBvcnRhbnRQcm9wZXJ0aWVzPzogU2V0PHN0cmluZz4sXG4pIHtcbiAgZXh0ZW5kU3R5bGVzKFxuICAgIGVsZW1lbnQuc3R5bGUsXG4gICAge1xuICAgICAgcG9zaXRpb246IGVuYWJsZSA/ICcnIDogJ2ZpeGVkJyxcbiAgICAgIHRvcDogZW5hYmxlID8gJycgOiAnMCcsXG4gICAgICBvcGFjaXR5OiBlbmFibGUgPyAnJyA6ICcwJyxcbiAgICAgIGxlZnQ6IGVuYWJsZSA/ICcnIDogJy05OTllbScsXG4gICAgfSxcbiAgICBpbXBvcnRhbnRQcm9wZXJ0aWVzLFxuICApO1xufVxuXG4vKipcbiAqIENvbWJpbmVzIGEgdHJhbnNmb3JtIHN0cmluZyB3aXRoIGFuIG9wdGlvbmFsIG90aGVyIHRyYW5zZm9ybVxuICogdGhhdCBleGl0ZWQgYmVmb3JlIHRoZSBiYXNlIHRyYW5zZm9ybSB3YXMgYXBwbGllZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbWJpbmVUcmFuc2Zvcm1zKHRyYW5zZm9ybTogc3RyaW5nLCBpbml0aWFsVHJhbnNmb3JtPzogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGluaXRpYWxUcmFuc2Zvcm0gJiYgaW5pdGlhbFRyYW5zZm9ybSAhPSAnbm9uZSdcbiAgICA/IHRyYW5zZm9ybSArICcgJyArIGluaXRpYWxUcmFuc2Zvcm1cbiAgICA6IHRyYW5zZm9ybTtcbn1cblxuLyoqXG4gKiBNYXRjaGVzIHRoZSB0YXJnZXQgZWxlbWVudCdzIHNpemUgdG8gdGhlIHNvdXJjZSdzIHNpemUuXG4gKiBAcGFyYW0gdGFyZ2V0IEVsZW1lbnQgdGhhdCBuZWVkcyB0byBiZSByZXNpemVkLlxuICogQHBhcmFtIHNvdXJjZVJlY3QgRGltZW5zaW9ucyBvZiB0aGUgc291cmNlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXRjaEVsZW1lbnRTaXplKHRhcmdldDogSFRNTEVsZW1lbnQsIHNvdXJjZVJlY3Q6IERPTVJlY3QpOiB2b2lkIHtcbiAgdGFyZ2V0LnN0eWxlLndpZHRoID0gYCR7c291cmNlUmVjdC53aWR0aH1weGA7XG4gIHRhcmdldC5zdHlsZS5oZWlnaHQgPSBgJHtzb3VyY2VSZWN0LmhlaWdodH1weGA7XG4gIHRhcmdldC5zdHlsZS50cmFuc2Zvcm0gPSBnZXRUcmFuc2Zvcm0oc291cmNlUmVjdC5sZWZ0LCBzb3VyY2VSZWN0LnRvcCk7XG59XG5cbi8qKlxuICogR2V0cyBhIDNkIGB0cmFuc2Zvcm1gIHRoYXQgY2FuIGJlIGFwcGxpZWQgdG8gYW4gZWxlbWVudC5cbiAqIEBwYXJhbSB4IERlc2lyZWQgcG9zaXRpb24gb2YgdGhlIGVsZW1lbnQgYWxvbmcgdGhlIFggYXhpcy5cbiAqIEBwYXJhbSB5IERlc2lyZWQgcG9zaXRpb24gb2YgdGhlIGVsZW1lbnQgYWxvbmcgdGhlIFkgYXhpcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRyYW5zZm9ybSh4OiBudW1iZXIsIHk6IG51bWJlcik6IHN0cmluZyB7XG4gIC8vIFJvdW5kIHRoZSB0cmFuc2Zvcm1zIHNpbmNlIHNvbWUgYnJvd3NlcnMgd2lsbFxuICAvLyBibHVyIHRoZSBlbGVtZW50cyBmb3Igc3ViLXBpeGVsIHRyYW5zZm9ybXMuXG4gIHJldHVybiBgdHJhbnNsYXRlM2QoJHtNYXRoLnJvdW5kKHgpfXB4LCAke01hdGgucm91bmQoeSl9cHgsIDApYDtcbn1cbiJdfQ==