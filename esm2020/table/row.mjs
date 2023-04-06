/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectionStrategy, Component, Directive, IterableDiffers, TemplateRef, ViewContainerRef, ViewEncapsulation, Inject, Optional, } from '@angular/core';
import { mixinHasStickyInput } from './can-stick';
import { CDK_TABLE } from './tokens';
import * as i0 from "@angular/core";
/**
 * The row template that can be used by the mat-table. Should not be used outside of the
 * material library.
 */
export const CDK_ROW_TEMPLATE = `<ng-container cdkCellOutlet></ng-container>`;
/**
 * Base class for the CdkHeaderRowDef and CdkRowDef that handles checking their columns inputs
 * for changes and notifying the table.
 */
class BaseRowDef {
    constructor(
    /** @docs-private */ template, _differs) {
        this.template = template;
        this._differs = _differs;
    }
    ngOnChanges(changes) {
        // Create a new columns differ if one does not yet exist. Initialize it based on initial value
        // of the columns property or an empty array if none is provided.
        if (!this._columnsDiffer) {
            const columns = (changes['columns'] && changes['columns'].currentValue) || [];
            this._columnsDiffer = this._differs.find(columns).create();
            this._columnsDiffer.diff(columns);
        }
    }
    /**
     * Returns the difference between the current columns and the columns from the last diff, or null
     * if there is no difference.
     */
    getColumnsDiff() {
        return this._columnsDiffer.diff(this.columns);
    }
    /** Gets this row def's relevant cell template from the provided column def. */
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
BaseRowDef.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: BaseRowDef, deps: [{ token: i0.TemplateRef }, { token: i0.IterableDiffers }], target: i0.ɵɵFactoryTarget.Directive });
BaseRowDef.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.0-next.7", type: BaseRowDef, usesOnChanges: true, ngImport: i0 });
export { BaseRowDef };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: BaseRowDef, decorators: [{
            type: Directive
        }], ctorParameters: function () { return [{ type: i0.TemplateRef }, { type: i0.IterableDiffers }]; } });
// Boilerplate for applying mixins to CdkHeaderRowDef.
/** @docs-private */
class CdkHeaderRowDefBase extends BaseRowDef {
}
const _CdkHeaderRowDefBase = mixinHasStickyInput(CdkHeaderRowDefBase);
/**
 * Header row definition for the CDK table.
 * Captures the header row's template and other header properties such as the columns to display.
 */
class CdkHeaderRowDef extends _CdkHeaderRowDefBase {
    constructor(template, _differs, _table) {
        super(template, _differs);
        this._table = _table;
    }
    // Prerender fails to recognize that ngOnChanges in a part of this class through inheritance.
    // Explicitly define it so that the method is called as part of the Angular lifecycle.
    ngOnChanges(changes) {
        super.ngOnChanges(changes);
    }
}
CdkHeaderRowDef.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: CdkHeaderRowDef, deps: [{ token: i0.TemplateRef }, { token: i0.IterableDiffers }, { token: CDK_TABLE, optional: true }], target: i0.ɵɵFactoryTarget.Directive });
CdkHeaderRowDef.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.0-next.7", type: CdkHeaderRowDef, selector: "[cdkHeaderRowDef]", inputs: { columns: ["cdkHeaderRowDef", "columns"], sticky: ["cdkHeaderRowDefSticky", "sticky"] }, usesInheritance: true, usesOnChanges: true, ngImport: i0 });
export { CdkHeaderRowDef };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: CdkHeaderRowDef, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkHeaderRowDef]',
                    inputs: ['columns: cdkHeaderRowDef', 'sticky: cdkHeaderRowDefSticky'],
                }]
        }], ctorParameters: function () { return [{ type: i0.TemplateRef }, { type: i0.IterableDiffers }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [CDK_TABLE]
                }, {
                    type: Optional
                }] }]; } });
// Boilerplate for applying mixins to CdkFooterRowDef.
/** @docs-private */
class CdkFooterRowDefBase extends BaseRowDef {
}
const _CdkFooterRowDefBase = mixinHasStickyInput(CdkFooterRowDefBase);
/**
 * Footer row definition for the CDK table.
 * Captures the footer row's template and other footer properties such as the columns to display.
 */
class CdkFooterRowDef extends _CdkFooterRowDefBase {
    constructor(template, _differs, _table) {
        super(template, _differs);
        this._table = _table;
    }
    // Prerender fails to recognize that ngOnChanges in a part of this class through inheritance.
    // Explicitly define it so that the method is called as part of the Angular lifecycle.
    ngOnChanges(changes) {
        super.ngOnChanges(changes);
    }
}
CdkFooterRowDef.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: CdkFooterRowDef, deps: [{ token: i0.TemplateRef }, { token: i0.IterableDiffers }, { token: CDK_TABLE, optional: true }], target: i0.ɵɵFactoryTarget.Directive });
CdkFooterRowDef.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.0-next.7", type: CdkFooterRowDef, selector: "[cdkFooterRowDef]", inputs: { columns: ["cdkFooterRowDef", "columns"], sticky: ["cdkFooterRowDefSticky", "sticky"] }, usesInheritance: true, usesOnChanges: true, ngImport: i0 });
export { CdkFooterRowDef };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: CdkFooterRowDef, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkFooterRowDef]',
                    inputs: ['columns: cdkFooterRowDef', 'sticky: cdkFooterRowDefSticky'],
                }]
        }], ctorParameters: function () { return [{ type: i0.TemplateRef }, { type: i0.IterableDiffers }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [CDK_TABLE]
                }, {
                    type: Optional
                }] }]; } });
/**
 * Data row definition for the CDK table.
 * Captures the header row's template and other row properties such as the columns to display and
 * a when predicate that describes when this row should be used.
 */
class CdkRowDef extends BaseRowDef {
    // TODO(andrewseguin): Add an input for providing a switch function to determine
    //   if this template should be used.
    constructor(template, _differs, _table) {
        super(template, _differs);
        this._table = _table;
    }
}
CdkRowDef.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: CdkRowDef, deps: [{ token: i0.TemplateRef }, { token: i0.IterableDiffers }, { token: CDK_TABLE, optional: true }], target: i0.ɵɵFactoryTarget.Directive });
CdkRowDef.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.0-next.7", type: CdkRowDef, selector: "[cdkRowDef]", inputs: { columns: ["cdkRowDefColumns", "columns"], when: ["cdkRowDefWhen", "when"] }, usesInheritance: true, ngImport: i0 });
export { CdkRowDef };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: CdkRowDef, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkRowDef]',
                    inputs: ['columns: cdkRowDefColumns', 'when: cdkRowDefWhen'],
                }]
        }], ctorParameters: function () { return [{ type: i0.TemplateRef }, { type: i0.IterableDiffers }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [CDK_TABLE]
                }, {
                    type: Optional
                }] }]; } });
/**
 * Outlet for rendering cells inside of a row or header row.
 * @docs-private
 */
class CdkCellOutlet {
    constructor(_viewContainer) {
        this._viewContainer = _viewContainer;
        CdkCellOutlet.mostRecentCellOutlet = this;
    }
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
CdkCellOutlet.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: CdkCellOutlet, deps: [{ token: i0.ViewContainerRef }], target: i0.ɵɵFactoryTarget.Directive });
CdkCellOutlet.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.0-next.7", type: CdkCellOutlet, selector: "[cdkCellOutlet]", ngImport: i0 });
export { CdkCellOutlet };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: CdkCellOutlet, decorators: [{
            type: Directive,
            args: [{ selector: '[cdkCellOutlet]' }]
        }], ctorParameters: function () { return [{ type: i0.ViewContainerRef }]; } });
/** Header template container that contains the cell outlet. Adds the right class and role. */
class CdkHeaderRow {
}
CdkHeaderRow.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: CdkHeaderRow, deps: [], target: i0.ɵɵFactoryTarget.Component });
CdkHeaderRow.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "16.0.0-next.7", type: CdkHeaderRow, selector: "cdk-header-row, tr[cdk-header-row]", host: { attributes: { "role": "row" }, classAttribute: "cdk-header-row" }, ngImport: i0, template: "<ng-container cdkCellOutlet></ng-container>", isInline: true, dependencies: [{ kind: "directive", type: CdkCellOutlet, selector: "[cdkCellOutlet]" }], changeDetection: i0.ChangeDetectionStrategy.Default, encapsulation: i0.ViewEncapsulation.None });
export { CdkHeaderRow };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: CdkHeaderRow, decorators: [{
            type: Component,
            args: [{
                    selector: 'cdk-header-row, tr[cdk-header-row]',
                    template: CDK_ROW_TEMPLATE,
                    host: {
                        'class': 'cdk-header-row',
                        'role': 'row',
                    },
                    // See note on CdkTable for explanation on why this uses the default change detection strategy.
                    // tslint:disable-next-line:validate-decorators
                    changeDetection: ChangeDetectionStrategy.Default,
                    encapsulation: ViewEncapsulation.None,
                }]
        }] });
/** Footer template container that contains the cell outlet. Adds the right class and role. */
class CdkFooterRow {
}
CdkFooterRow.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: CdkFooterRow, deps: [], target: i0.ɵɵFactoryTarget.Component });
CdkFooterRow.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "16.0.0-next.7", type: CdkFooterRow, selector: "cdk-footer-row, tr[cdk-footer-row]", host: { attributes: { "role": "row" }, classAttribute: "cdk-footer-row" }, ngImport: i0, template: "<ng-container cdkCellOutlet></ng-container>", isInline: true, dependencies: [{ kind: "directive", type: CdkCellOutlet, selector: "[cdkCellOutlet]" }], changeDetection: i0.ChangeDetectionStrategy.Default, encapsulation: i0.ViewEncapsulation.None });
export { CdkFooterRow };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: CdkFooterRow, decorators: [{
            type: Component,
            args: [{
                    selector: 'cdk-footer-row, tr[cdk-footer-row]',
                    template: CDK_ROW_TEMPLATE,
                    host: {
                        'class': 'cdk-footer-row',
                        'role': 'row',
                    },
                    // See note on CdkTable for explanation on why this uses the default change detection strategy.
                    // tslint:disable-next-line:validate-decorators
                    changeDetection: ChangeDetectionStrategy.Default,
                    encapsulation: ViewEncapsulation.None,
                }]
        }] });
/** Data row template container that contains the cell outlet. Adds the right class and role. */
class CdkRow {
}
CdkRow.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: CdkRow, deps: [], target: i0.ɵɵFactoryTarget.Component });
CdkRow.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "16.0.0-next.7", type: CdkRow, selector: "cdk-row, tr[cdk-row]", host: { attributes: { "role": "row" }, classAttribute: "cdk-row" }, ngImport: i0, template: "<ng-container cdkCellOutlet></ng-container>", isInline: true, dependencies: [{ kind: "directive", type: CdkCellOutlet, selector: "[cdkCellOutlet]" }], changeDetection: i0.ChangeDetectionStrategy.Default, encapsulation: i0.ViewEncapsulation.None });
export { CdkRow };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: CdkRow, decorators: [{
            type: Component,
            args: [{
                    selector: 'cdk-row, tr[cdk-row]',
                    template: CDK_ROW_TEMPLATE,
                    host: {
                        'class': 'cdk-row',
                        'role': 'row',
                    },
                    // See note on CdkTable for explanation on why this uses the default change detection strategy.
                    // tslint:disable-next-line:validate-decorators
                    changeDetection: ChangeDetectionStrategy.Default,
                    encapsulation: ViewEncapsulation.None,
                }]
        }] });
/** Row that can be used to display a message when no data is shown in the table. */
class CdkNoDataRow {
    constructor(templateRef) {
        this.templateRef = templateRef;
        this._contentClassName = 'cdk-no-data-row';
    }
}
CdkNoDataRow.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: CdkNoDataRow, deps: [{ token: i0.TemplateRef }], target: i0.ɵɵFactoryTarget.Directive });
CdkNoDataRow.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.0-next.7", type: CdkNoDataRow, selector: "ng-template[cdkNoDataRow]", ngImport: i0 });
export { CdkNoDataRow };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: CdkNoDataRow, decorators: [{
            type: Directive,
            args: [{
                    selector: 'ng-template[cdkNoDataRow]',
                }]
        }], ctorParameters: function () { return [{ type: i0.TemplateRef }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm93LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90YWJsZS9yb3cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUNMLHVCQUF1QixFQUN2QixTQUFTLEVBQ1QsU0FBUyxFQUdULGVBQWUsRUFJZixXQUFXLEVBQ1gsZ0JBQWdCLEVBQ2hCLGlCQUFpQixFQUNqQixNQUFNLEVBQ04sUUFBUSxHQUNULE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBeUIsbUJBQW1CLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFFeEUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFVBQVUsQ0FBQzs7QUFFbkM7OztHQUdHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sZ0JBQWdCLEdBQUcsNkNBQTZDLENBQUM7QUFFOUU7OztHQUdHO0FBQ0gsTUFDc0IsVUFBVTtJQU85QjtJQUNFLG9CQUFvQixDQUFRLFFBQTBCLEVBQzVDLFFBQXlCO1FBRFAsYUFBUSxHQUFSLFFBQVEsQ0FBa0I7UUFDNUMsYUFBUSxHQUFSLFFBQVEsQ0FBaUI7SUFDbEMsQ0FBQztJQUVKLFdBQVcsQ0FBQyxPQUFzQjtRQUNoQyw4RkFBOEY7UUFDOUYsaUVBQWlFO1FBQ2pFLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFO1lBQ3hCLE1BQU0sT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDOUUsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUMzRCxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUNuQztJQUNILENBQUM7SUFFRDs7O09BR0c7SUFDSCxjQUFj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RSxvQ0FBb0M7b0JBQzlDLFFBQVEsRUFBRSxnQkFBZ0I7b0JBQzFCLElBQUksRUFBRTt3QkFDSixPQUFPLEVBQUUsZ0JBQWdCO3dCQUN6QixNQUFNLEVBQUUsS0FBSztxQkFDZDtvQkFDRCwrRkFBK0Y7b0JBQy9GLCtDQUErQztvQkFDL0MsZUFBZSxFQUFFLHVCQUF1QixDQUFDLE9BQU87b0JBQ2hELGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJO2lCQUN0Qzs7QUFHRCxnR0FBZ0c7QUFDaEcsTUFZYSxNQUFNOzswR0FBTixNQUFNOzhGQUFOLE1BQU0seU9BeEVOLGFBQWE7U0F3RWIsTUFBTTtrR0FBTixNQUFNO2tCQVpsQixTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSxzQkFBc0I7b0JBQ2hDLFFBQVEsRUFBRSxnQkFBZ0I7b0JBQzFCLElBQUksRUFBRTt3QkFDSixPQUFPLEVBQUUsU0FBUzt3QkFDbEIsTUFBTSxFQUFFLEtBQUs7cUJBQ2Q7b0JBQ0QsK0ZBQStGO29CQUMvRiwrQ0FBK0M7b0JBQy9DLGVBQWUsRUFBRSx1QkFBdUIsQ0FBQyxPQUFPO29CQUNoRCxhQUFhLEVBQUUsaUJBQWlCLENBQUMsSUFBSTtpQkFDdEM7O0FBR0Qsb0ZBQW9GO0FBQ3BGLE1BR2EsWUFBWTtJQUV2QixZQUFtQixXQUE2QjtRQUE3QixnQkFBVyxHQUFYLFdBQVcsQ0FBa0I7UUFEaEQsc0JBQWlCLEdBQUcsaUJBQWlCLENBQUM7SUFDYSxDQUFDOztnSEFGekMsWUFBWTtvR0FBWixZQUFZO1NBQVosWUFBWTtrR0FBWixZQUFZO2tCQUh4QixTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSwyQkFBMkI7aUJBQ3RDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDb21wb25lbnQsXG4gIERpcmVjdGl2ZSxcbiAgSXRlcmFibGVDaGFuZ2VzLFxuICBJdGVyYWJsZURpZmZlcixcbiAgSXRlcmFibGVEaWZmZXJzLFxuICBPbkNoYW5nZXMsXG4gIE9uRGVzdHJveSxcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgVGVtcGxhdGVSZWYsXG4gIFZpZXdDb250YWluZXJSZWYsXG4gIFZpZXdFbmNhcHN1bGF0aW9uLFxuICBJbmplY3QsXG4gIE9wdGlvbmFsLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Q2FuU3RpY2ssIENhblN0aWNrQ3RvciwgbWl4aW5IYXNTdGlja3lJbnB1dH0gZnJvbSAnLi9jYW4tc3RpY2snO1xuaW1wb3J0IHtDZGtDZWxsRGVmLCBDZGtDb2x1bW5EZWZ9IGZyb20gJy4vY2VsbCc7XG5pbXBvcnQge0NES19UQUJMRX0gZnJvbSAnLi90b2tlbnMnO1xuXG4vKipcbiAqIFRoZSByb3cgdGVtcGxhdGUgdGhhdCBjYW4gYmUgdXNlZCBieSB0aGUgbWF0LXRhYmxlLiBTaG91bGQgbm90IGJlIHVzZWQgb3V0c2lkZSBvZiB0aGVcbiAqIG1hdGVyaWFsIGxpYnJhcnkuXG4gKi9cbmV4cG9ydCBjb25zdCBDREtfUk9XX1RFTVBMQVRFID0gYDxuZy1jb250YWluZXIgY2RrQ2VsbE91dGxldD48L25nLWNvbnRhaW5lcj5gO1xuXG4vKipcbiAqIEJhc2UgY2xhc3MgZm9yIHRoZSBDZGtIZWFkZXJSb3dEZWYgYW5kIENka1Jvd0RlZiB0aGF0IGhhbmRsZXMgY2hlY2tpbmcgdGhlaXIgY29sdW1ucyBpbnB1dHNcbiAqIGZvciBjaGFuZ2VzIGFuZCBub3RpZnlpbmcgdGhlIHRhYmxlLlxuICovXG5ARGlyZWN0aXZlKClcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBCYXNlUm93RGVmIGltcGxlbWVudHMgT25DaGFuZ2VzIHtcbiAgLyoqIFRoZSBjb2x1bW5zIHRvIGJlIGRpc3BsYXllZCBvbiB0aGlzIHJvdy4gKi9cbiAgY29sdW1uczogSXRlcmFibGU8c3RyaW5nPjtcblxuICAvKiogRGlmZmVyIHVzZWQgdG8gY2hlY2sgaWYgYW55IGNoYW5nZXMgd2VyZSBtYWRlIHRvIHRoZSBjb2x1bW5zLiAqL1xuICBwcm90ZWN0ZWQgX2NvbHVtbnNEaWZmZXI6IEl0ZXJhYmxlRGlmZmVyPGFueT47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgLyoqIEBkb2NzLXByaXZhdGUgKi8gcHVibGljIHRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxhbnk+LFxuICAgIHByb3RlY3RlZCBfZGlmZmVyczogSXRlcmFibGVEaWZmZXJzLFxuICApIHt9XG5cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIC8vIENyZWF0ZSBhIG5ldyBjb2x1bW5zIGRpZmZlciBpZiBvbmUgZG9lcyBub3QgeWV0IGV4aXN0LiBJbml0aWFsaXplIGl0IGJhc2VkIG9uIGluaXRpYWwgdmFsdWVcbiAgICAvLyBvZiB0aGUgY29sdW1ucyBwcm9wZXJ0eSBvciBhbiBlbXB0eSBhcnJheSBpZiBub25lIGlzIHByb3ZpZGVkLlxuICAgIGlmICghdGhpcy5fY29sdW1uc0RpZmZlcikge1xuICAgICAgY29uc3QgY29sdW1ucyA9IChjaGFuZ2VzWydjb2x1bW5zJ10gJiYgY2hhbmdlc1snY29sdW1ucyddLmN1cnJlbnRWYWx1ZSkgfHwgW107XG4gICAgICB0aGlzLl9jb2x1bW5zRGlmZmVyID0gdGhpcy5fZGlmZmVycy5maW5kKGNvbHVtbnMpLmNyZWF0ZSgpO1xuICAgICAgdGhpcy5fY29sdW1uc0RpZmZlci5kaWZmKGNvbHVtbnMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gdGhlIGN1cnJlbnQgY29sdW1ucyBhbmQgdGhlIGNvbHVtbnMgZnJvbSB0aGUgbGFzdCBkaWZmLCBvciBudWxsXG4gICAqIGlmIHRoZXJlIGlzIG5vIGRpZmZlcmVuY2UuXG4gICAqL1xuICBnZXRDb2x1bW5zRGlmZigpOiBJdGVyYWJsZUNoYW5nZXM8YW55PiB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLl9jb2x1bW5zRGlmZmVyLmRpZmYodGhpcy5jb2x1bW5zKTtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoaXMgcm93IGRlZidzIHJlbGV2YW50IGNlbGwgdGVtcGxhdGUgZnJvbSB0aGUgcHJvdmlkZWQgY29sdW1uIGRlZi4gKi9cbiAgZXh0cmFjdENlbGxUZW1wbGF0ZShjb2x1bW46IENka0NvbHVtbkRlZik6IFRlbXBsYXRlUmVmPGFueT4ge1xuICAgIGlmICh0aGlzIGluc3RhbmNlb2YgQ2RrSGVhZGVyUm93RGVmKSB7XG4gICAgICByZXR1cm4gY29sdW1uLmhlYWRlckNlbGwudGVtcGxhdGU7XG4gICAgfVxuICAgIGlmICh0aGlzIGluc3RhbmNlb2YgQ2RrRm9vdGVyUm93RGVmKSB7XG4gICAgICByZXR1cm4gY29sdW1uLmZvb3RlckNlbGwudGVtcGxhdGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjb2x1bW4uY2VsbC50ZW1wbGF0ZTtcbiAgICB9XG4gIH1cbn1cblxuLy8gQm9pbGVycGxhdGUgZm9yIGFwcGx5aW5nIG1peGlucyB0byBDZGtIZWFkZXJSb3dEZWYuXG4vKiogQGRvY3MtcHJpdmF0ZSAqL1xuY2xhc3MgQ2RrSGVhZGVyUm93RGVmQmFzZSBleHRlbmRzIEJhc2VSb3dEZWYge31cbmNvbnN0IF9DZGtIZWFkZXJSb3dEZWZCYXNlOiBDYW5TdGlja0N0b3IgJiB0eXBlb2YgQ2RrSGVhZGVyUm93RGVmQmFzZSA9XG4gIG1peGluSGFzU3RpY2t5SW5wdXQoQ2RrSGVhZGVyUm93RGVmQmFzZSk7XG5cbi8qKlxuICogSGVhZGVyIHJvdyBkZWZpbml0aW9uIGZvciB0aGUgQ0RLIHRhYmxlLlxuICogQ2FwdHVyZXMgdGhlIGhlYWRlciByb3cncyB0ZW1wbGF0ZSBhbmQgb3RoZXIgaGVhZGVyIHByb3BlcnRpZXMgc3VjaCBhcyB0aGUgY29sdW1ucyB0byBkaXNwbGF5LlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrSGVhZGVyUm93RGVmXScsXG4gIGlucHV0czogWydjb2x1bW5zOiBjZGtIZWFkZXJSb3dEZWYnLCAnc3RpY2t5OiBjZGtIZWFkZXJSb3dEZWZTdGlja3knXSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrSGVhZGVyUm93RGVmIGV4dGVuZHMgX0Nka0hlYWRlclJvd0RlZkJhc2UgaW1wbGVtZW50cyBDYW5TdGljaywgT25DaGFuZ2VzIHtcbiAgY29uc3RydWN0b3IoXG4gICAgdGVtcGxhdGU6IFRlbXBsYXRlUmVmPGFueT4sXG4gICAgX2RpZmZlcnM6IEl0ZXJhYmxlRGlmZmVycyxcbiAgICBASW5qZWN0KENES19UQUJMRSkgQE9wdGlvbmFsKCkgcHVibGljIF90YWJsZT86IGFueSxcbiAgKSB7XG4gICAgc3VwZXIodGVtcGxhdGUsIF9kaWZmZXJzKTtcbiAgfVxuXG4gIC8vIFByZXJlbmRlciBmYWlscyB0byByZWNvZ25pemUgdGhhdCBuZ09uQ2hhbmdlcyBpbiBhIHBhcnQgb2YgdGhpcyBjbGFzcyB0aHJvdWdoIGluaGVyaXRhbmNlLlxuICAvLyBFeHBsaWNpdGx5IGRlZmluZSBpdCBzbyB0aGF0IHRoZSBtZXRob2QgaXMgY2FsbGVkIGFzIHBhcnQgb2YgdGhlIEFuZ3VsYXIgbGlmZWN5Y2xlLlxuICBvdmVycmlkZSBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XG4gICAgc3VwZXIubmdPbkNoYW5nZXMoY2hhbmdlcyk7XG4gIH1cbn1cblxuLy8gQm9pbGVycGxhdGUgZm9yIGFwcGx5aW5nIG1peGlucyB0byBDZGtGb290ZXJSb3dEZWYuXG4vKiogQGRvY3MtcHJpdmF0ZSAqL1xuY2xhc3MgQ2RrRm9vdGVyUm93RGVmQmFzZSBleHRlbmRzIEJhc2VSb3dEZWYge31cbmNvbnN0IF9DZGtGb290ZXJSb3dEZWZCYXNlOiBDYW5TdGlja0N0b3IgJiB0eXBlb2YgQ2RrRm9vdGVyUm93RGVmQmFzZSA9XG4gIG1peGluSGFzU3RpY2t5SW5wdXQoQ2RrRm9vdGVyUm93RGVmQmFzZSk7XG5cbi8qKlxuICogRm9vdGVyIHJvdyBkZWZpbml0aW9uIGZvciB0aGUgQ0RLIHRhYmxlLlxuICogQ2FwdHVyZXMgdGhlIGZvb3RlciByb3cncyB0ZW1wbGF0ZSBhbmQgb3RoZXIgZm9vdGVyIHByb3BlcnRpZXMgc3VjaCBhcyB0aGUgY29sdW1ucyB0byBkaXNwbGF5LlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrRm9vdGVyUm93RGVmXScsXG4gIGlucHV0czogWydjb2x1bW5zOiBjZGtGb290ZXJSb3dEZWYnLCAnc3RpY2t5OiBjZGtGb290ZXJSb3dEZWZTdGlja3knXSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrRm9vdGVyUm93RGVmIGV4dGVuZHMgX0Nka0Zvb3RlclJvd0RlZkJhc2UgaW1wbGVtZW50cyBDYW5TdGljaywgT25DaGFuZ2VzIHtcbiAgY29uc3RydWN0b3IoXG4gICAgdGVtcGxhdGU6IFRlbXBsYXRlUmVmPGFueT4sXG4gICAgX2RpZmZlcnM6IEl0ZXJhYmxlRGlmZmVycyxcbiAgICBASW5qZWN0KENES19UQUJMRSkgQE9wdGlvbmFsKCkgcHVibGljIF90YWJsZT86IGFueSxcbiAgKSB7XG4gICAgc3VwZXIodGVtcGxhdGUsIF9kaWZmZXJzKTtcbiAgfVxuXG4gIC8vIFByZXJlbmRlciBmYWlscyB0byByZWNvZ25pemUgdGhhdCBuZ09uQ2hhbmdlcyBpbiBhIHBhcnQgb2YgdGhpcyBjbGFzcyB0aHJvdWdoIGluaGVyaXRhbmNlLlxuICAvLyBFeHBsaWNpdGx5IGRlZmluZSBpdCBzbyB0aGF0IHRoZSBtZXRob2QgaXMgY2FsbGVkIGFzIHBhcnQgb2YgdGhlIEFuZ3VsYXIgbGlmZWN5Y2xlLlxuICBvdmVycmlkZSBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XG4gICAgc3VwZXIubmdPbkNoYW5nZXMoY2hhbmdlcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBEYXRhIHJvdyBkZWZpbml0aW9uIGZvciB0aGUgQ0RLIHRhYmxlLlxuICogQ2FwdHVyZXMgdGhlIGhlYWRlciByb3cncyB0ZW1wbGF0ZSBhbmQgb3RoZXIgcm93IHByb3BlcnRpZXMgc3VjaCBhcyB0aGUgY29sdW1ucyB0byBkaXNwbGF5IGFuZFxuICogYSB3aGVuIHByZWRpY2F0ZSB0aGF0IGRlc2NyaWJlcyB3aGVuIHRoaXMgcm93IHNob3VsZCBiZSB1c2VkLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrUm93RGVmXScsXG4gIGlucHV0czogWydjb2x1bW5zOiBjZGtSb3dEZWZDb2x1bW5zJywgJ3doZW46IGNka1Jvd0RlZldoZW4nXSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrUm93RGVmPFQ+IGV4dGVuZHMgQmFzZVJvd0RlZiB7XG4gIC8qKlxuICAgKiBGdW5jdGlvbiB0aGF0IHNob3VsZCByZXR1cm4gdHJ1ZSBpZiB0aGlzIHJvdyB0ZW1wbGF0ZSBzaG91bGQgYmUgdXNlZCBmb3IgdGhlIHByb3ZpZGVkIGluZGV4XG4gICAqIGFuZCByb3cgZGF0YS4gSWYgbGVmdCB1bmRlZmluZWQsIHRoaXMgcm93IHdpbGwgYmUgY29uc2lkZXJlZCB0aGUgZGVmYXVsdCByb3cgdGVtcGxhdGUgdG8gdXNlXG4gICAqIHdoZW4gbm8gb3RoZXIgd2hlbiBmdW5jdGlvbnMgcmV0dXJuIHRydWUgZm9yIHRoZSBkYXRhLlxuICAgKiBGb3IgZXZlcnkgcm93LCB0aGVyZSBtdXN0IGJlIGF0IGxlYXN0IG9uZSB3aGVuIGZ1bmN0aW9uIHRoYXQgcGFzc2VzIG9yIGFuIHVuZGVmaW5lZCB0byBkZWZhdWx0LlxuICAgKi9cbiAgd2hlbjogKGluZGV4OiBudW1iZXIsIHJvd0RhdGE6IFQpID0+IGJvb2xlYW47XG5cbiAgLy8gVE9ETyhhbmRyZXdzZWd1aW4pOiBBZGQgYW4gaW5wdXQgZm9yIHByb3ZpZGluZyBhIHN3aXRjaCBmdW5jdGlvbiB0byBkZXRlcm1pbmVcbiAgLy8gICBpZiB0aGlzIHRlbXBsYXRlIHNob3VsZCBiZSB1c2VkLlxuICBjb25zdHJ1Y3RvcihcbiAgICB0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8YW55PixcbiAgICBfZGlmZmVyczogSXRlcmFibGVEaWZmZXJzLFxuICAgIEBJbmplY3QoQ0RLX1RBQkxFKSBAT3B0aW9uYWwoKSBwdWJsaWMgX3RhYmxlPzogYW55LFxuICApIHtcbiAgICBzdXBlcih0ZW1wbGF0ZSwgX2RpZmZlcnMpO1xuICB9XG59XG5cbi8qKiBDb250ZXh0IHByb3ZpZGVkIHRvIHRoZSByb3cgY2VsbHMgd2hlbiBgbXVsdGlUZW1wbGF0ZURhdGFSb3dzYCBpcyBmYWxzZSAqL1xuZXhwb3J0IGludGVyZmFjZSBDZGtDZWxsT3V0bGV0Um93Q29udGV4dDxUPiB7XG4gIC8qKiBEYXRhIGZvciB0aGUgcm93IHRoYXQgdGhpcyBjZWxsIGlzIGxvY2F0ZWQgd2l0aGluLiAqL1xuICAkaW1wbGljaXQ/OiBUO1xuXG4gIC8qKiBJbmRleCBvZiB0aGUgZGF0YSBvYmplY3QgaW4gdGhlIHByb3ZpZGVkIGRhdGEgYXJyYXkuICovXG4gIGluZGV4PzogbnVtYmVyO1xuXG4gIC8qKiBMZW5ndGggb2YgdGhlIG51bWJlciBvZiB0b3RhbCByb3dzLiAqL1xuICBjb3VudD86IG51bWJlcjtcblxuICAvKiogVHJ1ZSBpZiB0aGlzIGNlbGwgaXMgY29udGFpbmVkIGluIHRoZSBmaXJzdCByb3cuICovXG4gIGZpcnN0PzogYm9vbGVhbjtcblxuICAvKiogVHJ1ZSBpZiB0aGlzIGNlbGwgaXMgY29udGFpbmVkIGluIHRoZSBsYXN0IHJvdy4gKi9cbiAgbGFzdD86IGJvb2xlYW47XG5cbiAgLyoqIFRydWUgaWYgdGhpcyBjZWxsIGlzIGNvbnRhaW5lZCBpbiBhIHJvdyB3aXRoIGFuIGV2ZW4tbnVtYmVyZWQgaW5kZXguICovXG4gIGV2ZW4/OiBib29sZWFuO1xuXG4gIC8qKiBUcnVlIGlmIHRoaXMgY2VsbCBpcyBjb250YWluZWQgaW4gYSByb3cgd2l0aCBhbiBvZGQtbnVtYmVyZWQgaW5kZXguICovXG4gIG9kZD86IGJvb2xlYW47XG59XG5cbi8qKlxuICogQ29udGV4dCBwcm92aWRlZCB0byB0aGUgcm93IGNlbGxzIHdoZW4gYG11bHRpVGVtcGxhdGVEYXRhUm93c2AgaXMgdHJ1ZS4gVGhpcyBjb250ZXh0IGlzIHRoZSBzYW1lXG4gKiBhcyBDZGtDZWxsT3V0bGV0Um93Q29udGV4dCBleGNlcHQgdGhhdCB0aGUgc2luZ2xlIGBpbmRleGAgdmFsdWUgaXMgcmVwbGFjZWQgYnkgYGRhdGFJbmRleGAgYW5kXG4gKiBgcmVuZGVySW5kZXhgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIENka0NlbGxPdXRsZXRNdWx0aVJvd0NvbnRleHQ8VD4ge1xuICAvKiogRGF0YSBmb3IgdGhlIHJvdyB0aGF0IHRoaXMgY2VsbCBpcyBsb2NhdGVkIHdpdGhpbi4gKi9cbiAgJGltcGxpY2l0PzogVDtcblxuICAvKiogSW5kZXggb2YgdGhlIGRhdGEgb2JqZWN0IGluIHRoZSBwcm92aWRlZCBkYXRhIGFycmF5LiAqL1xuICBkYXRhSW5kZXg/OiBudW1iZXI7XG5cbiAgLyoqIEluZGV4IGxvY2F0aW9uIG9mIHRoZSByZW5kZXJlZCByb3cgdGhhdCB0aGlzIGNlbGwgaXMgbG9jYXRlZCB3aXRoaW4uICovXG4gIHJlbmRlckluZGV4PzogbnVtYmVyO1xuXG4gIC8qKiBMZW5ndGggb2YgdGhlIG51bWJlciBvZiB0b3RhbCByb3dzLiAqL1xuICBjb3VudD86IG51bWJlcjtcblxuICAvKiogVHJ1ZSBpZiB0aGlzIGNlbGwgaXMgY29udGFpbmVkIGluIHRoZSBmaXJzdCByb3cuICovXG4gIGZpcnN0PzogYm9vbGVhbjtcblxuICAvKiogVHJ1ZSBpZiB0aGlzIGNlbGwgaXMgY29udGFpbmVkIGluIHRoZSBsYXN0IHJvdy4gKi9cbiAgbGFzdD86IGJvb2xlYW47XG5cbiAgLyoqIFRydWUgaWYgdGhpcyBjZWxsIGlzIGNvbnRhaW5lZCBpbiBhIHJvdyB3aXRoIGFuIGV2ZW4tbnVtYmVyZWQgaW5kZXguICovXG4gIGV2ZW4/OiBib29sZWFuO1xuXG4gIC8qKiBUcnVlIGlmIHRoaXMgY2VsbCBpcyBjb250YWluZWQgaW4gYSByb3cgd2l0aCBhbiBvZGQtbnVtYmVyZWQgaW5kZXguICovXG4gIG9kZD86IGJvb2xlYW47XG59XG5cbi8qKlxuICogT3V0bGV0IGZvciByZW5kZXJpbmcgY2VsbHMgaW5zaWRlIG9mIGEgcm93IG9yIGhlYWRlciByb3cuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbkBEaXJlY3RpdmUoe3NlbGVjdG9yOiAnW2Nka0NlbGxPdXRsZXRdJ30pXG5leHBvcnQgY2xhc3MgQ2RrQ2VsbE91dGxldCBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qKiBUaGUgb3JkZXJlZCBsaXN0IG9mIGNlbGxzIHRvIHJlbmRlciB3aXRoaW4gdGhpcyBvdXRsZXQncyB2aWV3IGNvbnRhaW5lciAqL1xuICBjZWxsczogQ2RrQ2VsbERlZltdO1xuXG4gIC8qKiBUaGUgZGF0YSBjb250ZXh0IHRvIGJlIHByb3ZpZGVkIHRvIGVhY2ggY2VsbCAqL1xuICBjb250ZXh0OiBhbnk7XG5cbiAgLyoqXG4gICAqIFN0YXRpYyBwcm9wZXJ0eSBjb250YWluaW5nIHRoZSBsYXRlc3QgY29uc3RydWN0ZWQgaW5zdGFuY2Ugb2YgdGhpcyBjbGFzcy5cbiAgICogVXNlZCBieSB0aGUgQ0RLIHRhYmxlIHdoZW4gZWFjaCBDZGtIZWFkZXJSb3cgYW5kIENka1JvdyBjb21wb25lbnQgaXMgY3JlYXRlZCB1c2luZ1xuICAgKiBjcmVhdGVFbWJlZGRlZFZpZXcuIEFmdGVyIG9uZSBvZiB0aGVzZSBjb21wb25lbnRzIGFyZSBjcmVhdGVkLCB0aGlzIHByb3BlcnR5IHdpbGwgcHJvdmlkZVxuICAgKiBhIGhhbmRsZSB0byBwcm92aWRlIHRoYXQgY29tcG9uZW50J3MgY2VsbHMgYW5kIGNvbnRleHQuIEFmdGVyIGluaXQsIHRoZSBDZGtDZWxsT3V0bGV0IHdpbGxcbiAgICogY29uc3RydWN0IHRoZSBjZWxscyB3aXRoIHRoZSBwcm92aWRlZCBjb250ZXh0LlxuICAgKi9cbiAgc3RhdGljIG1vc3RSZWNlbnRDZWxsT3V0bGV0OiBDZGtDZWxsT3V0bGV0IHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IocHVibGljIF92aWV3Q29udGFpbmVyOiBWaWV3Q29udGFpbmVyUmVmKSB7XG4gICAgQ2RrQ2VsbE91dGxldC5tb3N0UmVjZW50Q2VsbE91dGxldCA9IHRoaXM7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICAvLyBJZiB0aGlzIHdhcyB0aGUgbGFzdCBvdXRsZXQgYmVpbmcgcmVuZGVyZWQgaW4gdGhlIHZpZXcsIHJlbW92ZSB0aGUgcmVmZXJlbmNlXG4gICAgLy8gZnJvbSB0aGUgc3RhdGljIHByb3BlcnR5IGFmdGVyIGl0IGhhcyBiZWVuIGRlc3Ryb3llZCB0byBhdm9pZCBsZWFraW5nIG1lbW9yeS5cbiAgICBpZiAoQ2RrQ2VsbE91dGxldC5tb3N0UmVjZW50Q2VsbE91dGxldCA9PT0gdGhpcykge1xuICAgICAgQ2RrQ2VsbE91dGxldC5tb3N0UmVjZW50Q2VsbE91dGxldCA9IG51bGw7XG4gICAgfVxuICB9XG59XG5cbi8qKiBIZWFkZXIgdGVtcGxhdGUgY29udGFpbmVyIHRoYXQgY29udGFpbnMgdGhlIGNlbGwgb3V0bGV0LiBBZGRzIHRoZSByaWdodCBjbGFzcyBhbmQgcm9sZS4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2Nkay1oZWFkZXItcm93LCB0cltjZGstaGVhZGVyLXJvd10nLFxuICB0ZW1wbGF0ZTogQ0RLX1JPV19URU1QTEFURSxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstaGVhZGVyLXJvdycsXG4gICAgJ3JvbGUnOiAncm93JyxcbiAgfSxcbiAgLy8gU2VlIG5vdGUgb24gQ2RrVGFibGUgZm9yIGV4cGxhbmF0aW9uIG9uIHdoeSB0aGlzIHVzZXMgdGhlIGRlZmF1bHQgY2hhbmdlIGRldGVjdGlvbiBzdHJhdGVneS5cbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOnZhbGlkYXRlLWRlY29yYXRvcnNcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5EZWZhdWx0LFxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtIZWFkZXJSb3cge31cblxuLyoqIEZvb3RlciB0ZW1wbGF0ZSBjb250YWluZXIgdGhhdCBjb250YWlucyB0aGUgY2VsbCBvdXRsZXQuIEFkZHMgdGhlIHJpZ2h0IGNsYXNzIGFuZCByb2xlLiAqL1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAnY2RrLWZvb3Rlci1yb3csIHRyW2Nkay1mb290ZXItcm93XScsXG4gIHRlbXBsYXRlOiBDREtfUk9XX1RFTVBMQVRFLFxuICBob3N0OiB7XG4gICAgJ2NsYXNzJzogJ2Nkay1mb290ZXItcm93JyxcbiAgICAncm9sZSc6ICdyb3cnLFxuICB9LFxuICAvLyBTZWUgbm90ZSBvbiBDZGtUYWJsZSBmb3IgZXhwbGFuYXRpb24gb24gd2h5IHRoaXMgdXNlcyB0aGUgZGVmYXVsdCBjaGFuZ2UgZGV0ZWN0aW9uIHN0cmF0ZWd5LlxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6dmFsaWRhdGUtZGVjb3JhdG9yc1xuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5LkRlZmF1bHQsXG4gIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsXG59KVxuZXhwb3J0IGNsYXNzIENka0Zvb3RlclJvdyB7fVxuXG4vKiogRGF0YSByb3cgdGVtcGxhdGUgY29udGFpbmVyIHRoYXQgY29udGFpbnMgdGhlIGNlbGwgb3V0bGV0LiBBZGRzIHRoZSByaWdodCBjbGFzcyBhbmQgcm9sZS4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2Nkay1yb3csIHRyW2Nkay1yb3ddJyxcbiAgdGVtcGxhdGU6IENES19ST1dfVEVNUExBVEUsXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLXJvdycsXG4gICAgJ3JvbGUnOiAncm93JyxcbiAgfSxcbiAgLy8gU2VlIG5vdGUgb24gQ2RrVGFibGUgZm9yIGV4cGxhbmF0aW9uIG9uIHdoeSB0aGlzIHVzZXMgdGhlIGRlZmF1bHQgY2hhbmdlIGRldGVjdGlvbiBzdHJhdGVneS5cbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOnZhbGlkYXRlLWRlY29yYXRvcnNcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5EZWZhdWx0LFxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtSb3cge31cblxuLyoqIFJvdyB0aGF0IGNhbiBiZSB1c2VkIHRvIGRpc3BsYXkgYSBtZXNzYWdlIHdoZW4gbm8gZGF0YSBpcyBzaG93biBpbiB0aGUgdGFibGUuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICduZy10ZW1wbGF0ZVtjZGtOb0RhdGFSb3ddJyxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrTm9EYXRhUm93IHtcbiAgX2NvbnRlbnRDbGFzc05hbWUgPSAnY2RrLW5vLWRhdGEtcm93JztcbiAgY29uc3RydWN0b3IocHVibGljIHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxhbnk+KSB7fVxufVxuIl19