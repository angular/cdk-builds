/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { dispatchFakeEvent, dispatchKeyboardEvent } from './dispatch-events';
import { triggerFocus } from './element-focus';
/**
 * Checks whether the given Element is a text input element.
 * @docs-private
 */
export function isTextInput(element) {
    var nodeName = element.nodeName.toLowerCase();
    return nodeName === 'input' || nodeName === 'textarea';
}
export function typeInElement(element) {
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
    triggerFocus(element);
    try {
        for (var keys_1 = tslib_1.__values(keys), keys_1_1 = keys_1.next(); !keys_1_1.done; keys_1_1 = keys_1.next()) {
            var key = keys_1_1.value;
            dispatchKeyboardEvent(element, 'keydown', key.keyCode, key.key, element, modifiers);
            dispatchKeyboardEvent(element, 'keypress', key.keyCode, key.key, element, modifiers);
            if (isTextInput(element) && key.key && key.key.length === 1) {
                element.value += key.key;
                dispatchFakeEvent(element, 'input');
            }
            dispatchKeyboardEvent(element, 'keyup', key.keyCode, key.key, element, modifiers);
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
/**
 * Clears the text in an input or textarea element.
 * @docs-private
 */
export function clearElement(element) {
    triggerFocus(element);
    element.value = '';
    dispatchFakeEvent(element, 'input');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZS1pbi1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL2Zha2UtZXZlbnRzL3R5cGUtaW4tZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUFDLGlCQUFpQixFQUFFLHFCQUFxQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDM0UsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBRzdDOzs7R0FHRztBQUNILE1BQU0sVUFBVSxXQUFXLENBQUMsT0FBZ0I7SUFDMUMsSUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUNoRCxPQUFPLFFBQVEsS0FBSyxPQUFPLElBQUksUUFBUSxLQUFLLFVBQVUsQ0FBRTtBQUMxRCxDQUFDO0FBdUJELE1BQU0sVUFBVSxhQUFhLENBQUMsT0FBb0I7O0lBQUUsMEJBQXdCO1NBQXhCLFVBQXdCLEVBQXhCLHFCQUF3QixFQUF4QixJQUF3QjtRQUF4Qix5Q0FBd0I7O0lBQzFFLElBQU0sS0FBSyxHQUFHLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xDLElBQUksU0FBdUIsQ0FBQztJQUM1QixJQUFJLElBQW1ELENBQUM7SUFDeEQsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxDQUFDLE9BQU8sS0FBSyxTQUFTLElBQUksS0FBSyxDQUFDLEdBQUcsS0FBSyxTQUFTLEVBQUU7UUFDdkYsU0FBUyxHQUFHLEtBQUssQ0FBQztRQUNsQixJQUFJLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ2xDO1NBQU07UUFDTCxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBQ2YsSUFBSSxHQUFHLGdCQUFnQixDQUFDO0tBQ3pCO0lBQ0QsSUFBTSxJQUFJLEdBQXVDLElBQUk7U0FDaEQsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsT0FBTyxDQUFDLEtBQUssUUFBUSxDQUFDLENBQUM7UUFDN0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLEVBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBQyxDQUFDLEVBQWxELENBQWtELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFEeEUsQ0FDd0UsQ0FBQztTQUNsRixNQUFNLENBQUMsVUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFLLE9BQUEsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBYixDQUFhLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFFM0MsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDOztRQUN0QixLQUFrQixJQUFBLFNBQUEsaUJBQUEsSUFBSSxDQUFBLDBCQUFBLDRDQUFFO1lBQW5CLElBQU0sR0FBRyxpQkFBQTtZQUNaLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsR0FBRyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNwRixxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDckYsSUFBSSxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksR0FBRyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7Z0JBQzNELE9BQU8sQ0FBQyxLQUFLLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQztnQkFDekIsaUJBQWlCLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2FBQ3JDO1lBQ0QscUJBQXFCLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1NBQ25GOzs7Ozs7Ozs7QUFDSCxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLFlBQVksQ0FBQyxPQUErQztJQUMxRSxZQUFZLENBQUMsT0FBc0IsQ0FBQyxDQUFDO0lBQ3JDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO0lBQ25CLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUN0QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7ZGlzcGF0Y2hGYWtlRXZlbnQsIGRpc3BhdGNoS2V5Ym9hcmRFdmVudH0gZnJvbSAnLi9kaXNwYXRjaC1ldmVudHMnO1xuaW1wb3J0IHt0cmlnZ2VyRm9jdXN9IGZyb20gJy4vZWxlbWVudC1mb2N1cyc7XG5pbXBvcnQge01vZGlmaWVyS2V5c30gZnJvbSAnLi9ldmVudC1vYmplY3RzJztcblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciB0aGUgZ2l2ZW4gRWxlbWVudCBpcyBhIHRleHQgaW5wdXQgZWxlbWVudC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzVGV4dElucHV0KGVsZW1lbnQ6IEVsZW1lbnQpOiBlbGVtZW50IGlzIEhUTUxJbnB1dEVsZW1lbnQgfCBIVE1MVGV4dEFyZWFFbGVtZW50IHtcbiAgY29uc3Qgbm9kZU5hbWUgPSBlbGVtZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiBub2RlTmFtZSA9PT0gJ2lucHV0JyB8fCBub2RlTmFtZSA9PT0gJ3RleHRhcmVhJyA7XG59XG5cbi8qKlxuICogRm9jdXNlcyBhbiBpbnB1dCwgc2V0cyBpdHMgdmFsdWUgYW5kIGRpc3BhdGNoZXNcbiAqIHRoZSBgaW5wdXRgIGV2ZW50LCBzaW11bGF0aW5nIHRoZSB1c2VyIHR5cGluZy5cbiAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgb250byB3aGljaCB0byBzZXQgdGhlIHZhbHVlLlxuICogQHBhcmFtIGtleXMgVGhlIGtleXMgdG8gc2VuZCB0byB0aGUgZWxlbWVudC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHR5cGVJbkVsZW1lbnQoXG4gICAgZWxlbWVudDogSFRNTEVsZW1lbnQsIC4uLmtleXM6IChzdHJpbmcgfCB7a2V5Q29kZT86IG51bWJlciwga2V5Pzogc3RyaW5nfSlbXSk6IHZvaWQ7XG5cbi8qKlxuICogRm9jdXNlcyBhbiBpbnB1dCwgc2V0cyBpdHMgdmFsdWUgYW5kIGRpc3BhdGNoZXNcbiAqIHRoZSBgaW5wdXRgIGV2ZW50LCBzaW11bGF0aW5nIHRoZSB1c2VyIHR5cGluZy5cbiAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgb250byB3aGljaCB0byBzZXQgdGhlIHZhbHVlLlxuICogQHBhcmFtIG1vZGlmaWVycyBNb2RpZmllciBrZXlzIHRoYXQgYXJlIGhlbGQgd2hpbGUgdHlwaW5nLlxuICogQHBhcmFtIGtleXMgVGhlIGtleXMgdG8gc2VuZCB0byB0aGUgZWxlbWVudC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHR5cGVJbkVsZW1lbnQoZWxlbWVudDogSFRNTEVsZW1lbnQsIG1vZGlmaWVyczogTW9kaWZpZXJLZXlzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4ua2V5czogKHN0cmluZyB8IHtrZXlDb2RlPzogbnVtYmVyLCBrZXk/OiBzdHJpbmd9KVtdKTogdm9pZDtcblxuZXhwb3J0IGZ1bmN0aW9uIHR5cGVJbkVsZW1lbnQoZWxlbWVudDogSFRNTEVsZW1lbnQsIC4uLm1vZGlmaWVyc0FuZEtleXM6IGFueSkge1xuICBjb25zdCBmaXJzdCA9IG1vZGlmaWVyc0FuZEtleXNbMF07XG4gIGxldCBtb2RpZmllcnM6IE1vZGlmaWVyS2V5cztcbiAgbGV0IHJlc3Q6IChzdHJpbmcgfCB7a2V5Q29kZT86IG51bWJlciwga2V5Pzogc3RyaW5nfSlbXTtcbiAgaWYgKHR5cGVvZiBmaXJzdCAhPT0gJ3N0cmluZycgJiYgZmlyc3Qua2V5Q29kZSA9PT0gdW5kZWZpbmVkICYmIGZpcnN0LmtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbW9kaWZpZXJzID0gZmlyc3Q7XG4gICAgcmVzdCA9IG1vZGlmaWVyc0FuZEtleXMuc2xpY2UoMSk7XG4gIH0gZWxzZSB7XG4gICAgbW9kaWZpZXJzID0ge307XG4gICAgcmVzdCA9IG1vZGlmaWVyc0FuZEtleXM7XG4gIH1cbiAgY29uc3Qga2V5czoge2tleUNvZGU/OiBudW1iZXIsIGtleT86IHN0cmluZ31bXSA9IHJlc3RcbiAgICAgIC5tYXAoayA9PiB0eXBlb2YgayA9PT0gJ3N0cmluZycgP1xuICAgICAgICAgIGsuc3BsaXQoJycpLm1hcChjID0+ICh7a2V5Q29kZTogYy50b1VwcGVyQ2FzZSgpLmNoYXJDb2RlQXQoMCksIGtleTogY30pKSA6IFtrXSlcbiAgICAgIC5yZWR1Y2UoKGFyciwgaykgPT4gYXJyLmNvbmNhdChrKSwgW10pO1xuXG4gIHRyaWdnZXJGb2N1cyhlbGVtZW50KTtcbiAgZm9yIChjb25zdCBrZXkgb2Yga2V5cykge1xuICAgIGRpc3BhdGNoS2V5Ym9hcmRFdmVudChlbGVtZW50LCAna2V5ZG93bicsIGtleS5rZXlDb2RlLCBrZXkua2V5LCBlbGVtZW50LCBtb2RpZmllcnMpO1xuICAgIGRpc3BhdGNoS2V5Ym9hcmRFdmVudChlbGVtZW50LCAna2V5cHJlc3MnLCBrZXkua2V5Q29kZSwga2V5LmtleSwgZWxlbWVudCwgbW9kaWZpZXJzKTtcbiAgICBpZiAoaXNUZXh0SW5wdXQoZWxlbWVudCkgJiYga2V5LmtleSAmJiBrZXkua2V5Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgZWxlbWVudC52YWx1ZSArPSBrZXkua2V5O1xuICAgICAgZGlzcGF0Y2hGYWtlRXZlbnQoZWxlbWVudCwgJ2lucHV0Jyk7XG4gICAgfVxuICAgIGRpc3BhdGNoS2V5Ym9hcmRFdmVudChlbGVtZW50LCAna2V5dXAnLCBrZXkua2V5Q29kZSwga2V5LmtleSwgZWxlbWVudCwgbW9kaWZpZXJzKTtcbiAgfVxufVxuXG4vKipcbiAqIENsZWFycyB0aGUgdGV4dCBpbiBhbiBpbnB1dCBvciB0ZXh0YXJlYSBlbGVtZW50LlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xlYXJFbGVtZW50KGVsZW1lbnQ6IEhUTUxJbnB1dEVsZW1lbnQgfCBIVE1MVGV4dEFyZWFFbGVtZW50KSB7XG4gIHRyaWdnZXJGb2N1cyhlbGVtZW50IGFzIEhUTUxFbGVtZW50KTtcbiAgZWxlbWVudC52YWx1ZSA9ICcnO1xuICBkaXNwYXRjaEZha2VFdmVudChlbGVtZW50LCAnaW5wdXQnKTtcbn1cbiJdfQ==