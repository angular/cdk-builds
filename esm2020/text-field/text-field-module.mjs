/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { PlatformModule } from '@angular/cdk/platform';
import { NgModule } from '@angular/core';
import { CdkAutofill } from './autofill';
import { CdkTextareaAutosize } from './autosize';
import * as i0 from "@angular/core";
export class TextFieldModule {
}
TextFieldModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: TextFieldModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
TextFieldModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: TextFieldModule, declarations: [CdkAutofill, CdkTextareaAutosize], imports: [PlatformModule], exports: [CdkAutofill, CdkTextareaAutosize] });
TextFieldModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: TextFieldModule, imports: [[PlatformModule]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: TextFieldModule, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [CdkAutofill, CdkTextareaAutosize],
                    imports: [PlatformModule],
                    exports: [CdkAutofill, CdkTextareaAutosize],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dC1maWVsZC1tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RleHQtZmllbGQvdGV4dC1maWVsZC1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3JELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDdkMsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUN2QyxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxZQUFZLENBQUM7O0FBTy9DLE1BQU0sT0FBTyxlQUFlOzs0R0FBZixlQUFlOzZHQUFmLGVBQWUsaUJBSlgsV0FBVyxFQUFFLG1CQUFtQixhQUNyQyxjQUFjLGFBQ2QsV0FBVyxFQUFFLG1CQUFtQjs2R0FFL0IsZUFBZSxZQUhqQixDQUFDLGNBQWMsQ0FBQzsyRkFHZCxlQUFlO2tCQUwzQixRQUFRO21CQUFDO29CQUNSLFlBQVksRUFBRSxDQUFDLFdBQVcsRUFBRSxtQkFBbUIsQ0FBQztvQkFDaEQsT0FBTyxFQUFFLENBQUMsY0FBYyxDQUFDO29CQUN6QixPQUFPLEVBQUUsQ0FBQyxXQUFXLEVBQUUsbUJBQW1CLENBQUM7aUJBQzVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UGxhdGZvcm1Nb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge05nTW9kdWxlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Q2RrQXV0b2ZpbGx9IGZyb20gJy4vYXV0b2ZpbGwnO1xuaW1wb3J0IHtDZGtUZXh0YXJlYUF1dG9zaXplfSBmcm9tICcuL2F1dG9zaXplJztcblxuQE5nTW9kdWxlKHtcbiAgZGVjbGFyYXRpb25zOiBbQ2RrQXV0b2ZpbGwsIENka1RleHRhcmVhQXV0b3NpemVdLFxuICBpbXBvcnRzOiBbUGxhdGZvcm1Nb2R1bGVdLFxuICBleHBvcnRzOiBbQ2RrQXV0b2ZpbGwsIENka1RleHRhcmVhQXV0b3NpemVdLFxufSlcbmV4cG9ydCBjbGFzcyBUZXh0RmllbGRNb2R1bGUge31cbiJdfQ==