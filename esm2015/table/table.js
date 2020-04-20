/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/table/table.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directionality } from '@angular/cdk/bidi';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { isDataSource } from '@angular/cdk/collections';
import { Platform } from '@angular/cdk/platform';
import { DOCUMENT } from '@angular/common';
import { Attribute, ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChildren, Directive, ElementRef, EmbeddedViewRef, Inject, Input, isDevMode, IterableDiffers, Optional, QueryList, ViewChild, ViewContainerRef, ViewEncapsulation, ContentChild } from '@angular/core';
import { BehaviorSubject, of as observableOf, Subject, isObservable, } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CdkColumnDef } from './cell';
import { CdkCellOutlet, CdkFooterRowDef, CdkHeaderRowDef, CdkRowDef, CdkNoDataRow } from './row';
import { StickyStyler } from './sticky-styler';
import { getTableDuplicateColumnNameError, getTableMissingMatchingRowDefError, getTableMissingRowDefsError, getTableMultipleDefaultRowDefsError, getTableUnknownColumnError, getTableUnknownDataSourceError } from './table-errors';
import { CDK_TABLE } from './tokens';
/**
 * Interface used to provide an outlet for rows to be inserted into.
 * @record
 */
export function RowOutlet() { }
if (false) {
    /** @type {?} */
    RowOutlet.prototype.viewContainer;
}
/**
 * Provides a handle for the table to grab the view container's ng-container to insert data rows.
 * \@docs-private
 */
export class DataRowOutlet {
    /**
     * @param {?} viewContainer
     * @param {?} elementRef
     */
    constructor(viewContainer, elementRef) {
        this.viewContainer = viewContainer;
        this.elementRef = elementRef;
    }
}
DataRowOutlet.decorators = [
    { type: Directive, args: [{ selector: '[rowOutlet]' },] }
];
/** @nocollapse */
DataRowOutlet.ctorParameters = () => [
    { type: ViewContainerRef },
    { type: ElementRef }
];
if (false) {
    /** @type {?} */
    DataRowOutlet.prototype.viewContainer;
    /** @type {?} */
    DataRowOutlet.prototype.elementRef;
}
/**
 * Provides a handle for the table to grab the view container's ng-container to insert the header.
 * \@docs-private
 */
export class HeaderRowOutlet {
    /**
     * @param {?} viewContainer
     * @param {?} elementRef
     */
    constructor(viewContainer, elementRef) {
        this.viewContainer = viewContainer;
        this.elementRef = elementRef;
    }
}
HeaderRowOutlet.decorators = [
    { type: Directive, args: [{ selector: '[headerRowOutlet]' },] }
];
/** @nocollapse */
HeaderRowOutlet.ctorParameters = () => [
    { type: ViewContainerRef },
    { type: ElementRef }
];
if (false) {
    /** @type {?} */
    HeaderRowOutlet.prototype.viewContainer;
    /** @type {?} */
    HeaderRowOutlet.prototype.elementRef;
}
/**
 * Provides a handle for the table to grab the view container's ng-container to insert the footer.
 * \@docs-private
 */
export class FooterRowOutlet {
    /**
     * @param {?} viewContainer
     * @param {?} elementRef
     */
    constructor(viewContainer, elementRef) {
        this.viewContainer = viewContainer;
        this.elementRef = elementRef;
    }
}
FooterRowOutlet.decorators = [
    { type: Directive, args: [{ selector: '[footerRowOutlet]' },] }
];
/** @nocollapse */
FooterRowOutlet.ctorParameters = () => [
    { type: ViewContainerRef },
    { type: ElementRef }
];
if (false) {
    /** @type {?} */
    FooterRowOutlet.prototype.viewContainer;
    /** @type {?} */
    FooterRowOutlet.prototype.elementRef;
}
/**
 * Provides a handle for the table to grab the view
 * container's ng-container to insert the no data row.
 * \@docs-private
 */
export class NoDataRowOutlet {
    /**
     * @param {?} viewContainer
     * @param {?} elementRef
     */
    constructor(viewContainer, elementRef) {
        this.viewContainer = viewContainer;
        this.elementRef = elementRef;
    }
}
NoDataRowOutlet.decorators = [
    { type: Directive, args: [{ selector: '[noDataRowOutlet]' },] }
];
/** @nocollapse */
NoDataRowOutlet.ctorParameters = () => [
    { type: ViewContainerRef },
    { type: ElementRef }
];
if (false) {
    /** @type {?} */
    NoDataRowOutlet.prototype.viewContainer;
    /** @type {?} */
    NoDataRowOutlet.prototype.elementRef;
}
/**
 * The table template that can be used by the mat-table. Should not be used outside of the
 * material library.
 * \@docs-private
 * @type {?}
 */
export const CDK_TABLE_TEMPLATE = 
// Note that according to MDN, the `caption` element has to be projected as the **first**
// element in the table. See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption
`
  <ng-content select="caption"></ng-content>
  <ng-content select="colgroup, col"></ng-content>
  <ng-container headerRowOutlet></ng-container>
  <ng-container rowOutlet></ng-container>
  <ng-container noDataRowOutlet></ng-container>
  <ng-container footerRowOutlet></ng-container>
`;
/**
 * Interface used to conveniently type the possible context interfaces for the render row.
 * \@docs-private
 * @record
 * @template T
 */
export function RowContext() { }
/**
 * Class used to conveniently type the embedded view ref for rows with a context.
 * \@docs-private
 * @abstract
 * @template T
 */
class RowViewRef extends EmbeddedViewRef {
}
/**
 * Set of properties that represents the identity of a single rendered row.
 *
 * When the table needs to determine the list of rows to render, it will do so by iterating through
 * each data object and evaluating its list of row templates to display (when multiTemplateDataRows
 * is false, there is only one template per data object). For each pair of data object and row
 * template, a `RenderRow` is added to the list of rows to render. If the data object and row
 * template pair has already been rendered, the previously used `RenderRow` is added; else a new
 * `RenderRow` is * created. Once the list is complete and all data objects have been itereated
 * through, a diff is performed to determine the changes that need to be made to the rendered rows.
 *
 * \@docs-private
 * @record
 * @template T
 */
export function RenderRow() { }
if (false) {
    /** @type {?} */
    RenderRow.prototype.data;
    /** @type {?} */
    RenderRow.prototype.dataIndex;
    /** @type {?} */
    RenderRow.prototype.rowDef;
}
/**
 * A data table that can render a header row, data rows, and a footer row.
 * Uses the dataSource input to determine the data to be rendered. The data can be provided either
 * as a data array, an Observable stream that emits the data array to render, or a DataSource with a
 * connect function that will return an Observable stream that emits the data array to render.
 * @template T
 */
export class CdkTable {
    /**
     * @param {?} _differs
     * @param {?} _changeDetectorRef
     * @param {?} _elementRef
     * @param {?} role
     * @param {?} _dir
     * @param {?} _document
     * @param {?} _platform
     */
    constructor(_differs, _changeDetectorRef, _elementRef, role, _dir, _document, _platform) {
        this._differs = _differs;
        this._changeDetectorRef = _changeDetectorRef;
        this._elementRef = _elementRef;
        this._dir = _dir;
        this._platform = _platform;
        /**
         * Subject that emits when the component has been destroyed.
         */
        this._onDestroy = new Subject();
        /**
         * Map of all the user's defined columns (header, data, and footer cell template) identified by
         * name. Collection populated by the column definitions gathered by `ContentChildren` as well as
         * any custom column definitions added to `_customColumnDefs`.
         */
        this._columnDefsByName = new Map();
        /**
         * Column definitions that were defined outside of the direct content children of the table.
         * These will be defined when, e.g., creating a wrapper around the cdkTable that has
         * column definitions as *its* content child.
         */
        this._customColumnDefs = new Set();
        /**
         * Data row definitions that were defined outside of the direct content children of the table.
         * These will be defined when, e.g., creating a wrapper around the cdkTable that has
         * built-in data rows as *its* content child.
         */
        this._customRowDefs = new Set();
        /**
         * Header row definitions that were defined outside of the direct content children of the table.
         * These will be defined when, e.g., creating a wrapper around the cdkTable that has
         * built-in header rows as *its* content child.
         */
        this._customHeaderRowDefs = new Set();
        /**
         * Footer row definitions that were defined outside of the direct content children of the table.
         * These will be defined when, e.g., creating a wrapper around the cdkTable that has a
         * built-in footer row as *its* content child.
         */
        this._customFooterRowDefs = new Set();
        /**
         * Whether the header row definition has been changed. Triggers an update to the header row after
         * content is checked. Initialized as true so that the table renders the initial set of rows.
         */
        this._headerRowDefChanged = true;
        /**
         * Whether the footer row definition has been changed. Triggers an update to the footer row after
         * content is checked. Initialized as true so that the table renders the initial set of rows.
         */
        this._footerRowDefChanged = true;
        /**
         * Cache of the latest rendered `RenderRow` objects as a map for easy retrieval when constructing
         * a new list of `RenderRow` objects for rendering rows. Since the new list is constructed with
         * the cached `RenderRow` objects when possible, the row identity is preserved when the data
         * and row template matches, which allows the `IterableDiffer` to check rows by reference
         * and understand which rows are added/moved/removed.
         *
         * Implemented as a map of maps where the first key is the `data: T` object and the second is the
         * `CdkRowDef<T>` object. With the two keys, the cache points to a `RenderRow<T>` object that
         * contains an array of created pairs. The array is necessary to handle cases where the data
         * array contains multiple duplicate data objects and each instantiated `RenderRow` must be
         * stored.
         */
        this._cachedRenderRowsMap = new Map();
        /**
         * CSS class added to any row or cell that has sticky positioning applied. May be overriden by
         * table subclasses.
         */
        this.stickyCssClass = 'cdk-table-sticky';
        /**
         * Whether the no data row is currently showing anything.
         */
        this._isShowingNoDataRow = false;
        this._multiTemplateDataRows = false;
        // TODO(andrewseguin): Remove max value as the end index
        //   and instead calculate the view on init and scroll.
        /**
         * Stream containing the latest information on what rows are being displayed on screen.
         * Can be used by the data source to as a heuristic of what data should be provided.
         *
         * \@docs-private
         */
        this.viewChange = new BehaviorSubject({ start: 0, end: Number.MAX_VALUE });
        if (!role) {
            this._elementRef.nativeElement.setAttribute('role', 'grid');
        }
        this._document = _document;
        this._isNativeHtmlTable = this._elementRef.nativeElement.nodeName === 'TABLE';
    }
    /**
     * Tracking function that will be used to check the differences in data changes. Used similarly
     * to `ngFor` `trackBy` function. Optimize row operations by identifying a row based on its data
     * relative to the function to know if a row should be added/removed/moved.
     * Accepts a function that takes two parameters, `index` and `item`.
     * @return {?}
     */
    get trackBy() {
        return this._trackByFn;
    }
    /**
     * @param {?} fn
     * @return {?}
     */
    set trackBy(fn) {
        if (isDevMode() && fn != null && typeof fn !== 'function' && (/** @type {?} */ (console)) &&
            (/** @type {?} */ (console.warn))) {
            console.warn(`trackBy must be a function, but received ${JSON.stringify(fn)}.`);
        }
        this._trackByFn = fn;
    }
    /**
     * The table's source of data, which can be provided in three ways (in order of complexity):
     *   - Simple data array (each object represents one table row)
     *   - Stream that emits a data array each time the array changes
     *   - `DataSource` object that implements the connect/disconnect interface.
     *
     * If a data array is provided, the table must be notified when the array's objects are
     * added, removed, or moved. This can be done by calling the `renderRows()` function which will
     * render the diff since the last table render. If the data array reference is changed, the table
     * will automatically trigger an update to the rows.
     *
     * When providing an Observable stream, the table will trigger an update automatically when the
     * stream emits a new array of data.
     *
     * Finally, when providing a `DataSource` object, the table will use the Observable stream
     * provided by the connect function and trigger updates when that stream emits new data array
     * values. During the table's ngOnDestroy or when the data source is removed from the table, the
     * table will call the DataSource's `disconnect` function (may be useful for cleaning up any
     * subscriptions registered during the connect process).
     * @return {?}
     */
    get dataSource() {
        return this._dataSource;
    }
    /**
     * @param {?} dataSource
     * @return {?}
     */
    set dataSource(dataSource) {
        if (this._dataSource !== dataSource) {
            this._switchDataSource(dataSource);
        }
    }
    /**
     * Whether to allow multiple rows per data object by evaluating which rows evaluate their 'when'
     * predicate to true. If `multiTemplateDataRows` is false, which is the default value, then each
     * dataobject will render the first row that evaluates its when predicate to true, in the order
     * defined in the table, or otherwise the default row which does not have a when predicate.
     * @return {?}
     */
    get multiTemplateDataRows() {
        return this._multiTemplateDataRows;
    }
    /**
     * @param {?} v
     * @return {?}
     */
    set multiTemplateDataRows(v) {
        this._multiTemplateDataRows = coerceBooleanProperty(v);
        // In Ivy if this value is set via a static attribute (e.g. <table multiTemplateDataRows>),
        // this setter will be invoked before the row outlet has been defined hence the null check.
        if (this._rowOutlet && this._rowOutlet.viewContainer.length) {
            this._forceRenderDataRows();
        }
    }
    /**
     * @return {?}
     */
    ngOnInit() {
        this._setupStickyStyler();
        if (this._isNativeHtmlTable) {
            this._applyNativeTableSections();
        }
        // Set up the trackBy function so that it uses the `RenderRow` as its identity by default. If
        // the user has provided a custom trackBy, return the result of that function as evaluated
        // with the values of the `RenderRow`'s data and index.
        this._dataDiffer = this._differs.find([]).create((/**
         * @param {?} _i
         * @param {?} dataRow
         * @return {?}
         */
        (_i, dataRow) => {
            return this.trackBy ? this.trackBy(dataRow.dataIndex, dataRow.data) : dataRow;
        }));
    }
    /**
     * @return {?}
     */
    ngAfterContentChecked() {
        // Cache the row and column definitions gathered by ContentChildren and programmatic injection.
        this._cacheRowDefs();
        this._cacheColumnDefs();
        // Make sure that the user has at least added header, footer, or data row def.
        if (!this._headerRowDefs.length && !this._footerRowDefs.length && !this._rowDefs.length) {
            throw getTableMissingRowDefsError();
        }
        // Render updates if the list of columns have been changed for the header, row, or footer defs.
        this._renderUpdatedColumns();
        // If the header row definition has been changed, trigger a render to the header row.
        if (this._headerRowDefChanged) {
            this._forceRenderHeaderRows();
            this._headerRowDefChanged = false;
        }
        // If the footer row definition has been changed, trigger a render to the footer row.
        if (this._footerRowDefChanged) {
            this._forceRenderFooterRows();
            this._footerRowDefChanged = false;
        }
        // If there is a data source and row definitions, connect to the data source unless a
        // connection has already been made.
        if (this.dataSource && this._rowDefs.length > 0 && !this._renderChangeSubscription) {
            this._observeRenderChanges();
        }
        this._checkStickyStates();
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        this._rowOutlet.viewContainer.clear();
        this._noDataRowOutlet.viewContainer.clear();
        this._headerRowOutlet.viewContainer.clear();
        this._footerRowOutlet.viewContainer.clear();
        this._cachedRenderRowsMap.clear();
        this._onDestroy.next();
        this._onDestroy.complete();
        if (isDataSource(this.dataSource)) {
            this.dataSource.disconnect(this);
        }
    }
    /**
     * Renders rows based on the table's latest set of data, which was either provided directly as an
     * input or retrieved through an Observable stream (directly or from a DataSource).
     * Checks for differences in the data since the last diff to perform only the necessary
     * changes (add/remove/move rows).
     *
     * If the table's data source is a DataSource or Observable, this will be invoked automatically
     * each time the provided Observable stream emits a new data array. Otherwise if your data is
     * an array, this function will need to be called to render any changes.
     * @return {?}
     */
    renderRows() {
        this._renderRows = this._getAllRenderRows();
        /** @type {?} */
        const changes = this._dataDiffer.diff(this._renderRows);
        if (!changes) {
            return;
        }
        /** @type {?} */
        const viewContainer = this._rowOutlet.viewContainer;
        changes.forEachOperation((/**
         * @param {?} record
         * @param {?} prevIndex
         * @param {?} currentIndex
         * @return {?}
         */
        (record, prevIndex, currentIndex) => {
            if (record.previousIndex == null) {
                this._insertRow(record.item, (/** @type {?} */ (currentIndex)));
            }
            else if (currentIndex == null) {
                viewContainer.remove((/** @type {?} */ (prevIndex)));
            }
            else {
                /** @type {?} */
                const view = (/** @type {?} */ (viewContainer.get((/** @type {?} */ (prevIndex)))));
                viewContainer.move((/** @type {?} */ (view)), currentIndex);
            }
        }));
        // Update the meta context of a row's context data (index, count, first, last, ...)
        this._updateRowIndexContext();
        // Update rows that did not get added/removed/moved but may have had their identity changed,
        // e.g. if trackBy matched data on some property but the actual data reference changed.
        changes.forEachIdentityChange((/**
         * @param {?} record
         * @return {?}
         */
        (record) => {
            /** @type {?} */
            const rowView = (/** @type {?} */ (viewContainer.get((/** @type {?} */ (record.currentIndex)))));
            rowView.context.$implicit = record.item.data;
        }));
        this._updateNoDataRow();
        this.updateStickyColumnStyles();
    }
    /**
     * Sets the header row definition to be used. Overrides the header row definition gathered by
     * using `ContentChild`, if one exists. Sets a flag that will re-render the header row after the
     * table's content is checked.
     * \@docs-private
     * @deprecated Use `addHeaderRowDef` and `removeHeaderRowDef` instead
     * \@breaking-change 8.0.0
     * @param {?} headerRowDef
     * @return {?}
     */
    setHeaderRowDef(headerRowDef) {
        this._customHeaderRowDefs = new Set([headerRowDef]);
        this._headerRowDefChanged = true;
    }
    /**
     * Sets the footer row definition to be used. Overrides the footer row definition gathered by
     * using `ContentChild`, if one exists. Sets a flag that will re-render the footer row after the
     * table's content is checked.
     * \@docs-private
     * @deprecated Use `addFooterRowDef` and `removeFooterRowDef` instead
     * \@breaking-change 8.0.0
     * @param {?} footerRowDef
     * @return {?}
     */
    setFooterRowDef(footerRowDef) {
        this._customFooterRowDefs = new Set([footerRowDef]);
        this._footerRowDefChanged = true;
    }
    /**
     * Adds a column definition that was not included as part of the content children.
     * @param {?} columnDef
     * @return {?}
     */
    addColumnDef(columnDef) {
        this._customColumnDefs.add(columnDef);
    }
    /**
     * Removes a column definition that was not included as part of the content children.
     * @param {?} columnDef
     * @return {?}
     */
    removeColumnDef(columnDef) {
        this._customColumnDefs.delete(columnDef);
    }
    /**
     * Adds a row definition that was not included as part of the content children.
     * @param {?} rowDef
     * @return {?}
     */
    addRowDef(rowDef) {
        this._customRowDefs.add(rowDef);
    }
    /**
     * Removes a row definition that was not included as part of the content children.
     * @param {?} rowDef
     * @return {?}
     */
    removeRowDef(rowDef) {
        this._customRowDefs.delete(rowDef);
    }
    /**
     * Adds a header row definition that was not included as part of the content children.
     * @param {?} headerRowDef
     * @return {?}
     */
    addHeaderRowDef(headerRowDef) {
        this._customHeaderRowDefs.add(headerRowDef);
        this._headerRowDefChanged = true;
    }
    /**
     * Removes a header row definition that was not included as part of the content children.
     * @param {?} headerRowDef
     * @return {?}
     */
    removeHeaderRowDef(headerRowDef) {
        this._customHeaderRowDefs.delete(headerRowDef);
        this._headerRowDefChanged = true;
    }
    /**
     * Adds a footer row definition that was not included as part of the content children.
     * @param {?} footerRowDef
     * @return {?}
     */
    addFooterRowDef(footerRowDef) {
        this._customFooterRowDefs.add(footerRowDef);
        this._footerRowDefChanged = true;
    }
    /**
     * Removes a footer row definition that was not included as part of the content children.
     * @param {?} footerRowDef
     * @return {?}
     */
    removeFooterRowDef(footerRowDef) {
        this._customFooterRowDefs.delete(footerRowDef);
        this._footerRowDefChanged = true;
    }
    /**
     * Updates the header sticky styles. First resets all applied styles with respect to the cells
     * sticking to the top. Then, evaluating which cells need to be stuck to the top. This is
     * automatically called when the header row changes its displayed set of columns, or if its
     * sticky input changes. May be called manually for cases where the cell content changes outside
     * of these events.
     * @return {?}
     */
    updateStickyHeaderRowStyles() {
        /** @type {?} */
        const headerRows = this._getRenderedRows(this._headerRowOutlet);
        /** @type {?} */
        const tableElement = (/** @type {?} */ (this._elementRef.nativeElement));
        // Hide the thead element if there are no header rows. This is necessary to satisfy
        // overzealous a11y checkers that fail because the `rowgroup` element does not contain
        // required child `row`.
        /** @type {?} */
        const thead = tableElement.querySelector('thead');
        if (thead) {
            thead.style.display = headerRows.length ? '' : 'none';
        }
        /** @type {?} */
        const stickyStates = this._headerRowDefs.map((/**
         * @param {?} def
         * @return {?}
         */
        def => def.sticky));
        this._stickyStyler.clearStickyPositioning(headerRows, ['top']);
        this._stickyStyler.stickRows(headerRows, stickyStates, 'top');
        // Reset the dirty state of the sticky input change since it has been used.
        this._headerRowDefs.forEach((/**
         * @param {?} def
         * @return {?}
         */
        def => def.resetStickyChanged()));
    }
    /**
     * Updates the footer sticky styles. First resets all applied styles with respect to the cells
     * sticking to the bottom. Then, evaluating which cells need to be stuck to the bottom. This is
     * automatically called when the footer row changes its displayed set of columns, or if its
     * sticky input changes. May be called manually for cases where the cell content changes outside
     * of these events.
     * @return {?}
     */
    updateStickyFooterRowStyles() {
        /** @type {?} */
        const footerRows = this._getRenderedRows(this._footerRowOutlet);
        /** @type {?} */
        const tableElement = (/** @type {?} */ (this._elementRef.nativeElement));
        // Hide the tfoot element if there are no footer rows. This is necessary to satisfy
        // overzealous a11y checkers that fail because the `rowgroup` element does not contain
        // required child `row`.
        /** @type {?} */
        const tfoot = tableElement.querySelector('tfoot');
        if (tfoot) {
            tfoot.style.display = footerRows.length ? '' : 'none';
        }
        /** @type {?} */
        const stickyStates = this._footerRowDefs.map((/**
         * @param {?} def
         * @return {?}
         */
        def => def.sticky));
        this._stickyStyler.clearStickyPositioning(footerRows, ['bottom']);
        this._stickyStyler.stickRows(footerRows, stickyStates, 'bottom');
        this._stickyStyler.updateStickyFooterContainer(this._elementRef.nativeElement, stickyStates);
        // Reset the dirty state of the sticky input change since it has been used.
        this._footerRowDefs.forEach((/**
         * @param {?} def
         * @return {?}
         */
        def => def.resetStickyChanged()));
    }
    /**
     * Updates the column sticky styles. First resets all applied styles with respect to the cells
     * sticking to the left and right. Then sticky styles are added for the left and right according
     * to the column definitions for each cell in each row. This is automatically called when
     * the data source provides a new set of data or when a column definition changes its sticky
     * input. May be called manually for cases where the cell content changes outside of these events.
     * @return {?}
     */
    updateStickyColumnStyles() {
        /** @type {?} */
        const headerRows = this._getRenderedRows(this._headerRowOutlet);
        /** @type {?} */
        const dataRows = this._getRenderedRows(this._rowOutlet);
        /** @type {?} */
        const footerRows = this._getRenderedRows(this._footerRowOutlet);
        // Clear the left and right positioning from all columns in the table across all rows since
        // sticky columns span across all table sections (header, data, footer)
        this._stickyStyler.clearStickyPositioning([...headerRows, ...dataRows, ...footerRows], ['left', 'right']);
        // Update the sticky styles for each header row depending on the def's sticky state
        headerRows.forEach((/**
         * @param {?} headerRow
         * @param {?} i
         * @return {?}
         */
        (headerRow, i) => {
            this._addStickyColumnStyles([headerRow], this._headerRowDefs[i]);
        }));
        // Update the sticky styles for each data row depending on its def's sticky state
        this._rowDefs.forEach((/**
         * @param {?} rowDef
         * @return {?}
         */
        rowDef => {
            // Collect all the rows rendered with this row definition.
            /** @type {?} */
            const rows = [];
            for (let i = 0; i < dataRows.length; i++) {
                if (this._renderRows[i].rowDef === rowDef) {
                    rows.push(dataRows[i]);
                }
            }
            this._addStickyColumnStyles(rows, rowDef);
        }));
        // Update the sticky styles for each footer row depending on the def's sticky state
        footerRows.forEach((/**
         * @param {?} footerRow
         * @param {?} i
         * @return {?}
         */
        (footerRow, i) => {
            this._addStickyColumnStyles([footerRow], this._footerRowDefs[i]);
        }));
        // Reset the dirty state of the sticky input change since it has been used.
        Array.from(this._columnDefsByName.values()).forEach((/**
         * @param {?} def
         * @return {?}
         */
        def => def.resetStickyChanged()));
    }
    /**
     * Get the list of RenderRow objects to render according to the current list of data and defined
     * row definitions. If the previous list already contained a particular pair, it should be reused
     * so that the differ equates their references.
     * @private
     * @return {?}
     */
    _getAllRenderRows() {
        /** @type {?} */
        const renderRows = [];
        // Store the cache and create a new one. Any re-used RenderRow objects will be moved into the
        // new cache while unused ones can be picked up by garbage collection.
        /** @type {?} */
        const prevCachedRenderRows = this._cachedRenderRowsMap;
        this._cachedRenderRowsMap = new Map();
        // For each data object, get the list of rows that should be rendered, represented by the
        // respective `RenderRow` object which is the pair of `data` and `CdkRowDef`.
        for (let i = 0; i < this._data.length; i++) {
            /** @type {?} */
            let data = this._data[i];
            /** @type {?} */
            const renderRowsForData = this._getRenderRowsForData(data, i, prevCachedRenderRows.get(data));
            if (!this._cachedRenderRowsMap.has(data)) {
                this._cachedRenderRowsMap.set(data, new WeakMap());
            }
            for (let j = 0; j < renderRowsForData.length; j++) {
                /** @type {?} */
                let renderRow = renderRowsForData[j];
                /** @type {?} */
                const cache = (/** @type {?} */ (this._cachedRenderRowsMap.get(renderRow.data)));
                if (cache.has(renderRow.rowDef)) {
                    (/** @type {?} */ (cache.get(renderRow.rowDef))).push(renderRow);
                }
                else {
                    cache.set(renderRow.rowDef, [renderRow]);
                }
                renderRows.push(renderRow);
            }
        }
        return renderRows;
    }
    /**
     * Gets a list of `RenderRow<T>` for the provided data object and any `CdkRowDef` objects that
     * should be rendered for this data. Reuses the cached RenderRow objects if they match the same
     * `(T, CdkRowDef)` pair.
     * @private
     * @param {?} data
     * @param {?} dataIndex
     * @param {?=} cache
     * @return {?}
     */
    _getRenderRowsForData(data, dataIndex, cache) {
        /** @type {?} */
        const rowDefs = this._getRowDefs(data, dataIndex);
        return rowDefs.map((/**
         * @param {?} rowDef
         * @return {?}
         */
        rowDef => {
            /** @type {?} */
            const cachedRenderRows = (cache && cache.has(rowDef)) ? (/** @type {?} */ (cache.get(rowDef))) : [];
            if (cachedRenderRows.length) {
                /** @type {?} */
                const dataRow = (/** @type {?} */ (cachedRenderRows.shift()));
                dataRow.dataIndex = dataIndex;
                return dataRow;
            }
            else {
                return { data, rowDef, dataIndex };
            }
        }));
    }
    /**
     * Update the map containing the content's column definitions.
     * @private
     * @return {?}
     */
    _cacheColumnDefs() {
        this._columnDefsByName.clear();
        /** @type {?} */
        const columnDefs = mergeArrayAndSet(this._getOwnDefs(this._contentColumnDefs), this._customColumnDefs);
        columnDefs.forEach((/**
         * @param {?} columnDef
         * @return {?}
         */
        columnDef => {
            if (this._columnDefsByName.has(columnDef.name)) {
                throw getTableDuplicateColumnNameError(columnDef.name);
            }
            this._columnDefsByName.set(columnDef.name, columnDef);
        }));
    }
    /**
     * Update the list of all available row definitions that can be used.
     * @private
     * @return {?}
     */
    _cacheRowDefs() {
        this._headerRowDefs = mergeArrayAndSet(this._getOwnDefs(this._contentHeaderRowDefs), this._customHeaderRowDefs);
        this._footerRowDefs = mergeArrayAndSet(this._getOwnDefs(this._contentFooterRowDefs), this._customFooterRowDefs);
        this._rowDefs = mergeArrayAndSet(this._getOwnDefs(this._contentRowDefs), this._customRowDefs);
        // After all row definitions are determined, find the row definition to be considered default.
        /** @type {?} */
        const defaultRowDefs = this._rowDefs.filter((/**
         * @param {?} def
         * @return {?}
         */
        def => !def.when));
        if (!this.multiTemplateDataRows && defaultRowDefs.length > 1) {
            throw getTableMultipleDefaultRowDefsError();
        }
        this._defaultRowDef = defaultRowDefs[0];
    }
    /**
     * Check if the header, data, or footer rows have changed what columns they want to display or
     * whether the sticky states have changed for the header or footer. If there is a diff, then
     * re-render that section.
     * @private
     * @return {?}
     */
    _renderUpdatedColumns() {
        /** @type {?} */
        const columnsDiffReducer = (/**
         * @param {?} acc
         * @param {?} def
         * @return {?}
         */
        (acc, def) => acc || !!def.getColumnsDiff());
        // Force re-render data rows if the list of column definitions have changed.
        if (this._rowDefs.reduce(columnsDiffReducer, false)) {
            this._forceRenderDataRows();
        }
        // Force re-render header/footer rows if the list of column definitions have changed..
        if (this._headerRowDefs.reduce(columnsDiffReducer, false)) {
            this._forceRenderHeaderRows();
        }
        if (this._footerRowDefs.reduce(columnsDiffReducer, false)) {
            this._forceRenderFooterRows();
        }
    }
    /**
     * Switch to the provided data source by resetting the data and unsubscribing from the current
     * render change subscription if one exists. If the data source is null, interpret this by
     * clearing the row outlet. Otherwise start listening for new data.
     * @private
     * @param {?} dataSource
     * @return {?}
     */
    _switchDataSource(dataSource) {
        this._data = [];
        if (isDataSource(this.dataSource)) {
            this.dataSource.disconnect(this);
        }
        // Stop listening for data from the previous data source.
        if (this._renderChangeSubscription) {
            this._renderChangeSubscription.unsubscribe();
            this._renderChangeSubscription = null;
        }
        if (!dataSource) {
            if (this._dataDiffer) {
                this._dataDiffer.diff([]);
            }
            this._rowOutlet.viewContainer.clear();
        }
        this._dataSource = dataSource;
    }
    /**
     * Set up a subscription for the data provided by the data source.
     * @private
     * @return {?}
     */
    _observeRenderChanges() {
        // If no data source has been set, there is nothing to observe for changes.
        if (!this.dataSource) {
            return;
        }
        /** @type {?} */
        let dataStream;
        if (isDataSource(this.dataSource)) {
            dataStream = this.dataSource.connect(this);
        }
        else if (isObservable(this.dataSource)) {
            dataStream = this.dataSource;
        }
        else if (Array.isArray(this.dataSource)) {
            dataStream = observableOf(this.dataSource);
        }
        if (dataStream === undefined) {
            throw getTableUnknownDataSourceError();
        }
        this._renderChangeSubscription = dataStream.pipe(takeUntil(this._onDestroy)).subscribe((/**
         * @param {?} data
         * @return {?}
         */
        data => {
            this._data = data || [];
            this.renderRows();
        }));
    }
    /**
     * Clears any existing content in the header row outlet and creates a new embedded view
     * in the outlet using the header row definition.
     * @private
     * @return {?}
     */
    _forceRenderHeaderRows() {
        // Clear the header row outlet if any content exists.
        if (this._headerRowOutlet.viewContainer.length > 0) {
            this._headerRowOutlet.viewContainer.clear();
        }
        this._headerRowDefs.forEach((/**
         * @param {?} def
         * @param {?} i
         * @return {?}
         */
        (def, i) => this._renderRow(this._headerRowOutlet, def, i)));
        this.updateStickyHeaderRowStyles();
        this.updateStickyColumnStyles();
    }
    /**
     * Clears any existing content in the footer row outlet and creates a new embedded view
     * in the outlet using the footer row definition.
     * @private
     * @return {?}
     */
    _forceRenderFooterRows() {
        // Clear the footer row outlet if any content exists.
        if (this._footerRowOutlet.viewContainer.length > 0) {
            this._footerRowOutlet.viewContainer.clear();
        }
        this._footerRowDefs.forEach((/**
         * @param {?} def
         * @param {?} i
         * @return {?}
         */
        (def, i) => this._renderRow(this._footerRowOutlet, def, i)));
        this.updateStickyFooterRowStyles();
        this.updateStickyColumnStyles();
    }
    /**
     * Adds the sticky column styles for the rows according to the columns' stick states.
     * @private
     * @param {?} rows
     * @param {?} rowDef
     * @return {?}
     */
    _addStickyColumnStyles(rows, rowDef) {
        /** @type {?} */
        const columnDefs = Array.from(rowDef.columns || []).map((/**
         * @param {?} columnName
         * @return {?}
         */
        columnName => {
            /** @type {?} */
            const columnDef = this._columnDefsByName.get(columnName);
            if (!columnDef) {
                throw getTableUnknownColumnError(columnName);
            }
            return (/** @type {?} */ (columnDef));
        }));
        /** @type {?} */
        const stickyStartStates = columnDefs.map((/**
         * @param {?} columnDef
         * @return {?}
         */
        columnDef => columnDef.sticky));
        /** @type {?} */
        const stickyEndStates = columnDefs.map((/**
         * @param {?} columnDef
         * @return {?}
         */
        columnDef => columnDef.stickyEnd));
        this._stickyStyler.updateStickyColumns(rows, stickyStartStates, stickyEndStates);
    }
    /**
     * Gets the list of rows that have been rendered in the row outlet.
     * @param {?} rowOutlet
     * @return {?}
     */
    _getRenderedRows(rowOutlet) {
        /** @type {?} */
        const renderedRows = [];
        for (let i = 0; i < rowOutlet.viewContainer.length; i++) {
            /** @type {?} */
            const viewRef = ((/** @type {?} */ ((/** @type {?} */ (rowOutlet.viewContainer.get(i))))));
            renderedRows.push(viewRef.rootNodes[0]);
        }
        return renderedRows;
    }
    /**
     * Get the matching row definitions that should be used for this row data. If there is only
     * one row definition, it is returned. Otherwise, find the row definitions that has a when
     * predicate that returns true with the data. If none return true, return the default row
     * definition.
     * @param {?} data
     * @param {?} dataIndex
     * @return {?}
     */
    _getRowDefs(data, dataIndex) {
        if (this._rowDefs.length == 1) {
            return [this._rowDefs[0]];
        }
        /** @type {?} */
        let rowDefs = [];
        if (this.multiTemplateDataRows) {
            rowDefs = this._rowDefs.filter((/**
             * @param {?} def
             * @return {?}
             */
            def => !def.when || def.when(dataIndex, data)));
        }
        else {
            /** @type {?} */
            let rowDef = this._rowDefs.find((/**
             * @param {?} def
             * @return {?}
             */
            def => def.when && def.when(dataIndex, data))) || this._defaultRowDef;
            if (rowDef) {
                rowDefs.push(rowDef);
            }
        }
        if (!rowDefs.length) {
            throw getTableMissingMatchingRowDefError(data);
        }
        return rowDefs;
    }
    /**
     * Create the embedded view for the data row template and place it in the correct index location
     * within the data row view container.
     * @private
     * @param {?} renderRow
     * @param {?} renderIndex
     * @return {?}
     */
    _insertRow(renderRow, renderIndex) {
        /** @type {?} */
        const rowDef = renderRow.rowDef;
        /** @type {?} */
        const context = { $implicit: renderRow.data };
        this._renderRow(this._rowOutlet, rowDef, renderIndex, context);
    }
    /**
     * Creates a new row template in the outlet and fills it with the set of cell templates.
     * Optionally takes a context to provide to the row and cells, as well as an optional index
     * of where to place the new row template in the outlet.
     * @private
     * @param {?} outlet
     * @param {?} rowDef
     * @param {?} index
     * @param {?=} context
     * @return {?}
     */
    _renderRow(outlet, rowDef, index, context = {}) {
        // TODO(andrewseguin): enforce that one outlet was instantiated from createEmbeddedView
        outlet.viewContainer.createEmbeddedView(rowDef.template, context, index);
        for (let cellTemplate of this._getCellTemplates(rowDef)) {
            if (CdkCellOutlet.mostRecentCellOutlet) {
                CdkCellOutlet.mostRecentCellOutlet._viewContainer.createEmbeddedView(cellTemplate, context);
            }
        }
        this._changeDetectorRef.markForCheck();
    }
    /**
     * Updates the index-related context for each row to reflect any changes in the index of the rows,
     * e.g. first/last/even/odd.
     * @private
     * @return {?}
     */
    _updateRowIndexContext() {
        /** @type {?} */
        const viewContainer = this._rowOutlet.viewContainer;
        for (let renderIndex = 0, count = viewContainer.length; renderIndex < count; renderIndex++) {
            /** @type {?} */
            const viewRef = (/** @type {?} */ (viewContainer.get(renderIndex)));
            /** @type {?} */
            const context = (/** @type {?} */ (viewRef.context));
            context.count = count;
            context.first = renderIndex === 0;
            context.last = renderIndex === count - 1;
            context.even = renderIndex % 2 === 0;
            context.odd = !context.even;
            if (this.multiTemplateDataRows) {
                context.dataIndex = this._renderRows[renderIndex].dataIndex;
                context.renderIndex = renderIndex;
            }
            else {
                context.index = this._renderRows[renderIndex].dataIndex;
            }
        }
    }
    /**
     * Gets the column definitions for the provided row def.
     * @private
     * @param {?} rowDef
     * @return {?}
     */
    _getCellTemplates(rowDef) {
        if (!rowDef || !rowDef.columns) {
            return [];
        }
        return Array.from(rowDef.columns, (/**
         * @param {?} columnId
         * @return {?}
         */
        columnId => {
            /** @type {?} */
            const column = this._columnDefsByName.get(columnId);
            if (!column) {
                throw getTableUnknownColumnError(columnId);
            }
            return rowDef.extractCellTemplate(column);
        }));
    }
    /**
     * Adds native table sections (e.g. tbody) and moves the row outlets into them.
     * @private
     * @return {?}
     */
    _applyNativeTableSections() {
        /** @type {?} */
        const documentFragment = this._document.createDocumentFragment();
        /** @type {?} */
        const sections = [
            { tag: 'thead', outlets: [this._headerRowOutlet] },
            { tag: 'tbody', outlets: [this._rowOutlet, this._noDataRowOutlet] },
            { tag: 'tfoot', outlets: [this._footerRowOutlet] },
        ];
        for (const section of sections) {
            /** @type {?} */
            const element = this._document.createElement(section.tag);
            element.setAttribute('role', 'rowgroup');
            for (const outlet of section.outlets) {
                element.appendChild(outlet.elementRef.nativeElement);
            }
            documentFragment.appendChild(element);
        }
        // Use a DocumentFragment so we don't hit the DOM on each iteration.
        this._elementRef.nativeElement.appendChild(documentFragment);
    }
    /**
     * Forces a re-render of the data rows. Should be called in cases where there has been an input
     * change that affects the evaluation of which rows should be rendered, e.g. toggling
     * `multiTemplateDataRows` or adding/removing row definitions.
     * @private
     * @return {?}
     */
    _forceRenderDataRows() {
        this._dataDiffer.diff([]);
        this._rowOutlet.viewContainer.clear();
        this.renderRows();
        this.updateStickyColumnStyles();
    }
    /**
     * Checks if there has been a change in sticky states since last check and applies the correct
     * sticky styles. Since checking resets the "dirty" state, this should only be performed once
     * during a change detection and after the inputs are settled (after content check).
     * @private
     * @return {?}
     */
    _checkStickyStates() {
        /** @type {?} */
        const stickyCheckReducer = (/**
         * @param {?} acc
         * @param {?} d
         * @return {?}
         */
        (acc, d) => {
            return acc || d.hasStickyChanged();
        });
        // Note that the check needs to occur for every definition since it notifies the definition
        // that it can reset its dirty state. Using another operator like `some` may short-circuit
        // remaining definitions and leave them in an unchecked state.
        if (this._headerRowDefs.reduce(stickyCheckReducer, false)) {
            this.updateStickyHeaderRowStyles();
        }
        if (this._footerRowDefs.reduce(stickyCheckReducer, false)) {
            this.updateStickyFooterRowStyles();
        }
        if (Array.from(this._columnDefsByName.values()).reduce(stickyCheckReducer, false)) {
            this.updateStickyColumnStyles();
        }
    }
    /**
     * Creates the sticky styler that will be used for sticky rows and columns. Listens
     * for directionality changes and provides the latest direction to the styler. Re-applies column
     * stickiness when directionality changes.
     * @private
     * @return {?}
     */
    _setupStickyStyler() {
        /** @type {?} */
        const direction = this._dir ? this._dir.value : 'ltr';
        this._stickyStyler = new StickyStyler(this._isNativeHtmlTable, this.stickyCssClass, direction, this._platform.isBrowser);
        (this._dir ? this._dir.change : observableOf())
            .pipe(takeUntil(this._onDestroy))
            .subscribe((/**
         * @param {?} value
         * @return {?}
         */
        value => {
            this._stickyStyler.direction = value;
            this.updateStickyColumnStyles();
        }));
    }
    /**
     * Filters definitions that belong to this table from a QueryList.
     * @private
     * @template I
     * @param {?} items
     * @return {?}
     */
    _getOwnDefs(items) {
        return items.filter((/**
         * @param {?} item
         * @return {?}
         */
        item => !item._table || item._table === this));
    }
    /**
     * Creates or removes the no data row, depending on whether any data is being shown.
     * @private
     * @return {?}
     */
    _updateNoDataRow() {
        if (this._noDataRow) {
            /** @type {?} */
            const shouldShow = this._rowOutlet.viewContainer.length === 0;
            if (shouldShow !== this._isShowingNoDataRow) {
                /** @type {?} */
                const container = this._noDataRowOutlet.viewContainer;
                shouldShow ? container.createEmbeddedView(this._noDataRow.templateRef) : container.clear();
                this._isShowingNoDataRow = shouldShow;
            }
        }
    }
}
CdkTable.decorators = [
    { type: Component, args: [{
                selector: 'cdk-table, table[cdk-table]',
                exportAs: 'cdkTable',
                template: CDK_TABLE_TEMPLATE,
                host: {
                    'class': 'cdk-table',
                },
                encapsulation: ViewEncapsulation.None,
                // The "OnPush" status for the `MatTable` component is effectively a noop, so we are removing it.
                // The view for `MatTable` consists entirely of templates declared in other views. As they are
                // declared elsewhere, they are checked when their declaration points are checked.
                // tslint:disable-next-line:validate-decorators
                changeDetection: ChangeDetectionStrategy.Default,
                providers: [{ provide: CDK_TABLE, useExisting: CdkTable }]
            }] }
];
/** @nocollapse */
CdkTable.ctorParameters = () => [
    { type: IterableDiffers },
    { type: ChangeDetectorRef },
    { type: ElementRef },
    { type: String, decorators: [{ type: Attribute, args: ['role',] }] },
    { type: Directionality, decorators: [{ type: Optional }] },
    { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] },
    { type: Platform }
];
CdkTable.propDecorators = {
    trackBy: [{ type: Input }],
    dataSource: [{ type: Input }],
    multiTemplateDataRows: [{ type: Input }],
    _rowOutlet: [{ type: ViewChild, args: [DataRowOutlet, { static: true },] }],
    _headerRowOutlet: [{ type: ViewChild, args: [HeaderRowOutlet, { static: true },] }],
    _footerRowOutlet: [{ type: ViewChild, args: [FooterRowOutlet, { static: true },] }],
    _noDataRowOutlet: [{ type: ViewChild, args: [NoDataRowOutlet, { static: true },] }],
    _contentColumnDefs: [{ type: ContentChildren, args: [CdkColumnDef, { descendants: true },] }],
    _contentRowDefs: [{ type: ContentChildren, args: [CdkRowDef, { descendants: true },] }],
    _contentHeaderRowDefs: [{ type: ContentChildren, args: [CdkHeaderRowDef, {
                    descendants: true
                },] }],
    _contentFooterRowDefs: [{ type: ContentChildren, args: [CdkFooterRowDef, {
                    descendants: true
                },] }],
    _noDataRow: [{ type: ContentChild, args: [CdkNoDataRow,] }]
};
if (false) {
    /** @type {?} */
    CdkTable.ngAcceptInputType_multiTemplateDataRows;
    /**
     * @type {?}
     * @private
     */
    CdkTable.prototype._document;
    /**
     * Latest data provided by the data source.
     * @type {?}
     * @protected
     */
    CdkTable.prototype._data;
    /**
     * Subject that emits when the component has been destroyed.
     * @type {?}
     * @private
     */
    CdkTable.prototype._onDestroy;
    /**
     * List of the rendered rows as identified by their `RenderRow` object.
     * @type {?}
     * @private
     */
    CdkTable.prototype._renderRows;
    /**
     * Subscription that listens for the data provided by the data source.
     * @type {?}
     * @private
     */
    CdkTable.prototype._renderChangeSubscription;
    /**
     * Map of all the user's defined columns (header, data, and footer cell template) identified by
     * name. Collection populated by the column definitions gathered by `ContentChildren` as well as
     * any custom column definitions added to `_customColumnDefs`.
     * @type {?}
     * @private
     */
    CdkTable.prototype._columnDefsByName;
    /**
     * Set of all row definitions that can be used by this table. Populated by the rows gathered by
     * using `ContentChildren` as well as any custom row definitions added to `_customRowDefs`.
     * @type {?}
     * @private
     */
    CdkTable.prototype._rowDefs;
    /**
     * Set of all header row definitions that can be used by this table. Populated by the rows
     * gathered by using `ContentChildren` as well as any custom row definitions added to
     * `_customHeaderRowDefs`.
     * @type {?}
     * @private
     */
    CdkTable.prototype._headerRowDefs;
    /**
     * Set of all row definitions that can be used by this table. Populated by the rows gathered by
     * using `ContentChildren` as well as any custom row definitions added to
     * `_customFooterRowDefs`.
     * @type {?}
     * @private
     */
    CdkTable.prototype._footerRowDefs;
    /**
     * Differ used to find the changes in the data provided by the data source.
     * @type {?}
     * @private
     */
    CdkTable.prototype._dataDiffer;
    /**
     * Stores the row definition that does not have a when predicate.
     * @type {?}
     * @private
     */
    CdkTable.prototype._defaultRowDef;
    /**
     * Column definitions that were defined outside of the direct content children of the table.
     * These will be defined when, e.g., creating a wrapper around the cdkTable that has
     * column definitions as *its* content child.
     * @type {?}
     * @private
     */
    CdkTable.prototype._customColumnDefs;
    /**
     * Data row definitions that were defined outside of the direct content children of the table.
     * These will be defined when, e.g., creating a wrapper around the cdkTable that has
     * built-in data rows as *its* content child.
     * @type {?}
     * @private
     */
    CdkTable.prototype._customRowDefs;
    /**
     * Header row definitions that were defined outside of the direct content children of the table.
     * These will be defined when, e.g., creating a wrapper around the cdkTable that has
     * built-in header rows as *its* content child.
     * @type {?}
     * @private
     */
    CdkTable.prototype._customHeaderRowDefs;
    /**
     * Footer row definitions that were defined outside of the direct content children of the table.
     * These will be defined when, e.g., creating a wrapper around the cdkTable that has a
     * built-in footer row as *its* content child.
     * @type {?}
     * @private
     */
    CdkTable.prototype._customFooterRowDefs;
    /**
     * Whether the header row definition has been changed. Triggers an update to the header row after
     * content is checked. Initialized as true so that the table renders the initial set of rows.
     * @type {?}
     * @private
     */
    CdkTable.prototype._headerRowDefChanged;
    /**
     * Whether the footer row definition has been changed. Triggers an update to the footer row after
     * content is checked. Initialized as true so that the table renders the initial set of rows.
     * @type {?}
     * @private
     */
    CdkTable.prototype._footerRowDefChanged;
    /**
     * Cache of the latest rendered `RenderRow` objects as a map for easy retrieval when constructing
     * a new list of `RenderRow` objects for rendering rows. Since the new list is constructed with
     * the cached `RenderRow` objects when possible, the row identity is preserved when the data
     * and row template matches, which allows the `IterableDiffer` to check rows by reference
     * and understand which rows are added/moved/removed.
     *
     * Implemented as a map of maps where the first key is the `data: T` object and the second is the
     * `CdkRowDef<T>` object. With the two keys, the cache points to a `RenderRow<T>` object that
     * contains an array of created pairs. The array is necessary to handle cases where the data
     * array contains multiple duplicate data objects and each instantiated `RenderRow` must be
     * stored.
     * @type {?}
     * @private
     */
    CdkTable.prototype._cachedRenderRowsMap;
    /**
     * Whether the table is applied to a native `<table>`.
     * @type {?}
     * @private
     */
    CdkTable.prototype._isNativeHtmlTable;
    /**
     * Utility class that is responsible for applying the appropriate sticky positioning styles to
     * the table's rows and cells.
     * @type {?}
     * @private
     */
    CdkTable.prototype._stickyStyler;
    /**
     * CSS class added to any row or cell that has sticky positioning applied. May be overriden by
     * table subclasses.
     * @type {?}
     * @protected
     */
    CdkTable.prototype.stickyCssClass;
    /**
     * Whether the no data row is currently showing anything.
     * @type {?}
     * @private
     */
    CdkTable.prototype._isShowingNoDataRow;
    /**
     * @type {?}
     * @private
     */
    CdkTable.prototype._trackByFn;
    /**
     * @type {?}
     * @private
     */
    CdkTable.prototype._dataSource;
    /** @type {?} */
    CdkTable.prototype._multiTemplateDataRows;
    /**
     * Stream containing the latest information on what rows are being displayed on screen.
     * Can be used by the data source to as a heuristic of what data should be provided.
     *
     * \@docs-private
     * @type {?}
     */
    CdkTable.prototype.viewChange;
    /** @type {?} */
    CdkTable.prototype._rowOutlet;
    /** @type {?} */
    CdkTable.prototype._headerRowOutlet;
    /** @type {?} */
    CdkTable.prototype._footerRowOutlet;
    /** @type {?} */
    CdkTable.prototype._noDataRowOutlet;
    /**
     * The column definitions provided by the user that contain what the header, data, and footer
     * cells should render for each column.
     * @type {?}
     */
    CdkTable.prototype._contentColumnDefs;
    /**
     * Set of data row definitions that were provided to the table as content children.
     * @type {?}
     */
    CdkTable.prototype._contentRowDefs;
    /**
     * Set of header row definitions that were provided to the table as content children.
     * @type {?}
     */
    CdkTable.prototype._contentHeaderRowDefs;
    /**
     * Set of footer row definitions that were provided to the table as content children.
     * @type {?}
     */
    CdkTable.prototype._contentFooterRowDefs;
    /**
     * Row definition that will only be rendered if there's no data in the table.
     * @type {?}
     */
    CdkTable.prototype._noDataRow;
    /**
     * @type {?}
     * @protected
     */
    CdkTable.prototype._differs;
    /**
     * @type {?}
     * @protected
     */
    CdkTable.prototype._changeDetectorRef;
    /**
     * @type {?}
     * @protected
     */
    CdkTable.prototype._elementRef;
    /**
     * @type {?}
     * @protected
     */
    CdkTable.prototype._dir;
    /**
     * @type {?}
     * @private
     */
    CdkTable.prototype._platform;
}
/**
 * Utility function that gets a merged list of the entries in an array and values of a Set.
 * @template T
 * @param {?} array
 * @param {?} set
 * @return {?}
 */
function mergeArrayAndSet(array, set) {
    return array.concat(Array.from(set));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RhYmxlL3RhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBWSxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM1RCxPQUFPLEVBQWUscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRSxPQUFPLEVBQStCLFlBQVksRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ3BGLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUVMLFNBQVMsRUFDVCx1QkFBdUIsRUFDdkIsaUJBQWlCLEVBQ2pCLFNBQVMsRUFDVCxlQUFlLEVBQ2YsU0FBUyxFQUNULFVBQVUsRUFDVixlQUFlLEVBQ2YsTUFBTSxFQUNOLEtBQUssRUFDTCxTQUFTLEVBR1QsZUFBZSxFQUdmLFFBQVEsRUFDUixTQUFTLEVBR1QsU0FBUyxFQUNULGdCQUFnQixFQUNoQixpQkFBaUIsRUFDakIsWUFBWSxFQUNiLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFDTCxlQUFlLEVBRWYsRUFBRSxJQUFJLFlBQVksRUFDbEIsT0FBTyxFQUVQLFlBQVksR0FDYixNQUFNLE1BQU0sQ0FBQztBQUNkLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6QyxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQ3BDLE9BQU8sRUFFTCxhQUFhLEVBR2IsZUFBZSxFQUNmLGVBQWUsRUFDZixTQUFTLEVBQ1QsWUFBWSxFQUNiLE1BQU0sT0FBTyxDQUFDO0FBQ2YsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQzdDLE9BQU8sRUFDTCxnQ0FBZ0MsRUFDaEMsa0NBQWtD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QkFBb0M7Ozs7OztJQUdwQyw2Q0FBcUQ7Ozs7Ozs7O0lBT3JELHFDQUE0RDs7Ozs7OztJQU01RCw0QkFBaUM7Ozs7Ozs7O0lBT2pDLGtDQUEwQzs7Ozs7Ozs7SUFPMUMsa0NBQTBDOzs7Ozs7SUFHMUMsK0JBQWtEOzs7Ozs7SUFHbEQsa0NBQTBDOzs7Ozs7OztJQU8xQyxxQ0FBb0Q7Ozs7Ozs7O0lBT3BELGtDQUFpRDs7Ozs7Ozs7SUFPakQsd0NBQTBEOzs7Ozs7OztJQU8xRCx3Q0FBMEQ7Ozs7Ozs7SUFNMUQsd0NBQW9DOzs7Ozs7O0lBTXBDLHdDQUFvQzs7Ozs7Ozs7Ozs7Ozs7OztJQWVwQyx3Q0FBbUY7Ozs7OztJQUduRixzQ0FBb0M7Ozs7Ozs7SUFNcEMsaUNBQW9DOzs7Ozs7O0lBTXBDLGtDQUFzRDs7Ozs7O0lBR3RELHVDQUFvQzs7Ozs7SUFtQnBDLDhCQUF1Qzs7Ozs7SUErQnZDLCtCQUFnRDs7SUFxQmhELDBDQUF3Qzs7Ozs7Ozs7SUFVeEMsOEJBQ3lGOztJQUd6Riw4QkFBb0U7O0lBQ3BFLG9DQUE4RTs7SUFDOUUsb0NBQThFOztJQUM5RSxvQ0FBOEU7Ozs7OztJQU05RSxzQ0FBZ0c7Ozs7O0lBR2hHLG1DQUEwRjs7Ozs7SUFHMUYseUNBRXFEOzs7OztJQUdyRCx5Q0FFcUQ7Ozs7O0lBR3JELDhCQUFxRDs7Ozs7SUFHakQsNEJBQTRDOzs7OztJQUM1QyxzQ0FBd0Q7Ozs7O0lBQ3hELCtCQUEwQzs7Ozs7SUFDMUMsd0JBQW1EOzs7OztJQUNuRCw2QkFBMkI7Ozs7Ozs7OztBQXlzQmpDLFNBQVMsZ0JBQWdCLENBQUksS0FBVSxFQUFFLEdBQVc7SUFDbEQsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN2QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aW9uLCBEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtCb29sZWFuSW5wdXQsIGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7Q29sbGVjdGlvblZpZXdlciwgRGF0YVNvdXJjZSwgaXNEYXRhU291cmNlfSBmcm9tICdAYW5ndWxhci9jZGsvY29sbGVjdGlvbnMnO1xuaW1wb3J0IHtQbGF0Zm9ybX0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge1xuICBBZnRlckNvbnRlbnRDaGVja2VkLFxuICBBdHRyaWJ1dGUsXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBDb250ZW50Q2hpbGRyZW4sXG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgRW1iZWRkZWRWaWV3UmVmLFxuICBJbmplY3QsXG4gIElucHV0LFxuICBpc0Rldk1vZGUsXG4gIEl0ZXJhYmxlQ2hhbmdlUmVjb3JkLFxuICBJdGVyYWJsZURpZmZlcixcbiAgSXRlcmFibGVEaWZmZXJzLFxuICBPbkRlc3Ryb3ksXG4gIE9uSW5pdCxcbiAgT3B0aW9uYWwsXG4gIFF1ZXJ5TGlzdCxcbiAgVGVtcGxhdGVSZWYsXG4gIFRyYWNrQnlGdW5jdGlvbixcbiAgVmlld0NoaWxkLFxuICBWaWV3Q29udGFpbmVyUmVmLFxuICBWaWV3RW5jYXBzdWxhdGlvbixcbiAgQ29udGVudENoaWxkXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtcbiAgQmVoYXZpb3JTdWJqZWN0LFxuICBPYnNlcnZhYmxlLFxuICBvZiBhcyBvYnNlcnZhYmxlT2YsXG4gIFN1YmplY3QsXG4gIFN1YnNjcmlwdGlvbixcbiAgaXNPYnNlcnZhYmxlLFxufSBmcm9tICdyeGpzJztcbmltcG9ydCB7dGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge0Nka0NvbHVtbkRlZn0gZnJvbSAnLi9jZWxsJztcbmltcG9ydCB7XG4gIEJhc2VSb3dEZWYsXG4gIENka0NlbGxPdXRsZXQsXG4gIENka0NlbGxPdXRsZXRNdWx0aVJvd0NvbnRleHQsXG4gIENka0NlbGxPdXRsZXRSb3dDb250ZXh0LFxuICBDZGtGb290ZXJSb3dEZWYsXG4gIENka0hlYWRlclJvd0RlZixcbiAgQ2RrUm93RGVmLFxuICBDZGtOb0RhdGFSb3dcbn0gZnJvbSAnLi9yb3cnO1xuaW1wb3J0IHtTdGlja3lTdHlsZXJ9IGZyb20gJy4vc3RpY2t5LXN0eWxlcic7XG5pbXBvcnQge1xuICBnZXRUYWJsZUR1cGxpY2F0ZUNvbHVtbk5hbWVFcnJvcixcbiAgZ2V0VGFibGVNaXNzaW5nTWF0Y2hpbmdSb3dEZWZFcnJvcixcbiAgZ2V0VGFibGVNaXNzaW5nUm93RGVmc0Vycm9yLFxuICBnZXRUYWJsZU11bHRpcGxlRGVmYXVsdFJvd0RlZnNFcnJvcixcbiAgZ2V0VGFibGVVbmtub3duQ29sdW1uRXJyb3IsXG4gIGdldFRhYmxlVW5rbm93bkRhdGFTb3VyY2VFcnJvclxufSBmcm9tICcuL3RhYmxlLWVycm9ycyc7XG5pbXBvcnQge0NES19UQUJMRX0gZnJvbSAnLi90b2tlbnMnO1xuXG4vKiogSW50ZXJmYWNlIHVzZWQgdG8gcHJvdmlkZSBhbiBvdXRsZXQgZm9yIHJvd3MgdG8gYmUgaW5zZXJ0ZWQgaW50by4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUm93T3V0bGV0IHtcbiAgdmlld0NvbnRhaW5lcjogVmlld0NvbnRhaW5lclJlZjtcbn1cblxuLyoqXG4gKiBVbmlvbiBvZiB0aGUgdHlwZXMgdGhhdCBjYW4gYmUgc2V0IGFzIHRoZSBkYXRhIHNvdXJjZSBmb3IgYSBgQ2RrVGFibGVgLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG50eXBlIENka1RhYmxlRGF0YVNvdXJjZUlucHV0PFQ+ID1cbiAgICBEYXRhU291cmNlPFQ+fE9ic2VydmFibGU8UmVhZG9ubHlBcnJheTxUPnxUW10+fFJlYWRvbmx5QXJyYXk8VD58VFtdO1xuXG4vKipcbiAqIFByb3ZpZGVzIGEgaGFuZGxlIGZvciB0aGUgdGFibGUgdG8gZ3JhYiB0aGUgdmlldyBjb250YWluZXIncyBuZy1jb250YWluZXIgdG8gaW5zZXJ0IGRhdGEgcm93cy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuQERpcmVjdGl2ZSh7c2VsZWN0b3I6ICdbcm93T3V0bGV0XSd9KVxuZXhwb3J0IGNsYXNzIERhdGFSb3dPdXRsZXQgaW1wbGVtZW50cyBSb3dPdXRsZXQge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgdmlld0NvbnRhaW5lcjogVmlld0NvbnRhaW5lclJlZiwgcHVibGljIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHt9XG59XG5cbi8qKlxuICogUHJvdmlkZXMgYSBoYW5kbGUgZm9yIHRoZSB0YWJsZSB0byBncmFiIHRoZSB2aWV3IGNvbnRhaW5lcidzIG5nLWNvbnRhaW5lciB0byBpbnNlcnQgdGhlIGhlYWRlci5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuQERpcmVjdGl2ZSh7c2VsZWN0b3I6ICdbaGVhZGVyUm93T3V0bGV0XSd9KVxuZXhwb3J0IGNsYXNzIEhlYWRlclJvd091dGxldCBpbXBsZW1lbnRzIFJvd091dGxldCB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyB2aWV3Q29udGFpbmVyOiBWaWV3Q29udGFpbmVyUmVmLCBwdWJsaWMgZWxlbWVudFJlZjogRWxlbWVudFJlZikge31cbn1cblxuLyoqXG4gKiBQcm92aWRlcyBhIGhhbmRsZSBmb3IgdGhlIHRhYmxlIHRvIGdyYWIgdGhlIHZpZXcgY29udGFpbmVyJ3MgbmctY29udGFpbmVyIHRvIGluc2VydCB0aGUgZm9vdGVyLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5ARGlyZWN0aXZlKHtzZWxlY3RvcjogJ1tmb290ZXJSb3dPdXRsZXRdJ30pXG5leHBvcnQgY2xhc3MgRm9vdGVyUm93T3V0bGV0IGltcGxlbWVudHMgUm93T3V0bGV0IHtcbiAgY29uc3RydWN0b3IocHVibGljIHZpZXdDb250YWluZXI6IFZpZXdDb250YWluZXJSZWYsIHB1YmxpYyBlbGVtZW50UmVmOiBFbGVtZW50UmVmKSB7fVxufVxuXG4vKipcbiAqIFByb3ZpZGVzIGEgaGFuZGxlIGZvciB0aGUgdGFibGUgdG8gZ3JhYiB0aGUgdmlld1xuICogY29udGFpbmVyJ3MgbmctY29udGFpbmVyIHRvIGluc2VydCB0aGUgbm8gZGF0YSByb3cuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbkBEaXJlY3RpdmUoe3NlbGVjdG9yOiAnW25vRGF0YVJvd091dGxldF0nfSlcbmV4cG9ydCBjbGFzcyBOb0RhdGFSb3dPdXRsZXQgaW1wbGVtZW50cyBSb3dPdXRsZXQge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgdmlld0NvbnRhaW5lcjogVmlld0NvbnRhaW5lclJlZiwgcHVibGljIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHt9XG59XG5cbi8qKlxuICogVGhlIHRhYmxlIHRlbXBsYXRlIHRoYXQgY2FuIGJlIHVzZWQgYnkgdGhlIG1hdC10YWJsZS4gU2hvdWxkIG5vdCBiZSB1c2VkIG91dHNpZGUgb2YgdGhlXG4gKiBtYXRlcmlhbCBsaWJyYXJ5LlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgY29uc3QgQ0RLX1RBQkxFX1RFTVBMQVRFID1cbiAgICAvLyBOb3RlIHRoYXQgYWNjb3JkaW5nIHRvIE1ETiwgdGhlIGBjYXB0aW9uYCBlbGVtZW50IGhhcyB0byBiZSBwcm9qZWN0ZWQgYXMgdGhlICoqZmlyc3QqKlxuICAgIC8vIGVsZW1lbnQgaW4gdGhlIHRhYmxlLiBTZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRNTC9FbGVtZW50L2NhcHRpb25cbiAgICBgXG4gIDxuZy1jb250ZW50IHNlbGVjdD1cImNhcHRpb25cIj48L25nLWNvbnRlbnQ+XG4gIDxuZy1jb250ZW50IHNlbGVjdD1cImNvbGdyb3VwLCBjb2xcIj48L25nLWNvbnRlbnQ+XG4gIDxuZy1jb250YWluZXIgaGVhZGVyUm93T3V0bGV0PjwvbmctY29udGFpbmVyPlxuICA8bmctY29udGFpbmVyIHJvd091dGxldD48L25nLWNvbnRhaW5lcj5cbiAgPG5nLWNvbnRhaW5lciBub0RhdGFSb3dPdXRsZXQ+PC9uZy1jb250YWluZXI+XG4gIDxuZy1jb250YWluZXIgZm9vdGVyUm93T3V0bGV0PjwvbmctY29udGFpbmVyPlxuYDtcblxuLyoqXG4gKiBJbnRlcmZhY2UgdXNlZCB0byBjb252ZW5pZW50bHkgdHlwZSB0aGUgcG9zc2libGUgY29udGV4dCBpbnRlcmZhY2VzIGZvciB0aGUgcmVuZGVyIHJvdy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSb3dDb250ZXh0PFQ+IGV4dGVuZHMgQ2RrQ2VsbE91dGxldE11bHRpUm93Q29udGV4dDxUPixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIENka0NlbGxPdXRsZXRSb3dDb250ZXh0PFQ+IHt9XG5cbi8qKlxuICogQ2xhc3MgdXNlZCB0byBjb252ZW5pZW50bHkgdHlwZSB0aGUgZW1iZWRkZWQgdmlldyByZWYgZm9yIHJvd3Mgd2l0aCBhIGNvbnRleHQuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmFic3RyYWN0IGNsYXNzIFJvd1ZpZXdSZWY8VD4gZXh0ZW5kcyBFbWJlZGRlZFZpZXdSZWY8Um93Q29udGV4dDxUPj4ge31cblxuLyoqXG4gKiBTZXQgb2YgcHJvcGVydGllcyB0aGF0IHJlcHJlc2VudHMgdGhlIGlkZW50aXR5IG9mIGEgc2luZ2xlIHJlbmRlcmVkIHJvdy5cbiAqXG4gKiBXaGVuIHRoZSB0YWJsZSBuZWVkcyB0byBkZXRlcm1pbmUgdGhlIGxpc3Qgb2Ygcm93cyB0byByZW5kZXIsIGl0IHdpbGwgZG8gc28gYnkgaXRlcmF0aW5nIHRocm91Z2hcbiAqIGVhY2ggZGF0YSBvYmplY3QgYW5kIGV2YWx1YXRpbmcgaXRzIGxpc3Qgb2Ygcm93IHRlbXBsYXRlcyB0byBkaXNwbGF5ICh3aGVuIG11bHRpVGVtcGxhdGVEYXRhUm93c1xuICogaXMgZmFsc2UsIHRoZXJlIGlzIG9ubHkgb25lIHRlbXBsYXRlIHBlciBkYXRhIG9iamVjdCkuIEZvciBlYWNoIHBhaXIgb2YgZGF0YSBvYmplY3QgYW5kIHJvd1xuICogdGVtcGxhdGUsIGEgYFJlbmRlclJvd2AgaXMgYWRkZWQgdG8gdGhlIGxpc3Qgb2Ygcm93cyB0byByZW5kZXIuIElmIHRoZSBkYXRhIG9iamVjdCBhbmQgcm93XG4gKiB0ZW1wbGF0ZSBwYWlyIGhhcyBhbHJlYWR5IGJlZW4gcmVuZGVyZWQsIHRoZSBwcmV2aW91c2x5IHVzZWQgYFJlbmRlclJvd2AgaXMgYWRkZWQ7IGVsc2UgYSBuZXdcbiAqIGBSZW5kZXJSb3dgIGlzICogY3JlYXRlZC4gT25jZSB0aGUgbGlzdCBpcyBjb21wbGV0ZSBhbmQgYWxsIGRhdGEgb2JqZWN0cyBoYXZlIGJlZW4gaXRlcmVhdGVkXG4gKiB0aHJvdWdoLCBhIGRpZmYgaXMgcGVyZm9ybWVkIHRvIGRldGVybWluZSB0aGUgY2hhbmdlcyB0aGF0IG5lZWQgdG8gYmUgbWFkZSB0byB0aGUgcmVuZGVyZWQgcm93cy5cbiAqXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUmVuZGVyUm93PFQ+IHtcbiAgZGF0YTogVDtcbiAgZGF0YUluZGV4OiBudW1iZXI7XG4gIHJvd0RlZjogQ2RrUm93RGVmPFQ+O1xufVxuXG4vKipcbiAqIEEgZGF0YSB0YWJsZSB0aGF0IGNhbiByZW5kZXIgYSBoZWFkZXIgcm93LCBkYXRhIHJvd3MsIGFuZCBhIGZvb3RlciByb3cuXG4gKiBVc2VzIHRoZSBkYXRhU291cmNlIGlucHV0IHRvIGRldGVybWluZSB0aGUgZGF0YSB0byBiZSByZW5kZXJlZC4gVGhlIGRhdGEgY2FuIGJlIHByb3ZpZGVkIGVpdGhlclxuICogYXMgYSBkYXRhIGFycmF5LCBhbiBPYnNlcnZhYmxlIHN0cmVhbSB0aGF0IGVtaXRzIHRoZSBkYXRhIGFycmF5IHRvIHJlbmRlciwgb3IgYSBEYXRhU291cmNlIHdpdGggYVxuICogY29ubmVjdCBmdW5jdGlvbiB0aGF0IHdpbGwgcmV0dXJuIGFuIE9ic2VydmFibGUgc3RyZWFtIHRoYXQgZW1pdHMgdGhlIGRhdGEgYXJyYXkgdG8gcmVuZGVyLlxuICovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdjZGstdGFibGUsIHRhYmxlW2Nkay10YWJsZV0nLFxuICBleHBvcnRBczogJ2Nka1RhYmxlJyxcbiAgdGVtcGxhdGU6IENES19UQUJMRV9URU1QTEFURSxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstdGFibGUnLFxuICB9LFxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxuICAvLyBUaGUgXCJPblB1c2hcIiBzdGF0dXMgZm9yIHRoZSBgTWF0VGFibGVgIGNvbXBvbmVudCBpcyBlZmZlY3RpdmVseSBhIG5vb3AsIHNvIHdlIGFyZSByZW1vdmluZyBpdC5cbiAgLy8gVGhlIHZpZXcgZm9yIGBNYXRUYWJsZWAgY29uc2lzdHMgZW50aXJlbHkgb2YgdGVtcGxhdGVzIGRlY2xhcmVkIGluIG90aGVyIHZpZXdzLiBBcyB0aGV5IGFyZVxuICAvLyBkZWNsYXJlZCBlbHNld2hlcmUsIHRoZXkgYXJlIGNoZWNrZWQgd2hlbiB0aGVpciBkZWNsYXJhdGlvbiBwb2ludHMgYXJlIGNoZWNrZWQuXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTp2YWxpZGF0ZS1kZWNvcmF0b3JzXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuRGVmYXVsdCxcbiAgcHJvdmlkZXJzOiBbe3Byb3ZpZGU6IENES19UQUJMRSwgdXNlRXhpc3Rpbmc6IENka1RhYmxlfV1cbn0pXG5leHBvcnQgY2xhc3MgQ2RrVGFibGU8VD4gaW1wbGVtZW50cyBBZnRlckNvbnRlbnRDaGVja2VkLCBDb2xsZWN0aW9uVmlld2VyLCBPbkRlc3Ryb3ksIE9uSW5pdCB7XG4gIHByaXZhdGUgX2RvY3VtZW50OiBEb2N1bWVudDtcblxuICAvKiogTGF0ZXN0IGRhdGEgcHJvdmlkZWQgYnkgdGhlIGRhdGEgc291cmNlLiAqL1xuICBwcm90ZWN0ZWQgX2RhdGE6IFRbXXxSZWFkb25seUFycmF5PFQ+O1xuXG4gIC8qKiBTdWJqZWN0IHRoYXQgZW1pdHMgd2hlbiB0aGUgY29tcG9uZW50IGhhcyBiZWVuIGRlc3Ryb3llZC4gKi9cbiAgcHJpdmF0ZSBfb25EZXN0cm95ID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogTGlzdCBvZiB0aGUgcmVuZGVyZWQgcm93cyBhcyBpZGVudGlmaWVkIGJ5IHRoZWlyIGBSZW5kZXJSb3dgIG9iamVjdC4gKi9cbiAgcHJpdmF0ZSBfcmVuZGVyUm93czogUmVuZGVyUm93PFQ+W107XG5cbiAgLyoqIFN1YnNjcmlwdGlvbiB0aGF0IGxpc3RlbnMgZm9yIHRoZSBkYXRhIHByb3ZpZGVkIGJ5IHRoZSBkYXRhIHNvdXJjZS4gKi9cbiAgcHJpdmF0ZSBfcmVuZGVyQ2hhbmdlU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb258bnVsbDtcblxuICAvKipcbiAgICogTWFwIG9mIGFsbCB0aGUgdXNlcidzIGRlZmluZWQgY29sdW1ucyAoaGVhZGVyLCBkYXRhLCBhbmQgZm9vdGVyIGNlbGwgdGVtcGxhdGUpIGlkZW50aWZpZWQgYnlcbiAgICogbmFtZS4gQ29sbGVjdGlvbiBwb3B1bGF0ZWQgYnkgdGhlIGNvbHVtbiBkZWZpbml0aW9ucyBnYXRoZXJlZCBieSBgQ29udGVudENoaWxkcmVuYCBhcyB3ZWxsIGFzXG4gICAqIGFueSBjdXN0b20gY29sdW1uIGRlZmluaXRpb25zIGFkZGVkIHRvIGBfY3VzdG9tQ29sdW1uRGVmc2AuXG4gICAqL1xuICBwcml2YXRlIF9jb2x1bW5EZWZzQnlOYW1lID0gbmV3IE1hcDxzdHJpbmcsIENka0NvbHVtbkRlZj4oKTtcblxuICAvKipcbiAgICogU2V0IG9mIGFsbCByb3cgZGVmaW5pdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCBieSB0aGlzIHRhYmxlLiBQb3B1bGF0ZWQgYnkgdGhlIHJvd3MgZ2F0aGVyZWQgYnlcbiAgICogdXNpbmcgYENvbnRlbnRDaGlsZHJlbmAgYXMgd2VsbCBhcyBhbnkgY3VzdG9tIHJvdyBkZWZpbml0aW9ucyBhZGRlZCB0byBgX2N1c3RvbVJvd0RlZnNgLlxuICAgKi9cbiAgcHJpdmF0ZSBfcm93RGVmczogQ2RrUm93RGVmPFQ+W107XG5cbiAgLyoqXG4gICAqIFNldCBvZiBhbGwgaGVhZGVyIHJvdyBkZWZpbml0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIGJ5IHRoaXMgdGFibGUuIFBvcHVsYXRlZCBieSB0aGUgcm93c1xuICAgKiBnYXRoZXJlZCBieSB1c2luZyBgQ29udGVudENoaWxkcmVuYCBhcyB3ZWxsIGFzIGFueSBjdXN0b20gcm93IGRlZmluaXRpb25zIGFkZGVkIHRvXG4gICAqIGBfY3VzdG9tSGVhZGVyUm93RGVmc2AuXG4gICAqL1xuICBwcml2YXRlIF9oZWFkZXJSb3dEZWZzOiBDZGtIZWFkZXJSb3dEZWZbXTtcblxuICAvKipcbiAgICogU2V0IG9mIGFsbCByb3cgZGVmaW5pdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCBieSB0aGlzIHRhYmxlLiBQb3B1bGF0ZWQgYnkgdGhlIHJvd3MgZ2F0aGVyZWQgYnlcbiAgICogdXNpbmcgYENvbnRlbnRDaGlsZHJlbmAgYXMgd2VsbCBhcyBhbnkgY3VzdG9tIHJvdyBkZWZpbml0aW9ucyBhZGRlZCB0b1xuICAgKiBgX2N1c3RvbUZvb3RlclJvd0RlZnNgLlxuICAgKi9cbiAgcHJpdmF0ZSBfZm9vdGVyUm93RGVmczogQ2RrRm9vdGVyUm93RGVmW107XG5cbiAgLyoqIERpZmZlciB1c2VkIHRvIGZpbmQgdGhlIGNoYW5nZXMgaW4gdGhlIGRhdGEgcHJvdmlkZWQgYnkgdGhlIGRhdGEgc291cmNlLiAqL1xuICBwcml2YXRlIF9kYXRhRGlmZmVyOiBJdGVyYWJsZURpZmZlcjxSZW5kZXJSb3c8VD4+O1xuXG4gIC8qKiBTdG9yZXMgdGhlIHJvdyBkZWZpbml0aW9uIHRoYXQgZG9lcyBub3QgaGF2ZSBhIHdoZW4gcHJlZGljYXRlLiAqL1xuICBwcml2YXRlIF9kZWZhdWx0Um93RGVmOiBDZGtSb3dEZWY8VD58bnVsbDtcblxuICAvKipcbiAgICogQ29sdW1uIGRlZmluaXRpb25zIHRoYXQgd2VyZSBkZWZpbmVkIG91dHNpZGUgb2YgdGhlIGRpcmVjdCBjb250ZW50IGNoaWxkcmVuIG9mIHRoZSB0YWJsZS5cbiAgICogVGhlc2Ugd2lsbCBiZSBkZWZpbmVkIHdoZW4sIGUuZy4sIGNyZWF0aW5nIGEgd3JhcHBlciBhcm91bmQgdGhlIGNka1RhYmxlIHRoYXQgaGFzXG4gICAqIGNvbHVtbiBkZWZpbml0aW9ucyBhcyAqaXRzKiBjb250ZW50IGNoaWxkLlxuICAgKi9cbiAgcHJpdmF0ZSBfY3VzdG9tQ29sdW1uRGVmcyA9IG5ldyBTZXQ8Q2RrQ29sdW1uRGVmPigpO1xuXG4gIC8qKlxuICAgKiBEYXRhIHJvdyBkZWZpbml0aW9ucyB0aGF0IHdlcmUgZGVmaW5lZCBvdXRzaWRlIG9mIHRoZSBkaXJlY3QgY29udGVudCBjaGlsZHJlbiBvZiB0aGUgdGFibGUuXG4gICAqIFRoZXNlIHdpbGwgYmUgZGVmaW5lZCB3aGVuLCBlLmcuLCBjcmVhdGluZyBhIHdyYXBwZXIgYXJvdW5kIHRoZSBjZGtUYWJsZSB0aGF0IGhhc1xuICAgKiBidWlsdC1pbiBkYXRhIHJvd3MgYXMgKml0cyogY29udGVudCBjaGlsZC5cbiAgICovXG4gIHByaXZhdGUgX2N1c3RvbVJvd0RlZnMgPSBuZXcgU2V0PENka1Jvd0RlZjxUPj4oKTtcblxuICAvKipcbiAgICogSGVhZGVyIHJvdyBkZWZpbml0aW9ucyB0aGF0IHdlcmUgZGVmaW5lZCBvdXRzaWRlIG9mIHRoZSBkaXJlY3QgY29udGVudCBjaGlsZHJlbiBvZiB0aGUgdGFibGUuXG4gICAqIFRoZXNlIHdpbGwgYmUgZGVmaW5lZCB3aGVuLCBlLmcuLCBjcmVhdGluZyBhIHdyYXBwZXIgYXJvdW5kIHRoZSBjZGtUYWJsZSB0aGF0IGhhc1xuICAgKiBidWlsdC1pbiBoZWFkZXIgcm93cyBhcyAqaXRzKiBjb250ZW50IGNoaWxkLlxuICAgKi9cbiAgcHJpdmF0ZSBfY3VzdG9tSGVhZGVyUm93RGVmcyA9IG5ldyBTZXQ8Q2RrSGVhZGVyUm93RGVmPigpO1xuXG4gIC8qKlxuICAgKiBGb290ZXIgcm93IGRlZmluaXRpb25zIHRoYXQgd2VyZSBkZWZpbmVkIG91dHNpZGUgb2YgdGhlIGRpcmVjdCBjb250ZW50IGNoaWxkcmVuIG9mIHRoZSB0YWJsZS5cbiAgICogVGhlc2Ugd2lsbCBiZSBkZWZpbmVkIHdoZW4sIGUuZy4sIGNyZWF0aW5nIGEgd3JhcHBlciBhcm91bmQgdGhlIGNka1RhYmxlIHRoYXQgaGFzIGFcbiAgICogYnVpbHQtaW4gZm9vdGVyIHJvdyBhcyAqaXRzKiBjb250ZW50IGNoaWxkLlxuICAgKi9cbiAgcHJpdmF0ZSBfY3VzdG9tRm9vdGVyUm93RGVmcyA9IG5ldyBTZXQ8Q2RrRm9vdGVyUm93RGVmPigpO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBoZWFkZXIgcm93IGRlZmluaXRpb24gaGFzIGJlZW4gY2hhbmdlZC4gVHJpZ2dlcnMgYW4gdXBkYXRlIHRvIHRoZSBoZWFkZXIgcm93IGFmdGVyXG4gICAqIGNvbnRlbnQgaXMgY2hlY2tlZC4gSW5pdGlhbGl6ZWQgYXMgdHJ1ZSBzbyB0aGF0IHRoZSB0YWJsZSByZW5kZXJzIHRoZSBpbml0aWFsIHNldCBvZiByb3dzLlxuICAgKi9cbiAgcHJpdmF0ZSBfaGVhZGVyUm93RGVmQ2hhbmdlZCA9IHRydWU7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGZvb3RlciByb3cgZGVmaW5pdGlvbiBoYXMgYmVlbiBjaGFuZ2VkLiBUcmlnZ2VycyBhbiB1cGRhdGUgdG8gdGhlIGZvb3RlciByb3cgYWZ0ZXJcbiAgICogY29udGVudCBpcyBjaGVja2VkLiBJbml0aWFsaXplZCBhcyB0cnVlIHNvIHRoYXQgdGhlIHRhYmxlIHJlbmRlcnMgdGhlIGluaXRpYWwgc2V0IG9mIHJvd3MuXG4gICAqL1xuICBwcml2YXRlIF9mb290ZXJSb3dEZWZDaGFuZ2VkID0gdHJ1ZTtcblxuICAvKipcbiAgICogQ2FjaGUgb2YgdGhlIGxhdGVzdCByZW5kZXJlZCBgUmVuZGVyUm93YCBvYmplY3RzIGFzIGEgbWFwIGZvciBlYXN5IHJldHJpZXZhbCB3aGVuIGNvbnN0cnVjdGluZ1xuICAgKiBhIG5ldyBsaXN0IG9mIGBSZW5kZXJSb3dgIG9iamVjdHMgZm9yIHJlbmRlcmluZyByb3dzLiBTaW5jZSB0aGUgbmV3IGxpc3QgaXMgY29uc3RydWN0ZWQgd2l0aFxuICAgKiB0aGUgY2FjaGVkIGBSZW5kZXJSb3dgIG9iamVjdHMgd2hlbiBwb3NzaWJsZSwgdGhlIHJvdyBpZGVudGl0eSBpcyBwcmVzZXJ2ZWQgd2hlbiB0aGUgZGF0YVxuICAgKiBhbmQgcm93IHRlbXBsYXRlIG1hdGNoZXMsIHdoaWNoIGFsbG93cyB0aGUgYEl0ZXJhYmxlRGlmZmVyYCB0byBjaGVjayByb3dzIGJ5IHJlZmVyZW5jZVxuICAgKiBhbmQgdW5kZXJzdGFuZCB3aGljaCByb3dzIGFyZSBhZGRlZC9tb3ZlZC9yZW1vdmVkLlxuICAgKlxuICAgKiBJbXBsZW1lbnRlZCBhcyBhIG1hcCBvZiBtYXBzIHdoZXJlIHRoZSBmaXJzdCBrZXkgaXMgdGhlIGBkYXRhOiBUYCBvYmplY3QgYW5kIHRoZSBzZWNvbmQgaXMgdGhlXG4gICAqIGBDZGtSb3dEZWY8VD5gIG9iamVjdC4gV2l0aCB0aGUgdHdvIGtleXMsIHRoZSBjYWNoZSBwb2ludHMgdG8gYSBgUmVuZGVyUm93PFQ+YCBvYmplY3QgdGhhdFxuICAgKiBjb250YWlucyBhbiBhcnJheSBvZiBjcmVhdGVkIHBhaXJzLiBUaGUgYXJyYXkgaXMgbmVjZXNzYXJ5IHRvIGhhbmRsZSBjYXNlcyB3aGVyZSB0aGUgZGF0YVxuICAgKiBhcnJheSBjb250YWlucyBtdWx0aXBsZSBkdXBsaWNhdGUgZGF0YSBvYmplY3RzIGFuZCBlYWNoIGluc3RhbnRpYXRlZCBgUmVuZGVyUm93YCBtdXN0IGJlXG4gICAqIHN0b3JlZC5cbiAgICovXG4gIHByaXZhdGUgX2NhY2hlZFJlbmRlclJvd3NNYXAgPSBuZXcgTWFwPFQsIFdlYWtNYXA8Q2RrUm93RGVmPFQ+LCBSZW5kZXJSb3c8VD5bXT4+KCk7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHRhYmxlIGlzIGFwcGxpZWQgdG8gYSBuYXRpdmUgYDx0YWJsZT5gLiAqL1xuICBwcml2YXRlIF9pc05hdGl2ZUh0bWxUYWJsZTogYm9vbGVhbjtcblxuICAvKipcbiAgICogVXRpbGl0eSBjbGFzcyB0aGF0IGlzIHJlc3BvbnNpYmxlIGZvciBhcHBseWluZyB0aGUgYXBwcm9wcmlhdGUgc3RpY2t5IHBvc2l0aW9uaW5nIHN0eWxlcyB0b1xuICAgKiB0aGUgdGFibGUncyByb3dzIGFuZCBjZWxscy5cbiAgICovXG4gIHByaXZhdGUgX3N0aWNreVN0eWxlcjogU3RpY2t5U3R5bGVyO1xuXG4gIC8qKlxuICAgKiBDU1MgY2xhc3MgYWRkZWQgdG8gYW55IHJvdyBvciBjZWxsIHRoYXQgaGFzIHN0aWNreSBwb3NpdGlvbmluZyBhcHBsaWVkLiBNYXkgYmUgb3ZlcnJpZGVuIGJ5XG4gICAqIHRhYmxlIHN1YmNsYXNzZXMuXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RpY2t5Q3NzQ2xhc3M6IHN0cmluZyA9ICdjZGstdGFibGUtc3RpY2t5JztcblxuICAvKiogV2hldGhlciB0aGUgbm8gZGF0YSByb3cgaXMgY3VycmVudGx5IHNob3dpbmcgYW55dGhpbmcuICovXG4gIHByaXZhdGUgX2lzU2hvd2luZ05vRGF0YVJvdyA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBUcmFja2luZyBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgdXNlZCB0byBjaGVjayB0aGUgZGlmZmVyZW5jZXMgaW4gZGF0YSBjaGFuZ2VzLiBVc2VkIHNpbWlsYXJseVxuICAgKiB0byBgbmdGb3JgIGB0cmFja0J5YCBmdW5jdGlvbi4gT3B0aW1pemUgcm93IG9wZXJhdGlvbnMgYnkgaWRlbnRpZnlpbmcgYSByb3cgYmFzZWQgb24gaXRzIGRhdGFcbiAgICogcmVsYXRpdmUgdG8gdGhlIGZ1bmN0aW9uIHRvIGtub3cgaWYgYSByb3cgc2hvdWxkIGJlIGFkZGVkL3JlbW92ZWQvbW92ZWQuXG4gICAqIEFjY2VwdHMgYSBmdW5jdGlvbiB0aGF0IHRha2VzIHR3byBwYXJhbWV0ZXJzLCBgaW5kZXhgIGFuZCBgaXRlbWAuXG4gICAqL1xuICBASW5wdXQoKVxuICBnZXQgdHJhY2tCeSgpOiBUcmFja0J5RnVuY3Rpb248VD4ge1xuICAgIHJldHVybiB0aGlzLl90cmFja0J5Rm47XG4gIH1cbiAgc2V0IHRyYWNrQnkoZm46IFRyYWNrQnlGdW5jdGlvbjxUPikge1xuICAgIGlmIChpc0Rldk1vZGUoKSAmJiBmbiAhPSBudWxsICYmIHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJyAmJiA8YW55PmNvbnNvbGUgJiZcbiAgICAgICAgPGFueT5jb25zb2xlLndhcm4pIHtcbiAgICAgIGNvbnNvbGUud2FybihgdHJhY2tCeSBtdXN0IGJlIGEgZnVuY3Rpb24sIGJ1dCByZWNlaXZlZCAke0pTT04uc3RyaW5naWZ5KGZuKX0uYCk7XG4gICAgfVxuICAgIHRoaXMuX3RyYWNrQnlGbiA9IGZuO1xuICB9XG4gIHByaXZhdGUgX3RyYWNrQnlGbjogVHJhY2tCeUZ1bmN0aW9uPFQ+O1xuXG4gIC8qKlxuICAgKiBUaGUgdGFibGUncyBzb3VyY2Ugb2YgZGF0YSwgd2hpY2ggY2FuIGJlIHByb3ZpZGVkIGluIHRocmVlIHdheXMgKGluIG9yZGVyIG9mIGNvbXBsZXhpdHkpOlxuICAgKiAgIC0gU2ltcGxlIGRhdGEgYXJyYXkgKGVhY2ggb2JqZWN0IHJlcHJlc2VudHMgb25lIHRhYmxlIHJvdylcbiAgICogICAtIFN0cmVhbSB0aGF0IGVtaXRzIGEgZGF0YSBhcnJheSBlYWNoIHRpbWUgdGhlIGFycmF5IGNoYW5nZXNcbiAgICogICAtIGBEYXRhU291cmNlYCBvYmplY3QgdGhhdCBpbXBsZW1lbnRzIHRoZSBjb25uZWN0L2Rpc2Nvbm5lY3QgaW50ZXJmYWNlLlxuICAgKlxuICAgKiBJZiBhIGRhdGEgYXJyYXkgaXMgcHJvdmlkZWQsIHRoZSB0YWJsZSBtdXN0IGJlIG5vdGlmaWVkIHdoZW4gdGhlIGFycmF5J3Mgb2JqZWN0cyBhcmVcbiAgICogYWRkZWQsIHJlbW92ZWQsIG9yIG1vdmVkLiBUaGlzIGNhbiBiZSBkb25lIGJ5IGNhbGxpbmcgdGhlIGByZW5kZXJSb3dzKClgIGZ1bmN0aW9uIHdoaWNoIHdpbGxcbiAgICogcmVuZGVyIHRoZSBkaWZmIHNpbmNlIHRoZSBsYXN0IHRhYmxlIHJlbmRlci4gSWYgdGhlIGRhdGEgYXJyYXkgcmVmZXJlbmNlIGlzIGNoYW5nZWQsIHRoZSB0YWJsZVxuICAgKiB3aWxsIGF1dG9tYXRpY2FsbHkgdHJpZ2dlciBhbiB1cGRhdGUgdG8gdGhlIHJvd3MuXG4gICAqXG4gICAqIFdoZW4gcHJvdmlkaW5nIGFuIE9ic2VydmFibGUgc3RyZWFtLCB0aGUgdGFibGUgd2lsbCB0cmlnZ2VyIGFuIHVwZGF0ZSBhdXRvbWF0aWNhbGx5IHdoZW4gdGhlXG4gICAqIHN0cmVhbSBlbWl0cyBhIG5ldyBhcnJheSBvZiBkYXRhLlxuICAgKlxuICAgKiBGaW5hbGx5LCB3aGVuIHByb3ZpZGluZyBhIGBEYXRhU291cmNlYCBvYmplY3QsIHRoZSB0YWJsZSB3aWxsIHVzZSB0aGUgT2JzZXJ2YWJsZSBzdHJlYW1cbiAgICogcHJvdmlkZWQgYnkgdGhlIGNvbm5lY3QgZnVuY3Rpb24gYW5kIHRyaWdnZXIgdXBkYXRlcyB3aGVuIHRoYXQgc3RyZWFtIGVtaXRzIG5ldyBkYXRhIGFycmF5XG4gICAqIHZhbHVlcy4gRHVyaW5nIHRoZSB0YWJsZSdzIG5nT25EZXN0cm95IG9yIHdoZW4gdGhlIGRhdGEgc291cmNlIGlzIHJlbW92ZWQgZnJvbSB0aGUgdGFibGUsIHRoZVxuICAgKiB0YWJsZSB3aWxsIGNhbGwgdGhlIERhdGFTb3VyY2UncyBgZGlzY29ubmVjdGAgZnVuY3Rpb24gKG1heSBiZSB1c2VmdWwgZm9yIGNsZWFuaW5nIHVwIGFueVxuICAgKiBzdWJzY3JpcHRpb25zIHJlZ2lzdGVyZWQgZHVyaW5nIHRoZSBjb25uZWN0IHByb2Nlc3MpLlxuICAgKi9cbiAgQElucHV0KClcbiAgZ2V0IGRhdGFTb3VyY2UoKTogQ2RrVGFibGVEYXRhU291cmNlSW5wdXQ8VD4ge1xuICAgIHJldHVybiB0aGlzLl9kYXRhU291cmNlO1xuICB9XG4gIHNldCBkYXRhU291cmNlKGRhdGFTb3VyY2U6IENka1RhYmxlRGF0YVNvdXJjZUlucHV0PFQ+KSB7XG4gICAgaWYgKHRoaXMuX2RhdGFTb3VyY2UgIT09IGRhdGFTb3VyY2UpIHtcbiAgICAgIHRoaXMuX3N3aXRjaERhdGFTb3VyY2UoZGF0YVNvdXJjZSk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgX2RhdGFTb3VyY2U6IENka1RhYmxlRGF0YVNvdXJjZUlucHV0PFQ+O1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRvIGFsbG93IG11bHRpcGxlIHJvd3MgcGVyIGRhdGEgb2JqZWN0IGJ5IGV2YWx1YXRpbmcgd2hpY2ggcm93cyBldmFsdWF0ZSB0aGVpciAnd2hlbidcbiAgICogcHJlZGljYXRlIHRvIHRydWUuIElmIGBtdWx0aVRlbXBsYXRlRGF0YVJvd3NgIGlzIGZhbHNlLCB3aGljaCBpcyB0aGUgZGVmYXVsdCB2YWx1ZSwgdGhlbiBlYWNoXG4gICAqIGRhdGFvYmplY3Qgd2lsbCByZW5kZXIgdGhlIGZpcnN0IHJvdyB0aGF0IGV2YWx1YXRlcyBpdHMgd2hlbiBwcmVkaWNhdGUgdG8gdHJ1ZSwgaW4gdGhlIG9yZGVyXG4gICAqIGRlZmluZWQgaW4gdGhlIHRhYmxlLCBvciBvdGhlcndpc2UgdGhlIGRlZmF1bHQgcm93IHdoaWNoIGRvZXMgbm90IGhhdmUgYSB3aGVuIHByZWRpY2F0ZS5cbiAgICovXG4gIEBJbnB1dCgpXG4gIGdldCBtdWx0aVRlbXBsYXRlRGF0YVJvd3MoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX211bHRpVGVtcGxhdGVEYXRhUm93cztcbiAgfVxuICBzZXQgbXVsdGlUZW1wbGF0ZURhdGFSb3dzKHY6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9tdWx0aVRlbXBsYXRlRGF0YVJvd3MgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodik7XG5cbiAgICAvLyBJbiBJdnkgaWYgdGhpcyB2YWx1ZSBpcyBzZXQgdmlhIGEgc3RhdGljIGF0dHJpYnV0ZSAoZS5nLiA8dGFibGUgbXVsdGlUZW1wbGF0ZURhdGFSb3dzPiksXG4gICAgLy8gdGhpcyBzZXR0ZXIgd2lsbCBiZSBpbnZva2VkIGJlZm9yZSB0aGUgcm93IG91dGxldCBoYXMgYmVlbiBkZWZpbmVkIGhlbmNlIHRoZSBudWxsIGNoZWNrLlxuICAgIGlmICh0aGlzLl9yb3dPdXRsZXQgJiYgdGhpcy5fcm93T3V0bGV0LnZpZXdDb250YWluZXIubGVuZ3RoKSB7XG4gICAgICB0aGlzLl9mb3JjZVJlbmRlckRhdGFSb3dzKCk7XG4gICAgfVxuICB9XG4gIF9tdWx0aVRlbXBsYXRlRGF0YVJvd3M6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvLyBUT0RPKGFuZHJld3NlZ3Vpbik6IFJlbW92ZSBtYXggdmFsdWUgYXMgdGhlIGVuZCBpbmRleFxuICAvLyAgIGFuZCBpbnN0ZWFkIGNhbGN1bGF0ZSB0aGUgdmlldyBvbiBpbml0IGFuZCBzY3JvbGwuXG4gIC8qKlxuICAgKiBTdHJlYW0gY29udGFpbmluZyB0aGUgbGF0ZXN0IGluZm9ybWF0aW9uIG9uIHdoYXQgcm93cyBhcmUgYmVpbmcgZGlzcGxheWVkIG9uIHNjcmVlbi5cbiAgICogQ2FuIGJlIHVzZWQgYnkgdGhlIGRhdGEgc291cmNlIHRvIGFzIGEgaGV1cmlzdGljIG9mIHdoYXQgZGF0YSBzaG91bGQgYmUgcHJvdmlkZWQuXG4gICAqXG4gICAqIEBkb2NzLXByaXZhdGVcbiAgICovXG4gIHZpZXdDaGFuZ2U6IEJlaGF2aW9yU3ViamVjdDx7c3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXJ9PiA9XG4gICAgICBuZXcgQmVoYXZpb3JTdWJqZWN0PHtzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcn0+KHtzdGFydDogMCwgZW5kOiBOdW1iZXIuTUFYX1ZBTFVFfSk7XG5cbiAgLy8gT3V0bGV0cyBpbiB0aGUgdGFibGUncyB0ZW1wbGF0ZSB3aGVyZSB0aGUgaGVhZGVyLCBkYXRhIHJvd3MsIGFuZCBmb290ZXIgd2lsbCBiZSBpbnNlcnRlZC5cbiAgQFZpZXdDaGlsZChEYXRhUm93T3V0bGV0LCB7c3RhdGljOiB0cnVlfSkgX3Jvd091dGxldDogRGF0YVJvd091dGxldDtcbiAgQFZpZXdDaGlsZChIZWFkZXJSb3dPdXRsZXQsIHtzdGF0aWM6IHRydWV9KSBfaGVhZGVyUm93T3V0bGV0OiBIZWFkZXJSb3dPdXRsZXQ7XG4gIEBWaWV3Q2hpbGQoRm9vdGVyUm93T3V0bGV0LCB7c3RhdGljOiB0cnVlfSkgX2Zvb3RlclJvd091dGxldDogRm9vdGVyUm93T3V0bGV0O1xuICBAVmlld0NoaWxkKE5vRGF0YVJvd091dGxldCwge3N0YXRpYzogdHJ1ZX0pIF9ub0RhdGFSb3dPdXRsZXQ6IE5vRGF0YVJvd091dGxldDtcblxuICAvKipcbiAgICogVGhlIGNvbHVtbiBkZWZpbml0aW9ucyBwcm92aWRlZCBieSB0aGUgdXNlciB0aGF0IGNvbnRhaW4gd2hhdCB0aGUgaGVhZGVyLCBkYXRhLCBhbmQgZm9vdGVyXG4gICAqIGNlbGxzIHNob3VsZCByZW5kZXIgZm9yIGVhY2ggY29sdW1uLlxuICAgKi9cbiAgQENvbnRlbnRDaGlsZHJlbihDZGtDb2x1bW5EZWYsIHtkZXNjZW5kYW50czogdHJ1ZX0pIF9jb250ZW50Q29sdW1uRGVmczogUXVlcnlMaXN0PENka0NvbHVtbkRlZj47XG5cbiAgLyoqIFNldCBvZiBkYXRhIHJvdyBkZWZpbml0aW9ucyB0aGF0IHdlcmUgcHJvdmlkZWQgdG8gdGhlIHRhYmxlIGFzIGNvbnRlbnQgY2hpbGRyZW4uICovXG4gIEBDb250ZW50Q2hpbGRyZW4oQ2RrUm93RGVmLCB7ZGVzY2VuZGFudHM6IHRydWV9KSBfY29udGVudFJvd0RlZnM6IFF1ZXJ5TGlzdDxDZGtSb3dEZWY8VD4+O1xuXG4gIC8qKiBTZXQgb2YgaGVhZGVyIHJvdyBkZWZpbml0aW9ucyB0aGF0IHdlcmUgcHJvdmlkZWQgdG8gdGhlIHRhYmxlIGFzIGNvbnRlbnQgY2hpbGRyZW4uICovXG4gIEBDb250ZW50Q2hpbGRyZW4oQ2RrSGVhZGVyUm93RGVmLCB7XG4gICAgZGVzY2VuZGFudHM6IHRydWVcbiAgfSkgX2NvbnRlbnRIZWFkZXJSb3dEZWZzOiBRdWVyeUxpc3Q8Q2RrSGVhZGVyUm93RGVmPjtcblxuICAvKiogU2V0IG9mIGZvb3RlciByb3cgZGVmaW5pdGlvbnMgdGhhdCB3ZXJlIHByb3ZpZGVkIHRvIHRoZSB0YWJsZSBhcyBjb250ZW50IGNoaWxkcmVuLiAqL1xuICBAQ29udGVudENoaWxkcmVuKENka0Zvb3RlclJvd0RlZiwge1xuICAgIGRlc2NlbmRhbnRzOiB0cnVlXG4gIH0pIF9jb250ZW50Rm9vdGVyUm93RGVmczogUXVlcnlMaXN0PENka0Zvb3RlclJvd0RlZj47XG5cbiAgLyoqIFJvdyBkZWZpbml0aW9uIHRoYXQgd2lsbCBvbmx5IGJlIHJlbmRlcmVkIGlmIHRoZXJlJ3Mgbm8gZGF0YSBpbiB0aGUgdGFibGUuICovXG4gIEBDb250ZW50Q2hpbGQoQ2RrTm9EYXRhUm93KSBfbm9EYXRhUm93OiBDZGtOb0RhdGFSb3c7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcm90ZWN0ZWQgcmVhZG9ubHkgX2RpZmZlcnM6IEl0ZXJhYmxlRGlmZmVycyxcbiAgICAgIHByb3RlY3RlZCByZWFkb25seSBfY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmLFxuICAgICAgcHJvdGVjdGVkIHJlYWRvbmx5IF9lbGVtZW50UmVmOiBFbGVtZW50UmVmLCBAQXR0cmlidXRlKCdyb2xlJykgcm9sZTogc3RyaW5nLFxuICAgICAgQE9wdGlvbmFsKCkgcHJvdGVjdGVkIHJlYWRvbmx5IF9kaXI6IERpcmVjdGlvbmFsaXR5LCBASW5qZWN0KERPQ1VNRU5UKSBfZG9jdW1lbnQ6IGFueSxcbiAgICAgIHByaXZhdGUgX3BsYXRmb3JtOiBQbGF0Zm9ybSkge1xuICAgIGlmICghcm9sZSkge1xuICAgICAgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnNldEF0dHJpYnV0ZSgncm9sZScsICdncmlkJyk7XG4gICAgfVxuXG4gICAgdGhpcy5fZG9jdW1lbnQgPSBfZG9jdW1lbnQ7XG4gICAgdGhpcy5faXNOYXRpdmVIdG1sVGFibGUgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQubm9kZU5hbWUgPT09ICdUQUJMRSc7XG4gIH1cblxuICBuZ09uSW5pdCgpIHtcbiAgICB0aGlzLl9zZXR1cFN0aWNreVN0eWxlcigpO1xuXG4gICAgaWYgKHRoaXMuX2lzTmF0aXZlSHRtbFRhYmxlKSB7XG4gICAgICB0aGlzLl9hcHBseU5hdGl2ZVRhYmxlU2VjdGlvbnMoKTtcbiAgICB9XG5cbiAgICAvLyBTZXQgdXAgdGhlIHRyYWNrQnkgZnVuY3Rpb24gc28gdGhhdCBpdCB1c2VzIHRoZSBgUmVuZGVyUm93YCBhcyBpdHMgaWRlbnRpdHkgYnkgZGVmYXVsdC4gSWZcbiAgICAvLyB0aGUgdXNlciBoYXMgcHJvdmlkZWQgYSBjdXN0b20gdHJhY2tCeSwgcmV0dXJuIHRoZSByZXN1bHQgb2YgdGhhdCBmdW5jdGlvbiBhcyBldmFsdWF0ZWRcbiAgICAvLyB3aXRoIHRoZSB2YWx1ZXMgb2YgdGhlIGBSZW5kZXJSb3dgJ3MgZGF0YSBhbmQgaW5kZXguXG4gICAgdGhpcy5fZGF0YURpZmZlciA9IHRoaXMuX2RpZmZlcnMuZmluZChbXSkuY3JlYXRlKChfaTogbnVtYmVyLCBkYXRhUm93OiBSZW5kZXJSb3c8VD4pID0+IHtcbiAgICAgIHJldHVybiB0aGlzLnRyYWNrQnkgPyB0aGlzLnRyYWNrQnkoZGF0YVJvdy5kYXRhSW5kZXgsIGRhdGFSb3cuZGF0YSkgOiBkYXRhUm93O1xuICAgIH0pO1xuICB9XG5cbiAgbmdBZnRlckNvbnRlbnRDaGVja2VkKCkge1xuICAgIC8vIENhY2hlIHRoZSByb3cgYW5kIGNvbHVtbiBkZWZpbml0aW9ucyBnYXRoZXJlZCBieSBDb250ZW50Q2hpbGRyZW4gYW5kIHByb2dyYW1tYXRpYyBpbmplY3Rpb24uXG4gICAgdGhpcy5fY2FjaGVSb3dEZWZzKCk7XG4gICAgdGhpcy5fY2FjaGVDb2x1bW5EZWZzKCk7XG5cbiAgICAvLyBNYWtlIHN1cmUgdGhhdCB0aGUgdXNlciBoYXMgYXQgbGVhc3QgYWRkZWQgaGVhZGVyLCBmb290ZXIsIG9yIGRhdGEgcm93IGRlZi5cbiAgICBpZiAoIXRoaXMuX2hlYWRlclJvd0RlZnMubGVuZ3RoICYmICF0aGlzLl9mb290ZXJSb3dEZWZzLmxlbmd0aCAmJiAhdGhpcy5fcm93RGVmcy5sZW5ndGgpIHtcbiAgICAgIHRocm93IGdldFRhYmxlTWlzc2luZ1Jvd0RlZnNFcnJvcigpO1xuICAgIH1cblxuICAgIC8vIFJlbmRlciB1cGRhdGVzIGlmIHRoZSBsaXN0IG9mIGNvbHVtbnMgaGF2ZSBiZWVuIGNoYW5nZWQgZm9yIHRoZSBoZWFkZXIsIHJvdywgb3IgZm9vdGVyIGRlZnMuXG4gICAgdGhpcy5fcmVuZGVyVXBkYXRlZENvbHVtbnMoKTtcblxuICAgIC8vIElmIHRoZSBoZWFkZXIgcm93IGRlZmluaXRpb24gaGFzIGJlZW4gY2hhbmdlZCwgdHJpZ2dlciBhIHJlbmRlciB0byB0aGUgaGVhZGVyIHJvdy5cbiAgICBpZiAodGhpcy5faGVhZGVyUm93RGVmQ2hhbmdlZCkge1xuICAgICAgdGhpcy5fZm9yY2VSZW5kZXJIZWFkZXJSb3dzKCk7XG4gICAgICB0aGlzLl9oZWFkZXJSb3dEZWZDaGFuZ2VkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGZvb3RlciByb3cgZGVmaW5pdGlvbiBoYXMgYmVlbiBjaGFuZ2VkLCB0cmlnZ2VyIGEgcmVuZGVyIHRvIHRoZSBmb290ZXIgcm93LlxuICAgIGlmICh0aGlzLl9mb290ZXJSb3dEZWZDaGFuZ2VkKSB7XG4gICAgICB0aGlzLl9mb3JjZVJlbmRlckZvb3RlclJvd3MoKTtcbiAgICAgIHRoaXMuX2Zvb3RlclJvd0RlZkNoYW5nZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSBpcyBhIGRhdGEgc291cmNlIGFuZCByb3cgZGVmaW5pdGlvbnMsIGNvbm5lY3QgdG8gdGhlIGRhdGEgc291cmNlIHVubGVzcyBhXG4gICAgLy8gY29ubmVjdGlvbiBoYXMgYWxyZWFkeSBiZWVuIG1hZGUuXG4gICAgaWYgKHRoaXMuZGF0YVNvdXJjZSAmJiB0aGlzLl9yb3dEZWZzLmxlbmd0aCA+IDAgJiYgIXRoaXMuX3JlbmRlckNoYW5nZVN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fb2JzZXJ2ZVJlbmRlckNoYW5nZXMoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9jaGVja1N0aWNreVN0YXRlcygpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fcm93T3V0bGV0LnZpZXdDb250YWluZXIuY2xlYXIoKTtcbiAgICB0aGlzLl9ub0RhdGFSb3dPdXRsZXQudmlld0NvbnRhaW5lci5jbGVhcigpO1xuICAgIHRoaXMuX2hlYWRlclJvd091dGxldC52aWV3Q29udGFpbmVyLmNsZWFyKCk7XG4gICAgdGhpcy5fZm9vdGVyUm93T3V0bGV0LnZpZXdDb250YWluZXIuY2xlYXIoKTtcblxuICAgIHRoaXMuX2NhY2hlZFJlbmRlclJvd3NNYXAuY2xlYXIoKTtcblxuICAgIHRoaXMuX29uRGVzdHJveS5uZXh0KCk7XG4gICAgdGhpcy5fb25EZXN0cm95LmNvbXBsZXRlKCk7XG5cbiAgICBpZiAoaXNEYXRhU291cmNlKHRoaXMuZGF0YVNvdXJjZSkpIHtcbiAgICAgIHRoaXMuZGF0YVNvdXJjZS5kaXNjb25uZWN0KHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZW5kZXJzIHJvd3MgYmFzZWQgb24gdGhlIHRhYmxlJ3MgbGF0ZXN0IHNldCBvZiBkYXRhLCB3aGljaCB3YXMgZWl0aGVyIHByb3ZpZGVkIGRpcmVjdGx5IGFzIGFuXG4gICAqIGlucHV0IG9yIHJldHJpZXZlZCB0aHJvdWdoIGFuIE9ic2VydmFibGUgc3RyZWFtIChkaXJlY3RseSBvciBmcm9tIGEgRGF0YVNvdXJjZSkuXG4gICAqIENoZWNrcyBmb3IgZGlmZmVyZW5jZXMgaW4gdGhlIGRhdGEgc2luY2UgdGhlIGxhc3QgZGlmZiB0byBwZXJmb3JtIG9ubHkgdGhlIG5lY2Vzc2FyeVxuICAgKiBjaGFuZ2VzIChhZGQvcmVtb3ZlL21vdmUgcm93cykuXG4gICAqXG4gICAqIElmIHRoZSB0YWJsZSdzIGRhdGEgc291cmNlIGlzIGEgRGF0YVNvdXJjZSBvciBPYnNlcnZhYmxlLCB0aGlzIHdpbGwgYmUgaW52b2tlZCBhdXRvbWF0aWNhbGx5XG4gICAqIGVhY2ggdGltZSB0aGUgcHJvdmlkZWQgT2JzZXJ2YWJsZSBzdHJlYW0gZW1pdHMgYSBuZXcgZGF0YSBhcnJheS4gT3RoZXJ3aXNlIGlmIHlvdXIgZGF0YSBpc1xuICAgKiBhbiBhcnJheSwgdGhpcyBmdW5jdGlvbiB3aWxsIG5lZWQgdG8gYmUgY2FsbGVkIHRvIHJlbmRlciBhbnkgY2hhbmdlcy5cbiAgICovXG4gIHJlbmRlclJvd3MoKSB7XG4gICAgdGhpcy5fcmVuZGVyUm93cyA9IHRoaXMuX2dldEFsbFJlbmRlclJvd3MoKTtcbiAgICBjb25zdCBjaGFuZ2VzID0gdGhpcy5fZGF0YURpZmZlci5kaWZmKHRoaXMuX3JlbmRlclJvd3MpO1xuICAgIGlmICghY2hhbmdlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHZpZXdDb250YWluZXIgPSB0aGlzLl9yb3dPdXRsZXQudmlld0NvbnRhaW5lcjtcblxuICAgIGNoYW5nZXMuZm9yRWFjaE9wZXJhdGlvbihcbiAgICAgICAgKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8UmVuZGVyUm93PFQ+PiwgcHJldkluZGV4OiBudW1iZXJ8bnVsbCxcbiAgICAgICAgIGN1cnJlbnRJbmRleDogbnVtYmVyfG51bGwpID0+IHtcbiAgICAgICAgICBpZiAocmVjb3JkLnByZXZpb3VzSW5kZXggPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5faW5zZXJ0Um93KHJlY29yZC5pdGVtLCBjdXJyZW50SW5kZXghKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJlbnRJbmRleCA9PSBudWxsKSB7XG4gICAgICAgICAgICB2aWV3Q29udGFpbmVyLnJlbW92ZShwcmV2SW5kZXghKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgdmlldyA9IDxSb3dWaWV3UmVmPFQ+PnZpZXdDb250YWluZXIuZ2V0KHByZXZJbmRleCEpO1xuICAgICAgICAgICAgdmlld0NvbnRhaW5lci5tb3ZlKHZpZXchLCBjdXJyZW50SW5kZXgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAvLyBVcGRhdGUgdGhlIG1ldGEgY29udGV4dCBvZiBhIHJvdydzIGNvbnRleHQgZGF0YSAoaW5kZXgsIGNvdW50LCBmaXJzdCwgbGFzdCwgLi4uKVxuICAgIHRoaXMuX3VwZGF0ZVJvd0luZGV4Q29udGV4dCgpO1xuXG4gICAgLy8gVXBkYXRlIHJvd3MgdGhhdCBkaWQgbm90IGdldCBhZGRlZC9yZW1vdmVkL21vdmVkIGJ1dCBtYXkgaGF2ZSBoYWQgdGhlaXIgaWRlbnRpdHkgY2hhbmdlZCxcbiAgICAvLyBlLmcuIGlmIHRyYWNrQnkgbWF0Y2hlZCBkYXRhIG9uIHNvbWUgcHJvcGVydHkgYnV0IHRoZSBhY3R1YWwgZGF0YSByZWZlcmVuY2UgY2hhbmdlZC5cbiAgICBjaGFuZ2VzLmZvckVhY2hJZGVudGl0eUNoYW5nZSgocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZDxSZW5kZXJSb3c8VD4+KSA9PiB7XG4gICAgICBjb25zdCByb3dWaWV3ID0gPFJvd1ZpZXdSZWY8VD4+dmlld0NvbnRhaW5lci5nZXQocmVjb3JkLmN1cnJlbnRJbmRleCEpO1xuICAgICAgcm93Vmlldy5jb250ZXh0LiRpbXBsaWNpdCA9IHJlY29yZC5pdGVtLmRhdGE7XG4gICAgfSk7XG5cbiAgICB0aGlzLl91cGRhdGVOb0RhdGFSb3coKTtcbiAgICB0aGlzLnVwZGF0ZVN0aWNreUNvbHVtblN0eWxlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGhlYWRlciByb3cgZGVmaW5pdGlvbiB0byBiZSB1c2VkLiBPdmVycmlkZXMgdGhlIGhlYWRlciByb3cgZGVmaW5pdGlvbiBnYXRoZXJlZCBieVxuICAgKiB1c2luZyBgQ29udGVudENoaWxkYCwgaWYgb25lIGV4aXN0cy4gU2V0cyBhIGZsYWcgdGhhdCB3aWxsIHJlLXJlbmRlciB0aGUgaGVhZGVyIHJvdyBhZnRlciB0aGVcbiAgICogdGFibGUncyBjb250ZW50IGlzIGNoZWNrZWQuXG4gICAqIEBkb2NzLXByaXZhdGVcbiAgICogQGRlcHJlY2F0ZWQgVXNlIGBhZGRIZWFkZXJSb3dEZWZgIGFuZCBgcmVtb3ZlSGVhZGVyUm93RGVmYCBpbnN0ZWFkXG4gICAqIEBicmVha2luZy1jaGFuZ2UgOC4wLjBcbiAgICovXG4gIHNldEhlYWRlclJvd0RlZihoZWFkZXJSb3dEZWY6IENka0hlYWRlclJvd0RlZikge1xuICAgIHRoaXMuX2N1c3RvbUhlYWRlclJvd0RlZnMgPSBuZXcgU2V0KFtoZWFkZXJSb3dEZWZdKTtcbiAgICB0aGlzLl9oZWFkZXJSb3dEZWZDaGFuZ2VkID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBmb290ZXIgcm93IGRlZmluaXRpb24gdG8gYmUgdXNlZC4gT3ZlcnJpZGVzIHRoZSBmb290ZXIgcm93IGRlZmluaXRpb24gZ2F0aGVyZWQgYnlcbiAgICogdXNpbmcgYENvbnRlbnRDaGlsZGAsIGlmIG9uZSBleGlzdHMuIFNldHMgYSBmbGFnIHRoYXQgd2lsbCByZS1yZW5kZXIgdGhlIGZvb3RlciByb3cgYWZ0ZXIgdGhlXG4gICAqIHRhYmxlJ3MgY29udGVudCBpcyBjaGVja2VkLlxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqIEBkZXByZWNhdGVkIFVzZSBgYWRkRm9vdGVyUm93RGVmYCBhbmQgYHJlbW92ZUZvb3RlclJvd0RlZmAgaW5zdGVhZFxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDguMC4wXG4gICAqL1xuICBzZXRGb290ZXJSb3dEZWYoZm9vdGVyUm93RGVmOiBDZGtGb290ZXJSb3dEZWYpIHtcbiAgICB0aGlzLl9jdXN0b21Gb290ZXJSb3dEZWZzID0gbmV3IFNldChbZm9vdGVyUm93RGVmXSk7XG4gICAgdGhpcy5fZm9vdGVyUm93RGVmQ2hhbmdlZCA9IHRydWU7XG4gIH1cblxuICAvKiogQWRkcyBhIGNvbHVtbiBkZWZpbml0aW9uIHRoYXQgd2FzIG5vdCBpbmNsdWRlZCBhcyBwYXJ0IG9mIHRoZSBjb250ZW50IGNoaWxkcmVuLiAqL1xuICBhZGRDb2x1bW5EZWYoY29sdW1uRGVmOiBDZGtDb2x1bW5EZWYpIHtcbiAgICB0aGlzLl9jdXN0b21Db2x1bW5EZWZzLmFkZChjb2x1bW5EZWYpO1xuICB9XG5cbiAgLyoqIFJlbW92ZXMgYSBjb2x1bW4gZGVmaW5pdGlvbiB0aGF0IHdhcyBub3QgaW5jbHVkZWQgYXMgcGFydCBvZiB0aGUgY29udGVudCBjaGlsZHJlbi4gKi9cbiAgcmVtb3ZlQ29sdW1uRGVmKGNvbHVtbkRlZjogQ2RrQ29sdW1uRGVmKSB7XG4gICAgdGhpcy5fY3VzdG9tQ29sdW1uRGVmcy5kZWxldGUoY29sdW1uRGVmKTtcbiAgfVxuXG4gIC8qKiBBZGRzIGEgcm93IGRlZmluaXRpb24gdGhhdCB3YXMgbm90IGluY2x1ZGVkIGFzIHBhcnQgb2YgdGhlIGNvbnRlbnQgY2hpbGRyZW4uICovXG4gIGFkZFJvd0RlZihyb3dEZWY6IENka1Jvd0RlZjxUPikge1xuICAgIHRoaXMuX2N1c3RvbVJvd0RlZnMuYWRkKHJvd0RlZik7XG4gIH1cblxuICAvKiogUmVtb3ZlcyBhIHJvdyBkZWZpbml0aW9uIHRoYXQgd2FzIG5vdCBpbmNsdWRlZCBhcyBwYXJ0IG9mIHRoZSBjb250ZW50IGNoaWxkcmVuLiAqL1xuICByZW1vdmVSb3dEZWYocm93RGVmOiBDZGtSb3dEZWY8VD4pIHtcbiAgICB0aGlzLl9jdXN0b21Sb3dEZWZzLmRlbGV0ZShyb3dEZWYpO1xuICB9XG5cbiAgLyoqIEFkZHMgYSBoZWFkZXIgcm93IGRlZmluaXRpb24gdGhhdCB3YXMgbm90IGluY2x1ZGVkIGFzIHBhcnQgb2YgdGhlIGNvbnRlbnQgY2hpbGRyZW4uICovXG4gIGFkZEhlYWRlclJvd0RlZihoZWFkZXJSb3dEZWY6IENka0hlYWRlclJvd0RlZikge1xuICAgIHRoaXMuX2N1c3RvbUhlYWRlclJvd0RlZnMuYWRkKGhlYWRlclJvd0RlZik7XG4gICAgdGhpcy5faGVhZGVyUm93RGVmQ2hhbmdlZCA9IHRydWU7XG4gIH1cblxuICAvKiogUmVtb3ZlcyBhIGhlYWRlciByb3cgZGVmaW5pdGlvbiB0aGF0IHdhcyBub3QgaW5jbHVkZWQgYXMgcGFydCBvZiB0aGUgY29udGVudCBjaGlsZHJlbi4gKi9cbiAgcmVtb3ZlSGVhZGVyUm93RGVmKGhlYWRlclJvd0RlZjogQ2RrSGVhZGVyUm93RGVmKSB7XG4gICAgdGhpcy5fY3VzdG9tSGVhZGVyUm93RGVmcy5kZWxldGUoaGVhZGVyUm93RGVmKTtcbiAgICB0aGlzLl9oZWFkZXJSb3dEZWZDaGFuZ2VkID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKiBBZGRzIGEgZm9vdGVyIHJvdyBkZWZpbml0aW9uIHRoYXQgd2FzIG5vdCBpbmNsdWRlZCBhcyBwYXJ0IG9mIHRoZSBjb250ZW50IGNoaWxkcmVuLiAqL1xuICBhZGRGb290ZXJSb3dEZWYoZm9vdGVyUm93RGVmOiBDZGtGb290ZXJSb3dEZWYpIHtcbiAgICB0aGlzLl9jdXN0b21Gb290ZXJSb3dEZWZzLmFkZChmb290ZXJSb3dEZWYpO1xuICAgIHRoaXMuX2Zvb3RlclJvd0RlZkNoYW5nZWQgPSB0cnVlO1xuICB9XG5cbiAgLyoqIFJlbW92ZXMgYSBmb290ZXIgcm93IGRlZmluaXRpb24gdGhhdCB3YXMgbm90IGluY2x1ZGVkIGFzIHBhcnQgb2YgdGhlIGNvbnRlbnQgY2hpbGRyZW4uICovXG4gIHJlbW92ZUZvb3RlclJvd0RlZihmb290ZXJSb3dEZWY6IENka0Zvb3RlclJvd0RlZikge1xuICAgIHRoaXMuX2N1c3RvbUZvb3RlclJvd0RlZnMuZGVsZXRlKGZvb3RlclJvd0RlZik7XG4gICAgdGhpcy5fZm9vdGVyUm93RGVmQ2hhbmdlZCA9IHRydWU7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgaGVhZGVyIHN0aWNreSBzdHlsZXMuIEZpcnN0IHJlc2V0cyBhbGwgYXBwbGllZCBzdHlsZXMgd2l0aCByZXNwZWN0IHRvIHRoZSBjZWxsc1xuICAgKiBzdGlja2luZyB0byB0aGUgdG9wLiBUaGVuLCBldmFsdWF0aW5nIHdoaWNoIGNlbGxzIG5lZWQgdG8gYmUgc3R1Y2sgdG8gdGhlIHRvcC4gVGhpcyBpc1xuICAgKiBhdXRvbWF0aWNhbGx5IGNhbGxlZCB3aGVuIHRoZSBoZWFkZXIgcm93IGNoYW5nZXMgaXRzIGRpc3BsYXllZCBzZXQgb2YgY29sdW1ucywgb3IgaWYgaXRzXG4gICAqIHN0aWNreSBpbnB1dCBjaGFuZ2VzLiBNYXkgYmUgY2FsbGVkIG1hbnVhbGx5IGZvciBjYXNlcyB3aGVyZSB0aGUgY2VsbCBjb250ZW50IGNoYW5nZXMgb3V0c2lkZVxuICAgKiBvZiB0aGVzZSBldmVudHMuXG4gICAqL1xuICB1cGRhdGVTdGlja3lIZWFkZXJSb3dTdHlsZXMoKTogdm9pZCB7XG4gICAgY29uc3QgaGVhZGVyUm93cyA9IHRoaXMuX2dldFJlbmRlcmVkUm93cyh0aGlzLl9oZWFkZXJSb3dPdXRsZXQpO1xuICAgIGNvbnN0IHRhYmxlRWxlbWVudCA9IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudCBhcyBIVE1MRWxlbWVudDtcblxuICAgIC8vIEhpZGUgdGhlIHRoZWFkIGVsZW1lbnQgaWYgdGhlcmUgYXJlIG5vIGhlYWRlciByb3dzLiBUaGlzIGlzIG5lY2Vzc2FyeSB0byBzYXRpc2Z5XG4gICAgLy8gb3ZlcnplYWxvdXMgYTExeSBjaGVja2VycyB0aGF0IGZhaWwgYmVjYXVzZSB0aGUgYHJvd2dyb3VwYCBlbGVtZW50IGRvZXMgbm90IGNvbnRhaW5cbiAgICAvLyByZXF1aXJlZCBjaGlsZCBgcm93YC5cbiAgICBjb25zdCB0aGVhZCA9IHRhYmxlRWxlbWVudC5xdWVyeVNlbGVjdG9yKCd0aGVhZCcpO1xuICAgIGlmICh0aGVhZCkge1xuICAgICAgdGhlYWQuc3R5bGUuZGlzcGxheSA9IGhlYWRlclJvd3MubGVuZ3RoID8gJycgOiAnbm9uZSc7XG4gICAgfVxuXG4gICAgY29uc3Qgc3RpY2t5U3RhdGVzID0gdGhpcy5faGVhZGVyUm93RGVmcy5tYXAoZGVmID0+IGRlZi5zdGlja3kpO1xuICAgIHRoaXMuX3N0aWNreVN0eWxlci5jbGVhclN0aWNreVBvc2l0aW9uaW5nKGhlYWRlclJvd3MsIFsndG9wJ10pO1xuICAgIHRoaXMuX3N0aWNreVN0eWxlci5zdGlja1Jvd3MoaGVhZGVyUm93cywgc3RpY2t5U3RhdGVzLCAndG9wJyk7XG5cbiAgICAvLyBSZXNldCB0aGUgZGlydHkgc3RhdGUgb2YgdGhlIHN0aWNreSBpbnB1dCBjaGFuZ2Ugc2luY2UgaXQgaGFzIGJlZW4gdXNlZC5cbiAgICB0aGlzLl9oZWFkZXJSb3dEZWZzLmZvckVhY2goZGVmID0+IGRlZi5yZXNldFN0aWNreUNoYW5nZWQoKSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgZm9vdGVyIHN0aWNreSBzdHlsZXMuIEZpcnN0IHJlc2V0cyBhbGwgYXBwbGllZCBzdHlsZXMgd2l0aCByZXNwZWN0IHRvIHRoZSBjZWxsc1xuICAgKiBzdGlja2luZyB0byB0aGUgYm90dG9tLiBUaGVuLCBldmFsdWF0aW5nIHdoaWNoIGNlbGxzIG5lZWQgdG8gYmUgc3R1Y2sgdG8gdGhlIGJvdHRvbS4gVGhpcyBpc1xuICAgKiBhdXRvbWF0aWNhbGx5IGNhbGxlZCB3aGVuIHRoZSBmb290ZXIgcm93IGNoYW5nZXMgaXRzIGRpc3BsYXllZCBzZXQgb2YgY29sdW1ucywgb3IgaWYgaXRzXG4gICAqIHN0aWNreSBpbnB1dCBjaGFuZ2VzLiBNYXkgYmUgY2FsbGVkIG1hbnVhbGx5IGZvciBjYXNlcyB3aGVyZSB0aGUgY2VsbCBjb250ZW50IGNoYW5nZXMgb3V0c2lkZVxuICAgKiBvZiB0aGVzZSBldmVudHMuXG4gICAqL1xuICB1cGRhdGVTdGlja3lGb290ZXJSb3dTdHlsZXMoKTogdm9pZCB7XG4gICAgY29uc3QgZm9vdGVyUm93cyA9IHRoaXMuX2dldFJlbmRlcmVkUm93cyh0aGlzLl9mb290ZXJSb3dPdXRsZXQpO1xuICAgIGNvbnN0IHRhYmxlRWxlbWVudCA9IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudCBhcyBIVE1MRWxlbWVudDtcblxuICAgIC8vIEhpZGUgdGhlIHRmb290IGVsZW1lbnQgaWYgdGhlcmUgYXJlIG5vIGZvb3RlciByb3dzLiBUaGlzIGlzIG5lY2Vzc2FyeSB0byBzYXRpc2Z5XG4gICAgLy8gb3ZlcnplYWxvdXMgYTExeSBjaGVja2VycyB0aGF0IGZhaWwgYmVjYXVzZSB0aGUgYHJvd2dyb3VwYCBlbGVtZW50IGRvZXMgbm90IGNvbnRhaW5cbiAgICAvLyByZXF1aXJlZCBjaGlsZCBgcm93YC5cbiAgICBjb25zdCB0Zm9vdCA9IHRhYmxlRWxlbWVudC5xdWVyeVNlbGVjdG9yKCd0Zm9vdCcpO1xuICAgIGlmICh0Zm9vdCkge1xuICAgICAgdGZvb3Quc3R5bGUuZGlzcGxheSA9IGZvb3RlclJvd3MubGVuZ3RoID8gJycgOiAnbm9uZSc7XG4gICAgfVxuXG4gICAgY29uc3Qgc3RpY2t5U3RhdGVzID0gdGhpcy5fZm9vdGVyUm93RGVmcy5tYXAoZGVmID0+IGRlZi5zdGlja3kpO1xuICAgIHRoaXMuX3N0aWNreVN0eWxlci5jbGVhclN0aWNreVBvc2l0aW9uaW5nKGZvb3RlclJvd3MsIFsnYm90dG9tJ10pO1xuICAgIHRoaXMuX3N0aWNreVN0eWxlci5zdGlja1Jvd3MoZm9vdGVyUm93cywgc3RpY2t5U3RhdGVzLCAnYm90dG9tJyk7XG4gICAgdGhpcy5fc3RpY2t5U3R5bGVyLnVwZGF0ZVN0aWNreUZvb3RlckNvbnRhaW5lcih0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsIHN0aWNreVN0YXRlcyk7XG5cbiAgICAvLyBSZXNldCB0aGUgZGlydHkgc3RhdGUgb2YgdGhlIHN0aWNreSBpbnB1dCBjaGFuZ2Ugc2luY2UgaXQgaGFzIGJlZW4gdXNlZC5cbiAgICB0aGlzLl9mb290ZXJSb3dEZWZzLmZvckVhY2goZGVmID0+IGRlZi5yZXNldFN0aWNreUNoYW5nZWQoKSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgY29sdW1uIHN0aWNreSBzdHlsZXMuIEZpcnN0IHJlc2V0cyBhbGwgYXBwbGllZCBzdHlsZXMgd2l0aCByZXNwZWN0IHRvIHRoZSBjZWxsc1xuICAgKiBzdGlja2luZyB0byB0aGUgbGVmdCBhbmQgcmlnaHQuIFRoZW4gc3RpY2t5IHN0eWxlcyBhcmUgYWRkZWQgZm9yIHRoZSBsZWZ0IGFuZCByaWdodCBhY2NvcmRpbmdcbiAgICogdG8gdGhlIGNvbHVtbiBkZWZpbml0aW9ucyBmb3IgZWFjaCBjZWxsIGluIGVhY2ggcm93LiBUaGlzIGlzIGF1dG9tYXRpY2FsbHkgY2FsbGVkIHdoZW5cbiAgICogdGhlIGRhdGEgc291cmNlIHByb3ZpZGVzIGEgbmV3IHNldCBvZiBkYXRhIG9yIHdoZW4gYSBjb2x1bW4gZGVmaW5pdGlvbiBjaGFuZ2VzIGl0cyBzdGlja3lcbiAgICogaW5wdXQuIE1heSBiZSBjYWxsZWQgbWFudWFsbHkgZm9yIGNhc2VzIHdoZXJlIHRoZSBjZWxsIGNvbnRlbnQgY2hhbmdlcyBvdXRzaWRlIG9mIHRoZXNlIGV2ZW50cy5cbiAgICovXG4gIHVwZGF0ZVN0aWNreUNvbHVtblN0eWxlcygpIHtcbiAgICBjb25zdCBoZWFkZXJSb3dzID0gdGhpcy5fZ2V0UmVuZGVyZWRSb3dzKHRoaXMuX2hlYWRlclJvd091dGxldCk7XG4gICAgY29uc3QgZGF0YVJvd3MgPSB0aGlzLl9nZXRSZW5kZXJlZFJvd3ModGhpcy5fcm93T3V0bGV0KTtcbiAgICBjb25zdCBmb290ZXJSb3dzID0gdGhpcy5fZ2V0UmVuZGVyZWRSb3dzKHRoaXMuX2Zvb3RlclJvd091dGxldCk7XG5cbiAgICAvLyBDbGVhciB0aGUgbGVmdCBhbmQgcmlnaHQgcG9zaXRpb25pbmcgZnJvbSBhbGwgY29sdW1ucyBpbiB0aGUgdGFibGUgYWNyb3NzIGFsbCByb3dzIHNpbmNlXG4gICAgLy8gc3RpY2t5IGNvbHVtbnMgc3BhbiBhY3Jvc3MgYWxsIHRhYmxlIHNlY3Rpb25zIChoZWFkZXIsIGRhdGEsIGZvb3RlcilcbiAgICB0aGlzLl9zdGlja3lTdHlsZXIuY2xlYXJTdGlja3lQb3NpdGlvbmluZyhcbiAgICAgICAgWy4uLmhlYWRlclJvd3MsIC4uLmRhdGFSb3dzLCAuLi5mb290ZXJSb3dzXSwgWydsZWZ0JywgJ3JpZ2h0J10pO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBzdGlja3kgc3R5bGVzIGZvciBlYWNoIGhlYWRlciByb3cgZGVwZW5kaW5nIG9uIHRoZSBkZWYncyBzdGlja3kgc3RhdGVcbiAgICBoZWFkZXJSb3dzLmZvckVhY2goKGhlYWRlclJvdywgaSkgPT4ge1xuICAgICAgdGhpcy5fYWRkU3RpY2t5Q29sdW1uU3R5bGVzKFtoZWFkZXJSb3ddLCB0aGlzLl9oZWFkZXJSb3dEZWZzW2ldKTtcbiAgICB9KTtcblxuICAgIC8vIFVwZGF0ZSB0aGUgc3RpY2t5IHN0eWxlcyBmb3IgZWFjaCBkYXRhIHJvdyBkZXBlbmRpbmcgb24gaXRzIGRlZidzIHN0aWNreSBzdGF0ZVxuICAgIHRoaXMuX3Jvd0RlZnMuZm9yRWFjaChyb3dEZWYgPT4ge1xuICAgICAgLy8gQ29sbGVjdCBhbGwgdGhlIHJvd3MgcmVuZGVyZWQgd2l0aCB0aGlzIHJvdyBkZWZpbml0aW9uLlxuICAgICAgY29uc3Qgcm93czogSFRNTEVsZW1lbnRbXSA9IFtdO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhUm93cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodGhpcy5fcmVuZGVyUm93c1tpXS5yb3dEZWYgPT09IHJvd0RlZikge1xuICAgICAgICAgIHJvd3MucHVzaChkYXRhUm93c1tpXSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5fYWRkU3RpY2t5Q29sdW1uU3R5bGVzKHJvd3MsIHJvd0RlZik7XG4gICAgfSk7XG5cbiAgICAvLyBVcGRhdGUgdGhlIHN0aWNreSBzdHlsZXMgZm9yIGVhY2ggZm9vdGVyIHJvdyBkZXBlbmRpbmcgb24gdGhlIGRlZidzIHN0aWNreSBzdGF0ZVxuICAgIGZvb3RlclJvd3MuZm9yRWFjaCgoZm9vdGVyUm93LCBpKSA9PiB7XG4gICAgICB0aGlzLl9hZGRTdGlja3lDb2x1bW5TdHlsZXMoW2Zvb3RlclJvd10sIHRoaXMuX2Zvb3RlclJvd0RlZnNbaV0pO1xuICAgIH0pO1xuXG4gICAgLy8gUmVzZXQgdGhlIGRpcnR5IHN0YXRlIG9mIHRoZSBzdGlja3kgaW5wdXQgY2hhbmdlIHNpbmNlIGl0IGhhcyBiZWVuIHVzZWQuXG4gICAgQXJyYXkuZnJvbSh0aGlzLl9jb2x1bW5EZWZzQnlOYW1lLnZhbHVlcygpKS5mb3JFYWNoKGRlZiA9PiBkZWYucmVzZXRTdGlja3lDaGFuZ2VkKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgbGlzdCBvZiBSZW5kZXJSb3cgb2JqZWN0cyB0byByZW5kZXIgYWNjb3JkaW5nIHRvIHRoZSBjdXJyZW50IGxpc3Qgb2YgZGF0YSBhbmQgZGVmaW5lZFxuICAgKiByb3cgZGVmaW5pdGlvbnMuIElmIHRoZSBwcmV2aW91cyBsaXN0IGFscmVhZHkgY29udGFpbmVkIGEgcGFydGljdWxhciBwYWlyLCBpdCBzaG91bGQgYmUgcmV1c2VkXG4gICAqIHNvIHRoYXQgdGhlIGRpZmZlciBlcXVhdGVzIHRoZWlyIHJlZmVyZW5jZXMuXG4gICAqL1xuICBwcml2YXRlIF9nZXRBbGxSZW5kZXJSb3dzKCk6IFJlbmRlclJvdzxUPltdIHtcbiAgICBjb25zdCByZW5kZXJSb3dzOiBSZW5kZXJSb3c8VD5bXSA9IFtdO1xuXG4gICAgLy8gU3RvcmUgdGhlIGNhY2hlIGFuZCBjcmVhdGUgYSBuZXcgb25lLiBBbnkgcmUtdXNlZCBSZW5kZXJSb3cgb2JqZWN0cyB3aWxsIGJlIG1vdmVkIGludG8gdGhlXG4gICAgLy8gbmV3IGNhY2hlIHdoaWxlIHVudXNlZCBvbmVzIGNhbiBiZSBwaWNrZWQgdXAgYnkgZ2FyYmFnZSBjb2xsZWN0aW9uLlxuICAgIGNvbnN0IHByZXZDYWNoZWRSZW5kZXJSb3dzID0gdGhpcy5fY2FjaGVkUmVuZGVyUm93c01hcDtcbiAgICB0aGlzLl9jYWNoZWRSZW5kZXJSb3dzTWFwID0gbmV3IE1hcCgpO1xuXG4gICAgLy8gRm9yIGVhY2ggZGF0YSBvYmplY3QsIGdldCB0aGUgbGlzdCBvZiByb3dzIHRoYXQgc2hvdWxkIGJlIHJlbmRlcmVkLCByZXByZXNlbnRlZCBieSB0aGVcbiAgICAvLyByZXNwZWN0aXZlIGBSZW5kZXJSb3dgIG9iamVjdCB3aGljaCBpcyB0aGUgcGFpciBvZiBgZGF0YWAgYW5kIGBDZGtSb3dEZWZgLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IGRhdGEgPSB0aGlzLl9kYXRhW2ldO1xuICAgICAgY29uc3QgcmVuZGVyUm93c0ZvckRhdGEgPSB0aGlzLl9nZXRSZW5kZXJSb3dzRm9yRGF0YShkYXRhLCBpLCBwcmV2Q2FjaGVkUmVuZGVyUm93cy5nZXQoZGF0YSkpO1xuXG4gICAgICBpZiAoIXRoaXMuX2NhY2hlZFJlbmRlclJvd3NNYXAuaGFzKGRhdGEpKSB7XG4gICAgICAgIHRoaXMuX2NhY2hlZFJlbmRlclJvd3NNYXAuc2V0KGRhdGEsIG5ldyBXZWFrTWFwKCkpO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHJlbmRlclJvd3NGb3JEYXRhLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGxldCByZW5kZXJSb3cgPSByZW5kZXJSb3dzRm9yRGF0YVtqXTtcblxuICAgICAgICBjb25zdCBjYWNoZSA9IHRoaXMuX2NhY2hlZFJlbmRlclJvd3NNYXAuZ2V0KHJlbmRlclJvdy5kYXRhKSE7XG4gICAgICAgIGlmIChjYWNoZS5oYXMocmVuZGVyUm93LnJvd0RlZikpIHtcbiAgICAgICAgICBjYWNoZS5nZXQocmVuZGVyUm93LnJvd0RlZikhLnB1c2gocmVuZGVyUm93KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjYWNoZS5zZXQocmVuZGVyUm93LnJvd0RlZiwgW3JlbmRlclJvd10pO1xuICAgICAgICB9XG4gICAgICAgIHJlbmRlclJvd3MucHVzaChyZW5kZXJSb3cpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZW5kZXJSb3dzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSBsaXN0IG9mIGBSZW5kZXJSb3c8VD5gIGZvciB0aGUgcHJvdmlkZWQgZGF0YSBvYmplY3QgYW5kIGFueSBgQ2RrUm93RGVmYCBvYmplY3RzIHRoYXRcbiAgICogc2hvdWxkIGJlIHJlbmRlcmVkIGZvciB0aGlzIGRhdGEuIFJldXNlcyB0aGUgY2FjaGVkIFJlbmRlclJvdyBvYmplY3RzIGlmIHRoZXkgbWF0Y2ggdGhlIHNhbWVcbiAgICogYChULCBDZGtSb3dEZWYpYCBwYWlyLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0UmVuZGVyUm93c0ZvckRhdGEoXG4gICAgICBkYXRhOiBULCBkYXRhSW5kZXg6IG51bWJlciwgY2FjaGU/OiBXZWFrTWFwPENka1Jvd0RlZjxUPiwgUmVuZGVyUm93PFQ+W10+KTogUmVuZGVyUm93PFQ+W10ge1xuICAgIGNvbnN0IHJvd0RlZnMgPSB0aGlzLl9nZXRSb3dEZWZzKGRhdGEsIGRhdGFJbmRleCk7XG5cbiAgICByZXR1cm4gcm93RGVmcy5tYXAocm93RGVmID0+IHtcbiAgICAgIGNvbnN0IGNhY2hlZFJlbmRlclJvd3MgPSAoY2FjaGUgJiYgY2FjaGUuaGFzKHJvd0RlZikpID8gY2FjaGUuZ2V0KHJvd0RlZikhIDogW107XG4gICAgICBpZiAoY2FjaGVkUmVuZGVyUm93cy5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgZGF0YVJvdyA9IGNhY2hlZFJlbmRlclJvd3Muc2hpZnQoKSE7XG4gICAgICAgIGRhdGFSb3cuZGF0YUluZGV4ID0gZGF0YUluZGV4O1xuICAgICAgICByZXR1cm4gZGF0YVJvdztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB7ZGF0YSwgcm93RGVmLCBkYXRhSW5kZXh9O1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqIFVwZGF0ZSB0aGUgbWFwIGNvbnRhaW5pbmcgdGhlIGNvbnRlbnQncyBjb2x1bW4gZGVmaW5pdGlvbnMuICovXG4gIHByaXZhdGUgX2NhY2hlQ29sdW1uRGVmcygpIHtcbiAgICB0aGlzLl9jb2x1bW5EZWZzQnlOYW1lLmNsZWFyKCk7XG5cbiAgICBjb25zdCBjb2x1bW5EZWZzID0gbWVyZ2VBcnJheUFuZFNldChcbiAgICAgICAgdGhpcy5fZ2V0T3duRGVmcyh0aGlzLl9jb250ZW50Q29sdW1uRGVmcyksIHRoaXMuX2N1c3RvbUNvbHVtbkRlZnMpO1xuICAgIGNvbHVtbkRlZnMuZm9yRWFjaChjb2x1bW5EZWYgPT4ge1xuICAgICAgaWYgKHRoaXMuX2NvbHVtbkRlZnNCeU5hbWUuaGFzKGNvbHVtbkRlZi5uYW1lKSkge1xuICAgICAgICB0aHJvdyBnZXRUYWJsZUR1cGxpY2F0ZUNvbHVtbk5hbWVFcnJvcihjb2x1bW5EZWYubmFtZSk7XG4gICAgICB9XG4gICAgICB0aGlzLl9jb2x1bW5EZWZzQnlOYW1lLnNldChjb2x1bW5EZWYubmFtZSwgY29sdW1uRGVmKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBVcGRhdGUgdGhlIGxpc3Qgb2YgYWxsIGF2YWlsYWJsZSByb3cgZGVmaW5pdGlvbnMgdGhhdCBjYW4gYmUgdXNlZC4gKi9cbiAgcHJpdmF0ZSBfY2FjaGVSb3dEZWZzKCkge1xuICAgIHRoaXMuX2hlYWRlclJvd0RlZnMgPSBtZXJnZUFycmF5QW5kU2V0KFxuICAgICAgICB0aGlzLl9nZXRPd25EZWZzKHRoaXMuX2NvbnRlbnRIZWFkZXJSb3dEZWZzKSwgdGhpcy5fY3VzdG9tSGVhZGVyUm93RGVmcyk7XG4gICAgdGhpcy5fZm9vdGVyUm93RGVmcyA9IG1lcmdlQXJyYXlBbmRTZXQoXG4gICAgICAgIHRoaXMuX2dldE93bkRlZnModGhpcy5fY29udGVudEZvb3RlclJvd0RlZnMpLCB0aGlzLl9jdXN0b21Gb290ZXJSb3dEZWZzKTtcbiAgICB0aGlzLl9yb3dEZWZzID0gbWVyZ2VBcnJheUFuZFNldChcbiAgICAgICAgdGhpcy5fZ2V0T3duRGVmcyh0aGlzLl9jb250ZW50Um93RGVmcyksIHRoaXMuX2N1c3RvbVJvd0RlZnMpO1xuXG4gICAgLy8gQWZ0ZXIgYWxsIHJvdyBkZWZpbml0aW9ucyBhcmUgZGV0ZXJtaW5lZCwgZmluZCB0aGUgcm93IGRlZmluaXRpb24gdG8gYmUgY29uc2lkZXJlZCBkZWZhdWx0LlxuICAgIGNvbnN0IGRlZmF1bHRSb3dEZWZzID0gdGhpcy5fcm93RGVmcy5maWx0ZXIoZGVmID0+ICFkZWYud2hlbik7XG4gICAgaWYgKCF0aGlzLm11bHRpVGVtcGxhdGVEYXRhUm93cyAmJiBkZWZhdWx0Um93RGVmcy5sZW5ndGggPiAxKSB7XG4gICAgICB0aHJvdyBnZXRUYWJsZU11bHRpcGxlRGVmYXVsdFJvd0RlZnNFcnJvcigpO1xuICAgIH1cbiAgICB0aGlzLl9kZWZhdWx0Um93RGVmID0gZGVmYXVsdFJvd0RlZnNbMF07XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgdGhlIGhlYWRlciwgZGF0YSwgb3IgZm9vdGVyIHJvd3MgaGF2ZSBjaGFuZ2VkIHdoYXQgY29sdW1ucyB0aGV5IHdhbnQgdG8gZGlzcGxheSBvclxuICAgKiB3aGV0aGVyIHRoZSBzdGlja3kgc3RhdGVzIGhhdmUgY2hhbmdlZCBmb3IgdGhlIGhlYWRlciBvciBmb290ZXIuIElmIHRoZXJlIGlzIGEgZGlmZiwgdGhlblxuICAgKiByZS1yZW5kZXIgdGhhdCBzZWN0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVuZGVyVXBkYXRlZENvbHVtbnMoKSB7XG4gICAgY29uc3QgY29sdW1uc0RpZmZSZWR1Y2VyID0gKGFjYzogYm9vbGVhbiwgZGVmOiBCYXNlUm93RGVmKSA9PiBhY2MgfHwgISFkZWYuZ2V0Q29sdW1uc0RpZmYoKTtcblxuICAgIC8vIEZvcmNlIHJlLXJlbmRlciBkYXRhIHJvd3MgaWYgdGhlIGxpc3Qgb2YgY29sdW1uIGRlZmluaXRpb25zIGhhdmUgY2hhbmdlZC5cbiAgICBpZiAodGhpcy5fcm93RGVmcy5yZWR1Y2UoY29sdW1uc0RpZmZSZWR1Y2VyLCBmYWxzZSkpIHtcbiAgICAgIHRoaXMuX2ZvcmNlUmVuZGVyRGF0YVJvd3MoKTtcbiAgICB9XG5cbiAgICAvLyBGb3JjZSByZS1yZW5kZXIgaGVhZGVyL2Zvb3RlciByb3dzIGlmIHRoZSBsaXN0IG9mIGNvbHVtbiBkZWZpbml0aW9ucyBoYXZlIGNoYW5nZWQuLlxuICAgIGlmICh0aGlzLl9oZWFkZXJSb3dEZWZzLnJlZHVjZShjb2x1bW5zRGlmZlJlZHVjZXIsIGZhbHNlKSkge1xuICAgICAgdGhpcy5fZm9yY2VSZW5kZXJIZWFkZXJSb3dzKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2Zvb3RlclJvd0RlZnMucmVkdWNlKGNvbHVtbnNEaWZmUmVkdWNlciwgZmFsc2UpKSB7XG4gICAgICB0aGlzLl9mb3JjZVJlbmRlckZvb3RlclJvd3MoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU3dpdGNoIHRvIHRoZSBwcm92aWRlZCBkYXRhIHNvdXJjZSBieSByZXNldHRpbmcgdGhlIGRhdGEgYW5kIHVuc3Vic2NyaWJpbmcgZnJvbSB0aGUgY3VycmVudFxuICAgKiByZW5kZXIgY2hhbmdlIHN1YnNjcmlwdGlvbiBpZiBvbmUgZXhpc3RzLiBJZiB0aGUgZGF0YSBzb3VyY2UgaXMgbnVsbCwgaW50ZXJwcmV0IHRoaXMgYnlcbiAgICogY2xlYXJpbmcgdGhlIHJvdyBvdXRsZXQuIE90aGVyd2lzZSBzdGFydCBsaXN0ZW5pbmcgZm9yIG5ldyBkYXRhLlxuICAgKi9cbiAgcHJpdmF0ZSBfc3dpdGNoRGF0YVNvdXJjZShkYXRhU291cmNlOiBDZGtUYWJsZURhdGFTb3VyY2VJbnB1dDxUPikge1xuICAgIHRoaXMuX2RhdGEgPSBbXTtcblxuICAgIGlmIChpc0RhdGFTb3VyY2UodGhpcy5kYXRhU291cmNlKSkge1xuICAgICAgdGhpcy5kYXRhU291cmNlLmRpc2Nvbm5lY3QodGhpcyk7XG4gICAgfVxuXG4gICAgLy8gU3RvcCBsaXN0ZW5pbmcgZm9yIGRhdGEgZnJvbSB0aGUgcHJldmlvdXMgZGF0YSBzb3VyY2UuXG4gICAgaWYgKHRoaXMuX3JlbmRlckNoYW5nZVN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fcmVuZGVyQ2hhbmdlU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLl9yZW5kZXJDaGFuZ2VTdWJzY3JpcHRpb24gPSBudWxsO1xuICAgIH1cblxuICAgIGlmICghZGF0YVNvdXJjZSkge1xuICAgICAgaWYgKHRoaXMuX2RhdGFEaWZmZXIpIHtcbiAgICAgICAgdGhpcy5fZGF0YURpZmZlci5kaWZmKFtdKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3Jvd091dGxldC52aWV3Q29udGFpbmVyLmNsZWFyKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fZGF0YVNvdXJjZSA9IGRhdGFTb3VyY2U7XG4gIH1cblxuICAvKiogU2V0IHVwIGEgc3Vic2NyaXB0aW9uIGZvciB0aGUgZGF0YSBwcm92aWRlZCBieSB0aGUgZGF0YSBzb3VyY2UuICovXG4gIHByaXZhdGUgX29ic2VydmVSZW5kZXJDaGFuZ2VzKCkge1xuICAgIC8vIElmIG5vIGRhdGEgc291cmNlIGhhcyBiZWVuIHNldCwgdGhlcmUgaXMgbm90aGluZyB0byBvYnNlcnZlIGZvciBjaGFuZ2VzLlxuICAgIGlmICghdGhpcy5kYXRhU291cmNlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IGRhdGFTdHJlYW06IE9ic2VydmFibGU8VFtdfFJlYWRvbmx5QXJyYXk8VD4+fHVuZGVmaW5lZDtcblxuICAgIGlmIChpc0RhdGFTb3VyY2UodGhpcy5kYXRhU291cmNlKSkge1xuICAgICAgZGF0YVN0cmVhbSA9IHRoaXMuZGF0YVNvdXJjZS5jb25uZWN0KHRoaXMpO1xuICAgIH0gZWxzZSBpZiAoaXNPYnNlcnZhYmxlKHRoaXMuZGF0YVNvdXJjZSkpIHtcbiAgICAgIGRhdGFTdHJlYW0gPSB0aGlzLmRhdGFTb3VyY2U7XG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHRoaXMuZGF0YVNvdXJjZSkpIHtcbiAgICAgIGRhdGFTdHJlYW0gPSBvYnNlcnZhYmxlT2YodGhpcy5kYXRhU291cmNlKTtcbiAgICB9XG5cbiAgICBpZiAoZGF0YVN0cmVhbSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBnZXRUYWJsZVVua25vd25EYXRhU291cmNlRXJyb3IoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9yZW5kZXJDaGFuZ2VTdWJzY3JpcHRpb24gPSBkYXRhU3RyZWFtLnBpcGUodGFrZVVudGlsKHRoaXMuX29uRGVzdHJveSkpLnN1YnNjcmliZShkYXRhID0+IHtcbiAgICAgIHRoaXMuX2RhdGEgPSBkYXRhIHx8IFtdO1xuICAgICAgdGhpcy5yZW5kZXJSb3dzKCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIGFueSBleGlzdGluZyBjb250ZW50IGluIHRoZSBoZWFkZXIgcm93IG91dGxldCBhbmQgY3JlYXRlcyBhIG5ldyBlbWJlZGRlZCB2aWV3XG4gICAqIGluIHRoZSBvdXRsZXQgdXNpbmcgdGhlIGhlYWRlciByb3cgZGVmaW5pdGlvbi5cbiAgICovXG4gIHByaXZhdGUgX2ZvcmNlUmVuZGVySGVhZGVyUm93cygpIHtcbiAgICAvLyBDbGVhciB0aGUgaGVhZGVyIHJvdyBvdXRsZXQgaWYgYW55IGNvbnRlbnQgZXhpc3RzLlxuICAgIGlmICh0aGlzLl9oZWFkZXJSb3dPdXRsZXQudmlld0NvbnRhaW5lci5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLl9oZWFkZXJSb3dPdXRsZXQudmlld0NvbnRhaW5lci5jbGVhcigpO1xuICAgIH1cblxuICAgIHRoaXMuX2hlYWRlclJvd0RlZnMuZm9yRWFjaCgoZGVmLCBpKSA9PiB0aGlzLl9yZW5kZXJSb3codGhpcy5faGVhZGVyUm93T3V0bGV0LCBkZWYsIGkpKTtcbiAgICB0aGlzLnVwZGF0ZVN0aWNreUhlYWRlclJvd1N0eWxlcygpO1xuICAgIHRoaXMudXBkYXRlU3RpY2t5Q29sdW1uU3R5bGVzKCk7XG4gIH1cbiAgLyoqXG4gICAqIENsZWFycyBhbnkgZXhpc3RpbmcgY29udGVudCBpbiB0aGUgZm9vdGVyIHJvdyBvdXRsZXQgYW5kIGNyZWF0ZXMgYSBuZXcgZW1iZWRkZWQgdmlld1xuICAgKiBpbiB0aGUgb3V0bGV0IHVzaW5nIHRoZSBmb290ZXIgcm93IGRlZmluaXRpb24uXG4gICAqL1xuICBwcml2YXRlIF9mb3JjZVJlbmRlckZvb3RlclJvd3MoKSB7XG4gICAgLy8gQ2xlYXIgdGhlIGZvb3RlciByb3cgb3V0bGV0IGlmIGFueSBjb250ZW50IGV4aXN0cy5cbiAgICBpZiAodGhpcy5fZm9vdGVyUm93T3V0bGV0LnZpZXdDb250YWluZXIubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5fZm9vdGVyUm93T3V0bGV0LnZpZXdDb250YWluZXIuY2xlYXIoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9mb290ZXJSb3dEZWZzLmZvckVhY2goKGRlZiwgaSkgPT4gdGhpcy5fcmVuZGVyUm93KHRoaXMuX2Zvb3RlclJvd091dGxldCwgZGVmLCBpKSk7XG4gICAgdGhpcy51cGRhdGVTdGlja3lGb290ZXJSb3dTdHlsZXMoKTtcbiAgICB0aGlzLnVwZGF0ZVN0aWNreUNvbHVtblN0eWxlcygpO1xuICB9XG5cbiAgLyoqIEFkZHMgdGhlIHN0aWNreSBjb2x1bW4gc3R5bGVzIGZvciB0aGUgcm93cyBhY2NvcmRpbmcgdG8gdGhlIGNvbHVtbnMnIHN0aWNrIHN0YXRlcy4gKi9cbiAgcHJpdmF0ZSBfYWRkU3RpY2t5Q29sdW1uU3R5bGVzKHJvd3M6IEhUTUxFbGVtZW50W10sIHJvd0RlZjogQmFzZVJvd0RlZikge1xuICAgIGNvbnN0IGNvbHVtbkRlZnMgPSBBcnJheS5mcm9tKHJvd0RlZi5jb2x1bW5zIHx8IFtdKS5tYXAoY29sdW1uTmFtZSA9PiB7XG4gICAgICBjb25zdCBjb2x1bW5EZWYgPSB0aGlzLl9jb2x1bW5EZWZzQnlOYW1lLmdldChjb2x1bW5OYW1lKTtcbiAgICAgIGlmICghY29sdW1uRGVmKSB7XG4gICAgICAgIHRocm93IGdldFRhYmxlVW5rbm93bkNvbHVtbkVycm9yKGNvbHVtbk5hbWUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNvbHVtbkRlZiE7XG4gICAgfSk7XG4gICAgY29uc3Qgc3RpY2t5U3RhcnRTdGF0ZXMgPSBjb2x1bW5EZWZzLm1hcChjb2x1bW5EZWYgPT4gY29sdW1uRGVmLnN0aWNreSk7XG4gICAgY29uc3Qgc3RpY2t5RW5kU3RhdGVzID0gY29sdW1uRGVmcy5tYXAoY29sdW1uRGVmID0+IGNvbHVtbkRlZi5zdGlja3lFbmQpO1xuICAgIHRoaXMuX3N0aWNreVN0eWxlci51cGRhdGVTdGlja3lDb2x1bW5zKHJvd3MsIHN0aWNreVN0YXJ0U3RhdGVzLCBzdGlja3lFbmRTdGF0ZXMpO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIGxpc3Qgb2Ygcm93cyB0aGF0IGhhdmUgYmVlbiByZW5kZXJlZCBpbiB0aGUgcm93IG91dGxldC4gKi9cbiAgX2dldFJlbmRlcmVkUm93cyhyb3dPdXRsZXQ6IFJvd091dGxldCk6IEhUTUxFbGVtZW50W10ge1xuICAgIGNvbnN0IHJlbmRlcmVkUm93czogSFRNTEVsZW1lbnRbXSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByb3dPdXRsZXQudmlld0NvbnRhaW5lci5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgdmlld1JlZiA9IChyb3dPdXRsZXQudmlld0NvbnRhaW5lci5nZXQoaSkhIGFzIEVtYmVkZGVkVmlld1JlZjxhbnk+KTtcbiAgICAgIHJlbmRlcmVkUm93cy5wdXNoKHZpZXdSZWYucm9vdE5vZGVzWzBdKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVuZGVyZWRSb3dzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgbWF0Y2hpbmcgcm93IGRlZmluaXRpb25zIHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIHRoaXMgcm93IGRhdGEuIElmIHRoZXJlIGlzIG9ubHlcbiAgICogb25lIHJvdyBkZWZpbml0aW9uLCBpdCBpcyByZXR1cm5lZC4gT3RoZXJ3aXNlLCBmaW5kIHRoZSByb3cgZGVmaW5pdGlvbnMgdGhhdCBoYXMgYSB3aGVuXG4gICAqIHByZWRpY2F0ZSB0aGF0IHJldHVybnMgdHJ1ZSB3aXRoIHRoZSBkYXRhLiBJZiBub25lIHJldHVybiB0cnVlLCByZXR1cm4gdGhlIGRlZmF1bHQgcm93XG4gICAqIGRlZmluaXRpb24uXG4gICAqL1xuICBfZ2V0Um93RGVmcyhkYXRhOiBULCBkYXRhSW5kZXg6IG51bWJlcik6IENka1Jvd0RlZjxUPltdIHtcbiAgICBpZiAodGhpcy5fcm93RGVmcy5sZW5ndGggPT0gMSkge1xuICAgICAgcmV0dXJuIFt0aGlzLl9yb3dEZWZzWzBdXTtcbiAgICB9XG5cbiAgICBsZXQgcm93RGVmczogQ2RrUm93RGVmPFQ+W10gPSBbXTtcbiAgICBpZiAodGhpcy5tdWx0aVRlbXBsYXRlRGF0YVJvd3MpIHtcbiAgICAgIHJvd0RlZnMgPSB0aGlzLl9yb3dEZWZzLmZpbHRlcihkZWYgPT4gIWRlZi53aGVuIHx8IGRlZi53aGVuKGRhdGFJbmRleCwgZGF0YSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgcm93RGVmID1cbiAgICAgICAgICB0aGlzLl9yb3dEZWZzLmZpbmQoZGVmID0+IGRlZi53aGVuICYmIGRlZi53aGVuKGRhdGFJbmRleCwgZGF0YSkpIHx8IHRoaXMuX2RlZmF1bHRSb3dEZWY7XG4gICAgICBpZiAocm93RGVmKSB7XG4gICAgICAgIHJvd0RlZnMucHVzaChyb3dEZWYpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghcm93RGVmcy5sZW5ndGgpIHtcbiAgICAgIHRocm93IGdldFRhYmxlTWlzc2luZ01hdGNoaW5nUm93RGVmRXJyb3IoZGF0YSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJvd0RlZnM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIHRoZSBlbWJlZGRlZCB2aWV3IGZvciB0aGUgZGF0YSByb3cgdGVtcGxhdGUgYW5kIHBsYWNlIGl0IGluIHRoZSBjb3JyZWN0IGluZGV4IGxvY2F0aW9uXG4gICAqIHdpdGhpbiB0aGUgZGF0YSByb3cgdmlldyBjb250YWluZXIuXG4gICAqL1xuICBwcml2YXRlIF9pbnNlcnRSb3cocmVuZGVyUm93OiBSZW5kZXJSb3c8VD4sIHJlbmRlckluZGV4OiBudW1iZXIpIHtcbiAgICBjb25zdCByb3dEZWYgPSByZW5kZXJSb3cucm93RGVmO1xuICAgIGNvbnN0IGNvbnRleHQ6IFJvd0NvbnRleHQ8VD4gPSB7JGltcGxpY2l0OiByZW5kZXJSb3cuZGF0YX07XG4gICAgdGhpcy5fcmVuZGVyUm93KHRoaXMuX3Jvd091dGxldCwgcm93RGVmLCByZW5kZXJJbmRleCwgY29udGV4dCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyByb3cgdGVtcGxhdGUgaW4gdGhlIG91dGxldCBhbmQgZmlsbHMgaXQgd2l0aCB0aGUgc2V0IG9mIGNlbGwgdGVtcGxhdGVzLlxuICAgKiBPcHRpb25hbGx5IHRha2VzIGEgY29udGV4dCB0byBwcm92aWRlIHRvIHRoZSByb3cgYW5kIGNlbGxzLCBhcyB3ZWxsIGFzIGFuIG9wdGlvbmFsIGluZGV4XG4gICAqIG9mIHdoZXJlIHRvIHBsYWNlIHRoZSBuZXcgcm93IHRlbXBsYXRlIGluIHRoZSBvdXRsZXQuXG4gICAqL1xuICBwcml2YXRlIF9yZW5kZXJSb3coXG4gICAgICBvdXRsZXQ6IFJvd091dGxldCwgcm93RGVmOiBCYXNlUm93RGVmLCBpbmRleDogbnVtYmVyLCBjb250ZXh0OiBSb3dDb250ZXh0PFQ+ID0ge30pIHtcbiAgICAvLyBUT0RPKGFuZHJld3NlZ3Vpbik6IGVuZm9yY2UgdGhhdCBvbmUgb3V0bGV0IHdhcyBpbnN0YW50aWF0ZWQgZnJvbSBjcmVhdGVFbWJlZGRlZFZpZXdcbiAgICBvdXRsZXQudmlld0NvbnRhaW5lci5jcmVhdGVFbWJlZGRlZFZpZXcocm93RGVmLnRlbXBsYXRlLCBjb250ZXh0LCBpbmRleCk7XG5cbiAgICBmb3IgKGxldCBjZWxsVGVtcGxhdGUgb2YgdGhpcy5fZ2V0Q2VsbFRlbXBsYXRlcyhyb3dEZWYpKSB7XG4gICAgICBpZiAoQ2RrQ2VsbE91dGxldC5tb3N0UmVjZW50Q2VsbE91dGxldCkge1xuICAgICAgICBDZGtDZWxsT3V0bGV0Lm1vc3RSZWNlbnRDZWxsT3V0bGV0Ll92aWV3Q29udGFpbmVyLmNyZWF0ZUVtYmVkZGVkVmlldyhjZWxsVGVtcGxhdGUsIGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGluZGV4LXJlbGF0ZWQgY29udGV4dCBmb3IgZWFjaCByb3cgdG8gcmVmbGVjdCBhbnkgY2hhbmdlcyBpbiB0aGUgaW5kZXggb2YgdGhlIHJvd3MsXG4gICAqIGUuZy4gZmlyc3QvbGFzdC9ldmVuL29kZC5cbiAgICovXG4gIHByaXZhdGUgX3VwZGF0ZVJvd0luZGV4Q29udGV4dCgpIHtcbiAgICBjb25zdCB2aWV3Q29udGFpbmVyID0gdGhpcy5fcm93T3V0bGV0LnZpZXdDb250YWluZXI7XG4gICAgZm9yIChsZXQgcmVuZGVySW5kZXggPSAwLCBjb3VudCA9IHZpZXdDb250YWluZXIubGVuZ3RoOyByZW5kZXJJbmRleCA8IGNvdW50OyByZW5kZXJJbmRleCsrKSB7XG4gICAgICBjb25zdCB2aWV3UmVmID0gdmlld0NvbnRhaW5lci5nZXQocmVuZGVySW5kZXgpIGFzIFJvd1ZpZXdSZWY8VD47XG4gICAgICBjb25zdCBjb250ZXh0ID0gdmlld1JlZi5jb250ZXh0IGFzIFJvd0NvbnRleHQ8VD47XG4gICAgICBjb250ZXh0LmNvdW50ID0gY291bnQ7XG4gICAgICBjb250ZXh0LmZpcnN0ID0gcmVuZGVySW5kZXggPT09IDA7XG4gICAgICBjb250ZXh0Lmxhc3QgPSByZW5kZXJJbmRleCA9PT0gY291bnQgLSAxO1xuICAgICAgY29udGV4dC5ldmVuID0gcmVuZGVySW5kZXggJSAyID09PSAwO1xuICAgICAgY29udGV4dC5vZGQgPSAhY29udGV4dC5ldmVuO1xuXG4gICAgICBpZiAodGhpcy5tdWx0aVRlbXBsYXRlRGF0YVJvd3MpIHtcbiAgICAgICAgY29udGV4dC5kYXRhSW5kZXggPSB0aGlzLl9yZW5kZXJSb3dzW3JlbmRlckluZGV4XS5kYXRhSW5kZXg7XG4gICAgICAgIGNvbnRleHQucmVuZGVySW5kZXggPSByZW5kZXJJbmRleDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRleHQuaW5kZXggPSB0aGlzLl9yZW5kZXJSb3dzW3JlbmRlckluZGV4XS5kYXRhSW5kZXg7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIEdldHMgdGhlIGNvbHVtbiBkZWZpbml0aW9ucyBmb3IgdGhlIHByb3ZpZGVkIHJvdyBkZWYuICovXG4gIHByaXZhdGUgX2dldENlbGxUZW1wbGF0ZXMocm93RGVmOiBCYXNlUm93RGVmKTogVGVtcGxhdGVSZWY8YW55PltdIHtcbiAgICBpZiAoIXJvd0RlZiB8fCAhcm93RGVmLmNvbHVtbnMpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgcmV0dXJuIEFycmF5LmZyb20ocm93RGVmLmNvbHVtbnMsIGNvbHVtbklkID0+IHtcbiAgICAgIGNvbnN0IGNvbHVtbiA9IHRoaXMuX2NvbHVtbkRlZnNCeU5hbWUuZ2V0KGNvbHVtbklkKTtcblxuICAgICAgaWYgKCFjb2x1bW4pIHtcbiAgICAgICAgdGhyb3cgZ2V0VGFibGVVbmtub3duQ29sdW1uRXJyb3IoY29sdW1uSWQpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcm93RGVmLmV4dHJhY3RDZWxsVGVtcGxhdGUoY29sdW1uKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBBZGRzIG5hdGl2ZSB0YWJsZSBzZWN0aW9ucyAoZS5nLiB0Ym9keSkgYW5kIG1vdmVzIHRoZSByb3cgb3V0bGV0cyBpbnRvIHRoZW0uICovXG4gIHByaXZhdGUgX2FwcGx5TmF0aXZlVGFibGVTZWN0aW9ucygpIHtcbiAgICBjb25zdCBkb2N1bWVudEZyYWdtZW50ID0gdGhpcy5fZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIGNvbnN0IHNlY3Rpb25zID0gW1xuICAgICAge3RhZzogJ3RoZWFkJywgb3V0bGV0czogW3RoaXMuX2hlYWRlclJvd091dGxldF19LFxuICAgICAge3RhZzogJ3Rib2R5Jywgb3V0bGV0czogW3RoaXMuX3Jvd091dGxldCwgdGhpcy5fbm9EYXRhUm93T3V0bGV0XX0sXG4gICAgICB7dGFnOiAndGZvb3QnLCBvdXRsZXRzOiBbdGhpcy5fZm9vdGVyUm93T3V0bGV0XX0sXG4gICAgXTtcblxuICAgIGZvciAoY29uc3Qgc2VjdGlvbiBvZiBzZWN0aW9ucykge1xuICAgICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoc2VjdGlvbi50YWcpO1xuICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAncm93Z3JvdXAnKTtcblxuICAgICAgZm9yIChjb25zdCBvdXRsZXQgb2Ygc2VjdGlvbi5vdXRsZXRzKSB7XG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQob3V0bGV0LmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCk7XG4gICAgICB9XG5cbiAgICAgIGRvY3VtZW50RnJhZ21lbnQuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgfVxuXG4gICAgLy8gVXNlIGEgRG9jdW1lbnRGcmFnbWVudCBzbyB3ZSBkb24ndCBoaXQgdGhlIERPTSBvbiBlYWNoIGl0ZXJhdGlvbi5cbiAgICB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuYXBwZW5kQ2hpbGQoZG9jdW1lbnRGcmFnbWVudCk7XG4gIH1cblxuICAvKipcbiAgICogRm9yY2VzIGEgcmUtcmVuZGVyIG9mIHRoZSBkYXRhIHJvd3MuIFNob3VsZCBiZSBjYWxsZWQgaW4gY2FzZXMgd2hlcmUgdGhlcmUgaGFzIGJlZW4gYW4gaW5wdXRcbiAgICogY2hhbmdlIHRoYXQgYWZmZWN0cyB0aGUgZXZhbHVhdGlvbiBvZiB3aGljaCByb3dzIHNob3VsZCBiZSByZW5kZXJlZCwgZS5nLiB0b2dnbGluZ1xuICAgKiBgbXVsdGlUZW1wbGF0ZURhdGFSb3dzYCBvciBhZGRpbmcvcmVtb3Zpbmcgcm93IGRlZmluaXRpb25zLlxuICAgKi9cbiAgcHJpdmF0ZSBfZm9yY2VSZW5kZXJEYXRhUm93cygpIHtcbiAgICB0aGlzLl9kYXRhRGlmZmVyLmRpZmYoW10pO1xuICAgIHRoaXMuX3Jvd091dGxldC52aWV3Q29udGFpbmVyLmNsZWFyKCk7XG4gICAgdGhpcy5yZW5kZXJSb3dzKCk7XG4gICAgdGhpcy51cGRhdGVTdGlja3lDb2x1bW5TdHlsZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlcmUgaGFzIGJlZW4gYSBjaGFuZ2UgaW4gc3RpY2t5IHN0YXRlcyBzaW5jZSBsYXN0IGNoZWNrIGFuZCBhcHBsaWVzIHRoZSBjb3JyZWN0XG4gICAqIHN0aWNreSBzdHlsZXMuIFNpbmNlIGNoZWNraW5nIHJlc2V0cyB0aGUgXCJkaXJ0eVwiIHN0YXRlLCB0aGlzIHNob3VsZCBvbmx5IGJlIHBlcmZvcm1lZCBvbmNlXG4gICAqIGR1cmluZyBhIGNoYW5nZSBkZXRlY3Rpb24gYW5kIGFmdGVyIHRoZSBpbnB1dHMgYXJlIHNldHRsZWQgKGFmdGVyIGNvbnRlbnQgY2hlY2spLlxuICAgKi9cbiAgcHJpdmF0ZSBfY2hlY2tTdGlja3lTdGF0ZXMoKSB7XG4gICAgY29uc3Qgc3RpY2t5Q2hlY2tSZWR1Y2VyID0gKGFjYzogYm9vbGVhbiwgZDogQ2RrSGVhZGVyUm93RGVmfENka0Zvb3RlclJvd0RlZnxDZGtDb2x1bW5EZWYpID0+IHtcbiAgICAgIHJldHVybiBhY2MgfHwgZC5oYXNTdGlja3lDaGFuZ2VkKCk7XG4gICAgfTtcblxuICAgIC8vIE5vdGUgdGhhdCB0aGUgY2hlY2sgbmVlZHMgdG8gb2NjdXIgZm9yIGV2ZXJ5IGRlZmluaXRpb24gc2luY2UgaXQgbm90aWZpZXMgdGhlIGRlZmluaXRpb25cbiAgICAvLyB0aGF0IGl0IGNhbiByZXNldCBpdHMgZGlydHkgc3RhdGUuIFVzaW5nIGFub3RoZXIgb3BlcmF0b3IgbGlrZSBgc29tZWAgbWF5IHNob3J0LWNpcmN1aXRcbiAgICAvLyByZW1haW5pbmcgZGVmaW5pdGlvbnMgYW5kIGxlYXZlIHRoZW0gaW4gYW4gdW5jaGVja2VkIHN0YXRlLlxuXG4gICAgaWYgKHRoaXMuX2hlYWRlclJvd0RlZnMucmVkdWNlKHN0aWNreUNoZWNrUmVkdWNlciwgZmFsc2UpKSB7XG4gICAgICB0aGlzLnVwZGF0ZVN0aWNreUhlYWRlclJvd1N0eWxlcygpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9mb290ZXJSb3dEZWZzLnJlZHVjZShzdGlja3lDaGVja1JlZHVjZXIsIGZhbHNlKSkge1xuICAgICAgdGhpcy51cGRhdGVTdGlja3lGb290ZXJSb3dTdHlsZXMoKTtcbiAgICB9XG5cbiAgICBpZiAoQXJyYXkuZnJvbSh0aGlzLl9jb2x1bW5EZWZzQnlOYW1lLnZhbHVlcygpKS5yZWR1Y2Uoc3RpY2t5Q2hlY2tSZWR1Y2VyLCBmYWxzZSkpIHtcbiAgICAgIHRoaXMudXBkYXRlU3RpY2t5Q29sdW1uU3R5bGVzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgdGhlIHN0aWNreSBzdHlsZXIgdGhhdCB3aWxsIGJlIHVzZWQgZm9yIHN0aWNreSByb3dzIGFuZCBjb2x1bW5zLiBMaXN0ZW5zXG4gICAqIGZvciBkaXJlY3Rpb25hbGl0eSBjaGFuZ2VzIGFuZCBwcm92aWRlcyB0aGUgbGF0ZXN0IGRpcmVjdGlvbiB0byB0aGUgc3R5bGVyLiBSZS1hcHBsaWVzIGNvbHVtblxuICAgKiBzdGlja2luZXNzIHdoZW4gZGlyZWN0aW9uYWxpdHkgY2hhbmdlcy5cbiAgICovXG4gIHByaXZhdGUgX3NldHVwU3RpY2t5U3R5bGVyKCkge1xuICAgIGNvbnN0IGRpcmVjdGlvbjogRGlyZWN0aW9uID0gdGhpcy5fZGlyID8gdGhpcy5fZGlyLnZhbHVlIDogJ2x0cic7XG4gICAgdGhpcy5fc3RpY2t5U3R5bGVyID0gbmV3IFN0aWNreVN0eWxlcihcbiAgICAgICAgdGhpcy5faXNOYXRpdmVIdG1sVGFibGUsIHRoaXMuc3RpY2t5Q3NzQ2xhc3MsIGRpcmVjdGlvbiwgdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKTtcbiAgICAodGhpcy5fZGlyID8gdGhpcy5fZGlyLmNoYW5nZSA6IG9ic2VydmFibGVPZjxEaXJlY3Rpb24+KCkpXG4gICAgICAgIC5waXBlKHRha2VVbnRpbCh0aGlzLl9vbkRlc3Ryb3kpKVxuICAgICAgICAuc3Vic2NyaWJlKHZhbHVlID0+IHtcbiAgICAgICAgICB0aGlzLl9zdGlja3lTdHlsZXIuZGlyZWN0aW9uID0gdmFsdWU7XG4gICAgICAgICAgdGhpcy51cGRhdGVTdGlja3lDb2x1bW5TdHlsZXMoKTtcbiAgICAgICAgfSk7XG4gIH1cblxuICAvKiogRmlsdGVycyBkZWZpbml0aW9ucyB0aGF0IGJlbG9uZyB0byB0aGlzIHRhYmxlIGZyb20gYSBRdWVyeUxpc3QuICovXG4gIHByaXZhdGUgX2dldE93bkRlZnM8SSBleHRlbmRzIHtfdGFibGU/OiBhbnl9PihpdGVtczogUXVlcnlMaXN0PEk+KTogSVtdIHtcbiAgICByZXR1cm4gaXRlbXMuZmlsdGVyKGl0ZW0gPT4gIWl0ZW0uX3RhYmxlIHx8IGl0ZW0uX3RhYmxlID09PSB0aGlzKTtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIG9yIHJlbW92ZXMgdGhlIG5vIGRhdGEgcm93LCBkZXBlbmRpbmcgb24gd2hldGhlciBhbnkgZGF0YSBpcyBiZWluZyBzaG93bi4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlTm9EYXRhUm93KCkge1xuICAgIGlmICh0aGlzLl9ub0RhdGFSb3cpIHtcbiAgICAgIGNvbnN0IHNob3VsZFNob3cgPSB0aGlzLl9yb3dPdXRsZXQudmlld0NvbnRhaW5lci5sZW5ndGggPT09IDA7XG5cbiAgICAgIGlmIChzaG91bGRTaG93ICE9PSB0aGlzLl9pc1Nob3dpbmdOb0RhdGFSb3cpIHtcbiAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5fbm9EYXRhUm93T3V0bGV0LnZpZXdDb250YWluZXI7XG4gICAgICAgIHNob3VsZFNob3cgPyBjb250YWluZXIuY3JlYXRlRW1iZWRkZWRWaWV3KHRoaXMuX25vRGF0YVJvdy50ZW1wbGF0ZVJlZikgOiBjb250YWluZXIuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5faXNTaG93aW5nTm9EYXRhUm93ID0gc2hvdWxkU2hvdztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfbXVsdGlUZW1wbGF0ZURhdGFSb3dzOiBCb29sZWFuSW5wdXQ7XG59XG5cbi8qKiBVdGlsaXR5IGZ1bmN0aW9uIHRoYXQgZ2V0cyBhIG1lcmdlZCBsaXN0IG9mIHRoZSBlbnRyaWVzIGluIGFuIGFycmF5IGFuZCB2YWx1ZXMgb2YgYSBTZXQuICovXG5mdW5jdGlvbiBtZXJnZUFycmF5QW5kU2V0PFQ+KGFycmF5OiBUW10sIHNldDogU2V0PFQ+KTogVFtdIHtcbiAgcmV0dXJuIGFycmF5LmNvbmNhdChBcnJheS5mcm9tKHNldCkpO1xufVxuIl19