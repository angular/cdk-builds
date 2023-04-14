/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NgModule } from '@angular/core';
import { HeaderRowOutlet, DataRowOutlet, CdkTable, CdkRecycleRows, FooterRowOutlet, NoDataRowOutlet, } from './table';
import { CdkCellOutlet, CdkFooterRow, CdkFooterRowDef, CdkHeaderRow, CdkHeaderRowDef, CdkRow, CdkRowDef, CdkNoDataRow, } from './row';
import { CdkColumnDef, CdkHeaderCellDef, CdkHeaderCell, CdkCell, CdkCellDef, CdkFooterCellDef, CdkFooterCell, } from './cell';
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
class CdkTableModule {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: CdkTableModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule }); }
    static { this.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "16.0.0-next.7", ngImport: i0, type: CdkTableModule, declarations: [CdkTable,
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
            NoDataRowOutlet] }); }
    static { this.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: CdkTableModule, imports: [ScrollingModule] }); }
}
export { CdkTableModule };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: CdkTableModule, decorators: [{
            type: NgModule,
            args: [{
                    exports: EXPORTED_DECLARATIONS,
                    declarations: EXPORTED_DECLARATIONS,
                    imports: [ScrollingModule],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGUtbW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90YWJsZS90YWJsZS1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN2QyxPQUFPLEVBQ0wsZUFBZSxFQUNmLGFBQWEsRUFDYixRQUFRLEVBQ1IsY0FBYyxFQUNkLGVBQWUsRUFDZixlQUFlLEdBQ2hCLE1BQU0sU0FBUyxDQUFDO0FBQ2pCLE9BQU8sRUFDTCxhQUFhLEVBQ2IsWUFBWSxFQUNaLGVBQWUsRUFDZixZQUFZLEVBQ1osZUFBZSxFQUNmLE1BQU0sRUFDTixTQUFTLEVBQ1QsWUFBWSxHQUNiLE1BQU0sT0FBTyxDQUFDO0FBQ2YsT0FBTyxFQUNMLFlBQVksRUFDWixnQkFBZ0IsRUFDaEIsYUFBYSxFQUNiLE9BQU8sRUFDUCxVQUFVLEVBQ1YsZ0JBQWdCLEVBQ2hCLGFBQWEsR0FDZCxNQUFNLFFBQVEsQ0FBQztBQUNoQixPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzVDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQzs7QUFFdkQsTUFBTSxxQkFBcUIsR0FBRztJQUM1QixRQUFRO0lBQ1IsU0FBUztJQUNULFVBQVU7SUFDVixhQUFhO0lBQ2IsZ0JBQWdCO0lBQ2hCLGdCQUFnQjtJQUNoQixZQUFZO0lBQ1osT0FBTztJQUNQLE1BQU07SUFDTixhQUFhO0lBQ2IsYUFBYTtJQUNiLFlBQVk7SUFDWixlQUFlO0lBQ2YsWUFBWTtJQUNaLGVBQWU7SUFDZixhQUFhO0lBQ2IsZUFBZTtJQUNmLGVBQWU7SUFDZixhQUFhO0lBQ2IsWUFBWTtJQUNaLGNBQWM7SUFDZCxlQUFlO0NBQ2hCLENBQUM7QUFFRixNQUthLGNBQWM7cUhBQWQsY0FBYztzSEFBZCxjQUFjLGlCQTdCekIsUUFBUTtZQUNSLFNBQVM7WUFDVCxVQUFVO1lBQ1YsYUFBYTtZQUNiLGdCQUFnQjtZQUNoQixnQkFBZ0I7WUFDaEIsWUFBWTtZQUNaLE9BQU87WUFDUCxNQUFNO1lBQ04sYUFBYTtZQUNiLGFBQWE7WUFDYixZQUFZO1lBQ1osZUFBZTtZQUNmLFlBQVk7WUFDWixlQUFlO1lBQ2YsYUFBYTtZQUNiLGVBQWU7WUFDZixlQUFlO1lBQ2YsYUFBYTtZQUNiLFlBQVk7WUFDWixjQUFjO1lBQ2QsZUFBZSxhQU1MLGVBQWUsYUEzQnpCLFFBQVE7WUFDUixTQUFTO1lBQ1QsVUFBVTtZQUNWLGFBQWE7WUFDYixnQkFBZ0I7WUFDaEIsZ0JBQWdCO1lBQ2hCLFlBQVk7WUFDWixPQUFPO1lBQ1AsTUFBTTtZQUNOLGFBQWE7WUFDYixhQUFhO1lBQ2IsWUFBWTtZQUNaLGVBQWU7WUFDZixZQUFZO1lBQ1osZUFBZTtZQUNmLGFBQWE7WUFDYixlQUFlO1lBQ2YsZUFBZTtZQUNmLGFBQWE7WUFDYixZQUFZO1lBQ1osY0FBYztZQUNkLGVBQWU7c0hBUUosY0FBYyxZQUZmLGVBQWU7O1NBRWQsY0FBYztrR0FBZCxjQUFjO2tCQUwxQixRQUFRO21CQUFDO29CQUNSLE9BQU8sRUFBRSxxQkFBcUI7b0JBQzlCLFlBQVksRUFBRSxxQkFBcUI7b0JBQ25DLE9BQU8sRUFBRSxDQUFDLGVBQWUsQ0FBQztpQkFDM0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtOZ01vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1xuICBIZWFkZXJSb3dPdXRsZXQsXG4gIERhdGFSb3dPdXRsZXQsXG4gIENka1RhYmxlLFxuICBDZGtSZWN5Y2xlUm93cyxcbiAgRm9vdGVyUm93T3V0bGV0LFxuICBOb0RhdGFSb3dPdXRsZXQsXG59IGZyb20gJy4vdGFibGUnO1xuaW1wb3J0IHtcbiAgQ2RrQ2VsbE91dGxldCxcbiAgQ2RrRm9vdGVyUm93LFxuICBDZGtGb290ZXJSb3dEZWYsXG4gIENka0hlYWRlclJvdyxcbiAgQ2RrSGVhZGVyUm93RGVmLFxuICBDZGtSb3csXG4gIENka1Jvd0RlZixcbiAgQ2RrTm9EYXRhUm93LFxufSBmcm9tICcuL3Jvdyc7XG5pbXBvcnQge1xuICBDZGtDb2x1bW5EZWYsXG4gIENka0hlYWRlckNlbGxEZWYsXG4gIENka0hlYWRlckNlbGwsXG4gIENka0NlbGwsXG4gIENka0NlbGxEZWYsXG4gIENka0Zvb3RlckNlbGxEZWYsXG4gIENka0Zvb3RlckNlbGwsXG59IGZyb20gJy4vY2VsbCc7XG5pbXBvcnQge0Nka1RleHRDb2x1bW59IGZyb20gJy4vdGV4dC1jb2x1bW4nO1xuaW1wb3J0IHtTY3JvbGxpbmdNb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2Nkay9zY3JvbGxpbmcnO1xuXG5jb25zdCBFWFBPUlRFRF9ERUNMQVJBVElPTlMgPSBbXG4gIENka1RhYmxlLFxuICBDZGtSb3dEZWYsXG4gIENka0NlbGxEZWYsXG4gIENka0NlbGxPdXRsZXQsXG4gIENka0hlYWRlckNlbGxEZWYsXG4gIENka0Zvb3RlckNlbGxEZWYsXG4gIENka0NvbHVtbkRlZixcbiAgQ2RrQ2VsbCxcbiAgQ2RrUm93LFxuICBDZGtIZWFkZXJDZWxsLFxuICBDZGtGb290ZXJDZWxsLFxuICBDZGtIZWFkZXJSb3csXG4gIENka0hlYWRlclJvd0RlZixcbiAgQ2RrRm9vdGVyUm93LFxuICBDZGtGb290ZXJSb3dEZWYsXG4gIERhdGFSb3dPdXRsZXQsXG4gIEhlYWRlclJvd091dGxldCxcbiAgRm9vdGVyUm93T3V0bGV0LFxuICBDZGtUZXh0Q29sdW1uLFxuICBDZGtOb0RhdGFSb3csXG4gIENka1JlY3ljbGVSb3dzLFxuICBOb0RhdGFSb3dPdXRsZXQsXG5dO1xuXG5ATmdNb2R1bGUoe1xuICBleHBvcnRzOiBFWFBPUlRFRF9ERUNMQVJBVElPTlMsXG4gIGRlY2xhcmF0aW9uczogRVhQT1JURURfREVDTEFSQVRJT05TLFxuICBpbXBvcnRzOiBbU2Nyb2xsaW5nTW9kdWxlXSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrVGFibGVNb2R1bGUge31cbiJdfQ==