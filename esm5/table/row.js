/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __extends } from "tslib";
import { ChangeDetectionStrategy, Component, Directive, IterableDiffers, TemplateRef, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { mixinHasStickyInput } from './can-stick';
/**
 * The row template that can be used by the mat-table. Should not be used outside of the
 * material library.
 */
export var CDK_ROW_TEMPLATE = "<ng-container cdkCellOutlet></ng-container>";
/**
 * Base class for the CdkHeaderRowDef and CdkRowDef that handles checking their columns inputs
 * for changes and notifying the table.
 */
var BaseRowDef = /** @class */ (function () {
    function BaseRowDef(
    /** @docs-private */ template, _differs) {
        this.template = template;
        this._differs = _differs;
    }
    BaseRowDef.prototype.ngOnChanges = function (changes) {
        // Create a new columns differ if one does not yet exist. Initialize it based on initial value
        // of the columns property or an empty array if none is provided.
        if (!this._columnsDiffer) {
            var columns = (changes['columns'] && changes['columns'].currentValue) || [];
            this._columnsDiffer = this._differs.find(columns).create();
            this._columnsDiffer.diff(columns);
        }
    };
    /**
     * Returns the difference between the current columns and the columns from the last diff, or null
     * if there is no difference.
     */
    BaseRowDef.prototype.getColumnsDiff = function () {
        return this._columnsDiffer.diff(this.columns);
    };
    /** Gets this row def's relevant cell template from the provided column def. */
    BaseRowDef.prototype.extractCellTemplate = function (column) {
        if (this instanceof CdkHeaderRowDef) {
            return column.headerCell.template;
        }
        if (this instanceof CdkFooterRowDef) {
            return column.footerCell.template;
        }
        else {
            return column.cell.template;
        }
    };
    return BaseRowDef;
}());
export { BaseRowDef };
// Boilerplate for applying mixins to CdkHeaderRowDef.
/** @docs-private */
var CdkHeaderRowDefBase = /** @class */ (function (_super) {
    __extends(CdkHeaderRowDefBase, _super);
    function CdkHeaderRowDefBase() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return CdkHeaderRowDefBase;
}(BaseRowDef));
var _CdkHeaderRowDefBase = mixinHasStickyInput(CdkHeaderRowDefBase);
/**
 * Header row definition for the CDK table.
 * Captures the header row's template and other header properties such as the columns to display.
 */
var CdkHeaderRowDef = /** @class */ (function (_super) {
    __extends(CdkHeaderRowDef, _super);
    function CdkHeaderRowDef(template, _differs) {
        return _super.call(this, template, _differs) || this;
    }
    // Prerender fails to recognize that ngOnChanges in a part of this class through inheritance.
    // Explicitly define it so that the method is called as part of the Angular lifecycle.
    CdkHeaderRowDef.prototype.ngOnChanges = function (changes) {
        _super.prototype.ngOnChanges.call(this, changes);
    };
    CdkHeaderRowDef.decorators = [
        { type: Directive, args: [{
                    selector: '[cdkHeaderRowDef]',
                    inputs: ['columns: cdkHeaderRowDef', 'sticky: cdkHeaderRowDefSticky'],
                },] }
    ];
    /** @nocollapse */
    CdkHeaderRowDef.ctorParameters = function () { return [
        { type: TemplateRef },
        { type: IterableDiffers }
    ]; };
    return CdkHeaderRowDef;
}(_CdkHeaderRowDefBase));
export { CdkHeaderRowDef };
// Boilerplate for applying mixins to CdkFooterRowDef.
/** @docs-private */
var CdkFooterRowDefBase = /** @class */ (function (_super) {
    __extends(CdkFooterRowDefBase, _super);
    function CdkFooterRowDefBase() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return CdkFooterRowDefBase;
}(BaseRowDef));
var _CdkFooterRowDefBase = mixinHasStickyInput(CdkFooterRowDefBase);
/**
 * Footer row definition for the CDK table.
 * Captures the footer row's template and other footer properties such as the columns to display.
 */
var CdkFooterRowDef = /** @class */ (function (_super) {
    __extends(CdkFooterRowDef, _super);
    function CdkFooterRowDef(template, _differs) {
        return _super.call(this, template, _differs) || this;
    }
    // Prerender fails to recognize that ngOnChanges in a part of this class through inheritance.
    // Explicitly define it so that the method is called as part of the Angular lifecycle.
    CdkFooterRowDef.prototype.ngOnChanges = function (changes) {
        _super.prototype.ngOnChanges.call(this, changes);
    };
    CdkFooterRowDef.decorators = [
        { type: Directive, args: [{
                    selector: '[cdkFooterRowDef]',
                    inputs: ['columns: cdkFooterRowDef', 'sticky: cdkFooterRowDefSticky'],
                },] }
    ];
    /** @nocollapse */
    CdkFooterRowDef.ctorParameters = function () { return [
        { type: TemplateRef },
        { type: IterableDiffers }
    ]; };
    return CdkFooterRowDef;
}(_CdkFooterRowDefBase));
export { CdkFooterRowDef };
/**
 * Data row definition for the CDK table.
 * Captures the header row's template and other row properties such as the columns to display and
 * a when predicate that describes when this row should be used.
 */
var CdkRowDef = /** @class */ (function (_super) {
    __extends(CdkRowDef, _super);
    // TODO(andrewseguin): Add an input for providing a switch function to determine
    //   if this template should be used.
    function CdkRowDef(template, _differs) {
        return _super.call(this, template, _differs) || this;
    }
    CdkRowDef.decorators = [
        { type: Directive, args: [{
                    selector: '[cdkRowDef]',
                    inputs: ['columns: cdkRowDefColumns', 'when: cdkRowDefWhen'],
                },] }
    ];
    /** @nocollapse */
    CdkRowDef.ctorParameters = function () { return [
        { type: TemplateRef },
        { type: IterableDiffers }
    ]; };
    return CdkRowDef;
}(BaseRowDef));
export { CdkRowDef };
/**
 * Outlet for rendering cells inside of a row or header row.
 * @docs-private
 */
var CdkCellOutlet = /** @class */ (function () {
    function CdkCellOutlet(_viewContainer) {
        this._viewContainer = _viewContainer;
        CdkCellOutlet.mostRecentCellOutlet = this;
    }
    CdkCellOutlet.prototype.ngOnDestroy = function () {
        // If this was the last outlet being rendered in the view, remove the reference
        // from the static property after it has been destroyed to avoid leaking memory.
        if (CdkCellOutlet.mostRecentCellOutlet === this) {
            CdkCellOutlet.mostRecentCellOutlet = null;
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
    CdkCellOutlet.decorators = [
        { type: Directive, args: [{ selector: '[cdkCellOutlet]' },] }
    ];
    /** @nocollapse */
    CdkCellOutlet.ctorParameters = function () { return [
        { type: ViewContainerRef }
    ]; };
    return CdkCellOutlet;
}());
export { CdkCellOutlet };
/** Header template container that contains the cell outlet. Adds the right class and role. */
var CdkHeaderRow = /** @class */ (function () {
    function CdkHeaderRow() {
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
    return CdkHeaderRow;
}());
export { CdkHeaderRow };
/** Footer template container that contains the cell outlet. Adds the right class and role. */
var CdkFooterRow = /** @class */ (function () {
    function CdkFooterRow() {
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
    return CdkFooterRow;
}());
export { CdkFooterRow };
/** Data row template container that contains the cell outlet. Adds the right class and role. */
var CdkRow = /** @class */ (function () {
    function CdkRow() {
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
    return CdkRow;
}());
export { CdkRow };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm93LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90YWJsZS9yb3cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFDTCx1QkFBdUIsRUFDdkIsU0FBUyxFQUNULFNBQVMsRUFHVCxlQUFlLEVBSWYsV0FBVyxFQUNYLGdCQUFnQixFQUNoQixpQkFBaUIsRUFDbEIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUF5QixtQkFBbUIsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUd4RTs7O0dBR0c7QUFDSCxNQUFNLENBQUMsSUFBTSxnQkFBZ0IsR0FBRyw2Q0FBNkMsQ0FBQztBQUU5RTs7O0dBR0c7QUFDSDtJQU9FO0lBQ0ksb0JBQW9CLENBQVEsUUFBMEIsRUFBWSxRQUF5QjtRQUEvRCxhQUFRLEdBQVIsUUFBUSxDQUFrQjtRQUFZLGFBQVEsR0FBUixRQUFRLENBQWlCO0lBQy9GLENBQUM7SUFFRCxnQ0FBVyxHQUFYLFVBQVksT0FBc0I7UUFDaEMsOEZBQThGO1FBQzlGLGlFQUFpRTtRQUNqRSxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRTtZQUN4QixJQUFNLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQzlFLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDM0QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDbkM7SUFDSCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsbUNBQWMsR0FBZDtRQUNFLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFD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O0FBR3pCLGdHQUFnRztBQUNoRztJQUFBO0lBYUEsQ0FBQzs7Z0JBYkEsU0FBUyxTQUFDO29CQUNULFFBQVEsRUFBRSxzQkFBc0I7b0JBQ2hDLFFBQVEsRUFBRSxnQkFBZ0I7b0JBQzFCLElBQUksRUFBRTt3QkFDSixPQUFPLEVBQUUsU0FBUzt3QkFDbEIsTUFBTSxFQUFFLEtBQUs7cUJBQ2Q7b0JBQ0QsK0ZBQStGO29CQUMvRiwrQ0FBK0M7b0JBQy9DLGVBQWUsRUFBRSx1QkFBdUIsQ0FBQyxPQUFPO29CQUNoRCxhQUFhLEVBQUUsaUJBQWlCLENBQUMsSUFBSTtpQkFDdEM7O0lBRUQsYUFBQztDQUFBLEFBYkQsSUFhQztTQURZLE1BQU0iLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gIENvbXBvbmVudCxcbiAgRGlyZWN0aXZlLFxuICBJdGVyYWJsZUNoYW5nZXMsXG4gIEl0ZXJhYmxlRGlmZmVyLFxuICBJdGVyYWJsZURpZmZlcnMsXG4gIE9uQ2hhbmdlcyxcbiAgT25EZXN0cm95LFxuICBTaW1wbGVDaGFuZ2VzLFxuICBUZW1wbGF0ZVJlZixcbiAgVmlld0NvbnRhaW5lclJlZixcbiAgVmlld0VuY2Fwc3VsYXRpb25cbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0NhblN0aWNrLCBDYW5TdGlja0N0b3IsIG1peGluSGFzU3RpY2t5SW5wdXR9IGZyb20gJy4vY2FuLXN0aWNrJztcbmltcG9ydCB7Q2RrQ2VsbERlZiwgQ2RrQ29sdW1uRGVmfSBmcm9tICcuL2NlbGwnO1xuXG4vKipcbiAqIFRoZSByb3cgdGVtcGxhdGUgdGhhdCBjYW4gYmUgdXNlZCBieSB0aGUgbWF0LXRhYmxlLiBTaG91bGQgbm90IGJlIHVzZWQgb3V0c2lkZSBvZiB0aGVcbiAqIG1hdGVyaWFsIGxpYnJhcnkuXG4gKi9cbmV4cG9ydCBjb25zdCBDREtfUk9XX1RFTVBMQVRFID0gYDxuZy1jb250YWluZXIgY2RrQ2VsbE91dGxldD48L25nLWNvbnRhaW5lcj5gO1xuXG4vKipcbiAqIEJhc2UgY2xhc3MgZm9yIHRoZSBDZGtIZWFkZXJSb3dEZWYgYW5kIENka1Jvd0RlZiB0aGF0IGhhbmRsZXMgY2hlY2tpbmcgdGhlaXIgY29sdW1ucyBpbnB1dHNcbiAqIGZvciBjaGFuZ2VzIGFuZCBub3RpZnlpbmcgdGhlIHRhYmxlLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQmFzZVJvd0RlZiBpbXBsZW1lbnRzIE9uQ2hhbmdlcyB7XG4gIC8qKiBUaGUgY29sdW1ucyB0byBiZSBkaXNwbGF5ZWQgb24gdGhpcyByb3cuICovXG4gIGNvbHVtbnM6IEl0ZXJhYmxlPHN0cmluZz47XG5cbiAgLyoqIERpZmZlciB1c2VkIHRvIGNoZWNrIGlmIGFueSBjaGFuZ2VzIHdlcmUgbWFkZSB0byB0aGUgY29sdW1ucy4gKi9cbiAgcHJvdGVjdGVkIF9jb2x1bW5zRGlmZmVyOiBJdGVyYWJsZURpZmZlcjxhbnk+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgLyoqIEBkb2NzLXByaXZhdGUgKi8gcHVibGljIHRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxhbnk+LCBwcm90ZWN0ZWQgX2RpZmZlcnM6IEl0ZXJhYmxlRGlmZmVycykge1xuICB9XG5cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIC8vIENyZWF0ZSBhIG5ldyBjb2x1bW5zIGRpZmZlciBpZiBvbmUgZG9lcyBub3QgeWV0IGV4aXN0LiBJbml0aWFsaXplIGl0IGJhc2VkIG9uIGluaXRpYWwgdmFsdWVcbiAgICAvLyBvZiB0aGUgY29sdW1ucyBwcm9wZXJ0eSBvciBhbiBlbXB0eSBhcnJheSBpZiBub25lIGlzIHByb3ZpZGVkLlxuICAgIGlmICghdGhpcy5fY29sdW1uc0RpZmZlcikge1xuICAgICAgY29uc3QgY29sdW1ucyA9IChjaGFuZ2VzWydjb2x1bW5zJ10gJiYgY2hhbmdlc1snY29sdW1ucyddLmN1cnJlbnRWYWx1ZSkgfHwgW107XG4gICAgICB0aGlzLl9jb2x1bW5zRGlmZmVyID0gdGhpcy5fZGlmZmVycy5maW5kKGNvbHVtbnMpLmNyZWF0ZSgpO1xuICAgICAgdGhpcy5fY29sdW1uc0RpZmZlci5kaWZmKGNvbHVtbnMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gdGhlIGN1cnJlbnQgY29sdW1ucyBhbmQgdGhlIGNvbHVtbnMgZnJvbSB0aGUgbGFzdCBkaWZmLCBvciBudWxsXG4gICAqIGlmIHRoZXJlIGlzIG5vIGRpZmZlcmVuY2UuXG4gICAqL1xuICBnZXRDb2x1bW5zRGlmZigpOiBJdGVyYWJsZUNoYW5nZXM8YW55PnxudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fY29sdW1uc0RpZmZlci5kaWZmKHRoaXMuY29sdW1ucyk7XG4gIH1cblxuICAvKiogR2V0cyB0aGlzIHJvdyBkZWYncyByZWxldmFudCBjZWxsIHRlbXBsYXRlIGZyb20gdGhlIHByb3ZpZGVkIGNvbHVtbiBkZWYuICovXG4gIGV4dHJhY3RDZWxsVGVtcGxhdGUoY29sdW1uOiBDZGtDb2x1bW5EZWYpOiBUZW1wbGF0ZVJlZjxhbnk+IHtcbiAgICBpZiAodGhpcyBpbnN0YW5jZW9mIENka0hlYWRlclJvd0RlZikge1xuICAgICAgcmV0dXJuIGNvbHVtbi5oZWFkZXJDZWxsLnRlbXBsYXRlO1xuICAgIH1cbiAgICBpZiAodGhpcyBpbnN0YW5jZW9mIENka0Zvb3RlclJvd0RlZikge1xuICAgICAgcmV0dXJuIGNvbHVtbi5mb290ZXJDZWxsLnRlbXBsYXRlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY29sdW1uLmNlbGwudGVtcGxhdGU7XG4gICAgfVxuICB9XG59XG5cbi8vIEJvaWxlcnBsYXRlIGZvciBhcHBseWluZyBtaXhpbnMgdG8gQ2RrSGVhZGVyUm93RGVmLlxuLyoqIEBkb2NzLXByaXZhdGUgKi9cbmNsYXNzIENka0hlYWRlclJvd0RlZkJhc2UgZXh0ZW5kcyBCYXNlUm93RGVmIHt9XG5jb25zdCBfQ2RrSGVhZGVyUm93RGVmQmFzZTogQ2FuU3RpY2tDdG9yJnR5cGVvZiBDZGtIZWFkZXJSb3dEZWZCYXNlID1cbiAgICBtaXhpbkhhc1N0aWNreUlucHV0KENka0hlYWRlclJvd0RlZkJhc2UpO1xuXG4vKipcbiAqIEhlYWRlciByb3cgZGVmaW5pdGlvbiBmb3IgdGhlIENESyB0YWJsZS5cbiAqIENhcHR1cmVzIHRoZSBoZWFkZXIgcm93J3MgdGVtcGxhdGUgYW5kIG90aGVyIGhlYWRlciBwcm9wZXJ0aWVzIHN1Y2ggYXMgdGhlIGNvbHVtbnMgdG8gZGlzcGxheS5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka0hlYWRlclJvd0RlZl0nLFxuICBpbnB1dHM6IFsnY29sdW1uczogY2RrSGVhZGVyUm93RGVmJywgJ3N0aWNreTogY2RrSGVhZGVyUm93RGVmU3RpY2t5J10sXG59KVxuZXhwb3J0IGNsYXNzIENka0hlYWRlclJvd0RlZiBleHRlbmRzIF9DZGtIZWFkZXJSb3dEZWZCYXNlIGltcGxlbWVudHMgQ2FuU3RpY2ssIE9uQ2hhbmdlcyB7XG4gIGNvbnN0cnVjdG9yKHRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxhbnk+LCBfZGlmZmVyczogSXRlcmFibGVEaWZmZXJzKSB7XG4gICAgc3VwZXIodGVtcGxhdGUsIF9kaWZmZXJzKTtcbiAgfVxuXG4gIC8vIFByZXJlbmRlciBmYWlscyB0byByZWNvZ25pemUgdGhhdCBuZ09uQ2hhbmdlcyBpbiBhIHBhcnQgb2YgdGhpcyBjbGFzcyB0aHJvdWdoIGluaGVyaXRhbmNlLlxuICAvLyBFeHBsaWNpdGx5IGRlZmluZSBpdCBzbyB0aGF0IHRoZSBtZXRob2QgaXMgY2FsbGVkIGFzIHBhcnQgb2YgdGhlIEFuZ3VsYXIgbGlmZWN5Y2xlLlxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XG4gICAgc3VwZXIubmdPbkNoYW5nZXMoY2hhbmdlcyk7XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfc3RpY2t5OiBib29sZWFuIHwgc3RyaW5nO1xufVxuXG4vLyBCb2lsZXJwbGF0ZSBmb3IgYXBwbHlpbmcgbWl4aW5zIHRvIENka0Zvb3RlclJvd0RlZi5cbi8qKiBAZG9jcy1wcml2YXRlICovXG5jbGFzcyBDZGtGb290ZXJSb3dEZWZCYXNlIGV4dGVuZHMgQmFzZVJvd0RlZiB7fVxuY29uc3QgX0Nka0Zvb3RlclJvd0RlZkJhc2U6IENhblN0aWNrQ3RvciZ0eXBlb2YgQ2RrRm9vdGVyUm93RGVmQmFzZSA9XG4gICAgbWl4aW5IYXNTdGlja3lJbnB1dChDZGtGb290ZXJSb3dEZWZCYXNlKTtcblxuLyoqXG4gKiBGb290ZXIgcm93IGRlZmluaXRpb24gZm9yIHRoZSBDREsgdGFibGUuXG4gKiBDYXB0dXJlcyB0aGUgZm9vdGVyIHJvdydzIHRlbXBsYXRlIGFuZCBvdGhlciBmb290ZXIgcHJvcGVydGllcyBzdWNoIGFzIHRoZSBjb2x1bW5zIHRvIGRpc3BsYXkuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtGb290ZXJSb3dEZWZdJyxcbiAgaW5wdXRzOiBbJ2NvbHVtbnM6IGNka0Zvb3RlclJvd0RlZicsICdzdGlja3k6IGNka0Zvb3RlclJvd0RlZlN0aWNreSddLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtGb290ZXJSb3dEZWYgZXh0ZW5kcyBfQ2RrRm9vdGVyUm93RGVmQmFzZSBpbXBsZW1lbnRzIENhblN0aWNrLCBPbkNoYW5nZXMge1xuICBjb25zdHJ1Y3Rvcih0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8YW55PiwgX2RpZmZlcnM6IEl0ZXJhYmxlRGlmZmVycykge1xuICAgIHN1cGVyKHRlbXBsYXRlLCBfZGlmZmVycyk7XG4gIH1cblxuICAvLyBQcmVyZW5kZXIgZmFpbHMgdG8gcmVjb2duaXplIHRoYXQgbmdPbkNoYW5nZXMgaW4gYSBwYXJ0IG9mIHRoaXMgY2xhc3MgdGhyb3VnaCBpbmhlcml0YW5jZS5cbiAgLy8gRXhwbGljaXRseSBkZWZpbmUgaXQgc28gdGhhdCB0aGUgbWV0aG9kIGlzIGNhbGxlZCBhcyBwYXJ0IG9mIHRoZSBBbmd1bGFyIGxpZmVjeWNsZS5cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIHN1cGVyLm5nT25DaGFuZ2VzKGNoYW5nZXMpO1xuICB9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX3N0aWNreTogYm9vbGVhbiB8IHN0cmluZztcbn1cblxuLyoqXG4gKiBEYXRhIHJvdyBkZWZpbml0aW9uIGZvciB0aGUgQ0RLIHRhYmxlLlxuICogQ2FwdHVyZXMgdGhlIGhlYWRlciByb3cncyB0ZW1wbGF0ZSBhbmQgb3RoZXIgcm93IHByb3BlcnRpZXMgc3VjaCBhcyB0aGUgY29sdW1ucyB0byBkaXNwbGF5IGFuZFxuICogYSB3aGVuIHByZWRpY2F0ZSB0aGF0IGRlc2NyaWJlcyB3aGVuIHRoaXMgcm93IHNob3VsZCBiZSB1c2VkLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrUm93RGVmXScsXG4gIGlucHV0czogWydjb2x1bW5zOiBjZGtSb3dEZWZDb2x1bW5zJywgJ3doZW46IGNka1Jvd0RlZldoZW4nXSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrUm93RGVmPFQ+IGV4dGVuZHMgQmFzZVJvd0RlZiB7XG4gIC8qKlxuICAgKiBGdW5jdGlvbiB0aGF0IHNob3VsZCByZXR1cm4gdHJ1ZSBpZiB0aGlzIHJvdyB0ZW1wbGF0ZSBzaG91bGQgYmUgdXNlZCBmb3IgdGhlIHByb3ZpZGVkIGluZGV4XG4gICAqIGFuZCByb3cgZGF0YS4gSWYgbGVmdCB1bmRlZmluZWQsIHRoaXMgcm93IHdpbGwgYmUgY29uc2lkZXJlZCB0aGUgZGVmYXVsdCByb3cgdGVtcGxhdGUgdG8gdXNlXG4gICAqIHdoZW4gbm8gb3RoZXIgd2hlbiBmdW5jdGlvbnMgcmV0dXJuIHRydWUgZm9yIHRoZSBkYXRhLlxuICAgKiBGb3IgZXZlcnkgcm93LCB0aGVyZSBtdXN0IGJlIGF0IGxlYXN0IG9uZSB3aGVuIGZ1bmN0aW9uIHRoYXQgcGFzc2VzIG9yIGFuIHVuZGVmaW5lZCB0byBkZWZhdWx0LlxuICAgKi9cbiAgd2hlbjogKGluZGV4OiBudW1iZXIsIHJvd0RhdGE6IFQpID0+IGJvb2xlYW47XG5cbiAgLy8gVE9ETyhhbmRyZXdzZWd1aW4pOiBBZGQgYW4gaW5wdXQgZm9yIHByb3ZpZGluZyBhIHN3aXRjaCBmdW5jdGlvbiB0byBkZXRlcm1pbmVcbiAgLy8gICBpZiB0aGlzIHRlbXBsYXRlIHNob3VsZCBiZSB1c2VkLlxuICBjb25zdHJ1Y3Rvcih0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8YW55PiwgX2RpZmZlcnM6IEl0ZXJhYmxlRGlmZmVycykge1xuICAgIHN1cGVyKHRlbXBsYXRlLCBfZGlmZmVycyk7XG4gIH1cbn1cblxuLyoqIENvbnRleHQgcHJvdmlkZWQgdG8gdGhlIHJvdyBjZWxscyB3aGVuIGBtdWx0aVRlbXBsYXRlRGF0YVJvd3NgIGlzIGZhbHNlICovXG5leHBvcnQgaW50ZXJmYWNlIENka0NlbGxPdXRsZXRSb3dDb250ZXh0PFQ+IHtcbiAgLyoqIERhdGEgZm9yIHRoZSByb3cgdGhhdCB0aGlzIGNlbGwgaXMgbG9jYXRlZCB3aXRoaW4uICovXG4gICRpbXBsaWNpdD86IFQ7XG5cbiAgLyoqIEluZGV4IG9mIHRoZSBkYXRhIG9iamVjdCBpbiB0aGUgcHJvdmlkZWQgZGF0YSBhcnJheS4gKi9cbiAgaW5kZXg/OiBudW1iZXI7XG5cbiAgLyoqIExlbmd0aCBvZiB0aGUgbnVtYmVyIG9mIHRvdGFsIHJvd3MuICovXG4gIGNvdW50PzogbnVtYmVyO1xuXG4gIC8qKiBUcnVlIGlmIHRoaXMgY2VsbCBpcyBjb250YWluZWQgaW4gdGhlIGZpcnN0IHJvdy4gKi9cbiAgZmlyc3Q/OiBib29sZWFuO1xuXG4gIC8qKiBUcnVlIGlmIHRoaXMgY2VsbCBpcyBjb250YWluZWQgaW4gdGhlIGxhc3Qgcm93LiAqL1xuICBsYXN0PzogYm9vbGVhbjtcblxuICAvKiogVHJ1ZSBpZiB0aGlzIGNlbGwgaXMgY29udGFpbmVkIGluIGEgcm93IHdpdGggYW4gZXZlbi1udW1iZXJlZCBpbmRleC4gKi9cbiAgZXZlbj86IGJvb2xlYW47XG5cbiAgLyoqIFRydWUgaWYgdGhpcyBjZWxsIGlzIGNvbnRhaW5lZCBpbiBhIHJvdyB3aXRoIGFuIG9kZC1udW1iZXJlZCBpbmRleC4gKi9cbiAgb2RkPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBDb250ZXh0IHByb3ZpZGVkIHRvIHRoZSByb3cgY2VsbHMgd2hlbiBgbXVsdGlUZW1wbGF0ZURhdGFSb3dzYCBpcyB0cnVlLiBUaGlzIGNvbnRleHQgaXMgdGhlIHNhbWVcbiAqIGFzIENka0NlbGxPdXRsZXRSb3dDb250ZXh0IGV4Y2VwdCB0aGF0IHRoZSBzaW5nbGUgYGluZGV4YCB2YWx1ZSBpcyByZXBsYWNlZCBieSBgZGF0YUluZGV4YCBhbmRcbiAqIGByZW5kZXJJbmRleGAuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2RrQ2VsbE91dGxldE11bHRpUm93Q29udGV4dDxUPiB7XG4gIC8qKiBEYXRhIGZvciB0aGUgcm93IHRoYXQgdGhpcyBjZWxsIGlzIGxvY2F0ZWQgd2l0aGluLiAqL1xuICAkaW1wbGljaXQ/OiBUO1xuXG4gIC8qKiBJbmRleCBvZiB0aGUgZGF0YSBvYmplY3QgaW4gdGhlIHByb3ZpZGVkIGRhdGEgYXJyYXkuICovXG4gIGRhdGFJbmRleD86IG51bWJlcjtcblxuICAvKiogSW5kZXggbG9jYXRpb24gb2YgdGhlIHJlbmRlcmVkIHJvdyB0aGF0IHRoaXMgY2VsbCBpcyBsb2NhdGVkIHdpdGhpbi4gKi9cbiAgcmVuZGVySW5kZXg/OiBudW1iZXI7XG5cbiAgLyoqIExlbmd0aCBvZiB0aGUgbnVtYmVyIG9mIHRvdGFsIHJvd3MuICovXG4gIGNvdW50PzogbnVtYmVyO1xuXG4gIC8qKiBUcnVlIGlmIHRoaXMgY2VsbCBpcyBjb250YWluZWQgaW4gdGhlIGZpcnN0IHJvdy4gKi9cbiAgZmlyc3Q/OiBib29sZWFuO1xuXG4gIC8qKiBUcnVlIGlmIHRoaXMgY2VsbCBpcyBjb250YWluZWQgaW4gdGhlIGxhc3Qgcm93LiAqL1xuICBsYXN0PzogYm9vbGVhbjtcblxuICAvKiogVHJ1ZSBpZiB0aGlzIGNlbGwgaXMgY29udGFpbmVkIGluIGEgcm93IHdpdGggYW4gZXZlbi1udW1iZXJlZCBpbmRleC4gKi9cbiAgZXZlbj86IGJvb2xlYW47XG5cbiAgLyoqIFRydWUgaWYgdGhpcyBjZWxsIGlzIGNvbnRhaW5lZCBpbiBhIHJvdyB3aXRoIGFuIG9kZC1udW1iZXJlZCBpbmRleC4gKi9cbiAgb2RkPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBPdXRsZXQgZm9yIHJlbmRlcmluZyBjZWxscyBpbnNpZGUgb2YgYSByb3cgb3IgaGVhZGVyIHJvdy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuQERpcmVjdGl2ZSh7c2VsZWN0b3I6ICdbY2RrQ2VsbE91dGxldF0nfSlcbmV4cG9ydCBjbGFzcyBDZGtDZWxsT3V0bGV0IGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIFRoZSBvcmRlcmVkIGxpc3Qgb2YgY2VsbHMgdG8gcmVuZGVyIHdpdGhpbiB0aGlzIG91dGxldCdzIHZpZXcgY29udGFpbmVyICovXG4gIGNlbGxzOiBDZGtDZWxsRGVmW107XG5cbiAgLyoqIFRoZSBkYXRhIGNvbnRleHQgdG8gYmUgcHJvdmlkZWQgdG8gZWFjaCBjZWxsICovXG4gIGNvbnRleHQ6IGFueTtcblxuICAvKipcbiAgICogU3RhdGljIHByb3BlcnR5IGNvbnRhaW5pbmcgdGhlIGxhdGVzdCBjb25zdHJ1Y3RlZCBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzLlxuICAgKiBVc2VkIGJ5IHRoZSBDREsgdGFibGUgd2hlbiBlYWNoIENka0hlYWRlclJvdyBhbmQgQ2RrUm93IGNvbXBvbmVudCBpcyBjcmVhdGVkIHVzaW5nXG4gICAqIGNyZWF0ZUVtYmVkZGVkVmlldy4gQWZ0ZXIgb25lIG9mIHRoZXNlIGNvbXBvbmVudHMgYXJlIGNyZWF0ZWQsIHRoaXMgcHJvcGVydHkgd2lsbCBwcm92aWRlXG4gICAqIGEgaGFuZGxlIHRvIHByb3ZpZGUgdGhhdCBjb21wb25lbnQncyBjZWxscyBhbmQgY29udGV4dC4gQWZ0ZXIgaW5pdCwgdGhlIENka0NlbGxPdXRsZXQgd2lsbFxuICAgKiBjb25zdHJ1Y3QgdGhlIGNlbGxzIHdpdGggdGhlIHByb3ZpZGVkIGNvbnRleHQuXG4gICAqL1xuICBzdGF0aWMgbW9zdFJlY2VudENlbGxPdXRsZXQ6IENka0NlbGxPdXRsZXR8bnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IocHVibGljIF92aWV3Q29udGFpbmVyOiBWaWV3Q29udGFpbmVyUmVmKSB7XG4gICAgQ2RrQ2VsbE91dGxldC5tb3N0UmVjZW50Q2VsbE91dGxldCA9IHRoaXM7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICAvLyBJZiB0aGlzIHdhcyB0aGUgbGFzdCBvdXRsZXQgYmVpbmcgcmVuZGVyZWQgaW4gdGhlIHZpZXcsIHJlbW92ZSB0aGUgcmVmZXJlbmNlXG4gICAgLy8gZnJvbSB0aGUgc3RhdGljIHByb3BlcnR5IGFmdGVyIGl0IGhhcyBiZWVuIGRlc3Ryb3llZCB0byBhdm9pZCBsZWFraW5nIG1lbW9yeS5cbiAgICBpZiAoQ2RrQ2VsbE91dGxldC5tb3N0UmVjZW50Q2VsbE91dGxldCA9PT0gdGhpcykge1xuICAgICAgQ2RrQ2VsbE91dGxldC5tb3N0UmVjZW50Q2VsbE91dGxldCA9IG51bGw7XG4gICAgfVxuICB9XG59XG5cbi8qKiBIZWFkZXIgdGVtcGxhdGUgY29udGFpbmVyIHRoYXQgY29udGFpbnMgdGhlIGNlbGwgb3V0bGV0LiBBZGRzIHRoZSByaWdodCBjbGFzcyBhbmQgcm9sZS4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2Nkay1oZWFkZXItcm93LCB0cltjZGstaGVhZGVyLXJvd10nLFxuICB0ZW1wbGF0ZTogQ0RLX1JPV19URU1QTEFURSxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstaGVhZGVyLXJvdycsXG4gICAgJ3JvbGUnOiAncm93JyxcbiAgfSxcbiAgLy8gU2VlIG5vdGUgb24gQ2RrVGFibGUgZm9yIGV4cGxhbmF0aW9uIG9uIHdoeSB0aGlzIHVzZXMgdGhlIGRlZmF1bHQgY2hhbmdlIGRldGVjdGlvbiBzdHJhdGVneS5cbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOnZhbGlkYXRlLWRlY29yYXRvcnNcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5EZWZhdWx0LFxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtIZWFkZXJSb3cge1xufVxuXG5cbi8qKiBGb290ZXIgdGVtcGxhdGUgY29udGFpbmVyIHRoYXQgY29udGFpbnMgdGhlIGNlbGwgb3V0bGV0LiBBZGRzIHRoZSByaWdodCBjbGFzcyBhbmQgcm9sZS4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2Nkay1mb290ZXItcm93LCB0cltjZGstZm9vdGVyLXJvd10nLFxuICB0ZW1wbGF0ZTogQ0RLX1JPV19URU1QTEFURSxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstZm9vdGVyLXJvdycsXG4gICAgJ3JvbGUnOiAncm93JyxcbiAgfSxcbiAgLy8gU2VlIG5vdGUgb24gQ2RrVGFibGUgZm9yIGV4cGxhbmF0aW9uIG9uIHdoeSB0aGlzIHVzZXMgdGhlIGRlZmF1bHQgY2hhbmdlIGRldGVjdGlvbiBzdHJhdGVneS5cbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOnZhbGlkYXRlLWRlY29yYXRvcnNcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5EZWZhdWx0LFxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtGb290ZXJSb3cge1xufVxuXG4vKiogRGF0YSByb3cgdGVtcGxhdGUgY29udGFpbmVyIHRoYXQgY29udGFpbnMgdGhlIGNlbGwgb3V0bGV0LiBBZGRzIHRoZSByaWdodCBjbGFzcyBhbmQgcm9sZS4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2Nkay1yb3csIHRyW2Nkay1yb3ddJyxcbiAgdGVtcGxhdGU6IENES19ST1dfVEVNUExBVEUsXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLXJvdycsXG4gICAgJ3JvbGUnOiAncm93JyxcbiAgfSxcbiAgLy8gU2VlIG5vdGUgb24gQ2RrVGFibGUgZm9yIGV4cGxhbmF0aW9uIG9uIHdoeSB0aGlzIHVzZXMgdGhlIGRlZmF1bHQgY2hhbmdlIGRldGVjdGlvbiBzdHJhdGVneS5cbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOnZhbGlkYXRlLWRlY29yYXRvcnNcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5EZWZhdWx0LFxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtSb3cge1xufVxuIl19