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
 * Custom injector to be used when providing custom
 * injection tokens to components inside a portal.
 * \@docs-private
 */
export class PortalInjector {
    /**
     * @param {?} _parentInjector
     * @param {?} _customTokens
     */
    constructor(_parentInjector, _customTokens) {
        this._parentInjector = _parentInjector;
        this._customTokens = _customTokens;
    }
    /**
     * @param {?} token
     * @param {?=} notFoundValue
     * @return {?}
     */
    get(token, notFoundValue) {
        /** @type {?} */
        const value = this._customTokens.get(token);
        if (typeof value !== 'undefined') {
            return value;
        }
        return this._parentInjector.get(token, notFoundValue);
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    PortalInjector.prototype._parentInjector;
    /**
     * @type {?}
     * @private
     */
    PortalInjector.prototype._customTokens;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9ydGFsLWluamVjdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9wb3J0YWwvcG9ydGFsLWluamVjdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7QUFlQSxNQUFNLE9BQU8sY0FBYzs7Ozs7SUFDekIsWUFDVSxlQUF5QixFQUN6QixhQUFnQztRQURoQyxvQkFBZSxHQUFmLGVBQWUsQ0FBVTtRQUN6QixrQkFBYSxHQUFiLGFBQWEsQ0FBbUI7SUFBSSxDQUFDOzs7Ozs7SUFFL0MsR0FBRyxDQUFDLEtBQVUsRUFBRSxhQUFtQjs7Y0FDM0IsS0FBSyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztRQUUzQyxJQUFJLE9BQU8sS0FBSyxLQUFLLFdBQVcsRUFBRTtZQUNoQyxPQUFPLEtBQUssQ0FBQztTQUNkO1FBRUQsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBTSxLQUFLLEVBQUUsYUFBYSxDQUFDLENBQUM7SUFDN0QsQ0FBQztDQUNGOzs7Ozs7SUFaRyx5Q0FBaUM7Ozs7O0lBQ2pDLHVDQUF3QyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuLyoqXG4gKiBDdXN0b20gaW5qZWN0b3IgdG8gYmUgdXNlZCB3aGVuIHByb3ZpZGluZyBjdXN0b21cbiAqIGluamVjdGlvbiB0b2tlbnMgdG8gY29tcG9uZW50cyBpbnNpZGUgYSBwb3J0YWwuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBjbGFzcyBQb3J0YWxJbmplY3RvciBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfcGFyZW50SW5qZWN0b3I6IEluamVjdG9yLFxuICAgIHByaXZhdGUgX2N1c3RvbVRva2VuczogV2Vha01hcDxhbnksIGFueT4pIHsgfVxuXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55IHtcbiAgICBjb25zdCB2YWx1ZSA9IHRoaXMuX2N1c3RvbVRva2Vucy5nZXQodG9rZW4pO1xuXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fcGFyZW50SW5qZWN0b3IuZ2V0PGFueT4odG9rZW4sIG5vdEZvdW5kVmFsdWUpO1xuICB9XG59XG4iXX0=