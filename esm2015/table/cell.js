/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/table/cell.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { ContentChild, Directive, ElementRef, Input, TemplateRef } from '@angular/core';
import { mixinHasStickyInput } from './can-stick';
/**
 * Base interface for a cell definition. Captures a column's cell template definition.
 * @record
 */
export function CellDef() { }
if (false) {
    /** @type {?} */
    CellDef.prototype.template;
}
/**
 * Cell definition for a CDK table.
 * Captures the template of a column's data row cell as well as cell-specific properties.
 */
export class CdkCellDef {
    /**
     * @param {?} template
     */
    constructor(/** @docs-private */ template) {
        this.template = template;
    }
}
CdkCellDef.decorators = [
    { type: Directive, args: [{ selector: '[cdkCellDef]' },] }
];
/** @nocollapse */
CdkCellDef.ctorParameters = () => [
    { type: TemplateRef }
];
if (false) {
    /**
     * \@docs-private
     * @type {?}
     */
    CdkCellDef.prototype.template;
}
/**
 * Header cell definition for a CDK table.
 * Captures the template of a column's header cell and as well as cell-specific properties.
 */
export class CdkHeaderCellDef {
    /**
     * @param {?} template
     */
    constructor(/** @docs-private */ template) {
        this.template = template;
    }
}
CdkHeaderCellDef.decorators = [
    { type: Directive, args: [{ selector: '[cdkHeaderCellDef]' },] }
];
/** @nocollapse */
CdkHeaderCellDef.ctorParameters = () => [
    { type: TemplateRef }
];
if (false) {
    /**
     * \@docs-private
     * @type {?}
     */
    CdkHeaderCellDef.prototype.template;
}
/**
 * Footer cell definition for a CDK table.
 * Captures the template of a column's footer cell and as well as cell-specific properties.
 */
export class CdkFooterCellDef {
    /**
     * @param {?} template
     */
    constructor(/** @docs-private */ template) {
        this.template = template;
    }
}
CdkFooterCellDef.decorators = [
    { type: Directive, args: [{ selector: '[cdkFooterCellDef]' },] }
];
/** @nocollapse */
CdkFooterCellDef.ctorParameters = () => [
    { type: TemplateRef }
];
if (false) {
    /**
     * \@docs-private
     * @type {?}
     */
    CdkFooterCellDef.prototype.template;
}
// Boilerplate for applying mixins to CdkColumnDef.
/**
 * \@docs-private
 */
class CdkColumnDefBase {
}
/** @type {?} */
const _CdkColumnDefBase = mixinHasStickyInput(CdkColumnDefBase);
/**
 * Column definition for the CDK table.
 * Defines a set of cells available for a table column.
 */
export class CdkColumnDef extends _CdkColumnDefBase {
    constructor() {
        super(...arguments);
        this._stickyEnd = false;
    }
    /**
     * Unique name for this column.
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
        // If the directive is set without a name (updated programatically), then this setter will
        // trigger with an empty string and should not overwrite the programatically set value.
        if (!name) {
            return;
        }
        this._name = name;
        this.cssClassFriendlyName = name.replace(/[^a-z0-9_-]/ig, '-');
    }
    /**
     * Whether this column should be sticky positioned on the end of the row. Should make sure
     * that it mimics the `CanStick` mixin such that `_hasStickyChanged` is set to true if the value
     * has been changed.
     * @return {?}
     */
    get stickyEnd() {
        return this._stickyEnd;
    }
    /**
     * @param {?} v
     * @return {?}
     */
    set stickyEnd(v) {
        /** @type {?} */
        const prevValue = this._stickyEnd;
        this._stickyEnd = coerceBooleanProperty(v);
        this._hasStickyChanged = prevValue !== this._stickyEnd;
    }
}
CdkColumnDef.decorators = [
    { type: Directive, args: [{
                selector: '[cdkColumnDef]',
                inputs: ['sticky'],
                providers: [{ provide: 'MAT_SORT_HEADER_COLUMN_DEF', useExisting: CdkColumnDef }],
            },] }
];
CdkColumnDef.propDecorators = {
    name: [{ type: Input, args: ['cdkColumnDef',] }],
    stickyEnd: [{ type: Input, args: ['stickyEnd',] }],
    cell: [{ type: ContentChild, args: [CdkCellDef,] }],
    headerCell: [{ type: ContentChild, args: [CdkHeaderCellDef,] }],
    footerCell: [{ type: ContentChild, args: [CdkFooterCellDef,] }]
};
if (false) {
    /** @type {?} */
    CdkColumnDef.ngAcceptInputType_sticky;
    /** @type {?} */
    CdkColumnDef.ngAcceptInputType_stickyEnd;
    /** @type {?} */
    CdkColumnDef.prototype._name;
    /** @type {?} */
    CdkColumnDef.prototype._stickyEnd;
    /**
     * \@docs-private
     * @type {?}
     */
    CdkColumnDef.prototype.cell;
    /**
     * \@docs-private
     * @type {?}
     */
    CdkColumnDef.prototype.headerCell;
    /**
     * \@docs-private
     * @type {?}
     */
    CdkColumnDef.prototype.footerCell;
    /**
     * Transformed version of the column name that can be used as part of a CSS classname. Excludes
     * all non-alphanumeric characters and the special characters '-' and '_'. Any characters that
     * do not match are replaced by the '-' character.
     * @type {?}
     */
    CdkColumnDef.prototype.cssClassFriendlyName;
}
/**
 * Base class for the cells. Adds a CSS classname that identifies the column it renders in.
 */
export class BaseCdkCell {
    /**
     * @param {?} columnDef
     * @param {?} elementRef
     */
    constructor(columnDef, elementRef) {
        /** @type {?} */
        const columnClassName = `cdk-column-${columnDef.cssClassFriendlyName}`;
        elementRef.nativeElement.classList.add(columnClassName);
    }
}
/**
 * Header cell template container that adds the right classes and role.
 */
export class CdkHeaderCell extends BaseCdkCell {
    /**
     * @param {?} columnDef
     * @param {?} elementRef
     */
    constructor(columnDef, elementRef) {
        super(columnDef, elementRef);
    }
}
CdkHeaderCell.decorators = [
    { type: Directive, args: [{
                selector: 'cdk-header-cell, th[cdk-header-cell]',
                host: {
                    'class': 'cdk-header-cell',
                    'role': 'columnheader',
                },
            },] }
];
/** @nocollapse */
CdkHeaderCell.ctorParameters = () => [
    { type: CdkColumnDef },
    { type: ElementRef }
];
/**
 * Footer cell template container that adds the right classes and role.
 */
export class CdkFooterCell extends BaseCdkCell {
    /**
     * @param {?} columnDef
     * @param {?} elementRef
     */
    constructor(columnDef, elementRef) {
        super(columnDef, elementRef);
    }
}
CdkFooterCell.decorators = [
    { type: Directive, args: [{
                selector: 'cdk-footer-cell, td[cdk-footer-cell]',
                host: {
                    'class': 'cdk-footer-cell',
                    'role': 'gridcell',
                },
            },] }
];
/** @nocollapse */
CdkFooterCell.ctorParameters = () => [
    { type: CdkColumnDef },
    { type: ElementRef }
];
/**
 * Cell template container that adds the right classes and role.
 */
export class CdkCell extends BaseCdkCell {
    /**
     * @param {?} columnDef
     * @param {?} elementRef
     */
    constructor(columnDef, elementRef) {
        super(columnDef, elementRef);
    }
}
CdkCell.decorators = [
    { type: Directive, args: [{
                selector: 'cdk-cell, td[cdk-cell]',
                host: {
                    'class': 'cdk-cell',
                    'role': 'gridcell',
                },
            },] }
];
/** @nocollapse */
CdkCell.ctorParameters = () => [
    { type: CdkColumnDef },
    { type: ElementRef }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGFibGUvY2VsbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQWUscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRSxPQUFPLEVBQUMsWUFBWSxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN0RixPQUFPLEVBQXlCLG1CQUFtQixFQUFDLE1BQU0sYUFBYSxDQUFDOzs7OztBQUl4RSw2QkFFQzs7O0lBREMsMkJBQTJCOzs7Ozs7QUFRN0IsTUFBTSxPQUFPLFVBQVU7Ozs7SUFDckIsWUFBWSxvQkFBb0IsQ0FBUSxRQUEwQjtRQUExQixhQUFRLEdBQVIsUUFBUSxDQUFrQjtJQUFHLENBQUM7OztZQUZ2RSxTQUFTLFNBQUMsRUFBQyxRQUFRLEVBQUUsY0FBYyxFQUFDOzs7O1lBYmUsV0FBVzs7Ozs7OztJQWU1Qiw4QkFBaUM7Ozs7OztBQVFwRSxNQUFNLE9BQU8sZ0JBQWdCOzs7O0lBQzNCLFlBQVksb0JBQW9CLENBQVEsUUFBMEI7UUFBMUIsYUFBUSxHQUFSLFFBQVEsQ0FBa0I7SUFBRyxDQUFDOzs7WUFGdkUsU0FBUyxTQUFDLEVBQUMsUUFBUSxFQUFFLG9CQUFvQixFQUFDOzs7O1lBdEJTLFdBQVc7Ozs7Ozs7SUF3QjVCLG9DQUFpQzs7Ozs7O0FBUXBFLE1BQU0sT0FBTyxnQkFBZ0I7Ozs7SUFDM0IsWUFBWSxvQkFBb0IsQ0FBUSxRQUEwQjtRQUExQixhQUFRLEdBQVIsUUFBUSxDQUFrQjtJQUFHLENBQUM7OztZQUZ2RSxTQUFTLFNBQUMsRUFBQyxRQUFRLEVBQUUsb0JBQW9CLEVBQUM7Ozs7WUEvQlMsV0FBVzs7Ozs7OztJQWlDNUIsb0NBQWlDOzs7Ozs7QUFLcEUsTUFBTSxnQkFBZ0I7Q0FBRzs7TUFDbkIsaUJBQWlCLEdB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Q0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDL0IsQ0FBQzs7O1lBVkYsU0FBUyxTQUFDO2dCQUNULFFBQVEsRUFBRSx3QkFBd0I7Z0JBQ2xDLElBQUksRUFBRTtvQkFDSixPQUFPLEVBQUUsVUFBVTtvQkFDbkIsTUFBTSxFQUFFLFVBQVU7aUJBQ25CO2FBQ0Y7Ozs7WUFFd0IsWUFBWTtZQXRKSixVQUFVIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Qm9vbGVhbklucHV0LCBjb2VyY2VCb29sZWFuUHJvcGVydHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge0NvbnRlbnRDaGlsZCwgRGlyZWN0aXZlLCBFbGVtZW50UmVmLCBJbnB1dCwgVGVtcGxhdGVSZWZ9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtDYW5TdGljaywgQ2FuU3RpY2tDdG9yLCBtaXhpbkhhc1N0aWNreUlucHV0fSBmcm9tICcuL2Nhbi1zdGljayc7XG5cblxuLyoqIEJhc2UgaW50ZXJmYWNlIGZvciBhIGNlbGwgZGVmaW5pdGlvbi4gQ2FwdHVyZXMgYSBjb2x1bW4ncyBjZWxsIHRlbXBsYXRlIGRlZmluaXRpb24uICovXG5leHBvcnQgaW50ZXJmYWNlIENlbGxEZWYge1xuICB0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8YW55Pjtcbn1cblxuLyoqXG4gKiBDZWxsIGRlZmluaXRpb24gZm9yIGEgQ0RLIHRhYmxlLlxuICogQ2FwdHVyZXMgdGhlIHRlbXBsYXRlIG9mIGEgY29sdW1uJ3MgZGF0YSByb3cgY2VsbCBhcyB3ZWxsIGFzIGNlbGwtc3BlY2lmaWMgcHJvcGVydGllcy5cbiAqL1xuQERpcmVjdGl2ZSh7c2VsZWN0b3I6ICdbY2RrQ2VsbERlZl0nfSlcbmV4cG9ydCBjbGFzcyBDZGtDZWxsRGVmIGltcGxlbWVudHMgQ2VsbERlZiB7XG4gIGNvbnN0cnVjdG9yKC8qKiBAZG9jcy1wcml2YXRlICovIHB1YmxpYyB0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8YW55Pikge31cbn1cblxuLyoqXG4gKiBIZWFkZXIgY2VsbCBkZWZpbml0aW9uIGZvciBhIENESyB0YWJsZS5cbiAqIENhcHR1cmVzIHRoZSB0ZW1wbGF0ZSBvZiBhIGNvbHVtbidzIGhlYWRlciBjZWxsIGFuZCBhcyB3ZWxsIGFzIGNlbGwtc3BlY2lmaWMgcHJvcGVydGllcy5cbiAqL1xuQERpcmVjdGl2ZSh7c2VsZWN0b3I6ICdbY2RrSGVhZGVyQ2VsbERlZl0nfSlcbmV4cG9ydCBjbGFzcyBDZGtIZWFkZXJDZWxsRGVmIGltcGxlbWVudHMgQ2VsbERlZiB7XG4gIGNvbnN0cnVjdG9yKC8qKiBAZG9jcy1wcml2YXRlICovIHB1YmxpYyB0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8YW55Pikge31cbn1cblxuLyoqXG4gKiBGb290ZXIgY2VsbCBkZWZpbml0aW9uIGZvciBhIENESyB0YWJsZS5cbiAqIENhcHR1cmVzIHRoZSB0ZW1wbGF0ZSBvZiBhIGNvbHVtbidzIGZvb3RlciBjZWxsIGFuZCBhcyB3ZWxsIGFzIGNlbGwtc3BlY2lmaWMgcHJvcGVydGllcy5cbiAqL1xuQERpcmVjdGl2ZSh7c2VsZWN0b3I6ICdbY2RrRm9vdGVyQ2VsbERlZl0nfSlcbmV4cG9ydCBjbGFzcyBDZGtGb290ZXJDZWxsRGVmIGltcGxlbWVudHMgQ2VsbERlZiB7XG4gIGNvbnN0cnVjdG9yKC8qKiBAZG9jcy1wcml2YXRlICovIHB1YmxpYyB0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8YW55Pikge31cbn1cblxuLy8gQm9pbGVycGxhdGUgZm9yIGFwcGx5aW5nIG1peGlucyB0byBDZGtDb2x1bW5EZWYuXG4vKiogQGRvY3MtcHJpdmF0ZSAqL1xuY2xhc3MgQ2RrQ29sdW1uRGVmQmFzZSB7fVxuY29uc3QgX0Nka0NvbHVtbkRlZkJhc2U6IENhblN0aWNrQ3RvciZ0eXBlb2YgQ2RrQ29sdW1uRGVmQmFzZSA9XG4gICAgbWl4aW5IYXNTdGlja3lJbnB1dChDZGtDb2x1bW5EZWZCYXNlKTtcblxuLyoqXG4gKiBDb2x1bW4gZGVmaW5pdGlvbiBmb3IgdGhlIENESyB0YWJsZS5cbiAqIERlZmluZXMgYSBzZXQgb2YgY2VsbHMgYXZhaWxhYmxlIGZvciBhIHRhYmxlIGNvbHVtbi5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka0NvbHVtbkRlZl0nLFxuICBpbnB1dHM6IFsnc3RpY2t5J10sXG4gIHByb3ZpZGVyczogW3twcm92aWRlOiAnTUFUX1NPUlRfSEVBREVSX0NPTFVNTl9ERUYnLCB1c2VFeGlzdGluZzogQ2RrQ29sdW1uRGVmfV0sXG59KVxuZXhwb3J0IGNsYXNzIENka0NvbHVtbkRlZiBleHRlbmRzIF9DZGtDb2x1bW5EZWZCYXNlIGltcGxlbWVudHMgQ2FuU3RpY2sge1xuICAvKiogVW5pcXVlIG5hbWUgZm9yIHRoaXMgY29sdW1uLiAqL1xuICBASW5wdXQoJ2Nka0NvbHVtbkRlZicpXG4gIGdldCBuYW1lKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX25hbWU7XG4gIH1cbiAgc2V0IG5hbWUobmFtZTogc3RyaW5nKSB7XG4gICAgLy8gSWYgdGhlIGRpcmVjdGl2ZSBpcyBzZXQgd2l0aG91dCBhIG5hbWUgKHVwZGF0ZWQgcHJvZ3JhbWF0aWNhbGx5KSwgdGhlbiB0aGlzIHNldHRlciB3aWxsXG4gICAgLy8gdHJpZ2dlciB3aXRoIGFuIGVtcHR5IHN0cmluZyBhbmQgc2hvdWxkIG5vdCBvdmVyd3JpdGUgdGhlIHByb2dyYW1hdGljYWxseSBzZXQgdmFsdWUuXG4gICAgaWYgKCFuYW1lKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fbmFtZSA9IG5hbWU7XG4gICAgdGhpcy5jc3NDbGFzc0ZyaWVuZGx5TmFtZSA9IG5hbWUucmVwbGFjZSgvW15hLXowLTlfLV0vaWcsICctJyk7XG4gIH1cbiAgX25hbWU6IHN0cmluZztcblxuICAvKipcbiAgICogV2hldGhlciB0aGlzIGNvbHVtbiBzaG91bGQgYmUgc3RpY2t5IHBvc2l0aW9uZWQgb24gdGhlIGVuZCBvZiB0aGUgcm93LiBTaG91bGQgbWFrZSBzdXJlXG4gICAqIHRoYXQgaXQgbWltaWNzIHRoZSBgQ2FuU3RpY2tgIG1peGluIHN1Y2ggdGhhdCBgX2hhc1N0aWNreUNoYW5nZWRgIGlzIHNldCB0byB0cnVlIGlmIHRoZSB2YWx1ZVxuICAgKiBoYXMgYmVlbiBjaGFuZ2VkLlxuICAgKi9cbiAgQElucHV0KCdzdGlja3lFbmQnKVxuICBnZXQgc3RpY2t5RW5kKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9zdGlja3lFbmQ7XG4gIH1cbiAgc2V0IHN0aWNreUVuZCh2OiBib29sZWFuKSB7XG4gICAgY29uc3QgcHJldlZhbHVlID0gdGhpcy5fc3RpY2t5RW5kO1xuICAgIHRoaXMuX3N0aWNreUVuZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2KTtcbiAgICB0aGlzLl9oYXNTdGlja3lDaGFuZ2VkID0gcHJldlZhbHVlICE9PSB0aGlzLl9zdGlja3lFbmQ7XG4gIH1cbiAgX3N0aWNreUVuZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBAZG9jcy1wcml2YXRlICovXG4gIEBDb250ZW50Q2hpbGQoQ2RrQ2VsbERlZikgY2VsbDogQ2RrQ2VsbERlZjtcblxuICAvKiogQGRvY3MtcHJpdmF0ZSAqL1xuICBAQ29udGVudENoaWxkKENka0hlYWRlckNlbGxEZWYpIGhlYWRlckNlbGw6IENka0hlYWRlckNlbGxEZWY7XG5cbiAgLyoqIEBkb2NzLXByaXZhdGUgKi9cbiAgQENvbnRlbnRDaGlsZChDZGtGb290ZXJDZWxsRGVmKSBmb290ZXJDZWxsOiBDZGtGb290ZXJDZWxsRGVmO1xuXG4gIC8qKlxuICAgKiBUcmFuc2Zvcm1lZCB2ZXJzaW9uIG9mIHRoZSBjb2x1bW4gbmFtZSB0aGF0IGNhbiBiZSB1c2VkIGFzIHBhcnQgb2YgYSBDU1MgY2xhc3NuYW1lLiBFeGNsdWRlc1xuICAgKiBhbGwgbm9uLWFscGhhbnVtZXJpYyBjaGFyYWN0ZXJzIGFuZCB0aGUgc3BlY2lhbCBjaGFyYWN0ZXJzICctJyBhbmQgJ18nLiBBbnkgY2hhcmFjdGVycyB0aGF0XG4gICAqIGRvIG5vdCBtYXRjaCBhcmUgcmVwbGFjZWQgYnkgdGhlICctJyBjaGFyYWN0ZXIuXG4gICAqL1xuICBjc3NDbGFzc0ZyaWVuZGx5TmFtZTogc3RyaW5nO1xuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9zdGlja3k6IEJvb2xlYW5JbnB1dDtcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX3N0aWNreUVuZDogQm9vbGVhbklucHV0O1xufVxuXG4vKiogQmFzZSBjbGFzcyBmb3IgdGhlIGNlbGxzLiBBZGRzIGEgQ1NTIGNsYXNzbmFtZSB0aGF0IGlkZW50aWZpZXMgdGhlIGNvbHVtbiBpdCByZW5kZXJzIGluLiAqL1xuZXhwb3J0IGNsYXNzIEJhc2VDZGtDZWxsIHtcbiAgY29uc3RydWN0b3IoY29sdW1uRGVmOiBDZGtDb2x1bW5EZWYsIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHtcbiAgICBjb25zdCBjb2x1bW5DbGFzc05hbWUgPSBgY2RrLWNvbHVtbi0ke2NvbHVtbkRlZi5jc3NDbGFzc0ZyaWVuZGx5TmFtZX1gO1xuICAgIGVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5jbGFzc0xpc3QuYWRkKGNvbHVtbkNsYXNzTmFtZSk7XG4gIH1cbn1cblxuLyoqIEhlYWRlciBjZWxsIHRlbXBsYXRlIGNvbnRhaW5lciB0aGF0IGFkZHMgdGhlIHJpZ2h0IGNsYXNzZXMgYW5kIHJvbGUuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdjZGstaGVhZGVyLWNlbGwsIHRoW2Nkay1oZWFkZXItY2VsbF0nLFxuICBob3N0OiB7XG4gICAgJ2NsYXNzJzogJ2Nkay1oZWFkZXItY2VsbCcsXG4gICAgJ3JvbGUnOiAnY29sdW1uaGVhZGVyJyxcbiAgfSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrSGVhZGVyQ2VsbCBleHRlbmRzIEJhc2VDZGtDZWxsIHtcbiAgY29uc3RydWN0b3IoY29sdW1uRGVmOiBDZGtDb2x1bW5EZWYsIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHtcbiAgICBzdXBlcihjb2x1bW5EZWYsIGVsZW1lbnRSZWYpO1xuICB9XG59XG5cbi8qKiBGb290ZXIgY2VsbCB0ZW1wbGF0ZSBjb250YWluZXIgdGhhdCBhZGRzIHRoZSByaWdodCBjbGFzc2VzIGFuZCByb2xlLiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnY2RrLWZvb3Rlci1jZWxsLCB0ZFtjZGstZm9vdGVyLWNlbGxdJyxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstZm9vdGVyLWNlbGwnLFxuICAgICdyb2xlJzogJ2dyaWRjZWxsJyxcbiAgfSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrRm9vdGVyQ2VsbCBleHRlbmRzIEJhc2VDZGtDZWxsIHtcbiAgY29uc3RydWN0b3IoY29sdW1uRGVmOiBDZGtDb2x1bW5EZWYsIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHtcbiAgICBzdXBlcihjb2x1bW5EZWYsIGVsZW1lbnRSZWYpO1xuICB9XG59XG5cbi8qKiBDZWxsIHRlbXBsYXRlIGNvbnRhaW5lciB0aGF0IGFkZHMgdGhlIHJpZ2h0IGNsYXNzZXMgYW5kIHJvbGUuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdjZGstY2VsbCwgdGRbY2RrLWNlbGxdJyxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstY2VsbCcsXG4gICAgJ3JvbGUnOiAnZ3JpZGNlbGwnLFxuICB9LFxufSlcbmV4cG9ydCBjbGFzcyBDZGtDZWxsIGV4dGVuZHMgQmFzZUNka0NlbGwge1xuICBjb25zdHJ1Y3Rvcihjb2x1bW5EZWY6IENka0NvbHVtbkRlZiwgZWxlbWVudFJlZjogRWxlbWVudFJlZikge1xuICAgIHN1cGVyKGNvbHVtbkRlZiwgZWxlbWVudFJlZik7XG4gIH1cbn1cbiJdfQ==