/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __decorate, __metadata, __param } from "tslib";
import { ChangeDetectionStrategy, Component, Directive, IterableDiffers, TemplateRef, ViewContainerRef, ViewEncapsulation, Inject, Optional } from '@angular/core';
import { mixinHasStickyInput } from './can-stick';
import { CDK_TABLE } from './tokens';
/**
 * The row template that can be used by the mat-table. Should not be used outside of the
 * material library.
 */
export const CDK_ROW_TEMPLATE = `<ng-container cdkCellOutlet></ng-container>`;
/**
 * Base class for the CdkHeaderRowDef and CdkRowDef that handles checking their columns inputs
 * for changes and notifying the table.
 */
let BaseRowDef = /** @class */ (() => {
    let BaseRowDef = class BaseRowDef {
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
    };
    BaseRowDef = __decorate([
        Directive(),
        __metadata("design:paramtypes", [TemplateRef, IterableDiffers])
    ], BaseRowDef);
    return BaseRowDef;
})();
export { BaseRowDef };
// Boilerplate for applying mixins to CdkHeaderRowDef.
/** @docs-private */
class CdkHeaderRowDefBase extends BaseRowDef {
}
const _CdkHeaderRowDefBase = mixinHasStickyInput(CdkHeaderRowDefBase);
/**
 * Header row definition for the CDK table.
 * Captures the header row's template and other header properties such as the columns to display.
 */
let CdkHeaderRowDef = /** @class */ (() => {
    let CdkHeaderRowDef = class CdkHeaderRowDef extends _CdkHeaderRowDefBase {
        constructor(template, _differs, _table) {
            super(template, _differs);
            this._table = _table;
        }
        // Prerender fails to recognize that ngOnChanges in a part of this class through inheritance.
        // Explicitly define it so that the method is called as part of the Angular lifecycle.
        ngOnChanges(changes) {
            super.ngOnChanges(changes);
        }
    };
    CdkHeaderRowDef = __decorate([
        Directive({
            selector: '[cdkHeaderRowDef]',
            inputs: ['columns: cdkHeaderRowDef', 'sticky: cdkHeaderRowDefSticky'],
        }),
        __param(2, Inject(CDK_TABLE)), __param(2, Optional()),
        __metadata("design:paramtypes", [TemplateRef,
            IterableDiffers, Object])
    ], CdkHeaderRowDef);
    return CdkHeaderRowDef;
})();
export { CdkHeaderRowDef };
// Boilerplate for applying mixins to CdkFooterRowDef.
/** @docs-private */
class CdkFooterRowDefBase extends BaseRowDef {
}
const _CdkFooterRowDefBase = mixinHasStickyInput(CdkFooterRowDefBase);
/**
 * Footer row definition for the CDK table.
 * Captures the footer row's template and other footer properties such as the columns to display.
 */
let CdkFooterRowDef = /** @class */ (() => {
    let CdkFooterRowDef = class CdkFooterRowDef extends _CdkFooterRowDefBase {
        constructor(template, _differs, _table) {
            super(template, _differs);
            this._table = _table;
        }
        // Prerender fails to recognize that ngOnChanges in a part of this class through inheritance.
        // Explicitly define it so that the method is called as part of the Angular lifecycle.
        ngOnChanges(changes) {
            super.ngOnChanges(changes);
        }
    };
    CdkFooterRowDef = __decorate([
        Directive({
            selector: '[cdkFooterRowDef]',
            inputs: ['columns: cdkFooterRowDef', 'sticky: cdkFooterRowDefSticky'],
        }),
        __param(2, Inject(CDK_TABLE)), __param(2, Optional()),
        __metadata("design:paramtypes", [TemplateRef,
            IterableDiffers, Object])
    ], CdkFooterRowDef);
    return CdkFooterRowDef;
})();
export { CdkFooterRowDef };
/**
 * Data row definition for the CDK table.
 * Captures the header row's template and other row properties such as the columns to display and
 * a when predicate that describes when this row should be used.
 */
let CdkRowDef = /** @class */ (() => {
    let CdkRowDef = class CdkRowDef extends BaseRowDef {
        // TODO(andrewseguin): Add an input for providing a switch function to determine
        //   if this template should be used.
        constructor(template, _differs, _table) {
            super(template, _differs);
            this._table = _table;
        }
    };
    CdkRowDef = __decorate([
        Directive({
            selector: '[cdkRowDef]',
            inputs: ['columns: cdkRowDefColumns', 'when: cdkRowDefWhen'],
        }),
        __param(2, Inject(CDK_TABLE)), __param(2, Optional()),
        __metadata("design:paramtypes", [TemplateRef,
            IterableDiffers, Object])
    ], CdkRowDef);
    return CdkRowDef;
})();
export { CdkRowDef };
/**
 * Outlet for rendering cells inside of a row or header row.
 * @docs-private
 */
let CdkCellOutlet = /** @class */ (() => {
    var CdkCellOutlet_1;
    let CdkCellOutlet = CdkCellOutlet_1 = class CdkCellOutlet {
        constructor(_viewContainer) {
            this._viewContainer = _viewContainer;
            CdkCellOutlet_1.mostRecentCellOutlet = this;
        }
        ngOnDestroy() {
            // If this was the last outlet being rendered in the view, remove the reference
            // from the static property after it has been destroyed to avoid leaking memory.
            if (CdkCellOutlet_1.mostRecentCellOutlet === this) {
                CdkCellOutlet_1.mostRecentCellOutlet = null;
            }
        }
    };
    /**
     * Static property containing the latest constructed instance of this class.
     * Used by the CDK table when each CdkHeaderRow and CdkRow component is created using
     * createEmbeddedView. After one of these components are created, this property will provide
     * a handle to provide that component's cells and context. After init, the CdkCellOutlet will
     * construct the cells with the provided context.
     */
    CdkCellOutlet.mostRecentCellOutlet = null;
    CdkCellOutlet = CdkCellOutlet_1 = __decorate([
        Directive({ selector: '[cdkCellOutlet]' }),
        __metadata("design:paramtypes", [ViewContainerRef])
    ], CdkCellOutlet);
    return CdkCellOutlet;
})();
export { CdkCellOutlet };
/** Header template container that contains the cell outlet. Adds the right class and role. */
let CdkHeaderRow = /** @class */ (() => {
    let CdkHeaderRow = class CdkHeaderRow {
    };
    CdkHeaderRow = __decorate([
        Component({
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
        })
    ], CdkHeaderRow);
    return CdkHeaderRow;
})();
export { CdkHeaderRow };
/** Footer template container that contains the cell outlet. Adds the right class and role. */
let CdkFooterRow = /** @class */ (() => {
    let CdkFooterRow = class CdkFooterRow {
    };
    CdkFooterRow = __decorate([
        Component({
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
        })
    ], CdkFooterRow);
    return CdkFooterRow;
})();
export { CdkFooterRow };
/** Data row template container that contains the cell outlet. Adds the right class and role. */
let CdkRow = /** @class */ (() => {
    let CdkRow = class CdkRow {
    };
    CdkRow = __decorate([
        Component({
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
        })
    ], CdkRow);
    return CdkRow;
})();
export { CdkRow };
/** Row that can be used to display a message when no data is shown in the table. */
let CdkNoDataRow = /** @class */ (() => {
    let CdkNoDataRow = class CdkNoDataRow {
        constructor(templateRef) {
            this.templateRef = templateRef;
        }
    };
    CdkNoDataRow = __decorate([
        Directive({
            selector: 'ng-template[cdkNoDataRow]'
        }),
        __metadata("design:paramtypes", [TemplateRef])
    ], CdkNoDataRow);
    return CdkNoDataRow;
})();
export { CdkNoDataRow };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm93LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90YWJsZS9yb3cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUdILE9BQU8sRUFDTCx1QkFBdUIsRUFDdkIsU0FBUyxFQUNULFNBQVMsRUFHVCxlQUFlLEVBSWYsV0FBVyxFQUNYLGdCQUFnQixFQUNoQixpQkFBaUIsRUFDakIsTUFBTSxFQUNOLFFBQVEsRUFDVCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQXlCLG1CQUFtQixFQUFDLE1BQU0sYUFBYSxDQUFDO0FBRXhFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFbkM7OztHQUdHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sZ0JBQWdCLEdBQUcsNkNBQTZDLENBQUM7QUFFOUU7OztHQUdHO0FBRUg7SUFBQSxJQUFzQixVQUFVLEdBQWhDLE1BQXNCLFVBQVU7UUFPOUI7UUFDSSxvQkFBb0IsQ0FBUSxRQUEwQixFQUFZLFFBQXlCO1lBQS9ELGFBQVEsR0FBUixRQUFRLENBQWtCO1lBQVksYUFBUSxHQUFSLFFBQVEsQ0FBaUI7UUFDL0YsQ0FBQztRQUVELFdBQVcsQ0FBQyxPQUFzQjtZQUNoQyw4RkFBOEY7WUFDOUYsaUVBQWlFO1lBQ2pFLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFO2dCQUN4QixNQUFNLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUM5RSxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUMzRCxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUNuQztRQUNILENB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QztPQUNXLE1BQU0sQ0FDbEI7SUFBRCxhQUFDO0tBQUE7U0FEWSxNQUFNO0FBR25CLG9GQUFvRjtBQUlwRjtJQUFBLElBQWEsWUFBWSxHQUF6QixNQUFhLFlBQVk7UUFDdkIsWUFBbUIsV0FBNkI7WUFBN0IsZ0JBQVcsR0FBWCxXQUFXLENBQWtCO1FBQUcsQ0FBQztLQUNyRCxDQUFBO0lBRlksWUFBWTtRQUh4QixTQUFTLENBQUM7WUFDVCxRQUFRLEVBQUUsMkJBQTJCO1NBQ3RDLENBQUM7eUNBRWdDLFdBQVc7T0FEaEMsWUFBWSxDQUV4QjtJQUFELG1CQUFDO0tBQUE7U0FGWSxZQUFZIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Qm9vbGVhbklucHV0fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gIENvbXBvbmVudCxcbiAgRGlyZWN0aXZlLFxuICBJdGVyYWJsZUNoYW5nZXMsXG4gIEl0ZXJhYmxlRGlmZmVyLFxuICBJdGVyYWJsZURpZmZlcnMsXG4gIE9uQ2hhbmdlcyxcbiAgT25EZXN0cm95LFxuICBTaW1wbGVDaGFuZ2VzLFxuICBUZW1wbGF0ZVJlZixcbiAgVmlld0NvbnRhaW5lclJlZixcbiAgVmlld0VuY2Fwc3VsYXRpb24sXG4gIEluamVjdCxcbiAgT3B0aW9uYWxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0NhblN0aWNrLCBDYW5TdGlja0N0b3IsIG1peGluSGFzU3RpY2t5SW5wdXR9IGZyb20gJy4vY2FuLXN0aWNrJztcbmltcG9ydCB7Q2RrQ2VsbERlZiwgQ2RrQ29sdW1uRGVmfSBmcm9tICcuL2NlbGwnO1xuaW1wb3J0IHtDREtfVEFCTEV9IGZyb20gJy4vdG9rZW5zJztcblxuLyoqXG4gKiBUaGUgcm93IHRlbXBsYXRlIHRoYXQgY2FuIGJlIHVzZWQgYnkgdGhlIG1hdC10YWJsZS4gU2hvdWxkIG5vdCBiZSB1c2VkIG91dHNpZGUgb2YgdGhlXG4gKiBtYXRlcmlhbCBsaWJyYXJ5LlxuICovXG5leHBvcnQgY29uc3QgQ0RLX1JPV19URU1QTEFURSA9IGA8bmctY29udGFpbmVyIGNka0NlbGxPdXRsZXQ+PC9uZy1jb250YWluZXI+YDtcblxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciB0aGUgQ2RrSGVhZGVyUm93RGVmIGFuZCBDZGtSb3dEZWYgdGhhdCBoYW5kbGVzIGNoZWNraW5nIHRoZWlyIGNvbHVtbnMgaW5wdXRzXG4gKiBmb3IgY2hhbmdlcyBhbmQgbm90aWZ5aW5nIHRoZSB0YWJsZS5cbiAqL1xuQERpcmVjdGl2ZSgpXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQmFzZVJvd0RlZiBpbXBsZW1lbnRzIE9uQ2hhbmdlcyB7XG4gIC8qKiBUaGUgY29sdW1ucyB0byBiZSBkaXNwbGF5ZWQgb24gdGhpcyByb3cuICovXG4gIGNvbHVtbnM6IEl0ZXJhYmxlPHN0cmluZz47XG5cbiAgLyoqIERpZmZlciB1c2VkIHRvIGNoZWNrIGlmIGFueSBjaGFuZ2VzIHdlcmUgbWFkZSB0byB0aGUgY29sdW1ucy4gKi9cbiAgcHJvdGVjdGVkIF9jb2x1bW5zRGlmZmVyOiBJdGVyYWJsZURpZmZlcjxhbnk+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgLyoqIEBkb2NzLXByaXZhdGUgKi8gcHVibGljIHRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxhbnk+LCBwcm90ZWN0ZWQgX2RpZmZlcnM6IEl0ZXJhYmxlRGlmZmVycykge1xuICB9XG5cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIC8vIENyZWF0ZSBhIG5ldyBjb2x1bW5zIGRpZmZlciBpZiBvbmUgZG9lcyBub3QgeWV0IGV4aXN0LiBJbml0aWFsaXplIGl0IGJhc2VkIG9uIGluaXRpYWwgdmFsdWVcbiAgICAvLyBvZiB0aGUgY29sdW1ucyBwcm9wZXJ0eSBvciBhbiBlbXB0eSBhcnJheSBpZiBub25lIGlzIHByb3ZpZGVkLlxuICAgIGlmICghdGhpcy5fY29sdW1uc0RpZmZlcikge1xuICAgICAgY29uc3QgY29sdW1ucyA9IChjaGFuZ2VzWydjb2x1bW5zJ10gJiYgY2hhbmdlc1snY29sdW1ucyddLmN1cnJlbnRWYWx1ZSkgfHwgW107XG4gICAgICB0aGlzLl9jb2x1bW5zRGlmZmVyID0gdGhpcy5fZGlmZmVycy5maW5kKGNvbHVtbnMpLmNyZWF0ZSgpO1xuICAgICAgdGhpcy5fY29sdW1uc0RpZmZlci5kaWZmKGNvbHVtbnMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gdGhlIGN1cnJlbnQgY29sdW1ucyBhbmQgdGhlIGNvbHVtbnMgZnJvbSB0aGUgbGFzdCBkaWZmLCBvciBudWxsXG4gICAqIGlmIHRoZXJlIGlzIG5vIGRpZmZlcmVuY2UuXG4gICAqL1xuICBnZXRDb2x1bW5zRGlmZigpOiBJdGVyYWJsZUNoYW5nZXM8YW55PnxudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fY29sdW1uc0RpZmZlci5kaWZmKHRoaXMuY29sdW1ucyk7XG4gIH1cblxuICAvKiogR2V0cyB0aGlzIHJvdyBkZWYncyByZWxldmFudCBjZWxsIHRlbXBsYXRlIGZyb20gdGhlIHByb3ZpZGVkIGNvbHVtbiBkZWYuICovXG4gIGV4dHJhY3RDZWxsVGVtcGxhdGUoY29sdW1uOiBDZGtDb2x1bW5EZWYpOiBUZW1wbGF0ZVJlZjxhbnk+IHtcbiAgICBpZiAodGhpcyBpbnN0YW5jZW9mIENka0hlYWRlclJvd0RlZikge1xuICAgICAgcmV0dXJuIGNvbHVtbi5oZWFkZXJDZWxsLnRlbXBsYXRlO1xuICAgIH1cbiAgICBpZiAodGhpcyBpbnN0YW5jZW9mIENka0Zvb3RlclJvd0RlZikge1xuICAgICAgcmV0dXJuIGNvbHVtbi5mb290ZXJDZWxsLnRlbXBsYXRlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY29sdW1uLmNlbGwudGVtcGxhdGU7XG4gICAgfVxuICB9XG59XG5cbi8vIEJvaWxlcnBsYXRlIGZvciBhcHBseWluZyBtaXhpbnMgdG8gQ2RrSGVhZGVyUm93RGVmLlxuLyoqIEBkb2NzLXByaXZhdGUgKi9cbmNsYXNzIENka0hlYWRlclJvd0RlZkJhc2UgZXh0ZW5kcyBCYXNlUm93RGVmIHt9XG5jb25zdCBfQ2RrSGVhZGVyUm93RGVmQmFzZTogQ2FuU3RpY2tDdG9yJnR5cGVvZiBDZGtIZWFkZXJSb3dEZWZCYXNlID1cbiAgICBtaXhpbkhhc1N0aWNreUlucHV0KENka0hlYWRlclJvd0RlZkJhc2UpO1xuXG4vKipcbiAqIEhlYWRlciByb3cgZGVmaW5pdGlvbiBmb3IgdGhlIENESyB0YWJsZS5cbiAqIENhcHR1cmVzIHRoZSBoZWFkZXIgcm93J3MgdGVtcGxhdGUgYW5kIG90aGVyIGhlYWRlciBwcm9wZXJ0aWVzIHN1Y2ggYXMgdGhlIGNvbHVtbnMgdG8gZGlzcGxheS5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka0hlYWRlclJvd0RlZl0nLFxuICBpbnB1dHM6IFsnY29sdW1uczogY2RrSGVhZGVyUm93RGVmJywgJ3N0aWNreTogY2RrSGVhZGVyUm93RGVmU3RpY2t5J10sXG59KVxuZXhwb3J0IGNsYXNzIENka0hlYWRlclJvd0RlZiBleHRlbmRzIF9DZGtIZWFkZXJSb3dEZWZCYXNlIGltcGxlbWVudHMgQ2FuU3RpY2ssIE9uQ2hhbmdlcyB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxhbnk+LFxuICAgIF9kaWZmZXJzOiBJdGVyYWJsZURpZmZlcnMsXG4gICAgQEluamVjdChDREtfVEFCTEUpIEBPcHRpb25hbCgpIHB1YmxpYyBfdGFibGU/OiBhbnkpIHtcbiAgICBzdXBlcih0ZW1wbGF0ZSwgX2RpZmZlcnMpO1xuICB9XG5cbiAgLy8gUHJlcmVuZGVyIGZhaWxzIHRvIHJlY29nbml6ZSB0aGF0IG5nT25DaGFuZ2VzIGluIGEgcGFydCBvZiB0aGlzIGNsYXNzIHRocm91Z2ggaW5oZXJpdGFuY2UuXG4gIC8vIEV4cGxpY2l0bHkgZGVmaW5lIGl0IHNvIHRoYXQgdGhlIG1ldGhvZCBpcyBjYWxsZWQgYXMgcGFydCBvZiB0aGUgQW5ndWxhciBsaWZlY3ljbGUuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICBzdXBlci5uZ09uQ2hhbmdlcyhjaGFuZ2VzKTtcbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9zdGlja3k6IEJvb2xlYW5JbnB1dDtcbn1cblxuLy8gQm9pbGVycGxhdGUgZm9yIGFwcGx5aW5nIG1peGlucyB0byBDZGtGb290ZXJSb3dEZWYuXG4vKiogQGRvY3MtcHJpdmF0ZSAqL1xuY2xhc3MgQ2RrRm9vdGVyUm93RGVmQmFzZSBleHRlbmRzIEJhc2VSb3dEZWYge31cbmNvbnN0IF9DZGtGb290ZXJSb3dEZWZCYXNlOiBDYW5TdGlja0N0b3ImdHlwZW9mIENka0Zvb3RlclJvd0RlZkJhc2UgPVxuICAgIG1peGluSGFzU3RpY2t5SW5wdXQoQ2RrRm9vdGVyUm93RGVmQmFzZSk7XG5cbi8qKlxuICogRm9vdGVyIHJvdyBkZWZpbml0aW9uIGZvciB0aGUgQ0RLIHRhYmxlLlxuICogQ2FwdHVyZXMgdGhlIGZvb3RlciByb3cncyB0ZW1wbGF0ZSBhbmQgb3RoZXIgZm9vdGVyIHByb3BlcnRpZXMgc3VjaCBhcyB0aGUgY29sdW1ucyB0byBkaXNwbGF5LlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrRm9vdGVyUm93RGVmXScsXG4gIGlucHV0czogWydjb2x1bW5zOiBjZGtGb290ZXJSb3dEZWYnLCAnc3RpY2t5OiBjZGtGb290ZXJSb3dEZWZTdGlja3knXSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrRm9vdGVyUm93RGVmIGV4dGVuZHMgX0Nka0Zvb3RlclJvd0RlZkJhc2UgaW1wbGVtZW50cyBDYW5TdGljaywgT25DaGFuZ2VzIHtcbiAgY29uc3RydWN0b3IoXG4gICAgdGVtcGxhdGU6IFRlbXBsYXRlUmVmPGFueT4sXG4gICAgX2RpZmZlcnM6IEl0ZXJhYmxlRGlmZmVycyxcbiAgICBASW5qZWN0KENES19UQUJMRSkgQE9wdGlvbmFsKCkgcHVibGljIF90YWJsZT86IGFueSkge1xuICAgIHN1cGVyKHRlbXBsYXRlLCBfZGlmZmVycyk7XG4gIH1cblxuICAvLyBQcmVyZW5kZXIgZmFpbHMgdG8gcmVjb2duaXplIHRoYXQgbmdPbkNoYW5nZXMgaW4gYSBwYXJ0IG9mIHRoaXMgY2xhc3MgdGhyb3VnaCBpbmhlcml0YW5jZS5cbiAgLy8gRXhwbGljaXRseSBkZWZpbmUgaXQgc28gdGhhdCB0aGUgbWV0aG9kIGlzIGNhbGxlZCBhcyBwYXJ0IG9mIHRoZSBBbmd1bGFyIGxpZmVjeWNsZS5cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIHN1cGVyLm5nT25DaGFuZ2VzKGNoYW5nZXMpO1xuICB9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX3N0aWNreTogQm9vbGVhbklucHV0O1xufVxuXG4vKipcbiAqIERhdGEgcm93IGRlZmluaXRpb24gZm9yIHRoZSBDREsgdGFibGUuXG4gKiBDYXB0dXJlcyB0aGUgaGVhZGVyIHJvdydzIHRlbXBsYXRlIGFuZCBvdGhlciByb3cgcHJvcGVydGllcyBzdWNoIGFzIHRoZSBjb2x1bW5zIHRvIGRpc3BsYXkgYW5kXG4gKiBhIHdoZW4gcHJlZGljYXRlIHRoYXQgZGVzY3JpYmVzIHdoZW4gdGhpcyByb3cgc2hvdWxkIGJlIHVzZWQuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtSb3dEZWZdJyxcbiAgaW5wdXRzOiBbJ2NvbHVtbnM6IGNka1Jvd0RlZkNvbHVtbnMnLCAnd2hlbjogY2RrUm93RGVmV2hlbiddLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtSb3dEZWY8VD4gZXh0ZW5kcyBCYXNlUm93RGVmIHtcbiAgLyoqXG4gICAqIEZ1bmN0aW9uIHRoYXQgc2hvdWxkIHJldHVybiB0cnVlIGlmIHRoaXMgcm93IHRlbXBsYXRlIHNob3VsZCBiZSB1c2VkIGZvciB0aGUgcHJvdmlkZWQgaW5kZXhcbiAgICogYW5kIHJvdyBkYXRhLiBJZiBsZWZ0IHVuZGVmaW5lZCwgdGhpcyByb3cgd2lsbCBiZSBjb25zaWRlcmVkIHRoZSBkZWZhdWx0IHJvdyB0ZW1wbGF0ZSB0byB1c2VcbiAgICogd2hlbiBubyBvdGhlciB3aGVuIGZ1bmN0aW9ucyByZXR1cm4gdHJ1ZSBmb3IgdGhlIGRhdGEuXG4gICAqIEZvciBldmVyeSByb3csIHRoZXJlIG11c3QgYmUgYXQgbGVhc3Qgb25lIHdoZW4gZnVuY3Rpb24gdGhhdCBwYXNzZXMgb3IgYW4gdW5kZWZpbmVkIHRvIGRlZmF1bHQuXG4gICAqL1xuICB3aGVuOiAoaW5kZXg6IG51bWJlciwgcm93RGF0YTogVCkgPT4gYm9vbGVhbjtcblxuICAvLyBUT0RPKGFuZHJld3NlZ3Vpbik6IEFkZCBhbiBpbnB1dCBmb3IgcHJvdmlkaW5nIGEgc3dpdGNoIGZ1bmN0aW9uIHRvIGRldGVybWluZVxuICAvLyAgIGlmIHRoaXMgdGVtcGxhdGUgc2hvdWxkIGJlIHVzZWQuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxhbnk+LFxuICAgIF9kaWZmZXJzOiBJdGVyYWJsZURpZmZlcnMsXG4gICAgQEluamVjdChDREtfVEFCTEUpIEBPcHRpb25hbCgpIHB1YmxpYyBfdGFibGU/OiBhbnkpIHtcbiAgICBzdXBlcih0ZW1wbGF0ZSwgX2RpZmZlcnMpO1xuICB9XG59XG5cbi8qKiBDb250ZXh0IHByb3ZpZGVkIHRvIHRoZSByb3cgY2VsbHMgd2hlbiBgbXVsdGlUZW1wbGF0ZURhdGFSb3dzYCBpcyBmYWxzZSAqL1xuZXhwb3J0IGludGVyZmFjZSBDZGtDZWxsT3V0bGV0Um93Q29udGV4dDxUPiB7XG4gIC8qKiBEYXRhIGZvciB0aGUgcm93IHRoYXQgdGhpcyBjZWxsIGlzIGxvY2F0ZWQgd2l0aGluLiAqL1xuICAkaW1wbGljaXQ/OiBUO1xuXG4gIC8qKiBJbmRleCBvZiB0aGUgZGF0YSBvYmplY3QgaW4gdGhlIHByb3ZpZGVkIGRhdGEgYXJyYXkuICovXG4gIGluZGV4PzogbnVtYmVyO1xuXG4gIC8qKiBMZW5ndGggb2YgdGhlIG51bWJlciBvZiB0b3RhbCByb3dzLiAqL1xuICBjb3VudD86IG51bWJlcjtcblxuICAvKiogVHJ1ZSBpZiB0aGlzIGNlbGwgaXMgY29udGFpbmVkIGluIHRoZSBmaXJzdCByb3cuICovXG4gIGZpcnN0PzogYm9vbGVhbjtcblxuICAvKiogVHJ1ZSBpZiB0aGlzIGNlbGwgaXMgY29udGFpbmVkIGluIHRoZSBsYXN0IHJvdy4gKi9cbiAgbGFzdD86IGJvb2xlYW47XG5cbiAgLyoqIFRydWUgaWYgdGhpcyBjZWxsIGlzIGNvbnRhaW5lZCBpbiBhIHJvdyB3aXRoIGFuIGV2ZW4tbnVtYmVyZWQgaW5kZXguICovXG4gIGV2ZW4/OiBib29sZWFuO1xuXG4gIC8qKiBUcnVlIGlmIHRoaXMgY2VsbCBpcyBjb250YWluZWQgaW4gYSByb3cgd2l0aCBhbiBvZGQtbnVtYmVyZWQgaW5kZXguICovXG4gIG9kZD86IGJvb2xlYW47XG59XG5cbi8qKlxuICogQ29udGV4dCBwcm92aWRlZCB0byB0aGUgcm93IGNlbGxzIHdoZW4gYG11bHRpVGVtcGxhdGVEYXRhUm93c2AgaXMgdHJ1ZS4gVGhpcyBjb250ZXh0IGlzIHRoZSBzYW1lXG4gKiBhcyBDZGtDZWxsT3V0bGV0Um93Q29udGV4dCBleGNlcHQgdGhhdCB0aGUgc2luZ2xlIGBpbmRleGAgdmFsdWUgaXMgcmVwbGFjZWQgYnkgYGRhdGFJbmRleGAgYW5kXG4gKiBgcmVuZGVySW5kZXhgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIENka0NlbGxPdXRsZXRNdWx0aVJvd0NvbnRleHQ8VD4ge1xuICAvKiogRGF0YSBmb3IgdGhlIHJvdyB0aGF0IHRoaXMgY2VsbCBpcyBsb2NhdGVkIHdpdGhpbi4gKi9cbiAgJGltcGxpY2l0PzogVDtcblxuICAvKiogSW5kZXggb2YgdGhlIGRhdGEgb2JqZWN0IGluIHRoZSBwcm92aWRlZCBkYXRhIGFycmF5LiAqL1xuICBkYXRhSW5kZXg/OiBudW1iZXI7XG5cbiAgLyoqIEluZGV4IGxvY2F0aW9uIG9mIHRoZSByZW5kZXJlZCByb3cgdGhhdCB0aGlzIGNlbGwgaXMgbG9jYXRlZCB3aXRoaW4uICovXG4gIHJlbmRlckluZGV4PzogbnVtYmVyO1xuXG4gIC8qKiBMZW5ndGggb2YgdGhlIG51bWJlciBvZiB0b3RhbCByb3dzLiAqL1xuICBjb3VudD86IG51bWJlcjtcblxuICAvKiogVHJ1ZSBpZiB0aGlzIGNlbGwgaXMgY29udGFpbmVkIGluIHRoZSBmaXJzdCByb3cuICovXG4gIGZpcnN0PzogYm9vbGVhbjtcblxuICAvKiogVHJ1ZSBpZiB0aGlzIGNlbGwgaXMgY29udGFpbmVkIGluIHRoZSBsYXN0IHJvdy4gKi9cbiAgbGFzdD86IGJvb2xlYW47XG5cbiAgLyoqIFRydWUgaWYgdGhpcyBjZWxsIGlzIGNvbnRhaW5lZCBpbiBhIHJvdyB3aXRoIGFuIGV2ZW4tbnVtYmVyZWQgaW5kZXguICovXG4gIGV2ZW4/OiBib29sZWFuO1xuXG4gIC8qKiBUcnVlIGlmIHRoaXMgY2VsbCBpcyBjb250YWluZWQgaW4gYSByb3cgd2l0aCBhbiBvZGQtbnVtYmVyZWQgaW5kZXguICovXG4gIG9kZD86IGJvb2xlYW47XG59XG5cbi8qKlxuICogT3V0bGV0IGZvciByZW5kZXJpbmcgY2VsbHMgaW5zaWRlIG9mIGEgcm93IG9yIGhlYWRlciByb3cuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbkBEaXJlY3RpdmUoe3NlbGVjdG9yOiAnW2Nka0NlbGxPdXRsZXRdJ30pXG5leHBvcnQgY2xhc3MgQ2RrQ2VsbE91dGxldCBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qKiBUaGUgb3JkZXJlZCBsaXN0IG9mIGNlbGxzIHRvIHJlbmRlciB3aXRoaW4gdGhpcyBvdXRsZXQncyB2aWV3IGNvbnRhaW5lciAqL1xuICBjZWxsczogQ2RrQ2VsbERlZltdO1xuXG4gIC8qKiBUaGUgZGF0YSBjb250ZXh0IHRvIGJlIHByb3ZpZGVkIHRvIGVhY2ggY2VsbCAqL1xuICBjb250ZXh0OiBhbnk7XG5cbiAgLyoqXG4gICAqIFN0YXRpYyBwcm9wZXJ0eSBjb250YWluaW5nIHRoZSBsYXRlc3QgY29uc3RydWN0ZWQgaW5zdGFuY2Ugb2YgdGhpcyBjbGFzcy5cbiAgICogVXNlZCBieSB0aGUgQ0RLIHRhYmxlIHdoZW4gZWFjaCBDZGtIZWFkZXJSb3cgYW5kIENka1JvdyBjb21wb25lbnQgaXMgY3JlYXRlZCB1c2luZ1xuICAgKiBjcmVhdGVFbWJlZGRlZFZpZXcuIEFmdGVyIG9uZSBvZiB0aGVzZSBjb21wb25lbnRzIGFyZSBjcmVhdGVkLCB0aGlzIHByb3BlcnR5IHdpbGwgcHJvdmlkZVxuICAgKiBhIGhhbmRsZSB0byBwcm92aWRlIHRoYXQgY29tcG9uZW50J3MgY2VsbHMgYW5kIGNvbnRleHQuIEFmdGVyIGluaXQsIHRoZSBDZGtDZWxsT3V0bGV0IHdpbGxcbiAgICogY29uc3RydWN0IHRoZSBjZWxscyB3aXRoIHRoZSBwcm92aWRlZCBjb250ZXh0LlxuICAgKi9cbiAgc3RhdGljIG1vc3RSZWNlbnRDZWxsT3V0bGV0OiBDZGtDZWxsT3V0bGV0fG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBfdmlld0NvbnRhaW5lcjogVmlld0NvbnRhaW5lclJlZikge1xuICAgIENka0NlbGxPdXRsZXQubW9zdFJlY2VudENlbGxPdXRsZXQgPSB0aGlzO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgLy8gSWYgdGhpcyB3YXMgdGhlIGxhc3Qgb3V0bGV0IGJlaW5nIHJlbmRlcmVkIGluIHRoZSB2aWV3LCByZW1vdmUgdGhlIHJlZmVyZW5jZVxuICAgIC8vIGZyb20gdGhlIHN0YXRpYyBwcm9wZXJ0eSBhZnRlciBpdCBoYXMgYmVlbiBkZXN0cm95ZWQgdG8gYXZvaWQgbGVha2luZyBtZW1vcnkuXG4gICAgaWYgKENka0NlbGxPdXRsZXQubW9zdFJlY2VudENlbGxPdXRsZXQgPT09IHRoaXMpIHtcbiAgICAgIENka0NlbGxPdXRsZXQubW9zdFJlY2VudENlbGxPdXRsZXQgPSBudWxsO1xuICAgIH1cbiAgfVxufVxuXG4vKiogSGVhZGVyIHRlbXBsYXRlIGNvbnRhaW5lciB0aGF0IGNvbnRhaW5zIHRoZSBjZWxsIG91dGxldC4gQWRkcyB0aGUgcmlnaHQgY2xhc3MgYW5kIHJvbGUuICovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdjZGstaGVhZGVyLXJvdywgdHJbY2RrLWhlYWRlci1yb3ddJyxcbiAgdGVtcGxhdGU6IENES19ST1dfVEVNUExBVEUsXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLWhlYWRlci1yb3cnLFxuICAgICdyb2xlJzogJ3JvdycsXG4gIH0sXG4gIC8vIFNlZSBub3RlIG9uIENka1RhYmxlIGZvciBleHBsYW5hdGlvbiBvbiB3aHkgdGhpcyB1c2VzIHRoZSBkZWZhdWx0IGNoYW5nZSBkZXRlY3Rpb24gc3RyYXRlZ3kuXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTp2YWxpZGF0ZS1kZWNvcmF0b3JzXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuRGVmYXVsdCxcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrSGVhZGVyUm93IHtcbn1cblxuXG4vKiogRm9vdGVyIHRlbXBsYXRlIGNvbnRhaW5lciB0aGF0IGNvbnRhaW5zIHRoZSBjZWxsIG91dGxldC4gQWRkcyB0aGUgcmlnaHQgY2xhc3MgYW5kIHJvbGUuICovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdjZGstZm9vdGVyLXJvdywgdHJbY2RrLWZvb3Rlci1yb3ddJyxcbiAgdGVtcGxhdGU6IENES19ST1dfVEVNUExBVEUsXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLWZvb3Rlci1yb3cnLFxuICAgICdyb2xlJzogJ3JvdycsXG4gIH0sXG4gIC8vIFNlZSBub3RlIG9uIENka1RhYmxlIGZvciBleHBsYW5hdGlvbiBvbiB3aHkgdGhpcyB1c2VzIHRoZSBkZWZhdWx0IGNoYW5nZSBkZXRlY3Rpb24gc3RyYXRlZ3kuXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTp2YWxpZGF0ZS1kZWNvcmF0b3JzXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuRGVmYXVsdCxcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrRm9vdGVyUm93IHtcbn1cblxuLyoqIERhdGEgcm93IHRlbXBsYXRlIGNvbnRhaW5lciB0aGF0IGNvbnRhaW5zIHRoZSBjZWxsIG91dGxldC4gQWRkcyB0aGUgcmlnaHQgY2xhc3MgYW5kIHJvbGUuICovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdjZGstcm93LCB0cltjZGstcm93XScsXG4gIHRlbXBsYXRlOiBDREtfUk9XX1RFTVBMQVRFLFxuICBob3N0OiB7XG4gICAgJ2NsYXNzJzogJ2Nkay1yb3cnLFxuICAgICdyb2xlJzogJ3JvdycsXG4gIH0sXG4gIC8vIFNlZSBub3RlIG9uIENka1RhYmxlIGZvciBleHBsYW5hdGlvbiBvbiB3aHkgdGhpcyB1c2VzIHRoZSBkZWZhdWx0IGNoYW5nZSBkZXRlY3Rpb24gc3RyYXRlZ3kuXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTp2YWxpZGF0ZS1kZWNvcmF0b3JzXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuRGVmYXVsdCxcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrUm93IHtcbn1cblxuLyoqIFJvdyB0aGF0IGNhbiBiZSB1c2VkIHRvIGRpc3BsYXkgYSBtZXNzYWdlIHdoZW4gbm8gZGF0YSBpcyBzaG93biBpbiB0aGUgdGFibGUuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICduZy10ZW1wbGF0ZVtjZGtOb0RhdGFSb3ddJ1xufSlcbmV4cG9ydCBjbGFzcyBDZGtOb0RhdGFSb3cge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgdGVtcGxhdGVSZWY6IFRlbXBsYXRlUmVmPGFueT4pIHt9XG59XG4iXX0=