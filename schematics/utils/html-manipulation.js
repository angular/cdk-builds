"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendHtmlElementToHead = appendHtmlElementToHead;
exports.getHtmlHeadTagElement = getHtmlHeadTagElement;
exports.addBodyClass = addBodyClass;
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
/** Parses the given HTML file and returns the head element if available. */
function getHtmlHeadTagElement(htmlContent) {
    return getElementByTagName('head', htmlContent);
}
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC1tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXRpbHMvaHRtbC1tYW5pcHVsYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFPSCwwREE0QkM7QUFHRCxzREFFQztBQUdELG9DQXFDQztBQTlFRCwyREFBcUU7QUFDckUscURBQXFFO0FBQ3JFLG1DQUEwQztBQUUxQyxrR0FBa0c7QUFDbEcsU0FBZ0IsdUJBQXVCLENBQUMsSUFBVSxFQUFFLFlBQW9CLEVBQUUsV0FBbUI7SUFDM0YsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUUvQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDcEIsTUFBTSxJQUFJLGdDQUFtQixDQUFDLGlDQUFpQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO0lBQ2pGLENBQUM7SUFFRCxNQUFNLFdBQVcsR0FBRyxjQUFjLENBQUMsUUFBUSxFQUFFLENBQUM7SUFFOUMsSUFBSSxXQUFXLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7UUFDdEMsT0FBTztJQUNULENBQUM7SUFFRCxNQUFNLE9BQU8sR0FBRyxxQkFBcUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUVuRCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDYixNQUFNLEtBQUssQ0FBQyxpREFBaUQsY0FBYyxFQUFFLENBQUMsQ0FBQztJQUNqRixDQUFDO0lBRUQseUZBQXlGO0lBQ3pGLHVFQUF1RTtJQUN2RSxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsa0JBQW1CLENBQUMsTUFBTyxDQUFDLFdBQVcsQ0FBQztJQUNyRSxNQUFNLGlCQUFpQixHQUFHLElBQUEsMkNBQTBCLEVBQUMsT0FBTyxDQUFDLENBQUM7SUFDOUQsTUFBTSxTQUFTLEdBQUcsR0FBRyxHQUFHLENB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QUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsS0FBSyxPQUFPLEVBQUUsQ0FBQztZQUM1QyxPQUFPLElBQUksQ0FBQztRQUNkLENBQUM7YUFBTSxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUMzQixTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7SUFDSCxDQUFDO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U2NoZW1hdGljc0V4Y2VwdGlvbiwgVHJlZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtFbGVtZW50LCBnZXRDaGlsZEVsZW1lbnRJbmRlbnRhdGlvbn0gZnJvbSAnLi9wYXJzZTUtZWxlbWVudCc7XG5pbXBvcnQge3BhcnNlIGFzIHBhcnNlSHRtbH0gZnJvbSAncGFyc2U1JztcblxuLyoqIEFwcGVuZHMgdGhlIGdpdmVuIGVsZW1lbnQgSFRNTCBmcmFnbWVudCB0byB0aGUgYDxoZWFkPmAgZWxlbWVudCBvZiB0aGUgc3BlY2lmaWVkIEhUTUwgZmlsZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRIdG1sRWxlbWVudFRvSGVhZChob3N0OiBUcmVlLCBodG1sRmlsZVBhdGg6IHN0cmluZywgZWxlbWVudEh0bWw6IHN0cmluZykge1xuICBjb25zdCBodG1sRmlsZUJ1ZmZlciA9IGhvc3QucmVhZChodG1sRmlsZVBhdGgpO1xuXG4gIGlmICghaHRtbEZpbGVCdWZmZXIpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgQ291bGQgbm90IHJlYWQgZmlsZSBmb3IgcGF0aDogJHtodG1sRmlsZVBhdGh9YCk7XG4gIH1cblxuICBjb25zdCBodG1sQ29udGVudCA9IGh0bWxGaWxlQnVmZmVyLnRvU3RyaW5nKCk7XG5cbiAgaWYgKGh0bWxDb250ZW50LmluY2x1ZGVzKGVsZW1lbnRIdG1sKSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGhlYWRUYWcgPSBnZXRIdG1sSGVhZFRhZ0VsZW1lbnQoaHRtbENvbnRlbnQpO1xuXG4gIGlmICghaGVhZFRhZykge1xuICAgIHRocm93IEVycm9yKGBDb3VsZCBub3QgZmluZCAnPGhlYWQ+JyBlbGVtZW50IGluIEhUTUwgZmlsZTogJHtodG1sRmlsZUJ1ZmZlcn1gKTtcbiAgfVxuXG4gIC8vIFdlIGFsd2F5cyBoYXZlIGFjY2VzcyB0byB0aGUgc291cmNlIGNvZGUgbG9jYXRpb24gaGVyZSBiZWNhdXNlIHRoZSBgZ2V0SGVhZFRhZ0VsZW1lbnRgXG4gIC8vIGZ1bmN0aW9uIGV4cGxpY2l0bHkgaGFzIHRoZSBgc291cmNlQ29kZUxvY2F0aW9uSW5mb2Agb3B0aW9uIGVuYWJsZWQuXG4gIGNvbnN0IGVuZFRhZ09mZnNldCA9IGhlYWRUYWcuc291cmNlQ29kZUxvY2F0aW9uIS5lbmRUYWchLnN0YXJ0T2Zmc2V0O1xuICBjb25zdCBpbmRlbnRhdGlvbk9mZnNldCA9IGdldENoaWxkRWxlbWVudEluZGVudGF0aW9uKGhlYWRUYWcpO1xuICBjb25zdCBpbnNlcnRpb24gPSBgJHsnICcucmVwZWF0KGluZGVudGF0aW9uT2Zmc2V0KX0ke2VsZW1lbnRIdG1sfWA7XG5cbiAgY29uc3QgcmVjb3JkZWRDaGFuZ2UgPSBob3N0LmJlZ2luVXBkYXRlKGh0bWxGaWxlUGF0aCkuaW5zZXJ0UmlnaHQoZW5kVGFnT2Zmc2V0LCBgJHtpbnNlcnRpb259XFxuYCk7XG5cbiAgaG9zdC5jb21taXRVcGRhdGUocmVjb3JkZWRDaGFuZ2UpO1xufVxuXG4vKiogUGFyc2VzIHRoZSBnaXZlbiBIVE1MIGZpbGUgYW5kIHJldHVybnMgdGhlIGhlYWQgZWxlbWVudCBpZiBhdmFpbGFibGUuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SHRtbEhlYWRUYWdFbGVtZW50KGh0bWxDb250ZW50OiBzdHJpbmcpOiBFbGVtZW50IHwgbnVsbCB7XG4gIHJldHVybiBnZXRFbGVtZW50QnlUYWdOYW1lKCdoZWFkJywgaHRtbENvbnRlbnQpO1xufVxuXG4vKiogQWRkcyBhIGNsYXNzIHRvIHRoZSBib2R5IG9mIHRoZSBkb2N1bWVudC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRCb2R5Q2xhc3MoaG9zdDogVHJlZSwgaHRtbEZpbGVQYXRoOiBzdHJpbmcsIGNsYXNzTmFtZTogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IGh0bWxGaWxlQnVmZmVyID0gaG9zdC5yZWFkKGh0bWxGaWxlUGF0aCk7XG5cbiAgaWYgKCFodG1sRmlsZUJ1ZmZlcikge1xuICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKGBDb3VsZCBub3QgcmVhZCBmaWxlIGZvciBwYXRoOiAke2h0bWxGaWxlUGF0aH1gKTtcbiAgfVxuXG4gIGNvbnN0IGh0bWxDb250ZW50ID0gaHRtbEZpbGVCdWZmZXIudG9TdHJpbmcoKTtcbiAgY29uc3QgYm9keSA9IGdldEVsZW1lbnRCeVRhZ05hbWUoJ2JvZHknLCBodG1sQ29udGVudCk7XG5cbiAgaWYgKCFib2R5KSB7XG4gICAgdGhyb3cgRXJyb3IoYENvdWxkIG5vdCBmaW5kIDxib2R5PiBlbGVtZW50IGluIEhUTUwgZmlsZTogJHtodG1sRmlsZUJ1ZmZlcn1gKTtcbiAgfVxuXG4gIGNvbnN0IGNsYXNzQXR0cmlidXRlID0gYm9keS5hdHRycy5maW5kKGF0dHJpYnV0ZSA9PiBhdHRyaWJ1dGUubmFtZSA9PT0gJ2NsYXNzJyk7XG5cbiAgaWYgKGNsYXNzQXR0cmlidXRlKSB7XG4gICAgY29uc3QgaGFzQ2xhc3MgPSBjbGFzc0F0dHJpYnV0ZS52YWx1ZVxuICAgICAgLnNwbGl0KCcgJylcbiAgICAgIC5tYXAocGFydCA9PiBwYXJ0LnRyaW0oKSlcbiAgICAgIC5pbmNsdWRlcyhjbGFzc05hbWUpO1xuXG4gICAgaWYgKCFoYXNDbGFzcykge1xuICAgICAgLy8gV2UgaGF2ZSBzb3VyY2UgY29kZSBsb2NhdGlvbiBpbmZvIGVuYWJsZWQsIGFuZCB3ZSBwcmUtY2hlY2tlZCB0aGF0IHRoZSBlbGVtZW50XG4gICAgICAvLyBoYXMgYXR0cmlidXRlcywgc3BlY2lmaWNhbGx5IHRoZSBgY2xhc3NgIGF0dHJpYnV0ZS5cbiAgICAgIGNvbnN0IGNsYXNzQXR0cmlidXRlTG9jYXRpb24gPSBib2R5LnNvdXJjZUNvZGVMb2NhdGlvbiEuYXR0cnMhWydjbGFzcyddO1xuICAgICAgY29uc3QgcmVjb3JkZWRDaGFuZ2UgPSBob3N0XG4gICAgICAgIC5iZWdpblVwZGF0ZShodG1sRmlsZVBhdGgpXG4gICAgICAgIC5pbnNlcnRSaWdodChjbGFzc0F0dHJpYnV0ZUxvY2F0aW9uLmVuZE9mZnNldCAtIDEsIGAgJHtjbGFzc05hbWV9YCk7XG4gICAgICBob3N0LmNvbW1pdFVwZGF0ZShyZWNvcmRlZENoYW5nZSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHJlY29yZGVkQ2hhbmdlID0gaG9zdFxuICAgICAgLmJlZ2luVXBkYXRlKGh0bWxGaWxlUGF0aClcbiAgICAgIC5pbnNlcnRSaWdodChib2R5LnNvdXJjZUNvZGVMb2NhdGlvbiEuc3RhcnRUYWchLmVuZE9mZnNldCAtIDEsIGAgY2xhc3M9XCIke2NsYXNzTmFtZX1cImApO1xuICAgIGhvc3QuY29tbWl0VXBkYXRlKHJlY29yZGVkQ2hhbmdlKTtcbiAgfVxufVxuXG4vKiogRmluZHMgYW4gZWxlbWVudCBieSBpdHMgdGFnIG5hbWUuICovXG5mdW5jdGlvbiBnZXRFbGVtZW50QnlUYWdOYW1lKHRhZ05hbWU6IHN0cmluZywgaHRtbENvbnRlbnQ6IHN0cmluZyk6IEVsZW1lbnQgfCBudWxsIHtcbiAgY29uc3QgZG9jdW1lbnQgPSBwYXJzZUh0bWwoaHRtbENvbnRlbnQsIHtzb3VyY2VDb2RlTG9jYXRpb25JbmZvOiB0cnVlfSk7XG4gIGNvbnN0IG5vZGVRdWV1ZSA9IFsuLi5kb2N1bWVudC5jaGlsZE5vZGVzXTtcblxuICB3aGlsZSAobm9kZVF1ZXVlLmxlbmd0aCkge1xuICAgIGNvbnN0IG5vZGUgPSBub2RlUXVldWUuc2hpZnQoKSBhcyBFbGVtZW50O1xuXG4gICAgaWYgKG5vZGUubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gdGFnTmFtZSkge1xuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfSBlbHNlIGlmIChub2RlLmNoaWxkTm9kZXMpIHtcbiAgICAgIG5vZGVRdWV1ZS5wdXNoKC4uLm5vZGUuY2hpbGROb2Rlcyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG4iXX0=