/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/bidi/dir.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, Output, Input, EventEmitter, } from '@angular/core';
import { Directionality } from './directionality';
/**
 * Directive to listen for changes of direction of part of the DOM.
 *
 * Provides itself as Directionality such that descendant directives only need to ever inject
 * Directionality to get the closest direction.
 */
let Dir = /** @class */ (() => {
    /**
     * Directive to listen for changes of direction of part of the DOM.
     *
     * Provides itself as Directionality such that descendant directives only need to ever inject
     * Directionality to get the closest direction.
     */
    class Dir {
        constructor() {
            /**
             * Normalized direction that accounts for invalid/unsupported values.
             */
            this._dir = 'ltr';
            /**
             * Whether the `value` has been set to its initial value.
             */
            this._isInitialized = false;
            /**
             * Event emitted when the direction changes.
             */
            this.change = new EventEmitter();
        }
        /**
         * \@docs-private
         * @return {?}
         */
        get dir() { return this._dir; }
        /**
         * @param {?} value
         * @return {?}
         */
        set dir(value) {
            /** @type {?} */
            const old = this._dir;
            /** @type {?} */
            const normalizedValue = value ? value.toLowerCase() : value;
            this._rawDir = value;
            this._dir = (normalizedValue === 'ltr' || normalizedValue === 'rtl') ? normalizedValue : 'ltr';
            if (old !== this._dir && this._isInitialized) {
                this.change.emit(this._dir);
            }
        }
        /**
         * Current layout direction of the element.
         * @return {?}
         */
        get value() { return this.dir; }
        /**
         * Initialize once default value has been set.
         * @return {?}
         */
        ngAfterContentInit() {
            this._isInitialized = true;
        }
        /**
         * @return {?}
         */
        ngOnDestroy() {
            this.change.complete();
        }
    }
    Dir.decorators = [
        { type: Directive, args: [{
                    selector: '[dir]',
                    providers: [{ provide: Directionality, useExisting: Dir }],
                    host: { '[attr.dir]': '_rawDir' },
                    exportAs: 'dir',
                },] }
    ];
    Dir.propDecorators = {
        change: [{ type: Output, args: ['dirChange',] }],
        dir: [{ type: Input }]
    };
    return Dir;
})();
export { Dir };
if (false) {
    /**
     * Normalized direction that accounts for invalid/unsupported values.
     * @type {?}
     * @private
     */
    Dir.prototype._dir;
    /**
     * Whether the `value` has been set to its initial value.
     * @type {?}
     * @private
     */
    Dir.prototype._isInitialized;
    /**
     * Direction as passed in by the consumer.
     * @type {?}
     */
    Dir.prototype._rawDir;
    /**
     * Event emitted when the direction changes.
     * @type {?}
     */
    Dir.prototype.change;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9iaWRpL2Rpci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQ0wsU0FBUyxFQUNULE1BQU0sRUFDTixLQUFLLEVBQ0wsWUFBWSxHQUdiLE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBWSxjQUFjLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQzs7Ozs7OztBQVEzRDs7Ozs7OztJQUFBLE1BTWEsR0FBRztRQU5oQjs7OztZQVFVLFNBQUksR0FBYyxLQUFLLENBQUM7Ozs7WUFHeEIsbUJBQWMsR0FBWSxLQUFLLENBQUM7Ozs7WUFNbkIsV0FBTSxHQUFHLElBQUksWUFBWSxFQUFhLENBQUM7UUE0QjlELENBQUM7Ozs7O1FBekJDLElBQ0ksR0FBRyxLQUFnQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDOzs7OztRQUMxQyxJQUFJLEdBQUcsQ0FBQyxLQUFnQjs7a0JBQ2hCLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSTs7a0JBQ2YsZUFBZSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLO1lBRTNELElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1lBQ3JCLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxlQUFlLEtBQUssS0FBSyxJQUFJLGVBQWUsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFFL0YsSUFBSSxHQUFHLEtBQUssSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFO2dCQUM1QyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDN0I7UUFDSCxDQUFDOzs7OztRQUdELElBQUksS0FBSyxLQUFnQixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDOzs7OztRQUczQyxrQkFBa0I7WUFDaEIsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7UUFDN0IsQ0FBQzs7OztRQUVELFdBQVc7WUFDVCxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3pCLENBQUM7OztnQkE1Q0YsU0FBUyxTQUFDO29CQUNULFFBQVEsRUFBRSxPQUFPO29CQUNqQixTQUFTLEVBQUUsQ0FBQyxFQUFDLE9BQU8sRUFBRSxjQUFjLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBQyxDQUFDO29CQUN4RCxJQUFJLEVBQUUsRUFBQyxZQUFZLEVBQUUsU0FBUyxFQUFDO29CQUMvQixRQUFRLEVBQUUsS0FBSztpQkFDaEI7Ozt5QkFZRSxNQUFNLFNBQUMsV0FBVztzQkFHbEIsS0FBSzs7SUF5QlIsVUFBQztLQUFBO1NBdkNZLEdBQUc7Ozs7Ozs7SUFFZCxtQkFBZ0M7Ozs7OztJQUdoQyw2QkFBd0M7Ozs7O0lBR3hDLHNCQUFnQjs7Ozs7SUFHaEIscUJBQTREIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIERpcmVjdGl2ZSxcbiAgT3V0cHV0LFxuICBJbnB1dCxcbiAgRXZlbnRFbWl0dGVyLFxuICBBZnRlckNvbnRlbnRJbml0LFxuICBPbkRlc3Ryb3ksXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQge0RpcmVjdGlvbiwgRGlyZWN0aW9uYWxpdHl9IGZyb20gJy4vZGlyZWN0aW9uYWxpdHknO1xuXG4vKipcbiAqIERpcmVjdGl2ZSB0byBsaXN0ZW4gZm9yIGNoYW5nZXMgb2YgZGlyZWN0aW9uIG9mIHBhcnQgb2YgdGhlIERPTS5cbiAqXG4gKiBQcm92aWRlcyBpdHNlbGYgYXMgRGlyZWN0aW9uYWxpdHkgc3VjaCB0aGF0IGRlc2NlbmRhbnQgZGlyZWN0aXZlcyBvbmx5IG5lZWQgdG8gZXZlciBpbmplY3RcbiAqIERpcmVjdGlvbmFsaXR5IHRvIGdldCB0aGUgY2xvc2VzdCBkaXJlY3Rpb24uXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tkaXJdJyxcbiAgcHJvdmlkZXJzOiBbe3Byb3ZpZGU6IERpcmVjdGlvbmFsaXR5LCB1c2VFeGlzdGluZzogRGlyfV0sXG4gIGhvc3Q6IHsnW2F0dHIuZGlyXSc6ICdfcmF3RGlyJ30sXG4gIGV4cG9ydEFzOiAnZGlyJyxcbn0pXG5leHBvcnQgY2xhc3MgRGlyIGltcGxlbWVudHMgRGlyZWN0aW9uYWxpdHksIEFmdGVyQ29udGVudEluaXQsIE9uRGVzdHJveSB7XG4gIC8qKiBOb3JtYWxpemVkIGRpcmVjdGlvbiB0aGF0IGFjY291bnRzIGZvciBpbnZhbGlkL3Vuc3VwcG9ydGVkIHZhbHVlcy4gKi9cbiAgcHJpdmF0ZSBfZGlyOiBEaXJlY3Rpb24gPSAnbHRyJztcblxuICAvKiogV2hldGhlciB0aGUgYHZhbHVlYCBoYXMgYmVlbiBzZXQgdG8gaXRzIGluaXRpYWwgdmFsdWUuICovXG4gIHByaXZhdGUgX2lzSW5pdGlhbGl6ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogRGlyZWN0aW9uIGFzIHBhc3NlZCBpbiBieSB0aGUgY29uc3VtZXIuICovXG4gIF9yYXdEaXI6IHN0cmluZztcblxuICAvKiogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSBkaXJlY3Rpb24gY2hhbmdlcy4gKi9cbiAgQE91dHB1dCgnZGlyQ2hhbmdlJykgY2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxEaXJlY3Rpb24+KCk7XG5cbiAgLyoqIEBkb2NzLXByaXZhdGUgKi9cbiAgQElucHV0KClcbiAgZ2V0IGRpcigpOiBEaXJlY3Rpb24geyByZXR1cm4gdGhpcy5fZGlyOyB9XG4gIHNldCBkaXIodmFsdWU6IERpcmVjdGlvbikge1xuICAgIGNvbnN0IG9sZCA9IHRoaXMuX2RpcjtcbiAgICBjb25zdCBub3JtYWxpemVkVmFsdWUgPSB2YWx1ZSA/IHZhbHVlLnRvTG93ZXJDYXNlKCkgOiB2YWx1ZTtcblxuICAgIHRoaXMuX3Jhd0RpciA9IHZhbHVlO1xuICAgIHRoaXMuX2RpciA9IChub3JtYWxpemVkVmFsdWUgPT09ICdsdHInIHx8IG5vcm1hbGl6ZWRWYWx1ZSA9PT0gJ3J0bCcpID8gbm9ybWFsaXplZFZhbHVlIDogJ2x0cic7XG5cbiAgICBpZiAob2xkICE9PSB0aGlzLl9kaXIgJiYgdGhpcy5faXNJbml0aWFsaXplZCkge1xuICAgICAgdGhpcy5jaGFuZ2UuZW1pdCh0aGlzLl9kaXIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDdXJyZW50IGxheW91dCBkaXJlY3Rpb24gb2YgdGhlIGVsZW1lbnQuICovXG4gIGdldCB2YWx1ZSgpOiBEaXJlY3Rpb24geyByZXR1cm4gdGhpcy5kaXI7IH1cblxuICAvKiogSW5pdGlhbGl6ZSBvbmNlIGRlZmF1bHQgdmFsdWUgaGFzIGJlZW4gc2V0LiAqL1xuICBuZ0FmdGVyQ29udGVudEluaXQoKSB7XG4gICAgdGhpcy5faXNJbml0aWFsaXplZCA9IHRydWU7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLmNoYW5nZS5jb21wbGV0ZSgpO1xuICB9XG59XG5cbiJdfQ==