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
import { Attribute, ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChild, ContentChildren, Directive, ElementRef, EmbeddedViewRef, EventEmitter, Inject, Input, IterableDiffers, NgZone, Optional, Output, QueryList, SkipSelf, ViewChild, ViewContainerRef, ViewEncapsulation, } from '@angular/core';
import { BehaviorSubject, isObservable, of as observableOf, Subject, } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
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
    _stickyPositioningListener, 
    /**
     * @deprecated `_ngZone` parameter to become required.
     * @breaking-change 14.0.0
     */
    _ngZone) {
        this._differs = _differs;
        this._changeDetectorRef = _changeDetectorRef;
        this._elementRef = _elementRef;
        this._dir = _dir;
        this._platform = _platform;
        this._viewRepeater = _viewRepeater;
        this._coalescedStyleScheduler = _coalescedStyleScheduler;
        this._viewportRuler = _viewportRuler;
        this._stickyPositioningListener = _stickyPositioningListener;
        this._ngZone = _ngZone;
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
        // Allow the new row data to render before measuring it.
        // @breaking-change 14.0.0 Remove undefined check once _ngZone is required.
        if (this._ngZone && NgZone.isInAngularZone()) {
            this._ngZone.onStable.pipe(take(1), takeUntil(this._onDestroy)).subscribe(() => {
                this.updateStickyColumnStyles();
            });
        }
        else {
            this.updateStickyColumnStyles();
        }
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
CdkTable.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: CdkTable, deps: [{ token: i0.IterableDiffers }, { token: i0.ChangeDetectorRef }, { token: i0.ElementRef }, { token: 'role', attribute: true }, { token: i1.Directionality, optional: true }, { token: DOCUMENT }, { token: i2.Platform }, { token: _VIEW_REPEATER_STRATEGY }, { token: _COALESCED_STYLE_SCHEDULER }, { token: i3.ViewportRuler }, { token: STICKY_POSITIONING_LISTENER, optional: true, skipSelf: true }, { token: i0.NgZone, optional: true }], target: i0.ɵɵFactoryTarget.Component });
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
                }] }, { type: i0.NgZone, decorators: [{
                    type: Optional
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RhYmxlL3RhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBWSxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM1RCxPQUFPLEVBQWUscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRSxPQUFPLEVBR0wsNEJBQTRCLEVBQzVCLDRCQUE0QixFQUM1QixZQUFZLEVBQ1osdUJBQXVCLEdBS3hCLE1BQU0sMEJBQTBCLENBQUM7QUFDbEMsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQy9DLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNyRCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUVMLFNBQVMsRUFDVCx1QkFBdUIsRUFDdkIsaUJBQWlCLEVBQ2pCLFNBQVMsRUFDVCxZQUFZLEVBQ1osZUFBZSxFQUNmLFNBQVMsRUFDVCxVQUFVLEVBQ1YsZUFBZSxFQUNmLFlBQVksRUFDWixNQUFNLEVBQ04sS0FBSyxFQUdMLGVBQWUsRUFDZixNQUFNLEVBR04sUUFBUSxFQUNSLE1BQU0sRUFDTixTQUFTLEVBQ1QsUUFBUSxFQUdSLFNBQVMsRUFDVCxnQkFBZ0IsRUFDaEIsaUJBQWlCLEdBQ2xCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFDTCxlQUFlLEVBQ2YsWUFBWSxFQUVaLEVBQUUsSUFBSSxZQUFZLEVBQ2xCLE9BQU8sR0FFUixNQUFNLE1BQU0sQ0FBQztBQUNkLE9BQU8sRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDL0MsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUNwQyxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsMEJBQTBC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QU87c0JBRFYsS0FBSztnQkFpQ0YsVUFBVTtzQkFEYixLQUFLO2dCQWtCRixxQkFBcUI7c0JBRHhCLEtBQUs7Z0JBcUJGLFdBQVc7c0JBRGQsS0FBSztnQkFrQkcsY0FBYztzQkFEdEIsTUFBTTtnQkFpQm1DLFVBQVU7c0JBQW5ELFNBQVM7dUJBQUMsYUFBYSxFQUFFLEVBQUMsTUFBTSxFQUFFLElBQUksRUFBQztnQkFDSSxnQkFBZ0I7c0JBQTNELFNBQVM7dUJBQUMsZUFBZSxFQUFFLEVBQUMsTUFBTSxFQUFFLElBQUksRUFBQztnQkFDRSxnQkFBZ0I7c0JBQTNELFNBQVM7dUJBQUMsZUFBZSxFQUFFLEVBQUMsTUFBTSxFQUFFLElBQUksRUFBQztnQkFDRSxnQkFBZ0I7c0JBQTNELFNBQVM7dUJBQUMsZUFBZSxFQUFFLEVBQUMsTUFBTSxFQUFFLElBQUksRUFBQztnQkFNVSxrQkFBa0I7c0JBQXJFLGVBQWU7dUJBQUMsWUFBWSxFQUFFLEVBQUMsV0FBVyxFQUFFLElBQUksRUFBQztnQkFHRCxlQUFlO3NCQUEvRCxlQUFlO3VCQUFDLFNBQVMsRUFBRSxFQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUM7Z0JBTS9DLHFCQUFxQjtzQkFIcEIsZUFBZTt1QkFBQyxlQUFlLEVBQUU7d0JBQ2hDLFdBQVcsRUFBRSxJQUFJO3FCQUNsQjtnQkFPRCxxQkFBcUI7c0JBSHBCLGVBQWU7dUJBQUMsZUFBZSxFQUFFO3dCQUNoQyxXQUFXLEVBQUUsSUFBSTtxQkFDbEI7Z0JBSTJCLFVBQVU7c0JBQXJDLFlBQVk7dUJBQUMsWUFBWTs7QUE2ekI1QiwrRkFBK0Y7QUFDL0YsU0FBUyxnQkFBZ0IsQ0FBSSxLQUFVLEVBQUUsR0FBVztJQUNsRCxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3ZDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3Rpb24sIERpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge0Jvb2xlYW5JbnB1dCwgY29lcmNlQm9vbGVhblByb3BlcnR5fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtcbiAgQ29sbGVjdGlvblZpZXdlcixcbiAgRGF0YVNvdXJjZSxcbiAgX0Rpc3Bvc2VWaWV3UmVwZWF0ZXJTdHJhdGVneSxcbiAgX1JlY3ljbGVWaWV3UmVwZWF0ZXJTdHJhdGVneSxcbiAgaXNEYXRhU291cmNlLFxuICBfVklFV19SRVBFQVRFUl9TVFJBVEVHWSxcbiAgX1ZpZXdSZXBlYXRlcixcbiAgX1ZpZXdSZXBlYXRlckl0ZW1DaGFuZ2UsXG4gIF9WaWV3UmVwZWF0ZXJJdGVtSW5zZXJ0QXJncyxcbiAgX1ZpZXdSZXBlYXRlck9wZXJhdGlvbixcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvbGxlY3Rpb25zJztcbmltcG9ydCB7UGxhdGZvcm19IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge1ZpZXdwb3J0UnVsZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9zY3JvbGxpbmcnO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7XG4gIEFmdGVyQ29udGVudENoZWNrZWQsXG4gIEF0dHJpYnV0ZSxcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBDb21wb25lbnQsXG4gIENvbnRlbnRDaGlsZCxcbiAgQ29udGVudENoaWxkcmVuLFxuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEVtYmVkZGVkVmlld1JlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBJbmplY3QsXG4gIElucHV0LFxuICBJdGVyYWJsZUNoYW5nZVJlY29yZCxcbiAgSXRlcmFibGVEaWZmZXIsXG4gIEl0ZXJhYmxlRGlmZmVycyxcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIE9uSW5pdCxcbiAgT3B0aW9uYWwsXG4gIE91dHB1dCxcbiAgUXVlcnlMaXN0LFxuICBTa2lwU2VsZixcbiAgVGVtcGxhdGVSZWYsXG4gIFRyYWNrQnlGdW5jdGlvbixcbiAgVmlld0NoaWxkLFxuICBWaWV3Q29udGFpbmVyUmVmLFxuICBWaWV3RW5jYXBzdWxhdGlvbixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1xuICBCZWhhdmlvclN1YmplY3QsXG4gIGlzT2JzZXJ2YWJsZSxcbiAgT2JzZXJ2YWJsZSxcbiAgb2YgYXMgb2JzZXJ2YWJsZU9mLFxuICBTdWJqZWN0LFxuICBTdWJzY3JpcHRpb24sXG59IGZyb20gJ3J4anMnO1xuaW1wb3J0IHt0YWtlLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7Q2RrQ29sdW1uRGVmfSBmcm9tICcuL2NlbGwnO1xuaW1wb3J0IHtfQ29hbGVzY2VkU3R5bGVTY2hlZHVsZXIsIF9DT0FMRVNDRURfU1RZTEVfU0NIRURVTEVSfSBmcm9tICcuL2NvYWxlc2NlZC1zdHlsZS1zY2hlZHVsZXInO1xuaW1wb3J0IHtcbiAgQmFzZVJvd0RlZixcbiAgQ2RrQ2VsbE91dGxldCxcbiAgQ2RrQ2VsbE91dGxldE11bHRpUm93Q29udGV4dCxcbiAgQ2RrQ2VsbE91dGxldFJvd0NvbnRleHQsXG4gIENka0Zvb3RlclJvd0RlZixcbiAgQ2RrSGVhZGVyUm93RGVmLFxuICBDZGtOb0RhdGFSb3csXG4gIENka1Jvd0RlZixcbn0gZnJvbSAnLi9yb3cnO1xuaW1wb3J0IHtTdGlja3lTdHlsZXJ9IGZyb20gJy4vc3RpY2t5LXN0eWxlcic7XG5pbXBvcnQge1xuICBnZXRUYWJsZUR1cGxpY2F0ZUNvbHVtbk5hbWVFcnJvcixcbiAgZ2V0VGFibGVNaXNzaW5nTWF0Y2hpbmdSb3dEZWZFcnJvcixcbiAgZ2V0VGFibGVNaXNzaW5nUm93RGVmc0Vycm9yLFxuICBnZXRUYWJsZU11bHRpcGxlRGVmYXVsdFJvd0RlZnNFcnJvcixcbiAgZ2V0VGFibGVVbmtub3duQ29sdW1uRXJyb3IsXG4gIGdldFRhYmxlVW5rbm93bkRhdGFTb3VyY2VFcnJvcixcbn0gZnJvbSAnLi90YWJsZS1lcnJvcnMnO1xuaW1wb3J0IHtTVElDS1lfUE9TSVRJT05JTkdfTElTVEVORVIsIFN0aWNreVBvc2l0aW9uaW5nTGlzdGVuZXJ9IGZyb20gJy4vc3RpY2t5LXBvc2l0aW9uLWxpc3RlbmVyJztcbmltcG9ydCB7Q0RLX1RBQkxFfSBmcm9tICcuL3Rva2Vucyc7XG5cbi8qKlxuICogRW5hYmxlcyB0aGUgcmVjeWNsZSB2aWV3IHJlcGVhdGVyIHN0cmF0ZWd5LCB3aGljaCByZWR1Y2VzIHJlbmRlcmluZyBsYXRlbmN5LiBOb3QgY29tcGF0aWJsZSB3aXRoXG4gKiB0YWJsZXMgdGhhdCBhbmltYXRlIHJvd3MuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ2Nkay10YWJsZVtyZWN5Y2xlUm93c10sIHRhYmxlW2Nkay10YWJsZV1bcmVjeWNsZVJvd3NdJyxcbiAgcHJvdmlkZXJzOiBbe3Byb3ZpZGU6IF9WSUVXX1JFUEVBVEVSX1NUUkFURUdZLCB1c2VDbGFzczogX1JlY3ljbGVWaWV3UmVwZWF0ZXJTdHJhdGVneX1dLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtSZWN5Y2xlUm93cyB7fVxuXG4vKiogSW50ZXJmYWNlIHVzZWQgdG8gcHJvdmlkZSBhbiBvdXRsZXQgZm9yIHJvd3MgdG8gYmUgaW5zZXJ0ZWQgaW50by4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUm93T3V0bGV0IHtcbiAgdmlld0NvbnRhaW5lcjogVmlld0NvbnRhaW5lclJlZjtcbn1cblxuLyoqXG4gKiBVbmlvbiBvZiB0aGUgdHlwZXMgdGhhdCBjYW4gYmUgc2V0IGFzIHRoZSBkYXRhIHNvdXJjZSBmb3IgYSBgQ2RrVGFibGVgLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG50eXBlIENka1RhYmxlRGF0YVNvdXJjZUlucHV0PFQ+ID0gcmVhZG9ubHkgVFtdIHwgRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8cmVhZG9ubHkgVFtdPjtcblxuLyoqXG4gKiBQcm92aWRlcyBhIGhhbmRsZSBmb3IgdGhlIHRhYmxlIHRvIGdyYWIgdGhlIHZpZXcgY29udGFpbmVyJ3MgbmctY29udGFpbmVyIHRvIGluc2VydCBkYXRhIHJvd3MuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbkBEaXJlY3RpdmUoe3NlbGVjdG9yOiAnW3Jvd091dGxldF0nfSlcbmV4cG9ydCBjbGFzcyBEYXRhUm93T3V0bGV0IGltcGxlbWVudHMgUm93T3V0bGV0IHtcbiAgY29uc3RydWN0b3IocHVibGljIHZpZXdDb250YWluZXI6IFZpZXdDb250YWluZXJSZWYsIHB1YmxpYyBlbGVtZW50UmVmOiBFbGVtZW50UmVmKSB7fVxufVxuXG4vKipcbiAqIFByb3ZpZGVzIGEgaGFuZGxlIGZvciB0aGUgdGFibGUgdG8gZ3JhYiB0aGUgdmlldyBjb250YWluZXIncyBuZy1jb250YWluZXIgdG8gaW5zZXJ0IHRoZSBoZWFkZXIuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbkBEaXJlY3RpdmUoe3NlbGVjdG9yOiAnW2hlYWRlclJvd091dGxldF0nfSlcbmV4cG9ydCBjbGFzcyBIZWFkZXJSb3dPdXRsZXQgaW1wbGVtZW50cyBSb3dPdXRsZXQge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgdmlld0NvbnRhaW5lcjogVmlld0NvbnRhaW5lclJlZiwgcHVibGljIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHt9XG59XG5cbi8qKlxuICogUHJvdmlkZXMgYSBoYW5kbGUgZm9yIHRoZSB0YWJsZSB0byBncmFiIHRoZSB2aWV3IGNvbnRhaW5lcidzIG5nLWNvbnRhaW5lciB0byBpbnNlcnQgdGhlIGZvb3Rlci5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuQERpcmVjdGl2ZSh7c2VsZWN0b3I6ICdbZm9vdGVyUm93T3V0bGV0XSd9KVxuZXhwb3J0IGNsYXNzIEZvb3RlclJvd091dGxldCBpbXBsZW1lbnRzIFJvd091dGxldCB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyB2aWV3Q29udGFpbmVyOiBWaWV3Q29udGFpbmVyUmVmLCBwdWJsaWMgZWxlbWVudFJlZjogRWxlbWVudFJlZikge31cbn1cblxuLyoqXG4gKiBQcm92aWRlcyBhIGhhbmRsZSBmb3IgdGhlIHRhYmxlIHRvIGdyYWIgdGhlIHZpZXdcbiAqIGNvbnRhaW5lcidzIG5nLWNvbnRhaW5lciB0byBpbnNlcnQgdGhlIG5vIGRhdGEgcm93LlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5ARGlyZWN0aXZlKHtzZWxlY3RvcjogJ1tub0RhdGFSb3dPdXRsZXRdJ30pXG5leHBvcnQgY2xhc3MgTm9EYXRhUm93T3V0bGV0IGltcGxlbWVudHMgUm93T3V0bGV0IHtcbiAgY29uc3RydWN0b3IocHVibGljIHZpZXdDb250YWluZXI6IFZpZXdDb250YWluZXJSZWYsIHB1YmxpYyBlbGVtZW50UmVmOiBFbGVtZW50UmVmKSB7fVxufVxuXG4vKipcbiAqIFRoZSB0YWJsZSB0ZW1wbGF0ZSB0aGF0IGNhbiBiZSB1c2VkIGJ5IHRoZSBtYXQtdGFibGUuIFNob3VsZCBub3QgYmUgdXNlZCBvdXRzaWRlIG9mIHRoZVxuICogbWF0ZXJpYWwgbGlicmFyeS5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGNvbnN0IENES19UQUJMRV9URU1QTEFURSA9XG4gIC8vIE5vdGUgdGhhdCBhY2NvcmRpbmcgdG8gTUROLCB0aGUgYGNhcHRpb25gIGVsZW1lbnQgaGFzIHRvIGJlIHByb2plY3RlZCBhcyB0aGUgKipmaXJzdCoqXG4gIC8vIGVsZW1lbnQgaW4gdGhlIHRhYmxlLiBTZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRNTC9FbGVtZW50L2NhcHRpb25cbiAgYFxuICA8bmctY29udGVudCBzZWxlY3Q9XCJjYXB0aW9uXCI+PC9uZy1jb250ZW50PlxuICA8bmctY29udGVudCBzZWxlY3Q9XCJjb2xncm91cCwgY29sXCI+PC9uZy1jb250ZW50PlxuICA8bmctY29udGFpbmVyIGhlYWRlclJvd091dGxldD48L25nLWNvbnRhaW5lcj5cbiAgPG5nLWNvbnRhaW5lciByb3dPdXRsZXQ+PC9uZy1jb250YWluZXI+XG4gIDxuZy1jb250YWluZXIgbm9EYXRhUm93T3V0bGV0PjwvbmctY29udGFpbmVyPlxuICA8bmctY29udGFpbmVyIGZvb3RlclJvd091dGxldD48L25nLWNvbnRhaW5lcj5cbmA7XG5cbi8qKlxuICogSW50ZXJmYWNlIHVzZWQgdG8gY29udmVuaWVudGx5IHR5cGUgdGhlIHBvc3NpYmxlIGNvbnRleHQgaW50ZXJmYWNlcyBmb3IgdGhlIHJlbmRlciByb3cuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUm93Q29udGV4dDxUPlxuICBleHRlbmRzIENka0NlbGxPdXRsZXRNdWx0aVJvd0NvbnRleHQ8VD4sXG4gICAgQ2RrQ2VsbE91dGxldFJvd0NvbnRleHQ8VD4ge31cblxuLyoqXG4gKiBDbGFzcyB1c2VkIHRvIGNvbnZlbmllbnRseSB0eXBlIHRoZSBlbWJlZGRlZCB2aWV3IHJlZiBmb3Igcm93cyB3aXRoIGEgY29udGV4dC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuYWJzdHJhY3QgY2xhc3MgUm93Vmlld1JlZjxUPiBleHRlbmRzIEVtYmVkZGVkVmlld1JlZjxSb3dDb250ZXh0PFQ+PiB7fVxuXG4vKipcbiAqIFNldCBvZiBwcm9wZXJ0aWVzIHRoYXQgcmVwcmVzZW50cyB0aGUgaWRlbnRpdHkgb2YgYSBzaW5nbGUgcmVuZGVyZWQgcm93LlxuICpcbiAqIFdoZW4gdGhlIHRhYmxlIG5lZWRzIHRvIGRldGVybWluZSB0aGUgbGlzdCBvZiByb3dzIHRvIHJlbmRlciwgaXQgd2lsbCBkbyBzbyBieSBpdGVyYXRpbmcgdGhyb3VnaFxuICogZWFjaCBkYXRhIG9iamVjdCBhbmQgZXZhbHVhdGluZyBpdHMgbGlzdCBvZiByb3cgdGVtcGxhdGVzIHRvIGRpc3BsYXkgKHdoZW4gbXVsdGlUZW1wbGF0ZURhdGFSb3dzXG4gKiBpcyBmYWxzZSwgdGhlcmUgaXMgb25seSBvbmUgdGVtcGxhdGUgcGVyIGRhdGEgb2JqZWN0KS4gRm9yIGVhY2ggcGFpciBvZiBkYXRhIG9iamVjdCBhbmQgcm93XG4gKiB0ZW1wbGF0ZSwgYSBgUmVuZGVyUm93YCBpcyBhZGRlZCB0byB0aGUgbGlzdCBvZiByb3dzIHRvIHJlbmRlci4gSWYgdGhlIGRhdGEgb2JqZWN0IGFuZCByb3dcbiAqIHRlbXBsYXRlIHBhaXIgaGFzIGFscmVhZHkgYmVlbiByZW5kZXJlZCwgdGhlIHByZXZpb3VzbHkgdXNlZCBgUmVuZGVyUm93YCBpcyBhZGRlZDsgZWxzZSBhIG5ld1xuICogYFJlbmRlclJvd2AgaXMgKiBjcmVhdGVkLiBPbmNlIHRoZSBsaXN0IGlzIGNvbXBsZXRlIGFuZCBhbGwgZGF0YSBvYmplY3RzIGhhdmUgYmVlbiBpdGVyZWF0ZWRcbiAqIHRocm91Z2gsIGEgZGlmZiBpcyBwZXJmb3JtZWQgdG8gZGV0ZXJtaW5lIHRoZSBjaGFuZ2VzIHRoYXQgbmVlZCB0byBiZSBtYWRlIHRvIHRoZSByZW5kZXJlZCByb3dzLlxuICpcbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSZW5kZXJSb3c8VD4ge1xuICBkYXRhOiBUO1xuICBkYXRhSW5kZXg6IG51bWJlcjtcbiAgcm93RGVmOiBDZGtSb3dEZWY8VD47XG59XG5cbi8qKlxuICogQSBkYXRhIHRhYmxlIHRoYXQgY2FuIHJlbmRlciBhIGhlYWRlciByb3csIGRhdGEgcm93cywgYW5kIGEgZm9vdGVyIHJvdy5cbiAqIFVzZXMgdGhlIGRhdGFTb3VyY2UgaW5wdXQgdG8gZGV0ZXJtaW5lIHRoZSBkYXRhIHRvIGJlIHJlbmRlcmVkLiBUaGUgZGF0YSBjYW4gYmUgcHJvdmlkZWQgZWl0aGVyXG4gKiBhcyBhIGRhdGEgYXJyYXksIGFuIE9ic2VydmFibGUgc3RyZWFtIHRoYXQgZW1pdHMgdGhlIGRhdGEgYXJyYXkgdG8gcmVuZGVyLCBvciBhIERhdGFTb3VyY2Ugd2l0aCBhXG4gKiBjb25uZWN0IGZ1bmN0aW9uIHRoYXQgd2lsbCByZXR1cm4gYW4gT2JzZXJ2YWJsZSBzdHJlYW0gdGhhdCBlbWl0cyB0aGUgZGF0YSBhcnJheSB0byByZW5kZXIuXG4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2Nkay10YWJsZSwgdGFibGVbY2RrLXRhYmxlXScsXG4gIGV4cG9ydEFzOiAnY2RrVGFibGUnLFxuICB0ZW1wbGF0ZTogQ0RLX1RBQkxFX1RFTVBMQVRFLFxuICBzdHlsZVVybHM6IFsndGFibGUuY3NzJ10sXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLXRhYmxlJyxcbiAgICAnW2NsYXNzLmNkay10YWJsZS1maXhlZC1sYXlvdXRdJzogJ2ZpeGVkTGF5b3V0JyxcbiAgfSxcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcbiAgLy8gVGhlIFwiT25QdXNoXCIgc3RhdHVzIGZvciB0aGUgYE1hdFRhYmxlYCBjb21wb25lbnQgaXMgZWZmZWN0aXZlbHkgYSBub29wLCBzbyB3ZSBhcmUgcmVtb3ZpbmcgaXQuXG4gIC8vIFRoZSB2aWV3IGZvciBgTWF0VGFibGVgIGNvbnNpc3RzIGVudGlyZWx5IG9mIHRlbXBsYXRlcyBkZWNsYXJlZCBpbiBvdGhlciB2aWV3cy4gQXMgdGhleSBhcmVcbiAgLy8gZGVjbGFyZWQgZWxzZXdoZXJlLCB0aGV5IGFyZSBjaGVja2VkIHdoZW4gdGhlaXIgZGVjbGFyYXRpb24gcG9pbnRzIGFyZSBjaGVja2VkLlxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6dmFsaWRhdGUtZGVjb3JhdG9yc1xuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5LkRlZmF1bHQsXG4gIHByb3ZpZGVyczogW1xuICAgIHtwcm92aWRlOiBDREtfVEFCTEUsIHVzZUV4aXN0aW5nOiBDZGtUYWJsZX0sXG4gICAge3Byb3ZpZGU6IF9WSUVXX1JFUEVBVEVSX1NUUkFURUdZLCB1c2VDbGFzczogX0Rpc3Bvc2VWaWV3UmVwZWF0ZXJTdHJhdGVneX0sXG4gICAge3Byb3ZpZGU6IF9DT0FMRVNDRURfU1RZTEVfU0NIRURVTEVSLCB1c2VDbGFzczogX0NvYWxlc2NlZFN0eWxlU2NoZWR1bGVyfSxcbiAgICAvLyBQcmV2ZW50IG5lc3RlZCB0YWJsZXMgZnJvbSBzZWVpbmcgdGhpcyB0YWJsZSdzIFN0aWNreVBvc2l0aW9uaW5nTGlzdGVuZXIuXG4gICAge3Byb3ZpZGU6IFNUSUNLWV9QT1NJVElPTklOR19MSVNURU5FUiwgdXNlVmFsdWU6IG51bGx9LFxuICBdLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtUYWJsZTxUPiBpbXBsZW1lbnRzIEFmdGVyQ29udGVudENoZWNrZWQsIENvbGxlY3Rpb25WaWV3ZXIsIE9uRGVzdHJveSwgT25Jbml0IHtcbiAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50O1xuXG4gIC8qKiBMYXRlc3QgZGF0YSBwcm92aWRlZCBieSB0aGUgZGF0YSBzb3VyY2UuICovXG4gIHByb3RlY3RlZCBfZGF0YTogcmVhZG9ubHkgVFtdO1xuXG4gIC8qKiBTdWJqZWN0IHRoYXQgZW1pdHMgd2hlbiB0aGUgY29tcG9uZW50IGhhcyBiZWVuIGRlc3Ryb3llZC4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfb25EZXN0cm95ID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogTGlzdCBvZiB0aGUgcmVuZGVyZWQgcm93cyBhcyBpZGVudGlmaWVkIGJ5IHRoZWlyIGBSZW5kZXJSb3dgIG9iamVjdC4gKi9cbiAgcHJpdmF0ZSBfcmVuZGVyUm93czogUmVuZGVyUm93PFQ+W107XG5cbiAgLyoqIFN1YnNjcmlwdGlvbiB0aGF0IGxpc3RlbnMgZm9yIHRoZSBkYXRhIHByb3ZpZGVkIGJ5IHRoZSBkYXRhIHNvdXJjZS4gKi9cbiAgcHJpdmF0ZSBfcmVuZGVyQ2hhbmdlU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb24gfCBudWxsO1xuXG4gIC8qKlxuICAgKiBNYXAgb2YgYWxsIHRoZSB1c2VyJ3MgZGVmaW5lZCBjb2x1bW5zIChoZWFkZXIsIGRhdGEsIGFuZCBmb290ZXIgY2VsbCB0ZW1wbGF0ZSkgaWRlbnRpZmllZCBieVxuICAgKiBuYW1lLiBDb2xsZWN0aW9uIHBvcHVsYXRlZCBieSB0aGUgY29sdW1uIGRlZmluaXRpb25zIGdhdGhlcmVkIGJ5IGBDb250ZW50Q2hpbGRyZW5gIGFzIHdlbGwgYXNcbiAgICogYW55IGN1c3RvbSBjb2x1bW4gZGVmaW5pdGlvbnMgYWRkZWQgdG8gYF9jdXN0b21Db2x1bW5EZWZzYC5cbiAgICovXG4gIHByaXZhdGUgX2NvbHVtbkRlZnNCeU5hbWUgPSBuZXcgTWFwPHN0cmluZywgQ2RrQ29sdW1uRGVmPigpO1xuXG4gIC8qKlxuICAgKiBTZXQgb2YgYWxsIHJvdyBkZWZpbml0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIGJ5IHRoaXMgdGFibGUuIFBvcHVsYXRlZCBieSB0aGUgcm93cyBnYXRoZXJlZCBieVxuICAgKiB1c2luZyBgQ29udGVudENoaWxkcmVuYCBhcyB3ZWxsIGFzIGFueSBjdXN0b20gcm93IGRlZmluaXRpb25zIGFkZGVkIHRvIGBfY3VzdG9tUm93RGVmc2AuXG4gICAqL1xuICBwcml2YXRlIF9yb3dEZWZzOiBDZGtSb3dEZWY8VD5bXTtcblxuICAvKipcbiAgICogU2V0IG9mIGFsbCBoZWFkZXIgcm93IGRlZmluaXRpb25zIHRoYXQgY2FuIGJlIHVzZWQgYnkgdGhpcyB0YWJsZS4gUG9wdWxhdGVkIGJ5IHRoZSByb3dzXG4gICAqIGdhdGhlcmVkIGJ5IHVzaW5nIGBDb250ZW50Q2hpbGRyZW5gIGFzIHdlbGwgYXMgYW55IGN1c3RvbSByb3cgZGVmaW5pdGlvbnMgYWRkZWQgdG9cbiAgICogYF9jdXN0b21IZWFkZXJSb3dEZWZzYC5cbiAgICovXG4gIHByaXZhdGUgX2hlYWRlclJvd0RlZnM6IENka0hlYWRlclJvd0RlZltdO1xuXG4gIC8qKlxuICAgKiBTZXQgb2YgYWxsIHJvdyBkZWZpbml0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIGJ5IHRoaXMgdGFibGUuIFBvcHVsYXRlZCBieSB0aGUgcm93cyBnYXRoZXJlZCBieVxuICAgKiB1c2luZyBgQ29udGVudENoaWxkcmVuYCBhcyB3ZWxsIGFzIGFueSBjdXN0b20gcm93IGRlZmluaXRpb25zIGFkZGVkIHRvXG4gICAqIGBfY3VzdG9tRm9vdGVyUm93RGVmc2AuXG4gICAqL1xuICBwcml2YXRlIF9mb290ZXJSb3dEZWZzOiBDZGtGb290ZXJSb3dEZWZbXTtcblxuICAvKiogRGlmZmVyIHVzZWQgdG8gZmluZCB0aGUgY2hhbmdlcyBpbiB0aGUgZGF0YSBwcm92aWRlZCBieSB0aGUgZGF0YSBzb3VyY2UuICovXG4gIHByaXZhdGUgX2RhdGFEaWZmZXI6IEl0ZXJhYmxlRGlmZmVyPFJlbmRlclJvdzxUPj47XG5cbiAgLyoqIFN0b3JlcyB0aGUgcm93IGRlZmluaXRpb24gdGhhdCBkb2VzIG5vdCBoYXZlIGEgd2hlbiBwcmVkaWNhdGUuICovXG4gIHByaXZhdGUgX2RlZmF1bHRSb3dEZWY6IENka1Jvd0RlZjxUPiB8IG51bGw7XG5cbiAgLyoqXG4gICAqIENvbHVtbiBkZWZpbml0aW9ucyB0aGF0IHdlcmUgZGVmaW5lZCBvdXRzaWRlIG9mIHRoZSBkaXJlY3QgY29udGVudCBjaGlsZHJlbiBvZiB0aGUgdGFibGUuXG4gICAqIFRoZXNlIHdpbGwgYmUgZGVmaW5lZCB3aGVuLCBlLmcuLCBjcmVhdGluZyBhIHdyYXBwZXIgYXJvdW5kIHRoZSBjZGtUYWJsZSB0aGF0IGhhc1xuICAgKiBjb2x1bW4gZGVmaW5pdGlvbnMgYXMgKml0cyogY29udGVudCBjaGlsZC5cbiAgICovXG4gIHByaXZhdGUgX2N1c3RvbUNvbHVtbkRlZnMgPSBuZXcgU2V0PENka0NvbHVtbkRlZj4oKTtcblxuICAvKipcbiAgICogRGF0YSByb3cgZGVmaW5pdGlvbnMgdGhhdCB3ZXJlIGRlZmluZWQgb3V0c2lkZSBvZiB0aGUgZGlyZWN0IGNvbnRlbnQgY2hpbGRyZW4gb2YgdGhlIHRhYmxlLlxuICAgKiBUaGVzZSB3aWxsIGJlIGRlZmluZWQgd2hlbiwgZS5nLiwgY3JlYXRpbmcgYSB3cmFwcGVyIGFyb3VuZCB0aGUgY2RrVGFibGUgdGhhdCBoYXNcbiAgICogYnVpbHQtaW4gZGF0YSByb3dzIGFzICppdHMqIGNvbnRlbnQgY2hpbGQuXG4gICAqL1xuICBwcml2YXRlIF9jdXN0b21Sb3dEZWZzID0gbmV3IFNldDxDZGtSb3dEZWY8VD4+KCk7XG5cbiAgLyoqXG4gICAqIEhlYWRlciByb3cgZGVmaW5pdGlvbnMgdGhhdCB3ZXJlIGRlZmluZWQgb3V0c2lkZSBvZiB0aGUgZGlyZWN0IGNvbnRlbnQgY2hpbGRyZW4gb2YgdGhlIHRhYmxlLlxuICAgKiBUaGVzZSB3aWxsIGJlIGRlZmluZWQgd2hlbiwgZS5nLiwgY3JlYXRpbmcgYSB3cmFwcGVyIGFyb3VuZCB0aGUgY2RrVGFibGUgdGhhdCBoYXNcbiAgICogYnVpbHQtaW4gaGVhZGVyIHJvd3MgYXMgKml0cyogY29udGVudCBjaGlsZC5cbiAgICovXG4gIHByaXZhdGUgX2N1c3RvbUhlYWRlclJvd0RlZnMgPSBuZXcgU2V0PENka0hlYWRlclJvd0RlZj4oKTtcblxuICAvKipcbiAgICogRm9vdGVyIHJvdyBkZWZpbml0aW9ucyB0aGF0IHdlcmUgZGVmaW5lZCBvdXRzaWRlIG9mIHRoZSBkaXJlY3QgY29udGVudCBjaGlsZHJlbiBvZiB0aGUgdGFibGUuXG4gICAqIFRoZXNlIHdpbGwgYmUgZGVmaW5lZCB3aGVuLCBlLmcuLCBjcmVhdGluZyBhIHdyYXBwZXIgYXJvdW5kIHRoZSBjZGtUYWJsZSB0aGF0IGhhcyBhXG4gICAqIGJ1aWx0LWluIGZvb3RlciByb3cgYXMgKml0cyogY29udGVudCBjaGlsZC5cbiAgICovXG4gIHByaXZhdGUgX2N1c3RvbUZvb3RlclJvd0RlZnMgPSBuZXcgU2V0PENka0Zvb3RlclJvd0RlZj4oKTtcblxuICAvKiogTm8gZGF0YSByb3cgdGhhdCB3YXMgZGVmaW5lZCBvdXRzaWRlIG9mIHRoZSBkaXJlY3QgY29udGVudCBjaGlsZHJlbiBvZiB0aGUgdGFibGUuICovXG4gIHByaXZhdGUgX2N1c3RvbU5vRGF0YVJvdzogQ2RrTm9EYXRhUm93IHwgbnVsbDtcblxuICAvKipcbiAgICogV2hldGhlciB0aGUgaGVhZGVyIHJvdyBkZWZpbml0aW9uIGhhcyBiZWVuIGNoYW5nZWQuIFRyaWdnZXJzIGFuIHVwZGF0ZSB0byB0aGUgaGVhZGVyIHJvdyBhZnRlclxuICAgKiBjb250ZW50IGlzIGNoZWNrZWQuIEluaXRpYWxpemVkIGFzIHRydWUgc28gdGhhdCB0aGUgdGFibGUgcmVuZGVycyB0aGUgaW5pdGlhbCBzZXQgb2Ygcm93cy5cbiAgICovXG4gIHByaXZhdGUgX2hlYWRlclJvd0RlZkNoYW5nZWQgPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBmb290ZXIgcm93IGRlZmluaXRpb24gaGFzIGJlZW4gY2hhbmdlZC4gVHJpZ2dlcnMgYW4gdXBkYXRlIHRvIHRoZSBmb290ZXIgcm93IGFmdGVyXG4gICAqIGNvbnRlbnQgaXMgY2hlY2tlZC4gSW5pdGlhbGl6ZWQgYXMgdHJ1ZSBzbyB0aGF0IHRoZSB0YWJsZSByZW5kZXJzIHRoZSBpbml0aWFsIHNldCBvZiByb3dzLlxuICAgKi9cbiAgcHJpdmF0ZSBfZm9vdGVyUm93RGVmQ2hhbmdlZCA9IHRydWU7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIHN0aWNreSBjb2x1bW4gc3R5bGVzIG5lZWQgdG8gYmUgdXBkYXRlZC4gU2V0IHRvIGB0cnVlYCB3aGVuIHRoZSB2aXNpYmxlIGNvbHVtbnNcbiAgICogY2hhbmdlLlxuICAgKi9cbiAgcHJpdmF0ZSBfc3RpY2t5Q29sdW1uU3R5bGVzTmVlZFJlc2V0ID0gdHJ1ZTtcblxuICAvKipcbiAgICogV2hldGhlciB0aGUgc3RpY2t5IHN0eWxlciBzaG91bGQgcmVjYWxjdWxhdGUgY2VsbCB3aWR0aHMgd2hlbiBhcHBseWluZyBzdGlja3kgc3R5bGVzLiBJZlxuICAgKiBgZmFsc2VgLCBjYWNoZWQgdmFsdWVzIHdpbGwgYmUgdXNlZCBpbnN0ZWFkLiBUaGlzIGlzIG9ubHkgYXBwbGljYWJsZSB0byB0YWJsZXMgd2l0aFxuICAgKiB7QGxpbmsgZml4ZWRMYXlvdXR9IGVuYWJsZWQuIEZvciBvdGhlciB0YWJsZXMsIGNlbGwgd2lkdGhzIHdpbGwgYWx3YXlzIGJlIHJlY2FsY3VsYXRlZC5cbiAgICovXG4gIHByaXZhdGUgX2ZvcmNlUmVjYWxjdWxhdGVDZWxsV2lkdGhzID0gdHJ1ZTtcblxuICAvKipcbiAgICogQ2FjaGUgb2YgdGhlIGxhdGVzdCByZW5kZXJlZCBgUmVuZGVyUm93YCBvYmplY3RzIGFzIGEgbWFwIGZvciBlYXN5IHJldHJpZXZhbCB3aGVuIGNvbnN0cnVjdGluZ1xuICAgKiBhIG5ldyBsaXN0IG9mIGBSZW5kZXJSb3dgIG9iamVjdHMgZm9yIHJlbmRlcmluZyByb3dzLiBTaW5jZSB0aGUgbmV3IGxpc3QgaXMgY29uc3RydWN0ZWQgd2l0aFxuICAgKiB0aGUgY2FjaGVkIGBSZW5kZXJSb3dgIG9iamVjdHMgd2hlbiBwb3NzaWJsZSwgdGhlIHJvdyBpZGVudGl0eSBpcyBwcmVzZXJ2ZWQgd2hlbiB0aGUgZGF0YVxuICAgKiBhbmQgcm93IHRlbXBsYXRlIG1hdGNoZXMsIHdoaWNoIGFsbG93cyB0aGUgYEl0ZXJhYmxlRGlmZmVyYCB0byBjaGVjayByb3dzIGJ5IHJlZmVyZW5jZVxuICAgKiBhbmQgdW5kZXJzdGFuZCB3aGljaCByb3dzIGFyZSBhZGRlZC9tb3ZlZC9yZW1vdmVkLlxuICAgKlxuICAgKiBJbXBsZW1lbnRlZCBhcyBhIG1hcCBvZiBtYXBzIHdoZXJlIHRoZSBmaXJzdCBrZXkgaXMgdGhlIGBkYXRhOiBUYCBvYmplY3QgYW5kIHRoZSBzZWNvbmQgaXMgdGhlXG4gICAqIGBDZGtSb3dEZWY8VD5gIG9iamVjdC4gV2l0aCB0aGUgdHdvIGtleXMsIHRoZSBjYWNoZSBwb2ludHMgdG8gYSBgUmVuZGVyUm93PFQ+YCBvYmplY3QgdGhhdFxuICAgKiBjb250YWlucyBhbiBhcnJheSBvZiBjcmVhdGVkIHBhaXJzLiBUaGUgYXJyYXkgaXMgbmVjZXNzYXJ5IHRvIGhhbmRsZSBjYXNlcyB3aGVyZSB0aGUgZGF0YVxuICAgKiBhcnJheSBjb250YWlucyBtdWx0aXBsZSBkdXBsaWNhdGUgZGF0YSBvYmplY3RzIGFuZCBlYWNoIGluc3RhbnRpYXRlZCBgUmVuZGVyUm93YCBtdXN0IGJlXG4gICAqIHN0b3JlZC5cbiAgICovXG4gIHByaXZhdGUgX2NhY2hlZFJlbmRlclJvd3NNYXAgPSBuZXcgTWFwPFQsIFdlYWtNYXA8Q2RrUm93RGVmPFQ+LCBSZW5kZXJSb3c8VD5bXT4+KCk7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHRhYmxlIGlzIGFwcGxpZWQgdG8gYSBuYXRpdmUgYDx0YWJsZT5gLiAqL1xuICBwcm90ZWN0ZWQgX2lzTmF0aXZlSHRtbFRhYmxlOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBVdGlsaXR5IGNsYXNzIHRoYXQgaXMgcmVzcG9uc2libGUgZm9yIGFwcGx5aW5nIHRoZSBhcHByb3ByaWF0ZSBzdGlja3kgcG9zaXRpb25pbmcgc3R5bGVzIHRvXG4gICAqIHRoZSB0YWJsZSdzIHJvd3MgYW5kIGNlbGxzLlxuICAgKi9cbiAgcHJpdmF0ZSBfc3RpY2t5U3R5bGVyOiBTdGlja3lTdHlsZXI7XG5cbiAgLyoqXG4gICAqIENTUyBjbGFzcyBhZGRlZCB0byBhbnkgcm93IG9yIGNlbGwgdGhhdCBoYXMgc3RpY2t5IHBvc2l0aW9uaW5nIGFwcGxpZWQuIE1heSBiZSBvdmVycmlkZW4gYnlcbiAgICogdGFibGUgc3ViY2xhc3Nlcy5cbiAgICovXG4gIHByb3RlY3RlZCBzdGlja3lDc3NDbGFzczogc3RyaW5nID0gJ2Nkay10YWJsZS1zdGlja3knO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRvIG1hbnVhbGx5IGFkZCBwb3NpdG9uOiBzdGlja3kgdG8gYWxsIHN0aWNreSBjZWxsIGVsZW1lbnRzLiBOb3QgbmVlZGVkIGlmXG4gICAqIHRoZSBwb3NpdGlvbiBpcyBzZXQgaW4gYSBzZWxlY3RvciBhc3NvY2lhdGVkIHdpdGggdGhlIHZhbHVlIG9mIHN0aWNreUNzc0NsYXNzLiBNYXkgYmVcbiAgICogb3ZlcnJpZGRlbiBieSB0YWJsZSBzdWJjbGFzc2VzXG4gICAqL1xuICBwcm90ZWN0ZWQgbmVlZHNQb3NpdGlvblN0aWNreU9uRWxlbWVudCA9IHRydWU7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG5vIGRhdGEgcm93IGlzIGN1cnJlbnRseSBzaG93aW5nIGFueXRoaW5nLiAqL1xuICBwcml2YXRlIF9pc1Nob3dpbmdOb0RhdGFSb3cgPSBmYWxzZTtcblxuICAvKipcbiAgICogVHJhY2tpbmcgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIHVzZWQgdG8gY2hlY2sgdGhlIGRpZmZlcmVuY2VzIGluIGRhdGEgY2hhbmdlcy4gVXNlZCBzaW1pbGFybHlcbiAgICogdG8gYG5nRm9yYCBgdHJhY2tCeWAgZnVuY3Rpb24uIE9wdGltaXplIHJvdyBvcGVyYXRpb25zIGJ5IGlkZW50aWZ5aW5nIGEgcm93IGJhc2VkIG9uIGl0cyBkYXRhXG4gICAqIHJlbGF0aXZlIHRvIHRoZSBmdW5jdGlvbiB0byBrbm93IGlmIGEgcm93IHNob3VsZCBiZSBhZGRlZC9yZW1vdmVkL21vdmVkLlxuICAgKiBBY2NlcHRzIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyB0d28gcGFyYW1ldGVycywgYGluZGV4YCBhbmQgYGl0ZW1gLlxuICAgKi9cbiAgQElucHV0KClcbiAgZ2V0IHRyYWNrQnkoKTogVHJhY2tCeUZ1bmN0aW9uPFQ+IHtcbiAgICByZXR1cm4gdGhpcy5fdHJhY2tCeUZuO1xuICB9XG4gIHNldCB0cmFja0J5KGZuOiBUcmFja0J5RnVuY3Rpb248VD4pIHtcbiAgICBpZiAoKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgZm4gIT0gbnVsbCAmJiB0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNvbnNvbGUud2FybihgdHJhY2tCeSBtdXN0IGJlIGEgZnVuY3Rpb24sIGJ1dCByZWNlaXZlZCAke0pTT04uc3RyaW5naWZ5KGZuKX0uYCk7XG4gICAgfVxuICAgIHRoaXMuX3RyYWNrQnlGbiA9IGZuO1xuICB9XG4gIHByaXZhdGUgX3RyYWNrQnlGbjogVHJhY2tCeUZ1bmN0aW9uPFQ+O1xuXG4gIC8qKlxuICAgKiBUaGUgdGFibGUncyBzb3VyY2Ugb2YgZGF0YSwgd2hpY2ggY2FuIGJlIHByb3ZpZGVkIGluIHRocmVlIHdheXMgKGluIG9yZGVyIG9mIGNvbXBsZXhpdHkpOlxuICAgKiAgIC0gU2ltcGxlIGRhdGEgYXJyYXkgKGVhY2ggb2JqZWN0IHJlcHJlc2VudHMgb25lIHRhYmxlIHJvdylcbiAgICogICAtIFN0cmVhbSB0aGF0IGVtaXRzIGEgZGF0YSBhcnJheSBlYWNoIHRpbWUgdGhlIGFycmF5IGNoYW5nZXNcbiAgICogICAtIGBEYXRhU291cmNlYCBvYmplY3QgdGhhdCBpbXBsZW1lbnRzIHRoZSBjb25uZWN0L2Rpc2Nvbm5lY3QgaW50ZXJmYWNlLlxuICAgKlxuICAgKiBJZiBhIGRhdGEgYXJyYXkgaXMgcHJvdmlkZWQsIHRoZSB0YWJsZSBtdXN0IGJlIG5vdGlmaWVkIHdoZW4gdGhlIGFycmF5J3Mgb2JqZWN0cyBhcmVcbiAgICogYWRkZWQsIHJlbW92ZWQsIG9yIG1vdmVkLiBUaGlzIGNhbiBiZSBkb25lIGJ5IGNhbGxpbmcgdGhlIGByZW5kZXJSb3dzKClgIGZ1bmN0aW9uIHdoaWNoIHdpbGxcbiAgICogcmVuZGVyIHRoZSBkaWZmIHNpbmNlIHRoZSBsYXN0IHRhYmxlIHJlbmRlci4gSWYgdGhlIGRhdGEgYXJyYXkgcmVmZXJlbmNlIGlzIGNoYW5nZWQsIHRoZSB0YWJsZVxuICAgKiB3aWxsIGF1dG9tYXRpY2FsbHkgdHJpZ2dlciBhbiB1cGRhdGUgdG8gdGhlIHJvd3MuXG4gICAqXG4gICAqIFdoZW4gcHJvdmlkaW5nIGFuIE9ic2VydmFibGUgc3RyZWFtLCB0aGUgdGFibGUgd2lsbCB0cmlnZ2VyIGFuIHVwZGF0ZSBhdXRvbWF0aWNhbGx5IHdoZW4gdGhlXG4gICAqIHN0cmVhbSBlbWl0cyBhIG5ldyBhcnJheSBvZiBkYXRhLlxuICAgKlxuICAgKiBGaW5hbGx5LCB3aGVuIHByb3ZpZGluZyBhIGBEYXRhU291cmNlYCBvYmplY3QsIHRoZSB0YWJsZSB3aWxsIHVzZSB0aGUgT2JzZXJ2YWJsZSBzdHJlYW1cbiAgICogcHJvdmlkZWQgYnkgdGhlIGNvbm5lY3QgZnVuY3Rpb24gYW5kIHRyaWdnZXIgdXBkYXRlcyB3aGVuIHRoYXQgc3RyZWFtIGVtaXRzIG5ldyBkYXRhIGFycmF5XG4gICAqIHZhbHVlcy4gRHVyaW5nIHRoZSB0YWJsZSdzIG5nT25EZXN0cm95IG9yIHdoZW4gdGhlIGRhdGEgc291cmNlIGlzIHJlbW92ZWQgZnJvbSB0aGUgdGFibGUsIHRoZVxuICAgKiB0YWJsZSB3aWxsIGNhbGwgdGhlIERhdGFTb3VyY2UncyBgZGlzY29ubmVjdGAgZnVuY3Rpb24gKG1heSBiZSB1c2VmdWwgZm9yIGNsZWFuaW5nIHVwIGFueVxuICAgKiBzdWJzY3JpcHRpb25zIHJlZ2lzdGVyZWQgZHVyaW5nIHRoZSBjb25uZWN0IHByb2Nlc3MpLlxuICAgKi9cbiAgQElucHV0KClcbiAgZ2V0IGRhdGFTb3VyY2UoKTogQ2RrVGFibGVEYXRhU291cmNlSW5wdXQ8VD4ge1xuICAgIHJldHVybiB0aGlzLl9kYXRhU291cmNlO1xuICB9XG4gIHNldCBkYXRhU291cmNlKGRhdGFTb3VyY2U6IENka1RhYmxlRGF0YVNvdXJjZUlucHV0PFQ+KSB7XG4gICAgaWYgKHRoaXMuX2RhdGFTb3VyY2UgIT09IGRhdGFTb3VyY2UpIHtcbiAgICAgIHRoaXMuX3N3aXRjaERhdGFTb3VyY2UoZGF0YVNvdXJjZSk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgX2RhdGFTb3VyY2U6IENka1RhYmxlRGF0YVNvdXJjZUlucHV0PFQ+O1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRvIGFsbG93IG11bHRpcGxlIHJvd3MgcGVyIGRhdGEgb2JqZWN0IGJ5IGV2YWx1YXRpbmcgd2hpY2ggcm93cyBldmFsdWF0ZSB0aGVpciAnd2hlbidcbiAgICogcHJlZGljYXRlIHRvIHRydWUuIElmIGBtdWx0aVRlbXBsYXRlRGF0YVJvd3NgIGlzIGZhbHNlLCB3aGljaCBpcyB0aGUgZGVmYXVsdCB2YWx1ZSwgdGhlbiBlYWNoXG4gICAqIGRhdGFvYmplY3Qgd2lsbCByZW5kZXIgdGhlIGZpcnN0IHJvdyB0aGF0IGV2YWx1YXRlcyBpdHMgd2hlbiBwcmVkaWNhdGUgdG8gdHJ1ZSwgaW4gdGhlIG9yZGVyXG4gICAqIGRlZmluZWQgaW4gdGhlIHRhYmxlLCBvciBvdGhlcndpc2UgdGhlIGRlZmF1bHQgcm93IHdoaWNoIGRvZXMgbm90IGhhdmUgYSB3aGVuIHByZWRpY2F0ZS5cbiAgICovXG4gIEBJbnB1dCgpXG4gIGdldCBtdWx0aVRlbXBsYXRlRGF0YVJvd3MoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX211bHRpVGVtcGxhdGVEYXRhUm93cztcbiAgfVxuICBzZXQgbXVsdGlUZW1wbGF0ZURhdGFSb3dzKHY6IEJvb2xlYW5JbnB1dCkge1xuICAgIHRoaXMuX211bHRpVGVtcGxhdGVEYXRhUm93cyA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2KTtcblxuICAgIC8vIEluIEl2eSBpZiB0aGlzIHZhbHVlIGlzIHNldCB2aWEgYSBzdGF0aWMgYXR0cmlidXRlIChlLmcuIDx0YWJsZSBtdWx0aVRlbXBsYXRlRGF0YVJvd3M+KSxcbiAgICAvLyB0aGlzIHNldHRlciB3aWxsIGJlIGludm9rZWQgYmVmb3JlIHRoZSByb3cgb3V0bGV0IGhhcyBiZWVuIGRlZmluZWQgaGVuY2UgdGhlIG51bGwgY2hlY2suXG4gICAgaWYgKHRoaXMuX3Jvd091dGxldCAmJiB0aGlzLl9yb3dPdXRsZXQudmlld0NvbnRhaW5lci5sZW5ndGgpIHtcbiAgICAgIHRoaXMuX2ZvcmNlUmVuZGVyRGF0YVJvd3MoKTtcbiAgICAgIHRoaXMudXBkYXRlU3RpY2t5Q29sdW1uU3R5bGVzKCk7XG4gICAgfVxuICB9XG4gIF9tdWx0aVRlbXBsYXRlRGF0YVJvd3M6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKipcbiAgICogV2hldGhlciB0byB1c2UgYSBmaXhlZCB0YWJsZSBsYXlvdXQuIEVuYWJsaW5nIHRoaXMgb3B0aW9uIHdpbGwgZW5mb3JjZSBjb25zaXN0ZW50IGNvbHVtbiB3aWR0aHNcbiAgICogYW5kIG9wdGltaXplIHJlbmRlcmluZyBzdGlja3kgc3R5bGVzIGZvciBuYXRpdmUgdGFibGVzLiBOby1vcCBmb3IgZmxleCB0YWJsZXMuXG4gICAqL1xuICBASW5wdXQoKVxuICBnZXQgZml4ZWRMYXlvdXQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2ZpeGVkTGF5b3V0O1xuICB9XG4gIHNldCBmaXhlZExheW91dCh2OiBCb29sZWFuSW5wdXQpIHtcbiAgICB0aGlzLl9maXhlZExheW91dCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2KTtcblxuICAgIC8vIFRvZ2dsaW5nIGBmaXhlZExheW91dGAgbWF5IGNoYW5nZSBjb2x1bW4gd2lkdGhzLiBTdGlja3kgY29sdW1uIHN0eWxlcyBzaG91bGQgYmUgcmVjYWxjdWxhdGVkLlxuICAgIHRoaXMuX2ZvcmNlUmVjYWxjdWxhdGVDZWxsV2lkdGhzID0gdHJ1ZTtcbiAgICB0aGlzLl9zdGlja3lDb2x1bW5TdHlsZXNOZWVkUmVzZXQgPSB0cnVlO1xuICB9XG4gIHByaXZhdGUgX2ZpeGVkTGF5b3V0OiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIEVtaXRzIHdoZW4gdGhlIHRhYmxlIGNvbXBsZXRlcyByZW5kZXJpbmcgYSBzZXQgb2YgZGF0YSByb3dzIGJhc2VkIG9uIHRoZSBsYXRlc3QgZGF0YSBmcm9tIHRoZVxuICAgKiBkYXRhIHNvdXJjZSwgZXZlbiBpZiB0aGUgc2V0IG9mIHJvd3MgaXMgZW1wdHkuXG4gICAqL1xuICBAT3V0cHV0KClcbiAgcmVhZG9ubHkgY29udGVudENoYW5nZWQgPSBuZXcgRXZlbnRFbWl0dGVyPHZvaWQ+KCk7XG5cbiAgLy8gVE9ETyhhbmRyZXdzZWd1aW4pOiBSZW1vdmUgbWF4IHZhbHVlIGFzIHRoZSBlbmQgaW5kZXhcbiAgLy8gICBhbmQgaW5zdGVhZCBjYWxjdWxhdGUgdGhlIHZpZXcgb24gaW5pdCBhbmQgc2Nyb2xsLlxuICAvKipcbiAgICogU3RyZWFtIGNvbnRhaW5pbmcgdGhlIGxhdGVzdCBpbmZvcm1hdGlvbiBvbiB3aGF0IHJvd3MgYXJlIGJlaW5nIGRpc3BsYXllZCBvbiBzY3JlZW4uXG4gICAqIENhbiBiZSB1c2VkIGJ5IHRoZSBkYXRhIHNvdXJjZSB0byBhcyBhIGhldXJpc3RpYyBvZiB3aGF0IGRhdGEgc2hvdWxkIGJlIHByb3ZpZGVkLlxuICAgKlxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICByZWFkb25seSB2aWV3Q2hhbmdlID0gbmV3IEJlaGF2aW9yU3ViamVjdDx7c3RhcnQ6IG51bWJlcjsgZW5kOiBudW1iZXJ9Pih7XG4gICAgc3RhcnQ6IDAsXG4gICAgZW5kOiBOdW1iZXIuTUFYX1ZBTFVFLFxuICB9KTtcblxuICAvLyBPdXRsZXRzIGluIHRoZSB0YWJsZSdzIHRlbXBsYXRlIHdoZXJlIHRoZSBoZWFkZXIsIGRhdGEgcm93cywgYW5kIGZvb3RlciB3aWxsIGJlIGluc2VydGVkLlxuICBAVmlld0NoaWxkKERhdGFSb3dPdXRsZXQsIHtzdGF0aWM6IHRydWV9KSBfcm93T3V0bGV0OiBEYXRhUm93T3V0bGV0O1xuICBAVmlld0NoaWxkKEhlYWRlclJvd091dGxldCwge3N0YXRpYzogdHJ1ZX0pIF9oZWFkZXJSb3dPdXRsZXQ6IEhlYWRlclJvd091dGxldDtcbiAgQFZpZXdDaGlsZChGb290ZXJSb3dPdXRsZXQsIHtzdGF0aWM6IHRydWV9KSBfZm9vdGVyUm93T3V0bGV0OiBGb290ZXJSb3dPdXRsZXQ7XG4gIEBWaWV3Q2hpbGQoTm9EYXRhUm93T3V0bGV0LCB7c3RhdGljOiB0cnVlfSkgX25vRGF0YVJvd091dGxldDogTm9EYXRhUm93T3V0bGV0O1xuXG4gIC8qKlxuICAgKiBUaGUgY29sdW1uIGRlZmluaXRpb25zIHByb3ZpZGVkIGJ5IHRoZSB1c2VyIHRoYXQgY29udGFpbiB3aGF0IHRoZSBoZWFkZXIsIGRhdGEsIGFuZCBmb290ZXJcbiAgICogY2VsbHMgc2hvdWxkIHJlbmRlciBmb3IgZWFjaCBjb2x1bW4uXG4gICAqL1xuICBAQ29udGVudENoaWxkcmVuKENka0NvbHVtbkRlZiwge2Rlc2NlbmRhbnRzOiB0cnVlfSkgX2NvbnRlbnRDb2x1bW5EZWZzOiBRdWVyeUxpc3Q8Q2RrQ29sdW1uRGVmPjtcblxuICAvKiogU2V0IG9mIGRhdGEgcm93IGRlZmluaXRpb25zIHRoYXQgd2VyZSBwcm92aWRlZCB0byB0aGUgdGFibGUgYXMgY29udGVudCBjaGlsZHJlbi4gKi9cbiAgQENvbnRlbnRDaGlsZHJlbihDZGtSb3dEZWYsIHtkZXNjZW5kYW50czogdHJ1ZX0pIF9jb250ZW50Um93RGVmczogUXVlcnlMaXN0PENka1Jvd0RlZjxUPj47XG5cbiAgLyoqIFNldCBvZiBoZWFkZXIgcm93IGRlZmluaXRpb25zIHRoYXQgd2VyZSBwcm92aWRlZCB0byB0aGUgdGFibGUgYXMgY29udGVudCBjaGlsZHJlbi4gKi9cbiAgQENvbnRlbnRDaGlsZHJlbihDZGtIZWFkZXJSb3dEZWYsIHtcbiAgICBkZXNjZW5kYW50czogdHJ1ZSxcbiAgfSlcbiAgX2NvbnRlbnRIZWFkZXJSb3dEZWZzOiBRdWVyeUxpc3Q8Q2RrSGVhZGVyUm93RGVmPjtcblxuICAvKiogU2V0IG9mIGZvb3RlciByb3cgZGVmaW5pdGlvbnMgdGhhdCB3ZXJlIHByb3ZpZGVkIHRvIHRoZSB0YWJsZSBhcyBjb250ZW50IGNoaWxkcmVuLiAqL1xuICBAQ29udGVudENoaWxkcmVuKENka0Zvb3RlclJvd0RlZiwge1xuICAgIGRlc2NlbmRhbnRzOiB0cnVlLFxuICB9KVxuICBfY29udGVudEZvb3RlclJvd0RlZnM6IFF1ZXJ5TGlzdDxDZGtGb290ZXJSb3dEZWY+O1xuXG4gIC8qKiBSb3cgZGVmaW5pdGlvbiB0aGF0IHdpbGwgb25seSBiZSByZW5kZXJlZCBpZiB0aGVyZSdzIG5vIGRhdGEgaW4gdGhlIHRhYmxlLiAqL1xuICBAQ29udGVudENoaWxkKENka05vRGF0YVJvdykgX25vRGF0YVJvdzogQ2RrTm9EYXRhUm93O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByb3RlY3RlZCByZWFkb25seSBfZGlmZmVyczogSXRlcmFibGVEaWZmZXJzLFxuICAgIHByb3RlY3RlZCByZWFkb25seSBfY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmLFxuICAgIHByb3RlY3RlZCByZWFkb25seSBfZWxlbWVudFJlZjogRWxlbWVudFJlZixcbiAgICBAQXR0cmlidXRlKCdyb2xlJykgcm9sZTogc3RyaW5nLFxuICAgIEBPcHRpb25hbCgpIHByb3RlY3RlZCByZWFkb25seSBfZGlyOiBEaXJlY3Rpb25hbGl0eSxcbiAgICBASW5qZWN0KERPQ1VNRU5UKSBfZG9jdW1lbnQ6IGFueSxcbiAgICBwcml2YXRlIF9wbGF0Zm9ybTogUGxhdGZvcm0sXG4gICAgQEluamVjdChfVklFV19SRVBFQVRFUl9TVFJBVEVHWSlcbiAgICBwcm90ZWN0ZWQgcmVhZG9ubHkgX3ZpZXdSZXBlYXRlcjogX1ZpZXdSZXBlYXRlcjxULCBSZW5kZXJSb3c8VD4sIFJvd0NvbnRleHQ8VD4+LFxuICAgIEBJbmplY3QoX0NPQUxFU0NFRF9TVFlMRV9TQ0hFRFVMRVIpXG4gICAgcHJvdGVjdGVkIHJlYWRvbmx5IF9jb2FsZXNjZWRTdHlsZVNjaGVkdWxlcjogX0NvYWxlc2NlZFN0eWxlU2NoZWR1bGVyLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgX3ZpZXdwb3J0UnVsZXI6IFZpZXdwb3J0UnVsZXIsXG4gICAgLyoqXG4gICAgICogQGRlcHJlY2F0ZWQgYF9zdGlja3lQb3NpdGlvbmluZ0xpc3RlbmVyYCBwYXJhbWV0ZXIgdG8gYmVjb21lIHJlcXVpcmVkLlxuICAgICAqIEBicmVha2luZy1jaGFuZ2UgMTMuMC4wXG4gICAgICovXG4gICAgQE9wdGlvbmFsKClcbiAgICBAU2tpcFNlbGYoKVxuICAgIEBJbmplY3QoU1RJQ0tZX1BPU0lUSU9OSU5HX0xJU1RFTkVSKVxuICAgIHByb3RlY3RlZCByZWFkb25seSBfc3RpY2t5UG9zaXRpb25pbmdMaXN0ZW5lcjogU3RpY2t5UG9zaXRpb25pbmdMaXN0ZW5lcixcbiAgICAvKipcbiAgICAgKiBAZGVwcmVjYXRlZCBgX25nWm9uZWAgcGFyYW1ldGVyIHRvIGJlY29tZSByZXF1aXJlZC5cbiAgICAgKiBAYnJlYWtpbmctY2hhbmdlIDE0LjAuMFxuICAgICAqL1xuICAgIEBPcHRpb25hbCgpXG4gICAgcHJvdGVjdGVkIHJlYWRvbmx5IF9uZ1pvbmU6IE5nWm9uZSxcbiAgKSB7XG4gICAgaWYgKCFyb2xlKSB7XG4gICAgICB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuc2V0QXR0cmlidXRlKCdyb2xlJywgJ3RhYmxlJyk7XG4gICAgfVxuXG4gICAgdGhpcy5fZG9jdW1lbnQgPSBfZG9jdW1lbnQ7XG4gICAgdGhpcy5faXNOYXRpdmVIdG1sVGFibGUgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQubm9kZU5hbWUgPT09ICdUQUJMRSc7XG4gIH1cblxuICBuZ09uSW5pdCgpIHtcbiAgICB0aGlzLl9zZXR1cFN0aWNreVN0eWxlcigpO1xuXG4gICAgaWYgKHRoaXMuX2lzTmF0aXZlSHRtbFRhYmxlKSB7XG4gICAgICB0aGlzLl9hcHBseU5hdGl2ZVRhYmxlU2VjdGlvbnMoKTtcbiAgICB9XG5cbiAgICAvLyBTZXQgdXAgdGhlIHRyYWNrQnkgZnVuY3Rpb24gc28gdGhhdCBpdCB1c2VzIHRoZSBgUmVuZGVyUm93YCBhcyBpdHMgaWRlbnRpdHkgYnkgZGVmYXVsdC4gSWZcbiAgICAvLyB0aGUgdXNlciBoYXMgcHJvdmlkZWQgYSBjdXN0b20gdHJhY2tCeSwgcmV0dXJuIHRoZSByZXN1bHQgb2YgdGhhdCBmdW5jdGlvbiBhcyBldmFsdWF0ZWRcbiAgICAvLyB3aXRoIHRoZSB2YWx1ZXMgb2YgdGhlIGBSZW5kZXJSb3dgJ3MgZGF0YSBhbmQgaW5kZXguXG4gICAgdGhpcy5fZGF0YURpZmZlciA9IHRoaXMuX2RpZmZlcnMuZmluZChbXSkuY3JlYXRlKChfaTogbnVtYmVyLCBkYXRhUm93OiBSZW5kZXJSb3c8VD4pID0+IHtcbiAgICAgIHJldHVybiB0aGlzLnRyYWNrQnkgPyB0aGlzLnRyYWNrQnkoZGF0YVJvdy5kYXRhSW5kZXgsIGRhdGFSb3cuZGF0YSkgOiBkYXRhUm93O1xuICAgIH0pO1xuXG4gICAgdGhpcy5fdmlld3BvcnRSdWxlclxuICAgICAgLmNoYW5nZSgpXG4gICAgICAucGlwZSh0YWtlVW50aWwodGhpcy5fb25EZXN0cm95KSlcbiAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICB0aGlzLl9mb3JjZVJlY2FsY3VsYXRlQ2VsbFdpZHRocyA9IHRydWU7XG4gICAgICB9KTtcbiAgfVxuXG4gIG5nQWZ0ZXJDb250ZW50Q2hlY2tlZCgpIHtcbiAgICAvLyBDYWNoZSB0aGUgcm93IGFuZCBjb2x1bW4gZGVmaW5pdGlvbnMgZ2F0aGVyZWQgYnkgQ29udGVudENoaWxkcmVuIGFuZCBwcm9ncmFtbWF0aWMgaW5qZWN0aW9uLlxuICAgIHRoaXMuX2NhY2hlUm93RGVmcygpO1xuICAgIHRoaXMuX2NhY2hlQ29sdW1uRGVmcygpO1xuXG4gICAgLy8gTWFrZSBzdXJlIHRoYXQgdGhlIHVzZXIgaGFzIGF0IGxlYXN0IGFkZGVkIGhlYWRlciwgZm9vdGVyLCBvciBkYXRhIHJvdyBkZWYuXG4gICAgaWYgKFxuICAgICAgIXRoaXMuX2hlYWRlclJvd0RlZnMubGVuZ3RoICYmXG4gICAgICAhdGhpcy5fZm9vdGVyUm93RGVmcy5sZW5ndGggJiZcbiAgICAgICF0aGlzLl9yb3dEZWZzLmxlbmd0aCAmJlxuICAgICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSlcbiAgICApIHtcbiAgICAgIHRocm93IGdldFRhYmxlTWlzc2luZ1Jvd0RlZnNFcnJvcigpO1xuICAgIH1cblxuICAgIC8vIFJlbmRlciB1cGRhdGVzIGlmIHRoZSBsaXN0IG9mIGNvbHVtbnMgaGF2ZSBiZWVuIGNoYW5nZWQgZm9yIHRoZSBoZWFkZXIsIHJvdywgb3IgZm9vdGVyIGRlZnMuXG4gICAgY29uc3QgY29sdW1uc0NoYW5nZWQgPSB0aGlzLl9yZW5kZXJVcGRhdGVkQ29sdW1ucygpO1xuICAgIGNvbnN0IHJvd0RlZnNDaGFuZ2VkID0gY29sdW1uc0NoYW5nZWQgfHwgdGhpcy5faGVhZGVyUm93RGVmQ2hhbmdlZCB8fCB0aGlzLl9mb290ZXJSb3dEZWZDaGFuZ2VkO1xuICAgIC8vIEVuc3VyZSBzdGlja3kgY29sdW1uIHN0eWxlcyBhcmUgcmVzZXQgaWYgc2V0IHRvIGB0cnVlYCBlbHNld2hlcmUuXG4gICAgdGhpcy5fc3RpY2t5Q29sdW1uU3R5bGVzTmVlZFJlc2V0ID0gdGhpcy5fc3RpY2t5Q29sdW1uU3R5bGVzTmVlZFJlc2V0IHx8IHJvd0RlZnNDaGFuZ2VkO1xuICAgIHRoaXMuX2ZvcmNlUmVjYWxjdWxhdGVDZWxsV2lkdGhzID0gcm93RGVmc0NoYW5nZWQ7XG5cbiAgICAvLyBJZiB0aGUgaGVhZGVyIHJvdyBkZWZpbml0aW9uIGhhcyBiZWVuIGNoYW5nZWQsIHRyaWdnZXIgYSByZW5kZXIgdG8gdGhlIGhlYWRlciByb3cuXG4gICAgaWYgKHRoaXMuX2hlYWRlclJvd0RlZkNoYW5nZWQpIHtcbiAgICAgIHRoaXMuX2ZvcmNlUmVuZGVySGVhZGVyUm93cygpO1xuICAgICAgdGhpcy5faGVhZGVyUm93RGVmQ2hhbmdlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBmb290ZXIgcm93IGRlZmluaXRpb24gaGFzIGJlZW4gY2hhbmdlZCwgdHJpZ2dlciBhIHJlbmRlciB0byB0aGUgZm9vdGVyIHJvdy5cbiAgICBpZiAodGhpcy5fZm9vdGVyUm93RGVmQ2hhbmdlZCkge1xuICAgICAgdGhpcy5fZm9yY2VSZW5kZXJGb290ZXJSb3dzKCk7XG4gICAgICB0aGlzLl9mb290ZXJSb3dEZWZDaGFuZ2VkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlcmUgaXMgYSBkYXRhIHNvdXJjZSBhbmQgcm93IGRlZmluaXRpb25zLCBjb25uZWN0IHRvIHRoZSBkYXRhIHNvdXJjZSB1bmxlc3MgYVxuICAgIC8vIGNvbm5lY3Rpb24gaGFzIGFscmVhZHkgYmVlbiBtYWRlLlxuICAgIGlmICh0aGlzLmRhdGFTb3VyY2UgJiYgdGhpcy5fcm93RGVmcy5sZW5ndGggPiAwICYmICF0aGlzLl9yZW5kZXJDaGFuZ2VTdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuX29ic2VydmVSZW5kZXJDaGFuZ2VzKCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9zdGlja3lDb2x1bW5TdHlsZXNOZWVkUmVzZXQpIHtcbiAgICAgIC8vIEluIHRoZSBhYm92ZSBjYXNlLCBfb2JzZXJ2ZVJlbmRlckNoYW5nZXMgd2lsbCByZXN1bHQgaW4gdXBkYXRlU3RpY2t5Q29sdW1uU3R5bGVzIGJlaW5nXG4gICAgICAvLyBjYWxsZWQgd2hlbiBpdCByb3cgZGF0YSBhcnJpdmVzLiBPdGhlcndpc2UsIHdlIG5lZWQgdG8gY2FsbCBpdCBwcm9hY3RpdmVseS5cbiAgICAgIHRoaXMudXBkYXRlU3RpY2t5Q29sdW1uU3R5bGVzKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fY2hlY2tTdGlja3lTdGF0ZXMoKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX3Jvd091dGxldC52aWV3Q29udGFpbmVyLmNsZWFyKCk7XG4gICAgdGhpcy5fbm9EYXRhUm93T3V0bGV0LnZpZXdDb250YWluZXIuY2xlYXIoKTtcbiAgICB0aGlzLl9oZWFkZXJSb3dPdXRsZXQudmlld0NvbnRhaW5lci5jbGVhcigpO1xuICAgIHRoaXMuX2Zvb3RlclJvd091dGxldC52aWV3Q29udGFpbmVyLmNsZWFyKCk7XG5cbiAgICB0aGlzLl9jYWNoZWRSZW5kZXJSb3dzTWFwLmNsZWFyKCk7XG5cbiAgICB0aGlzLl9vbkRlc3Ryb3kubmV4dCgpO1xuICAgIHRoaXMuX29uRGVzdHJveS5jb21wbGV0ZSgpO1xuXG4gICAgaWYgKGlzRGF0YVNvdXJjZSh0aGlzLmRhdGFTb3VyY2UpKSB7XG4gICAgICB0aGlzLmRhdGFTb3VyY2UuZGlzY29ubmVjdCh0aGlzKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVuZGVycyByb3dzIGJhc2VkIG9uIHRoZSB0YWJsZSdzIGxhdGVzdCBzZXQgb2YgZGF0YSwgd2hpY2ggd2FzIGVpdGhlciBwcm92aWRlZCBkaXJlY3RseSBhcyBhblxuICAgKiBpbnB1dCBvciByZXRyaWV2ZWQgdGhyb3VnaCBhbiBPYnNlcnZhYmxlIHN0cmVhbSAoZGlyZWN0bHkgb3IgZnJvbSBhIERhdGFTb3VyY2UpLlxuICAgKiBDaGVja3MgZm9yIGRpZmZlcmVuY2VzIGluIHRoZSBkYXRhIHNpbmNlIHRoZSBsYXN0IGRpZmYgdG8gcGVyZm9ybSBvbmx5IHRoZSBuZWNlc3NhcnlcbiAgICogY2hhbmdlcyAoYWRkL3JlbW92ZS9tb3ZlIHJvd3MpLlxuICAgKlxuICAgKiBJZiB0aGUgdGFibGUncyBkYXRhIHNvdXJjZSBpcyBhIERhdGFTb3VyY2Ugb3IgT2JzZXJ2YWJsZSwgdGhpcyB3aWxsIGJlIGludm9rZWQgYXV0b21hdGljYWxseVxuICAgKiBlYWNoIHRpbWUgdGhlIHByb3ZpZGVkIE9ic2VydmFibGUgc3RyZWFtIGVtaXRzIGEgbmV3IGRhdGEgYXJyYXkuIE90aGVyd2lzZSBpZiB5b3VyIGRhdGEgaXNcbiAgICogYW4gYXJyYXksIHRoaXMgZnVuY3Rpb24gd2lsbCBuZWVkIHRvIGJlIGNhbGxlZCB0byByZW5kZXIgYW55IGNoYW5nZXMuXG4gICAqL1xuICByZW5kZXJSb3dzKCkge1xuICAgIHRoaXMuX3JlbmRlclJvd3MgPSB0aGlzLl9nZXRBbGxSZW5kZXJSb3dzKCk7XG4gICAgY29uc3QgY2hhbmdlcyA9IHRoaXMuX2RhdGFEaWZmZXIuZGlmZih0aGlzLl9yZW5kZXJSb3dzKTtcbiAgICBpZiAoIWNoYW5nZXMpIHtcbiAgICAgIHRoaXMuX3VwZGF0ZU5vRGF0YVJvdygpO1xuICAgICAgdGhpcy5jb250ZW50Q2hhbmdlZC5uZXh0KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHZpZXdDb250YWluZXIgPSB0aGlzLl9yb3dPdXRsZXQudmlld0NvbnRhaW5lcjtcblxuICAgIHRoaXMuX3ZpZXdSZXBlYXRlci5hcHBseUNoYW5nZXMoXG4gICAgICBjaGFuZ2VzLFxuICAgICAgdmlld0NvbnRhaW5lcixcbiAgICAgIChcbiAgICAgICAgcmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZDxSZW5kZXJSb3c8VD4+LFxuICAgICAgICBfYWRqdXN0ZWRQcmV2aW91c0luZGV4OiBudW1iZXIgfCBudWxsLFxuICAgICAgICBjdXJyZW50SW5kZXg6IG51bWJlciB8IG51bGwsXG4gICAgICApID0+IHRoaXMuX2dldEVtYmVkZGVkVmlld0FyZ3MocmVjb3JkLml0ZW0sIGN1cnJlbnRJbmRleCEpLFxuICAgICAgcmVjb3JkID0+IHJlY29yZC5pdGVtLmRhdGEsXG4gICAgICAoY2hhbmdlOiBfVmlld1JlcGVhdGVySXRlbUNoYW5nZTxSZW5kZXJSb3c8VD4sIFJvd0NvbnRleHQ8VD4+KSA9PiB7XG4gICAgICAgIGlmIChjaGFuZ2Uub3BlcmF0aW9uID09PSBfVmlld1JlcGVhdGVyT3BlcmF0aW9uLklOU0VSVEVEICYmIGNoYW5nZS5jb250ZXh0KSB7XG4gICAgICAgICAgdGhpcy5fcmVuZGVyQ2VsbFRlbXBsYXRlRm9ySXRlbShjaGFuZ2UucmVjb3JkLml0ZW0ucm93RGVmLCBjaGFuZ2UuY29udGV4dCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgKTtcblxuICAgIC8vIFVwZGF0ZSB0aGUgbWV0YSBjb250ZXh0IG9mIGEgcm93J3MgY29udGV4dCBkYXRhIChpbmRleCwgY291bnQsIGZpcnN0LCBsYXN0LCAuLi4pXG4gICAgdGhpcy5fdXBkYXRlUm93SW5kZXhDb250ZXh0KCk7XG5cbiAgICAvLyBVcGRhdGUgcm93cyB0aGF0IGRpZCBub3QgZ2V0IGFkZGVkL3JlbW92ZWQvbW92ZWQgYnV0IG1heSBoYXZlIGhhZCB0aGVpciBpZGVudGl0eSBjaGFuZ2VkLFxuICAgIC8vIGUuZy4gaWYgdHJhY2tCeSBtYXRjaGVkIGRhdGEgb24gc29tZSBwcm9wZXJ0eSBidXQgdGhlIGFjdHVhbCBkYXRhIHJlZmVyZW5jZSBjaGFuZ2VkLlxuICAgIGNoYW5nZXMuZm9yRWFjaElkZW50aXR5Q2hhbmdlKChyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFJlbmRlclJvdzxUPj4pID0+IHtcbiAgICAgIGNvbnN0IHJvd1ZpZXcgPSA8Um93Vmlld1JlZjxUPj52aWV3Q29udGFpbmVyLmdldChyZWNvcmQuY3VycmVudEluZGV4ISk7XG4gICAgICByb3dWaWV3LmNvbnRleHQuJGltcGxpY2l0ID0gcmVjb3JkLml0ZW0uZGF0YTtcbiAgICB9KTtcblxuICAgIHRoaXMuX3VwZGF0ZU5vRGF0YVJvdygpO1xuXG4gICAgLy8gQWxsb3cgdGhlIG5ldyByb3cgZGF0YSB0byByZW5kZXIgYmVmb3JlIG1lYXN1cmluZyBpdC5cbiAgICAvLyBAYnJlYWtpbmctY2hhbmdlIDE0LjAuMCBSZW1vdmUgdW5kZWZpbmVkIGNoZWNrIG9uY2UgX25nWm9uZSBpcyByZXF1aXJlZC5cbiAgICBpZiAodGhpcy5fbmdab25lICYmIE5nWm9uZS5pc0luQW5ndWxhclpvbmUoKSkge1xuICAgICAgdGhpcy5fbmdab25lLm9uU3RhYmxlLnBpcGUodGFrZSgxKSwgdGFrZVVudGlsKHRoaXMuX29uRGVzdHJveSkpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgIHRoaXMudXBkYXRlU3RpY2t5Q29sdW1uU3R5bGVzKCk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy51cGRhdGVTdGlja3lDb2x1bW5TdHlsZXMoKTtcbiAgICB9XG5cbiAgICB0aGlzLmNvbnRlbnRDaGFuZ2VkLm5leHQoKTtcbiAgfVxuXG4gIC8qKiBBZGRzIGEgY29sdW1uIGRlZmluaXRpb24gdGhhdCB3YXMgbm90IGluY2x1ZGVkIGFzIHBhcnQgb2YgdGhlIGNvbnRlbnQgY2hpbGRyZW4uICovXG4gIGFkZENvbHVtbkRlZihjb2x1bW5EZWY6IENka0NvbHVtbkRlZikge1xuICAgIHRoaXMuX2N1c3RvbUNvbHVtbkRlZnMuYWRkKGNvbHVtbkRlZik7XG4gIH1cblxuICAvKiogUmVtb3ZlcyBhIGNvbHVtbiBkZWZpbml0aW9uIHRoYXQgd2FzIG5vdCBpbmNsdWRlZCBhcyBwYXJ0IG9mIHRoZSBjb250ZW50IGNoaWxkcmVuLiAqL1xuICByZW1vdmVDb2x1bW5EZWYoY29sdW1uRGVmOiBDZGtDb2x1bW5EZWYpIHtcbiAgICB0aGlzLl9jdXN0b21Db2x1bW5EZWZzLmRlbGV0ZShjb2x1bW5EZWYpO1xuICB9XG5cbiAgLyoqIEFkZHMgYSByb3cgZGVmaW5pdGlvbiB0aGF0IHdhcyBub3QgaW5jbHVkZWQgYXMgcGFydCBvZiB0aGUgY29udGVudCBjaGlsZHJlbi4gKi9cbiAgYWRkUm93RGVmKHJvd0RlZjogQ2RrUm93RGVmPFQ+KSB7XG4gICAgdGhpcy5fY3VzdG9tUm93RGVmcy5hZGQocm93RGVmKTtcbiAgfVxuXG4gIC8qKiBSZW1vdmVzIGEgcm93IGRlZmluaXRpb24gdGhhdCB3YXMgbm90IGluY2x1ZGVkIGFzIHBhcnQgb2YgdGhlIGNvbnRlbnQgY2hpbGRyZW4uICovXG4gIHJlbW92ZVJvd0RlZihyb3dEZWY6IENka1Jvd0RlZjxUPikge1xuICAgIHRoaXMuX2N1c3RvbVJvd0RlZnMuZGVsZXRlKHJvd0RlZik7XG4gIH1cblxuICAvKiogQWRkcyBhIGhlYWRlciByb3cgZGVmaW5pdGlvbiB0aGF0IHdhcyBub3QgaW5jbHVkZWQgYXMgcGFydCBvZiB0aGUgY29udGVudCBjaGlsZHJlbi4gKi9cbiAgYWRkSGVhZGVyUm93RGVmKGhlYWRlclJvd0RlZjogQ2RrSGVhZGVyUm93RGVmKSB7XG4gICAgdGhpcy5fY3VzdG9tSGVhZGVyUm93RGVmcy5hZGQoaGVhZGVyUm93RGVmKTtcbiAgICB0aGlzLl9oZWFkZXJSb3dEZWZDaGFuZ2VkID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKiBSZW1vdmVzIGEgaGVhZGVyIHJvdyBkZWZpbml0aW9uIHRoYXQgd2FzIG5vdCBpbmNsdWRlZCBhcyBwYXJ0IG9mIHRoZSBjb250ZW50IGNoaWxkcmVuLiAqL1xuICByZW1vdmVIZWFkZXJSb3dEZWYoaGVhZGVyUm93RGVmOiBDZGtIZWFkZXJSb3dEZWYpIHtcbiAgICB0aGlzLl9jdXN0b21IZWFkZXJSb3dEZWZzLmRlbGV0ZShoZWFkZXJSb3dEZWYpO1xuICAgIHRoaXMuX2hlYWRlclJvd0RlZkNoYW5nZWQgPSB0cnVlO1xuICB9XG5cbiAgLyoqIEFkZHMgYSBmb290ZXIgcm93IGRlZmluaXRpb24gdGhhdCB3YXMgbm90IGluY2x1ZGVkIGFzIHBhcnQgb2YgdGhlIGNvbnRlbnQgY2hpbGRyZW4uICovXG4gIGFkZEZvb3RlclJvd0RlZihmb290ZXJSb3dEZWY6IENka0Zvb3RlclJvd0RlZikge1xuICAgIHRoaXMuX2N1c3RvbUZvb3RlclJvd0RlZnMuYWRkKGZvb3RlclJvd0RlZik7XG4gICAgdGhpcy5fZm9vdGVyUm93RGVmQ2hhbmdlZCA9IHRydWU7XG4gIH1cblxuICAvKiogUmVtb3ZlcyBhIGZvb3RlciByb3cgZGVmaW5pdGlvbiB0aGF0IHdhcyBub3QgaW5jbHVkZWQgYXMgcGFydCBvZiB0aGUgY29udGVudCBjaGlsZHJlbi4gKi9cbiAgcmVtb3ZlRm9vdGVyUm93RGVmKGZvb3RlclJvd0RlZjogQ2RrRm9vdGVyUm93RGVmKSB7XG4gICAgdGhpcy5fY3VzdG9tRm9vdGVyUm93RGVmcy5kZWxldGUoZm9vdGVyUm93RGVmKTtcbiAgICB0aGlzLl9mb290ZXJSb3dEZWZDaGFuZ2VkID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKiBTZXRzIGEgbm8gZGF0YSByb3cgZGVmaW5pdGlvbiB0aGF0IHdhcyBub3QgaW5jbHVkZWQgYXMgYSBwYXJ0IG9mIHRoZSBjb250ZW50IGNoaWxkcmVuLiAqL1xuICBzZXROb0RhdGFSb3cobm9EYXRhUm93OiBDZGtOb0RhdGFSb3cgfCBudWxsKSB7XG4gICAgdGhpcy5fY3VzdG9tTm9EYXRhUm93ID0gbm9EYXRhUm93O1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGhlYWRlciBzdGlja3kgc3R5bGVzLiBGaXJzdCByZXNldHMgYWxsIGFwcGxpZWQgc3R5bGVzIHdpdGggcmVzcGVjdCB0byB0aGUgY2VsbHNcbiAgICogc3RpY2tpbmcgdG8gdGhlIHRvcC4gVGhlbiwgZXZhbHVhdGluZyB3aGljaCBjZWxscyBuZWVkIHRvIGJlIHN0dWNrIHRvIHRoZSB0b3AuIFRoaXMgaXNcbiAgICogYXV0b21hdGljYWxseSBjYWxsZWQgd2hlbiB0aGUgaGVhZGVyIHJvdyBjaGFuZ2VzIGl0cyBkaXNwbGF5ZWQgc2V0IG9mIGNvbHVtbnMsIG9yIGlmIGl0c1xuICAgKiBzdGlja3kgaW5wdXQgY2hhbmdlcy4gTWF5IGJlIGNhbGxlZCBtYW51YWxseSBmb3IgY2FzZXMgd2hlcmUgdGhlIGNlbGwgY29udGVudCBjaGFuZ2VzIG91dHNpZGVcbiAgICogb2YgdGhlc2UgZXZlbnRzLlxuICAgKi9cbiAgdXBkYXRlU3RpY2t5SGVhZGVyUm93U3R5bGVzKCk6IHZvaWQge1xuICAgIGNvbnN0IGhlYWRlclJvd3MgPSB0aGlzLl9nZXRSZW5kZXJlZFJvd3ModGhpcy5faGVhZGVyUm93T3V0bGV0KTtcbiAgICBjb25zdCB0YWJsZUVsZW1lbnQgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQgYXMgSFRNTEVsZW1lbnQ7XG5cbiAgICAvLyBIaWRlIHRoZSB0aGVhZCBlbGVtZW50IGlmIHRoZXJlIGFyZSBubyBoZWFkZXIgcm93cy4gVGhpcyBpcyBuZWNlc3NhcnkgdG8gc2F0aXNmeVxuICAgIC8vIG92ZXJ6ZWFsb3VzIGExMXkgY2hlY2tlcnMgdGhhdCBmYWlsIGJlY2F1c2UgdGhlIGByb3dncm91cGAgZWxlbWVudCBkb2VzIG5vdCBjb250YWluXG4gICAgLy8gcmVxdWlyZWQgY2hpbGQgYHJvd2AuXG4gICAgY29uc3QgdGhlYWQgPSB0YWJsZUVsZW1lbnQucXVlcnlTZWxlY3RvcigndGhlYWQnKTtcbiAgICBpZiAodGhlYWQpIHtcbiAgICAgIHRoZWFkLnN0eWxlLmRpc3BsYXkgPSBoZWFkZXJSb3dzLmxlbmd0aCA/ICcnIDogJ25vbmUnO1xuICAgIH1cblxuICAgIGNvbnN0IHN0aWNreVN0YXRlcyA9IHRoaXMuX2hlYWRlclJvd0RlZnMubWFwKGRlZiA9PiBkZWYuc3RpY2t5KTtcbiAgICB0aGlzLl9zdGlja3lTdHlsZXIuY2xlYXJTdGlja3lQb3NpdGlvbmluZyhoZWFkZXJSb3dzLCBbJ3RvcCddKTtcbiAgICB0aGlzLl9zdGlja3lTdHlsZXIuc3RpY2tSb3dzKGhlYWRlclJvd3MsIHN0aWNreVN0YXRlcywgJ3RvcCcpO1xuXG4gICAgLy8gUmVzZXQgdGhlIGRpcnR5IHN0YXRlIG9mIHRoZSBzdGlja3kgaW5wdXQgY2hhbmdlIHNpbmNlIGl0IGhhcyBiZWVuIHVzZWQuXG4gICAgdGhpcy5faGVhZGVyUm93RGVmcy5mb3JFYWNoKGRlZiA9PiBkZWYucmVzZXRTdGlja3lDaGFuZ2VkKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGZvb3RlciBzdGlja3kgc3R5bGVzLiBGaXJzdCByZXNldHMgYWxsIGFwcGxpZWQgc3R5bGVzIHdpdGggcmVzcGVjdCB0byB0aGUgY2VsbHNcbiAgICogc3RpY2tpbmcgdG8gdGhlIGJvdHRvbS4gVGhlbiwgZXZhbHVhdGluZyB3aGljaCBjZWxscyBuZWVkIHRvIGJlIHN0dWNrIHRvIHRoZSBib3R0b20uIFRoaXMgaXNcbiAgICogYXV0b21hdGljYWxseSBjYWxsZWQgd2hlbiB0aGUgZm9vdGVyIHJvdyBjaGFuZ2VzIGl0cyBkaXNwbGF5ZWQgc2V0IG9mIGNvbHVtbnMsIG9yIGlmIGl0c1xuICAgKiBzdGlja3kgaW5wdXQgY2hhbmdlcy4gTWF5IGJlIGNhbGxlZCBtYW51YWxseSBmb3IgY2FzZXMgd2hlcmUgdGhlIGNlbGwgY29udGVudCBjaGFuZ2VzIG91dHNpZGVcbiAgICogb2YgdGhlc2UgZXZlbnRzLlxuICAgKi9cbiAgdXBkYXRlU3RpY2t5Rm9vdGVyUm93U3R5bGVzKCk6IHZvaWQge1xuICAgIGNvbnN0IGZvb3RlclJvd3MgPSB0aGlzLl9nZXRSZW5kZXJlZFJvd3ModGhpcy5fZm9vdGVyUm93T3V0bGV0KTtcbiAgICBjb25zdCB0YWJsZUVsZW1lbnQgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQgYXMgSFRNTEVsZW1lbnQ7XG5cbiAgICAvLyBIaWRlIHRoZSB0Zm9vdCBlbGVtZW50IGlmIHRoZXJlIGFyZSBubyBmb290ZXIgcm93cy4gVGhpcyBpcyBuZWNlc3NhcnkgdG8gc2F0aXNmeVxuICAgIC8vIG92ZXJ6ZWFsb3VzIGExMXkgY2hlY2tlcnMgdGhhdCBmYWlsIGJlY2F1c2UgdGhlIGByb3dncm91cGAgZWxlbWVudCBkb2VzIG5vdCBjb250YWluXG4gICAgLy8gcmVxdWlyZWQgY2hpbGQgYHJvd2AuXG4gICAgY29uc3QgdGZvb3QgPSB0YWJsZUVsZW1lbnQucXVlcnlTZWxlY3RvcigndGZvb3QnKTtcbiAgICBpZiAodGZvb3QpIHtcbiAgICAgIHRmb290LnN0eWxlLmRpc3BsYXkgPSBmb290ZXJSb3dzLmxlbmd0aCA/ICcnIDogJ25vbmUnO1xuICAgIH1cblxuICAgIGNvbnN0IHN0aWNreVN0YXRlcyA9IHRoaXMuX2Zvb3RlclJvd0RlZnMubWFwKGRlZiA9PiBkZWYuc3RpY2t5KTtcbiAgICB0aGlzLl9zdGlja3lTdHlsZXIuY2xlYXJTdGlja3lQb3NpdGlvbmluZyhmb290ZXJSb3dzLCBbJ2JvdHRvbSddKTtcbiAgICB0aGlzLl9zdGlja3lTdHlsZXIuc3RpY2tSb3dzKGZvb3RlclJvd3MsIHN0aWNreVN0YXRlcywgJ2JvdHRvbScpO1xuICAgIHRoaXMuX3N0aWNreVN0eWxlci51cGRhdGVTdGlja3lGb290ZXJDb250YWluZXIodGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LCBzdGlja3lTdGF0ZXMpO1xuXG4gICAgLy8gUmVzZXQgdGhlIGRpcnR5IHN0YXRlIG9mIHRoZSBzdGlja3kgaW5wdXQgY2hhbmdlIHNpbmNlIGl0IGhhcyBiZWVuIHVzZWQuXG4gICAgdGhpcy5fZm9vdGVyUm93RGVmcy5mb3JFYWNoKGRlZiA9PiBkZWYucmVzZXRTdGlja3lDaGFuZ2VkKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGNvbHVtbiBzdGlja3kgc3R5bGVzLiBGaXJzdCByZXNldHMgYWxsIGFwcGxpZWQgc3R5bGVzIHdpdGggcmVzcGVjdCB0byB0aGUgY2VsbHNcbiAgICogc3RpY2tpbmcgdG8gdGhlIGxlZnQgYW5kIHJpZ2h0LiBUaGVuIHN0aWNreSBzdHlsZXMgYXJlIGFkZGVkIGZvciB0aGUgbGVmdCBhbmQgcmlnaHQgYWNjb3JkaW5nXG4gICAqIHRvIHRoZSBjb2x1bW4gZGVmaW5pdGlvbnMgZm9yIGVhY2ggY2VsbCBpbiBlYWNoIHJvdy4gVGhpcyBpcyBhdXRvbWF0aWNhbGx5IGNhbGxlZCB3aGVuXG4gICAqIHRoZSBkYXRhIHNvdXJjZSBwcm92aWRlcyBhIG5ldyBzZXQgb2YgZGF0YSBvciB3aGVuIGEgY29sdW1uIGRlZmluaXRpb24gY2hhbmdlcyBpdHMgc3RpY2t5XG4gICAqIGlucHV0LiBNYXkgYmUgY2FsbGVkIG1hbnVhbGx5IGZvciBjYXNlcyB3aGVyZSB0aGUgY2VsbCBjb250ZW50IGNoYW5nZXMgb3V0c2lkZSBvZiB0aGVzZSBldmVudHMuXG4gICAqL1xuICB1cGRhdGVTdGlja3lDb2x1bW5TdHlsZXMoKSB7XG4gICAgY29uc3QgaGVhZGVyUm93cyA9IHRoaXMuX2dldFJlbmRlcmVkUm93cyh0aGlzLl9oZWFkZXJSb3dPdXRsZXQpO1xuICAgIGNvbnN0IGRhdGFSb3dzID0gdGhpcy5fZ2V0UmVuZGVyZWRSb3dzKHRoaXMuX3Jvd091dGxldCk7XG4gICAgY29uc3QgZm9vdGVyUm93cyA9IHRoaXMuX2dldFJlbmRlcmVkUm93cyh0aGlzLl9mb290ZXJSb3dPdXRsZXQpO1xuXG4gICAgLy8gRm9yIHRhYmxlcyBub3QgdXNpbmcgYSBmaXhlZCBsYXlvdXQsIHRoZSBjb2x1bW4gd2lkdGhzIG1heSBjaGFuZ2Ugd2hlbiBuZXcgcm93cyBhcmUgcmVuZGVyZWQuXG4gICAgLy8gSW4gYSB0YWJsZSB1c2luZyBhIGZpeGVkIGxheW91dCwgcm93IGNvbnRlbnQgd29uJ3QgYWZmZWN0IGNvbHVtbiB3aWR0aCwgc28gc3RpY2t5IHN0eWxlc1xuICAgIC8vIGRvbid0IG5lZWQgdG8gYmUgY2xlYXJlZCB1bmxlc3MgZWl0aGVyIHRoZSBzdGlja3kgY29sdW1uIGNvbmZpZyBjaGFuZ2VzIG9yIG9uZSBvZiB0aGUgcm93XG4gICAgLy8gZGVmcyBjaGFuZ2UuXG4gICAgaWYgKCh0aGlzLl9pc05hdGl2ZUh0bWxUYWJsZSAmJiAhdGhpcy5fZml4ZWRMYXlvdXQpIHx8IHRoaXMuX3N0aWNreUNvbHVtblN0eWxlc05lZWRSZXNldCkge1xuICAgICAgLy8gQ2xlYXIgdGhlIGxlZnQgYW5kIHJpZ2h0IHBvc2l0aW9uaW5nIGZyb20gYWxsIGNvbHVtbnMgaW4gdGhlIHRhYmxlIGFjcm9zcyBhbGwgcm93cyBzaW5jZVxuICAgICAgLy8gc3RpY2t5IGNvbHVtbnMgc3BhbiBhY3Jvc3MgYWxsIHRhYmxlIHNlY3Rpb25zIChoZWFkZXIsIGRhdGEsIGZvb3RlcilcbiAgICAgIHRoaXMuX3N0aWNreVN0eWxlci5jbGVhclN0aWNreVBvc2l0aW9uaW5nKFxuICAgICAgICBbLi4uaGVhZGVyUm93cywgLi4uZGF0YVJvd3MsIC4uLmZvb3RlclJvd3NdLFxuICAgICAgICBbJ2xlZnQnLCAncmlnaHQnXSxcbiAgICAgICk7XG4gICAgICB0aGlzLl9zdGlja3lDb2x1bW5TdHlsZXNOZWVkUmVzZXQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgdGhlIHN0aWNreSBzdHlsZXMgZm9yIGVhY2ggaGVhZGVyIHJvdyBkZXBlbmRpbmcgb24gdGhlIGRlZidzIHN0aWNreSBzdGF0ZVxuICAgIGhlYWRlclJvd3MuZm9yRWFjaCgoaGVhZGVyUm93LCBpKSA9PiB7XG4gICAgICB0aGlzLl9hZGRTdGlja3lDb2x1bW5TdHlsZXMoW2hlYWRlclJvd10sIHRoaXMuX2hlYWRlclJvd0RlZnNbaV0pO1xuICAgIH0pO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBzdGlja3kgc3R5bGVzIGZvciBlYWNoIGRhdGEgcm93IGRlcGVuZGluZyBvbiBpdHMgZGVmJ3Mgc3RpY2t5IHN0YXRlXG4gICAgdGhpcy5fcm93RGVmcy5mb3JFYWNoKHJvd0RlZiA9PiB7XG4gICAgICAvLyBDb2xsZWN0IGFsbCB0aGUgcm93cyByZW5kZXJlZCB3aXRoIHRoaXMgcm93IGRlZmluaXRpb24uXG4gICAgICBjb25zdCByb3dzOiBIVE1MRWxlbWVudFtdID0gW107XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGFSb3dzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0aGlzLl9yZW5kZXJSb3dzW2ldLnJvd0RlZiA9PT0gcm93RGVmKSB7XG4gICAgICAgICAgcm93cy5wdXNoKGRhdGFSb3dzW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLl9hZGRTdGlja3lDb2x1bW5TdHlsZXMocm93cywgcm93RGVmKTtcbiAgICB9KTtcblxuICAgIC8vIFVwZGF0ZSB0aGUgc3RpY2t5IHN0eWxlcyBmb3IgZWFjaCBmb290ZXIgcm93IGRlcGVuZGluZyBvbiB0aGUgZGVmJ3Mgc3RpY2t5IHN0YXRlXG4gICAgZm9vdGVyUm93cy5mb3JFYWNoKChmb290ZXJSb3csIGkpID0+IHtcbiAgICAgIHRoaXMuX2FkZFN0aWNreUNvbHVtblN0eWxlcyhbZm9vdGVyUm93XSwgdGhpcy5fZm9vdGVyUm93RGVmc1tpXSk7XG4gICAgfSk7XG5cbiAgICAvLyBSZXNldCB0aGUgZGlydHkgc3RhdGUgb2YgdGhlIHN0aWNreSBpbnB1dCBjaGFuZ2Ugc2luY2UgaXQgaGFzIGJlZW4gdXNlZC5cbiAgICBBcnJheS5mcm9tKHRoaXMuX2NvbHVtbkRlZnNCeU5hbWUudmFsdWVzKCkpLmZvckVhY2goZGVmID0+IGRlZi5yZXNldFN0aWNreUNoYW5nZWQoKSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBsaXN0IG9mIFJlbmRlclJvdyBvYmplY3RzIHRvIHJlbmRlciBhY2NvcmRpbmcgdG8gdGhlIGN1cnJlbnQgbGlzdCBvZiBkYXRhIGFuZCBkZWZpbmVkXG4gICAqIHJvdyBkZWZpbml0aW9ucy4gSWYgdGhlIHByZXZpb3VzIGxpc3QgYWxyZWFkeSBjb250YWluZWQgYSBwYXJ0aWN1bGFyIHBhaXIsIGl0IHNob3VsZCBiZSByZXVzZWRcbiAgICogc28gdGhhdCB0aGUgZGlmZmVyIGVxdWF0ZXMgdGhlaXIgcmVmZXJlbmNlcy5cbiAgICovXG4gIHByaXZhdGUgX2dldEFsbFJlbmRlclJvd3MoKTogUmVuZGVyUm93PFQ+W10ge1xuICAgIGNvbnN0IHJlbmRlclJvd3M6IFJlbmRlclJvdzxUPltdID0gW107XG5cbiAgICAvLyBTdG9yZSB0aGUgY2FjaGUgYW5kIGNyZWF0ZSBhIG5ldyBvbmUuIEFueSByZS11c2VkIFJlbmRlclJvdyBvYmplY3RzIHdpbGwgYmUgbW92ZWQgaW50byB0aGVcbiAgICAvLyBuZXcgY2FjaGUgd2hpbGUgdW51c2VkIG9uZXMgY2FuIGJlIHBpY2tlZCB1cCBieSBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgY29uc3QgcHJldkNhY2hlZFJlbmRlclJvd3MgPSB0aGlzLl9jYWNoZWRSZW5kZXJSb3dzTWFwO1xuICAgIHRoaXMuX2NhY2hlZFJlbmRlclJvd3NNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICAvLyBGb3IgZWFjaCBkYXRhIG9iamVjdCwgZ2V0IHRoZSBsaXN0IG9mIHJvd3MgdGhhdCBzaG91bGQgYmUgcmVuZGVyZWQsIHJlcHJlc2VudGVkIGJ5IHRoZVxuICAgIC8vIHJlc3BlY3RpdmUgYFJlbmRlclJvd2Agb2JqZWN0IHdoaWNoIGlzIHRoZSBwYWlyIG9mIGBkYXRhYCBhbmQgYENka1Jvd0RlZmAuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9kYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgZGF0YSA9IHRoaXMuX2RhdGFbaV07XG4gICAgICBjb25zdCByZW5kZXJSb3dzRm9yRGF0YSA9IHRoaXMuX2dldFJlbmRlclJvd3NGb3JEYXRhKGRhdGEsIGksIHByZXZDYWNoZWRSZW5kZXJSb3dzLmdldChkYXRhKSk7XG5cbiAgICAgIGlmICghdGhpcy5fY2FjaGVkUmVuZGVyUm93c01hcC5oYXMoZGF0YSkpIHtcbiAgICAgICAgdGhpcy5fY2FjaGVkUmVuZGVyUm93c01hcC5zZXQoZGF0YSwgbmV3IFdlYWtNYXAoKSk7XG4gICAgICB9XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcmVuZGVyUm93c0ZvckRhdGEubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgbGV0IHJlbmRlclJvdyA9IHJlbmRlclJvd3NGb3JEYXRhW2pdO1xuXG4gICAgICAgIGNvbnN0IGNhY2hlID0gdGhpcy5fY2FjaGVkUmVuZGVyUm93c01hcC5nZXQocmVuZGVyUm93LmRhdGEpITtcbiAgICAgICAgaWYgKGNhY2hlLmhhcyhyZW5kZXJSb3cucm93RGVmKSkge1xuICAgICAgICAgIGNhY2hlLmdldChyZW5kZXJSb3cucm93RGVmKSEucHVzaChyZW5kZXJSb3cpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNhY2hlLnNldChyZW5kZXJSb3cucm93RGVmLCBbcmVuZGVyUm93XSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVuZGVyUm93cy5wdXNoKHJlbmRlclJvdyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlbmRlclJvd3M7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIGxpc3Qgb2YgYFJlbmRlclJvdzxUPmAgZm9yIHRoZSBwcm92aWRlZCBkYXRhIG9iamVjdCBhbmQgYW55IGBDZGtSb3dEZWZgIG9iamVjdHMgdGhhdFxuICAgKiBzaG91bGQgYmUgcmVuZGVyZWQgZm9yIHRoaXMgZGF0YS4gUmV1c2VzIHRoZSBjYWNoZWQgUmVuZGVyUm93IG9iamVjdHMgaWYgdGhleSBtYXRjaCB0aGUgc2FtZVxuICAgKiBgKFQsIENka1Jvd0RlZilgIHBhaXIuXG4gICAqL1xuICBwcml2YXRlIF9nZXRSZW5kZXJSb3dzRm9yRGF0YShcbiAgICBkYXRhOiBULFxuICAgIGRhdGFJbmRleDogbnVtYmVyLFxuICAgIGNhY2hlPzogV2Vha01hcDxDZGtSb3dEZWY8VD4sIFJlbmRlclJvdzxUPltdPixcbiAgKTogUmVuZGVyUm93PFQ+W10ge1xuICAgIGNvbnN0IHJvd0RlZnMgPSB0aGlzLl9nZXRSb3dEZWZzKGRhdGEsIGRhdGFJbmRleCk7XG5cbiAgICByZXR1cm4gcm93RGVmcy5tYXAocm93RGVmID0+IHtcbiAgICAgIGNvbnN0IGNhY2hlZFJlbmRlclJvd3MgPSBjYWNoZSAmJiBjYWNoZS5oYXMocm93RGVmKSA/IGNhY2hlLmdldChyb3dEZWYpISA6IFtdO1xuICAgICAgaWYgKGNhY2hlZFJlbmRlclJvd3MubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IGRhdGFSb3cgPSBjYWNoZWRSZW5kZXJSb3dzLnNoaWZ0KCkhO1xuICAgICAgICBkYXRhUm93LmRhdGFJbmRleCA9IGRhdGFJbmRleDtcbiAgICAgICAgcmV0dXJuIGRhdGFSb3c7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ge2RhdGEsIHJvd0RlZiwgZGF0YUluZGV4fTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBVcGRhdGUgdGhlIG1hcCBjb250YWluaW5nIHRoZSBjb250ZW50J3MgY29sdW1uIGRlZmluaXRpb25zLiAqL1xuICBwcml2YXRlIF9jYWNoZUNvbHVtbkRlZnMoKSB7XG4gICAgdGhpcy5fY29sdW1uRGVmc0J5TmFtZS5jbGVhcigpO1xuXG4gICAgY29uc3QgY29sdW1uRGVmcyA9IG1lcmdlQXJyYXlBbmRTZXQoXG4gICAgICB0aGlzLl9nZXRPd25EZWZzKHRoaXMuX2NvbnRlbnRDb2x1bW5EZWZzKSxcbiAgICAgIHRoaXMuX2N1c3RvbUNvbHVtbkRlZnMsXG4gICAgKTtcbiAgICBjb2x1bW5EZWZzLmZvckVhY2goY29sdW1uRGVmID0+IHtcbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5fY29sdW1uRGVmc0J5TmFtZS5oYXMoY29sdW1uRGVmLm5hbWUpICYmXG4gICAgICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpXG4gICAgICApIHtcbiAgICAgICAgdGhyb3cgZ2V0VGFibGVEdXBsaWNhdGVDb2x1bW5OYW1lRXJyb3IoY29sdW1uRGVmLm5hbWUpO1xuICAgICAgfVxuICAgICAgdGhpcy5fY29sdW1uRGVmc0J5TmFtZS5zZXQoY29sdW1uRGVmLm5hbWUsIGNvbHVtbkRlZik7XG4gICAgfSk7XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSBsaXN0IG9mIGFsbCBhdmFpbGFibGUgcm93IGRlZmluaXRpb25zIHRoYXQgY2FuIGJlIHVzZWQuICovXG4gIHByaXZhdGUgX2NhY2hlUm93RGVmcygpIHtcbiAgICB0aGlzLl9oZWFkZXJSb3dEZWZzID0gbWVyZ2VBcnJheUFuZFNldChcbiAgICAgIHRoaXMuX2dldE93bkRlZnModGhpcy5fY29udGVudEhlYWRlclJvd0RlZnMpLFxuICAgICAgdGhpcy5fY3VzdG9tSGVhZGVyUm93RGVmcyxcbiAgICApO1xuICAgIHRoaXMuX2Zvb3RlclJvd0RlZnMgPSBtZXJnZUFycmF5QW5kU2V0KFxuICAgICAgdGhpcy5fZ2V0T3duRGVmcyh0aGlzLl9jb250ZW50Rm9vdGVyUm93RGVmcyksXG4gICAgICB0aGlzLl9jdXN0b21Gb290ZXJSb3dEZWZzLFxuICAgICk7XG4gICAgdGhpcy5fcm93RGVmcyA9IG1lcmdlQXJyYXlBbmRTZXQodGhpcy5fZ2V0T3duRGVmcyh0aGlzLl9jb250ZW50Um93RGVmcyksIHRoaXMuX2N1c3RvbVJvd0RlZnMpO1xuXG4gICAgLy8gQWZ0ZXIgYWxsIHJvdyBkZWZpbml0aW9ucyBhcmUgZGV0ZXJtaW5lZCwgZmluZCB0aGUgcm93IGRlZmluaXRpb24gdG8gYmUgY29uc2lkZXJlZCBkZWZhdWx0LlxuICAgIGNvbnN0IGRlZmF1bHRSb3dEZWZzID0gdGhpcy5fcm93RGVmcy5maWx0ZXIoZGVmID0+ICFkZWYud2hlbik7XG4gICAgaWYgKFxuICAgICAgIXRoaXMubXVsdGlUZW1wbGF0ZURhdGFSb3dzICYmXG4gICAgICBkZWZhdWx0Um93RGVmcy5sZW5ndGggPiAxICYmXG4gICAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKVxuICAgICkge1xuICAgICAgdGhyb3cgZ2V0VGFibGVNdWx0aXBsZURlZmF1bHRSb3dEZWZzRXJyb3IoKTtcbiAgICB9XG4gICAgdGhpcy5fZGVmYXVsdFJvd0RlZiA9IGRlZmF1bHRSb3dEZWZzWzBdO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHRoZSBoZWFkZXIsIGRhdGEsIG9yIGZvb3RlciByb3dzIGhhdmUgY2hhbmdlZCB3aGF0IGNvbHVtbnMgdGhleSB3YW50IHRvIGRpc3BsYXkgb3JcbiAgICogd2hldGhlciB0aGUgc3RpY2t5IHN0YXRlcyBoYXZlIGNoYW5nZWQgZm9yIHRoZSBoZWFkZXIgb3IgZm9vdGVyLiBJZiB0aGVyZSBpcyBhIGRpZmYsIHRoZW5cbiAgICogcmUtcmVuZGVyIHRoYXQgc2VjdGlvbi5cbiAgICovXG4gIHByaXZhdGUgX3JlbmRlclVwZGF0ZWRDb2x1bW5zKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGNvbHVtbnNEaWZmUmVkdWNlciA9IChhY2M6IGJvb2xlYW4sIGRlZjogQmFzZVJvd0RlZikgPT4gYWNjIHx8ICEhZGVmLmdldENvbHVtbnNEaWZmKCk7XG5cbiAgICAvLyBGb3JjZSByZS1yZW5kZXIgZGF0YSByb3dzIGlmIHRoZSBsaXN0IG9mIGNvbHVtbiBkZWZpbml0aW9ucyBoYXZlIGNoYW5nZWQuXG4gICAgY29uc3QgZGF0YUNvbHVtbnNDaGFuZ2VkID0gdGhpcy5fcm93RGVmcy5yZWR1Y2UoY29sdW1uc0RpZmZSZWR1Y2VyLCBmYWxzZSk7XG4gICAgaWYgKGRhdGFDb2x1bW5zQ2hhbmdlZCkge1xuICAgICAgdGhpcy5fZm9yY2VSZW5kZXJEYXRhUm93cygpO1xuICAgIH1cblxuICAgIC8vIEZvcmNlIHJlLXJlbmRlciBoZWFkZXIvZm9vdGVyIHJvd3MgaWYgdGhlIGxpc3Qgb2YgY29sdW1uIGRlZmluaXRpb25zIGhhdmUgY2hhbmdlZC5cbiAgICBjb25zdCBoZWFkZXJDb2x1bW5zQ2hhbmdlZCA9IHRoaXMuX2hlYWRlclJvd0RlZnMucmVkdWNlKGNvbHVtbnNEaWZmUmVkdWNlciwgZmFsc2UpO1xuICAgIGlmIChoZWFkZXJDb2x1bW5zQ2hhbmdlZCkge1xuICAgICAgdGhpcy5fZm9yY2VSZW5kZXJIZWFkZXJSb3dzKCk7XG4gICAgfVxuXG4gICAgY29uc3QgZm9vdGVyQ29sdW1uc0NoYW5nZWQgPSB0aGlzLl9mb290ZXJSb3dEZWZzLnJlZHVjZShjb2x1bW5zRGlmZlJlZHVjZXIsIGZhbHNlKTtcbiAgICBpZiAoZm9vdGVyQ29sdW1uc0NoYW5nZWQpIHtcbiAgICAgIHRoaXMuX2ZvcmNlUmVuZGVyRm9vdGVyUm93cygpO1xuICAgIH1cblxuICAgIHJldHVybiBkYXRhQ29sdW1uc0NoYW5nZWQgfHwgaGVhZGVyQ29sdW1uc0NoYW5nZWQgfHwgZm9vdGVyQ29sdW1uc0NoYW5nZWQ7XG4gIH1cblxuICAvKipcbiAgICogU3dpdGNoIHRvIHRoZSBwcm92aWRlZCBkYXRhIHNvdXJjZSBieSByZXNldHRpbmcgdGhlIGRhdGEgYW5kIHVuc3Vic2NyaWJpbmcgZnJvbSB0aGUgY3VycmVudFxuICAgKiByZW5kZXIgY2hhbmdlIHN1YnNjcmlwdGlvbiBpZiBvbmUgZXhpc3RzLiBJZiB0aGUgZGF0YSBzb3VyY2UgaXMgbnVsbCwgaW50ZXJwcmV0IHRoaXMgYnlcbiAgICogY2xlYXJpbmcgdGhlIHJvdyBvdXRsZXQuIE90aGVyd2lzZSBzdGFydCBsaXN0ZW5pbmcgZm9yIG5ldyBkYXRhLlxuICAgKi9cbiAgcHJpdmF0ZSBfc3dpdGNoRGF0YVNvdXJjZShkYXRhU291cmNlOiBDZGtUYWJsZURhdGFTb3VyY2VJbnB1dDxUPikge1xuICAgIHRoaXMuX2RhdGEgPSBbXTtcblxuICAgIGlmIChpc0RhdGFTb3VyY2UodGhpcy5kYXRhU291cmNlKSkge1xuICAgICAgdGhpcy5kYXRhU291cmNlLmRpc2Nvbm5lY3QodGhpcyk7XG4gICAgfVxuXG4gICAgLy8gU3RvcCBsaXN0ZW5pbmcgZm9yIGRhdGEgZnJvbSB0aGUgcHJldmlvdXMgZGF0YSBzb3VyY2UuXG4gICAgaWYgKHRoaXMuX3JlbmRlckNoYW5nZVN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fcmVuZGVyQ2hhbmdlU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLl9yZW5kZXJDaGFuZ2VTdWJzY3JpcHRpb24gPSBudWxsO1xuICAgIH1cblxuICAgIGlmICghZGF0YVNvdXJjZSkge1xuICAgICAgaWYgKHRoaXMuX2RhdGFEaWZmZXIpIHtcbiAgICAgICAgdGhpcy5fZGF0YURpZmZlci5kaWZmKFtdKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3Jvd091dGxldC52aWV3Q29udGFpbmVyLmNsZWFyKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fZGF0YVNvdXJjZSA9IGRhdGFTb3VyY2U7XG4gIH1cblxuICAvKiogU2V0IHVwIGEgc3Vic2NyaXB0aW9uIGZvciB0aGUgZGF0YSBwcm92aWRlZCBieSB0aGUgZGF0YSBzb3VyY2UuICovXG4gIHByaXZhdGUgX29ic2VydmVSZW5kZXJDaGFuZ2VzKCkge1xuICAgIC8vIElmIG5vIGRhdGEgc291cmNlIGhhcyBiZWVuIHNldCwgdGhlcmUgaXMgbm90aGluZyB0byBvYnNlcnZlIGZvciBjaGFuZ2VzLlxuICAgIGlmICghdGhpcy5kYXRhU291cmNlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IGRhdGFTdHJlYW06IE9ic2VydmFibGU8cmVhZG9ubHkgVFtdPiB8IHVuZGVmaW5lZDtcblxuICAgIGlmIChpc0RhdGFTb3VyY2UodGhpcy5kYXRhU291cmNlKSkge1xuICAgICAgZGF0YVN0cmVhbSA9IHRoaXMuZGF0YVNvdXJjZS5jb25uZWN0KHRoaXMpO1xuICAgIH0gZWxzZSBpZiAoaXNPYnNlcnZhYmxlKHRoaXMuZGF0YVNvdXJjZSkpIHtcbiAgICAgIGRhdGFTdHJlYW0gPSB0aGlzLmRhdGFTb3VyY2U7XG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHRoaXMuZGF0YVNvdXJjZSkpIHtcbiAgICAgIGRhdGFTdHJlYW0gPSBvYnNlcnZhYmxlT2YodGhpcy5kYXRhU291cmNlKTtcbiAgICB9XG5cbiAgICBpZiAoZGF0YVN0cmVhbSA9PT0gdW5kZWZpbmVkICYmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpKSB7XG4gICAgICB0aHJvdyBnZXRUYWJsZVVua25vd25EYXRhU291cmNlRXJyb3IoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9yZW5kZXJDaGFuZ2VTdWJzY3JpcHRpb24gPSBkYXRhU3RyZWFtIVxuICAgICAgLnBpcGUodGFrZVVudGlsKHRoaXMuX29uRGVzdHJveSkpXG4gICAgICAuc3Vic2NyaWJlKGRhdGEgPT4ge1xuICAgICAgICB0aGlzLl9kYXRhID0gZGF0YSB8fCBbXTtcbiAgICAgICAgdGhpcy5yZW5kZXJSb3dzKCk7XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgYW55IGV4aXN0aW5nIGNvbnRlbnQgaW4gdGhlIGhlYWRlciByb3cgb3V0bGV0IGFuZCBjcmVhdGVzIGEgbmV3IGVtYmVkZGVkIHZpZXdcbiAgICogaW4gdGhlIG91dGxldCB1c2luZyB0aGUgaGVhZGVyIHJvdyBkZWZpbml0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBfZm9yY2VSZW5kZXJIZWFkZXJSb3dzKCkge1xuICAgIC8vIENsZWFyIHRoZSBoZWFkZXIgcm93IG91dGxldCBpZiBhbnkgY29udGVudCBleGlzdHMuXG4gICAgaWYgKHRoaXMuX2hlYWRlclJvd091dGxldC52aWV3Q29udGFpbmVyLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuX2hlYWRlclJvd091dGxldC52aWV3Q29udGFpbmVyLmNsZWFyKCk7XG4gICAgfVxuXG4gICAgdGhpcy5faGVhZGVyUm93RGVmcy5mb3JFYWNoKChkZWYsIGkpID0+IHRoaXMuX3JlbmRlclJvdyh0aGlzLl9oZWFkZXJSb3dPdXRsZXQsIGRlZiwgaSkpO1xuICAgIHRoaXMudXBkYXRlU3RpY2t5SGVhZGVyUm93U3R5bGVzKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIGFueSBleGlzdGluZyBjb250ZW50IGluIHRoZSBmb290ZXIgcm93IG91dGxldCBhbmQgY3JlYXRlcyBhIG5ldyBlbWJlZGRlZCB2aWV3XG4gICAqIGluIHRoZSBvdXRsZXQgdXNpbmcgdGhlIGZvb3RlciByb3cgZGVmaW5pdGlvbi5cbiAgICovXG4gIHByaXZhdGUgX2ZvcmNlUmVuZGVyRm9vdGVyUm93cygpIHtcbiAgICAvLyBDbGVhciB0aGUgZm9vdGVyIHJvdyBvdXRsZXQgaWYgYW55IGNvbnRlbnQgZXhpc3RzLlxuICAgIGlmICh0aGlzLl9mb290ZXJSb3dPdXRsZXQudmlld0NvbnRhaW5lci5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLl9mb290ZXJSb3dPdXRsZXQudmlld0NvbnRhaW5lci5jbGVhcigpO1xuICAgIH1cblxuICAgIHRoaXMuX2Zvb3RlclJvd0RlZnMuZm9yRWFjaCgoZGVmLCBpKSA9PiB0aGlzLl9yZW5kZXJSb3codGhpcy5fZm9vdGVyUm93T3V0bGV0LCBkZWYsIGkpKTtcbiAgICB0aGlzLnVwZGF0ZVN0aWNreUZvb3RlclJvd1N0eWxlcygpO1xuICB9XG5cbiAgLyoqIEFkZHMgdGhlIHN0aWNreSBjb2x1bW4gc3R5bGVzIGZvciB0aGUgcm93cyBhY2NvcmRpbmcgdG8gdGhlIGNvbHVtbnMnIHN0aWNrIHN0YXRlcy4gKi9cbiAgcHJpdmF0ZSBfYWRkU3RpY2t5Q29sdW1uU3R5bGVzKHJvd3M6IEhUTUxFbGVtZW50W10sIHJvd0RlZjogQmFzZVJvd0RlZikge1xuICAgIGNvbnN0IGNvbHVtbkRlZnMgPSBBcnJheS5mcm9tKHJvd0RlZi5jb2x1bW5zIHx8IFtdKS5tYXAoY29sdW1uTmFtZSA9PiB7XG4gICAgICBjb25zdCBjb2x1bW5EZWYgPSB0aGlzLl9jb2x1bW5EZWZzQnlOYW1lLmdldChjb2x1bW5OYW1lKTtcbiAgICAgIGlmICghY29sdW1uRGVmICYmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpKSB7XG4gICAgICAgIHRocm93IGdldFRhYmxlVW5rbm93bkNvbHVtbkVycm9yKGNvbHVtbk5hbWUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNvbHVtbkRlZiE7XG4gICAgfSk7XG4gICAgY29uc3Qgc3RpY2t5U3RhcnRTdGF0ZXMgPSBjb2x1bW5EZWZzLm1hcChjb2x1bW5EZWYgPT4gY29sdW1uRGVmLnN0aWNreSk7XG4gICAgY29uc3Qgc3RpY2t5RW5kU3RhdGVzID0gY29sdW1uRGVmcy5tYXAoY29sdW1uRGVmID0+IGNvbHVtbkRlZi5zdGlja3lFbmQpO1xuICAgIHRoaXMuX3N0aWNreVN0eWxlci51cGRhdGVTdGlja3lDb2x1bW5zKFxuICAgICAgcm93cyxcbiAgICAgIHN0aWNreVN0YXJ0U3RhdGVzLFxuICAgICAgc3RpY2t5RW5kU3RhdGVzLFxuICAgICAgIXRoaXMuX2ZpeGVkTGF5b3V0IHx8IHRoaXMuX2ZvcmNlUmVjYWxjdWxhdGVDZWxsV2lkdGhzLFxuICAgICk7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgbGlzdCBvZiByb3dzIHRoYXQgaGF2ZSBiZWVuIHJlbmRlcmVkIGluIHRoZSByb3cgb3V0bGV0LiAqL1xuICBfZ2V0UmVuZGVyZWRSb3dzKHJvd091dGxldDogUm93T3V0bGV0KTogSFRNTEVsZW1lbnRbXSB7XG4gICAgY29uc3QgcmVuZGVyZWRSb3dzOiBIVE1MRWxlbWVudFtdID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJvd091dGxldC52aWV3Q29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCB2aWV3UmVmID0gcm93T3V0bGV0LnZpZXdDb250YWluZXIuZ2V0KGkpISBhcyBFbWJlZGRlZFZpZXdSZWY8YW55PjtcbiAgICAgIHJlbmRlcmVkUm93cy5wdXNoKHZpZXdSZWYucm9vdE5vZGVzWzBdKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVuZGVyZWRSb3dzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgbWF0Y2hpbmcgcm93IGRlZmluaXRpb25zIHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIHRoaXMgcm93IGRhdGEuIElmIHRoZXJlIGlzIG9ubHlcbiAgICogb25lIHJvdyBkZWZpbml0aW9uLCBpdCBpcyByZXR1cm5lZC4gT3RoZXJ3aXNlLCBmaW5kIHRoZSByb3cgZGVmaW5pdGlvbnMgdGhhdCBoYXMgYSB3aGVuXG4gICAqIHByZWRpY2F0ZSB0aGF0IHJldHVybnMgdHJ1ZSB3aXRoIHRoZSBkYXRhLiBJZiBub25lIHJldHVybiB0cnVlLCByZXR1cm4gdGhlIGRlZmF1bHQgcm93XG4gICAqIGRlZmluaXRpb24uXG4gICAqL1xuICBfZ2V0Um93RGVmcyhkYXRhOiBULCBkYXRhSW5kZXg6IG51bWJlcik6IENka1Jvd0RlZjxUPltdIHtcbiAgICBpZiAodGhpcy5fcm93RGVmcy5sZW5ndGggPT0gMSkge1xuICAgICAgcmV0dXJuIFt0aGlzLl9yb3dEZWZzWzBdXTtcbiAgICB9XG5cbiAgICBsZXQgcm93RGVmczogQ2RrUm93RGVmPFQ+W10gPSBbXTtcbiAgICBpZiAodGhpcy5tdWx0aVRlbXBsYXRlRGF0YVJvd3MpIHtcbiAgICAgIHJvd0RlZnMgPSB0aGlzLl9yb3dEZWZzLmZpbHRlcihkZWYgPT4gIWRlZi53aGVuIHx8IGRlZi53aGVuKGRhdGFJbmRleCwgZGF0YSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgcm93RGVmID1cbiAgICAgICAgdGhpcy5fcm93RGVmcy5maW5kKGRlZiA9PiBkZWYud2hlbiAmJiBkZWYud2hlbihkYXRhSW5kZXgsIGRhdGEpKSB8fCB0aGlzLl9kZWZhdWx0Um93RGVmO1xuICAgICAgaWYgKHJvd0RlZikge1xuICAgICAgICByb3dEZWZzLnB1c2gocm93RGVmKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXJvd0RlZnMubGVuZ3RoICYmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpKSB7XG4gICAgICB0aHJvdyBnZXRUYWJsZU1pc3NpbmdNYXRjaGluZ1Jvd0RlZkVycm9yKGRhdGEpO1xuICAgIH1cblxuICAgIHJldHVybiByb3dEZWZzO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0RW1iZWRkZWRWaWV3QXJncyhcbiAgICByZW5kZXJSb3c6IFJlbmRlclJvdzxUPixcbiAgICBpbmRleDogbnVtYmVyLFxuICApOiBfVmlld1JlcGVhdGVySXRlbUluc2VydEFyZ3M8Um93Q29udGV4dDxUPj4ge1xuICAgIGNvbnN0IHJvd0RlZiA9IHJlbmRlclJvdy5yb3dEZWY7XG4gICAgY29uc3QgY29udGV4dDogUm93Q29udGV4dDxUPiA9IHskaW1wbGljaXQ6IHJlbmRlclJvdy5kYXRhfTtcbiAgICByZXR1cm4ge1xuICAgICAgdGVtcGxhdGVSZWY6IHJvd0RlZi50ZW1wbGF0ZSxcbiAgICAgIGNvbnRleHQsXG4gICAgICBpbmRleCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgcm93IHRlbXBsYXRlIGluIHRoZSBvdXRsZXQgYW5kIGZpbGxzIGl0IHdpdGggdGhlIHNldCBvZiBjZWxsIHRlbXBsYXRlcy5cbiAgICogT3B0aW9uYWxseSB0YWtlcyBhIGNvbnRleHQgdG8gcHJvdmlkZSB0byB0aGUgcm93IGFuZCBjZWxscywgYXMgd2VsbCBhcyBhbiBvcHRpb25hbCBpbmRleFxuICAgKiBvZiB3aGVyZSB0byBwbGFjZSB0aGUgbmV3IHJvdyB0ZW1wbGF0ZSBpbiB0aGUgb3V0bGV0LlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVuZGVyUm93KFxuICAgIG91dGxldDogUm93T3V0bGV0LFxuICAgIHJvd0RlZjogQmFzZVJvd0RlZixcbiAgICBpbmRleDogbnVtYmVyLFxuICAgIGNvbnRleHQ6IFJvd0NvbnRleHQ8VD4gPSB7fSxcbiAgKTogRW1iZWRkZWRWaWV3UmVmPFJvd0NvbnRleHQ8VD4+IHtcbiAgICAvLyBUT0RPKGFuZHJld3NlZ3Vpbik6IGVuZm9yY2UgdGhhdCBvbmUgb3V0bGV0IHdhcyBpbnN0YW50aWF0ZWQgZnJvbSBjcmVhdGVFbWJlZGRlZFZpZXdcbiAgICBjb25zdCB2aWV3ID0gb3V0bGV0LnZpZXdDb250YWluZXIuY3JlYXRlRW1iZWRkZWRWaWV3KHJvd0RlZi50ZW1wbGF0ZSwgY29udGV4dCwgaW5kZXgpO1xuICAgIHRoaXMuX3JlbmRlckNlbGxUZW1wbGF0ZUZvckl0ZW0ocm93RGVmLCBjb250ZXh0KTtcbiAgICByZXR1cm4gdmlldztcbiAgfVxuXG4gIHByaXZhdGUgX3JlbmRlckNlbGxUZW1wbGF0ZUZvckl0ZW0ocm93RGVmOiBCYXNlUm93RGVmLCBjb250ZXh0OiBSb3dDb250ZXh0PFQ+KSB7XG4gICAgZm9yIChsZXQgY2VsbFRlbXBsYXRlIG9mIHRoaXMuX2dldENlbGxUZW1wbGF0ZXMocm93RGVmKSkge1xuICAgICAgaWYgKENka0NlbGxPdXRsZXQubW9zdFJlY2VudENlbGxPdXRsZXQpIHtcbiAgICAgICAgQ2RrQ2VsbE91dGxldC5tb3N0UmVjZW50Q2VsbE91dGxldC5fdmlld0NvbnRhaW5lci5jcmVhdGVFbWJlZGRlZFZpZXcoY2VsbFRlbXBsYXRlLCBjb250ZXh0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBpbmRleC1yZWxhdGVkIGNvbnRleHQgZm9yIGVhY2ggcm93IHRvIHJlZmxlY3QgYW55IGNoYW5nZXMgaW4gdGhlIGluZGV4IG9mIHRoZSByb3dzLFxuICAgKiBlLmcuIGZpcnN0L2xhc3QvZXZlbi9vZGQuXG4gICAqL1xuICBwcml2YXRlIF91cGRhdGVSb3dJbmRleENvbnRleHQoKSB7XG4gICAgY29uc3Qgdmlld0NvbnRhaW5lciA9IHRoaXMuX3Jvd091dGxldC52aWV3Q29udGFpbmVyO1xuICAgIGZvciAobGV0IHJlbmRlckluZGV4ID0gMCwgY291bnQgPSB2aWV3Q29udGFpbmVyLmxlbmd0aDsgcmVuZGVySW5kZXggPCBjb3VudDsgcmVuZGVySW5kZXgrKykge1xuICAgICAgY29uc3Qgdmlld1JlZiA9IHZpZXdDb250YWluZXIuZ2V0KHJlbmRlckluZGV4KSBhcyBSb3dWaWV3UmVmPFQ+O1xuICAgICAgY29uc3QgY29udGV4dCA9IHZpZXdSZWYuY29udGV4dCBhcyBSb3dDb250ZXh0PFQ+O1xuICAgICAgY29udGV4dC5jb3VudCA9IGNvdW50O1xuICAgICAgY29udGV4dC5maXJzdCA9IHJlbmRlckluZGV4ID09PSAwO1xuICAgICAgY29udGV4dC5sYXN0ID0gcmVuZGVySW5kZXggPT09IGNvdW50IC0gMTtcbiAgICAgIGNvbnRleHQuZXZlbiA9IHJlbmRlckluZGV4ICUgMiA9PT0gMDtcbiAgICAgIGNvbnRleHQub2RkID0gIWNvbnRleHQuZXZlbjtcblxuICAgICAgaWYgKHRoaXMubXVsdGlUZW1wbGF0ZURhdGFSb3dzKSB7XG4gICAgICAgIGNvbnRleHQuZGF0YUluZGV4ID0gdGhpcy5fcmVuZGVyUm93c1tyZW5kZXJJbmRleF0uZGF0YUluZGV4O1xuICAgICAgICBjb250ZXh0LnJlbmRlckluZGV4ID0gcmVuZGVySW5kZXg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb250ZXh0LmluZGV4ID0gdGhpcy5fcmVuZGVyUm93c1tyZW5kZXJJbmRleF0uZGF0YUluZGV4O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBjb2x1bW4gZGVmaW5pdGlvbnMgZm9yIHRoZSBwcm92aWRlZCByb3cgZGVmLiAqL1xuICBwcml2YXRlIF9nZXRDZWxsVGVtcGxhdGVzKHJvd0RlZjogQmFzZVJvd0RlZik6IFRlbXBsYXRlUmVmPGFueT5bXSB7XG4gICAgaWYgKCFyb3dEZWYgfHwgIXJvd0RlZi5jb2x1bW5zKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIHJldHVybiBBcnJheS5mcm9tKHJvd0RlZi5jb2x1bW5zLCBjb2x1bW5JZCA9PiB7XG4gICAgICBjb25zdCBjb2x1bW4gPSB0aGlzLl9jb2x1bW5EZWZzQnlOYW1lLmdldChjb2x1bW5JZCk7XG5cbiAgICAgIGlmICghY29sdW1uICYmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpKSB7XG4gICAgICAgIHRocm93IGdldFRhYmxlVW5rbm93bkNvbHVtbkVycm9yKGNvbHVtbklkKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJvd0RlZi5leHRyYWN0Q2VsbFRlbXBsYXRlKGNvbHVtbiEpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIEFkZHMgbmF0aXZlIHRhYmxlIHNlY3Rpb25zIChlLmcuIHRib2R5KSBhbmQgbW92ZXMgdGhlIHJvdyBvdXRsZXRzIGludG8gdGhlbS4gKi9cbiAgcHJpdmF0ZSBfYXBwbHlOYXRpdmVUYWJsZVNlY3Rpb25zKCkge1xuICAgIGNvbnN0IGRvY3VtZW50RnJhZ21lbnQgPSB0aGlzLl9kb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgY29uc3Qgc2VjdGlvbnMgPSBbXG4gICAgICB7dGFnOiAndGhlYWQnLCBvdXRsZXRzOiBbdGhpcy5faGVhZGVyUm93T3V0bGV0XX0sXG4gICAgICB7dGFnOiAndGJvZHknLCBvdXRsZXRzOiBbdGhpcy5fcm93T3V0bGV0LCB0aGlzLl9ub0RhdGFSb3dPdXRsZXRdfSxcbiAgICAgIHt0YWc6ICd0Zm9vdCcsIG91dGxldHM6IFt0aGlzLl9mb290ZXJSb3dPdXRsZXRdfSxcbiAgICBdO1xuXG4gICAgZm9yIChjb25zdCBzZWN0aW9uIG9mIHNlY3Rpb25zKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fZG9jdW1lbnQuY3JlYXRlRWxlbWVudChzZWN0aW9uLnRhZyk7XG4gICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgncm9sZScsICdyb3dncm91cCcpO1xuXG4gICAgICBmb3IgKGNvbnN0IG91dGxldCBvZiBzZWN0aW9uLm91dGxldHMpIHtcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChvdXRsZXQuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50KTtcbiAgICAgIH1cblxuICAgICAgZG9jdW1lbnRGcmFnbWVudC5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICB9XG5cbiAgICAvLyBVc2UgYSBEb2N1bWVudEZyYWdtZW50IHNvIHdlIGRvbid0IGhpdCB0aGUgRE9NIG9uIGVhY2ggaXRlcmF0aW9uLlxuICAgIHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5hcHBlbmRDaGlsZChkb2N1bWVudEZyYWdtZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb3JjZXMgYSByZS1yZW5kZXIgb2YgdGhlIGRhdGEgcm93cy4gU2hvdWxkIGJlIGNhbGxlZCBpbiBjYXNlcyB3aGVyZSB0aGVyZSBoYXMgYmVlbiBhbiBpbnB1dFxuICAgKiBjaGFuZ2UgdGhhdCBhZmZlY3RzIHRoZSBldmFsdWF0aW9uIG9mIHdoaWNoIHJvd3Mgc2hvdWxkIGJlIHJlbmRlcmVkLCBlLmcuIHRvZ2dsaW5nXG4gICAqIGBtdWx0aVRlbXBsYXRlRGF0YVJvd3NgIG9yIGFkZGluZy9yZW1vdmluZyByb3cgZGVmaW5pdGlvbnMuXG4gICAqL1xuICBwcml2YXRlIF9mb3JjZVJlbmRlckRhdGFSb3dzKCkge1xuICAgIHRoaXMuX2RhdGFEaWZmZXIuZGlmZihbXSk7XG4gICAgdGhpcy5fcm93T3V0bGV0LnZpZXdDb250YWluZXIuY2xlYXIoKTtcbiAgICB0aGlzLnJlbmRlclJvd3MoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlcmUgaGFzIGJlZW4gYSBjaGFuZ2UgaW4gc3RpY2t5IHN0YXRlcyBzaW5jZSBsYXN0IGNoZWNrIGFuZCBhcHBsaWVzIHRoZSBjb3JyZWN0XG4gICAqIHN0aWNreSBzdHlsZXMuIFNpbmNlIGNoZWNraW5nIHJlc2V0cyB0aGUgXCJkaXJ0eVwiIHN0YXRlLCB0aGlzIHNob3VsZCBvbmx5IGJlIHBlcmZvcm1lZCBvbmNlXG4gICAqIGR1cmluZyBhIGNoYW5nZSBkZXRlY3Rpb24gYW5kIGFmdGVyIHRoZSBpbnB1dHMgYXJlIHNldHRsZWQgKGFmdGVyIGNvbnRlbnQgY2hlY2spLlxuICAgKi9cbiAgcHJpdmF0ZSBfY2hlY2tTdGlja3lTdGF0ZXMoKSB7XG4gICAgY29uc3Qgc3RpY2t5Q2hlY2tSZWR1Y2VyID0gKFxuICAgICAgYWNjOiBib29sZWFuLFxuICAgICAgZDogQ2RrSGVhZGVyUm93RGVmIHwgQ2RrRm9vdGVyUm93RGVmIHwgQ2RrQ29sdW1uRGVmLFxuICAgICkgPT4ge1xuICAgICAgcmV0dXJuIGFjYyB8fCBkLmhhc1N0aWNreUNoYW5nZWQoKTtcbiAgICB9O1xuXG4gICAgLy8gTm90ZSB0aGF0IHRoZSBjaGVjayBuZWVkcyB0byBvY2N1ciBmb3IgZXZlcnkgZGVmaW5pdGlvbiBzaW5jZSBpdCBub3RpZmllcyB0aGUgZGVmaW5pdGlvblxuICAgIC8vIHRoYXQgaXQgY2FuIHJlc2V0IGl0cyBkaXJ0eSBzdGF0ZS4gVXNpbmcgYW5vdGhlciBvcGVyYXRvciBsaWtlIGBzb21lYCBtYXkgc2hvcnQtY2lyY3VpdFxuICAgIC8vIHJlbWFpbmluZyBkZWZpbml0aW9ucyBhbmQgbGVhdmUgdGhlbSBpbiBhbiB1bmNoZWNrZWQgc3RhdGUuXG5cbiAgICBpZiAodGhpcy5faGVhZGVyUm93RGVmcy5yZWR1Y2Uoc3RpY2t5Q2hlY2tSZWR1Y2VyLCBmYWxzZSkpIHtcbiAgICAgIHRoaXMudXBkYXRlU3RpY2t5SGVhZGVyUm93U3R5bGVzKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2Zvb3RlclJvd0RlZnMucmVkdWNlKHN0aWNreUNoZWNrUmVkdWNlciwgZmFsc2UpKSB7XG4gICAgICB0aGlzLnVwZGF0ZVN0aWNreUZvb3RlclJvd1N0eWxlcygpO1xuICAgIH1cblxuICAgIGlmIChBcnJheS5mcm9tKHRoaXMuX2NvbHVtbkRlZnNCeU5hbWUudmFsdWVzKCkpLnJlZHVjZShzdGlja3lDaGVja1JlZHVjZXIsIGZhbHNlKSkge1xuICAgICAgdGhpcy5fc3RpY2t5Q29sdW1uU3R5bGVzTmVlZFJlc2V0ID0gdHJ1ZTtcbiAgICAgIHRoaXMudXBkYXRlU3RpY2t5Q29sdW1uU3R5bGVzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgdGhlIHN0aWNreSBzdHlsZXIgdGhhdCB3aWxsIGJlIHVzZWQgZm9yIHN0aWNreSByb3dzIGFuZCBjb2x1bW5zLiBMaXN0ZW5zXG4gICAqIGZvciBkaXJlY3Rpb25hbGl0eSBjaGFuZ2VzIGFuZCBwcm92aWRlcyB0aGUgbGF0ZXN0IGRpcmVjdGlvbiB0byB0aGUgc3R5bGVyLiBSZS1hcHBsaWVzIGNvbHVtblxuICAgKiBzdGlja2luZXNzIHdoZW4gZGlyZWN0aW9uYWxpdHkgY2hhbmdlcy5cbiAgICovXG4gIHByaXZhdGUgX3NldHVwU3RpY2t5U3R5bGVyKCkge1xuICAgIGNvbnN0IGRpcmVjdGlvbjogRGlyZWN0aW9uID0gdGhpcy5fZGlyID8gdGhpcy5fZGlyLnZhbHVlIDogJ2x0cic7XG4gICAgdGhpcy5fc3RpY2t5U3R5bGVyID0gbmV3IFN0aWNreVN0eWxlcihcbiAgICAgIHRoaXMuX2lzTmF0aXZlSHRtbFRhYmxlLFxuICAgICAgdGhpcy5zdGlja3lDc3NDbGFzcyxcbiAgICAgIGRpcmVjdGlvbixcbiAgICAgIHRoaXMuX2NvYWxlc2NlZFN0eWxlU2NoZWR1bGVyLFxuICAgICAgdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyLFxuICAgICAgdGhpcy5uZWVkc1Bvc2l0aW9uU3RpY2t5T25FbGVtZW50LFxuICAgICAgdGhpcy5fc3RpY2t5UG9zaXRpb25pbmdMaXN0ZW5lcixcbiAgICApO1xuICAgICh0aGlzLl9kaXIgPyB0aGlzLl9kaXIuY2hhbmdlIDogb2JzZXJ2YWJsZU9mPERpcmVjdGlvbj4oKSlcbiAgICAgIC5waXBlKHRha2VVbnRpbCh0aGlzLl9vbkRlc3Ryb3kpKVxuICAgICAgLnN1YnNjcmliZSh2YWx1ZSA9PiB7XG4gICAgICAgIHRoaXMuX3N0aWNreVN0eWxlci5kaXJlY3Rpb24gPSB2YWx1ZTtcbiAgICAgICAgdGhpcy51cGRhdGVTdGlja3lDb2x1bW5TdHlsZXMoKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgLyoqIEZpbHRlcnMgZGVmaW5pdGlvbnMgdGhhdCBiZWxvbmcgdG8gdGhpcyB0YWJsZSBmcm9tIGEgUXVlcnlMaXN0LiAqL1xuICBwcml2YXRlIF9nZXRPd25EZWZzPEkgZXh0ZW5kcyB7X3RhYmxlPzogYW55fT4oaXRlbXM6IFF1ZXJ5TGlzdDxJPik6IElbXSB7XG4gICAgcmV0dXJuIGl0ZW1zLmZpbHRlcihpdGVtID0+ICFpdGVtLl90YWJsZSB8fCBpdGVtLl90YWJsZSA9PT0gdGhpcyk7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBvciByZW1vdmVzIHRoZSBubyBkYXRhIHJvdywgZGVwZW5kaW5nIG9uIHdoZXRoZXIgYW55IGRhdGEgaXMgYmVpbmcgc2hvd24uICovXG4gIHByaXZhdGUgX3VwZGF0ZU5vRGF0YVJvdygpIHtcbiAgICBjb25zdCBub0RhdGFSb3cgPSB0aGlzLl9jdXN0b21Ob0RhdGFSb3cgfHwgdGhpcy5fbm9EYXRhUm93O1xuXG4gICAgaWYgKCFub0RhdGFSb3cpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzaG91bGRTaG93ID0gdGhpcy5fcm93T3V0bGV0LnZpZXdDb250YWluZXIubGVuZ3RoID09PSAwO1xuXG4gICAgaWYgKHNob3VsZFNob3cgPT09IHRoaXMuX2lzU2hvd2luZ05vRGF0YVJvdykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuX25vRGF0YVJvd091dGxldC52aWV3Q29udGFpbmVyO1xuXG4gICAgaWYgKHNob3VsZFNob3cpIHtcbiAgICAgIGNvbnN0IHZpZXcgPSBjb250YWluZXIuY3JlYXRlRW1iZWRkZWRWaWV3KG5vRGF0YVJvdy50ZW1wbGF0ZVJlZik7XG4gICAgICBjb25zdCByb290Tm9kZTogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQgPSB2aWV3LnJvb3ROb2Rlc1swXTtcblxuICAgICAgLy8gT25seSBhZGQgdGhlIGF0dHJpYnV0ZXMgaWYgd2UgaGF2ZSBhIHNpbmdsZSByb290IG5vZGUgc2luY2UgaXQncyBoYXJkXG4gICAgICAvLyB0byBmaWd1cmUgb3V0IHdoaWNoIG9uZSB0byBhZGQgaXQgdG8gd2hlbiB0aGVyZSBhcmUgbXVsdGlwbGUuXG4gICAgICBpZiAodmlldy5yb290Tm9kZXMubGVuZ3RoID09PSAxICYmIHJvb3ROb2RlPy5ub2RlVHlwZSA9PT0gdGhpcy5fZG9jdW1lbnQuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgIHJvb3ROb2RlLnNldEF0dHJpYnV0ZSgncm9sZScsICdyb3cnKTtcbiAgICAgICAgcm9vdE5vZGUuY2xhc3NMaXN0LmFkZChub0RhdGFSb3cuX2NvbnRlbnRDbGFzc05hbWUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb250YWluZXIuY2xlYXIoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9pc1Nob3dpbmdOb0RhdGFSb3cgPSBzaG91bGRTaG93O1xuICB9XG59XG5cbi8qKiBVdGlsaXR5IGZ1bmN0aW9uIHRoYXQgZ2V0cyBhIG1lcmdlZCBsaXN0IG9mIHRoZSBlbnRyaWVzIGluIGFuIGFycmF5IGFuZCB2YWx1ZXMgb2YgYSBTZXQuICovXG5mdW5jdGlvbiBtZXJnZUFycmF5QW5kU2V0PFQ+KGFycmF5OiBUW10sIHNldDogU2V0PFQ+KTogVFtdIHtcbiAgcmV0dXJuIGFycmF5LmNvbmNhdChBcnJheS5mcm9tKHNldCkpO1xufVxuIl19