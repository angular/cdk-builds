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
                moduleId: module.id,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dC1jb2x1bW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RhYmxlL3RleHQtY29sdW1uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUNMLHVCQUF1QixFQUN2QixTQUFTLEVBQ1QsTUFBTSxFQUNOLGNBQWMsRUFDZCxLQUFLLEVBR0wsUUFBUSxFQUNSLFNBQVMsRUFDVCxpQkFBaUIsRUFDakIsU0FBUyxHQUNWLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxVQUFVLEVBQUUsWUFBWSxFQUFFLGdCQUFnQixFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQ2xFLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDakMsT0FBTyxFQUNMLHlDQUF5QyxFQUN6QyxrQ0FBa0MsR0FDbkMsTUFBTSxnQkFBZ0IsQ0FBQzs7Ozs7O0FBSXhCLHVDQVNDOzs7Ozs7O0lBSkMsdURBQXNEOzs7OztJQUd0RCxnREFBd0Q7Ozs7OztBQUkxRCxNQUFNLE9BQU8sbUJBQW1CLEdBQzVCLElBQUksY0FBYyxDQUF5QixxQkFBcUIsQ0FBQzs7Ozs7Ozs7Ozs7QUFpQ3JFLE1BQU0sT0FBTyxhQUFhOzs7OztJQXFEeEIsWUFDd0IsTUFBbUIsRUFDVSxRQUE4QjtRQUQzRCxXQUFNLEdBQU4sTUFBTSxDQUFhO1FBQ1UsYUFBUSxHQUFSLFFBQVEsQ0FBc0I7Ozs7UUF6QjFFLFlBQU8sR0FBa0IsT0FBTyxDQUFDO1FBMEJ4QyxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsSUFBSSxFQUFFLENBQUM7SUFDakMsQ0FBQzs7Ozs7SUF2REQsSUFDSSxJQUFJO1FBQ04sT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3BCLENBQUM7Ozs7O0lBQ0QsSUFBSSxJQUFJLENBQUMsSUFBWTtRQUNuQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUVsQixzRUFBc0U7UUFD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MUMsa0NBQWlFOzs7Ozs7Ozs7SUFTakUsNkJBQXdEOzs7Ozs7Ozs7SUFTeEQsbUNBQTBFOzs7OztJQUd0RSwrQkFBdUM7Ozs7O0lBQ3ZDLGlDQUErRSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgQ29tcG9uZW50LFxuICBJbmplY3QsXG4gIEluamVjdGlvblRva2VuLFxuICBJbnB1dCxcbiAgT25EZXN0cm95LFxuICBPbkluaXQsXG4gIE9wdGlvbmFsLFxuICBWaWV3Q2hpbGQsXG4gIFZpZXdFbmNhcHN1bGF0aW9uLFxuICBpc0Rldk1vZGUsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtDZGtDZWxsRGVmLCBDZGtDb2x1bW5EZWYsIENka0hlYWRlckNlbGxEZWZ9IGZyb20gJy4vY2VsbCc7XG5pbXBvcnQge0Nka1RhYmxlfSBmcm9tICcuL3RhYmxlJztcbmltcG9ydCB7XG4gIGdldFRhYmxlVGV4dENvbHVtbk1pc3NpbmdQYXJlbnRUYWJsZUVycm9yLFxuICBnZXRUYWJsZVRleHRDb2x1bW5NaXNzaW5nTmFtZUVycm9yLFxufSBmcm9tICcuL3RhYmxlLWVycm9ycyc7XG5cblxuLyoqIENvbmZpZ3VyYWJsZSBvcHRpb25zIGZvciBgQ2RrVGV4dENvbHVtbmAuICovXG5leHBvcnQgaW50ZXJmYWNlIFRleHRDb2x1bW5PcHRpb25zPFQ+IHtcbiAgLyoqXG4gICAqIERlZmF1bHQgZnVuY3Rpb24gdGhhdCBwcm92aWRlcyB0aGUgaGVhZGVyIHRleHQgYmFzZWQgb24gdGhlIGNvbHVtbiBuYW1lIGlmIGEgaGVhZGVyXG4gICAqIHRleHQgaXMgbm90IHByb3ZpZGVkLlxuICAgKi9cbiAgZGVmYXVsdEhlYWRlclRleHRUcmFuc2Zvcm0/OiAobmFtZTogc3RyaW5nKSA9PiBzdHJpbmc7XG5cbiAgLyoqIERlZmF1bHQgZGF0YSBhY2Nlc3NvciB0byB1c2UgaWYgb25lIGlzIG5vdCBwcm92aWRlZC4gKi9cbiAgZGVmYXVsdERhdGFBY2Nlc3Nvcj86IChkYXRhOiBULCBuYW1lOiBzdHJpbmcpID0+IHN0cmluZztcbn1cblxuLyoqIEluamVjdGlvbiB0b2tlbiB0aGF0IGNhbiBiZSB1c2VkIHRvIHNwZWNpZnkgdGhlIHRleHQgY29sdW1uIG9wdGlvbnMuICovXG5leHBvcnQgY29uc3QgVEVYVF9DT0xVTU5fT1BUSU9OUyA9XG4gICAgbmV3IEluamVjdGlvblRva2VuPFRleHRDb2x1bW5PcHRpb25zPGFueT4+KCd0ZXh0LWNvbHVtbi1vcHRpb25zJyk7XG5cbi8qKlxuICogQ29sdW1uIHRoYXQgc2ltcGx5IHNob3dzIHRleHQgY29udGVudCBmb3IgdGhlIGhlYWRlciBhbmQgcm93IGNlbGxzLiBBc3N1bWVzIHRoYXQgdGhlIHRhYmxlXG4gKiBpcyB1c2luZyB0aGUgbmF0aXZlIHRhYmxlIGltcGxlbWVudGF0aW9uIChgPHRhYmxlPmApLlxuICpcbiAqIEJ5IGRlZmF1bHQsIHRoZSBuYW1lIG9mIHRoaXMgY29sdW1uIHdpbGwgYmUgdGhlIGhlYWRlciB0ZXh0IGFuZCBkYXRhIHByb3BlcnR5IGFjY2Vzc29yLlxuICogVGhlIGhlYWRlciB0ZXh0IGNhbiBiZSBvdmVycmlkZGVuIHdpdGggdGhlIGBoZWFkZXJUZXh0YCBpbnB1dC4gQ2VsbCB2YWx1ZXMgY2FuIGJlIG92ZXJyaWRkZW4gd2l0aFxuICogdGhlIGBkYXRhQWNjZXNzb3JgIGlucHV0LiBDaGFuZ2UgdGhlIHRleHQganVzdGlmaWNhdGlvbiB0byB0aGUgc3RhcnQgb3IgZW5kIHVzaW5nIHRoZSBganVzdGlmeWBcbiAqIGlucHV0LlxuICovXG5AQ29tcG9uZW50KHtcbiAgbW9kdWxlSWQ6IG1vZHVsZS5pZCxcbiAgc2VsZWN0b3I6ICdjZGstdGV4dC1jb2x1bW4nLFxuICB0ZW1wbGF0ZTogYFxuICAgIDxuZy1jb250YWluZXIgY2RrQ29sdW1uRGVmPlxuICAgICAgPHRoIGNkay1oZWFkZXItY2VsbCAqY2RrSGVhZGVyQ2VsbERlZiBbc3R5bGUudGV4dC1hbGlnbl09XCJqdXN0aWZ5XCI+XG4gICAgICAgIHt7aGVhZGVyVGV4dH19XG4gICAgICA8L3RoPlxuICAgICAgPHRkIGNkay1jZWxsICpjZGtDZWxsRGVmPVwibGV0IGRhdGFcIiBbc3R5bGUudGV4dC1hbGlnbl09XCJqdXN0aWZ5XCI+XG4gICAgICAgIHt7ZGF0YUFjY2Vzc29yKGRhdGEsIG5hbWUpfX1cbiAgICAgIDwvdGQ+XG4gICAgPC9uZy1jb250YWluZXI+XG4gIGAsXG4gIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsXG4gIC8vIENoYW5nZSBkZXRlY3Rpb24gaXMgaW50ZW50aW9uYWxseSBub3Qgc2V0IHRvIE9uUHVzaC4gVGhpcyBjb21wb25lbnQncyB0ZW1wbGF0ZSB3aWxsIGJlIHByb3ZpZGVkXG4gIC8vIHRvIHRoZSB0YWJsZSB0byBiZSBpbnNlcnRlZCBpbnRvIGl0cyB2aWV3LiBUaGlzIGlzIHByb2JsZW1hdGljIHdoZW4gY2hhbmdlIGRldGVjdGlvbiBydW5zIHNpbmNlXG4gIC8vIHRoZSBiaW5kaW5ncyBpbiB0aGlzIHRlbXBsYXRlIHdpbGwgYmUgZXZhbHVhdGVkIF9hZnRlcl8gdGhlIHRhYmxlJ3MgdmlldyBpcyBldmFsdWF0ZWQsIHdoaWNoXG4gIC8vIG1lYW4ncyB0aGUgdGVtcGxhdGUgaW4gdGhlIHRhYmxlJ3MgdmlldyB3aWxsIG5vdCBoYXZlIHRoZSB1cGRhdGVkIHZhbHVlIChhbmQgaW4gZmFjdCB3aWxsIGNhdXNlXG4gIC8vIGFuIEV4cHJlc3Npb25DaGFuZ2VkQWZ0ZXJJdEhhc0JlZW5DaGVja2VkRXJyb3IpLlxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6dmFsaWRhdGUtZGVjb3JhdG9yc1xuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5LkRlZmF1bHQsXG59KVxuZXhwb3J0IGNsYXNzIENka1RleHRDb2x1bW48VD4gaW1wbGVtZW50cyBPbkRlc3Ryb3ksIE9uSW5pdCB7XG4gIC8qKiBDb2x1bW4gbmFtZSB0aGF0IHNob3VsZCBiZSB1c2VkIHRvIHJlZmVyZW5jZSB0aGlzIGNvbHVtbi4gKi9cbiAgQElucHV0KClcbiAgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fbmFtZTtcbiAgfVxuICBzZXQgbmFtZShuYW1lOiBzdHJpbmcpIHtcbiAgICB0aGlzLl9uYW1lID0gbmFtZTtcblxuICAgIC8vIFdpdGggSXZ5LCBpbnB1dHMgY2FuIGJlIGluaXRpYWxpemVkIGJlZm9yZSBzdGF0aWMgcXVlcnkgcmVzdWx0cyBhcmVcbiAgICAvLyBhdmFpbGFibGUuIEluIHRoYXQgY2FzZSwgd2UgZGVmZXIgdGhlIHN5bmNocm9uaXphdGlvbiB1bnRpbCBcIm5nT25Jbml0XCIgZmlyZXMuXG4gICAgdGhpcy5fc3luY0NvbHVtbkRlZk5hbWUoKTtcbiAgfVxuICBfbmFtZTogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUZXh0IGxhYmVsIHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIHRoZSBjb2x1bW4gaGVhZGVyLiBJZiB0aGlzIHByb3BlcnR5IGlzIG5vdFxuICAgKiBzZXQsIHRoZSBoZWFkZXIgdGV4dCB3aWxsIGRlZmF1bHQgdG8gdGhlIGNvbHVtbiBuYW1lIHdpdGggaXRzIGZpcnN0IGxldHRlciBjYXBpdGFsaXplZC5cbiAgICovXG4gIEBJbnB1dCgpIGhlYWRlclRleHQ6IHN0cmluZztcblxuICAvKipcbiAgICogQWNjZXNzb3IgZnVuY3Rpb24gdG8gcmV0cmlldmUgdGhlIGRhdGEgcmVuZGVyZWQgZm9yIGVhY2ggY2VsbC4gSWYgdGhpc1xuICAgKiBwcm9wZXJ0eSBpcyBub3Qgc2V0LCB0aGUgZGF0YSBjZWxscyB3aWxsIHJlbmRlciB0aGUgdmFsdWUgZm91bmQgaW4gdGhlIGRhdGEncyBwcm9wZXJ0eSBtYXRjaGluZ1xuICAgKiB0aGUgY29sdW1uJ3MgbmFtZS4gRm9yIGV4YW1wbGUsIGlmIHRoZSBjb2x1bW4gaXMgbmFtZWQgYGlkYCwgdGhlbiB0aGUgcmVuZGVyZWQgdmFsdWUgd2lsbCBiZVxuICAgKiB2YWx1ZSBkZWZpbmVkIGJ5IHRoZSBkYXRhJ3MgYGlkYCBwcm9wZXJ0eS5cbiAgICovXG4gIEBJbnB1dCgpIGRhdGFBY2Nlc3NvcjogKGRhdGE6IFQsIG5hbWU6IHN0cmluZykgPT4gc3RyaW5nO1xuXG4gIC8qKiBBbGlnbm1lbnQgb2YgdGhlIGNlbGwgdmFsdWVzLiAqL1xuICBASW5wdXQoKSBqdXN0aWZ5OiAnc3RhcnQnfCdlbmQnID0gJ3N0YXJ0JztcblxuICAvKiogQGRvY3MtcHJpdmF0ZSAqL1xuICBAVmlld0NoaWxkKENka0NvbHVtbkRlZiwge3N0YXRpYzogdHJ1ZX0pIGNvbHVtbkRlZjogQ2RrQ29sdW1uRGVmO1xuXG4gIC8qKlxuICAgKiBUaGUgY29sdW1uIGNlbGwgaXMgcHJvdmlkZWQgdG8gdGhlIGNvbHVtbiBkdXJpbmcgYG5nT25Jbml0YCB3aXRoIGEgc3RhdGljIHF1ZXJ5LlxuICAgKiBOb3JtYWxseSwgdGhpcyB3aWxsIGJlIHJldHJpZXZlZCBieSB0aGUgY29sdW1uIHVzaW5nIGBDb250ZW50Q2hpbGRgLCBidXQgdGhhdCBhc3N1bWVzIHRoZVxuICAgKiBjb2x1bW4gZGVmaW5pdGlvbiB3YXMgcHJvdmlkZWQgaW4gdGhlIHNhbWUgdmlldyBhcyB0aGUgdGFibGUsIHdoaWNoIGlzIG5vdCB0aGUgY2FzZSB3aXRoIHRoaXNcbiAgICogY29tcG9uZW50LlxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICBAVmlld0NoaWxkKENka0NlbGxEZWYsIHtzdGF0aWM6IHRydWV9KSBjZWxsOiBDZGtDZWxsRGVmO1xuXG4gIC8qKlxuICAgKiBUaGUgY29sdW1uIGhlYWRlckNlbGwgaXMgcHJvdmlkZWQgdG8gdGhlIGNvbHVtbiBkdXJpbmcgYG5nT25Jbml0YCB3aXRoIGEgc3RhdGljIHF1ZXJ5LlxuICAgKiBOb3JtYWxseSwgdGhpcyB3aWxsIGJlIHJldHJpZXZlZCBieSB0aGUgY29sdW1uIHVzaW5nIGBDb250ZW50Q2hpbGRgLCBidXQgdGhhdCBhc3N1bWVzIHRoZVxuICAgKiBjb2x1bW4gZGVmaW5pdGlvbiB3YXMgcHJvdmlkZWQgaW4gdGhlIHNhbWUgdmlldyBhcyB0aGUgdGFibGUsIHdoaWNoIGlzIG5vdCB0aGUgY2FzZSB3aXRoIHRoaXNcbiAgICogY29tcG9uZW50LlxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICBAVmlld0NoaWxkKENka0hlYWRlckNlbGxEZWYsIHtzdGF0aWM6IHRydWV9KSBoZWFkZXJDZWxsOiBDZGtIZWFkZXJDZWxsRGVmO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgQE9wdGlvbmFsKCkgcHJpdmF0ZSBfdGFibGU6IENka1RhYmxlPFQ+LFxuICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChURVhUX0NPTFVNTl9PUFRJT05TKSBwcml2YXRlIF9vcHRpb25zOiBUZXh0Q29sdW1uT3B0aW9uczxUPikge1xuICAgIHRoaXMuX29wdGlvbnMgPSBfb3B0aW9ucyB8fCB7fTtcbiAgfVxuXG4gIG5nT25Jbml0KCkge1xuICAgIHRoaXMuX3N5bmNDb2x1bW5EZWZOYW1lKCk7XG5cbiAgICBpZiAodGhpcy5oZWFkZXJUZXh0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuaGVhZGVyVGV4dCA9IHRoaXMuX2NyZWF0ZURlZmF1bHRIZWFkZXJUZXh0KCk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmRhdGFBY2Nlc3Nvcikge1xuICAgICAgdGhpcy5kYXRhQWNjZXNzb3IgPVxuICAgICAgICAgIHRoaXMuX29wdGlvbnMuZGVmYXVsdERhdGFBY2Nlc3NvciB8fCAoKGRhdGE6IFQsIG5hbWU6IHN0cmluZykgPT4gKGRhdGEgYXMgYW55KVtuYW1lXSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3RhYmxlKSB7XG4gICAgICAvLyBQcm92aWRlIHRoZSBjZWxsIGFuZCBoZWFkZXJDZWxsIGRpcmVjdGx5IHRvIHRoZSB0YWJsZSB3aXRoIHRoZSBzdGF0aWMgYFZpZXdDaGlsZGAgcXVlcnksXG4gICAgICAvLyBzaW5jZSB0aGUgY29sdW1uRGVmIHdpbGwgbm90IHBpY2sgdXAgaXRzIGNvbnRlbnQgYnkgdGhlIHRpbWUgdGhlIHRhYmxlIGZpbmlzaGVzIGNoZWNraW5nXG4gICAgICAvLyBpdHMgY29udGVudCBhbmQgaW5pdGlhbGl6aW5nIHRoZSByb3dzLlxuICAgICAgdGhpcy5jb2x1bW5EZWYuY2VsbCA9IHRoaXMuY2VsbDtcbiAgICAgIHRoaXMuY29sdW1uRGVmLmhlYWRlckNlbGwgPSB0aGlzLmhlYWRlckNlbGw7XG4gICAgICB0aGlzLl90YWJsZS5hZGRDb2x1bW5EZWYodGhpcy5jb2x1bW5EZWYpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBnZXRUYWJsZVRleHRDb2x1bW5NaXNzaW5nUGFyZW50VGFibGVFcnJvcigpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIGlmICh0aGlzLl90YWJsZSkge1xuICAgICAgdGhpcy5fdGFibGUucmVtb3ZlQ29sdW1uRGVmKHRoaXMuY29sdW1uRGVmKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGRlZmF1bHQgaGVhZGVyIHRleHQuIFVzZSB0aGUgb3B0aW9ucycgaGVhZGVyIHRleHQgdHJhbnNmb3JtYXRpb24gZnVuY3Rpb24gaWYgb25lXG4gICAqIGhhcyBiZWVuIHByb3ZpZGVkLiBPdGhlcndpc2Ugc2ltcGx5IGNhcGl0YWxpemUgdGhlIGNvbHVtbiBuYW1lLlxuICAgKi9cbiAgX2NyZWF0ZURlZmF1bHRIZWFkZXJUZXh0KCkge1xuICAgIGNvbnN0IG5hbWUgPSB0aGlzLm5hbWU7XG5cbiAgICBpZiAoaXNEZXZNb2RlKCkgJiYgIW5hbWUpIHtcbiAgICAgIHRocm93IGdldFRhYmxlVGV4dENvbHVtbk1pc3NpbmdOYW1lRXJyb3IoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fb3B0aW9ucyAmJiB0aGlzLl9vcHRpb25zLmRlZmF1bHRIZWFkZXJUZXh0VHJhbnNmb3JtKSB7XG4gICAgICByZXR1cm4gdGhpcy5fb3B0aW9ucy5kZWZhdWx0SGVhZGVyVGV4dFRyYW5zZm9ybShuYW1lKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmFtZVswXS50b1VwcGVyQ2FzZSgpICsgbmFtZS5zbGljZSgxKTtcbiAgfVxuXG4gIC8qKiBTeW5jaHJvbml6ZXMgdGhlIGNvbHVtbiBkZWZpbml0aW9uIG5hbWUgd2l0aCB0aGUgdGV4dCBjb2x1bW4gbmFtZS4gKi9cbiAgcHJpdmF0ZSBfc3luY0NvbHVtbkRlZk5hbWUoKSB7XG4gICAgaWYgKHRoaXMuY29sdW1uRGVmKSB7XG4gICAgICB0aGlzLmNvbHVtbkRlZi5uYW1lID0gdGhpcy5uYW1lO1xuICAgIH1cbiAgfVxufVxuIl19