/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** Gets a mutable version of an element's bounding `ClientRect`. */
export function getMutableClientRect(element) {
    const clientRect = element.getBoundingClientRect();
    // We need to clone the `clientRect` here, because all the values on it are readonly
    // and we need to be able to update them. Also we can't use a spread here, because
    // the values on a `ClientRect` aren't own properties. See:
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect#Notes
    return {
        top: clientRect.top,
        right: clientRect.right,
        bottom: clientRect.bottom,
        left: clientRect.left,
        width: clientRect.width,
        height: clientRect.height
    };
}
/**
 * Checks whether some coordinates are within a `ClientRect`.
 * @param clientRect ClientRect that is being checked.
 * @param x Coordinates along the X axis.
 * @param y Coordinates along the Y axis.
 */
export function isInsideClientRect(clientRect, x, y) {
    const { top, bottom, left, right } = clientRect;
    return y >= top && y <= bottom && x >= left && x <= right;
}
/**
 * Updates the top/left positions of a `ClientRect`, as well as their bottom/right counterparts.
 * @param clientRect `ClientRect` that should be updated.
 * @param top Amount to add to the `top` position.
 * @param left Amount to add to the `left` position.
 */
export function adjustClientRect(clientRect, top, left) {
    clientRect.top += top;
    clientRect.bottom = clientRect.top + clientRect.height;
    clientRect.left += left;
    clientRect.right = clientRect.left + clientRect.width;
}
/**
 * Checks whether the pointer coordinates are close to a ClientRect.
 * @param rect ClientRect to check against.
 * @param threshold Threshold around the ClientRect.
 * @param pointerX Coordinates along the X axis.
 * @param pointerY Coordinates along the Y axis.
 */
export function isPointerNearClientRect(rect, threshold, pointerX, pointerY) {
    const { top, right, bottom, left, width, height } = rect;
    const xThreshold = width * threshold;
    const yThreshold = height * threshold;
    return pointerY > top - yThreshold && pointerY < bottom + yThreshold &&
        pointerX > left - xThreshold && pointerX < right + xThreshold;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50LXJlY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2RyYWctZHJvcC9jbGllbnQtcmVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxvRUFBb0U7QUFDcEUsTUFBTSxVQUFVLG9CQUFvQixDQUFDLE9BQWdCO0lBQ25ELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO0lBRW5ELG9GQUFvRjtJQUNwRixrRkFBa0Y7SUFDbEYsMkRBQTJEO0lBQzNELHVGQUF1RjtJQUN2RixPQUFPO1FBQ0wsR0FBRyxFQUFFLFVBQVUsQ0FBQyxHQUFHO1FBQ25CLEtBQUssRUFBRSxVQUFVLENBQUMsS0FBSztRQUN2QixNQUFNLEVBQUUsVUFBVSxDQUFDLE1BQU07UUFDekIsSUFBSSxFQUFFLFVBQVUsQ0FBQyxJQUFJO1FBQ3JCLEtBQUssRUFBRSxVQUFVLENBQUMsS0FBSztRQUN2QixNQUFNLEVBQUUsVUFBVSxDQUFDLE1BQU07S0FDMUIsQ0FBQztBQUNKLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxrQkFBa0IsQ0FBQyxVQUFzQixFQUFFLENBQVMsRUFBRSxDQUFTO0lBQzdFLE1BQU0sRUFBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUMsR0FBRyxVQUFVLENBQUM7SUFDOUMsT0FBTyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxNQUFNLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxDQUFDO0FBQzVELENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxVQUFzQixFQUFFLEdBQVcsRUFBRSxJQUFZO0lBQ2hGLFVBQVUsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDO0lBQ3RCLFVBQVUsQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFDLEdBQUcsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDO0lBRXZELFVBQVUsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDO0lBQ3hCLFVBQVUsQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDLElBQUksR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDO0FBQ3hELENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsdUJBQXVCLENBQUMsSUFBZ0IsRUFDaEIsU0FBaUIsRUFDakIsUUFBZ0IsRUFDaEIsUUFBZ0I7SUFDdEQsTUFBTSxFQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFDLEdBQUcsSUFBSSxDQUFDO0lBQ3ZELE1BQU0sVUFBVSxHQUFHLEtBQUssR0FBRyxTQUFTLENBQUM7SUFDckMsTUFBTSxVQUFVLEdBQUcsTUFBTSxHQUFHLFNBQVMsQ0FBQztJQUV0QyxPQUFPLFFBQVEsR0FBRyxHQUFHLEdBQUcsVUFBVSxJQUFJLFFBQVEsR0FBRyxNQUFNLEdBQUcsVUFBVTtRQUM3RCxRQUFRLEdBQUcsSUFBSSxHQUFHLFVBQVUsSUFBSSxRQUFRLEdBQUcsS0FBSyxHQUFHLFVBQVUsQ0FBQztBQUN2RSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKiBHZXRzIGEgbXV0YWJsZSB2ZXJzaW9uIG9mIGFuIGVsZW1lbnQncyBib3VuZGluZyBgQ2xpZW50UmVjdGAuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TXV0YWJsZUNsaWVudFJlY3QoZWxlbWVudDogRWxlbWVudCk6IENsaWVudFJlY3Qge1xuICBjb25zdCBjbGllbnRSZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAvLyBXZSBuZWVkIHRvIGNsb25lIHRoZSBgY2xpZW50UmVjdGAgaGVyZSwgYmVjYXVzZSBhbGwgdGhlIHZhbHVlcyBvbiBpdCBhcmUgcmVhZG9ubHlcbiAgLy8gYW5kIHdlIG5lZWQgdG8gYmUgYWJsZSB0byB1cGRhdGUgdGhlbS4gQWxzbyB3ZSBjYW4ndCB1c2UgYSBzcHJlYWQgaGVyZSwgYmVjYXVzZVxuICAvLyB0aGUgdmFsdWVzIG9uIGEgYENsaWVudFJlY3RgIGFyZW4ndCBvd24gcHJvcGVydGllcy4gU2VlOlxuICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRWxlbWVudC9nZXRCb3VuZGluZ0NsaWVudFJlY3QjTm90ZXNcbiAgcmV0dXJuIHtcbiAgICB0b3A6IGNsaWVudFJlY3QudG9wLFxuICAgIHJpZ2h0OiBjbGllbnRSZWN0LnJpZ2h0LFxuICAgIGJvdHRvbTogY2xpZW50UmVjdC5ib3R0b20sXG4gICAgbGVmdDogY2xpZW50UmVjdC5sZWZ0LFxuICAgIHdpZHRoOiBjbGllbnRSZWN0LndpZHRoLFxuICAgIGhlaWdodDogY2xpZW50UmVjdC5oZWlnaHRcbiAgfTtcbn1cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciBzb21lIGNvb3JkaW5hdGVzIGFyZSB3aXRoaW4gYSBgQ2xpZW50UmVjdGAuXG4gKiBAcGFyYW0gY2xpZW50UmVjdCBDbGllbnRSZWN0IHRoYXQgaXMgYmVpbmcgY2hlY2tlZC5cbiAqIEBwYXJhbSB4IENvb3JkaW5hdGVzIGFsb25nIHRoZSBYIGF4aXMuXG4gKiBAcGFyYW0geSBDb29yZGluYXRlcyBhbG9uZyB0aGUgWSBheGlzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNJbnNpZGVDbGllbnRSZWN0KGNsaWVudFJlY3Q6IENsaWVudFJlY3QsIHg6IG51bWJlciwgeTogbnVtYmVyKSB7XG4gIGNvbnN0IHt0b3AsIGJvdHRvbSwgbGVmdCwgcmlnaHR9ID0gY2xpZW50UmVjdDtcbiAgcmV0dXJuIHkgPj0gdG9wICYmIHkgPD0gYm90dG9tICYmIHggPj0gbGVmdCAmJiB4IDw9IHJpZ2h0O1xufVxuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIHRvcC9sZWZ0IHBvc2l0aW9ucyBvZiBhIGBDbGllbnRSZWN0YCwgYXMgd2VsbCBhcyB0aGVpciBib3R0b20vcmlnaHQgY291bnRlcnBhcnRzLlxuICogQHBhcmFtIGNsaWVudFJlY3QgYENsaWVudFJlY3RgIHRoYXQgc2hvdWxkIGJlIHVwZGF0ZWQuXG4gKiBAcGFyYW0gdG9wIEFtb3VudCB0byBhZGQgdG8gdGhlIGB0b3BgIHBvc2l0aW9uLlxuICogQHBhcmFtIGxlZnQgQW1vdW50IHRvIGFkZCB0byB0aGUgYGxlZnRgIHBvc2l0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRqdXN0Q2xpZW50UmVjdChjbGllbnRSZWN0OiBDbGllbnRSZWN0LCB0b3A6IG51bWJlciwgbGVmdDogbnVtYmVyKSB7XG4gIGNsaWVudFJlY3QudG9wICs9IHRvcDtcbiAgY2xpZW50UmVjdC5ib3R0b20gPSBjbGllbnRSZWN0LnRvcCArIGNsaWVudFJlY3QuaGVpZ2h0O1xuXG4gIGNsaWVudFJlY3QubGVmdCArPSBsZWZ0O1xuICBjbGllbnRSZWN0LnJpZ2h0ID0gY2xpZW50UmVjdC5sZWZ0ICsgY2xpZW50UmVjdC53aWR0aDtcbn1cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciB0aGUgcG9pbnRlciBjb29yZGluYXRlcyBhcmUgY2xvc2UgdG8gYSBDbGllbnRSZWN0LlxuICogQHBhcmFtIHJlY3QgQ2xpZW50UmVjdCB0byBjaGVjayBhZ2FpbnN0LlxuICogQHBhcmFtIHRocmVzaG9sZCBUaHJlc2hvbGQgYXJvdW5kIHRoZSBDbGllbnRSZWN0LlxuICogQHBhcmFtIHBvaW50ZXJYIENvb3JkaW5hdGVzIGFsb25nIHRoZSBYIGF4aXMuXG4gKiBAcGFyYW0gcG9pbnRlclkgQ29vcmRpbmF0ZXMgYWxvbmcgdGhlIFkgYXhpcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUG9pbnRlck5lYXJDbGllbnRSZWN0KHJlY3Q6IENsaWVudFJlY3QsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyZXNob2xkOiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnRlclg6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2ludGVyWTogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IHt0b3AsIHJpZ2h0LCBib3R0b20sIGxlZnQsIHdpZHRoLCBoZWlnaHR9ID0gcmVjdDtcbiAgY29uc3QgeFRocmVzaG9sZCA9IHdpZHRoICogdGhyZXNob2xkO1xuICBjb25zdCB5VGhyZXNob2xkID0gaGVpZ2h0ICogdGhyZXNob2xkO1xuXG4gIHJldHVybiBwb2ludGVyWSA+IHRvcCAtIHlUaHJlc2hvbGQgJiYgcG9pbnRlclkgPCBib3R0b20gKyB5VGhyZXNob2xkICYmXG4gICAgICAgICBwb2ludGVyWCA+IGxlZnQgLSB4VGhyZXNob2xkICYmIHBvaW50ZXJYIDwgcmlnaHQgKyB4VGhyZXNob2xkO1xufVxuIl19