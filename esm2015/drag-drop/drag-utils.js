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
 * Moves an item one index in an array to another.
 * @template T
 * @param {?} array Array in which to move the item.
 * @param {?} fromIndex Starting index of the item.
 * @param {?} toIndex Index to which the item should be moved.
 * @return {?}
 */
export function moveItemInArray(array, fromIndex, toIndex) {
    /** @type {?} */
    const from = clamp(fromIndex, array.length - 1);
    /** @type {?} */
    const to = clamp(toIndex, array.length - 1);
    if (from === to) {
        return;
    }
    /** @type {?} */
    const target = array[from];
    /** @type {?} */
    const delta = to < from ? -1 : 1;
    for (let i = from; i !== to; i += delta) {
        array[i] = array[i + delta];
    }
    array[to] = target;
}
/**
 * Moves an item from one array to another.
 * @template T
 * @param {?} currentArray Array from which to transfer the item.
 * @param {?} targetArray Array into which to put the item.
 * @param {?} currentIndex Index of the item in its current array.
 * @param {?} targetIndex Index at which to insert the item.
 * @return {?}
 */
export function transferArrayItem(currentArray, targetArray, currentIndex, targetIndex) {
    /** @type {?} */
    const from = clamp(currentIndex, currentArray.length - 1);
    /** @type {?} */
    const to = clamp(targetIndex, targetArray.length);
    if (currentArray.length) {
        targetArray.splice(to, 0, currentArray.splice(from, 1)[0]);
    }
}
/**
 * Copies an item from one array to another, leaving it in its
 * original position in current array.
 * @template T
 * @param {?} currentArray Array from which to copy the item.
 * @param {?} targetArray Array into which is copy the item.
 * @param {?} currentIndex Index of the item in its current array.
 * @param {?} targetIndex Index at which to insert the item.
 *
 * @return {?}
 */
export function copyArrayItem(currentArray, targetArray, currentIndex, targetIndex) {
    /** @type {?} */
    const to = clamp(targetIndex, targetArray.length);
    if (currentArray.length) {
        targetArray.splice(to, 0, currentArray[currentIndex]);
    }
}
/**
 * Clamps a number between zero and a maximum.
 * @param {?} value
 * @param {?} max
 * @return {?}
 */
function clamp(value, max) {
    return Math.max(0, Math.min(max, value));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy11dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2RyYWctdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWNBLE1BQU0sVUFBVSxlQUFlLENBQVUsS0FBVSxFQUFFLFNBQWlCLEVBQUUsT0FBZTs7VUFDL0UsSUFBSSxHQUFHLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7O1VBQ3pDLEVBQUUsR0FBRyxLQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBRTNDLElBQUksSUFBSSxLQUFLLEVBQUUsRUFBRTtRQUNmLE9BQU87S0FDUjs7VUFFSyxNQUFNLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQzs7VUFDcEIsS0FBSyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRWhDLEtBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxJQUFJLEtBQUssRUFBRTtRQUN2QyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQztLQUM3QjtJQUVELEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUM7QUFDckIsQ0FBQzs7Ozs7Ozs7OztBQVVELE1BQU0sVUFBVSxpQkFBaUIsQ0FBVSxZQUFpQixFQUNqQixXQUFnQixFQUNoQixZQUFvQixFQUNwQixXQUFtQjs7VUFDdEQsSUFBSSxHQUFHLEtBQUssQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7O1VBQ25ELEVBQUUsR0FBRyxLQUFLLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxNQUFNLENBQUM7SUFFakQsSUFBSSxZQUFZLENBQUMsTUFBTSxFQUFFO1FBQ3ZCLFdBQVcsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzVEO0FBQ0gsQ0FBQzs7Ozs7Ozs7Ozs7O0FBV0QsTUFBTSxVQUFVLGFBQWEsQ0FBVSxZQUFpQixFQUNqQixXQUFnQixFQUNoQixZQUFvQixFQUNwQixXQUFtQjs7VUFDbEQsRUFBRSxHQUFHLEtBQUssQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLE1BQU0sQ0FBQztJQUVqRCxJQUFJLFlBQVksQ0FBQyxNQUFNLEVBQUU7UUFDdkIsV0FBVyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLFlBQVksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO0tBQ3ZEO0FBQ0gsQ0FBQzs7Ozs7OztBQUdELFNBQVMsS0FBSyxDQUFDLEtBQWEsRUFBRSxHQUFXO0lBQ3ZDLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUMzQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogTW92ZXMgYW4gaXRlbSBvbmUgaW5kZXggaW4gYW4gYXJyYXkgdG8gYW5vdGhlci5cbiAqIEBwYXJhbSBhcnJheSBBcnJheSBpbiB3aGljaCB0byBtb3ZlIHRoZSBpdGVtLlxuICogQHBhcmFtIGZyb21JbmRleCBTdGFydGluZyBpbmRleCBvZiB0aGUgaXRlbS5cbiAqIEBwYXJhbSB0b0luZGV4IEluZGV4IHRvIHdoaWNoIHRoZSBpdGVtIHNob3VsZCBiZSBtb3ZlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1vdmVJdGVtSW5BcnJheTxUID0gYW55PihhcnJheTogVFtdLCBmcm9tSW5kZXg6IG51bWJlciwgdG9JbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGZyb20gPSBjbGFtcChmcm9tSW5kZXgsIGFycmF5Lmxlbmd0aCAtIDEpO1xuICBjb25zdCB0byA9IGNsYW1wKHRvSW5kZXgsIGFycmF5Lmxlbmd0aCAtIDEpO1xuXG4gIGlmIChmcm9tID09PSB0bykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHRhcmdldCA9IGFycmF5W2Zyb21dO1xuICBjb25zdCBkZWx0YSA9IHRvIDwgZnJvbSA/IC0xIDogMTtcblxuICBmb3IgKGxldCBpID0gZnJvbTsgaSAhPT0gdG87IGkgKz0gZGVsdGEpIHtcbiAgICBhcnJheVtpXSA9IGFycmF5W2kgKyBkZWx0YV07XG4gIH1cblxuICBhcnJheVt0b10gPSB0YXJnZXQ7XG59XG5cblxuLyoqXG4gKiBNb3ZlcyBhbiBpdGVtIGZyb20gb25lIGFycmF5IHRvIGFub3RoZXIuXG4gKiBAcGFyYW0gY3VycmVudEFycmF5IEFycmF5IGZyb20gd2hpY2ggdG8gdHJhbnNmZXIgdGhlIGl0ZW0uXG4gKiBAcGFyYW0gdGFyZ2V0QXJyYXkgQXJyYXkgaW50byB3aGljaCB0byBwdXQgdGhlIGl0ZW0uXG4gKiBAcGFyYW0gY3VycmVudEluZGV4IEluZGV4IG9mIHRoZSBpdGVtIGluIGl0cyBjdXJyZW50IGFycmF5LlxuICogQHBhcmFtIHRhcmdldEluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGluc2VydCB0aGUgaXRlbS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zZmVyQXJyYXlJdGVtPFQgPSBhbnk+KGN1cnJlbnRBcnJheTogVFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldEFycmF5OiBUW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudEluZGV4OiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0SW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBmcm9tID0gY2xhbXAoY3VycmVudEluZGV4LCBjdXJyZW50QXJyYXkubGVuZ3RoIC0gMSk7XG4gIGNvbnN0IHRvID0gY2xhbXAodGFyZ2V0SW5kZXgsIHRhcmdldEFycmF5Lmxlbmd0aCk7XG5cbiAgaWYgKGN1cnJlbnRBcnJheS5sZW5ndGgpIHtcbiAgICB0YXJnZXRBcnJheS5zcGxpY2UodG8sIDAsIGN1cnJlbnRBcnJheS5zcGxpY2UoZnJvbSwgMSlbMF0pO1xuICB9XG59XG5cbi8qKlxuICogQ29waWVzIGFuIGl0ZW0gZnJvbSBvbmUgYXJyYXkgdG8gYW5vdGhlciwgbGVhdmluZyBpdCBpbiBpdHNcbiAqIG9yaWdpbmFsIHBvc2l0aW9uIGluIGN1cnJlbnQgYXJyYXkuXG4gKiBAcGFyYW0gY3VycmVudEFycmF5IEFycmF5IGZyb20gd2hpY2ggdG8gY29weSB0aGUgaXRlbS5cbiAqIEBwYXJhbSB0YXJnZXRBcnJheSBBcnJheSBpbnRvIHdoaWNoIGlzIGNvcHkgdGhlIGl0ZW0uXG4gKiBAcGFyYW0gY3VycmVudEluZGV4IEluZGV4IG9mIHRoZSBpdGVtIGluIGl0cyBjdXJyZW50IGFycmF5LlxuICogQHBhcmFtIHRhcmdldEluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGluc2VydCB0aGUgaXRlbS5cbiAqXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb3B5QXJyYXlJdGVtPFQgPSBhbnk+KGN1cnJlbnRBcnJheTogVFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0QXJyYXk6IFRbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRJbmRleDogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0SW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCB0byA9IGNsYW1wKHRhcmdldEluZGV4LCB0YXJnZXRBcnJheS5sZW5ndGgpO1xuXG4gIGlmIChjdXJyZW50QXJyYXkubGVuZ3RoKSB7XG4gICAgdGFyZ2V0QXJyYXkuc3BsaWNlKHRvLCAwLCBjdXJyZW50QXJyYXlbY3VycmVudEluZGV4XSk7XG4gIH1cbn1cblxuLyoqIENsYW1wcyBhIG51bWJlciBiZXR3ZWVuIHplcm8gYW5kIGEgbWF4aW11bS4gKi9cbmZ1bmN0aW9uIGNsYW1wKHZhbHVlOiBudW1iZXIsIG1heDogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuIE1hdGgubWF4KDAsIE1hdGgubWluKG1heCwgdmFsdWUpKTtcbn1cbiJdfQ==