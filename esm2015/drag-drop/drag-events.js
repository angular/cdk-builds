/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/drag-drop/drag-events.ts
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1ldmVudHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2RyYWctZHJvcC9kcmFnLWV2ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQVlBLGtDQUdDOzs7Ozs7SUFEQyw4QkFBbUI7Ozs7Ozs7QUFJckIsb0NBR0M7Ozs7OztJQURDLGdDQUFtQjs7Ozs7OztBQUlyQixnQ0FLQzs7Ozs7O0lBSEMsNEJBQW1COzs7OztJQUVuQiw4QkFBaUM7Ozs7Ozs7QUFJbkMsa0NBT0M7Ozs7OztJQUxDLGlDQUEwQjs7Ozs7SUFFMUIsNEJBQWlCOzs7OztJQUVqQixvQ0FBcUI7Ozs7Ozs7O0FBT3ZCLGlDQUtDOzs7Ozs7SUFIQyxnQ0FBMEI7Ozs7O0lBRTFCLDJCQUFpQjs7Ozs7OztBQUtuQixpQ0FlQzs7Ozs7O0lBYkMsb0NBQXNCOzs7OztJQUV0QixtQ0FBcUI7Ozs7O0lBRXJCLDJCQUFjOzs7OztJQUVkLGdDQUEwQjs7Ozs7SUFFMUIsd0NBQWtDOzs7OztJQUVsQyw2Q0FBZ0M7Ozs7O0lBRWhDLCtCQUFpQzs7Ozs7OztBQUluQyxpQ0FnQkM7Ozs7OztJQWRDLDZCQUFtQjs7Ozs7SUFFbkIsc0NBQXdDOzs7OztJQUV4Qyw0QkFBK0I7Ozs7O0lBRS9CLCtCQUFpQzs7Ozs7Ozs7SUFPakMsNEJBQXNDOzs7Ozs7O0FBSXhDLHNDQVNDOzs7Ozs7SUFQQyx5Q0FBc0I7Ozs7O0lBRXRCLHdDQUFxQjs7Ozs7SUFFckIscUNBQTBCOzs7OztJQUUxQixnQ0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDZGtEcmFnfSBmcm9tICcuL2RpcmVjdGl2ZXMvZHJhZyc7XG5pbXBvcnQge0Nka0Ryb3BMaXN0fSBmcm9tICcuL2RpcmVjdGl2ZXMvZHJvcC1saXN0JztcblxuLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiB0aGUgdXNlciBzdGFydHMgZHJhZ2dpbmcgYSBkcmFnZ2FibGUuICovXG5leHBvcnQgaW50ZXJmYWNlIENka0RyYWdTdGFydDxUID0gYW55PiB7XG4gIC8qKiBEcmFnZ2FibGUgdGhhdCBlbWl0dGVkIHRoZSBldmVudC4gKi9cbiAgc291cmNlOiBDZGtEcmFnPFQ+O1xufVxuXG4vKiogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSB1c2VyIHJlbGVhc2VzIGFuIGl0ZW0sIGJlZm9yZSBhbnkgYW5pbWF0aW9ucyBoYXZlIHN0YXJ0ZWQuICovXG5leHBvcnQgaW50ZXJmYWNlIENka0RyYWdSZWxlYXNlPFQgPSBhbnk+IHtcbiAgLyoqIERyYWdnYWJsZSB0aGF0IGVtaXR0ZWQgdGhlIGV2ZW50LiAqL1xuICBzb3VyY2U6IENka0RyYWc8VD47XG59XG5cbi8qKiBFdmVudCBlbWl0dGVkIHdoZW4gdGhlIHVzZXIgc3RvcHMgZHJhZ2dpbmcgYSBkcmFnZ2FibGUuICovXG5leHBvcnQgaW50ZXJmYWNlIENka0RyYWdFbmQ8VCA9IGFueT4ge1xuICAvKiogRHJhZ2dhYmxlIHRoYXQgZW1pdHRlZCB0aGUgZXZlbnQuICovXG4gIHNvdXJjZTogQ2RrRHJhZzxUPjtcbiAgLyoqIERpc3RhbmNlIGluIHBpeGVscyB0aGF0IHRoZSB1c2VyIGhhcyBkcmFnZ2VkIHNpbmNlIHRoZSBkcmFnIHNlcXVlbmNlIHN0YXJ0ZWQuICovXG4gIGRpc3RhbmNlOiB7eDogbnVtYmVyLCB5OiBudW1iZXJ9O1xufVxuXG4vKiogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSB1c2VyIG1vdmVzIGFuIGl0ZW0gaW50byBhIG5ldyBkcm9wIGNvbnRhaW5lci4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2RrRHJhZ0VudGVyPFQgPSBhbnksIEkgPSBUPiB7XG4gIC8qKiBDb250YWluZXIgaW50byB3aGljaCB0aGUgdXNlciBoYXMgbW92ZWQgdGhlIGl0ZW0uICovXG4gIGNvbnRhaW5lcjogQ2RrRHJvcExpc3Q8VD47XG4gIC8qKiBJdGVtIHRoYXQgd2FzIHJlbW92ZWQgZnJvbSB0aGUgY29udGFpbmVyLiAqL1xuICBpdGVtOiBDZGtEcmFnPEk+O1xuICAvKiogSW5kZXggYXQgd2hpY2ggdGhlIGl0ZW0gaGFzIGVudGVyZWQgdGhlIGNvbnRhaW5lci4gKi9cbiAgY3VycmVudEluZGV4OiBudW1iZXI7XG59XG5cbi8qKlxuICogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSB1c2VyIHJlbW92ZXMgYW4gaXRlbSBmcm9tIGFcbiAqIGRyb3AgY29udGFpbmVyIGJ5IG1vdmluZyBpdCBpbnRvIGFub3RoZXIgb25lLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIENka0RyYWdFeGl0PFQgPSBhbnksIEkgPSBUPiB7XG4gIC8qKiBDb250YWluZXIgZnJvbSB3aGljaCB0aGUgdXNlciBoYXMgYSByZW1vdmVkIGFuIGl0ZW0uICovXG4gIGNvbnRhaW5lcjogQ2RrRHJvcExpc3Q8VD47XG4gIC8qKiBJdGVtIHRoYXQgd2FzIHJlbW92ZWQgZnJvbSB0aGUgY29udGFpbmVyLiAqL1xuICBpdGVtOiBDZGtEcmFnPEk+O1xufVxuXG5cbi8qKiBFdmVudCBlbWl0dGVkIHdoZW4gdGhlIHVzZXIgZHJvcHMgYSBkcmFnZ2FibGUgaXRlbSBpbnNpZGUgYSBkcm9wIGNvbnRhaW5lci4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2RrRHJhZ0Ryb3A8VCwgTyA9IFQ+IHtcbiAgLyoqIEluZGV4IG9mIHRoZSBpdGVtIHdoZW4gaXQgd2FzIHBpY2tlZCB1cC4gKi9cbiAgcHJldmlvdXNJbmRleDogbnVtYmVyO1xuICAvKiogQ3VycmVudCBpbmRleCBvZiB0aGUgaXRlbS4gKi9cbiAgY3VycmVudEluZGV4OiBudW1iZXI7XG4gIC8qKiBJdGVtIHRoYXQgaXMgYmVpbmcgZHJvcHBlZC4gKi9cbiAgaXRlbTogQ2RrRHJhZztcbiAgLyoqIENvbnRhaW5lciBpbiB3aGljaCB0aGUgaXRlbSB3YXMgZHJvcHBlZC4gKi9cbiAgY29udGFpbmVyOiBDZGtEcm9wTGlzdDxUPjtcbiAgLyoqIENvbnRhaW5lciBmcm9tIHdoaWNoIHRoZSBpdGVtIHdhcyBwaWNrZWQgdXAuIENhbiBiZSB0aGUgc2FtZSBhcyB0aGUgYGNvbnRhaW5lcmAuICovXG4gIHByZXZpb3VzQ29udGFpbmVyOiBDZGtEcm9wTGlzdDxPPjtcbiAgLyoqIFdoZXRoZXIgdGhlIHVzZXIncyBwb2ludGVyIHdhcyBvdmVyIHRoZSBjb250YWluZXIgd2hlbiB0aGUgaXRlbSB3YXMgZHJvcHBlZC4gKi9cbiAgaXNQb2ludGVyT3ZlckNvbnRhaW5lcjogYm9vbGVhbjtcbiAgLyoqIERpc3RhbmNlIGluIHBpeGVscyB0aGF0IHRoZSB1c2VyIGhhcyBkcmFnZ2VkIHNpbmNlIHRoZSBkcmFnIHNlcXVlbmNlIHN0YXJ0ZWQuICovXG4gIGRpc3RhbmNlOiB7eDogbnVtYmVyLCB5OiBudW1iZXJ9O1xufVxuXG4vKiogRXZlbnQgZW1pdHRlZCBhcyB0aGUgdXNlciBpcyBkcmFnZ2luZyBhIGRyYWdnYWJsZSBpdGVtLiAqL1xuZXhwb3J0IGludGVyZmFjZSBDZGtEcmFnTW92ZTxUID0gYW55PiB7XG4gIC8qKiBJdGVtIHRoYXQgaXMgYmVpbmcgZHJhZ2dlZC4gKi9cbiAgc291cmNlOiBDZGtEcmFnPFQ+O1xuICAvKiogUG9zaXRpb24gb2YgdGhlIHVzZXIncyBwb2ludGVyIG9uIHRoZSBwYWdlLiAqL1xuICBwb2ludGVyUG9zaXRpb246IHt4OiBudW1iZXIsIHk6IG51bWJlcn07XG4gIC8qKiBOYXRpdmUgZXZlbnQgdGhhdCBpcyBjYXVzaW5nIHRoZSBkcmFnZ2luZy4gKi9cbiAgZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50O1xuICAvKiogRGlzdGFuY2UgaW4gcGl4ZWxzIHRoYXQgdGhlIHVzZXIgaGFzIGRyYWdnZWQgc2luY2UgdGhlIGRyYWcgc2VxdWVuY2Ugc3RhcnRlZC4gKi9cbiAgZGlzdGFuY2U6IHt4OiBudW1iZXIsIHk6IG51bWJlcn07XG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgdGhlIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgdXNlciBpcyBkcmFnZ2luZyB0aGUgZWxlbWVudCBhbG9uZyBlYWNoIGF4aXMuXG4gICAqIGAxYCBtZWFucyB0aGF0IHRoZSBwb3NpdGlvbiBpcyBpbmNyZWFzaW5nIChlLmcuIHRoZSB1c2VyIGlzIG1vdmluZyB0byB0aGUgcmlnaHQgb3IgZG93bndhcmRzKSxcbiAgICogd2hlcmVhcyBgLTFgIG1lYW5zIHRoYXQgaXQncyBkZWNyZWFzaW5nICh0aGV5J3JlIG1vdmluZyB0byB0aGUgbGVmdCBvciB1cHdhcmRzKS4gYDBgIG1lYW5zXG4gICAqIHRoYXQgdGhlIHBvc2l0aW9uIGhhc24ndCBjaGFuZ2VkLlxuICAgKi9cbiAgZGVsdGE6IHt4OiAtMSB8IDAgfCAxLCB5OiAtMSB8IDAgfCAxfTtcbn1cblxuLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiB0aGUgdXNlciBzd2FwcyB0aGUgcG9zaXRpb24gb2YgdHdvIGRyYWcgaXRlbXMuICovXG5leHBvcnQgaW50ZXJmYWNlIENka0RyYWdTb3J0RXZlbnQ8VCA9IGFueSwgSSA9IFQ+IHtcbiAgLyoqIEluZGV4IGZyb20gd2hpY2ggdGhlIGl0ZW0gd2FzIHNvcnRlZCBwcmV2aW91c2x5LiAqL1xuICBwcmV2aW91c0luZGV4OiBudW1iZXI7XG4gIC8qKiBJbmRleCB0aGF0IHRoZSBpdGVtIGlzIGN1cnJlbnRseSBpbi4gKi9cbiAgY3VycmVudEluZGV4OiBudW1iZXI7XG4gIC8qKiBDb250YWluZXIgdGhhdCB0aGUgaXRlbSBiZWxvbmdzIHRvLiAqL1xuICBjb250YWluZXI6IENka0Ryb3BMaXN0PFQ+O1xuICAvKiogSXRlbSB0aGF0IGlzIGJlaW5nIHNvcnRlZC4gKi9cbiAgaXRlbTogQ2RrRHJhZzxJPjtcbn1cbiJdfQ==