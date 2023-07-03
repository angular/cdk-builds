/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ENTER, SPACE } from '@angular/cdk/keycodes';
/** Checks whether a keyboard event will trigger a native `click` event on an element. */
export function eventDispatchesNativeClick(elementRef, event) {
    // Synthetic events won't trigger clicks.
    if (!event.isTrusted) {
        return false;
    }
    const el = elementRef.nativeElement;
    const keyCode = event.keyCode;
    // Buttons trigger clicks both on space and enter events.
    if (el.nodeName === 'BUTTON' && !el.disabled) {
        return keyCode === ENTER || keyCode === SPACE;
    }
    // Links only trigger clicks on enter.
    if (el.nodeName === 'A') {
        return keyCode === ENTER;
    }
    // Any other elements won't dispatch clicks from keyboard events.
    return false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnQtZGV0ZWN0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9tZW51L2V2ZW50LWRldGVjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsS0FBSyxFQUFFLEtBQUssRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRW5ELHlGQUF5RjtBQUN6RixNQUFNLFVBQVUsMEJBQTBCLENBQ3hDLFVBQW1DLEVBQ25DLEtBQW9CO0lBRXBCLHlDQUF5QztJQUN6QyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRTtRQUNwQixPQUFPLEtBQUssQ0FBQztLQUNkO0lBRUQsTUFBTSxFQUFFLEdBQUcsVUFBVSxDQUFDLGFBQWEsQ0FBQztJQUNwQyxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDO0lBRTlCLHlEQUF5RDtJQUN6RCxJQUFJLEVBQUUsQ0FBQyxRQUFRLEtBQUssUUFBUSxJQUFJLENBQUUsRUFBd0IsQ0FBQyxRQUFRLEVBQUU7UUFDbkUsT0FBTyxPQUFPLEtBQUssS0FBSyxJQUFJLE9BQU8sS0FBSyxLQUFLLENBQUM7S0FDL0M7SUFFRCxzQ0FBc0M7SUFDdEMsSUFBSSxFQUFFLENBQUMsUUFBUSxLQUFLLEdBQUcsRUFBRTtRQUN2QixPQUFPLE9BQU8sS0FBSyxLQUFLLENBQUM7S0FDMUI7SUFFRCxpRUFBaUU7SUFDakUsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RWxlbWVudFJlZn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0VOVEVSLCBTUEFDRX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2tleWNvZGVzJztcblxuLyoqIENoZWNrcyB3aGV0aGVyIGEga2V5Ym9hcmQgZXZlbnQgd2lsbCB0cmlnZ2VyIGEgbmF0aXZlIGBjbGlja2AgZXZlbnQgb24gYW4gZWxlbWVudC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBldmVudERpc3BhdGNoZXNOYXRpdmVDbGljayhcbiAgZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gIGV2ZW50OiBLZXlib2FyZEV2ZW50LFxuKTogYm9vbGVhbiB7XG4gIC8vIFN5bnRoZXRpYyBldmVudHMgd29uJ3QgdHJpZ2dlciBjbGlja3MuXG4gIGlmICghZXZlbnQuaXNUcnVzdGVkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgY29uc3QgZWwgPSBlbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gIGNvbnN0IGtleUNvZGUgPSBldmVudC5rZXlDb2RlO1xuXG4gIC8vIEJ1dHRvbnMgdHJpZ2dlciBjbGlja3MgYm90aCBvbiBzcGFjZSBhbmQgZW50ZXIgZXZlbnRzLlxuICBpZiAoZWwubm9kZU5hbWUgPT09ICdCVVRUT04nICYmICEoZWwgYXMgSFRNTEJ1dHRvbkVsZW1lbnQpLmRpc2FibGVkKSB7XG4gICAgcmV0dXJuIGtleUNvZGUgPT09IEVOVEVSIHx8IGtleUNvZGUgPT09IFNQQUNFO1xuICB9XG5cbiAgLy8gTGlua3Mgb25seSB0cmlnZ2VyIGNsaWNrcyBvbiBlbnRlci5cbiAgaWYgKGVsLm5vZGVOYW1lID09PSAnQScpIHtcbiAgICByZXR1cm4ga2V5Q29kZSA9PT0gRU5URVI7XG4gIH1cblxuICAvLyBBbnkgb3RoZXIgZWxlbWVudHMgd29uJ3QgZGlzcGF0Y2ggY2xpY2tzIGZyb20ga2V5Ym9hcmQgZXZlbnRzLlxuICByZXR1cm4gZmFsc2U7XG59XG4iXX0=