/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AfterContentChecked, ChangeDetectorRef, ElementRef, IterableDiffers, OnInit, QueryList, TrackByFunction, ViewContainerRef } from '@angular/core';
import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { CdkFooterRowDef, CdkHeaderRowDef, CdkRowDef } from './row';
import { BehaviorSubject, Observable } from 'rxjs';
import { CdkColumnDef } from './cell';
/** Interface used to provide an outlet for rows to be inserted into. */
export interface RowOutlet {
    viewContainer: ViewContainerRef;
}
/**
 * Provides a handle for the table to grab the view container's ng-container to insert data rows.
 * @docs-private
 */
export declare class DataRowOutlet implements RowOutlet {
    viewContainer: ViewContainerRef;
    elementRef: ElementRef;
    constructor(viewContainer: ViewContainerRef, elementRef: ElementRef);
}
/**
 * Provides a handle for the table to grab the view container's ng-container to insert the header.
 * @docs-private
 */
export declare class HeaderRowOutlet implements RowOutlet {
    viewContainer: ViewContainerRef;
    elementRef: ElementRef;
    constructor(viewContainer: ViewContainerRef, elementRef: ElementRef);
}
/**
 * Provides a handle for the table to grab the view container's ng-container to insert the footer.
 * @docs-private
 */
export declare class FooterRowOutlet implements RowOutlet {
    viewContainer: ViewContainerRef;
    elementRef: ElementRef;
    constructor(viewContainer: ViewContainerRef, elementRef: ElementRef);
}
/**
 * The table template that can be used by the mat-table. Should not be used outside of the
 * material library.
 * @docs-private
 */
export declare const CDK_TABLE_TEMPLATE = "\n  <ng-container headerRowOutlet></ng-container>\n  <ng-container rowOutlet></ng-container>\n  <ng-container footerRowOutlet></ng-container>";
/**
 * A data table that can render a header row, data rows, and a footer row.
 * Uses the dataSource input to determine the data to be rendered. The data can be provided either
 * as a data array, an Observable stream that emits the data array to render, or a DataSource with a
 * connect function that will return an Observable stream that emits the data array to render.
 */
export declare class CdkTable<T> implements CollectionViewer, OnInit, AfterContentChecked {
    protected readonly _differs: IterableDiffers;
    protected readonly _changeDetectorRef: ChangeDetectorRef;
    protected readonly _elementRef: ElementRef;
    /** Subject that emits when the component has been destroyed. */
    private _onDestroy;
    /** Latest data provided by the data source. */
    private _data;
    /** Subscription that listens for the data provided by the data source. */
    private _renderChangeSubscription;
    /**
     * Map of all the user's defined columns (header, data, and footer cell template) identified by
     * name. Collection populated by the column definitions gathered by `ContentChildren` as well as
     * any custom column definitions added to `_customColumnDefs`.
     */
    private _columnDefsByName;
    /**
     * Set of all row defitions that can be used by this table. Populated by the rows gathered by
     * using `ContentChildren` as well as any custom row definitions added to `_customRowDefs`.
     */
    private _rowDefs;
    /** Differ used to find the changes in the data provided by the data source. */
    private _dataDiffer;
    /** Stores the row definition that does not have a when predicate. */
    private _defaultRowDef;
    /** Column definitions that were defined outside of the direct content children of the table. */
    private _customColumnDefs;
    /** Row definitions that were defined outside of the direct content children of the table. */
    private _customRowDefs;
    /**
     * Whether the header row definition has been changed. Triggers an update to the header row after
     * content is checked.
     */
    private _headerRowDefChanged;
    /**
     * Whether the footer row definition has been changed. Triggers an update to the footer row after
     * content is checked.
     */
    private _footerRowDefChanged;
    /**
     * Tracking function that will be used to check the differences in data changes. Used similarly
     * to `ngFor` `trackBy` function. Optimize row operations by identifying a row based on its data
     * relative to the function to know if a row should be added/removed/moved.
     * Accepts a function that takes two parameters, `index` and `item`.
     */
    trackBy: TrackByFunction<T>;
    private _trackByFn;
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
    dataSource: DataSource<T> | Observable<T[]> | T[];
    private _dataSource;
    /**
     * Stream containing the latest information on what rows are being displayed on screen.
     * Can be used by the data source to as a heuristic of what data should be provided.
     */
    viewChange: BehaviorSubject<{
        start: number;
        end: number;
    }>;
    _rowOutlet: DataRowOutlet;
    _headerRowOutlet: HeaderRowOutlet;
    _footerRowOutlet: FooterRowOutlet;
    /**
     * The column definitions provided by the user that contain what the header, data, and footer
     * cells should render for each column.
     */
    _contentColumnDefs: QueryList<CdkColumnDef>;
    /** Set of template definitions that used as the data row containers. */
    _contentRowDefs: QueryList<CdkRowDef<T>>;
    /**
     * Template definition used as the header container. By default it stores the header row
     * definition found as a direct content child. Override this value through `setHeaderRowDef` if
     * the header row definition should be changed or was not defined as a part of the table's
     * content.
     */
    _headerRowDef: CdkHeaderRowDef;
    /**
     * Template definition used as the footer container. By default it stores the footer row
     * definition found as a direct content child. Override this value through `setFooterRowDef` if
     * the footer row definition should be changed or was not defined as a part of the table's
     * content.
     */
    _footerRowDef: CdkFooterRowDef;
    constructor(_differs: IterableDiffers, _changeDetectorRef: ChangeDetectorRef, _elementRef: ElementRef, role: string);
    ngOnInit(): void;
    ngAfterContentChecked(): void;
    ngOnDestroy(): void;
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
    renderRows(): void;
    /**
     * Sets the header row definition to be used. Overrides the header row definition gathered by
     * using `ContentChild`, if one exists. Sets a flag that will re-render the header row after the
     * table's content is checked.
     */
    setHeaderRowDef(headerRowDef: CdkHeaderRowDef): void;
    /**
     * Sets the footer row definition to be used. Overrides the footer row definition gathered by
     * using `ContentChild`, if one exists. Sets a flag that will re-render the footer row after the
     * table's content is checked.
     */
    setFooterRowDef(footerRowDef: CdkFooterRowDef): void;
    /** Adds a column definition that was not included as part of the direct content children. */
    addColumnDef(columnDef: CdkColumnDef): void;
    /** Removes a column definition that was not included as part of the direct content children. */
    removeColumnDef(columnDef: CdkColumnDef): void;
    /** Adds a row definition that was not included as part of the direct content children. */
    addRowDef(rowDef: CdkRowDef<T>): void;
    /** Removes a row definition that was not included as part of the direct content children. */
    removeRowDef(rowDef: CdkRowDef<T>): void;
    /** Update the map containing the content's column definitions. */
    private _cacheColumnDefs();
    /** Update the list of all available row definitions that can be used. */
    private _cacheRowDefs();
    /**
     * Check if the header, data, or footer rows have changed what columns they want to display.
     * If there is a diff, then re-render that section.
     */
    private _renderUpdatedColumns();
    /**
     * Switch to the provided data source by resetting the data and unsubscribing from the current
     * render change subscription if one exists. If the data source is null, interpret this by
     * clearing the row outlet. Otherwise start listening for new data.
     */
    private _switchDataSource(dataSource);
    /** Set up a subscription for the data provided by the data source. */
    private _observeRenderChanges();
    /**
     * Clears any existing content in the header row outlet and creates a new embedded view
     * in the outlet using the header row definition.
     */
    private _renderHeaderRow();
    /**
     * Clears any existing content in the footer row outlet and creates a new embedded view
     * in the outlet using the footer row definition.
     */
    private _renderFooterRow();
    /**
     * Finds the matching row definition that should be used for this row data. If there is only
     * one row definition, it is returned. Otherwise, find the row definition that has a when
     * predicate that returns true with the data. If none return true, return the default row
     * definition.
     */
    _getRowDef(data: T, i: number): CdkRowDef<T>;
    /**
     * Create the embedded view for the data row template and place it in the correct index location
     * within the data row view container.
     */
    private _insertRow(rowData, index);
    /**
     * Creates a new row template in the outlet and fills it with the set of cell templates.
     * Optionally takes a context to provide to the row and cells, as well as an optional index
     * of where to place the new row template in the outlet.
     */
    private _renderRow(outlet, rowDef, context?, index?);
    /**
     * Updates the index-related context for each row to reflect any changes in the index of the rows,
     * e.g. first/last/even/odd.
     */
    private _updateRowIndexContext();
    /** Gets the column definitions for the provided row def. */
    private _getCellTemplates(rowDef);
    /** Adds native table sections (e.g. tbody) and moves the row outlets into them. */
    private _applyNativeTableSections();
}
