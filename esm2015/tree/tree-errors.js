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
 * Returns an error to be thrown when there is no usable data.
 * \@docs-private
 * @return {?}
 */
export function getTreeNoValidDataSourceError() {
    return Error(`A valid data source must be provided.`);
}
/**
 * Returns an error to be thrown when there are multiple nodes that are missing a when function.
 * \@docs-private
 * @return {?}
 */
export function getTreeMultipleDefaultNodeDefsError() {
    return Error(`There can only be one default row without a when predicate function.`);
}
/**
 * Returns an error to be thrown when there are no matching node defs for a particular set of data.
 * \@docs-private
 * @return {?}
 */
export function getTreeMissingMatchingNodeDefError() {
    return Error(`Could not find a matching node definition for the provided node data.`);
}
/**
 * Returns an error to be thrown when there are tree control.
 * \@docs-private
 * @return {?}
 */
export function getTreeControlMissingError() {
    return Error(`Could not find a tree control for the tree.`);
}
/**
 * Returns an error to be thrown when tree control did not implement functions for flat/nested node.
 * \@docs-private
 * @return {?}
 */
export function getTreeControlFunctionsMissingError() {
    return Error(`Could not find functions for nested/flat tree in tree control.`);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS1lcnJvcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RyZWUvdHJlZS1lcnJvcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQVlBLE1BQU0sVUFBVSw2QkFBNkI7SUFDM0MsT0FBTyxLQUFLLENBQUMsdUNBQXVDLENBQUMsQ0FBQztBQUN4RCxDQUFDOzs7Ozs7QUFNRCxNQUFNLFVBQVUsbUNBQW1DO0lBQ2pELE9BQU8sS0FBSyxDQUFDLHNFQUFzRSxDQUFDLENBQUM7QUFDdkYsQ0FBQzs7Ozs7O0FBTUQsTUFBTSxVQUFVLGtDQUFrQztJQUNoRCxPQUFPLEtBQUssQ0FBQyx1RUFBdUUsQ0FBQyxDQUFDO0FBQ3hGLENBQUM7Ozs7OztBQU1ELE1BQU0sVUFBVSwwQkFBMEI7SUFDeEMsT0FBTyxLQUFLLENBQUMsNkNBQTZDLENBQUMsQ0FBQztBQUM5RCxDQUFDOzs7Ozs7QUFNRCxNQUFNLFVBQVUsbUNBQW1DO0lBQ2pELE9BQU8sS0FBSyxDQUFDLGdFQUFnRSxDQUFDLENBQUM7QUFDakYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIFJldHVybnMgYW4gZXJyb3IgdG8gYmUgdGhyb3duIHdoZW4gdGhlcmUgaXMgbm8gdXNhYmxlIGRhdGEuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUcmVlTm9WYWxpZERhdGFTb3VyY2VFcnJvcigpIHtcbiAgcmV0dXJuIEVycm9yKGBBIHZhbGlkIGRhdGEgc291cmNlIG11c3QgYmUgcHJvdmlkZWQuYCk7XG59XG5cbi8qKlxuICogUmV0dXJucyBhbiBlcnJvciB0byBiZSB0aHJvd24gd2hlbiB0aGVyZSBhcmUgbXVsdGlwbGUgbm9kZXMgdGhhdCBhcmUgbWlzc2luZyBhIHdoZW4gZnVuY3Rpb24uXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUcmVlTXVsdGlwbGVEZWZhdWx0Tm9kZURlZnNFcnJvcigpIHtcbiAgcmV0dXJuIEVycm9yKGBUaGVyZSBjYW4gb25seSBiZSBvbmUgZGVmYXVsdCByb3cgd2l0aG91dCBhIHdoZW4gcHJlZGljYXRlIGZ1bmN0aW9uLmApO1xufVxuXG4vKipcbiAqIFJldHVybnMgYW4gZXJyb3IgdG8gYmUgdGhyb3duIHdoZW4gdGhlcmUgYXJlIG5vIG1hdGNoaW5nIG5vZGUgZGVmcyBmb3IgYSBwYXJ0aWN1bGFyIHNldCBvZiBkYXRhLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VHJlZU1pc3NpbmdNYXRjaGluZ05vZGVEZWZFcnJvcigpIHtcbiAgcmV0dXJuIEVycm9yKGBDb3VsZCBub3QgZmluZCBhIG1hdGNoaW5nIG5vZGUgZGVmaW5pdGlvbiBmb3IgdGhlIHByb3ZpZGVkIG5vZGUgZGF0YS5gKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFuIGVycm9yIHRvIGJlIHRocm93biB3aGVuIHRoZXJlIGFyZSB0cmVlIGNvbnRyb2wuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUcmVlQ29udHJvbE1pc3NpbmdFcnJvcigpIHtcbiAgcmV0dXJuIEVycm9yKGBDb3VsZCBub3QgZmluZCBhIHRyZWUgY29udHJvbCBmb3IgdGhlIHRyZWUuYCk7XG59XG5cbi8qKlxuICogUmV0dXJucyBhbiBlcnJvciB0byBiZSB0aHJvd24gd2hlbiB0cmVlIGNvbnRyb2wgZGlkIG5vdCBpbXBsZW1lbnQgZnVuY3Rpb25zIGZvciBmbGF0L25lc3RlZCBub2RlLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VHJlZUNvbnRyb2xGdW5jdGlvbnNNaXNzaW5nRXJyb3IoKSB7XG4gIHJldHVybiBFcnJvcihgQ291bGQgbm90IGZpbmQgZnVuY3Rpb25zIGZvciBuZXN0ZWQvZmxhdCB0cmVlIGluIHRyZWUgY29udHJvbC5gKTtcbn1cbiJdfQ==