"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addBodyClass = exports.getHtmlHeadTagElement = exports.appendHtmlElementToHead = void 0;
const schematics_1 = require("@angular-devkit/schematics");
const parse5_element_1 = require("./parse5-element");
const parse5_1 = require("parse5");
/** Appends the given element HTML fragment to the `<head>` element of the specified HTML file. */
function appendHtmlElementToHead(host, htmlFilePath, elementHtml) {
    const htmlFileBuffer = host.read(htmlFilePath);
    if (!htmlFileBuffer) {
        throw new schematics_1.SchematicsException(`Could not read file for path: ${htmlFilePath}`);
    }
    const htmlContent = htmlFileBuffer.toString();
    if (htmlContent.includes(elementHtml)) {
        return;
    }
    const headTag = getHtmlHeadTagElement(htmlContent);
    if (!headTag) {
        throw Error(`Could not find '<head>' element in HTML file: ${htmlFileBuffer}`);
    }
    // We always have access to the source code location here because the `getHeadTagElement`
    // function explicitly has the `sourceCodeLocationInfo` option enabled.
    const endTagOffset = headTag.sourceCodeLocation.endTag.startOffset;
    const indentationOffset = (0, parse5_element_1.getChildElementIndentation)(headTag);
    const insertion = `${' '.repeat(indentationOffset)}${elementHtml}`;
    const recordedChange = host.beginUpdate(htmlFilePath).insertRight(endTagOffset, `${insertion}\n`);
    host.commitUpdate(recordedChange);
}
exports.appendHtmlElementToHead = appendHtmlElementToHead;
/** Parses the given HTML file and returns the head element if available. */
function getHtmlHeadTagElement(htmlContent) {
    return getElementByTagName('head', htmlContent);
}
exports.getHtmlHeadTagElement = getHtmlHeadTagElement;
/** Adds a class to the body of the document. */
function addBodyClass(host, htmlFilePath, className) {
    const htmlFileBuffer = host.read(htmlFilePath);
    if (!htmlFileBuffer) {
        throw new schematics_1.SchematicsException(`Could not read file for path: ${htmlFilePath}`);
    }
    const htmlContent = htmlFileBuffer.toString();
    const body = getElementByTagName('body', htmlContent);
    if (!body) {
        throw Error(`Could not find <body> element in HTML file: ${htmlFileBuffer}`);
    }
    const classAttribute = body.attrs.find(attribute => attribute.name === 'class');
    if (classAttribute) {
        const hasClass = classAttribute.value
            .split(' ')
            .map(part => part.trim())
            .includes(className);
        if (!hasClass) {
            // We have source code location info enabled, and we pre-checked that the element
            // has attributes, specifically the `class` attribute.
            const classAttributeLocation = body.sourceCodeLocation.attrs['class'];
            const recordedChange = host
                .beginUpdate(htmlFilePath)
                .insertRight(classAttributeLocation.endOffset - 1, ` ${className}`);
            host.commitUpdate(recordedChange);
        }
    }
    else {
        const recordedChange = host
            .beginUpdate(htmlFilePath)
            .insertRight(body.sourceCodeLocation.startTag.endOffset - 1, ` class="${className}"`);
        host.commitUpdate(recordedChange);
    }
}
exports.addBodyClass = addBodyClass;
/** Finds an element by its tag name. */
function getElementByTagName(tagName, htmlContent) {
    const document = (0, parse5_1.parse)(htmlContent, { sourceCodeLocationInfo: true });
    const nodeQueue = [...document.childNodes];
    while (nodeQueue.length) {
        const node = nodeQueue.shift();
        if (node.nodeName.toLowerCase() === tagName) {
            return node;
        }
        else if (node.childNodes) {
            nodeQueue.push(...node.childNodes);
        }
    }
    return null;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC1tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXRpbHMvaHRtbC1tYW5pcHVsYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsMkRBQXFFO0FBQ3JFLHFEQUFxRTtBQUNyRSxtQ0FBMEM7QUFFMUMsa0dBQWtHO0FBQ2xHLFNBQWdCLHVCQUF1QixDQUFDLElBQVUsRUFBRSxZQUFvQixFQUFFLFdBQW1CO0lBQzNGLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7SUFFL0MsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ3BCLE1BQU0sSUFBSSxnQ0FBbUIsQ0FBQyxpQ0FBaUMsWUFBWSxFQUFFLENBQUMsQ0FBQztJQUNqRixDQUFDO0lBRUQsTUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBRTlDLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDO1FBQ3RDLE9BQU87SUFDVCxDQUFDO0lBRUQsTUFBTSxPQUFPLEdBQUcscUJBQXFCLENBQUMsV0FBVyxDQUFDLENBQUM7SUFFbkQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2IsTUFBTSxLQUFLLENBQUMsaURBQWlELGNBQWMsRUFBRSxDQUFDLENBQUM7SUFDakYsQ0FBQztJQUVELHlGQUF5RjtJQUN6Rix1RUFBdUU7SUFDdkUsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLGtCQUFtQixDQUFDLE1BQU8sQ0FBQyxXQUFXLENBQUM7SUFDckUsTUFBTSxpQkFBaUIsR0FBRyxJQUFBLDJDQUEwQixFQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzlELE1BQU0sU0FBUyxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLFdBQVcs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SUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxLQUFLLE9BQU8sRUFBRSxDQUFDO1lBQzVDLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQzthQUFNLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQzNCLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDckMsQ0FBQztJQUNILENBQUM7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge0VsZW1lbnQsIGdldENoaWxkRWxlbWVudEluZGVudGF0aW9ufSBmcm9tICcuL3BhcnNlNS1lbGVtZW50JztcbmltcG9ydCB7cGFyc2UgYXMgcGFyc2VIdG1sfSBmcm9tICdwYXJzZTUnO1xuXG4vKiogQXBwZW5kcyB0aGUgZ2l2ZW4gZWxlbWVudCBIVE1MIGZyYWdtZW50IHRvIHRoZSBgPGhlYWQ+YCBlbGVtZW50IG9mIHRoZSBzcGVjaWZpZWQgSFRNTCBmaWxlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZEh0bWxFbGVtZW50VG9IZWFkKGhvc3Q6IFRyZWUsIGh0bWxGaWxlUGF0aDogc3RyaW5nLCBlbGVtZW50SHRtbDogc3RyaW5nKSB7XG4gIGNvbnN0IGh0bWxGaWxlQnVmZmVyID0gaG9zdC5yZWFkKGh0bWxGaWxlUGF0aCk7XG5cbiAgaWYgKCFodG1sRmlsZUJ1ZmZlcikge1xuICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKGBDb3VsZCBub3QgcmVhZCBmaWxlIGZvciBwYXRoOiAke2h0bWxGaWxlUGF0aH1gKTtcbiAgfVxuXG4gIGNvbnN0IGh0bWxDb250ZW50ID0gaHRtbEZpbGVCdWZmZXIudG9TdHJpbmcoKTtcblxuICBpZiAoaHRtbENvbnRlbnQuaW5jbHVkZXMoZWxlbWVudEh0bWwpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgaGVhZFRhZyA9IGdldEh0bWxIZWFkVGFnRWxlbWVudChodG1sQ29udGVudCk7XG5cbiAgaWYgKCFoZWFkVGFnKSB7XG4gICAgdGhyb3cgRXJyb3IoYENvdWxkIG5vdCBmaW5kICc8aGVhZD4nIGVsZW1lbnQgaW4gSFRNTCBmaWxlOiAke2h0bWxGaWxlQnVmZmVyfWApO1xuICB9XG5cbiAgLy8gV2UgYWx3YXlzIGhhdmUgYWNjZXNzIHRvIHRoZSBzb3VyY2UgY29kZSBsb2NhdGlvbiBoZXJlIGJlY2F1c2UgdGhlIGBnZXRIZWFkVGFnRWxlbWVudGBcbiAgLy8gZnVuY3Rpb24gZXhwbGljaXRseSBoYXMgdGhlIGBzb3VyY2VDb2RlTG9jYXRpb25JbmZvYCBvcHRpb24gZW5hYmxlZC5cbiAgY29uc3QgZW5kVGFnT2Zmc2V0ID0gaGVhZFRhZy5zb3VyY2VDb2RlTG9jYXRpb24hLmVuZFRhZyEuc3RhcnRPZmZzZXQ7XG4gIGNvbnN0IGluZGVudGF0aW9uT2Zmc2V0ID0gZ2V0Q2hpbGRFbGVtZW50SW5kZW50YXRpb24oaGVhZFRhZyk7XG4gIGNvbnN0IGluc2VydGlvbiA9IGAkeycgJy5yZXBlYXQoaW5kZW50YXRpb25PZmZzZXQpfSR7ZWxlbWVudEh0bWx9YDtcblxuICBjb25zdCByZWNvcmRlZENoYW5nZSA9IGhvc3QuYmVnaW5VcGRhdGUoaHRtbEZpbGVQYXRoKS5pbnNlcnRSaWdodChlbmRUYWdPZmZzZXQsIGAke2luc2VydGlvbn1cXG5gKTtcblxuICBob3N0LmNvbW1pdFVwZGF0ZShyZWNvcmRlZENoYW5nZSk7XG59XG5cbi8qKiBQYXJzZXMgdGhlIGdpdmVuIEhUTUwgZmlsZSBhbmQgcmV0dXJucyB0aGUgaGVhZCBlbGVtZW50IGlmIGF2YWlsYWJsZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRIdG1sSGVhZFRhZ0VsZW1lbnQoaHRtbENvbnRlbnQ6IHN0cmluZyk6IEVsZW1lbnQgfCBudWxsIHtcbiAgcmV0dXJuIGdldEVsZW1lbnRCeVRhZ05hbWUoJ2hlYWQnLCBodG1sQ29udGVudCk7XG59XG5cbi8qKiBBZGRzIGEgY2xhc3MgdG8gdGhlIGJvZHkgb2YgdGhlIGRvY3VtZW50LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZEJvZHlDbGFzcyhob3N0OiBUcmVlLCBodG1sRmlsZVBhdGg6IHN0cmluZywgY2xhc3NOYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgY29uc3QgaHRtbEZpbGVCdWZmZXIgPSBob3N0LnJlYWQoaHRtbEZpbGVQYXRoKTtcblxuICBpZiAoIWh0bWxGaWxlQnVmZmVyKSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYENvdWxkIG5vdCByZWFkIGZpbGUgZm9yIHBhdGg6ICR7aHRtbEZpbGVQYXRofWApO1xuICB9XG5cbiAgY29uc3QgaHRtbENvbnRlbnQgPSBodG1sRmlsZUJ1ZmZlci50b1N0cmluZygpO1xuICBjb25zdCBib2R5ID0gZ2V0RWxlbWVudEJ5VGFnTmFtZSgnYm9keScsIGh0bWxDb250ZW50KTtcblxuICBpZiAoIWJvZHkpIHtcbiAgICB0aHJvdyBFcnJvcihgQ291bGQgbm90IGZpbmQgPGJvZHk+IGVsZW1lbnQgaW4gSFRNTCBmaWxlOiAke2h0bWxGaWxlQnVmZmVyfWApO1xuICB9XG5cbiAgY29uc3QgY2xhc3NBdHRyaWJ1dGUgPSBib2R5LmF0dHJzLmZpbmQoYXR0cmlidXRlID0+IGF0dHJpYnV0ZS5uYW1lID09PSAnY2xhc3MnKTtcblxuICBpZiAoY2xhc3NBdHRyaWJ1dGUpIHtcbiAgICBjb25zdCBoYXNDbGFzcyA9IGNsYXNzQXR0cmlidXRlLnZhbHVlXG4gICAgICAuc3BsaXQoJyAnKVxuICAgICAgLm1hcChwYXJ0ID0+IHBhcnQudHJpbSgpKVxuICAgICAgLmluY2x1ZGVzKGNsYXNzTmFtZSk7XG5cbiAgICBpZiAoIWhhc0NsYXNzKSB7XG4gICAgICAvLyBXZSBoYXZlIHNvdXJjZSBjb2RlIGxvY2F0aW9uIGluZm8gZW5hYmxlZCwgYW5kIHdlIHByZS1jaGVja2VkIHRoYXQgdGhlIGVsZW1lbnRcbiAgICAgIC8vIGhhcyBhdHRyaWJ1dGVzLCBzcGVjaWZpY2FsbHkgdGhlIGBjbGFzc2AgYXR0cmlidXRlLlxuICAgICAgY29uc3QgY2xhc3NBdHRyaWJ1dGVMb2NhdGlvbiA9IGJvZHkuc291cmNlQ29kZUxvY2F0aW9uIS5hdHRycyFbJ2NsYXNzJ107XG4gICAgICBjb25zdCByZWNvcmRlZENoYW5nZSA9IGhvc3RcbiAgICAgICAgLmJlZ2luVXBkYXRlKGh0bWxGaWxlUGF0aClcbiAgICAgICAgLmluc2VydFJpZ2h0KGNsYXNzQXR0cmlidXRlTG9jYXRpb24uZW5kT2Zmc2V0IC0gMSwgYCAke2NsYXNzTmFtZX1gKTtcbiAgICAgIGhvc3QuY29tbWl0VXBkYXRlKHJlY29yZGVkQ2hhbmdlKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgcmVjb3JkZWRDaGFuZ2UgPSBob3N0XG4gICAgICAuYmVnaW5VcGRhdGUoaHRtbEZpbGVQYXRoKVxuICAgICAgLmluc2VydFJpZ2h0KGJvZHkuc291cmNlQ29kZUxvY2F0aW9uIS5zdGFydFRhZyEuZW5kT2Zmc2V0IC0gMSwgYCBjbGFzcz1cIiR7Y2xhc3NOYW1lfVwiYCk7XG4gICAgaG9zdC5jb21taXRVcGRhdGUocmVjb3JkZWRDaGFuZ2UpO1xuICB9XG59XG5cbi8qKiBGaW5kcyBhbiBlbGVtZW50IGJ5IGl0cyB0YWcgbmFtZS4gKi9cbmZ1bmN0aW9uIGdldEVsZW1lbnRCeVRhZ05hbWUodGFnTmFtZTogc3RyaW5nLCBodG1sQ29udGVudDogc3RyaW5nKTogRWxlbWVudCB8IG51bGwge1xuICBjb25zdCBkb2N1bWVudCA9IHBhcnNlSHRtbChodG1sQ29udGVudCwge3NvdXJjZUNvZGVMb2NhdGlvbkluZm86IHRydWV9KTtcbiAgY29uc3Qgbm9kZVF1ZXVlID0gWy4uLmRvY3VtZW50LmNoaWxkTm9kZXNdO1xuXG4gIHdoaWxlIChub2RlUXVldWUubGVuZ3RoKSB7XG4gICAgY29uc3Qgbm9kZSA9IG5vZGVRdWV1ZS5zaGlmdCgpIGFzIEVsZW1lbnQ7XG5cbiAgICBpZiAobm9kZS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSB0YWdOYW1lKSB7XG4gICAgICByZXR1cm4gbm9kZTtcbiAgICB9IGVsc2UgaWYgKG5vZGUuY2hpbGROb2Rlcykge1xuICAgICAgbm9kZVF1ZXVlLnB1c2goLi4ubm9kZS5jaGlsZE5vZGVzKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cbiJdfQ==