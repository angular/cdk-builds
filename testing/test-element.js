/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/cdk/testing/test-element", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /** An enum of non-text keys that can be used with the `sendKeys` method. */
    // NOTE: This is a separate enum from `@angular/cdk/keycodes` because we don't necessarily want to
    // support every possible keyCode. We also can't rely on Protractor's `Key` because we don't want a
    // dependency on any particular testing framework here. Instead we'll just maintain this supported
    // list of keys and let individual concrete `HarnessEnvironment` classes map them to whatever key
    // representation is used in its respective testing framework.
    var TestKey;
    (function (TestKey) {
        TestKey[TestKey["BACKSPACE"] = 0] = "BACKSPACE";
        TestKey[TestKey["TAB"] = 1] = "TAB";
        TestKey[TestKey["ENTER"] = 2] = "ENTER";
        TestKey[TestKey["SHIFT"] = 3] = "SHIFT";
        TestKey[TestKey["CONTROL"] = 4] = "CONTROL";
        TestKey[TestKey["ALT"] = 5] = "ALT";
        TestKey[TestKey["ESCAPE"] = 6] = "ESCAPE";
        TestKey[TestKey["PAGE_UP"] = 7] = "PAGE_UP";
        TestKey[TestKey["PAGE_DOWN"] = 8] = "PAGE_DOWN";
        TestKey[TestKey["END"] = 9] = "END";
        TestKey[TestKey["HOME"] = 10] = "HOME";
        TestKey[TestKey["LEFT_ARROW"] = 11] = "LEFT_ARROW";
        TestKey[TestKey["UP_ARROW"] = 12] = "UP_ARROW";
        TestKey[TestKey["RIGHT_ARROW"] = 13] = "RIGHT_ARROW";
        TestKey[TestKey["DOWN_ARROW"] = 14] = "DOWN_ARROW";
        TestKey[TestKey["INSERT"] = 15] = "INSERT";
        TestKey[TestKey["DELETE"] = 16] = "DELETE";
        TestKey[TestKey["F1"] = 17] = "F1";
        TestKey[TestKey["F2"] = 18] = "F2";
        TestKey[TestKey["F3"] = 19] = "F3";
        TestKey[TestKey["F4"] = 20] = "F4";
        TestKey[TestKey["F5"] = 21] = "F5";
        TestKey[TestKey["F6"] = 22] = "F6";
        TestKey[TestKey["F7"] = 23] = "F7";
        TestKey[TestKey["F8"] = 24] = "F8";
        TestKey[TestKey["F9"] = 25] = "F9";
        TestKey[TestKey["F10"] = 26] = "F10";
        TestKey[TestKey["F11"] = 27] = "F11";
        TestKey[TestKey["F12"] = 28] = "F12";
        TestKey[TestKey["META"] = 29] = "META";
    })(TestKey = exports.TestKey || (exports.TestKey = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Rlc3QtZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUtILDRFQUE0RTtJQUM1RSxrR0FBa0c7SUFDbEcsbUdBQW1HO0lBQ25HLGtHQUFrRztJQUNsRyxpR0FBaUc7SUFDakcsOERBQThEO0lBQzlELElBQVksT0ErQlg7SUEvQkQsV0FBWSxPQUFPO1FBQ2pCLCtDQUFTLENBQUE7UUFDVCxtQ0FBRyxDQUFBO1FBQ0gsdUNBQUssQ0FBQTtRQUNMLHVDQUFLLENBQUE7UUFDTCwyQ0FBTyxDQUFBO1FBQ1AsbUNBQUcsQ0FBQTtRQUNILHlDQUFNLENBQUE7UUFDTiwyQ0FBTyxDQUFBO1FBQ1AsK0NBQVMsQ0FBQTtRQUNULG1DQUFHLENBQUE7UUFDSCxzQ0FBSSxDQUFBO1FBQ0osa0RBQVUsQ0FBQTtRQUNWLDhDQUFRLENBQUE7UUFDUixvREFBVyxDQUFBO1FBQ1gsa0RBQVUsQ0FBQTtRQUNWLDBDQUFNLENBQUE7UUFDTiwwQ0FBTSxDQUFBO1FBQ04sa0NBQUUsQ0FBQTtRQUNGLGtDQUFFLENBQUE7UUFDRixrQ0FBRSxDQUFBO1FBQ0Ysa0NBQUUsQ0FBQTtRQUNGLGtDQUFFLENBQUE7UUFDRixrQ0FBRSxDQUFBO1FBQ0Ysa0NBQUUsQ0FBQTtRQUNGLGtDQUFFLENBQUE7UUFDRixrQ0FBRSxDQUFBO1FBQ0Ysb0NBQUcsQ0FBQTtRQUNILG9DQUFHLENBQUE7UUFDSCxvQ0FBRyxDQUFBO1FBQ0gsc0NBQUksQ0FBQTtJQUNOLENBQUMsRUEvQlcsT0FBTyxHQUFQLGVBQU8sS0FBUCxlQUFPLFFBK0JsQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0VsZW1lbnREaW1lbnNpb25zfSBmcm9tICcuL2VsZW1lbnQtZGltZW5zaW9ucyc7XG5pbXBvcnQge01vZGlmaWVyS2V5c30gZnJvbSAnLi9ldmVudC1vYmplY3RzJztcblxuLyoqIEFuIGVudW0gb2Ygbm9uLXRleHQga2V5cyB0aGF0IGNhbiBiZSB1c2VkIHdpdGggdGhlIGBzZW5kS2V5c2AgbWV0aG9kLiAqL1xuLy8gTk9URTogVGhpcyBpcyBhIHNlcGFyYXRlIGVudW0gZnJvbSBgQGFuZ3VsYXIvY2RrL2tleWNvZGVzYCBiZWNhdXNlIHdlIGRvbid0IG5lY2Vzc2FyaWx5IHdhbnQgdG9cbi8vIHN1cHBvcnQgZXZlcnkgcG9zc2libGUga2V5Q29kZS4gV2UgYWxzbyBjYW4ndCByZWx5IG9uIFByb3RyYWN0b3IncyBgS2V5YCBiZWNhdXNlIHdlIGRvbid0IHdhbnQgYVxuLy8gZGVwZW5kZW5jeSBvbiBhbnkgcGFydGljdWxhciB0ZXN0aW5nIGZyYW1ld29yayBoZXJlLiBJbnN0ZWFkIHdlJ2xsIGp1c3QgbWFpbnRhaW4gdGhpcyBzdXBwb3J0ZWRcbi8vIGxpc3Qgb2Yga2V5cyBhbmQgbGV0IGluZGl2aWR1YWwgY29uY3JldGUgYEhhcm5lc3NFbnZpcm9ubWVudGAgY2xhc3NlcyBtYXAgdGhlbSB0byB3aGF0ZXZlciBrZXlcbi8vIHJlcHJlc2VudGF0aW9uIGlzIHVzZWQgaW4gaXRzIHJlc3BlY3RpdmUgdGVzdGluZyBmcmFtZXdvcmsuXG5leHBvcnQgZW51bSBUZXN0S2V5IHtcbiAgQkFDS1NQQUNFLFxuICBUQUIsXG4gIEVOVEVSLFxuICBTSElGVCxcbiAgQ09OVFJPTCxcbiAgQUxULFxuICBFU0NBUEUsXG4gIFBBR0VfVVAsXG4gIFBBR0VfRE9XTixcbiAgRU5ELFxuICBIT01FLFxuICBMRUZUX0FSUk9XLFxuICBVUF9BUlJPVyxcbiAgUklHSFRfQVJST1csXG4gIERPV05fQVJST1csXG4gIElOU0VSVCxcbiAgREVMRVRFLFxuICBGMSxcbiAgRjIsXG4gIEYzLFxuICBGNCxcbiAgRjUsXG4gIEY2LFxuICBGNyxcbiAgRjgsXG4gIEY5LFxuICBGMTAsXG4gIEYxMSxcbiAgRjEyLFxuICBNRVRBXG59XG5cbi8qKlxuICogVGhpcyBhY3RzIGFzIGEgY29tbW9uIGludGVyZmFjZSBmb3IgRE9NIGVsZW1lbnRzIGFjcm9zcyBib3RoIHVuaXQgYW5kIGUyZSB0ZXN0cy4gSXQgaXMgdGhlXG4gKiBpbnRlcmZhY2UgdGhyb3VnaCB3aGljaCB0aGUgQ29tcG9uZW50SGFybmVzcyBpbnRlcmFjdHMgd2l0aCB0aGUgY29tcG9uZW50J3MgRE9NLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRlc3RFbGVtZW50IHtcbiAgLyoqIEJsdXIgdGhlIGVsZW1lbnQuICovXG4gIGJsdXIoKTogUHJvbWlzZTx2b2lkPjtcblxuICAvKiogQ2xlYXIgdGhlIGVsZW1lbnQncyBpbnB1dCAoZm9yIGlucHV0IGVsZW1lbnRzIG9ubHkpLiAqL1xuICBjbGVhcigpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKlxuICAgKiBDbGljayB0aGUgZWxlbWVudC5cbiAgICogQHBhcmFtIHJlbGF0aXZlWCBDb29yZGluYXRlIHdpdGhpbiB0aGUgZWxlbWVudCwgYWxvbmcgdGhlIFgtYXhpcyBhdCB3aGljaCB0byBjbGljay5cbiAgICogQHBhcmFtIHJlbGF0aXZlWSBDb29yZGluYXRlIHdpdGhpbiB0aGUgZWxlbWVudCwgYWxvbmcgdGhlIFktYXhpcyBhdCB3aGljaCB0byBjbGljay5cbiAgICovXG4gIGNsaWNrKHJlbGF0aXZlWD86IG51bWJlciwgcmVsYXRpdmVZPzogbnVtYmVyKTogUHJvbWlzZTx2b2lkPjtcblxuICAvKiogRm9jdXMgdGhlIGVsZW1lbnQuICovXG4gIGZvY3VzKCk6IFByb21pc2U8dm9pZD47XG5cbiAgLyoqIEdldCB0aGUgY29tcHV0ZWQgdmFsdWUgb2YgdGhlIGdpdmVuIENTUyBwcm9wZXJ0eSBmb3IgdGhlIGVsZW1lbnQuICovXG4gIGdldENzc1ZhbHVlKHByb3BlcnR5OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz47XG5cbiAgLyoqIEhvdmVycyB0aGUgbW91c2Ugb3ZlciB0aGUgZWxlbWVudC4gKi9cbiAgaG92ZXIoKTogUHJvbWlzZTx2b2lkPjtcblxuICAvKipcbiAgICogU2VuZHMgdGhlIGdpdmVuIHN0cmluZyB0byB0aGUgaW5wdXQgYXMgYSBzZXJpZXMgb2Yga2V5IHByZXNzZXMuIEFsc28gZmlyZXMgaW5wdXQgZXZlbnRzXG4gICAqIGFuZCBhdHRlbXB0cyB0byBhZGQgdGhlIHN0cmluZyB0byB0aGUgRWxlbWVudCdzIHZhbHVlLlxuICAgKi9cbiAgc2VuZEtleXMoLi4ua2V5czogKHN0cmluZyB8IFRlc3RLZXkpW10pOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKlxuICAgKiBTZW5kcyB0aGUgZ2l2ZW4gc3RyaW5nIHRvIHRoZSBpbnB1dCBhcyBhIHNlcmllcyBvZiBrZXkgcHJlc3Nlcy4gQWxzbyBmaXJlcyBpbnB1dCBldmVudHNcbiAgICogYW5kIGF0dGVtcHRzIHRvIGFkZCB0aGUgc3RyaW5nIHRvIHRoZSBFbGVtZW50J3MgdmFsdWUuXG4gICAqL1xuICBzZW5kS2V5cyhtb2RpZmllcnM6IE1vZGlmaWVyS2V5cywgLi4ua2V5czogKHN0cmluZyB8IFRlc3RLZXkpW10pOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKiBHZXRzIHRoZSB0ZXh0IGZyb20gdGhlIGVsZW1lbnQuICovXG4gIHRleHQoKTogUHJvbWlzZTxzdHJpbmc+O1xuXG4gIC8qKiBHZXRzIHRoZSB2YWx1ZSBmb3IgdGhlIGdpdmVuIGF0dHJpYnV0ZSBmcm9tIHRoZSBlbGVtZW50LiAqL1xuICBnZXRBdHRyaWJ1dGUobmFtZTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPjtcblxuICAvKiogQ2hlY2tzIHdoZXRoZXIgdGhlIGVsZW1lbnQgaGFzIHRoZSBnaXZlbiBjbGFzcy4gKi9cbiAgaGFzQ2xhc3MobmFtZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPjtcblxuICAvKiogR2V0cyB0aGUgZGltZW5zaW9ucyBvZiB0aGUgZWxlbWVudC4gKi9cbiAgZ2V0RGltZW5zaW9ucygpOiBQcm9taXNlPEVsZW1lbnREaW1lbnNpb25zPjtcblxuICAvKiogR2V0cyB0aGUgdmFsdWUgb2YgYSBwcm9wZXJ0eSBvZiBhbiBlbGVtZW50LiAqL1xuICBnZXRQcm9wZXJ0eShuYW1lOiBzdHJpbmcpOiBQcm9taXNlPGFueT47XG5cbiAgLyoqIENoZWNrcyB3aGV0aGVyIHRoaXMgZWxlbWVudCBtYXRjaGVzIHRoZSBnaXZlbiBzZWxlY3Rvci4gKi9cbiAgbWF0Y2hlc1NlbGVjdG9yKHNlbGVjdG9yOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+O1xuXG4gIC8qKlxuICAgKiBGbHVzaGVzIGNoYW5nZSBkZXRlY3Rpb24gYW5kIGFzeW5jIHRhc2tzLlxuICAgKiBJbiBtb3N0IGNhc2VzIGl0IHNob3VsZCBub3QgYmUgbmVjZXNzYXJ5IHRvIGNhbGwgdGhpcy4gSG93ZXZlciwgdGhlcmUgbWF5IGJlIHNvbWUgZWRnZSBjYXNlc1xuICAgKiB3aGVyZSBpdCBpcyBuZWVkZWQgdG8gZnVsbHkgZmx1c2ggYW5pbWF0aW9uIGV2ZW50cy5cbiAgICovXG4gIGZvcmNlU3RhYmlsaXplKCk6IFByb21pc2U8dm9pZD47XG59XG4iXX0=