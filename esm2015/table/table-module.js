/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/table/table-module.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NgModule } from '@angular/core';
import { HeaderRowOutlet, DataRowOutlet, CdkTable, FooterRowOutlet, NoDataRowOutlet } from './table';
import { CdkCellOutlet, CdkFooterRow, CdkFooterRowDef, CdkHeaderRow, CdkHeaderRowDef, CdkRow, CdkRowDef, CdkNoDataRow } from './row';
import { CdkColumnDef, CdkHeaderCellDef, CdkHeaderCell, CdkCell, CdkCellDef, CdkFooterCellDef, CdkFooterCell } from './cell';
import { CdkTextColumn } from './text-column';
/** @type {?} */
const EXPORTED_DECLARATIONS = [
    CdkTable,
    CdkRowDef,
    CdkCellDef,
    CdkCellOutlet,
    CdkHeaderCellDef,
    CdkFooterCellDef,
    CdkColumnDef,
    CdkCell,
    CdkRow,
    CdkHeaderCell,
    CdkFooterCell,
    CdkHeaderRow,
    CdkHeaderRowDef,
    CdkFooterRow,
    CdkFooterRowDef,
    DataRowOutlet,
    HeaderRowOutlet,
    FooterRowOutlet,
    CdkTextColumn,
    CdkNoDataRow,
    NoDataRowOutlet,
];
let CdkTableModule = /** @class */ (() => {
    class CdkTableModule {
    }
    CdkTableModule.decorators = [
        { type: NgModule, args: [{
                    exports: EXPORTED_DECLARATIONS,
                    declarations: EXPORTED_DECLARATIONS
                },] }
    ];
    return CdkTableModule;
})();
export { CdkTableModule };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGUtbW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90YWJsZS90YWJsZS1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsZUFBZSxFQUFFLGFBQWEsRUFBRSxRQUFRLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNuRyxPQUFPLEVBQ0wsYUFBYSxFQUFFLFlBQVksRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFLGVBQWUsRUFBRSxNQUFNLEVBQ25GLFNBQVMsRUFDVCxZQUFZLEVBQ2IsTUFBTSxPQUFPLENBQUM7QUFDZixPQUFPLEVBQ0wsWUFBWSxFQUFFLGdCQUFnQixFQUFFLGFBQWEsRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUNsRSxnQkFBZ0IsRUFBRSxhQUFhLEVBQ2hDLE1BQU0sUUFBUSxDQUFDO0FBQ2hCLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxlQUFlLENBQUM7O01BRXRDLHFCQUFxQixHQUFHO0lBQzVCLFFBQVE7SUFDUixTQUFTO0lBQ1QsVUFBVTtJQUNWLGFBQWE7SUFDYixnQkFBZ0I7SUFDaEIsZ0JBQWdCO0lBQ2hCLFlBQVk7SUFDWixPQUFPO0lBQ1AsTUFBTTtJQUNOLGFBQWE7SUFDYixhQUFhO0lBQ2IsWUFBWTtJQUNaLGVBQWU7SUFDZixZQUFZO0lBQ1osZUFBZTtJQUNmLGFBQWE7SUFDYixlQUFlO0lBQ2YsZUFBZTtJQUNmLGFBQWE7SUFDYixZQUFZO0lBQ1osZUFBZTtDQUNoQjtBQUVEO0lBQUEsTUFLYSxjQUFjOzs7Z0JBTDFCLFFBQVEsU0FBQztvQkFDUixPQUFPLEVBQUUscUJBQXFCO29CQUM5QixZQUFZLEVBQUUscUJBQXFCO2lCQUVwQzs7SUFDNkIscUJBQUM7S0FBQTtTQUFsQixjQUFjIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7TmdNb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtIZWFkZXJSb3dPdXRsZXQsIERhdGFSb3dPdXRsZXQsIENka1RhYmxlLCBGb290ZXJSb3dPdXRsZXQsIE5vRGF0YVJvd091dGxldH0gZnJvbSAnLi90YWJsZSc7XG5pbXBvcnQge1xuICBDZGtDZWxsT3V0bGV0LCBDZGtGb290ZXJSb3csIENka0Zvb3RlclJvd0RlZiwgQ2RrSGVhZGVyUm93LCBDZGtIZWFkZXJSb3dEZWYsIENka1JvdyxcbiAgQ2RrUm93RGVmLFxuICBDZGtOb0RhdGFSb3dcbn0gZnJvbSAnLi9yb3cnO1xuaW1wb3J0IHtcbiAgQ2RrQ29sdW1uRGVmLCBDZGtIZWFkZXJDZWxsRGVmLCBDZGtIZWFkZXJDZWxsLCBDZGtDZWxsLCBDZGtDZWxsRGVmLFxuICBDZGtGb290ZXJDZWxsRGVmLCBDZGtGb290ZXJDZWxsXG59IGZyb20gJy4vY2VsbCc7XG5pbXBvcnQge0Nka1RleHRDb2x1bW59IGZyb20gJy4vdGV4dC1jb2x1bW4nO1xuXG5jb25zdCBFWFBPUlRFRF9ERUNMQVJBVElPTlMgPSBbXG4gIENka1RhYmxlLFxuICBDZGtSb3dEZWYsXG4gIENka0NlbGxEZWYsXG4gIENka0NlbGxPdXRsZXQsXG4gIENka0hlYWRlckNlbGxEZWYsXG4gIENka0Zvb3RlckNlbGxEZWYsXG4gIENka0NvbHVtbkRlZixcbiAgQ2RrQ2VsbCxcbiAgQ2RrUm93LFxuICBDZGtIZWFkZXJDZWxsLFxuICBDZGtGb290ZXJDZWxsLFxuICBDZGtIZWFkZXJSb3csXG4gIENka0hlYWRlclJvd0RlZixcbiAgQ2RrRm9vdGVyUm93LFxuICBDZGtGb290ZXJSb3dEZWYsXG4gIERhdGFSb3dPdXRsZXQsXG4gIEhlYWRlclJvd091dGxldCxcbiAgRm9vdGVyUm93T3V0bGV0LFxuICBDZGtUZXh0Q29sdW1uLFxuICBDZGtOb0RhdGFSb3csXG4gIE5vRGF0YVJvd091dGxldCxcbl07XG5cbkBOZ01vZHVsZSh7XG4gIGV4cG9ydHM6IEVYUE9SVEVEX0RFQ0xBUkFUSU9OUyxcbiAgZGVjbGFyYXRpb25zOiBFWFBPUlRFRF9ERUNMQVJBVElPTlNcblxufSlcbmV4cG9ydCBjbGFzcyBDZGtUYWJsZU1vZHVsZSB7IH1cbiJdfQ==