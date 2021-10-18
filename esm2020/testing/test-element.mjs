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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Rlc3QtZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFzQkgsNEVBQTRFO0FBQzVFLGtHQUFrRztBQUNsRyxtR0FBbUc7QUFDbkcsa0dBQWtHO0FBQ2xHLGlHQUFpRztBQUNqRyw4REFBOEQ7QUFDOUQsK0ZBQStGO0FBQy9GLE1BQU0sQ0FBTixJQUFZLE9BK0JYO0FBL0JELFdBQVksT0FBTztJQUNqQiwrQ0FBUyxDQUFBO0lBQ1QsbUNBQUcsQ0FBQTtJQUNILHVDQUFLLENBQUE7SUFDTCx1Q0FBSyxDQUFBO0lBQ0wsMkNBQU8sQ0FBQTtJQUNQLG1DQUFHLENBQUE7SUFDSCx5Q0FBTSxDQUFBO0lBQ04sMkNBQU8sQ0FBQTtJQUNQLCtDQUFTLENBQUE7SUFDVCxtQ0FBRyxDQUFBO0lBQ0gsc0NBQUksQ0FBQTtJQUNKLGtEQUFVLENBQUE7SUFDViw4Q0FBUSxDQUFBO0lBQ1Isb0RBQVcsQ0FBQTtJQUNYLGtEQUFVLENBQUE7SUFDViwwQ0FBTSxDQUFBO0lBQ04sMENBQU0sQ0FBQTtJQUNOLGtDQUFFLENBQUE7SUFDRixrQ0FBRSxDQUFBO0lBQ0Ysa0NBQUUsQ0FBQTtJQUNGLGtDQUFFLENBQUE7SUFDRixrQ0FBRSxDQUFBO0lBQ0Ysa0NBQUUsQ0FBQTtJQUNGLGtDQUFFLENBQUE7SUFDRixrQ0FBRSxDQUFBO0lBQ0Ysa0NBQUUsQ0FBQTtJQUNGLG9DQUFHLENBQUE7SUFDSCxvQ0FBRyxDQUFBO0lBQ0gsb0NBQUcsQ0FBQTtJQUNILHNDQUFJLENBQUE7QUFDTixDQUFDLEVBL0JXLE9BQU8sS0FBUCxPQUFPLFFBK0JsQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0VsZW1lbnREaW1lbnNpb25zfSBmcm9tICcuL2VsZW1lbnQtZGltZW5zaW9ucyc7XG5cbi8qKiBNb2RpZmllciBrZXlzIHRoYXQgbWF5IGJlIGhlbGQgd2hpbGUgdHlwaW5nLiAqL1xuZXhwb3J0IGludGVyZmFjZSBNb2RpZmllcktleXMge1xuICBjb250cm9sPzogYm9vbGVhbjtcbiAgYWx0PzogYm9vbGVhbjtcbiAgc2hpZnQ/OiBib29sZWFuO1xuICBtZXRhPzogYm9vbGVhbjtcbn1cblxuLyoqIERhdGEgdGhhdCBjYW4gYmUgYXR0YWNoZWQgdG8gYSBjdXN0b20gZXZlbnQgZGlzcGF0Y2hlZCBmcm9tIGEgYFRlc3RFbGVtZW50YC4gKi9cbmV4cG9ydCB0eXBlIEV2ZW50RGF0YSA9XG4gIHwgc3RyaW5nXG4gIHwgbnVtYmVyXG4gIHwgYm9vbGVhblxuICB8IHVuZGVmaW5lZFxuICB8IG51bGxcbiAgfCBFdmVudERhdGFbXVxuICB8IHtba2V5OiBzdHJpbmddOiBFdmVudERhdGF9O1xuXG4vKiogQW4gZW51bSBvZiBub24tdGV4dCBrZXlzIHRoYXQgY2FuIGJlIHVzZWQgd2l0aCB0aGUgYHNlbmRLZXlzYCBtZXRob2QuICovXG4vLyBOT1RFOiBUaGlzIGlzIGEgc2VwYXJhdGUgZW51bSBmcm9tIGBAYW5ndWxhci9jZGsva2V5Y29kZXNgIGJlY2F1c2Ugd2UgZG9uJ3QgbmVjZXNzYXJpbHkgd2FudCB0b1xuLy8gc3VwcG9ydCBldmVyeSBwb3NzaWJsZSBrZXlDb2RlLiBXZSBhbHNvIGNhbid0IHJlbHkgb24gUHJvdHJhY3RvcidzIGBLZXlgIGJlY2F1c2Ugd2UgZG9uJ3Qgd2FudCBhXG4vLyBkZXBlbmRlbmN5IG9uIGFueSBwYXJ0aWN1bGFyIHRlc3RpbmcgZnJhbWV3b3JrIGhlcmUuIEluc3RlYWQgd2UnbGwganVzdCBtYWludGFpbiB0aGlzIHN1cHBvcnRlZFxuLy8gbGlzdCBvZiBrZXlzIGFuZCBsZXQgaW5kaXZpZHVhbCBjb25jcmV0ZSBgSGFybmVzc0Vudmlyb25tZW50YCBjbGFzc2VzIG1hcCB0aGVtIHRvIHdoYXRldmVyIGtleVxuLy8gcmVwcmVzZW50YXRpb24gaXMgdXNlZCBpbiBpdHMgcmVzcGVjdGl2ZSB0ZXN0aW5nIGZyYW1ld29yay5cbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpwcmVmZXItY29uc3QtZW51bSBTZWVtcyBsaWtlIHRoaXMgY2F1c2VzIHNvbWUgaXNzdWVzIHdpdGggU3lzdGVtLmpzXG5leHBvcnQgZW51bSBUZXN0S2V5IHtcbiAgQkFDS1NQQUNFLFxuICBUQUIsXG4gIEVOVEVSLFxuICBTSElGVCxcbiAgQ09OVFJPTCxcbiAgQUxULFxuICBFU0NBUEUsXG4gIFBBR0VfVVAsXG4gIFBBR0VfRE9XTixcbiAgRU5ELFxuICBIT01FLFxuICBMRUZUX0FSUk9XLFxuICBVUF9BUlJPVyxcbiAgUklHSFRfQVJST1csXG4gIERPV05fQVJST1csXG4gIElOU0VSVCxcbiAgREVMRVRFLFxuICBGMSxcbiAgRjIsXG4gIEYzLFxuICBGNCxcbiAgRjUsXG4gIEY2LFxuICBGNyxcbiAgRjgsXG4gIEY5LFxuICBGMTAsXG4gIEYxMSxcbiAgRjEyLFxuICBNRVRBLFxufVxuXG4vKipcbiAqIFRoaXMgYWN0cyBhcyBhIGNvbW1vbiBpbnRlcmZhY2UgZm9yIERPTSBlbGVtZW50cyBhY3Jvc3MgYm90aCB1bml0IGFuZCBlMmUgdGVzdHMuIEl0IGlzIHRoZVxuICogaW50ZXJmYWNlIHRocm91Z2ggd2hpY2ggdGhlIENvbXBvbmVudEhhcm5lc3MgaW50ZXJhY3RzIHdpdGggdGhlIGNvbXBvbmVudCdzIERPTS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUZXN0RWxlbWVudCB7XG4gIC8qKiBCbHVyIHRoZSBlbGVtZW50LiAqL1xuICBibHVyKCk6IFByb21pc2U8dm9pZD47XG5cbiAgLyoqIENsZWFyIHRoZSBlbGVtZW50J3MgaW5wdXQgKGZvciBpbnB1dCBhbmQgdGV4dGFyZWEgZWxlbWVudHMgb25seSkuICovXG4gIGNsZWFyKCk6IFByb21pc2U8dm9pZD47XG5cbiAgLyoqXG4gICAqIENsaWNrIHRoZSBlbGVtZW50IGF0IHRoZSBkZWZhdWx0IGxvY2F0aW9uIGZvciB0aGUgY3VycmVudCBlbnZpcm9ubWVudC4gSWYgeW91IG5lZWQgdG8gZ3VhcmFudGVlXG4gICAqIHRoZSBlbGVtZW50IGlzIGNsaWNrZWQgYXQgYSBzcGVjaWZpYyBsb2NhdGlvbiwgY29uc2lkZXIgdXNpbmcgYGNsaWNrKCdjZW50ZXInKWAgb3JcbiAgICogYGNsaWNrKHgsIHkpYCBpbnN0ZWFkLlxuICAgKi9cbiAgY2xpY2sobW9kaWZpZXJzPzogTW9kaWZpZXJLZXlzKTogUHJvbWlzZTx2b2lkPjtcblxuICAvKiogQ2xpY2sgdGhlIGVsZW1lbnQgYXQgdGhlIGVsZW1lbnQncyBjZW50ZXIuICovXG4gIGNsaWNrKGxvY2F0aW9uOiAnY2VudGVyJywgbW9kaWZpZXJzPzogTW9kaWZpZXJLZXlzKTogUHJvbWlzZTx2b2lkPjtcblxuICAvKipcbiAgICogQ2xpY2sgdGhlIGVsZW1lbnQgYXQgdGhlIHNwZWNpZmllZCBjb29yZGluYXRlcyByZWxhdGl2ZSB0byB0aGUgdG9wLWxlZnQgb2YgdGhlIGVsZW1lbnQuXG4gICAqIEBwYXJhbSByZWxhdGl2ZVggQ29vcmRpbmF0ZSB3aXRoaW4gdGhlIGVsZW1lbnQsIGFsb25nIHRoZSBYLWF4aXMgYXQgd2hpY2ggdG8gY2xpY2suXG4gICAqIEBwYXJhbSByZWxhdGl2ZVkgQ29vcmRpbmF0ZSB3aXRoaW4gdGhlIGVsZW1lbnQsIGFsb25nIHRoZSBZLWF4aXMgYXQgd2hpY2ggdG8gY2xpY2suXG4gICAqIEBwYXJhbSBtb2RpZmllcnMgTW9kaWZpZXIga2V5cyBoZWxkIHdoaWxlIGNsaWNraW5nXG4gICAqL1xuICBjbGljayhyZWxhdGl2ZVg6IG51bWJlciwgcmVsYXRpdmVZOiBudW1iZXIsIG1vZGlmaWVycz86IE1vZGlmaWVyS2V5cyk6IFByb21pc2U8dm9pZD47XG5cbiAgLyoqXG4gICAqIFJpZ2h0IGNsaWNrcyBvbiB0aGUgZWxlbWVudCBhdCB0aGUgc3BlY2lmaWVkIGNvb3JkaW5hdGVzIHJlbGF0aXZlIHRvIHRoZSB0b3AtbGVmdCBvZiBpdC5cbiAgICogQHBhcmFtIHJlbGF0aXZlWCBDb29yZGluYXRlIHdpdGhpbiB0aGUgZWxlbWVudCwgYWxvbmcgdGhlIFgtYXhpcyBhdCB3aGljaCB0byBjbGljay5cbiAgICogQHBhcmFtIHJlbGF0aXZlWSBDb29yZGluYXRlIHdpdGhpbiB0aGUgZWxlbWVudCwgYWxvbmcgdGhlIFktYXhpcyBhdCB3aGljaCB0byBjbGljay5cbiAgICogQHBhcmFtIG1vZGlmaWVycyBNb2RpZmllciBrZXlzIGhlbGQgd2hpbGUgY2xpY2tpbmdcbiAgICovXG4gIHJpZ2h0Q2xpY2socmVsYXRpdmVYOiBudW1iZXIsIHJlbGF0aXZlWTogbnVtYmVyLCBtb2RpZmllcnM/OiBNb2RpZmllcktleXMpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKiBGb2N1cyB0aGUgZWxlbWVudC4gKi9cbiAgZm9jdXMoKTogUHJvbWlzZTx2b2lkPjtcblxuICAvKiogR2V0IHRoZSBjb21wdXRlZCB2YWx1ZSBvZiB0aGUgZ2l2ZW4gQ1NTIHByb3BlcnR5IGZvciB0aGUgZWxlbWVudC4gKi9cbiAgZ2V0Q3NzVmFsdWUocHJvcGVydHk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPjtcblxuICAvKiogSG92ZXJzIHRoZSBtb3VzZSBvdmVyIHRoZSBlbGVtZW50LiAqL1xuICBob3ZlcigpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKiBNb3ZlcyB0aGUgbW91c2UgYXdheSBmcm9tIHRoZSBlbGVtZW50LiAqL1xuICBtb3VzZUF3YXkoKTogUHJvbWlzZTx2b2lkPjtcblxuICAvKipcbiAgICogU2VuZHMgdGhlIGdpdmVuIHN0cmluZyB0byB0aGUgaW5wdXQgYXMgYSBzZXJpZXMgb2Yga2V5IHByZXNzZXMuIEFsc28gZmlyZXMgaW5wdXQgZXZlbnRzXG4gICAqIGFuZCBhdHRlbXB0cyB0byBhZGQgdGhlIHN0cmluZyB0byB0aGUgRWxlbWVudCdzIHZhbHVlLlxuICAgKi9cbiAgc2VuZEtleXMoLi4ua2V5czogKHN0cmluZyB8IFRlc3RLZXkpW10pOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKlxuICAgKiBTZW5kcyB0aGUgZ2l2ZW4gc3RyaW5nIHRvIHRoZSBpbnB1dCBhcyBhIHNlcmllcyBvZiBrZXkgcHJlc3Nlcy4gQWxzbyBmaXJlcyBpbnB1dCBldmVudHNcbiAgICogYW5kIGF0dGVtcHRzIHRvIGFkZCB0aGUgc3RyaW5nIHRvIHRoZSBFbGVtZW50J3MgdmFsdWUuXG4gICAqL1xuICBzZW5kS2V5cyhtb2RpZmllcnM6IE1vZGlmaWVyS2V5cywgLi4ua2V5czogKHN0cmluZyB8IFRlc3RLZXkpW10pOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB0ZXh0IGZyb20gdGhlIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgdGhhdCBhZmZlY3Qgd2hhdCB0ZXh0IGlzIGluY2x1ZGVkLlxuICAgKi9cbiAgdGV4dChvcHRpb25zPzogVGV4dE9wdGlvbnMpOiBQcm9taXNlPHN0cmluZz47XG5cbiAgLyoqIEdldHMgdGhlIHZhbHVlIGZvciB0aGUgZ2l2ZW4gYXR0cmlidXRlIGZyb20gdGhlIGVsZW1lbnQuICovXG4gIGdldEF0dHJpYnV0ZShuYW1lOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+O1xuXG4gIC8qKiBDaGVja3Mgd2hldGhlciB0aGUgZWxlbWVudCBoYXMgdGhlIGdpdmVuIGNsYXNzLiAqL1xuICBoYXNDbGFzcyhuYW1lOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+O1xuXG4gIC8qKiBHZXRzIHRoZSBkaW1lbnNpb25zIG9mIHRoZSBlbGVtZW50LiAqL1xuICBnZXREaW1lbnNpb25zKCk6IFByb21pc2U8RWxlbWVudERpbWVuc2lvbnM+O1xuXG4gIC8qKiBHZXRzIHRoZSB2YWx1ZSBvZiBhIHByb3BlcnR5IG9mIGFuIGVsZW1lbnQuICovXG4gIGdldFByb3BlcnR5PFQgPSBhbnk+KG5hbWU6IHN0cmluZyk6IFByb21pc2U8VD47XG5cbiAgLyoqIENoZWNrcyB3aGV0aGVyIHRoaXMgZWxlbWVudCBtYXRjaGVzIHRoZSBnaXZlbiBzZWxlY3Rvci4gKi9cbiAgbWF0Y2hlc1NlbGVjdG9yKHNlbGVjdG9yOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+O1xuXG4gIC8qKiBDaGVja3Mgd2hldGhlciB0aGUgZWxlbWVudCBpcyBmb2N1c2VkLiAqL1xuICBpc0ZvY3VzZWQoKTogUHJvbWlzZTxib29sZWFuPjtcblxuICAvKiogU2V0cyB0aGUgdmFsdWUgb2YgYSBwcm9wZXJ0eSBvZiBhbiBpbnB1dC4gKi9cbiAgc2V0SW5wdXRWYWx1ZSh2YWx1ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPjtcblxuICAvLyBOb3RlIHRoYXQgaWRlYWxseSBoZXJlIHdlJ2QgYmUgc2VsZWN0aW5nIG9wdGlvbnMgYmFzZWQgb24gdGhlaXIgdmFsdWUsIHJhdGhlciB0aGFuIHRoZWlyXG4gIC8vIGluZGV4LCBidXQgd2UncmUgbGltaXRlZCBieSBgQGFuZ3VsYXIvZm9ybXNgIHdoaWNoIHdpbGwgbW9kaWZ5IHRoZSBvcHRpb24gdmFsdWUgaW4gc29tZSBjYXNlcy5cbiAgLy8gU2luY2UgdGhlIHZhbHVlIHdpbGwgYmUgdHJ1bmNhdGVkLCB3ZSBjYW4ndCByZWx5IG9uIGl0IHRvIGRvIHRoZSBsb29rdXAgaW4gdGhlIERPTS4gU2VlOlxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL2Jsb2IvbWFzdGVyL3BhY2thZ2VzL2Zvcm1zL3NyYy9kaXJlY3RpdmVzL3NlbGVjdF9jb250cm9sX3ZhbHVlX2FjY2Vzc29yLnRzI0wxOVxuICAvKiogU2VsZWN0cyB0aGUgb3B0aW9ucyBhdCB0aGUgc3BlY2lmaWVkIGluZGV4ZXMgaW5zaWRlIG9mIGEgbmF0aXZlIGBzZWxlY3RgIGVsZW1lbnQuICovXG4gIHNlbGVjdE9wdGlvbnMoLi4ub3B0aW9uSW5kZXhlczogbnVtYmVyW10pOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKlxuICAgKiBEaXNwYXRjaGVzIGFuIGV2ZW50IHdpdGggYSBwYXJ0aWN1bGFyIG5hbWUuXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIGV2ZW50IHRvIGJlIGRpc3BhdGNoZWQuXG4gICAqL1xuICBkaXNwYXRjaEV2ZW50KG5hbWU6IHN0cmluZywgZGF0YT86IFJlY29yZDxzdHJpbmcsIEV2ZW50RGF0YT4pOiBQcm9taXNlPHZvaWQ+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRleHRPcHRpb25zIHtcbiAgLyoqIE9wdGlvbmFsIHNlbGVjdG9yIGZvciBlbGVtZW50cyB0byBleGNsdWRlLiAqL1xuICBleGNsdWRlPzogc3RyaW5nO1xufVxuIl19