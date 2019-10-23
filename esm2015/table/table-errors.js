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
 * Returns an error to be thrown when attempting to find an unexisting column.
 * \@docs-private
 * @param {?} id Id whose lookup failed.
 * @return {?}
 */
export function getTableUnknownColumnError(id) {
    return Error(`Could not find column with id "${id}".`);
}
/**
 * Returns an error to be thrown when two column definitions have the same name.
 * \@docs-private
 * @param {?} name
 * @return {?}
 */
export function getTableDuplicateColumnNameError(name) {
    return Error(`Duplicate column definition name provided: "${name}".`);
}
/**
 * Returns an error to be thrown when there are multiple rows that are missing a when function.
 * \@docs-private
 * @return {?}
 */
export function getTableMultipleDefaultRowDefsError() {
    return Error(`There can only be one default row without a when predicate function.`);
}
/**
 * Returns an error to be thrown when there are no matching row defs for a particular set of data.
 * \@docs-private
 * @param {?} data
 * @return {?}
 */
export function getTableMissingMatchingRowDefError(data) {
    return Error(`Could not find a matching row definition for the` +
        `provided row data: ${JSON.stringify(data)}`);
}
/**
 * Returns an error to be thrown when there is no row definitions present in the content.
 * \@docs-private
 * @return {?}
 */
export function getTableMissingRowDefsError() {
    return Error('Missing definitions for header, footer, and row; ' +
        'cannot determine which columns should be rendered.');
}
/**
 * Returns an error to be thrown when the data source does not match the compatible types.
 * \@docs-private
 * @return {?}
 */
export function getTableUnknownDataSourceError() {
    return Error(`Provided data source did not match an array, Observable, or DataSource`);
}
/**
 * Returns an error to be thrown when the text column cannot find a parent table to inject.
 * \@docs-private
 * @return {?}
 */
export function getTableTextColumnMissingParentTableError() {
    return Error(`Text column could not find a parent table for registration.`);
}
/**
 * Returns an error to be thrown when a table text column doesn't have a name.
 * \@docs-private
 * @return {?}
 */
export function getTableTextColumnMissingNameError() {
    return Error(`Table text column must have a name.`);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGUtZXJyb3JzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90YWJsZS90YWJsZS1lcnJvcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFhQSxNQUFNLFVBQVUsMEJBQTBCLENBQUMsRUFBVTtJQUNuRCxPQUFPLEtBQUssQ0FBQyxrQ0FBa0MsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUN6RCxDQUFDOzs7Ozs7O0FBTUQsTUFBTSxVQUFVLGdDQUFnQyxDQUFDLElBQVk7SUFDM0QsT0FBTyxLQUFLLENBQUMsK0NBQStDLElBQUksSUFBSSxDQUFDLENBQUM7QUFDeEUsQ0FBQzs7Ozs7O0FBTUQsTUFBTSxVQUFVLG1DQUFtQztJQUNqRCxPQUFPLEtBQUssQ0FBQyxzRUFBc0UsQ0FBQyxDQUFDO0FBQ3ZGLENBQUM7Ozs7Ozs7QUFNRCxNQUFNLFVBQVUsa0NBQWtDLENBQUMsSUFBUztJQUMxRCxPQUFPLEtBQUssQ0FBQyxrREFBa0Q7UUFDM0Qsc0JBQXNCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3BELENBQUM7Ozs7OztBQU1ELE1BQU0sVUFBVSwyQkFBMkI7SUFDekMsT0FBTyxLQUFLLENBQUMsbURBQW1EO1FBQzVELG9EQUFvRCxDQUFDLENBQUM7QUFDNUQsQ0FBQzs7Ozs7O0FBTUQsTUFBTSxVQUFVLDhCQUE4QjtJQUM1QyxPQUFPLEtBQUssQ0FBQyx3RUFBd0UsQ0FBQyxDQUFDO0FBQ3pGLENBQUM7Ozs7OztBQU1ELE1BQU0sVUFBVSx5Q0FBeUM7SUFDdkQsT0FBTyxLQUFLLENBQUMsNkRBQTZELENBQUMsQ0FBQztBQUM5RSxDQUFDOzs7Ozs7QUFNRCxNQUFNLFVBQVUsa0NBQWtDO0lBQ2hELE9BQU8sS0FBSyxDQUFDLHFDQUFxQyxDQUFDLENBQUM7QUFDdEQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIFJldHVybnMgYW4gZXJyb3IgdG8gYmUgdGhyb3duIHdoZW4gYXR0ZW1wdGluZyB0byBmaW5kIGFuIHVuZXhpc3RpbmcgY29sdW1uLlxuICogQHBhcmFtIGlkIElkIHdob3NlIGxvb2t1cCBmYWlsZWQuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUYWJsZVVua25vd25Db2x1bW5FcnJvcihpZDogc3RyaW5nKSB7XG4gIHJldHVybiBFcnJvcihgQ291bGQgbm90IGZpbmQgY29sdW1uIHdpdGggaWQgXCIke2lkfVwiLmApO1xufVxuXG4vKipcbiAqIFJldHVybnMgYW4gZXJyb3IgdG8gYmUgdGhyb3duIHdoZW4gdHdvIGNvbHVtbiBkZWZpbml0aW9ucyBoYXZlIHRoZSBzYW1lIG5hbWUuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUYWJsZUR1cGxpY2F0ZUNvbHVtbk5hbWVFcnJvcihuYW1lOiBzdHJpbmcpIHtcbiAgcmV0dXJuIEVycm9yKGBEdXBsaWNhdGUgY29sdW1uIGRlZmluaXRpb24gbmFtZSBwcm92aWRlZDogXCIke25hbWV9XCIuYCk7XG59XG5cbi8qKlxuICogUmV0dXJucyBhbiBlcnJvciB0byBiZSB0aHJvd24gd2hlbiB0aGVyZSBhcmUgbXVsdGlwbGUgcm93cyB0aGF0IGFyZSBtaXNzaW5nIGEgd2hlbiBmdW5jdGlvbi5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRhYmxlTXVsdGlwbGVEZWZhdWx0Um93RGVmc0Vycm9yKCkge1xuICByZXR1cm4gRXJyb3IoYFRoZXJlIGNhbiBvbmx5IGJlIG9uZSBkZWZhdWx0IHJvdyB3aXRob3V0IGEgd2hlbiBwcmVkaWNhdGUgZnVuY3Rpb24uYCk7XG59XG5cbi8qKlxuICogUmV0dXJucyBhbiBlcnJvciB0byBiZSB0aHJvd24gd2hlbiB0aGVyZSBhcmUgbm8gbWF0Y2hpbmcgcm93IGRlZnMgZm9yIGEgcGFydGljdWxhciBzZXQgb2YgZGF0YS5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRhYmxlTWlzc2luZ01hdGNoaW5nUm93RGVmRXJyb3IoZGF0YTogYW55KSB7XG4gIHJldHVybiBFcnJvcihgQ291bGQgbm90IGZpbmQgYSBtYXRjaGluZyByb3cgZGVmaW5pdGlvbiBmb3IgdGhlYCArXG4gICAgICBgcHJvdmlkZWQgcm93IGRhdGE6ICR7SlNPTi5zdHJpbmdpZnkoZGF0YSl9YCk7XG59XG5cbi8qKlxuICogUmV0dXJucyBhbiBlcnJvciB0byBiZSB0aHJvd24gd2hlbiB0aGVyZSBpcyBubyByb3cgZGVmaW5pdGlvbnMgcHJlc2VudCBpbiB0aGUgY29udGVudC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRhYmxlTWlzc2luZ1Jvd0RlZnNFcnJvcigpIHtcbiAgcmV0dXJuIEVycm9yKCdNaXNzaW5nIGRlZmluaXRpb25zIGZvciBoZWFkZXIsIGZvb3RlciwgYW5kIHJvdzsgJyArXG4gICAgICAnY2Fubm90IGRldGVybWluZSB3aGljaCBjb2x1bW5zIHNob3VsZCBiZSByZW5kZXJlZC4nKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFuIGVycm9yIHRvIGJlIHRocm93biB3aGVuIHRoZSBkYXRhIHNvdXJjZSBkb2VzIG5vdCBtYXRjaCB0aGUgY29tcGF0aWJsZSB0eXBlcy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRhYmxlVW5rbm93bkRhdGFTb3VyY2VFcnJvcigpIHtcbiAgcmV0dXJuIEVycm9yKGBQcm92aWRlZCBkYXRhIHNvdXJjZSBkaWQgbm90IG1hdGNoIGFuIGFycmF5LCBPYnNlcnZhYmxlLCBvciBEYXRhU291cmNlYCk7XG59XG5cbi8qKlxuICogUmV0dXJucyBhbiBlcnJvciB0byBiZSB0aHJvd24gd2hlbiB0aGUgdGV4dCBjb2x1bW4gY2Fubm90IGZpbmQgYSBwYXJlbnQgdGFibGUgdG8gaW5qZWN0LlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGFibGVUZXh0Q29sdW1uTWlzc2luZ1BhcmVudFRhYmxlRXJyb3IoKSB7XG4gIHJldHVybiBFcnJvcihgVGV4dCBjb2x1bW4gY291bGQgbm90IGZpbmQgYSBwYXJlbnQgdGFibGUgZm9yIHJlZ2lzdHJhdGlvbi5gKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFuIGVycm9yIHRvIGJlIHRocm93biB3aGVuIGEgdGFibGUgdGV4dCBjb2x1bW4gZG9lc24ndCBoYXZlIGEgbmFtZS5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRhYmxlVGV4dENvbHVtbk1pc3NpbmdOYW1lRXJyb3IoKSB7XG4gIHJldHVybiBFcnJvcihgVGFibGUgdGV4dCBjb2x1bW4gbXVzdCBoYXZlIGEgbmFtZS5gKTtcbn1cbiJdfQ==