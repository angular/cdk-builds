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
        define("@angular/cdk/testing/type-in-element", ["require", "exports", "tslib", "@angular/cdk/testing/dispatch-events", "@angular/cdk/testing/element-focus"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var dispatch_events_1 = require("@angular/cdk/testing/dispatch-events");
    var element_focus_1 = require("@angular/cdk/testing/element-focus");
    /**
     * Checks whether the given Element is a text input element.
     * @docs-private
     */
    function isTextInput(element) {
        return element.nodeName.toLowerCase() === 'input' ||
            element.nodeName.toLowerCase() === 'textarea';
    }
    exports.isTextInput = isTextInput;
    function typeInElement(element) {
        var e_1, _a;
        var modifiersAndKeys = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            modifiersAndKeys[_i - 1] = arguments[_i];
        }
        var first = modifiersAndKeys[0];
        var modifiers;
        var rest;
        if (typeof first !== 'string' && first.keyCode === undefined && first.key === undefined) {
            modifiers = first;
            rest = modifiersAndKeys.slice(1);
        }
        else {
            modifiers = {};
            rest = modifiersAndKeys;
        }
        var keys = rest
            .map(function (k) { return typeof k === 'string' ?
            k.split('').map(function (c) { return ({ keyCode: c.toUpperCase().charCodeAt(0), key: c }); }) : [k]; })
            .reduce(function (arr, k) { return arr.concat(k); }, []);
        element_focus_1.triggerFocus(element);
        try {
            for (var keys_1 = tslib_1.__values(keys), keys_1_1 = keys_1.next(); !keys_1_1.done; keys_1_1 = keys_1.next()) {
                var key = keys_1_1.value;
                dispatch_events_1.dispatchKeyboardEvent(element, 'keydown', key.keyCode, key.key, element, modifiers);
                dispatch_events_1.dispatchKeyboardEvent(element, 'keypress', key.keyCode, key.key, element, modifiers);
                if (isTextInput(element) && key.key && key.key.length === 1) {
                    element.value += key.key;
                    dispatch_events_1.dispatchFakeEvent(element, 'input');
                }
                dispatch_events_1.dispatchKeyboardEvent(element, 'keyup', key.keyCode, key.key, element, modifiers);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (keys_1_1 && !keys_1_1.done && (_a = keys_1.return)) _a.call(keys_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    exports.typeInElement = typeInElement;
    /**
     * Clears the text in an input or textarea element.
     * @docs-private
     */
    function clearElement(element) {
        element_focus_1.triggerFocus(element);
        element.value = '';
        dispatch_events_1.dispatchFakeEvent(element, 'input');
    }
    exports.clearElement = clearElement;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZS1pbi1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3R5cGUtaW4tZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCx3RUFBMkU7SUFDM0Usb0VBQTZDO0lBRzdDOzs7T0FHRztJQUNILFNBQWdCLFdBQVcsQ0FBQyxPQUFnQjtRQUMxQyxPQUFPLE9BQU8sQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLEtBQUssT0FBTztZQUM3QyxPQUFPLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxLQUFLLFVBQVUsQ0FBRTtJQUNyRCxDQUFDO0lBSEQsa0NBR0M7SUF1QkQsU0FBZ0IsYUFBYSxDQUFDLE9BQW9COztRQUFFLDBCQUF3QjthQUF4QixVQUF3QixFQUF4QixxQkFBd0IsRUFBeEIsSUFBd0I7WUFBeEIseUNBQXdCOztRQUMxRSxJQUFNLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsQyxJQUFJLFNBQXVCLENBQUM7UUFDNUIsSUFBSSxJQUFtRCxDQUFDO1FBQ3hELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssQ0FBQyxPQUFPLEtBQUssU0FBUyxJQUFJLEtBQUssQ0FBQyxHQUFHLEtBQUssU0FBUyxFQUFFO1lBQ3ZGLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFDbEIsSUFBSSxHQUFHLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNsQzthQUFNO1lBQ0wsU0FBUyxHQUFHLEVBQUUsQ0FBQztZQUNmLElBQUksR0FBRyxnQkFBZ0IsQ0FBQztTQUN6QjtRQUNELElBQU0sSUFBSSxHQUF1QyxJQUFJO2FBQ2hELEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLE9BQU8sQ0FBQyxLQUFLLFFBQVEsQ0FBQyxDQUFDO1lBQzdCLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxFQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUMsQ0FBQyxFQUFsRCxDQUFrRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBRHhFLENBQ3dFLENBQUM7YUFDbEYsTUFBTSxDQUFDLFVBQUMsR0FBRyxFQUFFLENBQUMsSUFBSyxPQUFBLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQWIsQ0FBYSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRTNDLDRCQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7O1lBQ3RCLEtBQWtCLElBQUEsU0FBQSxpQkFBQSxJQUFJLENBQUEsMEJBQUEsNENBQUU7Z0JBQW5CLElBQU0sR0FBRyxpQkFBQTtnQkFDWix1Q0FBcUIsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ3BGLHVDQUFxQixDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsR0FBRyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDckYsSUFBSSxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksR0FBRyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7b0JBQzNELE9BQU8sQ0FBQyxLQUFLLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQztvQkFDekIsbUNBQWlCLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2lCQUNyQztnQkFDRCx1Q0FBcUIsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7YUFDbkY7Ozs7Ozs7OztJQUNILENBQUM7SUExQkQsc0NBMEJDO0lBRUQ7OztPQUdHO0lBQ0gsU0FBZ0IsWUFBWSxDQUFDLE9BQStDO1FBQzFFLDRCQUFZLENBQUMsT0FBc0IsQ0FBQyxDQUFDO1FBQ3JDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO1FBQ25CLG1DQUFpQixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBSkQsb0NBSUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtkaXNwYXRjaEZha2VFdmVudCwgZGlzcGF0Y2hLZXlib2FyZEV2ZW50fSBmcm9tICcuL2Rpc3BhdGNoLWV2ZW50cyc7XG5pbXBvcnQge3RyaWdnZXJGb2N1c30gZnJvbSAnLi9lbGVtZW50LWZvY3VzJztcbmltcG9ydCB7TW9kaWZpZXJLZXlzfSBmcm9tICcuL2V2ZW50LW9iamVjdHMnO1xuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIHRoZSBnaXZlbiBFbGVtZW50IGlzIGEgdGV4dCBpbnB1dCBlbGVtZW50LlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNUZXh0SW5wdXQoZWxlbWVudDogRWxlbWVudCk6IGVsZW1lbnQgaXMgSFRNTElucHV0RWxlbWVudCB8IEhUTUxUZXh0QXJlYUVsZW1lbnQge1xuICByZXR1cm4gZWxlbWVudC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnaW5wdXQnIHx8XG4gICAgICBlbGVtZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICd0ZXh0YXJlYScgO1xufVxuXG4vKipcbiAqIEZvY3VzZXMgYW4gaW5wdXQsIHNldHMgaXRzIHZhbHVlIGFuZCBkaXNwYXRjaGVzXG4gKiB0aGUgYGlucHV0YCBldmVudCwgc2ltdWxhdGluZyB0aGUgdXNlciB0eXBpbmcuXG4gKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IG9udG8gd2hpY2ggdG8gc2V0IHRoZSB2YWx1ZS5cbiAqIEBwYXJhbSBrZXlzIFRoZSBrZXlzIHRvIHNlbmQgdG8gdGhlIGVsZW1lbnQuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0eXBlSW5FbGVtZW50KFxuICAgIGVsZW1lbnQ6IEhUTUxFbGVtZW50LCAuLi5rZXlzOiAoc3RyaW5nIHwge2tleUNvZGU/OiBudW1iZXIsIGtleT86IHN0cmluZ30pW10pOiB2b2lkO1xuXG4vKipcbiAqIEZvY3VzZXMgYW4gaW5wdXQsIHNldHMgaXRzIHZhbHVlIGFuZCBkaXNwYXRjaGVzXG4gKiB0aGUgYGlucHV0YCBldmVudCwgc2ltdWxhdGluZyB0aGUgdXNlciB0eXBpbmcuXG4gKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IG9udG8gd2hpY2ggdG8gc2V0IHRoZSB2YWx1ZS5cbiAqIEBwYXJhbSBtb2RpZmllcnMgTW9kaWZpZXIga2V5cyB0aGF0IGFyZSBoZWxkIHdoaWxlIHR5cGluZy5cbiAqIEBwYXJhbSBrZXlzIFRoZSBrZXlzIHRvIHNlbmQgdG8gdGhlIGVsZW1lbnQuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0eXBlSW5FbGVtZW50KGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBtb2RpZmllcnM6IE1vZGlmaWVyS2V5cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLmtleXM6IChzdHJpbmcgfCB7a2V5Q29kZT86IG51bWJlciwga2V5Pzogc3RyaW5nfSlbXSk6IHZvaWQ7XG5cbmV4cG9ydCBmdW5jdGlvbiB0eXBlSW5FbGVtZW50KGVsZW1lbnQ6IEhUTUxFbGVtZW50LCAuLi5tb2RpZmllcnNBbmRLZXlzOiBhbnkpIHtcbiAgY29uc3QgZmlyc3QgPSBtb2RpZmllcnNBbmRLZXlzWzBdO1xuICBsZXQgbW9kaWZpZXJzOiBNb2RpZmllcktleXM7XG4gIGxldCByZXN0OiAoc3RyaW5nIHwge2tleUNvZGU/OiBudW1iZXIsIGtleT86IHN0cmluZ30pW107XG4gIGlmICh0eXBlb2YgZmlyc3QgIT09ICdzdHJpbmcnICYmIGZpcnN0LmtleUNvZGUgPT09IHVuZGVmaW5lZCAmJiBmaXJzdC5rZXkgPT09IHVuZGVmaW5lZCkge1xuICAgIG1vZGlmaWVycyA9IGZpcnN0O1xuICAgIHJlc3QgPSBtb2RpZmllcnNBbmRLZXlzLnNsaWNlKDEpO1xuICB9IGVsc2Uge1xuICAgIG1vZGlmaWVycyA9IHt9O1xuICAgIHJlc3QgPSBtb2RpZmllcnNBbmRLZXlzO1xuICB9XG4gIGNvbnN0IGtleXM6IHtrZXlDb2RlPzogbnVtYmVyLCBrZXk/OiBzdHJpbmd9W10gPSByZXN0XG4gICAgICAubWFwKGsgPT4gdHlwZW9mIGsgPT09ICdzdHJpbmcnID9cbiAgICAgICAgICBrLnNwbGl0KCcnKS5tYXAoYyA9PiAoe2tleUNvZGU6IGMudG9VcHBlckNhc2UoKS5jaGFyQ29kZUF0KDApLCBrZXk6IGN9KSkgOiBba10pXG4gICAgICAucmVkdWNlKChhcnIsIGspID0+IGFyci5jb25jYXQoayksIFtdKTtcblxuICB0cmlnZ2VyRm9jdXMoZWxlbWVudCk7XG4gIGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcbiAgICBkaXNwYXRjaEtleWJvYXJkRXZlbnQoZWxlbWVudCwgJ2tleWRvd24nLCBrZXkua2V5Q29kZSwga2V5LmtleSwgZWxlbWVudCwgbW9kaWZpZXJzKTtcbiAgICBkaXNwYXRjaEtleWJvYXJkRXZlbnQoZWxlbWVudCwgJ2tleXByZXNzJywga2V5LmtleUNvZGUsIGtleS5rZXksIGVsZW1lbnQsIG1vZGlmaWVycyk7XG4gICAgaWYgKGlzVGV4dElucHV0KGVsZW1lbnQpICYmIGtleS5rZXkgJiYga2V5LmtleS5sZW5ndGggPT09IDEpIHtcbiAgICAgIGVsZW1lbnQudmFsdWUgKz0ga2V5LmtleTtcbiAgICAgIGRpc3BhdGNoRmFrZUV2ZW50KGVsZW1lbnQsICdpbnB1dCcpO1xuICAgIH1cbiAgICBkaXNwYXRjaEtleWJvYXJkRXZlbnQoZWxlbWVudCwgJ2tleXVwJywga2V5LmtleUNvZGUsIGtleS5rZXksIGVsZW1lbnQsIG1vZGlmaWVycyk7XG4gIH1cbn1cblxuLyoqXG4gKiBDbGVhcnMgdGhlIHRleHQgaW4gYW4gaW5wdXQgb3IgdGV4dGFyZWEgZWxlbWVudC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyRWxlbWVudChlbGVtZW50OiBIVE1MSW5wdXRFbGVtZW50IHwgSFRNTFRleHRBcmVhRWxlbWVudCkge1xuICB0cmlnZ2VyRm9jdXMoZWxlbWVudCBhcyBIVE1MRWxlbWVudCk7XG4gIGVsZW1lbnQudmFsdWUgPSAnJztcbiAgZGlzcGF0Y2hGYWtlRXZlbnQoZWxlbWVudCwgJ2lucHV0Jyk7XG59XG4iXX0=