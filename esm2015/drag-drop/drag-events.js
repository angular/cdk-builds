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
 * Event emitted when the user starts dragging a draggable.
 * @record
 * @template T
 */
export function CdkDragStart() { }
if (false) {
    /**
     * Draggable that emitted the event.
     * @type {?}
     */
    CdkDragStart.prototype.source;
}
/**
 * Event emitted when the user releases an item, before any animations have started.
 * @record
 * @template T
 */
export function CdkDragRelease() { }
if (false) {
    /**
     * Draggable that emitted the event.
     * @type {?}
     */
    CdkDragRelease.prototype.source;
}
/**
 * Event emitted when the user stops dragging a draggable.
 * @record
 * @template T
 */
export function CdkDragEnd() { }
if (false) {
    /**
     * Draggable that emitted the event.
     * @type {?}
     */
    CdkDragEnd.prototype.source;
    /**
     * Distance in pixels that the user has dragged since the drag sequence started.
     * @type {?}
     */
    CdkDragEnd.prototype.distance;
}
/**
 * Event emitted when the user moves an item into a new drop container.
 * @record
 * @template T, I
 */
export function CdkDragEnter() { }
if (false) {
    /**
     * Container into which the user has moved the item.
     * @type {?}
     */
    CdkDragEnter.prototype.container;
    /**
     * Item that was removed from the container.
     * @type {?}
     */
    CdkDragEnter.prototype.item;
    /**
     * Index at which the item has entered the container.
     * @type {?}
     */
    CdkDragEnter.prototype.currentIndex;
}
/**
 * Event emitted when the user removes an item from a
 * drop container by moving it into another one.
 * @record
 * @template T, I
 */
export function CdkDragExit() { }
if (false) {
    /**
     * Container from which the user has a removed an item.
     * @type {?}
     */
    CdkDragExit.prototype.container;
    /**
     * Item that was removed from the container.
     * @type {?}
     */
    CdkDragExit.prototype.item;
}
/**
 * Event emitted when the user drops a draggable item inside a drop container.
 * @record
 * @template T, O
 */
export function CdkDragDrop() { }
if (false) {
    /**
     * Index of the item when it was picked up.
     * @type {?}
     */
    CdkDragDrop.prototype.previousIndex;
    /**
     * Current index of the item.
     * @type {?}
     */
    CdkDragDrop.prototype.currentIndex;
    /**
     * Item that is being dropped.
     * @type {?}
     */
    CdkDragDrop.prototype.item;
    /**
     * Container in which the item was dropped.
     * @type {?}
     */
    CdkDragDrop.prototype.container;
    /**
     * Container from which the item was picked up. Can be the same as the `container`.
     * @type {?}
     */
    CdkDragDrop.prototype.previousContainer;
    /**
     * Whether the user's pointer was over the container when the item was dropped.
     * @type {?}
     */
    CdkDragDrop.prototype.isPointerOverContainer;
    /**
     * Distance in pixels that the user has dragged since the drag sequence started.
     * @type {?}
     */
    CdkDragDrop.prototype.distance;
}
/**
 * Event emitted as the user is dragging a draggable item.
 * @record
 * @template T
 */
export function CdkDragMove() { }
if (false) {
    /**
     * Item that is being dragged.
     * @type {?}
     */
    CdkDragMove.prototype.source;
    /**
     * Position of the user's pointer on the page.
     * @type {?}
     */
    CdkDragMove.prototype.pointerPosition;
    /**
     * Native event that is causing the dragging.
     * @type {?}
     */
    CdkDragMove.prototype.event;
    /**
     * Distance in pixels that the user has dragged since the drag sequence started.
     * @type {?}
     */
    CdkDragMove.prototype.distance;
    /**
     * Indicates the direction in which the user is dragging the element along each axis.
     * `1` means that the position is increasing (e.g. the user is moving to the right or downwards),
     * whereas `-1` means that it's decreasing (they're moving to the left or upwards). `0` means
     * that the position hasn't changed.
     * @type {?}
     */
    CdkDragMove.prototype.delta;
}
/**
 * Event emitted when the user swaps the position of two drag items.
 * @record
 * @template T, I
 */
export function CdkDragSortEvent() { }
if (false) {
    /**
     * Index from which the item was sorted previously.
     * @type {?}
     */
    CdkDragSortEvent.prototype.previousIndex;
    /**
     * Index that the item is currently in.
     * @type {?}
     */
    CdkDragSortEvent.prototype.currentIndex;
    /**
     * Container that the item belongs to.
     * @type {?}
     */
    CdkDragSortEvent.prototype.container;
    /**
     * Item that is being sorted.
     * @type {?}
     */
    CdkDragSortEvent.prototype.item;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1ldmVudHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2RyYWctZHJvcC9kcmFnLWV2ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7O0FBWUEsa0NBR0M7Ozs7OztJQURDLDhCQUFtQjs7Ozs7OztBQUlyQixvQ0FHQzs7Ozs7O0lBREMsZ0NBQW1COzs7Ozs7O0FBSXJCLGdDQUtDOzs7Ozs7SUFIQyw0QkFBbUI7Ozs7O0lBRW5CLDhCQUFpQzs7Ozs7OztBQUluQyxrQ0FPQzs7Ozs7O0lBTEMsaUNBQTBCOzs7OztJQUUxQiw0QkFBaUI7Ozs7O0lBRWpCLG9DQUFxQjs7Ozs7Ozs7QUFPdkIsaUNBS0M7Ozs7OztJQUhDLGdDQUEwQjs7Ozs7SUFFMUIsMkJBQWlCOzs7Ozs7O0FBS25CLGlDQWVDOzs7Ozs7SUFiQyxvQ0FBc0I7Ozs7O0lBRXRCLG1DQUFxQjs7Ozs7SUFFckIsMkJBQWM7Ozs7O0lBRWQsZ0NBQTBCOzs7OztJQUUxQix3Q0FBa0M7Ozs7O0lBRWxDLDZDQUFnQzs7Ozs7SUFFaEMsK0JBQWlDOzs7Ozs7O0FBSW5DLGlDQWdCQzs7Ozs7O0lBZEMsNkJBQW1COzs7OztJQUVuQixzQ0FBd0M7Ozs7O0lBRXhDLDRCQUErQjs7Ozs7SUFFL0IsK0JBQWlDOzs7Ozs7OztJQU9qQyw0QkFBc0M7Ozs7Ozs7QUFJeEMsc0NBU0M7Ozs7OztJQVBDLHlDQUFzQjs7Ozs7SUFFdEIsd0NBQXFCOzs7OztJQUVyQixxQ0FBMEI7Ozs7O0lBRTFCLGdDQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0Nka0RyYWd9IGZyb20gJy4vZGlyZWN0aXZlcy9kcmFnJztcbmltcG9ydCB7Q2RrRHJvcExpc3R9IGZyb20gJy4vZGlyZWN0aXZlcy9kcm9wLWxpc3QnO1xuXG4vKiogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSB1c2VyIHN0YXJ0cyBkcmFnZ2luZyBhIGRyYWdnYWJsZS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2RrRHJhZ1N0YXJ0PFQgPSBhbnk+IHtcbiAgLyoqIERyYWdnYWJsZSB0aGF0IGVtaXR0ZWQgdGhlIGV2ZW50LiAqL1xuICBzb3VyY2U6IENka0RyYWc8VD47XG59XG5cbi8qKiBFdmVudCBlbWl0dGVkIHdoZW4gdGhlIHVzZXIgcmVsZWFzZXMgYW4gaXRlbSwgYmVmb3JlIGFueSBhbmltYXRpb25zIGhhdmUgc3RhcnRlZC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2RrRHJhZ1JlbGVhc2U8VCA9IGFueT4ge1xuICAvKiogRHJhZ2dhYmxlIHRoYXQgZW1pdHRlZCB0aGUgZXZlbnQuICovXG4gIHNvdXJjZTogQ2RrRHJhZzxUPjtcbn1cblxuLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiB0aGUgdXNlciBzdG9wcyBkcmFnZ2luZyBhIGRyYWdnYWJsZS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2RrRHJhZ0VuZDxUID0gYW55PiB7XG4gIC8qKiBEcmFnZ2FibGUgdGhhdCBlbWl0dGVkIHRoZSBldmVudC4gKi9cbiAgc291cmNlOiBDZGtEcmFnPFQ+O1xuICAvKiogRGlzdGFuY2UgaW4gcGl4ZWxzIHRoYXQgdGhlIHVzZXIgaGFzIGRyYWdnZWQgc2luY2UgdGhlIGRyYWcgc2VxdWVuY2Ugc3RhcnRlZC4gKi9cbiAgZGlzdGFuY2U6IHt4OiBudW1iZXIsIHk6IG51bWJlcn07XG59XG5cbi8qKiBFdmVudCBlbWl0dGVkIHdoZW4gdGhlIHVzZXIgbW92ZXMgYW4gaXRlbSBpbnRvIGEgbmV3IGRyb3AgY29udGFpbmVyLiAqL1xuZXhwb3J0IGludGVyZmFjZSBDZGtEcmFnRW50ZXI8VCA9IGFueSwgSSA9IFQ+IHtcbiAgLyoqIENvbnRhaW5lciBpbnRvIHdoaWNoIHRoZSB1c2VyIGhhcyBtb3ZlZCB0aGUgaXRlbS4gKi9cbiAgY29udGFpbmVyOiBDZGtEcm9wTGlzdDxUPjtcbiAgLyoqIEl0ZW0gdGhhdCB3YXMgcmVtb3ZlZCBmcm9tIHRoZSBjb250YWluZXIuICovXG4gIGl0ZW06IENka0RyYWc8ST47XG4gIC8qKiBJbmRleCBhdCB3aGljaCB0aGUgaXRlbSBoYXMgZW50ZXJlZCB0aGUgY29udGFpbmVyLiAqL1xuICBjdXJyZW50SW5kZXg6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBFdmVudCBlbWl0dGVkIHdoZW4gdGhlIHVzZXIgcmVtb3ZlcyBhbiBpdGVtIGZyb20gYVxuICogZHJvcCBjb250YWluZXIgYnkgbW92aW5nIGl0IGludG8gYW5vdGhlciBvbmUuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2RrRHJhZ0V4aXQ8VCA9IGFueSwgSSA9IFQ+IHtcbiAgLyoqIENvbnRhaW5lciBmcm9tIHdoaWNoIHRoZSB1c2VyIGhhcyBhIHJlbW92ZWQgYW4gaXRlbS4gKi9cbiAgY29udGFpbmVyOiBDZGtEcm9wTGlzdDxUPjtcbiAgLyoqIEl0ZW0gdGhhdCB3YXMgcmVtb3ZlZCBmcm9tIHRoZSBjb250YWluZXIuICovXG4gIGl0ZW06IENka0RyYWc8ST47XG59XG5cblxuLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiB0aGUgdXNlciBkcm9wcyBhIGRyYWdnYWJsZSBpdGVtIGluc2lkZSBhIGRyb3AgY29udGFpbmVyLiAqL1xuZXhwb3J0IGludGVyZmFjZSBDZGtEcmFnRHJvcDxULCBPID0gVD4ge1xuICAvKiogSW5kZXggb2YgdGhlIGl0ZW0gd2hlbiBpdCB3YXMgcGlja2VkIHVwLiAqL1xuICBwcmV2aW91c0luZGV4OiBudW1iZXI7XG4gIC8qKiBDdXJyZW50IGluZGV4IG9mIHRoZSBpdGVtLiAqL1xuICBjdXJyZW50SW5kZXg6IG51bWJlcjtcbiAgLyoqIEl0ZW0gdGhhdCBpcyBiZWluZyBkcm9wcGVkLiAqL1xuICBpdGVtOiBDZGtEcmFnO1xuICAvKiogQ29udGFpbmVyIGluIHdoaWNoIHRoZSBpdGVtIHdhcyBkcm9wcGVkLiAqL1xuICBjb250YWluZXI6IENka0Ryb3BMaXN0PFQ+O1xuICAvKiogQ29udGFpbmVyIGZyb20gd2hpY2ggdGhlIGl0ZW0gd2FzIHBpY2tlZCB1cC4gQ2FuIGJlIHRoZSBzYW1lIGFzIHRoZSBgY29udGFpbmVyYC4gKi9cbiAgcHJldmlvdXNDb250YWluZXI6IENka0Ryb3BMaXN0PE8+O1xuICAvKiogV2hldGhlciB0aGUgdXNlcidzIHBvaW50ZXIgd2FzIG92ZXIgdGhlIGNvbnRhaW5lciB3aGVuIHRoZSBpdGVtIHdhcyBkcm9wcGVkLiAqL1xuICBpc1BvaW50ZXJPdmVyQ29udGFpbmVyOiBib29sZWFuO1xuICAvKiogRGlzdGFuY2UgaW4gcGl4ZWxzIHRoYXQgdGhlIHVzZXIgaGFzIGRyYWdnZWQgc2luY2UgdGhlIGRyYWcgc2VxdWVuY2Ugc3RhcnRlZC4gKi9cbiAgZGlzdGFuY2U6IHt4OiBudW1iZXIsIHk6IG51bWJlcn07XG59XG5cbi8qKiBFdmVudCBlbWl0dGVkIGFzIHRoZSB1c2VyIGlzIGRyYWdnaW5nIGEgZHJhZ2dhYmxlIGl0ZW0uICovXG5leHBvcnQgaW50ZXJmYWNlIENka0RyYWdNb3ZlPFQgPSBhbnk+IHtcbiAgLyoqIEl0ZW0gdGhhdCBpcyBiZWluZyBkcmFnZ2VkLiAqL1xuICBzb3VyY2U6IENka0RyYWc8VD47XG4gIC8qKiBQb3NpdGlvbiBvZiB0aGUgdXNlcidzIHBvaW50ZXIgb24gdGhlIHBhZ2UuICovXG4gIHBvaW50ZXJQb3NpdGlvbjoge3g6IG51bWJlciwgeTogbnVtYmVyfTtcbiAgLyoqIE5hdGl2ZSBldmVudCB0aGF0IGlzIGNhdXNpbmcgdGhlIGRyYWdnaW5nLiAqL1xuICBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQ7XG4gIC8qKiBEaXN0YW5jZSBpbiBwaXhlbHMgdGhhdCB0aGUgdXNlciBoYXMgZHJhZ2dlZCBzaW5jZSB0aGUgZHJhZyBzZXF1ZW5jZSBzdGFydGVkLiAqL1xuICBkaXN0YW5jZToge3g6IG51bWJlciwgeTogbnVtYmVyfTtcbiAgLyoqXG4gICAqIEluZGljYXRlcyB0aGUgZGlyZWN0aW9uIGluIHdoaWNoIHRoZSB1c2VyIGlzIGRyYWdnaW5nIHRoZSBlbGVtZW50IGFsb25nIGVhY2ggYXhpcy5cbiAgICogYDFgIG1lYW5zIHRoYXQgdGhlIHBvc2l0aW9uIGlzIGluY3JlYXNpbmcgKGUuZy4gdGhlIHVzZXIgaXMgbW92aW5nIHRvIHRoZSByaWdodCBvciBkb3dud2FyZHMpLFxuICAgKiB3aGVyZWFzIGAtMWAgbWVhbnMgdGhhdCBpdCdzIGRlY3JlYXNpbmcgKHRoZXkncmUgbW92aW5nIHRvIHRoZSBsZWZ0IG9yIHVwd2FyZHMpLiBgMGAgbWVhbnNcbiAgICogdGhhdCB0aGUgcG9zaXRpb24gaGFzbid0IGNoYW5nZWQuXG4gICAqL1xuICBkZWx0YToge3g6IC0xIHwgMCB8IDEsIHk6IC0xIHwgMCB8IDF9O1xufVxuXG4vKiogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSB1c2VyIHN3YXBzIHRoZSBwb3NpdGlvbiBvZiB0d28gZHJhZyBpdGVtcy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2RrRHJhZ1NvcnRFdmVudDxUID0gYW55LCBJID0gVD4ge1xuICAvKiogSW5kZXggZnJvbSB3aGljaCB0aGUgaXRlbSB3YXMgc29ydGVkIHByZXZpb3VzbHkuICovXG4gIHByZXZpb3VzSW5kZXg6IG51bWJlcjtcbiAgLyoqIEluZGV4IHRoYXQgdGhlIGl0ZW0gaXMgY3VycmVudGx5IGluLiAqL1xuICBjdXJyZW50SW5kZXg6IG51bWJlcjtcbiAgLyoqIENvbnRhaW5lciB0aGF0IHRoZSBpdGVtIGJlbG9uZ3MgdG8uICovXG4gIGNvbnRhaW5lcjogQ2RrRHJvcExpc3Q8VD47XG4gIC8qKiBJdGVtIHRoYXQgaXMgYmVpbmcgc29ydGVkLiAqL1xuICBpdGVtOiBDZGtEcmFnPEk+O1xufVxuIl19