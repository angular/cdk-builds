/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __decorate } from "tslib";
import { NgModule } from '@angular/core';
import { CdkStepper, CdkStep } from './stepper';
import { CdkStepLabel } from './step-label';
import { CdkStepperNext, CdkStepperPrevious } from './stepper-button';
import { CdkStepHeader } from './step-header';
import { BidiModule } from '@angular/cdk/bidi';
let CdkStepperModule = /** @class */ (() => {
    let CdkStepperModule = class CdkStepperModule {
    };
    CdkStepperModule = __decorate([
        NgModule({
            imports: [BidiModule],
            exports: [
                CdkStep,
                CdkStepper,
                CdkStepHeader,
                CdkStepLabel,
                CdkStepperNext,
                CdkStepperPrevious,
            ],
            declarations: [
                CdkStep,
                CdkStepper,
                CdkStepHeader,
                CdkStepLabel,
                CdkStepperNext,
                CdkStepperPrevious,
            ]
        })
    ], CdkStepperModule);
    return CdkStepperModule;
})();
export { CdkStepperModule };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RlcHBlci1tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3N0ZXBwZXIvc3RlcHBlci1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDdkMsT0FBTyxFQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDOUMsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUMxQyxPQUFPLEVBQUMsY0FBYyxFQUFFLGtCQUFrQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDcEUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM1QyxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFxQjdDO0lBQUEsSUFBYSxnQkFBZ0IsR0FBN0IsTUFBYSxnQkFBZ0I7S0FBRyxDQUFBO0lBQW5CLGdCQUFnQjtRQW5CNUIsUUFBUSxDQUFDO1lBQ1IsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDO1lBQ3JCLE9BQU8sRUFBRTtnQkFDUCxPQUFPO2dCQUNQLFVBQVU7Z0JBQ1YsYUFBYTtnQkFDYixZQUFZO2dCQUNaLGNBQWM7Z0JBQ2Qsa0JBQWtCO2FBQ25CO1lBQ0QsWUFBWSxFQUFFO2dCQUNaLE9BQU87Z0JBQ1AsVUFBVTtnQkFDVixhQUFhO2dCQUNiLFlBQVk7Z0JBQ1osY0FBYztnQkFDZCxrQkFBa0I7YUFDbkI7U0FDRixDQUFDO09BQ1csZ0JBQWdCLENBQUc7SUFBRCx1QkFBQztLQUFBO1NBQW5CLGdCQUFnQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge05nTW9kdWxlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Q2RrU3RlcHBlciwgQ2RrU3RlcH0gZnJvbSAnLi9zdGVwcGVyJztcbmltcG9ydCB7Q2RrU3RlcExhYmVsfSBmcm9tICcuL3N0ZXAtbGFiZWwnO1xuaW1wb3J0IHtDZGtTdGVwcGVyTmV4dCwgQ2RrU3RlcHBlclByZXZpb3VzfSBmcm9tICcuL3N0ZXBwZXItYnV0dG9uJztcbmltcG9ydCB7Q2RrU3RlcEhlYWRlcn0gZnJvbSAnLi9zdGVwLWhlYWRlcic7XG5pbXBvcnQge0JpZGlNb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcblxuQE5nTW9kdWxlKHtcbiAgaW1wb3J0czogW0JpZGlNb2R1bGVdLFxuICBleHBvcnRzOiBbXG4gICAgQ2RrU3RlcCxcbiAgICBDZGtTdGVwcGVyLFxuICAgIENka1N0ZXBIZWFkZXIsXG4gICAgQ2RrU3RlcExhYmVsLFxuICAgIENka1N0ZXBwZXJOZXh0LFxuICAgIENka1N0ZXBwZXJQcmV2aW91cyxcbiAgXSxcbiAgZGVjbGFyYXRpb25zOiBbXG4gICAgQ2RrU3RlcCxcbiAgICBDZGtTdGVwcGVyLFxuICAgIENka1N0ZXBIZWFkZXIsXG4gICAgQ2RrU3RlcExhYmVsLFxuICAgIENka1N0ZXBwZXJOZXh0LFxuICAgIENka1N0ZXBwZXJQcmV2aW91cyxcbiAgXVxufSlcbmV4cG9ydCBjbGFzcyBDZGtTdGVwcGVyTW9kdWxlIHt9XG4iXX0=