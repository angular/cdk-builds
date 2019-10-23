/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __extends } from "tslib";
import { EventEmitter, Injectable, NgZone } from '@angular/core';
/**
 * Mock synchronous NgZone implementation that can be used
 * to flush out `onStable` subscriptions in tests.
 *
 * via: https://github.com/angular/angular/blob/master/packages/core/testing/src/ng_zone_mock.ts
 * @docs-private
 */
var MockNgZone = /** @class */ (function (_super) {
    __extends(MockNgZone, _super);
    function MockNgZone() {
        var _this = _super.call(this, { enableLongStackTrace: false }) || this;
        _this.onStable = new EventEmitter(false);
        return _this;
    }
    MockNgZone.prototype.run = function (fn) {
        return fn();
    };
    MockNgZone.prototype.runOutsideAngular = function (fn) {
        return fn();
    };
    MockNgZone.prototype.simulateZoneExit = function () {
        this.onStable.emit(null);
    };
    MockNgZone.decorators = [
        { type: Injectable },
    ];
    /** @nocollapse */
    MockNgZone.ctorParameters = function () { return []; };
    return MockNgZone;
}(NgZone));
export { MockNgZone };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9jay1uZy16b25lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3ByaXZhdGUvbW9jay1uZy16b25lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFHL0Q7Ozs7OztHQU1HO0FBQ0g7SUFDZ0MsOEJBQU07SUFHcEM7UUFBQSxZQUNFLGtCQUFNLEVBQUMsb0JBQW9CLEVBQUUsS0FBSyxFQUFDLENBQUMsU0FDckM7UUFKRCxjQUFRLEdBQXNCLElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDOztJQUl0RCxDQUFDO0lBRUQsd0JBQUcsR0FBSCxVQUFJLEVBQVk7UUFDZCxPQUFPLEVBQUUsRUFBRSxDQUFDO0lBQ2QsQ0FBQztJQUVELHNDQUFpQixHQUFqQixVQUFrQixFQUFZO1FBQzVCLE9BQU8sRUFBRSxFQUFFLENBQUM7SUFDZCxDQUFDO0lBRUQscUNBQWdCLEdBQWhCO1FBQ0UsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDM0IsQ0FBQzs7Z0JBbEJGLFVBQVU7Ozs7SUFtQlgsaUJBQUM7Q0FBQSxBQW5CRCxDQUNnQyxNQUFNLEdBa0JyQztTQWxCWSxVQUFVIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RXZlbnRFbWl0dGVyLCBJbmplY3RhYmxlLCBOZ1pvbmV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5cbi8qKlxuICogTW9jayBzeW5jaHJvbm91cyBOZ1pvbmUgaW1wbGVtZW50YXRpb24gdGhhdCBjYW4gYmUgdXNlZFxuICogdG8gZmx1c2ggb3V0IGBvblN0YWJsZWAgc3Vic2NyaXB0aW9ucyBpbiB0ZXN0cy5cbiAqXG4gKiB2aWE6IGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvYmxvYi9tYXN0ZXIvcGFja2FnZXMvY29yZS90ZXN0aW5nL3NyYy9uZ196b25lX21vY2sudHNcbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIE1vY2tOZ1pvbmUgZXh0ZW5kcyBOZ1pvbmUge1xuICBvblN0YWJsZTogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKGZhbHNlKTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcih7ZW5hYmxlTG9uZ1N0YWNrVHJhY2U6IGZhbHNlfSk7XG4gIH1cblxuICBydW4oZm46IEZ1bmN0aW9uKTogYW55IHtcbiAgICByZXR1cm4gZm4oKTtcbiAgfVxuXG4gIHJ1bk91dHNpZGVBbmd1bGFyKGZuOiBGdW5jdGlvbik6IGFueSB7XG4gICAgcmV0dXJuIGZuKCk7XG4gIH1cblxuICBzaW11bGF0ZVpvbmVFeGl0KCk6IHZvaWQge1xuICAgIHRoaXMub25TdGFibGUuZW1pdChudWxsKTtcbiAgfVxufVxuIl19