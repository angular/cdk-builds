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
 * @abstract
 * @template T
 */
export class DataSource {
}
if (false) {
    /**
     * Connects a collection viewer (such as a data-table) to this data source. Note that
     * the stream provided will be accessed during change detection and should not directly change
     * values that are bound in template views.
     * @abstract
     * @param {?} collectionViewer The component that exposes a view over the data provided by this
     *     data source.
     * @return {?} Observable that emits a new value when the data changes.
     */
    DataSource.prototype.connect = function (collectionViewer) { };
    /**
     * Disconnects a collection viewer (such as a data-table) from this data source. Can be used
     * to perform any clean-up or tear-down operations when a view is being destroyed.
     *
     * @abstract
     * @param {?} collectionViewer The component that exposes a view over the data provided by this
     *     data source.
     * @return {?}
     */
    DataSource.prototype.disconnect = function (collectionViewer) { };
}
/**
 * Checks whether an object is a data source.
 * @param {?} value
 * @return {?}
 */
export function isDataSource(value) {
    // Check if the value is a DataSource by observing if it has a connect function. Cannot
    // be checked as an `instanceof DataSource` since people could create their own sources
    // that match the interface, but don't extend DataSource.
    return value && typeof value.connect === 'function';
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS1zb3VyY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2NvbGxlY3Rpb25zL2RhdGEtc291cmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQVdBLE1BQU0sT0FBZ0IsVUFBVTtDQW1CL0I7Ozs7Ozs7Ozs7O0lBVkMsK0RBQXlGOzs7Ozs7Ozs7O0lBU3pGLGtFQUE4RDs7Ozs7OztBQUloRSxNQUFNLFVBQVUsWUFBWSxDQUFDLEtBQVU7SUFDckMsdUZBQXVGO0lBQ3ZGLHVGQUF1RjtJQUN2Rix5REFBeUQ7SUFDekQsT0FBTyxLQUFLLElBQUksT0FBTyxLQUFLLENBQUMsT0FBTyxLQUFLLFVBQVUsQ0FBQztBQUN0RCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XG5pbXBvcnQge0NvbGxlY3Rpb25WaWV3ZXJ9IGZyb20gJy4vY29sbGVjdGlvbi12aWV3ZXInO1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgRGF0YVNvdXJjZTxUPiB7XG4gIC8qKlxuICAgKiBDb25uZWN0cyBhIGNvbGxlY3Rpb24gdmlld2VyIChzdWNoIGFzIGEgZGF0YS10YWJsZSkgdG8gdGhpcyBkYXRhIHNvdXJjZS4gTm90ZSB0aGF0XG4gICAqIHRoZSBzdHJlYW0gcHJvdmlkZWQgd2lsbCBiZSBhY2Nlc3NlZCBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbiBhbmQgc2hvdWxkIG5vdCBkaXJlY3RseSBjaGFuZ2VcbiAgICogdmFsdWVzIHRoYXQgYXJlIGJvdW5kIGluIHRlbXBsYXRlIHZpZXdzLlxuICAgKiBAcGFyYW0gY29sbGVjdGlvblZpZXdlciBUaGUgY29tcG9uZW50IHRoYXQgZXhwb3NlcyBhIHZpZXcgb3ZlciB0aGUgZGF0YSBwcm92aWRlZCBieSB0aGlzXG4gICAqICAgICBkYXRhIHNvdXJjZS5cbiAgICogQHJldHVybnMgT2JzZXJ2YWJsZSB0aGF0IGVtaXRzIGEgbmV3IHZhbHVlIHdoZW4gdGhlIGRhdGEgY2hhbmdlcy5cbiAgICovXG4gIGFic3RyYWN0IGNvbm5lY3QoY29sbGVjdGlvblZpZXdlcjogQ29sbGVjdGlvblZpZXdlcik6IE9ic2VydmFibGU8VFtdIHwgUmVhZG9ubHlBcnJheTxUPj47XG5cbiAgLyoqXG4gICAqIERpc2Nvbm5lY3RzIGEgY29sbGVjdGlvbiB2aWV3ZXIgKHN1Y2ggYXMgYSBkYXRhLXRhYmxlKSBmcm9tIHRoaXMgZGF0YSBzb3VyY2UuIENhbiBiZSB1c2VkXG4gICAqIHRvIHBlcmZvcm0gYW55IGNsZWFuLXVwIG9yIHRlYXItZG93biBvcGVyYXRpb25zIHdoZW4gYSB2aWV3IGlzIGJlaW5nIGRlc3Ryb3llZC5cbiAgICpcbiAgICogQHBhcmFtIGNvbGxlY3Rpb25WaWV3ZXIgVGhlIGNvbXBvbmVudCB0aGF0IGV4cG9zZXMgYSB2aWV3IG92ZXIgdGhlIGRhdGEgcHJvdmlkZWQgYnkgdGhpc1xuICAgKiAgICAgZGF0YSBzb3VyY2UuXG4gICAqL1xuICBhYnN0cmFjdCBkaXNjb25uZWN0KGNvbGxlY3Rpb25WaWV3ZXI6IENvbGxlY3Rpb25WaWV3ZXIpOiB2b2lkO1xufVxuXG4vKiogQ2hlY2tzIHdoZXRoZXIgYW4gb2JqZWN0IGlzIGEgZGF0YSBzb3VyY2UuICovXG5leHBvcnQgZnVuY3Rpb24gaXNEYXRhU291cmNlKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBEYXRhU291cmNlPGFueT4ge1xuICAvLyBDaGVjayBpZiB0aGUgdmFsdWUgaXMgYSBEYXRhU291cmNlIGJ5IG9ic2VydmluZyBpZiBpdCBoYXMgYSBjb25uZWN0IGZ1bmN0aW9uLiBDYW5ub3RcbiAgLy8gYmUgY2hlY2tlZCBhcyBhbiBgaW5zdGFuY2VvZiBEYXRhU291cmNlYCBzaW5jZSBwZW9wbGUgY291bGQgY3JlYXRlIHRoZWlyIG93biBzb3VyY2VzXG4gIC8vIHRoYXQgbWF0Y2ggdGhlIGludGVyZmFjZSwgYnV0IGRvbid0IGV4dGVuZCBEYXRhU291cmNlLlxuICByZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlLmNvbm5lY3QgPT09ICdmdW5jdGlvbic7XG59XG4iXX0=