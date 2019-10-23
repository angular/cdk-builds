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
import { Observable, of as observableOf } from 'rxjs';
import { DataSource } from './data-source';
/**
 * DataSource wrapper for a native array.
 * @template T
 */
export class ArrayDataSource extends DataSource {
    /**
     * @param {?} _data
     */
    constructor(_data) {
        super();
        this._data = _data;
    }
    /**
     * @return {?}
     */
    connect() {
        return this._data instanceof Observable ? this._data : observableOf(this._data);
    }
    /**
     * @return {?}
     */
    disconnect() { }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    ArrayDataSource.prototype._data;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXktZGF0YS1zb3VyY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2NvbGxlY3Rpb25zL2FycmF5LWRhdGEtc291cmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFVBQVUsRUFBRSxFQUFFLElBQUksWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3BELE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7Ozs7O0FBSXpDLE1BQU0sT0FBTyxlQUFtQixTQUFRLFVBQWE7Ozs7SUFDbkQsWUFBb0IsS0FBa0U7UUFDcEYsS0FBSyxFQUFFLENBQUM7UUFEVSxVQUFLLEdBQUwsS0FBSyxDQUE2RDtJQUV0RixDQUFDOzs7O0lBRUQsT0FBTztRQUNMLE9BQU8sSUFBSSxDQUFDLEtBQUssWUFBWSxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbEYsQ0FBQzs7OztJQUVELFVBQVUsS0FBSSxDQUFDO0NBQ2hCOzs7Ozs7SUFUYSxnQ0FBMEUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtPYnNlcnZhYmxlLCBvZiBhcyBvYnNlcnZhYmxlT2Z9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtEYXRhU291cmNlfSBmcm9tICcuL2RhdGEtc291cmNlJztcblxuXG4vKiogRGF0YVNvdXJjZSB3cmFwcGVyIGZvciBhIG5hdGl2ZSBhcnJheS4gKi9cbmV4cG9ydCBjbGFzcyBBcnJheURhdGFTb3VyY2U8VD4gZXh0ZW5kcyBEYXRhU291cmNlPFQ+IHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfZGF0YTogVFtdIHwgUmVhZG9ubHlBcnJheTxUPiB8IE9ic2VydmFibGU8VFtdIHwgUmVhZG9ubHlBcnJheTxUPj4pIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgY29ubmVjdCgpOiBPYnNlcnZhYmxlPFRbXSB8IFJlYWRvbmx5QXJyYXk8VD4+IHtcbiAgICByZXR1cm4gdGhpcy5fZGF0YSBpbnN0YW5jZW9mIE9ic2VydmFibGUgPyB0aGlzLl9kYXRhIDogb2JzZXJ2YWJsZU9mKHRoaXMuX2RhdGEpO1xuICB9XG5cbiAgZGlzY29ubmVjdCgpIHt9XG59XG4iXX0=