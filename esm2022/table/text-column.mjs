/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectionStrategy, Component, Inject, Input, Optional, ViewChild, ViewEncapsulation, } from '@angular/core';
import { CdkCellDef, CdkColumnDef, CdkHeaderCellDef, CdkHeaderCell, CdkCell } from './cell';
import { CdkTable } from './table';
import { getTableTextColumnMissingParentTableError, getTableTextColumnMissingNameError, } from './table-errors';
import { TEXT_COLUMN_OPTIONS } from './tokens';
import * as i0 from "@angular/core";
import * as i1 from "./table";
/**
 * Column that simply shows text content for the header and row cells. Assumes that the table
 * is using the native table implementation (`<table>`).
 *
 * By default, the name of this column will be the header text and data property accessor.
 * The header text can be overridden with the `headerText` input. Cell values can be overridden with
 * the `dataAccessor` input. Change the text justification to the start or end using the `justify`
 * input.
 */
export class CdkTextColumn {
    /** Column name that should be used to reference this column. */
    get name() {
        return this._name;
    }
    set name(name) {
        this._name = name;
        // With Ivy, inputs can be initialized before static query results are
        // available. In that case, we defer the synchronization until "ngOnInit" fires.
        this._syncColumnDefName();
    }
    constructor(
    // `CdkTextColumn` is always requiring a table, but we just assert it manually
    // for better error reporting.
    // tslint:disable-next-line: lightweight-tokens
    _table, _options) {
        this._table = _table;
        this._options = _options;
        /** Alignment of the cell values. */
        this.justify = 'start';
        this._options = _options || {};
    }
    ngOnInit() {
        this._syncColumnDefName();
        if (this.headerText === undefined) {
            this.headerText = this._createDefaultHeaderText();
        }
        if (!this.dataAccessor) {
            this.dataAccessor =
                this._options.defaultDataAccessor || ((data, name) => data[name]);
        }
        if (this._table) {
            // Provide the cell and headerCell directly to the table with the static `ViewChild` query,
            // since the columnDef will not pick up its content by the time the table finishes checking
            // its content and initializing the rows.
            this.columnDef.cell = this.cell;
            this.columnDef.headerCell = this.headerCell;
            this._table.addColumnDef(this.columnDef);
        }
        else if (typeof ngDevMode === 'undefined' || ngDevMode) {
            throw getTableTextColumnMissingParentTableError();
        }
    }
    ngOnDestroy() {
        if (this._table) {
            this._table.removeColumnDef(this.columnDef);
        }
    }
    /**
     * Creates a default header text. Use the options' header text transformation function if one
     * has been provided. Otherwise simply capitalize the column name.
     */
    _createDefaultHeaderText() {
        const name = this.name;
        if (!name && (typeof ngDevMode === 'undefined' || ngDevMode)) {
            throw getTableTextColumnMissingNameError();
        }
        if (this._options && this._options.defaultHeaderTextTransform) {
            return this._options.defaultHeaderTextTransform(name);
        }
        return name[0].toUpperCase() + name.slice(1);
    }
    /** Synchronizes the column definition name with the text column name. */
    _syncColumnDefName() {
        if (this.columnDef) {
            this.columnDef.name = this.name;
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: CdkTextColumn, deps: [{ token: i1.CdkTable, optional: true }, { token: TEXT_COLUMN_OPTIONS, optional: true }], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "17.0.4", type: CdkTextColumn, isStandalone: true, selector: "cdk-text-column", inputs: { name: "name", headerText: "headerText", dataAccessor: "dataAccessor", justify: "justify" }, viewQueries: [{ propertyName: "columnDef", first: true, predicate: CdkColumnDef, descendants: true, static: true }, { propertyName: "cell", first: true, predicate: CdkCellDef, descendants: true, static: true }, { propertyName: "headerCell", first: true, predicate: CdkHeaderCellDef, descendants: true, static: true }], ngImport: i0, template: `
    <ng-container cdkColumnDef>
      <th cdk-header-cell *cdkHeaderCellDef [style.text-align]="justify">
        {{headerText}}
      </th>
      <td cdk-cell *cdkCellDef="let data" [style.text-align]="justify">
        {{dataAccessor(data, name)}}
      </td>
    </ng-container>
  `, isInline: true, dependencies: [{ kind: "directive", type: CdkColumnDef, selector: "[cdkColumnDef]", inputs: ["sticky", "cdkColumnDef", "stickyEnd"] }, { kind: "directive", type: CdkHeaderCellDef, selector: "[cdkHeaderCellDef]" }, { kind: "directive", type: CdkHeaderCell, selector: "cdk-header-cell, th[cdk-header-cell]" }, { kind: "directive", type: CdkCellDef, selector: "[cdkCellDef]" }, { kind: "directive", type: CdkCell, selector: "cdk-cell, td[cdk-cell]" }], changeDetection: i0.ChangeDetectionStrategy.Default, encapsulation: i0.ViewEncapsulation.None }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: CdkTextColumn, decorators: [{
            type: Component,
            args: [{
                    selector: 'cdk-text-column',
                    template: `
    <ng-container cdkColumnDef>
      <th cdk-header-cell *cdkHeaderCellDef [style.text-align]="justify">
        {{headerText}}
      </th>
      <td cdk-cell *cdkCellDef="let data" [style.text-align]="justify">
        {{dataAccessor(data, name)}}
      </td>
    </ng-container>
  `,
                    encapsulation: ViewEncapsulation.None,
                    // Change detection is intentionally not set to OnPush. This component's template will be provided
                    // to the table to be inserted into its view. This is problematic when change detection runs since
                    // the bindings in this template will be evaluated _after_ the table's view is evaluated, which
                    // mean's the template in the table's view will not have the updated value (and in fact will cause
                    // an ExpressionChangedAfterItHasBeenCheckedError).
                    // tslint:disable-next-line:validate-decorators
                    changeDetection: ChangeDetectionStrategy.Default,
                    standalone: true,
                    imports: [CdkColumnDef, CdkHeaderCellDef, CdkHeaderCell, CdkCellDef, CdkCell],
                }]
        }], ctorParameters: () => [{ type: i1.CdkTable, decorators: [{
                    type: Optional
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [TEXT_COLUMN_OPTIONS]
                }] }], propDecorators: { name: [{
                type: Input
            }], headerText: [{
                type: Input
            }], dataAccessor: [{
                type: Input
            }], justify: [{
                type: Input
            }], columnDef: [{
                type: ViewChild,
                args: [CdkColumnDef, { static: true }]
            }], cell: [{
                type: ViewChild,
                args: [CdkCellDef, { static: true }]
            }], headerCell: [{
                type: ViewChild,
                args: [CdkHeaderCellDef, { static: true }]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dC1jb2x1bW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RhYmxlL3RleHQtY29sdW1uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFDTCx1QkFBdUIsRUFDdkIsU0FBUyxFQUNULE1BQU0sRUFDTixLQUFLLEVBR0wsUUFBUSxFQUNSLFNBQVMsRUFDVCxpQkFBaUIsR0FDbEIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLFVBQVUsRUFBRSxZQUFZLEVBQUUsZ0JBQWdCLEVBQUUsYUFBYSxFQUFFLE9BQU8sRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUMxRixPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ2pDLE9BQU8sRUFDTCx5Q0FBeUMsRUFDekMsa0NBQWtDLEdBQ25DLE1BQU0sZ0JBQWdCLENBQUM7QUFDeEIsT0FBTyxFQUFDLG1CQUFtQixFQUFvQixNQUFNLFVBQVUsQ0FBQzs7O0FBRWhFOzs7Ozs7OztHQVFHO0FBd0JILE1BQU0sT0FBTyxhQUFhO0lBQ3hCLGdFQUFnRTtJQUNoRSxJQUNJLElBQUk7UUFDTixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQztJQUNELElBQUksSUFBSSxDQUFDLElBQVk7UUFDbkIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFFbEIsc0VBQXNFO1FBQ3RFLGdGQUFnRjtRQUNoRixJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBeUNEO0lBQ0UsOEVBQThFO0lBQzlFLDhCQUE4QjtJQUM5QiwrQ0FBK0M7SUFDM0IsTUFBbUIsRUFDVSxRQUE4QjtRQUQzRCxXQUFNLEdBQU4sTUFBTSxDQUFhO1FBQ1UsYUFBUSxHQUFSLFFBQVEsQ0FBc0I7UUE3QmpGLG9DQUFvQztRQUMzQixZQUFPLEdBQStCLE9BQU8sQ0FBQztRQThCckQsSUFBSSxD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QUFFLE9BQU8sQ0FBQztpQkFDOUU7OzBCQTBESSxRQUFROzswQkFDUixRQUFROzswQkFBSSxNQUFNOzJCQUFDLG1CQUFtQjt5Q0F2RHJDLElBQUk7c0JBRFAsS0FBSztnQkFpQkcsVUFBVTtzQkFBbEIsS0FBSztnQkFRRyxZQUFZO3NCQUFwQixLQUFLO2dCQUdHLE9BQU87c0JBQWYsS0FBSztnQkFHbUMsU0FBUztzQkFBakQsU0FBUzt1QkFBQyxZQUFZLEVBQUUsRUFBQyxNQUFNLEVBQUUsSUFBSSxFQUFDO2dCQVNBLElBQUk7c0JBQTFDLFNBQVM7dUJBQUMsVUFBVSxFQUFFLEVBQUMsTUFBTSxFQUFFLElBQUksRUFBQztnQkFTUSxVQUFVO3NCQUF0RCxTQUFTO3VCQUFDLGdCQUFnQixFQUFFLEVBQUMsTUFBTSxFQUFFLElBQUksRUFBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgQ29tcG9uZW50LFxuICBJbmplY3QsXG4gIElucHV0LFxuICBPbkRlc3Ryb3ksXG4gIE9uSW5pdCxcbiAgT3B0aW9uYWwsXG4gIFZpZXdDaGlsZCxcbiAgVmlld0VuY2Fwc3VsYXRpb24sXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtDZGtDZWxsRGVmLCBDZGtDb2x1bW5EZWYsIENka0hlYWRlckNlbGxEZWYsIENka0hlYWRlckNlbGwsIENka0NlbGx9IGZyb20gJy4vY2VsbCc7XG5pbXBvcnQge0Nka1RhYmxlfSBmcm9tICcuL3RhYmxlJztcbmltcG9ydCB7XG4gIGdldFRhYmxlVGV4dENvbHVtbk1pc3NpbmdQYXJlbnRUYWJsZUVycm9yLFxuICBnZXRUYWJsZVRleHRDb2x1bW5NaXNzaW5nTmFtZUVycm9yLFxufSBmcm9tICcuL3RhYmxlLWVycm9ycyc7XG5pbXBvcnQge1RFWFRfQ09MVU1OX09QVElPTlMsIFRleHRDb2x1bW5PcHRpb25zfSBmcm9tICcuL3Rva2Vucyc7XG5cbi8qKlxuICogQ29sdW1uIHRoYXQgc2ltcGx5IHNob3dzIHRleHQgY29udGVudCBmb3IgdGhlIGhlYWRlciBhbmQgcm93IGNlbGxzLiBBc3N1bWVzIHRoYXQgdGhlIHRhYmxlXG4gKiBpcyB1c2luZyB0aGUgbmF0aXZlIHRhYmxlIGltcGxlbWVudGF0aW9uIChgPHRhYmxlPmApLlxuICpcbiAqIEJ5IGRlZmF1bHQsIHRoZSBuYW1lIG9mIHRoaXMgY29sdW1uIHdpbGwgYmUgdGhlIGhlYWRlciB0ZXh0IGFuZCBkYXRhIHByb3BlcnR5IGFjY2Vzc29yLlxuICogVGhlIGhlYWRlciB0ZXh0IGNhbiBiZSBvdmVycmlkZGVuIHdpdGggdGhlIGBoZWFkZXJUZXh0YCBpbnB1dC4gQ2VsbCB2YWx1ZXMgY2FuIGJlIG92ZXJyaWRkZW4gd2l0aFxuICogdGhlIGBkYXRhQWNjZXNzb3JgIGlucHV0LiBDaGFuZ2UgdGhlIHRleHQganVzdGlmaWNhdGlvbiB0byB0aGUgc3RhcnQgb3IgZW5kIHVzaW5nIHRoZSBganVzdGlmeWBcbiAqIGlucHV0LlxuICovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdjZGstdGV4dC1jb2x1bW4nLFxuICB0ZW1wbGF0ZTogYFxuICAgIDxuZy1jb250YWluZXIgY2RrQ29sdW1uRGVmPlxuICAgICAgPHRoIGNkay1oZWFkZXItY2VsbCAqY2RrSGVhZGVyQ2VsbERlZiBbc3R5bGUudGV4dC1hbGlnbl09XCJqdXN0aWZ5XCI+XG4gICAgICAgIHt7aGVhZGVyVGV4dH19XG4gICAgICA8L3RoPlxuICAgICAgPHRkIGNkay1jZWxsICpjZGtDZWxsRGVmPVwibGV0IGRhdGFcIiBbc3R5bGUudGV4dC1hbGlnbl09XCJqdXN0aWZ5XCI+XG4gICAgICAgIHt7ZGF0YUFjY2Vzc29yKGRhdGEsIG5hbWUpfX1cbiAgICAgIDwvdGQ+XG4gICAgPC9uZy1jb250YWluZXI+XG4gIGAsXG4gIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsXG4gIC8vIENoYW5nZSBkZXRlY3Rpb24gaXMgaW50ZW50aW9uYWxseSBub3Qgc2V0IHRvIE9uUHVzaC4gVGhpcyBjb21wb25lbnQncyB0ZW1wbGF0ZSB3aWxsIGJlIHByb3ZpZGVkXG4gIC8vIHRvIHRoZSB0YWJsZSB0byBiZSBpbnNlcnRlZCBpbnRvIGl0cyB2aWV3LiBUaGlzIGlzIHByb2JsZW1hdGljIHdoZW4gY2hhbmdlIGRldGVjdGlvbiBydW5zIHNpbmNlXG4gIC8vIHRoZSBiaW5kaW5ncyBpbiB0aGlzIHRlbXBsYXRlIHdpbGwgYmUgZXZhbHVhdGVkIF9hZnRlcl8gdGhlIHRhYmxlJ3MgdmlldyBpcyBldmFsdWF0ZWQsIHdoaWNoXG4gIC8vIG1lYW4ncyB0aGUgdGVtcGxhdGUgaW4gdGhlIHRhYmxlJ3MgdmlldyB3aWxsIG5vdCBoYXZlIHRoZSB1cGRhdGVkIHZhbHVlIChhbmQgaW4gZmFjdCB3aWxsIGNhdXNlXG4gIC8vIGFuIEV4cHJlc3Npb25DaGFuZ2VkQWZ0ZXJJdEhhc0JlZW5DaGVja2VkRXJyb3IpLlxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6dmFsaWRhdGUtZGVjb3JhdG9yc1xuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5LkRlZmF1bHQsXG4gIHN0YW5kYWxvbmU6IHRydWUsXG4gIGltcG9ydHM6IFtDZGtDb2x1bW5EZWYsIENka0hlYWRlckNlbGxEZWYsIENka0hlYWRlckNlbGwsIENka0NlbGxEZWYsIENka0NlbGxdLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtUZXh0Q29sdW1uPFQ+IGltcGxlbWVudHMgT25EZXN0cm95LCBPbkluaXQge1xuICAvKiogQ29sdW1uIG5hbWUgdGhhdCBzaG91bGQgYmUgdXNlZCB0byByZWZlcmVuY2UgdGhpcyBjb2x1bW4uICovXG4gIEBJbnB1dCgpXG4gIGdldCBuYW1lKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX25hbWU7XG4gIH1cbiAgc2V0IG5hbWUobmFtZTogc3RyaW5nKSB7XG4gICAgdGhpcy5fbmFtZSA9IG5hbWU7XG5cbiAgICAvLyBXaXRoIEl2eSwgaW5wdXRzIGNhbiBiZSBpbml0aWFsaXplZCBiZWZvcmUgc3RhdGljIHF1ZXJ5IHJlc3VsdHMgYXJlXG4gICAgLy8gYXZhaWxhYmxlLiBJbiB0aGF0IGNhc2UsIHdlIGRlZmVyIHRoZSBzeW5jaHJvbml6YXRpb24gdW50aWwgXCJuZ09uSW5pdFwiIGZpcmVzLlxuICAgIHRoaXMuX3N5bmNDb2x1bW5EZWZOYW1lKCk7XG4gIH1cbiAgX25hbWU6IHN0cmluZztcblxuICAvKipcbiAgICogVGV4dCBsYWJlbCB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciB0aGUgY29sdW1uIGhlYWRlci4gSWYgdGhpcyBwcm9wZXJ0eSBpcyBub3RcbiAgICogc2V0LCB0aGUgaGVhZGVyIHRleHQgd2lsbCBkZWZhdWx0IHRvIHRoZSBjb2x1bW4gbmFtZSB3aXRoIGl0cyBmaXJzdCBsZXR0ZXIgY2FwaXRhbGl6ZWQuXG4gICAqL1xuICBASW5wdXQoKSBoZWFkZXJUZXh0OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEFjY2Vzc29yIGZ1bmN0aW9uIHRvIHJldHJpZXZlIHRoZSBkYXRhIHJlbmRlcmVkIGZvciBlYWNoIGNlbGwuIElmIHRoaXNcbiAgICogcHJvcGVydHkgaXMgbm90IHNldCwgdGhlIGRhdGEgY2VsbHMgd2lsbCByZW5kZXIgdGhlIHZhbHVlIGZvdW5kIGluIHRoZSBkYXRhJ3MgcHJvcGVydHkgbWF0Y2hpbmdcbiAgICogdGhlIGNvbHVtbidzIG5hbWUuIEZvciBleGFtcGxlLCBpZiB0aGUgY29sdW1uIGlzIG5hbWVkIGBpZGAsIHRoZW4gdGhlIHJlbmRlcmVkIHZhbHVlIHdpbGwgYmVcbiAgICogdmFsdWUgZGVmaW5lZCBieSB0aGUgZGF0YSdzIGBpZGAgcHJvcGVydHkuXG4gICAqL1xuICBASW5wdXQoKSBkYXRhQWNjZXNzb3I6IChkYXRhOiBULCBuYW1lOiBzdHJpbmcpID0+IHN0cmluZztcblxuICAvKiogQWxpZ25tZW50IG9mIHRoZSBjZWxsIHZhbHVlcy4gKi9cbiAgQElucHV0KCkganVzdGlmeTogJ3N0YXJ0JyB8ICdlbmQnIHwgJ2NlbnRlcicgPSAnc3RhcnQnO1xuXG4gIC8qKiBAZG9jcy1wcml2YXRlICovXG4gIEBWaWV3Q2hpbGQoQ2RrQ29sdW1uRGVmLCB7c3RhdGljOiB0cnVlfSkgY29sdW1uRGVmOiBDZGtDb2x1bW5EZWY7XG5cbiAgLyoqXG4gICAqIFRoZSBjb2x1bW4gY2VsbCBpcyBwcm92aWRlZCB0byB0aGUgY29sdW1uIGR1cmluZyBgbmdPbkluaXRgIHdpdGggYSBzdGF0aWMgcXVlcnkuXG4gICAqIE5vcm1hbGx5LCB0aGlzIHdpbGwgYmUgcmV0cmlldmVkIGJ5IHRoZSBjb2x1bW4gdXNpbmcgYENvbnRlbnRDaGlsZGAsIGJ1dCB0aGF0IGFzc3VtZXMgdGhlXG4gICAqIGNvbHVtbiBkZWZpbml0aW9uIHdhcyBwcm92aWRlZCBpbiB0aGUgc2FtZSB2aWV3IGFzIHRoZSB0YWJsZSwgd2hpY2ggaXMgbm90IHRoZSBjYXNlIHdpdGggdGhpc1xuICAgKiBjb21wb25lbnQuXG4gICAqIEBkb2NzLXByaXZhdGVcbiAgICovXG4gIEBWaWV3Q2hpbGQoQ2RrQ2VsbERlZiwge3N0YXRpYzogdHJ1ZX0pIGNlbGw6IENka0NlbGxEZWY7XG5cbiAgLyoqXG4gICAqIFRoZSBjb2x1bW4gaGVhZGVyQ2VsbCBpcyBwcm92aWRlZCB0byB0aGUgY29sdW1uIGR1cmluZyBgbmdPbkluaXRgIHdpdGggYSBzdGF0aWMgcXVlcnkuXG4gICAqIE5vcm1hbGx5LCB0aGlzIHdpbGwgYmUgcmV0cmlldmVkIGJ5IHRoZSBjb2x1bW4gdXNpbmcgYENvbnRlbnRDaGlsZGAsIGJ1dCB0aGF0IGFzc3VtZXMgdGhlXG4gICAqIGNvbHVtbiBkZWZpbml0aW9uIHdhcyBwcm92aWRlZCBpbiB0aGUgc2FtZSB2aWV3IGFzIHRoZSB0YWJsZSwgd2hpY2ggaXMgbm90IHRoZSBjYXNlIHdpdGggdGhpc1xuICAgKiBjb21wb25lbnQuXG4gICAqIEBkb2NzLXByaXZhdGVcbiAgICovXG4gIEBWaWV3Q2hpbGQoQ2RrSGVhZGVyQ2VsbERlZiwge3N0YXRpYzogdHJ1ZX0pIGhlYWRlckNlbGw6IENka0hlYWRlckNlbGxEZWY7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgLy8gYENka1RleHRDb2x1bW5gIGlzIGFsd2F5cyByZXF1aXJpbmcgYSB0YWJsZSwgYnV0IHdlIGp1c3QgYXNzZXJ0IGl0IG1hbnVhbGx5XG4gICAgLy8gZm9yIGJldHRlciBlcnJvciByZXBvcnRpbmcuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBsaWdodHdlaWdodC10b2tlbnNcbiAgICBAT3B0aW9uYWwoKSBwcml2YXRlIF90YWJsZTogQ2RrVGFibGU8VD4sXG4gICAgQE9wdGlvbmFsKCkgQEluamVjdChURVhUX0NPTFVNTl9PUFRJT05TKSBwcml2YXRlIF9vcHRpb25zOiBUZXh0Q29sdW1uT3B0aW9uczxUPixcbiAgKSB7XG4gICAgdGhpcy5fb3B0aW9ucyA9IF9vcHRpb25zIHx8IHt9O1xuICB9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgdGhpcy5fc3luY0NvbHVtbkRlZk5hbWUoKTtcblxuICAgIGlmICh0aGlzLmhlYWRlclRleHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5oZWFkZXJUZXh0ID0gdGhpcy5fY3JlYXRlRGVmYXVsdEhlYWRlclRleHQoKTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuZGF0YUFjY2Vzc29yKSB7XG4gICAgICB0aGlzLmRhdGFBY2Nlc3NvciA9XG4gICAgICAgIHRoaXMuX29wdGlvbnMuZGVmYXVsdERhdGFBY2Nlc3NvciB8fCAoKGRhdGE6IFQsIG5hbWU6IHN0cmluZykgPT4gKGRhdGEgYXMgYW55KVtuYW1lXSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3RhYmxlKSB7XG4gICAgICAvLyBQcm92aWRlIHRoZSBjZWxsIGFuZCBoZWFkZXJDZWxsIGRpcmVjdGx5IHRvIHRoZSB0YWJsZSB3aXRoIHRoZSBzdGF0aWMgYFZpZXdDaGlsZGAgcXVlcnksXG4gICAgICAvLyBzaW5jZSB0aGUgY29sdW1uRGVmIHdpbGwgbm90IHBpY2sgdXAgaXRzIGNvbnRlbnQgYnkgdGhlIHRpbWUgdGhlIHRhYmxlIGZpbmlzaGVzIGNoZWNraW5nXG4gICAgICAvLyBpdHMgY29udGVudCBhbmQgaW5pdGlhbGl6aW5nIHRoZSByb3dzLlxuICAgICAgdGhpcy5jb2x1bW5EZWYuY2VsbCA9IHRoaXMuY2VsbDtcbiAgICAgIHRoaXMuY29sdW1uRGVmLmhlYWRlckNlbGwgPSB0aGlzLmhlYWRlckNlbGw7XG4gICAgICB0aGlzLl90YWJsZS5hZGRDb2x1bW5EZWYodGhpcy5jb2x1bW5EZWYpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSB7XG4gICAgICB0aHJvdyBnZXRUYWJsZVRleHRDb2x1bW5NaXNzaW5nUGFyZW50VGFibGVFcnJvcigpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIGlmICh0aGlzLl90YWJsZSkge1xuICAgICAgdGhpcy5fdGFibGUucmVtb3ZlQ29sdW1uRGVmKHRoaXMuY29sdW1uRGVmKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGRlZmF1bHQgaGVhZGVyIHRleHQuIFVzZSB0aGUgb3B0aW9ucycgaGVhZGVyIHRleHQgdHJhbnNmb3JtYXRpb24gZnVuY3Rpb24gaWYgb25lXG4gICAqIGhhcyBiZWVuIHByb3ZpZGVkLiBPdGhlcndpc2Ugc2ltcGx5IGNhcGl0YWxpemUgdGhlIGNvbHVtbiBuYW1lLlxuICAgKi9cbiAgX2NyZWF0ZURlZmF1bHRIZWFkZXJUZXh0KCkge1xuICAgIGNvbnN0IG5hbWUgPSB0aGlzLm5hbWU7XG5cbiAgICBpZiAoIW5hbWUgJiYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgIHRocm93IGdldFRhYmxlVGV4dENvbHVtbk1pc3NpbmdOYW1lRXJyb3IoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fb3B0aW9ucyAmJiB0aGlzLl9vcHRpb25zLmRlZmF1bHRIZWFkZXJUZXh0VHJhbnNmb3JtKSB7XG4gICAgICByZXR1cm4gdGhpcy5fb3B0aW9ucy5kZWZhdWx0SGVhZGVyVGV4dFRyYW5zZm9ybShuYW1lKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmFtZVswXS50b1VwcGVyQ2FzZSgpICsgbmFtZS5zbGljZSgxKTtcbiAgfVxuXG4gIC8qKiBTeW5jaHJvbml6ZXMgdGhlIGNvbHVtbiBkZWZpbml0aW9uIG5hbWUgd2l0aCB0aGUgdGV4dCBjb2x1bW4gbmFtZS4gKi9cbiAgcHJpdmF0ZSBfc3luY0NvbHVtbkRlZk5hbWUoKSB7XG4gICAgaWYgKHRoaXMuY29sdW1uRGVmKSB7XG4gICAgICB0aGlzLmNvbHVtbkRlZi5uYW1lID0gdGhpcy5uYW1lO1xuICAgIH1cbiAgfVxufVxuIl19