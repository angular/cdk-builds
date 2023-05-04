/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, ElementRef } from '@angular/core';
import * as i0 from "@angular/core";
class CdkStepHeader {
    constructor(_elementRef) {
        this._elementRef = _elementRef;
    }
    /** Focuses the step header. */
    focus() {
        this._elementRef.nativeElement.focus();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkStepHeader, deps: [{ token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.0", type: CdkStepHeader, selector: "[cdkStepHeader]", host: { attributes: { "role": "tab" } }, ngImport: i0 }); }
}
export { CdkStepHeader };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkStepHeader, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkStepHeader]',
                    host: {
                        'role': 'tab',
                    },
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RlcC1oZWFkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3N0ZXBwZXIvc3RlcC1oZWFkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7O0FBR3BELE1BTWEsYUFBYTtJQUN4QixZQUFtQixXQUFvQztRQUFwQyxnQkFBVyxHQUFYLFdBQVcsQ0FBeUI7SUFBRyxDQUFDO0lBRTNELCtCQUErQjtJQUMvQixLQUFLO1FBQ0gsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDekMsQ0FBQzs4R0FOVSxhQUFhO2tHQUFiLGFBQWE7O1NBQWIsYUFBYTsyRkFBYixhQUFhO2tCQU56QixTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSxpQkFBaUI7b0JBQzNCLElBQUksRUFBRTt3QkFDSixNQUFNLEVBQUUsS0FBSztxQkFDZDtpQkFDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGl2ZSwgRWxlbWVudFJlZn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0ZvY3VzYWJsZU9wdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2ExMXknO1xuXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrU3RlcEhlYWRlcl0nLFxuICBob3N0OiB7XG4gICAgJ3JvbGUnOiAndGFiJyxcbiAgfSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrU3RlcEhlYWRlciBpbXBsZW1lbnRzIEZvY3VzYWJsZU9wdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBfZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4pIHt9XG5cbiAgLyoqIEZvY3VzZXMgdGhlIHN0ZXAgaGVhZGVyLiAqL1xuICBmb2N1cygpIHtcbiAgICB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuZm9jdXMoKTtcbiAgfVxufVxuIl19