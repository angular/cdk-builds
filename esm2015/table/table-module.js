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
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { HeaderRowOutlet, DataRowOutlet, CdkTable, FooterRowOutlet } from './table';
import { CdkCellOutlet, CdkFooterRow, CdkFooterRowDef, CdkHeaderRow, CdkHeaderRowDef, CdkRow, CdkRowDef } from './row';
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
];
export class CdkTableModule {
}
CdkTableModule.decorators = [
    { type: NgModule, args: [{
                imports: [CommonModule],
                exports: EXPORTED_DECLARATIONS,
                declarations: EXPORTED_DECLARATIONS
            },] }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGUtbW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90YWJsZS90YWJsZS1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQzdDLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDdkMsT0FBTyxFQUFDLGVBQWUsRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFFLGVBQWUsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNsRixPQUFPLEVBQ0wsYUFBYSxFQUFFLFlBQVksRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFLGVBQWUsRUFBRSxNQUFNLEVBQ25GLFNBQVMsRUFDVixNQUFNLE9BQU8sQ0FBQztBQUNmLE9BQU8sRUFDTCxZQUFZLEVBQUUsZ0JBQWdCLEVBQUUsYUFBYSxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQ2xFLGdCQUFnQixFQUFFLGFBQWEsRUFDaEMsTUFBTSxRQUFRLENBQUM7QUFDaEIsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGVBQWUsQ0FBQzs7TUFFdEMscUJBQXFCLEdBQUc7SUFDNUIsUUFBUTtJQUNSLFNBQVM7SUFDVCxVQUFVO0lBQ1YsYUFBYTtJQUNiLGdCQUFnQjtJQUNoQixnQkFBZ0I7SUFDaEIsWUFBWTtJQUNaLE9BQU87SUFDUCxNQUFNO0lBQ04sYUFBYTtJQUNiLGFBQWE7SUFDYixZQUFZO0lBQ1osZUFBZTtJQUNmLFlBQVk7SUFDWixlQUFlO0lBQ2YsYUFBYTtJQUNiLGVBQWU7SUFDZixlQUFlO0lBQ2YsYUFBYTtDQUNkO0FBUUQsTUFBTSxPQUFPLGNBQWM7OztZQU4xQixRQUFRLFNBQUM7Z0JBQ1IsT0FBTyxFQUFFLENBQUMsWUFBWSxDQUFDO2dCQUN2QixPQUFPLEVBQUUscUJBQXFCO2dCQUM5QixZQUFZLEVBQUUscUJBQXFCO2FBRXBDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q29tbW9uTW9kdWxlfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtOZ01vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0hlYWRlclJvd091dGxldCwgRGF0YVJvd091dGxldCwgQ2RrVGFibGUsIEZvb3RlclJvd091dGxldH0gZnJvbSAnLi90YWJsZSc7XG5pbXBvcnQge1xuICBDZGtDZWxsT3V0bGV0LCBDZGtGb290ZXJSb3csIENka0Zvb3RlclJvd0RlZiwgQ2RrSGVhZGVyUm93LCBDZGtIZWFkZXJSb3dEZWYsIENka1JvdyxcbiAgQ2RrUm93RGVmXG59IGZyb20gJy4vcm93JztcbmltcG9ydCB7XG4gIENka0NvbHVtbkRlZiwgQ2RrSGVhZGVyQ2VsbERlZiwgQ2RrSGVhZGVyQ2VsbCwgQ2RrQ2VsbCwgQ2RrQ2VsbERlZixcbiAgQ2RrRm9vdGVyQ2VsbERlZiwgQ2RrRm9vdGVyQ2VsbFxufSBmcm9tICcuL2NlbGwnO1xuaW1wb3J0IHtDZGtUZXh0Q29sdW1ufSBmcm9tICcuL3RleHQtY29sdW1uJztcblxuY29uc3QgRVhQT1JURURfREVDTEFSQVRJT05TID0gW1xuICBDZGtUYWJsZSxcbiAgQ2RrUm93RGVmLFxuICBDZGtDZWxsRGVmLFxuICBDZGtDZWxsT3V0bGV0LFxuICBDZGtIZWFkZXJDZWxsRGVmLFxuICBDZGtGb290ZXJDZWxsRGVmLFxuICBDZGtDb2x1bW5EZWYsXG4gIENka0NlbGwsXG4gIENka1JvdyxcbiAgQ2RrSGVhZGVyQ2VsbCxcbiAgQ2RrRm9vdGVyQ2VsbCxcbiAgQ2RrSGVhZGVyUm93LFxuICBDZGtIZWFkZXJSb3dEZWYsXG4gIENka0Zvb3RlclJvdyxcbiAgQ2RrRm9vdGVyUm93RGVmLFxuICBEYXRhUm93T3V0bGV0LFxuICBIZWFkZXJSb3dPdXRsZXQsXG4gIEZvb3RlclJvd091dGxldCxcbiAgQ2RrVGV4dENvbHVtbixcbl07XG5cbkBOZ01vZHVsZSh7XG4gIGltcG9ydHM6IFtDb21tb25Nb2R1bGVdLFxuICBleHBvcnRzOiBFWFBPUlRFRF9ERUNMQVJBVElPTlMsXG4gIGRlY2xhcmF0aW9uczogRVhQT1JURURfREVDTEFSQVRJT05TXG5cbn0pXG5leHBvcnQgY2xhc3MgQ2RrVGFibGVNb2R1bGUgeyB9XG4iXX0=