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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkCellDef, deps: [{ token: i0.TemplateRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.0.0", type: CdkCellDef, selector: "[cdkCellDef]", ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkCellDef, decorators: [{
            type: Directive,
            args: [{ selector: '[cdkCellDef]' }]
        }], ctorParameters: () => [{ type: i0.TemplateRef }] });
/**
 * Header cell definition for a CDK table.
 * Captures the template of a column's header cell and as well as cell-specific properties.
 */
export class CdkHeaderCellDef {
    constructor(/** @docs-private */ template) {
        this.template = template;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkHeaderCellDef, deps: [{ token: i0.TemplateRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.0.0", type: CdkHeaderCellDef, selector: "[cdkHeaderCellDef]", ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkHeaderCellDef, decorators: [{
            type: Directive,
            args: [{ selector: '[cdkHeaderCellDef]' }]
        }], ctorParameters: () => [{ type: i0.TemplateRef }] });
/**
 * Footer cell definition for a CDK table.
 * Captures the template of a column's footer cell and as well as cell-specific properties.
 */
export class CdkFooterCellDef {
    constructor(/** @docs-private */ template) {
        this.template = template;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkFooterCellDef, deps: [{ token: i0.TemplateRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.0.0", type: CdkFooterCellDef, selector: "[cdkFooterCellDef]", ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkFooterCellDef, decorators: [{
            type: Directive,
            args: [{ selector: '[cdkFooterCellDef]' }]
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkColumnDef, deps: [{ token: CDK_TABLE, optional: true }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "16.1.0", version: "17.0.0", type: CdkColumnDef, selector: "[cdkColumnDef]", inputs: { sticky: "sticky", name: ["cdkColumnDef", "name"], stickyEnd: ["stickyEnd", "stickyEnd", booleanAttribute] }, providers: [{ provide: 'MAT_SORT_HEADER_COLUMN_DEF', useExisting: CdkColumnDef }], queries: [{ propertyName: "cell", first: true, predicate: CdkCellDef, descendants: true }, { propertyName: "headerCell", first: true, predicate: CdkHeaderCellDef, descendants: true }, { propertyName: "footerCell", first: true, predicate: CdkFooterCellDef, descendants: true }], usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkColumnDef, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkColumnDef]',
                    inputs: ['sticky'],
                    providers: [{ provide: 'MAT_SORT_HEADER_COLUMN_DEF', useExisting: CdkColumnDef }],
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkHeaderCell, deps: [{ token: CdkColumnDef }, { token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.0.0", type: CdkHeaderCell, selector: "cdk-header-cell, th[cdk-header-cell]", host: { attributes: { "role": "columnheader" }, classAttribute: "cdk-header-cell" }, usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkHeaderCell, decorators: [{
            type: Directive,
            args: [{
                    selector: 'cdk-header-cell, th[cdk-header-cell]',
                    host: {
                        'class': 'cdk-header-cell',
                        'role': 'columnheader',
                    },
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkFooterCell, deps: [{ token: CdkColumnDef }, { token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.0.0", type: CdkFooterCell, selector: "cdk-footer-cell, td[cdk-footer-cell]", host: { classAttribute: "cdk-footer-cell" }, usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkFooterCell, decorators: [{
            type: Directive,
            args: [{
                    selector: 'cdk-footer-cell, td[cdk-footer-cell]',
                    host: {
                        'class': 'cdk-footer-cell',
                    },
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkCell, deps: [{ token: CdkColumnDef }, { token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.0.0", type: CdkCell, selector: "cdk-cell, td[cdk-cell]", host: { classAttribute: "cdk-cell" }, usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkCell, decorators: [{
            type: Directive,
            args: [{
                    selector: 'cdk-cell, td[cdk-cell]',
                    host: {
                        'class': 'cdk-cell',
                    },
                }]
        }], ctorParameters: () => [{ type: CdkColumnDef }, { type: i0.ElementRef }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGFibGUvY2VsbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsWUFBWSxFQUNaLFNBQVMsRUFDVCxVQUFVLEVBQ1YsTUFBTSxFQUNOLEtBQUssRUFDTCxRQUFRLEVBQ1IsV0FBVyxFQUNYLGdCQUFnQixHQUNqQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQXlCLG1CQUFtQixFQUFDLE1BQU0sYUFBYSxDQUFDO0FBQ3hFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxVQUFVLENBQUM7O0FBT25DOzs7R0FHRztBQUVILE1BQU0sT0FBTyxVQUFVO0lBQ3JCLFlBQVksb0JBQW9CLENBQVEsUUFBMEI7UUFBMUIsYUFBUSxHQUFSLFFBQVEsQ0FBa0I7SUFBRyxDQUFDOzhHQUQzRCxVQUFVO2tHQUFWLFVBQVU7OzJGQUFWLFVBQVU7a0JBRHRCLFNBQVM7bUJBQUMsRUFBQyxRQUFRLEVBQUUsY0FBYyxFQUFDOztBQUtyQzs7O0dBR0c7QUFFSCxNQUFNLE9BQU8sZ0JBQWdCO0lBQzNCLFlBQVksb0JBQW9CLENBQVEsUUFBMEI7UUFBMUIsYUFBUSxHQUFSLFFBQVEsQ0FBa0I7SUFBRyxDQUFDOzhHQUQzRCxnQkFBZ0I7a0dBQWhCLGdCQUFnQjs7MkZBQWhCLGdCQUFnQjtrQkFENUIsU0FBUzttQkFBQyxFQUFDLFFBQVEsRUFBRSxvQkFBb0IsRUFBQzs7QUFLM0M7OztHQUdHO0FBRUgsTUFBTSxPQUFPLGdCQUFnQjtJQUMzQixZQUFZLG9CQUFvQixDQUFRLFFBQTBCO1FBQTFCLGFBQVEsR0FBUixRQUFRLENBQWtCO0lBQUcsQ0FBQzs4R0FEM0QsZ0JBQWdCO2tHQUFoQixnQkFBZ0I7OzJGQUFoQixnQkFBZ0I7a0JBRDVCLFNBQVM7bUJBQUMsRUFBQyxRQUFRLEVBQUUsb0JBQW9CLEVBQUM7O0FBSzND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LEVBQUU7WUFDOUQsTUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNsRixNQUFNLElBQUksR0FBRyxTQUFTLEtBQUssTUFBTSxJQUFJLFNBQVMsS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1lBQ3BGLFVBQVUsQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztTQUNyRDtJQUNILENBQUM7OEdBUlUsT0FBTztrR0FBUCxPQUFPOzsyRkFBUCxPQUFPO2tCQU5uQixTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSx3QkFBd0I7b0JBQ2xDLElBQUksRUFBRTt3QkFDSixPQUFPLEVBQUUsVUFBVTtxQkFDcEI7aUJBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgQ29udGVudENoaWxkLFxuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEluamVjdCxcbiAgSW5wdXQsXG4gIE9wdGlvbmFsLFxuICBUZW1wbGF0ZVJlZixcbiAgYm9vbGVhbkF0dHJpYnV0ZSxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0NhblN0aWNrLCBDYW5TdGlja0N0b3IsIG1peGluSGFzU3RpY2t5SW5wdXR9IGZyb20gJy4vY2FuLXN0aWNrJztcbmltcG9ydCB7Q0RLX1RBQkxFfSBmcm9tICcuL3Rva2Vucyc7XG5cbi8qKiBCYXNlIGludGVyZmFjZSBmb3IgYSBjZWxsIGRlZmluaXRpb24uIENhcHR1cmVzIGEgY29sdW1uJ3MgY2VsbCB0ZW1wbGF0ZSBkZWZpbml0aW9uLiAqL1xuZXhwb3J0IGludGVyZmFjZSBDZWxsRGVmIHtcbiAgdGVtcGxhdGU6IFRlbXBsYXRlUmVmPGFueT47XG59XG5cbi8qKlxuICogQ2VsbCBkZWZpbml0aW9uIGZvciBhIENESyB0YWJsZS5cbiAqIENhcHR1cmVzIHRoZSB0ZW1wbGF0ZSBvZiBhIGNvbHVtbidzIGRhdGEgcm93IGNlbGwgYXMgd2VsbCBhcyBjZWxsLXNwZWNpZmljIHByb3BlcnRpZXMuXG4gKi9cbkBEaXJlY3RpdmUoe3NlbGVjdG9yOiAnW2Nka0NlbGxEZWZdJ30pXG5leHBvcnQgY2xhc3MgQ2RrQ2VsbERlZiBpbXBsZW1lbnRzIENlbGxEZWYge1xuICBjb25zdHJ1Y3RvcigvKiogQGRvY3MtcHJpdmF0ZSAqLyBwdWJsaWMgdGVtcGxhdGU6IFRlbXBsYXRlUmVmPGFueT4pIHt9XG59XG5cbi8qKlxuICogSGVhZGVyIGNlbGwgZGVmaW5pdGlvbiBmb3IgYSBDREsgdGFibGUuXG4gKiBDYXB0dXJlcyB0aGUgdGVtcGxhdGUgb2YgYSBjb2x1bW4ncyBoZWFkZXIgY2VsbCBhbmQgYXMgd2VsbCBhcyBjZWxsLXNwZWNpZmljIHByb3BlcnRpZXMuXG4gKi9cbkBEaXJlY3RpdmUoe3NlbGVjdG9yOiAnW2Nka0hlYWRlckNlbGxEZWZdJ30pXG5leHBvcnQgY2xhc3MgQ2RrSGVhZGVyQ2VsbERlZiBpbXBsZW1lbnRzIENlbGxEZWYge1xuICBjb25zdHJ1Y3RvcigvKiogQGRvY3MtcHJpdmF0ZSAqLyBwdWJsaWMgdGVtcGxhdGU6IFRlbXBsYXRlUmVmPGFueT4pIHt9XG59XG5cbi8qKlxuICogRm9vdGVyIGNlbGwgZGVmaW5pdGlvbiBmb3IgYSBDREsgdGFibGUuXG4gKiBDYXB0dXJlcyB0aGUgdGVtcGxhdGUgb2YgYSBjb2x1bW4ncyBmb290ZXIgY2VsbCBhbmQgYXMgd2VsbCBhcyBjZWxsLXNwZWNpZmljIHByb3BlcnRpZXMuXG4gKi9cbkBEaXJlY3RpdmUoe3NlbGVjdG9yOiAnW2Nka0Zvb3RlckNlbGxEZWZdJ30pXG5leHBvcnQgY2xhc3MgQ2RrRm9vdGVyQ2VsbERlZiBpbXBsZW1lbnRzIENlbGxEZWYge1xuICBjb25zdHJ1Y3RvcigvKiogQGRvY3MtcHJpdmF0ZSAqLyBwdWJsaWMgdGVtcGxhdGU6IFRlbXBsYXRlUmVmPGFueT4pIHt9XG59XG5cbi8vIEJvaWxlcnBsYXRlIGZvciBhcHBseWluZyBtaXhpbnMgdG8gQ2RrQ29sdW1uRGVmLlxuLyoqIEBkb2NzLXByaXZhdGUgKi9cbmNsYXNzIENka0NvbHVtbkRlZkJhc2Uge31cbmNvbnN0IF9DZGtDb2x1bW5EZWZCYXNlOiBDYW5TdGlja0N0b3IgJiB0eXBlb2YgQ2RrQ29sdW1uRGVmQmFzZSA9XG4gIG1peGluSGFzU3RpY2t5SW5wdXQoQ2RrQ29sdW1uRGVmQmFzZSk7XG5cbi8qKlxuICogQ29sdW1uIGRlZmluaXRpb24gZm9yIHRoZSBDREsgdGFibGUuXG4gKiBEZWZpbmVzIGEgc2V0IG9mIGNlbGxzIGF2YWlsYWJsZSBmb3IgYSB0YWJsZSBjb2x1bW4uXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtDb2x1bW5EZWZdJyxcbiAgaW5wdXRzOiBbJ3N0aWNreSddLFxuICBwcm92aWRlcnM6IFt7cHJvdmlkZTogJ01BVF9TT1JUX0hFQURFUl9DT0xVTU5fREVGJywgdXNlRXhpc3Rpbmc6IENka0NvbHVtbkRlZn1dLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtDb2x1bW5EZWYgZXh0ZW5kcyBfQ2RrQ29sdW1uRGVmQmFzZSBpbXBsZW1lbnRzIENhblN0aWNrIHtcbiAgLyoqIFVuaXF1ZSBuYW1lIGZvciB0aGlzIGNvbHVtbi4gKi9cbiAgQElucHV0KCdjZGtDb2x1bW5EZWYnKVxuICBnZXQgbmFtZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLl9uYW1lO1xuICB9XG4gIHNldCBuYW1lKG5hbWU6IHN0cmluZykge1xuICAgIHRoaXMuX3NldE5hbWVJbnB1dChuYW1lKTtcbiAgfVxuICBwcm90ZWN0ZWQgX25hbWU6IHN0cmluZztcblxuICAvKipcbiAgICogV2hldGhlciB0aGlzIGNvbHVtbiBzaG91bGQgYmUgc3RpY2t5IHBvc2l0aW9uZWQgb24gdGhlIGVuZCBvZiB0aGUgcm93LiBTaG91bGQgbWFrZSBzdXJlXG4gICAqIHRoYXQgaXQgbWltaWNzIHRoZSBgQ2FuU3RpY2tgIG1peGluIHN1Y2ggdGhhdCBgX2hhc1N0aWNreUNoYW5nZWRgIGlzIHNldCB0byB0cnVlIGlmIHRoZSB2YWx1ZVxuICAgKiBoYXMgYmVlbiBjaGFuZ2VkLlxuICAgKi9cbiAgQElucHV0KHt0cmFuc2Zvcm06IGJvb2xlYW5BdHRyaWJ1dGV9KVxuICBnZXQgc3RpY2t5RW5kKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9zdGlja3lFbmQ7XG4gIH1cbiAgc2V0IHN0aWNreUVuZCh2YWx1ZTogYm9vbGVhbikge1xuICAgIGlmICh2YWx1ZSAhPT0gdGhpcy5fc3RpY2t5RW5kKSB7XG4gICAgICB0aGlzLl9zdGlja3lFbmQgPSB2YWx1ZTtcbiAgICAgIHRoaXMuX2hhc1N0aWNreUNoYW5nZWQgPSB0cnVlO1xuICAgIH1cbiAgfVxuICBfc3RpY2t5RW5kOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqIEBkb2NzLXByaXZhdGUgKi9cbiAgQENvbnRlbnRDaGlsZChDZGtDZWxsRGVmKSBjZWxsOiBDZGtDZWxsRGVmO1xuXG4gIC8qKiBAZG9jcy1wcml2YXRlICovXG4gIEBDb250ZW50Q2hpbGQoQ2RrSGVhZGVyQ2VsbERlZikgaGVhZGVyQ2VsbDogQ2RrSGVhZGVyQ2VsbERlZjtcblxuICAvKiogQGRvY3MtcHJpdmF0ZSAqL1xuICBAQ29udGVudENoaWxkKENka0Zvb3RlckNlbGxEZWYpIGZvb3RlckNlbGw6IENka0Zvb3RlckNlbGxEZWY7XG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybWVkIHZlcnNpb24gb2YgdGhlIGNvbHVtbiBuYW1lIHRoYXQgY2FuIGJlIHVzZWQgYXMgcGFydCBvZiBhIENTUyBjbGFzc25hbWUuIEV4Y2x1ZGVzXG4gICAqIGFsbCBub24tYWxwaGFudW1lcmljIGNoYXJhY3RlcnMgYW5kIHRoZSBzcGVjaWFsIGNoYXJhY3RlcnMgJy0nIGFuZCAnXycuIEFueSBjaGFyYWN0ZXJzIHRoYXRcbiAgICogZG8gbm90IG1hdGNoIGFyZSByZXBsYWNlZCBieSB0aGUgJy0nIGNoYXJhY3Rlci5cbiAgICovXG4gIGNzc0NsYXNzRnJpZW5kbHlOYW1lOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIENsYXNzIG5hbWUgZm9yIGNlbGxzIGluIHRoaXMgY29sdW1uLlxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICBfY29sdW1uQ3NzQ2xhc3NOYW1lOiBzdHJpbmdbXTtcblxuICBjb25zdHJ1Y3RvcihASW5qZWN0KENES19UQUJMRSkgQE9wdGlvbmFsKCkgcHVibGljIF90YWJsZT86IGFueSkge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcnJpZGFibGUgbWV0aG9kIHRoYXQgc2V0cyB0aGUgY3NzIGNsYXNzZXMgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIGV2ZXJ5IGNlbGwgaW4gdGhpc1xuICAgKiBjb2x1bW4uXG4gICAqIEluIHRoZSBmdXR1cmUsIGNvbHVtbkNzc0NsYXNzTmFtZSB3aWxsIGNoYW5nZSBmcm9tIHR5cGUgc3RyaW5nW10gdG8gc3RyaW5nIGFuZCB0aGlzXG4gICAqIHdpbGwgc2V0IGEgc2luZ2xlIHN0cmluZyB2YWx1ZS5cbiAgICogQGRvY3MtcHJpdmF0ZVxuICAgKi9cbiAgcHJvdGVjdGVkIF91cGRhdGVDb2x1bW5Dc3NDbGFzc05hbWUoKSB7XG4gICAgdGhpcy5fY29sdW1uQ3NzQ2xhc3NOYW1lID0gW2BjZGstY29sdW1uLSR7dGhpcy5jc3NDbGFzc0ZyaWVuZGx5TmFtZX1gXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIGhhcyBiZWVuIGV4dHJhY3RlZCB0byBhIHV0aWwgYmVjYXVzZSBvZiBUUyA0IGFuZCBWRS5cbiAgICogVmlldyBFbmdpbmUgZG9lc24ndCBzdXBwb3J0IHByb3BlcnR5IHJlbmFtZSBpbmhlcml0YW5jZS5cbiAgICogVFMgNC4wIGRvZXNuJ3QgYWxsb3cgcHJvcGVydGllcyB0byBvdmVycmlkZSBhY2Nlc3NvcnMgb3IgdmljZS12ZXJzYS5cbiAgICogQGRvY3MtcHJpdmF0ZVxuICAgKi9cbiAgcHJvdGVjdGVkIF9zZXROYW1lSW5wdXQodmFsdWU6IHN0cmluZykge1xuICAgIC8vIElmIHRoZSBkaXJlY3RpdmUgaXMgc2V0IHdpdGhvdXQgYSBuYW1lICh1cGRhdGVkIHByb2dyYW1tYXRpY2FsbHkpLCB0aGVuIHRoaXMgc2V0dGVyIHdpbGxcbiAgICAvLyB0cmlnZ2VyIHdpdGggYW4gZW1wdHkgc3RyaW5nIGFuZCBzaG91bGQgbm90IG92ZXJ3cml0ZSB0aGUgcHJvZ3JhbW1hdGljYWxseSBzZXQgdmFsdWUuXG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICB0aGlzLl9uYW1lID0gdmFsdWU7XG4gICAgICB0aGlzLmNzc0NsYXNzRnJpZW5kbHlOYW1lID0gdmFsdWUucmVwbGFjZSgvW15hLXowLTlfLV0vZ2ksICctJyk7XG4gICAgICB0aGlzLl91cGRhdGVDb2x1bW5Dc3NDbGFzc05hbWUoKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIEJhc2UgY2xhc3MgZm9yIHRoZSBjZWxscy4gQWRkcyBhIENTUyBjbGFzc25hbWUgdGhhdCBpZGVudGlmaWVzIHRoZSBjb2x1bW4gaXQgcmVuZGVycyBpbi4gKi9cbmV4cG9ydCBjbGFzcyBCYXNlQ2RrQ2VsbCB7XG4gIGNvbnN0cnVjdG9yKGNvbHVtbkRlZjogQ2RrQ29sdW1uRGVmLCBlbGVtZW50UmVmOiBFbGVtZW50UmVmKSB7XG4gICAgZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmNsYXNzTGlzdC5hZGQoLi4uY29sdW1uRGVmLl9jb2x1bW5Dc3NDbGFzc05hbWUpO1xuICB9XG59XG5cbi8qKiBIZWFkZXIgY2VsbCB0ZW1wbGF0ZSBjb250YWluZXIgdGhhdCBhZGRzIHRoZSByaWdodCBjbGFzc2VzIGFuZCByb2xlLiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnY2RrLWhlYWRlci1jZWxsLCB0aFtjZGstaGVhZGVyLWNlbGxdJyxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstaGVhZGVyLWNlbGwnLFxuICAgICdyb2xlJzogJ2NvbHVtbmhlYWRlcicsXG4gIH0sXG59KVxuZXhwb3J0IGNsYXNzIENka0hlYWRlckNlbGwgZXh0ZW5kcyBCYXNlQ2RrQ2VsbCB7XG4gIGNvbnN0cnVjdG9yKGNvbHVtbkRlZjogQ2RrQ29sdW1uRGVmLCBlbGVtZW50UmVmOiBFbGVtZW50UmVmKSB7XG4gICAgc3VwZXIoY29sdW1uRGVmLCBlbGVtZW50UmVmKTtcbiAgfVxufVxuXG4vKiogRm9vdGVyIGNlbGwgdGVtcGxhdGUgY29udGFpbmVyIHRoYXQgYWRkcyB0aGUgcmlnaHQgY2xhc3NlcyBhbmQgcm9sZS4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ2Nkay1mb290ZXItY2VsbCwgdGRbY2RrLWZvb3Rlci1jZWxsXScsXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLWZvb3Rlci1jZWxsJyxcbiAgfSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrRm9vdGVyQ2VsbCBleHRlbmRzIEJhc2VDZGtDZWxsIHtcbiAgY29uc3RydWN0b3IoY29sdW1uRGVmOiBDZGtDb2x1bW5EZWYsIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHtcbiAgICBzdXBlcihjb2x1bW5EZWYsIGVsZW1lbnRSZWYpO1xuICAgIGlmIChjb2x1bW5EZWYuX3RhYmxlPy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50Lm5vZGVUeXBlID09PSAxKSB7XG4gICAgICBjb25zdCB0YWJsZVJvbGUgPSBjb2x1bW5EZWYuX3RhYmxlLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuZ2V0QXR0cmlidXRlKCdyb2xlJyk7XG4gICAgICBjb25zdCByb2xlID0gdGFibGVSb2xlID09PSAnZ3JpZCcgfHwgdGFibGVSb2xlID09PSAndHJlZWdyaWQnID8gJ2dyaWRjZWxsJyA6ICdjZWxsJztcbiAgICAgIGVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCByb2xlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIENlbGwgdGVtcGxhdGUgY29udGFpbmVyIHRoYXQgYWRkcyB0aGUgcmlnaHQgY2xhc3NlcyBhbmQgcm9sZS4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ2Nkay1jZWxsLCB0ZFtjZGstY2VsbF0nLFxuICBob3N0OiB7XG4gICAgJ2NsYXNzJzogJ2Nkay1jZWxsJyxcbiAgfSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrQ2VsbCBleHRlbmRzIEJhc2VDZGtDZWxsIHtcbiAgY29uc3RydWN0b3IoY29sdW1uRGVmOiBDZGtDb2x1bW5EZWYsIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHtcbiAgICBzdXBlcihjb2x1bW5EZWYsIGVsZW1lbnRSZWYpO1xuICAgIGlmIChjb2x1bW5EZWYuX3RhYmxlPy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50Lm5vZGVUeXBlID09PSAxKSB7XG4gICAgICBjb25zdCB0YWJsZVJvbGUgPSBjb2x1bW5EZWYuX3RhYmxlLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuZ2V0QXR0cmlidXRlKCdyb2xlJyk7XG4gICAgICBjb25zdCByb2xlID0gdGFibGVSb2xlID09PSAnZ3JpZCcgfHwgdGFibGVSb2xlID09PSAndHJlZWdyaWQnID8gJ2dyaWRjZWxsJyA6ICdjZWxsJztcbiAgICAgIGVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCByb2xlKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==