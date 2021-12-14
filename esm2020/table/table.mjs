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
import { CdkCellOutlet, CdkFooterRowDef, CdkHeaderRowDef, CdkNoDataRow, CdkRowDef, } from './row';
import { StickyStyler } from './sticky-styler';
import { getTableDuplicateColumnNameError, getTableMissingMatchingRowDefError, getTableMissingRowDefsError, getTableMultipleDefaultRowDefsError, getTableUnknownColumnError, getTableUnknownDataSourceError, } from './table-errors';
import { STICKY_POSITIONING_LISTENER } from './sticky-position-listener';
import { CDK_TABLE } from './tokens';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/bidi";
import * as i2 from "@angular/cdk/platform";
import * as i3 from "@angular/cdk/scrolling";
import * as i4 from "./coalesced-style-scheduler";
/**
 * Enables the recycle view repeater strategy, which reduces rendering latency. Not compatible with
 * tables that animate rows.
 */
export class CdkRecycleRows {
}
CdkRecycleRows.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: CdkRecycleRows, deps: [], target: i0.ɵɵFactoryTarget.Directive });
CdkRecycleRows.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.1.0", type: CdkRecycleRows, selector: "cdk-table[recycleRows], table[cdk-table][recycleRows]", providers: [{ provide: _VIEW_REPEATER_STRATEGY, useClass: _RecycleViewRepeaterStrategy }], ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: CdkRecycleRows, decorators: [{
            type: Directive,
            args: [{
                    selector: 'cdk-table[recycleRows], table[cdk-table][recycleRows]',
                    providers: [{ provide: _VIEW_REPEATER_STRATEGY, useClass: _RecycleViewRepeaterStrategy }],
                }]
        }] });
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
DataRowOutlet.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: DataRowOutlet, deps: [{ token: i0.ViewContainerRef }, { token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Directive });
DataRowOutlet.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.1.0", type: DataRowOutlet, selector: "[rowOutlet]", ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: DataRowOutlet, decorators: [{
            type: Directive,
            args: [{ selector: '[rowOutlet]' }]
        }], ctorParameters: function () { return [{ type: i0.ViewContainerRef }, { type: i0.ElementRef }]; } });
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
HeaderRowOutlet.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: HeaderRowOutlet, deps: [{ token: i0.ViewContainerRef }, { token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Directive });
HeaderRowOutlet.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.1.0", type: HeaderRowOutlet, selector: "[headerRowOutlet]", ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: HeaderRowOutlet, decorators: [{
            type: Directive,
            args: [{ selector: '[headerRowOutlet]' }]
        }], ctorParameters: function () { return [{ type: i0.ViewContainerRef }, { type: i0.ElementRef }]; } });
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
FooterRowOutlet.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: FooterRowOutlet, deps: [{ token: i0.ViewContainerRef }, { token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Directive });
FooterRowOutlet.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.1.0", type: FooterRowOutlet, selector: "[footerRowOutlet]", ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: FooterRowOutlet, decorators: [{
            type: Directive,
            args: [{ selector: '[footerRowOutlet]' }]
        }], ctorParameters: function () { return [{ type: i0.ViewContainerRef }, { type: i0.ElementRef }]; } });
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
NoDataRowOutlet.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: NoDataRowOutlet, deps: [{ token: i0.ViewContainerRef }, { token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Directive });
NoDataRowOutlet.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.1.0", type: NoDataRowOutlet, selector: "[noDataRowOutlet]", ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: NoDataRowOutlet, decorators: [{
            type: Directive,
            args: [{ selector: '[noDataRowOutlet]' }]
        }], ctorParameters: function () { return [{ type: i0.ViewContainerRef }, { type: i0.ElementRef }]; } });
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
        this.viewChange = new BehaviorSubject({
            start: 0,
            end: Number.MAX_VALUE,
        });
        if (!role) {
            this._elementRef.nativeElement.setAttribute('role', 'table');
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
        this._viewportRuler
            .change()
            .pipe(takeUntil(this._onDestroy))
            .subscribe(() => {
            this._forceRecalculateCellWidths = true;
        });
    }
    ngAfterContentChecked() {
        // Cache the row and column definitions gathered by ContentChildren and programmatic injection.
        this._cacheRowDefs();
        this._cacheColumnDefs();
        // Make sure that the user has at least added header, footer, or data row def.
        if (!this._headerRowDefs.length &&
            !this._footerRowDefs.length &&
            !this._rowDefs.length &&
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
        this._viewRepeater.applyChanges(changes, viewContainer, (record, _adjustedPreviousIndex, currentIndex) => this._getEmbeddedViewArgs(record.item, currentIndex), record => record.item.data, (change) => {
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
        if ((this._isNativeHtmlTable && !this._fixedLayout) || this._stickyColumnStylesNeedReset) {
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
            const cachedRenderRows = cache && cache.has(rowDef) ? cache.get(rowDef) : [];
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
        if (!this.multiTemplateDataRows &&
            defaultRowDefs.length > 1 &&
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
        this._renderChangeSubscription = dataStream
            .pipe(takeUntil(this._onDestroy))
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
        if (!noDataRow) {
            return;
        }
        const shouldShow = this._rowOutlet.viewContainer.length === 0;
        if (shouldShow === this._isShowingNoDataRow) {
            return;
        }
        const container = this._noDataRowOutlet.viewContainer;
        if (shouldShow) {
            const view = container.createEmbeddedView(noDataRow.templateRef);
            const rootNode = view.rootNodes[0];
            // Only add the attributes if we have a single root node since it's hard
            // to figure out which one to add it to when there are multiple.
            if (view.rootNodes.length === 1 && rootNode?.nodeType === this._document.ELEMENT_NODE) {
                rootNode.setAttribute('role', 'row');
                rootNode.classList.add(noDataRow._contentClassName);
            }
        }
        else {
            container.clear();
        }
        this._isShowingNoDataRow = shouldShow;
    }
}
CdkTable.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: CdkTable, deps: [{ token: i0.IterableDiffers }, { token: i0.ChangeDetectorRef }, { token: i0.ElementRef }, { token: 'role', attribute: true }, { token: i1.Directionality, optional: true }, { token: DOCUMENT }, { token: i2.Platform }, { token: _VIEW_REPEATER_STRATEGY }, { token: _COALESCED_STYLE_SCHEDULER }, { token: i3.ViewportRuler }, { token: STICKY_POSITIONING_LISTENER, optional: true, skipSelf: true }], target: i0.ɵɵFactoryTarget.Component });
CdkTable.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.1.0", type: CdkTable, selector: "cdk-table, table[cdk-table]", inputs: { trackBy: "trackBy", dataSource: "dataSource", multiTemplateDataRows: "multiTemplateDataRows", fixedLayout: "fixedLayout" }, outputs: { contentChanged: "contentChanged" }, host: { properties: { "class.cdk-table-fixed-layout": "fixedLayout" }, classAttribute: "cdk-table" }, providers: [
        { provide: CDK_TABLE, useExisting: CdkTable },
        { provide: _VIEW_REPEATER_STRATEGY, useClass: _DisposeViewRepeaterStrategy },
        { provide: _COALESCED_STYLE_SCHEDULER, useClass: _CoalescedStyleScheduler },
        // Prevent nested tables from seeing this table's StickyPositioningListener.
        { provide: STICKY_POSITIONING_LISTENER, useValue: null },
    ], queries: [{ propertyName: "_noDataRow", first: true, predicate: CdkNoDataRow, descendants: true }, { propertyName: "_contentColumnDefs", predicate: CdkColumnDef, descendants: true }, { propertyName: "_contentRowDefs", predicate: CdkRowDef, descendants: true }, { propertyName: "_contentHeaderRowDefs", predicate: CdkHeaderRowDef, descendants: true }, { propertyName: "_contentFooterRowDefs", predicate: CdkFooterRowDef, descendants: true }], viewQueries: [{ propertyName: "_rowOutlet", first: true, predicate: DataRowOutlet, descendants: true, static: true }, { propertyName: "_headerRowOutlet", first: true, predicate: HeaderRowOutlet, descendants: true, static: true }, { propertyName: "_footerRowOutlet", first: true, predicate: FooterRowOutlet, descendants: true, static: true }, { propertyName: "_noDataRowOutlet", first: true, predicate: NoDataRowOutlet, descendants: true, static: true }], exportAs: ["cdkTable"], ngImport: i0, template: "\n  <ng-content select=\"caption\"></ng-content>\n  <ng-content select=\"colgroup, col\"></ng-content>\n  <ng-container headerRowOutlet></ng-container>\n  <ng-container rowOutlet></ng-container>\n  <ng-container noDataRowOutlet></ng-container>\n  <ng-container footerRowOutlet></ng-container>\n", isInline: true, styles: [".cdk-table-fixed-layout{table-layout:fixed}\n"], directives: [{ type: HeaderRowOutlet, selector: "[headerRowOutlet]" }, { type: DataRowOutlet, selector: "[rowOutlet]" }, { type: NoDataRowOutlet, selector: "[noDataRowOutlet]" }, { type: FooterRowOutlet, selector: "[footerRowOutlet]" }], changeDetection: i0.ChangeDetectionStrategy.Default, encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: CdkTable, decorators: [{
            type: Component,
            args: [{ selector: 'cdk-table, table[cdk-table]', exportAs: 'cdkTable', template: CDK_TABLE_TEMPLATE, host: {
                        'class': 'cdk-table',
                        '[class.cdk-table-fixed-layout]': 'fixedLayout',
                    }, encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.Default, providers: [
                        { provide: CDK_TABLE, useExisting: CdkTable },
                        { provide: _VIEW_REPEATER_STRATEGY, useClass: _DisposeViewRepeaterStrategy },
                        { provide: _COALESCED_STYLE_SCHEDULER, useClass: _CoalescedStyleScheduler },
                        // Prevent nested tables from seeing this table's StickyPositioningListener.
                        { provide: STICKY_POSITIONING_LISTENER, useValue: null },
                    ], styles: [".cdk-table-fixed-layout{table-layout:fixed}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.IterableDiffers }, { type: i0.ChangeDetectorRef }, { type: i0.ElementRef }, { type: undefined, decorators: [{
                    type: Attribute,
                    args: ['role']
                }] }, { type: i1.Directionality, decorators: [{
                    type: Optional
                }] }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: i2.Platform }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [_VIEW_REPEATER_STRATEGY]
                }] }, { type: i4._CoalescedStyleScheduler, decorators: [{
                    type: Inject,
                    args: [_COALESCED_STYLE_SCHEDULER]
                }] }, { type: i3.ViewportRuler }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: SkipSelf
                }, {
                    type: Inject,
                    args: [STICKY_POSITIONING_LISTENER]
                }] }]; }, propDecorators: { trackBy: [{
                type: Input
            }], dataSource: [{
                type: Input
            }], multiTemplateDataRows: [{
                type: Input
            }], fixedLayout: [{
                type: Input
            }], contentChanged: [{
                type: Output
            }], _rowOutlet: [{
                type: ViewChild,
                args: [DataRowOutlet, { static: true }]
            }], _headerRowOutlet: [{
                type: ViewChild,
                args: [HeaderRowOutlet, { static: true }]
            }], _footerRowOutlet: [{
                type: ViewChild,
                args: [FooterRowOutlet, { static: true }]
            }], _noDataRowOutlet: [{
                type: ViewChild,
                args: [NoDataRowOutlet, { static: true }]
            }], _contentColumnDefs: [{
                type: ContentChildren,
                args: [CdkColumnDef, { descendants: true }]
            }], _contentRowDefs: [{
                type: ContentChildren,
                args: [CdkRowDef, { descendants: true }]
            }], _contentHeaderRowDefs: [{
                type: ContentChildren,
                args: [CdkHeaderRowDef, {
                        descendants: true,
                    }]
            }], _contentFooterRowDefs: [{
                type: ContentChildren,
                args: [CdkFooterRowDef, {
                        descendants: true,
                    }]
            }], _noDataRow: [{
                type: ContentChild,
                args: [CdkNoDataRow]
            }] } });
/** Utility function that gets a merged list of the entries in an array and values of a Set. */
function mergeArrayAndSet(array, set) {
    return array.concat(Array.from(set));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RhYmxlL3RhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBWSxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM1RCxPQUFPLEVBQWUscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRSxPQUFPLEVBR0wsNEJBQTRCLEVBQzVCLDRCQUE0QixFQUM1QixZQUFZLEVBQ1osdUJBQXVCLEdBS3hCLE1BQU0sMEJBQTBCLENBQUM7QUFDbEMsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQy9DLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNyRCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUVMLFNBQVMsRUFDVCx1QkFBdUIsRUFDdkIsaUJBQWlCLEVBQ2pCLFNBQVMsRUFDVCxZQUFZLEVBQ1osZUFBZSxFQUNmLFNBQVMsRUFDVCxVQUFVLEVBQ1YsZUFBZSxFQUNmLFlBQVksRUFDWixNQUFNLEVBQ04sS0FBSyxFQUdMLGVBQWUsRUFHZixRQUFRLEVBQ1IsTUFBTSxFQUNOLFNBQVMsRUFDVCxRQUFRLEVBR1IsU0FBUyxFQUNULGdCQUFnQixFQUNoQixpQkFBaUIsR0FDbEIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUNMLGVBQWUsRUFDZixZQUFZLEVBRVosRUFBRSxJQUFJLFlBQVksRUFDbEIsT0FBTyxHQUVSLE1BQU0sTUFBTSxDQUFDO0FBQ2QsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDcEMsT0FBTyxFQUFDLHdCQUF3QixFQUFFLDBCQUEwQixFQUFDLE1BQU0sNkJBQTZCLENB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LElBQUksRUFBQztnQkFNVSxrQkFBa0I7c0JBQXJFLGVBQWU7dUJBQUMsWUFBWSxFQUFFLEVBQUMsV0FBVyxFQUFFLElBQUksRUFBQztnQkFHRCxlQUFlO3NCQUEvRCxlQUFlO3VCQUFDLFNBQVMsRUFBRSxFQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUM7Z0JBTS9DLHFCQUFxQjtzQkFIcEIsZUFBZTt1QkFBQyxlQUFlLEVBQUU7d0JBQ2hDLFdBQVcsRUFBRSxJQUFJO3FCQUNsQjtnQkFPRCxxQkFBcUI7c0JBSHBCLGVBQWU7dUJBQUMsZUFBZSxFQUFFO3dCQUNoQyxXQUFXLEVBQUUsSUFBSTtxQkFDbEI7Z0JBSTJCLFVBQVU7c0JBQXJDLFlBQVk7dUJBQUMsWUFBWTs7QUE4eUI1QiwrRkFBK0Y7QUFDL0YsU0FBUyxnQkFBZ0IsQ0FBSSxLQUFVLEVBQUUsR0FBVztJQUNsRCxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3ZDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3Rpb24sIERpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge0Jvb2xlYW5JbnB1dCwgY29lcmNlQm9vbGVhblByb3BlcnR5fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtcbiAgQ29sbGVjdGlvblZpZXdlcixcbiAgRGF0YVNvdXJjZSxcbiAgX0Rpc3Bvc2VWaWV3UmVwZWF0ZXJTdHJhdGVneSxcbiAgX1JlY3ljbGVWaWV3UmVwZWF0ZXJTdHJhdGVneSxcbiAgaXNEYXRhU291cmNlLFxuICBfVklFV19SRVBFQVRFUl9TVFJBVEVHWSxcbiAgX1ZpZXdSZXBlYXRlcixcbiAgX1ZpZXdSZXBlYXRlckl0ZW1DaGFuZ2UsXG4gIF9WaWV3UmVwZWF0ZXJJdGVtSW5zZXJ0QXJncyxcbiAgX1ZpZXdSZXBlYXRlck9wZXJhdGlvbixcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvbGxlY3Rpb25zJztcbmltcG9ydCB7UGxhdGZvcm19IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge1ZpZXdwb3J0UnVsZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9zY3JvbGxpbmcnO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7XG4gIEFmdGVyQ29udGVudENoZWNrZWQsXG4gIEF0dHJpYnV0ZSxcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBDb21wb25lbnQsXG4gIENvbnRlbnRDaGlsZCxcbiAgQ29udGVudENoaWxkcmVuLFxuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEVtYmVkZGVkVmlld1JlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBJbmplY3QsXG4gIElucHV0LFxuICBJdGVyYWJsZUNoYW5nZVJlY29yZCxcbiAgSXRlcmFibGVEaWZmZXIsXG4gIEl0ZXJhYmxlRGlmZmVycyxcbiAgT25EZXN0cm95LFxuICBPbkluaXQsXG4gIE9wdGlvbmFsLFxuICBPdXRwdXQsXG4gIFF1ZXJ5TGlzdCxcbiAgU2tpcFNlbGYsXG4gIFRlbXBsYXRlUmVmLFxuICBUcmFja0J5RnVuY3Rpb24sXG4gIFZpZXdDaGlsZCxcbiAgVmlld0NvbnRhaW5lclJlZixcbiAgVmlld0VuY2Fwc3VsYXRpb24sXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtcbiAgQmVoYXZpb3JTdWJqZWN0LFxuICBpc09ic2VydmFibGUsXG4gIE9ic2VydmFibGUsXG4gIG9mIGFzIG9ic2VydmFibGVPZixcbiAgU3ViamVjdCxcbiAgU3Vic2NyaXB0aW9uLFxufSBmcm9tICdyeGpzJztcbmltcG9ydCB7dGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge0Nka0NvbHVtbkRlZn0gZnJvbSAnLi9jZWxsJztcbmltcG9ydCB7X0NvYWxlc2NlZFN0eWxlU2NoZWR1bGVyLCBfQ09BTEVTQ0VEX1NUWUxFX1NDSEVEVUxFUn0gZnJvbSAnLi9jb2FsZXNjZWQtc3R5bGUtc2NoZWR1bGVyJztcbmltcG9ydCB7XG4gIEJhc2VSb3dEZWYsXG4gIENka0NlbGxPdXRsZXQsXG4gIENka0NlbGxPdXRsZXRNdWx0aVJvd0NvbnRleHQsXG4gIENka0NlbGxPdXRsZXRSb3dDb250ZXh0LFxuICBDZGtGb290ZXJSb3dEZWYsXG4gIENka0hlYWRlclJvd0RlZixcbiAgQ2RrTm9EYXRhUm93LFxuICBDZGtSb3dEZWYsXG59IGZyb20gJy4vcm93JztcbmltcG9ydCB7U3RpY2t5U3R5bGVyfSBmcm9tICcuL3N0aWNreS1zdHlsZXInO1xuaW1wb3J0IHtcbiAgZ2V0VGFibGVEdXBsaWNhdGVDb2x1bW5OYW1lRXJyb3IsXG4gIGdldFRhYmxlTWlzc2luZ01hdGNoaW5nUm93RGVmRXJyb3IsXG4gIGdldFRhYmxlTWlzc2luZ1Jvd0RlZnNFcnJvcixcbiAgZ2V0VGFibGVNdWx0aXBsZURlZmF1bHRSb3dEZWZzRXJyb3IsXG4gIGdldFRhYmxlVW5rbm93bkNvbHVtbkVycm9yLFxuICBnZXRUYWJsZVVua25vd25EYXRhU291cmNlRXJyb3IsXG59IGZyb20gJy4vdGFibGUtZXJyb3JzJztcbmltcG9ydCB7U1RJQ0tZX1BPU0lUSU9OSU5HX0xJU1RFTkVSLCBTdGlja3lQb3NpdGlvbmluZ0xpc3RlbmVyfSBmcm9tICcuL3N0aWNreS1wb3NpdGlvbi1saXN0ZW5lcic7XG5pbXBvcnQge0NES19UQUJMRX0gZnJvbSAnLi90b2tlbnMnO1xuXG4vKipcbiAqIEVuYWJsZXMgdGhlIHJlY3ljbGUgdmlldyByZXBlYXRlciBzdHJhdGVneSwgd2hpY2ggcmVkdWNlcyByZW5kZXJpbmcgbGF0ZW5jeS4gTm90IGNvbXBhdGlibGUgd2l0aFxuICogdGFibGVzIHRoYXQgYW5pbWF0ZSByb3dzLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdjZGstdGFibGVbcmVjeWNsZVJvd3NdLCB0YWJsZVtjZGstdGFibGVdW3JlY3ljbGVSb3dzXScsXG4gIHByb3ZpZGVyczogW3twcm92aWRlOiBfVklFV19SRVBFQVRFUl9TVFJBVEVHWSwgdXNlQ2xhc3M6IF9SZWN5Y2xlVmlld1JlcGVhdGVyU3RyYXRlZ3l9XSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrUmVjeWNsZVJvd3Mge31cblxuLyoqIEludGVyZmFjZSB1c2VkIHRvIHByb3ZpZGUgYW4gb3V0bGV0IGZvciByb3dzIHRvIGJlIGluc2VydGVkIGludG8uICovXG5leHBvcnQgaW50ZXJmYWNlIFJvd091dGxldCB7XG4gIHZpZXdDb250YWluZXI6IFZpZXdDb250YWluZXJSZWY7XG59XG5cbi8qKlxuICogVW5pb24gb2YgdGhlIHR5cGVzIHRoYXQgY2FuIGJlIHNldCBhcyB0aGUgZGF0YSBzb3VyY2UgZm9yIGEgYENka1RhYmxlYC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xudHlwZSBDZGtUYWJsZURhdGFTb3VyY2VJbnB1dDxUPiA9IHJlYWRvbmx5IFRbXSB8IERhdGFTb3VyY2U8VD4gfCBPYnNlcnZhYmxlPHJlYWRvbmx5IFRbXT47XG5cbi8qKlxuICogUHJvdmlkZXMgYSBoYW5kbGUgZm9yIHRoZSB0YWJsZSB0byBncmFiIHRoZSB2aWV3IGNvbnRhaW5lcidzIG5nLWNvbnRhaW5lciB0byBpbnNlcnQgZGF0YSByb3dzLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5ARGlyZWN0aXZlKHtzZWxlY3RvcjogJ1tyb3dPdXRsZXRdJ30pXG5leHBvcnQgY2xhc3MgRGF0YVJvd091dGxldCBpbXBsZW1lbnRzIFJvd091dGxldCB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyB2aWV3Q29udGFpbmVyOiBWaWV3Q29udGFpbmVyUmVmLCBwdWJsaWMgZWxlbWVudFJlZjogRWxlbWVudFJlZikge31cbn1cblxuLyoqXG4gKiBQcm92aWRlcyBhIGhhbmRsZSBmb3IgdGhlIHRhYmxlIHRvIGdyYWIgdGhlIHZpZXcgY29udGFpbmVyJ3MgbmctY29udGFpbmVyIHRvIGluc2VydCB0aGUgaGVhZGVyLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5ARGlyZWN0aXZlKHtzZWxlY3RvcjogJ1toZWFkZXJSb3dPdXRsZXRdJ30pXG5leHBvcnQgY2xhc3MgSGVhZGVyUm93T3V0bGV0IGltcGxlbWVudHMgUm93T3V0bGV0IHtcbiAgY29uc3RydWN0b3IocHVibGljIHZpZXdDb250YWluZXI6IFZpZXdDb250YWluZXJSZWYsIHB1YmxpYyBlbGVtZW50UmVmOiBFbGVtZW50UmVmKSB7fVxufVxuXG4vKipcbiAqIFByb3ZpZGVzIGEgaGFuZGxlIGZvciB0aGUgdGFibGUgdG8gZ3JhYiB0aGUgdmlldyBjb250YWluZXIncyBuZy1jb250YWluZXIgdG8gaW5zZXJ0IHRoZSBmb290ZXIuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbkBEaXJlY3RpdmUoe3NlbGVjdG9yOiAnW2Zvb3RlclJvd091dGxldF0nfSlcbmV4cG9ydCBjbGFzcyBGb290ZXJSb3dPdXRsZXQgaW1wbGVtZW50cyBSb3dPdXRsZXQge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgdmlld0NvbnRhaW5lcjogVmlld0NvbnRhaW5lclJlZiwgcHVibGljIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHt9XG59XG5cbi8qKlxuICogUHJvdmlkZXMgYSBoYW5kbGUgZm9yIHRoZSB0YWJsZSB0byBncmFiIHRoZSB2aWV3XG4gKiBjb250YWluZXIncyBuZy1jb250YWluZXIgdG8gaW5zZXJ0IHRoZSBubyBkYXRhIHJvdy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuQERpcmVjdGl2ZSh7c2VsZWN0b3I6ICdbbm9EYXRhUm93T3V0bGV0XSd9KVxuZXhwb3J0IGNsYXNzIE5vRGF0YVJvd091dGxldCBpbXBsZW1lbnRzIFJvd091dGxldCB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyB2aWV3Q29udGFpbmVyOiBWaWV3Q29udGFpbmVyUmVmLCBwdWJsaWMgZWxlbWVudFJlZjogRWxlbWVudFJlZikge31cbn1cblxuLyoqXG4gKiBUaGUgdGFibGUgdGVtcGxhdGUgdGhhdCBjYW4gYmUgdXNlZCBieSB0aGUgbWF0LXRhYmxlLiBTaG91bGQgbm90IGJlIHVzZWQgb3V0c2lkZSBvZiB0aGVcbiAqIG1hdGVyaWFsIGxpYnJhcnkuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBjb25zdCBDREtfVEFCTEVfVEVNUExBVEUgPVxuICAvLyBOb3RlIHRoYXQgYWNjb3JkaW5nIHRvIE1ETiwgdGhlIGBjYXB0aW9uYCBlbGVtZW50IGhhcyB0byBiZSBwcm9qZWN0ZWQgYXMgdGhlICoqZmlyc3QqKlxuICAvLyBlbGVtZW50IGluIHRoZSB0YWJsZS4gU2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUTUwvRWxlbWVudC9jYXB0aW9uXG4gIGBcbiAgPG5nLWNvbnRlbnQgc2VsZWN0PVwiY2FwdGlvblwiPjwvbmctY29udGVudD5cbiAgPG5nLWNvbnRlbnQgc2VsZWN0PVwiY29sZ3JvdXAsIGNvbFwiPjwvbmctY29udGVudD5cbiAgPG5nLWNvbnRhaW5lciBoZWFkZXJSb3dPdXRsZXQ+PC9uZy1jb250YWluZXI+XG4gIDxuZy1jb250YWluZXIgcm93T3V0bGV0PjwvbmctY29udGFpbmVyPlxuICA8bmctY29udGFpbmVyIG5vRGF0YVJvd091dGxldD48L25nLWNvbnRhaW5lcj5cbiAgPG5nLWNvbnRhaW5lciBmb290ZXJSb3dPdXRsZXQ+PC9uZy1jb250YWluZXI+XG5gO1xuXG4vKipcbiAqIEludGVyZmFjZSB1c2VkIHRvIGNvbnZlbmllbnRseSB0eXBlIHRoZSBwb3NzaWJsZSBjb250ZXh0IGludGVyZmFjZXMgZm9yIHRoZSByZW5kZXIgcm93LlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJvd0NvbnRleHQ8VD5cbiAgZXh0ZW5kcyBDZGtDZWxsT3V0bGV0TXVsdGlSb3dDb250ZXh0PFQ+LFxuICAgIENka0NlbGxPdXRsZXRSb3dDb250ZXh0PFQ+IHt9XG5cbi8qKlxuICogQ2xhc3MgdXNlZCB0byBjb252ZW5pZW50bHkgdHlwZSB0aGUgZW1iZWRkZWQgdmlldyByZWYgZm9yIHJvd3Mgd2l0aCBhIGNvbnRleHQuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmFic3RyYWN0IGNsYXNzIFJvd1ZpZXdSZWY8VD4gZXh0ZW5kcyBFbWJlZGRlZFZpZXdSZWY8Um93Q29udGV4dDxUPj4ge31cblxuLyoqXG4gKiBTZXQgb2YgcHJvcGVydGllcyB0aGF0IHJlcHJlc2VudHMgdGhlIGlkZW50aXR5IG9mIGEgc2luZ2xlIHJlbmRlcmVkIHJvdy5cbiAqXG4gKiBXaGVuIHRoZSB0YWJsZSBuZWVkcyB0byBkZXRlcm1pbmUgdGhlIGxpc3Qgb2Ygcm93cyB0byByZW5kZXIsIGl0IHdpbGwgZG8gc28gYnkgaXRlcmF0aW5nIHRocm91Z2hcbiAqIGVhY2ggZGF0YSBvYmplY3QgYW5kIGV2YWx1YXRpbmcgaXRzIGxpc3Qgb2Ygcm93IHRlbXBsYXRlcyB0byBkaXNwbGF5ICh3aGVuIG11bHRpVGVtcGxhdGVEYXRhUm93c1xuICogaXMgZmFsc2UsIHRoZXJlIGlzIG9ubHkgb25lIHRlbXBsYXRlIHBlciBkYXRhIG9iamVjdCkuIEZvciBlYWNoIHBhaXIgb2YgZGF0YSBvYmplY3QgYW5kIHJvd1xuICogdGVtcGxhdGUsIGEgYFJlbmRlclJvd2AgaXMgYWRkZWQgdG8gdGhlIGxpc3Qgb2Ygcm93cyB0byByZW5kZXIuIElmIHRoZSBkYXRhIG9iamVjdCBhbmQgcm93XG4gKiB0ZW1wbGF0ZSBwYWlyIGhhcyBhbHJlYWR5IGJlZW4gcmVuZGVyZWQsIHRoZSBwcmV2aW91c2x5IHVzZWQgYFJlbmRlclJvd2AgaXMgYWRkZWQ7IGVsc2UgYSBuZXdcbiAqIGBSZW5kZXJSb3dgIGlzICogY3JlYXRlZC4gT25jZSB0aGUgbGlzdCBpcyBjb21wbGV0ZSBhbmQgYWxsIGRhdGEgb2JqZWN0cyBoYXZlIGJlZW4gaXRlcmVhdGVkXG4gKiB0aHJvdWdoLCBhIGRpZmYgaXMgcGVyZm9ybWVkIHRvIGRldGVybWluZSB0aGUgY2hhbmdlcyB0aGF0IG5lZWQgdG8gYmUgbWFkZSB0byB0aGUgcmVuZGVyZWQgcm93cy5cbiAqXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUmVuZGVyUm93PFQ+IHtcbiAgZGF0YTogVDtcbiAgZGF0YUluZGV4OiBudW1iZXI7XG4gIHJvd0RlZjogQ2RrUm93RGVmPFQ+O1xufVxuXG4vKipcbiAqIEEgZGF0YSB0YWJsZSB0aGF0IGNhbiByZW5kZXIgYSBoZWFkZXIgcm93LCBkYXRhIHJvd3MsIGFuZCBhIGZvb3RlciByb3cuXG4gKiBVc2VzIHRoZSBkYXRhU291cmNlIGlucHV0IHRvIGRldGVybWluZSB0aGUgZGF0YSB0byBiZSByZW5kZXJlZC4gVGhlIGRhdGEgY2FuIGJlIHByb3ZpZGVkIGVpdGhlclxuICogYXMgYSBkYXRhIGFycmF5LCBhbiBPYnNlcnZhYmxlIHN0cmVhbSB0aGF0IGVtaXRzIHRoZSBkYXRhIGFycmF5IHRvIHJlbmRlciwgb3IgYSBEYXRhU291cmNlIHdpdGggYVxuICogY29ubmVjdCBmdW5jdGlvbiB0aGF0IHdpbGwgcmV0dXJuIGFuIE9ic2VydmFibGUgc3RyZWFtIHRoYXQgZW1pdHMgdGhlIGRhdGEgYXJyYXkgdG8gcmVuZGVyLlxuICovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdjZGstdGFibGUsIHRhYmxlW2Nkay10YWJsZV0nLFxuICBleHBvcnRBczogJ2Nka1RhYmxlJyxcbiAgdGVtcGxhdGU6IENES19UQUJMRV9URU1QTEFURSxcbiAgc3R5bGVVcmxzOiBbJ3RhYmxlLmNzcyddLFxuICBob3N0OiB7XG4gICAgJ2NsYXNzJzogJ2Nkay10YWJsZScsXG4gICAgJ1tjbGFzcy5jZGstdGFibGUtZml4ZWQtbGF5b3V0XSc6ICdmaXhlZExheW91dCcsXG4gIH0sXG4gIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsXG4gIC8vIFRoZSBcIk9uUHVzaFwiIHN0YXR1cyBmb3IgdGhlIGBNYXRUYWJsZWAgY29tcG9uZW50IGlzIGVmZmVjdGl2ZWx5IGEgbm9vcCwgc28gd2UgYXJlIHJlbW92aW5nIGl0LlxuICAvLyBUaGUgdmlldyBmb3IgYE1hdFRhYmxlYCBjb25zaXN0cyBlbnRpcmVseSBvZiB0ZW1wbGF0ZXMgZGVjbGFyZWQgaW4gb3RoZXIgdmlld3MuIEFzIHRoZXkgYXJlXG4gIC8vIGRlY2xhcmVkIGVsc2V3aGVyZSwgdGhleSBhcmUgY2hlY2tlZCB3aGVuIHRoZWlyIGRlY2xhcmF0aW9uIHBvaW50cyBhcmUgY2hlY2tlZC5cbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOnZhbGlkYXRlLWRlY29yYXRvcnNcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5EZWZhdWx0LFxuICBwcm92aWRlcnM6IFtcbiAgICB7cHJvdmlkZTogQ0RLX1RBQkxFLCB1c2VFeGlzdGluZzogQ2RrVGFibGV9LFxuICAgIHtwcm92aWRlOiBfVklFV19SRVBFQVRFUl9TVFJBVEVHWSwgdXNlQ2xhc3M6IF9EaXNwb3NlVmlld1JlcGVhdGVyU3RyYXRlZ3l9LFxuICAgIHtwcm92aWRlOiBfQ09BTEVTQ0VEX1NUWUxFX1NDSEVEVUxFUiwgdXNlQ2xhc3M6IF9Db2FsZXNjZWRTdHlsZVNjaGVkdWxlcn0sXG4gICAgLy8gUHJldmVudCBuZXN0ZWQgdGFibGVzIGZyb20gc2VlaW5nIHRoaXMgdGFibGUncyBTdGlja3lQb3NpdGlvbmluZ0xpc3RlbmVyLlxuICAgIHtwcm92aWRlOiBTVElDS1lfUE9TSVRJT05JTkdfTElTVEVORVIsIHVzZVZhbHVlOiBudWxsfSxcbiAgXSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrVGFibGU8VD4gaW1wbGVtZW50cyBBZnRlckNvbnRlbnRDaGVja2VkLCBDb2xsZWN0aW9uVmlld2VyLCBPbkRlc3Ryb3ksIE9uSW5pdCB7XG4gIHByaXZhdGUgX2RvY3VtZW50OiBEb2N1bWVudDtcblxuICAvKiogTGF0ZXN0IGRhdGEgcHJvdmlkZWQgYnkgdGhlIGRhdGEgc291cmNlLiAqL1xuICBwcm90ZWN0ZWQgX2RhdGE6IHJlYWRvbmx5IFRbXTtcblxuICAvKiogU3ViamVjdCB0aGF0IGVtaXRzIHdoZW4gdGhlIGNvbXBvbmVudCBoYXMgYmVlbiBkZXN0cm95ZWQuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX29uRGVzdHJveSA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIExpc3Qgb2YgdGhlIHJlbmRlcmVkIHJvd3MgYXMgaWRlbnRpZmllZCBieSB0aGVpciBgUmVuZGVyUm93YCBvYmplY3QuICovXG4gIHByaXZhdGUgX3JlbmRlclJvd3M6IFJlbmRlclJvdzxUPltdO1xuXG4gIC8qKiBTdWJzY3JpcHRpb24gdGhhdCBsaXN0ZW5zIGZvciB0aGUgZGF0YSBwcm92aWRlZCBieSB0aGUgZGF0YSBzb3VyY2UuICovXG4gIHByaXZhdGUgX3JlbmRlckNoYW5nZVN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uIHwgbnVsbDtcblxuICAvKipcbiAgICogTWFwIG9mIGFsbCB0aGUgdXNlcidzIGRlZmluZWQgY29sdW1ucyAoaGVhZGVyLCBkYXRhLCBhbmQgZm9vdGVyIGNlbGwgdGVtcGxhdGUpIGlkZW50aWZpZWQgYnlcbiAgICogbmFtZS4gQ29sbGVjdGlvbiBwb3B1bGF0ZWQgYnkgdGhlIGNvbHVtbiBkZWZpbml0aW9ucyBnYXRoZXJlZCBieSBgQ29udGVudENoaWxkcmVuYCBhcyB3ZWxsIGFzXG4gICAqIGFueSBjdXN0b20gY29sdW1uIGRlZmluaXRpb25zIGFkZGVkIHRvIGBfY3VzdG9tQ29sdW1uRGVmc2AuXG4gICAqL1xuICBwcml2YXRlIF9jb2x1bW5EZWZzQnlOYW1lID0gbmV3IE1hcDxzdHJpbmcsIENka0NvbHVtbkRlZj4oKTtcblxuICAvKipcbiAgICogU2V0IG9mIGFsbCByb3cgZGVmaW5pdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCBieSB0aGlzIHRhYmxlLiBQb3B1bGF0ZWQgYnkgdGhlIHJvd3MgZ2F0aGVyZWQgYnlcbiAgICogdXNpbmcgYENvbnRlbnRDaGlsZHJlbmAgYXMgd2VsbCBhcyBhbnkgY3VzdG9tIHJvdyBkZWZpbml0aW9ucyBhZGRlZCB0byBgX2N1c3RvbVJvd0RlZnNgLlxuICAgKi9cbiAgcHJpdmF0ZSBfcm93RGVmczogQ2RrUm93RGVmPFQ+W107XG5cbiAgLyoqXG4gICAqIFNldCBvZiBhbGwgaGVhZGVyIHJvdyBkZWZpbml0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIGJ5IHRoaXMgdGFibGUuIFBvcHVsYXRlZCBieSB0aGUgcm93c1xuICAgKiBnYXRoZXJlZCBieSB1c2luZyBgQ29udGVudENoaWxkcmVuYCBhcyB3ZWxsIGFzIGFueSBjdXN0b20gcm93IGRlZmluaXRpb25zIGFkZGVkIHRvXG4gICAqIGBfY3VzdG9tSGVhZGVyUm93RGVmc2AuXG4gICAqL1xuICBwcml2YXRlIF9oZWFkZXJSb3dEZWZzOiBDZGtIZWFkZXJSb3dEZWZbXTtcblxuICAvKipcbiAgICogU2V0IG9mIGFsbCByb3cgZGVmaW5pdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCBieSB0aGlzIHRhYmxlLiBQb3B1bGF0ZWQgYnkgdGhlIHJvd3MgZ2F0aGVyZWQgYnlcbiAgICogdXNpbmcgYENvbnRlbnRDaGlsZHJlbmAgYXMgd2VsbCBhcyBhbnkgY3VzdG9tIHJvdyBkZWZpbml0aW9ucyBhZGRlZCB0b1xuICAgKiBgX2N1c3RvbUZvb3RlclJvd0RlZnNgLlxuICAgKi9cbiAgcHJpdmF0ZSBfZm9vdGVyUm93RGVmczogQ2RrRm9vdGVyUm93RGVmW107XG5cbiAgLyoqIERpZmZlciB1c2VkIHRvIGZpbmQgdGhlIGNoYW5nZXMgaW4gdGhlIGRhdGEgcHJvdmlkZWQgYnkgdGhlIGRhdGEgc291cmNlLiAqL1xuICBwcml2YXRlIF9kYXRhRGlmZmVyOiBJdGVyYWJsZURpZmZlcjxSZW5kZXJSb3c8VD4+O1xuXG4gIC8qKiBTdG9yZXMgdGhlIHJvdyBkZWZpbml0aW9uIHRoYXQgZG9lcyBub3QgaGF2ZSBhIHdoZW4gcHJlZGljYXRlLiAqL1xuICBwcml2YXRlIF9kZWZhdWx0Um93RGVmOiBDZGtSb3dEZWY8VD4gfCBudWxsO1xuXG4gIC8qKlxuICAgKiBDb2x1bW4gZGVmaW5pdGlvbnMgdGhhdCB3ZXJlIGRlZmluZWQgb3V0c2lkZSBvZiB0aGUgZGlyZWN0IGNvbnRlbnQgY2hpbGRyZW4gb2YgdGhlIHRhYmxlLlxuICAgKiBUaGVzZSB3aWxsIGJlIGRlZmluZWQgd2hlbiwgZS5nLiwgY3JlYXRpbmcgYSB3cmFwcGVyIGFyb3VuZCB0aGUgY2RrVGFibGUgdGhhdCBoYXNcbiAgICogY29sdW1uIGRlZmluaXRpb25zIGFzICppdHMqIGNvbnRlbnQgY2hpbGQuXG4gICAqL1xuICBwcml2YXRlIF9jdXN0b21Db2x1bW5EZWZzID0gbmV3IFNldDxDZGtDb2x1bW5EZWY+KCk7XG5cbiAgLyoqXG4gICAqIERhdGEgcm93IGRlZmluaXRpb25zIHRoYXQgd2VyZSBkZWZpbmVkIG91dHNpZGUgb2YgdGhlIGRpcmVjdCBjb250ZW50IGNoaWxkcmVuIG9mIHRoZSB0YWJsZS5cbiAgICogVGhlc2Ugd2lsbCBiZSBkZWZpbmVkIHdoZW4sIGUuZy4sIGNyZWF0aW5nIGEgd3JhcHBlciBhcm91bmQgdGhlIGNka1RhYmxlIHRoYXQgaGFzXG4gICAqIGJ1aWx0LWluIGRhdGEgcm93cyBhcyAqaXRzKiBjb250ZW50IGNoaWxkLlxuICAgKi9cbiAgcHJpdmF0ZSBfY3VzdG9tUm93RGVmcyA9IG5ldyBTZXQ8Q2RrUm93RGVmPFQ+PigpO1xuXG4gIC8qKlxuICAgKiBIZWFkZXIgcm93IGRlZmluaXRpb25zIHRoYXQgd2VyZSBkZWZpbmVkIG91dHNpZGUgb2YgdGhlIGRpcmVjdCBjb250ZW50IGNoaWxkcmVuIG9mIHRoZSB0YWJsZS5cbiAgICogVGhlc2Ugd2lsbCBiZSBkZWZpbmVkIHdoZW4sIGUuZy4sIGNyZWF0aW5nIGEgd3JhcHBlciBhcm91bmQgdGhlIGNka1RhYmxlIHRoYXQgaGFzXG4gICAqIGJ1aWx0LWluIGhlYWRlciByb3dzIGFzICppdHMqIGNvbnRlbnQgY2hpbGQuXG4gICAqL1xuICBwcml2YXRlIF9jdXN0b21IZWFkZXJSb3dEZWZzID0gbmV3IFNldDxDZGtIZWFkZXJSb3dEZWY+KCk7XG5cbiAgLyoqXG4gICAqIEZvb3RlciByb3cgZGVmaW5pdGlvbnMgdGhhdCB3ZXJlIGRlZmluZWQgb3V0c2lkZSBvZiB0aGUgZGlyZWN0IGNvbnRlbnQgY2hpbGRyZW4gb2YgdGhlIHRhYmxlLlxuICAgKiBUaGVzZSB3aWxsIGJlIGRlZmluZWQgd2hlbiwgZS5nLiwgY3JlYXRpbmcgYSB3cmFwcGVyIGFyb3VuZCB0aGUgY2RrVGFibGUgdGhhdCBoYXMgYVxuICAgKiBidWlsdC1pbiBmb290ZXIgcm93IGFzICppdHMqIGNvbnRlbnQgY2hpbGQuXG4gICAqL1xuICBwcml2YXRlIF9jdXN0b21Gb290ZXJSb3dEZWZzID0gbmV3IFNldDxDZGtGb290ZXJSb3dEZWY+KCk7XG5cbiAgLyoqIE5vIGRhdGEgcm93IHRoYXQgd2FzIGRlZmluZWQgb3V0c2lkZSBvZiB0aGUgZGlyZWN0IGNvbnRlbnQgY2hpbGRyZW4gb2YgdGhlIHRhYmxlLiAqL1xuICBwcml2YXRlIF9jdXN0b21Ob0RhdGFSb3c6IENka05vRGF0YVJvdyB8IG51bGw7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGhlYWRlciByb3cgZGVmaW5pdGlvbiBoYXMgYmVlbiBjaGFuZ2VkLiBUcmlnZ2VycyBhbiB1cGRhdGUgdG8gdGhlIGhlYWRlciByb3cgYWZ0ZXJcbiAgICogY29udGVudCBpcyBjaGVja2VkLiBJbml0aWFsaXplZCBhcyB0cnVlIHNvIHRoYXQgdGhlIHRhYmxlIHJlbmRlcnMgdGhlIGluaXRpYWwgc2V0IG9mIHJvd3MuXG4gICAqL1xuICBwcml2YXRlIF9oZWFkZXJSb3dEZWZDaGFuZ2VkID0gdHJ1ZTtcblxuICAvKipcbiAgICogV2hldGhlciB0aGUgZm9vdGVyIHJvdyBkZWZpbml0aW9uIGhhcyBiZWVuIGNoYW5nZWQuIFRyaWdnZXJzIGFuIHVwZGF0ZSB0byB0aGUgZm9vdGVyIHJvdyBhZnRlclxuICAgKiBjb250ZW50IGlzIGNoZWNrZWQuIEluaXRpYWxpemVkIGFzIHRydWUgc28gdGhhdCB0aGUgdGFibGUgcmVuZGVycyB0aGUgaW5pdGlhbCBzZXQgb2Ygcm93cy5cbiAgICovXG4gIHByaXZhdGUgX2Zvb3RlclJvd0RlZkNoYW5nZWQgPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBzdGlja3kgY29sdW1uIHN0eWxlcyBuZWVkIHRvIGJlIHVwZGF0ZWQuIFNldCB0byBgdHJ1ZWAgd2hlbiB0aGUgdmlzaWJsZSBjb2x1bW5zXG4gICAqIGNoYW5nZS5cbiAgICovXG4gIHByaXZhdGUgX3N0aWNreUNvbHVtblN0eWxlc05lZWRSZXNldCA9IHRydWU7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIHN0aWNreSBzdHlsZXIgc2hvdWxkIHJlY2FsY3VsYXRlIGNlbGwgd2lkdGhzIHdoZW4gYXBwbHlpbmcgc3RpY2t5IHN0eWxlcy4gSWZcbiAgICogYGZhbHNlYCwgY2FjaGVkIHZhbHVlcyB3aWxsIGJlIHVzZWQgaW5zdGVhZC4gVGhpcyBpcyBvbmx5IGFwcGxpY2FibGUgdG8gdGFibGVzIHdpdGhcbiAgICoge0BsaW5rIGZpeGVkTGF5b3V0fSBlbmFibGVkLiBGb3Igb3RoZXIgdGFibGVzLCBjZWxsIHdpZHRocyB3aWxsIGFsd2F5cyBiZSByZWNhbGN1bGF0ZWQuXG4gICAqL1xuICBwcml2YXRlIF9mb3JjZVJlY2FsY3VsYXRlQ2VsbFdpZHRocyA9IHRydWU7XG5cbiAgLyoqXG4gICAqIENhY2hlIG9mIHRoZSBsYXRlc3QgcmVuZGVyZWQgYFJlbmRlclJvd2Agb2JqZWN0cyBhcyBhIG1hcCBmb3IgZWFzeSByZXRyaWV2YWwgd2hlbiBjb25zdHJ1Y3RpbmdcbiAgICogYSBuZXcgbGlzdCBvZiBgUmVuZGVyUm93YCBvYmplY3RzIGZvciByZW5kZXJpbmcgcm93cy4gU2luY2UgdGhlIG5ldyBsaXN0IGlzIGNvbnN0cnVjdGVkIHdpdGhcbiAgICogdGhlIGNhY2hlZCBgUmVuZGVyUm93YCBvYmplY3RzIHdoZW4gcG9zc2libGUsIHRoZSByb3cgaWRlbnRpdHkgaXMgcHJlc2VydmVkIHdoZW4gdGhlIGRhdGFcbiAgICogYW5kIHJvdyB0ZW1wbGF0ZSBtYXRjaGVzLCB3aGljaCBhbGxvd3MgdGhlIGBJdGVyYWJsZURpZmZlcmAgdG8gY2hlY2sgcm93cyBieSByZWZlcmVuY2VcbiAgICogYW5kIHVuZGVyc3RhbmQgd2hpY2ggcm93cyBhcmUgYWRkZWQvbW92ZWQvcmVtb3ZlZC5cbiAgICpcbiAgICogSW1wbGVtZW50ZWQgYXMgYSBtYXAgb2YgbWFwcyB3aGVyZSB0aGUgZmlyc3Qga2V5IGlzIHRoZSBgZGF0YTogVGAgb2JqZWN0IGFuZCB0aGUgc2Vjb25kIGlzIHRoZVxuICAgKiBgQ2RrUm93RGVmPFQ+YCBvYmplY3QuIFdpdGggdGhlIHR3byBrZXlzLCB0aGUgY2FjaGUgcG9pbnRzIHRvIGEgYFJlbmRlclJvdzxUPmAgb2JqZWN0IHRoYXRcbiAgICogY29udGFpbnMgYW4gYXJyYXkgb2YgY3JlYXRlZCBwYWlycy4gVGhlIGFycmF5IGlzIG5lY2Vzc2FyeSB0byBoYW5kbGUgY2FzZXMgd2hlcmUgdGhlIGRhdGFcbiAgICogYXJyYXkgY29udGFpbnMgbXVsdGlwbGUgZHVwbGljYXRlIGRhdGEgb2JqZWN0cyBhbmQgZWFjaCBpbnN0YW50aWF0ZWQgYFJlbmRlclJvd2AgbXVzdCBiZVxuICAgKiBzdG9yZWQuXG4gICAqL1xuICBwcml2YXRlIF9jYWNoZWRSZW5kZXJSb3dzTWFwID0gbmV3IE1hcDxULCBXZWFrTWFwPENka1Jvd0RlZjxUPiwgUmVuZGVyUm93PFQ+W10+PigpO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSB0YWJsZSBpcyBhcHBsaWVkIHRvIGEgbmF0aXZlIGA8dGFibGU+YC4gKi9cbiAgcHJvdGVjdGVkIF9pc05hdGl2ZUh0bWxUYWJsZTogYm9vbGVhbjtcblxuICAvKipcbiAgICogVXRpbGl0eSBjbGFzcyB0aGF0IGlzIHJlc3BvbnNpYmxlIGZvciBhcHBseWluZyB0aGUgYXBwcm9wcmlhdGUgc3RpY2t5IHBvc2l0aW9uaW5nIHN0eWxlcyB0b1xuICAgKiB0aGUgdGFibGUncyByb3dzIGFuZCBjZWxscy5cbiAgICovXG4gIHByaXZhdGUgX3N0aWNreVN0eWxlcjogU3RpY2t5U3R5bGVyO1xuXG4gIC8qKlxuICAgKiBDU1MgY2xhc3MgYWRkZWQgdG8gYW55IHJvdyBvciBjZWxsIHRoYXQgaGFzIHN0aWNreSBwb3NpdGlvbmluZyBhcHBsaWVkLiBNYXkgYmUgb3ZlcnJpZGVuIGJ5XG4gICAqIHRhYmxlIHN1YmNsYXNzZXMuXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RpY2t5Q3NzQ2xhc3M6IHN0cmluZyA9ICdjZGstdGFibGUtc3RpY2t5JztcblxuICAvKipcbiAgICogV2hldGhlciB0byBtYW51YWxseSBhZGQgcG9zaXRvbjogc3RpY2t5IHRvIGFsbCBzdGlja3kgY2VsbCBlbGVtZW50cy4gTm90IG5lZWRlZCBpZlxuICAgKiB0aGUgcG9zaXRpb24gaXMgc2V0IGluIGEgc2VsZWN0b3IgYXNzb2NpYXRlZCB3aXRoIHRoZSB2YWx1ZSBvZiBzdGlja3lDc3NDbGFzcy4gTWF5IGJlXG4gICAqIG92ZXJyaWRkZW4gYnkgdGFibGUgc3ViY2xhc3Nlc1xuICAgKi9cbiAgcHJvdGVjdGVkIG5lZWRzUG9zaXRpb25TdGlja3lPbkVsZW1lbnQgPSB0cnVlO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBubyBkYXRhIHJvdyBpcyBjdXJyZW50bHkgc2hvd2luZyBhbnl0aGluZy4gKi9cbiAgcHJpdmF0ZSBfaXNTaG93aW5nTm9EYXRhUm93ID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIFRyYWNraW5nIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGNoZWNrIHRoZSBkaWZmZXJlbmNlcyBpbiBkYXRhIGNoYW5nZXMuIFVzZWQgc2ltaWxhcmx5XG4gICAqIHRvIGBuZ0ZvcmAgYHRyYWNrQnlgIGZ1bmN0aW9uLiBPcHRpbWl6ZSByb3cgb3BlcmF0aW9ucyBieSBpZGVudGlmeWluZyBhIHJvdyBiYXNlZCBvbiBpdHMgZGF0YVxuICAgKiByZWxhdGl2ZSB0byB0aGUgZnVuY3Rpb24gdG8ga25vdyBpZiBhIHJvdyBzaG91bGQgYmUgYWRkZWQvcmVtb3ZlZC9tb3ZlZC5cbiAgICogQWNjZXB0cyBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgdHdvIHBhcmFtZXRlcnMsIGBpbmRleGAgYW5kIGBpdGVtYC5cbiAgICovXG4gIEBJbnB1dCgpXG4gIGdldCB0cmFja0J5KCk6IFRyYWNrQnlGdW5jdGlvbjxUPiB7XG4gICAgcmV0dXJuIHRoaXMuX3RyYWNrQnlGbjtcbiAgfVxuICBzZXQgdHJhY2tCeShmbjogVHJhY2tCeUZ1bmN0aW9uPFQ+KSB7XG4gICAgaWYgKCh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmIGZuICE9IG51bGwgJiYgdHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjb25zb2xlLndhcm4oYHRyYWNrQnkgbXVzdCBiZSBhIGZ1bmN0aW9uLCBidXQgcmVjZWl2ZWQgJHtKU09OLnN0cmluZ2lmeShmbil9LmApO1xuICAgIH1cbiAgICB0aGlzLl90cmFja0J5Rm4gPSBmbjtcbiAgfVxuICBwcml2YXRlIF90cmFja0J5Rm46IFRyYWNrQnlGdW5jdGlvbjxUPjtcblxuICAvKipcbiAgICogVGhlIHRhYmxlJ3Mgc291cmNlIG9mIGRhdGEsIHdoaWNoIGNhbiBiZSBwcm92aWRlZCBpbiB0aHJlZSB3YXlzIChpbiBvcmRlciBvZiBjb21wbGV4aXR5KTpcbiAgICogICAtIFNpbXBsZSBkYXRhIGFycmF5IChlYWNoIG9iamVjdCByZXByZXNlbnRzIG9uZSB0YWJsZSByb3cpXG4gICAqICAgLSBTdHJlYW0gdGhhdCBlbWl0cyBhIGRhdGEgYXJyYXkgZWFjaCB0aW1lIHRoZSBhcnJheSBjaGFuZ2VzXG4gICAqICAgLSBgRGF0YVNvdXJjZWAgb2JqZWN0IHRoYXQgaW1wbGVtZW50cyB0aGUgY29ubmVjdC9kaXNjb25uZWN0IGludGVyZmFjZS5cbiAgICpcbiAgICogSWYgYSBkYXRhIGFycmF5IGlzIHByb3ZpZGVkLCB0aGUgdGFibGUgbXVzdCBiZSBub3RpZmllZCB3aGVuIHRoZSBhcnJheSdzIG9iamVjdHMgYXJlXG4gICAqIGFkZGVkLCByZW1vdmVkLCBvciBtb3ZlZC4gVGhpcyBjYW4gYmUgZG9uZSBieSBjYWxsaW5nIHRoZSBgcmVuZGVyUm93cygpYCBmdW5jdGlvbiB3aGljaCB3aWxsXG4gICAqIHJlbmRlciB0aGUgZGlmZiBzaW5jZSB0aGUgbGFzdCB0YWJsZSByZW5kZXIuIElmIHRoZSBkYXRhIGFycmF5IHJlZmVyZW5jZSBpcyBjaGFuZ2VkLCB0aGUgdGFibGVcbiAgICogd2lsbCBhdXRvbWF0aWNhbGx5IHRyaWdnZXIgYW4gdXBkYXRlIHRvIHRoZSByb3dzLlxuICAgKlxuICAgKiBXaGVuIHByb3ZpZGluZyBhbiBPYnNlcnZhYmxlIHN0cmVhbSwgdGhlIHRhYmxlIHdpbGwgdHJpZ2dlciBhbiB1cGRhdGUgYXV0b21hdGljYWxseSB3aGVuIHRoZVxuICAgKiBzdHJlYW0gZW1pdHMgYSBuZXcgYXJyYXkgb2YgZGF0YS5cbiAgICpcbiAgICogRmluYWxseSwgd2hlbiBwcm92aWRpbmcgYSBgRGF0YVNvdXJjZWAgb2JqZWN0LCB0aGUgdGFibGUgd2lsbCB1c2UgdGhlIE9ic2VydmFibGUgc3RyZWFtXG4gICAqIHByb3ZpZGVkIGJ5IHRoZSBjb25uZWN0IGZ1bmN0aW9uIGFuZCB0cmlnZ2VyIHVwZGF0ZXMgd2hlbiB0aGF0IHN0cmVhbSBlbWl0cyBuZXcgZGF0YSBhcnJheVxuICAgKiB2YWx1ZXMuIER1cmluZyB0aGUgdGFibGUncyBuZ09uRGVzdHJveSBvciB3aGVuIHRoZSBkYXRhIHNvdXJjZSBpcyByZW1vdmVkIGZyb20gdGhlIHRhYmxlLCB0aGVcbiAgICogdGFibGUgd2lsbCBjYWxsIHRoZSBEYXRhU291cmNlJ3MgYGRpc2Nvbm5lY3RgIGZ1bmN0aW9uIChtYXkgYmUgdXNlZnVsIGZvciBjbGVhbmluZyB1cCBhbnlcbiAgICogc3Vic2NyaXB0aW9ucyByZWdpc3RlcmVkIGR1cmluZyB0aGUgY29ubmVjdCBwcm9jZXNzKS5cbiAgICovXG4gIEBJbnB1dCgpXG4gIGdldCBkYXRhU291cmNlKCk6IENka1RhYmxlRGF0YVNvdXJjZUlucHV0PFQ+IHtcbiAgICByZXR1cm4gdGhpcy5fZGF0YVNvdXJjZTtcbiAgfVxuICBzZXQgZGF0YVNvdXJjZShkYXRhU291cmNlOiBDZGtUYWJsZURhdGFTb3VyY2VJbnB1dDxUPikge1xuICAgIGlmICh0aGlzLl9kYXRhU291cmNlICE9PSBkYXRhU291cmNlKSB7XG4gICAgICB0aGlzLl9zd2l0Y2hEYXRhU291cmNlKGRhdGFTb3VyY2UpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIF9kYXRhU291cmNlOiBDZGtUYWJsZURhdGFTb3VyY2VJbnB1dDxUPjtcblxuICAvKipcbiAgICogV2hldGhlciB0byBhbGxvdyBtdWx0aXBsZSByb3dzIHBlciBkYXRhIG9iamVjdCBieSBldmFsdWF0aW5nIHdoaWNoIHJvd3MgZXZhbHVhdGUgdGhlaXIgJ3doZW4nXG4gICAqIHByZWRpY2F0ZSB0byB0cnVlLiBJZiBgbXVsdGlUZW1wbGF0ZURhdGFSb3dzYCBpcyBmYWxzZSwgd2hpY2ggaXMgdGhlIGRlZmF1bHQgdmFsdWUsIHRoZW4gZWFjaFxuICAgKiBkYXRhb2JqZWN0IHdpbGwgcmVuZGVyIHRoZSBmaXJzdCByb3cgdGhhdCBldmFsdWF0ZXMgaXRzIHdoZW4gcHJlZGljYXRlIHRvIHRydWUsIGluIHRoZSBvcmRlclxuICAgKiBkZWZpbmVkIGluIHRoZSB0YWJsZSwgb3Igb3RoZXJ3aXNlIHRoZSBkZWZhdWx0IHJvdyB3aGljaCBkb2VzIG5vdCBoYXZlIGEgd2hlbiBwcmVkaWNhdGUuXG4gICAqL1xuICBASW5wdXQoKVxuICBnZXQgbXVsdGlUZW1wbGF0ZURhdGFSb3dzKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9tdWx0aVRlbXBsYXRlRGF0YVJvd3M7XG4gIH1cbiAgc2V0IG11bHRpVGVtcGxhdGVEYXRhUm93cyh2OiBCb29sZWFuSW5wdXQpIHtcbiAgICB0aGlzLl9tdWx0aVRlbXBsYXRlRGF0YVJvd3MgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodik7XG5cbiAgICAvLyBJbiBJdnkgaWYgdGhpcyB2YWx1ZSBpcyBzZXQgdmlhIGEgc3RhdGljIGF0dHJpYnV0ZSAoZS5nLiA8dGFibGUgbXVsdGlUZW1wbGF0ZURhdGFSb3dzPiksXG4gICAgLy8gdGhpcyBzZXR0ZXIgd2lsbCBiZSBpbnZva2VkIGJlZm9yZSB0aGUgcm93IG91dGxldCBoYXMgYmVlbiBkZWZpbmVkIGhlbmNlIHRoZSBudWxsIGNoZWNrLlxuICAgIGlmICh0aGlzLl9yb3dPdXRsZXQgJiYgdGhpcy5fcm93T3V0bGV0LnZpZXdDb250YWluZXIubGVuZ3RoKSB7XG4gICAgICB0aGlzLl9mb3JjZVJlbmRlckRhdGFSb3dzKCk7XG4gICAgICB0aGlzLnVwZGF0ZVN0aWNreUNvbHVtblN0eWxlcygpO1xuICAgIH1cbiAgfVxuICBfbXVsdGlUZW1wbGF0ZURhdGFSb3dzOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdG8gdXNlIGEgZml4ZWQgdGFibGUgbGF5b3V0LiBFbmFibGluZyB0aGlzIG9wdGlvbiB3aWxsIGVuZm9yY2UgY29uc2lzdGVudCBjb2x1bW4gd2lkdGhzXG4gICAqIGFuZCBvcHRpbWl6ZSByZW5kZXJpbmcgc3RpY2t5IHN0eWxlcyBmb3IgbmF0aXZlIHRhYmxlcy4gTm8tb3AgZm9yIGZsZXggdGFibGVzLlxuICAgKi9cbiAgQElucHV0KClcbiAgZ2V0IGZpeGVkTGF5b3V0KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9maXhlZExheW91dDtcbiAgfVxuICBzZXQgZml4ZWRMYXlvdXQodjogQm9vbGVhbklucHV0KSB7XG4gICAgdGhpcy5fZml4ZWRMYXlvdXQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodik7XG5cbiAgICAvLyBUb2dnbGluZyBgZml4ZWRMYXlvdXRgIG1heSBjaGFuZ2UgY29sdW1uIHdpZHRocy4gU3RpY2t5IGNvbHVtbiBzdHlsZXMgc2hvdWxkIGJlIHJlY2FsY3VsYXRlZC5cbiAgICB0aGlzLl9mb3JjZVJlY2FsY3VsYXRlQ2VsbFdpZHRocyA9IHRydWU7XG4gICAgdGhpcy5fc3RpY2t5Q29sdW1uU3R5bGVzTmVlZFJlc2V0ID0gdHJ1ZTtcbiAgfVxuICBwcml2YXRlIF9maXhlZExheW91dDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB3aGVuIHRoZSB0YWJsZSBjb21wbGV0ZXMgcmVuZGVyaW5nIGEgc2V0IG9mIGRhdGEgcm93cyBiYXNlZCBvbiB0aGUgbGF0ZXN0IGRhdGEgZnJvbSB0aGVcbiAgICogZGF0YSBzb3VyY2UsIGV2ZW4gaWYgdGhlIHNldCBvZiByb3dzIGlzIGVtcHR5LlxuICAgKi9cbiAgQE91dHB1dCgpXG4gIHJlYWRvbmx5IGNvbnRlbnRDaGFuZ2VkID0gbmV3IEV2ZW50RW1pdHRlcjx2b2lkPigpO1xuXG4gIC8vIFRPRE8oYW5kcmV3c2VndWluKTogUmVtb3ZlIG1heCB2YWx1ZSBhcyB0aGUgZW5kIGluZGV4XG4gIC8vICAgYW5kIGluc3RlYWQgY2FsY3VsYXRlIHRoZSB2aWV3IG9uIGluaXQgYW5kIHNjcm9sbC5cbiAgLyoqXG4gICAqIFN0cmVhbSBjb250YWluaW5nIHRoZSBsYXRlc3QgaW5mb3JtYXRpb24gb24gd2hhdCByb3dzIGFyZSBiZWluZyBkaXNwbGF5ZWQgb24gc2NyZWVuLlxuICAgKiBDYW4gYmUgdXNlZCBieSB0aGUgZGF0YSBzb3VyY2UgdG8gYXMgYSBoZXVyaXN0aWMgb2Ygd2hhdCBkYXRhIHNob3VsZCBiZSBwcm92aWRlZC5cbiAgICpcbiAgICogQGRvY3MtcHJpdmF0ZVxuICAgKi9cbiAgcmVhZG9ubHkgdmlld0NoYW5nZSA9IG5ldyBCZWhhdmlvclN1YmplY3Q8e3N0YXJ0OiBudW1iZXI7IGVuZDogbnVtYmVyfT4oe1xuICAgIHN0YXJ0OiAwLFxuICAgIGVuZDogTnVtYmVyLk1BWF9WQUxVRSxcbiAgfSk7XG5cbiAgLy8gT3V0bGV0cyBpbiB0aGUgdGFibGUncyB0ZW1wbGF0ZSB3aGVyZSB0aGUgaGVhZGVyLCBkYXRhIHJvd3MsIGFuZCBmb290ZXIgd2lsbCBiZSBpbnNlcnRlZC5cbiAgQFZpZXdDaGlsZChEYXRhUm93T3V0bGV0LCB7c3RhdGljOiB0cnVlfSkgX3Jvd091dGxldDogRGF0YVJvd091dGxldDtcbiAgQFZpZXdDaGlsZChIZWFkZXJSb3dPdXRsZXQsIHtzdGF0aWM6IHRydWV9KSBfaGVhZGVyUm93T3V0bGV0OiBIZWFkZXJSb3dPdXRsZXQ7XG4gIEBWaWV3Q2hpbGQoRm9vdGVyUm93T3V0bGV0LCB7c3RhdGljOiB0cnVlfSkgX2Zvb3RlclJvd091dGxldDogRm9vdGVyUm93T3V0bGV0O1xuICBAVmlld0NoaWxkKE5vRGF0YVJvd091dGxldCwge3N0YXRpYzogdHJ1ZX0pIF9ub0RhdGFSb3dPdXRsZXQ6IE5vRGF0YVJvd091dGxldDtcblxuICAvKipcbiAgICogVGhlIGNvbHVtbiBkZWZpbml0aW9ucyBwcm92aWRlZCBieSB0aGUgdXNlciB0aGF0IGNvbnRhaW4gd2hhdCB0aGUgaGVhZGVyLCBkYXRhLCBhbmQgZm9vdGVyXG4gICAqIGNlbGxzIHNob3VsZCByZW5kZXIgZm9yIGVhY2ggY29sdW1uLlxuICAgKi9cbiAgQENvbnRlbnRDaGlsZHJlbihDZGtDb2x1bW5EZWYsIHtkZXNjZW5kYW50czogdHJ1ZX0pIF9jb250ZW50Q29sdW1uRGVmczogUXVlcnlMaXN0PENka0NvbHVtbkRlZj47XG5cbiAgLyoqIFNldCBvZiBkYXRhIHJvdyBkZWZpbml0aW9ucyB0aGF0IHdlcmUgcHJvdmlkZWQgdG8gdGhlIHRhYmxlIGFzIGNvbnRlbnQgY2hpbGRyZW4uICovXG4gIEBDb250ZW50Q2hpbGRyZW4oQ2RrUm93RGVmLCB7ZGVzY2VuZGFudHM6IHRydWV9KSBfY29udGVudFJvd0RlZnM6IFF1ZXJ5TGlzdDxDZGtSb3dEZWY8VD4+O1xuXG4gIC8qKiBTZXQgb2YgaGVhZGVyIHJvdyBkZWZpbml0aW9ucyB0aGF0IHdlcmUgcHJvdmlkZWQgdG8gdGhlIHRhYmxlIGFzIGNvbnRlbnQgY2hpbGRyZW4uICovXG4gIEBDb250ZW50Q2hpbGRyZW4oQ2RrSGVhZGVyUm93RGVmLCB7XG4gICAgZGVzY2VuZGFudHM6IHRydWUsXG4gIH0pXG4gIF9jb250ZW50SGVhZGVyUm93RGVmczogUXVlcnlMaXN0PENka0hlYWRlclJvd0RlZj47XG5cbiAgLyoqIFNldCBvZiBmb290ZXIgcm93IGRlZmluaXRpb25zIHRoYXQgd2VyZSBwcm92aWRlZCB0byB0aGUgdGFibGUgYXMgY29udGVudCBjaGlsZHJlbi4gKi9cbiAgQENvbnRlbnRDaGlsZHJlbihDZGtGb290ZXJSb3dEZWYsIHtcbiAgICBkZXNjZW5kYW50czogdHJ1ZSxcbiAgfSlcbiAgX2NvbnRlbnRGb290ZXJSb3dEZWZzOiBRdWVyeUxpc3Q8Q2RrRm9vdGVyUm93RGVmPjtcblxuICAvKiogUm93IGRlZmluaXRpb24gdGhhdCB3aWxsIG9ubHkgYmUgcmVuZGVyZWQgaWYgdGhlcmUncyBubyBkYXRhIGluIHRoZSB0YWJsZS4gKi9cbiAgQENvbnRlbnRDaGlsZChDZGtOb0RhdGFSb3cpIF9ub0RhdGFSb3c6IENka05vRGF0YVJvdztcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcm90ZWN0ZWQgcmVhZG9ubHkgX2RpZmZlcnM6IEl0ZXJhYmxlRGlmZmVycyxcbiAgICBwcm90ZWN0ZWQgcmVhZG9ubHkgX2NoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBwcm90ZWN0ZWQgcmVhZG9ubHkgX2VsZW1lbnRSZWY6IEVsZW1lbnRSZWYsXG4gICAgQEF0dHJpYnV0ZSgncm9sZScpIHJvbGU6IHN0cmluZyxcbiAgICBAT3B0aW9uYWwoKSBwcm90ZWN0ZWQgcmVhZG9ubHkgX2RpcjogRGlyZWN0aW9uYWxpdHksXG4gICAgQEluamVjdChET0NVTUVOVCkgX2RvY3VtZW50OiBhbnksXG4gICAgcHJpdmF0ZSBfcGxhdGZvcm06IFBsYXRmb3JtLFxuICAgIEBJbmplY3QoX1ZJRVdfUkVQRUFURVJfU1RSQVRFR1kpXG4gICAgcHJvdGVjdGVkIHJlYWRvbmx5IF92aWV3UmVwZWF0ZXI6IF9WaWV3UmVwZWF0ZXI8VCwgUmVuZGVyUm93PFQ+LCBSb3dDb250ZXh0PFQ+PixcbiAgICBASW5qZWN0KF9DT0FMRVNDRURfU1RZTEVfU0NIRURVTEVSKVxuICAgIHByb3RlY3RlZCByZWFkb25seSBfY29hbGVzY2VkU3R5bGVTY2hlZHVsZXI6IF9Db2FsZXNjZWRTdHlsZVNjaGVkdWxlcixcbiAgICBwcml2YXRlIHJlYWRvbmx5IF92aWV3cG9ydFJ1bGVyOiBWaWV3cG9ydFJ1bGVyLFxuICAgIC8qKlxuICAgICAqIEBkZXByZWNhdGVkIGBfc3RpY2t5UG9zaXRpb25pbmdMaXN0ZW5lcmAgcGFyYW1ldGVyIHRvIGJlY29tZSByZXF1aXJlZC5cbiAgICAgKiBAYnJlYWtpbmctY2hhbmdlIDEzLjAuMFxuICAgICAqL1xuICAgIEBPcHRpb25hbCgpXG4gICAgQFNraXBTZWxmKClcbiAgICBASW5qZWN0KFNUSUNLWV9QT1NJVElPTklOR19MSVNURU5FUilcbiAgICBwcm90ZWN0ZWQgcmVhZG9ubHkgX3N0aWNreVBvc2l0aW9uaW5nTGlzdGVuZXI6IFN0aWNreVBvc2l0aW9uaW5nTGlzdGVuZXIsXG4gICkge1xuICAgIGlmICghcm9sZSkge1xuICAgICAgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnNldEF0dHJpYnV0ZSgncm9sZScsICd0YWJsZScpO1xuICAgIH1cblxuICAgIHRoaXMuX2RvY3VtZW50ID0gX2RvY3VtZW50O1xuICAgIHRoaXMuX2lzTmF0aXZlSHRtbFRhYmxlID0gdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50Lm5vZGVOYW1lID09PSAnVEFCTEUnO1xuICB9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgdGhpcy5fc2V0dXBTdGlja3lTdHlsZXIoKTtcblxuICAgIGlmICh0aGlzLl9pc05hdGl2ZUh0bWxUYWJsZSkge1xuICAgICAgdGhpcy5fYXBwbHlOYXRpdmVUYWJsZVNlY3Rpb25zKCk7XG4gICAgfVxuXG4gICAgLy8gU2V0IHVwIHRoZSB0cmFja0J5IGZ1bmN0aW9uIHNvIHRoYXQgaXQgdXNlcyB0aGUgYFJlbmRlclJvd2AgYXMgaXRzIGlkZW50aXR5IGJ5IGRlZmF1bHQuIElmXG4gICAgLy8gdGhlIHVzZXIgaGFzIHByb3ZpZGVkIGEgY3VzdG9tIHRyYWNrQnksIHJldHVybiB0aGUgcmVzdWx0IG9mIHRoYXQgZnVuY3Rpb24gYXMgZXZhbHVhdGVkXG4gICAgLy8gd2l0aCB0aGUgdmFsdWVzIG9mIHRoZSBgUmVuZGVyUm93YCdzIGRhdGEgYW5kIGluZGV4LlxuICAgIHRoaXMuX2RhdGFEaWZmZXIgPSB0aGlzLl9kaWZmZXJzLmZpbmQoW10pLmNyZWF0ZSgoX2k6IG51bWJlciwgZGF0YVJvdzogUmVuZGVyUm93PFQ+KSA9PiB7XG4gICAgICByZXR1cm4gdGhpcy50cmFja0J5ID8gdGhpcy50cmFja0J5KGRhdGFSb3cuZGF0YUluZGV4LCBkYXRhUm93LmRhdGEpIDogZGF0YVJvdztcbiAgICB9KTtcblxuICAgIHRoaXMuX3ZpZXdwb3J0UnVsZXJcbiAgICAgIC5jaGFuZ2UoKVxuICAgICAgLnBpcGUodGFrZVVudGlsKHRoaXMuX29uRGVzdHJveSkpXG4gICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgdGhpcy5fZm9yY2VSZWNhbGN1bGF0ZUNlbGxXaWR0aHMgPSB0cnVlO1xuICAgICAgfSk7XG4gIH1cblxuICBuZ0FmdGVyQ29udGVudENoZWNrZWQoKSB7XG4gICAgLy8gQ2FjaGUgdGhlIHJvdyBhbmQgY29sdW1uIGRlZmluaXRpb25zIGdhdGhlcmVkIGJ5IENvbnRlbnRDaGlsZHJlbiBhbmQgcHJvZ3JhbW1hdGljIGluamVjdGlvbi5cbiAgICB0aGlzLl9jYWNoZVJvd0RlZnMoKTtcbiAgICB0aGlzLl9jYWNoZUNvbHVtbkRlZnMoKTtcblxuICAgIC8vIE1ha2Ugc3VyZSB0aGF0IHRoZSB1c2VyIGhhcyBhdCBsZWFzdCBhZGRlZCBoZWFkZXIsIGZvb3Rlciwgb3IgZGF0YSByb3cgZGVmLlxuICAgIGlmIChcbiAgICAgICF0aGlzLl9oZWFkZXJSb3dEZWZzLmxlbmd0aCAmJlxuICAgICAgIXRoaXMuX2Zvb3RlclJvd0RlZnMubGVuZ3RoICYmXG4gICAgICAhdGhpcy5fcm93RGVmcy5sZW5ndGggJiZcbiAgICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpXG4gICAgKSB7XG4gICAgICB0aHJvdyBnZXRUYWJsZU1pc3NpbmdSb3dEZWZzRXJyb3IoKTtcbiAgICB9XG5cbiAgICAvLyBSZW5kZXIgdXBkYXRlcyBpZiB0aGUgbGlzdCBvZiBjb2x1bW5zIGhhdmUgYmVlbiBjaGFuZ2VkIGZvciB0aGUgaGVhZGVyLCByb3csIG9yIGZvb3RlciBkZWZzLlxuICAgIGNvbnN0IGNvbHVtbnNDaGFuZ2VkID0gdGhpcy5fcmVuZGVyVXBkYXRlZENvbHVtbnMoKTtcbiAgICBjb25zdCByb3dEZWZzQ2hhbmdlZCA9IGNvbHVtbnNDaGFuZ2VkIHx8IHRoaXMuX2hlYWRlclJvd0RlZkNoYW5nZWQgfHwgdGhpcy5fZm9vdGVyUm93RGVmQ2hhbmdlZDtcbiAgICAvLyBFbnN1cmUgc3RpY2t5IGNvbHVtbiBzdHlsZXMgYXJlIHJlc2V0IGlmIHNldCB0byBgdHJ1ZWAgZWxzZXdoZXJlLlxuICAgIHRoaXMuX3N0aWNreUNvbHVtblN0eWxlc05lZWRSZXNldCA9IHRoaXMuX3N0aWNreUNvbHVtblN0eWxlc05lZWRSZXNldCB8fCByb3dEZWZzQ2hhbmdlZDtcbiAgICB0aGlzLl9mb3JjZVJlY2FsY3VsYXRlQ2VsbFdpZHRocyA9IHJvd0RlZnNDaGFuZ2VkO1xuXG4gICAgLy8gSWYgdGhlIGhlYWRlciByb3cgZGVmaW5pdGlvbiBoYXMgYmVlbiBjaGFuZ2VkLCB0cmlnZ2VyIGEgcmVuZGVyIHRvIHRoZSBoZWFkZXIgcm93LlxuICAgIGlmICh0aGlzLl9oZWFkZXJSb3dEZWZDaGFuZ2VkKSB7XG4gICAgICB0aGlzLl9mb3JjZVJlbmRlckhlYWRlclJvd3MoKTtcbiAgICAgIHRoaXMuX2hlYWRlclJvd0RlZkNoYW5nZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgZm9vdGVyIHJvdyBkZWZpbml0aW9uIGhhcyBiZWVuIGNoYW5nZWQsIHRyaWdnZXIgYSByZW5kZXIgdG8gdGhlIGZvb3RlciByb3cuXG4gICAgaWYgKHRoaXMuX2Zvb3RlclJvd0RlZkNoYW5nZWQpIHtcbiAgICAgIHRoaXMuX2ZvcmNlUmVuZGVyRm9vdGVyUm93cygpO1xuICAgICAgdGhpcy5fZm9vdGVyUm93RGVmQ2hhbmdlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8vIElmIHRoZXJlIGlzIGEgZGF0YSBzb3VyY2UgYW5kIHJvdyBkZWZpbml0aW9ucywgY29ubmVjdCB0byB0aGUgZGF0YSBzb3VyY2UgdW5sZXNzIGFcbiAgICAvLyBjb25uZWN0aW9uIGhhcyBhbHJlYWR5IGJlZW4gbWFkZS5cbiAgICBpZiAodGhpcy5kYXRhU291cmNlICYmIHRoaXMuX3Jvd0RlZnMubGVuZ3RoID4gMCAmJiAhdGhpcy5fcmVuZGVyQ2hhbmdlU3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aGlzLl9vYnNlcnZlUmVuZGVyQ2hhbmdlcygpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fc3RpY2t5Q29sdW1uU3R5bGVzTmVlZFJlc2V0KSB7XG4gICAgICAvLyBJbiB0aGUgYWJvdmUgY2FzZSwgX29ic2VydmVSZW5kZXJDaGFuZ2VzIHdpbGwgcmVzdWx0IGluIHVwZGF0ZVN0aWNreUNvbHVtblN0eWxlcyBiZWluZ1xuICAgICAgLy8gY2FsbGVkIHdoZW4gaXQgcm93IGRhdGEgYXJyaXZlcy4gT3RoZXJ3aXNlLCB3ZSBuZWVkIHRvIGNhbGwgaXQgcHJvYWN0aXZlbHkuXG4gICAgICB0aGlzLnVwZGF0ZVN0aWNreUNvbHVtblN0eWxlcygpO1xuICAgIH1cblxuICAgIHRoaXMuX2NoZWNrU3RpY2t5U3RhdGVzKCk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9yb3dPdXRsZXQudmlld0NvbnRhaW5lci5jbGVhcigpO1xuICAgIHRoaXMuX25vRGF0YVJvd091dGxldC52aWV3Q29udGFpbmVyLmNsZWFyKCk7XG4gICAgdGhpcy5faGVhZGVyUm93T3V0bGV0LnZpZXdDb250YWluZXIuY2xlYXIoKTtcbiAgICB0aGlzLl9mb290ZXJSb3dPdXRsZXQudmlld0NvbnRhaW5lci5jbGVhcigpO1xuXG4gICAgdGhpcy5fY2FjaGVkUmVuZGVyUm93c01hcC5jbGVhcigpO1xuXG4gICAgdGhpcy5fb25EZXN0cm95Lm5leHQoKTtcbiAgICB0aGlzLl9vbkRlc3Ryb3kuY29tcGxldGUoKTtcblxuICAgIGlmIChpc0RhdGFTb3VyY2UodGhpcy5kYXRhU291cmNlKSkge1xuICAgICAgdGhpcy5kYXRhU291cmNlLmRpc2Nvbm5lY3QodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbmRlcnMgcm93cyBiYXNlZCBvbiB0aGUgdGFibGUncyBsYXRlc3Qgc2V0IG9mIGRhdGEsIHdoaWNoIHdhcyBlaXRoZXIgcHJvdmlkZWQgZGlyZWN0bHkgYXMgYW5cbiAgICogaW5wdXQgb3IgcmV0cmlldmVkIHRocm91Z2ggYW4gT2JzZXJ2YWJsZSBzdHJlYW0gKGRpcmVjdGx5IG9yIGZyb20gYSBEYXRhU291cmNlKS5cbiAgICogQ2hlY2tzIGZvciBkaWZmZXJlbmNlcyBpbiB0aGUgZGF0YSBzaW5jZSB0aGUgbGFzdCBkaWZmIHRvIHBlcmZvcm0gb25seSB0aGUgbmVjZXNzYXJ5XG4gICAqIGNoYW5nZXMgKGFkZC9yZW1vdmUvbW92ZSByb3dzKS5cbiAgICpcbiAgICogSWYgdGhlIHRhYmxlJ3MgZGF0YSBzb3VyY2UgaXMgYSBEYXRhU291cmNlIG9yIE9ic2VydmFibGUsIHRoaXMgd2lsbCBiZSBpbnZva2VkIGF1dG9tYXRpY2FsbHlcbiAgICogZWFjaCB0aW1lIHRoZSBwcm92aWRlZCBPYnNlcnZhYmxlIHN0cmVhbSBlbWl0cyBhIG5ldyBkYXRhIGFycmF5LiBPdGhlcndpc2UgaWYgeW91ciBkYXRhIGlzXG4gICAqIGFuIGFycmF5LCB0aGlzIGZ1bmN0aW9uIHdpbGwgbmVlZCB0byBiZSBjYWxsZWQgdG8gcmVuZGVyIGFueSBjaGFuZ2VzLlxuICAgKi9cbiAgcmVuZGVyUm93cygpIHtcbiAgICB0aGlzLl9yZW5kZXJSb3dzID0gdGhpcy5fZ2V0QWxsUmVuZGVyUm93cygpO1xuICAgIGNvbnN0IGNoYW5nZXMgPSB0aGlzLl9kYXRhRGlmZmVyLmRpZmYodGhpcy5fcmVuZGVyUm93cyk7XG4gICAgaWYgKCFjaGFuZ2VzKSB7XG4gICAgICB0aGlzLl91cGRhdGVOb0RhdGFSb3coKTtcbiAgICAgIHRoaXMuY29udGVudENoYW5nZWQubmV4dCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB2aWV3Q29udGFpbmVyID0gdGhpcy5fcm93T3V0bGV0LnZpZXdDb250YWluZXI7XG5cbiAgICB0aGlzLl92aWV3UmVwZWF0ZXIuYXBwbHlDaGFuZ2VzKFxuICAgICAgY2hhbmdlcyxcbiAgICAgIHZpZXdDb250YWluZXIsXG4gICAgICAoXG4gICAgICAgIHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8UmVuZGVyUm93PFQ+PixcbiAgICAgICAgX2FkanVzdGVkUHJldmlvdXNJbmRleDogbnVtYmVyIHwgbnVsbCxcbiAgICAgICAgY3VycmVudEluZGV4OiBudW1iZXIgfCBudWxsLFxuICAgICAgKSA9PiB0aGlzLl9nZXRFbWJlZGRlZFZpZXdBcmdzKHJlY29yZC5pdGVtLCBjdXJyZW50SW5kZXghKSxcbiAgICAgIHJlY29yZCA9PiByZWNvcmQuaXRlbS5kYXRhLFxuICAgICAgKGNoYW5nZTogX1ZpZXdSZXBlYXRlckl0ZW1DaGFuZ2U8UmVuZGVyUm93PFQ+LCBSb3dDb250ZXh0PFQ+PikgPT4ge1xuICAgICAgICBpZiAoY2hhbmdlLm9wZXJhdGlvbiA9PT0gX1ZpZXdSZXBlYXRlck9wZXJhdGlvbi5JTlNFUlRFRCAmJiBjaGFuZ2UuY29udGV4dCkge1xuICAgICAgICAgIHRoaXMuX3JlbmRlckNlbGxUZW1wbGF0ZUZvckl0ZW0oY2hhbmdlLnJlY29yZC5pdGVtLnJvd0RlZiwgY2hhbmdlLmNvbnRleHQpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICk7XG5cbiAgICAvLyBVcGRhdGUgdGhlIG1ldGEgY29udGV4dCBvZiBhIHJvdydzIGNvbnRleHQgZGF0YSAoaW5kZXgsIGNvdW50LCBmaXJzdCwgbGFzdCwgLi4uKVxuICAgIHRoaXMuX3VwZGF0ZVJvd0luZGV4Q29udGV4dCgpO1xuXG4gICAgLy8gVXBkYXRlIHJvd3MgdGhhdCBkaWQgbm90IGdldCBhZGRlZC9yZW1vdmVkL21vdmVkIGJ1dCBtYXkgaGF2ZSBoYWQgdGhlaXIgaWRlbnRpdHkgY2hhbmdlZCxcbiAgICAvLyBlLmcuIGlmIHRyYWNrQnkgbWF0Y2hlZCBkYXRhIG9uIHNvbWUgcHJvcGVydHkgYnV0IHRoZSBhY3R1YWwgZGF0YSByZWZlcmVuY2UgY2hhbmdlZC5cbiAgICBjaGFuZ2VzLmZvckVhY2hJZGVudGl0eUNoYW5nZSgocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZDxSZW5kZXJSb3c8VD4+KSA9PiB7XG4gICAgICBjb25zdCByb3dWaWV3ID0gPFJvd1ZpZXdSZWY8VD4+dmlld0NvbnRhaW5lci5nZXQocmVjb3JkLmN1cnJlbnRJbmRleCEpO1xuICAgICAgcm93Vmlldy5jb250ZXh0LiRpbXBsaWNpdCA9IHJlY29yZC5pdGVtLmRhdGE7XG4gICAgfSk7XG5cbiAgICB0aGlzLl91cGRhdGVOb0RhdGFSb3coKTtcbiAgICB0aGlzLnVwZGF0ZVN0aWNreUNvbHVtblN0eWxlcygpO1xuXG4gICAgdGhpcy5jb250ZW50Q2hhbmdlZC5uZXh0KCk7XG4gIH1cblxuICAvKiogQWRkcyBhIGNvbHVtbiBkZWZpbml0aW9uIHRoYXQgd2FzIG5vdCBpbmNsdWRlZCBhcyBwYXJ0IG9mIHRoZSBjb250ZW50IGNoaWxkcmVuLiAqL1xuICBhZGRDb2x1bW5EZWYoY29sdW1uRGVmOiBDZGtDb2x1bW5EZWYpIHtcbiAgICB0aGlzLl9jdXN0b21Db2x1bW5EZWZzLmFkZChjb2x1bW5EZWYpO1xuICB9XG5cbiAgLyoqIFJlbW92ZXMgYSBjb2x1bW4gZGVmaW5pdGlvbiB0aGF0IHdhcyBub3QgaW5jbHVkZWQgYXMgcGFydCBvZiB0aGUgY29udGVudCBjaGlsZHJlbi4gKi9cbiAgcmVtb3ZlQ29sdW1uRGVmKGNvbHVtbkRlZjogQ2RrQ29sdW1uRGVmKSB7XG4gICAgdGhpcy5fY3VzdG9tQ29sdW1uRGVmcy5kZWxldGUoY29sdW1uRGVmKTtcbiAgfVxuXG4gIC8qKiBBZGRzIGEgcm93IGRlZmluaXRpb24gdGhhdCB3YXMgbm90IGluY2x1ZGVkIGFzIHBhcnQgb2YgdGhlIGNvbnRlbnQgY2hpbGRyZW4uICovXG4gIGFkZFJvd0RlZihyb3dEZWY6IENka1Jvd0RlZjxUPikge1xuICAgIHRoaXMuX2N1c3RvbVJvd0RlZnMuYWRkKHJvd0RlZik7XG4gIH1cblxuICAvKiogUmVtb3ZlcyBhIHJvdyBkZWZpbml0aW9uIHRoYXQgd2FzIG5vdCBpbmNsdWRlZCBhcyBwYXJ0IG9mIHRoZSBjb250ZW50IGNoaWxkcmVuLiAqL1xuICByZW1vdmVSb3dEZWYocm93RGVmOiBDZGtSb3dEZWY8VD4pIHtcbiAgICB0aGlzLl9jdXN0b21Sb3dEZWZzLmRlbGV0ZShyb3dEZWYpO1xuICB9XG5cbiAgLyoqIEFkZHMgYSBoZWFkZXIgcm93IGRlZmluaXRpb24gdGhhdCB3YXMgbm90IGluY2x1ZGVkIGFzIHBhcnQgb2YgdGhlIGNvbnRlbnQgY2hpbGRyZW4uICovXG4gIGFkZEhlYWRlclJvd0RlZihoZWFkZXJSb3dEZWY6IENka0hlYWRlclJvd0RlZikge1xuICAgIHRoaXMuX2N1c3RvbUhlYWRlclJvd0RlZnMuYWRkKGhlYWRlclJvd0RlZik7XG4gICAgdGhpcy5faGVhZGVyUm93RGVmQ2hhbmdlZCA9IHRydWU7XG4gIH1cblxuICAvKiogUmVtb3ZlcyBhIGhlYWRlciByb3cgZGVmaW5pdGlvbiB0aGF0IHdhcyBub3QgaW5jbHVkZWQgYXMgcGFydCBvZiB0aGUgY29udGVudCBjaGlsZHJlbi4gKi9cbiAgcmVtb3ZlSGVhZGVyUm93RGVmKGhlYWRlclJvd0RlZjogQ2RrSGVhZGVyUm93RGVmKSB7XG4gICAgdGhpcy5fY3VzdG9tSGVhZGVyUm93RGVmcy5kZWxldGUoaGVhZGVyUm93RGVmKTtcbiAgICB0aGlzLl9oZWFkZXJSb3dEZWZDaGFuZ2VkID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKiBBZGRzIGEgZm9vdGVyIHJvdyBkZWZpbml0aW9uIHRoYXQgd2FzIG5vdCBpbmNsdWRlZCBhcyBwYXJ0IG9mIHRoZSBjb250ZW50IGNoaWxkcmVuLiAqL1xuICBhZGRGb290ZXJSb3dEZWYoZm9vdGVyUm93RGVmOiBDZGtGb290ZXJSb3dEZWYpIHtcbiAgICB0aGlzLl9jdXN0b21Gb290ZXJSb3dEZWZzLmFkZChmb290ZXJSb3dEZWYpO1xuICAgIHRoaXMuX2Zvb3RlclJvd0RlZkNoYW5nZWQgPSB0cnVlO1xuICB9XG5cbiAgLyoqIFJlbW92ZXMgYSBmb290ZXIgcm93IGRlZmluaXRpb24gdGhhdCB3YXMgbm90IGluY2x1ZGVkIGFzIHBhcnQgb2YgdGhlIGNvbnRlbnQgY2hpbGRyZW4uICovXG4gIHJlbW92ZUZvb3RlclJvd0RlZihmb290ZXJSb3dEZWY6IENka0Zvb3RlclJvd0RlZikge1xuICAgIHRoaXMuX2N1c3RvbUZvb3RlclJvd0RlZnMuZGVsZXRlKGZvb3RlclJvd0RlZik7XG4gICAgdGhpcy5fZm9vdGVyUm93RGVmQ2hhbmdlZCA9IHRydWU7XG4gIH1cblxuICAvKiogU2V0cyBhIG5vIGRhdGEgcm93IGRlZmluaXRpb24gdGhhdCB3YXMgbm90IGluY2x1ZGVkIGFzIGEgcGFydCBvZiB0aGUgY29udGVudCBjaGlsZHJlbi4gKi9cbiAgc2V0Tm9EYXRhUm93KG5vRGF0YVJvdzogQ2RrTm9EYXRhUm93IHwgbnVsbCkge1xuICAgIHRoaXMuX2N1c3RvbU5vRGF0YVJvdyA9IG5vRGF0YVJvdztcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBoZWFkZXIgc3RpY2t5IHN0eWxlcy4gRmlyc3QgcmVzZXRzIGFsbCBhcHBsaWVkIHN0eWxlcyB3aXRoIHJlc3BlY3QgdG8gdGhlIGNlbGxzXG4gICAqIHN0aWNraW5nIHRvIHRoZSB0b3AuIFRoZW4sIGV2YWx1YXRpbmcgd2hpY2ggY2VsbHMgbmVlZCB0byBiZSBzdHVjayB0byB0aGUgdG9wLiBUaGlzIGlzXG4gICAqIGF1dG9tYXRpY2FsbHkgY2FsbGVkIHdoZW4gdGhlIGhlYWRlciByb3cgY2hhbmdlcyBpdHMgZGlzcGxheWVkIHNldCBvZiBjb2x1bW5zLCBvciBpZiBpdHNcbiAgICogc3RpY2t5IGlucHV0IGNoYW5nZXMuIE1heSBiZSBjYWxsZWQgbWFudWFsbHkgZm9yIGNhc2VzIHdoZXJlIHRoZSBjZWxsIGNvbnRlbnQgY2hhbmdlcyBvdXRzaWRlXG4gICAqIG9mIHRoZXNlIGV2ZW50cy5cbiAgICovXG4gIHVwZGF0ZVN0aWNreUhlYWRlclJvd1N0eWxlcygpOiB2b2lkIHtcbiAgICBjb25zdCBoZWFkZXJSb3dzID0gdGhpcy5fZ2V0UmVuZGVyZWRSb3dzKHRoaXMuX2hlYWRlclJvd091dGxldCk7XG4gICAgY29uc3QgdGFibGVFbGVtZW50ID0gdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50O1xuXG4gICAgLy8gSGlkZSB0aGUgdGhlYWQgZWxlbWVudCBpZiB0aGVyZSBhcmUgbm8gaGVhZGVyIHJvd3MuIFRoaXMgaXMgbmVjZXNzYXJ5IHRvIHNhdGlzZnlcbiAgICAvLyBvdmVyemVhbG91cyBhMTF5IGNoZWNrZXJzIHRoYXQgZmFpbCBiZWNhdXNlIHRoZSBgcm93Z3JvdXBgIGVsZW1lbnQgZG9lcyBub3QgY29udGFpblxuICAgIC8vIHJlcXVpcmVkIGNoaWxkIGByb3dgLlxuICAgIGNvbnN0IHRoZWFkID0gdGFibGVFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ3RoZWFkJyk7XG4gICAgaWYgKHRoZWFkKSB7XG4gICAgICB0aGVhZC5zdHlsZS5kaXNwbGF5ID0gaGVhZGVyUm93cy5sZW5ndGggPyAnJyA6ICdub25lJztcbiAgICB9XG5cbiAgICBjb25zdCBzdGlja3lTdGF0ZXMgPSB0aGlzLl9oZWFkZXJSb3dEZWZzLm1hcChkZWYgPT4gZGVmLnN0aWNreSk7XG4gICAgdGhpcy5fc3RpY2t5U3R5bGVyLmNsZWFyU3RpY2t5UG9zaXRpb25pbmcoaGVhZGVyUm93cywgWyd0b3AnXSk7XG4gICAgdGhpcy5fc3RpY2t5U3R5bGVyLnN0aWNrUm93cyhoZWFkZXJSb3dzLCBzdGlja3lTdGF0ZXMsICd0b3AnKTtcblxuICAgIC8vIFJlc2V0IHRoZSBkaXJ0eSBzdGF0ZSBvZiB0aGUgc3RpY2t5IGlucHV0IGNoYW5nZSBzaW5jZSBpdCBoYXMgYmVlbiB1c2VkLlxuICAgIHRoaXMuX2hlYWRlclJvd0RlZnMuZm9yRWFjaChkZWYgPT4gZGVmLnJlc2V0U3RpY2t5Q2hhbmdlZCgpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBmb290ZXIgc3RpY2t5IHN0eWxlcy4gRmlyc3QgcmVzZXRzIGFsbCBhcHBsaWVkIHN0eWxlcyB3aXRoIHJlc3BlY3QgdG8gdGhlIGNlbGxzXG4gICAqIHN0aWNraW5nIHRvIHRoZSBib3R0b20uIFRoZW4sIGV2YWx1YXRpbmcgd2hpY2ggY2VsbHMgbmVlZCB0byBiZSBzdHVjayB0byB0aGUgYm90dG9tLiBUaGlzIGlzXG4gICAqIGF1dG9tYXRpY2FsbHkgY2FsbGVkIHdoZW4gdGhlIGZvb3RlciByb3cgY2hhbmdlcyBpdHMgZGlzcGxheWVkIHNldCBvZiBjb2x1bW5zLCBvciBpZiBpdHNcbiAgICogc3RpY2t5IGlucHV0IGNoYW5nZXMuIE1heSBiZSBjYWxsZWQgbWFudWFsbHkgZm9yIGNhc2VzIHdoZXJlIHRoZSBjZWxsIGNvbnRlbnQgY2hhbmdlcyBvdXRzaWRlXG4gICAqIG9mIHRoZXNlIGV2ZW50cy5cbiAgICovXG4gIHVwZGF0ZVN0aWNreUZvb3RlclJvd1N0eWxlcygpOiB2b2lkIHtcbiAgICBjb25zdCBmb290ZXJSb3dzID0gdGhpcy5fZ2V0UmVuZGVyZWRSb3dzKHRoaXMuX2Zvb3RlclJvd091dGxldCk7XG4gICAgY29uc3QgdGFibGVFbGVtZW50ID0gdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50O1xuXG4gICAgLy8gSGlkZSB0aGUgdGZvb3QgZWxlbWVudCBpZiB0aGVyZSBhcmUgbm8gZm9vdGVyIHJvd3MuIFRoaXMgaXMgbmVjZXNzYXJ5IHRvIHNhdGlzZnlcbiAgICAvLyBvdmVyemVhbG91cyBhMTF5IGNoZWNrZXJzIHRoYXQgZmFpbCBiZWNhdXNlIHRoZSBgcm93Z3JvdXBgIGVsZW1lbnQgZG9lcyBub3QgY29udGFpblxuICAgIC8vIHJlcXVpcmVkIGNoaWxkIGByb3dgLlxuICAgIGNvbnN0IHRmb290ID0gdGFibGVFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ3Rmb290Jyk7XG4gICAgaWYgKHRmb290KSB7XG4gICAgICB0Zm9vdC5zdHlsZS5kaXNwbGF5ID0gZm9vdGVyUm93cy5sZW5ndGggPyAnJyA6ICdub25lJztcbiAgICB9XG5cbiAgICBjb25zdCBzdGlja3lTdGF0ZXMgPSB0aGlzLl9mb290ZXJSb3dEZWZzLm1hcChkZWYgPT4gZGVmLnN0aWNreSk7XG4gICAgdGhpcy5fc3RpY2t5U3R5bGVyLmNsZWFyU3RpY2t5UG9zaXRpb25pbmcoZm9vdGVyUm93cywgWydib3R0b20nXSk7XG4gICAgdGhpcy5fc3RpY2t5U3R5bGVyLnN0aWNrUm93cyhmb290ZXJSb3dzLCBzdGlja3lTdGF0ZXMsICdib3R0b20nKTtcbiAgICB0aGlzLl9zdGlja3lTdHlsZXIudXBkYXRlU3RpY2t5Rm9vdGVyQ29udGFpbmVyKHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudCwgc3RpY2t5U3RhdGVzKTtcblxuICAgIC8vIFJlc2V0IHRoZSBkaXJ0eSBzdGF0ZSBvZiB0aGUgc3RpY2t5IGlucHV0IGNoYW5nZSBzaW5jZSBpdCBoYXMgYmVlbiB1c2VkLlxuICAgIHRoaXMuX2Zvb3RlclJvd0RlZnMuZm9yRWFjaChkZWYgPT4gZGVmLnJlc2V0U3RpY2t5Q2hhbmdlZCgpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBjb2x1bW4gc3RpY2t5IHN0eWxlcy4gRmlyc3QgcmVzZXRzIGFsbCBhcHBsaWVkIHN0eWxlcyB3aXRoIHJlc3BlY3QgdG8gdGhlIGNlbGxzXG4gICAqIHN0aWNraW5nIHRvIHRoZSBsZWZ0IGFuZCByaWdodC4gVGhlbiBzdGlja3kgc3R5bGVzIGFyZSBhZGRlZCBmb3IgdGhlIGxlZnQgYW5kIHJpZ2h0IGFjY29yZGluZ1xuICAgKiB0byB0aGUgY29sdW1uIGRlZmluaXRpb25zIGZvciBlYWNoIGNlbGwgaW4gZWFjaCByb3cuIFRoaXMgaXMgYXV0b21hdGljYWxseSBjYWxsZWQgd2hlblxuICAgKiB0aGUgZGF0YSBzb3VyY2UgcHJvdmlkZXMgYSBuZXcgc2V0IG9mIGRhdGEgb3Igd2hlbiBhIGNvbHVtbiBkZWZpbml0aW9uIGNoYW5nZXMgaXRzIHN0aWNreVxuICAgKiBpbnB1dC4gTWF5IGJlIGNhbGxlZCBtYW51YWxseSBmb3IgY2FzZXMgd2hlcmUgdGhlIGNlbGwgY29udGVudCBjaGFuZ2VzIG91dHNpZGUgb2YgdGhlc2UgZXZlbnRzLlxuICAgKi9cbiAgdXBkYXRlU3RpY2t5Q29sdW1uU3R5bGVzKCkge1xuICAgIGNvbnN0IGhlYWRlclJvd3MgPSB0aGlzLl9nZXRSZW5kZXJlZFJvd3ModGhpcy5faGVhZGVyUm93T3V0bGV0KTtcbiAgICBjb25zdCBkYXRhUm93cyA9IHRoaXMuX2dldFJlbmRlcmVkUm93cyh0aGlzLl9yb3dPdXRsZXQpO1xuICAgIGNvbnN0IGZvb3RlclJvd3MgPSB0aGlzLl9nZXRSZW5kZXJlZFJvd3ModGhpcy5fZm9vdGVyUm93T3V0bGV0KTtcblxuICAgIC8vIEZvciB0YWJsZXMgbm90IHVzaW5nIGEgZml4ZWQgbGF5b3V0LCB0aGUgY29sdW1uIHdpZHRocyBtYXkgY2hhbmdlIHdoZW4gbmV3IHJvd3MgYXJlIHJlbmRlcmVkLlxuICAgIC8vIEluIGEgdGFibGUgdXNpbmcgYSBmaXhlZCBsYXlvdXQsIHJvdyBjb250ZW50IHdvbid0IGFmZmVjdCBjb2x1bW4gd2lkdGgsIHNvIHN0aWNreSBzdHlsZXNcbiAgICAvLyBkb24ndCBuZWVkIHRvIGJlIGNsZWFyZWQgdW5sZXNzIGVpdGhlciB0aGUgc3RpY2t5IGNvbHVtbiBjb25maWcgY2hhbmdlcyBvciBvbmUgb2YgdGhlIHJvd1xuICAgIC8vIGRlZnMgY2hhbmdlLlxuICAgIGlmICgodGhpcy5faXNOYXRpdmVIdG1sVGFibGUgJiYgIXRoaXMuX2ZpeGVkTGF5b3V0KSB8fCB0aGlzLl9zdGlja3lDb2x1bW5TdHlsZXNOZWVkUmVzZXQpIHtcbiAgICAgIC8vIENsZWFyIHRoZSBsZWZ0IGFuZCByaWdodCBwb3NpdGlvbmluZyBmcm9tIGFsbCBjb2x1bW5zIGluIHRoZSB0YWJsZSBhY3Jvc3MgYWxsIHJvd3Mgc2luY2VcbiAgICAgIC8vIHN0aWNreSBjb2x1bW5zIHNwYW4gYWNyb3NzIGFsbCB0YWJsZSBzZWN0aW9ucyAoaGVhZGVyLCBkYXRhLCBmb290ZXIpXG4gICAgICB0aGlzLl9zdGlja3lTdHlsZXIuY2xlYXJTdGlja3lQb3NpdGlvbmluZyhcbiAgICAgICAgWy4uLmhlYWRlclJvd3MsIC4uLmRhdGFSb3dzLCAuLi5mb290ZXJSb3dzXSxcbiAgICAgICAgWydsZWZ0JywgJ3JpZ2h0J10sXG4gICAgICApO1xuICAgICAgdGhpcy5fc3RpY2t5Q29sdW1uU3R5bGVzTmVlZFJlc2V0ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIHRoZSBzdGlja3kgc3R5bGVzIGZvciBlYWNoIGhlYWRlciByb3cgZGVwZW5kaW5nIG9uIHRoZSBkZWYncyBzdGlja3kgc3RhdGVcbiAgICBoZWFkZXJSb3dzLmZvckVhY2goKGhlYWRlclJvdywgaSkgPT4ge1xuICAgICAgdGhpcy5fYWRkU3RpY2t5Q29sdW1uU3R5bGVzKFtoZWFkZXJSb3ddLCB0aGlzLl9oZWFkZXJSb3dEZWZzW2ldKTtcbiAgICB9KTtcblxuICAgIC8vIFVwZGF0ZSB0aGUgc3RpY2t5IHN0eWxlcyBmb3IgZWFjaCBkYXRhIHJvdyBkZXBlbmRpbmcgb24gaXRzIGRlZidzIHN0aWNreSBzdGF0ZVxuICAgIHRoaXMuX3Jvd0RlZnMuZm9yRWFjaChyb3dEZWYgPT4ge1xuICAgICAgLy8gQ29sbGVjdCBhbGwgdGhlIHJvd3MgcmVuZGVyZWQgd2l0aCB0aGlzIHJvdyBkZWZpbml0aW9uLlxuICAgICAgY29uc3Qgcm93czogSFRNTEVsZW1lbnRbXSA9IFtdO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhUm93cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodGhpcy5fcmVuZGVyUm93c1tpXS5yb3dEZWYgPT09IHJvd0RlZikge1xuICAgICAgICAgIHJvd3MucHVzaChkYXRhUm93c1tpXSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5fYWRkU3RpY2t5Q29sdW1uU3R5bGVzKHJvd3MsIHJvd0RlZik7XG4gICAgfSk7XG5cbiAgICAvLyBVcGRhdGUgdGhlIHN0aWNreSBzdHlsZXMgZm9yIGVhY2ggZm9vdGVyIHJvdyBkZXBlbmRpbmcgb24gdGhlIGRlZidzIHN0aWNreSBzdGF0ZVxuICAgIGZvb3RlclJvd3MuZm9yRWFjaCgoZm9vdGVyUm93LCBpKSA9PiB7XG4gICAgICB0aGlzLl9hZGRTdGlja3lDb2x1bW5TdHlsZXMoW2Zvb3RlclJvd10sIHRoaXMuX2Zvb3RlclJvd0RlZnNbaV0pO1xuICAgIH0pO1xuXG4gICAgLy8gUmVzZXQgdGhlIGRpcnR5IHN0YXRlIG9mIHRoZSBzdGlja3kgaW5wdXQgY2hhbmdlIHNpbmNlIGl0IGhhcyBiZWVuIHVzZWQuXG4gICAgQXJyYXkuZnJvbSh0aGlzLl9jb2x1bW5EZWZzQnlOYW1lLnZhbHVlcygpKS5mb3JFYWNoKGRlZiA9PiBkZWYucmVzZXRTdGlja3lDaGFuZ2VkKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgbGlzdCBvZiBSZW5kZXJSb3cgb2JqZWN0cyB0byByZW5kZXIgYWNjb3JkaW5nIHRvIHRoZSBjdXJyZW50IGxpc3Qgb2YgZGF0YSBhbmQgZGVmaW5lZFxuICAgKiByb3cgZGVmaW5pdGlvbnMuIElmIHRoZSBwcmV2aW91cyBsaXN0IGFscmVhZHkgY29udGFpbmVkIGEgcGFydGljdWxhciBwYWlyLCBpdCBzaG91bGQgYmUgcmV1c2VkXG4gICAqIHNvIHRoYXQgdGhlIGRpZmZlciBlcXVhdGVzIHRoZWlyIHJlZmVyZW5jZXMuXG4gICAqL1xuICBwcml2YXRlIF9nZXRBbGxSZW5kZXJSb3dzKCk6IFJlbmRlclJvdzxUPltdIHtcbiAgICBjb25zdCByZW5kZXJSb3dzOiBSZW5kZXJSb3c8VD5bXSA9IFtdO1xuXG4gICAgLy8gU3RvcmUgdGhlIGNhY2hlIGFuZCBjcmVhdGUgYSBuZXcgb25lLiBBbnkgcmUtdXNlZCBSZW5kZXJSb3cgb2JqZWN0cyB3aWxsIGJlIG1vdmVkIGludG8gdGhlXG4gICAgLy8gbmV3IGNhY2hlIHdoaWxlIHVudXNlZCBvbmVzIGNhbiBiZSBwaWNrZWQgdXAgYnkgZ2FyYmFnZSBjb2xsZWN0aW9uLlxuICAgIGNvbnN0IHByZXZDYWNoZWRSZW5kZXJSb3dzID0gdGhpcy5fY2FjaGVkUmVuZGVyUm93c01hcDtcbiAgICB0aGlzLl9jYWNoZWRSZW5kZXJSb3dzTWFwID0gbmV3IE1hcCgpO1xuXG4gICAgLy8gRm9yIGVhY2ggZGF0YSBvYmplY3QsIGdldCB0aGUgbGlzdCBvZiByb3dzIHRoYXQgc2hvdWxkIGJlIHJlbmRlcmVkLCByZXByZXNlbnRlZCBieSB0aGVcbiAgICAvLyByZXNwZWN0aXZlIGBSZW5kZXJSb3dgIG9iamVjdCB3aGljaCBpcyB0aGUgcGFpciBvZiBgZGF0YWAgYW5kIGBDZGtSb3dEZWZgLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IGRhdGEgPSB0aGlzLl9kYXRhW2ldO1xuICAgICAgY29uc3QgcmVuZGVyUm93c0ZvckRhdGEgPSB0aGlzLl9nZXRSZW5kZXJSb3dzRm9yRGF0YShkYXRhLCBpLCBwcmV2Q2FjaGVkUmVuZGVyUm93cy5nZXQoZGF0YSkpO1xuXG4gICAgICBpZiAoIXRoaXMuX2NhY2hlZFJlbmRlclJvd3NNYXAuaGFzKGRhdGEpKSB7XG4gICAgICAgIHRoaXMuX2NhY2hlZFJlbmRlclJvd3NNYXAuc2V0KGRhdGEsIG5ldyBXZWFrTWFwKCkpO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHJlbmRlclJvd3NGb3JEYXRhLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGxldCByZW5kZXJSb3cgPSByZW5kZXJSb3dzRm9yRGF0YVtqXTtcblxuICAgICAgICBjb25zdCBjYWNoZSA9IHRoaXMuX2NhY2hlZFJlbmRlclJvd3NNYXAuZ2V0KHJlbmRlclJvdy5kYXRhKSE7XG4gICAgICAgIGlmIChjYWNoZS5oYXMocmVuZGVyUm93LnJvd0RlZikpIHtcbiAgICAgICAgICBjYWNoZS5nZXQocmVuZGVyUm93LnJvd0RlZikhLnB1c2gocmVuZGVyUm93KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjYWNoZS5zZXQocmVuZGVyUm93LnJvd0RlZiwgW3JlbmRlclJvd10pO1xuICAgICAgICB9XG4gICAgICAgIHJlbmRlclJvd3MucHVzaChyZW5kZXJSb3cpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZW5kZXJSb3dzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSBsaXN0IG9mIGBSZW5kZXJSb3c8VD5gIGZvciB0aGUgcHJvdmlkZWQgZGF0YSBvYmplY3QgYW5kIGFueSBgQ2RrUm93RGVmYCBvYmplY3RzIHRoYXRcbiAgICogc2hvdWxkIGJlIHJlbmRlcmVkIGZvciB0aGlzIGRhdGEuIFJldXNlcyB0aGUgY2FjaGVkIFJlbmRlclJvdyBvYmplY3RzIGlmIHRoZXkgbWF0Y2ggdGhlIHNhbWVcbiAgICogYChULCBDZGtSb3dEZWYpYCBwYWlyLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0UmVuZGVyUm93c0ZvckRhdGEoXG4gICAgZGF0YTogVCxcbiAgICBkYXRhSW5kZXg6IG51bWJlcixcbiAgICBjYWNoZT86IFdlYWtNYXA8Q2RrUm93RGVmPFQ+LCBSZW5kZXJSb3c8VD5bXT4sXG4gICk6IFJlbmRlclJvdzxUPltdIHtcbiAgICBjb25zdCByb3dEZWZzID0gdGhpcy5fZ2V0Um93RGVmcyhkYXRhLCBkYXRhSW5kZXgpO1xuXG4gICAgcmV0dXJuIHJvd0RlZnMubWFwKHJvd0RlZiA9PiB7XG4gICAgICBjb25zdCBjYWNoZWRSZW5kZXJSb3dzID0gY2FjaGUgJiYgY2FjaGUuaGFzKHJvd0RlZikgPyBjYWNoZS5nZXQocm93RGVmKSEgOiBbXTtcbiAgICAgIGlmIChjYWNoZWRSZW5kZXJSb3dzLmxlbmd0aCkge1xuICAgICAgICBjb25zdCBkYXRhUm93ID0gY2FjaGVkUmVuZGVyUm93cy5zaGlmdCgpITtcbiAgICAgICAgZGF0YVJvdy5kYXRhSW5kZXggPSBkYXRhSW5kZXg7XG4gICAgICAgIHJldHVybiBkYXRhUm93O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHtkYXRhLCByb3dEZWYsIGRhdGFJbmRleH07XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSBtYXAgY29udGFpbmluZyB0aGUgY29udGVudCdzIGNvbHVtbiBkZWZpbml0aW9ucy4gKi9cbiAgcHJpdmF0ZSBfY2FjaGVDb2x1bW5EZWZzKCkge1xuICAgIHRoaXMuX2NvbHVtbkRlZnNCeU5hbWUuY2xlYXIoKTtcblxuICAgIGNvbnN0IGNvbHVtbkRlZnMgPSBtZXJnZUFycmF5QW5kU2V0KFxuICAgICAgdGhpcy5fZ2V0T3duRGVmcyh0aGlzLl9jb250ZW50Q29sdW1uRGVmcyksXG4gICAgICB0aGlzLl9jdXN0b21Db2x1bW5EZWZzLFxuICAgICk7XG4gICAgY29sdW1uRGVmcy5mb3JFYWNoKGNvbHVtbkRlZiA9PiB7XG4gICAgICBpZiAoXG4gICAgICAgIHRoaXMuX2NvbHVtbkRlZnNCeU5hbWUuaGFzKGNvbHVtbkRlZi5uYW1lKSAmJlxuICAgICAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKVxuICAgICAgKSB7XG4gICAgICAgIHRocm93IGdldFRhYmxlRHVwbGljYXRlQ29sdW1uTmFtZUVycm9yKGNvbHVtbkRlZi5uYW1lKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2NvbHVtbkRlZnNCeU5hbWUuc2V0KGNvbHVtbkRlZi5uYW1lLCBjb2x1bW5EZWYpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIFVwZGF0ZSB0aGUgbGlzdCBvZiBhbGwgYXZhaWxhYmxlIHJvdyBkZWZpbml0aW9ucyB0aGF0IGNhbiBiZSB1c2VkLiAqL1xuICBwcml2YXRlIF9jYWNoZVJvd0RlZnMoKSB7XG4gICAgdGhpcy5faGVhZGVyUm93RGVmcyA9IG1lcmdlQXJyYXlBbmRTZXQoXG4gICAgICB0aGlzLl9nZXRPd25EZWZzKHRoaXMuX2NvbnRlbnRIZWFkZXJSb3dEZWZzKSxcbiAgICAgIHRoaXMuX2N1c3RvbUhlYWRlclJvd0RlZnMsXG4gICAgKTtcbiAgICB0aGlzLl9mb290ZXJSb3dEZWZzID0gbWVyZ2VBcnJheUFuZFNldChcbiAgICAgIHRoaXMuX2dldE93bkRlZnModGhpcy5fY29udGVudEZvb3RlclJvd0RlZnMpLFxuICAgICAgdGhpcy5fY3VzdG9tRm9vdGVyUm93RGVmcyxcbiAgICApO1xuICAgIHRoaXMuX3Jvd0RlZnMgPSBtZXJnZUFycmF5QW5kU2V0KHRoaXMuX2dldE93bkRlZnModGhpcy5fY29udGVudFJvd0RlZnMpLCB0aGlzLl9jdXN0b21Sb3dEZWZzKTtcblxuICAgIC8vIEFmdGVyIGFsbCByb3cgZGVmaW5pdGlvbnMgYXJlIGRldGVybWluZWQsIGZpbmQgdGhlIHJvdyBkZWZpbml0aW9uIHRvIGJlIGNvbnNpZGVyZWQgZGVmYXVsdC5cbiAgICBjb25zdCBkZWZhdWx0Um93RGVmcyA9IHRoaXMuX3Jvd0RlZnMuZmlsdGVyKGRlZiA9PiAhZGVmLndoZW4pO1xuICAgIGlmIChcbiAgICAgICF0aGlzLm11bHRpVGVtcGxhdGVEYXRhUm93cyAmJlxuICAgICAgZGVmYXVsdFJvd0RlZnMubGVuZ3RoID4gMSAmJlxuICAgICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSlcbiAgICApIHtcbiAgICAgIHRocm93IGdldFRhYmxlTXVsdGlwbGVEZWZhdWx0Um93RGVmc0Vycm9yKCk7XG4gICAgfVxuICAgIHRoaXMuX2RlZmF1bHRSb3dEZWYgPSBkZWZhdWx0Um93RGVmc1swXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGUgaGVhZGVyLCBkYXRhLCBvciBmb290ZXIgcm93cyBoYXZlIGNoYW5nZWQgd2hhdCBjb2x1bW5zIHRoZXkgd2FudCB0byBkaXNwbGF5IG9yXG4gICAqIHdoZXRoZXIgdGhlIHN0aWNreSBzdGF0ZXMgaGF2ZSBjaGFuZ2VkIGZvciB0aGUgaGVhZGVyIG9yIGZvb3Rlci4gSWYgdGhlcmUgaXMgYSBkaWZmLCB0aGVuXG4gICAqIHJlLXJlbmRlciB0aGF0IHNlY3Rpb24uXG4gICAqL1xuICBwcml2YXRlIF9yZW5kZXJVcGRhdGVkQ29sdW1ucygpOiBib29sZWFuIHtcbiAgICBjb25zdCBjb2x1bW5zRGlmZlJlZHVjZXIgPSAoYWNjOiBib29sZWFuLCBkZWY6IEJhc2VSb3dEZWYpID0+IGFjYyB8fCAhIWRlZi5nZXRDb2x1bW5zRGlmZigpO1xuXG4gICAgLy8gRm9yY2UgcmUtcmVuZGVyIGRhdGEgcm93cyBpZiB0aGUgbGlzdCBvZiBjb2x1bW4gZGVmaW5pdGlvbnMgaGF2ZSBjaGFuZ2VkLlxuICAgIGNvbnN0IGRhdGFDb2x1bW5zQ2hhbmdlZCA9IHRoaXMuX3Jvd0RlZnMucmVkdWNlKGNvbHVtbnNEaWZmUmVkdWNlciwgZmFsc2UpO1xuICAgIGlmIChkYXRhQ29sdW1uc0NoYW5nZWQpIHtcbiAgICAgIHRoaXMuX2ZvcmNlUmVuZGVyRGF0YVJvd3MoKTtcbiAgICB9XG5cbiAgICAvLyBGb3JjZSByZS1yZW5kZXIgaGVhZGVyL2Zvb3RlciByb3dzIGlmIHRoZSBsaXN0IG9mIGNvbHVtbiBkZWZpbml0aW9ucyBoYXZlIGNoYW5nZWQuXG4gICAgY29uc3QgaGVhZGVyQ29sdW1uc0NoYW5nZWQgPSB0aGlzLl9oZWFkZXJSb3dEZWZzLnJlZHVjZShjb2x1bW5zRGlmZlJlZHVjZXIsIGZhbHNlKTtcbiAgICBpZiAoaGVhZGVyQ29sdW1uc0NoYW5nZWQpIHtcbiAgICAgIHRoaXMuX2ZvcmNlUmVuZGVySGVhZGVyUm93cygpO1xuICAgIH1cblxuICAgIGNvbnN0IGZvb3RlckNvbHVtbnNDaGFuZ2VkID0gdGhpcy5fZm9vdGVyUm93RGVmcy5yZWR1Y2UoY29sdW1uc0RpZmZSZWR1Y2VyLCBmYWxzZSk7XG4gICAgaWYgKGZvb3RlckNvbHVtbnNDaGFuZ2VkKSB7XG4gICAgICB0aGlzLl9mb3JjZVJlbmRlckZvb3RlclJvd3MoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGF0YUNvbHVtbnNDaGFuZ2VkIHx8IGhlYWRlckNvbHVtbnNDaGFuZ2VkIHx8IGZvb3RlckNvbHVtbnNDaGFuZ2VkO1xuICB9XG5cbiAgLyoqXG4gICAqIFN3aXRjaCB0byB0aGUgcHJvdmlkZWQgZGF0YSBzb3VyY2UgYnkgcmVzZXR0aW5nIHRoZSBkYXRhIGFuZCB1bnN1YnNjcmliaW5nIGZyb20gdGhlIGN1cnJlbnRcbiAgICogcmVuZGVyIGNoYW5nZSBzdWJzY3JpcHRpb24gaWYgb25lIGV4aXN0cy4gSWYgdGhlIGRhdGEgc291cmNlIGlzIG51bGwsIGludGVycHJldCB0aGlzIGJ5XG4gICAqIGNsZWFyaW5nIHRoZSByb3cgb3V0bGV0LiBPdGhlcndpc2Ugc3RhcnQgbGlzdGVuaW5nIGZvciBuZXcgZGF0YS5cbiAgICovXG4gIHByaXZhdGUgX3N3aXRjaERhdGFTb3VyY2UoZGF0YVNvdXJjZTogQ2RrVGFibGVEYXRhU291cmNlSW5wdXQ8VD4pIHtcbiAgICB0aGlzLl9kYXRhID0gW107XG5cbiAgICBpZiAoaXNEYXRhU291cmNlKHRoaXMuZGF0YVNvdXJjZSkpIHtcbiAgICAgIHRoaXMuZGF0YVNvdXJjZS5kaXNjb25uZWN0KHRoaXMpO1xuICAgIH1cblxuICAgIC8vIFN0b3AgbGlzdGVuaW5nIGZvciBkYXRhIGZyb20gdGhlIHByZXZpb3VzIGRhdGEgc291cmNlLlxuICAgIGlmICh0aGlzLl9yZW5kZXJDaGFuZ2VTdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuX3JlbmRlckNoYW5nZVN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5fcmVuZGVyQ2hhbmdlU3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoIWRhdGFTb3VyY2UpIHtcbiAgICAgIGlmICh0aGlzLl9kYXRhRGlmZmVyKSB7XG4gICAgICAgIHRoaXMuX2RhdGFEaWZmZXIuZGlmZihbXSk7XG4gICAgICB9XG4gICAgICB0aGlzLl9yb3dPdXRsZXQudmlld0NvbnRhaW5lci5jbGVhcigpO1xuICAgIH1cblxuICAgIHRoaXMuX2RhdGFTb3VyY2UgPSBkYXRhU291cmNlO1xuICB9XG5cbiAgLyoqIFNldCB1cCBhIHN1YnNjcmlwdGlvbiBmb3IgdGhlIGRhdGEgcHJvdmlkZWQgYnkgdGhlIGRhdGEgc291cmNlLiAqL1xuICBwcml2YXRlIF9vYnNlcnZlUmVuZGVyQ2hhbmdlcygpIHtcbiAgICAvLyBJZiBubyBkYXRhIHNvdXJjZSBoYXMgYmVlbiBzZXQsIHRoZXJlIGlzIG5vdGhpbmcgdG8gb2JzZXJ2ZSBmb3IgY2hhbmdlcy5cbiAgICBpZiAoIXRoaXMuZGF0YVNvdXJjZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBkYXRhU3RyZWFtOiBPYnNlcnZhYmxlPHJlYWRvbmx5IFRbXT4gfCB1bmRlZmluZWQ7XG5cbiAgICBpZiAoaXNEYXRhU291cmNlKHRoaXMuZGF0YVNvdXJjZSkpIHtcbiAgICAgIGRhdGFTdHJlYW0gPSB0aGlzLmRhdGFTb3VyY2UuY29ubmVjdCh0aGlzKTtcbiAgICB9IGVsc2UgaWYgKGlzT2JzZXJ2YWJsZSh0aGlzLmRhdGFTb3VyY2UpKSB7XG4gICAgICBkYXRhU3RyZWFtID0gdGhpcy5kYXRhU291cmNlO1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLmRhdGFTb3VyY2UpKSB7XG4gICAgICBkYXRhU3RyZWFtID0gb2JzZXJ2YWJsZU9mKHRoaXMuZGF0YVNvdXJjZSk7XG4gICAgfVxuXG4gICAgaWYgKGRhdGFTdHJlYW0gPT09IHVuZGVmaW5lZCAmJiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgdGhyb3cgZ2V0VGFibGVVbmtub3duRGF0YVNvdXJjZUVycm9yKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fcmVuZGVyQ2hhbmdlU3Vic2NyaXB0aW9uID0gZGF0YVN0cmVhbSFcbiAgICAgIC5waXBlKHRha2VVbnRpbCh0aGlzLl9vbkRlc3Ryb3kpKVxuICAgICAgLnN1YnNjcmliZShkYXRhID0+IHtcbiAgICAgICAgdGhpcy5fZGF0YSA9IGRhdGEgfHwgW107XG4gICAgICAgIHRoaXMucmVuZGVyUm93cygpO1xuICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIGFueSBleGlzdGluZyBjb250ZW50IGluIHRoZSBoZWFkZXIgcm93IG91dGxldCBhbmQgY3JlYXRlcyBhIG5ldyBlbWJlZGRlZCB2aWV3XG4gICAqIGluIHRoZSBvdXRsZXQgdXNpbmcgdGhlIGhlYWRlciByb3cgZGVmaW5pdGlvbi5cbiAgICovXG4gIHByaXZhdGUgX2ZvcmNlUmVuZGVySGVhZGVyUm93cygpIHtcbiAgICAvLyBDbGVhciB0aGUgaGVhZGVyIHJvdyBvdXRsZXQgaWYgYW55IGNvbnRlbnQgZXhpc3RzLlxuICAgIGlmICh0aGlzLl9oZWFkZXJSb3dPdXRsZXQudmlld0NvbnRhaW5lci5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLl9oZWFkZXJSb3dPdXRsZXQudmlld0NvbnRhaW5lci5jbGVhcigpO1xuICAgIH1cblxuICAgIHRoaXMuX2hlYWRlclJvd0RlZnMuZm9yRWFjaCgoZGVmLCBpKSA9PiB0aGlzLl9yZW5kZXJSb3codGhpcy5faGVhZGVyUm93T3V0bGV0LCBkZWYsIGkpKTtcbiAgICB0aGlzLnVwZGF0ZVN0aWNreUhlYWRlclJvd1N0eWxlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFycyBhbnkgZXhpc3RpbmcgY29udGVudCBpbiB0aGUgZm9vdGVyIHJvdyBvdXRsZXQgYW5kIGNyZWF0ZXMgYSBuZXcgZW1iZWRkZWQgdmlld1xuICAgKiBpbiB0aGUgb3V0bGV0IHVzaW5nIHRoZSBmb290ZXIgcm93IGRlZmluaXRpb24uXG4gICAqL1xuICBwcml2YXRlIF9mb3JjZVJlbmRlckZvb3RlclJvd3MoKSB7XG4gICAgLy8gQ2xlYXIgdGhlIGZvb3RlciByb3cgb3V0bGV0IGlmIGFueSBjb250ZW50IGV4aXN0cy5cbiAgICBpZiAodGhpcy5fZm9vdGVyUm93T3V0bGV0LnZpZXdDb250YWluZXIubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5fZm9vdGVyUm93T3V0bGV0LnZpZXdDb250YWluZXIuY2xlYXIoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9mb290ZXJSb3dEZWZzLmZvckVhY2goKGRlZiwgaSkgPT4gdGhpcy5fcmVuZGVyUm93KHRoaXMuX2Zvb3RlclJvd091dGxldCwgZGVmLCBpKSk7XG4gICAgdGhpcy51cGRhdGVTdGlja3lGb290ZXJSb3dTdHlsZXMoKTtcbiAgfVxuXG4gIC8qKiBBZGRzIHRoZSBzdGlja3kgY29sdW1uIHN0eWxlcyBmb3IgdGhlIHJvd3MgYWNjb3JkaW5nIHRvIHRoZSBjb2x1bW5zJyBzdGljayBzdGF0ZXMuICovXG4gIHByaXZhdGUgX2FkZFN0aWNreUNvbHVtblN0eWxlcyhyb3dzOiBIVE1MRWxlbWVudFtdLCByb3dEZWY6IEJhc2VSb3dEZWYpIHtcbiAgICBjb25zdCBjb2x1bW5EZWZzID0gQXJyYXkuZnJvbShyb3dEZWYuY29sdW1ucyB8fCBbXSkubWFwKGNvbHVtbk5hbWUgPT4ge1xuICAgICAgY29uc3QgY29sdW1uRGVmID0gdGhpcy5fY29sdW1uRGVmc0J5TmFtZS5nZXQoY29sdW1uTmFtZSk7XG4gICAgICBpZiAoIWNvbHVtbkRlZiAmJiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgICB0aHJvdyBnZXRUYWJsZVVua25vd25Db2x1bW5FcnJvcihjb2x1bW5OYW1lKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjb2x1bW5EZWYhO1xuICAgIH0pO1xuICAgIGNvbnN0IHN0aWNreVN0YXJ0U3RhdGVzID0gY29sdW1uRGVmcy5tYXAoY29sdW1uRGVmID0+IGNvbHVtbkRlZi5zdGlja3kpO1xuICAgIGNvbnN0IHN0aWNreUVuZFN0YXRlcyA9IGNvbHVtbkRlZnMubWFwKGNvbHVtbkRlZiA9PiBjb2x1bW5EZWYuc3RpY2t5RW5kKTtcbiAgICB0aGlzLl9zdGlja3lTdHlsZXIudXBkYXRlU3RpY2t5Q29sdW1ucyhcbiAgICAgIHJvd3MsXG4gICAgICBzdGlja3lTdGFydFN0YXRlcyxcbiAgICAgIHN0aWNreUVuZFN0YXRlcyxcbiAgICAgICF0aGlzLl9maXhlZExheW91dCB8fCB0aGlzLl9mb3JjZVJlY2FsY3VsYXRlQ2VsbFdpZHRocyxcbiAgICApO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIGxpc3Qgb2Ygcm93cyB0aGF0IGhhdmUgYmVlbiByZW5kZXJlZCBpbiB0aGUgcm93IG91dGxldC4gKi9cbiAgX2dldFJlbmRlcmVkUm93cyhyb3dPdXRsZXQ6IFJvd091dGxldCk6IEhUTUxFbGVtZW50W10ge1xuICAgIGNvbnN0IHJlbmRlcmVkUm93czogSFRNTEVsZW1lbnRbXSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByb3dPdXRsZXQudmlld0NvbnRhaW5lci5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgdmlld1JlZiA9IHJvd091dGxldC52aWV3Q29udGFpbmVyLmdldChpKSEgYXMgRW1iZWRkZWRWaWV3UmVmPGFueT47XG4gICAgICByZW5kZXJlZFJvd3MucHVzaCh2aWV3UmVmLnJvb3ROb2Rlc1swXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlbmRlcmVkUm93cztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG1hdGNoaW5nIHJvdyBkZWZpbml0aW9ucyB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciB0aGlzIHJvdyBkYXRhLiBJZiB0aGVyZSBpcyBvbmx5XG4gICAqIG9uZSByb3cgZGVmaW5pdGlvbiwgaXQgaXMgcmV0dXJuZWQuIE90aGVyd2lzZSwgZmluZCB0aGUgcm93IGRlZmluaXRpb25zIHRoYXQgaGFzIGEgd2hlblxuICAgKiBwcmVkaWNhdGUgdGhhdCByZXR1cm5zIHRydWUgd2l0aCB0aGUgZGF0YS4gSWYgbm9uZSByZXR1cm4gdHJ1ZSwgcmV0dXJuIHRoZSBkZWZhdWx0IHJvd1xuICAgKiBkZWZpbml0aW9uLlxuICAgKi9cbiAgX2dldFJvd0RlZnMoZGF0YTogVCwgZGF0YUluZGV4OiBudW1iZXIpOiBDZGtSb3dEZWY8VD5bXSB7XG4gICAgaWYgKHRoaXMuX3Jvd0RlZnMubGVuZ3RoID09IDEpIHtcbiAgICAgIHJldHVybiBbdGhpcy5fcm93RGVmc1swXV07XG4gICAgfVxuXG4gICAgbGV0IHJvd0RlZnM6IENka1Jvd0RlZjxUPltdID0gW107XG4gICAgaWYgKHRoaXMubXVsdGlUZW1wbGF0ZURhdGFSb3dzKSB7XG4gICAgICByb3dEZWZzID0gdGhpcy5fcm93RGVmcy5maWx0ZXIoZGVmID0+ICFkZWYud2hlbiB8fCBkZWYud2hlbihkYXRhSW5kZXgsIGRhdGEpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHJvd0RlZiA9XG4gICAgICAgIHRoaXMuX3Jvd0RlZnMuZmluZChkZWYgPT4gZGVmLndoZW4gJiYgZGVmLndoZW4oZGF0YUluZGV4LCBkYXRhKSkgfHwgdGhpcy5fZGVmYXVsdFJvd0RlZjtcbiAgICAgIGlmIChyb3dEZWYpIHtcbiAgICAgICAgcm93RGVmcy5wdXNoKHJvd0RlZik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFyb3dEZWZzLmxlbmd0aCAmJiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgdGhyb3cgZ2V0VGFibGVNaXNzaW5nTWF0Y2hpbmdSb3dEZWZFcnJvcihkYXRhKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcm93RGVmcztcbiAgfVxuXG4gIHByaXZhdGUgX2dldEVtYmVkZGVkVmlld0FyZ3MoXG4gICAgcmVuZGVyUm93OiBSZW5kZXJSb3c8VD4sXG4gICAgaW5kZXg6IG51bWJlcixcbiAgKTogX1ZpZXdSZXBlYXRlckl0ZW1JbnNlcnRBcmdzPFJvd0NvbnRleHQ8VD4+IHtcbiAgICBjb25zdCByb3dEZWYgPSByZW5kZXJSb3cucm93RGVmO1xuICAgIGNvbnN0IGNvbnRleHQ6IFJvd0NvbnRleHQ8VD4gPSB7JGltcGxpY2l0OiByZW5kZXJSb3cuZGF0YX07XG4gICAgcmV0dXJuIHtcbiAgICAgIHRlbXBsYXRlUmVmOiByb3dEZWYudGVtcGxhdGUsXG4gICAgICBjb250ZXh0LFxuICAgICAgaW5kZXgsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IHJvdyB0ZW1wbGF0ZSBpbiB0aGUgb3V0bGV0IGFuZCBmaWxscyBpdCB3aXRoIHRoZSBzZXQgb2YgY2VsbCB0ZW1wbGF0ZXMuXG4gICAqIE9wdGlvbmFsbHkgdGFrZXMgYSBjb250ZXh0IHRvIHByb3ZpZGUgdG8gdGhlIHJvdyBhbmQgY2VsbHMsIGFzIHdlbGwgYXMgYW4gb3B0aW9uYWwgaW5kZXhcbiAgICogb2Ygd2hlcmUgdG8gcGxhY2UgdGhlIG5ldyByb3cgdGVtcGxhdGUgaW4gdGhlIG91dGxldC5cbiAgICovXG4gIHByaXZhdGUgX3JlbmRlclJvdyhcbiAgICBvdXRsZXQ6IFJvd091dGxldCxcbiAgICByb3dEZWY6IEJhc2VSb3dEZWYsXG4gICAgaW5kZXg6IG51bWJlcixcbiAgICBjb250ZXh0OiBSb3dDb250ZXh0PFQ+ID0ge30sXG4gICk6IEVtYmVkZGVkVmlld1JlZjxSb3dDb250ZXh0PFQ+PiB7XG4gICAgLy8gVE9ETyhhbmRyZXdzZWd1aW4pOiBlbmZvcmNlIHRoYXQgb25lIG91dGxldCB3YXMgaW5zdGFudGlhdGVkIGZyb20gY3JlYXRlRW1iZWRkZWRWaWV3XG4gICAgY29uc3QgdmlldyA9IG91dGxldC52aWV3Q29udGFpbmVyLmNyZWF0ZUVtYmVkZGVkVmlldyhyb3dEZWYudGVtcGxhdGUsIGNvbnRleHQsIGluZGV4KTtcbiAgICB0aGlzLl9yZW5kZXJDZWxsVGVtcGxhdGVGb3JJdGVtKHJvd0RlZiwgY29udGV4dCk7XG4gICAgcmV0dXJuIHZpZXc7XG4gIH1cblxuICBwcml2YXRlIF9yZW5kZXJDZWxsVGVtcGxhdGVGb3JJdGVtKHJvd0RlZjogQmFzZVJvd0RlZiwgY29udGV4dDogUm93Q29udGV4dDxUPikge1xuICAgIGZvciAobGV0IGNlbGxUZW1wbGF0ZSBvZiB0aGlzLl9nZXRDZWxsVGVtcGxhdGVzKHJvd0RlZikpIHtcbiAgICAgIGlmIChDZGtDZWxsT3V0bGV0Lm1vc3RSZWNlbnRDZWxsT3V0bGV0KSB7XG4gICAgICAgIENka0NlbGxPdXRsZXQubW9zdFJlY2VudENlbGxPdXRsZXQuX3ZpZXdDb250YWluZXIuY3JlYXRlRW1iZWRkZWRWaWV3KGNlbGxUZW1wbGF0ZSwgY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgaW5kZXgtcmVsYXRlZCBjb250ZXh0IGZvciBlYWNoIHJvdyB0byByZWZsZWN0IGFueSBjaGFuZ2VzIGluIHRoZSBpbmRleCBvZiB0aGUgcm93cyxcbiAgICogZS5nLiBmaXJzdC9sYXN0L2V2ZW4vb2RkLlxuICAgKi9cbiAgcHJpdmF0ZSBfdXBkYXRlUm93SW5kZXhDb250ZXh0KCkge1xuICAgIGNvbnN0IHZpZXdDb250YWluZXIgPSB0aGlzLl9yb3dPdXRsZXQudmlld0NvbnRhaW5lcjtcbiAgICBmb3IgKGxldCByZW5kZXJJbmRleCA9IDAsIGNvdW50ID0gdmlld0NvbnRhaW5lci5sZW5ndGg7IHJlbmRlckluZGV4IDwgY291bnQ7IHJlbmRlckluZGV4KyspIHtcbiAgICAgIGNvbnN0IHZpZXdSZWYgPSB2aWV3Q29udGFpbmVyLmdldChyZW5kZXJJbmRleCkgYXMgUm93Vmlld1JlZjxUPjtcbiAgICAgIGNvbnN0IGNvbnRleHQgPSB2aWV3UmVmLmNvbnRleHQgYXMgUm93Q29udGV4dDxUPjtcbiAgICAgIGNvbnRleHQuY291bnQgPSBjb3VudDtcbiAgICAgIGNvbnRleHQuZmlyc3QgPSByZW5kZXJJbmRleCA9PT0gMDtcbiAgICAgIGNvbnRleHQubGFzdCA9IHJlbmRlckluZGV4ID09PSBjb3VudCAtIDE7XG4gICAgICBjb250ZXh0LmV2ZW4gPSByZW5kZXJJbmRleCAlIDIgPT09IDA7XG4gICAgICBjb250ZXh0Lm9kZCA9ICFjb250ZXh0LmV2ZW47XG5cbiAgICAgIGlmICh0aGlzLm11bHRpVGVtcGxhdGVEYXRhUm93cykge1xuICAgICAgICBjb250ZXh0LmRhdGFJbmRleCA9IHRoaXMuX3JlbmRlclJvd3NbcmVuZGVySW5kZXhdLmRhdGFJbmRleDtcbiAgICAgICAgY29udGV4dC5yZW5kZXJJbmRleCA9IHJlbmRlckluZGV4O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udGV4dC5pbmRleCA9IHRoaXMuX3JlbmRlclJvd3NbcmVuZGVySW5kZXhdLmRhdGFJbmRleDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogR2V0cyB0aGUgY29sdW1uIGRlZmluaXRpb25zIGZvciB0aGUgcHJvdmlkZWQgcm93IGRlZi4gKi9cbiAgcHJpdmF0ZSBfZ2V0Q2VsbFRlbXBsYXRlcyhyb3dEZWY6IEJhc2VSb3dEZWYpOiBUZW1wbGF0ZVJlZjxhbnk+W10ge1xuICAgIGlmICghcm93RGVmIHx8ICFyb3dEZWYuY29sdW1ucykge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICByZXR1cm4gQXJyYXkuZnJvbShyb3dEZWYuY29sdW1ucywgY29sdW1uSWQgPT4ge1xuICAgICAgY29uc3QgY29sdW1uID0gdGhpcy5fY29sdW1uRGVmc0J5TmFtZS5nZXQoY29sdW1uSWQpO1xuXG4gICAgICBpZiAoIWNvbHVtbiAmJiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgICB0aHJvdyBnZXRUYWJsZVVua25vd25Db2x1bW5FcnJvcihjb2x1bW5JZCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByb3dEZWYuZXh0cmFjdENlbGxUZW1wbGF0ZShjb2x1bW4hKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBBZGRzIG5hdGl2ZSB0YWJsZSBzZWN0aW9ucyAoZS5nLiB0Ym9keSkgYW5kIG1vdmVzIHRoZSByb3cgb3V0bGV0cyBpbnRvIHRoZW0uICovXG4gIHByaXZhdGUgX2FwcGx5TmF0aXZlVGFibGVTZWN0aW9ucygpIHtcbiAgICBjb25zdCBkb2N1bWVudEZyYWdtZW50ID0gdGhpcy5fZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIGNvbnN0IHNlY3Rpb25zID0gW1xuICAgICAge3RhZzogJ3RoZWFkJywgb3V0bGV0czogW3RoaXMuX2hlYWRlclJvd091dGxldF19LFxuICAgICAge3RhZzogJ3Rib2R5Jywgb3V0bGV0czogW3RoaXMuX3Jvd091dGxldCwgdGhpcy5fbm9EYXRhUm93T3V0bGV0XX0sXG4gICAgICB7dGFnOiAndGZvb3QnLCBvdXRsZXRzOiBbdGhpcy5fZm9vdGVyUm93T3V0bGV0XX0sXG4gICAgXTtcblxuICAgIGZvciAoY29uc3Qgc2VjdGlvbiBvZiBzZWN0aW9ucykge1xuICAgICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoc2VjdGlvbi50YWcpO1xuICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAncm93Z3JvdXAnKTtcblxuICAgICAgZm9yIChjb25zdCBvdXRsZXQgb2Ygc2VjdGlvbi5vdXRsZXRzKSB7XG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQob3V0bGV0LmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCk7XG4gICAgICB9XG5cbiAgICAgIGRvY3VtZW50RnJhZ21lbnQuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgfVxuXG4gICAgLy8gVXNlIGEgRG9jdW1lbnRGcmFnbWVudCBzbyB3ZSBkb24ndCBoaXQgdGhlIERPTSBvbiBlYWNoIGl0ZXJhdGlvbi5cbiAgICB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuYXBwZW5kQ2hpbGQoZG9jdW1lbnRGcmFnbWVudCk7XG4gIH1cblxuICAvKipcbiAgICogRm9yY2VzIGEgcmUtcmVuZGVyIG9mIHRoZSBkYXRhIHJvd3MuIFNob3VsZCBiZSBjYWxsZWQgaW4gY2FzZXMgd2hlcmUgdGhlcmUgaGFzIGJlZW4gYW4gaW5wdXRcbiAgICogY2hhbmdlIHRoYXQgYWZmZWN0cyB0aGUgZXZhbHVhdGlvbiBvZiB3aGljaCByb3dzIHNob3VsZCBiZSByZW5kZXJlZCwgZS5nLiB0b2dnbGluZ1xuICAgKiBgbXVsdGlUZW1wbGF0ZURhdGFSb3dzYCBvciBhZGRpbmcvcmVtb3Zpbmcgcm93IGRlZmluaXRpb25zLlxuICAgKi9cbiAgcHJpdmF0ZSBfZm9yY2VSZW5kZXJEYXRhUm93cygpIHtcbiAgICB0aGlzLl9kYXRhRGlmZmVyLmRpZmYoW10pO1xuICAgIHRoaXMuX3Jvd091dGxldC52aWV3Q29udGFpbmVyLmNsZWFyKCk7XG4gICAgdGhpcy5yZW5kZXJSb3dzKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZXJlIGhhcyBiZWVuIGEgY2hhbmdlIGluIHN0aWNreSBzdGF0ZXMgc2luY2UgbGFzdCBjaGVjayBhbmQgYXBwbGllcyB0aGUgY29ycmVjdFxuICAgKiBzdGlja3kgc3R5bGVzLiBTaW5jZSBjaGVja2luZyByZXNldHMgdGhlIFwiZGlydHlcIiBzdGF0ZSwgdGhpcyBzaG91bGQgb25seSBiZSBwZXJmb3JtZWQgb25jZVxuICAgKiBkdXJpbmcgYSBjaGFuZ2UgZGV0ZWN0aW9uIGFuZCBhZnRlciB0aGUgaW5wdXRzIGFyZSBzZXR0bGVkIChhZnRlciBjb250ZW50IGNoZWNrKS5cbiAgICovXG4gIHByaXZhdGUgX2NoZWNrU3RpY2t5U3RhdGVzKCkge1xuICAgIGNvbnN0IHN0aWNreUNoZWNrUmVkdWNlciA9IChcbiAgICAgIGFjYzogYm9vbGVhbixcbiAgICAgIGQ6IENka0hlYWRlclJvd0RlZiB8IENka0Zvb3RlclJvd0RlZiB8IENka0NvbHVtbkRlZixcbiAgICApID0+IHtcbiAgICAgIHJldHVybiBhY2MgfHwgZC5oYXNTdGlja3lDaGFuZ2VkKCk7XG4gICAgfTtcblxuICAgIC8vIE5vdGUgdGhhdCB0aGUgY2hlY2sgbmVlZHMgdG8gb2NjdXIgZm9yIGV2ZXJ5IGRlZmluaXRpb24gc2luY2UgaXQgbm90aWZpZXMgdGhlIGRlZmluaXRpb25cbiAgICAvLyB0aGF0IGl0IGNhbiByZXNldCBpdHMgZGlydHkgc3RhdGUuIFVzaW5nIGFub3RoZXIgb3BlcmF0b3IgbGlrZSBgc29tZWAgbWF5IHNob3J0LWNpcmN1aXRcbiAgICAvLyByZW1haW5pbmcgZGVmaW5pdGlvbnMgYW5kIGxlYXZlIHRoZW0gaW4gYW4gdW5jaGVja2VkIHN0YXRlLlxuXG4gICAgaWYgKHRoaXMuX2hlYWRlclJvd0RlZnMucmVkdWNlKHN0aWNreUNoZWNrUmVkdWNlciwgZmFsc2UpKSB7XG4gICAgICB0aGlzLnVwZGF0ZVN0aWNreUhlYWRlclJvd1N0eWxlcygpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9mb290ZXJSb3dEZWZzLnJlZHVjZShzdGlja3lDaGVja1JlZHVjZXIsIGZhbHNlKSkge1xuICAgICAgdGhpcy51cGRhdGVTdGlja3lGb290ZXJSb3dTdHlsZXMoKTtcbiAgICB9XG5cbiAgICBpZiAoQXJyYXkuZnJvbSh0aGlzLl9jb2x1bW5EZWZzQnlOYW1lLnZhbHVlcygpKS5yZWR1Y2Uoc3RpY2t5Q2hlY2tSZWR1Y2VyLCBmYWxzZSkpIHtcbiAgICAgIHRoaXMuX3N0aWNreUNvbHVtblN0eWxlc05lZWRSZXNldCA9IHRydWU7XG4gICAgICB0aGlzLnVwZGF0ZVN0aWNreUNvbHVtblN0eWxlcygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIHRoZSBzdGlja3kgc3R5bGVyIHRoYXQgd2lsbCBiZSB1c2VkIGZvciBzdGlja3kgcm93cyBhbmQgY29sdW1ucy4gTGlzdGVuc1xuICAgKiBmb3IgZGlyZWN0aW9uYWxpdHkgY2hhbmdlcyBhbmQgcHJvdmlkZXMgdGhlIGxhdGVzdCBkaXJlY3Rpb24gdG8gdGhlIHN0eWxlci4gUmUtYXBwbGllcyBjb2x1bW5cbiAgICogc3RpY2tpbmVzcyB3aGVuIGRpcmVjdGlvbmFsaXR5IGNoYW5nZXMuXG4gICAqL1xuICBwcml2YXRlIF9zZXR1cFN0aWNreVN0eWxlcigpIHtcbiAgICBjb25zdCBkaXJlY3Rpb246IERpcmVjdGlvbiA9IHRoaXMuX2RpciA/IHRoaXMuX2Rpci52YWx1ZSA6ICdsdHInO1xuICAgIHRoaXMuX3N0aWNreVN0eWxlciA9IG5ldyBTdGlja3lTdHlsZXIoXG4gICAgICB0aGlzLl9pc05hdGl2ZUh0bWxUYWJsZSxcbiAgICAgIHRoaXMuc3RpY2t5Q3NzQ2xhc3MsXG4gICAgICBkaXJlY3Rpb24sXG4gICAgICB0aGlzLl9jb2FsZXNjZWRTdHlsZVNjaGVkdWxlcixcbiAgICAgIHRoaXMuX3BsYXRmb3JtLmlzQnJvd3NlcixcbiAgICAgIHRoaXMubmVlZHNQb3NpdGlvblN0aWNreU9uRWxlbWVudCxcbiAgICAgIHRoaXMuX3N0aWNreVBvc2l0aW9uaW5nTGlzdGVuZXIsXG4gICAgKTtcbiAgICAodGhpcy5fZGlyID8gdGhpcy5fZGlyLmNoYW5nZSA6IG9ic2VydmFibGVPZjxEaXJlY3Rpb24+KCkpXG4gICAgICAucGlwZSh0YWtlVW50aWwodGhpcy5fb25EZXN0cm95KSlcbiAgICAgIC5zdWJzY3JpYmUodmFsdWUgPT4ge1xuICAgICAgICB0aGlzLl9zdGlja3lTdHlsZXIuZGlyZWN0aW9uID0gdmFsdWU7XG4gICAgICAgIHRoaXMudXBkYXRlU3RpY2t5Q29sdW1uU3R5bGVzKCk7XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKiBGaWx0ZXJzIGRlZmluaXRpb25zIHRoYXQgYmVsb25nIHRvIHRoaXMgdGFibGUgZnJvbSBhIFF1ZXJ5TGlzdC4gKi9cbiAgcHJpdmF0ZSBfZ2V0T3duRGVmczxJIGV4dGVuZHMge190YWJsZT86IGFueX0+KGl0ZW1zOiBRdWVyeUxpc3Q8ST4pOiBJW10ge1xuICAgIHJldHVybiBpdGVtcy5maWx0ZXIoaXRlbSA9PiAhaXRlbS5fdGFibGUgfHwgaXRlbS5fdGFibGUgPT09IHRoaXMpO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgb3IgcmVtb3ZlcyB0aGUgbm8gZGF0YSByb3csIGRlcGVuZGluZyBvbiB3aGV0aGVyIGFueSBkYXRhIGlzIGJlaW5nIHNob3duLiAqL1xuICBwcml2YXRlIF91cGRhdGVOb0RhdGFSb3coKSB7XG4gICAgY29uc3Qgbm9EYXRhUm93ID0gdGhpcy5fY3VzdG9tTm9EYXRhUm93IHx8IHRoaXMuX25vRGF0YVJvdztcblxuICAgIGlmICghbm9EYXRhUm93KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc2hvdWxkU2hvdyA9IHRoaXMuX3Jvd091dGxldC52aWV3Q29udGFpbmVyLmxlbmd0aCA9PT0gMDtcblxuICAgIGlmIChzaG91bGRTaG93ID09PSB0aGlzLl9pc1Nob3dpbmdOb0RhdGFSb3cpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLl9ub0RhdGFSb3dPdXRsZXQudmlld0NvbnRhaW5lcjtcblxuICAgIGlmIChzaG91bGRTaG93KSB7XG4gICAgICBjb25zdCB2aWV3ID0gY29udGFpbmVyLmNyZWF0ZUVtYmVkZGVkVmlldyhub0RhdGFSb3cudGVtcGxhdGVSZWYpO1xuICAgICAgY29uc3Qgcm9vdE5vZGU6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkID0gdmlldy5yb290Tm9kZXNbMF07XG5cbiAgICAgIC8vIE9ubHkgYWRkIHRoZSBhdHRyaWJ1dGVzIGlmIHdlIGhhdmUgYSBzaW5nbGUgcm9vdCBub2RlIHNpbmNlIGl0J3MgaGFyZFxuICAgICAgLy8gdG8gZmlndXJlIG91dCB3aGljaCBvbmUgdG8gYWRkIGl0IHRvIHdoZW4gdGhlcmUgYXJlIG11bHRpcGxlLlxuICAgICAgaWYgKHZpZXcucm9vdE5vZGVzLmxlbmd0aCA9PT0gMSAmJiByb290Tm9kZT8ubm9kZVR5cGUgPT09IHRoaXMuX2RvY3VtZW50LkVMRU1FTlRfTk9ERSkge1xuICAgICAgICByb290Tm9kZS5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAncm93Jyk7XG4gICAgICAgIHJvb3ROb2RlLmNsYXNzTGlzdC5hZGQobm9EYXRhUm93Ll9jb250ZW50Q2xhc3NOYW1lKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29udGFpbmVyLmNsZWFyKCk7XG4gICAgfVxuXG4gICAgdGhpcy5faXNTaG93aW5nTm9EYXRhUm93ID0gc2hvdWxkU2hvdztcbiAgfVxufVxuXG4vKiogVXRpbGl0eSBmdW5jdGlvbiB0aGF0IGdldHMgYSBtZXJnZWQgbGlzdCBvZiB0aGUgZW50cmllcyBpbiBhbiBhcnJheSBhbmQgdmFsdWVzIG9mIGEgU2V0LiAqL1xuZnVuY3Rpb24gbWVyZ2VBcnJheUFuZFNldDxUPihhcnJheTogVFtdLCBzZXQ6IFNldDxUPik6IFRbXSB7XG4gIHJldHVybiBhcnJheS5jb25jYXQoQXJyYXkuZnJvbShzZXQpKTtcbn1cbiJdfQ==