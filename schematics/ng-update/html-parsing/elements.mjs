"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStartOffsetOfAttribute = exports.findAttributeOnElementWithAttrs = exports.findAttributeOnElementWithTag = exports.findElementsWithAttribute = void 0;
const parse5_1 = require("parse5");
/**
 * Parses a HTML fragment and traverses all AST nodes in order find elements that
 * include the specified attribute.
 */
function findElementsWithAttribute(html, attributeName) {
    const document = (0, parse5_1.parseFragment)(html, { sourceCodeLocationInfo: true });
    const elements = [];
    const visitNodes = (nodes) => {
        nodes.forEach(n => {
            var _a;
            const node = n;
            if (node.childNodes) {
                visitNodes(node.childNodes);
            }
            if ((_a = node.attrs) === null || _a === void 0 ? void 0 : _a.some(attr => attr.name === attributeName.toLowerCase())) {
                elements.push(node);
            }
        });
    };
    visitNodes(document.childNodes);
    return elements;
}
exports.findElementsWithAttribute = findElementsWithAttribute;
/**
 * Finds elements with explicit tag names that also contain the specified attribute. Returns the
 * attribute start offset based on the specified HTML.
 */
function findAttributeOnElementWithTag(html, name, tagNames) {
    return findElementsWithAttribute(html, name)
        .filter(element => tagNames.includes(element.tagName))
        .map(element => getStartOffsetOfAttribute(element, name));
}
exports.findAttributeOnElementWithTag = findAttributeOnElementWithTag;
/**
 * Finds elements that contain the given attribute and contain at least one of the other
 * specified attributes. Returns the primary attribute's start offset based on the specified HTML.
 */
function findAttributeOnElementWithAttrs(html, name, attrs) {
    return findElementsWithAttribute(html, name)
        .filter(element => attrs.some(attr => hasElementAttribute(element, attr)))
        .map(element => getStartOffsetOfAttribute(element, name));
}
exports.findAttributeOnElementWithAttrs = findAttributeOnElementWithAttrs;
/** Shorthand function that checks if the specified element contains the given attribute. */
function hasElementAttribute(element, attributeName) {
    return element.attrs && element.attrs.some(attr => attr.name === attributeName.toLowerCase());
}
/** Gets the start offset of the given attribute from a Parse5 element. */
function getStartOffsetOfAttribute(element, attributeName) {
    return element.sourceCodeLocation.attrs[attributeName.toLowerCase()].startOffset;
}
exports.getStartOffsetOfAttribute = getStartOffsetOfAttribute;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctdXBkYXRlL2h0bWwtcGFyc2luZy9lbGVtZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCxtQ0FBeUQ7QUFFekQ7OztHQUdHO0FBQ0gsU0FBZ0IseUJBQXlCLENBQUMsSUFBWSxFQUFFLGFBQXFCO0lBQzNFLE1BQU0sUUFBUSxHQUFHLElBQUEsc0JBQWEsRUFBQyxJQUFJLEVBQUUsRUFBQyxzQkFBc0IsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0lBQ3JFLE1BQU0sUUFBUSxHQUFjLEVBQUUsQ0FBQztJQUUvQixNQUFNLFVBQVUsR0FBRyxDQUFDLEtBQWtCLEVBQUUsRUFBRTtRQUN4QyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFOztZQUNoQixNQUFNLElBQUksR0FBRyxDQUFZLENBQUM7WUFFMUIsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO2dCQUNuQixVQUFVLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2FBQzdCO1lBRUQsSUFBSSxNQUFBLElBQUksQ0FBQyxLQUFLLDBDQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssYUFBYSxDQUFDLFdBQVcsRUFBRSxDQUFDLEVBQUU7Z0JBQ3ZFLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDckI7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQztJQUVGLFVBQVUsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7SUFFaEMsT0FBTyxRQUFRLENBQUM7QUFDbEIsQ0FBQztBQXJCRCw4REFxQkM7QUFFRDs7O0dBR0c7QUFDSCxTQUFnQiw2QkFBNkIsQ0FBQyxJQUFZLEVBQUUsSUFBWSxFQUFFLFFBQWtCO0lBQzFGLE9BQU8seUJBQXlCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQztTQUN2QyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUNyRCxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNoRSxDQUFDO0FBSkQsc0VBSUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFnQiwrQkFBK0IsQ0FBQyxJQUFZLEVBQUUsSUFBWSxFQUFFLEtBQWU7SUFDekYsT0FBTyx5QkFBeUIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDO1NBQ3ZDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztTQUN6RSxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNoRSxDQUFDO0FBSkQsMEVBSUM7QUFFRCw0RkFBNEY7QUFDNUYsU0FBUyxtQkFBbUIsQ0FBQyxPQUFnQixFQUFFLGFBQXFCO0lBQ2xFLE9BQU8sT0FBTyxDQUFDLEtBQUssSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssYUFBYSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7QUFDaEcsQ0FBQztBQUdELDBFQUEwRTtBQUMxRSxTQUFnQix5QkFBeUIsQ0FBQyxPQUFZLEVBQUUsYUFBcUI7SUFDM0UsT0FBTyxPQUFPLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQztBQUNuRixDQUFDO0FBRkQsOERBRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDaGlsZE5vZGUsIEVsZW1lbnQsIHBhcnNlRnJhZ21lbnR9IGZyb20gJ3BhcnNlNSc7XG5cbi8qKlxuICogUGFyc2VzIGEgSFRNTCBmcmFnbWVudCBhbmQgdHJhdmVyc2VzIGFsbCBBU1Qgbm9kZXMgaW4gb3JkZXIgZmluZCBlbGVtZW50cyB0aGF0XG4gKiBpbmNsdWRlIHRoZSBzcGVjaWZpZWQgYXR0cmlidXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZEVsZW1lbnRzV2l0aEF0dHJpYnV0ZShodG1sOiBzdHJpbmcsIGF0dHJpYnV0ZU5hbWU6IHN0cmluZykge1xuICBjb25zdCBkb2N1bWVudCA9IHBhcnNlRnJhZ21lbnQoaHRtbCwge3NvdXJjZUNvZGVMb2NhdGlvbkluZm86IHRydWV9KTtcbiAgY29uc3QgZWxlbWVudHM6IEVsZW1lbnRbXSA9IFtdO1xuXG4gIGNvbnN0IHZpc2l0Tm9kZXMgPSAobm9kZXM6IENoaWxkTm9kZVtdKSA9PiB7XG4gICAgbm9kZXMuZm9yRWFjaChuID0+IHtcbiAgICAgIGNvbnN0IG5vZGUgPSBuIGFzIEVsZW1lbnQ7XG5cbiAgICAgIGlmIChub2RlLmNoaWxkTm9kZXMpIHtcbiAgICAgICAgdmlzaXROb2Rlcyhub2RlLmNoaWxkTm9kZXMpO1xuICAgICAgfVxuXG4gICAgICBpZiAobm9kZS5hdHRycz8uc29tZShhdHRyID0+IGF0dHIubmFtZSA9PT0gYXR0cmlidXRlTmFtZS50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgICBlbGVtZW50cy5wdXNoKG5vZGUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIHZpc2l0Tm9kZXMoZG9jdW1lbnQuY2hpbGROb2Rlcyk7XG5cbiAgcmV0dXJuIGVsZW1lbnRzO1xufVxuXG4vKipcbiAqIEZpbmRzIGVsZW1lbnRzIHdpdGggZXhwbGljaXQgdGFnIG5hbWVzIHRoYXQgYWxzbyBjb250YWluIHRoZSBzcGVjaWZpZWQgYXR0cmlidXRlLiBSZXR1cm5zIHRoZVxuICogYXR0cmlidXRlIHN0YXJ0IG9mZnNldCBiYXNlZCBvbiB0aGUgc3BlY2lmaWVkIEhUTUwuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kQXR0cmlidXRlT25FbGVtZW50V2l0aFRhZyhodG1sOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgdGFnTmFtZXM6IHN0cmluZ1tdKSB7XG4gIHJldHVybiBmaW5kRWxlbWVudHNXaXRoQXR0cmlidXRlKGh0bWwsIG5hbWUpXG4gICAgICAuZmlsdGVyKGVsZW1lbnQgPT4gdGFnTmFtZXMuaW5jbHVkZXMoZWxlbWVudC50YWdOYW1lKSlcbiAgICAgIC5tYXAoZWxlbWVudCA9PiBnZXRTdGFydE9mZnNldE9mQXR0cmlidXRlKGVsZW1lbnQsIG5hbWUpKTtcbn1cblxuLyoqXG4gKiBGaW5kcyBlbGVtZW50cyB0aGF0IGNvbnRhaW4gdGhlIGdpdmVuIGF0dHJpYnV0ZSBhbmQgY29udGFpbiBhdCBsZWFzdCBvbmUgb2YgdGhlIG90aGVyXG4gKiBzcGVjaWZpZWQgYXR0cmlidXRlcy4gUmV0dXJucyB0aGUgcHJpbWFyeSBhdHRyaWJ1dGUncyBzdGFydCBvZmZzZXQgYmFzZWQgb24gdGhlIHNwZWNpZmllZCBIVE1MLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZEF0dHJpYnV0ZU9uRWxlbWVudFdpdGhBdHRycyhodG1sOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgYXR0cnM6IHN0cmluZ1tdKSB7XG4gIHJldHVybiBmaW5kRWxlbWVudHNXaXRoQXR0cmlidXRlKGh0bWwsIG5hbWUpXG4gICAgICAuZmlsdGVyKGVsZW1lbnQgPT4gYXR0cnMuc29tZShhdHRyID0+IGhhc0VsZW1lbnRBdHRyaWJ1dGUoZWxlbWVudCwgYXR0cikpKVxuICAgICAgLm1hcChlbGVtZW50ID0+IGdldFN0YXJ0T2Zmc2V0T2ZBdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSkpO1xufVxuXG4vKiogU2hvcnRoYW5kIGZ1bmN0aW9uIHRoYXQgY2hlY2tzIGlmIHRoZSBzcGVjaWZpZWQgZWxlbWVudCBjb250YWlucyB0aGUgZ2l2ZW4gYXR0cmlidXRlLiAqL1xuZnVuY3Rpb24gaGFzRWxlbWVudEF0dHJpYnV0ZShlbGVtZW50OiBFbGVtZW50LCBhdHRyaWJ1dGVOYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIGVsZW1lbnQuYXR0cnMgJiYgZWxlbWVudC5hdHRycy5zb21lKGF0dHIgPT4gYXR0ci5uYW1lID09PSBhdHRyaWJ1dGVOYW1lLnRvTG93ZXJDYXNlKCkpO1xufVxuXG5cbi8qKiBHZXRzIHRoZSBzdGFydCBvZmZzZXQgb2YgdGhlIGdpdmVuIGF0dHJpYnV0ZSBmcm9tIGEgUGFyc2U1IGVsZW1lbnQuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3RhcnRPZmZzZXRPZkF0dHJpYnV0ZShlbGVtZW50OiBhbnksIGF0dHJpYnV0ZU5hbWU6IHN0cmluZyk6IG51bWJlciB7XG4gIHJldHVybiBlbGVtZW50LnNvdXJjZUNvZGVMb2NhdGlvbi5hdHRyc1thdHRyaWJ1dGVOYW1lLnRvTG93ZXJDYXNlKCldLnN0YXJ0T2Zmc2V0O1xufVxuIl19