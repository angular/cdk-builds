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
 * Screenreaders will often fire fake mousedown events when a focusable element
 * is activated using the keyboard. We can typically distinguish between these faked
 * mousedown events and real mousedown events using the "buttons" property. While
 * real mousedowns will indicate the mouse button that was pressed (e.g. "1" for
 * the left mouse button), faked mousedowns will usually set the property value to 0.
 * @param {?} event
 * @return {?}
 */
export function isFakeMousedownFromScreenReader(event) {
    return event.buttons === 0;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmFrZS1tb3VzZWRvd24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2ExMXkvZmFrZS1tb3VzZWRvd24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFlQSxNQUFNLFVBQVUsK0JBQStCLENBQUMsS0FBaUI7SUFDL0QsT0FBTyxLQUFLLENBQUMsT0FBTyxLQUFLLENBQUMsQ0FBQztBQUM3QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogU2NyZWVucmVhZGVycyB3aWxsIG9mdGVuIGZpcmUgZmFrZSBtb3VzZWRvd24gZXZlbnRzIHdoZW4gYSBmb2N1c2FibGUgZWxlbWVudFxuICogaXMgYWN0aXZhdGVkIHVzaW5nIHRoZSBrZXlib2FyZC4gV2UgY2FuIHR5cGljYWxseSBkaXN0aW5ndWlzaCBiZXR3ZWVuIHRoZXNlIGZha2VkXG4gKiBtb3VzZWRvd24gZXZlbnRzIGFuZCByZWFsIG1vdXNlZG93biBldmVudHMgdXNpbmcgdGhlIFwiYnV0dG9uc1wiIHByb3BlcnR5LiBXaGlsZVxuICogcmVhbCBtb3VzZWRvd25zIHdpbGwgaW5kaWNhdGUgdGhlIG1vdXNlIGJ1dHRvbiB0aGF0IHdhcyBwcmVzc2VkIChlLmcuIFwiMVwiIGZvclxuICogdGhlIGxlZnQgbW91c2UgYnV0dG9uKSwgZmFrZWQgbW91c2Vkb3ducyB3aWxsIHVzdWFsbHkgc2V0IHRoZSBwcm9wZXJ0eSB2YWx1ZSB0byAwLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNGYWtlTW91c2Vkb3duRnJvbVNjcmVlblJlYWRlcihldmVudDogTW91c2VFdmVudCk6IGJvb2xlYW4ge1xuICByZXR1cm4gZXZlbnQuYnV0dG9ucyA9PT0gMDtcbn1cbiJdfQ==