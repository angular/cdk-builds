/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __awaiter, __generator } from "tslib";
/**
 * Expects the asynchronous function to throw an error that matches
 * the specified expectation.
 */
export function expectAsyncError(fn, expectation) {
    return __awaiter(this, void 0, void 0, function () {
        var error, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    error = null;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fn()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    error = e_1.toString();
                    return [3 /*break*/, 4];
                case 4:
                    expect(error).not.toBe(null);
                    if (expectation instanceof RegExp) {
                        expect(error).toMatch(expectation, 'Expected error to be thrown.');
                    }
                    else {
                        expect(error).toBe(expectation, 'Expected error to be throw.');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwZWN0LWFzeW5jLWVycm9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3ByaXZhdGUvZXhwZWN0LWFzeW5jLWVycm9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSDs7O0dBR0c7QUFDSCxNQUFNLFVBQWdCLGdCQUFnQixDQUFDLEVBQXNCLEVBQUUsV0FBNEI7Ozs7OztvQkFDckYsS0FBSyxHQUFnQixJQUFJLENBQUM7Ozs7b0JBRTVCLHFCQUFNLEVBQUUsRUFBRSxFQUFBOztvQkFBVixTQUFVLENBQUM7Ozs7b0JBRVgsS0FBSyxHQUFHLEdBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7O29CQUV2QixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDN0IsSUFBSSxXQUFXLFlBQVksTUFBTSxFQUFFO3dCQUNqQyxNQUFNLENBQUMsS0FBTSxDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSw4QkFBOEIsQ0FBQyxDQUFDO3FCQUNyRTt5QkFBTTt3QkFDTCxNQUFNLENBQUMsS0FBTSxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSw2QkFBNkIsQ0FBQyxDQUFDO3FCQUNqRTs7Ozs7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIEV4cGVjdHMgdGhlIGFzeW5jaHJvbm91cyBmdW5jdGlvbiB0byB0aHJvdyBhbiBlcnJvciB0aGF0IG1hdGNoZXNcbiAqIHRoZSBzcGVjaWZpZWQgZXhwZWN0YXRpb24uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleHBlY3RBc3luY0Vycm9yKGZuOiAoKSA9PiBQcm9taXNlPGFueT4sIGV4cGVjdGF0aW9uOiBSZWdFeHAgfCBzdHJpbmcpIHtcbiAgbGV0IGVycm9yOiBzdHJpbmd8bnVsbCA9IG51bGw7XG4gIHRyeSB7XG4gICAgYXdhaXQgZm4oKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGVycm9yID0gZS50b1N0cmluZygpO1xuICB9XG4gIGV4cGVjdChlcnJvcikubm90LnRvQmUobnVsbCk7XG4gIGlmIChleHBlY3RhdGlvbiBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgIGV4cGVjdChlcnJvciEpLnRvTWF0Y2goZXhwZWN0YXRpb24sICdFeHBlY3RlZCBlcnJvciB0byBiZSB0aHJvd24uJyk7XG4gIH0gZWxzZSB7XG4gICAgZXhwZWN0KGVycm9yISkudG9CZShleHBlY3RhdGlvbiwgJ0V4cGVjdGVkIGVycm9yIHRvIGJlIHRocm93LicpO1xuICB9XG59XG4iXX0=