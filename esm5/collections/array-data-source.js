/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __extends } from "tslib";
import { Observable, of as observableOf } from 'rxjs';
import { DataSource } from './data-source';
/** DataSource wrapper for a native array. */
var ArrayDataSource = /** @class */ (function (_super) {
    __extends(ArrayDataSource, _super);
    function ArrayDataSource(_data) {
        var _this = _super.call(this) || this;
        _this._data = _data;
        return _this;
    }
    ArrayDataSource.prototype.connect = function () {
        return this._data instanceof Observable ? this._data : observableOf(this._data);
    };
    ArrayDataSource.prototype.disconnect = function () { };
    return ArrayDataSource;
}(DataSource));
export { ArrayDataSource };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXktZGF0YS1zb3VyY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2NvbGxlY3Rpb25zL2FycmF5LWRhdGEtc291cmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsVUFBVSxFQUFFLEVBQUUsSUFBSSxZQUFZLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDcEQsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUd6Qyw2Q0FBNkM7QUFDN0M7SUFBd0MsbUNBQWE7SUFDbkQseUJBQW9CLEtBQWtFO1FBQXRGLFlBQ0UsaUJBQU8sU0FDUjtRQUZtQixXQUFLLEdBQUwsS0FBSyxDQUE2RDs7SUFFdEYsQ0FBQztJQUVELGlDQUFPLEdBQVA7UUFDRSxPQUFPLElBQUksQ0FBQyxLQUFLLFlBQVksVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2xGLENBQUM7SUFFRCxvQ0FBVSxHQUFWLGNBQWMsQ0FBQztJQUNqQixzQkFBQztBQUFELENBQUMsQUFWRCxDQUF3QyxVQUFVLEdBVWpEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7T2JzZXJ2YWJsZSwgb2YgYXMgb2JzZXJ2YWJsZU9mfSBmcm9tICdyeGpzJztcbmltcG9ydCB7RGF0YVNvdXJjZX0gZnJvbSAnLi9kYXRhLXNvdXJjZSc7XG5cblxuLyoqIERhdGFTb3VyY2Ugd3JhcHBlciBmb3IgYSBuYXRpdmUgYXJyYXkuICovXG5leHBvcnQgY2xhc3MgQXJyYXlEYXRhU291cmNlPFQ+IGV4dGVuZHMgRGF0YVNvdXJjZTxUPiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2RhdGE6IFRbXSB8IFJlYWRvbmx5QXJyYXk8VD4gfCBPYnNlcnZhYmxlPFRbXSB8IFJlYWRvbmx5QXJyYXk8VD4+KSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIGNvbm5lY3QoKTogT2JzZXJ2YWJsZTxUW10gfCBSZWFkb25seUFycmF5PFQ+PiB7XG4gICAgcmV0dXJuIHRoaXMuX2RhdGEgaW5zdGFuY2VvZiBPYnNlcnZhYmxlID8gdGhpcy5fZGF0YSA6IG9ic2VydmFibGVPZih0aGlzLl9kYXRhKTtcbiAgfVxuXG4gIGRpc2Nvbm5lY3QoKSB7fVxufVxuIl19