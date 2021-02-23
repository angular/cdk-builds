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
        if (!rows.length || !this._isBrowser || !(stickyStartStates.some(state => state) ||
            stickyEndStates.some(state => state))) {
            if (this._positionListener) {
                this._positionListener.stickyColumnsUpdated({ sizes: [] });
                this._positionListener.stickyEndColumnsUpdated({ sizes: [] });
            }
            return;
        }
        const firstRow = rows[0];
        const numCells = firstRow.children.length;
        const cellWidths = this._getCellWidths(firstRow, recalculateCellWidths);
        const startPositions = this._getStickyStartColumnPositions(cellWidths, stickyStartStates);
        const endPositions = this._getStickyEndColumnPositions(cellWidths, stickyEndStates);
        const lastStickyStart = stickyStartStates.lastIndexOf(true);
        const firstStickyEnd = stickyEndStates.indexOf(true);
        // Coalesce with sticky row updates (and potentially other changes like column resize).
        this._coalescedStyleScheduler.schedule(() => {
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
                    sizes: lastStickyStart === -1 ?
                        [] :
                        cellWidths
                            .slice(0, lastStickyStart + 1)
                            .map((width, index) => stickyStartStates[index] ? width : null)
                });
                this._positionListener.stickyEndColumnsUpdated({
                    sizes: firstStickyEnd === -1 ?
                        [] :
                        cellWidths
                            .slice(firstStickyEnd)
                            .map((width, index) => stickyEndStates[index + firstStickyEnd] ? width : null)
                            .reverse()
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
            elementsToStick[rowIndex] = this._isNativeHtmlTable ?
                Array.from(row.children) : [row];
            const height = row.getBoundingClientRect().height;
            stickyOffset += height;
            stickyCellHeights[rowIndex] = height;
        }
        const borderedRowIndex = states.lastIndexOf(true);
        // Coalesce with other sticky row updates (top/bottom), sticky columns updates
        // (and potentially other changes like column resize).
        this._coalescedStyleScheduler.schedule(() => {
            var _a, _b;
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
                (_a = this._positionListener) === null || _a === void 0 ? void 0 : _a.stickyHeaderRowsUpdated({ sizes: stickyCellHeights, offsets: stickyOffsets, elements: elementsToStick });
            }
            else {
                (_b = this._positionListener) === null || _b === void 0 ? void 0 : _b.stickyFooterRowsUpdated({ sizes: stickyCellHeights, offsets: stickyOffsets, elements: elementsToStick });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RpY2t5LXN0eWxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGFibGUvc3RpY2t5LXN0eWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFZSDs7O0dBR0c7QUFDSCxNQUFNLENBQUMsTUFBTSxpQkFBaUIsR0FBc0IsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUd2Rjs7O0dBR0c7QUFDSCxNQUFNLE9BQU8sWUFBWTtJQUl2Qjs7Ozs7Ozs7Ozs7OztPQWFHO0lBQ0gsWUFBb0Isa0JBQTJCLEVBQzNCLGFBQXFCLEVBQ3RCLFNBQW9CLEVBQ25CLHdCQUFrRCxFQUNsRCxhQUFhLElBQUksRUFDUixnQ0FBZ0MsSUFBSSxFQUNwQyxpQkFBNkM7UUFOdEQsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFTO1FBQzNCLGtCQUFhLEdBQWIsYUFBYSxDQUFRO1FBQ3RCLGNBQVMsR0FBVCxTQUFTLENBQVc7UUFDbkIsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtRQUNsRCxlQUFVLEdBQVYsVUFBVSxDQUFPO1FBQ1Isa0NBQTZCLEdBQTdCLDZCQUE2QixDQUFPO1FBQ3BDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBNEI7UUF2QmxFLHNCQUFpQixHQUFhLEVBQUUsQ0FBQztRQXdCdkMsSUFBSSxDQUFDLGNBQWMsR0FBRztZQUNwQixLQUFLLEVBQUUsR0FBRyxhQUFhLGtCQUFrQjtZQUN6QyxRQUFRLEVBQUUsR0FBRyxhQUFhLHFCQUFxQjtZQUMvQyxNQUFNLEVBQUUsR0FBRyxhQUFhLG1CQUFtQjtZQUMzQyxPQUFPLEVBQUUsR0FBRyxhQUFhLG9CQUFvQjtTQUM5QyxDQUFDO0lBQ0osQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsc0JBQXNCLENBQUMsSUFBbUIsRUFBRSxnQkFBbUM7UUFDN0UsTUFBTSxlQUFlLEdBQWtCLEVBQUUsQ0FB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QUMsQ0FBQztTQUNyRDtRQUVELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxVQUFVLENBQUM7UUFDcEMsT0FBTyxVQUFVLENBQUM7SUFDcEIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCw4QkFBOEIsQ0FBQyxNQUFnQixFQUFFLFlBQXVCO1FBQ3RFLE1BQU0sU0FBUyxHQUFhLEVBQUUsQ0FBQztRQUMvQixJQUFJLFlBQVksR0FBRyxDQUFDLENBQUM7UUFFckIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDdEMsSUFBSSxZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ25CLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxZQUFZLENBQUM7Z0JBQzVCLFlBQVksSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDM0I7U0FDRjtRQUVELE9BQU8sU0FBUyxDQUFDO0lBQ25CLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsNEJBQTRCLENBQUMsTUFBZ0IsRUFBRSxZQUF1QjtRQUNwRSxNQUFNLFNBQVMsR0FBYSxFQUFFLENBQUM7UUFDL0IsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDO1FBRXJCLEtBQUssSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3RDLElBQUksWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNuQixTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsWUFBWSxDQUFDO2dCQUM1QixZQUFZLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQzNCO1NBQ0Y7UUFFRCxPQUFPLFNBQVMsQ0FBQztJQUNuQixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqXG4gKiBEaXJlY3Rpb25zIHRoYXQgY2FuIGJlIHVzZWQgd2hlbiBzZXR0aW5nIHN0aWNreSBwb3NpdGlvbmluZy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuaW1wb3J0IHtEaXJlY3Rpb259IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7X0NvYWxlc2NlZFN0eWxlU2NoZWR1bGVyfSBmcm9tICcuL2NvYWxlc2NlZC1zdHlsZS1zY2hlZHVsZXInO1xuaW1wb3J0IHtTdGlja3lQb3NpdGlvbmluZ0xpc3RlbmVyfSBmcm9tICcuL3N0aWNreS1wb3NpdGlvbi1saXN0ZW5lcic7XG5cbmV4cG9ydCB0eXBlIFN0aWNreURpcmVjdGlvbiA9ICd0b3AnIHwgJ2JvdHRvbScgfCAnbGVmdCcgfCAncmlnaHQnO1xuXG4vKipcbiAqIExpc3Qgb2YgYWxsIHBvc3NpYmxlIGRpcmVjdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCBmb3Igc3RpY2t5IHBvc2l0aW9uaW5nLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgY29uc3QgU1RJQ0tZX0RJUkVDVElPTlM6IFN0aWNreURpcmVjdGlvbltdID0gWyd0b3AnLCAnYm90dG9tJywgJ2xlZnQnLCAncmlnaHQnXTtcblxuXG4vKipcbiAqIEFwcGxpZXMgYW5kIHJlbW92ZXMgc3RpY2t5IHBvc2l0aW9uaW5nIHN0eWxlcyB0byB0aGUgYENka1RhYmxlYCByb3dzIGFuZCBjb2x1bW5zIGNlbGxzLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgY2xhc3MgU3RpY2t5U3R5bGVyIHtcbiAgcHJpdmF0ZSBfY2FjaGVkQ2VsbFdpZHRoczogbnVtYmVyW10gPSBbXTtcbiAgcHJpdmF0ZSByZWFkb25seSBfYm9yZGVyQ2VsbENzczogUmVhZG9ubHk8e1tkIGluIFN0aWNreURpcmVjdGlvbl06IHN0cmluZ30+O1xuXG4gIC8qKlxuICAgKiBAcGFyYW0gX2lzTmF0aXZlSHRtbFRhYmxlIFdoZXRoZXIgdGhlIHN0aWNreSBsb2dpYyBzaG91bGQgYmUgYmFzZWQgb24gYSB0YWJsZVxuICAgKiAgICAgdGhhdCB1c2VzIHRoZSBuYXRpdmUgYDx0YWJsZT5gIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBfc3RpY2tDZWxsQ3NzIFRoZSBDU1MgY2xhc3MgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gZXZlcnkgcm93L2NlbGwgdGhhdCBoYXNcbiAgICogICAgIHN0aWNreSBwb3NpdGlvbmluZyBhcHBsaWVkLlxuICAgKiBAcGFyYW0gZGlyZWN0aW9uIFRoZSBkaXJlY3Rpb25hbGl0eSBjb250ZXh0IG9mIHRoZSB0YWJsZSAobHRyL3J0bCk7IGFmZmVjdHMgY29sdW1uIHBvc2l0aW9uaW5nXG4gICAqICAgICBieSByZXZlcnNpbmcgbGVmdC9yaWdodCBwb3NpdGlvbnMuXG4gICAqIEBwYXJhbSBfaXNCcm93c2VyIFdoZXRoZXIgdGhlIHRhYmxlIGlzIGN1cnJlbnRseSBiZWluZyByZW5kZXJlZCBvbiB0aGUgc2VydmVyIG9yIHRoZSBjbGllbnQuXG4gICAqIEBwYXJhbSBfbmVlZHNQb3NpdGlvblN0aWNreU9uRWxlbWVudCBXaGV0aGVyIHdlIG5lZWQgdG8gc3BlY2lmeSBwb3NpdGlvbjogc3RpY2t5IG9uIGNlbGxzXG4gICAqICAgICB1c2luZyBpbmxpbmUgc3R5bGVzLiBJZiBmYWxzZSwgaXQgaXMgYXNzdW1lZCB0aGF0IHBvc2l0aW9uOiBzdGlja3kgaXMgaW5jbHVkZWQgaW5cbiAgICogICAgIHRoZSBjb21wb25lbnQgc3R5bGVzaGVldCBmb3IgX3N0aWNrQ2VsbENzcy5cbiAgICogQHBhcmFtIF9wb3NpdGlvbkxpc3RlbmVyIEEgbGlzdGVuZXIgdGhhdCBpcyBub3RpZmllZCBvZiBjaGFuZ2VzIHRvIHN0aWNreSByb3dzL2NvbHVtbnNcbiAgICogICAgIGFuZCB0aGVpciBkaW1lbnNpb25zLlxuICAgKi9cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfaXNOYXRpdmVIdG1sVGFibGU6IGJvb2xlYW4sXG4gICAgICAgICAgICAgIHByaXZhdGUgX3N0aWNrQ2VsbENzczogc3RyaW5nLFxuICAgICAgICAgICAgICBwdWJsaWMgZGlyZWN0aW9uOiBEaXJlY3Rpb24sXG4gICAgICAgICAgICAgIHByaXZhdGUgX2NvYWxlc2NlZFN0eWxlU2NoZWR1bGVyOiBfQ29hbGVzY2VkU3R5bGVTY2hlZHVsZXIsXG4gICAgICAgICAgICAgIHByaXZhdGUgX2lzQnJvd3NlciA9IHRydWUsXG4gICAgICAgICAgICAgIHByaXZhdGUgcmVhZG9ubHkgX25lZWRzUG9zaXRpb25TdGlja3lPbkVsZW1lbnQgPSB0cnVlLFxuICAgICAgICAgICAgICBwcml2YXRlIHJlYWRvbmx5IF9wb3NpdGlvbkxpc3RlbmVyPzogU3RpY2t5UG9zaXRpb25pbmdMaXN0ZW5lcikge1xuICAgIHRoaXMuX2JvcmRlckNlbGxDc3MgPSB7XG4gICAgICAndG9wJzogYCR7X3N0aWNrQ2VsbENzc30tYm9yZGVyLWVsZW0tdG9wYCxcbiAgICAgICdib3R0b20nOiBgJHtfc3RpY2tDZWxsQ3NzfS1ib3JkZXItZWxlbS1ib3R0b21gLFxuICAgICAgJ2xlZnQnOiBgJHtfc3RpY2tDZWxsQ3NzfS1ib3JkZXItZWxlbS1sZWZ0YCxcbiAgICAgICdyaWdodCc6IGAke19zdGlja0NlbGxDc3N9LWJvcmRlci1lbGVtLXJpZ2h0YCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFycyB0aGUgc3RpY2t5IHBvc2l0aW9uaW5nIHN0eWxlcyBmcm9tIHRoZSByb3cgYW5kIGl0cyBjZWxscyBieSByZXNldHRpbmcgdGhlIGBwb3NpdGlvbmBcbiAgICogc3R5bGUsIHNldHRpbmcgdGhlIHpJbmRleCB0byAwLCBhbmQgdW5zZXR0aW5nIGVhY2ggcHJvdmlkZWQgc3RpY2t5IGRpcmVjdGlvbi5cbiAgICogQHBhcmFtIHJvd3MgVGhlIGxpc3Qgb2Ygcm93cyB0aGF0IHNob3VsZCBiZSBjbGVhcmVkIGZyb20gc3RpY2tpbmcgaW4gdGhlIHByb3ZpZGVkIGRpcmVjdGlvbnNcbiAgICogQHBhcmFtIHN0aWNreURpcmVjdGlvbnMgVGhlIGRpcmVjdGlvbnMgdGhhdCBzaG91bGQgbm8gbG9uZ2VyIGJlIHNldCBhcyBzdGlja3kgb24gdGhlIHJvd3MuXG4gICAqL1xuICBjbGVhclN0aWNreVBvc2l0aW9uaW5nKHJvd3M6IEhUTUxFbGVtZW50W10sIHN0aWNreURpcmVjdGlvbnM6IFN0aWNreURpcmVjdGlvbltdKSB7XG4gICAgY29uc3QgZWxlbWVudHNUb0NsZWFyOiBIVE1MRWxlbWVudFtdID0gW107XG4gICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgLy8gSWYgdGhlIHJvdyBpc24ndCBhbiBlbGVtZW50IChlLmcuIGlmIGl0J3MgYW4gYG5nLWNvbnRhaW5lcmApLFxuICAgICAgLy8gaXQgd29uJ3QgaGF2ZSBpbmxpbmUgc3R5bGVzIG9yIGBjaGlsZHJlbmAgc28gd2Ugc2tpcCBpdC5cbiAgICAgIGlmIChyb3cubm9kZVR5cGUgIT09IHJvdy5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGVsZW1lbnRzVG9DbGVhci5wdXNoKHJvdyk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJvdy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBlbGVtZW50c1RvQ2xlYXIucHVzaChyb3cuY2hpbGRyZW5baV0gYXMgSFRNTEVsZW1lbnQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENvYWxlc2NlIHdpdGggc3RpY2t5IHJvdy9jb2x1bW4gdXBkYXRlcyAoYW5kIHBvdGVudGlhbGx5IG90aGVyIGNoYW5nZXMgbGlrZSBjb2x1bW4gcmVzaXplKS5cbiAgICB0aGlzLl9jb2FsZXNjZWRTdHlsZVNjaGVkdWxlci5zY2hlZHVsZSgoKSA9PiB7XG4gICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgZWxlbWVudHNUb0NsZWFyKSB7XG4gICAgICAgIHRoaXMuX3JlbW92ZVN0aWNreVN0eWxlKGVsZW1lbnQsIHN0aWNreURpcmVjdGlvbnMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgc3RpY2t5IGxlZnQgYW5kIHJpZ2h0IHBvc2l0aW9ucyB0byB0aGUgY2VsbHMgb2YgZWFjaCByb3cgYWNjb3JkaW5nIHRvIHRoZSBzdGlja3lcbiAgICogc3RhdGVzIG9mIHRoZSByZW5kZXJlZCBjb2x1bW4gZGVmaW5pdGlvbnMuXG4gICAqIEBwYXJhbSByb3dzIFRoZSByb3dzIHRoYXQgc2hvdWxkIGhhdmUgaXRzIHNldCBvZiBjZWxscyBzdHVjayBhY2NvcmRpbmcgdG8gdGhlIHN0aWNreSBzdGF0ZXMuXG4gICAqIEBwYXJhbSBzdGlja3lTdGFydFN0YXRlcyBBIGxpc3Qgb2YgYm9vbGVhbiBzdGF0ZXMgd2hlcmUgZWFjaCBzdGF0ZSByZXByZXNlbnRzIHdoZXRoZXIgdGhlIGNlbGxcbiAgICogICAgIGluIHRoaXMgaW5kZXggcG9zaXRpb24gc2hvdWxkIGJlIHN0dWNrIHRvIHRoZSBzdGFydCBvZiB0aGUgcm93LlxuICAgKiBAcGFyYW0gc3RpY2t5RW5kU3RhdGVzIEEgbGlzdCBvZiBib29sZWFuIHN0YXRlcyB3aGVyZSBlYWNoIHN0YXRlIHJlcHJlc2VudHMgd2hldGhlciB0aGUgY2VsbFxuICAgKiAgICAgaW4gdGhpcyBpbmRleCBwb3NpdGlvbiBzaG91bGQgYmUgc3R1Y2sgdG8gdGhlIGVuZCBvZiB0aGUgcm93LlxuICAgKiBAcGFyYW0gcmVjYWxjdWxhdGVDZWxsV2lkdGhzIFdoZXRoZXIgdGhlIHN0aWNreSBzdHlsZXIgc2hvdWxkIHJlY2FsY3VsYXRlIHRoZSB3aWR0aCBvZiBlYWNoXG4gICAqICAgICBjb2x1bW4gY2VsbC4gSWYgYGZhbHNlYCBjYWNoZWQgd2lkdGhzIHdpbGwgYmUgdXNlZCBpbnN0ZWFkLlxuICAgKi9cbiAgdXBkYXRlU3RpY2t5Q29sdW1ucyhcbiAgICAgIHJvd3M6IEhUTUxFbGVtZW50W10sIHN0aWNreVN0YXJ0U3RhdGVzOiBib29sZWFuW10sIHN0aWNreUVuZFN0YXRlczogYm9vbGVhbltdLFxuICAgICAgcmVjYWxjdWxhdGVDZWxsV2lkdGhzID0gdHJ1ZSkge1xuICAgIGlmICghcm93cy5sZW5ndGggfHwgIXRoaXMuX2lzQnJvd3NlciB8fCAhKHN0aWNreVN0YXJ0U3RhdGVzLnNvbWUoc3RhdGUgPT4gc3RhdGUpIHx8XG4gICAgICAgIHN0aWNreUVuZFN0YXRlcy5zb21lKHN0YXRlID0+IHN0YXRlKSkpIHtcbiAgICAgIGlmICh0aGlzLl9wb3NpdGlvbkxpc3RlbmVyKSB7XG4gICAgICAgIHRoaXMuX3Bvc2l0aW9uTGlzdGVuZXIuc3RpY2t5Q29sdW1uc1VwZGF0ZWQoe3NpemVzOiBbXX0pO1xuICAgICAgICB0aGlzLl9wb3NpdGlvbkxpc3RlbmVyLnN0aWNreUVuZENvbHVtbnNVcGRhdGVkKHtzaXplczogW119KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGZpcnN0Um93ID0gcm93c1swXTtcbiAgICBjb25zdCBudW1DZWxscyA9IGZpcnN0Um93LmNoaWxkcmVuLmxlbmd0aDtcbiAgICBjb25zdCBjZWxsV2lkdGhzOiBudW1iZXJbXSA9IHRoaXMuX2dldENlbGxXaWR0aHMoZmlyc3RSb3csIHJlY2FsY3VsYXRlQ2VsbFdpZHRocyk7XG5cbiAgICBjb25zdCBzdGFydFBvc2l0aW9ucyA9IHRoaXMuX2dldFN0aWNreVN0YXJ0Q29sdW1uUG9zaXRpb25zKGNlbGxXaWR0aHMsIHN0aWNreVN0YXJ0U3RhdGVzKTtcbiAgICBjb25zdCBlbmRQb3NpdGlvbnMgPSB0aGlzLl9nZXRTdGlja3lFbmRDb2x1bW5Qb3NpdGlvbnMoY2VsbFdpZHRocywgc3RpY2t5RW5kU3RhdGVzKTtcblxuICAgIGNvbnN0IGxhc3RTdGlja3lTdGFydCA9IHN0aWNreVN0YXJ0U3RhdGVzLmxhc3RJbmRleE9mKHRydWUpO1xuICAgIGNvbnN0IGZpcnN0U3RpY2t5RW5kID0gc3RpY2t5RW5kU3RhdGVzLmluZGV4T2YodHJ1ZSk7XG5cbiAgICAvLyBDb2FsZXNjZSB3aXRoIHN0aWNreSByb3cgdXBkYXRlcyAoYW5kIHBvdGVudGlhbGx5IG90aGVyIGNoYW5nZXMgbGlrZSBjb2x1bW4gcmVzaXplKS5cbiAgICB0aGlzLl9jb2FsZXNjZWRTdHlsZVNjaGVkdWxlci5zY2hlZHVsZSgoKSA9PiB7XG4gICAgICBjb25zdCBpc1J0bCA9IHRoaXMuZGlyZWN0aW9uID09PSAncnRsJztcbiAgICAgIGNvbnN0IHN0YXJ0ID0gaXNSdGwgPyAncmlnaHQnIDogJ2xlZnQnO1xuICAgICAgY29uc3QgZW5kID0gaXNSdGwgPyAnbGVmdCcgOiAncmlnaHQnO1xuXG4gICAgICBmb3IgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtQ2VsbHM7IGkrKykge1xuICAgICAgICAgIGNvbnN0IGNlbGwgPSByb3cuY2hpbGRyZW5baV0gYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgICAgaWYgKHN0aWNreVN0YXJ0U3RhdGVzW2ldKSB7XG4gICAgICAgICAgICB0aGlzLl9hZGRTdGlja3lTdHlsZShjZWxsLCBzdGFydCwgc3RhcnRQb3NpdGlvbnNbaV0sIGkgPT09IGxhc3RTdGlja3lTdGFydCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHN0aWNreUVuZFN0YXRlc1tpXSkge1xuICAgICAgICAgICAgdGhpcy5fYWRkU3RpY2t5U3R5bGUoY2VsbCwgZW5kLCBlbmRQb3NpdGlvbnNbaV0sIGkgPT09IGZpcnN0U3RpY2t5RW5kKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuX3Bvc2l0aW9uTGlzdGVuZXIpIHtcbiAgICAgICAgdGhpcy5fcG9zaXRpb25MaXN0ZW5lci5zdGlja3lDb2x1bW5zVXBkYXRlZCh7XG4gICAgICAgICAgc2l6ZXM6IGxhc3RTdGlja3lTdGFydCA9PT0gLTEgP1xuICAgICAgICAgICAgW10gOlxuICAgICAgICAgICAgY2VsbFdpZHRoc1xuICAgICAgICAgICAgICAgIC5zbGljZSgwLCBsYXN0U3RpY2t5U3RhcnQgKyAxKVxuICAgICAgICAgICAgICAgIC5tYXAoKHdpZHRoLCBpbmRleCkgPT4gc3RpY2t5U3RhcnRTdGF0ZXNbaW5kZXhdID8gd2lkdGggOiBudWxsKVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fcG9zaXRpb25MaXN0ZW5lci5zdGlja3lFbmRDb2x1bW5zVXBkYXRlZCh7XG4gICAgICAgICAgc2l6ZXM6IGZpcnN0U3RpY2t5RW5kID09PSAtMSA/XG4gICAgICAgICAgICBbXSA6XG4gICAgICAgICAgICBjZWxsV2lkdGhzXG4gICAgICAgICAgICAgICAgLnNsaWNlKGZpcnN0U3RpY2t5RW5kKVxuICAgICAgICAgICAgICAgIC5tYXAoKHdpZHRoLCBpbmRleCkgPT4gc3RpY2t5RW5kU3RhdGVzW2luZGV4ICsgZmlyc3RTdGlja3lFbmRdID8gd2lkdGggOiBudWxsKVxuICAgICAgICAgICAgICAgIC5yZXZlcnNlKClcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyBzdGlja3kgcG9zaXRpb25pbmcgdG8gdGhlIHJvdydzIGNlbGxzIGlmIHVzaW5nIHRoZSBuYXRpdmUgdGFibGUgbGF5b3V0LCBhbmQgdG8gdGhlXG4gICAqIHJvdyBpdHNlbGYgb3RoZXJ3aXNlLlxuICAgKiBAcGFyYW0gcm93c1RvU3RpY2sgVGhlIGxpc3Qgb2Ygcm93cyB0aGF0IHNob3VsZCBiZSBzdHVjayBhY2NvcmRpbmcgdG8gdGhlaXIgY29ycmVzcG9uZGluZ1xuICAgKiAgICAgc3RpY2t5IHN0YXRlIGFuZCB0byB0aGUgcHJvdmlkZWQgdG9wIG9yIGJvdHRvbSBwb3NpdGlvbi5cbiAgICogQHBhcmFtIHN0aWNreVN0YXRlcyBBIGxpc3Qgb2YgYm9vbGVhbiBzdGF0ZXMgd2hlcmUgZWFjaCBzdGF0ZSByZXByZXNlbnRzIHdoZXRoZXIgdGhlIHJvd1xuICAgKiAgICAgc2hvdWxkIGJlIHN0dWNrIGluIHRoZSBwYXJ0aWN1bGFyIHRvcCBvciBib3R0b20gcG9zaXRpb24uXG4gICAqIEBwYXJhbSBwb3NpdGlvbiBUaGUgcG9zaXRpb24gZGlyZWN0aW9uIGluIHdoaWNoIHRoZSByb3cgc2hvdWxkIGJlIHN0dWNrIGlmIHRoYXQgcm93IHNob3VsZCBiZVxuICAgKiAgICAgc3RpY2t5LlxuICAgKlxuICAgKi9cbiAgc3RpY2tSb3dzKHJvd3NUb1N0aWNrOiBIVE1MRWxlbWVudFtdLCBzdGlja3lTdGF0ZXM6IGJvb2xlYW5bXSwgcG9zaXRpb246ICd0b3AnIHwgJ2JvdHRvbScpIHtcbiAgICAvLyBTaW5jZSB3ZSBjYW4ndCBtZWFzdXJlIHRoZSByb3dzIG9uIHRoZSBzZXJ2ZXIsIHdlIGNhbid0IHN0aWNrIHRoZSByb3dzIHByb3Blcmx5LlxuICAgIGlmICghdGhpcy5faXNCcm93c2VyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSWYgcG9zaXRpb25pbmcgdGhlIHJvd3MgdG8gdGhlIGJvdHRvbSwgcmV2ZXJzZSB0aGVpciBvcmRlciB3aGVuIGV2YWx1YXRpbmcgdGhlIHN0aWNreVxuICAgIC8vIHBvc2l0aW9uIHN1Y2ggdGhhdCB0aGUgbGFzdCByb3cgc3R1Y2sgd2lsbCBiZSBcImJvdHRvbTogMHB4XCIgYW5kIHNvIG9uLiBOb3RlIHRoYXQgdGhlXG4gICAgLy8gc3RpY2t5IHN0YXRlcyBuZWVkIHRvIGJlIHJldmVyc2VkIGFzIHdlbGwuXG4gICAgY29uc3Qgcm93cyA9IHBvc2l0aW9uID09PSAnYm90dG9tJyA/IHJvd3NUb1N0aWNrLnNsaWNlKCkucmV2ZXJzZSgpIDogcm93c1RvU3RpY2s7XG4gICAgY29uc3Qgc3RhdGVzID0gcG9zaXRpb24gPT09ICdib3R0b20nID8gc3RpY2t5U3RhdGVzLnNsaWNlKCkucmV2ZXJzZSgpIDogc3RpY2t5U3RhdGVzO1xuXG4gICAgLy8gTWVhc3VyZSByb3cgaGVpZ2h0cyBhbGwgYXQgb25jZSBiZWZvcmUgYWRkaW5nIHN0aWNreSBzdHlsZXMgdG8gcmVkdWNlIGxheW91dCB0aHJhc2hpbmcuXG4gICAgY29uc3Qgc3RpY2t5T2Zmc2V0czogbnVtYmVyW10gPSBbXTtcbiAgICBjb25zdCBzdGlja3lDZWxsSGVpZ2h0czogKG51bWJlcnx1bmRlZmluZWQpW10gPSBbXTtcbiAgICBjb25zdCBlbGVtZW50c1RvU3RpY2s6IEhUTUxFbGVtZW50W11bXSA9IFtdO1xuICAgIGZvciAobGV0IHJvd0luZGV4ID0gMCwgc3RpY2t5T2Zmc2V0ID0gMDsgcm93SW5kZXggPCByb3dzLmxlbmd0aDsgcm93SW5kZXgrKykge1xuICAgICAgaWYgKCFzdGF0ZXNbcm93SW5kZXhdKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBzdGlja3lPZmZzZXRzW3Jvd0luZGV4XSA9IHN0aWNreU9mZnNldDtcbiAgICAgIGNvbnN0IHJvdyA9IHJvd3Nbcm93SW5kZXhdO1xuICAgICAgZWxlbWVudHNUb1N0aWNrW3Jvd0luZGV4XSA9IHRoaXMuX2lzTmF0aXZlSHRtbFRhYmxlID9cbiAgICAgICAgICBBcnJheS5mcm9tKHJvdy5jaGlsZHJlbikgYXMgSFRNTEVsZW1lbnRbXSA6IFtyb3ddO1xuXG4gICAgICBjb25zdCBoZWlnaHQgPSByb3cuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0O1xuICAgICAgc3RpY2t5T2Zmc2V0ICs9IGhlaWdodDtcbiAgICAgIHN0aWNreUNlbGxIZWlnaHRzW3Jvd0luZGV4XSA9IGhlaWdodDtcbiAgICB9XG5cbiAgICBjb25zdCBib3JkZXJlZFJvd0luZGV4ID0gc3RhdGVzLmxhc3RJbmRleE9mKHRydWUpO1xuXG4gICAgLy8gQ29hbGVzY2Ugd2l0aCBvdGhlciBzdGlja3kgcm93IHVwZGF0ZXMgKHRvcC9ib3R0b20pLCBzdGlja3kgY29sdW1ucyB1cGRhdGVzXG4gICAgLy8gKGFuZCBwb3RlbnRpYWxseSBvdGhlciBjaGFuZ2VzIGxpa2UgY29sdW1uIHJlc2l6ZSkuXG4gICAgdGhpcy5fY29hbGVzY2VkU3R5bGVTY2hlZHVsZXIuc2NoZWR1bGUoKCkgPT4ge1xuICAgICAgZm9yIChsZXQgcm93SW5kZXggPSAwOyByb3dJbmRleCA8IHJvd3MubGVuZ3RoOyByb3dJbmRleCsrKSB7XG4gICAgICAgIGlmICghc3RhdGVzW3Jvd0luZGV4XSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gc3RpY2t5T2Zmc2V0c1tyb3dJbmRleF07XG4gICAgICAgIGNvbnN0IGlzQm9yZGVyZWRSb3dJbmRleCA9IHJvd0luZGV4ID09PSBib3JkZXJlZFJvd0luZGV4O1xuICAgICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgZWxlbWVudHNUb1N0aWNrW3Jvd0luZGV4XSkge1xuICAgICAgICAgIHRoaXMuX2FkZFN0aWNreVN0eWxlKGVsZW1lbnQsIHBvc2l0aW9uLCBvZmZzZXQsIGlzQm9yZGVyZWRSb3dJbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHBvc2l0aW9uID09PSAndG9wJykge1xuICAgICAgICB0aGlzLl9wb3NpdGlvbkxpc3RlbmVyPy5zdGlja3lIZWFkZXJSb3dzVXBkYXRlZChcbiAgICAgICAgICAgIHtzaXplczogc3RpY2t5Q2VsbEhlaWdodHMsIG9mZnNldHM6IHN0aWNreU9mZnNldHMsIGVsZW1lbnRzOiBlbGVtZW50c1RvU3RpY2t9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3Bvc2l0aW9uTGlzdGVuZXI/LnN0aWNreUZvb3RlclJvd3NVcGRhdGVkKFxuICAgICAgICAgICAge3NpemVzOiBzdGlja3lDZWxsSGVpZ2h0cywgb2Zmc2V0czogc3RpY2t5T2Zmc2V0cywgZWxlbWVudHM6IGVsZW1lbnRzVG9TdGlja30pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZW4gdXNpbmcgdGhlIG5hdGl2ZSB0YWJsZSBpbiBTYWZhcmksIHN0aWNreSBmb290ZXIgY2VsbHMgZG8gbm90IHN0aWNrLiBUaGUgb25seSB3YXkgdG8gc3RpY2tcbiAgICogZm9vdGVyIHJvd3MgaXMgdG8gYXBwbHkgc3RpY2t5IHN0eWxpbmcgdG8gdGhlIHRmb290IGNvbnRhaW5lci4gVGhpcyBzaG91bGQgb25seSBiZSBkb25lIGlmXG4gICAqIGFsbCBmb290ZXIgcm93cyBhcmUgc3RpY2t5LiBJZiBub3QgYWxsIGZvb3RlciByb3dzIGFyZSBzdGlja3ksIHJlbW92ZSBzdGlja3kgcG9zaXRpb25pbmcgZnJvbVxuICAgKiB0aGUgdGZvb3QgZWxlbWVudC5cbiAgICovXG4gIHVwZGF0ZVN0aWNreUZvb3RlckNvbnRhaW5lcih0YWJsZUVsZW1lbnQ6IEVsZW1lbnQsIHN0aWNreVN0YXRlczogYm9vbGVhbltdKSB7XG4gICAgaWYgKCF0aGlzLl9pc05hdGl2ZUh0bWxUYWJsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRmb290ID0gdGFibGVFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ3Rmb290JykhO1xuXG4gICAgLy8gQ29hbGVzY2Ugd2l0aCBvdGhlciBzdGlja3kgdXBkYXRlcyAoYW5kIHBvdGVudGlhbGx5IG90aGVyIGNoYW5nZXMgbGlrZSBjb2x1bW4gcmVzaXplKS5cbiAgICB0aGlzLl9jb2FsZXNjZWRTdHlsZVNjaGVkdWxlci5zY2hlZHVsZSgoKSA9PiB7XG4gICAgICBpZiAoc3RpY2t5U3RhdGVzLnNvbWUoc3RhdGUgPT4gIXN0YXRlKSkge1xuICAgICAgICB0aGlzLl9yZW1vdmVTdGlja3lTdHlsZSh0Zm9vdCwgWydib3R0b20nXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9hZGRTdGlja3lTdHlsZSh0Zm9vdCwgJ2JvdHRvbScsIDAsIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIHRoZSBzdGlja3kgc3R5bGUgb24gdGhlIGVsZW1lbnQgYnkgcmVtb3ZpbmcgdGhlIHN0aWNreSBjZWxsIENTUyBjbGFzcywgcmUtZXZhbHVhdGluZ1xuICAgKiB0aGUgekluZGV4LCByZW1vdmluZyBlYWNoIG9mIHRoZSBwcm92aWRlZCBzdGlja3kgZGlyZWN0aW9ucywgYW5kIHJlbW92aW5nIHRoZVxuICAgKiBzdGlja3kgcG9zaXRpb24gaWYgdGhlcmUgYXJlIG5vIG1vcmUgZGlyZWN0aW9ucy5cbiAgICovXG4gIF9yZW1vdmVTdGlja3lTdHlsZShlbGVtZW50OiBIVE1MRWxlbWVudCwgc3RpY2t5RGlyZWN0aW9uczogU3RpY2t5RGlyZWN0aW9uW10pIHtcbiAgICBmb3IgKGNvbnN0IGRpciBvZiBzdGlja3lEaXJlY3Rpb25zKSB7XG4gICAgICBlbGVtZW50LnN0eWxlW2Rpcl0gPSAnJztcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSh0aGlzLl9ib3JkZXJDZWxsQ3NzW2Rpcl0pO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBlbGVtZW50IG5vIGxvbmdlciBoYXMgYW55IG1vcmUgc3RpY2t5IGRpcmVjdGlvbnMsIHJlbW92ZSBzdGlja3kgcG9zaXRpb25pbmcgYW5kXG4gICAgLy8gdGhlIHN0aWNreSBDU1MgY2xhc3MuXG4gICAgLy8gU2hvcnQtY2lyY3VpdCBjaGVja2luZyBlbGVtZW50LnN0eWxlW2Rpcl0gZm9yIHN0aWNreURpcmVjdGlvbnMgYXMgdGhleVxuICAgIC8vIHdlcmUgYWxyZWFkeSByZW1vdmVkIGFib3ZlLlxuICAgIGNvbnN0IGhhc0RpcmVjdGlvbiA9IFNUSUNLWV9ESVJFQ1RJT05TLnNvbWUoZGlyID0+XG4gICAgICAgIHN0aWNreURpcmVjdGlvbnMuaW5kZXhPZihkaXIpID09PSAtMSAmJiBlbGVtZW50LnN0eWxlW2Rpcl0pO1xuICAgIGlmIChoYXNEaXJlY3Rpb24pIHtcbiAgICAgIGVsZW1lbnQuc3R5bGUuekluZGV4ID0gdGhpcy5fZ2V0Q2FsY3VsYXRlZFpJbmRleChlbGVtZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gV2hlbiBub3QgaGFzRGlyZWN0aW9uLCBfZ2V0Q2FsY3VsYXRlZFpJbmRleCB3aWxsIGFsd2F5cyByZXR1cm4gJycuXG4gICAgICBlbGVtZW50LnN0eWxlLnpJbmRleCA9ICcnO1xuICAgICAgaWYgKHRoaXMuX25lZWRzUG9zaXRpb25TdGlja3lPbkVsZW1lbnQpIHtcbiAgICAgICAgZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICcnO1xuICAgICAgfVxuICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKHRoaXMuX3N0aWNrQ2VsbENzcyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGhlIHN0aWNreSBzdHlsaW5nIHRvIHRoZSBlbGVtZW50IGJ5IGFkZGluZyB0aGUgc3RpY2t5IHN0eWxlIGNsYXNzLCBjaGFuZ2luZyBwb3NpdGlvblxuICAgKiB0byBiZSBzdGlja3kgKGFuZCAtd2Via2l0LXN0aWNreSksIHNldHRpbmcgdGhlIGFwcHJvcHJpYXRlIHpJbmRleCwgYW5kIGFkZGluZyBhIHN0aWNreVxuICAgKiBkaXJlY3Rpb24gYW5kIHZhbHVlLlxuICAgKi9cbiAgX2FkZFN0aWNreVN0eWxlKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBkaXI6IFN0aWNreURpcmVjdGlvbiwgZGlyVmFsdWU6IG51bWJlcixcbiAgICAgIGlzQm9yZGVyRWxlbWVudDogYm9vbGVhbikge1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCh0aGlzLl9zdGlja0NlbGxDc3MpO1xuICAgIGlmIChpc0JvcmRlckVsZW1lbnQpIHtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCh0aGlzLl9ib3JkZXJDZWxsQ3NzW2Rpcl0pO1xuICAgIH1cbiAgICBlbGVtZW50LnN0eWxlW2Rpcl0gPSBgJHtkaXJWYWx1ZX1weGA7XG4gICAgZWxlbWVudC5zdHlsZS56SW5kZXggPSB0aGlzLl9nZXRDYWxjdWxhdGVkWkluZGV4KGVsZW1lbnQpO1xuICAgIGlmICh0aGlzLl9uZWVkc1Bvc2l0aW9uU3RpY2t5T25FbGVtZW50KSB7XG4gICAgICBlbGVtZW50LnN0eWxlLmNzc1RleHQgKz0gJ3Bvc2l0aW9uOiAtd2Via2l0LXN0aWNreTsgcG9zaXRpb246IHN0aWNreTsgJztcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlIHdoYXQgdGhlIHotaW5kZXggc2hvdWxkIGJlIGZvciB0aGUgZWxlbWVudCwgZGVwZW5kaW5nIG9uIHdoYXQgZGlyZWN0aW9ucyAodG9wLFxuICAgKiBib3R0b20sIGxlZnQsIHJpZ2h0KSBoYXZlIGJlZW4gc2V0LiBJdCBzaG91bGQgYmUgdHJ1ZSB0aGF0IGVsZW1lbnRzIHdpdGggYSB0b3AgZGlyZWN0aW9uXG4gICAqIHNob3VsZCBoYXZlIHRoZSBoaWdoZXN0IGluZGV4IHNpbmNlIHRoZXNlIGFyZSBlbGVtZW50cyBsaWtlIGEgdGFibGUgaGVhZGVyLiBJZiBhbnkgb2YgdGhvc2VcbiAgICogZWxlbWVudHMgYXJlIGFsc28gc3RpY2t5IGluIGFub3RoZXIgZGlyZWN0aW9uLCB0aGVuIHRoZXkgc2hvdWxkIGFwcGVhciBhYm92ZSBvdGhlciBlbGVtZW50c1xuICAgKiB0aGF0IGFyZSBvbmx5IHN0aWNreSB0b3AgKGUuZy4gYSBzdGlja3kgY29sdW1uIG9uIGEgc3RpY2t5IGhlYWRlcikuIEJvdHRvbS1zdGlja3kgZWxlbWVudHNcbiAgICogKGUuZy4gZm9vdGVyIHJvd3MpIHNob3VsZCB0aGVuIGJlIG5leHQgaW4gdGhlIG9yZGVyaW5nIHN1Y2ggdGhhdCB0aGV5IGFyZSBiZWxvdyB0aGUgaGVhZGVyXG4gICAqIGJ1dCBhYm92ZSBhbnkgbm9uLXN0aWNreSBlbGVtZW50cy4gRmluYWxseSwgbGVmdC9yaWdodCBzdGlja3kgZWxlbWVudHMgKGUuZy4gc3RpY2t5IGNvbHVtbnMpXG4gICAqIHNob3VsZCBtaW5pbWFsbHkgaW5jcmVtZW50IHNvIHRoYXQgdGhleSBhcmUgYWJvdmUgbm9uLXN0aWNreSBlbGVtZW50cyBidXQgYmVsb3cgdG9wIGFuZCBib3R0b21cbiAgICogZWxlbWVudHMuXG4gICAqL1xuICBfZ2V0Q2FsY3VsYXRlZFpJbmRleChlbGVtZW50OiBIVE1MRWxlbWVudCk6IHN0cmluZyB7XG4gICAgY29uc3QgekluZGV4SW5jcmVtZW50cyA9IHtcbiAgICAgIHRvcDogMTAwLFxuICAgICAgYm90dG9tOiAxMCxcbiAgICAgIGxlZnQ6IDEsXG4gICAgICByaWdodDogMSxcbiAgICB9O1xuXG4gICAgbGV0IHpJbmRleCA9IDA7XG4gICAgLy8gVXNlIGBJdGVyYWJsZWAgaW5zdGVhZCBvZiBgQXJyYXlgIGJlY2F1c2UgVHlwZVNjcmlwdCwgYXMgb2YgMy42LjMsXG4gICAgLy8gbG9zZXMgdGhlIGFycmF5IGdlbmVyaWMgdHlwZSBpbiB0aGUgYGZvciBvZmAuIEJ1dCB3ZSAqYWxzbyogaGF2ZSB0byB1c2UgYEFycmF5YCBiZWNhdXNlXG4gICAgLy8gdHlwZXNjcmlwdCB3b24ndCBpdGVyYXRlIG92ZXIgYW4gYEl0ZXJhYmxlYCB1bmxlc3MgeW91IGNvbXBpbGUgd2l0aCBgLS1kb3dubGV2ZWxJdGVyYXRpb25gXG4gICAgZm9yIChjb25zdCBkaXIgb2YgU1RJQ0tZX0RJUkVDVElPTlMgYXMgSXRlcmFibGU8U3RpY2t5RGlyZWN0aW9uPiAmIFN0aWNreURpcmVjdGlvbltdKSB7XG4gICAgICBpZiAoZWxlbWVudC5zdHlsZVtkaXJdKSB7XG4gICAgICAgIHpJbmRleCArPSB6SW5kZXhJbmNyZW1lbnRzW2Rpcl07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHpJbmRleCA/IGAke3pJbmRleH1gIDogJyc7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgd2lkdGhzIGZvciBlYWNoIGNlbGwgaW4gdGhlIHByb3ZpZGVkIHJvdy4gKi9cbiAgX2dldENlbGxXaWR0aHMocm93OiBIVE1MRWxlbWVudCwgcmVjYWxjdWxhdGVDZWxsV2lkdGhzID0gdHJ1ZSk6IG51bWJlcltdIHtcbiAgICBpZiAoIXJlY2FsY3VsYXRlQ2VsbFdpZHRocyAmJiB0aGlzLl9jYWNoZWRDZWxsV2lkdGhzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2NhY2hlZENlbGxXaWR0aHM7XG4gICAgfVxuXG4gICAgY29uc3QgY2VsbFdpZHRoczogbnVtYmVyW10gPSBbXTtcbiAgICBjb25zdCBmaXJzdFJvd0NlbGxzID0gcm93LmNoaWxkcmVuO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmlyc3RSb3dDZWxscy5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IGNlbGw6IEhUTUxFbGVtZW50ID0gZmlyc3RSb3dDZWxsc1tpXSBhcyBIVE1MRWxlbWVudDtcbiAgICAgIGNlbGxXaWR0aHMucHVzaChjZWxsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9jYWNoZWRDZWxsV2lkdGhzID0gY2VsbFdpZHRocztcbiAgICByZXR1cm4gY2VsbFdpZHRocztcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIHRoZSBsZWZ0IGFuZCByaWdodCBwb3NpdGlvbnMgb2YgZWFjaCBzdGlja3kgY29sdW1uIGNlbGwsIHdoaWNoIHdpbGwgYmUgdGhlXG4gICAqIGFjY3VtdWxhdGlvbiBvZiBhbGwgc3RpY2t5IGNvbHVtbiBjZWxsIHdpZHRocyB0byB0aGUgbGVmdCBhbmQgcmlnaHQsIHJlc3BlY3RpdmVseS5cbiAgICogTm9uLXN0aWNreSBjZWxscyBkbyBub3QgbmVlZCB0byBoYXZlIGEgdmFsdWUgc2V0IHNpbmNlIHRoZWlyIHBvc2l0aW9ucyB3aWxsIG5vdCBiZSBhcHBsaWVkLlxuICAgKi9cbiAgX2dldFN0aWNreVN0YXJ0Q29sdW1uUG9zaXRpb25zKHdpZHRoczogbnVtYmVyW10sIHN0aWNreVN0YXRlczogYm9vbGVhbltdKTogbnVtYmVyW10ge1xuICAgIGNvbnN0IHBvc2l0aW9uczogbnVtYmVyW10gPSBbXTtcbiAgICBsZXQgbmV4dFBvc2l0aW9uID0gMDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgd2lkdGhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoc3RpY2t5U3RhdGVzW2ldKSB7XG4gICAgICAgIHBvc2l0aW9uc1tpXSA9IG5leHRQb3NpdGlvbjtcbiAgICAgICAgbmV4dFBvc2l0aW9uICs9IHdpZHRoc1tpXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcG9zaXRpb25zO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgdGhlIGxlZnQgYW5kIHJpZ2h0IHBvc2l0aW9ucyBvZiBlYWNoIHN0aWNreSBjb2x1bW4gY2VsbCwgd2hpY2ggd2lsbCBiZSB0aGVcbiAgICogYWNjdW11bGF0aW9uIG9mIGFsbCBzdGlja3kgY29sdW1uIGNlbGwgd2lkdGhzIHRvIHRoZSBsZWZ0IGFuZCByaWdodCwgcmVzcGVjdGl2ZWx5LlxuICAgKiBOb24tc3RpY2t5IGNlbGxzIGRvIG5vdCBuZWVkIHRvIGhhdmUgYSB2YWx1ZSBzZXQgc2luY2UgdGhlaXIgcG9zaXRpb25zIHdpbGwgbm90IGJlIGFwcGxpZWQuXG4gICAqL1xuICBfZ2V0U3RpY2t5RW5kQ29sdW1uUG9zaXRpb25zKHdpZHRoczogbnVtYmVyW10sIHN0aWNreVN0YXRlczogYm9vbGVhbltdKTogbnVtYmVyW10ge1xuICAgIGNvbnN0IHBvc2l0aW9uczogbnVtYmVyW10gPSBbXTtcbiAgICBsZXQgbmV4dFBvc2l0aW9uID0gMDtcblxuICAgIGZvciAobGV0IGkgPSB3aWR0aHMubGVuZ3RoOyBpID4gMDsgaS0tKSB7XG4gICAgICBpZiAoc3RpY2t5U3RhdGVzW2ldKSB7XG4gICAgICAgIHBvc2l0aW9uc1tpXSA9IG5leHRQb3NpdGlvbjtcbiAgICAgICAgbmV4dFBvc2l0aW9uICs9IHdpZHRoc1tpXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcG9zaXRpb25zO1xuICB9XG59XG4iXX0=