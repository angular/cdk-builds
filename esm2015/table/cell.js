/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __decorate, __metadata, __param } from "tslib";
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { ContentChild, Directive, ElementRef, Input, TemplateRef, Inject, Optional, } from '@angular/core';
import { mixinHasStickyInput } from './can-stick';
import { CDK_TABLE } from './tokens';
/**
 * Cell definition for a CDK table.
 * Captures the template of a column's data row cell as well as cell-specific properties.
 */
let CdkCellDef = /** @class */ (() => {
    let CdkCellDef = class CdkCellDef {
        constructor(/** @docs-private */ template) {
            this.template = template;
        }
    };
    CdkCellDef = __decorate([
        Directive({ selector: '[cdkCellDef]' }),
        __metadata("design:paramtypes", [TemplateRef])
    ], CdkCellDef);
    return CdkCellDef;
})();
export { CdkCellDef };
/**
 * Header cell definition for a CDK table.
 * Captures the template of a column's header cell and as well as cell-specific properties.
 */
let CdkHeaderCellDef = /** @class */ (() => {
    let CdkHeaderCellDef = class CdkHeaderCellDef {
        constructor(/** @docs-private */ template) {
            this.template = template;
        }
    };
    CdkHeaderCellDef = __decorate([
        Directive({ selector: '[cdkHeaderCellDef]' }),
        __metadata("design:paramtypes", [TemplateRef])
    ], CdkHeaderCellDef);
    return CdkHeaderCellDef;
})();
export { CdkHeaderCellDef };
/**
 * Footer cell definition for a CDK table.
 * Captures the template of a column's footer cell and as well as cell-specific properties.
 */
let CdkFooterCellDef = /** @class */ (() => {
    let CdkFooterCellDef = class CdkFooterCellDef {
        constructor(/** @docs-private */ template) {
            this.template = template;
        }
    };
    CdkFooterCellDef = __decorate([
        Directive({ selector: '[cdkFooterCellDef]' }),
        __metadata("design:paramtypes", [TemplateRef])
    ], CdkFooterCellDef);
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
    var CdkColumnDef_1;
    let CdkColumnDef = CdkColumnDef_1 = class CdkColumnDef extends _CdkColumnDefBase {
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
    };
    __decorate([
        Input('cdkColumnDef'),
        __metadata("design:type", String),
        __metadata("design:paramtypes", [String])
    ], CdkColumnDef.prototype, "name", null);
    __decorate([
        Input('stickyEnd'),
        __metadata("design:type", Boolean),
        __metadata("design:paramtypes", [Boolean])
    ], CdkColumnDef.prototype, "stickyEnd", null);
    __decorate([
        ContentChild(CdkCellDef),
        __metadata("design:type", CdkCellDef)
    ], CdkColumnDef.prototype, "cell", void 0);
    __decorate([
        ContentChild(CdkHeaderCellDef),
        __metadata("design:type", CdkHeaderCellDef)
    ], CdkColumnDef.prototype, "headerCell", void 0);
    __decorate([
        ContentChild(CdkFooterCellDef),
        __metadata("design:type", CdkFooterCellDef)
    ], CdkColumnDef.prototype, "footerCell", void 0);
    CdkColumnDef = CdkColumnDef_1 = __decorate([
        Directive({
            selector: '[cdkColumnDef]',
            inputs: ['sticky'],
            providers: [{ provide: 'MAT_SORT_HEADER_COLUMN_DEF', useExisting: CdkColumnDef_1 }],
        }),
        __param(0, Inject(CDK_TABLE)), __param(0, Optional()),
        __metadata("design:paramtypes", [Object])
    ], CdkColumnDef);
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
    let CdkHeaderCell = class CdkHeaderCell extends BaseCdkCell {
        constructor(columnDef, elementRef) {
            super(columnDef, elementRef);
        }
    };
    CdkHeaderCell = __decorate([
        Directive({
            selector: 'cdk-header-cell, th[cdk-header-cell]',
            host: {
                'class': 'cdk-header-cell',
                'role': 'columnheader',
            },
        }),
        __metadata("design:paramtypes", [CdkColumnDef, ElementRef])
    ], CdkHeaderCell);
    return CdkHeaderCell;
})();
export { CdkHeaderCell };
/** Footer cell template container that adds the right classes and role. */
let CdkFooterCell = /** @class */ (() => {
    let CdkFooterCell = class CdkFooterCell extends BaseCdkCell {
        constructor(columnDef, elementRef) {
            super(columnDef, elementRef);
        }
    };
    CdkFooterCell = __decorate([
        Directive({
            selector: 'cdk-footer-cell, td[cdk-footer-cell]',
            host: {
                'class': 'cdk-footer-cell',
                'role': 'gridcell',
            },
        }),
        __metadata("design:paramtypes", [CdkColumnDef, ElementRef])
    ], CdkFooterCell);
    return CdkFooterCell;
})();
export { CdkFooterCell };
/** Cell template container that adds the right classes and role. */
let CdkCell = /** @class */ (() => {
    let CdkCell = class CdkCell extends BaseCdkCell {
        constructor(columnDef, elementRef) {
            super(columnDef, elementRef);
        }
    };
    CdkCell = __decorate([
        Directive({
            selector: 'cdk-cell, td[cdk-cell]',
            host: {
                'class': 'cdk-cell',
                'role': 'gridcell',
            },
        }),
        __metadata("design:paramtypes", [CdkColumnDef, ElementRef])
    ], CdkCell);
    return CdkCell;
})();
export { CdkCell };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGFibGUvY2VsbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUFlLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDMUUsT0FBTyxFQUNMLFlBQVksRUFDWixTQUFTLEVBQ1QsVUFBVSxFQUNWLEtBQUssRUFDTCxXQUFXLEVBQ1gsTUFBTSxFQUNOLFFBQVEsR0FDVCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQXlCLG1CQUFtQixFQUFDLE1BQU0sYUFBYSxDQUFDO0FBQ3hFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFRbkM7OztHQUdHO0FBRUg7SUFBQSxJQUFhLFVBQVUsR0FBdkIsTUFBYSxVQUFVO1FBQ3JCLFlBQVksb0JBQW9CLENBQVEsUUFBMEI7WUFBMUIsYUFBUSxHQUFSLFFBQVEsQ0FBa0I7UUFBRyxDQUFDO0tBQ3ZFLENBQUE7SUFGWSxVQUFVO1FBRHRCLFNBQVMsQ0FBQyxFQUFDLFFBQVEsRUFBRSxjQUFjLEVBQUMsQ0FBQzt5Q0FFYyxXQUFXO09BRGxELFVBQVUsQ0FFdEI7SUFBRCxpQkFBQztLQUFBO1NBRlksVUFBVTtBQUl2Qjs7O0dBR0c7QUFFSDtJQUFBLElBQWEsZ0JBQWdCLEdBQTdCLE1BQWEsZ0JBQWdCO1FBQzNCLFlBQVksb0JBQW9CLENBQVEsUUFBMEI7WUFBMUIsYUFBUSxHQUFSLFFBQVEsQ0FBa0I7UUFBRyxDQUFDO0tBQ3ZFLENBQUE7SUFGWSxnQkFBZ0I7UUFENUIsU0FBUyxDQUFDLEVBQUMsUUFBUSxFQUFFLG9CQUFvQixFQUFDLENBQUM7eUNBRVEsV0FBVztPQURsRCxnQkFBZ0IsQ0FFNUI7SUFBRCx1QkFBQztLQUFBO1NBRlksZ0JBQWdCO0FBSTdCOzs7R0FHRztBQUVIO0lBQUEsSUFBYSxnQkFBZ0IsR0FBN0IsTUFBYSxn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RCxjQUFDO0tBQUE7U0FKWSxPQUFPIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Qm9vbGVhbklucHV0LCBjb2VyY2VCb29sZWFuUHJvcGVydHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge1xuICBDb250ZW50Q2hpbGQsXG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgSW5wdXQsXG4gIFRlbXBsYXRlUmVmLFxuICBJbmplY3QsXG4gIE9wdGlvbmFsLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Q2FuU3RpY2ssIENhblN0aWNrQ3RvciwgbWl4aW5IYXNTdGlja3lJbnB1dH0gZnJvbSAnLi9jYW4tc3RpY2snO1xuaW1wb3J0IHtDREtfVEFCTEV9IGZyb20gJy4vdG9rZW5zJztcblxuXG4vKiogQmFzZSBpbnRlcmZhY2UgZm9yIGEgY2VsbCBkZWZpbml0aW9uLiBDYXB0dXJlcyBhIGNvbHVtbidzIGNlbGwgdGVtcGxhdGUgZGVmaW5pdGlvbi4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2VsbERlZiB7XG4gIHRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxhbnk+O1xufVxuXG4vKipcbiAqIENlbGwgZGVmaW5pdGlvbiBmb3IgYSBDREsgdGFibGUuXG4gKiBDYXB0dXJlcyB0aGUgdGVtcGxhdGUgb2YgYSBjb2x1bW4ncyBkYXRhIHJvdyBjZWxsIGFzIHdlbGwgYXMgY2VsbC1zcGVjaWZpYyBwcm9wZXJ0aWVzLlxuICovXG5ARGlyZWN0aXZlKHtzZWxlY3RvcjogJ1tjZGtDZWxsRGVmXSd9KVxuZXhwb3J0IGNsYXNzIENka0NlbGxEZWYgaW1wbGVtZW50cyBDZWxsRGVmIHtcbiAgY29uc3RydWN0b3IoLyoqIEBkb2NzLXByaXZhdGUgKi8gcHVibGljIHRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxhbnk+KSB7fVxufVxuXG4vKipcbiAqIEhlYWRlciBjZWxsIGRlZmluaXRpb24gZm9yIGEgQ0RLIHRhYmxlLlxuICogQ2FwdHVyZXMgdGhlIHRlbXBsYXRlIG9mIGEgY29sdW1uJ3MgaGVhZGVyIGNlbGwgYW5kIGFzIHdlbGwgYXMgY2VsbC1zcGVjaWZpYyBwcm9wZXJ0aWVzLlxuICovXG5ARGlyZWN0aXZlKHtzZWxlY3RvcjogJ1tjZGtIZWFkZXJDZWxsRGVmXSd9KVxuZXhwb3J0IGNsYXNzIENka0hlYWRlckNlbGxEZWYgaW1wbGVtZW50cyBDZWxsRGVmIHtcbiAgY29uc3RydWN0b3IoLyoqIEBkb2NzLXByaXZhdGUgKi8gcHVibGljIHRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxhbnk+KSB7fVxufVxuXG4vKipcbiAqIEZvb3RlciBjZWxsIGRlZmluaXRpb24gZm9yIGEgQ0RLIHRhYmxlLlxuICogQ2FwdHVyZXMgdGhlIHRlbXBsYXRlIG9mIGEgY29sdW1uJ3MgZm9vdGVyIGNlbGwgYW5kIGFzIHdlbGwgYXMgY2VsbC1zcGVjaWZpYyBwcm9wZXJ0aWVzLlxuICovXG5ARGlyZWN0aXZlKHtzZWxlY3RvcjogJ1tjZGtGb290ZXJDZWxsRGVmXSd9KVxuZXhwb3J0IGNsYXNzIENka0Zvb3RlckNlbGxEZWYgaW1wbGVtZW50cyBDZWxsRGVmIHtcbiAgY29uc3RydWN0b3IoLyoqIEBkb2NzLXByaXZhdGUgKi8gcHVibGljIHRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxhbnk+KSB7fVxufVxuXG4vLyBCb2lsZXJwbGF0ZSBmb3IgYXBwbHlpbmcgbWl4aW5zIHRvIENka0NvbHVtbkRlZi5cbi8qKiBAZG9jcy1wcml2YXRlICovXG5jbGFzcyBDZGtDb2x1bW5EZWZCYXNlIHt9XG5jb25zdCBfQ2RrQ29sdW1uRGVmQmFzZTogQ2FuU3RpY2tDdG9yJnR5cGVvZiBDZGtDb2x1bW5EZWZCYXNlID1cbiAgICBtaXhpbkhhc1N0aWNreUlucHV0KENka0NvbHVtbkRlZkJhc2UpO1xuXG4vKipcbiAqIENvbHVtbiBkZWZpbml0aW9uIGZvciB0aGUgQ0RLIHRhYmxlLlxuICogRGVmaW5lcyBhIHNldCBvZiBjZWxscyBhdmFpbGFibGUgZm9yIGEgdGFibGUgY29sdW1uLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrQ29sdW1uRGVmXScsXG4gIGlucHV0czogWydzdGlja3knXSxcbiAgcHJvdmlkZXJzOiBbe3Byb3ZpZGU6ICdNQVRfU09SVF9IRUFERVJfQ09MVU1OX0RFRicsIHVzZUV4aXN0aW5nOiBDZGtDb2x1bW5EZWZ9XSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrQ29sdW1uRGVmIGV4dGVuZHMgX0Nka0NvbHVtbkRlZkJhc2UgaW1wbGVtZW50cyBDYW5TdGljayB7XG4gIC8qKiBVbmlxdWUgbmFtZSBmb3IgdGhpcyBjb2x1bW4uICovXG4gIEBJbnB1dCgnY2RrQ29sdW1uRGVmJylcbiAgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fbmFtZTtcbiAgfVxuICBzZXQgbmFtZShuYW1lOiBzdHJpbmcpIHtcbiAgICAvLyBJZiB0aGUgZGlyZWN0aXZlIGlzIHNldCB3aXRob3V0IGEgbmFtZSAodXBkYXRlZCBwcm9ncmFtYXRpY2FsbHkpLCB0aGVuIHRoaXMgc2V0dGVyIHdpbGxcbiAgICAvLyB0cmlnZ2VyIHdpdGggYW4gZW1wdHkgc3RyaW5nIGFuZCBzaG91bGQgbm90IG92ZXJ3cml0ZSB0aGUgcHJvZ3JhbWF0aWNhbGx5IHNldCB2YWx1ZS5cbiAgICBpZiAobmFtZSkge1xuICAgICAgdGhpcy5fbmFtZSA9IG5hbWU7XG4gICAgICB0aGlzLmNzc0NsYXNzRnJpZW5kbHlOYW1lID0gbmFtZS5yZXBsYWNlKC9bXmEtejAtOV8tXS9pZywgJy0nKTtcbiAgICB9XG4gIH1cbiAgX25hbWU6IHN0cmluZztcblxuICAvKipcbiAgICogV2hldGhlciB0aGlzIGNvbHVtbiBzaG91bGQgYmUgc3RpY2t5IHBvc2l0aW9uZWQgb24gdGhlIGVuZCBvZiB0aGUgcm93LiBTaG91bGQgbWFrZSBzdXJlXG4gICAqIHRoYXQgaXQgbWltaWNzIHRoZSBgQ2FuU3RpY2tgIG1peGluIHN1Y2ggdGhhdCBgX2hhc1N0aWNreUNoYW5nZWRgIGlzIHNldCB0byB0cnVlIGlmIHRoZSB2YWx1ZVxuICAgKiBoYXMgYmVlbiBjaGFuZ2VkLlxuICAgKi9cbiAgQElucHV0KCdzdGlja3lFbmQnKVxuICBnZXQgc3RpY2t5RW5kKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9zdGlja3lFbmQ7XG4gIH1cbiAgc2V0IHN0aWNreUVuZCh2OiBib29sZWFuKSB7XG4gICAgY29uc3QgcHJldlZhbHVlID0gdGhpcy5fc3RpY2t5RW5kO1xuICAgIHRoaXMuX3N0aWNreUVuZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2KTtcbiAgICB0aGlzLl9oYXNTdGlja3lDaGFuZ2VkID0gcHJldlZhbHVlICE9PSB0aGlzLl9zdGlja3lFbmQ7XG4gIH1cbiAgX3N0aWNreUVuZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBAZG9jcy1wcml2YXRlICovXG4gIEBDb250ZW50Q2hpbGQoQ2RrQ2VsbERlZikgY2VsbDogQ2RrQ2VsbERlZjtcblxuICAvKiogQGRvY3MtcHJpdmF0ZSAqL1xuICBAQ29udGVudENoaWxkKENka0hlYWRlckNlbGxEZWYpIGhlYWRlckNlbGw6IENka0hlYWRlckNlbGxEZWY7XG5cbiAgLyoqIEBkb2NzLXByaXZhdGUgKi9cbiAgQENvbnRlbnRDaGlsZChDZGtGb290ZXJDZWxsRGVmKSBmb290ZXJDZWxsOiBDZGtGb290ZXJDZWxsRGVmO1xuXG4gIC8qKlxuICAgKiBUcmFuc2Zvcm1lZCB2ZXJzaW9uIG9mIHRoZSBjb2x1bW4gbmFtZSB0aGF0IGNhbiBiZSB1c2VkIGFzIHBhcnQgb2YgYSBDU1MgY2xhc3NuYW1lLiBFeGNsdWRlc1xuICAgKiBhbGwgbm9uLWFscGhhbnVtZXJpYyBjaGFyYWN0ZXJzIGFuZCB0aGUgc3BlY2lhbCBjaGFyYWN0ZXJzICctJyBhbmQgJ18nLiBBbnkgY2hhcmFjdGVycyB0aGF0XG4gICAqIGRvIG5vdCBtYXRjaCBhcmUgcmVwbGFjZWQgYnkgdGhlICctJyBjaGFyYWN0ZXIuXG4gICAqL1xuICBjc3NDbGFzc0ZyaWVuZGx5TmFtZTogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKEBJbmplY3QoQ0RLX1RBQkxFKSBAT3B0aW9uYWwoKSBwdWJsaWMgX3RhYmxlPzogYW55KSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9zdGlja3k6IEJvb2xlYW5JbnB1dDtcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX3N0aWNreUVuZDogQm9vbGVhbklucHV0O1xufVxuXG4vKiogQmFzZSBjbGFzcyBmb3IgdGhlIGNlbGxzLiBBZGRzIGEgQ1NTIGNsYXNzbmFtZSB0aGF0IGlkZW50aWZpZXMgdGhlIGNvbHVtbiBpdCByZW5kZXJzIGluLiAqL1xuZXhwb3J0IGNsYXNzIEJhc2VDZGtDZWxsIHtcbiAgY29uc3RydWN0b3IoY29sdW1uRGVmOiBDZGtDb2x1bW5EZWYsIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHtcbiAgICBjb25zdCBjb2x1bW5DbGFzc05hbWUgPSBgY2RrLWNvbHVtbi0ke2NvbHVtbkRlZi5jc3NDbGFzc0ZyaWVuZGx5TmFtZX1gO1xuICAgIGVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5jbGFzc0xpc3QuYWRkKGNvbHVtbkNsYXNzTmFtZSk7XG4gIH1cbn1cblxuLyoqIEhlYWRlciBjZWxsIHRlbXBsYXRlIGNvbnRhaW5lciB0aGF0IGFkZHMgdGhlIHJpZ2h0IGNsYXNzZXMgYW5kIHJvbGUuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdjZGstaGVhZGVyLWNlbGwsIHRoW2Nkay1oZWFkZXItY2VsbF0nLFxuICBob3N0OiB7XG4gICAgJ2NsYXNzJzogJ2Nkay1oZWFkZXItY2VsbCcsXG4gICAgJ3JvbGUnOiAnY29sdW1uaGVhZGVyJyxcbiAgfSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrSGVhZGVyQ2VsbCBleHRlbmRzIEJhc2VDZGtDZWxsIHtcbiAgY29uc3RydWN0b3IoY29sdW1uRGVmOiBDZGtDb2x1bW5EZWYsIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHtcbiAgICBzdXBlcihjb2x1bW5EZWYsIGVsZW1lbnRSZWYpO1xuICB9XG59XG5cbi8qKiBGb290ZXIgY2VsbCB0ZW1wbGF0ZSBjb250YWluZXIgdGhhdCBhZGRzIHRoZSByaWdodCBjbGFzc2VzIGFuZCByb2xlLiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnY2RrLWZvb3Rlci1jZWxsLCB0ZFtjZGstZm9vdGVyLWNlbGxdJyxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstZm9vdGVyLWNlbGwnLFxuICAgICdyb2xlJzogJ2dyaWRjZWxsJyxcbiAgfSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrRm9vdGVyQ2VsbCBleHRlbmRzIEJhc2VDZGtDZWxsIHtcbiAgY29uc3RydWN0b3IoY29sdW1uRGVmOiBDZGtDb2x1bW5EZWYsIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHtcbiAgICBzdXBlcihjb2x1bW5EZWYsIGVsZW1lbnRSZWYpO1xuICB9XG59XG5cbi8qKiBDZWxsIHRlbXBsYXRlIGNvbnRhaW5lciB0aGF0IGFkZHMgdGhlIHJpZ2h0IGNsYXNzZXMgYW5kIHJvbGUuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdjZGstY2VsbCwgdGRbY2RrLWNlbGxdJyxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstY2VsbCcsXG4gICAgJ3JvbGUnOiAnZ3JpZGNlbGwnLFxuICB9LFxufSlcbmV4cG9ydCBjbGFzcyBDZGtDZWxsIGV4dGVuZHMgQmFzZUNka0NlbGwge1xuICBjb25zdHJ1Y3Rvcihjb2x1bW5EZWY6IENka0NvbHVtbkRlZiwgZWxlbWVudFJlZjogRWxlbWVudFJlZikge1xuICAgIHN1cGVyKGNvbHVtbkRlZiwgZWxlbWVudFJlZik7XG4gIH1cbn1cbiJdfQ==