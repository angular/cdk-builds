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
import { InjectionToken } from '@angular/core';
/** @type {?} */
export const LIVE_ANNOUNCER_ELEMENT_TOKEN = new InjectionToken('liveAnnouncerElement', {
    providedIn: 'root',
    factory: LIVE_ANNOUNCER_ELEMENT_TOKEN_FACTORY,
});
/**
 * \@docs-private
 * @return {?}
 */
export function LIVE_ANNOUNCER_ELEMENT_TOKEN_FACTORY() {
    return null;
}
/**
 * Object that can be used to configure the default options for the LiveAnnouncer.
 * @record
 */
export function LiveAnnouncerDefaultOptions() { }
if (false) {
    /**
     * Default politeness for the announcements.
     * @type {?|undefined}
     */
    LiveAnnouncerDefaultOptions.prototype.politeness;
    /**
     * Default duration for the announcement messages.
     * @type {?|undefined}
     */
    LiveAnnouncerDefaultOptions.prototype.duration;
}
/**
 * Injection token that can be used to configure the default options for the LiveAnnouncer.
 * @type {?}
 */
export const LIVE_ANNOUNCER_DEFAULT_OPTIONS = new InjectionToken('LIVE_ANNOUNCER_DEFAULT_OPTIONS');
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGl2ZS1hbm5vdW5jZXItdG9rZW5zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9hMTF5L2xpdmUtYW5ub3VuY2VyL2xpdmUtYW5ub3VuY2VyLXRva2Vucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7O0FBUTdDLE1BQU0sT0FBTyw0QkFBNEIsR0FDckMsSUFBSSxjQUFjLENBQXFCLHNCQUFzQixFQUFFO0lBQzdELFVBQVUsRUFBRSxNQUFNO0lBQ2xCLE9BQU8sRUFBRSxvQ0FBb0M7Q0FDOUMsQ0FBQzs7Ozs7QUFHTixNQUFNLFVBQVUsb0NBQW9DO0lBQ2xELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQzs7Ozs7QUFHRCxpREFNQzs7Ozs7O0lBSkMsaURBQWdDOzs7OztJQUdoQywrQ0FBa0I7Ozs7OztBQUlwQixNQUFNLE9BQU8sOEJBQThCLEdBQ3ZDLElBQUksY0FBYyxDQUE4QixnQ0FBZ0MsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuLy8gVGhlIHRva2VucyBmb3IgdGhlIGxpdmUgYW5ub3VuY2VyIGFyZSBkZWZpbmVkIGluIGEgc2VwYXJhdGUgZmlsZSBmcm9tIExpdmVBbm5vdW5jZXJcbi8vIGFzIGEgd29ya2Fyb3VuZCBmb3IgaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9pc3N1ZXMvMjI1NTlcblxuLyoqIFBvc3NpYmxlIHBvbGl0ZW5lc3MgbGV2ZWxzLiAqL1xuZXhwb3J0IHR5cGUgQXJpYUxpdmVQb2xpdGVuZXNzID0gJ29mZicgfCAncG9saXRlJyB8ICdhc3NlcnRpdmUnO1xuXG5leHBvcnQgY29uc3QgTElWRV9BTk5PVU5DRVJfRUxFTUVOVF9UT0tFTiA9XG4gICAgbmV3IEluamVjdGlvblRva2VuPEhUTUxFbGVtZW50IHwgbnVsbD4oJ2xpdmVBbm5vdW5jZXJFbGVtZW50Jywge1xuICAgICAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxuICAgICAgZmFjdG9yeTogTElWRV9BTk5PVU5DRVJfRUxFTUVOVF9UT0tFTl9GQUNUT1JZLFxuICAgIH0pO1xuXG4vKiogQGRvY3MtcHJpdmF0ZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIExJVkVfQU5OT1VOQ0VSX0VMRU1FTlRfVE9LRU5fRkFDVE9SWSgpOiBudWxsIHtcbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKiBPYmplY3QgdGhhdCBjYW4gYmUgdXNlZCB0byBjb25maWd1cmUgdGhlIGRlZmF1bHQgb3B0aW9ucyBmb3IgdGhlIExpdmVBbm5vdW5jZXIuICovXG5leHBvcnQgaW50ZXJmYWNlIExpdmVBbm5vdW5jZXJEZWZhdWx0T3B0aW9ucyB7XG4gIC8qKiBEZWZhdWx0IHBvbGl0ZW5lc3MgZm9yIHRoZSBhbm5vdW5jZW1lbnRzLiAqL1xuICBwb2xpdGVuZXNzPzogQXJpYUxpdmVQb2xpdGVuZXNzO1xuXG4gIC8qKiBEZWZhdWx0IGR1cmF0aW9uIGZvciB0aGUgYW5ub3VuY2VtZW50IG1lc3NhZ2VzLiAqL1xuICBkdXJhdGlvbj86IG51bWJlcjtcbn1cblxuLyoqIEluamVjdGlvbiB0b2tlbiB0aGF0IGNhbiBiZSB1c2VkIHRvIGNvbmZpZ3VyZSB0aGUgZGVmYXVsdCBvcHRpb25zIGZvciB0aGUgTGl2ZUFubm91bmNlci4gKi9cbmV4cG9ydCBjb25zdCBMSVZFX0FOTk9VTkNFUl9ERUZBVUxUX09QVElPTlMgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjxMaXZlQW5ub3VuY2VyRGVmYXVsdE9wdGlvbnM+KCdMSVZFX0FOTk9VTkNFUl9ERUZBVUxUX09QVElPTlMnKTtcbiJdfQ==