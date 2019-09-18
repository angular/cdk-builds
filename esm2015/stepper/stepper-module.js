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
import { NgModule } from '@angular/core';
import { CdkStepper, CdkStep } from './stepper';
import { CommonModule } from '@angular/common';
import { CdkStepLabel } from './step-label';
import { CdkStepperNext, CdkStepperPrevious } from './stepper-button';
import { CdkStepHeader } from './step-header';
import { BidiModule } from '@angular/cdk/bidi';
export class CdkStepperModule {
}
CdkStepperModule.decorators = [
    { type: NgModule, args: [{
                imports: [BidiModule, CommonModule],
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
            },] }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RlcHBlci1tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3N0ZXBwZXIvc3RlcHBlci1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3ZDLE9BQU8sRUFBQyxVQUFVLEVBQUUsT0FBTyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQzlDLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUM3QyxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQzFDLE9BQU8sRUFBQyxjQUFjLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNwRSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzVDLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQXFCN0MsTUFBTSxPQUFPLGdCQUFnQjs7O1lBbkI1QixRQUFRLFNBQUM7Z0JBQ1IsT0FBTyxFQUFFLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQztnQkFDbkMsT0FBTyxFQUFFO29CQUNQLE9BQU87b0JBQ1AsVUFBVTtvQkFDVixhQUFhO29CQUNiLFlBQVk7b0JBQ1osY0FBYztvQkFDZCxrQkFBa0I7aUJBQ25CO2dCQUNELFlBQVksRUFBRTtvQkFDWixPQUFPO29CQUNQLFVBQVU7b0JBQ1YsYUFBYTtvQkFDYixZQUFZO29CQUNaLGNBQWM7b0JBQ2Qsa0JBQWtCO2lCQUNuQjthQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7TmdNb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtDZGtTdGVwcGVyLCBDZGtTdGVwfSBmcm9tICcuL3N0ZXBwZXInO1xuaW1wb3J0IHtDb21tb25Nb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge0Nka1N0ZXBMYWJlbH0gZnJvbSAnLi9zdGVwLWxhYmVsJztcbmltcG9ydCB7Q2RrU3RlcHBlck5leHQsIENka1N0ZXBwZXJQcmV2aW91c30gZnJvbSAnLi9zdGVwcGVyLWJ1dHRvbic7XG5pbXBvcnQge0Nka1N0ZXBIZWFkZXJ9IGZyb20gJy4vc3RlcC1oZWFkZXInO1xuaW1wb3J0IHtCaWRpTW9kdWxlfSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5cbkBOZ01vZHVsZSh7XG4gIGltcG9ydHM6IFtCaWRpTW9kdWxlLCBDb21tb25Nb2R1bGVdLFxuICBleHBvcnRzOiBbXG4gICAgQ2RrU3RlcCxcbiAgICBDZGtTdGVwcGVyLFxuICAgIENka1N0ZXBIZWFkZXIsXG4gICAgQ2RrU3RlcExhYmVsLFxuICAgIENka1N0ZXBwZXJOZXh0LFxuICAgIENka1N0ZXBwZXJQcmV2aW91cyxcbiAgXSxcbiAgZGVjbGFyYXRpb25zOiBbXG4gICAgQ2RrU3RlcCxcbiAgICBDZGtTdGVwcGVyLFxuICAgIENka1N0ZXBIZWFkZXIsXG4gICAgQ2RrU3RlcExhYmVsLFxuICAgIENka1N0ZXBwZXJOZXh0LFxuICAgIENka1N0ZXBwZXJQcmV2aW91cyxcbiAgXVxufSlcbmV4cG9ydCBjbGFzcyBDZGtTdGVwcGVyTW9kdWxlIHt9XG4iXX0=