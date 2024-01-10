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
     * @param _positionListener A listener that is notified of changes to sticky rows/columns
     *     and their dimensions.
     */
    constructor(_isNativeHtmlTable, _stickCellCss, direction, _coalescedStyleScheduler, _isBrowser = true, _needsPositionStickyOnElement = true, _positionListener) {
        this._isNativeHtmlTable = _isNativeHtmlTable;
        this._stickCellCss = _stickCellCss;
        this.direction = direction;
        this._coalescedStyleScheduler = _coalescedStyleScheduler;
        this._isBrowser = _isBrowser;
        this._needsPositionStickyOnElement = _needsPositionStickyOnElement;
        this._positionListener = _positionListener;
        this._cachedCellWidths = [];
        this._borderCellCss = {
            'top': `${_stickCellCss}-border-elem-top`,
            'bottom': `${_stickCellCss}-border-elem-bottom`,
            'left': `${_stickCellCss}-border-elem-left`,
            'right': `${_stickCellCss}-border-elem-right`,
        };
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
        if (!rows.length ||
            !this._isBrowser ||
            !(stickyStartStates.some(state => state) || stickyEndStates.some(state => state))) {
            if (this._positionListener) {
                this._positionListener.stickyColumnsUpdated({ sizes: [] });
                this._positionListener.stickyEndColumnsUpdated({ sizes: [] });
            }
            return;
        }
        // Coalesce with sticky row updates (and potentially other changes like column resize).
        this._coalescedStyleScheduler.schedule(() => {
            const firstRow = rows[0];
            const numCells = firstRow.children.length;
            const cellWidths = this._getCellWidths(firstRow, recalculateCellWidths);
            const startPositions = this._getStickyStartColumnPositions(cellWidths, stickyStartStates);
            const endPositions = this._getStickyEndColumnPositions(cellWidths, stickyEndStates);
            const lastStickyStart = stickyStartStates.lastIndexOf(true);
            const firstStickyEnd = stickyEndStates.indexOf(true);
            const isRtl = this.direction === 'rtl';
            const start = isRtl ? 'right' : 'left';
            const end = isRtl ? 'left' : 'right';
            for (const row of rows) {
                for (let i = 0; i < numCells; i++) {
                    const cell = row.children[i];
                    if (stickyStartStates[i]) {
                        this._addStickyStyle(cell, start, startPositions[i], i === lastStickyStart);
                    }
                    if (stickyEndStates[i]) {
                        this._addStickyStyle(cell, end, endPositions[i], i === firstStickyEnd);
                    }
                }
            }
            if (this._positionListener) {
                this._positionListener.stickyColumnsUpdated({
                    sizes: lastStickyStart === -1
                        ? []
                        : cellWidths
                            .slice(0, lastStickyStart + 1)
                            .map((width, index) => (stickyStartStates[index] ? width : null)),
                });
                this._positionListener.stickyEndColumnsUpdated({
                    sizes: firstStickyEnd === -1
                        ? []
                        : cellWidths
                            .slice(firstStickyEnd)
                            .map((width, index) => (stickyEndStates[index + firstStickyEnd] ? width : null))
                            .reverse(),
                });
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
        // Coalesce with other sticky row updates (top/bottom), sticky columns updates
        // (and potentially other changes like column resize).
        this._coalescedStyleScheduler.schedule(() => {
            // If positioning the rows to the bottom, reverse their order when evaluating the sticky
            // position such that the last row stuck will be "bottom: 0px" and so on. Note that the
            // sticky states need to be reversed as well.
            const rows = position === 'bottom' ? rowsToStick.slice().reverse() : rowsToStick;
            const states = position === 'bottom' ? stickyStates.slice().reverse() : stickyStates;
            // Measure row heights all at once before adding sticky styles to reduce layout thrashing.
            const stickyOffsets = [];
            const stickyCellHeights = [];
            const elementsToStick = [];
            for (let rowIndex = 0, stickyOffset = 0; rowIndex < rows.length; rowIndex++) {
                if (!states[rowIndex]) {
                    continue;
                }
                stickyOffsets[rowIndex] = stickyOffset;
                const row = rows[rowIndex];
                elementsToStick[rowIndex] = this._isNativeHtmlTable
                    ? Array.from(row.children)
                    : [row];
                const height = row.getBoundingClientRect().height;
                stickyOffset += height;
                stickyCellHeights[rowIndex] = height;
            }
            const borderedRowIndex = states.lastIndexOf(true);
            for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                if (!states[rowIndex]) {
                    continue;
                }
                const offset = stickyOffsets[rowIndex];
                const isBorderedRowIndex = rowIndex === borderedRowIndex;
                for (const element of elementsToStick[rowIndex]) {
                    this._addStickyStyle(element, position, offset, isBorderedRowIndex);
                }
            }
            if (position === 'top') {
                this._positionListener?.stickyHeaderRowsUpdated({
                    sizes: stickyCellHeights,
                    offsets: stickyOffsets,
                    elements: elementsToStick,
                });
            }
            else {
                this._positionListener?.stickyFooterRowsUpdated({
                    sizes: stickyCellHeights,
                    offsets: stickyOffsets,
                    elements: elementsToStick,
                });
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
        // Coalesce with other sticky updates (and potentially other changes like column resize).
        this._coalescedStyleScheduler.schedule(() => {
            const tfoot = tableElement.querySelector('tfoot');
            if (stickyStates.some(state => !state)) {
                this._removeStickyStyle(tfoot, ['bottom']);
            }
            else {
                this._addStickyStyle(tfoot, 'bottom', 0, false);
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
            element.classList.remove(this._borderCellCss[dir]);
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
    _addStickyStyle(element, dir, dirValue, isBorderElement) {
        element.classList.add(this._stickCellCss);
        if (isBorderElement) {
            element.classList.add(this._borderCellCss[dir]);
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RpY2t5LXN0eWxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGFibGUvc3RpY2t5LXN0eWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFZSDs7O0dBR0c7QUFDSCxNQUFNLENBQUMsTUFBTSxpQkFBaUIsR0FBc0IsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUV2Rjs7O0dBR0c7QUFDSCxNQUFNLE9BQU8sWUFBWTtJQUl2Qjs7Ozs7Ozs7Ozs7OztPQWFHO0lBQ0gsWUFDVSxrQkFBMkIsRUFDM0IsYUFBcUIsRUFDdEIsU0FBb0IsRUFDbkIsd0JBQWtELEVBQ2xELGFBQWEsSUFBSSxFQUNSLGdDQUFnQyxJQUFJLEVBQ3BDLGlCQUE2QztRQU50RCx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQVM7UUFDM0Isa0JBQWEsR0FBYixhQUFhLENBQVE7UUFDdEIsY0FBUyxHQUFULFNBQVMsQ0FBVztRQUNuQiw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1FBQ2xELGVBQVUsR0FBVixVQUFVLENBQU87UUFDUixrQ0FBNkIsR0FBN0IsNkJBQTZCLENBQU87UUFDcEMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUE0QjtRQXhCeEQsc0JBQWlCLEdBQWEsRUFBRSxDQUFDO1FBMEJ2QyxJQUFJLENBQUMsY0FBYyxHQUFHO1lBQ3BCLEtBQUssRUFBRSxHQUFHLGFBQWEsa0JBQWtCO1lBQ3pDLFFBQVEsRUFBRSxHQUFHLGFBQWEscUJBQXFCO1lBQy9DLE1BQU0sRUFBRSxHQUFHLGFBQWEsbUJBQW1CO1lBQzNDLE9BQU8sRUFBRSxHQUFHLGFBQWEsb0JBQW9CO1NBQzlDLENBQUM7SUFDSixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxzQkFBc0IsQ0FBQyxJQUFtQixFQUFFLGdCQUFtQztRQUM3RSxNQUFNLGVBQWUsR0FBa0IsRUFBRSxDQUFD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LElBQUksWUFBWSxHQUFHLENBQUMsQ0FBQztRQUVyQixLQUFLLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3ZDLElBQUksWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3BCLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxZQUFZLENBQUM7Z0JBQzVCLFlBQVksSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUIsQ0FBQztRQUNILENBQUM7UUFFRCxPQUFPLFNBQVMsQ0FBQztJQUNuQixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqXG4gKiBEaXJlY3Rpb25zIHRoYXQgY2FuIGJlIHVzZWQgd2hlbiBzZXR0aW5nIHN0aWNreSBwb3NpdGlvbmluZy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuaW1wb3J0IHtEaXJlY3Rpb259IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7X0NvYWxlc2NlZFN0eWxlU2NoZWR1bGVyfSBmcm9tICcuL2NvYWxlc2NlZC1zdHlsZS1zY2hlZHVsZXInO1xuaW1wb3J0IHtTdGlja3lQb3NpdGlvbmluZ0xpc3RlbmVyfSBmcm9tICcuL3N0aWNreS1wb3NpdGlvbi1saXN0ZW5lcic7XG5cbmV4cG9ydCB0eXBlIFN0aWNreURpcmVjdGlvbiA9ICd0b3AnIHwgJ2JvdHRvbScgfCAnbGVmdCcgfCAncmlnaHQnO1xuXG4vKipcbiAqIExpc3Qgb2YgYWxsIHBvc3NpYmxlIGRpcmVjdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCBmb3Igc3RpY2t5IHBvc2l0aW9uaW5nLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgY29uc3QgU1RJQ0tZX0RJUkVDVElPTlM6IFN0aWNreURpcmVjdGlvbltdID0gWyd0b3AnLCAnYm90dG9tJywgJ2xlZnQnLCAncmlnaHQnXTtcblxuLyoqXG4gKiBBcHBsaWVzIGFuZCByZW1vdmVzIHN0aWNreSBwb3NpdGlvbmluZyBzdHlsZXMgdG8gdGhlIGBDZGtUYWJsZWAgcm93cyBhbmQgY29sdW1ucyBjZWxscy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGNsYXNzIFN0aWNreVN0eWxlciB7XG4gIHByaXZhdGUgX2NhY2hlZENlbGxXaWR0aHM6IG51bWJlcltdID0gW107XG4gIHByaXZhdGUgcmVhZG9ubHkgX2JvcmRlckNlbGxDc3M6IFJlYWRvbmx5PHtbZCBpbiBTdGlja3lEaXJlY3Rpb25dOiBzdHJpbmd9PjtcblxuICAvKipcbiAgICogQHBhcmFtIF9pc05hdGl2ZUh0bWxUYWJsZSBXaGV0aGVyIHRoZSBzdGlja3kgbG9naWMgc2hvdWxkIGJlIGJhc2VkIG9uIGEgdGFibGVcbiAgICogICAgIHRoYXQgdXNlcyB0aGUgbmF0aXZlIGA8dGFibGU+YCBlbGVtZW50LlxuICAgKiBAcGFyYW0gX3N0aWNrQ2VsbENzcyBUaGUgQ1NTIGNsYXNzIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIGV2ZXJ5IHJvdy9jZWxsIHRoYXQgaGFzXG4gICAqICAgICBzdGlja3kgcG9zaXRpb25pbmcgYXBwbGllZC5cbiAgICogQHBhcmFtIGRpcmVjdGlvbiBUaGUgZGlyZWN0aW9uYWxpdHkgY29udGV4dCBvZiB0aGUgdGFibGUgKGx0ci9ydGwpOyBhZmZlY3RzIGNvbHVtbiBwb3NpdGlvbmluZ1xuICAgKiAgICAgYnkgcmV2ZXJzaW5nIGxlZnQvcmlnaHQgcG9zaXRpb25zLlxuICAgKiBAcGFyYW0gX2lzQnJvd3NlciBXaGV0aGVyIHRoZSB0YWJsZSBpcyBjdXJyZW50bHkgYmVpbmcgcmVuZGVyZWQgb24gdGhlIHNlcnZlciBvciB0aGUgY2xpZW50LlxuICAgKiBAcGFyYW0gX25lZWRzUG9zaXRpb25TdGlja3lPbkVsZW1lbnQgV2hldGhlciB3ZSBuZWVkIHRvIHNwZWNpZnkgcG9zaXRpb246IHN0aWNreSBvbiBjZWxsc1xuICAgKiAgICAgdXNpbmcgaW5saW5lIHN0eWxlcy4gSWYgZmFsc2UsIGl0IGlzIGFzc3VtZWQgdGhhdCBwb3NpdGlvbjogc3RpY2t5IGlzIGluY2x1ZGVkIGluXG4gICAqICAgICB0aGUgY29tcG9uZW50IHN0eWxlc2hlZXQgZm9yIF9zdGlja0NlbGxDc3MuXG4gICAqIEBwYXJhbSBfcG9zaXRpb25MaXN0ZW5lciBBIGxpc3RlbmVyIHRoYXQgaXMgbm90aWZpZWQgb2YgY2hhbmdlcyB0byBzdGlja3kgcm93cy9jb2x1bW5zXG4gICAqICAgICBhbmQgdGhlaXIgZGltZW5zaW9ucy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgX2lzTmF0aXZlSHRtbFRhYmxlOiBib29sZWFuLFxuICAgIHByaXZhdGUgX3N0aWNrQ2VsbENzczogc3RyaW5nLFxuICAgIHB1YmxpYyBkaXJlY3Rpb246IERpcmVjdGlvbixcbiAgICBwcml2YXRlIF9jb2FsZXNjZWRTdHlsZVNjaGVkdWxlcjogX0NvYWxlc2NlZFN0eWxlU2NoZWR1bGVyLFxuICAgIHByaXZhdGUgX2lzQnJvd3NlciA9IHRydWUsXG4gICAgcHJpdmF0ZSByZWFkb25seSBfbmVlZHNQb3NpdGlvblN0aWNreU9uRWxlbWVudCA9IHRydWUsXG4gICAgcHJpdmF0ZSByZWFkb25seSBfcG9zaXRpb25MaXN0ZW5lcj86IFN0aWNreVBvc2l0aW9uaW5nTGlzdGVuZXIsXG4gICkge1xuICAgIHRoaXMuX2JvcmRlckNlbGxDc3MgPSB7XG4gICAgICAndG9wJzogYCR7X3N0aWNrQ2VsbENzc30tYm9yZGVyLWVsZW0tdG9wYCxcbiAgICAgICdib3R0b20nOiBgJHtfc3RpY2tDZWxsQ3NzfS1ib3JkZXItZWxlbS1ib3R0b21gLFxuICAgICAgJ2xlZnQnOiBgJHtfc3RpY2tDZWxsQ3NzfS1ib3JkZXItZWxlbS1sZWZ0YCxcbiAgICAgICdyaWdodCc6IGAke19zdGlja0NlbGxDc3N9LWJvcmRlci1lbGVtLXJpZ2h0YCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFycyB0aGUgc3RpY2t5IHBvc2l0aW9uaW5nIHN0eWxlcyBmcm9tIHRoZSByb3cgYW5kIGl0cyBjZWxscyBieSByZXNldHRpbmcgdGhlIGBwb3NpdGlvbmBcbiAgICogc3R5bGUsIHNldHRpbmcgdGhlIHpJbmRleCB0byAwLCBhbmQgdW5zZXR0aW5nIGVhY2ggcHJvdmlkZWQgc3RpY2t5IGRpcmVjdGlvbi5cbiAgICogQHBhcmFtIHJvd3MgVGhlIGxpc3Qgb2Ygcm93cyB0aGF0IHNob3VsZCBiZSBjbGVhcmVkIGZyb20gc3RpY2tpbmcgaW4gdGhlIHByb3ZpZGVkIGRpcmVjdGlvbnNcbiAgICogQHBhcmFtIHN0aWNreURpcmVjdGlvbnMgVGhlIGRpcmVjdGlvbnMgdGhhdCBzaG91bGQgbm8gbG9uZ2VyIGJlIHNldCBhcyBzdGlja3kgb24gdGhlIHJvd3MuXG4gICAqL1xuICBjbGVhclN0aWNreVBvc2l0aW9uaW5nKHJvd3M6IEhUTUxFbGVtZW50W10sIHN0aWNreURpcmVjdGlvbnM6IFN0aWNreURpcmVjdGlvbltdKSB7XG4gICAgY29uc3QgZWxlbWVudHNUb0NsZWFyOiBIVE1MRWxlbWVudFtdID0gW107XG4gICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgLy8gSWYgdGhlIHJvdyBpc24ndCBhbiBlbGVtZW50IChlLmcuIGlmIGl0J3MgYW4gYG5nLWNvbnRhaW5lcmApLFxuICAgICAgLy8gaXQgd29uJ3QgaGF2ZSBpbmxpbmUgc3R5bGVzIG9yIGBjaGlsZHJlbmAgc28gd2Ugc2tpcCBpdC5cbiAgICAgIGlmIChyb3cubm9kZVR5cGUgIT09IHJvdy5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGVsZW1lbnRzVG9DbGVhci5wdXNoKHJvdyk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJvdy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBlbGVtZW50c1RvQ2xlYXIucHVzaChyb3cuY2hpbGRyZW5baV0gYXMgSFRNTEVsZW1lbnQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENvYWxlc2NlIHdpdGggc3RpY2t5IHJvdy9jb2x1bW4gdXBkYXRlcyAoYW5kIHBvdGVudGlhbGx5IG90aGVyIGNoYW5nZXMgbGlrZSBjb2x1bW4gcmVzaXplKS5cbiAgICB0aGlzLl9jb2FsZXNjZWRTdHlsZVNjaGVkdWxlci5zY2hlZHVsZSgoKSA9PiB7XG4gICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgZWxlbWVudHNUb0NsZWFyKSB7XG4gICAgICAgIHRoaXMuX3JlbW92ZVN0aWNreVN0eWxlKGVsZW1lbnQsIHN0aWNreURpcmVjdGlvbnMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgc3RpY2t5IGxlZnQgYW5kIHJpZ2h0IHBvc2l0aW9ucyB0byB0aGUgY2VsbHMgb2YgZWFjaCByb3cgYWNjb3JkaW5nIHRvIHRoZSBzdGlja3lcbiAgICogc3RhdGVzIG9mIHRoZSByZW5kZXJlZCBjb2x1bW4gZGVmaW5pdGlvbnMuXG4gICAqIEBwYXJhbSByb3dzIFRoZSByb3dzIHRoYXQgc2hvdWxkIGhhdmUgaXRzIHNldCBvZiBjZWxscyBzdHVjayBhY2NvcmRpbmcgdG8gdGhlIHN0aWNreSBzdGF0ZXMuXG4gICAqIEBwYXJhbSBzdGlja3lTdGFydFN0YXRlcyBBIGxpc3Qgb2YgYm9vbGVhbiBzdGF0ZXMgd2hlcmUgZWFjaCBzdGF0ZSByZXByZXNlbnRzIHdoZXRoZXIgdGhlIGNlbGxcbiAgICogICAgIGluIHRoaXMgaW5kZXggcG9zaXRpb24gc2hvdWxkIGJlIHN0dWNrIHRvIHRoZSBzdGFydCBvZiB0aGUgcm93LlxuICAgKiBAcGFyYW0gc3RpY2t5RW5kU3RhdGVzIEEgbGlzdCBvZiBib29sZWFuIHN0YXRlcyB3aGVyZSBlYWNoIHN0YXRlIHJlcHJlc2VudHMgd2hldGhlciB0aGUgY2VsbFxuICAgKiAgICAgaW4gdGhpcyBpbmRleCBwb3NpdGlvbiBzaG91bGQgYmUgc3R1Y2sgdG8gdGhlIGVuZCBvZiB0aGUgcm93LlxuICAgKiBAcGFyYW0gcmVjYWxjdWxhdGVDZWxsV2lkdGhzIFdoZXRoZXIgdGhlIHN0aWNreSBzdHlsZXIgc2hvdWxkIHJlY2FsY3VsYXRlIHRoZSB3aWR0aCBvZiBlYWNoXG4gICAqICAgICBjb2x1bW4gY2VsbC4gSWYgYGZhbHNlYCBjYWNoZWQgd2lkdGhzIHdpbGwgYmUgdXNlZCBpbnN0ZWFkLlxuICAgKi9cbiAgdXBkYXRlU3RpY2t5Q29sdW1ucyhcbiAgICByb3dzOiBIVE1MRWxlbWVudFtdLFxuICAgIHN0aWNreVN0YXJ0U3RhdGVzOiBib29sZWFuW10sXG4gICAgc3RpY2t5RW5kU3RhdGVzOiBib29sZWFuW10sXG4gICAgcmVjYWxjdWxhdGVDZWxsV2lkdGhzID0gdHJ1ZSxcbiAgKSB7XG4gICAgaWYgKFxuICAgICAgIXJvd3MubGVuZ3RoIHx8XG4gICAgICAhdGhpcy5faXNCcm93c2VyIHx8XG4gICAgICAhKHN0aWNreVN0YXJ0U3RhdGVzLnNvbWUoc3RhdGUgPT4gc3RhdGUpIHx8IHN0aWNreUVuZFN0YXRlcy5zb21lKHN0YXRlID0+IHN0YXRlKSlcbiAgICApIHtcbiAgICAgIGlmICh0aGlzLl9wb3NpdGlvbkxpc3RlbmVyKSB7XG4gICAgICAgIHRoaXMuX3Bvc2l0aW9uTGlzdGVuZXIuc3RpY2t5Q29sdW1uc1VwZGF0ZWQoe3NpemVzOiBbXX0pO1xuICAgICAgICB0aGlzLl9wb3NpdGlvbkxpc3RlbmVyLnN0aWNreUVuZENvbHVtbnNVcGRhdGVkKHtzaXplczogW119KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIENvYWxlc2NlIHdpdGggc3RpY2t5IHJvdyB1cGRhdGVzIChhbmQgcG90ZW50aWFsbHkgb3RoZXIgY2hhbmdlcyBsaWtlIGNvbHVtbiByZXNpemUpLlxuICAgIHRoaXMuX2NvYWxlc2NlZFN0eWxlU2NoZWR1bGVyLnNjaGVkdWxlKCgpID0+IHtcbiAgICAgIGNvbnN0IGZpcnN0Um93ID0gcm93c1swXTtcbiAgICAgIGNvbnN0IG51bUNlbGxzID0gZmlyc3RSb3cuY2hpbGRyZW4ubGVuZ3RoO1xuICAgICAgY29uc3QgY2VsbFdpZHRoczogbnVtYmVyW10gPSB0aGlzLl9nZXRDZWxsV2lkdGhzKGZpcnN0Um93LCByZWNhbGN1bGF0ZUNlbGxXaWR0aHMpO1xuXG4gICAgICBjb25zdCBzdGFydFBvc2l0aW9ucyA9IHRoaXMuX2dldFN0aWNreVN0YXJ0Q29sdW1uUG9zaXRpb25zKGNlbGxXaWR0aHMsIHN0aWNreVN0YXJ0U3RhdGVzKTtcbiAgICAgIGNvbnN0IGVuZFBvc2l0aW9ucyA9IHRoaXMuX2dldFN0aWNreUVuZENvbHVtblBvc2l0aW9ucyhjZWxsV2lkdGhzLCBzdGlja3lFbmRTdGF0ZXMpO1xuXG4gICAgICBjb25zdCBsYXN0U3RpY2t5U3RhcnQgPSBzdGlja3lTdGFydFN0YXRlcy5sYXN0SW5kZXhPZih0cnVlKTtcbiAgICAgIGNvbnN0IGZpcnN0U3RpY2t5RW5kID0gc3RpY2t5RW5kU3RhdGVzLmluZGV4T2YodHJ1ZSk7XG5cbiAgICAgIGNvbnN0IGlzUnRsID0gdGhpcy5kaXJlY3Rpb24gPT09ICdydGwnO1xuICAgICAgY29uc3Qgc3RhcnQgPSBpc1J0bCA/ICdyaWdodCcgOiAnbGVmdCc7XG4gICAgICBjb25zdCBlbmQgPSBpc1J0bCA/ICdsZWZ0JyA6ICdyaWdodCc7XG5cbiAgICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1DZWxsczsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgY2VsbCA9IHJvdy5jaGlsZHJlbltpXSBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgICBpZiAoc3RpY2t5U3RhcnRTdGF0ZXNbaV0pIHtcbiAgICAgICAgICAgIHRoaXMuX2FkZFN0aWNreVN0eWxlKGNlbGwsIHN0YXJ0LCBzdGFydFBvc2l0aW9uc1tpXSwgaSA9PT0gbGFzdFN0aWNreVN0YXJ0KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoc3RpY2t5RW5kU3RhdGVzW2ldKSB7XG4gICAgICAgICAgICB0aGlzLl9hZGRTdGlja3lTdHlsZShjZWxsLCBlbmQsIGVuZFBvc2l0aW9uc1tpXSwgaSA9PT0gZmlyc3RTdGlja3lFbmQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fcG9zaXRpb25MaXN0ZW5lcikge1xuICAgICAgICB0aGlzLl9wb3NpdGlvbkxpc3RlbmVyLnN0aWNreUNvbHVtbnNVcGRhdGVkKHtcbiAgICAgICAgICBzaXplczpcbiAgICAgICAgICAgIGxhc3RTdGlja3lTdGFydCA9PT0gLTFcbiAgICAgICAgICAgICAgPyBbXVxuICAgICAgICAgICAgICA6IGNlbGxXaWR0aHNcbiAgICAgICAgICAgICAgICAgIC5zbGljZSgwLCBsYXN0U3RpY2t5U3RhcnQgKyAxKVxuICAgICAgICAgICAgICAgICAgLm1hcCgod2lkdGgsIGluZGV4KSA9PiAoc3RpY2t5U3RhcnRTdGF0ZXNbaW5kZXhdID8gd2lkdGggOiBudWxsKSksXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9wb3NpdGlvbkxpc3RlbmVyLnN0aWNreUVuZENvbHVtbnNVcGRhdGVkKHtcbiAgICAgICAgICBzaXplczpcbiAgICAgICAgICAgIGZpcnN0U3RpY2t5RW5kID09PSAtMVxuICAgICAgICAgICAgICA/IFtdXG4gICAgICAgICAgICAgIDogY2VsbFdpZHRoc1xuICAgICAgICAgICAgICAgICAgLnNsaWNlKGZpcnN0U3RpY2t5RW5kKVxuICAgICAgICAgICAgICAgICAgLm1hcCgod2lkdGgsIGluZGV4KSA9PiAoc3RpY2t5RW5kU3RhdGVzW2luZGV4ICsgZmlyc3RTdGlja3lFbmRdID8gd2lkdGggOiBudWxsKSlcbiAgICAgICAgICAgICAgICAgIC5yZXZlcnNlKCksXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgc3RpY2t5IHBvc2l0aW9uaW5nIHRvIHRoZSByb3cncyBjZWxscyBpZiB1c2luZyB0aGUgbmF0aXZlIHRhYmxlIGxheW91dCwgYW5kIHRvIHRoZVxuICAgKiByb3cgaXRzZWxmIG90aGVyd2lzZS5cbiAgICogQHBhcmFtIHJvd3NUb1N0aWNrIFRoZSBsaXN0IG9mIHJvd3MgdGhhdCBzaG91bGQgYmUgc3R1Y2sgYWNjb3JkaW5nIHRvIHRoZWlyIGNvcnJlc3BvbmRpbmdcbiAgICogICAgIHN0aWNreSBzdGF0ZSBhbmQgdG8gdGhlIHByb3ZpZGVkIHRvcCBvciBib3R0b20gcG9zaXRpb24uXG4gICAqIEBwYXJhbSBzdGlja3lTdGF0ZXMgQSBsaXN0IG9mIGJvb2xlYW4gc3RhdGVzIHdoZXJlIGVhY2ggc3RhdGUgcmVwcmVzZW50cyB3aGV0aGVyIHRoZSByb3dcbiAgICogICAgIHNob3VsZCBiZSBzdHVjayBpbiB0aGUgcGFydGljdWxhciB0b3Agb3IgYm90dG9tIHBvc2l0aW9uLlxuICAgKiBAcGFyYW0gcG9zaXRpb24gVGhlIHBvc2l0aW9uIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgcm93IHNob3VsZCBiZSBzdHVjayBpZiB0aGF0IHJvdyBzaG91bGQgYmVcbiAgICogICAgIHN0aWNreS5cbiAgICpcbiAgICovXG4gIHN0aWNrUm93cyhyb3dzVG9TdGljazogSFRNTEVsZW1lbnRbXSwgc3RpY2t5U3RhdGVzOiBib29sZWFuW10sIHBvc2l0aW9uOiAndG9wJyB8ICdib3R0b20nKSB7XG4gICAgLy8gU2luY2Ugd2UgY2FuJ3QgbWVhc3VyZSB0aGUgcm93cyBvbiB0aGUgc2VydmVyLCB3ZSBjYW4ndCBzdGljayB0aGUgcm93cyBwcm9wZXJseS5cbiAgICBpZiAoIXRoaXMuX2lzQnJvd3Nlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIENvYWxlc2NlIHdpdGggb3RoZXIgc3RpY2t5IHJvdyB1cGRhdGVzICh0b3AvYm90dG9tKSwgc3RpY2t5IGNvbHVtbnMgdXBkYXRlc1xuICAgIC8vIChhbmQgcG90ZW50aWFsbHkgb3RoZXIgY2hhbmdlcyBsaWtlIGNvbHVtbiByZXNpemUpLlxuICAgIHRoaXMuX2NvYWxlc2NlZFN0eWxlU2NoZWR1bGVyLnNjaGVkdWxlKCgpID0+IHtcbiAgICAgIC8vIElmIHBvc2l0aW9uaW5nIHRoZSByb3dzIHRvIHRoZSBib3R0b20sIHJldmVyc2UgdGhlaXIgb3JkZXIgd2hlbiBldmFsdWF0aW5nIHRoZSBzdGlja3lcbiAgICAgIC8vIHBvc2l0aW9uIHN1Y2ggdGhhdCB0aGUgbGFzdCByb3cgc3R1Y2sgd2lsbCBiZSBcImJvdHRvbTogMHB4XCIgYW5kIHNvIG9uLiBOb3RlIHRoYXQgdGhlXG4gICAgICAvLyBzdGlja3kgc3RhdGVzIG5lZWQgdG8gYmUgcmV2ZXJzZWQgYXMgd2VsbC5cbiAgICAgIGNvbnN0IHJvd3MgPSBwb3NpdGlvbiA9PT0gJ2JvdHRvbScgPyByb3dzVG9TdGljay5zbGljZSgpLnJldmVyc2UoKSA6IHJvd3NUb1N0aWNrO1xuICAgICAgY29uc3Qgc3RhdGVzID0gcG9zaXRpb24gPT09ICdib3R0b20nID8gc3RpY2t5U3RhdGVzLnNsaWNlKCkucmV2ZXJzZSgpIDogc3RpY2t5U3RhdGVzO1xuXG4gICAgICAvLyBNZWFzdXJlIHJvdyBoZWlnaHRzIGFsbCBhdCBvbmNlIGJlZm9yZSBhZGRpbmcgc3RpY2t5IHN0eWxlcyB0byByZWR1Y2UgbGF5b3V0IHRocmFzaGluZy5cbiAgICAgIGNvbnN0IHN0aWNreU9mZnNldHM6IG51bWJlcltdID0gW107XG4gICAgICBjb25zdCBzdGlja3lDZWxsSGVpZ2h0czogKG51bWJlciB8IHVuZGVmaW5lZClbXSA9IFtdO1xuICAgICAgY29uc3QgZWxlbWVudHNUb1N0aWNrOiBIVE1MRWxlbWVudFtdW10gPSBbXTtcblxuICAgICAgZm9yIChsZXQgcm93SW5kZXggPSAwLCBzdGlja3lPZmZzZXQgPSAwOyByb3dJbmRleCA8IHJvd3MubGVuZ3RoOyByb3dJbmRleCsrKSB7XG4gICAgICAgIGlmICghc3RhdGVzW3Jvd0luZGV4XSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RpY2t5T2Zmc2V0c1tyb3dJbmRleF0gPSBzdGlja3lPZmZzZXQ7XG4gICAgICAgIGNvbnN0IHJvdyA9IHJvd3Nbcm93SW5kZXhdO1xuICAgICAgICBlbGVtZW50c1RvU3RpY2tbcm93SW5kZXhdID0gdGhpcy5faXNOYXRpdmVIdG1sVGFibGVcbiAgICAgICAgICA/IChBcnJheS5mcm9tKHJvdy5jaGlsZHJlbikgYXMgSFRNTEVsZW1lbnRbXSlcbiAgICAgICAgICA6IFtyb3ddO1xuXG4gICAgICAgIGNvbnN0IGhlaWdodCA9IHJvdy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHQ7XG4gICAgICAgIHN0aWNreU9mZnNldCArPSBoZWlnaHQ7XG4gICAgICAgIHN0aWNreUNlbGxIZWlnaHRzW3Jvd0luZGV4XSA9IGhlaWdodDtcbiAgICAgIH1cblxuICAgICAgY29uc3QgYm9yZGVyZWRSb3dJbmRleCA9IHN0YXRlcy5sYXN0SW5kZXhPZih0cnVlKTtcblxuICAgICAgZm9yIChsZXQgcm93SW5kZXggPSAwOyByb3dJbmRleCA8IHJvd3MubGVuZ3RoOyByb3dJbmRleCsrKSB7XG4gICAgICAgIGlmICghc3RhdGVzW3Jvd0luZGV4XSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gc3RpY2t5T2Zmc2V0c1tyb3dJbmRleF07XG4gICAgICAgIGNvbnN0IGlzQm9yZGVyZWRSb3dJbmRleCA9IHJvd0luZGV4ID09PSBib3JkZXJlZFJvd0luZGV4O1xuICAgICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgZWxlbWVudHNUb1N0aWNrW3Jvd0luZGV4XSkge1xuICAgICAgICAgIHRoaXMuX2FkZFN0aWNreVN0eWxlKGVsZW1lbnQsIHBvc2l0aW9uLCBvZmZzZXQsIGlzQm9yZGVyZWRSb3dJbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHBvc2l0aW9uID09PSAndG9wJykge1xuICAgICAgICB0aGlzLl9wb3NpdGlvbkxpc3RlbmVyPy5zdGlja3lIZWFkZXJSb3dzVXBkYXRlZCh7XG4gICAgICAgICAgc2l6ZXM6IHN0aWNreUNlbGxIZWlnaHRzLFxuICAgICAgICAgIG9mZnNldHM6IHN0aWNreU9mZnNldHMsXG4gICAgICAgICAgZWxlbWVudHM6IGVsZW1lbnRzVG9TdGljayxcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9wb3NpdGlvbkxpc3RlbmVyPy5zdGlja3lGb290ZXJSb3dzVXBkYXRlZCh7XG4gICAgICAgICAgc2l6ZXM6IHN0aWNreUNlbGxIZWlnaHRzLFxuICAgICAgICAgIG9mZnNldHM6IHN0aWNreU9mZnNldHMsXG4gICAgICAgICAgZWxlbWVudHM6IGVsZW1lbnRzVG9TdGljayxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogV2hlbiB1c2luZyB0aGUgbmF0aXZlIHRhYmxlIGluIFNhZmFyaSwgc3RpY2t5IGZvb3RlciBjZWxscyBkbyBub3Qgc3RpY2suIFRoZSBvbmx5IHdheSB0byBzdGlja1xuICAgKiBmb290ZXIgcm93cyBpcyB0byBhcHBseSBzdGlja3kgc3R5bGluZyB0byB0aGUgdGZvb3QgY29udGFpbmVyLiBUaGlzIHNob3VsZCBvbmx5IGJlIGRvbmUgaWZcbiAgICogYWxsIGZvb3RlciByb3dzIGFyZSBzdGlja3kuIElmIG5vdCBhbGwgZm9vdGVyIHJvd3MgYXJlIHN0aWNreSwgcmVtb3ZlIHN0aWNreSBwb3NpdGlvbmluZyBmcm9tXG4gICAqIHRoZSB0Zm9vdCBlbGVtZW50LlxuICAgKi9cbiAgdXBkYXRlU3RpY2t5Rm9vdGVyQ29udGFpbmVyKHRhYmxlRWxlbWVudDogRWxlbWVudCwgc3RpY2t5U3RhdGVzOiBib29sZWFuW10pIHtcbiAgICBpZiAoIXRoaXMuX2lzTmF0aXZlSHRtbFRhYmxlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gQ29hbGVzY2Ugd2l0aCBvdGhlciBzdGlja3kgdXBkYXRlcyAoYW5kIHBvdGVudGlhbGx5IG90aGVyIGNoYW5nZXMgbGlrZSBjb2x1bW4gcmVzaXplKS5cbiAgICB0aGlzLl9jb2FsZXNjZWRTdHlsZVNjaGVkdWxlci5zY2hlZHVsZSgoKSA9PiB7XG4gICAgICBjb25zdCB0Zm9vdCA9IHRhYmxlRWxlbWVudC5xdWVyeVNlbGVjdG9yKCd0Zm9vdCcpITtcblxuICAgICAgaWYgKHN0aWNreVN0YXRlcy5zb21lKHN0YXRlID0+ICFzdGF0ZSkpIHtcbiAgICAgICAgdGhpcy5fcmVtb3ZlU3RpY2t5U3R5bGUodGZvb3QsIFsnYm90dG9tJ10pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fYWRkU3RpY2t5U3R5bGUodGZvb3QsICdib3R0b20nLCAwLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyB0aGUgc3RpY2t5IHN0eWxlIG9uIHRoZSBlbGVtZW50IGJ5IHJlbW92aW5nIHRoZSBzdGlja3kgY2VsbCBDU1MgY2xhc3MsIHJlLWV2YWx1YXRpbmdcbiAgICogdGhlIHpJbmRleCwgcmVtb3ZpbmcgZWFjaCBvZiB0aGUgcHJvdmlkZWQgc3RpY2t5IGRpcmVjdGlvbnMsIGFuZCByZW1vdmluZyB0aGVcbiAgICogc3RpY2t5IHBvc2l0aW9uIGlmIHRoZXJlIGFyZSBubyBtb3JlIGRpcmVjdGlvbnMuXG4gICAqL1xuICBfcmVtb3ZlU3RpY2t5U3R5bGUoZWxlbWVudDogSFRNTEVsZW1lbnQsIHN0aWNreURpcmVjdGlvbnM6IFN0aWNreURpcmVjdGlvbltdKSB7XG4gICAgZm9yIChjb25zdCBkaXIgb2Ygc3RpY2t5RGlyZWN0aW9ucykge1xuICAgICAgZWxlbWVudC5zdHlsZVtkaXJdID0gJyc7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUodGhpcy5fYm9yZGVyQ2VsbENzc1tkaXJdKTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgZWxlbWVudCBubyBsb25nZXIgaGFzIGFueSBtb3JlIHN0aWNreSBkaXJlY3Rpb25zLCByZW1vdmUgc3RpY2t5IHBvc2l0aW9uaW5nIGFuZFxuICAgIC8vIHRoZSBzdGlja3kgQ1NTIGNsYXNzLlxuICAgIC8vIFNob3J0LWNpcmN1aXQgY2hlY2tpbmcgZWxlbWVudC5zdHlsZVtkaXJdIGZvciBzdGlja3lEaXJlY3Rpb25zIGFzIHRoZXlcbiAgICAvLyB3ZXJlIGFscmVhZHkgcmVtb3ZlZCBhYm92ZS5cbiAgICBjb25zdCBoYXNEaXJlY3Rpb24gPSBTVElDS1lfRElSRUNUSU9OUy5zb21lKFxuICAgICAgZGlyID0+IHN0aWNreURpcmVjdGlvbnMuaW5kZXhPZihkaXIpID09PSAtMSAmJiBlbGVtZW50LnN0eWxlW2Rpcl0sXG4gICAgKTtcbiAgICBpZiAoaGFzRGlyZWN0aW9uKSB7XG4gICAgICBlbGVtZW50LnN0eWxlLnpJbmRleCA9IHRoaXMuX2dldENhbGN1bGF0ZWRaSW5kZXgoZWxlbWVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFdoZW4gbm90IGhhc0RpcmVjdGlvbiwgX2dldENhbGN1bGF0ZWRaSW5kZXggd2lsbCBhbHdheXMgcmV0dXJuICcnLlxuICAgICAgZWxlbWVudC5zdHlsZS56SW5kZXggPSAnJztcbiAgICAgIGlmICh0aGlzLl9uZWVkc1Bvc2l0aW9uU3RpY2t5T25FbGVtZW50KSB7XG4gICAgICAgIGVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnJztcbiAgICAgIH1cbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSh0aGlzLl9zdGlja0NlbGxDc3MpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoZSBzdGlja3kgc3R5bGluZyB0byB0aGUgZWxlbWVudCBieSBhZGRpbmcgdGhlIHN0aWNreSBzdHlsZSBjbGFzcywgY2hhbmdpbmcgcG9zaXRpb25cbiAgICogdG8gYmUgc3RpY2t5IChhbmQgLXdlYmtpdC1zdGlja3kpLCBzZXR0aW5nIHRoZSBhcHByb3ByaWF0ZSB6SW5kZXgsIGFuZCBhZGRpbmcgYSBzdGlja3lcbiAgICogZGlyZWN0aW9uIGFuZCB2YWx1ZS5cbiAgICovXG4gIF9hZGRTdGlja3lTdHlsZShcbiAgICBlbGVtZW50OiBIVE1MRWxlbWVudCxcbiAgICBkaXI6IFN0aWNreURpcmVjdGlvbixcbiAgICBkaXJWYWx1ZTogbnVtYmVyLFxuICAgIGlzQm9yZGVyRWxlbWVudDogYm9vbGVhbixcbiAgKSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKHRoaXMuX3N0aWNrQ2VsbENzcyk7XG4gICAgaWYgKGlzQm9yZGVyRWxlbWVudCkge1xuICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKHRoaXMuX2JvcmRlckNlbGxDc3NbZGlyXSk7XG4gICAgfVxuICAgIGVsZW1lbnQuc3R5bGVbZGlyXSA9IGAke2RpclZhbHVlfXB4YDtcbiAgICBlbGVtZW50LnN0eWxlLnpJbmRleCA9IHRoaXMuX2dldENhbGN1bGF0ZWRaSW5kZXgoZWxlbWVudCk7XG4gICAgaWYgKHRoaXMuX25lZWRzUG9zaXRpb25TdGlja3lPbkVsZW1lbnQpIHtcbiAgICAgIGVsZW1lbnQuc3R5bGUuY3NzVGV4dCArPSAncG9zaXRpb246IC13ZWJraXQtc3RpY2t5OyBwb3NpdGlvbjogc3RpY2t5OyAnO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGUgd2hhdCB0aGUgei1pbmRleCBzaG91bGQgYmUgZm9yIHRoZSBlbGVtZW50LCBkZXBlbmRpbmcgb24gd2hhdCBkaXJlY3Rpb25zICh0b3AsXG4gICAqIGJvdHRvbSwgbGVmdCwgcmlnaHQpIGhhdmUgYmVlbiBzZXQuIEl0IHNob3VsZCBiZSB0cnVlIHRoYXQgZWxlbWVudHMgd2l0aCBhIHRvcCBkaXJlY3Rpb25cbiAgICogc2hvdWxkIGhhdmUgdGhlIGhpZ2hlc3QgaW5kZXggc2luY2UgdGhlc2UgYXJlIGVsZW1lbnRzIGxpa2UgYSB0YWJsZSBoZWFkZXIuIElmIGFueSBvZiB0aG9zZVxuICAgKiBlbGVtZW50cyBhcmUgYWxzbyBzdGlja3kgaW4gYW5vdGhlciBkaXJlY3Rpb24sIHRoZW4gdGhleSBzaG91bGQgYXBwZWFyIGFib3ZlIG90aGVyIGVsZW1lbnRzXG4gICAqIHRoYXQgYXJlIG9ubHkgc3RpY2t5IHRvcCAoZS5nLiBhIHN0aWNreSBjb2x1bW4gb24gYSBzdGlja3kgaGVhZGVyKS4gQm90dG9tLXN0aWNreSBlbGVtZW50c1xuICAgKiAoZS5nLiBmb290ZXIgcm93cykgc2hvdWxkIHRoZW4gYmUgbmV4dCBpbiB0aGUgb3JkZXJpbmcgc3VjaCB0aGF0IHRoZXkgYXJlIGJlbG93IHRoZSBoZWFkZXJcbiAgICogYnV0IGFib3ZlIGFueSBub24tc3RpY2t5IGVsZW1lbnRzLiBGaW5hbGx5LCBsZWZ0L3JpZ2h0IHN0aWNreSBlbGVtZW50cyAoZS5nLiBzdGlja3kgY29sdW1ucylcbiAgICogc2hvdWxkIG1pbmltYWxseSBpbmNyZW1lbnQgc28gdGhhdCB0aGV5IGFyZSBhYm92ZSBub24tc3RpY2t5IGVsZW1lbnRzIGJ1dCBiZWxvdyB0b3AgYW5kIGJvdHRvbVxuICAgKiBlbGVtZW50cy5cbiAgICovXG4gIF9nZXRDYWxjdWxhdGVkWkluZGV4KGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogc3RyaW5nIHtcbiAgICBjb25zdCB6SW5kZXhJbmNyZW1lbnRzID0ge1xuICAgICAgdG9wOiAxMDAsXG4gICAgICBib3R0b206IDEwLFxuICAgICAgbGVmdDogMSxcbiAgICAgIHJpZ2h0OiAxLFxuICAgIH07XG5cbiAgICBsZXQgekluZGV4ID0gMDtcbiAgICAvLyBVc2UgYEl0ZXJhYmxlYCBpbnN0ZWFkIG9mIGBBcnJheWAgYmVjYXVzZSBUeXBlU2NyaXB0LCBhcyBvZiAzLjYuMyxcbiAgICAvLyBsb3NlcyB0aGUgYXJyYXkgZ2VuZXJpYyB0eXBlIGluIHRoZSBgZm9yIG9mYC4gQnV0IHdlICphbHNvKiBoYXZlIHRvIHVzZSBgQXJyYXlgIGJlY2F1c2VcbiAgICAvLyB0eXBlc2NyaXB0IHdvbid0IGl0ZXJhdGUgb3ZlciBhbiBgSXRlcmFibGVgIHVubGVzcyB5b3UgY29tcGlsZSB3aXRoIGAtLWRvd25sZXZlbEl0ZXJhdGlvbmBcbiAgICBmb3IgKGNvbnN0IGRpciBvZiBTVElDS1lfRElSRUNUSU9OUyBhcyBJdGVyYWJsZTxTdGlja3lEaXJlY3Rpb24+ICYgU3RpY2t5RGlyZWN0aW9uW10pIHtcbiAgICAgIGlmIChlbGVtZW50LnN0eWxlW2Rpcl0pIHtcbiAgICAgICAgekluZGV4ICs9IHpJbmRleEluY3JlbWVudHNbZGlyXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gekluZGV4ID8gYCR7ekluZGV4fWAgOiAnJztcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSB3aWR0aHMgZm9yIGVhY2ggY2VsbCBpbiB0aGUgcHJvdmlkZWQgcm93LiAqL1xuICBfZ2V0Q2VsbFdpZHRocyhyb3c6IEhUTUxFbGVtZW50LCByZWNhbGN1bGF0ZUNlbGxXaWR0aHMgPSB0cnVlKTogbnVtYmVyW10ge1xuICAgIGlmICghcmVjYWxjdWxhdGVDZWxsV2lkdGhzICYmIHRoaXMuX2NhY2hlZENlbGxXaWR0aHMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fY2FjaGVkQ2VsbFdpZHRocztcbiAgICB9XG5cbiAgICBjb25zdCBjZWxsV2lkdGhzOiBudW1iZXJbXSA9IFtdO1xuICAgIGNvbnN0IGZpcnN0Um93Q2VsbHMgPSByb3cuY2hpbGRyZW47XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaXJzdFJvd0NlbGxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgY2VsbDogSFRNTEVsZW1lbnQgPSBmaXJzdFJvd0NlbGxzW2ldIGFzIEhUTUxFbGVtZW50O1xuICAgICAgY2VsbFdpZHRocy5wdXNoKGNlbGwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGgpO1xuICAgIH1cblxuICAgIHRoaXMuX2NhY2hlZENlbGxXaWR0aHMgPSBjZWxsV2lkdGhzO1xuICAgIHJldHVybiBjZWxsV2lkdGhzO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgdGhlIGxlZnQgYW5kIHJpZ2h0IHBvc2l0aW9ucyBvZiBlYWNoIHN0aWNreSBjb2x1bW4gY2VsbCwgd2hpY2ggd2lsbCBiZSB0aGVcbiAgICogYWNjdW11bGF0aW9uIG9mIGFsbCBzdGlja3kgY29sdW1uIGNlbGwgd2lkdGhzIHRvIHRoZSBsZWZ0IGFuZCByaWdodCwgcmVzcGVjdGl2ZWx5LlxuICAgKiBOb24tc3RpY2t5IGNlbGxzIGRvIG5vdCBuZWVkIHRvIGhhdmUgYSB2YWx1ZSBzZXQgc2luY2UgdGhlaXIgcG9zaXRpb25zIHdpbGwgbm90IGJlIGFwcGxpZWQuXG4gICAqL1xuICBfZ2V0U3RpY2t5U3RhcnRDb2x1bW5Qb3NpdGlvbnMod2lkdGhzOiBudW1iZXJbXSwgc3RpY2t5U3RhdGVzOiBib29sZWFuW10pOiBudW1iZXJbXSB7XG4gICAgY29uc3QgcG9zaXRpb25zOiBudW1iZXJbXSA9IFtdO1xuICAgIGxldCBuZXh0UG9zaXRpb24gPSAwO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB3aWR0aHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChzdGlja3lTdGF0ZXNbaV0pIHtcbiAgICAgICAgcG9zaXRpb25zW2ldID0gbmV4dFBvc2l0aW9uO1xuICAgICAgICBuZXh0UG9zaXRpb24gKz0gd2lkdGhzW2ldO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwb3NpdGlvbnM7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB0aGUgbGVmdCBhbmQgcmlnaHQgcG9zaXRpb25zIG9mIGVhY2ggc3RpY2t5IGNvbHVtbiBjZWxsLCB3aGljaCB3aWxsIGJlIHRoZVxuICAgKiBhY2N1bXVsYXRpb24gb2YgYWxsIHN0aWNreSBjb2x1bW4gY2VsbCB3aWR0aHMgdG8gdGhlIGxlZnQgYW5kIHJpZ2h0LCByZXNwZWN0aXZlbHkuXG4gICAqIE5vbi1zdGlja3kgY2VsbHMgZG8gbm90IG5lZWQgdG8gaGF2ZSBhIHZhbHVlIHNldCBzaW5jZSB0aGVpciBwb3NpdGlvbnMgd2lsbCBub3QgYmUgYXBwbGllZC5cbiAgICovXG4gIF9nZXRTdGlja3lFbmRDb2x1bW5Qb3NpdGlvbnMod2lkdGhzOiBudW1iZXJbXSwgc3RpY2t5U3RhdGVzOiBib29sZWFuW10pOiBudW1iZXJbXSB7XG4gICAgY29uc3QgcG9zaXRpb25zOiBudW1iZXJbXSA9IFtdO1xuICAgIGxldCBuZXh0UG9zaXRpb24gPSAwO1xuXG4gICAgZm9yIChsZXQgaSA9IHdpZHRocy5sZW5ndGg7IGkgPiAwOyBpLS0pIHtcbiAgICAgIGlmIChzdGlja3lTdGF0ZXNbaV0pIHtcbiAgICAgICAgcG9zaXRpb25zW2ldID0gbmV4dFBvc2l0aW9uO1xuICAgICAgICBuZXh0UG9zaXRpb24gKz0gd2lkdGhzW2ldO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwb3NpdGlvbnM7XG4gIH1cbn1cbiJdfQ==