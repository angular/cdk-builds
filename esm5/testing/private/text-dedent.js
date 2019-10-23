/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __read, __spread } from "tslib";
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
    var minLineIndent = Math.min.apply(Math, __spread(matches.map(function (el) { return el.length; })));
    var omitMinIndentRegex = new RegExp("^[ \\t]{" + minLineIndent + "}", 'gm');
    return minLineIndent > 0 ? joinedString.replace(omitMinIndentRegex, '') : joinedString;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dC1kZWRlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Rlc3RpbmcvcHJpdmF0ZS90ZXh0LWRlZGVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUg7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLE1BQU0sQ0FBQyxPQUE2QjtJQUFFLGdCQUFnQjtTQUFoQixVQUFnQixFQUFoQixxQkFBZ0IsRUFBaEIsSUFBZ0I7UUFBaEIsK0JBQWdCOztJQUNwRSxJQUFJLFlBQVksR0FBRyxFQUFFLENBQUM7SUFDdEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDdEMsWUFBWSxJQUFJLEtBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUcsQ0FBQztLQUM3QztJQUNELFlBQVksSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztJQUU1QyxJQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7SUFDdEQsSUFBSSxPQUFPLEtBQUssSUFBSSxFQUFFO1FBQ3BCLE9BQU8sWUFBWSxDQUFDO0tBQ3JCO0lBRUQsSUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLEdBQUcsT0FBUixJQUFJLFdBQVEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFBLEVBQUUsSUFBSSxPQUFBLEVBQUUsQ0FBQyxNQUFNLEVBQVQsQ0FBUyxDQUFDLEVBQUMsQ0FBQztJQUNoRSxJQUFNLGtCQUFrQixHQUFHLElBQUksTUFBTSxDQUFDLGFBQVcsYUFBYSxNQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDekUsT0FBTyxhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLGtCQUFrQixFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUM7QUFDekYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIFRlbXBsYXRlIHN0cmluZyBmdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHRvIGRlZGVudCBhIGdpdmVuIHN0cmluZ1xuICogbGl0ZXJhbC4gVGhlIHNtYWxsZXN0IGNvbW1vbiBpbmRlbnRhdGlvbiB3aWxsIGJlIG9taXR0ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWRlbnQoc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXksIC4uLnZhbHVlczogYW55W10pIHtcbiAgbGV0IGpvaW5lZFN0cmluZyA9ICcnO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgIGpvaW5lZFN0cmluZyArPSBgJHtzdHJpbmdzW2ldfSR7dmFsdWVzW2ldfWA7XG4gIH1cbiAgam9pbmVkU3RyaW5nICs9IHN0cmluZ3Nbc3RyaW5ncy5sZW5ndGggLSAxXTtcblxuICBjb25zdCBtYXRjaGVzID0gam9pbmVkU3RyaW5nLm1hdGNoKC9eWyBcXHRdKig/PVxcUykvZ20pO1xuICBpZiAobWF0Y2hlcyA9PT0gbnVsbCkge1xuICAgIHJldHVybiBqb2luZWRTdHJpbmc7XG4gIH1cblxuICBjb25zdCBtaW5MaW5lSW5kZW50ID0gTWF0aC5taW4oLi4ubWF0Y2hlcy5tYXAoZWwgPT4gZWwubGVuZ3RoKSk7XG4gIGNvbnN0IG9taXRNaW5JbmRlbnRSZWdleCA9IG5ldyBSZWdFeHAoYF5bIFxcXFx0XXske21pbkxpbmVJbmRlbnR9fWAsICdnbScpO1xuICByZXR1cm4gbWluTGluZUluZGVudCA+IDAgPyBqb2luZWRTdHJpbmcucmVwbGFjZShvbWl0TWluSW5kZW50UmVnZXgsICcnKSA6IGpvaW5lZFN0cmluZztcbn1cbiJdfQ==