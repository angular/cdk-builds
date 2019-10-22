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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Rlc3QtZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFLSCw0RUFBNEU7QUFDNUUsa0dBQWtHO0FBQ2xHLG1HQUFtRztBQUNuRyxrR0FBa0c7QUFDbEcsaUdBQWlHO0FBQ2pHLDhEQUE4RDtBQUM5RCxNQUFNLENBQU4sSUFBWSxPQStCWDtBQS9CRCxXQUFZLE9BQU87SUFDakIsK0NBQVMsQ0FBQTtJQUNULG1DQUFHLENBQUE7SUFDSCx1Q0FBSyxDQUFBO0lBQ0wsdUNBQUssQ0FBQTtJQUNMLDJDQUFPLENBQUE7SUFDUCxtQ0FBRyxDQUFBO0lBQ0gseUNBQU0sQ0FBQTtJQUNOLDJDQUFPLENBQUE7SUFDUCwrQ0FBUyxDQUFBO0lBQ1QsbUNBQUcsQ0FBQTtJQUNILHNDQUFJLENBQUE7SUFDSixrREFBVSxDQUFBO0lBQ1YsOENBQVEsQ0FBQTtJQUNSLG9EQUFXLENBQUE7SUFDWCxrREFBVSxDQUFBO0lBQ1YsMENBQU0sQ0FBQTtJQUNOLDBDQUFNLENBQUE7SUFDTixrQ0FBRSxDQUFBO0lBQ0Ysa0NBQUUsQ0FBQTtJQUNGLGtDQUFFLENBQUE7SUFDRixrQ0FBRSxDQUFBO0lBQ0Ysa0NBQUUsQ0FBQTtJQUNGLGtDQUFFLENBQUE7SUFDRixrQ0FBRSxDQUFBO0lBQ0Ysa0NBQUUsQ0FBQTtJQUNGLGtDQUFFLENBQUE7SUFDRixvQ0FBRyxDQUFBO0lBQ0gsb0NBQUcsQ0FBQTtJQUNILG9DQUFHLENBQUE7SUFDSCxzQ0FBSSxDQUFBO0FBQ04sQ0FBQyxFQS9CVyxPQUFPLEtBQVAsT0FBTyxRQStCbEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtFbGVtZW50RGltZW5zaW9uc30gZnJvbSAnLi9lbGVtZW50LWRpbWVuc2lvbnMnO1xuaW1wb3J0IHtNb2RpZmllcktleXN9IGZyb20gJy4vZmFrZS1ldmVudHMnO1xuXG4vKiogQW4gZW51bSBvZiBub24tdGV4dCBrZXlzIHRoYXQgY2FuIGJlIHVzZWQgd2l0aCB0aGUgYHNlbmRLZXlzYCBtZXRob2QuICovXG4vLyBOT1RFOiBUaGlzIGlzIGEgc2VwYXJhdGUgZW51bSBmcm9tIGBAYW5ndWxhci9jZGsva2V5Y29kZXNgIGJlY2F1c2Ugd2UgZG9uJ3QgbmVjZXNzYXJpbHkgd2FudCB0b1xuLy8gc3VwcG9ydCBldmVyeSBwb3NzaWJsZSBrZXlDb2RlLiBXZSBhbHNvIGNhbid0IHJlbHkgb24gUHJvdHJhY3RvcidzIGBLZXlgIGJlY2F1c2Ugd2UgZG9uJ3Qgd2FudCBhXG4vLyBkZXBlbmRlbmN5IG9uIGFueSBwYXJ0aWN1bGFyIHRlc3RpbmcgZnJhbWV3b3JrIGhlcmUuIEluc3RlYWQgd2UnbGwganVzdCBtYWludGFpbiB0aGlzIHN1cHBvcnRlZFxuLy8gbGlzdCBvZiBrZXlzIGFuZCBsZXQgaW5kaXZpZHVhbCBjb25jcmV0ZSBgSGFybmVzc0Vudmlyb25tZW50YCBjbGFzc2VzIG1hcCB0aGVtIHRvIHdoYXRldmVyIGtleVxuLy8gcmVwcmVzZW50YXRpb24gaXMgdXNlZCBpbiBpdHMgcmVzcGVjdGl2ZSB0ZXN0aW5nIGZyYW1ld29yay5cbmV4cG9ydCBlbnVtIFRlc3RLZXkge1xuICBCQUNLU1BBQ0UsXG4gIFRBQixcbiAgRU5URVIsXG4gIFNISUZULFxuICBDT05UUk9MLFxuICBBTFQsXG4gIEVTQ0FQRSxcbiAgUEFHRV9VUCxcbiAgUEFHRV9ET1dOLFxuICBFTkQsXG4gIEhPTUUsXG4gIExFRlRfQVJST1csXG4gIFVQX0FSUk9XLFxuICBSSUdIVF9BUlJPVyxcbiAgRE9XTl9BUlJPVyxcbiAgSU5TRVJULFxuICBERUxFVEUsXG4gIEYxLFxuICBGMixcbiAgRjMsXG4gIEY0LFxuICBGNSxcbiAgRjYsXG4gIEY3LFxuICBGOCxcbiAgRjksXG4gIEYxMCxcbiAgRjExLFxuICBGMTIsXG4gIE1FVEFcbn1cblxuLyoqXG4gKiBUaGlzIGFjdHMgYXMgYSBjb21tb24gaW50ZXJmYWNlIGZvciBET00gZWxlbWVudHMgYWNyb3NzIGJvdGggdW5pdCBhbmQgZTJlIHRlc3RzLiBJdCBpcyB0aGVcbiAqIGludGVyZmFjZSB0aHJvdWdoIHdoaWNoIHRoZSBDb21wb25lbnRIYXJuZXNzIGludGVyYWN0cyB3aXRoIHRoZSBjb21wb25lbnQncyBET00uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVGVzdEVsZW1lbnQge1xuICAvKiogQmx1ciB0aGUgZWxlbWVudC4gKi9cbiAgYmx1cigpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKiBDbGVhciB0aGUgZWxlbWVudCdzIGlucHV0IChmb3IgaW5wdXQgZWxlbWVudHMgb25seSkuICovXG4gIGNsZWFyKCk6IFByb21pc2U8dm9pZD47XG5cbiAgLyoqXG4gICAqIENsaWNrIHRoZSBlbGVtZW50LlxuICAgKiBAcGFyYW0gcmVsYXRpdmVYIENvb3JkaW5hdGUgd2l0aGluIHRoZSBlbGVtZW50LCBhbG9uZyB0aGUgWC1heGlzIGF0IHdoaWNoIHRvIGNsaWNrLlxuICAgKiBAcGFyYW0gcmVsYXRpdmVZIENvb3JkaW5hdGUgd2l0aGluIHRoZSBlbGVtZW50LCBhbG9uZyB0aGUgWS1heGlzIGF0IHdoaWNoIHRvIGNsaWNrLlxuICAgKi9cbiAgY2xpY2socmVsYXRpdmVYPzogbnVtYmVyLCByZWxhdGl2ZVk/OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKiBGb2N1cyB0aGUgZWxlbWVudC4gKi9cbiAgZm9jdXMoKTogUHJvbWlzZTx2b2lkPjtcblxuICAvKiogR2V0IHRoZSBjb21wdXRlZCB2YWx1ZSBvZiB0aGUgZ2l2ZW4gQ1NTIHByb3BlcnR5IGZvciB0aGUgZWxlbWVudC4gKi9cbiAgZ2V0Q3NzVmFsdWUocHJvcGVydHk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPjtcblxuICAvKiogSG92ZXJzIHRoZSBtb3VzZSBvdmVyIHRoZSBlbGVtZW50LiAqL1xuICBob3ZlcigpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKlxuICAgKiBTZW5kcyB0aGUgZ2l2ZW4gc3RyaW5nIHRvIHRoZSBpbnB1dCBhcyBhIHNlcmllcyBvZiBrZXkgcHJlc3Nlcy4gQWxzbyBmaXJlcyBpbnB1dCBldmVudHNcbiAgICogYW5kIGF0dGVtcHRzIHRvIGFkZCB0aGUgc3RyaW5nIHRvIHRoZSBFbGVtZW50J3MgdmFsdWUuXG4gICAqL1xuICBzZW5kS2V5cyguLi5rZXlzOiAoc3RyaW5nIHwgVGVzdEtleSlbXSk6IFByb21pc2U8dm9pZD47XG5cbiAgLyoqXG4gICAqIFNlbmRzIHRoZSBnaXZlbiBzdHJpbmcgdG8gdGhlIGlucHV0IGFzIGEgc2VyaWVzIG9mIGtleSBwcmVzc2VzLiBBbHNvIGZpcmVzIGlucHV0IGV2ZW50c1xuICAgKiBhbmQgYXR0ZW1wdHMgdG8gYWRkIHRoZSBzdHJpbmcgdG8gdGhlIEVsZW1lbnQncyB2YWx1ZS5cbiAgICovXG4gIHNlbmRLZXlzKG1vZGlmaWVyczogTW9kaWZpZXJLZXlzLCAuLi5rZXlzOiAoc3RyaW5nIHwgVGVzdEtleSlbXSk6IFByb21pc2U8dm9pZD47XG5cbiAgLyoqIEdldHMgdGhlIHRleHQgZnJvbSB0aGUgZWxlbWVudC4gKi9cbiAgdGV4dCgpOiBQcm9taXNlPHN0cmluZz47XG5cbiAgLyoqIEdldHMgdGhlIHZhbHVlIGZvciB0aGUgZ2l2ZW4gYXR0cmlidXRlIGZyb20gdGhlIGVsZW1lbnQuICovXG4gIGdldEF0dHJpYnV0ZShuYW1lOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+O1xuXG4gIC8qKiBDaGVja3Mgd2hldGhlciB0aGUgZWxlbWVudCBoYXMgdGhlIGdpdmVuIGNsYXNzLiAqL1xuICBoYXNDbGFzcyhuYW1lOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+O1xuXG4gIC8qKiBHZXRzIHRoZSBkaW1lbnNpb25zIG9mIHRoZSBlbGVtZW50LiAqL1xuICBnZXREaW1lbnNpb25zKCk6IFByb21pc2U8RWxlbWVudERpbWVuc2lvbnM+O1xuXG4gIC8qKiBHZXRzIHRoZSB2YWx1ZSBvZiBhIHByb3BlcnR5IG9mIGFuIGVsZW1lbnQuICovXG4gIGdldFByb3BlcnR5KG5hbWU6IHN0cmluZyk6IFByb21pc2U8YW55PjtcblxuICAvKiogQ2hlY2tzIHdoZXRoZXIgdGhpcyBlbGVtZW50IG1hdGNoZXMgdGhlIGdpdmVuIHNlbGVjdG9yLiAqL1xuICBtYXRjaGVzU2VsZWN0b3Ioc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj47XG59XG4iXX0=