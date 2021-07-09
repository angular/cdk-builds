/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directionality } from '@angular/cdk/bidi';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { _DisposeViewRepeaterStrategy, _RecycleViewRepeaterStrategy, isDataSource, _VIEW_REPEATER_STRATEGY, } from '@angular/cdk/collections';
import { Platform } from '@angular/cdk/platform';
import { ViewportRuler } from '@angular/cdk/scrolling';
import { DOCUMENT } from '@angular/common';
import { Attribute, ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChild, ContentChildren, Directive, ElementRef, EmbeddedViewRef, EventEmitter, Inject, Input, IterableDiffers, Optional, Output, QueryList, SkipSelf, ViewChild, ViewContainerRef, ViewEncapsulation, } from '@angular/core';
import { BehaviorSubject, isObservable, of as observableOf, Subject, } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CdkColumnDef } from './cell';
import { _CoalescedStyleScheduler, _COALESCED_STYLE_SCHEDULER } from './coalesced-style-scheduler';
import { CdkCellOutlet, CdkFooterRowDef, CdkHeaderRowDef, CdkNoDataRow, CdkRowDef } from './row';
import { StickyStyler } from './sticky-styler';
import { getTableDuplicateColumnNameError, getTableMissingMatchingRowDefError, getTableMissingRowDefsError, getTableMultipleDefaultRowDefsError, getTableUnknownColumnError, getTableUnknownDataSourceError } from './table-errors';
import { STICKY_POSITIONING_LISTENER } from './sticky-position-listener';
import { CDK_TABLE } from './tokens';
/**
 * Enables the recycle view repeater strategy, which reduces rendering latency. Not compatible with
 * tables that animate rows.
 */
export class CdkRecycleRows {
}
CdkRecycleRows.decorators = [
    { type: Directive, args: [{
                selector: 'cdk-table[recycleRows], table[cdk-table][recycleRows]',
                providers: [
                    { provide: _VIEW_REPEATER_STRATEGY, useClass: _RecycleViewRepeaterStrategy },
                ],
            },] }
];
/**
 * Provides a handle for the table to grab the view container's ng-container to insert data rows.
 * @docs-private
 */
export class DataRowOutlet {
    constructor(viewContainer, elementRef) {
        this.viewContainer = viewContainer;
        this.elementRef = elementRef;
    }
}
DataRowOutlet.decorators = [
    { type: Directive, args: [{ selector: '[rowOutlet]' },] }
];
DataRowOutlet.ctorParameters = () => [
    { type: ViewContainerRef },
    { type: ElementRef }
];
/**
 * Provides a handle for the table to grab the view container's ng-container to insert the header.
 * @docs-private
 */
export class HeaderRowOutlet {
    constructor(viewContainer, elementRef) {
        this.viewContainer = viewContainer;
        this.elementRef = elementRef;
    }
}
HeaderRowOutlet.decorators = [
    { type: Directive, args: [{ selector: '[headerRowOutlet]' },] }
];
HeaderRowOutlet.ctorParameters = () => [
    { type: ViewContainerRef },
    { type: ElementRef }
];
/**
 * Provides a handle for the table to grab the view container's ng-container to insert the footer.
 * @docs-private
 */
export class FooterRowOutlet {
    constructor(viewContainer, elementRef) {
        this.viewContainer = viewContainer;
        this.elementRef = elementRef;
    }
}
FooterRowOutlet.decorators = [
    { type: Directive, args: [{ selector: '[footerRowOutlet]' },] }
];
FooterRowOutlet.ctorParameters = () => [
    { type: ViewContainerRef },
    { type: ElementRef }
];
/**
 * Provides a handle for the table to grab the view
 * container's ng-container to insert the no data row.
 * @docs-private
 */
export class NoDataRowOutlet {
    constructor(viewContainer, elementRef) {
        this.viewContainer = viewContainer;
        this.elementRef = elementRef;
    }
}
NoDataRowOutlet.decorators = [
    { type: Directive, args: [{ selector: '[noDataRowOutlet]' },] }
];
NoDataRowOutlet.ctorParameters = () => [
    { type: ViewContainerRef },
    { type: ElementRef }
];
/**
 * The table template that can be used by the mat-table. Should not be used outside of the
 * material library.
 * @docs-private
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
 * Class used to conveniently type the embedded view ref for rows with a context.
 * @docs-private
 */
class RowViewRef extends EmbeddedViewRef {
}
/**
 * A data table that can render a header row, data rows, and a footer row.
 * Uses the dataSource input to determine the data to be rendered. The data can be provided either
 * as a data array, an Observable stream that emits the data array to render, or a DataSource with a
 * connect function that will return an Observable stream that emits the data array to render.
 */
export class CdkTable {
    constructor(_differs, _changeDetectorRef, _elementRef, role, _dir, _document, _platform, _viewRepeater, _coalescedStyleScheduler, _viewportRuler, 
    /**
     * @deprecated `_stickyPositioningListener` parameter to become required.
     * @breaking-change 13.0.0
     */
    _stickyPositioningListener) {
        this._differs = _differs;
        this._changeDetectorRef = _changeDetectorRef;
        this._elementRef = _elementRef;
        this._dir = _dir;
        this._platform = _platform;
        this._viewRepeater = _viewRepeater;
        this._coalescedStyleScheduler = _coalescedStyleScheduler;
        this._viewportRuler = _viewportRuler;
        this._stickyPositioningListener = _stickyPositioningListener;
        /** Subject that emits when the component has been destroyed. */
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
         * Whether the sticky column styles need to be updated. Set to `true` when the visible columns
         * change.
         */
        this._stickyColumnStylesNeedReset = true;
        /**
         * Whether the sticky styler should recalculate cell widths when applying sticky styles. If
         * `false`, cached values will be used instead. This is only applicable to tables with
         * {@link fixedLayout} enabled. For other tables, cell widths will always be recalculated.
         */
        this._forceRecalculateCellWidths = true;
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
         * Whether to manually add positon: sticky to all sticky cell elements. Not needed if
         * the position is set in a selector associated with the value of stickyCssClass. May be
         * overridden by table subclasses
         */
        this.needsPositionStickyOnElement = true;
        /** Whether the no data row is currently showing anything. */
        this._isShowingNoDataRow = false;
        this._multiTemplateDataRows = false;
        this._fixedLayout = false;
        /**
         * Emits when the table completes rendering a set of data rows based on the latest data from the
         * data source, even if the set of rows is empty.
         */
        this.contentChanged = new EventEmitter();
        // TODO(andrewseguin): Remove max value as the end index
        //   and instead calculate the view on init and scroll.
        /**
         * Stream containing the latest information on what rows are being displayed on screen.
         * Can be used by the data source to as a heuristic of what data should be provided.
         *
         * @docs-private
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
     */
    get trackBy() {
        return this._trackByFn;
    }
    set trackBy(fn) {
        if ((typeof ngDevMode === 'undefined' || ngDevMode) && fn != null && typeof fn !== 'function') {
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
     */
    get dataSource() {
        return this._dataSource;
    }
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
     */
    get multiTemplateDataRows() {
        return this._multiTemplateDataRows;
    }
    set multiTemplateDataRows(v) {
        this._multiTemplateDataRows = coerceBooleanProperty(v);
        // In Ivy if this value is set via a static attribute (e.g. <table multiTemplateDataRows>),
        // this setter will be invoked before the row outlet has been defined hence the null check.
        if (this._rowOutlet && this._rowOutlet.viewContainer.length) {
            this._forceRenderDataRows();
            this.updateStickyColumnStyles();
        }
    }
    /**
     * Whether to use a fixed table layout. Enabling this option will enforce consistent column widths
     * and optimize rendering sticky styles for native tables. No-op for flex tables.
     */
    get fixedLayout() {
        return this._fixedLayout;
    }
    set fixedLayout(v) {
        this._fixedLayout = coerceBooleanProperty(v);
        // Toggling `fixedLayout` may change column widths. Sticky column styles should be recalculated.
        this._forceRecalculateCellWidths = true;
        this._stickyColumnStylesNeedReset = true;
    }
    ngOnInit() {
        this._setupStickyStyler();
        if (this._isNativeHtmlTable) {
            this._applyNativeTableSections();
        }
        // Set up the trackBy function so that it uses the `RenderRow` as its identity by default. If
        // the user has provided a custom trackBy, return the result of that function as evaluated
        // with the values of the `RenderRow`'s data and index.
        this._dataDiffer = this._differs.find([]).create((_i, dataRow) => {
            return this.trackBy ? this.trackBy(dataRow.dataIndex, dataRow.data) : dataRow;
        });
        this._viewportRuler.change().pipe(takeUntil(this._onDestroy)).subscribe(() => {
            this._forceRecalculateCellWidths = true;
        });
    }
    ngAfterContentChecked() {
        // Cache the row and column definitions gathered by ContentChildren and programmatic injection.
        this._cacheRowDefs();
        this._cacheColumnDefs();
        // Make sure that the user has at least added header, footer, or data row def.
        if (!this._headerRowDefs.length && !this._footerRowDefs.length && !this._rowDefs.length &&
            (typeof ngDevMode === 'undefined' || ngDevMode)) {
            throw getTableMissingRowDefsError();
        }
        // Render updates if the list of columns have been changed for the header, row, or footer defs.
        const columnsChanged = this._renderUpdatedColumns();
        const rowDefsChanged = columnsChanged || this._headerRowDefChanged || this._footerRowDefChanged;
        // Ensure sticky column styles are reset if set to `true` elsewhere.
        this._stickyColumnStylesNeedReset = this._stickyColumnStylesNeedReset || rowDefsChanged;
        this._forceRecalculateCellWidths = rowDefsChanged;
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
        else if (this._stickyColumnStylesNeedReset) {
            // In the above case, _observeRenderChanges will result in updateStickyColumnStyles being
            // called when it row data arrives. Otherwise, we need to call it proactively.
            this.updateStickyColumnStyles();
        }
        this._checkStickyStates();
    }
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
     */
    renderRows() {
        this._renderRows = this._getAllRenderRows();
        const changes = this._dataDiffer.diff(this._renderRows);
        if (!changes) {
            this._updateNoDataRow();
            this.contentChanged.next();
            return;
        }
        const viewContainer = this._rowOutlet.viewContainer;
        this._viewRepeater.applyChanges(changes, viewContainer, (record, _adjustedPreviousIndex, currentIndex) => this._getEmbeddedViewArgs(record.item, currentIndex), (record) => record.item.data, (change) => {
            if (change.operation === 1 /* INSERTED */ && change.context) {
                this._renderCellTemplateForItem(change.record.item.rowDef, change.context);
            }
        });
        // Update the meta context of a row's context data (index, count, first, last, ...)
        this._updateRowIndexContext();
        // Update rows that did not get added/removed/moved but may have had their identity changed,
        // e.g. if trackBy matched data on some property but the actual data reference changed.
        changes.forEachIdentityChange((record) => {
            const rowView = viewContainer.get(record.currentIndex);
            rowView.context.$implicit = record.item.data;
        });
        this._updateNoDataRow();
        this.updateStickyColumnStyles();
        this.contentChanged.next();
    }
    /** Adds a column definition that was not included as part of the content children. */
    addColumnDef(columnDef) {
        this._customColumnDefs.add(columnDef);
    }
    /** Removes a column definition that was not included as part of the content children. */
    removeColumnDef(columnDef) {
        this._customColumnDefs.delete(columnDef);
    }
    /** Adds a row definition that was not included as part of the content children. */
    addRowDef(rowDef) {
        this._customRowDefs.add(rowDef);
    }
    /** Removes a row definition that was not included as part of the content children. */
    removeRowDef(rowDef) {
        this._customRowDefs.delete(rowDef);
    }
    /** Adds a header row definition that was not included as part of the content children. */
    addHeaderRowDef(headerRowDef) {
        this._customHeaderRowDefs.add(headerRowDef);
        this._headerRowDefChanged = true;
    }
    /** Removes a header row definition that was not included as part of the content children. */
    removeHeaderRowDef(headerRowDef) {
        this._customHeaderRowDefs.delete(headerRowDef);
        this._headerRowDefChanged = true;
    }
    /** Adds a footer row definition that was not included as part of the content children. */
    addFooterRowDef(footerRowDef) {
        this._customFooterRowDefs.add(footerRowDef);
        this._footerRowDefChanged = true;
    }
    /** Removes a footer row definition that was not included as part of the content children. */
    removeFooterRowDef(footerRowDef) {
        this._customFooterRowDefs.delete(footerRowDef);
        this._footerRowDefChanged = true;
    }
    /** Sets a no data row definition that was not included as a part of the content children. */
    setNoDataRow(noDataRow) {
        this._customNoDataRow = noDataRow;
    }
    /**
     * Updates the header sticky styles. First resets all applied styles with respect to the cells
     * sticking to the top. Then, evaluating which cells need to be stuck to the top. This is
     * automatically called when the header row changes its displayed set of columns, or if its
     * sticky input changes. May be called manually for cases where the cell content changes outside
     * of these events.
     */
    updateStickyHeaderRowStyles() {
        const headerRows = this._getRenderedRows(this._headerRowOutlet);
        const tableElement = this._elementRef.nativeElement;
        // Hide the thead element if there are no header rows. This is necessary to satisfy
        // overzealous a11y checkers that fail because the `rowgroup` element does not contain
        // required child `row`.
        const thead = tableElement.querySelector('thead');
        if (thead) {
            thead.style.display = headerRows.length ? '' : 'none';
        }
        const stickyStates = this._headerRowDefs.map(def => def.sticky);
        this._stickyStyler.clearStickyPositioning(headerRows, ['top']);
        this._stickyStyler.stickRows(headerRows, stickyStates, 'top');
        // Reset the dirty state of the sticky input change since it has been used.
        this._headerRowDefs.forEach(def => def.resetStickyChanged());
    }
    /**
     * Updates the footer sticky styles. First resets all applied styles with respect to the cells
     * sticking to the bottom. Then, evaluating which cells need to be stuck to the bottom. This is
     * automatically called when the footer row changes its displayed set of columns, or if its
     * sticky input changes. May be called manually for cases where the cell content changes outside
     * of these events.
     */
    updateStickyFooterRowStyles() {
        const footerRows = this._getRenderedRows(this._footerRowOutlet);
        const tableElement = this._elementRef.nativeElement;
        // Hide the tfoot element if there are no footer rows. This is necessary to satisfy
        // overzealous a11y checkers that fail because the `rowgroup` element does not contain
        // required child `row`.
        const tfoot = tableElement.querySelector('tfoot');
        if (tfoot) {
            tfoot.style.display = footerRows.length ? '' : 'none';
        }
        const stickyStates = this._footerRowDefs.map(def => def.sticky);
        this._stickyStyler.clearStickyPositioning(footerRows, ['bottom']);
        this._stickyStyler.stickRows(footerRows, stickyStates, 'bottom');
        this._stickyStyler.updateStickyFooterContainer(this._elementRef.nativeElement, stickyStates);
        // Reset the dirty state of the sticky input change since it has been used.
        this._footerRowDefs.forEach(def => def.resetStickyChanged());
    }
    /**
     * Updates the column sticky styles. First resets all applied styles with respect to the cells
     * sticking to the left and right. Then sticky styles are added for the left and right according
     * to the column definitions for each cell in each row. This is automatically called when
     * the data source provides a new set of data or when a column definition changes its sticky
     * input. May be called manually for cases where the cell content changes outside of these events.
     */
    updateStickyColumnStyles() {
        const headerRows = this._getRenderedRows(this._headerRowOutlet);
        const dataRows = this._getRenderedRows(this._rowOutlet);
        const footerRows = this._getRenderedRows(this._footerRowOutlet);
        // For tables not using a fixed layout, the column widths may change when new rows are rendered.
        // In a table using a fixed layout, row content won't affect column width, so sticky styles
        // don't need to be cleared unless either the sticky column config changes or one of the row
        // defs change.
        if ((this._isNativeHtmlTable && !this._fixedLayout)
            || this._stickyColumnStylesNeedReset) {
            // Clear the left and right positioning from all columns in the table across all rows since
            // sticky columns span across all table sections (header, data, footer)
            this._stickyStyler.clearStickyPositioning([...headerRows, ...dataRows, ...footerRows], ['left', 'right']);
            this._stickyColumnStylesNeedReset = false;
        }
        // Update the sticky styles for each header row depending on the def's sticky state
        headerRows.forEach((headerRow, i) => {
            this._addStickyColumnStyles([headerRow], this._headerRowDefs[i]);
        });
        // Update the sticky styles for each data row depending on its def's sticky state
        this._rowDefs.forEach(rowDef => {
            // Collect all the rows rendered with this row definition.
            const rows = [];
            for (let i = 0; i < dataRows.length; i++) {
                if (this._renderRows[i].rowDef === rowDef) {
                    rows.push(dataRows[i]);
                }
            }
            this._addStickyColumnStyles(rows, rowDef);
        });
        // Update the sticky styles for each footer row depending on the def's sticky state
        footerRows.forEach((footerRow, i) => {
            this._addStickyColumnStyles([footerRow], this._footerRowDefs[i]);
        });
        // Reset the dirty state of the sticky input change since it has been used.
        Array.from(this._columnDefsByName.values()).forEach(def => def.resetStickyChanged());
    }
    /**
     * Get the list of RenderRow objects to render according to the current list of data and defined
     * row definitions. If the previous list already contained a particular pair, it should be reused
     * so that the differ equates their references.
     */
    _getAllRenderRows() {
        const renderRows = [];
        // Store the cache and create a new one. Any re-used RenderRow objects will be moved into the
        // new cache while unused ones can be picked up by garbage collection.
        const prevCachedRenderRows = this._cachedRenderRowsMap;
        this._cachedRenderRowsMap = new Map();
        // For each data object, get the list of rows that should be rendered, represented by the
        // respective `RenderRow` object which is the pair of `data` and `CdkRowDef`.
        for (let i = 0; i < this._data.length; i++) {
            let data = this._data[i];
            const renderRowsForData = this._getRenderRowsForData(data, i, prevCachedRenderRows.get(data));
            if (!this._cachedRenderRowsMap.has(data)) {
                this._cachedRenderRowsMap.set(data, new WeakMap());
            }
            for (let j = 0; j < renderRowsForData.length; j++) {
                let renderRow = renderRowsForData[j];
                const cache = this._cachedRenderRowsMap.get(renderRow.data);
                if (cache.has(renderRow.rowDef)) {
                    cache.get(renderRow.rowDef).push(renderRow);
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
     */
    _getRenderRowsForData(data, dataIndex, cache) {
        const rowDefs = this._getRowDefs(data, dataIndex);
        return rowDefs.map(rowDef => {
            const cachedRenderRows = (cache && cache.has(rowDef)) ? cache.get(rowDef) : [];
            if (cachedRenderRows.length) {
                const dataRow = cachedRenderRows.shift();
                dataRow.dataIndex = dataIndex;
                return dataRow;
            }
            else {
                return { data, rowDef, dataIndex };
            }
        });
    }
    /** Update the map containing the content's column definitions. */
    _cacheColumnDefs() {
        this._columnDefsByName.clear();
        const columnDefs = mergeArrayAndSet(this._getOwnDefs(this._contentColumnDefs), this._customColumnDefs);
        columnDefs.forEach(columnDef => {
            if (this._columnDefsByName.has(columnDef.name) &&
                (typeof ngDevMode === 'undefined' || ngDevMode)) {
                throw getTableDuplicateColumnNameError(columnDef.name);
            }
            this._columnDefsByName.set(columnDef.name, columnDef);
        });
    }
    /** Update the list of all available row definitions that can be used. */
    _cacheRowDefs() {
        this._headerRowDefs = mergeArrayAndSet(this._getOwnDefs(this._contentHeaderRowDefs), this._customHeaderRowDefs);
        this._footerRowDefs = mergeArrayAndSet(this._getOwnDefs(this._contentFooterRowDefs), this._customFooterRowDefs);
        this._rowDefs = mergeArrayAndSet(this._getOwnDefs(this._contentRowDefs), this._customRowDefs);
        // After all row definitions are determined, find the row definition to be considered default.
        const defaultRowDefs = this._rowDefs.filter(def => !def.when);
        if (!this.multiTemplateDataRows && defaultRowDefs.length > 1 &&
            (typeof ngDevMode === 'undefined' || ngDevMode)) {
            throw getTableMultipleDefaultRowDefsError();
        }
        this._defaultRowDef = defaultRowDefs[0];
    }
    /**
     * Check if the header, data, or footer rows have changed what columns they want to display or
     * whether the sticky states have changed for the header or footer. If there is a diff, then
     * re-render that section.
     */
    _renderUpdatedColumns() {
        const columnsDiffReducer = (acc, def) => acc || !!def.getColumnsDiff();
        // Force re-render data rows if the list of column definitions have changed.
        const dataColumnsChanged = this._rowDefs.reduce(columnsDiffReducer, false);
        if (dataColumnsChanged) {
            this._forceRenderDataRows();
        }
        // Force re-render header/footer rows if the list of column definitions have changed.
        const headerColumnsChanged = this._headerRowDefs.reduce(columnsDiffReducer, false);
        if (headerColumnsChanged) {
            this._forceRenderHeaderRows();
        }
        const footerColumnsChanged = this._footerRowDefs.reduce(columnsDiffReducer, false);
        if (footerColumnsChanged) {
            this._forceRenderFooterRows();
        }
        return dataColumnsChanged || headerColumnsChanged || footerColumnsChanged;
    }
    /**
     * Switch to the provided data source by resetting the data and unsubscribing from the current
     * render change subscription if one exists. If the data source is null, interpret this by
     * clearing the row outlet. Otherwise start listening for new data.
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
    /** Set up a subscription for the data provided by the data source. */
    _observeRenderChanges() {
        // If no data source has been set, there is nothing to observe for changes.
        if (!this.dataSource) {
            return;
        }
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
        if (dataStream === undefined && (typeof ngDevMode === 'undefined' || ngDevMode)) {
            throw getTableUnknownDataSourceError();
        }
        this._renderChangeSubscription = dataStream.pipe(takeUntil(this._onDestroy))
            .subscribe(data => {
            this._data = data || [];
            this.renderRows();
        });
    }
    /**
     * Clears any existing content in the header row outlet and creates a new embedded view
     * in the outlet using the header row definition.
     */
    _forceRenderHeaderRows() {
        // Clear the header row outlet if any content exists.
        if (this._headerRowOutlet.viewContainer.length > 0) {
            this._headerRowOutlet.viewContainer.clear();
        }
        this._headerRowDefs.forEach((def, i) => this._renderRow(this._headerRowOutlet, def, i));
        this.updateStickyHeaderRowStyles();
    }
    /**
     * Clears any existing content in the footer row outlet and creates a new embedded view
     * in the outlet using the footer row definition.
     */
    _forceRenderFooterRows() {
        // Clear the footer row outlet if any content exists.
        if (this._footerRowOutlet.viewContainer.length > 0) {
            this._footerRowOutlet.viewContainer.clear();
        }
        this._footerRowDefs.forEach((def, i) => this._renderRow(this._footerRowOutlet, def, i));
        this.updateStickyFooterRowStyles();
    }
    /** Adds the sticky column styles for the rows according to the columns' stick states. */
    _addStickyColumnStyles(rows, rowDef) {
        const columnDefs = Array.from(rowDef.columns || []).map(columnName => {
            const columnDef = this._columnDefsByName.get(columnName);
            if (!columnDef && (typeof ngDevMode === 'undefined' || ngDevMode)) {
                throw getTableUnknownColumnError(columnName);
            }
            return columnDef;
        });
        const stickyStartStates = columnDefs.map(columnDef => columnDef.sticky);
        const stickyEndStates = columnDefs.map(columnDef => columnDef.stickyEnd);
        this._stickyStyler.updateStickyColumns(rows, stickyStartStates, stickyEndStates, !this._fixedLayout || this._forceRecalculateCellWidths);
    }
    /** Gets the list of rows that have been rendered in the row outlet. */
    _getRenderedRows(rowOutlet) {
        const renderedRows = [];
        for (let i = 0; i < rowOutlet.viewContainer.length; i++) {
            const viewRef = rowOutlet.viewContainer.get(i);
            renderedRows.push(viewRef.rootNodes[0]);
        }
        return renderedRows;
    }
    /**
     * Get the matching row definitions that should be used for this row data. If there is only
     * one row definition, it is returned. Otherwise, find the row definitions that has a when
     * predicate that returns true with the data. If none return true, return the default row
     * definition.
     */
    _getRowDefs(data, dataIndex) {
        if (this._rowDefs.length == 1) {
            return [this._rowDefs[0]];
        }
        let rowDefs = [];
        if (this.multiTemplateDataRows) {
            rowDefs = this._rowDefs.filter(def => !def.when || def.when(dataIndex, data));
        }
        else {
            let rowDef = this._rowDefs.find(def => def.when && def.when(dataIndex, data)) || this._defaultRowDef;
            if (rowDef) {
                rowDefs.push(rowDef);
            }
        }
        if (!rowDefs.length && (typeof ngDevMode === 'undefined' || ngDevMode)) {
            throw getTableMissingMatchingRowDefError(data);
        }
        return rowDefs;
    }
    _getEmbeddedViewArgs(renderRow, index) {
        const rowDef = renderRow.rowDef;
        const context = { $implicit: renderRow.data };
        return {
            templateRef: rowDef.template,
            context,
            index,
        };
    }
    /**
     * Creates a new row template in the outlet and fills it with the set of cell templates.
     * Optionally takes a context to provide to the row and cells, as well as an optional index
     * of where to place the new row template in the outlet.
     */
    _renderRow(outlet, rowDef, index, context = {}) {
        // TODO(andrewseguin): enforce that one outlet was instantiated from createEmbeddedView
        const view = outlet.viewContainer.createEmbeddedView(rowDef.template, context, index);
        this._renderCellTemplateForItem(rowDef, context);
        return view;
    }
    _renderCellTemplateForItem(rowDef, context) {
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
     */
    _updateRowIndexContext() {
        const viewContainer = this._rowOutlet.viewContainer;
        for (let renderIndex = 0, count = viewContainer.length; renderIndex < count; renderIndex++) {
            const viewRef = viewContainer.get(renderIndex);
            const context = viewRef.context;
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
    /** Gets the column definitions for the provided row def. */
    _getCellTemplates(rowDef) {
        if (!rowDef || !rowDef.columns) {
            return [];
        }
        return Array.from(rowDef.columns, columnId => {
            const column = this._columnDefsByName.get(columnId);
            if (!column && (typeof ngDevMode === 'undefined' || ngDevMode)) {
                throw getTableUnknownColumnError(columnId);
            }
            return rowDef.extractCellTemplate(column);
        });
    }
    /** Adds native table sections (e.g. tbody) and moves the row outlets into them. */
    _applyNativeTableSections() {
        const documentFragment = this._document.createDocumentFragment();
        const sections = [
            { tag: 'thead', outlets: [this._headerRowOutlet] },
            { tag: 'tbody', outlets: [this._rowOutlet, this._noDataRowOutlet] },
            { tag: 'tfoot', outlets: [this._footerRowOutlet] },
        ];
        for (const section of sections) {
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
     */
    _forceRenderDataRows() {
        this._dataDiffer.diff([]);
        this._rowOutlet.viewContainer.clear();
        this.renderRows();
    }
    /**
     * Checks if there has been a change in sticky states since last check and applies the correct
     * sticky styles. Since checking resets the "dirty" state, this should only be performed once
     * during a change detection and after the inputs are settled (after content check).
     */
    _checkStickyStates() {
        const stickyCheckReducer = (acc, d) => {
            return acc || d.hasStickyChanged();
        };
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
            this._stickyColumnStylesNeedReset = true;
            this.updateStickyColumnStyles();
        }
    }
    /**
     * Creates the sticky styler that will be used for sticky rows and columns. Listens
     * for directionality changes and provides the latest direction to the styler. Re-applies column
     * stickiness when directionality changes.
     */
    _setupStickyStyler() {
        const direction = this._dir ? this._dir.value : 'ltr';
        this._stickyStyler = new StickyStyler(this._isNativeHtmlTable, this.stickyCssClass, direction, this._coalescedStyleScheduler, this._platform.isBrowser, this.needsPositionStickyOnElement, this._stickyPositioningListener);
        (this._dir ? this._dir.change : observableOf())
            .pipe(takeUntil(this._onDestroy))
            .subscribe(value => {
            this._stickyStyler.direction = value;
            this.updateStickyColumnStyles();
        });
    }
    /** Filters definitions that belong to this table from a QueryList. */
    _getOwnDefs(items) {
        return items.filter(item => !item._table || item._table === this);
    }
    /** Creates or removes the no data row, depending on whether any data is being shown. */
    _updateNoDataRow() {
        const noDataRow = this._customNoDataRow || this._noDataRow;
        if (noDataRow) {
            const shouldShow = this._rowOutlet.viewContainer.length === 0;
            if (shouldShow !== this._isShowingNoDataRow) {
                const container = this._noDataRowOutlet.viewContainer;
                shouldShow ? container.createEmbeddedView(noDataRow.templateRef) : container.clear();
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
                    '[class.cdk-table-fixed-layout]': 'fixedLayout',
                },
                encapsulation: ViewEncapsulation.None,
                // The "OnPush" status for the `MatTable` component is effectively a noop, so we are removing it.
                // The view for `MatTable` consists entirely of templates declared in other views. As they are
                // declared elsewhere, they are checked when their declaration points are checked.
                // tslint:disable-next-line:validate-decorators
                changeDetection: ChangeDetectionStrategy.Default,
                providers: [
                    { provide: CDK_TABLE, useExisting: CdkTable },
                    { provide: _VIEW_REPEATER_STRATEGY, useClass: _DisposeViewRepeaterStrategy },
                    { provide: _COALESCED_STYLE_SCHEDULER, useClass: _CoalescedStyleScheduler },
                    // Prevent nested tables from seeing this table's StickyPositioningListener.
                    { provide: STICKY_POSITIONING_LISTENER, useValue: null },
                ],
                styles: [".cdk-table-fixed-layout{table-layout:fixed}\n"]
            },] }
];
CdkTable.ctorParameters = () => [
    { type: IterableDiffers },
    { type: ChangeDetectorRef },
    { type: ElementRef },
    { type: String, decorators: [{ type: Attribute, args: ['role',] }] },
    { type: Directionality, decorators: [{ type: Optional }] },
    { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] },
    { type: Platform },
    { type: undefined, decorators: [{ type: Inject, args: [_VIEW_REPEATER_STRATEGY,] }] },
    { type: _CoalescedStyleScheduler, decorators: [{ type: Inject, args: [_COALESCED_STYLE_SCHEDULER,] }] },
    { type: ViewportRuler },
    { type: undefined, decorators: [{ type: Optional }, { type: SkipSelf }, { type: Inject, args: [STICKY_POSITIONING_LISTENER,] }] }
];
CdkTable.propDecorators = {
    trackBy: [{ type: Input }],
    dataSource: [{ type: Input }],
    multiTemplateDataRows: [{ type: Input }],
    fixedLayout: [{ type: Input }],
    contentChanged: [{ type: Output }],
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
/** Utility function that gets a merged list of the entries in an array and values of a Set. */
function mergeArrayAndSet(array, set) {
    return array.concat(Array.from(set));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RhYmxlL3RhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBWSxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM1RCxPQUFPLEVBQWUscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRSxPQUFPLEVBR0wsNEJBQTRCLEVBQzVCLDRCQUE0QixFQUM1QixZQUFZLEVBQ1osdUJBQXVCLEdBS3hCLE1BQU0sMEJBQTBCLENBQUM7QUFDbEMsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQy9DLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNyRCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUVMLFNBQVMsRUFDVCx1QkFBdUIsRUFDdkIsaUJBQWlCLEVBQ2pCLFNBQVMsRUFDVCxZQUFZLEVBQ1osZUFBZSxFQUNmLFNBQVMsRUFDVCxVQUFVLEVBQ1YsZUFBZSxFQUNmLFlBQVksRUFDWixNQUFNLEVBQ04sS0FBSyxFQUdMLGVBQWUsRUFHZixRQUFRLEVBQ1IsTUFBTSxFQUNOLFNBQVMsRUFDVCxRQUFRLEVBR1IsU0FBUyxFQUNULGdCQUFnQixFQUNoQixpQkFBaUIsR0FDbEIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUNMLGVBQWUsRUFDZixZQUFZLEVBRVosRUFBRSxJQUFJLFlBQVksRUFDbEIsT0FBTyxHQUVSLE1BQU0sTUFBTSxDQUFDO0FBQ2QsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDcEMsT0FBTyxFQUFDLHdCQUF3QixFQUFFLDBCQUEwQixFQUFDLE1BQU0sNkJBQTZCLENB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LFNBQVMsU0FBQyxlQUFlLEVBQUUsRUFBQyxNQUFNLEVBQUUsSUFBSSxFQUFDO2lDQU16QyxlQUFlLFNBQUMsWUFBWSxFQUFFLEVBQUMsV0FBVyxFQUFFLElBQUksRUFBQzs4QkFHakQsZUFBZSxTQUFDLFNBQVMsRUFBRSxFQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUM7b0NBRzlDLGVBQWUsU0FBQyxlQUFlLEVBQUU7b0JBQ2hDLFdBQVcsRUFBRSxJQUFJO2lCQUNsQjtvQ0FHQSxlQUFlLFNBQUMsZUFBZSxFQUFFO29CQUNoQyxXQUFXLEVBQUUsSUFBSTtpQkFDbEI7eUJBR0EsWUFBWSxTQUFDLFlBQVk7O0FBaXZCNUIsK0ZBQStGO0FBQy9GLFNBQVMsZ0JBQWdCLENBQUksS0FBVSxFQUFFLEdBQVc7SUFDbEQsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN2QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aW9uLCBEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtCb29sZWFuSW5wdXQsIGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7XG4gIENvbGxlY3Rpb25WaWV3ZXIsXG4gIERhdGFTb3VyY2UsXG4gIF9EaXNwb3NlVmlld1JlcGVhdGVyU3RyYXRlZ3ksXG4gIF9SZWN5Y2xlVmlld1JlcGVhdGVyU3RyYXRlZ3ksXG4gIGlzRGF0YVNvdXJjZSxcbiAgX1ZJRVdfUkVQRUFURVJfU1RSQVRFR1ksXG4gIF9WaWV3UmVwZWF0ZXIsXG4gIF9WaWV3UmVwZWF0ZXJJdGVtQ2hhbmdlLFxuICBfVmlld1JlcGVhdGVySXRlbUluc2VydEFyZ3MsXG4gIF9WaWV3UmVwZWF0ZXJPcGVyYXRpb24sXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2xsZWN0aW9ucyc7XG5pbXBvcnQge1BsYXRmb3JtfSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtWaWV3cG9ydFJ1bGVyfSBmcm9tICdAYW5ndWxhci9jZGsvc2Nyb2xsaW5nJztcbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge1xuICBBZnRlckNvbnRlbnRDaGVja2VkLFxuICBBdHRyaWJ1dGUsXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBDb250ZW50Q2hpbGQsXG4gIENvbnRlbnRDaGlsZHJlbixcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBFbWJlZGRlZFZpZXdSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5qZWN0LFxuICBJbnB1dCxcbiAgSXRlcmFibGVDaGFuZ2VSZWNvcmQsXG4gIEl0ZXJhYmxlRGlmZmVyLFxuICBJdGVyYWJsZURpZmZlcnMsXG4gIE9uRGVzdHJveSxcbiAgT25Jbml0LFxuICBPcHRpb25hbCxcbiAgT3V0cHV0LFxuICBRdWVyeUxpc3QsXG4gIFNraXBTZWxmLFxuICBUZW1wbGF0ZVJlZixcbiAgVHJhY2tCeUZ1bmN0aW9uLFxuICBWaWV3Q2hpbGQsXG4gIFZpZXdDb250YWluZXJSZWYsXG4gIFZpZXdFbmNhcHN1bGF0aW9uLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7XG4gIEJlaGF2aW9yU3ViamVjdCxcbiAgaXNPYnNlcnZhYmxlLFxuICBPYnNlcnZhYmxlLFxuICBvZiBhcyBvYnNlcnZhYmxlT2YsXG4gIFN1YmplY3QsXG4gIFN1YnNjcmlwdGlvbixcbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3Rha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtDZGtDb2x1bW5EZWZ9IGZyb20gJy4vY2VsbCc7XG5pbXBvcnQge19Db2FsZXNjZWRTdHlsZVNjaGVkdWxlciwgX0NPQUxFU0NFRF9TVFlMRV9TQ0hFRFVMRVJ9IGZyb20gJy4vY29hbGVzY2VkLXN0eWxlLXNjaGVkdWxlcic7XG5pbXBvcnQge1xuICBCYXNlUm93RGVmLFxuICBDZGtDZWxsT3V0bGV0LFxuICBDZGtDZWxsT3V0bGV0TXVsdGlSb3dDb250ZXh0LFxuICBDZGtDZWxsT3V0bGV0Um93Q29udGV4dCxcbiAgQ2RrRm9vdGVyUm93RGVmLFxuICBDZGtIZWFkZXJSb3dEZWYsXG4gIENka05vRGF0YVJvdyxcbiAgQ2RrUm93RGVmXG59IGZyb20gJy4vcm93JztcbmltcG9ydCB7U3RpY2t5U3R5bGVyfSBmcm9tICcuL3N0aWNreS1zdHlsZXInO1xuaW1wb3J0IHtcbiAgZ2V0VGFibGVEdXBsaWNhdGVDb2x1bW5OYW1lRXJyb3IsXG4gIGdldFRhYmxlTWlzc2luZ01hdGNoaW5nUm93RGVmRXJyb3IsXG4gIGdldFRhYmxlTWlzc2luZ1Jvd0RlZnNFcnJvcixcbiAgZ2V0VGFibGVNdWx0aXBsZURlZmF1bHRSb3dEZWZzRXJyb3IsXG4gIGdldFRhYmxlVW5rbm93bkNvbHVtbkVycm9yLFxuICBnZXRUYWJsZVVua25vd25EYXRhU291cmNlRXJyb3Jcbn0gZnJvbSAnLi90YWJsZS1lcnJvcnMnO1xuaW1wb3J0IHtTVElDS1lfUE9TSVRJT05JTkdfTElTVEVORVIsIFN0aWNreVBvc2l0aW9uaW5nTGlzdGVuZXJ9IGZyb20gJy4vc3RpY2t5LXBvc2l0aW9uLWxpc3RlbmVyJztcbmltcG9ydCB7Q0RLX1RBQkxFfSBmcm9tICcuL3Rva2Vucyc7XG5cblxuLyoqXG4gKiBFbmFibGVzIHRoZSByZWN5Y2xlIHZpZXcgcmVwZWF0ZXIgc3RyYXRlZ3ksIHdoaWNoIHJlZHVjZXMgcmVuZGVyaW5nIGxhdGVuY3kuIE5vdCBjb21wYXRpYmxlIHdpdGhcbiAqIHRhYmxlcyB0aGF0IGFuaW1hdGUgcm93cy5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnY2RrLXRhYmxlW3JlY3ljbGVSb3dzXSwgdGFibGVbY2RrLXRhYmxlXVtyZWN5Y2xlUm93c10nLFxuICBwcm92aWRlcnM6IFtcbiAgICB7cHJvdmlkZTogX1ZJRVdfUkVQRUFURVJfU1RSQVRFR1ksIHVzZUNsYXNzOiBfUmVjeWNsZVZpZXdSZXBlYXRlclN0cmF0ZWd5fSxcbiAgXSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrUmVjeWNsZVJvd3Mge31cblxuLyoqIEludGVyZmFjZSB1c2VkIHRvIHByb3ZpZGUgYW4gb3V0bGV0IGZvciByb3dzIHRvIGJlIGluc2VydGVkIGludG8uICovXG5leHBvcnQgaW50ZXJmYWNlIFJvd091dGxldCB7XG4gIHZpZXdDb250YWluZXI6IFZpZXdDb250YWluZXJSZWY7XG59XG5cbi8qKlxuICogVW5pb24gb2YgdGhlIHR5cGVzIHRoYXQgY2FuIGJlIHNldCBhcyB0aGUgZGF0YSBzb3VyY2UgZm9yIGEgYENka1RhYmxlYC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xudHlwZSBDZGtUYWJsZURhdGFTb3VyY2VJbnB1dDxUPiA9XG4gICAgcmVhZG9ubHkgVFtdfERhdGFTb3VyY2U8VD58T2JzZXJ2YWJsZTxyZWFkb25seSBUW10+O1xuXG4vKipcbiAqIFByb3ZpZGVzIGEgaGFuZGxlIGZvciB0aGUgdGFibGUgdG8gZ3JhYiB0aGUgdmlldyBjb250YWluZXIncyBuZy1jb250YWluZXIgdG8gaW5zZXJ0IGRhdGEgcm93cy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuQERpcmVjdGl2ZSh7c2VsZWN0b3I6ICdbcm93T3V0bGV0XSd9KVxuZXhwb3J0IGNsYXNzIERhdGFSb3dPdXRsZXQgaW1wbGVtZW50cyBSb3dPdXRsZXQge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgdmlld0NvbnRhaW5lcjogVmlld0NvbnRhaW5lclJlZiwgcHVibGljIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHt9XG59XG5cbi8qKlxuICogUHJvdmlkZXMgYSBoYW5kbGUgZm9yIHRoZSB0YWJsZSB0byBncmFiIHRoZSB2aWV3IGNvbnRhaW5lcidzIG5nLWNvbnRhaW5lciB0byBpbnNlcnQgdGhlIGhlYWRlci5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuQERpcmVjdGl2ZSh7c2VsZWN0b3I6ICdbaGVhZGVyUm93T3V0bGV0XSd9KVxuZXhwb3J0IGNsYXNzIEhlYWRlclJvd091dGxldCBpbXBsZW1lbnRzIFJvd091dGxldCB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyB2aWV3Q29udGFpbmVyOiBWaWV3Q29udGFpbmVyUmVmLCBwdWJsaWMgZWxlbWVudFJlZjogRWxlbWVudFJlZikge31cbn1cblxuLyoqXG4gKiBQcm92aWRlcyBhIGhhbmRsZSBmb3IgdGhlIHRhYmxlIHRvIGdyYWIgdGhlIHZpZXcgY29udGFpbmVyJ3MgbmctY29udGFpbmVyIHRvIGluc2VydCB0aGUgZm9vdGVyLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5ARGlyZWN0aXZlKHtzZWxlY3RvcjogJ1tmb290ZXJSb3dPdXRsZXRdJ30pXG5leHBvcnQgY2xhc3MgRm9vdGVyUm93T3V0bGV0IGltcGxlbWVudHMgUm93T3V0bGV0IHtcbiAgY29uc3RydWN0b3IocHVibGljIHZpZXdDb250YWluZXI6IFZpZXdDb250YWluZXJSZWYsIHB1YmxpYyBlbGVtZW50UmVmOiBFbGVtZW50UmVmKSB7fVxufVxuXG4vKipcbiAqIFByb3ZpZGVzIGEgaGFuZGxlIGZvciB0aGUgdGFibGUgdG8gZ3JhYiB0aGUgdmlld1xuICogY29udGFpbmVyJ3MgbmctY29udGFpbmVyIHRvIGluc2VydCB0aGUgbm8gZGF0YSByb3cuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbkBEaXJlY3RpdmUoe3NlbGVjdG9yOiAnW25vRGF0YVJvd091dGxldF0nfSlcbmV4cG9ydCBjbGFzcyBOb0RhdGFSb3dPdXRsZXQgaW1wbGVtZW50cyBSb3dPdXRsZXQge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgdmlld0NvbnRhaW5lcjogVmlld0NvbnRhaW5lclJlZiwgcHVibGljIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHt9XG59XG5cbi8qKlxuICogVGhlIHRhYmxlIHRlbXBsYXRlIHRoYXQgY2FuIGJlIHVzZWQgYnkgdGhlIG1hdC10YWJsZS4gU2hvdWxkIG5vdCBiZSB1c2VkIG91dHNpZGUgb2YgdGhlXG4gKiBtYXRlcmlhbCBsaWJyYXJ5LlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgY29uc3QgQ0RLX1RBQkxFX1RFTVBMQVRFID1cbiAgICAvLyBOb3RlIHRoYXQgYWNjb3JkaW5nIHRvIE1ETiwgdGhlIGBjYXB0aW9uYCBlbGVtZW50IGhhcyB0byBiZSBwcm9qZWN0ZWQgYXMgdGhlICoqZmlyc3QqKlxuICAgIC8vIGVsZW1lbnQgaW4gdGhlIHRhYmxlLiBTZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRNTC9FbGVtZW50L2NhcHRpb25cbiAgICBgXG4gIDxuZy1jb250ZW50IHNlbGVjdD1cImNhcHRpb25cIj48L25nLWNvbnRlbnQ+XG4gIDxuZy1jb250ZW50IHNlbGVjdD1cImNvbGdyb3VwLCBjb2xcIj48L25nLWNvbnRlbnQ+XG4gIDxuZy1jb250YWluZXIgaGVhZGVyUm93T3V0bGV0PjwvbmctY29udGFpbmVyPlxuICA8bmctY29udGFpbmVyIHJvd091dGxldD48L25nLWNvbnRhaW5lcj5cbiAgPG5nLWNvbnRhaW5lciBub0RhdGFSb3dPdXRsZXQ+PC9uZy1jb250YWluZXI+XG4gIDxuZy1jb250YWluZXIgZm9vdGVyUm93T3V0bGV0PjwvbmctY29udGFpbmVyPlxuYDtcblxuLyoqXG4gKiBJbnRlcmZhY2UgdXNlZCB0byBjb252ZW5pZW50bHkgdHlwZSB0aGUgcG9zc2libGUgY29udGV4dCBpbnRlcmZhY2VzIGZvciB0aGUgcmVuZGVyIHJvdy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSb3dDb250ZXh0PFQ+IGV4dGVuZHMgQ2RrQ2VsbE91dGxldE11bHRpUm93Q29udGV4dDxUPixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIENka0NlbGxPdXRsZXRSb3dDb250ZXh0PFQ+IHt9XG5cbi8qKlxuICogQ2xhc3MgdXNlZCB0byBjb252ZW5pZW50bHkgdHlwZSB0aGUgZW1iZWRkZWQgdmlldyByZWYgZm9yIHJvd3Mgd2l0aCBhIGNvbnRleHQuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmFic3RyYWN0IGNsYXNzIFJvd1ZpZXdSZWY8VD4gZXh0ZW5kcyBFbWJlZGRlZFZpZXdSZWY8Um93Q29udGV4dDxUPj4ge31cblxuLyoqXG4gKiBTZXQgb2YgcHJvcGVydGllcyB0aGF0IHJlcHJlc2VudHMgdGhlIGlkZW50aXR5IG9mIGEgc2luZ2xlIHJlbmRlcmVkIHJvdy5cbiAqXG4gKiBXaGVuIHRoZSB0YWJsZSBuZWVkcyB0byBkZXRlcm1pbmUgdGhlIGxpc3Qgb2Ygcm93cyB0byByZW5kZXIsIGl0IHdpbGwgZG8gc28gYnkgaXRlcmF0aW5nIHRocm91Z2hcbiAqIGVhY2ggZGF0YSBvYmplY3QgYW5kIGV2YWx1YXRpbmcgaXRzIGxpc3Qgb2Ygcm93IHRlbXBsYXRlcyB0byBkaXNwbGF5ICh3aGVuIG11bHRpVGVtcGxhdGVEYXRhUm93c1xuICogaXMgZmFsc2UsIHRoZXJlIGlzIG9ubHkgb25lIHRlbXBsYXRlIHBlciBkYXRhIG9iamVjdCkuIEZvciBlYWNoIHBhaXIgb2YgZGF0YSBvYmplY3QgYW5kIHJvd1xuICogdGVtcGxhdGUsIGEgYFJlbmRlclJvd2AgaXMgYWRkZWQgdG8gdGhlIGxpc3Qgb2Ygcm93cyB0byByZW5kZXIuIElmIHRoZSBkYXRhIG9iamVjdCBhbmQgcm93XG4gKiB0ZW1wbGF0ZSBwYWlyIGhhcyBhbHJlYWR5IGJlZW4gcmVuZGVyZWQsIHRoZSBwcmV2aW91c2x5IHVzZWQgYFJlbmRlclJvd2AgaXMgYWRkZWQ7IGVsc2UgYSBuZXdcbiAqIGBSZW5kZXJSb3dgIGlzICogY3JlYXRlZC4gT25jZSB0aGUgbGlzdCBpcyBjb21wbGV0ZSBhbmQgYWxsIGRhdGEgb2JqZWN0cyBoYXZlIGJlZW4gaXRlcmVhdGVkXG4gKiB0aHJvdWdoLCBhIGRpZmYgaXMgcGVyZm9ybWVkIHRvIGRldGVybWluZSB0aGUgY2hhbmdlcyB0aGF0IG5lZWQgdG8gYmUgbWFkZSB0byB0aGUgcmVuZGVyZWQgcm93cy5cbiAqXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUmVuZGVyUm93PFQ+IHtcbiAgZGF0YTogVDtcbiAgZGF0YUluZGV4OiBudW1iZXI7XG4gIHJvd0RlZjogQ2RrUm93RGVmPFQ+O1xufVxuXG4vKipcbiAqIEEgZGF0YSB0YWJsZSB0aGF0IGNhbiByZW5kZXIgYSBoZWFkZXIgcm93LCBkYXRhIHJvd3MsIGFuZCBhIGZvb3RlciByb3cuXG4gKiBVc2VzIHRoZSBkYXRhU291cmNlIGlucHV0IHRvIGRldGVybWluZSB0aGUgZGF0YSB0byBiZSByZW5kZXJlZC4gVGhlIGRhdGEgY2FuIGJlIHByb3ZpZGVkIGVpdGhlclxuICogYXMgYSBkYXRhIGFycmF5LCBhbiBPYnNlcnZhYmxlIHN0cmVhbSB0aGF0IGVtaXRzIHRoZSBkYXRhIGFycmF5IHRvIHJlbmRlciwgb3IgYSBEYXRhU291cmNlIHdpdGggYVxuICogY29ubmVjdCBmdW5jdGlvbiB0aGF0IHdpbGwgcmV0dXJuIGFuIE9ic2VydmFibGUgc3RyZWFtIHRoYXQgZW1pdHMgdGhlIGRhdGEgYXJyYXkgdG8gcmVuZGVyLlxuICovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdjZGstdGFibGUsIHRhYmxlW2Nkay10YWJsZV0nLFxuICBleHBvcnRBczogJ2Nka1RhYmxlJyxcbiAgdGVtcGxhdGU6IENES19UQUJMRV9URU1QTEFURSxcbiAgc3R5bGVVcmxzOiBbJ3RhYmxlLmNzcyddLFxuICBob3N0OiB7XG4gICAgJ2NsYXNzJzogJ2Nkay10YWJsZScsXG4gICAgJ1tjbGFzcy5jZGstdGFibGUtZml4ZWQtbGF5b3V0XSc6ICdmaXhlZExheW91dCcsXG4gIH0sXG4gIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsXG4gIC8vIFRoZSBcIk9uUHVzaFwiIHN0YXR1cyBmb3IgdGhlIGBNYXRUYWJsZWAgY29tcG9uZW50IGlzIGVmZmVjdGl2ZWx5IGEgbm9vcCwgc28gd2UgYXJlIHJlbW92aW5nIGl0LlxuICAvLyBUaGUgdmlldyBmb3IgYE1hdFRhYmxlYCBjb25zaXN0cyBlbnRpcmVseSBvZiB0ZW1wbGF0ZXMgZGVjbGFyZWQgaW4gb3RoZXIgdmlld3MuIEFzIHRoZXkgYXJlXG4gIC8vIGRlY2xhcmVkIGVsc2V3aGVyZSwgdGhleSBhcmUgY2hlY2tlZCB3aGVuIHRoZWlyIGRlY2xhcmF0aW9uIHBvaW50cyBhcmUgY2hlY2tlZC5cbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOnZhbGlkYXRlLWRlY29yYXRvcnNcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5EZWZhdWx0LFxuICBwcm92aWRlcnM6IFtcbiAgICB7cHJvdmlkZTogQ0RLX1RBQkxFLCB1c2VFeGlzdGluZzogQ2RrVGFibGV9LFxuICAgIHtwcm92aWRlOiBfVklFV19SRVBFQVRFUl9TVFJBVEVHWSwgdXNlQ2xhc3M6IF9EaXNwb3NlVmlld1JlcGVhdGVyU3RyYXRlZ3l9LFxuICAgIHtwcm92aWRlOiBfQ09BTEVTQ0VEX1NUWUxFX1NDSEVEVUxFUiwgdXNlQ2xhc3M6IF9Db2FsZXNjZWRTdHlsZVNjaGVkdWxlcn0sXG4gICAgLy8gUHJldmVudCBuZXN0ZWQgdGFibGVzIGZyb20gc2VlaW5nIHRoaXMgdGFibGUncyBTdGlja3lQb3NpdGlvbmluZ0xpc3RlbmVyLlxuICAgIHtwcm92aWRlOiBTVElDS1lfUE9TSVRJT05JTkdfTElTVEVORVIsIHVzZVZhbHVlOiBudWxsfSxcbiAgXVxufSlcbmV4cG9ydCBjbGFzcyBDZGtUYWJsZTxUPiBpbXBsZW1lbnRzIEFmdGVyQ29udGVudENoZWNrZWQsIENvbGxlY3Rpb25WaWV3ZXIsIE9uRGVzdHJveSwgT25Jbml0IHtcbiAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50O1xuXG4gIC8qKiBMYXRlc3QgZGF0YSBwcm92aWRlZCBieSB0aGUgZGF0YSBzb3VyY2UuICovXG4gIHByb3RlY3RlZCBfZGF0YTogcmVhZG9ubHkgVFtdO1xuXG4gIC8qKiBTdWJqZWN0IHRoYXQgZW1pdHMgd2hlbiB0aGUgY29tcG9uZW50IGhhcyBiZWVuIGRlc3Ryb3llZC4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfb25EZXN0cm95ID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogTGlzdCBvZiB0aGUgcmVuZGVyZWQgcm93cyBhcyBpZGVudGlmaWVkIGJ5IHRoZWlyIGBSZW5kZXJSb3dgIG9iamVjdC4gKi9cbiAgcHJpdmF0ZSBfcmVuZGVyUm93czogUmVuZGVyUm93PFQ+W107XG5cbiAgLyoqIFN1YnNjcmlwdGlvbiB0aGF0IGxpc3RlbnMgZm9yIHRoZSBkYXRhIHByb3ZpZGVkIGJ5IHRoZSBkYXRhIHNvdXJjZS4gKi9cbiAgcHJpdmF0ZSBfcmVuZGVyQ2hhbmdlU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb258bnVsbDtcblxuICAvKipcbiAgICogTWFwIG9mIGFsbCB0aGUgdXNlcidzIGRlZmluZWQgY29sdW1ucyAoaGVhZGVyLCBkYXRhLCBhbmQgZm9vdGVyIGNlbGwgdGVtcGxhdGUpIGlkZW50aWZpZWQgYnlcbiAgICogbmFtZS4gQ29sbGVjdGlvbiBwb3B1bGF0ZWQgYnkgdGhlIGNvbHVtbiBkZWZpbml0aW9ucyBnYXRoZXJlZCBieSBgQ29udGVudENoaWxkcmVuYCBhcyB3ZWxsIGFzXG4gICAqIGFueSBjdXN0b20gY29sdW1uIGRlZmluaXRpb25zIGFkZGVkIHRvIGBfY3VzdG9tQ29sdW1uRGVmc2AuXG4gICAqL1xuICBwcml2YXRlIF9jb2x1bW5EZWZzQnlOYW1lID0gbmV3IE1hcDxzdHJpbmcsIENka0NvbHVtbkRlZj4oKTtcblxuICAvKipcbiAgICogU2V0IG9mIGFsbCByb3cgZGVmaW5pdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCBieSB0aGlzIHRhYmxlLiBQb3B1bGF0ZWQgYnkgdGhlIHJvd3MgZ2F0aGVyZWQgYnlcbiAgICogdXNpbmcgYENvbnRlbnRDaGlsZHJlbmAgYXMgd2VsbCBhcyBhbnkgY3VzdG9tIHJvdyBkZWZpbml0aW9ucyBhZGRlZCB0byBgX2N1c3RvbVJvd0RlZnNgLlxuICAgKi9cbiAgcHJpdmF0ZSBfcm93RGVmczogQ2RrUm93RGVmPFQ+W107XG5cbiAgLyoqXG4gICAqIFNldCBvZiBhbGwgaGVhZGVyIHJvdyBkZWZpbml0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIGJ5IHRoaXMgdGFibGUuIFBvcHVsYXRlZCBieSB0aGUgcm93c1xuICAgKiBnYXRoZXJlZCBieSB1c2luZyBgQ29udGVudENoaWxkcmVuYCBhcyB3ZWxsIGFzIGFueSBjdXN0b20gcm93IGRlZmluaXRpb25zIGFkZGVkIHRvXG4gICAqIGBfY3VzdG9tSGVhZGVyUm93RGVmc2AuXG4gICAqL1xuICBwcml2YXRlIF9oZWFkZXJSb3dEZWZzOiBDZGtIZWFkZXJSb3dEZWZbXTtcblxuICAvKipcbiAgICogU2V0IG9mIGFsbCByb3cgZGVmaW5pdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCBieSB0aGlzIHRhYmxlLiBQb3B1bGF0ZWQgYnkgdGhlIHJvd3MgZ2F0aGVyZWQgYnlcbiAgICogdXNpbmcgYENvbnRlbnRDaGlsZHJlbmAgYXMgd2VsbCBhcyBhbnkgY3VzdG9tIHJvdyBkZWZpbml0aW9ucyBhZGRlZCB0b1xuICAgKiBgX2N1c3RvbUZvb3RlclJvd0RlZnNgLlxuICAgKi9cbiAgcHJpdmF0ZSBfZm9vdGVyUm93RGVmczogQ2RrRm9vdGVyUm93RGVmW107XG5cbiAgLyoqIERpZmZlciB1c2VkIHRvIGZpbmQgdGhlIGNoYW5nZXMgaW4gdGhlIGRhdGEgcHJvdmlkZWQgYnkgdGhlIGRhdGEgc291cmNlLiAqL1xuICBwcml2YXRlIF9kYXRhRGlmZmVyOiBJdGVyYWJsZURpZmZlcjxSZW5kZXJSb3c8VD4+O1xuXG4gIC8qKiBTdG9yZXMgdGhlIHJvdyBkZWZpbml0aW9uIHRoYXQgZG9lcyBub3QgaGF2ZSBhIHdoZW4gcHJlZGljYXRlLiAqL1xuICBwcml2YXRlIF9kZWZhdWx0Um93RGVmOiBDZGtSb3dEZWY8VD58bnVsbDtcblxuICAvKipcbiAgICogQ29sdW1uIGRlZmluaXRpb25zIHRoYXQgd2VyZSBkZWZpbmVkIG91dHNpZGUgb2YgdGhlIGRpcmVjdCBjb250ZW50IGNoaWxkcmVuIG9mIHRoZSB0YWJsZS5cbiAgICogVGhlc2Ugd2lsbCBiZSBkZWZpbmVkIHdoZW4sIGUuZy4sIGNyZWF0aW5nIGEgd3JhcHBlciBhcm91bmQgdGhlIGNka1RhYmxlIHRoYXQgaGFzXG4gICAqIGNvbHVtbiBkZWZpbml0aW9ucyBhcyAqaXRzKiBjb250ZW50IGNoaWxkLlxuICAgKi9cbiAgcHJpdmF0ZSBfY3VzdG9tQ29sdW1uRGVmcyA9IG5ldyBTZXQ8Q2RrQ29sdW1uRGVmPigpO1xuXG4gIC8qKlxuICAgKiBEYXRhIHJvdyBkZWZpbml0aW9ucyB0aGF0IHdlcmUgZGVmaW5lZCBvdXRzaWRlIG9mIHRoZSBkaXJlY3QgY29udGVudCBjaGlsZHJlbiBvZiB0aGUgdGFibGUuXG4gICAqIFRoZXNlIHdpbGwgYmUgZGVmaW5lZCB3aGVuLCBlLmcuLCBjcmVhdGluZyBhIHdyYXBwZXIgYXJvdW5kIHRoZSBjZGtUYWJsZSB0aGF0IGhhc1xuICAgKiBidWlsdC1pbiBkYXRhIHJvd3MgYXMgKml0cyogY29udGVudCBjaGlsZC5cbiAgICovXG4gIHByaXZhdGUgX2N1c3RvbVJvd0RlZnMgPSBuZXcgU2V0PENka1Jvd0RlZjxUPj4oKTtcblxuICAvKipcbiAgICogSGVhZGVyIHJvdyBkZWZpbml0aW9ucyB0aGF0IHdlcmUgZGVmaW5lZCBvdXRzaWRlIG9mIHRoZSBkaXJlY3QgY29udGVudCBjaGlsZHJlbiBvZiB0aGUgdGFibGUuXG4gICAqIFRoZXNlIHdpbGwgYmUgZGVmaW5lZCB3aGVuLCBlLmcuLCBjcmVhdGluZyBhIHdyYXBwZXIgYXJvdW5kIHRoZSBjZGtUYWJsZSB0aGF0IGhhc1xuICAgKiBidWlsdC1pbiBoZWFkZXIgcm93cyBhcyAqaXRzKiBjb250ZW50IGNoaWxkLlxuICAgKi9cbiAgcHJpdmF0ZSBfY3VzdG9tSGVhZGVyUm93RGVmcyA9IG5ldyBTZXQ8Q2RrSGVhZGVyUm93RGVmPigpO1xuXG4gIC8qKlxuICAgKiBGb290ZXIgcm93IGRlZmluaXRpb25zIHRoYXQgd2VyZSBkZWZpbmVkIG91dHNpZGUgb2YgdGhlIGRpcmVjdCBjb250ZW50IGNoaWxkcmVuIG9mIHRoZSB0YWJsZS5cbiAgICogVGhlc2Ugd2lsbCBiZSBkZWZpbmVkIHdoZW4sIGUuZy4sIGNyZWF0aW5nIGEgd3JhcHBlciBhcm91bmQgdGhlIGNka1RhYmxlIHRoYXQgaGFzIGFcbiAgICogYnVpbHQtaW4gZm9vdGVyIHJvdyBhcyAqaXRzKiBjb250ZW50IGNoaWxkLlxuICAgKi9cbiAgcHJpdmF0ZSBfY3VzdG9tRm9vdGVyUm93RGVmcyA9IG5ldyBTZXQ8Q2RrRm9vdGVyUm93RGVmPigpO1xuXG4gIC8qKiBObyBkYXRhIHJvdyB0aGF0IHdhcyBkZWZpbmVkIG91dHNpZGUgb2YgdGhlIGRpcmVjdCBjb250ZW50IGNoaWxkcmVuIG9mIHRoZSB0YWJsZS4gKi9cbiAgcHJpdmF0ZSBfY3VzdG9tTm9EYXRhUm93OiBDZGtOb0RhdGFSb3cgfCBudWxsO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBoZWFkZXIgcm93IGRlZmluaXRpb24gaGFzIGJlZW4gY2hhbmdlZC4gVHJpZ2dlcnMgYW4gdXBkYXRlIHRvIHRoZSBoZWFkZXIgcm93IGFmdGVyXG4gICAqIGNvbnRlbnQgaXMgY2hlY2tlZC4gSW5pdGlhbGl6ZWQgYXMgdHJ1ZSBzbyB0aGF0IHRoZSB0YWJsZSByZW5kZXJzIHRoZSBpbml0aWFsIHNldCBvZiByb3dzLlxuICAgKi9cbiAgcHJpdmF0ZSBfaGVhZGVyUm93RGVmQ2hhbmdlZCA9IHRydWU7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGZvb3RlciByb3cgZGVmaW5pdGlvbiBoYXMgYmVlbiBjaGFuZ2VkLiBUcmlnZ2VycyBhbiB1cGRhdGUgdG8gdGhlIGZvb3RlciByb3cgYWZ0ZXJcbiAgICogY29udGVudCBpcyBjaGVja2VkLiBJbml0aWFsaXplZCBhcyB0cnVlIHNvIHRoYXQgdGhlIHRhYmxlIHJlbmRlcnMgdGhlIGluaXRpYWwgc2V0IG9mIHJvd3MuXG4gICAqL1xuICBwcml2YXRlIF9mb290ZXJSb3dEZWZDaGFuZ2VkID0gdHJ1ZTtcblxuICAvKipcbiAgICogV2hldGhlciB0aGUgc3RpY2t5IGNvbHVtbiBzdHlsZXMgbmVlZCB0byBiZSB1cGRhdGVkLiBTZXQgdG8gYHRydWVgIHdoZW4gdGhlIHZpc2libGUgY29sdW1uc1xuICAgKiBjaGFuZ2UuXG4gICAqL1xuICBwcml2YXRlIF9zdGlja3lDb2x1bW5TdHlsZXNOZWVkUmVzZXQgPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBzdGlja3kgc3R5bGVyIHNob3VsZCByZWNhbGN1bGF0ZSBjZWxsIHdpZHRocyB3aGVuIGFwcGx5aW5nIHN0aWNreSBzdHlsZXMuIElmXG4gICAqIGBmYWxzZWAsIGNhY2hlZCB2YWx1ZXMgd2lsbCBiZSB1c2VkIGluc3RlYWQuIFRoaXMgaXMgb25seSBhcHBsaWNhYmxlIHRvIHRhYmxlcyB3aXRoXG4gICAqIHtAbGluayBmaXhlZExheW91dH0gZW5hYmxlZC4gRm9yIG90aGVyIHRhYmxlcywgY2VsbCB3aWR0aHMgd2lsbCBhbHdheXMgYmUgcmVjYWxjdWxhdGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfZm9yY2VSZWNhbGN1bGF0ZUNlbGxXaWR0aHMgPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBDYWNoZSBvZiB0aGUgbGF0ZXN0IHJlbmRlcmVkIGBSZW5kZXJSb3dgIG9iamVjdHMgYXMgYSBtYXAgZm9yIGVhc3kgcmV0cmlldmFsIHdoZW4gY29uc3RydWN0aW5nXG4gICAqIGEgbmV3IGxpc3Qgb2YgYFJlbmRlclJvd2Agb2JqZWN0cyBmb3IgcmVuZGVyaW5nIHJvd3MuIFNpbmNlIHRoZSBuZXcgbGlzdCBpcyBjb25zdHJ1Y3RlZCB3aXRoXG4gICAqIHRoZSBjYWNoZWQgYFJlbmRlclJvd2Agb2JqZWN0cyB3aGVuIHBvc3NpYmxlLCB0aGUgcm93IGlkZW50aXR5IGlzIHByZXNlcnZlZCB3aGVuIHRoZSBkYXRhXG4gICAqIGFuZCByb3cgdGVtcGxhdGUgbWF0Y2hlcywgd2hpY2ggYWxsb3dzIHRoZSBgSXRlcmFibGVEaWZmZXJgIHRvIGNoZWNrIHJvd3MgYnkgcmVmZXJlbmNlXG4gICAqIGFuZCB1bmRlcnN0YW5kIHdoaWNoIHJvd3MgYXJlIGFkZGVkL21vdmVkL3JlbW92ZWQuXG4gICAqXG4gICAqIEltcGxlbWVudGVkIGFzIGEgbWFwIG9mIG1hcHMgd2hlcmUgdGhlIGZpcnN0IGtleSBpcyB0aGUgYGRhdGE6IFRgIG9iamVjdCBhbmQgdGhlIHNlY29uZCBpcyB0aGVcbiAgICogYENka1Jvd0RlZjxUPmAgb2JqZWN0LiBXaXRoIHRoZSB0d28ga2V5cywgdGhlIGNhY2hlIHBvaW50cyB0byBhIGBSZW5kZXJSb3c8VD5gIG9iamVjdCB0aGF0XG4gICAqIGNvbnRhaW5zIGFuIGFycmF5IG9mIGNyZWF0ZWQgcGFpcnMuIFRoZSBhcnJheSBpcyBuZWNlc3NhcnkgdG8gaGFuZGxlIGNhc2VzIHdoZXJlIHRoZSBkYXRhXG4gICAqIGFycmF5IGNvbnRhaW5zIG11bHRpcGxlIGR1cGxpY2F0ZSBkYXRhIG9iamVjdHMgYW5kIGVhY2ggaW5zdGFudGlhdGVkIGBSZW5kZXJSb3dgIG11c3QgYmVcbiAgICogc3RvcmVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfY2FjaGVkUmVuZGVyUm93c01hcCA9IG5ldyBNYXA8VCwgV2Vha01hcDxDZGtSb3dEZWY8VD4sIFJlbmRlclJvdzxUPltdPj4oKTtcblxuICAvKiogV2hldGhlciB0aGUgdGFibGUgaXMgYXBwbGllZCB0byBhIG5hdGl2ZSBgPHRhYmxlPmAuICovXG4gIHByb3RlY3RlZCBfaXNOYXRpdmVIdG1sVGFibGU6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFV0aWxpdHkgY2xhc3MgdGhhdCBpcyByZXNwb25zaWJsZSBmb3IgYXBwbHlpbmcgdGhlIGFwcHJvcHJpYXRlIHN0aWNreSBwb3NpdGlvbmluZyBzdHlsZXMgdG9cbiAgICogdGhlIHRhYmxlJ3Mgcm93cyBhbmQgY2VsbHMuXG4gICAqL1xuICBwcml2YXRlIF9zdGlja3lTdHlsZXI6IFN0aWNreVN0eWxlcjtcblxuICAvKipcbiAgICogQ1NTIGNsYXNzIGFkZGVkIHRvIGFueSByb3cgb3IgY2VsbCB0aGF0IGhhcyBzdGlja3kgcG9zaXRpb25pbmcgYXBwbGllZC4gTWF5IGJlIG92ZXJyaWRlbiBieVxuICAgKiB0YWJsZSBzdWJjbGFzc2VzLlxuICAgKi9cbiAgcHJvdGVjdGVkIHN0aWNreUNzc0NsYXNzOiBzdHJpbmcgPSAnY2RrLXRhYmxlLXN0aWNreSc7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdG8gbWFudWFsbHkgYWRkIHBvc2l0b246IHN0aWNreSB0byBhbGwgc3RpY2t5IGNlbGwgZWxlbWVudHMuIE5vdCBuZWVkZWQgaWZcbiAgICogdGhlIHBvc2l0aW9uIGlzIHNldCBpbiBhIHNlbGVjdG9yIGFzc29jaWF0ZWQgd2l0aCB0aGUgdmFsdWUgb2Ygc3RpY2t5Q3NzQ2xhc3MuIE1heSBiZVxuICAgKiBvdmVycmlkZGVuIGJ5IHRhYmxlIHN1YmNsYXNzZXNcbiAgICovXG4gIHByb3RlY3RlZCBuZWVkc1Bvc2l0aW9uU3RpY2t5T25FbGVtZW50ID0gdHJ1ZTtcblxuICAvKiogV2hldGhlciB0aGUgbm8gZGF0YSByb3cgaXMgY3VycmVudGx5IHNob3dpbmcgYW55dGhpbmcuICovXG4gIHByaXZhdGUgX2lzU2hvd2luZ05vRGF0YVJvdyA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBUcmFja2luZyBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgdXNlZCB0byBjaGVjayB0aGUgZGlmZmVyZW5jZXMgaW4gZGF0YSBjaGFuZ2VzLiBVc2VkIHNpbWlsYXJseVxuICAgKiB0byBgbmdGb3JgIGB0cmFja0J5YCBmdW5jdGlvbi4gT3B0aW1pemUgcm93IG9wZXJhdGlvbnMgYnkgaWRlbnRpZnlpbmcgYSByb3cgYmFzZWQgb24gaXRzIGRhdGFcbiAgICogcmVsYXRpdmUgdG8gdGhlIGZ1bmN0aW9uIHRvIGtub3cgaWYgYSByb3cgc2hvdWxkIGJlIGFkZGVkL3JlbW92ZWQvbW92ZWQuXG4gICAqIEFjY2VwdHMgYSBmdW5jdGlvbiB0aGF0IHRha2VzIHR3byBwYXJhbWV0ZXJzLCBgaW5kZXhgIGFuZCBgaXRlbWAuXG4gICAqL1xuICBASW5wdXQoKVxuICBnZXQgdHJhY2tCeSgpOiBUcmFja0J5RnVuY3Rpb248VD4ge1xuICAgIHJldHVybiB0aGlzLl90cmFja0J5Rm47XG4gIH1cbiAgc2V0IHRyYWNrQnkoZm46IFRyYWNrQnlGdW5jdGlvbjxUPikge1xuICAgIGlmICgodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJiBmbiAhPSBudWxsICYmIHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY29uc29sZS53YXJuKGB0cmFja0J5IG11c3QgYmUgYSBmdW5jdGlvbiwgYnV0IHJlY2VpdmVkICR7SlNPTi5zdHJpbmdpZnkoZm4pfS5gKTtcbiAgICB9XG4gICAgdGhpcy5fdHJhY2tCeUZuID0gZm47XG4gIH1cbiAgcHJpdmF0ZSBfdHJhY2tCeUZuOiBUcmFja0J5RnVuY3Rpb248VD47XG5cbiAgLyoqXG4gICAqIFRoZSB0YWJsZSdzIHNvdXJjZSBvZiBkYXRhLCB3aGljaCBjYW4gYmUgcHJvdmlkZWQgaW4gdGhyZWUgd2F5cyAoaW4gb3JkZXIgb2YgY29tcGxleGl0eSk6XG4gICAqICAgLSBTaW1wbGUgZGF0YSBhcnJheSAoZWFjaCBvYmplY3QgcmVwcmVzZW50cyBvbmUgdGFibGUgcm93KVxuICAgKiAgIC0gU3RyZWFtIHRoYXQgZW1pdHMgYSBkYXRhIGFycmF5IGVhY2ggdGltZSB0aGUgYXJyYXkgY2hhbmdlc1xuICAgKiAgIC0gYERhdGFTb3VyY2VgIG9iamVjdCB0aGF0IGltcGxlbWVudHMgdGhlIGNvbm5lY3QvZGlzY29ubmVjdCBpbnRlcmZhY2UuXG4gICAqXG4gICAqIElmIGEgZGF0YSBhcnJheSBpcyBwcm92aWRlZCwgdGhlIHRhYmxlIG11c3QgYmUgbm90aWZpZWQgd2hlbiB0aGUgYXJyYXkncyBvYmplY3RzIGFyZVxuICAgKiBhZGRlZCwgcmVtb3ZlZCwgb3IgbW92ZWQuIFRoaXMgY2FuIGJlIGRvbmUgYnkgY2FsbGluZyB0aGUgYHJlbmRlclJvd3MoKWAgZnVuY3Rpb24gd2hpY2ggd2lsbFxuICAgKiByZW5kZXIgdGhlIGRpZmYgc2luY2UgdGhlIGxhc3QgdGFibGUgcmVuZGVyLiBJZiB0aGUgZGF0YSBhcnJheSByZWZlcmVuY2UgaXMgY2hhbmdlZCwgdGhlIHRhYmxlXG4gICAqIHdpbGwgYXV0b21hdGljYWxseSB0cmlnZ2VyIGFuIHVwZGF0ZSB0byB0aGUgcm93cy5cbiAgICpcbiAgICogV2hlbiBwcm92aWRpbmcgYW4gT2JzZXJ2YWJsZSBzdHJlYW0sIHRoZSB0YWJsZSB3aWxsIHRyaWdnZXIgYW4gdXBkYXRlIGF1dG9tYXRpY2FsbHkgd2hlbiB0aGVcbiAgICogc3RyZWFtIGVtaXRzIGEgbmV3IGFycmF5IG9mIGRhdGEuXG4gICAqXG4gICAqIEZpbmFsbHksIHdoZW4gcHJvdmlkaW5nIGEgYERhdGFTb3VyY2VgIG9iamVjdCwgdGhlIHRhYmxlIHdpbGwgdXNlIHRoZSBPYnNlcnZhYmxlIHN0cmVhbVxuICAgKiBwcm92aWRlZCBieSB0aGUgY29ubmVjdCBmdW5jdGlvbiBhbmQgdHJpZ2dlciB1cGRhdGVzIHdoZW4gdGhhdCBzdHJlYW0gZW1pdHMgbmV3IGRhdGEgYXJyYXlcbiAgICogdmFsdWVzLiBEdXJpbmcgdGhlIHRhYmxlJ3MgbmdPbkRlc3Ryb3kgb3Igd2hlbiB0aGUgZGF0YSBzb3VyY2UgaXMgcmVtb3ZlZCBmcm9tIHRoZSB0YWJsZSwgdGhlXG4gICAqIHRhYmxlIHdpbGwgY2FsbCB0aGUgRGF0YVNvdXJjZSdzIGBkaXNjb25uZWN0YCBmdW5jdGlvbiAobWF5IGJlIHVzZWZ1bCBmb3IgY2xlYW5pbmcgdXAgYW55XG4gICAqIHN1YnNjcmlwdGlvbnMgcmVnaXN0ZXJlZCBkdXJpbmcgdGhlIGNvbm5lY3QgcHJvY2VzcykuXG4gICAqL1xuICBASW5wdXQoKVxuICBnZXQgZGF0YVNvdXJjZSgpOiBDZGtUYWJsZURhdGFTb3VyY2VJbnB1dDxUPiB7XG4gICAgcmV0dXJuIHRoaXMuX2RhdGFTb3VyY2U7XG4gIH1cbiAgc2V0IGRhdGFTb3VyY2UoZGF0YVNvdXJjZTogQ2RrVGFibGVEYXRhU291cmNlSW5wdXQ8VD4pIHtcbiAgICBpZiAodGhpcy5fZGF0YVNvdXJjZSAhPT0gZGF0YVNvdXJjZSkge1xuICAgICAgdGhpcy5fc3dpdGNoRGF0YVNvdXJjZShkYXRhU291cmNlKTtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBfZGF0YVNvdXJjZTogQ2RrVGFibGVEYXRhU291cmNlSW5wdXQ8VD47XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdG8gYWxsb3cgbXVsdGlwbGUgcm93cyBwZXIgZGF0YSBvYmplY3QgYnkgZXZhbHVhdGluZyB3aGljaCByb3dzIGV2YWx1YXRlIHRoZWlyICd3aGVuJ1xuICAgKiBwcmVkaWNhdGUgdG8gdHJ1ZS4gSWYgYG11bHRpVGVtcGxhdGVEYXRhUm93c2AgaXMgZmFsc2UsIHdoaWNoIGlzIHRoZSBkZWZhdWx0IHZhbHVlLCB0aGVuIGVhY2hcbiAgICogZGF0YW9iamVjdCB3aWxsIHJlbmRlciB0aGUgZmlyc3Qgcm93IHRoYXQgZXZhbHVhdGVzIGl0cyB3aGVuIHByZWRpY2F0ZSB0byB0cnVlLCBpbiB0aGUgb3JkZXJcbiAgICogZGVmaW5lZCBpbiB0aGUgdGFibGUsIG9yIG90aGVyd2lzZSB0aGUgZGVmYXVsdCByb3cgd2hpY2ggZG9lcyBub3QgaGF2ZSBhIHdoZW4gcHJlZGljYXRlLlxuICAgKi9cbiAgQElucHV0KClcbiAgZ2V0IG11bHRpVGVtcGxhdGVEYXRhUm93cygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fbXVsdGlUZW1wbGF0ZURhdGFSb3dzO1xuICB9XG4gIHNldCBtdWx0aVRlbXBsYXRlRGF0YVJvd3ModjogYm9vbGVhbikge1xuICAgIHRoaXMuX211bHRpVGVtcGxhdGVEYXRhUm93cyA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2KTtcblxuICAgIC8vIEluIEl2eSBpZiB0aGlzIHZhbHVlIGlzIHNldCB2aWEgYSBzdGF0aWMgYXR0cmlidXRlIChlLmcuIDx0YWJsZSBtdWx0aVRlbXBsYXRlRGF0YVJvd3M+KSxcbiAgICAvLyB0aGlzIHNldHRlciB3aWxsIGJlIGludm9rZWQgYmVmb3JlIHRoZSByb3cgb3V0bGV0IGhhcyBiZWVuIGRlZmluZWQgaGVuY2UgdGhlIG51bGwgY2hlY2suXG4gICAgaWYgKHRoaXMuX3Jvd091dGxldCAmJiB0aGlzLl9yb3dPdXRsZXQudmlld0NvbnRhaW5lci5sZW5ndGgpIHtcbiAgICAgIHRoaXMuX2ZvcmNlUmVuZGVyRGF0YVJvd3MoKTtcbiAgICAgIHRoaXMudXBkYXRlU3RpY2t5Q29sdW1uU3R5bGVzKCk7XG4gICAgfVxuICB9XG4gIF9tdWx0aVRlbXBsYXRlRGF0YVJvd3M6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKipcbiAgICogV2hldGhlciB0byB1c2UgYSBmaXhlZCB0YWJsZSBsYXlvdXQuIEVuYWJsaW5nIHRoaXMgb3B0aW9uIHdpbGwgZW5mb3JjZSBjb25zaXN0ZW50IGNvbHVtbiB3aWR0aHNcbiAgICogYW5kIG9wdGltaXplIHJlbmRlcmluZyBzdGlja3kgc3R5bGVzIGZvciBuYXRpdmUgdGFibGVzLiBOby1vcCBmb3IgZmxleCB0YWJsZXMuXG4gICAqL1xuICBASW5wdXQoKVxuICBnZXQgZml4ZWRMYXlvdXQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2ZpeGVkTGF5b3V0O1xuICB9XG4gIHNldCBmaXhlZExheW91dCh2OiBib29sZWFuKSB7XG4gICAgdGhpcy5fZml4ZWRMYXlvdXQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodik7XG5cbiAgICAvLyBUb2dnbGluZyBgZml4ZWRMYXlvdXRgIG1heSBjaGFuZ2UgY29sdW1uIHdpZHRocy4gU3RpY2t5IGNvbHVtbiBzdHlsZXMgc2hvdWxkIGJlIHJlY2FsY3VsYXRlZC5cbiAgICB0aGlzLl9mb3JjZVJlY2FsY3VsYXRlQ2VsbFdpZHRocyA9IHRydWU7XG4gICAgdGhpcy5fc3RpY2t5Q29sdW1uU3R5bGVzTmVlZFJlc2V0ID0gdHJ1ZTtcbiAgfVxuICBwcml2YXRlIF9maXhlZExheW91dDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB3aGVuIHRoZSB0YWJsZSBjb21wbGV0ZXMgcmVuZGVyaW5nIGEgc2V0IG9mIGRhdGEgcm93cyBiYXNlZCBvbiB0aGUgbGF0ZXN0IGRhdGEgZnJvbSB0aGVcbiAgICogZGF0YSBzb3VyY2UsIGV2ZW4gaWYgdGhlIHNldCBvZiByb3dzIGlzIGVtcHR5LlxuICAgKi9cbiAgQE91dHB1dCgpXG4gIHJlYWRvbmx5IGNvbnRlbnRDaGFuZ2VkID0gbmV3IEV2ZW50RW1pdHRlcjx2b2lkPigpO1xuXG4gIC8vIFRPRE8oYW5kcmV3c2VndWluKTogUmVtb3ZlIG1heCB2YWx1ZSBhcyB0aGUgZW5kIGluZGV4XG4gIC8vICAgYW5kIGluc3RlYWQgY2FsY3VsYXRlIHRoZSB2aWV3IG9uIGluaXQgYW5kIHNjcm9sbC5cbiAgLyoqXG4gICAqIFN0cmVhbSBjb250YWluaW5nIHRoZSBsYXRlc3QgaW5mb3JtYXRpb24gb24gd2hhdCByb3dzIGFyZSBiZWluZyBkaXNwbGF5ZWQgb24gc2NyZWVuLlxuICAgKiBDYW4gYmUgdXNlZCBieSB0aGUgZGF0YSBzb3VyY2UgdG8gYXMgYSBoZXVyaXN0aWMgb2Ygd2hhdCBkYXRhIHNob3VsZCBiZSBwcm92aWRlZC5cbiAgICpcbiAgICogQGRvY3MtcHJpdmF0ZVxuICAgKi9cbiAgcmVhZG9ubHkgdmlld0NoYW5nZSA9XG4gICAgICBuZXcgQmVoYXZpb3JTdWJqZWN0PHtzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcn0+KHtzdGFydDogMCwgZW5kOiBOdW1iZXIuTUFYX1ZBTFVFfSk7XG5cbiAgLy8gT3V0bGV0cyBpbiB0aGUgdGFibGUncyB0ZW1wbGF0ZSB3aGVyZSB0aGUgaGVhZGVyLCBkYXRhIHJvd3MsIGFuZCBmb290ZXIgd2lsbCBiZSBpbnNlcnRlZC5cbiAgQFZpZXdDaGlsZChEYXRhUm93T3V0bGV0LCB7c3RhdGljOiB0cnVlfSkgX3Jvd091dGxldDogRGF0YVJvd091dGxldDtcbiAgQFZpZXdDaGlsZChIZWFkZXJSb3dPdXRsZXQsIHtzdGF0aWM6IHRydWV9KSBfaGVhZGVyUm93T3V0bGV0OiBIZWFkZXJSb3dPdXRsZXQ7XG4gIEBWaWV3Q2hpbGQoRm9vdGVyUm93T3V0bGV0LCB7c3RhdGljOiB0cnVlfSkgX2Zvb3RlclJvd091dGxldDogRm9vdGVyUm93T3V0bGV0O1xuICBAVmlld0NoaWxkKE5vRGF0YVJvd091dGxldCwge3N0YXRpYzogdHJ1ZX0pIF9ub0RhdGFSb3dPdXRsZXQ6IE5vRGF0YVJvd091dGxldDtcblxuICAvKipcbiAgICogVGhlIGNvbHVtbiBkZWZpbml0aW9ucyBwcm92aWRlZCBieSB0aGUgdXNlciB0aGF0IGNvbnRhaW4gd2hhdCB0aGUgaGVhZGVyLCBkYXRhLCBhbmQgZm9vdGVyXG4gICAqIGNlbGxzIHNob3VsZCByZW5kZXIgZm9yIGVhY2ggY29sdW1uLlxuICAgKi9cbiAgQENvbnRlbnRDaGlsZHJlbihDZGtDb2x1bW5EZWYsIHtkZXNjZW5kYW50czogdHJ1ZX0pIF9jb250ZW50Q29sdW1uRGVmczogUXVlcnlMaXN0PENka0NvbHVtbkRlZj47XG5cbiAgLyoqIFNldCBvZiBkYXRhIHJvdyBkZWZpbml0aW9ucyB0aGF0IHdlcmUgcHJvdmlkZWQgdG8gdGhlIHRhYmxlIGFzIGNvbnRlbnQgY2hpbGRyZW4uICovXG4gIEBDb250ZW50Q2hpbGRyZW4oQ2RrUm93RGVmLCB7ZGVzY2VuZGFudHM6IHRydWV9KSBfY29udGVudFJvd0RlZnM6IFF1ZXJ5TGlzdDxDZGtSb3dEZWY8VD4+O1xuXG4gIC8qKiBTZXQgb2YgaGVhZGVyIHJvdyBkZWZpbml0aW9ucyB0aGF0IHdlcmUgcHJvdmlkZWQgdG8gdGhlIHRhYmxlIGFzIGNvbnRlbnQgY2hpbGRyZW4uICovXG4gIEBDb250ZW50Q2hpbGRyZW4oQ2RrSGVhZGVyUm93RGVmLCB7XG4gICAgZGVzY2VuZGFudHM6IHRydWVcbiAgfSkgX2NvbnRlbnRIZWFkZXJSb3dEZWZzOiBRdWVyeUxpc3Q8Q2RrSGVhZGVyUm93RGVmPjtcblxuICAvKiogU2V0IG9mIGZvb3RlciByb3cgZGVmaW5pdGlvbnMgdGhhdCB3ZXJlIHByb3ZpZGVkIHRvIHRoZSB0YWJsZSBhcyBjb250ZW50IGNoaWxkcmVuLiAqL1xuICBAQ29udGVudENoaWxkcmVuKENka0Zvb3RlclJvd0RlZiwge1xuICAgIGRlc2NlbmRhbnRzOiB0cnVlXG4gIH0pIF9jb250ZW50Rm9vdGVyUm93RGVmczogUXVlcnlMaXN0PENka0Zvb3RlclJvd0RlZj47XG5cbiAgLyoqIFJvdyBkZWZpbml0aW9uIHRoYXQgd2lsbCBvbmx5IGJlIHJlbmRlcmVkIGlmIHRoZXJlJ3Mgbm8gZGF0YSBpbiB0aGUgdGFibGUuICovXG4gIEBDb250ZW50Q2hpbGQoQ2RrTm9EYXRhUm93KSBfbm9EYXRhUm93OiBDZGtOb0RhdGFSb3c7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcm90ZWN0ZWQgcmVhZG9ubHkgX2RpZmZlcnM6IEl0ZXJhYmxlRGlmZmVycyxcbiAgICAgIHByb3RlY3RlZCByZWFkb25seSBfY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmLFxuICAgICAgcHJvdGVjdGVkIHJlYWRvbmx5IF9lbGVtZW50UmVmOiBFbGVtZW50UmVmLCBAQXR0cmlidXRlKCdyb2xlJykgcm9sZTogc3RyaW5nLFxuICAgICAgQE9wdGlvbmFsKCkgcHJvdGVjdGVkIHJlYWRvbmx5IF9kaXI6IERpcmVjdGlvbmFsaXR5LCBASW5qZWN0KERPQ1VNRU5UKSBfZG9jdW1lbnQ6IGFueSxcbiAgICAgIHByaXZhdGUgX3BsYXRmb3JtOiBQbGF0Zm9ybSxcbiAgICAgIEBJbmplY3QoX1ZJRVdfUkVQRUFURVJfU1RSQVRFR1kpXG4gICAgICAgIHByb3RlY3RlZCByZWFkb25seSBfdmlld1JlcGVhdGVyOiBfVmlld1JlcGVhdGVyPFQsIFJlbmRlclJvdzxUPiwgUm93Q29udGV4dDxUPj4sXG4gICAgICBASW5qZWN0KF9DT0FMRVNDRURfU1RZTEVfU0NIRURVTEVSKVxuICAgICAgICBwcm90ZWN0ZWQgcmVhZG9ubHkgX2NvYWxlc2NlZFN0eWxlU2NoZWR1bGVyOiBfQ29hbGVzY2VkU3R5bGVTY2hlZHVsZXIsXG4gICAgICBwcml2YXRlIHJlYWRvbmx5IF92aWV3cG9ydFJ1bGVyOiBWaWV3cG9ydFJ1bGVyLFxuICAgICAgLyoqXG4gICAgICAgKiBAZGVwcmVjYXRlZCBgX3N0aWNreVBvc2l0aW9uaW5nTGlzdGVuZXJgIHBhcmFtZXRlciB0byBiZWNvbWUgcmVxdWlyZWQuXG4gICAgICAgKiBAYnJlYWtpbmctY2hhbmdlIDEzLjAuMFxuICAgICAgICovXG4gICAgICBAT3B0aW9uYWwoKSBAU2tpcFNlbGYoKSBASW5qZWN0KFNUSUNLWV9QT1NJVElPTklOR19MSVNURU5FUilcbiAgICAgICAgcHJvdGVjdGVkIHJlYWRvbmx5IF9zdGlja3lQb3NpdGlvbmluZ0xpc3RlbmVyOiBTdGlja3lQb3NpdGlvbmluZ0xpc3RlbmVyKSB7XG4gICAgaWYgKCFyb2xlKSB7XG4gICAgICB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuc2V0QXR0cmlidXRlKCdyb2xlJywgJ2dyaWQnKTtcbiAgICB9XG5cbiAgICB0aGlzLl9kb2N1bWVudCA9IF9kb2N1bWVudDtcbiAgICB0aGlzLl9pc05hdGl2ZUh0bWxUYWJsZSA9IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5ub2RlTmFtZSA9PT0gJ1RBQkxFJztcbiAgfVxuXG4gIG5nT25Jbml0KCkge1xuICAgIHRoaXMuX3NldHVwU3RpY2t5U3R5bGVyKCk7XG5cbiAgICBpZiAodGhpcy5faXNOYXRpdmVIdG1sVGFibGUpIHtcbiAgICAgIHRoaXMuX2FwcGx5TmF0aXZlVGFibGVTZWN0aW9ucygpO1xuICAgIH1cblxuICAgIC8vIFNldCB1cCB0aGUgdHJhY2tCeSBmdW5jdGlvbiBzbyB0aGF0IGl0IHVzZXMgdGhlIGBSZW5kZXJSb3dgIGFzIGl0cyBpZGVudGl0eSBieSBkZWZhdWx0LiBJZlxuICAgIC8vIHRoZSB1c2VyIGhhcyBwcm92aWRlZCBhIGN1c3RvbSB0cmFja0J5LCByZXR1cm4gdGhlIHJlc3VsdCBvZiB0aGF0IGZ1bmN0aW9uIGFzIGV2YWx1YXRlZFxuICAgIC8vIHdpdGggdGhlIHZhbHVlcyBvZiB0aGUgYFJlbmRlclJvd2AncyBkYXRhIGFuZCBpbmRleC5cbiAgICB0aGlzLl9kYXRhRGlmZmVyID0gdGhpcy5fZGlmZmVycy5maW5kKFtdKS5jcmVhdGUoKF9pOiBudW1iZXIsIGRhdGFSb3c6IFJlbmRlclJvdzxUPikgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMudHJhY2tCeSA/IHRoaXMudHJhY2tCeShkYXRhUm93LmRhdGFJbmRleCwgZGF0YVJvdy5kYXRhKSA6IGRhdGFSb3c7XG4gICAgfSk7XG5cbiAgICB0aGlzLl92aWV3cG9ydFJ1bGVyLmNoYW5nZSgpLnBpcGUodGFrZVVudGlsKHRoaXMuX29uRGVzdHJveSkpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICB0aGlzLl9mb3JjZVJlY2FsY3VsYXRlQ2VsbFdpZHRocyA9IHRydWU7XG4gICAgfSk7XG4gIH1cblxuICBuZ0FmdGVyQ29udGVudENoZWNrZWQoKSB7XG4gICAgLy8gQ2FjaGUgdGhlIHJvdyBhbmQgY29sdW1uIGRlZmluaXRpb25zIGdhdGhlcmVkIGJ5IENvbnRlbnRDaGlsZHJlbiBhbmQgcHJvZ3JhbW1hdGljIGluamVjdGlvbi5cbiAgICB0aGlzLl9jYWNoZVJvd0RlZnMoKTtcbiAgICB0aGlzLl9jYWNoZUNvbHVtbkRlZnMoKTtcblxuICAgIC8vIE1ha2Ugc3VyZSB0aGF0IHRoZSB1c2VyIGhhcyBhdCBsZWFzdCBhZGRlZCBoZWFkZXIsIGZvb3Rlciwgb3IgZGF0YSByb3cgZGVmLlxuICAgIGlmICghdGhpcy5faGVhZGVyUm93RGVmcy5sZW5ndGggJiYgIXRoaXMuX2Zvb3RlclJvd0RlZnMubGVuZ3RoICYmICF0aGlzLl9yb3dEZWZzLmxlbmd0aCAmJlxuICAgICAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgdGhyb3cgZ2V0VGFibGVNaXNzaW5nUm93RGVmc0Vycm9yKCk7XG4gICAgfVxuXG4gICAgLy8gUmVuZGVyIHVwZGF0ZXMgaWYgdGhlIGxpc3Qgb2YgY29sdW1ucyBoYXZlIGJlZW4gY2hhbmdlZCBmb3IgdGhlIGhlYWRlciwgcm93LCBvciBmb290ZXIgZGVmcy5cbiAgICBjb25zdCBjb2x1bW5zQ2hhbmdlZCA9IHRoaXMuX3JlbmRlclVwZGF0ZWRDb2x1bW5zKCk7XG4gICAgY29uc3Qgcm93RGVmc0NoYW5nZWQgPSBjb2x1bW5zQ2hhbmdlZCB8fCB0aGlzLl9oZWFkZXJSb3dEZWZDaGFuZ2VkIHx8IHRoaXMuX2Zvb3RlclJvd0RlZkNoYW5nZWQ7XG4gICAgLy8gRW5zdXJlIHN0aWNreSBjb2x1bW4gc3R5bGVzIGFyZSByZXNldCBpZiBzZXQgdG8gYHRydWVgIGVsc2V3aGVyZS5cbiAgICB0aGlzLl9zdGlja3lDb2x1bW5TdHlsZXNOZWVkUmVzZXQgPSB0aGlzLl9zdGlja3lDb2x1bW5TdHlsZXNOZWVkUmVzZXQgfHwgcm93RGVmc0NoYW5nZWQ7XG4gICAgdGhpcy5fZm9yY2VSZWNhbGN1bGF0ZUNlbGxXaWR0aHMgPSByb3dEZWZzQ2hhbmdlZDtcblxuICAgIC8vIElmIHRoZSBoZWFkZXIgcm93IGRlZmluaXRpb24gaGFzIGJlZW4gY2hhbmdlZCwgdHJpZ2dlciBhIHJlbmRlciB0byB0aGUgaGVhZGVyIHJvdy5cbiAgICBpZiAodGhpcy5faGVhZGVyUm93RGVmQ2hhbmdlZCkge1xuICAgICAgdGhpcy5fZm9yY2VSZW5kZXJIZWFkZXJSb3dzKCk7XG4gICAgICB0aGlzLl9oZWFkZXJSb3dEZWZDaGFuZ2VkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGZvb3RlciByb3cgZGVmaW5pdGlvbiBoYXMgYmVlbiBjaGFuZ2VkLCB0cmlnZ2VyIGEgcmVuZGVyIHRvIHRoZSBmb290ZXIgcm93LlxuICAgIGlmICh0aGlzLl9mb290ZXJSb3dEZWZDaGFuZ2VkKSB7XG4gICAgICB0aGlzLl9mb3JjZVJlbmRlckZvb3RlclJvd3MoKTtcbiAgICAgIHRoaXMuX2Zvb3RlclJvd0RlZkNoYW5nZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSBpcyBhIGRhdGEgc291cmNlIGFuZCByb3cgZGVmaW5pdGlvbnMsIGNvbm5lY3QgdG8gdGhlIGRhdGEgc291cmNlIHVubGVzcyBhXG4gICAgLy8gY29ubmVjdGlvbiBoYXMgYWxyZWFkeSBiZWVuIG1hZGUuXG4gICAgaWYgKHRoaXMuZGF0YVNvdXJjZSAmJiB0aGlzLl9yb3dEZWZzLmxlbmd0aCA+IDAgJiYgIXRoaXMuX3JlbmRlckNoYW5nZVN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fb2JzZXJ2ZVJlbmRlckNoYW5nZXMoKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX3N0aWNreUNvbHVtblN0eWxlc05lZWRSZXNldCkge1xuICAgICAgLy8gSW4gdGhlIGFib3ZlIGNhc2UsIF9vYnNlcnZlUmVuZGVyQ2hhbmdlcyB3aWxsIHJlc3VsdCBpbiB1cGRhdGVTdGlja3lDb2x1bW5TdHlsZXMgYmVpbmdcbiAgICAgIC8vIGNhbGxlZCB3aGVuIGl0IHJvdyBkYXRhIGFycml2ZXMuIE90aGVyd2lzZSwgd2UgbmVlZCB0byBjYWxsIGl0IHByb2FjdGl2ZWx5LlxuICAgICAgdGhpcy51cGRhdGVTdGlja3lDb2x1bW5TdHlsZXMoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9jaGVja1N0aWNreVN0YXRlcygpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fcm93T3V0bGV0LnZpZXdDb250YWluZXIuY2xlYXIoKTtcbiAgICB0aGlzLl9ub0RhdGFSb3dPdXRsZXQudmlld0NvbnRhaW5lci5jbGVhcigpO1xuICAgIHRoaXMuX2hlYWRlclJvd091dGxldC52aWV3Q29udGFpbmVyLmNsZWFyKCk7XG4gICAgdGhpcy5fZm9vdGVyUm93T3V0bGV0LnZpZXdDb250YWluZXIuY2xlYXIoKTtcblxuICAgIHRoaXMuX2NhY2hlZFJlbmRlclJvd3NNYXAuY2xlYXIoKTtcblxuICAgIHRoaXMuX29uRGVzdHJveS5uZXh0KCk7XG4gICAgdGhpcy5fb25EZXN0cm95LmNvbXBsZXRlKCk7XG5cbiAgICBpZiAoaXNEYXRhU291cmNlKHRoaXMuZGF0YVNvdXJjZSkpIHtcbiAgICAgIHRoaXMuZGF0YVNvdXJjZS5kaXNjb25uZWN0KHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZW5kZXJzIHJvd3MgYmFzZWQgb24gdGhlIHRhYmxlJ3MgbGF0ZXN0IHNldCBvZiBkYXRhLCB3aGljaCB3YXMgZWl0aGVyIHByb3ZpZGVkIGRpcmVjdGx5IGFzIGFuXG4gICAqIGlucHV0IG9yIHJldHJpZXZlZCB0aHJvdWdoIGFuIE9ic2VydmFibGUgc3RyZWFtIChkaXJlY3RseSBvciBmcm9tIGEgRGF0YVNvdXJjZSkuXG4gICAqIENoZWNrcyBmb3IgZGlmZmVyZW5jZXMgaW4gdGhlIGRhdGEgc2luY2UgdGhlIGxhc3QgZGlmZiB0byBwZXJmb3JtIG9ubHkgdGhlIG5lY2Vzc2FyeVxuICAgKiBjaGFuZ2VzIChhZGQvcmVtb3ZlL21vdmUgcm93cykuXG4gICAqXG4gICAqIElmIHRoZSB0YWJsZSdzIGRhdGEgc291cmNlIGlzIGEgRGF0YVNvdXJjZSBvciBPYnNlcnZhYmxlLCB0aGlzIHdpbGwgYmUgaW52b2tlZCBhdXRvbWF0aWNhbGx5XG4gICAqIGVhY2ggdGltZSB0aGUgcHJvdmlkZWQgT2JzZXJ2YWJsZSBzdHJlYW0gZW1pdHMgYSBuZXcgZGF0YSBhcnJheS4gT3RoZXJ3aXNlIGlmIHlvdXIgZGF0YSBpc1xuICAgKiBhbiBhcnJheSwgdGhpcyBmdW5jdGlvbiB3aWxsIG5lZWQgdG8gYmUgY2FsbGVkIHRvIHJlbmRlciBhbnkgY2hhbmdlcy5cbiAgICovXG4gIHJlbmRlclJvd3MoKSB7XG4gICAgdGhpcy5fcmVuZGVyUm93cyA9IHRoaXMuX2dldEFsbFJlbmRlclJvd3MoKTtcbiAgICBjb25zdCBjaGFuZ2VzID0gdGhpcy5fZGF0YURpZmZlci5kaWZmKHRoaXMuX3JlbmRlclJvd3MpO1xuICAgIGlmICghY2hhbmdlcykge1xuICAgICAgdGhpcy5fdXBkYXRlTm9EYXRhUm93KCk7XG4gICAgICB0aGlzLmNvbnRlbnRDaGFuZ2VkLm5leHQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgdmlld0NvbnRhaW5lciA9IHRoaXMuX3Jvd091dGxldC52aWV3Q29udGFpbmVyO1xuXG4gICAgdGhpcy5fdmlld1JlcGVhdGVyLmFwcGx5Q2hhbmdlcyhjaGFuZ2VzLCB2aWV3Q29udGFpbmVyLFxuICAgICAgKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8UmVuZGVyUm93PFQ+PixcbiAgICAgICAgX2FkanVzdGVkUHJldmlvdXNJbmRleDogbnVtYmVyfG51bGwsXG4gICAgICAgIGN1cnJlbnRJbmRleDogbnVtYmVyfG51bGwpID0+IHRoaXMuX2dldEVtYmVkZGVkVmlld0FyZ3MocmVjb3JkLml0ZW0sIGN1cnJlbnRJbmRleCEpLFxuICAgICAgKHJlY29yZCkgPT4gcmVjb3JkLml0ZW0uZGF0YSxcbiAgICAgIChjaGFuZ2U6IF9WaWV3UmVwZWF0ZXJJdGVtQ2hhbmdlPFJlbmRlclJvdzxUPiwgUm93Q29udGV4dDxUPj4pID0+IHtcbiAgICAgICAgaWYgKGNoYW5nZS5vcGVyYXRpb24gPT09IF9WaWV3UmVwZWF0ZXJPcGVyYXRpb24uSU5TRVJURUQgJiYgY2hhbmdlLmNvbnRleHQpIHtcbiAgICAgICAgICB0aGlzLl9yZW5kZXJDZWxsVGVtcGxhdGVGb3JJdGVtKGNoYW5nZS5yZWNvcmQuaXRlbS5yb3dEZWYsIGNoYW5nZS5jb250ZXh0KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAvLyBVcGRhdGUgdGhlIG1ldGEgY29udGV4dCBvZiBhIHJvdydzIGNvbnRleHQgZGF0YSAoaW5kZXgsIGNvdW50LCBmaXJzdCwgbGFzdCwgLi4uKVxuICAgIHRoaXMuX3VwZGF0ZVJvd0luZGV4Q29udGV4dCgpO1xuXG4gICAgLy8gVXBkYXRlIHJvd3MgdGhhdCBkaWQgbm90IGdldCBhZGRlZC9yZW1vdmVkL21vdmVkIGJ1dCBtYXkgaGF2ZSBoYWQgdGhlaXIgaWRlbnRpdHkgY2hhbmdlZCxcbiAgICAvLyBlLmcuIGlmIHRyYWNrQnkgbWF0Y2hlZCBkYXRhIG9uIHNvbWUgcHJvcGVydHkgYnV0IHRoZSBhY3R1YWwgZGF0YSByZWZlcmVuY2UgY2hhbmdlZC5cbiAgICBjaGFuZ2VzLmZvckVhY2hJZGVudGl0eUNoYW5nZSgocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZDxSZW5kZXJSb3c8VD4+KSA9PiB7XG4gICAgICBjb25zdCByb3dWaWV3ID0gPFJvd1ZpZXdSZWY8VD4+dmlld0NvbnRhaW5lci5nZXQocmVjb3JkLmN1cnJlbnRJbmRleCEpO1xuICAgICAgcm93Vmlldy5jb250ZXh0LiRpbXBsaWNpdCA9IHJlY29yZC5pdGVtLmRhdGE7XG4gICAgfSk7XG5cbiAgICB0aGlzLl91cGRhdGVOb0RhdGFSb3coKTtcbiAgICB0aGlzLnVwZGF0ZVN0aWNreUNvbHVtblN0eWxlcygpO1xuXG4gICAgdGhpcy5jb250ZW50Q2hhbmdlZC5uZXh0KCk7XG4gIH1cblxuICAvKiogQWRkcyBhIGNvbHVtbiBkZWZpbml0aW9uIHRoYXQgd2FzIG5vdCBpbmNsdWRlZCBhcyBwYXJ0IG9mIHRoZSBjb250ZW50IGNoaWxkcmVuLiAqL1xuICBhZGRDb2x1bW5EZWYoY29sdW1uRGVmOiBDZGtDb2x1bW5EZWYpIHtcbiAgICB0aGlzLl9jdXN0b21Db2x1bW5EZWZzLmFkZChjb2x1bW5EZWYpO1xuICB9XG5cbiAgLyoqIFJlbW92ZXMgYSBjb2x1bW4gZGVmaW5pdGlvbiB0aGF0IHdhcyBub3QgaW5jbHVkZWQgYXMgcGFydCBvZiB0aGUgY29udGVudCBjaGlsZHJlbi4gKi9cbiAgcmVtb3ZlQ29sdW1uRGVmKGNvbHVtbkRlZjogQ2RrQ29sdW1uRGVmKSB7XG4gICAgdGhpcy5fY3VzdG9tQ29sdW1uRGVmcy5kZWxldGUoY29sdW1uRGVmKTtcbiAgfVxuXG4gIC8qKiBBZGRzIGEgcm93IGRlZmluaXRpb24gdGhhdCB3YXMgbm90IGluY2x1ZGVkIGFzIHBhcnQgb2YgdGhlIGNvbnRlbnQgY2hpbGRyZW4uICovXG4gIGFkZFJvd0RlZihyb3dEZWY6IENka1Jvd0RlZjxUPikge1xuICAgIHRoaXMuX2N1c3RvbVJvd0RlZnMuYWRkKHJvd0RlZik7XG4gIH1cblxuICAvKiogUmVtb3ZlcyBhIHJvdyBkZWZpbml0aW9uIHRoYXQgd2FzIG5vdCBpbmNsdWRlZCBhcyBwYXJ0IG9mIHRoZSBjb250ZW50IGNoaWxkcmVuLiAqL1xuICByZW1vdmVSb3dEZWYocm93RGVmOiBDZGtSb3dEZWY8VD4pIHtcbiAgICB0aGlzLl9jdXN0b21Sb3dEZWZzLmRlbGV0ZShyb3dEZWYpO1xuICB9XG5cbiAgLyoqIEFkZHMgYSBoZWFkZXIgcm93IGRlZmluaXRpb24gdGhhdCB3YXMgbm90IGluY2x1ZGVkIGFzIHBhcnQgb2YgdGhlIGNvbnRlbnQgY2hpbGRyZW4uICovXG4gIGFkZEhlYWRlclJvd0RlZihoZWFkZXJSb3dEZWY6IENka0hlYWRlclJvd0RlZikge1xuICAgIHRoaXMuX2N1c3RvbUhlYWRlclJvd0RlZnMuYWRkKGhlYWRlclJvd0RlZik7XG4gICAgdGhpcy5faGVhZGVyUm93RGVmQ2hhbmdlZCA9IHRydWU7XG4gIH1cblxuICAvKiogUmVtb3ZlcyBhIGhlYWRlciByb3cgZGVmaW5pdGlvbiB0aGF0IHdhcyBub3QgaW5jbHVkZWQgYXMgcGFydCBvZiB0aGUgY29udGVudCBjaGlsZHJlbi4gKi9cbiAgcmVtb3ZlSGVhZGVyUm93RGVmKGhlYWRlclJvd0RlZjogQ2RrSGVhZGVyUm93RGVmKSB7XG4gICAgdGhpcy5fY3VzdG9tSGVhZGVyUm93RGVmcy5kZWxldGUoaGVhZGVyUm93RGVmKTtcbiAgICB0aGlzLl9oZWFkZXJSb3dEZWZDaGFuZ2VkID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKiBBZGRzIGEgZm9vdGVyIHJvdyBkZWZpbml0aW9uIHRoYXQgd2FzIG5vdCBpbmNsdWRlZCBhcyBwYXJ0IG9mIHRoZSBjb250ZW50IGNoaWxkcmVuLiAqL1xuICBhZGRGb290ZXJSb3dEZWYoZm9vdGVyUm93RGVmOiBDZGtGb290ZXJSb3dEZWYpIHtcbiAgICB0aGlzLl9jdXN0b21Gb290ZXJSb3dEZWZzLmFkZChmb290ZXJSb3dEZWYpO1xuICAgIHRoaXMuX2Zvb3RlclJvd0RlZkNoYW5nZWQgPSB0cnVlO1xuICB9XG5cbiAgLyoqIFJlbW92ZXMgYSBmb290ZXIgcm93IGRlZmluaXRpb24gdGhhdCB3YXMgbm90IGluY2x1ZGVkIGFzIHBhcnQgb2YgdGhlIGNvbnRlbnQgY2hpbGRyZW4uICovXG4gIHJlbW92ZUZvb3RlclJvd0RlZihmb290ZXJSb3dEZWY6IENka0Zvb3RlclJvd0RlZikge1xuICAgIHRoaXMuX2N1c3RvbUZvb3RlclJvd0RlZnMuZGVsZXRlKGZvb3RlclJvd0RlZik7XG4gICAgdGhpcy5fZm9vdGVyUm93RGVmQ2hhbmdlZCA9IHRydWU7XG4gIH1cblxuICAvKiogU2V0cyBhIG5vIGRhdGEgcm93IGRlZmluaXRpb24gdGhhdCB3YXMgbm90IGluY2x1ZGVkIGFzIGEgcGFydCBvZiB0aGUgY29udGVudCBjaGlsZHJlbi4gKi9cbiAgc2V0Tm9EYXRhUm93KG5vRGF0YVJvdzogQ2RrTm9EYXRhUm93IHwgbnVsbCkge1xuICAgIHRoaXMuX2N1c3RvbU5vRGF0YVJvdyA9IG5vRGF0YVJvdztcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBoZWFkZXIgc3RpY2t5IHN0eWxlcy4gRmlyc3QgcmVzZXRzIGFsbCBhcHBsaWVkIHN0eWxlcyB3aXRoIHJlc3BlY3QgdG8gdGhlIGNlbGxzXG4gICAqIHN0aWNraW5nIHRvIHRoZSB0b3AuIFRoZW4sIGV2YWx1YXRpbmcgd2hpY2ggY2VsbHMgbmVlZCB0byBiZSBzdHVjayB0byB0aGUgdG9wLiBUaGlzIGlzXG4gICAqIGF1dG9tYXRpY2FsbHkgY2FsbGVkIHdoZW4gdGhlIGhlYWRlciByb3cgY2hhbmdlcyBpdHMgZGlzcGxheWVkIHNldCBvZiBjb2x1bW5zLCBvciBpZiBpdHNcbiAgICogc3RpY2t5IGlucHV0IGNoYW5nZXMuIE1heSBiZSBjYWxsZWQgbWFudWFsbHkgZm9yIGNhc2VzIHdoZXJlIHRoZSBjZWxsIGNvbnRlbnQgY2hhbmdlcyBvdXRzaWRlXG4gICAqIG9mIHRoZXNlIGV2ZW50cy5cbiAgICovXG4gIHVwZGF0ZVN0aWNreUhlYWRlclJvd1N0eWxlcygpOiB2b2lkIHtcbiAgICBjb25zdCBoZWFkZXJSb3dzID0gdGhpcy5fZ2V0UmVuZGVyZWRSb3dzKHRoaXMuX2hlYWRlclJvd091dGxldCk7XG4gICAgY29uc3QgdGFibGVFbGVtZW50ID0gdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50O1xuXG4gICAgLy8gSGlkZSB0aGUgdGhlYWQgZWxlbWVudCBpZiB0aGVyZSBhcmUgbm8gaGVhZGVyIHJvd3MuIFRoaXMgaXMgbmVjZXNzYXJ5IHRvIHNhdGlzZnlcbiAgICAvLyBvdmVyemVhbG91cyBhMTF5IGNoZWNrZXJzIHRoYXQgZmFpbCBiZWNhdXNlIHRoZSBgcm93Z3JvdXBgIGVsZW1lbnQgZG9lcyBub3QgY29udGFpblxuICAgIC8vIHJlcXVpcmVkIGNoaWxkIGByb3dgLlxuICAgIGNvbnN0IHRoZWFkID0gdGFibGVFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ3RoZWFkJyk7XG4gICAgaWYgKHRoZWFkKSB7XG4gICAgICB0aGVhZC5zdHlsZS5kaXNwbGF5ID0gaGVhZGVyUm93cy5sZW5ndGggPyAnJyA6ICdub25lJztcbiAgICB9XG5cbiAgICBjb25zdCBzdGlja3lTdGF0ZXMgPSB0aGlzLl9oZWFkZXJSb3dEZWZzLm1hcChkZWYgPT4gZGVmLnN0aWNreSk7XG4gICAgdGhpcy5fc3RpY2t5U3R5bGVyLmNsZWFyU3RpY2t5UG9zaXRpb25pbmcoaGVhZGVyUm93cywgWyd0b3AnXSk7XG4gICAgdGhpcy5fc3RpY2t5U3R5bGVyLnN0aWNrUm93cyhoZWFkZXJSb3dzLCBzdGlja3lTdGF0ZXMsICd0b3AnKTtcblxuICAgIC8vIFJlc2V0IHRoZSBkaXJ0eSBzdGF0ZSBvZiB0aGUgc3RpY2t5IGlucHV0IGNoYW5nZSBzaW5jZSBpdCBoYXMgYmVlbiB1c2VkLlxuICAgIHRoaXMuX2hlYWRlclJvd0RlZnMuZm9yRWFjaChkZWYgPT4gZGVmLnJlc2V0U3RpY2t5Q2hhbmdlZCgpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBmb290ZXIgc3RpY2t5IHN0eWxlcy4gRmlyc3QgcmVzZXRzIGFsbCBhcHBsaWVkIHN0eWxlcyB3aXRoIHJlc3BlY3QgdG8gdGhlIGNlbGxzXG4gICAqIHN0aWNraW5nIHRvIHRoZSBib3R0b20uIFRoZW4sIGV2YWx1YXRpbmcgd2hpY2ggY2VsbHMgbmVlZCB0byBiZSBzdHVjayB0byB0aGUgYm90dG9tLiBUaGlzIGlzXG4gICAqIGF1dG9tYXRpY2FsbHkgY2FsbGVkIHdoZW4gdGhlIGZvb3RlciByb3cgY2hhbmdlcyBpdHMgZGlzcGxheWVkIHNldCBvZiBjb2x1bW5zLCBvciBpZiBpdHNcbiAgICogc3RpY2t5IGlucHV0IGNoYW5nZXMuIE1heSBiZSBjYWxsZWQgbWFudWFsbHkgZm9yIGNhc2VzIHdoZXJlIHRoZSBjZWxsIGNvbnRlbnQgY2hhbmdlcyBvdXRzaWRlXG4gICAqIG9mIHRoZXNlIGV2ZW50cy5cbiAgICovXG4gIHVwZGF0ZVN0aWNreUZvb3RlclJvd1N0eWxlcygpOiB2b2lkIHtcbiAgICBjb25zdCBmb290ZXJSb3dzID0gdGhpcy5fZ2V0UmVuZGVyZWRSb3dzKHRoaXMuX2Zvb3RlclJvd091dGxldCk7XG4gICAgY29uc3QgdGFibGVFbGVtZW50ID0gdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50O1xuXG4gICAgLy8gSGlkZSB0aGUgdGZvb3QgZWxlbWVudCBpZiB0aGVyZSBhcmUgbm8gZm9vdGVyIHJvd3MuIFRoaXMgaXMgbmVjZXNzYXJ5IHRvIHNhdGlzZnlcbiAgICAvLyBvdmVyemVhbG91cyBhMTF5IGNoZWNrZXJzIHRoYXQgZmFpbCBiZWNhdXNlIHRoZSBgcm93Z3JvdXBgIGVsZW1lbnQgZG9lcyBub3QgY29udGFpblxuICAgIC8vIHJlcXVpcmVkIGNoaWxkIGByb3dgLlxuICAgIGNvbnN0IHRmb290ID0gdGFibGVFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ3Rmb290Jyk7XG4gICAgaWYgKHRmb290KSB7XG4gICAgICB0Zm9vdC5zdHlsZS5kaXNwbGF5ID0gZm9vdGVyUm93cy5sZW5ndGggPyAnJyA6ICdub25lJztcbiAgICB9XG5cbiAgICBjb25zdCBzdGlja3lTdGF0ZXMgPSB0aGlzLl9mb290ZXJSb3dEZWZzLm1hcChkZWYgPT4gZGVmLnN0aWNreSk7XG4gICAgdGhpcy5fc3RpY2t5U3R5bGVyLmNsZWFyU3RpY2t5UG9zaXRpb25pbmcoZm9vdGVyUm93cywgWydib3R0b20nXSk7XG4gICAgdGhpcy5fc3RpY2t5U3R5bGVyLnN0aWNrUm93cyhmb290ZXJSb3dzLCBzdGlja3lTdGF0ZXMsICdib3R0b20nKTtcbiAgICB0aGlzLl9zdGlja3lTdHlsZXIudXBkYXRlU3RpY2t5Rm9vdGVyQ29udGFpbmVyKHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudCwgc3RpY2t5U3RhdGVzKTtcblxuICAgIC8vIFJlc2V0IHRoZSBkaXJ0eSBzdGF0ZSBvZiB0aGUgc3RpY2t5IGlucHV0IGNoYW5nZSBzaW5jZSBpdCBoYXMgYmVlbiB1c2VkLlxuICAgIHRoaXMuX2Zvb3RlclJvd0RlZnMuZm9yRWFjaChkZWYgPT4gZGVmLnJlc2V0U3RpY2t5Q2hhbmdlZCgpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBjb2x1bW4gc3RpY2t5IHN0eWxlcy4gRmlyc3QgcmVzZXRzIGFsbCBhcHBsaWVkIHN0eWxlcyB3aXRoIHJlc3BlY3QgdG8gdGhlIGNlbGxzXG4gICAqIHN0aWNraW5nIHRvIHRoZSBsZWZ0IGFuZCByaWdodC4gVGhlbiBzdGlja3kgc3R5bGVzIGFyZSBhZGRlZCBmb3IgdGhlIGxlZnQgYW5kIHJpZ2h0IGFjY29yZGluZ1xuICAgKiB0byB0aGUgY29sdW1uIGRlZmluaXRpb25zIGZvciBlYWNoIGNlbGwgaW4gZWFjaCByb3cuIFRoaXMgaXMgYXV0b21hdGljYWxseSBjYWxsZWQgd2hlblxuICAgKiB0aGUgZGF0YSBzb3VyY2UgcHJvdmlkZXMgYSBuZXcgc2V0IG9mIGRhdGEgb3Igd2hlbiBhIGNvbHVtbiBkZWZpbml0aW9uIGNoYW5nZXMgaXRzIHN0aWNreVxuICAgKiBpbnB1dC4gTWF5IGJlIGNhbGxlZCBtYW51YWxseSBmb3IgY2FzZXMgd2hlcmUgdGhlIGNlbGwgY29udGVudCBjaGFuZ2VzIG91dHNpZGUgb2YgdGhlc2UgZXZlbnRzLlxuICAgKi9cbiAgdXBkYXRlU3RpY2t5Q29sdW1uU3R5bGVzKCkge1xuICAgIGNvbnN0IGhlYWRlclJvd3MgPSB0aGlzLl9nZXRSZW5kZXJlZFJvd3ModGhpcy5faGVhZGVyUm93T3V0bGV0KTtcbiAgICBjb25zdCBkYXRhUm93cyA9IHRoaXMuX2dldFJlbmRlcmVkUm93cyh0aGlzLl9yb3dPdXRsZXQpO1xuICAgIGNvbnN0IGZvb3RlclJvd3MgPSB0aGlzLl9nZXRSZW5kZXJlZFJvd3ModGhpcy5fZm9vdGVyUm93T3V0bGV0KTtcblxuICAgIC8vIEZvciB0YWJsZXMgbm90IHVzaW5nIGEgZml4ZWQgbGF5b3V0LCB0aGUgY29sdW1uIHdpZHRocyBtYXkgY2hhbmdlIHdoZW4gbmV3IHJvd3MgYXJlIHJlbmRlcmVkLlxuICAgIC8vIEluIGEgdGFibGUgdXNpbmcgYSBmaXhlZCBsYXlvdXQsIHJvdyBjb250ZW50IHdvbid0IGFmZmVjdCBjb2x1bW4gd2lkdGgsIHNvIHN0aWNreSBzdHlsZXNcbiAgICAvLyBkb24ndCBuZWVkIHRvIGJlIGNsZWFyZWQgdW5sZXNzIGVpdGhlciB0aGUgc3RpY2t5IGNvbHVtbiBjb25maWcgY2hhbmdlcyBvciBvbmUgb2YgdGhlIHJvd1xuICAgIC8vIGRlZnMgY2hhbmdlLlxuICAgIGlmICgodGhpcy5faXNOYXRpdmVIdG1sVGFibGUgJiYgIXRoaXMuX2ZpeGVkTGF5b3V0KVxuICAgICAgICB8fCB0aGlzLl9zdGlja3lDb2x1bW5TdHlsZXNOZWVkUmVzZXQpIHtcbiAgICAgIC8vIENsZWFyIHRoZSBsZWZ0IGFuZCByaWdodCBwb3NpdGlvbmluZyBmcm9tIGFsbCBjb2x1bW5zIGluIHRoZSB0YWJsZSBhY3Jvc3MgYWxsIHJvd3Mgc2luY2VcbiAgICAgIC8vIHN0aWNreSBjb2x1bW5zIHNwYW4gYWNyb3NzIGFsbCB0YWJsZSBzZWN0aW9ucyAoaGVhZGVyLCBkYXRhLCBmb290ZXIpXG4gICAgICB0aGlzLl9zdGlja3lTdHlsZXIuY2xlYXJTdGlja3lQb3NpdGlvbmluZyhcbiAgICAgICAgICBbLi4uaGVhZGVyUm93cywgLi4uZGF0YVJvd3MsIC4uLmZvb3RlclJvd3NdLCBbJ2xlZnQnLCAncmlnaHQnXSk7XG4gICAgICB0aGlzLl9zdGlja3lDb2x1bW5TdHlsZXNOZWVkUmVzZXQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgdGhlIHN0aWNreSBzdHlsZXMgZm9yIGVhY2ggaGVhZGVyIHJvdyBkZXBlbmRpbmcgb24gdGhlIGRlZidzIHN0aWNreSBzdGF0ZVxuICAgIGhlYWRlclJvd3MuZm9yRWFjaCgoaGVhZGVyUm93LCBpKSA9PiB7XG4gICAgICB0aGlzLl9hZGRTdGlja3lDb2x1bW5TdHlsZXMoW2hlYWRlclJvd10sIHRoaXMuX2hlYWRlclJvd0RlZnNbaV0pO1xuICAgIH0pO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBzdGlja3kgc3R5bGVzIGZvciBlYWNoIGRhdGEgcm93IGRlcGVuZGluZyBvbiBpdHMgZGVmJ3Mgc3RpY2t5IHN0YXRlXG4gICAgdGhpcy5fcm93RGVmcy5mb3JFYWNoKHJvd0RlZiA9PiB7XG4gICAgICAvLyBDb2xsZWN0IGFsbCB0aGUgcm93cyByZW5kZXJlZCB3aXRoIHRoaXMgcm93IGRlZmluaXRpb24uXG4gICAgICBjb25zdCByb3dzOiBIVE1MRWxlbWVudFtdID0gW107XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGFSb3dzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0aGlzLl9yZW5kZXJSb3dzW2ldLnJvd0RlZiA9PT0gcm93RGVmKSB7XG4gICAgICAgICAgcm93cy5wdXNoKGRhdGFSb3dzW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLl9hZGRTdGlja3lDb2x1bW5TdHlsZXMocm93cywgcm93RGVmKTtcbiAgICB9KTtcblxuICAgIC8vIFVwZGF0ZSB0aGUgc3RpY2t5IHN0eWxlcyBmb3IgZWFjaCBmb290ZXIgcm93IGRlcGVuZGluZyBvbiB0aGUgZGVmJ3Mgc3RpY2t5IHN0YXRlXG4gICAgZm9vdGVyUm93cy5mb3JFYWNoKChmb290ZXJSb3csIGkpID0+IHtcbiAgICAgIHRoaXMuX2FkZFN0aWNreUNvbHVtblN0eWxlcyhbZm9vdGVyUm93XSwgdGhpcy5fZm9vdGVyUm93RGVmc1tpXSk7XG4gICAgfSk7XG5cbiAgICAvLyBSZXNldCB0aGUgZGlydHkgc3RhdGUgb2YgdGhlIHN0aWNreSBpbnB1dCBjaGFuZ2Ugc2luY2UgaXQgaGFzIGJlZW4gdXNlZC5cbiAgICBBcnJheS5mcm9tKHRoaXMuX2NvbHVtbkRlZnNCeU5hbWUudmFsdWVzKCkpLmZvckVhY2goZGVmID0+IGRlZi5yZXNldFN0aWNreUNoYW5nZWQoKSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBsaXN0IG9mIFJlbmRlclJvdyBvYmplY3RzIHRvIHJlbmRlciBhY2NvcmRpbmcgdG8gdGhlIGN1cnJlbnQgbGlzdCBvZiBkYXRhIGFuZCBkZWZpbmVkXG4gICAqIHJvdyBkZWZpbml0aW9ucy4gSWYgdGhlIHByZXZpb3VzIGxpc3QgYWxyZWFkeSBjb250YWluZWQgYSBwYXJ0aWN1bGFyIHBhaXIsIGl0IHNob3VsZCBiZSByZXVzZWRcbiAgICogc28gdGhhdCB0aGUgZGlmZmVyIGVxdWF0ZXMgdGhlaXIgcmVmZXJlbmNlcy5cbiAgICovXG4gIHByaXZhdGUgX2dldEFsbFJlbmRlclJvd3MoKTogUmVuZGVyUm93PFQ+W10ge1xuICAgIGNvbnN0IHJlbmRlclJvd3M6IFJlbmRlclJvdzxUPltdID0gW107XG5cbiAgICAvLyBTdG9yZSB0aGUgY2FjaGUgYW5kIGNyZWF0ZSBhIG5ldyBvbmUuIEFueSByZS11c2VkIFJlbmRlclJvdyBvYmplY3RzIHdpbGwgYmUgbW92ZWQgaW50byB0aGVcbiAgICAvLyBuZXcgY2FjaGUgd2hpbGUgdW51c2VkIG9uZXMgY2FuIGJlIHBpY2tlZCB1cCBieSBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgY29uc3QgcHJldkNhY2hlZFJlbmRlclJvd3MgPSB0aGlzLl9jYWNoZWRSZW5kZXJSb3dzTWFwO1xuICAgIHRoaXMuX2NhY2hlZFJlbmRlclJvd3NNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICAvLyBGb3IgZWFjaCBkYXRhIG9iamVjdCwgZ2V0IHRoZSBsaXN0IG9mIHJvd3MgdGhhdCBzaG91bGQgYmUgcmVuZGVyZWQsIHJlcHJlc2VudGVkIGJ5IHRoZVxuICAgIC8vIHJlc3BlY3RpdmUgYFJlbmRlclJvd2Agb2JqZWN0IHdoaWNoIGlzIHRoZSBwYWlyIG9mIGBkYXRhYCBhbmQgYENka1Jvd0RlZmAuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9kYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgZGF0YSA9IHRoaXMuX2RhdGFbaV07XG4gICAgICBjb25zdCByZW5kZXJSb3dzRm9yRGF0YSA9IHRoaXMuX2dldFJlbmRlclJvd3NGb3JEYXRhKGRhdGEsIGksIHByZXZDYWNoZWRSZW5kZXJSb3dzLmdldChkYXRhKSk7XG5cbiAgICAgIGlmICghdGhpcy5fY2FjaGVkUmVuZGVyUm93c01hcC5oYXMoZGF0YSkpIHtcbiAgICAgICAgdGhpcy5fY2FjaGVkUmVuZGVyUm93c01hcC5zZXQoZGF0YSwgbmV3IFdlYWtNYXAoKSk7XG4gICAgICB9XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcmVuZGVyUm93c0ZvckRhdGEubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgbGV0IHJlbmRlclJvdyA9IHJlbmRlclJvd3NGb3JEYXRhW2pdO1xuXG4gICAgICAgIGNvbnN0IGNhY2hlID0gdGhpcy5fY2FjaGVkUmVuZGVyUm93c01hcC5nZXQocmVuZGVyUm93LmRhdGEpITtcbiAgICAgICAgaWYgKGNhY2hlLmhhcyhyZW5kZXJSb3cucm93RGVmKSkge1xuICAgICAgICAgIGNhY2hlLmdldChyZW5kZXJSb3cucm93RGVmKSEucHVzaChyZW5kZXJSb3cpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNhY2hlLnNldChyZW5kZXJSb3cucm93RGVmLCBbcmVuZGVyUm93XSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVuZGVyUm93cy5wdXNoKHJlbmRlclJvdyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlbmRlclJvd3M7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIGxpc3Qgb2YgYFJlbmRlclJvdzxUPmAgZm9yIHRoZSBwcm92aWRlZCBkYXRhIG9iamVjdCBhbmQgYW55IGBDZGtSb3dEZWZgIG9iamVjdHMgdGhhdFxuICAgKiBzaG91bGQgYmUgcmVuZGVyZWQgZm9yIHRoaXMgZGF0YS4gUmV1c2VzIHRoZSBjYWNoZWQgUmVuZGVyUm93IG9iamVjdHMgaWYgdGhleSBtYXRjaCB0aGUgc2FtZVxuICAgKiBgKFQsIENka1Jvd0RlZilgIHBhaXIuXG4gICAqL1xuICBwcml2YXRlIF9nZXRSZW5kZXJSb3dzRm9yRGF0YShcbiAgICAgIGRhdGE6IFQsIGRhdGFJbmRleDogbnVtYmVyLCBjYWNoZT86IFdlYWtNYXA8Q2RrUm93RGVmPFQ+LCBSZW5kZXJSb3c8VD5bXT4pOiBSZW5kZXJSb3c8VD5bXSB7XG4gICAgY29uc3Qgcm93RGVmcyA9IHRoaXMuX2dldFJvd0RlZnMoZGF0YSwgZGF0YUluZGV4KTtcblxuICAgIHJldHVybiByb3dEZWZzLm1hcChyb3dEZWYgPT4ge1xuICAgICAgY29uc3QgY2FjaGVkUmVuZGVyUm93cyA9IChjYWNoZSAmJiBjYWNoZS5oYXMocm93RGVmKSkgPyBjYWNoZS5nZXQocm93RGVmKSEgOiBbXTtcbiAgICAgIGlmIChjYWNoZWRSZW5kZXJSb3dzLmxlbmd0aCkge1xuICAgICAgICBjb25zdCBkYXRhUm93ID0gY2FjaGVkUmVuZGVyUm93cy5zaGlmdCgpITtcbiAgICAgICAgZGF0YVJvdy5kYXRhSW5kZXggPSBkYXRhSW5kZXg7XG4gICAgICAgIHJldHVybiBkYXRhUm93O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHtkYXRhLCByb3dEZWYsIGRhdGFJbmRleH07XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSBtYXAgY29udGFpbmluZyB0aGUgY29udGVudCdzIGNvbHVtbiBkZWZpbml0aW9ucy4gKi9cbiAgcHJpdmF0ZSBfY2FjaGVDb2x1bW5EZWZzKCkge1xuICAgIHRoaXMuX2NvbHVtbkRlZnNCeU5hbWUuY2xlYXIoKTtcblxuICAgIGNvbnN0IGNvbHVtbkRlZnMgPSBtZXJnZUFycmF5QW5kU2V0KFxuICAgICAgICB0aGlzLl9nZXRPd25EZWZzKHRoaXMuX2NvbnRlbnRDb2x1bW5EZWZzKSwgdGhpcy5fY3VzdG9tQ29sdW1uRGVmcyk7XG4gICAgY29sdW1uRGVmcy5mb3JFYWNoKGNvbHVtbkRlZiA9PiB7XG4gICAgICBpZiAodGhpcy5fY29sdW1uRGVmc0J5TmFtZS5oYXMoY29sdW1uRGVmLm5hbWUpICYmXG4gICAgICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpKSB7XG4gICAgICAgIHRocm93IGdldFRhYmxlRHVwbGljYXRlQ29sdW1uTmFtZUVycm9yKGNvbHVtbkRlZi5uYW1lKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2NvbHVtbkRlZnNCeU5hbWUuc2V0KGNvbHVtbkRlZi5uYW1lLCBjb2x1bW5EZWYpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIFVwZGF0ZSB0aGUgbGlzdCBvZiBhbGwgYXZhaWxhYmxlIHJvdyBkZWZpbml0aW9ucyB0aGF0IGNhbiBiZSB1c2VkLiAqL1xuICBwcml2YXRlIF9jYWNoZVJvd0RlZnMoKSB7XG4gICAgdGhpcy5faGVhZGVyUm93RGVmcyA9IG1lcmdlQXJyYXlBbmRTZXQoXG4gICAgICAgIHRoaXMuX2dldE93bkRlZnModGhpcy5fY29udGVudEhlYWRlclJvd0RlZnMpLCB0aGlzLl9jdXN0b21IZWFkZXJSb3dEZWZzKTtcbiAgICB0aGlzLl9mb290ZXJSb3dEZWZzID0gbWVyZ2VBcnJheUFuZFNldChcbiAgICAgICAgdGhpcy5fZ2V0T3duRGVmcyh0aGlzLl9jb250ZW50Rm9vdGVyUm93RGVmcyksIHRoaXMuX2N1c3RvbUZvb3RlclJvd0RlZnMpO1xuICAgIHRoaXMuX3Jvd0RlZnMgPSBtZXJnZUFycmF5QW5kU2V0KFxuICAgICAgICB0aGlzLl9nZXRPd25EZWZzKHRoaXMuX2NvbnRlbnRSb3dEZWZzKSwgdGhpcy5fY3VzdG9tUm93RGVmcyk7XG5cbiAgICAvLyBBZnRlciBhbGwgcm93IGRlZmluaXRpb25zIGFyZSBkZXRlcm1pbmVkLCBmaW5kIHRoZSByb3cgZGVmaW5pdGlvbiB0byBiZSBjb25zaWRlcmVkIGRlZmF1bHQuXG4gICAgY29uc3QgZGVmYXVsdFJvd0RlZnMgPSB0aGlzLl9yb3dEZWZzLmZpbHRlcihkZWYgPT4gIWRlZi53aGVuKTtcbiAgICBpZiAoIXRoaXMubXVsdGlUZW1wbGF0ZURhdGFSb3dzICYmIGRlZmF1bHRSb3dEZWZzLmxlbmd0aCA+IDEgJiZcbiAgICAgICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgIHRocm93IGdldFRhYmxlTXVsdGlwbGVEZWZhdWx0Um93RGVmc0Vycm9yKCk7XG4gICAgfVxuICAgIHRoaXMuX2RlZmF1bHRSb3dEZWYgPSBkZWZhdWx0Um93RGVmc1swXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGUgaGVhZGVyLCBkYXRhLCBvciBmb290ZXIgcm93cyBoYXZlIGNoYW5nZWQgd2hhdCBjb2x1bW5zIHRoZXkgd2FudCB0byBkaXNwbGF5IG9yXG4gICAqIHdoZXRoZXIgdGhlIHN0aWNreSBzdGF0ZXMgaGF2ZSBjaGFuZ2VkIGZvciB0aGUgaGVhZGVyIG9yIGZvb3Rlci4gSWYgdGhlcmUgaXMgYSBkaWZmLCB0aGVuXG4gICAqIHJlLXJlbmRlciB0aGF0IHNlY3Rpb24uXG4gICAqL1xuICBwcml2YXRlIF9yZW5kZXJVcGRhdGVkQ29sdW1ucygpOiBib29sZWFuIHtcbiAgICBjb25zdCBjb2x1bW5zRGlmZlJlZHVjZXIgPSAoYWNjOiBib29sZWFuLCBkZWY6IEJhc2VSb3dEZWYpID0+IGFjYyB8fCAhIWRlZi5nZXRDb2x1bW5zRGlmZigpO1xuXG4gICAgLy8gRm9yY2UgcmUtcmVuZGVyIGRhdGEgcm93cyBpZiB0aGUgbGlzdCBvZiBjb2x1bW4gZGVmaW5pdGlvbnMgaGF2ZSBjaGFuZ2VkLlxuICAgIGNvbnN0IGRhdGFDb2x1bW5zQ2hhbmdlZCA9IHRoaXMuX3Jvd0RlZnMucmVkdWNlKGNvbHVtbnNEaWZmUmVkdWNlciwgZmFsc2UpO1xuICAgIGlmIChkYXRhQ29sdW1uc0NoYW5nZWQpIHtcbiAgICAgIHRoaXMuX2ZvcmNlUmVuZGVyRGF0YVJvd3MoKTtcbiAgICB9XG5cbiAgICAvLyBGb3JjZSByZS1yZW5kZXIgaGVhZGVyL2Zvb3RlciByb3dzIGlmIHRoZSBsaXN0IG9mIGNvbHVtbiBkZWZpbml0aW9ucyBoYXZlIGNoYW5nZWQuXG4gICAgY29uc3QgaGVhZGVyQ29sdW1uc0NoYW5nZWQgPSB0aGlzLl9oZWFkZXJSb3dEZWZzLnJlZHVjZShjb2x1bW5zRGlmZlJlZHVjZXIsIGZhbHNlKTtcbiAgICBpZiAoaGVhZGVyQ29sdW1uc0NoYW5nZWQpIHtcbiAgICAgIHRoaXMuX2ZvcmNlUmVuZGVySGVhZGVyUm93cygpO1xuICAgIH1cblxuICAgIGNvbnN0IGZvb3RlckNvbHVtbnNDaGFuZ2VkID0gdGhpcy5fZm9vdGVyUm93RGVmcy5yZWR1Y2UoY29sdW1uc0RpZmZSZWR1Y2VyLCBmYWxzZSk7XG4gICAgaWYgKGZvb3RlckNvbHVtbnNDaGFuZ2VkKSB7XG4gICAgICB0aGlzLl9mb3JjZVJlbmRlckZvb3RlclJvd3MoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGF0YUNvbHVtbnNDaGFuZ2VkIHx8IGhlYWRlckNvbHVtbnNDaGFuZ2VkIHx8IGZvb3RlckNvbHVtbnNDaGFuZ2VkO1xuICB9XG5cbiAgLyoqXG4gICAqIFN3aXRjaCB0byB0aGUgcHJvdmlkZWQgZGF0YSBzb3VyY2UgYnkgcmVzZXR0aW5nIHRoZSBkYXRhIGFuZCB1bnN1YnNjcmliaW5nIGZyb20gdGhlIGN1cnJlbnRcbiAgICogcmVuZGVyIGNoYW5nZSBzdWJzY3JpcHRpb24gaWYgb25lIGV4aXN0cy4gSWYgdGhlIGRhdGEgc291cmNlIGlzIG51bGwsIGludGVycHJldCB0aGlzIGJ5XG4gICAqIGNsZWFyaW5nIHRoZSByb3cgb3V0bGV0LiBPdGhlcndpc2Ugc3RhcnQgbGlzdGVuaW5nIGZvciBuZXcgZGF0YS5cbiAgICovXG4gIHByaXZhdGUgX3N3aXRjaERhdGFTb3VyY2UoZGF0YVNvdXJjZTogQ2RrVGFibGVEYXRhU291cmNlSW5wdXQ8VD4pIHtcbiAgICB0aGlzLl9kYXRhID0gW107XG5cbiAgICBpZiAoaXNEYXRhU291cmNlKHRoaXMuZGF0YVNvdXJjZSkpIHtcbiAgICAgIHRoaXMuZGF0YVNvdXJjZS5kaXNjb25uZWN0KHRoaXMpO1xuICAgIH1cblxuICAgIC8vIFN0b3AgbGlzdGVuaW5nIGZvciBkYXRhIGZyb20gdGhlIHByZXZpb3VzIGRhdGEgc291cmNlLlxuICAgIGlmICh0aGlzLl9yZW5kZXJDaGFuZ2VTdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuX3JlbmRlckNoYW5nZVN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5fcmVuZGVyQ2hhbmdlU3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoIWRhdGFTb3VyY2UpIHtcbiAgICAgIGlmICh0aGlzLl9kYXRhRGlmZmVyKSB7XG4gICAgICAgIHRoaXMuX2RhdGFEaWZmZXIuZGlmZihbXSk7XG4gICAgICB9XG4gICAgICB0aGlzLl9yb3dPdXRsZXQudmlld0NvbnRhaW5lci5jbGVhcigpO1xuICAgIH1cblxuICAgIHRoaXMuX2RhdGFTb3VyY2UgPSBkYXRhU291cmNlO1xuICB9XG5cbiAgLyoqIFNldCB1cCBhIHN1YnNjcmlwdGlvbiBmb3IgdGhlIGRhdGEgcHJvdmlkZWQgYnkgdGhlIGRhdGEgc291cmNlLiAqL1xuICBwcml2YXRlIF9vYnNlcnZlUmVuZGVyQ2hhbmdlcygpIHtcbiAgICAvLyBJZiBubyBkYXRhIHNvdXJjZSBoYXMgYmVlbiBzZXQsIHRoZXJlIGlzIG5vdGhpbmcgdG8gb2JzZXJ2ZSBmb3IgY2hhbmdlcy5cbiAgICBpZiAoIXRoaXMuZGF0YVNvdXJjZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBkYXRhU3RyZWFtOiBPYnNlcnZhYmxlPHJlYWRvbmx5IFRbXT58dW5kZWZpbmVkO1xuXG4gICAgaWYgKGlzRGF0YVNvdXJjZSh0aGlzLmRhdGFTb3VyY2UpKSB7XG4gICAgICBkYXRhU3RyZWFtID0gdGhpcy5kYXRhU291cmNlLmNvbm5lY3QodGhpcyk7XG4gICAgfSBlbHNlIGlmIChpc09ic2VydmFibGUodGhpcy5kYXRhU291cmNlKSkge1xuICAgICAgZGF0YVN0cmVhbSA9IHRoaXMuZGF0YVNvdXJjZTtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5kYXRhU291cmNlKSkge1xuICAgICAgZGF0YVN0cmVhbSA9IG9ic2VydmFibGVPZih0aGlzLmRhdGFTb3VyY2UpO1xuICAgIH1cblxuICAgIGlmIChkYXRhU3RyZWFtID09PSB1bmRlZmluZWQgJiYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgIHRocm93IGdldFRhYmxlVW5rbm93bkRhdGFTb3VyY2VFcnJvcigpO1xuICAgIH1cblxuICAgIHRoaXMuX3JlbmRlckNoYW5nZVN1YnNjcmlwdGlvbiA9IGRhdGFTdHJlYW0hLnBpcGUodGFrZVVudGlsKHRoaXMuX29uRGVzdHJveSkpXG4gICAgICAuc3Vic2NyaWJlKGRhdGEgPT4ge1xuICAgICAgICB0aGlzLl9kYXRhID0gZGF0YSB8fCBbXTtcbiAgICAgICAgdGhpcy5yZW5kZXJSb3dzKCk7XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgYW55IGV4aXN0aW5nIGNvbnRlbnQgaW4gdGhlIGhlYWRlciByb3cgb3V0bGV0IGFuZCBjcmVhdGVzIGEgbmV3IGVtYmVkZGVkIHZpZXdcbiAgICogaW4gdGhlIG91dGxldCB1c2luZyB0aGUgaGVhZGVyIHJvdyBkZWZpbml0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBfZm9yY2VSZW5kZXJIZWFkZXJSb3dzKCkge1xuICAgIC8vIENsZWFyIHRoZSBoZWFkZXIgcm93IG91dGxldCBpZiBhbnkgY29udGVudCBleGlzdHMuXG4gICAgaWYgKHRoaXMuX2hlYWRlclJvd091dGxldC52aWV3Q29udGFpbmVyLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuX2hlYWRlclJvd091dGxldC52aWV3Q29udGFpbmVyLmNsZWFyKCk7XG4gICAgfVxuXG4gICAgdGhpcy5faGVhZGVyUm93RGVmcy5mb3JFYWNoKChkZWYsIGkpID0+IHRoaXMuX3JlbmRlclJvdyh0aGlzLl9oZWFkZXJSb3dPdXRsZXQsIGRlZiwgaSkpO1xuICAgIHRoaXMudXBkYXRlU3RpY2t5SGVhZGVyUm93U3R5bGVzKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIGFueSBleGlzdGluZyBjb250ZW50IGluIHRoZSBmb290ZXIgcm93IG91dGxldCBhbmQgY3JlYXRlcyBhIG5ldyBlbWJlZGRlZCB2aWV3XG4gICAqIGluIHRoZSBvdXRsZXQgdXNpbmcgdGhlIGZvb3RlciByb3cgZGVmaW5pdGlvbi5cbiAgICovXG4gIHByaXZhdGUgX2ZvcmNlUmVuZGVyRm9vdGVyUm93cygpIHtcbiAgICAvLyBDbGVhciB0aGUgZm9vdGVyIHJvdyBvdXRsZXQgaWYgYW55IGNvbnRlbnQgZXhpc3RzLlxuICAgIGlmICh0aGlzLl9mb290ZXJSb3dPdXRsZXQudmlld0NvbnRhaW5lci5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLl9mb290ZXJSb3dPdXRsZXQudmlld0NvbnRhaW5lci5jbGVhcigpO1xuICAgIH1cblxuICAgIHRoaXMuX2Zvb3RlclJvd0RlZnMuZm9yRWFjaCgoZGVmLCBpKSA9PiB0aGlzLl9yZW5kZXJSb3codGhpcy5fZm9vdGVyUm93T3V0bGV0LCBkZWYsIGkpKTtcbiAgICB0aGlzLnVwZGF0ZVN0aWNreUZvb3RlclJvd1N0eWxlcygpO1xuICB9XG5cbiAgLyoqIEFkZHMgdGhlIHN0aWNreSBjb2x1bW4gc3R5bGVzIGZvciB0aGUgcm93cyBhY2NvcmRpbmcgdG8gdGhlIGNvbHVtbnMnIHN0aWNrIHN0YXRlcy4gKi9cbiAgcHJpdmF0ZSBfYWRkU3RpY2t5Q29sdW1uU3R5bGVzKHJvd3M6IEhUTUxFbGVtZW50W10sIHJvd0RlZjogQmFzZVJvd0RlZikge1xuICAgIGNvbnN0IGNvbHVtbkRlZnMgPSBBcnJheS5mcm9tKHJvd0RlZi5jb2x1bW5zIHx8IFtdKS5tYXAoY29sdW1uTmFtZSA9PiB7XG4gICAgICBjb25zdCBjb2x1bW5EZWYgPSB0aGlzLl9jb2x1bW5EZWZzQnlOYW1lLmdldChjb2x1bW5OYW1lKTtcbiAgICAgIGlmICghY29sdW1uRGVmICYmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpKSB7XG4gICAgICAgIHRocm93IGdldFRhYmxlVW5rbm93bkNvbHVtbkVycm9yKGNvbHVtbk5hbWUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNvbHVtbkRlZiE7XG4gICAgfSk7XG4gICAgY29uc3Qgc3RpY2t5U3RhcnRTdGF0ZXMgPSBjb2x1bW5EZWZzLm1hcChjb2x1bW5EZWYgPT4gY29sdW1uRGVmLnN0aWNreSk7XG4gICAgY29uc3Qgc3RpY2t5RW5kU3RhdGVzID0gY29sdW1uRGVmcy5tYXAoY29sdW1uRGVmID0+IGNvbHVtbkRlZi5zdGlja3lFbmQpO1xuICAgIHRoaXMuX3N0aWNreVN0eWxlci51cGRhdGVTdGlja3lDb2x1bW5zKFxuICAgICAgICByb3dzLCBzdGlja3lTdGFydFN0YXRlcywgc3RpY2t5RW5kU3RhdGVzLFxuICAgICAgICAhdGhpcy5fZml4ZWRMYXlvdXQgfHwgdGhpcy5fZm9yY2VSZWNhbGN1bGF0ZUNlbGxXaWR0aHMpO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIGxpc3Qgb2Ygcm93cyB0aGF0IGhhdmUgYmVlbiByZW5kZXJlZCBpbiB0aGUgcm93IG91dGxldC4gKi9cbiAgX2dldFJlbmRlcmVkUm93cyhyb3dPdXRsZXQ6IFJvd091dGxldCk6IEhUTUxFbGVtZW50W10ge1xuICAgIGNvbnN0IHJlbmRlcmVkUm93czogSFRNTEVsZW1lbnRbXSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByb3dPdXRsZXQudmlld0NvbnRhaW5lci5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgdmlld1JlZiA9IChyb3dPdXRsZXQudmlld0NvbnRhaW5lci5nZXQoaSkhIGFzIEVtYmVkZGVkVmlld1JlZjxhbnk+KTtcbiAgICAgIHJlbmRlcmVkUm93cy5wdXNoKHZpZXdSZWYucm9vdE5vZGVzWzBdKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVuZGVyZWRSb3dzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgbWF0Y2hpbmcgcm93IGRlZmluaXRpb25zIHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIHRoaXMgcm93IGRhdGEuIElmIHRoZXJlIGlzIG9ubHlcbiAgICogb25lIHJvdyBkZWZpbml0aW9uLCBpdCBpcyByZXR1cm5lZC4gT3RoZXJ3aXNlLCBmaW5kIHRoZSByb3cgZGVmaW5pdGlvbnMgdGhhdCBoYXMgYSB3aGVuXG4gICAqIHByZWRpY2F0ZSB0aGF0IHJldHVybnMgdHJ1ZSB3aXRoIHRoZSBkYXRhLiBJZiBub25lIHJldHVybiB0cnVlLCByZXR1cm4gdGhlIGRlZmF1bHQgcm93XG4gICAqIGRlZmluaXRpb24uXG4gICAqL1xuICBfZ2V0Um93RGVmcyhkYXRhOiBULCBkYXRhSW5kZXg6IG51bWJlcik6IENka1Jvd0RlZjxUPltdIHtcbiAgICBpZiAodGhpcy5fcm93RGVmcy5sZW5ndGggPT0gMSkge1xuICAgICAgcmV0dXJuIFt0aGlzLl9yb3dEZWZzWzBdXTtcbiAgICB9XG5cbiAgICBsZXQgcm93RGVmczogQ2RrUm93RGVmPFQ+W10gPSBbXTtcbiAgICBpZiAodGhpcy5tdWx0aVRlbXBsYXRlRGF0YVJvd3MpIHtcbiAgICAgIHJvd0RlZnMgPSB0aGlzLl9yb3dEZWZzLmZpbHRlcihkZWYgPT4gIWRlZi53aGVuIHx8IGRlZi53aGVuKGRhdGFJbmRleCwgZGF0YSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgcm93RGVmID1cbiAgICAgICAgICB0aGlzLl9yb3dEZWZzLmZpbmQoZGVmID0+IGRlZi53aGVuICYmIGRlZi53aGVuKGRhdGFJbmRleCwgZGF0YSkpIHx8IHRoaXMuX2RlZmF1bHRSb3dEZWY7XG4gICAgICBpZiAocm93RGVmKSB7XG4gICAgICAgIHJvd0RlZnMucHVzaChyb3dEZWYpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghcm93RGVmcy5sZW5ndGggJiYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgIHRocm93IGdldFRhYmxlTWlzc2luZ01hdGNoaW5nUm93RGVmRXJyb3IoZGF0YSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJvd0RlZnM7XG4gIH1cblxuXG4gIHByaXZhdGUgX2dldEVtYmVkZGVkVmlld0FyZ3MocmVuZGVyUm93OiBSZW5kZXJSb3c8VD4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IG51bWJlcik6IF9WaWV3UmVwZWF0ZXJJdGVtSW5zZXJ0QXJnczxSb3dDb250ZXh0PFQ+PiB7XG4gICAgY29uc3Qgcm93RGVmID0gcmVuZGVyUm93LnJvd0RlZjtcbiAgICBjb25zdCBjb250ZXh0OiBSb3dDb250ZXh0PFQ+ID0geyRpbXBsaWNpdDogcmVuZGVyUm93LmRhdGF9O1xuICAgIHJldHVybiB7XG4gICAgICB0ZW1wbGF0ZVJlZjogcm93RGVmLnRlbXBsYXRlLFxuICAgICAgY29udGV4dCxcbiAgICAgIGluZGV4LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyByb3cgdGVtcGxhdGUgaW4gdGhlIG91dGxldCBhbmQgZmlsbHMgaXQgd2l0aCB0aGUgc2V0IG9mIGNlbGwgdGVtcGxhdGVzLlxuICAgKiBPcHRpb25hbGx5IHRha2VzIGEgY29udGV4dCB0byBwcm92aWRlIHRvIHRoZSByb3cgYW5kIGNlbGxzLCBhcyB3ZWxsIGFzIGFuIG9wdGlvbmFsIGluZGV4XG4gICAqIG9mIHdoZXJlIHRvIHBsYWNlIHRoZSBuZXcgcm93IHRlbXBsYXRlIGluIHRoZSBvdXRsZXQuXG4gICAqL1xuICBwcml2YXRlIF9yZW5kZXJSb3coXG4gICAgICBvdXRsZXQ6IFJvd091dGxldCwgcm93RGVmOiBCYXNlUm93RGVmLCBpbmRleDogbnVtYmVyLFxuICAgICAgY29udGV4dDogUm93Q29udGV4dDxUPiA9IHt9KTogRW1iZWRkZWRWaWV3UmVmPFJvd0NvbnRleHQ8VD4+IHtcbiAgICAvLyBUT0RPKGFuZHJld3NlZ3Vpbik6IGVuZm9yY2UgdGhhdCBvbmUgb3V0bGV0IHdhcyBpbnN0YW50aWF0ZWQgZnJvbSBjcmVhdGVFbWJlZGRlZFZpZXdcbiAgICBjb25zdCB2aWV3ID0gb3V0bGV0LnZpZXdDb250YWluZXIuY3JlYXRlRW1iZWRkZWRWaWV3KHJvd0RlZi50ZW1wbGF0ZSwgY29udGV4dCwgaW5kZXgpO1xuICAgIHRoaXMuX3JlbmRlckNlbGxUZW1wbGF0ZUZvckl0ZW0ocm93RGVmLCBjb250ZXh0KTtcbiAgICByZXR1cm4gdmlldztcbiAgfVxuXG4gIHByaXZhdGUgX3JlbmRlckNlbGxUZW1wbGF0ZUZvckl0ZW0ocm93RGVmOiBCYXNlUm93RGVmLCBjb250ZXh0OiBSb3dDb250ZXh0PFQ+KSB7XG4gICAgZm9yIChsZXQgY2VsbFRlbXBsYXRlIG9mIHRoaXMuX2dldENlbGxUZW1wbGF0ZXMocm93RGVmKSkge1xuICAgICAgaWYgKENka0NlbGxPdXRsZXQubW9zdFJlY2VudENlbGxPdXRsZXQpIHtcbiAgICAgICAgQ2RrQ2VsbE91dGxldC5tb3N0UmVjZW50Q2VsbE91dGxldC5fdmlld0NvbnRhaW5lci5jcmVhdGVFbWJlZGRlZFZpZXcoY2VsbFRlbXBsYXRlLCBjb250ZXh0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBpbmRleC1yZWxhdGVkIGNvbnRleHQgZm9yIGVhY2ggcm93IHRvIHJlZmxlY3QgYW55IGNoYW5nZXMgaW4gdGhlIGluZGV4IG9mIHRoZSByb3dzLFxuICAgKiBlLmcuIGZpcnN0L2xhc3QvZXZlbi9vZGQuXG4gICAqL1xuICBwcml2YXRlIF91cGRhdGVSb3dJbmRleENvbnRleHQoKSB7XG4gICAgY29uc3Qgdmlld0NvbnRhaW5lciA9IHRoaXMuX3Jvd091dGxldC52aWV3Q29udGFpbmVyO1xuICAgIGZvciAobGV0IHJlbmRlckluZGV4ID0gMCwgY291bnQgPSB2aWV3Q29udGFpbmVyLmxlbmd0aDsgcmVuZGVySW5kZXggPCBjb3VudDsgcmVuZGVySW5kZXgrKykge1xuICAgICAgY29uc3Qgdmlld1JlZiA9IHZpZXdDb250YWluZXIuZ2V0KHJlbmRlckluZGV4KSBhcyBSb3dWaWV3UmVmPFQ+O1xuICAgICAgY29uc3QgY29udGV4dCA9IHZpZXdSZWYuY29udGV4dCBhcyBSb3dDb250ZXh0PFQ+O1xuICAgICAgY29udGV4dC5jb3VudCA9IGNvdW50O1xuICAgICAgY29udGV4dC5maXJzdCA9IHJlbmRlckluZGV4ID09PSAwO1xuICAgICAgY29udGV4dC5sYXN0ID0gcmVuZGVySW5kZXggPT09IGNvdW50IC0gMTtcbiAgICAgIGNvbnRleHQuZXZlbiA9IHJlbmRlckluZGV4ICUgMiA9PT0gMDtcbiAgICAgIGNvbnRleHQub2RkID0gIWNvbnRleHQuZXZlbjtcblxuICAgICAgaWYgKHRoaXMubXVsdGlUZW1wbGF0ZURhdGFSb3dzKSB7XG4gICAgICAgIGNvbnRleHQuZGF0YUluZGV4ID0gdGhpcy5fcmVuZGVyUm93c1tyZW5kZXJJbmRleF0uZGF0YUluZGV4O1xuICAgICAgICBjb250ZXh0LnJlbmRlckluZGV4ID0gcmVuZGVySW5kZXg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb250ZXh0LmluZGV4ID0gdGhpcy5fcmVuZGVyUm93c1tyZW5kZXJJbmRleF0uZGF0YUluZGV4O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBjb2x1bW4gZGVmaW5pdGlvbnMgZm9yIHRoZSBwcm92aWRlZCByb3cgZGVmLiAqL1xuICBwcml2YXRlIF9nZXRDZWxsVGVtcGxhdGVzKHJvd0RlZjogQmFzZVJvd0RlZik6IFRlbXBsYXRlUmVmPGFueT5bXSB7XG4gICAgaWYgKCFyb3dEZWYgfHwgIXJvd0RlZi5jb2x1bW5zKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIHJldHVybiBBcnJheS5mcm9tKHJvd0RlZi5jb2x1bW5zLCBjb2x1bW5JZCA9PiB7XG4gICAgICBjb25zdCBjb2x1bW4gPSB0aGlzLl9jb2x1bW5EZWZzQnlOYW1lLmdldChjb2x1bW5JZCk7XG5cbiAgICAgIGlmICghY29sdW1uICYmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpKSB7XG4gICAgICAgIHRocm93IGdldFRhYmxlVW5rbm93bkNvbHVtbkVycm9yKGNvbHVtbklkKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJvd0RlZi5leHRyYWN0Q2VsbFRlbXBsYXRlKGNvbHVtbiEpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIEFkZHMgbmF0aXZlIHRhYmxlIHNlY3Rpb25zIChlLmcuIHRib2R5KSBhbmQgbW92ZXMgdGhlIHJvdyBvdXRsZXRzIGludG8gdGhlbS4gKi9cbiAgcHJpdmF0ZSBfYXBwbHlOYXRpdmVUYWJsZVNlY3Rpb25zKCkge1xuICAgIGNvbnN0IGRvY3VtZW50RnJhZ21lbnQgPSB0aGlzLl9kb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgY29uc3Qgc2VjdGlvbnMgPSBbXG4gICAgICB7dGFnOiAndGhlYWQnLCBvdXRsZXRzOiBbdGhpcy5faGVhZGVyUm93T3V0bGV0XX0sXG4gICAgICB7dGFnOiAndGJvZHknLCBvdXRsZXRzOiBbdGhpcy5fcm93T3V0bGV0LCB0aGlzLl9ub0RhdGFSb3dPdXRsZXRdfSxcbiAgICAgIHt0YWc6ICd0Zm9vdCcsIG91dGxldHM6IFt0aGlzLl9mb290ZXJSb3dPdXRsZXRdfSxcbiAgICBdO1xuXG4gICAgZm9yIChjb25zdCBzZWN0aW9uIG9mIHNlY3Rpb25zKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fZG9jdW1lbnQuY3JlYXRlRWxlbWVudChzZWN0aW9uLnRhZyk7XG4gICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgncm9sZScsICdyb3dncm91cCcpO1xuXG4gICAgICBmb3IgKGNvbnN0IG91dGxldCBvZiBzZWN0aW9uLm91dGxldHMpIHtcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChvdXRsZXQuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50KTtcbiAgICAgIH1cblxuICAgICAgZG9jdW1lbnRGcmFnbWVudC5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICB9XG5cbiAgICAvLyBVc2UgYSBEb2N1bWVudEZyYWdtZW50IHNvIHdlIGRvbid0IGhpdCB0aGUgRE9NIG9uIGVhY2ggaXRlcmF0aW9uLlxuICAgIHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5hcHBlbmRDaGlsZChkb2N1bWVudEZyYWdtZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb3JjZXMgYSByZS1yZW5kZXIgb2YgdGhlIGRhdGEgcm93cy4gU2hvdWxkIGJlIGNhbGxlZCBpbiBjYXNlcyB3aGVyZSB0aGVyZSBoYXMgYmVlbiBhbiBpbnB1dFxuICAgKiBjaGFuZ2UgdGhhdCBhZmZlY3RzIHRoZSBldmFsdWF0aW9uIG9mIHdoaWNoIHJvd3Mgc2hvdWxkIGJlIHJlbmRlcmVkLCBlLmcuIHRvZ2dsaW5nXG4gICAqIGBtdWx0aVRlbXBsYXRlRGF0YVJvd3NgIG9yIGFkZGluZy9yZW1vdmluZyByb3cgZGVmaW5pdGlvbnMuXG4gICAqL1xuICBwcml2YXRlIF9mb3JjZVJlbmRlckRhdGFSb3dzKCkge1xuICAgIHRoaXMuX2RhdGFEaWZmZXIuZGlmZihbXSk7XG4gICAgdGhpcy5fcm93T3V0bGV0LnZpZXdDb250YWluZXIuY2xlYXIoKTtcbiAgICB0aGlzLnJlbmRlclJvd3MoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlcmUgaGFzIGJlZW4gYSBjaGFuZ2UgaW4gc3RpY2t5IHN0YXRlcyBzaW5jZSBsYXN0IGNoZWNrIGFuZCBhcHBsaWVzIHRoZSBjb3JyZWN0XG4gICAqIHN0aWNreSBzdHlsZXMuIFNpbmNlIGNoZWNraW5nIHJlc2V0cyB0aGUgXCJkaXJ0eVwiIHN0YXRlLCB0aGlzIHNob3VsZCBvbmx5IGJlIHBlcmZvcm1lZCBvbmNlXG4gICAqIGR1cmluZyBhIGNoYW5nZSBkZXRlY3Rpb24gYW5kIGFmdGVyIHRoZSBpbnB1dHMgYXJlIHNldHRsZWQgKGFmdGVyIGNvbnRlbnQgY2hlY2spLlxuICAgKi9cbiAgcHJpdmF0ZSBfY2hlY2tTdGlja3lTdGF0ZXMoKSB7XG4gICAgY29uc3Qgc3RpY2t5Q2hlY2tSZWR1Y2VyID0gKGFjYzogYm9vbGVhbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZDogQ2RrSGVhZGVyUm93RGVmfENka0Zvb3RlclJvd0RlZnxDZGtDb2x1bW5EZWYpID0+IHtcbiAgICAgIHJldHVybiBhY2MgfHwgZC5oYXNTdGlja3lDaGFuZ2VkKCk7XG4gICAgfTtcblxuICAgIC8vIE5vdGUgdGhhdCB0aGUgY2hlY2sgbmVlZHMgdG8gb2NjdXIgZm9yIGV2ZXJ5IGRlZmluaXRpb24gc2luY2UgaXQgbm90aWZpZXMgdGhlIGRlZmluaXRpb25cbiAgICAvLyB0aGF0IGl0IGNhbiByZXNldCBpdHMgZGlydHkgc3RhdGUuIFVzaW5nIGFub3RoZXIgb3BlcmF0b3IgbGlrZSBgc29tZWAgbWF5IHNob3J0LWNpcmN1aXRcbiAgICAvLyByZW1haW5pbmcgZGVmaW5pdGlvbnMgYW5kIGxlYXZlIHRoZW0gaW4gYW4gdW5jaGVja2VkIHN0YXRlLlxuXG4gICAgaWYgKHRoaXMuX2hlYWRlclJvd0RlZnMucmVkdWNlKHN0aWNreUNoZWNrUmVkdWNlciwgZmFsc2UpKSB7XG4gICAgICB0aGlzLnVwZGF0ZVN0aWNreUhlYWRlclJvd1N0eWxlcygpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9mb290ZXJSb3dEZWZzLnJlZHVjZShzdGlja3lDaGVja1JlZHVjZXIsIGZhbHNlKSkge1xuICAgICAgdGhpcy51cGRhdGVTdGlja3lGb290ZXJSb3dTdHlsZXMoKTtcbiAgICB9XG5cbiAgICBpZiAoQXJyYXkuZnJvbSh0aGlzLl9jb2x1bW5EZWZzQnlOYW1lLnZhbHVlcygpKS5yZWR1Y2Uoc3RpY2t5Q2hlY2tSZWR1Y2VyLCBmYWxzZSkpIHtcbiAgICAgIHRoaXMuX3N0aWNreUNvbHVtblN0eWxlc05lZWRSZXNldCA9IHRydWU7XG4gICAgICB0aGlzLnVwZGF0ZVN0aWNreUNvbHVtblN0eWxlcygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIHRoZSBzdGlja3kgc3R5bGVyIHRoYXQgd2lsbCBiZSB1c2VkIGZvciBzdGlja3kgcm93cyBhbmQgY29sdW1ucy4gTGlzdGVuc1xuICAgKiBmb3IgZGlyZWN0aW9uYWxpdHkgY2hhbmdlcyBhbmQgcHJvdmlkZXMgdGhlIGxhdGVzdCBkaXJlY3Rpb24gdG8gdGhlIHN0eWxlci4gUmUtYXBwbGllcyBjb2x1bW5cbiAgICogc3RpY2tpbmVzcyB3aGVuIGRpcmVjdGlvbmFsaXR5IGNoYW5nZXMuXG4gICAqL1xuICBwcml2YXRlIF9zZXR1cFN0aWNreVN0eWxlcigpIHtcbiAgICBjb25zdCBkaXJlY3Rpb246IERpcmVjdGlvbiA9IHRoaXMuX2RpciA/IHRoaXMuX2Rpci52YWx1ZSA6ICdsdHInO1xuICAgIHRoaXMuX3N0aWNreVN0eWxlciA9IG5ldyBTdGlja3lTdHlsZXIoXG4gICAgICAgIHRoaXMuX2lzTmF0aXZlSHRtbFRhYmxlLCB0aGlzLnN0aWNreUNzc0NsYXNzLCBkaXJlY3Rpb24sIHRoaXMuX2NvYWxlc2NlZFN0eWxlU2NoZWR1bGVyLFxuICAgICAgICB0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIsIHRoaXMubmVlZHNQb3NpdGlvblN0aWNreU9uRWxlbWVudCxcbiAgICAgICAgdGhpcy5fc3RpY2t5UG9zaXRpb25pbmdMaXN0ZW5lcik7XG4gICAgKHRoaXMuX2RpciA/IHRoaXMuX2Rpci5jaGFuZ2UgOiBvYnNlcnZhYmxlT2Y8RGlyZWN0aW9uPigpKVxuICAgIC5waXBlKHRha2VVbnRpbCh0aGlzLl9vbkRlc3Ryb3kpKVxuICAgIC5zdWJzY3JpYmUodmFsdWUgPT4ge1xuICAgICAgdGhpcy5fc3RpY2t5U3R5bGVyLmRpcmVjdGlvbiA9IHZhbHVlO1xuICAgICAgdGhpcy51cGRhdGVTdGlja3lDb2x1bW5TdHlsZXMoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBGaWx0ZXJzIGRlZmluaXRpb25zIHRoYXQgYmVsb25nIHRvIHRoaXMgdGFibGUgZnJvbSBhIFF1ZXJ5TGlzdC4gKi9cbiAgcHJpdmF0ZSBfZ2V0T3duRGVmczxJIGV4dGVuZHMge190YWJsZT86IGFueX0+KGl0ZW1zOiBRdWVyeUxpc3Q8ST4pOiBJW10ge1xuICAgIHJldHVybiBpdGVtcy5maWx0ZXIoaXRlbSA9PiAhaXRlbS5fdGFibGUgfHwgaXRlbS5fdGFibGUgPT09IHRoaXMpO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgb3IgcmVtb3ZlcyB0aGUgbm8gZGF0YSByb3csIGRlcGVuZGluZyBvbiB3aGV0aGVyIGFueSBkYXRhIGlzIGJlaW5nIHNob3duLiAqL1xuICBwcml2YXRlIF91cGRhdGVOb0RhdGFSb3coKSB7XG4gICAgY29uc3Qgbm9EYXRhUm93ID0gdGhpcy5fY3VzdG9tTm9EYXRhUm93IHx8IHRoaXMuX25vRGF0YVJvdztcblxuICAgIGlmIChub0RhdGFSb3cpIHtcbiAgICAgIGNvbnN0IHNob3VsZFNob3cgPSB0aGlzLl9yb3dPdXRsZXQudmlld0NvbnRhaW5lci5sZW5ndGggPT09IDA7XG5cbiAgICAgIGlmIChzaG91bGRTaG93ICE9PSB0aGlzLl9pc1Nob3dpbmdOb0RhdGFSb3cpIHtcbiAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5fbm9EYXRhUm93T3V0bGV0LnZpZXdDb250YWluZXI7XG4gICAgICAgIHNob3VsZFNob3cgPyBjb250YWluZXIuY3JlYXRlRW1iZWRkZWRWaWV3KG5vRGF0YVJvdy50ZW1wbGF0ZVJlZikgOiBjb250YWluZXIuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5faXNTaG93aW5nTm9EYXRhUm93ID0gc2hvdWxkU2hvdztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfbXVsdGlUZW1wbGF0ZURhdGFSb3dzOiBCb29sZWFuSW5wdXQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9maXhlZExheW91dDogQm9vbGVhbklucHV0O1xufVxuXG4vKiogVXRpbGl0eSBmdW5jdGlvbiB0aGF0IGdldHMgYSBtZXJnZWQgbGlzdCBvZiB0aGUgZW50cmllcyBpbiBhbiBhcnJheSBhbmQgdmFsdWVzIG9mIGEgU2V0LiAqL1xuZnVuY3Rpb24gbWVyZ2VBcnJheUFuZFNldDxUPihhcnJheTogVFtdLCBzZXQ6IFNldDxUPik6IFRbXSB7XG4gIHJldHVybiBhcnJheS5jb25jYXQoQXJyYXkuZnJvbShzZXQpKTtcbn1cbiJdfQ==