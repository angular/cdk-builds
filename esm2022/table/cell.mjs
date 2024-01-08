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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: CdkCellDef, deps: [{ token: i0.TemplateRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.1.0-next.5", type: CdkCellDef, isStandalone: true, selector: "[cdkCellDef]", ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: CdkCellDef, decorators: [{
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: CdkHeaderCellDef, deps: [{ token: i0.TemplateRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.1.0-next.5", type: CdkHeaderCellDef, isStandalone: true, selector: "[cdkHeaderCellDef]", ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: CdkHeaderCellDef, decorators: [{
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: CdkFooterCellDef, deps: [{ token: i0.TemplateRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.1.0-next.5", type: CdkFooterCellDef, isStandalone: true, selector: "[cdkFooterCellDef]", ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: CdkFooterCellDef, decorators: [{
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: CdkColumnDef, deps: [{ token: CDK_TABLE, optional: true }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "16.1.0", version: "17.1.0-next.5", type: CdkColumnDef, isStandalone: true, selector: "[cdkColumnDef]", inputs: { sticky: "sticky", name: ["cdkColumnDef", "name"], stickyEnd: ["stickyEnd", "stickyEnd", booleanAttribute] }, providers: [{ provide: 'MAT_SORT_HEADER_COLUMN_DEF', useExisting: CdkColumnDef }], queries: [{ propertyName: "cell", first: true, predicate: CdkCellDef, descendants: true }, { propertyName: "headerCell", first: true, predicate: CdkHeaderCellDef, descendants: true }, { propertyName: "footerCell", first: true, predicate: CdkFooterCellDef, descendants: true }], usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: CdkColumnDef, decorators: [{
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: CdkHeaderCell, deps: [{ token: CdkColumnDef }, { token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.1.0-next.5", type: CdkHeaderCell, isStandalone: true, selector: "cdk-header-cell, th[cdk-header-cell]", host: { attributes: { "role": "columnheader" }, classAttribute: "cdk-header-cell" }, usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: CdkHeaderCell, decorators: [{
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
        const role = columnDef._table?._cellRole;
        if (role) {
            elementRef.nativeElement.setAttribute('role', role);
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: CdkFooterCell, deps: [{ token: CdkColumnDef }, { token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.1.0-next.5", type: CdkFooterCell, isStandalone: true, selector: "cdk-footer-cell, td[cdk-footer-cell]", host: { classAttribute: "cdk-footer-cell" }, usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: CdkFooterCell, decorators: [{
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
        const role = columnDef._table?._cellRole;
        if (role) {
            elementRef.nativeElement.setAttribute('role', role);
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: CdkCell, deps: [{ token: CdkColumnDef }, { token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.1.0-next.5", type: CdkCell, isStandalone: true, selector: "cdk-cell, td[cdk-cell]", host: { classAttribute: "cdk-cell" }, usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: CdkCell, decorators: [{
            type: Directive,
            args: [{
                    selector: 'cdk-cell, td[cdk-cell]',
                    host: {
                        'class': 'cdk-cell',
                    },
                    standalone: true,
                }]
        }], ctorParameters: () => [{ type: CdkColumnDef }, { type: i0.ElementRef }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGFibGUvY2VsbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsWUFBWSxFQUNaLFNBQVMsRUFDVCxVQUFVLEVBQ1YsTUFBTSxFQUNOLEtBQUssRUFDTCxRQUFRLEVBQ1IsV0FBVyxFQUNYLGdCQUFnQixHQUNqQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQXlCLG1CQUFtQixFQUFDLE1BQU0sYUFBYSxDQUFDO0FBQ3hFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxVQUFVLENBQUM7O0FBT25DOzs7R0FHRztBQUtILE1BQU0sT0FBTyxVQUFVO0lBQ3JCLFlBQVksb0JBQW9CLENBQVEsUUFBMEI7UUFBMUIsYUFBUSxHQUFSLFFBQVEsQ0FBa0I7SUFBRyxDQUFDO3FIQUQzRCxVQUFVO3lHQUFWLFVBQVU7O2tHQUFWLFVBQVU7a0JBSnRCLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLGNBQWM7b0JBQ3hCLFVBQVUsRUFBRSxJQUFJO2lCQUNqQjs7QUFLRDs7O0dBR0c7QUFLSCxNQUFNLE9BQU8sZ0JBQWdCO0lBQzNCLFlBQVksb0JBQW9CLENBQVEsUUFBMEI7UUFBMUIsYUFBUSxHQUFSLFFBQVEsQ0FBa0I7SUFBRyxDQUFDO3FIQUQzRCxnQkFBZ0I7eUdBQWhCLGdCQUFnQjs7a0dBQWhCLGdCQUFnQjtrQkFKNUIsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUsb0JBQW9CO29CQUM5QixVQUFVLEVBQUUsSUFBSTtpQkFDakI7O0FBS0Q7OztHQUdHO0FBS0gsTUFBTSxPQUFPLGdCQUFnQjtJQUMzQixZQUFZLG9CQUFvQixDQUFRLFFBQTBCO1FBQTFCLGFBQVEsR0FBUixRQUFRLENBQWtCO0lBQUcsQ0FBQztxSEFEM0QsZ0JBQWdCO3lHQUFoQixnQkFBZ0I7O2tHQUFoQixnQkFBZ0I7a0JB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QVUsQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN0RCxDQUFDO0lBQ0gsQ0FBQztxSEFQVSxPQUFPO3lHQUFQLE9BQU87O2tHQUFQLE9BQU87a0JBUG5CLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLHdCQUF3QjtvQkFDbEMsSUFBSSxFQUFFO3dCQUNKLE9BQU8sRUFBRSxVQUFVO3FCQUNwQjtvQkFDRCxVQUFVLEVBQUUsSUFBSTtpQkFDakIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgQ29udGVudENoaWxkLFxuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEluamVjdCxcbiAgSW5wdXQsXG4gIE9wdGlvbmFsLFxuICBUZW1wbGF0ZVJlZixcbiAgYm9vbGVhbkF0dHJpYnV0ZSxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0NhblN0aWNrLCBDYW5TdGlja0N0b3IsIG1peGluSGFzU3RpY2t5SW5wdXR9IGZyb20gJy4vY2FuLXN0aWNrJztcbmltcG9ydCB7Q0RLX1RBQkxFfSBmcm9tICcuL3Rva2Vucyc7XG5cbi8qKiBCYXNlIGludGVyZmFjZSBmb3IgYSBjZWxsIGRlZmluaXRpb24uIENhcHR1cmVzIGEgY29sdW1uJ3MgY2VsbCB0ZW1wbGF0ZSBkZWZpbml0aW9uLiAqL1xuZXhwb3J0IGludGVyZmFjZSBDZWxsRGVmIHtcbiAgdGVtcGxhdGU6IFRlbXBsYXRlUmVmPGFueT47XG59XG5cbi8qKlxuICogQ2VsbCBkZWZpbml0aW9uIGZvciBhIENESyB0YWJsZS5cbiAqIENhcHR1cmVzIHRoZSB0ZW1wbGF0ZSBvZiBhIGNvbHVtbidzIGRhdGEgcm93IGNlbGwgYXMgd2VsbCBhcyBjZWxsLXNwZWNpZmljIHByb3BlcnRpZXMuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtDZWxsRGVmXScsXG4gIHN0YW5kYWxvbmU6IHRydWUsXG59KVxuZXhwb3J0IGNsYXNzIENka0NlbGxEZWYgaW1wbGVtZW50cyBDZWxsRGVmIHtcbiAgY29uc3RydWN0b3IoLyoqIEBkb2NzLXByaXZhdGUgKi8gcHVibGljIHRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxhbnk+KSB7fVxufVxuXG4vKipcbiAqIEhlYWRlciBjZWxsIGRlZmluaXRpb24gZm9yIGEgQ0RLIHRhYmxlLlxuICogQ2FwdHVyZXMgdGhlIHRlbXBsYXRlIG9mIGEgY29sdW1uJ3MgaGVhZGVyIGNlbGwgYW5kIGFzIHdlbGwgYXMgY2VsbC1zcGVjaWZpYyBwcm9wZXJ0aWVzLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrSGVhZGVyQ2VsbERlZl0nLFxuICBzdGFuZGFsb25lOiB0cnVlLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtIZWFkZXJDZWxsRGVmIGltcGxlbWVudHMgQ2VsbERlZiB7XG4gIGNvbnN0cnVjdG9yKC8qKiBAZG9jcy1wcml2YXRlICovIHB1YmxpYyB0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8YW55Pikge31cbn1cblxuLyoqXG4gKiBGb290ZXIgY2VsbCBkZWZpbml0aW9uIGZvciBhIENESyB0YWJsZS5cbiAqIENhcHR1cmVzIHRoZSB0ZW1wbGF0ZSBvZiBhIGNvbHVtbidzIGZvb3RlciBjZWxsIGFuZCBhcyB3ZWxsIGFzIGNlbGwtc3BlY2lmaWMgcHJvcGVydGllcy5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka0Zvb3RlckNlbGxEZWZdJyxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrRm9vdGVyQ2VsbERlZiBpbXBsZW1lbnRzIENlbGxEZWYge1xuICBjb25zdHJ1Y3RvcigvKiogQGRvY3MtcHJpdmF0ZSAqLyBwdWJsaWMgdGVtcGxhdGU6IFRlbXBsYXRlUmVmPGFueT4pIHt9XG59XG5cbi8vIEJvaWxlcnBsYXRlIGZvciBhcHBseWluZyBtaXhpbnMgdG8gQ2RrQ29sdW1uRGVmLlxuLyoqIEBkb2NzLXByaXZhdGUgKi9cbmNsYXNzIENka0NvbHVtbkRlZkJhc2Uge31cbmNvbnN0IF9DZGtDb2x1bW5EZWZCYXNlOiBDYW5TdGlja0N0b3IgJiB0eXBlb2YgQ2RrQ29sdW1uRGVmQmFzZSA9XG4gIG1peGluSGFzU3RpY2t5SW5wdXQoQ2RrQ29sdW1uRGVmQmFzZSk7XG5cbi8qKlxuICogQ29sdW1uIGRlZmluaXRpb24gZm9yIHRoZSBDREsgdGFibGUuXG4gKiBEZWZpbmVzIGEgc2V0IG9mIGNlbGxzIGF2YWlsYWJsZSBmb3IgYSB0YWJsZSBjb2x1bW4uXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtDb2x1bW5EZWZdJyxcbiAgaW5wdXRzOiBbJ3N0aWNreSddLFxuICBwcm92aWRlcnM6IFt7cHJvdmlkZTogJ01BVF9TT1JUX0hFQURFUl9DT0xVTU5fREVGJywgdXNlRXhpc3Rpbmc6IENka0NvbHVtbkRlZn1dLFxuICBzdGFuZGFsb25lOiB0cnVlLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtDb2x1bW5EZWYgZXh0ZW5kcyBfQ2RrQ29sdW1uRGVmQmFzZSBpbXBsZW1lbnRzIENhblN0aWNrIHtcbiAgLyoqIFVuaXF1ZSBuYW1lIGZvciB0aGlzIGNvbHVtbi4gKi9cbiAgQElucHV0KCdjZGtDb2x1bW5EZWYnKVxuICBnZXQgbmFtZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLl9uYW1lO1xuICB9XG4gIHNldCBuYW1lKG5hbWU6IHN0cmluZykge1xuICAgIHRoaXMuX3NldE5hbWVJbnB1dChuYW1lKTtcbiAgfVxuICBwcm90ZWN0ZWQgX25hbWU6IHN0cmluZztcblxuICAvKipcbiAgICogV2hldGhlciB0aGlzIGNvbHVtbiBzaG91bGQgYmUgc3RpY2t5IHBvc2l0aW9uZWQgb24gdGhlIGVuZCBvZiB0aGUgcm93LiBTaG91bGQgbWFrZSBzdXJlXG4gICAqIHRoYXQgaXQgbWltaWNzIHRoZSBgQ2FuU3RpY2tgIG1peGluIHN1Y2ggdGhhdCBgX2hhc1N0aWNreUNoYW5nZWRgIGlzIHNldCB0byB0cnVlIGlmIHRoZSB2YWx1ZVxuICAgKiBoYXMgYmVlbiBjaGFuZ2VkLlxuICAgKi9cbiAgQElucHV0KHt0cmFuc2Zvcm06IGJvb2xlYW5BdHRyaWJ1dGV9KVxuICBnZXQgc3RpY2t5RW5kKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9zdGlja3lFbmQ7XG4gIH1cbiAgc2V0IHN0aWNreUVuZCh2YWx1ZTogYm9vbGVhbikge1xuICAgIGlmICh2YWx1ZSAhPT0gdGhpcy5fc3RpY2t5RW5kKSB7XG4gICAgICB0aGlzLl9zdGlja3lFbmQgPSB2YWx1ZTtcbiAgICAgIHRoaXMuX2hhc1N0aWNreUNoYW5nZWQgPSB0cnVlO1xuICAgIH1cbiAgfVxuICBfc3RpY2t5RW5kOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqIEBkb2NzLXByaXZhdGUgKi9cbiAgQENvbnRlbnRDaGlsZChDZGtDZWxsRGVmKSBjZWxsOiBDZGtDZWxsRGVmO1xuXG4gIC8qKiBAZG9jcy1wcml2YXRlICovXG4gIEBDb250ZW50Q2hpbGQoQ2RrSGVhZGVyQ2VsbERlZikgaGVhZGVyQ2VsbDogQ2RrSGVhZGVyQ2VsbERlZjtcblxuICAvKiogQGRvY3MtcHJpdmF0ZSAqL1xuICBAQ29udGVudENoaWxkKENka0Zvb3RlckNlbGxEZWYpIGZvb3RlckNlbGw6IENka0Zvb3RlckNlbGxEZWY7XG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybWVkIHZlcnNpb24gb2YgdGhlIGNvbHVtbiBuYW1lIHRoYXQgY2FuIGJlIHVzZWQgYXMgcGFydCBvZiBhIENTUyBjbGFzc25hbWUuIEV4Y2x1ZGVzXG4gICAqIGFsbCBub24tYWxwaGFudW1lcmljIGNoYXJhY3RlcnMgYW5kIHRoZSBzcGVjaWFsIGNoYXJhY3RlcnMgJy0nIGFuZCAnXycuIEFueSBjaGFyYWN0ZXJzIHRoYXRcbiAgICogZG8gbm90IG1hdGNoIGFyZSByZXBsYWNlZCBieSB0aGUgJy0nIGNoYXJhY3Rlci5cbiAgICovXG4gIGNzc0NsYXNzRnJpZW5kbHlOYW1lOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIENsYXNzIG5hbWUgZm9yIGNlbGxzIGluIHRoaXMgY29sdW1uLlxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICBfY29sdW1uQ3NzQ2xhc3NOYW1lOiBzdHJpbmdbXTtcblxuICBjb25zdHJ1Y3RvcihASW5qZWN0KENES19UQUJMRSkgQE9wdGlvbmFsKCkgcHVibGljIF90YWJsZT86IGFueSkge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcnJpZGFibGUgbWV0aG9kIHRoYXQgc2V0cyB0aGUgY3NzIGNsYXNzZXMgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIGV2ZXJ5IGNlbGwgaW4gdGhpc1xuICAgKiBjb2x1bW4uXG4gICAqIEluIHRoZSBmdXR1cmUsIGNvbHVtbkNzc0NsYXNzTmFtZSB3aWxsIGNoYW5nZSBmcm9tIHR5cGUgc3RyaW5nW10gdG8gc3RyaW5nIGFuZCB0aGlzXG4gICAqIHdpbGwgc2V0IGEgc2luZ2xlIHN0cmluZyB2YWx1ZS5cbiAgICogQGRvY3MtcHJpdmF0ZVxuICAgKi9cbiAgcHJvdGVjdGVkIF91cGRhdGVDb2x1bW5Dc3NDbGFzc05hbWUoKSB7XG4gICAgdGhpcy5fY29sdW1uQ3NzQ2xhc3NOYW1lID0gW2BjZGstY29sdW1uLSR7dGhpcy5jc3NDbGFzc0ZyaWVuZGx5TmFtZX1gXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIGhhcyBiZWVuIGV4dHJhY3RlZCB0byBhIHV0aWwgYmVjYXVzZSBvZiBUUyA0IGFuZCBWRS5cbiAgICogVmlldyBFbmdpbmUgZG9lc24ndCBzdXBwb3J0IHByb3BlcnR5IHJlbmFtZSBpbmhlcml0YW5jZS5cbiAgICogVFMgNC4wIGRvZXNuJ3QgYWxsb3cgcHJvcGVydGllcyB0byBvdmVycmlkZSBhY2Nlc3NvcnMgb3IgdmljZS12ZXJzYS5cbiAgICogQGRvY3MtcHJpdmF0ZVxuICAgKi9cbiAgcHJvdGVjdGVkIF9zZXROYW1lSW5wdXQodmFsdWU6IHN0cmluZykge1xuICAgIC8vIElmIHRoZSBkaXJlY3RpdmUgaXMgc2V0IHdpdGhvdXQgYSBuYW1lICh1cGRhdGVkIHByb2dyYW1tYXRpY2FsbHkpLCB0aGVuIHRoaXMgc2V0dGVyIHdpbGxcbiAgICAvLyB0cmlnZ2VyIHdpdGggYW4gZW1wdHkgc3RyaW5nIGFuZCBzaG91bGQgbm90IG92ZXJ3cml0ZSB0aGUgcHJvZ3JhbW1hdGljYWxseSBzZXQgdmFsdWUuXG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICB0aGlzLl9uYW1lID0gdmFsdWU7XG4gICAgICB0aGlzLmNzc0NsYXNzRnJpZW5kbHlOYW1lID0gdmFsdWUucmVwbGFjZSgvW15hLXowLTlfLV0vZ2ksICctJyk7XG4gICAgICB0aGlzLl91cGRhdGVDb2x1bW5Dc3NDbGFzc05hbWUoKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIEJhc2UgY2xhc3MgZm9yIHRoZSBjZWxscy4gQWRkcyBhIENTUyBjbGFzc25hbWUgdGhhdCBpZGVudGlmaWVzIHRoZSBjb2x1bW4gaXQgcmVuZGVycyBpbi4gKi9cbmV4cG9ydCBjbGFzcyBCYXNlQ2RrQ2VsbCB7XG4gIGNvbnN0cnVjdG9yKGNvbHVtbkRlZjogQ2RrQ29sdW1uRGVmLCBlbGVtZW50UmVmOiBFbGVtZW50UmVmKSB7XG4gICAgZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmNsYXNzTGlzdC5hZGQoLi4uY29sdW1uRGVmLl9jb2x1bW5Dc3NDbGFzc05hbWUpO1xuICB9XG59XG5cbi8qKiBIZWFkZXIgY2VsbCB0ZW1wbGF0ZSBjb250YWluZXIgdGhhdCBhZGRzIHRoZSByaWdodCBjbGFzc2VzIGFuZCByb2xlLiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnY2RrLWhlYWRlci1jZWxsLCB0aFtjZGstaGVhZGVyLWNlbGxdJyxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstaGVhZGVyLWNlbGwnLFxuICAgICdyb2xlJzogJ2NvbHVtbmhlYWRlcicsXG4gIH0sXG4gIHN0YW5kYWxvbmU6IHRydWUsXG59KVxuZXhwb3J0IGNsYXNzIENka0hlYWRlckNlbGwgZXh0ZW5kcyBCYXNlQ2RrQ2VsbCB7XG4gIGNvbnN0cnVjdG9yKGNvbHVtbkRlZjogQ2RrQ29sdW1uRGVmLCBlbGVtZW50UmVmOiBFbGVtZW50UmVmKSB7XG4gICAgc3VwZXIoY29sdW1uRGVmLCBlbGVtZW50UmVmKTtcbiAgfVxufVxuXG4vKiogRm9vdGVyIGNlbGwgdGVtcGxhdGUgY29udGFpbmVyIHRoYXQgYWRkcyB0aGUgcmlnaHQgY2xhc3NlcyBhbmQgcm9sZS4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ2Nkay1mb290ZXItY2VsbCwgdGRbY2RrLWZvb3Rlci1jZWxsXScsXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLWZvb3Rlci1jZWxsJyxcbiAgfSxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrRm9vdGVyQ2VsbCBleHRlbmRzIEJhc2VDZGtDZWxsIHtcbiAgY29uc3RydWN0b3IoY29sdW1uRGVmOiBDZGtDb2x1bW5EZWYsIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHtcbiAgICBzdXBlcihjb2x1bW5EZWYsIGVsZW1lbnRSZWYpO1xuICAgIGNvbnN0IHJvbGUgPSBjb2x1bW5EZWYuX3RhYmxlPy5fY2VsbFJvbGU7XG4gICAgaWYgKHJvbGUpIHtcbiAgICAgIGVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCByb2xlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIENlbGwgdGVtcGxhdGUgY29udGFpbmVyIHRoYXQgYWRkcyB0aGUgcmlnaHQgY2xhc3NlcyBhbmQgcm9sZS4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ2Nkay1jZWxsLCB0ZFtjZGstY2VsbF0nLFxuICBob3N0OiB7XG4gICAgJ2NsYXNzJzogJ2Nkay1jZWxsJyxcbiAgfSxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrQ2VsbCBleHRlbmRzIEJhc2VDZGtDZWxsIHtcbiAgY29uc3RydWN0b3IoY29sdW1uRGVmOiBDZGtDb2x1bW5EZWYsIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHtcbiAgICBzdXBlcihjb2x1bW5EZWYsIGVsZW1lbnRSZWYpO1xuICAgIGNvbnN0IHJvbGUgPSBjb2x1bW5EZWYuX3RhYmxlPy5fY2VsbFJvbGU7XG4gICAgaWYgKHJvbGUpIHtcbiAgICAgIGVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCByb2xlKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==