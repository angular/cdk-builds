/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __decorate, __metadata } from "tslib";
import { Directive, Output, Input, EventEmitter, } from '@angular/core';
import { Directionality } from './directionality';
/**
 * Directive to listen for changes of direction of part of the DOM.
 *
 * Provides itself as Directionality such that descendant directives only need to ever inject
 * Directionality to get the closest direction.
 */
let Dir = /** @class */ (() => {
    var Dir_1;
    let Dir = Dir_1 = class Dir {
        constructor() {
            /** Normalized direction that accounts for invalid/unsupported values. */
            this._dir = 'ltr';
            /** Whether the `value` has been set to its initial value. */
            this._isInitialized = false;
            /** Event emitted when the direction changes. */
            this.change = new EventEmitter();
        }
        /** @docs-private */
        get dir() { return this._dir; }
        set dir(value) {
            const old = this._dir;
            const normalizedValue = value ? value.toLowerCase() : value;
            this._rawDir = value;
            this._dir = (normalizedValue === 'ltr' || normalizedValue === 'rtl') ? normalizedValue : 'ltr';
            if (old !== this._dir && this._isInitialized) {
                this.change.emit(this._dir);
            }
        }
        /** Current layout direction of the element. */
        get value() { return this.dir; }
        /** Initialize once default value has been set. */
        ngAfterContentInit() {
            this._isInitialized = true;
        }
        ngOnDestroy() {
            this.change.complete();
        }
    };
    __decorate([
        Output('dirChange'),
        __metadata("design:type", Object)
    ], Dir.prototype, "change", void 0);
    __decorate([
        Input(),
        __metadata("design:type", String),
        __metadata("design:paramtypes", [String])
    ], Dir.prototype, "dir", null);
    Dir = Dir_1 = __decorate([
        Directive({
            selector: '[dir]',
            providers: [{ provide: Directionality, useExisting: Dir_1 }],
            host: { '[attr.dir]': '_rawDir' },
            exportAs: 'dir',
        })
    ], Dir);
    return Dir;
})();
export { Dir };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9iaWRpL2Rpci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUNMLFNBQVMsRUFDVCxNQUFNLEVBQ04sS0FBSyxFQUNMLFlBQVksR0FHYixNQUFNLGVBQWUsQ0FBQztBQUV2QixPQUFPLEVBQVksY0FBYyxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFFM0Q7Ozs7O0dBS0c7QUFPSDs7SUFBQSxJQUFhLEdBQUcsV0FBaEIsTUFBYSxHQUFHO1FBQWhCO1lBQ0UseUVBQXlFO1lBQ2pFLFNBQUksR0FBYyxLQUFLLENBQUM7WUFFaEMsNkRBQTZEO1lBQ3JELG1CQUFjLEdBQVksS0FBSyxDQUFDO1lBS3hDLGdEQUFnRDtZQUMzQixXQUFNLEdBQUcsSUFBSSxZQUFZLEVBQWEsQ0FBQztRQTRCOUQsQ0FBQztRQTFCQyxvQkFBb0I7UUFFcEIsSUFBSSxHQUFHLEtBQWdCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDMUMsSUFBSSxHQUFHLENBQUMsS0FBZ0I7WUFDdEIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztZQUN0QixNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBRTVELElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1lBQ3JCLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxlQUFlLEtBQUssS0FBSyxJQUFJLGVBQWUsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFFL0YsSUFBSSxHQUFHLEtBQUssSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFO2dCQUM1QyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDN0I7UUFDSCxDQUFDO1FBRUQsK0NBQStDO1FBQy9DLElBQUksS0FBSyxLQUFnQixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBRTNDLGtEQUFrRDtRQUNsRCxrQkFBa0I7WUFDaEIsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7UUFDN0IsQ0FBQztRQUVELFdBQVc7WUFDVCxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3pCLENBQUM7S0FDRixDQUFBO0lBNUJzQjtRQUFwQixNQUFNLENBQUMsV0FBVyxDQUFDOzt1Q0FBd0M7SUFJNUQ7UUFEQyxLQUFLLEVBQUU7OztrQ0FDa0M7SUFmL0IsR0FBRztRQU5mLFNBQVMsQ0FBQztZQUNULFFBQVEsRUFBRSxPQUFPO1lBQ2pCLFNBQVMsRUFBRSxDQUFDLEVBQUMsT0FBTyxFQUFFLGNBQWMsRUFBRSxXQUFXLEVBQUUsS0FBRyxFQUFDLENBQUM7WUFDeEQsSUFBSSxFQUFFLEVBQUMsWUFBWSxFQUFFLFNBQVMsRUFBQztZQUMvQixRQUFRLEVBQUUsS0FBSztTQUNoQixDQUFDO09BQ1csR0FBRyxDQXVDZjtJQUFELFVBQUM7S0FBQTtTQXZDWSxHQUFHIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIERpcmVjdGl2ZSxcbiAgT3V0cHV0LFxuICBJbnB1dCxcbiAgRXZlbnRFbWl0dGVyLFxuICBBZnRlckNvbnRlbnRJbml0LFxuICBPbkRlc3Ryb3ksXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQge0RpcmVjdGlvbiwgRGlyZWN0aW9uYWxpdHl9IGZyb20gJy4vZGlyZWN0aW9uYWxpdHknO1xuXG4vKipcbiAqIERpcmVjdGl2ZSB0byBsaXN0ZW4gZm9yIGNoYW5nZXMgb2YgZGlyZWN0aW9uIG9mIHBhcnQgb2YgdGhlIERPTS5cbiAqXG4gKiBQcm92aWRlcyBpdHNlbGYgYXMgRGlyZWN0aW9uYWxpdHkgc3VjaCB0aGF0IGRlc2NlbmRhbnQgZGlyZWN0aXZlcyBvbmx5IG5lZWQgdG8gZXZlciBpbmplY3RcbiAqIERpcmVjdGlvbmFsaXR5IHRvIGdldCB0aGUgY2xvc2VzdCBkaXJlY3Rpb24uXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tkaXJdJyxcbiAgcHJvdmlkZXJzOiBbe3Byb3ZpZGU6IERpcmVjdGlvbmFsaXR5LCB1c2VFeGlzdGluZzogRGlyfV0sXG4gIGhvc3Q6IHsnW2F0dHIuZGlyXSc6ICdfcmF3RGlyJ30sXG4gIGV4cG9ydEFzOiAnZGlyJyxcbn0pXG5leHBvcnQgY2xhc3MgRGlyIGltcGxlbWVudHMgRGlyZWN0aW9uYWxpdHksIEFmdGVyQ29udGVudEluaXQsIE9uRGVzdHJveSB7XG4gIC8qKiBOb3JtYWxpemVkIGRpcmVjdGlvbiB0aGF0IGFjY291bnRzIGZvciBpbnZhbGlkL3Vuc3VwcG9ydGVkIHZhbHVlcy4gKi9cbiAgcHJpdmF0ZSBfZGlyOiBEaXJlY3Rpb24gPSAnbHRyJztcblxuICAvKiogV2hldGhlciB0aGUgYHZhbHVlYCBoYXMgYmVlbiBzZXQgdG8gaXRzIGluaXRpYWwgdmFsdWUuICovXG4gIHByaXZhdGUgX2lzSW5pdGlhbGl6ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogRGlyZWN0aW9uIGFzIHBhc3NlZCBpbiBieSB0aGUgY29uc3VtZXIuICovXG4gIF9yYXdEaXI6IHN0cmluZztcblxuICAvKiogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSBkaXJlY3Rpb24gY2hhbmdlcy4gKi9cbiAgQE91dHB1dCgnZGlyQ2hhbmdlJykgY2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxEaXJlY3Rpb24+KCk7XG5cbiAgLyoqIEBkb2NzLXByaXZhdGUgKi9cbiAgQElucHV0KClcbiAgZ2V0IGRpcigpOiBEaXJlY3Rpb24geyByZXR1cm4gdGhpcy5fZGlyOyB9XG4gIHNldCBkaXIodmFsdWU6IERpcmVjdGlvbikge1xuICAgIGNvbnN0IG9sZCA9IHRoaXMuX2RpcjtcbiAgICBjb25zdCBub3JtYWxpemVkVmFsdWUgPSB2YWx1ZSA/IHZhbHVlLnRvTG93ZXJDYXNlKCkgOiB2YWx1ZTtcblxuICAgIHRoaXMuX3Jhd0RpciA9IHZhbHVlO1xuICAgIHRoaXMuX2RpciA9IChub3JtYWxpemVkVmFsdWUgPT09ICdsdHInIHx8IG5vcm1hbGl6ZWRWYWx1ZSA9PT0gJ3J0bCcpID8gbm9ybWFsaXplZFZhbHVlIDogJ2x0cic7XG5cbiAgICBpZiAob2xkICE9PSB0aGlzLl9kaXIgJiYgdGhpcy5faXNJbml0aWFsaXplZCkge1xuICAgICAgdGhpcy5jaGFuZ2UuZW1pdCh0aGlzLl9kaXIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDdXJyZW50IGxheW91dCBkaXJlY3Rpb24gb2YgdGhlIGVsZW1lbnQuICovXG4gIGdldCB2YWx1ZSgpOiBEaXJlY3Rpb24geyByZXR1cm4gdGhpcy5kaXI7IH1cblxuICAvKiogSW5pdGlhbGl6ZSBvbmNlIGRlZmF1bHQgdmFsdWUgaGFzIGJlZW4gc2V0LiAqL1xuICBuZ0FmdGVyQ29udGVudEluaXQoKSB7XG4gICAgdGhpcy5faXNJbml0aWFsaXplZCA9IHRydWU7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLmNoYW5nZS5jb21wbGV0ZSgpO1xuICB9XG59XG5cbiJdfQ==