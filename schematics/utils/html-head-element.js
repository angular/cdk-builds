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
        define("@angular/cdk/schematics/utils/html-head-element", ["require", "exports", "@angular-devkit/schematics", "@angular/cdk/schematics/utils/parse5-element", "parse5"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const parse5_element_1 = require("@angular/cdk/schematics/utils/parse5-element");
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
            throw `Could not find '<head>' element in HTML file: ${htmlFileBuffer}`;
        }
        // We always have access to the source code location here because the `getHeadTagElement`
        // function explicitly has the `sourceCodeLocationInfo` option enabled.
        const endTagOffset = headTag.sourceCodeLocation.endTag.startOffset;
        const indentationOffset = parse5_element_1.getChildElementIndentation(headTag);
        const insertion = `${' '.repeat(indentationOffset)}${elementHtml}`;
        const recordedChange = host
            .beginUpdate(htmlFilePath)
            .insertRight(endTagOffset, `${insertion}\n`);
        host.commitUpdate(recordedChange);
    }
    exports.appendHtmlElementToHead = appendHtmlElementToHead;
    /** Parses the given HTML file and returns the head element if available. */
    function getHtmlHeadTagElement(htmlContent) {
        const document = parse5_1.parse(htmlContent, { sourceCodeLocationInfo: true });
        const nodeQueue = [...document.childNodes];
        while (nodeQueue.length) {
            const node = nodeQueue.shift();
            if (node.nodeName.toLowerCase() === 'head') {
                return node;
            }
            else if (node.childNodes) {
                nodeQueue.push(...node.childNodes);
            }
        }
        return null;
    }
    exports.getHtmlHeadTagElement = getHtmlHeadTagElement;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC1oZWFkLWVsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvdXRpbHMvaHRtbC1oZWFkLWVsZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCwyREFBcUU7SUFDckUsaUZBQTREO0lBQzVELG1DQUFtRjtJQUVuRixrR0FBa0c7SUFDbEcsU0FBZ0IsdUJBQXVCLENBQUMsSUFBVSxFQUFFLFlBQW9CLEVBQUUsV0FBbUI7UUFDM0YsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUUvQyxJQUFJLENBQUMsY0FBYyxFQUFFO1lBQ25CLE1BQU0sSUFBSSxnQ0FBbUIsQ0FBQyxpQ0FBaUMsWUFBWSxFQUFFLENBQUMsQ0FBQztTQUNoRjtRQUVELE1BQU0sV0FBVyxHQUFHLGNBQWMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUU5QyxJQUFJLFdBQVcsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFDckMsT0FBTztTQUNSO1FBRUQsTUFBTSxPQUFPLEdBQUcscUJBQXFCLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFbkQsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNaLE1BQU0saURBQWlELGNBQWMsRUFBRSxDQUFDO1NBQ3pFO1FBRUQseUZBQXlGO1FBQ3pGLHVFQUF1RTtRQUN2RSxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsa0JBQW1CLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQztRQUNwRSxNQUFNLGlCQUFpQixHQUFHLDJDQUEwQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzlELE1BQU0sU0FBUyxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLFdBQVcsRUFBRSxDQUFDO1FBRW5FLE1BQU0sY0FBYyxHQUFHLElBQUk7YUFDeEIsV0FBVyxDQUFDLFlBQVksQ0FBQzthQUN6QixXQUFXLENBQUMsWUFBWSxFQUFFLEdBQUcsU0FBUyxJQUFJLENBQUMsQ0FBQztRQUUvQyxJQUFJLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUE5QkQsMERBOEJDO0lBRUQsNEVBQTRFO0lBQzVFLFNBQWdCLHFCQUFxQixDQUFDLFdBQW1CO1FBQ3ZELE1BQU0sUUFBUSxHQUFHLGNBQVMsQ0FBQyxXQUFXLEVBQUUsRUFBQyxzQkFBc0IsRUFBRSxJQUFJLEVBQUMsQ0FBd0IsQ0FBQztRQUMvRixNQUFNLFNBQVMsR0FBRyxDQUFDLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRTNDLE9BQU8sU0FBUyxDQUFDLE1BQU0sRUFBRTtZQUN2QixNQUFNLElBQUksR0FBRyxTQUFTLENBQUMsS0FBSyxFQUF3QixDQUFDO1lBRXJELElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsS0FBSyxNQUFNLEVBQUU7Z0JBQzFDLE9BQU8sSUFBSSxDQUFDO2FBQ2I7aUJBQU0sSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO2dCQUMxQixTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2FBQ3BDO1NBQ0Y7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFmRCxzREFlQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1NjaGVtYXRpY3NFeGNlcHRpb24sIFRyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7Z2V0Q2hpbGRFbGVtZW50SW5kZW50YXRpb259IGZyb20gJy4vcGFyc2U1LWVsZW1lbnQnO1xuaW1wb3J0IHtEZWZhdWx0VHJlZURvY3VtZW50LCBEZWZhdWx0VHJlZUVsZW1lbnQsIHBhcnNlIGFzIHBhcnNlSHRtbH0gZnJvbSAncGFyc2U1JztcblxuLyoqIEFwcGVuZHMgdGhlIGdpdmVuIGVsZW1lbnQgSFRNTCBmcmFnbWVudCB0byB0aGUgYDxoZWFkPmAgZWxlbWVudCBvZiB0aGUgc3BlY2lmaWVkIEhUTUwgZmlsZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRIdG1sRWxlbWVudFRvSGVhZChob3N0OiBUcmVlLCBodG1sRmlsZVBhdGg6IHN0cmluZywgZWxlbWVudEh0bWw6IHN0cmluZykge1xuICBjb25zdCBodG1sRmlsZUJ1ZmZlciA9IGhvc3QucmVhZChodG1sRmlsZVBhdGgpO1xuXG4gIGlmICghaHRtbEZpbGVCdWZmZXIpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgQ291bGQgbm90IHJlYWQgZmlsZSBmb3IgcGF0aDogJHtodG1sRmlsZVBhdGh9YCk7XG4gIH1cblxuICBjb25zdCBodG1sQ29udGVudCA9IGh0bWxGaWxlQnVmZmVyLnRvU3RyaW5nKCk7XG5cbiAgaWYgKGh0bWxDb250ZW50LmluY2x1ZGVzKGVsZW1lbnRIdG1sKSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGhlYWRUYWcgPSBnZXRIdG1sSGVhZFRhZ0VsZW1lbnQoaHRtbENvbnRlbnQpO1xuXG4gIGlmICghaGVhZFRhZykge1xuICAgIHRocm93IGBDb3VsZCBub3QgZmluZCAnPGhlYWQ+JyBlbGVtZW50IGluIEhUTUwgZmlsZTogJHtodG1sRmlsZUJ1ZmZlcn1gO1xuICB9XG5cbiAgLy8gV2UgYWx3YXlzIGhhdmUgYWNjZXNzIHRvIHRoZSBzb3VyY2UgY29kZSBsb2NhdGlvbiBoZXJlIGJlY2F1c2UgdGhlIGBnZXRIZWFkVGFnRWxlbWVudGBcbiAgLy8gZnVuY3Rpb24gZXhwbGljaXRseSBoYXMgdGhlIGBzb3VyY2VDb2RlTG9jYXRpb25JbmZvYCBvcHRpb24gZW5hYmxlZC5cbiAgY29uc3QgZW5kVGFnT2Zmc2V0ID0gaGVhZFRhZy5zb3VyY2VDb2RlTG9jYXRpb24hLmVuZFRhZy5zdGFydE9mZnNldDtcbiAgY29uc3QgaW5kZW50YXRpb25PZmZzZXQgPSBnZXRDaGlsZEVsZW1lbnRJbmRlbnRhdGlvbihoZWFkVGFnKTtcbiAgY29uc3QgaW5zZXJ0aW9uID0gYCR7JyAnLnJlcGVhdChpbmRlbnRhdGlvbk9mZnNldCl9JHtlbGVtZW50SHRtbH1gO1xuXG4gIGNvbnN0IHJlY29yZGVkQ2hhbmdlID0gaG9zdFxuICAgIC5iZWdpblVwZGF0ZShodG1sRmlsZVBhdGgpXG4gICAgLmluc2VydFJpZ2h0KGVuZFRhZ09mZnNldCwgYCR7aW5zZXJ0aW9ufVxcbmApO1xuXG4gIGhvc3QuY29tbWl0VXBkYXRlKHJlY29yZGVkQ2hhbmdlKTtcbn1cblxuLyoqIFBhcnNlcyB0aGUgZ2l2ZW4gSFRNTCBmaWxlIGFuZCByZXR1cm5zIHRoZSBoZWFkIGVsZW1lbnQgaWYgYXZhaWxhYmxlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEh0bWxIZWFkVGFnRWxlbWVudChodG1sQ29udGVudDogc3RyaW5nKTogRGVmYXVsdFRyZWVFbGVtZW50IHwgbnVsbCB7XG4gIGNvbnN0IGRvY3VtZW50ID0gcGFyc2VIdG1sKGh0bWxDb250ZW50LCB7c291cmNlQ29kZUxvY2F0aW9uSW5mbzogdHJ1ZX0pIGFzIERlZmF1bHRUcmVlRG9jdW1lbnQ7XG4gIGNvbnN0IG5vZGVRdWV1ZSA9IFsuLi5kb2N1bWVudC5jaGlsZE5vZGVzXTtcblxuICB3aGlsZSAobm9kZVF1ZXVlLmxlbmd0aCkge1xuICAgIGNvbnN0IG5vZGUgPSBub2RlUXVldWUuc2hpZnQoKSBhcyBEZWZhdWx0VHJlZUVsZW1lbnQ7XG5cbiAgICBpZiAobm9kZS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnaGVhZCcpIHtcbiAgICAgIHJldHVybiBub2RlO1xuICAgIH0gZWxzZSBpZiAobm9kZS5jaGlsZE5vZGVzKSB7XG4gICAgICBub2RlUXVldWUucHVzaCguLi5ub2RlLmNoaWxkTm9kZXMpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuIl19