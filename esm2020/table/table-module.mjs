/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NgModule } from '@angular/core';
import { HeaderRowOutlet, DataRowOutlet, CdkTable, CdkRecycleRows, FooterRowOutlet, NoDataRowOutlet, } from './table';
import { CdkCellOutlet, CdkFooterRow, CdkFooterRowDef, CdkHeaderRow, CdkHeaderRowDef, CdkRow, CdkRowDef, CdkNoDataRow } from './row';
import { CdkColumnDef, CdkHeaderCellDef, CdkHeaderCell, CdkCell, CdkCellDef, CdkFooterCellDef, CdkFooterCell } from './cell';
import { CdkTextColumn } from './text-column';
import { ScrollingModule } from '@angular/cdk/scrolling';
import * as i0 from "@angular/core";
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
    CdkRecycleRows,
    NoDataRowOutlet,
];
export class CdkTableModule {
}
CdkTableModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: CdkTableModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
CdkTableModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: CdkTableModule, declarations: [CdkTable,
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
        CdkRecycleRows,
        NoDataRowOutlet], imports: [ScrollingModule], exports: [CdkTable,
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
        CdkRecycleRows,
        NoDataRowOutlet] });
CdkTableModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: CdkTableModule, imports: [[ScrollingModule]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: CdkTableModule, decorators: [{
            type: NgModule,
            args: [{
                    exports: EXPORTED_DECLARATIONS,
                    declarations: EXPORTED_DECLARATIONS,
                    imports: [ScrollingModule]
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGUtbW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90YWJsZS90YWJsZS1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN2QyxPQUFPLEVBQ0wsZUFBZSxFQUNmLGFBQWEsRUFDYixRQUFRLEVBQ1IsY0FBYyxFQUNkLGVBQWUsRUFDZixlQUFlLEdBQ2hCLE1BQU0sU0FBUyxDQUFDO0FBQ2pCLE9BQU8sRUFDTCxhQUFhLEVBQUUsWUFBWSxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsZUFBZSxFQUFFLE1BQU0sRUFDbkYsU0FBUyxFQUNULFlBQVksRUFDYixNQUFNLE9BQU8sQ0FBQztBQUNmLE9BQU8sRUFDTCxZQUFZLEVBQUUsZ0JBQWdCLEVBQUUsYUFBYSxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQ2xFLGdCQUFnQixFQUFFLGFBQWEsRUFDaEMsTUFBTSxRQUFRLENBQUM7QUFDaEIsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM1QyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sd0JBQXdCLENBQUM7O0FBRXZELE1BQU0scUJBQXFCLEdBQUc7SUFDNUIsUUFBUTtJQUNSLFNBQVM7SUFDVCxVQUFVO0lBQ1YsYUFBYTtJQUNiLGdCQUFnQjtJQUNoQixnQkFBZ0I7SUFDaEIsWUFBWTtJQUNaLE9BQU87SUFDUCxNQUFNO0lBQ04sYUFBYTtJQUNiLGFBQWE7SUFDYixZQUFZO0lBQ1osZUFBZTtJQUNmLFlBQVk7SUFDWixlQUFlO0lBQ2YsYUFBYTtJQUNiLGVBQWU7SUFDZixlQUFlO0lBQ2YsYUFBYTtJQUNiLFlBQVk7SUFDWixjQUFjO0lBQ2QsZUFBZTtDQUNoQixDQUFDO0FBT0YsTUFBTSxPQUFPLGNBQWM7O21IQUFkLGNBQWM7b0hBQWQsY0FBYyxpQkE3QnpCLFFBQVE7UUFDUixTQUFTO1FBQ1QsVUFBVTtRQUNWLGFBQWE7UUFDYixnQkFBZ0I7UUFDaEIsZ0JBQWdCO1FBQ2hCLFlBQVk7UUFDWixPQUFPO1FBQ1AsTUFBTTtRQUNOLGFBQWE7UUFDYixhQUFhO1FBQ2IsWUFBWTtRQUNaLGVBQWU7UUFDZixZQUFZO1FBQ1osZUFBZTtRQUNmLGFBQWE7UUFDYixlQUFlO1FBQ2YsZUFBZTtRQUNmLGFBQWE7UUFDYixZQUFZO1FBQ1osY0FBYztRQUNkLGVBQWUsYUFNTCxlQUFlLGFBM0J6QixRQUFRO1FBQ1IsU0FBUztRQUNULFVBQVU7UUFDVixhQUFhO1FBQ2IsZ0JBQWdCO1FBQ2hCLGdCQUFnQjtRQUNoQixZQUFZO1FBQ1osT0FBTztRQUNQLE1BQU07UUFDTixhQUFhO1FBQ2IsYUFBYTtRQUNiLFlBQVk7UUFDWixlQUFlO1FBQ2YsWUFBWTtRQUNaLGVBQWU7UUFDZixhQUFhO1FBQ2IsZUFBZTtRQUNmLGVBQWU7UUFDZixhQUFhO1FBQ2IsWUFBWTtRQUNaLGNBQWM7UUFDZCxlQUFlO29IQVFKLGNBQWMsWUFGaEIsQ0FBQyxlQUFlLENBQUM7bUdBRWYsY0FBYztrQkFMMUIsUUFBUTttQkFBQztvQkFDUixPQUFPLEVBQUUscUJBQXFCO29CQUM5QixZQUFZLEVBQUUscUJBQXFCO29CQUNuQyxPQUFPLEVBQUUsQ0FBQyxlQUFlLENBQUM7aUJBQzNCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7TmdNb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtcbiAgSGVhZGVyUm93T3V0bGV0LFxuICBEYXRhUm93T3V0bGV0LFxuICBDZGtUYWJsZSxcbiAgQ2RrUmVjeWNsZVJvd3MsXG4gIEZvb3RlclJvd091dGxldCxcbiAgTm9EYXRhUm93T3V0bGV0LFxufSBmcm9tICcuL3RhYmxlJztcbmltcG9ydCB7XG4gIENka0NlbGxPdXRsZXQsIENka0Zvb3RlclJvdywgQ2RrRm9vdGVyUm93RGVmLCBDZGtIZWFkZXJSb3csIENka0hlYWRlclJvd0RlZiwgQ2RrUm93LFxuICBDZGtSb3dEZWYsXG4gIENka05vRGF0YVJvd1xufSBmcm9tICcuL3Jvdyc7XG5pbXBvcnQge1xuICBDZGtDb2x1bW5EZWYsIENka0hlYWRlckNlbGxEZWYsIENka0hlYWRlckNlbGwsIENka0NlbGwsIENka0NlbGxEZWYsXG4gIENka0Zvb3RlckNlbGxEZWYsIENka0Zvb3RlckNlbGxcbn0gZnJvbSAnLi9jZWxsJztcbmltcG9ydCB7Q2RrVGV4dENvbHVtbn0gZnJvbSAnLi90ZXh0LWNvbHVtbic7XG5pbXBvcnQge1Njcm9sbGluZ01vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvY2RrL3Njcm9sbGluZyc7XG5cbmNvbnN0IEVYUE9SVEVEX0RFQ0xBUkFUSU9OUyA9IFtcbiAgQ2RrVGFibGUsXG4gIENka1Jvd0RlZixcbiAgQ2RrQ2VsbERlZixcbiAgQ2RrQ2VsbE91dGxldCxcbiAgQ2RrSGVhZGVyQ2VsbERlZixcbiAgQ2RrRm9vdGVyQ2VsbERlZixcbiAgQ2RrQ29sdW1uRGVmLFxuICBDZGtDZWxsLFxuICBDZGtSb3csXG4gIENka0hlYWRlckNlbGwsXG4gIENka0Zvb3RlckNlbGwsXG4gIENka0hlYWRlclJvdyxcbiAgQ2RrSGVhZGVyUm93RGVmLFxuICBDZGtGb290ZXJSb3csXG4gIENka0Zvb3RlclJvd0RlZixcbiAgRGF0YVJvd091dGxldCxcbiAgSGVhZGVyUm93T3V0bGV0LFxuICBGb290ZXJSb3dPdXRsZXQsXG4gIENka1RleHRDb2x1bW4sXG4gIENka05vRGF0YVJvdyxcbiAgQ2RrUmVjeWNsZVJvd3MsXG4gIE5vRGF0YVJvd091dGxldCxcbl07XG5cbkBOZ01vZHVsZSh7XG4gIGV4cG9ydHM6IEVYUE9SVEVEX0RFQ0xBUkFUSU9OUyxcbiAgZGVjbGFyYXRpb25zOiBFWFBPUlRFRF9ERUNMQVJBVElPTlMsXG4gIGltcG9ydHM6IFtTY3JvbGxpbmdNb2R1bGVdXG59KVxuZXhwb3J0IGNsYXNzIENka1RhYmxlTW9kdWxlIHsgfVxuIl19