/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { ContentChild, Directive, ElementRef, Input, TemplateRef, Inject, Optional, } from '@angular/core';
import { mixinHasStickyInput } from './can-stick';
import { CDK_TABLE } from './tokens';
/**
 * Cell definition for a CDK table.
 * Captures the template of a column's data row cell as well as cell-specific properties.
 */
let CdkCellDef = /** @class */ (() => {
    class CdkCellDef {
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
    return CdkCellDef;
})();
export { CdkCellDef };
/**
 * Header cell definition for a CDK table.
 * Captures the template of a column's header cell and as well as cell-specific properties.
 */
let CdkHeaderCellDef = /** @class */ (() => {
    class CdkHeaderCellDef {
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
    return CdkHeaderCellDef;
})();
export { CdkHeaderCellDef };
/**
 * Footer cell definition for a CDK table.
 * Captures the template of a column's footer cell and as well as cell-specific properties.
 */
let CdkFooterCellDef = /** @class */ (() => {
    class CdkFooterCellDef {
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
    return CdkFooterCellDef;
})();
export { CdkFooterCellDef };
// Boilerplate for applying mixins to CdkColumnDef.
/** @docs-private */
class CdkColumnDefBase {
}
const _CdkColumnDefBase = mixinHasStickyInput(CdkColumnDefBase);
/**
 * Column definition for the CDK table.
 * Defines a set of cells available for a table column.
 */
let CdkColumnDef = /** @class */ (() => {
    class CdkColumnDef extends _CdkColumnDefBase {
        constructor(_table) {
            super();
            this._table = _table;
            this._stickyEnd = false;
        }
        /** Unique name for this column. */
        get name() {
            return this._name;
        }
        set name(name) {
            // If the directive is set without a name (updated programatically), then this setter will
            // trigger with an empty string and should not overwrite the programatically set value.
            if (name) {
                this._name = name;
                this.cssClassFriendlyName = name.replace(/[^a-z0-9_-]/ig, '-');
            }
        }
        /**
         * Whether this column should be sticky positioned on the end of the row. Should make sure
         * that it mimics the `CanStick` mixin such that `_hasStickyChanged` is set to true if the value
         * has been changed.
         */
        get stickyEnd() {
            return this._stickyEnd;
        }
        set stickyEnd(v) {
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
    /** @nocollapse */
    CdkColumnDef.ctorParameters = () => [
        { type: undefined, decorators: [{ type: Inject, args: [CDK_TABLE,] }, { type: Optional }] }
    ];
    CdkColumnDef.propDecorators = {
        name: [{ type: Input, args: ['cdkColumnDef',] }],
        stickyEnd: [{ type: Input, args: ['stickyEnd',] }],
        cell: [{ type: ContentChild, args: [CdkCellDef,] }],
        headerCell: [{ type: ContentChild, args: [CdkHeaderCellDef,] }],
        footerCell: [{ type: ContentChild, args: [CdkFooterCellDef,] }]
    };
    return CdkColumnDef;
})();
export { CdkColumnDef };
/** Base class for the cells. Adds a CSS classname that identifies the column it renders in. */
export class BaseCdkCell {
    constructor(columnDef, elementRef) {
        const columnClassName = `cdk-column-${columnDef.cssClassFriendlyName}`;
        elementRef.nativeElement.classList.add(columnClassName);
    }
}
/** Header cell template container that adds the right classes and role. */
let CdkHeaderCell = /** @class */ (() => {
    class CdkHeaderCell extends BaseCdkCell {
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
    return CdkHeaderCell;
})();
export { CdkHeaderCell };
/** Footer cell template container that adds the right classes and role. */
let CdkFooterCell = /** @class */ (() => {
    class CdkFooterCell extends BaseCdkCell {
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
    return CdkFooterCell;
})();
export { CdkFooterCell };
/** Cell template container that adds the right classes and role. */
let CdkCell = /** @class */ (() => {
    class CdkCell extends BaseCdkCell {
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
    return CdkCell;
})();
export { CdkCell };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGFibGUvY2VsbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQWUscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRSxPQUFPLEVBQ0wsWUFBWSxFQUNaLFNBQVMsRUFDVCxVQUFVLEVBQ1YsS0FBSyxFQUNMLFdBQVcsRUFDWCxNQUFNLEVBQ04sUUFBUSxHQUNULE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBeUIsbUJBQW1CLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDeEUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQVFuQzs7O0dBR0c7QUFDSDtJQUFBLE1BQ2EsVUFBVTtRQUNyQixZQUFZLG9CQUFvQixDQUFRLFFBQTBCO1lBQTFCLGFBQVEsR0FBUixRQUFRLENBQWtCO1FBQUcsQ0FBQzs7O2dCQUZ2RSxTQUFTLFNBQUMsRUFBQyxRQUFRLEVBQUUsY0FBYyxFQUFDOzs7O2dCQWpCbkMsV0FBVzs7SUFvQmIsaUJBQUM7S0FBQTtTQUZZLFVBQVU7QUFJdkI7OztHQUdHO0FBQ0g7SUFBQSxNQUNhLGdCQUFnQjtRQUMzQixZQUFZLG9CQUFvQixDQUFRLFFBQTBCO1lBQTFCLGFBQVEsR0FBUixRQUFRLENBQWtCO1FBQUcsQ0FBQzs7O2dCQUZ2RSxTQUFTLFNBQUMsRUFBQyxRQUFRLEVBQUUsb0JBQW9CLEVBQUM7Ozs7Z0JBMUJ6QyxXQUFXOztJQTZCYix1QkFBQztLQUFBO1NBRlksZ0JBQWdCO0FBSTdCOzs7R0FHRztBQUNIO0lBQUEsTUFDYSxnQkFBZ0I7UUFDM0IsWUFBWSxvQkFBb0IsQ0FBUSxRQUEwQjtZQUExQixhQUFRLEdBQVIsUUFBUSxDQUFrQjtRQUFHLENBQUM7OztnQkFGdkUsU0FBUyxTQUFDLEVBQUMsUUFBUSxFQUFFLG9CQUFvQixFQUFDOzs7O2dC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c0NBQXNDO29CQUNoRCxJQUFJLEVBQUU7d0JBQ0osT0FBTyxFQUFFLGlCQUFpQjt3QkFDMUIsTUFBTSxFQUFFLFVBQVU7cUJBQ25CO2lCQUNGOzs7O2dCQUV3QixZQUFZO2dCQWhKbkMsVUFBVTs7SUFtSlosb0JBQUM7S0FBQTtTQUpZLGFBQWE7QUFNMUIsb0VBQW9FO0FBQ3BFO0lBQUEsTUFPYSxPQUFRLFNBQVEsV0FBVztRQUN0QyxZQUFZLFNBQXVCLEVBQUUsVUFBc0I7WUFDekQsS0FBSyxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUMvQixDQUFDOzs7Z0JBVkYsU0FBUyxTQUFDO29CQUNULFFBQVEsRUFBRSx3QkFBd0I7b0JBQ2xDLElBQUksRUFBRTt3QkFDSixPQUFPLEVBQUUsVUFBVTt3QkFDbkIsTUFBTSxFQUFFLFVBQVU7cUJBQ25CO2lCQUNGOzs7O2dCQUV3QixZQUFZO2dCQTlKbkMsVUFBVTs7SUFpS1osY0FBQztLQUFBO1NBSlksT0FBTyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0Jvb2xlYW5JbnB1dCwgY29lcmNlQm9vbGVhblByb3BlcnR5fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtcbiAgQ29udGVudENoaWxkLFxuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIElucHV0LFxuICBUZW1wbGF0ZVJlZixcbiAgSW5qZWN0LFxuICBPcHRpb25hbCxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0NhblN0aWNrLCBDYW5TdGlja0N0b3IsIG1peGluSGFzU3RpY2t5SW5wdXR9IGZyb20gJy4vY2FuLXN0aWNrJztcbmltcG9ydCB7Q0RLX1RBQkxFfSBmcm9tICcuL3Rva2Vucyc7XG5cblxuLyoqIEJhc2UgaW50ZXJmYWNlIGZvciBhIGNlbGwgZGVmaW5pdGlvbi4gQ2FwdHVyZXMgYSBjb2x1bW4ncyBjZWxsIHRlbXBsYXRlIGRlZmluaXRpb24uICovXG5leHBvcnQgaW50ZXJmYWNlIENlbGxEZWYge1xuICB0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8YW55Pjtcbn1cblxuLyoqXG4gKiBDZWxsIGRlZmluaXRpb24gZm9yIGEgQ0RLIHRhYmxlLlxuICogQ2FwdHVyZXMgdGhlIHRlbXBsYXRlIG9mIGEgY29sdW1uJ3MgZGF0YSByb3cgY2VsbCBhcyB3ZWxsIGFzIGNlbGwtc3BlY2lmaWMgcHJvcGVydGllcy5cbiAqL1xuQERpcmVjdGl2ZSh7c2VsZWN0b3I6ICdbY2RrQ2VsbERlZl0nfSlcbmV4cG9ydCBjbGFzcyBDZGtDZWxsRGVmIGltcGxlbWVudHMgQ2VsbERlZiB7XG4gIGNvbnN0cnVjdG9yKC8qKiBAZG9jcy1wcml2YXRlICovIHB1YmxpYyB0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8YW55Pikge31cbn1cblxuLyoqXG4gKiBIZWFkZXIgY2VsbCBkZWZpbml0aW9uIGZvciBhIENESyB0YWJsZS5cbiAqIENhcHR1cmVzIHRoZSB0ZW1wbGF0ZSBvZiBhIGNvbHVtbidzIGhlYWRlciBjZWxsIGFuZCBhcyB3ZWxsIGFzIGNlbGwtc3BlY2lmaWMgcHJvcGVydGllcy5cbiAqL1xuQERpcmVjdGl2ZSh7c2VsZWN0b3I6ICdbY2RrSGVhZGVyQ2VsbERlZl0nfSlcbmV4cG9ydCBjbGFzcyBDZGtIZWFkZXJDZWxsRGVmIGltcGxlbWVudHMgQ2VsbERlZiB7XG4gIGNvbnN0cnVjdG9yKC8qKiBAZG9jcy1wcml2YXRlICovIHB1YmxpYyB0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8YW55Pikge31cbn1cblxuLyoqXG4gKiBGb290ZXIgY2VsbCBkZWZpbml0aW9uIGZvciBhIENESyB0YWJsZS5cbiAqIENhcHR1cmVzIHRoZSB0ZW1wbGF0ZSBvZiBhIGNvbHVtbidzIGZvb3RlciBjZWxsIGFuZCBhcyB3ZWxsIGFzIGNlbGwtc3BlY2lmaWMgcHJvcGVydGllcy5cbiAqL1xuQERpcmVjdGl2ZSh7c2VsZWN0b3I6ICdbY2RrRm9vdGVyQ2VsbERlZl0nfSlcbmV4cG9ydCBjbGFzcyBDZGtGb290ZXJDZWxsRGVmIGltcGxlbWVudHMgQ2VsbERlZiB7XG4gIGNvbnN0cnVjdG9yKC8qKiBAZG9jcy1wcml2YXRlICovIHB1YmxpYyB0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8YW55Pikge31cbn1cblxuLy8gQm9pbGVycGxhdGUgZm9yIGFwcGx5aW5nIG1peGlucyB0byBDZGtDb2x1bW5EZWYuXG4vKiogQGRvY3MtcHJpdmF0ZSAqL1xuY2xhc3MgQ2RrQ29sdW1uRGVmQmFzZSB7fVxuY29uc3QgX0Nka0NvbHVtbkRlZkJhc2U6IENhblN0aWNrQ3RvciZ0eXBlb2YgQ2RrQ29sdW1uRGVmQmFzZSA9XG4gICAgbWl4aW5IYXNTdGlja3lJbnB1dChDZGtDb2x1bW5EZWZCYXNlKTtcblxuLyoqXG4gKiBDb2x1bW4gZGVmaW5pdGlvbiBmb3IgdGhlIENESyB0YWJsZS5cbiAqIERlZmluZXMgYSBzZXQgb2YgY2VsbHMgYXZhaWxhYmxlIGZvciBhIHRhYmxlIGNvbHVtbi5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka0NvbHVtbkRlZl0nLFxuICBpbnB1dHM6IFsnc3RpY2t5J10sXG4gIHByb3ZpZGVyczogW3twcm92aWRlOiAnTUFUX1NPUlRfSEVBREVSX0NPTFVNTl9ERUYnLCB1c2VFeGlzdGluZzogQ2RrQ29sdW1uRGVmfV0sXG59KVxuZXhwb3J0IGNsYXNzIENka0NvbHVtbkRlZiBleHRlbmRzIF9DZGtDb2x1bW5EZWZCYXNlIGltcGxlbWVudHMgQ2FuU3RpY2sge1xuICAvKiogVW5pcXVlIG5hbWUgZm9yIHRoaXMgY29sdW1uLiAqL1xuICBASW5wdXQoJ2Nka0NvbHVtbkRlZicpXG4gIGdldCBuYW1lKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX25hbWU7XG4gIH1cbiAgc2V0IG5hbWUobmFtZTogc3RyaW5nKSB7XG4gICAgLy8gSWYgdGhlIGRpcmVjdGl2ZSBpcyBzZXQgd2l0aG91dCBhIG5hbWUgKHVwZGF0ZWQgcHJvZ3JhbWF0aWNhbGx5KSwgdGhlbiB0aGlzIHNldHRlciB3aWxsXG4gICAgLy8gdHJpZ2dlciB3aXRoIGFuIGVtcHR5IHN0cmluZyBhbmQgc2hvdWxkIG5vdCBvdmVyd3JpdGUgdGhlIHByb2dyYW1hdGljYWxseSBzZXQgdmFsdWUuXG4gICAgaWYgKG5hbWUpIHtcbiAgICAgIHRoaXMuX25hbWUgPSBuYW1lO1xuICAgICAgdGhpcy5jc3NDbGFzc0ZyaWVuZGx5TmFtZSA9IG5hbWUucmVwbGFjZSgvW15hLXowLTlfLV0vaWcsICctJyk7XG4gICAgfVxuICB9XG4gIF9uYW1lOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhpcyBjb2x1bW4gc2hvdWxkIGJlIHN0aWNreSBwb3NpdGlvbmVkIG9uIHRoZSBlbmQgb2YgdGhlIHJvdy4gU2hvdWxkIG1ha2Ugc3VyZVxuICAgKiB0aGF0IGl0IG1pbWljcyB0aGUgYENhblN0aWNrYCBtaXhpbiBzdWNoIHRoYXQgYF9oYXNTdGlja3lDaGFuZ2VkYCBpcyBzZXQgdG8gdHJ1ZSBpZiB0aGUgdmFsdWVcbiAgICogaGFzIGJlZW4gY2hhbmdlZC5cbiAgICovXG4gIEBJbnB1dCgnc3RpY2t5RW5kJylcbiAgZ2V0IHN0aWNreUVuZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fc3RpY2t5RW5kO1xuICB9XG4gIHNldCBzdGlja3lFbmQodjogYm9vbGVhbikge1xuICAgIGNvbnN0IHByZXZWYWx1ZSA9IHRoaXMuX3N0aWNreUVuZDtcbiAgICB0aGlzLl9zdGlja3lFbmQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodik7XG4gICAgdGhpcy5faGFzU3RpY2t5Q2hhbmdlZCA9IHByZXZWYWx1ZSAhPT0gdGhpcy5fc3RpY2t5RW5kO1xuICB9XG4gIF9zdGlja3lFbmQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogQGRvY3MtcHJpdmF0ZSAqL1xuICBAQ29udGVudENoaWxkKENka0NlbGxEZWYpIGNlbGw6IENka0NlbGxEZWY7XG5cbiAgLyoqIEBkb2NzLXByaXZhdGUgKi9cbiAgQENvbnRlbnRDaGlsZChDZGtIZWFkZXJDZWxsRGVmKSBoZWFkZXJDZWxsOiBDZGtIZWFkZXJDZWxsRGVmO1xuXG4gIC8qKiBAZG9jcy1wcml2YXRlICovXG4gIEBDb250ZW50Q2hpbGQoQ2RrRm9vdGVyQ2VsbERlZikgZm9vdGVyQ2VsbDogQ2RrRm9vdGVyQ2VsbERlZjtcblxuICAvKipcbiAgICogVHJhbnNmb3JtZWQgdmVyc2lvbiBvZiB0aGUgY29sdW1uIG5hbWUgdGhhdCBjYW4gYmUgdXNlZCBhcyBwYXJ0IG9mIGEgQ1NTIGNsYXNzbmFtZS4gRXhjbHVkZXNcbiAgICogYWxsIG5vbi1hbHBoYW51bWVyaWMgY2hhcmFjdGVycyBhbmQgdGhlIHNwZWNpYWwgY2hhcmFjdGVycyAnLScgYW5kICdfJy4gQW55IGNoYXJhY3RlcnMgdGhhdFxuICAgKiBkbyBub3QgbWF0Y2ggYXJlIHJlcGxhY2VkIGJ5IHRoZSAnLScgY2hhcmFjdGVyLlxuICAgKi9cbiAgY3NzQ2xhc3NGcmllbmRseU5hbWU6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihASW5qZWN0KENES19UQUJMRSkgQE9wdGlvbmFsKCkgcHVibGljIF90YWJsZT86IGFueSkge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfc3RpY2t5OiBCb29sZWFuSW5wdXQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9zdGlja3lFbmQ6IEJvb2xlYW5JbnB1dDtcbn1cblxuLyoqIEJhc2UgY2xhc3MgZm9yIHRoZSBjZWxscy4gQWRkcyBhIENTUyBjbGFzc25hbWUgdGhhdCBpZGVudGlmaWVzIHRoZSBjb2x1bW4gaXQgcmVuZGVycyBpbi4gKi9cbmV4cG9ydCBjbGFzcyBCYXNlQ2RrQ2VsbCB7XG4gIGNvbnN0cnVjdG9yKGNvbHVtbkRlZjogQ2RrQ29sdW1uRGVmLCBlbGVtZW50UmVmOiBFbGVtZW50UmVmKSB7XG4gICAgY29uc3QgY29sdW1uQ2xhc3NOYW1lID0gYGNkay1jb2x1bW4tJHtjb2x1bW5EZWYuY3NzQ2xhc3NGcmllbmRseU5hbWV9YDtcbiAgICBlbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuY2xhc3NMaXN0LmFkZChjb2x1bW5DbGFzc05hbWUpO1xuICB9XG59XG5cbi8qKiBIZWFkZXIgY2VsbCB0ZW1wbGF0ZSBjb250YWluZXIgdGhhdCBhZGRzIHRoZSByaWdodCBjbGFzc2VzIGFuZCByb2xlLiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnY2RrLWhlYWRlci1jZWxsLCB0aFtjZGstaGVhZGVyLWNlbGxdJyxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstaGVhZGVyLWNlbGwnLFxuICAgICdyb2xlJzogJ2NvbHVtbmhlYWRlcicsXG4gIH0sXG59KVxuZXhwb3J0IGNsYXNzIENka0hlYWRlckNlbGwgZXh0ZW5kcyBCYXNlQ2RrQ2VsbCB7XG4gIGNvbnN0cnVjdG9yKGNvbHVtbkRlZjogQ2RrQ29sdW1uRGVmLCBlbGVtZW50UmVmOiBFbGVtZW50UmVmKSB7XG4gICAgc3VwZXIoY29sdW1uRGVmLCBlbGVtZW50UmVmKTtcbiAgfVxufVxuXG4vKiogRm9vdGVyIGNlbGwgdGVtcGxhdGUgY29udGFpbmVyIHRoYXQgYWRkcyB0aGUgcmlnaHQgY2xhc3NlcyBhbmQgcm9sZS4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ2Nkay1mb290ZXItY2VsbCwgdGRbY2RrLWZvb3Rlci1jZWxsXScsXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLWZvb3Rlci1jZWxsJyxcbiAgICAncm9sZSc6ICdncmlkY2VsbCcsXG4gIH0sXG59KVxuZXhwb3J0IGNsYXNzIENka0Zvb3RlckNlbGwgZXh0ZW5kcyBCYXNlQ2RrQ2VsbCB7XG4gIGNvbnN0cnVjdG9yKGNvbHVtbkRlZjogQ2RrQ29sdW1uRGVmLCBlbGVtZW50UmVmOiBFbGVtZW50UmVmKSB7XG4gICAgc3VwZXIoY29sdW1uRGVmLCBlbGVtZW50UmVmKTtcbiAgfVxufVxuXG4vKiogQ2VsbCB0ZW1wbGF0ZSBjb250YWluZXIgdGhhdCBhZGRzIHRoZSByaWdodCBjbGFzc2VzIGFuZCByb2xlLiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnY2RrLWNlbGwsIHRkW2Nkay1jZWxsXScsXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLWNlbGwnLFxuICAgICdyb2xlJzogJ2dyaWRjZWxsJyxcbiAgfSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrQ2VsbCBleHRlbmRzIEJhc2VDZGtDZWxsIHtcbiAgY29uc3RydWN0b3IoY29sdW1uRGVmOiBDZGtDb2x1bW5EZWYsIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHtcbiAgICBzdXBlcihjb2x1bW5EZWYsIGVsZW1lbnRSZWYpO1xuICB9XG59XG4iXX0=