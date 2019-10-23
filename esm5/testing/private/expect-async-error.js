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
                    expect(error).toMatch(expectation, 'Expected error to be thrown.');
                    return [2 /*return*/];
            }
        });
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwZWN0LWFzeW5jLWVycm9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3ByaXZhdGUvZXhwZWN0LWFzeW5jLWVycm9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSDs7O0dBR0c7QUFDSCxNQUFNLFVBQWdCLGdCQUFnQixDQUFDLEVBQXNCLEVBQUUsV0FBbUI7Ozs7OztvQkFDNUUsS0FBSyxHQUFnQixJQUFJLENBQUM7Ozs7b0JBRTVCLHFCQUFNLEVBQUUsRUFBRSxFQUFBOztvQkFBVixTQUFVLENBQUM7Ozs7b0JBRVgsS0FBSyxHQUFHLEdBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7O29CQUV2QixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDN0IsTUFBTSxDQUFDLEtBQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsOEJBQThCLENBQUMsQ0FBQzs7Ozs7Q0FDckUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqXG4gKiBFeHBlY3RzIHRoZSBhc3luY2hyb25vdXMgZnVuY3Rpb24gdG8gdGhyb3cgYW4gZXJyb3IgdGhhdCBtYXRjaGVzXG4gKiB0aGUgc3BlY2lmaWVkIGV4cGVjdGF0aW9uLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhwZWN0QXN5bmNFcnJvcihmbjogKCkgPT4gUHJvbWlzZTxhbnk+LCBleHBlY3RhdGlvbjogUmVnRXhwKSB7XG4gIGxldCBlcnJvcjogc3RyaW5nfG51bGwgPSBudWxsO1xuICB0cnkge1xuICAgIGF3YWl0IGZuKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBlcnJvciA9IGUudG9TdHJpbmcoKTtcbiAgfVxuICBleHBlY3QoZXJyb3IpLm5vdC50b0JlKG51bGwpO1xuICBleHBlY3QoZXJyb3IhKS50b01hdGNoKGV4cGVjdGF0aW9uLCAnRXhwZWN0ZWQgZXJyb3IgdG8gYmUgdGhyb3duLicpO1xufVxuIl19