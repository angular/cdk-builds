/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/collections/unique-selection-dispatcher.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable } from '@angular/core';
import * as i0 from "@angular/core";
/**
 * Class to coordinate unique selection based on name.
 * Intended to be consumed as an Angular service.
 * This service is needed because native radio change events are only fired on the item currently
 * being selected, and we still need to uncheck the previous selection.
 *
 * This service does not *store* any IDs and names because they may change at any time, so it is
 * less error-prone if they are simply passed through when the events occur.
 */
let UniqueSelectionDispatcher = /** @class */ (() => {
    /**
     * Class to coordinate unique selection based on name.
     * Intended to be consumed as an Angular service.
     * This service is needed because native radio change events are only fired on the item currently
     * being selected, and we still need to uncheck the previous selection.
     *
     * This service does not *store* any IDs and names because they may change at any time, so it is
     * less error-prone if they are simply passed through when the events occur.
     */
    class UniqueSelectionDispatcher {
        constructor() {
            this._listeners = [];
        }
        /**
         * Notify other items that selection for the given name has been set.
         * @param {?} id ID of the item.
         * @param {?} name Name of the item.
         * @return {?}
         */
        notify(id, name) {
            for (let listener of this._listeners) {
                listener(id, name);
            }
        }
        /**
         * Listen for future changes to item selection.
         * @param {?} listener
         * @return {?} Function used to deregister listener
         */
        listen(listener) {
            this._listeners.push(listener);
            return (/**
             * @return {?}
             */
            () => {
                this._listeners = this._listeners.filter((/**
                 * @param {?} registered
                 * @return {?}
                 */
                (registered) => {
                    return listener !== registered;
                }));
            });
        }
        /**
         * @return {?}
         */
        ngOnDestroy() {
            this._listeners = [];
        }
    }
    UniqueSelectionDispatcher.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    /** @nocollapse */ UniqueSelectionDispatcher.ɵprov = i0.ɵɵdefineInjectable({ factory: function UniqueSelectionDispatcher_Factory() { return new UniqueSelectionDispatcher(); }, token: UniqueSelectionDispatcher, providedIn: "root" });
    return UniqueSelectionDispatcher;
})();
export { UniqueSelectionDispatcher };
if (false) {
    /**
     * @type {?}
     * @private
     */
    UniqueSelectionDispatcher.prototype._listeners;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5pcXVlLXNlbGVjdGlvbi1kaXNwYXRjaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9jb2xsZWN0aW9ucy91bmlxdWUtc2VsZWN0aW9uLWRpc3BhdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFVBQVUsRUFBWSxNQUFNLGVBQWUsQ0FBQzs7Ozs7Ozs7Ozs7QUFlcEQ7Ozs7Ozs7Ozs7SUFBQSxNQUNhLHlCQUF5QjtRQUR0QztZQUVVLGVBQVUsR0FBd0MsRUFBRSxDQUFDO1NBNkI5RDs7Ozs7OztRQXRCQyxNQUFNLENBQUMsRUFBVSxFQUFFLElBQVk7WUFDN0IsS0FBSyxJQUFJLFFBQVEsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO2dCQUNwQyxRQUFRLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO2FBQ3BCO1FBQ0gsQ0FBQzs7Ozs7O1FBTUQsTUFBTSxDQUFDLFFBQTJDO1lBQ2hELElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQy9COzs7WUFBTyxHQUFHLEVBQUU7Z0JBQ1YsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU07Ozs7Z0JBQUMsQ0FBQyxVQUE2QyxFQUFFLEVBQUU7b0JBQ3pGLE9BQU8sUUFBUSxLQUFLLFVBQVUsQ0FBQztnQkFDakMsQ0FBQyxFQUFDLENBQUM7WUFDTCxDQUFDLEVBQUM7UUFDSixDQUFDOzs7O1FBRUQsV0FBVztZQUNULElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO1FBQ3ZCLENBQUM7OztnQkE5QkYsVUFBVSxTQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQzs7O29DQXZCaEM7S0FzREM7U0E5QlkseUJBQXlCOzs7Ozs7SUFDcEMsK0NBQTZEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0YWJsZSwgT25EZXN0cm95fSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuXG4vLyBVc2VycyBvZiB0aGUgRGlzcGF0Y2hlciBuZXZlciBuZWVkIHRvIHNlZSB0aGlzIHR5cGUsIGJ1dCBUeXBlU2NyaXB0IHJlcXVpcmVzIGl0IHRvIGJlIGV4cG9ydGVkLlxuZXhwb3J0IHR5cGUgVW5pcXVlU2VsZWN0aW9uRGlzcGF0Y2hlckxpc3RlbmVyID0gKGlkOiBzdHJpbmcsIG5hbWU6IHN0cmluZykgPT4gdm9pZDtcblxuLyoqXG4gKiBDbGFzcyB0byBjb29yZGluYXRlIHVuaXF1ZSBzZWxlY3Rpb24gYmFzZWQgb24gbmFtZS5cbiAqIEludGVuZGVkIHRvIGJlIGNvbnN1bWVkIGFzIGFuIEFuZ3VsYXIgc2VydmljZS5cbiAqIFRoaXMgc2VydmljZSBpcyBuZWVkZWQgYmVjYXVzZSBuYXRpdmUgcmFkaW8gY2hhbmdlIGV2ZW50cyBhcmUgb25seSBmaXJlZCBvbiB0aGUgaXRlbSBjdXJyZW50bHlcbiAqIGJlaW5nIHNlbGVjdGVkLCBhbmQgd2Ugc3RpbGwgbmVlZCB0byB1bmNoZWNrIHRoZSBwcmV2aW91cyBzZWxlY3Rpb24uXG4gKlxuICogVGhpcyBzZXJ2aWNlIGRvZXMgbm90ICpzdG9yZSogYW55IElEcyBhbmQgbmFtZXMgYmVjYXVzZSB0aGV5IG1heSBjaGFuZ2UgYXQgYW55IHRpbWUsIHNvIGl0IGlzXG4gKiBsZXNzIGVycm9yLXByb25lIGlmIHRoZXkgYXJlIHNpbXBseSBwYXNzZWQgdGhyb3VnaCB3aGVuIHRoZSBldmVudHMgb2NjdXIuXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIFVuaXF1ZVNlbGVjdGlvbkRpc3BhdGNoZXIgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9saXN0ZW5lcnM6IFVuaXF1ZVNlbGVjdGlvbkRpc3BhdGNoZXJMaXN0ZW5lcltdID0gW107XG5cbiAgLyoqXG4gICAqIE5vdGlmeSBvdGhlciBpdGVtcyB0aGF0IHNlbGVjdGlvbiBmb3IgdGhlIGdpdmVuIG5hbWUgaGFzIGJlZW4gc2V0LlxuICAgKiBAcGFyYW0gaWQgSUQgb2YgdGhlIGl0ZW0uXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBub3RpZnkoaWQ6IHN0cmluZywgbmFtZTogc3RyaW5nKSB7XG4gICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgdGhpcy5fbGlzdGVuZXJzKSB7XG4gICAgICBsaXN0ZW5lcihpZCwgbmFtZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIExpc3RlbiBmb3IgZnV0dXJlIGNoYW5nZXMgdG8gaXRlbSBzZWxlY3Rpb24uXG4gICAqIEByZXR1cm4gRnVuY3Rpb24gdXNlZCB0byBkZXJlZ2lzdGVyIGxpc3RlbmVyXG4gICAqL1xuICBsaXN0ZW4obGlzdGVuZXI6IFVuaXF1ZVNlbGVjdGlvbkRpc3BhdGNoZXJMaXN0ZW5lcik6ICgpID0+IHZvaWQge1xuICAgIHRoaXMuX2xpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgdGhpcy5fbGlzdGVuZXJzID0gdGhpcy5fbGlzdGVuZXJzLmZpbHRlcigocmVnaXN0ZXJlZDogVW5pcXVlU2VsZWN0aW9uRGlzcGF0Y2hlckxpc3RlbmVyKSA9PiB7XG4gICAgICAgIHJldHVybiBsaXN0ZW5lciAhPT0gcmVnaXN0ZXJlZDtcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9saXN0ZW5lcnMgPSBbXTtcbiAgfVxufVxuIl19