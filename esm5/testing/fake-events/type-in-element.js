/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __values } from "tslib";
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
        for (var keys_1 = __values(keys), keys_1_1 = keys_1.next(); !keys_1_1.done; keys_1_1 = keys_1.next()) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZS1pbi1lbGVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL2Zha2UtZXZlbnRzL3R5cGUtaW4tZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUFDLGlCQUFpQixFQUFFLHFCQUFxQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDM0UsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBRzdDOzs7R0FHRztBQUNILE1BQU0sVUFBVSxXQUFXLENBQUMsT0FBZ0I7SUFDMUMsSUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUNoRCxPQUFPLFFBQVEsS0FBSyxPQUFPLElBQUksUUFBUSxLQUFLLFVBQVUsQ0FBRTtBQUMxRCxDQUFDO0FBdUJELE1BQU0sVUFBVSxhQUFhLENBQUMsT0FBb0I7O0lBQUUsMEJBQXdCO1NBQXhCLFVBQXdCLEVBQXhCLHFCQUF3QixFQUF4QixJQUF3QjtRQUF4Qix5Q0FBd0I7O0lBQzFFLElBQU0sS0FBSyxHQUFHLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xDLElBQUksU0FBdUIsQ0FBQztJQUM1QixJQUFJLElBQW1ELENBQUM7SUFDeEQsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxDQUFDLE9BQU8sS0FBSyxTQUFTLElBQUksS0FBSyxDQUFDLEdBQUcsS0FBSyxTQUFTLEVBQUU7UUFDdkYsU0FBUyxHQUFHLEtBQUssQ0FBQztRQUNsQixJQUFJLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ2xDO1NBQU07UUFDTCxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBQ2YsSUFBSSxHQUFHLGdCQUFnQixDQUFDO0tBQ3pCO0lBQ0QsSUFBTSxJQUFJLEdBQXVDLElBQUk7U0FDaEQsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsT0FBTyxDQUFDLEtBQUssUUFBUSxDQUFDLENBQUM7UUFDN0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLEVBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBQyxDQUFDLEVBQWxELENBQWtELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFEeEUsQ0FDd0UsQ0FBQztTQUNsRixNQUFNLENBQUMsVUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFLLE9BQUEsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBYixDQUFhLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFFM0MsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDOztRQUN0QixLQUFrQixJQUFBLFNBQUEsU0FBQSxJQUFJLENBQUEsMEJBQUEsNENBQUU7WUFBbkIsSUFBTSxHQUFHLGlCQUFBO1lBQ1oscUJBQXFCLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxHQUFHLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3BGLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsR0FBRyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNyRixJQUFJLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxHQUFHLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDM0QsT0FBTyxDQUFDLEtBQUssSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDO2dCQUN6QixpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7YUFDckM7WUFDRCxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7U0FDbkY7Ozs7Ozs7OztBQUNILENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsWUFBWSxDQUFDLE9BQStDO0lBQzFFLFlBQVksQ0FBQyxPQUFzQixDQUFDLENBQUM7SUFDckMsT0FBTyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7SUFDbkIsaUJBQWlCLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ3RDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtkaXNwYXRjaEZha2VFdmVudCwgZGlzcGF0Y2hLZXlib2FyZEV2ZW50fSBmcm9tICcuL2Rpc3BhdGNoLWV2ZW50cyc7XG5pbXBvcnQge3RyaWdnZXJGb2N1c30gZnJvbSAnLi9lbGVtZW50LWZvY3VzJztcbmltcG9ydCB7TW9kaWZpZXJLZXlzfSBmcm9tICcuL2V2ZW50LW9iamVjdHMnO1xuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIHRoZSBnaXZlbiBFbGVtZW50IGlzIGEgdGV4dCBpbnB1dCBlbGVtZW50LlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNUZXh0SW5wdXQoZWxlbWVudDogRWxlbWVudCk6IGVsZW1lbnQgaXMgSFRNTElucHV0RWxlbWVudCB8IEhUTUxUZXh0QXJlYUVsZW1lbnQge1xuICBjb25zdCBub2RlTmFtZSA9IGVsZW1lbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIG5vZGVOYW1lID09PSAnaW5wdXQnIHx8IG5vZGVOYW1lID09PSAndGV4dGFyZWEnIDtcbn1cblxuLyoqXG4gKiBGb2N1c2VzIGFuIGlucHV0LCBzZXRzIGl0cyB2YWx1ZSBhbmQgZGlzcGF0Y2hlc1xuICogdGhlIGBpbnB1dGAgZXZlbnQsIHNpbXVsYXRpbmcgdGhlIHVzZXIgdHlwaW5nLlxuICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCBvbnRvIHdoaWNoIHRvIHNldCB0aGUgdmFsdWUuXG4gKiBAcGFyYW0ga2V5cyBUaGUga2V5cyB0byBzZW5kIHRvIHRoZSBlbGVtZW50LlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gdHlwZUluRWxlbWVudChcbiAgICBlbGVtZW50OiBIVE1MRWxlbWVudCwgLi4ua2V5czogKHN0cmluZyB8IHtrZXlDb2RlPzogbnVtYmVyLCBrZXk/OiBzdHJpbmd9KVtdKTogdm9pZDtcblxuLyoqXG4gKiBGb2N1c2VzIGFuIGlucHV0LCBzZXRzIGl0cyB2YWx1ZSBhbmQgZGlzcGF0Y2hlc1xuICogdGhlIGBpbnB1dGAgZXZlbnQsIHNpbXVsYXRpbmcgdGhlIHVzZXIgdHlwaW5nLlxuICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCBvbnRvIHdoaWNoIHRvIHNldCB0aGUgdmFsdWUuXG4gKiBAcGFyYW0gbW9kaWZpZXJzIE1vZGlmaWVyIGtleXMgdGhhdCBhcmUgaGVsZCB3aGlsZSB0eXBpbmcuXG4gKiBAcGFyYW0ga2V5cyBUaGUga2V5cyB0byBzZW5kIHRvIHRoZSBlbGVtZW50LlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gdHlwZUluRWxlbWVudChlbGVtZW50OiBIVE1MRWxlbWVudCwgbW9kaWZpZXJzOiBNb2RpZmllcktleXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5rZXlzOiAoc3RyaW5nIHwge2tleUNvZGU/OiBudW1iZXIsIGtleT86IHN0cmluZ30pW10pOiB2b2lkO1xuXG5leHBvcnQgZnVuY3Rpb24gdHlwZUluRWxlbWVudChlbGVtZW50OiBIVE1MRWxlbWVudCwgLi4ubW9kaWZpZXJzQW5kS2V5czogYW55KSB7XG4gIGNvbnN0IGZpcnN0ID0gbW9kaWZpZXJzQW5kS2V5c1swXTtcbiAgbGV0IG1vZGlmaWVyczogTW9kaWZpZXJLZXlzO1xuICBsZXQgcmVzdDogKHN0cmluZyB8IHtrZXlDb2RlPzogbnVtYmVyLCBrZXk/OiBzdHJpbmd9KVtdO1xuICBpZiAodHlwZW9mIGZpcnN0ICE9PSAnc3RyaW5nJyAmJiBmaXJzdC5rZXlDb2RlID09PSB1bmRlZmluZWQgJiYgZmlyc3Qua2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICBtb2RpZmllcnMgPSBmaXJzdDtcbiAgICByZXN0ID0gbW9kaWZpZXJzQW5kS2V5cy5zbGljZSgxKTtcbiAgfSBlbHNlIHtcbiAgICBtb2RpZmllcnMgPSB7fTtcbiAgICByZXN0ID0gbW9kaWZpZXJzQW5kS2V5cztcbiAgfVxuICBjb25zdCBrZXlzOiB7a2V5Q29kZT86IG51bWJlciwga2V5Pzogc3RyaW5nfVtdID0gcmVzdFxuICAgICAgLm1hcChrID0+IHR5cGVvZiBrID09PSAnc3RyaW5nJyA/XG4gICAgICAgICAgay5zcGxpdCgnJykubWFwKGMgPT4gKHtrZXlDb2RlOiBjLnRvVXBwZXJDYXNlKCkuY2hhckNvZGVBdCgwKSwga2V5OiBjfSkpIDogW2tdKVxuICAgICAgLnJlZHVjZSgoYXJyLCBrKSA9PiBhcnIuY29uY2F0KGspLCBbXSk7XG5cbiAgdHJpZ2dlckZvY3VzKGVsZW1lbnQpO1xuICBmb3IgKGNvbnN0IGtleSBvZiBrZXlzKSB7XG4gICAgZGlzcGF0Y2hLZXlib2FyZEV2ZW50KGVsZW1lbnQsICdrZXlkb3duJywga2V5LmtleUNvZGUsIGtleS5rZXksIGVsZW1lbnQsIG1vZGlmaWVycyk7XG4gICAgZGlzcGF0Y2hLZXlib2FyZEV2ZW50KGVsZW1lbnQsICdrZXlwcmVzcycsIGtleS5rZXlDb2RlLCBrZXkua2V5LCBlbGVtZW50LCBtb2RpZmllcnMpO1xuICAgIGlmIChpc1RleHRJbnB1dChlbGVtZW50KSAmJiBrZXkua2V5ICYmIGtleS5rZXkubGVuZ3RoID09PSAxKSB7XG4gICAgICBlbGVtZW50LnZhbHVlICs9IGtleS5rZXk7XG4gICAgICBkaXNwYXRjaEZha2VFdmVudChlbGVtZW50LCAnaW5wdXQnKTtcbiAgICB9XG4gICAgZGlzcGF0Y2hLZXlib2FyZEV2ZW50KGVsZW1lbnQsICdrZXl1cCcsIGtleS5rZXlDb2RlLCBrZXkua2V5LCBlbGVtZW50LCBtb2RpZmllcnMpO1xuICB9XG59XG5cbi8qKlxuICogQ2xlYXJzIHRoZSB0ZXh0IGluIGFuIGlucHV0IG9yIHRleHRhcmVhIGVsZW1lbnQuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGVhckVsZW1lbnQoZWxlbWVudDogSFRNTElucHV0RWxlbWVudCB8IEhUTUxUZXh0QXJlYUVsZW1lbnQpIHtcbiAgdHJpZ2dlckZvY3VzKGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpO1xuICBlbGVtZW50LnZhbHVlID0gJyc7XG4gIGRpc3BhdGNoRmFrZUV2ZW50KGVsZW1lbnQsICdpbnB1dCcpO1xufVxuIl19