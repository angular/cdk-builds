/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** An enum of non-text keys that can be used with the `sendKeys` method. */
// NOTE: This is a separate enum from `@angular/cdk/keycodes` because we don't necessarily want to
// support every possible keyCode. We also can't rely on Protractor's `Key` because we don't want a
// dependency on any particular testing framework here. Instead we'll just maintain this supported
// list of keys and let individual concrete `HarnessEnvironment` classes map them to whatever key
// representation is used in its respective testing framework.
// tslint:disable-next-line:prefer-const-enum Seems like this causes some issues with System.js
export var TestKey;
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
})(TestKey || (TestKey = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Rlc3QtZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFZSCw0RUFBNEU7QUFDNUUsa0dBQWtHO0FBQ2xHLG1HQUFtRztBQUNuRyxrR0FBa0c7QUFDbEcsaUdBQWlHO0FBQ2pHLDhEQUE4RDtBQUM5RCwrRkFBK0Y7QUFDL0YsTUFBTSxDQUFOLElBQVksT0ErQlg7QUEvQkQsV0FBWSxPQUFPO0lBQ2pCLCtDQUFTLENBQUE7SUFDVCxtQ0FBRyxDQUFBO0lBQ0gsdUNBQUssQ0FBQTtJQUNMLHVDQUFLLENBQUE7SUFDTCwyQ0FBTyxDQUFBO0lBQ1AsbUNBQUcsQ0FBQTtJQUNILHlDQUFNLENBQUE7SUFDTiwyQ0FBTyxDQUFBO0lBQ1AsK0NBQVMsQ0FBQTtJQUNULG1DQUFHLENBQUE7SUFDSCxzQ0FBSSxDQUFBO0lBQ0osa0RBQVUsQ0FBQTtJQUNWLDhDQUFRLENBQUE7SUFDUixvREFBVyxDQUFBO0lBQ1gsa0RBQVUsQ0FBQTtJQUNWLDBDQUFNLENBQUE7SUFDTiwwQ0FBTSxDQUFBO0lBQ04sa0NBQUUsQ0FBQTtJQUNGLGtDQUFFLENBQUE7SUFDRixrQ0FBRSxDQUFBO0lBQ0Ysa0NBQUUsQ0FBQTtJQUNGLGtDQUFFLENBQUE7SUFDRixrQ0FBRSxDQUFBO0lBQ0Ysa0NBQUUsQ0FBQTtJQUNGLGtDQUFFLENBQUE7SUFDRixrQ0FBRSxDQUFBO0lBQ0Ysb0NBQUcsQ0FBQTtJQUNILG9DQUFHLENBQUE7SUFDSCxvQ0FBRyxDQUFBO0lBQ0gsc0NBQUksQ0FBQTtBQUNOLENBQUMsRUEvQlcsT0FBTyxLQUFQLE9BQU8sUUErQmxCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RWxlbWVudERpbWVuc2lvbnN9IGZyb20gJy4vZWxlbWVudC1kaW1lbnNpb25zJztcblxuLyoqIE1vZGlmaWVyIGtleXMgdGhhdCBtYXkgYmUgaGVsZCB3aGlsZSB0eXBpbmcuICovXG5leHBvcnQgaW50ZXJmYWNlIE1vZGlmaWVyS2V5cyB7XG4gIGNvbnRyb2w/OiBib29sZWFuO1xuICBhbHQ/OiBib29sZWFuO1xuICBzaGlmdD86IGJvb2xlYW47XG4gIG1ldGE/OiBib29sZWFuO1xufVxuXG4vKiogQW4gZW51bSBvZiBub24tdGV4dCBrZXlzIHRoYXQgY2FuIGJlIHVzZWQgd2l0aCB0aGUgYHNlbmRLZXlzYCBtZXRob2QuICovXG4vLyBOT1RFOiBUaGlzIGlzIGEgc2VwYXJhdGUgZW51bSBmcm9tIGBAYW5ndWxhci9jZGsva2V5Y29kZXNgIGJlY2F1c2Ugd2UgZG9uJ3QgbmVjZXNzYXJpbHkgd2FudCB0b1xuLy8gc3VwcG9ydCBldmVyeSBwb3NzaWJsZSBrZXlDb2RlLiBXZSBhbHNvIGNhbid0IHJlbHkgb24gUHJvdHJhY3RvcidzIGBLZXlgIGJlY2F1c2Ugd2UgZG9uJ3Qgd2FudCBhXG4vLyBkZXBlbmRlbmN5IG9uIGFueSBwYXJ0aWN1bGFyIHRlc3RpbmcgZnJhbWV3b3JrIGhlcmUuIEluc3RlYWQgd2UnbGwganVzdCBtYWludGFpbiB0aGlzIHN1cHBvcnRlZFxuLy8gbGlzdCBvZiBrZXlzIGFuZCBsZXQgaW5kaXZpZHVhbCBjb25jcmV0ZSBgSGFybmVzc0Vudmlyb25tZW50YCBjbGFzc2VzIG1hcCB0aGVtIHRvIHdoYXRldmVyIGtleVxuLy8gcmVwcmVzZW50YXRpb24gaXMgdXNlZCBpbiBpdHMgcmVzcGVjdGl2ZSB0ZXN0aW5nIGZyYW1ld29yay5cbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpwcmVmZXItY29uc3QtZW51bSBTZWVtcyBsaWtlIHRoaXMgY2F1c2VzIHNvbWUgaXNzdWVzIHdpdGggU3lzdGVtLmpzXG5leHBvcnQgZW51bSBUZXN0S2V5IHtcbiAgQkFDS1NQQUNFLFxuICBUQUIsXG4gIEVOVEVSLFxuICBTSElGVCxcbiAgQ09OVFJPTCxcbiAgQUxULFxuICBFU0NBUEUsXG4gIFBBR0VfVVAsXG4gIFBBR0VfRE9XTixcbiAgRU5ELFxuICBIT01FLFxuICBMRUZUX0FSUk9XLFxuICBVUF9BUlJPVyxcbiAgUklHSFRfQVJST1csXG4gIERPV05fQVJST1csXG4gIElOU0VSVCxcbiAgREVMRVRFLFxuICBGMSxcbiAgRjIsXG4gIEYzLFxuICBGNCxcbiAgRjUsXG4gIEY2LFxuICBGNyxcbiAgRjgsXG4gIEY5LFxuICBGMTAsXG4gIEYxMSxcbiAgRjEyLFxuICBNRVRBXG59XG5cbi8qKlxuICogVGhpcyBhY3RzIGFzIGEgY29tbW9uIGludGVyZmFjZSBmb3IgRE9NIGVsZW1lbnRzIGFjcm9zcyBib3RoIHVuaXQgYW5kIGUyZSB0ZXN0cy4gSXQgaXMgdGhlXG4gKiBpbnRlcmZhY2UgdGhyb3VnaCB3aGljaCB0aGUgQ29tcG9uZW50SGFybmVzcyBpbnRlcmFjdHMgd2l0aCB0aGUgY29tcG9uZW50J3MgRE9NLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRlc3RFbGVtZW50IHtcbiAgLyoqIEJsdXIgdGhlIGVsZW1lbnQuICovXG4gIGJsdXIoKTogUHJvbWlzZTx2b2lkPjtcblxuICAvKiogQ2xlYXIgdGhlIGVsZW1lbnQncyBpbnB1dCAoZm9yIGlucHV0IGFuZCB0ZXh0YXJlYSBlbGVtZW50cyBvbmx5KS4gKi9cbiAgY2xlYXIoKTogUHJvbWlzZTx2b2lkPjtcblxuICAvKipcbiAgICogQ2xpY2sgdGhlIGVsZW1lbnQgYXQgdGhlIGRlZmF1bHQgbG9jYXRpb24gZm9yIHRoZSBjdXJyZW50IGVudmlyb25tZW50LiBJZiB5b3UgbmVlZCB0byBndWFyYW50ZWVcbiAgICogdGhlIGVsZW1lbnQgaXMgY2xpY2tlZCBhdCBhIHNwZWNpZmljIGxvY2F0aW9uLCBjb25zaWRlciB1c2luZyBgY2xpY2soJ2NlbnRlcicpYCBvclxuICAgKiBgY2xpY2soeCwgeSlgIGluc3RlYWQuXG4gICAqL1xuICBjbGljaygpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKiBDbGljayB0aGUgZWxlbWVudCBhdCB0aGUgZWxlbWVudCdzIGNlbnRlci4gKi9cbiAgY2xpY2sobG9jYXRpb246ICdjZW50ZXInKTogUHJvbWlzZTx2b2lkPjtcblxuICAvKipcbiAgICogQ2xpY2sgdGhlIGVsZW1lbnQgYXQgdGhlIHNwZWNpZmllZCBjb29yZGluYXRlcyByZWxhdGl2ZSB0byB0aGUgdG9wLWxlZnQgb2YgdGhlIGVsZW1lbnQuXG4gICAqIEBwYXJhbSByZWxhdGl2ZVggQ29vcmRpbmF0ZSB3aXRoaW4gdGhlIGVsZW1lbnQsIGFsb25nIHRoZSBYLWF4aXMgYXQgd2hpY2ggdG8gY2xpY2suXG4gICAqIEBwYXJhbSByZWxhdGl2ZVkgQ29vcmRpbmF0ZSB3aXRoaW4gdGhlIGVsZW1lbnQsIGFsb25nIHRoZSBZLWF4aXMgYXQgd2hpY2ggdG8gY2xpY2suXG4gICAqL1xuICBjbGljayhyZWxhdGl2ZVg6IG51bWJlciwgcmVsYXRpdmVZOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKiBGb2N1cyB0aGUgZWxlbWVudC4gKi9cbiAgZm9jdXMoKTogUHJvbWlzZTx2b2lkPjtcblxuICAvKiogR2V0IHRoZSBjb21wdXRlZCB2YWx1ZSBvZiB0aGUgZ2l2ZW4gQ1NTIHByb3BlcnR5IGZvciB0aGUgZWxlbWVudC4gKi9cbiAgZ2V0Q3NzVmFsdWUocHJvcGVydHk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPjtcblxuICAvKiogSG92ZXJzIHRoZSBtb3VzZSBvdmVyIHRoZSBlbGVtZW50LiAqL1xuICBob3ZlcigpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKiBNb3ZlcyB0aGUgbW91c2UgYXdheSBmcm9tIHRoZSBlbGVtZW50LiAqL1xuICBtb3VzZUF3YXkoKTogUHJvbWlzZTx2b2lkPjtcblxuICAvKipcbiAgICogU2VuZHMgdGhlIGdpdmVuIHN0cmluZyB0byB0aGUgaW5wdXQgYXMgYSBzZXJpZXMgb2Yga2V5IHByZXNzZXMuIEFsc28gZmlyZXMgaW5wdXQgZXZlbnRzXG4gICAqIGFuZCBhdHRlbXB0cyB0byBhZGQgdGhlIHN0cmluZyB0byB0aGUgRWxlbWVudCdzIHZhbHVlLlxuICAgKi9cbiAgc2VuZEtleXMoLi4ua2V5czogKHN0cmluZyB8IFRlc3RLZXkpW10pOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKlxuICAgKiBTZW5kcyB0aGUgZ2l2ZW4gc3RyaW5nIHRvIHRoZSBpbnB1dCBhcyBhIHNlcmllcyBvZiBrZXkgcHJlc3Nlcy4gQWxzbyBmaXJlcyBpbnB1dCBldmVudHNcbiAgICogYW5kIGF0dGVtcHRzIHRvIGFkZCB0aGUgc3RyaW5nIHRvIHRoZSBFbGVtZW50J3MgdmFsdWUuXG4gICAqL1xuICBzZW5kS2V5cyhtb2RpZmllcnM6IE1vZGlmaWVyS2V5cywgLi4ua2V5czogKHN0cmluZyB8IFRlc3RLZXkpW10pOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB0ZXh0IGZyb20gdGhlIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgdGhhdCBhZmZlY3Qgd2hhdCB0ZXh0IGlzIGluY2x1ZGVkLlxuICAgKi9cbiAgdGV4dChvcHRpb25zPzogVGV4dE9wdGlvbnMpOiBQcm9taXNlPHN0cmluZz47XG5cbiAgLyoqIEdldHMgdGhlIHZhbHVlIGZvciB0aGUgZ2l2ZW4gYXR0cmlidXRlIGZyb20gdGhlIGVsZW1lbnQuICovXG4gIGdldEF0dHJpYnV0ZShuYW1lOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+O1xuXG4gIC8qKiBDaGVja3Mgd2hldGhlciB0aGUgZWxlbWVudCBoYXMgdGhlIGdpdmVuIGNsYXNzLiAqL1xuICBoYXNDbGFzcyhuYW1lOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+O1xuXG4gIC8qKiBHZXRzIHRoZSBkaW1lbnNpb25zIG9mIHRoZSBlbGVtZW50LiAqL1xuICBnZXREaW1lbnNpb25zKCk6IFByb21pc2U8RWxlbWVudERpbWVuc2lvbnM+O1xuXG4gIC8qKiBHZXRzIHRoZSB2YWx1ZSBvZiBhIHByb3BlcnR5IG9mIGFuIGVsZW1lbnQuICovXG4gIGdldFByb3BlcnR5KG5hbWU6IHN0cmluZyk6IFByb21pc2U8YW55PjtcblxuICAvKiogQ2hlY2tzIHdoZXRoZXIgdGhpcyBlbGVtZW50IG1hdGNoZXMgdGhlIGdpdmVuIHNlbGVjdG9yLiAqL1xuICBtYXRjaGVzU2VsZWN0b3Ioc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj47XG5cbiAgLyoqIENoZWNrcyB3aGV0aGVyIHRoZSBlbGVtZW50IGlzIGZvY3VzZWQuICovXG4gIGlzRm9jdXNlZCgpOiBQcm9taXNlPGJvb2xlYW4+O1xuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2YWx1ZSBvZiBhIHByb3BlcnR5IG9mIGFuIGlucHV0LlxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDExLjAuMCBUbyBiZWNvbWUgYSByZXF1aXJlZCBtZXRob2QuXG4gICAqL1xuICBzZXRJbnB1dFZhbHVlPyh2YWx1ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPjtcblxuICAvLyBOb3RlIHRoYXQgaWRlYWxseSBoZXJlIHdlJ2QgYmUgc2VsZWN0aW5nIG9wdGlvbnMgYmFzZWQgb24gdGhlaXIgdmFsdWUsIHJhdGhlciB0aGFuIHRoZWlyXG4gIC8vIGluZGV4LCBidXQgd2UncmUgbGltaXRlZCBieSBgQGFuZ3VsYXIvZm9ybXNgIHdoaWNoIHdpbGwgbW9kaWZ5IHRoZSBvcHRpb24gdmFsdWUgaW4gc29tZSBjYXNlcy5cbiAgLy8gU2luY2UgdGhlIHZhbHVlIHdpbGwgYmUgdHJ1bmNhdGVkLCB3ZSBjYW4ndCByZWx5IG9uIGl0IHRvIGRvIHRoZSBsb29rdXAgaW4gdGhlIERPTS4gU2VlOlxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL2Jsb2IvbWFzdGVyL3BhY2thZ2VzL2Zvcm1zL3NyYy9kaXJlY3RpdmVzL3NlbGVjdF9jb250cm9sX3ZhbHVlX2FjY2Vzc29yLnRzI0wxOVxuICAvKipcbiAgICogU2VsZWN0cyB0aGUgb3B0aW9ucyBhdCB0aGUgc3BlY2lmaWVkIGluZGV4ZXMgaW5zaWRlIG9mIGEgbmF0aXZlIGBzZWxlY3RgIGVsZW1lbnQuXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMTIuMC4wIFRvIGJlY29tZSBhIHJlcXVpcmVkIG1ldGhvZC5cbiAgICovXG4gIHNlbGVjdE9wdGlvbnM/KC4uLm9wdGlvbkluZGV4ZXM6IG51bWJlcltdKTogUHJvbWlzZTx2b2lkPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUZXh0T3B0aW9ucyB7XG4gIC8qKiBPcHRpb25hbCBzZWxlY3RvciBmb3IgZWxlbWVudHMgdG8gZXhjbHVkZS4gKi9cbiAgZXhjbHVkZT86IHN0cmluZztcbn1cbiJdfQ==