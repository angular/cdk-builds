/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __extends, __read, __spread, __values } from "tslib";
import { Directionality } from '@angular/cdk/bidi';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { isDataSource } from '@angular/cdk/collections';
import { Platform } from '@angular/cdk/platform';
import { DOCUMENT } from '@angular/common';
import { Attribute, ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChildren, Directive, ElementRef, EmbeddedViewRef, Inject, Input, isDevMode, IterableDiffers, Optional, QueryList, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject, of as observableOf, Subject, isObservable, } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CdkColumnDef } from './cell';
import { CdkCellOutlet, CdkFooterRowDef, CdkHeaderRowDef, CdkRowDef } from './row';
import { StickyStyler } from './sticky-styler';
import { getTableDuplicateColumnNameError, getTableMissingMatchingRowDefError, getTableMissingRowDefsError, getTableMultipleDefaultRowDefsError, getTableUnknownColumnError, getTableUnknownDataSourceError } from './table-errors';
/**
 * Provides a handle for the table to grab the view container's ng-container to insert data rows.
 * @docs-private
 */
var DataRowOutlet = /** @class */ (function () {
    function DataRowOutlet(viewContainer, elementRef) {
        this.viewContainer = viewContainer;
        this.elementRef = elementRef;
    }
    DataRowOutlet.decorators = [
        { type: Directive, args: [{ selector: '[rowOutlet]' },] }
    ];
    /** @nocollapse */
    DataRowOutlet.ctorParameters = function () { return [
        { type: ViewContainerRef },
        { type: ElementRef }
    ]; };
    return DataRowOutlet;
}());
export { DataRowOutlet };
/**
 * Provides a handle for the table to grab the view container's ng-container to insert the header.
 * @docs-private
 */
var HeaderRowOutlet = /** @class */ (function () {
    function HeaderRowOutlet(viewContainer, elementRef) {
        this.viewContainer = viewContainer;
        this.elementRef = elementRef;
    }
    HeaderRowOutlet.decorators = [
        { type: Directive, args: [{ selector: '[headerRowOutlet]' },] }
    ];
    /** @nocollapse */
    HeaderRowOutlet.ctorParameters = function () { return [
        { type: ViewContainerRef },
        { type: ElementRef }
    ]; };
    return HeaderRowOutlet;
}());
export { HeaderRowOutlet };
/**
 * Provides a handle for the table to grab the view container's ng-container to insert the footer.
 * @docs-private
 */
var FooterRowOutlet = /** @class */ (function () {
    function FooterRowOutlet(viewContainer, elementRef) {
        this.viewContainer = viewContainer;
        this.elementRef = elementRef;
    }
    FooterRowOutlet.decorators = [
        { type: Directive, args: [{ selector: '[footerRowOutlet]' },] }
    ];
    /** @nocollapse */
    FooterRowOutlet.ctorParameters = function () { return [
        { type: ViewContainerRef },
        { type: ElementRef }
    ]; };
    return FooterRowOutlet;
}());
export { FooterRowOutlet };
/**
 * The table template that can be used by the mat-table. Should not be used outside of the
 * material library.
 * @docs-private
 */
export var CDK_TABLE_TEMPLATE = 
// Note that according to MDN, the `caption` element has to be projected as the **first**
// element in the table. See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption
"\n  <ng-content select=\"caption\"></ng-content>\n  <ng-container headerRowOutlet></ng-container>\n  <ng-container rowOutlet></ng-container>\n  <ng-container footerRowOutlet></ng-container>\n";
/**
 * Class used to conveniently type the embedded view ref for rows with a context.
 * @docs-private
 */
var RowViewRef = /** @class */ (function (_super) {
    __extends(RowViewRef, _super);
    function RowViewRef() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return RowViewRef;
}(EmbeddedViewRef));
/**
 * A data table that can render a header row, data rows, and a footer row.
 * Uses the dataSource input to determine the data to be rendered. The data can be provided either
 * as a data array, an Observable stream that emits the data array to render, or a DataSource with a
 * connect function that will return an Observable stream that emits the data array to render.
 */
var CdkTable = /** @class */ (function () {
    function CdkTable(_differs, _changeDetectorRef, _elementRef, role, _dir, _document, _platform) {
        this._differs = _differs;
        this._changeDetectorRef = _changeDetectorRef;
        this._elementRef = _elementRef;
        this._dir = _dir;
        this._platform = _platform;
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
        this._multiTemplateDataRows = false;
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
    Object.defineProperty(CdkTable.prototype, "trackBy", {
        /**
         * Tracking function that will be used to check the differences in data changes. Used similarly
         * to `ngFor` `trackBy` function. Optimize row operations by identifying a row based on its data
         * relative to the function to know if a row should be added/removed/moved.
         * Accepts a function that takes two parameters, `index` and `item`.
         */
        get: function () {
            return this._trackByFn;
        },
        set: function (fn) {
            if (isDevMode() && fn != null && typeof fn !== 'function' && console &&
                console.warn) {
                console.warn("trackBy must be a function, but received " + JSON.stringify(fn) + ".");
            }
            this._trackByFn = fn;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CdkTable.prototype, "dataSource", {
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
        get: function () {
            return this._dataSource;
        },
        set: function (dataSource) {
            if (this._dataSource !== dataSource) {
                this._switchDataSource(dataSource);
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CdkTable.prototype, "multiTemplateDataRows", {
        /**
         * Whether to allow multiple rows per data object by evaluating which rows evaluate their 'when'
         * predicate to true. If `multiTemplateDataRows` is false, which is the default value, then each
         * dataobject will render the first row that evaluates its when predicate to true, in the order
         * defined in the table, or otherwise the default row which does not have a when predicate.
         */
        get: function () {
            return this._multiTemplateDataRows;
        },
        set: function (v) {
            this._multiTemplateDataRows = coerceBooleanProperty(v);
            // In Ivy if this value is set via a static attribute (e.g. <table multiTemplateDataRows>),
            // this setter will be invoked before the row outlet has been defined hence the null check.
            if (this._rowOutlet && this._rowOutlet.viewContainer.length) {
                this._forceRenderDataRows();
            }
        },
        enumerable: true,
        configurable: true
    });
    CdkTable.prototype.ngOnInit = function () {
        var _this = this;
        this._setupStickyStyler();
        if (this._isNativeHtmlTable) {
            this._applyNativeTableSections();
        }
        // Set up the trackBy function so that it uses the `RenderRow` as its identity by default. If
        // the user has provided a custom trackBy, return the result of that function as evaluated
        // with the values of the `RenderRow`'s data and index.
        this._dataDiffer = this._differs.find([]).create(function (_i, dataRow) {
            return _this.trackBy ? _this.trackBy(dataRow.dataIndex, dataRow.data) : dataRow;
        });
    };
    CdkTable.prototype.ngAfterContentChecked = function () {
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
    };
    CdkTable.prototype.ngOnDestroy = function () {
        this._rowOutlet.viewContainer.clear();
        this._headerRowOutlet.viewContainer.clear();
        this._footerRowOutlet.viewContainer.clear();
        this._cachedRenderRowsMap.clear();
        this._onDestroy.next();
        this._onDestroy.complete();
        if (isDataSource(this.dataSource)) {
            this.dataSource.disconnect(this);
        }
    };
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
    CdkTable.prototype.renderRows = function () {
        var _this = this;
        this._renderRows = this._getAllRenderRows();
        var changes = this._dataDiffer.diff(this._renderRows);
        if (!changes) {
            return;
        }
        var viewContainer = this._rowOutlet.viewContainer;
        changes.forEachOperation(function (record, prevIndex, currentIndex) {
            if (record.previousIndex == null) {
                _this._insertRow(record.item, currentIndex);
            }
            else if (currentIndex == null) {
                viewContainer.remove(prevIndex);
            }
            else {
                var view = viewContainer.get(prevIndex);
                viewContainer.move(view, currentIndex);
            }
        });
        // Update the meta context of a row's context data (index, count, first, last, ...)
        this._updateRowIndexContext();
        // Update rows that did not get added/removed/moved but may have had their identity changed,
        // e.g. if trackBy matched data on some property but the actual data reference changed.
        changes.forEachIdentityChange(function (record) {
            var rowView = viewContainer.get(record.currentIndex);
            rowView.context.$implicit = record.item.data;
        });
        this.updateStickyColumnStyles();
    };
    /**
     * Sets the header row definition to be used. Overrides the header row definition gathered by
     * using `ContentChild`, if one exists. Sets a flag that will re-render the header row after the
     * table's content is checked.
     * @docs-private
     * @deprecated Use `addHeaderRowDef` and `removeHeaderRowDef` instead
     * @breaking-change 8.0.0
     */
    CdkTable.prototype.setHeaderRowDef = function (headerRowDef) {
        this._customHeaderRowDefs = new Set([headerRowDef]);
        this._headerRowDefChanged = true;
    };
    /**
     * Sets the footer row definition to be used. Overrides the footer row definition gathered by
     * using `ContentChild`, if one exists. Sets a flag that will re-render the footer row after the
     * table's content is checked.
     * @docs-private
     * @deprecated Use `addFooterRowDef` and `removeFooterRowDef` instead
     * @breaking-change 8.0.0
     */
    CdkTable.prototype.setFooterRowDef = function (footerRowDef) {
        this._customFooterRowDefs = new Set([footerRowDef]);
        this._footerRowDefChanged = true;
    };
    /** Adds a column definition that was not included as part of the content children. */
    CdkTable.prototype.addColumnDef = function (columnDef) {
        this._customColumnDefs.add(columnDef);
    };
    /** Removes a column definition that was not included as part of the content children. */
    CdkTable.prototype.removeColumnDef = function (columnDef) {
        this._customColumnDefs.delete(columnDef);
    };
    /** Adds a row definition that was not included as part of the content children. */
    CdkTable.prototype.addRowDef = function (rowDef) {
        this._customRowDefs.add(rowDef);
    };
    /** Removes a row definition that was not included as part of the content children. */
    CdkTable.prototype.removeRowDef = function (rowDef) {
        this._customRowDefs.delete(rowDef);
    };
    /** Adds a header row definition that was not included as part of the content children. */
    CdkTable.prototype.addHeaderRowDef = function (headerRowDef) {
        this._customHeaderRowDefs.add(headerRowDef);
        this._headerRowDefChanged = true;
    };
    /** Removes a header row definition that was not included as part of the content children. */
    CdkTable.prototype.removeHeaderRowDef = function (headerRowDef) {
        this._customHeaderRowDefs.delete(headerRowDef);
        this._headerRowDefChanged = true;
    };
    /** Adds a footer row definition that was not included as part of the content children. */
    CdkTable.prototype.addFooterRowDef = function (footerRowDef) {
        this._customFooterRowDefs.add(footerRowDef);
        this._footerRowDefChanged = true;
    };
    /** Removes a footer row definition that was not included as part of the content children. */
    CdkTable.prototype.removeFooterRowDef = function (footerRowDef) {
        this._customFooterRowDefs.delete(footerRowDef);
        this._footerRowDefChanged = true;
    };
    /**
     * Updates the header sticky styles. First resets all applied styles with respect to the cells
     * sticking to the top. Then, evaluating which cells need to be stuck to the top. This is
     * automatically called when the header row changes its displayed set of columns, or if its
     * sticky input changes. May be called manually for cases where the cell content changes outside
     * of these events.
     */
    CdkTable.prototype.updateStickyHeaderRowStyles = function () {
        var headerRows = this._getRenderedRows(this._headerRowOutlet);
        var tableElement = this._elementRef.nativeElement;
        // Hide the thead element if there are no header rows. This is necessary to satisfy
        // overzealous a11y checkers that fail because the `rowgroup` element does not contain
        // required child `row`.
        var thead = tableElement.querySelector('thead');
        if (thead) {
            thead.style.display = headerRows.length ? '' : 'none';
        }
        var stickyStates = this._headerRowDefs.map(function (def) { return def.sticky; });
        this._stickyStyler.clearStickyPositioning(headerRows, ['top']);
        this._stickyStyler.stickRows(headerRows, stickyStates, 'top');
        // Reset the dirty state of the sticky input change since it has been used.
        this._headerRowDefs.forEach(function (def) { return def.resetStickyChanged(); });
    };
    /**
     * Updates the footer sticky styles. First resets all applied styles with respect to the cells
     * sticking to the bottom. Then, evaluating which cells need to be stuck to the bottom. This is
     * automatically called when the footer row changes its displayed set of columns, or if its
     * sticky input changes. May be called manually for cases where the cell content changes outside
     * of these events.
     */
    CdkTable.prototype.updateStickyFooterRowStyles = function () {
        var footerRows = this._getRenderedRows(this._footerRowOutlet);
        var tableElement = this._elementRef.nativeElement;
        // Hide the tfoot element if there are no footer rows. This is necessary to satisfy
        // overzealous a11y checkers that fail because the `rowgroup` element does not contain
        // required child `row`.
        var tfoot = tableElement.querySelector('tfoot');
        if (tfoot) {
            tfoot.style.display = footerRows.length ? '' : 'none';
        }
        var stickyStates = this._footerRowDefs.map(function (def) { return def.sticky; });
        this._stickyStyler.clearStickyPositioning(footerRows, ['bottom']);
        this._stickyStyler.stickRows(footerRows, stickyStates, 'bottom');
        this._stickyStyler.updateStickyFooterContainer(this._elementRef.nativeElement, stickyStates);
        // Reset the dirty state of the sticky input change since it has been used.
        this._footerRowDefs.forEach(function (def) { return def.resetStickyChanged(); });
    };
    /**
     * Updates the column sticky styles. First resets all applied styles with respect to the cells
     * sticking to the left and right. Then sticky styles are added for the left and right according
     * to the column definitions for each cell in each row. This is automatically called when
     * the data source provides a new set of data or when a column definition changes its sticky
     * input. May be called manually for cases where the cell content changes outside of these events.
     */
    CdkTable.prototype.updateStickyColumnStyles = function () {
        var _this = this;
        var headerRows = this._getRenderedRows(this._headerRowOutlet);
        var dataRows = this._getRenderedRows(this._rowOutlet);
        var footerRows = this._getRenderedRows(this._footerRowOutlet);
        // Clear the left and right positioning from all columns in the table across all rows since
        // sticky columns span across all table sections (header, data, footer)
        this._stickyStyler.clearStickyPositioning(__spread(headerRows, dataRows, footerRows), ['left', 'right']);
        // Update the sticky styles for each header row depending on the def's sticky state
        headerRows.forEach(function (headerRow, i) {
            _this._addStickyColumnStyles([headerRow], _this._headerRowDefs[i]);
        });
        // Update the sticky styles for each data row depending on its def's sticky state
        this._rowDefs.forEach(function (rowDef) {
            // Collect all the rows rendered with this row definition.
            var rows = [];
            for (var i = 0; i < dataRows.length; i++) {
                if (_this._renderRows[i].rowDef === rowDef) {
                    rows.push(dataRows[i]);
                }
            }
            _this._addStickyColumnStyles(rows, rowDef);
        });
        // Update the sticky styles for each footer row depending on the def's sticky state
        footerRows.forEach(function (footerRow, i) {
            _this._addStickyColumnStyles([footerRow], _this._footerRowDefs[i]);
        });
        // Reset the dirty state of the sticky input change since it has been used.
        Array.from(this._columnDefsByName.values()).forEach(function (def) { return def.resetStickyChanged(); });
    };
    /**
     * Get the list of RenderRow objects to render according to the current list of data and defined
     * row definitions. If the previous list already contained a particular pair, it should be reused
     * so that the differ equates their references.
     */
    CdkTable.prototype._getAllRenderRows = function () {
        var renderRows = [];
        // Store the cache and create a new one. Any re-used RenderRow objects will be moved into the
        // new cache while unused ones can be picked up by garbage collection.
        var prevCachedRenderRows = this._cachedRenderRowsMap;
        this._cachedRenderRowsMap = new Map();
        // For each data object, get the list of rows that should be rendered, represented by the
        // respective `RenderRow` object which is the pair of `data` and `CdkRowDef`.
        for (var i = 0; i < this._data.length; i++) {
            var data = this._data[i];
            var renderRowsForData = this._getRenderRowsForData(data, i, prevCachedRenderRows.get(data));
            if (!this._cachedRenderRowsMap.has(data)) {
                this._cachedRenderRowsMap.set(data, new WeakMap());
            }
            for (var j = 0; j < renderRowsForData.length; j++) {
                var renderRow = renderRowsForData[j];
                var cache = this._cachedRenderRowsMap.get(renderRow.data);
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
    };
    /**
     * Gets a list of `RenderRow<T>` for the provided data object and any `CdkRowDef` objects that
     * should be rendered for this data. Reuses the cached RenderRow objects if they match the same
     * `(T, CdkRowDef)` pair.
     */
    CdkTable.prototype._getRenderRowsForData = function (data, dataIndex, cache) {
        var rowDefs = this._getRowDefs(data, dataIndex);
        return rowDefs.map(function (rowDef) {
            var cachedRenderRows = (cache && cache.has(rowDef)) ? cache.get(rowDef) : [];
            if (cachedRenderRows.length) {
                var dataRow = cachedRenderRows.shift();
                dataRow.dataIndex = dataIndex;
                return dataRow;
            }
            else {
                return { data: data, rowDef: rowDef, dataIndex: dataIndex };
            }
        });
    };
    /** Update the map containing the content's column definitions. */
    CdkTable.prototype._cacheColumnDefs = function () {
        var _this = this;
        this._columnDefsByName.clear();
        var columnDefs = mergeQueryListAndSet(this._contentColumnDefs, this._customColumnDefs);
        columnDefs.forEach(function (columnDef) {
            if (_this._columnDefsByName.has(columnDef.name)) {
                throw getTableDuplicateColumnNameError(columnDef.name);
            }
            _this._columnDefsByName.set(columnDef.name, columnDef);
        });
    };
    /** Update the list of all available row definitions that can be used. */
    CdkTable.prototype._cacheRowDefs = function () {
        this._headerRowDefs =
            mergeQueryListAndSet(this._contentHeaderRowDefs, this._customHeaderRowDefs);
        this._footerRowDefs =
            mergeQueryListAndSet(this._contentFooterRowDefs, this._customFooterRowDefs);
        this._rowDefs = mergeQueryListAndSet(this._contentRowDefs, this._customRowDefs);
        // After all row definitions are determined, find the row definition to be considered default.
        var defaultRowDefs = this._rowDefs.filter(function (def) { return !def.when; });
        if (!this.multiTemplateDataRows && defaultRowDefs.length > 1) {
            throw getTableMultipleDefaultRowDefsError();
        }
        this._defaultRowDef = defaultRowDefs[0];
    };
    /**
     * Check if the header, data, or footer rows have changed what columns they want to display or
     * whether the sticky states have changed for the header or footer. If there is a diff, then
     * re-render that section.
     */
    CdkTable.prototype._renderUpdatedColumns = function () {
        var columnsDiffReducer = function (acc, def) { return acc || !!def.getColumnsDiff(); };
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
    };
    /**
     * Switch to the provided data source by resetting the data and unsubscribing from the current
     * render change subscription if one exists. If the data source is null, interpret this by
     * clearing the row outlet. Otherwise start listening for new data.
     */
    CdkTable.prototype._switchDataSource = function (dataSource) {
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
    };
    /** Set up a subscription for the data provided by the data source. */
    CdkTable.prototype._observeRenderChanges = function () {
        var _this = this;
        // If no data source has been set, there is nothing to observe for changes.
        if (!this.dataSource) {
            return;
        }
        var dataStream;
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
        this._renderChangeSubscription = dataStream.pipe(takeUntil(this._onDestroy)).subscribe(function (data) {
            _this._data = data || [];
            _this.renderRows();
        });
    };
    /**
     * Clears any existing content in the header row outlet and creates a new embedded view
     * in the outlet using the header row definition.
     */
    CdkTable.prototype._forceRenderHeaderRows = function () {
        var _this = this;
        // Clear the header row outlet if any content exists.
        if (this._headerRowOutlet.viewContainer.length > 0) {
            this._headerRowOutlet.viewContainer.clear();
        }
        this._headerRowDefs.forEach(function (def, i) { return _this._renderRow(_this._headerRowOutlet, def, i); });
        this.updateStickyHeaderRowStyles();
        this.updateStickyColumnStyles();
    };
    /**
     * Clears any existing content in the footer row outlet and creates a new embedded view
     * in the outlet using the footer row definition.
     */
    CdkTable.prototype._forceRenderFooterRows = function () {
        var _this = this;
        // Clear the footer row outlet if any content exists.
        if (this._footerRowOutlet.viewContainer.length > 0) {
            this._footerRowOutlet.viewContainer.clear();
        }
        this._footerRowDefs.forEach(function (def, i) { return _this._renderRow(_this._footerRowOutlet, def, i); });
        this.updateStickyFooterRowStyles();
        this.updateStickyColumnStyles();
    };
    /** Adds the sticky column styles for the rows according to the columns' stick states. */
    CdkTable.prototype._addStickyColumnStyles = function (rows, rowDef) {
        var _this = this;
        var columnDefs = Array.from(rowDef.columns || []).map(function (columnName) {
            var columnDef = _this._columnDefsByName.get(columnName);
            if (!columnDef) {
                throw getTableUnknownColumnError(columnName);
            }
            return columnDef;
        });
        var stickyStartStates = columnDefs.map(function (columnDef) { return columnDef.sticky; });
        var stickyEndStates = columnDefs.map(function (columnDef) { return columnDef.stickyEnd; });
        this._stickyStyler.updateStickyColumns(rows, stickyStartStates, stickyEndStates);
    };
    /** Gets the list of rows that have been rendered in the row outlet. */
    CdkTable.prototype._getRenderedRows = function (rowOutlet) {
        var renderedRows = [];
        for (var i = 0; i < rowOutlet.viewContainer.length; i++) {
            var viewRef = rowOutlet.viewContainer.get(i);
            renderedRows.push(viewRef.rootNodes[0]);
        }
        return renderedRows;
    };
    /**
     * Get the matching row definitions that should be used for this row data. If there is only
     * one row definition, it is returned. Otherwise, find the row definitions that has a when
     * predicate that returns true with the data. If none return true, return the default row
     * definition.
     */
    CdkTable.prototype._getRowDefs = function (data, dataIndex) {
        if (this._rowDefs.length == 1) {
            return [this._rowDefs[0]];
        }
        var rowDefs = [];
        if (this.multiTemplateDataRows) {
            rowDefs = this._rowDefs.filter(function (def) { return !def.when || def.when(dataIndex, data); });
        }
        else {
            var rowDef = this._rowDefs.find(function (def) { return def.when && def.when(dataIndex, data); }) || this._defaultRowDef;
            if (rowDef) {
                rowDefs.push(rowDef);
            }
        }
        if (!rowDefs.length) {
            throw getTableMissingMatchingRowDefError(data);
        }
        return rowDefs;
    };
    /**
     * Create the embedded view for the data row template and place it in the correct index location
     * within the data row view container.
     */
    CdkTable.prototype._insertRow = function (renderRow, renderIndex) {
        var rowDef = renderRow.rowDef;
        var context = { $implicit: renderRow.data };
        this._renderRow(this._rowOutlet, rowDef, renderIndex, context);
    };
    /**
     * Creates a new row template in the outlet and fills it with the set of cell templates.
     * Optionally takes a context to provide to the row and cells, as well as an optional index
     * of where to place the new row template in the outlet.
     */
    CdkTable.prototype._renderRow = function (outlet, rowDef, index, context) {
        var e_1, _a;
        if (context === void 0) { context = {}; }
        // TODO(andrewseguin): enforce that one outlet was instantiated from createEmbeddedView
        outlet.viewContainer.createEmbeddedView(rowDef.template, context, index);
        try {
            for (var _b = __values(this._getCellTemplates(rowDef)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var cellTemplate = _c.value;
                if (CdkCellOutlet.mostRecentCellOutlet) {
                    CdkCellOutlet.mostRecentCellOutlet._viewContainer.createEmbeddedView(cellTemplate, context);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        this._changeDetectorRef.markForCheck();
    };
    /**
     * Updates the index-related context for each row to reflect any changes in the index of the rows,
     * e.g. first/last/even/odd.
     */
    CdkTable.prototype._updateRowIndexContext = function () {
        var viewContainer = this._rowOutlet.viewContainer;
        for (var renderIndex = 0, count = viewContainer.length; renderIndex < count; renderIndex++) {
            var viewRef = viewContainer.get(renderIndex);
            var context = viewRef.context;
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
    };
    /** Gets the column definitions for the provided row def. */
    CdkTable.prototype._getCellTemplates = function (rowDef) {
        var _this = this;
        if (!rowDef || !rowDef.columns) {
            return [];
        }
        return Array.from(rowDef.columns, function (columnId) {
            var column = _this._columnDefsByName.get(columnId);
            if (!column) {
                throw getTableUnknownColumnError(columnId);
            }
            return rowDef.extractCellTemplate(column);
        });
    };
    /** Adds native table sections (e.g. tbody) and moves the row outlets into them. */
    CdkTable.prototype._applyNativeTableSections = function () {
        var e_2, _a;
        var documentFragment = this._document.createDocumentFragment();
        var sections = [
            { tag: 'thead', outlet: this._headerRowOutlet },
            { tag: 'tbody', outlet: this._rowOutlet },
            { tag: 'tfoot', outlet: this._footerRowOutlet },
        ];
        try {
            for (var sections_1 = __values(sections), sections_1_1 = sections_1.next(); !sections_1_1.done; sections_1_1 = sections_1.next()) {
                var section = sections_1_1.value;
                var element = this._document.createElement(section.tag);
                element.setAttribute('role', 'rowgroup');
                element.appendChild(section.outlet.elementRef.nativeElement);
                documentFragment.appendChild(element);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (sections_1_1 && !sections_1_1.done && (_a = sections_1.return)) _a.call(sections_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        // Use a DocumentFragment so we don't hit the DOM on each iteration.
        this._elementRef.nativeElement.appendChild(documentFragment);
    };
    /**
     * Forces a re-render of the data rows. Should be called in cases where there has been an input
     * change that affects the evaluation of which rows should be rendered, e.g. toggling
     * `multiTemplateDataRows` or adding/removing row definitions.
     */
    CdkTable.prototype._forceRenderDataRows = function () {
        this._dataDiffer.diff([]);
        this._rowOutlet.viewContainer.clear();
        this.renderRows();
        this.updateStickyColumnStyles();
    };
    /**
     * Checks if there has been a change in sticky states since last check and applies the correct
     * sticky styles. Since checking resets the "dirty" state, this should only be performed once
     * during a change detection and after the inputs are settled (after content check).
     */
    CdkTable.prototype._checkStickyStates = function () {
        var stickyCheckReducer = function (acc, d) {
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
            this.updateStickyColumnStyles();
        }
    };
    /**
     * Creates the sticky styler that will be used for sticky rows and columns. Listens
     * for directionality changes and provides the latest direction to the styler. Re-applies column
     * stickiness when directionality changes.
     */
    CdkTable.prototype._setupStickyStyler = function () {
        var _this = this;
        var direction = this._dir ? this._dir.value : 'ltr';
        this._stickyStyler = new StickyStyler(this._isNativeHtmlTable, this.stickyCssClass, direction, this._platform.isBrowser);
        (this._dir ? this._dir.change : observableOf())
            .pipe(takeUntil(this._onDestroy))
            .subscribe(function (value) {
            _this._stickyStyler.direction = value;
            _this.updateStickyColumnStyles();
        });
    };
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
                    changeDetection: ChangeDetectionStrategy.Default
                }] }
    ];
    /** @nocollapse */
    CdkTable.ctorParameters = function () { return [
        { type: IterableDiffers },
        { type: ChangeDetectorRef },
        { type: ElementRef },
        { type: String, decorators: [{ type: Attribute, args: ['role',] }] },
        { type: Directionality, decorators: [{ type: Optional }] },
        { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] },
        { type: Platform }
    ]; };
    CdkTable.propDecorators = {
        trackBy: [{ type: Input }],
        dataSource: [{ type: Input }],
        multiTemplateDataRows: [{ type: Input }],
        _rowOutlet: [{ type: ViewChild, args: [DataRowOutlet, { static: true },] }],
        _headerRowOutlet: [{ type: ViewChild, args: [HeaderRowOutlet, { static: true },] }],
        _footerRowOutlet: [{ type: ViewChild, args: [FooterRowOutlet, { static: true },] }],
        _contentColumnDefs: [{ type: ContentChildren, args: [CdkColumnDef, { descendants: true },] }],
        _contentRowDefs: [{ type: ContentChildren, args: [CdkRowDef, { descendants: true },] }],
        _contentHeaderRowDefs: [{ type: ContentChildren, args: [CdkHeaderRowDef, {
                        descendants: true
                    },] }],
        _contentFooterRowDefs: [{ type: ContentChildren, args: [CdkFooterRowDef, {
                        descendants: true
                    },] }]
    };
    return CdkTable;
}());
export { CdkTable };
/** Utility function that gets a merged list of the entries in a QueryList and values of a Set. */
function mergeQueryListAndSet(queryList, set) {
    return queryList.toArray().concat(Array.from(set));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RhYmxlL3RhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQVksY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDNUQsT0FBTyxFQUFlLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDMUUsT0FBTyxFQUErQixZQUFZLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUNwRixPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDL0MsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFFTCxTQUFTLEVBQ1QsdUJBQXVCLEVBQ3ZCLGlCQUFpQixFQUNqQixTQUFTLEVBQ1QsZUFBZSxFQUNmLFNBQVMsRUFDVCxVQUFVLEVBQ1YsZUFBZSxFQUNmLE1BQU0sRUFDTixLQUFLLEVBQ0wsU0FBUyxFQUdULGVBQWUsRUFHZixRQUFRLEVBQ1IsU0FBUyxFQUdULFNBQVMsRUFDVCxnQkFBZ0IsRUFDaEIsaUJBQWlCLEVBQ2xCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFDTCxlQUFlLEVBRWYsRUFBRSxJQUFJLFlBQVksRUFDbEIsT0FBTyxFQUVQLFlBQVksR0FDYixNQUFNLE1BQU0sQ0FBQztBQUNkLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6QyxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQ3BDLE9BQU8sRUFFTCxhQUFhLEVBR2IsZUFBZSxFQUNmLGVBQWUsRUFDZixTQUFTLEVBQ1YsTUFBTSxPQUFPLENBQUM7QUFDZixPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDN0MsT0FBTyxFQUNMLGdDQUFnQyxFQUNoQyxrQ0FBa0MsRUFD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QWtGO29CQUNsRiwrQ0FBK0M7b0JBQy9DLGVBQWUsRUFBRSx1QkFBdUIsQ0FBQyxPQUFPO2lCQUNqRDs7OztnQkFqSkMsZUFBZTtnQkFYZixpQkFBaUI7Z0JBSWpCLFVBQVU7NkNBNFh1QyxTQUFTLFNBQUMsTUFBTTtnQkF6WWhELGNBQWMsdUJBMFkxQixRQUFRO2dEQUE2QyxNQUFNLFNBQUMsUUFBUTtnQkF2WW5FLFFBQVE7OzswQkErUmIsS0FBSzs2QkFpQ0wsS0FBSzt3Q0FpQkwsS0FBSzs2QkEyQkwsU0FBUyxTQUFDLGFBQWEsRUFBRSxFQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUM7bUNBQ3ZDLFNBQVMsU0FBQyxlQUFlLEVBQUUsRUFBQyxNQUFNLEVBQUUsSUFBSSxFQUFDO21DQUN6QyxTQUFTLFNBQUMsZUFBZSxFQUFFLEVBQUMsTUFBTSxFQUFFLElBQUksRUFBQztxQ0FNekMsZUFBZSxTQUFDLFlBQVksRUFBRSxFQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUM7a0NBR2pELGVBQWUsU0FBQyxTQUFTLEVBQUUsRUFBQyxXQUFXLEVBQUUsSUFBSSxFQUFDO3dDQUc5QyxlQUFlLFNBQUMsZUFBZSxFQUFFO3dCQUNoQyxXQUFXLEVBQUUsSUFBSTtxQkFDbEI7d0NBR0EsZUFBZSxTQUFDLGVBQWUsRUFBRTt3QkFDaEMsV0FBVyxFQUFFLElBQUk7cUJBQ2xCOztJQW1yQkgsZUFBQztDQUFBLEFBLzVCRCxJQSs1QkM7U0FqNUJZLFFBQVE7QUFtNUJyQixrR0FBa0c7QUFDbEcsU0FBUyxvQkFBb0IsQ0FBSSxTQUF1QixFQUFFLEdBQVc7SUFDbkUsT0FBTyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNyRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aW9uLCBEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtCb29sZWFuSW5wdXQsIGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7Q29sbGVjdGlvblZpZXdlciwgRGF0YVNvdXJjZSwgaXNEYXRhU291cmNlfSBmcm9tICdAYW5ndWxhci9jZGsvY29sbGVjdGlvbnMnO1xuaW1wb3J0IHtQbGF0Zm9ybX0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge1xuICBBZnRlckNvbnRlbnRDaGVja2VkLFxuICBBdHRyaWJ1dGUsXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBDb250ZW50Q2hpbGRyZW4sXG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgRW1iZWRkZWRWaWV3UmVmLFxuICBJbmplY3QsXG4gIElucHV0LFxuICBpc0Rldk1vZGUsXG4gIEl0ZXJhYmxlQ2hhbmdlUmVjb3JkLFxuICBJdGVyYWJsZURpZmZlcixcbiAgSXRlcmFibGVEaWZmZXJzLFxuICBPbkRlc3Ryb3ksXG4gIE9uSW5pdCxcbiAgT3B0aW9uYWwsXG4gIFF1ZXJ5TGlzdCxcbiAgVGVtcGxhdGVSZWYsXG4gIFRyYWNrQnlGdW5jdGlvbixcbiAgVmlld0NoaWxkLFxuICBWaWV3Q29udGFpbmVyUmVmLFxuICBWaWV3RW5jYXBzdWxhdGlvblxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7XG4gIEJlaGF2aW9yU3ViamVjdCxcbiAgT2JzZXJ2YWJsZSxcbiAgb2YgYXMgb2JzZXJ2YWJsZU9mLFxuICBTdWJqZWN0LFxuICBTdWJzY3JpcHRpb24sXG4gIGlzT2JzZXJ2YWJsZSxcbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3Rha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtDZGtDb2x1bW5EZWZ9IGZyb20gJy4vY2VsbCc7XG5pbXBvcnQge1xuICBCYXNlUm93RGVmLFxuICBDZGtDZWxsT3V0bGV0LFxuICBDZGtDZWxsT3V0bGV0TXVsdGlSb3dDb250ZXh0LFxuICBDZGtDZWxsT3V0bGV0Um93Q29udGV4dCxcbiAgQ2RrRm9vdGVyUm93RGVmLFxuICBDZGtIZWFkZXJSb3dEZWYsXG4gIENka1Jvd0RlZlxufSBmcm9tICcuL3Jvdyc7XG5pbXBvcnQge1N0aWNreVN0eWxlcn0gZnJvbSAnLi9zdGlja3ktc3R5bGVyJztcbmltcG9ydCB7XG4gIGdldFRhYmxlRHVwbGljYXRlQ29sdW1uTmFtZUVycm9yLFxuICBnZXRUYWJsZU1pc3NpbmdNYXRjaGluZ1Jvd0RlZkVycm9yLFxuICBnZXRUYWJsZU1pc3NpbmdSb3dEZWZzRXJyb3IsXG4gIGdldFRhYmxlTXVsdGlwbGVEZWZhdWx0Um93RGVmc0Vycm9yLFxuICBnZXRUYWJsZVVua25vd25Db2x1bW5FcnJvcixcbiAgZ2V0VGFibGVVbmtub3duRGF0YVNvdXJjZUVycm9yXG59IGZyb20gJy4vdGFibGUtZXJyb3JzJztcblxuLyoqIEludGVyZmFjZSB1c2VkIHRvIHByb3ZpZGUgYW4gb3V0bGV0IGZvciByb3dzIHRvIGJlIGluc2VydGVkIGludG8uICovXG5leHBvcnQgaW50ZXJmYWNlIFJvd091dGxldCB7XG4gIHZpZXdDb250YWluZXI6IFZpZXdDb250YWluZXJSZWY7XG59XG5cbi8qKlxuICogVW5pb24gb2YgdGhlIHR5cGVzIHRoYXQgY2FuIGJlIHNldCBhcyB0aGUgZGF0YSBzb3VyY2UgZm9yIGEgYENka1RhYmxlYC5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xudHlwZSBDZGtUYWJsZURhdGFTb3VyY2VJbnB1dDxUPiA9XG4gICAgRGF0YVNvdXJjZTxUPnxPYnNlcnZhYmxlPFJlYWRvbmx5QXJyYXk8VD58VFtdPnxSZWFkb25seUFycmF5PFQ+fFRbXTtcblxuLyoqXG4gKiBQcm92aWRlcyBhIGhhbmRsZSBmb3IgdGhlIHRhYmxlIHRvIGdyYWIgdGhlIHZpZXcgY29udGFpbmVyJ3MgbmctY29udGFpbmVyIHRvIGluc2VydCBkYXRhIHJvd3MuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbkBEaXJlY3RpdmUoe3NlbGVjdG9yOiAnW3Jvd091dGxldF0nfSlcbmV4cG9ydCBjbGFzcyBEYXRhUm93T3V0bGV0IGltcGxlbWVudHMgUm93T3V0bGV0IHtcbiAgY29uc3RydWN0b3IocHVibGljIHZpZXdDb250YWluZXI6IFZpZXdDb250YWluZXJSZWYsIHB1YmxpYyBlbGVtZW50UmVmOiBFbGVtZW50UmVmKSB7fVxufVxuXG4vKipcbiAqIFByb3ZpZGVzIGEgaGFuZGxlIGZvciB0aGUgdGFibGUgdG8gZ3JhYiB0aGUgdmlldyBjb250YWluZXIncyBuZy1jb250YWluZXIgdG8gaW5zZXJ0IHRoZSBoZWFkZXIuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbkBEaXJlY3RpdmUoe3NlbGVjdG9yOiAnW2hlYWRlclJvd091dGxldF0nfSlcbmV4cG9ydCBjbGFzcyBIZWFkZXJSb3dPdXRsZXQgaW1wbGVtZW50cyBSb3dPdXRsZXQge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgdmlld0NvbnRhaW5lcjogVmlld0NvbnRhaW5lclJlZiwgcHVibGljIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHt9XG59XG5cbi8qKlxuICogUHJvdmlkZXMgYSBoYW5kbGUgZm9yIHRoZSB0YWJsZSB0byBncmFiIHRoZSB2aWV3IGNvbnRhaW5lcidzIG5nLWNvbnRhaW5lciB0byBpbnNlcnQgdGhlIGZvb3Rlci5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuQERpcmVjdGl2ZSh7c2VsZWN0b3I6ICdbZm9vdGVyUm93T3V0bGV0XSd9KVxuZXhwb3J0IGNsYXNzIEZvb3RlclJvd091dGxldCBpbXBsZW1lbnRzIFJvd091dGxldCB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyB2aWV3Q29udGFpbmVyOiBWaWV3Q29udGFpbmVyUmVmLCBwdWJsaWMgZWxlbWVudFJlZjogRWxlbWVudFJlZikge31cbn1cblxuLyoqXG4gKiBUaGUgdGFibGUgdGVtcGxhdGUgdGhhdCBjYW4gYmUgdXNlZCBieSB0aGUgbWF0LXRhYmxlLiBTaG91bGQgbm90IGJlIHVzZWQgb3V0c2lkZSBvZiB0aGVcbiAqIG1hdGVyaWFsIGxpYnJhcnkuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBjb25zdCBDREtfVEFCTEVfVEVNUExBVEUgPVxuICAgIC8vIE5vdGUgdGhhdCBhY2NvcmRpbmcgdG8gTUROLCB0aGUgYGNhcHRpb25gIGVsZW1lbnQgaGFzIHRvIGJlIHByb2plY3RlZCBhcyB0aGUgKipmaXJzdCoqXG4gICAgLy8gZWxlbWVudCBpbiB0aGUgdGFibGUuIFNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVE1ML0VsZW1lbnQvY2FwdGlvblxuICAgIGBcbiAgPG5nLWNvbnRlbnQgc2VsZWN0PVwiY2FwdGlvblwiPjwvbmctY29udGVudD5cbiAgPG5nLWNvbnRhaW5lciBoZWFkZXJSb3dPdXRsZXQ+PC9uZy1jb250YWluZXI+XG4gIDxuZy1jb250YWluZXIgcm93T3V0bGV0PjwvbmctY29udGFpbmVyPlxuICA8bmctY29udGFpbmVyIGZvb3RlclJvd091dGxldD48L25nLWNvbnRhaW5lcj5cbmA7XG5cbi8qKlxuICogSW50ZXJmYWNlIHVzZWQgdG8gY29udmVuaWVudGx5IHR5cGUgdGhlIHBvc3NpYmxlIGNvbnRleHQgaW50ZXJmYWNlcyBmb3IgdGhlIHJlbmRlciByb3cuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUm93Q29udGV4dDxUPiBleHRlbmRzIENka0NlbGxPdXRsZXRNdWx0aVJvd0NvbnRleHQ8VD4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDZGtDZWxsT3V0bGV0Um93Q29udGV4dDxUPiB7fVxuXG4vKipcbiAqIENsYXNzIHVzZWQgdG8gY29udmVuaWVudGx5IHR5cGUgdGhlIGVtYmVkZGVkIHZpZXcgcmVmIGZvciByb3dzIHdpdGggYSBjb250ZXh0LlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5hYnN0cmFjdCBjbGFzcyBSb3dWaWV3UmVmPFQ+IGV4dGVuZHMgRW1iZWRkZWRWaWV3UmVmPFJvd0NvbnRleHQ8VD4+IHt9XG5cbi8qKlxuICogU2V0IG9mIHByb3BlcnRpZXMgdGhhdCByZXByZXNlbnRzIHRoZSBpZGVudGl0eSBvZiBhIHNpbmdsZSByZW5kZXJlZCByb3cuXG4gKlxuICogV2hlbiB0aGUgdGFibGUgbmVlZHMgdG8gZGV0ZXJtaW5lIHRoZSBsaXN0IG9mIHJvd3MgdG8gcmVuZGVyLCBpdCB3aWxsIGRvIHNvIGJ5IGl0ZXJhdGluZyB0aHJvdWdoXG4gKiBlYWNoIGRhdGEgb2JqZWN0IGFuZCBldmFsdWF0aW5nIGl0cyBsaXN0IG9mIHJvdyB0ZW1wbGF0ZXMgdG8gZGlzcGxheSAod2hlbiBtdWx0aVRlbXBsYXRlRGF0YVJvd3NcbiAqIGlzIGZhbHNlLCB0aGVyZSBpcyBvbmx5IG9uZSB0ZW1wbGF0ZSBwZXIgZGF0YSBvYmplY3QpLiBGb3IgZWFjaCBwYWlyIG9mIGRhdGEgb2JqZWN0IGFuZCByb3dcbiAqIHRlbXBsYXRlLCBhIGBSZW5kZXJSb3dgIGlzIGFkZGVkIHRvIHRoZSBsaXN0IG9mIHJvd3MgdG8gcmVuZGVyLiBJZiB0aGUgZGF0YSBvYmplY3QgYW5kIHJvd1xuICogdGVtcGxhdGUgcGFpciBoYXMgYWxyZWFkeSBiZWVuIHJlbmRlcmVkLCB0aGUgcHJldmlvdXNseSB1c2VkIGBSZW5kZXJSb3dgIGlzIGFkZGVkOyBlbHNlIGEgbmV3XG4gKiBgUmVuZGVyUm93YCBpcyAqIGNyZWF0ZWQuIE9uY2UgdGhlIGxpc3QgaXMgY29tcGxldGUgYW5kIGFsbCBkYXRhIG9iamVjdHMgaGF2ZSBiZWVuIGl0ZXJlYXRlZFxuICogdGhyb3VnaCwgYSBkaWZmIGlzIHBlcmZvcm1lZCB0byBkZXRlcm1pbmUgdGhlIGNoYW5nZXMgdGhhdCBuZWVkIHRvIGJlIG1hZGUgdG8gdGhlIHJlbmRlcmVkIHJvd3MuXG4gKlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJlbmRlclJvdzxUPiB7XG4gIGRhdGE6IFQ7XG4gIGRhdGFJbmRleDogbnVtYmVyO1xuICByb3dEZWY6IENka1Jvd0RlZjxUPjtcbn1cblxuLyoqXG4gKiBBIGRhdGEgdGFibGUgdGhhdCBjYW4gcmVuZGVyIGEgaGVhZGVyIHJvdywgZGF0YSByb3dzLCBhbmQgYSBmb290ZXIgcm93LlxuICogVXNlcyB0aGUgZGF0YVNvdXJjZSBpbnB1dCB0byBkZXRlcm1pbmUgdGhlIGRhdGEgdG8gYmUgcmVuZGVyZWQuIFRoZSBkYXRhIGNhbiBiZSBwcm92aWRlZCBlaXRoZXJcbiAqIGFzIGEgZGF0YSBhcnJheSwgYW4gT2JzZXJ2YWJsZSBzdHJlYW0gdGhhdCBlbWl0cyB0aGUgZGF0YSBhcnJheSB0byByZW5kZXIsIG9yIGEgRGF0YVNvdXJjZSB3aXRoIGFcbiAqIGNvbm5lY3QgZnVuY3Rpb24gdGhhdCB3aWxsIHJldHVybiBhbiBPYnNlcnZhYmxlIHN0cmVhbSB0aGF0IGVtaXRzIHRoZSBkYXRhIGFycmF5IHRvIHJlbmRlci5cbiAqL1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAnY2RrLXRhYmxlLCB0YWJsZVtjZGstdGFibGVdJyxcbiAgZXhwb3J0QXM6ICdjZGtUYWJsZScsXG4gIHRlbXBsYXRlOiBDREtfVEFCTEVfVEVNUExBVEUsXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLXRhYmxlJyxcbiAgfSxcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcbiAgLy8gVGhlIFwiT25QdXNoXCIgc3RhdHVzIGZvciB0aGUgYE1hdFRhYmxlYCBjb21wb25lbnQgaXMgZWZmZWN0aXZlbHkgYSBub29wLCBzbyB3ZSBhcmUgcmVtb3ZpbmcgaXQuXG4gIC8vIFRoZSB2aWV3IGZvciBgTWF0VGFibGVgIGNvbnNpc3RzIGVudGlyZWx5IG9mIHRlbXBsYXRlcyBkZWNsYXJlZCBpbiBvdGhlciB2aWV3cy4gQXMgdGhleSBhcmVcbiAgLy8gZGVjbGFyZWQgZWxzZXdoZXJlLCB0aGV5IGFyZSBjaGVja2VkIHdoZW4gdGhlaXIgZGVjbGFyYXRpb24gcG9pbnRzIGFyZSBjaGVja2VkLlxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6dmFsaWRhdGUtZGVjb3JhdG9yc1xuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5LkRlZmF1bHQsXG59KVxuZXhwb3J0IGNsYXNzIENka1RhYmxlPFQ+IGltcGxlbWVudHMgQWZ0ZXJDb250ZW50Q2hlY2tlZCwgQ29sbGVjdGlvblZpZXdlciwgT25EZXN0cm95LCBPbkluaXQge1xuICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQ7XG5cbiAgLyoqIExhdGVzdCBkYXRhIHByb3ZpZGVkIGJ5IHRoZSBkYXRhIHNvdXJjZS4gKi9cbiAgcHJvdGVjdGVkIF9kYXRhOiBUW118UmVhZG9ubHlBcnJheTxUPjtcblxuICAvKiogU3ViamVjdCB0aGF0IGVtaXRzIHdoZW4gdGhlIGNvbXBvbmVudCBoYXMgYmVlbiBkZXN0cm95ZWQuICovXG4gIHByaXZhdGUgX29uRGVzdHJveSA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIExpc3Qgb2YgdGhlIHJlbmRlcmVkIHJvd3MgYXMgaWRlbnRpZmllZCBieSB0aGVpciBgUmVuZGVyUm93YCBvYmplY3QuICovXG4gIHByaXZhdGUgX3JlbmRlclJvd3M6IFJlbmRlclJvdzxUPltdO1xuXG4gIC8qKiBTdWJzY3JpcHRpb24gdGhhdCBsaXN0ZW5zIGZvciB0aGUgZGF0YSBwcm92aWRlZCBieSB0aGUgZGF0YSBzb3VyY2UuICovXG4gIHByaXZhdGUgX3JlbmRlckNoYW5nZVN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9ufG51bGw7XG5cbiAgLyoqXG4gICAqIE1hcCBvZiBhbGwgdGhlIHVzZXIncyBkZWZpbmVkIGNvbHVtbnMgKGhlYWRlciwgZGF0YSwgYW5kIGZvb3RlciBjZWxsIHRlbXBsYXRlKSBpZGVudGlmaWVkIGJ5XG4gICAqIG5hbWUuIENvbGxlY3Rpb24gcG9wdWxhdGVkIGJ5IHRoZSBjb2x1bW4gZGVmaW5pdGlvbnMgZ2F0aGVyZWQgYnkgYENvbnRlbnRDaGlsZHJlbmAgYXMgd2VsbCBhc1xuICAgKiBhbnkgY3VzdG9tIGNvbHVtbiBkZWZpbml0aW9ucyBhZGRlZCB0byBgX2N1c3RvbUNvbHVtbkRlZnNgLlxuICAgKi9cbiAgcHJpdmF0ZSBfY29sdW1uRGVmc0J5TmFtZSA9IG5ldyBNYXA8c3RyaW5nLCBDZGtDb2x1bW5EZWY+KCk7XG5cbiAgLyoqXG4gICAqIFNldCBvZiBhbGwgcm93IGRlZmluaXRpb25zIHRoYXQgY2FuIGJlIHVzZWQgYnkgdGhpcyB0YWJsZS4gUG9wdWxhdGVkIGJ5IHRoZSByb3dzIGdhdGhlcmVkIGJ5XG4gICAqIHVzaW5nIGBDb250ZW50Q2hpbGRyZW5gIGFzIHdlbGwgYXMgYW55IGN1c3RvbSByb3cgZGVmaW5pdGlvbnMgYWRkZWQgdG8gYF9jdXN0b21Sb3dEZWZzYC5cbiAgICovXG4gIHByaXZhdGUgX3Jvd0RlZnM6IENka1Jvd0RlZjxUPltdO1xuXG4gIC8qKlxuICAgKiBTZXQgb2YgYWxsIGhlYWRlciByb3cgZGVmaW5pdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCBieSB0aGlzIHRhYmxlLiBQb3B1bGF0ZWQgYnkgdGhlIHJvd3NcbiAgICogZ2F0aGVyZWQgYnkgdXNpbmcgYENvbnRlbnRDaGlsZHJlbmAgYXMgd2VsbCBhcyBhbnkgY3VzdG9tIHJvdyBkZWZpbml0aW9ucyBhZGRlZCB0b1xuICAgKiBgX2N1c3RvbUhlYWRlclJvd0RlZnNgLlxuICAgKi9cbiAgcHJpdmF0ZSBfaGVhZGVyUm93RGVmczogQ2RrSGVhZGVyUm93RGVmW107XG5cbiAgLyoqXG4gICAqIFNldCBvZiBhbGwgcm93IGRlZmluaXRpb25zIHRoYXQgY2FuIGJlIHVzZWQgYnkgdGhpcyB0YWJsZS4gUG9wdWxhdGVkIGJ5IHRoZSByb3dzIGdhdGhlcmVkIGJ5XG4gICAqIHVzaW5nIGBDb250ZW50Q2hpbGRyZW5gIGFzIHdlbGwgYXMgYW55IGN1c3RvbSByb3cgZGVmaW5pdGlvbnMgYWRkZWQgdG9cbiAgICogYF9jdXN0b21Gb290ZXJSb3dEZWZzYC5cbiAgICovXG4gIHByaXZhdGUgX2Zvb3RlclJvd0RlZnM6IENka0Zvb3RlclJvd0RlZltdO1xuXG4gIC8qKiBEaWZmZXIgdXNlZCB0byBmaW5kIHRoZSBjaGFuZ2VzIGluIHRoZSBkYXRhIHByb3ZpZGVkIGJ5IHRoZSBkYXRhIHNvdXJjZS4gKi9cbiAgcHJpdmF0ZSBfZGF0YURpZmZlcjogSXRlcmFibGVEaWZmZXI8UmVuZGVyUm93PFQ+PjtcblxuICAvKiogU3RvcmVzIHRoZSByb3cgZGVmaW5pdGlvbiB0aGF0IGRvZXMgbm90IGhhdmUgYSB3aGVuIHByZWRpY2F0ZS4gKi9cbiAgcHJpdmF0ZSBfZGVmYXVsdFJvd0RlZjogQ2RrUm93RGVmPFQ+fG51bGw7XG5cbiAgLyoqXG4gICAqIENvbHVtbiBkZWZpbml0aW9ucyB0aGF0IHdlcmUgZGVmaW5lZCBvdXRzaWRlIG9mIHRoZSBkaXJlY3QgY29udGVudCBjaGlsZHJlbiBvZiB0aGUgdGFibGUuXG4gICAqIFRoZXNlIHdpbGwgYmUgZGVmaW5lZCB3aGVuLCBlLmcuLCBjcmVhdGluZyBhIHdyYXBwZXIgYXJvdW5kIHRoZSBjZGtUYWJsZSB0aGF0IGhhc1xuICAgKiBjb2x1bW4gZGVmaW5pdGlvbnMgYXMgKml0cyogY29udGVudCBjaGlsZC5cbiAgICovXG4gIHByaXZhdGUgX2N1c3RvbUNvbHVtbkRlZnMgPSBuZXcgU2V0PENka0NvbHVtbkRlZj4oKTtcblxuICAvKipcbiAgICogRGF0YSByb3cgZGVmaW5pdGlvbnMgdGhhdCB3ZXJlIGRlZmluZWQgb3V0c2lkZSBvZiB0aGUgZGlyZWN0IGNvbnRlbnQgY2hpbGRyZW4gb2YgdGhlIHRhYmxlLlxuICAgKiBUaGVzZSB3aWxsIGJlIGRlZmluZWQgd2hlbiwgZS5nLiwgY3JlYXRpbmcgYSB3cmFwcGVyIGFyb3VuZCB0aGUgY2RrVGFibGUgdGhhdCBoYXNcbiAgICogYnVpbHQtaW4gZGF0YSByb3dzIGFzICppdHMqIGNvbnRlbnQgY2hpbGQuXG4gICAqL1xuICBwcml2YXRlIF9jdXN0b21Sb3dEZWZzID0gbmV3IFNldDxDZGtSb3dEZWY8VD4+KCk7XG5cbiAgLyoqXG4gICAqIEhlYWRlciByb3cgZGVmaW5pdGlvbnMgdGhhdCB3ZXJlIGRlZmluZWQgb3V0c2lkZSBvZiB0aGUgZGlyZWN0IGNvbnRlbnQgY2hpbGRyZW4gb2YgdGhlIHRhYmxlLlxuICAgKiBUaGVzZSB3aWxsIGJlIGRlZmluZWQgd2hlbiwgZS5nLiwgY3JlYXRpbmcgYSB3cmFwcGVyIGFyb3VuZCB0aGUgY2RrVGFibGUgdGhhdCBoYXNcbiAgICogYnVpbHQtaW4gaGVhZGVyIHJvd3MgYXMgKml0cyogY29udGVudCBjaGlsZC5cbiAgICovXG4gIHByaXZhdGUgX2N1c3RvbUhlYWRlclJvd0RlZnMgPSBuZXcgU2V0PENka0hlYWRlclJvd0RlZj4oKTtcblxuICAvKipcbiAgICogRm9vdGVyIHJvdyBkZWZpbml0aW9ucyB0aGF0IHdlcmUgZGVmaW5lZCBvdXRzaWRlIG9mIHRoZSBkaXJlY3QgY29udGVudCBjaGlsZHJlbiBvZiB0aGUgdGFibGUuXG4gICAqIFRoZXNlIHdpbGwgYmUgZGVmaW5lZCB3aGVuLCBlLmcuLCBjcmVhdGluZyBhIHdyYXBwZXIgYXJvdW5kIHRoZSBjZGtUYWJsZSB0aGF0IGhhcyBhXG4gICAqIGJ1aWx0LWluIGZvb3RlciByb3cgYXMgKml0cyogY29udGVudCBjaGlsZC5cbiAgICovXG4gIHByaXZhdGUgX2N1c3RvbUZvb3RlclJvd0RlZnMgPSBuZXcgU2V0PENka0Zvb3RlclJvd0RlZj4oKTtcblxuICAvKipcbiAgICogV2hldGhlciB0aGUgaGVhZGVyIHJvdyBkZWZpbml0aW9uIGhhcyBiZWVuIGNoYW5nZWQuIFRyaWdnZXJzIGFuIHVwZGF0ZSB0byB0aGUgaGVhZGVyIHJvdyBhZnRlclxuICAgKiBjb250ZW50IGlzIGNoZWNrZWQuIEluaXRpYWxpemVkIGFzIHRydWUgc28gdGhhdCB0aGUgdGFibGUgcmVuZGVycyB0aGUgaW5pdGlhbCBzZXQgb2Ygcm93cy5cbiAgICovXG4gIHByaXZhdGUgX2hlYWRlclJvd0RlZkNoYW5nZWQgPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBmb290ZXIgcm93IGRlZmluaXRpb24gaGFzIGJlZW4gY2hhbmdlZC4gVHJpZ2dlcnMgYW4gdXBkYXRlIHRvIHRoZSBmb290ZXIgcm93IGFmdGVyXG4gICAqIGNvbnRlbnQgaXMgY2hlY2tlZC4gSW5pdGlhbGl6ZWQgYXMgdHJ1ZSBzbyB0aGF0IHRoZSB0YWJsZSByZW5kZXJzIHRoZSBpbml0aWFsIHNldCBvZiByb3dzLlxuICAgKi9cbiAgcHJpdmF0ZSBfZm9vdGVyUm93RGVmQ2hhbmdlZCA9IHRydWU7XG5cbiAgLyoqXG4gICAqIENhY2hlIG9mIHRoZSBsYXRlc3QgcmVuZGVyZWQgYFJlbmRlclJvd2Agb2JqZWN0cyBhcyBhIG1hcCBmb3IgZWFzeSByZXRyaWV2YWwgd2hlbiBjb25zdHJ1Y3RpbmdcbiAgICogYSBuZXcgbGlzdCBvZiBgUmVuZGVyUm93YCBvYmplY3RzIGZvciByZW5kZXJpbmcgcm93cy4gU2luY2UgdGhlIG5ldyBsaXN0IGlzIGNvbnN0cnVjdGVkIHdpdGhcbiAgICogdGhlIGNhY2hlZCBgUmVuZGVyUm93YCBvYmplY3RzIHdoZW4gcG9zc2libGUsIHRoZSByb3cgaWRlbnRpdHkgaXMgcHJlc2VydmVkIHdoZW4gdGhlIGRhdGFcbiAgICogYW5kIHJvdyB0ZW1wbGF0ZSBtYXRjaGVzLCB3aGljaCBhbGxvd3MgdGhlIGBJdGVyYWJsZURpZmZlcmAgdG8gY2hlY2sgcm93cyBieSByZWZlcmVuY2VcbiAgICogYW5kIHVuZGVyc3RhbmQgd2hpY2ggcm93cyBhcmUgYWRkZWQvbW92ZWQvcmVtb3ZlZC5cbiAgICpcbiAgICogSW1wbGVtZW50ZWQgYXMgYSBtYXAgb2YgbWFwcyB3aGVyZSB0aGUgZmlyc3Qga2V5IGlzIHRoZSBgZGF0YTogVGAgb2JqZWN0IGFuZCB0aGUgc2Vjb25kIGlzIHRoZVxuICAgKiBgQ2RrUm93RGVmPFQ+YCBvYmplY3QuIFdpdGggdGhlIHR3byBrZXlzLCB0aGUgY2FjaGUgcG9pbnRzIHRvIGEgYFJlbmRlclJvdzxUPmAgb2JqZWN0IHRoYXRcbiAgICogY29udGFpbnMgYW4gYXJyYXkgb2YgY3JlYXRlZCBwYWlycy4gVGhlIGFycmF5IGlzIG5lY2Vzc2FyeSB0byBoYW5kbGUgY2FzZXMgd2hlcmUgdGhlIGRhdGFcbiAgICogYXJyYXkgY29udGFpbnMgbXVsdGlwbGUgZHVwbGljYXRlIGRhdGEgb2JqZWN0cyBhbmQgZWFjaCBpbnN0YW50aWF0ZWQgYFJlbmRlclJvd2AgbXVzdCBiZVxuICAgKiBzdG9yZWQuXG4gICAqL1xuICBwcml2YXRlIF9jYWNoZWRSZW5kZXJSb3dzTWFwID0gbmV3IE1hcDxULCBXZWFrTWFwPENka1Jvd0RlZjxUPiwgUmVuZGVyUm93PFQ+W10+PigpO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSB0YWJsZSBpcyBhcHBsaWVkIHRvIGEgbmF0aXZlIGA8dGFibGU+YC4gKi9cbiAgcHJpdmF0ZSBfaXNOYXRpdmVIdG1sVGFibGU6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFV0aWxpdHkgY2xhc3MgdGhhdCBpcyByZXNwb25zaWJsZSBmb3IgYXBwbHlpbmcgdGhlIGFwcHJvcHJpYXRlIHN0aWNreSBwb3NpdGlvbmluZyBzdHlsZXMgdG9cbiAgICogdGhlIHRhYmxlJ3Mgcm93cyBhbmQgY2VsbHMuXG4gICAqL1xuICBwcml2YXRlIF9zdGlja3lTdHlsZXI6IFN0aWNreVN0eWxlcjtcblxuICAvKipcbiAgICogQ1NTIGNsYXNzIGFkZGVkIHRvIGFueSByb3cgb3IgY2VsbCB0aGF0IGhhcyBzdGlja3kgcG9zaXRpb25pbmcgYXBwbGllZC4gTWF5IGJlIG92ZXJyaWRlbiBieVxuICAgKiB0YWJsZSBzdWJjbGFzc2VzLlxuICAgKi9cbiAgcHJvdGVjdGVkIHN0aWNreUNzc0NsYXNzOiBzdHJpbmcgPSAnY2RrLXRhYmxlLXN0aWNreSc7XG5cbiAgLyoqXG4gICAqIFRyYWNraW5nIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGNoZWNrIHRoZSBkaWZmZXJlbmNlcyBpbiBkYXRhIGNoYW5nZXMuIFVzZWQgc2ltaWxhcmx5XG4gICAqIHRvIGBuZ0ZvcmAgYHRyYWNrQnlgIGZ1bmN0aW9uLiBPcHRpbWl6ZSByb3cgb3BlcmF0aW9ucyBieSBpZGVudGlmeWluZyBhIHJvdyBiYXNlZCBvbiBpdHMgZGF0YVxuICAgKiByZWxhdGl2ZSB0byB0aGUgZnVuY3Rpb24gdG8ga25vdyBpZiBhIHJvdyBzaG91bGQgYmUgYWRkZWQvcmVtb3ZlZC9tb3ZlZC5cbiAgICogQWNjZXB0cyBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgdHdvIHBhcmFtZXRlcnMsIGBpbmRleGAgYW5kIGBpdGVtYC5cbiAgICovXG4gIEBJbnB1dCgpXG4gIGdldCB0cmFja0J5KCk6IFRyYWNrQnlGdW5jdGlvbjxUPiB7XG4gICAgcmV0dXJuIHRoaXMuX3RyYWNrQnlGbjtcbiAgfVxuICBzZXQgdHJhY2tCeShmbjogVHJhY2tCeUZ1bmN0aW9uPFQ+KSB7XG4gICAgaWYgKGlzRGV2TW9kZSgpICYmIGZuICE9IG51bGwgJiYgdHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nICYmIDxhbnk+Y29uc29sZSAmJlxuICAgICAgICA8YW55PmNvbnNvbGUud2Fybikge1xuICAgICAgY29uc29sZS53YXJuKGB0cmFja0J5IG11c3QgYmUgYSBmdW5jdGlvbiwgYnV0IHJlY2VpdmVkICR7SlNPTi5zdHJpbmdpZnkoZm4pfS5gKTtcbiAgICB9XG4gICAgdGhpcy5fdHJhY2tCeUZuID0gZm47XG4gIH1cbiAgcHJpdmF0ZSBfdHJhY2tCeUZuOiBUcmFja0J5RnVuY3Rpb248VD47XG5cbiAgLyoqXG4gICAqIFRoZSB0YWJsZSdzIHNvdXJjZSBvZiBkYXRhLCB3aGljaCBjYW4gYmUgcHJvdmlkZWQgaW4gdGhyZWUgd2F5cyAoaW4gb3JkZXIgb2YgY29tcGxleGl0eSk6XG4gICAqICAgLSBTaW1wbGUgZGF0YSBhcnJheSAoZWFjaCBvYmplY3QgcmVwcmVzZW50cyBvbmUgdGFibGUgcm93KVxuICAgKiAgIC0gU3RyZWFtIHRoYXQgZW1pdHMgYSBkYXRhIGFycmF5IGVhY2ggdGltZSB0aGUgYXJyYXkgY2hhbmdlc1xuICAgKiAgIC0gYERhdGFTb3VyY2VgIG9iamVjdCB0aGF0IGltcGxlbWVudHMgdGhlIGNvbm5lY3QvZGlzY29ubmVjdCBpbnRlcmZhY2UuXG4gICAqXG4gICAqIElmIGEgZGF0YSBhcnJheSBpcyBwcm92aWRlZCwgdGhlIHRhYmxlIG11c3QgYmUgbm90aWZpZWQgd2hlbiB0aGUgYXJyYXkncyBvYmplY3RzIGFyZVxuICAgKiBhZGRlZCwgcmVtb3ZlZCwgb3IgbW92ZWQuIFRoaXMgY2FuIGJlIGRvbmUgYnkgY2FsbGluZyB0aGUgYHJlbmRlclJvd3MoKWAgZnVuY3Rpb24gd2hpY2ggd2lsbFxuICAgKiByZW5kZXIgdGhlIGRpZmYgc2luY2UgdGhlIGxhc3QgdGFibGUgcmVuZGVyLiBJZiB0aGUgZGF0YSBhcnJheSByZWZlcmVuY2UgaXMgY2hhbmdlZCwgdGhlIHRhYmxlXG4gICAqIHdpbGwgYXV0b21hdGljYWxseSB0cmlnZ2VyIGFuIHVwZGF0ZSB0byB0aGUgcm93cy5cbiAgICpcbiAgICogV2hlbiBwcm92aWRpbmcgYW4gT2JzZXJ2YWJsZSBzdHJlYW0sIHRoZSB0YWJsZSB3aWxsIHRyaWdnZXIgYW4gdXBkYXRlIGF1dG9tYXRpY2FsbHkgd2hlbiB0aGVcbiAgICogc3RyZWFtIGVtaXRzIGEgbmV3IGFycmF5IG9mIGRhdGEuXG4gICAqXG4gICAqIEZpbmFsbHksIHdoZW4gcHJvdmlkaW5nIGEgYERhdGFTb3VyY2VgIG9iamVjdCwgdGhlIHRhYmxlIHdpbGwgdXNlIHRoZSBPYnNlcnZhYmxlIHN0cmVhbVxuICAgKiBwcm92aWRlZCBieSB0aGUgY29ubmVjdCBmdW5jdGlvbiBhbmQgdHJpZ2dlciB1cGRhdGVzIHdoZW4gdGhhdCBzdHJlYW0gZW1pdHMgbmV3IGRhdGEgYXJyYXlcbiAgICogdmFsdWVzLiBEdXJpbmcgdGhlIHRhYmxlJ3MgbmdPbkRlc3Ryb3kgb3Igd2hlbiB0aGUgZGF0YSBzb3VyY2UgaXMgcmVtb3ZlZCBmcm9tIHRoZSB0YWJsZSwgdGhlXG4gICAqIHRhYmxlIHdpbGwgY2FsbCB0aGUgRGF0YVNvdXJjZSdzIGBkaXNjb25uZWN0YCBmdW5jdGlvbiAobWF5IGJlIHVzZWZ1bCBmb3IgY2xlYW5pbmcgdXAgYW55XG4gICAqIHN1YnNjcmlwdGlvbnMgcmVnaXN0ZXJlZCBkdXJpbmcgdGhlIGNvbm5lY3QgcHJvY2VzcykuXG4gICAqL1xuICBASW5wdXQoKVxuICBnZXQgZGF0YVNvdXJjZSgpOiBDZGtUYWJsZURhdGFTb3VyY2VJbnB1dDxUPiB7XG4gICAgcmV0dXJuIHRoaXMuX2RhdGFTb3VyY2U7XG4gIH1cbiAgc2V0IGRhdGFTb3VyY2UoZGF0YVNvdXJjZTogQ2RrVGFibGVEYXRhU291cmNlSW5wdXQ8VD4pIHtcbiAgICBpZiAodGhpcy5fZGF0YVNvdXJjZSAhPT0gZGF0YVNvdXJjZSkge1xuICAgICAgdGhpcy5fc3dpdGNoRGF0YVNvdXJjZShkYXRhU291cmNlKTtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBfZGF0YVNvdXJjZTogQ2RrVGFibGVEYXRhU291cmNlSW5wdXQ8VD47XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdG8gYWxsb3cgbXVsdGlwbGUgcm93cyBwZXIgZGF0YSBvYmplY3QgYnkgZXZhbHVhdGluZyB3aGljaCByb3dzIGV2YWx1YXRlIHRoZWlyICd3aGVuJ1xuICAgKiBwcmVkaWNhdGUgdG8gdHJ1ZS4gSWYgYG11bHRpVGVtcGxhdGVEYXRhUm93c2AgaXMgZmFsc2UsIHdoaWNoIGlzIHRoZSBkZWZhdWx0IHZhbHVlLCB0aGVuIGVhY2hcbiAgICogZGF0YW9iamVjdCB3aWxsIHJlbmRlciB0aGUgZmlyc3Qgcm93IHRoYXQgZXZhbHVhdGVzIGl0cyB3aGVuIHByZWRpY2F0ZSB0byB0cnVlLCBpbiB0aGUgb3JkZXJcbiAgICogZGVmaW5lZCBpbiB0aGUgdGFibGUsIG9yIG90aGVyd2lzZSB0aGUgZGVmYXVsdCByb3cgd2hpY2ggZG9lcyBub3QgaGF2ZSBhIHdoZW4gcHJlZGljYXRlLlxuICAgKi9cbiAgQElucHV0KClcbiAgZ2V0IG11bHRpVGVtcGxhdGVEYXRhUm93cygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fbXVsdGlUZW1wbGF0ZURhdGFSb3dzO1xuICB9XG4gIHNldCBtdWx0aVRlbXBsYXRlRGF0YVJvd3ModjogYm9vbGVhbikge1xuICAgIHRoaXMuX211bHRpVGVtcGxhdGVEYXRhUm93cyA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2KTtcblxuICAgIC8vIEluIEl2eSBpZiB0aGlzIHZhbHVlIGlzIHNldCB2aWEgYSBzdGF0aWMgYXR0cmlidXRlIChlLmcuIDx0YWJsZSBtdWx0aVRlbXBsYXRlRGF0YVJvd3M+KSxcbiAgICAvLyB0aGlzIHNldHRlciB3aWxsIGJlIGludm9rZWQgYmVmb3JlIHRoZSByb3cgb3V0bGV0IGhhcyBiZWVuIGRlZmluZWQgaGVuY2UgdGhlIG51bGwgY2hlY2suXG4gICAgaWYgKHRoaXMuX3Jvd091dGxldCAmJiB0aGlzLl9yb3dPdXRsZXQudmlld0NvbnRhaW5lci5sZW5ndGgpIHtcbiAgICAgIHRoaXMuX2ZvcmNlUmVuZGVyRGF0YVJvd3MoKTtcbiAgICB9XG4gIH1cbiAgX211bHRpVGVtcGxhdGVEYXRhUm93czogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8vIFRPRE8oYW5kcmV3c2VndWluKTogUmVtb3ZlIG1heCB2YWx1ZSBhcyB0aGUgZW5kIGluZGV4XG4gIC8vICAgYW5kIGluc3RlYWQgY2FsY3VsYXRlIHRoZSB2aWV3IG9uIGluaXQgYW5kIHNjcm9sbC5cbiAgLyoqXG4gICAqIFN0cmVhbSBjb250YWluaW5nIHRoZSBsYXRlc3QgaW5mb3JtYXRpb24gb24gd2hhdCByb3dzIGFyZSBiZWluZyBkaXNwbGF5ZWQgb24gc2NyZWVuLlxuICAgKiBDYW4gYmUgdXNlZCBieSB0aGUgZGF0YSBzb3VyY2UgdG8gYXMgYSBoZXVyaXN0aWMgb2Ygd2hhdCBkYXRhIHNob3VsZCBiZSBwcm92aWRlZC5cbiAgICpcbiAgICogQGRvY3MtcHJpdmF0ZVxuICAgKi9cbiAgdmlld0NoYW5nZTogQmVoYXZpb3JTdWJqZWN0PHtzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcn0+ID1cbiAgICAgIG5ldyBCZWhhdmlvclN1YmplY3Q8e3N0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyfT4oe3N0YXJ0OiAwLCBlbmQ6IE51bWJlci5NQVhfVkFMVUV9KTtcblxuICAvLyBPdXRsZXRzIGluIHRoZSB0YWJsZSdzIHRlbXBsYXRlIHdoZXJlIHRoZSBoZWFkZXIsIGRhdGEgcm93cywgYW5kIGZvb3RlciB3aWxsIGJlIGluc2VydGVkLlxuICBAVmlld0NoaWxkKERhdGFSb3dPdXRsZXQsIHtzdGF0aWM6IHRydWV9KSBfcm93T3V0bGV0OiBEYXRhUm93T3V0bGV0O1xuICBAVmlld0NoaWxkKEhlYWRlclJvd091dGxldCwge3N0YXRpYzogdHJ1ZX0pIF9oZWFkZXJSb3dPdXRsZXQ6IEhlYWRlclJvd091dGxldDtcbiAgQFZpZXdDaGlsZChGb290ZXJSb3dPdXRsZXQsIHtzdGF0aWM6IHRydWV9KSBfZm9vdGVyUm93T3V0bGV0OiBGb290ZXJSb3dPdXRsZXQ7XG5cbiAgLyoqXG4gICAqIFRoZSBjb2x1bW4gZGVmaW5pdGlvbnMgcHJvdmlkZWQgYnkgdGhlIHVzZXIgdGhhdCBjb250YWluIHdoYXQgdGhlIGhlYWRlciwgZGF0YSwgYW5kIGZvb3RlclxuICAgKiBjZWxscyBzaG91bGQgcmVuZGVyIGZvciBlYWNoIGNvbHVtbi5cbiAgICovXG4gIEBDb250ZW50Q2hpbGRyZW4oQ2RrQ29sdW1uRGVmLCB7ZGVzY2VuZGFudHM6IHRydWV9KSBfY29udGVudENvbHVtbkRlZnM6IFF1ZXJ5TGlzdDxDZGtDb2x1bW5EZWY+O1xuXG4gIC8qKiBTZXQgb2YgZGF0YSByb3cgZGVmaW5pdGlvbnMgdGhhdCB3ZXJlIHByb3ZpZGVkIHRvIHRoZSB0YWJsZSBhcyBjb250ZW50IGNoaWxkcmVuLiAqL1xuICBAQ29udGVudENoaWxkcmVuKENka1Jvd0RlZiwge2Rlc2NlbmRhbnRzOiB0cnVlfSkgX2NvbnRlbnRSb3dEZWZzOiBRdWVyeUxpc3Q8Q2RrUm93RGVmPFQ+PjtcblxuICAvKiogU2V0IG9mIGhlYWRlciByb3cgZGVmaW5pdGlvbnMgdGhhdCB3ZXJlIHByb3ZpZGVkIHRvIHRoZSB0YWJsZSBhcyBjb250ZW50IGNoaWxkcmVuLiAqL1xuICBAQ29udGVudENoaWxkcmVuKENka0hlYWRlclJvd0RlZiwge1xuICAgIGRlc2NlbmRhbnRzOiB0cnVlXG4gIH0pIF9jb250ZW50SGVhZGVyUm93RGVmczogUXVlcnlMaXN0PENka0hlYWRlclJvd0RlZj47XG5cbiAgLyoqIFNldCBvZiBmb290ZXIgcm93IGRlZmluaXRpb25zIHRoYXQgd2VyZSBwcm92aWRlZCB0byB0aGUgdGFibGUgYXMgY29udGVudCBjaGlsZHJlbi4gKi9cbiAgQENvbnRlbnRDaGlsZHJlbihDZGtGb290ZXJSb3dEZWYsIHtcbiAgICBkZXNjZW5kYW50czogdHJ1ZVxuICB9KSBfY29udGVudEZvb3RlclJvd0RlZnM6IFF1ZXJ5TGlzdDxDZGtGb290ZXJSb3dEZWY+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJvdGVjdGVkIHJlYWRvbmx5IF9kaWZmZXJzOiBJdGVyYWJsZURpZmZlcnMsXG4gICAgICBwcm90ZWN0ZWQgcmVhZG9ubHkgX2NoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICAgIHByb3RlY3RlZCByZWFkb25seSBfZWxlbWVudFJlZjogRWxlbWVudFJlZiwgQEF0dHJpYnV0ZSgncm9sZScpIHJvbGU6IHN0cmluZyxcbiAgICAgIEBPcHRpb25hbCgpIHByb3RlY3RlZCByZWFkb25seSBfZGlyOiBEaXJlY3Rpb25hbGl0eSwgQEluamVjdChET0NVTUVOVCkgX2RvY3VtZW50OiBhbnksXG4gICAgICBwcml2YXRlIF9wbGF0Zm9ybTogUGxhdGZvcm0pIHtcbiAgICBpZiAoIXJvbGUpIHtcbiAgICAgIHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAnZ3JpZCcpO1xuICAgIH1cblxuICAgIHRoaXMuX2RvY3VtZW50ID0gX2RvY3VtZW50O1xuICAgIHRoaXMuX2lzTmF0aXZlSHRtbFRhYmxlID0gdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50Lm5vZGVOYW1lID09PSAnVEFCTEUnO1xuICB9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgdGhpcy5fc2V0dXBTdGlja3lTdHlsZXIoKTtcblxuICAgIGlmICh0aGlzLl9pc05hdGl2ZUh0bWxUYWJsZSkge1xuICAgICAgdGhpcy5fYXBwbHlOYXRpdmVUYWJsZVNlY3Rpb25zKCk7XG4gICAgfVxuXG4gICAgLy8gU2V0IHVwIHRoZSB0cmFja0J5IGZ1bmN0aW9uIHNvIHRoYXQgaXQgdXNlcyB0aGUgYFJlbmRlclJvd2AgYXMgaXRzIGlkZW50aXR5IGJ5IGRlZmF1bHQuIElmXG4gICAgLy8gdGhlIHVzZXIgaGFzIHByb3ZpZGVkIGEgY3VzdG9tIHRyYWNrQnksIHJldHVybiB0aGUgcmVzdWx0IG9mIHRoYXQgZnVuY3Rpb24gYXMgZXZhbHVhdGVkXG4gICAgLy8gd2l0aCB0aGUgdmFsdWVzIG9mIHRoZSBgUmVuZGVyUm93YCdzIGRhdGEgYW5kIGluZGV4LlxuICAgIHRoaXMuX2RhdGFEaWZmZXIgPSB0aGlzLl9kaWZmZXJzLmZpbmQoW10pLmNyZWF0ZSgoX2k6IG51bWJlciwgZGF0YVJvdzogUmVuZGVyUm93PFQ+KSA9PiB7XG4gICAgICByZXR1cm4gdGhpcy50cmFja0J5ID8gdGhpcy50cmFja0J5KGRhdGFSb3cuZGF0YUluZGV4LCBkYXRhUm93LmRhdGEpIDogZGF0YVJvdztcbiAgICB9KTtcbiAgfVxuXG4gIG5nQWZ0ZXJDb250ZW50Q2hlY2tlZCgpIHtcbiAgICAvLyBDYWNoZSB0aGUgcm93IGFuZCBjb2x1bW4gZGVmaW5pdGlvbnMgZ2F0aGVyZWQgYnkgQ29udGVudENoaWxkcmVuIGFuZCBwcm9ncmFtbWF0aWMgaW5qZWN0aW9uLlxuICAgIHRoaXMuX2NhY2hlUm93RGVmcygpO1xuICAgIHRoaXMuX2NhY2hlQ29sdW1uRGVmcygpO1xuXG4gICAgLy8gTWFrZSBzdXJlIHRoYXQgdGhlIHVzZXIgaGFzIGF0IGxlYXN0IGFkZGVkIGhlYWRlciwgZm9vdGVyLCBvciBkYXRhIHJvdyBkZWYuXG4gICAgaWYgKCF0aGlzLl9oZWFkZXJSb3dEZWZzLmxlbmd0aCAmJiAhdGhpcy5fZm9vdGVyUm93RGVmcy5sZW5ndGggJiYgIXRoaXMuX3Jvd0RlZnMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBnZXRUYWJsZU1pc3NpbmdSb3dEZWZzRXJyb3IoKTtcbiAgICB9XG5cbiAgICAvLyBSZW5kZXIgdXBkYXRlcyBpZiB0aGUgbGlzdCBvZiBjb2x1bW5zIGhhdmUgYmVlbiBjaGFuZ2VkIGZvciB0aGUgaGVhZGVyLCByb3csIG9yIGZvb3RlciBkZWZzLlxuICAgIHRoaXMuX3JlbmRlclVwZGF0ZWRDb2x1bW5zKCk7XG5cbiAgICAvLyBJZiB0aGUgaGVhZGVyIHJvdyBkZWZpbml0aW9uIGhhcyBiZWVuIGNoYW5nZWQsIHRyaWdnZXIgYSByZW5kZXIgdG8gdGhlIGhlYWRlciByb3cuXG4gICAgaWYgKHRoaXMuX2hlYWRlclJvd0RlZkNoYW5nZWQpIHtcbiAgICAgIHRoaXMuX2ZvcmNlUmVuZGVySGVhZGVyUm93cygpO1xuICAgICAgdGhpcy5faGVhZGVyUm93RGVmQ2hhbmdlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBmb290ZXIgcm93IGRlZmluaXRpb24gaGFzIGJlZW4gY2hhbmdlZCwgdHJpZ2dlciBhIHJlbmRlciB0byB0aGUgZm9vdGVyIHJvdy5cbiAgICBpZiAodGhpcy5fZm9vdGVyUm93RGVmQ2hhbmdlZCkge1xuICAgICAgdGhpcy5fZm9yY2VSZW5kZXJGb290ZXJSb3dzKCk7XG4gICAgICB0aGlzLl9mb290ZXJSb3dEZWZDaGFuZ2VkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlcmUgaXMgYSBkYXRhIHNvdXJjZSBhbmQgcm93IGRlZmluaXRpb25zLCBjb25uZWN0IHRvIHRoZSBkYXRhIHNvdXJjZSB1bmxlc3MgYVxuICAgIC8vIGNvbm5lY3Rpb24gaGFzIGFscmVhZHkgYmVlbiBtYWRlLlxuICAgIGlmICh0aGlzLmRhdGFTb3VyY2UgJiYgdGhpcy5fcm93RGVmcy5sZW5ndGggPiAwICYmICF0aGlzLl9yZW5kZXJDaGFuZ2VTdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuX29ic2VydmVSZW5kZXJDaGFuZ2VzKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fY2hlY2tTdGlja3lTdGF0ZXMoKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX3Jvd091dGxldC52aWV3Q29udGFpbmVyLmNsZWFyKCk7XG4gICAgdGhpcy5faGVhZGVyUm93T3V0bGV0LnZpZXdDb250YWluZXIuY2xlYXIoKTtcbiAgICB0aGlzLl9mb290ZXJSb3dPdXRsZXQudmlld0NvbnRhaW5lci5jbGVhcigpO1xuXG4gICAgdGhpcy5fY2FjaGVkUmVuZGVyUm93c01hcC5jbGVhcigpO1xuXG4gICAgdGhpcy5fb25EZXN0cm95Lm5leHQoKTtcbiAgICB0aGlzLl9vbkRlc3Ryb3kuY29tcGxldGUoKTtcblxuICAgIGlmIChpc0RhdGFTb3VyY2UodGhpcy5kYXRhU291cmNlKSkge1xuICAgICAgdGhpcy5kYXRhU291cmNlLmRpc2Nvbm5lY3QodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbmRlcnMgcm93cyBiYXNlZCBvbiB0aGUgdGFibGUncyBsYXRlc3Qgc2V0IG9mIGRhdGEsIHdoaWNoIHdhcyBlaXRoZXIgcHJvdmlkZWQgZGlyZWN0bHkgYXMgYW5cbiAgICogaW5wdXQgb3IgcmV0cmlldmVkIHRocm91Z2ggYW4gT2JzZXJ2YWJsZSBzdHJlYW0gKGRpcmVjdGx5IG9yIGZyb20gYSBEYXRhU291cmNlKS5cbiAgICogQ2hlY2tzIGZvciBkaWZmZXJlbmNlcyBpbiB0aGUgZGF0YSBzaW5jZSB0aGUgbGFzdCBkaWZmIHRvIHBlcmZvcm0gb25seSB0aGUgbmVjZXNzYXJ5XG4gICAqIGNoYW5nZXMgKGFkZC9yZW1vdmUvbW92ZSByb3dzKS5cbiAgICpcbiAgICogSWYgdGhlIHRhYmxlJ3MgZGF0YSBzb3VyY2UgaXMgYSBEYXRhU291cmNlIG9yIE9ic2VydmFibGUsIHRoaXMgd2lsbCBiZSBpbnZva2VkIGF1dG9tYXRpY2FsbHlcbiAgICogZWFjaCB0aW1lIHRoZSBwcm92aWRlZCBPYnNlcnZhYmxlIHN0cmVhbSBlbWl0cyBhIG5ldyBkYXRhIGFycmF5LiBPdGhlcndpc2UgaWYgeW91ciBkYXRhIGlzXG4gICAqIGFuIGFycmF5LCB0aGlzIGZ1bmN0aW9uIHdpbGwgbmVlZCB0byBiZSBjYWxsZWQgdG8gcmVuZGVyIGFueSBjaGFuZ2VzLlxuICAgKi9cbiAgcmVuZGVyUm93cygpIHtcbiAgICB0aGlzLl9yZW5kZXJSb3dzID0gdGhpcy5fZ2V0QWxsUmVuZGVyUm93cygpO1xuICAgIGNvbnN0IGNoYW5nZXMgPSB0aGlzLl9kYXRhRGlmZmVyLmRpZmYodGhpcy5fcmVuZGVyUm93cyk7XG4gICAgaWYgKCFjaGFuZ2VzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgdmlld0NvbnRhaW5lciA9IHRoaXMuX3Jvd091dGxldC52aWV3Q29udGFpbmVyO1xuXG4gICAgY2hhbmdlcy5mb3JFYWNoT3BlcmF0aW9uKFxuICAgICAgICAocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZDxSZW5kZXJSb3c8VD4+LCBwcmV2SW5kZXg6IG51bWJlcnxudWxsLFxuICAgICAgICAgY3VycmVudEluZGV4OiBudW1iZXJ8bnVsbCkgPT4ge1xuICAgICAgICAgIGlmIChyZWNvcmQucHJldmlvdXNJbmRleCA9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9pbnNlcnRSb3cocmVjb3JkLml0ZW0sIGN1cnJlbnRJbmRleCEpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY3VycmVudEluZGV4ID09IG51bGwpIHtcbiAgICAgICAgICAgIHZpZXdDb250YWluZXIucmVtb3ZlKHByZXZJbmRleCEpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCB2aWV3ID0gPFJvd1ZpZXdSZWY8VD4+dmlld0NvbnRhaW5lci5nZXQocHJldkluZGV4ISk7XG4gICAgICAgICAgICB2aWV3Q29udGFpbmVyLm1vdmUodmlldyEsIGN1cnJlbnRJbmRleCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIC8vIFVwZGF0ZSB0aGUgbWV0YSBjb250ZXh0IG9mIGEgcm93J3MgY29udGV4dCBkYXRhIChpbmRleCwgY291bnQsIGZpcnN0LCBsYXN0LCAuLi4pXG4gICAgdGhpcy5fdXBkYXRlUm93SW5kZXhDb250ZXh0KCk7XG5cbiAgICAvLyBVcGRhdGUgcm93cyB0aGF0IGRpZCBub3QgZ2V0IGFkZGVkL3JlbW92ZWQvbW92ZWQgYnV0IG1heSBoYXZlIGhhZCB0aGVpciBpZGVudGl0eSBjaGFuZ2VkLFxuICAgIC8vIGUuZy4gaWYgdHJhY2tCeSBtYXRjaGVkIGRhdGEgb24gc29tZSBwcm9wZXJ0eSBidXQgdGhlIGFjdHVhbCBkYXRhIHJlZmVyZW5jZSBjaGFuZ2VkLlxuICAgIGNoYW5nZXMuZm9yRWFjaElkZW50aXR5Q2hhbmdlKChyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFJlbmRlclJvdzxUPj4pID0+IHtcbiAgICAgIGNvbnN0IHJvd1ZpZXcgPSA8Um93Vmlld1JlZjxUPj52aWV3Q29udGFpbmVyLmdldChyZWNvcmQuY3VycmVudEluZGV4ISk7XG4gICAgICByb3dWaWV3LmNvbnRleHQuJGltcGxpY2l0ID0gcmVjb3JkLml0ZW0uZGF0YTtcbiAgICB9KTtcblxuICAgIHRoaXMudXBkYXRlU3RpY2t5Q29sdW1uU3R5bGVzKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaGVhZGVyIHJvdyBkZWZpbml0aW9uIHRvIGJlIHVzZWQuIE92ZXJyaWRlcyB0aGUgaGVhZGVyIHJvdyBkZWZpbml0aW9uIGdhdGhlcmVkIGJ5XG4gICAqIHVzaW5nIGBDb250ZW50Q2hpbGRgLCBpZiBvbmUgZXhpc3RzLiBTZXRzIGEgZmxhZyB0aGF0IHdpbGwgcmUtcmVuZGVyIHRoZSBoZWFkZXIgcm93IGFmdGVyIHRoZVxuICAgKiB0YWJsZSdzIGNvbnRlbnQgaXMgY2hlY2tlZC5cbiAgICogQGRvY3MtcHJpdmF0ZVxuICAgKiBAZGVwcmVjYXRlZCBVc2UgYGFkZEhlYWRlclJvd0RlZmAgYW5kIGByZW1vdmVIZWFkZXJSb3dEZWZgIGluc3RlYWRcbiAgICogQGJyZWFraW5nLWNoYW5nZSA4LjAuMFxuICAgKi9cbiAgc2V0SGVhZGVyUm93RGVmKGhlYWRlclJvd0RlZjogQ2RrSGVhZGVyUm93RGVmKSB7XG4gICAgdGhpcy5fY3VzdG9tSGVhZGVyUm93RGVmcyA9IG5ldyBTZXQoW2hlYWRlclJvd0RlZl0pO1xuICAgIHRoaXMuX2hlYWRlclJvd0RlZkNoYW5nZWQgPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGZvb3RlciByb3cgZGVmaW5pdGlvbiB0byBiZSB1c2VkLiBPdmVycmlkZXMgdGhlIGZvb3RlciByb3cgZGVmaW5pdGlvbiBnYXRoZXJlZCBieVxuICAgKiB1c2luZyBgQ29udGVudENoaWxkYCwgaWYgb25lIGV4aXN0cy4gU2V0cyBhIGZsYWcgdGhhdCB3aWxsIHJlLXJlbmRlciB0aGUgZm9vdGVyIHJvdyBhZnRlciB0aGVcbiAgICogdGFibGUncyBjb250ZW50IGlzIGNoZWNrZWQuXG4gICAqIEBkb2NzLXByaXZhdGVcbiAgICogQGRlcHJlY2F0ZWQgVXNlIGBhZGRGb290ZXJSb3dEZWZgIGFuZCBgcmVtb3ZlRm9vdGVyUm93RGVmYCBpbnN0ZWFkXG4gICAqIEBicmVha2luZy1jaGFuZ2UgOC4wLjBcbiAgICovXG4gIHNldEZvb3RlclJvd0RlZihmb290ZXJSb3dEZWY6IENka0Zvb3RlclJvd0RlZikge1xuICAgIHRoaXMuX2N1c3RvbUZvb3RlclJvd0RlZnMgPSBuZXcgU2V0KFtmb290ZXJSb3dEZWZdKTtcbiAgICB0aGlzLl9mb290ZXJSb3dEZWZDaGFuZ2VkID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKiBBZGRzIGEgY29sdW1uIGRlZmluaXRpb24gdGhhdCB3YXMgbm90IGluY2x1ZGVkIGFzIHBhcnQgb2YgdGhlIGNvbnRlbnQgY2hpbGRyZW4uICovXG4gIGFkZENvbHVtbkRlZihjb2x1bW5EZWY6IENka0NvbHVtbkRlZikge1xuICAgIHRoaXMuX2N1c3RvbUNvbHVtbkRlZnMuYWRkKGNvbHVtbkRlZik7XG4gIH1cblxuICAvKiogUmVtb3ZlcyBhIGNvbHVtbiBkZWZpbml0aW9uIHRoYXQgd2FzIG5vdCBpbmNsdWRlZCBhcyBwYXJ0IG9mIHRoZSBjb250ZW50IGNoaWxkcmVuLiAqL1xuICByZW1vdmVDb2x1bW5EZWYoY29sdW1uRGVmOiBDZGtDb2x1bW5EZWYpIHtcbiAgICB0aGlzLl9jdXN0b21Db2x1bW5EZWZzLmRlbGV0ZShjb2x1bW5EZWYpO1xuICB9XG5cbiAgLyoqIEFkZHMgYSByb3cgZGVmaW5pdGlvbiB0aGF0IHdhcyBub3QgaW5jbHVkZWQgYXMgcGFydCBvZiB0aGUgY29udGVudCBjaGlsZHJlbi4gKi9cbiAgYWRkUm93RGVmKHJvd0RlZjogQ2RrUm93RGVmPFQ+KSB7XG4gICAgdGhpcy5fY3VzdG9tUm93RGVmcy5hZGQocm93RGVmKTtcbiAgfVxuXG4gIC8qKiBSZW1vdmVzIGEgcm93IGRlZmluaXRpb24gdGhhdCB3YXMgbm90IGluY2x1ZGVkIGFzIHBhcnQgb2YgdGhlIGNvbnRlbnQgY2hpbGRyZW4uICovXG4gIHJlbW92ZVJvd0RlZihyb3dEZWY6IENka1Jvd0RlZjxUPikge1xuICAgIHRoaXMuX2N1c3RvbVJvd0RlZnMuZGVsZXRlKHJvd0RlZik7XG4gIH1cblxuICAvKiogQWRkcyBhIGhlYWRlciByb3cgZGVmaW5pdGlvbiB0aGF0IHdhcyBub3QgaW5jbHVkZWQgYXMgcGFydCBvZiB0aGUgY29udGVudCBjaGlsZHJlbi4gKi9cbiAgYWRkSGVhZGVyUm93RGVmKGhlYWRlclJvd0RlZjogQ2RrSGVhZGVyUm93RGVmKSB7XG4gICAgdGhpcy5fY3VzdG9tSGVhZGVyUm93RGVmcy5hZGQoaGVhZGVyUm93RGVmKTtcbiAgICB0aGlzLl9oZWFkZXJSb3dEZWZDaGFuZ2VkID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKiBSZW1vdmVzIGEgaGVhZGVyIHJvdyBkZWZpbml0aW9uIHRoYXQgd2FzIG5vdCBpbmNsdWRlZCBhcyBwYXJ0IG9mIHRoZSBjb250ZW50IGNoaWxkcmVuLiAqL1xuICByZW1vdmVIZWFkZXJSb3dEZWYoaGVhZGVyUm93RGVmOiBDZGtIZWFkZXJSb3dEZWYpIHtcbiAgICB0aGlzLl9jdXN0b21IZWFkZXJSb3dEZWZzLmRlbGV0ZShoZWFkZXJSb3dEZWYpO1xuICAgIHRoaXMuX2hlYWRlclJvd0RlZkNoYW5nZWQgPSB0cnVlO1xuICB9XG5cbiAgLyoqIEFkZHMgYSBmb290ZXIgcm93IGRlZmluaXRpb24gdGhhdCB3YXMgbm90IGluY2x1ZGVkIGFzIHBhcnQgb2YgdGhlIGNvbnRlbnQgY2hpbGRyZW4uICovXG4gIGFkZEZvb3RlclJvd0RlZihmb290ZXJSb3dEZWY6IENka0Zvb3RlclJvd0RlZikge1xuICAgIHRoaXMuX2N1c3RvbUZvb3RlclJvd0RlZnMuYWRkKGZvb3RlclJvd0RlZik7XG4gICAgdGhpcy5fZm9vdGVyUm93RGVmQ2hhbmdlZCA9IHRydWU7XG4gIH1cblxuICAvKiogUmVtb3ZlcyBhIGZvb3RlciByb3cgZGVmaW5pdGlvbiB0aGF0IHdhcyBub3QgaW5jbHVkZWQgYXMgcGFydCBvZiB0aGUgY29udGVudCBjaGlsZHJlbi4gKi9cbiAgcmVtb3ZlRm9vdGVyUm93RGVmKGZvb3RlclJvd0RlZjogQ2RrRm9vdGVyUm93RGVmKSB7XG4gICAgdGhpcy5fY3VzdG9tRm9vdGVyUm93RGVmcy5kZWxldGUoZm9vdGVyUm93RGVmKTtcbiAgICB0aGlzLl9mb290ZXJSb3dEZWZDaGFuZ2VkID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBoZWFkZXIgc3RpY2t5IHN0eWxlcy4gRmlyc3QgcmVzZXRzIGFsbCBhcHBsaWVkIHN0eWxlcyB3aXRoIHJlc3BlY3QgdG8gdGhlIGNlbGxzXG4gICAqIHN0aWNraW5nIHRvIHRoZSB0b3AuIFRoZW4sIGV2YWx1YXRpbmcgd2hpY2ggY2VsbHMgbmVlZCB0byBiZSBzdHVjayB0byB0aGUgdG9wLiBUaGlzIGlzXG4gICAqIGF1dG9tYXRpY2FsbHkgY2FsbGVkIHdoZW4gdGhlIGhlYWRlciByb3cgY2hhbmdlcyBpdHMgZGlzcGxheWVkIHNldCBvZiBjb2x1bW5zLCBvciBpZiBpdHNcbiAgICogc3RpY2t5IGlucHV0IGNoYW5nZXMuIE1heSBiZSBjYWxsZWQgbWFudWFsbHkgZm9yIGNhc2VzIHdoZXJlIHRoZSBjZWxsIGNvbnRlbnQgY2hhbmdlcyBvdXRzaWRlXG4gICAqIG9mIHRoZXNlIGV2ZW50cy5cbiAgICovXG4gIHVwZGF0ZVN0aWNreUhlYWRlclJvd1N0eWxlcygpOiB2b2lkIHtcbiAgICBjb25zdCBoZWFkZXJSb3dzID0gdGhpcy5fZ2V0UmVuZGVyZWRSb3dzKHRoaXMuX2hlYWRlclJvd091dGxldCk7XG4gICAgY29uc3QgdGFibGVFbGVtZW50ID0gdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50O1xuXG4gICAgLy8gSGlkZSB0aGUgdGhlYWQgZWxlbWVudCBpZiB0aGVyZSBhcmUgbm8gaGVhZGVyIHJvd3MuIFRoaXMgaXMgbmVjZXNzYXJ5IHRvIHNhdGlzZnlcbiAgICAvLyBvdmVyemVhbG91cyBhMTF5IGNoZWNrZXJzIHRoYXQgZmFpbCBiZWNhdXNlIHRoZSBgcm93Z3JvdXBgIGVsZW1lbnQgZG9lcyBub3QgY29udGFpblxuICAgIC8vIHJlcXVpcmVkIGNoaWxkIGByb3dgLlxuICAgIGNvbnN0IHRoZWFkID0gdGFibGVFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ3RoZWFkJyk7XG4gICAgaWYgKHRoZWFkKSB7XG4gICAgICB0aGVhZC5zdHlsZS5kaXNwbGF5ID0gaGVhZGVyUm93cy5sZW5ndGggPyAnJyA6ICdub25lJztcbiAgICB9XG5cbiAgICBjb25zdCBzdGlja3lTdGF0ZXMgPSB0aGlzLl9oZWFkZXJSb3dEZWZzLm1hcChkZWYgPT4gZGVmLnN0aWNreSk7XG4gICAgdGhpcy5fc3RpY2t5U3R5bGVyLmNsZWFyU3RpY2t5UG9zaXRpb25pbmcoaGVhZGVyUm93cywgWyd0b3AnXSk7XG4gICAgdGhpcy5fc3RpY2t5U3R5bGVyLnN0aWNrUm93cyhoZWFkZXJSb3dzLCBzdGlja3lTdGF0ZXMsICd0b3AnKTtcblxuICAgIC8vIFJlc2V0IHRoZSBkaXJ0eSBzdGF0ZSBvZiB0aGUgc3RpY2t5IGlucHV0IGNoYW5nZSBzaW5jZSBpdCBoYXMgYmVlbiB1c2VkLlxuICAgIHRoaXMuX2hlYWRlclJvd0RlZnMuZm9yRWFjaChkZWYgPT4gZGVmLnJlc2V0U3RpY2t5Q2hhbmdlZCgpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBmb290ZXIgc3RpY2t5IHN0eWxlcy4gRmlyc3QgcmVzZXRzIGFsbCBhcHBsaWVkIHN0eWxlcyB3aXRoIHJlc3BlY3QgdG8gdGhlIGNlbGxzXG4gICAqIHN0aWNraW5nIHRvIHRoZSBib3R0b20uIFRoZW4sIGV2YWx1YXRpbmcgd2hpY2ggY2VsbHMgbmVlZCB0byBiZSBzdHVjayB0byB0aGUgYm90dG9tLiBUaGlzIGlzXG4gICAqIGF1dG9tYXRpY2FsbHkgY2FsbGVkIHdoZW4gdGhlIGZvb3RlciByb3cgY2hhbmdlcyBpdHMgZGlzcGxheWVkIHNldCBvZiBjb2x1bW5zLCBvciBpZiBpdHNcbiAgICogc3RpY2t5IGlucHV0IGNoYW5nZXMuIE1heSBiZSBjYWxsZWQgbWFudWFsbHkgZm9yIGNhc2VzIHdoZXJlIHRoZSBjZWxsIGNvbnRlbnQgY2hhbmdlcyBvdXRzaWRlXG4gICAqIG9mIHRoZXNlIGV2ZW50cy5cbiAgICovXG4gIHVwZGF0ZVN0aWNreUZvb3RlclJvd1N0eWxlcygpOiB2b2lkIHtcbiAgICBjb25zdCBmb290ZXJSb3dzID0gdGhpcy5fZ2V0UmVuZGVyZWRSb3dzKHRoaXMuX2Zvb3RlclJvd091dGxldCk7XG4gICAgY29uc3QgdGFibGVFbGVtZW50ID0gdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50O1xuXG4gICAgLy8gSGlkZSB0aGUgdGZvb3QgZWxlbWVudCBpZiB0aGVyZSBhcmUgbm8gZm9vdGVyIHJvd3MuIFRoaXMgaXMgbmVjZXNzYXJ5IHRvIHNhdGlzZnlcbiAgICAvLyBvdmVyemVhbG91cyBhMTF5IGNoZWNrZXJzIHRoYXQgZmFpbCBiZWNhdXNlIHRoZSBgcm93Z3JvdXBgIGVsZW1lbnQgZG9lcyBub3QgY29udGFpblxuICAgIC8vIHJlcXVpcmVkIGNoaWxkIGByb3dgLlxuICAgIGNvbnN0IHRmb290ID0gdGFibGVFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ3Rmb290Jyk7XG4gICAgaWYgKHRmb290KSB7XG4gICAgICB0Zm9vdC5zdHlsZS5kaXNwbGF5ID0gZm9vdGVyUm93cy5sZW5ndGggPyAnJyA6ICdub25lJztcbiAgICB9XG5cbiAgICBjb25zdCBzdGlja3lTdGF0ZXMgPSB0aGlzLl9mb290ZXJSb3dEZWZzLm1hcChkZWYgPT4gZGVmLnN0aWNreSk7XG4gICAgdGhpcy5fc3RpY2t5U3R5bGVyLmNsZWFyU3RpY2t5UG9zaXRpb25pbmcoZm9vdGVyUm93cywgWydib3R0b20nXSk7XG4gICAgdGhpcy5fc3RpY2t5U3R5bGVyLnN0aWNrUm93cyhmb290ZXJSb3dzLCBzdGlja3lTdGF0ZXMsICdib3R0b20nKTtcbiAgICB0aGlzLl9zdGlja3lTdHlsZXIudXBkYXRlU3RpY2t5Rm9vdGVyQ29udGFpbmVyKHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudCwgc3RpY2t5U3RhdGVzKTtcblxuICAgIC8vIFJlc2V0IHRoZSBkaXJ0eSBzdGF0ZSBvZiB0aGUgc3RpY2t5IGlucHV0IGNoYW5nZSBzaW5jZSBpdCBoYXMgYmVlbiB1c2VkLlxuICAgIHRoaXMuX2Zvb3RlclJvd0RlZnMuZm9yRWFjaChkZWYgPT4gZGVmLnJlc2V0U3RpY2t5Q2hhbmdlZCgpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBjb2x1bW4gc3RpY2t5IHN0eWxlcy4gRmlyc3QgcmVzZXRzIGFsbCBhcHBsaWVkIHN0eWxlcyB3aXRoIHJlc3BlY3QgdG8gdGhlIGNlbGxzXG4gICAqIHN0aWNraW5nIHRvIHRoZSBsZWZ0IGFuZCByaWdodC4gVGhlbiBzdGlja3kgc3R5bGVzIGFyZSBhZGRlZCBmb3IgdGhlIGxlZnQgYW5kIHJpZ2h0IGFjY29yZGluZ1xuICAgKiB0byB0aGUgY29sdW1uIGRlZmluaXRpb25zIGZvciBlYWNoIGNlbGwgaW4gZWFjaCByb3cuIFRoaXMgaXMgYXV0b21hdGljYWxseSBjYWxsZWQgd2hlblxuICAgKiB0aGUgZGF0YSBzb3VyY2UgcHJvdmlkZXMgYSBuZXcgc2V0IG9mIGRhdGEgb3Igd2hlbiBhIGNvbHVtbiBkZWZpbml0aW9uIGNoYW5nZXMgaXRzIHN0aWNreVxuICAgKiBpbnB1dC4gTWF5IGJlIGNhbGxlZCBtYW51YWxseSBmb3IgY2FzZXMgd2hlcmUgdGhlIGNlbGwgY29udGVudCBjaGFuZ2VzIG91dHNpZGUgb2YgdGhlc2UgZXZlbnRzLlxuICAgKi9cbiAgdXBkYXRlU3RpY2t5Q29sdW1uU3R5bGVzKCkge1xuICAgIGNvbnN0IGhlYWRlclJvd3MgPSB0aGlzLl9nZXRSZW5kZXJlZFJvd3ModGhpcy5faGVhZGVyUm93T3V0bGV0KTtcbiAgICBjb25zdCBkYXRhUm93cyA9IHRoaXMuX2dldFJlbmRlcmVkUm93cyh0aGlzLl9yb3dPdXRsZXQpO1xuICAgIGNvbnN0IGZvb3RlclJvd3MgPSB0aGlzLl9nZXRSZW5kZXJlZFJvd3ModGhpcy5fZm9vdGVyUm93T3V0bGV0KTtcblxuICAgIC8vIENsZWFyIHRoZSBsZWZ0IGFuZCByaWdodCBwb3NpdGlvbmluZyBmcm9tIGFsbCBjb2x1bW5zIGluIHRoZSB0YWJsZSBhY3Jvc3MgYWxsIHJvd3Mgc2luY2VcbiAgICAvLyBzdGlja3kgY29sdW1ucyBzcGFuIGFjcm9zcyBhbGwgdGFibGUgc2VjdGlvbnMgKGhlYWRlciwgZGF0YSwgZm9vdGVyKVxuICAgIHRoaXMuX3N0aWNreVN0eWxlci5jbGVhclN0aWNreVBvc2l0aW9uaW5nKFxuICAgICAgICBbLi4uaGVhZGVyUm93cywgLi4uZGF0YVJvd3MsIC4uLmZvb3RlclJvd3NdLCBbJ2xlZnQnLCAncmlnaHQnXSk7XG5cbiAgICAvLyBVcGRhdGUgdGhlIHN0aWNreSBzdHlsZXMgZm9yIGVhY2ggaGVhZGVyIHJvdyBkZXBlbmRpbmcgb24gdGhlIGRlZidzIHN0aWNreSBzdGF0ZVxuICAgIGhlYWRlclJvd3MuZm9yRWFjaCgoaGVhZGVyUm93LCBpKSA9PiB7XG4gICAgICB0aGlzLl9hZGRTdGlja3lDb2x1bW5TdHlsZXMoW2hlYWRlclJvd10sIHRoaXMuX2hlYWRlclJvd0RlZnNbaV0pO1xuICAgIH0pO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBzdGlja3kgc3R5bGVzIGZvciBlYWNoIGRhdGEgcm93IGRlcGVuZGluZyBvbiBpdHMgZGVmJ3Mgc3RpY2t5IHN0YXRlXG4gICAgdGhpcy5fcm93RGVmcy5mb3JFYWNoKHJvd0RlZiA9PiB7XG4gICAgICAvLyBDb2xsZWN0IGFsbCB0aGUgcm93cyByZW5kZXJlZCB3aXRoIHRoaXMgcm93IGRlZmluaXRpb24uXG4gICAgICBjb25zdCByb3dzOiBIVE1MRWxlbWVudFtdID0gW107XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGFSb3dzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0aGlzLl9yZW5kZXJSb3dzW2ldLnJvd0RlZiA9PT0gcm93RGVmKSB7XG4gICAgICAgICAgcm93cy5wdXNoKGRhdGFSb3dzW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLl9hZGRTdGlja3lDb2x1bW5TdHlsZXMocm93cywgcm93RGVmKTtcbiAgICB9KTtcblxuICAgIC8vIFVwZGF0ZSB0aGUgc3RpY2t5IHN0eWxlcyBmb3IgZWFjaCBmb290ZXIgcm93IGRlcGVuZGluZyBvbiB0aGUgZGVmJ3Mgc3RpY2t5IHN0YXRlXG4gICAgZm9vdGVyUm93cy5mb3JFYWNoKChmb290ZXJSb3csIGkpID0+IHtcbiAgICAgIHRoaXMuX2FkZFN0aWNreUNvbHVtblN0eWxlcyhbZm9vdGVyUm93XSwgdGhpcy5fZm9vdGVyUm93RGVmc1tpXSk7XG4gICAgfSk7XG5cbiAgICAvLyBSZXNldCB0aGUgZGlydHkgc3RhdGUgb2YgdGhlIHN0aWNreSBpbnB1dCBjaGFuZ2Ugc2luY2UgaXQgaGFzIGJlZW4gdXNlZC5cbiAgICBBcnJheS5mcm9tKHRoaXMuX2NvbHVtbkRlZnNCeU5hbWUudmFsdWVzKCkpLmZvckVhY2goZGVmID0+IGRlZi5yZXNldFN0aWNreUNoYW5nZWQoKSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBsaXN0IG9mIFJlbmRlclJvdyBvYmplY3RzIHRvIHJlbmRlciBhY2NvcmRpbmcgdG8gdGhlIGN1cnJlbnQgbGlzdCBvZiBkYXRhIGFuZCBkZWZpbmVkXG4gICAqIHJvdyBkZWZpbml0aW9ucy4gSWYgdGhlIHByZXZpb3VzIGxpc3QgYWxyZWFkeSBjb250YWluZWQgYSBwYXJ0aWN1bGFyIHBhaXIsIGl0IHNob3VsZCBiZSByZXVzZWRcbiAgICogc28gdGhhdCB0aGUgZGlmZmVyIGVxdWF0ZXMgdGhlaXIgcmVmZXJlbmNlcy5cbiAgICovXG4gIHByaXZhdGUgX2dldEFsbFJlbmRlclJvd3MoKTogUmVuZGVyUm93PFQ+W10ge1xuICAgIGNvbnN0IHJlbmRlclJvd3M6IFJlbmRlclJvdzxUPltdID0gW107XG5cbiAgICAvLyBTdG9yZSB0aGUgY2FjaGUgYW5kIGNyZWF0ZSBhIG5ldyBvbmUuIEFueSByZS11c2VkIFJlbmRlclJvdyBvYmplY3RzIHdpbGwgYmUgbW92ZWQgaW50byB0aGVcbiAgICAvLyBuZXcgY2FjaGUgd2hpbGUgdW51c2VkIG9uZXMgY2FuIGJlIHBpY2tlZCB1cCBieSBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgY29uc3QgcHJldkNhY2hlZFJlbmRlclJvd3MgPSB0aGlzLl9jYWNoZWRSZW5kZXJSb3dzTWFwO1xuICAgIHRoaXMuX2NhY2hlZFJlbmRlclJvd3NNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICAvLyBGb3IgZWFjaCBkYXRhIG9iamVjdCwgZ2V0IHRoZSBsaXN0IG9mIHJvd3MgdGhhdCBzaG91bGQgYmUgcmVuZGVyZWQsIHJlcHJlc2VudGVkIGJ5IHRoZVxuICAgIC8vIHJlc3BlY3RpdmUgYFJlbmRlclJvd2Agb2JqZWN0IHdoaWNoIGlzIHRoZSBwYWlyIG9mIGBkYXRhYCBhbmQgYENka1Jvd0RlZmAuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9kYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgZGF0YSA9IHRoaXMuX2RhdGFbaV07XG4gICAgICBjb25zdCByZW5kZXJSb3dzRm9yRGF0YSA9IHRoaXMuX2dldFJlbmRlclJvd3NGb3JEYXRhKGRhdGEsIGksIHByZXZDYWNoZWRSZW5kZXJSb3dzLmdldChkYXRhKSk7XG5cbiAgICAgIGlmICghdGhpcy5fY2FjaGVkUmVuZGVyUm93c01hcC5oYXMoZGF0YSkpIHtcbiAgICAgICAgdGhpcy5fY2FjaGVkUmVuZGVyUm93c01hcC5zZXQoZGF0YSwgbmV3IFdlYWtNYXAoKSk7XG4gICAgICB9XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcmVuZGVyUm93c0ZvckRhdGEubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgbGV0IHJlbmRlclJvdyA9IHJlbmRlclJvd3NGb3JEYXRhW2pdO1xuXG4gICAgICAgIGNvbnN0IGNhY2hlID0gdGhpcy5fY2FjaGVkUmVuZGVyUm93c01hcC5nZXQocmVuZGVyUm93LmRhdGEpITtcbiAgICAgICAgaWYgKGNhY2hlLmhhcyhyZW5kZXJSb3cucm93RGVmKSkge1xuICAgICAgICAgIGNhY2hlLmdldChyZW5kZXJSb3cucm93RGVmKSEucHVzaChyZW5kZXJSb3cpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNhY2hlLnNldChyZW5kZXJSb3cucm93RGVmLCBbcmVuZGVyUm93XSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVuZGVyUm93cy5wdXNoKHJlbmRlclJvdyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlbmRlclJvd3M7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIGxpc3Qgb2YgYFJlbmRlclJvdzxUPmAgZm9yIHRoZSBwcm92aWRlZCBkYXRhIG9iamVjdCBhbmQgYW55IGBDZGtSb3dEZWZgIG9iamVjdHMgdGhhdFxuICAgKiBzaG91bGQgYmUgcmVuZGVyZWQgZm9yIHRoaXMgZGF0YS4gUmV1c2VzIHRoZSBjYWNoZWQgUmVuZGVyUm93IG9iamVjdHMgaWYgdGhleSBtYXRjaCB0aGUgc2FtZVxuICAgKiBgKFQsIENka1Jvd0RlZilgIHBhaXIuXG4gICAqL1xuICBwcml2YXRlIF9nZXRSZW5kZXJSb3dzRm9yRGF0YShcbiAgICAgIGRhdGE6IFQsIGRhdGFJbmRleDogbnVtYmVyLCBjYWNoZT86IFdlYWtNYXA8Q2RrUm93RGVmPFQ+LCBSZW5kZXJSb3c8VD5bXT4pOiBSZW5kZXJSb3c8VD5bXSB7XG4gICAgY29uc3Qgcm93RGVmcyA9IHRoaXMuX2dldFJvd0RlZnMoZGF0YSwgZGF0YUluZGV4KTtcblxuICAgIHJldHVybiByb3dEZWZzLm1hcChyb3dEZWYgPT4ge1xuICAgICAgY29uc3QgY2FjaGVkUmVuZGVyUm93cyA9IChjYWNoZSAmJiBjYWNoZS5oYXMocm93RGVmKSkgPyBjYWNoZS5nZXQocm93RGVmKSEgOiBbXTtcbiAgICAgIGlmIChjYWNoZWRSZW5kZXJSb3dzLmxlbmd0aCkge1xuICAgICAgICBjb25zdCBkYXRhUm93ID0gY2FjaGVkUmVuZGVyUm93cy5zaGlmdCgpITtcbiAgICAgICAgZGF0YVJvdy5kYXRhSW5kZXggPSBkYXRhSW5kZXg7XG4gICAgICAgIHJldHVybiBkYXRhUm93O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHtkYXRhLCByb3dEZWYsIGRhdGFJbmRleH07XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSBtYXAgY29udGFpbmluZyB0aGUgY29udGVudCdzIGNvbHVtbiBkZWZpbml0aW9ucy4gKi9cbiAgcHJpdmF0ZSBfY2FjaGVDb2x1bW5EZWZzKCkge1xuICAgIHRoaXMuX2NvbHVtbkRlZnNCeU5hbWUuY2xlYXIoKTtcblxuICAgIGNvbnN0IGNvbHVtbkRlZnMgPSBtZXJnZVF1ZXJ5TGlzdEFuZFNldCh0aGlzLl9jb250ZW50Q29sdW1uRGVmcywgdGhpcy5fY3VzdG9tQ29sdW1uRGVmcyk7XG4gICAgY29sdW1uRGVmcy5mb3JFYWNoKGNvbHVtbkRlZiA9PiB7XG4gICAgICBpZiAodGhpcy5fY29sdW1uRGVmc0J5TmFtZS5oYXMoY29sdW1uRGVmLm5hbWUpKSB7XG4gICAgICAgIHRocm93IGdldFRhYmxlRHVwbGljYXRlQ29sdW1uTmFtZUVycm9yKGNvbHVtbkRlZi5uYW1lKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2NvbHVtbkRlZnNCeU5hbWUuc2V0KGNvbHVtbkRlZi5uYW1lLCBjb2x1bW5EZWYpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIFVwZGF0ZSB0aGUgbGlzdCBvZiBhbGwgYXZhaWxhYmxlIHJvdyBkZWZpbml0aW9ucyB0aGF0IGNhbiBiZSB1c2VkLiAqL1xuICBwcml2YXRlIF9jYWNoZVJvd0RlZnMoKSB7XG4gICAgdGhpcy5faGVhZGVyUm93RGVmcyA9XG4gICAgICAgIG1lcmdlUXVlcnlMaXN0QW5kU2V0KHRoaXMuX2NvbnRlbnRIZWFkZXJSb3dEZWZzLCB0aGlzLl9jdXN0b21IZWFkZXJSb3dEZWZzKTtcbiAgICB0aGlzLl9mb290ZXJSb3dEZWZzID1cbiAgICAgICAgbWVyZ2VRdWVyeUxpc3RBbmRTZXQodGhpcy5fY29udGVudEZvb3RlclJvd0RlZnMsIHRoaXMuX2N1c3RvbUZvb3RlclJvd0RlZnMpO1xuICAgIHRoaXMuX3Jvd0RlZnMgPSBtZXJnZVF1ZXJ5TGlzdEFuZFNldCh0aGlzLl9jb250ZW50Um93RGVmcywgdGhpcy5fY3VzdG9tUm93RGVmcyk7XG5cbiAgICAvLyBBZnRlciBhbGwgcm93IGRlZmluaXRpb25zIGFyZSBkZXRlcm1pbmVkLCBmaW5kIHRoZSByb3cgZGVmaW5pdGlvbiB0byBiZSBjb25zaWRlcmVkIGRlZmF1bHQuXG4gICAgY29uc3QgZGVmYXVsdFJvd0RlZnMgPSB0aGlzLl9yb3dEZWZzLmZpbHRlcihkZWYgPT4gIWRlZi53aGVuKTtcbiAgICBpZiAoIXRoaXMubXVsdGlUZW1wbGF0ZURhdGFSb3dzICYmIGRlZmF1bHRSb3dEZWZzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHRocm93IGdldFRhYmxlTXVsdGlwbGVEZWZhdWx0Um93RGVmc0Vycm9yKCk7XG4gICAgfVxuICAgIHRoaXMuX2RlZmF1bHRSb3dEZWYgPSBkZWZhdWx0Um93RGVmc1swXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGUgaGVhZGVyLCBkYXRhLCBvciBmb290ZXIgcm93cyBoYXZlIGNoYW5nZWQgd2hhdCBjb2x1bW5zIHRoZXkgd2FudCB0byBkaXNwbGF5IG9yXG4gICAqIHdoZXRoZXIgdGhlIHN0aWNreSBzdGF0ZXMgaGF2ZSBjaGFuZ2VkIGZvciB0aGUgaGVhZGVyIG9yIGZvb3Rlci4gSWYgdGhlcmUgaXMgYSBkaWZmLCB0aGVuXG4gICAqIHJlLXJlbmRlciB0aGF0IHNlY3Rpb24uXG4gICAqL1xuICBwcml2YXRlIF9yZW5kZXJVcGRhdGVkQ29sdW1ucygpIHtcbiAgICBjb25zdCBjb2x1bW5zRGlmZlJlZHVjZXIgPSAoYWNjOiBib29sZWFuLCBkZWY6IEJhc2VSb3dEZWYpID0+IGFjYyB8fCAhIWRlZi5nZXRDb2x1bW5zRGlmZigpO1xuXG4gICAgLy8gRm9yY2UgcmUtcmVuZGVyIGRhdGEgcm93cyBpZiB0aGUgbGlzdCBvZiBjb2x1bW4gZGVmaW5pdGlvbnMgaGF2ZSBjaGFuZ2VkLlxuICAgIGlmICh0aGlzLl9yb3dEZWZzLnJlZHVjZShjb2x1bW5zRGlmZlJlZHVjZXIsIGZhbHNlKSkge1xuICAgICAgdGhpcy5fZm9yY2VSZW5kZXJEYXRhUm93cygpO1xuICAgIH1cblxuICAgIC8vIEZvcmNlIHJlLXJlbmRlciBoZWFkZXIvZm9vdGVyIHJvd3MgaWYgdGhlIGxpc3Qgb2YgY29sdW1uIGRlZmluaXRpb25zIGhhdmUgY2hhbmdlZC4uXG4gICAgaWYgKHRoaXMuX2hlYWRlclJvd0RlZnMucmVkdWNlKGNvbHVtbnNEaWZmUmVkdWNlciwgZmFsc2UpKSB7XG4gICAgICB0aGlzLl9mb3JjZVJlbmRlckhlYWRlclJvd3MoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZm9vdGVyUm93RGVmcy5yZWR1Y2UoY29sdW1uc0RpZmZSZWR1Y2VyLCBmYWxzZSkpIHtcbiAgICAgIHRoaXMuX2ZvcmNlUmVuZGVyRm9vdGVyUm93cygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTd2l0Y2ggdG8gdGhlIHByb3ZpZGVkIGRhdGEgc291cmNlIGJ5IHJlc2V0dGluZyB0aGUgZGF0YSBhbmQgdW5zdWJzY3JpYmluZyBmcm9tIHRoZSBjdXJyZW50XG4gICAqIHJlbmRlciBjaGFuZ2Ugc3Vic2NyaXB0aW9uIGlmIG9uZSBleGlzdHMuIElmIHRoZSBkYXRhIHNvdXJjZSBpcyBudWxsLCBpbnRlcnByZXQgdGhpcyBieVxuICAgKiBjbGVhcmluZyB0aGUgcm93IG91dGxldC4gT3RoZXJ3aXNlIHN0YXJ0IGxpc3RlbmluZyBmb3IgbmV3IGRhdGEuXG4gICAqL1xuICBwcml2YXRlIF9zd2l0Y2hEYXRhU291cmNlKGRhdGFTb3VyY2U6IENka1RhYmxlRGF0YVNvdXJjZUlucHV0PFQ+KSB7XG4gICAgdGhpcy5fZGF0YSA9IFtdO1xuXG4gICAgaWYgKGlzRGF0YVNvdXJjZSh0aGlzLmRhdGFTb3VyY2UpKSB7XG4gICAgICB0aGlzLmRhdGFTb3VyY2UuZGlzY29ubmVjdCh0aGlzKTtcbiAgICB9XG5cbiAgICAvLyBTdG9wIGxpc3RlbmluZyBmb3IgZGF0YSBmcm9tIHRoZSBwcmV2aW91cyBkYXRhIHNvdXJjZS5cbiAgICBpZiAodGhpcy5fcmVuZGVyQ2hhbmdlU3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aGlzLl9yZW5kZXJDaGFuZ2VTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMuX3JlbmRlckNoYW5nZVN1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgfVxuXG4gICAgaWYgKCFkYXRhU291cmNlKSB7XG4gICAgICBpZiAodGhpcy5fZGF0YURpZmZlcikge1xuICAgICAgICB0aGlzLl9kYXRhRGlmZmVyLmRpZmYoW10pO1xuICAgICAgfVxuICAgICAgdGhpcy5fcm93T3V0bGV0LnZpZXdDb250YWluZXIuY2xlYXIoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9kYXRhU291cmNlID0gZGF0YVNvdXJjZTtcbiAgfVxuXG4gIC8qKiBTZXQgdXAgYSBzdWJzY3JpcHRpb24gZm9yIHRoZSBkYXRhIHByb3ZpZGVkIGJ5IHRoZSBkYXRhIHNvdXJjZS4gKi9cbiAgcHJpdmF0ZSBfb2JzZXJ2ZVJlbmRlckNoYW5nZXMoKSB7XG4gICAgLy8gSWYgbm8gZGF0YSBzb3VyY2UgaGFzIGJlZW4gc2V0LCB0aGVyZSBpcyBub3RoaW5nIHRvIG9ic2VydmUgZm9yIGNoYW5nZXMuXG4gICAgaWYgKCF0aGlzLmRhdGFTb3VyY2UpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgZGF0YVN0cmVhbTogT2JzZXJ2YWJsZTxUW118UmVhZG9ubHlBcnJheTxUPj58dW5kZWZpbmVkO1xuXG4gICAgaWYgKGlzRGF0YVNvdXJjZSh0aGlzLmRhdGFTb3VyY2UpKSB7XG4gICAgICBkYXRhU3RyZWFtID0gdGhpcy5kYXRhU291cmNlLmNvbm5lY3QodGhpcyk7XG4gICAgfSBlbHNlIGlmIChpc09ic2VydmFibGUodGhpcy5kYXRhU291cmNlKSkge1xuICAgICAgZGF0YVN0cmVhbSA9IHRoaXMuZGF0YVNvdXJjZTtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5kYXRhU291cmNlKSkge1xuICAgICAgZGF0YVN0cmVhbSA9IG9ic2VydmFibGVPZih0aGlzLmRhdGFTb3VyY2UpO1xuICAgIH1cblxuICAgIGlmIChkYXRhU3RyZWFtID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IGdldFRhYmxlVW5rbm93bkRhdGFTb3VyY2VFcnJvcigpO1xuICAgIH1cblxuICAgIHRoaXMuX3JlbmRlckNoYW5nZVN1YnNjcmlwdGlvbiA9IGRhdGFTdHJlYW0ucGlwZSh0YWtlVW50aWwodGhpcy5fb25EZXN0cm95KSkuc3Vic2NyaWJlKGRhdGEgPT4ge1xuICAgICAgdGhpcy5fZGF0YSA9IGRhdGEgfHwgW107XG4gICAgICB0aGlzLnJlbmRlclJvd3MoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgYW55IGV4aXN0aW5nIGNvbnRlbnQgaW4gdGhlIGhlYWRlciByb3cgb3V0bGV0IGFuZCBjcmVhdGVzIGEgbmV3IGVtYmVkZGVkIHZpZXdcbiAgICogaW4gdGhlIG91dGxldCB1c2luZyB0aGUgaGVhZGVyIHJvdyBkZWZpbml0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBfZm9yY2VSZW5kZXJIZWFkZXJSb3dzKCkge1xuICAgIC8vIENsZWFyIHRoZSBoZWFkZXIgcm93IG91dGxldCBpZiBhbnkgY29udGVudCBleGlzdHMuXG4gICAgaWYgKHRoaXMuX2hlYWRlclJvd091dGxldC52aWV3Q29udGFpbmVyLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuX2hlYWRlclJvd091dGxldC52aWV3Q29udGFpbmVyLmNsZWFyKCk7XG4gICAgfVxuXG4gICAgdGhpcy5faGVhZGVyUm93RGVmcy5mb3JFYWNoKChkZWYsIGkpID0+IHRoaXMuX3JlbmRlclJvdyh0aGlzLl9oZWFkZXJSb3dPdXRsZXQsIGRlZiwgaSkpO1xuICAgIHRoaXMudXBkYXRlU3RpY2t5SGVhZGVyUm93U3R5bGVzKCk7XG4gICAgdGhpcy51cGRhdGVTdGlja3lDb2x1bW5TdHlsZXMoKTtcbiAgfVxuICAvKipcbiAgICogQ2xlYXJzIGFueSBleGlzdGluZyBjb250ZW50IGluIHRoZSBmb290ZXIgcm93IG91dGxldCBhbmQgY3JlYXRlcyBhIG5ldyBlbWJlZGRlZCB2aWV3XG4gICAqIGluIHRoZSBvdXRsZXQgdXNpbmcgdGhlIGZvb3RlciByb3cgZGVmaW5pdGlvbi5cbiAgICovXG4gIHByaXZhdGUgX2ZvcmNlUmVuZGVyRm9vdGVyUm93cygpIHtcbiAgICAvLyBDbGVhciB0aGUgZm9vdGVyIHJvdyBvdXRsZXQgaWYgYW55IGNvbnRlbnQgZXhpc3RzLlxuICAgIGlmICh0aGlzLl9mb290ZXJSb3dPdXRsZXQudmlld0NvbnRhaW5lci5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLl9mb290ZXJSb3dPdXRsZXQudmlld0NvbnRhaW5lci5jbGVhcigpO1xuICAgIH1cblxuICAgIHRoaXMuX2Zvb3RlclJvd0RlZnMuZm9yRWFjaCgoZGVmLCBpKSA9PiB0aGlzLl9yZW5kZXJSb3codGhpcy5fZm9vdGVyUm93T3V0bGV0LCBkZWYsIGkpKTtcbiAgICB0aGlzLnVwZGF0ZVN0aWNreUZvb3RlclJvd1N0eWxlcygpO1xuICAgIHRoaXMudXBkYXRlU3RpY2t5Q29sdW1uU3R5bGVzKCk7XG4gIH1cblxuICAvKiogQWRkcyB0aGUgc3RpY2t5IGNvbHVtbiBzdHlsZXMgZm9yIHRoZSByb3dzIGFjY29yZGluZyB0byB0aGUgY29sdW1ucycgc3RpY2sgc3RhdGVzLiAqL1xuICBwcml2YXRlIF9hZGRTdGlja3lDb2x1bW5TdHlsZXMocm93czogSFRNTEVsZW1lbnRbXSwgcm93RGVmOiBCYXNlUm93RGVmKSB7XG4gICAgY29uc3QgY29sdW1uRGVmcyA9IEFycmF5LmZyb20ocm93RGVmLmNvbHVtbnMgfHwgW10pLm1hcChjb2x1bW5OYW1lID0+IHtcbiAgICAgIGNvbnN0IGNvbHVtbkRlZiA9IHRoaXMuX2NvbHVtbkRlZnNCeU5hbWUuZ2V0KGNvbHVtbk5hbWUpO1xuICAgICAgaWYgKCFjb2x1bW5EZWYpIHtcbiAgICAgICAgdGhyb3cgZ2V0VGFibGVVbmtub3duQ29sdW1uRXJyb3IoY29sdW1uTmFtZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY29sdW1uRGVmITtcbiAgICB9KTtcbiAgICBjb25zdCBzdGlja3lTdGFydFN0YXRlcyA9IGNvbHVtbkRlZnMubWFwKGNvbHVtbkRlZiA9PiBjb2x1bW5EZWYuc3RpY2t5KTtcbiAgICBjb25zdCBzdGlja3lFbmRTdGF0ZXMgPSBjb2x1bW5EZWZzLm1hcChjb2x1bW5EZWYgPT4gY29sdW1uRGVmLnN0aWNreUVuZCk7XG4gICAgdGhpcy5fc3RpY2t5U3R5bGVyLnVwZGF0ZVN0aWNreUNvbHVtbnMocm93cywgc3RpY2t5U3RhcnRTdGF0ZXMsIHN0aWNreUVuZFN0YXRlcyk7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgbGlzdCBvZiByb3dzIHRoYXQgaGF2ZSBiZWVuIHJlbmRlcmVkIGluIHRoZSByb3cgb3V0bGV0LiAqL1xuICBfZ2V0UmVuZGVyZWRSb3dzKHJvd091dGxldDogUm93T3V0bGV0KTogSFRNTEVsZW1lbnRbXSB7XG4gICAgY29uc3QgcmVuZGVyZWRSb3dzOiBIVE1MRWxlbWVudFtdID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJvd091dGxldC52aWV3Q29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCB2aWV3UmVmID0gKHJvd091dGxldC52aWV3Q29udGFpbmVyLmdldChpKSEgYXMgRW1iZWRkZWRWaWV3UmVmPGFueT4pO1xuICAgICAgcmVuZGVyZWRSb3dzLnB1c2godmlld1JlZi5yb290Tm9kZXNbMF0pO1xuICAgIH1cblxuICAgIHJldHVybiByZW5kZXJlZFJvd3M7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBtYXRjaGluZyByb3cgZGVmaW5pdGlvbnMgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgdGhpcyByb3cgZGF0YS4gSWYgdGhlcmUgaXMgb25seVxuICAgKiBvbmUgcm93IGRlZmluaXRpb24sIGl0IGlzIHJldHVybmVkLiBPdGhlcndpc2UsIGZpbmQgdGhlIHJvdyBkZWZpbml0aW9ucyB0aGF0IGhhcyBhIHdoZW5cbiAgICogcHJlZGljYXRlIHRoYXQgcmV0dXJucyB0cnVlIHdpdGggdGhlIGRhdGEuIElmIG5vbmUgcmV0dXJuIHRydWUsIHJldHVybiB0aGUgZGVmYXVsdCByb3dcbiAgICogZGVmaW5pdGlvbi5cbiAgICovXG4gIF9nZXRSb3dEZWZzKGRhdGE6IFQsIGRhdGFJbmRleDogbnVtYmVyKTogQ2RrUm93RGVmPFQ+W10ge1xuICAgIGlmICh0aGlzLl9yb3dEZWZzLmxlbmd0aCA9PSAxKSB7XG4gICAgICByZXR1cm4gW3RoaXMuX3Jvd0RlZnNbMF1dO1xuICAgIH1cblxuICAgIGxldCByb3dEZWZzOiBDZGtSb3dEZWY8VD5bXSA9IFtdO1xuICAgIGlmICh0aGlzLm11bHRpVGVtcGxhdGVEYXRhUm93cykge1xuICAgICAgcm93RGVmcyA9IHRoaXMuX3Jvd0RlZnMuZmlsdGVyKGRlZiA9PiAhZGVmLndoZW4gfHwgZGVmLndoZW4oZGF0YUluZGV4LCBkYXRhKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCByb3dEZWYgPVxuICAgICAgICAgIHRoaXMuX3Jvd0RlZnMuZmluZChkZWYgPT4gZGVmLndoZW4gJiYgZGVmLndoZW4oZGF0YUluZGV4LCBkYXRhKSkgfHwgdGhpcy5fZGVmYXVsdFJvd0RlZjtcbiAgICAgIGlmIChyb3dEZWYpIHtcbiAgICAgICAgcm93RGVmcy5wdXNoKHJvd0RlZik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFyb3dEZWZzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgZ2V0VGFibGVNaXNzaW5nTWF0Y2hpbmdSb3dEZWZFcnJvcihkYXRhKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcm93RGVmcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgdGhlIGVtYmVkZGVkIHZpZXcgZm9yIHRoZSBkYXRhIHJvdyB0ZW1wbGF0ZSBhbmQgcGxhY2UgaXQgaW4gdGhlIGNvcnJlY3QgaW5kZXggbG9jYXRpb25cbiAgICogd2l0aGluIHRoZSBkYXRhIHJvdyB2aWV3IGNvbnRhaW5lci5cbiAgICovXG4gIHByaXZhdGUgX2luc2VydFJvdyhyZW5kZXJSb3c6IFJlbmRlclJvdzxUPiwgcmVuZGVySW5kZXg6IG51bWJlcikge1xuICAgIGNvbnN0IHJvd0RlZiA9IHJlbmRlclJvdy5yb3dEZWY7XG4gICAgY29uc3QgY29udGV4dDogUm93Q29udGV4dDxUPiA9IHskaW1wbGljaXQ6IHJlbmRlclJvdy5kYXRhfTtcbiAgICB0aGlzLl9yZW5kZXJSb3codGhpcy5fcm93T3V0bGV0LCByb3dEZWYsIHJlbmRlckluZGV4LCBjb250ZXh0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IHJvdyB0ZW1wbGF0ZSBpbiB0aGUgb3V0bGV0IGFuZCBmaWxscyBpdCB3aXRoIHRoZSBzZXQgb2YgY2VsbCB0ZW1wbGF0ZXMuXG4gICAqIE9wdGlvbmFsbHkgdGFrZXMgYSBjb250ZXh0IHRvIHByb3ZpZGUgdG8gdGhlIHJvdyBhbmQgY2VsbHMsIGFzIHdlbGwgYXMgYW4gb3B0aW9uYWwgaW5kZXhcbiAgICogb2Ygd2hlcmUgdG8gcGxhY2UgdGhlIG5ldyByb3cgdGVtcGxhdGUgaW4gdGhlIG91dGxldC5cbiAgICovXG4gIHByaXZhdGUgX3JlbmRlclJvdyhcbiAgICAgIG91dGxldDogUm93T3V0bGV0LCByb3dEZWY6IEJhc2VSb3dEZWYsIGluZGV4OiBudW1iZXIsIGNvbnRleHQ6IFJvd0NvbnRleHQ8VD4gPSB7fSkge1xuICAgIC8vIFRPRE8oYW5kcmV3c2VndWluKTogZW5mb3JjZSB0aGF0IG9uZSBvdXRsZXQgd2FzIGluc3RhbnRpYXRlZCBmcm9tIGNyZWF0ZUVtYmVkZGVkVmlld1xuICAgIG91dGxldC52aWV3Q29udGFpbmVyLmNyZWF0ZUVtYmVkZGVkVmlldyhyb3dEZWYudGVtcGxhdGUsIGNvbnRleHQsIGluZGV4KTtcblxuICAgIGZvciAobGV0IGNlbGxUZW1wbGF0ZSBvZiB0aGlzLl9nZXRDZWxsVGVtcGxhdGVzKHJvd0RlZikpIHtcbiAgICAgIGlmIChDZGtDZWxsT3V0bGV0Lm1vc3RSZWNlbnRDZWxsT3V0bGV0KSB7XG4gICAgICAgIENka0NlbGxPdXRsZXQubW9zdFJlY2VudENlbGxPdXRsZXQuX3ZpZXdDb250YWluZXIuY3JlYXRlRW1iZWRkZWRWaWV3KGNlbGxUZW1wbGF0ZSwgY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgaW5kZXgtcmVsYXRlZCBjb250ZXh0IGZvciBlYWNoIHJvdyB0byByZWZsZWN0IGFueSBjaGFuZ2VzIGluIHRoZSBpbmRleCBvZiB0aGUgcm93cyxcbiAgICogZS5nLiBmaXJzdC9sYXN0L2V2ZW4vb2RkLlxuICAgKi9cbiAgcHJpdmF0ZSBfdXBkYXRlUm93SW5kZXhDb250ZXh0KCkge1xuICAgIGNvbnN0IHZpZXdDb250YWluZXIgPSB0aGlzLl9yb3dPdXRsZXQudmlld0NvbnRhaW5lcjtcbiAgICBmb3IgKGxldCByZW5kZXJJbmRleCA9IDAsIGNvdW50ID0gdmlld0NvbnRhaW5lci5sZW5ndGg7IHJlbmRlckluZGV4IDwgY291bnQ7IHJlbmRlckluZGV4KyspIHtcbiAgICAgIGNvbnN0IHZpZXdSZWYgPSB2aWV3Q29udGFpbmVyLmdldChyZW5kZXJJbmRleCkgYXMgUm93Vmlld1JlZjxUPjtcbiAgICAgIGNvbnN0IGNvbnRleHQgPSB2aWV3UmVmLmNvbnRleHQgYXMgUm93Q29udGV4dDxUPjtcbiAgICAgIGNvbnRleHQuY291bnQgPSBjb3VudDtcbiAgICAgIGNvbnRleHQuZmlyc3QgPSByZW5kZXJJbmRleCA9PT0gMDtcbiAgICAgIGNvbnRleHQubGFzdCA9IHJlbmRlckluZGV4ID09PSBjb3VudCAtIDE7XG4gICAgICBjb250ZXh0LmV2ZW4gPSByZW5kZXJJbmRleCAlIDIgPT09IDA7XG4gICAgICBjb250ZXh0Lm9kZCA9ICFjb250ZXh0LmV2ZW47XG5cbiAgICAgIGlmICh0aGlzLm11bHRpVGVtcGxhdGVEYXRhUm93cykge1xuICAgICAgICBjb250ZXh0LmRhdGFJbmRleCA9IHRoaXMuX3JlbmRlclJvd3NbcmVuZGVySW5kZXhdLmRhdGFJbmRleDtcbiAgICAgICAgY29udGV4dC5yZW5kZXJJbmRleCA9IHJlbmRlckluZGV4O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udGV4dC5pbmRleCA9IHRoaXMuX3JlbmRlclJvd3NbcmVuZGVySW5kZXhdLmRhdGFJbmRleDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogR2V0cyB0aGUgY29sdW1uIGRlZmluaXRpb25zIGZvciB0aGUgcHJvdmlkZWQgcm93IGRlZi4gKi9cbiAgcHJpdmF0ZSBfZ2V0Q2VsbFRlbXBsYXRlcyhyb3dEZWY6IEJhc2VSb3dEZWYpOiBUZW1wbGF0ZVJlZjxhbnk+W10ge1xuICAgIGlmICghcm93RGVmIHx8ICFyb3dEZWYuY29sdW1ucykge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICByZXR1cm4gQXJyYXkuZnJvbShyb3dEZWYuY29sdW1ucywgY29sdW1uSWQgPT4ge1xuICAgICAgY29uc3QgY29sdW1uID0gdGhpcy5fY29sdW1uRGVmc0J5TmFtZS5nZXQoY29sdW1uSWQpO1xuXG4gICAgICBpZiAoIWNvbHVtbikge1xuICAgICAgICB0aHJvdyBnZXRUYWJsZVVua25vd25Db2x1bW5FcnJvcihjb2x1bW5JZCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByb3dEZWYuZXh0cmFjdENlbGxUZW1wbGF0ZShjb2x1bW4pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIEFkZHMgbmF0aXZlIHRhYmxlIHNlY3Rpb25zIChlLmcuIHRib2R5KSBhbmQgbW92ZXMgdGhlIHJvdyBvdXRsZXRzIGludG8gdGhlbS4gKi9cbiAgcHJpdmF0ZSBfYXBwbHlOYXRpdmVUYWJsZVNlY3Rpb25zKCkge1xuICAgIGNvbnN0IGRvY3VtZW50RnJhZ21lbnQgPSB0aGlzLl9kb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgY29uc3Qgc2VjdGlvbnMgPSBbXG4gICAgICB7dGFnOiAndGhlYWQnLCBvdXRsZXQ6IHRoaXMuX2hlYWRlclJvd091dGxldH0sXG4gICAgICB7dGFnOiAndGJvZHknLCBvdXRsZXQ6IHRoaXMuX3Jvd091dGxldH0sXG4gICAgICB7dGFnOiAndGZvb3QnLCBvdXRsZXQ6IHRoaXMuX2Zvb3RlclJvd091dGxldH0sXG4gICAgXTtcblxuICAgIGZvciAoY29uc3Qgc2VjdGlvbiBvZiBzZWN0aW9ucykge1xuICAgICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoc2VjdGlvbi50YWcpO1xuICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAncm93Z3JvdXAnKTtcbiAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoc2VjdGlvbi5vdXRsZXQuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50KTtcbiAgICAgIGRvY3VtZW50RnJhZ21lbnQuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgfVxuXG4gICAgLy8gVXNlIGEgRG9jdW1lbnRGcmFnbWVudCBzbyB3ZSBkb24ndCBoaXQgdGhlIERPTSBvbiBlYWNoIGl0ZXJhdGlvbi5cbiAgICB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuYXBwZW5kQ2hpbGQoZG9jdW1lbnRGcmFnbWVudCk7XG4gIH1cblxuICAvKipcbiAgICogRm9yY2VzIGEgcmUtcmVuZGVyIG9mIHRoZSBkYXRhIHJvd3MuIFNob3VsZCBiZSBjYWxsZWQgaW4gY2FzZXMgd2hlcmUgdGhlcmUgaGFzIGJlZW4gYW4gaW5wdXRcbiAgICogY2hhbmdlIHRoYXQgYWZmZWN0cyB0aGUgZXZhbHVhdGlvbiBvZiB3aGljaCByb3dzIHNob3VsZCBiZSByZW5kZXJlZCwgZS5nLiB0b2dnbGluZ1xuICAgKiBgbXVsdGlUZW1wbGF0ZURhdGFSb3dzYCBvciBhZGRpbmcvcmVtb3Zpbmcgcm93IGRlZmluaXRpb25zLlxuICAgKi9cbiAgcHJpdmF0ZSBfZm9yY2VSZW5kZXJEYXRhUm93cygpIHtcbiAgICB0aGlzLl9kYXRhRGlmZmVyLmRpZmYoW10pO1xuICAgIHRoaXMuX3Jvd091dGxldC52aWV3Q29udGFpbmVyLmNsZWFyKCk7XG4gICAgdGhpcy5yZW5kZXJSb3dzKCk7XG4gICAgdGhpcy51cGRhdGVTdGlja3lDb2x1bW5TdHlsZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlcmUgaGFzIGJlZW4gYSBjaGFuZ2UgaW4gc3RpY2t5IHN0YXRlcyBzaW5jZSBsYXN0IGNoZWNrIGFuZCBhcHBsaWVzIHRoZSBjb3JyZWN0XG4gICAqIHN0aWNreSBzdHlsZXMuIFNpbmNlIGNoZWNraW5nIHJlc2V0cyB0aGUgXCJkaXJ0eVwiIHN0YXRlLCB0aGlzIHNob3VsZCBvbmx5IGJlIHBlcmZvcm1lZCBvbmNlXG4gICAqIGR1cmluZyBhIGNoYW5nZSBkZXRlY3Rpb24gYW5kIGFmdGVyIHRoZSBpbnB1dHMgYXJlIHNldHRsZWQgKGFmdGVyIGNvbnRlbnQgY2hlY2spLlxuICAgKi9cbiAgcHJpdmF0ZSBfY2hlY2tTdGlja3lTdGF0ZXMoKSB7XG4gICAgY29uc3Qgc3RpY2t5Q2hlY2tSZWR1Y2VyID0gKGFjYzogYm9vbGVhbiwgZDogQ2RrSGVhZGVyUm93RGVmfENka0Zvb3RlclJvd0RlZnxDZGtDb2x1bW5EZWYpID0+IHtcbiAgICAgIHJldHVybiBhY2MgfHwgZC5oYXNTdGlja3lDaGFuZ2VkKCk7XG4gICAgfTtcblxuICAgIC8vIE5vdGUgdGhhdCB0aGUgY2hlY2sgbmVlZHMgdG8gb2NjdXIgZm9yIGV2ZXJ5IGRlZmluaXRpb24gc2luY2UgaXQgbm90aWZpZXMgdGhlIGRlZmluaXRpb25cbiAgICAvLyB0aGF0IGl0IGNhbiByZXNldCBpdHMgZGlydHkgc3RhdGUuIFVzaW5nIGFub3RoZXIgb3BlcmF0b3IgbGlrZSBgc29tZWAgbWF5IHNob3J0LWNpcmN1aXRcbiAgICAvLyByZW1haW5pbmcgZGVmaW5pdGlvbnMgYW5kIGxlYXZlIHRoZW0gaW4gYW4gdW5jaGVja2VkIHN0YXRlLlxuXG4gICAgaWYgKHRoaXMuX2hlYWRlclJvd0RlZnMucmVkdWNlKHN0aWNreUNoZWNrUmVkdWNlciwgZmFsc2UpKSB7XG4gICAgICB0aGlzLnVwZGF0ZVN0aWNreUhlYWRlclJvd1N0eWxlcygpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9mb290ZXJSb3dEZWZzLnJlZHVjZShzdGlja3lDaGVja1JlZHVjZXIsIGZhbHNlKSkge1xuICAgICAgdGhpcy51cGRhdGVTdGlja3lGb290ZXJSb3dTdHlsZXMoKTtcbiAgICB9XG5cbiAgICBpZiAoQXJyYXkuZnJvbSh0aGlzLl9jb2x1bW5EZWZzQnlOYW1lLnZhbHVlcygpKS5yZWR1Y2Uoc3RpY2t5Q2hlY2tSZWR1Y2VyLCBmYWxzZSkpIHtcbiAgICAgIHRoaXMudXBkYXRlU3RpY2t5Q29sdW1uU3R5bGVzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgdGhlIHN0aWNreSBzdHlsZXIgdGhhdCB3aWxsIGJlIHVzZWQgZm9yIHN0aWNreSByb3dzIGFuZCBjb2x1bW5zLiBMaXN0ZW5zXG4gICAqIGZvciBkaXJlY3Rpb25hbGl0eSBjaGFuZ2VzIGFuZCBwcm92aWRlcyB0aGUgbGF0ZXN0IGRpcmVjdGlvbiB0byB0aGUgc3R5bGVyLiBSZS1hcHBsaWVzIGNvbHVtblxuICAgKiBzdGlja2luZXNzIHdoZW4gZGlyZWN0aW9uYWxpdHkgY2hhbmdlcy5cbiAgICovXG4gIHByaXZhdGUgX3NldHVwU3RpY2t5U3R5bGVyKCkge1xuICAgIGNvbnN0IGRpcmVjdGlvbjogRGlyZWN0aW9uID0gdGhpcy5fZGlyID8gdGhpcy5fZGlyLnZhbHVlIDogJ2x0cic7XG4gICAgdGhpcy5fc3RpY2t5U3R5bGVyID0gbmV3IFN0aWNreVN0eWxlcihcbiAgICAgICAgdGhpcy5faXNOYXRpdmVIdG1sVGFibGUsIHRoaXMuc3RpY2t5Q3NzQ2xhc3MsIGRpcmVjdGlvbiwgdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKTtcbiAgICAodGhpcy5fZGlyID8gdGhpcy5fZGlyLmNoYW5nZSA6IG9ic2VydmFibGVPZjxEaXJlY3Rpb24+KCkpXG4gICAgICAgIC5waXBlKHRha2VVbnRpbCh0aGlzLl9vbkRlc3Ryb3kpKVxuICAgICAgICAuc3Vic2NyaWJlKHZhbHVlID0+IHtcbiAgICAgICAgICB0aGlzLl9zdGlja3lTdHlsZXIuZGlyZWN0aW9uID0gdmFsdWU7XG4gICAgICAgICAgdGhpcy51cGRhdGVTdGlja3lDb2x1bW5TdHlsZXMoKTtcbiAgICAgICAgfSk7XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfbXVsdGlUZW1wbGF0ZURhdGFSb3dzOiBCb29sZWFuSW5wdXQ7XG59XG5cbi8qKiBVdGlsaXR5IGZ1bmN0aW9uIHRoYXQgZ2V0cyBhIG1lcmdlZCBsaXN0IG9mIHRoZSBlbnRyaWVzIGluIGEgUXVlcnlMaXN0IGFuZCB2YWx1ZXMgb2YgYSBTZXQuICovXG5mdW5jdGlvbiBtZXJnZVF1ZXJ5TGlzdEFuZFNldDxUPihxdWVyeUxpc3Q6IFF1ZXJ5TGlzdDxUPiwgc2V0OiBTZXQ8VD4pOiBUW10ge1xuICByZXR1cm4gcXVlcnlMaXN0LnRvQXJyYXkoKS5jb25jYXQoQXJyYXkuZnJvbShzZXQpKTtcbn1cbiJdfQ==