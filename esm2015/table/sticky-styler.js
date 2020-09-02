/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * List of all possible directions that can be used for sticky positioning.
 * @docs-private
 */
export const STICKY_DIRECTIONS = ['top', 'bottom', 'left', 'right'];
/**
 * Applies and removes sticky positioning styles to the `CdkTable` rows and columns cells.
 * @docs-private
 */
export class StickyStyler {
    /**
     * @param _isNativeHtmlTable Whether the sticky logic should be based on a table
     *     that uses the native `<table>` element.
     * @param _stickCellCss The CSS class that will be applied to every row/cell that has
     *     sticky positioning applied.
     * @param direction The directionality context of the table (ltr/rtl); affects column positioning
     *     by reversing left/right positions.
     * @param _isBrowser Whether the table is currently being rendered on the server or the client.
     * @param _needsPositionStickyOnElement Whether we need to specify position: sticky on cells
     *     using inline styles. If false, it is assumed that position: sticky is included in
     *     the component stylesheet for _stickCellCss.
     */
    constructor(_isNativeHtmlTable, _stickCellCss, direction, _coalescedStyleScheduler, _isBrowser = true, _needsPositionStickyOnElement = true) {
        this._isNativeHtmlTable = _isNativeHtmlTable;
        this._stickCellCss = _stickCellCss;
        this.direction = direction;
        this._coalescedStyleScheduler = _coalescedStyleScheduler;
        this._isBrowser = _isBrowser;
        this._needsPositionStickyOnElement = _needsPositionStickyOnElement;
        this._cachedCellWidths = [];
    }
    /**
     * Clears the sticky positioning styles from the row and its cells by resetting the `position`
     * style, setting the zIndex to 0, and unsetting each provided sticky direction.
     * @param rows The list of rows that should be cleared from sticking in the provided directions
     * @param stickyDirections The directions that should no longer be set as sticky on the rows.
     */
    clearStickyPositioning(rows, stickyDirections) {
        const elementsToClear = [];
        for (const row of rows) {
            // If the row isn't an element (e.g. if it's an `ng-container`),
            // it won't have inline styles or `children` so we skip it.
            if (row.nodeType !== row.ELEMENT_NODE) {
                continue;
            }
            elementsToClear.push(row);
            for (let i = 0; i < row.children.length; i++) {
                elementsToClear.push(row.children[i]);
            }
        }
        // Coalesce with sticky row/column updates (and potentially other changes like column resize).
        this._coalescedStyleScheduler.schedule(() => {
            for (const element of elementsToClear) {
                this._removeStickyStyle(element, stickyDirections);
            }
        });
    }
    /**
     * Applies sticky left and right positions to the cells of each row according to the sticky
     * states of the rendered column definitions.
     * @param rows The rows that should have its set of cells stuck according to the sticky states.
     * @param stickyStartStates A list of boolean states where each state represents whether the cell
     *     in this index position should be stuck to the start of the row.
     * @param stickyEndStates A list of boolean states where each state represents whether the cell
     *     in this index position should be stuck to the end of the row.
     * @param recalculateCellWidths Whether the sticky styler should recalculate the width of each
     *     column cell. If `false` cached widths will be used instead.
     */
    updateStickyColumns(rows, stickyStartStates, stickyEndStates, recalculateCellWidths = true) {
        if (!rows.length || !this._isBrowser || !(stickyStartStates.some(state => state) ||
            stickyEndStates.some(state => state))) {
            return;
        }
        const firstRow = rows[0];
        const numCells = firstRow.children.length;
        const cellWidths = this._getCellWidths(firstRow, recalculateCellWidths);
        const startPositions = this._getStickyStartColumnPositions(cellWidths, stickyStartStates);
        const endPositions = this._getStickyEndColumnPositions(cellWidths, stickyEndStates);
        // Coalesce with sticky row updates (and potentially other changes like column resize).
        this._coalescedStyleScheduler.schedule(() => {
            const isRtl = this.direction === 'rtl';
            const start = isRtl ? 'right' : 'left';
            const end = isRtl ? 'left' : 'right';
            for (const row of rows) {
                for (let i = 0; i < numCells; i++) {
                    const cell = row.children[i];
                    if (stickyStartStates[i]) {
                        this._addStickyStyle(cell, start, startPositions[i]);
                    }
                    if (stickyEndStates[i]) {
                        this._addStickyStyle(cell, end, endPositions[i]);
                    }
                }
            }
        });
    }
    /**
     * Applies sticky positioning to the row's cells if using the native table layout, and to the
     * row itself otherwise.
     * @param rowsToStick The list of rows that should be stuck according to their corresponding
     *     sticky state and to the provided top or bottom position.
     * @param stickyStates A list of boolean states where each state represents whether the row
     *     should be stuck in the particular top or bottom position.
     * @param position The position direction in which the row should be stuck if that row should be
     *     sticky.
     *
     */
    stickRows(rowsToStick, stickyStates, position) {
        // Since we can't measure the rows on the server, we can't stick the rows properly.
        if (!this._isBrowser) {
            return;
        }
        // If positioning the rows to the bottom, reverse their order when evaluating the sticky
        // position such that the last row stuck will be "bottom: 0px" and so on. Note that the
        // sticky states need to be reversed as well.
        const rows = position === 'bottom' ? rowsToStick.slice().reverse() : rowsToStick;
        const states = position === 'bottom' ? stickyStates.slice().reverse() : stickyStates;
        // Measure row heights all at once before adding sticky styles to reduce layout thrashing.
        const stickyHeights = [];
        const elementsToStick = [];
        for (let rowIndex = 0, stickyHeight = 0; rowIndex < rows.length; rowIndex++) {
            stickyHeights[rowIndex] = stickyHeight;
            if (!states[rowIndex]) {
                continue;
            }
            const row = rows[rowIndex];
            elementsToStick[rowIndex] = this._isNativeHtmlTable ?
                Array.from(row.children) : [row];
            if (rowIndex !== rows.length - 1) {
                stickyHeight += row.getBoundingClientRect().height;
            }
        }
        // Coalesce with other sticky row updates (top/bottom), sticky columns updates
        // (and potentially other changes like column resize).
        this._coalescedStyleScheduler.schedule(() => {
            for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                if (!states[rowIndex]) {
                    continue;
                }
                const height = stickyHeights[rowIndex];
                for (const element of elementsToStick[rowIndex]) {
                    this._addStickyStyle(element, position, height);
                }
            }
        });
    }
    /**
     * When using the native table in Safari, sticky footer cells do not stick. The only way to stick
     * footer rows is to apply sticky styling to the tfoot container. This should only be done if
     * all footer rows are sticky. If not all footer rows are sticky, remove sticky positioning from
     * the tfoot element.
     */
    updateStickyFooterContainer(tableElement, stickyStates) {
        if (!this._isNativeHtmlTable) {
            return;
        }
        const tfoot = tableElement.querySelector('tfoot');
        // Coalesce with other sticky updates (and potentially other changes like column resize).
        this._coalescedStyleScheduler.schedule(() => {
            if (stickyStates.some(state => !state)) {
                this._removeStickyStyle(tfoot, ['bottom']);
            }
            else {
                this._addStickyStyle(tfoot, 'bottom', 0);
            }
        });
    }
    /**
     * Removes the sticky style on the element by removing the sticky cell CSS class, re-evaluating
     * the zIndex, removing each of the provided sticky directions, and removing the
     * sticky position if there are no more directions.
     */
    _removeStickyStyle(element, stickyDirections) {
        for (const dir of stickyDirections) {
            element.style[dir] = '';
        }
        // If the element no longer has any more sticky directions, remove sticky positioning and
        // the sticky CSS class.
        // Short-circuit checking element.style[dir] for stickyDirections as they
        // were already removed above.
        const hasDirection = STICKY_DIRECTIONS.some(dir => stickyDirections.indexOf(dir) === -1 && element.style[dir]);
        if (hasDirection) {
            element.style.zIndex = this._getCalculatedZIndex(element);
        }
        else {
            // When not hasDirection, _getCalculatedZIndex will always return ''.
            element.style.zIndex = '';
            if (this._needsPositionStickyOnElement) {
                element.style.position = '';
            }
            element.classList.remove(this._stickCellCss);
        }
    }
    /**
     * Adds the sticky styling to the element by adding the sticky style class, changing position
     * to be sticky (and -webkit-sticky), setting the appropriate zIndex, and adding a sticky
     * direction and value.
     */
    _addStickyStyle(element, dir, dirValue) {
        element.classList.add(this._stickCellCss);
        element.style[dir] = `${dirValue}px`;
        element.style.zIndex = this._getCalculatedZIndex(element);
        if (this._needsPositionStickyOnElement) {
            element.style.cssText += 'position: -webkit-sticky; position: sticky; ';
        }
    }
    /**
     * Calculate what the z-index should be for the element, depending on what directions (top,
     * bottom, left, right) have been set. It should be true that elements with a top direction
     * should have the highest index since these are elements like a table header. If any of those
     * elements are also sticky in another direction, then they should appear above other elements
     * that are only sticky top (e.g. a sticky column on a sticky header). Bottom-sticky elements
     * (e.g. footer rows) should then be next in the ordering such that they are below the header
     * but above any non-sticky elements. Finally, left/right sticky elements (e.g. sticky columns)
     * should minimally increment so that they are above non-sticky elements but below top and bottom
     * elements.
     */
    _getCalculatedZIndex(element) {
        const zIndexIncrements = {
            top: 100,
            bottom: 10,
            left: 1,
            right: 1,
        };
        let zIndex = 0;
        // Use `Iterable` instead of `Array` because TypeScript, as of 3.6.3,
        // loses the array generic type in the `for of`. But we *also* have to use `Array` because
        // typescript won't iterate over an `Iterable` unless you compile with `--downlevelIteration`
        for (const dir of STICKY_DIRECTIONS) {
            if (element.style[dir]) {
                zIndex += zIndexIncrements[dir];
            }
        }
        return zIndex ? `${zIndex}` : '';
    }
    /** Gets the widths for each cell in the provided row. */
    _getCellWidths(row, recalculateCellWidths = true) {
        if (!recalculateCellWidths && this._cachedCellWidths.length) {
            return this._cachedCellWidths;
        }
        const cellWidths = [];
        const firstRowCells = row.children;
        for (let i = 0; i < firstRowCells.length; i++) {
            let cell = firstRowCells[i];
            cellWidths.push(cell.getBoundingClientRect().width);
        }
        this._cachedCellWidths = cellWidths;
        return cellWidths;
    }
    /**
     * Determines the left and right positions of each sticky column cell, which will be the
     * accumulation of all sticky column cell widths to the left and right, respectively.
     * Non-sticky cells do not need to have a value set since their positions will not be applied.
     */
    _getStickyStartColumnPositions(widths, stickyStates) {
        const positions = [];
        let nextPosition = 0;
        for (let i = 0; i < widths.length; i++) {
            if (stickyStates[i]) {
                positions[i] = nextPosition;
                nextPosition += widths[i];
            }
        }
        return positions;
    }
    /**
     * Determines the left and right positions of each sticky column cell, which will be the
     * accumulation of all sticky column cell widths to the left and right, respectively.
     * Non-sticky cells do not need to have a value set since their positions will not be applied.
     */
    _getStickyEndColumnPositions(widths, stickyStates) {
        const positions = [];
        let nextPosition = 0;
        for (let i = widths.length; i > 0; i--) {
            if (stickyStates[i]) {
                positions[i] = nextPosition;
                nextPosition += widths[i];
            }
        }
        return positions;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RpY2t5LXN0eWxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGFibGUvc3RpY2t5LXN0eWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFXSDs7O0dBR0c7QUFDSCxNQUFNLENBQUMsTUFBTSxpQkFBaUIsR0FBc0IsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUd2Rjs7O0dBR0c7QUFDSCxNQUFNLE9BQU8sWUFBWTtJQUd2Qjs7Ozs7Ozs7Ozs7T0FXRztJQUNILFlBQW9CLGtCQUEyQixFQUMzQixhQUFxQixFQUN0QixTQUFvQixFQUNuQix3QkFBa0QsRUFDbEQsYUFBYSxJQUFJLEVBQ1IsZ0NBQWdDLElBQUk7UUFMN0MsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFTO1FBQzNCLGtCQUFhLEdBQWIsYUFBYSxDQUFRO1FBQ3RCLGNBQVMsR0FBVCxTQUFTLENBQVc7UUFDbkIsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtRQUNsRCxlQUFVLEdBQVYsVUFBVSxDQUFPO1FBQ1Isa0NBQTZCLEdBQTdCLDZCQUE2QixDQUFPO1FBbkJ6RCxzQkFBaUIsR0FBYSxFQUFFLENBQUM7SUFtQjRCLENBQUM7SUFFdEU7Ozs7O09BS0c7SUFDSCxzQkFBc0IsQ0FBQyxJQUFtQixFQUFFLGdCQUFtQztRQUM3RSxNQUFNLGVBQWUsR0FBa0IsRUFBRSxDQUFDO1FBQzFDLEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxFQUFFO1lBQ3RCLGdFQUFnRTtZQUNoRSwyREFBMkQ7WUFDM0QsSUFBSSxHQUFHLENBQUMsUUFBUSxLQUFLLEdBQUcsQ0FBQyxZQUFZLEVBQUU7Z0JBQ3JDLFNBQVM7YUFDVjtZQUVELGVBQWUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxH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TyxVQUFVLENBQUM7SUFDcEIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCw4QkFBOEIsQ0FBQyxNQUFnQixFQUFFLFlBQXVCO1FBQ3RFLE1BQU0sU0FBUyxHQUFhLEVBQUUsQ0FBQztRQUMvQixJQUFJLFlBQVksR0FBRyxDQUFDLENBQUM7UUFFckIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDdEMsSUFBSSxZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ25CLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxZQUFZLENBQUM7Z0JBQzVCLFlBQVksSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDM0I7U0FDRjtRQUVELE9BQU8sU0FBUyxDQUFDO0lBQ25CLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsNEJBQTRCLENBQUMsTUFBZ0IsRUFBRSxZQUF1QjtRQUNwRSxNQUFNLFNBQVMsR0FBYSxFQUFFLENBQUM7UUFDL0IsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDO1FBRXJCLEtBQUssSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3RDLElBQUksWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNuQixTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsWUFBWSxDQUFDO2dCQUM1QixZQUFZLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQzNCO1NBQ0Y7UUFFRCxPQUFPLFNBQVMsQ0FBQztJQUNuQixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqXG4gKiBEaXJlY3Rpb25zIHRoYXQgY2FuIGJlIHVzZWQgd2hlbiBzZXR0aW5nIHN0aWNreSBwb3NpdGlvbmluZy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuaW1wb3J0IHtEaXJlY3Rpb259IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7X0NvYWxlc2NlZFN0eWxlU2NoZWR1bGVyfSBmcm9tICcuL2NvYWxlc2NlZC1zdHlsZS1zY2hlZHVsZXInO1xuXG5leHBvcnQgdHlwZSBTdGlja3lEaXJlY3Rpb24gPSAndG9wJyB8ICdib3R0b20nIHwgJ2xlZnQnIHwgJ3JpZ2h0JztcblxuLyoqXG4gKiBMaXN0IG9mIGFsbCBwb3NzaWJsZSBkaXJlY3Rpb25zIHRoYXQgY2FuIGJlIHVzZWQgZm9yIHN0aWNreSBwb3NpdGlvbmluZy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGNvbnN0IFNUSUNLWV9ESVJFQ1RJT05TOiBTdGlja3lEaXJlY3Rpb25bXSA9IFsndG9wJywgJ2JvdHRvbScsICdsZWZ0JywgJ3JpZ2h0J107XG5cblxuLyoqXG4gKiBBcHBsaWVzIGFuZCByZW1vdmVzIHN0aWNreSBwb3NpdGlvbmluZyBzdHlsZXMgdG8gdGhlIGBDZGtUYWJsZWAgcm93cyBhbmQgY29sdW1ucyBjZWxscy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGNsYXNzIFN0aWNreVN0eWxlciB7XG4gIHByaXZhdGUgX2NhY2hlZENlbGxXaWR0aHM6IG51bWJlcltdID0gW107XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBfaXNOYXRpdmVIdG1sVGFibGUgV2hldGhlciB0aGUgc3RpY2t5IGxvZ2ljIHNob3VsZCBiZSBiYXNlZCBvbiBhIHRhYmxlXG4gICAqICAgICB0aGF0IHVzZXMgdGhlIG5hdGl2ZSBgPHRhYmxlPmAgZWxlbWVudC5cbiAgICogQHBhcmFtIF9zdGlja0NlbGxDc3MgVGhlIENTUyBjbGFzcyB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byBldmVyeSByb3cvY2VsbCB0aGF0IGhhc1xuICAgKiAgICAgc3RpY2t5IHBvc2l0aW9uaW5nIGFwcGxpZWQuXG4gICAqIEBwYXJhbSBkaXJlY3Rpb24gVGhlIGRpcmVjdGlvbmFsaXR5IGNvbnRleHQgb2YgdGhlIHRhYmxlIChsdHIvcnRsKTsgYWZmZWN0cyBjb2x1bW4gcG9zaXRpb25pbmdcbiAgICogICAgIGJ5IHJldmVyc2luZyBsZWZ0L3JpZ2h0IHBvc2l0aW9ucy5cbiAgICogQHBhcmFtIF9pc0Jyb3dzZXIgV2hldGhlciB0aGUgdGFibGUgaXMgY3VycmVudGx5IGJlaW5nIHJlbmRlcmVkIG9uIHRoZSBzZXJ2ZXIgb3IgdGhlIGNsaWVudC5cbiAgICogQHBhcmFtIF9uZWVkc1Bvc2l0aW9uU3RpY2t5T25FbGVtZW50IFdoZXRoZXIgd2UgbmVlZCB0byBzcGVjaWZ5IHBvc2l0aW9uOiBzdGlja3kgb24gY2VsbHNcbiAgICogICAgIHVzaW5nIGlubGluZSBzdHlsZXMuIElmIGZhbHNlLCBpdCBpcyBhc3N1bWVkIHRoYXQgcG9zaXRpb246IHN0aWNreSBpcyBpbmNsdWRlZCBpblxuICAgKiAgICAgdGhlIGNvbXBvbmVudCBzdHlsZXNoZWV0IGZvciBfc3RpY2tDZWxsQ3NzLlxuICAgKi9cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfaXNOYXRpdmVIdG1sVGFibGU6IGJvb2xlYW4sXG4gICAgICAgICAgICAgIHByaXZhdGUgX3N0aWNrQ2VsbENzczogc3RyaW5nLFxuICAgICAgICAgICAgICBwdWJsaWMgZGlyZWN0aW9uOiBEaXJlY3Rpb24sXG4gICAgICAgICAgICAgIHByaXZhdGUgX2NvYWxlc2NlZFN0eWxlU2NoZWR1bGVyOiBfQ29hbGVzY2VkU3R5bGVTY2hlZHVsZXIsXG4gICAgICAgICAgICAgIHByaXZhdGUgX2lzQnJvd3NlciA9IHRydWUsXG4gICAgICAgICAgICAgIHByaXZhdGUgcmVhZG9ubHkgX25lZWRzUG9zaXRpb25TdGlja3lPbkVsZW1lbnQgPSB0cnVlKSB7IH1cblxuICAvKipcbiAgICogQ2xlYXJzIHRoZSBzdGlja3kgcG9zaXRpb25pbmcgc3R5bGVzIGZyb20gdGhlIHJvdyBhbmQgaXRzIGNlbGxzIGJ5IHJlc2V0dGluZyB0aGUgYHBvc2l0aW9uYFxuICAgKiBzdHlsZSwgc2V0dGluZyB0aGUgekluZGV4IHRvIDAsIGFuZCB1bnNldHRpbmcgZWFjaCBwcm92aWRlZCBzdGlja3kgZGlyZWN0aW9uLlxuICAgKiBAcGFyYW0gcm93cyBUaGUgbGlzdCBvZiByb3dzIHRoYXQgc2hvdWxkIGJlIGNsZWFyZWQgZnJvbSBzdGlja2luZyBpbiB0aGUgcHJvdmlkZWQgZGlyZWN0aW9uc1xuICAgKiBAcGFyYW0gc3RpY2t5RGlyZWN0aW9ucyBUaGUgZGlyZWN0aW9ucyB0aGF0IHNob3VsZCBubyBsb25nZXIgYmUgc2V0IGFzIHN0aWNreSBvbiB0aGUgcm93cy5cbiAgICovXG4gIGNsZWFyU3RpY2t5UG9zaXRpb25pbmcocm93czogSFRNTEVsZW1lbnRbXSwgc3RpY2t5RGlyZWN0aW9uczogU3RpY2t5RGlyZWN0aW9uW10pIHtcbiAgICBjb25zdCBlbGVtZW50c1RvQ2xlYXI6IEhUTUxFbGVtZW50W10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICAvLyBJZiB0aGUgcm93IGlzbid0IGFuIGVsZW1lbnQgKGUuZy4gaWYgaXQncyBhbiBgbmctY29udGFpbmVyYCksXG4gICAgICAvLyBpdCB3b24ndCBoYXZlIGlubGluZSBzdHlsZXMgb3IgYGNoaWxkcmVuYCBzbyB3ZSBza2lwIGl0LlxuICAgICAgaWYgKHJvdy5ub2RlVHlwZSAhPT0gcm93LkVMRU1FTlRfTk9ERSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgZWxlbWVudHNUb0NsZWFyLnB1c2gocm93KTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcm93LmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGVsZW1lbnRzVG9DbGVhci5wdXNoKHJvdy5jaGlsZHJlbltpXSBhcyBIVE1MRWxlbWVudCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ29hbGVzY2Ugd2l0aCBzdGlja3kgcm93L2NvbHVtbiB1cGRhdGVzIChhbmQgcG90ZW50aWFsbHkgb3RoZXIgY2hhbmdlcyBsaWtlIGNvbHVtbiByZXNpemUpLlxuICAgIHRoaXMuX2NvYWxlc2NlZFN0eWxlU2NoZWR1bGVyLnNjaGVkdWxlKCgpID0+IHtcbiAgICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBlbGVtZW50c1RvQ2xlYXIpIHtcbiAgICAgICAgdGhpcy5fcmVtb3ZlU3RpY2t5U3R5bGUoZWxlbWVudCwgc3RpY2t5RGlyZWN0aW9ucyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyBzdGlja3kgbGVmdCBhbmQgcmlnaHQgcG9zaXRpb25zIHRvIHRoZSBjZWxscyBvZiBlYWNoIHJvdyBhY2NvcmRpbmcgdG8gdGhlIHN0aWNreVxuICAgKiBzdGF0ZXMgb2YgdGhlIHJlbmRlcmVkIGNvbHVtbiBkZWZpbml0aW9ucy5cbiAgICogQHBhcmFtIHJvd3MgVGhlIHJvd3MgdGhhdCBzaG91bGQgaGF2ZSBpdHMgc2V0IG9mIGNlbGxzIHN0dWNrIGFjY29yZGluZyB0byB0aGUgc3RpY2t5IHN0YXRlcy5cbiAgICogQHBhcmFtIHN0aWNreVN0YXJ0U3RhdGVzIEEgbGlzdCBvZiBib29sZWFuIHN0YXRlcyB3aGVyZSBlYWNoIHN0YXRlIHJlcHJlc2VudHMgd2hldGhlciB0aGUgY2VsbFxuICAgKiAgICAgaW4gdGhpcyBpbmRleCBwb3NpdGlvbiBzaG91bGQgYmUgc3R1Y2sgdG8gdGhlIHN0YXJ0IG9mIHRoZSByb3cuXG4gICAqIEBwYXJhbSBzdGlja3lFbmRTdGF0ZXMgQSBsaXN0IG9mIGJvb2xlYW4gc3RhdGVzIHdoZXJlIGVhY2ggc3RhdGUgcmVwcmVzZW50cyB3aGV0aGVyIHRoZSBjZWxsXG4gICAqICAgICBpbiB0aGlzIGluZGV4IHBvc2l0aW9uIHNob3VsZCBiZSBzdHVjayB0byB0aGUgZW5kIG9mIHRoZSByb3cuXG4gICAqIEBwYXJhbSByZWNhbGN1bGF0ZUNlbGxXaWR0aHMgV2hldGhlciB0aGUgc3RpY2t5IHN0eWxlciBzaG91bGQgcmVjYWxjdWxhdGUgdGhlIHdpZHRoIG9mIGVhY2hcbiAgICogICAgIGNvbHVtbiBjZWxsLiBJZiBgZmFsc2VgIGNhY2hlZCB3aWR0aHMgd2lsbCBiZSB1c2VkIGluc3RlYWQuXG4gICAqL1xuICB1cGRhdGVTdGlja3lDb2x1bW5zKFxuICAgICAgcm93czogSFRNTEVsZW1lbnRbXSwgc3RpY2t5U3RhcnRTdGF0ZXM6IGJvb2xlYW5bXSwgc3RpY2t5RW5kU3RhdGVzOiBib29sZWFuW10sXG4gICAgICByZWNhbGN1bGF0ZUNlbGxXaWR0aHMgPSB0cnVlKSB7XG4gICAgaWYgKCFyb3dzLmxlbmd0aCB8fCAhdGhpcy5faXNCcm93c2VyIHx8ICEoc3RpY2t5U3RhcnRTdGF0ZXMuc29tZShzdGF0ZSA9PiBzdGF0ZSkgfHxcbiAgICAgICAgc3RpY2t5RW5kU3RhdGVzLnNvbWUoc3RhdGUgPT4gc3RhdGUpKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGZpcnN0Um93ID0gcm93c1swXTtcbiAgICBjb25zdCBudW1DZWxscyA9IGZpcnN0Um93LmNoaWxkcmVuLmxlbmd0aDtcbiAgICBjb25zdCBjZWxsV2lkdGhzOiBudW1iZXJbXSA9IHRoaXMuX2dldENlbGxXaWR0aHMoZmlyc3RSb3csIHJlY2FsY3VsYXRlQ2VsbFdpZHRocyk7XG5cbiAgICBjb25zdCBzdGFydFBvc2l0aW9ucyA9IHRoaXMuX2dldFN0aWNreVN0YXJ0Q29sdW1uUG9zaXRpb25zKGNlbGxXaWR0aHMsIHN0aWNreVN0YXJ0U3RhdGVzKTtcbiAgICBjb25zdCBlbmRQb3NpdGlvbnMgPSB0aGlzLl9nZXRTdGlja3lFbmRDb2x1bW5Qb3NpdGlvbnMoY2VsbFdpZHRocywgc3RpY2t5RW5kU3RhdGVzKTtcblxuICAgIC8vIENvYWxlc2NlIHdpdGggc3RpY2t5IHJvdyB1cGRhdGVzIChhbmQgcG90ZW50aWFsbHkgb3RoZXIgY2hhbmdlcyBsaWtlIGNvbHVtbiByZXNpemUpLlxuICAgIHRoaXMuX2NvYWxlc2NlZFN0eWxlU2NoZWR1bGVyLnNjaGVkdWxlKCgpID0+IHtcbiAgICAgIGNvbnN0IGlzUnRsID0gdGhpcy5kaXJlY3Rpb24gPT09ICdydGwnO1xuICAgICAgY29uc3Qgc3RhcnQgPSBpc1J0bCA/ICdyaWdodCcgOiAnbGVmdCc7XG4gICAgICBjb25zdCBlbmQgPSBpc1J0bCA/ICdsZWZ0JyA6ICdyaWdodCc7XG5cbiAgICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1DZWxsczsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgY2VsbCA9IHJvdy5jaGlsZHJlbltpXSBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgICBpZiAoc3RpY2t5U3RhcnRTdGF0ZXNbaV0pIHtcbiAgICAgICAgICAgIHRoaXMuX2FkZFN0aWNreVN0eWxlKGNlbGwsIHN0YXJ0LCBzdGFydFBvc2l0aW9uc1tpXSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHN0aWNreUVuZFN0YXRlc1tpXSkge1xuICAgICAgICAgICAgdGhpcy5fYWRkU3RpY2t5U3R5bGUoY2VsbCwgZW5kLCBlbmRQb3NpdGlvbnNbaV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgc3RpY2t5IHBvc2l0aW9uaW5nIHRvIHRoZSByb3cncyBjZWxscyBpZiB1c2luZyB0aGUgbmF0aXZlIHRhYmxlIGxheW91dCwgYW5kIHRvIHRoZVxuICAgKiByb3cgaXRzZWxmIG90aGVyd2lzZS5cbiAgICogQHBhcmFtIHJvd3NUb1N0aWNrIFRoZSBsaXN0IG9mIHJvd3MgdGhhdCBzaG91bGQgYmUgc3R1Y2sgYWNjb3JkaW5nIHRvIHRoZWlyIGNvcnJlc3BvbmRpbmdcbiAgICogICAgIHN0aWNreSBzdGF0ZSBhbmQgdG8gdGhlIHByb3ZpZGVkIHRvcCBvciBib3R0b20gcG9zaXRpb24uXG4gICAqIEBwYXJhbSBzdGlja3lTdGF0ZXMgQSBsaXN0IG9mIGJvb2xlYW4gc3RhdGVzIHdoZXJlIGVhY2ggc3RhdGUgcmVwcmVzZW50cyB3aGV0aGVyIHRoZSByb3dcbiAgICogICAgIHNob3VsZCBiZSBzdHVjayBpbiB0aGUgcGFydGljdWxhciB0b3Agb3IgYm90dG9tIHBvc2l0aW9uLlxuICAgKiBAcGFyYW0gcG9zaXRpb24gVGhlIHBvc2l0aW9uIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgcm93IHNob3VsZCBiZSBzdHVjayBpZiB0aGF0IHJvdyBzaG91bGQgYmVcbiAgICogICAgIHN0aWNreS5cbiAgICpcbiAgICovXG4gIHN0aWNrUm93cyhyb3dzVG9TdGljazogSFRNTEVsZW1lbnRbXSwgc3RpY2t5U3RhdGVzOiBib29sZWFuW10sIHBvc2l0aW9uOiAndG9wJyB8ICdib3R0b20nKSB7XG4gICAgLy8gU2luY2Ugd2UgY2FuJ3QgbWVhc3VyZSB0aGUgcm93cyBvbiB0aGUgc2VydmVyLCB3ZSBjYW4ndCBzdGljayB0aGUgcm93cyBwcm9wZXJseS5cbiAgICBpZiAoIXRoaXMuX2lzQnJvd3Nlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIElmIHBvc2l0aW9uaW5nIHRoZSByb3dzIHRvIHRoZSBib3R0b20sIHJldmVyc2UgdGhlaXIgb3JkZXIgd2hlbiBldmFsdWF0aW5nIHRoZSBzdGlja3lcbiAgICAvLyBwb3NpdGlvbiBzdWNoIHRoYXQgdGhlIGxhc3Qgcm93IHN0dWNrIHdpbGwgYmUgXCJib3R0b206IDBweFwiIGFuZCBzbyBvbi4gTm90ZSB0aGF0IHRoZVxuICAgIC8vIHN0aWNreSBzdGF0ZXMgbmVlZCB0byBiZSByZXZlcnNlZCBhcyB3ZWxsLlxuICAgIGNvbnN0IHJvd3MgPSBwb3NpdGlvbiA9PT0gJ2JvdHRvbScgPyByb3dzVG9TdGljay5zbGljZSgpLnJldmVyc2UoKSA6IHJvd3NUb1N0aWNrO1xuICAgIGNvbnN0IHN0YXRlcyA9IHBvc2l0aW9uID09PSAnYm90dG9tJyA/IHN0aWNreVN0YXRlcy5zbGljZSgpLnJldmVyc2UoKSA6IHN0aWNreVN0YXRlcztcblxuICAgIC8vIE1lYXN1cmUgcm93IGhlaWdodHMgYWxsIGF0IG9uY2UgYmVmb3JlIGFkZGluZyBzdGlja3kgc3R5bGVzIHRvIHJlZHVjZSBsYXlvdXQgdGhyYXNoaW5nLlxuICAgIGNvbnN0IHN0aWNreUhlaWdodHM6IG51bWJlcltdID0gW107XG4gICAgY29uc3QgZWxlbWVudHNUb1N0aWNrOiBIVE1MRWxlbWVudFtdW10gPSBbXTtcbiAgICBmb3IgKGxldCByb3dJbmRleCA9IDAsIHN0aWNreUhlaWdodCA9IDA7IHJvd0luZGV4IDwgcm93cy5sZW5ndGg7IHJvd0luZGV4KyspIHtcbiAgICAgIHN0aWNreUhlaWdodHNbcm93SW5kZXhdID0gc3RpY2t5SGVpZ2h0O1xuXG4gICAgICBpZiAoIXN0YXRlc1tyb3dJbmRleF0pIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJvdyA9IHJvd3Nbcm93SW5kZXhdO1xuICAgICAgZWxlbWVudHNUb1N0aWNrW3Jvd0luZGV4XSA9IHRoaXMuX2lzTmF0aXZlSHRtbFRhYmxlID9cbiAgICAgICAgICBBcnJheS5mcm9tKHJvdy5jaGlsZHJlbikgYXMgSFRNTEVsZW1lbnRbXSA6IFtyb3ddO1xuXG4gICAgICBpZiAocm93SW5kZXggIT09IHJvd3MubGVuZ3RoIC0gMSkge1xuICAgICAgICBzdGlja3lIZWlnaHQgKz0gcm93LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDb2FsZXNjZSB3aXRoIG90aGVyIHN0aWNreSByb3cgdXBkYXRlcyAodG9wL2JvdHRvbSksIHN0aWNreSBjb2x1bW5zIHVwZGF0ZXNcbiAgICAvLyAoYW5kIHBvdGVudGlhbGx5IG90aGVyIGNoYW5nZXMgbGlrZSBjb2x1bW4gcmVzaXplKS5cbiAgICB0aGlzLl9jb2FsZXNjZWRTdHlsZVNjaGVkdWxlci5zY2hlZHVsZSgoKSA9PiB7XG4gICAgICBmb3IgKGxldCByb3dJbmRleCA9IDA7IHJvd0luZGV4IDwgcm93cy5sZW5ndGg7IHJvd0luZGV4KyspIHtcbiAgICAgICAgaWYgKCFzdGF0ZXNbcm93SW5kZXhdKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBoZWlnaHQgPSBzdGlja3lIZWlnaHRzW3Jvd0luZGV4XTtcbiAgICAgICAgZm9yIChjb25zdCBlbGVtZW50IG9mIGVsZW1lbnRzVG9TdGlja1tyb3dJbmRleF0pIHtcbiAgICAgICAgICB0aGlzLl9hZGRTdGlja3lTdHlsZShlbGVtZW50LCBwb3NpdGlvbiwgaGVpZ2h0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZW4gdXNpbmcgdGhlIG5hdGl2ZSB0YWJsZSBpbiBTYWZhcmksIHN0aWNreSBmb290ZXIgY2VsbHMgZG8gbm90IHN0aWNrLiBUaGUgb25seSB3YXkgdG8gc3RpY2tcbiAgICogZm9vdGVyIHJvd3MgaXMgdG8gYXBwbHkgc3RpY2t5IHN0eWxpbmcgdG8gdGhlIHRmb290IGNvbnRhaW5lci4gVGhpcyBzaG91bGQgb25seSBiZSBkb25lIGlmXG4gICAqIGFsbCBmb290ZXIgcm93cyBhcmUgc3RpY2t5LiBJZiBub3QgYWxsIGZvb3RlciByb3dzIGFyZSBzdGlja3ksIHJlbW92ZSBzdGlja3kgcG9zaXRpb25pbmcgZnJvbVxuICAgKiB0aGUgdGZvb3QgZWxlbWVudC5cbiAgICovXG4gIHVwZGF0ZVN0aWNreUZvb3RlckNvbnRhaW5lcih0YWJsZUVsZW1lbnQ6IEVsZW1lbnQsIHN0aWNreVN0YXRlczogYm9vbGVhbltdKSB7XG4gICAgaWYgKCF0aGlzLl9pc05hdGl2ZUh0bWxUYWJsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRmb290ID0gdGFibGVFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ3Rmb290JykhO1xuXG4gICAgLy8gQ29hbGVzY2Ugd2l0aCBvdGhlciBzdGlja3kgdXBkYXRlcyAoYW5kIHBvdGVudGlhbGx5IG90aGVyIGNoYW5nZXMgbGlrZSBjb2x1bW4gcmVzaXplKS5cbiAgICB0aGlzLl9jb2FsZXNjZWRTdHlsZVNjaGVkdWxlci5zY2hlZHVsZSgoKSA9PiB7XG4gICAgICBpZiAoc3RpY2t5U3RhdGVzLnNvbWUoc3RhdGUgPT4gIXN0YXRlKSkge1xuICAgICAgICB0aGlzLl9yZW1vdmVTdGlja3lTdHlsZSh0Zm9vdCwgWydib3R0b20nXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9hZGRTdGlja3lTdHlsZSh0Zm9vdCwgJ2JvdHRvbScsIDApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgdGhlIHN0aWNreSBzdHlsZSBvbiB0aGUgZWxlbWVudCBieSByZW1vdmluZyB0aGUgc3RpY2t5IGNlbGwgQ1NTIGNsYXNzLCByZS1ldmFsdWF0aW5nXG4gICAqIHRoZSB6SW5kZXgsIHJlbW92aW5nIGVhY2ggb2YgdGhlIHByb3ZpZGVkIHN0aWNreSBkaXJlY3Rpb25zLCBhbmQgcmVtb3ZpbmcgdGhlXG4gICAqIHN0aWNreSBwb3NpdGlvbiBpZiB0aGVyZSBhcmUgbm8gbW9yZSBkaXJlY3Rpb25zLlxuICAgKi9cbiAgX3JlbW92ZVN0aWNreVN0eWxlKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBzdGlja3lEaXJlY3Rpb25zOiBTdGlja3lEaXJlY3Rpb25bXSkge1xuICAgIGZvciAoY29uc3QgZGlyIG9mIHN0aWNreURpcmVjdGlvbnMpIHtcbiAgICAgIGVsZW1lbnQuc3R5bGVbZGlyXSA9ICcnO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBlbGVtZW50IG5vIGxvbmdlciBoYXMgYW55IG1vcmUgc3RpY2t5IGRpcmVjdGlvbnMsIHJlbW92ZSBzdGlja3kgcG9zaXRpb25pbmcgYW5kXG4gICAgLy8gdGhlIHN0aWNreSBDU1MgY2xhc3MuXG4gICAgLy8gU2hvcnQtY2lyY3VpdCBjaGVja2luZyBlbGVtZW50LnN0eWxlW2Rpcl0gZm9yIHN0aWNreURpcmVjdGlvbnMgYXMgdGhleVxuICAgIC8vIHdlcmUgYWxyZWFkeSByZW1vdmVkIGFib3ZlLlxuICAgIGNvbnN0IGhhc0RpcmVjdGlvbiA9IFNUSUNLWV9ESVJFQ1RJT05TLnNvbWUoZGlyID0+XG4gICAgICAgIHN0aWNreURpcmVjdGlvbnMuaW5kZXhPZihkaXIpID09PSAtMSAmJiBlbGVtZW50LnN0eWxlW2Rpcl0pO1xuICAgIGlmIChoYXNEaXJlY3Rpb24pIHtcbiAgICAgIGVsZW1lbnQuc3R5bGUuekluZGV4ID0gdGhpcy5fZ2V0Q2FsY3VsYXRlZFpJbmRleChlbGVtZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gV2hlbiBub3QgaGFzRGlyZWN0aW9uLCBfZ2V0Q2FsY3VsYXRlZFpJbmRleCB3aWxsIGFsd2F5cyByZXR1cm4gJycuXG4gICAgICBlbGVtZW50LnN0eWxlLnpJbmRleCA9ICcnO1xuICAgICAgaWYgKHRoaXMuX25lZWRzUG9zaXRpb25TdGlja3lPbkVsZW1lbnQpIHtcbiAgICAgICAgZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICcnO1xuICAgICAgfVxuICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKHRoaXMuX3N0aWNrQ2VsbENzcyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGhlIHN0aWNreSBzdHlsaW5nIHRvIHRoZSBlbGVtZW50IGJ5IGFkZGluZyB0aGUgc3RpY2t5IHN0eWxlIGNsYXNzLCBjaGFuZ2luZyBwb3NpdGlvblxuICAgKiB0byBiZSBzdGlja3kgKGFuZCAtd2Via2l0LXN0aWNreSksIHNldHRpbmcgdGhlIGFwcHJvcHJpYXRlIHpJbmRleCwgYW5kIGFkZGluZyBhIHN0aWNreVxuICAgKiBkaXJlY3Rpb24gYW5kIHZhbHVlLlxuICAgKi9cbiAgX2FkZFN0aWNreVN0eWxlKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBkaXI6IFN0aWNreURpcmVjdGlvbiwgZGlyVmFsdWU6IG51bWJlcikge1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCh0aGlzLl9zdGlja0NlbGxDc3MpO1xuICAgIGVsZW1lbnQuc3R5bGVbZGlyXSA9IGAke2RpclZhbHVlfXB4YDtcbiAgICBlbGVtZW50LnN0eWxlLnpJbmRleCA9IHRoaXMuX2dldENhbGN1bGF0ZWRaSW5kZXgoZWxlbWVudCk7XG4gICAgaWYgKHRoaXMuX25lZWRzUG9zaXRpb25TdGlja3lPbkVsZW1lbnQpIHtcbiAgICAgIGVsZW1lbnQuc3R5bGUuY3NzVGV4dCArPSAncG9zaXRpb246IC13ZWJraXQtc3RpY2t5OyBwb3NpdGlvbjogc3RpY2t5OyAnO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGUgd2hhdCB0aGUgei1pbmRleCBzaG91bGQgYmUgZm9yIHRoZSBlbGVtZW50LCBkZXBlbmRpbmcgb24gd2hhdCBkaXJlY3Rpb25zICh0b3AsXG4gICAqIGJvdHRvbSwgbGVmdCwgcmlnaHQpIGhhdmUgYmVlbiBzZXQuIEl0IHNob3VsZCBiZSB0cnVlIHRoYXQgZWxlbWVudHMgd2l0aCBhIHRvcCBkaXJlY3Rpb25cbiAgICogc2hvdWxkIGhhdmUgdGhlIGhpZ2hlc3QgaW5kZXggc2luY2UgdGhlc2UgYXJlIGVsZW1lbnRzIGxpa2UgYSB0YWJsZSBoZWFkZXIuIElmIGFueSBvZiB0aG9zZVxuICAgKiBlbGVtZW50cyBhcmUgYWxzbyBzdGlja3kgaW4gYW5vdGhlciBkaXJlY3Rpb24sIHRoZW4gdGhleSBzaG91bGQgYXBwZWFyIGFib3ZlIG90aGVyIGVsZW1lbnRzXG4gICAqIHRoYXQgYXJlIG9ubHkgc3RpY2t5IHRvcCAoZS5nLiBhIHN0aWNreSBjb2x1bW4gb24gYSBzdGlja3kgaGVhZGVyKS4gQm90dG9tLXN0aWNreSBlbGVtZW50c1xuICAgKiAoZS5nLiBmb290ZXIgcm93cykgc2hvdWxkIHRoZW4gYmUgbmV4dCBpbiB0aGUgb3JkZXJpbmcgc3VjaCB0aGF0IHRoZXkgYXJlIGJlbG93IHRoZSBoZWFkZXJcbiAgICogYnV0IGFib3ZlIGFueSBub24tc3RpY2t5IGVsZW1lbnRzLiBGaW5hbGx5LCBsZWZ0L3JpZ2h0IHN0aWNreSBlbGVtZW50cyAoZS5nLiBzdGlja3kgY29sdW1ucylcbiAgICogc2hvdWxkIG1pbmltYWxseSBpbmNyZW1lbnQgc28gdGhhdCB0aGV5IGFyZSBhYm92ZSBub24tc3RpY2t5IGVsZW1lbnRzIGJ1dCBiZWxvdyB0b3AgYW5kIGJvdHRvbVxuICAgKiBlbGVtZW50cy5cbiAgICovXG4gIF9nZXRDYWxjdWxhdGVkWkluZGV4KGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogc3RyaW5nIHtcbiAgICBjb25zdCB6SW5kZXhJbmNyZW1lbnRzID0ge1xuICAgICAgdG9wOiAxMDAsXG4gICAgICBib3R0b206IDEwLFxuICAgICAgbGVmdDogMSxcbiAgICAgIHJpZ2h0OiAxLFxuICAgIH07XG5cbiAgICBsZXQgekluZGV4ID0gMDtcbiAgICAvLyBVc2UgYEl0ZXJhYmxlYCBpbnN0ZWFkIG9mIGBBcnJheWAgYmVjYXVzZSBUeXBlU2NyaXB0LCBhcyBvZiAzLjYuMyxcbiAgICAvLyBsb3NlcyB0aGUgYXJyYXkgZ2VuZXJpYyB0eXBlIGluIHRoZSBgZm9yIG9mYC4gQnV0IHdlICphbHNvKiBoYXZlIHRvIHVzZSBgQXJyYXlgIGJlY2F1c2VcbiAgICAvLyB0eXBlc2NyaXB0IHdvbid0IGl0ZXJhdGUgb3ZlciBhbiBgSXRlcmFibGVgIHVubGVzcyB5b3UgY29tcGlsZSB3aXRoIGAtLWRvd25sZXZlbEl0ZXJhdGlvbmBcbiAgICBmb3IgKGNvbnN0IGRpciBvZiBTVElDS1lfRElSRUNUSU9OUyBhcyBJdGVyYWJsZTxTdGlja3lEaXJlY3Rpb24+ICYgU3RpY2t5RGlyZWN0aW9uW10pIHtcbiAgICAgIGlmIChlbGVtZW50LnN0eWxlW2Rpcl0pIHtcbiAgICAgICAgekluZGV4ICs9IHpJbmRleEluY3JlbWVudHNbZGlyXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gekluZGV4ID8gYCR7ekluZGV4fWAgOiAnJztcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSB3aWR0aHMgZm9yIGVhY2ggY2VsbCBpbiB0aGUgcHJvdmlkZWQgcm93LiAqL1xuICBfZ2V0Q2VsbFdpZHRocyhyb3c6IEhUTUxFbGVtZW50LCByZWNhbGN1bGF0ZUNlbGxXaWR0aHMgPSB0cnVlKTogbnVtYmVyW10ge1xuICAgIGlmICghcmVjYWxjdWxhdGVDZWxsV2lkdGhzICYmIHRoaXMuX2NhY2hlZENlbGxXaWR0aHMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fY2FjaGVkQ2VsbFdpZHRocztcbiAgICB9XG5cbiAgICBjb25zdCBjZWxsV2lkdGhzOiBudW1iZXJbXSA9IFtdO1xuICAgIGNvbnN0IGZpcnN0Um93Q2VsbHMgPSByb3cuY2hpbGRyZW47XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaXJzdFJvd0NlbGxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgY2VsbDogSFRNTEVsZW1lbnQgPSBmaXJzdFJvd0NlbGxzW2ldIGFzIEhUTUxFbGVtZW50O1xuICAgICAgY2VsbFdpZHRocy5wdXNoKGNlbGwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGgpO1xuICAgIH1cblxuICAgIHRoaXMuX2NhY2hlZENlbGxXaWR0aHMgPSBjZWxsV2lkdGhzO1xuICAgIHJldHVybiBjZWxsV2lkdGhzO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgdGhlIGxlZnQgYW5kIHJpZ2h0IHBvc2l0aW9ucyBvZiBlYWNoIHN0aWNreSBjb2x1bW4gY2VsbCwgd2hpY2ggd2lsbCBiZSB0aGVcbiAgICogYWNjdW11bGF0aW9uIG9mIGFsbCBzdGlja3kgY29sdW1uIGNlbGwgd2lkdGhzIHRvIHRoZSBsZWZ0IGFuZCByaWdodCwgcmVzcGVjdGl2ZWx5LlxuICAgKiBOb24tc3RpY2t5IGNlbGxzIGRvIG5vdCBuZWVkIHRvIGhhdmUgYSB2YWx1ZSBzZXQgc2luY2UgdGhlaXIgcG9zaXRpb25zIHdpbGwgbm90IGJlIGFwcGxpZWQuXG4gICAqL1xuICBfZ2V0U3RpY2t5U3RhcnRDb2x1bW5Qb3NpdGlvbnMod2lkdGhzOiBudW1iZXJbXSwgc3RpY2t5U3RhdGVzOiBib29sZWFuW10pOiBudW1iZXJbXSB7XG4gICAgY29uc3QgcG9zaXRpb25zOiBudW1iZXJbXSA9IFtdO1xuICAgIGxldCBuZXh0UG9zaXRpb24gPSAwO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB3aWR0aHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChzdGlja3lTdGF0ZXNbaV0pIHtcbiAgICAgICAgcG9zaXRpb25zW2ldID0gbmV4dFBvc2l0aW9uO1xuICAgICAgICBuZXh0UG9zaXRpb24gKz0gd2lkdGhzW2ldO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwb3NpdGlvbnM7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB0aGUgbGVmdCBhbmQgcmlnaHQgcG9zaXRpb25zIG9mIGVhY2ggc3RpY2t5IGNvbHVtbiBjZWxsLCB3aGljaCB3aWxsIGJlIHRoZVxuICAgKiBhY2N1bXVsYXRpb24gb2YgYWxsIHN0aWNreSBjb2x1bW4gY2VsbCB3aWR0aHMgdG8gdGhlIGxlZnQgYW5kIHJpZ2h0LCByZXNwZWN0aXZlbHkuXG4gICAqIE5vbi1zdGlja3kgY2VsbHMgZG8gbm90IG5lZWQgdG8gaGF2ZSBhIHZhbHVlIHNldCBzaW5jZSB0aGVpciBwb3NpdGlvbnMgd2lsbCBub3QgYmUgYXBwbGllZC5cbiAgICovXG4gIF9nZXRTdGlja3lFbmRDb2x1bW5Qb3NpdGlvbnMod2lkdGhzOiBudW1iZXJbXSwgc3RpY2t5U3RhdGVzOiBib29sZWFuW10pOiBudW1iZXJbXSB7XG4gICAgY29uc3QgcG9zaXRpb25zOiBudW1iZXJbXSA9IFtdO1xuICAgIGxldCBuZXh0UG9zaXRpb24gPSAwO1xuXG4gICAgZm9yIChsZXQgaSA9IHdpZHRocy5sZW5ndGg7IGkgPiAwOyBpLS0pIHtcbiAgICAgIGlmIChzdGlja3lTdGF0ZXNbaV0pIHtcbiAgICAgICAgcG9zaXRpb25zW2ldID0gbmV4dFBvc2l0aW9uO1xuICAgICAgICBuZXh0UG9zaXRpb24gKz0gd2lkdGhzW2ldO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwb3NpdGlvbnM7XG4gIH1cbn1cbiJdfQ==