/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ContentChild, Directive, ElementRef, Inject, Input, Optional, TemplateRef, booleanAttribute, } from '@angular/core';
import { mixinHasStickyInput } from './can-stick';
import { CDK_TABLE } from './tokens';
import * as i0 from "@angular/core";
/**
 * Cell definition for a CDK table.
 * Captures the template of a column's data row cell as well as cell-specific properties.
 */
export class CdkCellDef {
    constructor(/** @docs-private */ template) {
        this.template = template;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.1.0-next.2", ngImport: i0, type: CdkCellDef, deps: [{ token: i0.TemplateRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.1.0-next.2", type: CdkCellDef, isStandalone: true, selector: "[cdkCellDef]", ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.1.0-next.2", ngImport: i0, type: CdkCellDef, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkCellDef]',
                    standalone: true,
                }]
        }], ctorParameters: () => [{ type: i0.TemplateRef }] });
/**
 * Header cell definition for a CDK table.
 * Captures the template of a column's header cell and as well as cell-specific properties.
 */
export class CdkHeaderCellDef {
    constructor(/** @docs-private */ template) {
        this.template = template;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.1.0-next.2", ngImport: i0, type: CdkHeaderCellDef, deps: [{ token: i0.TemplateRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.1.0-next.2", type: CdkHeaderCellDef, isStandalone: true, selector: "[cdkHeaderCellDef]", ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.1.0-next.2", ngImport: i0, type: CdkHeaderCellDef, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkHeaderCellDef]',
                    standalone: true,
                }]
        }], ctorParameters: () => [{ type: i0.TemplateRef }] });
/**
 * Footer cell definition for a CDK table.
 * Captures the template of a column's footer cell and as well as cell-specific properties.
 */
export class CdkFooterCellDef {
    constructor(/** @docs-private */ template) {
        this.template = template;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.1.0-next.2", ngImport: i0, type: CdkFooterCellDef, deps: [{ token: i0.TemplateRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.1.0-next.2", type: CdkFooterCellDef, isStandalone: true, selector: "[cdkFooterCellDef]", ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.1.0-next.2", ngImport: i0, type: CdkFooterCellDef, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkFooterCellDef]',
                    standalone: true,
                }]
        }], ctorParameters: () => [{ type: i0.TemplateRef }] });
// Boilerplate for applying mixins to CdkColumnDef.
/** @docs-private */
class CdkColumnDefBase {
}
const _CdkColumnDefBase = mixinHasStickyInput(CdkColumnDefBase);
/**
 * Column definition for the CDK table.
 * Defines a set of cells available for a table column.
 */
export class CdkColumnDef extends _CdkColumnDefBase {
    /** Unique name for this column. */
    get name() {
        return this._name;
    }
    set name(name) {
        this._setNameInput(name);
    }
    /**
     * Whether this column should be sticky positioned on the end of the row. Should make sure
     * that it mimics the `CanStick` mixin such that `_hasStickyChanged` is set to true if the value
     * has been changed.
     */
    get stickyEnd() {
        return this._stickyEnd;
    }
    set stickyEnd(value) {
        if (value !== this._stickyEnd) {
            this._stickyEnd = value;
            this._hasStickyChanged = true;
        }
    }
    constructor(_table) {
        super();
        this._table = _table;
        this._stickyEnd = false;
    }
    /**
     * Overridable method that sets the css classes that will be added to every cell in this
     * column.
     * In the future, columnCssClassName will change from type string[] to string and this
     * will set a single string value.
     * @docs-private
     */
    _updateColumnCssClassName() {
        this._columnCssClassName = [`cdk-column-${this.cssClassFriendlyName}`];
    }
    /**
     * This has been extracted to a util because of TS 4 and VE.
     * View Engine doesn't support property rename inheritance.
     * TS 4.0 doesn't allow properties to override accessors or vice-versa.
     * @docs-private
     */
    _setNameInput(value) {
        // If the directive is set without a name (updated programmatically), then this setter will
        // trigger with an empty string and should not overwrite the programmatically set value.
        if (value) {
            this._name = value;
            this.cssClassFriendlyName = value.replace(/[^a-z0-9_-]/gi, '-');
            this._updateColumnCssClassName();
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.1.0-next.2", ngImport: i0, type: CdkColumnDef, deps: [{ token: CDK_TABLE, optional: true }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "16.1.0", version: "17.1.0-next.2", type: CdkColumnDef, isStandalone: true, selector: "[cdkColumnDef]", inputs: { sticky: "sticky", name: ["cdkColumnDef", "name"], stickyEnd: ["stickyEnd", "stickyEnd", booleanAttribute] }, providers: [{ provide: 'MAT_SORT_HEADER_COLUMN_DEF', useExisting: CdkColumnDef }], queries: [{ propertyName: "cell", first: true, predicate: CdkCellDef, descendants: true }, { propertyName: "headerCell", first: true, predicate: CdkHeaderCellDef, descendants: true }, { propertyName: "footerCell", first: true, predicate: CdkFooterCellDef, descendants: true }], usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.1.0-next.2", ngImport: i0, type: CdkColumnDef, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkColumnDef]',
                    inputs: ['sticky'],
                    providers: [{ provide: 'MAT_SORT_HEADER_COLUMN_DEF', useExisting: CdkColumnDef }],
                    standalone: true,
                }]
        }], ctorParameters: () => [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [CDK_TABLE]
                }, {
                    type: Optional
                }] }], propDecorators: { name: [{
                type: Input,
                args: ['cdkColumnDef']
            }], stickyEnd: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], cell: [{
                type: ContentChild,
                args: [CdkCellDef]
            }], headerCell: [{
                type: ContentChild,
                args: [CdkHeaderCellDef]
            }], footerCell: [{
                type: ContentChild,
                args: [CdkFooterCellDef]
            }] } });
/** Base class for the cells. Adds a CSS classname that identifies the column it renders in. */
export class BaseCdkCell {
    constructor(columnDef, elementRef) {
        elementRef.nativeElement.classList.add(...columnDef._columnCssClassName);
    }
}
/** Header cell template container that adds the right classes and role. */
export class CdkHeaderCell extends BaseCdkCell {
    constructor(columnDef, elementRef) {
        super(columnDef, elementRef);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.1.0-next.2", ngImport: i0, type: CdkHeaderCell, deps: [{ token: CdkColumnDef }, { token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.1.0-next.2", type: CdkHeaderCell, isStandalone: true, selector: "cdk-header-cell, th[cdk-header-cell]", host: { attributes: { "role": "columnheader" }, classAttribute: "cdk-header-cell" }, usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.1.0-next.2", ngImport: i0, type: CdkHeaderCell, decorators: [{
            type: Directive,
            args: [{
                    selector: 'cdk-header-cell, th[cdk-header-cell]',
                    host: {
                        'class': 'cdk-header-cell',
                        'role': 'columnheader',
                    },
                    standalone: true,
                }]
        }], ctorParameters: () => [{ type: CdkColumnDef }, { type: i0.ElementRef }] });
/** Footer cell template container that adds the right classes and role. */
export class CdkFooterCell extends BaseCdkCell {
    constructor(columnDef, elementRef) {
        super(columnDef, elementRef);
        if (columnDef._table?._elementRef.nativeElement.nodeType === 1) {
            const tableRole = columnDef._table._elementRef.nativeElement.getAttribute('role');
            const role = tableRole === 'grid' || tableRole === 'treegrid' ? 'gridcell' : 'cell';
            elementRef.nativeElement.setAttribute('role', role);
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.1.0-next.2", ngImport: i0, type: CdkFooterCell, deps: [{ token: CdkColumnDef }, { token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.1.0-next.2", type: CdkFooterCell, isStandalone: true, selector: "cdk-footer-cell, td[cdk-footer-cell]", host: { classAttribute: "cdk-footer-cell" }, usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.1.0-next.2", ngImport: i0, type: CdkFooterCell, decorators: [{
            type: Directive,
            args: [{
                    selector: 'cdk-footer-cell, td[cdk-footer-cell]',
                    host: {
                        'class': 'cdk-footer-cell',
                    },
                    standalone: true,
                }]
        }], ctorParameters: () => [{ type: CdkColumnDef }, { type: i0.ElementRef }] });
/** Cell template container that adds the right classes and role. */
export class CdkCell extends BaseCdkCell {
    constructor(columnDef, elementRef) {
        super(columnDef, elementRef);
        if (columnDef._table?._elementRef.nativeElement.nodeType === 1) {
            const tableRole = columnDef._table._elementRef.nativeElement.getAttribute('role');
            const role = tableRole === 'grid' || tableRole === 'treegrid' ? 'gridcell' : 'cell';
            elementRef.nativeElement.setAttribute('role', role);
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.1.0-next.2", ngImport: i0, type: CdkCell, deps: [{ token: CdkColumnDef }, { token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.1.0-next.2", type: CdkCell, isStandalone: true, selector: "cdk-cell, td[cdk-cell]", host: { classAttribute: "cdk-cell" }, usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.1.0-next.2", ngImport: i0, type: CdkCell, decorators: [{
            type: Directive,
            args: [{
                    selector: 'cdk-cell, td[cdk-cell]',
                    host: {
                        'class': 'cdk-cell',
                    },
                    standalone: true,
                }]
        }], ctorParameters: () => [{ type: CdkColumnDef }, { type: i0.ElementRef }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGFibGUvY2VsbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsWUFBWSxFQUNaLFNBQVMsRUFDVCxVQUFVLEVBQ1YsTUFBTSxFQUNOLEtBQUssRUFDTCxRQUFRLEVBQ1IsV0FBVyxFQUNYLGdCQUFnQixHQUNqQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQXlCLG1CQUFtQixFQUFDLE1BQU0sYUFBYSxDQUFDO0FBQ3hFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxVQUFVLENBQUM7O0FBT25DOzs7R0FHRztBQUtILE1BQU0sT0FBTyxVQUFVO0lBQ3JCLFlBQVksb0JBQW9CLENBQVEsUUFBMEI7UUFBMUIsYUFBUSxHQUFSLFFBQVEsQ0FBa0I7SUFBRyxDQUFDO3FIQUQzRCxVQUFVO3lHQUFWLFVBQVU7O2tHQUFWLFVBQVU7a0JBSnRCLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLGNBQWM7b0JBQ3hCLFVBQVUsRUFBRSxJQUFJO2lCQUNqQjs7QUFLRDs7O0dBR0c7QUFLSCxNQUFNLE9BQU8sZ0JBQWdCO0lBQzNCLFlBQVksb0JBQW9CLENBQVEsUUFBMEI7UUFBMUIsYUFBUSxHQUFSLFFBQVEsQ0FBa0I7SUFBRyxDQUFDO3FIQUQzRCxnQkFBZ0I7eUdBQWhCLGdCQUFnQjs7a0dBQWhCLGdCQUFnQjtrQkFKNUIsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUsb0JBQW9CO29CQUM5QixVQUFVLEVBQUUsSUFBSTtpQkFDakI7O0FBS0Q7OztHQUdHO0FBS0gsTUFBTSxPQUFPLGdCQUFnQjtJQUMzQixZQUFZLG9CQUFvQixDQUFRLFFBQTBCO1FBQTFCLGFBQVEsR0FBUixRQUFRLENBQWtCO0lBQUcsQ0FBQztxSEFEM0QsZ0JBQWdCO3lHQUFoQixnQkFBZ0I7O2tHQUFoQixnQkFBZ0I7a0JBSjVCLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLG9CQUFvQjtvQkFDOUIsVUFBVSxFQUFFLElBQUk7aUJBQ2pCOztBQUtELG1EQUFtRDtBQUNuRCxvQkFBb0I7QUFDcEIsTUFBTSxnQkFBZ0I7Q0FBRztBQUN6QixNQUFNLGlCQUFpQixHQUNyQixtQkFBbUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBRXhDOzs7R0FHRztBQU9ILE1BQU0sT0FBTyxZQUFhLFNBQVEsaUJBQWlCO0lBQ2pELG1DQUFtQztJQUNuQyxJQUNJLElBQUk7UUFDTixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQztJQUNELElBQUksSUFBSSxDQUFDLElBQVk7UUFDbkIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMzQixDQUFDO0lBR0Q7Ozs7T0FJRztJQUNILElBQ0ksU0FBUztRQUNYLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztJQUN6QixDQUFDO0lBQ0QsSUFBSSxTQUFTLENBQUMsS0FBYztRQUMxQixJQUFJLEtBQUssS0FBSyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDOUIsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7WUFDeEIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQztRQUNoQyxDQUFDO0lBQ0gsQ0FBQztJQXlCRCxZQUFrRCxNQUFZO1FBQzVELEtBQUssRUFBRSxDQUFDO1FBRHdDLFdBQU0sR0FBTixNQUFNLENBQU07UUF4QjlELGVBQVUsR0FBWSxLQUFLLENBQUM7SUEwQjVCLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDTyx5QkFBeUI7UUFDakMsSUFBSSxDQUFDLG1CQUFtQixHQUFHLENBQUMsY0FBYyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDO0lBQ3pFLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNPLGFBQWEsQ0FBQyxLQUFhO1FBQ25DLDJGQUEyRjtRQUMzRix3RkFBd0Y7UUFDeEYsSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUNWLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQ25CLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQWUsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNoRSxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztRQUNuQyxDQUFDO0lBQ0gsQ0FBQztxSEEvRVUsWUFBWSxrQkFrREgsU0FBUzt5R0FsRGxCLFlBQVksb0pBZ0JKLGdCQUFnQixnQkFuQnhCLENBQUMsRUFBQyxPQUFPLEVBQUUsNEJBQTRCLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBQyxDQUFDLDREQWdDakUsVUFBVSw2RUFHVixnQkFBZ0IsNkVBR2hCLGdCQUFnQjs7a0dBbkNuQixZQUFZO2tCQU54QixTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSxnQkFBZ0I7b0JBQzFCLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQztvQkFDbEIsU0FBUyxFQUFFLENBQUMsRUFBQyxPQUFPLEVBQUUsNEJBQTRCLEVBQUUsV0FBVyxjQUFjLEVBQUMsQ0FBQztvQkFDL0UsVUFBVSxFQUFFLElBQUk7aUJBQ2pCOzswQkFtRGMsTUFBTTsyQkFBQyxTQUFTOzswQkFBRyxRQUFRO3lDQS9DcEMsSUFBSTtzQkFEUCxLQUFLO3VCQUFDLGNBQWM7Z0JBZWpCLFNBQVM7c0JBRFosS0FBSzt1QkFBQyxFQUFDLFNBQVMsRUFBRSxnQkFBZ0IsRUFBQztnQkFhVixJQUFJO3NCQUE3QixZQUFZO3VCQUFDLFVBQVU7Z0JBR1EsVUFBVTtzQkFBekMsWUFBWTt1QkFBQyxnQkFBZ0I7Z0JBR0UsVUFBVTtzQkFBekMsWUFBWTt1QkFBQyxnQkFBZ0I7O0FBK0NoQywrRkFBK0Y7QUFDL0YsTUFBTSxPQUFPLFdBQVc7SUFDdEIsWUFBWSxTQUF1QixFQUFFLFVBQXNCO1FBQ3pELFVBQVUsQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0lBQzNFLENBQUM7Q0FDRjtBQUVELDJFQUEyRTtBQVMzRSxNQUFNLE9BQU8sYUFBYyxTQUFRLFdBQVc7SUFDNUMsWUFBWSxTQUF1QixFQUFFLFVBQXNCO1FBQ3pELEtBQUssQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDL0IsQ0FBQztxSEFIVSxhQUFhO3lHQUFiLGFBQWE7O2tHQUFiLGFBQWE7a0JBUnpCLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLHNDQUFzQztvQkFDaEQsSUFBSSxFQUFFO3dCQUNKLE9BQU8sRUFBRSxpQkFBaUI7d0JBQzFCLE1BQU0sRUFBRSxjQUFjO3FCQUN2QjtvQkFDRCxVQUFVLEVBQUUsSUFBSTtpQkFDakI7O0FBT0QsMkVBQTJFO0FBUTNFLE1BQU0sT0FBTyxhQUFjLFNBQVEsV0FBVztJQUM1QyxZQUFZLFNBQXVCLEVBQUUsVUFBc0I7UUFDekQsS0FBSyxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUM3QixJQUFJLFNBQVMsQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLGFBQWEsQ0FBQyxRQUFRLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDL0QsTUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNsRixNQUFNLElBQUksR0FBRyxTQUFTLEtBQUssTUFBTSxJQUFJLFNBQVMsS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1lBQ3BGLFVBQVUsQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN0RCxDQUFDO0lBQ0gsQ0FBQztxSEFSVSxhQUFhO3lHQUFiLGFBQWE7O2tHQUFiLGFBQWE7a0JBUHpCLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLHNDQUFzQztvQkFDaEQsSUFBSSxFQUFFO3dCQUNKLE9BQU8sRUFBRSxpQkFBaUI7cUJBQzNCO29CQUNELFVBQVUsRUFBRSxJQUFJO2lCQUNqQjs7QUFZRCxvRUFBb0U7QUFRcEUsTUFBTSxPQUFPLE9BQVEsU0FBUSxXQUFXO0lBQ3RDLFlBQVksU0FBdUIsRUFBRSxVQUFzQjtRQUN6RCxLQUFLLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzdCLElBQUksU0FBUyxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsYUFBYSxDQUFDLFFBQVEsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUMvRCxNQUFNLFNBQVMsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sSUFBSSxHQUFHLFNBQVMsS0FBSyxNQUFNLElBQUksU0FBUyxLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7WUFDcEYsVUFBVSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3RELENBQUM7SUFDSCxDQUFDO3FIQVJVLE9BQU87eUdBQVAsT0FBTzs7a0dBQVAsT0FBTztrQkFQbkIsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUsd0JBQXdCO29CQUNsQyxJQUFJLEVBQUU7d0JBQ0osT0FBTyxFQUFFLFVBQVU7cUJBQ3BCO29CQUNELFVBQVUsRUFBRSxJQUFJO2lCQUNqQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBDb250ZW50Q2hpbGQsXG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgSW5qZWN0LFxuICBJbnB1dCxcbiAgT3B0aW9uYWwsXG4gIFRlbXBsYXRlUmVmLFxuICBib29sZWFuQXR0cmlidXRlLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Q2FuU3RpY2ssIENhblN0aWNrQ3RvciwgbWl4aW5IYXNTdGlja3lJbnB1dH0gZnJvbSAnLi9jYW4tc3RpY2snO1xuaW1wb3J0IHtDREtfVEFCTEV9IGZyb20gJy4vdG9rZW5zJztcblxuLyoqIEJhc2UgaW50ZXJmYWNlIGZvciBhIGNlbGwgZGVmaW5pdGlvbi4gQ2FwdHVyZXMgYSBjb2x1bW4ncyBjZWxsIHRlbXBsYXRlIGRlZmluaXRpb24uICovXG5leHBvcnQgaW50ZXJmYWNlIENlbGxEZWYge1xuICB0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8YW55Pjtcbn1cblxuLyoqXG4gKiBDZWxsIGRlZmluaXRpb24gZm9yIGEgQ0RLIHRhYmxlLlxuICogQ2FwdHVyZXMgdGhlIHRlbXBsYXRlIG9mIGEgY29sdW1uJ3MgZGF0YSByb3cgY2VsbCBhcyB3ZWxsIGFzIGNlbGwtc3BlY2lmaWMgcHJvcGVydGllcy5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka0NlbGxEZWZdJyxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrQ2VsbERlZiBpbXBsZW1lbnRzIENlbGxEZWYge1xuICBjb25zdHJ1Y3RvcigvKiogQGRvY3MtcHJpdmF0ZSAqLyBwdWJsaWMgdGVtcGxhdGU6IFRlbXBsYXRlUmVmPGFueT4pIHt9XG59XG5cbi8qKlxuICogSGVhZGVyIGNlbGwgZGVmaW5pdGlvbiBmb3IgYSBDREsgdGFibGUuXG4gKiBDYXB0dXJlcyB0aGUgdGVtcGxhdGUgb2YgYSBjb2x1bW4ncyBoZWFkZXIgY2VsbCBhbmQgYXMgd2VsbCBhcyBjZWxsLXNwZWNpZmljIHByb3BlcnRpZXMuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtIZWFkZXJDZWxsRGVmXScsXG4gIHN0YW5kYWxvbmU6IHRydWUsXG59KVxuZXhwb3J0IGNsYXNzIENka0hlYWRlckNlbGxEZWYgaW1wbGVtZW50cyBDZWxsRGVmIHtcbiAgY29uc3RydWN0b3IoLyoqIEBkb2NzLXByaXZhdGUgKi8gcHVibGljIHRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxhbnk+KSB7fVxufVxuXG4vKipcbiAqIEZvb3RlciBjZWxsIGRlZmluaXRpb24gZm9yIGEgQ0RLIHRhYmxlLlxuICogQ2FwdHVyZXMgdGhlIHRlbXBsYXRlIG9mIGEgY29sdW1uJ3MgZm9vdGVyIGNlbGwgYW5kIGFzIHdlbGwgYXMgY2VsbC1zcGVjaWZpYyBwcm9wZXJ0aWVzLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrRm9vdGVyQ2VsbERlZl0nLFxuICBzdGFuZGFsb25lOiB0cnVlLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtGb290ZXJDZWxsRGVmIGltcGxlbWVudHMgQ2VsbERlZiB7XG4gIGNvbnN0cnVjdG9yKC8qKiBAZG9jcy1wcml2YXRlICovIHB1YmxpYyB0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8YW55Pikge31cbn1cblxuLy8gQm9pbGVycGxhdGUgZm9yIGFwcGx5aW5nIG1peGlucyB0byBDZGtDb2x1bW5EZWYuXG4vKiogQGRvY3MtcHJpdmF0ZSAqL1xuY2xhc3MgQ2RrQ29sdW1uRGVmQmFzZSB7fVxuY29uc3QgX0Nka0NvbHVtbkRlZkJhc2U6IENhblN0aWNrQ3RvciAmIHR5cGVvZiBDZGtDb2x1bW5EZWZCYXNlID1cbiAgbWl4aW5IYXNTdGlja3lJbnB1dChDZGtDb2x1bW5EZWZCYXNlKTtcblxuLyoqXG4gKiBDb2x1bW4gZGVmaW5pdGlvbiBmb3IgdGhlIENESyB0YWJsZS5cbiAqIERlZmluZXMgYSBzZXQgb2YgY2VsbHMgYXZhaWxhYmxlIGZvciBhIHRhYmxlIGNvbHVtbi5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka0NvbHVtbkRlZl0nLFxuICBpbnB1dHM6IFsnc3RpY2t5J10sXG4gIHByb3ZpZGVyczogW3twcm92aWRlOiAnTUFUX1NPUlRfSEVBREVSX0NPTFVNTl9ERUYnLCB1c2VFeGlzdGluZzogQ2RrQ29sdW1uRGVmfV0sXG4gIHN0YW5kYWxvbmU6IHRydWUsXG59KVxuZXhwb3J0IGNsYXNzIENka0NvbHVtbkRlZiBleHRlbmRzIF9DZGtDb2x1bW5EZWZCYXNlIGltcGxlbWVudHMgQ2FuU3RpY2sge1xuICAvKiogVW5pcXVlIG5hbWUgZm9yIHRoaXMgY29sdW1uLiAqL1xuICBASW5wdXQoJ2Nka0NvbHVtbkRlZicpXG4gIGdldCBuYW1lKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX25hbWU7XG4gIH1cbiAgc2V0IG5hbWUobmFtZTogc3RyaW5nKSB7XG4gICAgdGhpcy5fc2V0TmFtZUlucHV0KG5hbWUpO1xuICB9XG4gIHByb3RlY3RlZCBfbmFtZTogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoaXMgY29sdW1uIHNob3VsZCBiZSBzdGlja3kgcG9zaXRpb25lZCBvbiB0aGUgZW5kIG9mIHRoZSByb3cuIFNob3VsZCBtYWtlIHN1cmVcbiAgICogdGhhdCBpdCBtaW1pY3MgdGhlIGBDYW5TdGlja2AgbWl4aW4gc3VjaCB0aGF0IGBfaGFzU3RpY2t5Q2hhbmdlZGAgaXMgc2V0IHRvIHRydWUgaWYgdGhlIHZhbHVlXG4gICAqIGhhcyBiZWVuIGNoYW5nZWQuXG4gICAqL1xuICBASW5wdXQoe3RyYW5zZm9ybTogYm9vbGVhbkF0dHJpYnV0ZX0pXG4gIGdldCBzdGlja3lFbmQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX3N0aWNreUVuZDtcbiAgfVxuICBzZXQgc3RpY2t5RW5kKHZhbHVlOiBib29sZWFuKSB7XG4gICAgaWYgKHZhbHVlICE9PSB0aGlzLl9zdGlja3lFbmQpIHtcbiAgICAgIHRoaXMuX3N0aWNreUVuZCA9IHZhbHVlO1xuICAgICAgdGhpcy5faGFzU3RpY2t5Q2hhbmdlZCA9IHRydWU7XG4gICAgfVxuICB9XG4gIF9zdGlja3lFbmQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogQGRvY3MtcHJpdmF0ZSAqL1xuICBAQ29udGVudENoaWxkKENka0NlbGxEZWYpIGNlbGw6IENka0NlbGxEZWY7XG5cbiAgLyoqIEBkb2NzLXByaXZhdGUgKi9cbiAgQENvbnRlbnRDaGlsZChDZGtIZWFkZXJDZWxsRGVmKSBoZWFkZXJDZWxsOiBDZGtIZWFkZXJDZWxsRGVmO1xuXG4gIC8qKiBAZG9jcy1wcml2YXRlICovXG4gIEBDb250ZW50Q2hpbGQoQ2RrRm9vdGVyQ2VsbERlZikgZm9vdGVyQ2VsbDogQ2RrRm9vdGVyQ2VsbERlZjtcblxuICAvKipcbiAgICogVHJhbnNmb3JtZWQgdmVyc2lvbiBvZiB0aGUgY29sdW1uIG5hbWUgdGhhdCBjYW4gYmUgdXNlZCBhcyBwYXJ0IG9mIGEgQ1NTIGNsYXNzbmFtZS4gRXhjbHVkZXNcbiAgICogYWxsIG5vbi1hbHBoYW51bWVyaWMgY2hhcmFjdGVycyBhbmQgdGhlIHNwZWNpYWwgY2hhcmFjdGVycyAnLScgYW5kICdfJy4gQW55IGNoYXJhY3RlcnMgdGhhdFxuICAgKiBkbyBub3QgbWF0Y2ggYXJlIHJlcGxhY2VkIGJ5IHRoZSAnLScgY2hhcmFjdGVyLlxuICAgKi9cbiAgY3NzQ2xhc3NGcmllbmRseU5hbWU6IHN0cmluZztcblxuICAvKipcbiAgICogQ2xhc3MgbmFtZSBmb3IgY2VsbHMgaW4gdGhpcyBjb2x1bW4uXG4gICAqIEBkb2NzLXByaXZhdGVcbiAgICovXG4gIF9jb2x1bW5Dc3NDbGFzc05hbWU6IHN0cmluZ1tdO1xuXG4gIGNvbnN0cnVjdG9yKEBJbmplY3QoQ0RLX1RBQkxFKSBAT3B0aW9uYWwoKSBwdWJsaWMgX3RhYmxlPzogYW55KSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPdmVycmlkYWJsZSBtZXRob2QgdGhhdCBzZXRzIHRoZSBjc3MgY2xhc3NlcyB0aGF0IHdpbGwgYmUgYWRkZWQgdG8gZXZlcnkgY2VsbCBpbiB0aGlzXG4gICAqIGNvbHVtbi5cbiAgICogSW4gdGhlIGZ1dHVyZSwgY29sdW1uQ3NzQ2xhc3NOYW1lIHdpbGwgY2hhbmdlIGZyb20gdHlwZSBzdHJpbmdbXSB0byBzdHJpbmcgYW5kIHRoaXNcbiAgICogd2lsbCBzZXQgYSBzaW5nbGUgc3RyaW5nIHZhbHVlLlxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICBwcm90ZWN0ZWQgX3VwZGF0ZUNvbHVtbkNzc0NsYXNzTmFtZSgpIHtcbiAgICB0aGlzLl9jb2x1bW5Dc3NDbGFzc05hbWUgPSBbYGNkay1jb2x1bW4tJHt0aGlzLmNzc0NsYXNzRnJpZW5kbHlOYW1lfWBdO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgaGFzIGJlZW4gZXh0cmFjdGVkIHRvIGEgdXRpbCBiZWNhdXNlIG9mIFRTIDQgYW5kIFZFLlxuICAgKiBWaWV3IEVuZ2luZSBkb2Vzbid0IHN1cHBvcnQgcHJvcGVydHkgcmVuYW1lIGluaGVyaXRhbmNlLlxuICAgKiBUUyA0LjAgZG9lc24ndCBhbGxvdyBwcm9wZXJ0aWVzIHRvIG92ZXJyaWRlIGFjY2Vzc29ycyBvciB2aWNlLXZlcnNhLlxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICBwcm90ZWN0ZWQgX3NldE5hbWVJbnB1dCh2YWx1ZTogc3RyaW5nKSB7XG4gICAgLy8gSWYgdGhlIGRpcmVjdGl2ZSBpcyBzZXQgd2l0aG91dCBhIG5hbWUgKHVwZGF0ZWQgcHJvZ3JhbW1hdGljYWxseSksIHRoZW4gdGhpcyBzZXR0ZXIgd2lsbFxuICAgIC8vIHRyaWdnZXIgd2l0aCBhbiBlbXB0eSBzdHJpbmcgYW5kIHNob3VsZCBub3Qgb3ZlcndyaXRlIHRoZSBwcm9ncmFtbWF0aWNhbGx5IHNldCB2YWx1ZS5cbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIHRoaXMuX25hbWUgPSB2YWx1ZTtcbiAgICAgIHRoaXMuY3NzQ2xhc3NGcmllbmRseU5hbWUgPSB2YWx1ZS5yZXBsYWNlKC9bXmEtejAtOV8tXS9naSwgJy0nKTtcbiAgICAgIHRoaXMuX3VwZGF0ZUNvbHVtbkNzc0NsYXNzTmFtZSgpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogQmFzZSBjbGFzcyBmb3IgdGhlIGNlbGxzLiBBZGRzIGEgQ1NTIGNsYXNzbmFtZSB0aGF0IGlkZW50aWZpZXMgdGhlIGNvbHVtbiBpdCByZW5kZXJzIGluLiAqL1xuZXhwb3J0IGNsYXNzIEJhc2VDZGtDZWxsIHtcbiAgY29uc3RydWN0b3IoY29sdW1uRGVmOiBDZGtDb2x1bW5EZWYsIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHtcbiAgICBlbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuY2xhc3NMaXN0LmFkZCguLi5jb2x1bW5EZWYuX2NvbHVtbkNzc0NsYXNzTmFtZSk7XG4gIH1cbn1cblxuLyoqIEhlYWRlciBjZWxsIHRlbXBsYXRlIGNvbnRhaW5lciB0aGF0IGFkZHMgdGhlIHJpZ2h0IGNsYXNzZXMgYW5kIHJvbGUuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdjZGstaGVhZGVyLWNlbGwsIHRoW2Nkay1oZWFkZXItY2VsbF0nLFxuICBob3N0OiB7XG4gICAgJ2NsYXNzJzogJ2Nkay1oZWFkZXItY2VsbCcsXG4gICAgJ3JvbGUnOiAnY29sdW1uaGVhZGVyJyxcbiAgfSxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrSGVhZGVyQ2VsbCBleHRlbmRzIEJhc2VDZGtDZWxsIHtcbiAgY29uc3RydWN0b3IoY29sdW1uRGVmOiBDZGtDb2x1bW5EZWYsIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHtcbiAgICBzdXBlcihjb2x1bW5EZWYsIGVsZW1lbnRSZWYpO1xuICB9XG59XG5cbi8qKiBGb290ZXIgY2VsbCB0ZW1wbGF0ZSBjb250YWluZXIgdGhhdCBhZGRzIHRoZSByaWdodCBjbGFzc2VzIGFuZCByb2xlLiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnY2RrLWZvb3Rlci1jZWxsLCB0ZFtjZGstZm9vdGVyLWNlbGxdJyxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstZm9vdGVyLWNlbGwnLFxuICB9LFxuICBzdGFuZGFsb25lOiB0cnVlLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtGb290ZXJDZWxsIGV4dGVuZHMgQmFzZUNka0NlbGwge1xuICBjb25zdHJ1Y3Rvcihjb2x1bW5EZWY6IENka0NvbHVtbkRlZiwgZWxlbWVudFJlZjogRWxlbWVudFJlZikge1xuICAgIHN1cGVyKGNvbHVtbkRlZiwgZWxlbWVudFJlZik7XG4gICAgaWYgKGNvbHVtbkRlZi5fdGFibGU/Ll9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgIGNvbnN0IHRhYmxlUm9sZSA9IGNvbHVtbkRlZi5fdGFibGUuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ3JvbGUnKTtcbiAgICAgIGNvbnN0IHJvbGUgPSB0YWJsZVJvbGUgPT09ICdncmlkJyB8fCB0YWJsZVJvbGUgPT09ICd0cmVlZ3JpZCcgPyAnZ3JpZGNlbGwnIDogJ2NlbGwnO1xuICAgICAgZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnNldEF0dHJpYnV0ZSgncm9sZScsIHJvbGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogQ2VsbCB0ZW1wbGF0ZSBjb250YWluZXIgdGhhdCBhZGRzIHRoZSByaWdodCBjbGFzc2VzIGFuZCByb2xlLiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnY2RrLWNlbGwsIHRkW2Nkay1jZWxsXScsXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLWNlbGwnLFxuICB9LFxuICBzdGFuZGFsb25lOiB0cnVlLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtDZWxsIGV4dGVuZHMgQmFzZUNka0NlbGwge1xuICBjb25zdHJ1Y3Rvcihjb2x1bW5EZWY6IENka0NvbHVtbkRlZiwgZWxlbWVudFJlZjogRWxlbWVudFJlZikge1xuICAgIHN1cGVyKGNvbHVtbkRlZiwgZWxlbWVudFJlZik7XG4gICAgaWYgKGNvbHVtbkRlZi5fdGFibGU/Ll9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgIGNvbnN0IHRhYmxlUm9sZSA9IGNvbHVtbkRlZi5fdGFibGUuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ3JvbGUnKTtcbiAgICAgIGNvbnN0IHJvbGUgPSB0YWJsZVJvbGUgPT09ICdncmlkJyB8fCB0YWJsZVJvbGUgPT09ICd0cmVlZ3JpZCcgPyAnZ3JpZGNlbGwnIDogJ2NlbGwnO1xuICAgICAgZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnNldEF0dHJpYnV0ZSgncm9sZScsIHJvbGUpO1xuICAgIH1cbiAgfVxufVxuIl19