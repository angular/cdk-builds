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
import { ChangeDetectionStrategy, Component, Directive, IterableDiffers, TemplateRef, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { mixinHasStickyInput } from './can-stick';
/**
 * The row template that can be used by the mat-table. Should not be used outside of the
 * material library.
 * @type {?}
 */
export const CDK_ROW_TEMPLATE = `<ng-container cdkCellOutlet></ng-container>`;
/**
 * Base class for the CdkHeaderRowDef and CdkRowDef that handles checking their columns inputs
 * for changes and notifying the table.
 * @abstract
 */
export class BaseRowDef {
    /**
     * @param {?} template
     * @param {?} _differs
     */
    constructor(template, _differs) {
        this.template = template;
        this._differs = _differs;
    }
    /**
     * @param {?} changes
     * @return {?}
     */
    ngOnChanges(changes) {
        // Create a new columns differ if one does not yet exist. Initialize it based on initial value
        // of the columns property or an empty array if none is provided.
        if (!this._columnsDiffer) {
            /** @type {?} */
            const columns = (changes['columns'] && changes['columns'].currentValue) || [];
            this._columnsDiffer = this._differs.find(columns).create();
            this._columnsDiffer.diff(columns);
        }
    }
    /**
     * Returns the difference between the current columns and the columns from the last diff, or null
     * if there is no difference.
     * @return {?}
     */
    getColumnsDiff() {
        return this._columnsDiffer.diff(this.columns);
    }
    /**
     * Gets this row def's relevant cell template from the provided column def.
     * @param {?} column
     * @return {?}
     */
    extractCellTemplate(column) {
        if (this instanceof CdkHeaderRowDef) {
            return column.headerCell.template;
        }
        if (this instanceof CdkFooterRowDef) {
            return column.footerCell.template;
        }
        else {
            return column.cell.template;
        }
    }
}
if (false) {
    /**
     * The columns to be displayed on this row.
     * @type {?}
     */
    BaseRowDef.prototype.columns;
    /**
     * Differ used to check if any changes were made to the columns.
     * @type {?}
     * @protected
     */
    BaseRowDef.prototype._columnsDiffer;
    /**
     * \@docs-private
     * @type {?}
     */
    BaseRowDef.prototype.template;
    /**
     * @type {?}
     * @protected
     */
    BaseRowDef.prototype._differs;
}
// Boilerplate for applying mixins to CdkHeaderRowDef.
/**
 * \@docs-private
 */
class CdkHeaderRowDefBase extends BaseRowDef {
}
/** @type {?} */
const _CdkHeaderRowDefBase = mixinHasStickyInput(CdkHeaderRowDefBase);
/**
 * Header row definition for the CDK table.
 * Captures the header row's template and other header properties such as the columns to display.
 */
export class CdkHeaderRowDef extends _CdkHeaderRowDefBase {
    /**
     * @param {?} template
     * @param {?} _differs
     */
    constructor(template, _differs) {
        super(template, _differs);
    }
    // Prerender fails to recognize that ngOnChanges in a part of this class through inheritance.
    // Explicitly define it so that the method is called as part of the Angular lifecycle.
    /**
     * @param {?} changes
     * @return {?}
     */
    ngOnChanges(changes) {
        super.ngOnChanges(changes);
    }
}
CdkHeaderRowDef.decorators = [
    { type: Directive, args: [{
                selector: '[cdkHeaderRowDef]',
                inputs: ['columns: cdkHeaderRowDef', 'sticky: cdkHeaderRowDefSticky'],
            },] }
];
/** @nocollapse */
CdkHeaderRowDef.ctorParameters = () => [
    { type: TemplateRef },
    { type: IterableDiffers }
];
if (false) {
    /** @type {?} */
    CdkHeaderRowDef.ngAcceptInputType_sticky;
}
// Boilerplate for applying mixins to CdkFooterRowDef.
/**
 * \@docs-private
 */
class CdkFooterRowDefBase extends BaseRowDef {
}
/** @type {?} */
const _CdkFooterRowDefBase = mixinHasStickyInput(CdkFooterRowDefBase);
/**
 * Footer row definition for the CDK table.
 * Captures the footer row's template and other footer properties such as the columns to display.
 */
export class CdkFooterRowDef extends _CdkFooterRowDefBase {
    /**
     * @param {?} template
     * @param {?} _differs
     */
    constructor(template, _differs) {
        super(template, _differs);
    }
    // Prerender fails to recognize that ngOnChanges in a part of this class through inheritance.
    // Explicitly define it so that the method is called as part of the Angular lifecycle.
    /**
     * @param {?} changes
     * @return {?}
     */
    ngOnChanges(changes) {
        super.ngOnChanges(changes);
    }
}
CdkFooterRowDef.decorators = [
    { type: Directive, args: [{
                selector: '[cdkFooterRowDef]',
                inputs: ['columns: cdkFooterRowDef', 'sticky: cdkFooterRowDefSticky'],
            },] }
];
/** @nocollapse */
CdkFooterRowDef.ctorParameters = () => [
    { type: TemplateRef },
    { type: IterableDiffers }
];
if (false) {
    /** @type {?} */
    CdkFooterRowDef.ngAcceptInputType_sticky;
}
/**
 * Data row definition for the CDK table.
 * Captures the header row's template and other row properties such as the columns to display and
 * a when predicate that describes when this row should be used.
 * @template T
 */
export class CdkRowDef extends BaseRowDef {
    // TODO(andrewseguin): Add an input for providing a switch function to determine
    //   if this template should be used.
    /**
     * @param {?} template
     * @param {?} _differs
     */
    constructor(template, _differs) {
        super(template, _differs);
    }
}
CdkRowDef.decorators = [
    { type: Directive, args: [{
                selector: '[cdkRowDef]',
                inputs: ['columns: cdkRowDefColumns', 'when: cdkRowDefWhen'],
            },] }
];
/** @nocollapse */
CdkRowDef.ctorParameters = () => [
    { type: TemplateRef },
    { type: IterableDiffers }
];
if (false) {
    /**
     * Function that should return true if this row template should be used for the provided index
     * and row data. If left undefined, this row will be considered the default row template to use
     * when no other when functions return true for the data.
     * For every row, there must be at least one when function that passes or an undefined to default.
     * @type {?}
     */
    CdkRowDef.prototype.when;
}
/**
 * Context provided to the row cells when `multiTemplateDataRows` is false
 * @record
 * @template T
 */
export function CdkCellOutletRowContext() { }
if (false) {
    /**
     * Data for the row that this cell is located within.
     * @type {?|undefined}
     */
    CdkCellOutletRowContext.prototype.$implicit;
    /**
     * Index of the data object in the provided data array.
     * @type {?|undefined}
     */
    CdkCellOutletRowContext.prototype.index;
    /**
     * Length of the number of total rows.
     * @type {?|undefined}
     */
    CdkCellOutletRowContext.prototype.count;
    /**
     * True if this cell is contained in the first row.
     * @type {?|undefined}
     */
    CdkCellOutletRowContext.prototype.first;
    /**
     * True if this cell is contained in the last row.
     * @type {?|undefined}
     */
    CdkCellOutletRowContext.prototype.last;
    /**
     * True if this cell is contained in a row with an even-numbered index.
     * @type {?|undefined}
     */
    CdkCellOutletRowContext.prototype.even;
    /**
     * True if this cell is contained in a row with an odd-numbered index.
     * @type {?|undefined}
     */
    CdkCellOutletRowContext.prototype.odd;
}
/**
 * Context provided to the row cells when `multiTemplateDataRows` is true. This context is the same
 * as CdkCellOutletRowContext except that the single `index` value is replaced by `dataIndex` and
 * `renderIndex`.
 * @record
 * @template T
 */
export function CdkCellOutletMultiRowContext() { }
if (false) {
    /**
     * Data for the row that this cell is located within.
     * @type {?|undefined}
     */
    CdkCellOutletMultiRowContext.prototype.$implicit;
    /**
     * Index of the data object in the provided data array.
     * @type {?|undefined}
     */
    CdkCellOutletMultiRowContext.prototype.dataIndex;
    /**
     * Index location of the rendered row that this cell is located within.
     * @type {?|undefined}
     */
    CdkCellOutletMultiRowContext.prototype.renderIndex;
    /**
     * Length of the number of total rows.
     * @type {?|undefined}
     */
    CdkCellOutletMultiRowContext.prototype.count;
    /**
     * True if this cell is contained in the first row.
     * @type {?|undefined}
     */
    CdkCellOutletMultiRowContext.prototype.first;
    /**
     * True if this cell is contained in the last row.
     * @type {?|undefined}
     */
    CdkCellOutletMultiRowContext.prototype.last;
    /**
     * True if this cell is contained in a row with an even-numbered index.
     * @type {?|undefined}
     */
    CdkCellOutletMultiRowContext.prototype.even;
    /**
     * True if this cell is contained in a row with an odd-numbered index.
     * @type {?|undefined}
     */
    CdkCellOutletMultiRowContext.prototype.odd;
}
/**
 * Outlet for rendering cells inside of a row or header row.
 * \@docs-private
 */
export class CdkCellOutlet {
    /**
     * @param {?} _viewContainer
     */
    constructor(_viewContainer) {
        this._viewContainer = _viewContainer;
        CdkCellOutlet.mostRecentCellOutlet = this;
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        // If this was the last outlet being rendered in the view, remove the reference
        // from the static property after it has been destroyed to avoid leaking memory.
        if (CdkCellOutlet.mostRecentCellOutlet === this) {
            CdkCellOutlet.mostRecentCellOutlet = null;
        }
    }
}
/**
 * Static property containing the latest constructed instance of this class.
 * Used by the CDK table when each CdkHeaderRow and CdkRow component is created using
 * createEmbeddedView. After one of these components are created, this property will provide
 * a handle to provide that component's cells and context. After init, the CdkCellOutlet will
 * construct the cells with the provided context.
 */
CdkCellOutlet.mostRecentCellOutlet = null;
CdkCellOutlet.decorators = [
    { type: Directive, args: [{ selector: '[cdkCellOutlet]' },] }
];
/** @nocollapse */
CdkCellOutlet.ctorParameters = () => [
    { type: ViewContainerRef }
];
if (false) {
    /**
     * Static property containing the latest constructed instance of this class.
     * Used by the CDK table when each CdkHeaderRow and CdkRow component is created using
     * createEmbeddedView. After one of these components are created, this property will provide
     * a handle to provide that component's cells and context. After init, the CdkCellOutlet will
     * construct the cells with the provided context.
     * @type {?}
     */
    CdkCellOutlet.mostRecentCellOutlet;
    /**
     * The ordered list of cells to render within this outlet's view container
     * @type {?}
     */
    CdkCellOutlet.prototype.cells;
    /**
     * The data context to be provided to each cell
     * @type {?}
     */
    CdkCellOutlet.prototype.context;
    /** @type {?} */
    CdkCellOutlet.prototype._viewContainer;
}
/**
 * Header template container that contains the cell outlet. Adds the right class and role.
 */
export class CdkHeaderRow {
}
CdkHeaderRow.decorators = [
    { type: Component, args: [{
                selector: 'cdk-header-row, tr[cdk-header-row]',
                template: CDK_ROW_TEMPLATE,
                host: {
                    'class': 'cdk-header-row',
                    'role': 'row',
                },
                // See note on CdkTable for explanation on why this uses the default change detection strategy.
                // tslint:disable-next-line:validate-decorators
                changeDetection: ChangeDetectionStrategy.Default,
                encapsulation: ViewEncapsulation.None
            }] }
];
/**
 * Footer template container that contains the cell outlet. Adds the right class and role.
 */
export class CdkFooterRow {
}
CdkFooterRow.decorators = [
    { type: Component, args: [{
                selector: 'cdk-footer-row, tr[cdk-footer-row]',
                template: CDK_ROW_TEMPLATE,
                host: {
                    'class': 'cdk-footer-row',
                    'role': 'row',
                },
                // See note on CdkTable for explanation on why this uses the default change detection strategy.
                // tslint:disable-next-line:validate-decorators
                changeDetection: ChangeDetectionStrategy.Default,
                encapsulation: ViewEncapsulation.None
            }] }
];
/**
 * Data row template container that contains the cell outlet. Adds the right class and role.
 */
export class CdkRow {
}
CdkRow.decorators = [
    { type: Component, args: [{
                selector: 'cdk-row, tr[cdk-row]',
                template: CDK_ROW_TEMPLATE,
                host: {
                    'class': 'cdk-row',
                    'role': 'row',
                },
                // See note on CdkTable for explanation on why this uses the default change detection strategy.
                // tslint:disable-next-line:validate-decorators
                changeDetection: ChangeDetectionStrategy.Default,
                encapsulation: ViewEncapsulation.None
            }] }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm93LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90YWJsZS9yb3cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQ0wsdUJBQXVCLEVBQ3ZCLFNBQVMsRUFDVCxTQUFTLEVBR1QsZUFBZSxFQUlmLFdBQVcsRUFDWCxnQkFBZ0IsRUFDaEIsaUJBQWlCLEVBQ2xCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBeUIsbUJBQW1CLEVBQUMsTUFBTSxhQUFhLENBQUM7Ozs7OztBQU94RSxNQUFNLE9BQU8sZ0JBQWdCLEdBQUcsNkNBQTZDOzs7Ozs7QUFNN0UsTUFBTSxPQUFnQixVQUFVOzs7OztJQU85QixZQUNnQyxRQUEwQixFQUFZLFFBQXlCO1FBQS9ELGFBQVEsR0FBUixRQUFRLENBQWtCO1FBQVksYUFBUSxHQUFSLFFBQVEsQ0FBaUI7SUFDL0YsQ0FBQzs7Ozs7SUFFRCxXQUFXLENBQUMsT0FBc0I7UUFDaEMsOEZBQThGO1FBQzlGLGlFQUFpRTtRQUNqRSxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRTs7a0JBQ2xCLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRTtZQUM3RSxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzNELElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ25DO0lBQ0gsQ0FBQzs7Ozs7O0lBTUQsY0FBYztRQUNaLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2hELENBQUM7Ozs7OztJQUdELG1CQUFtQixDQUFDLE1BQW9C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QUFLO2lCQUNkOzs7Z0JBR0QsZUFBZSxFQUFFLHVCQUF1QixDQUFDLE9BQU87Z0JBQ2hELGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJO2FBQ3RDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDb21wb25lbnQsXG4gIERpcmVjdGl2ZSxcbiAgSXRlcmFibGVDaGFuZ2VzLFxuICBJdGVyYWJsZURpZmZlcixcbiAgSXRlcmFibGVEaWZmZXJzLFxuICBPbkNoYW5nZXMsXG4gIE9uRGVzdHJveSxcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgVGVtcGxhdGVSZWYsXG4gIFZpZXdDb250YWluZXJSZWYsXG4gIFZpZXdFbmNhcHN1bGF0aW9uXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtDYW5TdGljaywgQ2FuU3RpY2tDdG9yLCBtaXhpbkhhc1N0aWNreUlucHV0fSBmcm9tICcuL2Nhbi1zdGljayc7XG5pbXBvcnQge0Nka0NlbGxEZWYsIENka0NvbHVtbkRlZn0gZnJvbSAnLi9jZWxsJztcblxuLyoqXG4gKiBUaGUgcm93IHRlbXBsYXRlIHRoYXQgY2FuIGJlIHVzZWQgYnkgdGhlIG1hdC10YWJsZS4gU2hvdWxkIG5vdCBiZSB1c2VkIG91dHNpZGUgb2YgdGhlXG4gKiBtYXRlcmlhbCBsaWJyYXJ5LlxuICovXG5leHBvcnQgY29uc3QgQ0RLX1JPV19URU1QTEFURSA9IGA8bmctY29udGFpbmVyIGNka0NlbGxPdXRsZXQ+PC9uZy1jb250YWluZXI+YDtcblxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciB0aGUgQ2RrSGVhZGVyUm93RGVmIGFuZCBDZGtSb3dEZWYgdGhhdCBoYW5kbGVzIGNoZWNraW5nIHRoZWlyIGNvbHVtbnMgaW5wdXRzXG4gKiBmb3IgY2hhbmdlcyBhbmQgbm90aWZ5aW5nIHRoZSB0YWJsZS5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEJhc2VSb3dEZWYgaW1wbGVtZW50cyBPbkNoYW5nZXMge1xuICAvKiogVGhlIGNvbHVtbnMgdG8gYmUgZGlzcGxheWVkIG9uIHRoaXMgcm93LiAqL1xuICBjb2x1bW5zOiBJdGVyYWJsZTxzdHJpbmc+O1xuXG4gIC8qKiBEaWZmZXIgdXNlZCB0byBjaGVjayBpZiBhbnkgY2hhbmdlcyB3ZXJlIG1hZGUgdG8gdGhlIGNvbHVtbnMuICovXG4gIHByb3RlY3RlZCBfY29sdW1uc0RpZmZlcjogSXRlcmFibGVEaWZmZXI8YW55PjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKiBAZG9jcy1wcml2YXRlICovIHB1YmxpYyB0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8YW55PiwgcHJvdGVjdGVkIF9kaWZmZXJzOiBJdGVyYWJsZURpZmZlcnMpIHtcbiAgfVxuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICAvLyBDcmVhdGUgYSBuZXcgY29sdW1ucyBkaWZmZXIgaWYgb25lIGRvZXMgbm90IHlldCBleGlzdC4gSW5pdGlhbGl6ZSBpdCBiYXNlZCBvbiBpbml0aWFsIHZhbHVlXG4gICAgLy8gb2YgdGhlIGNvbHVtbnMgcHJvcGVydHkgb3IgYW4gZW1wdHkgYXJyYXkgaWYgbm9uZSBpcyBwcm92aWRlZC5cbiAgICBpZiAoIXRoaXMuX2NvbHVtbnNEaWZmZXIpIHtcbiAgICAgIGNvbnN0IGNvbHVtbnMgPSAoY2hhbmdlc1snY29sdW1ucyddICYmIGNoYW5nZXNbJ2NvbHVtbnMnXS5jdXJyZW50VmFsdWUpIHx8IFtdO1xuICAgICAgdGhpcy5fY29sdW1uc0RpZmZlciA9IHRoaXMuX2RpZmZlcnMuZmluZChjb2x1bW5zKS5jcmVhdGUoKTtcbiAgICAgIHRoaXMuX2NvbHVtbnNEaWZmZXIuZGlmZihjb2x1bW5zKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSBjdXJyZW50IGNvbHVtbnMgYW5kIHRoZSBjb2x1bW5zIGZyb20gdGhlIGxhc3QgZGlmZiwgb3IgbnVsbFxuICAgKiBpZiB0aGVyZSBpcyBubyBkaWZmZXJlbmNlLlxuICAgKi9cbiAgZ2V0Q29sdW1uc0RpZmYoKTogSXRlcmFibGVDaGFuZ2VzPGFueT58bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbHVtbnNEaWZmZXIuZGlmZih0aGlzLmNvbHVtbnMpO1xuICB9XG5cbiAgLyoqIEdldHMgdGhpcyByb3cgZGVmJ3MgcmVsZXZhbnQgY2VsbCB0ZW1wbGF0ZSBmcm9tIHRoZSBwcm92aWRlZCBjb2x1bW4gZGVmLiAqL1xuICBleHRyYWN0Q2VsbFRlbXBsYXRlKGNvbHVtbjogQ2RrQ29sdW1uRGVmKTogVGVtcGxhdGVSZWY8YW55PiB7XG4gICAgaWYgKHRoaXMgaW5zdGFuY2VvZiBDZGtIZWFkZXJSb3dEZWYpIHtcbiAgICAgIHJldHVybiBjb2x1bW4uaGVhZGVyQ2VsbC50ZW1wbGF0ZTtcbiAgICB9XG4gICAgaWYgKHRoaXMgaW5zdGFuY2VvZiBDZGtGb290ZXJSb3dEZWYpIHtcbiAgICAgIHJldHVybiBjb2x1bW4uZm9vdGVyQ2VsbC50ZW1wbGF0ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGNvbHVtbi5jZWxsLnRlbXBsYXRlO1xuICAgIH1cbiAgfVxufVxuXG4vLyBCb2lsZXJwbGF0ZSBmb3IgYXBwbHlpbmcgbWl4aW5zIHRvIENka0hlYWRlclJvd0RlZi5cbi8qKiBAZG9jcy1wcml2YXRlICovXG5jbGFzcyBDZGtIZWFkZXJSb3dEZWZCYXNlIGV4dGVuZHMgQmFzZVJvd0RlZiB7fVxuY29uc3QgX0Nka0hlYWRlclJvd0RlZkJhc2U6IENhblN0aWNrQ3RvciZ0eXBlb2YgQ2RrSGVhZGVyUm93RGVmQmFzZSA9XG4gICAgbWl4aW5IYXNTdGlja3lJbnB1dChDZGtIZWFkZXJSb3dEZWZCYXNlKTtcblxuLyoqXG4gKiBIZWFkZXIgcm93IGRlZmluaXRpb24gZm9yIHRoZSBDREsgdGFibGUuXG4gKiBDYXB0dXJlcyB0aGUgaGVhZGVyIHJvdydzIHRlbXBsYXRlIGFuZCBvdGhlciBoZWFkZXIgcHJvcGVydGllcyBzdWNoIGFzIHRoZSBjb2x1bW5zIHRvIGRpc3BsYXkuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtIZWFkZXJSb3dEZWZdJyxcbiAgaW5wdXRzOiBbJ2NvbHVtbnM6IGNka0hlYWRlclJvd0RlZicsICdzdGlja3k6IGNka0hlYWRlclJvd0RlZlN0aWNreSddLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtIZWFkZXJSb3dEZWYgZXh0ZW5kcyBfQ2RrSGVhZGVyUm93RGVmQmFzZSBpbXBsZW1lbnRzIENhblN0aWNrLCBPbkNoYW5nZXMge1xuICBjb25zdHJ1Y3Rvcih0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8YW55PiwgX2RpZmZlcnM6IEl0ZXJhYmxlRGlmZmVycykge1xuICAgIHN1cGVyKHRlbXBsYXRlLCBfZGlmZmVycyk7XG4gIH1cblxuICAvLyBQcmVyZW5kZXIgZmFpbHMgdG8gcmVjb2duaXplIHRoYXQgbmdPbkNoYW5nZXMgaW4gYSBwYXJ0IG9mIHRoaXMgY2xhc3MgdGhyb3VnaCBpbmhlcml0YW5jZS5cbiAgLy8gRXhwbGljaXRseSBkZWZpbmUgaXQgc28gdGhhdCB0aGUgbWV0aG9kIGlzIGNhbGxlZCBhcyBwYXJ0IG9mIHRoZSBBbmd1bGFyIGxpZmVjeWNsZS5cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIHN1cGVyLm5nT25DaGFuZ2VzKGNoYW5nZXMpO1xuICB9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX3N0aWNreTogYm9vbGVhbiB8IHN0cmluZztcbn1cblxuLy8gQm9pbGVycGxhdGUgZm9yIGFwcGx5aW5nIG1peGlucyB0byBDZGtGb290ZXJSb3dEZWYuXG4vKiogQGRvY3MtcHJpdmF0ZSAqL1xuY2xhc3MgQ2RrRm9vdGVyUm93RGVmQmFzZSBleHRlbmRzIEJhc2VSb3dEZWYge31cbmNvbnN0IF9DZGtGb290ZXJSb3dEZWZCYXNlOiBDYW5TdGlja0N0b3ImdHlwZW9mIENka0Zvb3RlclJvd0RlZkJhc2UgPVxuICAgIG1peGluSGFzU3RpY2t5SW5wdXQoQ2RrRm9vdGVyUm93RGVmQmFzZSk7XG5cbi8qKlxuICogRm9vdGVyIHJvdyBkZWZpbml0aW9uIGZvciB0aGUgQ0RLIHRhYmxlLlxuICogQ2FwdHVyZXMgdGhlIGZvb3RlciByb3cncyB0ZW1wbGF0ZSBhbmQgb3RoZXIgZm9vdGVyIHByb3BlcnRpZXMgc3VjaCBhcyB0aGUgY29sdW1ucyB0byBkaXNwbGF5LlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrRm9vdGVyUm93RGVmXScsXG4gIGlucHV0czogWydjb2x1bW5zOiBjZGtGb290ZXJSb3dEZWYnLCAnc3RpY2t5OiBjZGtGb290ZXJSb3dEZWZTdGlja3knXSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrRm9vdGVyUm93RGVmIGV4dGVuZHMgX0Nka0Zvb3RlclJvd0RlZkJhc2UgaW1wbGVtZW50cyBDYW5TdGljaywgT25DaGFuZ2VzIHtcbiAgY29uc3RydWN0b3IodGVtcGxhdGU6IFRlbXBsYXRlUmVmPGFueT4sIF9kaWZmZXJzOiBJdGVyYWJsZURpZmZlcnMpIHtcbiAgICBzdXBlcih0ZW1wbGF0ZSwgX2RpZmZlcnMpO1xuICB9XG5cbiAgLy8gUHJlcmVuZGVyIGZhaWxzIHRvIHJlY29nbml6ZSB0aGF0IG5nT25DaGFuZ2VzIGluIGEgcGFydCBvZiB0aGlzIGNsYXNzIHRocm91Z2ggaW5oZXJpdGFuY2UuXG4gIC8vIEV4cGxpY2l0bHkgZGVmaW5lIGl0IHNvIHRoYXQgdGhlIG1ldGhvZCBpcyBjYWxsZWQgYXMgcGFydCBvZiB0aGUgQW5ndWxhciBsaWZlY3ljbGUuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICBzdXBlci5uZ09uQ2hhbmdlcyhjaGFuZ2VzKTtcbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9zdGlja3k6IGJvb2xlYW4gfCBzdHJpbmc7XG59XG5cbi8qKlxuICogRGF0YSByb3cgZGVmaW5pdGlvbiBmb3IgdGhlIENESyB0YWJsZS5cbiAqIENhcHR1cmVzIHRoZSBoZWFkZXIgcm93J3MgdGVtcGxhdGUgYW5kIG90aGVyIHJvdyBwcm9wZXJ0aWVzIHN1Y2ggYXMgdGhlIGNvbHVtbnMgdG8gZGlzcGxheSBhbmRcbiAqIGEgd2hlbiBwcmVkaWNhdGUgdGhhdCBkZXNjcmliZXMgd2hlbiB0aGlzIHJvdyBzaG91bGQgYmUgdXNlZC5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka1Jvd0RlZl0nLFxuICBpbnB1dHM6IFsnY29sdW1uczogY2RrUm93RGVmQ29sdW1ucycsICd3aGVuOiBjZGtSb3dEZWZXaGVuJ10sXG59KVxuZXhwb3J0IGNsYXNzIENka1Jvd0RlZjxUPiBleHRlbmRzIEJhc2VSb3dEZWYge1xuICAvKipcbiAgICogRnVuY3Rpb24gdGhhdCBzaG91bGQgcmV0dXJuIHRydWUgaWYgdGhpcyByb3cgdGVtcGxhdGUgc2hvdWxkIGJlIHVzZWQgZm9yIHRoZSBwcm92aWRlZCBpbmRleFxuICAgKiBhbmQgcm93IGRhdGEuIElmIGxlZnQgdW5kZWZpbmVkLCB0aGlzIHJvdyB3aWxsIGJlIGNvbnNpZGVyZWQgdGhlIGRlZmF1bHQgcm93IHRlbXBsYXRlIHRvIHVzZVxuICAgKiB3aGVuIG5vIG90aGVyIHdoZW4gZnVuY3Rpb25zIHJldHVybiB0cnVlIGZvciB0aGUgZGF0YS5cbiAgICogRm9yIGV2ZXJ5IHJvdywgdGhlcmUgbXVzdCBiZSBhdCBsZWFzdCBvbmUgd2hlbiBmdW5jdGlvbiB0aGF0IHBhc3NlcyBvciBhbiB1bmRlZmluZWQgdG8gZGVmYXVsdC5cbiAgICovXG4gIHdoZW46IChpbmRleDogbnVtYmVyLCByb3dEYXRhOiBUKSA9PiBib29sZWFuO1xuXG4gIC8vIFRPRE8oYW5kcmV3c2VndWluKTogQWRkIGFuIGlucHV0IGZvciBwcm92aWRpbmcgYSBzd2l0Y2ggZnVuY3Rpb24gdG8gZGV0ZXJtaW5lXG4gIC8vICAgaWYgdGhpcyB0ZW1wbGF0ZSBzaG91bGQgYmUgdXNlZC5cbiAgY29uc3RydWN0b3IodGVtcGxhdGU6IFRlbXBsYXRlUmVmPGFueT4sIF9kaWZmZXJzOiBJdGVyYWJsZURpZmZlcnMpIHtcbiAgICBzdXBlcih0ZW1wbGF0ZSwgX2RpZmZlcnMpO1xuICB9XG59XG5cbi8qKiBDb250ZXh0IHByb3ZpZGVkIHRvIHRoZSByb3cgY2VsbHMgd2hlbiBgbXVsdGlUZW1wbGF0ZURhdGFSb3dzYCBpcyBmYWxzZSAqL1xuZXhwb3J0IGludGVyZmFjZSBDZGtDZWxsT3V0bGV0Um93Q29udGV4dDxUPiB7XG4gIC8qKiBEYXRhIGZvciB0aGUgcm93IHRoYXQgdGhpcyBjZWxsIGlzIGxvY2F0ZWQgd2l0aGluLiAqL1xuICAkaW1wbGljaXQ/OiBUO1xuXG4gIC8qKiBJbmRleCBvZiB0aGUgZGF0YSBvYmplY3QgaW4gdGhlIHByb3ZpZGVkIGRhdGEgYXJyYXkuICovXG4gIGluZGV4PzogbnVtYmVyO1xuXG4gIC8qKiBMZW5ndGggb2YgdGhlIG51bWJlciBvZiB0b3RhbCByb3dzLiAqL1xuICBjb3VudD86IG51bWJlcjtcblxuICAvKiogVHJ1ZSBpZiB0aGlzIGNlbGwgaXMgY29udGFpbmVkIGluIHRoZSBmaXJzdCByb3cuICovXG4gIGZpcnN0PzogYm9vbGVhbjtcblxuICAvKiogVHJ1ZSBpZiB0aGlzIGNlbGwgaXMgY29udGFpbmVkIGluIHRoZSBsYXN0IHJvdy4gKi9cbiAgbGFzdD86IGJvb2xlYW47XG5cbiAgLyoqIFRydWUgaWYgdGhpcyBjZWxsIGlzIGNvbnRhaW5lZCBpbiBhIHJvdyB3aXRoIGFuIGV2ZW4tbnVtYmVyZWQgaW5kZXguICovXG4gIGV2ZW4/OiBib29sZWFuO1xuXG4gIC8qKiBUcnVlIGlmIHRoaXMgY2VsbCBpcyBjb250YWluZWQgaW4gYSByb3cgd2l0aCBhbiBvZGQtbnVtYmVyZWQgaW5kZXguICovXG4gIG9kZD86IGJvb2xlYW47XG59XG5cbi8qKlxuICogQ29udGV4dCBwcm92aWRlZCB0byB0aGUgcm93IGNlbGxzIHdoZW4gYG11bHRpVGVtcGxhdGVEYXRhUm93c2AgaXMgdHJ1ZS4gVGhpcyBjb250ZXh0IGlzIHRoZSBzYW1lXG4gKiBhcyBDZGtDZWxsT3V0bGV0Um93Q29udGV4dCBleGNlcHQgdGhhdCB0aGUgc2luZ2xlIGBpbmRleGAgdmFsdWUgaXMgcmVwbGFjZWQgYnkgYGRhdGFJbmRleGAgYW5kXG4gKiBgcmVuZGVySW5kZXhgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIENka0NlbGxPdXRsZXRNdWx0aVJvd0NvbnRleHQ8VD4ge1xuICAvKiogRGF0YSBmb3IgdGhlIHJvdyB0aGF0IHRoaXMgY2VsbCBpcyBsb2NhdGVkIHdpdGhpbi4gKi9cbiAgJGltcGxpY2l0PzogVDtcblxuICAvKiogSW5kZXggb2YgdGhlIGRhdGEgb2JqZWN0IGluIHRoZSBwcm92aWRlZCBkYXRhIGFycmF5LiAqL1xuICBkYXRhSW5kZXg/OiBudW1iZXI7XG5cbiAgLyoqIEluZGV4IGxvY2F0aW9uIG9mIHRoZSByZW5kZXJlZCByb3cgdGhhdCB0aGlzIGNlbGwgaXMgbG9jYXRlZCB3aXRoaW4uICovXG4gIHJlbmRlckluZGV4PzogbnVtYmVyO1xuXG4gIC8qKiBMZW5ndGggb2YgdGhlIG51bWJlciBvZiB0b3RhbCByb3dzLiAqL1xuICBjb3VudD86IG51bWJlcjtcblxuICAvKiogVHJ1ZSBpZiB0aGlzIGNlbGwgaXMgY29udGFpbmVkIGluIHRoZSBmaXJzdCByb3cuICovXG4gIGZpcnN0PzogYm9vbGVhbjtcblxuICAvKiogVHJ1ZSBpZiB0aGlzIGNlbGwgaXMgY29udGFpbmVkIGluIHRoZSBsYXN0IHJvdy4gKi9cbiAgbGFzdD86IGJvb2xlYW47XG5cbiAgLyoqIFRydWUgaWYgdGhpcyBjZWxsIGlzIGNvbnRhaW5lZCBpbiBhIHJvdyB3aXRoIGFuIGV2ZW4tbnVtYmVyZWQgaW5kZXguICovXG4gIGV2ZW4/OiBib29sZWFuO1xuXG4gIC8qKiBUcnVlIGlmIHRoaXMgY2VsbCBpcyBjb250YWluZWQgaW4gYSByb3cgd2l0aCBhbiBvZGQtbnVtYmVyZWQgaW5kZXguICovXG4gIG9kZD86IGJvb2xlYW47XG59XG5cbi8qKlxuICogT3V0bGV0IGZvciByZW5kZXJpbmcgY2VsbHMgaW5zaWRlIG9mIGEgcm93IG9yIGhlYWRlciByb3cuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbkBEaXJlY3RpdmUoe3NlbGVjdG9yOiAnW2Nka0NlbGxPdXRsZXRdJ30pXG5leHBvcnQgY2xhc3MgQ2RrQ2VsbE91dGxldCBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qKiBUaGUgb3JkZXJlZCBsaXN0IG9mIGNlbGxzIHRvIHJlbmRlciB3aXRoaW4gdGhpcyBvdXRsZXQncyB2aWV3IGNvbnRhaW5lciAqL1xuICBjZWxsczogQ2RrQ2VsbERlZltdO1xuXG4gIC8qKiBUaGUgZGF0YSBjb250ZXh0IHRvIGJlIHByb3ZpZGVkIHRvIGVhY2ggY2VsbCAqL1xuICBjb250ZXh0OiBhbnk7XG5cbiAgLyoqXG4gICAqIFN0YXRpYyBwcm9wZXJ0eSBjb250YWluaW5nIHRoZSBsYXRlc3QgY29uc3RydWN0ZWQgaW5zdGFuY2Ugb2YgdGhpcyBjbGFzcy5cbiAgICogVXNlZCBieSB0aGUgQ0RLIHRhYmxlIHdoZW4gZWFjaCBDZGtIZWFkZXJSb3cgYW5kIENka1JvdyBjb21wb25lbnQgaXMgY3JlYXRlZCB1c2luZ1xuICAgKiBjcmVhdGVFbWJlZGRlZFZpZXcuIEFmdGVyIG9uZSBvZiB0aGVzZSBjb21wb25lbnRzIGFyZSBjcmVhdGVkLCB0aGlzIHByb3BlcnR5IHdpbGwgcHJvdmlkZVxuICAgKiBhIGhhbmRsZSB0byBwcm92aWRlIHRoYXQgY29tcG9uZW50J3MgY2VsbHMgYW5kIGNvbnRleHQuIEFmdGVyIGluaXQsIHRoZSBDZGtDZWxsT3V0bGV0IHdpbGxcbiAgICogY29uc3RydWN0IHRoZSBjZWxscyB3aXRoIHRoZSBwcm92aWRlZCBjb250ZXh0LlxuICAgKi9cbiAgc3RhdGljIG1vc3RSZWNlbnRDZWxsT3V0bGV0OiBDZGtDZWxsT3V0bGV0fG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBfdmlld0NvbnRhaW5lcjogVmlld0NvbnRhaW5lclJlZikge1xuICAgIENka0NlbGxPdXRsZXQubW9zdFJlY2VudENlbGxPdXRsZXQgPSB0aGlzO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgLy8gSWYgdGhpcyB3YXMgdGhlIGxhc3Qgb3V0bGV0IGJlaW5nIHJlbmRlcmVkIGluIHRoZSB2aWV3LCByZW1vdmUgdGhlIHJlZmVyZW5jZVxuICAgIC8vIGZyb20gdGhlIHN0YXRpYyBwcm9wZXJ0eSBhZnRlciBpdCBoYXMgYmVlbiBkZXN0cm95ZWQgdG8gYXZvaWQgbGVha2luZyBtZW1vcnkuXG4gICAgaWYgKENka0NlbGxPdXRsZXQubW9zdFJlY2VudENlbGxPdXRsZXQgPT09IHRoaXMpIHtcbiAgICAgIENka0NlbGxPdXRsZXQubW9zdFJlY2VudENlbGxPdXRsZXQgPSBudWxsO1xuICAgIH1cbiAgfVxufVxuXG4vKiogSGVhZGVyIHRlbXBsYXRlIGNvbnRhaW5lciB0aGF0IGNvbnRhaW5zIHRoZSBjZWxsIG91dGxldC4gQWRkcyB0aGUgcmlnaHQgY2xhc3MgYW5kIHJvbGUuICovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdjZGstaGVhZGVyLXJvdywgdHJbY2RrLWhlYWRlci1yb3ddJyxcbiAgdGVtcGxhdGU6IENES19ST1dfVEVNUExBVEUsXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLWhlYWRlci1yb3cnLFxuICAgICdyb2xlJzogJ3JvdycsXG4gIH0sXG4gIC8vIFNlZSBub3RlIG9uIENka1RhYmxlIGZvciBleHBsYW5hdGlvbiBvbiB3aHkgdGhpcyB1c2VzIHRoZSBkZWZhdWx0IGNoYW5nZSBkZXRlY3Rpb24gc3RyYXRlZ3kuXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTp2YWxpZGF0ZS1kZWNvcmF0b3JzXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuRGVmYXVsdCxcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrSGVhZGVyUm93IHtcbn1cblxuXG4vKiogRm9vdGVyIHRlbXBsYXRlIGNvbnRhaW5lciB0aGF0IGNvbnRhaW5zIHRoZSBjZWxsIG91dGxldC4gQWRkcyB0aGUgcmlnaHQgY2xhc3MgYW5kIHJvbGUuICovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdjZGstZm9vdGVyLXJvdywgdHJbY2RrLWZvb3Rlci1yb3ddJyxcbiAgdGVtcGxhdGU6IENES19ST1dfVEVNUExBVEUsXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLWZvb3Rlci1yb3cnLFxuICAgICdyb2xlJzogJ3JvdycsXG4gIH0sXG4gIC8vIFNlZSBub3RlIG9uIENka1RhYmxlIGZvciBleHBsYW5hdGlvbiBvbiB3aHkgdGhpcyB1c2VzIHRoZSBkZWZhdWx0IGNoYW5nZSBkZXRlY3Rpb24gc3RyYXRlZ3kuXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTp2YWxpZGF0ZS1kZWNvcmF0b3JzXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuRGVmYXVsdCxcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrRm9vdGVyUm93IHtcbn1cblxuLyoqIERhdGEgcm93IHRlbXBsYXRlIGNvbnRhaW5lciB0aGF0IGNvbnRhaW5zIHRoZSBjZWxsIG91dGxldC4gQWRkcyB0aGUgcmlnaHQgY2xhc3MgYW5kIHJvbGUuICovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdjZGstcm93LCB0cltjZGstcm93XScsXG4gIHRlbXBsYXRlOiBDREtfUk9XX1RFTVBMQVRFLFxuICBob3N0OiB7XG4gICAgJ2NsYXNzJzogJ2Nkay1yb3cnLFxuICAgICdyb2xlJzogJ3JvdycsXG4gIH0sXG4gIC8vIFNlZSBub3RlIG9uIENka1RhYmxlIGZvciBleHBsYW5hdGlvbiBvbiB3aHkgdGhpcyB1c2VzIHRoZSBkZWZhdWx0IGNoYW5nZSBkZXRlY3Rpb24gc3RyYXRlZ3kuXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTp2YWxpZGF0ZS1kZWNvcmF0b3JzXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuRGVmYXVsdCxcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrUm93IHtcbn1cbiJdfQ==