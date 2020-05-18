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
import { ChangeDetectionStrategy, Component, Inject, Input, Optional, ViewChild, ViewEncapsulation, isDevMode, } from '@angular/core';
import { CdkCellDef, CdkColumnDef, CdkHeaderCellDef } from './cell';
import { CdkTable } from './table';
import { getTableTextColumnMissingParentTableError, getTableTextColumnMissingNameError, } from './table-errors';
import { TEXT_COLUMN_OPTIONS } from './tokens';
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
let CdkTextColumn = /** @class */ (() => {
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
    class CdkTextColumn {
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
    return CdkTextColumn;
})();
export { CdkTextColumn };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dC1jb2x1bW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RhYmxlL3RleHQtY29sdW1uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFDTCx1QkFBdUIsRUFDdkIsU0FBUyxFQUNULE1BQU0sRUFDTixLQUFLLEVBR0wsUUFBUSxFQUNSLFNBQVMsRUFDVCxpQkFBaUIsRUFDakIsU0FBUyxHQUNWLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxVQUFVLEVBQUUsWUFBWSxFQUFFLGdCQUFnQixFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQ2xFLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDakMsT0FBTyxFQUNMLHlDQUF5QyxFQUN6QyxrQ0FBa0MsR0FDbkMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN4QixPQUFPLEVBQUMsbUJBQW1CLEVBQW9CLE1BQU0sVUFBVSxDQUFDOzs7Ozs7Ozs7OztBQVloRTs7Ozs7Ozs7Ozs7SUFBQSxNQXFCYSxhQUFhOzs7OztRQXFEeEIsWUFDd0IsTUFBbUIsRUFDVSxRQUE4QjtZQUQzRCxXQUFNLEdBQU4sTUFBTSxDQUFhO1lBQ1UsYUFBUSxHQUFSLFFBQVEsQ0FBc0I7Ozs7WUF6QjFFLFlBQU8sR0FBa0IsT0FBTyxDQUFDO1lBMEJ4QyxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsSUFBSSxFQUFFLENBQUM7UUFDakMsQ0FBQzs7Ozs7UUF2REQsSUFDSSxJQUFJO1lBQ04sT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ3BCLENBQUM7Ozs7O1FBQ0QsSUFBSSxJQUFJLENBQUMsSUFBWTtZQUNuQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztZQUVsQixzRUFBc0U7WUFDdEUsZ0ZBQWdGO1lBQ2hGLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQzVCLENBQUM7Ozs7UUErQ0QsUUFBUTtZQUNOLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1lBRTFCLElBQUksSUFBSSxDQUFDLFVBQVUsS0FBSyxTQUFTLEVBQUU7Z0JBQ2pDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7YUFDbkQ7WUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRTtnQkFDdEIsSUFBSSxDQUFDLFlBQVk7b0JBQ2IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsSUFBSTs7Ozs7b0JBQUMsQ0FBQyxJQUFPLEVBQUUsSUFBWSxFQUFFLEVBQUUsQ0FBQyxDQUFDLG1CQUFBLElBQUksRUFBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQzthQUMzRjtZQUVELElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtnQkFDZiwyRkFBMkY7Z0JBQzNGLDJGQUEyRjtnQkFDM0YseUNBQXlDO2dCQUN6QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO2dCQUNoQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO2dCQUM1QyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7YUFDMUM7aUJBQU07Z0JBQ0wsTUFBTSx5Q0FBeUMsRUFBRSxDQUFDO2FBQ25EO1FBQ0gsQ0FBQzs7OztRQUVELFdBQVc7WUFDVCxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7Z0JBQ2YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQzdDO1FBQ0gsQ0FBQzs7Ozs7O1FBTUQsd0JBQXdCOztrQkFDaEIsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJO1lBRXRCLElBQUksU0FBUyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUU7Z0JBQ3hCLE1BQU0sa0NBQWtDLEVBQUUsQ0FBQzthQUM1QztZQUVELElBQUksSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLDBCQUEwQixFQUFFO2dCQUM3RCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDdkQ7WUFFRCxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9DLENBQUM7Ozs7OztRQUdPLGtCQUFrQjtZQUN4QixJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7Z0JBQ2xCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7YUFDakM7UUFDSCxDQUFDOzs7Z0JBcklGLFNBQVMsU0FBQztvQkFDVCxRQUFRLEVBQUUsaUJBQWlCO29CQUMzQixRQUFRLEVBQUU7Ozs7Ozs7OztHQVNUO29CQUNELGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJOzs7Ozs7O29CQU9yQyxlQUFlLEVBQUUsdUJBQXVCLENBQUMsT0FBTztpQkFDakQ7Ozs7Z0JBckNPLFFBQVEsdUJBNEZULFFBQVE7Z0RBQ1IsUUFBUSxZQUFJLE1BQU0sU0FBQyxtQkFBbUI7Ozt1QkFyRDFDLEtBQUs7NkJBaUJMLEtBQUs7K0JBUUwsS0FBSzswQkFHTCxLQUFLOzRCQUdMLFNBQVMsU0FBQyxZQUFZLEVBQUUsRUFBQyxNQUFNLEVBQUUsSUFBSSxFQUFDO3VCQVN0QyxTQUFTLFNBQUMsVUFBVSxFQUFFLEVBQUMsTUFBTSxFQUFFLElBQUksRUFBQzs2QkFTcEMsU0FBUyxTQUFDLGdCQUFnQixFQUFFLEVBQUMsTUFBTSxFQUFFLElBQUksRUFBQzs7SUE4RDdDLG9CQUFDO0tBQUE7U0FqSFksYUFBYTs7O0lBYXhCLDhCQUFjOzs7Ozs7SUFNZCxtQ0FBNEI7Ozs7Ozs7O0lBUTVCLHFDQUF5RDs7Ozs7SUFHekQsZ0NBQTBDOzs7OztJQUcxQyxrQ0FBaUU7Ozs7Ozs7OztJQVNqRSw2QkFBd0Q7Ozs7Ozs7OztJQVN4RCxtQ0FBMEU7Ozs7O0lBR3RFLCtCQUF1Qzs7Ozs7SUFDdkMsaUNBQStFIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDb21wb25lbnQsXG4gIEluamVjdCxcbiAgSW5wdXQsXG4gIE9uRGVzdHJveSxcbiAgT25Jbml0LFxuICBPcHRpb25hbCxcbiAgVmlld0NoaWxkLFxuICBWaWV3RW5jYXBzdWxhdGlvbixcbiAgaXNEZXZNb2RlLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Q2RrQ2VsbERlZiwgQ2RrQ29sdW1uRGVmLCBDZGtIZWFkZXJDZWxsRGVmfSBmcm9tICcuL2NlbGwnO1xuaW1wb3J0IHtDZGtUYWJsZX0gZnJvbSAnLi90YWJsZSc7XG5pbXBvcnQge1xuICBnZXRUYWJsZVRleHRDb2x1bW5NaXNzaW5nUGFyZW50VGFibGVFcnJvcixcbiAgZ2V0VGFibGVUZXh0Q29sdW1uTWlzc2luZ05hbWVFcnJvcixcbn0gZnJvbSAnLi90YWJsZS1lcnJvcnMnO1xuaW1wb3J0IHtURVhUX0NPTFVNTl9PUFRJT05TLCBUZXh0Q29sdW1uT3B0aW9uc30gZnJvbSAnLi90b2tlbnMnO1xuXG5cbi8qKlxuICogQ29sdW1uIHRoYXQgc2ltcGx5IHNob3dzIHRleHQgY29udGVudCBmb3IgdGhlIGhlYWRlciBhbmQgcm93IGNlbGxzLiBBc3N1bWVzIHRoYXQgdGhlIHRhYmxlXG4gKiBpcyB1c2luZyB0aGUgbmF0aXZlIHRhYmxlIGltcGxlbWVudGF0aW9uIChgPHRhYmxlPmApLlxuICpcbiAqIEJ5IGRlZmF1bHQsIHRoZSBuYW1lIG9mIHRoaXMgY29sdW1uIHdpbGwgYmUgdGhlIGhlYWRlciB0ZXh0IGFuZCBkYXRhIHByb3BlcnR5IGFjY2Vzc29yLlxuICogVGhlIGhlYWRlciB0ZXh0IGNhbiBiZSBvdmVycmlkZGVuIHdpdGggdGhlIGBoZWFkZXJUZXh0YCBpbnB1dC4gQ2VsbCB2YWx1ZXMgY2FuIGJlIG92ZXJyaWRkZW4gd2l0aFxuICogdGhlIGBkYXRhQWNjZXNzb3JgIGlucHV0LiBDaGFuZ2UgdGhlIHRleHQganVzdGlmaWNhdGlvbiB0byB0aGUgc3RhcnQgb3IgZW5kIHVzaW5nIHRoZSBganVzdGlmeWBcbiAqIGlucHV0LlxuICovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdjZGstdGV4dC1jb2x1bW4nLFxuICB0ZW1wbGF0ZTogYFxuICAgIDxuZy1jb250YWluZXIgY2RrQ29sdW1uRGVmPlxuICAgICAgPHRoIGNkay1oZWFkZXItY2VsbCAqY2RrSGVhZGVyQ2VsbERlZiBbc3R5bGUudGV4dC1hbGlnbl09XCJqdXN0aWZ5XCI+XG4gICAgICAgIHt7aGVhZGVyVGV4dH19XG4gICAgICA8L3RoPlxuICAgICAgPHRkIGNkay1jZWxsICpjZGtDZWxsRGVmPVwibGV0IGRhdGFcIiBbc3R5bGUudGV4dC1hbGlnbl09XCJqdXN0aWZ5XCI+XG4gICAgICAgIHt7ZGF0YUFjY2Vzc29yKGRhdGEsIG5hbWUpfX1cbiAgICAgIDwvdGQ+XG4gICAgPC9uZy1jb250YWluZXI+XG4gIGAsXG4gIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsXG4gIC8vIENoYW5nZSBkZXRlY3Rpb24gaXMgaW50ZW50aW9uYWxseSBub3Qgc2V0IHRvIE9uUHVzaC4gVGhpcyBjb21wb25lbnQncyB0ZW1wbGF0ZSB3aWxsIGJlIHByb3ZpZGVkXG4gIC8vIHRvIHRoZSB0YWJsZSB0byBiZSBpbnNlcnRlZCBpbnRvIGl0cyB2aWV3LiBUaGlzIGlzIHByb2JsZW1hdGljIHdoZW4gY2hhbmdlIGRldGVjdGlvbiBydW5zIHNpbmNlXG4gIC8vIHRoZSBiaW5kaW5ncyBpbiB0aGlzIHRlbXBsYXRlIHdpbGwgYmUgZXZhbHVhdGVkIF9hZnRlcl8gdGhlIHRhYmxlJ3MgdmlldyBpcyBldmFsdWF0ZWQsIHdoaWNoXG4gIC8vIG1lYW4ncyB0aGUgdGVtcGxhdGUgaW4gdGhlIHRhYmxlJ3MgdmlldyB3aWxsIG5vdCBoYXZlIHRoZSB1cGRhdGVkIHZhbHVlIChhbmQgaW4gZmFjdCB3aWxsIGNhdXNlXG4gIC8vIGFuIEV4cHJlc3Npb25DaGFuZ2VkQWZ0ZXJJdEhhc0JlZW5DaGVja2VkRXJyb3IpLlxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6dmFsaWRhdGUtZGVjb3JhdG9yc1xuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5LkRlZmF1bHQsXG59KVxuZXhwb3J0IGNsYXNzIENka1RleHRDb2x1bW48VD4gaW1wbGVtZW50cyBPbkRlc3Ryb3ksIE9uSW5pdCB7XG4gIC8qKiBDb2x1bW4gbmFtZSB0aGF0IHNob3VsZCBiZSB1c2VkIHRvIHJlZmVyZW5jZSB0aGlzIGNvbHVtbi4gKi9cbiAgQElucHV0KClcbiAgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fbmFtZTtcbiAgfVxuICBzZXQgbmFtZShuYW1lOiBzdHJpbmcpIHtcbiAgICB0aGlzLl9uYW1lID0gbmFtZTtcblxuICAgIC8vIFdpdGggSXZ5LCBpbnB1dHMgY2FuIGJlIGluaXRpYWxpemVkIGJlZm9yZSBzdGF0aWMgcXVlcnkgcmVzdWx0cyBhcmVcbiAgICAvLyBhdmFpbGFibGUuIEluIHRoYXQgY2FzZSwgd2UgZGVmZXIgdGhlIHN5bmNocm9uaXphdGlvbiB1bnRpbCBcIm5nT25Jbml0XCIgZmlyZXMuXG4gICAgdGhpcy5fc3luY0NvbHVtbkRlZk5hbWUoKTtcbiAgfVxuICBfbmFtZTogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUZXh0IGxhYmVsIHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIHRoZSBjb2x1bW4gaGVhZGVyLiBJZiB0aGlzIHByb3BlcnR5IGlzIG5vdFxuICAgKiBzZXQsIHRoZSBoZWFkZXIgdGV4dCB3aWxsIGRlZmF1bHQgdG8gdGhlIGNvbHVtbiBuYW1lIHdpdGggaXRzIGZpcnN0IGxldHRlciBjYXBpdGFsaXplZC5cbiAgICovXG4gIEBJbnB1dCgpIGhlYWRlclRleHQ6IHN0cmluZztcblxuICAvKipcbiAgICogQWNjZXNzb3IgZnVuY3Rpb24gdG8gcmV0cmlldmUgdGhlIGRhdGEgcmVuZGVyZWQgZm9yIGVhY2ggY2VsbC4gSWYgdGhpc1xuICAgKiBwcm9wZXJ0eSBpcyBub3Qgc2V0LCB0aGUgZGF0YSBjZWxscyB3aWxsIHJlbmRlciB0aGUgdmFsdWUgZm91bmQgaW4gdGhlIGRhdGEncyBwcm9wZXJ0eSBtYXRjaGluZ1xuICAgKiB0aGUgY29sdW1uJ3MgbmFtZS4gRm9yIGV4YW1wbGUsIGlmIHRoZSBjb2x1bW4gaXMgbmFtZWQgYGlkYCwgdGhlbiB0aGUgcmVuZGVyZWQgdmFsdWUgd2lsbCBiZVxuICAgKiB2YWx1ZSBkZWZpbmVkIGJ5IHRoZSBkYXRhJ3MgYGlkYCBwcm9wZXJ0eS5cbiAgICovXG4gIEBJbnB1dCgpIGRhdGFBY2Nlc3NvcjogKGRhdGE6IFQsIG5hbWU6IHN0cmluZykgPT4gc3RyaW5nO1xuXG4gIC8qKiBBbGlnbm1lbnQgb2YgdGhlIGNlbGwgdmFsdWVzLiAqL1xuICBASW5wdXQoKSBqdXN0aWZ5OiAnc3RhcnQnfCdlbmQnID0gJ3N0YXJ0JztcblxuICAvKiogQGRvY3MtcHJpdmF0ZSAqL1xuICBAVmlld0NoaWxkKENka0NvbHVtbkRlZiwge3N0YXRpYzogdHJ1ZX0pIGNvbHVtbkRlZjogQ2RrQ29sdW1uRGVmO1xuXG4gIC8qKlxuICAgKiBUaGUgY29sdW1uIGNlbGwgaXMgcHJvdmlkZWQgdG8gdGhlIGNvbHVtbiBkdXJpbmcgYG5nT25Jbml0YCB3aXRoIGEgc3RhdGljIHF1ZXJ5LlxuICAgKiBOb3JtYWxseSwgdGhpcyB3aWxsIGJlIHJldHJpZXZlZCBieSB0aGUgY29sdW1uIHVzaW5nIGBDb250ZW50Q2hpbGRgLCBidXQgdGhhdCBhc3N1bWVzIHRoZVxuICAgKiBjb2x1bW4gZGVmaW5pdGlvbiB3YXMgcHJvdmlkZWQgaW4gdGhlIHNhbWUgdmlldyBhcyB0aGUgdGFibGUsIHdoaWNoIGlzIG5vdCB0aGUgY2FzZSB3aXRoIHRoaXNcbiAgICogY29tcG9uZW50LlxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICBAVmlld0NoaWxkKENka0NlbGxEZWYsIHtzdGF0aWM6IHRydWV9KSBjZWxsOiBDZGtDZWxsRGVmO1xuXG4gIC8qKlxuICAgKiBUaGUgY29sdW1uIGhlYWRlckNlbGwgaXMgcHJvdmlkZWQgdG8gdGhlIGNvbHVtbiBkdXJpbmcgYG5nT25Jbml0YCB3aXRoIGEgc3RhdGljIHF1ZXJ5LlxuICAgKiBOb3JtYWxseSwgdGhpcyB3aWxsIGJlIHJldHJpZXZlZCBieSB0aGUgY29sdW1uIHVzaW5nIGBDb250ZW50Q2hpbGRgLCBidXQgdGhhdCBhc3N1bWVzIHRoZVxuICAgKiBjb2x1bW4gZGVmaW5pdGlvbiB3YXMgcHJvdmlkZWQgaW4gdGhlIHNhbWUgdmlldyBhcyB0aGUgdGFibGUsIHdoaWNoIGlzIG5vdCB0aGUgY2FzZSB3aXRoIHRoaXNcbiAgICogY29tcG9uZW50LlxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICBAVmlld0NoaWxkKENka0hlYWRlckNlbGxEZWYsIHtzdGF0aWM6IHRydWV9KSBoZWFkZXJDZWxsOiBDZGtIZWFkZXJDZWxsRGVmO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgQE9wdGlvbmFsKCkgcHJpdmF0ZSBfdGFibGU6IENka1RhYmxlPFQ+LFxuICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChURVhUX0NPTFVNTl9PUFRJT05TKSBwcml2YXRlIF9vcHRpb25zOiBUZXh0Q29sdW1uT3B0aW9uczxUPikge1xuICAgIHRoaXMuX29wdGlvbnMgPSBfb3B0aW9ucyB8fCB7fTtcbiAgfVxuXG4gIG5nT25Jbml0KCkge1xuICAgIHRoaXMuX3N5bmNDb2x1bW5EZWZOYW1lKCk7XG5cbiAgICBpZiAodGhpcy5oZWFkZXJUZXh0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuaGVhZGVyVGV4dCA9IHRoaXMuX2NyZWF0ZURlZmF1bHRIZWFkZXJUZXh0KCk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmRhdGFBY2Nlc3Nvcikge1xuICAgICAgdGhpcy5kYXRhQWNjZXNzb3IgPVxuICAgICAgICAgIHRoaXMuX29wdGlvbnMuZGVmYXVsdERhdGFBY2Nlc3NvciB8fCAoKGRhdGE6IFQsIG5hbWU6IHN0cmluZykgPT4gKGRhdGEgYXMgYW55KVtuYW1lXSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3RhYmxlKSB7XG4gICAgICAvLyBQcm92aWRlIHRoZSBjZWxsIGFuZCBoZWFkZXJDZWxsIGRpcmVjdGx5IHRvIHRoZSB0YWJsZSB3aXRoIHRoZSBzdGF0aWMgYFZpZXdDaGlsZGAgcXVlcnksXG4gICAgICAvLyBzaW5jZSB0aGUgY29sdW1uRGVmIHdpbGwgbm90IHBpY2sgdXAgaXRzIGNvbnRlbnQgYnkgdGhlIHRpbWUgdGhlIHRhYmxlIGZpbmlzaGVzIGNoZWNraW5nXG4gICAgICAvLyBpdHMgY29udGVudCBhbmQgaW5pdGlhbGl6aW5nIHRoZSByb3dzLlxuICAgICAgdGhpcy5jb2x1bW5EZWYuY2VsbCA9IHRoaXMuY2VsbDtcbiAgICAgIHRoaXMuY29sdW1uRGVmLmhlYWRlckNlbGwgPSB0aGlzLmhlYWRlckNlbGw7XG4gICAgICB0aGlzLl90YWJsZS5hZGRDb2x1bW5EZWYodGhpcy5jb2x1bW5EZWYpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBnZXRUYWJsZVRleHRDb2x1bW5NaXNzaW5nUGFyZW50VGFibGVFcnJvcigpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIGlmICh0aGlzLl90YWJsZSkge1xuICAgICAgdGhpcy5fdGFibGUucmVtb3ZlQ29sdW1uRGVmKHRoaXMuY29sdW1uRGVmKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGRlZmF1bHQgaGVhZGVyIHRleHQuIFVzZSB0aGUgb3B0aW9ucycgaGVhZGVyIHRleHQgdHJhbnNmb3JtYXRpb24gZnVuY3Rpb24gaWYgb25lXG4gICAqIGhhcyBiZWVuIHByb3ZpZGVkLiBPdGhlcndpc2Ugc2ltcGx5IGNhcGl0YWxpemUgdGhlIGNvbHVtbiBuYW1lLlxuICAgKi9cbiAgX2NyZWF0ZURlZmF1bHRIZWFkZXJUZXh0KCkge1xuICAgIGNvbnN0IG5hbWUgPSB0aGlzLm5hbWU7XG5cbiAgICBpZiAoaXNEZXZNb2RlKCkgJiYgIW5hbWUpIHtcbiAgICAgIHRocm93IGdldFRhYmxlVGV4dENvbHVtbk1pc3NpbmdOYW1lRXJyb3IoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fb3B0aW9ucyAmJiB0aGlzLl9vcHRpb25zLmRlZmF1bHRIZWFkZXJUZXh0VHJhbnNmb3JtKSB7XG4gICAgICByZXR1cm4gdGhpcy5fb3B0aW9ucy5kZWZhdWx0SGVhZGVyVGV4dFRyYW5zZm9ybShuYW1lKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmFtZVswXS50b1VwcGVyQ2FzZSgpICsgbmFtZS5zbGljZSgxKTtcbiAgfVxuXG4gIC8qKiBTeW5jaHJvbml6ZXMgdGhlIGNvbHVtbiBkZWZpbml0aW9uIG5hbWUgd2l0aCB0aGUgdGV4dCBjb2x1bW4gbmFtZS4gKi9cbiAgcHJpdmF0ZSBfc3luY0NvbHVtbkRlZk5hbWUoKSB7XG4gICAgaWYgKHRoaXMuY29sdW1uRGVmKSB7XG4gICAgICB0aGlzLmNvbHVtbkRlZi5uYW1lID0gdGhpcy5uYW1lO1xuICAgIH1cbiAgfVxufVxuIl19