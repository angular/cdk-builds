/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ListKeyManager } from './list-key-manager';
export class FocusKeyManager extends ListKeyManager {
    constructor() {
        super(...arguments);
        this._origin = 'program';
    }
    /**
     * Sets the focus origin that will be passed in to the items for any subsequent `focus` calls.
     * @param origin Focus origin to be used when focusing items.
     */
    setFocusOrigin(origin) {
        this._origin = origin;
        return this;
    }
    setActiveItem(item) {
        super.setActiveItem(item);
        if (this.activeItem) {
            this.activeItem.focus(this._origin);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXMta2V5LW1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2ExMXkva2V5LW1hbmFnZXIvZm9jdXMta2V5LW1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGNBQWMsRUFBdUIsTUFBTSxvQkFBb0IsQ0FBQztBQWF4RSxNQUFNLE9BQU8sZUFBbUIsU0FBUSxjQUFtQztJQUEzRTs7UUFDVSxZQUFPLEdBQWdCLFNBQVMsQ0FBQztJQStCM0MsQ0FBQztJQTdCQzs7O09BR0c7SUFDSCxjQUFjLENBQUMsTUFBbUI7UUFDaEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7UUFDdEIsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBZVEsYUFBYSxDQUFDLElBQVM7UUFDOUIsS0FBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUUxQixJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDbkIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ3JDO0lBQ0gsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7TGlzdEtleU1hbmFnZXIsIExpc3RLZXlNYW5hZ2VyT3B0aW9ufSBmcm9tICcuL2xpc3Qta2V5LW1hbmFnZXInO1xuaW1wb3J0IHtGb2N1c09yaWdpbn0gZnJvbSAnLi4vZm9jdXMtbW9uaXRvci9mb2N1cy1tb25pdG9yJztcblxuLyoqXG4gKiBUaGlzIGlzIHRoZSBpbnRlcmZhY2UgZm9yIGZvY3VzYWJsZSBpdGVtcyAodXNlZCBieSB0aGUgRm9jdXNLZXlNYW5hZ2VyKS5cbiAqIEVhY2ggaXRlbSBtdXN0IGtub3cgaG93IHRvIGZvY3VzIGl0c2VsZiwgd2hldGhlciBvciBub3QgaXQgaXMgY3VycmVudGx5IGRpc2FibGVkXG4gKiBhbmQgYmUgYWJsZSB0byBzdXBwbHkgaXRzIGxhYmVsLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEZvY3VzYWJsZU9wdGlvbiBleHRlbmRzIExpc3RLZXlNYW5hZ2VyT3B0aW9uIHtcbiAgLyoqIEZvY3VzZXMgdGhlIGBGb2N1c2FibGVPcHRpb25gLiAqL1xuICBmb2N1cyhvcmlnaW4/OiBGb2N1c09yaWdpbik6IHZvaWQ7XG59XG5cbmV4cG9ydCBjbGFzcyBGb2N1c0tleU1hbmFnZXI8VD4gZXh0ZW5kcyBMaXN0S2V5TWFuYWdlcjxGb2N1c2FibGVPcHRpb24gJiBUPiB7XG4gIHByaXZhdGUgX29yaWdpbjogRm9jdXNPcmlnaW4gPSAncHJvZ3JhbSc7XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGZvY3VzIG9yaWdpbiB0aGF0IHdpbGwgYmUgcGFzc2VkIGluIHRvIHRoZSBpdGVtcyBmb3IgYW55IHN1YnNlcXVlbnQgYGZvY3VzYCBjYWxscy5cbiAgICogQHBhcmFtIG9yaWdpbiBGb2N1cyBvcmlnaW4gdG8gYmUgdXNlZCB3aGVuIGZvY3VzaW5nIGl0ZW1zLlxuICAgKi9cbiAgc2V0Rm9jdXNPcmlnaW4ob3JpZ2luOiBGb2N1c09yaWdpbik6IHRoaXMge1xuICAgIHRoaXMuX29yaWdpbiA9IG9yaWdpbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBhY3RpdmUgaXRlbSB0byB0aGUgaXRlbSBhdCB0aGUgc3BlY2lmaWVkXG4gICAqIGluZGV4IGFuZCBmb2N1c2VzIHRoZSBuZXdseSBhY3RpdmUgaXRlbS5cbiAgICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBpdGVtIHRvIGJlIHNldCBhcyBhY3RpdmUuXG4gICAqL1xuICBvdmVycmlkZSBzZXRBY3RpdmVJdGVtKGluZGV4OiBudW1iZXIpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBhY3RpdmUgaXRlbSB0byB0aGUgaXRlbSB0aGF0IGlzIHNwZWNpZmllZCBhbmQgZm9jdXNlcyBpdC5cbiAgICogQHBhcmFtIGl0ZW0gSXRlbSB0byBiZSBzZXQgYXMgYWN0aXZlLlxuICAgKi9cbiAgb3ZlcnJpZGUgc2V0QWN0aXZlSXRlbShpdGVtOiBUKTogdm9pZDtcblxuICBvdmVycmlkZSBzZXRBY3RpdmVJdGVtKGl0ZW06IGFueSk6IHZvaWQge1xuICAgIHN1cGVyLnNldEFjdGl2ZUl0ZW0oaXRlbSk7XG5cbiAgICBpZiAodGhpcy5hY3RpdmVJdGVtKSB7XG4gICAgICB0aGlzLmFjdGl2ZUl0ZW0uZm9jdXModGhpcy5fb3JpZ2luKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==