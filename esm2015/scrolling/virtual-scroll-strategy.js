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
import { InjectionToken } from '@angular/core';
/**
 * The injection token used to specify the virtual scrolling strategy.
 * @type {?}
 */
export const VIRTUAL_SCROLL_STRATEGY = new InjectionToken('VIRTUAL_SCROLL_STRATEGY');
/**
 * A strategy that dictates which items should be rendered in the viewport.
 * @record
 */
export function VirtualScrollStrategy() { }
if (false) {
    /**
     * Emits when the index of the first element visible in the viewport changes.
     * @type {?}
     */
    VirtualScrollStrategy.prototype.scrolledIndexChange;
    /**
     * Attaches this scroll strategy to a viewport.
     * @param {?} viewport The viewport to attach this strategy to.
     * @return {?}
     */
    VirtualScrollStrategy.prototype.attach = function (viewport) { };
    /**
     * Detaches this scroll strategy from the currently attached viewport.
     * @return {?}
     */
    VirtualScrollStrategy.prototype.detach = function () { };
    /**
     * Called when the viewport is scrolled (debounced using requestAnimationFrame).
     * @return {?}
     */
    VirtualScrollStrategy.prototype.onContentScrolled = function () { };
    /**
     * Called when the length of the data changes.
     * @return {?}
     */
    VirtualScrollStrategy.prototype.onDataLengthChanged = function () { };
    /**
     * Called when the range of items rendered in the DOM has changed.
     * @return {?}
     */
    VirtualScrollStrategy.prototype.onContentRendered = function () { };
    /**
     * Called when the offset of the rendered items changed.
     * @return {?}
     */
    VirtualScrollStrategy.prototype.onRenderedOffsetChanged = function () { };
    /**
     * Scroll to the offset for the given index.
     * @param {?} index The index of the element to scroll to.
     * @param {?} behavior The ScrollBehavior to use when scrolling.
     * @return {?}
     */
    VirtualScrollStrategy.prototype.scrollToIndex = function (index, behavior) { };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1zY3JvbGwtc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy92aXJ0dWFsLXNjcm9sbC1zdHJhdGVneS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7Ozs7O0FBTTdDLE1BQU0sT0FBTyx1QkFBdUIsR0FDaEMsSUFBSSxjQUFjLENBQXdCLHlCQUF5QixDQUFDOzs7OztBQUl4RSwyQ0ErQkM7Ozs7OztJQTdCQyxvREFBd0M7Ozs7OztJQU14QyxpRUFBaUQ7Ozs7O0lBR2pELHlEQUFlOzs7OztJQUdmLG9FQUEwQjs7Ozs7SUFHMUIsc0VBQTRCOzs7OztJQUc1QixvRUFBMEI7Ozs7O0lBRzFCLDBFQUFnQzs7Ozs7OztJQU9oQywrRUFBNkQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge09ic2VydmFibGV9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtDZGtWaXJ0dWFsU2Nyb2xsVmlld3BvcnR9IGZyb20gJy4vdmlydHVhbC1zY3JvbGwtdmlld3BvcnQnO1xuXG5cbi8qKiBUaGUgaW5qZWN0aW9uIHRva2VuIHVzZWQgdG8gc3BlY2lmeSB0aGUgdmlydHVhbCBzY3JvbGxpbmcgc3RyYXRlZ3kuICovXG5leHBvcnQgY29uc3QgVklSVFVBTF9TQ1JPTExfU1RSQVRFR1kgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjxWaXJ0dWFsU2Nyb2xsU3RyYXRlZ3k+KCdWSVJUVUFMX1NDUk9MTF9TVFJBVEVHWScpO1xuXG5cbi8qKiBBIHN0cmF0ZWd5IHRoYXQgZGljdGF0ZXMgd2hpY2ggaXRlbXMgc2hvdWxkIGJlIHJlbmRlcmVkIGluIHRoZSB2aWV3cG9ydC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVmlydHVhbFNjcm9sbFN0cmF0ZWd5IHtcbiAgLyoqIEVtaXRzIHdoZW4gdGhlIGluZGV4IG9mIHRoZSBmaXJzdCBlbGVtZW50IHZpc2libGUgaW4gdGhlIHZpZXdwb3J0IGNoYW5nZXMuICovXG4gIHNjcm9sbGVkSW5kZXhDaGFuZ2U6IE9ic2VydmFibGU8bnVtYmVyPjtcblxuICAvKipcbiAgICogQXR0YWNoZXMgdGhpcyBzY3JvbGwgc3RyYXRlZ3kgdG8gYSB2aWV3cG9ydC5cbiAgICogQHBhcmFtIHZpZXdwb3J0IFRoZSB2aWV3cG9ydCB0byBhdHRhY2ggdGhpcyBzdHJhdGVneSB0by5cbiAgICovXG4gIGF0dGFjaCh2aWV3cG9ydDogQ2RrVmlydHVhbFNjcm9sbFZpZXdwb3J0KTogdm9pZDtcblxuICAvKiogRGV0YWNoZXMgdGhpcyBzY3JvbGwgc3RyYXRlZ3kgZnJvbSB0aGUgY3VycmVudGx5IGF0dGFjaGVkIHZpZXdwb3J0LiAqL1xuICBkZXRhY2goKTogdm9pZDtcblxuICAvKiogQ2FsbGVkIHdoZW4gdGhlIHZpZXdwb3J0IGlzIHNjcm9sbGVkIChkZWJvdW5jZWQgdXNpbmcgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKS4gKi9cbiAgb25Db250ZW50U2Nyb2xsZWQoKTogdm9pZDtcblxuICAvKiogQ2FsbGVkIHdoZW4gdGhlIGxlbmd0aCBvZiB0aGUgZGF0YSBjaGFuZ2VzLiAqL1xuICBvbkRhdGFMZW5ndGhDaGFuZ2VkKCk6IHZvaWQ7XG5cbiAgLyoqIENhbGxlZCB3aGVuIHRoZSByYW5nZSBvZiBpdGVtcyByZW5kZXJlZCBpbiB0aGUgRE9NIGhhcyBjaGFuZ2VkLiAqL1xuICBvbkNvbnRlbnRSZW5kZXJlZCgpOiB2b2lkO1xuXG4gIC8qKiBDYWxsZWQgd2hlbiB0aGUgb2Zmc2V0IG9mIHRoZSByZW5kZXJlZCBpdGVtcyBjaGFuZ2VkLiAqL1xuICBvblJlbmRlcmVkT2Zmc2V0Q2hhbmdlZCgpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBTY3JvbGwgdG8gdGhlIG9mZnNldCBmb3IgdGhlIGdpdmVuIGluZGV4LlxuICAgKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IHRvIHNjcm9sbCB0by5cbiAgICogQHBhcmFtIGJlaGF2aW9yIFRoZSBTY3JvbGxCZWhhdmlvciB0byB1c2Ugd2hlbiBzY3JvbGxpbmcuXG4gICAqL1xuICBzY3JvbGxUb0luZGV4KGluZGV4OiBudW1iZXIsIGJlaGF2aW9yOiBTY3JvbGxCZWhhdmlvcik6IHZvaWQ7XG59XG4iXX0=