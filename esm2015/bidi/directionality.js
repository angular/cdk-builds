import { __decorate, __metadata, __param } from "tslib";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EventEmitter, Inject, Injectable, Optional } from '@angular/core';
import { DIR_DOCUMENT } from './dir-document-token';
import * as i0 from "@angular/core";
import * as i1 from "./dir-document-token";
/**
 * The directionality (LTR / RTL) context for the application (or a subtree of it).
 * Exposes the current direction and a stream of direction changes.
 */
let Directionality = /** @class */ (() => {
    let Directionality = class Directionality {
        constructor(_document) {
            /** The current 'ltr' or 'rtl' value. */
            this.value = 'ltr';
            /** Stream that emits whenever the 'ltr' / 'rtl' state changes. */
            this.change = new EventEmitter();
            if (_document) {
                // TODO: handle 'auto' value -
                // We still need to account for dir="auto".
                // It looks like HTMLElemenet.dir is also "auto" when that's set to the attribute,
                // but getComputedStyle return either "ltr" or "rtl". avoiding getComputedStyle for now
                const bodyDir = _document.body ? _document.body.dir : null;
                const htmlDir = _document.documentElement ? _document.documentElement.dir : null;
                const value = bodyDir || htmlDir;
                this.value = (value === 'ltr' || value === 'rtl') ? value : 'ltr';
            }
        }
        ngOnDestroy() {
            this.change.complete();
        }
    };
    Directionality.ɵprov = i0.ɵɵdefineInjectable({ factory: function Directionality_Factory() { return new Directionality(i0.ɵɵinject(i1.DIR_DOCUMENT, 8)); }, token: Directionality, providedIn: "root" });
    Directionality = __decorate([
        Injectable({ providedIn: 'root' }),
        __param(0, Optional()), __param(0, Inject(DIR_DOCUMENT)),
        __metadata("design:paramtypes", [Object])
    ], Directionality);
    return Directionality;
})();
export { Directionality };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aW9uYWxpdHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2JpZGkvZGlyZWN0aW9uYWxpdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQVksTUFBTSxlQUFlLENBQUM7QUFDcEYsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLHNCQUFzQixDQUFDOzs7QUFNbEQ7OztHQUdHO0FBRUg7SUFBQSxJQUFhLGNBQWMsR0FBM0IsTUFBYSxjQUFjO1FBT3pCLFlBQThDLFNBQWU7WUFON0Qsd0NBQXdDO1lBQy9CLFVBQUssR0FBYyxLQUFLLENBQUM7WUFFbEMsa0VBQWtFO1lBQ3pELFdBQU0sR0FBRyxJQUFJLFlBQVksRUFBYSxDQUFDO1lBRzlDLElBQUksU0FBUyxFQUFFO2dCQUNiLDhCQUE4QjtnQkFDOUIsMkNBQTJDO2dCQUMzQyxrRkFBa0Y7Z0JBQ2xGLHVGQUF1RjtnQkFDdkYsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDM0QsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDakYsTUFBTSxLQUFLLEdBQUcsT0FBTyxJQUFJLE9BQU8sQ0FBQztnQkFDakMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLEtBQUssS0FBSyxLQUFLLElBQUksS0FBSyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQzthQUNuRTtRQUNILENBQUM7UUFFRCxXQUFXO1lBQ1QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUN6QixDQUFDO0tBQ0YsQ0FBQTs7SUF2QlksY0FBYztRQUQxQixVQUFVLENBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDLENBQUM7UUFRbEIsV0FBQSxRQUFRLEVBQUUsQ0FBQSxFQUFFLFdBQUEsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFBOztPQVBsQyxjQUFjLENBdUIxQjt5QkEzQ0Q7S0EyQ0M7U0F2QlksY0FBYyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0V2ZW50RW1pdHRlciwgSW5qZWN0LCBJbmplY3RhYmxlLCBPcHRpb25hbCwgT25EZXN0cm95fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7RElSX0RPQ1VNRU5UfSBmcm9tICcuL2Rpci1kb2N1bWVudC10b2tlbic7XG5cblxuZXhwb3J0IHR5cGUgRGlyZWN0aW9uID0gJ2x0cicgfCAncnRsJztcblxuXG4vKipcbiAqIFRoZSBkaXJlY3Rpb25hbGl0eSAoTFRSIC8gUlRMKSBjb250ZXh0IGZvciB0aGUgYXBwbGljYXRpb24gKG9yIGEgc3VidHJlZSBvZiBpdCkuXG4gKiBFeHBvc2VzIHRoZSBjdXJyZW50IGRpcmVjdGlvbiBhbmQgYSBzdHJlYW0gb2YgZGlyZWN0aW9uIGNoYW5nZXMuXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIERpcmVjdGlvbmFsaXR5IGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIFRoZSBjdXJyZW50ICdsdHInIG9yICdydGwnIHZhbHVlLiAqL1xuICByZWFkb25seSB2YWx1ZTogRGlyZWN0aW9uID0gJ2x0cic7XG5cbiAgLyoqIFN0cmVhbSB0aGF0IGVtaXRzIHdoZW5ldmVyIHRoZSAnbHRyJyAvICdydGwnIHN0YXRlIGNoYW5nZXMuICovXG4gIHJlYWRvbmx5IGNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8RGlyZWN0aW9uPigpO1xuXG4gIGNvbnN0cnVjdG9yKEBPcHRpb25hbCgpIEBJbmplY3QoRElSX0RPQ1VNRU5UKSBfZG9jdW1lbnQ/OiBhbnkpIHtcbiAgICBpZiAoX2RvY3VtZW50KSB7XG4gICAgICAvLyBUT0RPOiBoYW5kbGUgJ2F1dG8nIHZhbHVlIC1cbiAgICAgIC8vIFdlIHN0aWxsIG5lZWQgdG8gYWNjb3VudCBmb3IgZGlyPVwiYXV0b1wiLlxuICAgICAgLy8gSXQgbG9va3MgbGlrZSBIVE1MRWxlbWVuZXQuZGlyIGlzIGFsc28gXCJhdXRvXCIgd2hlbiB0aGF0J3Mgc2V0IHRvIHRoZSBhdHRyaWJ1dGUsXG4gICAgICAvLyBidXQgZ2V0Q29tcHV0ZWRTdHlsZSByZXR1cm4gZWl0aGVyIFwibHRyXCIgb3IgXCJydGxcIi4gYXZvaWRpbmcgZ2V0Q29tcHV0ZWRTdHlsZSBmb3Igbm93XG4gICAgICBjb25zdCBib2R5RGlyID0gX2RvY3VtZW50LmJvZHkgPyBfZG9jdW1lbnQuYm9keS5kaXIgOiBudWxsO1xuICAgICAgY29uc3QgaHRtbERpciA9IF9kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgPyBfZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRpciA6IG51bGw7XG4gICAgICBjb25zdCB2YWx1ZSA9IGJvZHlEaXIgfHwgaHRtbERpcjtcbiAgICAgIHRoaXMudmFsdWUgPSAodmFsdWUgPT09ICdsdHInIHx8IHZhbHVlID09PSAncnRsJykgPyB2YWx1ZSA6ICdsdHInO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuY2hhbmdlLmNvbXBsZXRlKCk7XG4gIH1cbn1cbiJdfQ==