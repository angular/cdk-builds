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
export class CdkCellDef {
    constructor(/** @docs-private */ template) {
        this.template = template;
    }
}
CdkCellDef.decorators = [
    { type: Directive, args: [{ selector: '[cdkCellDef]' },] }
];
CdkCellDef.ctorParameters = () => [
    { type: TemplateRef }
];
/**
 * Header cell definition for a CDK table.
 * Captures the template of a column's header cell and as well as cell-specific properties.
 */
export class CdkHeaderCellDef {
    constructor(/** @docs-private */ template) {
        this.template = template;
    }
}
CdkHeaderCellDef.decorators = [
    { type: Directive, args: [{ selector: '[cdkHeaderCellDef]' },] }
];
CdkHeaderCellDef.ctorParameters = () => [
    { type: TemplateRef }
];
/**
 * Footer cell definition for a CDK table.
 * Captures the template of a column's footer cell and as well as cell-specific properties.
 */
export class CdkFooterCellDef {
    constructor(/** @docs-private */ template) {
        this.template = template;
    }
}
CdkFooterCellDef.decorators = [
    { type: Directive, args: [{ selector: '[cdkFooterCellDef]' },] }
];
CdkFooterCellDef.ctorParameters = () => [
    { type: TemplateRef }
];
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
/** Base class for the cells. Adds a CSS classname that identifies the column it renders in. */
export class BaseCdkCell {
    constructor(columnDef, elementRef) {
        const columnClassName = `cdk-column-${columnDef.cssClassFriendlyName}`;
        elementRef.nativeElement.classList.add(columnClassName);
    }
}
/** Header cell template container that adds the right classes and role. */
export class CdkHeaderCell extends BaseCdkCell {
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
CdkHeaderCell.ctorParameters = () => [
    { type: CdkColumnDef },
    { type: ElementRef }
];
/** Footer cell template container that adds the right classes and role. */
export class CdkFooterCell extends BaseCdkCell {
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
CdkFooterCell.ctorParameters = () => [
    { type: CdkColumnDef },
    { type: ElementRef }
];
/** Cell template container that adds the right classes and role. */
export class CdkCell extends BaseCdkCell {
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
CdkCell.ctorParameters = () => [
    { type: CdkColumnDef },
    { type: ElementRef }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGFibGUvY2VsbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQWUscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRSxPQUFPLEVBQ0wsWUFBWSxFQUNaLFNBQVMsRUFDVCxVQUFVLEVBQ1YsS0FBSyxFQUNMLFdBQVcsRUFDWCxNQUFNLEVBQ04sUUFBUSxHQUNULE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBeUIsbUJBQW1CLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDeEUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQVFuQzs7O0dBR0c7QUFFSCxNQUFNLE9BQU8sVUFBVTtJQUNyQixZQUFZLG9CQUFvQixDQUFRLFFBQTBCO1FBQTFCLGFBQVEsR0FBUixRQUFRLENBQWtCO0lBQUcsQ0FBQzs7O1lBRnZFLFNBQVMsU0FBQyxFQUFDLFFBQVEsRUFBRSxjQUFjLEVBQUM7OztZQWpCbkMsV0FBVzs7QUFzQmI7OztHQUdHO0FBRUgsTUFBTSxPQUFPLGdCQUFnQjtJQUMzQixZQUFZLG9CQUFvQixDQUFRLFFBQTBCO1FBQTFCLGFBQVEsR0FBUixRQUFRLENBQWtCO0lBQUcsQ0FBQzs7O1lBRnZFLFNBQVMsU0FBQyxFQUFDLFFBQVEsRUFBRSxvQkFBb0IsRUFBQzs7O1lBMUJ6QyxXQUFXOztBQStCYjs7O0dBR0c7QUFFSCxNQUFNLE9BQU8sZ0JBQWdCO0lBQzNCLFlBQVksb0JBQW9CLENBQVEsUUFBMEI7UUFBMUIsYUFBUSxHQUFSLFFBQVEsQ0FBa0I7SUFBRyxDQUFDOzs7WUFGdkUsU0FBUyxTQUFDLEVBQUMsUUFBUSxFQUFFLG9CQUFvQixFQUFDOzs7WUFuQ3pDLFdBQVc7O0FBd0NiLG1EQUFtRDtBQUNuRCxvQkFBb0I7QUFDcEIsTUFBTSxnQkFBZ0I7Q0FBRztBQUN6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WSxTQUF1QixFQUFFLFVBQXNCO1FBQ3pELEtBQUssQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDL0IsQ0FBQzs7O1lBVkYsU0FBUyxTQUFDO2dCQUNULFFBQVEsRUFBRSx3QkFBd0I7Z0JBQ2xDLElBQUksRUFBRTtvQkFDSixPQUFPLEVBQUUsVUFBVTtvQkFDbkIsTUFBTSxFQUFFLFVBQVU7aUJBQ25CO2FBQ0Y7OztZQUV3QixZQUFZO1lBOUpuQyxVQUFVIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Qm9vbGVhbklucHV0LCBjb2VyY2VCb29sZWFuUHJvcGVydHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge1xuICBDb250ZW50Q2hpbGQsXG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgSW5wdXQsXG4gIFRlbXBsYXRlUmVmLFxuICBJbmplY3QsXG4gIE9wdGlvbmFsLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Q2FuU3RpY2ssIENhblN0aWNrQ3RvciwgbWl4aW5IYXNTdGlja3lJbnB1dH0gZnJvbSAnLi9jYW4tc3RpY2snO1xuaW1wb3J0IHtDREtfVEFCTEV9IGZyb20gJy4vdG9rZW5zJztcblxuXG4vKiogQmFzZSBpbnRlcmZhY2UgZm9yIGEgY2VsbCBkZWZpbml0aW9uLiBDYXB0dXJlcyBhIGNvbHVtbidzIGNlbGwgdGVtcGxhdGUgZGVmaW5pdGlvbi4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2VsbERlZiB7XG4gIHRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxhbnk+O1xufVxuXG4vKipcbiAqIENlbGwgZGVmaW5pdGlvbiBmb3IgYSBDREsgdGFibGUuXG4gKiBDYXB0dXJlcyB0aGUgdGVtcGxhdGUgb2YgYSBjb2x1bW4ncyBkYXRhIHJvdyBjZWxsIGFzIHdlbGwgYXMgY2VsbC1zcGVjaWZpYyBwcm9wZXJ0aWVzLlxuICovXG5ARGlyZWN0aXZlKHtzZWxlY3RvcjogJ1tjZGtDZWxsRGVmXSd9KVxuZXhwb3J0IGNsYXNzIENka0NlbGxEZWYgaW1wbGVtZW50cyBDZWxsRGVmIHtcbiAgY29uc3RydWN0b3IoLyoqIEBkb2NzLXByaXZhdGUgKi8gcHVibGljIHRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxhbnk+KSB7fVxufVxuXG4vKipcbiAqIEhlYWRlciBjZWxsIGRlZmluaXRpb24gZm9yIGEgQ0RLIHRhYmxlLlxuICogQ2FwdHVyZXMgdGhlIHRlbXBsYXRlIG9mIGEgY29sdW1uJ3MgaGVhZGVyIGNlbGwgYW5kIGFzIHdlbGwgYXMgY2VsbC1zcGVjaWZpYyBwcm9wZXJ0aWVzLlxuICovXG5ARGlyZWN0aXZlKHtzZWxlY3RvcjogJ1tjZGtIZWFkZXJDZWxsRGVmXSd9KVxuZXhwb3J0IGNsYXNzIENka0hlYWRlckNlbGxEZWYgaW1wbGVtZW50cyBDZWxsRGVmIHtcbiAgY29uc3RydWN0b3IoLyoqIEBkb2NzLXByaXZhdGUgKi8gcHVibGljIHRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxhbnk+KSB7fVxufVxuXG4vKipcbiAqIEZvb3RlciBjZWxsIGRlZmluaXRpb24gZm9yIGEgQ0RLIHRhYmxlLlxuICogQ2FwdHVyZXMgdGhlIHRlbXBsYXRlIG9mIGEgY29sdW1uJ3MgZm9vdGVyIGNlbGwgYW5kIGFzIHdlbGwgYXMgY2VsbC1zcGVjaWZpYyBwcm9wZXJ0aWVzLlxuICovXG5ARGlyZWN0aXZlKHtzZWxlY3RvcjogJ1tjZGtGb290ZXJDZWxsRGVmXSd9KVxuZXhwb3J0IGNsYXNzIENka0Zvb3RlckNlbGxEZWYgaW1wbGVtZW50cyBDZWxsRGVmIHtcbiAgY29uc3RydWN0b3IoLyoqIEBkb2NzLXByaXZhdGUgKi8gcHVibGljIHRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxhbnk+KSB7fVxufVxuXG4vLyBCb2lsZXJwbGF0ZSBmb3IgYXBwbHlpbmcgbWl4aW5zIHRvIENka0NvbHVtbkRlZi5cbi8qKiBAZG9jcy1wcml2YXRlICovXG5jbGFzcyBDZGtDb2x1bW5EZWZCYXNlIHt9XG5jb25zdCBfQ2RrQ29sdW1uRGVmQmFzZTogQ2FuU3RpY2tDdG9yJnR5cGVvZiBDZGtDb2x1bW5EZWZCYXNlID1cbiAgICBtaXhpbkhhc1N0aWNreUlucHV0KENka0NvbHVtbkRlZkJhc2UpO1xuXG4vKipcbiAqIENvbHVtbiBkZWZpbml0aW9uIGZvciB0aGUgQ0RLIHRhYmxlLlxuICogRGVmaW5lcyBhIHNldCBvZiBjZWxscyBhdmFpbGFibGUgZm9yIGEgdGFibGUgY29sdW1uLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrQ29sdW1uRGVmXScsXG4gIGlucHV0czogWydzdGlja3knXSxcbiAgcHJvdmlkZXJzOiBbe3Byb3ZpZGU6ICdNQVRfU09SVF9IRUFERVJfQ09MVU1OX0RFRicsIHVzZUV4aXN0aW5nOiBDZGtDb2x1bW5EZWZ9XSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrQ29sdW1uRGVmIGV4dGVuZHMgX0Nka0NvbHVtbkRlZkJhc2UgaW1wbGVtZW50cyBDYW5TdGljayB7XG4gIC8qKiBVbmlxdWUgbmFtZSBmb3IgdGhpcyBjb2x1bW4uICovXG4gIEBJbnB1dCgnY2RrQ29sdW1uRGVmJylcbiAgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fbmFtZTtcbiAgfVxuICBzZXQgbmFtZShuYW1lOiBzdHJpbmcpIHtcbiAgICAvLyBJZiB0aGUgZGlyZWN0aXZlIGlzIHNldCB3aXRob3V0IGEgbmFtZSAodXBkYXRlZCBwcm9ncmFtYXRpY2FsbHkpLCB0aGVuIHRoaXMgc2V0dGVyIHdpbGxcbiAgICAvLyB0cmlnZ2VyIHdpdGggYW4gZW1wdHkgc3RyaW5nIGFuZCBzaG91bGQgbm90IG92ZXJ3cml0ZSB0aGUgcHJvZ3JhbWF0aWNhbGx5IHNldCB2YWx1ZS5cbiAgICBpZiAobmFtZSkge1xuICAgICAgdGhpcy5fbmFtZSA9IG5hbWU7XG4gICAgICB0aGlzLmNzc0NsYXNzRnJpZW5kbHlOYW1lID0gbmFtZS5yZXBsYWNlKC9bXmEtejAtOV8tXS9pZywgJy0nKTtcbiAgICB9XG4gIH1cbiAgX25hbWU6IHN0cmluZztcblxuICAvKipcbiAgICogV2hldGhlciB0aGlzIGNvbHVtbiBzaG91bGQgYmUgc3RpY2t5IHBvc2l0aW9uZWQgb24gdGhlIGVuZCBvZiB0aGUgcm93LiBTaG91bGQgbWFrZSBzdXJlXG4gICAqIHRoYXQgaXQgbWltaWNzIHRoZSBgQ2FuU3RpY2tgIG1peGluIHN1Y2ggdGhhdCBgX2hhc1N0aWNreUNoYW5nZWRgIGlzIHNldCB0byB0cnVlIGlmIHRoZSB2YWx1ZVxuICAgKiBoYXMgYmVlbiBjaGFuZ2VkLlxuICAgKi9cbiAgQElucHV0KCdzdGlja3lFbmQnKVxuICBnZXQgc3RpY2t5RW5kKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9zdGlja3lFbmQ7XG4gIH1cbiAgc2V0IHN0aWNreUVuZCh2OiBib29sZWFuKSB7XG4gICAgY29uc3QgcHJldlZhbHVlID0gdGhpcy5fc3RpY2t5RW5kO1xuICAgIHRoaXMuX3N0aWNreUVuZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2KTtcbiAgICB0aGlzLl9oYXNTdGlja3lDaGFuZ2VkID0gcHJldlZhbHVlICE9PSB0aGlzLl9zdGlja3lFbmQ7XG4gIH1cbiAgX3N0aWNreUVuZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBAZG9jcy1wcml2YXRlICovXG4gIEBDb250ZW50Q2hpbGQoQ2RrQ2VsbERlZikgY2VsbDogQ2RrQ2VsbERlZjtcblxuICAvKiogQGRvY3MtcHJpdmF0ZSAqL1xuICBAQ29udGVudENoaWxkKENka0hlYWRlckNlbGxEZWYpIGhlYWRlckNlbGw6IENka0hlYWRlckNlbGxEZWY7XG5cbiAgLyoqIEBkb2NzLXByaXZhdGUgKi9cbiAgQENvbnRlbnRDaGlsZChDZGtGb290ZXJDZWxsRGVmKSBmb290ZXJDZWxsOiBDZGtGb290ZXJDZWxsRGVmO1xuXG4gIC8qKlxuICAgKiBUcmFuc2Zvcm1lZCB2ZXJzaW9uIG9mIHRoZSBjb2x1bW4gbmFtZSB0aGF0IGNhbiBiZSB1c2VkIGFzIHBhcnQgb2YgYSBDU1MgY2xhc3NuYW1lLiBFeGNsdWRlc1xuICAgKiBhbGwgbm9uLWFscGhhbnVtZXJpYyBjaGFyYWN0ZXJzIGFuZCB0aGUgc3BlY2lhbCBjaGFyYWN0ZXJzICctJyBhbmQgJ18nLiBBbnkgY2hhcmFjdGVycyB0aGF0XG4gICAqIGRvIG5vdCBtYXRjaCBhcmUgcmVwbGFjZWQgYnkgdGhlICctJyBjaGFyYWN0ZXIuXG4gICAqL1xuICBjc3NDbGFzc0ZyaWVuZGx5TmFtZTogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKEBJbmplY3QoQ0RLX1RBQkxFKSBAT3B0aW9uYWwoKSBwdWJsaWMgX3RhYmxlPzogYW55KSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9zdGlja3k6IEJvb2xlYW5JbnB1dDtcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX3N0aWNreUVuZDogQm9vbGVhbklucHV0O1xufVxuXG4vKiogQmFzZSBjbGFzcyBmb3IgdGhlIGNlbGxzLiBBZGRzIGEgQ1NTIGNsYXNzbmFtZSB0aGF0IGlkZW50aWZpZXMgdGhlIGNvbHVtbiBpdCByZW5kZXJzIGluLiAqL1xuZXhwb3J0IGNsYXNzIEJhc2VDZGtDZWxsIHtcbiAgY29uc3RydWN0b3IoY29sdW1uRGVmOiBDZGtDb2x1bW5EZWYsIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHtcbiAgICBjb25zdCBjb2x1bW5DbGFzc05hbWUgPSBgY2RrLWNvbHVtbi0ke2NvbHVtbkRlZi5jc3NDbGFzc0ZyaWVuZGx5TmFtZX1gO1xuICAgIGVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5jbGFzc0xpc3QuYWRkKGNvbHVtbkNsYXNzTmFtZSk7XG4gIH1cbn1cblxuLyoqIEhlYWRlciBjZWxsIHRlbXBsYXRlIGNvbnRhaW5lciB0aGF0IGFkZHMgdGhlIHJpZ2h0IGNsYXNzZXMgYW5kIHJvbGUuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdjZGstaGVhZGVyLWNlbGwsIHRoW2Nkay1oZWFkZXItY2VsbF0nLFxuICBob3N0OiB7XG4gICAgJ2NsYXNzJzogJ2Nkay1oZWFkZXItY2VsbCcsXG4gICAgJ3JvbGUnOiAnY29sdW1uaGVhZGVyJyxcbiAgfSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrSGVhZGVyQ2VsbCBleHRlbmRzIEJhc2VDZGtDZWxsIHtcbiAgY29uc3RydWN0b3IoY29sdW1uRGVmOiBDZGtDb2x1bW5EZWYsIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHtcbiAgICBzdXBlcihjb2x1bW5EZWYsIGVsZW1lbnRSZWYpO1xuICB9XG59XG5cbi8qKiBGb290ZXIgY2VsbCB0ZW1wbGF0ZSBjb250YWluZXIgdGhhdCBhZGRzIHRoZSByaWdodCBjbGFzc2VzIGFuZCByb2xlLiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnY2RrLWZvb3Rlci1jZWxsLCB0ZFtjZGstZm9vdGVyLWNlbGxdJyxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstZm9vdGVyLWNlbGwnLFxuICAgICdyb2xlJzogJ2dyaWRjZWxsJyxcbiAgfSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrRm9vdGVyQ2VsbCBleHRlbmRzIEJhc2VDZGtDZWxsIHtcbiAgY29uc3RydWN0b3IoY29sdW1uRGVmOiBDZGtDb2x1bW5EZWYsIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHtcbiAgICBzdXBlcihjb2x1bW5EZWYsIGVsZW1lbnRSZWYpO1xuICB9XG59XG5cbi8qKiBDZWxsIHRlbXBsYXRlIGNvbnRhaW5lciB0aGF0IGFkZHMgdGhlIHJpZ2h0IGNsYXNzZXMgYW5kIHJvbGUuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdjZGstY2VsbCwgdGRbY2RrLWNlbGxdJyxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstY2VsbCcsXG4gICAgJ3JvbGUnOiAnZ3JpZGNlbGwnLFxuICB9LFxufSlcbmV4cG9ydCBjbGFzcyBDZGtDZWxsIGV4dGVuZHMgQmFzZUNka0NlbGwge1xuICBjb25zdHJ1Y3Rvcihjb2x1bW5EZWY6IENka0NvbHVtbkRlZiwgZWxlbWVudFJlZjogRWxlbWVudFJlZikge1xuICAgIHN1cGVyKGNvbHVtbkRlZiwgZWxlbWVudFJlZik7XG4gIH1cbn1cbiJdfQ==