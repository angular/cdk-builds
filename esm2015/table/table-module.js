/**
 * @fileoverview added by tsickle
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGUtbW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90YWJsZS90YWJsZS1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDN0MsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsZUFBZSxFQUFFLGFBQWEsRUFBRSxRQUFRLEVBQUUsZUFBZSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ2xGLE9BQU8sRUFDTCxhQUFhLEVBQUUsWUFBWSxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsZUFBZSxFQUFFLE1BQU0sRUFDbkYsU0FBUyxFQUNWLE1BQU0sT0FBTyxDQUFDO0FBQ2YsT0FBTyxFQUNMLFlBQVksRUFBRSxnQkFBZ0IsRUFBRSxhQUFhLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFDbEUsZ0JBQWdCLEVBQUUsYUFBYSxFQUNoQyxNQUFNLFFBQVEsQ0FBQztBQUNoQixPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sZUFBZSxDQUFDOztNQUV0QyxxQkFBcUIsR0FBRztJQUM1QixRQUFRO0lBQ1IsU0FBUztJQUNULFVBQVU7SUFDVixhQUFhO0lBQ2IsZ0JBQWdCO0lBQ2hCLGdCQUFnQjtJQUNoQixZQUFZO0lBQ1osT0FBTztJQUNQLE1BQU07SUFDTixhQUFhO0lBQ2IsYUFBYTtJQUNiLFlBQVk7SUFDWixlQUFlO0lBQ2YsWUFBWTtJQUNaLGVBQWU7SUFDZixhQUFhO0lBQ2IsZUFBZTtJQUNmLGVBQWU7SUFDZixhQUFhO0NBQ2Q7QUFRRCxNQUFNLE9BQU8sY0FBYzs7O1lBTjFCLFFBQVEsU0FBQztnQkFDUixPQUFPLEVBQUUsQ0FBQyxZQUFZLENBQUM7Z0JBQ3ZCLE9BQU8sRUFBRSxxQkFBcUI7Z0JBQzlCLFlBQVksRUFBRSxxQkFBcUI7YUFFcEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDb21tb25Nb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge05nTW9kdWxlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7SGVhZGVyUm93T3V0bGV0LCBEYXRhUm93T3V0bGV0LCBDZGtUYWJsZSwgRm9vdGVyUm93T3V0bGV0fSBmcm9tICcuL3RhYmxlJztcbmltcG9ydCB7XG4gIENka0NlbGxPdXRsZXQsIENka0Zvb3RlclJvdywgQ2RrRm9vdGVyUm93RGVmLCBDZGtIZWFkZXJSb3csIENka0hlYWRlclJvd0RlZiwgQ2RrUm93LFxuICBDZGtSb3dEZWZcbn0gZnJvbSAnLi9yb3cnO1xuaW1wb3J0IHtcbiAgQ2RrQ29sdW1uRGVmLCBDZGtIZWFkZXJDZWxsRGVmLCBDZGtIZWFkZXJDZWxsLCBDZGtDZWxsLCBDZGtDZWxsRGVmLFxuICBDZGtGb290ZXJDZWxsRGVmLCBDZGtGb290ZXJDZWxsXG59IGZyb20gJy4vY2VsbCc7XG5pbXBvcnQge0Nka1RleHRDb2x1bW59IGZyb20gJy4vdGV4dC1jb2x1bW4nO1xuXG5jb25zdCBFWFBPUlRFRF9ERUNMQVJBVElPTlMgPSBbXG4gIENka1RhYmxlLFxuICBDZGtSb3dEZWYsXG4gIENka0NlbGxEZWYsXG4gIENka0NlbGxPdXRsZXQsXG4gIENka0hlYWRlckNlbGxEZWYsXG4gIENka0Zvb3RlckNlbGxEZWYsXG4gIENka0NvbHVtbkRlZixcbiAgQ2RrQ2VsbCxcbiAgQ2RrUm93LFxuICBDZGtIZWFkZXJDZWxsLFxuICBDZGtGb290ZXJDZWxsLFxuICBDZGtIZWFkZXJSb3csXG4gIENka0hlYWRlclJvd0RlZixcbiAgQ2RrRm9vdGVyUm93LFxuICBDZGtGb290ZXJSb3dEZWYsXG4gIERhdGFSb3dPdXRsZXQsXG4gIEhlYWRlclJvd091dGxldCxcbiAgRm9vdGVyUm93T3V0bGV0LFxuICBDZGtUZXh0Q29sdW1uLFxuXTtcblxuQE5nTW9kdWxlKHtcbiAgaW1wb3J0czogW0NvbW1vbk1vZHVsZV0sXG4gIGV4cG9ydHM6IEVYUE9SVEVEX0RFQ0xBUkFUSU9OUyxcbiAgZGVjbGFyYXRpb25zOiBFWFBPUlRFRF9ERUNMQVJBVElPTlNcblxufSlcbmV4cG9ydCBjbGFzcyBDZGtUYWJsZU1vZHVsZSB7IH1cbiJdfQ==