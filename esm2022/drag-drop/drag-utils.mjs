/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Moves an item one index in an array to another.
 * @param array Array in which to move the item.
 * @param fromIndex Starting index of the item.
 * @param toIndex Index to which the item should be moved.
 */
export function moveItemInArray(array, fromIndex, toIndex) {
    const from = clamp(fromIndex, array.length - 1);
    const to = clamp(toIndex, array.length - 1);
    if (from === to) {
        return;
    }
    const target = array[from];
    const delta = to < from ? -1 : 1;
    for (let i = from; i !== to; i += delta) {
        array[i] = array[i + delta];
    }
    array[to] = target;
}
/**
 * Moves an item from one array to another.
 * @param currentArray Array from which to transfer the item.
 * @param targetArray Array into which to put the item.
 * @param currentIndex Index of the item in its current array.
 * @param targetIndex Index at which to insert the item.
 */
export function transferArrayItem(currentArray, targetArray, currentIndex, targetIndex) {
    const from = clamp(currentIndex, currentArray.length - 1);
    const to = clamp(targetIndex, targetArray.length);
    if (currentArray.length) {
        targetArray.splice(to, 0, currentArray.splice(from, 1)[0]);
    }
}
/**
 * Copies an item from one array to another, leaving it in its
 * original position in current array.
 * @param currentArray Array from which to copy the item.
 * @param targetArray Array into which is copy the item.
 * @param currentIndex Index of the item in its current array.
 * @param targetIndex Index at which to insert the item.
 *
 */
export function copyArrayItem(currentArray, targetArray, currentIndex, targetIndex) {
    const to = clamp(targetIndex, targetArray.length);
    if (currentArray.length) {
        targetArray.splice(to, 0, currentArray[currentIndex]);
    }
}
/** Clamps a number between zero and a maximum. */
function clamp(value, max) {
    return Math.max(0, Math.min(max, value));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy11dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZHJhZy1kcm9wL2RyYWctdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUg7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsZUFBZSxDQUFVLEtBQVUsRUFBRSxTQUFpQixFQUFFLE9BQWU7SUFDckYsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ2hELE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztJQUU1QyxJQUFJLElBQUksS0FBSyxFQUFFLEVBQUUsQ0FBQztRQUNoQixPQUFPO0lBQ1QsQ0FBQztJQUVELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMzQixNQUFNLEtBQUssR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRWpDLEtBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDO1FBQ3hDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFRCxLQUFLLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDO0FBQ3JCLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsaUJBQWlCLENBQy9CLFlBQWlCLEVBQ2pCLFdBQWdCLEVBQ2hCLFlBQW9CLEVBQ3BCLFdBQW1CO0lBRW5CLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztJQUMxRCxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUVsRCxJQUFJLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUN4QixXQUFXLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsWUFBWSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3RCxDQUFDO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxVQUFVLGFBQWEsQ0FDM0IsWUFBaUIsRUFDakIsV0FBZ0IsRUFDaEIsWUFBb0IsRUFDcEIsV0FBbUI7SUFFbkIsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFbEQsSUFBSSxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDeEIsV0FBVyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLFlBQVksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO0lBQ3hELENBQUM7QUFDSCxDQUFDO0FBRUQsa0RBQWtEO0FBQ2xELFNBQVMsS0FBSyxDQUFDLEtBQWEsRUFBRSxHQUFXO0lBQ3ZDLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUMzQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogTW92ZXMgYW4gaXRlbSBvbmUgaW5kZXggaW4gYW4gYXJyYXkgdG8gYW5vdGhlci5cbiAqIEBwYXJhbSBhcnJheSBBcnJheSBpbiB3aGljaCB0byBtb3ZlIHRoZSBpdGVtLlxuICogQHBhcmFtIGZyb21JbmRleCBTdGFydGluZyBpbmRleCBvZiB0aGUgaXRlbS5cbiAqIEBwYXJhbSB0b0luZGV4IEluZGV4IHRvIHdoaWNoIHRoZSBpdGVtIHNob3VsZCBiZSBtb3ZlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1vdmVJdGVtSW5BcnJheTxUID0gYW55PihhcnJheTogVFtdLCBmcm9tSW5kZXg6IG51bWJlciwgdG9JbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGZyb20gPSBjbGFtcChmcm9tSW5kZXgsIGFycmF5Lmxlbmd0aCAtIDEpO1xuICBjb25zdCB0byA9IGNsYW1wKHRvSW5kZXgsIGFycmF5Lmxlbmd0aCAtIDEpO1xuXG4gIGlmIChmcm9tID09PSB0bykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHRhcmdldCA9IGFycmF5W2Zyb21dO1xuICBjb25zdCBkZWx0YSA9IHRvIDwgZnJvbSA/IC0xIDogMTtcblxuICBmb3IgKGxldCBpID0gZnJvbTsgaSAhPT0gdG87IGkgKz0gZGVsdGEpIHtcbiAgICBhcnJheVtpXSA9IGFycmF5W2kgKyBkZWx0YV07XG4gIH1cblxuICBhcnJheVt0b10gPSB0YXJnZXQ7XG59XG5cbi8qKlxuICogTW92ZXMgYW4gaXRlbSBmcm9tIG9uZSBhcnJheSB0byBhbm90aGVyLlxuICogQHBhcmFtIGN1cnJlbnRBcnJheSBBcnJheSBmcm9tIHdoaWNoIHRvIHRyYW5zZmVyIHRoZSBpdGVtLlxuICogQHBhcmFtIHRhcmdldEFycmF5IEFycmF5IGludG8gd2hpY2ggdG8gcHV0IHRoZSBpdGVtLlxuICogQHBhcmFtIGN1cnJlbnRJbmRleCBJbmRleCBvZiB0aGUgaXRlbSBpbiBpdHMgY3VycmVudCBhcnJheS5cbiAqIEBwYXJhbSB0YXJnZXRJbmRleCBJbmRleCBhdCB3aGljaCB0byBpbnNlcnQgdGhlIGl0ZW0uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmFuc2ZlckFycmF5SXRlbTxUID0gYW55PihcbiAgY3VycmVudEFycmF5OiBUW10sXG4gIHRhcmdldEFycmF5OiBUW10sXG4gIGN1cnJlbnRJbmRleDogbnVtYmVyLFxuICB0YXJnZXRJbmRleDogbnVtYmVyLFxuKTogdm9pZCB7XG4gIGNvbnN0IGZyb20gPSBjbGFtcChjdXJyZW50SW5kZXgsIGN1cnJlbnRBcnJheS5sZW5ndGggLSAxKTtcbiAgY29uc3QgdG8gPSBjbGFtcCh0YXJnZXRJbmRleCwgdGFyZ2V0QXJyYXkubGVuZ3RoKTtcblxuICBpZiAoY3VycmVudEFycmF5Lmxlbmd0aCkge1xuICAgIHRhcmdldEFycmF5LnNwbGljZSh0bywgMCwgY3VycmVudEFycmF5LnNwbGljZShmcm9tLCAxKVswXSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDb3BpZXMgYW4gaXRlbSBmcm9tIG9uZSBhcnJheSB0byBhbm90aGVyLCBsZWF2aW5nIGl0IGluIGl0c1xuICogb3JpZ2luYWwgcG9zaXRpb24gaW4gY3VycmVudCBhcnJheS5cbiAqIEBwYXJhbSBjdXJyZW50QXJyYXkgQXJyYXkgZnJvbSB3aGljaCB0byBjb3B5IHRoZSBpdGVtLlxuICogQHBhcmFtIHRhcmdldEFycmF5IEFycmF5IGludG8gd2hpY2ggaXMgY29weSB0aGUgaXRlbS5cbiAqIEBwYXJhbSBjdXJyZW50SW5kZXggSW5kZXggb2YgdGhlIGl0ZW0gaW4gaXRzIGN1cnJlbnQgYXJyYXkuXG4gKiBAcGFyYW0gdGFyZ2V0SW5kZXggSW5kZXggYXQgd2hpY2ggdG8gaW5zZXJ0IHRoZSBpdGVtLlxuICpcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvcHlBcnJheUl0ZW08VCA9IGFueT4oXG4gIGN1cnJlbnRBcnJheTogVFtdLFxuICB0YXJnZXRBcnJheTogVFtdLFxuICBjdXJyZW50SW5kZXg6IG51bWJlcixcbiAgdGFyZ2V0SW5kZXg6IG51bWJlcixcbik6IHZvaWQge1xuICBjb25zdCB0byA9IGNsYW1wKHRhcmdldEluZGV4LCB0YXJnZXRBcnJheS5sZW5ndGgpO1xuXG4gIGlmIChjdXJyZW50QXJyYXkubGVuZ3RoKSB7XG4gICAgdGFyZ2V0QXJyYXkuc3BsaWNlKHRvLCAwLCBjdXJyZW50QXJyYXlbY3VycmVudEluZGV4XSk7XG4gIH1cbn1cblxuLyoqIENsYW1wcyBhIG51bWJlciBiZXR3ZWVuIHplcm8gYW5kIGEgbWF4aW11bS4gKi9cbmZ1bmN0aW9uIGNsYW1wKHZhbHVlOiBudW1iZXIsIG1heDogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuIE1hdGgubWF4KDAsIE1hdGgubWluKG1heCwgdmFsdWUpKTtcbn1cbiJdfQ==