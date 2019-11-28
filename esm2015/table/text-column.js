/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/table/text-column.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectionStrategy, Component, Inject, InjectionToken, Input, Optional, ViewChild, ViewEncapsulation, isDevMode, } from '@angular/core';
import { CdkCellDef, CdkColumnDef, CdkHeaderCellDef } from './cell';
import { CdkTable } from './table';
import { getTableTextColumnMissingParentTableError, getTableTextColumnMissingNameError, } from './table-errors';
/**
 * Configurable options for `CdkTextColumn`.
 * @record
 * @template T
 */
export function TextColumnOptions() { }
if (false) {
    /**
     * Default function that provides the header text based on the column name if a header
     * text is not provided.
     * @type {?|undefined}
     */
    TextColumnOptions.prototype.defaultHeaderTextTransform;
    /**
     * Default data accessor to use if one is not provided.
     * @type {?|undefined}
     */
    TextColumnOptions.prototype.defaultDataAccessor;
}
/**
 * Injection token that can be used to specify the text column options.
 * @type {?}
 */
export const TEXT_COLUMN_OPTIONS = new InjectionToken('text-column-options');
/**
 * Column that simply shows text content for the header and row cells. Assumes that the table
 * is using the native table implementation (`<table>`).
 *
 * By default, the name of this column will be the header text and data property accessor.
 * The header text can be overridden with the `headerText` input. Cell values can be overridden with
 * the `dataAccessor` input. Change the text justification to the start or end using the `justify`
 * input.
 * @template T
 */
export class CdkTextColumn {
    /**
     * @param {?} _table
     * @param {?} _options
     */
    constructor(_table, _options) {
        this._table = _table;
        this._options = _options;
        /**
         * Alignment of the cell values.
         */
        this.justify = 'start';
        this._options = _options || {};
    }
    /**
     * Column name that should be used to reference this column.
     * @return {?}
     */
    get name() {
        return this._name;
    }
    /**
     * @param {?} name
     * @return {?}
     */
    set name(name) {
        this._name = name;
        // With Ivy, inputs can be initialized before static query results are
        // available. In that case, we defer the synchronization until "ngOnInit" fires.
        this._syncColumnDefName();
    }
    /**
     * @return {?}
     */
    ngOnInit() {
        this._syncColumnDefName();
        if (this.headerText === undefined) {
            this.headerText = this._createDefaultHeaderText();
        }
        if (!this.dataAccessor) {
            this.dataAccessor =
                this._options.defaultDataAccessor || ((/**
                 * @param {?} data
                 * @param {?} name
                 * @return {?}
                 */
                (data, name) => ((/** @type {?} */ (data)))[name]));
        }
        if (this._table) {
            // Provide the cell and headerCell directly to the table with the static `ViewChild` query,
            // since the columnDef will not pick up its content by the time the table finishes checking
            // its content and initializing the rows.
            this.columnDef.cell = this.cell;
            this.columnDef.headerCell = this.headerCell;
            this._table.addColumnDef(this.columnDef);
        }
        else {
            throw getTableTextColumnMissingParentTableError();
        }
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        if (this._table) {
            this._table.removeColumnDef(this.columnDef);
        }
    }
    /**
     * Creates a default header text. Use the options' header text transformation function if one
     * has been provided. Otherwise simply capitalize the column name.
     * @return {?}
     */
    _createDefaultHeaderText() {
        /** @type {?} */
        const name = this.name;
        if (isDevMode() && !name) {
            throw getTableTextColumnMissingNameError();
        }
        if (this._options && this._options.defaultHeaderTextTransform) {
            return this._options.defaultHeaderTextTransform(name);
        }
        return name[0].toUpperCase() + name.slice(1);
    }
    /**
     * Synchronizes the column definition name with the text column name.
     * @private
     * @return {?}
     */
    _syncColumnDefName() {
        if (this.columnDef) {
            this.columnDef.name = this.name;
        }
    }
}
CdkTextColumn.decorators = [
    { type: Component, args: [{
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
                changeDetection: ChangeDetectionStrategy.Default
            }] }
];
/** @nocollapse */
CdkTextColumn.ctorParameters = () => [
    { type: CdkTable, decorators: [{ type: Optional }] },
    { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [TEXT_COLUMN_OPTIONS,] }] }
];
CdkTextColumn.propDecorators = {
    name: [{ type: Input }],
    headerText: [{ type: Input }],
    dataAccessor: [{ type: Input }],
    justify: [{ type: Input }],
    columnDef: [{ type: ViewChild, args: [CdkColumnDef, { static: true },] }],
    cell: [{ type: ViewChild, args: [CdkCellDef, { static: true },] }],
    headerCell: [{ type: ViewChild, args: [CdkHeaderCellDef, { static: true },] }]
};
if (false) {
    /** @type {?} */
    CdkTextColumn.prototype._name;
    /**
     * Text label that should be used for the column header. If this property is not
     * set, the header text will default to the column name with its first letter capitalized.
     * @type {?}
     */
    CdkTextColumn.prototype.headerText;
    /**
     * Accessor function to retrieve the data rendered for each cell. If this
     * property is not set, the data cells will render the value found in the data's property matching
     * the column's name. For example, if the column is named `id`, then the rendered value will be
     * value defined by the data's `id` property.
     * @type {?}
     */
    CdkTextColumn.prototype.dataAccessor;
    /**
     * Alignment of the cell values.
     * @type {?}
     */
    CdkTextColumn.prototype.justify;
    /**
     * \@docs-private
     * @type {?}
     */
    CdkTextColumn.prototype.columnDef;
    /**
     * The column cell is provided to the column during `ngOnInit` with a static query.
     * Normally, this will be retrieved by the column using `ContentChild`, but that assumes the
     * column definition was provided in the same view as the table, which is not the case with this
     * component.
     * \@docs-private
     * @type {?}
     */
    CdkTextColumn.prototype.cell;
    /**
     * The column headerCell is provided to the column during `ngOnInit` with a static query.
     * Normally, this will be retrieved by the column using `ContentChild`, but that assumes the
     * column definition was provided in the same view as the table, which is not the case with this
     * component.
     * \@docs-private
     * @type {?}
     */
    CdkTextColumn.prototype.headerCell;
    /**
     * @type {?}
     * @private
     */
    CdkTextColumn.prototype._table;
    /**
     * @type {?}
     * @private
     */
    CdkTextColumn.prototype._options;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dC1jb2x1bW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RhYmxlL3RleHQtY29sdW1uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFDTCx1QkFBdUIsRUFDdkIsU0FBUyxFQUNULE1BQU0sRUFDTixjQUFjLEVBQ2QsS0FBSyxFQUdMLFFBQVEsRUFDUixTQUFTLEVBQ1QsaUJBQWlCLEVBQ2pCLFNBQVMsR0FDVixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsVUFBVSxFQUFFLFlBQVksRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUNsRSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ2pDLE9BQU8sRUFDTCx5Q0FBeUMsRUFDekMsa0NBQWtDLEdBQ25DLE1BQU0sZ0JBQWdCLENBQUM7Ozs7OztBQUl4Qix1Q0FTQzs7Ozs7OztJQUpDLHVEQUFzRDs7Ozs7SUFHdEQsZ0RBQXdEOzs7Ozs7QUFJMUQsTUFBTSxPQUFPLG1CQUFtQixHQUM1QixJQUFJLGNBQWMsQ0FBeUIscUJBQXFCLENBQUM7Ozs7Ozs7Ozs7O0FBZ0NyRSxNQUFNLE9BQU8sYUFBYTs7Ozs7SUFxRHhCLFlBQ3dCLE1BQW1CLEVBQ1UsUUFBOEI7UUFEM0QsV0FBTSxHQUFOLE1BQU0sQ0FBYTtRQUNVLGFBQVEsR0FBUixRQUFRLENBQXNCOzs7O1FBekIxRSxZQUFPLEdBQWtCLE9BQU8sQ0FBQztRQTBCeEMsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLElBQUksRUFBRSxDQUFDO0lBQ2pDLENBQUM7Ozs7O0lBdkRELElBQ0ksSUFBSTtRQUNOLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNwQixDQUFDOzs7OztJQUNELElBQUksSUFBSSxDQUFDLElBQVk7UUFDbkIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFFbEIsc0VBQXNFO1FB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Ozs7Ozs7OztJQVN4RCxtQ0FBMEU7Ozs7O0lBR3RFLCtCQUF1Qzs7Ozs7SUFDdkMsaUNBQStFIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDb21wb25lbnQsXG4gIEluamVjdCxcbiAgSW5qZWN0aW9uVG9rZW4sXG4gIElucHV0LFxuICBPbkRlc3Ryb3ksXG4gIE9uSW5pdCxcbiAgT3B0aW9uYWwsXG4gIFZpZXdDaGlsZCxcbiAgVmlld0VuY2Fwc3VsYXRpb24sXG4gIGlzRGV2TW9kZSxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0Nka0NlbGxEZWYsIENka0NvbHVtbkRlZiwgQ2RrSGVhZGVyQ2VsbERlZn0gZnJvbSAnLi9jZWxsJztcbmltcG9ydCB7Q2RrVGFibGV9IGZyb20gJy4vdGFibGUnO1xuaW1wb3J0IHtcbiAgZ2V0VGFibGVUZXh0Q29sdW1uTWlzc2luZ1BhcmVudFRhYmxlRXJyb3IsXG4gIGdldFRhYmxlVGV4dENvbHVtbk1pc3NpbmdOYW1lRXJyb3IsXG59IGZyb20gJy4vdGFibGUtZXJyb3JzJztcblxuXG4vKiogQ29uZmlndXJhYmxlIG9wdGlvbnMgZm9yIGBDZGtUZXh0Q29sdW1uYC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVGV4dENvbHVtbk9wdGlvbnM8VD4ge1xuICAvKipcbiAgICogRGVmYXVsdCBmdW5jdGlvbiB0aGF0IHByb3ZpZGVzIHRoZSBoZWFkZXIgdGV4dCBiYXNlZCBvbiB0aGUgY29sdW1uIG5hbWUgaWYgYSBoZWFkZXJcbiAgICogdGV4dCBpcyBub3QgcHJvdmlkZWQuXG4gICAqL1xuICBkZWZhdWx0SGVhZGVyVGV4dFRyYW5zZm9ybT86IChuYW1lOiBzdHJpbmcpID0+IHN0cmluZztcblxuICAvKiogRGVmYXVsdCBkYXRhIGFjY2Vzc29yIHRvIHVzZSBpZiBvbmUgaXMgbm90IHByb3ZpZGVkLiAqL1xuICBkZWZhdWx0RGF0YUFjY2Vzc29yPzogKGRhdGE6IFQsIG5hbWU6IHN0cmluZykgPT4gc3RyaW5nO1xufVxuXG4vKiogSW5qZWN0aW9uIHRva2VuIHRoYXQgY2FuIGJlIHVzZWQgdG8gc3BlY2lmeSB0aGUgdGV4dCBjb2x1bW4gb3B0aW9ucy4gKi9cbmV4cG9ydCBjb25zdCBURVhUX0NPTFVNTl9PUFRJT05TID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48VGV4dENvbHVtbk9wdGlvbnM8YW55Pj4oJ3RleHQtY29sdW1uLW9wdGlvbnMnKTtcblxuLyoqXG4gKiBDb2x1bW4gdGhhdCBzaW1wbHkgc2hvd3MgdGV4dCBjb250ZW50IGZvciB0aGUgaGVhZGVyIGFuZCByb3cgY2VsbHMuIEFzc3VtZXMgdGhhdCB0aGUgdGFibGVcbiAqIGlzIHVzaW5nIHRoZSBuYXRpdmUgdGFibGUgaW1wbGVtZW50YXRpb24gKGA8dGFibGU+YCkuXG4gKlxuICogQnkgZGVmYXVsdCwgdGhlIG5hbWUgb2YgdGhpcyBjb2x1bW4gd2lsbCBiZSB0aGUgaGVhZGVyIHRleHQgYW5kIGRhdGEgcHJvcGVydHkgYWNjZXNzb3IuXG4gKiBUaGUgaGVhZGVyIHRleHQgY2FuIGJlIG92ZXJyaWRkZW4gd2l0aCB0aGUgYGhlYWRlclRleHRgIGlucHV0LiBDZWxsIHZhbHVlcyBjYW4gYmUgb3ZlcnJpZGRlbiB3aXRoXG4gKiB0aGUgYGRhdGFBY2Nlc3NvcmAgaW5wdXQuIENoYW5nZSB0aGUgdGV4dCBqdXN0aWZpY2F0aW9uIHRvIHRoZSBzdGFydCBvciBlbmQgdXNpbmcgdGhlIGBqdXN0aWZ5YFxuICogaW5wdXQuXG4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2Nkay10ZXh0LWNvbHVtbicsXG4gIHRlbXBsYXRlOiBgXG4gICAgPG5nLWNvbnRhaW5lciBjZGtDb2x1bW5EZWY+XG4gICAgICA8dGggY2RrLWhlYWRlci1jZWxsICpjZGtIZWFkZXJDZWxsRGVmIFtzdHlsZS50ZXh0LWFsaWduXT1cImp1c3RpZnlcIj5cbiAgICAgICAge3toZWFkZXJUZXh0fX1cbiAgICAgIDwvdGg+XG4gICAgICA8dGQgY2RrLWNlbGwgKmNka0NlbGxEZWY9XCJsZXQgZGF0YVwiIFtzdHlsZS50ZXh0LWFsaWduXT1cImp1c3RpZnlcIj5cbiAgICAgICAge3tkYXRhQWNjZXNzb3IoZGF0YSwgbmFtZSl9fVxuICAgICAgPC90ZD5cbiAgICA8L25nLWNvbnRhaW5lcj5cbiAgYCxcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcbiAgLy8gQ2hhbmdlIGRldGVjdGlvbiBpcyBpbnRlbnRpb25hbGx5IG5vdCBzZXQgdG8gT25QdXNoLiBUaGlzIGNvbXBvbmVudCdzIHRlbXBsYXRlIHdpbGwgYmUgcHJvdmlkZWRcbiAgLy8gdG8gdGhlIHRhYmxlIHRvIGJlIGluc2VydGVkIGludG8gaXRzIHZpZXcuIFRoaXMgaXMgcHJvYmxlbWF0aWMgd2hlbiBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bnMgc2luY2VcbiAgLy8gdGhlIGJpbmRpbmdzIGluIHRoaXMgdGVtcGxhdGUgd2lsbCBiZSBldmFsdWF0ZWQgX2FmdGVyXyB0aGUgdGFibGUncyB2aWV3IGlzIGV2YWx1YXRlZCwgd2hpY2hcbiAgLy8gbWVhbidzIHRoZSB0ZW1wbGF0ZSBpbiB0aGUgdGFibGUncyB2aWV3IHdpbGwgbm90IGhhdmUgdGhlIHVwZGF0ZWQgdmFsdWUgKGFuZCBpbiBmYWN0IHdpbGwgY2F1c2VcbiAgLy8gYW4gRXhwcmVzc2lvbkNoYW5nZWRBZnRlckl0SGFzQmVlbkNoZWNrZWRFcnJvcikuXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTp2YWxpZGF0ZS1kZWNvcmF0b3JzXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuRGVmYXVsdCxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrVGV4dENvbHVtbjxUPiBpbXBsZW1lbnRzIE9uRGVzdHJveSwgT25Jbml0IHtcbiAgLyoqIENvbHVtbiBuYW1lIHRoYXQgc2hvdWxkIGJlIHVzZWQgdG8gcmVmZXJlbmNlIHRoaXMgY29sdW1uLiAqL1xuICBASW5wdXQoKVxuICBnZXQgbmFtZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLl9uYW1lO1xuICB9XG4gIHNldCBuYW1lKG5hbWU6IHN0cmluZykge1xuICAgIHRoaXMuX25hbWUgPSBuYW1lO1xuXG4gICAgLy8gV2l0aCBJdnksIGlucHV0cyBjYW4gYmUgaW5pdGlhbGl6ZWQgYmVmb3JlIHN0YXRpYyBxdWVyeSByZXN1bHRzIGFyZVxuICAgIC8vIGF2YWlsYWJsZS4gSW4gdGhhdCBjYXNlLCB3ZSBkZWZlciB0aGUgc3luY2hyb25pemF0aW9uIHVudGlsIFwibmdPbkluaXRcIiBmaXJlcy5cbiAgICB0aGlzLl9zeW5jQ29sdW1uRGVmTmFtZSgpO1xuICB9XG4gIF9uYW1lOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRleHQgbGFiZWwgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgdGhlIGNvbHVtbiBoZWFkZXIuIElmIHRoaXMgcHJvcGVydHkgaXMgbm90XG4gICAqIHNldCwgdGhlIGhlYWRlciB0ZXh0IHdpbGwgZGVmYXVsdCB0byB0aGUgY29sdW1uIG5hbWUgd2l0aCBpdHMgZmlyc3QgbGV0dGVyIGNhcGl0YWxpemVkLlxuICAgKi9cbiAgQElucHV0KCkgaGVhZGVyVGV4dDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBBY2Nlc3NvciBmdW5jdGlvbiB0byByZXRyaWV2ZSB0aGUgZGF0YSByZW5kZXJlZCBmb3IgZWFjaCBjZWxsLiBJZiB0aGlzXG4gICAqIHByb3BlcnR5IGlzIG5vdCBzZXQsIHRoZSBkYXRhIGNlbGxzIHdpbGwgcmVuZGVyIHRoZSB2YWx1ZSBmb3VuZCBpbiB0aGUgZGF0YSdzIHByb3BlcnR5IG1hdGNoaW5nXG4gICAqIHRoZSBjb2x1bW4ncyBuYW1lLiBGb3IgZXhhbXBsZSwgaWYgdGhlIGNvbHVtbiBpcyBuYW1lZCBgaWRgLCB0aGVuIHRoZSByZW5kZXJlZCB2YWx1ZSB3aWxsIGJlXG4gICAqIHZhbHVlIGRlZmluZWQgYnkgdGhlIGRhdGEncyBgaWRgIHByb3BlcnR5LlxuICAgKi9cbiAgQElucHV0KCkgZGF0YUFjY2Vzc29yOiAoZGF0YTogVCwgbmFtZTogc3RyaW5nKSA9PiBzdHJpbmc7XG5cbiAgLyoqIEFsaWdubWVudCBvZiB0aGUgY2VsbCB2YWx1ZXMuICovXG4gIEBJbnB1dCgpIGp1c3RpZnk6ICdzdGFydCd8J2VuZCcgPSAnc3RhcnQnO1xuXG4gIC8qKiBAZG9jcy1wcml2YXRlICovXG4gIEBWaWV3Q2hpbGQoQ2RrQ29sdW1uRGVmLCB7c3RhdGljOiB0cnVlfSkgY29sdW1uRGVmOiBDZGtDb2x1bW5EZWY7XG5cbiAgLyoqXG4gICAqIFRoZSBjb2x1bW4gY2VsbCBpcyBwcm92aWRlZCB0byB0aGUgY29sdW1uIGR1cmluZyBgbmdPbkluaXRgIHdpdGggYSBzdGF0aWMgcXVlcnkuXG4gICAqIE5vcm1hbGx5LCB0aGlzIHdpbGwgYmUgcmV0cmlldmVkIGJ5IHRoZSBjb2x1bW4gdXNpbmcgYENvbnRlbnRDaGlsZGAsIGJ1dCB0aGF0IGFzc3VtZXMgdGhlXG4gICAqIGNvbHVtbiBkZWZpbml0aW9uIHdhcyBwcm92aWRlZCBpbiB0aGUgc2FtZSB2aWV3IGFzIHRoZSB0YWJsZSwgd2hpY2ggaXMgbm90IHRoZSBjYXNlIHdpdGggdGhpc1xuICAgKiBjb21wb25lbnQuXG4gICAqIEBkb2NzLXByaXZhdGVcbiAgICovXG4gIEBWaWV3Q2hpbGQoQ2RrQ2VsbERlZiwge3N0YXRpYzogdHJ1ZX0pIGNlbGw6IENka0NlbGxEZWY7XG5cbiAgLyoqXG4gICAqIFRoZSBjb2x1bW4gaGVhZGVyQ2VsbCBpcyBwcm92aWRlZCB0byB0aGUgY29sdW1uIGR1cmluZyBgbmdPbkluaXRgIHdpdGggYSBzdGF0aWMgcXVlcnkuXG4gICAqIE5vcm1hbGx5LCB0aGlzIHdpbGwgYmUgcmV0cmlldmVkIGJ5IHRoZSBjb2x1bW4gdXNpbmcgYENvbnRlbnRDaGlsZGAsIGJ1dCB0aGF0IGFzc3VtZXMgdGhlXG4gICAqIGNvbHVtbiBkZWZpbml0aW9uIHdhcyBwcm92aWRlZCBpbiB0aGUgc2FtZSB2aWV3IGFzIHRoZSB0YWJsZSwgd2hpY2ggaXMgbm90IHRoZSBjYXNlIHdpdGggdGhpc1xuICAgKiBjb21wb25lbnQuXG4gICAqIEBkb2NzLXByaXZhdGVcbiAgICovXG4gIEBWaWV3Q2hpbGQoQ2RrSGVhZGVyQ2VsbERlZiwge3N0YXRpYzogdHJ1ZX0pIGhlYWRlckNlbGw6IENka0hlYWRlckNlbGxEZWY7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBAT3B0aW9uYWwoKSBwcml2YXRlIF90YWJsZTogQ2RrVGFibGU8VD4sXG4gICAgICBAT3B0aW9uYWwoKSBASW5qZWN0KFRFWFRfQ09MVU1OX09QVElPTlMpIHByaXZhdGUgX29wdGlvbnM6IFRleHRDb2x1bW5PcHRpb25zPFQ+KSB7XG4gICAgdGhpcy5fb3B0aW9ucyA9IF9vcHRpb25zIHx8IHt9O1xuICB9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgdGhpcy5fc3luY0NvbHVtbkRlZk5hbWUoKTtcblxuICAgIGlmICh0aGlzLmhlYWRlclRleHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5oZWFkZXJUZXh0ID0gdGhpcy5fY3JlYXRlRGVmYXVsdEhlYWRlclRleHQoKTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuZGF0YUFjY2Vzc29yKSB7XG4gICAgICB0aGlzLmRhdGFBY2Nlc3NvciA9XG4gICAgICAgICAgdGhpcy5fb3B0aW9ucy5kZWZhdWx0RGF0YUFjY2Vzc29yIHx8ICgoZGF0YTogVCwgbmFtZTogc3RyaW5nKSA9PiAoZGF0YSBhcyBhbnkpW25hbWVdKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fdGFibGUpIHtcbiAgICAgIC8vIFByb3ZpZGUgdGhlIGNlbGwgYW5kIGhlYWRlckNlbGwgZGlyZWN0bHkgdG8gdGhlIHRhYmxlIHdpdGggdGhlIHN0YXRpYyBgVmlld0NoaWxkYCBxdWVyeSxcbiAgICAgIC8vIHNpbmNlIHRoZSBjb2x1bW5EZWYgd2lsbCBub3QgcGljayB1cCBpdHMgY29udGVudCBieSB0aGUgdGltZSB0aGUgdGFibGUgZmluaXNoZXMgY2hlY2tpbmdcbiAgICAgIC8vIGl0cyBjb250ZW50IGFuZCBpbml0aWFsaXppbmcgdGhlIHJvd3MuXG4gICAgICB0aGlzLmNvbHVtbkRlZi5jZWxsID0gdGhpcy5jZWxsO1xuICAgICAgdGhpcy5jb2x1bW5EZWYuaGVhZGVyQ2VsbCA9IHRoaXMuaGVhZGVyQ2VsbDtcbiAgICAgIHRoaXMuX3RhYmxlLmFkZENvbHVtbkRlZih0aGlzLmNvbHVtbkRlZik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGdldFRhYmxlVGV4dENvbHVtbk1pc3NpbmdQYXJlbnRUYWJsZUVycm9yKCk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuX3RhYmxlKSB7XG4gICAgICB0aGlzLl90YWJsZS5yZW1vdmVDb2x1bW5EZWYodGhpcy5jb2x1bW5EZWYpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZGVmYXVsdCBoZWFkZXIgdGV4dC4gVXNlIHRoZSBvcHRpb25zJyBoZWFkZXIgdGV4dCB0cmFuc2Zvcm1hdGlvbiBmdW5jdGlvbiBpZiBvbmVcbiAgICogaGFzIGJlZW4gcHJvdmlkZWQuIE90aGVyd2lzZSBzaW1wbHkgY2FwaXRhbGl6ZSB0aGUgY29sdW1uIG5hbWUuXG4gICAqL1xuICBfY3JlYXRlRGVmYXVsdEhlYWRlclRleHQoKSB7XG4gICAgY29uc3QgbmFtZSA9IHRoaXMubmFtZTtcblxuICAgIGlmIChpc0Rldk1vZGUoKSAmJiAhbmFtZSkge1xuICAgICAgdGhyb3cgZ2V0VGFibGVUZXh0Q29sdW1uTWlzc2luZ05hbWVFcnJvcigpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9vcHRpb25zICYmIHRoaXMuX29wdGlvbnMuZGVmYXVsdEhlYWRlclRleHRUcmFuc2Zvcm0pIHtcbiAgICAgIHJldHVybiB0aGlzLl9vcHRpb25zLmRlZmF1bHRIZWFkZXJUZXh0VHJhbnNmb3JtKG5hbWUpO1xuICAgIH1cblxuICAgIHJldHVybiBuYW1lWzBdLnRvVXBwZXJDYXNlKCkgKyBuYW1lLnNsaWNlKDEpO1xuICB9XG5cbiAgLyoqIFN5bmNocm9uaXplcyB0aGUgY29sdW1uIGRlZmluaXRpb24gbmFtZSB3aXRoIHRoZSB0ZXh0IGNvbHVtbiBuYW1lLiAqL1xuICBwcml2YXRlIF9zeW5jQ29sdW1uRGVmTmFtZSgpIHtcbiAgICBpZiAodGhpcy5jb2x1bW5EZWYpIHtcbiAgICAgIHRoaXMuY29sdW1uRGVmLm5hbWUgPSB0aGlzLm5hbWU7XG4gICAgfVxuICB9XG59XG4iXX0=