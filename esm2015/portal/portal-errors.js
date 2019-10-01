/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Throws an exception when attempting to attach a null portal to a host.
 * \@docs-private
 * @return {?}
 */
export function throwNullPortalError() {
    throw Error('Must provide a portal to attach');
}
/**
 * Throws an exception when attempting to attach a portal to a host that is already attached.
 * \@docs-private
 * @return {?}
 */
export function throwPortalAlreadyAttachedError() {
    throw Error('Host already has a portal attached');
}
/**
 * Throws an exception when attempting to attach a portal to an already-disposed host.
 * \@docs-private
 * @return {?}
 */
export function throwPortalOutletAlreadyDisposedError() {
    throw Error('This PortalOutlet has already been disposed');
}
/**
 * Throws an exception when attempting to attach an unknown portal type.
 * \@docs-private
 * @return {?}
 */
export function throwUnknownPortalTypeError() {
    throw Error('Attempting to attach an unknown Portal type. BasePortalOutlet accepts either ' +
        'a ComponentPortal or a TemplatePortal.');
}
/**
 * Throws an exception when attempting to attach a portal to a null host.
 * \@docs-private
 * @return {?}
 */
export function throwNullPortalOutletError() {
    throw Error('Attempting to attach a portal to a null PortalOutlet');
}
/**
 * Throws an exception when attempting to detach a portal that is not attached.
 * \@docs-private
 * @return {?}
 */
export function throwNoPortalAttachedError() {
    throw Error('Attempting to detach a portal that is not attached to a host');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9ydGFsLWVycm9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvcG9ydGFsL3BvcnRhbC1lcnJvcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQVlBLE1BQU0sVUFBVSxvQkFBb0I7SUFDbEMsTUFBTSxLQUFLLENBQUMsaUNBQWlDLENBQUMsQ0FBQztBQUNqRCxDQUFDOzs7Ozs7QUFNRCxNQUFNLFVBQVUsK0JBQStCO0lBQzdDLE1BQU0sS0FBSyxDQUFDLG9DQUFvQyxDQUFDLENBQUM7QUFDcEQsQ0FBQzs7Ozs7O0FBTUQsTUFBTSxVQUFVLHFDQUFxQztJQUNuRCxNQUFNLEtBQUssQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFDO0FBQzdELENBQUM7Ozs7OztBQU1ELE1BQU0sVUFBVSwyQkFBMkI7SUFDekMsTUFBTSxLQUFLLENBQUMsK0VBQStFO1FBQy9FLHdDQUF3QyxDQUFDLENBQUM7QUFDeEQsQ0FBQzs7Ozs7O0FBTUQsTUFBTSxVQUFVLDBCQUEwQjtJQUN4QyxNQUFNLEtBQUssQ0FBQyxzREFBc0QsQ0FBQyxDQUFDO0FBQ3RFLENBQUM7Ozs7OztBQU1ELE1BQU0sVUFBVSwwQkFBMEI7SUFDeEMsTUFBTSxLQUFLLENBQUMsOERBQThELENBQUMsQ0FBQztBQUM5RSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogVGhyb3dzIGFuIGV4Y2VwdGlvbiB3aGVuIGF0dGVtcHRpbmcgdG8gYXR0YWNoIGEgbnVsbCBwb3J0YWwgdG8gYSBob3N0LlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gdGhyb3dOdWxsUG9ydGFsRXJyb3IoKSB7XG4gIHRocm93IEVycm9yKCdNdXN0IHByb3ZpZGUgYSBwb3J0YWwgdG8gYXR0YWNoJyk7XG59XG5cbi8qKlxuICogVGhyb3dzIGFuIGV4Y2VwdGlvbiB3aGVuIGF0dGVtcHRpbmcgdG8gYXR0YWNoIGEgcG9ydGFsIHRvIGEgaG9zdCB0aGF0IGlzIGFscmVhZHkgYXR0YWNoZWQuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0aHJvd1BvcnRhbEFscmVhZHlBdHRhY2hlZEVycm9yKCkge1xuICB0aHJvdyBFcnJvcignSG9zdCBhbHJlYWR5IGhhcyBhIHBvcnRhbCBhdHRhY2hlZCcpO1xufVxuXG4vKipcbiAqIFRocm93cyBhbiBleGNlcHRpb24gd2hlbiBhdHRlbXB0aW5nIHRvIGF0dGFjaCBhIHBvcnRhbCB0byBhbiBhbHJlYWR5LWRpc3Bvc2VkIGhvc3QuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0aHJvd1BvcnRhbE91dGxldEFscmVhZHlEaXNwb3NlZEVycm9yKCkge1xuICB0aHJvdyBFcnJvcignVGhpcyBQb3J0YWxPdXRsZXQgaGFzIGFscmVhZHkgYmVlbiBkaXNwb3NlZCcpO1xufVxuXG4vKipcbiAqIFRocm93cyBhbiBleGNlcHRpb24gd2hlbiBhdHRlbXB0aW5nIHRvIGF0dGFjaCBhbiB1bmtub3duIHBvcnRhbCB0eXBlLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gdGhyb3dVbmtub3duUG9ydGFsVHlwZUVycm9yKCkge1xuICB0aHJvdyBFcnJvcignQXR0ZW1wdGluZyB0byBhdHRhY2ggYW4gdW5rbm93biBQb3J0YWwgdHlwZS4gQmFzZVBvcnRhbE91dGxldCBhY2NlcHRzIGVpdGhlciAnICtcbiAgICAgICAgICAgICAgJ2EgQ29tcG9uZW50UG9ydGFsIG9yIGEgVGVtcGxhdGVQb3J0YWwuJyk7XG59XG5cbi8qKlxuICogVGhyb3dzIGFuIGV4Y2VwdGlvbiB3aGVuIGF0dGVtcHRpbmcgdG8gYXR0YWNoIGEgcG9ydGFsIHRvIGEgbnVsbCBob3N0LlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gdGhyb3dOdWxsUG9ydGFsT3V0bGV0RXJyb3IoKSB7XG4gIHRocm93IEVycm9yKCdBdHRlbXB0aW5nIHRvIGF0dGFjaCBhIHBvcnRhbCB0byBhIG51bGwgUG9ydGFsT3V0bGV0Jyk7XG59XG5cbi8qKlxuICogVGhyb3dzIGFuIGV4Y2VwdGlvbiB3aGVuIGF0dGVtcHRpbmcgdG8gZGV0YWNoIGEgcG9ydGFsIHRoYXQgaXMgbm90IGF0dGFjaGVkLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gdGhyb3dOb1BvcnRhbEF0dGFjaGVkRXJyb3IoKSB7XG4gIHRocm93IEVycm9yKCdBdHRlbXB0aW5nIHRvIGRldGFjaCBhIHBvcnRhbCB0aGF0IGlzIG5vdCBhdHRhY2hlZCB0byBhIGhvc3QnKTtcbn1cbiJdfQ==