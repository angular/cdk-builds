/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Checks whether a modifier key is pressed.
 * @param {?} event Event to be checked.
 * @param {...?} modifiers
 * @return {?}
 */
export function hasModifierKey(event, ...modifiers) {
    if (modifiers.length) {
        return modifiers.some((/**
         * @param {?} modifier
         * @return {?}
         */
        modifier => event[modifier]));
    }
    return event.altKey || event.shiftKey || event.ctrlKey || event.metaKey;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kaWZpZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9rZXljb2Rlcy9tb2RpZmllcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFjQSxNQUFNLFVBQVUsY0FBYyxDQUFDLEtBQW9CLEVBQUUsR0FBRyxTQUF3QjtJQUM5RSxJQUFJLFNBQVMsQ0FBQyxNQUFNLEVBQUU7UUFDcEIsT0FBTyxTQUFTLENBQUMsSUFBSTs7OztRQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFDLENBQUM7S0FDcEQ7SUFFRCxPQUFPLEtBQUssQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLFFBQVEsSUFBSSxLQUFLLENBQUMsT0FBTyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUM7QUFDMUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG50eXBlIE1vZGlmaWVyS2V5ID0gJ2FsdEtleScgfCAnc2hpZnRLZXknIHwgJ2N0cmxLZXknIHwgJ21ldGFLZXknO1xuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIGEgbW9kaWZpZXIga2V5IGlzIHByZXNzZWQuXG4gKiBAcGFyYW0gZXZlbnQgRXZlbnQgdG8gYmUgY2hlY2tlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhc01vZGlmaWVyS2V5KGV2ZW50OiBLZXlib2FyZEV2ZW50LCAuLi5tb2RpZmllcnM6IE1vZGlmaWVyS2V5W10pOiBib29sZWFuIHtcbiAgaWYgKG1vZGlmaWVycy5sZW5ndGgpIHtcbiAgICByZXR1cm4gbW9kaWZpZXJzLnNvbWUobW9kaWZpZXIgPT4gZXZlbnRbbW9kaWZpZXJdKTtcbiAgfVxuXG4gIHJldHVybiBldmVudC5hbHRLZXkgfHwgZXZlbnQuc2hpZnRLZXkgfHwgZXZlbnQuY3RybEtleSB8fCBldmVudC5tZXRhS2V5O1xufVxuIl19