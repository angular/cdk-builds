/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
/**
 * Template string function that can be used to dedent a given string
 * literal. The smallest common indentation will be omitted.
 */
export function dedent(strings) {
    var values = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        values[_i - 1] = arguments[_i];
    }
    var joinedString = '';
    for (var i = 0; i < values.length; i++) {
        joinedString += "" + strings[i] + values[i];
    }
    joinedString += strings[strings.length - 1];
    var matches = joinedString.match(/^[ \t]*(?=\S)/gm);
    if (matches === null) {
        return joinedString;
    }
    var minLineIndent = Math.min.apply(Math, tslib_1.__spread(matches.map(function (el) { return el.length; })));
    var omitMinIndentRegex = new RegExp("^[ \\t]{" + minLineIndent + "}", 'gm');
    return minLineIndent > 0 ? joinedString.replace(omitMinIndentRegex, '') : joinedString;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dC1kZWRlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Rlc3RpbmcvcHJpdmF0ZS90ZXh0LWRlZGVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUg7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLE1BQU0sQ0FBQyxPQUE2QjtJQUFFLGdCQUFnQjtTQUFoQixVQUFnQixFQUFoQixxQkFBZ0IsRUFBaEIsSUFBZ0I7UUFBaEIsK0JBQWdCOztJQUNwRSxJQUFJLFlBQVksR0FBRyxFQUFFLENBQUM7SUFDdEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDdEMsWUFBWSxJQUFJLEtBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUcsQ0FBQztLQUM3QztJQUNELFlBQVksSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztJQUU1QyxJQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7SUFDdEQsSUFBSSxPQUFPLEtBQUssSUFBSSxFQUFFO1FBQ3BCLE9BQU8sWUFBWSxDQUFDO0tBQ3JCO0lBRUQsSUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLEdBQUcsT0FBUixJQUFJLG1CQUFRLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBQSxFQUFFLElBQUksT0FBQSxFQUFFLENBQUMsTUFBTSxFQUFULENBQVMsQ0FBQyxFQUFDLENBQUM7SUFDaEUsSUFBTSxrQkFBa0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxhQUFXLGFBQWEsTUFBRyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3pFLE9BQU8sYUFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDO0FBQ3pGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqXG4gKiBUZW1wbGF0ZSBzdHJpbmcgZnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB0byBkZWRlbnQgYSBnaXZlbiBzdHJpbmdcbiAqIGxpdGVyYWwuIFRoZSBzbWFsbGVzdCBjb21tb24gaW5kZW50YXRpb24gd2lsbCBiZSBvbWl0dGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVkZW50KHN0cmluZ3M6IFRlbXBsYXRlU3RyaW5nc0FycmF5LCAuLi52YWx1ZXM6IGFueVtdKSB7XG4gIGxldCBqb2luZWRTdHJpbmcgPSAnJztcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICBqb2luZWRTdHJpbmcgKz0gYCR7c3RyaW5nc1tpXX0ke3ZhbHVlc1tpXX1gO1xuICB9XG4gIGpvaW5lZFN0cmluZyArPSBzdHJpbmdzW3N0cmluZ3MubGVuZ3RoIC0gMV07XG5cbiAgY29uc3QgbWF0Y2hlcyA9IGpvaW5lZFN0cmluZy5tYXRjaCgvXlsgXFx0XSooPz1cXFMpL2dtKTtcbiAgaWYgKG1hdGNoZXMgPT09IG51bGwpIHtcbiAgICByZXR1cm4gam9pbmVkU3RyaW5nO1xuICB9XG5cbiAgY29uc3QgbWluTGluZUluZGVudCA9IE1hdGgubWluKC4uLm1hdGNoZXMubWFwKGVsID0+IGVsLmxlbmd0aCkpO1xuICBjb25zdCBvbWl0TWluSW5kZW50UmVnZXggPSBuZXcgUmVnRXhwKGBeWyBcXFxcdF17JHttaW5MaW5lSW5kZW50fX1gLCAnZ20nKTtcbiAgcmV0dXJuIG1pbkxpbmVJbmRlbnQgPiAwID8gam9pbmVkU3RyaW5nLnJlcGxhY2Uob21pdE1pbkluZGVudFJlZ2V4LCAnJykgOiBqb2luZWRTdHJpbmc7XG59XG4iXX0=