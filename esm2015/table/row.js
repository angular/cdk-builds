/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/table/row.ts
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm93LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90YWJsZS9yb3cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUNMLHVCQUF1QixFQUN2QixTQUFTLEVBQ1QsU0FBUyxFQUdULGVBQWUsRUFJZixXQUFXLEVBQ1gsZ0JBQWdCLEVBQ2hCLGlCQUFpQixFQUNsQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQXlCLG1CQUFtQixFQUFDLE1BQU0sYUFBYSxDQUFDOzs7Ozs7QUFPeEUsTUFBTSxPQUFPLGdCQUFnQixHQUFHLDZDQUE2Qzs7Ozs7O0FBTTdFLE1BQU0sT0FBZ0IsVUFBVTs7Ozs7SUFPOUIsWUFDZ0MsUUFBMEIsRUFBWSxRQUF5QjtRQUEvRCxhQUFRLEdBQVIsUUFBUSxDQUFrQjtRQUFZLGFBQVEsR0FBUixRQUFRLENBQWlCO0lBQy9GLENBQUM7Ozs7O0lBRUQsV0FBVyxDQUFDLE9BQXNCO1FBQ2hDLDhGQUE4RjtRQUM5RixpRUFBaUU7UUFDakUsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUU7O2tCQUNsQixPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUU7WUFDN0UsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUMzRCxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUNuQztJQUNILENBQUM7Ozs7OztJQU1ELGNBQWM7UUFDWixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNoRCxDQUFDOzs7Ozs7SUFHRCxtQkFBbUIsQ0FBQyxNQUFv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S0FBSztpQkFDZDs7O2dCQUdELGVBQWUsRUFBRSx1QkFBdUIsQ0FBQyxPQUFPO2dCQUNoRCxhQUFhLEVBQUUsaUJBQWlCLENBQUMsSUFBSTthQUN0QyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0Jvb2xlYW5JbnB1dH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7XG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDb21wb25lbnQsXG4gIERpcmVjdGl2ZSxcbiAgSXRlcmFibGVDaGFuZ2VzLFxuICBJdGVyYWJsZURpZmZlcixcbiAgSXRlcmFibGVEaWZmZXJzLFxuICBPbkNoYW5nZXMsXG4gIE9uRGVzdHJveSxcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgVGVtcGxhdGVSZWYsXG4gIFZpZXdDb250YWluZXJSZWYsXG4gIFZpZXdFbmNhcHN1bGF0aW9uXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtDYW5TdGljaywgQ2FuU3RpY2tDdG9yLCBtaXhpbkhhc1N0aWNreUlucHV0fSBmcm9tICcuL2Nhbi1zdGljayc7XG5pbXBvcnQge0Nka0NlbGxEZWYsIENka0NvbHVtbkRlZn0gZnJvbSAnLi9jZWxsJztcblxuLyoqXG4gKiBUaGUgcm93IHRlbXBsYXRlIHRoYXQgY2FuIGJlIHVzZWQgYnkgdGhlIG1hdC10YWJsZS4gU2hvdWxkIG5vdCBiZSB1c2VkIG91dHNpZGUgb2YgdGhlXG4gKiBtYXRlcmlhbCBsaWJyYXJ5LlxuICovXG5leHBvcnQgY29uc3QgQ0RLX1JPV19URU1QTEFURSA9IGA8bmctY29udGFpbmVyIGNka0NlbGxPdXRsZXQ+PC9uZy1jb250YWluZXI+YDtcblxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciB0aGUgQ2RrSGVhZGVyUm93RGVmIGFuZCBDZGtSb3dEZWYgdGhhdCBoYW5kbGVzIGNoZWNraW5nIHRoZWlyIGNvbHVtbnMgaW5wdXRzXG4gKiBmb3IgY2hhbmdlcyBhbmQgbm90aWZ5aW5nIHRoZSB0YWJsZS5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEJhc2VSb3dEZWYgaW1wbGVtZW50cyBPbkNoYW5nZXMge1xuICAvKiogVGhlIGNvbHVtbnMgdG8gYmUgZGlzcGxheWVkIG9uIHRoaXMgcm93LiAqL1xuICBjb2x1bW5zOiBJdGVyYWJsZTxzdHJpbmc+O1xuXG4gIC8qKiBEaWZmZXIgdXNlZCB0byBjaGVjayBpZiBhbnkgY2hhbmdlcyB3ZXJlIG1hZGUgdG8gdGhlIGNvbHVtbnMuICovXG4gIHByb3RlY3RlZCBfY29sdW1uc0RpZmZlcjogSXRlcmFibGVEaWZmZXI8YW55PjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKiBAZG9jcy1wcml2YXRlICovIHB1YmxpYyB0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8YW55PiwgcHJvdGVjdGVkIF9kaWZmZXJzOiBJdGVyYWJsZURpZmZlcnMpIHtcbiAgfVxuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICAvLyBDcmVhdGUgYSBuZXcgY29sdW1ucyBkaWZmZXIgaWYgb25lIGRvZXMgbm90IHlldCBleGlzdC4gSW5pdGlhbGl6ZSBpdCBiYXNlZCBvbiBpbml0aWFsIHZhbHVlXG4gICAgLy8gb2YgdGhlIGNvbHVtbnMgcHJvcGVydHkgb3IgYW4gZW1wdHkgYXJyYXkgaWYgbm9uZSBpcyBwcm92aWRlZC5cbiAgICBpZiAoIXRoaXMuX2NvbHVtbnNEaWZmZXIpIHtcbiAgICAgIGNvbnN0IGNvbHVtbnMgPSAoY2hhbmdlc1snY29sdW1ucyddICYmIGNoYW5nZXNbJ2NvbHVtbnMnXS5jdXJyZW50VmFsdWUpIHx8IFtdO1xuICAgICAgdGhpcy5fY29sdW1uc0RpZmZlciA9IHRoaXMuX2RpZmZlcnMuZmluZChjb2x1bW5zKS5jcmVhdGUoKTtcbiAgICAgIHRoaXMuX2NvbHVtbnNEaWZmZXIuZGlmZihjb2x1bW5zKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSBjdXJyZW50IGNvbHVtbnMgYW5kIHRoZSBjb2x1bW5zIGZyb20gdGhlIGxhc3QgZGlmZiwgb3IgbnVsbFxuICAgKiBpZiB0aGVyZSBpcyBubyBkaWZmZXJlbmNlLlxuICAgKi9cbiAgZ2V0Q29sdW1uc0RpZmYoKTogSXRlcmFibGVDaGFuZ2VzPGFueT58bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbHVtbnNEaWZmZXIuZGlmZih0aGlzLmNvbHVtbnMpO1xuICB9XG5cbiAgLyoqIEdldHMgdGhpcyByb3cgZGVmJ3MgcmVsZXZhbnQgY2VsbCB0ZW1wbGF0ZSBmcm9tIHRoZSBwcm92aWRlZCBjb2x1bW4gZGVmLiAqL1xuICBleHRyYWN0Q2VsbFRlbXBsYXRlKGNvbHVtbjogQ2RrQ29sdW1uRGVmKTogVGVtcGxhdGVSZWY8YW55PiB7XG4gICAgaWYgKHRoaXMgaW5zdGFuY2VvZiBDZGtIZWFkZXJSb3dEZWYpIHtcbiAgICAgIHJldHVybiBjb2x1bW4uaGVhZGVyQ2VsbC50ZW1wbGF0ZTtcbiAgICB9XG4gICAgaWYgKHRoaXMgaW5zdGFuY2VvZiBDZGtGb290ZXJSb3dEZWYpIHtcbiAgICAgIHJldHVybiBjb2x1bW4uZm9vdGVyQ2VsbC50ZW1wbGF0ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGNvbHVtbi5jZWxsLnRlbXBsYXRlO1xuICAgIH1cbiAgfVxufVxuXG4vLyBCb2lsZXJwbGF0ZSBmb3IgYXBwbHlpbmcgbWl4aW5zIHRvIENka0hlYWRlclJvd0RlZi5cbi8qKiBAZG9jcy1wcml2YXRlICovXG5jbGFzcyBDZGtIZWFkZXJSb3dEZWZCYXNlIGV4dGVuZHMgQmFzZVJvd0RlZiB7fVxuY29uc3QgX0Nka0hlYWRlclJvd0RlZkJhc2U6IENhblN0aWNrQ3RvciZ0eXBlb2YgQ2RrSGVhZGVyUm93RGVmQmFzZSA9XG4gICAgbWl4aW5IYXNTdGlja3lJbnB1dChDZGtIZWFkZXJSb3dEZWZCYXNlKTtcblxuLyoqXG4gKiBIZWFkZXIgcm93IGRlZmluaXRpb24gZm9yIHRoZSBDREsgdGFibGUuXG4gKiBDYXB0dXJlcyB0aGUgaGVhZGVyIHJvdydzIHRlbXBsYXRlIGFuZCBvdGhlciBoZWFkZXIgcHJvcGVydGllcyBzdWNoIGFzIHRoZSBjb2x1bW5zIHRvIGRpc3BsYXkuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtIZWFkZXJSb3dEZWZdJyxcbiAgaW5wdXRzOiBbJ2NvbHVtbnM6IGNka0hlYWRlclJvd0RlZicsICdzdGlja3k6IGNka0hlYWRlclJvd0RlZlN0aWNreSddLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtIZWFkZXJSb3dEZWYgZXh0ZW5kcyBfQ2RrSGVhZGVyUm93RGVmQmFzZSBpbXBsZW1lbnRzIENhblN0aWNrLCBPbkNoYW5nZXMge1xuICBjb25zdHJ1Y3Rvcih0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8YW55PiwgX2RpZmZlcnM6IEl0ZXJhYmxlRGlmZmVycykge1xuICAgIHN1cGVyKHRlbXBsYXRlLCBfZGlmZmVycyk7XG4gIH1cblxuICAvLyBQcmVyZW5kZXIgZmFpbHMgdG8gcmVjb2duaXplIHRoYXQgbmdPbkNoYW5nZXMgaW4gYSBwYXJ0IG9mIHRoaXMgY2xhc3MgdGhyb3VnaCBpbmhlcml0YW5jZS5cbiAgLy8gRXhwbGljaXRseSBkZWZpbmUgaXQgc28gdGhhdCB0aGUgbWV0aG9kIGlzIGNhbGxlZCBhcyBwYXJ0IG9mIHRoZSBBbmd1bGFyIGxpZmVjeWNsZS5cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIHN1cGVyLm5nT25DaGFuZ2VzKGNoYW5nZXMpO1xuICB9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX3N0aWNreTogQm9vbGVhbklucHV0O1xufVxuXG4vLyBCb2lsZXJwbGF0ZSBmb3IgYXBwbHlpbmcgbWl4aW5zIHRvIENka0Zvb3RlclJvd0RlZi5cbi8qKiBAZG9jcy1wcml2YXRlICovXG5jbGFzcyBDZGtGb290ZXJSb3dEZWZCYXNlIGV4dGVuZHMgQmFzZVJvd0RlZiB7fVxuY29uc3QgX0Nka0Zvb3RlclJvd0RlZkJhc2U6IENhblN0aWNrQ3RvciZ0eXBlb2YgQ2RrRm9vdGVyUm93RGVmQmFzZSA9XG4gICAgbWl4aW5IYXNTdGlja3lJbnB1dChDZGtGb290ZXJSb3dEZWZCYXNlKTtcblxuLyoqXG4gKiBGb290ZXIgcm93IGRlZmluaXRpb24gZm9yIHRoZSBDREsgdGFibGUuXG4gKiBDYXB0dXJlcyB0aGUgZm9vdGVyIHJvdydzIHRlbXBsYXRlIGFuZCBvdGhlciBmb290ZXIgcHJvcGVydGllcyBzdWNoIGFzIHRoZSBjb2x1bW5zIHRvIGRpc3BsYXkuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtGb290ZXJSb3dEZWZdJyxcbiAgaW5wdXRzOiBbJ2NvbHVtbnM6IGNka0Zvb3RlclJvd0RlZicsICdzdGlja3k6IGNka0Zvb3RlclJvd0RlZlN0aWNreSddLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtGb290ZXJSb3dEZWYgZXh0ZW5kcyBfQ2RrRm9vdGVyUm93RGVmQmFzZSBpbXBsZW1lbnRzIENhblN0aWNrLCBPbkNoYW5nZXMge1xuICBjb25zdHJ1Y3Rvcih0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8YW55PiwgX2RpZmZlcnM6IEl0ZXJhYmxlRGlmZmVycykge1xuICAgIHN1cGVyKHRlbXBsYXRlLCBfZGlmZmVycyk7XG4gIH1cblxuICAvLyBQcmVyZW5kZXIgZmFpbHMgdG8gcmVjb2duaXplIHRoYXQgbmdPbkNoYW5nZXMgaW4gYSBwYXJ0IG9mIHRoaXMgY2xhc3MgdGhyb3VnaCBpbmhlcml0YW5jZS5cbiAgLy8gRXhwbGljaXRseSBkZWZpbmUgaXQgc28gdGhhdCB0aGUgbWV0aG9kIGlzIGNhbGxlZCBhcyBwYXJ0IG9mIHRoZSBBbmd1bGFyIGxpZmVjeWNsZS5cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIHN1cGVyLm5nT25DaGFuZ2VzKGNoYW5nZXMpO1xuICB9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX3N0aWNreTogQm9vbGVhbklucHV0O1xufVxuXG4vKipcbiAqIERhdGEgcm93IGRlZmluaXRpb24gZm9yIHRoZSBDREsgdGFibGUuXG4gKiBDYXB0dXJlcyB0aGUgaGVhZGVyIHJvdydzIHRlbXBsYXRlIGFuZCBvdGhlciByb3cgcHJvcGVydGllcyBzdWNoIGFzIHRoZSBjb2x1bW5zIHRvIGRpc3BsYXkgYW5kXG4gKiBhIHdoZW4gcHJlZGljYXRlIHRoYXQgZGVzY3JpYmVzIHdoZW4gdGhpcyByb3cgc2hvdWxkIGJlIHVzZWQuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtSb3dEZWZdJyxcbiAgaW5wdXRzOiBbJ2NvbHVtbnM6IGNka1Jvd0RlZkNvbHVtbnMnLCAnd2hlbjogY2RrUm93RGVmV2hlbiddLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtSb3dEZWY8VD4gZXh0ZW5kcyBCYXNlUm93RGVmIHtcbiAgLyoqXG4gICAqIEZ1bmN0aW9uIHRoYXQgc2hvdWxkIHJldHVybiB0cnVlIGlmIHRoaXMgcm93IHRlbXBsYXRlIHNob3VsZCBiZSB1c2VkIGZvciB0aGUgcHJvdmlkZWQgaW5kZXhcbiAgICogYW5kIHJvdyBkYXRhLiBJZiBsZWZ0IHVuZGVmaW5lZCwgdGhpcyByb3cgd2lsbCBiZSBjb25zaWRlcmVkIHRoZSBkZWZhdWx0IHJvdyB0ZW1wbGF0ZSB0byB1c2VcbiAgICogd2hlbiBubyBvdGhlciB3aGVuIGZ1bmN0aW9ucyByZXR1cm4gdHJ1ZSBmb3IgdGhlIGRhdGEuXG4gICAqIEZvciBldmVyeSByb3csIHRoZXJlIG11c3QgYmUgYXQgbGVhc3Qgb25lIHdoZW4gZnVuY3Rpb24gdGhhdCBwYXNzZXMgb3IgYW4gdW5kZWZpbmVkIHRvIGRlZmF1bHQuXG4gICAqL1xuICB3aGVuOiAoaW5kZXg6IG51bWJlciwgcm93RGF0YTogVCkgPT4gYm9vbGVhbjtcblxuICAvLyBUT0RPKGFuZHJld3NlZ3Vpbik6IEFkZCBhbiBpbnB1dCBmb3IgcHJvdmlkaW5nIGEgc3dpdGNoIGZ1bmN0aW9uIHRvIGRldGVybWluZVxuICAvLyAgIGlmIHRoaXMgdGVtcGxhdGUgc2hvdWxkIGJlIHVzZWQuXG4gIGNvbnN0cnVjdG9yKHRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxhbnk+LCBfZGlmZmVyczogSXRlcmFibGVEaWZmZXJzKSB7XG4gICAgc3VwZXIodGVtcGxhdGUsIF9kaWZmZXJzKTtcbiAgfVxufVxuXG4vKiogQ29udGV4dCBwcm92aWRlZCB0byB0aGUgcm93IGNlbGxzIHdoZW4gYG11bHRpVGVtcGxhdGVEYXRhUm93c2AgaXMgZmFsc2UgKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2RrQ2VsbE91dGxldFJvd0NvbnRleHQ8VD4ge1xuICAvKiogRGF0YSBmb3IgdGhlIHJvdyB0aGF0IHRoaXMgY2VsbCBpcyBsb2NhdGVkIHdpdGhpbi4gKi9cbiAgJGltcGxpY2l0PzogVDtcblxuICAvKiogSW5kZXggb2YgdGhlIGRhdGEgb2JqZWN0IGluIHRoZSBwcm92aWRlZCBkYXRhIGFycmF5LiAqL1xuICBpbmRleD86IG51bWJlcjtcblxuICAvKiogTGVuZ3RoIG9mIHRoZSBudW1iZXIgb2YgdG90YWwgcm93cy4gKi9cbiAgY291bnQ/OiBudW1iZXI7XG5cbiAgLyoqIFRydWUgaWYgdGhpcyBjZWxsIGlzIGNvbnRhaW5lZCBpbiB0aGUgZmlyc3Qgcm93LiAqL1xuICBmaXJzdD86IGJvb2xlYW47XG5cbiAgLyoqIFRydWUgaWYgdGhpcyBjZWxsIGlzIGNvbnRhaW5lZCBpbiB0aGUgbGFzdCByb3cuICovXG4gIGxhc3Q/OiBib29sZWFuO1xuXG4gIC8qKiBUcnVlIGlmIHRoaXMgY2VsbCBpcyBjb250YWluZWQgaW4gYSByb3cgd2l0aCBhbiBldmVuLW51bWJlcmVkIGluZGV4LiAqL1xuICBldmVuPzogYm9vbGVhbjtcblxuICAvKiogVHJ1ZSBpZiB0aGlzIGNlbGwgaXMgY29udGFpbmVkIGluIGEgcm93IHdpdGggYW4gb2RkLW51bWJlcmVkIGluZGV4LiAqL1xuICBvZGQ/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIENvbnRleHQgcHJvdmlkZWQgdG8gdGhlIHJvdyBjZWxscyB3aGVuIGBtdWx0aVRlbXBsYXRlRGF0YVJvd3NgIGlzIHRydWUuIFRoaXMgY29udGV4dCBpcyB0aGUgc2FtZVxuICogYXMgQ2RrQ2VsbE91dGxldFJvd0NvbnRleHQgZXhjZXB0IHRoYXQgdGhlIHNpbmdsZSBgaW5kZXhgIHZhbHVlIGlzIHJlcGxhY2VkIGJ5IGBkYXRhSW5kZXhgIGFuZFxuICogYHJlbmRlckluZGV4YC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDZGtDZWxsT3V0bGV0TXVsdGlSb3dDb250ZXh0PFQ+IHtcbiAgLyoqIERhdGEgZm9yIHRoZSByb3cgdGhhdCB0aGlzIGNlbGwgaXMgbG9jYXRlZCB3aXRoaW4uICovXG4gICRpbXBsaWNpdD86IFQ7XG5cbiAgLyoqIEluZGV4IG9mIHRoZSBkYXRhIG9iamVjdCBpbiB0aGUgcHJvdmlkZWQgZGF0YSBhcnJheS4gKi9cbiAgZGF0YUluZGV4PzogbnVtYmVyO1xuXG4gIC8qKiBJbmRleCBsb2NhdGlvbiBvZiB0aGUgcmVuZGVyZWQgcm93IHRoYXQgdGhpcyBjZWxsIGlzIGxvY2F0ZWQgd2l0aGluLiAqL1xuICByZW5kZXJJbmRleD86IG51bWJlcjtcblxuICAvKiogTGVuZ3RoIG9mIHRoZSBudW1iZXIgb2YgdG90YWwgcm93cy4gKi9cbiAgY291bnQ/OiBudW1iZXI7XG5cbiAgLyoqIFRydWUgaWYgdGhpcyBjZWxsIGlzIGNvbnRhaW5lZCBpbiB0aGUgZmlyc3Qgcm93LiAqL1xuICBmaXJzdD86IGJvb2xlYW47XG5cbiAgLyoqIFRydWUgaWYgdGhpcyBjZWxsIGlzIGNvbnRhaW5lZCBpbiB0aGUgbGFzdCByb3cuICovXG4gIGxhc3Q/OiBib29sZWFuO1xuXG4gIC8qKiBUcnVlIGlmIHRoaXMgY2VsbCBpcyBjb250YWluZWQgaW4gYSByb3cgd2l0aCBhbiBldmVuLW51bWJlcmVkIGluZGV4LiAqL1xuICBldmVuPzogYm9vbGVhbjtcblxuICAvKiogVHJ1ZSBpZiB0aGlzIGNlbGwgaXMgY29udGFpbmVkIGluIGEgcm93IHdpdGggYW4gb2RkLW51bWJlcmVkIGluZGV4LiAqL1xuICBvZGQ/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIE91dGxldCBmb3IgcmVuZGVyaW5nIGNlbGxzIGluc2lkZSBvZiBhIHJvdyBvciBoZWFkZXIgcm93LlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5ARGlyZWN0aXZlKHtzZWxlY3RvcjogJ1tjZGtDZWxsT3V0bGV0XSd9KVxuZXhwb3J0IGNsYXNzIENka0NlbGxPdXRsZXQgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogVGhlIG9yZGVyZWQgbGlzdCBvZiBjZWxscyB0byByZW5kZXIgd2l0aGluIHRoaXMgb3V0bGV0J3MgdmlldyBjb250YWluZXIgKi9cbiAgY2VsbHM6IENka0NlbGxEZWZbXTtcblxuICAvKiogVGhlIGRhdGEgY29udGV4dCB0byBiZSBwcm92aWRlZCB0byBlYWNoIGNlbGwgKi9cbiAgY29udGV4dDogYW55O1xuXG4gIC8qKlxuICAgKiBTdGF0aWMgcHJvcGVydHkgY29udGFpbmluZyB0aGUgbGF0ZXN0IGNvbnN0cnVjdGVkIGluc3RhbmNlIG9mIHRoaXMgY2xhc3MuXG4gICAqIFVzZWQgYnkgdGhlIENESyB0YWJsZSB3aGVuIGVhY2ggQ2RrSGVhZGVyUm93IGFuZCBDZGtSb3cgY29tcG9uZW50IGlzIGNyZWF0ZWQgdXNpbmdcbiAgICogY3JlYXRlRW1iZWRkZWRWaWV3LiBBZnRlciBvbmUgb2YgdGhlc2UgY29tcG9uZW50cyBhcmUgY3JlYXRlZCwgdGhpcyBwcm9wZXJ0eSB3aWxsIHByb3ZpZGVcbiAgICogYSBoYW5kbGUgdG8gcHJvdmlkZSB0aGF0IGNvbXBvbmVudCdzIGNlbGxzIGFuZCBjb250ZXh0LiBBZnRlciBpbml0LCB0aGUgQ2RrQ2VsbE91dGxldCB3aWxsXG4gICAqIGNvbnN0cnVjdCB0aGUgY2VsbHMgd2l0aCB0aGUgcHJvdmlkZWQgY29udGV4dC5cbiAgICovXG4gIHN0YXRpYyBtb3N0UmVjZW50Q2VsbE91dGxldDogQ2RrQ2VsbE91dGxldHxudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgX3ZpZXdDb250YWluZXI6IFZpZXdDb250YWluZXJSZWYpIHtcbiAgICBDZGtDZWxsT3V0bGV0Lm1vc3RSZWNlbnRDZWxsT3V0bGV0ID0gdGhpcztcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIC8vIElmIHRoaXMgd2FzIHRoZSBsYXN0IG91dGxldCBiZWluZyByZW5kZXJlZCBpbiB0aGUgdmlldywgcmVtb3ZlIHRoZSByZWZlcmVuY2VcbiAgICAvLyBmcm9tIHRoZSBzdGF0aWMgcHJvcGVydHkgYWZ0ZXIgaXQgaGFzIGJlZW4gZGVzdHJveWVkIHRvIGF2b2lkIGxlYWtpbmcgbWVtb3J5LlxuICAgIGlmIChDZGtDZWxsT3V0bGV0Lm1vc3RSZWNlbnRDZWxsT3V0bGV0ID09PSB0aGlzKSB7XG4gICAgICBDZGtDZWxsT3V0bGV0Lm1vc3RSZWNlbnRDZWxsT3V0bGV0ID0gbnVsbDtcbiAgICB9XG4gIH1cbn1cblxuLyoqIEhlYWRlciB0ZW1wbGF0ZSBjb250YWluZXIgdGhhdCBjb250YWlucyB0aGUgY2VsbCBvdXRsZXQuIEFkZHMgdGhlIHJpZ2h0IGNsYXNzIGFuZCByb2xlLiAqL1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAnY2RrLWhlYWRlci1yb3csIHRyW2Nkay1oZWFkZXItcm93XScsXG4gIHRlbXBsYXRlOiBDREtfUk9XX1RFTVBMQVRFLFxuICBob3N0OiB7XG4gICAgJ2NsYXNzJzogJ2Nkay1oZWFkZXItcm93JyxcbiAgICAncm9sZSc6ICdyb3cnLFxuICB9LFxuICAvLyBTZWUgbm90ZSBvbiBDZGtUYWJsZSBmb3IgZXhwbGFuYXRpb24gb24gd2h5IHRoaXMgdXNlcyB0aGUgZGVmYXVsdCBjaGFuZ2UgZGV0ZWN0aW9uIHN0cmF0ZWd5LlxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6dmFsaWRhdGUtZGVjb3JhdG9yc1xuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5LkRlZmF1bHQsXG4gIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsXG59KVxuZXhwb3J0IGNsYXNzIENka0hlYWRlclJvdyB7XG59XG5cblxuLyoqIEZvb3RlciB0ZW1wbGF0ZSBjb250YWluZXIgdGhhdCBjb250YWlucyB0aGUgY2VsbCBvdXRsZXQuIEFkZHMgdGhlIHJpZ2h0IGNsYXNzIGFuZCByb2xlLiAqL1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAnY2RrLWZvb3Rlci1yb3csIHRyW2Nkay1mb290ZXItcm93XScsXG4gIHRlbXBsYXRlOiBDREtfUk9XX1RFTVBMQVRFLFxuICBob3N0OiB7XG4gICAgJ2NsYXNzJzogJ2Nkay1mb290ZXItcm93JyxcbiAgICAncm9sZSc6ICdyb3cnLFxuICB9LFxuICAvLyBTZWUgbm90ZSBvbiBDZGtUYWJsZSBmb3IgZXhwbGFuYXRpb24gb24gd2h5IHRoaXMgdXNlcyB0aGUgZGVmYXVsdCBjaGFuZ2UgZGV0ZWN0aW9uIHN0cmF0ZWd5LlxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6dmFsaWRhdGUtZGVjb3JhdG9yc1xuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5LkRlZmF1bHQsXG4gIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsXG59KVxuZXhwb3J0IGNsYXNzIENka0Zvb3RlclJvdyB7XG59XG5cbi8qKiBEYXRhIHJvdyB0ZW1wbGF0ZSBjb250YWluZXIgdGhhdCBjb250YWlucyB0aGUgY2VsbCBvdXRsZXQuIEFkZHMgdGhlIHJpZ2h0IGNsYXNzIGFuZCByb2xlLiAqL1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAnY2RrLXJvdywgdHJbY2RrLXJvd10nLFxuICB0ZW1wbGF0ZTogQ0RLX1JPV19URU1QTEFURSxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstcm93JyxcbiAgICAncm9sZSc6ICdyb3cnLFxuICB9LFxuICAvLyBTZWUgbm90ZSBvbiBDZGtUYWJsZSBmb3IgZXhwbGFuYXRpb24gb24gd2h5IHRoaXMgdXNlcyB0aGUgZGVmYXVsdCBjaGFuZ2UgZGV0ZWN0aW9uIHN0cmF0ZWd5LlxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6dmFsaWRhdGUtZGVjb3JhdG9yc1xuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5LkRlZmF1bHQsXG4gIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsXG59KVxuZXhwb3J0IGNsYXNzIENka1JvdyB7XG59XG4iXX0=