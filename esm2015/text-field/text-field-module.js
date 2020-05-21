/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __decorate } from "tslib";
import { PlatformModule } from '@angular/cdk/platform';
import { NgModule } from '@angular/core';
import { CdkAutofill } from './autofill';
import { CdkTextareaAutosize } from './autosize';
let TextFieldModule = /** @class */ (() => {
    let TextFieldModule = class TextFieldModule {
    };
    TextFieldModule = __decorate([
        NgModule({
            declarations: [CdkAutofill, CdkTextareaAutosize],
            imports: [PlatformModule],
            exports: [CdkAutofill, CdkTextareaAutosize],
        })
    ], TextFieldModule);
    return TextFieldModule;
})();
export { TextFieldModule };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dC1maWVsZC1tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RleHQtZmllbGQvdGV4dC1maWVsZC1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3ZDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDdkMsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sWUFBWSxDQUFDO0FBUS9DO0lBQUEsSUFBYSxlQUFlLEdBQTVCLE1BQWEsZUFBZTtLQUFHLENBQUE7SUFBbEIsZUFBZTtRQUwzQixRQUFRLENBQUM7WUFDUixZQUFZLEVBQUUsQ0FBQyxXQUFXLEVBQUUsbUJBQW1CLENBQUM7WUFDaEQsT0FBTyxFQUFFLENBQUMsY0FBYyxDQUFDO1lBQ3pCLE9BQU8sRUFBRSxDQUFDLFdBQVcsRUFBRSxtQkFBbUIsQ0FBQztTQUM1QyxDQUFDO09BQ1csZUFBZSxDQUFHO0lBQUQsc0JBQUM7S0FBQTtTQUFsQixlQUFlIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UGxhdGZvcm1Nb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge05nTW9kdWxlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Q2RrQXV0b2ZpbGx9IGZyb20gJy4vYXV0b2ZpbGwnO1xuaW1wb3J0IHtDZGtUZXh0YXJlYUF1dG9zaXplfSBmcm9tICcuL2F1dG9zaXplJztcblxuXG5ATmdNb2R1bGUoe1xuICBkZWNsYXJhdGlvbnM6IFtDZGtBdXRvZmlsbCwgQ2RrVGV4dGFyZWFBdXRvc2l6ZV0sXG4gIGltcG9ydHM6IFtQbGF0Zm9ybU1vZHVsZV0sXG4gIGV4cG9ydHM6IFtDZGtBdXRvZmlsbCwgQ2RrVGV4dGFyZWFBdXRvc2l6ZV0sXG59KVxuZXhwb3J0IGNsYXNzIFRleHRGaWVsZE1vZHVsZSB7fVxuIl19