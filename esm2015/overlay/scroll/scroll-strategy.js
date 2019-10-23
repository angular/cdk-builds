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
 * Describes a strategy that will be used by an overlay to handle scroll events while it is open.
 * @record
 */
export function ScrollStrategy() { }
if (false) {
    /**
     * Enable this scroll strategy (called when the attached overlay is attached to a portal).
     * @type {?}
     */
    ScrollStrategy.prototype.enable;
    /**
     * Disable this scroll strategy (called when the attached overlay is detached from a portal).
     * @type {?}
     */
    ScrollStrategy.prototype.disable;
    /**
     * Attaches this `ScrollStrategy` to an overlay.
     * @type {?}
     */
    ScrollStrategy.prototype.attach;
    /**
     * Detaches the scroll strategy from the current overlay.
     * @type {?|undefined}
     */
    ScrollStrategy.prototype.detach;
}
/**
 * Returns an error to be thrown when attempting to attach an already-attached scroll strategy.
 * @return {?}
 */
export function getMatScrollStrategyAlreadyAttachedError() {
    return Error(`Scroll strategy has already been attached.`);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsLXN0cmF0ZWd5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vdmVybGF5L3Njcm9sbC9zY3JvbGwtc3RyYXRlZ3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBYUEsb0NBWUM7Ozs7OztJQVZDLGdDQUFtQjs7Ozs7SUFHbkIsaUNBQW9COzs7OztJQUdwQixnQ0FBK0M7Ozs7O0lBRy9DLGdDQUFvQjs7Ozs7O0FBTXRCLE1BQU0sVUFBVSx3Q0FBd0M7SUFDdEQsT0FBTyxLQUFLLENBQUMsNENBQTRDLENBQUMsQ0FBQztBQUM3RCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7T3ZlcmxheVJlZmVyZW5jZX0gZnJvbSAnLi4vb3ZlcmxheS1yZWZlcmVuY2UnO1xuXG4vKipcbiAqIERlc2NyaWJlcyBhIHN0cmF0ZWd5IHRoYXQgd2lsbCBiZSB1c2VkIGJ5IGFuIG92ZXJsYXkgdG8gaGFuZGxlIHNjcm9sbCBldmVudHMgd2hpbGUgaXQgaXMgb3Blbi5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTY3JvbGxTdHJhdGVneSB7XG4gIC8qKiBFbmFibGUgdGhpcyBzY3JvbGwgc3RyYXRlZ3kgKGNhbGxlZCB3aGVuIHRoZSBhdHRhY2hlZCBvdmVybGF5IGlzIGF0dGFjaGVkIHRvIGEgcG9ydGFsKS4gKi9cbiAgZW5hYmxlOiAoKSA9PiB2b2lkO1xuXG4gIC8qKiBEaXNhYmxlIHRoaXMgc2Nyb2xsIHN0cmF0ZWd5IChjYWxsZWQgd2hlbiB0aGUgYXR0YWNoZWQgb3ZlcmxheSBpcyBkZXRhY2hlZCBmcm9tIGEgcG9ydGFsKS4gKi9cbiAgZGlzYWJsZTogKCkgPT4gdm9pZDtcblxuICAvKiogQXR0YWNoZXMgdGhpcyBgU2Nyb2xsU3RyYXRlZ3lgIHRvIGFuIG92ZXJsYXkuICovXG4gIGF0dGFjaDogKG92ZXJsYXlSZWY6IE92ZXJsYXlSZWZlcmVuY2UpID0+IHZvaWQ7XG5cbiAgLyoqIERldGFjaGVzIHRoZSBzY3JvbGwgc3RyYXRlZ3kgZnJvbSB0aGUgY3VycmVudCBvdmVybGF5LiAqL1xuICBkZXRhY2g/OiAoKSA9PiB2b2lkO1xufVxuXG4vKipcbiAqIFJldHVybnMgYW4gZXJyb3IgdG8gYmUgdGhyb3duIHdoZW4gYXR0ZW1wdGluZyB0byBhdHRhY2ggYW4gYWxyZWFkeS1hdHRhY2hlZCBzY3JvbGwgc3RyYXRlZ3kuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRNYXRTY3JvbGxTdHJhdGVneUFscmVhZHlBdHRhY2hlZEVycm9yKCk6IEVycm9yIHtcbiAgcmV0dXJuIEVycm9yKGBTY3JvbGwgc3RyYXRlZ3kgaGFzIGFscmVhZHkgYmVlbiBhdHRhY2hlZC5gKTtcbn1cbiJdfQ==