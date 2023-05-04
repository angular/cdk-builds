/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, Input } from '@angular/core';
import { CdkStepper } from './stepper';
import * as i0 from "@angular/core";
import * as i1 from "./stepper";
/** Button that moves to the next step in a stepper workflow. */
class CdkStepperNext {
    constructor(_stepper) {
        this._stepper = _stepper;
        /** Type of the next button. Defaults to "submit" if not specified. */
        this.type = 'submit';
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkStepperNext, deps: [{ token: i1.CdkStepper }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.0", type: CdkStepperNext, selector: "button[cdkStepperNext]", inputs: { type: "type" }, host: { listeners: { "click": "_stepper.next()" }, properties: { "type": "type" } }, ngImport: i0 }); }
}
export { CdkStepperNext };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkStepperNext, decorators: [{
            type: Directive,
            args: [{
                    selector: 'button[cdkStepperNext]',
                    host: {
                        '[type]': 'type',
                        '(click)': '_stepper.next()',
                    },
                }]
        }], ctorParameters: function () { return [{ type: i1.CdkStepper }]; }, propDecorators: { type: [{
                type: Input
            }] } });
/** Button that moves to the previous step in a stepper workflow. */
class CdkStepperPrevious {
    constructor(_stepper) {
        this._stepper = _stepper;
        /** Type of the previous button. Defaults to "button" if not specified. */
        this.type = 'button';
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkStepperPrevious, deps: [{ token: i1.CdkStepper }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.0", type: CdkStepperPrevious, selector: "button[cdkStepperPrevious]", inputs: { type: "type" }, host: { listeners: { "click": "_stepper.previous()" }, properties: { "type": "type" } }, ngImport: i0 }); }
}
export { CdkStepperPrevious };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkStepperPrevious, decorators: [{
            type: Directive,
            args: [{
                    selector: 'button[cdkStepperPrevious]',
                    host: {
                        '[type]': 'type',
                        '(click)': '_stepper.previous()',
                    },
                }]
        }], ctorParameters: function () { return [{ type: i1.CdkStepper }]; }, propDecorators: { type: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RlcHBlci1idXR0b24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3N0ZXBwZXIvc3RlcHBlci1idXR0b24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFL0MsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLFdBQVcsQ0FBQzs7O0FBRXJDLGdFQUFnRTtBQUNoRSxNQU9hLGNBQWM7SUFJekIsWUFBbUIsUUFBb0I7UUFBcEIsYUFBUSxHQUFSLFFBQVEsQ0FBWTtRQUh2QyxzRUFBc0U7UUFDN0QsU0FBSSxHQUFXLFFBQVEsQ0FBQztJQUVTLENBQUM7OEdBSmhDLGNBQWM7a0dBQWQsY0FBYzs7U0FBZCxjQUFjOzJGQUFkLGNBQWM7a0JBUDFCLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLHdCQUF3QjtvQkFDbEMsSUFBSSxFQUFFO3dCQUNKLFFBQVEsRUFBRSxNQUFNO3dCQUNoQixTQUFTLEVBQUUsaUJBQWlCO3FCQUM3QjtpQkFDRjtpR0FHVSxJQUFJO3NCQUFaLEtBQUs7O0FBS1Isb0VBQW9FO0FBQ3BFLE1BT2Esa0JBQWtCO0lBSTdCLFlBQW1CLFFBQW9CO1FBQXBCLGFBQVEsR0FBUixRQUFRLENBQVk7UUFIdkMsMEVBQTBFO1FBQ2pFLFNBQUksR0FBVyxRQUFRLENBQUM7SUFFUyxDQUFDOzhHQUpoQyxrQkFBa0I7a0dBQWxCLGtCQUFrQjs7U0FBbEIsa0JBQWtCOzJGQUFsQixrQkFBa0I7a0JBUDlCLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLDRCQUE0QjtvQkFDdEMsSUFBSSxFQUFFO3dCQUNKLFFBQVEsRUFBRSxNQUFNO3dCQUNoQixTQUFTLEVBQUUscUJBQXFCO3FCQUNqQztpQkFDRjtpR0FHVSxJQUFJO3NCQUFaLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3RpdmUsIElucHV0fSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHtDZGtTdGVwcGVyfSBmcm9tICcuL3N0ZXBwZXInO1xuXG4vKiogQnV0dG9uIHRoYXQgbW92ZXMgdG8gdGhlIG5leHQgc3RlcCBpbiBhIHN0ZXBwZXIgd29ya2Zsb3cuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdidXR0b25bY2RrU3RlcHBlck5leHRdJyxcbiAgaG9zdDoge1xuICAgICdbdHlwZV0nOiAndHlwZScsXG4gICAgJyhjbGljayknOiAnX3N0ZXBwZXIubmV4dCgpJyxcbiAgfSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrU3RlcHBlck5leHQge1xuICAvKiogVHlwZSBvZiB0aGUgbmV4dCBidXR0b24uIERlZmF1bHRzIHRvIFwic3VibWl0XCIgaWYgbm90IHNwZWNpZmllZC4gKi9cbiAgQElucHV0KCkgdHlwZTogc3RyaW5nID0gJ3N1Ym1pdCc7XG5cbiAgY29uc3RydWN0b3IocHVibGljIF9zdGVwcGVyOiBDZGtTdGVwcGVyKSB7fVxufVxuXG4vKiogQnV0dG9uIHRoYXQgbW92ZXMgdG8gdGhlIHByZXZpb3VzIHN0ZXAgaW4gYSBzdGVwcGVyIHdvcmtmbG93LiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnYnV0dG9uW2Nka1N0ZXBwZXJQcmV2aW91c10nLFxuICBob3N0OiB7XG4gICAgJ1t0eXBlXSc6ICd0eXBlJyxcbiAgICAnKGNsaWNrKSc6ICdfc3RlcHBlci5wcmV2aW91cygpJyxcbiAgfSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrU3RlcHBlclByZXZpb3VzIHtcbiAgLyoqIFR5cGUgb2YgdGhlIHByZXZpb3VzIGJ1dHRvbi4gRGVmYXVsdHMgdG8gXCJidXR0b25cIiBpZiBub3Qgc3BlY2lmaWVkLiAqL1xuICBASW5wdXQoKSB0eXBlOiBzdHJpbmcgPSAnYnV0dG9uJztcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgX3N0ZXBwZXI6IENka1N0ZXBwZXIpIHt9XG59XG4iXX0=