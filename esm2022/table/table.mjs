/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directionality } from '@angular/cdk/bidi';
import { _DisposeViewRepeaterStrategy, _RecycleViewRepeaterStrategy, isDataSource, _VIEW_REPEATER_STRATEGY, _ViewRepeaterOperation, } from '@angular/cdk/collections';
import { Platform } from '@angular/cdk/platform';
import { ViewportRuler } from '@angular/cdk/scrolling';
import { DOCUMENT } from '@angular/common';
import { Attribute, ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChild, ContentChildren, Directive, ElementRef, EmbeddedViewRef, EventEmitter, Inject, Input, IterableDiffers, NgZone, Optional, Output, QueryList, SkipSelf, ViewContainerRef, ViewEncapsulation, booleanAttribute, inject, } from '@angular/core';
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: CdkRecycleRows, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.1.0-next.5", type: CdkRecycleRows, isStandalone: true, selector: "cdk-table[recycleRows], table[cdk-table][recycleRows]", providers: [{ provide: _VIEW_REPEATER_STRATEGY, useClass: _RecycleViewRepeaterStrategy }], ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: CdkRecycleRows, decorators: [{
            type: Directive,
            args: [{
                    selector: 'cdk-table[recycleRows], table[cdk-table][recycleRows]',
                    providers: [{ provide: _VIEW_REPEATER_STRATEGY, useClass: _RecycleViewRepeaterStrategy }],
                    standalone: true,
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
        const table = inject(CDK_TABLE);
        table._rowOutlet = this;
        table._outletAssigned();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: DataRowOutlet, deps: [{ token: i0.ViewContainerRef }, { token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.1.0-next.5", type: DataRowOutlet, isStandalone: true, selector: "[rowOutlet]", ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: DataRowOutlet, decorators: [{
            type: Directive,
            args: [{
                    selector: '[rowOutlet]',
                    standalone: true,
                }]
        }], ctorParameters: () => [{ type: i0.ViewContainerRef }, { type: i0.ElementRef }] });
/**
 * Provides a handle for the table to grab the view container's ng-container to insert the header.
 * @docs-private
 */
export class HeaderRowOutlet {
    constructor(viewContainer, elementRef) {
        this.viewContainer = viewContainer;
        this.elementRef = elementRef;
        const table = inject(CDK_TABLE);
        table._headerRowOutlet = this;
        table._outletAssigned();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: HeaderRowOutlet, deps: [{ token: i0.ViewContainerRef }, { token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.1.0-next.5", type: HeaderRowOutlet, isStandalone: true, selector: "[headerRowOutlet]", ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: HeaderRowOutlet, decorators: [{
            type: Directive,
            args: [{
                    selector: '[headerRowOutlet]',
                    standalone: true,
                }]
        }], ctorParameters: () => [{ type: i0.ViewContainerRef }, { type: i0.ElementRef }] });
/**
 * Provides a handle for the table to grab the view container's ng-container to insert the footer.
 * @docs-private
 */
export class FooterRowOutlet {
    constructor(viewContainer, elementRef) {
        this.viewContainer = viewContainer;
        this.elementRef = elementRef;
        const table = inject(CDK_TABLE);
        table._footerRowOutlet = this;
        table._outletAssigned();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: FooterRowOutlet, deps: [{ token: i0.ViewContainerRef }, { token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.1.0-next.5", type: FooterRowOutlet, isStandalone: true, selector: "[footerRowOutlet]", ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: FooterRowOutlet, decorators: [{
            type: Directive,
            args: [{
                    selector: '[footerRowOutlet]',
                    standalone: true,
                }]
        }], ctorParameters: () => [{ type: i0.ViewContainerRef }, { type: i0.ElementRef }] });
/**
 * Provides a handle for the table to grab the view
 * container's ng-container to insert the no data row.
 * @docs-private
 */
export class NoDataRowOutlet {
    constructor(viewContainer, elementRef) {
        this.viewContainer = viewContainer;
        this.elementRef = elementRef;
        const table = inject(CDK_TABLE);
        table._noDataRowOutlet = this;
        table._outletAssigned();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: NoDataRowOutlet, deps: [{ token: i0.ViewContainerRef }, { token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.1.0-next.5", type: NoDataRowOutlet, isStandalone: true, selector: "[noDataRowOutlet]", ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: NoDataRowOutlet, decorators: [{
            type: Directive,
            args: [{
                    selector: '[noDataRowOutlet]',
                    standalone: true,
                }]
        }], ctorParameters: () => [{ type: i0.ViewContainerRef }, { type: i0.ElementRef }] });
/**
 * The table template that can be used by the mat-table. Should not be used outside of the
 * material library.
 * @docs-private
 */
export const CDK_TABLE_TEMPLATE = 
// Note that according to MDN, the `caption` element has to be projected as the **first**
// element in the table. See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption
`
  <ng-content select="caption"/>
  <ng-content select="colgroup, col"/>

  <!--
    Unprojected content throws a hydration error so we need this to capture it.
    It gets removed on the client so it doesn't affect the layout.
  -->
  @if (_isServer) {
    <ng-content/>
  }

  @if (_isNativeHtmlTable) {
    <thead role="rowgroup">
      <ng-container headerRowOutlet/>
    </thead>
    <tbody role="rowgroup">
      <ng-container rowOutlet/>
      <ng-container noDataRowOutlet/>
    </tbody>
    <tfoot role="rowgroup">
      <ng-container footerRowOutlet/>
    </tfoot>
  } @else {
    <ng-container headerRowOutlet/>
    <ng-container rowOutlet/>
    <ng-container noDataRowOutlet/>
    <ng-container footerRowOutlet/>
  }
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
    /** Aria role to apply to the table's cells based on the table's own role. */
    _getCellRole() {
        if (this._cellRoleInternal === undefined) {
            // Perform this lazily in case the table's role was updated by a directive after construction.
            const role = this._elementRef.nativeElement.getAttribute('role');
            const cellRole = role === 'grid' || role === 'treegrid' ? 'gridcell' : 'cell';
            this._cellRoleInternal = this._isNativeHtmlTable && cellRole === 'cell' ? null : cellRole;
        }
        return this._cellRoleInternal;
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
    set multiTemplateDataRows(value) {
        this._multiTemplateDataRows = value;
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
    set fixedLayout(value) {
        this._fixedLayout = value;
        // Toggling `fixedLayout` may change column widths. Sticky column styles should be recalculated.
        this._forceRecalculateCellWidths = true;
        this._stickyColumnStylesNeedReset = true;
    }
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
         * CSS class added to any row or cell that has sticky positioning applied. May be overridden by
         * table subclasses.
         */
        this.stickyCssClass = 'cdk-table-sticky';
        /**
         * Whether to manually add position: sticky to all sticky cell elements. Not needed if
         * the position is set in a selector associated with the value of stickyCssClass. May be
         * overridden by table subclasses
         */
        this.needsPositionStickyOnElement = true;
        /** Whether the no data row is currently showing anything. */
        this._isShowingNoDataRow = false;
        /** Whether the table has rendered out all the outlets for the first time. */
        this._hasRendered = false;
        this._cellRoleInternal = undefined;
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
            _elementRef.nativeElement.setAttribute('role', 'table');
        }
        this._document = _document;
        this._isServer = !_platform.isBrowser;
        this._isNativeHtmlTable = _elementRef.nativeElement.nodeName === 'TABLE';
    }
    ngOnInit() {
        this._setupStickyStyler();
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
        // Only start re-rendering in `ngAfterContentChecked` after the first render.
        if (this._hasRendered) {
            this._render();
        }
    }
    ngOnDestroy() {
        [
            this._rowOutlet?.viewContainer,
            this._headerRowOutlet?.viewContainer,
            this._footerRowOutlet?.viewContainer,
            this._cachedRenderRowsMap,
            this._customColumnDefs,
            this._customRowDefs,
            this._customHeaderRowDefs,
            this._customFooterRowDefs,
            this._columnDefsByName,
        ].forEach((def) => {
            def?.clear();
        });
        this._headerRowDefs = [];
        this._footerRowDefs = [];
        this._defaultRowDef = null;
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
            if (change.operation === _ViewRepeaterOperation.INSERTED && change.context) {
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
        // Hide the thead element if there are no header rows. This is necessary to satisfy
        // overzealous a11y checkers that fail because the `rowgroup` element does not contain
        // required child `row`.
        if (this._isNativeHtmlTable) {
            const thead = closestTableSection(this._headerRowOutlet, 'thead');
            if (thead) {
                thead.style.display = headerRows.length ? '' : 'none';
            }
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
        // Hide the tfoot element if there are no footer rows. This is necessary to satisfy
        // overzealous a11y checkers that fail because the `rowgroup` element does not contain
        // required child `row`.
        if (this._isNativeHtmlTable) {
            const tfoot = closestTableSection(this._footerRowOutlet, 'tfoot');
            if (tfoot) {
                tfoot.style.display = footerRows.length ? '' : 'none';
            }
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
    /** Invoked whenever an outlet is created and has been assigned to the table. */
    _outletAssigned() {
        // Trigger the first render once all outlets have been assigned. We do it this way, as
        // opposed to waiting for the next `ngAfterContentChecked`, because we don't know when
        // the next change detection will happen.
        // Also we can't use queries to resolve the outlets, because they're wrapped in a
        // conditional, so we have to rely on them being assigned via DI.
        if (!this._hasRendered &&
            this._rowOutlet &&
            this._headerRowOutlet &&
            this._footerRowOutlet &&
            this._noDataRowOutlet) {
            this._hasRendered = true;
            this._render();
        }
    }
    /** Renders the table if its state has changed. */
    _render() {
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
            if (this._rowOutlet) {
                this._rowOutlet.viewContainer.clear();
            }
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
        this._changeDetectorRef.markForCheck();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: CdkTable, deps: [{ token: i0.IterableDiffers }, { token: i0.ChangeDetectorRef }, { token: i0.ElementRef }, { token: 'role', attribute: true }, { token: i1.Directionality, optional: true }, { token: DOCUMENT }, { token: i2.Platform }, { token: _VIEW_REPEATER_STRATEGY }, { token: _COALESCED_STYLE_SCHEDULER }, { token: i3.ViewportRuler }, { token: STICKY_POSITIONING_LISTENER, optional: true, skipSelf: true }, { token: i0.NgZone, optional: true }], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "17.1.0-next.5", type: CdkTable, isStandalone: true, selector: "cdk-table, table[cdk-table]", inputs: { trackBy: "trackBy", dataSource: "dataSource", multiTemplateDataRows: ["multiTemplateDataRows", "multiTemplateDataRows", booleanAttribute], fixedLayout: ["fixedLayout", "fixedLayout", booleanAttribute] }, outputs: { contentChanged: "contentChanged" }, host: { properties: { "class.cdk-table-fixed-layout": "fixedLayout" }, classAttribute: "cdk-table" }, providers: [
            { provide: CDK_TABLE, useExisting: CdkTable },
            { provide: _VIEW_REPEATER_STRATEGY, useClass: _DisposeViewRepeaterStrategy },
            { provide: _COALESCED_STYLE_SCHEDULER, useClass: _CoalescedStyleScheduler },
            // Prevent nested tables from seeing this table's StickyPositioningListener.
            { provide: STICKY_POSITIONING_LISTENER, useValue: null },
        ], queries: [{ propertyName: "_noDataRow", first: true, predicate: CdkNoDataRow, descendants: true }, { propertyName: "_contentColumnDefs", predicate: CdkColumnDef, descendants: true }, { propertyName: "_contentRowDefs", predicate: CdkRowDef, descendants: true }, { propertyName: "_contentHeaderRowDefs", predicate: CdkHeaderRowDef, descendants: true }, { propertyName: "_contentFooterRowDefs", predicate: CdkFooterRowDef, descendants: true }], exportAs: ["cdkTable"], ngImport: i0, template: "\n  <ng-content select=\"caption\"/>\n  <ng-content select=\"colgroup, col\"/>\n\n  <!--\n    Unprojected content throws a hydration error so we need this to capture it.\n    It gets removed on the client so it doesn't affect the layout.\n  -->\n  @if (_isServer) {\n    <ng-content/>\n  }\n\n  @if (_isNativeHtmlTable) {\n    <thead role=\"rowgroup\">\n      <ng-container headerRowOutlet/>\n    </thead>\n    <tbody role=\"rowgroup\">\n      <ng-container rowOutlet/>\n      <ng-container noDataRowOutlet/>\n    </tbody>\n    <tfoot role=\"rowgroup\">\n      <ng-container footerRowOutlet/>\n    </tfoot>\n  } @else {\n    <ng-container headerRowOutlet/>\n    <ng-container rowOutlet/>\n    <ng-container noDataRowOutlet/>\n    <ng-container footerRowOutlet/>\n  }\n", isInline: true, styles: [".cdk-table-fixed-layout{table-layout:fixed}"], dependencies: [{ kind: "directive", type: HeaderRowOutlet, selector: "[headerRowOutlet]" }, { kind: "directive", type: DataRowOutlet, selector: "[rowOutlet]" }, { kind: "directive", type: NoDataRowOutlet, selector: "[noDataRowOutlet]" }, { kind: "directive", type: FooterRowOutlet, selector: "[footerRowOutlet]" }], changeDetection: i0.ChangeDetectionStrategy.Default, encapsulation: i0.ViewEncapsulation.None }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: CdkTable, decorators: [{
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
                    ], standalone: true, imports: [HeaderRowOutlet, DataRowOutlet, NoDataRowOutlet, FooterRowOutlet], styles: [".cdk-table-fixed-layout{table-layout:fixed}"] }]
        }], ctorParameters: () => [{ type: i0.IterableDiffers }, { type: i0.ChangeDetectorRef }, { type: i0.ElementRef }, { type: undefined, decorators: [{
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
                }] }], propDecorators: { trackBy: [{
                type: Input
            }], dataSource: [{
                type: Input
            }], multiTemplateDataRows: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], fixedLayout: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], contentChanged: [{
                type: Output
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
/**
 * Finds the closest table section to an outlet. We can't use `HTMLElement.closest` for this,
 * because the node representing the outlet is a comment.
 */
function closestTableSection(outlet, section) {
    const uppercaseSection = section.toUpperCase();
    let current = outlet.viewContainer.element.nativeElement;
    while (current) {
        // 1 is an element node.
        const nodeName = current.nodeType === 1 ? current.nodeName : null;
        if (nodeName === uppercaseSection) {
            return current;
        }
        else if (nodeName === 'TABLE') {
            // Stop traversing past the `table` node.
            break;
        }
        current = current.parentNode;
    }
    return null;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RhYmxlL3RhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBWSxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM1RCxPQUFPLEVBR0wsNEJBQTRCLEVBQzVCLDRCQUE0QixFQUM1QixZQUFZLEVBQ1osdUJBQXVCLEVBSXZCLHNCQUFzQixHQUN2QixNQUFNLDBCQUEwQixDQUFDO0FBQ2xDLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDckQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFFTCxTQUFTLEVBQ1QsdUJBQXVCLEVBQ3ZCLGlCQUFpQixFQUNqQixTQUFTLEVBQ1QsWUFBWSxFQUNaLGVBQWUsRUFDZixTQUFTLEVBQ1QsVUFBVSxFQUNWLGVBQWUsRUFDZixZQUFZLEVBQ1osTUFBTSxFQUNOLEtBQUssRUFHTCxlQUFlLEVBQ2YsTUFBTSxFQUdOLFFBQVEsRUFDUixNQUFNLEVBQ04sU0FBUyxFQUNULFFBQVEsRUFHUixnQkFBZ0IsRUFDaEIsaUJBQWlCLEVBQ2pCLGdCQUFnQixFQUNoQixNQUFNLEdBQ1AsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUNMLGVBQWUsRUFDZixZQUFZLEVBRVosRUFBRSxJQUFJLFlBQVksRUFDbEIsT0FBTyxHQUVSLE1BQU0sTUFBTSxDQUFDO0FBQ2QsT0FBTyxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUMvQyxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQ3BDLE9BQU8sRUFBQyx3QkFBd0IsRUFBRSwwQkFBMEIsRUFBQyxNQUFNLDZCQUE2QixD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QztZQUNoQyx5Q0FBeUM7WUFDekMsTUFBTTtRQUNSLENBQUM7UUFDRCxPQUFPLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQztJQUMvQixDQUFDO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aW9uLCBEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtcbiAgQ29sbGVjdGlvblZpZXdlcixcbiAgRGF0YVNvdXJjZSxcbiAgX0Rpc3Bvc2VWaWV3UmVwZWF0ZXJTdHJhdGVneSxcbiAgX1JlY3ljbGVWaWV3UmVwZWF0ZXJTdHJhdGVneSxcbiAgaXNEYXRhU291cmNlLFxuICBfVklFV19SRVBFQVRFUl9TVFJBVEVHWSxcbiAgX1ZpZXdSZXBlYXRlcixcbiAgX1ZpZXdSZXBlYXRlckl0ZW1DaGFuZ2UsXG4gIF9WaWV3UmVwZWF0ZXJJdGVtSW5zZXJ0QXJncyxcbiAgX1ZpZXdSZXBlYXRlck9wZXJhdGlvbixcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvbGxlY3Rpb25zJztcbmltcG9ydCB7UGxhdGZvcm19IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge1ZpZXdwb3J0UnVsZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9zY3JvbGxpbmcnO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7XG4gIEFmdGVyQ29udGVudENoZWNrZWQsXG4gIEF0dHJpYnV0ZSxcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBDb21wb25lbnQsXG4gIENvbnRlbnRDaGlsZCxcbiAgQ29udGVudENoaWxkcmVuLFxuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEVtYmVkZGVkVmlld1JlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBJbmplY3QsXG4gIElucHV0LFxuICBJdGVyYWJsZUNoYW5nZVJlY29yZCxcbiAgSXRlcmFibGVEaWZmZXIsXG4gIEl0ZXJhYmxlRGlmZmVycyxcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIE9uSW5pdCxcbiAgT3B0aW9uYWwsXG4gIE91dHB1dCxcbiAgUXVlcnlMaXN0LFxuICBTa2lwU2VsZixcbiAgVGVtcGxhdGVSZWYsXG4gIFRyYWNrQnlGdW5jdGlvbixcbiAgVmlld0NvbnRhaW5lclJlZixcbiAgVmlld0VuY2Fwc3VsYXRpb24sXG4gIGJvb2xlYW5BdHRyaWJ1dGUsXG4gIGluamVjdCxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1xuICBCZWhhdmlvclN1YmplY3QsXG4gIGlzT2JzZXJ2YWJsZSxcbiAgT2JzZXJ2YWJsZSxcbiAgb2YgYXMgb2JzZXJ2YWJsZU9mLFxuICBTdWJqZWN0LFxuICBTdWJzY3JpcHRpb24sXG59IGZyb20gJ3J4anMnO1xuaW1wb3J0IHt0YWtlLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7Q2RrQ29sdW1uRGVmfSBmcm9tICcuL2NlbGwnO1xuaW1wb3J0IHtfQ29hbGVzY2VkU3R5bGVTY2hlZHVsZXIsIF9DT0FMRVNDRURfU1RZTEVfU0NIRURVTEVSfSBmcm9tICcuL2NvYWxlc2NlZC1zdHlsZS1zY2hlZHVsZXInO1xuaW1wb3J0IHtcbiAgQmFzZVJvd0RlZixcbiAgQ2RrQ2VsbE91dGxldCxcbiAgQ2RrQ2VsbE91dGxldE11bHRpUm93Q29udGV4dCxcbiAgQ2RrQ2VsbE91dGxldFJvd0NvbnRleHQsXG4gIENka0Zvb3RlclJvd0RlZixcbiAgQ2RrSGVhZGVyUm93RGVmLFxuICBDZGtOb0RhdGFSb3csXG4gIENka1Jvd0RlZixcbn0gZnJvbSAnLi9yb3cnO1xuaW1wb3J0IHtTdGlja3lTdHlsZXJ9IGZyb20gJy4vc3RpY2t5LXN0eWxlcic7XG5pbXBvcnQge1xuICBnZXRUYWJsZUR1cGxpY2F0ZUNvbHVtbk5hbWVFcnJvcixcbiAgZ2V0VGFibGVNaXNzaW5nTWF0Y2hpbmdSb3dEZWZFcnJvcixcbiAgZ2V0VGFibGVNaXNzaW5nUm93RGVmc0Vycm9yLFxuICBnZXRUYWJsZU11bHRpcGxlRGVmYXVsdFJvd0RlZnNFcnJvcixcbiAgZ2V0VGFibGVVbmtub3duQ29sdW1uRXJyb3IsXG4gIGdldFRhYmxlVW5rbm93bkRhdGFTb3VyY2VFcnJvcixcbn0gZnJvbSAnLi90YWJsZS1lcnJvcnMnO1xuaW1wb3J0IHtTVElDS1lfUE9TSVRJT05JTkdfTElTVEVORVIsIFN0aWNreVBvc2l0aW9uaW5nTGlzdGVuZXJ9IGZyb20gJy4vc3RpY2t5LXBvc2l0aW9uLWxpc3RlbmVyJztcbmltcG9ydCB7Q0RLX1RBQkxFfSBmcm9tICcuL3Rva2Vucyc7XG5cbi8qKlxuICogRW5hYmxlcyB0aGUgcmVjeWNsZSB2aWV3IHJlcGVhdGVyIHN0cmF0ZWd5LCB3aGljaCByZWR1Y2VzIHJlbmRlcmluZyBsYXRlbmN5LiBOb3QgY29tcGF0aWJsZSB3aXRoXG4gKiB0YWJsZXMgdGhhdCBhbmltYXRlIHJvd3MuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ2Nkay10YWJsZVtyZWN5Y2xlUm93c10sIHRhYmxlW2Nkay10YWJsZV1bcmVjeWNsZVJvd3NdJyxcbiAgcHJvdmlkZXJzOiBbe3Byb3ZpZGU6IF9WSUVXX1JFUEVBVEVSX1NUUkFURUdZLCB1c2VDbGFzczogX1JlY3ljbGVWaWV3UmVwZWF0ZXJTdHJhdGVneX1dLFxuICBzdGFuZGFsb25lOiB0cnVlLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtSZWN5Y2xlUm93cyB7fVxuXG4vKiogSW50ZXJmYWNlIHVzZWQgdG8gcHJvdmlkZSBhbiBvdXRsZXQgZm9yIHJvd3MgdG8gYmUgaW5zZXJ0ZWQgaW50by4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUm93T3V0bGV0IHtcbiAgdmlld0NvbnRhaW5lcjogVmlld0NvbnRhaW5lclJlZjtcbn1cblxuLyoqIFBvc3NpYmxlIHR5cGVzIHRoYXQgY2FuIGJlIHNldCBhcyB0aGUgZGF0YSBzb3VyY2UgZm9yIGEgYENka1RhYmxlYC4gKi9cbmV4cG9ydCB0eXBlIENka1RhYmxlRGF0YVNvdXJjZUlucHV0PFQ+ID0gcmVhZG9ubHkgVFtdIHwgRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8cmVhZG9ubHkgVFtdPjtcblxuLyoqXG4gKiBQcm92aWRlcyBhIGhhbmRsZSBmb3IgdGhlIHRhYmxlIHRvIGdyYWIgdGhlIHZpZXcgY29udGFpbmVyJ3MgbmctY29udGFpbmVyIHRvIGluc2VydCBkYXRhIHJvd3MuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tyb3dPdXRsZXRdJyxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbn0pXG5leHBvcnQgY2xhc3MgRGF0YVJvd091dGxldCBpbXBsZW1lbnRzIFJvd091dGxldCB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyB2aWV3Q29udGFpbmVyOiBWaWV3Q29udGFpbmVyUmVmLFxuICAgIHB1YmxpYyBlbGVtZW50UmVmOiBFbGVtZW50UmVmLFxuICApIHtcbiAgICBjb25zdCB0YWJsZSA9IGluamVjdDxDZGtUYWJsZTx1bmtub3duPj4oQ0RLX1RBQkxFKTtcbiAgICB0YWJsZS5fcm93T3V0bGV0ID0gdGhpcztcbiAgICB0YWJsZS5fb3V0bGV0QXNzaWduZWQoKTtcbiAgfVxufVxuXG4vKipcbiAqIFByb3ZpZGVzIGEgaGFuZGxlIGZvciB0aGUgdGFibGUgdG8gZ3JhYiB0aGUgdmlldyBjb250YWluZXIncyBuZy1jb250YWluZXIgdG8gaW5zZXJ0IHRoZSBoZWFkZXIuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1toZWFkZXJSb3dPdXRsZXRdJyxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbn0pXG5leHBvcnQgY2xhc3MgSGVhZGVyUm93T3V0bGV0IGltcGxlbWVudHMgUm93T3V0bGV0IHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIHZpZXdDb250YWluZXI6IFZpZXdDb250YWluZXJSZWYsXG4gICAgcHVibGljIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYsXG4gICkge1xuICAgIGNvbnN0IHRhYmxlID0gaW5qZWN0PENka1RhYmxlPHVua25vd24+PihDREtfVEFCTEUpO1xuICAgIHRhYmxlLl9oZWFkZXJSb3dPdXRsZXQgPSB0aGlzO1xuICAgIHRhYmxlLl9vdXRsZXRBc3NpZ25lZCgpO1xuICB9XG59XG5cbi8qKlxuICogUHJvdmlkZXMgYSBoYW5kbGUgZm9yIHRoZSB0YWJsZSB0byBncmFiIHRoZSB2aWV3IGNvbnRhaW5lcidzIG5nLWNvbnRhaW5lciB0byBpbnNlcnQgdGhlIGZvb3Rlci5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Zvb3RlclJvd091dGxldF0nLFxuICBzdGFuZGFsb25lOiB0cnVlLFxufSlcbmV4cG9ydCBjbGFzcyBGb290ZXJSb3dPdXRsZXQgaW1wbGVtZW50cyBSb3dPdXRsZXQge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgdmlld0NvbnRhaW5lcjogVmlld0NvbnRhaW5lclJlZixcbiAgICBwdWJsaWMgZWxlbWVudFJlZjogRWxlbWVudFJlZixcbiAgKSB7XG4gICAgY29uc3QgdGFibGUgPSBpbmplY3Q8Q2RrVGFibGU8dW5rbm93bj4+KENES19UQUJMRSk7XG4gICAgdGFibGUuX2Zvb3RlclJvd091dGxldCA9IHRoaXM7XG4gICAgdGFibGUuX291dGxldEFzc2lnbmVkKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBQcm92aWRlcyBhIGhhbmRsZSBmb3IgdGhlIHRhYmxlIHRvIGdyYWIgdGhlIHZpZXdcbiAqIGNvbnRhaW5lcidzIG5nLWNvbnRhaW5lciB0byBpbnNlcnQgdGhlIG5vIGRhdGEgcm93LlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbbm9EYXRhUm93T3V0bGV0XScsXG4gIHN0YW5kYWxvbmU6IHRydWUsXG59KVxuZXhwb3J0IGNsYXNzIE5vRGF0YVJvd091dGxldCBpbXBsZW1lbnRzIFJvd091dGxldCB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyB2aWV3Q29udGFpbmVyOiBWaWV3Q29udGFpbmVyUmVmLFxuICAgIHB1YmxpYyBlbGVtZW50UmVmOiBFbGVtZW50UmVmLFxuICApIHtcbiAgICBjb25zdCB0YWJsZSA9IGluamVjdDxDZGtUYWJsZTx1bmtub3duPj4oQ0RLX1RBQkxFKTtcbiAgICB0YWJsZS5fbm9EYXRhUm93T3V0bGV0ID0gdGhpcztcbiAgICB0YWJsZS5fb3V0bGV0QXNzaWduZWQoKTtcbiAgfVxufVxuXG4vKipcbiAqIFRoZSB0YWJsZSB0ZW1wbGF0ZSB0aGF0IGNhbiBiZSB1c2VkIGJ5IHRoZSBtYXQtdGFibGUuIFNob3VsZCBub3QgYmUgdXNlZCBvdXRzaWRlIG9mIHRoZVxuICogbWF0ZXJpYWwgbGlicmFyeS5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGNvbnN0IENES19UQUJMRV9URU1QTEFURSA9XG4gIC8vIE5vdGUgdGhhdCBhY2NvcmRpbmcgdG8gTUROLCB0aGUgYGNhcHRpb25gIGVsZW1lbnQgaGFzIHRvIGJlIHByb2plY3RlZCBhcyB0aGUgKipmaXJzdCoqXG4gIC8vIGVsZW1lbnQgaW4gdGhlIHRhYmxlLiBTZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRNTC9FbGVtZW50L2NhcHRpb25cbiAgYFxuICA8bmctY29udGVudCBzZWxlY3Q9XCJjYXB0aW9uXCIvPlxuICA8bmctY29udGVudCBzZWxlY3Q9XCJjb2xncm91cCwgY29sXCIvPlxuXG4gIDwhLS1cbiAgICBVbnByb2plY3RlZCBjb250ZW50IHRocm93cyBhIGh5ZHJhdGlvbiBlcnJvciBzbyB3ZSBuZWVkIHRoaXMgdG8gY2FwdHVyZSBpdC5cbiAgICBJdCBnZXRzIHJlbW92ZWQgb24gdGhlIGNsaWVudCBzbyBpdCBkb2Vzbid0IGFmZmVjdCB0aGUgbGF5b3V0LlxuICAtLT5cbiAgQGlmIChfaXNTZXJ2ZXIpIHtcbiAgICA8bmctY29udGVudC8+XG4gIH1cblxuICBAaWYgKF9pc05hdGl2ZUh0bWxUYWJsZSkge1xuICAgIDx0aGVhZCByb2xlPVwicm93Z3JvdXBcIj5cbiAgICAgIDxuZy1jb250YWluZXIgaGVhZGVyUm93T3V0bGV0Lz5cbiAgICA8L3RoZWFkPlxuICAgIDx0Ym9keSByb2xlPVwicm93Z3JvdXBcIj5cbiAgICAgIDxuZy1jb250YWluZXIgcm93T3V0bGV0Lz5cbiAgICAgIDxuZy1jb250YWluZXIgbm9EYXRhUm93T3V0bGV0Lz5cbiAgICA8L3Rib2R5PlxuICAgIDx0Zm9vdCByb2xlPVwicm93Z3JvdXBcIj5cbiAgICAgIDxuZy1jb250YWluZXIgZm9vdGVyUm93T3V0bGV0Lz5cbiAgICA8L3Rmb290PlxuICB9IEBlbHNlIHtcbiAgICA8bmctY29udGFpbmVyIGhlYWRlclJvd091dGxldC8+XG4gICAgPG5nLWNvbnRhaW5lciByb3dPdXRsZXQvPlxuICAgIDxuZy1jb250YWluZXIgbm9EYXRhUm93T3V0bGV0Lz5cbiAgICA8bmctY29udGFpbmVyIGZvb3RlclJvd091dGxldC8+XG4gIH1cbmA7XG5cbi8qKlxuICogSW50ZXJmYWNlIHVzZWQgdG8gY29udmVuaWVudGx5IHR5cGUgdGhlIHBvc3NpYmxlIGNvbnRleHQgaW50ZXJmYWNlcyBmb3IgdGhlIHJlbmRlciByb3cuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUm93Q29udGV4dDxUPlxuICBleHRlbmRzIENka0NlbGxPdXRsZXRNdWx0aVJvd0NvbnRleHQ8VD4sXG4gICAgQ2RrQ2VsbE91dGxldFJvd0NvbnRleHQ8VD4ge31cblxuLyoqXG4gKiBDbGFzcyB1c2VkIHRvIGNvbnZlbmllbnRseSB0eXBlIHRoZSBlbWJlZGRlZCB2aWV3IHJlZiBmb3Igcm93cyB3aXRoIGEgY29udGV4dC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuYWJzdHJhY3QgY2xhc3MgUm93Vmlld1JlZjxUPiBleHRlbmRzIEVtYmVkZGVkVmlld1JlZjxSb3dDb250ZXh0PFQ+PiB7fVxuXG4vKipcbiAqIFNldCBvZiBwcm9wZXJ0aWVzIHRoYXQgcmVwcmVzZW50cyB0aGUgaWRlbnRpdHkgb2YgYSBzaW5nbGUgcmVuZGVyZWQgcm93LlxuICpcbiAqIFdoZW4gdGhlIHRhYmxlIG5lZWRzIHRvIGRldGVybWluZSB0aGUgbGlzdCBvZiByb3dzIHRvIHJlbmRlciwgaXQgd2lsbCBkbyBzbyBieSBpdGVyYXRpbmcgdGhyb3VnaFxuICogZWFjaCBkYXRhIG9iamVjdCBhbmQgZXZhbHVhdGluZyBpdHMgbGlzdCBvZiByb3cgdGVtcGxhdGVzIHRvIGRpc3BsYXkgKHdoZW4gbXVsdGlUZW1wbGF0ZURhdGFSb3dzXG4gKiBpcyBmYWxzZSwgdGhlcmUgaXMgb25seSBvbmUgdGVtcGxhdGUgcGVyIGRhdGEgb2JqZWN0KS4gRm9yIGVhY2ggcGFpciBvZiBkYXRhIG9iamVjdCBhbmQgcm93XG4gKiB0ZW1wbGF0ZSwgYSBgUmVuZGVyUm93YCBpcyBhZGRlZCB0byB0aGUgbGlzdCBvZiByb3dzIHRvIHJlbmRlci4gSWYgdGhlIGRhdGEgb2JqZWN0IGFuZCByb3dcbiAqIHRlbXBsYXRlIHBhaXIgaGFzIGFscmVhZHkgYmVlbiByZW5kZXJlZCwgdGhlIHByZXZpb3VzbHkgdXNlZCBgUmVuZGVyUm93YCBpcyBhZGRlZDsgZWxzZSBhIG5ld1xuICogYFJlbmRlclJvd2AgaXMgKiBjcmVhdGVkLiBPbmNlIHRoZSBsaXN0IGlzIGNvbXBsZXRlIGFuZCBhbGwgZGF0YSBvYmplY3RzIGhhdmUgYmVlbiBpdGVyYXRlZFxuICogdGhyb3VnaCwgYSBkaWZmIGlzIHBlcmZvcm1lZCB0byBkZXRlcm1pbmUgdGhlIGNoYW5nZXMgdGhhdCBuZWVkIHRvIGJlIG1hZGUgdG8gdGhlIHJlbmRlcmVkIHJvd3MuXG4gKlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJlbmRlclJvdzxUPiB7XG4gIGRhdGE6IFQ7XG4gIGRhdGFJbmRleDogbnVtYmVyO1xuICByb3dEZWY6IENka1Jvd0RlZjxUPjtcbn1cblxuLyoqXG4gKiBBIGRhdGEgdGFibGUgdGhhdCBjYW4gcmVuZGVyIGEgaGVhZGVyIHJvdywgZGF0YSByb3dzLCBhbmQgYSBmb290ZXIgcm93LlxuICogVXNlcyB0aGUgZGF0YVNvdXJjZSBpbnB1dCB0byBkZXRlcm1pbmUgdGhlIGRhdGEgdG8gYmUgcmVuZGVyZWQuIFRoZSBkYXRhIGNhbiBiZSBwcm92aWRlZCBlaXRoZXJcbiAqIGFzIGEgZGF0YSBhcnJheSwgYW4gT2JzZXJ2YWJsZSBzdHJlYW0gdGhhdCBlbWl0cyB0aGUgZGF0YSBhcnJheSB0byByZW5kZXIsIG9yIGEgRGF0YVNvdXJjZSB3aXRoIGFcbiAqIGNvbm5lY3QgZnVuY3Rpb24gdGhhdCB3aWxsIHJldHVybiBhbiBPYnNlcnZhYmxlIHN0cmVhbSB0aGF0IGVtaXRzIHRoZSBkYXRhIGFycmF5IHRvIHJlbmRlci5cbiAqL1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAnY2RrLXRhYmxlLCB0YWJsZVtjZGstdGFibGVdJyxcbiAgZXhwb3J0QXM6ICdjZGtUYWJsZScsXG4gIHRlbXBsYXRlOiBDREtfVEFCTEVfVEVNUExBVEUsXG4gIHN0eWxlVXJsczogWyd0YWJsZS5jc3MnXSxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstdGFibGUnLFxuICAgICdbY2xhc3MuY2RrLXRhYmxlLWZpeGVkLWxheW91dF0nOiAnZml4ZWRMYXlvdXQnLFxuICB9LFxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxuICAvLyBUaGUgXCJPblB1c2hcIiBzdGF0dXMgZm9yIHRoZSBgTWF0VGFibGVgIGNvbXBvbmVudCBpcyBlZmZlY3RpdmVseSBhIG5vb3AsIHNvIHdlIGFyZSByZW1vdmluZyBpdC5cbiAgLy8gVGhlIHZpZXcgZm9yIGBNYXRUYWJsZWAgY29uc2lzdHMgZW50aXJlbHkgb2YgdGVtcGxhdGVzIGRlY2xhcmVkIGluIG90aGVyIHZpZXdzLiBBcyB0aGV5IGFyZVxuICAvLyBkZWNsYXJlZCBlbHNld2hlcmUsIHRoZXkgYXJlIGNoZWNrZWQgd2hlbiB0aGVpciBkZWNsYXJhdGlvbiBwb2ludHMgYXJlIGNoZWNrZWQuXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTp2YWxpZGF0ZS1kZWNvcmF0b3JzXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuRGVmYXVsdCxcbiAgcHJvdmlkZXJzOiBbXG4gICAge3Byb3ZpZGU6IENES19UQUJMRSwgdXNlRXhpc3Rpbmc6IENka1RhYmxlfSxcbiAgICB7cHJvdmlkZTogX1ZJRVdfUkVQRUFURVJfU1RSQVRFR1ksIHVzZUNsYXNzOiBfRGlzcG9zZVZpZXdSZXBlYXRlclN0cmF0ZWd5fSxcbiAgICB7cHJvdmlkZTogX0NPQUxFU0NFRF9TVFlMRV9TQ0hFRFVMRVIsIHVzZUNsYXNzOiBfQ29hbGVzY2VkU3R5bGVTY2hlZHVsZXJ9LFxuICAgIC8vIFByZXZlbnQgbmVzdGVkIHRhYmxlcyBmcm9tIHNlZWluZyB0aGlzIHRhYmxlJ3MgU3RpY2t5UG9zaXRpb25pbmdMaXN0ZW5lci5cbiAgICB7cHJvdmlkZTogU1RJQ0tZX1BPU0lUSU9OSU5HX0xJU1RFTkVSLCB1c2VWYWx1ZTogbnVsbH0sXG4gIF0sXG4gIHN0YW5kYWxvbmU6IHRydWUsXG4gIGltcG9ydHM6IFtIZWFkZXJSb3dPdXRsZXQsIERhdGFSb3dPdXRsZXQsIE5vRGF0YVJvd091dGxldCwgRm9vdGVyUm93T3V0bGV0XSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrVGFibGU8VD4gaW1wbGVtZW50cyBBZnRlckNvbnRlbnRDaGVja2VkLCBDb2xsZWN0aW9uVmlld2VyLCBPbkRlc3Ryb3ksIE9uSW5pdCB7XG4gIHByaXZhdGUgX2RvY3VtZW50OiBEb2N1bWVudDtcblxuICAvKiogTGF0ZXN0IGRhdGEgcHJvdmlkZWQgYnkgdGhlIGRhdGEgc291cmNlLiAqL1xuICBwcm90ZWN0ZWQgX2RhdGE6IHJlYWRvbmx5IFRbXTtcblxuICAvKiogU3ViamVjdCB0aGF0IGVtaXRzIHdoZW4gdGhlIGNvbXBvbmVudCBoYXMgYmVlbiBkZXN0cm95ZWQuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX29uRGVzdHJveSA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIExpc3Qgb2YgdGhlIHJlbmRlcmVkIHJvd3MgYXMgaWRlbnRpZmllZCBieSB0aGVpciBgUmVuZGVyUm93YCBvYmplY3QuICovXG4gIHByaXZhdGUgX3JlbmRlclJvd3M6IFJlbmRlclJvdzxUPltdO1xuXG4gIC8qKiBTdWJzY3JpcHRpb24gdGhhdCBsaXN0ZW5zIGZvciB0aGUgZGF0YSBwcm92aWRlZCBieSB0aGUgZGF0YSBzb3VyY2UuICovXG4gIHByaXZhdGUgX3JlbmRlckNoYW5nZVN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uIHwgbnVsbDtcblxuICAvKipcbiAgICogTWFwIG9mIGFsbCB0aGUgdXNlcidzIGRlZmluZWQgY29sdW1ucyAoaGVhZGVyLCBkYXRhLCBhbmQgZm9vdGVyIGNlbGwgdGVtcGxhdGUpIGlkZW50aWZpZWQgYnlcbiAgICogbmFtZS4gQ29sbGVjdGlvbiBwb3B1bGF0ZWQgYnkgdGhlIGNvbHVtbiBkZWZpbml0aW9ucyBnYXRoZXJlZCBieSBgQ29udGVudENoaWxkcmVuYCBhcyB3ZWxsIGFzXG4gICAqIGFueSBjdXN0b20gY29sdW1uIGRlZmluaXRpb25zIGFkZGVkIHRvIGBfY3VzdG9tQ29sdW1uRGVmc2AuXG4gICAqL1xuICBwcml2YXRlIF9jb2x1bW5EZWZzQnlOYW1lID0gbmV3IE1hcDxzdHJpbmcsIENka0NvbHVtbkRlZj4oKTtcblxuICAvKipcbiAgICogU2V0IG9mIGFsbCByb3cgZGVmaW5pdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCBieSB0aGlzIHRhYmxlLiBQb3B1bGF0ZWQgYnkgdGhlIHJvd3MgZ2F0aGVyZWQgYnlcbiAgICogdXNpbmcgYENvbnRlbnRDaGlsZHJlbmAgYXMgd2VsbCBhcyBhbnkgY3VzdG9tIHJvdyBkZWZpbml0aW9ucyBhZGRlZCB0byBgX2N1c3RvbVJvd0RlZnNgLlxuICAgKi9cbiAgcHJpdmF0ZSBfcm93RGVmczogQ2RrUm93RGVmPFQ+W107XG5cbiAgLyoqXG4gICAqIFNldCBvZiBhbGwgaGVhZGVyIHJvdyBkZWZpbml0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIGJ5IHRoaXMgdGFibGUuIFBvcHVsYXRlZCBieSB0aGUgcm93c1xuICAgKiBnYXRoZXJlZCBieSB1c2luZyBgQ29udGVudENoaWxkcmVuYCBhcyB3ZWxsIGFzIGFueSBjdXN0b20gcm93IGRlZmluaXRpb25zIGFkZGVkIHRvXG4gICAqIGBfY3VzdG9tSGVhZGVyUm93RGVmc2AuXG4gICAqL1xuICBwcml2YXRlIF9oZWFkZXJSb3dEZWZzOiBDZGtIZWFkZXJSb3dEZWZbXTtcblxuICAvKipcbiAgICogU2V0IG9mIGFsbCByb3cgZGVmaW5pdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCBieSB0aGlzIHRhYmxlLiBQb3B1bGF0ZWQgYnkgdGhlIHJvd3MgZ2F0aGVyZWQgYnlcbiAgICogdXNpbmcgYENvbnRlbnRDaGlsZHJlbmAgYXMgd2VsbCBhcyBhbnkgY3VzdG9tIHJvdyBkZWZpbml0aW9ucyBhZGRlZCB0b1xuICAgKiBgX2N1c3RvbUZvb3RlclJvd0RlZnNgLlxuICAgKi9cbiAgcHJpdmF0ZSBfZm9vdGVyUm93RGVmczogQ2RrRm9vdGVyUm93RGVmW107XG5cbiAgLyoqIERpZmZlciB1c2VkIHRvIGZpbmQgdGhlIGNoYW5nZXMgaW4gdGhlIGRhdGEgcHJvdmlkZWQgYnkgdGhlIGRhdGEgc291cmNlLiAqL1xuICBwcml2YXRlIF9kYXRhRGlmZmVyOiBJdGVyYWJsZURpZmZlcjxSZW5kZXJSb3c8VD4+O1xuXG4gIC8qKiBTdG9yZXMgdGhlIHJvdyBkZWZpbml0aW9uIHRoYXQgZG9lcyBub3QgaGF2ZSBhIHdoZW4gcHJlZGljYXRlLiAqL1xuICBwcml2YXRlIF9kZWZhdWx0Um93RGVmOiBDZGtSb3dEZWY8VD4gfCBudWxsO1xuXG4gIC8qKlxuICAgKiBDb2x1bW4gZGVmaW5pdGlvbnMgdGhhdCB3ZXJlIGRlZmluZWQgb3V0c2lkZSBvZiB0aGUgZGlyZWN0IGNvbnRlbnQgY2hpbGRyZW4gb2YgdGhlIHRhYmxlLlxuICAgKiBUaGVzZSB3aWxsIGJlIGRlZmluZWQgd2hlbiwgZS5nLiwgY3JlYXRpbmcgYSB3cmFwcGVyIGFyb3VuZCB0aGUgY2RrVGFibGUgdGhhdCBoYXNcbiAgICogY29sdW1uIGRlZmluaXRpb25zIGFzICppdHMqIGNvbnRlbnQgY2hpbGQuXG4gICAqL1xuICBwcml2YXRlIF9jdXN0b21Db2x1bW5EZWZzID0gbmV3IFNldDxDZGtDb2x1bW5EZWY+KCk7XG5cbiAgLyoqXG4gICAqIERhdGEgcm93IGRlZmluaXRpb25zIHRoYXQgd2VyZSBkZWZpbmVkIG91dHNpZGUgb2YgdGhlIGRpcmVjdCBjb250ZW50IGNoaWxkcmVuIG9mIHRoZSB0YWJsZS5cbiAgICogVGhlc2Ugd2lsbCBiZSBkZWZpbmVkIHdoZW4sIGUuZy4sIGNyZWF0aW5nIGEgd3JhcHBlciBhcm91bmQgdGhlIGNka1RhYmxlIHRoYXQgaGFzXG4gICAqIGJ1aWx0LWluIGRhdGEgcm93cyBhcyAqaXRzKiBjb250ZW50IGNoaWxkLlxuICAgKi9cbiAgcHJpdmF0ZSBfY3VzdG9tUm93RGVmcyA9IG5ldyBTZXQ8Q2RrUm93RGVmPFQ+PigpO1xuXG4gIC8qKlxuICAgKiBIZWFkZXIgcm93IGRlZmluaXRpb25zIHRoYXQgd2VyZSBkZWZpbmVkIG91dHNpZGUgb2YgdGhlIGRpcmVjdCBjb250ZW50IGNoaWxkcmVuIG9mIHRoZSB0YWJsZS5cbiAgICogVGhlc2Ugd2lsbCBiZSBkZWZpbmVkIHdoZW4sIGUuZy4sIGNyZWF0aW5nIGEgd3JhcHBlciBhcm91bmQgdGhlIGNka1RhYmxlIHRoYXQgaGFzXG4gICAqIGJ1aWx0LWluIGhlYWRlciByb3dzIGFzICppdHMqIGNvbnRlbnQgY2hpbGQuXG4gICAqL1xuICBwcml2YXRlIF9jdXN0b21IZWFkZXJSb3dEZWZzID0gbmV3IFNldDxDZGtIZWFkZXJSb3dEZWY+KCk7XG5cbiAgLyoqXG4gICAqIEZvb3RlciByb3cgZGVmaW5pdGlvbnMgdGhhdCB3ZXJlIGRlZmluZWQgb3V0c2lkZSBvZiB0aGUgZGlyZWN0IGNvbnRlbnQgY2hpbGRyZW4gb2YgdGhlIHRhYmxlLlxuICAgKiBUaGVzZSB3aWxsIGJlIGRlZmluZWQgd2hlbiwgZS5nLiwgY3JlYXRpbmcgYSB3cmFwcGVyIGFyb3VuZCB0aGUgY2RrVGFibGUgdGhhdCBoYXMgYVxuICAgKiBidWlsdC1pbiBmb290ZXIgcm93IGFzICppdHMqIGNvbnRlbnQgY2hpbGQuXG4gICAqL1xuICBwcml2YXRlIF9jdXN0b21Gb290ZXJSb3dEZWZzID0gbmV3IFNldDxDZGtGb290ZXJSb3dEZWY+KCk7XG5cbiAgLyoqIE5vIGRhdGEgcm93IHRoYXQgd2FzIGRlZmluZWQgb3V0c2lkZSBvZiB0aGUgZGlyZWN0IGNvbnRlbnQgY2hpbGRyZW4gb2YgdGhlIHRhYmxlLiAqL1xuICBwcml2YXRlIF9jdXN0b21Ob0RhdGFSb3c6IENka05vRGF0YVJvdyB8IG51bGw7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGhlYWRlciByb3cgZGVmaW5pdGlvbiBoYXMgYmVlbiBjaGFuZ2VkLiBUcmlnZ2VycyBhbiB1cGRhdGUgdG8gdGhlIGhlYWRlciByb3cgYWZ0ZXJcbiAgICogY29udGVudCBpcyBjaGVja2VkLiBJbml0aWFsaXplZCBhcyB0cnVlIHNvIHRoYXQgdGhlIHRhYmxlIHJlbmRlcnMgdGhlIGluaXRpYWwgc2V0IG9mIHJvd3MuXG4gICAqL1xuICBwcml2YXRlIF9oZWFkZXJSb3dEZWZDaGFuZ2VkID0gdHJ1ZTtcblxuICAvKipcbiAgICogV2hldGhlciB0aGUgZm9vdGVyIHJvdyBkZWZpbml0aW9uIGhhcyBiZWVuIGNoYW5nZWQuIFRyaWdnZXJzIGFuIHVwZGF0ZSB0byB0aGUgZm9vdGVyIHJvdyBhZnRlclxuICAgKiBjb250ZW50IGlzIGNoZWNrZWQuIEluaXRpYWxpemVkIGFzIHRydWUgc28gdGhhdCB0aGUgdGFibGUgcmVuZGVycyB0aGUgaW5pdGlhbCBzZXQgb2Ygcm93cy5cbiAgICovXG4gIHByaXZhdGUgX2Zvb3RlclJvd0RlZkNoYW5nZWQgPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBzdGlja3kgY29sdW1uIHN0eWxlcyBuZWVkIHRvIGJlIHVwZGF0ZWQuIFNldCB0byBgdHJ1ZWAgd2hlbiB0aGUgdmlzaWJsZSBjb2x1bW5zXG4gICAqIGNoYW5nZS5cbiAgICovXG4gIHByaXZhdGUgX3N0aWNreUNvbHVtblN0eWxlc05lZWRSZXNldCA9IHRydWU7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIHN0aWNreSBzdHlsZXIgc2hvdWxkIHJlY2FsY3VsYXRlIGNlbGwgd2lkdGhzIHdoZW4gYXBwbHlpbmcgc3RpY2t5IHN0eWxlcy4gSWZcbiAgICogYGZhbHNlYCwgY2FjaGVkIHZhbHVlcyB3aWxsIGJlIHVzZWQgaW5zdGVhZC4gVGhpcyBpcyBvbmx5IGFwcGxpY2FibGUgdG8gdGFibGVzIHdpdGhcbiAgICoge0BsaW5rIGZpeGVkTGF5b3V0fSBlbmFibGVkLiBGb3Igb3RoZXIgdGFibGVzLCBjZWxsIHdpZHRocyB3aWxsIGFsd2F5cyBiZSByZWNhbGN1bGF0ZWQuXG4gICAqL1xuICBwcml2YXRlIF9mb3JjZVJlY2FsY3VsYXRlQ2VsbFdpZHRocyA9IHRydWU7XG5cbiAgLyoqXG4gICAqIENhY2hlIG9mIHRoZSBsYXRlc3QgcmVuZGVyZWQgYFJlbmRlclJvd2Agb2JqZWN0cyBhcyBhIG1hcCBmb3IgZWFzeSByZXRyaWV2YWwgd2hlbiBjb25zdHJ1Y3RpbmdcbiAgICogYSBuZXcgbGlzdCBvZiBgUmVuZGVyUm93YCBvYmplY3RzIGZvciByZW5kZXJpbmcgcm93cy4gU2luY2UgdGhlIG5ldyBsaXN0IGlzIGNvbnN0cnVjdGVkIHdpdGhcbiAgICogdGhlIGNhY2hlZCBgUmVuZGVyUm93YCBvYmplY3RzIHdoZW4gcG9zc2libGUsIHRoZSByb3cgaWRlbnRpdHkgaXMgcHJlc2VydmVkIHdoZW4gdGhlIGRhdGFcbiAgICogYW5kIHJvdyB0ZW1wbGF0ZSBtYXRjaGVzLCB3aGljaCBhbGxvd3MgdGhlIGBJdGVyYWJsZURpZmZlcmAgdG8gY2hlY2sgcm93cyBieSByZWZlcmVuY2VcbiAgICogYW5kIHVuZGVyc3RhbmQgd2hpY2ggcm93cyBhcmUgYWRkZWQvbW92ZWQvcmVtb3ZlZC5cbiAgICpcbiAgICogSW1wbGVtZW50ZWQgYXMgYSBtYXAgb2YgbWFwcyB3aGVyZSB0aGUgZmlyc3Qga2V5IGlzIHRoZSBgZGF0YTogVGAgb2JqZWN0IGFuZCB0aGUgc2Vjb25kIGlzIHRoZVxuICAgKiBgQ2RrUm93RGVmPFQ+YCBvYmplY3QuIFdpdGggdGhlIHR3byBrZXlzLCB0aGUgY2FjaGUgcG9pbnRzIHRvIGEgYFJlbmRlclJvdzxUPmAgb2JqZWN0IHRoYXRcbiAgICogY29udGFpbnMgYW4gYXJyYXkgb2YgY3JlYXRlZCBwYWlycy4gVGhlIGFycmF5IGlzIG5lY2Vzc2FyeSB0byBoYW5kbGUgY2FzZXMgd2hlcmUgdGhlIGRhdGFcbiAgICogYXJyYXkgY29udGFpbnMgbXVsdGlwbGUgZHVwbGljYXRlIGRhdGEgb2JqZWN0cyBhbmQgZWFjaCBpbnN0YW50aWF0ZWQgYFJlbmRlclJvd2AgbXVzdCBiZVxuICAgKiBzdG9yZWQuXG4gICAqL1xuICBwcml2YXRlIF9jYWNoZWRSZW5kZXJSb3dzTWFwID0gbmV3IE1hcDxULCBXZWFrTWFwPENka1Jvd0RlZjxUPiwgUmVuZGVyUm93PFQ+W10+PigpO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSB0YWJsZSBpcyBhcHBsaWVkIHRvIGEgbmF0aXZlIGA8dGFibGU+YC4gKi9cbiAgcHJvdGVjdGVkIF9pc05hdGl2ZUh0bWxUYWJsZTogYm9vbGVhbjtcblxuICAvKipcbiAgICogVXRpbGl0eSBjbGFzcyB0aGF0IGlzIHJlc3BvbnNpYmxlIGZvciBhcHBseWluZyB0aGUgYXBwcm9wcmlhdGUgc3RpY2t5IHBvc2l0aW9uaW5nIHN0eWxlcyB0b1xuICAgKiB0aGUgdGFibGUncyByb3dzIGFuZCBjZWxscy5cbiAgICovXG4gIHByaXZhdGUgX3N0aWNreVN0eWxlcjogU3RpY2t5U3R5bGVyO1xuXG4gIC8qKlxuICAgKiBDU1MgY2xhc3MgYWRkZWQgdG8gYW55IHJvdyBvciBjZWxsIHRoYXQgaGFzIHN0aWNreSBwb3NpdGlvbmluZyBhcHBsaWVkLiBNYXkgYmUgb3ZlcnJpZGRlbiBieVxuICAgKiB0YWJsZSBzdWJjbGFzc2VzLlxuICAgKi9cbiAgcHJvdGVjdGVkIHN0aWNreUNzc0NsYXNzOiBzdHJpbmcgPSAnY2RrLXRhYmxlLXN0aWNreSc7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdG8gbWFudWFsbHkgYWRkIHBvc2l0aW9uOiBzdGlja3kgdG8gYWxsIHN0aWNreSBjZWxsIGVsZW1lbnRzLiBOb3QgbmVlZGVkIGlmXG4gICAqIHRoZSBwb3NpdGlvbiBpcyBzZXQgaW4gYSBzZWxlY3RvciBhc3NvY2lhdGVkIHdpdGggdGhlIHZhbHVlIG9mIHN0aWNreUNzc0NsYXNzLiBNYXkgYmVcbiAgICogb3ZlcnJpZGRlbiBieSB0YWJsZSBzdWJjbGFzc2VzXG4gICAqL1xuICBwcm90ZWN0ZWQgbmVlZHNQb3NpdGlvblN0aWNreU9uRWxlbWVudCA9IHRydWU7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGNvbXBvbmVudCBpcyBiZWluZyByZW5kZXJlZCBvbiB0aGUgc2VydmVyLiAqL1xuICBwcm90ZWN0ZWQgX2lzU2VydmVyOiBib29sZWFuO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBubyBkYXRhIHJvdyBpcyBjdXJyZW50bHkgc2hvd2luZyBhbnl0aGluZy4gKi9cbiAgcHJpdmF0ZSBfaXNTaG93aW5nTm9EYXRhUm93ID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHRhYmxlIGhhcyByZW5kZXJlZCBvdXQgYWxsIHRoZSBvdXRsZXRzIGZvciB0aGUgZmlyc3QgdGltZS4gKi9cbiAgcHJpdmF0ZSBfaGFzUmVuZGVyZWQgPSBmYWxzZTtcblxuICAvKiogQXJpYSByb2xlIHRvIGFwcGx5IHRvIHRoZSB0YWJsZSdzIGNlbGxzIGJhc2VkIG9uIHRoZSB0YWJsZSdzIG93biByb2xlLiAqL1xuICBfZ2V0Q2VsbFJvbGUoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgaWYgKHRoaXMuX2NlbGxSb2xlSW50ZXJuYWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gUGVyZm9ybSB0aGlzIGxhemlseSBpbiBjYXNlIHRoZSB0YWJsZSdzIHJvbGUgd2FzIHVwZGF0ZWQgYnkgYSBkaXJlY3RpdmUgYWZ0ZXIgY29uc3RydWN0aW9uLlxuICAgICAgY29uc3Qgcm9sZSA9IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ3JvbGUnKTtcbiAgICAgIGNvbnN0IGNlbGxSb2xlID0gcm9sZSA9PT0gJ2dyaWQnIHx8IHJvbGUgPT09ICd0cmVlZ3JpZCcgPyAnZ3JpZGNlbGwnIDogJ2NlbGwnO1xuICAgICAgdGhpcy5fY2VsbFJvbGVJbnRlcm5hbCA9IHRoaXMuX2lzTmF0aXZlSHRtbFRhYmxlICYmIGNlbGxSb2xlID09PSAnY2VsbCcgPyBudWxsIDogY2VsbFJvbGU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX2NlbGxSb2xlSW50ZXJuYWw7XG4gIH1cbiAgcHJpdmF0ZSBfY2VsbFJvbGVJbnRlcm5hbDogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogVHJhY2tpbmcgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIHVzZWQgdG8gY2hlY2sgdGhlIGRpZmZlcmVuY2VzIGluIGRhdGEgY2hhbmdlcy4gVXNlZCBzaW1pbGFybHlcbiAgICogdG8gYG5nRm9yYCBgdHJhY2tCeWAgZnVuY3Rpb24uIE9wdGltaXplIHJvdyBvcGVyYXRpb25zIGJ5IGlkZW50aWZ5aW5nIGEgcm93IGJhc2VkIG9uIGl0cyBkYXRhXG4gICAqIHJlbGF0aXZlIHRvIHRoZSBmdW5jdGlvbiB0byBrbm93IGlmIGEgcm93IHNob3VsZCBiZSBhZGRlZC9yZW1vdmVkL21vdmVkLlxuICAgKiBBY2NlcHRzIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyB0d28gcGFyYW1ldGVycywgYGluZGV4YCBhbmQgYGl0ZW1gLlxuICAgKi9cbiAgQElucHV0KClcbiAgZ2V0IHRyYWNrQnkoKTogVHJhY2tCeUZ1bmN0aW9uPFQ+IHtcbiAgICByZXR1cm4gdGhpcy5fdHJhY2tCeUZuO1xuICB9XG4gIHNldCB0cmFja0J5KGZuOiBUcmFja0J5RnVuY3Rpb248VD4pIHtcbiAgICBpZiAoKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgZm4gIT0gbnVsbCAmJiB0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNvbnNvbGUud2FybihgdHJhY2tCeSBtdXN0IGJlIGEgZnVuY3Rpb24sIGJ1dCByZWNlaXZlZCAke0pTT04uc3RyaW5naWZ5KGZuKX0uYCk7XG4gICAgfVxuICAgIHRoaXMuX3RyYWNrQnlGbiA9IGZuO1xuICB9XG4gIHByaXZhdGUgX3RyYWNrQnlGbjogVHJhY2tCeUZ1bmN0aW9uPFQ+O1xuXG4gIC8qKlxuICAgKiBUaGUgdGFibGUncyBzb3VyY2Ugb2YgZGF0YSwgd2hpY2ggY2FuIGJlIHByb3ZpZGVkIGluIHRocmVlIHdheXMgKGluIG9yZGVyIG9mIGNvbXBsZXhpdHkpOlxuICAgKiAgIC0gU2ltcGxlIGRhdGEgYXJyYXkgKGVhY2ggb2JqZWN0IHJlcHJlc2VudHMgb25lIHRhYmxlIHJvdylcbiAgICogICAtIFN0cmVhbSB0aGF0IGVtaXRzIGEgZGF0YSBhcnJheSBlYWNoIHRpbWUgdGhlIGFycmF5IGNoYW5nZXNcbiAgICogICAtIGBEYXRhU291cmNlYCBvYmplY3QgdGhhdCBpbXBsZW1lbnRzIHRoZSBjb25uZWN0L2Rpc2Nvbm5lY3QgaW50ZXJmYWNlLlxuICAgKlxuICAgKiBJZiBhIGRhdGEgYXJyYXkgaXMgcHJvdmlkZWQsIHRoZSB0YWJsZSBtdXN0IGJlIG5vdGlmaWVkIHdoZW4gdGhlIGFycmF5J3Mgb2JqZWN0cyBhcmVcbiAgICogYWRkZWQsIHJlbW92ZWQsIG9yIG1vdmVkLiBUaGlzIGNhbiBiZSBkb25lIGJ5IGNhbGxpbmcgdGhlIGByZW5kZXJSb3dzKClgIGZ1bmN0aW9uIHdoaWNoIHdpbGxcbiAgICogcmVuZGVyIHRoZSBkaWZmIHNpbmNlIHRoZSBsYXN0IHRhYmxlIHJlbmRlci4gSWYgdGhlIGRhdGEgYXJyYXkgcmVmZXJlbmNlIGlzIGNoYW5nZWQsIHRoZSB0YWJsZVxuICAgKiB3aWxsIGF1dG9tYXRpY2FsbHkgdHJpZ2dlciBhbiB1cGRhdGUgdG8gdGhlIHJvd3MuXG4gICAqXG4gICAqIFdoZW4gcHJvdmlkaW5nIGFuIE9ic2VydmFibGUgc3RyZWFtLCB0aGUgdGFibGUgd2lsbCB0cmlnZ2VyIGFuIHVwZGF0ZSBhdXRvbWF0aWNhbGx5IHdoZW4gdGhlXG4gICAqIHN0cmVhbSBlbWl0cyBhIG5ldyBhcnJheSBvZiBkYXRhLlxuICAgKlxuICAgKiBGaW5hbGx5LCB3aGVuIHByb3ZpZGluZyBhIGBEYXRhU291cmNlYCBvYmplY3QsIHRoZSB0YWJsZSB3aWxsIHVzZSB0aGUgT2JzZXJ2YWJsZSBzdHJlYW1cbiAgICogcHJvdmlkZWQgYnkgdGhlIGNvbm5lY3QgZnVuY3Rpb24gYW5kIHRyaWdnZXIgdXBkYXRlcyB3aGVuIHRoYXQgc3RyZWFtIGVtaXRzIG5ldyBkYXRhIGFycmF5XG4gICAqIHZhbHVlcy4gRHVyaW5nIHRoZSB0YWJsZSdzIG5nT25EZXN0cm95IG9yIHdoZW4gdGhlIGRhdGEgc291cmNlIGlzIHJlbW92ZWQgZnJvbSB0aGUgdGFibGUsIHRoZVxuICAgKiB0YWJsZSB3aWxsIGNhbGwgdGhlIERhdGFTb3VyY2UncyBgZGlzY29ubmVjdGAgZnVuY3Rpb24gKG1heSBiZSB1c2VmdWwgZm9yIGNsZWFuaW5nIHVwIGFueVxuICAgKiBzdWJzY3JpcHRpb25zIHJlZ2lzdGVyZWQgZHVyaW5nIHRoZSBjb25uZWN0IHByb2Nlc3MpLlxuICAgKi9cbiAgQElucHV0KClcbiAgZ2V0IGRhdGFTb3VyY2UoKTogQ2RrVGFibGVEYXRhU291cmNlSW5wdXQ8VD4ge1xuICAgIHJldHVybiB0aGlzLl9kYXRhU291cmNlO1xuICB9XG4gIHNldCBkYXRhU291cmNlKGRhdGFTb3VyY2U6IENka1RhYmxlRGF0YVNvdXJjZUlucHV0PFQ+KSB7XG4gICAgaWYgKHRoaXMuX2RhdGFTb3VyY2UgIT09IGRhdGFTb3VyY2UpIHtcbiAgICAgIHRoaXMuX3N3aXRjaERhdGFTb3VyY2UoZGF0YVNvdXJjZSk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgX2RhdGFTb3VyY2U6IENka1RhYmxlRGF0YVNvdXJjZUlucHV0PFQ+O1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRvIGFsbG93IG11bHRpcGxlIHJvd3MgcGVyIGRhdGEgb2JqZWN0IGJ5IGV2YWx1YXRpbmcgd2hpY2ggcm93cyBldmFsdWF0ZSB0aGVpciAnd2hlbidcbiAgICogcHJlZGljYXRlIHRvIHRydWUuIElmIGBtdWx0aVRlbXBsYXRlRGF0YVJvd3NgIGlzIGZhbHNlLCB3aGljaCBpcyB0aGUgZGVmYXVsdCB2YWx1ZSwgdGhlbiBlYWNoXG4gICAqIGRhdGFvYmplY3Qgd2lsbCByZW5kZXIgdGhlIGZpcnN0IHJvdyB0aGF0IGV2YWx1YXRlcyBpdHMgd2hlbiBwcmVkaWNhdGUgdG8gdHJ1ZSwgaW4gdGhlIG9yZGVyXG4gICAqIGRlZmluZWQgaW4gdGhlIHRhYmxlLCBvciBvdGhlcndpc2UgdGhlIGRlZmF1bHQgcm93IHdoaWNoIGRvZXMgbm90IGhhdmUgYSB3aGVuIHByZWRpY2F0ZS5cbiAgICovXG4gIEBJbnB1dCh7dHJhbnNmb3JtOiBib29sZWFuQXR0cmlidXRlfSlcbiAgZ2V0IG11bHRpVGVtcGxhdGVEYXRhUm93cygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fbXVsdGlUZW1wbGF0ZURhdGFSb3dzO1xuICB9XG4gIHNldCBtdWx0aVRlbXBsYXRlRGF0YVJvd3ModmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9tdWx0aVRlbXBsYXRlRGF0YVJvd3MgPSB2YWx1ZTtcblxuICAgIC8vIEluIEl2eSBpZiB0aGlzIHZhbHVlIGlzIHNldCB2aWEgYSBzdGF0aWMgYXR0cmlidXRlIChlLmcuIDx0YWJsZSBtdWx0aVRlbXBsYXRlRGF0YVJvd3M+KSxcbiAgICAvLyB0aGlzIHNldHRlciB3aWxsIGJlIGludm9rZWQgYmVmb3JlIHRoZSByb3cgb3V0bGV0IGhhcyBiZWVuIGRlZmluZWQgaGVuY2UgdGhlIG51bGwgY2hlY2suXG4gICAgaWYgKHRoaXMuX3Jvd091dGxldCAmJiB0aGlzLl9yb3dPdXRsZXQudmlld0NvbnRhaW5lci5sZW5ndGgpIHtcbiAgICAgIHRoaXMuX2ZvcmNlUmVuZGVyRGF0YVJvd3MoKTtcbiAgICAgIHRoaXMudXBkYXRlU3RpY2t5Q29sdW1uU3R5bGVzKCk7XG4gICAgfVxuICB9XG4gIF9tdWx0aVRlbXBsYXRlRGF0YVJvd3M6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKipcbiAgICogV2hldGhlciB0byB1c2UgYSBmaXhlZCB0YWJsZSBsYXlvdXQuIEVuYWJsaW5nIHRoaXMgb3B0aW9uIHdpbGwgZW5mb3JjZSBjb25zaXN0ZW50IGNvbHVtbiB3aWR0aHNcbiAgICogYW5kIG9wdGltaXplIHJlbmRlcmluZyBzdGlja3kgc3R5bGVzIGZvciBuYXRpdmUgdGFibGVzLiBOby1vcCBmb3IgZmxleCB0YWJsZXMuXG4gICAqL1xuICBASW5wdXQoe3RyYW5zZm9ybTogYm9vbGVhbkF0dHJpYnV0ZX0pXG4gIGdldCBmaXhlZExheW91dCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fZml4ZWRMYXlvdXQ7XG4gIH1cbiAgc2V0IGZpeGVkTGF5b3V0KHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5fZml4ZWRMYXlvdXQgPSB2YWx1ZTtcblxuICAgIC8vIFRvZ2dsaW5nIGBmaXhlZExheW91dGAgbWF5IGNoYW5nZSBjb2x1bW4gd2lkdGhzLiBTdGlja3kgY29sdW1uIHN0eWxlcyBzaG91bGQgYmUgcmVjYWxjdWxhdGVkLlxuICAgIHRoaXMuX2ZvcmNlUmVjYWxjdWxhdGVDZWxsV2lkdGhzID0gdHJ1ZTtcbiAgICB0aGlzLl9zdGlja3lDb2x1bW5TdHlsZXNOZWVkUmVzZXQgPSB0cnVlO1xuICB9XG4gIHByaXZhdGUgX2ZpeGVkTGF5b3V0OiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIEVtaXRzIHdoZW4gdGhlIHRhYmxlIGNvbXBsZXRlcyByZW5kZXJpbmcgYSBzZXQgb2YgZGF0YSByb3dzIGJhc2VkIG9uIHRoZSBsYXRlc3QgZGF0YSBmcm9tIHRoZVxuICAgKiBkYXRhIHNvdXJjZSwgZXZlbiBpZiB0aGUgc2V0IG9mIHJvd3MgaXMgZW1wdHkuXG4gICAqL1xuICBAT3V0cHV0KClcbiAgcmVhZG9ubHkgY29udGVudENoYW5nZWQgPSBuZXcgRXZlbnRFbWl0dGVyPHZvaWQ+KCk7XG5cbiAgLy8gVE9ETyhhbmRyZXdzZWd1aW4pOiBSZW1vdmUgbWF4IHZhbHVlIGFzIHRoZSBlbmQgaW5kZXhcbiAgLy8gICBhbmQgaW5zdGVhZCBjYWxjdWxhdGUgdGhlIHZpZXcgb24gaW5pdCBhbmQgc2Nyb2xsLlxuICAvKipcbiAgICogU3RyZWFtIGNvbnRhaW5pbmcgdGhlIGxhdGVzdCBpbmZvcm1hdGlvbiBvbiB3aGF0IHJvd3MgYXJlIGJlaW5nIGRpc3BsYXllZCBvbiBzY3JlZW4uXG4gICAqIENhbiBiZSB1c2VkIGJ5IHRoZSBkYXRhIHNvdXJjZSB0byBhcyBhIGhldXJpc3RpYyBvZiB3aGF0IGRhdGEgc2hvdWxkIGJlIHByb3ZpZGVkLlxuICAgKlxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICByZWFkb25seSB2aWV3Q2hhbmdlID0gbmV3IEJlaGF2aW9yU3ViamVjdDx7c3RhcnQ6IG51bWJlcjsgZW5kOiBudW1iZXJ9Pih7XG4gICAgc3RhcnQ6IDAsXG4gICAgZW5kOiBOdW1iZXIuTUFYX1ZBTFVFLFxuICB9KTtcblxuICAvLyBPdXRsZXRzIGluIHRoZSB0YWJsZSdzIHRlbXBsYXRlIHdoZXJlIHRoZSBoZWFkZXIsIGRhdGEgcm93cywgYW5kIGZvb3RlciB3aWxsIGJlIGluc2VydGVkLlxuICBfcm93T3V0bGV0OiBEYXRhUm93T3V0bGV0O1xuICBfaGVhZGVyUm93T3V0bGV0OiBIZWFkZXJSb3dPdXRsZXQ7XG4gIF9mb290ZXJSb3dPdXRsZXQ6IEZvb3RlclJvd091dGxldDtcbiAgX25vRGF0YVJvd091dGxldDogTm9EYXRhUm93T3V0bGV0O1xuXG4gIC8qKlxuICAgKiBUaGUgY29sdW1uIGRlZmluaXRpb25zIHByb3ZpZGVkIGJ5IHRoZSB1c2VyIHRoYXQgY29udGFpbiB3aGF0IHRoZSBoZWFkZXIsIGRhdGEsIGFuZCBmb290ZXJcbiAgICogY2VsbHMgc2hvdWxkIHJlbmRlciBmb3IgZWFjaCBjb2x1bW4uXG4gICAqL1xuICBAQ29udGVudENoaWxkcmVuKENka0NvbHVtbkRlZiwge2Rlc2NlbmRhbnRzOiB0cnVlfSkgX2NvbnRlbnRDb2x1bW5EZWZzOiBRdWVyeUxpc3Q8Q2RrQ29sdW1uRGVmPjtcblxuICAvKiogU2V0IG9mIGRhdGEgcm93IGRlZmluaXRpb25zIHRoYXQgd2VyZSBwcm92aWRlZCB0byB0aGUgdGFibGUgYXMgY29udGVudCBjaGlsZHJlbi4gKi9cbiAgQENvbnRlbnRDaGlsZHJlbihDZGtSb3dEZWYsIHtkZXNjZW5kYW50czogdHJ1ZX0pIF9jb250ZW50Um93RGVmczogUXVlcnlMaXN0PENka1Jvd0RlZjxUPj47XG5cbiAgLyoqIFNldCBvZiBoZWFkZXIgcm93IGRlZmluaXRpb25zIHRoYXQgd2VyZSBwcm92aWRlZCB0byB0aGUgdGFibGUgYXMgY29udGVudCBjaGlsZHJlbi4gKi9cbiAgQENvbnRlbnRDaGlsZHJlbihDZGtIZWFkZXJSb3dEZWYsIHtcbiAgICBkZXNjZW5kYW50czogdHJ1ZSxcbiAgfSlcbiAgX2NvbnRlbnRIZWFkZXJSb3dEZWZzOiBRdWVyeUxpc3Q8Q2RrSGVhZGVyUm93RGVmPjtcblxuICAvKiogU2V0IG9mIGZvb3RlciByb3cgZGVmaW5pdGlvbnMgdGhhdCB3ZXJlIHByb3ZpZGVkIHRvIHRoZSB0YWJsZSBhcyBjb250ZW50IGNoaWxkcmVuLiAqL1xuICBAQ29udGVudENoaWxkcmVuKENka0Zvb3RlclJvd0RlZiwge1xuICAgIGRlc2NlbmRhbnRzOiB0cnVlLFxuICB9KVxuICBfY29udGVudEZvb3RlclJvd0RlZnM6IFF1ZXJ5TGlzdDxDZGtGb290ZXJSb3dEZWY+O1xuXG4gIC8qKiBSb3cgZGVmaW5pdGlvbiB0aGF0IHdpbGwgb25seSBiZSByZW5kZXJlZCBpZiB0aGVyZSdzIG5vIGRhdGEgaW4gdGhlIHRhYmxlLiAqL1xuICBAQ29udGVudENoaWxkKENka05vRGF0YVJvdykgX25vRGF0YVJvdzogQ2RrTm9EYXRhUm93O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByb3RlY3RlZCByZWFkb25seSBfZGlmZmVyczogSXRlcmFibGVEaWZmZXJzLFxuICAgIHByb3RlY3RlZCByZWFkb25seSBfY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmLFxuICAgIHByb3RlY3RlZCByZWFkb25seSBfZWxlbWVudFJlZjogRWxlbWVudFJlZixcbiAgICBAQXR0cmlidXRlKCdyb2xlJykgcm9sZTogc3RyaW5nLFxuICAgIEBPcHRpb25hbCgpIHByb3RlY3RlZCByZWFkb25seSBfZGlyOiBEaXJlY3Rpb25hbGl0eSxcbiAgICBASW5qZWN0KERPQ1VNRU5UKSBfZG9jdW1lbnQ6IGFueSxcbiAgICBwcml2YXRlIF9wbGF0Zm9ybTogUGxhdGZvcm0sXG4gICAgQEluamVjdChfVklFV19SRVBFQVRFUl9TVFJBVEVHWSlcbiAgICBwcm90ZWN0ZWQgcmVhZG9ubHkgX3ZpZXdSZXBlYXRlcjogX1ZpZXdSZXBlYXRlcjxULCBSZW5kZXJSb3c8VD4sIFJvd0NvbnRleHQ8VD4+LFxuICAgIEBJbmplY3QoX0NPQUxFU0NFRF9TVFlMRV9TQ0hFRFVMRVIpXG4gICAgcHJvdGVjdGVkIHJlYWRvbmx5IF9jb2FsZXNjZWRTdHlsZVNjaGVkdWxlcjogX0NvYWxlc2NlZFN0eWxlU2NoZWR1bGVyLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgX3ZpZXdwb3J0UnVsZXI6IFZpZXdwb3J0UnVsZXIsXG4gICAgLyoqXG4gICAgICogQGRlcHJlY2F0ZWQgYF9zdGlja3lQb3NpdGlvbmluZ0xpc3RlbmVyYCBwYXJhbWV0ZXIgdG8gYmVjb21lIHJlcXVpcmVkLlxuICAgICAqIEBicmVha2luZy1jaGFuZ2UgMTMuMC4wXG4gICAgICovXG4gICAgQE9wdGlvbmFsKClcbiAgICBAU2tpcFNlbGYoKVxuICAgIEBJbmplY3QoU1RJQ0tZX1BPU0lUSU9OSU5HX0xJU1RFTkVSKVxuICAgIHByb3RlY3RlZCByZWFkb25seSBfc3RpY2t5UG9zaXRpb25pbmdMaXN0ZW5lcjogU3RpY2t5UG9zaXRpb25pbmdMaXN0ZW5lcixcbiAgICAvKipcbiAgICAgKiBAZGVwcmVjYXRlZCBgX25nWm9uZWAgcGFyYW1ldGVyIHRvIGJlY29tZSByZXF1aXJlZC5cbiAgICAgKiBAYnJlYWtpbmctY2hhbmdlIDE0LjAuMFxuICAgICAqL1xuICAgIEBPcHRpb25hbCgpXG4gICAgcHJvdGVjdGVkIHJlYWRvbmx5IF9uZ1pvbmU/OiBOZ1pvbmUsXG4gICkge1xuICAgIGlmICghcm9sZSkge1xuICAgICAgX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAndGFibGUnKTtcbiAgICB9XG5cbiAgICB0aGlzLl9kb2N1bWVudCA9IF9kb2N1bWVudDtcbiAgICB0aGlzLl9pc1NlcnZlciA9ICFfcGxhdGZvcm0uaXNCcm93c2VyO1xuICAgIHRoaXMuX2lzTmF0aXZlSHRtbFRhYmxlID0gX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5ub2RlTmFtZSA9PT0gJ1RBQkxFJztcbiAgfVxuXG4gIG5nT25Jbml0KCkge1xuICAgIHRoaXMuX3NldHVwU3RpY2t5U3R5bGVyKCk7XG5cbiAgICAvLyBTZXQgdXAgdGhlIHRyYWNrQnkgZnVuY3Rpb24gc28gdGhhdCBpdCB1c2VzIHRoZSBgUmVuZGVyUm93YCBhcyBpdHMgaWRlbnRpdHkgYnkgZGVmYXVsdC4gSWZcbiAgICAvLyB0aGUgdXNlciBoYXMgcHJvdmlkZWQgYSBjdXN0b20gdHJhY2tCeSwgcmV0dXJuIHRoZSByZXN1bHQgb2YgdGhhdCBmdW5jdGlvbiBhcyBldmFsdWF0ZWRcbiAgICAvLyB3aXRoIHRoZSB2YWx1ZXMgb2YgdGhlIGBSZW5kZXJSb3dgJ3MgZGF0YSBhbmQgaW5kZXguXG4gICAgdGhpcy5fZGF0YURpZmZlciA9IHRoaXMuX2RpZmZlcnMuZmluZChbXSkuY3JlYXRlKChfaTogbnVtYmVyLCBkYXRhUm93OiBSZW5kZXJSb3c8VD4pID0+IHtcbiAgICAgIHJldHVybiB0aGlzLnRyYWNrQnkgPyB0aGlzLnRyYWNrQnkoZGF0YVJvdy5kYXRhSW5kZXgsIGRhdGFSb3cuZGF0YSkgOiBkYXRhUm93O1xuICAgIH0pO1xuXG4gICAgdGhpcy5fdmlld3BvcnRSdWxlclxuICAgICAgLmNoYW5nZSgpXG4gICAgICAucGlwZSh0YWtlVW50aWwodGhpcy5fb25EZXN0cm95KSlcbiAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICB0aGlzLl9mb3JjZVJlY2FsY3VsYXRlQ2VsbFdpZHRocyA9IHRydWU7XG4gICAgICB9KTtcbiAgfVxuXG4gIG5nQWZ0ZXJDb250ZW50Q2hlY2tlZCgpIHtcbiAgICAvLyBPbmx5IHN0YXJ0IHJlLXJlbmRlcmluZyBpbiBgbmdBZnRlckNvbnRlbnRDaGVja2VkYCBhZnRlciB0aGUgZmlyc3QgcmVuZGVyLlxuICAgIGlmICh0aGlzLl9oYXNSZW5kZXJlZCkge1xuICAgICAgdGhpcy5fcmVuZGVyKCk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgW1xuICAgICAgdGhpcy5fcm93T3V0bGV0Py52aWV3Q29udGFpbmVyLFxuICAgICAgdGhpcy5faGVhZGVyUm93T3V0bGV0Py52aWV3Q29udGFpbmVyLFxuICAgICAgdGhpcy5fZm9vdGVyUm93T3V0bGV0Py52aWV3Q29udGFpbmVyLFxuICAgICAgdGhpcy5fY2FjaGVkUmVuZGVyUm93c01hcCxcbiAgICAgIHRoaXMuX2N1c3RvbUNvbHVtbkRlZnMsXG4gICAgICB0aGlzLl9jdXN0b21Sb3dEZWZzLFxuICAgICAgdGhpcy5fY3VzdG9tSGVhZGVyUm93RGVmcyxcbiAgICAgIHRoaXMuX2N1c3RvbUZvb3RlclJvd0RlZnMsXG4gICAgICB0aGlzLl9jb2x1bW5EZWZzQnlOYW1lLFxuICAgIF0uZm9yRWFjaCgoZGVmOiBWaWV3Q29udGFpbmVyUmVmIHwgU2V0PHVua25vd24+IHwgTWFwPHVua25vd24sIHVua25vd24+IHwgdW5kZWZpbmVkKSA9PiB7XG4gICAgICBkZWY/LmNsZWFyKCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLl9oZWFkZXJSb3dEZWZzID0gW107XG4gICAgdGhpcy5fZm9vdGVyUm93RGVmcyA9IFtdO1xuICAgIHRoaXMuX2RlZmF1bHRSb3dEZWYgPSBudWxsO1xuICAgIHRoaXMuX29uRGVzdHJveS5uZXh0KCk7XG4gICAgdGhpcy5fb25EZXN0cm95LmNvbXBsZXRlKCk7XG5cbiAgICBpZiAoaXNEYXRhU291cmNlKHRoaXMuZGF0YVNvdXJjZSkpIHtcbiAgICAgIHRoaXMuZGF0YVNvdXJjZS5kaXNjb25uZWN0KHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZW5kZXJzIHJvd3MgYmFzZWQgb24gdGhlIHRhYmxlJ3MgbGF0ZXN0IHNldCBvZiBkYXRhLCB3aGljaCB3YXMgZWl0aGVyIHByb3ZpZGVkIGRpcmVjdGx5IGFzIGFuXG4gICAqIGlucHV0IG9yIHJldHJpZXZlZCB0aHJvdWdoIGFuIE9ic2VydmFibGUgc3RyZWFtIChkaXJlY3RseSBvciBmcm9tIGEgRGF0YVNvdXJjZSkuXG4gICAqIENoZWNrcyBmb3IgZGlmZmVyZW5jZXMgaW4gdGhlIGRhdGEgc2luY2UgdGhlIGxhc3QgZGlmZiB0byBwZXJmb3JtIG9ubHkgdGhlIG5lY2Vzc2FyeVxuICAgKiBjaGFuZ2VzIChhZGQvcmVtb3ZlL21vdmUgcm93cykuXG4gICAqXG4gICAqIElmIHRoZSB0YWJsZSdzIGRhdGEgc291cmNlIGlzIGEgRGF0YVNvdXJjZSBvciBPYnNlcnZhYmxlLCB0aGlzIHdpbGwgYmUgaW52b2tlZCBhdXRvbWF0aWNhbGx5XG4gICAqIGVhY2ggdGltZSB0aGUgcHJvdmlkZWQgT2JzZXJ2YWJsZSBzdHJlYW0gZW1pdHMgYSBuZXcgZGF0YSBhcnJheS4gT3RoZXJ3aXNlIGlmIHlvdXIgZGF0YSBpc1xuICAgKiBhbiBhcnJheSwgdGhpcyBmdW5jdGlvbiB3aWxsIG5lZWQgdG8gYmUgY2FsbGVkIHRvIHJlbmRlciBhbnkgY2hhbmdlcy5cbiAgICovXG4gIHJlbmRlclJvd3MoKSB7XG4gICAgdGhpcy5fcmVuZGVyUm93cyA9IHRoaXMuX2dldEFsbFJlbmRlclJvd3MoKTtcbiAgICBjb25zdCBjaGFuZ2VzID0gdGhpcy5fZGF0YURpZmZlci5kaWZmKHRoaXMuX3JlbmRlclJvd3MpO1xuICAgIGlmICghY2hhbmdlcykge1xuICAgICAgdGhpcy5fdXBkYXRlTm9EYXRhUm93KCk7XG4gICAgICB0aGlzLmNvbnRlbnRDaGFuZ2VkLm5leHQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgdmlld0NvbnRhaW5lciA9IHRoaXMuX3Jvd091dGxldC52aWV3Q29udGFpbmVyO1xuXG4gICAgdGhpcy5fdmlld1JlcGVhdGVyLmFwcGx5Q2hhbmdlcyhcbiAgICAgIGNoYW5nZXMsXG4gICAgICB2aWV3Q29udGFpbmVyLFxuICAgICAgKFxuICAgICAgICByZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFJlbmRlclJvdzxUPj4sXG4gICAgICAgIF9hZGp1c3RlZFByZXZpb3VzSW5kZXg6IG51bWJlciB8IG51bGwsXG4gICAgICAgIGN1cnJlbnRJbmRleDogbnVtYmVyIHwgbnVsbCxcbiAgICAgICkgPT4gdGhpcy5fZ2V0RW1iZWRkZWRWaWV3QXJncyhyZWNvcmQuaXRlbSwgY3VycmVudEluZGV4ISksXG4gICAgICByZWNvcmQgPT4gcmVjb3JkLml0ZW0uZGF0YSxcbiAgICAgIChjaGFuZ2U6IF9WaWV3UmVwZWF0ZXJJdGVtQ2hhbmdlPFJlbmRlclJvdzxUPiwgUm93Q29udGV4dDxUPj4pID0+IHtcbiAgICAgICAgaWYgKGNoYW5nZS5vcGVyYXRpb24gPT09IF9WaWV3UmVwZWF0ZXJPcGVyYXRpb24uSU5TRVJURUQgJiYgY2hhbmdlLmNvbnRleHQpIHtcbiAgICAgICAgICB0aGlzLl9yZW5kZXJDZWxsVGVtcGxhdGVGb3JJdGVtKGNoYW5nZS5yZWNvcmQuaXRlbS5yb3dEZWYsIGNoYW5nZS5jb250ZXh0KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICApO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBtZXRhIGNvbnRleHQgb2YgYSByb3cncyBjb250ZXh0IGRhdGEgKGluZGV4LCBjb3VudCwgZmlyc3QsIGxhc3QsIC4uLilcbiAgICB0aGlzLl91cGRhdGVSb3dJbmRleENvbnRleHQoKTtcblxuICAgIC8vIFVwZGF0ZSByb3dzIHRoYXQgZGlkIG5vdCBnZXQgYWRkZWQvcmVtb3ZlZC9tb3ZlZCBidXQgbWF5IGhhdmUgaGFkIHRoZWlyIGlkZW50aXR5IGNoYW5nZWQsXG4gICAgLy8gZS5nLiBpZiB0cmFja0J5IG1hdGNoZWQgZGF0YSBvbiBzb21lIHByb3BlcnR5IGJ1dCB0aGUgYWN0dWFsIGRhdGEgcmVmZXJlbmNlIGNoYW5nZWQuXG4gICAgY2hhbmdlcy5mb3JFYWNoSWRlbnRpdHlDaGFuZ2UoKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8UmVuZGVyUm93PFQ+PikgPT4ge1xuICAgICAgY29uc3Qgcm93VmlldyA9IDxSb3dWaWV3UmVmPFQ+PnZpZXdDb250YWluZXIuZ2V0KHJlY29yZC5jdXJyZW50SW5kZXghKTtcbiAgICAgIHJvd1ZpZXcuY29udGV4dC4kaW1wbGljaXQgPSByZWNvcmQuaXRlbS5kYXRhO1xuICAgIH0pO1xuXG4gICAgdGhpcy5fdXBkYXRlTm9EYXRhUm93KCk7XG5cbiAgICAvLyBBbGxvdyB0aGUgbmV3IHJvdyBkYXRhIHRvIHJlbmRlciBiZWZvcmUgbWVhc3VyaW5nIGl0LlxuICAgIC8vIEBicmVha2luZy1jaGFuZ2UgMTQuMC4wIFJlbW92ZSB1bmRlZmluZWQgY2hlY2sgb25jZSBfbmdab25lIGlzIHJlcXVpcmVkLlxuICAgIGlmICh0aGlzLl9uZ1pvbmUgJiYgTmdab25lLmlzSW5Bbmd1bGFyWm9uZSgpKSB7XG4gICAgICB0aGlzLl9uZ1pvbmUub25TdGFibGUucGlwZSh0YWtlKDEpLCB0YWtlVW50aWwodGhpcy5fb25EZXN0cm95KSkuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgdGhpcy51cGRhdGVTdGlja3lDb2x1bW5TdHlsZXMoKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnVwZGF0ZVN0aWNreUNvbHVtblN0eWxlcygpO1xuICAgIH1cblxuICAgIHRoaXMuY29udGVudENoYW5nZWQubmV4dCgpO1xuICB9XG5cbiAgLyoqIEFkZHMgYSBjb2x1bW4gZGVmaW5pdGlvbiB0aGF0IHdhcyBub3QgaW5jbHVkZWQgYXMgcGFydCBvZiB0aGUgY29udGVudCBjaGlsZHJlbi4gKi9cbiAgYWRkQ29sdW1uRGVmKGNvbHVtbkRlZjogQ2RrQ29sdW1uRGVmKSB7XG4gICAgdGhpcy5fY3VzdG9tQ29sdW1uRGVmcy5hZGQoY29sdW1uRGVmKTtcbiAgfVxuXG4gIC8qKiBSZW1vdmVzIGEgY29sdW1uIGRlZmluaXRpb24gdGhhdCB3YXMgbm90IGluY2x1ZGVkIGFzIHBhcnQgb2YgdGhlIGNvbnRlbnQgY2hpbGRyZW4uICovXG4gIHJlbW92ZUNvbHVtbkRlZihjb2x1bW5EZWY6IENka0NvbHVtbkRlZikge1xuICAgIHRoaXMuX2N1c3RvbUNvbHVtbkRlZnMuZGVsZXRlKGNvbHVtbkRlZik7XG4gIH1cblxuICAvKiogQWRkcyBhIHJvdyBkZWZpbml0aW9uIHRoYXQgd2FzIG5vdCBpbmNsdWRlZCBhcyBwYXJ0IG9mIHRoZSBjb250ZW50IGNoaWxkcmVuLiAqL1xuICBhZGRSb3dEZWYocm93RGVmOiBDZGtSb3dEZWY8VD4pIHtcbiAgICB0aGlzLl9jdXN0b21Sb3dEZWZzLmFkZChyb3dEZWYpO1xuICB9XG5cbiAgLyoqIFJlbW92ZXMgYSByb3cgZGVmaW5pdGlvbiB0aGF0IHdhcyBub3QgaW5jbHVkZWQgYXMgcGFydCBvZiB0aGUgY29udGVudCBjaGlsZHJlbi4gKi9cbiAgcmVtb3ZlUm93RGVmKHJvd0RlZjogQ2RrUm93RGVmPFQ+KSB7XG4gICAgdGhpcy5fY3VzdG9tUm93RGVmcy5kZWxldGUocm93RGVmKTtcbiAgfVxuXG4gIC8qKiBBZGRzIGEgaGVhZGVyIHJvdyBkZWZpbml0aW9uIHRoYXQgd2FzIG5vdCBpbmNsdWRlZCBhcyBwYXJ0IG9mIHRoZSBjb250ZW50IGNoaWxkcmVuLiAqL1xuICBhZGRIZWFkZXJSb3dEZWYoaGVhZGVyUm93RGVmOiBDZGtIZWFkZXJSb3dEZWYpIHtcbiAgICB0aGlzLl9jdXN0b21IZWFkZXJSb3dEZWZzLmFkZChoZWFkZXJSb3dEZWYpO1xuICAgIHRoaXMuX2hlYWRlclJvd0RlZkNoYW5nZWQgPSB0cnVlO1xuICB9XG5cbiAgLyoqIFJlbW92ZXMgYSBoZWFkZXIgcm93IGRlZmluaXRpb24gdGhhdCB3YXMgbm90IGluY2x1ZGVkIGFzIHBhcnQgb2YgdGhlIGNvbnRlbnQgY2hpbGRyZW4uICovXG4gIHJlbW92ZUhlYWRlclJvd0RlZihoZWFkZXJSb3dEZWY6IENka0hlYWRlclJvd0RlZikge1xuICAgIHRoaXMuX2N1c3RvbUhlYWRlclJvd0RlZnMuZGVsZXRlKGhlYWRlclJvd0RlZik7XG4gICAgdGhpcy5faGVhZGVyUm93RGVmQ2hhbmdlZCA9IHRydWU7XG4gIH1cblxuICAvKiogQWRkcyBhIGZvb3RlciByb3cgZGVmaW5pdGlvbiB0aGF0IHdhcyBub3QgaW5jbHVkZWQgYXMgcGFydCBvZiB0aGUgY29udGVudCBjaGlsZHJlbi4gKi9cbiAgYWRkRm9vdGVyUm93RGVmKGZvb3RlclJvd0RlZjogQ2RrRm9vdGVyUm93RGVmKSB7XG4gICAgdGhpcy5fY3VzdG9tRm9vdGVyUm93RGVmcy5hZGQoZm9vdGVyUm93RGVmKTtcbiAgICB0aGlzLl9mb290ZXJSb3dEZWZDaGFuZ2VkID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKiBSZW1vdmVzIGEgZm9vdGVyIHJvdyBkZWZpbml0aW9uIHRoYXQgd2FzIG5vdCBpbmNsdWRlZCBhcyBwYXJ0IG9mIHRoZSBjb250ZW50IGNoaWxkcmVuLiAqL1xuICByZW1vdmVGb290ZXJSb3dEZWYoZm9vdGVyUm93RGVmOiBDZGtGb290ZXJSb3dEZWYpIHtcbiAgICB0aGlzLl9jdXN0b21Gb290ZXJSb3dEZWZzLmRlbGV0ZShmb290ZXJSb3dEZWYpO1xuICAgIHRoaXMuX2Zvb3RlclJvd0RlZkNoYW5nZWQgPSB0cnVlO1xuICB9XG5cbiAgLyoqIFNldHMgYSBubyBkYXRhIHJvdyBkZWZpbml0aW9uIHRoYXQgd2FzIG5vdCBpbmNsdWRlZCBhcyBhIHBhcnQgb2YgdGhlIGNvbnRlbnQgY2hpbGRyZW4uICovXG4gIHNldE5vRGF0YVJvdyhub0RhdGFSb3c6IENka05vRGF0YVJvdyB8IG51bGwpIHtcbiAgICB0aGlzLl9jdXN0b21Ob0RhdGFSb3cgPSBub0RhdGFSb3c7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgaGVhZGVyIHN0aWNreSBzdHlsZXMuIEZpcnN0IHJlc2V0cyBhbGwgYXBwbGllZCBzdHlsZXMgd2l0aCByZXNwZWN0IHRvIHRoZSBjZWxsc1xuICAgKiBzdGlja2luZyB0byB0aGUgdG9wLiBUaGVuLCBldmFsdWF0aW5nIHdoaWNoIGNlbGxzIG5lZWQgdG8gYmUgc3R1Y2sgdG8gdGhlIHRvcC4gVGhpcyBpc1xuICAgKiBhdXRvbWF0aWNhbGx5IGNhbGxlZCB3aGVuIHRoZSBoZWFkZXIgcm93IGNoYW5nZXMgaXRzIGRpc3BsYXllZCBzZXQgb2YgY29sdW1ucywgb3IgaWYgaXRzXG4gICAqIHN0aWNreSBpbnB1dCBjaGFuZ2VzLiBNYXkgYmUgY2FsbGVkIG1hbnVhbGx5IGZvciBjYXNlcyB3aGVyZSB0aGUgY2VsbCBjb250ZW50IGNoYW5nZXMgb3V0c2lkZVxuICAgKiBvZiB0aGVzZSBldmVudHMuXG4gICAqL1xuICB1cGRhdGVTdGlja3lIZWFkZXJSb3dTdHlsZXMoKTogdm9pZCB7XG4gICAgY29uc3QgaGVhZGVyUm93cyA9IHRoaXMuX2dldFJlbmRlcmVkUm93cyh0aGlzLl9oZWFkZXJSb3dPdXRsZXQpO1xuXG4gICAgLy8gSGlkZSB0aGUgdGhlYWQgZWxlbWVudCBpZiB0aGVyZSBhcmUgbm8gaGVhZGVyIHJvd3MuIFRoaXMgaXMgbmVjZXNzYXJ5IHRvIHNhdGlzZnlcbiAgICAvLyBvdmVyemVhbG91cyBhMTF5IGNoZWNrZXJzIHRoYXQgZmFpbCBiZWNhdXNlIHRoZSBgcm93Z3JvdXBgIGVsZW1lbnQgZG9lcyBub3QgY29udGFpblxuICAgIC8vIHJlcXVpcmVkIGNoaWxkIGByb3dgLlxuICAgIGlmICh0aGlzLl9pc05hdGl2ZUh0bWxUYWJsZSkge1xuICAgICAgY29uc3QgdGhlYWQgPSBjbG9zZXN0VGFibGVTZWN0aW9uKHRoaXMuX2hlYWRlclJvd091dGxldCwgJ3RoZWFkJyk7XG4gICAgICBpZiAodGhlYWQpIHtcbiAgICAgICAgdGhlYWQuc3R5bGUuZGlzcGxheSA9IGhlYWRlclJvd3MubGVuZ3RoID8gJycgOiAnbm9uZSc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3Qgc3RpY2t5U3RhdGVzID0gdGhpcy5faGVhZGVyUm93RGVmcy5tYXAoZGVmID0+IGRlZi5zdGlja3kpO1xuICAgIHRoaXMuX3N0aWNreVN0eWxlci5jbGVhclN0aWNreVBvc2l0aW9uaW5nKGhlYWRlclJvd3MsIFsndG9wJ10pO1xuICAgIHRoaXMuX3N0aWNreVN0eWxlci5zdGlja1Jvd3MoaGVhZGVyUm93cywgc3RpY2t5U3RhdGVzLCAndG9wJyk7XG5cbiAgICAvLyBSZXNldCB0aGUgZGlydHkgc3RhdGUgb2YgdGhlIHN0aWNreSBpbnB1dCBjaGFuZ2Ugc2luY2UgaXQgaGFzIGJlZW4gdXNlZC5cbiAgICB0aGlzLl9oZWFkZXJSb3dEZWZzLmZvckVhY2goZGVmID0+IGRlZi5yZXNldFN0aWNreUNoYW5nZWQoKSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgZm9vdGVyIHN0aWNreSBzdHlsZXMuIEZpcnN0IHJlc2V0cyBhbGwgYXBwbGllZCBzdHlsZXMgd2l0aCByZXNwZWN0IHRvIHRoZSBjZWxsc1xuICAgKiBzdGlja2luZyB0byB0aGUgYm90dG9tLiBUaGVuLCBldmFsdWF0aW5nIHdoaWNoIGNlbGxzIG5lZWQgdG8gYmUgc3R1Y2sgdG8gdGhlIGJvdHRvbS4gVGhpcyBpc1xuICAgKiBhdXRvbWF0aWNhbGx5IGNhbGxlZCB3aGVuIHRoZSBmb290ZXIgcm93IGNoYW5nZXMgaXRzIGRpc3BsYXllZCBzZXQgb2YgY29sdW1ucywgb3IgaWYgaXRzXG4gICAqIHN0aWNreSBpbnB1dCBjaGFuZ2VzLiBNYXkgYmUgY2FsbGVkIG1hbnVhbGx5IGZvciBjYXNlcyB3aGVyZSB0aGUgY2VsbCBjb250ZW50IGNoYW5nZXMgb3V0c2lkZVxuICAgKiBvZiB0aGVzZSBldmVudHMuXG4gICAqL1xuICB1cGRhdGVTdGlja3lGb290ZXJSb3dTdHlsZXMoKTogdm9pZCB7XG4gICAgY29uc3QgZm9vdGVyUm93cyA9IHRoaXMuX2dldFJlbmRlcmVkUm93cyh0aGlzLl9mb290ZXJSb3dPdXRsZXQpO1xuXG4gICAgLy8gSGlkZSB0aGUgdGZvb3QgZWxlbWVudCBpZiB0aGVyZSBhcmUgbm8gZm9vdGVyIHJvd3MuIFRoaXMgaXMgbmVjZXNzYXJ5IHRvIHNhdGlzZnlcbiAgICAvLyBvdmVyemVhbG91cyBhMTF5IGNoZWNrZXJzIHRoYXQgZmFpbCBiZWNhdXNlIHRoZSBgcm93Z3JvdXBgIGVsZW1lbnQgZG9lcyBub3QgY29udGFpblxuICAgIC8vIHJlcXVpcmVkIGNoaWxkIGByb3dgLlxuICAgIGlmICh0aGlzLl9pc05hdGl2ZUh0bWxUYWJsZSkge1xuICAgICAgY29uc3QgdGZvb3QgPSBjbG9zZXN0VGFibGVTZWN0aW9uKHRoaXMuX2Zvb3RlclJvd091dGxldCwgJ3Rmb290Jyk7XG4gICAgICBpZiAodGZvb3QpIHtcbiAgICAgICAgdGZvb3Quc3R5bGUuZGlzcGxheSA9IGZvb3RlclJvd3MubGVuZ3RoID8gJycgOiAnbm9uZSc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3Qgc3RpY2t5U3RhdGVzID0gdGhpcy5fZm9vdGVyUm93RGVmcy5tYXAoZGVmID0+IGRlZi5zdGlja3kpO1xuICAgIHRoaXMuX3N0aWNreVN0eWxlci5jbGVhclN0aWNreVBvc2l0aW9uaW5nKGZvb3RlclJvd3MsIFsnYm90dG9tJ10pO1xuICAgIHRoaXMuX3N0aWNreVN0eWxlci5zdGlja1Jvd3MoZm9vdGVyUm93cywgc3RpY2t5U3RhdGVzLCAnYm90dG9tJyk7XG4gICAgdGhpcy5fc3RpY2t5U3R5bGVyLnVwZGF0ZVN0aWNreUZvb3RlckNvbnRhaW5lcih0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsIHN0aWNreVN0YXRlcyk7XG5cbiAgICAvLyBSZXNldCB0aGUgZGlydHkgc3RhdGUgb2YgdGhlIHN0aWNreSBpbnB1dCBjaGFuZ2Ugc2luY2UgaXQgaGFzIGJlZW4gdXNlZC5cbiAgICB0aGlzLl9mb290ZXJSb3dEZWZzLmZvckVhY2goZGVmID0+IGRlZi5yZXNldFN0aWNreUNoYW5nZWQoKSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgY29sdW1uIHN0aWNreSBzdHlsZXMuIEZpcnN0IHJlc2V0cyBhbGwgYXBwbGllZCBzdHlsZXMgd2l0aCByZXNwZWN0IHRvIHRoZSBjZWxsc1xuICAgKiBzdGlja2luZyB0byB0aGUgbGVmdCBhbmQgcmlnaHQuIFRoZW4gc3RpY2t5IHN0eWxlcyBhcmUgYWRkZWQgZm9yIHRoZSBsZWZ0IGFuZCByaWdodCBhY2NvcmRpbmdcbiAgICogdG8gdGhlIGNvbHVtbiBkZWZpbml0aW9ucyBmb3IgZWFjaCBjZWxsIGluIGVhY2ggcm93LiBUaGlzIGlzIGF1dG9tYXRpY2FsbHkgY2FsbGVkIHdoZW5cbiAgICogdGhlIGRhdGEgc291cmNlIHByb3ZpZGVzIGEgbmV3IHNldCBvZiBkYXRhIG9yIHdoZW4gYSBjb2x1bW4gZGVmaW5pdGlvbiBjaGFuZ2VzIGl0cyBzdGlja3lcbiAgICogaW5wdXQuIE1heSBiZSBjYWxsZWQgbWFudWFsbHkgZm9yIGNhc2VzIHdoZXJlIHRoZSBjZWxsIGNvbnRlbnQgY2hhbmdlcyBvdXRzaWRlIG9mIHRoZXNlIGV2ZW50cy5cbiAgICovXG4gIHVwZGF0ZVN0aWNreUNvbHVtblN0eWxlcygpIHtcbiAgICBjb25zdCBoZWFkZXJSb3dzID0gdGhpcy5fZ2V0UmVuZGVyZWRSb3dzKHRoaXMuX2hlYWRlclJvd091dGxldCk7XG4gICAgY29uc3QgZGF0YVJvd3MgPSB0aGlzLl9nZXRSZW5kZXJlZFJvd3ModGhpcy5fcm93T3V0bGV0KTtcbiAgICBjb25zdCBmb290ZXJSb3dzID0gdGhpcy5fZ2V0UmVuZGVyZWRSb3dzKHRoaXMuX2Zvb3RlclJvd091dGxldCk7XG5cbiAgICAvLyBGb3IgdGFibGVzIG5vdCB1c2luZyBhIGZpeGVkIGxheW91dCwgdGhlIGNvbHVtbiB3aWR0aHMgbWF5IGNoYW5nZSB3aGVuIG5ldyByb3dzIGFyZSByZW5kZXJlZC5cbiAgICAvLyBJbiBhIHRhYmxlIHVzaW5nIGEgZml4ZWQgbGF5b3V0LCByb3cgY29udGVudCB3b24ndCBhZmZlY3QgY29sdW1uIHdpZHRoLCBzbyBzdGlja3kgc3R5bGVzXG4gICAgLy8gZG9uJ3QgbmVlZCB0byBiZSBjbGVhcmVkIHVubGVzcyBlaXRoZXIgdGhlIHN0aWNreSBjb2x1bW4gY29uZmlnIGNoYW5nZXMgb3Igb25lIG9mIHRoZSByb3dcbiAgICAvLyBkZWZzIGNoYW5nZS5cbiAgICBpZiAoKHRoaXMuX2lzTmF0aXZlSHRtbFRhYmxlICYmICF0aGlzLl9maXhlZExheW91dCkgfHwgdGhpcy5fc3RpY2t5Q29sdW1uU3R5bGVzTmVlZFJlc2V0KSB7XG4gICAgICAvLyBDbGVhciB0aGUgbGVmdCBhbmQgcmlnaHQgcG9zaXRpb25pbmcgZnJvbSBhbGwgY29sdW1ucyBpbiB0aGUgdGFibGUgYWNyb3NzIGFsbCByb3dzIHNpbmNlXG4gICAgICAvLyBzdGlja3kgY29sdW1ucyBzcGFuIGFjcm9zcyBhbGwgdGFibGUgc2VjdGlvbnMgKGhlYWRlciwgZGF0YSwgZm9vdGVyKVxuICAgICAgdGhpcy5fc3RpY2t5U3R5bGVyLmNsZWFyU3RpY2t5UG9zaXRpb25pbmcoXG4gICAgICAgIFsuLi5oZWFkZXJSb3dzLCAuLi5kYXRhUm93cywgLi4uZm9vdGVyUm93c10sXG4gICAgICAgIFsnbGVmdCcsICdyaWdodCddLFxuICAgICAgKTtcbiAgICAgIHRoaXMuX3N0aWNreUNvbHVtblN0eWxlc05lZWRSZXNldCA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZSB0aGUgc3RpY2t5IHN0eWxlcyBmb3IgZWFjaCBoZWFkZXIgcm93IGRlcGVuZGluZyBvbiB0aGUgZGVmJ3Mgc3RpY2t5IHN0YXRlXG4gICAgaGVhZGVyUm93cy5mb3JFYWNoKChoZWFkZXJSb3csIGkpID0+IHtcbiAgICAgIHRoaXMuX2FkZFN0aWNreUNvbHVtblN0eWxlcyhbaGVhZGVyUm93XSwgdGhpcy5faGVhZGVyUm93RGVmc1tpXSk7XG4gICAgfSk7XG5cbiAgICAvLyBVcGRhdGUgdGhlIHN0aWNreSBzdHlsZXMgZm9yIGVhY2ggZGF0YSByb3cgZGVwZW5kaW5nIG9uIGl0cyBkZWYncyBzdGlja3kgc3RhdGVcbiAgICB0aGlzLl9yb3dEZWZzLmZvckVhY2gocm93RGVmID0+IHtcbiAgICAgIC8vIENvbGxlY3QgYWxsIHRoZSByb3dzIHJlbmRlcmVkIHdpdGggdGhpcyByb3cgZGVmaW5pdGlvbi5cbiAgICAgIGNvbnN0IHJvd3M6IEhUTUxFbGVtZW50W10gPSBbXTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YVJvd3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHRoaXMuX3JlbmRlclJvd3NbaV0ucm93RGVmID09PSByb3dEZWYpIHtcbiAgICAgICAgICByb3dzLnB1c2goZGF0YVJvd3NbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2FkZFN0aWNreUNvbHVtblN0eWxlcyhyb3dzLCByb3dEZWYpO1xuICAgIH0pO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBzdGlja3kgc3R5bGVzIGZvciBlYWNoIGZvb3RlciByb3cgZGVwZW5kaW5nIG9uIHRoZSBkZWYncyBzdGlja3kgc3RhdGVcbiAgICBmb290ZXJSb3dzLmZvckVhY2goKGZvb3RlclJvdywgaSkgPT4ge1xuICAgICAgdGhpcy5fYWRkU3RpY2t5Q29sdW1uU3R5bGVzKFtmb290ZXJSb3ddLCB0aGlzLl9mb290ZXJSb3dEZWZzW2ldKTtcbiAgICB9KTtcblxuICAgIC8vIFJlc2V0IHRoZSBkaXJ0eSBzdGF0ZSBvZiB0aGUgc3RpY2t5IGlucHV0IGNoYW5nZSBzaW5jZSBpdCBoYXMgYmVlbiB1c2VkLlxuICAgIEFycmF5LmZyb20odGhpcy5fY29sdW1uRGVmc0J5TmFtZS52YWx1ZXMoKSkuZm9yRWFjaChkZWYgPT4gZGVmLnJlc2V0U3RpY2t5Q2hhbmdlZCgpKTtcbiAgfVxuXG4gIC8qKiBJbnZva2VkIHdoZW5ldmVyIGFuIG91dGxldCBpcyBjcmVhdGVkIGFuZCBoYXMgYmVlbiBhc3NpZ25lZCB0byB0aGUgdGFibGUuICovXG4gIF9vdXRsZXRBc3NpZ25lZCgpOiB2b2lkIHtcbiAgICAvLyBUcmlnZ2VyIHRoZSBmaXJzdCByZW5kZXIgb25jZSBhbGwgb3V0bGV0cyBoYXZlIGJlZW4gYXNzaWduZWQuIFdlIGRvIGl0IHRoaXMgd2F5LCBhc1xuICAgIC8vIG9wcG9zZWQgdG8gd2FpdGluZyBmb3IgdGhlIG5leHQgYG5nQWZ0ZXJDb250ZW50Q2hlY2tlZGAsIGJlY2F1c2Ugd2UgZG9uJ3Qga25vdyB3aGVuXG4gICAgLy8gdGhlIG5leHQgY2hhbmdlIGRldGVjdGlvbiB3aWxsIGhhcHBlbi5cbiAgICAvLyBBbHNvIHdlIGNhbid0IHVzZSBxdWVyaWVzIHRvIHJlc29sdmUgdGhlIG91dGxldHMsIGJlY2F1c2UgdGhleSdyZSB3cmFwcGVkIGluIGFcbiAgICAvLyBjb25kaXRpb25hbCwgc28gd2UgaGF2ZSB0byByZWx5IG9uIHRoZW0gYmVpbmcgYXNzaWduZWQgdmlhIERJLlxuICAgIGlmIChcbiAgICAgICF0aGlzLl9oYXNSZW5kZXJlZCAmJlxuICAgICAgdGhpcy5fcm93T3V0bGV0ICYmXG4gICAgICB0aGlzLl9oZWFkZXJSb3dPdXRsZXQgJiZcbiAgICAgIHRoaXMuX2Zvb3RlclJvd091dGxldCAmJlxuICAgICAgdGhpcy5fbm9EYXRhUm93T3V0bGV0XG4gICAgKSB7XG4gICAgICB0aGlzLl9oYXNSZW5kZXJlZCA9IHRydWU7XG4gICAgICB0aGlzLl9yZW5kZXIoKTtcbiAgICB9XG4gIH1cblxuICAvKiogUmVuZGVycyB0aGUgdGFibGUgaWYgaXRzIHN0YXRlIGhhcyBjaGFuZ2VkLiAqL1xuICBwcml2YXRlIF9yZW5kZXIoKTogdm9pZCB7XG4gICAgLy8gQ2FjaGUgdGhlIHJvdyBhbmQgY29sdW1uIGRlZmluaXRpb25zIGdhdGhlcmVkIGJ5IENvbnRlbnRDaGlsZHJlbiBhbmQgcHJvZ3JhbW1hdGljIGluamVjdGlvbi5cbiAgICB0aGlzLl9jYWNoZVJvd0RlZnMoKTtcbiAgICB0aGlzLl9jYWNoZUNvbHVtbkRlZnMoKTtcblxuICAgIC8vIE1ha2Ugc3VyZSB0aGF0IHRoZSB1c2VyIGhhcyBhdCBsZWFzdCBhZGRlZCBoZWFkZXIsIGZvb3Rlciwgb3IgZGF0YSByb3cgZGVmLlxuICAgIGlmIChcbiAgICAgICF0aGlzLl9oZWFkZXJSb3dEZWZzLmxlbmd0aCAmJlxuICAgICAgIXRoaXMuX2Zvb3RlclJvd0RlZnMubGVuZ3RoICYmXG4gICAgICAhdGhpcy5fcm93RGVmcy5sZW5ndGggJiZcbiAgICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpXG4gICAgKSB7XG4gICAgICB0aHJvdyBnZXRUYWJsZU1pc3NpbmdSb3dEZWZzRXJyb3IoKTtcbiAgICB9XG5cbiAgICAvLyBSZW5kZXIgdXBkYXRlcyBpZiB0aGUgbGlzdCBvZiBjb2x1bW5zIGhhdmUgYmVlbiBjaGFuZ2VkIGZvciB0aGUgaGVhZGVyLCByb3csIG9yIGZvb3RlciBkZWZzLlxuICAgIGNvbnN0IGNvbHVtbnNDaGFuZ2VkID0gdGhpcy5fcmVuZGVyVXBkYXRlZENvbHVtbnMoKTtcbiAgICBjb25zdCByb3dEZWZzQ2hhbmdlZCA9IGNvbHVtbnNDaGFuZ2VkIHx8IHRoaXMuX2hlYWRlclJvd0RlZkNoYW5nZWQgfHwgdGhpcy5fZm9vdGVyUm93RGVmQ2hhbmdlZDtcbiAgICAvLyBFbnN1cmUgc3RpY2t5IGNvbHVtbiBzdHlsZXMgYXJlIHJlc2V0IGlmIHNldCB0byBgdHJ1ZWAgZWxzZXdoZXJlLlxuICAgIHRoaXMuX3N0aWNreUNvbHVtblN0eWxlc05lZWRSZXNldCA9IHRoaXMuX3N0aWNreUNvbHVtblN0eWxlc05lZWRSZXNldCB8fCByb3dEZWZzQ2hhbmdlZDtcbiAgICB0aGlzLl9mb3JjZVJlY2FsY3VsYXRlQ2VsbFdpZHRocyA9IHJvd0RlZnNDaGFuZ2VkO1xuXG4gICAgLy8gSWYgdGhlIGhlYWRlciByb3cgZGVmaW5pdGlvbiBoYXMgYmVlbiBjaGFuZ2VkLCB0cmlnZ2VyIGEgcmVuZGVyIHRvIHRoZSBoZWFkZXIgcm93LlxuICAgIGlmICh0aGlzLl9oZWFkZXJSb3dEZWZDaGFuZ2VkKSB7XG4gICAgICB0aGlzLl9mb3JjZVJlbmRlckhlYWRlclJvd3MoKTtcbiAgICAgIHRoaXMuX2hlYWRlclJvd0RlZkNoYW5nZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgZm9vdGVyIHJvdyBkZWZpbml0aW9uIGhhcyBiZWVuIGNoYW5nZWQsIHRyaWdnZXIgYSByZW5kZXIgdG8gdGhlIGZvb3RlciByb3cuXG4gICAgaWYgKHRoaXMuX2Zvb3RlclJvd0RlZkNoYW5nZWQpIHtcbiAgICAgIHRoaXMuX2ZvcmNlUmVuZGVyRm9vdGVyUm93cygpO1xuICAgICAgdGhpcy5fZm9vdGVyUm93RGVmQ2hhbmdlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8vIElmIHRoZXJlIGlzIGEgZGF0YSBzb3VyY2UgYW5kIHJvdyBkZWZpbml0aW9ucywgY29ubmVjdCB0byB0aGUgZGF0YSBzb3VyY2UgdW5sZXNzIGFcbiAgICAvLyBjb25uZWN0aW9uIGhhcyBhbHJlYWR5IGJlZW4gbWFkZS5cbiAgICBpZiAodGhpcy5kYXRhU291cmNlICYmIHRoaXMuX3Jvd0RlZnMubGVuZ3RoID4gMCAmJiAhdGhpcy5fcmVuZGVyQ2hhbmdlU3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aGlzLl9vYnNlcnZlUmVuZGVyQ2hhbmdlcygpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fc3RpY2t5Q29sdW1uU3R5bGVzTmVlZFJlc2V0KSB7XG4gICAgICAvLyBJbiB0aGUgYWJvdmUgY2FzZSwgX29ic2VydmVSZW5kZXJDaGFuZ2VzIHdpbGwgcmVzdWx0IGluIHVwZGF0ZVN0aWNreUNvbHVtblN0eWxlcyBiZWluZ1xuICAgICAgLy8gY2FsbGVkIHdoZW4gaXQgcm93IGRhdGEgYXJyaXZlcy4gT3RoZXJ3aXNlLCB3ZSBuZWVkIHRvIGNhbGwgaXQgcHJvYWN0aXZlbHkuXG4gICAgICB0aGlzLnVwZGF0ZVN0aWNreUNvbHVtblN0eWxlcygpO1xuICAgIH1cblxuICAgIHRoaXMuX2NoZWNrU3RpY2t5U3RhdGVzKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBsaXN0IG9mIFJlbmRlclJvdyBvYmplY3RzIHRvIHJlbmRlciBhY2NvcmRpbmcgdG8gdGhlIGN1cnJlbnQgbGlzdCBvZiBkYXRhIGFuZCBkZWZpbmVkXG4gICAqIHJvdyBkZWZpbml0aW9ucy4gSWYgdGhlIHByZXZpb3VzIGxpc3QgYWxyZWFkeSBjb250YWluZWQgYSBwYXJ0aWN1bGFyIHBhaXIsIGl0IHNob3VsZCBiZSByZXVzZWRcbiAgICogc28gdGhhdCB0aGUgZGlmZmVyIGVxdWF0ZXMgdGhlaXIgcmVmZXJlbmNlcy5cbiAgICovXG4gIHByaXZhdGUgX2dldEFsbFJlbmRlclJvd3MoKTogUmVuZGVyUm93PFQ+W10ge1xuICAgIGNvbnN0IHJlbmRlclJvd3M6IFJlbmRlclJvdzxUPltdID0gW107XG5cbiAgICAvLyBTdG9yZSB0aGUgY2FjaGUgYW5kIGNyZWF0ZSBhIG5ldyBvbmUuIEFueSByZS11c2VkIFJlbmRlclJvdyBvYmplY3RzIHdpbGwgYmUgbW92ZWQgaW50byB0aGVcbiAgICAvLyBuZXcgY2FjaGUgd2hpbGUgdW51c2VkIG9uZXMgY2FuIGJlIHBpY2tlZCB1cCBieSBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgY29uc3QgcHJldkNhY2hlZFJlbmRlclJvd3MgPSB0aGlzLl9jYWNoZWRSZW5kZXJSb3dzTWFwO1xuICAgIHRoaXMuX2NhY2hlZFJlbmRlclJvd3NNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICAvLyBGb3IgZWFjaCBkYXRhIG9iamVjdCwgZ2V0IHRoZSBsaXN0IG9mIHJvd3MgdGhhdCBzaG91bGQgYmUgcmVuZGVyZWQsIHJlcHJlc2VudGVkIGJ5IHRoZVxuICAgIC8vIHJlc3BlY3RpdmUgYFJlbmRlclJvd2Agb2JqZWN0IHdoaWNoIGlzIHRoZSBwYWlyIG9mIGBkYXRhYCBhbmQgYENka1Jvd0RlZmAuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9kYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgZGF0YSA9IHRoaXMuX2RhdGFbaV07XG4gICAgICBjb25zdCByZW5kZXJSb3dzRm9yRGF0YSA9IHRoaXMuX2dldFJlbmRlclJvd3NGb3JEYXRhKGRhdGEsIGksIHByZXZDYWNoZWRSZW5kZXJSb3dzLmdldChkYXRhKSk7XG5cbiAgICAgIGlmICghdGhpcy5fY2FjaGVkUmVuZGVyUm93c01hcC5oYXMoZGF0YSkpIHtcbiAgICAgICAgdGhpcy5fY2FjaGVkUmVuZGVyUm93c01hcC5zZXQoZGF0YSwgbmV3IFdlYWtNYXAoKSk7XG4gICAgICB9XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcmVuZGVyUm93c0ZvckRhdGEubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgbGV0IHJlbmRlclJvdyA9IHJlbmRlclJvd3NGb3JEYXRhW2pdO1xuXG4gICAgICAgIGNvbnN0IGNhY2hlID0gdGhpcy5fY2FjaGVkUmVuZGVyUm93c01hcC5nZXQocmVuZGVyUm93LmRhdGEpITtcbiAgICAgICAgaWYgKGNhY2hlLmhhcyhyZW5kZXJSb3cucm93RGVmKSkge1xuICAgICAgICAgIGNhY2hlLmdldChyZW5kZXJSb3cucm93RGVmKSEucHVzaChyZW5kZXJSb3cpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNhY2hlLnNldChyZW5kZXJSb3cucm93RGVmLCBbcmVuZGVyUm93XSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVuZGVyUm93cy5wdXNoKHJlbmRlclJvdyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlbmRlclJvd3M7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIGxpc3Qgb2YgYFJlbmRlclJvdzxUPmAgZm9yIHRoZSBwcm92aWRlZCBkYXRhIG9iamVjdCBhbmQgYW55IGBDZGtSb3dEZWZgIG9iamVjdHMgdGhhdFxuICAgKiBzaG91bGQgYmUgcmVuZGVyZWQgZm9yIHRoaXMgZGF0YS4gUmV1c2VzIHRoZSBjYWNoZWQgUmVuZGVyUm93IG9iamVjdHMgaWYgdGhleSBtYXRjaCB0aGUgc2FtZVxuICAgKiBgKFQsIENka1Jvd0RlZilgIHBhaXIuXG4gICAqL1xuICBwcml2YXRlIF9nZXRSZW5kZXJSb3dzRm9yRGF0YShcbiAgICBkYXRhOiBULFxuICAgIGRhdGFJbmRleDogbnVtYmVyLFxuICAgIGNhY2hlPzogV2Vha01hcDxDZGtSb3dEZWY8VD4sIFJlbmRlclJvdzxUPltdPixcbiAgKTogUmVuZGVyUm93PFQ+W10ge1xuICAgIGNvbnN0IHJvd0RlZnMgPSB0aGlzLl9nZXRSb3dEZWZzKGRhdGEsIGRhdGFJbmRleCk7XG5cbiAgICByZXR1cm4gcm93RGVmcy5tYXAocm93RGVmID0+IHtcbiAgICAgIGNvbnN0IGNhY2hlZFJlbmRlclJvd3MgPSBjYWNoZSAmJiBjYWNoZS5oYXMocm93RGVmKSA/IGNhY2hlLmdldChyb3dEZWYpISA6IFtdO1xuICAgICAgaWYgKGNhY2hlZFJlbmRlclJvd3MubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IGRhdGFSb3cgPSBjYWNoZWRSZW5kZXJSb3dzLnNoaWZ0KCkhO1xuICAgICAgICBkYXRhUm93LmRhdGFJbmRleCA9IGRhdGFJbmRleDtcbiAgICAgICAgcmV0dXJuIGRhdGFSb3c7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ge2RhdGEsIHJvd0RlZiwgZGF0YUluZGV4fTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBVcGRhdGUgdGhlIG1hcCBjb250YWluaW5nIHRoZSBjb250ZW50J3MgY29sdW1uIGRlZmluaXRpb25zLiAqL1xuICBwcml2YXRlIF9jYWNoZUNvbHVtbkRlZnMoKSB7XG4gICAgdGhpcy5fY29sdW1uRGVmc0J5TmFtZS5jbGVhcigpO1xuXG4gICAgY29uc3QgY29sdW1uRGVmcyA9IG1lcmdlQXJyYXlBbmRTZXQoXG4gICAgICB0aGlzLl9nZXRPd25EZWZzKHRoaXMuX2NvbnRlbnRDb2x1bW5EZWZzKSxcbiAgICAgIHRoaXMuX2N1c3RvbUNvbHVtbkRlZnMsXG4gICAgKTtcbiAgICBjb2x1bW5EZWZzLmZvckVhY2goY29sdW1uRGVmID0+IHtcbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5fY29sdW1uRGVmc0J5TmFtZS5oYXMoY29sdW1uRGVmLm5hbWUpICYmXG4gICAgICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpXG4gICAgICApIHtcbiAgICAgICAgdGhyb3cgZ2V0VGFibGVEdXBsaWNhdGVDb2x1bW5OYW1lRXJyb3IoY29sdW1uRGVmLm5hbWUpO1xuICAgICAgfVxuICAgICAgdGhpcy5fY29sdW1uRGVmc0J5TmFtZS5zZXQoY29sdW1uRGVmLm5hbWUsIGNvbHVtbkRlZik7XG4gICAgfSk7XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSBsaXN0IG9mIGFsbCBhdmFpbGFibGUgcm93IGRlZmluaXRpb25zIHRoYXQgY2FuIGJlIHVzZWQuICovXG4gIHByaXZhdGUgX2NhY2hlUm93RGVmcygpIHtcbiAgICB0aGlzLl9oZWFkZXJSb3dEZWZzID0gbWVyZ2VBcnJheUFuZFNldChcbiAgICAgIHRoaXMuX2dldE93bkRlZnModGhpcy5fY29udGVudEhlYWRlclJvd0RlZnMpLFxuICAgICAgdGhpcy5fY3VzdG9tSGVhZGVyUm93RGVmcyxcbiAgICApO1xuICAgIHRoaXMuX2Zvb3RlclJvd0RlZnMgPSBtZXJnZUFycmF5QW5kU2V0KFxuICAgICAgdGhpcy5fZ2V0T3duRGVmcyh0aGlzLl9jb250ZW50Rm9vdGVyUm93RGVmcyksXG4gICAgICB0aGlzLl9jdXN0b21Gb290ZXJSb3dEZWZzLFxuICAgICk7XG4gICAgdGhpcy5fcm93RGVmcyA9IG1lcmdlQXJyYXlBbmRTZXQodGhpcy5fZ2V0T3duRGVmcyh0aGlzLl9jb250ZW50Um93RGVmcyksIHRoaXMuX2N1c3RvbVJvd0RlZnMpO1xuXG4gICAgLy8gQWZ0ZXIgYWxsIHJvdyBkZWZpbml0aW9ucyBhcmUgZGV0ZXJtaW5lZCwgZmluZCB0aGUgcm93IGRlZmluaXRpb24gdG8gYmUgY29uc2lkZXJlZCBkZWZhdWx0LlxuICAgIGNvbnN0IGRlZmF1bHRSb3dEZWZzID0gdGhpcy5fcm93RGVmcy5maWx0ZXIoZGVmID0+ICFkZWYud2hlbik7XG4gICAgaWYgKFxuICAgICAgIXRoaXMubXVsdGlUZW1wbGF0ZURhdGFSb3dzICYmXG4gICAgICBkZWZhdWx0Um93RGVmcy5sZW5ndGggPiAxICYmXG4gICAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKVxuICAgICkge1xuICAgICAgdGhyb3cgZ2V0VGFibGVNdWx0aXBsZURlZmF1bHRSb3dEZWZzRXJyb3IoKTtcbiAgICB9XG4gICAgdGhpcy5fZGVmYXVsdFJvd0RlZiA9IGRlZmF1bHRSb3dEZWZzWzBdO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHRoZSBoZWFkZXIsIGRhdGEsIG9yIGZvb3RlciByb3dzIGhhdmUgY2hhbmdlZCB3aGF0IGNvbHVtbnMgdGhleSB3YW50IHRvIGRpc3BsYXkgb3JcbiAgICogd2hldGhlciB0aGUgc3RpY2t5IHN0YXRlcyBoYXZlIGNoYW5nZWQgZm9yIHRoZSBoZWFkZXIgb3IgZm9vdGVyLiBJZiB0aGVyZSBpcyBhIGRpZmYsIHRoZW5cbiAgICogcmUtcmVuZGVyIHRoYXQgc2VjdGlvbi5cbiAgICovXG4gIHByaXZhdGUgX3JlbmRlclVwZGF0ZWRDb2x1bW5zKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGNvbHVtbnNEaWZmUmVkdWNlciA9IChhY2M6IGJvb2xlYW4sIGRlZjogQmFzZVJvd0RlZikgPT4gYWNjIHx8ICEhZGVmLmdldENvbHVtbnNEaWZmKCk7XG5cbiAgICAvLyBGb3JjZSByZS1yZW5kZXIgZGF0YSByb3dzIGlmIHRoZSBsaXN0IG9mIGNvbHVtbiBkZWZpbml0aW9ucyBoYXZlIGNoYW5nZWQuXG4gICAgY29uc3QgZGF0YUNvbHVtbnNDaGFuZ2VkID0gdGhpcy5fcm93RGVmcy5yZWR1Y2UoY29sdW1uc0RpZmZSZWR1Y2VyLCBmYWxzZSk7XG4gICAgaWYgKGRhdGFDb2x1bW5zQ2hhbmdlZCkge1xuICAgICAgdGhpcy5fZm9yY2VSZW5kZXJEYXRhUm93cygpO1xuICAgIH1cblxuICAgIC8vIEZvcmNlIHJlLXJlbmRlciBoZWFkZXIvZm9vdGVyIHJvd3MgaWYgdGhlIGxpc3Qgb2YgY29sdW1uIGRlZmluaXRpb25zIGhhdmUgY2hhbmdlZC5cbiAgICBjb25zdCBoZWFkZXJDb2x1bW5zQ2hhbmdlZCA9IHRoaXMuX2hlYWRlclJvd0RlZnMucmVkdWNlKGNvbHVtbnNEaWZmUmVkdWNlciwgZmFsc2UpO1xuICAgIGlmIChoZWFkZXJDb2x1bW5zQ2hhbmdlZCkge1xuICAgICAgdGhpcy5fZm9yY2VSZW5kZXJIZWFkZXJSb3dzKCk7XG4gICAgfVxuXG4gICAgY29uc3QgZm9vdGVyQ29sdW1uc0NoYW5nZWQgPSB0aGlzLl9mb290ZXJSb3dEZWZzLnJlZHVjZShjb2x1bW5zRGlmZlJlZHVjZXIsIGZhbHNlKTtcbiAgICBpZiAoZm9vdGVyQ29sdW1uc0NoYW5nZWQpIHtcbiAgICAgIHRoaXMuX2ZvcmNlUmVuZGVyRm9vdGVyUm93cygpO1xuICAgIH1cblxuICAgIHJldHVybiBkYXRhQ29sdW1uc0NoYW5nZWQgfHwgaGVhZGVyQ29sdW1uc0NoYW5nZWQgfHwgZm9vdGVyQ29sdW1uc0NoYW5nZWQ7XG4gIH1cblxuICAvKipcbiAgICogU3dpdGNoIHRvIHRoZSBwcm92aWRlZCBkYXRhIHNvdXJjZSBieSByZXNldHRpbmcgdGhlIGRhdGEgYW5kIHVuc3Vic2NyaWJpbmcgZnJvbSB0aGUgY3VycmVudFxuICAgKiByZW5kZXIgY2hhbmdlIHN1YnNjcmlwdGlvbiBpZiBvbmUgZXhpc3RzLiBJZiB0aGUgZGF0YSBzb3VyY2UgaXMgbnVsbCwgaW50ZXJwcmV0IHRoaXMgYnlcbiAgICogY2xlYXJpbmcgdGhlIHJvdyBvdXRsZXQuIE90aGVyd2lzZSBzdGFydCBsaXN0ZW5pbmcgZm9yIG5ldyBkYXRhLlxuICAgKi9cbiAgcHJpdmF0ZSBfc3dpdGNoRGF0YVNvdXJjZShkYXRhU291cmNlOiBDZGtUYWJsZURhdGFTb3VyY2VJbnB1dDxUPikge1xuICAgIHRoaXMuX2RhdGEgPSBbXTtcblxuICAgIGlmIChpc0RhdGFTb3VyY2UodGhpcy5kYXRhU291cmNlKSkge1xuICAgICAgdGhpcy5kYXRhU291cmNlLmRpc2Nvbm5lY3QodGhpcyk7XG4gICAgfVxuXG4gICAgLy8gU3RvcCBsaXN0ZW5pbmcgZm9yIGRhdGEgZnJvbSB0aGUgcHJldmlvdXMgZGF0YSBzb3VyY2UuXG4gICAgaWYgKHRoaXMuX3JlbmRlckNoYW5nZVN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fcmVuZGVyQ2hhbmdlU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLl9yZW5kZXJDaGFuZ2VTdWJzY3JpcHRpb24gPSBudWxsO1xuICAgIH1cblxuICAgIGlmICghZGF0YVNvdXJjZSkge1xuICAgICAgaWYgKHRoaXMuX2RhdGFEaWZmZXIpIHtcbiAgICAgICAgdGhpcy5fZGF0YURpZmZlci5kaWZmKFtdKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9yb3dPdXRsZXQpIHtcbiAgICAgICAgdGhpcy5fcm93T3V0bGV0LnZpZXdDb250YWluZXIuY2xlYXIoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9kYXRhU291cmNlID0gZGF0YVNvdXJjZTtcbiAgfVxuXG4gIC8qKiBTZXQgdXAgYSBzdWJzY3JpcHRpb24gZm9yIHRoZSBkYXRhIHByb3ZpZGVkIGJ5IHRoZSBkYXRhIHNvdXJjZS4gKi9cbiAgcHJpdmF0ZSBfb2JzZXJ2ZVJlbmRlckNoYW5nZXMoKSB7XG4gICAgLy8gSWYgbm8gZGF0YSBzb3VyY2UgaGFzIGJlZW4gc2V0LCB0aGVyZSBpcyBub3RoaW5nIHRvIG9ic2VydmUgZm9yIGNoYW5nZXMuXG4gICAgaWYgKCF0aGlzLmRhdGFTb3VyY2UpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgZGF0YVN0cmVhbTogT2JzZXJ2YWJsZTxyZWFkb25seSBUW10+IHwgdW5kZWZpbmVkO1xuXG4gICAgaWYgKGlzRGF0YVNvdXJjZSh0aGlzLmRhdGFTb3VyY2UpKSB7XG4gICAgICBkYXRhU3RyZWFtID0gdGhpcy5kYXRhU291cmNlLmNvbm5lY3QodGhpcyk7XG4gICAgfSBlbHNlIGlmIChpc09ic2VydmFibGUodGhpcy5kYXRhU291cmNlKSkge1xuICAgICAgZGF0YVN0cmVhbSA9IHRoaXMuZGF0YVNvdXJjZTtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5kYXRhU291cmNlKSkge1xuICAgICAgZGF0YVN0cmVhbSA9IG9ic2VydmFibGVPZih0aGlzLmRhdGFTb3VyY2UpO1xuICAgIH1cblxuICAgIGlmIChkYXRhU3RyZWFtID09PSB1bmRlZmluZWQgJiYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgIHRocm93IGdldFRhYmxlVW5rbm93bkRhdGFTb3VyY2VFcnJvcigpO1xuICAgIH1cblxuICAgIHRoaXMuX3JlbmRlckNoYW5nZVN1YnNjcmlwdGlvbiA9IGRhdGFTdHJlYW0hXG4gICAgICAucGlwZSh0YWtlVW50aWwodGhpcy5fb25EZXN0cm95KSlcbiAgICAgIC5zdWJzY3JpYmUoZGF0YSA9PiB7XG4gICAgICAgIHRoaXMuX2RhdGEgPSBkYXRhIHx8IFtdO1xuICAgICAgICB0aGlzLnJlbmRlclJvd3MoKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFycyBhbnkgZXhpc3RpbmcgY29udGVudCBpbiB0aGUgaGVhZGVyIHJvdyBvdXRsZXQgYW5kIGNyZWF0ZXMgYSBuZXcgZW1iZWRkZWQgdmlld1xuICAgKiBpbiB0aGUgb3V0bGV0IHVzaW5nIHRoZSBoZWFkZXIgcm93IGRlZmluaXRpb24uXG4gICAqL1xuICBwcml2YXRlIF9mb3JjZVJlbmRlckhlYWRlclJvd3MoKSB7XG4gICAgLy8gQ2xlYXIgdGhlIGhlYWRlciByb3cgb3V0bGV0IGlmIGFueSBjb250ZW50IGV4aXN0cy5cbiAgICBpZiAodGhpcy5faGVhZGVyUm93T3V0bGV0LnZpZXdDb250YWluZXIubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5faGVhZGVyUm93T3V0bGV0LnZpZXdDb250YWluZXIuY2xlYXIoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9oZWFkZXJSb3dEZWZzLmZvckVhY2goKGRlZiwgaSkgPT4gdGhpcy5fcmVuZGVyUm93KHRoaXMuX2hlYWRlclJvd091dGxldCwgZGVmLCBpKSk7XG4gICAgdGhpcy51cGRhdGVTdGlja3lIZWFkZXJSb3dTdHlsZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgYW55IGV4aXN0aW5nIGNvbnRlbnQgaW4gdGhlIGZvb3RlciByb3cgb3V0bGV0IGFuZCBjcmVhdGVzIGEgbmV3IGVtYmVkZGVkIHZpZXdcbiAgICogaW4gdGhlIG91dGxldCB1c2luZyB0aGUgZm9vdGVyIHJvdyBkZWZpbml0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBfZm9yY2VSZW5kZXJGb290ZXJSb3dzKCkge1xuICAgIC8vIENsZWFyIHRoZSBmb290ZXIgcm93IG91dGxldCBpZiBhbnkgY29udGVudCBleGlzdHMuXG4gICAgaWYgKHRoaXMuX2Zvb3RlclJvd091dGxldC52aWV3Q29udGFpbmVyLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuX2Zvb3RlclJvd091dGxldC52aWV3Q29udGFpbmVyLmNsZWFyKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fZm9vdGVyUm93RGVmcy5mb3JFYWNoKChkZWYsIGkpID0+IHRoaXMuX3JlbmRlclJvdyh0aGlzLl9mb290ZXJSb3dPdXRsZXQsIGRlZiwgaSkpO1xuICAgIHRoaXMudXBkYXRlU3RpY2t5Rm9vdGVyUm93U3R5bGVzKCk7XG4gIH1cblxuICAvKiogQWRkcyB0aGUgc3RpY2t5IGNvbHVtbiBzdHlsZXMgZm9yIHRoZSByb3dzIGFjY29yZGluZyB0byB0aGUgY29sdW1ucycgc3RpY2sgc3RhdGVzLiAqL1xuICBwcml2YXRlIF9hZGRTdGlja3lDb2x1bW5TdHlsZXMocm93czogSFRNTEVsZW1lbnRbXSwgcm93RGVmOiBCYXNlUm93RGVmKSB7XG4gICAgY29uc3QgY29sdW1uRGVmcyA9IEFycmF5LmZyb20ocm93RGVmLmNvbHVtbnMgfHwgW10pLm1hcChjb2x1bW5OYW1lID0+IHtcbiAgICAgIGNvbnN0IGNvbHVtbkRlZiA9IHRoaXMuX2NvbHVtbkRlZnNCeU5hbWUuZ2V0KGNvbHVtbk5hbWUpO1xuICAgICAgaWYgKCFjb2x1bW5EZWYgJiYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgICAgdGhyb3cgZ2V0VGFibGVVbmtub3duQ29sdW1uRXJyb3IoY29sdW1uTmFtZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY29sdW1uRGVmITtcbiAgICB9KTtcbiAgICBjb25zdCBzdGlja3lTdGFydFN0YXRlcyA9IGNvbHVtbkRlZnMubWFwKGNvbHVtbkRlZiA9PiBjb2x1bW5EZWYuc3RpY2t5KTtcbiAgICBjb25zdCBzdGlja3lFbmRTdGF0ZXMgPSBjb2x1bW5EZWZzLm1hcChjb2x1bW5EZWYgPT4gY29sdW1uRGVmLnN0aWNreUVuZCk7XG4gICAgdGhpcy5fc3RpY2t5U3R5bGVyLnVwZGF0ZVN0aWNreUNvbHVtbnMoXG4gICAgICByb3dzLFxuICAgICAgc3RpY2t5U3RhcnRTdGF0ZXMsXG4gICAgICBzdGlja3lFbmRTdGF0ZXMsXG4gICAgICAhdGhpcy5fZml4ZWRMYXlvdXQgfHwgdGhpcy5fZm9yY2VSZWNhbGN1bGF0ZUNlbGxXaWR0aHMsXG4gICAgKTtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBsaXN0IG9mIHJvd3MgdGhhdCBoYXZlIGJlZW4gcmVuZGVyZWQgaW4gdGhlIHJvdyBvdXRsZXQuICovXG4gIF9nZXRSZW5kZXJlZFJvd3Mocm93T3V0bGV0OiBSb3dPdXRsZXQpOiBIVE1MRWxlbWVudFtdIHtcbiAgICBjb25zdCByZW5kZXJlZFJvd3M6IEhUTUxFbGVtZW50W10gPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcm93T3V0bGV0LnZpZXdDb250YWluZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHZpZXdSZWYgPSByb3dPdXRsZXQudmlld0NvbnRhaW5lci5nZXQoaSkhIGFzIEVtYmVkZGVkVmlld1JlZjxhbnk+O1xuICAgICAgcmVuZGVyZWRSb3dzLnB1c2godmlld1JlZi5yb290Tm9kZXNbMF0pO1xuICAgIH1cblxuICAgIHJldHVybiByZW5kZXJlZFJvd3M7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBtYXRjaGluZyByb3cgZGVmaW5pdGlvbnMgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgdGhpcyByb3cgZGF0YS4gSWYgdGhlcmUgaXMgb25seVxuICAgKiBvbmUgcm93IGRlZmluaXRpb24sIGl0IGlzIHJldHVybmVkLiBPdGhlcndpc2UsIGZpbmQgdGhlIHJvdyBkZWZpbml0aW9ucyB0aGF0IGhhcyBhIHdoZW5cbiAgICogcHJlZGljYXRlIHRoYXQgcmV0dXJucyB0cnVlIHdpdGggdGhlIGRhdGEuIElmIG5vbmUgcmV0dXJuIHRydWUsIHJldHVybiB0aGUgZGVmYXVsdCByb3dcbiAgICogZGVmaW5pdGlvbi5cbiAgICovXG4gIF9nZXRSb3dEZWZzKGRhdGE6IFQsIGRhdGFJbmRleDogbnVtYmVyKTogQ2RrUm93RGVmPFQ+W10ge1xuICAgIGlmICh0aGlzLl9yb3dEZWZzLmxlbmd0aCA9PSAxKSB7XG4gICAgICByZXR1cm4gW3RoaXMuX3Jvd0RlZnNbMF1dO1xuICAgIH1cblxuICAgIGxldCByb3dEZWZzOiBDZGtSb3dEZWY8VD5bXSA9IFtdO1xuICAgIGlmICh0aGlzLm11bHRpVGVtcGxhdGVEYXRhUm93cykge1xuICAgICAgcm93RGVmcyA9IHRoaXMuX3Jvd0RlZnMuZmlsdGVyKGRlZiA9PiAhZGVmLndoZW4gfHwgZGVmLndoZW4oZGF0YUluZGV4LCBkYXRhKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCByb3dEZWYgPVxuICAgICAgICB0aGlzLl9yb3dEZWZzLmZpbmQoZGVmID0+IGRlZi53aGVuICYmIGRlZi53aGVuKGRhdGFJbmRleCwgZGF0YSkpIHx8IHRoaXMuX2RlZmF1bHRSb3dEZWY7XG4gICAgICBpZiAocm93RGVmKSB7XG4gICAgICAgIHJvd0RlZnMucHVzaChyb3dEZWYpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghcm93RGVmcy5sZW5ndGggJiYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgIHRocm93IGdldFRhYmxlTWlzc2luZ01hdGNoaW5nUm93RGVmRXJyb3IoZGF0YSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJvd0RlZnM7XG4gIH1cblxuICBwcml2YXRlIF9nZXRFbWJlZGRlZFZpZXdBcmdzKFxuICAgIHJlbmRlclJvdzogUmVuZGVyUm93PFQ+LFxuICAgIGluZGV4OiBudW1iZXIsXG4gICk6IF9WaWV3UmVwZWF0ZXJJdGVtSW5zZXJ0QXJnczxSb3dDb250ZXh0PFQ+PiB7XG4gICAgY29uc3Qgcm93RGVmID0gcmVuZGVyUm93LnJvd0RlZjtcbiAgICBjb25zdCBjb250ZXh0OiBSb3dDb250ZXh0PFQ+ID0geyRpbXBsaWNpdDogcmVuZGVyUm93LmRhdGF9O1xuICAgIHJldHVybiB7XG4gICAgICB0ZW1wbGF0ZVJlZjogcm93RGVmLnRlbXBsYXRlLFxuICAgICAgY29udGV4dCxcbiAgICAgIGluZGV4LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyByb3cgdGVtcGxhdGUgaW4gdGhlIG91dGxldCBhbmQgZmlsbHMgaXQgd2l0aCB0aGUgc2V0IG9mIGNlbGwgdGVtcGxhdGVzLlxuICAgKiBPcHRpb25hbGx5IHRha2VzIGEgY29udGV4dCB0byBwcm92aWRlIHRvIHRoZSByb3cgYW5kIGNlbGxzLCBhcyB3ZWxsIGFzIGFuIG9wdGlvbmFsIGluZGV4XG4gICAqIG9mIHdoZXJlIHRvIHBsYWNlIHRoZSBuZXcgcm93IHRlbXBsYXRlIGluIHRoZSBvdXRsZXQuXG4gICAqL1xuICBwcml2YXRlIF9yZW5kZXJSb3coXG4gICAgb3V0bGV0OiBSb3dPdXRsZXQsXG4gICAgcm93RGVmOiBCYXNlUm93RGVmLFxuICAgIGluZGV4OiBudW1iZXIsXG4gICAgY29udGV4dDogUm93Q29udGV4dDxUPiA9IHt9LFxuICApOiBFbWJlZGRlZFZpZXdSZWY8Um93Q29udGV4dDxUPj4ge1xuICAgIC8vIFRPRE8oYW5kcmV3c2VndWluKTogZW5mb3JjZSB0aGF0IG9uZSBvdXRsZXQgd2FzIGluc3RhbnRpYXRlZCBmcm9tIGNyZWF0ZUVtYmVkZGVkVmlld1xuICAgIGNvbnN0IHZpZXcgPSBvdXRsZXQudmlld0NvbnRhaW5lci5jcmVhdGVFbWJlZGRlZFZpZXcocm93RGVmLnRlbXBsYXRlLCBjb250ZXh0LCBpbmRleCk7XG4gICAgdGhpcy5fcmVuZGVyQ2VsbFRlbXBsYXRlRm9ySXRlbShyb3dEZWYsIGNvbnRleHQpO1xuICAgIHJldHVybiB2aWV3O1xuICB9XG5cbiAgcHJpdmF0ZSBfcmVuZGVyQ2VsbFRlbXBsYXRlRm9ySXRlbShyb3dEZWY6IEJhc2VSb3dEZWYsIGNvbnRleHQ6IFJvd0NvbnRleHQ8VD4pIHtcbiAgICBmb3IgKGxldCBjZWxsVGVtcGxhdGUgb2YgdGhpcy5fZ2V0Q2VsbFRlbXBsYXRlcyhyb3dEZWYpKSB7XG4gICAgICBpZiAoQ2RrQ2VsbE91dGxldC5tb3N0UmVjZW50Q2VsbE91dGxldCkge1xuICAgICAgICBDZGtDZWxsT3V0bGV0Lm1vc3RSZWNlbnRDZWxsT3V0bGV0Ll92aWV3Q29udGFpbmVyLmNyZWF0ZUVtYmVkZGVkVmlldyhjZWxsVGVtcGxhdGUsIGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGluZGV4LXJlbGF0ZWQgY29udGV4dCBmb3IgZWFjaCByb3cgdG8gcmVmbGVjdCBhbnkgY2hhbmdlcyBpbiB0aGUgaW5kZXggb2YgdGhlIHJvd3MsXG4gICAqIGUuZy4gZmlyc3QvbGFzdC9ldmVuL29kZC5cbiAgICovXG4gIHByaXZhdGUgX3VwZGF0ZVJvd0luZGV4Q29udGV4dCgpIHtcbiAgICBjb25zdCB2aWV3Q29udGFpbmVyID0gdGhpcy5fcm93T3V0bGV0LnZpZXdDb250YWluZXI7XG4gICAgZm9yIChsZXQgcmVuZGVySW5kZXggPSAwLCBjb3VudCA9IHZpZXdDb250YWluZXIubGVuZ3RoOyByZW5kZXJJbmRleCA8IGNvdW50OyByZW5kZXJJbmRleCsrKSB7XG4gICAgICBjb25zdCB2aWV3UmVmID0gdmlld0NvbnRhaW5lci5nZXQocmVuZGVySW5kZXgpIGFzIFJvd1ZpZXdSZWY8VD47XG4gICAgICBjb25zdCBjb250ZXh0ID0gdmlld1JlZi5jb250ZXh0IGFzIFJvd0NvbnRleHQ8VD47XG4gICAgICBjb250ZXh0LmNvdW50ID0gY291bnQ7XG4gICAgICBjb250ZXh0LmZpcnN0ID0gcmVuZGVySW5kZXggPT09IDA7XG4gICAgICBjb250ZXh0Lmxhc3QgPSByZW5kZXJJbmRleCA9PT0gY291bnQgLSAxO1xuICAgICAgY29udGV4dC5ldmVuID0gcmVuZGVySW5kZXggJSAyID09PSAwO1xuICAgICAgY29udGV4dC5vZGQgPSAhY29udGV4dC5ldmVuO1xuXG4gICAgICBpZiAodGhpcy5tdWx0aVRlbXBsYXRlRGF0YVJvd3MpIHtcbiAgICAgICAgY29udGV4dC5kYXRhSW5kZXggPSB0aGlzLl9yZW5kZXJSb3dzW3JlbmRlckluZGV4XS5kYXRhSW5kZXg7XG4gICAgICAgIGNvbnRleHQucmVuZGVySW5kZXggPSByZW5kZXJJbmRleDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRleHQuaW5kZXggPSB0aGlzLl9yZW5kZXJSb3dzW3JlbmRlckluZGV4XS5kYXRhSW5kZXg7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIEdldHMgdGhlIGNvbHVtbiBkZWZpbml0aW9ucyBmb3IgdGhlIHByb3ZpZGVkIHJvdyBkZWYuICovXG4gIHByaXZhdGUgX2dldENlbGxUZW1wbGF0ZXMocm93RGVmOiBCYXNlUm93RGVmKTogVGVtcGxhdGVSZWY8YW55PltdIHtcbiAgICBpZiAoIXJvd0RlZiB8fCAhcm93RGVmLmNvbHVtbnMpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgcmV0dXJuIEFycmF5LmZyb20ocm93RGVmLmNvbHVtbnMsIGNvbHVtbklkID0+IHtcbiAgICAgIGNvbnN0IGNvbHVtbiA9IHRoaXMuX2NvbHVtbkRlZnNCeU5hbWUuZ2V0KGNvbHVtbklkKTtcblxuICAgICAgaWYgKCFjb2x1bW4gJiYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgICAgdGhyb3cgZ2V0VGFibGVVbmtub3duQ29sdW1uRXJyb3IoY29sdW1uSWQpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcm93RGVmLmV4dHJhY3RDZWxsVGVtcGxhdGUoY29sdW1uISk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRm9yY2VzIGEgcmUtcmVuZGVyIG9mIHRoZSBkYXRhIHJvd3MuIFNob3VsZCBiZSBjYWxsZWQgaW4gY2FzZXMgd2hlcmUgdGhlcmUgaGFzIGJlZW4gYW4gaW5wdXRcbiAgICogY2hhbmdlIHRoYXQgYWZmZWN0cyB0aGUgZXZhbHVhdGlvbiBvZiB3aGljaCByb3dzIHNob3VsZCBiZSByZW5kZXJlZCwgZS5nLiB0b2dnbGluZ1xuICAgKiBgbXVsdGlUZW1wbGF0ZURhdGFSb3dzYCBvciBhZGRpbmcvcmVtb3Zpbmcgcm93IGRlZmluaXRpb25zLlxuICAgKi9cbiAgcHJpdmF0ZSBfZm9yY2VSZW5kZXJEYXRhUm93cygpIHtcbiAgICB0aGlzLl9kYXRhRGlmZmVyLmRpZmYoW10pO1xuICAgIHRoaXMuX3Jvd091dGxldC52aWV3Q29udGFpbmVyLmNsZWFyKCk7XG4gICAgdGhpcy5yZW5kZXJSb3dzKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZXJlIGhhcyBiZWVuIGEgY2hhbmdlIGluIHN0aWNreSBzdGF0ZXMgc2luY2UgbGFzdCBjaGVjayBhbmQgYXBwbGllcyB0aGUgY29ycmVjdFxuICAgKiBzdGlja3kgc3R5bGVzLiBTaW5jZSBjaGVja2luZyByZXNldHMgdGhlIFwiZGlydHlcIiBzdGF0ZSwgdGhpcyBzaG91bGQgb25seSBiZSBwZXJmb3JtZWQgb25jZVxuICAgKiBkdXJpbmcgYSBjaGFuZ2UgZGV0ZWN0aW9uIGFuZCBhZnRlciB0aGUgaW5wdXRzIGFyZSBzZXR0bGVkIChhZnRlciBjb250ZW50IGNoZWNrKS5cbiAgICovXG4gIHByaXZhdGUgX2NoZWNrU3RpY2t5U3RhdGVzKCkge1xuICAgIGNvbnN0IHN0aWNreUNoZWNrUmVkdWNlciA9IChcbiAgICAgIGFjYzogYm9vbGVhbixcbiAgICAgIGQ6IENka0hlYWRlclJvd0RlZiB8IENka0Zvb3RlclJvd0RlZiB8IENka0NvbHVtbkRlZixcbiAgICApID0+IHtcbiAgICAgIHJldHVybiBhY2MgfHwgZC5oYXNTdGlja3lDaGFuZ2VkKCk7XG4gICAgfTtcblxuICAgIC8vIE5vdGUgdGhhdCB0aGUgY2hlY2sgbmVlZHMgdG8gb2NjdXIgZm9yIGV2ZXJ5IGRlZmluaXRpb24gc2luY2UgaXQgbm90aWZpZXMgdGhlIGRlZmluaXRpb25cbiAgICAvLyB0aGF0IGl0IGNhbiByZXNldCBpdHMgZGlydHkgc3RhdGUuIFVzaW5nIGFub3RoZXIgb3BlcmF0b3IgbGlrZSBgc29tZWAgbWF5IHNob3J0LWNpcmN1aXRcbiAgICAvLyByZW1haW5pbmcgZGVmaW5pdGlvbnMgYW5kIGxlYXZlIHRoZW0gaW4gYW4gdW5jaGVja2VkIHN0YXRlLlxuXG4gICAgaWYgKHRoaXMuX2hlYWRlclJvd0RlZnMucmVkdWNlKHN0aWNreUNoZWNrUmVkdWNlciwgZmFsc2UpKSB7XG4gICAgICB0aGlzLnVwZGF0ZVN0aWNreUhlYWRlclJvd1N0eWxlcygpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9mb290ZXJSb3dEZWZzLnJlZHVjZShzdGlja3lDaGVja1JlZHVjZXIsIGZhbHNlKSkge1xuICAgICAgdGhpcy51cGRhdGVTdGlja3lGb290ZXJSb3dTdHlsZXMoKTtcbiAgICB9XG5cbiAgICBpZiAoQXJyYXkuZnJvbSh0aGlzLl9jb2x1bW5EZWZzQnlOYW1lLnZhbHVlcygpKS5yZWR1Y2Uoc3RpY2t5Q2hlY2tSZWR1Y2VyLCBmYWxzZSkpIHtcbiAgICAgIHRoaXMuX3N0aWNreUNvbHVtblN0eWxlc05lZWRSZXNldCA9IHRydWU7XG4gICAgICB0aGlzLnVwZGF0ZVN0aWNreUNvbHVtblN0eWxlcygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIHRoZSBzdGlja3kgc3R5bGVyIHRoYXQgd2lsbCBiZSB1c2VkIGZvciBzdGlja3kgcm93cyBhbmQgY29sdW1ucy4gTGlzdGVuc1xuICAgKiBmb3IgZGlyZWN0aW9uYWxpdHkgY2hhbmdlcyBhbmQgcHJvdmlkZXMgdGhlIGxhdGVzdCBkaXJlY3Rpb24gdG8gdGhlIHN0eWxlci4gUmUtYXBwbGllcyBjb2x1bW5cbiAgICogc3RpY2tpbmVzcyB3aGVuIGRpcmVjdGlvbmFsaXR5IGNoYW5nZXMuXG4gICAqL1xuICBwcml2YXRlIF9zZXR1cFN0aWNreVN0eWxlcigpIHtcbiAgICBjb25zdCBkaXJlY3Rpb246IERpcmVjdGlvbiA9IHRoaXMuX2RpciA/IHRoaXMuX2Rpci52YWx1ZSA6ICdsdHInO1xuICAgIHRoaXMuX3N0aWNreVN0eWxlciA9IG5ldyBTdGlja3lTdHlsZXIoXG4gICAgICB0aGlzLl9pc05hdGl2ZUh0bWxUYWJsZSxcbiAgICAgIHRoaXMuc3RpY2t5Q3NzQ2xhc3MsXG4gICAgICBkaXJlY3Rpb24sXG4gICAgICB0aGlzLl9jb2FsZXNjZWRTdHlsZVNjaGVkdWxlcixcbiAgICAgIHRoaXMuX3BsYXRmb3JtLmlzQnJvd3NlcixcbiAgICAgIHRoaXMubmVlZHNQb3NpdGlvblN0aWNreU9uRWxlbWVudCxcbiAgICAgIHRoaXMuX3N0aWNreVBvc2l0aW9uaW5nTGlzdGVuZXIsXG4gICAgKTtcbiAgICAodGhpcy5fZGlyID8gdGhpcy5fZGlyLmNoYW5nZSA6IG9ic2VydmFibGVPZjxEaXJlY3Rpb24+KCkpXG4gICAgICAucGlwZSh0YWtlVW50aWwodGhpcy5fb25EZXN0cm95KSlcbiAgICAgIC5zdWJzY3JpYmUodmFsdWUgPT4ge1xuICAgICAgICB0aGlzLl9zdGlja3lTdHlsZXIuZGlyZWN0aW9uID0gdmFsdWU7XG4gICAgICAgIHRoaXMudXBkYXRlU3RpY2t5Q29sdW1uU3R5bGVzKCk7XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKiBGaWx0ZXJzIGRlZmluaXRpb25zIHRoYXQgYmVsb25nIHRvIHRoaXMgdGFibGUgZnJvbSBhIFF1ZXJ5TGlzdC4gKi9cbiAgcHJpdmF0ZSBfZ2V0T3duRGVmczxJIGV4dGVuZHMge190YWJsZT86IGFueX0+KGl0ZW1zOiBRdWVyeUxpc3Q8ST4pOiBJW10ge1xuICAgIHJldHVybiBpdGVtcy5maWx0ZXIoaXRlbSA9PiAhaXRlbS5fdGFibGUgfHwgaXRlbS5fdGFibGUgPT09IHRoaXMpO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgb3IgcmVtb3ZlcyB0aGUgbm8gZGF0YSByb3csIGRlcGVuZGluZyBvbiB3aGV0aGVyIGFueSBkYXRhIGlzIGJlaW5nIHNob3duLiAqL1xuICBwcml2YXRlIF91cGRhdGVOb0RhdGFSb3coKSB7XG4gICAgY29uc3Qgbm9EYXRhUm93ID0gdGhpcy5fY3VzdG9tTm9EYXRhUm93IHx8IHRoaXMuX25vRGF0YVJvdztcblxuICAgIGlmICghbm9EYXRhUm93KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc2hvdWxkU2hvdyA9IHRoaXMuX3Jvd091dGxldC52aWV3Q29udGFpbmVyLmxlbmd0aCA9PT0gMDtcblxuICAgIGlmIChzaG91bGRTaG93ID09PSB0aGlzLl9pc1Nob3dpbmdOb0RhdGFSb3cpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLl9ub0RhdGFSb3dPdXRsZXQudmlld0NvbnRhaW5lcjtcblxuICAgIGlmIChzaG91bGRTaG93KSB7XG4gICAgICBjb25zdCB2aWV3ID0gY29udGFpbmVyLmNyZWF0ZUVtYmVkZGVkVmlldyhub0RhdGFSb3cudGVtcGxhdGVSZWYpO1xuICAgICAgY29uc3Qgcm9vdE5vZGU6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkID0gdmlldy5yb290Tm9kZXNbMF07XG5cbiAgICAgIC8vIE9ubHkgYWRkIHRoZSBhdHRyaWJ1dGVzIGlmIHdlIGhhdmUgYSBzaW5nbGUgcm9vdCBub2RlIHNpbmNlIGl0J3MgaGFyZFxuICAgICAgLy8gdG8gZmlndXJlIG91dCB3aGljaCBvbmUgdG8gYWRkIGl0IHRvIHdoZW4gdGhlcmUgYXJlIG11bHRpcGxlLlxuICAgICAgaWYgKHZpZXcucm9vdE5vZGVzLmxlbmd0aCA9PT0gMSAmJiByb290Tm9kZT8ubm9kZVR5cGUgPT09IHRoaXMuX2RvY3VtZW50LkVMRU1FTlRfTk9ERSkge1xuICAgICAgICByb290Tm9kZS5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAncm93Jyk7XG4gICAgICAgIHJvb3ROb2RlLmNsYXNzTGlzdC5hZGQobm9EYXRhUm93Ll9jb250ZW50Q2xhc3NOYW1lKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29udGFpbmVyLmNsZWFyKCk7XG4gICAgfVxuXG4gICAgdGhpcy5faXNTaG93aW5nTm9EYXRhUm93ID0gc2hvdWxkU2hvdztcblxuICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICB9XG59XG5cbi8qKiBVdGlsaXR5IGZ1bmN0aW9uIHRoYXQgZ2V0cyBhIG1lcmdlZCBsaXN0IG9mIHRoZSBlbnRyaWVzIGluIGFuIGFycmF5IGFuZCB2YWx1ZXMgb2YgYSBTZXQuICovXG5mdW5jdGlvbiBtZXJnZUFycmF5QW5kU2V0PFQ+KGFycmF5OiBUW10sIHNldDogU2V0PFQ+KTogVFtdIHtcbiAgcmV0dXJuIGFycmF5LmNvbmNhdChBcnJheS5mcm9tKHNldCkpO1xufVxuXG4vKipcbiAqIEZpbmRzIHRoZSBjbG9zZXN0IHRhYmxlIHNlY3Rpb24gdG8gYW4gb3V0bGV0LiBXZSBjYW4ndCB1c2UgYEhUTUxFbGVtZW50LmNsb3Nlc3RgIGZvciB0aGlzLFxuICogYmVjYXVzZSB0aGUgbm9kZSByZXByZXNlbnRpbmcgdGhlIG91dGxldCBpcyBhIGNvbW1lbnQuXG4gKi9cbmZ1bmN0aW9uIGNsb3Nlc3RUYWJsZVNlY3Rpb24ob3V0bGV0OiBSb3dPdXRsZXQsIHNlY3Rpb246IHN0cmluZyk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG4gIGNvbnN0IHVwcGVyY2FzZVNlY3Rpb24gPSBzZWN0aW9uLnRvVXBwZXJDYXNlKCk7XG4gIGxldCBjdXJyZW50OiBOb2RlIHwgbnVsbCA9IG91dGxldC52aWV3Q29udGFpbmVyLmVsZW1lbnQubmF0aXZlRWxlbWVudDtcblxuICB3aGlsZSAoY3VycmVudCkge1xuICAgIC8vIDEgaXMgYW4gZWxlbWVudCBub2RlLlxuICAgIGNvbnN0IG5vZGVOYW1lID0gY3VycmVudC5ub2RlVHlwZSA9PT0gMSA/IChjdXJyZW50IGFzIEhUTUxFbGVtZW50KS5ub2RlTmFtZSA6IG51bGw7XG4gICAgaWYgKG5vZGVOYW1lID09PSB1cHBlcmNhc2VTZWN0aW9uKSB7XG4gICAgICByZXR1cm4gY3VycmVudCBhcyBIVE1MRWxlbWVudDtcbiAgICB9IGVsc2UgaWYgKG5vZGVOYW1lID09PSAnVEFCTEUnKSB7XG4gICAgICAvLyBTdG9wIHRyYXZlcnNpbmcgcGFzdCB0aGUgYHRhYmxlYCBub2RlLlxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGN1cnJlbnQgPSBjdXJyZW50LnBhcmVudE5vZGU7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cbiJdfQ==