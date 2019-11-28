/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/collections/array-data-source.ts
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXktZGF0YS1zb3VyY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2NvbGxlY3Rpb25zL2FycmF5LWRhdGEtc291cmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxVQUFVLEVBQUUsRUFBRSxJQUFJLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUNwRCxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDOzs7OztBQUl6QyxNQUFNLE9BQU8sZUFBbUIsU0FBUSxVQUFhOzs7O0lBQ25ELFlBQW9CLEtBQWtFO1FBQ3BGLEtBQUssRUFBRSxDQUFDO1FBRFUsVUFBSyxHQUFMLEtBQUssQ0FBNkQ7SUFFdEYsQ0FBQzs7OztJQUVELE9BQU87UUFDTCxPQUFPLElBQUksQ0FBQyxLQUFLLFlBQVksVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2xGLENBQUM7Ozs7SUFFRCxVQUFVLEtBQUksQ0FBQztDQUNoQjs7Ozs7O0lBVGEsZ0NBQTBFIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7T2JzZXJ2YWJsZSwgb2YgYXMgb2JzZXJ2YWJsZU9mfSBmcm9tICdyeGpzJztcbmltcG9ydCB7RGF0YVNvdXJjZX0gZnJvbSAnLi9kYXRhLXNvdXJjZSc7XG5cblxuLyoqIERhdGFTb3VyY2Ugd3JhcHBlciBmb3IgYSBuYXRpdmUgYXJyYXkuICovXG5leHBvcnQgY2xhc3MgQXJyYXlEYXRhU291cmNlPFQ+IGV4dGVuZHMgRGF0YVNvdXJjZTxUPiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2RhdGE6IFRbXSB8IFJlYWRvbmx5QXJyYXk8VD4gfCBPYnNlcnZhYmxlPFRbXSB8IFJlYWRvbmx5QXJyYXk8VD4+KSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIGNvbm5lY3QoKTogT2JzZXJ2YWJsZTxUW10gfCBSZWFkb25seUFycmF5PFQ+PiB7XG4gICAgcmV0dXJuIHRoaXMuX2RhdGEgaW5zdGFuY2VvZiBPYnNlcnZhYmxlID8gdGhpcy5fZGF0YSA6IG9ic2VydmFibGVPZih0aGlzLl9kYXRhKTtcbiAgfVxuXG4gIGRpc2Nvbm5lY3QoKSB7fVxufVxuIl19